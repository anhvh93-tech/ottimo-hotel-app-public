# Runbook "VPS mới": dựng lại OTTIMO khi mất hẳn máy chủ (r2)

OPS · 06/11/2026 · V5-64 (OR-M4). **Chỉ viết, chưa diễn tập.** Diễn tập trên một VPS dùng một lần có tốn tiền, nên nằm ở B-OPS và cần ESC. Vì vậy RTO ≤ 4 giờ trong `hosting-plan.md` mục 7 vẫn là giả định.
r1 (06/11): sửa theo ARC `rounds/round-05/reviews/ARC-on-ops-prs-92-93-95.md` (FB-R5-ARC-OPS-02 ý 3, 03, 04) và SEC `SEC-on-ops-prs-92-93-95.md` (FB-R5-SEC-OPS-95-03, 95-07): DNS trước deploy, cột "Ai gõ", lệnh KEK và `id_hash_key`, lỗi `pg_restore` vào tệp root, so host key ngoài băng, khôi phục `privacy-notice.log`, `ops-check` bằng `systemd-run`, sự cố dữ liệu SR-INC-01.
r2 (06/11): sửa theo SEC FB-R5-SEC-OPS-95-09 (a)–(g), 95-10 (b) và ARC FB-R5-ARC-OPS-10 ý 2: tên tạm `ottimo-moi` thay IP trong mọi lệnh, quét host key một lần vào tệp, INV điền các khóa có địa chỉ email, vòng đời tệp khóa `age` trên Mac, bí mật tích hợp mới khi nghi bị chiếm quyền, câu đồng ý riêng cho production và staging, lệnh khôi phục kho tệp (bước 12), danh sách người đọc log đặt ở bước 7.

**Dùng khi:**
- VPS mất hẳn, gồm hỏng đĩa, hãng khóa tài khoản, hoặc bị chiếm quyền rồi bị xóa;
- **nghi bị chiếm quyền mà máy còn chạy**: runbook sự cố dữ liệu khách (`runbook-su-co-du-lieu-khach.md`) mục 5, nhánh B mức Cao (FB-R5-OPS-SEC-V574-04). Làm cả khối "Nghi bị chiếm quyền" dưới đây, và với máy cũ:
  - **Tắt** bằng console của nhà cung cấp khi OWN quyết, theo đề nghị của SEC. Không đăng nhập máy cũ để "dọn" hay kiểm. Trước khi tắt, SEC có thể xin một bản chụp journal chỉ đọc làm dấu vết (SEC nói lúc có sự cố).
  - **Không xóa, không cài lại, không hủy thuê** tới khi SEC (và luật sư, nếu đang hỏi) cho. Máy cũ còn dữ liệu khách và khóa cũ: chỉ để tắt.
  - Xong thì hủy thuê, ghi decision-log (ngày, ai cho, không IP).
  - Hai máy cùng tồn tại trong lúc dựng lại: tiền thuê máy thứ hai OWN quyết. Vượt ngân sách đã duyệt thì OPS tạo ESC.

Khi DB hỏng mà máy còn và không nghi bị chiếm quyền, dùng bản sao lưu trên máy (README `infra/server` mục 7), không dùng runbook này.

**Ai gõ (SEC FB-R5-SEC-OPS-95-03):**
- **INV** (hoặc OPS là người thật, trên máy của mình) gõ mọi bước chạm khóa riêng `age`, KEK, `id_hash_key`, luồng dump đã giải mã (có toàn bộ dữ liệu khách) hay địa chỉ email: tên tạm (mục 1.0), các khóa email của `.env` (bước 7, mục 1.8), bước 9, 11, 12, 13 và phần giải mã `counts` ở bước 16. **Agent (ORC) không chạy, không xem màn hình** các bước này: mọi thứ hiện trên màn hình của agent nằm trong bản ghi phiên.
- **ORC** chỉ chạy bước có đầu ra là mã thoát, số đếm, 8 ký tự băm hay vân tay, trong câu đồng ý của INV (mục 0.1: một câu cho production, một câu riêng cho staging).
- **INV** quyết bắt đầu, thuê máy, sửa DNS và secret GitHub.
- **Không IP, không địa chỉ email trong chat, repo, decision-log hay biên bản** (SEC 95-09 (a), (c)). IP chỉ nằm ở ba chỗ: `~/.ssh/config` trên Mac (tên tạm `ottimo-moi`, INV gõ, mục 1.0), nhà đăng ký tên miền và secret GitHub. Mọi lệnh dùng `ottimo-moi`. Lệnh nào cần IP thì tự lấy bằng `ssh -G ottimo-moi` bên trong lệnh, và chỉ in số hay 8 ký tự. Không ai gửi mật khẩu hay khóa qua chat.

