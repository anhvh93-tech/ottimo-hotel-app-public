# B2 trên bản thật – runbook OPS (thứ Tư 28/10/2026, 09:00–10:40)

- Round 3 · Bước: Sản xuất (chuẩn bị buổi) · Người viết: OPS, 27/10 · Ngày chạy D = thứ Hai 02/11.
- Căn cứ: `rounds/round-03/inv-golive-checklist.md` mục B2 và C; QC `rounds/round-03/qc/v1-gate-checklist.md` (G2-7, G4-5, G4-7, G4-8, G4-9, G5-5, G6-7, G7-5, G7-6); `v1-production.md` mục 16–21; `inv-production-steps.md` phần 4b, 8b; README `product/infra/server` mục 12.1; `b1-runbook.md`.
- Kiểm sẵn sàng 27/10: `v1-production.md` **mục 21**. Sửa chiều 27/10 theo SEC `rounds/round-03/reviews/SEC-on-B2-readiness.md`: B2 không vá email chủ (BUG-R3-032); xử lý khóa sao lưu (2.5, 1.3); Wi-Fi bỏ qua nếu Desk chưa có ô (BUG-R3-021).
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
- **Mật khẩu Wi-Fi** mạng "OTTIMO BOUTIQUE STAY". Chỉ dùng nếu Desk đã có ô nhập: BUG-R3-021, xem 2.3.
- Phong bì **riêng** cho bản ngoại tuyến khóa sao lưu (A8), **không** chung phong bì với KEK.
- **Câu trả lời 8 câu DOM (A3) + hạn lưu (A4)**, bảng giá niêm yết từng căn, giá OTA nền (`ota_base_rate`), hạng công khai của 6 căn Studio.
- **Danh sách nhân viên (A2)**: tên hiển thị, vai, tên đăng nhập dự kiến. Giấy + phong bì để ghi mật khẩu tạm cho từng người.
- Quyền mở hộp thư `info@ottimo.vn` (trên điện thoại hoặc trình duyệt khác).
- Nên có: số điện thoại **người chứng kiến 06.33** (người đã chứng kiến ở B1), phòng khi phải dùng 06.33 (mục 3).
- Tùy chọn: địa chỉ ping Healthchecks.io và webhook Google Chat (A7), nếu đã tạo (mục 2.7).

### 1.3 INV làm trước 09:00

1. Bật Docker Desktop. Mở Terminal, thử SSH (thay `<IP-VPS>`): `ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> true`. Không báo lỗi là được.
2. Kiểm khóa sao lưu production. Finder → Go → Go to Folder… → `~/.ottimo/backup`. Phải có `ottimo-prod-backup-identity.txt` (B2 diễn tập bằng **đúng tệp này**, SEC 27/10) **và** một bản trong trình quản lý mật khẩu. Nếu tệp đã bị xóa khỏi Mac thì báo ORC trước 08:50. OPS sẽ dùng đường "khóa qua stdin" ở 2.5 (đã thử 27/10 bằng khóa tổng hợp). **Không** tạo lại tệp bằng TextEdit.
3. **FileVault** (SEC 27/10 mục 2.2). Terminal: `fdesetup status` → phải in `FileVault is On.` Báo trong chat "FileVault bật" hoặc "FileVault tắt", không gửi ảnh. Nếu tắt: B2 vẫn làm, nhưng **trong ngày 28/10** phải bật FileVault, hoặc xóa cả khóa lẫn `~/.ottimo/backups/ottimo-prod` khỏi Mac sau diễn tập.
4. **Time Machine.** Kiểm Mac có dùng không: `tmutil destinationinfo`. Ra `No destinations configured` thì bỏ qua bước này. Có ổ đích thì:
   - chạy `tmutil addexclusion ~/.ottimo`;
   - xem ổ có mã hóa không: System Settings → General → Time Machine, ổ đĩa ghi "Encrypted". Ổ **không** mã hóa mà đã sao lưu `~/.ottimo` từ 26/10 → báo SEC (phải thay cặp khóa sao lưu, P5-b).
