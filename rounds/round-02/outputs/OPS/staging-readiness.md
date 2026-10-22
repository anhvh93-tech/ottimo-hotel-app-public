# OPS – Sẵn sàng dựng staging (R-5)

- Người viết: OPS | Round 2 – Bước 4 (quay lại một lần, đợt 2) | 21/10/2026 | Kiểm trên cây làm việc tại `72895de`
- Căn cứ: `qc/round-qc-gate.md` mục 5 (R-5, R-6), `product/docs/hosting-plan.md` (ESC-002 A, gói H-B), `reviews/s4-SEC.md` E.2, E.6, `outputs/OPS/s4-env-0076.md` (BUG-R2-210), `product/infra/server/README.md`
- Hướng dẫn cho INV: `rounds/round-02/inv-staging-checklist.md`
- Không bật job deploy, không đổi cài đặt GitHub. Lượt 1 chỉ sửa tài liệu. Lượt 2 (cùng ngày, theo SEC E.8) sửa forced command, `ci.yml`, bootstrap: xem mục 7, chờ SEC review.

## 1. Kết luận

**Phía repo đủ để dựng staging trong ≤ 3 ngày làm việc** kể từ khi INV gửi IP + tên miền và làm xong Bước 1–5 của checklist.
- Không còn việc code nào chặn R-5.
- Còn **4 điểm cần quyết hoặc làm thêm** trước hoặc trong lúc dựng: mục 3, R5-01…R5-04. Không điểm nào chặn ngày 1.
- Chặn duy nhất: INV chưa gửi thông tin (ESC-028 đang chờ).

## 2. Kiểm từng hạng mục

| # | Hạng mục | Trạng thái | Bằng chứng | Còn thiếu |
|---|---|---|---|---|
| 1 | Job `deploy-staging` (`.github/workflows/ci.yml`) | **Sẵn sàng, đang tắt** | Điều kiện chạy: push `main` + `vars.PUBLISH_IMAGES == 'true'` + `vars.STAGING_DEPLOY == 'true'`. Có `environment: staging`, `needs: publish-images`, `concurrency` không hủy lượt đang chạy. SSH `BatchMode`, `StrictHostKeyChecking=yes`. Khóa riêng ghi tệp 0600, có `trap` xóa. Khóa trên VPS bị ép lệnh `deploy-from-ci.sh`, chỉ nhận `deploy sha-<hex>` | `gh api …/environments` → `total_count: 0`, chưa có biến nào. Đúng thứ tự E.6 (1): tạo environment có bảo vệ trước, đặt khóa sau. Xem R5-01 (log công khai), R5-02 (GHCR) |
| 2 | Caddyfile production (`infra/caddy/Caddyfile.prod`) | **Đạt** | Chạy lại tại chỗ hôm nay: `check-caddy-prod.sh --stub` → "OK: … headers, probes, body limit and log masking"; `check-compose.sh` → OK. 3 origin, HSTS, CSP, che `/g/*`, bỏ query string và header khỏi log, `/health` chỉ mạng nội bộ hoặc `HEALTH_ALLOW_IPS`, 413 theo giới hạn | Site landing (`staging.<tên-miền>`, ADR-014) **chưa có** trong Caddyfile và image web. Không thuộc R-5; làm khi landing qua cổng LP-v1 (R5-05) |
| 3 | Migration là bước riêng | **Đạt** | `deploy.sh` bước 3: dịch vụ một lần `migrate` (`ottimo_migrator`) chạy **trước** khi api/worker đổi image. Sau đó so `count(drizzle.__drizzle_migrations)` với journal trong image, lệch thì dừng. Log: dòng `migrations: N applied / M in the image journal` trong output CI, journal `ottimo-deploy`, `state/deploy-history.log` | QC cần "bước riêng có log": đề xuất QC nhận dòng log này trong run CI. Không tách thành step GitHub riêng (khóa CI chỉ được một lệnh) |
| 4 | Thủ tục OPS của BUG-R2-210 | **Giữ, áp cho staging** | Staging lần đầu lên **DB trống**: migrate từ 0000, rồi seed DS-E bằng `dc --profile seed run --rm seed` | Thủ tục bắt buộc ở mục 4 bước N1-3 và N2-2. Giữ tới khi R3-Q21 Closed (R3 plan V4) |
| 5 | Smoke sau deploy | **Đạt trên VPS; bên ngoài cần bổ sung** | `deploy.sh` bước 4: `/health` trong container; `rolconfig` của `ottimo_app`; worker chạy; volume blob chỉ ở api/worker; 3 tên miền đi qua Caddy bằng tên thật + chứng chỉ thật (`--resolve` về 127.0.0.1): mã 200, header so khớp đúng từng chữ với `expected-headers.sh`, `/health` 200, 4 probe trả 404. Thêm: `/g/<token giả>` qua 443 và 80 (308), log Caddy không lộ token, query, cookie. Lỗi → tự quay về tag trước | `/health` **từ Internet** trả 404 (cố ý, FB-R1-SEC-OPS-12). Muốn "smoke `/health` qua tên miền" từ ngoài thì phải đặt `HEALTH_ALLOW_IPS` = IP máy kiểm. Xem R5-03 |
| 6 | Sao lưu hằng ngày | **Sẵn sàng, bật tay sau deploy đầu** | `backup.sh` + `ottimo-backup.timer` 03:30 giờ VN, `Persistent=true`. Gồm `pg_dump -Fc`, kho tệp, `purge_journal`, mã hóa `age`, `.sha256`. Giữ 7 ngày + bản Chủ nhật tới 35 ngày. `ops-check.sh` báo khi bản sao lưu cũ hơn 26 giờ. Đã diễn tập local ở S3 | R2 bản sao lưu nằm **cùng VPS**. Off-site kéo về máy phụ: R3 (hosting-plan 7, SR-BAK-04). Diễn tập khôi phục phải làm lại trên backup staging trong R-5 (mục 4 ngày 2). Khóa giải mã `age` sinh trên máy INV, chỉ đưa khóa công khai lên VPS |
| 7 | Quản lý bí mật | **Đạt** | `init-secrets.sh` sinh khóa tại VPS (0400, Docker secrets `*_FILE`). `.env` chỉ chứa giá trị không bí mật (`env.example`). Không bí mật nào đi qua chat hay repo | Token `read:packages` do INV tự đăng nhập trên VPS (checklist Bước 7) |
| 8 | Quay lui | **Đạt** | Tự đặt lại tag trước khi smoke lỗi; `rollback.sh [tag]`; migration "mở rộng trước – thu hẹp sau" | – |
| 9 | Bootstrap VPS | **Đạt** | `bootstrap-vps.sh` chạy lại được: UFW chỉ 22/80/443, SSH chỉ khóa, tự vá 02:30, Docker từ kho chính thức có kiểm vân tay, người dùng `ottimo` uid 2001 | VPS tạo theo cách B (chỉ mật khẩu root) thì làm khác README bước 2–3: chép bundle vào `ottimo-admin`, chạy bằng `sudo … --admin-user ottimo-admin` (root tắt hẳn). Đã ghi vào README mục 0 |
| 10 | CI hiện tại | Xanh | T9 `39485554354` (20/10, schedule) success. Run push `39538289405` của `72895de` đang chạy lúc kiểm | shellcheck không có trên máy OPS. Dựa vào job `infra-scripts` của CI |

