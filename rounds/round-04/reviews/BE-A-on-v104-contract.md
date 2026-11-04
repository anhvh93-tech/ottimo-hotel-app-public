# BE-A review hợp đồng 0.3.12 (v1.0.4) – phần BE-A

- Round 4 – v1.0.4 – Bước: Review
- Người review: BE (làn BE-A)
- Đối tượng: `origin/v104/arc-contract` @ `3320fb33` – `openapi.yaml` 0.3.12 mục (e), (f) và mã trường `EMAIL_SHARED_MAILBOX`; generator `gen-openapi-meta.mjs` (cờ `sd`, danh sách `selfData`); `openapi-types.ts`, `openapi-schemas.ts`; ca tạm trong `test/serializer.test.ts`.
- Đối chiếu với mã: nhánh `v104/be-identity` @ `f493c8b1` (`security-email.service.ts`, `shared-mailboxes.ts`, `serializer.ts`, `field-policy.ts`).

## Kết luận

**Đồng ý**, kèm 1 thẻ Major (BE-A tự sửa khi rebase, ARC chỉ cần thêm 1 câu) và 3 thẻ nhỏ. Không có gì chặn hợp nhất hợp đồng.

## Điểm làm tốt

- (e) EM-09 khớp mã từng bước. `setMyEmail` (1b) và `updateUser` (4b) kiểm sau 403/422, trước S2, không ghi gì (kể cả `displayName`). Kiểm lại trong giao dịch dưới khóa dòng `app_user`. `Retry-After` = giây tới khi lần cũ nhất trong 5 lần rời cửa sổ. Trùng địa chỉ không tính, `null` không bị chặn nhưng vẫn đếm (V104-01). Cả hai operation khai `'429': RateLimited`, `x-rate-limit` ghi đủ, `RateLimited` có ví dụ.
- Dòng `RATE_LIMITED` và `EMAIL_SHARED_MAILBOX` trong bảng mã khớp `SharedMailboxRule`: danh sách `EMAIL_SHARED_MAILBOXES` + `info@`/`booking@` tại miền thư + địa chỉ `EMAIL_FROM`, so sau khi bỏ `+…`, không ghi, không đếm.
- (f) `StrongReauth.password` bỏ `required`/`minLength`, giữ `writeOnly`, `maxLength: 256`. Vắng/rỗng → `422 STRONG_REAUTH_REQUIRED`, không đếm – đúng hành vi v1.0.3.
- Generator chặn `sd` đi cùng `f`/`v` và chặn `sd` dưới cấp đầu. Danh sách `selfData` sắp xếp, dùng đúng khóa có tiền tố `schema:`/`op:` như `SelfOwner`. 5 khóa sinh ra bằng đúng 5 khóa trong `SELF_DATA_FIELDS` hiện tại.

## Thẻ

### FB-R4-BEA-ARC-01 – Bỏ D27 thì `SELF_DATA_FIELDS` thành mã chết, thuộc tính `sd` mở cho mọi vai
- **Mức độ**: Major
- **Vị trí**: (f) – `openapi-schemas.ts` (5 thuộc tính chỉ còn `sd: true`, không còn `f`); `serializer.ts` `propertyAllowed`.
- **Vấn đề**: serializer chỉ tra `SELF_DATA_FIELDS` khi mã D đã từ chối (`if (p.f && !rbacFieldAllows(...))`). Bỏ `x-rbac-field: D27` thì 5 thuộc tính không còn `f`. Nhánh tra danh sách không bao giờ chạy và thuộc tính được trả cho mọi vai chỉ vì "không có mã D". Nếu sau này `Me` hay một phản hồi `sd` bị tham chiếu ở endpoint khác, email đầy đủ lọt ra mà không test nào đỏ.
- **Vì sao quan trọng**: hôm nay an toàn nhờ endpoint `/me/*` chỉ trả cho chính người gọi, nhưng serializer mất lớp chặn thứ hai (fail-open). SEC-ARC-018-03 muốn ngược lại.
- **Đề xuất sửa**:
  - BE-A (khi rebase lên main@L): `propertyAllowed` cho qua thuộc tính `p.sd` **chỉ khi** `<owner>.<key>` ∈ `SELF_DATA_FIELDS` (fail-closed). Tra cứu chỉ chạy khi `p.sd` đúng, nên đường nóng không thêm gì. Test: `SELF_DATA_FIELDS` bằng `OPENAPI_SCHEMAS.selfData`, giữ danh sách ghim, và test "chưa quyết" phủ cả thuộc tính `sd` lẫn thuộc tính có mã D.
  - ARC: thêm 1 câu vào (f): "Serializer chỉ trả thuộc tính `x-self-data` khi khóa nằm trong `SELF_DATA_FIELDS` của BE; CI kiểm hai tập bằng nhau. Thêm `x-self-data` mà không cập nhật BE thì thuộc tính bị bỏ, không lộ."
