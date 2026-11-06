# Runbook "VPS mới": dựng lại OTTIMO khi mất hẳn máy chủ (r1)

OPS · 06/11/2026 · V5-64 (OR-M4). **Chỉ viết, chưa diễn tập.** Diễn tập trên một VPS dùng một lần có tốn tiền, nên nằm ở B-OPS và cần ESC. Vì vậy RTO ≤ 4 giờ trong `hosting-plan.md` mục 7 vẫn là giả định.
r1 (06/11): sửa theo ARC `rounds/round-05/reviews/ARC-on-ops-prs-92-93-95.md` (FB-R5-ARC-OPS-02 ý 3, 03, 04) và SEC `SEC-on-ops-prs-92-93-95.md` (FB-R5-SEC-OPS-95-03, 95-07): DNS trước deploy, cột "Ai gõ", lệnh KEK và `id_hash_key`, lỗi `pg_restore` vào tệp root, so host key ngoài băng, khôi phục `privacy-notice.log`, `ops-check` bằng `systemd-run`, sự cố dữ liệu SR-INC-01.

**Dùng khi:** VPS mất hẳn, gồm hỏng đĩa, hãng khóa tài khoản, hoặc bị chiếm quyền rồi bị xóa. Khi DB hỏng mà máy còn, dùng bản sao lưu trên máy (README `infra/server` mục 7), không dùng runbook này.

**Ai gõ (SEC FB-R5-SEC-OPS-95-03):**
- **INV** (hoặc OPS là người thật, trên máy của mình) gõ mọi bước chạm khóa riêng `age`, KEK, `id_hash_key` hay luồng dump đã giải mã (có toàn bộ dữ liệu khách): bước 9, 11, 12, 13 và phần giải mã `counts` ở bước 16. **Agent (ORC) không chạy, không xem màn hình** các bước này: mọi thứ hiện trên màn hình của agent nằm trong bản ghi phiên.
- **ORC** chỉ chạy bước có đầu ra là mã thoát, số đếm, 8 ký tự băm hay vân tay, khi INV đã đồng ý (một câu cho cả runbook này, nêu: dựng máy mới, dùng root, khôi phục dữ liệu, Desk chưa dùng được tới bước 16).
- **INV** quyết bắt đầu, thuê máy, sửa DNS và secret GitHub. Không ai gửi mật khẩu, khóa hay IP qua chat. Mọi lệnh dùng `<IP-mới>`; ORC chuyển lệnh có IP thật cho INV trong chat (IP không phải bí mật, nhưng repo công khai không ghi).

**Nghi bị chiếm quyền** (máy cũ bị người lạ vào, không chỉ hỏng): đây là **sự cố dữ liệu**, không chỉ là dựng lại máy. KEK và `id_hash_key` cũ nằm trên máy bị chiếm.
- Gọi **SR-INC-01** (`security-requirements.md`): báo SEC và INV ngay; khoanh vùng (thu hồi phiên, thiết bị); đánh giá việc báo cơ quan chức năng trong 72 giờ (luật sư xác nhận) và báo chủ thể dữ liệu.
- Không dùng lại bất cứ thứ gì lấy từ máy cũ, kể cả khóa SSH, token, `.env` hay bản sao lưu chưa so băm. Chỉ dùng bản trên Mac đã so `.sha256`, và chỉ bản có `<stamp>` trước lúc nghi bị vào (SEC chọn bản).
- **Mặc định xoay cả KEK lẫn `id_hash_key`** sau khi khôi phục, vì khóa cũ coi như đã lộ (xoay KEK = thêm phiên bản, bọc lại DEK, ADR-013; xoay `id_hash_key` = băm lại, runbook R2). SEC quyết lúc có sự cố.

## 0. Cần có trước khi bắt đầu