## 3. Thiếu / rủi ro

| Mã | Mô tả | Mức | Đề xuất | Ai | Chặn? |
|---|---|---|---|---|---|
| **R5-01** – **đã sửa, chờ SEC review (mục 7)** | Repo công khai nên **log Actions cũng công khai**. Step `deploy-staging` in ra: (a) giá trị `STAGING_SSH_HOST` (IP) ở phần `env:` đầu step. Biến (vars) không bị che như secret; (b) toàn bộ output `deploy.sh`. Khi lỗi, output có `dc ps --all` và `dc logs --tail 80 api worker web`. Log Caddy đã che, log api không có dữ liệu cá nhân, staging chỉ có dữ liệu giả. Nhưng lỗi khởi động hay lỗi SQL vẫn có thể lộ tên bảng hoặc giá trị giả | Thấp (a: IP vốn công khai qua DNS `desk.staging`) / Trung bình (b, khi có dữ liệu thật) | Sửa `deploy-from-ci.sh`: ghi đủ output vào `/opt/ottimo/state/deploy-logs/<tag>.log` (0640), chỉ trả cho CI các dòng `[deploy …]` + mã thoát. OPS sửa được trong 1 giờ **sau khi SEC đồng ý** (thuộc E.6 mục 6: mọi thay đổi workflow/forced command đi qua SEC). Trước production: bắt buộc | OPS + SEC | Không chặn staging (dữ liệu giả); chặn production |
| **R5-02** | Lần `publish-images` đầu tạo gói GHCR `ottimo-api` (có tag `-test`) và `ottimo-web`. Nếu gói thừa hưởng chế độ **Public** từ repo công khai thì theo tài liệu GitHub, gói đã Public **không chuyển lại Private được**, chỉ xóa gói rồi đẩy lại. SEC E.6 (2): `-test` không được public | Trung bình | Checklist Bước 8a: INV kiểm Packages ngay sau lượt publish đầu, **trước** khi OPS kéo image và trước khi bật `STAGING_DEPLOY`. Nếu Public: INV xóa 2 gói, đội cân nhắc tách đẩy `-test` ra lượt tay. [GIẢ ĐỊNH – chưa xác minh hành vi mặc định của GHCR với repo công khai thuộc tài khoản cá nhân] | INV + OPS | Không chặn ngày 1 (deploy tay trước) |
| **R5-03** | QC R-5 ghi "smoke `/health` qua tên miền". Từ Internet, Caddy trả 404 cho `/health`. Đây là cố ý (SEC OPS-12) | Thấp | (a) QC nhận smoke của `deploy.sh`: tên miền thật, chứng chỉ thật, đi qua Caddy từ VPS. Cộng thêm (b) OPS chạy từ máy ngoài `curl -sI https://desk.staging.<tên-miền>/` (200 + HSTS/CSP) và `curl -s -o /dev/null -w '%{http_code}' https://desk.staging.<tên-miền>/health` (404 đúng thiết kế). Khi R3 có giám sát ngoài thì đặt `HEALTH_ALLOW_IPS` | OPS, QC nhận | Không |
| **R5-04** | R-6 cần hai chế độ trên cùng staging. SEC smoke và PO nghiệm thu chạy trên image **production** (không `/__test__`). E2E có đồng hồ giả cần `API_TAG_SUFFIX=-test`, `INCLUDE_TEST_SUPPORT=1`, `TEST_SUPPORT_TOKEN`, `TEST_SUPPORT_ALLOW_IPS=<IP máy QA>`. IP mạng nhà INV có thể đổi | Thấp | Thứ tự trong R-6: SEC smoke → PO trên image production → OPS chuyển `-test` cho QA E2E → chuyển lại production. Mỗi lần chuyển là một lần `deploy.sh` tay, có dòng trong `deploy-history.log`. Cảnh báo J16 lúc QA dời đồng hồ là bình thường | OPS + QA | Không |
| R5-05 | Landing (`staging.<tên-miền>`, `noindex` + basic auth, ADR-014) chưa có trong Caddyfile.prod, image web và `env.example` | – | Việc riêng khi landing qua cổng LP-v1. Checklist chưa yêu cầu INV tạo bản ghi `staging` | ARC/OPS | Không thuộc R-5 |
| R5-06 | Bản sao lưu staging nằm cùng VPS tới R3. Hỏng VPS là mất cả bản sao lưu | Thấp (dữ liệu giả) | Chấp nhận cho staging. Off-site kéo về máy phụ là điều kiện **trước dữ liệu thật** (hosting-plan 7) | OPS | Không |
| R5-07 | Mỗi lần CI xanh trên `main`, deploy chờ INV bấm duyệt. Lượt chờ mới thay lượt chờ cũ (concurrency), nên staging có thể đứng ở bản cũ nếu INV không bấm | Thấp | Khi QA cần bản mới, ORC nhắc INV bấm. Hoặc OPS deploy tay đúng tag (`deploy.sh sha-…`), có log | ORC | Không |
| R5-08 | Khóa `age` giải mã backup và cụm mật khẩu khóa `ottimo_ops` nằm trên máy INV (đội làm việc từ máy này) | Thấp | Khóa `age`: cất vào trình quản lý mật khẩu của INV + 1 bản ngoại tuyến. Khóa SSH dùng qua Keychain, không chép đi đâu | INV | Không |

