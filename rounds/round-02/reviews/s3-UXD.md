# UXD review FE + MOB – Round 2, Sprint 3 (admin-web H13–H17, H04 · guest-web H18)

- Người review: UXD | Tác giả: FE (admin-web), MOB (guest-web) | Ngày: 17/10/2026 | Bước: Review chéo (UXD → FE, UXD → MOB – bắt buộc)
- Phạm vi: `product/apps/admin-web/src/pages/{stay,registration,approvals,money}/**`, `pages/{RoomsPage,RoomDrawer}.tsx` (H04 `warnings[]`), `app/{useWrite,problem}.ts(x)`, phần H15 trong `pages/reservations/ReservationDrawer.tsx`; `product/apps/guest-web/src/**`. So với hi-fi `product/design/hifi/13…18`, Design System v0.3.4 (6.16, 6.17, 6.21, C1/C7/C15/C24/C25, mục 7–8), `content-guide.md`, OpenAPI 0.3.6-draft, báo cáo `outputs/FE/s3-report.md`, `outputs/MOB/s3-report.md`, `outputs/BE/s3-be-c.md`.
- Cách kiểm:
  - Đọc toàn bộ mã các màn trên; đối chiếu khóa `t()` với `strings-vi/en/ru.json`, tham số với OpenAPI (`ExtensionOptions.repricing`, `PortalData.fields[].valueKey`, `GuestDocumentInput`, action nhật ký tiền BE phát ra trong `services/api/src/modules/**`).
  - **Chạy app bằng mock** (`pnpm --filter @ottimo/admin-web dev`, `@ottimo/guest-web dev`). Browser pane vẫn không đăng ký được service worker MSW (404 khi tải script – giống S2) và Claude in Chrome không kết nối, nên UXD chụp bằng **Chromium headless (Playwright của repo) trên máy dev** – script tạm ở scratchpad, không thêm vào repo. Đã xem: H13 (đơn 302 Trực tiếp, sáng; đơn 103 Booking.com, tối), H16 3 bước + VietQR + Phiếu VI và VI–EN + **chế độ in**, H14 danh sách + chi tiết, H17 Cần duyệt / Nhật ký / Chờ đối soát / Hoàn tiền (qa.mgr, tối), guest-web 375×812 VI sáng và **RU tối** (Lưu trú → Thông báo → Giấy tờ → Bổ sung tại quầy → Giờ đến → Xác nhận → Xong → thẻ "Đã làm thủ tục trước"). Chưa đo: VoiceOver/TalkBack thật, phóng chữ 200 %.
  - Sau khi UXD sửa chuỗi: `@ottimo/i18n` 4/4, `admin-web` **132/132**, `guest-web` **39/39** xanh; `gen_strings.py` 2228 chuỗi + 8 mẫu, 0 khóa trùng, tham số VI ↔ EN ↔ RU 0 lệch; `check_hifi.py` 25/25 ✓.
- **Trả lời câu hỏi của ORC:** FE **chưa** dùng `valueKey` – bảng dữ liệu cổng còn hiện nguyên `label` (là khóa `reg.field.*` theo BE-C) và `value`; mock FE vẫn trả nhãn tiếng Việt nên test không bắt được (thẻ FE-S3-01).
- **Quyết định UXD (chờ SEC đồng ký):** đồng ý MOB giữ 7 chuỗi pháp lý bằng **EN** trên trang RU tới khi bản RU được người bản ngữ duyệt, kèm 4 điều kiện (thẻ MOB-S3-01; đã ghi vào `content-guide.md` mục 6 và DS 6.17). Đề nghị ORC ghi decision-log sau khi SEC đồng ý.
- UXD đã làm trong lượt này (vùng design): thêm **91 chuỗi** nhóm "R2 Sprint 3 – review FE H13–H17 + MOB guest-web" (VI/EN; RU nháp cho 7 chuỗi `gw.*`); sửa 7 chuỗi (`ci.cond_balance`, `ci.effect_fee`, `co.change_due` bỏ đơn vị viết cứng; `mlog.a_payment`, `mlog.a_staff_payment`, `mlog.a_line_added`, `mlog.a_adjusted` bỏ chi tiết ví dụ viết cứng); `hifi.css` mục 16 (in Phiếu thanh toán qua `.print-root` – đã thử: chỉ in tờ phiếu, nền trắng cả khi chế độ tối); DS v0.3.5 (6.16, 6.17), content-guide 0.3.10 (mục 4 quy ước tiền, mục 6 pháp lý trên trang RU, mục 8 sinh lại); hi-fi H13, H16, H17 cập nhật theo. Bảng khóa mới ở cuối file.
- Tổng: **0 Blocker · 13 Major · 15 Minor · 2 Suggestion** (FE: 12 Major · 9 Minor · 1 Suggestion; MOB: 1 Major · 6 Minor · 1 Suggestion).

---

## A. FE – admin-web

