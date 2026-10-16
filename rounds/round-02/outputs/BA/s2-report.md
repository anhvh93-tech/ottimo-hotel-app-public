# Báo cáo BA – Round 2, Sprint 2 "Đặc tả Sprint 4: EP07/EP08, EP14 R2, EP01"

- Người làm: BA | Ngày: 16/10/2026 | Căn cứ: `rounds/round-02/plan.md` mục 2.1 (R-C), mục 4 (Sprint 4 – BA đi trước dev một sprint); BR **v0.3.1** (BR-8xx, BR-435, BR-811, BR-812, BR-904/907); `metrics-definitions.md` **v0.2**; OpenAPI **0.3.4-draft**; SEC ĐK-1…6 (`outputs/SEC/w1-review.md` mục 4, `s1-decisions.md`); ADR-005, ADR-006; `outputs/ARC/s1-contract.md` mục 3 (Q-B1, Q-B2).

## 1. Đã làm gì
1. **`specs/EP07-08-housekeeping-maintenance.md`** (US-052…057, 061, 062; US-058 Should; khung US-063 R3): trạng thái buồng theo vai (phạm vi T, bộ lọc), đổi trạng thái SM-03 với `expectedFrom`/`performedAt` + hoàn tác 10 giây ở máy, nguồn sinh việc + thứ tự ưu tiên BR-807 (7 bậc), BR-812 phía buồng phòng (chuẩn bị/chuyển/thu hồi, mục kiểm động), kiểm phòng (tự kiểm, không đạt), báo sự cố từ điện thoại (đề nghị khóa – HK không tự khóa), phiếu sửa + khối OOO (409 khi có khách/trùng đơn, hai ngày "xong / mở bán lại"), thời hạn BR-809 (dừng khi chờ vật tư), gợi ý đổi phòng + FOC khi mức Cao quá hạn, ảnh bằng chứng, **PWA offline + bảng phân loại kết quả đồng bộ** ("Đã áp dụng" / "Không áp dụng được" / thử lại / tạm dừng).
2. **`specs/EP14-guest-app.md`** (US-106, 108 trừ mã cửa, 109, 110, 112): áp ĐK-1…6 (3 tab, không bill/mã cửa/OTP), mở bằng link và QR trang căn (gửi lại link chờ, không lộ đơn), thông tin lưu trú mức 1 + Wi-Fi theo khung, yêu cầu khách (loại theo trạng thái đơn, ghi chú bắt buộc theo loại, giới hạn SR-RL-05), định tuyến BR-811 (việc HK/phiếu sửa sinh ngay), hạn trả lời trong/ngoài giờ trực, liên kết trạng thái yêu cầu ↔ việc/phiếu, ngôn ngữ.
3. **`specs/EP01-dashboard.md`** (US-010, 011, 012 trừ AC2; khung US-013): KPI đêm nay đúng metrics v0.2 (Occupancy = căn có đêm `sold` **đã gán** ÷ đêm khả dụng thuần; giữ chỗ và đơn OTA chưa gán – S1c – hiện riêng, không cộng), khách đến/đi BR-404, 20 loại "Cần chú ý" theo vai (OWN/MGR/FD), **BR-435 chỉ OWN** (công thức lũy kế tháng), đóng mục sự kiện, bản đồ SSE → API gọi lại.
4. **Trả lời ARC Q-B1** – Đồng ý: `rbac-matrix.md` S33 FDL/FD/SAL = **M R** (giao dịch do mình ghi hoặc xác nhận; không đối soát), ghi chú 33a; SM-12 `pending → succeeded` thêm SAL (cọc đơn của mình, như A33 M). `rbac-matrix.json` không cần đổi (`listPayments` đã ánh xạ A33); `gen_traceability.py --strict` chạy ra thư mục tạm: **exit 0**, ops/fields mismatched 0.
5. **Trả lời ARC Q-B2** – Đồng ý: khai báo `mixed` chỉ `sent` (K6) khi **mọi** khối có mã; khối thiếu vẫn tính hạn riêng (BR-602 / BR-603), "Cần chú ý" hiện hạn sớm nhất chưa xong – ghi vào SM-05 K6.
6. **Xác nhận V-02 (EP00)**: câu ARC thêm đúng; BA bỏ nhãn chờ, ghi rõ áp cho mọi trường SĐT đầy đủ (gồm SĐT nhân viên), trường che giữ dạng che, request nhận mọi dạng người dùng gõ. Đề nghị ARC thêm `pattern` E.164 cho `User.phone` (hiện chỉ `Guest.phone` có).
7. Cập nhật `state-machines.md` → 0.2.3 (SM-12, SM-05 K6, R4 kiểm không đạt, SM-15 tự ghi "đã nhận"); `decision-log.md` +7 dòng BA.

## 2. File đã tạo/sửa
| File | Thay đổi |
|---|---|
| `product/docs/specs/EP07-08-housekeeping-maintenance.md` | **Mới** v0.1 |
| `product/docs/specs/EP14-guest-app.md` | **Mới** v0.1 |
| `product/docs/specs/EP01-dashboard.md` | **Mới** v0.1 |
| `product/docs/specs/EP00-platform.md` | V-02 (xác nhận câu E.164) + lịch sử |
| `product/docs/rbac-matrix.md` | 0.2.2: S33 theo vai, ghi chú 33a |
| `product/docs/state-machines.md` | 0.2.3: SM-12, SM-05 K6, SM-03 R4, SM-15 |
| `01-decisions/decision-log.md` | +7 dòng BA |
| `rounds/round-02/outputs/BA/s2-report.md` | Báo cáo này |