| Thứ | Ở đâu | Ai |
|---|---|---|
| Bộ sao lưu mới nhất `db-`, `blobs-`, `purge-journal-`, `counts-`, `privacy-notice-<stamp>` (`.age` + `.sha256`) | Mac, `~/.ottimo/backups/ottimo-prod`. Dữ liệu mất tính từ `<stamp>` (README mục 7: tối đa khoảng 60 giờ với nhịp kéo tay). `privacy-notice-*` chỉ có khi stack đã đăng một phiên bản thông báo | OPS |
| Khóa giải mã `age` production | 2 bản ngoại tuyến (hosting-plan 8.1), phong bì **riêng**, không chung với KEK (luật A8). Chỉ dùng trên Mac, **không** đưa lên VPS | INV |
| Bản ngoại tuyến `data_kek_current` production và 8 ký tự vân tay | INV giữ (README 4.2, khuôn G4-8). Thiếu bản này thì ảnh giấy tờ và dữ liệu mã hóa không đọc lại được | INV |
| Bản ngoại tuyến `id_hash_key` production và 8 ký tự vân tay | INV giữ cùng chỗ với KEK (SEC 95-07; việc cuối Round 5, cùng buổi V5-61). Chưa có thì xem mục 2 | INV |
| Tag app và tag landing đang chạy, digest | GitHub Release mới nhất (artifact `image-digests`) và decision-log | ORC |
| VPS mới: Ubuntu 24.04, 2 vCPU / 4 GB / ≥ 40 GB, đặt ở VN. Tắt snapshot của hãng hoặc giữ ≤ 7 ngày. Vào được **console web** của hãng | INV thuê, dán khóa công khai `ottimo_ops.pub` vào root hoặc tạo `ottimo-admin` (README mục 0, cách B) | INV |
| Bí mật tích hợp (cổng thanh toán, Google Chat, Healthchecks, mật khẩu ứng dụng mail nếu dùng) | Tài khoản của từng hãng (`integrations.md` 4.1). Các bí mật này không nằm trong bản sao lưu | INV + INT |

## 1. Các bước (dự kiến 3–4 giờ, chưa đo)

