# Hướng dẫn anh/chị: cho máy chủ gửi bản sao lưu lên Google Drive công ty

OPS · 07/11/2026 · bản 1 · Round 5. Kỹ thuật: README `infra/server` mục 7.1. Mã: `infra/server/bin/push-backups-drive.sh`, `offsite-authorize.sh`, `infra/drive/apps-script/Code.gs`.

## Vì sao làm, và đổi gì

- Trước đây bản sao lưu ngoài máy chủ nằm trên Mac. Anh/chị muốn bán Mac, nên từ nay máy chủ **tự gửi** bản sao lưu lên thư mục **"OTTIMO App/Sao lưu"** trong **"Drive của tôi"** của **tài khoản Workspace công ty mà anh/chị đã chỉ định cho đội**. Xong việc này, không bước nào cần Mac.
- Tệp gửi lên vẫn là tệp đã khóa sẵn (mã hóa `age`) như trên Mac. Không thêm lớp khóa mới. Không ai mở được nếu không có khóa giải mã sao lưu.
- Bản trên Mac **giữ nguyên** thêm 2 tuần sau khi Drive chạy ổn và đội đã thử khôi phục từ Drive. Không ai xóa gì trên Mac khi chưa hỏi anh/chị.

## Cách giữ bản cũ an toàn, nói ngắn

- Máy chủ chỉ được quyền **"chỉ thấy tệp do chính nó tạo"** (Google gọi là `drive.file`). Nó gửi tệp vào một thư mục riêng tên **"Nhận"**.
- Một đoạn mã nhỏ chạy **trong Google** bằng tài khoản công ty (Apps Script, phần E) mỗi giờ kiểm từng tệp, **chép** sang thư mục **"Kho"**, rồi xóa tệp gốc trong "Nhận".
- Bản trong "Kho" do Apps Script tạo, nên máy chủ **không thấy, không sửa, không xóa được**. Nếu kẻ xấu chiếm máy chủ, họ chỉ đụng được tệp vừa gửi, còn chờ trong "Nhận" (thường dưới 1 giờ). Bản cũ trong "Kho" vẫn còn.
- Apps Script cũng tự xóa bản trong "Kho" quá hạn, giữ tối đa 35 ngày như lời hứa trong thông báo quyền riêng tư. Nó gửi email cho anh/chị, và tin vào phòng Chat "OTTIMO – Báo động" nếu anh/chị dán đường dẫn webhook ở phần E bước 7, khi quá 36 giờ không có bản mới. Cảnh báo này vẫn đến khi máy chủ đã chết.

## Luật chung (đọc trước)

- **Không gửi vào chat, email, Zalo hay repo:** Client secret, tệp tải về, mã hiện trên màn hình máy chủ, đường dẫn webhook. Các thứ đó chỉ gõ hoặc dán vào trình duyệt, hoặc vào màn hình máy chủ ở phần D.
- **ID thư mục** (chuỗi sau `/folders/` trên thanh địa chỉ) không phải mật khẩu. Anh/chị dán cho đội trong chat ở lượt cài được. Đội ghi vào `.env` trên máy chủ, không ghi vào repo.
- **Trước MỖI phần**, kiểm đúng tài khoản (phần 0). Anh/chị dùng nhiều tài khoản Google. Ổ Google Drive đang gắn trên Mac là tài khoản cá nhân, **không phải** đích.
- Phần A, B, C, E làm trên trình duyệt máy tính (máy nào cũng được). Phần D làm **cùng đội**, trong lượt cài riêng. Lượt đó cần anh/chị đồng ý trong chat.

## Phần 0 – Kiểm đúng tài khoản (lặp lại đầu mỗi phần)

1. Nên mở **một cửa sổ trình duyệt riêng** chỉ đăng nhập tài khoản công ty: Chrome → ảnh đại diện góc phải trên → "Thêm" hồ sơ mới. Hoặc dùng cửa sổ ẩn danh.
2. Ở mọi trang Google (Drive, Cloud Console, Apps Script, Bảo mật tài khoản), nhìn **ảnh đại diện ở góc phải trên**, bấm vào, đọc địa chỉ. Phải là **tài khoản Workspace công ty mà anh/chị đã chỉ định**, có tên miền công ty, **không** phải `@gmail.com`.
3. Sai tài khoản: bấm "Đăng xuất" hoặc chuyển tài khoản, rồi làm lại từ đầu phần đó. Đã lỡ làm ở tài khoản sai: báo đội, đội chỉ cách gỡ.

## Phần A – Thư mục trên Drive (5 phút)

