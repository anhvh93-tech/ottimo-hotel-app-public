# UXD review – v1.0.4 PR #87: chữ phụ ô giá đêm `rooms.night_auto` sau ESC-045

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng:
  - `git diff origin/main...origin/v104/fe-night-auto-copy` @ `260995f6`, gốc `ff2560f1`. `main` hiện `1778c00f`; từ gốc tới nay `main` không đổi tệp chữ nào, và gộp thử không xung đột.
  - Năm tệp, mỗi tệp đổi 1 dòng: `gen_strings.py`, `strings-vi.json`, `strings-en.json`, `strings-tables.md`, `wireframes/assets/strings.js`.
- Nguồn chữ được giao: đề xuất của UXD ở `UXD-on-v104-pr72-manual.md`, lượt 2, bảng "Rà `strings-vi.json`".
- Cách soát:
  - Máy so khóa với khóa giữa gốc và đầu PR trên cả `strings-vi/en/ru.json` và đối tượng trong `strings.js`.
  - So từng ký tự với chữ đề xuất, kiểm chuẩn Unicode NFC.
  - Đọc chỗ dùng chuỗi trong `RoomDrawer.tsx`: `Field` **Giá đêm niêm yết**, `help={t('rooms.night_auto')}`.
  - Dựng ảnh hi-fi `04-rooms.html` của nhánh PR. Trang này nạp `strings.js` và thay chữ theo `data-i18n`, cùng khóa và cùng kiểu ô `Field` với Desk. Chụp ở 390 và 1440 px, cả VI lẫn EN.
  - Đo số dòng của chữ phụ ở 390, 1366 và 1440 px.
  - Ảnh nằm trong scratchpad, không commit.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

FE làm đúng việc được giao. Ba điểm kiểm đều đạt:
- **Chữ khớp từng ký tự** với đề xuất ở cả VI và EN, chuẩn NFC. `strings.js` cùng giá trị với hai tệp JSON.
- **Tệp sinh ra chỉ đổi một khóa.** VI 3492 khóa, EN 3492 khóa, trước và sau như nhau; `strings.js` (VI 3491, EN 3491, RU 207) chỉ đổi `rooms.night_auto`. RU không đổi, vì RU không có khóa này. `strings-tables.md` đổi đúng một dòng.
- **Trên trang hiển thị tốt.** Không tràn ngang. Chữ Stone Grey 12 px, `aria-describedby` vẫn nối đúng.

Điều kiện gộp nằm ở **chữ của UXD**, không phải lỗi của FE. Khi đặt chữ vào ô thật, UXD thấy hai lỗi trong chính đề xuất của mình (thẻ 01, 02). Sửa bằng cách thay hai giá trị trong `gen_strings.py`. Không có ESC.

| Chỗ hiện chữ | VI | EN |
|---|---|---|
| 390 px (ô chiếm cả hàng, rộng 285 px) | 3 dòng | 3 dòng |
| 1366 và 1440 px (ô nửa hàng, rộng 188 px) | 4 dòng (câu cũ: 3) | 4 dòng (câu cũ: 4) |

## FB-R4-UXD-FE-PR87-01
- Mức độ: Major (chữ trỏ tới một trang không có tên đó)
- Vị trí: `rooms.night_auto` EN, "… only if **Rule parameters** set an uplift."
- Vấn đề:
  - Trang này tên EN là **Rule settings** (`nav.params`, `config.params`); VI là **Tham số quy tắc**.
  - Người dùng Desk tiếng Anh sẽ tìm "Rule parameters" trên thanh bên và không thấy.
  - Lỗi do UXD đề xuất sai tên, FE đã chép đúng.