### FB-R2-UXD-FE-S3-01
- Mức độ: Major
- Vị trí: `pages/registration/RegistrationPage.tsx:411–440` (bảng "Sao chép lên cổng"); `mocks/stay.ts:2363–2381`; hi-fi H14 14.2; `outputs/BE/s3-be-c.md` dòng 114, 198–199
- Vấn đề: (1) Ô nhãn hiện `{f.label}` nguyên văn – với API thật đây là khóa `reg.field.full_name`, `reg.field.gender`… nên lễ tân thấy khóa kỹ thuật thay vì "Họ và tên", "Giới tính"; (2) **không dùng `valueKey`** (BE-C mới thêm): giao diện EN vẫn hiện "Nữ", "Miễn thị thực"; trường rỗng hiện ô trống thay cho `reg.value.empty`; (3) trường rỗng vẫn có nút "Sao chép" (sao chép chuỗi rỗng); (4) mock trả nhãn tiếng Việt + 5 trường, lệch contract (15/8 trường, nhãn là khóa), nên 132 test xanh mà lỗi không lộ.
- Vì sao quan trọng: Khai báo lưu trú là nghĩa vụ pháp lý có hạn giờ; lễ tân dò ô trên cổng Bộ Công an theo nhãn. Nhãn là khóa máy → dò sai ô, khai sai trường.
- Đề xuất sửa: Nhãn `t(f.label)` (rơi về `f.label` nếu không có khóa). Ô giá trị: `f.valueKey ? t(f.valueKey) : f.value` để **hiện**; nút Sao chép luôn chép `f.value` (tiếng Việt do server – không chép chữ đã dịch). `f.valueKey === 'reg.value.empty'` → hiện `reg.value.empty`, không có nút Sao chép. Sửa mock theo `rules.ts portalFields()` (nhãn khóa, đủ trường, `valueKey`) và thêm test EN: nhãn dịch, giá trị enum dịch, chép ra tiếng Việt.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-02
- Mức độ: Major
- Vị trí: `pages/registration/DocsPanel.tsx:169–373` (`ManualDocDialog`); hi-fi H13 "Nhập tay giấy tờ", EP06 2.3; `GuestDocumentInput` (OpenAPI 0.3.6)
- Vấn đề: Form nhập tay chỉ có loại, số, họ tên, ngày sinh, quốc tịch, hạn hộ chiếu, hạn thị thực, ngày nhập cảnh. Thiếu các ô API đã nhận và cổng cần: giới tính, ngày cấp, nơi cấp, diện nhập cảnh, số thị thực, cửa khẩu, mục đích nhập cảnh, địa chỉ (VN) – nhãn `checkin.docs.field.*` UXD đã thêm ở đợt 3. Thiếu ô "Không có dấu / chứng nhận nhập cảnh" (`noEntryRecord`) nên biến thể BR-613 (c) "Thiếu dấu nhập cảnh – chặn nhận phòng" (H13 13.3) không bao giờ xảy ra từ quầy. Chưa sửa được giấy tờ đã lưu (`updateGuestDocument` – FE mục 7).
- Vì sao quan trọng: `getPortalData` trả các trường này rỗng → bảng sao chép báo "để trống trên cổng" cho trường bắt buộc (giới tính có ở cả hai biểu mẫu). Nhập sai không sửa được → phải xóa ảnh/nhập lại.
- Đề xuất sửa: Thêm `gender` (Seg Nam/Nữ/Khác – `reg.value.gender.*`), `address` (khi `docType` = cccd/child), và với hộ chiếu: `passportIssueDate`, `issuingPlace`, `visaKind` (Seg 3 lựa chọn `reg.value.visa_kind.*`), `visaNumber` (ẩn khi `visa_exempt`), `entryPort`, `entryPurpose`, ô tích `noEntryRecord` (khóa `entryDate` khi tích). Nút "Sửa" trên dòng giấy tờ mở cùng form với `updateGuestDocument` (If-Match). Nếu không kịp Sprint 3: ít nhất `gender`, `visaKind`, `noEntryRecord`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-03
- Mức độ: Major
- Vị trí: `pages/stay/StayDialogs.tsx:49` (`reprice = repricing.find(x => x.nights === r.nights + n)`), `:85` (nhãn nút), `:115` (`channel: r.channelCode`); `ExtensionOptions.repricing` (OpenAPI: "mỗi phần tử ứng với gia hạn `nights` đêm"); BE `stay.service.ts:187–207`
- Vấn đề: (1) So khớp sai: `repricing[].nights` là **số đêm gia hạn** (1…maxNights), FE so với tổng đêm `r.nights + n` → hoặc không tìm thấy (mất câu `extend.los_reprice`, nút hiện giá chưa áp bậc giảm BR-107), hoặc lấy nhầm phần tử của k đêm khác; (2) nút "Gia hạn {n} đêm · {amount}" lấy `repricedTotalVnd` = **tổng tiền phòng cả đơn** sau gia hạn (ví dụ "Gia hạn 1 đêm · 5.205.000"), không phải tiền phải trả thêm; (3) câu đơn con OTA hiện mã kênh thô ("Đơn booking_com: …").
- Vì sao quan trọng: Lễ tân đọc số trên nút để báo khách – báo sai tiền gia hạn. Tiền server tính đúng nhưng khách đã nghe số sai.
- Đề xuất sửa: `reprice = repricing.find(x => x.nights === n)`; nút dùng `reprice?.deltaVnd ?? total`; `extend.los_reprice` chỉ hiện khi `losDiscountPct > 0`, `{n}` = `r.nights + n`, kèm dòng "Tổng tiền phòng sau gia hạn: `repricedTotalVnd`". Kênh qua `channelName()`. Thêm test với ví dụ BR-107 (202: 5 đêm 4.079.000 → 7 đêm 5.205.000, thêm 2 đêm → nút hiện chênh lệch 1.126.000).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-04
- Mức độ: Major
- Vị trí: `pages/stay/CheckInPage.tsx:713–731` (nút Nhận phòng), `CheckOutPage.tsx:629–641` (Hoàn tất khi trả thừa), `StayDialogs.tsx:226–231` (Trả muộn khi chưa tick), `DocsPanel.tsx:252`, `ApprovalsPage.tsx:197`; DS C1, hi-fi H13 13.5 (a11y)
- Vấn đề: Nút chính khóa nhưng chỉ có một lý do: H13 chỉ hiện `ci.submit_needs_rules` khi chưa tick nội quy; khi đã tick nội quy mà **chưa tick "đã báo khách"**, **còn điều kiện chưa đủ** (còn phải thu, thiếu giấy tờ người đứng tên) hoặc **đang chờ lễ tân trưởng**, nút vẫn `aria-disabled`, bấm không có gì xảy ra, không câu giải thích, không `aria-describedby`. H16 "Hoàn tất" khóa khi chưa ghi lý do trả thừa – không câu. Các nút `disabled` thật (Trả muộn, Lưu giấy tờ, Duyệt) cũng không có câu lý do.
- Vì sao quan trọng: Lễ tân đứng trước khách bấm nút không phản hồi, không biết thiếu gì; người dùng bàn phím/màn hình đọc không nghe lý do.
- Đề xuất sửa: Một hàm `whyLocked()` trả câu đầu tiên còn thiếu theo thứ tự: nội quy (`ci.submit_needs_rules`) → đã báo khách (`ci.submit_needs_told`) → điều kiện (`ci.submit_needs_conditions` {n}) → chờ duyệt (`ci.waiting_lead`); hiện cạnh nút + `aria-describedby`. H16: `checkout.overpay.needs_reason`. Các nút `disabled` khác: đổi sang `aria-disabled` + câu ngắn, hoặc ít nhất câu trợ giúp cạnh ô bắt buộc.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-05
- Mức độ: Major
- Vị trí: `CheckInPage.tsx:174–231`, `:726–753` (nút + `ConfirmDialog`); DS 6.9 ("hành động `requiresApproval` vẽ thành 'Gửi … duyệt'"); hi-fi H13 13.5 "Buồng chưa sẵn sàng – lễ tân"
- Vấn đề: Lễ tân (FD) gõ lý do buồng chưa sẵn sàng → nút vẫn ghi "Nhận phòng căn 202", hộp xác nhận nói "Đơn chuyển 'Đang ở', buồng chuyển 'Có khách, sạch'" – nhưng server trả 202 (chỉ tạo yêu cầu duyệt). Nhãn và hậu quả nói sai việc sẽ xảy ra.
- Vì sao quan trọng: Lễ tân tưởng đã nhận phòng, giao thẻ cho khách trong khi đơn vẫn "Đã xác nhận" – lệch trạng thái buồng, khai báo chưa tính hạn.
- Đề xuất sửa: Khi `!lead && roomCond && !roomCond.met && roomReason` → nút `ci.send_lead`, hộp `ci.request_title` {room} + `ci.request_effect`; 202 → giữ Alert `ci.waiting_lead` (đã có).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-06
- Mức độ: Major
- Vị trí: `pages/stay/CheckOutPage.tsx:689–823` (`BillDialog`), `:728` (`window.print()`); hi-fi H16 16.5; DS C24, A7; US-037 AC2
- Vấn đề (đã chụp, kể cả chế độ in):
  1. **In ra cả màn hình app**: sidebar, trang phía sau, lớp phủ, nút của hộp thoại – `hifi.css` không có quy tắc in cho app (chỉ ẩn khung tài liệu hi-fi).
  2. Tờ phiếu thiếu tiêu đề "Phiếu thanh toán / Guest folio" (chỉ nằm ở tiêu đề hộp thoại – không in), giờ lập, tiêu đề cột; MST hiện "Đà Lạt · ••••••••••" không nhãn; không có đơn vị tiền ở bất kỳ đâu; "Đã cọc / đã thu −0".
  3. Song ngữ ghép cùng dòng bằng " / " ("Đã cọc / đã thu / Deposit / paid"), không `lang="en"`, không dùng `.bill-paper .en`; nút "Việt – Anh" bật song ngữ ở client khi server trả `locale=vi` → nhãn có EN nhưng dòng folio (mô tả do server theo `Bill.locale`) vẫn chỉ tiếng Việt; dòng `bill.ota_prepaid`, `bill.refund`, `bill.paid_stamp` không có EN.
