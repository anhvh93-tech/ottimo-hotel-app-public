# Phương án hosting – OTTIMO Desk (phác thảo Round 1)

- Người viết: OPS | Round 1 – Đợt 3, sửa ở Bước 4 (thẻ ARC-OPS-09/10, SEC-OPS-03/10/12/13); cập nhật R2 – Sprint 3 (16/10/2026); **ARC sửa 17/10/2026 theo giao việc ORC** (ADR-014): tên miền gốc phục vụ landing từ chính VPS, DNS gốc + `www`, bảo vệ tài khoản tên miền (SEC ARC-10) – mục 1, 5, 5.1, 9, 10 | Trạng thái: **ESC-002 đã quyết (A – dữ liệu ở VN, gói H-B). Script dựng staging đã sẵn (`infra/server/`, diễn tập local đạt) – chờ INV báo IP VPS + tên miền (mục 10)**
- Căn cứ: ADR-010 (ARC), ESC-002 phương án A (dữ liệu khách tại Việt Nam), `data-risk-assessment.md` T15/T16/T18 (SEC), decision-log 15/10 ([GIẢ ĐỊNH] hạ tầng ≤ 1 triệu đ/tháng)
- Dùng cho: Round 2 dựng staging; Round 3 chuẩn bị production.

> **Quy ước nguồn** (giống ADR-010/INT): **[Nguồn]** = trang giá chính thức của hãng, OPS đọc ngày 15/10/2026; **[Bên thứ ba]** = trang tổng hợp, chưa đối chiếu với hãng; **[Chưa xác minh]** = ước lượng của đội. Không có số nào ở đây là **báo giá chính thức** – trước khi INV ký, OPS lấy báo giá bằng văn bản (có VAT, có hóa đơn).
> Giá trên trang hãng thường **chưa gồm VAT 10%**; bảng dưới đã cộng VAT khi nguồn ghi "chưa VAT".

## 1. Tóm tắt cho chủ đầu tư

- Hệ thống cần **1 máy chủ ảo (VPS) 2 nhân / 4 GB RAM** đặt **tại Việt Nam** cho bản chạy thật, cộng một chỗ cất bản sao lưu cũng tại Việt Nam.
- Ước tính **khoảng 0,35 – 0,95 triệu đ/tháng** tùy phương án (phương án đề xuất ~0,43–0,54 triệu) → **nằm trong ngân sách ≤ 1 triệu đ/tháng**. Chưa gồm: phí channel manager (Beds24 ~0,9–2,3 tr – INT), SMS/Zalo ZNS, email vượt gói miễn phí.
- Đội đề xuất **Phương án 2** (máy chính + máy phụ ở nhà cung cấp khác làm staging và nơi giữ bản sao lưu): an toàn hơn khi một nhà cung cấp gặp sự cố, vẫn rẻ.
- Cần INV: (1) quyết ESC-002; (2) duyệt mức chi phí hosting (OPS đề xuất ESC mới – xem report OPS R1); (3) chọn tên miền – cần **1 tên miền chính** (tên miền gốc + `www` = landing, ADR-014) **+ 3 tên miền con cho app + tên miền gửi email** (mục 5.1), không phát sinh thêm tiền ngoài phí tên miền. Tài khoản tên miền đứng tên công ty, bật 2 lớp, khóa chuyển nhượng (mục 10).
- Bản sao lưu production **không bao giờ** được khôi phục vào staging; diễn tập khôi phục làm trong môi trường dùng một lần rồi xóa (mục 7.1).

## 2. Nhu cầu tài nguyên (từ ADR-010)

| Thành phần | RAM ước | Ghi chú |
|---|---|---|
| PostgreSQL 17 | 0,5–1 GB | dữ liệu + hàng đợi pg-boss + phiên |
| api (NestJS/Fastify) | ~250 MB | |
| worker | ~200 MB | job lịch, outbox/inbox |
| Caddy + web tĩnh | ~50 MB | TLS Let's Encrypt tự động |
| Hệ điều hành + Docker | ~400 MB | |
| **Tổng** | **~1,5–2 GB** | VPS 4 GB dư ~2× cho đỉnh tải và bản build |

Dữ liệu: < 1 GB/năm (chưa tính ảnh giấy tờ – tự xóa theo hạn) → ổ 40 GB đủ nhiều năm. Băng thông: rất thấp (10 căn, < 10 người dùng nội bộ, < 200 lượt mở app khách/ngày).

## 3. Giá tra được (ngày 15/10/2026)