1. Mở drive.google.com. Làm phần 0.
2. Trong **"Drive của tôi"**, có sẵn thư mục **"OTTIMO App"** thì mở. Chưa có thì bấm "Mới" → "Thư mục mới" → tên `OTTIMO App`.
3. Trong "OTTIMO App": có sẵn **"Sao lưu"** và **"Dự án"** thì giữ nguyên. Thiếu thì tạo.
4. Trong "Sao lưu", tạo **một** thư mục con tên `Kho`. **Không** tạo "Nhận": máy chủ tự tạo thư mục đó ở phần D.
5. Mở "Kho", nhìn thanh địa chỉ: `…/folders/<chuỗi>`. Chép chuỗi đó vào một ghi chú tạm. Đó là **ID của Kho**.
6. **Không chia sẻ** "Sao lưu", "Kho" hay "Nhận" cho ai. Người khác có quyền với "OTTIMO App" thì cũng thấy các tệp đã khóa. Họ không mở được, nhưng có thể xóa nhầm. Đề xuất: chia sẻ "Dự án" riêng, không chia sẻ cả "OTTIMO App".

## Phần B – Tạo "ứng dụng" của OTTIMO trên Google Cloud (15 phút, miễn phí)

Đây là nơi Google ghi tên "ứng dụng" xin quyền. Mục đích là để quyền chỉ là của OTTIMO, không mượn ứng dụng của bên khác.

1. Mở console.cloud.google.com. Làm phần 0 (ảnh đại diện góc phải trên). Lần đầu vào, Google có thể hỏi đồng ý điều khoản: đọc rồi chọn.
2. Thanh trên cùng → "Chọn dự án" → "Dự án mới" → tên `ottimo-backup` → "Tạo". Chờ xong, chọn đúng dự án này trên thanh trên cùng.
3. Ô tìm kiếm trên cùng: gõ `Google Drive API` → mở → bấm **"Bật"** (Enable).
4. Ô tìm kiếm: gõ `Google Auth Platform` (hoặc "Màn hình xin quyền OAuth") → "Bắt đầu":
   - Tên ứng dụng: `OTTIMO server backup`. Email hỗ trợ: chọn email công ty trong danh sách.
   - **Đối tượng (Audience): chọn "Nội bộ" (Internal).** Rất quan trọng: chỉ tài khoản công ty dùng được, và quyền không tự hết hạn sau 7 ngày.
   - Thông tin liên hệ: email công ty → "Tạo".
5. Mục **"Ứng dụng khách" (Clients)** → "Tạo ứng dụng khách":
   - Loại: **"TV và thiết bị nhập liệu hạn chế"** (TVs and Limited Input devices). Tên: `ottimo-server-upload` → "Tạo".
   - Google hiện **Client ID** và **Client secret**. Để cửa sổ đó mở, hoặc bấm tải tệp JSON về máy. **Không chép vào chat.** Phần D cần hai giá trị này.
6. Chưa cần tạo loại "Ứng dụng cho máy tính" (Desktop app). Loại đó chỉ dùng khi diễn tập hoặc khôi phục (phần G).
7. Báo đội trong chat một câu: **"Xong phần B"**. Không gửi kèm giá trị nào.

## Phần C – Chưa có gì để làm

Không cần chia sẻ thư mục nào cho máy chủ. Quyền `drive.file` ở phần D đủ để máy chủ tạo và ghi vào thư mục riêng của nó.

## Phần D – Cho phép máy chủ gửi tệp (cùng đội, trong lượt cài; khoảng 15 phút)

Đội hẹn giờ và xin anh/chị đồng ý trong chat trước. Anh/chị cần **một máy tính có SSH** (Windows 10/11 có sẵn), hoặc **màn hình điều khiển web** của nhà cung cấp VPS, và **điện thoại**.

1. Đội cài `rclone` bản ghim sẵn (đã so mã băm) lên máy chủ và tạo sẵn thư mục chứa khóa.
2. Anh/chị đăng nhập máy chủ bằng tài khoản quản trị của mình (như các lần trước), gõ:
   `sudo /opt/ottimo-prod/infra/server/bin/offsite-authorize.sh`
3. Máy hỏi `Client ID`, rồi `Client secret` (phần B bước 5). Dán vào. **Màn hình không hiện gì khi dán, như vậy là đúng.** Mỗi lần dán xong bấm Enter.
4. Máy hiện một **đường dẫn** (`google.com/device`) và một **mã ngắn**. Trên điện thoại hoặc máy tính:
   - Mở đường dẫn. **Làm phần 0**: đúng tài khoản công ty, không phải tài khoản cá nhân.
   - Gõ mã → chọn tài khoản công ty → Google hỏi cho "OTTIMO server backup" quyền **"Xem, chỉnh sửa, tạo và xóa chỉ những tệp Google Drive cụ thể mà bạn dùng với ứng dụng này"** → "Cho phép".
   - Google hỏi quyền **rộng hơn** (ví dụ "xem tất cả tệp", "toàn bộ Google Drive"): **dừng lại**, bấm "Hủy", báo đội.
