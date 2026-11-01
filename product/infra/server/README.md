# Dựng staging (và sau này production) trên VPS – OTTIMO Desk

- Người viết: OPS | Round 2 – Sprint 3 | Ngày: 16/10/2026
- Dùng khi: chủ đầu tư (INV) đã thuê VPS Ubuntu LTS tại Việt Nam (ESC-002 A, gói H-B) và có tên miền.
- Căn cứ: `product/docs/hosting-plan.md` (mục 5–8, 10), SEC `s3-checklist.md` (C2, C6, G4, G5, H3), `security-requirements.md` (SR-HDR, SR-LOG, SR-BAK, SR-KEY-10), ARC `s3-contract.md` 4.2-7.
- Đã diễn tập đủ quy trình trên máy local (container Ubuntu 24.04 đóng vai VPS, image thật, tên `*.localhost`): `rounds/round-02/outputs/OPS/s3-report.md` mục 3.

## 0. INV cần đưa gì (không cần đưa mật khẩu nào)

Hướng dẫn từng bước cho INV (R-5, 21/10/2026): `rounds/round-02/inv-staging-checklist.md`. Ghi chú cho OPS:
- Khóa SSH của OPS là `~/.ssh/ottimo_ops` trên máy INV (đội làm việc từ máy này), dùng qua Keychain.
- VPS tạo theo **cách B** (hãng chỉ cho mật khẩu root) thì INV đã tạo `ottimo-admin` (sudo, có khóa). Ở bước 2–3: `scp` vào `ottimo-admin@<IP>:~/`, chạy `sudo bash …/bootstrap-vps.sh --deploy-key ~ottimo-admin/ottimo_ops.pub --admin-user ottimo-admin`. Root bị tắt hẳn.
- Không ai tự tạo người dùng `ottimo`: script tạo với uid 2001 (khác uid 1000 của container api).
- Trước lần deploy đầu, áp thủ tục BUG-R2-210: DB trống, không khôi phục dump demo/QA/dev (`rounds/round-02/outputs/OPS/staging-readiness.md` mục 4).

| Thứ | Ai làm | Ghi chú |
|---|---|---|
| IP của VPS (Ubuntu 22.04 hoặc 24.04, 2 vCPU / 4 GB, ổ ≥ 40 GB) | INV | Tắt snapshot/backup tự động của hãng, hoặc để ≤ 7 ngày (SR-BAK-03) |
| Khóa SSH công khai của OPS được thêm vào `root` lúc tạo VPS | INV dán vào bảng điều khiển của hãng | OPS gửi tệp `.pub`. Không gửi mật khẩu root qua chat |
| Tên miền + các bản ghi DNS | INV dán theo `hosting-plan.md` mục 10 | Không cần đưa mật khẩu nhà đăng ký |
| Repo GitHub: bật biến `PUBLISH_IMAGES=true` | INV (chủ repo) hoặc OPS nếu có quyền | Image ở GHCR, gói **Public** (thừa kế repo công khai) – SEC chấp nhận (`s4-SEC.md` E.10): image không chứa bí mật; không bao giờ đưa bí mật vào build arg/`ENV`/`COPY` |
| Repo GitHub: biến `VITE_DESK_PHONE` = số lễ tân công khai (chỉ chữ số và dấu cách, ví dụ dạng `0xx xxxx xxxx`) | INV (chủ repo) hoặc OPS nếu có quyền | Là **biến** (Variables), không phải secret. Số này được gắn vào image web lúc build (nút "Gọi lễ tân" của PWA, trang link hết hạn của web khách). Thiếu hoặc sai dạng thì job `publish-images` dừng ngay (UXR P-15). Đổi số = build image mới |
| Một hộp thư nhóm cho Let's Encrypt (`ACME_EMAIL`) | INV | Nhận cảnh báo hết hạn chứng chỉ |

## 1. Thứ tự các bước (khoảng 30–45 phút)

```
DNS (INV) → 2. chép bundle → 3. bootstrap-vps.sh → 4. .env + init-secrets.sh + khóa age → 5. (không đăng nhập GHCR)
→ 6. deploy.sh <tag> → 7. bật timer sao lưu/kiểm tra → 8. (tùy chọn) deploy tự động từ CI → 9. nạp dữ liệu demo
```

## 2. Chép bundle lên VPS (từ máy OPS, trong `product/`)

```bash
# không đưa tệp cục bộ (.out/.work của demo trên Mac có mật khẩu demo, .env) lên máy chủ
COPYFILE_DISABLE=1 tar --exclude '.out' --exclude '.work' --exclude '.env*' --exclude '.DS_Store' \
  -czf /tmp/ottimo-infra.tgz infra tests/fixtures/seed/ds-e.json
scp /tmp/ottimo-infra.tgz ~/.ssh/ottimo_ops.pub root@<IP>:/root/
ssh root@<IP> 'mkdir -p /root/ottimo-bundle && tar -xzf /root/ottimo-infra.tgz -C /root/ottimo-bundle'
```

## 3. Chuẩn bị máy (root, chạy lại được)

```bash
ssh root@<IP> 'bash /root/ottimo-bundle/infra/server/bootstrap-vps.sh --deploy-key /root/ottimo_ops.pub'
# tùy chọn: --admin-user <user sudo có khóa SSH> (tắt hẳn đăng nhập root), --ssh-allow <dải IP văn phòng>
```

