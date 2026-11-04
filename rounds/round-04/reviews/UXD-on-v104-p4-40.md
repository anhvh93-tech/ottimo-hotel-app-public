# UXD review – v1.0.4 P4-40: Desk giữ chỗ (BUG-R3-042/043/044/046/047, ĐX-R3-QA-01) phần "Ngay" (FE-B)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-holds` (`origin/main` @ `7b5b6117`, nhánh @ `5539b7e6`). Các tệp:
  - `app/attention.ts`, `app/reservations.ts` (`HOLD_KEYS`, `rsvErrorText`, `toLocalInput`/`fromLocalInput`);
  - `pages/TodayPage.tsx`;
  - `pages/reservations/ReservationDialogs.tsx` (`DepositDialog`, `CancelDialog`), `pages/reservations/ReservationDrawer.tsx`.
  - Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-fe-holds.md` và test `v104-holds-feb.test.tsx`.
- Đối chiếu:
  - brand guideline (`00-brief/context/brand/brand-guidelines.md`);
  - bảng chữ UXD `v104-strings-table.md` mục P4-40;
  - `gen_strings.py` trên `origin/v104/uxd-strings` @ `36f38edd` (P4-01 lượt 1);
  - **ARC `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md` mục 2.5** (quy ước tên khóa);
  - OpenAPI 0.3.12 `AttentionItem.kind` `hold_overdue`/`hold_overdue_cap`; BR-303; DOM A.3–A.6.
- Ảnh: không chụp. Trước P4-01 các chỗ mới hiện tên khóa (FE ghi ở báo cáo mục 4). Đọc mã và test (dữ liệu giả), không dùng dữ liệu thật.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Phần lớn đúng thiết kế:
- Ô **Giờ nhận tiền** chỉ cho FD+, mặc định bây giờ theo giờ khách sạn, chặn giờ tương lai bằng lỗi ngay tại ô.
- Ô **Chấp nhận cọc thiếu** chỉ cho OWN/MGR. Ô lý do bắt buộc.
- Hold có cọc quá hạn không còn câu "đơn đã tự hủy".
- Hộp hủy giữ chỗ có cọc nói số sẽ hoàn trước khi bấm.
- Lý do **Khác** chưa đủ 3 ký tự thì không gọi tính thử. Hộp nói lý do khóa nút, và nút có `confirmHelpId`.
- Link check-in online chỉ hiện cho đơn `confirmed`.
- Brand đạt. Chỉ dùng `Field`, `Checkbox`, `Alert`, `li-s`, `card` của DS. Không màu tự đặt, không `style=`.

Điều kiện để ĐẠT:
1. **Thẻ 01 (Major).** Đổi sang tên khóa ARC chốt (`attn.hold_overdue`, `attn.hold_overdue_cap`). Chọn biến thể `_one` khi chỉ có 1 đơn. Đưa khóa vào mã dạng literal, kèm `pending-keys-p4-40.json`, để test khóa chữ bắt được khóa sai.
2. Thẻ 02–04 (Minor) làm cùng lượt rebase giai đoạn B, vì cùng tệp.
3. UXD xem ảnh 1366/1440 VI + EN sau khi rebase lên P4-01: hộp Xác nhận cọc (quản lý, cọc thiếu), khung đơn hold có cọc quá hạn, hộp hủy, Hôm nay.

Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | **Major** | "Cần chú ý" dùng khóa `attention.hold_overdue*`. ARC 2.5 đã đổi thành `attn.*`, và P4-01 chỉ có `attn.*`. `HOLD_KEYS` cũng che khóa khỏi test khóa literal. Gộp như hiện tại thì Desk hiện chữ `attention.hold_overdue` cho lễ tân |
| 02 | Minor | `error.HOLD_EXPIRED_PAID` để `{time}` trống khi Problem không có `expiredAt`. Bảng chữ yêu cầu lấy `hold.expiresAt` của đơn |
| 03 | Minor | Hold có cọc **chưa** quá hạn: khung đếm giờ mất dòng giải thích, chỉ còn tiêu đề. Lễ tân không biết tới hạn thì chuyện gì xảy ra |
| 04 | Minor | Hộp hủy hiện số hoàn trước khi có bản tính thử, và dùng `\|\|`. Nếu tính thử trả 0, hộp vẫn hiện số đã nhận |
| 05 | Suggestion | Khung hold có cọc quá hạn dùng tông `bad`. Bảng chữ UXD ghi `warn`. UXD đồng ý giữ `bad` |

## Duyệt chữ theo khóa (so với `origin/v104/uxd-strings` @ `36f38edd`)

| Khóa trong mã | Có ở P4-01 | Tham số FE truyền | Kết quả |
|---|---|---|---|
| `deposit.received_at`, `deposit.received_at_help` | Có | – | Đúng |
| `deposit.accept_shortfall`, `deposit.accept_shortfall_reason` | Có | – | Đúng. Lỗi dùng `field_error.reason_required` có sẵn |
| `hold.paid_overdue_banner` | Có | `time`, `paid`, `required`, `date` | Đúng |
| `error.HOLD_EXPIRED_PAID` | Có | `time`, `paid` | Đúng tên. Thiếu đường lùi cho `time`: thẻ 02 |
| `cancel.refund_preview` | Có | `amount` | Đúng tên. Nguồn số: thẻ 04 |
| `today.holds_waiting` | Có | `n` | Đúng |
| `attention.hold_overdue` | **Không**: P4-01 là `attn.hold_overdue` + `attn.hold_overdue_one` | `n`, `code`, `time`, `date` | **Sai tên**: thẻ 01 |
| `attention.hold_overdue_cap` | **Không**: P4-01 là `attn.hold_overdue_cap` + `attn.hold_overdue_cap_one` | `n`, `code`, `time` | **Sai tên**: thẻ 01 |
| `field.DATE_INVALID` (giờ tương lai) | Có sẵn trên `main` | – | Đúng |
| `staff.notif.k.hold_*` | Có | – | Desk không dùng, vì Desk không có hộp Thông báo. FE-B đúng, MOB làm |

Việc của UXD rút ra từ gói này. Ghi để ORC biết, UXD tự làm ở P4-01 lượt 2:
- `cancel.fee_none`: **giữ** chữ "Không thu phí (giữ chỗ chưa cọc)". Từ gói này Desk chỉ hiện câu đó cho hold chưa cọc, nên vế trong ngoặc đúng. Mục 3 của bảng chữ (bỏ vế ngoặc) không cần làm nữa.
- `fo.tabs.holds` không còn chỗ nào dùng trong `apps/`. Lượt 2 sẽ ghi "không dùng" vào ghi chú khóa, chưa xóa, đợi FE-B rebase xong.
- Thẻ 03 cần một khóa mới. UXD thêm ở lượt 2 nếu FE-B đồng ý.

## Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| Brand | Đạt. Ô giờ dùng `input num` (số canh đều). Không có chữ khách nhìn thấy trong gói |
| Khóa chữ | 8/10 khóa đúng tên. 2 khóa "Cần chú ý" sai tên (thẻ 01) |
| Trạng thái | Hộp hủy: tải (`cancel.preview_loading`), lỗi tính thử (`Alert` warn), thiếu lý do (`field_error.reason_required` trong dòng `role="status"`). Hộp cọc: lỗi tại ô giờ, lỗi tại ô lý do. Hôm nay: khối chỉ hiện khi có đơn (giữ như cũ). Thiếu: thẻ 03 (hold có cọc trước hạn), thẻ 04 (số hoàn khi chưa có tính thử) |
| A11y | Ô giờ và ô lý do nằm trong `Field`, có nhãn gắn với ô. Ô lý do có `required`. Khung hold quá hạn có `role="status"`. Nút hủy bị khóa có `confirmHelpId` trỏ tới câu giải thích. `datetime-local` có `max`, nên bộ chọn của trình duyệt cũng không cho chọn giờ tương lai |
| 1440 | Hộp Xác nhận cọc thêm tối đa 3 khối (ô giờ, ô chọn, ô lý do). Tất cả nằm trong cột của `Modal`, không tràn |
| 390 | `datetime-local` mở bộ chọn của máy, rộng 100% theo `.input`. Câu `deposit.received_at_help` (VI khoảng 160 ký tự) xuống 4 dòng dưới ô. Câu `hold.paid_overdue_banner` (VI khoảng 210 ký tự) xuống 6–7 dòng trong khung đơn. Dài nhưng không vỡ. Không có bảng hay cột cố định mới |

---

### FB-R4-UXD-FE-P440-01
- Mức độ: Major
- Vị trí:
  - `product/apps/admin-web/src/app/reservations.ts` dòng 35–36 (`attnHoldOverdue: 'attention.hold_overdue'`, `attnHoldOverdueCap: 'attention.hold_overdue_cap'`);
  - `product/apps/admin-web/src/app/attention.ts` dòng 156–170 (`case 'hold_overdue'`, `case 'hold_overdue_cap'`);
  - `src/__tests__/v104-holds-feb.test.tsx` dòng 427 (`it.todo`).
- Vấn đề:
  1. ARC 0.3.12 mục 2.5 đã chốt tên `attn.hold_overdue` và `attn.hold_overdue_cap`, kèm câu "trước đó dùng tên chốt trong mã". P4-01 lượt 1 (`uxd-strings` @ `36f38edd`) chỉ có tên `attn.*`, không có `attention.*`. Sau khi rebase, `t('attention.hold_overdue')` trả về chính tên khóa. Mục đỏ "Cần chú ý" sẽ hiện chữ `attention.hold_overdue` cho lễ tân.
  2. Khóa nằm trong hằng `HOLD_KEYS`, không viết thẳng trong `t('…')`. Vì vậy test "mọi khóa literal có trong VI/EN" (`i18n-keys.test.ts`) không bắt được khóa sai, kể cả sau rebase. Chỉ còn `it.todo` nhắc việc, mà `it.todo` không bao giờ đỏ.
  3. P4-01 có thêm `attn.hold_overdue_one` / `attn.hold_overdue_cap_one` cho ca 1 đơn (có `refCode`). Đây là mẫu mà `attention.ts` đang dùng cho `dq_stay_not_closed`, `website_request_new`. Câu nhiều đơn "Giữ chỗ quá hạn: 1 đơn – cũ nhất từ …" đọc gượng khi chỉ có một đơn, và lễ tân không thấy mã đơn.
- Vì sao quan trọng: đây là mục "Cần chú ý" mức `critical` mà ĐX-R3-QA-01 thêm vào để lễ tân không bỏ sót hold có cọc. Nếu mục này hiện tên khóa, lễ tân không đọc được, đúng ở ca cần xử lý ngay. Test hiện tại không chặn được lỗi, nên lỗi sẽ tới QA hoặc tới tay người dùng.
- Đề xuất sửa:
  - `attention.ts`: bỏ ghi đè `key = HOLD_KEYS.attn…`, dùng mặc định `attn.${kind}` như ARC 2.5 yêu cầu. Thêm nhánh `_one`, giống `dq_stay_not_closed`:
    - `hold_overdue`: `key = n === 1 && code ? 'attn.hold_overdue_one' : 'attn.hold_overdue'`, `args = { n, code, time, date }`;
    - `hold_overdue_cap`: `key = n === 1 && code ? 'attn.hold_overdue_cap_one' : 'attn.hold_overdue_cap'`, `args = { n, code, time }`. `{time}` = giờ của `dueAt` (mốc 12:00).
  - Viết mọi khóa P4-40 thẳng trong `t('…')`. Bỏ `HOLD_KEYS`, hoặc chỉ giữ làm chú thích. Làm theo cách của FE-A: tệp `src/__tests__/pending-keys-p4-40.json` liệt kê các khóa chờ P4-01. Cơ chế này đã có trên `v104/fe-money-labels` và `v104/fe-users-2fa`, gộp không xung đột. Khi P4-01 gộp, test thứ hai sẽ đỏ để nhắc xóa danh sách.
  - Test: thêm 2 ca 1 đơn / nhiều đơn cho mỗi kind, so bằng `tv('attn.hold_overdue_one', …)`.
- Trạng thái: Open

### FB-R4-UXD-FE-P440-02
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/app/reservations.ts` dòng 210–213 (`rsvErrorText`, nhánh `HOLD_EXPIRED` có cọc)
- Vấn đề: khi Problem không có `expiredAt`, mã truyền `time: ''`. Câu thành "Giữ chỗ đã quá hạn lúc , nhưng đã nhận 500.000 đ …". Bảng chữ UXD và ghi chú khóa ghi rõ: "{time} từ Problem.expiredAt – thiếu thì FE-B lấy holdExpiresAt của đơn (không để trống)". Vì vậy UXD không làm bản `_notime` cho khóa này.
- Vì sao quan trọng: câu báo lỗi có chỗ trống trông như lỗi phần mềm, đúng lúc lễ tân đang lo vì đơn quá hạn.
- Đề xuất sửa: thêm `holdExpiresAt?: string` vào `RsvErrorContext`. `useAction` truyền `base.reservation.hold?.expiresAt`, cùng chỗ với `holdPaidVnd`. Trong nhánh có cọc: `time = p.expiredAt ?? ctx.holdExpiresAt`, định dạng bằng `formatInstant`. Thêm một ca test Problem không có `expiredAt`.
- Trạng thái: Open

