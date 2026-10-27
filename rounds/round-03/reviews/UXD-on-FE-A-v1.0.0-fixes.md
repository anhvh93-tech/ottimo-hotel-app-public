# UXD review – FE-A v1.0.0 fixes (BUG-R3-019…023), bản cắt 29/10

- Round 3 · Bước: Review chéo · 27/10/2026 · Người review: UXD · Tác giả: FE-A
- Đối tượng: nhánh `fe-a-v1.0.0-fixes`, commit `558f126`; báo cáo `rounds/round-03/outputs/FE/v1.0.0-fixes-fe-a.md` (trong nhánh).
- Đã đọc trong diff:
  - `apps/admin-web/src/print.css`
  - `ReservationDrawer.tsx` (nút sau trả phòng)
  - `StayDialogs.tsx` (danh sách đổi phòng)
  - `gen_strings.py` (`gw.wifi_ask_desk`)
  - `hifi.css` §16
- Không chạy lại test; FE-A báo admin-web 641/641, guest-web 72/72.
- Căn cứ:
  - OTTIMO Brand Guidelines v1.0 (bảng 80/15/5, hệ chữ, giọng khách);
  - content-guide v0.4 (mục 1, 3.1, 3.2);
  - Design System v0.4.1 (C24 Bill, C34 Room label, 6.1);
  - BR-427 (c).
- **Kết luận: ĐẠT CÓ ĐIỀU KIỆN cho v1.0.0.**
  - Có 1 Major (thẻ 17 – câu `room_change.ready_only` đang nói sai). Thẻ này chỉ cần thay chuỗi, không đổi code.
  - Ngoài ra 2 Minor, 3 Suggestion.
  - Không có Blocker, không có ESC.

## 1. Năm việc ORC cần chốt

| # | Việc | Chốt UXD |
|---|---|---|
| 1 | `gw.wifi_ask_desk` + RU | **Duyệt có sửa EN.** Trang khách đang dùng "reception", không dùng "front desk" (`gw.defer_at_desk`, `gw.closed_body`, `gw.done_desk_check`). RU dùng "администратор" như `guest.req.decline.other` – thẻ 16 |
| 2 | `room_change.ready_only` nói sai | **Thay câu ngay ở v1.0.0** – thẻ 17. Câu cũ còn dùng nhãn "Trống, sạch", không có trong bảng thuật ngữ 3.2. Có kèm câu dự kiến cho v1.0.1 khi máy chủ lọc được |
| 3 | In phiếu khổ A4 | **Chấp nhận A4.** Máy in quầy là A4; A5 phải đổi khay hoặc chỉnh tay mỗi lần. Brand: màu đúng bảng; cỡ chữ cần nâng nhẹ theo thang in của guideline – thẻ 18. UXD sẽ sửa hifi §16 sang A4 – mục 3 |
| 4 | Nhãn nhóm căn "Lầu 1–2", "Căn N", "Căn N+" | **Chấp nhận** cho Desk (dữ liệu nhóm do chủ đầu tư đặt, chỉ nhân viên thấy). Dòng chọn căn đang thiếu tên phòng theo DS C34 – thẻ 19 (Suggestion) |
| 5 | Vị trí nút "Thêm phát sinh" ở đơn đã trả phòng | **Chấp nhận chân khung đơn.** Đề nghị xếp lại thứ tự nút: nút chính đứng cuối (phải) – thẻ 20. Thêm một dòng nhắc trong hộp khi đơn đã trả phòng – thẻ 21 |

## 2. Thẻ feedback

### FB-R3-UXD-FE-A-16
- Mức độ: Minor
- Vị trí: `product/design/tools/gen_strings.py` – `gw.wifi_ask_desk` (guest-web, `WifiBlock.tsx`)
- Vấn đề:
  - EN dùng "the front desk". Mọi chuỗi trang khách đang dùng "reception": "Add at reception", "Message or call reception", "At reception, staff will…".
  - RU đang trống (rơi về EN), trong khi khách Nga là nhóm có RU riêng ở guest-web.
- Vì sao quan trọng:
  - Chữ khách nhìn thấy phải dùng một thuật ngữ cho một khái niệm (content-guide 3).
  - Khách đọc RU sẽ gặp đúng một dòng EN giữa trang RU.
- Đề xuất sửa (giọng brand: ngắn, lịch sự, EN dẫn dắt):
  - EN: **"Please ask reception for the network name and password."**
  - VI: **"Vui lòng hỏi lễ tân tên mạng và mật khẩu."** (giữ nguyên)
  - RU: **"Пожалуйста, узнайте имя сети и пароль у администратора."**
  - "network name" khớp nhãn `gw.wifi_name` "Network name" / "Имя сети".
  - Bản RU nằm trong danh sách RU chờ người dịch duyệt (content-guide 5.6). Câu ngắn, không pháp lý – được phát hành trước.
