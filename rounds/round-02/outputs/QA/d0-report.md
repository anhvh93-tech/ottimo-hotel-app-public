# QA – Round 2, Đợt 0: oracle/seed theo BR v0.3.1, đóng BUG-R2-001…003, TC mới, ma trận test quyền, traceability

- Vai: QA | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Đầu vào: `product/docs/business-rules.md` **v0.3.1**, `rounds/round-02/outputs/DOM/w1-oracle-review.md` (mục 2–8), ESC-014 (đã quyết A + bộ đồ dùng thêm), `03-backlog/backlog.md` (R-C, 72 Must R2), OpenAPI 0.3.0-draft, decision-log BA 16/10 (sức chứa, việc HK bộ đồ dùng thêm)
- Mọi kết quả dưới đây là **chạy thật** trên máy này (Node 22.23.3, pnpm 9.15.4, Python 3).

## 1. Bảng trạng thái

| # | Việc ORC giao | Kết quả | Trạng thái |
|---|---|---|---|
| 1a | `br-examples.json` theo BR v0.3.1 + danh sách DOM | `source.version` **0.3.1**; sửa BR-107-01/02, 108-01, 305-01, 903-01, 110-01/02, 113-01, 204-01, 321-01, 403-01, 412-01…09 (ân hạn 12:30; 412-04 → có khách đến), 432-01 (`pushNotifyRoles`, bỏ `qaAssumption`), 433-02 (521.000), 605-02 (đi 25/11), 803-02 (202); bỏ BR-104 khỏi `notCovered`. **Thêm 30 dòng**: BR-104-01…05, BR-110-03…08, BR-113-02/03, BR-204-02, BR-305-02, BR-309-07, BR-412-10/11, BR-421-03, BR-527-02/03, BR-812-01…09. **92 dòng đổi nhãn** (91 dòng DOM liệt kê → `INV-0xx` + BR-901-01 chỉ đổi thứ tự nhãn). Tổng **226 dòng, 157 dòng tự tính lại, phủ 115/119 BR có ví dụ số** (4 BR `notCovered` có lý do) | **Xong – 0 lệch** |
| 1b | Seed DS-E / DS-0 | DS-E: `rooms[].baseOccupancy` (2/4/3) + `maxOccupancy` = định mức + 1 (3/5/4, ESC-014); bỏ `base_occupancy` chung; `late_grace_until` 12:30; `min_stay` bật (T6/T7/ngày đặc biệt, mọi kênh) + `min_stay_orphan_night_exception`; `weekend/special_uplift_channels` = all; `deposit_base`; `force_majeure_reschedule_months` 3; `no_deposit_max_lead_days` 2, `no_deposit_hold_until` 18:00; `foc_approval_push_roles`; `door_lock_vendor` TTLock; `business_entity_type` enterprise; `checkout_reminders` 12:00/12:31; tham số BR-812 + `consumableItems` (bàn chải, bộ đồ vệ sinh); **status 134 tham số theo cột Trạng thái BR mục 13** (INV-0xx / INV-TT / GD / NGANH / PL). DS-0: giá từng đêm theo lịch giá cho OTM-0151/0152/0155/0159, OTM-0152 phụ thu 400.000 + 1 bộ đồ dùng thêm, cọc 1.200.000 | **Xong – 0 lệch** |
| 1c | Validator | `validate-fixtures.mjs` thêm: nhãn `INV-0xx` (khớp ESC ở cột Nhãn BR + ESC "Đã quyết"), lịch giá BR-103/104 mọi kênh (không cộng dồn), BR-107 trên giá từng đêm, BR-110 định mức/sức chứa từng căn + trẻ < 6 không tính + OTA, BR-812 số bộ/hạn, BR-305 cọc không gồm phụ thu, BR-309 bất khả kháng, BR-421 gia hạn OTA theo lịch giá, BR-527 không cọc; seed: định mức/sức chứa từng căn, status tham số, giá từng đêm + cọc + phụ thu + bộ đồ dùng của đơn trực tiếp. Thử đột biến (5 lỗi cố ý) → bắt đủ, exit 1 | **Xong** |
| 2 | BUG-R2-001…003 → Fixed | Đã đối chiếu BR v0.3.1 từng lỗi, ghi bằng chứng ở `rounds/round-02/qa/bug-list.md` mục 3. Chưa Closed: chờ test unit BE đọc oracle mới | **Fixed** |
| 3a | 3 tham chiếu AC sai | TC-L5-033 (US-086/AC3), TC-L5-039 (US-119/AC5), TC-L8-006 (US-012/AC2) trỏ đúng AC nhưng AC đã **[Dời R3 – R-C]** và script cũ không đọc được AC có nhãn. Sửa: script đọc AC có nhãn/hậu tố (AC5a), tách AC dời khỏi số nghiệm thu R2; 3 TC gắn nhãn `[Dời R3 – R-C]` (giữ cho đầu R3). Thiếu nhãn → `--strict` fail | **Xong** – 0 tham chiếu sai |
| 3b | TC cho US-017 AC5a | TC-L2-076 (tạo đơn nhập tay, cờ, rack, lọc, thu không gắn kỳ), TC-L2-077 (chống trùng, dưới ngưỡng, `nightlyRates`, AC5 không có `manualLongStay`), TC-L2-078 (SAL/CTV 403) – theo OpenAPI `ManualLongStayInput` | **Xong** |
| 3c | TC cho `CAPACITY_BELOW_BOOKINGS` / `PARAM_OUT_OF_RANGE` (BUG-R1-007) | Sửa TC-NT-039 theo sức chứa mới (302: 4 → 3, OTM-0152 4 khách → 409). Thêm TC-NT-040 (biên: bằng số khách, trẻ < 6, chỉ đơn vượt trong `conflicts[]`, dưới định mức → 422), TC-NT-041 (`PARAM_OUT_OF_RANGE` đúng biên/ngoài biên, thân lỗi `min`/`max`/`allowed[]`, lần bị từ chối không tạo phiên bản), TC-NT-042 `[UNDECIDED]` (khoảng giá trị khóa nghiệp vụ – erd 9.1 chưa có) | **Xong** |
| 3d | Script ma trận test quyền | `product/tests/tools/gen_rbac_cases.py` → `product/tests/fixtures/rbac-cases.json` + `.csv`: **174 operation × 10 tài khoản DS-E + phiên khách = 1.914 ca** (2xx 935 · 403 688 · 401 291), 154 ca có `scope` (chạy thêm biến thể ngoài phạm vi, vd. `own` → 404), 275 ca thuộc operation R3 (đánh dấu `sprint`), 8 operation public/system bỏ qua; đối chiếu rbac-matrix: **0 operation lệch**. `--check` để CI chặn khi OpenAPI đổi mà chưa sinh lại | **Xong** |
| 3+ | TC theo BR v0.3.1 (phát sinh) | Sửa TC-NT-020, TC-L2-012, -019, -061, TC-L3-056, TC-L4-011, TC-L5-001, -002, -004, -006, -025, -031 (lịch giá mọi kênh, ân hạn 12:30, định mức từng căn, 5.205.000 / cọc 1.600.000 / hoa hồng 416.400); "(chờ ESC-00x)" → "(INV quyết ESC-00x)". Thêm TC-L2-079 (BR-113 ở tối thiểu – hồi quy BUG-R2-001), TC-L6-053…055 (BR-812 bộ đồ dùng thêm – `[BLOCKED]` chờ ARC thêm `HkTaskType`) | **Xong** |
| 4 | Traceability `--strict` exit 0, backlog 72 Must R2 | `gen_traceability.py` sửa đọc cột Round có ghi chú ("R2 (một phần…)") → **72/72 story Must R2**, **250/250 AC R2 có TC**, 250/250 chạy được ở R2, 3 AC dời R3 tách riêng, 0 tham chiếu sai, 0 `operationId` lạ, RBAC lệch 0/0, `x-rbac-field` thiếu 0. `--strict` nay gate thêm: tham chiếu AC sai, `operationId` lạ, TC trùng mã, AC R2 thiếu TC, TC trỏ AC dời thiếu nhãn. **Exit 0** | **Xong** |
| 5 | `pnpm -s test` xanh | `@ottimo/tests` (validator) **OK – 0 lỗi**; 8/9 task xanh. **`@ottimo/api` đỏ 8 test** (`config.test.ts`, `clock.test.ts`: `ConfigError … TRUST_PROXY is required when APP_ENV=production/staging`) – do `services/api/src/config.ts` vừa đổi lúc 13:41 hôm nay (việc BE/OPS đang làm), không liên quan file QA | **Chưa xanh toàn bộ** – không do QA |

