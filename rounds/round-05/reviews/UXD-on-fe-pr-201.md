# UXD review – FE PR #201 (`r5-fb012-cleaning-fee-fe` @ `bd7537c0`): giá dọn thêm theo căn cho khách dài hạn

- Người review: UXD | Round 5 – bước **Review** | 19/11/2026
- Cách kiểm:
  - đọc `gh pr diff 201`: `gen_strings.py`, `cleaningFeeParams.tsx`, `goLive.ts`;
  - đọc `StayDialogs.tsx` tại `bd7537c0`, phần "Thêm phát sinh";
  - xem ảnh FE `124-01..04` (EN và VI, dữ liệu giả, ở scratchpad của ORC).
- Không chạy app.

## Kết luận

**DUYỆT (UXD).**
- 3 điểm FE hỏi đều được duyệt: `params.lscf.price_invalid`, nhãn chip, bố cục 2 ô mỗi hàng.
- Có 2 thẻ Minor về chuỗi cũ, không chặn gộp:
  - 201-01: câu "Phí phạt…" hiện cho cả những khoản không phải phạt. Đề xuất sửa ở v1.0.7.
  - 201-02: tên khoản tiếng Việt hiện ngay cả trong giao diện EN. Có thể dời sang round sau.
- Thương hiệu đạt:
  - chip dài hạn dùng Sage Deep, chip giá chung dùng tông trung tính;
  - ô giá dùng hậu tố đ/VND của DS;
  - không có màu viết cứng, không có emoji.

| Mục | Kết luận |
|---|---|
| `params.lscf.price_invalid` | **Duyệt nguyên văn.** VI "Giá từ 1.000 đến 5.000.000 đ, bội 1.000. Để trống thì dùng giá chung." / EN "Price from 1,000 to 5,000,000 VND, in steps of 1,000. Leave it blank to use the standard price." Câu khớp với việc BE #200 từ chối giá 0, và chỉ luôn cách sửa: để trống, không nhập 0. Bỏ ghi chú "CHỜ UXD DUYỆT" ở cột ghi chú |
| `charge.price_source.long_stay_room` / `.default` | **Duyệt.** "Long-stay room price / Giá dài hạn của căn" và "Standard price / Giá chung". Ngắn, và khớp chữ "giá chung" trong `params.lscf.*` |
| 2 ô mỗi hàng (S24, hộp sửa bảng) | **Duyệt.** Ở khung 480px, 2 cột cho ô đủ rộng hiện "5.000.000" cùng hậu tố. 3 cột như bản trước thì ô quá hẹp. 10 căn nằm trong 5 hàng; hộp cuộn bên trong, nút vẫn ở chân hộp |
| Ô yêu cầu dọn ở web khách (ảnh 124-04) | **Duyệt.** Không có chuỗi mới; giá lấy theo căn. EN dẫn, VI hỗ trợ, giọng điềm tĩnh, không emoji. Tiêu đề ô và câu đồng ý dùng cùng một giá (150,000 VND / 150.000 đ) |

### FB-R5-UXD-FE-201-01
- Mức độ: Minor
- Vị trí:
  - `gen_strings.py`, khóa `stay.charge_default`;
  - `StayDialogs.tsx` (hộp "Thêm phát sinh", khoảng dòng 814–819);
  - ảnh 124-03.
- Vấn đề:
  1. Câu "…Phí phạt không tính vào doanh thu phòng." hiện cho **mọi** khoản: dọn thêm, giặt ủi, đồ ăn, hư hỏng. Chỉ khoản phạt (`category = 'penalty'`) mới cần câu này.
  2. `{rule}` lấy `item.ruleRef ?? item.name`. Khoản không có `ruleRef` thì ra câu "Default price 150,000 VND per Dọn phòng thêm" / "Giá mặc định 150.000 đ theo Dọn phòng thêm", vô nghĩa. Chữ "per" còn bị hiểu thành "mỗi".
- Vì sao quan trọng: lễ tân đọc câu này ngay trước khi ghi tiền vào folio. Câu sai khiến người ta nghi giá dọn bị tính như tiền phạt.
- Đề xuất sửa: tách thành 3 chuỗi, FE chọn theo dữ liệu.

| Khóa | Khi nào hiện | EN | VI |
|---|---|---|---|
| `stay.charge_default` *(sửa)* | khi có `ruleRef` | Default price {amount}, set by {rule}. | Giá mặc định {amount}, theo {rule}. |
| `stay.charge_default_noref` *(mới)* | khi không có `ruleRef` | Default price {amount}. | Giá mặc định {amount}. |
| `stay.charge_fine_note` *(mới)* | thêm sau câu giá, chỉ khi `item.category === 'penalty'` | Fines don't count as room revenue. | Phí phạt không tính vào doanh thu phòng. |

  Code: `{rule}` chỉ nhận `item.ruleRef`, không lấy `item.name` thay. Chip nguồn giá giữ nguyên vị trí, ngay sau câu giá.
- Trạng thái: Open

### FB-R5-UXD-FE-201-02
- Mức độ: Minor (có thể dời sang round sau)
- Vị trí: hộp "Thêm phát sinh", ô chọn khoản (`x.name`). Ảnh 124-03 EN.
- Vấn đề: giao diện EN vẫn hiện "Dọn phòng thêm", vì tên khoản là `ChargeCatalogItem.name` server trả về bằng tiếng Việt. Lỗi này có từ trước PR #201. PR này chỉ làm nó lộ rõ hơn, vì câu giá giờ đứng ngay dưới tên.
- Vì sao quan trọng: nhân viên đọc EN sẽ thấy hai thứ tiếng trộn trong cùng một dòng.
- Đề xuất sửa:
  - Hiện theo khóa `charge.name.<code>` nếu có, không có thì dùng `name`.
  - Làm trước cho khoản dọn thêm: `charge.name.adhoc_cleaning_fee` = EN "Extra cleaning" / VI "Dọn phòng thêm", khớp `bill.line.adhoc_cleaning`.
  - Các mã còn lại thêm dần sau. PO đưa vào backlog nếu không kịp v1.0.7.
- Trạng thái: Open
