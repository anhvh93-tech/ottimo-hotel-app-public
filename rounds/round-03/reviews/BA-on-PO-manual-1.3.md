# BA review sổ tay bản 1.3 (PO sửa theo `v1.0.0`)

- Người review: BA (tác giả sổ tay 1.0–1.2) | Round 3, bước **Review**, điều kiện D-T1 của cổng QC v1.0 | 30/10/2026
- Đối tượng: `product/docs/manual/user-manual-v1.0.md` bản nội dung 1.3 và `product/docs/day-one-guide.md` mục 10 (`git diff 9370b4e 80de8d9`), theo `rounds/round-03/outputs/PO/v1.0.0-docs-update.md`.
- Đối chiếu: mã Desk trên `8b3aec8` (`product/apps/admin-web`, `product/design/copy/strings-vi.json`, `product/services/api`). Thư mục `product/apps` và `product/services` ở HEAD không khác `8b3aec8`.
- Ngoài phạm vi: phần nghiệp vụ của cách xử lý 0h00 (DOM), chữ hướng tới khách (UXD).
- Tổng: **1 Blocker · 3 Major · 3 Minor · 2 Suggestion**.

---

### FB-R3-BA-PO-M13-01
- Mức độ: Blocker
- Vị trí: Sổ tay 2.4, khung "Lỗi đang sửa – Giữ chỗ quá hạn không báo ai", điểm 1 (dòng 621–625). Cùng nội dung ở `staff-one-pager.md` dòng 33 và `release-notes.md` dòng 107.
- Vấn đề: Với giữ chỗ **đã quá hạn**, Desk `v1.0.0` không làm được 2 trong 3 lối ra mà sổ tay hướng dẫn.
  - **"Khách chuyển đủ → Xác nhận đã nhận cọc"**: máy chủ từ chối nếu tiền về **sau** hạn. `deposits.service.ts` dòng 174–179: hold quá hạn mà `receivedAt >= holdExpiresAt` thì trả `HOLD_EXPIRED`. Desk không gửi `receivedAt` (`ReservationDialogs.tsx` dòng 584–597), nên khoản ghi tay luôn mang giờ hiện tại và luôn bị từ chối. Lễ tân thấy câu `error.HOLD_EXPIRED`: "Giữ chỗ đã hết hạn lúc … và căn đã mở bán lại. Tạo giữ chỗ mới nếu căn còn trống." Câu này sai với đơn có cọc, vì căn vẫn bị giữ. Chỉ qua được khi khoản còn thiếu đã về **trước** hạn, ví dụ mã VietQR khách trả trước hạn mà chưa ai bấm xác nhận.
  - **"Quản lý chấp nhận cọc thiếu (ghi lý do)"**: Desk **không có ô hay nút** này. API có trường `acceptShortfallReason` (`deposits.controller.ts` dòng 42), nhưng `admin-web` không gửi trường này ở đâu. Kiểm bằng grep: chỉ có trong `api-client` sinh tự động và `mocks/`.
  - **Gia hạn** (khách chưa cọc mà còn muốn giữ, PO đã ghi "báo quản lý quyết"): sau hạn, nút **Gia hạn giữ chỗ (1 lần)** bị ẩn (`allowed-actions.ts` dòng 55: `!c.holdExpired`). Máy chủ cũng chặn `HOLD_EXPIRED` (`reservations.service.ts` dòng 2822).
  - Lối ra còn lại duy nhất là **Hủy giữ chỗ**, kèm đề nghị hoàn do máy chủ tự tạo (`closeStayCredit`). Hộp hủy của đơn có cọc vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn (`ReservationDialogs.tsx` dòng 349–354).