### FB-R4-UXD-FE-P440-03
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/reservations/ReservationDrawer.tsx` dòng 490 (`{holdPaid > 0 ? null : t('rsv.hold_auto')}`)
- Vấn đề: FE bỏ đúng câu `rsv.hold_auto` ("Quá hạn chưa cọc → hệ thống tự hủy và mở bán lại căn") với hold đã có cọc. Nhưng khung không có câu nào thay vào, chỉ còn tiêu đề "Còn x giờ – hết hạn lúc …". Lễ tân thấy đồng hồ đếm ngược mà không biết tới hạn thì đơn có bị hủy không. Đây đúng là câu khách hay hỏi ("tôi đã chuyển một phần rồi, có mất phòng không?").
- Vì sao quan trọng: thiếu trạng thái giải thích cho một ca mà BR-303 xử lý khác hẳn ca chưa cọc. Câu "đã nhận/còn thiếu" chỉ hiện sau hạn, tức là quá muộn để báo khách trước.
- Đề xuất sửa: UXD thêm khóa ở P4-01 lượt 2, FE-B dùng khi `holdPaid > 0` và chưa quá hạn:
  - `rsv.hold_paid_keep`
  - VI: "Đã nhận {paid}/{required}. Quá hạn đơn không tự hủy, căn vẫn giữ – thu nốt cọc hoặc nhờ quản lý chấp nhận cọc thiếu."
  - EN: "{paid} of {required} received. If the deadline passes, the booking is not cancelled and the room stays held – collect the rest or ask a manager to accept the short deposit."
  - Tham số giống `hold.paid_overdue_banner`. FE-B báo UXD đồng ý tên khóa trước khi rebase. Trong lúc chờ khóa, giữ `null` như hiện tại.
- Trạng thái: Open

### FB-R4-UXD-FE-P440-04
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` dòng 262–264 (`holdRefund = quote?.refundRequestVnd || quote?.refundableVnd || (r.depositPaidVnd ?? 0)`) và dòng 370
- Vấn đề:
  1. Trước khi có bản tính thử (`quote` chưa về, hoặc tính thử lỗi), hộp đã hiện "Sẽ tạo yêu cầu hoàn {số đã nhận}". Cùng lúc, dòng dưới hiện "Đang tính phí hủy…". Hai câu nói ngược nhau: một câu đã có số, câu kia nói đang tính.
  2. `||` coi 0 là "không có". Nếu tính thử trả `refundRequestVnd = 0` thật, ví dụ khoản cọc đã bị đảo, hộp vẫn hiện số đã nhận.
