# UXD review – FE-A ô giá đêm độc lập trên ngăn kéo căn (FB-INV-005)

- Round 3 · Bước: Review · Ngày 26/10/2026 · Người review: UXD · Tác giả: FE-A
- Đối tượng: `b71f8dc` (gộp main `01ea5df`), báo cáo `rounds/round-03/outputs/FE/fb-inv-005-fe-a.md`, ảnh `rounds/round-03/outputs/FE/fb-inv-005-shots/` (01–06).
- Căn cứ: BR-101 v0.4.7 (2)(4), BR-104, BR-005, BR §0.2 (mọi con số là tham số); DOM `rounds/round-03/outputs/DOM/fb-inv-005.md` §4.2; `product/design/content-guide.md` mục 1; OTTIMO Brand Guidelines (`00-brief/context/brand/brand-guidelines.md`).
- **Kết luận: ĐẠT.** Không Blocker/Major, không ESC. UXD sửa thẳng 3 chuỗi (2 Minor, 1 Suggestion bên dưới, đều đã Done) và vẽ lại hi-fi H04 4.2.

## 1. Duyệt giọng 4 chuỗi

| Khóa | Kết quả |
|---|---|
| `rooms.footnote` | Đạt, giữ nguyên VI/EN. Đúng câu DOM §4.2, ngắn, không "÷ 12". |
| `rooms.night_auto` | Đạt sau sửa – thẻ 01. |
| `rooms.night_low` | Đạt sau sửa – thẻ 02. |
| `field_error.multiple_of_1000` | Đạt sau sửa – thẻ 03 (chỉ EN). VI giữ. |

Cả 4 chuỗi không emoji, không "!", không đổ lỗi người nhập. RU chưa dịch (rơi về EN như các chuỗi `rooms.*` khác của Desk) – chấp nhận.

## 2. Thẻ feedback

### FB-R3-UXD-FE-A-01
- Mức độ: Minor
- Vị trí: `product/design/tools/gen_strings.py` – `rooms.night_auto`; ảnh 01, 03, 06
- Vấn đề: Chữ phụ ghi cứng "Cuối tuần +15 %, ngày lễ +30 %". Hai số này là tham số lịch giá (BR-104, có ngày hiệu lực, OWN đổi được); BR §0.2 #1, #4: con số là tham số, không viết cứng. "Ngày lễ" hẹp hơn "ngày đặc biệt" của BR-104 (gồm Tết, mùa cao điểm, sự kiện). Câu dài 4 dòng ở cột 1366 px, lặp "Giá đêm" ngay dưới nhãn "Giá đêm niêm yết".
- Vì sao quan trọng: OWN đổi mức tăng ở màn Tham số thì chữ dưới ô giá vẫn nói số cũ – sai giá trên màn nhập giá, không ai phát hiện.
- Đề xuất sửa: VI "Đêm ngày thường, kênh Trực tiếp, đã gồm VAT. Cuối tuần, ngày đặc biệt do lịch giá cộng thêm." · EN "Weekday night, Direct channel, VAT included. The rate calendar adds weekend and special-date increases." (gần câu DOM §4.2, giữ "đã gồm VAT" của FE vì đúng BR-101 (2)).
- Trạng thái: Done (UXD sửa thẳng)

### FB-R3-UXD-FE-A-02
- Mức độ: Minor
- Vị trí: `rooms.night_low`; ảnh 03
- Vấn đề: "(267.000)" không có đơn vị, khác mọi số tiền khác trên Desk. Câu "Kiểm tra lại trước khi lưu." đọc như lỗi chặn, trong khi BR-101 (4) là cảnh báo mềm – OWN có thể nghĩ không lưu được. EN "Please" thừa so với giọng ngắn của Desk.
- Vì sao quan trọng: B2 sáng 28/10 OWN nhập giá thật 10 căn; cảnh báo phải giúp bắt lỗi gõ thiếu số 0 mà không làm OWN tưởng bị chặn.
- Đề xuất sửa: VI "Giá đêm đang thấp hơn giá tháng chia 30 ngày ({perDay} đ). Kiểm tra lại số; nếu đúng, vẫn lưu được." · EN "The nightly price is below the monthly price per day ({perDay} VND). Check the figure – you can still save if it is right." `{perDay}` vẫn chỉ là số (FE không đổi mã).
- Trạng thái: Done (UXD sửa thẳng; sửa kỳ vọng `rooms.test.tsx` dòng 159 thành "(267.000 đ).")

