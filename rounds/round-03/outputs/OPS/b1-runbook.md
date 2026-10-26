# B1 trên staging – runbook OPS (26/10/2026, bắt đầu ~16:30)

- Round 3 · Bước: Kiểm thử (UAT) · Người viết: OPS · Căn cứ: `rounds/round-03/inv-golive-checklist.md` mục B1 "Đội làm trước"; thủ tục 06.33 bản 3 (ngoài repo, `~/.ottimo/runbooks/2fa-operator-reset-06.33.md`); `v1-production.md` mục 18–19; QC `v1-gate-checklist.md` G7-3, G7-4, G2-4, G2-5.
- Tệp này **không** chứa IP, mật khẩu, mã 2 bước, mã khôi phục, mã phiếu thật. IP ghi `<IP-VPS>`; lệnh đầy đủ có IP thật ORC chuyển cho INV qua chat (IP không phải bí mật, nhưng repo công khai không ghi).
- Mọi lệnh chạy từ **Terminal trên Mac của INV**, trong thư mục repo, bằng khóa cá nhân `~/.ssh/ottimo_ops` (có passphrase) – tài khoản `ottimo-admin`, lệnh docker qua `sudo -u ottimo`. Không dùng khóa CI.

## 0. Kiểm sẵn sàng (OPS, 15:32–15:40, chỉ đọc)

| Kiểm | Kết quả |
|---|---|
| `https://desk|staff|g.staging.ottimo.vn/` | 200 / 200 / 200 (~0,26 s) |
| Container staging | api, web, postgres healthy; worker Up (4 giờ, từ lần bật MFA 11:39) |
| Tag đang chạy | `sha-29636757822b` (= `v1.0.0-rc.1`, giống production) |
| `MFA_ENFORCED` trong api và worker | `true` / `true` |
| RAM cả VPS (staging + production + landing + edge) | tổng 4.917 MB, khả dụng **3.894 MB (79 %)**, swap 0 |
| CLI trong image staging | có `mfa-operator-reset-cli.js`, `production-bootstrap-cli.js` |
| Email staging | `EMAIL_PROVIDER=mock`: staging **không gửi thư**. Biên bản 06.33 ghi "staging không gửi email (mock)" |
| Lệnh 06.33 chạy được bằng đúng đường của thủ tục | `dc exec -T api node dist/admin/mfa-operator-reset-cli.js --username <tên không tồn tại> …` → `Error: user not found`, không ghi gì |

**Trong buổi B1:** không duyệt lượt "deploy staging" nào trên GitHub (lượt deploy dựng lại api/worker). Commit runbook này có thể tạo một lượt chờ duyệt – để sau buổi.

## 1. SEC E.13 – tên tài khoản nhận thử (G7-3): **ĐÃ CÓ HIỆU LỰC từ 23/10**

Đọc trực tiếp bảng `config_parameter` trên staging (chỉ đọc, 15:33):

| Hiệu lực từ | Tên chủ tài khoản | Số (4 cuối) |
|---|---|---|
| 2026-10-22 | OTTIMO TEST | 6789 |
| **2026-10-23** | **STAGING KHONG CHUYEN TIEN** | 6789 |

- Dòng 23/10 do OPS thêm 22/10 bằng API (`staging-readiness.md` dòng 356, phương án A của ORC). Hôm nay 26/10 nên dòng đang áp dụng là "STAGING KHONG CHUYEN TIEN". Không cần đổi gì nữa, không cần đăng nhập OWN.
- QC G7-3 ghi "Còn thiếu" theo bản `s4-acceptance.md` cũ (trước khi thêm dòng). **ORC báo QC cập nhật G7-3.**
- Ở phần 1 của B1, SEC nhìn tận mắt trên Desk (màn "Tài khoản nhận chuyển khoản") hoặc QR của một đơn thử: tên hiện "STAGING KHONG CHUYEN TIEN". **Không ai quét QR staging bằng app ngân hàng thật.**

## 2. Tài khoản chủ dùng thử của INV trên staging (G7-4)