- Vì sao quan trọng: Đây là việc hằng ngày, bắt đầu từ ngày D, mà lễ tân được dạy ở buổi C3a 31/10 (bài tập 5.8 (6)). Làm theo sổ tay, lễ tân sẽ gặp lỗi đúng lúc khách đã chuyển đủ tiền. Thông báo lỗi lại nói căn đã mở bán, nên lễ tân dễ tạo đơn mới chồng lên. Đơn cũ vẫn giữ căn và vẫn giữ tiền khách. Rủi ro: lễ tân bối rối trước khách, tiền khách nằm trên một đơn "treo", có thể ghi cọc hai lần. D-T1 yêu cầu sổ tay đúng với Desk thật, nên chưa đóng được.
- Đề xuất sửa (PO viết lại khung; DOM chốt cách làm; ARC xem có cần vá ở v1.0.1 không):
  1. **Chuyển trọng tâm sang trước hạn.** Đầu ca rà mọi giữ chỗ **còn dưới 2 giờ** (đồng hồ đỏ), không chỉ đơn đã về 0. Trước hạn, Desk làm được cả ba việc: thu đủ rồi **Xác nhận đã nhận cọc**, **Gia hạn giữ chỗ (1 lần)**, hoặc **Hủy giữ chỗ**. J2 đã nhắc "sắp hết hạn" vào hộp thư (QA thấy `hold_expiring` trong 19.7, mục 5b).
  2. **Sau hạn**, ghi đúng những gì Desk làm được:
     - Tiền đã về trước hạn: **Xác nhận đã nhận cọc** vẫn được.
     - Còn lại: chỉ **Hủy giữ chỗ**. Desk tạo đề nghị hoàn toàn bộ số đã nhận, quản lý duyệt. Hộp hủy ghi "giữ chỗ chưa cọc" là chữ sai, không phải không hoàn. Khách còn muốn ở thì tạo giữ chỗ hoặc đơn mới. DOM chốt cách xử lý tiền giữa đơn cũ và đơn mới: hoàn rồi thu lại, hay cách khác.
     - Bỏ ý "quản lý chấp nhận cọc thiếu" khỏi sổ tay, one-pager và release notes tới khi Desk có nút.
  3. Nếu DOM thấy cách tạm ở 2 buộc **hoàn tiền rồi thu lại của khách**, thì cách này chạm tới khách. PO cân nhắc đưa ARC/BE vá ở v1.0.1: cho FD+ xác nhận hold `kept_paid` đã quá hạn, và thêm ô chấp nhận cọc thiếu trên Desk. Nếu không kịp, ORC nêu với INV trong tóm tắt.
  4. Sửa đồng thời `staff-one-pager.md`, `release-notes.md` dòng 107 và `day-one-guide.md` mục 10. Hiện cả ba ghi "quản lý chấp nhận cọc thiếu".
- Trạng thái: Open

### FB-R3-BA-PO-M13-02
- Mức độ: Major
- Vị trí: Sổ tay 2.1 bước 4 (dòng 534), 2.4 khung (dòng 618), 5.6 (dòng giữ chỗ 0h00), 5.8 bài (6); `day-one-guide.md` mục 10 dòng 189; `release-notes.md` dòng 107; `staff-one-pager.md` "Đầu mỗi ca".
- Vấn đề: Mô tả cách tìm giữ chỗ quá hạn chưa khớp với màn hình.
  - Desk **không hiện chữ "0h00"**. Sơ đồ phòng hiện "còn 0 giờ 00 phút" (`rack.note.hold_left`). Hôm nay hiện "còn 0 giờ 00 phút (hết hạn …)" (`today.hold_left`). `remaining()` chặn ở 0 (`app/reservations.ts` dòng 77–82).
  - **Hôm nay chỉ liệt kê giữ chỗ có ngày đến là hôm nay** (`holdRows`: `r.arrival_date = $1`, `stay-lists.ts` dòng 76). Khối này mang tên **"Giữ chỗ chưa cọc (n)"** nhưng có cả đơn đã có cọc, và chỉ hiện khi n > 0.
  - **Sơ đồ phòng chỉ hiện 14 ngày** (`RackPage.tsx` `DAYS = 14`). Giữ chỗ có ngày đến xa hơn mà quá hạn sẽ không thấy ở cả hai màn. Nhóm G nhập ngày D có thể rơi vào trường hợp này.
