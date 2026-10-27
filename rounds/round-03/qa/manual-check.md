# QA – Kiểm sổ tay sử dụng v1.0 với bản thật và chụp ảnh minh họa

- Round 3 · Bước: Kiểm thử · QA · 27/10/2026, 09:20–11:05
- Bản thử: staging `v1.0.0-rc.3` (`70fe734`) – `desk.staging.ottimo.vn`, `staff.staging.ottimo.vn`, `g.staging.ottimo.vn`. Cùng bản với production.
- Sổ tay đối chiếu:
  - `product/docs/manual/user-manual-v1.0.md`, đọc nội dung 1.0 lúc bắt đầu.
  - Trong lúc làm, BA đẩy nội dung 1.1 (`52539f7`). QA trả lời cả các chú thích `<!-- QA … -->` mới ở 1.11, 1.14, 2.5a, 2.7, 2.8, 2.12, 2.14, 2.14a, 2.15, 3.6, 5.3.
  - Danh sách ảnh: `product/docs/manual/screenshot-list.md`.
- Cách làm:
  - Thao tác thật bằng Playwright (Chromium headless) trên staging, dùng tài khoản thử `qa.*` và hai tài khoản dùng một lần.
  - Desk: khung 1440 × 900. App nhân viên và trang khách: 390 × 844, DPR 2.
  - Mỗi bước ghi lại mọi request ghi gửi đi (method, đường dẫn, mã trả về).
  - Mã ca để ở scratchpad QA: `qa-r6/src-rc3/product/tests/e2e/ui/man/*.spec.ts`. Nhật ký chạy: `qa-r6/man/log.md`. Chữ và cây truy cập từng màn: `qa-r6/man/raw/`. Không đưa vào repo.
- Ràng buộc đã giữ:
  - Không mở, không thao tác căn 203, OTM-00357, OTM-00358. Màn **Hôm nay** và sơ đồ có hiện các đơn này, nhưng QA chỉ xem.
  - Không quét QR, không chuyển tiền. Mọi khoản "đã thu" đều ghi **Tiền mặt** giả.
  - Không in mật khẩu, mã TOTP hay khóa ra log hoặc chat. Không sửa code sản phẩm, không sửa sổ tay.
  - Xong lúc 11:05, trước mốc 17:30.

## 1. Kết quả các câu hỏi

### 1.1 Câu của BA (Q1–Q13) và PO (Q14)

| # | Mục sổ tay | Trả lời | Bằng chứng |
|---|---|---|---|
| Q1 | 1.4 | **Công tắc form website:** nằm ở nhóm **Khác**, không có tên tiếng Việt. Dòng hiện đúng khóa `public_booking_requests_enabled`, giá trị `false`, quy tắc "SEC ARC-17". Cùng nhóm còn 3 khóa `public_booking_request_*` thô. Không ở nhóm **Bảo mật** như sổ tay ghi.<br>**Wi-Fi:** không có ở Tham số quy tắc. Không nhóm nào có `wifi.*`. Desk không có màn nào nhập Wi-Fi: trang khách đọc cột `property.wifi_info_i18n`. Staging chưa có giá trị nên trang khách hiện "Hiện ở đây vào ngày nhận phòng (27/10)" ngay trong ngày 27/10 (BUG-R3-021). | Chữ các tab nhóm (`raw/Q1-params-*.txt`); mã `paramCatalog.ts` (khóa lạ rơi vào nhóm "other"); `guest-portal.service.ts` `wifiOf()`; ảnh C0-10 |
| Q2 | 1.9 bước 4–5 | **Chủ đầu tư tự sửa dòng thì quản lý duyệt khoản hoàn tự sinh. Chủ đầu tư không tự duyệt được.** Desk không chặn việc chủ đầu tư sửa dòng. Yêu cầu hoàn mang người xin là người sửa dòng. Máy chủ từ chối người xin tự duyệt khoản hoàn của mình (403 `SELF_APPROVAL_FORBIDDEN`), không trừ chủ đầu tư. Người đã giảm dòng (A32) cũng không được duyệt. Quản lý duyệt được hoàn mọi số tiền.<br>Chiều ngược lại (quản lý sửa thì chủ đầu tư duyệt) đã chạy thật ở E31-5 ngày 26/10.<br>**Chưa thao tác OWN trên staging:** cần một folio đã chốt có dòng phụ thu bằng 1 đêm. Đường này chỉ có ở ca ESC-031 tối nay (căn 203, cấm đụng). | `approval.service.ts` `assertNotSelf()` (ghi chú "no owner/manager exception") + `refundMaker` (ADD3-01); ca E31-5 `clock/qa-esc031.r3.clock.spec.ts` |
| Q3 | 1.15 | **Không có màn xem nhật ký truy cập giấy tờ.** Menu chủ đầu tư không có mục này, không có route, không có chuỗi chữ. Giữ khung "Tạm ở v1.0". | Menu OWN ghi trong `log.md`; `session/nav.ts`; chuỗi duy nhất có chữ "nhật ký truy cập" là `ci.stepup_body` |
| Q4 | 2.7, 2.15 | **Không tạo được "Đơn dài hạn nhập tay" trên rc.3.** Bấm **Tạo đơn dài hạn** thì máy chủ trả 422 `directSource REQUIRED`. Form dài hạn không có ô **Nguồn** và không gửi trường này. Lỗi có từ commit US-155 `5820a97` (BUG-R3-019, **P1**). Vì vậy QA chưa diễn tập được thu tiền thuê, folio và trả phòng của đơn dài hạn.<br>Theo mã và các màn đã thấy:<br>(a) Khung đơn không có nút ghi thu nào ngoài bước 4 nhận phòng và bước 3 trả phòng (xem Q11).<br>(b) Trả phòng chỉ làm được đúng ngày đi (máy chủ chặn trước ngày đi).<br>(c) Form ghi "Phụ thu người thêm của khách dài hạn ghi theo hợp đồng giấy – app không tự tính ở đơn này" và "Đơn này không sinh: hợp đồng, lịch kỳ thu, nhắc thu, hoa hồng".<br>Phụ thu trả muộn/nhận sớm của đơn này (2.15): chưa kiểm được. | Ca `walk lt3`: `POST …/reservations → 422 {"field":"directSource","code":"REQUIRED"}`; `LongStayDialog.tsx` (body không có `directSource`); `reservations.service.ts:603`; ảnh C2-09 (form đã điền, chưa tạo được) |
| Q5 | 2.14 | **Bấm "In phiếu" in ra cả khung Desk.** Bấm nút có gọi `window.print()`. Admin-web không có CSS in (`@media print`). Bản in (Chromium, A4, chế độ print) gồm cả danh sách đơn, ngăn kéo khung đơn, lớp mờ, hộp "Phiếu thanh toán" có cả nút ngôn ngữ, chữ chồng lên nhau. Lưu PDF từ hộp in cũng ra như vậy.<br>Nội dung phiếu trên màn hình thì đúng: đủ dòng, Tiếng Việt / Việt – Anh đúng.<br>**Đề xuất sửa 2.14:** "v1.0 chưa in được phiếu sạch – đưa khách xem phiếu trên màn hình. Cần bản giấy thì ghi vào sổ giao ca, gửi sau khi có bản vá." (BUG-R3-020, P2) | `raw/BILL-vi.pdf`, `raw/BILL-vi-printmedia.png` (scratchpad, có tên khách giả – không đưa repo); `window.print()` gọi 1 lần; grep `@media print` = 0 |
| Q6 | 3.7 | **Đúng: app nhân viên không có màn đếm/nhập minibar.** Buồng phòng chỉ có việc **Bổ sung minibar** (dòng "Bổ sung minibar: Nước suối 500ml × 2, …") với nút **Làm xong**. Mã `apps/mobile` chỉ nhắc minibar trong `tasks.ts`/`TasksPage.tsx`. Giữ khung "Tạm ở v1.0". | `raw/C3-01.txt`; ảnh C3-01 |
| Q7 | 3.6 | **Đúng.** Lễ tân trưởng (`qa.fdl`) đăng nhập `staff…` được, vào app ở chế độ buồng phòng. Mở căn VC (103) thì có nút **Kiểm phòng**. Màn **Kiểm phòng 103 · The Bloom** có 12 mục, **Chưa đạt** / **Kiểm đạt – sẵn sàng**.<br>Buồng phòng (`qa.hk`) mở cùng căn 103: không có nút Kiểm phòng ("Căn này không có việc hôm nay").<br>Lưu ý: mã client `canInspect()` có cả vai buồng phòng. Khi bật `hk_self_inspection_enabled`, nút sẽ hiện cho buồng phòng – đúng thiết kế. | Nhật ký `staff` (Q7 HK = false, FDL = true); ảnh C3-05 |
| Q8 | 3.1 | **Đúng, nhưng chữ hơi lệch.** Nhập `qa.mgr` + mật khẩu ở app nhân viên: màn hiện cùng lúc "Nhập mã trong ứng dụng xác thực để hoàn tất đăng nhập." và "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." Không có ô nhập mã, không vào được. Sổ tay giữ câu hiện tại. UXD nên bỏ câu đầu (BUG-R3-029). | `raw/Q8-qa.mgr.txt` |
| Q9 | 1.8 bước 3 | **Hộp Duyệt chỉ hỏi Mật khẩu đăng nhập** (và ô Ghi chú không bắt buộc). Không hỏi mã 6 số, kể cả với quản lý đã bật 2 bước. Đúng cho cả hai loại: **Duyệt hoàn 600.000 đ cho …?** và **Duyệt miễn 210.000 đ cho OTM-00359?**. Hộp **Từ chối** hỏi **Lý do từ chối** + **Mật khẩu đăng nhập**. | `raw/Q9.png`, `raw/C1-14.txt`; ảnh C1-14 |
| Q10 | 1.6 | Mục **Kiểm máy trước khi cấp** (bắt buộc), 5 ô: **Ổ đĩa đã mã hóa** · **Tự khóa màn hình sau 5 phút** · **Trình duyệt không cài tiện ích** · **Tắt lịch sử/đồng bộ bộ nhớ tạm** · **Đội kỹ thuật đã kiểm máy này**. Nút ghi **Cấp quyền thiết bị này (còn 4 mục kiểm)** tới khi tích đủ.<br>Chủ đầu tư có 2 bước: form luôn hỏi **Nhập lại mật khẩu đăng nhập để cấp quyền** + **Mã trong ứng dụng xác thực (6 số)**.<br>Form chỉ hiện trên máy **chưa** cấp quyền. Máy đã cấp chỉ thấy "Máy này đã được cấp quyền." và bảng thiết bị. | Ảnh C1-10 (chụp trên máy chưa cấp) |
| Q11 | 2.4, 2.12 | **Không có nút ghi thu giữa kỳ ở.** Khung đơn **Đang ở** (lễ tân) chỉ có: Thêm phát sinh · Xác nhận giờ trả · Folio & điều chỉnh · Thêm người đi cùng · Đổi phòng · Trả muộn · Gia hạn. Folio chỉ có Điều chỉnh / Mở form miễn phí / giảm giá. Hộp **Gia hạn** không có ô thu tiền: chỉ có danh sách đêm và nút "Gia hạn 1 đêm · 700.000 đ". Thu được ở bước 4 nhận phòng và bước 3 trả phòng. Sau trả phòng thì có **Thu công nợ**.<br>**Đề xuất 2.12 bước 5:** "ghi sổ giao ca, thu ở bước Bill & thu tiền khi trả phòng". | `raw/CI-done.txt`, `raw/C2-25.txt`; ảnh C2-25 |
| Q12 | 1.3 | **Quản lý sửa và lưu được giá đêm niêm yết.** `qa.mgr` sửa căn 101, giá đêm 800.000 hiệu lực 28/10 (giữ đúng giá đã lên lịch), lý do → `PATCH rooms/101` 200, toast "Đã lưu căn 101. Giá áp dụng từ 28/10/2026." Giá không đổi so với trước. Sổ tay giữ "chủ đầu tư, quản lý". Nếu muốn chỉ chủ đầu tư nhập giá, cần đổi quyền (việc của PO/INV). | Nhật ký `walk q12`; bảng 101 trước/sau 9.600.000 / 800.000 |
| Q13 | 2.10 bước 7 | Hộp xác nhận: tiêu đề **Nhận phòng căn 201 cho Emma Laurent?**, liệt kê lại "Đơn chuyển 'Đang ở'…", hạn khai báo, phụ thu nhận sớm, khoản thu. Hai nút **Không, quay lại** và **Nhận phòng căn 201**.<br>Sau khi xác nhận, Desk về danh sách đơn, khung đơn **Đang ở**. QA không bắt được toast "Đã nhận phòng căn …". | `raw/CI-confirm.txt`; `POST …/actions/check-in → 200` |
| Q14 | 3.6, 5.3 | **Không. Chủ đầu tư/quản lý không kiểm phòng (VC→VI) được ở đâu trong v1.0.**<br>Desk **Buồng phòng** và **Sơ đồ phòng** không có thao tác kiểm (không có chữ "Kiểm phòng"/"Kiểm đạt"; mã `HousekeepingPage` chỉ có Việc mới / Làm xong / Hủy việc).<br>App nhân viên cho vai chủ đầu tư/quản lý kiểm (`canInspect`), nhưng hai vai này không đăng nhập được app vì 2 bước (Q8).<br>**Chỉ lễ tân trưởng kiểm.** Sửa 3.6 câu "(hoặc quản lý trên Desk)" và bảng 5.3 dòng **Kiểm phòng**: OWN, MGR = "–". Ghi thêm: lễ tân trưởng nghỉ thì chưa ai kiểm được; căn VC vẫn nhận khách được vì điều kiện nhận phòng chấp nhận VC. | Nhật ký `ch1-mgr` (Q14: false/false); `HousekeepingPage.tsx`; `apps/mobile/src/app/session.ts` |