Không sửa file vai khác (OpenAPI, erd, BR, metrics, chuỗi UXD, SEC).

## 3. Giả định (nhãn `[GIẢ ĐỊNH BA]` trong specs – gom ở E07-15, E14-07, E01-07/08)
- Phạm vi T của HK gồm việc **chưa giao ai**; việc giao người khác chỉ xem.
- Thứ tự ưu tiên: yêu cầu khách xếp bậc 3 (sau căn có khách đến); việc dọn ở lại không xong bị hủy khi sang ngày mới, loại khác chuyển ngày.
- Kiểm phòng không đạt: buồng giữ `VC` + việc "Dọn lại theo kiểm phòng" (SM-03 không có `VC → CL`); ảnh chỉ bắt buộc khi HK tự kiểm.
- Mức phiếu mặc định theo loại sự cố (`category` mới) và việc khách đang ở; mở lại phiếu trong kỳ lưu trú hoặc 7 ngày khi căn trống; cảnh báo khối OOO sắp hết lúc 12:00 ngày cuối.
- PWA offline: phiếu sửa/khối OOO/yêu cầu khách giữ online; hàng đợi ≤ 200 mục, ≤ 20 ảnh.
- App khách: 3 loại yêu cầu lễ tân (xe/tour, trả muộn, khác) dùng được trước ngày đến; ghi chú bắt buộc cho báo hỏng/xe-tour/khác; hạn trả lời yêu cầu ngoài giờ = mở giờ trực + phút BR-811; phí dọn lẻ chỉ hiện cho khách dài hạn; trang yêu cầu tự tải lại 30 giây.
- Dashboard: BR-435 so lũy kế đầu tháng, gồm FOC tự áp; thẻ ADR/RevPAR ẩn hẳn ở R2; danh sách đến/đi xem được ±7 ngày (chỉ hôm nay có nút).

## 4. Rủi ro / vướng mắc
| # | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R-1 | Gói dọn dài hạn gắn HĐ (dời R3); khách dài hạn R2 là đơn nhập tay AC5a | **US-056 không chạy được** ở R2 | E07-06: `manualLongStay.cleaningPlan` – ARC + PO quyết trước Sprint 4 |
| R-2 | US-012 AC3 đòi dòng thị thực có **ngày hết hạn**, SEC SR-RET-06 chỉ cho mã đơn | QA/PO nghiệm thu AC3 sẽ vướng | E01-06: PO sửa AC3 hoặc SEC nới |
| R-3 | `foc_threshold` có trong enum nhưng job J21 là R3 | OWN không có cảnh báo BR-435 ở R2 | E01-05: tính khi đọc cho OWN ở R2 |
| R-4 | Khối OOO hết ngày dự kiến mà phiếu chưa xong → căn tự mở bán | Bán phòng hỏng | E07-13: mục "Cần chú ý" + nút kéo dài khóa |
| R-5 | Thiếu trường/endpoint: đọc ảnh đính kèm, nhật ký phiếu (US-062 AC2), checklist theo căn (BR-812 (5)), `category`/`lockRequested` phiếu, `partsExpectedDate`, ngày dự kiến xong để server tính ngày mở bán | FE/MOB tự chế hoặc thiếu AC | Gom E07-01…11 vào OpenAPI 0.3.5 |
| R-6 | Đề nghị thêm trường phía khách (`replyNote`, `declinedReasonCode`, phí dọn lẻ) chạm ĐK-2 | Vi phạm điều kiện SEC nếu BE cài trước | E14-03/04 phải qua SEC trước |
| R-7 | Chuỗi UXD lệch: `hk.task.extra_kit_items` ("1 1 mền", "không gối"), `guest.req.fee_notice` (hứa hóa đơn trên app), `guest.req.reply_time` (giờ cố định), `today.kpi_occupancy_note` | Sai nội dung hiển thị | E07-14, E14-06, E01-09 |
| R-8 | Tên sự kiện SSE việc buồng phòng lệch (`task.assigned` ↔ `hk_task.changed`); BR-805 (72 giờ) chạy trong job một lần/ngày | Màn không tự cập nhật / VI chuyển VC trễ | E07-08, E07-03 |

## 5. Đề nghị gửi vai khác (chi tiết ở mục cuối mỗi file specs)
- **ARC** (OpenAPI 0.3.5): E07-01…11, E07-13; E14-01, 02, 04, 05; E01-01…05; `User.phone` pattern E.164 (V-02).
- **SEC**: E07-01 (đọc ảnh), E07-12 (thời hạn ảnh đính kèm, ảnh kiểm phòng trong IndexedDB, không cache ghi chú khách), E14-03/04 (ĐK-2), E14-08, E01-06.
- **PO**: E07-06 (US-056), E01-05 (BR-435 ở R2), E01-06 (AC3).
- **DOM**: E07-15, E14-07, E01-08. **DATA**: E01-07. **UXD**: E07-14, E14-06, E01-09. **QA**: E07-16, E14-09, E01-10.

## 6. Việc chưa xong
- Chờ review bắt buộc DOM, ARC (khuyến nghị QA) cho ba file specs mới – `reviews/DOM-on-BA.md`, `ARC-on-BA.md`; cập nhật specs khi ARC trả lời E-xx (0.3.5).
- US-063 bảo trì định kỳ, US-060 ảnh sau kiểm, US-013 chỉ có khung – viết chi tiết khi PO kéo vào.
- Không tạo ESC mới: các điểm còn mở thuộc DOM/SEC/PO/ARC nội bộ; BR-808, BR-809, BR-811 đã nằm trong nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` của DOM (tham số, không chặn).
