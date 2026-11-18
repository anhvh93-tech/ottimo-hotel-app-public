# FB-INV-012 – Đề xuất quy tắc nhập chỉ số quá hạn ghi trễ (DOM)

- Tác giả: DOM | Round 5 – Phản hồi & sửa | Ngày: 18/11/2026
- Đầu vào: `DOM-rules.md` (BR-LS-10..13), `contract.md` §11.1–11.2, FB-INV-012, `qa/bug-list.md` (BUG-R5-008, kiểm lại 18/11).
- Trạng thái: **đề xuất**, chưa sửa `DOM-rules.md`, chưa commit. Số liệu trong ví dụ là giả.

## 1. Vấn đề

Theo §11.2, nhập sau `lateUntil` (cuối cửa sổ + `lateMaxDays` 10 ngày) thì **mọi vai** nhận `422 READING_OUT_OF_WINDOW`. Desk bảo lễ tân "báo quản lý", nhưng quản lý cũng bị chặn. Hậu quả không chỉ ở điện nước:

- Thiếu `period_end` hoặc `period_start` thì phiếu tháng sau trả `METER_READING_MISSING`. Vì vậy **tiền thuê trả trước của căn đó cũng không phát hành được**.
- Thiếu `checkin` thì kỳ đầu không có chỉ số đầu kỳ, nên phiếu đầu tiên bị chặn mãi.
- Cách gỡ duy nhất hiện nay: OWN nâng `lateMaxDays` (tối đa 31) cho cả cơ sở, FDL nhập kèm lý do, rồi OWN hạ lại. Cách này áp cho mọi căn, không quá 31 ngày, và người nhập vẫn phải khai ngày đọc cũ. Đó lại đúng là lỗ hổng BUG-R5-008 vừa bịt.

Với 10 căn dài hạn, chuyện quên chốt một căn sẽ xảy ra (lễ tân nghỉ, khách đi vắng, đồng hồ trong căn khóa). Cần một lối ra có kiểm soát.

## 2. Phương án

| | A. Đọc bù hôm nay – MGR/OWN (**đề xuất**) | B. Phát hành phiếu không có điện nước, gộp vào kỳ sau | C. Giữ chặn, chỉ sửa câu báo |
|---|---|---|---|
| Cách làm | MGR+ ghi **lần đọc bù**: đọc đồng hồ **thật, hôm nay**. `readOn` bắt buộc là ngày nghiệp vụ hôm nay, không được lùi ngày. Bắt buộc lý do, ảnh và audit. Lần đọc thay đúng chỗ còn thiếu | Cho phát hành phiếu M+1 với dòng điện nước ghi "chưa có số – gộp kỳ sau". Phiếu sau tính hai tháng một lần, hoặc thêm dòng "Điều chỉnh kỳ trước" (BR-LS-16) | Câu báo nói rõ không nhập được nữa. OWN nâng `lateMaxDays` khi cần |
| Gỡ được bế tắc | Có, mọi loại lần đọc | Chỉ gỡ được phần phiếu. Lần đọc vẫn thiếu, nên phải thêm cờ "bỏ qua chỉ số" | Không. Vẫn phải nhờ OWN đổi tham số của cả cơ sở |
| Đúng tiền | Khách trả theo số đọc thật. Phần chưa đo được thì không tính khách, khớp nguyên tắc hao hụt INV chọn 17/11 | Khách nhận phiếu điện nước hai tháng, dễ thắc mắc. Doanh thu điện nước chậm một tháng | Như hiện nay |
| Chống gian lận | Không lùi ngày, nên không lặp lại BUG-R5-008. Mỗi lần đọc bù đều lên báo cáo OWN | Cờ "bỏ qua" là đường tắt mới, dễ bị dùng thay cho việc đi đọc đồng hồ | Tốt, nhưng người dùng sẽ lách bằng tham số |
| Việc BE/FE | Nhỏ, chỉ thêm (mục 4) | Vừa. Đụng logic phát hành, cảnh báo và in phiếu | Chỉ sửa câu chữ |

**Đề xuất A.** Chỉ dùng B khi khách đã rời đi mà không đọc được đồng hồ. Khi đó áp quyết toán theo BR-LS-04 và BR-LS-16 như hiện có, không cần quy tắc mới.

