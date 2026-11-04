# UXD trả lời review – v1.0.4 P4-01 strings lượt 2 (`v104/uxd-strings`)

- Người trả lời: UXD | Ngày: 05/11/2026 | Round 4 – v1.0.4 – Bước: **Phản hồi & sửa**
- Review được trả lời:
  - `rounds/round-04/reviews/PO-on-v104-p4-01-strings.md` (5 thẻ);
  - `rounds/round-04/reviews/CPY-on-v104-p4-01.md` (10 thẻ);
  - việc UXD tự nhận trong `UXD-on-v104-p4-40.md` (thẻ 03, 05 và mục "việc UXD tự làm"), `UXD-on-v104-p4-31.md` (thẻ 01), `UXD-on-v104-p4-30.md` (thẻ 01), `UXD-on-v104-p4-50.md` (chữ `staff.mfa_enroll_desk`, thẻ 04, 05);
  - ghi chú FE-B (P4-40 @ `d03ede8f`) và ORC qua điều phối: giữ `auth.mfa_later` (PO Major 01 thắng ghi chú "xóa" trong review UXD P4-50).
- Nhánh `v104/uxd-strings`, nền lượt 1 `36f38edd`. Không rebase, không đụng `main`, không mở PR.
- Tệp sửa: `product/design/tools/gen_strings.py` (nguồn), sinh lại bằng `python3 design/tools/gen_strings.py` (3459 chuỗi + 8 mẫu, lượt 1 là 3455): `copy/strings-{vi,en,ru}.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md`. `product/design/content-guide.md` lên v0.4.5.
- Kiểm: chạy lại `gen_strings.py` lần hai không đổi tệp nào (đúng CI `Copy is generated`). Test xanh: `packages/i18n` 22/22, `apps/mobile` 132/132, `apps/guest-web` 73/73, admin-web `i18n-keys` + 7 tệp test có dùng khóa đã sửa 157/157. Quét chuỗi đã đổi: 0 emoji, 0 "!", không có "апартаменты".
- Tệp này không có dữ liệu khách.