**Nghi bị chiếm quyền** (máy cũ bị người lạ vào, không chỉ hỏng): đây là **sự cố dữ liệu**, không chỉ là dựng lại máy. KEK và `id_hash_key` cũ nằm trên máy bị chiếm.
- Gọi **SR-INC-01** (`security-requirements.md`): báo SEC và INV ngay; khoanh vùng (thu hồi phiên, thiết bị); đánh giá việc báo cơ quan chức năng trong 72 giờ (luật sư xác nhận) và báo chủ thể dữ liệu.
- Không dùng lại bất cứ thứ gì lấy từ máy cũ, kể cả khóa SSH, token, `.env` hay bản sao lưu chưa so băm. Chỉ dùng bản trên Mac đã so `.sha256`, và chỉ bản có `<stamp>` trước lúc nghi bị vào (SEC chọn bản).
- **Mặc định xoay cả KEK lẫn `id_hash_key`** sau khi khôi phục, vì khóa cũ coi như đã lộ (xoay KEK = thêm phiên bản, bọc lại DEK, ADR-013; xoay `id_hash_key` = băm lại, runbook R2). SEC quyết lúc có sự cố.
- **Bí mật tích hợp mới, không nhập lại giá trị cũ** (bước 19; SEC 95-09 (e)). Giá trị cũ đã nằm trên máy bị chiếm. INV (với INT) xin giá trị **mới** ở từng hãng: webhook Google Chat của các phòng, URL Healthchecks, khóa cổng thanh toán, mật khẩu ứng dụng mail. Thu hồi giá trị cũ ở chính hãng đó. Kiểm: tin thử tới đúng phòng qua webhook mới; webhook cũ bị hãng từ chối; ping Healthchecks cũ không còn được nhận.

## 0. Cần có trước khi bắt đầu

| Thứ | Ở đâu | Ai |
|---|---|---|
| Bộ sao lưu mới nhất `db-`, `blobs-`, `purge-journal-`, `counts-`, `privacy-notice-<stamp>` (`.age` + `.sha256`) | Mac, `~/.ottimo/backups/ottimo-prod`. Dữ liệu mất tính từ `<stamp>` (README mục 7: tối đa khoảng 60 giờ với nhịp kéo tay). `privacy-notice-*` chỉ có khi stack đã đăng một phiên bản thông báo | OPS |
| Khóa giải mã `age` production | 2 bản ngoại tuyến (hosting-plan 8.1), phong bì **riêng**, không chung với KEK (luật A8). Chỉ dùng trên Mac, **không** đưa lên VPS. **Trên Mac chỉ trong buổi khôi phục** (SEC 95-09 (d), khuôn `b2-runbook.md`): FileVault bật (`fdesetup status`); INV chép vào `~/.ottimo/backup/ottimo-prod-backup-identity.txt` (thư mục 0700, tệp 0600); ORC không mở, không đọc tệp này. **Xóa sau bước 16:** `rm ~/.ottimo/backup/ottimo-prod-backup-identity.txt && ls ~/.ottimo/backup`, danh sách không còn tệp đó; INV báo trong chat "đã xóa khóa khỏi Mac" | INV |
| Bản ngoại tuyến `data_kek_current` production và 8 ký tự vân tay | INV giữ (README 4.2, khuôn G4-8). Thiếu bản này thì ảnh giấy tờ và dữ liệu mã hóa không đọc lại được | INV |
| Bản ngoại tuyến `id_hash_key` production và 8 ký tự vân tay | INV giữ cùng chỗ với KEK (SEC 95-07; việc cuối Round 5, cùng buổi V5-61). Chưa có thì xem mục 2 | INV |
| Tag app và tag landing đang chạy, digest | GitHub Release mới nhất (artifact `image-digests`) và decision-log | ORC |
| VPS mới: Ubuntu 24.04, 2 vCPU / 4 GB / ≥ 40 GB, đặt ở VN. Tắt snapshot của hãng hoặc giữ ≤ 7 ngày. Vào được **console web** của hãng | INV thuê, dán khóa công khai `ottimo_ops.pub` vào root hoặc tạo `ottimo-admin` (README mục 0, cách B) | INV |
| Bí mật tích hợp (cổng thanh toán, Google Chat, Healthchecks, mật khẩu ứng dụng mail nếu dùng) | Tài khoản của từng hãng (`integrations.md` 4.1). Các bí mật này không nằm trong bản sao lưu. Nghi bị chiếm quyền: giá trị **mới**, thu hồi giá trị cũ | INV + INT |
| Tên tạm `ottimo-moi` trong `~/.ssh/config` trên Mac | Mục 1.0. IP chỉ gõ ở đây | INV |