### 1.2 Câu của DOM (ghi là D14–D19 để khỏi trùng Q14)

| # | Mục sổ tay | Trả lời | Bằng chứng |
|---|---|---|---|
| D14 | 2.14a bước 6 | **Chưa diễn tập trọn được.** Hôm nay staging chỉ có một khách đi đúng ngày (OTM-00357, căn 203 – cấm đụng). QA không chỉnh được đồng hồ staging. Những gì đã kiểm trên OTM-00359 (đi 29/10):<br>(a) Khung đơn **không có nút Trả phòng** trước ngày đi, khớp khung "Tạm ở".<br>(b) Mở thẳng URL `/check-out` thì Desk vẫn cho làm 3 bước. Ở bước 2 gõ **Giờ trả phòng thực tế** 08:30 (sớm hơn giờ bấm 10:22): Desk **không** hiện ô ghi chú bắt buộc, chỉ ghi "Trả đúng giờ – không phụ thu". Bước 3 không hỏi lý do.<br>(c) Bấm hoàn tất thì máy chủ 409: "check-out on the departure business day (early departure first – B16)". Desk báo sai "Đơn vừa chuyển sang 'Đang ở'…" (BUG-R3-024).<br>**Rủi ro cho bước 6 (đọc mã, chưa chạy):** hộp **Điều chỉnh** dòng tiền phòng ghi "Ngoài sàn–trần của nhóm căn thì không lưu được – thấp hơn sàn thì xin giảm giá đặc biệt". Giảm 50 % một đêm có thể dưới sàn. Khi đó quản lý phải dùng **Mở form miễn phí / giảm giá → Giảm giá đặc biệt** hoặc **Bỏ cả dòng**. DOM/BA nên nói rõ cách nào.<br>Đề nghị kiểm lại ngày 29/10 trên chính OTM-00359 (ngày đi thật). | `raw/CO-4.png`, `raw/CO-done.png`; `POST …/actions/check-out → 409`; chuỗi `folio.adjust_night_help` |
| D15 | 1.14 bước 6 | **Không lọc theo giờ.** Nhật ký tiền chỉ có **Từ ngày** – **Đến ngày** (ô ngày), không có ô giờ. **Cũng không có ô lọc người làm** – sổ tay 1.12 ghi "lọc người làm" là sai. Lễ tân chỉ thấy dòng của mình (101/101 dòng là "QA FD"), đúng câu "lễ tân chỉ thấy khoản của mình" ở 1.14. Giữ cách "đếm theo cột **Lúc**". | `raw/aria` màn `/audit` của `qa.fd`; ảnh C1-18 |
| D16 | 2.5a | **Hộp Xác nhận cọc không có ô mã giao dịch.** Hộp **Xác nhận cọc · OTM-…** chỉ có **Số tiền đã nhận**, **Cách thanh toán** (VietQR / Chuyển khoản / Tiền mặt / Thẻ), nút **Tạo mã VietQR mới**. Không có ô **Mã giao dịch / ghi chú**, kể cả khi chọn Chuyển khoản. Vì vậy câu "xác nhận cọc ở từng đơn … cùng mã giao dịch, ghi chú 'chuyển gộp nhóm'" không làm được, và việc trùng mã giao dịch không xảy ra. Ô mã giao dịch chỉ có ở form **Đặt phòng mới** (khi nhập cọc lúc tạo đơn) và ở **Thu công nợ**.<br>**Đề xuất 2.5a:** bỏ "cùng mã giao dịch, ghi chú". Thay bằng ghi trong sổ giao ca: "OTM-… + OTM-…: chuyển gộp 1 lần, số tiền …". (BUG-R3-025, P3.) | Cây truy cập hộp Xác nhận cọc (OTM-00361); ảnh C2-06 |
| D17 | 2.12 Đổi phòng | **Hộp Đổi phòng không có ô minibar.** Hộp gồm: **Vì sao đổi?** (Sự cố của OTTIMO – giữ giá cũ / Khách yêu cầu – giá căn mới), **Lý do đổi**, danh sách **Căn mới (đã dọn hoặc đã kiểm)**, **Đổi sang căn**. Giữ gạch "Thêm phát sinh" của DOM.<br>Phát hiện thêm: danh sách có **401** dù 401 đang **VD · Trống, cần dọn**. Nhãn nhóm hiện mã nội bộ "L12", "N", "NPLUS" (BUG-R3-023). | `raw/C2-26.txt`; trạng thái 401 `raw/HK-now.txt`; ảnh C2-26 |
| D18 | 2.8 | **Có**, lý do **OTA báo hủy** hiện trong hộp **Hủy đơn OTM-00360 của Hannah Becker?** (đơn OTA thử). Thứ tự: Khách đổi ý · Khách tìm được chỗ khác · Giá chưa phù hợp · Đổi ngày · Không liên lạc được · **OTA báo hủy** · Khác (ghi rõ). Kèm ô **Tiền phạt theo kênh**. Đã hủy đơn thử bằng chính lý do này, phạt 0. | Cây truy cập `raw/aria-5.txt` (lượt d18); `POST …/cancel → 200` |
| D19 | 1.11 | **Không ai ghi được phát sinh sau trả phòng trên Desk.** Khung đơn **Đã trả phòng** của lễ tân (OTM-00294, trả 06:01 hôm nay – còn trong 24 giờ) chỉ có **Folio & điều chỉnh** và **Xem Phiếu thanh toán** (+ **Thu công nợ** nếu còn nợ). Quản lý cũng vậy (thêm **Xóa công nợ**). Nút **Thêm phát sinh** chỉ hiện khi đơn **Đang ở** (`ReservationDrawer.tsx`: `r.status === 'in_house'`). Máy chủ thì có cửa sổ ghi sau trả phòng (BR-427 c, `post_checkout_window_until`).<br>Hiện quản lý chỉ **Điều chỉnh** số lượng/đơn giá dòng có sẵn. Câu "lễ tân trở lên ghi trong 24 giờ, kèm ảnh" ở 1.11 chưa làm được (BUG-R3-022, P2). | `raw/D19-294.txt`, `raw/D19-mgr.txt`; `folio-lines.service.ts` |

