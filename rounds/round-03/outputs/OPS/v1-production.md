# OPS – Chuẩn bị production v1.0 trên cùng VPS + landing ottimo.vn

- Người viết: OPS | Round 3 – Sản xuất | Ngày: 23/10/2026
- Căn cứ: decision-log 23/10 "đường nhanh v1.0" (điều kiện 2 và 4) và "landing lên mạng sớm"; `rounds/round-02/outputs/OPS/staging-readiness.md` mục 7–11; ARC `s1-contracts.md` (`MFA_ENFORCED`, VAPID); SEC `s1-security-requirements.md` 06.33 và mục E; ADR-014 mục 1.4.
- Phạm vi lượt này: **chỉ soạn script/tài liệu và chạy thử trên máy local**. Không đụng VPS, không deploy, không đổi cài đặt GitHub. Việc duy nhất làm trên GitHub là đóng cảnh báo Dependabot #1 theo SEC.
- Repo công khai: tệp này không ghi IP của VPS, không ghi bí mật. Hướng dẫn từng bước cho INV nằm ở `inv-production-steps.md` (cùng thư mục).

## 1. Kết luận

| Điều kiện v1.0 (INV 23/10) | Phía OPS | Còn thiếu |
|---|---|---|
| (2) `MFA_ENFORCED=true` trên production | Mẫu `.env` production đặt sẵn `true`. `deploy.sh` **từ chối** deploy production khi cờ khác `true` (bước `config`, có test). Kiểm thêm ở api: BE-C đã làm (production `false` → api không khởi động) | Nhánh 2FA (`r3-2fa-int`) gộp vào `main` |
| (4) Production tách staging, cùng VPS | Stack riêng: thư mục, project compose, CSDL (volume), bí mật, mạng, sao lưu, timer, khóa CI, environment GitHub, tên miền. Hai stack đứng sau **một edge** (nginx) giữ cổng 80/443 | INV: DNS, environment `production`, khóa CI. OPS: dựng thật khi được giao |
| (4) Sao lưu + một lần diễn tập khôi phục | Sao lưu `age` hằng đêm 03:00 (production), giữ 7 ngày + bản Chủ nhật tới 35 ngày. Mỗi bản có thêm **tệp đếm số** chụp cùng snapshot với bản dump. Diễn tập khôi phục so **khớp từng con số**: số đơn, folio, dòng folio, tổng tiền dòng folio, thanh toán, tổng tiền thanh toán. Đã chạy thử local: **ĐẠT, khớp 100 %** (mục 8.3) | Diễn tập trên bản sao lưu production thật sau lần deploy đầu |
| Landing `ottimo.vn` (song song) | Container landing riêng, phát hành riêng (tag `landing-v*`). Bản xem trước `staging.ottimo.vn` có mật khẩu và `noindex`. Có kịch bản chuyển DNS giữ nguyên email Google | INV: DNS + duyệt bản xem trước |

**RAM 4,8 GB đủ cho 2 stack + landing + edge** khi giảm giới hạn RAM của staging (mục 3). Không cần nâng gói VPS lúc này. Có thêm kiểm `mem` để báo sớm.

## 2. Thiết kế: hai stack trên một VPS

```
Internet ──80/443──► edge (nginx, project ottimo-edge – container DUY NHẤT mở cổng)
                      │  443: đọc SNI (không giải mã TLS) + gửi PROXY protocol (địa chỉ khách thật)
                      │  80 : chuyển theo Host (chuyển sang HTTPS, ACME HTTP-01); host lạ → 404 / đóng kết nối
       ┌──────────────┴───────────────────────────┐
  ottimo-link-production (172.31.2.0/24)     ottimo-link-staging (172.31.1.0/24)
       │                                          │
  production-web   production-landing        staging-web      staging-landing
  (Caddy, TLS)     (Caddy, TLS)              (Caddy, TLS)     (Caddy, basic auth + noindex)
       │ edge/db/egress riêng                     │
  api · worker · postgres  (/opt/ottimo-prod)   api · worker · postgres  (/opt/ottimo)
```

