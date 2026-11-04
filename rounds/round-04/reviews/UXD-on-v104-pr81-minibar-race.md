# UXD review – v1.0.4 PR #81: BUG-R4-042, Trả phòng quay lại tủ minibar đã đếm (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-checkout-minibar-race` @ `054d40c0`:
  - `CheckOutPage.tsx`, bước ① (Minibar);
  - chuỗi chữ: `gen_strings.py` và các tệp sinh ra từ nó;
  - báo cáo FE `rounds/round-04/outputs/FE/bug-r4-042-minibar-race.md`, mục 3 và 7.
- Phạm vi UXD:
  - câu chữ, vị trí và kiểu hiển thị của dòng tên tủ;
  - nhóm chọn tủ sau khi đếm.
  - Logic chọn tủ kế tiếp (`doneRef`, `goNextCabinet`) do ARC và QA xem.
- Đối chiếu:
  - `UXD-on-v104-pr67-minibar.md`: busy của nút Tiếp tục, khóa danh sách khi đọc lại;
  - `.dl` trong `hifi.css` dòng 242–244;
  - các khóa `co.minibar_cabinet`, `co.minibar_cabinet_room`, `co.minibar_cabinet_old`;
  - K11-03 (ARC 16.19): tủ trên màn luôn được định danh.
- Cách xem:
  - Dựng worktree tạm ở `054d40c0`. Chạy `bug-r4-042-fea.test.tsx`: 5/5 xanh.
  - Viết thêm một test tạm để in DOM bước ①, ở ca "tủ căn cũ trước, bản tóm tắt sau lần đếm đang bị giữ". Test không commit, đã xóa cùng worktree.
  - Sinh lại `gen_strings.py`: không ra diff.

DOM in được sau khi đếm xong tủ 402:

```html
<section class="card stack"><dl class="dl"><dt>Tủ minibar đang đếm</dt><dd>Căn 202 (đang ở)</dd></dl><div class="table-wrap">…
```

Lúc đó tiêu đề trang là "Trả phòng · Căn 202 · …" và nút chính ghi "Tiếp tục: Phụ phí".

## Kết luận: ĐẠT

| Điểm | Kết quả |
|---|---|
| Câu chữ `co.minibar_cabinet_counting` | **Duyệt, giữ nguyên.** VI "Tủ minibar đang đếm" đi cặp với nhãn nhóm chọn tủ "Tủ minibar cần đếm" (`co.minibar_cabinet`). Hai nhãn cùng chủ ngữ; "cần" là lúc còn chọn, "đang" là lúc đã chốt một tủ. EN "Minibar being counted" đi cặp với "Minibar to count" theo cùng cách. Chữ ngắn, không "Vui lòng", không emoji, đúng giọng nội bộ. Dòng có hai chữ "đang" ("đang đếm: Căn 202 (đang ở)"), nhưng mỗi chữ một nghĩa và vẫn dễ đọc. Không đổi |
| Giá trị `<dd>` | **Đúng.** Dùng lại `co.minibar_cabinet_room` và `co.minibar_cabinet_old`, tức đúng chữ lễ tân vừa thấy trên nút của nhóm chọn tủ. Tủ khác không bao giờ mang số của căn đang ở. Tiêu đề "Tủ căn {room} cần đếm lại" cũng lấy số căn theo cách này. Vì vậy dòng tên tủ, cảnh báo đếm lại và bảng cùng nói về một tủ |
| Vị trí | **Đúng.** Dòng nằm ở đầu thẻ, đúng chỗ nhóm chọn tủ vừa ẩn, trước cảnh báo "cần đếm lại" và trước bảng. Lễ tân tìm tên tủ vẫn thấy ở chỗ cũ |
| Kiểu hiển thị | **Đúng DS.** `.dl` là mẫu "nhãn – giá trị chỉ đọc" đã có ở Desk: thẻ mã cửa H13, H14, hộp phí trễ H16. `dt` màu Stone Grey (`--muted`), `dd` màu Ink, đậm 500. Không thêm lớp, không `style=`, không màu ngoài bảng brand. Dòng chỉ đọc là đúng, vì chỉ còn một tủ, không có gì để chọn |
| Khi nào hiện | **Đúng.** Chỉ hiện khi lượt ở có từ 2 tủ trên trang này và nhóm chọn tủ đã ẩn. Lượt ở 1 tủ giữ màn như cũ, vì tiêu đề đã ghi căn |
| Tủ đã đếm không còn trong nhóm chọn tủ | **Đồng ý.** Đây là cách chặn đúng đường lễ tân tự chọn lại tủ đã đếm rồi gửi "tủ đủ". Màn hình giống nhau trước và sau khi bản tóm tắt về, nên lễ tân không thấy một lựa chọn hiện ra rồi biến mất |
| Brand | **Đạt.** Chỉ có một khóa mới, không thêm màu, chữ đúng giọng |

**Trả lời câu hỏi của FE ("có nên thêm dòng 'Đã đếm: Căn 402' không"): không thêm dòng cố định ở bước ①.**
- Dòng cố định thêm một trạng thái phải giữ cho đúng. Khi lễ tân bấm Quay lại về bước ① (G-FE-042-1), tủ đang hiện cũng đã đếm, nên dòng đó dễ nói sai.
- Lễ tân cần xác nhận vào **đúng lúc** tủ trước vừa lưu xong. Việc này hợp với toast của DS hơn: toast là vùng `role="status"`, trình đọc màn hình cũng đọc. Xem thẻ PR81-01 (b), dời sang v1.0.5.