### 0.1 Đồng ý của INV (SEC 95-09 (f), 95-10 (b))
Hai câu riêng. Câu production không cho phép dựng staging. Bước 4 cho phép staging làm sau, nên staging chờ câu thứ hai. Mỗi câu ghi `RBV8`, tức 8 ký tự commit của runbook này trên `main` (`git log -1 --format=%h --abbrev=8 origin/main -- product/docs/runbook-vps-moi.md`). Runbook đổi sau lúc INV đồng ý, đổi thứ tự hay thêm bước: xin lại.
- **Production:** "Trên máy chủ OTTIMO mới (thay máy đã mất; một máy sẽ chạy cả staging và production), anh/chị đồng ý cho ORC dựng lại phần **production** theo runbook VPS mới bản ⟨RBV8⟩, bắt đầu lúc ⟨giờ⟩, khoảng 3–4 giờ, không? Gồm: so khóa máy chủ với console web; dựng máy bằng `bootstrap-vps.sh` (root); gỡ khóa cài đặt khỏi user `ottimo` và gỡ user mặc định của ảnh khỏi các nhóm quản trị; `.env` từ mẫu và bí mật mới; deploy đúng bản đang chạy; bật lịch sao lưu, chạy một lượt sao lưu và kéo về Mac; kiểm tra đủ. Anh/chị tự gõ các bước có khóa, email và dữ liệu khách (khóa KEK, `id_hash_key`, khóa giải mã sao lưu, khôi phục DB, kho tệp, `privacy-notice.log`, các ô email trong `.env`); ORC không xem các bước đó. Desk và trang khách chưa dùng được tới bước 16. Dữ liệu ghi sau ⟨stamp⟩ mất (mục 2). Nếu có lỗi, ORC dừng và hỏi anh/chị trước khi làm lại bước nào. Không lùi được: máy cũ đã mất; mọi phiên đăng nhập và mã khách đang chờ phải làm lại."
- **Staging** (riêng, khi production đã chạy ổn): "Trên cùng máy chủ OTTIMO mới, anh/chị đồng ý cho ORC dựng phần **staging** theo runbook VPS mới bản ⟨RBV8⟩ lúc ⟨giờ⟩, khoảng 30 phút, không? Gồm: `bootstrap-vps.sh --env staging` (root), `.env` staging từ mẫu, bí mật staging mới, deploy staging từ CI. Dữ liệu staging là dữ liệu giả, không khôi phục. Bootstrap làm mới edge dùng chung: mọi trang, gồm production, có thể mất 1–2 giây. App, dữ liệu và sao lưu production không đổi. Nếu có lỗi, ORC dừng và hỏi anh/chị trước khi làm lại."

## 1. Các bước (dự kiến 3–4 giờ, chưa đo)

