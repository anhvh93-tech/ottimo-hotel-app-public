# B2 trên bản thật – runbook OPS (thứ Tư 28/10/2026, 09:00–10:40)

- Round 3 · Bước: Sản xuất (chuẩn bị buổi) · Người viết: OPS, 27/10 · Ngày chạy D = thứ Hai 02/11.
- Căn cứ: `rounds/round-03/inv-golive-checklist.md` mục B2 và C; QC `rounds/round-03/qc/v1-gate-checklist.md` (G2-7, G4-5, G4-7, G4-8, G4-9, G5-5, G6-7, G7-5, G7-6); `v1-production.md` mục 16–21; `inv-production-steps.md` phần 4b, 8b; README `product/infra/server` mục 12.1; `b1-runbook.md`.
- Kiểm sẵn sàng 27/10: `v1-production.md` **mục 21**.
- Tệp này **không** chứa IP, mật khẩu, mã 2 bước, mã khôi phục, KEK, số tài khoản, email cá nhân. IP ghi `<IP-VPS>`. ORC chuyển lệnh có IP thật cho INV qua chat (IP không phải bí mật, nhưng repo công khai không ghi).
- Mọi lệnh chạy trên **Mac của INV**, trong thư mục repo `~/Desktop/hotel-app`, bằng khóa cá nhân `~/.ssh/ottimo_ops` (có passphrase, qua Keychain): tài khoản `ottimo-admin`, lệnh docker qua `sudo -u ottimo`. Không dùng khóa CI hay khóa kéo sao lưu để mở shell.

## 0. Nguyên tắc của buổi

1. **Ai gõ lệnh nào.** Lệnh in ra bí mật thì **INV tự gõ trong ứng dụng Terminal của mình**, không chạy qua agent: `production-bootstrap` (mật khẩu tạm), đọc KEK, diễn tập khôi phục (dùng khóa giải mã). Lý do:
   - mọi thứ agent chạy đều hiện trong khung chat;
   - shell của agent không phải terminal, nên wrapper `production-bootstrap.sh` từ chối.

   Checklist ghi "OPS chạy `production-bootstrap`". Thực tế: OPS đọc lệnh, INV gõ, `--operator INV`, giống B1. Điều kiện FB-R3-SEC-BOOT-02 (INV ngồi cạnh người chạy) vẫn đạt, vì INV chính là người chạy.
2. **OPS (agent) chỉ chạy** những lệnh không in bí mật: kiểm trạng thái, sao lưu, kéo bản sao lưu, gửi thư thử, truy vấn **chỉ đếm** (số người theo vai, số căn, ngày hiệu lực). Không truy vấn tên, số tài khoản, mật khẩu Wi-Fi.
3. **Agent không phải người chạy, cũng không phải người chứng kiến thủ tục 06.33** (khôi phục 2 bước khi mất cả điện thoại lẫn mã khôi phục). Nếu cần 06.33 trong buổi thì INV chạy, kèm người chứng kiến thật do INV chỉ định (như B1). OPS/SEC/ORC chỉ đọc lệnh và kết quả. Không có người chứng kiến thì không chạy: xem kế hoạch dự phòng mục 3.
4. **Nhân viên tập trên staging** (`desk.staging.ottimo.vn`, tài khoản tập riêng, QR không chuyển tiền). Trên Desk thật, trước 02/11, nhân viên **chỉ đăng nhập, đổi mật khẩu tạm, đăng xuất**: không tạo đơn, không thu tiền thử, vì dữ liệu thật chỉ ghi thêm, không xóa được. Ngoại lệ duy nhất: đơn thử "TEST" của INV ở C1 (29/10).
5. **Trong buổi không deploy gì.** ORC không đẩy tag, không duyệt lượt "deploy staging" hay "Release". (CI `main` đang đỏ, mục 21.5, nên cũng không có gì để deploy.)
6. Không ai chụp màn hình có mật khẩu, mã QR 2 bước, mã khôi phục, KEK hay số tài khoản. Ảnh minh chứng cho QC chỉ chụp kết quả kiểm (dòng `ĐẠT`, bảng đếm).

## 1. Trước buổi

### 1.1 OPS, 08:30–08:50 (chỉ đọc, agent chạy)

