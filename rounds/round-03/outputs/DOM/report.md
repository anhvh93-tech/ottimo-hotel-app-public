# Báo cáo DOM – Round 3, Sprint 1, bước Sản xuất (22/10/2026)

- Ghi chú: ORC ghi file này thay DOM (công cụ chặn subagent ghi `report.md`; INV cho phép 23/10).

## Đã làm gì
1. **Quy tắc nghiệp vụ v0.4.0** (`product/docs/business-rules.md`):
   - ESC-022 B: BR-012 (7) dùng Wi-Fi chung "OTTIMO BOUTIQUE STAY"; mật khẩu OWN nhập trên app, seed ghi `<wifi-password>`.
   - ESC-023 A: BR-309 (iii) không thu phí khi rút ngắn rồi vẫn đến ở; mức giữ chống lách chỉ dùng khi hủy hẳn/no-show.
   - ESC-024 B: BR-416, hết 15 phút thì lễ tân thu đúng số server tính, không miễn/giảm, báo MGR + OWN, MGR xem lại trong 24 giờ.
   - ESC-026 A: BR-433 (c), tổng miễn trên lượt vượt ngưỡng thì báo OWN, có một mục "Cần chú ý", OWN thu hồi được khi folio chưa `closed`.
   - ESC-027 B: thêm BR-437.
   - Thêm BR-309 (vii) và BR-308 (R3-Q01); BR-525 (i) hạn nợ 3 ngày theo ngày nghiệp vụ.
   - Mục 13 thêm 5 khóa; mục 18 ghi lịch sử v0.4.0.
2. **Oracle lượt kiểm tiền** (`rounds/round-03/outputs/DOM/s1-money-oracle.md`):
   - Định nghĩa chung B/R/D/O/W/hạn.
   - Số đúng cho 210, 209, 208, BE-83 + ESC-026, #8–#12, Q23, Q24, Q29, Q01, Q10.
   - 15 bất biến I1–I15 cho fuzz R3-Q30.
   - Đề xuất các dòng fixture mới.
   - Ca hồi quy ESC-023 A và chuẩn kiểm ESC-024 B.

## File đã tạo/sửa
- `product/docs/business-rules.md`
- `rounds/round-03/outputs/DOM/s1-money-oracle.md`
- `01-decisions/decision-log.md`

## Giả định
- **ESC-026:** tổng miễn trên lượt gồm FOC, giảm giá đặc biệt và xóa nợ, không tính khoản OWN tự duyệt. Ngưỡng là hạn mức một lần của vai cao nhất có khoản miễn trên lượt (quản lý = giá đêm cao nhất, lễ tân trưởng 300.000, lễ tân 100.000). Khi tổng đang vượt ngưỡng, mỗi khoản miễn mới gửi thêm một thông báo cho OWN. "Thu hồi" là đường tiền mới, cần hợp đồng ARC (ARC dời Sprint 2, E26-6…8 `pendingFix`).
- **ESC-024:** khách không chịu trả phụ thu thì lễ tân không ghi công nợ được, giữ yêu cầu mở như tranh chấp. Quản lý trả lời sau khi lễ tân đã hoàn tất thì chuyển thành việc xem lại, không ghi tiền.
- **R3-Q01:** chỉ áp cho đơn Trực tiếp/CTV, người làm từ quản lý trở lên; mã lý do đề xuất `property_fault`; dịch vụ đã thực hiện thì gợi ý đảo.
- **Hạn công nợ** = ngày nghiệp vụ lúc ghi + 3; hạn sửa tay ≥ ngày nghiệp vụ + 1; quá hạn khi ngày nghiệp vụ > hạn.
- Số trong oracle #8, #9 (700.000, 170.000) chỉ là ví dụ minh họa, không phải giá INV.

## Rủi ro / vướng mắc
- ARC 16.31.2: theo câu cũ, nợ cũ trước 0076 ở ca 210-A ra 1.004.000, đúng là 934.000. → **ARC đã sửa câu 22/10.**
- "Thu hồi" của ESC-026 là đường tiền mới, cần hợp đồng ARC (0.3.9).
- ESC-024 B phụ thuộc US-164; SEC xem lại đường lễ tân ghi khoản thu cố định.
- QA chưa thêm dòng fixture mới.

## Việc chưa xong
- Làm rõ câu INV về tên phòng / số phòng: BR-012 (1)–(6) chưa đổi (PO ghi R3-Q53, giả định G3).
- PO và BA review oracle; ARC đọc chéo mục 2 (210).
- Ví dụ dài hạn (Sprint 3) và hướng dẫn vận hành (Sprint 4).

---

# Phản hồi & sửa – áp câu trả lời INV 26/10 (giá trị production v1.0) – DOM, 26/10/2026

