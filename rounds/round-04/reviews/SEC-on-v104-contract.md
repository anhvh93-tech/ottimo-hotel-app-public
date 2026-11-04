# SEC trên hợp đồng OpenAPI 0.3.12-draft (P4-00)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/arc-contract` @ `3320fb33`:
  - `product/docs/api/openapi.yaml`, đọc phần nhật ký 0.3.12 và các operation liên quan;
  - báo cáo `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md`.
- Phạm vi: 5 điểm ORC hỏi. Không review lại (b), (c), (d), (h). Không sửa tệp nào khác. Không commit.

## Kết luận: ~~ĐỒNG Ý gộp~~ → **ĐỒNG Ý CÓ ĐIỀU KIỆN** (xem "Bổ sung 04/11" cuối tệp: thẻ BEA-ARC-01 Major)

| Điểm | Kết quả | Chỗ trong `openapi.yaml` |
|---|---|---|
| (a) đúng chữ `SEC-on-v104-holds.md` mục 3 | **Đạt.** `confirmDeposit` có đủ các ý: SAL/CTV luôn 409; FD+ khi folio đã nhận > 0 đ **trước lần ghi này**, gồm cả `pending`; `existingPaymentId` thì không xét giờ nhận; tới khi nhận phòng, không trần giờ; folio chưa nhận gì thì theo AC4; thiếu cọc sau hạn chỉ MGR/OWN; audit `afterDeadline: true`. Câu cũ được gạch, không xóa. `recordPayment` có HOLDS-01 (409 cho người không có vai FD+, ví dụ `holdExpiredSales`), và `x-roles` của op này chỉ có thêm `sales_staff`, nên chữ "(SAL)" đúng phạm vi. Câu ARC thêm về J1 và `error.HOLD_EXPIRED_PAID` chỉ giải thích, không đổi nghĩa | `confirmDeposit` (op + `existingPaymentId`), `recordPayment`, `Reservation.allowedActions`, nhật ký (a) |
| EM-09 có V104-01 | **Đạt.** `setMyEmail` (1b) và `updateUser` (4b): 429 + `Retry-After`, tính theo người **được đổi**, mọi `via`, kiểm sau 422 và trước S2. **"Xóa email (`null`) không bao giờ bị chặn, nhưng vẫn được ghi và vẫn được đếm"** có ở cả mô tả và `x-rate-limit` của hai op | `setMyEmail`, `updateUser`, `RateLimited` |
| `x-self-data` thay D27 ở 6 chỗ | **Đạt.** Gồm `Me.email`, `setMyEmail` (thân yêu cầu + 200), `startMy2faSetup.otpauthUri`, `confirmMy2fa.recoveryCodes`, `regenerateMyRecoveryCodes.recoveryCodes`. `User.email` (OWN xem người khác) và `updateUser.email` **giữ** D27 + `x-visible-to: [owner]`, đúng. Generator từ chối `x-self-data` đi cùng `x-rbac-field`/`x-visible-to` hoặc nằm dưới cấp đầu. `selfData` sinh ra khớp 5/5 với `SELF_DATA_FIELDS` của BE-A. Trước khi BE-A rebase, phạm vi lộ không rộng hơn (ARC mục 1 (f)) | dòng `x-self-data` (6 chỗ) |
| (i) `ID_NUMBER_DETECTED` chỉ bật cùng tag guest-web | **Đạt.** Mô tả `createGuestRequest.note`, `updateOnlineCheckin.arrivalNote` và nhật ký (i) đều ghi "bật cùng tag với câu báo guest-web; không kịp thì sang v1.0.5 và server chưa trả mã này". Chỉ `field` + `code`, không lưu, không log. Phạm vi đúng **2 ô khách gõ**, không có `replyNote` hay `registration` | op `createGuestRequest`, `updateOnlineCheckin`, bảng mã trường |
| `refund.destination_carried` trong tập `money` | **Đạt.** Có trong `AuditEvent.action` (tập đóng `money`), chỉ mã yêu cầu cũ/mới. `money-actions.ts` khớp từng ký tự với `v104/be-refund-dest`. Mô tả `setRefundDestination` theo 6.3 + điều kiện SEC | `AuditEvent.action`, `setRefundDestination` |

## Ghi chú (Info, không chặn)