Script làm: cập nhật hệ điều hành + tự vá bảo mật (khởi động lại khi cần lúc 02:30 giờ VN), cài Docker từ kho chính thức (kiểm vân tay khóa), `daemon.json` (xoay log, `live-restore`, `no-new-privileges`), người dùng triển khai `ottimo` (uid 2001, nhóm `docker`), tường lửa chỉ mở 22/80/443, SSH chỉ dùng khóa, thư mục `/opt/ottimo`, chép bundle vào `/opt/ottimo/infra` (chủ root – người triển khai và CI không sửa được), cài timer sao lưu/kiểm tra (chưa bật).

Từ đây đăng nhập bằng `ssh ottimo@<IP>`; lệnh cần root dùng `ssh root@<IP>` (hoặc user sudo).

## 4. Cấu hình, bí mật, khóa sao lưu

```bash
# 4.1 Cấu hình KHÔNG bí mật (ottimo@VPS)
nano /opt/ottimo/.env        # điền DESK_HOST, STAFF_HOST, GUEST_HOST, ACME_EMAIL, API_IMAGE, WEB_IMAGE (mẫu: infra/server/env.example)

# 4.2 Bí mật – sinh ngẫu nhiên tại chỗ, không ai gõ hay nhìn thấy (root@VPS)
/opt/ottimo/infra/server/bin/init-secrets.sh
#   → /opt/ottimo/secrets/* (0400, chủ là uid của container đọc nó; thư mục 0710 root:ottimo)
#   production: chép data_kek_current ra bản NGOẠI TUYẾN do INV giữ ngay lúc này (hosting-plan 8.1)

# 4.3 Khóa sao lưu: trên MÁY OPS (không phải VPS) tạo khóa age, chỉ đưa khóa CÔNG KHAI lên VPS
age-keygen -o ottimo-backup-identity.txt        # cất vào trình quản lý mật khẩu OPS + 1 bản INV giữ
age-keygen -y ottimo-backup-identity.txt        # in khóa công khai age1…
# root@VPS: dán dòng age1… vào /opt/ottimo/backup/recipients.txt (chown root:ottimo, chmod 0640)
```

## 5. Kho image: không đăng nhập (SEC E.10)

Gói `ottimo-api`/`ottimo-web` công khai, nên VPS kéo image **ẩn danh**: không token `read:packages`, không `docker login` trên VPS (bớt một bí mật phải giữ). Kiểm: `ls ~ottimo/.docker/config.json` không tồn tại. Nếu sau này đổi sang gói riêng tư: xem E.10.2 mục 5.

## 6. Triển khai

Tag do CI in ra ở job `publish images (GHCR)` (dạng `sha-<12 ký tự>`).

```bash
/opt/ottimo/infra/server/bin/deploy.sh sha-1a2b3c4d5e6f
```

`deploy.sh` làm theo thứ tự: kéo image → bật PostgreSQL → chạy lại `02-roles.sh` (giới hạn `ottimo_app`, SEC H3) → migration (dịch vụ một lần, `ottimo_migrator`) → so số migration trong DB với journal của image (ARC 4.2-7) → đổi api/worker/web → kiểm: `/health`, `rolconfig`, worker chạy, 3 tên miền có CSP/HSTS/Referrer-Policy đúng, `/var/lib/ottimo/blobs/…`, `/blobs/x`, `/.env` → 404, mở `/g/<token giả>` rồi đọc log Caddy không thấy token. Lỗi sau khi đã đổi container → **tự đặt lại tag trước** (image; DB không quay lui – migration "mở rộng trước, thu hẹp sau").

| Việc | Lệnh (ottimo@VPS) |
|---|---|
| Xem trạng thái | `/opt/ottimo/infra/server/bin/dc ps` |
| Log | `/opt/ottimo/infra/server/bin/dc logs --tail 200 api worker web` |
| Quay lui về bản trước | `/opt/ottimo/infra/server/bin/rollback.sh` (hoặc `rollback.sh <tag>`) |
| Lịch sử triển khai | `cat /opt/ottimo/state/deploy-history.log` |
| Cập nhật bundle (compose/Caddyfile/script đổi) | làm lại bước 2 + `bootstrap-vps.sh` (root), rồi `dc up -d --force-recreate web` nếu Caddyfile đổi |

## 7. Bật sao lưu + kiểm tra định kỳ (root@VPS, sau lần triển khai đầu)

```bash
systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer
systemctl list-timers 'ottimo-*'
```