## Đã làm gì
- Áp 8 câu INV trả lời vào `v1-production-defaults.md` mục 4 và BR **v0.4.4**: BR-012 (khách thấy tên + số căn, hạng Studio theo căn), BR-205/501/502 (điện 5.000 đ/kWh, nước 100.000 đ/người/tháng), BR-523, BR-602/603/612 (nguồn luật), BR-610 (ảnh 90 ngày, v1.0 tạm 30), BR-901, mục 13, mục 18.
- Kiểm mã (mục 5): nước theo người không cần sửa mã ở v1.0 (điện nước chưa có trong app tới v1.3); hạn lưu 90 ngày bị biên tham số 0–30 chặn → BE v1.0.1; Desk đã hiện "401 · The Pine".
- Đề xuất mùa cao điểm 2026–2027 (mục 6) → ESC-032; VAT 2027 → ESC-033.

## File tạo/sửa
- `rounds/round-03/outputs/DOM/v1-production-defaults.md`, `product/docs/business-rules.md`, `02-escalations/ESC-032.md`, `02-escalations/ESC-033.md`, `02-escalations/escalations-index.md`, `01-decisions/decision-log.md`.

## Giả định
- Nước: /người/tháng, theo ngày ở, trẻ dưới 6 tuổi miễn, vắng tạm không trừ [GIẢ ĐỊNH – chờ INV xác nhận].
- "3 tháng" của INV áp cho ảnh người đã đồng ý và hồ sơ điền sẵn; ảnh khai báo chưa xong giữ 7 ngày (gồm cả người không đồng ý) – quyền DOM.
- VAT 8 % hết hạn 31/12/2026 (Nghị quyết 204/2025/QH15) – theo DOM hiểu, kế toán xác nhận.

## Rủi ro / vướng mắc
- Điện 5.000 đ/kWh có thể vượt quy định giá điện cho người thuê – cần trước khi in vào HĐ mới (v1.3).
- Nếu T1 không làm trước B2, đơn OTA chưa báo căn ở 6 căn Studio hiện hạng phòng trống phía khách.

## Việc chưa xong
- T1–T5 (mục 5) chờ ORC giao; ESC-032, ESC-033 chờ INV.

---

# Review – DOM rà bản vá ESC-031 của BE-B (commit `35a477c`) – 26/10/2026

## Đã làm gì
- Review nghiệp vụ bản vá: **Đạt**, không Blocker/Major; 2 Minor (thêm ca FOC đã duyệt trước + A32 dưới mức FOC; tên nút FE khớp tờ hướng dẫn), 2 Suggestion (job so với cửa sổ folio; đóng ca liệt kê khoản `post_review`) – `reviews/s1-DOM-on-esc031.md`.
- Xác nhận 3 giả định BE-B: (a) v1.0 không chờ 15 phút, lễ tân gọi quản lý rồi ghi; (b) FOC đã duyệt trước đi theo dòng mới, min, không tăng; (c) hạn xem lại = `post_checkout_charge_hours` tính từ lúc bấm trả phòng.
- BR **v0.4.5**: BR-416 thêm (i)–(viii) cho v1.0 + ví dụ; mục 13 (`remote_confirm_timeout_minutes` v1.0 chưa dùng; `late_fee_fallback_review_hours` không là khóa riêng); mục 18.
- Oracle mục **10.1** (E31-1…E31-11 + bất biến I-E31) cho QA kiểm tiền.
- `staff-one-pager.md` bước 3–5 và `day-one-guide.md` mục 9 + câu Q10: cách làm mới, giữ cách cũ làm dự phòng nếu bản vá chưa lên ngày D.

## File tạo/sửa
- `product/docs/business-rules.md`, `rounds/round-03/outputs/DOM/s1-money-oracle.md`, `rounds/round-03/reviews/s1-DOM-on-esc031.md`, `product/docs/staff-one-pager.md`, `product/docs/day-one-guide.md`, `01-decisions/decision-log.md`.

## Giả định
- Quản lý muốn miễn ngay khi nghe máy: v1.0 vẫn thu đủ rồi hoàn sau – nằm trong phương án INV duyệt ở ESC-031, không ESC mới.
- Tên nút "Ghi phụ thu – quản lý xem lại" theo đề xuất BE; FE/UXD xác nhận.

## Rủi ro / vướng mắc
- Bản vá vô dụng nếu FE không làm màn cùng bản (thiết kế BE mục 6).
- PO cần sửa `release-notes.md` (Giới hạn đã biết: đổi đoạn ESC-031 thành cách mới + giới hạn "thu đủ rồi hoàn").

## Việc chưa xong
- Diễn tập staging Q10 (DOM + QA, trước D−1).
