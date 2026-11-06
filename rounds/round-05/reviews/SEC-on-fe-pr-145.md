# SEC – Review PR #145 (FE-A2, V5-15: ô lý do của hộp "Trả phòng quá ngày đi")

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần SEC xem | CI lúc đọc |
|---|---|---|---|---|
| #145 | `r5-fe-v5-15-overdue` | **`011d44e7`** | Commit V5-15 `9660334e` và các tệp nó chạm: `pages/stay/CheckOutPage.tsx`, `pages/stay/overdue.tsx`, `mocks/stay.ts`, `mocks/overdue.ts`, `ReservationDrawer.tsx`, `design/copy/strings-*.json`, test `v5-15-overdue-fea.test.tsx`. Các commit còn lại là gộp #140 (kèm #125, #128) và `main`: ngoài phạm vi bài này | Mọi job xanh (gồm `format · lint · audit · test · build`, E2E smoke, gitleaks, confidential paths) |

Phạm vi: chỉ ba điểm ORC giao cho ô lý do tự do `overdueReason` (D12c). Quyền vai, chỉ dẫn gọi ai và nghiệp vụ thuộc ARC, UXD, DOM.

Đối chiếu:
- điều kiện SEC 2.5 ở `SEC-on-be-prs-106-99-checkout.md`: Desk có lời nhắc D12c cạnh ô lý do (không ghi họ tên, số giấy tờ, thông tin sức khỏe của khách);
- máy chủ: `checkout.service.ts` `readInput` (`f.text('overdueReason', 500, { required: true, min: 3 })`), `reservations/internal/inputs.ts` `Fields.done()`.

Cách kiểm:
- Đọc mã trong worktree tạm ở scratchpad (`refs/pull/145/head`).
- Chạy `v5-15-overdue-fea.test.tsx` trên cây PR. Chạy 4 đột biến, sau đó trả tệp về nguyên trạng.

## Kết luận: **DUYỆT** PR #145 @ `011d44e7` (phần ô lý do V5-15)

0 Blocker · 0 Major · 0 Minor · 2 Suggestion, không thẻ nào chặn gộp. Điều kiện SEC 2.5 đã đủ, nên SEC giữ nguyên mức Low đã chấp nhận cho v1.0.5 (lý do tự do nằm trong audit append-only).

| Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Lời nhắc D12c luôn hiện | **Đạt.** Ô lý do chỉ có trên đường quá ngày đi. Ở đó `help={t('checkout.overdue_reason_help')}` không kèm điều kiện. `Field` hiện help và lỗi cùng lúc: lỗi không thay chỗ help, cả hai nối với ô qua `aria-describedby`. Chọn gợi ý hay gõ tay thì help vẫn còn. Chữ VI/EN đúng ý điều kiện 2.5: lý do lưu vào nhật ký, không ghi họ tên, số giấy tờ, thông tin sức khỏe | Test kiểm mô tả của ô trước và sau khi chọn gợi ý. Đột biến M2 (bỏ help) → đỏ |
| Lỗi số thẻ / số giấy tờ của máy chủ về đúng ô | **Đạt.** Máy chủ trả 422 `CARD_NUMBER_DETECTED` với `errors: [{ field: overdueReason }]` (`Fields.done()`). `fieldErrors()` đọc `problem.errors` với mọi mã, nên câu `error.CARD_NUMBER_DETECTED` hiện dưới ô lý do. Trang đưa người dùng về bước 2 và đặt con trỏ vào ô. Câu lỗi là chuỗi cố định, không lặp lại dãy số đã gõ. `ID_NUMBER_DETECTED` hiện máy chủ không áp cho ô này (đúng phạm vi V5-46, SEC 2.5; thẻ A1B-02 để v1.0.6). Nếu sau này máy chủ trả mã đó, cùng đường này đưa câu `error.ID_NUMBER_DETECTED` về ô mà FE không phải sửa | Test "422 CARD_NUMBER_DETECTED on overdueReason". M1 (mock trả đúng dạng của máy chủ) → vẫn xanh. M4 (bỏ bước quay về bước 2) → đỏ |
| Lý do không vào log, URL, analytics | **Đạt.** `reason` chỉ đi ba chỗ: state, ô nhập, thân POST `checkOut` (`overdueReason`). Không vào query (các GET summary chỉ gửi `checkoutTime`), không `navigate` hay đường dẫn, không `sessionStorage`/`localStorage`: trang stay không dùng `app/storage.ts`. Không `console.*` trong `api-client` và `app/`. Desk không có SDK analytics. Test dùng số thẻ thử công khai, không có dữ liệu khách thật | Grep các dòng thêm của PR và mọi chỗ dùng `reason` trong `CheckOutPage.tsx` |

Kết quả chạy: `v5-15-overdue-fea.test.tsx` 15/15 xanh.

