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
