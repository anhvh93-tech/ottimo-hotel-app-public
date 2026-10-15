# Báo cáo UXR – Round 1 · Bước 2 (Sản xuất – Đợt 1)
> Mô phỏng – cần INV kiểm chứng. Mọi persona, hành trình, giả thuyết là mô phỏng của agent AI, chưa có dữ liệu người thật.
>
> Ghi chú ORC: UXR không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung UXR gửi, với sự đồng ý của INV.

## 1. Đã làm gì
1. 7 persona mô phỏng P1–P7 + ma trận persona × phân hệ + yếu tố bao trùm (mù màu, lớn tuổi, mạng yếu, màn nhỏ, ngôn ngữ, ngắt quãng).
2. 4 hành trình: J1 khách ngắn ngày (7 giai đoạn, biến thể trực tiếp/OTA), J2 khách dài hạn, J3 một ca lễ tân, J4 một ngày buồng phòng/bảo trì; 12 cơ hội O-01…O-12 gắn L1–L8 và BL.
3. Heuristic review prototype R0 (Nielsen + WCAG 2.2 AA, đo tương phản): 25 phát hiện – 4 Blocker (HR-01, 04, 06, 07), 12 Major, 7 Minor, 2 Suggestion; bảng BL 8.3 → WCAG → mã; 6 điểm mạnh nên giữ.
4. 20 giả thuyết H-01…H-20 cần INV kiểm chứng; 9 giả thuyết ưu tiên Cao đưa vào dự thảo ESC.
5. Ghi 3 dòng decision-log.

## 2. File tạo/sửa
- product/docs/research/personas.md (mới)
- product/docs/research/journeys.md (mới)
- product/docs/research/heuristic-review-r0.md (mới)
- 02-escalations/ESC-DRAFT-UXR-kiem-chung-nguoi-dung.md (dự thảo, chờ ORC cấp số)
- 01-decisions/decision-log.md (nối 3 dòng)
- rounds/round-01/outputs/UXR/report.md (file này)
Ghi chú: skill đặt đường dẫn product/docs/ux/…; round này theo plan.md (product/docs/research/…).

## 3. Giả định
- [GIẢ ĐỊNH – chờ INV xác nhận] Chủ đầu tư và CTV dùng điện thoại là chính; lễ tân dùng laptop tại quầy; buồng phòng dùng Android tầm trung, mạng chập chờn.
- Hồ sơ persona và tên là hư cấu, dựa trên brief mục 1, 5.
- Mốc giờ J3/J4 lấy theo quy tắc BL; số ca, số người mỗi ca là giả định.
- Số liệu đánh giá OTA (nước nóng 9%, Wi-Fi 6%, đậu xe 5%) là dữ liệu mẫu của prototype.
- Heuristic review dựa trên đọc mã, chưa render giao diện.

## 4. Rủi ro / vướng mắc
- P3 buồng phòng có độ tin cậy thấp: nếu H-05 sai thì phân hệ buồng phòng mobile phải đổi hướng.
- H-10 (gửi link check-in cho khách OTA) phụ thuộc INT/channel manager.
- H-12 (cách khách Nga thanh toán) ảnh hưởng ESC thanh toán của PO/INT.
- Một số phát hiện trùng lỗi logic BL 8.2; phân loại nghiệp vụ vẫn thuộc DOM.
- Dự thảo ESC chưa có số.

## 5. Việc chưa xong
- Chưa có ảnh chụp màn hình cho heuristic review; UXD/QA xác nhận thị giác khi review.
- real-user-test-guide.md để Round 2 (bản rút gọn 1 trang nếu INV chọn phương án A).
- Bước 3: review UXD (bắt buộc), PO; chờ PO, UXD, DOM review sản phẩm UXR.

---

## Bước 4 – Phản hồi & sửa (15/10/2026)