## 1. Bảng trả lời thẻ

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R4-PO-UXD-P401-01 | Major | Done | Giữ lại dòng `auth.mfa_later` đúng chỗ cũ (nhóm "R2 Sprint 1 – admin-web EP00"), chữ không đổi. Ghi chú: "CŨ – còn dùng ở `LoginPage.tsx`, MOB xóa ở P4-50 cùng PR bỏ chỗ dùng". Gộp P4-01 trước hay sau P4-50 đều không hiện tên khóa thô |
| FB-R4-PO-UXD-P401-02 | Minor | Done | `content-guide.md` v0.4.5: dòng đổi phiên bản ở đầu tệp và mục 9; mục 3.1 thêm thuật ngữ "Cọc thiếu / Short deposit" (không dùng "thiếu cọc", "cọc chưa đủ", "cọc một phần"); mục 5.2b thêm luật chọn `reauth.s2_failed` / `reauth.s2_failed_password` / câu lỗi ô mật khẩu ngoài S2; mục 2 thêm luật biến cho mốc giờ theo tham số và luật gạch không ngắt; mục 8 dán 4 nhóm v1.0.4 và đồng bộ các dòng cũ đã sửa |
| FB-R4-PO-UXD-P401-03 | Minor | Done | `hold.paid_overdue_banner`: "12:00" → biến **`{cutoff}`**. Không dùng `{time}` vì câu đã có `{time}` = giờ hạn giữ chỗ của đơn (FE-B đang truyền). `{cutoff}` = `rules.holdLatestTime` (tham số `hold_latest_time_on_arrival`, HH:mm). `staff.notif.k.hold_overdue_cap`: payload PWA chỉ có `refCode`, nên bỏ giờ khỏi câu ("sau mốc giờ ngày đến – quản lý quyết") thay vì thêm biến MOB không truyền được |
| FB-R4-PO-UXD-P401-04 | Suggestion | Done (một phần) / Deferred | Nguồn đúng là `gen_strings.py`. Bảng v1.0.4 đã nằm trong `content-guide.md` mục 8, là tài liệu dev và CPY nên dẫn tới. Bảng chữ `v104-strings-table.md` nằm trên `v104/uxd-manual-font`, không sửa trong lượt này vì là nhánh khác. Dòng "nguồn đúng là gen_strings.py" sẽ thêm khi ORC giao lượt cho nhánh đó. FE-B đã được nhắc về `time` ở FB-R4-UXD-FE-P440-02 |
| FB-R4-PO-UXD-P401-05 | Suggestion | Done | Cùng sửa với CPY 01 |
| FB-R4-CPY-UXD-P401-01 | Minor | Done | `users.reset_2fa_confirm` bỏ "điện thoại mới", EN chuyển sang thì tương lai, thêm "their". Cùng lúc làm FB-R4-UXD-FE-P430-01: bỏ câu hỏi đầu và `{name}`, chỉ còn câu hệ quả. Tiêu đề tách thành khóa mới `users.reset_2fa_title` |
| FB-R4-CPY-UXD-P401-02 | Minor | Done | Như PO 03. Tên biến `{cutoff}` theo đề xuất CPY |
| FB-R4-CPY-UXD-P401-03 | Minor | Done (bằng cách giữ khóa) | Giữ `auth.mfa_later` nên thứ tự gộp không còn rủi ro hiện tên khóa thô. MOB: khi xóa khóa ở P4-50, đổi assert `not.toContain(tv('auth.mfa_later'))` sang chữ cố định của câu cũ hoặc kiểm `LoginPage.tsx` không gọi khóa (việc của MOB, ORC chuyển) |
| FB-R4-CPY-UXD-P401-04 | Minor | Done | `lease_rule_paid` và `lease_still_due` cùng cách gọi: "điện nước kỳ cuối, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng" / "the final utilities, unpaid extras (minibar, extra cleaning) and damage". Đối chiếu nguyên văn BR-214 ("điện nước kỳ cuối + minibar/dọn lẻ chưa thu + phí phạt, bồi thường") và BR-313. DOM xem lại ở lượt review kế |
| FB-R4-CPY-UXD-P401-05 | Minor | Done | `error.ID_NUMBER_DETECTED`: EN "There's no need to include an ID number here. Please remove it and send again." · VI "Không cần ghi số giấy tờ ở đây. Vui lòng xóa số đó rồi gửi lại." · RU "Номер документа здесь указывать не нужно. Пожалуйста, удалите его и отправьте снова." Một nghĩa "gửi lại" ở cả 3 ngôn ngữ. Ý SEC giữ nguyên. **SEC cần xem lại câu**, RU cần người bản ngữ đọc lại (rủi ro thấp) |
| FB-R4-CPY-UXD-P401-06 | Suggestion | Done | `attn.hold_overdue` VI "sớm nhất từ", EN "earliest since …, action needed". `attn.hold_overdue_one` EN cũng đổi sang "action needed" cho cùng nhịp |
| FB-R4-CPY-UXD-P401-07 | Suggestion | Done | `reauth.s2_failed_password` EN "That password isn't right. Check it and try again." |
| FB-R4-CPY-UXD-P401-08 | Suggestion | Done | `error.FOLIO_LOCKED` EN "If an amount is still owed, use Collect debt, or ask a manager to Write off debt." · `early_departure.row_refund_help` EN "…for the early departure; a manager must approve it…". VI giữ nguyên |
| FB-R4-CPY-UXD-P401-09 | Suggestion | Done | `checkout.pending_refund_line` EN "(requested in Early departure)" |
| FB-R4-CPY-UXD-P401-10 | Suggestion | Done (chữ khác đề xuất) | Banner rút từ 210 xuống 176 ký tự VI (EN từ 256 xuống 241). Giữ "nên đơn chưa hủy", vì đây là điểm khác với `drawer.hold.expired` mà lễ tân cần thấy. Giữ dạng "Mốc xử lý: {cutoff} {date}." ở cuối thay cho "trước {cutoff}", vì câu vẫn hiện sau mốc (lúc quản lý đã nhận `hold_overdue_cap`), và "trước" khi đó sẽ sai |
| FB-R4-UXD-FE-P440-03 (UXD tự làm) | Minor | Done | Khóa mới `rsv.hold_paid_keep`, tham số `{paid}`, `{required}` (đã kèm đơn vị, câu không thêm "đ"). FE-B đã đồng ý tên khóa. Chữ rõ hơn bản thẻ một chút: "Tới hạn mà chưa đủ cọc thì đơn không tự hủy…" / "If the deadline passes before the rest is paid…". Test FE-B dùng `tv(key)` nên không phải sửa |
| FB-R4-UXD-FE-P440-05 (UXD tự làm) | Suggestion | Done | Ghi chú `hold.paid_overdue_banner` đổi sang "Alert bad" |
| `cancel.fee_none` (P4-40, việc UXD) | – | Done | Giữ chữ. Ghi chú: từ v1.0.4 chỉ hiện cho giữ chỗ chưa nhận cọc, hoặc khi tính thử trả số hoàn 0 (cọc đã đảo, thực nhận 0), nên vế ngoặc vẫn đúng. Bỏ đề xuất mục 3 bảng chữ |
| `fo.tabs.holds` (P4-40, việc UXD) | – | Done | Ghi chú "CŨ từ v1.0.4". Trên `main` khối Hôm nay còn dùng. Sau khi P4-40 gộp thì hết chỗ dùng. Chưa xóa, đợi FE-B rebase và gộp |
| FB-R4-UXD-FE-P431-01 (UXD tự làm) | Suggestion | Done | Khóa mới `early_departure.lease_end_line` "HĐ thuê tháng hết hạn {date}." / "The monthly lease ends on {date}.". Thêm sẵn để FE-A khỏi phải xin khóa muộn. FE-A chưa trả lời, không dùng ở v1.0.4 thì để đó |
| FB-R4-UXD-FE-P430-01 (UXD tự làm) | Minor | Done | Thêm `users.reset_2fa_title` "Đặt lại xác thực 2 bước cho {name}?" / "Reset 2-step verification for {name}?". `users.reset_2fa_confirm` chỉ còn câu hệ quả (xem CPY 01). FE-A đổi `title` sang khóa mới |
| `staff.mfa_enroll_desk` (P4-50) | – | Done | Khóa đã có từ lượt 1, chữ đúng nguyên văn UXD duyệt. Lượt 2 chỉ cập nhật ghi chú vị trí (dòng `li-s` dưới `error.MFA_ENROLLMENT_REQUIRED`, luôn hiện) |
| FB-R4-UXD-MOB-P450-04 (UXD) | Suggestion | Done (ghi chú) | `staff.mfa_network`: ghi chú "MOB không dùng – giữ `common.error_network_body`". Chưa xóa vì `v104/mob-2fa` chưa gộp. Xóa ở lượt dọn khóa nếu không ai dùng |
| FB-R4-UXD-MOB-P450-05 (UXD) | Suggestion | Done | "6-digit" → "6‑digit" (gạch không ngắt U+2011) ở cả 6 chuỗi EN: `auth.totp.help`, `auth.enroll.confirm`, `reauth.s2_help`, `guest.verify.sent_to`, `guest.verify.label`, `ci.door_step1`. Luật ghi vào content-guide mục 2 |
| FB-R4-PO-UXD-IDS2-01 | Minor | Done (nhánh `v104/uxd-id-sheet-v2` @ `f9bfcde7`) | `staff-one-pager.md`, bảng "Cách in và dán": tờ 4 v1 ghi "Thôi dùng, gỡ đúng lúc dán v2"; tờ v2 ghi "dán sau khi deploy v1.0.4, **cùng ngày** OWN đặt `privacy_notice_version` = `privacy-2026-10-v2` (SEC 6.4 ý 5 bước 2–3)"; bỏ mốc 01–02/11, thay bằng "tờ ở quầy cùng phiên bản với tham số Desk". Phần này không in. Dựng lại 4 tờ "Your ID details" ra HTML giống hệt từng byte |
| FB-R4-PO-UXD-IDS2-02 | Suggestion | Deferred (v1.0.5) | Bước so tờ in với `strings-*.json` trong `build_print_sheets.py` để v1.0.5. Trong v1.0.4: QA thêm bước tay "so tờ in với trang khách sau khi gộp `guest-privacy-v2`" vào checklist P4-42 (ORC chuyển QA) |
| FB-R4-SEC-UXD-IDS2-01 | Suggestion | Deferred (v1.0.5) | Cùng việc với PO IDS2-02 |

