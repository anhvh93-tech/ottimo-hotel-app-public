# UXD review giữa Sprint 4 – chữ và bố cục FE/MOB (Round 2, Sprint 4)

- Người review: UXD | Tác giả: FE (FE-A, FE-B – admin-web), MOB (PWA, guest-web) | Ngày: 17/10/2026 | Bước: Review chéo giữa sprint (UXD → FE, UXD → MOB – bắt buộc)
- Căn cứ: Brand Guidelines v1.0 (CLAUDE.md "Thương hiệu OTTIMO", `00-brief/context/brand/brand-guidelines.md`), `product/design/content-guide.md` v0.4, Design System **v0.4.1** (C1, C7, C11, C15, C16, C25, 4.1, 6.1, 6.3, 6.16, mục 7), OpenAPI 0.3.7 (`openapi.yaml` – bổ sung 1 của `checkIn`, enum `declinedReasonCode`), báo cáo `rounds/round-02/outputs/FE/s4-report.md` (FE-A, FE-B), `outputs/BE/s4-be-d.md`.
- Phạm vi:
  1. Chuỗi mới trong `product/design/tools/gen_strings.py`: FE-A tiền (60), FE-B vận hành (41), MOB PWA (26), MOB guest-web (10 → 9 sau khi gộp khóa trùng), và theo yêu cầu thêm của ORC: FE-A đợt 2 (39), FE-B Desk mục 5 (143 khóa có trong nhóm lúc duyệt, 17/10 tối), MOB đợt 2 (20 – chuông thông báo PWA, ảnh phiếu, ngôn ngữ phiên khách), `guest.req.auto_reply`, lý do từ chối theo enum 0.3.7.
  2. Bố cục 3 hộp FE-A làm khi chưa có hi-fi: `pages/reservations/MovePreviewBox.tsx` (trong `MoveDialog`), `pages/stay/CheckInPayment.tsx` (trong `CheckInPage` bước 4), `pages/reservations/ServiceLines.tsx` (trong `CancelDialog`, `NoShowDialog`).
  3. Giả định FE-A, FE-B (và MOB) cần UXD duyệt – mục C.
- Cách kiểm: đọc mã 3 hộp + màn chứa; **chạy admin-web bằng mock** (`vite --port 5181`, không đụng stack demo) và chụp bằng Chromium headless của repo (script tạm ở scratchpad, không thêm vào repo), qa.fd, 1280×1000, sáng: hộp đổi căn OTM-0159 402 → 202; hộp Hủy đơn OTM-0159 có 3 dòng dịch vụ (đưa đón sân bay, bữa sáng, giặt ủi) bơm vào folio mock; H13 bước 4 của đơn 302 "Gia đình anh Hưng". Chưa đo: chế độ tối, 375px, trình đọc màn hình thật.
- UXD đã sửa trong vùng design (không sửa mã app):
  - `gen_strings.py`: duyệt 8 nhóm (338 chuỗi), **sửa 54 chuỗi**, thêm nhóm "UXD bổ sung giữa sprint" (**11 chuỗi**), gộp khóa trùng `guest.oci.done_title`, đánh dấu "CŨ" 7 khóa lệch mã hợp đồng; sinh lại `copy/strings-{vi,en,ru}.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md`; dán bảng vào `content-guide.md` mục 8 (2724 chuỗi + 8 mẫu, 0 khóa trùng, tham số VI ↔ EN ↔ RU 0 lệch).
  - `hifi/assets/hifi.css`: `.sum th` (tiêu đề cột cho bảng `.sum` có thead), cách cột 12px, cột số canh phải + không xuống dòng giữa số – bảng tính thử đổi căn nhận ngay, FE không phải sửa (DS 0.4.1a).
  - Hi-fi H18 (lời xong thủ tục bỏ "!"), H23 (trả lời tự động = `guest.req.auto_reply`; ví dụ lý do từ chối dùng mã 0.3.7).
- Kiểm sau khi sửa (lần chạy cuối 17/10 20:05, cây làm việc chung): `check_hifi.py` 25/25 ✓; admin-web **294/294**; guest-web **63/63**; mobile **61/61**; `@ottimo/i18n` **19/19**. Các lần chạy giữa chừng có ca đỏ do FE-B/MOB đang sửa cùng lúc (test phiếu in lại, khóa `staff.notif.*` chưa có, ô chọn ngôn ngữ guest-web) – lần cuối đã xanh, không ca nào do chuỗi UXD.
- **Tổng thẻ: 1 Blocker · 1 Major · 16 Minor · 2 Suggestion** (FE: 1 Blocker · 1 Major · 15 Minor · 2 Suggestion; MOB: 1 Minor).

---

