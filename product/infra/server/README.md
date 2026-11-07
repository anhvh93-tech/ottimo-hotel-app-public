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

**Khóa `--deploy-key` chỉ là đường vào lúc dựng máy lần đầu** (để khỏi tự khóa mình ở ngoài), không phải đường quản trị (SEC FB-R4-SEC-OPS-OR-03). Khóa này vào thẳng `ottimo` (nhóm `docker`, tương đương root) mà không qua `sudo`, nên không để lại nhật ký lệnh. Ngay khi `ottimo-admin` (`--admin-user`) đăng nhập được và `sudo -n -u ottimo true` chạy được, gỡ dòng khóa đó khỏi `/home/ottimo/.ssh/authorized_keys`. Sau đó tệp chỉ còn khóa CI (`command="…/deploy-from-ci.sh",restrict`) và khóa kéo sao lưu (`command="/usr/bin/rrsync -ro …",restrict`). Từ v1.0.5, `ops-check sshkeys` FAIL khi còn dòng khóa nào không phải một trong hai lệnh ép đó kèm `restrict` (chỉ báo số dòng). Chạy lại bootstrap với `--deploy-key` cũng làm khóa người quay lại và `sshkeys` FAIL. Các bước gỡ an toàn: mục 3.1 (cùng lệnh với runbook v1.0.5 W0).

### 3.1 Gỡ khóa `--deploy-key` khỏi `ottimo` (một lần cho cả máy, hai stack dùng chung user)

Chạy từ máy của người quản trị, bằng khóa của `ottimo-admin`. `<host>` là tên máy (ví dụ `desk.ottimo.vn`), `<khoa>` là khóa SSH của `ottimo-admin`. Mỗi bước chỉ in số, mã và 8 ký tự vân tay, không in khóa hay chú thích. Thiếu một dòng "Đúng là" thì **dừng**, không gỡ gì, báo OPS + SEC.

1. Đường quản trị chạy, và sshd đọc đúng tệp khóa:
```bash
ssh -i <khoa> -o BatchMode=yes ottimo-admin@<host> 'cd / && sudo -n true && echo "SUDO ROOT: CO" && sudo -n -u ottimo true && echo "SUDO OTTIMO: CO" && sudo -n sshd -T | grep -E "^(authorizedkeysfile|authorizedkeyscommand|permitrootlogin) "'
```
Đúng là: `SUDO ROOT: CO`, `SUDO OTTIMO: CO`, `authorizedkeysfile .ssh/authorized_keys .ssh/authorized_keys2`, `authorizedkeyscommand none`. Hai dòng `authorizedkeys…` khác thế thì dừng: cả bước này lẫn `ops-check sshkeys` đang đọc nhầm tệp. `permitrootlogin` nên là `no` (bootstrap với `--admin-user`); khác thì ghi lại, báo SEC, vẫn gỡ được.

2. Đếm dòng, lấy 8 ký tự vân tay của dòng khóa người:
```bash
ssh -i <khoa> -o BatchMode=yes ottimo-admin@<host> 'cd / && F=/home/ottimo/.ssh/authorized_keys && sudo -n test ! -e /home/ottimo/.ssh/authorized_keys2 && echo "KEYS2: KHONG" ; echo "TONG: $(sudo -n grep -cvE "^[[:space:]]*(#|$)" $F)" && echo "CI: $(sudo -n grep -c "deploy-from-ci.sh\",restrict " $F)" && echo "PULL: $(sudo -n grep -c "rrsync -ro /var/backups/[a-z-]*\",restrict " $F)" && echo "NGUOI: $(sudo -n grep -cvE "^[[:space:]]*(#|$|command=)" $F)" && sudo -n grep -vE "^[[:space:]]*(#|$|command=)" $F | ssh-keygen -lf - | awk "{ print \"FP8: \" substr(\$2, 8, 8) }"'
```
Đúng là: `KEYS2: KHONG`; `NGUOI: 1`; `TONG = CI + PULL + 1`; một dòng `FP8:`, so với vân tay của khóa đã dùng lúc bootstrap.

3. Gỡ dòng đó. Root chỉ chép bản cũ sang `/root`; việc lọc và thay tệp chạy **bằng chính user `ottimo`** (không có `chown`, root không ghi theo đường dẫn trong thư mục của user khác – SEC FB-R5-SEC-OPS-95-04). `mv` trong cùng thư mục là nguyên tử:
```bash
ssh -i <khoa> -o BatchMode=yes ottimo-admin@<host> 'cd / && set -e && F=/home/ottimo/.ssh/authorized_keys && K=/root/ottimo-authorized_keys.before-$(date +%Y%m%d-%H%M%S) && sudo -n cp -p $F $K && sudo -n chmod 0600 $K && sudo -n -u ottimo sh -c "umask 077; grep -E \"^[[:space:]]*(#|$|command=)\" $F > $F.new && mv $F.new $F" && echo "BAN CU GIU O: $K" && echo "TONG SAU: $(sudo -n grep -cvE "^[[:space:]]*(#|$)" $F)" && sudo -n stat -c "%U:%G %a" $F'
```
Đúng là: `BAN CU GIU O: /root/ottimo-authorized_keys.before-…`, `TONG SAU` = `TONG` − 1, `ottimo:ottimo 600`.

4. Kiểm: `ssh -i <khóa vừa gỡ> -o BatchMode=yes ottimo@<host> true` ra `Permission denied (publickey)`; `sudo -n -u ottimo true` qua `ottimo-admin` vẫn chạy; `CI` và `PULL` đếm lại như bước 2 không đổi; lượt deploy CI và lượt `pull-backups.sh` kế tiếp đều đạt; `ops-check sshkeys` ok.

5. Lùi (chỉ khi CI deploy hoặc kéo sao lưu hỏng vì bước 3): `ssh … 'cd / && sudo -n cat <BAN CU GIU O> | sudo -n -u ottimo sh -c "umask 077; cat > /home/ottimo/.ssh/authorized_keys.new && mv /home/ottimo/.ssh/authorized_keys.new /home/ottimo/.ssh/authorized_keys"'`, báo SEC. `sshkeys` FAIL lại, đúng ý.

6. Xóa bản cũ ở `/root` khi lượt deploy CI và lượt kéo sao lưu kế tiếp đều đạt, chậm nhất 7 ngày sau bước 3 (tệp chỉ có khóa công khai): `sudo -n rm -f /root/ottimo-authorized_keys.before-*`. Đây là bước xóa tệp trên máy chủ: cần INV đồng ý như mọi bước khác.

## 4. Cấu hình, bí mật, khóa sao lưu