| # | Việc | Lệnh / nơi | Ai gõ | Kiểm |
|---|---|---|---|---|
| 1 | Hạ TTL DNS xuống 300 giây (nếu còn vào được nhà đăng ký) | Nhà đăng ký tên miền | INV | – |
| 2 | **Tên tạm, rồi host key mới, so ngoài băng** trước lần SSH đầu (mọi bước sau, kể cả KEK ở bước 9, đi qua kết nối này) | Mục 1.0, rồi 1.1 | INV (tên tạm, console web) + ORC (Mac) | `TEN TAM: CO`; 8 ký tự trùng |
| 3 | Gói `infra/` từ **tag đang chạy**, không lấy từ `main` | `git archive` như README `infra/server` 13.1 bước 1 (ref = tag đang chạy), chép bằng `scp` | ORC | Băm trên Mac trùng băm trên VPS |
| 4 | Bootstrap **production trước**, rồi staging (staging để sau cũng được) | README 12 dòng 1: `bootstrap-vps.sh --env production --deploy-key <ottimo_ops.pub> --ci-key <khóa CI mới> --backup-pull-key <khóa kéo mới> --admin-user ottimo-admin`. Bootstrap cài cả drop-in journald và `state/journald_since` | ORC | `sshd -T` không cho mật khẩu; firewall chỉ mở 22/80/443 |
| 5 | **Ngay sau đó, gỡ dòng `--deploy-key`** khỏi `authorized_keys` của `ottimo`, và dọn user mặc định của ảnh | README `infra/server` **mục 3.1** (bước 1–4; số `CI`/`PULL` tính theo số stack đã bootstrap). Rồi đếm người đọc log (mục 1.7): ảnh của hãng hay có sẵn user (ví dụ `ubuntu`) trong `sudo`/`adm`. Gỡ user đó (`sudo -n gpasswd -d <user> sudo`, `… adm`). Muốn giữ user đó thì ghi lại, rồi đặt `LOG_READER_USERS`/`SUDO_USERS` ở bước 7, khi SEC đồng ý (`.env` chỉ có từ bước 7; ARC FB-R5-ARC-OPS-10) | ORC | `NGUOI: 1` trước, `TONG SAU` = `CI + PULL`; mọi nhóm `NGOAI DANH SACH: 0`, trừ user đã ghi lại để đặt ở bước 7 |
| 6 | Khóa CI và khóa kéo **mới**, không dùng lại khóa cũ | INV sửa secret GitHub `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS` (đúng dòng trong `~/.ottimo/hostkey-moi` **đã so ở bước 2**, mục 1.1 bước 4), `PRODUCTION_SSH_HOST` (staging: `STAGING_SSH_*`). Xong thì xóa tệp quét: `rm ~/.ottimo/hostkey-moi` | INV | Lượt kéo đầu `pull-backups.sh` thoát 0 (bước 18) |
| 7 | `.env` từ mẫu, **không** từ máy cũ | `env.production.example` → `/opt/ottimo-prod/.env` (`ottimo 0600`). ORC điền host, `LANDING_*`, `MFA_ENFORCED=true`, `PAYMENT_VIETQR_MODE=production`, `DATA_KEK_VERSION`, các giá trị không phải email đã đổi ghi trong decision-log, và `LOG_READER_USERS`/`SUDO_USERS` nếu bước 5 giữ user (SEC đồng ý). **INV** điền mọi khóa có địa chỉ email (mục 1.8) | ORC, INV (email) | `CAU HINH: OK`, `ottimo 600` (mục 1.8); `email_config` ở bước 16 |
| 8 | Khóa công khai `age` vào `backup/recipients.txt` | README 4.3. Dùng cùng khóa công khai cũ để Mac giải mã được bản mới | ORC | – |
| 9 | **KEK và `id_hash_key` trước, `init-secrets.sh` sau.** `init-secrets.sh` không bao giờ ghi đè tệp đã có. Chưa đặt hai khóa cũ thì nó sinh khóa mới: dữ liệu mã hóa coi như mất, chỉ mục mù không khớp | Mục 1.2 | **INV** trên Mac | Vân tay Mac = vân tay giấy = vân tay máy chủ |
| 10 | `init-secrets.sh` cho các bí mật còn lại | Mục 1.2 bước 4 | ORC | `TAO LAI KHOA: 0` |
| 11 | Khôi phục DB: giải mã **trên Mac**, đẩy qua SSH vào `pg_restore`. Dump rõ không bao giờ nằm trên đĩa | Mục 1.3. Chạy sau `dc up -d postgres`, để `02-roles.sh` tạo các vai | **INV** | `MA THOAT: 0`, `DONG LOI: 0` |
| 12 | Khôi phục kho tệp vào volume `blobdata`, chủ uid 1000, `0700` | Mục 1.9: giải mã trên Mac, `tar -xf -` trong container api; stderr vào `/root/restore-blobs-<stamp>.err` như mục 1.3 | **INV** | `MA THOAT: 0`, `DONG LOI: 0`, `SO TEP` > 0 khi cơ sở đã lưu ảnh giấy tờ; ghi số (`counts` chưa có số tệp kho, mục 3) |
| 13 | **Khôi phục `state/privacy-notice.log`** (bằng chứng các phiên bản thông báo đã đăng, Nghị định 13; ARC OPS-04) **trước** `deploy-landing.sh` | Mục 1.4 | **INV** | `ottimo 600`, số dòng trùng lúc sao lưu |
| 14 | **DNS: bản ghi A trỏ về IP của máy mới (INV gõ ở nhà đăng ký), rồi chờ hết TTL** (300 giây từ bước 1). Máy cũ đã mất, nên trỏ sớm không làm khách mất gì thêm. Chưa deploy thì edge chỉ trả lỗi, không lộ dữ liệu (ARC FB-R5-ARC-OPS-03) | INV, `hosting-plan.md` mục 10. ORC kiểm từ Mac bằng lệnh mục 1.5 | INV, ORC kiểm | Mỗi tên `1` |
| 15 | Deploy đúng tag đang chạy, kèm digest. **Chỉ sau bước 14**: smoke của `deploy.sh` kiểm chứng chỉ TLS thật (`SMOKE_INSECURE` mặc định 0), mà Caddy chỉ xin được chứng chỉ khi DNS đã trỏ về máy mới | `deploy.sh <tag> --api-digest … --web-digest …` (migrate không làm gì vì DB đã đủ). Landing: `deploy-landing.sh <tag landing> --digest …` | ORC | `deploy <tag>: ok` |
| 16 | Kiểm: số đếm, trigger, `ops-check`. Rồi INV xóa tệp khóa `age` khỏi Mac (mục 0) | `backup-counts.sql` qua `SQLRO`; INV giải mã `counts-<stamp>` trên Mac (chỉ có số) và so. `ops-check` đủ mục bằng lệnh mục 1.6 (có nhóm `systemd-journal`), gồm `db_triggers`, `email_config`, `sshkeys`, `pricegap`, `journal`, `tls` | ORC; INV phần `counts` và xóa khóa | Mọi số trùng, `EXIT: 0`; INV báo "đã xóa khóa khỏi Mac" |
| 17 | Bật timer sao lưu và ops-check | README 12 dòng "Timer production"; `systemctl list-timers 'ottimo-backup*' --all` có đúng một timer sao lưu cho mỗi stack đã dựng | ORC | `list-timers` thấy NEXT đúng |
| 18 | Chạy một lượt sao lưu tay, kéo về Mac | `backup.sh`; `pull-backups.sh` | ORC | `OK: <n> encrypted files`, lượt kéo thoát 0 |
| 19 | Cài lại bí mật tích hợp: `--set-booking-chat`, Healthchecks, cổng thanh toán | README 13.2; `integrations.md`. Lời nhắc ẩn có sẵn, không gõ vào tham số. **Nghi bị chiếm quyền: giá trị mới, thu hồi giá trị cũ** (đoạn đầu tệp) | INV | Tin thử tới đúng phòng; khi nghi bị chiếm quyền, webhook cũ bị từ chối |

**Bước 15 không đợi được DNS** (ví dụ nhà đăng ký chậm): chạy bước 15 với `SMOKE_INSECURE=1`, rồi sau khi đổi DNS chạy lại smoke (`deploy.sh` cùng tag và digest). `--insecure` chỉ đỡ khi Caddy đã có một chứng chỉ nào đó; ACME chưa xin được thì bắt tay TLS hỏng, `--insecure` không cứu. Đừng chạy lại liên tục: Let's Encrypt giới hạn số lần xác thực thất bại cho mỗi tên miền mỗi giờ. Vì vậy cách chính vẫn là DNS trước.

