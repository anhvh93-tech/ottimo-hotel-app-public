# SEC review – v1.0.4 P4-34: Hủy lịch tham số trong hộp Sửa tham số (FE)

- Người review: SEC | Round 4 – v1.0.4 – Bước: **Review mã** | 04/11/2026
- Đối tượng: `origin/v104/fe-param-cancel`, bản đầu `8fda6d7f` (FE), sau đó `449aa5c2` và `df7ed358`. Tệp: `apps/admin-web/src/pages/ParamDialog.tsx`, `ParamsPage.tsx`, `paramCatalog.ts`, `__tests__/v104-param-cancel.test.tsx`.
- Đối chiếu: hợp đồng 0.3.7 (`cancelScheduledParameter`, `Idempotency-Key`), migration 0050 (`edit_roles`), đường S2 riêng của `payment_receiving_account`.
- Ghi chú (ORC chép từ báo cáo SEC trong phiên; SEC chỉ đọc, không commit).

## Phán quyết lượt 1: **ĐẠT**

Quyền hủy theo `editorsOf` (lấy từ `edit_roles` từng khóa), cộng loại trừ `RECEIVING_KEY`. Không có PII, không có secret. Hai thẻ Minor sửa trước khi gộp, một thẻ Suggestion dời.

### FB-R4-SEC-FE-P434-01
- Mức độ: Minor
- Vị trí: `ParamDialog.tsx` – hộp hủy lịch.
- Vấn đề: gặp `409 IDEMPOTENCY_IN_PROGRESS`, lỗi mạng hoặc 5xx thì đổi key mới, ô Lý do vẫn sửa được. Lần gửi lại có thể thành một yêu cầu khác.
- Đề xuất sửa: giữ `Idempotency-Key` tới khi có trả lời dứt khoát. Hiện `error.IDEMPOTENCY_IN_PROGRESS`. Khóa ô Lý do (`readOnly`) sau lỗi mạng, 5xx hoặc IN_PROGRESS.
- Trạng thái: **Done** – `449aa5c2`.

### FB-R4-SEC-FE-P434-02
- Mức độ: Minor
- Vấn đề: thiếu test cho các nhánh an toàn.
- Đề xuất sửa: thêm 3 test.
  - (a) `payment_receiving_account` không có nút, không có cột thao tác, không POST.
  - (b) Lỗi mạng rồi 204: cùng key, cùng body.
  - (c) IN_PROGRESS hai lần rồi 409: chỉ 1 key, body giống nhau.
- Trạng thái: **Done** – `449aa5c2`.

### FB-R4-SEC-FE-P434-03
- Mức độ: Suggestion
- Vấn đề: khóa tài khoản nhận tiền có hai lối vào (Tham số quy tắc và Tài khoản nhận). Nên gom về một chỗ.
- Trạng thái: **Deferred → v1.0.5** (ORC 04/11, `03-backlog/backlog.md` mục 5.6b).

### Ghi chú cho BA
"Hủy lịch" chỉ hủy được dòng có ngày hiệu lực **sau** ngày nghiệp vụ. Dòng hôm nay trả 409 (`params.cancel_effective`), nên đừng hứa trong sổ tay là hủy được dòng hôm nay. BA đã ghi vào `00-index` mục 4 (`v104/ba-docs` @ `4a842a14`).

## Xác nhận lượt 2 (04/11) – `449aa5c2`: **ĐẠT**

- P434-01: Đóng.
  - Khi gặp lỗi mạng, 5xx hoặc IN_PROGRESS: giữ `idem.current`, đặt `unsettled`, ô Lý do `readOnly`, hiện lỗi qua `problemView`.
  - Khi có trả lời dứt khoát: bỏ khóa ô và đổi key mới.
- P434-02: Đóng, đủ 3 test (a)(b)(c). Số ca vitest lấy từ báo cáo FE, SEC không tự chạy.
- Đọc thay UXD 3 thẻ UXD-FE-P434-01..03 (khóa `params.cancel_scheduled`; nút `common.close` sau 404/409; Alert 404 `info` + `role="status"`, 409 `bad` + `role="alert"`): đều đóng. Xem `UXD-on-v104-p4-34.md`.

### FB-R4-SEC-FE-P434-04 (mới)
- Mức độ: Suggestion
- Vấn đề: ô Lý do chỉ khóa sau khi lỗi về. Trong lúc lần gửi đầu đang chạy (`busy`), ô vẫn sửa được vì `ConfirmDialog` không vô hiệu hóa phần con. Lần gửi lại khi đó mang cùng key nhưng body khác. Máy chủ từ chối hoặc phát lại nên không lộ dữ liệu, nhưng lý do ghi trong audit có thể khác chữ trên màn hình.
- Đề xuất sửa: `readOnly={unsettled || busy}`.
- Trạng thái: **Done** – `df7ed358`, có test "SEC P434-04" (FE thử bỏ `busy` thì test đỏ). FE báo vitest admin-web 808/808.

## Kết luận

Gộp được: PR #37 @ `df7ed358`, sau khi CI của PR xanh. Còn mở: P434-03 (Suggestion, v1.0.5).