| # | Việc | Lệnh / nơi | Ai gõ | Kiểm |
|---|---|---|---|---|
| 1 | Hạ TTL DNS xuống 300 giây (nếu còn vào được nhà đăng ký) | Nhà đăng ký tên miền | INV | – |
| 2 | **Host key mới, so ngoài băng** trước lần SSH đầu (mọi bước sau, kể cả KEK ở bước 9, đi qua kết nối này) | Mục 1.1 | INV (console web) + ORC (Mac) | 8 ký tự trùng |
| 3 | Gói `infra/` từ **tag đang chạy**, không lấy từ `main` | `git archive` như README `infra/server` 13.1 bước 1 (ref = tag đang chạy), chép bằng `scp` | ORC | Băm trên Mac trùng băm trên VPS |
| 4 | Bootstrap **production trước**, rồi staging (staging để sau cũng được) | README 12 dòng 1: `bootstrap-vps.sh --env production --deploy-key <ottimo_ops.pub> --ci-key <khóa CI mới> --backup-pull-key <khóa kéo mới> --admin-user ottimo-admin`. Bootstrap cài cả drop-in journald và `state/journald_since` | ORC | `sshd -T` không cho mật khẩu; firewall chỉ mở 22/80/443 |
| 5 | **Ngay sau đó, gỡ dòng `--deploy-key`** khỏi `authorized_keys` của `ottimo`, và dọn user mặc định của ảnh | README `infra/server` **mục 3.1** (bước 1–4; số `CI`/`PULL` tính theo số stack đã bootstrap). Rồi đếm người đọc log như runbook v1.0.5 P2 mục 5: ảnh của hãng hay có sẵn user (ví dụ `ubuntu`) trong `sudo`/`adm`. Gỡ user đó (`sudo -n gpasswd -d <user> sudo`, `… adm`) hoặc thêm vào `LOG_READER_USERS`/`SUDO_USERS` khi SEC đồng ý | ORC | `NGUOI: 1` trước, `TONG SAU` = `CI + PULL`; mọi nhóm `NGOAI DANH SACH: 0` |
| 6 | Khóa CI và khóa kéo **mới**, không dùng lại khóa cũ | INV sửa secret GitHub `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS` (dòng khóa **đã so ở bước 2**), `PRODUCTION_SSH_HOST` (staging: `STAGING_SSH_*`) | INV | Lượt kéo đầu `pull-backups.sh` thoát 0 (bước 18) |
| 7 | `.env` từ mẫu, **không** từ máy cũ | `env.production.example` → `/opt/ottimo-prod/.env` (`ottimo 0600`). Điền host, `ACME_EMAIL`, `LANDING_*`, `MFA_ENFORCED=true`, `PAYMENT_VIETQR_MODE=production`, `DATA_KEK_VERSION` và các giá trị đã đổi ghi trong decision-log | ORC | `dc config -q >/dev/null 2>&1 && echo OK` (không in dòng `.env` khi lỗi) |
| 8 | Khóa công khai `age` vào `backup/recipients.txt` | README 4.3. Dùng cùng khóa công khai cũ để Mac giải mã được bản mới | ORC | – |
| 9 | **KEK và `id_hash_key` trước, `init-secrets.sh` sau.** `init-secrets.sh` không bao giờ ghi đè tệp đã có. Chưa đặt hai khóa cũ thì nó sinh khóa mới: dữ liệu mã hóa coi như mất, chỉ mục mù không khớp | Mục 1.2 | **INV** trên Mac | Vân tay Mac = vân tay giấy = vân tay máy chủ |
| 10 | `init-secrets.sh` cho các bí mật còn lại | Mục 1.2 bước 4 | ORC | `TAO LAI KHOA: 0` |
| 11 | Khôi phục DB: giải mã **trên Mac**, đẩy qua SSH vào `pg_restore`. Dump rõ không bao giờ nằm trên đĩa | Mục 1.3. Chạy sau `dc up -d postgres`, để `02-roles.sh` tạo các vai | **INV** | `MA THOAT: 0`, `DONG LOI: 0` |
| 12 | Khôi phục kho tệp vào volume `blobdata`, chủ uid 1000, `0700` | Như `restore-drill.sh` bước 4, `tar -xf -` từ stdin, giải mã trên Mac; stderr vào `/root/restore-blobs-<stamp>.err` như mục 1.3 | **INV** | Số tệp trùng biên bản `counts` |
| 13 | **Khôi phục `state/privacy-notice.log`** (bằng chứng các phiên bản thông báo đã đăng, Nghị định 13; ARC OPS-04) **trước** `deploy-landing.sh` | Mục 1.4 | **INV** | `ottimo 600`, số dòng trùng lúc sao lưu |
| 14 | **DNS: bản ghi A trỏ về `<IP-mới>`, rồi chờ hết TTL** (300 giây từ bước 1). Máy cũ đã mất, nên trỏ sớm không làm khách mất gì thêm. Chưa deploy thì edge chỉ trả lỗi, không lộ dữ liệu (ARC FB-R5-ARC-OPS-03) | INV, `hosting-plan.md` mục 10. ORC kiểm từ Mac bằng lệnh mục 1.5 | INV, ORC kiểm | Mỗi tên `1` |
| 15 | Deploy đúng tag đang chạy, kèm digest. **Chỉ sau bước 14**: smoke của `deploy.sh` kiểm chứng chỉ TLS thật (`SMOKE_INSECURE` mặc định 0), mà Caddy chỉ xin được chứng chỉ khi DNS đã trỏ về máy mới | `deploy.sh <tag> --api-digest … --web-digest …` (migrate không làm gì vì DB đã đủ). Landing: `deploy-landing.sh <tag landing> --digest …` | ORC | `deploy <tag>: ok` |
| 16 | Kiểm: số đếm, trigger, `ops-check` | `backup-counts.sql` qua `SQLRO`; INV giải mã `counts-<stamp>` trên Mac (chỉ có số) và so. `ops-check` đủ mục bằng lệnh mục 1.6 (có nhóm `systemd-journal`), gồm `db_triggers`, `sshkeys`, `pricegap`, `journal`, `tls` | ORC; INV phần `counts` | Mọi số trùng, `EXIT: 0` |
| 17 | Bật timer sao lưu và ops-check | README 12 dòng "Timer production"; `systemctl list-timers 'ottimo-backup*' --all` có đúng một timer sao lưu cho mỗi stack đã dựng | ORC | `list-timers` thấy NEXT đúng |
| 18 | Chạy một lượt sao lưu tay, kéo về Mac | `backup.sh`; `pull-backups.sh` | ORC | `OK: <n> encrypted files`, lượt kéo thoát 0 |
| 19 | Cài lại bí mật tích hợp: `--set-booking-chat`, Healthchecks, cổng thanh toán | README 13.2; `integrations.md`. Lời nhắc ẩn có sẵn, không gõ vào tham số | INV | Tin thử tới đúng phòng |

