# UXD review – v1.0.4 P4-30: Người dùng & vai – menu Khác…, Đặt lại xác thực 2 bước, cột Email (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-users-2fa` @ `78f85fa9`. Mốc so sánh `origin/main` @ `7b5b6117`, merge-base `c6cd32a8`.
  - Tệp mới: `UserMoreMenu.tsx`.
  - Tệp sửa: `UsersPage.tsx`, `StrongReauthDialog.tsx`, `pending-keys-p4-30.json`, `i18n-keys.test.ts`.
  - Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-fe-users-2fa.md`.
- Đối chiếu:
  - brand guideline `00-brief/context/brand/brand-guidelines.md`;
  - bảng chữ UXD `rounds/round-04/outputs/UXD/v104-strings-table.md` (mục P4-30, 4.1, G4);
  - các hộp S2 cùng trang (`users.reset_pw_title`, `users.lock_title`);
  - mẫu menu `.card.menu-pop` + `.rowlink` của menu người dùng.
- Cách kiểm:
  - chạy admin-web bản mock trên worktree tạm, mở bằng Playwright ở 1440×900, 1366×768 và 390×844, VI và EN, đăng nhập `qa.owner`;
  - nhánh chưa có 5 khóa chữ (đang chờ P4-01), nên trong worktree tạm đã chép `strings-vi/en.json` của `origin/v104/uxd-strings` @ `36f38edd` để xem chữ thật;
  - mock `listUsers` chưa trả `mfaEnabled` (FE G3), nên trong worktree tạm đã cho một nửa số người `mfaEnabled: true` và thêm email dạng `qa.fd.v103d7@example.test`;
  - hai chỗ sửa trên chỉ ở bản tạm, **không commit, không đụng nhánh FE**. Ảnh để trong scratchpad, không commit (chỉ có tài khoản giả).

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

**Brand**
- Nút "Khác…" là ghost sm, chữ Earth Brown. Menu dùng lại `.card.menu-pop` + `.rowlink`, icon `key` / `lock` / `shield`.
- Hộp Đặt lại 2 bước dùng S2 chung, nút xác nhận tông danger.
- Email hiện bằng JetBrains Mono 13 px.
- Không có màu tự đặt, không có emoji. `style` inline duy nhất là `position: fixed` của popover, có lý do ghi trong mã.

**a11y menu** (đúng mẫu menu-button WAI-ARIA, đã thử)
- Nút có `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `aria-label` kèm tên người ("Khác…: Quân").
- Mở menu thì focus mục đầu. ↑/↓/Home/End xoay vòng. Enter mở hộp, Esc trả focus về nút.

**Cột Email (BUG-R4-023)**
- Ở 1366 và 1440, VI và EN, `qa.owner.v103d7@example.test` nằm một dòng (cao 17 px).
- Ở 390, địa chỉ chỉ ngắt ngay sau `@`. Bảng cuộn ngang trong `.table-wrap`, trang không tràn ngang.

**BUG-R4-024:** hộp S2 chỉ có ô mật khẩu thì báo `reauth.s2_failed_password`.

**Khóa chữ**
- 6 khóa dùng lại đã có trên `main`.
- 5 khóa mới có trên `v104/uxd-strings`, chữ đúng bảng UXD.
- Trước khi rebase, Desk hiện tên khóa thô. FE đã ghi rõ: **không mở PR trước khi rebase lên strings lượt 1**. UXD đồng ý, đây là điều kiện gộp.

**Điều kiện để ĐẠT:**
1. Rebase lên strings lượt 1 và xóa `pending-keys-p4-30.json`.
2. Làm thẻ 01: UXD thêm khóa ở P4-01, FE đổi một dòng.
3. Làm thẻ 02.

Thẻ 03 nên làm cùng lúc với việc bỏ `overflow-wrap` ở `app.css` (giai đoạn B). Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Minor | Tiêu đề hộp ghép chuỗi trong mã ("Đặt lại xác thực 2 bước – Quân"), rồi câu dẫn lặp lại "Đặt lại xác thực 2 bước cho Quân?". Dùng khóa tiêu đề dạng câu hỏi như hai hộp cùng trang. UXD sửa chữ |
| 02 | Minor | Ô Lý do: mở hộp thì focus nhảy qua ô này vào ô mật khẩu. Lý do sai thì focus đứng yên ở nút, trình đọc màn hình không biết có lỗi |
| 03 | Minor | Hàng tài khoản đã khóa: ở 1366 EN (và 1280 VI/EN), cột thao tác xuống 2 dòng ("Edit roles · Unlock" / "More…"). "Khác…" cũng lệch cột so với các hàng khác |
| 04 | Suggestion | Nút "Mở khóa" đặt sau "Khác…" để "Khác…" luôn cùng một cột |

