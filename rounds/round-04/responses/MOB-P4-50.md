# MOB trả lời review UXD + SEC – P4-50 (đăng nhập 2 bước, phiên hạn chế trên app nhân viên)

Round 4 · v1.0.4 · Bước: **Phản hồi & sửa** · Nhánh `v104/mob-2fa` (PR #39).
Review gốc, cùng trên `59e73cd4`:
- `rounds/round-04/reviews/UXD-on-v104-p4-50.md` (ĐẠT CÓ ĐIỀU KIỆN);
- `rounds/round-04/reviews/SEC-on-v104-p4-50.md` (ĐẠT).

Trước khi sửa, nhánh đã gộp `origin/main` @ `d9fa26d0` (merge commit, không rebase, không force-push). Gộp sạch, không xung đột.

## UXD

| Thẻ | Mức | Trả lời | Sửa ở đâu |
|---|---|---|---|
| FB-R4-UXD-MOB-P450-01 | Major | **Accepted, đã sửa.** (1) Thêm `<p className="li-s m-0">{t('staff.mfa_enroll_desk')}</p>` ngay dưới câu `error.MFA_ENROLLMENT_REQUIRED`. Câu luôn hiện, kể cả trên localhost/preview không có nút Desk, nên màn không còn chỉ mỗi nút Đăng xuất. (2) Nút Desk thành nút chính `btn pri xl block`. (3) Icon `lock` → `monitor` của DS. (4) Nhãn giữ "OTTIMO Desk · desk.ottimo.vn". Nút Đăng xuất giữ dạng phụ (`.btn` thường). Khóa `staff.mfa_enroll_desk` đang nằm ở lượt chữ P4-01 của UXD (`v104/uxd-strings`), chưa vào `main`. Trong lúc chờ, MOB ghi khóa vào `src/__tests__/pending-keys.ts`, và `guard.test.ts` chỉ cho phép đúng những khóa trong danh sách này được thiếu. MOB **không** tự thêm khóa vào `gen_strings.py`, để không có hai nguồn cho một khóa. Test: `mgr.enroll` trên localhost thấy câu dẫn và không có link Desk. Với host `staff.example.test`, link là `btn pri`, icon là `monitor`, nút Đăng xuất không phải `pri`. Ca mã khôi phục cũng thấy câu dẫn. | `pages/EnrollOnDeskPage.tsx`, `__tests__/pending-keys.ts` (mới), `__tests__/guard.test.ts`, `__tests__/v104-mfa-signin.test.tsx` |
| FB-R4-UXD-MOB-P450-02 | Minor | **Accepted, đã sửa.** Khi offline, `send()` dừng luôn, không đặt banner đỏ. Cảnh báo vàng (`Alert tone="warn"`, mặc định `role="status"` của DS) đã nói đủ, và mã vẫn giữ nguyên. Sửa cả `MfaStepPage` lẫn `SetPasswordPage`. Test offline: chỉ một khối `login.offline`, không có `role="alert"`. | `pages/MfaStepPage.tsx`, `pages/SetPasswordPage.tsx`, `v104-mfa-signin.test.tsx` |
| FB-R4-UXD-MOB-P450-03 | Suggestion | **Deferred: chờ khóa UXD.** Khi UXD thêm `mfa.code_short`, MOB chỉ đổi một dòng ở nhánh kiểm dạng mã `TOTP_SHAPE`. Hiện giữ `error.MFA_INVALID`, vì UXD đã ghi là chấp nhận được. | – |
| FB-R4-UXD-MOB-P450-04 | Suggestion | **Accepted.** Không thêm `staff.mfa_network`, giữ `common.error_network_body`. Đề xuất ở báo cáo mục 5 đã gạch. | báo cáo `v1.0.4-P4-50.md` |
| FB-R4-UXD-MOB-P450-05 | Suggestion | **Ghi nhận.** Việc của UXD (U+2011 trong `auth.totp.help`) ở lượt chữ P4-01. MOB không sửa gì. | – |

## SEC

| Thẻ | Mức | Trả lời | Sửa ở đâu |
|---|---|---|---|
| FB-R4-SEC-MOB-P450-01 | Minor | **Accepted, đã sửa.** Thêm `OfflineCache.clearMe()`. `enter()` khi có mạng: phiên đầy đủ thì `saveMe`, phiên hạn chế thì `clearMe`, tức xóa `snapshot/me` của lần đăng nhập đầy đủ trước. Khi một lệnh đọc giữa phiên bị 403 hạn chế (`onRestricted`), app cũng `clearMe`. Hàng đợi không bị xóa: thao tác vẫn nằm trên máy và gửi sau khi đặt mật khẩu hoặc bật 2 bước. Test mới làm 3 bước. (1) `hk.temp` đổi mật khẩu, vào **Việc**, hồ sơ được cache. (2) OWN đặt lại mật khẩu tạm, mở app thì ra màn đặt mật khẩu, `snapshot/me` bị xóa. (3) Tắt mạng, mở lại app thì ra màn **Đăng nhập**, không ra Việc, không đọc thêm danh sách việc. Đã thử bỏ phần sửa thì test đỏ. Ca 403 giữa phiên có thêm kiểm `snapshot/me` bị xóa. | `data/cache.ts`, `App.tsx`, `__tests__/helpers.tsx` (`start` nhận `store`), `v104-mfa-signin.test.tsx` |
| FB-R4-SEC-MOB-P450-02 | Minor | **Accepted, chuyển QA.** 3 ca staging với BE thật (`client_origin`, khóa tài khoản + `mfa.locked`, mã khôi phục → phiên hạn chế) ghi ở báo cáo `v1.0.4-P4-50.md` mục 10 để QA chạy trong bước Kiểm thử. Đây là điều kiện trước phát hành, không phải trước merge. MOB ghi kết quả vào báo cáo khi QA có kết quả. | báo cáo mục 10 |
| FB-R4-SEC-MOB-P450-03 | Suggestion | **Accepted, đã sửa.** Ô mã khôi phục dùng `autoComplete="off"`, ô mã 6 số giữ `one-time-code`. Áp ở cả `MfaStepPage` và ô S2 của `SetPasswordPage`. Vẫn giữ `spellCheck={false}`. Test kiểm thuộc tính ở cả hai chế độ. | `pages/MfaStepPage.tsx`, `pages/SetPasswordPage.tsx`, `v104-mfa-signin.test.tsx` |

## Việc giao thêm của ORC
- **`auth.mfa_later`:** mã của app đã bỏ dùng từ `59e73cd4`. Dòng `LoginPage.tsx:49` chỉ còn trên `main`, và lần gộp này thay nó bằng bản của nhánh. Lần này MOB **xóa khóa** khỏi `gen_strings.py` (plan 3.1, P4-50) rồi sinh lại `strings-{vi,en}.json`, `strings.js`, `strings-tables.md` bằng `gen_strings.py`, không sửa tay. Trước khi xóa đã kiểm: trong `apps/`, `packages/`, `services/`, `tests/` không còn chỗ nào dùng khóa này. Test "không còn câu cũ" nay so với chữ VI, không gọi khóa nữa.
- **Cho UXD:** `content-guide.md` dòng `auth.mfa_later` là của UXD, MOB không sửa. Nhánh `v104/uxd-strings` vẫn còn dòng `auth.mfa_later` không đổi, nên lúc gộp sẽ không xung đột. Khi UXD gộp P4-01, MOB xóa mục `staff.mfa_enroll_desk` khỏi `pending-keys.ts`.

## Kiểm thử sau sửa
- `pnpm --filter @ottimo/mobile typecheck`: sạch.
- `vitest run` (mobile): **13 tệp, 162 test xanh**, thêm 2 test mới so với 160.
- `eslint apps/mobile`: 0 lỗi, 1 cảnh báo cũ ở `public/mockServiceWorker.js`. `prettier --check`: sạch.
- `pnpm --filter @ottimo/i18n test`: 22 xanh. `gen_strings.py`: 3 425 chuỗi, tệp sinh ra khớp.
