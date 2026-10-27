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
| edge (nginx) | 128 MB dùng chung (3 worker × 8192 kết nối – SEC OPS-01) | | ~5 MB |

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

Ngoài ra, ở mọi môi trường: thư mục production (tệp mốc `production`) hoặc `EDGE_NAME=production` mà `APP_ENV` khác `production` → dừng (SEC OPS-03, có test). Cả `deploy-landing.sh` cũng kiểm điều này.

Sau khi kéo image, deploy so **digest trong registry** với digest được truyền vào. Digest đó do `release.yml` lấy **từ chính lần chạy CI xanh** đã đẩy image: job `publish-images` ghi `image-digests.txt` thành artifact của lần chạy, giữ 90 ngày. Workflow phát hành dừng nếu GHCR hiện đang phục vụ digest khác dưới cùng tag (SEC OPS-02). Như vậy SEC E.10.2 (2)(4) đã xong. Rollback production kiểm lại digest đã ghi ở `state/digests/<tag>`.

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
| `mail` CNAME | `ghs.googlehosted.com.` | **XÓA** (INV quyết 23/10, mục 6.3) |
| `desk/staff/g.staging` A | IP VPS | giữ |
| CAA | không có (Mắt Bão không hỗ trợ – R5-15) | giữ nguyên rủi ro thấp, SEC đã biết |

Bản ghi **thêm mới**:
- xem trước: `staging`, `www.staging`;
- production: `desk`, `staff`, `g`.

Tất cả là A → IP VPS. Thêm được ngay, không ảnh hưởng email.

### 6.3 HSTS `includeSubDomains` và `mail.ottimo.vn` – **INV đã quyết 23/10: xóa `mail`**
ADR-014 đặt `Strict-Transport-Security: max-age=31536000; includeSubDomains` ở tên miền gốc. Trình duyệt nào đã mở `https://ottimo.vn` sẽ **ép HTTPS cho mọi tên miền con trong 1 năm**. `mail.ottimo.vn` (CNAME tới Google) là đường tắt cũ vào Gmail và **không có chứng chỉ HTTPS cho tên này**, nên sẽ báo lỗi chứng chỉ trên những trình duyệt đó. Các tên miền con khác đều đã có HTTPS.
- Đề xuất OPS: **xóa bản ghi `mail`**. Gmail vẫn vào bằng `mail.google.com`, email không ảnh hưởng gì. Giữ HSTS đúng ADR.
- Phương án khác: giữ `mail` và bỏ `includeSubDomains` ở landing. Phương án này cần ARC + SEC đồng ý vì lệch ADR.
- **Đã quyết (INV 23/10): xóa bản ghi `mail`**, giữ HSTS đúng ADR. MX, SPF, DKIM và bản ghi xác minh Google giữ nguyên.
- **Không thêm bản ghi AAAA (IPv6)** cho bất kỳ tên nào trỏ về VPS (SEC S-1). Lý do: Docker chuyển tiếp IPv6 qua `docker-proxy` thay địa chỉ khách bằng địa chỉ nội bộ. Khi đó `/health` mở cho mọi khách IPv6, giới hạn đăng nhập và giới hạn kết nối của edge gộp mọi khách IPv6 thành một. Muốn bật IPv6 thì phải làm cấu hình và test riêng trước.

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

- Zalo không có kênh báo động miễn phí → **ESC-029: INV chọn A (23/10)**: email qua Healthchecks.io + UptimeRobot, và Google Chat.
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
| R3-OPS-01 | Email production: **INV chọn Google Workspace SMTP** từ `info@ottimo.vn` (decision-log 23/10, thay SES cho v1.0). Adapter + `init-secrets.sh` (hỏi mật khẩu ứng dụng qua dấu nhắc ẩn, `--reset-email-password`) do INT làm trên nhánh `int-r3-smtp` | Check-in online cần email | **Không cần đổi DNS**: SPF `include:_spf.google.com` và DKIM `google._domainkey` đã có. INV tạo mật khẩu ứng dụng (`inv-production-steps.md` phần 8). OPS không sửa các tệp INT đang sửa (compose, `init-secrets.sh`, mẫu `.env`) để khỏi xung đột |
| R3-OPS-02 | Lệnh khởi tạo production | – | **Xong**: BE-A `production-bootstrap` (gộp `f7696e7`, SEC đạt). OPS thêm wrapper máy chủ `infra/server/bin/production-bootstrap.sh` (chặn pipe/tee/script/tmux – BOOT-01) và thủ tục cùng buổi (BOOT-02) ở README `infra/server` 12.1 |
| R3-OPS-03 | HSTS `includeSubDomains` và `mail.ottimo.vn` (6.3) | – | **Đã quyết**: INV xóa `mail` |
| R3-OPS-04 | Lệch ADR-014: landing chạy container riêng | Tài liệu | ARC xác nhận |
| R3-OPS-05 | Staging chuyển sang chạy sau edge | Staging gián đoạn vài giây | Làm cùng lần dựng production |
| R3-OPS-06 | Nginx edge và digest image `nginx:1.30.6-alpine` chưa nằm trong Dependabot (Dependabot docker chỉ quét `infra/docker`) | Bản vá nginx phải tự nâng | OPS nâng tay hằng tháng; xem lại khi Dependabot hỗ trợ compose |
| R3-OPS-07 | Edge đặt log lỗi ở mức `crit` để không ghi IP đầy đủ. Lỗi kết nối thường sẽ không xuất hiện trong log edge | Khó điều tra sự cố mạng | SEC xem. Muốn điều tra thì bật tạm mức `error` |
| R3-OPS-08 | Trang 401 của bản xem trước landing chỉ có `X-Robots-Tag`, không có CSP/HSTS, và lộ `server: Caddy` | Thấp (chỉ staging) | Để vậy |
| R3-OPS-09 | Thủ tục 06.33 chưa được SEC duyệt và chưa diễn tập trên staging (cần nhánh 2FA gộp và deploy staging trước) | Điều kiện SEC Verified US-143 | Sau khi gộp 2FA |

## 10. Kiểm thử đã chạy (local, 23/10)

| Kiểm | Kết quả |
|---|---|
| `test-deploy-from-ci.sh` (mở rộng, ubuntu/alpine có flock) | Đạt: (a) 4, (b) 24 lệnh bị từ chối, (c) 2, (d) 1, (e) 2, (f) 6 – chốt chặn production (kể cả thư mục/`EDGE_NAME` production mà `APP_ENV` sai) dừng ở `step=config` và không kéo image |
| `test-edge.sh` (mới, Docker) | Đạt 20/20 (lượt 2). Thêm so với lượt 1: giới hạn 100 kết nối/IP ở cổng 443 và 20 ở cổng 80; preread 5 s; 8192 kết nối mỗi worker; từ chối giới hạn không phải số; E2E: một địa chỉ vượt giới hạn bị từ chối trong khi địa chỉ khác vẫn vào, kết nối treo không gửi ClientHello bị đóng sau preread_timeout. Phần lượt 1: Render: chặn tên miền trùng/sai dạng, `PROXY_PROTOCOL_ALLOW` sai, bỏ qua stack chạy trực tiếp, render lỗi không đè cấu hình cũ. E2E: định tuyến SNI đúng stack, backend thấy địa chỉ khách thật (không phải edge), SNI lạ bị đóng, `:80` chuyển đúng / host lạ 404, **header PROXY giả từ địa chỉ khác bị bỏ qua**, xem trước 401/200 có mật khẩu |
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

## 12. Lượt 2 (23/10) – sửa theo SEC `reviews/s1-SEC-on-v1-prod.md`

Trả lời từng thẻ: `rounds/round-03/responses/s1-OPS-v1.md`.

- **OPS-01 (Major) – giới hạn của edge.**
  - `worker_processes auto`, `worker_connections 8192`, `nofile 32768`.
  - Giới hạn kết nối theo IP: 100 ở cổng 443, 20 ở cổng 80. Có thể chỉnh bằng `EDGE_CONN_PER_IP*` khi chạy `edge.sh`.
  - `preread_timeout 5s`. Ở cổng 80: thời hạn header/thân 10 s, quá giới hạn trả 429.
  - `mem_limit` của edge nâng lên 128 MB (bảng RAM mục 3).
  - Test E2E mới chứng minh giới hạn có tác dụng.
- **OPS-02 – nguồn digest:** lấy từ artifact của lần chạy CI xanh, so với GHCR (mục 4).
- **OPS-03 – stack production phải có `APP_ENV=production`:** `deploy.sh` và `deploy-landing.sh` đều kiểm, test thêm 2 ca.
- **OPS-04 (Major), OPS-05 – thủ tục 06.33 (ngoài repo):**
  - người thật cho từng vai;
  - nhánh 3B "INV vừa yêu cầu vừa chạy" (khóa SSH có passphrase + người chứng kiến thật);
  - ghi rõ lệnh không đổi mật khẩu, kèm "giới hạn đã biết";
  - báo bằng điện thoại khi email chưa chạy;
  - bước kiểm lịch sử shell;
  - README ghi "SEC duyệt ngày: (chưa)".
  - Còn lại: diễn tập trên staging với người chứng kiến thật, rồi SEC duyệt.