| | Staging (đang chạy) | Production (mới) |
|---|---|---|
| Thư mục | `/opt/ottimo` | `/opt/ottimo-prod` (tệp mốc `.ottimo-home`: script trong thư mục nào chỉ tác động stack đó) |
| Project compose | `ottimo` | `ottimo-prod` – volume `ottimo-prod_pgdata`, `_blobdata`… **CSDL riêng** |
| `.env` | `env.example` | `env.production.example` (`APP_ENV=production`, `MFA_ENFORCED=true`, `EMAIL_PROVIDER` thật) |
| Bí mật | `/opt/ottimo/secrets` | `/opt/ottimo-prod/secrets` – sinh mới bằng `init-secrets.sh`. KEK riêng (INV giữ bản ngoại tuyến) |
| Mạng nội bộ | `172.30.0.0/24` | `172.30.1.0/24` |
| Tên miền | `desk/staff/g.staging.ottimo.vn`, landing xem trước `staging.ottimo.vn` (+ `www.staging`) | `desk/staff/g.ottimo.vn`, landing `ottimo.vn` (+ `www`) |
| Sao lưu | `/var/backups/ottimo`, 03:30, khóa `age` staging | `/var/backups/ottimo-prod`, 03:00, **khóa `age` riêng** |
| Timer | `ottimo-backup`, `ottimo-ops-check` | `ottimo-backup@ottimo-prod`, `ottimo-ops-check@ottimo-prod` (mẫu systemd `@`) |
| Deploy CI | environment `staging`, nhánh `main`, khóa CI staging | environment `production`, **chỉ tag `v*` / `landing-v*`**, người duyệt INV, khóa CI production riêng |

Ghi chú quan trọng:
- **Vì sao cần edge:** hai Caddy không thể cùng mở cổng 443. Edge chỉ đọc tên miền trong gói mở đầu TLS (SNI) rồi chuyển nguyên kết nối. Chứng chỉ, header bảo mật và log che IP vẫn nằm ở Caddy của từng stack, không đổi so với staging. Địa chỉ khách thật đi qua PROXY protocol. Caddy chỉ nhận header này từ **đúng địa chỉ cố định của edge** (`PROXY_PROTOCOL_ALLOW`). Header giả từ nơi khác bị bỏ qua: đã test, mục 10.
- **Tách tới đâu:** khác CSDL, bí mật, volume, mạng, khóa CI, environment, khóa sao lưu. **Không tách được** vì dùng chung máy: Docker, người dùng triển khai `ottimo` (nhóm `docker` ≈ root của máy), nhân Linux. INV đã chấp nhận "cùng VPS". Muốn tách hẳn thì phải thuê VPS thứ hai (có phí → ESC khi cần).
- Staging chuyển sang chạy sau edge (`EDGE_MODE=edge`) đúng một lần. `edge.sh up` dựng lại container web của staging rồi bật edge, staging gián đoạn vài giây.
- Lệch ADR-014 1.4: landing **không** là site thứ 4 trong `Caddyfile.prod` mà là container riêng (`Caddyfile.landing`), giữ đủ quy tắc mục 1.4. Lý do: landing lên mạng trước app production và phát hành riêng. Cần ARC xác nhận (ghi decision-log).

## 3. RAM: 4,8 GB có đủ không

| Thành phần | Giới hạn (mem_limit) production | Giới hạn staging (mới, trong `.env`) | Thực đo lúc nghỉ (stack demo local, cùng image) |
|---|---|---|---|
| postgres | 1 GB | 512 MB | ~25 MB (CSDL nhỏ) |
| api | 1 GB | 512 MB | ~60 MB |
| worker | 768 MB | 384 MB | ~45 MB |
| web (Caddy) | 256 MB | 256 MB | ~15 MB |
| landing (Caddy) | 128 MB | 128 MB | ~15 MB |
| edge (nginx) | 64 MB dùng chung | | ~5 MB |

