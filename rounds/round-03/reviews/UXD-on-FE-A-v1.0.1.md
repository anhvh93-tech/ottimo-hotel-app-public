# UXD review – FE-A v1.0.1: hộp Trả sớm (B16) + giá đã lên lịch trên ngăn kéo căn

- Round 3 · Bước: Review chéo (v1.0.1) · 27/10/2026 · Người review: UXD · Tác giả: FE-A
- Đối tượng: nhánh `fe-a-v1.0.1`, commit `02b13f4`. Tệp chính:
  - `product/apps/admin-web/src/pages/stay/EarlyDepartureDialog.tsx`
  - `product/apps/admin-web/src/pages/RoomDrawer.tsx`
  - `product/apps/admin-web/src/pages/reservations/ReservationDrawer.tsx`
  - `product/design/tools/gen_strings.py`
- Căn cứ:
  - spec UXD `rounds/round-03/outputs/UXD/v1.0.1-early-departure-and-prices.md` và bản minh họa `.html` cùng thư mục;
  - OpenAPI 0.3.9-draft (`22fe06d`);
  - Design System v0.4.1, content-guide v0.4, OTTIMO Brand Guidelines.
- Cách rà:
  - Đọc code hai màn và phần nối vào drawer.
  - Chạy `vitest` hai tệp mới trong worktree: `v101-early-departure-fea`, `v101-scheduled-prices-fea` – **24/24 qua**.
  - Không chạy dev server.
- **Kết luận: ĐẠT CÓ ĐIỀU KIỆN.** 1 Major (thẻ 06 – lượt ở có đơn con gia hạn), 4 Minor, 2 Suggestion. Không có Blocker, không có ESC.

## 1. Hai việc ORC cần chốt

### G1 – Điền sẵn hai ô giá theo ngày D: **chấp nhận cách của FE-A**, UXD sửa spec 3.5

**Cách FE-A làm:** ô OWN đã gõ thì giữ số đã gõ. Ô chưa gõ thì điền theo dòng đang áp cho ngày D (`pickDate`, `editedMonthly`/`editedNightly`). Sau khi hủy lịch giá trùng D cũng điền lại như vậy.

**Vì sao FE-A đúng:** `updateRoom.listPrice` luôn ghi **đủ hai giá** cho D. Quy tắc cũ của spec ("đã sửa một ô thì không điền lại ô nào") để lại một kẽ hở. Ví dụ:
1. Ô giá tháng đang hiện giá hôm nay 11.000.000.
2. OWN gõ giá đêm, rồi chọn D = 01/11. Dòng của D có giá tháng 11.500.000.
3. Theo spec cũ, ô giá tháng vẫn giữ 11.000.000.
4. Khi lưu, máy chủ âm thầm ghi 11.000.000 đè lên dòng 01/11.

Đây đúng là rủi ro QA đã ghi ở BUG-R3-018. Cách điền theo từng ô không có kẽ hở này. OWN vẫn thấy cả hai giá của dòng D qua chữ phụ `rooms.price_replace_scheduled`.

**Spec đã sửa** mục 3.5 (D10 giữ nguyên):
- Đổi D → ô **chưa gõ** điền theo dòng áp cho D; ô **đã gõ** giữ số.
- So "đã đổi" với dòng áp cho D.

### G2 – Hai nhãn mới cho ô ngày và ô giờ khách báo: **duyệt khóa, sửa chữ**

Hai ô nằm trong `fieldset` có legend `early_departure.notice_at`. Nhãn con "Ngày khách báo" và "Giờ khách báo (24 giờ)" lặp lại legend. Chữ "24 giờ" cũng lặp lại chữ phụ `stay.late_help` ("Dạng 24 giờ, ví dụ 12:30.") đang gắn ngay dưới ô giờ.

Trình đọc màn hình đọc legend trước nhãn ("Khách báo lúc, nhóm – Ngày"), nên nhãn con chỉ cần một từ.