- **S-1:** không thêm bản ghi AAAA (mục 6.3, hướng dẫn INV phần 1 và 7).
- **BOOT-01, BOOT-02:** wrapper `infra/server/bin/production-bootstrap.sh` và README `infra/server` 12.1. Lệnh cũ trong README dùng `services/api/scripts/…`, đường dẫn này không có trên máy chủ (bundle chỉ có `infra/`), nay thay bằng wrapper.
- **CI:** đã xem thay đổi của BE-A (DB `ottimo_bootstrap_test` rỗng, tạo bằng `ottimo_admin` trước `02-roles.sh`, role ứng dụng không quyền tạo DB): **đồng ý**. `shellcheck` thêm `services/api/scripts/production-bootstrap.sh` và `mfa-operator-reset.sh`: cả hai sạch.


## 13. Landing live 24/10 (INV đổi lệnh: bỏ bản xem trước – decision-log 24/10)

Làm từ máy Mac của INV, SSH `ottimo-admin` (khóa `ottimo_ops`, có passphrase, qua Keychain). Giờ ghi theo giờ VN (UTC+7). Không ghi IP.

| Giờ | Việc | Kết quả |
|---|---|---|
| 08:13 | Sao lưu staging trước khi đổi (`backup.sh`) | OK |
| 08:13–08:15 | Bundle từ `main` `4fab25b` → `bootstrap-vps.sh --env staging`, rồi `--env production` | rc 0 cả hai. Tạo `/opt/ottimo-prod` (tệp mốc `production`) và `/opt/ottimo-edge`. Timer production **chưa bật** (chưa có app). `linux-firmware` được giữ tạm (`apt-mark hold`) trong lúc chạy rồi bỏ giữ, để tránh cờ khởi động lại trước A1 25/10 |
| 08:15 | `init-secrets.sh` staging (thêm VAPID, khóa form, `landing_access`, `email_smtp_password` rỗng – relay) và production (bộ đầy đủ) | Chỉ in tên tệp, không in giá trị |
| 08:15 | `.env` staging thêm `EDGE_MODE=edge`, `EDGE_NAME=staging`, `PROXY_PROTOCOL_ALLOW`, giới hạn RAM staging, `WEB_PUSH_SUBJECT`. `.env` production: `desk/staff/g.ottimo.vn`, `ottimo.vn` / `www.ottimo.vn`, image, `ACME_EMAIL=info@ottimo.vn` | `dc config` hợp lệ cả hai. Bản `.env` staging cũ lưu ở `state/env.before-edge.*` |
| **08:15:49–08:15:58** | `edge.sh up`: tạo 2 mạng link, dựng lại `web` staging không mở cổng, bật edge (giới hạn SEC OPS-01) | **Staging gián đoạn 2 giây** (08:15:51–08:15:52, đo bằng `curl` 2 lần/giây từ Mac: 3 lần thất bại trên 245 lần thử). api/worker/postgres **không** dựng lại |
| 08:16 | Kiểm staging | `desk/staff/g.staging` 200 + CSP/HSTS. `:80` → 308. `/health` từ ngoài 404 (Caddy thấy địa chỉ thật của khách qua PROXY, log che /24). Đăng nhập `qa.fd` 200. `ops-check` 7/7 ok. **OTM-00239 còn nguyên** (`in_house`), 293 đơn – DB không đụng |
| 08:27 | CI push `4fab25b` xanh, `publish-images` đẩy `ottimo-landing:sha-4fab25b81c45`. Digest trên GHCR **khớp** digest artifact `image-digests` của lượt CI đó (SEC OPS-02). Kéo ẩn danh được (gói Public) | – |
| 08:27:46–08:28:05 | `deploy-landing.sh sha-4fab25b81c45 --digest sha256:b0fad8f5…` trên stack production | OK. Smoke: 200, CSP, HSTS, không `X-Robots-Tag`, `/health` `/v1/x` `/.env` 404, `/en/` 301, `www` 301. Hai dòng `curl (35)` trong log là lúc chờ chứng chỉ, tự thử lại |

**DNS (đọc từ `ns1.matbao.vn` và 1.1.1.1 / 8.8.8.8, 24/10):**
- `@` và `www`: mỗi tên một bản ghi A trỏ VPS. Không còn địa chỉ Google Sites, không có AAAA.
- `mail`: đã xóa.
- MX `smtp.google.com`, SPF, `google-site-verification`, DKIM `google._domainkey`: **giữ nguyên**.

**Chứng chỉ:** Let's Encrypt (YE1) cho `ottimo.vn` và `www.ottimo.vn`, hết hạn 22/01/2027. Caddy tự gia hạn.

**Kiểm từ ngoài:**
- `https://ottimo.vn` → 200;
- `/vi/` → 200;
- `http://` → 308;
- `https://www.ottimo.vn/…` → 301 về `https://ottimo.vn/…`;
- `robots.txt`: `Allow: /` (`LANDING_INDEXABLE=true`, INV đồng ý).

**Giới hạn và việc tiếp theo:**
- **Giám sát:** `ottimo.vn` chưa có. Timer `ops-check@ottimo-prod` chưa bật vì chưa có app production (kiểm `containers` sẽ báo lỗi). Cần UptimeRobot cho `https://ottimo.vn/` và `https://www.ottimo.vn/` (ESC-029 A, INV tạo tài khoản).
- **App production:** `desk/staff/g.ottimo.vn` chưa có bản ghi DNS và chưa có app. Edge đã có tuyến sẵn; kết nối tới đó hiện bị đóng.
- **KEK production:** đã sinh. INV chép bản ngoại tuyến **trước** khi production có dữ liệu thật (`inv-production-steps.md` phần 4b).
- **Đóng gói mới đã áp lên staging:** compose mới gồm bí mật mới, giới hạn RAM 512/512/384 MB và listener PROXY.
  - Lượt CI `deploy staging` kế tiếp (`sha-4fab25b81c45`, chờ INV duyệt) sẽ dựng lại api/worker và chạy migration mới trên DB staging. Dữ liệu giữ nguyên, nhưng API gián đoạn khoảng 30–60 giây.
  - Nếu muốn staging đứng yên trước A1 25/10, **chưa duyệt** lượt đó.
- **Đã bỏ:** bản xem trước `staging.ottimo.vn` và biến `LANDING_PREVIEW_DEPLOY`. Từ nay landing chỉ phát hành bằng tag `landing-v*` + duyệt environment `production` (`release.yml`).
- **Quay lui** (khoảng 30 giây):
  - landing: `deploy-landing.sh --rollback`; hoặc đặt lại DNS Google Sites theo ảnh chụp INV đã lưu;
  - edge: theo `README` `infra/server` (đặt `EDGE_MODE=direct`, `docker compose -p ottimo-edge down`, `dc up -d --no-deps web`).

## 14. Hạ tầng cho form website US-155 (24/10, chỉ trên repo – chưa đụng VPS)

Căn cứ:
- SEC `reviews/s1-SEC-on-us155.md`: điều kiện 2, thẻ FB-02 phần OPS và FB-04;
- FE `outputs/FE/s1-us155.md` mục 8;
- BE-D `outputs/BE/s1-be-d-us155.md`.

### 14.1 Thay đổi
- **`Caddyfile.landing`**:
  - `LANDING_PUBLIC_API=on` mới proxy, và chỉ hai thao tác:
    - `GET /v1/public/properties/<slug>/form-token`;
    - `POST /v1/public/properties/<slug>/booking-requests`.

    Slug phải khớp `[a-z0-9-]{2,40}`. Mặc định `off`.
  - Mọi `/v1/*` khác, sai phương thức, `availability`/`offers`, `/health` → 404.
  - Body tối đa 16 KB: `Content-Length` khai > 16 KB → 413 trước khi proxy.
  - POST không có `Content-Length` (chunked) → 413 trước khi proxy. Lý do: thử thật cho thấy với chunked, `reverse_proxy` vẫn gửi tới api một request **rỗng** dù khách nhận 413.
  - `request_buffers 32KB`, nên body ≤ 16 KB được đọc hết trước khi gửi.
  - `X-Forwarded-For` lấy từ địa chỉ thật của khách, mà Caddy nhận qua PROXY protocol từ edge.
- **`docker-compose.prod.yml`**:
  - container landing vào thêm mạng `edge` của stack, với địa chỉ cố định `LANDING_IP` (production `172.30.1.11`). Landing vẫn không vào mạng `db` và không nhận bí mật ứng dụng (`check-compose.sh` kiểm);
  - api `TRUST_PROXY = WEB_IP,LANDING_IP` (`check-compose.sh` kiểm landing có tên trong `TRUST_PROXY`);
  - thêm `LANDING_PUBLIC_API`.
- **`deploy.sh` / `deploy-landing.sh`** (bước `config`) dừng khi:
  - `LANDING_BASE_URL` không phải `https://<host>`;
  - `LANDING_PUBLIC_API=on` mà `LANDING_BASE_URL` ≠ `https://<LANDING_HOST>`;
  - `LANDING_IP` nằm ngoài `EDGE_SUBNET`.
