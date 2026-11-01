# UXD review – LP-v2 FE lượt sửa lỗi QA (`lp-v2-fe2`)

- Round 4 – Bước: Review (lượt sửa lỗi QA BUG-R4-001…004), 01/11/2026
- Người review: UXD. Tác giả: FE (FE-A Desk, FE-B landing)
- Đối tượng: `git diff 83c13990 c9372e52` (nhánh `origin/lp-v2-fe2`), `rounds/round-04/outputs/FE/lp-v2-fe.md` mục 8, ảnh `rounds/round-04/outputs/FE/screenshots/lp-v2-fe2-*.png` và `lp-v2-*-360-form.png` (dữ liệu giả)
- Đối chiếu: `00-brief/context/brand/brand-guidelines.md`, `product/design/design-system.md` (C3 Field), `rounds/round-04/outputs/CPY/lp-v2-copy.md` mục 14, `rounds/round-04/outputs/PO/lp-v2-stories.md` US-131 AC4
- Không sửa mã, không commit.

## Kết luận

**ĐẠT – không có Blocker/Major.** 4 Minor + 1 Suggestion, sửa được trong lượt này hoặc dời sang lượt sau mà không chặn QA chạy lại.

| Câu hỏi của ORC | Kết luận UXD |
|---|---|
| (1) Chữ Desk mới `webreq.estimate_*`, `webreq.locale.ko/zh`, `rooms.public_type*` | Đạt về giọng và thuật ngữ (`Chủ đầu tư` khớp `role.owner`, `Tiếng Trung (giản thể)` khớp nút ngôn ngữ landing "简体中文"). Cần sửa 2 chuỗi: tiêu đề cảnh báo "Đã đổi" quá mơ hồ (FE-13) và câu trợ giúp hạng công khai trích một chữ không có trên web (FE-14). 2 chuỗi nên rút gọn (FE-17). |
| (2) Khối giá landing sau BUG-R4-003, cao 250–294 px ở 360 px | **Không nặng nề, giữ phương án chính của CPY** (câu "For N guests" đứng đầu ghi chú). **Không** dùng phương án dự phòng CPY 14.3 (dồn số khách vào dòng phụ). Lý do ở mục A. |
| (3) Ô "Hạng phòng công khai" trong ngăn sửa căn | Owner: đạt (select gốc giống ô "Nhóm", trợ giúp dưới ô, đúng DS C3). Manager: dùng sai mẫu chỉ đọc và thiếu câu hậu quả khi "Chưa gán" (FE-15). |
| AC4 "chữ điều kiện không nhỏ hơn chữ nội dung form" | **Xác nhận cách FE hiểu: 15 px là đúng, không cần 16 px.** Lý do ở mục B. Còn `.est-line` 14 px lệch trong cùng khối (FE-16, không thuộc AC4). |

### A. Khối giá 360 px – vì sao giữ nguyên

- Xem trong ngữ cảnh form (`lp-v2-ru-360-form.png`, ca dài nhất): khối Ivory trên thẻ Cream, ghi chú Stone tách bằng đường kẻ Cream. Mắt đọc theo thứ tự: nhãn → con số Lora → số đêm → ghi chú phụ. Ghi chú có 5 dòng nhưng tông chữ trầm, nên khối không lấn ô liên hệ phía dưới. Trên 1 màn 360 × 780, khối chiếm khoảng 1/3 chiều cao và không đẩy nút "Gửi" ra xa hơn một lần cuộn.
- Khối chỉ cao lên **sau khi** khách chọn hạng và ngày, nằm dưới ô hạng phòng. Không gây CLS ở phần phía trên (FE 8.2), không tràn ngang ở cả 5 ngôn ngữ.
- Phương án dự phòng (CPY 14.3) chỉ bớt khoảng 1 dòng, nhưng phải đổi `total`, `live`, `done` và trật tự từ ko/zh. Dòng phụ dưới con số sẽ thành "for 29 nights · 3 guests": dày hơn, và số khách bị đặt ngang hàng với số đêm, trong khi nó là điều kiện của giá. Đổi nhiều để được ít, nên không dùng.
- Ngưỡng UXD để xem lại: ghi chú vượt **6 dòng** ở 360 px (hiện tối đa 5 dòng, ru), hoặc khối vượt **320 px**. Khi đó mới cân nhắc dòng phụ.

### B. AC4 – 15 px