## 2. Lỗi sổ tay (chỗ sổ tay ghi khác giao diện thật)

Mục theo số trong sổ tay. Ở mục còn chú thích QA, cột "Đề xuất" đã gồm câu trả lời phía trên.

| # | Mục | Sổ tay ghi | Thực tế trên rc.3 | Đề xuất sửa |
|---|---|---|---|---|
| M1 | 0.2 bước 59 / 0.7 | "bấm **Tài khoản** (góc trên)" | Nút góc trên phải mang **tên + vai** (ví dụ "QA MGR · Quản lý"). Menu mở ra không có tiêu đề "Tài khoản" (đó là nhãn cho trình đọc màn hình). Mục: Đổi mật khẩu · Xác thực 2 bước · Ngôn ngữ giao diện (VI/EN) · Giao diện (Theo máy/Sáng/Tối) · Đăng xuất | "bấm **tên của mình** ở góc trên bên phải → **Đăng xuất**" (ảnh C0-06) |
| M2 | 0.7 bảng menu | Lễ tân trưởng, lễ tân thấy **Tham số quy tắc** (Xem) | Menu lễ tân **không có** Tham số quy tắc. Có Minibar, Danh mục căn (C0-07). Sale nội bộ: Đơn của tôi, Khách của tôi, Báo giá & giữ chỗ, Yêu cầu từ website, **Danh mục căn** | Đổi ô "Tham số quy tắc" của FDL/FD thành "–". Thêm Danh mục căn (xem) cho sale |
| M3 | 0.5 | Máy chưa cấp quyền: "bước giấy tờ bị ẩn" | Đúng, và **cả mục menu Giấy tờ & khai báo bị ẩn**. Chip góc dưới trái: **Máy chưa cấp quyền giấy tờ** | Thêm "menu Giấy tờ & khai báo cũng ẩn" (ảnh C0-08, C0-08b) |
| M4 | 0.3 bước 2 | "Nhập mật khẩu đăng nhập. Bấm **Tạo mã QR**" | Đúng. Lần đăng nhập đầu của quản lý mới: Desk bắt **Đặt mật khẩu của bạn** trước, sau đó mới tới **Bật xác thực 2 bước** (3 bước: Cài ứng dụng · Quét mã · Lưu mã khôi phục). Ô tích ghi **Tôi đã cất 10 mã này ở nơi an toàn, tách khỏi điện thoại**; nút ghi **Hoàn tất (tích ô "đã lưu" trước)** tới khi tích | Thêm câu: "Lần đầu: đổi mật khẩu tạm trước, rồi mới bật 2 bước" |
| M5 | 1.3 bước 3–5 | Hộp Sửa căn có sẵn **Hiệu lực từ**, **Lý do đổi giá** | Hai ô này **chỉ hiện sau khi sửa một con số giá**. Gõ lại đúng giá hôm nay: chữ phụ "Đây là giá đang dùng…" và **Lưu** khóa (C1-03, C1-04) | Bước 4: "Sau khi gõ giá mới, Desk hiện ô **Hiệu lực từ** và **Lý do đổi giá**" |
| M6 | 1.4 dòng "Form 'Yêu cầu đặt phòng'…" | Công tắc ở nhóm **Bảo mật** | Ở nhóm **Khác**, hiện khóa thô `public_booking_requests_enabled` = `false` (Q1) | Sửa thành "nhóm **Khác**, dòng `public_booking_requests_enabled`". Đề nghị UXD đặt nhãn tiếng Việt |
| M7 | 1.4 dòng Wi-Fi | Chủ đầu tư nhập Wi-Fi ở Tham số quy tắc | **Không có chỗ nhập** trên Desk (Q1, BUG-R3-021) | Đổi thành khung "Tạm ở v1.0": "Wi-Fi do đội kỹ thuật nhập theo yêu cầu chủ đầu tư; khách xem thẻ Wi-Fi trong căn". Hoặc chờ bản vá |
| M8 | 1.5 bước 4–5 | Bấm **Tạo tài khoản** → xác nhận mật khẩu và mã 6 số | Đúng. Ô **Tên đăng nhập** chỉ nhận chữ thường không dấu, số, `.`, `_`, `-` (3–64). **Mật khẩu tạm** điền sẵn, có **Tạo mật khẩu khác**. Hộp sau cùng: **Mật khẩu tạm của …** + "Chỉ hiện một lần…" + **Đóng** | Không cần sửa. Ảnh C1-08, C1-09 |
| M9 | 1.5 | Khóa tài khoản | Hộp **Khóa tài khoản của …?** hỏi **Mật khẩu đăng nhập** + **Mã trong ứng dụng xác thực (6 số)** (có "Mất điện thoại? Dùng mã khôi phục") | Thêm "xác nhận bằng mật khẩu và mã 6 số" |
| M10 | 1.7 bước 5–6 | "Bấm **Xem lại**" → "**Lưu tài khoản nhận**" | Đúng tên nút. Hộp **Kiểm tra trước khi lưu** hiện mã BIN, **Số tài khoản (che)**, tên chủ tài khoản, hiệu lực. Nút **← Sửa lại** / **Lưu tài khoản nhận** | Bước 6: số tài khoản ở bước xem lại cũng đã che – đối chiếu bằng mã BIN + tên chủ tài khoản + 4 số cuối |
| M11 | 1.8 bước 3 | **Duyệt** → nhập **Mật khẩu đăng nhập** | Đúng (Q9). Từ chối: **Lý do từ chối** + **Mật khẩu đăng nhập** | Thêm "Từ chối cũng hỏi mật khẩu" |
| M12 | 1.9 bước 5 | "quản lý sửa thì chủ đầu tư duyệt" | Thêm chiều ngược lại: chủ đầu tư sửa thì **quản lý** duyệt (Q2) | Thêm 1 câu |
| M13 | 1.10 / 2.17 | Thu công nợ: **Cách thanh toán**, **Tiền** → **Ghi nhận đã thu …** | Đúng. Hộp **Thu công nợ · OTM-…** có Tiền mặt / Chuyển khoản / Thẻ (máy POS tại quầy), ô **Tiền** (tối đa = còn phải thu), **Mã giao dịch / ghi chú (không ghi số thẻ)** | Không cần sửa (C2-37) |
| M14 | 1.10 | Xóa công nợ: **Khoản xóa công nợ** → **Lý do xóa công nợ** → nhập lại mật khẩu → **Xóa công nợ …** | Đúng. Ô ghi **Mật khẩu của bạn**. Nút ghi **Xóa công nợ 0 đ** tới khi chọn khoản | Không cần sửa (C1-17) |
| M15 | 1.11 | Phát sinh sau trả phòng: lễ tân trở lên ghi trong 24 giờ | Không có nút (D19) | Đổi thành khung "Tạm ở v1.0": "chưa ghi được trên Desk; quản lý ghi vào sổ giao ca và báo đội" |
| M16 | 1.12 bảng | **Nhật ký thao tác tiền**: "lọc người làm" | Chỉ có **Từ ngày** – **Đến ngày** (D15) | Bỏ "lọc người làm" |
| M17 | 1.12 Hoàn tiền | Tab Hoàn tiền: **Nhập nơi nhận hoàn**, **Chi hoàn tiền mặt** | Đúng. Nút **Nhập nơi nhận hoàn** hiện cả với khoản **Chờ duyệt**. Hộp chi hoàn: **Tiền**, **Ảnh chứng từ (ủy nhiệm chi hoặc biên nhận có chữ ký khách)**, nút **Chi hoàn tiền mặt** | Không cần sửa (C2-38) |
| M18 | 2.2 | Khối **Yêu cầu của khách**: nút **Đã nhận**, **Làm xong**, **Không thực hiện được** | Đúng. Yêu cầu đã nhận thì chip **Đã nhận** thay nút | Không cần sửa (C2-29) |
| M19 | 2.4 bước 2 | Giữ chỗ: chọn **Khách đứng tên**, **Giữ trong** 12/24/48 | Hộp **Giữ chỗ** chỉ có **Giữ trong** (12 h / 24 h / 48 h) + **Tạo giữ chỗ**. **Khách đứng tên chọn ở hộp Báo giá, trước khi Lưu báo giá** | Chuyển "Khách đứng tên" lên bước Báo giá (bước 3–4) |
| M20 | 2.4 Báo giá | **Ngôn ngữ gửi khách**, **Sao chép gửi Zalo** sau khi lưu | Đúng. Có thêm **Русский**. Hộp ghi "Hết hiệu lực 31/10/2026 00:00", tin nhắn ghi "hiệu lực đến 23:59 30/10/2026" | Không cần sửa. Chữ lệch 1 phút → UXD (BUG-R3-028) |
| M21 | 2.4 Xác nhận cọc bước 3 | Ghi **Mã giao dịch / ghi chú**, bấm **Xác nhận đã nhận cọc** | Không có ô mã giao dịch (D16). Nút đổi thành **Ghi nhận 300.000** khi số nhận khác số cọc. Desk báo "Số đã nhận khác số trên mã VietQR … ghi như chuyển khoản tay, chờ đối soát" | Bỏ "Mã giao dịch / ghi chú". Thêm: "nhận thiếu thì nút đổi thành **Ghi nhận …**" |
| M22 | 2.5 bước 2 | "Desk chỉ hiện căn đang bán và còn trống cả khoảng ngày" | Danh sách **Căn** luôn có đủ 10 căn, kể cả căn đã kín đêm đó (203, 302). Desk báo trống/kín ở dòng dưới ngày ("2 đêm · Căn trống cả khoảng ngày") và chặn khi lưu. Chữ phụ trên giao diện cũng ghi "chỉ hiện căn … còn trống" | Sửa: "Chọn căn; Desk báo ngay dưới ngày là căn còn trống hay đã kín". Báo FE sửa chữ phụ (BUG-R3-028) |
| M23 | 2.5 bước 6 | Ô **Số điện thoại / Zalo** bắt buộc với Trực tiếp, CTV | Ô này **chỉ hiện khi hồ sơ khách chưa có số**. Tạo nhanh khách thì nhập số ở hộp **Hồ sơ khách mới** (cần ít nhất SĐT hoặc email) | Gộp bước 5–6: "Tạo nhanh khách → nhập Họ và tên, Số điện thoại / Zalo (và Quốc tịch, Ngôn ngữ giao tiếp)" |
| M24 | 2.5 bước 10 | Nút **Giữ chỗ đến …** khi chưa cọc | Khi mở form, ô **Số tiền đã nhận** điền sẵn đúng số cọc, nút là **Tạo đơn** và **Đóng (giữ nháp)**. QA không thấy nút "Giữ chỗ đến …" khi ô tiền còn số | Kiểm lại với BA/FE: xóa ô tiền thì nút có đổi không. Sổ tay nên dặn "xóa số ở ô Số tiền đã nhận nếu khách chưa chuyển" |
| M25 | 2.6 bước 3 | **Thanh toán**: OTA đã thu tiền phòng / Khách trả tại OTTIMO | Đúng. Kênh OTA chọn được: Airbnb, Booking.com, Agoda, Expedia, Trip.com | Không cần sửa (C2-08) |
| M26 | 2.7 | Cả mục | Không tạo được đơn dài hạn (Q4, BUG-R3-019) | Thêm khung đỏ "Lỗi đang sửa" tới khi có bản vá. Cách tạm: khóa căn bằng **Khóa phòng có kế hoạch** (lý do "HĐ dài hạn ngoài app – <tên khách>") để không bán trùng |
| M27 | 2.8 | Khung đơn có nút **Đổi căn / đổi ngày**, **Hủy đơn**, **Đánh dấu không đến** | Đúng. **Đánh dấu không đến** mờ, kèm "Mở được từ 23:00 và sau khi ghi kết quả liên lạc." | Không cần sửa (C2-10) |
| M28 | 2.8 Đổi căn bước 2 | **Lý do đổi** 3 nhóm | Ô **Lý do đổi** là danh sách chọn (Khách yêu cầu …). Hộp có **Tính thử trước khi lưu**, **Khách trả thêm +684.000 đ**, ô tích **Đã báo khách số tiền mới**, nút **Lưu thay đổi** | Không cần sửa (C2-11) |
| M29 | 2.8 Hủy | Hộp hủy đơn | Tiêu đề **Hủy đơn OTM-… của …?**, nút **Giữ lại đơn** / **Hủy đơn**. Đơn giữ chỗ: **Hủy giữ chỗ căn …?**, nút **Giữ lại đơn** / **Hủy giữ chỗ** | Thêm tên nút "Giữ lại đơn" (C2-12) |
| M30 | 2.9 | Link check-in online | Đúng: **Tạo link check-in online** → hộp **Link check-in online · đơn …** có link (hiện một lần), **Sao chép link**, **mã QR của link**, hạn ("Hết hạn 30/10/2026 12:00"). **Thu hồi link** hỏi lại "Thu hồi link của đơn …? Khách mở link sẽ thấy 'Liên kết đã hết hạn'." | Thêm "hộp có mã QR – không chụp màn hình gửi đi" (C2-14) |
| M31 | 2.9 bước 4 | Trang khách | Thứ tự thật: thông báo xử lý dữ liệu (**Tôi đã đọc**) → **Giấy tờ** (chọn loại CCCD/Hộ chiếu rồi **Chụp**, hoặc **Bổ sung tại quầy**) → **Giờ đến** (5 khung giờ + ghi chú) → **Xác nhận** (đồng ý lưu ảnh 30 ngày hay không) → **Gửi thủ tục**. Xong: "Thủ tục đã xong. Hẹn gặp bạn ngày …" | Không cần sửa. Ảnh C0-10. Lưu ý BUG-R3-027 |
| M32 | 2.10 bước 3 | Khách gửi qua link: "bấm **Xem đủ số / ảnh** để đối chiếu" | Ảnh khách gửi **chưa có thông tin giấy tờ**: dòng ghi "Cần nhập thông tin". Lễ tân phải bấm **Sửa** (xác nhận lại mật khẩu, hiệu lực 15 phút) và nhập tay: **Người trong đoàn** (phải chọn lại, không tự chọn), **Loại giấy tờ**, số, họ tên, ngày sinh, giới tính, quốc tịch, hạn, diện nhập cảnh… → **Lưu giấy tờ** | Viết thêm bước "Sửa → nhập thông tin từ ảnh/bản gốc". Người chưa có trong đơn: chọn **Người ở chưa có trong đơn** |
| M33 | 2.10 bước 4 | "Dòng Chưa kiểm được: … **Tôi đã kiểm – Đạt** …, ghi **Cách xử lý**" | Ô **Cách xử lý** bắt buộc cả khi chọn **Đạt**, phải bấm **Lưu** ở từng dòng. Thiếu thì Desk báo "Ghi cách xử lý cho mọi mục Không đạt hoặc Chưa kiểm được để tiếp tục." | Thêm "ghi Cách xử lý và bấm **Lưu** ở từng dòng, kể cả khi Đạt" |
| M34 | 2.10 bước 5 | Chọn Khai báo ngay / sau rồi bấm **Tiếp tục: Giao mã & hoàn tất** | Bấm **Khai báo sau (thêm vào việc cần làm)** là **sang luôn** bước 4, không có nút Tiếp tục | Sửa câu |
| M35 | 2.10 bước 6 | **Khách nhận sớm** → **Giờ nhận thực tế** … | Đúng. Thêm: chọn **Tiền mặt** → ô **Tiền khách đưa**, Desk tính **Thối lại**. Khoản thu ghi **cùng lúc** với nhận phòng ("nhận phòng không thành thì không ghi tiền"). **Số thẻ phòng đã giao** là ô +/− (1–2) | Không cần sửa lớn (C2-18…C2-20) |
| M36 | 2.10 Mã cửa | (cố ý không ghi số chữ số) | Màn vẫn ghi "mã **6 số**" và "ddmm + 3 số (7 số)" (L1 đã biết) | Giữ. UXD sửa ở v1.0.1 |
| M37 | 2.10 Lỗi nhỏ đã biết | Chip đè nút **Xem đủ số / ảnh** "trên màn 1366 px" | Thấy cả ở **1440 px** ("Đã có" đè chữ "Xem đủ số / ảnh", C2-15) | Bỏ "trên màn 1366 px" |
| M38 | 2.11 bước 2 | "Đủ giấy tờ: **Khai báo**" | Nút theo trạng thái: **Nhập giấy tờ** (thiếu) · **Mở** (Cần kiểm tra / thiếu người) · **Khai báo** (Đủ giấy tờ · chờ khai báo, sau **Đối chiếu xong**) | Thêm nút **Mở** |
| M39 | 2.11 bước 3 | Khối 1: chọn đồng ý lưu ảnh → **Đối chiếu xong** | Đúng. Câu hỏi ghi "lưu ảnh giấy tờ 30 ngày sau trả phòng". Lựa chọn khách đã chọn trên trang khách được điền sẵn | Không cần sửa (C2-22) |
| M40 | 2.12 Thêm phát sinh | Danh sách khoản | Có thêm 3 món hư hỏng theo bảng giá: **Khăn tắm, Ly, Remote**. Không thấy ô ảnh ở khoản thường (Giặt ủi) | Không cần sửa (C2-23) |
| M41 | 2.12 Thêm người đi cùng | **Loại** người lớn/trẻ em… | Nút: **Người lớn đi cùng** / **Trẻ em**. Ô chọn người ghi nhầm "**Khách đứng tên**". Phụ thu hiện "Thêm người này vượt định mức căn: phụ thu 300.000 đ cho 2 đêm còn lại, tính từ đêm nay." + ô tích **Ghi phụ thu 300.000 đ vào folio – tôi đã báo khách** | Không cần sửa. Nhãn ô → UXD (BUG-R3-028) |
| M42 | 2.12 Miễn phí | Bước 2 chọn **Loại** FOC / Giảm giá đặc biệt | Mở từ dòng phụ thu: hộp **Miễn phí · <dòng> · <số>**, **không có ô Loại**. Có **Số tiền miễn** (tối đa còn lại của dòng), **Lý do miễn phí** (5 lựa chọn), **Ghi chú**, nút **Gửi duyệt** | Bước 2: "Loại do dòng quyết định (dòng phát sinh → miễn phí; dòng tiền phòng → giảm giá đặc biệt)" – BA kiểm lại với FE |
| M43 | 2.12 Xác nhận giờ trả | Từ **Hôm nay → Khách đi** | Có thêm nút **Xác nhận giờ trả** ngay trên khung đơn **Đang ở**. Ô giờ trong hộp ghi "**Giờ trả phòng thực tế**" | Thêm "hoặc khung đơn". Nhãn → UXD |
| M44 | 2.13 / 2.14 | Thu tiền | Tiền mặt **lớn hơn** số cần thu: Desk ghi đúng số cần thu, hiện **Thối lại**. Nút hoàn tất ghi **Đã thu 1.610.000 đ – hoàn tất** | Không cần sửa |
| M45 | 2.14 Bill | "Trước khi trả phòng, xem trước bằng **Xem Phiếu thanh toán** trên khung đơn" | Khung đơn **Đang ở không có** nút này. Xem trước có ở **bước 3 Bill & thu tiền** của màn Trả phòng. Khung đơn **Đã trả phòng** có **Xem Phiếu thanh toán** | Sửa bước 1 |
| M46 | 2.14 In phiếu | In qua trình duyệt | In ra cả khung Desk (Q5, BUG-R3-020) | Như Q5 |
| M47 | 2.14 bước 5 | Hóa đơn công ty: 4 ô | Đúng. Có nút **Lưu** riêng. Dưới ô còn chữ nội bộ "Hóa đơn điện tử phát hành từ Round 3; R2 lưu thông tin để kế toán xuất." | Thêm "bấm **Lưu**" (C2-36) |
| M48 | 2.14a bước 1 | "Ghi vào ghi chú đơn" | Khung đơn của lễ tân **không có ô ghi chú đơn** (rc.3) | BA/DOM chọn chỗ ghi khác (sổ giao ca, hoặc Ghi chú nội bộ của hồ sơ khách) |
| M49 | 2.14a bước 6 | Quản lý **Điều chỉnh** tiền phòng đêm chưa ở | Rủi ro dưới sàn giá (D14) | Như D14 |
| M50 | 2.15 bước 1–3 | Hộp **Trả muộn**: **Giờ trả đã hẹn**, **Phụ thu đề xuất**, **Lưu giờ trả …** | Đúng. Có thêm **Xin miễn phụ thu (gửi duyệt)**. Ví dụ 14:30 → "210.000 đ (30% giá đêm cuối)" | Không cần sửa (C2-27) |
| M51 | 2.19 bước 2 | **Việc mới** → hộp | Hộp **Tạo việc buồng phòng**: **Căn**, **Loại việc**, **Ngày làm**, **Ghi chú cho buồng phòng**, nút **Việc mới** | Thêm tên hộp (C2-40) |
| M52 | 3.2 | Mã VC "Đã dọn, chờ kiểm" | App nhân viên ghi **Đã dọn – chờ kiểm** | Không cần sửa |
| M53 | 3.4 | **Khách không muốn dọn** → **Lý do** | Thứ tự: **Treo biển "Không làm phiền"**, **Khách nói không cần dọn**, **Lý do khác**; nút **Quay lại** / **Bỏ việc dọn hôm nay** | Không cần sửa (C3-03) |
| M54 | 3.4 bước 5 | Bấm nhầm: **Hoàn tác** trong vài giây | Đúng. Toast "Đã hoàn tác – căn … vẫn là '…'". Thời gian hoàn tác khoảng 10 giây | Ghi "trong khoảng 10 giây" |
| M55 | 3.6 | Kiểm phòng | Màn **Kiểm phòng … · Đã kiểm 0/12 mục**, 12 mục có dấu * (Ga gối, Phòng tắm, Khăn, Amenity, Bếp, Bàn làm việc, Wi-Fi ≥ 50 Mbps, Rèm/cửa sổ, Mùi, Remote/điều hòa/sưởi, Thẻ chào + Wi-Fi…). Nút **Chưa đạt** / **Kiểm đạt – sẵn sàng** | Bỏ "(hoặc quản lý trên Desk)" (Q14) |
| M56 | 3.9 bước 2 | Loại sự cố gồm **Tắc thoát nước**, **Wi-Fi** | App nhân viên chỉ có: Mất nước nóng · Điện / đèn · Rò nước · Khóa cửa · Đồ hỏng · Khác. Desk (**Phiếu sửa mới**) thì có đủ 8 loại | Bỏ 2 loại ở 3.9, hoặc chờ bản vá (BUG-R3-026) |
| M57 | 3.10 | **Tôi → Thao tác trên máy** | Đúng. Màn: thanh "Mất mạng. Bấm vẫn được…", chip **1 thao tác đang chờ gửi**, mục **Đang chờ gửi (1)**: "401 Dọn xong · Bấm lúc 10:41 · Chờ mạng" | Không cần sửa (C3-07) |
| M58 | 4.1 | Phiếu sửa trên app | Đúng: lọc **Đang mở / Gấp / Chờ vật tư**, nút **+ Phiếu sửa mới**, **Nhận việc**, hộp **Chờ vật tư – WO-…** (**Cần vật tư gì?**, **Ngày dự kiến có vật tư**, **Quay lại** / **Lưu – chờ vật tư**), hộp **Sửa xong WO-…** (**Đã làm gì?**, **Ảnh sau khi sửa**, **Xác nhận sửa xong**) | Nút đóng hộp là **Quay lại** (C4-01…C4-03) |
| M59 | 4.1 Khóa phòng trên Desk | **Tạo phiếu và khóa căn**; **Khóa phòng có kế hoạch** | Đúng tên nút. Ô: **Khóa từ**, **Dự kiến xong**, **Lý do khóa** (điền sẵn bằng tiêu đề) | Không cần sửa (C4-04, C4-05) |
| M60 | 4.2 | Báo giá hiện **Bạn nhận (…%)** và **OTTIMO còn lại** | Chỉ có **Bạn nhận (8% tiền phòng – BR-903) 156.480**. Không có dòng "OTTIMO còn lại" | Bỏ "OTTIMO còn lại" (C4-06) |
| M61 | 4.2 / 5.3 | CTV không hủy | Khung đơn giữ chỗ của CTV có **Hủy giữ chỗ** và **Gia hạn giữ chỗ (1 lần)**. Khớp rbac A05 "M" (đơn của mình) | 5.3 dòng "Đổi căn/ngày, hủy…": CTV = "M (hủy giữ chỗ)" |
| M62 | 4.2 Báo đã chuyển cọc | **Số tiền khách chuyển**, **Đính kèm ảnh biên nhận** | Đúng, có thêm **Ghi chú**. Ảnh không bắt buộc | Không cần sửa (C4-07) |
| M63 | 5.3 | Kiểm phòng: OWN ✔, MGR ✔ | Không làm được (Q14) | Đổi OWN, MGR = "–" |
| M64 | 5.3 | Xem giấy tờ: OWN, MGR ✔ | Xem được trên **máy đã cấp quyền**. Desk đòi máy cấp quyền cho mọi vai | Thêm chú thích "(máy được cấp)" như dòng Nhận phòng |