Không có ESC mới. Chi phí VPS và tên miền đã duyệt ở ESC-002 (gói H-B). Thời điểm INV gửi thông tin đã nằm trong ESC-028.

## 4. Kế hoạch ≤ 3 ngày làm việc (tính từ lúc INV gửi IP + tên miền)

**Ngày 1 – máy chủ + deploy tay**
1. `dig +short` 3 tên miền con ra đúng IP; `dig CAA`. SSH lần đầu bằng `ottimo_ops`, đối chiếu vân tay `ssh_host_ed25519_key` (đọc qua console của hãng, hoặc ngay sau khi tạo VPS).
2. Chép bundle, chạy `bootstrap-vps.sh --deploy-key … [--admin-user ottimo-admin]`.
3. **Thủ tục BUG-R2-210 (N1-3):**
   - `docker volume ls` không có volume `ottimo_*`, chưa có `state/current_tag` (VPS mới, DB trống);
   - **không** khôi phục dump demo/QA/dev vào staging;
   - nếu VPS từng chạy bản cũ thì `dc down -v` rồi dựng lại.
4. `.env` (tên miền staging, `APP_ENV=staging`, `CLOCK_MODE=system`, image GHCR), `init-secrets.sh`, khóa `age` (sinh trên máy INV, chỉ đưa khóa công khai lên).
5. Image cho lần đầu: INV bật `PUBLISH_IMAGES` (checklist Bước 8a) → kiểm gói Private (R5-02) → INV `docker login` (Bước 7) → `deploy.sh sha-<tag>`. Lưu log smoke.