- Sao lưu 03:30 giờ VN: `pg_dump` + kho tệp mã hóa + `purge_journal`, mã hóa `age` bằng khóa công khai, giữ 7 ngày + bản Chủ nhật tới 35 ngày (SR-BAK-03), ở `/var/backups/ottimo`. Bản sao off-site do **máy phụ kéo về** (R3, SR-BAK-04).
- Kiểm tra 30 phút/lần (`ops-check.sh`): **J16 không chạy trong 26 giờ** (hoặc có lượt `failed`) cho từng cơ sở (SEC C6, SR-RET-03), sao lưu > 26 giờ, đĩa ≥ 80 %, chứng chỉ < 14 ngày, container dừng. Cảnh báo: `journalctl -t ottimo-alert -p err`, `systemctl --failed`, và webhook nếu đặt `ALERT_WEBHOOK_URL` trong `.env` (chỉ gửi khi đổi trạng thái + nhắc mỗi 6 giờ; không có dữ liệu cá nhân).
- Chạy tay: `/opt/ottimo/infra/server/bin/ops-check.sh` hoặc `ops-check.sh j16`. Qua SSH `ottimo-admin` thì `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh`. Từ 30/10, `ops-check.sh` và `bin/dc` tự chạy được từ thư mục bất kỳ (trước đó chạy trong home của `ottimo-admin` thì `docker compose` lỗi `stat .: permission denied`, ra cảnh báo giả "containers FAIL"). `docker compose` lỗi thì `containers`/`http5xx` báo `docker compose failed, container state unknown: <loại lỗi>`, không báo "not running"; không gửi nguyên văn lỗi đi (lỗi đọc `.env` có thể chứa một dòng `.env`). Test: `infra/server/test/ops-check-cwd.test.sh`.
- Từ LP-v2 (R4, SEC SR-PE-16 / C9, ARC L9), thêm 3 mục. Mỗi cảnh báo chỉ gửi một câu cố định kèm số đếm, không gửi nguyên văn log (không đường dẫn, slug, IP, mã căn).
  - `pricelimit`: số lần route giá trên landing (`GET /v1/public/properties/<slug>/price-estimate`) trả 429 + 503 trong 60 phút ≥ `PRICE_REFUSED_MAX` (mặc định 200). Nghĩa là có người quét hoặc dội, khách thật có thể không thấy giá; form vẫn gửi được. Đếm từ log Caddy của landing (query đã che). Chỉ chạy khi stack có landing.
  - `pricegap`: api ghi `public_price_missing` trong 24 giờ, tức có căn thiếu giá niêm yết một đêm nên bị bỏ khỏi giá ước tính trên web. Cảnh báo chỉ nêu số căn. Việc của OWN: rà giá niêm yết trên Desk, nhất là sau khi nhập lại bảng giá 01/11.
  - `priceswitch`: công tắc `public_show_prices` bị đổi kể từ lượt kiểm trước (audit `config.changed`). Theo dõi bằng **id audit cuối đã báo** (`state/ops-check/priceswitch.last_id`), không theo cửa sổ thời gian, nên timer trễ hay máy khởi động lại cũng không sót (SEC FB-R4-SEC-OPS-LPV2-04). **Mỗi lượt có thay đổi mới gửi một webhook riêng** (không áp dụng khử trùng 6 giờ), nêu số lần đổi và giá trị mới nhất (`true`/`false`/`other`) để OPS/INV xác nhận việc đổi là chủ ý. Lần chạy đầu chỉ lấy mốc, không báo. Không xóa tay tệp mốc: mất tệp thì lượt sau coi như lần đầu (lấy mốc mới, không báo các thay đổi trước đó).
  - `http5xx` không đếm 503 của route giá: bulkhead của route này trả 503 khi bận, đó là thiết kế. 502/500 của route giá vẫn được đếm.
  - Test: `infra/server/test/ops-check-price.test.sh`.

## 8. Deploy tự động từ CI (tùy chọn, sau khi bước 6 chạy tay thành công)

1. Máy OPS: `ssh-keygen -t ed25519 -f ottimo-ci-deploy -N ''` → chép `ottimo-ci-deploy.pub` lên VPS, chạy lại `bootstrap-vps.sh --ci-key /root/ottimo-ci-deploy.pub` (khóa bị ép chỉ chạy `deploy-from-ci.sh`: chỉ nhận `deploy sha-<hex>`, không mở shell, không chép tệp).
2. GitHub → Settings → Environments → `staging` (đã có Required reviewers = INV, chỉ `main` – **trước** khi tạo secret): ba **secret của environment** `STAGING_SSH_KEY` (nội dung khóa riêng `ottimo-ci-deploy`), `STAGING_SSH_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <IP>` – kiểm vân tay), `STAGING_SSH_HOST` (`<IP>`; secret, không phải biến – log Actions công khai, SEC E.8). Biến repo `STAGING_DEPLOY=true` chỉ sau khi đủ D0–D5 (SEC E.8, E.9; D3 theo E.10: gói Public được chấp nhận, VPS không `docker login`); D6 = SEC đọc log Actions ngay sau lượt CI đầu, không đạt thì tắt lại. Xóa khóa riêng trên máy sau khi lưu. Khóa CI phải khác khóa của người (`bootstrap-vps.sh` từ chối nếu trùng – D4).
3. Mỗi lần push vào `main` có CI xanh: `publish-images` → INV duyệt → `deploy-staging` gọi `deploy.sh` trên VPS. CI chỉ nhận **một dòng** `deploy <tag>: ok` hoặc `deploy <tag>: failed (step=<bước>, ref=<mã>)`; chi tiết ở `/opt/ottimo/state/deploy-logs/ci-<mã>.log` (0600, giữ 30 tệp gần nhất): `ls -t /opt/ottimo/state/deploy-logs | head`, `journalctl -t ottimo-deploy`.

## 9. Dữ liệu demo / QA trên staging (dữ liệu giả)

```bash
/opt/ottimo/infra/server/bin/dc --profile seed run --rm seed     # DS-E; mật khẩu tài khoản qa.* = /opt/ottimo/secrets/qa_seed_password
```
Mật khẩu QA chỉ đọc được bằng root (`sudo cat …`), chuyển cho QA qua kênh an toàn của đội, không dán vào chat/issue.
Endpoint kiểm thử (`/__test__/*`, đồng hồ giả): chỉ khi QA cần – `.env` đặt `API_TAG_SUFFIX=-test`, `INCLUDE_TEST_SUPPORT=1`, `TEST_SUPPORT_TOKEN` (≥ 32 ký tự), `TEST_SUPPORT_ALLOW_IPS=<IP của QA>`, rồi `deploy.sh <tag>`. Production không bao giờ bật.

## 10. Diễn tập khôi phục (mỗi round – SR-BAK-05)

Trên máy OPS hoặc máy phụ (không phải VPS đang chạy), có Docker + age, bản sao các tệp `*.age`:
```bash
infra/server/bin/restore-drill.sh --identity ottimo-backup-identity.txt --from ./backups \
  --api-image ghcr.io/<owner>/ottimo-api:<tag đang chạy>
```
Script dựng môi trường dùng một lần (mạng nội bộ, không mở cổng), khôi phục DB + tệp, chạy api trên DB đó, in **biên bản** (thời gian = RTO, số bảng, số tệp) rồi xóa sạch. Dán biên bản vào report OPS của round. Giải mã thử 1 ảnh giấy tờ bằng KEK: R3 (cần lệnh kiểm trong image – BE).

