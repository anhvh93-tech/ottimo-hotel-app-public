# UXD – v1.0.4: cột "Nguồn giá" của H09 cho đêm có giá đã gõ (kèm PR70-02 phần cột)

- Người viết: UXD | Round 4 – đợt v1.0.4 – bước **Phản hồi & sửa** (việc kéo sớm) | 05/11/2026
- Đối tượng: `BookingDialog.tsx` @ `e71ab25f` (#75), dòng 1385:

  ```tsx
  {calc ? t(weekend(r.date) ? 'bk.src_weekend' : 'bk.src_list') : '–'}
  ```

  `weekend()` ở dòng 119 chỉ xét thứ trong tuần.
- Đối chiếu:
  - `booking.rates_cleared_*`, `booking.hold.typed_rate_locked` (#75), `bk.src_*`, `rate.*`;
  - `NightRate` trong `openapi.yaml` (cờ `edited`: `true` thì máy chủ ghi `manual`);
  - BR-104 v0.5.1 (không tăng cuối tuần/lễ, ESC-045 câu 1 = A);
  - thẻ FB-R4-UXD-FE-PR70-02 và PR70-03.
- Chỉ đọc mã, không chạy test.

## Vấn đề
- Cột chọn nhãn chỉ theo thứ trong tuần. Đêm lễ tân đã gõ giá vẫn hiện "Giá niêm yết (BR-101)", hoặc "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)", trong khi máy chủ ghi `manual`. Không sai tiền.
- Từ #75, câu "Giữ chỗ chỉ theo giá niêm yết…" nằm ngay dưới bảng. Đọc cùng nhau, lễ tân dễ hiểu là Tạo đơn cũng lấy giá niêm yết.
- Trong lúc chờ bản xem (`priceWaiting`, PR70-02), ô giá đã trống, nhưng cột vẫn hiện nhãn của lượt ở trước.

## 1. Khóa mới

| Khóa | VI | EN |
|---|---|---|
| `bk.src_typed` | Giá đã gõ | Typed rate |

- Dùng đúng cụm "giá đã gõ" của `booking.rates_cleared_channel`, `booking.rates_cleared_room_group` và `booking.hold.typed_rate_locked`. Câu khóa ở #75 nói "bấm Tạo đơn để lưu **giá đã gõ**". Cột nay gọi đúng tên đó, nên câu khóa và cột nói cùng một ý.
- Không gọi "Giá thỏa thuận". Với đơn OTA, số gõ là giá theo xác nhận của OTA, không phải giá thỏa thuận với khách. "Giá đã gõ" đúng cho mọi kênh.
- Không ghi mã BR. Nhãn này nói nguồn là thao tác của lễ tân, không phải một quy tắc giá.

Dòng cho `gen_strings.py`: thêm vào nhóm `g("v1.0.4 booking – FE-B: …")` của #75, ngay sau `booking.hold.typed_rate_locked`.

```python
("bk.src_typed", "Giá đã gõ", "Typed rate", None, "v1.0.4 booking (UXD-on-v104-src-typed). Cột Nguồn giá H09: đêm có ô lễ tân đã gõ và còn số (ratesEdited && rates – cùng phép thử với booking.hold.typed_rate_locked), mọi kênh, không phụ thuộc bản xem. Máy chủ ghi manual (NightRate.edited). Cùng cụm 'giá đã gõ' với booking.rates_cleared_* và booking.hold.typed_rate_locked"),
```

## 2. Cột "Nguồn giá" theo nội dung ô (gồm PR70-02 phần cột)

Nhãn nói đúng điều ô đang chứa. Thứ tự xét:

| Ô của đêm | Nhãn |
|---|---|
| Có số lễ tân đã gõ (`form.ratesEdited[d] && form.rates[d]`) | `bk.src_typed`. Hiện cả khi đang chờ bản xem, vì số đã gõ không phụ thuộc bản xem |
| Ô trống: lễ tân xóa; đang chờ bản xem (`priceWaiting`); hoặc OTA/Nội bộ chưa gõ | `–`, như hiện nay khi chưa có `calc` |
| Ô điền từ bản xem **của lượt ở đang hiện** (`prefillLive`, chưa gõ) | `bk.src_list`. Xem mục 3 về `bk.src_weekend` |

- Cách này giải luôn phần cột của PR70-02. Khi `priceWaiting`, ô chưa gõ đang trống (`prefillLive` = false), nên cột tự hiện `–`, không còn nhãn của lượt ở trước. Không cần khóa mới.
- Gắn `aria-busy="true"` cho `.rate-table` khi `priceWaiting` (DS mục 7 dòng 558). Không thêm spinner, vì nút Tạo đơn đã nói "Đang tải…".
- Dòng "Sau giảm {pct}%" (S4-38) giữ nguyên điều kiện hiện nay.
- Phần còn lại của PR70-02 là bảng tổng. Trong lúc `priceWaiting`, bảng tổng vẫn là của lượt ở trước. Vẫn mở ở mức Minor: ẩn bảng hoặc hiện `–` tới khi `calcFor === liveKey`. Việc này không cần chữ, nên FE có thể làm cùng PR nhỏ này nếu muốn.
- Test gợi ý:
  - gõ đêm 1 thì đêm 1 hiện "Giá đã gõ", đêm 2 hiện "Giá niêm yết (BR-101)";
  - xóa ô vừa gõ thì hiện `–`;
  - đổi căn thì trong lúc chờ mọi ô chưa gõ hiện `–` và bảng có `aria-busy`;
  - OTA gõ một đêm thì đêm đó hiện "Giá đã gõ", đêm khác hiện `–`.

## 3. Đề xuất kèm, DOM xác nhận: bỏ nhãn "+15%" theo thứ trong tuần
- BR-104 v0.5.1 (INV quyết ESC-045 câu 1 = A): **không tăng giá cuối tuần và ngày lễ**. `weekend_uplift_pct` = 0 từ ngày OWN chuyển giá. Hướng dẫn chuyển giá của DOM cũng dặn bỏ "+15 %" khỏi sổ tay và tờ dán quầy.
- Sau khi chuyển, mọi đêm thứ Sáu và thứ Bảy vẫn hiện "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)" cạnh **cùng một số** với ngày thường. Lễ tân có thể báo khách rằng cuối tuần đắt hơn.
- Đề xuất: ô điền từ bản xem luôn hiện `bk.src_list`. FE bỏ điều kiện `weekend()` ở dòng này, chỉ đổi 1 dòng mã, không cần khóa mới.
  - Tiền vẫn do máy chủ tính, nên nếu còn property nào chưa chuyển giá thì số vẫn đúng. Chỉ có nhãn kém chi tiết hơn.
  - Nếu INV bật lại mức tăng Noel–Tết (BR-104: báo trước 15/12), ARC thêm nguồn từng đêm vào phản hồi báo giá. Khi đó UXD cấp lại nhãn đúng theo dữ liệu, không đoán theo thứ trong tuần.
- Ghi chú mới cho `bk.src_weekend` trong `gen_strings.py` (giữ khóa, không xóa):

  ```python
  "09-booking.html. Không dùng ở Desk từ v1.0.4 (BR-104 v0.5.1: không tăng cuối tuần/lễ; UXD-on-v104-src-typed mục 3). Nếu bật lại mức tăng: nhãn theo nguồn từng đêm của máy chủ, không theo thứ trong tuần"
  ```

- DOM xác nhận OWN đã chuyển giá trên production. Nếu chưa chuyển, FE vẫn làm mục 1–2 và giữ dòng `weekend()` tới ngày chuyển.
- UXD tự sửa mẫu hi-fi `product/design/hifi/09-booking.html` dòng 93 (đêm thứ Sáu 911.000 kèm "+15%") theo bảng giá mới ở đợt sau. Không thuộc PR của FE.

## Thẻ

### FB-R4-UXD-FE-SRC-01
- Mức độ: Minor (v1.0.4, kéo sớm; một PR nhỏ của FE)
- Vị trí: `BookingDialog.tsx` dòng 1385 (cột Nguồn giá) và `.rate-table`; `gen_strings.py`, nhóm v1.0.4 booking FE-B.
- Vấn đề: nhãn nguồn chỉ chọn theo thứ trong tuần, nên đêm đã gõ vẫn ghi "Giá niêm yết". Đọc cạnh câu khóa Giữ chỗ của #75, lễ tân dễ hiểu là Tạo đơn cũng lấy giá niêm yết. Trong lúc chờ bản xem, cột hiện nhãn của lượt ở trước. Nhãn "+15%" sai sau khi chuyển sang giá BR-104 v0.5.1.
- Vì sao quan trọng:
  - Đây là chỗ lễ tân kiểm giá trước khi bấm Tạo đơn.
  - Nhãn sai làm lễ tân nghi ngờ số đã gõ. Họ có thể xóa giá thỏa thuận mà không cần, hoặc báo khách sai về giá cuối tuần.
- Đề xuất sửa: mục 1 (khóa `bk.src_typed`), mục 2 (nhãn theo nội dung ô và `aria-busy`), mục 3 (bỏ `weekend()`, chờ DOM xác nhận).
- Trạng thái: Open

Không có ESC.

---

## Lượt 2 – PR #82 (05/11/2026)

- Bước **Review**. Đối tượng: `git diff 9b45cef3...origin/v104/fe-rate-source-typed` @ `e8b1c4e9`, chồng trên #75. Gồm:
  - `BookingDialog.tsx`;
  - `gen_strings.py` và các tệp sinh ra từ nó;
  - `v104-rate-source-typed.test.tsx`.
- Cách xem:
  - Dựng worktree tạm ở `e8b1c4e9`. Test của PR: 4/4 xanh.
  - Viết thêm một test tạm: giữ bản xem sau khi đổi từ 7 đêm sang 3 đêm, để xem chữ BR-107 trong lúc chờ. Test không commit, đã xóa cùng worktree.
  - Sinh lại `gen_strings.py`: không ra diff.

### Kết luận: ĐẠT. Đóng FB-R4-UXD-FE-SRC-01 và FB-R4-UXD-FE-PR70-02

| Mục trong bảng | Mã ở `e8b1c4e9` | Kết quả |
|---|---|---|
| 1. Khóa `bk.src_typed` | "Giá đã gõ" / "Typed rate", nằm trong nhóm v1.0.4 booking FE-B, ngay sau `booking.hold.typed_rate_locked`. Ghi chú đúng nguyên văn | Đúng |
| 2. Ô có số đã gõ → `bk.src_typed` | Điều kiện `form.ratesEdited[d] && form.rates[d]`, cùng phép thử với câu khóa Giữ chỗ. Điều kiện này xét trước, nên nhãn hiện cả khi đang chờ bản xem | Đúng. Test ca 1, 2, 4 |
| 2. Ô trống → `–` | Mọi ô không có `raw` đều ra `–`: ô đã xóa, ô đang chờ bản xem, ô OTA/Nội bộ chưa gõ. Vẫn là ký tự gạch như trước | Đúng. Test ca 1, 2, 4 |
| 2. Ô điền từ bản xem của lượt ở đang hiện → `bk.src_list` | Điều kiện `r.raw && calc`. Ô chưa gõ chỉ có `raw` khi `prefillLive` | Đúng |
| 3. Bỏ `weekend()` | Đã gỡ cả hàm lẫn điều kiện. Đêm thứ Sáu, thứ Bảy hiện "Giá niêm yết (BR-101)" | Đúng. Test ca 3. DOM lượt 8 §4.2 đồng ý bỏ ngay, không chờ xác nhận chuyển giá. Lý do: nếu production chưa chuyển giá thì cái sai là giá, không phải nhãn |
| Ghi chú `bk.src_weekend` | Đúng nguyên văn mục 3. Khóa vẫn giữ, không xóa | Đúng |
| `aria-busy` khi chờ bản xem | `.rate-table` và `table.sum` cùng có `aria-busy="true"` khi `priceWaiting`. Xong thì gỡ hẳn thuộc tính (`|| undefined`) | Đúng DS mục 7 dòng 558. Không thêm spinner, vì nút Tạo đơn đã ở trạng thái "Đang tải…" (test tạm in ra `btn pri busy` … "Đang tải…") |
| Tổng `–` khi chờ | Tiền phòng, phụ thu người, Tổng tiền đơn và Cọc cần thu đều hiện `–`. Dòng tổng không còn chữ "đ" đứng lẻ sau `–` | Đúng |
| Brand | Không thêm lớp, màu hay `style=` | Đạt |

PR70-02 đóng: FE làm đúng đề xuất của thẻ, gồm cột `–`, các ô tiền `–` và `aria-busy`. Chữ BR-107 dưới đây là phát hiện mới, ghi thành thẻ PR82-01.

Có hai thẻ Minor mới, cả hai không chặn gộp. Không có ESC.

### Phát hiện mới: chữ BR-107 vẫn lấy từ bản xem cũ trong lúc chờ

Ca của test tạm: kênh Trực tiếp, 7 đêm, được giảm 10%. Giữ bản xem lại, rồi đổi ngày đi để còn 3 đêm. Trong lúc chờ, màn hiện:

| Chỗ | Chữ trên màn | Phải là |
|---|---|---|
| Dưới bảng giá (`rate.tier_note`) | "Lượt ở 3 đêm được giảm 10% theo số đêm (BR-107) …" | Không có câu này, vì 3 đêm không được giảm |
| Bảng tổng, dòng phụ | "Đã giảm 10% vì ở từ 7 đêm (BR-107)", ngay cạnh "3 đêm –" | Chưa có gì, tới khi bản xem về |

Khi bản xem về, màn đúng lại: "Giảm theo số đêm (BR-107): không áp dụng". Chiều ngược lại (3 sang 7 đêm) cũng sai: trong lúc chờ, lượt 7 đêm bị ghi "không áp dụng".

### FB-R4-UXD-FE-PR82-01
- Mức độ: Minor. Không chặn gộp #82. FE làm luôn trong #82 nếu còn giờ, nếu không thì sang v1.0.5.
- Vị trí: `BookingDialog.tsx`, các chỗ đọc `losPct` (khoảng dòng 508) hoặc `calc.losDiscountPct`:
  - câu dưới bảng giá: `rate.tier_note`, `rate.tier_on_save`, `rate.tier_locked`;
  - dòng "Sau giảm {pct}%" của từng đêm;
  - đuôi `· {rate.pre_tier_short}` ở dòng số đêm của bảng tổng;
  - dòng phụ của bảng tổng: `sale.los_applied` / `bk.los_none`.
- Vấn đề: khi `priceWaiting`, các số đã thành `–`, nhưng những chữ trên vẫn lấy từ bản xem của lượt ở trước và ghép với số đêm mới. Kết quả là màn có một câu sai: "Lượt ở 3 đêm được giảm 10%".
- Vì sao quan trọng: lễ tân đọc câu này khi báo giá cho khách qua điện thoại. Mạng Đà Lạt yếu thì khoảng chờ có thể kéo dài vài giây. Không sai tiền: nút Tạo đơn đang khóa, và giá do máy chủ tính.
- Đề xuất sửa (không cần khóa mới):
  - Chữ BR-107 chỉ lấy theo bản xem **của lượt ở đang hiện**. Khi `priceWaiting`, phần chữ coi `losPct` = 0: ẩn câu `rate.tier_*`, ẩn "Sau giảm", ẩn đuôi "· giá lịch…". Ẩn luôn dòng phụ BR-107 của bảng tổng.
  - Giữ `ratesLocked` theo bản xem như hiện nay. Khóa ô là chốt an toàn để không giảm hai lần, không phải chữ.
  - Cùng chỗ đó: nhãn dòng phụ thu người đang lấy `calc.extraGuestCount` của bản xem cũ. Khi chờ, dùng `extra` của form (số tiền đã là `–`).
  - Test gợi ý: 7 đêm rồi đổi sang 3 đêm, giữ bản xem. Không có "được giảm 10%", không có "Đã giảm 10%". Nhả bản xem ra thì hiện "không áp dụng".
- Trạng thái: Open

### FB-R4-UXD-FE-PR82-02
- Mức độ: Minor. Ngoài phạm vi #82 nhưng cùng gốc BR-104 v0.5.1. Làm ở v1.0.5, PO xếp vào backlog.
- Vị trí: `QuoteDialog.tsx` (H12 Báo giá), dòng 63 (`weekend()`) và khoảng dòng 344 (nhóm đêm); khóa `sale.nights_weekday` / `sale.nights_weekend`.
- Vấn đề:
  - Bảng báo giá vẫn tách hai dòng "{n} đêm thường × {rate}" và "{n} đêm thứ Sáu, thứ Bảy × {rate}". Từ BR-104 v0.5.1, hai dòng có cùng một giá. Dù vậy, cách tách vẫn gợi ý cuối tuần giá khác, trái lời hứa một giá (DOM lượt 8 §4.3).
  - Giá của mỗi nhóm là giá đêm đầu nhóm (`list[0]`). Nếu nhóm có đêm giá khác, ví dụ ngày đặc biệt hay mức Noel–Tết khi bật lại, thì "{n} × {rate}" không khớp cột tiền.
- Vì sao quan trọng: lễ tân đọc bảng này khi báo giá. Chữ "thứ Sáu, thứ Bảy" dễ biến thành câu "cuối tuần đắt hơn" với khách.
- Đề xuất sửa:
  - Nhóm các đêm theo `amountVnd`: đêm cùng giá chung một dòng, các dòng xếp theo ngày.
  - Dùng một khóa mới thay cho hai khóa cũ. UXD thêm khóa khi FE nhận thẻ:

    | Khóa | VI | EN |
    |---|---|---|
    | `sale.nights_at_rate_one` | {n} đêm × {rate} | {n} night × {rate} |
    | `sale.nights_at_rate_other` | {n} đêm × {rate} | {n} nights × {rate} |

  - `_few` và `_many` giống `_other`, theo cách bốn dạng số của `translate.ts`.
  - Hai khóa cũ vẫn giữ, thêm ghi chú "không dùng từ v1.0.5".
- Trạng thái: Open

### Điểm nên giữ
- Nhãn nói đúng thứ đang có trong ô, không đoán theo lịch. Cột và câu khóa Giữ chỗ dùng chung một phép thử, nên luôn nói cùng một ý.
- Bốn test khớp bốn ca của bảng UXD, kể cả ca chờ bản xem có giữ rồi nhả.
- `aria-busy` được gỡ hẳn khi xong, không để lại `aria-busy="false"`.

### Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **UXD lượt 2 PR #82** @ `e8b1c4e9`: ĐẠT. Cột Nguồn giá H09 đúng bảng nhãn (`bk.src_typed` / `–` / `bk.src_list`); đã bỏ `weekend()`; ghi chú `bk.src_weekend` đúng; có `aria-busy` và tổng `–` khi chờ bản xem. Đóng FB-R4-UXD-FE-SRC-01 và FB-R4-UXD-FE-PR70-02. Mở FB-R4-UXD-FE-PR82-01 (Minor: chữ BR-107 lấy từ bản xem cũ khi chờ) và PR82-02 (Minor, v1.0.5: H12 nhóm đêm theo giá, không theo thứ) | UXD | Nhãn theo nội dung ô và dữ liệu máy chủ, không theo thứ trong tuần (BR-104 v0.5.1, DOM lượt 8 §4.2) |

---

## Lượt 3 – PR #82 delta (05/11/2026)

- Bước **Review**. Đối tượng: `git diff 4344802c 0e48686c` (head `0e48686c`). Delta gồm:
  - chữ theo thẻ DOM FB-R4-DOM-UXD-PR82-01: khóa mới `booking.error.rate_empty_internal`, viết lại `bk.internal_help`;
  - ẩn dòng phụ thu người trong lúc chờ bản xem (FB-R4-ARC-FE-PR82-04);
  - test OTA kèm theo (FB-R4-ARC-FE-PR82-03).
- Đọc thêm `d8346931` (FB-R4-UXD-FE-PR82-01) trong `e8b1c4e9..4344802c`.
- Đối chiếu:
  - BR-105 v0.5.8, ý (1)–(4) và (7);
  - BR-904 v0.5.5: "Nội bộ có thu" vào doanh thu và ADR;
  - sổ tay #72 (`02-le-tan.md` dòng 337): "mặc định không thu tiền";
  - `bk.ch_internal` "Nội bộ" / "Internal".
- Cách xem:
  - Dựng worktree tạm ở `0e48686c`. Chạy `v104-rate-source-typed` và `v104-booking-rate-carryover`: 36/36 xanh.
  - Sinh lại `gen_strings.py`: không ra diff.
  - Worktree đã gỡ.

### Kết luận: ĐẠT. Đóng FB-R4-UXD-FE-PR82-01

| Điểm | Kết quả |
|---|---|
| `bk.internal_help` (VI) | **Duyệt, giữ nguyên.** Đã bỏ "không tính doanh thu", nên hết lệch với BR-904. Cụm "Mặc định không thu tiền" trùng đúng chữ của sổ tay #72. Câu nói hai đường theo BR-105 (1) và (2), cùng một dạng "X: Y." Ngắn, điềm tĩnh, không "Vui lòng" |
| `bk.internal_help` (EN) | **Duyệt, giữ nguyên.** "Free by default: leave the rates empty. Charged: enter a rate for every night." đi song song với bản VI |
| `booking.error.rate_empty_internal` (VI) | **Duyệt, giữ nguyên.** Đồng ý với FE dùng "để trống hết" thay "xóa hết" của DOM: cùng động từ với `bk.internal_help`, và đúng cả khi ô chưa từng được gõ. Câu nói cách đi tiếp, không đổ lỗi. Câu không nhắc đơn vừa có đêm thu vừa có đêm miễn phí (BR-105 (4)). Ca này hiếm, DOM để sổ tay hướng dẫn (BA, 3 gạch), nên không thêm vào câu lỗi |
| `booking.error.rate_empty_internal` (EN) | **Đổi một chữ** (thẻ PR82-03). Trong "leave them all empty", chữ "them" không rõ chỉ đêm hay giá |
| Câu lỗi chỉ cho Nội bộ, OTA giữ `booking.error.rate_empty` | Đúng. Câu nằm ở `.err` của khung giá, như câu OTA |
| Dòng phụ thu người ẩn khi chờ (ARC PR82-04) | **Đồng ý, khớp luật trạng thái chờ.** Ở PR82-01, UXD đề xuất "khi chờ thì dùng `extra` của form". Đề xuất đó sai: dòng vẫn hiện theo bản xem cũ, nên ra câu "Phụ thu 0 người vượt định mức". UXD rút ý đó. Nhãn trở lại `calc.extraGuestCount ?? extra` là đúng |
| BR-107 khi chờ (`d8346931`) | **Đúng thẻ PR82-01.** `losShown` = 0 khi chờ: ẩn câu `rate.tier_*`, ẩn "Sau giảm", ẩn đuôi "· giá lịch…" và dòng phụ BR-107. `ratesLocked` vẫn theo bản xem. Có ca test 7 → 3 đêm |
| Brand | Đạt. Không màu, lớp hay `style=` mới. Chữ đúng giọng nội bộ |

**Luật trạng thái chờ của bảng tổng H09** (ghi lại để dùng cho các lần sau):
- Dòng **luôn có** thì giữ dòng, ô tiền hiện `–`. Gồm: số đêm, Tổng tiền đơn, Cọc cần thu.
- Dòng **chỉ có vì bản xem** thì ẩn tới khi bản xem của lượt ở đang hiện về. Gồm: dòng phụ BR-107 và dòng phụ thu người.
- Chữ lấy từ bản xem không bao giờ ghép với dữ liệu của lượt ở mới.
- Bảng có thể ngắn đi tối đa 2 dòng trong lúc chờ. Chấp nhận được, vì `aria-busy` đã báo, nút Tạo đơn đang "Đang tải…", và khoảng chờ ngắn.

### FB-R4-UXD-FE-PR82-03
- Mức độ: Minor (chỉ chữ). Không chặn gộp. Nếu FE còn đẩy commit vào #82 thì sửa luôn. Nếu không, UXD sửa ở đợt chuỗi kế tiếp sau khi gộp.
- Vị trí: `gen_strings.py`, dòng `booking.error.rate_empty_internal`, bản EN.
- Vấn đề: "or leave them all empty": "them" có thể chỉ "nights" hoặc "a rate".
- Vì sao quan trọng: đây là câu chặn. Lễ tân đọc tiếng Anh phải hiểu ngay ô nào cần để trống.
- Đề xuất sửa (VI giữ nguyên):

  | Khóa | VI | EN |
  |---|---|---|
  | `booking.error.rate_empty_internal` | Đơn Nội bộ: nhập giá cho mọi đêm, hoặc để trống hết nếu miễn phí cả đơn. | Internal stay: enter a rate for every night, or leave all rates empty if the whole stay is free. |

- Trạng thái: Open

### FB-R4-UXD-FE-PR82-04
- Mức độ: Minor. Không chặn gộp. FE làm trong #82 nếu còn giờ (cùng khối `validate()`), nếu không thì sang v1.0.5.
- Vị trí: `BookingDialog.tsx`, kiểm từng ô trong `validate()`: `r.raw && !(parseVnd(r.raw) > 0)` → `booking.error.rate_empty`. Ghi chú của FE trong `gen_strings.py`: "Ô gõ 0 … vẫn báo booking.error.rate_empty tại ô".
- Vấn đề:
  - Với đơn Nội bộ, gõ **0** là cách tự nhiên để nói "miễn phí". Nhưng v1.0.x chưa nhận 0 (BR-105 (7)); đường miễn phí là để trống.
  - Khi đó dưới ô hiện "Nhập giá mỗi đêm (lớn hơn 0)." Đúng câu mà thẻ DOM PR82-01 nói là đẩy lễ tân gõ giá vào đêm định miễn phí.
  - Gõ 0 cho mọi đêm thì không phải "gõ một phần", nên câu Nội bộ mới không hiện. Chỉ còn câu cũ dưới từng ô.
- Vì sao quan trọng: đây là cùng rủi ro DOM nêu. Lễ tân gõ giá để qua câu chặn, khách bị đòi tiền một đêm đã hứa miễn phí. Folio có hiện số nên không mất tiền, nhưng dễ thành khiếu nại ở quầy.
- Đề xuất sửa: với `form.group === 'internal'`, lỗi tại ô dùng khóa mới. Kênh khác giữ `booking.error.rate_empty`.

  | Khóa | VI | EN |
  |---|---|---|
  | `booking.error.rate_zero_internal` | Miễn phí: để trống ô. Có thu: nhập giá lớn hơn 0. | Free: leave the box empty. Charged: enter a rate above 0. |

  - Câu đi cùng dạng "X: Y." với `bk.internal_help`. Câu đúng cả khi gõ 0 lẫn khi gõ số không hợp lệ.
  - Khi (B′) của DOM (cho gõ 0 lúc tạo đơn) vào bản sau thì bỏ khóa này.
  - Ghi chú cho `gen_strings.py`: "v1.0.4 booking (UXD lượt 3 PR #82, BR-105 v0.5.8 (7)). Lỗi tại ô giá H09, chỉ đơn Nội bộ, khi ô có chữ nhưng không phải số > 0. Kênh khác: booking.error.rate_empty. Bỏ khi cho gõ 0 lúc tạo đơn (DOM B′)".
  - Test gợi ý: Nội bộ 2 đêm, gõ 0 cả hai. Dưới mỗi ô có câu mới, không có "(lớn hơn 0)", và không có POST.
- Trạng thái: Open

### Điểm nên giữ
- FE chọn "để trống hết" để câu lỗi và câu hướng dẫn dùng cùng một động từ. Đúng cách giữ chữ nhất quán.
- Câu lỗi tách theo kênh mà không đổi luật chặn chung của OTA và Nội bộ.

### Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **UXD lượt 3 PR #82** @ `0e48686c`: ĐẠT. Duyệt `bk.internal_help` (VI/EN) và `booking.error.rate_empty_internal` (VI), dùng "để trống" ở cả hai. EN của câu lỗi đổi thành "…or leave all rates empty if the whole stay is free." (FB-R4-UXD-FE-PR82-03, Minor, chỉ chữ). Đồng ý ẩn dòng phụ thu người khi chờ bản xem (ARC PR82-04). Chốt luật trạng thái chờ của bảng tổng H09: dòng luôn có thì giữ, ô tiền `–`; dòng chỉ có vì bản xem thì ẩn. Đóng FB-R4-UXD-FE-PR82-01. Mở FB-R4-UXD-FE-PR82-04 (Minor): ô gõ 0 ở đơn Nội bộ báo `booking.error.rate_zero_internal`, thay "(lớn hơn 0)" | UXD | BR-105 v0.5.8, BR-904 v0.5.5, sổ tay #72 "mặc định không thu tiền". Câu chặn không được đẩy lễ tân gõ giá vào đêm định miễn phí |