- **Trạng thái**: Open (phần BE-A làm khi rebase)

### FB-R4-BEA-ARC-02 – `x-self-data` trên thân yêu cầu `setMyEmail.email` không có tác dụng
- **Mức độ**: Suggestion
- **Vị trí**: `openapi.yaml` dòng ~942 (requestBody `setMyEmail`); mô tả (f) ghi "6 chỗ".
- **Vấn đề**: serializer chỉ đọc phản hồi. Generator không đưa khóa này vào `selfData` (đúng 5 khóa). Người đọc mục (f) thấy "6 chỗ", nhưng `selfData` chỉ có 5, dễ tưởng sinh thiếu.
- **Đề xuất sửa**: bỏ cờ ở thân yêu cầu, hoặc ghi rõ "ở thân yêu cầu chỉ mang nghĩa mô tả, không vào `selfData`". Có thể cho generator báo lỗi khi `x-self-data` nằm trong `requestBody`, như cách đã chặn ở cấp sâu.
- **Trạng thái**: Open

### FB-R4-BEA-ARC-03 – Bước (4b) của `updateUser` nên nói rõ ngoại lệ `null` như (1b)
- **Mức độ**: Minor
- **Vị trí**: `updateUser` mô tả thứ tự kiểm (4b).
- **Vấn đề**: `setMyEmail` (1b) đã ghi đậm "xóa email (`null`) không bao giờ bị chặn nhưng vẫn ghi và đếm". `updateUser` chỉ ghi ngoại lệ này ở `x-rate-limit` và bảng mã. FE/QA đọc riêng `updateUser` có thể viết ca "OWN xóa email lần thứ 6 → 429" sai.
- **Đề xuất sửa**: chép nguyên câu của (1b) vào (4b).
- **Trạng thái**: Open

### FB-R4-BEA-ARC-04 – Ca tạm trong `test/serializer.test.ts` dùng khóa kiểu cũ
- **Mức độ**: Minor
- **Vị trí**: `product/services/api/test/serializer.test.ts` trên `v104/arc-contract` (`key.split('.')`, khóa không tiền tố).
- **Vấn đề**: ca tạm này xung đột với bản trên `v104/be-identity`, nơi khóa có dạng `schema:<Name>.<prop>` / `op:<operationId>.<prop>`.
- **Đề xuất sửa**: BE-A thay ca tạm bằng bản của mình khi rebase: so `SELF_DATA_FIELDS` với `OPENAPI_SCHEMAS.selfData` và giữ danh sách ghim. ARC không cần sửa gì thêm trên nhánh hợp đồng.
- **Trạng thái**: Open (BE-A xử lý khi rebase)

## Việc BE-A làm sau khi có main@L (không làm trước)

1. Rebase `v104/be-identity` lên main@L. Lấy bản `serializer.test.ts` của BE-A (thẻ 04).
2. `propertyAllowed` đọc `p.sd` theo kiểu fail-closed. Thêm test bằng nhau `SELF_DATA_FIELDS` = `OPENAPI_SCHEMAS.selfData` (thẻ 01).
3. Kiểm `updateUser` 429 ở meta sinh ra (mã đã trả 429 từ P4-06, chỉ cần test hợp đồng xanh).
4. V104-08 phần `platform.controller` (`action` set/cancel) và test đầu-cuối set/cancel.
5. Chạy lại test api, lint, typecheck. Push nhánh, báo SHA.