### 2.1 Vì sao không dùng `production-bootstrap`
`production-bootstrap-cli.js` chỉ chạy trên DB **trống** và từ chối khi đã có cơ sở. Staging đã có cơ sở OTTIMO Đà Lạt và dữ liệu UAT. Image không có lệnh quản trị nào khác để thêm người dùng.

### 2.2 Công cụ: `product/infra/server/staging-add-owner.mjs` (mới)
- Không nằm trong image, không đặt lên máy chủ. Đẩy từ Mac vào **container api đang chạy** qua stdin (`dc exec`, không phải `dc run`: đầu ra của `exec` không vào nhật ký docker; `sudoers` không ghi I/O – kiểm 26/10).
- Dùng đúng mã của image: `temporaryPassword()` của bootstrap (24 ký tự ngẫu nhiên, qua chính sách V-10), `hashPassword()`, `AuditService`, ngữ cảnh RLS như bootstrap.
- Tạo **một** `owner` ở cơ sở duy nhất: `must_change_password = true`; `MFA_ENFORCED=true` buộc đăng ký 2 bước ngay lần đầu; audit `security / user.created_by_operator` (chỉ tên người chạy).
- Từ chối khi: `APP_ENV` khác `staging`, `MFA_ENFORCED` khác `true`, không đúng 1 cơ sở, tên đã có, tên bắt đầu `qa.`.
- `ADD_OWNER_DRY_RUN=1`: kiểm hết và ghi thử trong một giao dịch rồi **hủy**; không in mật khẩu.
- Mật khẩu tạm in **một lần**, chỉ trên Terminal của INV. Không vào chat, repo, log. Lệnh có chốt `[ -t 1 ]`: nếu đầu ra bị chuyển vào tệp hay pipe thì không chạy.

**Đã chạy khô 15:36 (OPS):** `inv.owner` → `dry-run ok (… rolled back – nothing written)`, thoát 0. Đọc lại DB: 0 người dùng `inv.owner`, 0 dòng audit mới. Thử tên `qa.owner` → `refused (qa.* names belong to QA)`, thoát 2.

### 2.3 Lệnh INV chạy (đầu phần 1, ~16:30)
```bash
cd ~/Desktop/hotel-app && [ -t 1 ] && ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T -e ADD_OWNER_USERNAME=inv.owner -e ADD_OWNER_NAME="OTTIMO Owner (trial)" -e ADD_OWNER_OPERATOR="INV self, B1 26/10" api node --input-type=module -' < product/infra/server/staging-add-owner.mjs
```
1. Terminal hỏi passphrase của khóa `ottimo_ops` (nếu chưa mở): INV gõ.
2. Kết quả đúng: `staging-add-owner: done …` và một dòng mật khẩu tạm.
3. INV mở `https://desk.staging.ottimo.vn`, đăng nhập `inv.owner` bằng mật khẩu tạm (gõ, hoặc chép-dán trên chính Mac). Rồi bấm **Cmd+K** trong Terminal để xóa màn hình và cuộn ngược.
4. Desk buộc đổi mật khẩu → INV đặt mật khẩu mới, cất trong trình quản lý mật khẩu.
5. Desk buộc đăng ký 2 bước → quét QR bằng app xác thực, cất 10 mã khôi phục **thử** (ghi "STAGING" trên giấy, không dùng cho bản thật). SEC chứng kiến qua màn hình, không xem mã.
6. Kiểm (OPS đọc cùng INV, phiên mới, chép cả 3 dòng):
   ```bash
   ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T postgres sh -c "psql -X -tA -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\""' <<'SQL'
   SELECT a.action, a.occurred_at FROM audit_event a JOIN app_user u ON u.id::text = a.entity_id::text WHERE u.username = 'inv.owner' AND a.action IN ('user.created_by_operator','mfa.enrolled') ORDER BY a.occurred_at DESC LIMIT 5;
   SQL
   ```
   Đúng: có `mfa.enrolled` mới hơn `user.created_by_operator` (giờ in theo UTC, VN = UTC+7). Lệnh này đã thử trên staging với `qa.owner`.