- Vì sao quan trọng: Rà đầu ca là biện pháp bù duy nhất cho BUG-R3-041 tới v1.0.1. Rà theo sổ tay sẽ bỏ sót đơn có ngày đến sau 14 ngày, và lễ tân tìm một chữ không có trên màn.
- Đề xuất sửa:
  - Gọi đúng chữ trên màn: "đồng hồ **còn 0 giờ 00 phút** màu đỏ". Có thể giữ "0h00" làm tên gọi tắt, nhưng phải giải thích một lần ở 2.4.
  - Thêm lối rà đủ: **Đơn đặt phòng** → lọc **Đang hiệu lực** → mọi dòng trạng thái **Giữ chỗ · chờ cọc** → mở từng đơn. Với 10 căn, số giữ chỗ cùng lúc ít nên làm được trong 1–2 phút. Sơ đồ phòng và Hôm nay chỉ dùng để thấy nhanh.
  - 2.1 bước 3: ghi rõ khối **Giữ chỗ chưa cọc (n)** trên Hôm nay chỉ có đơn đến hôm nay, gồm cả đơn đã có một phần cọc.
- Trạng thái: Open

### FB-R3-BA-PO-M13-03
- Mức độ: Major
- Vị trí: Sổ tay 2.4 khung "Giữ chỗ quá hạn" (thiếu); 5.6. Lỗi sản phẩm mới, chưa có trong `qa/bug-list.md`.
- Vấn đề: Mở một giữ chỗ **có cọc đã quá hạn**, khung đơn hiện hộp đỏ **"Giữ chỗ đã hết hạn lúc {time} – đơn đã tự hủy"** (`drawer.hold.expired`, `ReservationDrawer.tsx` dòng 476–480). Hộp này hiện với mọi đơn `hold` có `left.ms = 0`, không xét cọc. Thực tế đơn **chưa** hủy: trạng thái vẫn **Giữ chỗ · chờ cọc**, căn vẫn bị giữ (QA 19.7 mục 5a, OTM-00368).
- Vì sao quan trọng: Lễ tân rà đầu ca, mở đơn, đọc "đơn đã tự hủy" rồi bỏ qua. Biện pháp bù cho BUG-R3-041 mất tác dụng, căn bị giữ im lặng, tiền khách nằm trên đơn treo.
- Đề xuất sửa:
  - Thêm vào khung 2.4: "Mở đơn thấy 'Giữ chỗ đã hết hạn … – đơn đã tự hủy' mà trạng thái vẫn **Giữ chỗ · chờ cọc**: đơn **chưa** hủy. Xử lý như trên." Thêm một dòng ở 5.6.
  - ORC giao QA ghi lỗi mới (đề xuất P2, FE-A + UXD): chữ của `drawer.hold.expired` phải theo cọc, sửa ở v1.0.1 cùng BUG-R3-041.
- Trạng thái: Open