## 3. Quy tắc đề xuất – BR-LS-17 "Đọc bù sau hạn ghi trễ"

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-17 | **Bậc quyền theo độ trễ:** trong cửa sổ → FD+. Trễ ≤ `lateMaxDays` → FDL+ có lý do (giữ §11.2). Quá `lateUntil` → **chỉ MGR/OWN**, bằng **lần đọc bù**. **Lần đọc bù:** `readOn` = ngày nghiệp vụ hôm nay (không lùi, không tiến). **Bắt buộc**: lý do 3–300 ký tự và ảnh mặt đồng hồ chụp hôm đó. Lần đọc bù **không** được miễn ảnh như BR-LS-13, vì đây là lúc cần bằng chứng nhất. Ghi `late=true`, đánh dấu đọc bù, audit riêng. Nháp phiếu dùng lần đọc bù có cảnh báo, phát hành phải xác nhận. Áp cho `checkin`, `period_end`, `period_start`, `room_change_in`, `room_change_out`. | Căn 203: đến 05/11, quên chỉ số nhận phòng; `lateUntil` 16/11. Ngày 18/11 MGR đọc 1.312, ghi lý do "quên chốt lúc nhận phòng", chụp ảnh → lưu |

### 3.1 Lần đọc bù thay cho cái gì

| Thiếu | Lần đọc bù dùng làm | Tiền | Ví dụ |
|---|---|---|---|
| `checkin` / `room_change_in` (đầu kỳ đầu tiên) | Đầu kỳ của đoạn ở đó | Phần dùng từ ngày đến tới ngày đọc bù vào `gap`, **không tính khách**, OWN xem. Cùng nguyên tắc §11.1 "đầu kỳ đọc trễ" | Cuối kỳ của khách trước 1.250, đọc bù 1.312 → hao hụt 62 kWh (khoảng 248.000 chưa VAT), OTTIMO chịu |
| `period_start` (đầu kỳ M+1) | Đầu kỳ M+1 | Như trên: từ ngày 01 tới ngày đọc bù vào `gap`, không tính khách | – |
| `period_end` (cuối kỳ M) | Cuối kỳ M. Lễ tân nhập luôn **đầu kỳ M+1 = cùng số, cùng ngày** (2 POST như S12, hai ảnh, `gap` = 0) | Khách trả đúng số đã dùng. Dòng điện nước kỳ M kéo dài tới ngày đọc bù, kỳ M+1 ngắn lại tương ứng, tổng không đổi, không tính hai lần. **Đơn giá vẫn theo ngày cuối tháng M** (BR-LS-07). Bill in **ngày đọc thật** ("01/11–15/12") để khách đối chiếu | Đầu kỳ 11 = 1.250. Chưa chốt 30/11; `lateUntil` 11/12. Ngày 15/12 MGR đọc 1.470 → điện phiếu 12/2026 = 220 kWh × 4.000 = 880.000. Phiếu 01/2027 = cuối 31/12 − 1.470 |
| `room_change_out` (căn cũ) | Cuối kỳ của đoạn ở căn cũ | Nếu căn cũ đã có lần đọc sau ngày rời (nhận phòng hoặc đầu kỳ của lượt sau), Desk **gợi ý dùng số đó** và MGR chọn. Như vậy khách cũ không phải trả phần khách sau dùng. Nếu không có thì đọc bù hôm nay; khi căn đã có khách mới ở thì bắt buộc dùng số của lượt sau | – |

### 3.2 Quan hệ với các luật đang có

- **Hao hụt khoảng trống (§11.1):** không đổi. Đọc bù đầu kỳ chỉ làm `gap` lớn hơn, không bao giờ tính hao hụt cho khách. Đọc bù cuối kỳ thì `gap` của đầu kỳ sau = 0.
- **Cảnh báo hai bước (`OPENING_BELOW_PREVIOUS_CLOSING`):** vẫn áp như thường. Đọc bù không bỏ qua kiểm tra số: đầu kỳ bù thấp hơn cuối kỳ trước thì MGR vẫn phải gửi lại kèm `acknowledgeLowerThanPrevious`.
- **Cuối < đầu (`METER_LOWER_THAN_PREVIOUS`):** vẫn chặn.
- **Ngoại lệ FDL+ (thay đồng hồ / quay vòng):** lần đọc bù được kèm `exception` (MGR+ đã có quyền A89). Nếu đồng hồ được thay trong lúc chưa ai chốt mà không biết số cuối của đồng hồ cũ, phần dùng trên đồng hồ cũ **không tính khách**. MGR ghi lý do. Không ước tính.
- **BUG-R5-008:** giữ nguyên luật "trễ xét theo ngày nhập". Đọc bù chỉ thêm một bậc sau `lateUntil`, không mở lại việc khai ngày đọc cũ.
- **`lateMaxDays`:** giữ tham số OWN (mặc định 10). Không cần nâng tạm nữa.
- **Phiếu đã phát hành:** đọc bù không bao giờ thay số trên phiếu đã phát hành. Nếu số trên phiếu sai thì đi BR-LS-16 (hủy hoặc điều chỉnh kỳ trước).
- **Khách đã trả phòng:** không đọc bù kỳ tháng nữa. Lấy chỉ số trả phòng cho bill quyết toán (BR-LS-04).

