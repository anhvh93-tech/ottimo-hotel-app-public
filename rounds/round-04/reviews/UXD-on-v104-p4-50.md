# UXD review – v1.0.4 P4-50: đăng nhập 2 bước và phiên hạn chế trên app nhân viên (MOB)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/mob-2fa` @ `59e73cd4`. Mốc so sánh `origin/main` @ `7b5b6117`, merge-base `3a4fb411`.
  - Trang mới: `MfaStepPage.tsx`, `SetPasswordPage.tsx`, `EnrollOnDeskPage.tsx`.
  - Sửa: `LoginPage.tsx`, `App.tsx`, `app/{api,config}.ts`, `app/notifications.tsx`, `queue/queue.ts`, `scripts/used-keys.ts`.
  - Đọc kèm báo cáo `rounds/round-04/outputs/MOB/v1.0.4-P4-50.md`.
- Đối chiếu:
  - brand guideline `00-brief/context/brand/brand-guidelines.md`;
  - Desk `apps/admin-web/src/pages/MfaStep.tsx` (mẫu bước 2);
  - bảng chữ UXD `rounds/round-04/outputs/UXD/v104-strings-table.md` (nhánh `v104/uxd-manual-font`), mục P4-50;
  - plan `rounds/round-04/plan-v1.0.4.md` P4-50.
- Cách kiểm:
  - chạy PWA bản mock trên worktree tạm, mở bằng Playwright ở 390×844 và 1440×900, VI và EN (nút VI/EN lưu ở `ottimo.locale`);
  - tài khoản giả của mock: `hk.mfa` (bước 2, sai mã, mã thiếu số, mã khôi phục), `mgr.enroll` (màn bật 2 bước), `mt.temp.mfa` (mật khẩu tạm có S2, gửi form trống);
  - đọc `innerText`, font tính được, kích thước nút;
  - kiểm khóa chữ bằng script: mọi khóa `t('…')` của 5 tệp đều có trong `strings-vi.json` và `strings-en.json`.
  - Ảnh chỉ để trong scratchpad, không commit (tài khoản giả, không có dữ liệu thật).

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

**Brand**
- Nền Cream, thẻ trắng ngà, tiêu đề Lora 24 px, thân chữ Be Vietnam Pro, ô mã bằng JetBrains Mono.
- Nút chính Ink, nút phụ ghost chữ Earth Brown. Lỗi dùng màu chức năng `--bad`, nằm trong ngoại lệ đã ghi của DS.
- Không có màu tự đặt, không có `style` inline, không có emoji.

**Bố cục**
- Ở 390 và 1440 không tràn ngang. Thẻ rộng 300/362 px.
- Mọi nút cao từ 48 px trở lên (nút chính 56 px), đạt vùng chạm 44 px.

**Khóa chữ**
- Đủ VI + EN, không hiện tên khóa thô.
- Không còn dùng `auth.mfa_later`.

**a11y**
- Bước 2:
  - `form` có `aria-labelledby`;
  - lỗi gắn vào ô bằng `aria-describedby`, ô có `aria-invalid`;
  - sai mã thì focus về ô mã;
  - banner có `role="alert"`;
  - khi bị đưa về bước 1, câu báo dùng `role="status"`.
- Màn đặt mật khẩu: focus tới ô lỗi đầu tiên, mọi ô có `aria-required`, dòng luật mật khẩu gắn vào ô mới.

**Điều kiện để ĐẠT:** làm thẻ **01** (Major) ở giai đoạn B, trong round này. Thẻ 02 nên làm cùng lúc. Thẻ 03–05 MOB tự cân nhắc. Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | **Major** | Màn "Bật xác thực 2 bước" không nói làm gì tiếp. Trên localhost/preview chỉ còn nút Đăng xuất. Thêm câu `staff.mfa_enroll_desk` (UXD duyệt chữ dưới đây), đưa nút Desk lên làm nút chính, đổi icon |
| 02 | Minor | Khi mất mạng mà bấm Xác nhận, cùng câu `login.offline` hiện hai lần (cảnh báo vàng và banner đỏ) |
| 03 | Suggestion | Mã gõ thiếu số (ví dụ 2 số) báo "Mã chưa đúng hoặc đã hết hạn", nghe như mã sai |
| 04 | Suggestion | Không cần thêm `staff.mfa_network`. Giữ `common.error_network_body` |
| 05 | Suggestion | Ở 1440 EN, "6-digit" bị ngắt thành "6-" / "digit". Việc của UXD trong lượt chữ |

## Trả lời giả định và đề xuất chữ của MOB