## 11. Sự cố thường gặp

| Triệu chứng | Xử lý |
|---|---|
| `deploy.sh`: `api` unhealthy, log `ConfigError: …` | Đọc tên biến trong thông báo (giá trị không bao giờ in ra); thường là `.env` thiếu tên miền hoặc `init-secrets.sh` chưa chạy |
| `deploy.sh`: `https://<host>/ unreachable` | DNS chưa trỏ đúng IP / cổng 80 bị chặn nên Let's Encrypt chưa cấp chứng chỉ: `dc logs web \| grep -i acme` |
| `__drizzle_migrations=N but the image journal has M` | Migration bị bỏ qua (journal `when` sai thứ tự) – không chạy tiếp, báo BE/ARC |
| `ops-check` báo `j16` | `dc logs worker \| grep retention`; worker dừng → `dc up -d worker`; job lỗi → báo BE (ảnh giấy tờ đang quá hạn xóa) |
| Đĩa đầy | `docker system df`; `docker image prune -a --filter until=168h`; xem `/var/backups/ottimo` |
| Mất khóa age | Bản sao lưu cũ không đọc được nữa: tạo cặp khóa mới, thay `recipients.txt`, chạy `backup.sh` ngay |

## 12. Production trên cùng VPS + edge + landing (R3 v1.0)

Thiết kế, lý do, DNS, RAM, kiểm thử: `rounds/round-03/outputs/OPS/v1-production.md`. Việc của INV: `rounds/round-03/outputs/OPS/inv-production-steps.md`.

| Việc | Lệnh |
|---|---|
| Chuẩn bị stack production (root) | `bash …/bootstrap-vps.sh --env production --ci-key <prod-ci.pub> --backup-pull-key <pull.pub> --admin-user ottimo-admin` → `/opt/ottimo-prod` (tệp mốc `.ottimo-home`), `.env` từ `env.production.example` |
| Cập nhật bundle staging (cùng bundle) | `bash …/bootstrap-vps.sh --env staging --admin-user ottimo-admin` |
| Bí mật (root, mỗi stack) | `sudo /opt/ottimo-prod/infra/server/bin/init-secrets.sh` (staging: chạy lại để thêm VAPID / form / landing_access) |
| Chuyển staging ra sau edge + bật edge | staging `.env`: `EDGE_MODE=edge`, `EDGE_NAME=staging`, `PROXY_PROTOCOL_ALLOW=172.31.1.2/32`, `LANDING_*`; rồi `/opt/ottimo-edge/infra/server/bin/edge.sh up` (staging gián đoạn vài giây) |
| Đổi tên miền của một stack | sửa `.env` của stack → `edge.sh up` (dựng lại edge ≈ 1–2 s cho mọi site) |
| Deploy app production | qua CI `release.yml` (tag `v*`, INV duyệt); tay: `/opt/ottimo-prod/infra/server/bin/deploy.sh sha-… --api-digest sha256:… --web-digest sha256:…` |
| Landing | CI (`landing sha-…`); tay: `…/bin/deploy-landing.sh sha-… [--digest sha256:…]`; chỉ kiểm, không đổi gì: thêm `--check-only` (mục 12.3); quay lui `deploy-landing.sh --rollback`. Mật khẩu xem trước (staging): `sudo cat /opt/ottimo/secrets/landing_preview_password` |
| Timer production | `systemctl enable --now ottimo-backup@ottimo-prod.timer ottimo-ops-check@ottimo-prod.timer` (sau deploy app đầu) |
| Bản sao lưu ngoài máy | trên Mac: `pull-backups.sh --host <IP> --key ~/.ssh/ottimo_backup_pull --to ~/.ottimo/backups/ottimo-prod`. Cần rsync 3: rsync có sẵn của macOS (openrsync) bị `rrsync` máy chủ từ chối, script dừng và báo. Cách 1: `brew install rsync`. Cách 2 (đã chạy 26/10): chạy script trong container `alpine` có `rsync openssh-client bash coreutils`, gắn khóa (chỉ đọc), `known_hosts`, thư mục đích – lệnh mẫu `rounds/round-03/outputs/OPS/v1-production.md` 19.2 |
| Thêm một `owner` dùng thử trên **staging** (DB đã có cơ sở – bootstrap từ chối) | từ Mac: `[ -t 1 ] && ssh … 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T -e ADD_OWNER_USERNAME=… -e ADD_OWNER_NAME="…" -e ADD_OWNER_OPERATOR="…" [-e ADD_OWNER_DRY_RUN=1] api node --input-type=module -' < product/infra/server/staging-add-owner.mjs` – chỉ staging, mật khẩu tạm in một lần trên Terminal người chạy (`rounds/round-03/outputs/OPS/b1-runbook.md` mục 2) |
| Đếm khói US-155 (READ ONLY) | `…/bin/us155-smoke-counts.sh --ref REQ-… --since <giờ+07:00>` – mục 12.3 bước 8 |
| Ghi phiên bản thông báo website (US-155; LP-v2: mọi ngôn ngữ của image) | `…/bin/publish-privacy-notice.sh --landing-tag <sha-… đang chạy> --version <YYYY-MM-DD> --property DLT --operator <id> [--apply]` – mục 12.3 bước 6, thứ tự LP-v2 cuối mục 12.3 |
| Diễn tập khôi phục | `restore-drill.sh --identity <khóa prod> --from ~/.ottimo/backups/ottimo-prod --api-image ghcr.io/<owner>/ottimo-api:<tag>` – so khớp tệp `counts` |