- Ước khi chạy thật (10 căn, vài nhân viên): mỗi stack khoảng 0,6–0,9 GB, hai stack khoảng 1,6 GB. Cộng hệ điều hành + Docker ~0,4 GB, tổng **~2 GB / 4,8 GB**, còn swap 2 GB dự phòng.
- Tổng giới hạn (production ~3,2 GB + staging ~1,8 GB) **vượt nhẹ RAM**. Giới hạn chỉ là trần, không giữ chỗ trước, nên chỉ nguy hiểm khi cả hai cùng đầy. Để giảm rủi ro: staging chạy giới hạn thấp hơn. QA chạy kiểm thử nặng (E2E, image `-test`) vào giờ vắng khách. `ops-check` có kiểm `mem` (RAM còn trống < 10 % thì báo).
- Build image chạy ở GitHub, không chạy trên VPS.
- **Khi nào cần nâng gói:** `mem` báo nhiều lần trong một tuần, hoặc swap dùng thường xuyên > 1 GB. Khi đó OPS lập ESC (có phí). Hiện không cần.

## 4. Chốt chặn production (`deploy.sh`, bước `config`, chạy trước khi kéo image)

Khi `APP_ENV=production`, deploy dừng nếu gặp một trong các trường hợp sau:
- `MFA_ENFORCED` khác `true`;
- `CLOCK_MODE` khác `system`;
- `INCLUDE_TEST_SUPPORT` khác 0, hoặc có `API_TAG_SUFFIX`/`TEST_SUPPORT_TOKEN`;
- tag `-test`;
- **thiếu digest** của image api/web.

Ở mọi môi trường:
- thiếu tệp bí mật mà compose cần → dừng, kèm lời nhắc chạy `init-secrets.sh`. Đây là trường hợp sẽ gặp trên staging ở lần deploy kế tiếp, vì có thêm bí mật VAPID / form;
- chạy sau edge mà chưa có mạng link → dừng.

Sau khi kéo image, deploy so **digest trong registry** với digest mà CI đọc lúc phát hành. Đây là phần còn nợ của SEC E.10.2 (2)(4), nay đã làm. Rollback production kiểm lại digest đã ghi ở `state/digests/<tag>`.

## 5. Deploy production qua environment GitHub `production`

- Workflow mới `.github/workflows/release.yml`, chạy khi đẩy tag:
  - `v1.0.0` → app;
  - `landing-v1.0.0` → landing.
- Workflow này **không build lại**. Nó lấy đúng image mà CI đã build và test cho commit đó trên `main`, nên production chạy đúng thứ staging đã chạy.
- Thứ tự cổng:
  1. Tag trỏ vào commit thuộc `main`.
  2. CI (push `main`) của commit đó **xanh**.
  3. Image `sha-<12>` có trên GHCR; workflow đọc digest.
  4. Environment `production` **chờ INV duyệt** (người duyệt INV; chỉ tag `v*`/`landing-v*` được dùng environment này).
  5. SSH bằng khóa CI production → lệnh ép `/opt/ottimo-prod/infra/server/bin/deploy-from-ci.sh`. Lệnh này chỉ nhận đúng `deploy sha-… api=sha256:… web=sha256:…` hoặc `landing sha-… landing=sha256:…`. CI chỉ nhận về một dòng kết quả (log Actions công khai – SEC E.8).
- `deploy-from-ci.sh` (dùng chung cho staging): thêm dạng lệnh có digest và lệnh `landing`. Mọi lệnh khác → `refused`, mã thoát 2 (test 24 ca). Stack được suy từ thư mục của chính script, nên khóa production không thể deploy staging và ngược lại.
- `bootstrap-vps.sh --env production`:
  - tạo `/opt/ottimo-prod` và tệp mốc;
  - dùng mẫu `.env` production, không nạp dữ liệu giả;
  - cài timer `@ottimo-prod`;
  - cài khóa CI production (ép đường dẫn production; từ chối khóa trùng khóa staging hay khóa người);
  - `--backup-pull-key`: khóa chỉ đọc thư mục sao lưu (`rrsync -ro`);
  - mỗi lần chạy làm mới `/opt/ottimo-edge/infra`.
