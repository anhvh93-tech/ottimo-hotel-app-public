# OPS – Round 2 · Sprint 3 (Sản xuất + Phản hồi & sửa phần OPS)

- Người viết: OPS | Ngày: 16/10/2026 | **Không commit** (ORC commit)
- Đầu vào: `outputs/BE/s3-be-c.md` mục 5 (OPS), `outputs/MOB/s3-report.md` (dòng OPS), `outputs/SEC/s3-checklist.md` (C2, C3, C6, G4, G5, mục H), `outputs/ARC/s3-contract.md` 4.2-7, `reviews/s3-SEC.md` **FB-R2-SEC-OPS-03 (Blocker)**, `reviews/s3-ARC.md` **FB-R2-ARC-BE-S3-18 (phần OPS)**, yêu cầu gấp của ORC về CI run 38929255451.

## 0. Sự cố CI đỏ (run 38929255451, HEAD a297273) – đã tìm ra nguyên nhân và sửa

| | |
|---|---|
| Triệu chứng | `dependency failed to start: container ottimo-dev-api-1 is unhealthy` (migrate thoát 0) |
| Tái hiện | Bản sao sạch `git archive HEAD product` ở scratchpad, project `ottimo-ci-s3`, cổng riêng (13000/1808x/15432), `.env` sinh bằng `make-ci-env.sh` + 3 khóa origin như CI |
| Nguyên nhân | api **và** worker dừng ngay lúc khởi động: `Error: EACCES: permission denied, mkdir '/app/.data/blobs'`. Compose dev không truyền `BLOBSTORE_LOCAL_PATH` → `LocalBlobStore` (BE-C) dùng mặc định `./.data/blobs` = `/app/.data/blobs`; `/app` trong image thuộc root, tiến trình chạy `node`. **Không phải** sharp 0.35.5 (nạp được trong image alpine, mã hóa lại + bỏ EXIF + chặn 40 MP đều chạy), **không phải** thiếu khóa (dev/test cho phép trống), **không phải** lỗi code BE (mặc định đó chỉ dành cho api chạy trên máy) |
| Sửa (vùng OPS) | `Dockerfile.api`: tạo `/var/lib/ottimo/blobs` chủ `node:node`, 0700 + bước build **kiểm sharp nạp được** (thiếu gói `@img/sharp-linuxmusl-*` → build đỏ ngay, không đợi lần tải ảnh đầu). `docker-compose.yml`: `BLOBSTORE_PROVIDER=local`, `BLOBSTORE_LOCAL_PATH=/var/lib/ottimo/blobs`, volume `blobdata` gắn vào **api + worker** (J16 xóa tệp), không gắn vào `web` |
| Kiểm chứng | Cùng stack tạm sau khi sửa: `up --wait` exit 0, `/health` 200 (trực tiếp và qua Caddy), blob put/get/delete chạy trong cả api và worker bằng code thật (`dist/modules/files/internal/blob-store.js`), seed DS-E nạp được; Playwright như CI (CI=1, không UI): **844 pass**, 2 flaky (429, qua khi retry), 230 skip (UI tắt), 30 không chạy, **1 fail TC-L2-053 (b)** `s2-fix.api.spec.ts:279` (mong -350000, nhận 0 – nghiệp vụ hủy đơn đã cọc, đỏ từ Sprint 2, **việc BE/QA**, không do hạ tầng) |
| CI dễ đọc hơn | Bước "Start compose stack" tự in `ps --all` + log `db-roles/migrate/api/worker/web` ngay trong bước bị đỏ (đã thử bằng lỗi giả `ConfigError`: lý do hiện ngay); bước "Compose logs (on failure)" tách nhóm theo dịch vụ |

## 1. Đã làm gì (theo việc ORC giao)