**Ngày 2 – deploy tự động + sao lưu**
1. Khóa CI (Bước 6), `bootstrap-vps.sh --ci-key`. INV đặt 3 secret của environment (D1). OPS báo đủ D1–D5 thì INV bật `STAGING_DEPLOY`.
2. Một commit nhỏ lên `main` → `publish-images` → `deploy-staging` **chạy** (không skip), INV duyệt → xanh. Đây là bằng chứng B5/C3. SEC đọc log của lượt này (D6). Nếu được, thêm một lượt lỗi cố ý. Không đạt D6 thì tắt `STAGING_DEPLOY`.
3. `systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer`. Chạy `backup.sh` tay một lần, rồi `restore-drill.sh` trên máy INV bằng backup staging. Ghi biên bản (RTO, số bảng).
4. **N2-2:** nạp DS-E bằng `dc --profile seed run --rm seed` (DB vừa migrate từ 0000).

**Ngày 3 – bàn giao R-6 + đối chiếu**
1. Smoke ngoài (R5-03), `curl -I` 3 tên miền.
2. Bàn giao cho SEC (smoke SEC-G2), QA (A1–A7, S4-15 upload 42 MB qua Caddy thật, R-3 lặp lại) và PO. Theo thứ tự R5-04.
3. Cập nhật `hosting-plan.md` mục 3–4, 6, 9 theo thực tế: nhà cung cấp, vị trí trung tâm dữ liệu, giá có VAT, phiên bản Ubuntu/Docker, snapshot đã tắt. Ghi report OPS R-5.

## 5. Đối chiếu `hosting-plan.md`

- Khớp:
  - ESC-002 A: VPS và dữ liệu ở Việt Nam;
  - gói H-B / PA2 giai đoạn R2: chỉ thuê **1 VPS** làm staging, dữ liệu giả;
  - cấu hình 2 vCPU / 4 GB / ≥ 40 GB;
  - DNS mục 10.1: chỉ 3 bản ghi `*.staging` + CAA cho R2;
  - email mục 10.2: `EMAIL_PROVIDER=mock`, chỉ bản ghi chống giả mạo;
  - bảo vệ tài khoản tên miền mục 10.
- Chỗ cần cập nhật khi có VPS thật: [Chưa xác minh] ở mục 3 (vị trí trung tâm dữ liệu, cam kết CPU, snapshot). Mục 9 vẫn ghi "Xin báo giá chính thức … trước khi thuê". INV tự thuê thì OPS ghi giá theo hóa đơn thực tế.
- Tên miền: theo ESC-020 L4-A dùng chung một tên miền cho landing và app. Checklist lấy `ottimo.vn` làm ví dụ. [GIẢ ĐỊNH – INV xác nhận khi gửi]

## 6. Việc OPS làm trong lượt này

- Tạo `rounds/round-02/inv-staging-checklist.md`.
- Tạo tệp này.
- Sửa `product/infra/server/README.md` mục 0: trỏ tới checklist, thêm cách B (`ottimo-admin`) và cảnh báo không tự tạo người dùng `ottimo`.
- Chạy kiểm chỉ đọc: `check-compose.sh`, `check-caddy-prod.sh --stub` (cả hai OK); `gh api …/environments` (0); `gh variable list` (trống).
- Không commit, không bật biến, không đổi cài đặt GitHub.

## 7. Lượt 2 (21/10) – sửa R5-01 theo SEC E.8 (chờ SEC review, chưa commit)

### 7.1 Thay đổi

| Tệp | Thay đổi | Yêu cầu E.8 |
|---|---|---|
| `product/infra/server/bin/deploy-from-ci.sh` | Toàn bộ stdout/stderr của `deploy.sh` ghi vào `state/deploy-logs/ci-<ref>.log` (umask 077, tệp 0600, chủ là người dùng triển khai `ottimo`, giữ 30 tệp mới nhất). CI chỉ nhận đúng một dòng `deploy <tag>: ok` hoặc `deploy <tag>: failed (step=<bước>, ref=<ref>)`, mã thoát 1 khi lỗi. `ref` = thời điểm UTC + 6 ký tự hex ngẫu nhiên. `step` lấy từ tệp tạm, lọc chỉ còn `a-z-`. Regex giữ nguyên `^deploy (sha-[0-9a-f]{7,40})$`. Chú thích đầu tệp bỏ `[-test]`. Lệnh lạ → `refused`, mã 2, ghi journal không kèm nội dung | 1, 2 |
| `product/infra/server/bin/deploy.sh` | Thêm hàm `step` ghi tên bước cố định (`lock`, `pull`, `roles`, `migrate`, `switch`, `smoke`, `record`) vào `$OTTIMO_STEP_FILE`, chỉ khi biến này được đặt. Deploy tay không đổi hành vi | 1 (step) |
| `.github/workflows/ci.yml` – `deploy-staging` | `HOST` đọc `secrets.STAGING_SSH_HOST` (bỏ `vars`). `ssh -o LogLevel=ERROR`. `trap` xóa cả `known_hosts`. Không `set -x`, không echo biến; thông báo lỗi chỉ nêu tên biến. Điều kiện `if:` của job **không đổi**: job vẫn tắt | 3, 4 |
| `.github/workflows/ci.yml` – `infra-scripts` | Thêm step chạy `test-deploy-from-ci.sh` | 5 |
| `product/infra/ci/test-deploy-from-ci.sh` (mới) | Ca (a), (b), (c) – mục 7.2 | 5 |
| `product/infra/server/bootstrap-vps.sh` | D4: so phần khóa (base64) của `--ci-key` với `authorized_keys`. Khóa CI trùng khóa người (không giới hạn) → dừng; khóa người trùng khóa CI → dừng. Chạy lại không thêm dòng trùng. Tùy chọn khóa CI giữ `command="…/deploy-from-ci.sh",restrict` | D4 |
| `product/infra/server/README.md` mục 8 | 3 secret của environment, D1–D6, cách đọc log trên VPS | – |
| `rounds/round-02/inv-staging-checklist.md` | `STAGING_SSH_HOST` thành secret của environment; tạo secret sau khi có người duyệt; khóa CI riêng + `restrict`; kiểm GHCR ngay sau publish đầu; bảng D1–D6; gợi ý lưu log Actions 30 ngày | D1, D3, D4, khuyến nghị |