- Vì sao quan trọng: Phiếu thanh toán là chứng từ đưa khách (khách NN là nhóm lớn của OTTIMO); in ra kèm giao diện quản trị là không dùng được và lộ dữ liệu khác trên màn.
- Đề xuất sửa: (1) Khi hộp Phiếu mở, render bản sao tờ phiếu bằng portal vào `<div class="print-root">` con trực tiếp `<body>`, rồi `window.print()` – UXD đã thêm `hifi.css` mục 16 (chỉ in phần này, A5, nền trắng; đã thử ở chế độ tối). (2) Cấu trúc theo H16 16.5: tên cơ sở + `bill.tax_code`, `bill.no` + `bill.issued_at` (hoặc `bill.preview_note` khi chưa có số), tiêu đề `bill.title` trong tờ, `thead` `bill.col_desc` / `bill.col_amount`, dòng `bill.paid` thay `bill.deposit`, không in "−0" (ẩn dòng khi `paidVnd = 0`). (3) Song ngữ: `<span class="en" lang="en">{translate('en', key)}</span>` dưới nhãn VI cho mọi nhãn cố định; nút chuyển thành Seg `bill.lang_label` (`co.bill_vi` / `co.bill_vien`, `aria-pressed`) và mặc định theo `Bill.locale`; khi người dùng chọn VI–EN mà server trả `vi`, ghi chú cho ARC: cần `getBill?locale=vi_en` để dòng folio có EN (Minor, không chặn).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-07
- Mức độ: Major
- Vị trí: `pages/stay/PaymentPanel.tsx:137–193` (khối VietQR), `:141`, `:159–163`, `:205`; `CheckInPage.tsx:604–619` (số thẻ phòng); `hifi.css:33` (`.stack>*+*{margin-top}`); DS C25, 6.16
- Vấn đề (đã chụp): các `<b>`/`<span>` đặt trực tiếp trong `.stack` là phần tử nội tuyến nên chạy liền một dòng: **"2.460.000 đNội dung chuyển khoản: OTM0147 9704••••7777 [Sao chép…]"** – số tài khoản nhận dính ngay sau nội dung chuyển khoản. Nút "Sao chép thông tin chuyển khoản" chép một chuỗi "OTM0147 2460000" (nội dung + số tiền thô) – khách dán vào ô Nội dung là sai nội dung. QR `aria-label` và nút "Chuyển khoản VietQR · x đ" ghép bằng code. H13 bước 4: nhãn "Số thẻ phòng đã giao", stepper và câu trợ giúp cũng chạy cùng dòng.
- Vì sao quan trọng: Đối soát dựa trên nội dung = mã đơn (US-120 AC1). Nội dung sai/lẫn số → giao dịch không khớp, quản lý đánh "Không thấy tiền", khách bị đòi tiền lần hai.
- Đề xuất sửa: Bố cục theo DS 6.16 (v0.3.5): mỗi thông tin một `<div>`/`<p>`: `.price-big` số tiền · `pay.qr_note` {ref} (mono) + nút `pay.copy_ref` (chỉ chép `transferContent`) · `pay.qr_account` {account} · nút `pay.copy_amount` (chép số không dấu chấm). QR `label = t('pay.qr_label', {amount, ref})`; nút tạo `t('pay.vietqr_create', {amount})`. Số thẻ: bọc nhãn + stepper + trợ giúp trong `<div class="field">`. Rà các `.stack` khác có `span` nội tuyến.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-08
- Mức độ: Major
- Vị trí: `CheckInPage.tsx:595–629` (thẻ "Mã cửa – nhập tay trên app khóa"); hi-fi H13 13.5 (`ci.door_valid`, `ci.door_valid_value`, `ci.door_lock`); BR-403; DS 6.16
- Vấn đề: Bước 1 hướng dẫn "tạo mã 6 số … với **đúng hiệu lực trên**" nhưng màn không hiện hiệu lực (giờ nhận → giờ trả, gồm trả muộn đã duyệt) và khóa nào (hi-fi có hai dòng "Hiệu lực 11:05 15/10 → 12:00 18/10 · Khóa TTLock · 103").
- Vì sao quan trọng: Lễ tân tự đoán hiệu lực trên app TTLock: đặt ngắn → khách bị khóa ngoài lúc đêm; đặt dài → mã còn mở cửa sau khi khách trả phòng (rủi ro an ninh căn).
- Đề xuất sửa: Thêm `dl` trên danh sách bước: `ci.door_valid` = `ci.door_valid_value` {from: giờ nhận (giờ đã nhập hoặc giờ chuẩn) + ngày đến, to: `agreedCheckoutTime` hoặc giờ trả chuẩn + ngày đi}; `ci.door_lock` = "TTLock · {room}". Thiếu dữ liệu giờ trả chuẩn trong `CheckInPreview` → FE dùng tham số BR-401 như các màn khác.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-09
- Mức độ: Major
- Vị trí: `pages/money/MoneyPage.tsx:75–101` (`auditLabel`); action BE phát: `services/api/src/modules/**` (21 action nhóm tiền); hi-fi H17 17.3
- Vấn đề: Chỉ 6 action có câu, 2 trong đó BE **không phát** (`payment.recorded_by_staff`, `folio.line_added` – BE dùng `payment.recorded` + `recordedByRole`, `folio.line_posted`). Mọi action còn lại hiện **mã thô** ở cột Thao tác: `refund.paid`, `refund.cash_paid`, `refund.destination_set`, `payment.reconciled`, `payment.cash_handover_confirmed`, `payment.confirmed_received`, `payment.qr_created`, `payment.reversed`, `folio.line_posted`, `folio.line_reversed`, `folio.settled`, `folio.stay_reversed`, `folio.foc_requested`, `approval.rejected/escalated/cancelled`, `reservation.deposit_confirmed`, `reservation.no_show_deposit_retained`… – tức gần hết sự kiện Sprint 3. Lỗi phía UXD: `mlog.a_payment` ("· VietQR · chờ đối soát"), `mlog.a_line_added` ("· phụ thu trả muộn"), `mlog.a_adjusted` ("· giặt ủi"), `mlog.a_staff_payment` ("cọc · tiền mặt") viết cứng chi tiết ví dụ → mọi khoản thu đều hiện "VietQR" – **UXD đã sửa** thành câu chung.
- Vì sao quan trọng: Nhật ký tiền là công cụ kiểm soát của chủ đầu tư (BR-008); mã kỹ thuật và chi tiết sai làm mất giá trị kiểm tra.
- Đề xuất sửa: Bảng tra `action → khóa` đủ 21 action (khóa `mlog.a_*` mới, bảng cuối file); `payment.recorded`: `recordedByRole` thuộc sale/CTV → `mlog.a_staff_payment`, ngược lại `mlog.a_payment` + `· {t(METHOD_KEY[after.method])}` + chip `.chip.recon` khi `after.reconciliation = 'pending'`; mã lạ → `mlog.a_other` + mã ở chữ nhỏ. Nhờ ARC xác nhận danh sách action là tập đóng (hoặc ghi vào OpenAPI) để FE có test.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-10
- Mức độ: Major
- Vị trí: `pages/approvals/ApprovalsPage.tsx:16–23` (`APPROVAL_TYPE`), `:85–88`, `:183–205` (`DecideDialog`)
- Vấn đề: Hộp duyệt dùng một tiêu đề/thân cho mọi loại: "Duyệt miễn {amount} cho {code}?" + "Folio ghi dòng miễn phí âm cùng giá trị kèm tên bạn. Tính vào hạn mức tháng của bạn." – sai với **hoàn tiền** (không phải miễn, không vào hạn mức miễn), **nhận phòng khi buồng chưa sẵn sàng**, **trả muộn khi có khách đến**, **khôi phục đơn không đến** (số tiền 0 → "Duyệt miễn 0 cho OTM-…?"). Nhãn loại "nhận phòng khi buồng chưa sẵn sàng" mượn tên điều kiện `checkin.cond.room_ready` ("Buồng sẵn sàng (VI hoặc VC)" – nghĩa ngược). Từ chối dùng `approval.reject_title` "Từ chối yêu cầu miễn phí…" cho mọi loại. Dòng nơi nhận hoàn hiện "Chuyển khoản" cho cả `original_method`.
- Vì sao quan trọng: Hộp xác nhận phải nêu đúng hậu quả (US-135, DS 6.1); người duyệt hiểu sai đang duyệt cái gì.
- Đề xuất sửa: Loại: `foc` → `foc.kind_foc`, `special_discount` → `foc.kind_discount`, `refund` → `refund.title`, ba loại còn lại → `approval.type.*`. Tiêu đề/thân theo loại: `foc`/`special_discount` giữ `approval.approve_title`/`approval.approve_body`; còn lại `approval.approve_title.<type>` + `approval.approve_body.<type>`; từ chối ngoài foc/discount → `approval.reject_title_generic`. Không hiện số tiền khi `amountVnd = 0`. Nơi nhận: `refund.method.original_method` cho `original_method`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-11
- Mức độ: Major
- Vị trí: `pages/money/MoneyPage.tsx:423–468` (tab Hoàn tiền), `:441–443`, `:618`, `:629–775` (`ExecuteRefundDialog`); DS 6.1 ("hoàn cọc"); EP03-05 2.6
- Vấn đề: Tách quyền làm đúng (FD chi tiền mặt có ảnh biên nhận; chuyển khoản chỉ MGR/OWN, FD thấy `refund.transfer_waits_manager`; xem đủ số TK sau step-up) – nhưng: (1) `original_method` hiện thành **"Thẻ (máy POS tại quầy)"**; (2) hộp "Nhập nơi nhận hoàn" hiện chữ "Chờ duyệt" khi yêu cầu **đã duyệt**; (3) hộp chi hoàn không nêu hậu quả (ghi chi tiền, không sửa được) – hi-fi riêng cho màn này UXD chưa vẽ, FE dựng theo spec (lỗi gốc phía UXD, UXD đã thêm chuỗi); (4) nút "Chi hoàn tiền mặt" hiện cho chính người tạo yêu cầu, bấm xong mới nhận 403; (5) dòng tiêu đề "OTM-0158 · 1.200.000 (−200.000)" không rõ "−" là đã hoàn.
- Vì sao quan trọng: Chi tiền ra là thao tác không đảo ngược; nhãn cách hoàn sai có thể khiến lễ tân hoàn qua kênh khác ý khách.
- Đề xuất sửa: Nhãn cách hoàn qua `refund.method_label` {method} với map đủ `cash` / `bank_transfer` / `original_method` (`refund.method.original_method`); bỏ dòng `approval.status.pending` trong hộp nơi nhận; thân hộp chi: `refund.execute_effect_cash` / `refund.execute_effect_transfer` {amount} đặt trên nút; nút xác nhận chi dùng `variant="danger"` hoặc hộp `ConfirmDialog` sau khi điền; người xem là người tạo yêu cầu → không hiện nút chi, hiện `refund.self_execute_forbidden` sẵn (`ApprovalRequest` hiện chỉ có `requestedBy` là tên – nhờ ARC thêm `requestedById`, nếu chưa có thì giữ cách hiện tại); dòng tiêu đề tách "Đã hoàn {amount}" (`bill.refund` hoặc chuỗi riêng nếu cần).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-12
- Mức độ: Major
- Vị trí: nhiều file – bảng dưới; DS mục 7, DoD "đủ 5 trạng thái"
- Vấn đề:

| Chỗ | Hiện tại (đã chụp / đọc mã) | Đúng |
|---|---|---|
| H13 bước 4, mất mạng, còn phải thu (`CheckInPage.tsx:577–591`) | `balance > 0 && online` sai → hiện chip **"Đã thanh toán đủ"** | Mất mạng: giữ "Còn phải thu x đ" + `rsv.need_online`; chip chỉ khi `balance === 0` (như H16) |
| H13 bước Kiểm tra khi chưa có giấy tờ | Cột phải trống hoàn toàn | `checkin.verify.empty` + nút về bước 1 |
| H13 điều kiện khi `previewCheckIn` lỗi (`:287–292`) | Alert đỏ, không có nút Thử lại | Thêm `common.retry` |
| Tab Chờ đối soát rỗng (`MoneyPage.tsx:264–268`) | `mlog.empty_title` "Không có thao tác tiền trong khoảng này" | `recon.empty_title` + `recon.empty_body` |
| Tab Hoàn tiền rỗng (`:417–420`) | `approval.empty_*` "Không có yêu cầu chờ duyệt" | `refund.empty_title` + `refund.empty_body` |
| Đổi phòng không còn căn (`StayDialogs.tsx:403–420`) | Danh sách trống, chỉ câu "Chỉ hiện căn Sẵn sàng…" | `room_change.no_rooms` {from}{to} |
| H14 danh sách khi thiếu `deadlineAt` (`RegistrationPage.tsx:66–69`) | "Hạn khai báo: · còn" | `reg2.deadline_pending` |
| H14 chi tiết khi thiếu `imageRetentionUntil` (`:551`) | "Tự xóa 30 ngày sau trả phòng ()" | `reg2.retention_pending` |

- Vì sao quan trọng: Câu rỗng/ghép thiếu dữ liệu trông như lỗi hệ thống; chip "Đã thanh toán đủ" khi còn nợ là **trạng thái tiền sai** (HR-20).
- Đề xuất sửa: Theo cột "Đúng"; khóa đã có trong `strings-*.json`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-13
- Mức độ: Minor
- Vị trí: `CheckInPage.tsx:385–397` (`warnings[]`), `DocsPanel.tsx:147`, `app/problem.ts:108–111`
- Vấn đề: Cảnh báo `visa_expires_before_departure` / `passport_expires_during_stay` hiện `w.detail` – chữ thô của server (content-guide 5.2b: không hiện `detail`). Lỗi xem đủ số giấy tờ (khác REAUTH) luôn hiện `error.NOT_FOUND` dù là 403/429/DEVICE_NOT_TRUSTED. `REFUND_EXCEEDS_APPROVED` định dạng `{max}` cố định kiểu VI khi giao diện EN.
- Vì sao quan trọng: Câu sai ngữ cảnh/chưa dịch; người dùng EN thấy chữ Việt.
- Đề xuất sửa: `checkin.warn.<code>` (mã lạ → bỏ qua như OpenAPI "tập mở"); lỗi xem đủ số → `problemView(t, e, locale).text`; `formatNumber(locale, …)`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-14
- Mức độ: Minor
- Vị trí: nhiều file – bảng
- Vấn đề: Ghép chuỗi / mượn khóa màn khác:

| Chỗ | Hiện tại | Khóa đúng |
|---|---|---|
| `CheckInPage.tsx:269`, `CheckOutPage.tsx:222` – `ol.progress-steps` | `aria-label` = "Điều kiện nhận phòng" / tiêu đề trang | `checkin.steps_label`, `checkout.steps_label` |
| `StayDialogs.tsx:423–426` xem trước đổi phòng | `stay.cause_fault` làm câu giá; "Khách yêu cầu…: +x đ" ghép | `room_change.price_same`, `room_change.price_delta` {amount} |
| `StayDialogs.tsx:906–914` Seg loại người | "Thêm người đi cùng" / "Trẻ em" | `party.kind.adult` / `rsv.child` |
| `StayDialogs.tsx:941` ô năm sinh trẻ | `checkin.docs.field.dob` "Ngày sinh" (ô nhận 4 số) | `party.child_birth_year` |
| `StayDialogs.tsx:977–986` hộp giảm số khách | thân `booking.field.guests` "Số khách", nút "Lưu" | `party.reduce_count_body`, `party.reduce_submit` {n} |
| `StayDialogs.tsx:965–968` bỏ trẻ em | `{name}` rỗng (trẻ không có `guest`) | `m.guest?.displayName ?? m.childDisplayName` |
| `StayDialogs.tsx:533`, `:1035` | "Chọn lý do" cho khoản phát sinh; "Gửi duyệt" cho đề nghị hoàn | `stay.charge_choose`; `refund.request_overpayment` làm nhãn nút hoặc `foc.send` → giữ nếu PO đồng ý là "gửi duyệt" |
| Toast gia hạn/trả muộn/đổi phòng/phát sinh/hoàn tác (`StayDialogs.tsx:64, 208, 354, 498, 752`) | `common.saved` | `stay.toast.extended` {n}{date}, `stay.toast.late_set` {time}, `stay.toast.moved` {room}, `stay.toast.charge_added` {item}, `stay.toast.undo_checkin` {room} |
| `MoneyPage.tsx:220` tiền mặt nộp quầy | toast "Đã khớp sao kê" | `recon.cash_received_toast` {amount}{code} |
| `MoneyPage.tsx:440–443` | `refund.method` + ":" ghép | `refund.method_label` {method} |
| `RegistrationPage.tsx:55–68` hạn khai báo | "còn 5:20", "Đã quá hạn 1:05" | `common.duration_hm` / `common.duration_m` (content-guide 4) |
| `DocsPanel.tsx:152–154` | Nút vẫn "Xem đủ số / ảnh" khi đang hiện số | `ci.view_hide` khi `full` |
| `CheckOutPage.tsx:261`, `:782` | "Đã thu −0" | ẩn dòng khi 0 (content-guide 4) |
| `CheckOutPage.tsx:307–310` | "Buồng phòng đã kiểm lúc 14:40 ()" (`who: ''`) | truyền tên người kiểm, không có → câu không ngoặc |
| `CheckOutPage.tsx:374` | `minibarAct.view({ max: '' })` → "{max}" rỗng | truyền `standardQty` của món lỗi |

