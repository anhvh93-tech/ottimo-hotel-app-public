# DOM review – PR #96 (V5-25, kiểm dạng tham số khi lưu) và `damage_catalog`

- Người review: DOM | Round 5 – Review | Ngày: 06/11/2026
- Đối tượng: PR #96, nhánh `r5-v5-25` (BE-C): mô tả mục 2, 5, 6; `product/services/api/src/modules/platform/public/parameter-shapes.ts`. Thêm `damage_catalog` (BR-512), ORC kéo vào V5-25 ngày 06/11, BE-C mở PR xếp chồng.
- Đối chiếu:
  - `product/services/api/src/admin/production-defaults.ts`;
  - hướng dẫn chuyển giá 01/11 (`rounds/round-04/outputs/DOM/inv-price-switch-guide.md`, phần B);
  - từ điển tham số, mục "Tham số trên production lệch sổ tay" (đối chiếu chỉ đọc 06/11);
  - BR mục 13; bộ tính trong `pricing.ts` và `reservations.service.ts`.
- Luật chi tiết: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` **mục 13** (13.1 biên, 13.2 giá trị hỏng trong DB, 13.3 `short_stay_max_nights`, 13.4 `damage_catalog`, 13.5 ca kiểm).
- Không ghi số giá hay hoa hồng thật, không dữ liệu khách.

## 1. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN về nghiệp vụ.** Biên của BE đúng hướng. Không biên nào chặn giá trị đang chạy hay giá trị trong hướng dẫn chuyển giá 01/11. DOM sửa ba chỗ nhỏ (thẻ 01). Ba chỗ này cũng không chặn giá trị đang dùng.

## 2. Trả lời bốn câu của ORC

1. **Biên:** chốt hết, trừ ba chỗ sửa:
   - phần trăm tối đa 2 chữ số thập phân;
   - `max_open_holds_per_user` bắt buộc đủ hai vai;
   - `cancel_policy_direct` không rỗng.

   Bảng đủ ở mục 13.1. `special_dates` 31 đêm/khoảng là đủ: mùa dài hơn thì chia nhiều khoảng.
2. **Giá trị hỏng trong DB:**
   - **Bỏ qua** (bỏ phần hỏng, ghi log): nhóm bán (`weekend_nights`, `special_dates`, hai khóa `*_uplift_channels`, `los_discount`), `lease_terms` (khối so sánh), `checkout_reminders`, `damage_catalog`.
   - **Chặn kèm lỗi rõ, không 500:** chỗ tính tiền hoàn hay phụ thu (`cancel_policy_direct`, `early_departure_refund`), `early_checkin_tiers` và `late_checkout_tiers` chỉ khi cần bảng, và `max_open_holds_per_user`.
   - Bắt buộc ở v1.0.5 chỉ là bộ kiểm khi lưu, cộng câu SQL đạt trên production trước khi lên. Đọc phòng thủ nhóm bán là nên có. Phần còn lại vào R5-B-05.
   - Chi tiết ở mục 13.2.
3. **Từ điển:** đã sửa ở bản 1.4, cho 28 khóa:
   - 12 khóa V5-25 ghi "v1.0.4 chưa kiểm, từ v1.0.5 chỉ nhận …";
   - 10 khóa danh sách ghi "chưa kiểm, kể cả v1.0.5";
   - 6 khóa chữ ghi "chỉ kiểm là chữ".

   Các khóa giờ, số, đúng/sai giữ câu cũ, vì v1.0.4 có kiểm kiểu.
4. **`short_stay_max_nights`:** số đúng là **29** (BR-108, BR-112, BR mục 13 v0.5.0, bảng giá 01/11).
   - 27 ở `production-defaults.ts` là số khởi tạo theo BR v0.4.4. Tệp này phải sửa thành 29 trong lượt đồng bộ với BR mục 13; việc của BE, nhóm B-KYTHUAT, không cần trong PR #96.
   - Production hiện còn thấp hơn 29 vì chủ đầu tư chưa làm B5. Không ảnh hưởng V5-25: trần `nights` vẫn là 7.
   - Mục 13.3.

**`damage_catalog`:**
- tối đa **100** món;
- `priceVnd` số nguyên **1.000–20.000.000**, không dùng 0 và không dùng trần 100.000.000;
- `name` ≤ 100 ký tự, không trùng;
- `code` giữ như BE đề xuất;
- `[]` nhận.

Món lớn hơn trần đi đường "món ngoài bảng" (BR-512). Chi tiết ở mục 13.4.

## 3. Thẻ

### FB-R5-DOM-BE-PR96-01
- Mức độ: Minor
- Vị trí: `parameter-shapes.ts` – `pctIssue`, `maxOpenHoldsIssue`, `cancelPolicyIssue`
- Vấn đề:
  1. Phần trăm nhận mọi số lẻ. `pctToBp` làm tròn về phần vạn, nên 12,345 bị tính thành 12,35 mà không ai biết.
  2. `max_open_holds_per_user` cho thiếu vai. `assertOpenHoldLimit` hiểu vai thiếu là không giới hạn.
  3. `cancel_policy_direct` nhận `[]`. Bộ tính hiểu `[]` là không hoàn mọi trường hợp.
- Vì sao quan trọng: cả ba đều là đổi tiền hay đổi chốt kiểm soát mà không ai biết, chỉ vì một lần lưu nhầm.
- Đề xuất sửa:
  - phần trăm tối đa 2 chữ số thập phân;
  - đủ hai vai `collaborator`, `sales_staff`, thiếu thì 422 `REQUIRED`;
  - `cancel_policy_direct` không rỗng, thiếu thì 422 `REQUIRED`.

  Cập nhật câu SQL và các ca dùng chung. Ca kiểm T-13-2…4 ở mục 13.5.
- Trạng thái: Done (Lượt 2, `897ff46e`)

### FB-R5-DOM-BE-PR96-02
- Mức độ: Minor
- Vị trí: `v5-25-parameter-shape-check.sql`
- Vấn đề: câu SQL chỉ xem bảng tham số. Chính sách hủy đã chép vào `reservation.pricing_snapshot` của đơn còn mở thì không được xem. `damage_catalog` chưa có trong câu SQL.
- Vì sao quan trọng: bản chép hỏng làm lỗi lúc hủy đơn, và sửa tham số không sửa được bản chép.
- Đề xuất sửa: thêm hai dòng chỉ in số:
  - (a) số đơn còn mở có `pricing_snapshot.cancelPolicy` sai dạng;
  - (b) số dòng `damage_catalog` sai dạng (khi PR xếp chồng gộp).

  Khi hủy mà bản chép hỏng: dùng chính sách đang hiệu lực, như mã đang làm khi đơn không có bản chép (mục 13.2).
- Trạng thái: Done (Lượt 2, `897ff46e`; đề xuất thêm về luật dừng lên bản ở mục 5)

### FB-R5-DOM-BE-PR96-03
- Mức độ: Suggestion
- Vị trí: bảng mục 2 của mô tả PR, các khóa bán
- Vấn đề: `weekend_nights`, `special_dates`, `*_uplift_channels`, `los_discount` lưu sai từ trước thì báo giá vẫn 500. Lỗi này cùng mức với BUG-R5-003.
- Vì sao quan trọng: quầy và web dừng bán nếu câu SQL bỏ sót một dòng.
- Đề xuất sửa: nếu kịp, đọc phòng thủ bằng cùng hàm `parameter-shapes.ts`: bỏ phần hỏng, ghi log như `min_stay`. Không kịp thì vào R5-B-05; câu SQL đạt trước khi lên là đủ cho v1.0.5.
- Trạng thái: Deferred – R5-B-05, kèm điều kiện ở mục 5

## 4. Điểm làm tốt

- Rà mọi khóa có cấu trúc trên đường bán, nhận phòng, trả phòng, và ghi rõ v1.0.4 lỗi gì ở từng khóa. Nhờ đó DOM quyết được nhanh.
- Câu SQL chỉ in `key`, `effective_from`, `ok`, chạy cùng các ca của bộ kiểm TypeScript.
- Kiểm hai chiều `min_stay` ↔ `short_stay_max_nights` xét cả dòng đã hẹn ngày.

## 5. Lượt 2 (07/11) – PR #96 HEAD `897ff46e`, PR #109 HEAD `f2e6733d`

1. **Thẻ 01 – ba chỗ sửa: Có, đúng ý.**
   - Phần trăm có chữ số thứ ba bị từ chối (`Number(v.toFixed(2)) !== v`).
   - `cancel_policy_direct` rỗng trả `REQUIRED`.
   - `max_open_holds_per_user` thiếu vai, hoặc vai mang `null`, trả `REQUIRED` ở `value.<vai>`.

   Câu SQL và các ca dùng chung đổi cùng lúc, nên câu SQL và bộ kiểm khi lưu vẫn cho cùng kết quả.
2. **Thẻ 03 – chuyển đọc phòng thủ nhóm bán sang R5-B-05: Có, đồng ý, kèm một điều kiện.**
   - Lý do đồng ý: sau V5-25, Desk không cho lưu sai dạng nữa. Dòng hỏng chỉ còn có thể là dòng cũ, và câu SQL bắt được cả dòng đang hiệu lực lẫn dòng đã hẹn ngày.
   - Điều kiện: thêm `special_dates`, `los_discount`, `weekend_uplift_channels`, `special_uplift_channels` vào nhóm "ok = false thì dừng lên bản, sửa trên Desk trước", cùng nhóm với `min_stay` và `weekend_nights`. Không có đọc phòng thủ thì bốn khóa này hỏng là báo giá 500, giống `min_stay`.
3. **Dòng đếm (a): Có, đúng ý.**
   - Bản chép `cancelPolicy = []` nghĩa là hoàn 0 % mọi trường hợp. OTTIMO chưa bán chính sách nào như vậy, nên phải đếm.
   - Chỉ xét đơn `hold`, `confirmed`, `in_house` đã có bản chép là đúng. Đơn đã đóng không còn hủy. Đơn không có bản chép thì dùng chính sách đang hiệu lực.
   - DOM đề xuất (ORC, ARC chốt): số khác 0 thì **không cần dừng lên bản**, vì v1.0.5 không làm ca này tệ hơn v1.0.4. ORC gửi số cho DOM trong ngày; DOM viết cách xử lý từng đơn, trước ngày đến của đơn đó.
   - Tương tự với `damage_catalog_rows_broken` khác 0: PR #109 đã bỏ dòng hỏng khi đọc, nên sửa trên Desk sau khi lên là được.
4. **`name` của `damage_catalog`: Có, đúng ý.**
   - Đếm 100 ký tự trên chuỗi gốc chỉ chặt hơn vài khoảng trắng thừa, không chặn tên thật. TS đếm theo điểm mã (`[...name].length`), SQL dùng `char_length`, nên hai bên khớp nhau.
   - So trùng: bộ kiểm khi lưu (TS `toLowerCase`, hạ được cả chữ có dấu) mới là chỗ người dùng gặp, và nó đúng ý DOM. `lower()` ở SQL theo collation của DB có thể không hạ chữ có dấu nếu collation là C [CHƯA XÁC MINH]. DOM chấp nhận sai khác này, vì câu SQL chỉ đếm, và bảng hiện có không có hai tên chỉ khác hoa thường.
   - Không cần chuẩn hóa NFC ở v1.0.5.

PR #109 khớp DOM 13.4:
- `priceVnd` 1.000–20.000.000;
- tối đa 100 món (chỉ là luật lưu);
- `code` theo mẫu BE đề xuất, không trùng;
- `[]` nhận;
- đọc khi hỏng: bỏ món hỏng hay món trùng, giữ món đúng, không ném lỗi (DOM 13.2).

**Kết luận lượt 2:** về nghiệp vụ, DOM không còn điều kiện nào với PR #96 và PR #109, ngoài điều kiện về luật dừng lên bản ở ý 2 (ghi vào hướng dẫn chạy câu SQL hoặc runbook v1.0.5).
