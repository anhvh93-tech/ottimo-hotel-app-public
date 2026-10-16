# UXD review FE – Round 2, Sprint 2 (admin-web H08–H12)

- Người review: UXD | Tác giả: FE | Ngày: 16/10/2026 | Bước: Review chéo (UXD → FE bắt buộc)
- Phạm vi: `product/apps/admin-web/src/pages/{rack,booking,reservations,quotes}/**`, `app/{reservations,problem,live}.ts`, `packages/ui/src/styles/app.css` so với hi-fi `product/design/hifi/08…12`, Design System v0.3.3, `content-guide.md`, đặc tả `specs/EP02-reservations.md`, báo cáo `rounds/round-02/outputs/FE/s2-report.md`.
- Cách kiểm: đọc mã toàn bộ 10 file màn + helper; đối chiếu mọi khóa `t()` với `strings-vi/en.json` (365 khóa literal – không thiếu khóa nào; khóa động `error.*`/`field.*` đối chiếu với bảng mã OpenAPI); so khóa hi-fi với khóa FE dùng. Chạy `pnpm --filter @ottimo/admin-web dev` (mock) và mở trong Browser pane: **MSW vẫn không đăng ký được trong pane** (trang báo "DEV: Không chạy được API giả (MSW)…") → không xem trực quan được, chưa đo tương phản thực tế/zoom 200 %/VoiceOver; sáng/tối dựa trên token (`.bar.*`, `.rack .cell.*` đều lấy biến từ `tokens.css`, có bộ `prefers-color-scheme` và `[data-theme]`). Sau khi UXD sửa chuỗi: `@ottimo/i18n` test 3/3 xanh; `admin-web` 99/100 – 1 đỏ do test viết cứng chữ `lsm.flag` cũ (thẻ 16). `check_hifi.py`: tất cả hi-fi xanh.
- UXD đã làm trong lượt này (vùng của UXD): thêm **50 chuỗi** nhóm "R2 Sprint 2 – review FE" và sửa 5 chuỗi (`rack.conflict_title`, `rsv.assign_lead` thêm `{channel}`; `cancel.consequence` bỏ `{channels}`; `rack.manual_legend`, `lsm.flag` bỏ "R2/R3"), sinh lại bằng `gen_strings.py`, cập nhật `content-guide.md` mục 8–9 (v0.3.5) và hi-fi H08, H10, H11. Bảng khóa mới cho FE ở cuối file.
- Tổng: **0 Blocker · 9 Major · 9 Minor · 2 Suggestion**.

### FB-R2-UXD-FE-S2-01
- Mức độ: Major
- Vị trí: `pages/reservations/ReservationDialogs.tsx` `CancelDialog` (dòng 131–249); hi-fi H11 "Hủy đơn đã cọc – BR-309"; US-135
- Vấn đề: Hộp hủy đơn **chưa đủ hậu quả để người bấm quyết định**: (1) nút "Hủy đơn" bấm được ngay khi `dryRun` chưa trả hoặc lỗi – lúc đó câu hiện "Giữ lại … (phí hủy); hoàn … – cần quản lý duyệt" (dấu `…` thay số tiền) hoặc chỉ một cảnh báo vàng, lễ tân vẫn hủy được mà không biết giữ/hoàn bao nhiêu; (2) `refundableVnd = 0` vẫn ra "hoàn 0 đ – cần quản lý duyệt" (lỗi gốc ở hi-fi của UXD – đã sửa); giữ 0 và hoàn 0 cũng ra câu phí/hoàn vô nghĩa; (3) xem trước gọi **một lần** với `reasonCode: 'guest_changed_mind'` cố định – đổi lý do không tính lại; (4) đơn OTA thiếu lý do "OTA báo hủy" và ô "Tiền phạt theo kênh" (BR-310, `otaPenaltyVnd` – FE đã nêu ở báo cáo mục 4.8); (5) không hiện dòng chính sách `rsv.cancel_rule` như hi-fi.
- Vì sao quan trọng: Hủy là thao tác không hoàn tác, đụng tiền cọc. US-135 yêu cầu thấy hậu quả **trước** khi xác nhận; đơn OTA không ghi được tiền phạt → sổ tiền lệch với kênh.
- Đề xuất sửa: Khóa nút Hủy đơn (`disabled` + `aria-describedby`) cho tới khi có `quote`; lúc chờ hiện `cancel.preview_loading`; lỗi → `cancel.preview_failed` + nút `common.retry` (gọi lại dryRun). Chọn câu theo số tiền: `retained>0 && refund>0` → `confirm.cancel_booking.body`; `refund=0` → `confirm.cancel_booking.body_no_refund`; cả hai 0 → `confirm.cancel_booking.body_no_money`. Gọi lại dryRun khi đổi lý do (debounce, giữ kết quả cũ đến khi có mới). Đơn kênh `ota`: thêm `cancel.reason.ota_cancelled` vào danh sách và ô tiền `cancel.ota_penalty` + `cancel.ota_penalty_help` (gửi `otaPenaltyVnd`, lỗi `field.OTA_PENALTY_OTA_ONLY`). `rsv.cancel_rule` chỉ hiện khi API trả số ngày/% (hiện chưa có trong `CancellationQuote` – bỏ qua được, không viết cứng).
- Trạng thái: Open