- **Khóa ký form:** `public_form_signing_key` sinh riêng trong mỗi `secrets/` của từng stack bằng `init-secrets.sh` (từ R3 lượt 1), truyền vào api dưới dạng `PUBLIC_FORM_SIGNING_KEY_FILE`. Production đã có tệp riêng (sinh 24/10).
- **`Dockerfile.landing`**: thêm build-arg `LANDING_BOOKING_FORM` (mặc định `false`) và `LANDING_PROPERTY_SLUG` (production: `dlt` = mã cơ sở `DLT` viết thường, `public_resolve_property`). CI truyền theo tên từ **biến repo** cùng tên; chưa đặt thì không có form.
- **`ops-check`**: `containers` báo lỗi khi số bản `api` đang chạy khác 1. Runbook "API chạy 1 bản" ở README `infra/server` 12.2. Các bước bật form ở 12.3.
- **CI**: job `infra-scripts` thêm bước `check-caddy-landing.sh`.

  Đã xem lệnh FE-B thêm vào `ci.yml` (job `landing-e2e`: `build:booking-live-test`, slug `dl01`, ra `dist-booking-live/`, chỉ để test, không deploy): **đồng ý**. Image production không dùng bản build này.

### 14.2 Test (local 24/10)

| Test | Kết quả |
|---|---|
| `check-caddy-landing.sh` (mới) | 16/16 |
| `test-deploy-from-ci.sh` | Đạt. (f) thêm 2 ca: `LANDING_BASE_URL` http; `LANDING_PUBLIC_API=on` lệch host |
| `check-compose.sh` | Đạt, có luật mới về landing/`TRUST_PROXY` |
| `test-edge.sh`, `check-caddy-prod.sh --stub`, shellcheck | Đạt |

### 14.3 Trên VPS khi bật form (chưa làm)
Theo README 12.3. Việc **phải nhớ**: thêm `LANDING_IP=172.30.1.11` vào `/opt/ottimo-prod/.env` trước lần deploy landing kế tiếp, nếu không `deploy-landing.sh` dừng ở `config`. Landing đang chạy không bị ảnh hưởng.

## 15. Nhật ký phát hành landing

### 15.1 Landing concept B – 25/10 (INV duyệt 25/10, decision-log)

Làm từ máy Mac của INV, SSH `ottimo-admin` (khóa `ottimo_ops`). Giờ VN. Không ghi IP, không in `.env` hay bí mật.

| Giờ | Việc | Kết quả |
|---|---|---|
| 20:40 | Chọn image: `main` `47ad517` khác `d67d204` đúng 1 dòng `decision-log.md`, nên dùng image CI đã publish của `d67d204`: `ottimo-landing:sha-d67d20440a1a` @ `sha256:db2b4964488c74b4e1e6c86f6308d91e3a44091dd5f39d7ca8c303f3c320bab0`. Digest artifact `image-digests` (lượt CI 40165925608, mọi job kiểm xanh; 2 job deploy staging bị hủy vì chờ duyệt) = digest GHCR = digest kéo về VPS | Khớp cả 3 |
| 20:40 | Cờ form: repo `ottimo-hotel-app-public` không có biến `LANDING_BOOKING_FORM` / `LANDING_PROPERTY_SLUG` → image build với mặc định `false`. Kiểm trong image (`/srv/landing`): không `<form`, không `small hotel`, không `[[`, preload `signature-dining` ở `/` và `/vi/` | Đạt |
| 20:46:38 | Sao lưu: bundle cũ `/opt/ottimo-prod/infra` (`4fab25b`) → `/root/ottimo-prod-bundles/infra-4fab25b-20261025-204638`; `.env` → `state/env.before-landing-ip.20261025-204638` (0600 `ottimo`) | OK |
| 20:46:38 | Thêm `LANDING_IP=172.30.1.11` vào `/opt/ottimo-prod/.env` (ghi chú "phải nhớ" mục 14.3) | 1 dòng, `.env` giữ `ottimo:ottimo 600` |
| 20:46:38 | Cập nhật bundle **chỉ của stack production** lên `47ad517` (cùng lệnh `rsync` mà `bootstrap-vps.sh` dùng, **không** chạy cả `bootstrap-vps.sh` để tránh `apt upgrade`/`ufw reset` chạm staging). Hash `deploy-landing.sh`, `docker-compose.prod.yml` khớp repo. `dc --profile landing config -q` | OK. `/opt/ottimo` (staging) và `/opt/ottimo-edge` không đổi |
| 20:46:51–20:46:57 | `deploy-landing.sh sha-d67d20440a1a --digest sha256:db2b…bab0` (người dùng `ottimo`) | rc 0, smoke của script đạt. Tạo mạng `ottimo-prod_edge` 172.30.1.0/24, landing ở `172.30.1.11`. `LANDING_PUBLIC_API` mặc định `off` |
| 20:46:53 | Đo từ Mac `curl` ~1,5 lần/giây trong lúc đổi | **1 lần lỗi / 145 lần** (lúc đổi container, ~1 giây) |

**Kiểm từ ngoài (máy Mac, 20:47–20:48):**
- `https://ottimo.vn/` 200, `/vi/` 200. HTML: preload ảnh LCP `signature-dining` (2 thẻ theo cỡ màn hình), hero **5 slide**, slide 1 = `signature-dining` (ảnh 32), rồi `detail-kitchen`, `signature-bedroom-desk`, `garden-navy-kitchen`, `city-living`. Không `small hotel`, không `[[`, không `<form`, không gọi `form-token`/`booking-requests`.
- `#book`: ảnh mặt tiền chạng vạng (alt EN "OTTIMO at dusk…", VI "OTTIMO lúc chạng vạng…").
- Header như 24/10: CSP `default-src 'self'; script-src 'self'; …`, HSTS `max-age=31536000; includeSubDomains`, COOP/CORP, `nosniff`, `X-Frame-Options DENY`, không `X-Robots-Tag`.
- `https://www.ottimo.vn/…` 301 → `https://ottimo.vn/…`; `http://` 308; `/en/` 301; `/health`, `/v1/x`, `/v1/public/properties/dlt/form-token`, `/.env` 404. `robots.txt` `Allow: /`. Chứng chỉ Let's Encrypt YE1 tới 22/01/2027.
- Ảnh chụp trang thật (EN, toàn trang): `landing-b-live-1440.jpg` (1440 px), `landing-b-live-390.jpg` (390 px, DPR 2).
- Staging: container `ottimo-*` không bị dựng lại (uptime 37–42 giờ).

**Quay lui** (khoảng 10 giây): `sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh --rollback` → `sha-4fab25b81c45` (đã ghi `state/landing_previous_tag`, digest còn trong `state/digests`). Nếu cần trả cả bundle: `rsync -a --delete /root/ottimo-prod-bundles/infra-4fab25b-20261025-204638/ /opt/ottimo-prod/infra/` rồi chạy lệnh trên; dòng `LANDING_IP` để nguyên cũng không ảnh hưởng bundle cũ.

**Không gắn tag `landing-v*`:** environment `production` của repo chưa có secret `PRODUCTION_SSH_KEY/HOST/KNOWN_HOSTS` (`gh secret list --env production` rỗng), nên `release.yml` sẽ dừng ở job deploy. Lần này deploy tay bằng đúng script và digest mà `release.yml` dùng. Khi INV làm xong `inv-production-steps.md` phần 2–3, phát hành landing sẽ qua tag + duyệt.

**Còn mở (không đổi):** UptimeRobot cho `ottimo.vn` (ESC-029 A); form website chỉ bật cùng ngày Desk production (README 12.3).

## 16. 26/10 – staging `MFA_ENFORCED=true`, email relay, chuẩn bị app production (ORC giao, đường nhanh v1.0)

Làm từ máy Mac của INV, SSH `ottimo-admin` (khóa `ottimo_ops`). Giờ VN. Không ghi IP, không in `.env` hay bí mật. Mật khẩu tài khoản `qa.*` đọc từ tệp ngoài repo, không in ra.

### 16.1 Staging chạy đúng `2963675`

| Kiểm | Kết quả |
|---|---|
| Lượt CI 40199367309 (push `main` `2963675`) | `success`, mọi job kiểm xanh; job `deploy staging` xanh (INV duyệt). `deploy landing preview` bỏ qua (đã bỏ từ 24/10) |
| Tag đang chạy (`state/current_tag`, `deploy-history.log`) | `sha-29636757822b`, live 11:25:39 |
| Digest container api / web | `sha256:3298064f…cbfe8` / `sha256:88fb9b61…7a7246b` = **đúng** digest artifact `image-digests` của lượt CI đó |
| `/health` qua đường nội bộ (`dc exec api wget 127.0.0.1:3000/health`) | `{"status":"ok","db":"ok"}` |
| `https://desk|staff|g.staging.ottimo.vn/` | 200 cả ba |
| `ops-check` staging (11:41) | 7/7 ok (containers, j16, backup, disk, mem 83 % trống, tls, http5xx) |

Ghi chú: bundle `infra/` trên staging vẫn là `4fab25b` (24/10). Khác `main` chỉ ở phần form website US-155 (landing), staging không chạy landing nên không ảnh hưởng. Cập nhật cùng lần chạm hạ tầng staging kế tiếp.