- Quay lui:
  - app: `/opt/ottimo-prod/infra/server/bin/rollback.sh`. Chỉ quay image; CSDL không quay lui, vì migration theo nguyên tắc "mở rộng trước, thu hẹp sau";
  - landing: `deploy-landing.sh --rollback`.

## 6. Landing `ottimo.vn`

### 6.1 Cách chạy
- Image `ghcr.io/<owner>/ottimo-landing:sha-<12>` (`infra/docker/Dockerfile.landing`):
  - nội dung là bản build Astro + `check:dist`, chạy bằng Caddy không quyền;
  - CI build mỗi lần push `main` (job `publish-images`), cùng tag với app.
- Bản build dùng `LANDING_INDEXABLE=true`, tức được Google lập chỉ mục. Bản này chỉ ra Internet sau khi INV duyệt environment `production`.
- `Caddyfile.landing` theo ADR-014 1.4. Đã test local trên `dist` thật:
  - CSP / HSTS / Referrer / Permissions / COOP / CORP;
  - `/og/*` cross-origin;
  - `/en/…` → 301;
  - `/book/` → `/#book`;
  - `/ru/*`, `/v1/*`, `/health`, tệp ẩn → 404 kèm trang 404 đúng ngôn ngữ, có đủ header;
  - `www` → 301 về tên miền gốc;
  - log bỏ query (cả `utm_*`), che IP /24.
- Bản xem trước (staging):
  - tệp truy cập do `init-secrets.sh` sinh: basic auth (người dùng `ottimo`, mật khẩu chỉ root đọc được) + `X-Robots-Tag: noindex` (SEC ARC-10 điểm 4);
  - production: không mật khẩu, không `X-Robots-Tag`.
- Deploy: `deploy-landing.sh <tag> [--digest]`. Smoke chạy qua edge với chứng chỉ thật:
  - staging: 401 khi chưa có mật khẩu, kèm noindex;
  - production: 200, không noindex, có CSP và HSTS, các đường thăm dò trả 404;
  - mọi môi trường: `www` → 301.

  Smoke lỗi thì tự đặt lại bản trước.
- CI:
  - job mới `deploy-landing-preview`: push `main` → staging, INV duyệt environment `staging`. Bật bằng biến `LANDING_PREVIEW_DEPLOY=true`, sau khi staging đã chạy sau edge;
  - landing chính thức: tag `landing-v*` (mục 5).

### 6.2 DNS hiện tại của `ottimo.vn` (đọc từ máy chủ DNS Mắt Bão `ns1.matbao.vn`, 23/10)

| Bản ghi | Giá trị hiện tại | Khi chuyển landing |
|---|---|---|
| `@` A ×4 | 4 địa chỉ Google Sites | **ĐỔI**: xóa cả 4, thêm 1 A → IP VPS |
| `www` CNAME | `ghs.googlehosted.com.` | **ĐỔI**: xóa CNAME, thêm A → IP VPS |
| `@` MX | `0 smtp.google.com.` | **KHÔNG ĐỤNG** |
| `@` TXT `v=spf1 include:_spf.google.com ~all` | SPF Google | **KHÔNG ĐỤNG** (không thêm `-all`, không thêm IP VPS: VPS không gửi thư) |
| `@` TXT `google-site-verification=…` | xác minh Google | **KHÔNG ĐỤNG** (dùng cho Workspace / Search Console) |
| `google._domainkey` TXT | DKIM Google Workspace | **KHÔNG ĐỤNG** |
| `_dmarc` TXT | (chưa có) | Không bắt buộc. Khuyến nghị thêm sau `v=DMARC1; p=none; rua=mailto:<hộp thư nhóm>` – bản ghi mới, không ảnh hưởng thư đang chạy |
| `mail` CNAME | `ghs.googlehosted.com.` | **Cần INV chọn** (mục 6.3) |
| `desk/staff/g.staging` A | IP VPS | giữ |
| CAA | không có (Mắt Bão không hỗ trợ – R5-15) | giữ nguyên rủi ro thấp, SEC đã biết |