- "Chữ nội dung form" là chữ khách đọc trong form: nhãn ô `.f-label` 15 px. Gợi ý `.hint` và lỗi `.err` là 14 px (`--fs-small`). Giá trị trong ô nhập `.input` 16 px là chữ khách gõ, và 16 px là cỡ tối thiểu để iOS không phóng to khi bấm vào ô (DS C3: "điện thoại cỡ 16px"). Đó là cỡ kỹ thuật của ô nhập, không phải cỡ đọc của form.
- `.est-note` 15 px bằng nhãn, lớn hơn gợi ý và lỗi. Như vậy đạt "không nhỏ hơn chữ nội dung của form". Màu Stone #6B6760 trên Ivory #F4F0E8 đạt **4,95:1**, đủ WCAG AA cho chữ thường.
- Lên 16 px làm ghi chú to hơn mọi chữ đọc khác của form (kể cả nhãn) và thêm khoảng 1 dòng ở ru/en, phá thứ bậc "con số chính, điều kiện phụ". UXD **không** đề xuất.
- Đề nghị ORC ghi vào decision-log: "US-131 AC4 – chữ nội dung form = nhãn ô 15 px; ô nhập 16 px là cỡ chống phóng to iOS, không dùng làm mốc" (UXD quyết theo quyền giao diện).

## Thẻ feedback

### FB-R4-UXD-FE-13
- Mức độ: Minor
- Vị trí: `product/design/copy/strings-vi.json` / `strings-en.json` – `webreq.estimate_changed`, `webreq.estimate_changed_hint`; `QuoteDialog.tsx` `SeenLine` (ảnh `lp-v2-fe2-desk-quote-changed.png`)
- Vấn đề: tiêu đề cảnh báo "Đã đổi: 1.600.000 đ → 2.022.000 đ" không nói **cái gì** đã đổi. Cảnh báo nằm ngay dưới "Tổng tiền đơn", nên lễ tân dễ hiểu là tổng đơn vừa bị sửa. Câu nhắc "Giá Desk tính bây giờ khác số khách đã thấy trên web" dùng tên sản phẩm "Desk" và "bây giờ". Cả bảng chữ chỉ có 3 chỗ dùng "Desk", và ngay bên dưới hộp thoại đã có cách gọi quen "theo lịch giá hôm nay (BR-104)".
- Vì sao quan trọng: đây là câu duy nhất nhắc lễ tân giải thích cho khách vì sao báo giá khác web (US-131 AC10). Đọc nhầm thì lễ tân gửi báo giá mà không giải thích, và khách thấy giá "nhảy".
- Đề xuất sửa (chỉ đổi chữ, giữ khóa):
  - vi `webreq.estimate_changed`: "Khác giá web khách đã thấy: {from} → {to}"
  - vi `webreq.estimate_changed_hint`: "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá."
  - en `webreq.estimate_changed`: "Differs from the website estimate: {from} → {to}"
  - en `webreq.estimate_changed_hint`: "Today's rate differs from what the guest saw on the website. Tell the guest why when you send the quote."
  - Kiểm lại test `r4-lp-v2-fea.test.tsx` nếu test so khớp nguyên chuỗi.
- Trạng thái: Open

### FB-R4-UXD-FE-14
- Mức độ: Minor
- Vị trí: `strings-vi.json` / `strings-en.json` – `rooms.public_type_help` (ảnh `lp-v2-fe2-desk-room-public-type-owner.png`)
- Vấn đề: câu trợ giúp viết "căn chưa gán thì web ghi \"giá theo yêu cầu\"" (en: "an unassigned room shows \"rate on request\""). Landing **không có** chữ này. Khi không có giá, khách thấy `estimate.unavailable` ("Chưa có giá ước tính trực tuyến…"). "Giá theo yêu cầu" chỉ là cách nói nội bộ trong báo cáo BE. Bản en còn sai nghĩa: căn chưa gán không "hiện" gì trên web, vì nó không thuộc hạng nào.
- Vì sao quan trọng: owner sẽ mở web tìm dòng "giá theo yêu cầu" mà không thấy, rồi nghĩ việc gán không có tác dụng. Chữ trong ngoặc kép phải là chữ thật trên màn hình.
- Đề xuất sửa:
  - vi: "Hạng khách thấy trên web và trong tin nhắn khi chưa báo căn; web tính giá ước tính theo hạng này. Căn chưa gán không thuộc hạng nào trên web."
  - en: "The type guests see on the website and in messages before a room is assigned; website estimates use it. An unassigned room belongs to no type on the website."
  - BE/FE xác nhận đúng hành vi (BE `lp-v2-be.md`: căn không khớp hạng thì không được tính vào hạng). Nếu hành vi khác, báo UXD để viết lại.
- Trạng thái: Open