### FB-R3-BA-PO-M13-04
- Mức độ: Major
- Vị trí: Sổ tay 1.11, dòng 436 ("Quá 24 giờ… Chỉ quản lý ghi bút toán **Điều chỉnh**") và cuối dòng 435 ("Ghi nhầm: quản lý đảo dòng").
- Vấn đề:
  - Sau cửa sổ 24 giờ, **không ai** ghi được gì lên folio, kể cả quản lý.
    - `folio-lines.service.ts`: dòng 489 chặn folio `closed`; dòng 494–499 chặn folio `settled` đã quá `post_checkout_window_until` (`FOLIO_LOCKED`, "post-checkout window over (BR-427 d)"). Hai chặn này áp với **mọi vai**, cả thêm dòng lẫn **Điều chỉnh**.
    - QA 17.5 (BUG-R3-022) đã ghi "folio quá cửa sổ → 409 `FOLIO_LOCKED`".
    - Câu lỗi `error.FOLIO_LOCKED` ("Chỉ quản lý ghi được bút toán điều chỉnh") gây hiểu nhầm, và sổ tay đang chép lại ý đó.
    - Thêm nữa: nút **Thêm phát sinh** còn hiện tới khi J15 (chạy mỗi giờ) đóng folio, nên có tới 1 giờ lễ tân bấm được nhưng bị từ chối. Quản lý vẫn thấy nút **Điều chỉnh** trong **Folio & điều chỉnh** (`FolioDialog.tsx`: `settled = status !== 'open'`), nhưng bấm sẽ bị 409.
  - "Đảo dòng" không phải tên nút. Đường thật là **Folio & điều chỉnh** → dòng cần sửa → **Điều chỉnh** → **Bỏ cả dòng (ghi bút toán đảo, không xóa)**, hoặc sửa số lượng/đơn giá, kèm **Lý do điều chỉnh**. Đơn còn công nợ thì không giảm được dòng (`folio.adjust_debt_locked`). Khi đó quản lý dùng **Xóa công nợ**.
- Vì sao quan trọng: Quản lý sẽ thử một thao tác Desk luôn chặn, rồi có thể thu tiền ngoài Desk. Lễ tân không biết cửa sổ 24 giờ tính từ lúc **hoàn tất trả phòng**.
- Đề xuất sửa: Viết lại hai ý của 1.11:
  - "Trong 24 giờ sau khi hoàn tất trả phòng: lễ tân **Thêm phát sinh**. Ghi nhầm: quản lý mở **Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng** hoặc sửa số, ghi lý do."
  - "Quá 24 giờ: Desk khóa folio, không ai thêm hay điều chỉnh được, kể cả quản lý (Desk báo 'Phiếu thanh toán đã khóa…'; bỏ qua vế 'chỉ quản lý'). Khoản còn nợ: **Thu công nợ** hoặc quản lý **Xóa công nợ**. Phát hiện mới sau 24 giờ: ghi sổ giao ca, báo chủ đầu tư."
  - Thêm câu lỗi gây hiểu nhầm vào 5.6. Nhờ UXD sửa chuỗi ở v1.0.1.
- Trạng thái: Open

### FB-R3-BA-PO-M13-05
- Mức độ: Minor
- Vị trí: Sổ tay 1.11 dòng 435 ("chọn khoản, số lượng, ghi chú → thêm vào folio… Ảnh chỗ hỏng chụp bằng điện thoại của cơ sở").
- Vấn đề: Tên trong hộp **Thêm phát sinh** (`AddChargeDialog`) là **Khoản**, **Số lượng**, **Ghi chú** và nút **Thêm vào folio**. Với khoản phạt hay đền bù (`evidenceRequired`), hộp đổi ô **Ghi chú** thành **Ảnh hoặc ghi chú bằng chứng**, kèm nút **Thêm ảnh từ buồng phòng**. Hộp bắt buộc phải có ảnh hoặc ghi chú. Sổ tay chỉ dặn chụp ảnh, không nói phải đính ảnh vào hộp. Khoản phạt mà đơn chưa gửi nội quy thì hộp còn cảnh báo (`houseRulesMissing`).
- Vì sao quan trọng: Hư hỏng sau trả phòng chính là ca cần bằng chứng nhất. Ảnh để trên điện thoại cơ sở mà không đính vào Desk thì không có chứng cứ trên folio.
- Đề xuất sửa: In đậm đúng tên ô và nút. Thêm: "Khoản phạt/đền bù: đính ảnh ở **Thêm ảnh từ buồng phòng** hoặc ghi ở **Ảnh hoặc ghi chú bằng chứng**. Đính xong thì xóa ảnh khỏi điện thoại." SEC đã có quy tắc ảnh trên thiết bị cơ sở ở 0.8, PO đối chiếu cho khớp.
- Trạng thái: Open