### 16.2 Staging `MFA_ENFORCED=true`

Cơ chế của stack: cờ là biến trong `/opt/ottimo/.env` → compose đưa vào api và worker (`MFA_ENFORCED: ${MFA_ENFORCED:-false}`). Trước đó `.env` staging **không có** dòng này, nên đang là `false`.

| Giờ | Việc | Kết quả |
|---|---|---|
| 11:39:02 | Sao lưu `.env` → `state/env.before-mfa.20261026-113902` (0600 `ottimo`). Thêm 1 dòng `MFA_ENFORCED=true` | `.env` giữ `ottimo:ottimo 600`. Lần gọi `dc up` đầu bị compose từ chối vì thư mục làm việc không đọc được (không đổi gì) |
| 11:39:11–11:39:25 | `dc up --detach --wait --no-deps api worker` (từ `/opt/ottimo`, người dùng `ottimo`) | api, worker dựng lại cùng image `sha-29636757822b`, healthy sau 14 giây. **web và postgres không dựng lại**, DB không đụng |
| 11:39:26 | `printenv MFA_ENFORCED` trong api và worker | `true` / `true`. `/health` ok |

Kiểm bằng API qua `https://desk.staging.ottimo.vn` (đăng nhập → `GET /v1/me/2fa` → `GET /v1/properties/:id/rooms` → đăng xuất; không bắt đầu đăng ký 2FA, không đổi dữ liệu):

| Tài khoản (vai) | Trước (11:37) | Sau (11:39) |
|---|---|---|
| `qa.owner` (OWN, chưa 2FA) | `mfaEnrollmentRequired=false`, rooms 200 | **`mfaEnrollmentRequired=true`**, `/me/2fa` 200, rooms **403 `MFA_ENROLLMENT_REQUIRED`** |
| `qa.mgr` (MGR, chưa 2FA) | `false`, rooms 200 | **`true`**, `/me/2fa` 200, rooms **403 `MFA_ENROLLMENT_REQUIRED`** |
| `qa.fd`, `qa.fdl` (lễ tân) | `false`, rooms 200 | `false`, rooms 200 – không bị ảnh hưởng |
| `qa.hk` (buồng phòng) | – | `false`; rooms 403 `FORBIDDEN_ACTION` do vai (từ origin Desk), không liên quan 2FA |

Kết luận: đúng SEC 06.4 – OWN/MGR chưa có 2FA chỉ vào được các thao tác đăng ký; vai khác không đổi.

Ảnh hưởng cần biết:
- Từ nay ai dùng `qa.owner` / `qa.mgr` (QA, UAT của INV trên staging) phải đăng ký 2FA ở lần đăng nhập đầu. Muốn ca E2E chạy bằng hai tài khoản này thì QA dùng TOTP thử trong test.
- Lệch thứ tự `sprint-1-plan.md` 4.3 (bật sau khi INV đăng ký 2FA và OPS diễn tập 06.33): bật trước theo lệnh ORC 26/10. Rủi ro thấp: staging chỉ có dữ liệu giả, không ai bị khóa ngoài (vẫn đăng ký được).
- Quay lui: xóa dòng `MFA_ENFORCED=true` (hoặc chép lại bản `env.before-mfa.*`), chạy lại lệnh `dc up` ở trên.

### 16.3 Email: Google Workspace SMTP relay (INV lưu cấu hình 26/10)

Kiểm từ VPS, **không gửi thư** (không `RCPT`, không `DATA`): `EHLO ottimo.vn` → `STARTTLS` (kiểm chứng chỉ, TLS ≥ 1.2) → `EHLO` → `MAIL FROM:<info@ottimo.vn>` → `RSET` → `QUIT`.

| Lúc | Từ đâu | Kết quả |
|---|---|---|
| 11:40 | Máy chủ (IPv4; máy chủ không có tuyến IPv6 mặc định) | Google thấy đúng IP VPS trong lời chào. STARTTLS 220, **TLS 1.3**. `MAIL FROM` **250 2.1.0 OK**. RSET 250, QUIT 221 |
| 11:41 | Container tạm (image api `sha-29636757822b`, mạng bridge, `--read-only --cap-drop ALL`) – cùng đường NAT worker production sẽ dùng | Như trên: IP VPS, TLS 1.3, chứng chỉ hợp lệ, `MAIL FROM` 250 |

- Google **không từ chối** ở bước người gửi. Khi IP chưa được nhận, relay trả `550 5.7.x … relay` ở đây, nên không cần thử lại mỗi 15 phút.
- Giới hạn của cách kiểm: không gửi tới người nhận nên chưa chứng minh trọn vòng. Bằng chứng cuối là **thư thử 8b** (worker production gửi tới hộp thư INV) ngay sau lần deploy app production đầu tiên.
- `/opt/ottimo-prod/secrets/email_smtp_password` rỗng (đúng chế độ relay); `.env` production: `EMAIL_PROVIDER=smtp`, `EMAIL_SMTP_MODE=relay`, `smtp-relay.gmail.com:587`, `EMAIL_FROM=info@ottimo.vn`.

### 16.4 Production `desk/staff/g.ottimo.vn` – chuẩn bị (chưa deploy app)