## 3. Bảng ảnh (88 mã)

Quy ước:
- Lưu ở `product/docs/manual/img/<mã>.png`. Tất cả là PNG 8-bit (bảng màu 256).
- Desk: 1440 × 900. App nhân viên, trang khách, sale/CTV trên điện thoại: 390 × 844 DPR 2 (tệp 780 × 1688).
- Mỗi tệp ≤ 100 KB. 86 tệp, tổng 4,7 MB. Không tệp nào phải đổi sang JPEG.
- "Che":
  - Hộp đặc màu Ink #2B2B28, vẽ lúc chụp. Dùng mask của Playwright, hoặc tô nền/chữ trong DOM để tôn trọng lớp phủ.
  - Mọi `svg.qr` / `canvas` được che tự động.
  - Tên khách seed trông không tự nhiên ("Nguyen Thi …", "Pham Van Dang O", "Le Thi Cho Nhan", "Hoang Thi Cong No", "Khach Etoe …"), tên trong đơn thử của INV ("vu hoang anh test"), mọi số điện thoại dạng 0…/+.. và mọi email: che tự động.
  - Tên khách QA tạo trông tự nhiên và giả, để nguyên: Emma Laurent, Lucas Martin (chỉ trên giấy tờ giả), Hannah Becker, Nguyễn Minh An, Trần Quốc Bảo, Chloé Laurent, Đỗ Thanh Hương, Phạm Thu Lan, Nguyễn Hải Đăng.