- Lỗi `refused (username already exists)`: tài khoản đã tạo trước đó – không chạy lại; nếu quên mật khẩu tạm thì ORC báo OPS (đường "quên mật khẩu" của app, hoặc dùng tên khác như `inv.owner2`).
- Quản lý thật (nếu có): INV tạo trong Desk → "Người dùng & vai" sau khi đã đăng ký 2 bước; đưa mật khẩu tạm tận tay.

### 2.4 Tài khoản riêng cho diễn tập: **không cần**
Thủ tục 06.33 mục 6 ưu tiên tài khoản OWN dùng thử của INV (nhánh 3B: INV vừa yêu cầu vừa chạy lệnh). Dùng `inv.owner`. Chỉ khi `inv.owner` không dùng được (ví dụ chưa đăng ký 2 bước kịp): tạo `drill.owner` bằng đúng lệnh 2.3, đổi `ADD_OWNER_USERNAME=drill.owner`, `ADD_OWNER_NAME="Drill owner (06.33)"`; đăng nhập, đổi mật khẩu, đăng ký 2 bước trước diễn tập; **khóa tài khoản sau buổi** (Desk → Người dùng → Vô hiệu).

## 3. Phần 2 – diễn tập 06.33 (30 phút)

### 3.1 Ai làm gì
| Vai trong thủ tục | Người thật hôm nay | Ghi chú |
|---|---|---|
| Người yêu cầu | INV (`inv.owner`, staging) | Giả định "mất cả điện thoại lẫn 10 mã khôi phục" |
| **Người chạy lệnh** | **INV** | Thủ tục 06.33 mục 2: OPS/SEC/ORC là agent, **không** được làm người chạy, người chứng kiến hay giữ mã. OPS chỉ chuẩn bị lệnh và đọc kết quả cùng INV |
| **Người chứng kiến** | Người INV chỉ định từ trước (lễ tân trưởng, kế toán…), không phải INV | **Cấp mã phiếu** `MFA-DRILL-20261026` khi INV gọi báo trước; ký biên bản giấy hoặc nhắn xác nhận |
| SEC, ORC, OPS | Theo dõi qua màn hình | Không xem mã, không giữ gì |

### 3.2 Trước khi bắt đầu
- Phần 1 xong: `inv.owner` đã có `mfa.enrolled` (lệnh 2.3 bước 6).
- **ORC báo QA ngay bây giờ**: không chạy E2E trên staging 16:30–19:30 hôm nay. Thủ tục 06.33 mục 6 đòi báo trước **ít nhất 1 ngày**; hôm nay báo trong ngày → **lệch thủ tục**, ghi vào biên bản. Rủi ro thấp vì diễn tập không đụng `qa.*`. SEC chấp nhận lệch này khi duyệt.
- INV đăng nhập `inv.owner` trên Desk ở một tab trình duyệt, **để nguyên** (để kiểm phiên cũ bị đá ra).
- Không ai khác mở phiên SSH lên VPS trong lúc chạy (thủ tục mục 4). OPS không chạy lệnh SSH nào từ 3.3 bước 2 đến bước 5.

### 3.3 Các bước
1. **Ghi trước** (INV, tệp `~/.ottimo/runbooks/2fa-reset-log.md` trên Mac, 0600; hoặc giấy): ngày giờ · mã phiếu (để trống, điền ở bước 2) · nhánh **3B** · người yêu cầu "OWN `inv.owner` – diễn tập staging".
2. INV gọi người chứng kiến (video nếu được): "Tôi chuẩn bị khôi phục 2 bước cho tài khoản inv.owner trên staging – diễn tập". Người chứng kiến đọc mã phiếu `MFA-DRILL-20261026`, ghi giờ. INV điền mã vào biên bản **trước khi gõ lệnh**.
3. INV chạy trong Terminal, **từng dòng** (phiên tương tác; dòng lệnh reset có **dấu cách ở đầu**):
   ```bash
   ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS>
   export HISTCONTROL=ignorespace
   cd /tmp
    sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T api node dist/admin/mfa-operator-reset-cli.js --username 'inv.owner' --operator 'INV' --ticket 'MFA-DRILL-20261026' --reason 'drill: lost device and recovery codes; identity verified (3B)'
   history | tail -3
   exit
   ```
   - Đúng: `{"level":"info","msg":"mfa operator reset","reset":true}`.
   - `reset:false`: tài khoản chưa có 2 bước → dừng, quay lại phần 1, **không chạy lặp**.
   - `history | tail -3` có dòng chứa `mfa-operator-reset` → `history -d <số>`.