Mọi script trong `/opt/ottimo-prod/infra/server/bin` tự hiểu là production (tệp mốc), không cần `OTTIMO_HOME`. Khôi phục 2FA bằng lệnh quản trị (SEC 06.33): có thủ tục, lưu ngoài repo. SEC duyệt ngày: (chưa – chờ diễn tập staging). Diễn tập staging ngày: (chưa).

### 12.1 Khởi tạo production lần đầu (R3-OPS-02 – chạy **một lần**, sau deploy app đầu tiên)

Production dựng từ DB trống: chưa có cơ sở, căn, tham số, tài khoản. Lệnh quản trị `production-bootstrap` (không có endpoint) tạo trong **một giao dịch**: tổ chức + cơ sở OTTIMO Đà Lạt, 3 nhóm căn, **10 căn** (101–103, 201–203, 301, 302, 401, 402 – định mức/sức chứa BR-110, tên phòng BR-012), kênh bán BR-901, tham số mặc định BR mục 13, và tài khoản `owner` đầu tiên. **Không** tạo khách, đơn, giá phòng, giá OTA nền, tài khoản nhận VietQR, mật khẩu Wi-Fi, thiết bị, hàng minibar – INV tự nhập trên app.

Điều kiện: đã chạy `migrate` (deploy.sh làm), `.env` production có `MFA_ENFORCED=true` (lệnh từ chối nếu thiếu), **INV ngồi cạnh người chạy lệnh trong suốt buổi** (FB-R3-SEC-BOOT-02).

```sh
# Từ Mac INV: ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP> (tài khoản quản trị cá nhân – cùng tài khoản thủ tục 06.33;
# không dùng khóa CI). Terminal tương tác – KHÔNG `| tee`, KHÔNG `script`, KHÔNG tmux/screen, không CI.
# Lệnh chạy bằng người dùng triển khai qua `sudo -u ottimo` (sudo dùng pty, KHÔNG bật ghi I/O – kiểm 26/10: sudoers chỉ
# có `use_pty`, không `log_output`). Dấu cách ở đầu dòng + HISTCONTROL=ignorespace để lệnh không vào lịch sử shell.
export HISTCONTROL=ignorespace
cd /tmp
 sudo -u ottimo /opt/ottimo-prod/infra/server/bin/production-bootstrap.sh \
   --owner-username <tên đăng nhập của INV> --owner-name "<tên hiển thị>" --operator <người chạy>
```

- Mật khẩu tạm của `owner` (24 ký tự ngẫu nhiên) in **một lần** trên màn hình, không vào log, tệp hay audit.
  - CLI từ chối khi không có terminal.
  - Wrapper `infra/server/bin/production-bootstrap.sh` từ chối thêm khi stdin/stdout phía máy chủ không phải terminal (chặn được pipe, chuyển hướng `>`, `| tee`) và khi đang ở trong tmux/screen (FB-R3-SEC-BOOT-01). **Không chặn được `script`**: lệnh này tự cấp một terminal giả (pty) nên kiểm terminal vẫn qua – chỉ chặn bằng thủ tục (dòng "KHÔNG `script`" ở trên; người chạy không gõ `script`, người cùng ngồi nhìn màn hình xác nhận) (SEC S-2, `SEC-sprint1.md` 3.1).
  - Bàn giao: đưa trực tiếp cho INV, không gửi qua chat hay email.
  - Sau bàn giao: chạy `clear`, chạy `history | tail -3` để kiểm lệnh không vào lịch sử (có thì `history -d <số>`), rồi **đóng phiên SSH**.
- **Cùng buổi, người chạy lệnh ngồi cạnh** (FB-R3-SEC-BOOT-02), INV làm đủ 4 việc:
  1. đăng nhập Desk bằng mật khẩu tạm;
  2. đổi mật khẩu;
  3. đăng ký 2FA;
  4. cất 10 mã khôi phục tách khỏi điện thoại (giấy để két + trình quản lý mật khẩu).

  Trước khi rời đi, người chạy lệnh kiểm có dòng `mfa.enrolled` (một phiên SSH mới):
  ```sh
  cd /tmp && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T postgres sh -c 'psql -X -tA -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT action, occurred_at FROM audit_event WHERE category = '"'"'security'"'"' AND action = '"'"'mfa.enrolled'"'"' ORDER BY occurred_at DESC LIMIT 1"'
  ```
  Không xong được trong buổi thì **làm lại từ DB trống**. Lúc đó production chưa có dữ liệu nào khác:
  ```sh
  cd /tmp
  # Chỉ 4 service của app – KHÔNG `dc down` (có thể gỡ cả container landing đang phục vụ ottimo.vn).
  sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc rm --stop --force api worker web postgres
  sudo docker volume rm ottimo-prod_pgdata ottimo-prod_blobdata
  ```
  Sau đó chạy `deploy.sh` cùng tag rồi chạy lại lệnh khởi tạo. Mật khẩu tạm cũ hết giá trị theo DB cũ. Nên có thêm ở R4: mật khẩu tạm tự hết hạn sau 24 giờ.
- Chạy lần hai (DB đã có cơ sở) → `refused: …`, mã thoát 2, không ghi gì. Lỗi giữa chừng → giao dịch hủy toàn bộ, chạy lại được.
- Sau đó INV nhập trên app: giá niêm yết từng căn, `ota_base_rate`, tài khoản nhận VietQR (màn R3-Q51, chỉ OWN), mật khẩu Wi-Fi, hạng phòng công khai của các căn Studio, hàng minibar; xem lại các tham số nhãn GĐ/PL trên màn Tham số.
- Danh sách giá trị mặc định: `services/api/src/admin/production-defaults.ts` (DOM đối chiếu BR v0.4.1 mục 13 trước lần chạy thật).

