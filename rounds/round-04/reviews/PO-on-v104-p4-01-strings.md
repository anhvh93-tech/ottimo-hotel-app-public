# PO review – P4-01 `v104/uxd-strings` (strings lượt 1, v1.0.4)

- Người review: PO | Round 4 – v1.0.4 – Bước: **Review chéo** | 04/11/2026
- Đối tượng: `origin/v104/uxd-strings` @ `36f38edd` (1 commit, tác giả UXD), so với `origin/main` @ `7b5b6117`. Tệp đổi: `product/design/tools/gen_strings.py` và 5 tệp sinh ra (`strings-{vi,en,ru}.json`, `strings.js`, `strings-tables.md`).
- Góc nhìn PO: đúng phạm vi và tiêu chí nghiệm thu của `rounds/round-04/plan-v1.0.4.md` (dòng P4-01 mục 3, mục 2.4, bảng 3.1, brief UXD mục 8). CPY review song song phần chữ hướng khách (`error.ID_NUMBER_DETECTED` VI/EN/RU), nên PO không chấm giọng RU.
- Cách kiểm:
  - đọc diff `gen_strings.py`;
  - đối chiếu từng khóa với bảng 3.1 và bảng chữ UXD `rounds/round-04/outputs/UXD/v104-strings-table.md` (đang nằm trên nhánh `v104/uxd-manual-font`);
  - gộp thử nhánh vào `origin/main` trong worktree tạm, chạy `python3 design/tools/gen_strings.py`, xem có lệch tệp sinh ra không (đúng việc CI `Copy is generated` làm);
  - tìm chỗ mã đang dùng khóa bị xóa;
  - xem FE-B (`v104/fe-holds`) và FE-A (`v104/fe-users-2fa`) truyền tham số gì cho khóa mới.
- Không sửa mã, không sửa decision-log. Tệp này không có dữ liệu khách.

---

## 1. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Có 1 Major (FB-R4-PO-UXD-P401-01) phải xử lý trước khi gộp. Ngoài ra có 2 Minor và 2 Suggestion.

| Tiêu chí (plan P4-01) | Kết quả |
|---|---|
| Đủ khóa ở bảng 3.1 (P4-30, 31, 41, 40, 32, 50) | **Đạt.** Đủ cả 6 gói. Tên `attention.*` → `attn.*` và `notif.*` → `staff.notif.k.*` theo ARC 0.3.12 mục 2.5; chữ giữ nguyên. P4-31 và P4-41 sửa chữ ngay tại khóa cũ, tên khóa giữ nguyên. Thêm `users.reset_2fa_reason` (ARC đồng ý tên), `rooms.cancel_sched_first` (BUG-R4-015), `mlog.a_refund_destination_carried` (P4-12) và `attn.*_one`. Các khóa thêm này đều có lý do trong ghi chú và nằm trong phạm vi hợp đồng 0.3.12 |
| CI `Copy is generated` xanh | **Đạt.** Gộp thử lên `main` @ `7b5b6117` không xung đột. Sinh lại ra 3455 chuỗi + 8 mẫu và **không lệch** tệp sinh ra nào |
| Giọng OTTIMO: ngắn, lịch sự, điềm tĩnh, không emoji | **Đạt.** Chữ nhân viên không có "Vui lòng", "!" hay emoji. Câu lỗi nói tình trạng trước, rồi tới việc cần làm. Chỉ khóa hướng khách `error.ID_NUMBER_DETECTED` dùng "Vui lòng" / "Please", đúng giọng với khách như `gw.req.card_detected` |
| VI + EN đủ | **Đạt.** Mọi khóa mới có VI + EN. RU chỉ có ở 1 khóa hướng khách |
| `content-guide.md` | **Chưa làm.** Xem FB-…-02 |
| EM-15 | **Đạt.** Đã xử lý trước đó: ghi chú `users.email_self`, `users.email_other_owner`, `secmail.purpose` và tiêu đề nhóm v1.0.3 trên nhánh đều khớp mã hiện tại |
| Nền nhánh | Nhánh cắt từ `3320fb33` (ARC P4-00). Commit này nằm trên `main` nhưng **trước** lần gộp `lp-v2-main` (`7224e8fd`), nên chưa đúng chữ "cắt từ `main@L`" của plan 2.4. Vì gộp thử sạch và sinh lại không lệch, PO **không** coi đây là lỗi. Nếu ORC muốn lịch sử thẳng thì rebase trước khi gộp |

---

## 2. Thẻ feedback