| Kiểm | Đạt khi |
|---|---|
| `dc ps` production | api, web, landing healthy; worker, postgres Up; image `sha-70fe734e9077` |
| `printenv` api/worker | `APP_ENV=production`, `MFA_ENFORCED=true`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0` |
| `/health` nội bộ; `https://desk|staff|g.ottimo.vn/` | `{"status":"ok","db":"ok"}`; 200 / 200 / 200 |
| DB | `app_user` 0, `property` 0, `room` 0. Có người dùng → **DỪNG**, báo ORC (ai đó đã chạy bootstrap) |
| Sao lưu đêm 28/10 03:0x | `ottimo-backup@ottimo-prod` thoát 0, `ops-check` 7/7 |
| RAM / đĩa | RAM khả dụng > 50 %, đĩa < 50 % |
| SMTP | `mail-test` chế độ chỉ kiểm → `verified` |
| GitHub | Không có lượt Release / deploy nào đang chờ duyệt |
| Mac | Docker Desktop chạy; image `ghcr.io/anhvh93-tech/ottimo-api:sha-70fe734e9077` và `ottimo-drill-runner:local` có sẵn (đã kéo/dựng 27/10) |

ORC báo INV "B2 sẵn sàng" lúc 08:50, hoặc báo dòng nào chưa đạt.

### 1.2 INV mang theo / chuẩn bị

- Mac này (sạc đầy), Terminal mở, Docker Desktop chạy. Passphrase khóa `ottimo_ops` (nếu Keychain hỏi).
- Điện thoại có **app xác thực** (A1), đã sạc. Quản lý thật (nếu có) mang điện thoại đã cài app xác thực.
- **Giấy + bút** cho 10 mã khôi phục (chép 2 bản, cất 2 nơi), 2 phong bì. Giấy niêm phong hoặc USB mã hóa cho **KEK**. Chỗ cất: két.
- **Trình quản lý mật khẩu** mở được: lưu mật khẩu Desk mới; có mục "OTTIMO – khóa sao lưu production" (A8 / phần 9.3).
- **Tài khoản nhận VietQR thật**: ngân hàng, số tài khoản, tên chủ tài khoản đúng như trên app ngân hàng. Chỉ gõ vào Desk.
- **Mật khẩu Wi-Fi** mạng "OTTIMO BOUTIQUE STAY".
- **Câu trả lời 8 câu DOM (A3) + hạn lưu (A4)**, bảng giá niêm yết từng căn, giá OTA nền (`ota_base_rate`), hạng công khai của 6 căn Studio.
- **Danh sách nhân viên (A2)**: tên hiển thị, vai, tên đăng nhập dự kiến. Giấy + phong bì để ghi mật khẩu tạm cho từng người.
- Quyền mở hộp thư `info@ottimo.vn` (trên điện thoại hoặc trình duyệt khác).
- Nên có: số điện thoại **người chứng kiến 06.33** (người đã chứng kiến ở B1), phòng khi phải dùng 06.33 (mục 3).
- Tùy chọn: địa chỉ ping Healthchecks.io và webhook Google Chat (A7), nếu đã tạo (mục 2.7).

### 1.3 INV làm trước 09:00

1. Bật Docker Desktop. Mở Terminal, thử SSH (thay `<IP-VPS>`): `ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> true`. Không báo lỗi là được.
2. Kiểm khóa sao lưu production. Finder → Go → Go to Folder… → `~/.ottimo/backup`. Phải có `ottimo-prod-backup-identity.txt` **và** một bản trong trình quản lý mật khẩu. Nếu đã xóa khỏi Mac sau A8 thì không sao: mang trình quản lý mật khẩu, mục 2.5 có cách đặt lại tạm.
3. Có sẵn câu trả lời A3/A4. Nếu chưa trả lời trong chat, phần 3 sẽ kéo dài thêm khoảng 10 phút.
4. Không bấm duyệt email "Review deployments" nào trong sáng 28/10.

## 2. Kịch bản theo phút

Người có mặt: INV; quản lý thật (nếu có); ORC, OPS, SEC, QA (agent, qua chat). Giờ VN.

| Giờ | Phần | Ai | Gỡ dòng QC |
|---|---|---|---|
| 09:00–09:20 | 1. Khởi tạo + tài khoản chủ + 2 bước | INV gõ lệnh, OPS đọc lệnh và kiểm | G2-7 (phần OWN) |
| 09:20–09:30 | 2. KEK ra bản ngoại tuyến | INV | G4-8 |
| 09:30–09:50 | 3. Tài khoản nhận VietQR, Wi-Fi, giá, tham số | INV trên Desk; OPS kiểm ngày hiệu lực. QA + SEC bắt đầu kiểm production song song | G7-6, G6-7 |
| 09:50–10:10 | 4. Tài khoản nhân viên; quản lý đăng ký 2 bước | INV, quản lý | G2-7 (phần MGR) |
| 10:10–10:25 | 5. Diễn tập khôi phục | OPS sao lưu + kéo về; INV mở khóa và chạy 1 lệnh | G4-7, G4-5 |
| 10:25–10:40 | 6. Thư thử, đăng xuất/đăng nhập lại, QA + SEC báo kết quả | INV, QA, SEC | G4-9, G5-5, G7-5 |