- **FB-R4-SEC-ARC-C0312-01**: dòng `ID_NUMBER_DETECTED` trong **bảng mã trường** (đầu tệp) liệt kê thêm `createGuestRequest.note`, `updateOnlineCheckin.arrivalNote` mà không kèm điều kiện "bật cùng tag guest-web". Mô tả op và nhật ký đã có điều kiện này, nên hợp đồng không sai. Thêm 4 chữ "(bật cùng tag guest-web)" vào ô đó để người chỉ đọc bảng không hiểu là đã bật. Người làm: ARC, khi tiện.
- Khi BE-A rebase (SEC-ARC-018-03 phần mã), SEC review lại test so `selfData` ↔ `SELF_DATA_FIELDS` trong PR-D. Không thuộc hợp đồng.

ESC mới: không.

---

## Bổ sung 04/11: thẻ BE-A FB-R4-BEA-ARC-01 (Major), **sửa kết luận ở trên**

**Kết luận đổi thành: ĐỒNG Ý CÓ ĐIỀU KIỆN.** Hợp đồng 0.3.12 chỉ vào `main` **cùng** commit sửa của BE-A, như ORC đã quyết. SEC phải review commit đó trước.

- **SEC đồng ý với BE-A: thẻ này là Major.**
  - Serializer hiện chỉ tra `SELF_DATA_FIELDS` khi mã D đã từ chối (`p.f && !rbacFieldAllows`). Bỏ D27 thì 5 thuộc tính `sd` không còn `f`, và nhánh tra danh sách không bao giờ chạy. Như vậy là **fail-open**: thuộc tính được trả cho mọi vai, ở bất kỳ phản hồi nào tham chiếu tới schema đó.
  - Ở dòng `x-self-data` phía trên, SEC đã nhận câu của ARC "không mở rộng phạm vi lộ" mà không tự kiểm đường đi trong serializer. Câu đó chỉ đúng **hôm nay**, nhờ các endpoint `/me*` chỉ trả về chính người gọi. Lớp chặn thứ hai mà SEC-ARC-018-03 muốn giữ đã mất.
- **Điều kiện cho commit sửa** (SEC review theo danh sách này):
  1. `propertyAllowed` dạng **fail-closed**: thuộc tính có `p.sd` chỉ được trả khi `<owner>.<key>` ∈ `SELF_DATA_FIELDS`. Không có thì bỏ, với mọi vai. Các kiểm `w`, `c3`, `g`, `v` vẫn chạy trước như cũ.
  2. Test bằng nhau `SELF_DATA_FIELDS` = `OPENAPI_SCHEMAS.selfData`. Giữ mảng ghim của 018-01 (thêm khóa phải có SEC review).
  3. **Thêm (SEC):** khóa `schema:Me.email` cho phép `Me` ở **mọi** chỗ tham chiếu. Fail-closed không chặn được trường hợp sau này có ai trả `Me` (hay một schema `sd` khác) từ một op không phải "của chính người gọi", ví dụ `listUsers`. Cần một kiểm cấu trúc ở generator hoặc test:
     - mọi schema có thuộc tính `x-self-data` chỉ được tham chiếu (trực tiếp hay gián tiếp) từ phản hồi của một **danh sách op cho phép**: `login`, `loginMfa`, `getMe`, các op `/v1/me*`;
     - op khác tham chiếu tới thì CI đỏ.
     - Người làm: ARC (generator) hoặc BE-A (test). ORC giao. Đây là điều kiện, cùng commit.
  4. Test âm: dựng một shape giả có thuộc tính `sd` với khóa **không** nằm trong `SELF_DATA_FIELDS` → serializer bỏ thuộc tính đó với mọi vai, kể cả OWN.
  5. ARC thêm câu BE-A đề xuất vào mục (f): "Serializer chỉ trả thuộc tính `x-self-data` khi khóa nằm trong `SELF_DATA_FIELDS` của BE; CI kiểm hai tập bằng nhau. Thêm `x-self-data` mà không cập nhật BE thì thuộc tính bị bỏ, không lộ."
- Các thẻ khác của BE-A:
  - **BEA-ARC-02**: SEC đồng ý. Bỏ cờ ở thân yêu cầu `setMyEmail` (hoặc generator báo lỗi khi `x-self-data` nằm trong `requestBody`). Mục (f) sửa "6 chỗ" thành "5 thuộc tính phản hồi".
  - **BEA-ARC-03**: SEC đồng ý. Thật ra (4b) trên `3320fb33` **đã có** câu `null`. Nếu BE-A đọc thấy thiếu thì ARC chép nguyên câu in đậm của (1b) cho đồng nhất.
  - **BEA-ARC-04**: việc của BE-A khi rebase. Không có ý kiến bảo mật.
- SEC chờ ORC báo SHA để review commit sửa, sau đó mới đổi sang "ĐỒNG Ý" cho lượt gộp.
