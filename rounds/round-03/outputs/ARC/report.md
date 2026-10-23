# ARC – Báo cáo Round 3, Sprint 1, bước Sản xuất (22/10/2026)

- Chi tiết: `rounds/round-03/outputs/ARC/s1-contracts.md` (mục 0–11).
- Ghi chú: ORC ghi file này thay ARC (công cụ chặn subagent ghi `report.md`; INV cho phép 23/10).

## Đã làm gì
- Hợp đồng lên **OpenAPI 0.3.8-draft**. Validator, Redocly (0 lỗi, 4 cảnh báo cũ), `gen_traceability --strict` (RBAC lệch 0), `gen_rbac_cases --check` (205 operation, mismatch []), vitest contract/serializer/module-boundaries/redact 31/31, `tsc` 5 gói đều xanh.
- **US-143 (2FA):** phiên hạn chế trả `403 MFA_ENROLLMENT_REQUIRED`; `loginMfa` nhận `{mfaToken, totpCode | recoveryCode}`, mọi lỗi trả `401 MFA_INVALID`; bỏ `Idempotency-Key` ở `startMy2faSetup`, `confirmMy2fa` (SEC 06.9); thêm `regenerateMyRecoveryCodes`, `resetUser2fa`. Khôi phục chủ đầu tư duy nhất là lệnh quản trị trên máy chủ, không có endpoint.
- **S2 dùng chung:** schema `StrongReauth` (mật khẩu + TOTP hoặc mã khôi phục) gửi trong request, đánh dấu `x-strong-reauth` trên 11 operation.
- **US-164:** tài nguyên riêng `ManagerConfirmation`; quản lý duyệt bằng PIN trên phiên đã 2FA; B18 nhận `confirmationId`; quá hạn thì lễ tân thu đúng số server tính, không giảm, quản lý xem lại trong 24 giờ (ESC-024 B).
- **R3-Q51:** chỉ OWN đọc/ghi, hiệu lực từ ngày kinh doanh kế tiếp, S2, thêm `cancelScheduledParameter`, số che `•••• 1234` kèm `bankName`.
- **US-155 phần Desk:** đóng băng hợp đồng từ 0.3.7 bổ sung 2, gắn `x-rbac` A64.
- **R3-Q38:** làm – `Me.properties[].businessDate`, `businessDayRollover`. **R3-Q26, Q27, Q28:** làm trong Sprint 1, kèm test kiến trúc.
- **Lượt kiểm tiền:** 210 và 209 chung một PR (cùng `writeDebt`); phần `folio-lines` của 208 code song song nhưng chỉ gộp sau 210/209. Sửa câu 210 trong 16.31.2 theo DOM (ca 210-A = 934.000). "OWN thu hồi khoản miễn" (ESC-026 A, E26-6…8) dời Sprint 2, QA gắn `pendingFix: R3-FOC-REVOKE`.

## File tạo/sửa
- `product/docs/api/openapi.yaml`; mã sinh `openapi-meta.ts`, `openapi-schemas.ts`, `api-client/src/generated/openapi.ts`
- `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv`
- `product/docs/erd.md` (mục 4.15 + lịch sử)
- `rounds/round-02/outputs/ARC/openapi-0.3.7.md` (gạch câu 210)
- `rounds/round-03/outputs/ARC/s1-contracts.md`
- `01-decisions/decision-log.md` (1 dòng ARC)

## Quyết định ARC (đã ghi decision-log)
- Cờ 2FA là biến triển khai `MFA_ENFORCED`; production bắt buộc `true`.
- Màn duyệt của quản lý là Desk mở trên điện thoại; thông báo qua Web Push VAPID (miễn phí).
- Số migration lấy lúc rebase, không giữ chỗ trước.
- R3-Q10: server bắt buộc `periodId` và `roomId` khi buồng phòng ghi minibar.

## Giả định cần vai khác xác nhận
- SEC: S2 gửi kèm trong request thay token riêng; `ManagerConfirmation` là bảng riêng thay vì gắn vào `approval_request` (SEC 06.29).
- DOM: quản lý xem lại thấy nên miễn khoản thu ESC-024 B thì dùng A32 có sẵn rồi hoàn theo BR-522, không thêm đường tiền mới.
- INT/OPS: email (SEC 06.15, 06.33, Q51-6) dùng hộp thư sẵn có, không phát sinh phí; nếu cần dịch vụ trả phí thì ORC mở ESC.

## Rủi ro
- S2 trên các operation đã cài là thay đổi CỔNG: BE và FE phải cùng một PR.
- Phần B18 của US-164 và R3-Q27 phía payments chạm tệp lượt tiền, chỉ gộp sau bước 3.
- Web Push trên iPhone chỉ chạy khi Desk được thêm vào màn hình chính.

## Việc chưa xong
- "0.3.8 bổ sung 1" (dự kiến D3): US-021 AC7 `property_fault`, R3-Q13 `checkout_overdue`, R3-Q42 + ADR-006, US-128, US-141, US-161/162.
- Hợp đồng thu hồi khoản miễn ở 0.3.9.
- Vai khác: BE-A thêm 2 mã audit money của US-164; BA thêm A-code US-164 vào rbac + mã chuyển trạng thái SM-19; OPS thêm `MFA_ENFORCED` và khóa VAPID vào `.env.example` (placeholder).

## ESC mới
- Không có.
