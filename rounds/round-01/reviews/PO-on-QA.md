# PO review QA – Round 1, bước 3

- Người review: PO | Ngày: 15/10/2026
- Đối tượng: `product/docs/qa/test-strategy.md`, `product/tests/test-cases/r1-main-flows.md` (313 TC), `product/docs/qa/traceability.md` (v0.1)
- Góc nhìn: test có kiểm đúng AC của story Must R2 không, ưu tiên có phản ánh rủi ro kinh doanh (tiền, đặt trùng, pháp lý, dữ liệu C3) không, có quy trình nghiệm thu của PO và đo được chỉ số thành công PRD không. Đã đối chiếu backlog mục 4, PRD mục 3 và 7, report QA mục 4.
- Tổng: **0 Blocker · 0 Major · 5 Minor · 2 Suggestion** (cộng phần "Tự nhận lỗi" của PO ở cuối file)

---

### FB-R1-PO-QA-01
- Mức độ: Minor
- Vị trí: `r1-main-flows.md` TC-NT-001 (kỳ vọng "Vào Sơ đồ phòng (room rack)"), TC-NT-006
- Vấn đề: hai TC đang kiểm màn mặc định của `front_desk` là room rack, theo US-001 AC1 hiện tại. PO đã quyết đổi màn mặc định của `front_desk` và `front_desk_lead` thành **"Hôm nay"** (xem FB-R1-PO-UXD-03). Điểm lệch này do QA phát hiện (report #8).
- Vì sao quan trọng: nếu không sửa, TC sẽ báo lỗi sai khi FE làm đúng quyết định mới.
- Đề xuất sửa: sau khi PO sửa US-001 AC1 và BA sửa rbac mục 1 ở bước 4, cập nhật kỳ vọng của TC-NT-001 thành "Vào màn Hôm nay; Sơ đồ phòng mở được bằng 1 lần bấm". TC-NT-006 dùng cột màn mặc định mới của rbac.
- Trạng thái: Open

### FB-R1-PO-QA-02
- Mức độ: Minor
- Vị trí: `r1-main-flows.md` TC-L2-024 (kỳ vọng đang theo OpenAPI: server tự gán căn trống cùng nhóm)
- Vấn đề: QA đã ghi đúng là đang có mâu thuẫn (report #2), nhưng kỳ vọng tạm lại chọn theo OpenAPI, tức server **tự đổi căn** khi lễ tân nhập tay đơn OTA vào căn đã kín. PO quyết như sau (sẽ sửa US-018, US-139 ở bước 4): khi lễ tân nhập tay đơn OTA trùng thì **không tự đổi căn mà không báo**. Server trả `409 ROOM_UNAVAILABLE` kèm gợi ý căn trống cùng nhóm, lễ tân chọn căn rồi lưu. Nếu cả nhóm đã kín thì lễ tân lưu được đơn vào làn "Chưa gán căn" (`conflictState=open`) với cảnh báo đỏ, vì kênh đã bán và không được từ chối khách.
- Vì sao quan trọng: nếu lễ tân không biết căn đã bị đổi thì sẽ giao sai mã cửa, sai căn trên OTA, và khách đến bị nhầm phòng.
- Đề xuất sửa: sau khi PO sửa backlog, đổi kỳ vọng TC-L2-024 lần 1 thành "409 + gợi ý; lễ tân chọn 202 → tạo đơn ở 202". Lần 2 giữ như hiện tại. Thêm 1 ca: lưu khi cả nhóm kín mà không chọn "lưu vào Chưa gán căn" → bị chặn.
- Trạng thái: Open

### FB-R1-PO-QA-03
- Mức độ: Minor
- Vị trí: `r1-main-flows.md` mục 0 (ƯT "Cao = smoke, chạy mọi PR"); `traceability.md` mục 1 (Cao 192 / 313 = 61%); `test-strategy.md` mục 2 và mục 6 (R2)
- Vấn đề: 61% số TC được xếp Cao, và định nghĩa Cao đang trộn hai nghĩa: "smoke chạy mọi PR" và "bắt buộc đạt mới qua round". Trong 313 TC có 117 TC có tầng E2E.
- Vì sao quan trọng: nếu chạy 192 ca (nhiều ca E2E) ở mọi PR thì CI chậm và dễ chập chờn, dev R2 sẽ có xu hướng bỏ qua. Ngược lại, nếu hạ mức để CI nhanh thì lại mất nghĩa "chặn phát hành".
- Đề xuất sửa: tách thành 2 nhãn. **Cao** = điều kiện ra round (giữ nguyên). **Smoke** = khoảng 30–40 ca chạy mọi PR, chọn theo rủi ro kinh doanh: đặt trùng và đồng thời (TC-X-001…004, TC-L2-020/021), tiền bill (phụ thu, cọc, hủy, trả phòng), lộ dữ liệu C3 (TC-RB-001…), hạn khai báo, tự hủy giữ chỗ. Phần Cao còn lại chạy hằng đêm.
- Trạng thái: Open

### FB-R1-PO-QA-04
- Mức độ: Minor
- Vị trí: `test-strategy.md` mục 6 (tiêu chí vào/ra R2, R3)
- Vấn đề: chiến lược chưa có bước **PO nghiệm thu story theo AC**, trong khi skill PO và DoD có "chấp nhận hoặc trả lại user story". Cũng chưa nối với kịch bản dùng thử của INV ở R3 (`uat-script.md` do PO viết).
- Vì sao quan trọng: nếu không có bước này, một story có thể được QA đóng mà chưa qua PO. INV sẽ nhận bản RC mà PO chưa xác nhận giá trị.
- Đề xuất sửa: R2 thêm "mỗi story: QA chạy hết TC Cao của story → PO xem demo trên staging, đối chiếu AC → Accepted / Trả lại (ghi lý do)". R3 thêm "kịch bản UAT của PO chạy trên dữ liệu DS-0 đã reset; QA hỗ trợ dữ liệu".
- Trạng thái: Open

### FB-R1-PO-QA-05
- Mức độ: Minor
- Vị trí: `test-strategy.md` mục 7 (hiệu năng); so với PRD mục 7 N3 ("màn chính ≤ 2 giây trên 4G; thao tác lưu ≤ 1 giây"), N2
- Vấn đề: bảng hiệu năng đã có đích cho app khách (< 2 s) và API (p95). Nhưng chưa có đích cho **giao diện nhân viên trên điện thoại** (buồng phòng, sale, lễ tân ca tối) tải màn chính qua 4G, và chưa có đích "lưu ≤ 1 giây" nhìn từ người dùng.
- Vì sao quan trọng: buồng phòng làm trên mạng yếu (persona P3, H-07). Sale và CTV báo giá ngay khi đang dẫn khách (S6 ≤ 3 phút).
- Đề xuất sửa: thêm 2 dòng: "PWA nhân viên – màn Việc của tôi / Căn trống, 4G mô phỏng, < 2 s (R3)" và "Lưu đơn / Dọn xong / ghi folio – phản hồi trên giao diện ≤ 1 s p95 (R3)".
- Trạng thái: Open

### FB-R1-PO-QA-06
- Mức độ: Suggestion
- Vị trí: `r1-main-flows.md` (chưa có nhóm ca cho dữ liệu chỉ số); so với `metrics-definitions.md` mục 4 và mục 9
- Vấn đề: chỉ số thành công S3, S4, S5, S7, S8, S11 cần các trường được ghi từ R2 (`checkout_started_at`, `checkin_started_at`, `pre_submitted_at`, `guest_link_sent_at`, `hold_expires_at`, `FocApproval…`). Hiện chưa có TC nào kiểm các trường này có được ghi hay không.
- Vì sao quan trọng: nếu R2 quên ghi thì R4 không đo được PRD S3–S8, và dữ liệu đã mất không lấy lại được.
- Đề xuất sửa: thêm khoảng 5 TC tầng A, ví dụ "TC-X-0xx – Hoàn tất trả phòng thì `checkout_started_at` và `checkout_completed_at` có giá trị, đúng múi giờ", tương tự cho nhận phòng, gửi link, tự hủy giữ chỗ, duyệt FOC.
- Trạng thái: Open

### FB-R1-PO-QA-07
- Mức độ: Suggestion
- Vị trí: `traceability.md` mục 2 (ma trận story Must R2)
- Vấn đề: ma trận chưa cho thấy story nào có kỳ vọng phụ thuộc vào ESC chưa quyết. Trong TC thì đã có ghi chú "chờ ESC-xxx".
- Vì sao quan trọng: khi INV trả lời ESC, PO và QA cần biết ngay những TC hoặc AC nào phải cập nhật.
- Đề xuất sửa: script sinh thêm cột "ESC liên quan" bằng cách gom các mã ESC xuất hiện trong AC và TC của từng story.
- Trạng thái: Open

---

## Điểm làm tốt
1. **Truy vết sinh bằng script**: 74/74 story và 244/244 AC có TC, 0 tham chiếu sai, có danh sách ô trống cụ thể (mục 5). Nhờ đó PO phát hiện được chính lỗi của mình trong backlog (xem phần dưới), thay vì chỉ thấy "đã đủ".
2. **Bộ oracle từ ví dụ BR, đồng hồ giả và kiểm 3 điểm quanh mỗi mốc giờ**: kiểm được đúng những chỗ prototype hay sai (giữ chỗ, khai báo, no-show, phụ thu). Ngoài ra **không tự chọn bên khi tài liệu mâu thuẫn**, mà ghi rõ giả định đang test (TC-L3-046, TC-L2-024).
3. **Mức lỗi P0–P3 áp dụng được cho cả tài liệu R1**, và test case đã ưu tiên đúng các lỗi BL 8.2 mức Cao (đặt trùng song song, giữ chỗ hết hạn, phụ thu dài hạn, OOO chặn bán, ký quỹ). Khớp với mục tiêu PRD S1, S7, S10.

---

## Tự nhận lỗi để sửa ở bước 4 (lỗi trong file của PO – không sửa ở bước 3)

| # | Lỗi | Nguồn phát hiện | Sửa ở bước 4 |
|---|---|---|---|
| T1 | US-001 AC1 ghi màn mặc định `front_desk` = room rack | QA #8 | Đổi thành "Hôm nay" (quyết định PO, FB-R1-PO-UXD-03); báo BA sửa rbac mục 1 |
| T2 | US-018 AC1 "bị chặn" mâu thuẫn với US-139 (Must R3) và OpenAPI/ERD (tự gán căn / `conflictState`) | QA #2 | US-018 thêm AC cho đơn OTA nhập tay: 409 + gợi ý, lễ tân chọn căn, không tự đổi căn mà không báo; hết căn → làn "Chưa gán căn". Kéo phần AC tối thiểu của US-139 (làn chưa gán căn, chặn nhận phòng `RESERVATION_UNASSIGNED`, cảnh báo đỏ) vào **Must R2**; phần đồng bộ tự động vẫn R3. Báo ARC chỉnh OpenAPI |
| T3 | US-023 AC2 (Must R2) yêu cầu tra mã khách sau khi gộp, trong khi gộp hồ sơ là R3 (ERD, PRD M7) | QA #6 | Chuyển AC2 sang US-074 (gộp hồ sơ, R3); US-023 chỉ giữ AC1 (mã chứng từ). Báo QA chuyển TC-NT-023 sang US-074 |
| T4 | US-087 AC2 cần màn/endpoint "Hoa hồng của tôi" (S17), nhưng OpenAPI R2 chưa có, và màn tổng hợp hoa hồng là US-089 R3 | QA #7 | Thu hẹp AC2 ở R2: "CTV chỉ thấy hoa hồng dự kiến trên chi tiết báo giá/đơn của mình; gọi API đơn/báo giá người khác → 404". Màn tổng hợp S17 chuyển sang US-089 (R3). US-003 AC3 ghi rõ ở R2 chỉ kiểm việc bị từ chối truy cập (S20/S21 là R3) |
| T5 | PRD mục 6.2 "CTV/Sale: … giữ chỗ → **xác nhận cọc**" – trái rbac A04 (CTV chỉ "Báo đã chuyển cọc", A53) | QA #11 | Sửa PRD 6.2: Sale nội bộ xác nhận cọc đơn của mình; CTV báo đã chuyển cọc kèm ảnh |
| T6 | 13 BR chưa được story hay TC nào tham chiếu: BR-215, 313, 314, 501, 504, 505, 506, 513, 523, 705, 706, 902, 955 | QA #14 | Gắn vào story R3/R4+ tương ứng: BR-215, 902 → story báo cáo EP13; BR-313, 314 → story chấm dứt/hủy HĐ EP11; BR-501, 504, 505 → story điện nước EP08; BR-506 → yêu cầu dọn lẻ EP14/EP07; BR-513 → thêm story Could "đồ khách để quên"; BR-523 → US-122; BR-705, 706 → EP09 kho; BR-955 → US-078 |
| T7 | Các màn bảo mật (2FA TOTP, thiết bị được cấp, OTP email/mã xác minh khách) chưa có story | PO review UXD-04 | Thêm story NFR bảo mật có AC theo SR-AUTH-06, SR-DEV-01…07, SR-GST-07…11 (SEC) và xếp round. Đề xuất: OTP/mã xác minh khách R2 (vì mã cửa và hóa đơn hiện trong app khách R2), thiết bị được cấp R2 (vì C3), TOTP R3 |
| T8 | PRD S1 chỉ đếm đơn `confirmed`/`in_house`; DATA đã định nghĩa chặt hơn (S1a/S1b, gồm `hold` và OOO). PRD S2 ghi "100% với khách nhận phòng trong giờ trực lễ tân", chưa gắn tham số | PO review DATA | Sửa PRD 3.2 trỏ sang S1a/S1b của DATA; S2 gắn `front_desk_hours` (BR-811) |
| T9 | Chính sách nhận phòng khi hộ chiếu/thị thực "Không đạt", và hai chế độ hạn khai báo người nước ngoài (`earlier_of` / `hours_only`), chưa có câu hỏi rõ trong ESC-001 | PO review DOM-02, DOM-04 | Bổ sung 2 câu hỏi vào ESC-001 (không tạo ESC mới); cơ sở phụ thu cho đơn OTA (DOM-03) bổ sung vào ESC-007 |
| T10 | Danh sách kênh chưa chốt (BR-901 / UXD / DATA lệch nhau), ảnh hưởng form đặt phòng R2 và G3 | PO review UXD-05, DATA-04 | PO chốt trong backlog (US-017) cùng DOM và DATA: kênh R2 = danh sách BR-901 + "Trực tiếp" có trường phụ "nguồn" (Zalo/điện thoại, Website, vãng lai, khách quay lại); kênh "Nội bộ" cho phòng dùng nội bộ |
| T11 | "Chốt tháng" (MonthClose) và đối chiếu R-01…R-07 xuất hiện trong metrics và ERD nhưng chưa có story | PO review DATA-02 | Thêm story Could R3 "Chốt số liệu tháng"; đối chiếu R-01…R-07 thành AC của story báo cáo EP13 R3 |