### FB-R3-BA-PO-M13-06
- Mức độ: Minor
- Vị trí: Sổ tay 2.4 khung, điểm 2 (dòng 626): "**Hủy giữ chỗ** (mục 2.8), lý do 'Hết hạn giữ chỗ'".
- Vấn đề: Ô **Lý do hủy** không có lựa chọn "Hết hạn giữ chỗ". Danh sách thật: Khách đổi ý · Khách tìm được chỗ khác · Giá chưa phù hợp · Đổi ngày · Không liên lạc được · Khác (ghi rõ). "Hết hạn giữ chỗ" chỉ là lý do máy chủ ghi khi J1 tự hủy (BR-303).
- Vì sao quan trọng: Lễ tân tìm không ra lựa chọn. Báo cáo lý do hủy sẽ lẫn lộn nếu mỗi người chọn một kiểu.
- Đề xuất sửa: "Lý do **Không liên lạc được** (khi gọi không được), hoặc **Khác (ghi rõ)** và gõ 'Hết hạn giữ chỗ'." DOM chọn một cách cho thống nhất.
- Trạng thái: Open

### FB-R3-BA-PO-M13-07
- Mức độ: Minor
- Vị trí: Sổ tay 2.14 **Bill / Phiếu thanh toán**, bước 1 và bước 3 (dòng 992–994); 5.4 FAQ bill.
- Vấn đề: Bản xem trước ở bước 3 **Bill & thu tiền** cũng có nút **In phiếu**, vì dùng chung hộp `BillDialog` (`CheckOutPage.tsx` dòng 2025). Bản in khi đó không có số phiếu và mang dòng "Bản xem trước – số phiếu được cấp khi hoàn tất trả phòng." Sổ tay đặt bước 3 sau bước 2, nhưng không nói chỉ in sau khi hoàn tất. Chỗ in lại sau trả phòng cũng có hai lối: màn hoàn tất (**Xem Phiếu thanh toán** cạnh **Về chi tiết đơn**) và khung đơn **Đã trả phòng**.
- Vì sao quan trọng: Đưa khách tờ chưa có số phiếu thì khách dễ hỏi lại, kế toán không khớp số phiếu.
- Đề xuất sửa: Bước 3: "Chỉ in **sau khi hoàn tất** (phiếu có **Số phiếu**). Bản xem trước ở bước 3 cũng có nút In phiếu nhưng không đưa khách." Nêu cả hai lối mở phiếu sau trả phòng.
- Trạng thái: Open

### FB-R3-BA-PO-M13-08
- Mức độ: Suggestion
- Vị trí: Sổ tay 5.7 Lịch sử; 5.4 FAQ Wi-Fi (dòng 1568).
- Vấn đề:
  - Bảng 5.7 đang theo thứ tự 1.3 · 1.0 · 1.2 · 1.1. Thứ tự lệch này có từ bản 1.2. Dòng 1.3 còn ghi "chờ BA rà".
  - FAQ "Khách hỏi Wi-Fi?" ở 5.4 chưa thêm "sửa ở v1.0.1; trang khách ghi 'hỏi lễ tân'" như đã sửa ở 1.4, 2.9, 2.21.
- Vì sao quan trọng: Người đọc nhìn dòng trên cùng để biết bản mới nhất. Câu Wi-Fi nên giống nhau ở mọi mục.
- Đề xuất sửa:
  - BA chọn thứ tự **mới nhất trên cùng**: 1.3 · 1.2 · 1.1 · 1.0.
  - Sau khi PO sửa theo các thẻ trên, đổi cột Người của dòng 1.3 thành "PO; BA rà 30/10".
  - Sửa câu Wi-Fi ở 5.4 cho khớp với 1.4.
- Trạng thái: Open