- Đề xuất sửa: thay EN bằng câu ở mục "Chữ thay thế" bên dưới.
- Trạng thái: Open (FE sửa trong #87)

## FB-R4-UXD-FE-PR87-02
- Mức độ: Minor
- Vị trí: `rooms.night_auto` VI, "**Giá** mỗi **đêm**, …"
- Vấn đề:
  - Câu lại lặp nhãn ô **Giá đêm niêm yết** ngay bên trên.
  - Ở cột 1366–1440 px, câu VI lên 4 dòng.
  - Ghi chú của khóa trong `gen_strings.py` ghi rõ quyết định UXD ở R3 (26/10): "bỏ "Giá đêm" lặp nhãn ô; 4 → 3 dòng ở cột 1366 px". Đề xuất lượt 2 đã đi ngược quyết định đó.
- Đề xuất sửa: dùng "Mọi đêm" và rút gọn vế sau. Câu ở mục "Chữ thay thế".
- Trạng thái: Open (FE sửa trong #87)

## Chữ thay thế (UXD chốt, thay đề xuất ở `UXD-on-v104-pr72-manual.md` lượt 2)

| | Chữ |
|---|---|
| VI | Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc. |
| EN | Every night, Direct channel, VAT included. Any weekend or special-date uplift is set in Rule settings. |

- Ý giữ nguyên:
  - giá này áp cho **mọi đêm**, không còn "ngày thường";
  - kênh Trực tiếp, đã gồm VAT;
  - mức tăng, nếu có, chỉ đến từ **Tham số quy tắc**, nên mặc định 0 vẫn đúng.
- Không ghi số %. Tên trang khớp `nav.params` ở cả hai thứ tiếng.
- Đã đo trong ô thật của hi-fi:
  - VI 98 ký tự: 2 dòng ở 390 px, 3 dòng ở 1366 và 1440 px;
  - EN 102 ký tự: 2 dòng ở 390 px, 3 dòng ở 1366 và 1440 px.
  - Cả hai đều ngắn hơn câu cũ ở cột hẹp.
- Cách FE làm:
  - thay hai giá trị VI, EN của `rooms.night_auto` trong `gen_strings.py`;
  - nối vào cuối ghi chú của khóa: " R4 ESC-045 (UXD 05/11, review #87): mức tăng cuối tuần, ngày đặc biệt là tham số, mặc định 0; tên trang theo `nav.params`.";
  - chạy `gen_strings.py` hai lần; kiểm vẫn chỉ đổi khóa này; chạy lại `i18n-keys` và các test trang Căn.
- Nếu không kịp sửa trước giờ cắt 06/11 18:00:
  - vẫn gộp #87 như hiện tại, vì câu VI đã đúng nghĩa và câu EN dù sai tên trang vẫn đúng hơn câu cũ;
  - sửa cả hai câu ở v1.0.5. UXD không đề xuất phương án này nếu còn kịp.

## `design/hifi/04-rooms.html` và `content-guide.md`: UXD tự sửa, trong v1.0.4

- Còn câu cũ ở hai chỗ:
  - chữ dự phòng ở `04-rooms.html` dòng 135, thẻ `span.help#r-n-h`;
  - dòng `rooms.night_auto` trong bảng mục 8 của `content-guide.md`, dòng 1335.
- **Quyết định UXD:** sửa cả hai trong một PR tài liệu nhỏ của UXD, mở ngay sau khi #87 gộp để chép đúng chữ chốt. Không để sang v1.0.5.
- Lý do:
  - Bảng mục 8 của content-guide là chỗ BA và CPY tra chữ. Nếu bảng vẫn ghi "do lịch giá cộng thêm", tức đúng ý mà ESC-045 vừa bỏ, sẽ có người chép lại câu đó vào sách hoặc mẫu tin.
  - PR này chỉ sửa tài liệu thiết kế, không vào bản build Desk, nên không vướng giờ cắt.
  - Hi-fi khi chạy JS đã hiện chữ mới. Chữ dự phòng chỉ lộ khi tắt JS, nhưng sửa cùng lúc thì rẻ.
- Phạm vi PR UXD:
  - `04-rooms.html` dòng 135, chữ dự phòng;
  - `content-guide.md`: dòng mục 8, và một dòng bảng phiên bản v0.4.6 ghi ESC-045 và review #87.
  - Không đụng `strings-*`. Các chuỗi khác của lượt 2 (`bk.src_weekend`, `sale.nights_all`, `params.k.*`) vẫn ở v1.0.5.

## Ngoài phạm vi (ghi nhận, không phải thẻ)
- Ảnh hi-fi EN còn chữ mẫu VI ("4 khách", "Điều chỉnh mùa cao điểm") ở khung lỗi định mức và ô **Lý do đổi giá**. Đây là dữ liệu mẫu có từ trước, không thuộc #87.

## Dòng decision-log đề xuất

```
| 2026-11-05 | 4 | **UXD review PR #87** `v104/fe-night-auto-copy` @ `260995f6` (`rooms.night_auto`): ĐẠT CÓ ĐIỀU KIỆN. FE đúng việc: chữ khớp từng ký tự, tệp sinh ra chỉ đổi khóa này (VI/EN 3492 khóa, `strings.js` chỉ 1 khóa), không tràn ở 390/1440. Điều kiện là chữ của UXD: FB-R4-UXD-FE-PR87-01 Major (EN ghi "Rule parameters", tên trang là **Rule settings**), -02 Minor (VI lặp nhãn "Giá đêm", 4 dòng ở cột 1366–1440, ngược quyết định R3). Chữ chốt: VI "Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc." / EN "Every night, Direct channel, VAT included. Any weekend or special-date uplift is set in Rule settings." (3 dòng ở 1366/1440). FE thay trong #87 trước giờ cắt 06/11 18:00; không kịp thì gộp như hiện tại, sửa ở v1.0.5. Chữ dự phòng hi-fi `04-rooms.html` và `content-guide.md` mục 8: UXD sửa trong PR tài liệu riêng sau khi #87 gộp (v1.0.4, không vào bản build). | UXD | Chữ phụ phải trỏ đúng tên trang ở mọi thứ tiếng và không đi ngược quyết định đã chốt. |
```