### FB-R4-PO-UXD-P401-01
- Mức độ: Major
- Vị trí: `product/design/tools/gen_strings.py`, nhóm "R2 Sprint 1 – admin-web EP00". Nhánh xóa dòng `("auth.mfa_later", …)`.
- Vấn đề:
  - Trên `origin/main`, app nhân viên vẫn dùng khóa này: `product/apps/mobile/src/pages/LoginPage.tsx:49` → `${t('error.MFA_REQUIRED')} ${t('auth.mfa_later')}`.
  - Chỗ dùng chỉ mất khi `v104/mob-2fa` (P4-50) gộp. Nhánh đó đã bỏ dòng này.
  - Nhưng P4-50 cần `staff.mfa_enroll_desk` và `staff.mfa_network` của chính PR này, nên P4-50 phải gộp **sau** P4-01.
  - Vì vậy sẽ có một khoảng thời gian `main` và staging chạy app nhân viên mà không còn chữ cho khóa này. `packages/i18n/src/translate.ts` sẽ hiện **tên khóa thô** "auth.mfa_later" trên màn đăng nhập khi máy chủ đòi 2 bước.
  - Plan bảng 3.1 giao việc xóa khóa này cho **P4-50**, không phải P4-01.
- Vì sao quan trọng:
  - OTTIMO hiện dùng một tài khoản giữ cả 6 vai, và tài khoản này phải bật 2 bước. Chủ đầu tư hoặc quản lý đăng nhập app nhân viên trên staging trong khoảng thời gian nói trên sẽ thấy mã thô.
  - Nếu P4-50 bị dời khỏi v1.0.4, lỗi này đi thẳng ra production.
- Đề xuất sửa: giữ lại dòng `auth.mfa_later` trong PR này, kèm ghi chú "xóa ở P4-50". MOB xóa dòng đó trong nhóm `v1.0.4 P4-50` cùng PR bỏ chỗ dùng ở `LoginPage.tsx` (đúng luật 2.4 "khóa phát sinh muộn", và là sửa gen_strings duy nhất của MOB). Nếu UXD muốn giữ việc xóa ở PR này thì ORC phải gộp P4-01 và P4-50 **liền nhau**, giữa hai lần gộp không deploy staging. PO chọn cách giữ dòng vì không phụ thuộc thứ tự gộp.
- Trạng thái: Open

### FB-R4-PO-UXD-P401-02
- Mức độ: Minor
- Vị trí: `product/design/content-guide.md` (nhánh không sửa). Xem plan mục 3 dòng P4-01 (cột Việc và cột Tệp), brief UXD mục 8 và bảng chữ UXD mục 5 bước 4.
- Vấn đề: plan và bảng chữ của chính UXD yêu cầu `content-guide.md` có:
  - dòng đổi phiên bản;
  - thuật ngữ "cọc thiếu / short deposit";
  - luật chọn `reauth.s2_failed` hay `reauth.s2_failed_password`.

  Nhánh chưa có cả ba.
- Vì sao quan trọng: từ ngày 05/11, dev tự thêm khóa phát sinh muộn (2.4). Nếu hướng dẫn chưa có thuật ngữ và luật chọn câu lỗi S2, các gói có thể viết lệch nhau ("cọc thiếu" với "thiếu cọc", "cọc chưa đủ"). UXD phải sửa lại ở lượt review.
- Đề xuất sửa: thêm 3 ý trên vào `content-guide.md`, trong PR này hoặc một PR riêng của UXD. Phải có **trước QC v1.0.4**.
- Trạng thái: Open

### FB-R4-PO-UXD-P401-03
- Mức độ: Minor
- Vị trí: `gen_strings.py` nhóm "v1.0.4 P4-01", hai khóa:
  - `hold.paid_overdue_banner`: "… Mốc xử lý: **12:00** {date}";
  - `staff.notif.k.hold_overdue_cap`: "Giữ chỗ còn chờ cọc sau **12:00** ngày đến".
- Vấn đề:
  - 12:00 là giá trị **mặc định** của tham số `hold_latest_time_on_arrival` (BR-302, bảng tham số BR mục 13). Tham số này OWN đổi được.
  - Khóa cùng ý `attn.hold_overdue_cap` thì dùng `{time}` (= `dueAt`). Hai khóa trên ghi cứng giờ.
  - Ghi chú khóa cũng nói rõ: "12:00 = mặc định hold_latest_time_on_arrival".