**Bước 15 không đợi được DNS** (ví dụ nhà đăng ký chậm): chạy bước 15 với `SMOKE_INSECURE=1`, rồi sau khi đổi DNS chạy lại smoke (`deploy.sh` cùng tag và digest). `--insecure` chỉ đỡ khi Caddy đã có một chứng chỉ nào đó; ACME chưa xin được thì bắt tay TLS hỏng, `--insecure` không cứu. Đừng chạy lại liên tục: Let's Encrypt giới hạn số lần xác thực thất bại cho mỗi tên miền mỗi giờ. Vì vậy cách chính vẫn là DNS trước.

### 1.1 Host key mới, so ngoài băng (bước 2; SEC 95-03 ý 4)
1. **INV**, trong console web của hãng (không qua SSH): `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. Đọc 8 ký tự sau `SHA256:` cho ORC trong chat (vân tay khóa công khai, không phải bí mật).
2. **ORC**, trên Mac: `ssh-keyscan -t ed25519 <IP-mới> 2>/dev/null | ssh-keygen -lf - | awk '{ print "VAN TAY QUET: " substr($2, 8, 8) }'`.
3. Trùng: thêm đúng dòng `ssh-keyscan -t ed25519 <IP-mới>` đó vào `~/.ssh/known_hosts` trên Mac; INV dán cùng dòng vào `PRODUCTION_SSH_KNOWN_HOSTS` ở bước 6. Khác: **dừng**, không SSH, báo SEC (có thể có kẻ đứng giữa).

### 1.2 KEK và `id_hash_key` từ bản ngoại tuyến (bước 9; khuôn G4-8 của `rounds/round-03/outputs/OPS/b2-runbook.md` 2.2; SEC 95-03 ý 2, 95-07)
**INV gõ trên Terminal của mình**, lần lượt cho `data_kek_current` rồi `id_hash_key` (lần hai: thay `data_kek_current` bằng `id_hash_key` trong lệnh 2). Giá trị chỉ đi qua `read -rs` và ống SSH: không nằm trong tham số lệnh, lịch sử shell hay clipboard.
1. Gõ lại từ giấy, màn hình không hiện chữ, rồi so vân tay với 8 ký tự ghi trên giấy:
```bash
printf 'Khoa: '; read -rs k; echo; printf '%s' "$k" | shasum -a 256 | cut -c1-8
```
Lệch: sửa chỗ chép sai (`0/O`, `1/l/I`), gõ lại. Không đi tiếp khi chưa trùng.
2. Ghi lên máy chủ, root, tệp tạm rồi `mv` (không bao giờ ghi đè tệp đã có), in lại vân tay từ tệp trên máy chủ:
```bash
printf '%s' "$k" | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@<IP-mới> 'cd / && sudo -n sh -c "umask 077; set -e; d=/opt/ottimo-prod/secrets; f=\$d/data_kek_current; install -d -o root -g ottimo -m 0710 \$d; [ ! -e \$f ] || { echo DA CO TEP, DUNG; exit 1; }; cat > \$f.tmp; chown 1000:1000 \$f.tmp; chmod 0400 \$f.tmp; mv \$f.tmp \$f; printf \"VAN TAY MAY CHU: \"; sha256sum < \$f | cut -c1-8"'; unset k
```
**Đúng là:** `VAN TAY MAY CHU` trùng vân tay của lệnh 1 và của giấy. `DA CO TEP, DUNG`: `init-secrets.sh` đã chạy trước (khóa mới đã sinh). **Dừng**, báo OPS + SEC: chưa có dữ liệu mới nào dùng khóa đó thì xóa tệp và làm lại; đã có thì SEC quyết.
3. Cmd+K. Cất lại giấy. Trong chat INV chỉ nói "đã đặt hai khóa", không gửi vân tay hay giá trị.
4. Rồi bước 10, ORC chạy (không in bí mật nào):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@<IP-mới> 'cd / && echo "TAO LAI KHOA: $(sudo -n /opt/ottimo-prod/infra/server/bin/init-secrets.sh | grep -cE "created.*(data_kek_current|id_hash_key)")"'
```
**Đúng là:** `TAO LAI KHOA: 0` (`init-secrets.sh` không tạo lại hai khóa đã đặt).