## 2. Lệnh đã chạy và kết quả

| Lệnh (từ `product/` hoặc gốc repo) | Kết quả |
|---|---|
| `node tests/tools/validate-fixtures.mjs` | `br-examples: rows 226, recomputed 157, brWithExample 119, brCovered 115, notCovered 4, assumptions 40` · `seeds: rooms 10, parameters 134, channels 12, users 13, guests 17, reservations 17, blocks 1` · `smoke-manifest: 42 (S), implemented 1, pending 42` · **OK – 0 lỗi**, 1 cảnh báo cũ (HĐ OTM-0108 ngày kết thúc snapshot BL) |
| Thử đột biến validator (sửa giá đêm BR-107-01, `accepted` BR-110-07, nhãn INV-013, thêm trẻ 2010 vào OTM-0152, `extraGuestKits` 0) | 7 lỗi đúng chỗ, exit 1; khôi phục → 0 lỗi |
| `python3 product/tests/tools/gen_traceability.py --strict` | **exit 0**; 72/72 story, 250/250 AC, 393 TC (Cao 240 · TB 147 · Thấp 6), smoke 42, chuyển trạng thái 102/122 |
| `python3 product/tests/tools/gen_rbac_cases.py` rồi `--check` | 1.914 ca, rbac mismatch [] · `OK – rbac-cases up to date` |
| `pnpm exec prettier --check tests` | All matched files use Prettier code style (2 file `rbac-cases.*` sinh tự động đưa vào `.prettierignore`, so byte bằng `--check`) |
| `pnpm -s test` | 8/9 task xanh; `@ottimo/api#test` 8 failed (TRUST_PROXY – xem mục 1 dòng 5) |