### 1.0 Tên tạm của máy mới (bước 2; SEC 95-09 (a))
1. **INV**, trên Mac, mở `~/.ssh/config` (TextEdit hoặc `nano ~/.ssh/config`) và thêm hai dòng. IP chỉ gõ ở đây, không gửi vào chat:
```
Host ottimo-moi
  HostName <IP của máy mới>
```
2. **ORC** kiểm, không in IP:
```bash
ssh -G ottimo-moi | awk '/^hostname /{ print "TEN TAM: " ($2 == "ottimo-moi" ? "CHUA CO" : "CO") }'
```
**Đúng là:** `TEN TAM: CO`.
3. Sau bước 18 (DNS đã đổi, mọi lệnh dùng được `desk.ottimo.vn`): INV xóa hai dòng đó khỏi `~/.ssh/config`.

### 1.1 Host key mới, so ngoài băng, quét một lần (bước 2; SEC 95-03 ý 4, 95-09 (b))
1. **INV**, trong console web của hãng (không qua SSH): `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`. Đọc 8 ký tự sau `SHA256:` cho ORC trong chat (vân tay khóa công khai, không phải bí mật).
2. **ORC**, trên Mac, quét **một lần** vào tệp, rồi in vân tay từ chính tệp đó:
```bash
mkdir -p -m 700 ~/.ottimo && ( umask 077; ssh-keyscan -t ed25519 "$(ssh -G ottimo-moi | awk '/^hostname /{ print $2 }')" 2>/dev/null > ~/.ottimo/hostkey-moi ) && echo "DONG QUET: $(grep -c . ~/.ottimo/hostkey-moi)" && ssh-keygen -lf ~/.ottimo/hostkey-moi | awk '{ print "VAN TAY QUET: " substr($2, 8, 8) }'
```
**Đúng là:** `DONG QUET: 1`, `VAN TAY QUET` trùng 8 ký tự INV đọc. Khác: **dừng**, không SSH, xóa tệp, báo SEC (có thể có kẻ đứng giữa).
3. Trùng: đưa **đúng tệp đã so** vào `~/.ssh/known_hosts`, một dòng theo IP (dùng tới bước 14) và một dòng theo `desk.ottimo.vn` (dùng sau khi DNS đổi; dòng cũ của máy đã mất bị gỡ). Không quét lần hai:
```bash
ssh-keygen -R desk.ottimo.vn >/dev/null 2>&1; cat ~/.ottimo/hostkey-moi >> ~/.ssh/known_hosts && sed 's/^[^ ]* /desk.ottimo.vn /' ~/.ottimo/hostkey-moi >> ~/.ssh/known_hosts && echo "DESK TRONG KNOWN_HOSTS: $(ssh-keygen -F desk.ottimo.vn | grep -vc '^#')"
```
**Đúng là:** `DESK TRONG KNOWN_HOSTS: 1`.
4. Bước 6, **INV** chép cùng tệp vào secret `PRODUCTION_SSH_KNOWN_HOSTS`: `pbcopy < ~/.ottimo/hostkey-moi` nếu `PRODUCTION_SSH_HOST` là IP, hoặc `sed 's/^[^ ]* /desk.ottimo.vn /' ~/.ottimo/hostkey-moi | pbcopy` nếu là `desk.ottimo.vn`. Dán vào GitHub, rồi `pbcopy </dev/null` và `rm ~/.ottimo/hostkey-moi`.