## A. FE-A – bố cục 3 hộp (chưa có hi-fi)

### FB-R2-UXD-FE-S4-01
- Mức độ: Blocker
- Vị trí: `pages/stay/CheckInPayment.tsx:26–28` (`inlinePayReady`), `:207–223` (tiền mặt); `pages/stay/CheckInPage.tsx:223–227` (`payInline`, `balanceCovered`), `:287–295` (thân `checkIn.payment`)
- Vấn đề: Chọn Tiền mặt, nhập "Tiền khách đưa" **ít hơn** số cần thu → màn chỉ hiện dòng `pay.cash_short` ("Khách đưa thiếu 1.968.000 đ."), nút "Nhận phòng căn 302" vẫn bật, hộp xác nhận ghi "Ghi khoản thu 2.468.000 đ – Tiền mặt" và B9 gửi `payment.amountVnd = due`. Đã dựng lại trên mock: đơn 302, cần thu 2.468.000, khách đưa 500.000 → nút không có `aria-disabled`, hộp xác nhận mở với khoản thu 2.468.000 tiền mặt.
- Vì sao quan trọng: Folio ghi đã thu đủ tiền mặt trong khi két chỉ nhận 500.000 → lệch két khi đóng ca, khách đi mà còn nợ không ai biết. Sai tiền.
- Đề xuất sửa: `inlinePayReady` trả `false` khi `method = cash`, ô "Tiền khách đưa" có số và nhỏ hơn số cần thu (ô để trống = khách đưa đủ, giữ như cũ); khi đó `whyLocked` = `ci.submit_cash_short` (UXD đã thêm: "Khách đưa thiếu {amount}. Nhận đủ tiền hoặc chọn cách thu khác để nhận phòng."), đặt cạnh nút + `aria-describedby`; bỏ dòng `pay.cash_short` riêng (câu lý do đã nói). Thêm ca test: đưa thiếu → nút khóa, không gọi B9; đưa đủ/đưa thừa → tiền thối như cũ.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-02
- Mức độ: Major
- Vị trí: `pages/stay/CheckInPage.tsx:206` (`requestOnly`), `:223–227`, `:236–241` (`whyLocked`); `pages/stay/CheckInPayment.tsx:205–268`; OpenAPI 0.3.7 `checkIn` "bổ sung 1 (FE-A s4 mục 4 – ARC chốt)"
- Vấn đề: Lễ tân (FD) + buồng chưa sẵn sàng + đã ghi lý do → nút thành "Gửi lễ tân trưởng duyệt" (202). Nhưng (1) `payInline = !requestOnly && …` nên `balanceCovered = false` → điều kiện `balance_paid` vẫn chặn, nút khóa với lý do "Thu {amount} ở mục Thu tiền trước khi nhận phòng"; chọn tiền mặt/chuyển khoản/POS cũng không mở được – chỉ VietQR (thu trước) gỡ được; (2) mục Thu tiền vẫn hiện 4 cách thu và câu `ci.pay_inline` "Khoản thu … được ghi cùng lúc với nhận phòng" – sai, vì nhánh 202 không ghi khoản thu (ARC: gửi `payment` ở nhánh này → 422). Theo đọc mã; chưa dựng lại trên mock.
- Vì sao quan trọng: Khách trả tiền mặt tại quầy khi phòng chưa dọn xong → lễ tân không gửi được yêu cầu cho lễ tân trưởng, kẹt luồng; câu trên màn hứa ghi tiền mà không ghi.
- Đề xuất sửa: Khi `requestOnly`: không tính `balance_paid` vào `blocking` (tiền thu ở lần gọi B9 sau khi được duyệt – ARC (a)); truyền `requestOnly` vào `CheckInPayment` → chỉ còn lựa chọn VietQR (thu trước, ARC (b)), thay `ci.pay_inline` bằng `ci.pay_after_lead` (UXD đã thêm: "Đang gửi yêu cầu lễ tân trưởng duyệt nên chưa ghi khoản thu. Thu {amount} khi nhận phòng sau khi được duyệt, hoặc thu trước bằng VietQR."); hộp xác nhận/"Kết quả" không có dòng `ci.effect_pay`. Thêm ca test FD + phòng chưa sẵn sàng + còn phải thu > 0 → gửi được yêu cầu, thân B9 không có `payment`.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-03
- Mức độ: Minor
- Vị trí: `MovePreviewBox.tsx:47–53, 80, 100, 107, 113, 124, 129, 135`; `CheckInPayment.tsx:125–147`; `pages/stay/FolioDialog.tsx:153` (FE-A đợt 2)
- Vấn đề: Mọi ô số trong bảng `.sum` dùng `money()` (có "đ"). Content-guide mục 4 và các bảng đã duyệt (H16 `CheckOutPage.tsx:409–432`, drawer `ReservationDrawer.tsx:543`) dùng số trần `vnd()` ở dòng, `money()` ở dòng tổng. Ảnh chụp: dòng "Tiền phòng 3.000.000 đ → 2.614.000 đ" xuống hai dòng trong hộp 480px (trước khi UXD thêm `white-space:nowrap` cho `.sum td.r`).
- Vì sao quan trọng: Lễ tân đọc dọc cột số để báo khách; "đ" lặp mỗi ô làm cột rộng, dễ xuống dòng khi EN ("1,000,000 VND"), lệch các bảng tiền khác của Desk.
- Đề xuất sửa: Dòng thường `vnd()`, dòng `total` `money()`; số có dấu đặt dấu trước ("−386.000"). Tiêu đề cột UXD đã thêm đơn vị: `move.col_old` "Giá cũ (đ)", `move.col_new` "Giá mới (đ)", `folio.col_amount` "Thành tiền (đ)" – tới khi FE sửa, ô sẽ có "đ" hai lần (tạm).
- Trạng thái: Open