### 2.1 Phần 1 – 09:00–09:20: khởi tạo production + tài khoản chủ (G2-7)

**INV gõ trong Terminal** (từng dòng; dòng thứ 4 có **dấu cách ở đầu**):
```bash
ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS>
export HISTCONTROL=ignorespace
cd /tmp
 sudo -u ottimo /opt/ottimo-prod/infra/server/bin/production-bootstrap.sh --owner-username <tên đăng nhập> --owner-name "<tên hiển thị>" --operator INV
```
- Tên đăng nhập: INV tự chọn. Không dùng email cá nhân, không bắt đầu bằng `qa.`.
- Màn hình in một dòng `ok` cùng **mật khẩu tạm 24 ký tự** (chỉ một lần).
- **Không** chạy trong tmux/screen/`script`, không thêm `| tee`. Wrapper chặn pipe và tmux, riêng `script` thì chỉ chặn bằng thủ tục: SEC nhìn màn hình xác nhận.

**Màn hình INV thấy, rồi làm:**
1. Mở `https://desk.ottimo.vn` (Safari/Chrome), đăng nhập bằng tên vừa đặt và mật khẩu tạm (gõ, hoặc chép-dán trên chính Mac).
2. Về Terminal: `clear` → `history | tail -3`. Nếu thấy dòng có `production-bootstrap` thì `history -d <số>`. Rồi `exit`, và bấm **Cmd+K**.
3. Desk buộc **đổi mật khẩu** → đặt mật khẩu mới, lưu vào trình quản lý mật khẩu mục "OTTIMO Desk – production".
4. Desk buộc **đăng ký 2 bước** → quét QR bằng app xác thực, nhập mã 6 số.
5. Chép **10 mã khôi phục thật** ra giấy, 2 bản, cho vào 2 phong bì, cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không lưu trên điện thoại. SEC chứng kiến qua màn hình, không xem mã.

**OPS kiểm (agent, chỉ đếm):**
```sql
SELECT (SELECT count(*) FROM property) AS properties, (SELECT count(*) FROM room) AS rooms;
SELECT r.role, count(*) AS users, count(*) FILTER (WHERE u.mfa_enabled) AS mfa_on,
       count(*) FILTER (WHERE u.must_change_password) AS temp_pw
  FROM app_user u JOIN user_property_role r ON r.user_id = u.id AND r.revoked_at IS NULL
 GROUP BY r.role ORDER BY r.role;
SELECT action, count(*) FROM audit_event
 WHERE action IN ('production.bootstrapped','user.created_by_operator','mfa.enrolled') GROUP BY action ORDER BY action;
```
Chạy bằng lệnh của B1 mục 2.3 bước 6 (`dc exec -T postgres … psql -X -tA`), đổi `/opt/ottimo` thành `/opt/ottimo-prod`. Truy vấn thứ hai đã thử trên staging 27/10.

**Đạt khi:**
- `properties 1`, `rooms 10`;
- `owner|1|1|0`: 1 chủ, đã bật 2 bước, không còn mật khẩu tạm;
- audit có đủ `production.bootstrapped`, `user.created_by_operator`, `mfa.enrolled`.

Quá 09:25 vẫn chưa đạt: xem mục 3, dòng P1-a đến P1-d.

### 2.2 Phần 2 – 09:20–09:30: KEK ra bản ngoại tuyến (G4-8)

KEK (`data_kek_current`, 44 ký tự) là khóa mã hóa ảnh giấy tờ khách. Phần này làm **trước** khi có dữ liệu khách thật.