### FB-R4-UXD-FE-15
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/RoomDrawer.tsx` nhánh không phải owner (`<dl className="webreq-kv">`) – ảnh `lp-v2-fe2-desk-room-public-type-manager.png`
- Vấn đề: (a) Với manager, ô hiện theo kiểu dòng khóa – giá trị của ngăn Yêu cầu web (nhãn bên trái, giá trị bên phải, mượn class `webreq-kv`). Mọi ô khác trong ngăn sửa căn có nhãn ở trên, nên dòng này lệch lề và lệch nhịp. DS C3 đã có trạng thái **chỉ đọc** cho Field: nhãn trên, giá trị trên nền `--surface-2` (Cream, `--ink` 11,43:1). (b) Khi "Chưa gán", manager không thấy câu hậu quả (căn không lên web theo hạng), nên không biết cần báo owner.
- Vì sao quan trọng: nhất quán Design System trong cùng một ngăn. Manager là người phát hiện căn chưa gán khi rà danh mục, nên cần biết hậu quả để báo owner.
- Đề xuất sửa: dùng `Field` với trạng thái chỉ đọc theo C3: nhãn `rooms.public_type` ở trên, giá trị (hoặc `rooms.public_type_none`) trong khung chỉ đọc, bên dưới là `caption` `rooms.public_type_owner_only`. Khi giá trị là `null`, hiện thêm `rooms.public_type_help` (bản đã sửa ở FE-14) trước câu owner_only. Không cần khóa chữ mới.
- Trạng thái: Open

### FB-R4-UXD-FE-16
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/styles/landing.css` – `.est-line` (0.875rem) cạnh `.est-note` mới (0.9375rem)
- Vấn đề: chú thích CSS của FE ghi `.est-note` 15 px "bằng các dòng khác của khối giá", nhưng `.est-line` vẫn là 14 px. `.est-line` là các dòng ngay dưới con số: "Includes our longer-stay rate.", giá từng mức đêm, "Includes one more guest.". Kết quả là ghi chú phụ ở dưới (15 px) to hơn dòng diễn giải con số ở trên (14 px), ngược thứ bậc. Thấy rõ ở `lp-v2-fe2-estimate-vi-360.png`: "Đã gồm ưu đãi ở dài ngày." nhỏ hơn đoạn "Cho 3 khách…". Đây không phải lỗi AC4, vì AC4 chỉ nói 4 ý trong ghi chú.
- Vì sao quan trọng: khối giá nên có một cỡ đọc duy nhất (trừ nhãn chữ hoa 13 px và con số Lora), để khách không đoán dòng nào quan trọng hơn. Thêm khoảng 1–2 px mỗi dòng, chưa đến ngưỡng ở mục A.
- Đề xuất sửa: `.est-line { font-size: 0.9375rem; }` (gộp với `.est-nights`). `.est-wait`/`.est-idle` 14 px giữ nguyên, vì đó là trạng thái chờ/rỗng, không phải nội dung giá. Sửa câu chú thích CSS cho đúng. QA chụp lại ảnh TC-LP-063.
- Trạng thái: Open

### FB-R4-UXD-FE-17
- Mức độ: Suggestion
- Vị trí: `strings-vi.json` / `strings-en.json` – `webreq.estimate_none`, `webreq.estimate_at_submit` (ảnh `lp-v2-fe2-desk-drawer-seen-ko.png`, `lp-v2-fe2-desk-drawer-noprice-zh.png`)
- Vấn đề: "Khách chưa thấy giá" có chữ "chưa", nghe như khách sẽ thấy sau. Thực tế là web không hiện con số (theo tháng, hoặc tắt giá). "Lúc khách gửi, hệ thống tính lại: {amount}" dài và rơi xuống 2 dòng ở cột giá trị 460 px.
- Vì sao quan trọng: lễ tân đọc lướt ngăn yêu cầu; chữ ngắn, đúng nguyên nhân thì đọc nhanh hơn.
- Đề xuất sửa:
  - vi `webreq.estimate_none`: "Web không hiện giá cho khách" · en: "No price shown on the website"
  - vi `webreq.estimate_at_submit`: "Tính lại lúc khách gửi: {amount}" · en: "Recalculated on submit: {amount}"
- Trạng thái: Open

## Ghi chú chuyển vai khác (không phải thẻ cho FE)
- **CPY / người bản xứ zh:** ở 360 px, "（VND）" (ngoặc toàn khổ) rơi đầu dòng, nhìn như lùi lề (`lp-v2-fe2-estimate-zh-360.png`). Đưa vào lượt đọc CPY 14.7; nếu người bản xứ chấp nhận thì giữ nguyên.
- **ORC:** ghi decision-log diễn giải AC4 = 15 px (mục B).

## Điểm làm tốt
- Đọc số khách từ query của chính con số (`guestsOfSearch`), nên câu "For N guests" không bao giờ lệch số đang hiện. Đúng tinh thần "điều kiện đi liền con số".
- So sánh ở báo giá chia 3 trường hợp: khớp (dòng nhẹ), đã đổi (Alert warn), khác đầu vào (chỉ ghi tham khảo, không nói "đã đổi"). Cách này tránh báo động giả cho lễ tân.
- Ô owner dùng danh sách chọn đúng chữ e-brochure thay ô chữ tự do, và giữ hiện nhãn cũ ngoài danh sách. Cách này chặn lệch slug từ gốc mà không làm mất dữ liệu.