### Đã làm gì
1. Trả lời đủ **27 thẻ** (UXD 14, PO 6, DOM 7) trong `rounds/round-01/responses/UXR-responses.md`: **25 Done, 2 Deferred** (UXD-10 đánh giá chế độ tối/trạng thái/luồng check-in online → `usability-report-r2.md`; UXD-13 thêm J5, J6 → test kịch bản R2), 0 Rejected, 0 Escalated. **8/8 thẻ Major đã Done; Blocker/Major còn Open: 0.**
2. `personas.md` v0.2: hạn khai báo theo BR-602 (VN 23:00) / BR-603 (NN giờ đến + 12 giờ); bỏ USDT + ghi chú pháp lý; thước đo P7 theo PRD S5; nhắc thị thực theo BR-605; thêm ánh xạ persona ↔ U1–U5 ↔ RBAC ↔ BL và bảng bề mặt → persona chính; biến thể Quản lý, tách vai buồng phòng/kỹ thuật, nhân viên trẻ; viết lại mục 9 (cột luật quyết định, cột đường kiểm chứng, H-20 nâng Cao, H-03 hạ TB, H-06 đóng, thêm H-21…H-24).
3. `journeys.md` v0.2: J3 10:30 sửa theo BR-414/HR-04 (giờ mặc định = giờ chuẩn, phụ thu 0); nhắc khai báo theo thời gian còn lại; J4 dọn theo yêu cầu 100k/lần (bỏ "gói dọn"); express check-out có bước trả 2 thẻ (BR-511, BR-427); kẹt ngoài cửa, khách đến 04–06h; giao lại căn sau sửa; mục 4b Ngoại lệ thường gặp; mục 5 thêm cột Story/Round và ý ngoài MVP.
4. `heuristic-review-r0.md` v0.2: HR-20 nâng **Blocker**; HR-13 tách 13a (Major)/13b (Minor); lý do HR-02 Major; HR-12 phụ thuộc H-01; tổng 26 = 5B/11M/8m/2S; ghi rõ phần chưa bao phủ dời R2.
5. Viết lại `02-escalations/ESC-003.md`: 7 điều Cao bằng lời thường (mã trong ngoặc), câu không hỏi lại (ESC-007, ESC-010, INT), thời gian chủ động ~1–1,5 giờ + tối đa 3 ngày chờ, H-05 kiểm bằng 3 nhiệm vụ trên điện thoại nhân viên với `06-housekeeping-mobile.html` + luật quyết định, liên hệ ESC-012, nơi gửi kết quả.
6. Tạo phiếu 1 trang `product/docs/research/real-user-check-guide.md` (câu hỏi + phiếu ghi + tin nhắn EN/RU cho khách thuê tháng).
7. Đề xuất 4 dòng decision-log ở cuối `UXR-responses.md` (không tự sửa decision-log).

### File tạo/sửa (Bước 4)
- product/docs/research/personas.md (sửa, v0.2)
- product/docs/research/journeys.md (sửa, v0.2)
- product/docs/research/heuristic-review-r0.md (sửa, v0.2)
- product/docs/research/real-user-check-guide.md (mới)
- 02-escalations/ESC-003.md (viết lại)
- rounds/round-01/responses/UXR-responses.md (mới)
- rounds/round-01/outputs/UXR/report.md (thêm mục này)

### Giả định
- Hạn khai báo khách NN lấy theo nguyên tắc "giờ đến + 12 giờ" của BR-603; tài liệu UXR không tự tính lại, chỉ dẫn BR-603 và chỉ dùng ví dụ đúng với mọi cách diễn đạt (đến 08:00 → hạn 20:00), vì DOM đang sửa câu chữ BR-603 song song.
- UXD (hoặc ORC) cung cấp link bản tĩnh `06-housekeeping-mobile.html` mở được trên điện thoại để INV dùng phiếu phần C; nếu không, INV mở trực tiếp tệp HTML.
- Bản tin nhắn tiếng Nga trong phiếu do đội soạn, nên nhờ người nói tiếng Nga xem lại.
- Đối chiếu story/round ở journeys mục 5 theo `backlog.md` tại 15/10/2026; PO có thể đổi song song.

### Rủi ro / vướng mắc
- Wireframe L6 là bản vẽ tĩnh: buổi thử H-05 đo "biết bấm đâu" và "đọc được trên máy mình", chưa đo thao tác thật (tay ướt, mất mạng) – sẽ đo lại trên bản PWA ở R2.
- Thử H-05 do chủ đầu tư (người trả lương) tiến hành vẫn có thiên lệch "trả lời cho vừa lòng"; đã giảm bằng cách quan sát làm thử và câu mở đầu trung lập.

### Việc chưa xong
- FB-R1-UXD-UXR-10, -13 (Deferred sang R2).
- Áp luật quyết định khi có kết quả ESC-003 (đầu R2).