### 1.2 KEK và `id_hash_key` từ bản ngoại tuyến (bước 9; khuôn G4-8 của `rounds/round-03/outputs/OPS/b2-runbook.md` 2.2; SEC 95-03 ý 2, 95-07)
**INV gõ trên Terminal của mình**, lần lượt cho `data_kek_current` rồi `id_hash_key` (lần hai: thay `data_kek_current` bằng `id_hash_key` trong lệnh 2). Giá trị chỉ đi qua `read -rs` và ống SSH: không nằm trong tham số lệnh, lịch sử shell hay clipboard.
1. Gõ lại từ giấy, màn hình không hiện chữ, rồi so vân tay với 8 ký tự ghi trên giấy:
```bash
printf 'Khoa: '; read -rs k; echo; printf '%s' "$k" | shasum -a 256 | cut -c1-8
```
Lệch: sửa chỗ chép sai (`0/O`, `1/l/I`), gõ lại. Không đi tiếp khi chưa trùng.
2. Ghi lên máy chủ, root, tệp tạm rồi `mv` (không bao giờ ghi đè tệp đã có), in lại vân tay từ tệp trên máy chủ:
```bash
printf '%s' "$k" | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n sh -c "umask 077; set -e; d=/opt/ottimo-prod/secrets; f=\$d/data_kek_current; install -d -o root -g ottimo -m 0710 \$d; [ ! -e \$f ] || { echo DA CO TEP, DUNG; exit 1; }; cat > \$f.tmp; chown 1000:1000 \$f.tmp; chmod 0400 \$f.tmp; mv \$f.tmp \$f; printf \"VAN TAY MAY CHU: \"; sha256sum < \$f | cut -c1-8"'; unset k
```
**Đúng là:** `VAN TAY MAY CHU` trùng vân tay của lệnh 1 và của giấy. `DA CO TEP, DUNG`: `init-secrets.sh` đã chạy trước (khóa mới đã sinh). **Dừng**, báo OPS + SEC: chưa có dữ liệu mới nào dùng khóa đó thì xóa tệp và làm lại; đã có thì SEC quyết.
3. Cmd+K. Cất lại giấy. Trong chat INV chỉ nói "đã đặt hai khóa", không gửi vân tay hay giá trị.
4. Rồi bước 10, ORC chạy (không in bí mật nào):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && echo "TAO LAI KHOA: $(sudo -n /opt/ottimo-prod/infra/server/bin/init-secrets.sh | grep -cE "created.*(data_kek_current|id_hash_key)")"'
```
**Đúng là:** `TAO LAI KHOA: 0` (`init-secrets.sh` không tạo lại hai khóa đã đặt).

### 1.3 Khôi phục DB (bước 11; SEC 95-03 ý 3)
`log_error_verbosity=terse` chỉ áp cho log **của máy chủ**. Client vẫn nhận đủ DETAIL và CONTEXT, nên khi lỗi ở COPY hay ở ràng buộc, lỗi của `pg_restore` có thể mang giá trị của dòng dữ liệu. Vì vậy stderr của `pg_restore` ghi vào tệp **root 0600 trên máy chủ**, không về Terminal; màn hình chỉ có mã thoát và số dòng lỗi. **INV gõ** (khóa `age` trên Mac):
```bash
age -d -i <khóa-age> db-<stamp>.dump.age | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n sh -c "umask 077; /opt/ottimo-prod/infra/server/bin/dc exec -T postgres sh -c '\''pg_restore -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" --exit-on-error --single-transaction'\'' >/dev/null 2>/root/restore-<stamp>.err; echo \"MA THOAT: \$?\"; echo \"DONG LOI: \$(wc -l < /root/restore-<stamp>.err)\""'
```
- Trích dẫn như khối `SQLRO`: `sh -c '\''…'\''`, nên `$POSTGRES_USER` và `$POSTGRES_DB` mở **trong container**, không mở ở shell của `ottimo-admin` hay của root (bản r0 dùng nháy kép nên biến bị mở thành rỗng trước khi vào container). Root chạy `dc` để ghi được tệp lỗi trong `/root`; lệnh chỉ dùng `sh`, không cần shell của `ottimo-admin` là bash. (Đã chạy thử cách trích dẫn trên container Ubuntu 24.04 với `dash` và `dc`, `pg_restore` giả.)
- **Đúng là:** `MA THOAT: 0`, `DONG LOI: 0`.
- Khác: INV (hoặc OPS người thật) đọc tệp lỗi bằng `sudo` **trên máy chủ**, không dán vào chat; agent không đọc. Sửa xong thì xóa: `sudo -n rm -f /root/restore-<stamp>.err`. `--single-transaction` nên lỗi giữa chừng không để lại DB dở.

### 1.4 `state/privacy-notice.log` (bước 13; ARC FB-R5-ARC-OPS-04)
Không có bộ `privacy-notice-<stamp>` (stack chưa đăng phiên bản nào): bỏ qua. Có thì **INV gõ**:
```bash
age -d -i <khóa-age> privacy-notice-<stamp>.log.age | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n -u ottimo sh -c "umask 077; cat > /opt/ottimo-prod/state/privacy-notice.log" && sudo -n stat -c "%U %a" /opt/ottimo-prod/state/privacy-notice.log && echo "SO DONG: $(sudo -n -u ottimo sh -c "wc -l < /opt/ottimo-prod/state/privacy-notice.log")"'
```
**Đúng là:** `ottimo 600`, `SO DONG` trùng số dòng `backup.sh` ghi lúc sao lưu (`privacy-notice.log saved (<n> lines)` trong journal `ottimo-backup` cũ, hoặc biên bản kéo). Làm **trước** `deploy-landing.sh`: thiếu tệp mà form đang bật thì `deploy-landing.sh` cảnh báo, và đối chiếu phiên bản với DB không làm được.

### 1.5 DNS đã trỏ về máy mới (bước 14)
```bash
ip=$(ssh -G ottimo-moi | awk '/^hostname /{ print $2 }'); for h in desk.ottimo.vn staff.ottimo.vn g.ottimo.vn ottimo.vn; do echo "$h: $(dig +short "$h" @1.1.1.1 | grep -cxF "$ip")"; done; unset ip
```
**Đúng là:** mỗi tên `1`. Chưa đủ thì chờ thêm TTL, không chạy bước 15. Lệnh lấy IP từ tên tạm và chỉ in số, không in IP.

### 1.6 `ops-check` chạy tay (bước 16; ARC FB-R5-ARC-OPS-02 ý 3)
Cùng lệnh với runbook v1.0.5 W7 (unit ops-check đọc journal qua `SupplementaryGroups=systemd-journal`; chạy `sudo -u ottimo` thì `journal` FAIL "journal unreadable" đúng thiết kế):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n systemd-run --quiet --wait --pipe --uid=ottimo --gid=ottimo -p SupplementaryGroups=systemd-journal -E OTTIMO_HOME=/opt/ottimo-prod /opt/ottimo-prod/infra/server/bin/ops-check.sh; echo "EXIT: $?"'
```
- `tls` chỉ được coi là đạt sau khi DNS đã đổi (bước 14) và Caddy đã có chứng chỉ thật.
- `journal` FAIL vì một nhóm có người ngoài danh sách (thường là user mặc định của ảnh): xử lý như bước 5 (README `infra/server` 3.1): gỡ user, hoặc đặt `LOG_READER_USERS` / `SUDO_USERS` trong `.env` (bước 7 đã qua, nên sửa thẳng tệp như mục 1.8) khi SEC đồng ý.
- `journal` WARN `state/journald_since missing`: bootstrap chưa ghi tệp (gói cũ); ghi ngày hôm nay: `ssh … 'cd / && sudo -n -u ottimo sh -c '\''[ -s /opt/ottimo-prod/state/journald_since ] || date +%F > /opt/ottimo-prod/state/journald_since; cat /opt/ottimo-prod/state/journald_since'\'''`.
- `backup` FAIL là đúng cho tới bước 18.