### 12.2 API chạy đúng 1 bản (US155-04, SEC FB-R3-SEC-US155-04)

Giới hạn của form website nằm **trong RAM của tiến trình api**: bộ đếm bước 0 theo IP / khóa, và trần 4 request công khai đang chạy. Chạy 2 bản api thì mọi giới hạn nhân đôi.

- Mỗi stack chỉ một container `api`.
  - Không dùng `dc up --scale api=N`.
  - Không thêm dịch vụ api thứ hai.
  - Không chạy api ở nơi khác dùng chung DB.
- `ops-check` (mục `containers`) báo lỗi khi số bản `api` đang chạy khác 1.
- Muốn mở rộng thành nhiều bản, phải làm trước rồi ARC + SEC duyệt:
  1. chuyển bước 0 sang bộ đếm dùng chung (Postgres hoặc Redis), hoặc đặt giới hạn tại Caddy;
  2. đặt trần request đang chạy theo tổng số bản.
- Lúc deploy, `api` mới thay `api` cũ, nên trong vài giây có thể có 2 container. Đây không phải hai bản cùng phục vụ: Caddy chỉ gọi tên `api`.

### 12.3 Bật form website US-155 trên production (khi SEC xác nhận đủ 7 điều kiện của `s1-SEC-on-us155.md`)

Kịch bản chạy thật theo phút, khung giờ, đường lùi: `rounds/round-03/outputs/OPS/us155-enable-plan.md`. Tóm tắt:

1. Bundle `infra/` của stack production phải có `bin/publish-privacy-notice.sh` + `publish-privacy-notice.sql` (làm mới bundle như `v1-production.md` 15: sao lưu bundle cũ, `rsync` chỉ vào `/opt/ottimo-prod/infra`).
2. `/opt/ottimo-prod/.env`:
   - `LANDING_IP=172.30.1.11` (đã có từ 25/10; `deploy.sh` / `deploy-landing.sh` từ chối nếu địa chỉ nằm ngoài `EDGE_SUBNET`);
   - `LANDING_BASE_URL=https://ottimo.vn`;
   - `LANDING_PUBLIC_API=on`.
3. Bí mật `public_form_signing_key`: riêng cho production, đã sinh lúc `init-secrets.sh` (44 ký tự, quyền 0400, uid 1000) – chỉ kiểm quyền, không in nội dung.
4. Deploy lại app production **cùng tag đang chạy** (`deploy.sh "$(cat state/current_tag)" --api-digest … --web-digest …`, digest lấy từ `state/digests/<tag>`) để api nhận `LANDING_BASE_URL` và `TRUST_PROXY` có thêm `LANDING_IP`. api + worker dựng lại: Desk gián đoạn khoảng 15–30 giây.
5. Biến repo `LANDING_BOOKING_FORM=true`, `LANDING_PROPERTY_SLUG=dlt`. Lượt CI kế tiếp build image landing có form → tag `landing-v…` → INV duyệt → `deploy-landing.sh`.
6. **Ghi phiên bản thông báo** (OPS, không phải OWN – Desk không có màn này):
   ```sh
   cd /tmp
   sudo -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh \
     --landing-tag "$(cat /opt/ottimo-prod/state/landing_tag)" --version 2026-10-24 --property DLT --operator <mã nhân viên>   # chạy thử
   sudo -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh … --apply                  # ghi thật
   ```
   Công cụ làm các việc sau:
   - Lấy danh sách ngôn ngữ từ **chính image** đang chạy (đúng digest phát hành): mỗi trang `/privacy/` (en) và `/<xx>/privacy/` là một ngôn ngữ. Danh sách hreflang của `/privacy/` phải khớp đúng các trang đó.
   - Mọi ngôn ngữ trong `LANDING_LOCALES` của `.env` phải có trang. Thiếu một ngôn ngữ là từ chối cả lượt, không ghi gì.
   - Lấy sha256 từng trang trong container. Các băm phải khác nhau từng đôi.
   - Đọc version của từng trang từ **một** thẻ `<meta name="ottimo-notice-version">`. Bản dựng trước LP-v2 không có thẻ này: đọc chữ "Version …"/"Phiên bản …" (chỉ en/vi). Đối chiếu thêm `data-consent-version` của form trên trang chủ từng ngôn ngữ. Tất cả phải bằng `--version`.
   - Tải từng trang thật qua edge (phải 200, cùng sha256).
   - Ghi mọi ngôn ngữ trong **một giao dịch** bằng vai `ottimo_migrator` → `ottimo_owner` (không superuser), audit `security` `privacy_notice.published` (danh sách ngôn ngữ + băm).
   - DB chưa có migration LP-v2 (tệp `0091_lp_v2_price_estimate_locales.sql`; số 0090 là của PN-01 – khi gộp lên main số có thể đổi, đối chiếu theo tên tệp) thì từ chối, báo deploy api trước.
   - Mặc định chạy thử (ROLLBACK). Chạy lại an toàn: cùng băm → "already present"; khác băm → từ chối.
   - Kết quả mỗi lần: một dòng trong `state/privacy-notice.log`, có `sha_<xx>=` cho từng ngôn ngữ (dòng cũ chỉ có `sha_en`/`sha_vi` vẫn đọc được).
   - **Đường duy nhất** được ghi bảng `privacy_notice_version` – không SQL tay (SEC FB-R3-SEC-OPS-US155-01).
   - Bản dựng LP-v2 (có thẻ meta) mà `/privacy/` không có hreflang → từ chối (thiếu manifest ngôn ngữ, SEC LPV2-S3). Version chỉ nhận hậu tố `.1`–`.99` không có số 0 đầu (`.01` bị từ chối, SEC LPV2-S1).
   - Test: `infra/server/test/publish-privacy-notice.test.sh` (34 ca, gồm 12 ca 5 ngôn ngữ và lệnh đếm khói).
   - **Không nhầm** với tham số Desk `privacy_notice_version` (H05, `privacy-2026-10-v1`/`v2`): đó là thông báo khách lưu trú, OWN đặt; công cụ này không đụng tới.
