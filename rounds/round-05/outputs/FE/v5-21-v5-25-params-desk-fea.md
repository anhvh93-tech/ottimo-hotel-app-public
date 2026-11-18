# FE – v1.0.5 Gói 2 phần Desk: V5-21 (tham số trên Desk) + câu Desk của V5-25 – nhánh `r5-fe-g2-params`

- Người viết: FE (làn Gói 2 Desk) | Round 5 – bước **Sản xuất** | 07/11/2026
- Nhánh: `r5-fe-g2-params` cắt từ `origin/main` @ `8fc46154`. Không đổi hợp đồng, không đổi máy chủ, không đổi mock máy chủ.
- Căn cứ: `rounds/round-05/plan.md` Gói 2 (V5-21, V5-25), mục 4a T20, mục 4b; chữ UXD `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.6 mục 2.1–2.4, 9.2, 9.4; bộ kiểm máy chủ `services/api/src/modules/platform/public/parameter-shapes.ts`, `internal/parameter-rules.ts` (#96, #109).
- Phần V5-23 (lượt sửa chữ sai sự thật phía Desk) đi ở PR thứ hai (nhánh `r5-fe-g2-text`), theo hướng dẫn ORC "V5-23 dài thì tách".

## 1. Đã làm gì

### 1.1 Tên tiếng Việt cho khóa còn hiện mã (copy 2.1, 2.2)
- `paramCatalog.ts` `KNOWN`: thêm 29 khóa của bảng 2.1, **nhóm `other`** (giữ tab "Khác" như từ điển, sổ tay) và đơn vị Desk theo cột "Đơn vị Desk": B1–B11 của hướng dẫn chuyển giá, `rounding.*` (5 khóa, đơn vị `vnd`), `early_checkin_tiers`, `late_checkout_tiers`, sàn–trần, `min_stay`, các khóa bảng giá còn lại.
- Tên lấy từ `params.k.<khóa>` (dấu chấm đổi thành `_`), mã khóa vẫn hiện nhỏ bên dưới như trước.
- Đơn vị mới `nights` (`params.unit_nights`): cột Giá trị ra "30 đêm". `rounding.*` ra "1.000 đ"; `rate_floor_pct` ra "70%".

### 1.2 Câu lỗi khi lưu tham số (copy 2.3)
- `app/problem.ts`: nhánh `PARAM_OUT_OF_RANGE` chọn câu theo 6 bước của 2.3 (có `allowed` cùng `min`/`max` → `_GROUPS`; chỉ `allowed` → `error.PARAM_OUT_OF_RANGE` chữ mới "không có trong danh sách cho phép"; `min` và `max` → `_MINMAX`; chỉ `max` → `_MAX`; chỉ `min` → `_MIN`; không có gì → `_SHAPE`). Không còn ca hiện nguyên `{min}`, `{max}`, không còn chữ "khoảng" cho tập giá trị.
- Định dạng: số theo ngôn ngữ (1.000, 100.000); tham số đơn vị `vnd` dùng tiền có "đ"; chữ và giờ giữ nguyên; `allowed` nối ", ".
- `ParamDialog.tsx` (lỗi ở máy khách, trước khi gửi): ô số gõ sai → `params.err_number`; JSON sai → `params.err_json`; ô giờ có chữ sai dạng → `params.err_time` (ô trống vẫn `common.required`). Trước đây hai ca đầu báo `field_error.not_in_list` ("Chọn một giá trị trong danh sách"), sai vì ô không có danh sách.

### 1.3 `ota_base_rate` (copy 2.4; plan R5 mục 6)
- Tên "Giá gốc riêng cho đơn OTA"; câu `params.ota_base_rate_note` hiện dưới tên ở H05 (kiểu `muted` như mã khóa) và trong hộp Sửa (`Alert tone="info" role="note"` trên ô giá trị, chỉ với khóa này).
- **Không** làm trình nhập theo nhóm căn (quyết định PO). Ô vẫn là ô JSON như mọi khóa có cấu trúc.
- Chữ dùng câu 2 vế của UXD (không phải câu ngắn trong plan), vì có dòng giá trị thì dòng đó thắng giá niêm yết (`pricing.service.ts` `groupBase ?? listPriceOn`).

### 1.4 Câu Desk của V5-25 (copy 9.2, 9.4)
- `paramProblemText(t, error, { key, unit }, locale)` (mới, `app/problem.ts`), ParamDialog gọi khi máy chủ trả 422 `PARAM_OUT_OF_RANGE`. Thứ tự xét:
  1. `cancel_policy_direct` = `[]` (`REQUIRED`, `field` = `value`) → `params.err_structured_whole` + `params.err_cancel_policy_empty`; `max_open_holds_per_user` thiếu vai (`REQUIRED`, `value.<vai>`) → `params.err_structured` + `params.err_hold_limit_roles`;
  2. `min_stay`: có `allowed` → câu chung 9.4 kèm chỗ sai ("Chỗ cần sửa: mục 1, channels. … Chọn một trong: all, direct, agent, ota. …"); `min` + `max` → `params.err_min_stay_nights`; chỉ `max` (quá 20 luật) → câu chung dạng cả giá trị + `_MAX`; không `extras` → `params.err_min_stay_shape`;
  3. `short_stay_max_nights` chỉ có `min` → `params.err_short_stay_below_min_stay` (kiểm chiều ngược, DOM 12.2);
  4. khóa có cấu trúc → `{where}` dựng từ `errors[0].field` (`mục {n}`, `mục {n}, {field}`, `{field}, mục {n}`, hoặc tên khóa con), `{detail}` = câu 2.3 hoặc `params.err_required` khi thiếu phần bắt buộc mà không có `extras`;
  5. khóa khác → 6 bước 2.3.
- `weekend_nights` (BUG-R5-001): máy chủ trả `allowed` = `MON…SUN`, Desk hiện "Giá trị này không có trong danh sách cho phép. Chọn một trong: MON, TUE, WED, THU, FRI, SAT, SUN." – không còn câu "Chọn một trong: 1, 2, …, 7" dẫn tới dạng sai (tiêu chí 1 của V5-25).
- 4 ví dụ của 9.4 cho ra đúng nguyên văn (test so chuỗi).

## 2. Chữ (Desk nội bộ; không có chữ cho khách)

| Mục copy | Khóa | Kiểu | Số khóa |
|---|---|---|---:|
| 2.1 | `params.k.*` (29 khóa) | Mới | 29 |
| 2.2 | `params.unit_nights` | Mới | 1 |
| 2.3 | `error.PARAM_OUT_OF_RANGE` | Sửa | 1 |
| 2.3 | `error.PARAM_OUT_OF_RANGE_MAX`, `_MIN`, `_SHAPE`, `_GROUPS`, `params.err_number`, `params.err_json`, `params.err_time` | Mới | 7 |
| 2.4 | `params.ota_base_rate_note` | Mới | 1 |
| 9.2 | `params.err_min_stay_shape`, `params.err_min_stay_nights`, `params.err_short_stay_below_min_stay` | Mới | 3 |
| 9.4 | `params.err_required`, `params.err_cancel_policy_empty`, `params.err_hold_limit_roles`, `params.err_structured`, `params.err_structured_whole`, `params.where_item`, `params.where_item_field`, `params.where_field_item` | Mới | 8 |

Tổng 50 (1 sửa, 49 mới), khớp mục 0 của copy cho V5-21 (39) và phần 9.2 + 9.4 của V5-25 (11). Chữ chép thẳng từ bảng copy bằng script (không gõ lại), gồm U+2011 ở "1‑month", "{min}‑night". Ghi chú mỗi khóa trong `gen_strings.py` có "v1.0.5 – V5-21" hoặc "v1.0.5 – V5-25".

## 3. Tệp
- Sửa: `product/apps/admin-web/src/app/problem.ts`, `product/apps/admin-web/src/pages/ParamDialog.tsx`, `product/apps/admin-web/src/pages/ParamsPage.tsx`, `product/apps/admin-web/src/pages/paramCatalog.ts`; `product/design/tools/gen_strings.py` + tệp sinh (`design/copy/strings-vi.json`, `strings-en.json`, `design/wireframes/assets/strings.js`, `design/tools/strings-tables.md`).
- Mới: `product/apps/admin-web/src/__tests__/v105-params-desk-fea.test.tsx`, báo cáo này.

## 4. Kiểm
- Vitest `v105-params-desk-fea` 18 ca:
  - 29 khóa có tên `params.k.*`, nhóm Khác; đơn vị đêm, tiền, %, ngày;
  - 6 bước 2.3 (tập chữ, tập số tiền, min–max tiền, chỉ max, chỉ min, rỗng, `ota_base_rate`), `problemView` không khóa cũng theo 6 bước;
  - `min_stay` 4 nhánh, `short_stay_max_nights` chiều ngược, 4 ví dụ 9.4 so nguyên văn, 3 ca `REQUIRED`, `{field}, mục {n}`, kênh tăng giá, bản EN;
  - màn H05 (mock): tên, mã nhỏ, "30 đêm", "1.000 đ", câu `ota_base_rate` ở dòng và hộp Sửa; JSON sai → `params.err_json`; ô số có chữ → `params.err_number`; máy chủ 422 `weekend_nights` → câu MON…SUN, ô `aria-invalid`; máy chủ 422 `min_stay` nights → câu `err_min_stay_nights`, không câu `_MINMAX`.
- Vitest admin-web toàn bộ: 1117/1118 ở lần chạy đầu – 1 ca của `v5-11-early-departure-night-fea` quá 5 s khi chạy song song (không đụng tệp nào của PR này); chạy lại riêng tệp đó 16/16 xanh.
- `tsc` admin-web, `eslint`, `prettier` các tệp đổi: sạch. `python3 -I design/tools/gen_strings.py` sinh lại không lệch.

## 5. Giả định (UXD xem)
- G1. Tập khóa dùng câu chung 9.4 gồm 11 khóa của copy **và** `damage_catalog`, `short_stay_commission_pct`: máy chủ kiểm hai khóa này cùng kiểu (trả `errors[0].field` dạng `value[i].<khóa>`), nên câu "Chỗ cần sửa…" đúng nghĩa. UXD không đồng ý thì bỏ hai khóa này khỏi `STRUCTURED_PARAM_KEYS`, chúng về câu 2.3.
- G2. `ota_base_rate` lỗi `_GROUPS`: `{min}`, `{max}` định dạng tiền (là giá đêm), dù đơn vị Desk của khóa là `none` theo bảng 2.1.
- G3. Câu `ota_base_rate` chỉ hiện khi khóa có dòng trong `listParameters`. Production thường không có dòng (khóa INV tự nhập), nên Desk không hiện dòng nào: đúng ý "Không cần nhập". Desk không tự dựng dòng trống (copy không có chữ cho dòng chưa có giá trị; `listParameters.missing[]` thuộc PR-M).
- G4. Số tối thiểu–tối đa của tham số `pct` in trần (không thêm "%"), theo 2.3 chỉ nói tiền có "đ".

## 6. Chưa làm
- **Copy 9.6 (tham số đã lưu sai dạng, 8 khóa `error.PARAMETER_MALFORMED*`, `params.setting.*`)**: máy chủ chưa có mã (`PARAMETER_MALFORMED` chưa có trong `services/api`, `openapi.yaml`); copy ghi "mã chờ ARC". Không thêm khóa để không hiện câu theo một mã chưa chốt. Làm khi ARC chốt mã và BE trả `parameterKey`.

## 7. Cần review
- UXD: chữ và chỗ hiện (mục 1, 2), giả định G1–G4.
- DOM: câu `min_stay`, `short_stay_max_nights`, `weekend_nights` đúng luật 8.4, 12.1–12.3.
- QA: BUG-R5-001 bước 2 (câu không còn "1, 2, …, 7"), BUG-R5-003 phần câu Desk; ca T-13-2, T-13-4 (câu `REQUIRED`).