### 7.2 Kết quả test

Chạy trong container `ubuntu:24.04` (như runner CI; máy OPS là macOS, không có `flock`), mount `product/` chỉ đọc:

- **(a) Deploy lỗi cố ý**, dùng `deploy.sh` **thật** với `dc` giả: `pull` báo "manifest unknown", kèm một IP và đường dẫn bí mật giả làm dấu.
  - CI chỉ nhận một dòng: `deploy sha-0123456789ab: failed (step=pull, ref=20261021T033750Z-4a1612)`, mã thoát 1.
  - Dấu không có trong output CI. Log VPS `ci-<ref>.log` có đủ chi tiết, quyền 600, không còn tệp `.step-*`.
- **(b) Lệnh lạ:** 14 lệnh đều `refused`, mã 2, và không lượt deploy nào chạy (số tệp log không đổi). Gồm:
  - lệnh rỗng, `bash`, `deploy`;
  - `deploy sha-…-test`, hex sai, hex quá ngắn;
  - chèn lệnh bằng `;`, `&&`, xuống dòng; hai dấu cách;
  - `rsync --server`, `scp -t`, `deploy latest`, `rollback`.
- **(c) Deploy thành công:** CI nhận đúng một dòng `deploy sha-abcdef1: ok`, mã 0. Có 35 log cũ thì còn lại đúng 30 tệp.
- Kết quả: `OK: deploy-from-ci.sh – one summary line to the CI, full log on the server, other commands refused`.
- `shellcheck -x -S warning` (cùng danh sách tệp với job `infra-scripts`, có thêm tệp test mới): **sạch**.
- `ci.yml` parse YAML hợp lệ.
- Kiểm D4 mô phỏng phần so khóa: khóa người dùng làm khóa CI → từ chối; chạy lại khóa CI đã cài → không lỗi, không thêm dòng. Chưa chạy trọn `bootstrap-vps.sh` (cần root trên Ubuntu): sẽ chạy khi có VPS.
- CI thật chưa chạy các thay đổi này (chưa commit theo yêu cầu). Sau commit, job `infra-scripts` chạy test (a)–(c).

### 7.3 Ghi chú cho SEC review

- `step=unknown` khi `deploy.sh` dừng trước `step lock` (gần như không xảy ra). Khi đang có deploy khác thì `step=lock`.
- Ngay cả khi SSH lỗi (ví dụ "Connection refused"), dòng lỗi vẫn có thể chứa IP. Nay `HOST` là secret nên GitHub che giá trị này trong log.
- `known_hosts` có chứa IP. Nó nằm trong secret và bị xóa ở `trap`.
- D6 là kiểm **sau** lượt đầu, nên không thể có trước khi bật. Checklist ghi: bật khi đủ D1–D5, kiểm D6 ngay sau lượt đầu, không đạt thì tắt `STAGING_DEPLOY`. Cần SEC xác nhận cách hiểu này.
- Log VPS giữ 30 lượt CI. Chưa nối vào xoay vòng `deploy-history.log`, vì tệp đó hiện cũng chưa xoay: chỉ thêm dòng, mỗi lượt một dòng.

## 8. Lượt 3 (22/10) – dựng nền VPS staging (R-5, ngày 1 bước 1–2)

VPS: Nhân Hòa, Ubuntu 24.04.2, 3 vCPU, ~4,8 GB RAM, 55 GB NVMe. IP **không ghi ở đây** (repo công khai): ORC giữ, INV có trong email nhà cung cấp. Nhà cung cấp giữ 2 bản backup toàn máy (decision-log 22/10) – chấp nhận cho staging dữ liệu giả.

### 8.1 Đã làm