| Nhà cung cấp (VN) | Gói | Cấu hình | Giá/tháng chưa VAT | Có VAT | Nguồn / mức xác minh |
|---|---|---|---|---|---|
| BizFly Cloud | VPS (SSD) Gói 4 | 2 vCPU / 4 GB / 40 GB SSD | 240.000 | **264.000** | [Nguồn] bizflycloud.vn/cloud-server/bang-gia – trang ghi "chưa bao gồm VAT". Vị trí trung tâm dữ liệu không ghi trên trang giá → [Chưa xác minh] là HN/HCM |
| BizFly Cloud | VPS (SSD) Gói 2 | 1 vCPU / 2 GB / 20 GB SSD | 120.000 | **132.000** | [Nguồn] như trên |
| BizFly Cloud | VPS (SSD) Gói 5 | 2 vCPU / 8 GB / 40 GB SSD | 340.000 | **374.000** | [Nguồn] như trên |
| BizFly Cloud | Simple Storage (S3) trả theo dùng | lưu trữ 864 đ/GB/tháng; truyền dữ liệu ra 280 đ/GB; tải lên miễn phí; thanh toán tối thiểu 50.000 đ | 50 GB ≈ 43.200 → áp mức tối thiểu 50.000 | **~55.000** | [Nguồn] bizflycloud.vn/s3-simple-storage/bang-gia – chưa VAT |
| Viettel IDC | T1.Base 03 | 2 vCPU / 4 GB / 20 GB SSD | 399.000 | **~439.000** | [Bên thứ ba] whtop.com (trích trong ADR-010) |
| Vietnix, AZDIGI, PA Vietnam, VNPT | gói VPS phổ thông | chưa rõ cấu hình tương đương | – | – | [Chưa xác minh] – không lấy được bảng giá chính thức (trang Vietnix không truy cập được khi tra) |
| Tên miền `.com` / `.vn` | 1 năm, chia 12 | – | – | ~30.000–70.000 | [Chưa xác minh] |
| Let's Encrypt (TLS), GitHub Actions (CI), GHCR (kho image) | – | – | 0 | 0 | Gói miễn phí; hạn mức miễn phí cho repo riêng tư [Chưa xác minh] |

Ghi chú: gói "VPS (SSD)" giá rẻ của BizFly có thể là CPU dùng chung; OPS sẽ hỏi rõ cam kết CPU, uptime (SLA), snapshot, IPv4 riêng và vị trí trung tâm dữ liệu khi xin báo giá.

## 4. Ba phương án (đều đặt dữ liệu khách tại Việt Nam – ESC-002 A)

| | **PA1 – Tối giản** | **PA2 – Đề xuất** | **PA3 – Dư dả** |
|---|---|---|---|
| Máy chính (production) | 1 VPS 2 vCPU/4 GB (BizFly Gói 4) – 264.000 | 1 VPS 2 vCPU/4 GB (BizFly Gói 4) – 264.000 | 1 VPS 2 vCPU/8 GB (BizFly Gói 5) – 374.000 |
| Staging | Chung máy chính (compose project riêng, dữ liệu giả) – 0 | 1 VPS 1–2 GB ở **nhà cung cấp VN khác** (ví dụ Viettel IDC/Vietnix) – ~130.000–200.000 [Chưa xác minh] | 1 VPS 2 vCPU/4 GB riêng – ~264.000–439.000 |
| Nơi giữ bản sao lưu (off-site, VN) | Object storage (BizFly S3) – ~55.000 | Ổ của VPS phụ (khác nhà cung cấp), **tài khoản hệ điều hành riêng** `backup`, ứng dụng staging không đọc được (mục 7) – 0 | Object storage + VPS staging – ~55.000 |
| Tên miền | ~30.000–70.000 | ~30.000–70.000 | ~30.000–70.000 |
| **Tổng/tháng (có VAT)** | **~350.000–390.000** | **~425.000–535.000** | **~720.000–940.000** |
| Ưu | Rẻ nhất | Sao lưu nằm ở hãng khác → một hãng sập/khóa tài khoản vẫn khôi phục được; staging tách khỏi production | Dư RAM cho R3+ (báo cáo nặng), staging giống hệt production |
| Nhược | Sao lưu cùng hãng với máy chính; staging chung máy chính (rủi ro ảnh hưởng nhau) | Hai hóa đơn, hai tài khoản | Sát trần ngân sách nếu staging chọn Viettel IDC |

Nếu INV chọn ESC-002 B (Singapore) hoặc C (lai): kiến trúc giữ nguyên, chỉ đổi nơi đặt VPS (ADR-010 "Điều kiện xem lại"); giá tham khảo ở ADR-010 (B ~0,65–1,15 tr/tháng – có thể vượt ngân sách).

**Đội đề xuất PA2.** Lộ trình chi: R2 chỉ thuê **1 VPS** (dùng làm staging với dữ liệu giả, ~264.000/tháng); khi chạy thật (sau R3, có quyết ESC-002) mới thuê thêm máy phụ.

## 5. Bố trí trên máy chủ

```
Internet ──443/80──► Caddy (TLS Let's Encrypt, web tĩnh, reverse proxy)
                      ├─► api:3000   (chỉ trong mạng Docker)
                      └─► /srv/{admin-web,mobile,guest-web,landing-web}   (landing-web: tên miền gốc – ADR-014)
                     worker ─┐
                     api ────┴─► postgres:5432 (chỉ trong mạng Docker, không mở ra ngoài)
                     volume tệp mã hóa (ADR-013)
```