Bản ghi **thêm mới**:
- xem trước: `staging`, `www.staging`;
- production: `desk`, `staff`, `g`.

Tất cả là A → IP VPS. Thêm được ngay, không ảnh hưởng email.

### 6.3 Điểm cần chọn: HSTS `includeSubDomains` và `mail.ottimo.vn`
ADR-014 đặt `Strict-Transport-Security: max-age=31536000; includeSubDomains` ở tên miền gốc. Trình duyệt nào đã mở `https://ottimo.vn` sẽ **ép HTTPS cho mọi tên miền con trong 1 năm**. `mail.ottimo.vn` (CNAME tới Google) là đường tắt cũ vào Gmail và **không có chứng chỉ HTTPS cho tên này**, nên sẽ báo lỗi chứng chỉ trên những trình duyệt đó. Các tên miền con khác đều đã có HTTPS.
- Đề xuất OPS: **xóa bản ghi `mail`**. Gmail vẫn vào bằng `mail.google.com`, email không ảnh hưởng gì. Giữ HSTS đúng ADR.
- Phương án khác: giữ `mail` và bỏ `includeSubDomains` ở landing. Phương án này cần ARC + SEC đồng ý vì lệch ADR.
- Chưa chọn thì không bật landing production. Bản xem trước không bị ảnh hưởng.

### 6.4 Thứ tự chuyển `ottimo.vn` từ Google Sites sang VPS
1. Trước 1 ngày: INV hạ TTL của `@` và `www` xuống 300 giây, nếu Mắt Bão cho đặt.
2. INV duyệt bản xem trước trên `https://staging.ottimo.vn` (có mật khẩu).
3. OPS (ORC giao) dựng phần production tối thiểu cho landing: bootstrap `--env production`, `.env`, `init-secrets.sh`, `edge.sh up`. Chưa cần app production.
4. ORC đẩy tag `landing-v1.0.0` trên đúng commit INV đã duyệt. Job release dừng chờ INV duyệt.
5. Buổi tối, ít khách: INV đổi DNS theo bảng 6.2 (`@` và `www`), rồi **duyệt job ngay sau đó**. Let's Encrypt hỏi thẳng máy chủ DNS của Mắt Bão nên cấp chứng chỉ được ngay. Smoke tự thử lại.

   Khách có DNS cũ trong bộ nhớ đệm vẫn thấy trang Google Sites cho tới khi hết TTL, nên không có lúc trắng trang. Khách có DNS mới chỉ có thể gặp lỗi trong vài phút giữa lúc đổi DNS và lúc duyệt.
6. Sau khi chạy ổn 1–2 ngày: INV gỡ tên miền tùy chỉnh trong cài đặt Google Sites. Không xóa Google Sites ngay, để còn đường quay lại: đặt lại 4 A + CNAME `www` như cũ.

## 7. Giám sát và cảnh báo (0 đ)

| Lớp | Cách làm | Báo tới |
|---|---|---|
| Trên máy chủ, 30 phút/lần | `ops-check.sh` mỗi stack: `containers`, `j16`, `backup`, `disk`, **`mem` (mới)**, `tls` (gồm tên miền landing), **`http5xx` (mới: ≥ 5 phản hồi lỗi 5xx của Caddy trong 35 phút)** | Nhật ký hệ thống + `ALERT_WEBHOOK_URL` (Google Chat, chỉ khi đổi trạng thái + nhắc mỗi 6 giờ) |
| Báo cả khi máy chủ chết | **`HEARTBEAT_URL` (mới)**: sau mỗi lượt kiểm, máy chủ gọi Healthchecks.io; lượt có lỗi gọi `/fail`. Mất tín hiệu > 1 giờ hoặc nhận `/fail` → dịch vụ gửi email | Email INV + OPS |
| Từ bên ngoài | UptimeRobot (miễn phí) kiểm 5 phút/lần `https://desk/staff/g.ottimo.vn/` + `ottimo.vn` + `www` | Email |