### FB-R3-UXD-FE-A-03
- Mức độ: Suggestion
- Vị trí: `field_error.multiple_of_1000` EN
- Vấn đề: "for example" trong khi các lỗi trường khác dùng "e.g." (`field_error.phone_country`, `field_error.email_invalid`, `stay.late_help`).
- Vì sao quan trọng: Nhất quán chữ.
- Đề xuất sửa: "Use whole thousands, e.g. 650,000."
- Trạng thái: Done (UXD sửa thẳng)

## 3. Bản build so với thiết kế

- Ô giá đêm cùng kiểu ô tiền với ô giá tháng (affix đ/VND, định dạng khi rời ô), hai ô thẳng hàng trên (`.g-2.top`). Lỗi tại ô (`.err` đỏ, có tóm tắt "Còn 1 ô cần sửa" đầu ngăn kéo) và cảnh báo `Alert tone="warn"` đúng Design System. Ngày hiệu lực + lý do chỉ hiện khi đổi giá – đúng hi-fi.
- Ghi nhận cho sau (không phải thẻ): nhãn "Giá đêm niêm yết" đứng cạnh "Giá tháng" dưới tiêu đề nhóm "Giá niêm yết" hơi lặp; giữ vì cùng khóa với cột bảng và test đang bám nhãn.

## 4. UXD đã sửa

- `product/design/tools/gen_strings.py`: 3 chuỗi trên; ghi chú 4 khóa bỏ "chờ UXD duyệt". Chạy `python3 -I product/design/tools/gen_strings.py` (3190 chuỗi + 8 mẫu) → `copy/strings-{vi,en}.json`, `tools/strings-tables.md`, `wireframes/assets/strings.js`.
- `product/design/content-guide.md`: dán lại 2 dòng bảng mục 8 (`rooms.footnote`, `rooms.night_auto`); lịch sử v0.4.3.
- `product/design/hifi/04-rooms.html` (H04 4.2): ô giá đêm bỏ `readonly`, nhập được (`inputmode="numeric"`); chữ phụ mới; khung mẫu cảnh báo mềm (giá tháng 11.500.000, OWN gõ 95.000 → "(383.000 đ)"); chú thích bảng 4.1 theo `rooms.footnote` mới; đặc tả thêm mục "Giá tháng và giá đêm (FB-INV-005)"; doc-meta thêm BR-101 v0.4.7, BR-005. `hifi/assets/hifi.css`: `.g-2.top`.
- `product/apps/admin-web/src/__tests__/rooms.test.tsx`: kỳ vọng chữ cảnh báo có "đ".
- `01-decisions/decision-log.md`: 1 dòng UXD.

Kiểm tra: admin-web vitest `rooms` + `i18n` 14/14; `@ottimo/i18n` 19/19; prettier sạch; hi-fi mở trên trình duyệt 1440 px – cảnh báo và chữ phụ hiện đúng, chữ phụ 3 dòng.

## 5. Điểm làm tốt

- Bỏ hẳn ÷ 12 ở client và gửi đủ hai giá mỗi lần đổi – đúng tinh thần "hai giá độc lập", Desk không bao giờ rơi vào đường tạm của server.
- Lỗi server 422 hiện đúng ô giá đêm; test biên 266.000 / 267.000 cho cảnh báo mềm.
- FE soạn chữ đã đúng giọng (ngắn, điềm tĩnh, không emoji) và tự đánh dấu chờ duyệt – dễ review.
