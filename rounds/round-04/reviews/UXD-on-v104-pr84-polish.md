# UXD review – v1.0.4 PR #84: BUG-R4-049, Nhận phòng (H13) cho đơn chưa gán căn

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** (nhanh) | 05/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-polish-049` @ `3fa3428f`. Phần UXD xem:
  - `CheckInPage.tsx`: `hasRoom` và `condDetail`;
  - `bug-r4-049-fea.test.tsx`.
  - Ca test "Trực tiếp gõ 0" (ARC-PR82-05) là test thuần, không có chữ mới.
- Đối chiếu:
  - BUG-R4-049 trong `bug-list-v1.0.4.md`;
  - `checkin.service.ts`: khi không có căn, máy chủ trả `room_ready` chưa đạt với `cause: 'no_room'`, không có `detail`, nhưng vẫn điền `roomStatus: 'VC'`; `capacity_within_max` thì đạt (`!room`);
  - `UXD-on-v104-pr77` lượt 4: khi không có căn, dòng buồng không nói thêm gì, vì dòng `not_unassigned` đã nói;
  - các khóa `ci.cond_room`, `ci.cond_capacity_ok`, `checkin.cond.*`, `error.RESERVATION_UNASSIGNED`.
- Chỉ đọc mã, không chạy test.

## Kết luận: ĐẠT

**Ẩn dòng `ci.cond_room` khi đơn chưa có căn là đúng. Không cần câu thay thế.**
- Trong danh sách điều kiện, đơn chưa gán căn hiện như sau:
  - **"Đơn đã được gán căn"** có dấu ✕, và câu "Đơn chưa được gán căn (xung đột OTA). Gán căn trước khi nhận phòng.";
  - **"Buồng sẵn sàng (VI hoặc VC)"** có dấu ✕, không có dòng phụ.
- Mẫu của danh sách điều kiện là: **mỗi nguyên nhân chỉ nói một lần, ở dòng đúng của nó.** Không có căn là nguyên nhân của cả hai dấu ✕. Câu chỉ việc cần làm (gán căn) đã nằm ngay dòng trên. Thêm một câu "Chưa có căn" dưới dòng buồng chỉ lặp lại ý đó.
- Dòng cũ "Căn · VC · Đã dọn, chờ kiểm" sai hai chỗ: số căn trống, và một trạng thái buồng không có thật (giá trị máy chủ tự điền). Bỏ là đúng.
- `hasRoom` dùng chung với `roomBlockedMessage` (BUG-R4-039). Vì vậy dòng buồng có chữ hay không đều xét theo cùng một điều kiện ở mọi chỗ.
- Không có khóa mới, không màu, không lớp mới. Brand đạt.

**Về `ci.cond_capacity_ok` cho đơn chưa có căn: nên sửa cùng cách, xem thẻ PR84-01.**
- Máy chủ coi sức chứa là đạt khi chưa có căn. Desk vì vậy in dấu ✓ cho "Số khách không vượt sức chứa căn", kèm dòng "{n} khách · căn {room} tối đa {max}". Lúc này `room` = `''` và `roomInfo` không có, nên dòng ra "2 khách · căn  tối đa –": số căn trống, sức chứa là dấu gạch.
- Lỗi này cùng loại với BUG-R4-049: một dòng phụ nói về căn khi chưa có căn.

Có một thẻ Minor. Không có ESC.

---

### FB-R4-UXD-FE-PR84-01
- Mức độ: Minor. Không chặn gộp #84. FE nên làm trong #84 (1 dòng mã và 1 lần kiểm trong `bug-r4-049-fea`). Nếu không kịp thì sang v1.0.5 như FE đề xuất.
- Vị trí: `CheckInPage.tsx`, `condDetail`, nhánh `capacity_within_max`.
- Vấn đề: đơn chưa có căn vẫn in "{n} khách · căn {room} tối đa {max}" với số căn trống và sức chứa "–". Câu thiếu chữ, đứng cạnh dấu ✓.
- Vì sao quan trọng:
  - Câu thiếu chữ làm danh sách điều kiện kém tin cậy, đúng lúc lễ tân cần đọc để biết vì sao chưa nhận phòng được.
  - Dấu ✓ cạnh câu đó còn làm lễ tân tưởng sức chứa đã được kiểm, trong khi chưa có căn để kiểm.
  - Không sai tiền, vì việc nhận phòng đã bị chặn ở `not_unassigned`.
- Đề xuất sửa:
  - **v1.0.4 (FE, không cần chữ mới):** khi `hasRoom` sai, `condDetail` trả `null` cho `capacity_within_max`, giống hệt `room_ready`. Dòng còn lại nhãn "Số khách không vượt sức chứa căn". Gán căn xong, bản xem trước tính lại và hiện đủ "{n} khách · căn {room} tối đa {max}".
  - **Test:** thêm vào ca đơn chưa gán căn của `bug-r4-049-fea` một lần kiểm: dòng sức chứa không có "tối đa" và không có "–".
  - **v1.0.5 (ARC/BE, PO xếp backlog):** dấu ✓ cho sức chứa khi chưa có căn vẫn hơi gây hiểu lầm. Hướng đề xuất: máy chủ trả trạng thái "chưa xét được" cho các điều kiện cần căn, ví dụ `cause: 'no_room'` như `room_ready`, và Desk hiện biểu tượng trung tính như dòng "chưa kiểm giấy tờ" (`question`). UXD cấp chữ khi ARC chốt hợp đồng.
- Trạng thái: Open

## Điểm nên giữ
- Dùng lại đúng điều kiện `hasRoom` của BUG-R4-039, nên dòng buồng và câu chặn buồng luôn nói cùng một điều.
- Test có ca đối chứng (đơn có căn vẫn hiện "Căn 302 · …"), nên bản sửa không làm mất dòng ở ca thường.

## Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **UXD duyệt PR #84** (BUG-R4-049, H13) @ `3fa3428f`: ĐẠT. Đơn chưa gán căn không hiện dòng phụ `ci.cond_room` và không có câu thay thế; dòng "Đơn đã được gán căn" là chỗ duy nhất nói nguyên nhân. Cùng luật cho `ci.cond_capacity_ok`: khi chưa có căn thì không hiện dòng phụ (FB-R4-UXD-FE-PR84-01, Minor, nên làm trong #84, không thì v1.0.5). v1.0.5: ARC xét trạng thái "chưa xét được" cho các điều kiện cần căn | UXD | Mỗi nguyên nhân chỉ nói một lần. Không in số căn trống hay trạng thái buồng không có thật |