- Vì sao quan trọng: đây là số tiền mà lễ tân có thể đọc cho khách. Máy chủ vẫn tính đúng khi hủy, nên không sai tiền thật, nhưng màn hình nói một số khác với số sẽ tạo.
- Đề xuất sửa:
  - Chỉ hiện `cancel.refund_preview` khi `quoteCurrent`. Lấy số bằng `quote.refundRequestVnd ?? quote.refundableVnd`.
  - Chưa có tính thử thì giữ dòng `cancel.preview_loading` đang có. Tính thử lỗi thì giữ `Alert` warn đang có, không hiện số.
  - Hold có cọc mà tính thử trả 0: hiện `cancel.fee_none`.
  - Sửa ca test tương ứng.
- Trạng thái: Open

### FB-R4-UXD-FE-P440-05
- Mức độ: Suggestion
- Vị trí: `ReservationDrawer.tsx` dòng 494–502 (`<Alert tone="bad" icon="hourglass" role="status">` của `hold.paid_overdue_banner`)
- Vấn đề: bảng chữ UXD ghi khung này là "Alert warn". FE-B dùng `bad`.
- Vì sao quan trọng: nhỏ. UXD xét lại và **đồng ý với `bad`**, vì ba lý do. Khung đếm giờ trước hạn đã chuyển `bad` khi còn dưới `holdWarnHours`, nên sau hạn mà về `warn` thì như hạ mức. Mục "Cần chú ý" cùng ca là `critical`. Ca này cần xử lý trong ngày.
- Đề xuất sửa: giữ `tone="bad"`. UXD sửa ghi chú khóa `hold.paid_overdue_banner` ở P4-01 lượt 2 ("Alert bad"). FE không cần làm gì.
- Trạng thái: Open

## Điểm nên giữ
- Ô **Giờ nhận tiền** chỉ gửi `receivedAt` khi người dùng đã sửa giờ. Không sửa thì máy chủ lấy giờ hiện tại. Giờ đọc và ghi theo giờ khách sạn, không theo giờ trình duyệt. Đúng tinh thần US-085 AC4 và SEC-BE-22.
- Lý do **Khác** của hộp hủy: chưa đủ 3 ký tự thì không gọi máy chủ, và câu giải thích được gắn vào nút bị khóa. Không còn 422 rồi mới báo.
- Hai kind mới không có nút "Đã xử lý", kể cả khi máy chủ gửi dạng `event`. Đúng AC: mục chỉ mất khi đơn rời trạng thái `hold`.