**INV gõ trong Terminal** (một lệnh, chép nguyên):
```bash
ssh -t -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> "sudo cat /opt/ottimo-prod/secrets/data_kek_current; echo; printf 'fingerprint: '; sudo sh -c 'tr -d \"\\n\" < /opt/ottimo-prod/secrets/data_kek_current | sha256sum | cut -c1-8'"
```
1. Màn hình in 44 ký tự (kết thúc bằng `=`) và một dòng `fingerprint: xxxxxxxx`.
2. INV chép 44 ký tự ra giấy niêm phong (hoặc USB mã hóa). Chữ dễ nhầm (`0/O`, `1/l/I`) thì viết rõ. Ghi riêng 8 ký tự fingerprint cạnh đó.
3. **Kiểm bản chép** – gõ lại từ giấy, màn hình không hiện chữ:
   ```bash
   printf 'KEK: '; read -rs k; echo; printf '%s' "$k" | shasum -a 256 | cut -c1-8; unset k
   ```
   Kết quả phải **trùng** dòng fingerprint. Lệch thì sửa chỗ chép sai rồi thử lại.
4. Cmd+K. Niêm phong, cất két. Không chụp ảnh, không gửi chat.

Lệnh fingerprint đã thử trên tệp KEK của **staging** 27/10 (đúng dạng 44 ký tự, không có xuống dòng ở cuối).

**Đạt khi** hai fingerprint trùng nhau. INV nói "KEK đã cất" trong chat, **không** gửi fingerprint.

### 2.3 Phần 3 – 09:30–09:50: tài khoản nhận tiền, Wi-Fi, giá, tham số (G7-6, G6-7)

INV làm trên Desk:
1. **"Tài khoản nhận chuyển khoản"**: gõ số tài khoản 2 lần, tên chủ tài khoản đúng như ngân hàng, xác thực lại bằng mã 2 bước. Hiệu lực **từ ngày mai 29/10**. Hôm nay QR chưa trỏ về tài khoản này là đúng.
2. **Mật khẩu Wi-Fi** "OTTIMO BOUTIQUE STAY".
3. **Giá niêm yết từng căn**, `ota_base_rate`, hạng công khai 6 căn Studio, và **tham số** theo A3: phí từng kênh OTA, VAT 8 %, giá điện nước, Tết 2027, các mục chờ luật sư/kế toán. Hạn lưu giấy tờ theo A4: ảnh 1 ngày sau trả phòng, khai báo chưa xong 2 ngày, hồ sơ điền sẵn 3 tháng. DOM đọc lại bảng cùng INV.

**OPS kiểm (agent, không đọc giá trị):**
```sql
SELECT key, effective_from FROM config_parameter WHERE key = 'payment_receiving_account' ORDER BY effective_from;
SELECT payload->>'template' AS template, status, left(coalesce(last_error,''),40) AS err, count(*)
  FROM outbox_message WHERE topic = 'staff.email' GROUP BY 1,2,3;
```
**Đạt khi:** có 1 dòng `payment_receiving_account|2026-10-29`; DOM xác nhận tham số khớp A3/A4.

Dòng outbox thư `receiving_account_changed` sẽ là `dead|NO_RECIPIENT`. Đây là **lỗ hổng đã biết** (mục 21.4): tài khoản trên Desk chưa có email nên thư "Security notice" không có người nhận. Không chặn buổi; ORC/SEC quyết trước 09:00 có vá tạm hay không.

**Song song 09:30–10:25 (QA, SEC, từ ngoài, không đăng nhập):**
- QA chạy smoke production phần không cần tài khoản: Desk, PWA `staff`, trang khách `g` mở được; header; `/health` và `/v1/*` lạ trả 404; `http` → `https`.
- SEC chạy SEC-G1/G2 (`s3-SEC.md` 9.5): header, TLS, edge giới hạn kết nối, cổng mở. OPS đã kiểm 27/10 (mục 21.1) để SEC đối chiếu.

### 2.4 Phần 4 – 09:50–10:10: tài khoản nhân viên (G2-7 phần MGR)

1. INV vào **"Người dùng & vai"**, tạo tài khoản theo A2. Mỗi tài khoản Desk hiện một mật khẩu tạm: INV chép ra giấy, cho vào phong bì ghi tên người, **đưa tận tay**. Không gửi Zalo/chat.
2. **Quản lý thật (nếu có mặt):**
   - đăng nhập ngay trên điện thoại hoặc máy của mình;
   - đổi mật khẩu, đăng ký 2 bước, cất 10 mã khôi phục như phần 1;
   - đăng xuất.
3. **Nhân viên khác không đăng nhập hôm nay.** Họ nhận phong bì ở buổi đào tạo C3a (31/10–01/11) hoặc C3 (D−1). Trên Desk thật họ chỉ đăng nhập, đổi mật khẩu, đăng xuất. Thao tác thì tập trên staging.
4. Quản lý vắng mặt: tài khoản quản lý vẫn tạo. Lần đăng nhập đầu Desk buộc đăng ký 2 bước, nên không có lỗ hổng. G2-7 phần MGR đạt khi người đó đăng ký xong (trước D); OPS kiểm lại bằng cùng truy vấn.