### FB-R2-UXD-FE-S4-04
- Mức độ: Minor
- Vị trí: `MovePreviewBox.tsx:116–125` (dòng chênh lệch), `:140–143` (`move.pending_foc`, `MANUAL_RATE_REPRICED`)
- Vấn đề: Cảnh báo "Có đêm đang là giá sửa tay hoặc giá thỏa thuận – nay tính theo giá căn mới" và câu FOC chờ duyệt nằm **sau** cả bảng (sau dòng còn phải thu), ngay trên ô tick "Đã báo khách số tiền mới". Lễ tân đọc số cho khách trước khi thấy cảnh báo làm thay đổi cách hiểu số đó. Dòng chênh lệch hiện số tuyệt đối không dấu.
- Vì sao quan trọng: DS 6.3 / BR-414: số báo khách phải là số đúng, đã kèm điều kiện; khách thỏa thuận giá riêng có thể mất ưu đãi mà không được báo.
- Đề xuất sửa: Thứ tự trong hộp: tiêu đề → câu cơ sở giá → **Alert `MANUAL_RATE_REPRICED`** → bảng theo đêm → bảng tổng (dòng `total` = chênh lệch, có dấu "+1.050.000 đ" / "−386.000 đ", nhãn giữ `move.delta_up/down`) → ngay dưới dòng chênh lệch là `move.pending_foc` (dòng `tr.sub` colSpan 2) → cọc đã thu, còn phải thu khi nhận phòng. Ô tick giữ ngay dưới hộp như hiện nay (đúng).
- Trạng thái: Open

### FB-R2-UXD-FE-S4-05
- Mức độ: Minor
- Vị trí: `MovePreviewBox.tsx:46` (cột Đêm), `:52–60` (ô Giá mới)
- Vấn đề: (đơn OTA) ô "Giá mới" ghép "792.000 đ + 300.000 đ" – số thứ hai không có nhãn, dễ hiểu nhầm là tổng hoặc giá căn; cột Đêm chỉ "22/10", content-guide mục 4 quy định ngày trên Desk có thứ ("T5 22/10").
- Vì sao quan trọng: Lễ tân giải thích chênh lệch đổi căn OTA (BR-424) cho khách từng đêm; cuối tuần/ngày thường giá khác nhau nên cần thứ.
- Đề xuất sửa: Ô giá mới chỉ một số; nếu có `roomChangeDifferenceVnd` thêm dòng phụ `.li-s` `move.night_ota_diff` ("+300.000 đ chênh lệch đổi căn", UXD đã thêm) cùng chỗ với `move.suggested`. Cột Đêm dùng định dạng ngày có thứ của Desk.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-06
- Mức độ: Minor
- Vị trí: `MovePreviewBox.tsx:30–65`; `MoveDialog` (`ReservationDialogs.tsx:821…`, `Modal size="sm"`)
- Vấn đề: Ảnh chụp: đơn 3 đêm, hộp thoại đã cao 857px trong khung 1000px. Đơn 7–30 đêm (dài ngày, thuê tháng) → bảng theo đêm dài, ô tick và nút Lưu bị đẩy xa, phải cuộn qua 30 dòng để thấy số cần báo.
- Vì sao quan trọng: Số cần báo khách (chênh lệch, còn phải thu) phải luôn thấy được cùng ô tick.
- Đề xuất sửa: Giữ `sm` (480px – vừa sau khi UXD sửa `.sum`). Khi > 7 đêm: bảng theo đêm gói trong `<details>` với `summary` = `move.nights_toggle` ("Xem giá từng đêm ({n} đêm)", UXD đã thêm), mặc định đóng; bảng tổng luôn hiện. ≤ 7 đêm hiện thẳng như nay.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-07
- Mức độ: Minor
- Vị trí: `MovePreviewBox.tsx:27–28`
- Vấn đề: Tiêu đề hộp là `<b>`, vùng dùng `aria-label` lặp chữ. DS (hi-fi H11 11.2 "Folio") dùng `h3.label-h` cho tiêu đề khối trong drawer/hộp.
- Vì sao quan trọng: Người dùng trình đọc màn hình nhảy theo tiêu đề không tìm thấy khối tính thử; kiểu chữ lệch các khối khác.
- Đề xuất sửa: `<h3 className="label-h" id=…>` + `aria-labelledby` cho `section` (tên vùng giữ nguyên – test `findByRole('region', { name })` vẫn chạy).
- Trạng thái: Open

