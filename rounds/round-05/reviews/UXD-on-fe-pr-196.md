# UXD review – FE PR #196 (`r5-fb012-golive-fe` @ `af9b0523`): gói sửa trước ra mắt FB-INV-012 (contract §12)

- Người review: UXD | Round 5 – bước **Review** | 18/11/2026
- Cách kiểm:
  - đọc `gh pr diff 196`: chuỗi `bd.*`, `od.*`, `pc.*`, `params.lscf.*`, `charge.price_source.*`, `meters.catch_up_*`, `meters.past_late`, `meters.backdated_help`, `field_error.*` mới, `stmt.warning.READING_CATCH_UP`; các file `LongStayDialog.tsx`, `BackdatedCheckInDialog.tsx`, `StatementDrawer.tsx`, `PropertyContact.tsx`, `cleaningFeeParams.tsx`, `MetersPage.tsx`, `MeterCheckinDialog.tsx`, `StayDialogs.tsx`, `statements.css`;
  - xem ảnh FE 01–09 ở scratchpad của ORC (dữ liệu giả, không vào repo). Ảnh chụp 19:04, commit 19:05: ảnh 06 có thể lệch code (xem thẻ 196-07);
  - đối chiếu: contract §12.1–12.5, `SEC-on-arc-contract-12.md` (12-01, 12-02, 12-03, 12-07), `FE-responses.md` mục Go-live fix, `DOM-late-entry-proposal.md` §3.3, `brand-guidelines.md`, bảng chuỗi hiện có trên `origin/main`.
- Không chạy app. Ô ngày hiện dạng MM/DD/YYYY trong ảnh là do locale của Chromium dùng để chụp, không phải lỗi PR.

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN (UXD).** Có 1 Major (196-01): tên và lời giải thích của "Paid outside Desk". Ở tiếng Anh, chữ "desk" đã được dùng với nghĩa quầy (`checkout.time_prefilled_help`: "the desk clock"). Vì vậy lễ tân dễ đọc "Paid outside Desk" thành "khách trả ở ngoài quầy", tức là trả tiền mặt cho ai đó. Sửa 196-01 chỉ là sửa chuỗi trong `gen_strings.py`, không đổi code hay API. Sửa xong thì gộp được. Các thẻ Minor nên làm trước tag v1.0.7, nhưng không chặn gộp.