- **Giả định mục 6 (mật khẩu tạm đổi trên điện thoại, bật 2 bước dẫn sang Desk): UXD xác nhận.** Khớp quyết định ORC 04/11, ghi ở bảng chữ UXD mục P4-50. Đổi mật khẩu dùng khóa `pw.*` như Desk H01 1.2. QR phải quét bằng chính điện thoại này, nên bật 2 bước để trên Desk.
- **`staff.mfa_enroll_desk`: duyệt, giữ nguyên chữ MOB đề xuất.**
  - VI: "Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây."
  - EN: "Open OTTIMO Desk on a computer to turn on 2-step verification, then sign in here again."
  - Câu ngắn, có việc cần làm và có bước tiếp theo, không đổ lỗi. UXD đưa khóa vào nhóm `v1.0.4 P4-50` của `gen_strings.py` ở lượt chữ P4-01 (luật 2.4). MOB dùng khi rebase.
- **`staff.mfa_network`: không thêm** (xem thẻ 04).
- **Xóa `auth.mfa_later`:** UXD xóa trong cùng lượt chữ, sau khi MOB gộp.
- **`staff.temp_password_desk`: không cần.** Đồng ý.

---

### FB-R4-UXD-MOB-P450-01
- Mức độ: Major
- Vị trí: `product/apps/mobile/src/pages/EnrollOnDeskPage.tsx` (toàn màn)
- Vấn đề:
  - Màn chỉ có tiêu đề "Bật xác thực 2 bước" và câu `error.MFA_ENROLLMENT_REQUIRED` ("Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc."). Không câu nào nói **bật ở đâu, bằng gì**.
  - Trên production có thêm nút "OTTIMO Desk · desk.ottimo.vn". Nút này dùng `.btn` thường, cùng độ nhấn với nút Đăng xuất, icon `lock`, và không nói là mở trên máy tính.
  - Trên localhost, preview và mọi tên miền không bắt đầu bằng `staff.`, `deskUrl()` trả `undefined`. Màn khi đó chỉ còn nút **Đăng xuất**: đã kiểm bằng `mgr.enroll` ở 390, cả VI và EN.
- Vì sao quan trọng:
  - Người vào màn này là quản lý/chủ đầu tư chưa bật 2 bước, hoặc **bất kỳ nhân viên nào vừa đăng nhập bằng mã khôi phục** (mất điện thoại), kể cả buồng phòng.
  - Họ đang đứng trong hành lang và không làm được gì trên app. Không có câu dẫn thì họ sẽ đăng xuất rồi đăng nhập lại, gặp lại đúng màn này, rồi gọi quản lý.
  - Đây là đúng lỗi BUG-R3-052 muốn hết: thông báo đúng nhưng không chỉ được lối đi.
- Đề xuất sửa (giai đoạn B, khi có khóa):
  1. Thêm `<p className="li-s m-0">{t('staff.mfa_enroll_desk')}</p>` ngay dưới câu `error.MFA_ENROLLMENT_REQUIRED`. Câu luôn hiện, kể cả khi không có nút Desk.
  2. Nút Desk là việc chính của màn, nên đổi thành nút chính: `className="btn pri xl block"`. Nút Đăng xuất giữ dạng phụ.
  3. Icon `lock` → `monitor` (bộ icon DS đã có). Icon cho biết mở trên máy tính, khớp câu dẫn.
  4. Giữ nhãn "OTTIMO Desk · desk.ottimo.vn". Đây là tên sản phẩm và địa chỉ, nhân viên chép được sang máy tính.
  5. Test: `mgr.enroll` thấy câu `staff.mfa_enroll_desk`. Với host `staff.example.test`, nút Desk là `btn pri`.
- Trạng thái: Open

### FB-R4-UXD-MOB-P450-02
- Mức độ: Minor
- Vị trí: `MfaStepPage.tsx`, nhánh `if (!online) { setBanner({ text: t('login.offline') }) }` trong `send()`, cùng với `{!online ? <Alert tone="warn">{t('login.offline')}</Alert> : null}`. `SetPasswordPage.tsx` có cùng mẫu (dòng 105–108 và 195).
- Vấn đề: đang offline mà bấm Xác nhận thì câu "Không có mạng. Cần kết nối để đăng nhập." hiện hai lần: một lần vàng (warn), một lần đỏ (bad, `role="alert"`).
- Vì sao quan trọng:
  - Hai khối cùng chữ, khác màu, làm người dùng tưởng có hai lỗi;
  - trình đọc màn hình đọc lại câu đã có trên màn;
  - mất mạng không phải lỗi của người dùng, nên không nên tô đỏ.