5. Màn hình máy chủ hiện `OK: authorised by xx…@<tên miền công ty>`. Kiểm tên miền là của công ty.
   - Hiện `gmail.com` hoặc tên miền khác: báo đội. Anh/chị gỡ ứng dụng ở tài khoản đó (phần H), rồi làm lại bước 2 với `--replace`.
   - Hiện `REFUSED`: chưa ghi gì lên máy chủ. Báo đội dòng chữ đó (dòng đó không có bí mật).
6. Xóa tệp JSON đã tải ở phần B (nếu có) khỏi máy tính, rồi dọn thùng rác. Đóng cửa sổ có Client secret.
7. Đội chạy `push-backups-drive.sh --init`. Lệnh tạo thư mục **"OTTIMO server - Nhan"** trong "Drive của tôi" và in **ID** của thư mục đó. Đội ghi ID vào `.env` máy chủ.
8. Anh/chị mở drive.google.com (phần 0). Trong "Drive của tôi", **kéo** thư mục "OTTIMO server - Nhan" vào "OTTIMO App/Sao lưu", rồi đổi tên thành `Nhận`. ID không đổi khi kéo hoặc đổi tên.
9. Đội chạy `push-backups-drive.sh --check --vault-folder <ID Kho>`. Lệnh kiểm 3 điều:
   - Quyền **chỉ là** `drive.file`.
   - Máy chủ ghi được vào "Nhận".
   - Máy chủ **không thấy** "Kho".
   Đội báo kết quả "đạt / không đạt" cho anh/chị.

## Phần E – Cài người "chép và dọn" (Apps Script, 15 phút)

1. Mở script.google.com. **Làm phần 0.** Bấm "Dự án mới". Đổi tên dự án (góc trái trên) thành `OTTIMO backup mover`.
2. Bánh răng "Cài đặt dự án" (bên trái) → tích **"Hiện tệp kê khai appsscript.json trong trình chỉnh sửa"**.
3. Quay lại "Trình chỉnh sửa" (biểu tượng `< >`):
   - Mở `appsscript.json`, xóa hết, dán nội dung tệp `product/infra/drive/apps-script/appsscript.json`. Đội gửi đường dẫn tới tệp trên GitHub. Repo công khai, tệp không có bí mật.
   - Mở `Code.gs`, xóa hết, dán nội dung `product/infra/drive/apps-script/Code.gs`.
   - Bấm biểu tượng đĩa mềm để lưu.
4. "Cài đặt dự án" → kéo xuống **"Thuộc tính tập lệnh"** (Script properties) → "Thêm thuộc tính":
   - `INBOX_FOLDER_ID` = ID của "Nhận" (phần D bước 7).
   - `VAULT_FOLDER_ID` = ID của "Kho" (phần A bước 5).
   - `ALERT_EMAILS` (không bắt buộc): địa chỉ nhận cảnh báo, cách nhau bằng dấu phẩy. Để trống thì gửi về chính tài khoản này.
   - Bấm "Lưu".
5. Trình chỉnh sửa → ô chọn hàm trên thanh công cụ → chọn **`setup`** → "Chạy".
   - Google hỏi quyền: chọn tài khoản công ty (phần 0).
   - Màn hình "Google chưa xác minh ứng dụng này" có thể hiện. Ứng dụng là của chính anh/chị, nên bấm "Nâng cao" → "Đi tới OTTIMO backup mover" → "Cho phép".
   - Nhật ký thực thi hiện `OK: both folders usable, 3 triggers created`.
6. Chọn hàm **`checkNow`** → "Chạy". Trong vài phút, anh/chị nhận email "OTTIMO backup on Google Drive – test".
7. (Không bắt buộc, nên làm) Gửi tin cảnh báo vào phòng Chat "OTTIMO – Báo động":
   - Trong Google Chat, mở phòng → tên phòng → "Ứng dụng và công cụ tích hợp" → "Webhook" → thêm webhook tên `Drive backup`, rồi chép đường dẫn.
   - Thêm thuộc tính tập lệnh `ALERT_WEBHOOK_URL` = đường dẫn đó. Chỉ dán ở đây, không gửi vào chat.