**Tên nhóm chuỗi.** Nhóm trong `gen_strings.py` vẫn mang tên "… CHỜ UXD DUYỆT". UXD đã duyệt. Nếu FE còn đẩy commit vào #81 thì đổi tên nhóm như dưới rồi sinh lại. Nếu không, UXD đổi ở đợt chuỗi kế tiếp sau khi gộp. Việc này không chặn gộp.

```python
g("v1.0.4 BUG-R4-042 – FE-A: H16 bước 1 luôn nêu tên tủ đang đếm khi lượt ở có nhiều tủ (K11-03). UXD duyệt 05/11 (UXD-on-v104-pr81-minibar-race)", [
```

Có một thẻ Minor, dời sang v1.0.5, không chặn gộp. Không có ESC.

---

### FB-R4-UXD-FE-PR81-01
- Mức độ: Minor (v1.0.5; không chặn gộp #81; lỗi không do #81 gây ra)
- Vị trí: `CheckOutPage.tsx`:
  - chân trang bước ①, nút chính `co.go_extras` ("Tiếp tục: Phụ phí" / "Continue: Charges");
  - `saveMinibar`, sau khi nhận 201 mà vẫn còn tủ khác.
- Vấn đề:
  - Khi lượt ở còn 2 tủ, bấm "Tiếp tục: Phụ phí" ở tủ đầu **không** sang bước Phụ phí. Trang ở lại bước ① với tủ thứ hai. Nút hứa một việc, trang làm việc khác. Lỗi có từ v1.0.1 (S4-38).
  - Sau 201, không có gì xác nhận tủ vừa lưu. Nếu tủ đó đếm "không dùng gì" thì folio bên phải cũng không có dòng mới.
  - Dòng tên tủ của #81 là dấu hiệu duy nhất cho biết màn đã sang tủ khác. Trình đọc màn hình không đọc dòng này: nó là phần tử mới gắn vào trang, không nằm trong vùng live, còn tiêu điểm vẫn ở nút.
- Vì sao quan trọng:
  - Lễ tân tưởng lần bấm chưa ăn nên bấm lại. Khi đó tủ thứ hai được gửi với số mặc định (đủ chuẩn, tức "không dùng gì") dù chưa ai đếm. Tiền minibar của tủ thứ hai bị sai, trong khi máy chủ vẫn nhận như một lần đếm hợp lệ.
  - Dòng tên tủ của #81 đã giảm rủi ro này, nên thẻ chỉ ở mức Minor.
- Đề xuất sửa (FE-A, v1.0.5). Khi FE nhận thẻ, UXD thêm 2 khóa dưới đây vào `gen_strings.py`:
  - (a) Nếu sau tủ đang hiện vẫn còn tủ khác thì nút chính đổi chữ. "Còn tủ khác" xét theo bản tóm tắt mới nhất, sau khi bỏ tủ đã đếm và tủ đang hiện.

    | Khóa | VI | EN |
    |---|---|---|
    | `co.go_next_cabinet` | Tiếp tục: Tủ căn {room} | Continue: Room {room} minibar |

    Hết tủ thì giữ `co.go_extras`. Nhãn busy giữ như #67.
  - (b) Sau 201, nếu trang chuyển sang tủ khác thì hiện toast của DS:

    | Khóa | VI | EN |
    |---|---|---|
    | `co.minibar_cabinet_saved` | Đã lưu số đếm tủ căn {room}. | Room {room} minibar count saved. |

    `{room}` là tủ vừa đếm (`counted`), không phải tủ đang hiện. Nếu trang sang thẳng bước ② thì không cần toast, vì màn đã đổi bước.
  - Test gợi ý:
    - đang ở tủ 402, còn tủ 202: nút ghi "Tiếp tục: Tủ căn 202";
    - sau 201: có toast "Đã lưu số đếm tủ căn 402.", và nút ghi "Tiếp tục: Phụ phí".
- Trạng thái: Open

## Điểm nên giữ
- Tên tủ luôn có trên màn, ở đúng chỗ cũ, bằng đúng chữ lễ tân đã quen. Từ mới duy nhất là nhãn `dt`.
- Màn không phụ thuộc vào lúc bản tóm tắt về: trước và sau đều như nhau, nên không có lựa chọn nào nhấp nháy.
- Test kiểm đúng thứ người dùng thấy: dòng tên tủ và nhóm chọn tủ đã ẩn. Trước đây test dựa vào thuộc tính của một nút đã rời khỏi trang.

## Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **UXD duyệt PR #81** (BUG-R4-042, H16 bước ①) @ `054d40c0`: ĐẠT. Giữ nguyên khóa `co.minibar_cabinet_counting` "Tủ minibar đang đếm" / "Minibar being counted". Dòng `.dl` tên tủ đặt đúng chỗ nhóm chọn tủ, chỉ hiện khi lượt ở có từ 2 tủ. Tủ đã đếm không được đưa lại. Không thêm dòng "Đã đếm" cố định. v1.0.5: nút chính nêu tủ kế tiếp (`co.go_next_cabinet`) và toast `co.minibar_cabinet_saved` (FB-R4-UXD-FE-PR81-01, Minor) | UXD | Tủ trên màn luôn là tủ đang gửi (K11-03). Nhãn đi cặp với "Tủ minibar cần đếm". Xác nhận đã lưu hợp với toast hơn một dòng cố định |