### 1.7 Người đọc log (bước 5; ARC FB-R5-ARC-OPS-04 ý 3)
Cùng luật với mục `journal` của `ops-check`: `adm`, `systemd-journal` chỉ có `syslog`, `ottimo-admin`; `sudo`, `wheel` chỉ có `ottimo-admin`; `docker` chỉ có `ottimo`; tính cả user có nhóm chính là nhóm đó. Chỉ in số, không in tên:
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && for g in adm systemd-journal wheel sudo docker; do case $g in docker) a="ottimo" ;; sudo|wheel) a="ottimo-admin" ;; *) a="syslog ottimo-admin" ;; esac; l=$(getent group $g) || { echo "$g: KHONG CO NHOM"; continue; }; gid=$(echo "$l" | cut -d: -f3); n=0; for u in $(echo "$l" | cut -d: -f4 | tr "," " ") $(getent passwd | awk -F: -v g="$gid" "\$4 == g { print \$1 }"); do case " root $a " in *" $u "*) ;; *) n=$((n + 1)) ;; esac; done; echo "$g NGOAI DANH SACH: $n"; done; command -v getfacl >/dev/null && echo "ACL LA: $(getfacl -p --omit-header /var/log/journal 2>/dev/null | grep -E "^(default:)?(user|group):[^:]+:" | grep -Evc "^(default:)?group:(adm|wheel|systemd-journal):")" || echo "ACL LA: KHONG CO GETFACL"'
```
**Đúng là:** `adm`, `systemd-journal`, `sudo`, `docker` mỗi nhóm `NGOAI DANH SACH: 0`; `wheel: KHONG CO NHOM` hoặc `0`; `ACL LA: 0` hoặc `KHONG CO GETFACL`. `.env` mới (bước 7) lấy từ mẫu, không đặt `LOG_READER_USERS`/`SUDO_USERS` trừ khi bước 5 đã ghi lại user cần giữ, nên mặc định là đúng danh sách này.
- Khác `0` (thường là user mặc định của ảnh, ví dụ `ubuntu`): gỡ khỏi nhóm, `sudo -n gpasswd -d <user> <nhóm>`, rồi đếm lại. Muốn giữ user đó thì ghi lại, rồi đặt `LOG_READER_USERS`/`SUDO_USERS` ở bước 7, chỉ khi SEC đồng ý (`.env` chưa có ở bước 5; ARC FB-R5-ARC-OPS-10).

### 1.8 Các khóa có địa chỉ email trong `.env` (bước 7; SEC 95-09 (c))
ORC đã tạo `.env` từ mẫu (`ottimo 0600`) và điền các khóa không phải email. **INV gõ trên Terminal của mình** (agent không xem màn hình), mở tệp bằng `nano` qua SSH:
```bash
ssh -t -i ~/.ssh/ottimo_ops ottimo-admin@ottimo-moi 'cd / && sudo -n -u ottimo nano /opt/ottimo-prod/.env'
```
Điền `ACME_EMAIL`, `WEB_PUSH_SUBJECT`, `EMAIL_FROM`, `EMAIL_SMTP_USER`, `EMAIL_SHARED_MAILBOXES` (nếu dùng) và mọi khóa khác có địa chỉ email, theo tài khoản Google Workspace hoặc ghi chú giấy. Lưu bằng Ctrl+O rồi Enter, thoát bằng Ctrl+X. Trong chat INV chỉ nói "đã điền email", không gửi địa chỉ. Rồi ORC kiểm, không in dòng nào của `.env`:
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc config -q >/dev/null 2>&1 && echo "CAU HINH: OK" || echo "CAU HINH: LOI"; sudo -n stat -c "%U %a" /opt/ottimo-prod/.env'
```
**Đúng là:** `CAU HINH: OK`, `ottimo 600`. `email_config` của `ops-check` kiểm các khóa email ở bước 16.

