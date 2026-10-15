# PO review UXD – Round 1, bước 3

- Người review: PO | Ngày: 15/10/2026
- Đối tượng: `product/design/design-system.md` (v0.2), `product/design/content-guide.md` (v0.2), `product/design/wireframes/index.html` + `01`…`09` (đọc mã HTML, gồm chú thích và bảng)
- Góc nhìn: wireframe có phủ đủ story Must R2 không (QC C1), có khớp AC, BR, dữ liệu mẫu không, có màn nào vượt phạm vi không. Đã đối chiếu backlog mục 4, `business-rules.md`, `test-strategy.md` mục 4.2 (DS-0), `traceability.md` mục 5.4, BL 4.1 / 4.4, report QA mục 4 (#8, #9, #13).
- Tổng: **0 Blocker · 2 Major · 4 Minor · 1 Suggestion**

---

### FB-R1-PO-UXD-01
- Mức độ: Major
- Vị trí: `traceability.md` mục 5.4; `wireframes/index.html` (bảng 9 luồng); report QA mục 4 #9
- Vấn đề: 10 story Must R2 chưa có wireframe: US-004 (danh mục căn), US-005 (bảng tham số), US-006 (nhật ký thao tác tiền), US-027 (phụ thu đơn dài hạn), US-049 (tự xóa ảnh giấy tờ), US-050 (ngày đi thực tế và hạn tạm trú), US-066 (danh mục minibar), US-071 (tạo/sửa hồ sơ khách), US-072 (chặn hồ sơ trùng), US-125 (mẫu tin nhắn). Tiêu chí QC C1 yêu cầu mỗi story Must R2 phải truy được tới wireframe.
- Vì sao quan trọng: thiếu màn thì FE không ước lượng được R2. Ba trong số này là màn cấu hình của chủ đầu tư, nằm đúng nguyên tắc PRD số 6 ("cấu hình được, không cố định trong code"). US-071/072 là cửa vào của mọi đơn (bộ chọn khách).
- Đề xuất sửa – **quyết định của PO: làm ở bước 4 của Round 1, không dời sang đầu R2**, ở mức khung đơn giản dùng component đã có, chỉ cần trạng thái thường và 1 trạng thái lỗi chính:
  1. **Màn mới `10-config-crm-messages.html`** gồm 4 khung, làm theo thứ tự ưu tiên:
     - (a) Hồ sơ khách: form tạo/sửa + lỗi `DUPLICATE_GUEST` có nút "Mở hồ sơ đã có / Gộp" (US-071, US-072; BR-951, 952).
     - (b) Mẫu tin nhắn: chọn tình huống, chọn VI/EN/RU, xem trước có biến của đơn, nút Sao chép; mở từ drawer đơn (US-125; dùng 7 mẫu ở content-guide mục 7).
     - (c) Cấu hình: danh mục căn (giá niêm yết, sức chứa, "ngừng bán"); bảng tham số theo nhóm BR mục 13, có ngày hiệu lực, `owner` sửa / `manager` chỉ xem các khóa A102; danh mục minibar dùng chung mẫu bảng (US-004, US-005, US-066).
     - (d) Nhật ký thao tác tiền: bảng lọc theo ngày, người, loại, có giá trị cũ/mới (US-006).
  2. **Không cần màn riêng, chỉ thêm chú thích có mã US vào khung đã có**: US-027 → L4 (dòng phụ thu dài hạn, cơ sở "giá đêm quy đổi" BR-102/413) và L9 9.2; US-049 → L3 (trạng thái "ảnh đã xóa theo hạn" + hộp xác nhận xóa sớm theo mẫu 6.1); US-050 → L9 9.1 (việc "Cập nhật ngày đi" đã có) + L8 (cảnh báo thị thực). Ghi mã US ở đầu trang để script truy vết của QA đọc được.
  3. Nếu hết thời gian: (a)–(c) bắt buộc trong R1. (d) được dời sang tuần đầu R2, ghi vào report UXD. Khi đó QC chấm C1 "đạt có điều kiện" với kế hoạch rõ ràng.
- Trạng thái: Open

### FB-R1-PO-UXD-02
- Mức độ: Major
- Vị trí: dữ liệu mẫu trong `02-fo-rack-booking.html`, `05-sales-quote-hold-contract.html`, `08-owner-overview.html`, `09-stay-changes.html`, `03-checkin-docs-registration.html`; report QA mục 4 #13
- Vấn đề: dữ liệu mẫu đang trái BR, BL và trái chính dữ liệu test DS-0 của QA. Cụ thể:
  1. **Vượt sức chứa**: căn 202 (nhóm Lầu 1–2, tối đa 3 người theo BR-110) có "Gia đình anh Hưng · 4 khách" ở L2 2.1, 2.5 và L9 9.5. Theo US-004 AC3 thì đơn này phải bị chặn.
  2. **Sai căn**: Emma Laurent ở căn **302** (L2 rack, L2 2.4, L5 hoa hồng), trong khi BL 4.4 và DS-0 (OTM-0108) để Emma ở **102**. Căn 102 trên wireframe lại là "Trần Thu Nga".
  3. **Sai giá gia hạn**: L9 9.1 gia hạn căn **402** với giá 1.042.000/đêm, tổng 2.084.000. 1.042.000 là giá niêm yết của căn 401. Căn 402 là 12.000.000 ÷ 12 = **1.000.000** (BR-101; giá trực tiếp mặc định = niêm yết theo BR-104), nên tổng phải là **2.000.000**.
  4. **Bộ đếm giữ chỗ tự mâu thuẫn**: L2 2.3 viết "Hết hạn giữ chỗ sau 5 giờ 20 phút (12:00 16/10)". Với T0 = 10:42 ngày 15/10 thì 12:00 ngày 16/10 còn khoảng 25 giờ. Modal 2.2 có nút "Giữ chỗ đến 18:00 16/10", không khớp mức 12/24/48 giờ nào của BR-302. L5 viết "24 giờ (hết hạn 10:41 16/10)" nhưng lại hiện "Hết hạn sau 23 giờ 10 phút".
  5. **Lộ hoa hồng người khác**: màn "Hoa hồng của tôi" ở L5 xếp chung HĐ HD-00011 của Emma (người chốt là NV Hạnh, `sales_staff` – BL 8.2 #10) với đơn OTM-00171 của CTV Minh Anh. Màn này đang mô tả đúng việc US-087 cấm.
  6. **Cơ sở phụ thu**: L3 3.4 tính phụ thu nhận sớm của Ji-woo (Booking.com, 820.000/đêm theo US-017 và DS-0) trên 792.000 (giá niêm yết). Phần này chờ DOM chốt (FB-R1-PO-DOM-03).
  7. **Tên nhân viên**: wireframe dùng tên persona hư cấu (Anh Quân, Thảo, Chú Bảy) trộn với tên trong BL (Hạnh, Minh Anh).
- Vì sao quan trọng: FE và QA chép dữ liệu mẫu từ wireframe. Bản demo cho INV mà vi phạm chính quy tắc của mình (vượt sức chứa, sai giá) sẽ làm giảm niềm tin. Điểm 5 vi phạm QC B2 (không wireframe nào cho vai làm điều RBAC cấm). QA đã phải ghi "không dùng wireframe làm nguồn dữ liệu test" (test-strategy 4.4).
- Đề xuất sửa: dùng **DS-0 của QA (`test-strategy.md` mục 4.2)** làm bộ dữ liệu mẫu duy nhất: đổi căn, khách, ngày, số khách cho khớp DS-0. Tính lại các số tiền theo ví dụ BR. Bộ đếm giữ chỗ chọn một đơn `hold` có giờ tạo cụ thể và tính theo BR-302. Màn Hoa hồng chỉ hiện mục của đúng một người xem. Tên nhân viên dùng tên trong BL mục 2 (Hạnh, Chị Lan, Anh Tùng, anh Hoàng Anh, Minh Anh). Sau khi sửa, nhờ QA chạy lại script truy vết.
- Trạng thái: Open

### FB-R1-PO-UXD-03
- Mức độ: Minor
- Vị trí: `01-login-role-nav.html` mục 1.1 (khung "Hôm nay" điện thoại) và 1.2 (dòng `front_desk`: "Hôm nay: việc theo giờ"); report QA mục 4 #8
- Vấn đề: wireframe đặt màn mặc định của `front_desk` là "Hôm nay". Backlog US-001 AC1, `rbac-matrix.md` mục 1 và TC-NT-001 lại ghi "room rack". Ngoài ra màn "Hôm nay" chỉ mới có bản điện thoại (L1 1.1, L2 2.5), **chưa có khung cho máy tính quầy**, là thiết bị chính của lễ tân.
- Vì sao quan trọng: màn đầu tiên lễ tân thấy mỗi ca là nơi đặt việc pháp lý (khai báo còn thiếu) và việc tiền (khách chưa trả phòng, giữ chỗ sắp hết hạn).
- Đề xuất sửa – **quyết định của PO: giữ "Hôm nay" làm màn mặc định cho `front_desk` và `front_desk_lead`** (theo HR-03, O-07 và journey J3 07:00). PO sẽ sửa US-001 AC1 ở bước 4, báo BA sửa rbac mục 1 và QA sửa TC-NT-001/006. Phần UXD: thêm một khung "Hôm nay" bản máy tính quầy (khách đến/đi, khai báo còn thiếu theo hạn BR-602/603, giữ chỗ sắp hết hạn, yêu cầu khách), với "Sơ đồ phòng" mở bằng 1 lần bấm (menu và phím tắt).
- Trạng thái: Open

### FB-R1-PO-UXD-04
- Mức độ: Minor
- Vị trí: `01-login-role-nav.html` (2FA TOTP, mục 1.4 "Thiết bị được cấp"), `03-…html` mục 3.5 (mã xác minh khách), `07-guest-app.html` (OTP email, ân hạn 24 giờ)
- Vấn đề: các màn bảo mật mới ở đợt 4 (theo SEC Phần 2: SR-AUTH-06, SR-DEV-01…07, SR-GST-07…11) **chưa có story nào trong backlog**. Wireframe ghi "bắt buộc từ R3" cho TOTP, nhưng các màn khác chưa ghi round.
- Vì sao quan trọng: không có story thì không có AC, không có round, không ai ước lượng được. Đây là rủi ro phình phạm vi R2 (đặc biệt "thiết bị được cấp" và OTP email đều cần thêm endpoint và dịch vụ gửi email).
- Đề xuất sửa: trên mỗi khung bảo mật, ghi mã SR và nhãn "chờ story PO – round dự kiến …". PO sẽ thêm story và AC ở bước 4 và báo lại round (xem PO-on-QA, phần tự nhận lỗi). UXD chưa cần vẽ thêm gì ở R1.
- Trạng thái: Open

### FB-R1-PO-UXD-05
- Mức độ: Minor
- Vị trí: `content-guide.md` mục 3.1 dòng "Kênh" (có Traveloka); `02-fo-rack-booking.html` mục 2.2 ô Kênh (không có Traveloka); so với BR-901 (không có Traveloka) và `metrics-definitions.md` Q-11 (14 kênh, gồm Zalo, Website, vãng lai, Google…)
- Vấn đề: ba tài liệu đưa ra ba danh sách kênh khác nhau.
- Vì sao quan trọng: kênh quyết định phí kênh (BR-901), báo cáo kênh và chỉ số mục tiêu G3 (tỉ lệ đặt trực tiếp). Danh sách kênh trên form đặt phòng R2 sẽ là dữ liệu dùng mãi về sau.
- Đề xuất sửa: UXD chỉ ghi "danh sách kênh lấy từ cấu hình kênh (BR-901)" và vẽ đúng các kênh của BR-901, không tự thêm Traveloka. PO sẽ chốt danh sách kênh cùng DOM và DATA ở bước 4 (xem FB-R1-PO-DATA-04).
- Trạng thái: Open

### FB-R1-PO-UXD-06
- Mức độ: Minor
- Vị trí: `03-checkin-docs-registration.html` mục 3.2 ("Cảnh báo không chặn nhận phòng"); `design-system.md` mục 6.4
- Vấn đề: wireframe và Design System trình bày "Không đạt" (hộ chiếu hết hạn trước ngày trả phòng) **không chặn** nhận phòng như một điều đã chốt. Thực ra đây là chính sách pháp lý chưa có trong BR và chưa có trong ESC nào (FB-R1-PO-DOM-04).
- Vì sao quan trọng: nếu INV hoặc luật sư chọn "phải chặn" hay "phải quản lý duyệt" thì FE sẽ phải làm lại luồng.
- Đề xuất sửa: thêm nhãn `[GIẢ ĐỊNH – chờ ESC-001]` vào khung 3.2 và mục 6.4, kèm một dòng "biến thể nếu phải duyệt: nút Tiếp tục → Gửi lễ tân trưởng duyệt" (UXD đã nêu được ý này ở report Đ4.5).
- Trạng thái: Open

### FB-R1-PO-UXD-07
- Mức độ: Suggestion
- Vị trí: `content-guide.md` mục 7 (7 mẫu tin nhắn)
- Vấn đề: chưa có mẫu cho "khoảnh khắc lo nhất" của khách trực tiếp là xác nhận đã nhận cọc (UXR J1-3, O-04). Mẫu `msg.booking_confirmed` cũng chưa nêu số tiền đã cọc, số còn phải trả và chính sách hủy, là những thông tin persona P5 cần.
- Vì sao quan trọng: US-125 là Must R2. Hai thông tin này giảm tin nhắn hỏi lại của khách và giảm tranh chấp khi hủy (BR-309).
- Đề xuất sửa: thêm `msg.deposit_received` ("Đã nhận cọc {amount} cho đơn {code}, còn {balance} thanh toán khi nhận phòng") và thêm biến `{deposit}`, `{balance}`, `{cancel_policy_short}` vào mẫu xác nhận đặt phòng. Phần chính sách hủy ghi rõ "chờ ESC-006".
- Trạng thái: Open

---

## Điểm làm tốt
1. **Biến 4 Blocker heuristic thành mẫu tương tác bắt buộc** (6.1 xác nhận có hậu quả cụ thể, 6.3 phụ thu chủ động, 6.4 kiểm tra 3 trạng thái, 6.10 đa ngôn ngữ), có minh họa trong khung và có mã HR/BR/US đi kèm. Đây là cách đảm bảo nguyên tắc PRD "đúng tiền trước, đẹp sau" ngay từ thiết kế.
2. **Bảng nút theo trạng thái × vai (L2 mục 2.6) dựa trên `allowedActions`** và bảng 9 mã vai ở L1 1.2 làm rõ đúng chỗ mà backlog và RBAC hay bị hiểu khác nhau. FE và QA dùng thẳng được.
3. **Đủ 5 trạng thái (tải, rỗng, lỗi, mất mạng, hết quyền) cho cả 9 luồng**, có thêm L9 cho các story Must R2 mà đợt 2 chưa vẽ (US-024, US-135, US-136), và đo tương phản 0 cặp không đạt ở cả chế độ sáng và tối. Đạt vượt yêu cầu QC A9, A10.