5. Có sẵn câu trả lời A3/A4. Nếu chưa trả lời trong chat, phần 3 sẽ kéo dài thêm khoảng 10 phút.
6. Không bấm duyệt email "Review deployments" nào trong sáng 28/10.

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
2. **Mật khẩu Wi-Fi** "OTTIMO BOUTIQUE STAY". **Bỏ qua nếu Desk chưa có ô nhập.** BUG-R3-021: rc.3 chỉ sửa được `property.wifi_info_i18n` trong DB; FE đang đánh giá. **Không ghi DB tay.** Wi-Fi nhập khi bản có ô lên production. Tới lúc đó, lễ tân báo Wi-Fi bằng thẻ trong căn hoặc nói trực tiếp.
3. **Giá niêm yết từng căn**, `ota_base_rate`, hạng công khai 6 căn Studio, và **tham số** theo A3: phí từng kênh OTA, VAT 8 %, giá điện nước, Tết 2027, các mục chờ luật sư/kế toán. Hạn lưu giấy tờ theo A4: ảnh 1 ngày sau trả phòng, khai báo chưa xong 2 ngày, hồ sơ điền sẵn 3 tháng. DOM đọc lại bảng cùng INV.

**OPS kiểm (agent, không đọc giá trị):**
```sql
SELECT key, effective_from FROM config_parameter WHERE key = 'payment_receiving_account' ORDER BY effective_from;
SELECT payload->>'template' AS template, status, left(coalesce(last_error,''),40) AS err, count(*)
  FROM outbox_message WHERE topic = 'staff.email' GROUP BY 1,2,3;
```
**Đạt khi:** có 1 dòng `payment_receiving_account|2026-10-29`; DOM xác nhận tham số khớp A3/A4.

Dòng outbox thư `receiving_account_changed` sẽ là `dead|NO_RECIPIENT`. **Đúng dự kiến** (BUG-R3-032, P1, sửa ở v1.0.1): tài khoản trên Desk chưa có email nên thư "Security notice" không có người nhận. QA/QC không tính là lỗi mới.

**B2 KHÔNG vá email chủ.** Không gõ SQL đặt email, không dùng `info@ottimo.vn` cho thư bảo mật (SEC `reviews/SEC-on-B2-readiness.md` mục 1.4). Thay vào đó, biện pháp bù B1–B6 của SEC (mục 1.3) bắt đầu từ sáng 29/10: OWN kiểm "Tài khoản nhận chuyển khoản", chuông, nhật ký 24 giờ, đối soát ngân hàng, ghi sổ giao ca.

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

**10:13 – INV mở khóa và chạy.** B2 dùng **tệp khóa hiện có** `~/.ottimo/backup/ottimo-prod-backup-identity.txt` (SEC 27/10 mục 2.2 bước 1). Chạy một lệnh (chép nguyên khối):
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

**Sau khi diễn tập ĐẠT – INV làm trong ngày 28/10** (có thể sau buổi). Thứ tự bắt buộc; mỗi bước đạt mới sang bước sau (SEC mục 2.2 bước 3):
1. **Kiểm bản trong trình quản lý mật khẩu là đúng khóa** (không lộ khóa):
   - mở mục "OTTIMO – khóa sao lưu production", bấm chép;
   - trong Terminal chạy:
     ```bash
     pbpaste | docker run -i --rm ottimo-drill-runner:local age-keygen -y | cmp -s - <(grep '^age1' ~/.ottimo/backup/ottimo-prod-backup-recipient.txt) && echo "KHOP" || echo "KHAC"; pbcopy </dev/null
     ```
   - `age-keygen -y` chỉ in **khóa công khai** `age1…` và so với tệp khóa công khai trên Mac. OPS đã đối chiếu 27/10: tệp này trùng `recipients.txt` trên máy chủ (mục 21.6). `pbcopy </dev/null` xóa clipboard.
   - In `KHOP` mới sang bước 2. `KHAC` → **không xóa gì**, báo ORC: bản trong trình quản lý mật khẩu sai hoặc thiếu dòng.