**OPS kiểm:** truy vấn vai ở 2.1. **Đạt khi:**
- `owner|1|1|0`;
- `manager|n|n|0` nếu quản lý có mặt;
- các vai khác có `temp_pw` = số người (chưa đăng nhập).

### 2.5 Phần 5 – 10:10–10:25: diễn tập khôi phục (G4-7, G4-5)

Diễn tập trên **bản sao lưu chụp ngay sau phần 1–4**, để bản khôi phục có dữ liệu thật của buổi (cơ sở, người dùng, khóa dữ liệu). Bản 27/10 10:43 (mục 21.2) chỉ là đường dự phòng: lược đồ đúng rc.3 nhưng DB trống. Bản đêm 27/10 03:02 **không dùng được**: chụp trước rc.3 (64 migration, image rc.3 cần 65).

**10:10 – OPS (agent):**
1. `sudo systemctl start ottimo-backup@ottimo-prod.service` → nhật ký `OK: … encrypted files`, ghi lại mã giờ (`db-20261028T03….dump.age`).
2. Kéo về Mac bằng lệnh `v1-production.md` 19.2 (container `alpine:3.20`, khóa `ottimo_backup_pull`). Đạt khi in `pull-backups: N encrypted files`, không có `checksum mismatch`.
3. Gửi **thư thử 8b** ngay lúc này để thư kịp tới trước phần 6 (lệnh ở 2.6).

**10:13 – INV mở khóa và chạy:**
- Nếu tệp `~/.ottimo/backup/ottimo-prod-backup-identity.txt` đã xóa sau A8:
  1. tạo lại từ trình quản lý mật khẩu (TextEdit → Format → Make Plain Text → dán → lưu đúng tên ở `~/.ottimo/backup`);
  2. chạy `chmod 600 ~/.ottimo/backup/ottimo-prod-backup-identity.txt`;
  3. xóa lại sau bước dưới.
- Chạy một lệnh (chép nguyên khối):
  ```bash
  mkdir -p ~/.ottimo/drills && chmod 700 ~/.ottimo/drills
  cd ~/Desktop/hotel-app && bash -c 'P=$PWD/product; B=$HOME/.ottimo/backups/ottimo-prod; K=$HOME/.ottimo/backup/ottimo-prod-backup-identity.txt
  docker run --rm --tmpfs /tmp -v /var/run/docker.sock:/var/run/docker.sock -v "$P:$P:ro" -v "$B:/backups:ro" -v "$K:/k/id:ro" -w "$P" \
    ottimo-drill-runner:local infra/server/bin/restore-drill.sh --identity /k/id --from /backups \
    --api-image ghcr.io/anhvh93-tech/ottimo-api:sha-70fe734e9077' 2>&1 | grep -v "requested image" | tee ~/.ottimo/drills/restore-prod-20261028.txt
  ```
- Ghi chú kỹ thuật:
  - Lệnh chạy `bash -c` vì Terminal của Mac dùng zsh, mà zsh hiểu sai `$P:ro`.
  - Mac không có `age`. `ottimo-drill-runner:local` là image dựng 27/10 từ `alpine:3.20` + `bash age openssl coreutils diffutils docker-cli`. Nếu mất image: `printf 'FROM alpine:3.20\nRUN apk add --no-cache bash age openssl coreutils diffutils docker-cli\n' | docker build -t ottimo-drill-runner:local -`.
  - Bản giải mã chỉ nằm trong `/tmp` (tmpfs, RAM) của container chạy một lần, mất khi container dừng. Môi trường khôi phục tự xóa.
  - Image api là amd64, chạy giả lập trên Mac arm64. Đã thử trọn đường này 27/10 trên bản sao lưu **tổng hợp** (DB giả, khóa `age` dùng một lần): **ĐẠT, 5 giây, khớp 100 %, 65 migration** (mục 21.3).

**Biên bản** (tệp `~/.ottimo/drills/restore-prod-20261028.txt`, chỉ có số đếm, không có dữ liệu khách). OPS đọc tệp và dán vào `v1-production.md` mục 22.