### FB-R3-BA-PO-M13-09
- Mức độ: Suggestion
- Vị trí: `product/docs/manual/screenshot-list.md`; sổ tay 1.11, 2.4, 2.14 (cho D-T2).
- Vấn đề: Mục 1.11 mới chưa có ảnh. Khung 2.4 cũng chưa có ảnh, mà nó dựa vào việc nhận ra đồng hồ đỏ và hộp "đã tự hủy" sai chữ. Ảnh C2-35 chụp lúc In phiếu còn lỗi.
- Vì sao quan trọng: Ảnh giúp lễ tân nhận ra đúng màn khi đào tạo. Tên nút trong sổ tay cũng nên rà lại theo ảnh mới (chú thích PO ở 1.11 đã nêu).
- Đề xuất sửa: QA chụp thêm khi dựng HTML (D-T2):
  - "C1-11 Thêm phát sinh trên đơn Đã trả phòng";
  - "C2-xx Giữ chỗ quá hạn có cọc": Sơ đồ phòng và khung đơn;
  - chụp lại C2-35 với bản in A4.
  - Che dữ liệu khách theo quy tắc hiện hành.
- Trạng thái: Open

---

## Đã kiểm, khớp với Desk `8b3aec8` (không cần sửa)

- **1.11**: **Thêm phát sinh** hiện trên đơn **Đã trả phòng** cho lễ tân trở lên khi folio `settled` (`ReservationDrawer.tsx` dòng 223–228, 335–338). Khung đơn có **Còn phải thu**. **Thu công nợ** hiện khi còn nợ. Lễ tân không điều chỉnh được folio đã chốt (`FolioDialog.tsx`: `canAdjust = settled ? mgr : fd`).
- **2.14**: **Xem Phiếu thanh toán**, **Ngôn ngữ phiếu**, **Tiếng Việt** / **Việt – Anh**, **In phiếu** đúng chuỗi (`co.preview_bill`, `bill.lang_label`, `co.bill_vi`, `co.bill_vien`, `co.print`). Bỏ khung BUG-R3-020 là đúng.
- **2.7**: bỏ khung BUG-R3-019 đúng. Ô **Nguồn** có đúng 4 lựa chọn như sổ tay ghi (`LONG_STAY_SOURCES` bỏ "Sale nội bộ").
- **2.12**: bỏ ý nhãn L12/N/NPLUS đúng với phần đã Closed của BUG-R3-023. "Chọn căn VD thì Desk báo, không lưu" khớp QA 17.6 (`ROOM_NOT_READY`).
- **0.8 điểm 4**: "N là số ngày Desk hiện" khớp `reg2.consent_q` ("… lưu ảnh giấy tờ {days} ngày sau trả phòng …").
- **2.9**: **Thu hồi link** đúng chuỗi `rsv.guest_link.revoke`. "Bước 6" đúng. 0.1, 4.2, 5.6 và `day-one-guide.md` mục 10 nhất quán với khung tạm dừng.
- **5.6**: bỏ dòng 019, 020, 022 đúng với bug-list (Closed 28/10).

## Điểm làm tốt

- Khung tạm dừng check-in online (2.9) ghi đủ bốn ý: làm gì, khi lỡ gửi thì làm gì, ai báo mở lại, và vẫn tập trên Desk tập. Các mục 0.1, 0.x, 4.2, 5.6 đều trỏ về đó, không chép lại nội dung.
- Các chú thích nguồn (`<!-- … -->`) ở 1.11, 2.7, 2.14 ghi rõ lỗi nào đã đóng, ở bản nào, theo bằng chứng QA nào, và phần nào chưa diễn tập (folio `closed`). Nhờ vậy BA rà lại nhanh.
- Bảng "Ba việc khác thường" ở `day-one-guide.md` mục 10 gắn mỗi biện pháp tạm với điều kiện kết thúc (bản sửa), không gắn với ngày. Cách này nên giữ.