| Khóa | FE-A đề xuất | UXD chốt VI | UXD chốt EN |
|---|---|---|---|
| `early_departure.notice_date` | Ngày khách báo / Date told | **Ngày** | **Date** |
| `early_departure.notice_time` | Giờ khách báo (24 giờ) / Time told (24h) | **Giờ** | **Time** |
| `early_departure.notice_at` (legend, đổi VI) | Giờ khách báo | **Khách báo lúc** | Guest told us at (giữ) |

- VI legend đổi vì nhóm này gồm cả ngày lẫn giờ, và câu mới khớp EN "Guest told us at".
- Ghi chú hai khóa mới: bỏ "chờ UXD duyệt", ghi "UXD duyệt 27/10 (G2)".
- Spec mục 2.3 và bảng chuỗi đã cập nhật theo bảng trên.

## 2. Thẻ feedback

### FB-R3-UXD-FE-A-06
- Mức độ: Major
- Vị trí:
  - `EarlyDepartureDialog.tsx`: `maxDate = addDays(r.departureDate, -1)`; `stay_now` dùng `r.departureDate` và `r.nights`.
  - `ReservationDrawer.tsx`: nút chỉ hiện khi `businessDay < r.departureDate`.
- Vấn đề:
  - Hợp đồng (`newDepartureDate`) và spec 2.3 lấy "ngày đi hiện tại của lượt ở, **gồm đơn con gia hạn**" (BR-422). Code đang dùng ngày đi của **đơn chính**. Mock của chính FE-A (`mocks/stay.ts`, `stayEnd`) đã tính đúng theo đơn con, nhưng giao diện chặn trước.
  - Hệ quả với đơn OTA đã gia hạn bằng đơn con Trực tiếp, ví dụ đơn chính 20–24/10, đơn con 24–26/10:
    1. Không chọn được ngày rời 25/10 (max = 23/10).
    2. Từ ngày 24/10 nút "Trả sớm" biến mất hẳn, dù khách vẫn ở và máy chủ vẫn trả `early_departure` trong `allowedActions`.
    3. Dòng "Lượt ở hiện tại" nói sai ngày đi.
  - Ca `effect_child_*` của spec (oracle "đơn con gia hạn bị hủy hẳn") chưa có test.
- Vì sao quan trọng:
  - Khách OTA gia hạn rồi xin về sớm là ca DOM đã nêu (BR-422, BR-428).
  - Desk không làm được nên lễ tân quay về cách tạm tay: không mở bán đêm, tính hoàn tay – đúng rủi ro FB-R3-DOM-BA-02 (Blocker gốc).
- Đề xuất sửa:
  1. Lấy ngày đi của cả lượt. Cách gọn nhất là ARC thêm trường chỉ đọc `Reservation.stayDepartureDate` (thay đổi cộng thêm, máy chủ đã tính cho `allowedActions`/B18). Nếu đã có cách đọc đơn con hiện có, FE-A dùng cách đó.
  2. Dùng ngày này cho `maxDate`, cho điều kiện hiện nút và cho dòng `stay_now`.
  3. Tạm thời, nếu chưa có trường: khi đơn có đơn con, bỏ chặn phía client và để máy chủ kiểm. Lỗi 422 `DATE_INVALID` đã hiện tại ô.
  4. Thêm test ca đơn con: chọn ngày trong khoảng của đơn con; đơn con bị hủy hẳn → `effect_child_cancelled` và `done_child_cancelled`.
- Trạng thái: Open (FE-A; ORC hỏi ARC về trường `stayDepartureDate`)