| Hạng mục | Trạng thái 26/10 |
|---|---|
| DNS A `desk`, `staff`, `g` | Đúng IP VPS trên 1.1.1.1 và `ns1.matbao.vn`; không có AAAA |
| Edge (SNI 443 + Host 80) | Đã có tuyến `desk/staff/g.ottimo.vn` → `production-web` từ 24/10. Hiện chưa có container web production nên 443 bị đóng kết nối, 80 trả 502 – đúng dự kiến |
| `.env` production | `APP_ENV=production`, `MFA_ENFORCED=true`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0`, không `API_TAG_SUFFIX`/`TEST_SUPPORT_TOKEN`, 3 tên miền, `ACME_EMAIL=info@ottimo.vn`. **Thêm `LANDING_PUBLIC_API=off`** (11:43, sao lưu `state/env.before-prod-prep.20261026-114307`) – trước đây chỉ ngầm định `off` |
| `dc --profile landing config -q` (tag thử `sha-29636757822b`) | Hợp lệ: postgres, api, worker, web + landing |
| Bí mật production | Đủ tệp từ 24/10 (KEK, session, VAPID, khóa form, mật khẩu DB…), riêng staging. KEK chưa có bản ngoại tuyến của INV |
| Khóa `age` sao lưu production | **Mới**: sinh trên Mac INV (công cụ `age` trong container, không mạng). Khóa riêng `~/.ottimo/backup/ottimo-prod-backup-identity.txt` (0600), **khác** khóa staging. Chỉ khóa công khai lên `/opt/ottimo-prod/backup/recipients.txt` (0640 `root:ottimo`) |
| Khóa CI production (`PRODUCTION_SSH_*`) | Cặp khóa đã sinh trên Mac INV: `~/.ssh/ottimo_ci_production` (vân tay `SHA256:eLPWBo5H…rPf4`). **Chưa cài lên máy chủ**: thêm khóa vào `authorized_keys` bị hệ thống quyền của phiên chặn (tạo quyền truy cập lâu dài cần INV cho phép). INV tự cài bằng 1 lệnh (`inv-production-steps.md` phần 9) |
| Khóa kéo sao lưu ra ngoài (`rrsync -ro`) | Cặp khóa đã sinh: `~/.ssh/ottimo_backup_pull` (vân tay `SHA256:SdZM00vT…DxQE`). Chưa cài, cùng lý do, cùng lệnh phần 9 |
| GitHub environment `production` | Có: người duyệt `anhvh93-tech`, chỉ tag `v*`, `landing-v*`. **Chưa có secret** (`gh secret list --env production` rỗng). Chưa có tag nào |
| Timer `ottimo-backup@ottimo-prod`, `ottimo-ops-check@ottimo-prod` | Chưa bật – bật ngay sau deploy app đầu (kiểm `containers` sẽ báo lỗi nếu bật trước) |
| RAM / đĩa | 4,1 GB khả dụng / 4,9 GB; đĩa 15 % |

**Dừng ở đây.** Deploy app production cần (1) khóa CI cài trên máy chủ, (2) 3 secret `PRODUCTION_SSH_*` trong environment `production`, (3) ORC đẩy tag `v*` trên commit `main` có CI xanh, (4) INV duyệt lượt Release. Không deploy tay app production để không đi vòng cổng duyệt của INV (điều kiện 4 v1.0). Landing đang chạy và DNS không bị đụng.

Khi lượt Release đầu tiên chạy (DB trống, chưa có tài khoản nào nên chưa ai dùng được):
1. `deploy.sh` chạy migration, dựng api/worker/web; Caddy production xin chứng chỉ Let's Encrypt cho 3 tên miền (smoke tự thử lại ~30 giây); smoke kiểm 200 + header + `/health` + probe 404 cho cả ba.
2. OPS bật 2 timer `@ottimo-prod`, chạy `backup.sh` lần đầu, kéo về Mac bằng `pull-backups.sh`, chạy `restore-drill.sh` (cần `age` trên Mac hoặc chạy trong container như 23/10) → biên bản vào mục này (điều kiện 4).
3. Thư thử 8b (worker production → hộp thư INV).
4. Buổi khởi tạo `production-bootstrap` (README `infra/server` 12.1) **có INV ngồi cạnh**: INV đổi mật khẩu, đăng ký 2FA, cất mã khôi phục ngay trong buổi (production đã `MFA_ENFORCED=true` nên bắt buộc).

## 17. 26/10 – Sự cố lượt Release đầu `v1.0.0-rc.1` (deploy production thất bại ở bước `switch`)

Lượt Release 40288670558: tag `v1.0.0-rc.1` = `2963675`, image `sha-29636757822b` (api `sha256:3298064f…`, web `sha256:88fb9b61…`). Job "deploy production" trả `failed (step=switch, ref=20261026T075737Z-b915ac)` sau ~20 giây. Điều tra từ Mac INV qua SSH `ottimo-admin`; không ghi IP, không in giá trị `.env`/bí mật.

### 17.1 Diễn biến (log máy chủ `state/deploy-logs/ci-20261026T075737Z-b915ac.log`, giờ UTC)

| Bước | Kết quả |
|---|---|
| `config` (chốt production) | Qua: MFA, CLOCK_MODE, test switch, digest, đủ tệp bí mật, mạng edge |
| `pull` 07:57:37–39 | Kéo xong; **digest khớp** đúng bản phát hành |
| `roles` 07:57:45 | Tạo volume `ottimo-prod_pgdata` mới, postgres healthy, `02-roles.sh` áp xong (2 dòng WARNING về membership là bình thường, giống staging) |
| `migrate` 07:57:50 | **64/64** migration, CSDL production đã có lược đồ (trống dữ liệu) |
| `switch` 07:57:54 | api và worker **thoát ngay khi khởi động**: `ConfigError: Invalid configuration: PAYMENT_VIETQR_MODE must be production when vietqr is in PAYMENT_METHODS_ENABLED`. web ở `Created` (chờ api healthy) → deploy dừng. Không có tag trước nên không quay lui |

Không phải nguyên nhân (đã loại trừ): bundle `infra/` trên production **giống hệt** `main` ở `deploy.sh`, `deploy-from-ci.sh`, `dc`, `docker-compose.prod.yml` (so sha256); bí mật đủ; migration xong; Caddy/edge/chứng chỉ chưa tới lượt (web chưa chạy).

### 17.2 Nguyên nhân gốc

Mẫu `infra/server/env.production.example` (OPS viết 23/10) để `PAYMENT_METHODS_ENABLED=vietqr` + `PAYMENT_VIETQR_MODE=off`. Quy tắc (b) production của INT `integrations/common/safe-config.ts` đòi mọi phương thức có trong danh sách phải có `MODE=production` – `product/.env.example` đã ghi rõ "chép nguyên sang production sẽ FAIL có chủ đích". Staging (`APP_ENV=staging`) không áp quy tắc này nên lỗi không lộ ra trước. Chốt `config` của `deploy.sh` chỉ kiểm vài cờ bằng bash, không chạy bộ kiểm cấu hình của chính image, nên lỗi chỉ lộ ở bước `switch` (sau migration).

Đúng nghiệp vụ v1.0 (decision-log 23/10: "cọc VietQR" thuộc lõi v1.0) → giá trị đúng là `PAYMENT_VIETQR_MODE=production`. Với VietQR, `production` chỉ là sinh chuỗi QR tại chỗ tới tài khoản trong tham số `payment_receiving_account` (OWN nhập, xác nhận lại mật khẩu, audit) – không gọi dịch vụ ngoài, không chuyển tiền. Code api không đọc biến này ở chỗ nào khác ngoài bộ kiểm.

### 17.3 Kiểm chứng trên máy chủ (không đổi gì, container tạm `--rm --no-deps`, image `sha-29636757822b`, `.env` + bí mật production, chỉ ghi đè 1 biến `PAYMENT_VIETQR_MODE=production`)

| Kiểm | Kết quả |
|---|---|
| `loadConfig(resolveFileSecrets(env))` | `CONFIG_OK appEnv=production mfa=true` – không còn lỗi cấu hình nào khác |
| `createRuntime()` (thêm kiểm vai DB `assertSafeDbRole` + đồng hồ production, nối CSDL production) | `RUNTIME_OK` |
| `ottimo.vn` / `desk.staging.ottimo.vn` / `desk.ottimo.vn` | 200 / 200 / 000 (đúng: web production chưa chạy) |

### 17.4 Đã sửa

1. **Repo (commit dưới đây):**
   - `env.production.example`: `PAYMENT_VIETQR_MODE=production` + chú thích quy tắc (b).
   - `deploy.sh`: bước mới **`appconfig`** ngay sau `pull` (và kiểm digest), **trước** `roles`/`migrate`/`switch`: chạy `loadConfig()` của chính image mới với `.env` + bí mật của stack, cho cả api và worker, container tạm `--rm --no-deps`. Lỗi → `failed (step=appconfig, …)`, log máy chủ ghi đúng dòng `ConfigError` (chỉ tên biến). Bắt cả lớp lỗi này ở mọi môi trường, trước khi đụng CSDL hay container đang chạy.
   - `ci/test-deploy-from-ci.sh`: ca (g) – image từ chối `.env` → `step=appconfig`, không `up`, không `migrate`. Chạy local trong `ubuntu:24.04`: **toàn bộ OK** (a–g); shellcheck 0.10.0 `-S warning`: sạch.
2. **Máy chủ – CHƯA làm được:** sửa 1 dòng `/opt/ottimo-prod/.env` (`PAYMENT_VIETQR_MODE=off` → `production`, có sao lưu `state/env.before-vietqr-mode.*`) bị **hệ thống quyền của phiên chặn** (đổi cấu hình production). Không tìm đường vòng. Lệnh một dòng cho INV: `inv-production-steps.md` **phần 10**.

### 17.5 Trạng thái hiện tại production (để biết, không nguy hại)

- `ottimo-prod-postgres-1` healthy, CSDL có 64 migration, **không có dữ liệu, không có tài khoản**.
- `api`, `worker` đang khởi động lại liên tục (restart policy, cùng `ConfigError`); `web` ở `Created`. Không mở ra Internet (edge 443 đóng kết nối cho `desk/staff/g.ottimo.vn` vì web chưa chạy). Lượt deploy kế tiếp dựng lại cả ba.
- Landing `ottimo-prod-landing-1` không bị đụng (Up, healthy). Staging, edge không đổi.

### 17.6 Cách chạy lại

- **Không cần tag rc mới.** Image `2963675` đúng; lỗi nằm ở `.env` máy chủ. Bundle `infra/` trên production (bản cũ, chưa có bước `appconfig`) vẫn deploy đúng sau khi sửa `.env`.
- Thứ tự: (1) INV chạy phần 10.1 → in `1`; (2) ORC bấm **"Re-run failed jobs"** trên lượt 40288670558 (cùng tag, cùng digest); (3) INV duyệt "Review deployments".
- Bước `appconfig` (commit mới) lên máy chủ ở lần làm mới bundle `infra/` kế tiếp (OPS, cùng lần cập nhật bundle staging – mục 16.1).
- Sau khi xanh: làm tiếp mục 16.4 "Khi lượt Release đầu tiên chạy" bước 1–4.

## 18. 26/10 – Sửa theo SEC `reviews/SEC-sprint1.md` mục 3 (Phản hồi & sửa)

### 18.1 Thủ tục 06.33 – sửa lần 3 (bản ngoài repo, SEC 3.7)
Tệp vẫn ở `~/.ottimo/runbooks/` trên Mac INV (thư mục 0700, tệp 0600). Repo chỉ ghi đã sửa gì, không chép nội dung.

| Nhận xét SEC | Đã sửa |
|---|---|
| (a) Tài khoản diễn tập | Cấm dùng mọi `qa.*` (có TOTP thử của QA, đang chạy QA-3/E2E). Ưu tiên tài khoản OWN dùng thử của INV trên staging (G7-4, hợp nhánh "INV tự chạy"). Nếu tới B1 chưa có thì dùng một tài khoản OWN riêng, chỉ để diễn tập, khóa lại sau buổi. Phải đăng ký 2FA trước khi diễn tập. Báo QA lịch qua ORC trước ít nhất 1 ngày |
| (b) Tài khoản SSH | Chốt **một** tài khoản: tài khoản quản trị cá nhân INV đang dùng (khóa cá nhân có passphrase). Lệnh docker chạy qua `sudo -u` người dùng triển khai. Không dùng khóa CI, khóa kéo sao lưu, hay tài khoản triển khai trực tiếp. Đã kiểm chỉ đọc trên staging: `dc ps` và `dc exec api ls dist/admin/` chạy được bằng đúng tài khoản này, có CLI reset. Có ghi chú rằng `sudo` lưu dòng lệnh (không có bí mật) vào nhật ký hệ thống |
| (c) Mã phiếu | Người chứng kiến cấp mã khi được báo trước lúc chạy. Người chạy ghi vào biên bản **trước** khi gõ lệnh. `NN` = số thứ tự trong ngày theo biên bản. Không có mã thì không chạy |
| (d) Câu xác minh khi người yêu cầu khác người chạy | Hai câu cũ chỉ dùng khi người yêu cầu là INV. Người khác dùng câu INV soạn sẵn (cất trong trình quản lý mật khẩu). Chưa có câu soạn sẵn thì chỉ dựa vào gặp mặt + gọi lại số có sẵn + người chứng kiến |
| (e) Người chứng kiến ký | Biên bản giấy ký tay, hoặc tin nhắn xác nhận của người chứng kiến (chụp, lưu 0600 cạnh biên bản) |
| (f) Báo bằng điện thoại | Email là kênh chính. Điện thoại chỉ dự phòng khi email lỗi. Trước khi thư thử 8b tới hộp thư thì báo song song cả hai |
| (g) Bản trong trình quản lý mật khẩu | Thêm mục 7: sau mỗi lần sửa, INV chép lại vào trình quản lý mật khẩu. Bản đúng là bản có ngày sửa mới hơn. **INV cần chép bản lần 3 (26/10)** |

Vẫn là **bản nháp**. SEC duyệt sau buổi diễn tập B1 có người chứng kiến thật.

### 18.2 Dependabot (SEC 3.5)
- Đã đóng trên GitHub, kèm lý do ngắn dẫn SEC 3.5:
  - **#2** (`react-router` SSR hydration): lý do `inaccurate`. admin-web là SPA, không SSR;
  - **#7–#14** (`fast-uri`): lý do `not_used`. Gói này chỉ phân giải `$ref` của schema do đội viết, đầu vào kiểm bằng zod. API chỉ nhận `fix_started|inaccurate|no_bandwidth|not_used|tolerable_risk`, nên dùng `not_used` thay cho `vulnerable_code_not_used`.
- Còn mở 7 cảnh báo:
  - #3 (`react-router`): dời v1.1;
  - #4–#6, #15–#17 (`nodemailer`): v1.0.x.
- PR #9 (nodemailer 10.1.4) chạy lại trên nhánh của đội: `ops/nodemailer-10.1.4` (cherry-pick `b59b562` lên `main`), **PR #10**. Không gộp khi CI chưa xanh. ORC quyết việc gộp. Khi #10 gộp, đóng #9.

### 18.3 README `infra/server` 12.1 (SEC S-2)
Sửa câu chữ: kiểm terminal của wrapper chặn được pipe, `>`, `| tee`, tmux/screen. **Không chặn được `script`**, vì `script` tự cấp pty; chỉ chặn bằng thủ tục.

### 18.4 Để sau
Xóa `state/env.before-vietqr-mode.*` trên production **sau khi** lượt Release chạy lại đạt (ORC báo). Không đụng `.env` production.

## 19. 26/10 – Sau lần deploy production đầu (QC `v1-gate-checklist.md` 5.1 việc 10)

Bối cảnh: chạy lại lượt Release 40288670558 → `deploy sha-29636757822b: ok` (08:21:55Z), sau khi INV sửa `.env` (phần 10.1). Mọi việc dưới đây làm qua SSH `ottimo-admin` (khóa `ottimo_ops`), giờ VN. Không ghi IP hay bí mật.

### 19.1 Dọn bản `.env` cũ (SEC 3.2)
Đã xóa `state/env.before-vietqr-mode.20261026`. Trong `state/` còn 2 bản cũ hơn là `env.before-landing-ip.*` (25/10) và `env.before-prod-prep.*` (26/10). Hai bản này **chưa xóa** vì ORC chỉ giao xóa bản `vietqr`. Đề xuất xóa nốt khi SEC-G1/G2 xong.

### 19.2 Sao lưu production (G4-5)

| Giờ | Việc | Kết quả |
|---|---|---|
| 15:23 | `systemctl enable --now ottimo-backup@ottimo-prod.timer ottimo-ops-check@ottimo-prod.timer` | Hai timer bật. Lịch sao lưu 03:00 hằng ngày (lệch ngẫu nhiên tối đa 5 phút), lần đầu 27/10 03:01. `ops-check` chạy 30 phút một lần |
| 15:23 | `ops-check` lần đầu | 6/7 ok. `FAIL backup: no successful backup recorded`: đúng dự kiến vì chưa có bản sao lưu nào |
| 15:24 | `systemctl start ottimo-backup@ottimo-prod.service`: chạy lần đầu khi DB còn trống | OK: 4 tệp mã hóa `age` + 4 tệp `.sha256` trong `/var/backups/ottimo-prod` (0700/0600 `ottimo`). Dump ~690 KB (lược đồ 64 migration) |
| 15:25 | `ops-check` chạy lại | **7/7 ok**: containers, j16, backup 0 h, disk 16 %, mem 78 %, tls, http5xx |
| 15:26 | `pull-backups.sh` về Mac bằng khóa kéo (`rrsync -ro`) | Lần đầu **lỗi trên macOS**. Gốc lỗi: rsync có sẵn của macOS là `openrsync`, không nhận `--chmod`, và dòng lệnh phía server của nó bị `rrsync` từ chối (`invalid rsync-command syntax`). Chạy script trong container `alpine:3.20` (rsync 3, openssh), gắn khóa chỉ đọc, `known_hosts`, thư mục đích: **đạt**, 4 tệp `.age` + checksum khớp, `~/.ottimo/backups/ottimo-prod` 0700, tệp 0600 |
| 15:27 | Khóa kéo mở shell? | `ssh … 'id'` → `rrsync error: SSH_ORIGINAL_COMMAND does not run rsync`. Đúng: khóa này không mở được shell |

Lệnh kéo đã chạy (thay `<IP>`; dùng tới khi Mac có rsync 3):
```bash
docker run --rm -v "$PWD/product/infra/server/bin/pull-backups.sh":/pull.sh:ro -v ~/.ssh/ottimo_backup_pull:/k/key:ro \
  -v ~/.ssh/known_hosts:/root/.ssh/known_hosts:ro -v ~/.ottimo/backups/ottimo-prod:/out alpine:3.20 \
  sh -c 'apk add -q --no-cache rsync openssh-client bash coreutils >/dev/null && cp /k/key /tmp/key && chmod 600 /tmp/key && bash /pull.sh --host <IP> --key /tmp/key --to /out'
