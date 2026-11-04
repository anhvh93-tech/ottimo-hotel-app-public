# SEC trên hợp đồng OpenAPI 0.3.12-draft (P4-00)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/arc-contract` @ `3320fb33`:
  - `product/docs/api/openapi.yaml`, đọc phần nhật ký 0.3.12 và các operation liên quan;
  - báo cáo `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md`.
- Phạm vi: 5 điểm ORC hỏi. Không review lại (b), (c), (d), (h). Không sửa tệp nào khác. Không commit.

## Kết luận: **ĐỒNG Ý** gộp

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