- Trạng thái: Open (FE-A đổi chuỗi, sinh lại JSON)

### FB-R3-UXD-FE-A-17
- Mức độ: Major
- Vị trí: `gen_strings.py` – `room_change.ready_only` (hộp Đổi phòng, `ChangeRoomForm`)
- Vấn đề:
  - Câu hiện tại: "Chỉ hiện căn \"Sẵn sàng\" hoặc \"Trống, sạch\" và không bị khóa." Câu này **sai sự thật**: danh sách `searchAvailability` vẫn có căn VD. Máy chủ chỉ chặn khi chọn (`ROOM_NOT_READY`).
  - Nhãn "Trống, sạch" không có trong bảng 3.2. Hai trạng thái máy chủ cho phép là "VI · Đã kiểm, sẵn sàng" và "VC · Đã dọn, chờ kiểm".
- Vì sao quan trọng: Lễ tân tin câu này, chọn căn VD, rồi bị báo lỗi ngay trước mặt khách đang đứng chờ đổi phòng. Chữ hứa điều sản phẩm không làm là lỗi HR-20 (trạng thái hệ thống trung thực).
- Đề xuất sửa:
  - **v1.0.0** (danh sách chưa lọc):
    - VI: **"Chỉ đổi được sang căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm. Danh sách có thể còn căn chưa dọn – chọn căn đó sẽ được báo, không lưu gì."**
    - EN: **"You can only move to a room that is VI · Inspected, ready or VC · Cleaned, awaiting inspection. The list may still include rooms not yet cleaned – choosing one shows a message and nothing is saved."**
  - **v1.0.1** (sau khi ARC/BE chọn (a) hoặc (b) và danh sách đã lọc):
    - VI: "Chỉ hiện căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm, và không bị khóa."
    - EN: "Only rooms that are VI · Inspected, ready or VC · Cleaned, awaiting inspection, and not blocked, are shown."
  - Ghi chú khóa: "v1.0.0: danh sách chưa lọc trạng thái buồng (BUG-R3-023) – đổi câu khi lọc ở v1.0.1".
- Trạng thái: Open (FE-A đổi chuỗi trước khi cắt 29/10)

### FB-R3-UXD-FE-A-18
- Mức độ: Minor
- Vị trí: `apps/admin-web/src/print.css`
- Vấn đề:
  - **Màu:** đúng brand.
    - Chỉ dùng token `--brand-*`: Ink/Stone trên trắng, gạch đầu Light Oak, kẻ Sage, dấu thanh toán Earth Brown.
    - Bản in không còn `--ok` xanh lá và mã `#E0D8CA`/`#857E71` của hifi §16.
    - Sage và Light Oak chỉ làm nét kẻ, không làm chữ – đúng guideline p19.
  - **Chữ:** dưới thang in của guideline p22.
    - Nội dung 10,5 pt (Body 11–13 pt).
    - Tiêu đề cột `th` 8,5 pt (Label 9–11 pt).
  - **Bố cục:** khổ A4 với `max-width: 174mm` là đúng (210 − 2 × 18).
- Vì sao quan trọng:
  - Phiếu thanh toán là giấy khách cầm về. INV yêu cầu bill/phiếu in theo brand guideline.
  - Chữ 8,5 pt trên A4 in máy quầy (mực nhạt) khó đọc với khách lớn tuổi.
- Đề xuất sửa:
  - Đổi `.print-root` và `.bill-paper`: `font-size: 11pt`.
  - Đổi `.bill-paper th`: `font-size: 9pt`, giữ chữ hoa và letter-spacing của hifi (Label +10).
  - Giữ `.en` 9 pt, `.foot` 9 pt, tiêu đề Lora 16 pt.
  - Tiêu đề 16 pt nhỏ hơn H2 26–32 pt của guideline, nhưng đây là thang chữ phiếu – cùng loại ngoại lệ DS 3.1 – chấp nhận.
  - In thử 1 tờ trên máy quầy, dưới đèn 2700K, theo guideline p19.
- Trạng thái: Open

### FB-R3-UXD-FE-A-19
- Mức độ: Suggestion
- Vị trí: `StayDialogs.tsx` – dòng chọn căn trong `ChangeRoomForm` (`{x.roomNo} · {nhóm}`)
- Vấn đề:
  - Dòng chọn căn hiện "402 · Căn N+". DS C34 (BR-012) quy định nhân viên thấy **"402 · The Ember"** (số + tên phòng qua `roomLabel()`).
  - Tên nhóm "Lầu 1–2", "Căn N", "Căn N+" là dữ liệu chủ đầu tư đặt, dùng được trên Desk. Nhưng nếu chỉ có tên nhóm, lễ tân không nói được tên phòng mới cho khách – khách thấy tên phòng ("The Ember") trên trang khách.