### FB-R2-UXD-FE-S4-08
- Mức độ: Minor
- Vị trí: `ReservationDialogs.tsx:883` (`setPreview(null)` mỗi lần đổi đầu vào), `:1141–1170`
- Vấn đề: Mỗi lần đổi căn/ngày/lý do, hộp tính thử biến mất, hiện "Đang tính thử…", rồi hiện lại – hộp thoại co giãn 300–400px, nút Lưu nhảy chỗ (đã thấy khi chụp: đổi căn 202 → 203).
- Vì sao quan trọng: Giật bố cục làm mất chỗ đang đọc; dễ bấm nhầm khi nút nhảy (DS 4: skeleton chỉ khi tải > 300ms, không dựng lại cả khối).
- Đề xuất sửa: Giữ bản tính thử cũ, làm mờ (`opacity .5`, `aria-busy="true"`) và đặt "Đang tính thử…" (`role="status"`) trên đầu hộp cho tới khi bản mới về; nút Lưu vẫn khóa vì `current = false`, ô tick vẫn bị bỏ như hiện nay.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-09
- Mức độ: Minor
- Vị trí: `CheckInPage.tsx:788` (`ci.recon_ok` dưới mục Thu tiền); `CheckInPayment.tsx:257–262` (`rsv.reconcile_note`)
- Vấn đề: Câu "Chuyển khoản ghi tay mang cờ 'Chờ đối soát' nhưng vẫn tính là đã thu – nhận phòng được." hiện dưới **mọi** cách thu (VietQR, tiền mặt – xem ảnh). Khi chọn Chuyển khoản lại có thêm chip + `rsv.reconcile_note` – hai câu cùng nói chuyện đối soát.
- Vì sao quan trọng: Chữ thừa trên màn đông nhất của lễ tân; câu không liên quan làm loãng câu quan trọng (`ci.pay_inline`).
- Đề xuất sửa: Chỉ hiện `ci.recon_ok` khi `method = bank_transfer`, đặt sau chip "Chờ đối soát"; bỏ `rsv.reconcile_note` ở màn này (giữ ở drawer).
- Trạng thái: Open

### FB-R2-UXD-FE-S4-10
- Mức độ: Minor
- Vị trí: `CheckInPayment.tsx:272`
- Vấn đề: Chip "Đã thanh toán đủ" (`tone="ok"`) không có icon.
- Vì sao quan trọng: DS C7/D4: chip luôn icon + chữ; người mù màu phân biệt bằng hình.
- Đề xuất sửa: `<Chip tone="ok" icon="check">`.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-11
- Mức độ: Minor
- Vị trí: `CheckInPayment.tsx:164`
- Vấn đề: Khối VietQR là `div.card` nằm trong `section.card` của mục Thu tiền → hai lớp viền và bóng lồng nhau.
- Vì sao quan trọng: DS 4.1: khối con trong thẻ dùng `.card.inset`; thẻ lồng thẻ làm màn rối, lệch H16 (PaymentPanel).
- Đề xuất sửa: `className="card inset stack"`.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-12
- Mức độ: Suggestion
- Vị trí: `CheckInPayment.tsx:121–150`
- Vấn đề: Không nhận sớm, không đêm thêm, không FOC → bảng có hai dòng cùng số: "Còn phải thu hiện tại 2.468.000 đ" và "Cần thu để nhận phòng 2.468.000 đ" (ảnh chụp).
- Vì sao quan trọng: Lặp số làm lễ tân tưởng có hai khoản.
- Đề xuất sửa: Chỉ hiện dòng `ci.due_balance` khi có ít nhất một dòng cộng/trừ (nhận sớm, đêm thêm, FOC); không có thì chỉ dòng tổng `ci.due_title`.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-13
- Mức độ: Minor
- Vị trí: `ReservationDialogs.tsx` `NoShowDialog` (`:1194…`, `confirmHelpId` chỉ trỏ câu liên lạc; `:1305–1318` khối dòng dịch vụ)
- Vấn đề: (1) Đang đọc folio: không có gì hiện (khoảng trống), nút No-show khóa không lý do; (2) đọc lỗi: Alert `svc.load_failed` có nút Thử lại nhưng nút No-show khóa mà `aria-describedby` không trỏ tới câu đó.
- Vì sao quan trọng: DS mục 7 (mọi khối có trạng thái tải/lỗi), C1 (nút khóa phải nói vì sao, gắn nút).
- Đề xuất sửa: Đang tải → `<p className="li-s" role="status">{t('svc.loading')}</p>` (UXD đã thêm). Lỗi → Alert có `id`, `confirmHelpId` trỏ vào đó khi `lines === null`. UXD đã viết lại `svc.load_failed` nêu hệ quả: "… nên chưa đánh dấu không đến được. Bấm Thử lại."
- Trạng thái: Open

