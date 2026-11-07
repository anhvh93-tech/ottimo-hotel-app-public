# DOM review – FE-A2 PR #164: dòng "Đổi người chốt" theo UXD 9.18 (DOM 159-01)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #164, commit **`dbef4c71`**:
  - `MoneyPage.tsx`, hàm `who` và nhánh `reservation.closer_changed`;
  - 2 khóa chữ mới `mlog.a_closer_changed_legacy`, `mlog.closer_inactive`;
  - test `r5-mlog-closer-names-fea.test.tsx`.
- Đối chiếu:
  - DOM `DOM-on-fe-a2-pr-159.md`, thẻ 159-01, 159-02;
  - DOM `DOM-on-ops-pr-155-k14.md`, thẻ 155-04, 155-05;
  - danh sách `closer-candidates` trên `main`: người có tài khoản `active` và còn vai sống ở cơ sở (CTV, sale, FD, FDL, MGR, OWN).
- Cách đọc: `gh pr diff 164` và `git show` trên ref của PR. Không checkout nhánh, không chạy mã. Tên trong mock và test là dữ liệu giả. Không dữ liệu khách, không số hoa hồng.

## 0. Kết luận

**DUYỆT.** Chủ đầu tư đọc đúng cả bốn trường hợp của dòng "Đổi người chốt". Thẻ 159-01 xong.

Thẻ BA 159-02 **bỏ**: dòng bản ghi cũ đã tự giải thích, đúng điều kiện "bỏ khi UXD có câu riêng" của thẻ.

Một thẻ Suggestion cho sau này (164-01), không chặn gộp. Không ESC.

## 1. Chủ đầu tư đọc dòng này thế nào

| Trường hợp | Desk hiện | Chủ đầu tư hiểu | Đúng không |
|---|---|---|---|
| Lần đổi ghi trước #154 (audit không có `closerUserId`) | "Đổi người chốt (bản ghi cũ, không có tên)" | Có một lần đổi người chốt; bản ghi lúc đó không lưu tên | Đúng. Thay cho "— → —", vốn dễ hiểu thành "đơn không có người chốt". Tên của các lần đổi này nằm ở danh sách K14 đội gửi qua kênh riêng, không ở Desk. |
| Id không có trong danh sách người, sau khi danh sách đã tải xong | "Tài khoản hiện không hoạt động" | Người này không còn làm ở cơ sở, hoặc tài khoản đã tắt | Đúng với dữ liệu. Danh sách chỉ có tài khoản `active` còn vai sống ở cơ sở. Câu không lộ tài khoản bị khóa hay nghỉ, đúng D27. |
| Danh sách người không đọc được | "Chưa tải được dữ liệu" ở chỗ tên | Desk chưa lấy được tên, không phải người đó có vấn đề | Đúng. Đây là ý chính của 159-01: không còn hiện "không hoạt động" cho mọi người khi chỉ là lỗi tải. Test kiểm cả vế "không bao giờ hiện inactive" lúc lỗi. |
| Đang tải | "Đang tải…", rồi ra tên | Chờ một chút | Đúng (ARC 159-01) |

Phần còn lại giữ nguyên, đúng:
- "—" bên trái nghĩa là trước đó đơn chưa có người chốt.
- Cột "Người làm" vẫn cho biết ai đổi và lúc nào.

**Hai cách nói cho cùng một người đã nghỉ.** Ở bộ lọc "Người làm", người này hiện "Người không còn trong danh sách". Ở dòng người chốt, họ hiện "Tài khoản hiện không hoạt động". Mỗi câu đúng chỗ của nó: một bên là danh sách để lọc, một bên là trạng thái của người được nhắc tới. UXD đã chọn giữ ở 9.18. DOM không thêm thẻ.

**Bản ghi cũ chỉ nhận ra khi thiếu khóa.** Dòng "bản ghi cũ" chỉ hiện khi `after` không có khóa `closerUserId`. Có khóa mà giá trị rỗng thì vẫn hiện dòng tên (ca OTM-C08 của test). Như vậy dòng mới sau #154 không bao giờ bị nhầm thành bản ghi cũ. Ca bỏ người chốt của 155-05 (2), nếu sau này làm, sẽ hiện "Sơn → —". Điều kiện là máy chủ ghi rõ khóa, xem thẻ 164-01.

## 2. Thẻ

### FB-R5-DOM-ARC-164-01
- Mức độ: Suggestion – ARC (chữ 0.3.14 (z)), BE-H khi làm. Chỉ khi (z) ý (2) được làm (K14 > 0).
- Vị trí: `contract-0.3.13.md` 1.26 (z) ý (2), audit `reservation.closer_changed`.
- Vấn đề: Nhật ký tiền nhận ra bản ghi cũ bằng cách xem `after` có thiếu khóa `closerUserId` không. Khi chủ đầu tư bỏ người chốt (`closerUserId: null`), nếu máy chủ hay bộ lọc audit bỏ các khóa có giá trị `null`, dòng này sẽ hiện "bản ghi cũ, không có tên". Thật ra đây là lần bỏ người chốt mới, có đủ thông tin.
- Vì sao quan trọng: chủ đầu tư sẽ tưởng lần bỏ người chốt vừa làm là dữ liệu cũ, và không thấy người bị bỏ là ai.
- Đề xuất sửa: thêm vào (z) ý (2): audit ghi `after.closerUserId: null` **rõ ràng**, không bỏ khóa. BE-H thêm một ca test cho dòng này khi làm.
- Trạng thái: Open

## 3. Giả định

- PR head vẫn là `dbef4c71` lúc gộp.
- Câu chữ là nguyên văn UXD 9.18. DOM xét nghĩa với chủ đầu tư, không xét chữ.
- Danh sách `closer-candidates` giữ đúng điều kiện hiện nay (tài khoản `active`, còn vai sống ở cơ sở). Nếu điều kiện đổi, câu "Tài khoản hiện không hoạt động" phải xem lại.

## 4. Dòng decision log (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review FE-A2 PR #164 (dòng Đổi người chốt theo UXD 9.18) @ dbef4c71: DUYỆT.** Chủ đầu tư đọc đúng cả bốn trường hợp: lần đổi trước #154 → "Đổi người chốt (bản ghi cũ, không có tên)" (thay "— → —", tên ở danh sách K14); id không có trong danh sách người (tài khoản active còn vai sống) → "Tài khoản hiện không hoạt động", không lộ khóa hay nghỉ (D27); danh sách lỗi → "Chưa tải được dữ liệu", không bao giờ "không hoạt động" cho mọi người; đang tải → "Đang tải…". Bản ghi cũ chỉ nhận ra khi thiếu khóa closerUserId, nên dòng mới không bị nhầm. Đóng FB-R5-DOM-FE-159-01 khi #164 gộp; bỏ FB-R5-DOM-BA-159-02 (dòng tự giải thích). Thẻ 164-01 Suggestion ARC/BE-H: nếu làm 0.3.14 (z) ý (2), audit ghi after.closerUserId: null rõ ràng. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-a2-pr-164.md |`