```
Sửa repo `pull-backups.sh`:
- bỏ `--chmod`, thay bằng `chmod` sau khi kéo (umask 077 vẫn giữ);
- gặp `openrsync` thì dừng, mã thoát 2, kèm lời nhắc dùng rsync 3 (`brew install rsync`) hoặc chạy trong container.

README `infra/server` (dòng "Bản sao lưu ngoài máy") ghi cả hai cách. Shellcheck sạch.

**Chưa làm (để B2):** diễn tập khôi phục (`restore-drill.sh`) cần khóa giải mã của INV, INV có mặt. Bản sao lưu lúc DB trống chỉ dùng để kiểm đường ống; diễn tập thật làm trên bản sao lưu chụp sau khi có dữ liệu B2.

### 19.3 Cấu hình đang chạy và RAM (G4-3, G2-6, G4-11)
- `printenv` trong container: api `MFA_ENFORCED=true`, `APP_ENV=production`, `CLOCK_MODE=system`; worker giống hệt.
- `state/current_tag` = `sha-29636757822b`. Container: api, web healthy; worker, postgres chạy; landing không bị đụng.
- RAM cả VPS lúc 15:25 (staging + production + landing + edge cùng chạy, chưa có người dùng): `free -m` cho tổng 4.917 MB, dùng 1.020, **khả dụng 3.896 (79 %)**, swap 0/2.047. Đĩa 16 % (7,8/55 GB).

| Container | RAM | Giới hạn |
|---|---|---|
| prod api / worker / postgres / web / landing | 62 / 42 / 49 / 38 / 21 MB | 1 GB / 768 MB / 1 GB / 256 MB / 128 MB |
| staging api / worker / postgres / web | 78 / 50 / 40 / 15 MB | 512 / 384 / 512 / 256 MB |
| edge | 14 MB | 128 MB |

Tổng container ~410 MB. Khớp ước tính mục 3; còn xa ngưỡng `mem` (< 10 %). Đo lại sau 1 tuần chạy thật.

### 19.4 Chuẩn bị `production-bootstrap` cho B2 (G2-7) – **chưa chạy**

| Kiểm (chỉ đọc) | Kết quả |
|---|---|
| Wrapper trên máy chủ | sha256 giống `main` (`d3da078c…`) |
| CLI trong image production | Có `dist/admin/production-bootstrap-cli.js` và `mfa-operator-reset-cli.js` |
| DB production | `app_user` 0, `property` 0, `room` 0: trống, đúng điều kiện chạy lần đầu |
| `sudo` có ghi lại màn hình không | Không. `sudoers` chỉ có `use_pty`, không có `log_output`/`iolog`, không có `/var/log/sudo-io`. Mật khẩu tạm in qua `sudo -u ottimo` không bị ghi lại |

README 12.1 sửa theo thực tế:
- SSH bằng `ottimo-admin` (cùng tài khoản thủ tục 06.33), `cd /tmp`, lệnh chạy qua `sudo -u ottimo`, có dấu cách đầu dòng và `HISTCONTROL=ignorespace`;
- lệnh kiểm `mfa.enrolled` cũng chạy qua `sudo -u ottimo`;
- nhánh "làm lại từ DB trống" đổi từ `dc down` sang `dc rm --stop --force api worker web postgres` + xóa 2 volume, để không gỡ container landing đang phục vụ `ottimo.vn`.

Kịch bản B2 phần 1 (OPS chạy, INV ngồi cạnh):
1. Mở SSH mới, gõ `export HISTCONTROL=ignorespace`, `cd /tmp`, rồi chạy lệnh ở README 12.1 (có dấu cách đầu dòng). Điền `--owner-username`, `--owner-name` theo INV, `--operator` là tên người chạy.
2. Mật khẩu tạm hiện trên màn hình. INV đọc và gõ trực tiếp vào `desk.ottimo.vn`. Không chụp, không chép.
3. Chạy `clear`, kiểm `history | tail -3`, đóng phiên.
4. INV đổi mật khẩu, đăng ký 2FA, cất 10 mã khôi phục (giấy, 2 nơi).
5. Mở phiên mới, kiểm `mfa.enrolled`.

### 19.5 Edge đang chạy = `main` (SEC-G1/G2, G7-5, SEC 3.1 OPS-01)

| Kiểm | Kết quả |
|---|---|
| `edge.sh`, `edge/docker-compose.edge.yml` trên máy chủ | sha256 **giống** `main` (`73a4db68…`, `ca7ebe45…`) |
| `nginx.conf` đang chạy so với bản `edge.sh render` mới (render vào thư mục tạm, có `nginx -t`) | **Giống hệt** (bỏ dòng tiêu đề có giờ sinh). Tệp trong container = tệp trên đĩa (cùng sha256) |
| Nội dung | `worker_processes auto`, `worker_rlimit_nofile 32768`, `worker_connections 8192`, `limit_conn` 100/IP ở 443 và 20/IP ở 80, `preread_timeout 5s`. 8 tên miền: 3 staging, 3 production, `ottimo.vn` + `www` → landing |
| Container `ottimo-edge-edge-1` | image `nginx:1.30.6-alpine@sha256:47928bf6…`, `nofile 32768`, RAM 128 MB, pids 100, `read_only`, `cap_drop ALL`. Chạy từ 24/10 08:15 |

→ Bundle edge đang chạy là bản có giới hạn (OPS-01). Phần này SEC dùng cho SEC-G1/G2.

### 19.6 Thư thử 8b – đã chuẩn bị, **chưa gửi**
- Script mới `infra/server/mail-test.mjs`:
  - không nằm trong image, không đặt trên máy chủ; đẩy từ Mac vào một container worker tạm qua stdin;
  - đi đúng đường của worker: relay theo IP, TLS ≥ 1.2, `EMAIL_FROM`, mạng `egress`;
  - chỉ in một dòng `verified|sent|failed (<mã>)`, không in địa chỉ, không in chữ của nhà cung cấp.
  - Thư: tiếng Anh dẫn, tiếng Việt hỗ trợ, màu và font OTTIMO, không emoji. Tiêu đề: "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email".
- **Đã chạy thử chế độ chỉ kiểm (`MAIL_TEST_VERIFY_ONLY=1`) trên production: `mail-test: verified`** (kết nối, EHLO, STARTTLS; không gửi gì).
- Gửi thật (chỉ khi ORC báo INV sẵn sàng mở hộp thư; thay `<IP>`):
  ```bash
  ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP> 'cd /tmp && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc run --rm --no-deps -T -e MAIL_TEST_TO=info@ottimo.vn --entrypoint node worker --input-type=module -' < product/infra/server/mail-test.mjs
  ```
  Đạt khi script in `mail-test: sent` **và** INV thấy thư trong hộp `info@ottimo.vn`, kể cả mục Spam. Nếu thư vào Spam, ghi lại để INV kiểm SPF/DKIM của tên miền.
- Thư bảo mật thật ("OTTIMO – Security notice…") chỉ có khi xảy ra sự kiện 2FA. Thư thử này kiểm đúng đường gửi đó.

## 20. 27/10 – `v1.0.0-rc.3` và `landing-v1.0.0` lên production (ORC làm thay OPS)

| Việc | Kết quả |
|---|---|
| Staging: duyệt lượt CI push 40416908930 (`70fe734`) theo cho phép của INV | `deploy staging` đạt; `ottimo-api/web/worker` chạy `sha-70fe734e9077`, healthy. QA rc.3 đạt (`qa/qa3-rc1.md` mục 15) |
| Tag `v1.0.0-rc.3` → `70fe734`. Lượt Release `rc.2` (40353906172) giữ nhóm chạy production nên chặn `rc.3` → từ chối (INV bấm Reject, ORC gửi lại `rejected` qua API) | `rc.2` kết thúc `failure` (bị từ chối, không deploy) |
| Lượt Release `rc.3` (40426035072), INV đồng ý trong chat | Đạt. `ottimo-prod-api/web/worker` = `sha-70fe734e9077`, healthy; desk/staff/g.ottimo.vn 200. DB production vẫn rỗng (chờ B2) |
| Tag `landing-v1.0.0` → `70fe734` (landing chỉ khác bản 25/10 ở `4796433` – nhận phòng 12:00). Repo không có biến `LANDING_BOOKING_FORM` → form tắt. Lượt Release 40433751349, INV đồng ý trong chat | Đạt. `ottimo-prod-landing-1` = `ottimo-landing:sha-70fe734e9077`, healthy |

**Kiểm từ ngoài:** `ottimo.vn/` và `/vi/` 200; câu "Check-in from 12:00 when your room is ready; it always is by 14:00. Check-out by 12:00." (VI: "Nhận phòng từ 12:00 khi phòng đã sẵn sàng – và phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00.") ở Tiện nghi và FAQ; JSON-LD `checkinTime` 12:00, `checkoutTime` 12:00; không `<form`; CSP, HSTS, `X-Frame-Options DENY` như cũ. Từ nay landing phát hành qua tag `landing-v*` + INV duyệt (khóa CI production đã có).

**Quay lui landing:** `sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh --rollback` → `sha-d67d20440a1a`.

## 21. 27/10 – kiểm sẵn sàng B2

Buổi B2 trên bản thật: 09:00 thứ Tư 28/10 (INV chốt); kịch bản ở `b2-runbook.md` (cùng thư mục). Kiểm từ Mac INV qua SSH `ottimo-admin` (khóa `ottimo_ops`), 10:41–10:52 giờ VN. Không in `.env`, mật khẩu, khóa; không ghi IP. **Không** chạy `production-bootstrap`.

### 21.1 Production – chỉ đọc

| Kiểm | Kết quả |
|---|---|
| Container `ottimo-prod-*` | api, web, landing **healthy** (Up 2 giờ, từ lượt Release rc.3); worker Up; postgres healthy (Up 20 giờ). Edge Up 3 ngày, healthy. Staging api/web/postgres healthy |
| Tag / image | `state/current_tag` = `sha-70fe734e9077`; `deploy-history.log` dòng cuối `2026-10-27T01:36:26Z sha-70fe734e9077` và `01:39:12Z landing sha-70fe734e9077`. Image container api/worker `sha256:18145bc2…`, web `sha256:ee026394…` = đúng `state/digests/sha-70fe734e9077` = RepoDigest GHCR. Landing `sha-70fe734e9077` |
| Cờ trong container (api = worker) | `APP_ENV=production`, **`MFA_ENFORCED=true`**, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0`, `EMAIL_PROVIDER=smtp`, `EMAIL_SMTP_MODE=relay` |
| `/health` nội bộ | `{"status":"ok","db":"ok"}` |
| DB | `app_user` 0, `property` 0, `room` 0 – **trống**, đúng điều kiện bootstrap. Migration **65** (rc.1 là 64) |
| Edge / TLS (từ Mac) | `https://desk|staff|g.ottimo.vn/` 200 / 200 / 200 (~0,26 s), `ottimo.vn` 200. Chứng chỉ Let's Encrypt (YE1/YE2) tới 24/01/2027. Header Desk: CSP `default-src 'self'; script-src 'self'…`, HSTS `max-age=31536000; includeSubDomains`, `X-Frame-Options DENY`, `X-Robots-Tag: noindex, nofollow`. `/health`, `/v1/x`, `/.env` 404; `http://` 308 → https. DNS `desk/staff/g`: 1 bản ghi A, không AAAA |
| Timer | `ottimo-backup@ottimo-prod` (lần cuối 27/10 03:02, kế tiếp 28/10 03:03), `ottimo-ops-check@ottimo-prod` mỗi 30 phút; staging 2 timer như cũ |
| Sao lưu gần nhất (trước kiểm) | 27/10 03:02:49, `OK: 8 encrypted files`, thoát 0 – nhưng chụp **trước** rc.3 (64 migration) nên không dùng cho diễn tập với image rc.3 |
| `ops-check` production | **7/7 ok**: containers, j16 (0 cơ sở), backup, disk 16 %, mem 76 %, tls, http5xx 0 |
| RAM / đĩa | RAM khả dụng 3.843 / 4.917 MB (78 %), swap 0; đĩa `/` 16 % (8,2 / 55 GB) |
| SMTP relay | `mail-test.mjs` chế độ chỉ kiểm (`MAIL_TEST_VERIFY_ONLY=1`, container worker tạm) → **`mail-test: verified`**. **Không gửi thư** – thư thử 8b gửi tại B2 phần 5–6 |
| `production-bootstrap` | Wrapper máy chủ sha256 `d3da078c…` = `main`. Image rc.3 có `dist/admin/production-bootstrap-cli.js`, `production-defaults.js`, `mfa-operator-reset-cli.js`. `git diff 70fe734 HEAD` trên `product/services`, `product/apps`: **không khác** → giá trị mặc định trong image = `main` |
| KEK | `secrets/data_kek_current` có, 0400, 44 byte. Chưa có bản ngoại tuyến (B2 phần 2). Lệnh fingerprint của B2 phần 2 thử trên tệp KEK **staging** (chỉ in 8 ký tự băm) |
| Báo động A7 | `HEARTBEAT_URL`, `ALERT_WEBHOOK_URL` trong `.env` production **rỗng** → G4-10 còn mở (chặn D, không chặn B2) |
| GitHub | Không có lượt Release/deploy nào đang chờ duyệt |