2. **Bản ngoại tuyến A8** (giấy niêm phong hoặc USB mã hóa) cất két, trong **phong bì riêng, không chung với KEK**. Lý do: KEK cộng khóa sao lưu là mở được cả ảnh giấy tờ.
3. Time Machine (nếu có): đã `tmutil addexclusion ~/.ottimo` ở 1.3 bước 4.
4. **Xóa khóa khỏi Mac:**
   ```bash
   rm ~/.ottimo/backup/ottimo-prod-backup-identity.txt && ls ~/.ottimo/backup
   ```
   Danh sách in ra không còn `ottimo-prod-backup-identity.txt`. INV báo trong chat "đã xóa khóa khỏi Mac".
   - Bản sao lưu đã mã hóa trên Mac vẫn giữ (FileVault bật). Kéo bản sao lưu hằng ngày không cần khóa này.
   - FileVault **tắt** mà chưa bật được trong ngày: xóa thêm `~/.ottimo/backups/ottimo-prod`.
   - Không đặt passphrase cho tệp khóa (SEC 2.2 bước 5).

**Lần diễn tập sau (khóa đã rời Mac): khóa đi qua stdin vào tmpfs của container, không ghi xuống đĩa.** Không tạo lại tệp bằng TextEdit: TextEdit tự lưu phiên bản vào kho Versions của macOS, xóa tệp không xóa được các bản đó.
- Đã thử 27/10 trên khóa và bản sao lưu **tổng hợp**: ĐẠT, khớp 100 %, 65 migration, 7 giây. Kiểm khóa công khai `age-keygen -y` cũng đạt (mục 21.6).
- INV chép khóa từ trình quản lý mật khẩu, rồi chạy:
```bash
mkdir -p ~/.ottimo/drills && chmod 700 ~/.ottimo/drills
cd ~/Desktop/hotel-app && pbpaste | bash -c 'P=$PWD/product; B=$HOME/.ottimo/backups/ottimo-prod
docker run -i --rm --tmpfs /tmp -v /var/run/docker.sock:/var/run/docker.sock -v "$P:$P:ro" -v "$B:/backups:ro" -w "$P" \
  ottimo-drill-runner:local bash -c "umask 077; cat > /tmp/id && infra/server/bin/restore-drill.sh --identity /tmp/id --from /backups \
  --api-image ghcr.io/anhvh93-tech/ottimo-api:<tag đang chạy>"' 2>&1 | grep -v "requested image" | tee ~/.ottimo/drills/restore-prod-$(date +%Y%m%d).txt; pbcopy </dev/null
```
- Khóa chỉ nằm trong `/tmp` (RAM) của container chạy một lần. `pbcopy </dev/null` xóa clipboard ngay sau đó.
- Trình quản lý mật khẩu có thể tự xóa clipboard sau vài chục giây: nếu lệnh báo không đọc được khóa thì chép lại rồi chạy ngay.

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
| P5-d | Tệp khóa đã bị xóa khỏi Mac trước buổi | Dùng đường "khóa qua stdin" ở cuối mục 2.5 (đã thử 27/10). **Không** tạo lại tệp bằng TextEdit | – |
| P5-e | Sau diễn tập, kiểm khóa trong trình quản lý mật khẩu ra `KHAC` | **Không xóa** tệp khóa trên Mac. INV chép lại khóa đúng (từ tệp trên Mac) vào trình quản lý mật khẩu, rồi kiểm lại. Vẫn `KHAC` → SEC xem | Tệp khóa chỉ được xóa khi `KHOP` và đã có bản A8 |
| F | `fdesetup status` in FileVault tắt | B2 vẫn làm. INV bật FileVault trong ngày 28/10 (System Settings → Privacy & Security → FileVault). Không bật được thì sau diễn tập xóa cả khóa lẫn `~/.ottimo/backups/ottimo-prod` | Đĩa Mac không mã hóa thì không giữ dữ liệu khách (SEC 2.2 bước 2) |
| P5-c | Kéo bản sao lưu lỗi | Thử lại 1 lần. Nếu vẫn lỗi: diễn tập trên bản 27/10 10:43 đã có trên Mac (DB trống, đúng lược đồ) để chứng minh đường ống, rồi làm lại trên bản có dữ liệu sau buổi | Ghi rõ trong biên bản bản nào được dùng |
| P6-a | `mail-test: failed (<mã>)`, hoặc 15 phút không có thư (cả Spam) | OPS chạy lại chế độ chỉ kiểm. Mã `550 … relay`: kiểm IP trong cài đặt relay (8a) | G4-9 còn mở, không chặn phần khác. Thử lại chiều 28/10 |
| P6-b | Đăng nhập lại không đòi mã 6 số | **Dừng, báo SEC** (2 bước bắt buộc phải chạy) | Chặn D tới khi SEC xác nhận |
| X | Production lỗi giữa buổi (5xx, container khởi động lại) | OPS xem `dc logs --tail 100 api worker`. Thường chỉ cần `dc up -d --no-deps <dịch vụ>` | **Không** `rollback.sh` về `sha-29636757822b`: bản đó chưa có migration thứ 65. Muốn quay lui image thì BE/ARC xác nhận trước |
| Y | Quá 10:40 | Ưu tiên giữ phần 1–3 trọn vẹn. Phần 5: INV chạy lệnh 2.5 bất cứ lúc nào trong ngày, OPS đọc tệp biên bản. Phần 6: INV tự kiểm hộp thư và đăng nhập lại | – |

