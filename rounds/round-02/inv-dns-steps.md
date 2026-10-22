# OTTIMO – Thêm bản ghi DNS cho staging (ottimo.vn)

Dành cho: Chủ đầu tư · Soạn: OPS · 22/10/2026 · Việc R-5 (`qc/round-qc-gate.md` mục 5)
Thay cho Bước 4 của `inv-staging-checklist.md` với tên miền `ottimo.vn`. Khoảng 10–15 phút.

Repo này công khai, nên tài liệu ghi `<IP-VPS>` thay cho IP thật. **IP thật đội gửi riêng cho anh/chị trong chat.** Ở mọi chỗ có `<IP-VPS>`, anh/chị gõ IP đó.

---

## 1. Sửa ở đâu – kiểm trước khi bấm

Đội đã tra công khai tên miền `ottimo.vn` (22/10/2026):

| Thứ | Hiện tại | Nghĩa là |
|---|---|---|
| Máy chủ DNS (NS) | `ns1.matbao.vn`, `ns2.matbao.vn` | Bản ghi DNS đang do **Mắt Bão** quản lý |
| Email (MX) | `smtp.google.com` | Email Google Workspace đang chạy – **không được đụng** |
| Trang chủ `ottimo.vn`, `www.ottimo.vn` | Trỏ về Google (Google Sites) | Trang hiện tại – **giữ nguyên** |

Vì vậy anh/chị thêm bản ghi trong **trang quản trị tên miền của Mắt Bão** (nơi đã mua tên miền, hoặc nơi bán gói Google Workspace cho công ty). Trang quản trị Google Workspace (admin.google.com) **không sửa được** DNS của `ottimo.vn`: nó chỉ hiển thị bản ghi Google cần.

- Nếu anh/chị không có tài khoản Mắt Bão (ví dụ một đại lý mua hộ): gửi bảng ở mục 3 cho đại lý, nhờ họ thêm đúng y như bảng. Không cần đưa mật khẩu cho đội.
- Nếu trang Mắt Bão báo tên miền "đang dùng DNS ở nơi khác": dừng lại, chụp màn hình (không có mật khẩu) gửi đội.

---

## 2. Bấm từng bước

Tên nút trên trang Mắt Bão có thể hơi khác. [Chưa xác minh – đội chưa xem được trang quản trị của anh/chị.] Ý nghĩa thì giống nhau.

1. Mở trình duyệt, vào trang quản trị khách hàng của Mắt Bão, đăng nhập bằng tài khoản công ty.
2. Vào mục **Tên miền** (hoặc "Dịch vụ của tôi" → "Tên miền").
3. Bấm vào **ottimo.vn**.
4. Chọn **Quản lý DNS** (hoặc "Cấu hình DNS", "Bản ghi DNS").
5. **Chụp màn hình bảng bản ghi hiện có** trước khi sửa. Lưu ảnh này: nếu lỡ tay xóa nhầm, nhìn ảnh để thêm lại.
6. Thêm lần lượt **5 bản ghi** ở mục 3. Với mỗi bản ghi:
   - bấm **Thêm bản ghi** (hoặc "Thêm mới");
   - ô **Loại** (Type): chọn đúng loại trong bảng;
   - ô **Tên** (Host, Name): gõ đúng như bảng. Nếu sau ô đã có sẵn chữ `.ottimo.vn` thì chỉ gõ phần trong bảng, **không** gõ thêm `.ottimo.vn`;
   - ô **Giá trị** (Value, Địa chỉ, Trỏ tới): gõ đúng như bảng;
   - ô **TTL**: chọn `300` (5 phút). Không có 300 thì chọn số nhỏ nhất có trong danh sách;
   - bấm **Lưu**.
7. Xong 5 bản ghi: chụp màn hình bảng bản ghi lần nữa (không có mật khẩu trong ảnh) và nhắn đội "đã thêm DNS". Đội tự kiểm trong 5–30 phút.

---

## 3. Năm bản ghi cần thêm