7. Chỉ sau khi bước 6 in `OK: version … published` (băm khớp): OWN bật `public_booking_requests_enabled` trên Desk (H05). Thiếu dòng phiên bản thì server trả 422 `PUBLIC_FORM_NOT_READY`.

8. Khói sau khi bật: yêu cầu thử "TEST OTTIMO" / kênh Email / `info@ottimo.vn` (không SĐT), xóa theo WR8, rồi đếm READ ONLY: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/us155-smoke-counts.sh --ref REQ-XXXXXXXX --since <giờ bắt đầu, có múi giờ>` → `RESULT: OK – 14/14`. Chỉ in số đếm (`us155-smoke-counts.sql`, SEC FB-R3-SEC-OPS-US155-02).

Quay lui: (a) OWN tắt công tắc trên Desk (ngay); (b) đặt `LANDING_PUBLIC_API=off` rồi `deploy-landing.sh <tag hiện tại> --no-pull` – mọi `/v1/*` trên `ottimo.vn` trả 404, form tự hướng khách sang Zalo / gọi điện; (c) gỡ form – **đúng thứ tự** (ARC FB-R3-ARC-OPS-US155-03): đặt `LANDING_PUBLIC_API=off` trong `.env` **trước**, rồi `deploy-landing.sh --rollback` về bản không form, rồi kiểm `/v1/public/properties/dlt/form-token` trên `ottimo.vn` trả 404 HTML của Caddy (không phải JSON). Làm ngược thì bản cũ được dựng lại với proxy còn mở. Dòng `privacy_notice_version` đã ghi **giữ nguyên** (yêu cầu đã nhận trỏ FK tới nó) – không xóa.

**Mỗi lượt landing sau này – `deploy-landing.sh` tự kiểm byte trang privacy** (ARC FB-R3-ARC-OPS-US155-01, erd 4.14: một (`version`, `locale`) ứng với đúng một chuỗi byte):
- Bước `privacy`, sau `pull` + kiểm digest, **trước** khi đổi container: đọc **mọi** trang privacy trong image **mới** (`/srv/landing/privacy/index.html` = en, `/srv/landing/<xx>/privacy/index.html` = vi, ko, zh, ru – `docker run --network none --pull never`), lấy sha256 và version. Version đọc từ thẻ `<meta name="ottimo-notice-version">`; image cũ không có thẻ (ví dụ `--rollback` về bản 2 ngôn ngữ) thì đọc chữ "Version …" / "Phiên bản …".
- So với mọi dòng **`apply … rc=0`** trong `state/privacy-notice.log` (dòng chạy thử và lượt ghi lỗi không tính), từng ngôn ngữ theo khóa `sha_<xx>`:
  - cùng version, cùng băm → cho qua;
  - **cùng version, khác băm → từ chối** (`FAIL: privacy page bytes changed for a published notice version …`, CI báo `step=privacy`), không đổi container, không ghi `landing_tag`. Áp dụng cả `--rollback`. Cách sửa: tăng version thông báo (mọi trang + `data-consent-version` của form), phát hành lại, rồi chạy bước 6 cho version mới;
  - **version cũ hơn version đã đăng** của cùng ngôn ngữ → từ chối (SEC FB-R4-SEC-FE-02). Với `--rollback` chỉ là WARNING (bản cũ còn được nhận 7 ngày – mục LP-v2 dưới đây);
  - ngôn ngữ có trong `LANDING_LOCALES` mà image không có trang → từ chối (api vẫn coi ngôn ngữ đó đang bán). Với `--rollback` chỉ là WARNING, nhắc sửa `LANDING_LOCALES`;
  - version chưa có trong log → cho qua, in nhắc chạy bước 6 sau deploy;
  - trang không có đúng một version (hai thẻ meta, ko/zh/ru thiếu thẻ, hoặc hậu tố có số 0 đầu như `.01`) → **từ chối** khi `LANDING_PUBLIC_API=on` (không so được byte với bản đã đăng – SEC FB-R4-SEC-OPS-LPV2-02). Với `--rollback` chỉ là WARNING;
  - `LANDING_LOCALES` để trống → coi là `en,vi`, giống api và `publish-privacy-notice.sh`;
  - image không có trang privacy nào → cho qua, ghi chú.
- Ngoại lệ: khi `LANDING_PUBLIC_API` **khác `on`** (proxy form đóng, khách không gửi được đồng ý – ví dụ quay lui (c) ở trên), mọi lỗi trên chỉ là **WARNING**. Phải sửa trước khi mở lại proxy.
- Trước khi INV duyệt một lượt landing: OPS chạy `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh <sha-…> --digest sha256:… --check-only` (kéo image, kiểm cấu hình + digest + privacy, **không đổi gì**). Thay cho việc băm tay trước đây.
- **Sau mỗi lượt deploy landing có version mới** (tới khi có `--candidate-digest`, FB-04, `v1.0.1`): chạy bước 6 (`publish-privacy-notice.sh` chạy thử rồi `--apply`) **ngay sau deploy landing, trong cùng phiên SSH, ngoài giờ cao điểm** (tránh khung nhận/trả phòng), để khoảng trống giữa trang mới và dòng phiên bản ngắn nhất.
- Nguồn so sánh là `state/privacy-notice.log` trên chính stack (mọi lần ghi bảng đều qua `publish-privacy-notice.sh`, mỗi lần một dòng). Mất tệp này thì kiểm coi như "chưa có version nào" – không xóa, không sửa tay tệp này.
- Test: `infra/server/test/deploy-landing-privacy.test.sh` (23 ca, gồm 14 ca 5 ngôn ngữ: image giả `FROM alpine`, không cần stack; chạy trong CI job `infra-scripts`).

#### LP-v2 – phát hành landing 5 ngôn ngữ + giá ước tính (R4, ARC lp-v2-design 3.6 (5)(6), ARC FB-R4-ARC-OPS-LPV2-01, SEC C3–C6)

Điều kiện trước: SEC duyệt phát hành LP-v2 (C1–C8 của `rounds/round-04/reviews/SEC-on-LP-v2-code.md`). Bundle `infra/` của stack có bản `Caddyfile.landing`, `publish-privacy-notice.sh/.sql`, `deploy-landing.sh`, `ops-check.sh` của gói này (làm mới bundle như bước 1). Làm ngoài giờ đông khách, trong **một phiên SSH**. Chạy trên staging trước, QA ký, rồi mới làm production.

**Thứ tự (không đảo):**
0. **v1.0.1 trước.** Landing v1.0.1 (version thông báo `2026-10-31`, en + vi) đã chạy và đã đăng bằng bước 6 (`OK: version 2026-10-31 published`). Version của LP-v2 phải **lớn hơn** `2026-10-31` (SEC đặt nhãn thật sau người bản xứ đọc, không dùng nhãn tạm `2026-11-01` của FE). Công cụ từ chối version nhỏ hơn version đang hiệu lực; `deploy-landing.sh` cũng từ chối image có version cũ hơn version đã đăng.
1. **(a) api có migration LP-v2** (deploy app bình thường, `deploy.sh`). `LANDING_LOCALES` **vẫn** `en,vi`. Compose truyền biến này vào api (mặc định `en,vi`).
2. **(b) Kiểm rồi deploy landing LP-v2**: `deploy-landing.sh <sha-…> --digest sha256:… --check-only`, rồi bỏ `--check-only`. Bước `privacy` phải in 5 dòng `… (not published yet)` cho en, vi, ko, zh, ru. Caddy mới đã mở `/ko/`, `/zh/`, `/ru/`, trả trang 404 theo ngôn ngữ, và mở route `GET …/price-estimate` (chỉ khi `LANDING_PUBLIC_API=on`; query chỉ nhận ký tự ASCII in được, tối đa 256 byte – SEC FB-R4-SEC-OPS-LPV2-03).
3. **(c) Ngay sau đó** ghi version thông báo cho cả 5 ngôn ngữ (bước 6): chạy thử, rồi `--apply`. Phải thấy `OK: version <V2> published (en vi ko zh ru)`, các dòng `2026-10-31` của en/vi bị `superseded`.
   - Giữa (b) và (c) (vài phút), trang mới gửi `V2` mà DB chưa có. Server trả `NOTICE_VERSION_INVALID`, trang hiện khối Zalo/gọi. Không có dữ liệu sai.
4. **(d)** Sửa `.env` của stack: `LANDING_LOCALES=en,vi,ko,zh,ru`. Deploy lại app **cùng tag đang chạy** để api nhận biến (Desk gián đoạn khoảng 15–30 giây). Api không khởi động nếu biến có mã lạ.
5. **(e)** QA kiểm form 5 ngôn ngữ trên trang thật **qua Caddy thật** (gồm SEC 9.5 ca 6: IP khách tới được api qua `TRUST_PROXY`; nếu sai, mọi khách dùng chung một bộ đếm).
6. **(f)** OWN bật `public_show_prices` trên Desk (H05) khi QA so giá web = giá Desk đạt. Trước đó route giá trả 404 và trang không hiện khối giá. `ops-check` (`priceswitch`) báo mỗi lần công tắc đổi.
7. **Đổi mốc thuê tháng (BR-108).** Khi OWN đổi `long_stay_required_from_nights` trên Desk (bảng giá 01/11: 30), landing phải phát hành lại cùng ngày với `shortMaxNights` = mốc − 1 (ARC FB-R4-ARC-FE-LPV2-01: mốc 30 → 29). Lệch nhau thì form hiện hai thông điệp trái nhau. Đây là một lượt landing bình thường (bước b; không đổi version thông báo nếu trang privacy không đổi byte).

**Quay lui sau khi đã đăng `V2`** (ARC 3.6 (6)):
- Chỉ tắt giá: OWN đặt `public_show_prices = false` (lâu nhất khoảng 2 phút là trang hết hiện giá).
- Quay landing về bản 2 ngôn ngữ:
  1. Đặt `LANDING_LOCALES=en,vi` và deploy lại app cùng tag **trước**.
  2. Rồi `deploy-landing.sh --rollback`. Bước `privacy` in WARNING "older privacy notice version" (bản cũ in `2026-10-31`) – được phép với `--rollback`.
  3. Trong **7 ngày** sau khi `2026-10-31` bị thay, form của bản cũ vẫn được nhận. **Quá 7 ngày**: SQL không cho đăng lại version cũ, nên phải dựng lại bản 2 ngôn ngữ với version mới (> `V2`) rồi chạy bước 6 cho version đó.
- Dòng `privacy_notice_version` đã ghi **giữ nguyên**, không xóa.