- Vì sao quan trọng: Content-guide "một khái niệm – một tên", "không ghép câu"; EN/màn hình đọc nhận nhãn sai.
- Đề xuất sửa: Theo cột cuối (khóa đã có).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-15
- Mức độ: Minor
- Vị trí: `CheckInPage.tsx:488, 522` ('14:00'); `StayDialogs.tsx:253` ('18:00'), `:270` (`rooms: '–'`), `:616, 631` ('12:00'); `ReservationDrawer.tsx:422` ('12:00'); `MoneyPage.tsx:303` (`pendingDays > 2`); `RegistrationPage.tsx:27` (`privacy-2026-10-v1`)
- Vấn đề: Số nghiệp vụ viết cứng (DS D6, content-guide 2): giờ chuẩn, mốc 18:00, giờ trả chuẩn, ngưỡng "quá 2 ngày" (`bank_reconcile_alert_days`), phiên bản thông báo. `late.arrival_warning` hiện "Còn căn thay thế cùng nhóm: –" khi API báo **có** căn thay thế.
- Vì sao quan trọng: Chủ đầu tư đổi tham số ở H05 → câu trên màn mâu thuẫn.
- Đề xuất sửa: Lấy từ `useRules()` / preview (giữ mặc định BR khi không đọc được, như S2-08); trả muộn có căn thay thế → `late.arrival_warning_alt`. Phiên bản thông báo: cùng nguồn với guest-web khi ARC thêm `currentNoticeVersion`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-16
- Mức độ: Minor
- Vị trí: mọi chỗ truyền `{amount}` (≈ 30 chỗ ở `pages/stay`, `money`, `approvals`); content-guide mục 4 (quy ước mới 0.3.10)
- Vấn đề: FE truyền `vnd(x)` (số trần) cho `{amount}` → "Ghi nhận đã thu 2.460.000", "Duyệt miễn 75.000…", EN "Record 2,460,000 received" không đơn vị. Gốc ở UXD: 43/46 chuỗi `{amount}` không có đơn vị trong khi 3 chuỗi có "đ" cứng – quy ước chưa rõ. **UXD đã chốt**: `{amount}` = số kèm đơn vị; đã bỏ "đ" cứng ở `ci.cond_balance`, `ci.effect_fee`, `co.change_due` (3 câu này tạm mất đơn vị tới khi FE sửa).
- Vì sao quan trọng: Định dạng tiền nhất quán, khách/chủ đầu tư nước ngoài đọc EN.
- Đề xuất sửa: Helper `money(v) = t('common.currency_vnd', { amount: vnd(v) })` trong `@ottimo/i18n`, dùng cho **mọi** tham số tiền trong câu; ô số trong bảng giữ `vnd()` (đơn vị ở tiêu đề cột/dòng tổng).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-17
- Mức độ: Minor
- Vị trí: `DocsPanel.tsx:409–524` (`CheckRow`), `CheckInPage.tsx:294–383` (`.conds`), `PaymentPanel.tsx:254`, `MoneyPage.tsx:341`; `ul.list-plain` ở `MoneyPage.tsx:422`, `ApprovalsPage.tsx:80`, `DocsPanel.tsx:59`, `StayDialogs.tsx:880`
- Vấn đề: (1) Chip không icon (DS C7 "luôn icon + chữ"): Đã đủ/Còn thiếu, kết quả kiểm, trạng thái duyệt/khai báo; dòng `.conds` không có icon ✓/✕ như hi-fi. (2) Kiểm 3 trạng thái dùng `li.unmet` (viền đỏ 4px) cho cả **Chưa kiểm được** → trông như Không đạt; DS 6.4 / `.chk3.unknown` (viền đứt, icon ?). (3) "Chờ đối soát" dùng `Chip tone="warn"` thay `.chip.recon` (viền đứt + đồng hồ cát). (4) Danh sách thẻ dùng `.list-plain` (có chấm đầu dòng – thấy rõ ở tab Hoàn tiền, Cần duyệt) thay `.list-none`.
- Vì sao quan trọng: Nhất quán DS; Fail và Unknown cần khác nhau cả hình (HR-07, A4).
- Đề xuất sửa: `Chip` nhận `icon` theo tone (check / alert / x / hourglass) – có thể đặt mặc định trong `@ottimo/ui`; `CheckRow` dùng `<li class="chk3 ok|fail|unknown">` + icon; `Chip` nhận `className` để dùng `recon`; `.list-none` cho danh sách thẻ.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-18
- Mức độ: Minor
- Vị trí: `CheckInPage.tsx:268–280` (bước tiến trình), `:261–262` (`document_check_block`)
- Vấn đề: (1) Bước đánh dấu "xong" (xanh) theo chỉ số: bấm Tiếp tục khi chưa có giấy tờ thì "Giấy tờ" đã xanh. (2) Đơn khách nước ngoài chưa có giấy tờ: "Giấy tờ khách nước ngoài hợp lệ tại ngày nhận – **Đã đủ**" (chụp đơn Anna Martin) – báo đạt khi chưa kiểm gì.
- Vì sao quan trọng: Trạng thái trung thực (HR-20, DS 6.4 "không báo Đạt giả"); điều kiện người đứng tên vẫn chặn nên rủi ro thấp.
- Đề xuất sửa: `done` khi bước thật sự đạt (Giấy tờ: có giấy tờ người đứng tên; Kiểm tra: `reviewReady`); còn lại để trung tính. `document_check_block` met mà đơn chưa có giấy tờ → chip trung tính + `ci.cond_doc_check_pending`.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-19
- Mức độ: Minor
- Vị trí: `StayDialogs.tsx` (`ChangeRoomDialog`, `AddChargeDialog`, `LateCheckoutDialog`, `PartyDialog`, `RefundRequestDialog`), `MoneyPage.tsx` (`DestinationDialog`, `ExecuteRefundDialog`); DS C15, 6.2 (HR-05)
- Vấn đề: Chỉ `ManualDocDialog` truyền `dirty`; các hộp còn lại Esc/bấm nền là đóng mất lý do, số tài khoản, ảnh chứng từ đã chọn.
- Vì sao quan trọng: Mất dữ liệu đang nhập giữa lúc khách chờ.
- Đề xuất sửa: Truyền `dirty` (+ `unsavedLabels`) khi đã nhập bất kỳ ô nào.
- Trạng thái: Open

### FB-R2-UXD-FE-S3-20
- Mức độ: Minor
- Vị trí: `packages/ui/src/Button.tsx:44` (`disabled={disabled || busy}`), `app/useWrite.tsx`; `CheckInPage.tsx:211–217`; DS 6.21 (a11y)
- Vấn đề: (1) Đếm ngược DS 6.21 hiện trên nút `disabled` → focus rơi về `body`, người dùng bàn phím mất chỗ (FE giả định 9). **ORC đã chốt để R3** – UXD đồng ý, ghi lại để theo dõi. (2) Mọi lỗi khi bấm Nhận phòng đều bỏ tick "đã báo khách" (`setToldGuest(false)`), kể cả mất mạng/hết lượt tự thử – DS 6.3 chỉ yêu cầu bỏ tick khi `SURCHARGE_CHANGED`.
- Vì sao quan trọng: (1) a11y; (2) bắt lễ tân tick lại vô cớ, dễ thành thói quen tick không đọc.
- Đề xuất sửa: (1) R3: `Button` dùng `aria-disabled` khi `busy` có `busyLabel` (đếm ngược), chặn click trong handler. (2) Chỉ `setToldGuest(false)` khi `act.code === 'SURCHARGE_CHANGED'`.
- Trạng thái: Deferred (mục 1 – R3, ORC đã chốt); Open (mục 2)

### FB-R2-UXD-FE-S3-21
- Mức độ: Minor
- Vị trí: `pages/RoomsPage.tsx:57–60`, `:159`; `pages/RoomDrawer.tsx:235, 252, 271, 275, 282, 301, 364, 372`
- Vấn đề: Cảnh báo `FUTURE_RESERVATIONS_KEEP_ROOM` đúng mẫu (lưu xong mới báo, không chặn, có số đơn) nhưng nút "Đơn đặt phòng" mở danh sách chung, không lọc theo căn. H04 còn 9 style nội tuyến lệch lưới 4px (S2-15 chưa áp cho H04).
- Vì sao quan trọng: Lễ tân phải tự tìm các đơn tương lai của căn vừa ngừng bán.
- Đề xuất sửa: Link `/reservations?room={roomNo}` (hoặc ô tìm điền sẵn số căn); thay style bằng lớp DS 4.1 (`.card.inset`, `.caption`, `.mt-8`, `.field.flush`).
- Trạng thái: Open

### FB-R2-UXD-FE-S3-22
- Mức độ: Suggestion
- Vị trí: `DocsPanel.tsx:98–165`, `RegistrationPage.tsx:399–455`, `MoneyPage.tsx:716–731`
- Vấn đề: Số giấy tờ đầy đủ tự ẩn sau 60 giây, dữ liệu cổng sau 2 phút – đúng SEC, nhưng màn không báo trước; số tài khoản hoàn đầy đủ (C3) không tự ẩn như hai chỗ kia.
- Vì sao quan trọng: Lễ tân đang dò từng ô trên cổng thì bảng biến mất không báo.
- Đề xuất sửa: Câu `ci.full_autohide` {seconds} / `reg2.portal_autohide` {minutes} cạnh dữ liệu; số TK hoàn đầy đủ dùng cùng cơ chế 60 giây (SEC xác nhận).
- Trạng thái: Open

## B. MOB – guest-web