8. Báo đội: **"Xong phần E, đã nhận email thử"**.

## Phần F – Khóa giải mã sao lưu: để ở chỗ khác, không để chung với bản sao lưu

- Khóa giải mã (`age`, tệp có chữ `AGE-SECRET-KEY`) **không bao giờ** nằm trong "OTTIMO App", "Sao lưu", "Kho" hay bất kỳ đâu trên cùng Drive với bản sao lưu. Có cả tệp lẫn khóa thì bất kỳ ai vào được Drive đều mở được dữ liệu khách.
- Đề xuất, chọn **một**:
  - (1, nên dùng) **Trình quản lý mật khẩu** của anh/chị, mục ghi chú bảo mật.
  - (2) Bản giấy hoặc USB mã hóa trong phong bì riêng, như bản ngoại tuyến hiện có (khác phong bì với khóa dữ liệu KEK).
- Không khuyến nghị để trong một thư mục riêng của Drive công ty, kể cả thư mục chỉ anh/chị thấy: một lần lộ tài khoản Google là lộ cả hai.
- Anh/chị tự chuyển. Đội **không đọc, không mở, không in** tệp khóa. Bản trên Mac (nếu có) chỉ xóa khi anh/chị quyết, sau 2 tuần ở trên.

## Phần G – Khi diễn tập khôi phục hoặc dựng lại máy chủ

Máy chủ không đọc được "Kho". Đây là chủ ý. Vì vậy, khi cần lấy bản từ "Kho":

1. Cloud Console (phần 0, dự án `ottimo-backup`) → "Ứng dụng khách" → "Tạo ứng dụng khách" → loại **"Ứng dụng cho máy tính"** (Desktop app), tên `ottimo-restore`. Để cửa sổ có Client ID và secret mở.
2. Anh/chị mở SSH tới máy diễn tập kèm đường hầm. Đội đưa lệnh có sẵn dạng `ssh -L 53682:127.0.0.1:53682 …`.
3. Gõ lệnh đội đưa (`fetch-backups-drive.sh --vault-folder <ID Kho> --to …`), dán Client ID và secret khi được hỏi.
4. Máy hỏi "Use web browser…?": gõ `y`. Máy in một đường dẫn `http://127.0.0.1:53682/…`: mở bằng trình duyệt **trên chính máy tính đang SSH**.
5. Làm phần 0, rồi bấm "Cho phép" quyền **chỉ xem** Google Drive.
6. Tải xong, lệnh tự **thu hồi** quyền chỉ xem. Sau buổi đó, anh/chị xóa ứng dụng khách `ottimo-restore` trong Cloud Console (biểu tượng thùng rác).

## Phần H – Khi nghi máy chủ bị chiếm, hoặc đổi người, đổi tài khoản

1. myaccount.google.com (phần 0) → "Bảo mật" → "Ứng dụng và dịch vụ của bên thứ ba" (hoặc "Kết nối của bạn với ứng dụng") → "OTTIMO server backup" → **"Xóa quyền truy cập"**. Máy chủ hết gửi được ngay. Bản trong "Kho" không bị ảnh hưởng.
2. Hoặc Cloud Console → "Ứng dụng khách" → `ottimo-server-upload` → **xóa**, rồi tạo lại khi dựng máy mới (phần B bước 5, phần D).
3. Không xóa gì trong "Kho". Báo đội và đội bảo mật.

## Việc của anh/chị, tóm tắt

| # | Việc | Ở đâu | Khi nào |
|---|---|---|---|
| 1 | Phần A: thư mục "OTTIMO App/Sao lưu/Kho", chép ID Kho | Drive, tài khoản công ty | Trước lượt cài |
| 2 | Phần B: dự án `ottimo-backup`, bật Drive API, màn hình xin quyền **Nội bộ**, ứng dụng khách `ottimo-server-upload` | Cloud Console | Trước lượt cài |
| 3 | Đồng ý lượt cài trong chat | Chat với đội | Khi đội hỏi |
| 4 | Phần D: chạy `offsite-authorize.sh`, cho phép trên điện thoại, kéo "Nhận" vào "Sao lưu" | Máy chủ + điện thoại + Drive | Trong lượt cài |
| 5 | Phần E: Apps Script, `setup`, `checkNow`, (webhook) | script.google.com | Ngay sau lượt cài |
| 6 | Phần F: chuyển khóa giải mã sang trình quản lý mật khẩu hoặc phong bì | Ngoài Drive | Trong 2 tuần |
| 7 | Sau 2 tuần chạy ổn và diễn tập từ Drive đạt: quyết có xóa bản trên Mac không | Chat | Đội hỏi |