- Zalo không có kênh báo động miễn phí → **ESC-029** (đội đề xuất A: email + Google Chat).
- Không gửi dữ liệu khách nào, chỉ gửi tên mục kiểm.

## 8. Sao lưu, giữ, off-site, diễn tập

### 8.1 Sao lưu
- Production: 03:00 giờ VN (staging 03:30 – không trùng lúc).
- Nội dung: `pg_dump` + kho tệp (đã mã hóa sẵn) + `purge_journal` + **`counts`**. Tất cả mã hóa `age` bằng **khóa công khai riêng của production**. Khóa riêng không bao giờ nằm trên VPS.
- Mới: tệp đếm `counts-<stamp>` đọc **trong cùng snapshot** với `pg_dump`. Một giao dịch REPEATABLE READ xuất snapshot, `pg_dump --snapshot` dùng lại snapshot đó, nên các con số mô tả đúng những gì có trong bản dump (`infra/server/backup-counts.sql`).
- Giữ: mọi bản < 7 ngày, bản Chủ nhật < 35 ngày (SR-BAK-03, trần 35 ngày cho mọi bản sao), `purge_journal` 40 ngày. INV đã chấp nhận hạn lưu giấy tờ ngắn nhất (ESC-001). `purge_journal` bảo đảm giấy tờ đã xóa sau thời điểm sao lưu sẽ bị xóa lại khi khôi phục (SR-BAK-06).
- Off-site (SR-BAK-04): máy của INV/OPS **kéo về** bằng `pull-backups.sh`:
  - khóa riêng bị ép `rrsync -ro /var/backups/ottimo-prod`: chỉ đọc, chỉ thư mục đó;
  - tự kiểm checksum, không xóa theo máy chủ, tự xóa bản > 35 ngày ở máy mình;
  - dữ liệu vẫn ở Việt Nam (ESC-002 A) và vẫn mã hóa.

  Máy chủ bị chiếm cũng không xóa được bản sao này.

### 8.2 Khóa
- Cặp khóa `age` production: INV sinh trên máy Mac (`~/.ottimo/backup/`), cất thêm vào trình quản lý mật khẩu và một bản ngoại tuyến (R5-16).
- KEK production (`data_kek_current`): INV chép **ngoại tuyến** ngay sau `init-secrets.sh` (hosting-plan 8.1). Mất KEK là mất mọi ảnh giấy tờ.

### 8.3 Diễn tập khôi phục – chạy thử local 23/10 (dữ liệu giả của stack demo)
Cách chạy:
- `backup.sh` thật chạy trong container (docker CLI + age + util-linux), `dc` giả trỏ vào stack demo trên Mac;
- `restore-drill.sh` thật trên bản sao lưu vừa tạo, với `ottimo-api:demo`.

```
Bản sao lưu:            20261023T132459Z
Kết quả:                ĐẠT – /health ok
Thời gian khôi phục:    12 giây (giải mã + DB + tệp + khởi động api)
Đếm bảng (sau khôi phục; so với lúc sao lưu: khớp 100 %):
  migrations 32 · properties 1 · users 21 · reservations 27 · guests 32 · folios 27 · folio_lines 69
  folio_lines_sum_vnd 70619000 · payments 28 · payments_sum_vnd 50922000 · data_keys_live 5 · purge_journal 0
```
- Ca âm: sửa `folios 27` → `28` trong tệp đếm (mã hóa lại, checksum mới) → **KHÔNG ĐẠT**, in đúng dòng lệch, mã thoát 1.
- Môi trường dùng một lần đã tự xóa. Bản sao lưu thử và khóa thử chỉ nằm trong thư mục tạm của phiên.
- Lần bắt buộc (điều kiện 4 của v1.0): sau deploy production đầu tiên, chạy `backup.sh` → kéo về → `restore-drill.sh` trên Mac → dán biên bản vào report.

