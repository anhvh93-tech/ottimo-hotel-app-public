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