### 21.2 Bản sao lưu chạy sẵn + kéo về Mac (B2 phần 5)

| Giờ | Việc | Kết quả |
|---|---|---|
| 10:43:35 | `systemctl start ottimo-backup@ottimo-prod.service` | `OK: 12 encrypted files`. Bản `20261027T034335Z`: dump 689.619 byte (lược đồ 65 migration, DB trống), counts, blobs, purge_journal |
| 10:43:52 | `pull-backups.sh` trong container `alpine:3.20` (lệnh 19.2, khóa `ottimo_backup_pull` `rrsync -ro`) | `pull-backups: 12 encrypted files`, mọi checksum khớp; `~/.ottimo/backups/ottimo-prod` 0700, tệp 0600; `.last_pull` 2026-10-27T03:43:52Z |
| 10:47 | Kiểm lại checksum 4 tệp `20261027T034335Z` trên Mac | OK cả 4 |

**Không giải mã.** Khóa `~/.ottimo/backup/ottimo-prod-backup-identity.txt` không được đọc hay dùng. Diễn tập thật ở B2 làm trên bản chụp **sau** phần 1–4, có dữ liệu của buổi. Bản 10:43 là đường dự phòng (đúng lược đồ rc.3, DB trống).

### 21.3 Đường diễn tập trên Mac – đã thử trọn bằng dữ liệu tổng hợp