### FB-R3-UXD-FE-A-07
- Mức độ: Minor
- Vị trí: `EarlyDepartureDialog.tsx`, bước 2 – `<h3 className="label-h">` của `early_departure.preview_question`
- Vấn đề:
  - `.label-h` là kiểu nhãn nhóm: 12 px, chữ hoa, chữ Stone. Câu hỏi xác nhận "Trả sớm cho Lê Minh An, rời 22/10?" thành dòng chữ hoa nhỏ, chìm hơn cả bảng tiền bên dưới.
  - DS 6.1 cần tiêu đề là câu hỏi rõ đối tượng. Brand cũng tránh chữ hoa cho câu.
- Vì sao quan trọng: Đây là chỗ lễ tân đọc để nói với khách trước một thao tác không đảo ngược.
- Đề xuất sửa: Bỏ `className="label-h"`, để `h3` mặc định (Be Vietnam Pro 600, 16 px) như bản minh họa E.2. Giữ `tabIndex={-1}` và focus.
- Trạng thái: Open

### FB-R3-UXD-FE-A-08
- Mức độ: Minor
- Vị trí: `EarlyDepartureDialog.tsx` – `Consequences` dùng `<ul className="list-plain">`
- Vấn đề: Spec 2.5 và mẫu H15 (gia hạn, trả muộn) đặt khối hậu quả trong `ul.consequence` (nền `--surface-2`, bo góc). Hiện các dòng "mở bán lại", "ngày đi đổi", "nhắc mã cửa" là danh sách trơn, khó tách khỏi bảng tiền ở trên.
- Vì sao quan trọng: Nhất quán với các hộp lưu trú khác. Lễ tân quen tìm "hậu quả" ở khối nền xám.
- Đề xuất sửa: `<ul className="consequence">`. Giữ tiêu đề `effects_title`.
- Trạng thái: Open

### FB-R3-UXD-FE-A-09
- Mức độ: Minor
- Vị trí: `RoomDrawer.tsx` – `cancelScheduled` khi thành công
- Vấn đề: Spec 3.3 yêu cầu: sau khi hủy, focus vào nút hủy của dòng kế tiếp, hết dòng thì vào tiêu đề mục. Code đóng `ConfirmDialog` mà không đặt focus. Nút gọi hộp đã bị gỡ khỏi DOM, nên focus trả về không có chỗ đến và rơi về đầu trang hoặc `body`.
- Vì sao quan trọng: Người dùng bàn phím và trình đọc màn hình mất vị trí trong ngăn kéo (DS 8, C15 "trả focus").
- Đề xuất sửa: Sau `setCur(data)`, đặt focus vào nút hủy của dòng có `effectiveFrom` kế tiếp. Không còn dòng thì focus `h3#…-sched` (thêm `tabIndex={-1}`).
- Trạng thái: Open

### FB-R3-UXD-FE-A-10
- Mức độ: Minor
- Vị trí: `gen_strings.py` – `early_departure.notice_date`, `notice_time`, `notice_at` (VI)
- Vấn đề: Xem G2 ở trên. Nhãn lặp legend và lặp chữ phụ "24 giờ".
- Vì sao quan trọng: Ô nhập gọn hơn; giọng Desk ngắn.
- Đề xuất sửa: Theo bảng G2. Kỳ vọng test bám nhãn cũ thì sửa theo.
- Trạng thái: Open

### FB-R3-UXD-FE-A-11
- Mức độ: Suggestion
- Vị trí: `EarlyDepartureDialog.tsx` – `Figures`, các dòng chi tiết đều `tr.sub`
- Vấn đề: `tr.sub` làm cả 7 dòng chi tiết thành chữ Stone 13 px, gồm cả "Cơ sở", "Báo trước", "Phần hoàn theo chính sách". Spec chỉ cho dòng "Phụ thu người chưa thu – chỉ đảo dòng" màu Stone vì nó không cộng vào số hoàn.
- Vì sao quan trọng: Lễ tân giải thích cho khách bằng chính các dòng này. Để chữ Ink thì chúng khác hẳn dòng phụ.
- Đề xuất sửa: Dòng chi tiết dùng `tr` thường. Chỉ `row_extra_reversed` giữ `sub`.
- Trạng thái: Open