## 3. Giả định
- [GIẢ ĐỊNH QA] **OTM-0152** (DS-0): cọc đã thu nâng 1.100.000 → 1.200.000 để đơn giữ `confirmed` khi lịch giá T6/T7 áp kênh Trực tiếp (tiền phòng 3.944.000). Ghi decision-log.
- [GIẢ ĐỊNH QA] Ngày/giờ tự điền ở dòng oracle mới khi BR không ghi (BR-110-04/06 số đêm 3; BR-309-07 giờ 08:00; BR-421-03 thứ Bảy 24/10/2026; BR-527-02/03 giờ đặt 10:00; BR-812-01/06/09 giờ xác nhận). Không đổi kết quả BR. Tổng 40 dòng có `qaAssumption`.
- BR-527-02 (đề nghị của DOM) tách thành **02** (3 ngày → không nhận) và **03** (2 ngày → nhận, quản lý duyệt, giữ đến 18:00).
- Mã hàng kho `ban_chai`, `bo_ve_sinh` và giá vốn/tồn đầu (6.000/18.000; 40/25) lấy từ ví dụ BR-812 – dữ liệu giả, chờ BA/ARC đặt mã thật.
- Dòng BR-110 mang cả `INV-004` (định mức, phụ thu) và `INV-014` (sức chứa) theo nhãn ghép của BR v0.3.1.
- Ma trận quyền: kỳ vọng chỉ là **cổng vai** (payload hợp lệ, tài nguyên trong phạm vi); `any_staff` = mọi vai nội bộ; tài khoản đa vai lấy hợp quyền.

## 4. Rủi ro / vướng mắc (đề nghị ORC chuyển)
1. **BE/OPS** – `@ottimo/api` đang đỏ 8 test do `config.ts` bắt buộc `TRUST_PROXY` ở production/staging mà test chưa cập nhật → CI đỏ nếu commit như hiện tại.
2. **ARC** – OpenAPI 0.3 chưa có `HkTaskType` `extra_guest_kit_prepare`/`collect`/`transfer` (BR-812; BA EP02 E02-05) → TC-L6-053…055 `[BLOCKED]`. Erd 9.1 chưa ghi **khoảng giá trị** cho khóa nghiệp vụ trong khi OpenAPI nói "khóa không bảo mật có khoảng giá trị cũng trả `PARAM_OUT_OF_RANGE`" → TC-NT-042 `[UNDECIDED]`.
3. **PO** – US-017 AC7 ghi "căn 302, 3 người lớn, 3 đêm … khớp ví dụ BR-110": từ BR v0.3 ví dụ này = **0 đ** (302 định mức 3). Đề nghị đổi AC sang căn 202 (450.000). Backlog chưa có AC cho **BR-812** (bộ đồ dùng thêm) – TC đang gắn `US-054/–`.
4. **DOM** – BR-421 vẫn `[GIẢ ĐỊNH]` dù ví dụ mới dùng lịch giá; không chặn.
5. Số AC R2 tăng 232 → 250 vì script trước bỏ sót AC có nhãn/hậu tố (AC5a, AC có `**[…]**`) và 4 story "R2 (một phần…)" – số mới mới đúng.

## 5. Việc chưa xong
- BUG-R2-001…003 Closed: sau khi BE có test unit đọc `br-examples.json`.
- `operationId` chưa có TC (plan QA (1) nêu 17; traceability mục 6 hiện liệt kê **40** do OpenAPI 0.3 thêm nhóm đơn, đóng ca, AC5a…) – chưa làm trong lượt này.
- Đưa `gen_rbac_cases.py --check` và `gen_traceability.py --strict` vào CI: cần OPS thêm bước Python vào job (hiện chỉ validator chạy trong `pnpm test`).
- Ca test quyền thật (chạy 1.914 ca) chờ BE có guard + loader seed (Sprint 1).

## 6. File tạo/sửa
- Tạo: `product/tests/tools/gen_rbac_cases.py`, `product/tests/fixtures/rbac-cases.json`, `product/tests/fixtures/rbac-cases.csv`, `rounds/round-02/outputs/QA/d0-report.md`
- Sửa: `product/tests/fixtures/br-examples.json`, `product/tests/fixtures/seed/ds-e.json`, `product/tests/fixtures/seed/ds-0.json`, `product/tests/tools/validate-fixtures.mjs`, `product/tests/tools/gen_traceability.py`, `product/tests/test-cases/r1-main-flows.md` (v0.3), `product/docs/qa/traceability.md` (sinh lại, 0.4), `product/tests/README.md`, `product/.prettierignore`, `rounds/round-02/qa/bug-list.md`, `01-decisions/decision-log.md` (5 dòng QA)