- **Rà soát (theo yêu cầu SEC, thẻ FB-R3-SEC-BA-11):**
  - QA đã xem lại **từng ảnh** sau khi lưu: ảnh có dữ liệu nhạy cảm xem ở cỡ thật; các hộp thoại của đơn thử và form trống xem qua bảng ghép nửa cỡ (`qa-r6/man/sheets/`).
  - Hai ảnh lọt dữ liệu đã sửa ngay: **C2-14** (QR link check-in) và **C1-09** (mật khẩu tạm). Chi tiết ở mục 3.1.
  - Sau khi sửa: không ảnh nào còn QR, số tài khoản, tên chủ tài khoản, số giấy tờ, mã cửa, mã 2 bước/mã khôi phục, mật khẩu, link có token, SĐT hay email khách.
  - **QA xác nhận thư mục `img/` đã rà xong, ORC commit được.**

### 3.1 Sự cố che ảnh và cách xử lý

| Ảnh | Sự cố | Xử lý |
|---|---|---|
| C2-14 | Mã QR của link check-in OTM-00359 không bị che. QR là `svg.qr` có nhãn "Link check-in online · đơn …", không có chữ "QR" nên bộ lọc tự động bỏ sót. SEC phát hiện | (1) Tô kín vùng QR trên ảnh (hộp Ink 123×123). Bản đã sửa không còn QR. (2) **Thu hồi link** OTM-00359 trên Desk lúc 10:04: trước = link còn hạn tới 30/10 12:00; sau = `DELETE …/guest-link → 204`, mở link thì trang khách báo "Liên kết đã hết hạn" (401 `GUEST_LINK_INVALID`). Tệp link trong scratchpad đã xóa. (3) Thêm `svg.qr` vào danh sách che tự động, ghi số QR trên trang vào nhật ký mỗi lần chụp |
| C1-09 | Mật khẩu tạm của tài khoản dùng một lần `qa.man.fd1` lọt trong ảnh (ô hiển thị không phải `code`/`.mono`). QA tự phát hiện khi rà | Tô kín ô mật khẩu ngay (trước khi ORC commit). Xóa bản chụp thô và tệp chữ của màn này ở scratchpad. **Khóa tài khoản `qa.man.fd1`** lúc 10:39 (đổi mật khẩu cũng vô dụng vì tài khoản đã khóa) |