## Trả lời giả định của FE-A (báo cáo mục 4) và câu hỏi đóng thẻ

- **G1 – giữ "Đặt lại mật khẩu" trong Khác… của tài khoản đã khóa: đồng ý.** Tài khoản "tạm khóa do sai mật khẩu" thường cần đúng việc này. Hifi 07 chỉ vẽ một hàng mẫu, không cấm. `users.more_help` vẫn đúng, vì câu liệt kê những gì có thể có trong menu.
- **G2 – tiêu đề `users.reset_2fa` + " – " + tên: không giữ**, xem thẻ 01. Ghép chuỗi trong mã thì người dịch không đổi được thứ tự, và tiêu đề lặp câu dẫn.
- **G3 – thiếu `mfaEnabled` thì coi như chưa bật: đồng ý.** Khớp UXD G4 (chỉ hiện mục khi đã bật). Gợi ý: mock dev `listUsers` trả `mfaEnabled` để QA và UXD chụp C1-07/C1-22 không phải sửa tay. Việc của FE, không phải thẻ.
- **UXD-FE-EM-07 / EM-13 / EM-14: UXD đóng cả 3 thẻ (Done).** Đã kiểm trên nhánh:
  - dòng `reauth.s2_help*` không còn `style`, nằm trong `form.stack`;
  - `.btn.btn-inline[disabled]` có ở `app.css` dòng 480;
  - EM-14 có test hồi quy ở `v103-email-fea.test.tsx` dòng 366.
  - ORC ghi trạng thái khi gom phản hồi.

---

### FB-R4-UXD-FE-P430-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/UsersPage.tsx`, `title` của `StrongReauthDialog` khi `pending.kind === 'reset2fa'` (`` `${t('users.reset_2fa')} – ${pending.user.displayName}` ``). Khóa `users.reset_2fa_confirm` trên `v104/uxd-strings`.
- Vấn đề:
  - Hộp hiện ra (VI, 1440):
    - tiêu đề "Đặt lại xác thực 2 bước – Quân";
    - dòng đầu thân hộp "Đặt lại xác thực 2 bước cho Quân? Người này bị đăng xuất…".
  - Hai dòng liền nhau lặp cùng một cụm và cùng một tên.
  - Hai hộp anh em trên trang làm khác:
    - tiêu đề là câu hỏi, có `{name}`: `users.reset_pw_title` "Đặt lại mật khẩu cho {name}?", `users.lock_title` "Khóa tài khoản của {name}?";
    - thân hộp chỉ là câu hệ quả: `users.reset_pw_body`, `users.lock_body`.
  - Lỗi nằm ở chữ của UXD: câu `users.reset_2fa_confirm` mở bằng câu hỏi, nên FE phải ghép tiêu đề trong mã.
- Vì sao quan trọng:
  - ba hộp xác nhận trên cùng một trang nên đọc cùng một nhịp;
  - ghép chuỗi bằng " – " trong mã không dịch được (thứ tự và dấu do mã cố định);
  - sổ tay H07 và ảnh QA C1-07 sẽ chép đúng tiêu đề này.
- Đề xuất sửa:
  1. **UXD** (lượt chữ P4-01, nhóm `v1.0.4 P4-01`):
     - thêm khóa `users.reset_2fa_title`: VI "Đặt lại xác thực 2 bước cho {name}?" / EN "Reset 2-step verification for {name}?";
     - sửa `users.reset_2fa_confirm` thành VI "Người này bị đăng xuất trên mọi máy, mã khôi phục cũ hết hiệu lực. Ở lần đăng nhập tới, người này thêm OTTIMO vào ứng dụng xác thực trên điện thoại mới." / EN "They are signed out on every device and their old recovery codes stop working. At next sign-in, they add OTTIMO to the authenticator app on their new phone.";
     - `{name}` không còn trong câu dẫn. FE vẫn truyền `name`, thừa tham số không sao.
  2. **FE-A:** `title = t('users.reset_2fa_title', { name: pending.user.displayName })`, thêm khóa này vào `pending-keys-p4-30.json` tới khi rebase. Nút xác nhận giữ `users.reset_2fa`, tức là động từ, như `users.reset_pw`.
- Trạng thái: Open

### FB-R4-UXD-FE-P430-02
- Mức độ: Minor
- Vị trí: `StrongReauthDialog.tsx` (focus khi mở hộp và trong `submit` khi `validate()` trả `false`); `UsersPage.tsx` `reasonOk`
- Vấn đề (đo bằng Playwright, cả VI/EN, 1440 và 390):
  1. Mở hộp Đặt lại 2 bước thì focus vào **ô mật khẩu**, bỏ qua ô Lý do nằm phía trên. Người dùng bàn phím gõ mật khẩu, rồi phải Shift+Tab ngược lên.
  2. Lý do ngắn (ví dụ " a ") và mật khẩu đúng: bấm xác nhận thì không gửi gì (đúng), câu lỗi hiện dưới ô (đúng). Nhưng focus **vẫn ở nút** `Đặt lại xác thực 2 bước`. Câu lỗi không phải vùng live, nên trình đọc màn hình không đọc gì, như thể nút không phản hồi.