- Vì sao quan trọng: Lễ tân báo khách "anh/chị chuyển sang The Ember" phải khớp với tên trên trang khách và tin nhắn.
- Đề xuất sửa:
  - Dòng chọn: `roomLabel(staff)` + nhóm làm chữ phụ Stone. Ví dụ: **"402 · The Ember"** + "Căn N+".
  - Không có tên phòng thì dùng số như C34 fallback.
  - Có thể dời sang v1.0.1 nếu `alternatives` không trả tên phòng và phải ghép với `listRooms`.
- Trạng thái: Open (FE-A tự cân nhắc)

### FB-R3-UXD-FE-A-20
- Mức độ: Suggestion
- Vị trí: `ReservationDrawer.tsx` – chân khung đơn `checked_out`
- Vấn đề:
  - Thứ tự nút hiện nay: [Thêm phát sinh] [**Thu công nợ** (pri)] [Xóa công nợ (ghost)] [Xem Phiếu thanh toán].
  - Nút chính nằm giữa, còn nút cuối bên phải là một nút phụ. Ở các khung khác, nút chính luôn đứng cuối bên phải, ví dụ [… Trả phòng (pri)], [… Nhận phòng (pri)].
- Vì sao quan trọng: Lễ tân quen tìm việc chính ở góc phải chân khung. Đơn còn nợ thì việc chính là thu nợ.
- Đề xuất sửa:
  - Với đơn đã trả phòng, xếp: [Xem Phiếu thanh toán] [Thêm phát sinh] [Xóa công nợ (ghost)] [**Thu công nợ** (pri)].
  - Đơn không nợ thì không có nút pri; giữ hai nút phụ đầu.
  - Vị trí "Thêm phát sinh" ở chân khung đơn (đang ở thì nằm trong thân khung như cũ) **chấp nhận**.
- Trạng thái: Open (FE-A tự cân nhắc cho v1.0.0)

### FB-R3-UXD-FE-A-21
- Mức độ: Suggestion
- Vị trí: hộp "Thêm phát sinh" (`stay.add_charge`) khi mở từ đơn `checked_out`
- Vấn đề:
  - Hộp giống hệt lúc khách đang ở, không nói đây là khoản ghi **sau trả phòng**.
  - Theo BR-427 (c), khoản này vào folio đã chốt. Nó trừ vào tiền khách trả thừa, hoặc thành số khách còn nợ. Khách đã rời nên cần được báo.
- Vì sao quan trọng:
  - Khoản ghi sau khi khách rời dễ thành tranh chấp nếu khách không được báo.
  - Lễ tân cũng cần biết bước tiếp theo: thu nợ, hoặc yêu cầu hoàn sẽ được tính lại.
- Đề xuất sửa: thêm một `Alert` tông `info` đầu hộp, chỉ khi đơn `checked_out`. Khóa mới `stay.add_charge_after_checkout`:
  - VI: **"Khách đã trả phòng. Khoản này ghi vào folio đã chốt: trừ vào tiền khách trả thừa hoặc thành số khách còn nợ. Báo khách trước khi ghi."**
  - EN: **"The guest has checked out. This charge goes on the settled folio: it comes off the guest's overpayment or becomes an amount the guest owes. Tell the guest before adding it."**
  - Nếu không kịp v1.0.0 thì làm ở v1.0.1. Sổ tay (BA) có thể ghi tạm câu nhắc này.
- Trạng thái: Open (FE-A tự cân nhắc; DOM xác nhận câu "trừ vào tiền trả thừa hoặc thành nợ" khi gộp)

## 3. Việc của UXD (theo chốt mục 1)

- **hifi §16 sang A4:** khi ORC giao bước sửa thiết kế, sửa `@page{size:A5;margin:10mm}` trong `product/design/hifi/assets/hifi.css` (dòng 653) thành A4. Đưa màu bản in về `--brand-*` như `print.css` của FE-A. Sau đó FE-A bỏ phần `@page` trùng trong `print.css`. Lượt này không sửa `product/` (chỉ đọc nhánh, chỉ ghi review).
- Ghi decision-log (một dòng UXD khi ORC gộp):
  - "Phiếu thanh toán in A4 (thay A5 hifi §16) – máy in quầy A4; UXD 27/10".
  - Gỡ nhãn `[GIẢ ĐỊNH – chờ UXD]` của dòng FE-A.

## 4. Điểm làm tốt

- Tìm đúng gốc BUG-R3-020: bản in chỉ gắn trong lúc gọi `print()`, chứ không phải thiếu `@media print`. `print.css` chỉ dùng màu bảng brand.
- Câu Wi-Fi mới không hứa điều máy chủ chưa làm; ngày nhận phòng tính theo giờ cơ sở, không theo máy khách.
- Không tự tính cửa sổ 24 giờ BR-427 ở client. Dừng đúng chỗ cần đổi hợp đồng (lọc căn VD, ô Wi-Fi trên Desk) và chuyển cho ARC.
