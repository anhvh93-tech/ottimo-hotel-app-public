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
| Quay lui về bản trước | `/opt/ottimo/infra/server/bin/rollback.sh` (hoặc `rollback.sh <tag>`; `<tag>` là tên image `sha-<12 hex>`, **không** phải tag git `v…` – production từ chối vì không có `state/digests/v…`; v1.0.0 = `sha-8b3aec89486f`). Sau một lần quay lui, `previous_tag` là **bản vừa bị gỡ**: không chạy `rollback.sh` không tham số nữa (sẽ đưa bản đó lên lại không qua Release). Diễn tập: `infra/server/test/rollback.test.sh` |
| Lịch sử triển khai | `cat /opt/ottimo/state/deploy-history.log` |
| Cập nhật bundle (compose/Caddyfile/script đổi) | làm lại bước 2 + `bootstrap-vps.sh` (root), rồi `dc up -d --force-recreate web` nếu Caddyfile đổi |

## 7. Bật sao lưu + kiểm tra định kỳ (root@VPS, sau lần triển khai đầu)

```bash
systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer
systemctl list-timers 'ottimo-*'
```

- Sao lưu 03:30 giờ VN: `pg_dump` + kho tệp mã hóa + `purge_journal`, mã hóa `age` bằng khóa công khai, giữ 7 ngày + bản Chủ nhật tới 35 ngày (SR-BAK-03), ở `/var/backups/ottimo`. Bản sao off-site do **máy phụ kéo về** (R3, SR-BAK-04).
- Kiểm tra 30 phút/lần (`ops-check.sh`): **J16 không chạy trong 26 giờ** (hoặc có lượt `failed`) cho từng cơ sở (SEC C6, SR-RET-03), sao lưu > 26 giờ, đĩa ≥ 80 %, chứng chỉ < 14 ngày, container dừng, số 5xx, thư nhân viên chết `NO_RECIPIENT` (`email_dead`), số OWN/MGR chưa có email (`email_missing`, từ v1.0.3), số lần đổi email trong 24 giờ và tuổi hàng đợi thư bảo mật (`email_changes`, từ v1.0.3, luôn cảnh báo), số địa chỉ không khớp luật ASCII của API (`email_ascii`, chỉ báo số). Cảnh báo: `journalctl -t ottimo-alert -p err`, `systemctl --failed`, và webhook nếu đặt `ALERT_WEBHOOK_URL` trong `.env` (chỉ gửi khi đổi trạng thái + nhắc mỗi 6 giờ; không có dữ liệu cá nhân).
- `email_dead` (BUG-R3-032, SEC `SEC-on-B2-readiness.md` 1.5): đếm thư nhân viên (`staff.email` – thư "Security notice") chết vì `NO_RECIPIENT` trong 24 giờ, chỉ đếm, không đọc nội dung. Hiện chỉ báo số, không cảnh báo. Chỉ bật khi đủ **4 điều kiện** ở mục 13.8 (v1.0.3 chạy production; `email_missing` = 0; INV báo đã nhận thư; `email_dead` 24 giờ = 0). Cách bật: thêm `EMAIL_NO_RECIPIENT_ALERT=1` vào `.env` của stack (lệnh ở 13.8), khi đó mỗi thư như vậy là `FAIL`, và `email_missing` > 0 cũng là `FAIL`. Bật sớm thì `email_dead` FAIL kéo dài và nhắc lại mỗi 6 giờ (cảnh báo giả).
- Chạy tay: `/opt/ottimo/infra/server/bin/ops-check.sh` hoặc `ops-check.sh j16`. Qua SSH `ottimo-admin` thì `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh`. Từ 30/10, `ops-check.sh` và `bin/dc` tự chạy được từ thư mục bất kỳ (trước đó chạy trong home của `ottimo-admin` thì `docker compose` lỗi `stat .: permission denied`, ra cảnh báo giả "containers FAIL"). `docker compose` lỗi thì `containers`/`http5xx` báo `docker compose failed, container state unknown: <loại lỗi>`, không báo "not running"; không gửi nguyên văn lỗi đi (lỗi đọc `.env` có thể chứa một dòng `.env`). Test: `infra/server/test/ops-check-cwd.test.sh`.

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
| Ghi phiên bản thông báo website (US-155) | `…/bin/publish-privacy-notice.sh --landing-tag <sha-… đang chạy> --version <YYYY-MM-DD> --property DLT --operator <id> [--apply]` – mục 12.3 bước 6 |
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
   Công cụ tự lấy sha256 hai trang trong container landing đang chạy (đúng digest phát hành), đối chiếu chữ "Version …"/"Phiên bản …" và `data-consent-version` của form với `--version`, tải `https://ottimo.vn/privacy/` và `/vi/privacy/` (phải 200, cùng sha256), rồi ghi vi + en trong **một giao dịch** bằng vai `ottimo_migrator` → `ottimo_owner` (không superuser), audit `security` `privacy_notice.published`. Mặc định chạy thử (ROLLBACK). Chạy lại an toàn: cùng băm → "already present"; khác băm → từ chối. Kết quả mỗi lần: `state/privacy-notice.log`. **Đường duy nhất** được ghi bảng `privacy_notice_version` – không SQL tay (SEC FB-R3-SEC-OPS-US155-01). Test: `infra/server/test/publish-privacy-notice.test.sh` (22 ca, gồm lệnh đếm khói).
   - **Không nhầm** với tham số Desk `privacy_notice_version` (H05, `privacy-2026-10-v1`/`v2`): đó là thông báo khách lưu trú, OWN đặt; công cụ này không đụng tới.
7. Chỉ sau khi bước 6 in `OK: version … published` (băm khớp): OWN bật `public_booking_requests_enabled` trên Desk (H05). Thiếu dòng phiên bản thì server trả 422 `PUBLIC_FORM_NOT_READY`.