### FB-R2-UXD-FE-S2-02
- Mức độ: Major
- Vị trí: `ReservationDialogs.tsx:187` (`cancel.consequence`, `channels: 7`, `lead: r.booker?.displayName`)
- Vấn đề: Hộp hủy giữ chỗ luôn nói "…trên **7** kênh. Khách tiềm năng **{tên người đặt}** trở về 'Đã báo giá'": số kênh viết cứng; người đứng tên đơn bị gọi là "khách tiềm năng" và câu khẳng định trạng thái lead thay đổi kể cả khi đơn không đến từ báo giá/lead nào.
- Vì sao quan trọng: Câu xác nhận nói sai sự thật về việc hệ thống sẽ làm; sale/lễ tân tưởng có lead đã được trả về.
- Đề xuất sửa: UXD đã bỏ `{channels}` khỏi `cancel.consequence` ("trên mọi kênh"). Dùng `cancel.consequence` **chỉ khi** đơn có lead/báo giá gốc (tên lead từ dữ liệu lead, không phải `booker`); ngược lại dùng `cancel.consequence_no_lead`. Bỏ tham số `channels`.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-03
- Mức độ: Major
- Vị trí: `ReservationDialogs.tsx` `useAction.errorView` (dòng 92–113); `app/problem.ts`
- Vấn đề: 412 `VERSION_CONFLICT`: câu hướng dẫn "Tải lại để xem bản mới – thông tin bạn nhập vẫn còn" nhưng nút hiện chữ **"Thử lại"** (`common.retry`) và thực chất chỉ tải lại, không gửi lại. Người dùng bấm "Thử lại" tưởng đã lưu, rồi đóng hộp. 428 `PRECONDITION_REQUIRED` ("Bấm Tải lại") không có nút nào.
- Vì sao quan trọng: Nhãn nút không khớp hành động → mất thao tác (đổi căn, xác nhận cọc) mà tưởng đã xong; trùng với tiêu chí EP00 0.2.4 "giữ dữ liệu + tải lại phiên bản".
- Đề xuất sửa: Nút = `common.reload` ("Tải lại") cho cả 412 và 428; sau khi tải lại xong ẩn Alert đỏ (dữ liệu đã nhập vẫn giữ) và để nút chính của hộp thoại sáng lại để người dùng tự bấm lưu lần nữa. Không dùng `common.retry` cho tải lại ở bất kỳ màn EP02 nào.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-04
- Mức độ: Major
- Vị trí: `useAction.run` (dòng 64–68) + `rsvErrorText` case `INVALID_TRANSITION` (`app/reservations.ts`)
- Vấn đề: 409 `INVALID_TRANSITION`: FE tự tải lại đơn nhưng **hộp thoại vẫn mở với nút hành động còn bấm được**, câu bảo "Tải lại để xem các nút hiện có" trong khi không có nút Tải lại và drawer phía sau đã đổi. Nếu tải lại thất bại, `{status}` lấy trạng thái cũ (sai) hoặc rỗng → "Đơn vừa chuyển sang \"\"…".
- Vì sao quan trọng: Lễ tân bấm lại hành động không còn hợp lệ, nhận lỗi lặp; câu trống trạng thái trông như lỗi hệ thống.
- Đề xuất sửa: Khi tải lại thành công → đóng hộp thoại, hiện Alert trong drawer bằng `rsv.transition_changed` (`{status}` = nhãn trạng thái mới). Tải lại thất bại / không biết trạng thái → giữ hộp, khóa nút chính, hiện `rsv.transition_changed_unknown` + nút `common.reload`.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-05
- Mức độ: Major
- Vị trí: `app/reservations.ts` `rsvErrorText` case `HOLD_EXPIRED`
- Vấn đề: `time: String(p.expiredAt ?? '')` đưa **chuỗi ISO thô** vào câu ("…hết hạn lúc 2026-10-16T02:12:00Z…"); thiếu `expiredAt` → "hết hạn lúc  và căn…".
- Vì sao quan trọng: Lộ định dạng kỹ thuật, giờ UTC lệch 7 tiếng so với giờ khách sạn – lễ tân báo sai giờ cho khách.
- Đề xuất sửa: `formatInstant(locale, p.expiredAt)` (giờ Asia/Ho_Chi_Minh, `HH:mm dd/mm`); không có `expiredAt` → `error.HOLD_EXPIRED_notime`.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-06
- Mức độ: Major
- Vị trí: nhiều file – xem bảng; báo cáo FE mục 4.7
- Vấn đề: Khóa tạm / mượn khóa màn khác / ghép chuỗi tạo chữ sai hoặc vụng, nhất là EN:

| Chỗ | Hiện tại | Hậu quả | Khóa đúng (đã thêm) |
|---|---|---|---|
| `dateLabels()` tách `booking.field.dates` | "Ngày đến" / "Ngày đi" bằng regex | vỡ khi UXD đổi câu, EN viết hoa giả | `booking.field.arrival`, `booking.field.departure` |
| Rack `Seg label` | "Lưới / Danh sách" | đọc màn hình đọc cả hai nhãn | `rack.view_label` |
| `RackGrid.tsx:257` | `'HĐ'` viết cứng | EN hiện "HĐ · Emma…" | `rack.long_prefix` |
| Rack chip căn ngừng bán | `config.stop_sale` ("Stop selling" – động từ ở màn cấu hình) | lệch `rack.hidden_note` ("Off sale") | `rack.off_sale` |
| Bảng Danh sách H08 | `users.col_status`, `nav.reservations` | "Trạng thái" mơ hồ (buồng hay đơn?) | `rack.col_status`, `rack.col_bookings` |
| Hộp "Lưu chưa gán căn" (BookingDialog 1024–1036) | tiêu đề `` `${bk.save_unassigned}?` ``, thân `fo.rack.unassigned_help`, nút `common.back` | thiếu mã OTA + "quản lý nhận cảnh báo" (EP02 6.2) | `bk.unassigned_confirm_title`, `bk.unassigned_confirm_body` (`{ota_ref}`), `bk.unassigned_back` |
| Toast thao tác | `` `${code} · ${trạng thái}` `` / `common.saved` | không nói đã làm gì (gán căn nào, gia hạn đến mấy giờ) | `rsv.toast.cancelled/confirmed/no_show/restored/hold_extended/moved/assigned` |
| Bộ lọc màn Đơn | "Đã xác nhận / Giữ chỗ · chờ cọc" ghép | nhãn dài, không gồm "Đang ở" | `rsv.filter_active` |
| Ô tìm màn Đơn | `` `${lsm.col_code} / OTA / KH-…` `` | nửa cứng nửa dịch | `rsv.search_placeholder` |
| Báo giá đã chuyển | `status.booking.hold` | báo giá không có trạng thái đơn; đơn có thể đã xác nhận | `sale.quote_converted`; hết hạn: `sale.quote_expired` |
| Nút căn nâng hạng bị khóa (FD) | `title={rsv.upgrade_note}` | tooltip không đọc được bằng bàn phím | `rsv.upgrade_needs_lead` (chữ hiện cạnh lựa chọn) |

- Vì sao quan trọng: Chủ đầu tư/khách nước ngoài dùng EN thấy chữ Việt lẫn; màn hình đọc đọc nhãn ghép; vi phạm content-guide "một khái niệm – một tên".
- Đề xuất sửa: Thay đúng theo cột cuối; xóa `dateLabels()`. Mọi khóa đã có trong `strings-vi/en.json` (nhóm "R2 Sprint 2 – review FE").
- Trạng thái: Open