| # | Loại | Tên (Host) | Giá trị | TTL | Dùng cho |
|---|---|---|---|---|---|
| 1 | A | `desk.staging` | `<IP-VPS>` | 300 | Màn lễ tân/quản lý bản thử |
| 2 | A | `staff.staging` | `<IP-VPS>` | 300 | App nhân viên bản thử |
| 3 | A | `g.staging` | `<IP-VPS>` | 300 | Trang khách bản thử |
| 4 | CAA | `@` | cờ `0`, thẻ `issue`, giá trị `letsencrypt.org` | 300 | Cho phép Let's Encrypt cấp chứng chỉ (ổ khóa https) cho bản thử |
| 5 | CAA | `@` | cờ `0`, thẻ `issue`, giá trị `pki.goog` | 300 | Cho phép Google tiếp tục cấp chứng chỉ cho trang Google Sites hiện tại (`www.ottimo.vn`) |

Cách gõ bản ghi CAA:
- Có 3 ô riêng (Flag / Tag / Value): gõ `0`, chọn `issue`, gõ `letsencrypt.org` (dòng 5: `pki.goog`).
- Chỉ có 1 ô giá trị: gõ nguyên dòng `0 issue "letsencrypt.org"` (dòng 5: `0 issue "pki.goog"`), có dấu ngoặc kép.
- Tên `@` nghĩa là chính `ottimo.vn`. Nếu ô Tên không nhận `@` thì để trống.
- **Phải thêm cả dòng 4 và dòng 5.** Chỉ thêm dòng 4 thì Google không gia hạn được chứng chỉ cho trang `www.ottimo.vn` hiện tại.
- Trang Mắt Bão **không có loại CAA**: bỏ qua dòng 4 và 5, báo đội. Staging vẫn chạy được; CAA chỉ là lớp bảo vệ thêm.

---

## 4. Không được làm

- **Không xóa, không sửa** các bản ghi đang có. Đặc biệt:
  - `MX` → `smtp.google.com` (email công ty);
  - `TXT` có `v=spf1 include:_spf.google.com ~all` (chống giả mạo email);
  - `TXT` có `google-site-verification=…` (xác minh với Google);
  - 4 bản ghi `A` của `@` đang trỏ về Google, và `CNAME` `www` → `ghs.googlehosted.com` (trang Google Sites hiện tại).
- **Không thêm** `TXT v=spf1 -all` dù checklist cũ có nhắc. Dòng đó chỉ dành cho tên miền không gửi email. `ottimo.vn` đang dùng email Google, thêm vào sẽ làm thư công ty bị coi là giả mạo.
- Không tạo bản ghi `AAAA` (IPv6), không tạo bản ghi `*`.
- Không bật "chuyển tiếp tên miền" (URL forwarding) hay "proxy" cho 3 tên `*.staging`.
- Không đổi máy chủ DNS (NS) sang nơi khác.
- Không gửi mật khẩu Mắt Bão hay mã xác thực 2 lớp cho đội.

---

## 5. Sau khi thêm – đội làm gì

- Đội kiểm 3 tên `desk.staging.ottimo.vn`, `staff.staging.ottimo.vn`, `g.staging.ottimo.vn` trỏ đúng IP, kiểm CAA, và kiểm email + trang `www` vẫn như cũ.
- Bản ghi mới thường có hiệu lực sau 5–30 phút, có khi tới vài giờ. Anh/chị không cần làm gì thêm.
- Trang chủ `ottimo.vn` vẫn ở Google Sites. Khi landing mới qua cổng LP-v1 (ADR-014), đội sẽ gửi hướng dẫn riêng để chuyển trang chủ sang VPS.

## 6. Bảo vệ tài khoản tên miền (nên làm cùng lúc, 0 đ)

Ai chiếm được tài khoản Mắt Bão có thể chuyển hướng email và trang khách. Trong tài khoản Mắt Bão:
- tài khoản đứng tên công ty, email khôi phục là hộp thư công ty;
- bật xác thực 2 lớp (ưu tiên ứng dụng xác thực hơn SMS);
- bật khóa chuyển nhượng tên miền nếu Mắt Bão có [Chưa xác minh với tên miền `.vn`];
- bật tự gia hạn: tên miền hết hạn thì email, trang chủ và staging cùng ngừng.