| Đột biến | Thay đổi | Kết quả |
|---|---|---|
| M1 | Mock trả 422 `CARD_NUMBER_DETECTED` (dạng của máy chủ), thay cho `VALIDATION_FAILED` | Xanh, như mong đợi: FE xử lý được cả hai dạng |
| M2 | Bỏ `help` của ô lý do | **Đỏ** |
| M3 | Ẩn help khi có lỗi | Xanh: **không test nào bắt** → thẻ 145-02 |
| M4 | Bỏ `setStep(1)` sau lỗi của ô lý do | **Đỏ** |

## Thẻ

### FB-R5-SEC-FE-145-01
- Mức độ: Suggestion
- Vị trí: `design/copy/strings-vi.json` / `strings-en.json`, khóa `checkout.overdue_reason_help`
- Vấn đề: lời nhắc không nhắc tới số thẻ. Các ô D12c khác của nhân viên có nhắc (`crm.note_hint`: "Không ghi số giấy tờ, số thẻ, thông tin sức khỏe"). Máy chủ đã chặn số thẻ hợp lệ Luhn (V-09), nên rủi ro thấp. Nhưng nếu lễ tân dán số thẻ, họ chỉ biết sau khi bấm "Hoàn tất" và bị trả về bước 2.
- Đề xuất sửa: khi UXD sửa bản chữ v1.0.6, thêm "số thẻ" vào câu, ví dụ "Không ghi họ tên, số giấy tờ, số thẻ hay thông tin sức khỏe của khách." (EN tương ứng). Không cần sửa cho v1.0.5. UXD có thể xem cùng lúc: câu `error.CARD_NUMBER_DETECTED` gọi ô này là "Ô ghi chú".
- Người nhận: UXD (chữ), FE-A2 (sinh lại chuỗi)
- Trạng thái: Open

### FB-R5-SEC-FE-145-02
- Mức độ: Suggestion
- Vị trí: `__tests__/v5-15-overdue-fea.test.tsx` (ca "422 CARD_NUMBER_DETECTED…"), `mocks/stay.ts` nhánh quá ngày đi của B18
- Vấn đề:
  - Ca 422 chỉ kiểm câu lỗi đứng đầu phần mô tả của ô. Nó không kiểm help vẫn còn sau lỗi, nên đột biến M3 (ẩn lời nhắc đúng lúc người dùng sửa lý do) không làm đỏ test nào.
  - Mock trả `VALIDATION_FAILED`, còn máy chủ trả `CARD_NUMBER_DETECTED` ở cấp trên. FE xử lý được cả hai (M1), nhưng test chưa chạy theo dạng của máy chủ.
- Đề xuất sửa:
  - Trong ca đó, kiểm thêm: mô tả của ô chứa cả câu lỗi lẫn `checkout.overdue_reason_help`.
  - Cho mock trả lỗi số thẻ đúng dạng `Fields.done()`, như `mocks/ops.ts` đã làm: `problem(422, 'CARD_NUMBER_DETECTED', { errors: [card] })`.
- Người nhận: FE-A2. Làm ở PR sau, không chặn #145.
- Trạng thái: **Closed** @ `b834ea56` (fix `c937ffd0`, mục "Phần chênh")

## Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – PR #145 (FE-A2, V5-15 hộp Trả phòng quá ngày đi), ô lý do @ 011d44e7: DUYỆT.** Đủ điều kiện SEC 2.5: lời nhắc D12c (không ghi họ tên, số giấy tờ, sức khỏe của khách) luôn hiện dưới ô lý do, kể cả khi có lỗi, và nối aria-describedby. 422 CARD_NUMBER_DETECTED của máy chủ (errors[overdueReason]) về đúng ô: con trỏ ở ô, trang quay về bước 2, câu lỗi cố định không lặp số đã gõ. ID_NUMBER_DETECTED chưa áp cho ô này (A1B-02, v1.0.6), khi có thì đi cùng đường. Lý do chỉ vào thân POST checkOut: không query, URL, storage, console hay analytics. Test V5-15 15/15 xanh; 4 đột biến (2 đỏ đúng chỗ, 1 xanh như mong đợi, 1 lọt → 145-02). Hai Suggestion không chặn: 145-01 thêm "số thẻ" vào lời nhắc (UXD, v1.0.6), 145-02 test giữ help sau lỗi và mock lỗi số thẻ đúng dạng máy chủ (FE-A2). Không ESC | SEC | rounds/round-05/reviews/SEC-on-fe-pr-145.md |`

---

## Phần chênh @ `b834ea56` (Review delta, 07/11/2026)