### FB-R2-UXD-FE-S2-07
- Mức độ: Major
- Vị trí: `ReservationsPage.tsx:176–181`; `QuotesPage.tsx` `MyQuotes` (dòng 393–399)
- Vấn đề: Thiếu trạng thái rỗng: danh sách đơn rỗng và danh sách báo giá rỗng chỉ hiện một ô "–"; tìm không ra dùng `crm.empty_title` = "Chưa có **khách** nào khớp…" (sai danh từ – đây là đơn).
- Vì sao quan trọng: DoD yêu cầu đủ 5 trạng thái; "–" trông như lỗi tải, sale mới (chưa có báo giá) không biết bắt đầu từ đâu.
- Đề xuất sửa: Dùng khối `.state` như rack: đơn rỗng `rsv.list_empty_title` + `rsv.list_empty_body` (+ nút Đặt phòng mới nếu vai có quyền); tìm không ra `rsv.search_empty` (`{q}`); báo giá rỗng `sale.quotes_empty_title` + `sale.quotes_empty_body` + nút chuyển tab Căn trống.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-08
- Mức độ: Major
- Vị trí: `BookingDialog.tsx:983` (`bk.deposit_line`, `pct: 30`), `QuoteDialog.tsx:484` (`sale.deposit_due`, `pct: 30`), `QuoteDialog.tsx:531` (`sale.price_source`, `days: 3`)
- Vấn đề: Số nghiệp vụ viết cứng trong tham số chuỗi; content-guide mục 2 yêu cầu lấy từ tham số. Số tiền cọc thì lấy từ server, còn nhãn "% cọc" cứng 30.
- Vì sao quan trọng: Khi chủ đầu tư đổi % cọc ở H05, nhãn "Cọc cần thu (30%…)" mâu thuẫn với số tiền ngay bên cạnh – sale báo khách sai.
- Đề xuất sửa: `pct` lấy từ kết quả `calculateQuote` (nếu có `depositPct`) hoặc `useRules()` (mặc định BR §13 khi không đọc được tham số, như đang làm cho giờ giữ chỗ); `days` lấy từ tham số hiệu lực báo giá. Thiếu trường trong API → FE gửi ARC cùng đợt với các trường RackBar.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-09
- Mức độ: Minor
- Vị trí: `RackPage.tsx:246–263` (cảnh báo đỏ đầu rack); hi-fi H08 dòng 68
- Vấn đề: Cảnh báo xung đột OTA gộp mọi đơn thành một câu "tên · kênh · ngày; tên · kênh · ngày. {help}" và nút "Gán căn" chỉ mở đơn đầu. Hi-fi dùng `rack.conflict_title` (mỗi đơn một tiêu đề: kênh, mã, khách) + `rack.conflict_body` (căn bị kín + căn gợi ý). `rack.conflict_title` của UXD trước đây cứng chữ "Agoda" – **đã sửa** thành `{channel}`.
- Vì sao quan trọng: Có ≥ 2 đơn xung đột thì câu gộp khó đọc, lễ tân không biết bấm "Gán căn" sẽ mở đơn nào.
- Đề xuất sửa: 1 đơn → Alert theo hi-fi (`rack.conflict_title` với `channel = channelName(...)`, `code`, `guest`; `rack.conflict_body` khi có căn gợi ý). ≥ 2 đơn → tiêu đề `today.unassigned_title` + danh sách `<ul>` mỗi đơn một dòng có nút "Gán căn" riêng.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-10
- Mức độ: Minor
- Vị trí: `RackGrid.tsx` (khung grid, nhãn ô); `ReservationDrawer.tsx:187`
- Vấn đề: a11y lưới rack – làm tốt phần lớn (roving tabindex, nhãn thanh đủ), còn: (1) `role="region"` và `role="grid"` cùng `aria-label` → đọc hai lần; (2) ô trống không đặt được (đã qua, ngừng bán, mất mạng) chỉ có nhãn "16/10" – không nói căn nào, vì sao không bấm được; (3) hàng `role="row"` dùng `style={{display:'contents'}}` – VoiceOver/Safari cũ bỏ vai trò của phần tử `display: contents`, cần thử thật; dùng lớp `.contents` thay style; (4) nút Nhận phòng khóa chỉ có `title` (không đọc được bằng bàn phím); (5) `aria-label` thanh "Nhập tay = HĐ ngoài hệ thống (R2)" lộ mã giai đoạn (chuỗi UXD – đã sửa).
- Vì sao quan trọng: Lễ tân dùng bàn phím/màn hình đọc cần biết ô nào đặt được và vì sao không.
- Đề xuất sửa: Bỏ `aria-label` ở `region` (giữ ở grid). Ô không đặt được: `rack.cell_past` / `rack.cell_off_sale` / `rack.cell_free` (`{room}`, `{date}`). Nút khóa: `aria-disabled` + văn bản ẩn `shell.coming_title` nối bằng `aria-describedby`. Chạy thử VoiceOver Safari một lần trên máy dev (MSW chạy được trong Safari).
- Trạng thái: Open