**Thương hiệu: đạt.**
- Không có mã màu viết cứng trong diff.
- CSS mới dùng biến (`var(--sans)`).
- Chip nguồn giá `tone="long"` dùng Sage Deep trong bảng màu, không phải màu xanh #5B7387 cũ.
- Mã tham chiếu và hotline dùng JetBrains Mono (`input mono`).
- Không có emoji.
- Màu đỏ nút nguy hiểm (#A8403C) là màu chức năng đã ghi ngoại lệ trong guideline. Tuy vậy, nút xác nhận "ngoài Desk" không nên dùng màu đỏ (196-07).

| Thẻ | Mức | Nội dung |
|---|---|---|
| 196-01 | **Major** | "Paid outside Desk" dễ bị hiểu là thu tiền mặt. Đổi sang "outside the app", nói rõ lúc này không thu tiền và trỏ sang "Record payment" |
| 196-02 | Minor | VI gọi chủ là "chủ cơ sở", trong khi cả app (`role.owner`) dùng "chủ đầu tư". Ngày nhận tiền có 3 cách gọi khác nhau |
| 196-03 | Minor | Câu chữ `bd.*`: "Khách đã ở" mơ hồ, "before Desk", "The time recorded is now", ngày vào và ngày đến dùng lẫn nhau |
| 196-04 | Minor | Form dài hạn: checkbox của trình duyệt thay vì `Checkbox` của DS; câu "ngày 01" làm lệch hàng Căn / Ngày vào / Ngày ra |
| 196-05 | Minor | Chỉ số nhận phòng bù, FD thấy `meters.late_fd` kèm ngày đến, nên đọc thành "đã hết hạn chốt (01/11)". Sai nghĩa |
| 196-06 | Minor | Bảng giá dọn thêm: câu "Căn không có trong bảng", "ad-hoc / dọn lẻ", lịch sử bị vỡ cột, nhãn "H3" |
| 196-07 | Minor | Ảnh 06 cho thấy nút xác nhận màu đỏ, còn code là `danger={false}`. Cần chụp lại. Ô số tiền chưa có dấu phân cách |
| 196-08 | Suggestion | Với MGR, mặc định số tiền "ngoài app" nên là phần tiền thuê còn nợ, và báo giới hạn trước khi bấm, thay vì để 403 sau khi xác nhận |

---

### FB-R5-UXD-FE-196-01
- Mức độ: Major
- Vị trí:
  - `product/design/tools/gen_strings.py`, nhóm "R5 FB-INV-012 §12", các khóa `payment.method.outside_desk`, `od.action`, `od.help`, `od.confirm_title`, `od.confirm_body`, `od.confirm`, `od.saved`, `od.need_device`, `bd.next_help` (sinh ra `strings-en.json` / `strings-vi.json`);
  - màn hình: S16 ngăn chi tiết phiếu (ảnh 05, 06), hộp "Đã nhận phòng bù" (ảnh 04), nhãn phương thức trong folio và Nhật ký tiền.
- Vấn đề:
  1. **"Desk" vừa là tên app vừa là quầy.** Ở EN, "Paid outside Desk" đọc tự nhiên thành "paid outside the desk", tức không trả tại quầy. Bảng chuỗi hiện có đã dùng "desk" theo nghĩa quầy: `checkout.time_prefilled_help` ("from the desk clock"), `party.surcharge_waiver_note` ("the desk can't request…"). Lễ tân hay quản lý cầm tiền mặt khách đưa ngoài quầy, hoặc khách chuyển thẳng cho chủ, rất dễ bấm nút này. Đây đúng là đường "xóa nợ không có tiền vào quầy" mà SEC 12-02 lo.
  2. Những chỗ khác trong app đã gọi việc làm ngoài hệ thống là **"outside the app / ngoài app"**: `lsm.deposit` "Security deposit held (outside app)", `lsm.flag` "Lease outside the app", `early_departure.lease_done_note`. Riêng PR này dùng "outside Desk", nên lệch thuật ngữ.
  3. Ở VI, nút ngăn phiếu "Đã thu ngoài Desk" nằm ngay cạnh nút chính "Ghi đã thu" (ảnh 06). Nút gửi của form lại là "Ghi đã thu ngoài Desk", gần như trùng chữ với "Ghi đã thu". Nhìn lướt, hai nút giống nhau.
  4. `od.help` và `od.confirm_body` chỉ nói khoản này *không vào* ca hay đối soát. Không câu nào nói thẳng **"lúc này không thu tiền"**. Cũng không câu nào chỉ đường đúng cho tiền mặt, chuyển khoản hay VietQR nhận hôm nay.
  5. `od.confirm_body` viết "a manager reverses it" / "quản lý đảo khoản". Nút có sẵn trong app tên là "Reverse payment / Đảo giao dịch" (`pay.reverse`). Chủ đầu tư (OWN) cũng đảo được.
- Vì sao quan trọng: ghi nhầm khoản tiền mặt thành "ngoài app" thì tiền không vào ca, không vào bàn giao, không đối soát, và không hoàn được. Kết quả là sai tiền mà không có lỗi nào báo. Người dùng ở đây là lễ tân hay quản lý đang vội, đọc lướt và thường đọc EN.
- Đề xuất sửa (chỉ chuỗi, giữ nguyên khóa, code và API):

| Khóa | EN | VI |
|---|---|---|
| `payment.method.outside_desk` | Paid outside the app | Đã trả ngoài app |
| `od.action` | Paid outside the app | Khách đã trả ngoài app |
| `od.help` | For money the guest already paid outside the app, for example on the old platform. No money is taken now. Cash, transfer or VietQR received today: use Record payment. The owner is notified each time. | Cho khoản khách đã trả từ trước, ngoài app, ví dụ trên nền tảng cũ. Lúc này không thu tiền. Tiền mặt, chuyển khoản hay VietQR nhận hôm nay: dùng Ghi đã thu. Chủ đầu tư được báo mỗi lần ghi. |
| `od.confirm_title` | Record {amount} VND as already paid outside the app? | Ghi {amount} đ là khách đã trả ngoài app? |
| `od.confirm_body` | No money is taken now. This amount stays out of shifts, reconciliation and the cash handover, and it can't be refunded. If it's wrong, a manager or the owner uses Reverse payment. | Lúc này không thu tiền. Khoản này không vào ca, đối soát hay tiền mặt bàn giao, và không hoàn được. Ghi nhầm thì quản lý hoặc chủ đầu tư dùng Đảo giao dịch. |
| `od.confirm` | Record as paid outside the app | Ghi khách đã trả ngoài app |
| `od.saved` | Recorded as paid outside the app | Đã ghi: khách đã trả ngoài app |
| `od.need_device` | Recording a payment made outside the app works only on an approved device. | Ghi khoản đã trả ngoài app chỉ làm được trên máy được cấp quyền. |
| `bd.next_help` | Next: record the check-in meter reading from the paper log (late, with a reason), then the arrival-month statement. If the guest already paid outside the app, issue the statement, then use Paid outside the app. | Tiếp theo: ghi chỉ số nhận phòng theo sổ giấy (ghi trễ, cần lý do), rồi lập phiếu tháng nhận phòng. Khách đã trả ngoài app thì phát hành phiếu rồi bấm Khách đã trả ngoài app. |

  - Ghi chú khóa `od.*`: khóa vẫn tên `outside_desk` vì khớp enum API. Chỉ đổi chữ hiển thị.
  - ARC sửa câu ví dụ nhãn "Outside Desk · Thu ngoài Desk" ở contract §12.2 (bảng "Phương thức mới…", dòng báo cáo) thành "Paid outside the app · Đã trả ngoài app". BE không phát chữ hiển thị nên không phải sửa.
  - Test `fb012-golive-fe.test.tsx` dùng `tv('od.*')` nên tự theo chuỗi mới.
- Trạng thái: Closed – UXD kiểm lại 19/11 trên main `93f48941`: 9 khóa đúng bảng (`gen_strings.py`). Còn việc của ARC: câu nhãn ví dụ ở contract §12.2

### FB-R5-UXD-FE-196-02
- Mức độ: Minor
- Vị trí: `pc.help`, `od.owner_only`, `od.received_on`, `od.date_future` (`gen_strings.py`). Ảnh 05, 07.
- Vấn đề:
  1. VI dùng "chủ cơ sở" ở 3 chuỗi mới. Cả app đang dùng **"chủ đầu tư"** (`role.owner` = "Chủ đầu tư"; 40 chuỗi hiện có, ví dụ thẻ VietQR ngay trên khối Liên hệ cơ sở ở ảnh 07: "Chỉ chủ đầu tư xem và đổi được"). Hai thẻ cạnh nhau mà gọi cùng một người bằng hai tên.
  2. Ngày khách trả tiền có 3 cách gọi: EN nhãn "Date received", VI nhãn "Ngày khách đã trả", VI lỗi "Ngày nhận".
  3. `od.owner_only` dài và khó đọc khi bị 403.
- Vì sao quan trọng: quản lý gặp 403 cần hiểu ngay ai làm được và vì sao. Gọi lệch tên vai làm họ phải đoán.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `pc.help` | Printed at the foot of monthly statements and on the public room page. Only the owner can change it. *(giữ)* | In ở chân phiếu tháng và trang công khai của căn. Chỉ chủ đầu tư sửa được. |
| `od.received_on` | Date the guest paid | Ngày khách đã trả |
| `od.date_future` | The date the guest paid can't be after today. | Ngày khách đã trả không được sau hôm nay. |
| `od.owner_only` | Only the owner can record this. A manager can record only the rent on the arrival-month statement of a backdated check-in, paid on or before that check-in. | Chỉ chủ đầu tư ghi được khoản này. Quản lý chỉ ghi được tiền thuê trên phiếu tháng nhận phòng của đơn nhận phòng bù, khách trả trước hoặc đúng ngày nhận phòng bù. |
- Trạng thái: Closed – UXD kiểm lại 19/11: `pc.help`, `od.received_on`, `od.date_future`, `od.owner_only` đúng bảng. `od.owner_only` được mở rộng ở thẻ 196-10

### FB-R5-UXD-FE-196-03
- Mức độ: Minor
- Vị trí: `bd.in_house_toggle`, `bd.in_house_help`, `bd.reason_help`, `bd.first_of_month`, `bd.checkin_body`, `bd.arrival_real`. Ảnh 01, 03.
- Vấn đề:
  1. VI "Khách đã ở" có thể hiểu là "đã từng ở (đã đi)". EN "Guest already in house" thì rõ.
  2. "moved in before Desk" và "signed before Desk" là câu cụt, vì "Desk" không phải mốc thời gian.
  3. Trong form, ô ngày có nhãn **"Move-in date / Ngày vào"** (`lsm.move_in`). Lời giải thích lại nói "real arrival date / ngày đến thật", còn hộp nhận phòng bù dùng "Actual arrival date". Cùng một khái niệm mà có 3 cách gọi; "real" và "actual" lẫn nhau.
  4. `bd.checkin_body` có câu "The time recorded is now." Câu này khó hiểu: giờ nào được ghi?
  5. `bd.first_of_month` dùng chữ "the month being closed", là thuật ngữ nội bộ.
- Vì sao quan trọng: quản lý chỉ làm việc này vài lần lúc ra mắt, nên câu chữ phải tự giải thích được, không cần hỏi lại.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `bd.in_house_toggle` | Guest already in house *(giữ)* | Khách đang ở từ trước |
| `bd.in_house_help` | The guest moved in before this booking was entered. Set Move-in date to the actual date, up to 45 days ago. Backdated bookings have no closer and earn no commission. | Khách đã vào ở trước khi đơn được nhập. Chọn Ngày vào là ngày đến thật, lùi tối đa 45 ngày. Đơn nhập bù không có người chốt, không tính hoa hồng. |
| `bd.reason_help` | For example: paper lease signed before we used Desk. | Ví dụ: hợp đồng giấy ký trước khi dùng Desk. *(giữ)* |
| `bd.first_of_month` | Moved in before the 1st of the month now being billed? Choose the 1st and write the real lease start in the note. | Khách ở từ trước ngày 01 của tháng đang lập phiếu: chọn ngày 01, ghi ngày bắt đầu hợp đồng thật vào ghi chú. |
| `bd.checkin_body` | Records that the guest has been in the room since the actual arrival date. No check-in time, surcharge or payment is taken. The log shows the time you confirm. | Ghi nhận khách đã ở trong căn từ ngày đến thật. Không ghi giờ nhận phòng, không phụ thu, không thu tiền. Nhật ký lưu giờ bạn bấm xác nhận. |
| `bd.arrival_real` | Actual arrival date *(giữ)* | Ngày đến thật *(giữ)* |
- Trạng thái: Closed – UXD kiểm lại 19/11: các khóa `bd.*` đúng bảng

### FB-R5-UXD-FE-196-04
- Mức độ: Minor
- Vị trí: `LongStayDialog.tsx`, khối `canBackdate` và `Field label={t('lsm.move_in')}`. Ảnh 01.
- Vấn đề:
  1. Ô "Khách đã ở" dùng `<input type="checkbox">` của trình duyệt kèm `<b>`. DS có `Checkbox` (`@ottimo/ui`, đã dùng trong `StayDialogs.tsx`). Ô của trình duyệt có màu, vùng chạm và vòng focus khác các ô khác trong Desk.
  2. `bd.first_of_month` đặt làm help của ô Ngày vào, nằm trong cột hẹp 1/3 nên bị bẻ thành 3 dòng. Hàng Căn / Ngày vào / Ngày ra lệch nhau: ô Căn bị kéo cao, ô Ngày ra trôi xuống.
- Vì sao quan trọng: đây là form cho hai việc nhạy cảm (nhập bù, giữ căn). Lệch DS và lệch hàng làm form trông như chưa xong, và khó quét mắt.
- Đề xuất sửa:
  - Dùng `<Checkbox checked={inHouse} disabled={!deviceTrusted} label={t('bd.in_house_toggle')} … />`.
  - Chuyển `bd.first_of_month` lên khối help của ô bật/tắt, ngay dưới `bd.in_house_help` và chỉ hiện khi `inHouse`. Ô Ngày vào không còn help riêng.
- Trạng thái: Closed – theo FE Lượt 2 (dùng `Checkbox`, chuyển câu "ngày 01" lên khối ô bật/tắt). UXD chưa xem ảnh mới, QA kiểm khi chụp v1.0.7

### FB-R5-UXD-FE-196-05
- Mức độ: Minor
- Vị trí: `MeterCheckinDialog.tsx`, nhánh `backdated && !lead`, đang dùng `meters.late_fd` với `date: segmentFrom`.
- Vấn đề: với FD, đơn nhận phòng bù hiện câu "Đã hết hạn chốt (01/11). Nhờ lễ tân trưởng ghi trễ kèm lý do." Ngày 01/11 là ngày đến, không phải hạn chốt, nên câu sai nghĩa. FD sẽ tưởng đã trễ hạn và đi báo nhầm.
- Vì sao quan trọng: câu báo phải nói đúng lý do bị chặn, theo DOM §3.3: không nói chung chung, không sai ngày.
- Đề xuất sửa: thêm khóa mới và dùng cho nhánh này (không truyền ngày).

| Khóa mới | EN | VI |
|---|---|---|
| `meters.backdated_fd` | Backdated check-in: the reading from the paper log is always late. Ask the front desk lead to record it, with a reason. | Nhận phòng bù: chỉ số theo sổ giấy luôn là ghi trễ. Nhờ lễ tân trưởng ghi, kèm lý do. |
- Trạng thái: Closed – UXD kiểm lại 19/11: có `meters.backdated_fd`, không truyền ngày

### FB-R5-UXD-FE-196-06
- Mức độ: Minor
- Vị trí: `params.lscf.help`, `params.lscf.empty`, `cleaningFeeParams.tsx` (`LscfFields`), hộp sửa tham số (lịch sử, nhãn quy tắc). Ảnh 09.
- Vấn đề:
  1. Màn hình là lưới ô theo căn, không phải bảng, nên câu "Rooms not listed / Căn không có trong bảng" không khớp với cái người dùng thấy.
  2. "ad-hoc cleaning / dọn lẻ" lệch với tên trên bill và phiếu buồng: `bill.line.adhoc_cleaning` "Extra cleaning / Dọn phòng thêm", và tên khóa mới "Extra cleaning for long stays".
  3. Ô trống không cho biết giá chung là bao nhiêu, nên người đặt giá phải mở tab khác để xem.
  4. Cột "Mới" của bảng lịch sử in nguyên câu `params.lscf.empty`, bị bẻ mỗi chữ một dòng, đẩy cột "Lý do" ra ngoài khung.
  5. Huy hiệu "H3" là mã quyết định trong contract. Các tham số khác hiện mã BR (BR-LS-07…).
- Vì sao quan trọng: OWN và MGR đặt giá thật cho production theo QC điều kiện 3. Câu chữ sai hình dạng và thiếu giá chung dễ dẫn tới bỏ trống nhầm.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `params.lscf.help` | Leave a room blank to use the standard extra-cleaning price ({price}). Short stays always use the standard price. | Để trống thì căn dùng giá dọn thêm chung ({price}). Khách ngắn ngày luôn dùng giá chung. |
| `params.lscf.empty` | Not set – every room uses the standard price *(giữ)* | Chưa đặt – mọi căn dùng giá dọn thêm chung |
| `params.lscf.empty_short` *(mới)* | Not set | Chưa đặt |

  - `{price}` lấy giá hiệu lực của `adhoc_cleaning_fee`. Nếu chưa tải được thì bỏ cặp ngoặc, dùng câu không có `{price}`.
  - Ô trống có `placeholder` = giá chung, màu chữ muted.
  - Ô lịch sử dùng `formatLscf` với `empty_short`.
  - Nhãn quy tắc: dùng mã BR do DOM gán cho H3. Nếu DOM chưa gán thì dùng BR-LS-07 như contract §12.4 dẫn. Không hiện "H3".
- Trạng thái: Closed – UXD kiểm lại 19/11: chuỗi đúng, có thêm `params.lscf.help_noprice`. Ghi chú: 12.4 đang ẩn ở v1.0.7 (`goLiveDeferred.cleaningByRoom = false`). BE cần đặt `br_ref` = `BR-LS-07` khi bật lại

### FB-R5-UXD-FE-196-07
- Mức độ: Minor
- Vị trí: `StatementDrawer.tsx` (`ConfirmDialog … danger={false}`, ô số tiền). Ảnh 05, 06.
- Vấn đề:
  1. Ảnh 06 cho thấy nút xác nhận "Ghi đã thu ngoài Desk" màu đỏ (variant `danger`). Code tại `af9b0523` truyền `danger={false}`, tức nút chính Ink, khớp FE-8. Ảnh được chụp 19:04, trước commit 19:05, nên chưa có bằng chứng giao diện thật khớp code.
  2. Ô số tiền hiện "7901000" không có dấu phân cách. Tiêu đề xác nhận lại hiện "7.901.000 đ". Với số 7 chữ số, thiếu dấu chấm là dễ gõ thừa hoặc thiếu một số 0.
- Vì sao quan trọng: đây là thao tác về tiền. Màu nút phải nói đúng tính chất (ghi nhận, không phải xóa), và con số phải đọc được ngay khi gõ.
- Đề xuất sửa:
  - Giữ `danger={false}`.
  - Sau khi sửa 196-01, chụp lại ảnh 05/06 (VI và EN) và đính vào PR.
  - Ô số tiền dùng cùng cách hiển thị tiền như ô "Ghi đã thu" hiện có: nhóm nghìn khi rời ô (blur), kèm hậu tố "đ" (`input-affix`). Nếu ô "Ghi đã thu" chưa làm vậy, ghi Deferred và thêm vào backlog DS cho cả hai ô.
- Trạng thái: Closed – theo FE Lượt 2: nút có class `btn pri`; `VndInput` có nhóm nghìn và hậu tố đ/VND. Phần nhãn thừa "(đ)" xử lý ở thẻ 196-11

### FB-R5-UXD-FE-196-08
- Mức độ: Suggestion
- Vị trí: `StatementDrawer.tsx`, giá trị mặc định của số tiền ở form "ngoài app".
- Vấn đề:
  - Mặc định là toàn bộ "Còn phải thu", kể cả điện, nước và dịch vụ.
  - Theo SEC 12-02, MGR chỉ ghi được phần tiền thuê, trên phiếu tháng nhận phòng của đơn nhận phòng bù. Nếu phiếu có dòng khác, MGR điền xong, xác nhận xong mới nhận 403 `od.owner_only`.
- Đề xuất:
  - Với MGR, mặc định = tiền thuê trên phiếu trừ phần đã thu.
  - Hiện một dòng help dưới ô số tiền. EN "Managers: rent only, up to {amount} VND." VI "Quản lý: chỉ tiền thuê, tối đa {amount} đ." (khóa mới `od.manager_cap`).
  - Server vẫn là bên quyết định. Đây chỉ là gợi ý để tránh vòng lỗi.
- Trạng thái: Closed – UXD kiểm lại 19/11: có `od.manager_cap`; FE mặc định phần tiền thuê chưa thu cho MGR

---

## Kiểm lại lượt 2 (19/11, main `93f48941`, nguồn: `gen_strings.py`)

Kết luận: **8 thẻ cũ đều đóng.** Có 3 thẻ Minor mới, đều chỉ sửa chuỗi. Không chặn tag v1.0.7, nhưng nên gộp vào bản tag.

Chuỗi mới FE thêm sau review lần 1:

| Khóa | Kết luận |
|---|---|
| `field_error.previous_month_closed_from` | Đạt, giữ nguyên |
| `bd.cards_range` | Đạt, giữ nguyên |
| `field_error.backdate_out_of_range_from` | Sửa (thẻ 196-09): câu "and it must be before today" thừa; viết theo mẫu của `bd.date_range` |
| `bd.arrival_fixed` | Sửa (thẻ 196-09): "room segment / đoạn căn" là thuật ngữ nội bộ, lễ tân không dùng |
| `od.reference_long_number` | Sửa (thẻ 196-09): EN "numerals" không tự nhiên; VI dài |
| `bd.need_device` | Sửa VI (thẻ 196-09): theo `od.need_device` và các chuỗi thiết bị khác ("máy được cấp quyền") |

### FB-R5-UXD-FE-196-09
- Mức độ: Minor
- Vị trí: `gen_strings.py`, các khóa ở bảng dưới (đã có trên main).
- Vấn đề: xem bảng "Kiểm lại lượt 2" ở trên.
- Vì sao quan trọng: lễ tân đọc câu lỗi ngay lúc đang nhập. Câu phải dùng chữ của nghiệp vụ, không dùng chữ của mô hình dữ liệu, và gọi thiết bị thống nhất một tên.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `field_error.backdate_out_of_range_from` | Arrival must be from {date} to yesterday. | Ngày đến phải từ {date} đến hôm qua. |
| `bd.arrival_fixed` | This booking changes rooms during the stay, so the arrival date stays as booked. To change it, edit the booking first. | Đơn này có đổi căn giữa chừng nên giữ ngày đến của đơn. Cần đổi ngày đến thì sửa đơn trước. |
| `od.reference_long_number` | The reference can't have 9 or more digits in a row. It may be an account or card number. | Mã tham chiếu không được có từ 9 chữ số liền nhau trở lên. Đó có thể là số tài khoản hoặc số thẻ. |
| `bd.need_device` | Backdated entry works only on an approved device. *(giữ)* | Nhập bù chỉ làm được trên máy được cấp quyền. |
- Trạng thái: Open

### FB-R5-UXD-FE-196-10
- Mức độ: Minor
- Vị trí: `od.owner_only`. Câu này hiện khi MGR bị 403 (SEC 12-02, SEC 197-02).
- Vấn đề: câu đã duyệt chưa nói tới hai trường hợp 403 mới của MGR: phiếu có khoản thu đã bị đảo, hoặc phiếu có khoản thu thật nhận sau ngày nhận phòng bù. Trong hai trường hợp này, MGR đã làm đúng điều câu cũ nêu (tiền thuê, phiếu tháng nhận phòng, ngày trả hợp lệ) mà vẫn bị chặn. Câu cũ cũng không nói phải làm gì tiếp.
- Quyết định UXD: **có**, thêm hai trường hợp này vào câu. Gộp chúng thành một điều kiện ngắn, và kết câu bằng việc cần làm tiếp. Không tách thành khóa riêng, vì server trả cùng một 403, không phân biệt lý do.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `od.owner_only` | Only the owner can record this here. A manager can record only rent on the arrival-month statement of a backdated check-in, paid on or before that check-in, and only if the statement has no reversed payment and no payment received after that check-in. Ask the owner to record it. | Chỉ chủ đầu tư ghi được khoản này ở đây. Quản lý chỉ ghi được tiền thuê trên phiếu tháng nhận phòng của đơn nhận phòng bù, khách trả trước hoặc đúng ngày nhận phòng bù, và phiếu chưa có khoản thu bị đảo hay khoản thu sau ngày đó. Nhờ chủ đầu tư ghi. |
- Trạng thái: Open

### FB-R5-UXD-FE-196-11
- Mức độ: Minor
- Vị trí: `stmt.pay_amount`. Nhãn ô số tiền của cả "Ghi đã thu" và "Khách đã trả ngoài app" (`StatementDrawer.tsx`).
- Vấn đề: ô số tiền nay có hậu tố đ/VND (`VndInput`), nên nhãn "Số tiền (đ)" / "Amount (VND)" nói đơn vị hai lần.
- Quyết định UXD: **bỏ phần đơn vị trong ngoặc ở nhãn.**
  - Test `fb012-statements-fe.test.tsx` tìm nhãn theo regex bắt đầu bằng chuỗi nên vẫn chạy.
  - Test `fb012-golive-fe.test.tsx` dùng `label('stmt.pay_amount')` nên tự theo chuỗi mới.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `stmt.pay_amount` | Amount | Số tiền |
- Trạng thái: Open

## Điểm làm tốt – nên giữ
- Mọi nút mới (Nhận phòng bù, Khách đã trả ngoài app, Đọc bù hôm nay) chỉ hiện theo `allowedActions` / `availableActions` / `catchUpNeedsRole`. Form dài hạn không có ô người chốt (SEC 12-01). `outside_desk` không xuất hiện trong ô chọn cách thu nào (SEC 12-03).
- Hộp "Đã nhận phòng bù" có bước tiếp theo bấm được ngay (Ghi chỉ số nhận phòng → Phiếu tháng nhận phòng). Ngăn đơn có chip "Nhận phòng bù dd/mm". Người làm không phải nhớ quy trình trong go-live-guide.
- Câu báo đọc bù khớp DOM §3.3. Thiết bị chưa cấp quyền thì khóa ô và nói rõ lý do, thay vì để lỗi 403 hiện sau khi gửi.