1. Đăng nhập root bằng khóa `ottimo_ops` (nhà cung cấp gắn sẵn). Tạo `ottimo-admin` theo cách B (checklist Bước 3): nhóm `sudo`, `NOPASSWD` (`/etc/sudoers.d/90-ottimo-admin`, kiểm `visudo -c`), khóa `ottimo_ops`. **Kiểm đăng nhập `ottimo-admin` bằng khóa + `sudo -n` trước** khi chạy bất kỳ thứ gì tắt root/mật khẩu.
2. Chép bundle (`infra` + `ds-e.json`) vào `~ottimo-admin/ottimo-bundle`, chạy `sudo bootstrap-vps.sh --deploy-key ~/ottimo_ops.pub --admin-user ottimo-admin`. Kết quả `EXIT=0`. Log trên VPS: `/var/log/ottimo-bootstrap.log`. Chạy lại thêm 2 lần (sau khi sửa script) – không lỗi, không thêm dòng trùng.
3. Khởi động lại 2 lần (nhân Linux mới từ bản cập nhật, và để kiểm tường lửa sống qua reboot).
4. **Chưa** cài khóa CI, chưa `.env`, chưa `init-secrets.sh`, chưa khóa `age`, chưa đăng nhập GHCR, chưa deploy, chưa bật timer. Không đụng GitHub settings/secrets/biến.

### 8.2 Lỗi tìm thấy trong `bootstrap-vps.sh` trên ảnh máy của nhà cung cấp – đã sửa (chờ SEC review, chưa commit)

| Mã | Hiện tượng trên VPS | Hậu quả nếu không sửa | Sửa |
|---|---|---|---|
| R5-09 | Ảnh máy có `/etc/ssh/sshd_config.d/50-cloud-init.conf` = `PasswordAuthentication yes`. sshd lấy giá trị **đọc đầu tiên**, tệp đọc theo thứ tự tên, nên `60-ottimo.conf` cũ **bị bỏ qua** | Đăng nhập mật khẩu **vẫn bật** dù script báo xong | Tệp đổi tên `00-ottimo.conf` (xóa `60-ottimo.conf` cũ). Sau `sshd -t` thêm kiểm `sshd -T`: `passwordauthentication no` và `permitrootlogin` đúng, sai thì dừng trước khi reload |
| R5-10 | Ảnh máy chỉ có khóa host RSA + DSA, **không có ed25519** | `ssh-keyscan -t ed25519` (README mục 8, `STAGING_SSH_KNOWN_HOSTS`) ra rỗng | `ssh-keygen -A` tạo khóa host mặc định còn thiếu |
| R5-11 | `ufw.service` **bị tắt** trong ảnh máy (`ufw.conf` có `ENABLED=yes` nhưng unit không chạy lúc khởi động). Sau reboot đầu: `ufw status` = inactive, `INPUT ACCEPT` | Tường lửa mất sau mỗi lần khởi động (kể cả lần tự vá 02:30) | `systemctl enable --now ufw` + kiểm `is-enabled`, sai thì dừng. Đã reboot lại: `ufw active`, `INPUT DROP` |

Chú thích: lúc `apt upgrade` nâng `openssh-server`, cổng 22 từ chối kết nối khoảng 1–2 phút (dịch vụ SSH khởi động lại). Không ảnh hưởng (script chạy `nohup`), nhưng ghi để lần sau không hoảng.

### 8.3 Kết quả kiểm sau cài (22/10, sau reboot thứ 2)

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | `ottimo-admin` đăng nhập bằng khóa `ottimo_ops`, `sudo -n true` | **Đạt** |
| 2 | `root` đăng nhập bằng đúng khóa đã gắn | **Bị từ chối** (`Permission denied (publickey)`) – Đạt |
| 3 | Đăng nhập mật khẩu / keyboard-interactive (`ottimo-admin` và `root`) | **Bị từ chối**, máy chủ chỉ chào `publickey` – Đạt. `sshd -T`: `passwordauthentication no`, `kbdinteractiveauthentication no`, `permitrootlogin no`, `maxauthtries 4`, `x11forwarding no` |
| 4 | Người dùng triển khai `ottimo` (uid 2001, nhóm `docker`) đăng nhập bằng khóa, chạy `docker ps` | **Đạt** |
| 5 | `ufw status verbose` | **Đạt**: active, mặc định deny vào / allow ra / deny routed; chỉ 22, 80, 443 (v4 + v6). Từ ngoài: 22 mở; 5432, 8080 không vào được. 80/443 chưa có dịch vụ (chưa deploy) |
| 6 | Docker | **Đạt**: Docker 29.9.2, Compose v5.6.1, kho chính thức (vân tay khóa kiểm trong script), `hello-world` chạy rồi xóa image. `daemon.json` đúng (log `local` 20m×5, `live-restore`, `userland-proxy: false`, `no-new-privileges`) |
| 7 | Hệ thống | Múi giờ `Asia/Ho_Chi_Minh`; swap 2 GB; tự vá bảo mật bật (reboot khi cần 02:30); không còn `reboot-required`; `systemctl --failed` trống. `fwupd.service` lỗi một lần lúc nâng cấp (VM không có firmware) – bỏ qua |
| 8 | `/opt/ottimo` | `infra` (root, không ai khác ghi), `.env` (0600 `ottimo`, bản mẫu – chưa điền), `state` (0700 `ottimo`), `backup` (0750 root:ottimo), `seed` (0700 uid 1000), `/var/backups/ottimo`. Timer `ottimo-backup`, `ottimo-ops-check` đã cài, **chưa bật** (bật sau deploy đầu) |
| 9 | Cổng nghe từ ngoài | Chỉ `sshd` :22 |