### FB-R2-UXD-FE-S2-11
- Mức độ: Minor
- Vị trí: `RackPage.tsx` `RackTable` khi < 768 px; hi-fi H08 mục 8.3
- Vấn đề: Bố cục điện thoại dùng bảng 3 cột với nút `btn ghost sm` (< 44 px) thay vì danh sách thẻ mỗi căn một dòng như hi-fi (chip giữ chỗ/khóa/vượt định mức, `rack.unassigned_short`, `rack.ooo_until`, `rack.offline_short`). Ở 360 px cột "Đơn" bị bó, chữ xuống dòng nhiều.
- Vì sao quan trọng: Lễ tân xem rack trên điện thoại khi đứng quầy/đi buồng; vùng chạm nhỏ dễ bấm nhầm đơn.
- Đề xuất sửa: < 768 px dùng `.rack-list` của hi-fi (lớp đã có trong `hifi.css`); vùng chạm 44 px. Bảng giữ cho chế độ "Danh sách" trên desktop (thay thế cho màn hình đọc).
- Trạng thái: Open

### FB-R2-UXD-FE-S2-12
- Mức độ: Minor
- Vị trí: `RackPage.tsx` (mất mạng); hi-fi H08
- Vấn đề: Mất mạng chỉ có thanh chung `shell.offline_readonly`; rack khóa ô trống + nút Đặt phòng mà không nói vì sao. Hi-fi dùng `rack.offline` ("…Chưa tạo hay sửa đơn được để tránh đặt trùng").
- Vì sao quan trọng: Lễ tân thấy nút xám không rõ lý do, dễ ghi sổ tay rồi quên nhập.
- Đề xuất sửa: Trên màn rack thay thanh chung bằng `rack.offline` (`{time}`), hoặc thêm dòng này dưới thanh chung; ô trống khóa dùng `rack.cell_free` + mô tả offline.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-13
- Mức độ: Minor
- Vị trí: `DepositDialog` (`act.errorView({ required: need })`)
- Vấn đề: `DEPOSIT_INSUFFICIENT` không truyền `paid` → khi Problem không có `paid`, câu thành "đã ghi nhận 0 đ" dù vừa ghi nhận một khoản.
- Vì sao quan trọng: Sai số tiền hiển thị cho lễ tân ngay sau khi thu.
- Đề xuất sửa: Truyền `paid = (r.depositPaidVnd ?? 0) + value` (hoặc giá trị sau `reload()`); giữ đề nghị ARC thêm `required/paid` vào Problem.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-14
- Mức độ: Minor
- Vị trí: `ReservationDialogs.tsx` `AssignRoomDialog` (dòng 812–866); hi-fi H11 gán căn
- Vấn đề: `legend` = `move.resolution.same_group` cho danh sách có cả căn nâng hạng; không có câu dẫn `rsv.assign_lead` và gợi ý `rsv.fit_*` như hi-fi; toast `common.saved`.
- Vì sao quan trọng: Lễ tân không thấy lý do xếp hạng gợi ý; tiêu đề nhóm nói "cùng nhóm" nhưng có căn khác nhóm.
- Đề xuất sửa: `legend` = `rsv.assign_options`; câu dẫn `rsv.assign_lead` (`{channel}`, `{group}`, `{from}`, `{to}`, `{room}` – đã thêm `{channel}`) khi có dữ liệu; `rsv.fit_*` khi API trả lý do (nếu chưa có thì bỏ qua); toast `rsv.toast.assigned`.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-15
- Mức độ: Minor
- Vị trí: `pages/{rack,booking,reservations,quotes}/*.tsx` – 37 chỗ `style={{…}}`
- Vấn đề: Màn mới quay lại style nội tuyến lệch lưới 4 px (`marginTop: 6/10`, `margin: '14px 0 6px'`, `padding: '10px 12px'`, `listStyle:'none'`, `display:'contents'`…), trong khi DS v0.3.3 mục 4.1 đã có lớp thay thế (FB-R2-UXD-FE-15 Sprint 1).
- Vì sao quan trọng: Khoảng cách lệch giữa các màn; UXD đổi token không lan tới.
- Đề xuất sửa: `.mt-8/.mt-12`, `.list-plain`, `.contents`, `.card.inset`, `.caption`; chỉ giữ `gridTemplateColumns`/vị trí lưới rack (dữ liệu động – được phép).
- Trạng thái: Open