### FB-R2-UXD-MOB-S3-01
- Mức độ: Major
- Vị trí: `src/app/i18n.tsx:27–39` (`RU_UNREVIEWED_LEGAL`), `src/pages/GuestShell.tsx:110–116`, `src/checkin/CheckinFlow.tsx:327–330`, `:468–497`; content-guide mục 6 (mới), DS 6.17
- Vấn đề: **Quyết định UXD: đồng ý** giữ 7 chuỗi pháp lý bằng EN trên trang RU tới khi RU được duyệt bản ngữ (đúng 5.6 "không dịch máy"; bằng chứng ghi `locale=en` qua `shownLocale` – tốt). Nhưng cách hiện chưa đạt (đã chụp RU tối): (1) đoạn EN không có `lang="en"` – DOM chỉ có `html lang="ru"` → trình đọc màn hình đọc tiếng Anh bằng giọng Nga (WCAG 3.1.2, DS A7); (2) banner "Русская версия скоро – пока показываем английскую" hiện ở **mọi** màn, kể cả Giấy tờ, Giờ đến, Xong, Lưu trú vốn đã đủ RU → câu không đúng sự thật; (3) ở bước Xác nhận, câu RU "Остальные гости ответят…" xen giữa các đoạn EN, khách khó thấy đâu là phần pháp lý.
- Vì sao quan trọng: Đây là văn bản đồng ý lưu giấy tờ (Nghị định 13); khách phải hiểu đúng mình đồng ý gì và vì sao trang đổi ngôn ngữ.
- Đề xuất sửa: Điều kiện của quyết định: (a) gom 7 chuỗi trong một khối `<div lang="en">` (bước Thông báo: `guest.oci.why` + `gw.notice_body`; bước Xác nhận: câu hỏi + 2 lựa chọn + `consent_optional` + `withdraw_hint`), câu RU `guest.oci.companions_at_desk` đặt ngoài khối; (b) ngay trên khối hiện `gw.legal_en_notice` (chỉ khi `locale = 'ru'`); bỏ banner `guest.lang.ru_soon` toàn cục (giữ cho màn nào thật sự còn thiếu RU – hiện không còn); (c) giữ `locale=en` trong bằng chứng, `noticeVersion` không đổi; (d) gỡ khóa khỏi `RU_UNREVIEWED_LEGAL` khi bản RU được duyệt và ghi decision-log. **SEC cần đồng ký** (ORC giao "quyết cùng SEC").
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-02
- Mức độ: Minor
- Vị trí: `src/checkin/DocumentsStep.tsx:132–153`; DS 6.21
- Vấn đề: Gửi ảnh gặp `CONCURRENT_UPDATE` / `SERVICE_UNAVAILABLE` (server không ghi gì) → đi nhánh "lỗi", **xóa ảnh khỏi bộ nhớ**, khách phải chụp lại; chỉ lỗi mạng mới giữ ảnh và tự thử lại.
- Vì sao quan trọng: Khách đang ở sân bay/xe, chụp lại 2–4 ảnh cho mỗi người là bỏ cuộc.
- Đề xuất sửa: Xử lý hai mã này như `weak`: giữ ảnh, chờ `Retry-After` (thiếu → 2 giây, trần 10), tự gửi lại 1 lần cùng `Idempotency-Key`, rồi nút "Gửi lại ảnh"; câu `error.CONCURRENT_UPDATE` / `error.SERVICE_UNAVAILABLE` (đã có RU).
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-03
- Mức độ: Minor
- Vị trí: `src/pages/HomePage.tsx:31`, `:72–76`
- Vấn đề: Đến sau 22:00 → thẻ hiện "dự kiến đến 22:00+" (RU "прибытие около 22:00+") – ký hiệu "+" là mã nội bộ, "около 22:00+" sai nghĩa.
- Vì sao quan trọng: Khách đến khuya là nhóm cần hướng dẫn rõ nhất (DS 6.11: gọi người trực).
- Đề xuất sửa: `lateArrival` → `gw.oci_done_card_body_late` {n}{m}{time = etaTime ?? '22:00' – lấy từ khung giờ đã dùng ở bước Giờ đến}.
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-04
- Mức độ: Minor
- Vị trí: `src/checkin/DocumentsStep.tsx:264–271`
- Vấn đề: `guest.oci.uploading {n}/{total}` luôn truyền n = total ("Đang gửi ảnh 2/2 – 15%") vì cả nhóm ảnh gửi một lần; vùng `role="status" aria-live` đọc lại mỗi lần % đổi.
- Vì sao quan trọng: Thông tin sai; màn hình đọc nói liên tục (DS 6.21 a11y "không đọc từng giây").
- Đề xuất sửa: `gw.upload_progress` {count}{pct} hiện trên màn (không `aria-live`); một vùng `aria-live` riêng chỉ đọc lúc bắt đầu và `gw.upload_done` {person} khi xong.
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-05
- Mức độ: Minor
- Vị trí: `src/checkin/DocumentsStep.tsx:366–377`, `CheckinFlow.tsx:438`, `:503–515`; DS C1
- Vấn đề: "Tiếp tục" (Giấy tờ, Giờ đến) và "Gửi thủ tục" dùng `disabled` thật, không câu lý do (ở chế độ tối nút khóa gần như không đọc được – đã chụp RU tối). Nút Chụp đã làm đúng `aria-disabled` + `aria-describedby` – nên áp cùng cách.
- Vì sao quan trọng: Khách không biết thiếu gì (đặc biệt khi có 2–4 khách, phải cuộn tìm người còn thiếu).
- Đề xuất sửa: `aria-disabled` + câu `gw.next_needs_docs` / `gw.eta_first` / `gw.consent_first` cạnh nút; bấm khi khóa → cuộn/focus tới khách đầu tiên còn thiếu.
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-06
- Mức độ: Minor
- Vị trí: `src/styles.css` (`.lang-select` 0.9375rem); 37 `style={{…}}` (`HomePage.tsx` 9, `CheckinFlow.tsx` 12, `DocumentsStep.tsx` 6…); `CheckinFlow.tsx:201–203` (ký tự "‹")
- Vấn đề: Ô chọn ngôn ngữ 15px → iOS Safari phóng to trang khi chạm (DS C3: điện thoại 16px). Style nội tuyến lệch lưới 4px (`margin '4px 0 10px'`, `height:10`, `fontSize '1.375rem'`…) thay lớp DS 4.1. Nút Quay lại là ký tự "‹" thay icon `chevron` (nét khác bộ icon).
- Vì sao quan trọng: Nhất quán DS; trang khách bị phóng to bất ngờ khi đổi ngôn ngữ.
- Đề xuất sửa: `font-size: 1rem`; lớp `.mt-4/.mt-8/.mb-12`, `.sk + .sk`, `.card.cta` (UXD thêm nếu cần); `<Icon name="chevron" />` xoay 180°.
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-07
- Mức độ: Minor
- Vị trí: `src/pages/TerminalPage.tsx:81–101`; DS 6.11 ("luôn có lối thoát người thật"), mục 7
- Vấn đề: Trang "Quá nhiều lần" (429) chỉ là Alert, không tiêu đề, không nút gọi; trang "Cảm ơn bạn đã lưu trú" không có liên hệ (khách quên đồ, hỏi hóa đơn).
- Vì sao quan trọng: Khách bị chặn không có đường ra.
- Đề xuất sửa: 429 dùng `StateView` (icon clock) + `error.RATE_LIMITED` + nút `guest.contact.call` (SĐT từ phiên nếu có, `fallbackDeskPhone()`); trang đã trả phòng thêm nút gọi.
- Trạng thái: Open

### FB-R2-UXD-MOB-S3-08
- Mức độ: Suggestion
- Vị trí: `src/checkin/DocumentsStep.tsx:228–235` ("Gửi lại")
- Vấn đề: Bấm "Gửi lại" ở người đã gửi mở lại ô chụp nhưng không có cách quay lại trạng thái "Đã gửi" nếu bấm nhầm.
- Vì sao quan trọng: Khách tưởng ảnh cũ đã mất.
- Đề xuất sửa: Nút phụ "Giữ ảnh đã gửi" (dùng `common.cancel` hoặc chuỗi mới nếu cần) khi đang mở lại.
- Trạng thái: Open

## C. Phụ thuộc vai khác (không phải thẻ FE/MOB)
- ARC: `OnlineCheckin.imageRetentionDays` + `currentNoticeVersion` (MOB đã nêu – câu đồng ý đang viết cứng 30 ngày; FE H14 cũng viết cứng phiên bản); `getBill?locale=vi_en` (FE-S3-06); danh sách action nhật ký tiền đóng (FE-S3-09).
- SEC: đồng ký quyết định MOB-S3-01; xác nhận tự ẩn số TK hoàn (FE-S3-22).
- UXD tự làm R3: `reg2.retention_value` còn "30" viết cứng → `{days}`; hi-fi H13 nút "Gửi lễ tân trưởng xác nhận" cho chặn giấy tờ (BR-613 c) của FD không có API (OpenAPI: FD → 403) – sửa hi-fi thành câu hướng dẫn như FE đang làm; vẽ hi-fi màn chi hoàn (FE-S3-11).

## D. Khóa chuỗi mới (đã có trong `product/design/copy/strings-{vi,en}.json`; RU nháp cho `gw.*`)