### FB-R2-UXD-FE-S4-14
- Mức độ: Minor
- Vị trí: `ServiceLines.tsx:30–38` (`retainLinesOf` bỏ dòng thiếu lý do), `:123–154`; `ReservationDialogs.tsx` (`svc.reason_needed` chỉ hiện sau khi bấm)
- Vấn đề: Ảnh chụp: tick "Giữ Dịch vụ – Đưa đón sân bay · 300.000 đ" nhưng dòng tóm tắt vẫn "Đảo 575.000 đ · giữ 0 đ" vì chưa có lý do; lỗi lý do chỉ hiện sau lần bấm "Hủy đơn" đầu tiên.
- Vì sao quan trọng: Tóm tắt nói ngược với lựa chọn vừa tick → lễ tân nghi ngờ con số, hoặc báo khách sai số giữ lại.
- Đề xuất sửa: Khi có dòng đã tick mà lý do < 3 ký tự: thay dòng tóm tắt bằng `svc.reason_needed` (`role="status"`, chữ thường, chưa tô lỗi) cho tới khi đủ lý do và tính thử khớp; ô lý do có `help` = `svc.reason_needed` ngay khi tick (lỗi đỏ chỉ sau khi bấm, như hiện nay).
- Trạng thái: Open

### FB-R2-UXD-FE-S4-15
- Mức độ: Minor
- Vị trí: `ReservationDialogs.tsx` `CancelDialog` (`:349–389`: `refund_request` → `ServiceLinesPicker` → … → `Field cancel.reason`)
- Vấn đề: Ảnh chụp: danh sách dịch vụ (3 dòng + ô lý do giữ) chen giữa câu hậu quả và ô bắt buộc "Lý do hủy"; ô bắt buộc bị đẩy xuống cuối hộp, ra ngoài màn khi có nhiều dòng.
- Vì sao quan trọng: DS 6.1 thứ tự hộp xác nhận: tiêu đề → hậu quả → lý do bắt buộc → nút. Lý do hủy còn đổi số tính thử (`reasonCode`), nên phải chọn trước.
- Đề xuất sửa: Thứ tự: câu hậu quả → `cancel.refund_request` → **Lý do hủy** (+ tiền phạt OTA, phí kênh) → khối Dịch vụ trong đơn → dòng tóm tắt "Đảo … · giữ …" ngay trên chân hộp.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-16
- Mức độ: Suggestion
- Vị trí: `ServiceLines.tsx:111–122`
- Vấn đề: Số tiền nằm cuối nhãn ô tick ("Giữ Giặt ủi · 2,5 kg · 75.000 đ"), không thẳng cột; chip "Đã thực hiện" lúc xuống dòng riêng, lúc nằm cùng dòng (ảnh chụp: dòng 1 và dòng 3 khác nhau).
- Vì sao quan trọng: 3–5 dòng dịch vụ khó so số; vị trí chip không đoán trước được.
- Đề xuất sửa: Mỗi dòng là lưới 3 cột: [ô tick + nhãn dòng] [chip "Đã thực hiện"] [số `vnd()` canh phải `.num`]; tên truy cập của ô tick giữ nguyên `svc.keep` (`aria-label`) để test và trình đọc màn hình không đổi.
- Trạng thái: Open

## B. FE-B – từ lượt duyệt chuỗi

### FB-R2-UXD-FE-S4-17
- Mức độ: Minor
- Vị trí: `ReservationDialogs.tsx` `DepositNoticeDialog` (`uploadAttachment` lỗi); chuỗi `rsv.receipt_upload_failed`
- Vấn đề: Khóa `rsv.receipt_upload_failed` có trong nhóm FE-B nhưng mã không dùng; tải ảnh lỗi hiện câu lỗi chung.
- Vì sao quan trọng: CTV không biết số tiền và ảnh còn giữ, dễ nhập lại hoặc bỏ báo cọc.
- Đề xuất sửa: Lỗi mạng/5xx của `uploadAttachment` → Alert `rsv.receipt_upload_failed` (UXD đã viết lại: "… Số tiền và ảnh vẫn còn – bấm Báo đã chuyển cọc để thử lại.").
- Trạng thái: Open