- Vì sao quan trọng:
  - đây là thao tác bảo mật ít khi làm, chủ đầu tư dễ bối rối;
  - checklist UXD yêu cầu lỗi phải dẫn tới chỗ sửa;
  - EM-14 (v1.0.3) đã đặt luật "focus về ô cần sửa" cho hộp này.
- Đề xuất sửa:
  - Khi hộp có ô riêng của người gọi (`validate` có mặt), focus ban đầu vào ô đầu tiên trong `children`. Có thể thêm prop `initialFocus`, hoặc FE tự `autoFocus` ô Lý do. Các hộp S2 khác không đổi, vẫn focus ô mật khẩu.
  - Khi `validate()` trả `false`, focus ô đầu tiên có `aria-invalid="true"` trong hộp. Áp chung cho cả ô của hộp S2: ô mật khẩu/mã trống hiện cũng chưa được focus.
  - Thêm 2 assert vào `v104-users-fea.test.tsx`: focus ban đầu ở ô Lý do; sau lý do ngắn, focus ở ô Lý do.
- Trạng thái: Open

### FB-R4-UXD-FE-P430-03
- Mức độ: Minor
- Vị trí: `UsersPage.tsx`, ô thao tác cuối hàng (`Sửa vai` · `Mở khóa` · `UserMoreMenu`); CSS của ô này trong `packages/ui/src/styles/app.css`
- Vấn đề:
  - Đếm số dòng nút trong ô thao tác của từng hàng (10 hàng mock):
    - 1440: một dòng ở mọi hàng, VI và EN;
    - **1366 EN: hàng "Tài khoản khóa" xuống 2 dòng**: "Edit roles · Unlock" ở trên, "More…" ở dưới;
    - **1280: hàng đó xuống 2 dòng** ở cả VI và EN.
  - Plan P4-30 yêu cầu ảnh 1366/1440. Cột Email đã hẹp lại để nhường chỗ, nên hàng có 3 nút là hàng đầu tiên vỡ.
- Vì sao quan trọng:
  - hàng tài khoản bị khóa là hàng chủ đầu tư cần tìm nhanh nhất (mở khóa cho nhân viên đứng chờ ở quầy);
  - hàng cao gấp đôi và "More…" lạc xuống dòng dưới trông như lỗi.
- Đề xuất sửa (giai đoạn B, khi FE-A sửa `app.css`):
  - cho nhóm nút thao tác `flex-wrap: nowrap` và `white-space: nowrap`, với độ rộng tối thiểu đủ 3 nút sm. Cột Email đã nhường chỗ, và địa chỉ được ngắt sau `@`, nên còn đủ khoảng;
  - kiểm lại 1366 VI/EN và 1280 khi chụp C1-07/C1-22.
- Trạng thái: Open

### FB-R4-UXD-FE-P430-04
- Mức độ: Suggestion
- Vị trí: `UsersPage.tsx`, thứ tự `Mở khóa` → `UserMoreMenu`
- Vấn đề: ở 1440, "Khác…" của hàng đã khóa nằm ở x≈1354, các hàng khác ở x≈1270. Mắt dò theo cột sẽ hụt.
- Vì sao quan trọng: bảng nhiều hàng đọc theo cột. Nút cùng việc đứng cùng chỗ thì thao tác nhanh hơn.
- Đề xuất sửa: thứ tự `Sửa vai` · `Khác…` · `Mở khóa`. Nút Mở khóa (viền, nhấn hơn ghost) đứng cuối vẫn dễ thấy. Làm cùng thẻ 03 nếu FE thấy hợp lý.
- Trạng thái: Open

---

## Điểm làm tốt
- Menu Khác… đúng mẫu WAI-ARIA đến từng chi tiết: Esc trả focus về nút, Tab đóng menu. Popover `fixed` để không bị `.table-wrap` cắt ở các hàng cuối. Bấm ra ngoài, cuộn hay đổi cỡ cửa sổ thì menu đóng.
- `EmailText` (hai nửa `nowrap` nối bằng `<wbr>` sau `@`) giải đúng BUG-R4-023 mà không cần "…" hay `title`, đúng quyết định UXD 4.1.
- Cơ chế `pending-keys-<gói>.json` cho khóa chờ rất gọn: mỗi gói một tệp, không giẫm chân nhau. Ca "khóa chờ vẫn còn chờ" nhắc dọn khi rebase.