### 1.3 Khôi phục DB (bước 11; SEC 95-03 ý 3)
`log_error_verbosity=terse` chỉ áp cho log **của máy chủ**. Client vẫn nhận đủ DETAIL và CONTEXT, nên khi lỗi ở COPY hay ở ràng buộc, lỗi của `pg_restore` có thể mang giá trị của dòng dữ liệu. Vì vậy stderr của `pg_restore` ghi vào tệp **root 0600 trên máy chủ**, không về Terminal; màn hình chỉ có mã thoát và số dòng lỗi. **INV gõ** (khóa `age` trên Mac):
```bash
age -d -i <khóa-age> db-<stamp>.dump.age | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@<IP-mới> 'cd / && sudo -n sh -c "umask 077; /opt/ottimo-prod/infra/server/bin/dc exec -T postgres sh -c '\''pg_restore -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --exit-on-error --single-transaction'\'' >/dev/null 2>/root/restore-<stamp>.err; echo \"MA THOAT: \$?\"; echo \"DONG LOI: \$(wc -l < /root/restore-<stamp>.err)\""'
```
- Trích dẫn như khối `SQLRO`: `sh -c '\''…'\''`, nên `$POSTGRES_USER` và `$POSTGRES_DB` mở **trong container**, không mở ở shell của `ottimo-admin` hay của root (bản r0 dùng nháy kép nên biến bị mở thành rỗng trước khi vào container). Root chạy `dc` để ghi được tệp lỗi trong `/root`; lệnh chỉ dùng `sh`, không cần shell của `ottimo-admin` là bash. (Đã chạy thử cách trích dẫn trên container Ubuntu 24.04 với `dash` và `dc`, `pg_restore` giả.)
- **Đúng là:** `MA THOAT: 0`, `DONG LOI: 0`.
- Khác: INV (hoặc OPS người thật) đọc tệp lỗi bằng `sudo` **trên máy chủ**, không dán vào chat; agent không đọc. Sửa xong thì xóa: `sudo -n rm -f /root/restore-<stamp>.err`. `--single-transaction` nên lỗi giữa chừng không để lại DB dở.

### 1.4 `state/privacy-notice.log` (bước 13; ARC FB-R5-ARC-OPS-04)
Không có bộ `privacy-notice-<stamp>` (stack chưa đăng phiên bản nào): bỏ qua. Có thì **INV gõ**:
```bash
age -d -i <khóa-age> privacy-notice-<stamp>.log.age | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@<IP-mới> 'cd / && sudo -n -u ottimo sh -c "umask 077; cat > /opt/ottimo-prod/state/privacy-notice.log" && sudo -n stat -c "%U %a" /opt/ottimo-prod/state/privacy-notice.log && echo "SO DONG: $(sudo -n -u ottimo sh -c "wc -l < /opt/ottimo-prod/state/privacy-notice.log")"'
```
**Đúng là:** `ottimo 600`, `SO DONG` trùng số dòng `backup.sh` ghi lúc sao lưu (`privacy-notice.log saved (<n> lines)` trong journal `ottimo-backup` cũ, hoặc biên bản kéo). Làm **trước** `deploy-landing.sh`: thiếu tệp mà form đang bật thì `deploy-landing.sh` cảnh báo, và đối chiếu phiên bản với DB không làm được.

