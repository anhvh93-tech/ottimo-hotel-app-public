# Danh sách lỗi – Round 5

- Tác giả: QA | Mở: 06/11/2026 – Round 5 (bảo trì v1.0.5), bước Kiểm thử.
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8; mẫu ghi theo mục 9.
- Mã: `BUG-R5-xxx`. Lỗi tồn các round trước nằm ở tệp của round đó, không chép lại:
  - `rounds/round-04/qa/bug-list.md`, `rounds/round-04/qa/bug-list-v1.0.4.md`;
  - `rounds/round-03/qa/bug-list.md`, `rounds/round-02/qa/bug-list.md`, `rounds/round-01/qa/bug-list.md`.
- Dữ liệu: chỉ DS-E (tài khoản `qa.*`, khách giả). Không bí mật, không dữ liệu khách thật.
- Bản production đang chạy: v1.0.4 = `6414be25` (Release 06/11 14:10).

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed (chờ QA) | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 | 0 |
| P2 | 1 | 1 (BUG-R5-001) | 0 | 0 |
| P3 | 0 | 0 | 0 | 0 |
| **Tổng** | **1** | **1** | **0** | **0** |

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R5-001 | P2 | Tham số `weekend_nights`: bộ kiểm khi lưu chỉ nhận số 1–7, còn giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]`. Lưu lại đúng giá trị đang có thì 422; lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần | BE (+ ARC chốt dạng, sửa erd) | Mới |

## 3. Chi tiết

### BUG-R5-001 – `weekend_nights`: bộ kiểm khi lưu và bộ tính giá dùng hai dạng khác nhau

- **Mức:** P2. Trạng thái: **Mới**.
  - Hiện chưa sai tiền. `weekend_uplift_pct` = 0 từ ngày chuyển S (INV quyết ESC-045 câu 1 = A, decision-log 01/11; BR mục 13 v0.5.1). Tham số này chỉ dùng cho mức tăng cuối tuần (`calendarRate`). Luật ở tối thiểu 2 đêm dùng `min_stay.arrivalWeekdays`, không đọc `weekend_nights`.
  - Vì vậy hiện tại lỗi là: OWN/MGR không lưu lại được tham số. Cách vòng: không sửa tham số này.
  - **Nâng P0** nếu có hai điều cùng lúc: `weekend_uplift_pct` > 0, và `weekend_nights` đã bị lưu dạng số. Khi đó đêm Thứ Sáu, Thứ Bảy không được cộng mức tăng: báo giá, đơn và giá ước tính web đều thấp hơn quy định, không có cảnh báo. Câu lỗi của Desk ở bước 2 dẫn người dùng tới đúng dạng số đó.
- **Vai chịu trách nhiệm:** BE (`parameter-rules.ts`). ARC chốt một dạng và sửa `erd.md` 9.1a nếu cần. DOM/BA đối chiếu từ điển tham số.
- **Môi trường:**
  - mã `main` @ `3717c257`, giống `6414be25` (production v1.0.4) ở các dòng nêu dưới;
  - có từ R2 Sprint 1 (`c312b797`, 16/10), nên có trong mọi bản v1.0.0–v1.0.4.
  - QA chạy cục bộ bằng `tsx` trên mã repo, không stack, không DB. Không ghi tham số trên staging hay production.
- **Liên quan:**
  - BR-103;
  - `erd.md` dòng 1281 (`weekend_nights`: int[] ISO weekday) và 1429 (tập con {1…7});
  - `product/docs/tham-so-quy-tac.json` mục `weekend_nights` (dạng "FRI = thứ Sáu…", ví dụ và khuyến nghị `["FRI","SAT"]`);
  - operationId `setParameter`; Desk `ParamDialog.tsx`;
  - nguồn phát hiện: UXD R5 `rounds/round-05/outputs/UXD/report.md` mục 4 R5; ORC đã kiểm mã.
- **Chỗ lệch trong mã:**
  - Bộ kiểm khi lưu, `product/services/api/src/modules/platform/internal/parameter-rules.ts` 180–187: `case 'weekend_nights'` đòi mảng số nguyên 1–7, không rỗng, không trùng. Sai thì `outOfRange({ allowed: [1, 2, 3, 4, 5, 6, 7] })` → 422 `PARAM_OUT_OF_RANGE`.
  - Giá trị đang chạy:
    - `product/services/api/src/admin/production-defaults.ts` dòng 200: `value: ['FRI', 'SAT']`, giá trị đầu của production;
    - `product/tests/fixtures/seed/ds-e.json` dòng 282: `["FRI", "SAT"]`.
  - Bộ tính giá:
    - `reservations/public/pricing.service.ts` 165 và `sales/internal/quote-pricing.ts` 305 đọc `g<Weekday[]>('weekend_nights')`;
    - `reservations/public/pricing.ts` 91 so `rules.weekendNights.includes(weekdayOf(date))`, với `weekdayOf` trả `'MON'…'SUN'`.
  - Test hiện có giữ cả hai dạng, nên không ca nào bắt được chỗ lệch:
    - `test/be-b-units.test.ts` 192–198 khẳng định bộ kiểm nhận `[5, 6]`;
    - `test/reservations-pricing.test.ts` 108 và `test/lp-v2-be-units.test.ts` 58 tính giá bằng giá trị seed dạng chữ.
  - Desk `ParamDialog.tsx` 75–89: tham số dạng mảng mở ô JSON, điền sẵn `JSON.stringify(param.value)` = `["FRI","SAT"]`. `app/problem.ts` 39 đưa `allowed` vào câu `error.PARAM_OUT_OF_RANGE`: "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: {allowed}."
- **Tiền điều kiện / dữ liệu:** DS-E (`weekend_nights` = `["FRI","SAT"]`). Tài khoản `qa.owner` hoặc `qa.mgr`; `edit_roles` của tham số = `{owner,manager}` (migration `0002`).
- **Các bước tái hiện** (stack local DS-E; QA chưa chạy trên stack, xem "Bằng chứng"):
  1. `qa.owner` mở Desk, màn Tham số, chọn `weekend_nights`, bấm Sửa. Ô JSON điền sẵn `["FRI","SAT"]`. Giữ nguyên giá trị, Hiệu lực từ = hôm nay, bấm Lưu.
  2. Kết quả: `setParameter` trả 422 `PARAM_OUT_OF_RANGE`, `allowed` = 1…7. Desk hiện "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: 1, 2, 3, 4, 5, 6, 7."
  3. Theo câu đó, nhập `[5,6]` (Thứ Sáu, Thứ Bảy theo ISO) rồi Lưu: 200, giá trị mới có hiệu lực.
  4. Chỉ làm trên stack local: đặt `weekend_uplift_pct` = 15. Báo giá một căn cho đêm Thứ Sáu 13/11/2026 (kênh Trực tiếp). Kết quả: giá đêm Thứ Sáu bằng giá ngày thường, không cộng 15 %.
- **Kết quả thực tế:** không lưu lại được giá trị đang chạy. Dạng mà bộ kiểm nhận (số) thì bộ tính giá không hiểu, và không có cảnh báo.
- **Kết quả mong đợi:**
  - Một dạng duy nhất cho `weekend_nights` ở mọi chỗ: bộ kiểm khi lưu, giá trị đầu của production, seed, bộ tính giá, `erd.md` 9.1a, từ điển tham số. Đề xuất dạng chữ `MON…SUN`, vì giá trị trên production, seed, bộ tính giá và từ điển đều đang dùng dạng này. ARC chốt.
  - Lưu lại đúng giá trị đang có (`["FRI","SAT"]`) thì được nhận.
  - Giá trị không phải tập con không rỗng, không trùng của `MON…SUN` thì 422, `allowed` liệt kê đúng 7 mã chữ.
  - Nếu ARC chọn dạng số: bộ tính giá phải đọc được dạng số, và cần một migration đổi giá trị đang lưu. Không được để hai dạng cùng tồn tại.
- **Ca hồi quy đề xuất** (BE viết, QA duyệt):
  - (a) unit `checkStructuredParameter('weekend_nights', ['FRI','SAT'])` → nhận; `[]`, `['FRI','FRI']`, `['FRX']` → 422;
  - (b) bỏ hoặc sửa ca `[5, 6]` ở `be-b-units.test.ts` 194 theo dạng ARC chốt;
  - (c) integration: `setParameter` lưu lại giá trị seed → 200, rồi `calculateQuote` cho đêm Thứ Sáu với `weekend_uplift_pct` = 15 trên DB thử → có mức tăng;
  - (d) nếu giữ dạng số: dạng số → bộ tính giá vẫn cộng mức tăng.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lệch trong mã", cùng ở `3717c257` và `6414be25`.
  - Chạy cục bộ 06/11 (QA): một script `tsx` trong scratchpad, ngoài repo, gọi thẳng hai hàm của repo `checkStructuredParameter` và `calendarRate`, dữ liệu giả, không DB. Kết quả:
    - `["FRI","SAT"]` → `rejected 422 PARAM_OUT_OF_RANGE`;
    - `[5,6]` → `accepted`;
    - mức tăng 15 % với `["FRI","SAT"]`: 13/11 (FRI) và 14/11 (SAT) = `weekend`, 16/11 (MON) = `none`;
    - mức tăng 15 % với `[5,6]`: cả ba đêm = `none`.
  - Bước 1–3 trên Desk suy ra từ mã `ParamDialog.tsx` và `problem.ts`. QA chưa chạy trên stack có Desk.
- **Việc cho ORC (chỉ đọc, không chặn):** kiểm giá trị đang hiệu lực trên production còn dạng chữ. Cách đơn giản: INV hoặc MGR mở màn Tham số trên Desk, xem `weekend_nights` (chỉ xem, không bấm Lưu). Nếu ra dạng số thì báo QA: lỗi chuyển sang tình huống nâng P0 ở trên khi `weekend_uplift_pct` > 0.
- **Ghi chú test lại:** chưa có.
