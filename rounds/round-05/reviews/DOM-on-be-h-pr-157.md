# DOM review – BE-H PR #157 (`r5-h1d`): hai thẻ DOM của #154

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #157, nhánh `r5-h1d` @ **`82052ad2`** (gộp sau #154). DOM chỉ xét hai thẻ của mình:
  - `3473efd6`: DOM FB-R5-DOM-BE-154-01 (`folio.service.ts` `syncCommissionOnly`, test đơn X);
  - `c01c9ca8`: DOM FB-R5-DOM-BE-154-02 (chỉ test, đơn X).
- Đối chiếu: DOM `DOM-on-contract-addendum-1h.md` mục 1.4; DOM `DOM-on-be-h-pr-154.md` thẻ 154-01, 154-02; BR-212.
- DOM đọc thêm `82052ad2` (SEC 154-03): kiểm quyền đổi người chốt chuyển lên ngay sau bước `editable`. Luật theo mốc giữ nguyên, nên không đổi ai được đổi và ai hưởng.
- DOM đọc mã và test bằng `git show`, không chạy test. Kết quả đột biến lấy từ mô tả PR.
- Không ghi tỷ lệ hay số tiền hoa hồng. Không dữ liệu khách.

## 0. Kết luận

**DUYỆT.** Hai thẻ làm đúng đề xuất và khớp DOM 1h mục 1.4. Đề xuất ORC đóng FB-R5-DOM-BE-154-01 và FB-R5-DOM-BE-154-02 khi #157 gộp. Không thẻ mới. Không ESC.

## 1. Đối chiếu

| Thẻ | Đề xuất DOM | #157 | Khớp |
|---|---|---|---|
| 154-01 – dòng `earned` của người chốt cũ khi `void` giữ ngày đạt | Bỏ `recognized_at = NULL` trong lệnh `void` của `syncCommissionOnly`, như `voidCommissions`. Ca X: dòng `void` giữ giờ B18 | `3473efd6`: lệnh `void` chỉ còn `status`, `void_reason`, `updated_at`, `version`. Ca X kiểm dòng `void` có `recognized_at` = giờ B18 (21/10 11:00). Đột biến V1 ("`void` xóa `recognized_at`") đỏ | Có |
| 154-02 – ghim `recognized_at` của người mới = lúc OWN sửa | Ca X kiểm đúng giờ sửa (21/10 12:00), có đột biến "người mới lấy ngày đạt cũ" | `c01c9ca8` (cùng lệnh kiểm còn nguyên ở `82052ad2`): dòng `earned` của người mới có `recognized_at` = 21/10 12:00. Đột biến R1 ("ghi sớm một giờ so với lúc sửa") đỏ | Có |

Về R1: trong ca X, B18 sớm đúng một giờ so với lần sửa, nên R1 cho đúng giờ B18. Vì vậy R1 cũng là đột biến "người mới lấy ngày đạt của người cũ" mà DOM yêu cầu.

Vì sao đúng nghiệp vụ (DOM 1h mục 1.4):
- **Người mới** đạt vào lúc sửa, nên dòng của họ vào kỳ chi kế. Không mở lại kỳ đã chốt (BR-212, cùng cách BR-525 (iii)).
- **Người cũ** giữ ngày đạt cũ trên dòng `void`.
  - Chủ đầu tư đã chi ngoài Desk cho người cũ thì biết ngay dòng đó thuộc kỳ nào, để trừ ở kỳ chi sau (BR-212).
  - Dòng `void` không ngày dễ bị hiểu là chưa từng đạt, giống một lần đổi trước ngày đến.
- Không cộng trùng: tổng hoa hồng và mọi chỗ đọc `recognized_at` (`commissions.service.ts`, `folio.service.ts`) đều lọc theo trạng thái, nên dòng `void` có ngày không bị cộng.
- Hai luồng `void` nay cùng một luật: đổi người chốt và hủy đơn (`voidCommissions`) đều giữ ngày đạt.

Câu sổ tay đề xuất ở DOM 154-04 (c) ("dòng của người mới mang ngày đạt") và ý trừ người cũ ở K14 (DOM 155-02) vẫn đúng với #157, không cần sửa thêm.

## 2. Giả định DOM dùng

1. Kết quả đột biến V1, R1 lấy từ mô tả PR #157; DOM không chạy lại.
2. DOM không review phần SEC 154-01/02/03, ARC 154-01, ARC 149-01 của #157, trừ ý ở đầu tệp là luật theo mốc không đổi.

## 3. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review BE-H PR #157 (r5-h1d) @ 82052ad2, hai thẻ DOM của #154: DUYỆT.** 154-01 (3473efd6): dòng earned của người chốt cũ khi void (đổi người chốt) giữ recognized_at = ngày B18, như voidCommissions – chủ đầu tư biết kỳ đã chi để trừ ở kỳ sau (BR-212); ca X kiểm, đột biến V1 đỏ. 154-02 (c01c9ca8): recognized_at của dòng earned người mới = đúng giờ OWN sửa (vào kỳ chi kế, không mở lại kỳ đã chốt – DOM 1h 1.4); đột biến R1 đỏ (trong ca X tương đương "người mới lấy ngày B18"). Đóng 154-01, 154-02 khi #157 gộp. Không thẻ mới, không ESC, không số hoa hồng | DOM | rounds/round-05/reviews/DOM-on-be-h-pr-157.md |`
