# BA review FE – ô Ghi chú nội bộ trên đơn và yêu cầu website (round 4, v1.0.4)

- Người viết: BA · 04/11/2026
- Nguồn: kiểm code khi sửa FB-R4-DOM-BA-104-12 (`rounds/round-04/responses/BA-on-DOM-v104.md` mục 9.1)
- Nhánh đã đọc: `origin/v104/fe-param-cancel` @ `2502f179`; grep `internalNote` mọi nhánh `origin/*`

### FB-R4-BA-FE-IN-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/booking/BookingDialog.tsx` dòng 1099–1112; màn chi tiết đơn (không có trường); `product/apps/admin-web/src/pages/webreq/WebRequestDrawer.tsx` dòng 719 (ô `webreq.note` chỉ trong hộp **Từ chối**).
- Vấn đề:
  - API có `internalNote` (tạo và `PATCH`, quyền `D12c`, tối đa 1000 ký tự). Desk chỉ hiện ô **Ghi chú nội bộ** khi tạo đơn kênh **Nội bộ**.
  - Đơn trực tiếp, OTA, đại lý không nhập được ô này. Không màn nào hiện hay sửa ô này với đơn đã có.
  - Yêu cầu website không có ô ghi chú nội bộ dùng chung. `decline_note` chỉ dùng khi **Từ chối** và bị xóa khi lập đơn.
  - Tài liệu đang bảo lễ tân ghi vào ô này ở 3 chỗ:
    - `02-le-tan.md` 5.2: đơn nhóm "Nhóm: OTM-…";
    - `02-le-tan.md` mục 6 ý 5: "OTA sửa đơn";
    - sổ tay `user-manual-v1.0.md` cùng hai chỗ trên.
  - DOM (thẻ 104-12) muốn ghi "không dịch" ở ô này.
- Vì sao quan trọng:
  - Lễ tân không tìm thấy ô mà tài liệu chỉ, nên ghi chú đơn nhóm và đơn OTA sửa ngày bị mất.
  - Quy tắc "không dịch" là lời hứa trên tờ Your ID details v2. Hiện quy tắc này phải ghi ở giấy (trang Không dịch), vì Desk không có chỗ để mọi ca cùng thấy trên màn đơn.
- Đề xuất sửa (PO xếp ưu tiên, sau v1.0.4):
  - Màn chi tiết đơn: hiện và cho sửa **Ghi chú nội bộ** với lễ tân trở lên, ở mọi kênh, giữ quyền `D12c` như API.
  - Yêu cầu website: thêm ô ghi chú nội bộ dùng chung, chép sang **Ghi chú nội bộ** của đơn khi lập đơn (WR6).
  - Không in bill, không đưa vào tin gửi khách, giữ chặn số thẻ như ô ghi chú hồ sơ khách.
  - Có ô rồi, BA chuyển "không dịch" từ trang Không dịch sang ô này và sửa 3 chỗ tài liệu trên.
  - Không thêm ô: BA sửa 3 chỗ tài liệu sang sổ giao ca, DOM đọc lại.
- Trạng thái: Open

Điểm tốt nên giữ:
- API đã có sẵn trường và quyền `D12c`, CTV không thấy.
- Ô ghi chú yêu cầu website đã có gợi ý "khách không thấy, không ghi số thẻ, số giấy tờ".