### FB-R2-UXD-FE-S2-16
- Mức độ: Major
- Vị trí: `apps/admin-web/src/__tests__/booking.test.tsx` (test "≥ 28 nights → long-stay manual booking")
- Vấn đề: Test tìm chữ cứng "HĐ ngoài hệ thống – chuyển vào app ở R3". UXD đã đổi `lsm.flag` thành "HĐ ngoài hệ thống – sẽ chuyển vào app" (bỏ mã giai đoạn nội bộ) → test **đỏ** (99/100).
- Vì sao quan trọng: CI đỏ chặn PR.
- Đề xuất sửa: Tìm theo `t('lsm.flag')` (helper i18n của test) thay vì chữ cứng; rà các test khác còn chữ cứng của chuỗi UXD.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-17
- Mức độ: Minor
- Vị trí: `app/problem.ts` `fieldErrorText` + các form EP02
- Vấn đề: Một số mã trường EP02 chưa có chuỗi nên rơi về `field_error.not_in_list` ("không có trong danh sách"): `DATE_ORDER`, `OTA_AMOUNT_MISMATCH`, `ALLOW_UNASSIGNED_OTA_ONLY`, `MANUAL_LONG_STAY_BELOW_THRESHOLD`, `OTA_PENALTY_OTA_ONLY`; gia hạn lần 2 (`INVALID_TRANSITION`) chưa có câu riêng.
- Vì sao quan trọng: Câu lỗi sai nghĩa, người dùng không biết sửa gì.
- Đề xuất sửa: UXD đã thêm `field.<MÃ>` cho 5 mã trên (tra tự động qua `field.${code}`). Riêng `field.MANUAL_LONG_STAY_BELOW_THRESHOLD` cần `{n}` = `long_stay_required_from_nights` (truyền qua `args`). Hộp gia hạn: khi `extendedCount ≥ 1` hoặc 409 sau gia hạn → `field_error.hold_extended_once`.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-18
- Mức độ: Minor
- Vị trí: `ReservationsPage.tsx:166–168`
- Vấn đề: Số dư dùng `toLocaleString('vi-VN')` thay vì `vnd()` của i18n → khi chọn EN vẫn định dạng kiểu Việt, lệch các ô tiền khác.
- Vì sao quan trọng: Nhất quán định dạng tiền (content-guide mục 4).
- Đề xuất sửa: `vnd(r.balanceDueVnd)` + `common.vnd_unit` như drawer.
- Trạng thái: Open

### FB-R2-UXD-FE-S2-19
- Mức độ: Suggestion
- Vị trí: `RackGrid.tsx` `barContent` (`style={urgent ? { borderColor: 'var(--bad)' } : undefined}`)
- Vấn đề: Giữ chỗ < 2 giờ đổi viền bằng style nội tuyến.
- Vì sao quan trọng: Dễ quên ở chú giải và bản di động.
- Đề xuất sửa: Dùng lớp `bar hold urgent` (UXD sẽ thêm `.bar.hold.urgent{border-color:var(--bad)}` vào `hifi.css` ở lượt sửa kế tiếp nếu FE đồng ý) và thêm mẫu vào chú giải ("Giữ chỗ còn < 2 giờ" – đã có ở hi-fi).
- Trạng thái: Open

### FB-R2-UXD-FE-S2-20
- Mức độ: Suggestion
- Vị trí: `QuoteDialog.tsx:546–553`
- Vấn đề: Nhãn ngôn ngữ "Tiếng Việt"/"English" viết bằng tên tự gọi – đúng chuẩn, nhưng thiếu `lang` trên từng nhãn.
- Vì sao quan trọng: Màn hình đọc phát âm "English" bằng giọng Việt.
- Đề xuất sửa: Bọc nhãn bằng `<span lang="vi">`/`<span lang="en">` (Seg nhận ReactNode).
- Trạng thái: Open