```bash
# 4.1 Cấu hình KHÔNG bí mật (ottimo@VPS)
nano /opt/ottimo/.env        # điền DESK_HOST, STAFF_HOST, GUEST_HOST, ACME_EMAIL, API_IMAGE, WEB_IMAGE (mẫu: infra/server/env.example)

# 4.2 Bí mật – sinh ngẫu nhiên tại chỗ, không ai gõ hay nhìn thấy (root@VPS)
/opt/ottimo/infra/server/bin/init-secrets.sh
#   → /opt/ottimo/secrets/* (0400, chủ là uid của container đọc nó; thư mục 0710 root:ottimo)
#   production: chép data_kek_current VÀ id_hash_key ra bản NGOẠI TUYẾN do INV giữ ngay lúc này, cùng một chỗ,
#   khác phong bì với khóa riêng age (hosting-plan 8.1, SEC FB-R5-SEC-OPS-95-07). INV tự gõ theo khuôn G4-8
#   (rounds/round-03/outputs/OPS/b2-runbook.md 2.2): in 44 ký tự + 8 ký tự sha256, chép giấy/USB mã hóa, gõ lại
#   bằng read -rs để so vân tay, Cmd+K. Agent không chạy, không xem. Trong chat chỉ nói "đã cất".

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

### 6.1 Thứ tự đổi container (v1.0.4, P4-02, `FB-R4-OPS-ARC-31-01`) – plan v1.0.4 gọi là "README 5.0"

Từ gói `infra/` của v1.0.4, `deploy.sh` không còn một bước `switch` chung:

| Chiều | Thứ tự | Ghi chú |
|---|---|---|
| Deploy (`deploy.sh <tag>`) | `migrate` → **`switch-worker`** (`dc up … worker`) → kiểm worker → **`switch-api`** (`dc up … api web`) → `smoke` | Worker mới đọc được mọi job của api cũ. Worker chết lúc khởi động thì deploy dừng **trước** khi api đổi |
| Quay lui (`rollback.sh` → `deploy.sh --rollback`) | `switch-api` (api + web cũ) → `switch-worker` (worker cũ) | DB không lùi. `--rollback` **không** tự trả về bản mới khi lỗi |
| Lỗi sau khi đã đổi container (`restore_previous`) | api + web bản trước → rồi worker bản trước | api + web bản trước không lên healthy thì worker bản trước **không** được chạy (`WARNING: previous api/web did not come back healthy – worker left as is`) |

- **Kiểm worker** (ARC `FB-R4-ARC-OPS-P402-01`): mọi service có `restart: unless-stopped`, nên worker chết lặp vẫn thường hiện `running` khi lấy mẫu. `deploy.sh` (`worker_ok`) giữ id container ngay sau `up` và so `docker inspect {{.State.Running}} {{.RestartCount}}` sau vài giây và ở `smoke`: phải cùng id, `true`, và `RestartCount` không tăng. `ops-check containers` làm cùng phép so giữa hai lượt timer (13.8).
- Lượt thành công vẫn in đúng **6 dòng `[deploy`**. Tên bước lỗi mới: `step=switch-worker`, `step=switch-api` (runbook v1.0.4 mục 4).
- Kiểm thứ tự trên máy thật (chỉ in giờ): `for s in worker api web; do echo "$s $(docker inspect --format '{{.State.StartedAt}}' "$(…/bin/dc ps -q $s)" | cut -c1-19)"; done`. Deploy: giờ `worker` sớm hơn `api`; quay lui: `api` sớm hơn `worker`.
- Bản compose trên VPS khác bản đã thử thì lần đầu phải đo lại (runbook v1.0.4 S0/P2 in `docker compose version --short`).

## 7. Bật sao lưu + kiểm tra định kỳ (root@VPS, sau lần triển khai đầu)

```bash
systemctl enable --now ottimo-backup.timer ottimo-ops-check.timer
systemctl list-timers 'ottimo-*'
```

- Sao lưu **hai lần mỗi ngày** (từ v1.0.5, V5-62): production 03:00 + 15:00 (`ottimo-backup@ottimo-prod.timer`), staging 03:30 + 15:30 (`ottimo-backup.timer`) giờ VN, lệch ngẫu nhiên ≤ 5 phút, cách nhau đúng 12 giờ, nên mất dữ liệu tối đa 12 giờ khi DB hỏng mà máy còn (chưa có WAL). Mỗi lượt: `pg_dump` + kho tệp mã hóa + `purge_journal`, mã hóa `age` bằng khóa công khai, ở `/var/backups/ottimo-prod` (staging `/var/backups/ottimo`; thư mục 0700, tệp 0600, chủ `ottimo`). Hai lượt chạy cùng một service, nên cùng chủ, cùng quyền, cùng khóa. Vòng xoay tính theo tuổi (giây) của tên tệp, chạy cuối mỗi lượt: giữ mọi bản < 7 ngày (14 bộ), bộ mang ngày Chủ nhật (UTC) < 33 ngày, `purge-journal` < 40 ngày (SR-BAK-06), còn lại xóa. Lấy 33 chứ không 35, vì tệp chỉ bị xóa ở lượt kế tiếp: trễ thêm cả hai lượt liền thì tệp vẫn không quá 35 ngày (SR-BAK-03; test `server/test/backup-schedule.test.sh`). Chọn 15:00 chứ không 14:00: chia đều 12/12, tránh giờ nhận phòng 14:00 và khung phát hành quen thuộc quanh 14:00 (DDL của migration phải chờ khóa của `pg_dump`). Bản sao off-site: từ 07/11/2026 máy chủ **tự đẩy** lên Google Drive công ty (mục 7.1, quyết định INV). Lượt kéo về Mac (`pull-backups.sh`, R3 SR-BAK-04) thành **tùy chọn**, giữ song song 2 tuần sau khi Drive chạy ổn và đã diễn tập từ Drive.
- Mất hẳn VPS (máy, đĩa và bản sao lưu trên đó cùng mất), **khi đã chạy mục 7.1**: dữ liệu còn lại là bản mới nhất trong **"Kho" trên Drive**. Máy chủ đẩy lúc 04:00 và 16:00, một giờ sau mỗi lượt sao lưu; Apps Script chép sang Kho trong giờ kế tiếp. Vì vậy lượng mất tối đa khoảng **14 giờ** (12 giờ giữa hai lượt sao lưu, cộng khoảng 2 giờ đẩy và chép), khi mọi thứ chạy đúng. Ngưỡng báo là 36 giờ (yêu cầu INV): cảnh báo ở mức đó nghĩa là đã lỡ ít nhất hai lượt. Đoạn dưới là mức cũ, khi bản ngoài máy chỉ có trên Mac: dữ liệu còn lại là bản mới nhất **trên Mac**. Với nhịp kéo tay hiện tại (ít nhất 2 ngày một lần, V5-60), lượng mất tối đa khoảng **60 giờ**: 48 giờ giữa hai lần kéo, cộng tối đa 12 giờ tuổi của bản mới nhất lúc kéo. Kéo trễ bao nhiêu giờ thì cộng thêm bấy nhiêu. Ví dụ kéo khoảng 19:00 như ngày 06/11: bản mới nhất là bản 15:00, mất tối đa khoảng 52 giờ. Trước v1.0.5 (một lượt 03:00): tối đa 72 giờ, khoảng 64 giờ nếu kéo khoảng 19:00 (ước tính của SEC ở FB-R5-SEC-BA-05, OPS xác nhận). Khi có lịch kéo tự động hằng ngày (V5-60, chờ INV đồng ý): tối đa khoảng 36 giờ, đúng ngưỡng báo của FB-R4-SEC-OPS-OR-02. Không tính snapshot của nhà cung cấp VPS: phải tắt hoặc giữ ≤ 7 ngày, chờ INV xác nhận (SEC `SEC-on-bug-r4-054.md` B4.2 (a)).
- Kiểm tra 30 phút/lần (`ops-check.sh`): **J16 không chạy trong 26 giờ** (hoặc có lượt `failed`) cho từng cơ sở (SEC C6, SR-RET-03), sao lưu thành công gần nhất ≥ 14 giờ (`BACKUP_MAX_HOURS`, từ v1.0.5; trước đó 26 giờ – lỡ một lượt là FAIL trong khoảng 2 giờ), đĩa ≥ 80 %, chứng chỉ < 14 ngày, container dừng, số 5xx, thư nhân viên chết `NO_RECIPIENT` (`email_dead`), số OWN/MGR chưa có email (`email_missing`, từ v1.0.3), số lần đổi email trong 24 giờ và tuổi hàng đợi thư bảo mật (`email_changes`, từ v1.0.3, luôn cảnh báo), số địa chỉ không khớp luật ASCII của API (`email_ascii`, chỉ báo số). Cảnh báo: `journalctl -t ottimo-alert -p warning` (FAIL ghi ở mức `err`, WARN ở mức `warning`; đọc `-p err` thì không thấy WARN, mà staging không có webhook – SEC FB-R5-SEC-OPS-93-01), `systemctl --failed`, và webhook nếu đặt `ALERT_WEBHOOK_URL` trong `.env` (gửi khi đổi trạng thái, khi một WARN/FAIL đang sáng có thêm hoặc bớt nguyên nhân (`journal`), và nhắc mỗi 6 giờ với FAIL; không có dữ liệu cá nhân).
- `email_dead` (BUG-R3-032, SEC `SEC-on-B2-readiness.md` 1.5): đếm thư nhân viên (`staff.email` – thư "Security notice") chết vì `NO_RECIPIENT` trong 24 giờ, chỉ đếm, không đọc nội dung. Hiện chỉ báo số, không cảnh báo. Chỉ bật khi đủ **4 điều kiện** ở mục 13.8 (v1.0.3 chạy production; `email_missing` = 0; INV báo đã nhận thư; `email_dead` 24 giờ = 0). Cách bật: thêm `EMAIL_NO_RECIPIENT_ALERT=1` vào `.env` của stack (lệnh ở 13.8), khi đó mỗi thư như vậy là `FAIL`, và `email_missing` > 0 cũng là `FAIL`. Bật sớm thì `email_dead` FAIL kéo dài và nhắc lại mỗi 6 giờ (cảnh báo giả).
- Chạy tay: `/opt/ottimo/infra/server/bin/ops-check.sh` hoặc `ops-check.sh j16`. Qua SSH `ottimo-admin` thì `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh`. Từ 30/10, `ops-check.sh` và `bin/dc` tự chạy được từ thư mục bất kỳ (trước đó chạy trong home của `ottimo-admin` thì `docker compose` lỗi `stat .: permission denied`, ra cảnh báo giả "containers FAIL"). `docker compose` lỗi thì `containers`/`http5xx` báo `docker compose failed, container state unknown: <loại lỗi>`, không báo "not running"; không gửi nguyên văn lỗi đi (lỗi đọc `.env` có thể chứa một dòng `.env`). Test: `infra/server/test/ops-check-cwd.test.sh`.
- Từ LP-v2 (R4, SEC SR-PE-16 / C9, ARC L9), thêm 3 mục. Mỗi cảnh báo chỉ gửi một câu cố định kèm số đếm, không gửi nguyên văn log (không đường dẫn, slug, IP, mã căn).
  - `pricelimit`: số lần route giá trên landing (`GET /v1/public/properties/<slug>/price-estimate`) trả 429 + 503 trong 60 phút ≥ `PRICE_REFUSED_MAX` (mặc định 200). Nghĩa là có người quét hoặc dội, khách thật có thể không thấy giá; form vẫn gửi được. Đếm từ log Caddy của landing (query đã che). Chỉ chạy khi stack có landing.
  - `pricegap`: hai phần độc lập, một trong hai > 0 là FAIL. (1) Log: api ghi `public_price_missing` trong 24 giờ, tức có căn thiếu giá niêm yết một đêm nên bị bỏ khỏi giá ước tính trên web. (2) Kiểm tĩnh (từ v1.0.5, V5-73, SEC FB-R4-SEC-OPS-S6D-01): đếm READ ONLY bằng `ottimo_readonly` số căn đang bán, có nhãn hạng web, bắt đầu trong 365 ngày tới và chưa ngừng, mà không có dòng giá nào hiệu lực từ ngày đầu căn được bán tính từ hôm nay (theo múi giờ của cơ sở). Phần (2) bắt được khe giá cả khi chưa có khách nào hỏi đúng hạng, đúng ngày, và vẫn đúng sau khi container dựng lại (log mất). Truy vấn chỉ trả một số đếm, không chọn id. Cảnh báo chỉ nêu số căn. Lỗi truy vấn hoặc câu trả lời lạ là FAIL riêng, không coi là 0. Khe giá thường do dữ liệu khởi tạo hoặc sửa thẳng DB: OWN nhập giá cho căn đó trên Desk, OPS tìm nguồn.
  - `priceswitch`: công tắc `public_show_prices` bị đổi kể từ lượt kiểm trước (audit `config.changed`). Theo dõi bằng **id audit cuối đã báo** (`state/ops-check/priceswitch.last_id`), không theo cửa sổ thời gian, nên timer trễ hay máy khởi động lại cũng không sót (SEC FB-R4-SEC-OPS-LPV2-04). **Mỗi lượt có thay đổi mới gửi một webhook riêng** (không áp dụng khử trùng 6 giờ), nêu số lần đổi và giá trị mới nhất (`true`/`false`/`other`) để OPS/INV xác nhận việc đổi là chủ ý. Lần chạy đầu chỉ lấy mốc, không báo. Không xóa tay tệp mốc: mất tệp thì lượt sau coi như lần đầu (lấy mốc mới, không báo các thay đổi trước đó).
  - `http5xx` không đếm 503 của route giá: bulkhead của route này trả 503 khi bận, đó là thiết kế. 502/500 của route giá vẫn được đếm.
  - Test: `infra/server/test/ops-check-price.test.sh`.
- Từ v1.0.5 (V5-65, SEC FB-R4-SEC-OPS-OR-03, FB-R5-SEC-OPS-93-02), `sshkeys`: mọi dòng khóa trong `authorized_keys` (và `authorized_keys2`, sshd cũng đọc) của `ottimo` phải là **một trong hai lệnh ép đã biết** kèm `restrict`: `command="/opt/<stack>/infra/server/bin/deploy-from-ci.sh"` hoặc `command="/usr/bin/rrsync -ro /var/backups/<stack>"`, với `<stack>` là `ottimo` hoặc `ottimo-prod`. FAIL khi: thiếu `command=` hoặc `restrict`; lệnh ép khác hai lệnh đó (ví dụ `/bin/bash`); có tùy chọn mở lại thứ `restrict` vừa tắt (`pty`, `port-forwarding`, `agent-forwarding`, `X11-forwarding`, `user-rc`); `authorized_keys` hoặc `.ssh` ghi được bởi nhóm hay người khác. Tin chỉ nêu số dòng vi phạm, không in khóa, vân tay, lệnh hay chú thích. Không đọc được `authorized_keys` cũng là FAIL. Việc cần làm khi FAIL: mục 3.1. Test: `infra/ci/test-ops-check.sh`.
- Từ v1.0.5 (V5-63, ARC 0.3.13 1.15, SEC FB-R5-SEC-ARC-07), log container nằm trong **journal của máy chủ** (driver Docker `journald`, `server/journald/50-ottimo.conf`): giữ qua mọi lần dựng lại container, trần cứng 90 ngày (`MaxRetentionSec=90day`, `MaxFileSec=1day`), trần dung lượng `SystemMaxUse=4G` (số đầu; OPS đo `journalctl --disk-usage` sau 7 ngày, đặt ≥ 3 lần lượng 90 ngày, ghi vào `hosting-plan.md` mục 7), không chép sang `/var/log/syslog`. Đọc qua nhiều lần deploy: `sudo journalctl CONTAINER_TAG=ottimo-prod-api-1 --since …`. **Từ v1.0.5, `/var/log/auth.log` và `/var/log/syslog` không ghi nữa** (`ForwardToSyslog=no`: rsyslog không nhận dòng mới). Tệp cũ dừng ở giờ W6, đó không phải mất log. Nhật ký SSH đọc bằng `sudo journalctl -u ssh --since …`, nhật ký `sudo` bằng `sudo journalctl _COMM=sudo --since …`; cả hai giữ 90 ngày như log container (ARC FB-R5-ARC-OPS-06, SEC FB-R5-SEC-OPS-93-04). Postgres chạy `log_error_verbosity=terse` (SEC ARC-08: phần DETAIL chứa giá trị của dòng dữ liệu), và ghim `log_statement=none`, `log_min_duration_statement=-1`, `log_parameter_max_length=0`, `log_parameter_max_length_on_error=0` trên dòng lệnh (SEC FB-R5-SEC-OPS-93-03: không câu SQL, không giá trị bind nào của khách vào log 90 ngày; tham số dòng lệnh thắng `postgresql.conf` và `ALTER SYSTEM`). Đổi danh sách `command` của postgres = SEC review; test `server/test/postgres-log-terse.test.sh` đọc lại cả năm giá trị. Mục `journal`:
  - FAIL khi có container của stack không ghi ra journald, khi không đọc được journal, khi bản ghi cũ nhất > 91 ngày, khi `/var/log/journal` không phải `root:systemd-journal` hoặc có tệp ai cũng đọc được, khi ACL của `/var/log/journal` (kể cả ACL mặc định) có tên người dùng hoặc nhóm ngoài `adm`/`wheel`/`systemd-journal` (cần `getfacl`, gói `acl`; không có thì bỏ qua phần này), khi nhóm `adm`/`systemd-journal` có thành viên ngoài `LOG_READER_USERS` (`.env`, mặc định `syslog ottimo-admin`), nhóm `sudo`/`wheel` (nếu có) có thành viên ngoài `SUDO_USERS` (`.env`, mặc định `ottimo-admin`: `sudo` đọc được mọi thứ), hoặc nhóm `docker` có ai khác `ottimo`. Thành viên tính cả người có nhóm đó là nhóm chính. Tin chỉ có số, không in tên. Máy mới từ ảnh của nhà cung cấp hay có sẵn user mặc định (ví dụ `ubuntu`) trong `sudo`/`adm`: gỡ user đó, hoặc thêm vào danh sách khi SEC đồng ý.
  - **WARN** (báo một lần, lượt kiểm vẫn đạt) khi journal xoay **sớm**: bản ghi cũ nhất trẻ hơn min(90, số ngày từ `state/journald_since`) − 1 ngày, tức chạm `SystemMaxUse` hoặc bị dội log; xem nguyên nhân rồi ghi lại ngày vào `state/journald_since`. WARN cả khi journald ghi `Suppressed N messages` trong 24 giờ (chạm `RateLimitBurst`, dòng log bị bỏ). Tệp trạng thái giữ kèm một khóa lý do cố định, không số (`rotated`, `suppressed`, `since_missing`, `containers`, `group-adm`…). Tập lý do đổi thì gửi lại webhook, nên một nguyên nhân mới (ví dụ dội log lúc "rotated early" đang sáng) không bị che (SEC FB-R5-SEC-OPS-93-01). Chỉ đổi con số thì không gửi lại.
  - Đọc journal cần nhóm `systemd-journal`: unit ops-check có `SupplementaryGroups=systemd-journal`, user `ottimo` **không** vào nhóm đó. Chạy tay `sudo -u ottimo ops-check.sh` thì `journal` FAIL "journal unreadable"; chạy tay đủ mục bằng `cd / && sudo systemd-run --quiet --wait --pipe --uid=ottimo --gid=ottimo -p SupplementaryGroups=systemd-journal -E OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/ops-check.sh`. Test: `infra/server/test/ops-check-journal.test.sh`.

### 7.1 Bản sao ngoài máy trên Google Drive công ty (INV 07/11/2026)

Thay cho bản trên Mac. Không cài trong PR này: **lượt cài là việc riêng**, cần INV đồng ý trong chat, và INV đã làm xong phần A, B của `product/docs/huong-dan-inv-sao-luu-google-drive.md`. Đích: thư mục **"OTTIMO App/Sao lưu"** trong **"Drive của tôi"** của tài khoản Workspace công ty mà INV đã chỉ định. Không dùng Shared Drive. Repo không ghi địa chỉ hay tên đăng nhập nào; ID thư mục chỉ nằm trong `.env` của máy chủ và trong Apps Script.

**Thiết kế: máy chủ chỉ thêm được, không xóa được bản cũ.**

| Thành phần | Chạy ở đâu, bằng gì | Quyền | Việc |
|---|---|---|---|
| `bin/push-backups-drive.sh` | Máy chủ, user `ottimo`, timer `ottimo-offsite@ottimo-prod` 04:00 + 16:00 (1 giờ sau `backup.sh`) | Token OAuth của tài khoản công ty, **chỉ `drive.file`**: chỉ thấy tệp và thư mục do chính ứng dụng `ottimo-server-upload` tạo | Đẩy các cặp `*.age` + `.sha256` < 6 ngày chưa đẩy vào thư mục **"Nhận"** của nó, `rclone copy --immutable`. Không bao giờ chạy lệnh xóa, chuyển, `sync`, `purge` (test 6a/6b) |
| `infra/drive/apps-script/Code.gs` | Trong Google (Apps Script), cùng tài khoản công ty, **ứng dụng khác** | Drive đầy đủ của tài khoản | Mỗi giờ: kiểm tên, mốc giờ, SHA-256 (Google tính) bằng `.sha256`, **chép** cặp sang **"Kho"**, kiểm bản chép, xóa bản gốc trong "Nhận". 09:00 mỗi ngày: vòng đời Kho đúng luật `backup.sh`, kiểm bản mới nhất < 36 giờ. Thứ Hai: email tóm tắt |
| Kho | "OTTIMO App/Sao lưu/Kho" | Bản trong Kho do Apps Script tạo, nên token `drive.file` của máy chủ **không thấy** | Kiểm khi cài: `push-backups-drive.sh --check --vault-folder <ID Kho>` phải báo "Kho is invisible to the server" |

- **Kẻ chiếm máy chủ làm được gì:** xóa hoặc sửa tệp **còn chờ** trong "Nhận" (thường < 1 giờ, > 6 giờ thì báo), gửi tệp rác (tốn dung lượng, Apps Script từ chối và báo), ngừng gửi (36 giờ thì báo). **Không** xóa, sửa hay đọc được bản trong Kho. Token không xin thêm quyền được: `offsite-authorize.sh` và `--check` từ chối mọi phạm vi rộng hơn `drive.file`.
- **Rủi ro còn lại (ghi rõ):** (1) Ai có tài khoản công ty, hoặc người được chia sẻ "OTTIMO App", xóa được Kho. Vì vậy không chia sẻ "Sao lưu"; tài khoản bật 2 bước. Thùng rác chỉ giữ thêm 30 ngày bản xóa bằng tay. (2) Tài khoản công ty bị khóa hoặc đổi thì cả việc gửi lẫn Apps Script dừng: `ops-check offsite` báo trên máy chủ, Apps Script báo nếu còn chạy. (3) Bản trong Kho nằm trên Google, ngoài Việt Nam, và đã mã hóa sẵn. INV quyết không làm hồ sơ chuyển dữ liệu ra nước ngoài (07/11/2026). Khóa giải mã không bao giờ để trên Drive (hướng dẫn INV phần F). (4) Dung lượng Drive của tài khoản: dung lượng một bộ × khoảng 18 bộ (14 bộ 7 ngày + bộ Chủ nhật); OPS đo sau tuần đầu.
- **Vòng đời 35 ngày** do Apps Script làm, không phải máy chủ: giữ mọi tệp < 7 ngày, bộ ngày Chủ nhật (UTC) < 33 ngày, `purge-journal` < 40 ngày. Xóa vĩnh viễn (`Drive.Files.remove`), không qua thùng rác, chạy mỗi ngày, nên không tệp nào quá 35 ngày (`purge-journal` 40 ngày, chỉ id). Ngoại lệ: **bộ đầy đủ mới nhất** không bao giờ bị xóa. Khi bộ đó đã quá hạn (máy chủ ngừng gửi), Apps Script giữ lại và báo `vault-kept-old`. Tệp tên lạ trong Kho chỉ báo, không xóa. Test: `infra/drive/test/backup-mover.test.mjs` (45 ngày chạy, không tệp nào quá 35 ngày).
- **Cảnh báo:**
  - Máy chủ: `ops-check offsite` qua kênh hiện có (journal `ottimo-alert`, webhook phòng "OTTIMO – Báo động", Healthchecks). FAIL khi chưa đẩy lần nào; lượt đẩy cuối lỗi (chỉ tên loại lỗi cố định); lượt đẩy thành công cuối ≥ 36 giờ (`OFFSITE_MAX_HOURS`); bản DB mới nhất Apps Script đã lấy khỏi "Nhận" ≥ 36 giờ; có tệp chờ > 6 giờ trong "Nhận" (Apps Script ngừng). Mục này chỉ đọc tệp trạng thái `state/offsite/*`, không gọi Drive.
  - Apps Script: email (và webhook Chat nếu INV dán `ALERT_WEBHOOK_URL`) khi Kho không có bản DB mới trong 36 giờ. Đường này vẫn chạy khi máy chủ đã mất.
- **Token**: `offsite-authorize.sh` (INV gõ, luồng thiết bị của Google: mã ngắn, cho phép trên điện thoại, không cần Mac) ghi `/etc/ottimo-offsite/ottimo-prod/drive-oauth.json`, chủ `ottimo`, `0400`, thư mục `root:ottimo 0750` (bootstrap tạo sẵn). Tệp nằm ngoài `/opt` và `/var/backups`, nên không vào bộ sao lưu hay gói bundle. `push-backups-drive.sh` từ chối tệp sai quyền, sai chủ, là symlink, nằm trong thư mục dự án/sao lưu, hoặc thư mục cha ghi được bởi người khác. `rclone.conf` chỉ là tệp tạm `0600` trong `PrivateTmp` của mỗi lượt. Snapshot đĩa của nhà cung cấp VPS có chứa `/etc`: giữ quy tắc tắt hoặc ≤ 7 ngày (mục 7).
- **rclone** ghim `v1.75.2`, tải zip và so SHA-256 ghi sẵn trong `bin/install-rclone.sh` (đọc 07/11 từ `SHA256SUMS` của rclone và digest của GitHub release, hai nguồn khớp). Không cài bằng apt/snap, không chạy script cài từ internet.

**Lượt cài (riêng, cần INV đồng ý; INV đã xong phần A, B):**

```bash
# root@VPS (ORC)
/opt/ottimo-prod/infra/server/bin/install-rclone.sh
# INV gõ (hướng dẫn phần D) – ORC không xem màn hình bước này
sudo /opt/ottimo-prod/infra/server/bin/offsite-authorize.sh
# ottimo@VPS (ORC): thư mục riêng của máy chủ, in ID → .env
cd / && sudo -u ottimo env OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/push-backups-drive.sh --init
#   .env: OFFSITE_DRIVE_TOKEN_FILE=/etc/ottimo-offsite/ottimo-prod/drive-oauth.json, OFFSITE_DRIVE_INBOX_FOLDER_ID=<ID>
#   INV kéo thư mục vào "OTTIMO App/Sao lưu", đổi tên "Nhận" (phần D bước 8)
cd / && sudo -u ottimo env OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/push-backups-drive.sh --check --vault-folder <ID Kho>
# INV: phần E (Apps Script setup + checkNow). Rồi bật timer và chạy một lượt tay:
systemctl enable --now ottimo-offsite@ottimo-prod.timer
systemctl start ottimo-offsite@ottimo-prod.service && journalctl -u ottimo-offsite@ottimo-prod -n 5 --no-pager
# sau ≤ 1 giờ (Apps Script chép sang Kho), lượt tay thứ hai rồi:
cd / && sudo systemd-run --quiet --wait --pipe --uid=ottimo --gid=ottimo -p SupplementaryGroups=systemd-journal -E OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/ops-check.sh offsite
```

Đạt khi: `--check` báo `OK`, cả ba dòng ok (`drive.file only`, Nhận ghi được, Kho không thấy); `ops-check offsite` ok; INV nhận email thử của Apps Script. Mã thoát của `push-backups-drive.sh`: 0 ổn hoặc chưa cấu hình · 1 đẩy/kiểm lỗi (`state/offsite/last_fail` có loại lỗi) · 2 cấu hình, tệp token, phiên bản rclone. Thu hồi khi nghi bị chiếm: hướng dẫn INV phần H, rồi `systemctl disable --now ottimo-offsite@ottimo-prod.timer`. Test: `server/test/offsite-drive.test.sh`.

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

Trên một máy **không phải VPS đang chạy** (khóa riêng `age` không bao giờ lên máy đã tạo bản sao lưu, SR-BAK-02). Từ 07/11/2026 không còn Mac: máy diễn tập là một **VPS dùng một lần** (ESC-052), có Docker + age + `rclone` (`bin/install-rclone.sh`). Lấy bộ sao lưu **từ "Kho" trên Drive** (hướng dẫn INV phần G, INV gõ, qua đường hầm SSH):
```bash
# trên máy diễn tập, phiên SSH của INV mở bằng: ssh -L 53682:127.0.0.1:53682 <admin>@<máy diễn tập>
infra/server/bin/fetch-backups-drive.sh --vault-folder <ID Kho> --to ./backups     # bộ đầy đủ mới nhất, so .sha256, rồi thu hồi quyền chỉ xem
infra/server/bin/restore-drill.sh --identity <tệp khóa age INV đặt tạm, 0600> --from ./backups \
  --api-image ghcr.io/<owner>/ottimo-api:<tag đang chạy>
# xong: INV xóa tệp khóa; hủy VPS dùng một lần (đĩa đi cùng)
```
Bộ đã tải vẫn là tệp mã hóa. Khóa riêng `age` do INV đặt tạm và xóa sau buổi, như mục 0 của `product/docs/runbook-vps-moi.md`. Lấy từ Mac (`--from ~/.ottimo/backups/ottimo-prod`) vẫn được trong 2 tuần chạy song song.
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

### 11.1 Đổi vai nhân viên: chỉ trên Desk; sửa bằng SQL thì phải tăng `roles_version` và thu hồi phiên

Nguồn: SEC `rounds/round-05/reviews/SEC-on-be-pr-100-d1.md` mục 1.1 và 7; sổ vận hành bản 1.6 (`product/docs/so-van-hanh.md` mục 1.5, BA).

- **Đổi vai làm trên Desk:** Người dùng & vai → Sửa vai (`setRoles`, `identity/internal/users.service.ts`). Trong **một** giao dịch, `setRoles`:
  - sửa `user_property_role`;
  - tăng `app_user.roles_version` (và `version`);
  - thu hồi mọi phiên của người đó (`user_session.revoked_at`, lý do `role_changed`);
  - xóa lượt đăng nhập 2 bước đang dở (`mfa_login_challenge`);
  - ghi `audit_event` loại `security` (`user.roles_changed`).
- **Không runbook nào sửa `user_property_role` bằng SQL tay.** Sự cố buộc phải làm (ví dụ không còn OWN nào vào được Desk) thì đó là **script một lần**: ARC + SEC review, INV đồng ý riêng trong chat, chạy trong **một giao dịch**, làm đủ như `setRoles`:
  1. sửa dòng `user_property_role`:
     - thu hồi vai là đặt `revoked_at`, không `DELETE`;
     - **cấp vai** làm như `setRoles` (ARC FB-R5-ARC-OPS-129-02): `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_by, granted_at) VALUES (…, now()) ON CONFLICT (user_id, property_id, role) DO UPDATE SET revoked_at = NULL, granted_by = EXCLUDED.granted_by, granted_at = EXCLUDED.granted_at`;
     - `granted_by` là người duyệt lần sửa (OWN đã đồng ý), không để trống. Lần sửa ngoài app không có dòng audit, nên đây là dấu vết duy nhất trên dòng vai cho biết ai cấp;
     - `granted_at = now()`, kể cả khi cấp lại trên dòng cũ. Để `granted_at` cũ hay rỗng thì câu đọc "vai lúc tạo" (`granted_at ≤ created_at`, ví dụ runbook v1.0.5 K13) ra sai hoặc ra `none`;
  2. `UPDATE app_user SET roles_version = roles_version + 1, version = version + 1, updated_at = now() WHERE id = $1`;
  3. `UPDATE user_session SET revoked_at = now(), revoked_reason = 'role_changed' WHERE user_id = $1 AND revoked_at IS NULL`, rồi `DELETE FROM mfa_login_challenge WHERE user_id = $1`;
  4. ghi vào decision-log: lý do, mã sự cố, người chạy, giờ UTC, và **vai trước, vai sau** của người đó. Chỉ ghi tên vai, không ghi dữ liệu khác của người đó (ARC 129-02).
     - Lần sửa này không qua app, nên Nhật ký bảo mật trên Desk không tự có dòng. Người đọc nhật ký trên Desk sẽ không thấy lần đổi vai (SEC FB-R5-SEC-OPS-129-02).
     - Vì vậy script nên ghi thêm, trong cùng giao dịch, một dòng `audit_event` loại `security`, hành động `user.roles_changed`: before/after là danh sách vai, `reason` có mã sự cố.
     - Chỉ ghi dòng đó khi ARC xác nhận, trong lần review script, rằng bảng cho phép ghi như vậy. `audit_event` chia phân vùng theo tháng, và `ottimo_app` chỉ có `SELECT, INSERT` trên bảng này (migration 0001). ARC xác nhận không được thì giữ decision-log như trên.
- **Vai DB chạy script và cách mở giao dịch:** ARC + SEC chốt trong lần review của chính script đó. README không đặt sẵn (SEC 129-02).
- **Vì sao:** `AuthGuard` lưu vai và cờ bắt buộc 2 bước theo khóa `user_id:roles_version`, sống `roleCacheMs` (mặc định 60 giây).
  - Thiếu bước 2: mỗi tiến trình api còn dùng vai cũ tới khoảng 60 giây. Vai vừa bị bỏ vẫn mở được màn của vai đó; FDL vừa được cấp chưa bị buộc bật 2 bước.
  - Thiếu bước 3: phiên đang mở sống tiếp, người đó không phải đăng nhập lại. Phiên hạn chế "chỉ được bật 2 bước" chỉ được ghi lúc đăng nhập.
- Cùng luật cho mọi đường đổi quyền khác ngoài app, ví dụ nạp lại dữ liệu demo DS-E trên staging khi DB đang có phiên: thu hồi phiên và tăng `roles_version` của người bị đổi.

## 12. Production trên cùng VPS + edge + landing (R3 v1.0)

Thiết kế, lý do, DNS, RAM, kiểm thử: `rounds/round-03/outputs/OPS/v1-production.md`. Việc của INV: `rounds/round-03/outputs/OPS/inv-production-steps.md`.

| Việc | Lệnh |
|---|---|
| Chuẩn bị stack production (root) | `bash …/bootstrap-vps.sh --env production --ci-key <prod-ci.pub> --backup-pull-key <pull.pub> --admin-user ottimo-admin` → `/opt/ottimo-prod` (tệp mốc `.ottimo-home`), `.env` từ `env.production.example` |
| Cập nhật bundle staging (cùng bundle) | `bash …/bootstrap-vps.sh --env staging --admin-user ottimo-admin` |
| Bí mật (root, mỗi stack) | `sudo /opt/ottimo-prod/infra/server/bin/init-secrets.sh` (staging: chạy lại để thêm VAPID / form / landing_access) |
| Chuyển staging ra sau edge + bật edge | staging `.env`: `EDGE_MODE=edge`, `EDGE_NAME=staging`, `PROXY_PROTOCOL_ALLOW=172.31.1.2/32`, `LANDING_*`; rồi **bằng root** `sudo /opt/ottimo-edge/infra/server/bin/edge.sh up` (staging gián đoạn vài giây). `/opt/ottimo-edge` là `root:root 0755`: user `ottimo` không ghi được `nginx.conf` (chú thích đầu `edge.sh` ghi "root hoặc deploy user" là chưa đúng – sửa ở v1.0.5) |
| Đổi tên miền của một stack | sửa `.env` của stack → `sudo …/edge.sh up` (dựng lại edge ≈ 1–2 s cho mọi site). Host **mới**: dựng lại container Caddy giữ host đó ngay sau (12.3 "Staging landing lần đầu", bước 4) |
| Deploy app production | qua CI `release.yml` (tag `v*`, INV duyệt); tay: `/opt/ottimo-prod/infra/server/bin/deploy.sh sha-… --api-digest sha256:… --web-digest sha256:…` |
| Landing | CI (`landing sha-…`); tay: `…/bin/deploy-landing.sh sha-… [--digest sha256:…]`; chỉ kiểm, không đổi gì: thêm `--check-only` (mục 12.3); quay lui `deploy-landing.sh --rollback`. Mật khẩu xem trước (staging): `sudo cat /opt/ottimo/secrets/landing_preview_password` (`root 0400`: chạy `deploy-landing.sh` bằng `ottimo` thì bước smoke bỏ qua kiểm CSP/HSTS của trang thật trên staging; `publish-privacy-notice.sh` trên staging phải chạy bằng root – 12.3 "Staging landing lần đầu") |
| Timer production | `systemctl enable --now ottimo-backup@ottimo-prod.timer ottimo-ops-check@ottimo-prod.timer` (sau deploy app đầu). Sao lưu 03:00 + 15:00 giờ VN (từ v1.0.5). Khi đổi tệp timer trong bundle: `install -m 0644` vào `/etc/systemd/system/`, `systemctl daemon-reload`, `systemctl restart <timer>`, rồi `systemctl list-timers 'ottimo-backup*'` phải thấy giờ chạy kế tiếp đúng |
| Bản sao lưu ngoài máy | **Chính: Google Drive công ty, mục 7.1 (từ 07/11/2026).** Kéo về Mac dưới đây là **tùy chọn**, giữ song song 2 tuần sau khi Drive chạy ổn và đã diễn tập từ Drive; không xóa gì trên Mac khi INV chưa quyết. Trên Mac: `pull-backups.sh --host <IP> --key ~/.ssh/ottimo_backup_pull --to ~/.ottimo/backups/ottimo-prod`. Cần rsync 3: rsync có sẵn của macOS (openrsync) bị `rrsync` máy chủ từ chối, script dừng và báo. Cách 1: `brew install rsync`. Cách 2 (đã chạy 26/10): chạy script trong container `alpine` có `rsync openssh-client bash coreutils`, gắn khóa (chỉ đọc), `known_hosts`, thư mục đích – lệnh mẫu `rounds/round-03/outputs/OPS/v1-production.md` 19.2. Không bao giờ ghi đè tệp đã có trên Mac (`--ignore-existing`, kể cả `.sha256`) và không xóa theo máy chủ (SEC FB-R4-SEC-OPS-OR-01, TM-52). Trước khi kéo, script so nội dung mọi tệp cùng tên ở hai phía (rsync `--checksum --dry-run`, chỉ đọc; đọc hết tệp nên chậm hơn bản cũ): khác thì in `WARNING: server copy changed: <tên> – local copy kept`, vẫn kéo tệp mới, rồi thoát 3 → giữ nguyên bản trên Mac, báo OPS + SEC (nghi máy chủ bị xâm nhập). Nếu cùng tệp đó còn báo `checksum mismatch` thì có thể bản trên Mac mới là bản hỏng: so tay với `.sha256` trên máy chủ trước khi kết luận. Mã thoát: 0 ổn · 1 checksum cục bộ sai · 2 lỗi dùng/kết nối/rsync · 3 máy chủ đổi tệp cũ. `.last_pull` chỉ ghi khi thoát 0. Test: `server/test/pull-backups.test.sh` (rrsync thật sau ssh giả, chạy trong CI) |
| Thêm một `owner` dùng thử trên **staging** (DB đã có cơ sở – bootstrap từ chối) | từ Mac: `[ -t 1 ] && ssh … 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T -e ADD_OWNER_USERNAME=… -e ADD_OWNER_NAME="…" -e ADD_OWNER_OPERATOR="…" [-e ADD_OWNER_DRY_RUN=1] api node --input-type=module -' < product/infra/server/staging-add-owner.mjs` – chỉ staging, mật khẩu tạm in một lần trên Terminal người chạy (`rounds/round-03/outputs/OPS/b1-runbook.md` mục 2) |
| Đếm khói US-155 (READ ONLY) | `…/bin/us155-smoke-counts.sh --ref REQ-… --since <giờ+07:00>` – mục 12.3 bước 8 |
| Ghi phiên bản thông báo website (US-155; LP-v2: mọi ngôn ngữ của image) | `…/bin/publish-privacy-notice.sh --landing-tag <sha-… đang chạy> --version <YYYY-MM-DD> --property DLT --operator <id> [--apply]` – mục 12.3 bước 6, thứ tự LP-v2 cuối mục 12.3 |
| Diễn tập khôi phục | `restore-drill.sh --identity <khóa prod> --from ~/.ottimo/backups/ottimo-prod --api-image ghcr.io/<owner>/ottimo-api:<tag>` – so khớp tệp `counts` |

Mọi script trong `/opt/ottimo-prod/infra/server/bin` tự hiểu là production (tệp mốc), không cần `OTTIMO_HOME`. Khôi phục 2FA bằng lệnh quản trị (SEC 06.33): có thủ tục, lưu ngoài repo. SEC duyệt ngày: (chưa – chờ diễn tập staging). Diễn tập staging ngày: (chưa).

### 12.1 Khởi tạo production lần đầu (R3-OPS-02 – chạy **một lần**, sau deploy app đầu tiên)

Production dựng từ DB trống: chưa có cơ sở, căn, tham số, tài khoản. Lệnh quản trị `production-bootstrap` (không có endpoint) tạo trong **một giao dịch**: tổ chức + cơ sở OTTIMO Đà Lạt, 3 nhóm căn, **10 căn** (101–103, 201–203, 301, 302, 401, 402 – định mức/sức chứa BR-110, tên phòng BR-012; từ v1.0.5 cả 10 căn ở trạng thái **ngừng bán** vì chưa có giá – OWN nhập đủ giá tháng và giá đêm từng căn trên Desk rồi bật "Đang bán", V5-1A), kênh bán BR-901, tham số mặc định BR mục 13, và tài khoản `owner` đầu tiên. **Không** tạo khách, đơn, giá phòng, giá OTA nền, tài khoản nhận VietQR, mật khẩu Wi-Fi, thiết bị, hàng minibar – INV tự nhập trên app.

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
   - DB chưa có migration LP-v2 (tệp `0092_lp_v2_price_estimate_locales.sql` – trên nhánh `lp-v2` là 0091; số 0091 trên `main` là `0091_user_email_change` của v1.0.3, đối chiếu theo tên tệp) thì từ chối, báo deploy api trước.
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
  - trang không có đúng một version (hai thẻ meta, ko/zh/ru thiếu thẻ, hoặc hậu tố có số 0 đầu như `.01`) → **từ chối** khi `LANDING_PUBLIC_API=on` (không so được byte với bản đã đăng – SEC FB-R4-SEC-OPS-LPV2-02). Với `--rollback` chỉ là WARNING (trừ trang en/vi bản cũ – dòng dưới);
  - `LANDING_LOCALES` để trống → coi là `en,vi`, giống api và `publish-privacy-notice.sh`;
  - image không có trang privacy en + vi, hoặc trang en/vi bản cũ (không có thẻ meta) không in đúng một version → **từ chối khi `LANDING_PUBLIC_API=on`, kể cả `--rollback`** (ARC CWD-01, v1.0.1 – giữ nguyên khi gộp LP-v2 vào `main`: form đang nhận đồng ý thì phải đối chiếu được); proxy đóng thì chỉ ghi chú / WARNING;
  - không có `state/privacy-notice.log` mà `LANDING_PUBLIC_API=on` → **WARNING riêng** "no …/privacy-notice.log while the form proxy is on" (ARC CWD-02): nếu stack này từng ghi version thì khôi phục log từ bản sao lưu (`privacy-notice-<stamp>.log.age`, mục 13.6) hoặc chạy `publish-privacy-notice.sh` (chạy thử) để đối chiếu DB **trước** khi INV duyệt.
- Ngoại lệ: khi `LANDING_PUBLIC_API` **khác `on`** (proxy form đóng, khách không gửi được đồng ý – ví dụ quay lui (c) ở trên), mọi lỗi trên chỉ là **WARNING**. Phải sửa trước khi mở lại proxy.
- Trước khi INV duyệt một lượt landing: OPS chạy `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh <sha-…> --digest sha256:… --check-only` (kéo image, kiểm cấu hình + digest + privacy, **không đổi gì**). Thay cho việc băm tay trước đây.
- **Sau mỗi lượt deploy landing có version mới** (tới khi có `--candidate-digest`, FB-04, `v1.0.1`): chạy bước 6 (`publish-privacy-notice.sh` chạy thử rồi `--apply`) **ngay sau deploy landing, trong cùng phiên SSH, ngoài giờ cao điểm** (tránh khung nhận/trả phòng), để khoảng trống giữa trang mới và dòng phiên bản ngắn nhất.
- Nguồn so sánh là `state/privacy-notice.log` trên chính stack (mọi lần ghi bảng đều qua `publish-privacy-notice.sh`, mỗi lần một dòng). Mất tệp này thì kiểm coi như "chưa có version nào" – không xóa, không sửa tay tệp này. Từ v1.0.1 tệp nằm trong bản sao lưu hằng ngày (mục 13.6).
- Test: `infra/server/test/deploy-landing-privacy.test.sh` (28 ca: 13 ca v1.0.1–v1.0.3 + 14 ca 5 ngôn ngữ + 1 ca gộp (`--rollback` về image thiếu vi khi proxy mở → từ chối); image giả `FROM alpine`, không cần stack; chạy trong CI job `infra-scripts`).

#### LP-v2 – phát hành landing 5 ngôn ngữ + giá ước tính (R4, ARC lp-v2-design 3.6 (5)(6), ARC FB-R4-ARC-OPS-LPV2-01, SEC C3–C6, SEC `SEC-on-lp-v2-main.md`)

Lệnh từng bước, ô điền, "Đúng là", quay lui: `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md`. Mục này chỉ tóm tắt.

**Trạng thái thật trước LP-v2 (04/11, SEC FB-R4-SEC-LPV2M-03):**
- Production chạy landing `sha-72f9ac8e2b33` (`landing-v1.1.1`), thông báo đang hiệu lực **`2026-10-24`** (en + vi). App chạy v1.0.3 `sha-da6d6f3dc22b`, DB 68 migration (chưa có 0092).
- Nhãn `2026-10-31` (chữ PR #21, luật sư đã duyệt) **không bao giờ được đăng riêng** trên production: chữ en/vi đó đi cùng LP-v2 dưới nhãn mới (đổi nghĩa P4, SEC chấp nhận).
- **Nhãn của LP-v2 = `2026-11-04`** cho cả 5 ngôn ngữ (SEC chốt, `SEC-on-lp-v2-main.md` mục 2). **Không** đăng `2026-10-31` hay `2026-11-01` ở bất kỳ môi trường dùng chung nào: cả hai đã đăng trên stack thử của QA với chữ khác byte. Đổi bất kỳ câu nào của 5 trang thông báo hoặc `consent`/`consentMore` trước khi đăng → nhãn mới (`2026-11-04.1` hoặc ngày mới), không dùng lại nhãn cho chữ khác. **Đổi nhãn thì phải đổi cả hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` của api về đúng nhãn mới** (BE đổi hằng + test, SEC xem, Release api có hằng mới **trước** bước (c)) – nếu không, Chat giữ mức A mãi (QA BUG-R4-028).
- **Luật nhãn thông báo theo DB đích** (SEC `FB-R4-SEC-OPS-LPV2RB-02`/`05`, ORC 04/11; thay câu "đổi nhãn thì đổi hằng" ở trên từ sau lần đăng đầu). Trước mỗi lượt đăng, đếm (chỉ đọc, chỉ cột `version`) số dòng `privacy_notice_version` của **môi trường đích** mang nhãn bằng hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` của bản api đang chạy: `CONST_ROWS` (runbook LP-v2 r2.2 `CHKV`).
  - `CONST_ROWS = 0` – **lần đăng đầu** nêu Google Chat trên DB đó: hằng = nhãn sẽ đăng = `VERSION` của `privacy.ts` landing, cả ba bằng nhau (D2).
  - `CONST_ROWS ≥ 1` – hằng đã được đăng: **không đổi hằng sau lần đăng Chat đầu**, kể cả khi đổi chữ và tăng nhãn (`2026-11-04.1`, ngày mới). Nhãn mới chỉ cần bằng hằng (lên lại, không đăng gì) hoặc xếp **sau** hằng; không Release api chỉ để đổi hằng. Chỉ đổi hằng khi **SEC yêu cầu** bằng một dòng decision-log.
  - **Đổi chữ thông báo** (5 trang privacy hoặc `consent`/`consentMore`) thì **phải có dòng SEC duyệt chữ trong decision-log trước khi đăng** (bước (c) / bước 6). Không có dòng đó thì không chạy `publish-privacy-notice.sh --apply`.
  - Đây là luật tài liệu, không đổi mã chạy. Chú thích hằng trong `privacy.ts` / mã api do BE sửa cùng nội dung (ORC giao, ngoài gói OPS).
- `CHAT_DETAILS_MIN_NOTICE_VERSION` của api phải **bằng đúng nhãn sẽ đăng ở bước (c)** – hiện là `2026-11-04` (SEC FB-R4-SEC-LPV2M-01). Kiểm bằng phép so giá trị hằng với nhãn đăng (`VERSION` của `privacy.ts` ở cùng commit), không grep một chuỗi cố định. Cổng ★2 lấy `published_at` của **chính** dòng nhãn đó, không so chữ: hằng trỏ vào nhãn chưa đăng thì Chat giữ mức A mãi.

Điều kiện trước: SEC duyệt phát hành LP-v2 (C1–C8 của `rounds/round-04/reviews/SEC-on-LP-v2-code.md`) và đủ **D1–D7** của `rounds/round-04/reviews/SEC-on-lp-v2-main.md` mục 4 (bảng ở runbook mục P0), gồm D5 = C8 chạy trên **staging qua Caddy thật**. Bundle `infra/` của stack có bản `Caddyfile.landing`, `publish-privacy-notice.sh/.sql`, `deploy-landing.sh`, `ops-check.sh` của gói này (làm mới bundle như bước 1; Caddyfile là tệp mount, container landing chỉ đọc bản mới khi được dựng lại ở bước (b)). Làm ngoài giờ đông khách, các bước (a)–(d) liên tục trong **một phiên làm việc** (D4). Chạy trên staging trước, QA ký, rồi mới làm production.

**Thứ tự (không đảo, SEC D4):**
0. **Kiểm hiện trạng.** Bảng `privacy_notice_version` của production chỉ có `2026-10-24` en + vi đang hiệu lực; `state/privacy-notice.log` có dòng `apply … version=2026-10-24 … rc=0`, không có dòng `2026-10-31`, `2026-11-01`, `2026-11-04`. Công cụ đăng từ chối version nhỏ hơn version đang hiệu lực; `deploy-landing.sh` từ chối image có version cũ hơn version đã đăng (trừ `--rollback`). `2026-11-04` > `2026-10-24` nên cả hai cho qua.
1. **(a) api có migration LP-v2 `0092_lp_v2_price_estimate_locales`** (deploy app bình thường bằng Release; DB 68 → 69). `LANDING_LOCALES` **vẫn** `en,vi`. Compose truyền biến này vào api (mặc định `en,vi`). Bản api phải có `CHAT_DETAILS_MIN_NOTICE_VERSION` = đúng nhãn sẽ đăng ở (c) (D2, QA đọc mã của tag và so với nhãn; runbook LP-v2 0.2 bước 3 và P4).
2. **(b) Kiểm rồi deploy landing LP-v2**: `deploy-landing.sh <sha-…> --digest sha256:… --check-only`, rồi Release `landing-v…`. Bước `privacy` phải in 5 ngôn ngữ `2026-11-04 (not published yet)` (en, vi, ko, zh, ru), không FAIL "older". Caddy mới đã mở `/ko/`, `/zh/`, `/ru/`, trả trang 404 theo ngôn ngữ, và mở route `GET …/price-estimate` (chỉ khi `LANDING_PUBLIC_API=on`; query chỉ nhận ký tự ASCII in được, tối đa 256 byte – SEC FB-R4-SEC-OPS-LPV2-03).
3. **(c) Ngay sau đó** ghi version thông báo cho cả 5 ngôn ngữ (bước 6, `--version 2026-11-04`): chạy thử, rồi `--apply`. Chạy thử phải in `dry-run (would): supersede version 2026-10-24 (en)` và `(vi)`. `--apply` phải in `apply: supersede version 2026-10-24 (en)`, `apply: supersede version 2026-10-24 (vi)`, rồi `OK: version 2026-11-04 published (en vi ko zh ru)`. ko/zh/ru chưa từng có version nên không có dòng supersede.
   - Giữa (b) và (c) (vài phút), trang mới gửi `2026-11-04` mà DB chưa có. Server trả `NOTICE_VERSION_INVALID`, trang hiện khối Zalo/gọi. Không có dữ liệu sai.
4. **(d)** Sửa `.env` của stack: `LANDING_LOCALES=en,vi,ko,zh,ru`. Deploy lại app **cùng tag đang chạy** để api nhận biến (Desk gián đoạn khoảng 15–30 giây). Api không khởi động nếu biến có mã lạ. Sau đó `GET https://ottimo.vn/v1/public/properties/dlt/form-token` → 200.
5. **(e)** Trên **staging** (trước production): QA chạy 12 ca SEC 9.5 + ca BE-01 (C8) **qua Caddy thật**, gồm ca 6 (IP khách tới được api qua `TRUST_PROXY`; nếu sai, mọi khách dùng chung một bộ đếm) – SEC D5. Trên production: form-token 200 và một yêu cầu thử "TEST OTTIMO" theo bước 8 (xóa theo WR8).
6. **(f)** OWN bật `public_show_prices` trên Desk (H05) khi QA so giá web = giá Desk đạt (QC P6, P7). Trước đó route giá trả 404 và trang không hiện khối giá. `ops-check priceswitch` phải đã lấy mốc **trước** khi bật (SEC D6), và báo mỗi lần công tắc đổi.
7. **(g) Chỉ sau khi `2026-11-04` đã đăng** và SEC xác nhận ★1–★8 trong decision-log mới đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` (SEC D7, mục 13).
8. **Đổi mốc thuê tháng (BR-108).** Khi OWN đổi `long_stay_required_from_nights` trên Desk (bảng giá 01/11: 30), landing phải phát hành lại cùng ngày với `shortMaxNights` = mốc − 1 (ARC FB-R4-ARC-FE-LPV2-01: mốc 30 → 29). Lệch nhau thì form hiện hai thông điệp trái nhau. Đây là một lượt landing bình thường (bước b; không đổi version thông báo nếu trang privacy không đổi byte).

**Quay lui sau khi đã đăng `2026-11-04`** (ARC 3.6 (6)):
- Chỉ tắt giá: OWN đặt `public_show_prices = false` (lâu nhất khoảng 2 phút là trang hết hiện giá).
- Quay landing về bản 2 ngôn ngữ `sha-72f9ac8e2b33`:
  1. Đặt `LANDING_LOCALES=en,vi` và deploy lại app cùng tag **trước**.
  2. Rồi `deploy-landing.sh --rollback` (`state/landing_previous_tag` = `sha-72f9ac8e2b33`, digest ở `state/digests/landing-sha-72f9ac8e2b33`). Bước `privacy` in WARNING "older privacy notice version" (bản cũ in `2026-10-24`) – được phép với `--rollback`. Trang en/vi bản cũ in đúng một version và cùng byte với dòng `apply … 2026-10-24` trong log, nên không FAIL khi proxy mở.
  3. Trong **7 ngày** sau khi `2026-10-24` bị thay (giờ của lượt `--apply` ở (c)), form của bản cũ vẫn được nhận. **Quá 7 ngày**: SQL không cho đăng lại version cũ, nên phải dựng lại bản 2 ngôn ngữ với version mới (> `2026-11-04`) rồi chạy bước 6 cho version đó, hoặc đóng proxy form theo quay lui (c) ở trên.
- Quay app về v1.0.3 (`rollback.sh sha-da6d6f3dc22b`, DB 69 / image 68 được `--rollback` chấp nhận): đặt `LANDING_LOCALES=en,vi` và quay landing về `sha-72f9ac8e2b33` trước (v1.0.3 không nhận yêu cầu ko/zh, không có route giá).
- Dòng `privacy_notice_version` đã ghi **giữ nguyên**, không xóa. Không đăng lại `2026-10-24`.

#### Staging landing lần đầu – bài học 06/11 (R4, biên bản `rounds/round-04/outputs/OPS/lp-v2-staging-drill.md`)

Staging chạy app từ R2 nhưng tới 06/11 mới có landing. Lần dựng đầu vấp 7 chỗ dưới đây. Làm đúng thứ tự này mỗi khi một stack **lần đầu** có landing: staging dựng lại, hoặc máy mới khi khôi phục sau sự cố. Runbook LP-v2 r2.3 S3 trỏ về mục này.

1. **DNS (INV):** bản ghi A `staging` và `www.staging` (TTL 300), cùng đích với `desk.staging`. Kiểm trên máy chạy lệnh: `dig +short staging.ottimo.vn`, `dig +short www.staging.ottimo.vn` và `dig +short desk.staging.ottimo.vn` phải ra cùng giá trị. Chỉ so, không chép địa chỉ vào chat hay repo. Thiếu bản ghi thì Let's Encrypt không cấp được chứng chỉ.
2. **Sáu khóa `.env` của stack** (khuôn E2: sao lưu `state/env.before-<việc>.*`, ghi bằng `cat >` để giữ `ottimo 0600`): `LANDING_HOST`, `LANDING_WWW_HOST`, `LANDING_IMAGE`, `LANDING_BASE_URL` (= `https://<LANDING_HOST>`, bắt buộc khi proxy form mở), `LANDING_PUBLIC_API` (`on` khi cần form), `LANDING_LOCALES`. Một `.env` tạo từ trước **không** tự nhận khóa mới của `env.example` (`bootstrap-vps.sh` không gộp). Sau đó deploy lại app cùng tag (`REDEPLOY`) để api nhận `LANDING_BASE_URL` và `LANDING_LOCALES`.
3. **Edge chạy bằng root:** `cd / && sudo /opt/ottimo-edge/infra/server/bin/edge.sh render` (số host phải tăng thêm 2, 06/11: `10 host(s) for 2 stack(s)`), rồi `sudo …/edge.sh up`. Lý do: `/opt/ottimo-edge` là `root:root 0755`, user `ottimo` không ghi được `nginx.conf`. Mọi site gián đoạn khoảng 1–2 giây. Kiểm ngay: `ottimo.vn`, `desk.ottimo.vn`, `g.ottimo.vn` trả 200.
4. **Edge trước, landing sau. Đã lỡ thì dựng lại container landing.** Caddy của landing xin chứng chỉ ngay khi khởi động. Nếu container chạy **trước** khi edge biết host (06/11: lượt deploy-landing đầu), lượt xin ACME thất bại, rồi Caddy chờ thử lại theo thời gian lùi dần, lâu hơn khoảng 30 giây thử lại của smoke `deploy-landing.sh`. Chạy lại `deploy-landing.sh` cùng tag cũng không giúp: cấu hình không đổi nên `up` giữ nguyên container, smoke vẫn `unreachable` và tự quay lui (06/11: lần 1, 2 FAIL). Sau `edge.sh up`, khởi động lại landing của stack đó: `cd / && sudo -u ottimo /opt/ottimo/infra/server/bin/dc --profile landing restart landing`. Chứng chỉ có ngay, rồi chạy lại `deploy-landing.sh` (06/11: lần 3 OK). Cùng lý do cho host mới của `web` (Desk/Staff/Guest): dựng lại `web` của stack sau khi nạp edge.
5. **`publish-privacy-notice.sh` trên staging chạy bằng root:** `cd / && sudo OTTIMO_HOME=/opt/ottimo /opt/ottimo/infra/server/bin/publish-privacy-notice.sh --landing-tag … --version … --property DLT --operator <mã> [--apply]`. Bước 5 của công cụ tải trang thật qua edge. Trang staging có basic auth, và mật khẩu xem trước (`secrets/landing_preview_password`) chỉ root đọc được. Chạy bằng `ottimo` thì dừng ở `answered 401 (expected 200)`, chưa ghi gì. Production không có basic auth nên vẫn chạy bằng `sudo -u ottimo`. Hệ quả cần biết: lần chạy root đầu tiên tạo `state/privacy-notice.log` thuộc `root:root 0644` (staging 06/11; đã sửa tay về `ottimo:ottimo 0600` cùng ngày, xem (e)). Công cụ chỉ ghi thêm (`>>`) vào tệp đã có, nên chạy root về sau không đổi lại chủ. `deploy-landing.sh` và `backup.sh` (user `ottimo`) vẫn đọc được. Nhưng nếu sau này chạy công cụ bằng `ottimo`, dòng log sẽ không ghi được **sau khi** giao dịch DB đã xong. Vì vậy trên staging luôn chạy bằng root, cho tới khi v1.0.5 sửa (đề xuất (e) dưới đây).
6. **Quay lui landing trên stack chưa có bản trước:** `deploy-landing.sh --rollback` cần `state/landing_previous_tag`. Staging lần đầu không có tệp này, nên lệnh báo `no previous landing tag`. Deploy thẳng bản cũ (`deploy-landing.sh sha-72f9ac8e2b33`) thì bị chặn `FAIL: older privacy notice version …`, đúng thiết kế (chỉ `--rollback` được hạ nhãn). Để diễn tập (S7), ghi tệp này bằng `ottimo` với tag landing đang chạy trên production (06/11: `sha-72f9ac8e2b33`, giống trạng thái production lúc đó), rồi `--rollback`. Chỉ làm trên staging. Trên production, tệp này do `deploy-landing.sh` tự ghi.
7. **Form staging trả 404 dù proxy mở:** `public_booking_requests_enabled` mặc định `false` trên staging (production đã bật từ US-155), nên `form-token` trả 404 `problem+json`. Sau khi đăng nhãn thông báo, OWN thử (`qa.owner`) bật công tắc trên Desk staging, lý do ghi rõ lượt thử (06/11: "LP-v2 staging S6 (QA C8)"). Bật trước khi đăng nhãn thì server trả 422 `PUBLIC_FORM_NOT_READY`.

Thêm: trình duyệt thường **không gửi được form trên staging** (BUG-R4-054): landing gọi `fetch(…, { credentials: 'omit' })` nên không gửi basic auth, và Caddy staging trả 401 cho `form-token` / `price-estimate` / `booking-requests`. Chỉ thử form staging bằng công cụ tự chèn header `Authorization` (Playwright `extraHTTPHeaders`). Không đổi `credentials: 'omit'` của landing. Phương án A+ (`rounds/round-04/outputs/OPS/bug-r4-054-proposal.md`) để backlog B-OPS (PO 06/11), kèm các điều kiện SEC 054-02 … 054-06. Từ v1.0.5 (V5-67, SEC FB-R4-SEC-OPS-054-01), `Caddyfile.landing` bỏ header `Authorization` trước khi chuyển 3 thao tác tới api, cho cả staging lẫn production: mật khẩu xem trước dừng ở Caddy, không tới api (CI `check-caddy-landing.sh`). Caddyfile landing là tệp gắn vào container, nên sau khi làm mới bundle phải dựng lại container `landing` (`--force-recreate`) thì mới nạp bản mới.

**Đề xuất v1.0.5 – để script tự xử lý** (OPS làm, ARC + SEC review; chưa có trong mã):
- (a) `deploy-landing.sh` bước `config`: (1) báo rõ tên khóa còn thiếu trong sáu khóa ở bước 2; (2) đối chiếu `LANDING_HOST` / `LANDING_WWW_HOST` với `/opt/ottimo-edge/nginx.conf` (tệp 0644 nên `ottimo` đọc được); edge chưa có host thì dừng **trước khi** khởi động container, với câu "run `sudo …/edge.sh up` first". Container không bao giờ xin ACME khi edge chưa biết host, nên không còn bẫy ở bước 4. (3) Tùy chọn `--check-only` in thêm `dns: same|different|none` (so `LANDING_*` với `DESK_HOST`, không in địa chỉ).
- (b) `edge.sh`: kiểm `[ -w "$EDGE_HOME" ]` ngay đầu, nếu không ghi được thì dừng với câu "run as root". Sửa chú thích "root hoặc deploy user". `up` so danh sách host cũ với mới, có host mới thì in tên service cần dựng lại, hoặc tự `restart` landing/web của stack có host mới (không đụng stack khác). `collect`: thư mục stack có mà `.env` không đọc được thì dừng, không lặng lẽ bỏ qua (nếu bỏ qua, `nginx.conf` mới sẽ thiếu host của stack đó).
- (c) `deploy-landing.sh` smoke: khi `unreachable`, đếm dòng lỗi ACME trong log container landing (chỉ số đếm) và in gợi ý "restart the landing container after the edge knows the host".
- (d) `publish-privacy-notice.sh`: staging mà mật khẩu xem trước không đọc được thì dừng ngay ở đầu, với câu "staging: run as root (`sudo OTTIMO_HOME=…`)". Hiện công cụ chạy tới bước 5 mới báo 401.
- (e) `publish-privacy-notice.sh` chạy bằng root: tạo và ghi `state/privacy-notice.log` với chủ `ottimo` (`install -o`, hoặc `chown` sau khi ghi), và kiểm ghi được log **trước** giao dịch DB (mở tệp để ghi thêm ngay từ đầu). Một lần sửa tay trên staging (SEC OR-L3 đồng ý): `sudo chown ottimo:ottimo` + `sudo chmod 0600` cho `/opt/ottimo/state/privacy-notice.log`, không xóa, không cắt nội dung. **Đã làm 06/11** (OPS, `ls -l` trước/sau ở `rounds/round-04/responses/OPS-LP-v2.md`).
- (f) `deploy-landing.sh --rollback-to <tag>` **chỉ cho staging** (`APP_ENV≠production`): yêu cầu digest đã biết, hành vi như `--rollback` (nhãn cũ chỉ WARNING), thay việc ghi tay `landing_previous_tag` ở bước 6. Production giữ nguyên `--rollback`.
- (g) Bước 7: không đổi mã. Runbook staging (r2.3 S5) đã ghi việc bật công tắc. Không cho seed tự bật, vì công tắc phải bật sau khi đăng nhãn.
- (h) BUG-R4-054: theo `bug-r4-054-proposal.md` (cần SEC duyệt).

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
- Yêu cầu gửi dưới thông báo cũ hơn `2026-11-04` (thông báo đầu tiên nêu Google Chat **được đăng** – `2026-10-31` không đăng riêng, P4) **luôn** nhận mức A, dù `.env` đặt C. Đây là hằng số trong mã (`CHAT_DETAILS_MIN_NOTICE_VERSION`, SEC FB-R4-SEC-LPV2M-01). Trước khi `2026-11-04` được đăng, mọi tin đều ở mức A.
- Staging chỉ được đặt C khi nối với **phòng thử** và dùng dữ liệu giả. Không bao giờ nối staging với phòng thật.

### 13.5 K1 và xóa tin Chat khi khách xin xóa (WR8) – SEC L2.2

**K1** – kiểm một lần trên phòng thật, ngay sau khi v1.0.1 chạy mức A, và **trước** lần đăng thông báo đầu tiên nêu Google Chat (`2026-11-04`, LP-v2; `2026-10-31` không đăng riêng). **Đã đạt 03/11** (decision-log "K1 – ĐẠT", REQ thử đã xóa); các bước dưới giữ để làm lại nếu đổi phòng Chat hoặc webhook:
1. INV gửi một yêu cầu thử trên ottimo.vn: tên đúng chuỗi `TEST OTTIMO`, email `info@ottimo.vn`, không SĐT, tắt tự điền.
2. Tin mức A tới phòng.
3. INV, với quyền quản lý phòng, **xóa tin do webhook "Desk OTTIMO" đăng**.
4. Tìm `REQ-…` trong Chat: không còn kết quả.
5. INT ghi lại từng câu có/không:
   - xóa được tin webhook;
   - xóa được tin người khác trả lời trong luồng;
   - trước khi xóa, tìm kiếm có ra mã `REQ-…`.
6. Xóa yêu cầu thử theo WR8 trên Desk, rồi chạy đếm khói 12.3 bước 8. Kết quả phải là `RESULT: OK – 14/14`.

K1 **không đạt** (không xóa được tin webhook) thì: không đăng thông báo nêu Google Chat (`2026-11-04` hoặc nhãn sau), không đặt C, INT báo SEC.

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

**Luật thường trực (SEC FB-R4-SEC-OPS-RB-04), mọi môi trường, mọi lúc:** không `UPDATE`, `DELETE`, `TRUNCATE` trên `privacy_notice_version`, và không `ALTER TABLE … DISABLE TRIGGER` / `DROP TRIGGER` / `CREATE OR REPLACE FUNCTION` lên trigger của bảng này bằng tay. Đăng bản thông báo mới **chỉ** qua `publish-privacy-notice.sh` (12.3 bước 6). Trigger 0090 chỉ chặn DML của vai thường; chủ bảng (`ottimo_owner`) và superuser vẫn tắt được trigger, nên luật này vẫn cần sau khi 0090 đã lên. Cũng không `SET session_replication_role = replica` trong phiên nào có đụng bảng này, và không `pg_restore --disable-triggers` vào DB có bảng này: hai cách đó vượt trigger mà `tgenabled` vẫn là `O`, nên kiểm K3 không thấy (SEC PR30-08). Thay thân hàm trigger chỉ qua migration có review ARC + SEC (ví dụ PN-01 Minor, 0095: thân hàm mới, đặt SECURITY INVOKER + `search_path` cố định; `ops-check db_triggers` kiểm `prosecdef` và md5 thân hàm).

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

### 13.8 `ops-check`: `email_dead`, `email_missing`, `email_changes`, `email_ascii`, `email_config`, `db_triggers`, `EMAIL_NO_RECIPIENT_ALERT` và lỗi truy vấn (v1.0.1, v1.0.3, v1.0.4)

- **Từ v1.0.4 (P4-04; SEC `FB-R4-SEC-OPS-PR32-S1`, ARC `FB-R4-ARC-OPS-PR30-09`): mọi kiểm DB** (`j16`, `email_*`, `priceswitch`, `db_triggers`) chạy bằng vai **`ottimo_readonly`** trong giao dịch READ ONLY. Phiên quản trị nhận vai lúc kết nối (`PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly"`); vai vẫn NOLOGIN, có BYPASSRLS, chỉ SELECT. Mỗi phiên trả trước một dòng chốt: đúng vai, có BYPASSRLS, không superuser, giao dịch chỉ đọc. Sai một điều (vai thiếu, vai không BYPASSRLS làm số đếm lặng lẽ thành 0) thì kiểm `FAIL unexpected answer`, không bao giờ `ok 0`. Không còn kiểm nào dùng phiên superuser. Lưu ý (SEC `FB-R4-SEC-OPS-P404R1-S1`): `-c role=` trên phiên superuser chặn **lỗi vô ý** (sai cột, quên `WHERE`, thiếu quyền), **không** phải ranh giới bảo mật – một câu `SET ROLE NONE`/`RESET ROLE`/`SESSION AUTHORIZATION` đưa phiên về superuser. Vì vậy SQL của `ops-check.sh` và `requeue-email-changed.sh` chỉ là hằng trong tệp (CODEOWNERS SEC), và test của hai script từ chối các câu đó (cùng `set_config('role'`, `READ WRITE`).
  - Quyền nằm ở `infra/postgres/init/02-roles.sh`, chạy lại trước `migrate` ở **mỗi** lần deploy (bước `roles`; từ v1.0.4 r1.1 `deploy.sh` đưa tệp của gói trên máy chủ vào `bash -s` qua stdin, không dùng bản gắn đơn trong container – sau `rsync` bản gắn đó là bản cũ; không in dòng nào của script, đọc lại dấu hiệu `ottimo_requeue` + quyền đọc `drizzle`, thiếu → dừng trước `migrate`): thêm `USAGE` schema `drizzle` + `SELECT drizzle.__drizzle_migrations` cho `ottimo_readonly` (đếm migration của runbook), và vai **`ottimo_requeue`** (NOLOGIN, BYPASSRLS, chỉ `SELECT` + `UPDATE (status, attempts, next_attempt_at, last_error) ON outbox_message`) cho câu ghi duy nhất của `requeue-email-changed.sh` (13.9). Không cần migration GRANT (ARC plan 2.2: 0097 chỉ khi không đặt được ở đây; 0096 không dùng lại).
  - Khối `SQLRO` của runbook từ v1.0.4 dùng cùng `PGOPTIONS`; dòng đầu `SHOW default_transaction_read_only` phải là `on` và dòng kế `SELECT current_user` phải là `ottimo_readonly`.
- `containers` (v1.0.4, ARC `FB-R4-ARC-OPS-P402-01`/`P404-04`): ngoài "đang chạy", so **id container + `RestartCount`** của từng service với lượt trước (`state/ops-check/containers.restarts`). Cùng container mà `RestartCount` tăng → `FAIL … restarted <n> time(s) since the last check – crash loop?`. Container mới (sau deploy) phải ở 0. `docker inspect` lỗi → `FAIL restart count … unreadable`. Lượt sau không tăng thêm thì về `ok`.

- `email_dead` (mục 7) đếm thư `staff.email` chết vì `NO_RECIPIENT` trong 24 giờ. Chỉ đếm, không đọc payload.
- `email_missing` (v1.0.3, ARC `v1.0.3-tech-plan.md` 2.10 điều kiện 2; v1.0.4 thêm `locked`, ARC `FB-R4-ARC-OPS-PR30-08`: bộ gửi thư gửi cho cả người bị khóa) đếm người dùng `active` **hoặc `locked`** đang có vai `owner` hoặc `manager` chưa thu hồi (`user_property_role.revoked_at IS NULL`) mà **chưa có email** (`app_user.email` rỗng). Thư bảo mật gửi cho họ sẽ chết `NO_RECIPIENT`.
  - Chạy trong giao dịch **READ ONLY** (`default_transaction_read_only=on`), chỉ `SELECT count(*)`: không đọc, không in địa chỉ, tên hay id. Đầu ra chỉ là một con số, ví dụ `ok   email_missing: 1 active/locked OWN/MGR user(s) without e-mail (report only …)`.
  - Chỉ dùng cột có từ 0000, nên chạy được cả trên DB v1.0.2 (67 migration) lẫn v1.0.3 (68, có 0091). Trên production trước khi INV nhập email, số này là `1` (INV là OWN duy nhất, chưa có email) – đúng như dự kiến, không phải lỗi.
  - Chạy tay: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh email_missing`.
- `email_changes` (v1.0.3, SEC `FB-R4-SEC-OPS-PR31-01`; **điều kiện để deploy v1.0.3 lên production**). v1.0.3 chưa giới hạn số lần đổi email thành công (giới hạn cứng ở v1.0.4), và bộ gửi thư chỉ lấy 10 thư/phút/cơ sở theo thứ tự vào trước ra trước. Một đợt dội lệnh đổi email làm trễ mọi thư bảo mật khác. Kiểm này đếm:
  - từ `user_email_change` (bảng của 0091): tổng số lần đổi trong 24 giờ, số lần của **người bị đổi nhiều nhất**, và (v1.0.4, SEC `FB-R4-SEC-OPS-PR32-02` (b)) **`via owner: <n>`** = số lần đổi do OWN làm (`via = 'owner'`, chỉ đếm) – ORC biết ngay nhánh nào của mục F mà không đọc audit;
  - từ `outbox_message`: số thư `staff.email` còn chờ (`pending`, `failed`, `in_flight`) và tuổi thư cũ nhất (phút).
  - `FAIL` khi một người đổi > `EMAIL_CHANGES_USER_MAX` (mặc định **5**), hoặc tổng > `EMAIL_CHANGES_TOTAL_MAX` (mặc định **20**) trong 24 giờ, hoặc thư cũ nhất còn chờ > `STAFF_EMAIL_QUEUE_MAX_MIN` (mặc định **30** phút). Kiểm này **luôn** cảnh báo, không theo công tắc `EMAIL_NO_RECIPIENT_ALERT`.
  - Ba ngưỡng chỉnh được trong `.env` của stack (`.env` thắng biến môi trường), nhưng **không tắt được**: mỗi ngưỡng phải là số nguyên trong khoảng 1–20, 1–200 và 5–240. Giá trị khác (0, chữ, số quá lớn) làm kiểm `FAIL` với câu `… must be a whole number …`, không lặng lẽ cho qua.
  - Giao dịch **READ ONLY**, chỉ in số. Không chọn địa chỉ, id hay payload. Trước 0091 (production v1.0.2, chưa có bảng), phần đếm đổi email ghi `table not present yet (before migration 0091)`, và chỉ xét hàng đợi.
  - Staging: QA đổi email thử nhiều lần thì `FAIL` là đúng (QA dùng chính ca này: đổi 6 lần trong 24 giờ → `FAIL`).
  - Khi `FAIL`: runbook v1.0.3 mục "email_changes FAIL"; dòng `FAIL` từ v1.0.4 ghi sẵn `via owner: <n>` và nhánh (`branch 1` khi > 0). Tóm tắt (SEC PR32-02, PR33-01): đổi bởi OWN (`via = owner`, thư có câu "Thay đổi do chủ đầu tư thực hiện" – v1.0.3 ghi "chủ cơ sở"), **hoặc email của chính tài khoản OWN bị đổi** (kể cả `via = self`), mà INV không làm → coi tài khoản OWN bị lộ: INV đổi mật khẩu, đăng xuất phiên lạ, báo SEC ngay, **không** khóa các tài khoản bị đổi. Ca email của OWN bị đổi (SEC `FB-R4-SEC-OPS-PR33-S3`): sau khi đổi mật khẩu, INV **nhập lại email của mình** ở **Bảo mật tài khoản** (nếu không, thư bảo mật vẫn tới địa chỉ kẻ đó đặt). INV **không đăng nhập được**: báo ORC ngay, SEC quyết đặt lại theo thủ tục xác minh danh tính (`mfa-operator-reset`, ESC-027 B); INV không tự thử nhiều lần. **Không chắc nhánh nào → làm như vậy**; chỉ khóa người khác khi SEC xác nhận. Một nhân viên (không phải OWN) tự đổi email của mình (`via = self`) → OWN khóa nhân viên đó. **Không bao giờ** để INV tự khóa tài khoản OWN duy nhất. Báo SEC trong mọi nhánh. Trong 30 phút sau `requeue-email-changed.sh --apply` (13.9), câu `oldest waiting … min old` là dự kiến: chạy lại sau 3 phút trước khi kết luận. Không xóa dòng outbox, không sửa bảng bằng SQL tay.
  - Chạy tay: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh email_changes`.
- `email_ascii` (v1.0.3, INT `FB-R4-INT-BE-31-04`): số `app_user.email` (không rỗng) mà luật địa chỉ chung (`integrations/notification/email-address.ts`: cắt khoảng trắng, chữ thường, phần tên `[a-z0-9._%+-]{1,64}`, ≥ 2 nhãn `[a-z0-9-]{1,63}`, đuôi là chữ, 3–254 ký tự) sẽ từ chối. READ ONLY, chỉ `count(*)` ra khỏi DB. **Từ v1.0.4** adapter SMTP áp luật này, nên số > 0 là `FAIL` (thư bảo mật tới người đó thất bại): báo INT, người đó nhập lại trên Desk, không sửa bằng SQL. Đã đối chiếu với hàm TypeScript trên 29 ca (Postgres 17 tạm).
- `email_config` (v1.0.4, SEC V104-04 ý 3–4; thay câu kiểm shell của runbook v1.0.4 P2c bước 2 và P2d bước 3): kiểm cấu hình gửi thư trong `.env` **bằng đúng luật của `email_ascii`** (một hằng `EMAIL_RULE_RE` trong `ops-check.sh`, dùng cho cả câu SQL lẫn phần shell, nên hai nơi không lệch nhau; đổi luật thì đổi cùng `email-address.ts` của INT).
  - Khớp `smtp.ts` (ARC `FB-R4-ARC-OPS-P404-09`): `EMAIL_SMTP_MODE` cắt khoảng trắng, **trống = `relay`**, ngoài `relay|app_password` → `FAIL … EMAIL_SMTP_MODE invalid`. `EMAIL_SMTP_USER` và `EMAIL_FROM` cắt khoảng trắng hai đầu như adapter; `EMAIL_FROM` trống thì lấy `EMAIL_SMTP_USER`. `EMAIL_FROM` theo `isEmailAddress` (chữ hoa/thường tùy ý, không dạng `Tên <địa chỉ>`). `app_password`: `EMAIL_SMTP_USER` bắt buộc và theo luật (`ok … EMAIL_SMTP_MODE=app_password: EMAIL_FROM and EMAIL_SMTP_USER follow the address rule`). `relay`: không cần `EMAIL_SMTP_USER` (`ok … EMAIL_SMTP_MODE=relay: EMAIL_FROM follows the address rule`, thêm ` (EMAIL_SMTP_USER ignored in relay)` nếu có đặt).
  - Mỗi mục của `EMAIL_SHARED_MAILBOXES` (tách theo dấu cách, `,`, `;`; cắt khoảng trắng, chữ thường – như `shared-mailboxes.ts`). Biến nằm trên hơn một dòng → `FAIL`. Không đặt → `ok … unset (default rule applies; api v1.0.4 warns – runbook P2d)`.
  - Chỉ in chữ và số (số mục, số mục sai luật), **không bao giờ in địa chỉ**. `FAIL` nghĩa là worker/api v1.0.4 sẽ dừng lúc khởi động: sửa `.env` trên máy chủ theo khuôn E2, báo INT. Chỉ chạy khi `EMAIL_PROVIDER=smtp`.
  - **Hộp thư chung lưu bản sao thư** (SEC `FB-R4-SEC-OPS-SENT-01`): ở OTTIMO, đường chính `relay` **có** lưu bản sao thư bảo mật vào "Đã gửi" của địa chỉ gửi (K8 bước 7 v1.0.3 = "có", 04/11), không chỉ đường dự phòng `smtp.gmail.com`. Bản sao chứa email riêng của người nhận: INV xóa bản sao trong ngày nhận thư. Sau mỗi lần đổi `EMAIL_FROM` hoặc cài đặt Workspace, và mỗi tháng một lần, ORC hỏi INV câu có/không "Đã gửi của hộp thư gửi còn bản sao thư OTTIMO không" (ESC-049 quyết hướng lâu dài). **Đổi `EMAIL_FROM`** sang hộp thư hay tên miền khác thì kiểm hộp thư chung (SEC SENT-02) lại thành bắt buộc: chạy `email_config`, runbook K5b, và thử 422 `EMAIL_SHARED_MAILBOX` với `info@` như K8 bước 2a v1.0.3.
- `db_triggers` (v1.0.4, P4-13 PN-01, P4-11 ED-02): READ ONLY, chỉ tên + cờ. Đúng là: `privacy_notice_version_append_only` và `privacy_notice_version_no_truncate` đều `tgenabled = 'O'`, cùng trỏ `public.privacy_notice_version_append_only()` không SECURITY DEFINER, và `md5(prosrc)` của hàm khớp thân của migration đang có (SEC `FB-R4-SEC-OPS-P413-S2`, ARC `FB-R4-ARC-OPS-P413-S1`): hằng `PN_FN_MD5_0090` khi DB chưa tới 72 migration, `PN_FN_MD5_0095` từ 72 (0095 = idx 71). Số migration đọc bằng quyền `drizzle` của `02-roles.sh` v1.0.4; không đọc được → `FAIL … not checked`. Lệch chỉ in 8 ký tự đầu của md5, không in thân hàm. Migration nào sau này đổi thân hàm phải đổi hằng cùng lúc (`test-ops-check.sh` so hằng với tệp migration và báo đỏ nếu có migration khác định nghĩa lại hàm); `ottimo_app` chỉ `SELECT` bảng `privacy_notice_version`; `room_list_price_append_only` (0094) `O`, không SECURITY DEFINER và là `BEFORE DELETE … FOR EACH ROW`, hoặc chưa có (trước 0094: hàm `room_list_price_append_only()` **và** trigger đều chưa có → `not present yet`, không `FAIL`). Có hàm mà mất trigger nghĩa là 0094 đã chạy rồi trigger bị xóa → `FAIL … missing (function present – migration 0094 ran)` (ARC `FB-R4-ARC-OPS-P404-08`). Lệch → `FAIL`, báo SEC + BE. **Không** bật/tắt trigger bằng tay (13.7).
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
  - Giới hạn còn lại của `mail-test.mjs` (ARC `FB-R4-ARC-OPS-PR30-10`): từ gói v1.0.4 (P4-03) địa chỉ đi vào container worker một lần chạy qua **dòng đầu stdin**, không qua biến môi trường, nên không còn trong `docker inspect` (`Config.Env`) hay `/proc/<pid>/environ`. Địa chỉ vẫn nằm trong bộ nhớ tiến trình node vài giây (root trên VPS đọc được), và trong log sudo I/O nếu bật (vì vậy có kiểm `SUDO_IO_LOG` ở trên).
  - Không bao giờ gõ `-e MAIL_TEST_TO=<địa chỉ>`. Thư thật của v1.0.3 là thư `email_changed` khi INV lưu email trên Desk; `--send` chỉ dùng khi đội điều tra lỗi gửi.
  - Test: `infra/server/test/mail-test-send.test.sh` (20 kiểm, `ssh` giả; gồm bit chạy và chạy trực tiếp không qua `bash`).
- Khi truy vấn của `j16`, `email_dead`, `email_missing`, `email_changes`, `email_ascii`, `priceswitch` hoặc `db_triggers` lỗi, kiểm báo `query failed: <loại>`. Có 7 loại cố định:
  - `permission denied`
  - `Docker daemon unreachable`
  - `postgres container not running`
  - `database unreachable`
  - `query error`
  - `stack file missing`
  - `other error`

  Nguyên văn lỗi không bao giờ được gửi ra journal hay webhook, vì lỗi đọc `.env` có thể trích nguyên một dòng `.env` (ARC CWD-03). Muốn xem lỗi thật: chạy tay `cd / && sudo -u ottimo …/bin/ops-check.sh j16`, rồi `…/bin/dc exec -T postgres psql …` trên terminal.
- stderr của lệnh đang kiểm ghi vào một tệp riêng cho mỗi lượt (`mktemp`, quyền 0600) và bị xóa khi thoát. Tệp chung `state/ops-check/compose.stderr` của bản 30/10 tự được xóa (ARC CWD-04 mục 1). Bị dừng bằng `SIGTERM` (systemd dừng unit, máy tắt) thì `trap` vẫn chạy; tệp `cmd-stderr.*` sót lại sau `SIGKILL` bị lượt sau xóa khi cũ hơn 60 phút (SEC PR23-06).
- Test v1.0.4: `infra/ci/test-ops-check.sh` 204 kiểm (206 khi có tệp 0095 và mục journal của nó; ngưỡng `PN_0095_APPLIED_AT` so với journal, ARC P404-16) (thêm: chốt vai cho 7 kiểm DB, `j16` câu trả lời lạ, `via owner`, `locked`, `email_ascii` FAIL > 0, `email_config` gồm 4 địa chỉ so luật SQL ↔ shell và 4 ca chế độ của ARC P404-09, `db_triggers` gồm hàm có mà trigger mất và hàm PN-01 (`prosecdef`, md5 theo 0090/0095), kiểm tĩnh không có câu thoát vai); `infra/server/test/ops-check-cwd.test.sh` 14 ca (ca 6a–6g: `RestartCount`, 6g: `not running at inspect`); `ops-check-price.test.sh` 17 ca (ca 15: `priceswitch` bằng `ottimo_readonly`); `requeue-email-changed.test.sh` (câu ghi bằng `ottimo_requeue`).
- Test cũ: `infra/ci/test-ops-check.sh` (119 kiểm – từ khi gộp LP-v2 thêm 1 kiểm "pricelimit pricegap priceswitch có trong lượt chạy đủ": 24 kiểm `email_missing`; 48 kiểm `email_changes` gồm biên 5/6, 20/21, 30/31 phút, ngưỡng từ `.env`, 10 giá trị ngưỡng bị từ chối, trước 0091, câu trả lời lạ, câu SQL READ ONLY không có cột địa chỉ, loại lỗi; 15 kiểm `email_ascii`) và `infra/server/test/ops-check-cwd.test.sh` (7 ca, ca 4c có cả 5 kiểm DB).

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