### 8.4 Ghi chú / rủi ro mới

- **R5-12** – `ottimo-admin` có uid 1000 (= uid người dùng trong container api) vì tạo bằng `adduser` như checklist. Script đã lường trước: `/opt/ottimo/secrets` (0710 root:ottimo) không đi qua được bằng uid này; thư mục `seed` (dữ liệu giả) thuộc uid 1000 nên `ottimo-admin` đọc được – chấp nhận (người này có sudo). Production: tạo người dùng quản trị với uid khác 1000.
- **R5-13** – Khóa `ottimo_ops` **chưa có passphrase** (decision-log 22/10) và giờ mở được sudo trên VPS. Đề xuất INV đặt passphrase: `ssh-keygen -p -f ~/.ssh/ottimo_ops` (không ảnh hưởng VPS). Mục 0 của tệp này ghi "dùng qua Keychain" – chưa đúng thực tế cho tới khi có passphrase.
- **R5-14** – `10-legacy-rsa.conf` của nhà cung cấp bật lại `ssh-rsa` (SHA-1). Không mở thêm đường đăng nhập (chỉ khóa), nhưng nên gỡ cùng SEC trước production. Chưa sửa lượt này.
- Khóa `ottimo_ops` vẫn còn trong `/root/.ssh/authorized_keys` nhưng vô hiệu vì `PermitRootLogin no`. Giữ để nếu cần mở lại root qua console của hãng thì không phải gắn lại.
- **DNS:** `ottimo.vn` dùng máy chủ DNS của **Mắt Bão** (không phải Google), đã có email Google (MX + SPF) và trang Google Sites ở `@`/`www`. Hướng dẫn INV: `rounds/round-02/inv-dns-steps.md`: 3 bản ghi A `*.staging`, CAA `letsencrypt.org` **và** `pki.goog` (giữ chứng chỉ Google Sites), không thêm `v=spf1 -all`.

### 8.5 Bước tiếp (khi INV báo đã thêm DNS)

`dig` 3 tên + CAA → `.env` (`APP_ENV=staging`, tên miền `*.staging.ottimo.vn`) → `init-secrets.sh` → khóa `age` (sinh trên máy INV, chỉ khóa công khai lên VPS) → INV bật `PUBLISH_IMAGES` + kiểm GHCR Private (R5-02) → INV `docker login` (token `read:packages`) → `deploy.sh sha-…` → thủ tục BUG-R2-210 (DB trống). Khóa CI + environment: sau, cùng INV (mục 4 ngày 2).

## 9. Lượt 4 (22/10) – cấu hình staging, bí mật, khóa sao lưu, HTTPS (R-5, ngày 1 bước 4)

Điều kiện đầu vào (ORC báo): DNS 3 tên `*.staging.ottimo.vn` đã trỏ về VPS (OPS kiểm lại bằng `dig` công khai và `dig @ns1.matbao.vn`: khớp); CAA **không thêm được** ở Mắt Bão; D0 xong (khóa `ottimo_ops` có passphrase, qua Keychain/agent); SEC E.9 duyệt, ORC commit `b337086`. Không đụng GitHub settings.

### 9.1 Đã làm