## 4. Ngay sau B2

| Khi nào | Ai | Việc | Gỡ dòng |
|---|---|---|---|
| 28/10, 10:40–11:30 | OPS | Ghi biên bản B2 vào `v1-production.md` mục 22: giờ từng phần, kết quả truy vấn đếm, biên bản diễn tập, `mail-test`. Không ghi tên, số, mã. README `infra/server` mục 12: "Diễn tập khôi phục production: 28/10/2026" | G4-7 |
| 28/10, trong ngày | INV | Sau diễn tập ĐẠT: kiểm khóa trong trình quản lý mật khẩu (`KHOP`), cất A8 phong bì riêng (không chung KEK), **xóa tệp khóa khỏi Mac** (mục 2.5). FileVault tắt thì bật trong ngày. Báo "đã xóa khóa khỏi Mac" | G4-6 |
| 28/10 chiều | ORC → QC | **QC chấm cổng v1.0** bằng bằng chứng của buổi: biên bản OPS, báo cáo QA smoke, SEC-G1/G2, xác nhận của INV (KEK, mã khôi phục, thư thử) | Cổng v1.0 |
| 28/10 chiều | ORC | Cập nhật `inv-golive-checklist.md`: tick B2 phần đã đạt; dòng chưa đạt kèm hạn | – |
| 29/10 sáng | OPS | Bản sao lưu đêm 29/10 03:0x có dữ liệu B2 (`ops-check` 7/7). Kéo về Mac. **J16 đã chạy lần đầu** cho cơ sở mới: `ops-check j16` ok trước ~11:00 29/10 (26 giờ sau phần 1) | G4-5 |
| Mỗi sáng từ 29/10 tới khi thư bảo mật tới được chủ | INV (OWN), MGR | Biện pháp bù SEC B1–B6 (`reviews/SEC-on-B2-readiness.md` mục 1.3): kiểm "Tài khoản nhận chuyển khoản" + chuông + nhật ký 24 giờ, đối soát ngân hàng, ghi sổ giao ca trước 09:00. Lễ tân: QR "vừa đổi tài khoản nhận" → dừng, gọi OWN (đưa vào C3a) | BUG-R3-032 |
| **29/10** | INV | **C1 – kiểm VietQR**: tạo một đơn thử ghi chú "TEST", quét QR bằng app ngân hàng, xem **tên chủ tài khoản đúng**, **không chuyển tiền**, hủy đơn. Tên sai → `/feedback P0`. Đơn "TEST" đã hủy vẫn nằm trong dữ liệu (chỉ ghi thêm). DATA loại khỏi báo cáo | G7-6 (xác nhận cuối) |
| 29/10–01/11 | INV + đội | Đào tạo C3a **trên staging**, tài khoản tập riêng. Desk thật: nhân viên chỉ đăng nhập / đổi mật khẩu / đăng xuất | – |
| Trước D | INV + OPS | A7 báo động (G4-10, chặn D). A10 danh sách chuyển đổi. A12 phần (1) OTA 12:00. Quản lý chưa đăng ký 2 bước thì đăng ký | G4-10 |
| v1.0.1 (04/11), chậm nhất 09/11 | BE-A + ARC; OPS | BUG-R3-032: trường email người dùng (có S2 + audit + thư tới cả địa chỉ cũ lẫn mới). Sau khi INV nhập **email cá nhân** (không dùng `info@`): OPS/QA xác nhận thư "Security notice" thật tới. `ops-check` đếm `dead NO_RECIPIENT` (nhánh `ops-check-no-recipient`) bật cảnh báo khi số > 0 | BUG-R3-032 |
| Sau B2, ngoài giờ khách (không phải D−1/D) | OPS | Làm mới bundle `infra/` production lên `main` (có bước `appconfig`, mục 21.5); xóa 2 bản `state/env.before-*` cũ khi SEC-G1/G2 xong (mục 19.1) | – |