### 3.2 Bảng từng ảnh

| Mã | Có | Ghi chú / che |
|---|---|---|
| C0-01 | Có | Ô trống |
| C0-02 | Có | Tài khoản lễ tân dùng một lần (đã khóa). 3 ô mật khẩu trống, vẫn phủ hộp che cho chắc |
| C0-03 | Có | Quản lý dùng một lần `qa.man.mgr1`. **Che QR và khóa nhập tay** |
| C0-04 | Có | **Che toàn bộ 10 mã khôi phục** |
| C0-05 | Có | Ô mã trống |
| C0-06 | Có | Menu tài khoản (quản lý) |
| C0-07 | Có | Cắt dải menu 260 px. Lễ tân |
| C0-08 | Có | Cắt chip "Máy quầy đã cấp quyền". Thêm **C0-08b** = "Máy chưa cấp quyền giấy tờ" để UXD so sánh |
| C0-09 | Có | Điện thoại |
| C0-10 | Có | Điện thoại, trang khách sau khi làm thủ tục trước (1/2 giấy tờ + 1 bổ sung tại quầy). **Che ô Wi-Fi**. Không có thanh địa chỉ. Link đã thu hồi |
| C1-01 | Có | Tổng quan staging nhiều dữ liệu E2E (300+ yêu cầu hoàn "E2E dọn dữ liệu"). **Cần chú ý** nằm dưới, ngoài khung. Nên chụp lại trên dữ liệu demo sạch nếu UXD muốn đẹp |
| C1-02 | Có | – |
| C1-03 | Có | Căn 201, đã gõ 720.000 để hiện ô Hiệu lực/Lý do. **Không lưu** (Hủy) |
| C1-04 | Có | Căn 101, ngày 28/10 (đã có giá lên lịch) → câu "Lưu để giữ giá này từ 28/10/2026…". Không lưu |
| C1-05 | Có | **Che khối tài khoản nhận** |
| C1-06 | Có | Quản lý, Hạn giữ chỗ mặc định, có 1 dòng lịch sử. Không lưu |
| C1-07 | Có | Tên đăng nhập thử `qa.*` |
| C1-08 | Có | **Che Mật khẩu tạm**. Không tạo |
| C1-09 | Có | **Che Mật khẩu tạm** (xem 3.1) |
| C1-10 | Có | Chụp trên máy **chưa** cấp quyền để thấy form |
| C1-11 | Có | **Che số TK, tên chủ TK, ngân hàng** |
| C1-12 | Có | Số giả, bước Kiểm tra trước khi lưu. **Che BIN, số TK, tên, ngày**. Đã đóng, không lưu (0 request ghi) |
| C1-13 | Có | Có 1 FOC (OTM-00359) và nhiều hoàn tiền. **Che "Cách hoàn … ••…"** |
| C1-14 | Có | Hộp **Duyệt miễn 210.000 đ cho OTM-00359?**. Sau đó QA **từ chối** yêu cầu này |
| C1-15 | **Không** | Cần đơn đã trả phòng theo đường ESC-031 (căn 203) – cấm đụng, chỉ có sau 18:00. Đề nghị QA ca tối chụp sau ca ESC-031 hoặc chụp lại khi có ca thật |
| C1-16 | Có | Quản lý, hộp **Điều chỉnh: Minibar – Snack khoai tây × 1** trên OTM-00294 (không phải dòng phụ thu ESC-031). Không lưu. Tên khách che |
| C1-17 | Có | OTM-00297. Không xóa nợ |
| C1-18 | Có | Không có mã giao dịch hiện ra. Ô ngày dạng dd/mm |
| C1-19 | Có | **Che cột Mã giao dịch** (đang trống) |
| C1-20 | Có | **Che "••…" nơi nhận hoàn** |
| C1-21 | Có | – |
| C2-01 | Có | Hôm nay. Tên khách seed và tên INV che |
| C2-02 | Có | Sơ đồ phòng. Thiếu thanh "dài hạn nhập tay" (không tạo được – Q4), "khóa phòng", "OTA chưa gán căn" |
| C2-03 | Có | 30/10, 3 đêm |
| C2-04 | Có | Báo giá BG-00046 đã lưu (Nguyễn Minh An), có **Ngôn ngữ gửi khách**, **Sao chép gửi Zalo** |
| C2-05 | Có | Giữ chỗ OTM-00361. **Che QR và tài khoản nhận**, giữ số tiền và nội dung. Thấy lỗi đã biết (số cọc/nội dung hiện hai lần) |
| C2-06 | Có | Hộp **Xác nhận cọc · OTM-00361** (không có ô mã giao dịch – D16). Không xác nhận |
| C2-07 | Có | Emma Laurent, Zalo/điện thoại. Thấy lỗi đã biết "Bắt buộc" đỏ sau Tạo nhanh khách |
| C2-08 | Có | Đơn OTA thử (Booking.com, mã QA-BK-551203). Đã tạo rồi **hủy** |
| C2-09 | Có | Form đã điền (402, 01/03–01/06/2027 thay vì căn 102, để không chiếm căn thật). **Tạo đơn thất bại 422** – ảnh vẫn dùng được cho phần form |
| C2-10 | Có | OTM-00359 đã cọc |
| C2-11 | Có | Đổi sang 401, tính thử +684.000. Không lưu |
| C2-12 | Có | Hộp hủy OTM-00359 (đến hôm nay → giữ 400.000, không hoàn; danh sách không có đơn đến sau 4 ngày đã cọc). Không hủy |
| C2-13 | **Không** | Nút **Đánh dấu không đến** chỉ mở từ 23:00 (sau mốc 17:30). Cần QA ca đêm |
| C2-14 | Có | **Che link và QR** (xem 3.1) |
| C2-15 | Có | Khách nước ngoài 2 người, 1 giấy tờ gửi qua link. **Che số cuối giấy tờ** |
| C2-16 | Có | Dòng **Chưa kiểm được** (dấu nhập cảnh). **Che số giấy tờ** |
| C2-17 | Có | Bước Khai báo: Khai báo tạm trú người nước ngoài, hạn 22:12 |
| C2-18 | Có | Nhận sớm 10:15 → 210.000 (30 %) |
| C2-19 | Có | Thu **Tiền mặt** 1.300.000 → thối 90.000. Không có QR trong ảnh. Dùng cho cả 2.10 và 2.13 |
| C2-20 | Có | Mã cửa (không nhập mã), 1 thẻ, tích nội quy, khối **Khi bấm Nhận phòng** |
| C2-21 | Có | Danh sách 7 hồ sơ. Không có hồ sơ "quá hạn" người nước ngoài, có 2 hồ sơ VN quá hạn. Tên seed che |
| C2-22 | Có | 3 khối. **Che toàn bộ cột Giá trị**. Khối 3 nằm dưới khung |
| C2-23 | Có | Hộp Thêm phát sinh, đã chọn Giặt ủi |
| C2-24 | Có | Chloé Laurent (thêm người lớn), phụ thu 300.000 / 2 đêm. Không thêm |
| C2-25 | Có | Gia hạn, 7 đêm trống |
| C2-26 | Có | Đổi phòng (thấy 401 VD trong danh sách – BUG-R3-023). Không đổi |
| C2-27 | Có | Trả muộn 14:30 → 210.000. Không lưu (request chỉ là `dryRun`) |
| C2-28 | Có | Xác nhận giờ trả. Không lưu |
| C2-29 | Có | Khối Yêu cầu của khách (1 yêu cầu có sẵn của căn 203 – chỉ xem). Không có yêu cầu "Khăn" và "Báo hỏng": link khách của OTM-00359 đã thu hồi theo SEC |
| C2-30 | Có | Miễn phí phụ thu nhận sớm, **Gửi duyệt** (sau đó quản lý **từ chối**) |
| C2-31 | Có | Bước Minibar của OTM-00359 (mở bằng URL – xem BUG-R3-024) |
| C2-32 | Có | Bước Phụ phí với giờ 08:30. **Không phải** ví dụ 13:30 / 30 % (giờ thật lúc chụp là 10:22). Đề nghị chụp lại ngày 29/10 |
| C2-33 | Có | Bước Bill & thu tiền. Còn phải thu = 0, không có mã POS |
| C2-34 | **Không** | Cần căn 203 / sau 18:00 (ESC-031) – cấm đụng |
| C2-35 | Có | Phiếu thanh toán Việt – Anh, OTM-00294 (đã trả phòng sẵn trên staging). **Che tên khách** |
| C2-36 | Có | Công ty giả, MST giả 9999999999. **Email che** |
| C2-37 | Có | Thu công nợ OTM-00297. Không ghi. Tên che |
| C2-38 | Có | `qa.fd2` chi hoàn tiền mặt OTM-00335 200.000. Không ghi |
| C2-39 | Có | Form website đang tắt |
| C2-40 | Có | Lễ tân trưởng, hộp Tạo việc buồng phòng. Không tạo |
| C3-01 | Có | Có nhóm Làm trước, Khách đang ở, việc Bổ sung minibar. Không có việc "Chờ khách trả phòng" |
| C3-02 | Có | 401 sau **Bắt đầu dọn** (có Dọn xong) |
| C3-03 | Có | 302 (của dữ liệu khác) – chỉ mở hộp, **không** bỏ việc |
| C3-04 | Có | Các căn (tên khách chỉ tên gọi, seed che) |
| C3-05 | Có | Lễ tân trưởng, Kiểm phòng 103. Không ghi kết quả |
| C3-06 | Có | Form báo sự cố trống |
| C3-07 | Có | Ngắt mạng → Dọn xong 401 → Thao tác trên máy (1 chờ gửi). Có mạng lại → đã gửi |
| C3-08 | Có | **Không có thông báo nào** ("Chưa có thông báo"). Danh sách cần ≥ 3 thông báo – staging không có. Nên chụp lại |
| C3-09 | Có | – |
| C4-01 | Có | 1 phiếu Trong ngày (WO-00003, QA tạo). Không có phiếu Gấp, Chờ vật tư |
| C4-02 | Có | Hộp Chờ vật tư. Ô ngày hiện "mm/dd/yyyy" do trình duyệt máy chụp (Chrome thật theo ngôn ngữ máy) |
| C4-03 | Có | Hộp Sửa xong. Ảnh chụp trước khi gắn ảnh. Phiếu không khóa phòng |
| C4-04 | Có | Tab Khóa phòng: chỉ có khóa cũ (đã mở/đã hủy của E2E). Không có khóa đang hiệu lực / sắp khóa |
| C4-05 | Có | Phiếu sửa mới 103 + **Khóa căn**. Không tạo. Ô ảnh "Choose File" là chữ mặc định của Chromium headless |
| C4-06 | Có | CTV trên điện thoại, cuộn tới dòng **Bạn nhận** |
| C4-07 | Có | CTV, hộp Báo đã chuyển cọc (OTM-00362). Không gửi, không có ảnh biên nhận |
| C4-08 | Có (thiếu ý) | Sale nội bộ, **Đơn của tôi**. Staging chỉ có đơn đã hủy nên khung đơn **không có** dòng "Hoa hồng dự kiến của bạn". Cần chụp lại khi có đơn sale chốt |

