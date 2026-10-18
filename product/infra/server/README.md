# Dựng staging (và sau này production) trên VPS – OTTIMO Desk

- Người viết: OPS | Round 2 – Sprint 3 | Ngày: 16/10/2026
- Dùng khi: chủ đầu tư (INV) đã thuê VPS Ubuntu LTS tại Việt Nam (ESC-002 A, gói H-B) và có tên miền.
- Căn cứ: `product/docs/hosting-plan.md` (mục 5–8, 10), SEC `s3-checklist.md` (C2, C6, G4, G5, H3), `security-requirements.md` (SR-HDR, SR-LOG, SR-BAK, SR-KEY-10), ARC `s3-contract.md` 4.2-7.
- Đã diễn tập đủ quy trình trên máy local (container Ubuntu 24.04 đóng vai VPS, image thật, tên `*.localhost`): `rounds/round-02/outputs/OPS/s3-report.md` mục 3.

## 0. INV cần đưa gì (không cần đưa mật khẩu nào)

| Thứ | Ai làm | Ghi chú |
|---|---|---|
| IP của VPS (Ubuntu 22.04 hoặc 24.04, 2 vCPU / 4 GB, ổ ≥ 40 GB) | INV | Tắt snapshot/backup tự động của hãng, hoặc để ≤ 7 ngày (SR-BAK-03) |
| Khóa SSH công khai của OPS được thêm vào `root` lúc tạo VPS | INV dán vào bảng điều khiển của hãng | OPS gửi tệp `.pub`. Không gửi mật khẩu root qua chat |
| Tên miền + các bản ghi DNS | INV dán theo `hosting-plan.md` mục 10 | Không cần đưa mật khẩu nhà đăng ký |
| Repo GitHub: bật biến `PUBLISH_IMAGES=true` | INV (chủ repo) hoặc OPS nếu có quyền | Image nằm ở GHCR riêng tư của repo |
| Repo GitHub: biến `VITE_DESK_PHONE` = số lễ tân công khai (chỉ chữ số và dấu cách, ví dụ dạng `0xx xxxx xxxx`) | INV (chủ repo) hoặc OPS nếu có quyền | Là **biến** (Variables), không phải secret. Số này được gắn vào image web lúc build (nút "Gọi lễ tân" của PWA, trang link hết hạn của web khách). Thiếu hoặc sai dạng thì job `publish-images` dừng ngay (UXR P-15). Đổi số = build image mới |
| Token GitHub chỉ có quyền `read:packages` | INV tạo, tự dán vào VPS ở bước 5 | Không dán vào chat, không vào repo |
| Một hộp thư nhóm cho Let's Encrypt (`ACME_EMAIL`) | INV | Nhận cảnh báo hết hạn chứng chỉ |

## 1. Thứ tự các bước (khoảng 30–45 phút)

```
DNS (INV) → 2. chép bundle → 3. bootstrap-vps.sh → 4. .env + init-secrets.sh + khóa age → 5. đăng nhập GHCR
→ 6. deploy.sh <tag> → 7. bật timer sao lưu/kiểm tra → 8. (tùy chọn) deploy tự động từ CI → 9. nạp dữ liệu demo
```

## 2. Chép bundle lên VPS (từ máy OPS, trong `product/`)

```bash
tar -czf /tmp/ottimo-infra.tgz infra tests/fixtures/seed/ds-e.json
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

## 5. Đăng nhập kho image (ottimo@VPS)

```bash
docker login ghcr.io -u <tài khoản GitHub> --password-stdin   # dán token read:packages rồi Ctrl-D
```

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
- Chạy tay: `/opt/ottimo/infra/server/bin/ops-check.sh` hoặc `ops-check.sh j16`.

## 8. Deploy tự động từ CI (tùy chọn, sau khi bước 6 chạy tay thành công)

1. Máy OPS: `ssh-keygen -t ed25519 -f ottimo-ci-deploy -N ''` → chép `ottimo-ci-deploy.pub` lên VPS, chạy lại `bootstrap-vps.sh --ci-key /root/ottimo-ci-deploy.pub` (khóa bị ép chỉ chạy `deploy-from-ci.sh`: chỉ nhận `deploy sha-<hex>`, không mở shell, không chép tệp).
2. GitHub → Settings → Environments → `staging`: secret `STAGING_SSH_KEY` (nội dung khóa riêng `ottimo-ci-deploy`), `STAGING_SSH_KNOWN_HOSTS` (`ssh-keyscan -t ed25519 <IP>` – kiểm vân tay với bảng điều khiển của hãng); biến `STAGING_SSH_HOST=<IP>`; biến repo `STAGING_DEPLOY=true`. Xóa khóa riêng trên máy OPS sau khi dán.
3. Mỗi lần push vào `main` có CI xanh: `publish-images` → `deploy-staging` gọi `deploy.sh` trên VPS.

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