## 5. Kết quả kiểm trước buổi 28/10 (dời 11:30)

- Buổi B2 dời từ 09:00 sang **11:30** (INV chốt 28/10). OPS (agent) chạy mục 1.1, **11:06–11:08** giờ VN, từ Mac INV qua SSH `ottimo-admin` (khóa `ottimo_ops`, host từ phân giải `desk.ottimo.vn`, khớp `known_hosts`, `StrictHostKeyChecking=yes`).
- Chỉ đọc. Không ghi DB, không restart, deploy, bootstrap hay đổi cấu hình. `printenv` chỉ lọc 4 biến. Không ghi IP, tên máy hay bí mật.

| # | Kiểm | Kết quả | Đạt? |
|---|---|---|---|
| 1 | `dc ps` production | api, web, landing, postgres **healthy**; worker Up (api/web/worker Up 27 giờ, landing 26 giờ, postgres 44 giờ). Image api/worker/web/landing `sha-70fe734e9077`; `state/current_tag` = `sha-70fe734e9077` | Đạt |
| 2 | `printenv` api / worker (4 biến) | Cả hai: `APP_ENV=production`, `MFA_ENFORCED=true`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0` | Đạt |
| 3 | `/health` nội bộ; `https://desk|staff|g.ottimo.vn/` | `{"status":"ok","db":"ok",…}`; 200 / 200 / 200 (~0,18–0,20 s) | Đạt |
| 4 | DB (`BEGIN READ ONLY … ROLLBACK`) | `app_user` **0**, `property` **0**, `room` **0** – trống, chưa ai chạy bootstrap | Đạt |
| 5 | Sao lưu đêm 28/10 | `ottimo-backup@ottimo-prod` xong 03:04:20, `OK: 16 encrypted files`, thoát 0 (`Result=success`). `ops-check` lượt 10:56: **7/7 ok** (containers, j16 0 cơ sở, backup 7 giờ trước, disk 17 %, mem 77 %, tls, http5xx 0). Timer kế: sao lưu 29/10 03:03, ops-check mỗi 30 phút | Đạt |
| 6 | RAM / đĩa | RAM khả dụng 3.839 / 4.917 MB (**78 %**), swap dùng 0; đĩa `/` **17 %** (8,5 / 55 GB) | Đạt |
| 7 | SMTP | `mail-test.mjs` với `MAIL_TEST_VERIFY_ONLY=1` (worker tạm `--rm`) → **`mail-test: verified`**. Không gửi thư | Đạt |
| 8 | GitHub | Một lượt chờ duyệt: CI `40615225724` (rc.5 `1078b5b`), job **deploy staging**, môi trường `staging`. **Staging đang chờ, không ảnh hưởng production** – ORC giữ, duyệt sau B2. Không có lượt Release/production nào đang chờ (Release gần nhất `40433751349` 27/10 đã xong) | Đạt |
| 9 | Mac | Docker chạy qua **OrbStack** (server 29.8.2), không phải Docker Desktop như runbook ghi – lệnh `docker` dùng được như nhau. Có `ghcr.io/anhvh93-tech/ottimo-api:sha-70fe734e9077` (ID `18145bc2…` = digest đang chạy) và `ottimo-drill-runner:local` (dựng 27/10) | Đạt |