| Nhóm / thẻ | Khóa | Tham số |
|---|---|---|
| H13 (FE-S3-04, 05, 12, 13, 18) | `checkin.steps_label`, `ci.submit_needs_told`, `ci.submit_needs_conditions`, `ci.request_title`, `ci.request_effect`, `ci.cond_doc_check_pending`, `checkin.verify.empty`, `checkin.warn.visa_expires_before_departure`, `checkin.warn.passport_expires_during_stay`, `ci.view_hide`, `ci.full_autohide` | `{n}`; `{room}`; `{seconds}` |
| H14 (FE-S3-12, 14, 22) | `reg2.portal_autohide`, `reg2.retention_pending`, `reg2.deadline_pending`, `common.duration_hm`, `common.duration_m` | `{minutes}`; `{h}{m}` |
| H15 (FE-S3-12, 14, 15) | `party.kind.adult`, `party.child_birth_year`, `party.reduce_count_body`, `party.reduce_submit`, `stay.charge_choose`, `room_change.price_same`, `room_change.price_delta`, `room_change.no_rooms`, `stay.toast.extended`, `stay.toast.late_set`, `stay.toast.moved`, `stay.toast.charge_added`, `stay.toast.undo_checkin`, `late.arrival_warning_alt` | `{n}`, `{amount}`, `{from}{to}`, `{date}`, `{time}`, `{room}`, `{item}`, `{eta}` |
| Thu tiền / VietQR (FE-S3-07) | `pay.vietqr_create`, `pay.qr_label`, `pay.qr_account`, `pay.copy_ref`, `pay.copy_amount`, `pay.cash_short` | `{amount}`, `{ref}`, `{account}` |
| H16 (FE-S3-04, 06) | `checkout.steps_label`, `checkout.overpay.needs_reason`, `bill.col_desc`, `bill.col_amount`, `bill.paid`, `bill.issued_at`, `bill.tax_code`, `bill.preview_note`, `bill.lang_label` | `{time}`, `{code}` |
| Đối soát / hoàn (FE-S3-11, 12, 14) | `recon.empty_title`, `recon.empty_body`, `recon.cash_received_toast`, `refund.empty_title`, `refund.empty_body`, `refund.method_label`, `refund.execute_effect_cash`, `refund.execute_effect_transfer` | `{amount}{code}`, `{method}` |
| Cần duyệt (FE-S3-10) | `approval.type.room_not_ready`, `approval.type.late_checkout`, `approval.type.no_show_restore`, `approval.approve_title.{refund,room_not_ready,late_checkout,no_show_restore}`, `approval.approve_body.{refund,room_not_ready,late_checkout,no_show_restore}`, `approval.reject_title_generic` | `{amount}`, `{code}` |
| Nhật ký tiền (FE-S3-09) | `mlog.a_payment_confirmed`, `mlog.a_qr_created`, `mlog.a_payment_expired`, `mlog.a_reconciled`, `mlog.a_reversed`, `mlog.a_cash_handover`, `mlog.a_line_reversed`, `mlog.a_folio_settled`, `mlog.a_stay_reversed`, `mlog.a_foc_requested`, `mlog.a_approval_rejected`, `mlog.a_approval_escalated`, `mlog.a_approval_cancelled`, `mlog.a_refund_destination`, `mlog.a_refund_cash_paid`, `mlog.a_refund_paid`, `mlog.a_deposit_confirmed`, `mlog.a_noshow_retained`, `mlog.a_other` | – |
| guest-web (MOB-S3-01, 03, 04, 05) | `gw.legal_en_notice`, `gw.oci_done_card_body_late`, `gw.upload_progress`, `gw.upload_done`, `gw.next_needs_docs`, `gw.eta_first`, `gw.consent_first` | `{n}{m}{time}`, `{count}{pct}`, `{person}` |

Chuỗi **đã sửa** (FE/MOB kiểm lại chỗ dùng): `ci.cond_balance`, `ci.effect_fee`, `co.change_due` – bỏ "đ"/"VND" cứng, `{amount}` nay phải kèm đơn vị (FE-S3-16); `mlog.a_payment` = "Ghi nhận thu tiền", `mlog.a_staff_payment` = "Sale/CTV ghi nhận thu · chờ đối soát", `mlog.a_line_added` = "Thêm dòng folio", `mlog.a_adjusted` = "Điều chỉnh dòng folio (đảo + dòng mới)" (bỏ chi tiết ví dụ viết cứng – FE-S3-09).

CSS mới: `hifi.css` mục 16 `.print-root` (FE-S3-06).

## Điểm làm tốt (nên giữ)
- **FE**: Mẫu DS 6.21 làm bài bản (`useWrite`: cùng `Idempotency-Key` + `If-Match`, đếm ngược trên nút, cảnh báo vàng `role=status` không đọc từng giây, hủy hẹn giờ khi rời màn) và áp cả cho hộp Sprint 2, H10, H12; **0 style nội tuyến** ở mọi màn Sprint 3 mới; phụ thu chủ động đúng DS 6.3 (công tắc → giờ → số tiền `aria-live` → tick "đã báo khách", `SURCHARGE_CHANGED` đọc lại preview); tách quyền hoàn tiền đúng rbac (FD chi tiền mặt có biên nhận, chuyển khoản chỉ MGR/OWN, số TK đầy đủ sau step-up); dữ liệu C3 chỉ trong state, tự ẩn 60 s / 2 phút / khi ẩn tab; VietQR vẽ tại chỗ từ `qrPayload` của server, không QR giả khi `PAYMENT_NOT_CONFIGURED`; sáng/tối hiển thị đúng token ở mọi màn đã chụp.
- **MOB**: Bộ chọn loại giấy tờ + "Bổ sung tại quầy" đúng cả 5 điểm UXD 8.3 (thứ tự theo ngôn ngữ, khách 1 không chọn sẵn, nút Chụp `aria-disabled` có lý do); RU tràn chữ không vỡ bố cục ở 375px (Seg tự xuống dòng, nút không cắt chữ); focus chuyển vào tiêu đề mỗi bước; bằng chứng đồng ý ghi đúng ngôn ngữ khách thực đọc (`shownLocale`); không lưu gì trên máy khách, token xóa khỏi URL trước khi render.

## E. Đợt 2 – Phản hồi & sửa: chuỗi còn thiếu cho FE/MOB (17/10, ORC giao)
- Đầu vào: `responses/s3-FE.md` (mục "Việc cần vai khác"), `responses/s3-MOB.md` (giả định màn fail closed), OpenAPI 0.3.6 bổ sung 2 (`FolioLine.labelKey`, `AuditEvent.action` tập đóng, `CheckoutSummary.extraNight*`/`postMidnightWindow`, `ExtensionOptions.currentBookingRateVnd`, mã `TIME_*`, `SURCHARGE_DECISION_REQUIRED`, `REFUND_SOURCE_NOT_RECONCILED`), `outputs/ARC/s3-contract.md` mục 7, BE `folio/public/line-labels.ts`.
- Kết quả: **72 chuỗi mới** (VI/EN; RU nháp cho 3 chuỗi `gw.oci_unavailable_*`), sửa 1 chuỗi. `gen_strings.py` 2300 chuỗi + 8 mẫu, 0 khóa trùng, tham số VI ↔ EN ↔ RU 0 lệch; `check_hifi.py` 25/25 ✓; test `@ottimo/i18n` 4/4, `admin-web` 142/142, `guest-web` 50/50 xanh. Content-guide 0.3.11 (mục 8 sinh lại). Chỉ sửa `product/design/**`, không commit.

### E.1 Khóa mới cho FE (admin-web)
| Nhóm | Khóa | Tham số / ghi chú |
|---|---|---|
| Giờ nhập tay (E03-07) | `field.TIME_AFTER_ACTION`, `field.TIME_NOTE_REQUIRED` | Tra tự động qua `field.<CODE>`; lỗi `TIME_NOTE_REQUIRED` gắn vào ô ghi chú giờ |
| | `checkin.time_note`, `checkout.time_note`, `stay.time_note_help` | Nhãn + trợ giúp ô `checkinTimeNote` / `checkoutTimeNote` (thay `stay.note`) |
| Phụ thu (DOM S3-12) | `field.SURCHARGE_DECISION_REQUIRED` | – |
| Hoàn tiền (E15-05) | `error.REFUND_SOURCE_NOT_RECONCILED` | `{amount}` ← `Problem.unreconciledVnd` qua `money()`; thay câu lỗi máy chủ đang hiện |
| Trả phòng – tính thêm 1 đêm (E05-11) | `checkout.extra_night_title`, `checkout.extra_night_body`, `checkout.extra_night_rate_label`, `checkout.extra_night_rate_help`, `checkout.extra_night_unavailable`, `checkout.post_midnight` | `{amount}` (body) = giá đêm thêm đang nhập; `_unavailable` khi `extraNightAvailable=false`; `post_midnight` tùy chọn khi `postMidnightWindow=true` |
| Gia hạn (E04-07) | `extend.keep_rate`, `extend.keep_rate_help` | `{amount}` ← `currentBookingRateVnd` (nút chỉ hiện khi ≠ null) |
| Phiếu thanh toán – `FolioLine.labelKey` (22 khóa hợp đồng) | `bill.line.room_night`, `extra_night`, `extra_person`, `early_checkin`, `late_checkout`, `early_departure_fee`, `overpayment_retained`, `room_change`, `minibar`, `cancellation_fee`, `no_show_fee`, `foc`, `discount`, `laundry`, `adhoc_cleaning`, `smoking_fee`, `key_card_fee`, `damage`, `fnb`, `service_fee`, `utilities`, `adjustment` | Tham số đúng theo `labelParams` của hợp đồng; `{date}` dd/MM; `{pct}` có trong params nhưng không in lên phiếu |
| Biến thể khi có tham số tùy chọn | `bill.line.room_night_room` {room}, `bill.line.extra_night_room` {room}, `bill.line.extra_person_count` {count}, `bill.line.early_departure_fee_notice` {noticeDays}, `bill.line.foc_reason` {reason}, `bill.line.discount_reason` {reason} | **Quy tắc:** server gửi tham số tùy chọn → dùng biến thể; không gửi → khóa gốc (để không bao giờ hiện `{room}` trần). `{reason}` là mã lý do → dịch qua `foc.r_*` trước khi truyền |
| Nhật ký tiền – đủ tập đóng 49 action | `mlog.a_ota_collected`, `a_ota_collect_adjusted`, `a_foc_posted`, `a_foc_rejected`, `a_damage_posted`, `a_damage_rejected`, `a_cancellation_fee`, `a_debt_on_checkout`, `a_early_departure`, `a_extended`, `a_prior_night_added`, `a_extra_night_on_checkout`, `a_priced`, `a_repriced`, `a_room_change_repriced`, `a_commission_projected`, `a_commission_earned`, `a_commission_voided`, `a_channel_fee_recorded`, `a_channel_fee_updated`, `a_relocation_cost`, `a_approval_requested`, `a_approval_self_applied`, `a_approval_approved`, `a_approval_reopened`, `a_receiving_account_changed` | Xem bảng E.3 |