**Đối tượng:** `011d44e7..b834ea56`. Nhánh có hai commit của FE: `c937ffd0` (sửa theo review) và `b834ea56` (chỉ báo cáo FE). Hai commit gộp `main` là `5bd6d126` và `c2f883a4`. `git show --remerge-diff` của hai commit gộp chỉ ra `strings.js`, tệp sinh tự động. Phần `main` mang vào có `problem.ts` / `common.tsx` (#130). Ở đó, cặp riêng (trường, mã) chỉ áp cho `bankReference`, nên `overdueReason` vẫn dùng câu `error.CARD_NUMBER_DETECTED`. `Field.tsx` không đổi.

| Điểm kiểm | Kết quả |
|---|---|
| D12c luôn hiện, kể cả khi lỗi | **Đạt.** Help của ô lý do nay là một dòng gồm `checkout.overdue_reason_evidence` (cách biết giờ khách rời), rồi tới `checkout.overdue_reason_help` (D12c). Không có điều kiện nào trên đường quá ngày đi. `Field` vẫn hiện help cạnh lỗi, không thay help bằng lỗi. Chữ D12c VI/EN giữ nguyên |
| `aria-describedby` | **Đạt.** Thuộc tính vẫn nối cả lỗi lẫn help (`[errId, helpId]`). Ca 422 nay kiểm mô tả của ô **đúng bằng** câu lỗi + dòng evidence + dòng D12c, và dòng help vẫn có trên trang |
| Lỗi số thẻ về đúng ô | **Đạt**, test chạy theo dạng của máy chủ: mock dò như V-09 (`containsCardNumber`) và trả 422 `CARD_NUMBER_DETECTED` với `errors: [overdueReason]`, như `Fields.done()`. Test kiểm cả thân trả lời |
| Con trỏ ở cuối ô sau gợi ý 1 và 2 | Không có ý bảo mật: chỉ `focus()` và `setSelectionRange` trên ô nhập |
| Lý do chỉ đi trong thân POST | **Đạt.** `reason` vẫn chỉ ở ba chỗ: state, ô nhập, `overdueReason` của `checkOut`. Các hàm mới ở `overdue.tsx` (`canExtendStay`, `overdueGuidanceText`, `overdueEarlyAt`) và phần sửa ở `ReservationDrawer.tsx` không đọc lý do. Phần chênh không thêm `console`, storage, query, URL hay analytics. `URLSearchParams` ở ngăn đơn đã có từ trước và chỉ xóa tham số `open` |

Kết quả chạy @ `b834ea56`: `v5-15-overdue-fea.test.tsx` 21/21 xanh. Bốn đột biến SEC, đã trả tệp về nguyên trạng:

| Đột biến | Thay đổi | Kết quả |
|---|---|---|
| N1 | Ẩn cả help khi có lỗi (M3 cũ) | **Đỏ** (trước đây lọt) |
| N2 | Bỏ dòng D12c, chỉ giữ dòng evidence | **Đỏ** (2 ca) |
| N3 | Bỏ dòng D12c chỉ khi có lỗi | **Đỏ** |
| N4 | `Field` không đưa help vào `aria-describedby` | **Đỏ** (3 ca) |

Ghi nhận, không thẻ:
- Dòng evidence mời ghi thêm chữ tự do (ai thấy căn trống, khách có nhắn không) vào audit append-only. Dòng D12c đứng ngay sau, nên mức Low SEC đã chấp nhận ở mục 2.5 không đổi.
- Khi sửa chữ cho 145-01 (v1.0.6), UXD có thể xét thêm nhắc "đừng chép nguyên tin nhắn của khách" (số điện thoại). Đây là gợi ý, không bắt buộc.
- 145-01 vẫn Open, để v1.0.6, đúng như báo cáo FE ghi.

**Kết luận:** về phần ô lý do, #145 vẫn **DUYỆT @ `b834ea56`**. FB-R5-SEC-FE-145-02 **Closed**; 145-01 (Suggestion, UXD) vẫn Open, để v1.0.6. Lúc SEC đọc, `format · lint · audit · test · build` còn đang chạy; gitleaks, confidential paths đã xanh. ORC kiểm CI trên SHA cuối.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | **SEC – PR #145 delta @ b834ea56 (fix c937ffd0), ô lý do V5-15: vẫn DUYỆT; FB-R5-SEC-FE-145-02 Closed.** Help là một dòng: evidence (DOM 145-04) rồi D12c, luôn hiện kể cả khi lỗi; aria-describedby vẫn nối lỗi + help; ca 422 kiểm mô tả đúng bằng lỗi + hai dòng help. Mock trả 422 CARD_NUMBER_DETECTED với errors[overdueReason] như Fields.done(), dò bằng containsCardNumber. Con trỏ cuối ô: không có ý bảo mật. Lý do chỉ đi trong thân POST checkOut, phần chênh không thêm log, storage, URL hay analytics. Test V5-15 21/21 xanh; 4 đột biến SEC (ẩn help khi lỗi, bỏ D12c, bỏ D12c khi lỗi, bỏ help khỏi describedby) đều đỏ. 145-01 (thêm "số thẻ", UXD) vẫn Open, để v1.0.6. Không ESC | SEC | rounds/round-05/reviews/SEC-on-fe-pr-145.md |`