- Mac là **arm64**, không có `age`; rsync là `openrsync`. Image api là **amd64**, chạy giả lập (`node` x64 v22.23.3 trả lời ngay).
- **Runner `ottimo-drill-runner:local`** dựng trên Mac: `alpine:3.20` + `bash age openssl coreutils diffutils docker-cli`. Nó chạy `restore-drill.sh` thật của repo qua docker socket của Mac.
  - Thư mục `product/` được gắn **cùng đường dẫn tuyệt đối**, để lệnh gắn `02-roles.sh` mà script truyền cho Docker trỏ đúng tệp trên Mac.
  - Giải mã nằm trong tmpfs của container.
- Image `ghcr.io/anhvh93-tech/ottimo-api:sha-70fe734e9077` đã kéo về Mac (digest `18145bc2…`, đúng bản đang chạy).
- **Thử trọn 10:51**, không dùng dữ liệu hay khóa production:
  - khóa `age` dùng một lần;
  - PostgreSQL 17 (cùng digest) + `02-roles.sh`;
  - migrate bằng image rc.3;
  - `pg_dump` + counts + blobs rỗng + purge_journal, mã hóa và checksum như `backup.sh`;
  - chạy `restore-drill.sh` qua runner.

  Kết quả: **ĐẠT – /health ok, 5 giây, khớp 100 %**, `migrations 65`, các bảng khác 0. Môi trường tự xóa. Không còn container, volume, mạng `ottimo-syn*` / `ottimo-restore*`; thư mục tạm trong scratchpad đã xóa.
- Bẫy đã gặp: Terminal macOS chạy **zsh**, mà zsh hiểu `$P:ro` là modifier `:r` → gắn sai thư mục. Lệnh trong `b2-runbook.md` 2.5 chạy qua `bash -c` và đặt biến trong dấu nháy.

### 21.4 Lỗ hổng: thư "Security notice" không có người nhận

- Cách bộ gửi thư nhân viên chọn người nhận (`jobs/email-dispatch.ts`): chỉ gửi tới `app_user.email` khác rỗng.
  - `production-bootstrap` không đặt email cho chủ.
  - API người dùng (`users.controller.ts`) chỉ có `phone`, không có `email`.
  - Desk không có ô nhập email.
- Đọc **staging** 27/10 (chỉ đếm):
  - 0/27 người dùng có email;
  - outbox `staff.email`: `receiving_account_changed` **dead `NO_RECIPIENT`** ×3, `mfa_reset_by_operator` dead `NO_RECIPIENT` ×1.
- Hệ quả trên production: thư bảo mật theo SEC 06.15 / 06.33 / Q51-6 (đổi tài khoản nhận tiền, khôi phục 2 bước, dùng mã khôi phục, khóa tài khoản) **không tới ai**. Thông báo trong app vẫn có.
- Thư thử 8b (B2 phần 6) chỉ chứng minh đường gửi `info@ottimo.vn` thông, **không** chứng minh thư bảo mật tới chủ.
- **Đề xuất cho ORC/SEC/BE**, cần quyết trước 09:00 28/10 nếu muốn vá tạm trong buổi:
  - (A) BE thêm `--owner-email` cho bootstrap hoặc ô email trong "Người dùng & vai" ở v1.0.1, trước D nếu kịp;
  - (B) tạm thời: tại B2, INV tự gõ một lệnh SQL đặt email chủ = `info@ottimo.vn` (địa chỉ công khai). Lệnh này có audit tay, BE soạn và SEC duyệt;
  - (C) chấp nhận đến v1.0.1; kênh dự phòng là điện thoại (06.33 mục báo).

  OPS nghiêng về **A + C**: không ghi thẳng vào DB production ngoài app. Đây là việc kỹ thuật/bảo mật, không có chi phí, nên **không lập ESC**.

### 21.5 Chưa sẵn sàng / cần biết (không chặn B2)

| # | Việc | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| 1 | CI `main` **đỏ**: lượt 40445386390 (`3219cc0`) – Prettier báo `product/tests/fixtures/br-examples.json` (commit DOM BR v0.4.8). Lượt 40442832436 (`25042ae`) – `playwright install-deps` lỗi apt (chập chờn) | Không có image mới để vá nóng cho tới khi xanh. Không ảnh hưởng B2 (không deploy) | ORC giao tác giả chạy `prettier --write` tệp fixture; chạy lại job E2E. OPS không sửa tệp của vai khác |
| 2 | Bundle `infra/` production: `deploy.sh` cũ, **chưa có bước `appconfig`** (sha `c4d8d7df…` ≠ `main` `949ac32a…`). `backup.sh`, `restore-drill.sh`, `ops-check.sh`, `backup-counts.sql`, `production-bootstrap.sh` = `main` | Lần deploy sau vẫn chạy, chỉ thiếu chốt bắt lỗi cấu hình sớm | Làm mới bundle sau B2, ngoài giờ khách, không vào D−1/D (mục 17.6) |
| 3 | Báo động A7 chưa gắn (`HEARTBEAT_URL`, `ALERT_WEBHOOK_URL` rỗng); UptimeRobot chưa có xác nhận | G4-10 – chặn ngày D | INV tạo tài khoản. Gắn bằng lệnh `b2-runbook.md` 2.7 (dấu nhắc ẩn) |
| 4 | Khóa giải mã sao lưu production (`ottimo-prod-backup-identity.txt`, 184 byte, **không có passphrase**) nằm **cùng Mac** với các bản sao lưu đã kéo về | Mất/lộ Mac là lộ cả bản sao lưu (ảnh giấy tờ còn lớp mã hóa KEK; phần dữ liệu không mã hóa riêng trong DB thì đọc được) | SEC xem. OPS đề xuất: sau B2, khi INV đã có 2 bản (A8), xóa khóa khỏi Mac; mỗi lần diễn tập thì đặt lại tạm (cách ở `b2-runbook.md` 2.5). Kéo bản sao lưu không cần khóa này |
| 5 | Tệp bí mật production thuộc `ottimo-admin` (uid 1000 trùng uid `node` của container – cách `init-secrets.sh` cấp quyền cho container) | `ottimo-admin` đọc được bí mật không cần `sudo`. Tài khoản này vốn đã có `sudo` không mật khẩu, nên không mở thêm quyền | Để biết; SEC ghi nhận |
| 6 | Diễn tập trên Mac phụ thuộc Docker Desktop + runner dựng tại chỗ | Mất image thì dựng lại 1 lệnh (~10 giây, cần mạng) | Lệnh dựng lại ở `b2-runbook.md` 2.5 |