### FB-R2-UXD-FE-S4-18
- Mức độ: Minor
- Vị trí: `pages/ops/opsLabels.ts:165–178` (`DECLINE_KEY`); hợp đồng `transitionGuestRequest.declinedReasonCode` 0.3.7
- Vấn đề: Bảng ánh xạ trộn 2 tiền tố và tên khóa lệch mã (`outside_service_hours` → `guest.req.decline.out_of_hours`, 3 mã → `gw.req.decline.*`). ORC/BE-D báo lệch mã hợp đồng.
- Vì sao quan trọng: Mỗi lần thêm mã phải sửa tay 2 bảng (Desk, guest-web); khách và lễ tân dễ thấy hai câu khác nhau cho cùng một mã.
- Đề xuất sửa: UXD đã thêm đủ 5 khóa **trùng tên mã**: `guest.req.decline.{not_available_now, outside_service_hours, needs_front_desk, duplicate, other}`. Desk dùng `` t(`guest.req.decline.${code}`) ``; bỏ `DECLINE_KEY`. Khóa cũ giữ tới v0.5 (đã ghi "CŨ") nên đổi lúc nào cũng không vỡ.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-19
- Mức độ: Minor
- Vị trí: `app/attention.ts:180–185` (`foc_threshold`)
- Vấn đề: `pct` truyền bằng `str(p.pct)` → tiếng Việt hiện "3.4%" (dấu chấm thập phân); content-guide 4 và KPI H03 dùng "66,7%".
- Vì sao quan trọng: Cùng màn Tổng quan có hai kiểu số thập phân.
- Đề xuất sửa: Định dạng `pct` 1 chữ số thập phân theo locale (như ô công suất). UXD đã viết lại câu `attn.foc_pct`, `attn.foc_count` (khóa của FE-B giữ nguyên; bỏ 3 khóa `today.foc_alert_*` UXD tạo song song để một khái niệm một khóa).
- Trạng thái: Open

## C. MOB

### FB-R2-UXD-MOB-S4-01
- Mức độ: Minor
- Vị trí: `apps/guest-web/src/pages/RequestsPage.tsx:39–45` (`DECLINE`), `:47–52` (`UNAVAILABLE`)
- Vấn đề: Như FE-S4-18: lý do từ chối ánh xạ tay sang 2 tiền tố, tên khóa lệch mã 0.3.7.
- Vì sao quan trọng: Khách đọc lý do từ chối – phải đúng câu của mã và giống câu lễ tân chọn ở Desk.
- Đề xuất sửa: `` t(`guest.req.decline.${code}`) `` (5 khóa UXD đã thêm). `UNAVAILABLE.outside_service_hours` đổi sang `guest.req.decline.outside_service_hours`; `not_offered` giữ `guest.req.decline.not_offered` (không phải mã từ chối).
- Trạng thái: Open

---

## D. Trả lời giả định cần UXD duyệt (`outputs/FE/s4-report.md`)