Tổng: **85/88 mã có ảnh** (thêm C0-08b). Không có: C1-15, C2-13, C2-34 – đều cần ca ESC-031 tối nay hoặc giờ sau 23:00.
Nên chụp lại: C1-01 (dữ liệu demo sạch), C2-32 (13:30), C3-08 (có thông báo), C4-01 và C4-04 (đủ trạng thái), C4-08 (đơn sale).

## 4. Lỗi sản phẩm mới

Chi tiết ở `rounds/round-03/qa/bug-list.md`.

| ID | Mức | Tóm tắt | Vai |
|---|---|---|---|
| BUG-R3-019 | **P1** | Không tạo được **Đơn dài hạn nhập tay**: 422 `directSource REQUIRED` (form không gửi nguồn; quy tắc US-155) | FE-A (+ BE-D) |
| BUG-R3-020 | P2 | **In phiếu** in cả khung Desk, không có CSS in | FE-A (+ UXD) |
| BUG-R3-021 | P2 | Không có chỗ nhập Wi-Fi trên Desk; trang khách nói "Hiện ở đây vào ngày nhận phòng" ngay trong ngày nhận phòng | PO + FE-A/BE (+ OPS dữ liệu production) |
| BUG-R3-022 | P2 | Desk không cho ghi phát sinh sau trả phòng (nút chỉ khi Đang ở) dù máy chủ có cửa sổ BR-427 c | FE-A |
| BUG-R3-023 | P2 | Hộp Đổi phòng liệt kê căn **VD** (401) là "căn mới đã dọn/đã kiểm"; nhãn nhóm hiện mã nội bộ | FE-A / BE-A |
| BUG-R3-024 | P3 | Trang Trả phòng mở được bằng URL trước ngày đi; mỗi lần qua bước 1 ghi một `minibar-checks`; bước cuối 409 với câu sai "Đơn vừa chuyển sang 'Đang ở'" | FE-A |
| BUG-R3-025 | P3 | Hộp Xác nhận cọc không có ô mã giao dịch → cột Mã giao dịch ở Chờ đối soát trống | FE-A (+ UXD) |
| BUG-R3-026 | P3 | App nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi" (Desk có) | MOB |
| BUG-R3-027 | P3 | Trang khách: mở lại link giữa chừng sau khi chọn "Bổ sung tại quầy" → Gửi thủ tục 409, quay về bước Giấy tờ, không báo gì | FE (guest-web) |
| BUG-R3-028 | P3 | Chữ trên giao diện: lộ "Round 3 / R2 / R3" cho nhân viên; nhãn sai ("Khách đứng tên" ở người đi cùng, "Giờ trả phòng thực tế" ở xác nhận giờ trả, "chỉ hiện căn … còn trống"); hạn báo giá 00:00 vs 23:59 | UXD + FE |
| BUG-R3-029 | P3 | App nhân viên, OWN/MGR đăng nhập: vừa "Nhập mã…" vừa "Đăng nhập 2 bước sẽ có ở bản sau" | UXD + MOB |
| BUG-R3-030 | P3 | Folio ở màn Trả phòng hiện dòng miễn **Bị từ chối** với số âm (−210.000) dễ hiểu nhầm là đã trừ | FE-A |
| BUG-R3-031 | P3 | Nút **Hoàn tác nhận phòng** mở dù folio đã có dòng mới; bấm thì 409 "reverse the lines posted since check-in first" | FE-A |