## Khóa chuỗi mới cho FE (đã có trong `product/design/copy/strings-vi.json`, `strings-en.json`)

| Nhóm | Khóa | Tham số |
|---|---|---|
| Chung | `common.reload` | – |
| H09 form | `booking.field.arrival`, `booking.field.departure` | – |
| H09 OTA chưa gán | `bk.unassigned_confirm_title`, `bk.unassigned_confirm_body`, `bk.unassigned_back` | `{ota_ref}` |
| H08 rack | `rack.view_label`, `rack.long_prefix`, `rack.col_status`, `rack.col_bookings`, `rack.off_sale` | – |
| H08 a11y ô | `rack.cell_free`, `rack.cell_past`, `rack.cell_off_sale` | `{room}`, `{date}` |
| H11 drawer | `drawer.progress.label`, `rsv.upgrade_needs_lead`, `rsv.assign_options` | – |
| H11 toast | `rsv.toast.cancelled`, `rsv.toast.confirmed`, `rsv.toast.no_show`, `rsv.toast.restored` | `{code}` |
| | `rsv.toast.hold_extended` | `{code}`, `{time}` |
| | `rsv.toast.moved` | `{code}`, `{room}`, `{from}`, `{to}` |
| | `rsv.toast.assigned` | `{room}`, `{code}` |
| H11 409 | `rsv.transition_changed` (`{status}`), `rsv.transition_changed_unknown`, `error.HOLD_EXPIRED_notime` | |
| H11 hủy | `cancel.consequence_no_lead` (`{room}`,`{from}`,`{to}`), `confirm.cancel_booking.body_no_refund` (`{room}`,`{from}`,`{to}`,`{retained}`), `confirm.cancel_booking.body_no_money` (`{room}`,`{from}`,`{to}`), `cancel.preview_loading`, `cancel.preview_failed`, `cancel.reason.ota_cancelled`, `cancel.ota_penalty`, `cancel.ota_penalty_help` | |
| Màn Đơn | `rsv.filter_active`, `rsv.search_placeholder`, `rsv.list_empty_title`, `rsv.list_empty_body`, `rsv.search_empty` (`{q}`) | |
| H12 | `sale.quotes_empty_title`, `sale.quotes_empty_body`, `sale.quote_converted`, `sale.quote_expired` | |
| Lỗi trường | `field_error.hold_extended_once`, `field.OTA_AMOUNT_MISMATCH`, `field.ALLOW_UNASSIGNED_OTA_ONLY`, `field.DATE_ORDER`, `field.MANUAL_LONG_STAY_BELOW_THRESHOLD` (`{n}`), `field.OTA_PENALTY_OTA_ONLY` | |

Chuỗi **đã sửa** (FE kiểm lại chỗ dùng): `rack.conflict_title` thêm `{channel}`; `rsv.assign_lead` thêm `{channel}`; `cancel.consequence` bỏ `{channels}` (FE bỏ tham số); `rack.manual_legend` = "= HĐ ngoài hệ thống"; `lsm.flag` = "HĐ ngoài hệ thống – sẽ chuyển vào app".

## Điểm làm tốt (nên giữ)
- Lưới rack ARIA bài bản: roving tabindex, ↑/↓ giữ đêm, nhãn thanh đủ căn–khách–trạng thái–ngày–kênh–mã–nhập tay–vượt định mức; màu không bao giờ là tín hiệu duy nhất (icon + chữ + hoa văn) – đúng US-016 AC2; trả focus về ô sau khi đóng drawer.
- 409 `ROOM_UNAVAILABLE` ở H09 rất tốt: giữ dữ liệu, nêu tên khách chiếm căn theo vai, nút "Dùng căn X", phân biệt "vừa được người khác đặt", nhánh OTA "Lưu chưa gán căn" có hộp xác nhận focus nút an toàn.
- Mọi khóa `t()` literal đều có trong file chuỗi UXD (không còn pending), hold countdown đổi đỏ < 2 giờ, hộp xác nhận đặt focus vào nút an toàn đúng DS.
