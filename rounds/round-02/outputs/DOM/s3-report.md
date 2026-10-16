# DOM – Round 2, Sprint 3 khởi động (16/10/2026)

## Đã làm gì
1. **BR v0.3.3** – áp quyết định INV 16/10 ESC-015 A, ESC-016 A, ESC-017 A; bỏ nhãn [CHỜ INV] tương ứng (BR-302, 506, 527, mục 13, mục 16 Q-D6…Q-D8). Thêm Giỗ Tổ Hùng Vương và đêm 1/9 vào ngày đặc biệt (BR-104, ví dụ ở BR-113, BR-309). Làm rõ BR-403/511 (2 thẻ **mỗi căn**) và BR-413 (dài hạn nhận sớm ngày đầu miễn phí khi căn trống – đúng ESC-007 A dòng 2). Không đổi con số INV đã quyết.
2. **ĐK-S2-7** – kiểm lại trên HEAD `99aca64`: Blocker DOM-BE-01 và 7 Major **Verified** (`reviews/s2-DOM.md` mục F). Hai thẻ Minor mới: BE-11, BE-12.
3. **Rà Sprint 3** (EP03-05-stay v0.1, EP06-registration): trả lời E05-06, E06-08 (G-1…G-5); 14 điểm mở cho BA/ARC (G-6…G-19) – `reviews/s2-DOM.md` mục G.
4. Ghi 4 dòng `01-decisions/decision-log.md`.

## Ngày Giỗ Tổ 2027
10/3 âm lịch năm Đinh Mùi = **thứ Sáu 16/4/2027**. Cách tính: Tết 6/2/2027 (khớp seed Tết [05/02, 11/02)); không có tháng nhuận đầu năm 2027; sóc tháng 3 âm = 7/4/2027 giờ VN → mùng 10 = 16/4. Officeholidays cũng ghi 16/4/2027. Cần đối chiếu thông báo nghỉ lễ 2027 của Chính phủ khi có (nếu lệch chỉ sửa một dòng tham số).

## Việc cho BE / QA
**Seed `special_dates` (DS-E `product/tests/fixtures/seed/ds-e.json` và catalogue nếu seed riêng) – thêm 2 dòng, dạng nửa mở [from, to):**
```json
{ "name": "Giỗ Tổ Hùng Vương 2027", "from": "2027-04-16", "to": "2027-04-17" },
{ "name": "Đêm trước Quốc khánh 2027", "from": "2027-09-01", "to": "2027-09-02" }
```
(Có thể gộp đêm 1/9 vào dòng Quốc khánh thành `[2027-09-01, 2027-09-03)`; DOM khuyên để dòng riêng cho dễ truy vết ESC-015.) Mỗi năm quản lý nhập lại Giỗ Tổ theo lịch âm như Tết.

**`br-examples.json` (source 0.3.3, 253 dòng, 0 lỗi theo script kiểm nhãn của DOM – chưa chạy validator Node):**
- Sửa nhãn: BR-302-03 → `INV-017`; BR-506-02 → `INV-005, INV-016` (bỏ [CHỜ INV]); BR-527-04 → thêm `INV-017`.
- Thêm: BR-104-06 (16/4/2027 → 1.030.000), BR-104-07 (17/4/2027 → 911.000, calc `calendarRate`, xanh cả trước/sau khi seed), BR-104-08 (1/9/2027 → 1.030.000), BR-104-09 (OTA 1/9/2027 → 990.000), BR-113-05 (đến 1/9/2027 ở 1 đêm → chặn), BR-309-08 (đơn có đêm 16/4/2027 hủy trước 14 ngày → hoàn 0, calc `directCancelRefund`).
- BR-104-06/08/09, BR-113-05 để `calc: null` tới khi seed có 2 dòng mới (BE test lấy ngày đặc biệt từ seed) – **QA**: thêm seed rồi đổi calc thành `calendarRate`, chạy `pnpm --filter @ottimo/tests test`.
- **BE**: không cần sửa code cho ESC-015/016/017 (đều là tham số / đã làm theo A). Hai thẻ Minor BE-11, BE-12 cho Sprint 3.

## Giả định
- Giỗ Tổ chỉ một đêm (16/4), như cách lưu 2/9 hiện tại; đêm 15/4 không phải ngày đặc biệt.
- Ngày Giỗ Tổ 2027 do DOM tra – cần đối chiếu (xem trên).

## Rủi ro / vướng mắc
- Luồng **chi hoàn** chưa có trong spec Sprint 3 (G-14) – B10 có cọc, trả sớm, dời ra ngoài đều sinh số dư âm mà chưa ai chi. Cần trước khi dùng thật.
- Máy DOM không có Node: chưa chạy validator/test.

## Việc chưa xong
- Thẻ Minor/Suggestion Sprint 2 khác (BE-08, 09, 10, FE-02, QA-01, BA-01) chưa kiểm lại – DOM kiểm khi thử luồng Sprint 3–4.

## Bổ sung theo ORC (quyết định PO 16/10) – vẫn BR v0.3.3
- BR-522: câu thực hiện "chi hoàn sau khi duyệt" – tiền mặt tại quầy FD+ (không tự chi khoản mình tạo yêu cầu, ≤ số đã duyệt, biên nhận, vào đóng ca BR-526); chuyển khoản chỉ MGR/OWN; ví dụ 350.000. Đóng phần nghiệp vụ của G-14 (luồng/API chi hoàn vẫn chờ BA/ARC 0.3.6).
- BR-527: tiền mặt sale/CTV nộp quầy do FD+ xác nhận, không bao giờ là người ghi; chuyển khoản/VietQR đối soát sao kê giữ MGR+.
- `br-examples.json`: thêm BR-522-01, BR-527-05 (`calc: null`, 255 dòng, 0 lỗi nhãn) – QA dùng làm oracle cho `recordRefund` / xác nhận tiền mặt khi ARC có hợp đồng 0.3.6.