**Kết luận: B2 sẵn sàng** cho 11:30. Ghi chú: mục 0.5 và 1.3 bước 6 vẫn giữ – trong buổi không duyệt lượt `deploy staging` 40615225724; mục 1.2/1.3 nói "Docker Desktop" thì hiểu là OrbStack đang chạy trên Mac.

**Phần 1 – OPS kiểm sau bootstrap (mục 2.1), 16:30 giờ VN 28/10.** Chỉ đọc, 3 truy vấn của 2.1 + đếm tổng `app_user`, trong `BEGIN READ ONLY … ROLLBACK`, lệnh B1 mục 2.3 bước 6 với `/opt/ottimo-prod`. Không in tên, hash, secret hay mã.
- `property` **1**, `room` **10** – Đạt.
- Vai đang hiệu lực: `owner|1|1|0` (1 chủ, 2 bước bật, không còn mật khẩu tạm); không có vai nào khác; tổng `app_user` **1** – Đạt.
- Audit: `production.bootstrapped` **1**, `user.created_by_operator` **1**, `mfa.enrolled` **1** – Đạt.
- **Kết luận Phần 1: Đạt (G2-7 phần chủ).** Ghi chú: giờ kiểm thực tế 16:30, trễ so với lịch 11:30; không ảnh hưởng kết quả.

**Phần 3 – OPS kiểm sau khi INV nhập tài khoản nhận tiền và giá (mục 2.3), 10:27 giờ VN 29/10.** Chỉ đọc, 2 truy vấn của 2.3 + đếm giá niêm yết theo căn (`room_list_price`), trong `BEGIN READ ONLY … ROLLBACK`, cùng lệnh như Phần 1. Chỉ lấy key, ngày, trạng thái, số đếm; không SELECT số tài khoản, tên chủ tài khoản hay số tiền.
- `payment_receiving_account`: **1 dòng**, `effective_from` **2026-10-30**. Runbook ghi 29/10 vì viết cho buổi 28/10; Phần 3 làm ngày 29/10 nên hiệu lực "từ ngày mai" = 30/10 là đúng – Đạt. Hôm nay QR chưa trỏ về tài khoản này là đúng; C1 (kiểm VietQR) phải làm **từ 30/10**.
- Outbox `staff.email`: **1** dòng `receiving_account_changed|dead|NO_RECIPIENT`, không dòng nào khác – đúng dự kiến (BUG-R3-032), không tính là lỗi mới.
- Giá niêm yết: **10/10 căn** có giá đang hiệu lực (cùng `effective_from` 2026-10-29), **0** căn có giá lên lịch sau hôm nay; cả 10 dòng do người dùng nhập (không dòng nào thiếu `changed_by`) – Đạt.
- **Kết luận Phần 3 (phần OPS): Đạt.** Còn chờ DOM đọc lại bảng tham số với INV (khớp A3/A4) – chưa thuộc lượt kiểm này.