- Vì sao quan trọng: nếu OWN đổi giờ nhận phòng hoặc trần giữ chỗ, lễ tân sẽ nói sai mốc quyết định cho khách và CTV. Mục "Cần chú ý" và thông báo cũng sẽ lệch nhau. Hiện chưa sai vì tham số vẫn là 12:00.
- Đề xuất sửa:
  - `hold.paid_overdue_banner`: thay "12:00" bằng `{cap_time}`. FE-B đã có tham số này từ `Me`/tham số cơ sở, hoặc dùng `dueAt` của mục `hold_overdue_cap`.
  - `staff.notif.k.hold_overdue_cap`: PWA không có tham số, nên bỏ giờ khỏi câu, ví dụ "Giữ chỗ còn chờ cọc sau mốc giờ ngày đến – quản lý quyết". Tệp ghi chú giải thích mốc.
  - Nếu UXD và ARC thấy chưa đáng làm ở v1.0.4, ghi một dòng `[GIẢ ĐỊNH]` "trần giữ chỗ giữ 12:00 trong v1.0.4" vào ghi chú khóa. Thêm vào backlog việc đổi sang tham số khi có màn sửa `hold_latest_time_on_arrival`.
- Trạng thái: Open

### FB-R4-PO-UXD-P401-04
- Mức độ: Suggestion
- Vị trí: bảng chữ `rounds/round-04/outputs/UXD/v104-strings-table.md` (trên `v104/uxd-manual-font`) so với `gen_strings.py`.
- Vấn đề: bảng chữ và mã đã lệch nhau ở 3 chỗ:
  - `error.HOLD_EXPIRED_PAID` trong mã thêm `{paid}`;
  - `attention.*` và `notif.*` đã đổi tên;
  - mục 3 của bảng đề xuất sửa `cancel.fee_none`, nhưng mã không sửa. Mã hợp lý vì `cancel.refund_preview` thay hẳn `cancel.fee_none` khi đơn đã có cọc.

  Tệp bảng chữ đang là tài liệu dev và CPY dẫn tới.
- Vì sao quan trọng: dev code theo bảng chữ có thể quên tham số `{paid}`, và câu sẽ hiện "{paid}" thô. FE-B hiện đã truyền đủ `paid` (`v104/fe-holds`, `reservations.ts:210`), nhưng khi `expiredAt` thiếu thì lại truyền `time: ''`, trong khi ghi chú khóa đòi lấy `holdExpiresAt` của đơn.
- Đề xuất sửa: cập nhật bảng chữ theo mã, hoặc ghi một dòng đầu tệp: "nguồn đúng là `gen_strings.py` nhóm v1.0.4 P4-01". UXD nhắc FE-B về `time` khi review PR P4-40.
- Trạng thái: Open

### FB-R4-PO-UXD-P401-05
- Mức độ: Suggestion
- Vị trí: `users.reset_2fa_confirm`: "… người này thêm OTTIMO vào ứng dụng xác thực trên **điện thoại mới**."
- Vấn đề: đặt lại 2 bước không chỉ dùng khi mất điện thoại. Có thể đặt lại vì xóa nhầm ứng dụng xác thực, hoặc vì mã khôi phục bị lộ. Chữ "mới" gợi ý người đó phải đổi máy.
- Vì sao quan trọng: thấp. Nhân viên có thể hỏi lại quản lý.
- Đề xuất sửa: "… thêm lại OTTIMO vào ứng dụng xác thực trên điện thoại của mình." (EN: "… add OTTIMO again to the authenticator app on their phone.")
- Trạng thái: Open

---

## 3. Phạm vi

- Không làm thừa. Nhóm `v1.0.4 PR24PM-01 – guest-web` (`error.ID_NUMBER_DETECTED`) nằm ngoài bảng 3.1, nhưng thuộc điều kiện SEC-on-plan-v1.0.4 mục 4.2 ý 5 và hợp đồng 0.3.12 (i). Đây là một PR một chủ nên đưa luôn vào lượt 1 là đúng. Ghi chú khóa đã nêu "chỉ bật cùng tag với guest-portal của BE-D".
- Nhóm `v1.0.4 P4-50` do UXD đưa vào ở lượt 1, không phải MOB. Cách này đúng plan 2.4, vì lượt 1 chỉ có một chủ. `v104/mob-2fa` không sửa `gen_strings.py`, nên không trùng nhóm.

## 4. Điểm làm tốt
- Mỗi khóa ghi rõ gói, mã lỗi, vai được thấy và lý do sửa chữ. Ví dụ `error.FOLIO_LOCKED` ghi đủ 3 nguồn 409 và tên nút đích. Nhờ vậy CPY và QA tra ngược được.
- Đã bỏ câu sai trong `early_departure.row_refund_help` (BUG-R4-025). Câu mới khớp BR-522 và bản đính chính release notes 04/11.
- Đổi tên khóa theo ARC 0.3.12 mà không đổi chữ. Đúng luật "UXD được đổi chữ, không đổi tên khóa" theo chiều ngược lại.