8. Khói sau khi bật: yêu cầu thử "TEST OTTIMO" / kênh Email / `info@ottimo.vn` (không SĐT), xóa theo WR8, rồi đếm READ ONLY: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/us155-smoke-counts.sh --ref REQ-XXXXXXXX --since <giờ bắt đầu, có múi giờ>` → `RESULT: OK – 14/14`. Chỉ in số đếm (`us155-smoke-counts.sql`, SEC FB-R3-SEC-OPS-US155-02).

Quay lui: (a) OWN tắt công tắc trên Desk (ngay); (b) đặt `LANDING_PUBLIC_API=off` rồi `deploy-landing.sh <tag hiện tại> --no-pull` – mọi `/v1/*` trên `ottimo.vn` trả 404, form tự hướng khách sang Zalo / gọi điện; (c) gỡ form – **đúng thứ tự** (ARC FB-R3-ARC-OPS-US155-03): đặt `LANDING_PUBLIC_API=off` trong `.env` **trước**, rồi `deploy-landing.sh --rollback` về bản không form, rồi kiểm `/v1/public/properties/dlt/form-token` trên `ottimo.vn` trả 404 HTML của Caddy (không phải JSON). Làm ngược thì bản cũ được dựng lại với proxy còn mở. Dòng `privacy_notice_version` đã ghi **giữ nguyên** (yêu cầu đã nhận trỏ FK tới nó) – không xóa.

**Mỗi lượt landing sau này – `deploy-landing.sh` tự kiểm byte trang privacy** (ARC FB-R3-ARC-OPS-US155-01, erd 4.14: một (`version`, `locale`) ứng với đúng một chuỗi byte):
- Bước `privacy`, sau `pull` + kiểm digest, **trước** khi đổi container: đọc `/srv/landing/privacy/index.html` (en) và `/srv/landing/vi/privacy/index.html` (vi) trong image **mới** (`docker run --network none --pull never`), lấy sha256 và version in trên trang ("Version …" / "Phiên bản …", cùng mẫu với `publish-privacy-notice.sh`).
- So với mọi dòng **`apply … rc=0`** trong `state/privacy-notice.log` (dòng chạy thử và lượt ghi lỗi không tính):
  - cùng version, cùng băm → cho qua;
  - **cùng version, khác băm → từ chối** (`FAIL: privacy page bytes changed for a published notice version …`, CI báo `step=privacy`), không đổi container, không ghi `landing_tag`. Áp dụng cả `--rollback`. Cách sửa: tăng version thông báo (2 trang + `data-consent-version` của form), phát hành lại, rồi chạy bước 6 cho version mới;
  - version chưa có trong log → cho qua, in nhắc chạy bước 6 sau deploy;
  - image không có 2 trang privacy, hoặc trang không in đúng một version → **từ chối khi `LANDING_PUBLIC_API=on`** (ARC CWD-01, v1.0.1: form đang nhận đồng ý thì phải đối chiếu được); proxy đóng thì chỉ ghi chú / WARNING;
  - không có `state/privacy-notice.log` mà `LANDING_PUBLIC_API=on` → **WARNING riêng** "no …/privacy-notice.log while the form proxy is on" (ARC CWD-02): nếu stack này từng ghi version thì khôi phục log từ bản sao lưu (`privacy-notice-<stamp>.log.age`, mục 13.6) hoặc chạy `publish-privacy-notice.sh` (chạy thử) để đối chiếu DB **trước** khi INV duyệt.
- Ngoại lệ: khi `LANDING_PUBLIC_API` **khác `on`** (proxy form đóng, khách không gửi được đồng ý – ví dụ quay lui (c) ở trên), cùng version khác băm chỉ là **WARNING**. Phải tăng version trước khi mở lại proxy.
- Trước khi INV duyệt một lượt landing: OPS chạy `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh <sha-…> --digest sha256:… --check-only` (kéo image, kiểm cấu hình + digest + privacy, **không đổi gì**). Thay cho việc băm tay trước đây.
- **Sau mỗi lượt deploy landing có version mới** (tới khi có `--candidate-digest`, FB-04, `v1.0.1`): chạy bước 6 (`publish-privacy-notice.sh` chạy thử rồi `--apply`) **ngay sau deploy landing, trong cùng phiên SSH, ngoài giờ cao điểm** (tránh khung nhận/trả phòng), để khoảng trống giữa trang mới và dòng phiên bản ngắn nhất.
- Nguồn so sánh là `state/privacy-notice.log` trên chính stack (mọi lần ghi bảng đều qua `publish-privacy-notice.sh`, mỗi lần một dòng). Mất tệp này thì kiểm coi như "chưa có version nào" – không xóa, không sửa tay tệp này. Từ v1.0.1 tệp nằm trong bản sao lưu hằng ngày (mục 13.6).
- Test: `infra/server/test/deploy-landing-privacy.test.sh` (13 ca: image giả `FROM alpine`, không cần stack; chạy trong CI job `infra-scripts`).

## 13. v1.0.1 – tin Google Chat (yêu cầu đặt phòng) và kiểm vận hành mới

Căn cứ:
- ARC `gchat-booking-request-notify` mục 3.2 và 8.7.
- `rounds/round-03/reviews/ARC-on-BE-gchat-notify.md` (GC-04), `SEC-on-BE-gchat-notify.md` (bảng ★), `QA-on-BE-gchat-notify.md` (FB-04).
- `rounds/round-03/outputs/SEC/esc041-gchat-full-details.md` mục L2.
- `rounds/round-03/reviews/ARC-on-OPS-cwd-fb01.md` (CWD-01…04), `rounds/round-04/plan-v1.0.1.md` (T11–T16).

Lệnh từng bước cho INV: `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md`.

Chỉ worker đọc 2 cấu hình mới:
- `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE` = `/run/secrets/booking_request_chat_webhook`: tệp bí mật chứa URL webhook của phòng "OTTIMO – Yêu cầu đặt phòng". Trong URL có key và token. **Tệp rỗng = Chat tắt.** Tệp có uid 1000, quyền 0400, dài tối đa 512 ký tự.
- `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` trong `.env` (không phải bí mật): `A` (mặc định: mã, giờ nhận, hạn phản hồi, mức gấp, link Desk), `B` (thêm ngày, số khách) hoặc `C` (thêm tên, liên hệ, lời nhắn). Thiếu hoặc sai thì dùng `A`.

### 13.1 Trước lượt deploy v1.0.1: làm mới bundle + tệp bí mật mới (GC-04)

- `docker-compose.prod.yml` của v1.0.1 có thêm một secret. Thiếu tệp thì `deploy.sh` **từ chối sạch** ở bước `config`, trước khi kéo image (`FAIL: secret file(s) missing: booking_request_chat_webhook – run: sudo …/init-secrets.sh`). Dịch vụ không bị gián đoạn.
- **CI không làm mới bundle.** Khóa CI chỉ chạy được `deploy-from-ci.sh`. Script này chỉ nhận `deploy sha-…` / `landing sha-…`, không chép tệp, không đổi compose, Caddy hay bí mật.
  - Bundle `infra/` trên máy chủ chỉ đổi khi OPS hoặc INV làm tay.
  - Với mỗi bản phát hành, chạy `git diff <tag đang chạy> <tag mới> -- product/infra`. Kết quả khác rỗng thì phải làm mới bundle **trước** khi INV duyệt deploy.
- Thứ tự cho **mỗi stack** (staging trước, production sau):
  1. Gói bundle trên Mac từ đúng commit sẽ phát hành: `git archive --format=tar.gz -o /tmp/ottimo-infra.tgz <ref> product/infra`. Gói chỉ có tệp đã commit, nên không lẫn `.env`, `.out`, `.work` hay `._*`.
  2. `scp` lên home của `ottimo-admin`, rồi giải nén vào `~/ottimo-bundle` (quyền 0700).
  3. Sao lưu bundle cũ vào `/root/ottimo-staging-bundles/infra-<giờ>` hoặc `/root/ottimo-prod-bundles/infra-<giờ>`.
  4. `rsync` **chỉ vào** `/opt/ottimo/infra` hoặc `/opt/ottimo-prod/infra`:
     - dùng cờ như `bootstrap-vps.sh`, thêm `--checksum` (so nội dung, không chỉ cỡ + giờ) và `--exclude 'server/test/'`;
     - sau đó `chmod -R go-w`, rồi `chmod 0755 server/bin/* postgres/init/02-roles.sh`;
     - **không** chạy cả `bootstrap-vps.sh`, vì script đó chạy `apt upgrade` và `ufw reset` (decision-log 25/10);
     - kiểm bằng `diff -rq --exclude=test` giữa bản giải nén và bundle trên máy.
  5. **Ngay sau đó** chạy `sudo …/init-secrets.sh` (không cờ). Lệnh tạo `booking_request_chat_webhook` **rỗng** và in `init-secrets: created booking_request_chat_webhook`. Nếu trên production lệnh in thêm tên nào khác thì **dừng**, báo OPS: production không được sinh khóa mới.
  6. Kiểm:
     - `sudo stat -c '%n uid=%u mode=%a size=%s' …/secrets/booking_request_chat_webhook` phải ra `uid=1000 mode=400 size=0`;
     - `cd / && sudo -u ottimo …/bin/dc --profile deploy config -q` không in gì.
- Sau deploy mà tệp vẫn rỗng: log worker có `{"level":"info","msg":"chat: off","reason":"NOT_CONFIGURED"}`.
- Lỡ deploy **trước** khi làm mới bundle: bundle cũ không có secret nên deploy vẫn qua, nhưng Chat tắt. Sửa bằng cách làm bước 3–6, rồi `cd / && sudo -u ottimo …/bin/dc up -d --no-deps worker` để dựng lại worker với compose mới.
- Quay lui bundle: dùng khối lệnh có sẵn Q1–Q3 trong `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md` (SEC FB-R4-SEC-OPS-PR23-02), không gõ tay. Khối lệnh kiểm đường dẫn đúng mẫu `/root/ottimo-<stack>-bundles/infra-YYYYMMDD-HHMMSS`, kiểm bản cũ có `server/bin/dc` + `docker-compose.prod.yml`, in đường dẫn và đòi gõ `YES` **trước** `rsync --checksum --delete`, rồi `diff -rq` + `dc --profile deploy config -q`. Bản dùng để quay lui là bản sao **của lần chạy đầu tiên** trong ngày (chạy lại bước làm mới thì lần sau sao lưu bản đã thay). Tệp bí mật rỗng để nguyên cũng không ảnh hưởng bản cũ. Quay lui **sau** khi đã deploy v1.0.1 thì worker mất secret Chat (Chat tắt): sau đó `dc up -d --no-deps worker`.
- Gói tải lên được đối chiếu băm: Mac `shasum -a 256 /tmp/ottimo-infra.tgz` = máy chủ `sha256sum ~/ottimo-infra.tgz` (SEC 03), để không lắp nhầm gói staging cho production.
- **Quy ước digest trong runbook và README (từ v1.0.3, ARC/SEC FB-R4-*-OPS-PR30-01):** không dán digest image đầy đủ (`sha256:<64 hex>`) vào dòng lệnh hay văn bản. Lệnh đọc digest vào biến từ `state/digests/<tag>` trên máy chủ (`rollback.sh <tag>` tự đọc; `deploy.sh` thì `A=$(… sed -n "s/^api=//p")`) hoặc từ artifact `image-digests` của CI; khi cần ghi tay thì dùng ô `⟨API_DIGEST⟩`. Chỗ đối chiếu với log Release chỉ ghi dạng rút gọn `f064700d…a9be`. Lý do: gitleaks `generic-api-key` báo nhầm chữ `--api-digest sha256:…`, làm CI `main` đỏ, bỏ qua `publish images` và chặn Release. Allowlist trong `.github/gitleaks.toml` chỉ có các digest lịch sử, khớp đúng giá trị.

### 13.2 Dán / đổi / xóa URL webhook (`--set-booking-chat`)

```sh
# Từ Mac: ssh -t (cần terminal để có dấu nhắc ẩn). Production: phòng thật. Staging: phòng THỬ (ESC-046) hoặc để rỗng.
ssh -t -i ~/.ssh/ottimo_ops ottimo-admin@desk.ottimo.vn 'cd / && sudo /opt/ottimo-prod/infra/server/bin/init-secrets.sh --set-booking-chat'
```
- Lấy URL: Google Chat → phòng → **Apps & integrations** → **Webhooks** → tạo webhook tên "Desk OTTIMO" → sao chép. Dán ở dấu nhắc `Webhook URL:`. Lúc dán, màn hình không hiện gì.
- Script kiểm URL theo đúng luật của worker: chỉ nhận `https://chat.googleapis.com/v1/spaces/<id>/messages?key=…&token=…`.
  - Image đang chạy có công cụ `dist/tools/check-chat-webhook.js` (từ v1.0.1) thì kiểm thêm bằng công cụ đó.
  - Image cũ thì in `checked: bash rule only`.
- Script ghi qua tệp tạm (umask 077) rồi `mv`. Màn hình chỉ in `chat webhook: set (<số> chars)`. Nhập dòng trống thì Chat tắt (`chat webhook: empty (Chat off)`).
- Dán xong thì chạy `cd / && sudo -u ottimo …/bin/dc restart worker`, rồi xem log có `{"level":"info","msg":"chat: on"}`. Nếu dán trước lượt deploy v1.0.1 thì không cần restart: deploy tự dựng lại worker.
- **Không bao giờ** dán URL vào chat, email, tài liệu hay issue. Ai có URL cũng đăng được vào phòng nhân viên. URL bị lộ thì xóa webhook trong Google Chat, tạo webhook mới, rồi chạy lại lệnh trên.
- Lệnh xem log (dùng cho cả hai stack):
  ```sh
  cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc logs --no-color --no-log-prefix worker | grep '"msg":"chat' | tail -5
  ```
  Dòng báo mức có dạng `{"level":"info","msg":"chat detail level","detailLevel":"A"}`: mức A/B/C nằm ở trường `detailLevel`, còn `level` là mức log (PR #24).
  - Image cũ hơn PR #24 (bản có PR #16 nhưng chưa có PR #24) ghi `{"level":"A","msg":"chat detail level"}`: mức A/B/C đè lên trường `level`. Đây là lỗi log đã sửa ở PR #24, không ảnh hưởng tin.

### 13.3 Lọc log `chat dead` (QA FB-R3-QA-BE-GCHAT-04)

Chạy sau deploy và mỗi sáng, cho tới khi `ops-check` có mục `chat_dead`.

Tin Chat lỗi được gửi lại sau 1, 5, 15, 60 rồi 180 phút. Tin thành `dead` khi quá khoảng 4 giờ 20 phút mà vẫn lỗi, hoặc khi Google trả 4xx (ví dụ webhook bị xóa). Lúc đó chỉ còn lại một dòng log. Desk vẫn là nguồn chính, nhưng người trực không biết Chat đã im.
```sh
cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc logs --no-color --no-log-prefix --since 24h worker | grep -c '"msg":"chat dead"'
```
- Kết quả phải là `0`.
  - Nếu lớn hơn 0: xem chi tiết bằng `… | grep '"msg":"chat dead"' | tail -5`, rồi báo INT/BE. Dòng log chỉ có `outboxId`, `kind`, `attempt`, `code`, không có dữ liệu khách.
  - `code` là lỗi 4xx thì webhook đã bị xóa hoặc đổi: dán lại URL theo 13.2.
  - Tin đã `dead` không tự gửi lại. Mở Desk (H03) để xem yêu cầu.
- Cùng lúc, đếm `grep -c '"msg":"chat retry"'`. Số này tăng đều là dấu hiệu sắp có tin `dead`.

### 13.4 Đổi mức tin A → B/C (SEC ESC-041 ★3) – production

Chỉ làm khi đủ **cả 3** điều kiện:
1. SEC đã ghi dòng decision-log "đủ điều kiện đặt C" (★1–★8, gồm K1 ở 13.5 và ★2-bis ở 13.7).
2. **INV được báo trước và đồng ý**, vì đây là một lần đổi `.env` production.
3. ORC có mặt để ghi decision-log.

```sh
cd /
# 1. Lưu dòng log mức hiện tại (dán vào decision-log)
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc logs --no-color --no-log-prefix worker | grep '"msg":"chat detail level"' | tail -1
# 2. Sao lưu .env (cp -p giữ 0600)
sudo -u ottimo cp -p /opt/ottimo-prod/.env /opt/ottimo-prod/state/env.before-chat-level.$(date +%Y%m%d-%H%M%S)
# 3. Đặt mức: bỏ dòng cũ (nếu có), thêm dòng mới; `cat >` giữ nguyên tệp .env (chủ ottimo, 0600) – không `sed -i`
#    (sed -i cần quyền ghi thư mục /opt/ottimo-prod và tạo tệp mới)
sudo -u ottimo sh -c 'umask 077; f=/opt/ottimo-prod/.env t=/opt/ottimo-prod/state/env.level.tmp; grep -v "^BOOKING_REQUEST_CHAT_DETAIL_LEVEL=" "$f" > "$t" && echo BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C >> "$t" && cat "$t" > "$f" && rm -f "$t"'
sudo -u ottimo grep '^BOOKING_REQUEST_CHAT_DETAIL_LEVEL=' /opt/ottimo-prod/.env    # đúng 1 dòng
# 4. Dựng lại CHỈ worker (`restart` KHÔNG đọc lại .env – phải `up -d`)
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc up -d --no-deps worker
# 5. Kiểm: phải thấy mức mới và KHÔNG có "chat config invalid"
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc logs --no-color --no-log-prefix --since 5m worker | grep '"msg":"chat'
#    Mức mới: đúng 1 dòng {"level":"info","msg":"chat detail level","detailLevel":"C"}
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc logs --no-color --no-log-prefix --since 5m worker | grep '"msg":"chat detail level"' | grep -c '"detailLevel":"C"'
# 6. Bước 5 đạt: chỉ giữ bản sao .env MỚI NHẤT (để quay lui), xóa các bản env.before-chat-level.* cũ hơn (SEC PR23-05)
sudo -u ottimo sh -c 'ls -1t /opt/ottimo-prod/state/env.before-chat-level.* | tail -n +2 | xargs -r rm -f --; ls -l /opt/ottimo-prod/state/env.before-chat-level.*'
```
- Bước 5 đạt khi lệnh đếm in `1` (với mức A thì đổi `"detailLevel":"C"` thành `"detailLevel":"A"`). Image chưa có PR #24 thì dòng có dạng cũ `{"level":"C","msg":"chat detail level"}` và lệnh đếm in `0`: đọc dòng ở lệnh grep phía trên.
- ORC ghi decision-log: mức cũ → mới, giờ, người làm, dòng SEC làm căn cứ, kèm 2 dòng log ở bước 1 và bước 5, và việc đã dọn bản sao `.env` cũ (bước 6).
- Tệp tạm `env.level.tmp` tạo dưới `umask 077` (0600) và bị xóa ngay; không để bản sao `.env` nào khác ngoài `state/`.
- Quay về A: làm lại các bước trên với `A`. Hạ mức thì không cần SEC, nhưng vẫn báo INV và ghi decision-log.
- **Quay lui app khi đang ở mức B/C** (SEC FB-R4-SEC-OPS-PR26-03, N1): bản cũ không có Chat (ví dụ v1.0.0) không gửi tin `web_request_erased` khi xóa yêu cầu (WR8). Mọi quy trình quay lui về bản như vậy phải có thêm bước: sau khi lên lại bản có Chat, OWN rà các yêu cầu đã bị xóa trong thời gian chạy bản cũ, rồi tự xóa tin Chat tương ứng. Ở mức A thì không cần, vì tin không có dữ liệu khách (đợt v1.0.1).
- Yêu cầu gửi dưới thông báo cũ hơn `2026-10-31` **luôn** nhận mức A, dù `.env` đặt C. Đây là hằng số trong mã.
- Staging chỉ được đặt C khi nối với **phòng thử** và dùng dữ liệu giả. Không bao giờ nối staging với phòng thật.

### 13.5 K1 và xóa tin Chat khi khách xin xóa (WR8) – SEC L2.2

**K1** – kiểm một lần trên phòng thật, ngay sau khi v1.0.1 chạy mức A, và **trước** khi đăng thông báo `2026-10-31`:
1. INV gửi một yêu cầu thử trên ottimo.vn: tên đúng chuỗi `TEST OTTIMO`, email `info@ottimo.vn`, không SĐT, tắt tự điền.
2. Tin mức A tới phòng.
3. INV, với quyền quản lý phòng, **xóa tin do webhook "Desk OTTIMO" đăng**.
4. Tìm `REQ-…` trong Chat: không còn kết quả.
5. INT ghi lại từng câu có/không:
   - xóa được tin webhook;
   - xóa được tin người khác trả lời trong luồng;
   - trước khi xóa, tìm kiếm có ra mã `REQ-…`.
6. Xóa yêu cầu thử theo WR8 trên Desk, rồi chạy đếm khói 12.3 bước 8. Kết quả phải là `RESULT: OK – 14/14`.

K1 **không đạt** (không xóa được tin webhook) thì: không đăng `2026-10-31`, không đặt C, INT báo SEC.

**WR8 bằng tay** (sổ tay BA ghi đầy đủ):
1. Người làm WR8 chép mã `REQ-…` **trước** khi xóa trên Desk.
2. FDL chỉ nhắn MGR (MGR vắng thì OWN) mã yêu cầu và chữ "xóa Chat theo WR8".
3. **Trong 24 giờ**, quản lý phòng tìm theo mã, rồi xóa tin đầu, mọi tin nhắc lại và mọi tin nhân viên trả lời trong luồng.
4. Quản lý phòng ghi sổ xóa nội bộ, **chỉ ghi mã**.
5. Mỗi tháng, OWN đối chiếu sổ xóa với các WR8 trên Desk, cùng lúc rà thành viên phòng (★4).

OPS không có quyền xóa tin Chat. Máy chủ không giữ bản sao nào của tin đã gửi: dòng `staff.chat` chỉ có mã và trạng thái.

### 13.6 Sao lưu `state/privacy-notice.log` (ARC CWD-02)

- `backup.sh` thêm `privacy-notice-<stamp>.log.age` (kèm `.sha256`) vào bộ sao lưu hằng ngày, nếu stack có tệp này.
  - Tệp chỉ chứa mã người chạy, tag landing và băm trang. Không có dữ liệu khách.
  - Thời gian giữ như `db-*`.
  - Bản sao ngoài máy có sẵn, vì `pull-backups.sh` kéo mọi tệp `*.age`.
- `restore-drill.sh` giải mã tệp nếu có, rồi đối chiếu các version ghi `rc=0` với bảng `privacy_notice_version` trong DB vừa khôi phục. Biên bản in một dòng `privacy-notice.log:`. Dòng này chỉ để xem, không chặn, vì bộ sao lưu trước v1.0.1 chưa có tệp. Đọc bảng lỗi thì dòng ghi `KHÔNG ĐỌC ĐƯỢC … – không đối chiếu được` và drill in WARNING, không bao giờ ghi "khớp DB" (ARC PR23-01; hàm `infra/server/privacy-log-check.sh`, test `test/restore-drill-privacy.test.sh`).
- Dựng lại máy chủ từ sao lưu: giải mã `privacy-notice-<stamp>.log.age` mới nhất trên Mac, rồi chép vào `state/privacy-notice.log` (chủ `ottimo`, quyền 0600) **trước** lượt deploy landing đầu tiên. Thiếu tệp mà proxy form đang mở thì `deploy-landing.sh` in WARNING (12.3).
- Test: `infra/server/test/backup-privacy-log.test.sh` (5 ca, stub `dc`/`age`, chạy trong CI).

### 13.7 `privacy_notice_version`: ★2-bis tạm (trước 0090) và luật thường trực

**Luật thường trực (SEC FB-R4-SEC-OPS-RB-04), mọi môi trường, mọi lúc:** không `UPDATE`, `DELETE`, `TRUNCATE` trên `privacy_notice_version`, và không `ALTER TABLE … DISABLE TRIGGER` / `DROP TRIGGER` / `CREATE OR REPLACE FUNCTION` lên trigger của bảng này bằng tay. Đăng bản thông báo mới **chỉ** qua `publish-privacy-notice.sh` (12.3 bước 6). Trigger 0090 chỉ chặn DML của vai thường; chủ bảng (`ottimo_owner`) và superuser vẫn tắt được trigger, nên luật này vẫn cần sau khi 0090 đã lên. Cũng không `SET session_replication_role = replica` trong phiên nào có đụng bảng này, và không `pg_restore --disable-triggers` vào DB có bảng này: hai cách đó vượt trigger mà `tgenabled` vẫn là `O`, nên kiểm K3 không thấy (SEC PR30-08). Thay thân hàm trigger chỉ qua migration có review ARC + SEC (ví dụ PN-01 Minor, 0094).

Từ 03/11/2026 (v1.0.2, `decision-log`), production đã có 2 trigger 0090 (`tgenabled = 'O'`) và quyền `ottimo_app` = `t|f|f|f|f|f`, SEC đã đổi ★2-bis thành "Đã thay bằng 0090". Phần dưới chỉ còn dùng cho một DB **trước** 0090 (ví dụ khôi phục từ bản sao lưu 65 migration, runbook v1.0.2 P3) cho tới khi deploy lại đủ migration.

Tới khi trigger chỉ-thêm-dòng của PN-01 lên production, SEC tạm chấp nhận hai điều sau:
- **Ảnh chụp quyền**: `ottimo_app` chỉ có `SELECT` trên bảng.
- Luật **"không chạy UPDATE/DELETE tay trên `privacy_notice_version`"**. Mọi lần ghi đều qua `publish-privacy-notice.sh` (12.3 bước 6).

```sh
cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T postgres sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dp privacy_notice_version"'
```
- Cột `Access privileges` phải có `ottimo_app=r/ottimo_owner`: chỉ có chữ `r`, không có `a`, `w` hay `d`.
- Dán kết quả vào báo cáo OPS cho SEC (kết quả không chứa dữ liệu).
- Chụp lại sau mỗi lần deploy có migration, cho tới khi PN-01 lên.

### 13.8 `ops-check`: `email_dead`, `email_missing`, `email_changes`, `email_ascii`, `EMAIL_NO_RECIPIENT_ALERT` và lỗi truy vấn (v1.0.1, v1.0.3)

- `email_dead` (mục 7) đếm thư `staff.email` chết vì `NO_RECIPIENT` trong 24 giờ. Chỉ đếm, không đọc payload.
- `email_missing` (v1.0.3, ARC `v1.0.3-tech-plan.md` 2.10 điều kiện 2) đếm người dùng `active` đang có vai `owner` hoặc `manager` chưa thu hồi (`user_property_role.revoked_at IS NULL`) mà **chưa có email** (`app_user.email` rỗng). Thư bảo mật gửi cho họ sẽ chết `NO_RECIPIENT`.
  - Chạy trong giao dịch **READ ONLY** (`default_transaction_read_only=on`), chỉ `SELECT count(*)`: không đọc, không in địa chỉ, tên hay id. Đầu ra chỉ là một con số, ví dụ `ok   email_missing: 1 active OWN/MGR user(s) without e-mail (report only …)`.
  - Chỉ dùng cột có từ 0000, nên chạy được cả trên DB v1.0.2 (67 migration) lẫn v1.0.3 (68, có 0091). Trên production trước khi INV nhập email, số này là `1` (INV là OWN duy nhất, chưa có email) – đúng như dự kiến, không phải lỗi.
  - Chạy tay: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh email_missing`.
- `email_changes` (v1.0.3, SEC `FB-R4-SEC-OPS-PR31-01`; **điều kiện để deploy v1.0.3 lên production**). v1.0.3 chưa giới hạn số lần đổi email thành công (giới hạn cứng ở v1.0.4), và bộ gửi thư chỉ lấy 10 thư/phút/cơ sở theo thứ tự vào trước ra trước. Một đợt dội lệnh đổi email làm trễ mọi thư bảo mật khác. Kiểm này đếm:
  - từ `user_email_change` (bảng của 0091): tổng số lần đổi trong 24 giờ, và số lần của **người bị đổi nhiều nhất**;
  - từ `outbox_message`: số thư `staff.email` còn chờ (`pending`, `failed`, `in_flight`) và tuổi thư cũ nhất (phút).
  - `FAIL` khi một người đổi > `EMAIL_CHANGES_USER_MAX` (mặc định **5**), hoặc tổng > `EMAIL_CHANGES_TOTAL_MAX` (mặc định **20**) trong 24 giờ, hoặc thư cũ nhất còn chờ > `STAFF_EMAIL_QUEUE_MAX_MIN` (mặc định **30** phút). Kiểm này **luôn** cảnh báo, không theo công tắc `EMAIL_NO_RECIPIENT_ALERT`.
  - Ba ngưỡng chỉnh được trong `.env` của stack (`.env` thắng biến môi trường), nhưng **không tắt được**: mỗi ngưỡng phải là số nguyên trong khoảng 1–20, 1–200 và 5–240. Giá trị khác (0, chữ, số quá lớn) làm kiểm `FAIL` với câu `… must be a whole number …`, không lặng lẽ cho qua.
  - Giao dịch **READ ONLY**, chỉ in số. Không chọn địa chỉ, id hay payload. Trước 0091 (production v1.0.2, chưa có bảng), phần đếm đổi email ghi `table not present yet (before migration 0091)`, và chỉ xét hàng đợi.
  - Staging: QA đổi email thử nhiều lần thì `FAIL` là đúng (QA dùng chính ca này: đổi 6 lần trong 24 giờ → `FAIL`).
  - Khi `FAIL`: runbook v1.0.3 mục "email_changes FAIL". Tóm tắt (SEC PR32-02, PR33-01): đổi bởi OWN (`via = owner`, thư có câu "Thay đổi do chủ cơ sở thực hiện"), **hoặc email của chính tài khoản OWN bị đổi** (kể cả `via = self`), mà INV không làm → coi tài khoản OWN bị lộ: INV đổi mật khẩu, đăng xuất phiên lạ, báo SEC ngay, **không** khóa các tài khoản bị đổi. **Không chắc nhánh nào → làm như vậy**; chỉ khóa người khác khi SEC xác nhận. Một nhân viên (không phải OWN) tự đổi email của mình (`via = self`) → OWN khóa nhân viên đó. **Không bao giờ** để INV tự khóa tài khoản OWN duy nhất. Báo SEC trong mọi nhánh. Trong 30 phút sau `requeue-email-changed.sh --apply` (13.9), câu `oldest waiting … min old` là dự kiến: chạy lại sau 3 phút trước khi kết luận. Không xóa dòng outbox, không sửa bảng bằng SQL tay.
  - Chạy tay: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh email_changes`.
- `email_ascii` (v1.0.3, INT `FB-R4-INT-BE-31-04`): số `app_user.email` (không rỗng) mà luật địa chỉ của API (`normalizeSecurityEmail`: cắt khoảng trắng, chữ thường, phần tên `[a-z0-9._%+-]{1,64}`, ≥ 2 nhãn `[a-z0-9-]{1,63}`, đuôi là chữ, 3–254 ký tự) sẽ từ chối. READ ONLY, chỉ `count(*)` ra khỏi DB, **luôn chỉ báo số**. INT chỉ siết adapter SMTP ở v1.0.4 khi số này bằng 0 (hoặc đã báo chủ tài khoản đổi địa chỉ). Đã đối chiếu với hàm TypeScript trên 29 ca (Postgres 17 tạm).
- **`EMAIL_NO_RECIPIENT_ALERT`** (một công tắc cho cả hai kiểm `email_dead` và `email_missing`; `.env` thắng biến môi trường; chỉ nhận `0` hoặc `1`):
  - `0` hoặc không đặt (mặc định): cả hai chỉ báo số, luôn `ok`, có chữ `report only until EMAIL_NO_RECIPIENT_ALERT=1`.
  - `1`: `email_dead` > 0 → `FAIL` ("a security notice reached nobody"); `email_missing` > 0 → `FAIL` ("their security notices reach nobody"). Cảnh báo đi journal + webhook như các kiểm khác, nhắc lại mỗi 6 giờ.
- **Chỉ bật khi đủ cả 4 điều kiện** (ARC 2.10; runbook `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` mục E):
  1. v1.0.3 (BUG-R3-032, migration 0091) đang chạy trên production (`current_tag` = image của tag `v1.0.3`);
  2. `ops-check.sh email_missing` in **0**;
  3. INV đã báo trong chat "đã nhận thư" (thư `email_changed` lúc INV lưu email trên Desk). INV **không** dán địa chỉ vào chat; đội không ghi địa chỉ vào repo hay tài liệu;
  4. `ops-check.sh email_dead` in **0** cho 24 giờ gần nhất. Dòng chết trước lúc có email vẫn nằm trong cửa sổ 24 giờ, nên còn > 0 thì đợi qua cửa sổ, không bật sớm.
- **Cách bật** (production; staging đổi `/opt/ottimo-prod` thành `/opt/ottimo`). Lệnh không in `.env`, chỉ in số dòng của công tắc; `cat >` giữ nguyên tệp `.env` (chủ `ottimo`, 0600), không `sed -i`:
  ```sh
  cd /
  sudo -u ottimo cp -p /opt/ottimo-prod/.env /opt/ottimo-prod/state/env.before-email-alert.$(date +%Y%m%d-%H%M%S)
  sudo -u ottimo sh -c 'umask 077; f=/opt/ottimo-prod/.env t=/opt/ottimo-prod/state/env.alert.tmp; trap "rm -f \"\$t\"" EXIT; grep -v "^EMAIL_NO_RECIPIENT_ALERT=" "$f" > "$t" && echo EMAIL_NO_RECIPIENT_ALERT=1 >> "$t" && cat "$t" > "$f" && rm -f "$t"'
  sudo -u ottimo grep -c '^EMAIL_NO_RECIPIENT_ALERT=1$' /opt/ottimo-prod/.env      # đúng là: 1
  sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh email_dead email_missing
  sudo -u ottimo test ! -e /opt/ottimo-prod/state/env.alert.tmp && echo "TMP: GONE"                # đúng là: TMP: GONE
  # chỉ giữ bản sao .env mới nhất (như 13.4 bước 6)
  sudo -u ottimo sh -c 'ls -1t /opt/ottimo-prod/state/env.before-email-alert.* | tail -n +2 | xargs -r rm -f --; ls -l /opt/ottimo-prod/state/env.before-email-alert.*'
  ```
  Đúng là: 2 dòng `ok`, **không** còn chữ `report only`; `TMP: GONE`; còn đúng một tệp `env.before-email-alert.*`. Timer đọc `.env` mỗi lượt, api/worker không đọc biến này, nên **không** dựng lại container. `trap … EXIT` xóa tệp tạm (bản sao đầy đủ `.env`) cả khi lệnh dừng giữa chừng (SEC PR30-07).
- **Tắt lại** (ví dụ thêm MGR mới chưa có email, hoặc cảnh báo giả): làm như trên với `EMAIL_NO_RECIPIENT_ALERT=0`, báo SEC (SEC quyết có cần lượt kiểm tay mỗi sáng trong lúc cảnh báo tắt không). Lệnh dọn bản sao như trên.
- **Thêm OWN/MGR mới sau khi đã bật:** OWN nhập email cho người đó ngay trên Desk (**Người dùng & vai**, cần mật khẩu + mã 2 bước). Chưa nhập thì `email_missing` FAIL ở lượt timer kế tiếp – đó là cảnh báo đúng.
- **Thư thử SMTP** (`mail-test.mjs`): chỉ chạy qua `product/infra/server/bin/mail-test.sh` trên Mac.
  - Mặc định `--verify-only`: chỉ kết nối + STARTTLS, không gửi, không hỏi địa chỉ.
  - `--send`: hỏi địa chỉ ở **dấu nhắc ẩn** (`read -rs`), địa chỉ đi qua stdin, không nằm trong tham số lệnh nào trên Mac hay VPS, không vào lịch sử shell. Chỉ chủ hộp thư tự gõ (INV với hộp thư riêng), bằng khóa SSH quản trị trên chính Mac của mình (`--key`, mặc định `~/.ssh/ottimo_ops`); không chép khóa sang máy khác.
  - Trước `--send`, sudo **không** được ghi I/O (nếu có `log_input`/`log_stdin`…, sudo ghi lại stdin, tức dòng địa chỉ, vào `/var/log/sudo-io`). Kiểm chỉ đếm, đúng là `SUDO_IO_LOG=0` (SEC PR30-04). Lệnh **báo lỗi chứ không in 0** (SEC PR30-09): `sudo -n` đòi mật khẩu, hoặc `grep` không đọc được một tệp (mã thoát > 1), thì in `SUDO_IO_LOG=ERR`. `ERR` tính như khác 0: **cấm** `--send`, báo OPS.
    ```sh
    ssh … 'cd / && echo "SUDO_IO_LOG=$({ sudo -n grep -rhcE "^[^#]*(log_input|log_output|log_stdin|log_stdout|log_stderr|log_ttyin|log_ttyout|log_servers)" /etc/sudoers /etc/sudoers.d; [ $? -le 1 ] || echo X; } | awk "{ if (\$1 == \"X\") e = 1; else s += \$1 } END { if (e || NR == 0) print \"ERR\"; else print s + 0 }")"'
    ```
  - Sau `--send` (hoặc khi lệnh bị ngắt giữa chừng), không được còn container one-off của worker: cấu hình container giữ biến `MAIL_TEST_TO` tới khi bị xóa (SEC PR30-05). Đếm, rồi xóa nếu có (không `docker inspect`, không in env). Lệnh đếm chạy `docker ps` vào biến trước và kiểm mã thoát: `sudo`/`docker` lỗi thì in `ONEOFF=ERR`, không in `0` (SEC PR30-09). `ERR` tính như khác 0: chạy lệnh xóa, rồi đếm lại; vẫn `ERR` thì báo OPS dọn tay trên máy chủ.
    ```sh
    ssh … 'cd / && L=$(sudo -n -u ottimo docker ps -a -q --filter label=com.docker.compose.oneoff=True --filter label=com.docker.compose.service=worker) && echo "ONEOFF=$(printf %s "$L" | grep -c .)" || echo "ONEOFF=ERR"'
    ssh … 'cd / && sudo -n -u ottimo sh -c "docker ps -a -q --filter label=com.docker.compose.oneoff=True --filter label=com.docker.compose.service=worker | xargs -r docker rm -f >/dev/null" && echo REMOVED'
    ```
  - `MAIL_TEST_READ_STDIN=1` chỉ cho test (cùng `MTS_DIR` của `ssh` giả); không dùng tay: địa chỉ đưa qua pipe sẽ nằm trong lịch sử shell.
  - Không bao giờ gõ `-e MAIL_TEST_TO=<địa chỉ>`. Thư thật của v1.0.3 là thư `email_changed` khi INV lưu email trên Desk; `--send` chỉ dùng khi đội điều tra lỗi gửi.
  - Test: `infra/server/test/mail-test-send.test.sh` (20 kiểm, `ssh` giả; gồm bit chạy và chạy trực tiếp không qua `bash`).
- Khi truy vấn của `j16`, `email_dead`, `email_missing`, `email_changes` hoặc `email_ascii` lỗi, kiểm báo `query failed: <loại>`. Có 7 loại cố định:
  - `permission denied`
  - `Docker daemon unreachable`
  - `postgres container not running`
  - `database unreachable`
  - `query error`
  - `stack file missing`
  - `other error`

  Nguyên văn lỗi không bao giờ được gửi ra journal hay webhook, vì lỗi đọc `.env` có thể trích nguyên một dòng `.env` (ARC CWD-03). Muốn xem lỗi thật: chạy tay `cd / && sudo -u ottimo …/bin/ops-check.sh j16`, rồi `…/bin/dc exec -T postgres psql …` trên terminal.
- stderr của lệnh đang kiểm ghi vào một tệp riêng cho mỗi lượt (`mktemp`, quyền 0600) và bị xóa khi thoát. Tệp chung `state/ops-check/compose.stderr` của bản 30/10 tự được xóa (ARC CWD-04 mục 1). Bị dừng bằng `SIGTERM` (systemd dừng unit, máy tắt) thì `trap` vẫn chạy; tệp `cmd-stderr.*` sót lại sau `SIGKILL` bị lượt sau xóa khi cũ hơn 60 phút (SEC PR23-06).
- Test: `infra/ci/test-ops-check.sh` (118 kiểm: 24 kiểm `email_missing`; 48 kiểm `email_changes` gồm biên 5/6, 20/21, 30/31 phút, ngưỡng từ `.env`, 10 giá trị ngưỡng bị từ chối, trước 0091, câu trả lời lạ, câu SQL READ ONLY không có cột địa chỉ, loại lỗi; 15 kiểm `email_ascii`) và `infra/server/test/ops-check-cwd.test.sh` (7 ca, ca 4c có cả 5 kiểm DB).

### 13.9 Xếp lại hàng đợi thư `email_changed` sau quay lui (v1.0.3, INT `FB-R4-INT-BE-31-02`, ARC `FB-R4-ARC-BE-31-02`)

- Khi quay lui v1.0.3 → v1.0.2, worker v1.0.2 không biết mẫu `email_changed`. Dòng outbox mẫu này còn chờ sẽ thành `dead`, `last_error = 'BAD_TEMPLATE'`, và khi lên lại v1.0.3 cũng **không** được gửi lại. Mất thư tới địa chỉ cũ, là cảnh báo duy nhất cho chủ hộp thư cũ (SEC 04).
- Cách duy nhất để xếp lại: `bin/requeue-email-changed.sh`. **Không** gõ `UPDATE` tay trên staging/production. Đây là thao tác **ghi**: chạy `--apply` chỉ khi INV đã đồng ý trong chat.
  ```sh
  cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/requeue-email-changed.sh --tag "$(sudo -u ottimo cat /opt/ottimo-prod/state/current_tag)"            # chạy thử: chỉ kiểm + đếm
  cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/requeue-email-changed.sh --tag <tag> --apply --expect <số chạy thử in ra>                     # INV đồng ý
  ```
- Script từ chối (không ghi gì) khi: đang có deploy/quay lui (`state/deploy.lock`); máy không có `flock` nên không kiểm được khóa đó (SEC PR32-01; chỉ bộ test với `RQ_TEST_DC` được bỏ qua, và `RQ_TEST_DC` bị từ chối trên production cũng như ở mọi chỗ có tệp mốc `.ottimo-home` – SEC PR33-S1); `--tag` khác `state/current_tag`; worker đang chạy không đúng tag đó; image worker không biết mẫu `email_changed` (hỏi `isStaffEmailTemplate` ngay trong container, nên v1.0.2 bị từ chối); chưa có bảng `user_email_change`; `--expect` khác số dòng đếm được.
- Chỉ đụng dòng: `staff.email`, `dead`, `BAD_TEMPLATE`, mẫu `email_changed`, `created_at` trong **7 ngày** (quá 7 ngày, địa chỉ cũ đã hoặc sẽ bị job `email_change.purge` xóa ở lượt kế tiếp). Dòng cũ hơn chỉ được đếm. Ghi `status = 'pending'`, `attempts = 0`, `next_attempt_at = NULL`, `last_error = NULL` trong **một giao dịch**, giao dịch tự hủy nếu số dòng đổi khác `--expect`.
- Đầu ra và journal (`ottimo-deploy`) chỉ có số. Không in địa chỉ, id, payload hay nguyên văn lỗi DB.
- Dòng được xếp lại giữ `created_at` cũ. Trong vài phút sau `--apply`, `ops-check email_changes` có thể `FAIL … oldest waiting staff e-mail … min old` cho tới khi worker gửi xong (10 thư/phút/cơ sở). Đó là dự kiến, không làm mục F của runbook: chạy lại sau 3 phút, phải `ok` (ARC PR32-05).
- Test: `infra/server/test/requeue-email-changed.test.sh` (47 kiểm; 49 khi có `flock`, gồm ca khóa deploy; các ca "thiếu `flock` trên production → từ chối" và "tệp mốc staging → từ chối stub" chạy ở mọi máy). Đã chạy thật trên Postgres 17 tạm: 2 dòng trong 7 ngày được xếp lại, dòng 8 ngày, dòng mẫu khác, dòng `NO_RECIPIENT` và dòng topic khác giữ nguyên; `--expect` sai thì giao dịch hủy.