- Không có lỗi P0.
- BUG-R3-019 là P1. Nó chặn chuyển đổi khách dài hạn ngày D (`day-one-guide.md` mục 4). Không có cách làm trên Desk, chỉ có cách tạm là khóa phòng có kế hoạch. ORC nên đưa vào bản vá trước 02/11.
- QA không tạo ESC: lỗi P1 thuộc quyền ORC/PO xếp vào bản vá.

## 5. Dữ liệu QA tạo trên staging – trước/sau

| Đối tượng | Trước | Sau / đã dọn |
|---|---|---|
| **OTM-00359** (Emma Laurent, 201, 27→29/10, Trực tiếp) | Không có | Tạo 09:48, cọc 400.000 tiền mặt (giả). Link khách tạo rồi **thu hồi**. Khách gửi 1 ảnh giấy tờ giả (PNG 16×16) + chọn "không lưu ảnh". **Nhận phòng 10:15** (nhận sớm 210.000, thu 1.210.000 tiền mặt giả). 2 giấy tờ giả số X0000001/X0000002 (chỉ 4 số cuối hiện trên ảnh, đã che). Đối chiếu xong, **chưa khai báo** (hạn 22:15 hôm nay). FOC 210.000 gửi duyệt → quản lý **từ chối**. Thông tin hóa đơn công ty giả đã lưu. 4 bản ghi `minibar-checks` (0 món dùng). **Không hủy được**: quản lý thử Hoàn tác nhận phòng → 409 (folio có dòng mới); trả phòng trước ngày đi → 409. **Còn Đang ở tới 29/10.** Đề nghị: ngày 29/10 QA trả phòng đơn này (và dùng nó để chụp lại C2-32, kiểm D14). Tối nay hồ sơ khai báo sẽ hiện "quá hạn" ở Cần chú ý – dữ liệu thử, không phải lỗi |
| OTM-00360 (OTA Booking.com, 402, 10→12/11) | Không có | Tạo rồi **hủy** (OTA báo hủy, phạt 0) |
| OTM-00361 (giữ chỗ 202, 30/10→02/11) + BG-00046 | Không có | Giữ chỗ **hủy** (Khách đổi ý). VietQR cọc đã tạo (không ai chuyển). BG-00046 về "Đã báo giá", hết hạn 30/10 |
| OTM-00362 (giữ chỗ của CTV, 103, 13→15/11) + báo giá CTV | Không có | **Hủy** (lễ tân, Khách đổi ý). Báo giá CTV còn, hết hạn sau 3 ngày |
| Hồ sơ khách | – | Thêm 6 hồ sơ giả: Emma Laurent (KH-0436), Hannah Becker, Nguyễn Minh An, Trần Quốc Bảo, Chloé Laurent, Đỗ Thanh Hương. Desk không có nút xóa hồ sơ |
| Tài khoản `qa.man.fd1` (Lễ tân), `qa.man.mgr1` (Quản lý, đã bật 2 bước) | Không có | Tạo cho C0-02…C0-05, C1-09, rồi **Khóa tài khoản** (cả hai, 10:39). Mật khẩu, khóa TOTP, mã khôi phục chỉ nằm trong bộ nhớ ca chạy và tệp 0600 ở scratchpad. **Đã xóa tệp** |
| WO-00003 (402, Đồ hỏng, Trong ngày) | Không có | Buồng phòng báo → bảo trì nhận → **Sửa xong** (ảnh giả). Không khóa phòng |
| Căn 401 | VD, việc "Dọn trả phòng" chưa làm | Buồng phòng **Bắt đầu dọn → Dọn xong** (gửi khi có mạng lại) → **VC · Đã dọn, chờ kiểm** |
| Giá căn 101 | Đêm 800.000, lên lịch 28/10 = 800.000, 29/10 = 800.000 | Quản lý lưu lại 28/10 = 800.000 (Q12). **Không đổi số**. Thêm 1 dòng `room.updated` |
| Tham số, tài khoản nhận | – | Không đổi. C1-12 mở form rồi đóng, 0 request ghi |
| Căn 203, OTM-00357, OTM-00358 | – | **Không đụng.** Chỉ hiện trong ảnh màn Hôm nay/Sơ đồ (tên đã che) |

## 6. Giả định và giới hạn

- `[GIẢ ĐỊNH QA]` Ảnh chụp bằng Chromium headless. Ô ngày, ô chọn tệp ("Choose File", "mm/dd/yyyy" ở C4-02, C4-05) có thể khác Chrome thật ở máy quầy tiếng Việt. Ảnh Desk chụp với `--lang=vi-VN` từ 10:00. C1-03 đã chụp lại cho đúng định dạng dd/mm/yyyy.
- Q2, D14 (bước 6) trả lời bằng mã nguồn và E2E cũ, chưa thao tác đủ trên staging. Q4 chưa diễn tập được vì lỗi P1.
- Nội dung sổ tay đổi từ 1.0 sang 1.1 trong lúc kiểm. Bảng mục 2 theo số mục của bản 1.1.