### 8.4 Khôi phục 2FA (SEC 06.33)
**Có, ở ngoài repo.** Thủ tục viết ở `~/.ottimo/runbooks/2fa-operator-reset-06.33.md` trên máy INV (0600) – chờ SEC duyệt, chưa diễn tập. Bản thứ hai cất trong trình quản lý mật khẩu của INV. Repo chỉ ghi dòng này.

## 9. Việc chưa xong / rủi ro (ORC cần biết)

| # | Việc | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R3-OPS-01 | **Email production chưa có** (ESC-010 B = Amazon SES). `EMAIL_PROVIDER=off` thì **mã xác minh email của check-in online không gửi được**, email 2FA (06.18/06.33) cũng không | Check-in online thuộc v1.0 | ORC giao INT: hướng dẫn INV tạo SES + bản ghi DKIM (3 CNAME `_domainkey`, không đụng bản ghi Google). Hoặc ORC quyết v1.0 tạm không bật check-in online |
| R3-OPS-02 | **Chưa có lệnh khởi tạo production**: seed chỉ cho dữ liệu giả và từ chối `production`. Production trống sẽ không có cơ sở, căn, tham số, tài khoản `owner` đầu tiên | Chặn v1.0 | ORC giao BE + ARC: lệnh quản trị một lần (giống `mfa-operator-reset`) tạo cơ sở + 10 căn + tham số thật + `owner` đầu tiên với mật khẩu tạm buộc đổi và buộc đăng ký 2FA. Dữ liệu thật do PO/DOM chuẩn bị |
| R3-OPS-03 | HSTS `includeSubDomains` và `mail.ottimo.vn` (6.3) | Lỗi chứng chỉ khi mở `mail.ottimo.vn` | INV xóa `mail` (đề xuất) |
| R3-OPS-04 | Lệch ADR-014: landing chạy container riêng | Tài liệu | ARC xác nhận |
| R3-OPS-05 | Staging chuyển sang chạy sau edge | Staging gián đoạn vài giây | Làm cùng lần dựng production |
| R3-OPS-06 | Nginx edge và digest image `nginx:1.30.6-alpine` chưa nằm trong Dependabot (Dependabot docker chỉ quét `infra/docker`) | Bản vá nginx phải tự nâng | OPS nâng tay hằng tháng; xem lại khi Dependabot hỗ trợ compose |
| R3-OPS-07 | Edge đặt log lỗi ở mức `crit` để không ghi IP đầy đủ. Lỗi kết nối thường sẽ không xuất hiện trong log edge | Khó điều tra sự cố mạng | SEC xem. Muốn điều tra thì bật tạm mức `error` |
| R3-OPS-08 | Trang 401 của bản xem trước landing chỉ có `X-Robots-Tag`, không có CSP/HSTS, và lộ `server: Caddy` | Thấp (chỉ staging) | Để vậy |
| R3-OPS-09 | Thủ tục 06.33 chưa được SEC duyệt và chưa diễn tập trên staging (cần nhánh 2FA gộp và deploy staging trước) | Điều kiện SEC Verified US-143 | Sau khi gộp 2FA |

## 10. Kiểm thử đã chạy (local, 23/10)