**Đạt khi:**
- `Bản sao lưu:` đúng mã giờ OPS ghi lúc 10:10;
- `Kết quả: ĐẠT – /health ok`, `khớp 100 %`;
- `migrations 65`, `properties 1`, `users` = 1 + số nhân viên vừa tạo;
- `reservations 0`, `payments 0`;
- `data_keys_live` ≥ 1 (sau khi bật 2 bước / lưu tài khoản nhận tiền; số chính xác lấy từ tệp counts, script so khớp tự động).

G4-5 đạt cùng lúc: timer chạy (bản đêm 27/10 và 28/10) + bản kéo ra ngoài máy chủ.

### 2.6 Phần 6 – 10:25–10:40: thư thử, đăng nhập lại, QA + SEC (G4-9, G5-5, G7-5)

**Thư thử (OPS gửi lúc ~10:12, agent):**
```bash
ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> 'cd /tmp && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc run --rm --no-deps -T -e MAIL_TEST_TO=info@ottimo.vn --entrypoint node worker --input-type=module -' < product/infra/server/mail-test.mjs
```
- Script in `mail-test: sent`.
- **INV mở hộp thư `info@ottimo.vn`** (xem cả Spam), tìm thư "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email". Vào Spam thì ghi lại để kiểm SPF/DKIM sau. G4-9 đạt khi **có thư**.

**Đăng nhập lại (G2-7, SEC 06.4):** INV bấm Đăng xuất trên Desk → đăng nhập lại bằng mật khẩu mới → Desk **đòi mã 6 số** → nhập từ app → vào được. Rồi đăng xuất trên máy của buổi nếu máy này không phải máy quầy.

**QA (G5-5):** báo kết quả smoke production. Thêm phần cần đăng nhập: INV vừa đăng nhập được, Desk hiện **10 căn**.

**SEC (G7-5):** báo SEC-G1/G2 trên production.

**10:40 – ORC chốt.** Đọc to bảng 6 phần (đạt / chưa đạt). Phần nào chưa đạt thì làm theo mục 3.

### 2.7 Dư thời gian (tùy chọn): gắn báo động A7 (G4-10)

Chỉ làm khi INV đã tạo Healthchecks.io + Google Chat **và** buổi còn ≥ 5 phút. Không thì để sau buổi; G4-10 chặn ngày chạy, không chặn B2.

INV gõ (địa chỉ dán vào dấu nhắc ẩn, không hiện lên màn hình, không vào chat):
```bash
ssh -t -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> 'read -rsp "Healthchecks ping URL: " hb; echo; read -rsp "Google Chat webhook URL: " wh; echo; sudo -u ottimo cp -p /opt/ottimo-prod/.env /opt/ottimo-prod/state/env.before-alerts.$(date +%Y%m%d-%H%M%S) && printf "HEARTBEAT_URL=%s\nALERT_WEBHOOK_URL=%s\n" "$hb" "$wh" | sudo -u ottimo tee -a /opt/ottimo-prod/.env >/dev/null && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh | tail -3'
```
- Chỉ thêm 2 dòng vào cuối `.env`. `ops-check` đọc dòng cuối cùng nên dòng trống cũ không ảnh hưởng.
- Không cần dựng lại container.
- Đạt khi Healthchecks.io hiện "up" sau ≤ 30 phút.
- UptimeRobot (5 địa chỉ) INV tự tạo trên web, không đụng máy chủ.

## 3. Dự phòng – dừng ở đâu, quay lui thế nào

Nguyên tắc: **phần 1–3 phải xong trong ngày 28/10** (tài khoản nhận tiền có hiệu lực từ hôm sau, C1 29/10 cần nó). Phần 5–6 dời được sang chiều 28/10 hoặc 29/10 mà không ảnh hưởng ngày D. Hạn chót cho cả B2: **31/10** (để C1 làm được trước D).

