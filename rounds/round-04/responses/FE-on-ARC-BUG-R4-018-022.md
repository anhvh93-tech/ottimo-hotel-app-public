# FE-A trả lời review ARC – BUG-R4-018…022 (phần Desk)

- Round 4 – đợt v1.0.3 – bước **Phản hồi & sửa**.
- Review: `rounds/round-04/reviews/ARC-on-BUG-R4-018-022.md`. Thẻ cho FE-A: FB-R4-ARC-FE-018-01. Các thẻ BE-018-xx thuộc BE-A.
- Nhánh `fe-a/v1.0.3-email`, đã đưa lên `origin/v1.0.3-email` @ `c1bd90a1` (fast-forward), trong đó có BE `ead8ac83`.

## FB-R4-ARC-FE-018-01 (Minor) – Tên `field` của `STRONG_REAUTH_REQUIRED` khác nhau theo op

**Trạng thái: Done**

Sửa `missingFactor` ở `apps/admin-web/src/components/StrongReauthDialog.tsx`, theo đề xuất của ARC. Hàm bỏ tiền tố `body.`, rồi bỏ `reauth.`, rồi mới so:

| `field` server trả | Ô được đánh dấu "Bắt buộc" |
|---|---|
| `reauth`, `password`, `currentPassword` (kể cả `reauth.password`) | Mật khẩu |
| `totpCode`, `recoveryCode` (kể cả `reauth.totpCode`, `reauth.recoveryCode`) | Mã. Chỉ khi ô mã đang hiện. Nếu `Me.mfaEnabled` đã cũ, Desk quay về câu chung |
| Tên khác (`reauth.secret`, `email`…) | Không ô nào. Desk dùng đường cũ |

Theo EM-14, focus luôn về ô mật khẩu. Hộp không hiện banner "chưa đúng" khi server báo **thiếu**.

Mock (`apps/admin-web/src/mocks/handlers.ts`) nay dùng đúng tên `field` như BE `mfa.controller.ts`. Hằng mới `FLAT_FIELDS = { password: 'password', factor: 'totpCode' }` dùng cho `regenerateMyRecoveryCodes` và `disableMy2fa`, áp cho cả 422 lẫn 401. Các op còn lại giữ như cũ:

- `{…, reauth}` dùng `reauth` / `reauth.totpCode`;
- `changeMyPassword` / `trustCurrentDevice` dùng `currentPassword` / `totpCode`.

### Test mới (`v103-email-fea.test.tsx`, nhóm "S2 missing factor – field names per operation")

- Bảng 11 tên `field` kiểm qua `missingFactor`, thêm 1 ca thiếu mã khi ô mã không hiện (trả `null`).
- **UI:** `regenerateMyRecoveryCodes` trả `field: password`.
  - Ô mật khẩu báo "Bắt buộc" và có focus.
  - Ô mã không lỗi.
  - Không có banner `reauth.s2_failed`, không có `role=alert`.
- **Mock khớp server:** `regenerateMyRecoveryCodes` và `disableMy2fa` thiếu mã đều trả `{ field: 'totpCode', code: 'STRONG_REAUTH_REQUIRED' }`.

## Kiểm thử

- admin-web `vitest run --maxWorkers=3`: **67 tệp, 756/756 xanh**. `v103-email-fea.test.tsx` có 73 ca.
- `tsc --noEmit`: 0 lỗi. `prettier --check src`: sạch. `eslint` trên các tệp sửa: 0 lỗi.