| Giả định | Trả lời UXD |
|---|---|
| FE-A 1 – `[GIẢ ĐỊNH FE-A – ARC xác nhận]` FD gửi `roomNotReadyOverride` (202) không kèm `checkIn.payment` | **ARC đã chốt** đúng như vậy (OpenAPI 0.3.7 `checkIn` bổ sung 1). Phần giao diện chưa theo: nút vẫn bị `balance_paid` chặn và mục Thu tiền vẫn hứa ghi tiền → thẻ **FE-S4-02** (Major), chuỗi `ci.pay_after_lead` đã có. |
| FE-A 2 – H11 chỉ dùng QR cọc đang chờ khi chọn VietQR **và** đúng số trên mã; khác số thì ghi tay | **Đồng ý.** Chữ `dep.qr_pending`, `dep.qr_amount_differs`, `dep.qr_expired` đã duyệt (sửa: gọi đúng tên nút "Xác nhận đã nhận cọc", "Khi tiền về tài khoản OTTIMO"). |
| FE-A 3 – 60 chuỗi FE viết; bố cục 3 hộp theo mẫu có sẵn (`.sum`, DS 6.3, ô tick bắt buộc như `ci.told_guest`) | **Chữ duyệt**, sửa 25 chuỗi (mục E). **Bố cục chấp nhận khung**, kèm thẻ FE-S4-01 … 16; UXD sửa `.sum th` trong `hifi.css`. Ba hộp sẽ vào hi-fi H11 (11.4) và H13 (13.4) ở đợt B2 theo các thẻ này – FE không phải chờ hi-fi. |
| FE-A 4 – "Đã thực hiện" = ngày dịch vụ < hôm nay theo đồng hồ máy quầy | **Đồng ý** vì chỉ là gợi ý, server không dựa vào. Đề nghị dùng **ngày nghiệp vụ** (`businessDate` của API, BR-010) thay đồng hồ máy: đánh dấu không đến sau 00:00 thì bữa sáng ngày đến vẫn là "chưa thực hiện". Không cần thẻ. |
| FE-B 1 – `[GIẢ ĐỊNH FE-B – PO xác nhận]` ảnh biên nhận **không bắt buộc** | Về giao diện **đồng ý**; câu `rsv.receipt_help` nay nói rõ "Không bắt buộc nhưng nên gửi". PO chọn bắt buộc thì chỉ bỏ vế đó + đổi điều kiện nút (ghi trong ghi chú chuỗi). |
| FE-B 2 – `room_ooo` / `registration_due` đọc `params.endDate`, `roomNos` | Thuộc BE-D xác nhận. Giao diện không phản đối: danh sách căn dưới câu dùng "401 · The Pine". FE-B đã thêm `attn.room_ooo_rooms` cho trường hợp chỉ có danh sách căn – UXD đã duyệt. |
| FE-B 3 – khách đi `replied` không có giờ hẹn → chip "Đã trả lời" (`today.dep_replied`) | **Đồng ý.** Khi `ReservationSummary` có giờ hẹn (đề nghị ARC thêm `agreedCheckoutTime` ở bản contract kế tiếp nếu rẻ) thì dùng `stay.card_answered` có `{time}`. |
| FE-B 4 – Tổng quan chỉ OWN/MGR; bản rút gọn H24 24.2 cho FDL/FD chưa làm | **Đồng ý cho R2**: FD/FDL có cùng khối "Cần chú ý" ở Hôm nay (H03). PO quyết có đưa 24.2 vào backlog R3 hay không. Cập nhật lúc duyệt: FE-B đã thêm `ov.my_requests_n`, `ov.my_requests_empty` cho bản 24.2 lễ tân – UXD duyệt chữ, không sửa. |
| FE-B 5 – tên phòng theo ánh xạ tạm BL 4.1 | **Đồng ý** (DS 11.3, chờ bảng INV 19/10 – chỉ sửa danh mục căn). |
| FE-B 6 – 41 chuỗi + Hôm nay/Tổng quan theo H03/H24, lớp `hifi.css` có sẵn | **Chữ duyệt**, sửa 10 chuỗi. Bố cục H03/H24 không nằm trong lượt xem này (ORC giao 3 hộp FE-A) – UXD xem ở review chéo cuối sprint. |
| FE-B yêu cầu: `gw.room_fallback`; 2 câu riêng cho 2 dòng `foc_threshold` | **Đã làm**: `gw.room_fallback` "phòng {no}" / "room {no}" / RU nháp "номер {no}" (DS 11.2.2). Hai câu: dùng khóa FE-B đã tạo `attn.foc_pct`, `attn.foc_count`, UXD viết lại câu theo tham số BE-D thật (không có số tiền FOC, không có tên người duyệt); vắng `pct` → `attn.foc_threshold`. EP01 3.3 ghi tên khóa `today.foc_alert_*` – nhờ BA sửa spec theo khóa thật. |
| MOB – `[GIẢ ĐỊNH MOB – UXD duyệt]` `gw.welcome_title_plain` "Welcome to OTTIMO." khi phiên không có tên | **Đồng ý** – đúng câu chuẩn của Brand Guidelines. |

## E. Chuỗi – kết quả duyệt (chi tiết ở `content-guide.md` mục 8)