**Phần 4 – OPS kiểm sau khi INV tạo tài khoản nhân viên (mục 2.4), 10:32 giờ VN 29/10.** Chỉ đọc, truy vấn vai của 2.1 + đếm tổng `app_user` và người không có vai, trong `BEGIN READ ONLY … ROLLBACK`, cùng lệnh như Phần 1. Chỉ in vai và số đếm.
- Vai đang hiệu lực: `owner|1|1|0`; `manager|1|0|1`; `front_desk|1|0|1`, `front_desk_lead|1|0|1`, `housekeeping|1|0|1`, `maintenance|1|0|1`, `sales_staff|1|0|1`. Tổng `app_user` **2**, người không có vai **0** → cả 6 vai ngoài chủ nằm trên **cùng 1 tài khoản**, chưa đăng nhập.
- **Kết luận Phần 4: Đạt** theo 2.4 (chủ giữ nguyên; các vai khác `temp_pw` = số người). G2-7 phần MGR **chưa xong**: quản lý chưa đổi mật khẩu/đăng ký 2 bước (nhánh 2.4 bước 4 – kiểm lại trước D). Cần INV xác nhận 1 tài khoản giữ 6 vai (gồm cả `manager`) là đúng A2, không phải thiếu tài khoản nhân viên.

**Phần 5 – OPS (agent) 3 bước của mục 2.5, 10:32–10:34 giờ VN 29/10.** Từ Mac INV, SSH `ottimo-admin` (khóa `ottimo_ops`, `StrictHostKeyChecking=yes`). Không ghi DB, không restart, không deploy. Không đọc, in hay dùng khóa giải mã `~/.ottimo/backup/ottimo-prod-backup-identity.txt`. Không ghi IP, tên máy hay bí mật.

| # | Việc | Kết quả | Đạt? |
|---|---|---|---|
| 1 | `sudo systemctl start ottimo-backup@ottimo-prod.service` (10:32:57–10:33:00) | Nhật ký: `OK: 24 encrypted files in /var/backups/ottimo-prod`; `Result=success`, thoát 0. Bản mới **`20261029T033257Z`**: `db-20261029T033257Z.dump.age` (705.787 byte), `counts-…`, `blobs-…`, `purge-journal-…` + 4 tệp `.sha256` | Đạt |
| 2 | Kéo về Mac, lệnh `v1-production.md` 19.2 (container `alpine:3.20`, khóa `ottimo_backup_pull`) | `pull-backups: 24 encrypted files in /out`, thoát 0, không có `checksum mismatch`. `~/.ottimo/backups/ottimo-prod` có đủ 4 tệp `.age` + 4 `.sha256` mã giờ `20261029T033257Z`; kiểm lại `shasum -a 256 -c` trên Mac: OK cả 4; thư mục 0700, tệp 0600; `.last_pull` 2026-10-29T03:33:19Z | Đạt |
| 3 | Thư thử 8b tới `info@ottimo.vn` (lệnh 2.6), 10:33:33–10:33:40 | Script in **`mail-test: sent`**. Chờ INV mở hộp thư `info@ottimo.vn` (xem cả Spam) – G4-9 đạt khi **có thư** | Đạt (phần OPS) |

**Cho bước 10:13 của INV:** `Bản sao lưu:` trong biên bản diễn tập phải là `20261029T033257Z` (bản mới nhất trong `~/.ottimo/backups/ottimo-prod`). Tên tệp biên bản trong lệnh 2.5 ghi `restore-prod-20261028.txt` vì runbook viết cho 28/10; chạy 29/10 vẫn dùng được, chỉ là tên tệp.