| # | Tình huống | Làm gì | Dừng / quay lui |
|---|---|---|---|
| T-0 | SSH không vào được VPS (mạng, VPS sập) | OPS thử lại từ mạng khác (điện thoại phát Wi-Fi); xem trạng thái Nhân Hòa | Không vào được trước 09:30 → hoãn cả buổi sang chiều/29/10. Không làm phần nào trên Desk khi chưa chạy được phần 1 |
| T-1 | Kiểm 08:30 thấy DB **đã có** người dùng | **Dừng.** OPS đọc audit `production.bootstrapped` (giờ, operator) | ORC + SEC xác định ai chạy. Không chạy lại bootstrap (lệnh tự từ chối). Nếu không rõ nguồn gốc: làm lại từ DB trống (P1-c) |
| P1-a | Wrapper báo `api is not running` hoặc `run from an interactive terminal` | Kiểm `dc ps`. Lỗi terminal: gõ lại trong Terminal thật, không qua tmux/`script`/pipe | Chạy lại được, lệnh chưa ghi gì |
| P1-b | `refused: …` (đã khởi tạo) hoặc lỗi giữa chừng | Lỗi giữa chừng: giao dịch đã hủy, chạy lại. `refused`: đã có cơ sở → T-1 | – |
| P1-c | Mật khẩu tạm bị mất (đóng Terminal trước khi đăng nhập), hoặc INV **không đăng ký xong 2 bước trong buổi** | Chưa có dữ liệu nào khác nên **làm lại từ DB trống** (README 12.1). INV quyết. INV gõ: `sudo -u ottimo …/dc rm --stop --force api worker web postgres` → `sudo docker volume rm ottimo-prod_pgdata ottimo-prod_blobdata` → `sudo -u ottimo /opt/ottimo-prod/infra/server/bin/deploy.sh sha-70fe734e9077 --api-digest <api= trong state/digests/sha-70fe734e9077> --web-digest <web=…>` → chạy lại phần 1 | Mất ~10 phút. **Không** `dc down` (sẽ gỡ cả landing `ottimo.vn`). Chỉ dùng được khi chưa có dữ liệu thật; sau phần 3 thì phải nhập lại tài khoản nhận tiền và tham số |
| P1-d | INV mất/lỗi điện thoại **sau** khi đăng ký 2 bước, còn mã khôi phục | Đăng nhập bằng 1 mã khôi phục → Desk cho đăng ký lại 2 bước (mã đó hết giá trị) | Không cần 06.33 |
| P1-e | Mất cả điện thoại lẫn mã khôi phục | Trước phần 3: P1-c (đơn giản hơn 06.33). Sau phần 3: **06.33** – INV chạy, người chứng kiến thật INV chỉ định cấp mã phiếu, như B1 mục 3. Agent **không** chạy, **không** chứng kiến | Không có người chứng kiến → dừng, hẹn lại. Tài khoản vẫn an toàn (khóa ngoài, không ai vào được) |
| P2 | Fingerprint KEK không trùng sau 2 lần chép | Chép lại cả dòng trên giấy mới, hủy giấy cũ (xé nhỏ) | Không chụp ảnh "cho nhanh". Quá 09:35 thì sang phần 3, quay lại cuối buổi. **Không** nhập giấy tờ khách nào trước khi G4-8 đạt |
| P3-a | Desk không cho lưu tài khoản nhận tiền (lỗi 2 bước, lỗi kiểm số) | Đọc thông báo lỗi. Lỗi mã 2 bước thì đợi mã mới. Lỗi khác: chụp màn hình **che số tài khoản**, gõ `/feedback P0 …` | Phải xong trong 28/10. Không xong → ORC báo: C1 và ngày D có thể phải dời 1 ngày |
| P3-b | Lỡ nhập sai tài khoản hoặc tên | Nhập lại ngay trên cùng màn với hiệu lực 29/10 (ghi đè dòng cùng ngày), hoặc hủy dòng đã lên lịch rồi nhập lại. OPS kiểm: còn đúng 1 dòng hiệu lực 29/10. Mỗi lần đổi có thêm audit. Không chắc thì ORC hỏi BE trước khi rời buổi | C1 (29/10) là lần kiểm cuối: quét QR, xem tên |
| P3-c | Thiếu câu trả lời A3/A4 | Nhập phần đã có. Phần thiếu để mặc định của `production-defaults.ts` (DOM đã đối chiếu). DOM ghi danh sách còn treo | Không chặn D nếu DOM xác nhận mặc định chấp nhận được |
| P4 | Quản lý không đăng ký được 2 bước | Như P1-d/P1-e cho tài khoản quản lý. Tài khoản quản lý chưa 2 bước chỉ vào được màn đăng ký: không rủi ro | Hoàn tất trước D; OPS kiểm lại |
| P5-a | `restore-drill`: `KHÔNG ĐẠT` / `checksum mismatch` / api không lên | Không ảnh hưởng production (môi trường dùng một lần). OPS lưu tệp biên bản, chạy lại sau buổi với `--keep` để điều tra | G4-7 còn mở → QC có thể chấm ĐẠT CÓ ĐIỀU KIỆN; phải đạt trước D. Không xóa bản sao lưu nào |
| P5-b | Không có khóa sao lưu (không trên Mac, không trong trình quản lý mật khẩu) | **Dừng phần 5.** Mọi bản sao lưu production hiện có coi như không đọc được. OPS: INV sinh cặp khóa mới (như 26/10), thay `recipients.txt`, sao lưu ngay, diễn tập lại | G4-6 và G4-7 không đạt. ORC báo INV ngay trong buổi |
| P5-c | Kéo bản sao lưu lỗi | Thử lại 1 lần. Nếu vẫn lỗi: diễn tập trên bản 27/10 10:43 đã có trên Mac (DB trống, đúng lược đồ) để chứng minh đường ống, rồi làm lại trên bản có dữ liệu sau buổi | Ghi rõ trong biên bản bản nào được dùng |
| P6-a | `mail-test: failed (<mã>)`, hoặc 15 phút không có thư (cả Spam) | OPS chạy lại chế độ chỉ kiểm. Mã `550 … relay`: kiểm IP trong cài đặt relay (8a) | G4-9 còn mở, không chặn phần khác. Thử lại chiều 28/10 |
| P6-b | Đăng nhập lại không đòi mã 6 số | **Dừng, báo SEC** (2 bước bắt buộc phải chạy) | Chặn D tới khi SEC xác nhận |
| X | Production lỗi giữa buổi (5xx, container khởi động lại) | OPS xem `dc logs --tail 100 api worker`. Thường chỉ cần `dc up -d --no-deps <dịch vụ>` | **Không** `rollback.sh` về `sha-29636757822b`: bản đó chưa có migration thứ 65. Muốn quay lui image thì BE/ARC xác nhận trước |
| Y | Quá 10:40 | Ưu tiên giữ phần 1–3 trọn vẹn. Phần 5: INV chạy lệnh 2.5 bất cứ lúc nào trong ngày, OPS đọc tệp biên bản. Phần 6: INV tự kiểm hộp thư và đăng nhập lại | – |