### 1.1 Volume blob + sharp (BE-C, SEC C2/SR-FILE-04)
- Dev: như mục 0. Staging/production (`infra/docker-compose.prod.yml`): volume `blobdata` → `/var/lib/ottimo/blobs` chỉ ở api + worker, `BLOBSTORE_LOCAL_PATH` tuyệt đối; container `read_only` + tmpfs `/tmp` (không có tệp tạm rõ ra đĩa), `cap_drop: [ALL]`, `no-new-privileges`. Image không đặt sẵn `BLOBSTORE_LOCAL_PATH`: quên volume thì staging/production dừng (BE-C) chứ không ghi giấy tờ vào lớp container.
- sharp trong image api (arm64 musl, cũng là bước build trên CI amd64): `sharp 0.35.5 / vips 8.18.7`; thử trong container `--read-only --cap-drop ALL`: ảnh có EXIF → bản ra không EXIF; 48 MP với `limitInputPixels 40e6` → từ chối. Tải ảnh thật qua Caddy production → api → sharp → blob: 201, đọc lại 200 `image/jpeg` (mục 3).

### 1.2 Cảnh báo J16 26 giờ, che `/g/*`, CSP + Referrer-Policy guest-web
- **J16 (SEC C6, SR-RET-03) – cơ chế cho staging**: `infra/server/bin/ops-check.sh` chạy 30 phút/lần bằng systemd timer `ottimo-ops-check.timer`. Mỗi cơ sở `active`: lượt `retention_run` policy `J16` `done` gần nhất phải < 26 giờ (cơ sở mới < 26 giờ chưa xét), không có lượt `failed` trong 26 giờ. J16 luôn ghi 1 dòng `J16` mỗi lượt (kể cả 0 mục – đọc `retention.service.ts`), nên 26 giờ không có dòng = worker/job hỏng. Truy vấn bằng superuser qua socket trong container postgres (không mật khẩu, không vướng RLS), chỉ đọc id cơ sở + tuổi. Cảnh báo: journal (`journalctl -t ottimo-alert -p err`), unit `failed`, webhook tùy chọn `ALERT_WEBHOOK_URL` (chỉ khi đổi trạng thái + nhắc 6 giờ, không dữ liệu cá nhân). Cùng script kiểm: sao lưu < 26 giờ, đĩa < 80 %, chứng chỉ > 14 ngày, container chạy. Đã thử: J16 thật của worker → ok; `J16_MAX_HOURS=0` → FAIL đúng mẫu tin. Không chọn Docker healthcheck vì worker mới khởi động chưa có dòng J16 (báo đỏ giả) và healthcheck không gửi cảnh báo.
- **Caddy production/staging** (`infra/caddy/Caddyfile.prod`, mới): 3 origin `{$DESK_HOST}/{$STAFF_HOST}/{$GUEST_HOST}` (TLS Let's Encrypt, HTTP→HTTPS, HTTP/3 tắt), mỗi origin proxy `/v1` (không CORS). Header: CSP `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src <'none' desk/guest, 'self' staff>; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'` (không `unsafe-*`), HSTS 1 năm, `Referrer-Policy` guest `no-referrer` / desk, staff `same-origin`, `Permissions-Policy` (chỉ `camera=(self)`), `X-Frame-Options DENY`, COOP/CORP `same-origin`, `X-Robots-Tag noindex`, bỏ `Server`/`Via`. Header của api **được giữ** (mỗi giá trị mặc định là một chỉ thị `?` riêng): `getAttachment` vẫn `CSP: sandbox; default-src 'none'` + `no-store` (đã thử). `index.html` guest `no-store`, desk/staff `no-cache`; `/assets/*` cache 1 năm, tài sản thiếu → 404 (không trả HTML). Log truy cập JSON: **bỏ toàn bộ query string, `/g/<token>` → `/g/[redacted]`, đường dẫn webhook sau provider → `[redacted]`, xóa mọi header request/response (Cookie, Authorization, X-CSRF-Token, Set-Cookie…), IP che /24 (/48 IPv6)**; cùng bộ lọc cho log lỗi mặc định. `/health` chỉ từ mạng Docker / IP giám sát (`HEALTH_ALLOW_IPS`); `/__test__/*` chỉ từ `TEST_SUPPORT_ALLOW_IPS` (mặc định không ai). Tệp ẩn, `.map`, `/var|/data|/blobs|/srv|/etc|/run|/proc…` → 404.
- **Thân request (ARC S3-18, thay `max_size 25MB`)**: 3 đường multipart (`addGuestDocument`, `uploadAttachment`, `uploadGuestDocument`) ≤ 42 MB = `MULTIPART_BODY_LIMIT` của BE-C; mọi đường khác ≤ 1 MB. `Content-Length` khai vượt → 413 ngay ở Caddy (không có thì api nhận thân cụt và client thấy 502 – gặp thật khi thử); `max_size` vẫn chặn thân chunked. Timeout: đọc header 10 s, cả request 90 s, idle 2 phút. Dev (`Caddyfile.dev`) dùng cùng giới hạn + `Referrer-Policy`/`no-store` cho guest (không gửi CSP ở dev).

### 1.3 `.dockerignore` – dòng `!design/copy/strings-ru.json` (MOB)
Xác nhận đúng và cần: build image web (guest-web nạp `strings-ru.json`) xanh với dòng này; image api không cần `design/` (`portal-copy.ts` đã sinh và commit). Chỉ sửa chú thích cho khớp (5 tệp, không còn "three").

### 1.4 SEC H3 – 2 lệnh `ALTER ROLE` chạy cả khi volume đã có
- `02-roles.sh`: nhận `*_FILE` (Docker secrets), cuối script **đọc lại `rolconfig`** và thoát 1 nếu thiếu `idle_in_transaction_session_timeout=30s` hoặc `statement_timeout=15s`.
- Dev/stack tạm: dịch vụ một lần mới `db-roles` (image postgres, superuser qua mạng compose) chạy script ở **mỗi** `up`, `migrate` chờ nó thoát 0. Staging/production: `deploy.sh` chạy `dc exec postgres bash …/02-roles.sh` trước migration ở mỗi lần deploy.
- CI: bước mới "DB role limits applied (ottimo_app rolconfig)" sau khi stack lên (đã chạy thử đúng lệnh trên stack tạm: `idle_in_transaction_session_timeout=30s,statement_timeout=15s`).

### 1.5 Script dựng staging trên VPS (`infra/server/`, hướng dẫn `infra/server/README.md`)
| Tệp | Việc |
|---|---|
| `bootstrap-vps.sh` (root, chạy lại được) | apt + tự vá bảo mật (khởi động lại 02:30 giờ VN), Docker từ kho chính thức (**kiểm vân tay khóa** 9DC8…CD88), `daemon.json` (log `local` xoay vòng, `live-restore`, không userland-proxy, `no-new-privileges`), swap 2 GB, user triển khai `ottimo` uid 2001 (**không** 1000 – uid của container api), tường lửa ufw 22/80/443, SSH chỉ khóa (`sshd -t` trước khi reload; tắt hẳn root nếu có `--admin-user`), thư mục `/opt/ottimo`, chép bundle (chủ root), cài timer |
| `bin/init-secrets.sh` (root, một lần) | sinh ngẫu nhiên tại chỗ 11 tệp bí mật (DB, URL DB, 5 khóa mỗi khóa một mục đích, mật khẩu seed QA), không ghi đè; thư mục `0710 root:ottimo`, tệp `0400` chủ uid container đọc nó (1000 api/worker, 70 postgres) – SR-KEY-10: user SSH (kể cả `ubuntu` uid 1000) không đọc được, `docker inspect` chỉ thấy `*_FILE` |
| `docker-compose.prod.yml` + `bin/dc` | staging/production một tệp; mạng `db` internal / `edge` (Caddy IP cố định = `TRUST_PROXY`) / `egress`; mọi container `read_only`, `cap_drop ALL`, giới hạn RAM/PID, log xoay vòng; Caddy uid 10001 nghe 80/443 nhờ sysctl không gian tên (không capability); volume chứng chỉ bền (tránh giới hạn Let's Encrypt) |
| `bin/deploy.sh <tag>` | kéo image CI → postgres → `02-roles.sh` → migrate (một lần) → so số migration DB với journal của image (ARC 4.2-7) → đổi api/worker/web → smoke (health, rolconfig, worker, header 3 host, probe 404, `/g/<token giả>` không có trong log Caddy) → lỗi thì **tự đặt lại tag trước** |
| `bin/rollback.sh`, `bin/deploy-from-ci.sh` | quay lui bằng tay; lệnh ép cho khóa CI (chỉ `deploy sha-<hex>`) |
| `bin/backup.sh` + `ottimo-backup.timer` | 03:30 giờ VN: pg_dump, volume blob, `purge_journal` riêng (SR-BAK-06) → mã hóa `age` bằng **khóa công khai** (khóa riêng không bao giờ trên VPS), `.sha256`, 7 ngày + Chủ nhật ≤ 35 ngày (SR-BAK-03); từ chối nếu `recipients.txt` thiếu hoặc lỡ chứa khóa riêng |
| `bin/ops-check.sh` + `ottimo-ops-check.timer` | mục 1.2 |
| `bin/restore-drill.sh` | diễn tập khôi phục dùng một lần (SR-BAK-05) + biên bản |
| `env.example`, `systemd/*` | mẫu `.env` không bí mật; 4 unit |

- CI (`.github/workflows/ci.yml`): job `publish-images` (push `main`, **bật bằng biến repo `PUBLISH_IMAGES=true`**, `packages: write` chỉ ở job này, quét `/__test__` trên tag production) đẩy `ottimo-api:sha-<12>`, `…-test`, `ottimo-web:sha-<12>` lên GHCR riêng tư; job `deploy-staging` (biến `STAGING_DEPLOY=true`, environment `staging`) SSH bằng khóa bị ép lệnh. Job mới `infra-scripts` (shellcheck); bước mới trong `docker-build`: compose production `config` + `infra/ci/check-caddy-prod.sh` (chạy Caddyfile.prod từ image vừa build: 45 kiểm – header 3 host, probe 404, 413, log không có token `/g/`, không có header request).
- Checklist DNS cho INV (desk./staff./g. + `.staging`, CAA, SPF/DKIM/DMARC – kể cả cấu hình "tên miền không gửi email" để chống giả mạo): `docs/hosting-plan.md` mục 10. INV chỉ cần dán bản ghi, không đưa mật khẩu.

## 2. Phản hồi thẻ review (ORC chép sang `responses/` nếu cần)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-OPS-03 (Blocker) | Done (chờ SEC kiểm lại trên staging thật) | (1) `Caddyfile.prod` + `docker-compose.prod.yml` có trong cây làm việc, chưa commit (ORC commit). (2) guest: `worker-src 'none'`, `Referrer-Policy: no-referrer`, `index.html` `no-store`; desk cũng `worker-src 'none'`, staff `'self'` (PWA). (3) `blobdata` gắn api + worker, không gắn web, `BLOBSTORE_LOCAL_PATH` tuyệt đối – dev + prod. (4) Smoke tự động ở 2 nơi: mỗi PR (`check-caddy-prod.sh`) và mỗi deploy (`deploy.sh`): CSP/Referrer/HSTS 3 host, `/var/lib/ottimo/blobs/…`, `/blobs/x`, `/.env`, `.map` → 404, mở `/g/<token giả>` rồi grep log Caddy không thấy token. Kiểm thêm bằng Chromium dưới CSP production: 0 vi phạm (mục 3) |
| FB-R2-ARC-BE-S3-18 (phần OPS) | Done | Caddy 42 MB chỉ cho 3 đường upload (POST), 1 MB phần còn lại, 413 sớm theo `Content-Length`, timeout đọc 90 s. Lệch văn bản: **SR-FILE-02 vẫn ghi "Caddy 25 MB"** → SEC sửa câu chữ theo quyết định này (hoặc phản biện) |

## 3. Kiểm chứng (16/10/2026, OrbStack, Docker 29.8.2, Compose v5.5/v5.6)

| Kiểm | Kết quả |
|---|---|
| `docker build` api (`Dockerfile.api`) / web (`Dockerfile.web`) | Xanh (arm64); bước kiểm sharp in `sharp 0.35.5 vips 8.18.7` |
| `docker compose config --quiet` – dev với `.env` và `.env.example`; prod với `server/env.example` (cả profile `deploy`, `seed`) | exit 0 |
| `caddy adapt/validate` Caddyfile.prod (Caddy 2.11.7 của image) | Valid |
| `infra/ci/check-caddy-prod.sh ottimo-web:<build>` | 45/45 ok |
| shellcheck `-S warning` mọi script hạ tầng (Ubuntu 24.04, ShellCheck 0.9.0) | sạch |
| Prettier `infra/*.yml` | sạch (cảnh báo còn lại của workspace nằm ở tệp BE/FE/QA đang sửa) |
| **Diễn tập staging local**: container Ubuntu 24.04 đóng vai VPS (Docker CLI + compose cài từ kho Docker có kiểm vân tay khóa), `OTTIMO_HOME` trên volume Linux thật, image thật, `APP_ENV=staging`, tên `desk/staff/g.localhost` (CA nội bộ của Caddy), cổng 80/443 | `init-secrets.sh` (chạy 2 lần – lần 2 không làm gì; user `ottimo` và `ubuntu` uid 1000 **không** đọc/list được bí mật); `deploy.sh r1` OK (roles → 26/26 migration → smoke đủ) – 18 giây; deploy `r2` OK; `rollback.sh` → r1 OK; bản lỗi giả lập `r3` (api thoát 1) → FAIL + **tự quay về r1**, mọi container healthy; `deploy-from-ci.sh` từ chối lệnh khác `deploy sha-<hex>` |
| Qua Caddy production (diễn tập) | đăng nhập `qa.owner` 200 với cookie `__Host-ottimo_sid`; `uploadAttachment` 201 (sharp + volume blob trong container read-only); `getAttachment` 200 giữ `CSP: sandbox; default-src 'none'`, `private, no-store`; JSON 2 MB → 413; upload 30 MB → qua Caddy, api 422 `FILE_TOO_LARGE`; 43 MB → 413; `docker inspect` api chỉ có `*_FILE` |
| CSP bằng Chromium (Playwright, bundle production) | desk: `/login`, `/today`, `/rack`, `/reservations`, `/registration`, `/settings/parameters`, `/quotes` (đã đăng nhập); staff `/`; guest `/g/<token giả>` (URL còn `/` – token đã rời thanh địa chỉ): **0 vi phạm CSP**; log Caddy chỉ có `/g/[redacted]` |
| `backup.sh` | 3 tệp `.age` + `.sha256` (DB 571 KB, blobs, purge-journal) |
| `ops-check.sh` | containers/j16/backup/disk ok; tls báo đúng chứng chỉ CA nội bộ 12 giờ (chỉ ở diễn tập) |
| **Diễn tập khôi phục** (`restore-drill.sh`, khóa riêng age để ngoài "VPS") | ĐẠT – giải mã + DB + 3 tệp blob + api `/health` ok trong **5 giây**; đếm: 26 migration, 1 cơ sở, 13 user, 3 DEK sống; môi trường tạm đã xóa sạch |
| Chạy thử `bootstrap-vps.sh` trong container Ubuntu 24.04 mới | Chạy đúng tới hết phần cài Docker: apt + gói nền, khóa kho Docker **khớp vân tay**, cài `docker-ce` 29.9.1 + compose v5.6.0, ghi `daemon.json`; dừng ở `systemctl restart docker` vì container không có systemd (như dự kiến). Phần user/tường lửa/SSH/timer kiểm lần đầu trên VPS thật (mục 6) |

Đã dọn: stack `ottimo-ci-s3`, stack diễn tập `ottimo`, container/volume `ottimo-rehearsal-*`, image thử. Stack `ottimo-dev` và các stack `ottimo-qa-s3*` của QA không bị đụng tới.

## 4. File tạo / sửa

Tạo:
- `product/infra/docker-compose.prod.yml`, `product/infra/caddy/Caddyfile.prod`, `product/infra/ci/check-caddy-prod.sh`
- `product/infra/server/README.md`, `env.example`, `bootstrap-vps.sh`, `bin/dc`, `bin/init-secrets.sh`, `bin/deploy.sh`, `bin/rollback.sh`, `bin/deploy-from-ci.sh`, `bin/backup.sh`, `bin/ops-check.sh`, `bin/restore-drill.sh`, `systemd/ottimo-backup.service`, `systemd/ottimo-backup.timer`, `systemd/ottimo-ops-check.service`, `systemd/ottimo-ops-check.timer`
- `rounds/round-02/outputs/OPS/s3-report.md`

Sửa:
- `product/infra/docker/Dockerfile.api` (thư mục blob, kiểm sharp), `product/infra/docker/Dockerfile.web` (chú thích)
- `product/infra/docker-compose.yml` (volume `blobdata`, `BLOBSTORE_*`, dịch vụ `db-roles`)
- `product/infra/caddy/Caddyfile.dev` (giới hạn thân, Referrer-Policy/Cache-Control guest)
- `product/infra/postgres/init/02-roles.sh` (`*_FILE`, đọc lại `rolconfig`)
- `.github/workflows/ci.yml` (log khi stack đỏ, kiểm `rolconfig`, compose prod + Caddyfile.prod, job `infra-scripts`, `publish-images`, `deploy-staging`)
- `product/.dockerignore` (chú thích), `product/docs/dev-setup.md`, `product/docs/hosting-plan.md` (mục 1, 5, 6, 7, 8, 8.1, 9, **10 – checklist DNS**)

## 5. Giả định

1. Thân request: theo ARC S3-18 (42 MB upload / 1 MB còn lại) thay vì 25 MB của SR-FILE-02 – ORC đã chỉ đạo "nhất quán với BE-C"; SEC chốt câu chữ.
2. GHCR (kho image riêng tư của repo) không phát sinh phí với hạn mức hiện tại `[GIẢ ĐỊNH – hosting-plan 3 ghi "0 đ, chưa xác minh"]`; vì vậy job đẩy image **tắt mặc định** (biến `PUBLISH_IMAGES`) – ORC/INV bật khi dựng staging. Nếu GitHub báo vượt hạn mức: dọn bản cũ (giữ 10 tag gần nhất – R3) hoặc chuyển sang `docker save | ssh docker load` (không cần kho).
3. Staging = 1 VPS Ubuntu 22.04/24.04 tại VN (ESC-002 A, gói H-B), tên con `desk.staging`, `staff.staging`, `g.staging`; production dùng cùng script ở R3 trên máy riêng.
4. Giờ hệ điều hành VPS đặt `Asia/Ho_Chi_Minh` (log, giờ tự khởi động lại 02:30); container giữ `TZ` riêng như hiện tại.
5. Đề xuất ghi `decision-log.md` (ngoài vùng OPS – ORC ghi):
   - `| 16/10/2026 | 2 | Kho tệp mã hóa: volume blobdata → /var/lib/ottimo/blobs chỉ ở api + worker (dev + staging/production), image tạo thư mục node 0700, không đặt sẵn BLOBSTORE_LOCAL_PATH | OPS | CI run 38929255451; BE-C; SEC C2 |`
   - `| 16/10/2026 | 2 | 02-roles.sh chạy lại ở mỗi up (db-roles) và mỗi deploy, tự kiểm rolconfig | OPS | SEC H3 |`
   - `| 16/10/2026 | 2 | Staging/production: docker-compose.prod.yml + Caddyfile.prod + infra/server (bí mật *_FILE, deploy có smoke + tự quay lui, backup age, ops-check J16 26 giờ qua systemd timer) | OPS | hosting-plan 5–8, SEC OPS-03, C6 |`
   - `| 16/10/2026 | 2 | Giới hạn thân qua Caddy: 42 MB 3 đường upload, 1 MB còn lại, 413 sớm theo Content-Length | OPS (theo ARC S3-18) | SR-FILE-02 chờ SEC sửa câu chữ |`

## 6. Rủi ro / vướng mắc – việc cần vai khác

| Ai | Việc |
|---|---|
| **INV (qua ORC)** | Staging HTTPS chỉ còn chờ: IP VPS + tên miền + bản ghi DNS (`hosting-plan.md` mục 10) + token GHCR `read:packages` + bật `PUBLISH_IMAGES`. Đây là phần còn lại của ESC-002/ESC-010 (không phải ESC mới); theo plan R2-5, ORC cân nhắc nâng "Gấp" vì QC Sprint 3 cần luồng A1 trên staging |
| **SEC** | Sửa SR-FILE-02 (25 MB → 42/1 MB) hoặc phản biện; kiểm header trên staging thật khi có (OPS-03 điểm 4 đã tự động hóa) |
| **BE / QA** | TC-L2-053 (b) đỏ (mong -350000, nhận 0) – không do hạ tầng. Endpoint nào cần thân JSON > 1 MB thì báo OPS (hiện không thấy, webhook ≤ 64 KB) |
| **MOB** | Bundle production của `apps/mobile` có `index-*.js.map` (349 KB mã nguồn) – Caddy production đã trả 404, nhưng nên tắt `build.sourcemap` cho bản production (Minor). Thẻ "eslint ignore `tests/e2e/playwright-report/`": `eslint.config.js` đã có dòng ignore (dòng 25–26) – không cần OPS làm |
| **QA** | Chạy E2E UI trên staging thật có kiểm console CSP (diễn tập đã sạch 9 trang, chưa phủ hết hộp thoại/luồng) |
| **BE (R3)** | Lệnh kiểm giải mã 1 ảnh mẫu bằng KEK trong image (diễn tập khôi phục SR-BAK-05 bước giải mã); lệnh áp lại `purge_journal` sau khôi phục (SR-BAK-06) |
| Rủi ro | `bootstrap-vps.sh` mới chạy được phần apt/Docker trong container (không có systemd/ufw/sshd) – phần tường lửa/SSH/timer kiểm lần đầu trên VPS thật (script kiểm `sshd -t` và có khóa trước khi tắt mật khẩu nên không tự khóa ngoài). Staging bật `CLOCK_MODE=mutable` thì cảnh báo J16 có thể giả khi QA dời đồng hồ |

## 7. Việc chưa xong
- Chạy trên VPS thật (cần mục 6 dòng INV); xác nhận CI xanh trên GitHub với các bước/job mới (cần ORC commit + push).
- R3: WAL archive, máy phụ kéo bản sao lưu (SR-BAK-04), giám sát từ bên ngoài, runbook xoay KEK, dọn package GHCR cũ, cảnh báo `job_run.stats.failures` (SEC H5).

## 8. ESC mới
Không. (Phần còn chờ INV thuộc ESC-002/ESC-010 đã có.)

## 9. Bổ sung 17/10 – bỏ 3 biến VietQR (SEC-INT-06, yêu cầu ORC)
- INT đã bỏ đường dự phòng bằng biến môi trường: tài khoản nhận VietQR **chỉ** lấy từ tham số `payment_receiving_account` (OWN nhập trong app, hỏi lại mật khẩu, audit `money`). `integrations/common/safe-config.ts` (`RETIRED_VIETQR_ACCOUNT_VARS`) làm api/worker **dừng** khi `PAYMENT_VIETQR_BANK_BIN/_ACCOUNT_NO/_ACCOUNT_NAME` khác rỗng (để trống vẫn chạy được).
- Đã bỏ 3 dòng khỏi `product/.env.example` (thay bằng chú thích chỉ sang tham số) và khỏi `x-api-env` của `infra/docker-compose.prod.yml` (không truyền nữa). Thêm chú thích trong `infra/server/env.example`. `infra/ci/make-ci-env.sh` và compose dev không có 3 biến này (compose dev không truyền biến tích hợp nào) – không cần sửa.
- `docs/dev-setup.md`: dev/staging – OWN nhập tài khoản **thử** ở Tham số → `payment_receiving_account` (hỏi lại mật khẩu); thêm dòng sự cố "`… is no longer read`" → xóa/comment 3 dòng trong `.env` cũ.
- Kiểm: `docker compose config --quiet` xanh với dev + `product/.env` (ORC đã comment 3 dòng), dev + `.env.example`, dev + `.env` sinh bởi `make-ci-env.sh` (0 dòng `PAYMENT_VIETQR_ACCOUNT*`), prod + `server/env.example` (chỉ còn `PAYMENT_VIETQR_MODE`).
- File sửa thêm: `product/.env.example`, `product/infra/docker-compose.prod.yml`, `product/infra/server/env.example`, `product/docs/dev-setup.md`, report này.