### 3.3 Câu báo trên Desk (UXD chốt chữ)

- FD/FDL quá `lateUntil`: "Đã quá hạn ghi trễ cho ngày đọc này (hạn chốt dd/mm). Quản lý cần đọc bù đồng hồ hôm nay." Câu báo không được nói chung chung "báo quản lý để xử lý" khi không có đường xử lý.
- MGR/OWN: cùng câu báo + nút **"Đọc bù hôm nay"**. Ngày đọc khóa là hôm nay, ô lý do và ảnh bắt buộc.
- Nháp phiếu có lần đọc bù: "Chỉ số đọc bù ngày dd/mm (quá hạn ghi trễ) – kiểm tra trước khi phát hành."

## 4. Gợi ý cho ARC (ARC quyết hình dạng API, chỉ thêm)

- `MeterReadingCreate` thêm `catchUp: true` (có thể dùng lại `lateReason` làm lý do). BE chỉ nhận khi ngày nhập > `lateUntil`, `readOn` = hôm nay và có ảnh.
  - FD/FDL gửi → `403 FORBIDDEN_ACTION`.
  - Thiếu lý do hoặc ảnh → `422 VALIDATION_FAILED`.
  - `readOn` ≠ hôm nay → `422 VALIDATION_FAILED` (`readOn: CATCH_UP_TODAY_ONLY`).
- `READING_OUT_OF_WINDOW` khi quá hạn trả thêm `catchUpNeedsRole: "manager"`, để FE biết hiện nút cho ai.
- Cột `catch_up boolean`, audit `meter_reading.catch_up`, cảnh báo nháp `READING_CATCH_UP` (phát hành phải `acknowledgeWarnings`). Dùng lại `late_approved_by`.
- `room_change_out` bù: candidates trả lần đọc kế tiếp của căn cũ (nếu có) để FE gợi ý.
- Quyền: hàng mới trong rbac (MGR/OWN). Cập nhật `rbac-matrix.md` và `.json` cùng commit, như ghi chú §4.

## 5. Tiêu chí test (QA)

1. Quá `lateUntil`: FD và FDL nhận 422/403, câu báo đúng. MGR có lý do và ảnh, `readOn` hôm nay → 201, `catch_up=true`.
2. MGR với `readOn` khác hôm nay → 422. MGR thiếu ảnh → 422.
3. `period_end` bù rồi `period_start` cùng số → `gap` = 0. Phiếu in đúng ngày đọc thật, đơn giá theo ngày cuối tháng.
4. `checkin` bù → `gap` = số bù − cuối kỳ trước, không vào phiếu.
5. Đầu kỳ bù thấp hơn cuối kỳ trước → vẫn qua cảnh báo hai bước.
6. Nháp có `READING_CATCH_UP`. Phát hành không xác nhận → bị chặn.
7. Hồi quy BUG-R5-008 (a)–(d) không đổi.

## 6. Quyền quyết

- **Thuộc DOM + ARC, không cần ESC.**
  - Đây là luật kiểm soát nội bộ: ai được sửa, sửa thế nào.
  - Không đổi giá, không đổi chính sách với khách.
  - Phần không tính khách theo đúng nguyên tắc hao hụt INV đã chọn 17/11.
- Ghi vào `decision-log.md` với nhãn **[GIẢ ĐỊNH – chờ INV xác nhận]**: "Đọc bù sau hạn ghi trễ cho MGR và OWN". Nếu INV muốn chỉ OWN được làm, chỉ cần đổi một dòng quyền.
- Khi ORC đồng ý, DOM gộp BR-LS-17 vào `DOM-rules.md` và `business-rules.md`, đồng thời sửa bảng quyền mục 5. ARC bổ sung §11.2.