- Đề xuất sửa: khi offline, `send()` chỉ `return` mà không đặt banner, vì cảnh báo vàng đã nói đủ và mã vẫn giữ nguyên. Nếu muốn báo lại cho trình đọc màn hình, cho cảnh báo vàng `role="status"`. Test offline đổi theo: chỉ một khối `login.offline`.
- Trạng thái: Open

### FB-R4-UXD-MOB-P450-03
- Mức độ: Suggestion
- Vị trí: `MfaStepPage.tsx`, kiểm dạng mã `TOTP_SHAPE` / `RECOVERY_SHAPE` → `setFieldError(t('error.MFA_INVALID'))`
- Vấn đề:
  - Gõ "12" rồi bấm Xác nhận thì nhận "Mã chưa đúng hoặc đã hết hạn. Nhập mã đang hiện trong ứng dụng.";
  - với mã thiếu số, câu đúng hơn là "chưa đủ 6 số";
  - Desk `MfaStep` gửi mã thiếu lên máy chủ (422), nên hai nơi đã khác nhau. Chặn trên máy như MOB làm là tốt hơn, vì không tốn lượt.
- Vì sao quan trọng: nhân viên tưởng mã sai, mở lại ứng dụng xác thực, chờ mã mới, trong khi chỉ cần gõ thêm số.
- Đề xuất sửa:
  - Nhãn ô đã ghi "(6 số)" / "(16 ký tự)", nên câu hiện tại chấp nhận được.
  - Nếu muốn rõ hơn, ở lượt chữ sau UXD thêm `mfa.code_short` ("Mã có 6 số. Kiểm tra rồi nhập lại." / "The code has 6 digits. Check it and try again."). Câu một lỗi của SEC 06.20 chỉ áp cho câu trả lời của máy chủ, nên không bị ảnh hưởng.
  - Không chặn gói này.
- Trạng thái: Open

### FB-R4-UXD-MOB-P450-04
- Mức độ: Suggestion
- Vị trí: báo cáo MOB mục 5, đề xuất `staff.mfa_network`
- Vấn đề: câu đề xuất "Mã bạn đã nhập vẫn còn – … bấm Thử lại" khuyến khích gửi lại **cùng một mã TOTP**. Mã TOTP chỉ sống khoảng 30 giây. Mạng trong hành lang chập chờn lâu hơn thế thì lần Thử lại sẽ thành `MFA_INVALID` và **bị tính một lượt sai**.
- Vì sao quan trọng: câu hứa "mã vẫn còn" sẽ sai đúng lúc người dùng tin nó, rồi đẩy họ gần tới mốc 5 lần sai.
- Đề xuất sửa: giữ `common.error_network_body` như hiện tại ("Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Thử lại. Dữ liệu của bạn không bị mất."). Câu này đúng cả khi mã cũ hết hạn. Không thêm khóa.
- Trạng thái: Open

### FB-R4-UXD-MOB-P450-05
- Mức độ: Suggestion
- Vị trí: `auth.totp.help` EN ("…enter the 6-digit code shown."). Ở 1440, trong thẻ rộng 362 px, chữ ngắt thành "6-" / "digit".
- Vấn đề: chuỗi có sẵn từ trước. Gạch nối thường cho phép trình duyệt ngắt dòng ngay sau nó.
- Vì sao quan trọng: lỗi nhỏ về kiểu chữ, nhưng nằm ngay câu hướng dẫn chính.
- Đề xuất sửa: UXD đổi sang gạch không ngắt U+2011 ("6‑digit") trong `auth.totp.help` và các câu "6-digit" khác ở lượt chữ P4-01. MOB không phải sửa gì.
- Trạng thái: Open

---

## Điểm làm tốt
- Hạn 5 phút tính theo mốc giờ và kiểm lại khi app trở lại màn hình, nên điện thoại ngủ trong túi không kéo dài hạn. Mạng yếu thì giữ mã, rồi gọi `getMe` trước khi gửi lại. Đây là trải nghiệm đúng cho nhân viên đi hành lang.
- Phiên hạn chế (mật khẩu tạm, chưa bật 2 bước) có màn riêng. Không còn câu "Có thể do mạng yếu" sai chỗ.
- Bước 2 và màn đặt mật khẩu dùng lại đúng mẫu DS của màn đăng nhập (`.field`, `.help.err`, `hk-brand`, nút `xl`). Thứ tự focus và liên kết lỗi–ô làm cẩn thận.