Ghi chú nhánh tờ in: khi dựng lại, `to-1`, `to-2a-2b`, `to-3` HTML lệch CSS với script từ `82df5fea` (biến `--ru`, lề `.notice`; chỉ kiểu, chữ không đổi). Không commit trong lượt này để giữ phạm vi. Lần in tới chạy lại `build_print_sheets.py --pdf` là khớp.

## 2. Việc cho dev khi rebase lên lượt 2

| Khóa | Đổi gì | Ai làm |
|---|---|---|
| `hold.paid_overdue_banner` | **Tham số mới `{cutoff}`** = `rules.holdLatestTime` (HH:mm). Giữ `time`, `paid`, `required`, `date` như cũ. Thiếu `cutoff` thì câu hiện "{cutoff}" thô | FE-B (P4-40) |
| `rsv.hold_paid_keep` | Khóa mới: `{paid}`, `{required}`. Bỏ khỏi `pending-keys-p4-40.json` | FE-B (P4-40) |
| `staff.notif.k.hold_overdue_cap` | Bỏ giờ khỏi câu, vẫn không tham số | MOB: không phải sửa mã |
| `users.reset_2fa_title` | Khóa mới, `{name}`. Dùng làm `title` hộp Đặt lại 2 bước | FE-A (P4-30) |
| `users.reset_2fa_confirm` | Không còn `{name}` trong câu (truyền thừa không sao) | FE-A: không bắt buộc sửa |
| `early_departure.lease_end_line` | Khóa mới, `{date}` = `leaseEndDate` dd/mm/yyyy. Tùy FE-A dùng | FE-A (P4-31) |
| `auth.mfa_later` | Giữ. MOB xóa dòng này trong `gen_strings.py` ở P4-50, cùng PR bỏ chỗ dùng | MOB (P4-50) |
| `attn.hold_overdue_cap` | Không đổi: `{time}` = giờ của `dueAt` | – |

Không có khóa đổi tên. Không có ESC mới.