4. Kiểm audit (phiên SSH mới, chép cả 3 dòng):
   ```bash
   ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP-VPS> 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc exec -T postgres sh -c "psql -X -tA -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\""' <<'SQL'
   SELECT a.action, a.occurred_at FROM audit_event a JOIN app_user u ON u.id::text = a.entity_id::text WHERE u.username = 'inv.owner' AND a.action IN ('mfa.reset_by_operator','mfa.enrolled') ORDER BY a.occurred_at DESC LIMIT 5;
   SQL
   ```
   Đúng: dòng mới nhất là `mfa.reset_by_operator|<giờ vừa chạy, UTC>`; sau bước 5 có thêm `mfa.enrolled` mới hơn.
5. Kiểm trên Desk:
   - tab cũ: thao tác bất kỳ → bị đưa về màn đăng nhập (phiên đã thu hồi);
   - đăng nhập lại `inv.owner` bằng mật khẩu **hiện tại** (lệnh không đổi mật khẩu) → Desk buộc đăng ký 2 bước lại;
   - INV xóa mục cũ trong app xác thực, quét QR mới, cất 10 mã khôi phục thử mới (bộ cũ đã hết hiệu lực).
6. Báo chủ tài khoản: staging `EMAIL_PROVIDER=mock` → ghi "staging không gửi email (mock)". Trên bản thật, kênh chính là email.
7. INV gọi lại người chứng kiến: kết quả + giờ chạy. Người chứng kiến ký biên bản giấy, **hoặc** nhắn INV (Zalo/SMS) "ngày giờ, MFA-DRILL-20261026, tôi xác nhận đã chứng kiến". INV chụp tin nhắn, lưu `~/.ottimo/runbooks/witness-MFA-DRILL-20261026.png` (0600).
8. INV điền các cột còn lại của biên bản.

### 3.4 Biên bản – chỉ ghi kết quả
Mẫu (trên Mac INV hoặc giấy; **không** đưa vào repo, chat):

| Ngày giờ | Mã phiếu | Nhánh | Người yêu cầu (vai) | Người chạy | Người chứng kiến (ký) | Kênh xác minh | Kết quả lệnh + audit | Báo owner | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| 26/10 …:… | MFA-DRILL-20261026 | 3B | OWN `inv.owner` (diễn tập staging) | INV | ……… | khóa SSH cá nhân + gọi người chứng kiến | `reset:true`; audit `mfa.reset_by_operator` …:…; phiên cũ bị đá; đăng ký lại OK | staging không gửi email (mock) | QA báo trong ngày (lệch mục 6) |

Không ghi: mã TOTP, mã khôi phục, mật khẩu, giấy tờ, câu trả lời xác minh.

### 3.5 Sau diễn tập
- ORC báo OPS "đã diễn tập 06.33 ngày 26/10" (chỉ kết quả, không mã). OPS cập nhật README `infra/server` mục 12: "Diễn tập staging ngày: 26/10/2026". SEC duyệt bản 06.33 rồi điền "SEC duyệt ngày".
- INV chép bản 06.33 lần 3 (26/10) vào trình quản lý mật khẩu (thủ tục mục 7), nếu chưa làm.

## 4. Sau buổi B1 (OPS)
- Giữ `inv.owner` trên staging cho UAT việc 10 và diễn tập chuyển đổi. Khóa trước khi staging được làm mới dữ liệu.
- Nếu đã tạo `drill.owner`: INV khóa trong Desk ngay sau buổi.
- Duyệt lượt "deploy staging" đang chờ (nếu có) sau buổi.