### 1.9 Kho tệp (bước 12; SEC 95-09 (g))
Kho tệp là bản mã hóa (ảnh giấy tờ đã mã hóa bằng DEK), nhưng vẫn là dữ liệu khách, nên **INV gõ**, giải mã trên Mac và đẩy qua ống. Giống `backup.sh` nhưng theo chiều ngược: container `api` (user `node`, chủ volume, uid 1000) giải nén vào `blobdata`. Ảnh api tạo sẵn thư mục `/var/lib/ottimo/blobs` của `node`, quyền `0700`, nên volume mới có đúng chủ và quyền, không cần `chown`. Bước 10 phải xong trước (container cần các tệp bí mật). `<tag>` là tag app đang chạy (mục 0):
```bash
age -d -i ~/.ottimo/backup/ottimo-prod-backup-identity.txt blobs-<stamp>.tar.age | ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@ottimo-moi 'cd / && sudo -n sh -c "umask 077; E=/root/restore-blobs-<stamp>.err; D=/opt/ottimo-prod/infra/server/bin/dc; T=<tag>; sudo -n -u ottimo env IMAGE_TAG=\$T \$D pull --quiet api </dev/null >/dev/null 2>\$E && sudo -n -u ottimo env IMAGE_TAG=\$T \$D run --rm --no-deps -T --entrypoint tar api -C /var/lib/ottimo/blobs -xf - >/dev/null 2>>\$E; echo \"MA THOAT: \$?\"; echo \"SO TEP: \$(sudo -n -u ottimo env IMAGE_TAG=\$T \$D run --rm --no-deps -T --entrypoint sh api -c '\''find /var/lib/ottimo/blobs -type f ! -name \"*.part\" | wc -l'\'' </dev/null 2>>\$E)\"; echo \"DONG LOI: \$(grep -cvE '\''^ *(Container|Network|Volume) '\'' \$E)\""'
```
- **Đúng là:** `MA THOAT: 0`, `SO TEP: <n>` (n > 0 khi cơ sở đã lưu ảnh giấy tờ), `DONG LOI: 0`. Dòng tiến trình của compose (`Container … Creating`, `Created`…) cũng vào tệp lỗi nhưng không được đếm. Ghi `n` vào biên bản. Màn hình không có tên tệp nào: lỗi của `tar` (có thể mang tên tệp) chỉ nằm trong tệp lỗi của root.
- Khác: INV (hoặc OPS người thật) đọc tệp lỗi bằng `sudo` trên máy chủ, không dán vào chat; xong thì `sudo -n rm -f /root/restore-blobs-<stamp>.err`.
- `pull` tải đúng ảnh api theo tag. Bước 15 (`deploy.sh` có `--api-digest`) kiểm digest của ảnh đó trước khi chạy.

## 2. Mất gì dù làm đúng

- **Dữ liệu ghi sau `<stamp>`**: đơn, folio, thanh toán, yêu cầu web. Lễ tân nhập lại từ sổ giấy, Zalo, sao kê ngân hàng (sổ vận hành).
- Mọi phiên đăng nhập, vì `session_secret` mới. Mã khách đang chờ (≤ 30 phút) cũng mất. Đăng ký Web Push phải làm lại, vì có cặp VAPID mới.
- **`id_hash_key`**: khôi phục từ bản ngoại tuyến ở bước 9 (SEC 95-07, hosting-plan 8.1). **Chỉ khi INV chưa cất bản ngoại tuyến** (việc của INV cuối Round 5, cùng buổi V5-61): khóa mới làm chỉ mục mù (tìm khách theo số giấy tờ, nhận khách quay lại, chống trùng trẻ em) và năm khóa HKDF sinh từ nó không khớp dữ liệu cũ. Phần nào chỉ lưu dạng băm thì **không băm lại được**; phần có bản mã hóa thì băm lại theo runbook R2 (cần lệnh của BE). Bỏ ý này khỏi mục 2 sau khi INV báo "id_hash_key đã cất".
- Các lần xóa theo yêu cầu khách sau `<stamp>` mất cùng `purge_journal` trên máy cũ. Phải làm lại theo danh sách của lễ tân (SR-BAK-06). Các lần xóa theo hạn sẽ tự chạy lại ở đêm đầu (J16).
- Nhật ký của máy cũ (journal, gồm log container và nhật ký SSH) mất cùng máy: không nằm trong bản sao lưu (SEC: journal ở ngoài thư mục sao lưu).

## 3. Chưa diễn tập: giả định cần kiểm khi diễn tập

Các bước 9, 11, 12, 13 chưa từng chạy trên một stack thật (chỉ `restore-drill.sh` trên stack dùng một lần). Lệnh mục 1.0–1.4, 1.8, 1.9 đã viết nhưng chưa chạy trên máy chủ. `counts` chưa có số tệp kho, nên bước 12 chỉ so được "có tệp"; diễn tập so `SO TEP` với số tệp kho của `restore-drill.sh` trên cùng bản sao lưu. Bước 15 giả định `deploy.sh` nhận một DB đã ở đúng số migration, và Caddy xin được chứng chỉ trong khoảng thử lại của smoke (6 lần × 5 giây). Thời gian 3–4 giờ là ước tính. Diễn tập: B-OPS (OR-M4-drill, cần ESC).