- Tường lửa: chỉ mở 80, 443 và SSH (chỉ đăng nhập bằng khóa, tắt mật khẩu, tắt root; giới hạn IP nếu được). PostgreSQL **không** mở ra Internet.
- Tự cập nhật bản vá bảo mật hệ điều hành (unattended-upgrades); khởi động lại có kế hoạch ngoài giờ cao điểm (sau 02:00, tránh giờ nhận/trả phòng).
- DNS: dùng nhà đăng ký tên miền hoặc Cloudflare **chỉ DNS** (không bật proxy "đám mây cam" – ADR-010 mục 4, để TLS kết thúc tại máy chủ ở VN).
- Kho tệp mã hóa (ADR-013, SEC C2): volume `blobdata` gắn **chỉ** vào api + worker tại `/var/lib/ottimo/blobs` (`BLOBSTORE_LOCAL_PATH`, thư mục 0700 chủ `node` do image tạo sẵn), **không** gắn vào Caddy; mọi đường dẫn kiểu `/var/…`, `/blobs/…`, tệp ẩn, source map qua Caddy → 404 (CI + smoke deploy kiểm).
- Bí mật: cấu hình thường ở `/opt/ottimo/.env` quyền 600; **khóa mạnh** (`DATA_KEK_*`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY`, `SESSION_SECRET`, `PAYMENT_*_SECRET*`, mật khẩu DB) nạp bằng **Docker Compose secrets** – tệp `/opt/ottimo/secrets/<tên>` quyền 0400, ứng dụng đọc qua biến `<TÊN>_FILE` (đã hỗ trợ trong khung api) – để không hiện trong `docker inspect` (FB-R1-SEC-OPS-10). Không bí mật nào trong image Docker hay log CI. Khóa chủ `DATA_KEK_*` (ADR-013) có **bản sao ngoại tuyến do INV giữ** (ví dụ giấy niêm phong/USB mã hóa) – mất KEK = mất ảnh giấy tờ. Mỗi môi trường một KEK riêng; KEK production không bao giờ nằm trên máy staging (SR-KEY-03).
- Kiểm cấu hình khi khởi động: `APP_ENV=production` mà thiếu/yếu khóa, `CLOCK_MODE` khác `system`, `INCLUDE_TEST_SUPPORT=1` hoặc có `TEST_SUPPORT_TOKEN`, `COOKIE_SECURE_PREFIX=false`, có adapter `mock`, thiếu `TRUST_PROXY` hoặc `TRUST_PROXY` không phải dải nội bộ → api/worker **dừng** (staging cũng bắt buộc `TRUST_PROXY` và `COOKIE_SECURE_PREFIX=true`). `CLOCK_OVERRIDE` đã bỏ (R2): đặt giá trị khác rỗng ở bất kỳ môi trường nào cũng làm api/worker dừng. Compose production là tệp riêng `infra/docker-compose.prod.yml` (R2), không kế thừa cấu hình dev.
- **Đã có (R2 S3):** `infra/docker-compose.prod.yml` (staging + production, một tệp; luôn chạy qua `infra/server/bin/dc`), `infra/caddy/Caddyfile.prod`, `infra/server/` (bootstrap VPS, bí mật, deploy/rollback, sao lưu, kiểm tra định kỳ, diễn tập khôi phục) – hướng dẫn từng bước: `infra/server/README.md`. Mạng: `db` (internal, chỉ postgres/api/worker/migrate), `edge` (Caddy ↔ api, Caddy IP cố định 172.30.0.10 = `TRUST_PROXY`), `egress` (worker ra Internet cho tích hợp sau này). Mọi container `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, giới hạn RAM/PID; Caddy chạy uid 10001 nghe 80/443 nhờ sysctl không gian tên `ip_unprivileged_port_start=0` (không cần capability).
- Vai DB trên staging/production tạo bằng **cùng** `infra/postgres/init/02-roles.sh` như dev/CI (chạy lại được; **mỗi lần deploy chạy lại** – SEC H3, script tự đọc lại `rolconfig` và dừng nếu thiếu) – gồm giới hạn của vai `ottimo_app`: `idle_in_transaction_session_timeout = 30s`, `statement_timeout = 15s` (FB-R2-SEC-BE-23). Không đổi hai giá trị này để "chữa" lỗi timeout; báo cáo dài tự `SET LOCAL statement_timeout`. Biến origin `ADMIN_BASE_URL`/`STAFF_BASE_URL`/`GUEST_BASE_URL` bắt buộc (https) ở staging/production – api từ chối khởi động nếu thiếu.
- Container: api/worker chạy user `node`, web (Caddy) chạy uid 10001; production thêm `cap_drop: [ALL]`, `read_only: true` + tmpfs, `security_opt: [no-new-privileges:true]`; api không publish cổng, `TRUST_PROXY` = IP cố định của container Caddy.
- `/health`: Docker healthcheck dùng bản đầy đủ trong mạng nội bộ; từ Internet Caddy chỉ cho IP giám sát (hoặc trả rút gọn `{status}`) – FB-R1-SEC-OPS-12, làm cùng Caddyfile production R2.

### 5.1 Tên miền và email (SR-HDR-04, SR-GST-07)

| Tên (ví dụ, INV chọn tên chính) | Dùng cho | Ghi chú |
|---|---|---|
| `desk.<tên-miền>` | admin-web (lễ tân, quản lý, chủ) | origin riêng, proxy `/v1` tới api |
| `staff.<tên-miền>` | app nhân viên (PWA) | origin riêng |
| `g.<tên-miền>` | web khách (link trong tin nhắn) | origin riêng; `Referrer-Policy: no-referrer`; log che `/g/*` |
| `<tên-miền>` (tên miền gốc) | **landing** – website giới thiệu công khai (ADR-014) | origin riêng (site thứ 4 trên Caddy); tệp tĩnh. v1 **không** proxy `/v1/*`; từ L1 chỉ 5 đường dẫn `/v1/public/properties/{slug}/…` (SEC ARC-06). Production **không** gắn `X-Robots-Tag` |
| `www.<tên-miền>` | chuyển hướng 301 → `https://<tên-miền>{đường dẫn}` | không có nội dung riêng; Caddy tự xin chứng chỉ |
| `staging.<tên-miền>` | landing staging | `X-Robots-Tag: noindex` **và** basic auth hoặc danh sách IP (SEC ARC-10) |
| `mail.<tên-miền>` hoặc tên miền gốc | gửi email giao dịch (OTP khách, xác nhận) | bản ghi SPF, DKIM, DMARC; nhà cung cấp email chọn cùng INT (ESC-010) – **bắt buộc từ R2** vì OTP khách dùng email |
| `staging-*` (ví dụ `desk.staging.<tên-miền>`) | staging | tách hẳn khỏi production, có `X-Robots-Tag: noindex` |

Tên miền con không mất thêm phí; chỉ cần 1 tên miền chính (mục 3).

**Bản ghi DNS cho email giao dịch nếu INV chọn Amazon SES vùng Singapore** (đề xuất của INT – `integrations.md` 3.4.1; ESC-010). OPS soạn, INV dán khi có tên miền; phải xong **trước staging R2**. Giá trị cụ thể do SES sinh khi xác minh tên miền – dưới đây là khuôn:

| Loại | Tên | Giá trị (khuôn) | Mục đích |
|---|---|---|---|
| CNAME ×3 | `<token1>._domainkey.<tên-miền>` … `<token3>._domainkey.<tên-miền>` | `<token>.dkim.amazonses.com` (Easy DKIM, SES sinh 3 token) | DKIM – chữ ký email |
| MX | `mail.<tên-miền>` (MAIL FROM riêng) | `10 feedback-smtp.ap-southeast-1.amazonses.com` | Bounce/phản hồi, căn chỉnh SPF |
| TXT | `mail.<tên-miền>` | `v=spf1 include:amazonses.com -all` | SPF cho MAIL FROM |
| TXT | `_dmarc.<tên-miền>` | `v=DMARC1; p=none; rua=mailto:dmarc@<tên-miền>` → sau 2–4 tuần không lỗi nâng `p=quarantine` | DMARC |

Nếu chọn Resend hoặc SMTP khác: thay khuôn theo hướng dẫn của hãng; giữ DMARC. Gửi email chuyển dữ liệu C2 (email, tên khách) ra Singapore → thuộc danh sách bên xử lý dữ liệu (ESC-002, SEC).

## 6. Triển khai và quay lui (đã cài – R2 S3)

1. CI (`.github/workflows/ci.yml`, job `publish-images`, chỉ push vào `main`, bật bằng biến repo `PUBLISH_IMAGES=true`) build `ottimo-api:sha-<12>` (production, quét không có `/__test__`), `ottimo-api:sha-<12>-test` (staging khi QA cần đồng hồ giả), `ottimo-web:sha-<12>` → GHCR riêng tư. Quyền `packages: write` chỉ ở job này. Image web build với `WEB_BUILD_PROFILE=production` và số lễ tân công khai lấy từ biến repo `VITE_DESK_PHONE`; thiếu hoặc sai dạng thì job dừng trước khi build (UXR P-15, `infra/docker/check-web-build-config.sh`).
2. Máy chủ: `infra/server/bin/deploy.sh <tag>` – kéo image → PostgreSQL → `02-roles.sh` (H3) → migration (dịch vụ một lần `migrate`, trước khi api/worker đổi image) → so `count(drizzle.__drizzle_migrations)` với journal trong image (ARC 4.2-7) → đổi api/worker/web → smoke (`/health`, `rolconfig`, worker, header 3 tên miền, probe 404, log không có token `/g/`). Tự động từ CI: job `deploy-staging` (biến `STAGING_DEPLOY=true`) SSH bằng khóa bị ép lệnh (`deploy-from-ci.sh` chỉ nhận `deploy sha-<hex>`).
3. Quay lui: lỗi sau khi đổi container → `deploy.sh` tự đặt lại tag trước; bằng tay `rollback.sh [tag]`. DB không quay lui: migration theo kiểu "mở rộng trước – thu hẹp sau" (`deploy.sh --rollback` chấp nhận DB mới hơn journal của image cũ).
4. Đã diễn tập local (container Ubuntu 24.04 đóng vai VPS, Docker 29.8, image thật, `APP_ENV=staging`): deploy, deploy lần 2, quay lui, bản lỗi giả lập → tự quay về bản trước, sao lưu, kiểm tra J16, diễn tập khôi phục – `rounds/round-02/outputs/OPS/s3-report.md`.

## 7. Sao lưu, khôi phục, vòng đời log (khớp SEC T15/T16/T18)

| Hạng mục | Thiết kế đề xuất | Căn cứ |
|---|---|---|
| Sao lưu DB | `pg_dump` hằng ngày 03:30 giờ VN + WAL archive (khôi phục tới thời điểm, mất tối đa ~15 phút – **R3**). **Đã cài (R2 S3):** `infra/server/bin/backup.sh` + `ottimo-backup.timer`: `db-*.dump.age` (pg_dump -Fc), `blobs-*.tar.age` (volume tệp mã hóa), `purge-journal-*.csv.age` (SR-BAK-06, giữ 40 ngày), kèm `.sha256`; không ghi tệp chưa mã hóa; từ chối chạy nếu `recipients.txt` thiếu hoặc lỡ chứa khóa riêng | ADR-010 mục 3 |
| Mã hóa | Mã hóa bản sao lưu bằng `age` trên máy chủ trước khi chuyển đi; khóa giải mã do INV + OPS giữ, không nằm trên máy chủ | SEC |
| Nơi giữ | Off-site **tại Việt Nam** (PA2: VPS phụ hãng khác; PA1: object storage VN) | ESC-002 A |
| Quyền ghi đích backup | Máy production chỉ có quyền **ghi thêm**, không xóa/sửa: PA1 – khóa truy cập object storage chỉ `PutObject` + bật khóa đối tượng/vòng đời do đích tự xóa sau 35 ngày; PA2 – đích **tự kéo về** (máy phụ dùng khóa SSH chỉ đọc vào thư mục backup của production). Kẻ chiếm máy production không xóa được backup | SR-BAK-04, TM-51 |
| Tách khỏi staging (PA2) | Backup production nằm trong tài khoản hệ điều hành `backup` riêng trên máy phụ, thư mục 0700, **không mount** vào container nào; ứng dụng staging chạy user khác, không đọc được. Staging và môi trường diễn tập **không bao giờ dùng chung volume** | SR-BAK-05, TM-52 |
| Snapshot của nhà cung cấp VPS | **Tắt** snapshot/backup tự động của hãng (bản chụp toàn ổ đĩa có cả `.env`, khóa và DB, giữ theo chính sách của hãng → phá cam kết ≤ 35 ngày). Nếu hãng bắt buộc: giữ ≤ 7 ngày. Chỉ chụp thủ công trước nâng cấp lớn và **xóa trong 24 giờ** | SR-BAK-03, TM-15 |
| Vòng xoay | **7 bản hằng ngày + 4 bản hằng tuần = tối đa 35 ngày**; WAL giữ 7 ngày | SEC **T18** (dữ liệu đã xóa biến mất khỏi backup sau ≤ 35 ngày) |
| Lệch cần ARC sửa | ADR-010 mục 3 ghi "giữ 7 ngày + 4 tuần + **3 tháng**" → **vượt T18**. OPS đề xuất bỏ bản 3 tháng (hoặc chỉ giữ nếu SEC/luật sư đồng ý, vì dữ liệu C3 đã được hủy khóa – ADR-013 – nhưng dữ liệu C2 thì không) | Thẻ review gửi ARC ở bước 3 |
| Thử khôi phục | Mỗi round, trong **môi trường dùng một lần** – xem mục 7.1. **Không** khôi phục backup production vào staging/dev | SR-BAK-05/06, FB-R1-ARC-OPS-09 |
| RPO / RTO | RPO ≤ 15 phút (WAL), tệ nhất 24 giờ (dump); RTO ≤ 4 giờ (dựng VPS mới + khôi phục) | ADR-010 [GIẢ ĐỊNH – OPS xác nhận khi diễn tập R3] |
| Log kỹ thuật | Ứng dụng ghi JSON ra stdout: mỗi request chỉ `method`, **mẫu route**, mã trạng thái, thời gian – không query string, không header, không IP rõ (R2: `ip_hmac`); khóa nhạy cảm (`password`, `pin`, `otp`, `token`, `code`, `secret`, `docNumber`…) bị che (đã có trong khung + test). Caddy production che `/g/*` và **toàn bộ query string** trong access log – đặc biệt `/v1/webhooks/*` (VNPay IPN dạng GET mang chữ ký, số tiền trên query; `CHANNEL_WEBHOOK_PATH_TOKEN` nằm trong đường dẫn nên đường dẫn webhook cũng ghi dạng mẫu, không ghi token) – INT-responses mục 4. Docker xoay vòng log theo dung lượng; bản lưu lâu dài giữ **90 ngày** rồi xóa; không chứa dữ liệu C3 | SEC **T16**, SR-LOG-01…04 |
| Audit log, nhật ký truy cập C3 | Nằm trong PostgreSQL (append-only), giữ 24 tháng theo job xóa của BE | SEC **T15** |

### 7.1 Diễn tập khôi phục (thay cho "khôi phục vào staging")

1. **Trước khi có dữ liệu thật (R2–R3):** diễn tập bằng backup **của staging** (dữ liệu giả).
2. **Khi đã chạy thật:** trên máy phụ, dựng compose project riêng `ottimo-restore-<yyyymmdd>`: mạng nội bộ, **không publish cổng**, volume tạm; không dùng chung gì với staging.
3. Giải mã backup (`age`) bằng khóa do INV/OPS mang tới; KEK production nạp vào môi trường này **chỉ trong lúc diễn tập** (Docker secret tạm trên tmpfs, không ghi đĩa), không bao giờ lưu trên máy phụ.
4. Khôi phục → **áp lại `purge_journal`** (xóa lại những bản ghi đã xóa sau thời điểm backup, SR-BAK-06) → kiểm: `/health` = 200, đếm bản ghi các bảng chính khớp số ghi lúc backup, giải mã **1** ảnh giấy tờ mẫu.
5. `docker compose -p ottimo-restore-<yyyymmdd> down -v`, xóa tệp giải mã, xóa secret tạm; ghi **biên bản** (ngày, bản backup, thời gian khôi phục = RTO thực, kết quả từng bước, người làm) vào report OPS của round.

## 8. Giám sát (R2: kiểm tra trên máy; R3: theo dõi từ bên ngoài)

- **Đã có (R2 S3):** `infra/server/bin/ops-check.sh` chạy 30 phút/lần (systemd timer `ottimo-ops-check.timer`), cảnh báo vào journal (`journalctl -t ottimo-alert`), `systemctl --failed` và webhook tùy chọn (`ALERT_WEBHOOK_URL`, chỉ khi đổi trạng thái + nhắc 6 giờ/lần, không dữ liệu cá nhân):
  - **J16 (SEC C6, SR-RET-03):** với mỗi cơ sở `active`, lượt `retention_run` policy `J16` trạng thái `done` gần nhất phải < 26 giờ (cơ sở tạo chưa đủ 26 giờ thì chưa xét), và không có lượt `failed` trong 26 giờ. J16 chạy hằng giờ trong worker, mỗi lượt luôn ghi một dòng `J16` (kể cả 0 mục) → 26 giờ không có dòng = worker/job hỏng, ảnh giấy tờ có thể sống quá hạn xóa. Truy vấn bằng superuser qua socket trong container postgres (không mật khẩu, không đi qua RLS), chỉ đọc id cơ sở + thời gian. Lưu ý: staging bật `CLOCK_MODE=mutable` (đồng hồ giả) thì cảnh báo J16 trong lúc QA dời đồng hồ là bình thường.
  - sao lưu thành công gần nhất < 26 giờ; đĩa < 80 %; chứng chỉ TLS còn > 14 ngày; postgres/api/worker/web đang chạy, api `/health` ok.
- Theo dõi `/health` mỗi 1 phút từ bên ngoài (Uptime Kuma tự chạy trên máy staging, hoặc dịch vụ miễn phí – chỉ gọi `/health`, không có dữ liệu cá nhân); cảnh báo qua email/Zalo nhóm vận hành.
- Cảnh báo: đĩa > 80%, sao lưu đêm thất bại, chứng chỉ TLS < 14 ngày, `/health` lỗi 3 lần liên tiếp.
- Không dùng SaaS theo dõi lỗi nước ngoài ở MVP (ADR-010) – xem lại R3.

### 8.1 Sổ bí mật (chỉ ghi tên, không ghi giá trị – FB-R1-SEC-OPS-10)

| Bí mật | Môi trường | Chủ sở hữu | Nơi giữ | Chu kỳ xoay / khi nào xoay |
|---|---|---|---|---|
| `DATA_KEK_CURRENT` (+ `DATA_KEK_VERSION`) | mỗi môi trường một khóa | INV + OPS | Docker secret trên máy chủ; bản ngoại tuyến do INV giữ (production) | Khi nghi lộ hoặc người có quyền nghỉ việc; xoay = thêm phiên bản mới, bọc lại DEK (ADR-013) |
| `ID_HASH_KEY`, `LOG_IP_HMAC_KEY` | mỗi môi trường | OPS | Docker secret | Khi nghi lộ (xoay `ID_HASH_KEY` cần băm lại – runbook R2) |
| `GUEST_CODE_SIGNING_KEY` (HMAC mã xác minh khách – khóa riêng, ADR-013 điểm 5, BUG-R1-SEC-07) | mỗi môi trường | OPS | Docker secret (`GUEST_CODE_SIGNING_KEY_FILE`), ≥ 32 ký tự | Khi nghi lộ; xoay = mọi mã đang chờ (≤ 30 phút) hết hiệu lực, không cần băm lại |
| `SESSION_SECRET` | mỗi môi trường | OPS | Docker secret | 12 tháng hoặc khi nghi lộ (mọi phiên bị đăng xuất) |
| Mật khẩu DB `ottimo_migrator`, `ottimo_app`, superuser (`ottimo_owner` NOLOGIN – không có mật khẩu; `ottimo_readonly` chỉ đặt mật khẩu tạm theo runbook) | mỗi môi trường | OPS | Docker secret | 12 tháng hoặc khi người có quyền nghỉ việc |
| `PAYMENT_*_SECRET*`, `CHANNEL_*`, `EINVOICE_*`, `ZALO_APP_SECRET`, `DOORLOCK_*_SECRET` | staging (sandbox) / production | INV (tài khoản) + INT | Docker secret | Theo hãng; khi nghi lộ hoặc đổi người quản lý tài khoản |
| Khóa `age` giải mã backup | production | INV + OPS | **Ngoài máy chủ** (2 bản ngoại tuyến) | Khi người giữ nghỉ việc |
| Khóa SSH vào máy chủ | production, staging | từng người (OPS, INV) | máy cá nhân | Thu hồi ngay khi nghỉ việc |
| Token GitHub `read:packages` (VPS kéo image GHCR) | staging, production | INV (chủ repo) | `~ottimo/.docker/config.json` trên VPS (0600) | 12 tháng hoặc khi nghi lộ; chỉ quyền đọc package |
| Khóa SSH deploy của CI (`STAGING_SSH_KEY`) | staging | OPS | secret của environment `staging` trên GitHub; trên VPS `authorized_keys` ép lệnh `deploy-from-ci.sh` | 12 tháng hoặc khi nghi lộ |
| `qa_seed_password` (tài khoản `qa.*` dữ liệu giả) | staging | QA + OPS | Docker secret (`init-secrets.sh`) | khi nạp lại seed hoặc người biết nghỉ |

Chi tiết quyền tối thiểu và chu kỳ xoay từng bí mật **tích hợp** (Beds24, VNPay, MoMo, SePay/payOS, MISA 6 tháng, TTLock, SES/Resend, Zalo, `CHANNEL_WEBHOOK_PATH_TOKEN`, `BANKFEED_API_KEY`): `integrations.md` mục 4.1 (INT) – sổ này dùng bảng đó làm nguồn, OPS giữ sổ (SR-SECR-04). Cổng không dùng đặt `off`, không đăng ký webhook.

Runbook xoay KEK/bí mật: R2 (`docs/runbook.md`).

## 9. Việc tiếp theo

Cập nhật R2 S3: dòng "Caddyfile production", "Dựng staging + deploy tự động + quản lý bí mật + migration tự động" và phần "Sao lưu tự động" đã có script và đã diễn tập local; chỉ còn chạy trên VPS thật khi INV báo IP + tên miền (mục 10). WAL archive, off-site kéo về máy phụ, giám sát từ bên ngoài, runbook xoay KEK: R3.


| Việc | Ai | Khi |
|---|---|---|
| Xin báo giá chính thức (có VAT, SLA, vị trí trung tâm dữ liệu, snapshot) từ ít nhất 2 nhà cung cấp VN | OPS | Đầu R2, trước khi thuê |
| INV quyết ESC-002 + duyệt chi phí hosting (ESC mới do OPS đề xuất) | INV | Trước khi OPS dựng staging R2 |
| Chọn và mua tên miền (đứng tên công ty, bật 2 lớp, khóa chuyển nhượng – mục 10); tạo bản ghi tên miền gốc + `www` (landing), 3 tên miền con + `staging`, bản ghi email (mục 5.1, 10) | INV (OPS tư vấn) | Đầu R2, trước staging; gốc + `www` khi landing qua cổng LP-v1 |
| Chọn nhà cung cấp email giao dịch + cấu hình DNS (SPF/DKIM/DMARC) | INT + OPS (INV duyệt nếu có phí – ESC-010) | Đầu R2, trước staging |
| Khi đã có repo GitHub: branch protection `main` (CI xanh + 1 review), secret scanning push protection, GHCR private, `.github/CODEOWNERS` (SEC cho auth/payment/C3/infra/.github) | OPS | R2 (cần tên tài khoản GitHub thật của đội) |
| Caddyfile production: CSP/HSTS/Referrer-Policy, 3 origin app + origin landing ở tên miền gốc (ADR-014 mục 1.4), che log `/g/*`, hạn chế `/health` công khai; `curl -I` kiểm header trong CI | OPS | R2 |
| Dựng staging + deploy tự động + quản lý bí mật + migration tự động | OPS | R2 |
| Sao lưu tự động + diễn tập khôi phục + runbook + giám sát | OPS | R3 |

## 10. Checklist DNS cho chủ đầu tư (dán tại nhà đăng ký tên miền – không cần đưa mật khẩu cho đội)

Thay `<tên-miền>` bằng tên miền INV chọn, `<IP-staging>` / `<IP-production>` bằng IP VPS (hãng gửi khi thuê). Dùng DNS của nhà đăng ký hoặc Cloudflare **chỉ DNS** (đám mây xám – ADR-010, SR-HDR-03). TTL 300 giây trong lúc dựng, sau ổn định để 3600.

**Từ 17/10/2026 (ADR-014): tên miền gốc là landing.**
- Tên miền gốc **không còn để dành**. Nó phục vụ landing (website giới thiệu OTTIMO) từ **chính VPS production** chạy app: Caddy, site thứ 4, 0 đ thêm.
- `www` chỉ chuyển hướng 301 về tên miền gốc.
- App giữ nguyên ở `desk.`, `staff.`, `g.`.

**Trước khi thêm bản ghi – bảo vệ tài khoản tên miền** (SEC ARC-10; INV tự làm; 0 đ).
Từ nay tên miền gốc là "gốc tin cậy" của OTTIMO: website, link `g.` gửi khách, nút trong tin Zalo, email. Ai chiếm được tài khoản tên miền có thể dựng trang giả có chứng chỉ hợp lệ và nhận link của khách.

| # | Việc | Ghi chú |
|---|---|---|
| 1 | Tên miền và tài khoản nhà đăng ký/DNS **đứng tên công ty** (CTCP UTMG Living), không đứng tên cá nhân nhân viên | Email liên hệ/khôi phục của tài khoản là hộp thư **của công ty**, không phải hộp thư cá nhân. Nên dùng hộp thư không nằm trên chính tên miền này, để vẫn nhận thư khi tên miền gặp sự cố |
| 2 | Bật **xác thực 2 lớp** cho tài khoản nhà đăng ký và tài khoản DNS (nếu DNS ở nơi khác, ví dụ Cloudflare) | Ưu tiên ứng dụng xác thực hơn SMS. Ít nhất 2 người của công ty giữ quyền quản trị |
| 3 | Bật **khóa chuyển nhượng** (transfer lock / registrar lock) | Tên miền `.vn`: hỏi nhà đăng ký cách khóa tương đương [Chưa xác minh] |
| 4 | Bật tự gia hạn và nhắc hạn | Tên miền hết hạn = landing, link khách `g.` và email cùng ngừng |
| 5 | Không gửi mật khẩu hay mã 2 lớp cho đội | Đội chỉ cần IP, tên miền và ảnh chụp bảng bản ghi (mục 10.3) |

**10.1 Web (bắt buộc trước khi dựng staging; tên miền gốc + `www` khi landing lên mạng)**

| Loại | Tên | Giá trị | Dùng cho | Khi nào |
|---|---|---|---|---|
| A | `desk.staging` | `<IP-staging>` | Desk staging | R2 – staging |
| A | `staff.staging` | `<IP-staging>` | App nhân viên staging | R2 – staging |
| A | `g.staging` | `<IP-staging>` | Web khách staging | R2 – staging |
| A | `staging` | `<IP-staging>` | Landing bản xem thử (`noindex` + basic auth/IP – SEC ARC-10) | Khi dựng landing (Sprint 4) |
| A | `@` (tên miền gốc) | `<IP-production>` | **Landing** (ADR-014) | Khi landing qua cổng LP-v1 – xem ghi chú "Lên mạng sớm" |
| CNAME | `www` | `<tên-miền>.` (có dấu chấm cuối nếu nhà đăng ký yêu cầu) | Chỉ để Caddy chuyển 301 `www` → tên miền gốc, giữ nguyên đường dẫn. Nhà đăng ký không cho CNAME thì dùng `A www <IP-production>` | Cùng lúc với `@` |
| A | `desk` | `<IP-production>` | Desk | R3 – khi có production |
| A | `staff` | `<IP-production>` | App nhân viên | R3 |
| A | `g` | `<IP-production>` | Web khách | R3 |
| CAA | `@` | `0 issue "letsencrypt.org"` | **Giữ** (SEC ARC-10): chỉ Let's Encrypt được cấp chứng chỉ. Bản ghi CAA ở gốc áp cho cả tên miền gốc, `www` và mọi tên miền con | R2 |
| CAA | `@` | `0 iodef "mailto:<hộp thư nhóm>"` | Báo khi có yêu cầu cấp chứng chỉ trái phép | R2 (tùy chọn) |
| TXT | `@` | `google-site-verification=<mã do Google cấp>` | Xác minh Google Search Console bằng DNS – không gắn script (ADR-014 mục 5) | Khi INV tạo Search Console |

**Lên mạng sớm (trước khi có VPS production)** – ARC quyết kỹ thuật, ORC chốt lịch (ADR-014 mục 8):
- R2 chỉ thuê **một** VPS (mục 4: máy chính sẽ thành production; khi chạy thật, staging chuyển sang máy phụ).
- Nếu landing v1 qua cổng LP-v1 trước R3: được trỏ `@` và `www` vào VPS này, với điều kiện:
  - origin landing chỉ phục vụ tệp tĩnh, trả 404 cho mọi `/v1/*` (v1 không gọi API, không nối tới api staging);
  - dùng bản build production của landing (không `X-Robots-Tag`), header theo ADR-014 mục 1.4.
- Khi VPS production có IP khác: đổi `@`, `www` cùng lượt với `desk`, `staff`, `g`.

Ghi chú:
- **Không** tạo bản ghi AAAA (IPv6) ở R2 – kể cả cho tên miền gốc và `www`: tường lửa và smoke chỉ kiểm IPv4.
- **Không** dùng bản ghi `*` (wildcard).
- Nếu tên miền gốc **đang chạy** một website khác:
  - OPS lập bảng chuyển hướng 301 từ URL cũ sang trang landing tương ứng **trước** khi đổi bản ghi A;
  - hạ TTL xuống 300 giây trước đó ít nhất 24 giờ [Chưa xác minh – INV chưa cho biết tên miền đang dùng gì].
- Tên miền gốc có thể có nhiều bản ghi TXT cùng lúc (mã Google ở đây, SPF ở mục 10.2), nhưng chỉ được có **một** bản ghi SPF.
- Kiểm (OPS làm):
  - `dig +short <tên-miền>`, `dig +short www.<tên-miền>`, `dig +short staging.<tên-miền>`, `dig +short desk.staging.<tên-miền>` ra đúng IP;
  - `dig CAA <tên-miền>` có bản ghi Let's Encrypt;
  - cổng 80 mở để Let's Encrypt cấp chứng chỉ cho gốc + `www` ở lần deploy đầu;
  - `curl -sI https://www.<tên-miền>/vi/` → `301` tới `https://<tên-miền>/vi/`;
  - `curl -sI -H 'Accept-Language: vi' https://<tên-miền>/` → `200`, không chuyển hướng, không `Vary: Accept-Language` (ADR-014 mục 3).
- **Trước khi bật HSTS `includeSubDomains` ở tên miền gốc** (SEC ARC-10 điểm 3):
  - OPS liệt kê **mọi** tên miền con đang có bản ghi (kể cả do nhà cung cấp email tạo) và xác nhận đều chạy HTTPS;
  - HSTS ở gốc áp cho mọi tên miền con, kể cả tên miền con tạo sau này;
  - không bật `preload`.

**10.2 Email giao dịch (SPF / DKIM / DMARC – SR-GST-07, ESC-010)**

R2: email đang ở chế độ Mock (chỉ ghi log), nên chưa cần bản ghi gửi thư. Hai trường hợp:

| Trường hợp | Bản ghi INV dán |
|---|---|
| Tên miền **chưa** dùng để gửi email gì cả (chặn kẻ giả mạo dùng tên miền) | `TXT @ "v=spf1 -all"` · `TXT _dmarc "v=DMARC1; p=reject; adkim=s; aspf=s"` |
| Tên miền đã có email (Google Workspace, Zoho…) | Giữ bản ghi SPF/DKIM hiện có; chỉ thêm `TXT _dmarc "v=DMARC1; p=none; rua=mailto:<hộp thư nhóm>"` nếu chưa có – không thêm SPF thứ hai |
| Khi chọn nhà cung cấp email giao dịch (Amazon SES – đề xuất INT) | Theo bảng khuôn ở mục 5.1 (3 CNAME DKIM do SES sinh, MX + SPF cho `mail.<tên-miền>`, DMARC `p=none` → `quarantine` sau 2–4 tuần) – thay cho dòng "chưa gửi email" ở trên |

**10.3 Gửi lại cho đội:**
- IP VPS, tên miền đã chọn;
- ảnh chụp bảng bản ghi DNS (không cần tài khoản nhà đăng ký);
- xác nhận có/không cho 5 việc bảo vệ tài khoản tên miền ở đầu mục 10. Chỉ trả lời có/không, không gửi ảnh trang tài khoản hay thông tin đăng nhập;
- tên miền gốc hiện có đang chạy website nào không.