## 4. Ngay sau B2

| Khi nào | Ai | Việc | Gỡ dòng |
|---|---|---|---|
| 28/10, 10:40–11:30 | OPS | Ghi biên bản B2 vào `v1-production.md` mục 22: giờ từng phần, kết quả truy vấn đếm, biên bản diễn tập, `mail-test`. Không ghi tên, số, mã. README `infra/server` mục 12: "Diễn tập khôi phục production: 28/10/2026" | G4-7 |
| 28/10 chiều | ORC → QC | **QC chấm cổng v1.0** bằng bằng chứng của buổi: biên bản OPS, báo cáo QA smoke, SEC-G1/G2, xác nhận của INV (KEK, mã khôi phục, thư thử) | Cổng v1.0 |
| 28/10 chiều | ORC | Cập nhật `inv-golive-checklist.md`: tick B2 phần đã đạt; dòng chưa đạt kèm hạn | – |
| 29/10 sáng | OPS | Bản sao lưu đêm 29/10 03:0x có dữ liệu B2 (`ops-check` 7/7). Kéo về Mac. **J16 đã chạy lần đầu** cho cơ sở mới: `ops-check j16` ok trước ~11:00 29/10 (26 giờ sau phần 1) | G4-5 |
| **29/10** | INV | **C1 – kiểm VietQR**: tạo một đơn thử ghi chú "TEST", quét QR bằng app ngân hàng, xem **tên chủ tài khoản đúng**, **không chuyển tiền**, hủy đơn. Tên sai → `/feedback P0`. Đơn "TEST" đã hủy vẫn nằm trong dữ liệu (chỉ ghi thêm). DATA loại khỏi báo cáo | G7-6 (xác nhận cuối) |
| 29/10–01/11 | INV + đội | Đào tạo C3a **trên staging**, tài khoản tập riêng. Desk thật: nhân viên chỉ đăng nhập / đổi mật khẩu / đăng xuất | – |
| Trước D | INV + OPS | A7 báo động (G4-10, chặn D). A10 danh sách chuyển đổi. A12 phần (1) OTA 12:00. Quản lý chưa đăng ký 2 bước thì đăng ký | G4-10 |
| Trước D | ORC/SEC/BE | Quyết lỗ hổng email "Security notice" không có người nhận (mục 21.4) | – |
| Sau B2, ngoài giờ khách (không phải D−1/D) | OPS | Làm mới bundle `infra/` production lên `main` (có bước `appconfig`, mục 21.5); xóa 2 bản `state/env.before-*` cũ khi SEC-G1/G2 xong (mục 19.1) | – |