| Nhóm | Số khóa | Sửa | Ghi chú chính |
|---|---|---|---|
| FE-A tiền | 60 | 25 | Lý do khóa nút theo mẫu "… để bật nút Lưu thay đổi"; thuật ngữ "Miễn phí (FOC)", "Phụ thu người vượt định mức", "sale nội bộ"; `move.basis.keep_booked_rate` sai khi lý do "Khác"/dời ngày → "Giá mỗi đêm giữ như lúc đặt"; `dep.qr_failed` không chỉ tới khối không có; `move.col_*` có "(đ)" |
| FE-B vận hành | 41 | 10 | `attn.reconcile_overdue` sửa nghĩa ({days} = giao dịch cũ nhất); "Báo khách không đến" thay "no-show"; `co.debt_due_past` nói cách sửa; `rsv.receipt_*` |
| MOB PWA | 26 | 5 | `hk.task.complete` "Làm xong" (động từ như "Dọn xong"); "Đang chuẩn bị ảnh…" thay "nén"; hàng đợi nói rõ thao tác vẫn còn trên máy |
| MOB guest-web | 9 | 2 | `gw.req.paid_limit` bỏ số 3 viết cứng; `guest.oci.done_title` gộp về một dòng (khóa trùng ở nhóm Luồng 7 và nhóm MOB) |
| FE-A đợt 2 | 39 | 2 | `party.slot_required` theo mẫu lý do khóa; `folio.col_amount` "(đ)" |
| FE-B Desk mục 5 | 143 | 8 | `wo.col.title` "Sự cố"; `wo.sev_suggested` "căn đang có khách/trống"; `ooo.col.nights` "Đêm khóa"; `hk.desk.cancel_effect`; `req.desk.complete` "Làm xong"; `attn.foc_pct/count`; `rsv.notice.photo_error` |
| MOB đợt 2 | 20 | 1 | `gw.lang_auto` VI "bạn có thể đổi ở đầu trang" (khớp EN "at the top"); còn lại giữ |
| UXD bổ sung giữa sprint | 11 (mới) | – | `gw.room_fallback`, `guest.req.auto_reply` (VI/EN/RU), `guest.req.decline.{not_available_now, outside_service_hours, needs_front_desk, duplicate}`, `ci.submit_cash_short`, `ci.pay_after_lead`, `move.night_ota_diff`, `move.nights_toggle`, `svc.loading` |
| Nhóm cũ | – | 1 (+ gộp 1, 7 ghi chú) | `guest.req.decline.other` (theo `replyNote` bắt buộc); gộp khóa trùng `guest.oci.done_title`; 7 khóa "CŨ": `guest.req.decline.out_of_hours`, `…fully_booked`, `gw.req.decline.*` (3), `gw.req.auto_reply`; `…not_offered` ghi rõ chỉ cho `unavailableReason` |

Tổng: 338 chuỗi duyệt, **54 chuỗi sửa**, 11 chuỗi mới; `gen_strings.py` 2724 chuỗi + 8 mẫu, 0 khóa trùng.

**Ghi chú cho vai khác (không phải thẻ review):**
- **BE-D**: `guest.req.auto_reply` đã có (VI/EN/RU nháp; tham số `{time}`, `{open_time}`, `{phone}` đúng như `guest-requests.service.ts`). Chạy `node scripts/gen-guest-request-copy.mjs` để server trả `autoReply` (US-110 AC2) – hiện `--check` báo `guest-request-copy.ts` cũ nên `be-d-s4-units.test.ts` sẽ đỏ tới khi sinh lại. Nếu `property.phone_public` rỗng, câu cuối sẽ thiếu số – đề nghị bảo đảm cơ sở có số công khai (OTTIMO có hotline) hoặc báo UXD để thêm biến thể không số.
- **BA**: EP01 3.3 đổi tên khóa thành `attn.foc_pct` / `attn.foc_count` và bỏ `{foc}`, `{month}`, `{name}` (BE-D không trả); EP14 4.3 câu trả lời tự động lấy theo `guest.req.auto_reply` mới; EP14 3.4 (bảng hành động) đổi danh sách mã lý do theo enum 0.3.7.
- **MOB**: nhóm "MOB đợt 2" (chuông thông báo, `gw.lang_*`) vào `gen_strings.py` trong lúc UXD duyệt – đã duyệt luôn (mục E). guest-web: `gw.lang_auto` đang hiện hai lần trên trang Lưu trú (dòng nhỏ dưới lời chào + mô tả `sr-only` của ô ngôn ngữ ở `GuestShell.tsx:66`) → trình đọc màn hình đọc hai lần; nên chỉ giữ một chỗ (mô tả ô ngôn ngữ dùng `aria-describedby` trỏ vào dòng nhìn thấy).

## Điểm làm tốt (giữ)
- FE-A: mọi số trong hộp tính thử lấy từ server, nút Lưu chỉ mở khi bản tính thử khớp đúng đầu vào; ô "Đã báo khách số tiền mới" đặt ngay dưới hộp và tự bỏ tick khi số đổi – đúng tinh thần DS 6.3.
- FE-A: lý do khóa nút luôn đặt cạnh nút + `aria-describedby` (`move.save_needs_*`, `ci.submit_needs_pay`, `svc.reason_needed`) – nhất quán với KB7.
- FE-B/MOB: chuỗi mới đều qua `gen_strings.py`, có ghi chú nguồn API/BR từng khóa; không chuỗi nào viết cứng trong mã (test khóa VI/EN của cả ba ứng dụng).