**Sửa:** `field.LATE_CHECKOUT_AFTER_LIMIT` = "Giờ này quá mốc trả muộn nên tính thêm 1 đêm. Khi trả phòng: nhập giá đêm thêm. Khi khách muốn ở lại: dùng Gia hạn." (bỏ câu cũ "Dùng Gia hạn" – sai với BR-416 v0.3.4 / DOM S3-9; vẫn đúng cho `setLateCheckout`). `late.treat_as_extension` (hộp Trả muộn) giữ nguyên vì ở đó khách ở lại thật.

**Mock FE lệch hợp đồng:** mock đang trả `bill.line.charge`, `bill.line.room_change_difference`, `bill.line.deposit_forfeit` – ba khóa này **không** có trong danh sách đóng của `FolioLine.labelKey`. BE (`line-labels.ts`) đổi `room_change_difference` → `bill.line.room_change`, `deposit_forfeit` → `bill.line.overpayment_retained`, khoản phát sinh theo danh mục → khóa của loại đó (`laundry`, `fnb`, `service_fee`…) hoặc `bill.line.adjustment`. UXD không thêm ba khóa ngoài hợp đồng; đề nghị FE sửa mock theo `line-labels.ts`.

### E.2 Khóa mới cho MOB (guest-web, VI/EN/RU nháp)
| Khóa | Dùng khi |
|---|---|
| `gw.oci_unavailable_title`, `gw.oci_unavailable_body` | Màn fail closed (thiếu văn bản đúng `currentNoticeVersion` hoặc thiếu `imageRetentionDays`) – thay `guest.cta.checkin` + `guest.late.not_ready`. Câu không nêu lý do kỹ thuật với khách |
| `gw.oci_unavailable_late` {time} | Dòng phụ dưới thân, `{time}` = mốc "đến khuya" của khung giờ đến; giữ nút `guest.contact.call` và `gw.back_home` như hiện tại |

### E.3 Bảng tra `AuditEvent.action` → câu (tập đóng 0.3.6 bổ sung 2 – 49 mã, đủ)
| Action | Khóa | Action | Khóa |
|---|---|---|---|
| `payment.recorded` | `mlog.a_payment` / `mlog.a_staff_payment` (theo `after.recordedByRole`) | `reservation.no_show_deposit_retained` | `mlog.a_noshow_retained` |
| `payment.qr_created` | `mlog.a_qr_created` | `reservation.cancellation_fee` | `mlog.a_cancellation_fee` |
| `payment.confirmed_received` | `mlog.a_payment_confirmed` | `reservation.debt_on_checkout` | `mlog.a_debt_on_checkout` |
| `payment.expired` | `mlog.a_payment_expired` | `reservation.early_departure` | `mlog.a_early_departure` |
| `payment.reconciled` | `mlog.a_reconciled` | `reservation.extended` | `mlog.a_extended` |
| `payment.cash_handover_confirmed` | `mlog.a_cash_handover` | `reservation.prior_night_added` | `mlog.a_prior_night_added` |
| `payment.reversed` | `mlog.a_reversed` | `reservation.extra_night_on_checkout` | `mlog.a_extra_night_on_checkout` |
| `payment.ota_collected` | `mlog.a_ota_collected` | `reservation.priced` | `mlog.a_priced` |
| `payment.ota_collect_adjusted` | `mlog.a_ota_collect_adjusted` | `reservation.repriced` | `mlog.a_repriced` |
| `folio.line_posted` | `mlog.a_line_added` | `reservation.room_change_repriced` | `mlog.a_room_change_repriced` |
| `folio.line_reversed` | `mlog.a_line_reversed` | `reservation.closer_changed` | `mlog.a_closer_changed` {from}{to} |
| `folio_line.adjusted` | `mlog.a_adjusted` | `commission.projected` / `earned` / `voided` | `mlog.a_commission_projected` / `_earned` / `_voided` |
| `folio.settled` | `mlog.a_folio_settled` | `channel_fee.recorded` / `updated` | `mlog.a_channel_fee_recorded` / `_updated` |
| `folio.stay_reversed` | `mlog.a_stay_reversed` | `overbooking.relocation_cost` | `mlog.a_relocation_cost` |
| `folio.foc_requested` | `mlog.a_foc_requested` | `approval.requested` | `mlog.a_approval_requested` (thay `a_foc_requested` FE đang dùng) |
| `folio.foc_posted` | `mlog.a_foc_posted` (thay `a_foc_approved` FE đang dùng) | `approval.self_applied` | `mlog.a_approval_self_applied` |
| `folio.foc_rejected` | `mlog.a_foc_rejected` (thay `a_approval_rejected`) | `approval.approved` | loại `foc`/`special_discount` → `mlog.a_foc_approved`; loại khác → **`mlog.a_approval_approved`** + nhãn loại (`approval.type.*` / `refund.title`) |
| `folio.damage_posted` / `damage_rejected` | `mlog.a_damage_posted` / `_rejected` | `approval.rejected` / `escalated` / `cancelled` | `mlog.a_approval_rejected` / `_escalated` / `_cancelled` |
| `refund.destination_set` | `mlog.a_refund_destination` | `approval.reopened` | `mlog.a_approval_reopened` |
| `refund.paid` / `refund.cash_paid` | `mlog.a_refund_paid` / `mlog.a_refund_cash_paid` | `config.changed` | `mlog.a_receiving_account_changed` |
| `deposit.shortfall_accepted` | `mlog.a_shortfall_accepted` {amount} | `reservation.deposit_confirmed` | `mlog.a_deposit_confirmed` |

Mã ngoài bảng (không nên xảy ra vì tập đóng) → `mlog.a_other` + mã chữ nhỏ, như FE đang làm.

### E.4 Giả định đợt 2
- Câu thân `checkout.extra_night_body` nói "thay cho phụ thu trả muộn" theo 7.1-2 ARC ("thêm đêm + B18 trong một giao dịch, không phụ thu trả muộn").
- `bill.line.early_checkin` / `late_checkout` chỉ in giờ, không in %, giống hi-fi H16 16.5 (`co.line_late`); % giữ trong `labelParams` cho Desk nếu cần.
- `bill.line.laundry` ghi đơn vị "kg" vì mã phát sinh hiện hành là `LAUNDRY_KG`; nếu danh mục thêm giặt theo món thì cần biến thể mới.
- Không có ESC mới.

## F. Đợt 3 – chuỗi cho bản sửa lỗi QA của FE (17/10, ORC giao)
| Khóa | VI | EN | Dùng khi |
|---|---|---|---|
| `ci.go_handover` | Tiếp tục: Giao mã & hoàn tất | Continue: Hand over & finish | H13 nút bước 3 → 4 (BUG-R2-032), thay `common.next`; cùng mẫu `ci.go_*`, tên bước khớp `checkin.step.handover` |
| `error.field_named` | Mục "{label}": {message} | "{label}": {message} | Lỗi ở trường không có ô trên màn (BUG-R2-052), ví dụ: Mục "Đã gửi/giao nội quy (VI/EN) cho khách": Bắt buộc. `{label}` = nhãn nút/ô tích tương ứng (không dùng tên trường kỹ thuật); `{message}` = câu `field.*` / `common.required`. Mã có câu riêng đủ nghĩa thì giữ nguyên, không ghép |

`gen_strings.py` 2302 chuỗi + 8 mẫu, 0 khóa trùng, tham số 0 lệch; `check_hifi.py` 25/25 ✓; content-guide 0.3.12 (mục 8 sinh lại). Chỉ sửa `product/design/**` và file này, không commit.

## G. Đợt 4 – `reg2.consent_q` theo tham số (17/10, ORC giao)
- `reg2.consent_q` = "Khách có đồng ý lưu ảnh giấy tờ {days} ngày sau trả phòng không?" / "Does the guest agree to OTTIMO keeping ID photos for {days} days after check-out?" – `{days}` ← `Registration.consentNotice.imageRetentionDays` (bỏ số 30 viết cứng). FE truyền `{ days }`; chưa truyền thì câu hiện `{days}` trần.
- Hi-fi H14 thêm `data-i18n-args` (ví dụ 30). `gen_strings.py` 2302 chuỗi, `check_hifi.py` 25/25 ✓; content-guide 0.3.13.
- `reg2.retention_value` = "Tự xóa {days} ngày sau trả phòng ({date})" / "Auto-deleted {days} days after check-out ({date})" – đổi cùng đợt theo ORC (FE chuyển cả hai khóa trong cùng lượt); hi-fi H14 thêm `days` vào `data-i18n-args`.