| Kiểm | Kết quả |
|---|---|
| `test-deploy-from-ci.sh` (mở rộng, ubuntu/alpine có flock) | Đạt: (a) 4, (b) 24 lệnh bị từ chối, (c) 2, (d) 1, (e) 2, (f) 4 – chốt chặn production dừng ở `step=config` và không kéo image |
| `test-edge.sh` (mới, Docker) | Đạt 15/15. Render: chặn tên miền trùng/sai dạng, `PROXY_PROTOCOL_ALLOW` sai, bỏ qua stack chạy trực tiếp, render lỗi không đè cấu hình cũ. E2E: định tuyến SNI đúng stack, backend thấy địa chỉ khách thật (không phải edge), SNI lạ bị đóng, `:80` chuyển đúng / host lạ 404, **header PROXY giả từ địa chỉ khác bị bỏ qua**, xem trước 401/200 có mật khẩu |
| `check-caddy-prod.sh --stub` (Caddyfile.prod có thêm listener PROXY) | Đạt (header, probe, 413, che log) |
| `check-compose.sh` (thêm production sau edge: không dịch vụ nào mở cổng, landing chỉ ở mạng landing + link) | Đạt |
| `shellcheck -S warning` (cùng danh sách job `infra-scripts`, kèm 4 script mới) | Sạch |
| `init-secrets.sh` (staging + production, Docker) | Đủ tệp. Cặp VAPID đúng (`createECDH(prime256v1)` từ khóa riêng ra đúng khóa công khai: 32/65 byte). Tệp landing đúng theo môi trường. Mật khẩu xem trước khớp bcrypt (200 khi có mật khẩu) |
| `docker build Dockerfile.landing` + chạy với cờ hardening của compose | Build xong (`check:dist` đạt), `/`, `/vi/`, robots (`Allow: /` khi `LANDING_INDEXABLE=true`), sitemap trả 200 |
| `backup.sh` + `restore-drill.sh` | Mục 8.3 |
| `ci.yml`, `release.yml` | YAML hợp lệ. Chưa chạy trên GitHub (chưa commit) |

## 11. Tệp tạo/sửa

Mới:
- `product/infra/edge/docker-compose.edge.yml`
- `product/infra/docker-compose.edge-link.yml`
- `product/infra/caddy/Caddyfile.landing`
- `product/infra/docker/Dockerfile.landing`
- `product/infra/server/env.production.example`
- `product/infra/server/backup-counts.sql`
- `product/infra/server/bin/edge.sh`, `deploy-landing.sh`, `pull-backups.sh`
- `product/infra/server/systemd/ottimo-backup@.service|.timer`, `ottimo-ops-check@.service|.timer`
- `product/infra/ci/test-edge.sh`
- `.github/workflows/release.yml`
- `02-escalations/ESC-029.md`
- `rounds/round-03/outputs/OPS/{v1-production.md, inv-production-steps.md}`

Sửa:
- `product/infra/docker-compose.prod.yml`: VAPID/form/landing, giới hạn RAM theo `.env`, `PROXY_PROTOCOL_ALLOW`, dịch vụ `landing`, `MFA_ENFORCED` (cùng hunk với nhánh 2FA)
- `product/infra/docker-compose.yml`: `MFA_ENFORCED`, cùng hunk với nhánh 2FA
- `product/infra/caddy/Caddyfile.prod`: listener PROXY protocol theo `:443`/`:80`
- `product/infra/server/bin/{dc, deploy.sh, deploy-from-ci.sh, rollback.sh, backup.sh, restore-drill.sh, ops-check.sh, init-secrets.sh}`
- `product/infra/server/bootstrap-vps.sh`
- `product/infra/server/env.example`
- `product/.env.example`: `MFA_ENFORCED` cùng hunk với nhánh 2FA, VAPID, `LANDING_BASE_URL`, `PUBLIC_FORM_SIGNING_KEY_FILE`
- `product/infra/ci/test-deploy-from-ci.sh`, `check-compose.sh`
- `.github/workflows/ci.yml`: landing image, `deploy-landing-preview`, bước test edge
- `02-escalations/escalations-index.md`
- `01-decisions/decision-log.md`

Ngoài repo: `~/.ottimo/runbooks/2fa-operator-reset-06.33.md`.
GitHub: cảnh báo Dependabot #1 (esbuild, GHSA-67mh-4wv8-2f99) → **dismissed – "vulnerable code not used"** lúc 13:38 UTC 23/10. Lời ghi chú dẫn SEC R3-Q31 mục E, ngày xem lại 22/01/2027.