| # | Việc | Kết quả |
|---|---|---|
| 1 | `/opt/ottimo/.env` (0600 `ottimo`) | `APP_ENV=staging`, `CLOCK_MODE=system`, `DESK/STAFF/GUEST_HOST=desk/staff/g.staging.ottimo.vn`, `ACME_EMAIL=ops@ottimo.vn` [GIẢ ĐỊNH – mục 9.3], `API_IMAGE`/`WEB_IMAGE=ghcr.io/anhvh93-tech/ottimo-api|web`, `API_TAG_SUFFIX=` (image production), `INCLUDE_TEST_SUPPORT=0`, tích hợp giữ off/mock/manual như mẫu. Không còn `<…>`. `dc config --quiet` (người dùng `ottimo`): hợp lệ. Dải `172.30.0.0/24` không trùng mạng của VPS |
| 2 | `init-secrets.sh` (root) | Tạo đủ 11 tệp. Thư mục `secrets` 0710 root:ottimo, tệp 0400: uid 1000 cho api/worker/migrate/seed, uid 70 cho postgres. `ottimo` không liệt kê, không đọc được (đã thử). Không giá trị nào in ra hay rời VPS. Staging: không cần chép KEK ngoại tuyến |
| 3 | Khóa `age` sao lưu | Sinh **trên máy Mac** (Mac chưa có `age`: chạy `age-keygen` trong container `alpine:3.20` tạm, gắn thư mục ra ngoài). Khóa riêng: `~/.ottimo/backup/ottimo-backup-identity.txt` (0600, thư mục 0700, ngoài repo). Chỉ khóa công khai lên VPS: `/opt/ottimo/backup/recipients.txt` (0640 root:ottimo) |
| 4 | Thử cấp chứng chỉ HTTPS | Chưa có image web (chờ GHCR), nên chạy tạm container `caddy:2-alpine` **cùng digest với image web**, chỉ trả "acme test", dùng **CA thử nghiệm** của Let's Encrypt (không tốn hạn mức cấp chứng chỉ thật). Cả 3 tên: `certificate obtained successfully` (HTTP-01 qua cổng 80). Từ máy ngoài: HTTPS 200 với chứng chỉ `(STAGING)` của Let's Encrypt; HTTP → 308 sang HTTPS. Sau đó xóa container, image và tệp tạm; cổng 80/443 không còn dịch vụ. Chứng chỉ thật cấp ở lần `deploy.sh` đầu |
| 5 | Chuẩn bị deploy | Kéo sẵn `postgres:17-alpine` (đúng digest trong compose). Thủ tục BUG-R2-210 N1-3: không có volume `ottimo_*`, chưa có `state/current_tag`. `ottimo` chưa đăng nhập GHCR (`~/.docker` chưa có) |
| 6 | Hướng dẫn INV phần GitHub | `rounds/round-02/inv-github-steps.md`: 6 phần theo đúng thứ tự D0–D6. INV tự gõ token trong `ssh ottimo@…` → `docker login` (dấu nhắc ẩn, không qua chat). Secret CI đặt bằng `gh secret set --env staging`, đọc thẳng từ tệp. Checklist Bước 5 trỏ sang tệp này |

Kiểm chỉ đọc phía GitHub: `gh` trên máy này đăng nhập `anhvh93-tech`; repo chưa có biến nào (`VITE_DESK_PHONE` cũng chưa); 0 environment.

### 9.2 Rủi ro / ghi chú mới

- **R5-15** – Không có CAA (Mắt Bão từ chối loại bản ghi này). CA nào cũng cấp được chứng chỉ cho `ottimo.vn`. Mức Low cho staging. **Trước production:** hỏi Mắt Bão hỗ trợ CAA, hoặc cân nhắc chuyển DNS sang nơi có CAA + 2 lớp (hosting-plan mục 10). Ghi để SEC quyết.
- **R5-12 (bổ sung)** – Các tệp bí mật của api thuộc uid 1000, trên máy là `ottimo-admin`. Người này **không đi qua được** thư mục `secrets` (0710 root:ottimo, không thuộc nhóm `ottimo`), nhưng có sudo. Không thêm quyền thật; production theo SEC E.9.2 (uid khác 1000).
- **R5-16** – Khóa giải mã sao lưu `age` hiện chỉ có **một bản** trên máy Mac. INV cần cất thêm vào trình quản lý mật khẩu và một bản ngoại tuyến (README mục 4.3, R5-08). Staging dữ liệu giả nên không chặn; mất khóa thì tạo cặp mới (README mục 11).
- Token GHCR đề xuất hạn 90 ngày (checklist cũ ghi 1 năm). Hết hạn thì deploy dừng ở bước `pull`. OPS nhắc trước hạn.
- Đề xuất nhỏ của SEC E.9.1 (a)(b)(c) cho `bootstrap-vps.sh`: chưa làm lượt này.

### 9.3 Giả định

- `ACME_EMAIL=ops@ottimo.vn`: hộp thư nhóm chưa xác nhận là có thật. Let's Encrypt không kiểm hộp thư và đã ngừng gửi thư nhắc hạn, nên không ảnh hưởng việc cấp chứng chỉ. INV muốn địa chỉ khác thì OPS sửa `.env` (một dòng, không cần deploy lại image).

### 9.4 Bước tiếp

INV làm `inv-github-steps.md` phần 1–4 → push lên `main` tạo image → INV kiểm gói Private (D3) → OPS chạy `deploy.sh sha-…` (DB trống, BUG-R2-210) → kiểm chứng chỉ thật + smoke R5-03 → nạp DS-E (N2-2) → bật timer sao lưu, `backup.sh` tay, `restore-drill.sh` trên Mac bằng khóa ở `~/.ottimo/backup`. Sau đó phần 5–6 (khóa CI, `STAGING_DEPLOY`).