### 1.5 DNS đã trỏ về máy mới (bước 14)
```bash
for h in desk.ottimo.vn staff.ottimo.vn g.ottimo.vn ottimo.vn; do echo "$h: $(dig +short "$h" @1.1.1.1 | grep -cx "<IP-mới>")"; done
```
**Đúng là:** mỗi tên `1`. Chưa đủ thì chờ thêm TTL, không chạy bước 15.

### 1.6 `ops-check` chạy tay (bước 16; ARC FB-R5-ARC-OPS-02 ý 3)
Cùng lệnh với runbook v1.0.5 W7 (unit ops-check đọc journal qua `SupplementaryGroups=systemd-journal`; chạy `sudo -u ottimo` thì `journal` FAIL "journal unreadable" đúng thiết kế):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@<IP-mới> 'cd / && sudo -n systemd-run --quiet --wait --pipe --uid=ottimo --gid=ottimo -p SupplementaryGroups=systemd-journal -E OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/ops-check.sh; echo "EXIT: $?"'
```
- `tls` chỉ được coi là đạt sau khi DNS đã đổi (bước 14) và Caddy đã có chứng chỉ thật.
- `journal` FAIL vì một nhóm có người ngoài danh sách (thường là user mặc định của ảnh): xử lý như bước 5 (README `infra/server` 3.1): gỡ user, hoặc thêm vào `LOG_READER_USERS` / `SUDO_USERS` khi SEC đồng ý.
- `journal` WARN `state/journald_since missing`: bootstrap chưa ghi tệp (gói cũ); ghi ngày hôm nay: `ssh … 'cd / && sudo -n -u ottimo sh -c '\''[ -s /opt/ottimo-prod/state/journald_since ] || date +%F > /opt/ottimo-prod/state/journald_since; cat /opt/ottimo-prod/state/journald_since'\'''`.
- `backup` FAIL là đúng cho tới bước 18.

## 2. Mất gì dù làm đúng

- **Dữ liệu ghi sau `<stamp>`**: đơn, folio, thanh toán, yêu cầu web. Lễ tân nhập lại từ sổ giấy, Zalo, sao kê ngân hàng (sổ vận hành).
- Mọi phiên đăng nhập, vì `session_secret` mới. Mã khách đang chờ (≤ 30 phút) cũng mất. Đăng ký Web Push phải làm lại, vì có cặp VAPID mới.
- **`id_hash_key`**: khôi phục từ bản ngoại tuyến ở bước 9 (SEC 95-07, hosting-plan 8.1). **Chỉ khi INV chưa cất bản ngoại tuyến** (việc của INV cuối Round 5, cùng buổi V5-61): khóa mới làm chỉ mục mù (tìm khách theo số giấy tờ, nhận khách quay lại, chống trùng trẻ em) và năm khóa HKDF sinh từ nó không khớp dữ liệu cũ. Phần nào chỉ lưu dạng băm thì **không băm lại được**; phần có bản mã hóa thì băm lại theo runbook R2 (cần lệnh của BE). Bỏ ý này khỏi mục 2 sau khi INV báo "id_hash_key đã cất".
- Các lần xóa theo yêu cầu khách sau `<stamp>` mất cùng `purge_journal` trên máy cũ. Phải làm lại theo danh sách của lễ tân (SR-BAK-06). Các lần xóa theo hạn sẽ tự chạy lại ở đêm đầu (J16).
- Nhật ký của máy cũ (journal, gồm log container và nhật ký SSH) mất cùng máy: không nằm trong bản sao lưu (SEC: journal ở ngoài thư mục sao lưu).

## 3. Chưa diễn tập: giả định cần kiểm khi diễn tập

Các bước 9, 11, 12, 13 chưa từng chạy trên một stack thật (chỉ `restore-drill.sh` trên stack dùng một lần). Lệnh mục 1.2–1.4 đã viết nhưng chưa chạy trên máy chủ. Bước 15 giả định `deploy.sh` nhận một DB đã ở đúng số migration, và Caddy xin được chứng chỉ trong khoảng thử lại của smoke (6 lần × 5 giây). Thời gian 3–4 giờ là ước tính. Diễn tập: B-OPS (OR-M4-drill, cần ESC).