### FB-R3-UXD-FE-A-12
- Mức độ: Suggestion
- Vị trí: `EarlyDepartureDialog.tsx` – dòng trạng thái bước 1, `LoadingBlock` hiện ngay khi bắt đầu tính thử
- Vấn đề: DS 4 (thời gian) quy định skeleton chỉ hiện nếu chờ quá 300 ms. Mỗi lần gõ, sau debounce là một khung xám nháy lên rồi tắt.
- Vì sao quan trọng: Nhấp nháy làm bước 1 trông bồn chồn, trái tinh thần "calm" của brand.
- Đề xuất sửa: Hiện `LoadingBlock` sau 300 ms. Chữ `preview_loading` vẫn hiện ngay (đã có `aria-live`).
- Trạng thái: Open

## 3. Đối chiếu nhanh với spec (đạt)

- Ba bước, Steps C17 `aria-current`, focus tiêu đề bước, `aria-live` cho dòng trạng thái.
- Tính thử debounce 400 ms. Bỏ qua phản hồi cũ (`sig` + `tick`). Không có đường ghi khi chưa xem trước. 422 `dryRun NOT_ALLOWED` hoặc thiếu `droppedNights` → `preview_unavailable`.
- Mục bằng chứng hiện khi sửa lùi giờ báo hoặc khi máy chủ trả cờ, và giữ hiện sau đó. Ô OTA chỉ hiện khi có `otaRetainedMaxVnd`. Lỗi 422 hiện tại ô bằng chữ `err.*`.
- Tick "Đã báo khách" trước nút `danger`. Nút khóa có `aria-disabled` kèm lý do.
- 409 `AMOUNT_CHANGED`: tính thử lại, chip "Vừa đổi" (icon) + "Trước: …", bỏ tick, focus vào alert. Cờ thiếu dữ liệu mới → về bước 1.
- 412: về bước 1, giữ ô, alert `err.version_conflict`. Lỗi mạng ở lần ghi: "Thử lại" giữ `Idempotency-Key`.
- Bước 3:
  - "Trả phòng ngay" chỉ khi ngày rời là hôm nay và có `check_out`;
  - nhắc khai báo là Alert warn bền (không dùng toast);
  - liên kết yêu cầu hoàn có chip "Chờ duyệt";
  - "Xem cách tính" dùng lại bảng.
- Ngăn kéo căn:
  - mục chỉ hiện khi có `scheduledListPrices`; có dòng "Đang dùng từ" (chip `ink` + icon);
  - dòng trùng D tô `is-editing`;
  - căn chỉ có một giá thì không có nút hủy (D9);
  - hộp hủy nêu giá dùng lại và mốc lịch kế tiếp;
  - xử lý đủ 409 `effective`/`only_price` (khóa, nút "Đóng"), 404 (alert info), 412 (giữ lý do, đọc lại căn);
  - chữ phụ dưới "Hiệu lực từ" đặt rộng cả hàng.
- Chuỗi: khối UXD dán đủ. Thẻ 04/05 đã làm: `rooms.saved_scheduled` và `rooms.saved` EN sửa, hai khóa `price_same_*` đã bỏ.
- Brand: chỉ token và component `@ottimo/ui`, không màu mới. Mã đơn dùng `.mono` (JetBrains Mono). Không emoji, không "!".

## 4. Điểm làm tốt

- Chặn đúng "không bao giờ ghi khi chưa xem trước". Phản hồi tính thử cũ không thể ghi đè phản hồi mới (`sig` + `tick`). Hai chỗ này dễ sai nhất của hộp.
- G1 – FE-A thấy kẽ hở ghi giá hôm nay đè lên dòng D trong spec, và sửa theo cách an toàn hơn spec.
- Có 24 ca test bám trạng thái ở bảng 2.2 của spec. Mock MSW tính lượt ở theo đơn con – nền tốt để thêm test cho thẻ 06.
