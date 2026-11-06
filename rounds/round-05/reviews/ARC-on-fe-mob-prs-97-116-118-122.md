# ARC review 4 PR giao diện – #122 (FE-A V5-14 giữ chỗ theo giá gõ), #118 (FE-A PR-D1 Desk), #116 (FE GW-01 khung thông tin trang khách), #97 (MOB V5-15 "Báo cần dọn")

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- Phạm vi: soát kỹ thuật. ARC kiểm 6 điểm:
  - đúng hợp đồng 0.3.13;
  - mock đúng hình dạng của máy chủ thật;
  - xử lý lỗi theo khuôn Problem;
  - idempotency và hàng đợi offline (#97);
  - không có chữ cứng ngoài `gen_strings`;
  - test bắt được lỗi (đột biến);
  - xung đột với các PR đang mở.
- Phần nhìn (bố cục, câu chữ, màu) là việc UXD. ARC chỉ ghi token hay mã màu sai, và dẫn chiếu thẻ UXD khi có lý do kỹ thuật đi kèm.

| PR | Nhánh | SHA đã review | HEAD lúc ghi | CI |
|---|---|---|---|---|
| #122 | `r5-fe-v5-14` | **`6dd07bf5`** (mã) | `44535cfe`: chỉ gộp `main` hai lần (`c783a59f`, `44535cfe`). Thay đổi của PR không đổi: `patch-id` giống hệt `6dd07bf5` (`830c515e`), 6 tệp, +663/−233 | Run `42264842764` @ `6dd07bf5` đỏ ở E2E: T14-6 bị bỏ qua vì gốc PR chưa có #103, cổng "UI cases ran" bắt được. Run `42271047936` @ `c783a59f` bị hủy, gitleaks đỏ (lý do ở mục 1.4). Run `42272284043` @ `44535cfe` đang chờ máy |
| #118 | `r5-fe-d1` | **`e96070a1`** | như trên | xanh (run `42261510181`). shellcheck chập chờn, ORC đã chạy lại |
| #116 | `r5-fe-gw-alert-brand` | **`9859d407`** | như trên | xanh (run `42260508235`) |
| #97 | `r5-mob-v5-15-clean` | **`d3081f93`** | như trên | xanh (run `42256943711`) trên gốc cũ. **Hiện xung đột với `main`** ở `strings.js` (mục 4.5) |

**Đã đọc:**
- `gh pr diff` của 4 PR, báo cáo FE (`v5-14-hold-typed-rates-fea.md`, `v5-40-d1-fea.md`, `gw-01-guest-alert-brand-feb.md`) và `rounds/round-05/outputs/MOB/report.md`;
- `openapi.yaml` 0.3.13:
  - `QuoteInput.nightlyRates`;
  - `createHoldFromQuote`;
  - Problem `RATE_OUT_OF_RANGE`;
  - `transitionRoomStatus`;
  - `ArrivalsDepartures.departuresDate`;
  - `Me`;
- ghi chú ARC 0.3.13: mục 1.3, 1.4, 1.17, 1.19, addendum 1f;
- mã máy chủ trên `main`:
  - `sales/internal/quote-pricing.ts` (`typedNightRates`, thứ tự trong `calculate`);
  - `sales/internal/quotes.controller.ts` (`rejectHoldPriceFields`);
  - `reservations/public/rate-out-of-range.ts`;
  - `auth` `mfa-roles.ts`, `me.service.ts`, `users.controller.ts` (`S2_ROLES`);
  - `dashboard.service.ts` (`departuresDateFor`);
  - `guest-portal.service.ts` dòng 552–566 và `guest-requests.service.ts` dòng 384–397;
  - `housekeeping/internal/rules.ts` và `housekeeping.service.ts` (`scopeRooms` dòng 176–189, `transitionRoomStatus` từ dòng 423);
- review đã có trên `main`: UXD (`UXD-on-prs-97-116-117-118-122.md`), SEC (`SEC-on-prs-111-118-122.md`), DOM (`DOM-on-prs-112-121-122.md`).

**Đã chạy.** Dùng worktree riêng trong scratchpad, cài gói bằng `pnpm install --offline`. Đã xóa worktree sau khi chạy xong.

| Lần chạy | Kết quả |
|---|---|
| `main` @ `1ab71583` + #122 | admin-web `tsc` sạch, 88 tệp / 995 ca đạt |
| `main` @ `1ab71583` + #118 + #122 | 89 tệp / 1004 ca đạt |
| `main` @ `93198b67` (đã có addendum 1f) + #122 @ `44535cfe` + #118 + #116 | admin-web `tsc` sạch, **89 tệp / 1005 ca đạt**; guest-web `tsc` sạch, **10 tệp / 100 ca đạt** |
| `main` @ `cd4b4c1f` + #97, gỡ `strings.js` bằng cách chạy lại `gen_strings.py` (3485 chuỗi + 8 mẫu) | mobile `tsc` sạch, **15 tệp / 181 ca đạt** |
| Đột biến của ARC | 24 đột biến trên 4 PR, kết quả ở từng mục |
| Gộp thử theo cặp trên `origin/main` @ `93198b67` | mục 5 |

## 0. Kết luận

| PR | Kết luận | Điều kiện gộp |
|---|---|---|
| **#122** V5-14 | **DUYỆT CÓ ĐIỀU KIỆN** @ `6dd07bf5` (HEAD `44535cfe` cùng thay đổi) | (1) CI trên HEAD mới xanh **và** job E2E ghi T14-6 *đạt*, không nằm trong danh sách bỏ qua. (2) Sửa FB-R5-UXD-FE-PR122-01 (Major, câu sàn–trần) theo UXD. Các thẻ Minor/Suggestion của ARC không chặn |
| **#118** PR-D1 | **DUYỆT** @ `e96070a1` (về kỹ thuật) | Không có điều kiện kỹ thuật. Câu chữ 2FA theo điều kiện của UXD (FB-R5-UXD-FE-PR118-01) |
| **#116** GW-01 | **DUYỆT** @ `9859d407` | Không. 116-01 (Minor) làm PR sau |
| **#97** V5-15 | **DUYỆT CÓ ĐIỀU KIỆN** @ `d3081f93` | (1) Sửa FB-R5-ARC-MOB-97-01 (Major) cùng lúc với FB-R5-UXD-MOB-PR97-01, có ca test chạm lần hai. (2) Gộp `main` và sinh lại chữ theo FB-R5-ARC-FE-MRG-01 (cập nhật ở mục 4.5), thứ tự #102 → #98 → #97. (3) CI xanh trên HEAD mới, kể cả E2E |

Số thẻ mới: **0 Blocker · 1 Major · 3 Minor · 4 Suggestion**.
- Major: MOB-97-01.
- Minor: FE-122-01, FE-116-01, MOB-97-02.
- Suggestion: FE-122-02, FE-122-03, FE-118-01, MOB-97-03.
- FB-R5-ARC-FE-MRG-01 (Minor, cũ) được cập nhật, vẫn Open.

ESC mới: không.

## 1. PR #122 – FE-A V5-14: giữ chỗ theo đúng giá đã gõ (T14-6)

### 1.1 Đối chiếu hợp đồng 0.3.13 và máy chủ #103

| Điểm | Mã PR | Đúng? |
|---|---|---|
| `QuoteInput.nightlyRates` phủ **mọi đêm**, mỗi phần tử có `edited` (1.17). Đêm không gõ lấy giá lịch của máy chủ, nhưng số vẫn phải > 0 | `quoteNights` (xem giá) và `typedNights` (giữ chỗ) dựng từ `rateList` của mọi đêm, với `edited: !!form.ratesEdited[date]`. Gửi chỉ khi đơn là Trực tiếp / CTV, có ô đã gõ và mọi ô > 0 | Đúng |
| Chỉ kênh direct/agent. `type` khác `short` → `NOT_ALLOWED` | `canHold = directLike && …`; `saveQuote` luôn gửi `type: 'short'` | Đúng |
| `createHoldFromQuote` có trường giá → 422 `NOT_ALLOWED` | Thân lệnh giữ chỗ chỉ có `holdHours`, `depositMethod` | Đúng |
| `RATE_OUT_OF_RANGE` là mã gốc, có `dates[]` và `min`/`max` của `dates[0]` (V5-22, `rateOutOfRange`) | `rateRangeErrors` đổi `dates[]` thành lỗi trên từng ô `nightlyRates[i].amountVnd`; không có `dates` thì rơi về ô `rates`. Bản xem cũ được giữ nguyên trên màn | Đúng hình dạng. Câu hiển thị sai định dạng: xem UXD PR122-01 |
| Bỏ khóa v1.0.4 (giữ chỗ không cho gõ giá) và vòng xóa lỗi giá PR75-02 | Đã bỏ. Ô giá `readOnly` khi `ratesLocked` hoặc đang chạy lệnh | Đúng |
| Không lặp vòng render | `calcInput` là `JSON.stringify(…)`, có `rates: quoteNights` | Đúng |
| Chữ | Mọi câu qua `t()`. Không có chữ cứng mới | Đúng. Khóa `booking.error.typed_rate_locked` không còn dùng: xem UXD PR122-04 |

### 1.2 Đột biến (tệp `v5-14-hold-typed-rates-fea.test.tsx`, 7 ca)

| Đột biến | Kết quả |
|---|---|
| M1 `saveQuote` không gửi `nightlyRates` | 3 đỏ |
| M2 `edited` luôn `true` | 2 đỏ |
| M4 xem giá không gửi giá gõ | 3 đỏ |
| M5 bỏ chặn số 0 trong `hold()` | **sống** (thẻ 122-02) |
| M7 lỗi sàn–trần không gắn vào từng đêm | 1 đỏ |
| M8 giữ lại lỗi giá cũ sau khi sửa | 1 đỏ |
| M9 ô giá vẫn gõ được khi đang chạy lệnh | 1 đỏ |
| M10 trả lại khóa v1.0.4 | 5 đỏ |

Test có giá trị thật: 7/8 đột biến bị bắt.

E2E `tests/e2e/ui-clock/v5-14-hold-typed-rate.r5.spec.ts` tự bỏ qua khi máy chủ chưa trả `calendarRateVnd` theo giá gõ. Nhờ cổng "UI cases ran", ca bỏ qua làm job đỏ (run `42264842764`), nên không thể xanh âm thầm. Vì vậy điều kiện (1) đòi T14-6 *đạt* trên gốc có #103.

### 1.3 Ghi chú kỹ thuật cho thẻ UXD

- **FB-R5-UXD-FE-PR122-03 (cọc cũ).** ARC xác nhận nguyên nhân: `priceWaiting = !!liveKey && calcFor !== liveKey`. `previewKey` chỉ gồm phòng, kênh, ngày đến và số đêm, không có giá gõ.
  - Cách sửa gọn: ghi `calcFor` bằng chính chuỗi `calcInput` (đã có `rates: quoteNights`).
  - Khi bản xem giá gõ trả 422, đặt `calcFor = null` để "Cọc cần thu" hiện "–".
  - Máy chủ vẫn tự tính cọc và chặn giá ngoài khoảng, nên không sai tiền. Mức Minor của UXD là đúng.
- **FB-R5-UXD-FE-PR122-01 (câu sàn–trần).** `min`/`max` phải qua `money()`. Tên nhóm phải lấy từ phòng đang chọn, không để trống.

### 1.4 CI

- **gitleaks đỏ ở run `42271047936` không do PR.**
  - Job quét toàn bộ lịch sử (`fetch-depth: 0`, `detect` mặc định quét mọi nhánh), nên gặp commit `ae4a8358` của #123 (khóa idempotency giả).
  - Run được tạo lúc 18:28:39Z. Allowlist của SEC (`ad70dc21`) được commit lúc 18:29:01Z và chưa có trên gốc gộp.
  - Run `42271766644` (`r5-a1b`, tạo 18:33Z) có gitleaks xanh.
  - HEAD `44535cfe` đã gộp `main` có allowlist, nên gitleaks dự kiến xanh.
- shellcheck đỏ cùng run là test `postgres-log-terse` chập chờn đã biết (FB-R5-ARC-OPS-11).

## 2. PR #118 – FE-A PR-D1 Desk: FDL bắt buộc 2FA trong mock (V5-40), tiêu đề "Khách đi" theo `departuresDate`

| Điểm | Mã PR | Máy chủ / hợp đồng | Đúng? |
|---|---|---|---|
| Danh sách vai bắt buộc 2FA | `MFA_ROLES = ['owner','manager','front_desk_lead']`. `mfaRequired` xét vai ở **mọi** cơ sở | `mfa-roles.ts` `MFA_REQUIRED_ROLES`; SR-AUTH-06 | Đúng |
| `securityEmailMissing` | `PRIVILEGED_ROLES = ['owner','manager']` | `me.service.ts` dòng 159 (`privileged`) | Đúng |
| Bước xác thực lại S2 khi gán vai | `setUserRoles` dùng `PRIVILEGED_ROLES` | `users.controller.ts` dòng 80, `S2_ROLES` | Đúng, nhưng chưa có test ghim (thẻ 118-01) |
| Tiêu đề Khách đi | `depDate` chỉ hiện khi `departuresDate` có và khác `date`, dạng ` · <thứ, ngày>` | 1.19; `dashboard.service.ts` `departuresDateFor` | Đúng |
| Mock dashboard | `departuresDate: T` | schema `ArrivalsDepartures` | Đúng |

Đột biến (tệp `v5-40-d1-fea.test.tsx`, 9 ca):

| Đột biến | Kết quả |
|---|---|
| `MFA_ROLES` bỏ FDL | 3 đỏ |
| `securityEmailMissing` theo danh sách 2FA | 1 đỏ |
| Tiêu đề bỏ qua `departuresDate` | 1 đỏ |
| Tiêu đề luôn có ngày | 1 đỏ |
| S2 dùng `MFA_ROLES` | **sống** (thẻ 118-01) |

- `new Date(`${departuresDate}T12:00:00+07:00`)` dùng giờ trưa cố định +07:00 rồi định dạng theo `tz` của cơ sở. Cách này an toàn cho mọi múi giờ trong khoảng ±11 giờ. Không cần thẻ.
- Chữ: 3 câu 2FA (`mfa.enroll_required`, `mfa.required_note`, `mfa.nudge`) vẫn chỉ nói chủ / quản lý. Phần này thuộc FB-R5-UXD-FE-PR118-01. Addendum 1f (`9b5ef614`) đã thêm FDL vào câu trong hợp đồng, nên chữ trên Desk phải theo.
- SEC đã duyệt #118 (`SEC-on-prs-111-118-122.md`).

## 3. PR #116 – FE GW-01: khung thông tin trang khách theo bảng màu, hình dạng mock theo ARC 107-01

- **Màu:** `.guest-app .alert.info { background: var(--cream); border-color: var(--sage); color: var(--ink); }`.
  - Chỉ dùng token, không có mã hex.
  - Cả ba token có trong bảng 80/15/5.
  - E2E `gw-01-guest-alert-brand.r5.spec.ts` kiểm `getComputedStyle` và axe.
- **Mock khớp máy chủ:**
  - `arrivalNote` (sau `trim`) dài hơn 300 ký tự → `VALIDATION_FAILED` + `TOO_LONG`;
  - có số thẻ → mã gốc `CARD_NUMBER_DETECTED` kèm `errors`;
  - có số giấy tờ → `VALIDATION_FAILED` + `ID_NUMBER_DETECTED`;
  - ghi chú yêu cầu có số thẻ → mã gốc `CARD_NUMBER_DETECTED`.
  - Tất cả đúng `guest-portal.service.ts` 552–566 và `guest-requests.service.ts` 384–397.
  - Còn thiếu: ghi chú yêu cầu dài hơn 500 ký tự → `TOO_LONG`.
- **Đột biến:**
  - đổi kịch bản lỗi thẻ thành `VALIDATION_FAILED` → 1 đỏ;
  - đổi hình dạng lỗi thẻ ở ghi chú yêu cầu, ở `arrivalNote`, và bỏ `TOO_LONG` ở `arrivalNote` → **cả ba sống**.
  - Lý do: FE đọc được cả hai hình dạng, và ô nhập không cho gõ quá 300 ký tự. Xem thẻ 116-01.
- **Ảnh:** 4 ảnh PNG trong `rounds/round-05/outputs/FE/screenshots/` chụp mock, phòng 301, không có dữ liệu khách. ARC đã xem bản `vi-after`.

## 4. PR #97 – MOB V5-15: nút "Báo cần dọn" (R8 `needs_cleaning`, hàng đợi offline)

### 4.1 Đối chiếu hợp đồng 1.4 và ADR-005 mục 3

| Điểm | Mã PR | Đúng? |
|---|---|---|
| Sự kiện `needs_cleaning`, R8 OC → OD, chỉ khi máy chủ liệt kê trong `allowedEvents` | `ROOM_STEP.needs_cleaning` (đích `OD`, `targets: ['OD']`); nút hiện khi `writable && events.includes('needs_cleaning')` | Đúng |
| `Idempotency-Key` và `performedAt` chốt lúc chạm; 10 giây hoàn tác; hàng đợi offline | Dùng lại đường `roomStatus` chung. Ca "answer lost" xác nhận gửi lại cùng khóa | Đúng |
| 409 `INVALID_TRANSITION` có `currentState` | `OD` → "Đã áp dụng" (bỏ, không báo lỗi); trạng thái khác → "Cần xem lại", không bao giờ bỏ | Đúng |
| HK chỉ trong phạm vi T; MT không bao giờ | UI theo `allowedEvents`. Mock trả `[]` cho MT (dòng 534); `inHkScope` lọc HK | Đúng về UI. Mock lệch máy chủ: thẻ 97-02 |
| Không trùng lệnh | `waitingRoomEvent` chặn lần chạm thứ hai cùng phòng, cùng sự kiện, cùng `expectedFrom` khi màn chưa vẽ lại | Đúng cho cùng sự kiện. Không chặn lần chạm rơi vào nút kế tiếp: thẻ 97-01 |
| Chữ | `hk.action.needs_cleaning` qua `t()`; không có chữ cứng | Đúng |

### 4.2 Đột biến (tệp `v105-needs-cleaning.test.tsx`, 15 ca)

| Đột biến | Kết quả |
|---|---|
| M1 bỏ `waitingRoomEvent` | 1 đỏ |
| M2 `targets: []` | 1 đỏ |
| M3 bỏ dòng overlay `OD → start_cleaning` | 2 đỏ |
| M4 `inHkScope` luôn `true` | 1 đỏ |
| M5 bỏ kiểm phạm vi trong handler mock | **sống** |
| M6 R8a luôn tạo việc dọn mới | **sống** |
| M7 bỏ `writable` ở nút | **sống** (mock đã bỏ sự kiện cho MT) |

M5–M7 dẫn tới thẻ 97-02.

### 4.3 Thử lần chạm thứ hai (ca thử tạm của ARC, đã xóa)

Các bước:
1. FDL mở căn 301 (OC).
2. `fireEvent.click` nút "Báo cần dọn".
3. Chờ 150 ms.

Kết quả:
- Ô nút chính đã là "Bắt đầu dọn" (`btn pri xl block`, cùng chỗ). Lý do: overlay cho `OD` đang chờ trả `start_cleaning`.
- Chạm lần nữa → hai lệnh được gửi: `["needs_cleaning","start_cleaning"]`. Căn 301 thành **CL** trong khi khách đang ở.

### 4.4 Thẻ UXD liên quan

- **FB-R5-UXD-MOB-PR97-01 (Major).** UXD đề xuất bỏ nút khỏi ô chính. ARC đồng ý. Cách sửa này cũng giải được 97-01: khi nút ở `hk-stack`, chạm lần hai không còn rơi vào "Bắt đầu dọn".
- PR97-02 và PR97-03 theo UXD.

### 4.5 Xung đột chữ (cập nhật FB-R5-ARC-FE-MRG-01)

Từ khi #111 gộp (`cd4b4c1f`):
- **#97, #98 và #102, mỗi PR tự xung đột với `main`** ở `product/design/wireframes/assets/strings.js` (tệp sinh, một dòng).
- Theo cặp:
  - #97 × #102 xung đột ở `gen_strings.py`, `strings-tables.md`, `strings.js`;
  - #97 × #98 và #97 × #122 (đã gộp `main`) chỉ xung đột ở `strings.js`.

Cách gỡ ARC đã thử:
1. Lấy `strings.js` của `main`.
2. Chạy lại `python3 product/design/tools/gen_strings.py`.
3. Kết quả: 3485 chuỗi + 8 mẫu, mobile 181/181 đạt.

PR gộp sau trong #102 / #97 giữ **một** dòng `hk.action.needs_cleaning`, ghi chú gộp theo UXD 4.5.

## 5. Xung đột với PR đang mở (gộp thử `git merge-tree` trên `origin/main` @ `93198b67`)

- #122, #118, #116 gộp sạch vào `main`. Theo cặp, chúng cũng sạch với nhau và với #121 (`r5-c1`), #119 (`r5-v09-reference`), #98, #102.
- #97: xem 4.5. Ngoài các tệp chữ sinh, #97 không chạm tệp nào của PR khác.
- #118 và #121 cùng sửa `admin-web/src/mocks/handlers.ts` nhưng gộp sạch.

## 6. Thẻ

### FB-R5-ARC-FE-122-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/mocks/reservations.ts`, `calculate()` dòng 597–622 và handler `create-hold` dòng 1911–1934 (@ `6dd07bf5`)
- Vấn đề:
  - Mock kiểm theo thứ tự 403 → **kênh** → thân `nightlyRates` (DATE_INVALID → AMOUNT_NOT_POSITIVE → REQUIRED) → RATE_OUT_OF_RANGE.
  - Máy chủ (`quote-pricing.ts`, `calculate`) kiểm `type` ≠ `short` → `NOT_ALLOWED`, rồi số đêm, rồi **thân lệnh** (`typedNightRates`), rồi kênh. Hợp đồng 1.17 viết "thân lệnh → kênh".
  - Mock không có nhánh `type` ≠ `short` → `NOT_ALLOWED`.
  - `create-hold`: mock kiểm trường giá **sau** 404, `QUOTE_EXPIRED`, `HOLD_NOT_ALLOWED_TODAY`, `PHONE_REQUIRED`. Máy chủ chặn trường giá ngay ở controller (`rejectHoldPriceFields`), trước mọi kiểm khác.
- Vì sao quan trọng: test FE chạy trên mock. Khi một lệnh sai hai chỗ, mock và máy chủ trả mã khác nhau, nên một ca đạt trên mock có thể sai trên staging. Ví dụ: ngày ngoài khoảng cộng kênh OTA. Hiện UI chỉ gửi kênh Trực tiếp / CTV, nên chưa gây lỗi thấy được.
- Đề xuất sửa:
  - Đổi thứ tự trong mock theo máy chủ: `type` → thân → kênh.
  - Thêm `NOT_ALLOWED` cho `type` ≠ `short`.
  - Đưa kiểm trường giá của `create-hold` lên ngay sau `guard`.
  - Thêm một ca fetch thẳng vào mock: ngày sai cộng kênh OTA → `DATE_INVALID`.
  - Làm trong PR sau của FE-A, không chặn #122.
- Trạng thái: Open

### FB-R5-ARC-FE-122-02
- Mức độ: Suggestion
- Vị trí: `BookingDialog.tsx`, `hold()` dòng 852–853 (@ `6dd07bf5`)
- Vấn đề: dòng `if (typedNights?.some((n) => !(n.amountVnd > 0)) && !v.rates) v.rates = …` không bao giờ đổi kết quả, vì `validate()` đã báo ô trống hoặc bằng 0. Đột biến M5 (bỏ dòng này) sống.
- Vì sao quan trọng: mã thừa làm người đọc tưởng có đường khác, và không có test giữ nó.
- Đề xuất sửa: bỏ dòng này. Hoặc, nếu FE muốn giữ làm lưới an toàn, thêm ca đi qua đúng đường đó, ví dụ bản xem giá chưa về mà ô không gõ đang trống.
- Trạng thái: Open

### FB-R5-ARC-FE-122-03
- Mức độ: Suggestion
- Vị trí: `BookingDialog.tsx`, `hold()` dòng 874 và 879 (@ `6dd07bf5`). Đã có từ v1.0.4, PR không tạo ra
- Vấn đề:
  - `saveQuote` và `createHoldFromQuote` nhận `newIdempotencyKey()` mỗi lần bấm và không đi qua `write.run`.
  - Nút "Tạo đơn" thì giữ khóa theo chữ ký thân lệnh (`idem.current`) và tự gửi lại khi gặp `CONCURRENT_UPDATE` / `SERVICE_UNAVAILABLE`.
- Vì sao quan trọng: mạng yếu, mất câu trả lời, lễ tân bấm lại thì máy chủ tạo báo giá thứ hai và thử giữ chỗ lần hai. Lần hai thường bị chặn vì phòng đã giữ, nhưng lễ tân thấy lỗi khó hiểu.
- Đề xuất sửa: giữ khóa theo chữ ký thân lệnh như `submit()`, và gọi qua `write.run`. Làm ở v1.0.6.
- Trạng thái: Open

### FB-R5-ARC-FE-118-01
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/__tests__/v5-40-d1-fea.test.tsx`; mock `handlers.ts` dòng 1320 (@ `e96070a1`)
- Vấn đề: đổi điều kiện S2 của `setUserRoles` từ `PRIVILEGED_ROLES` sang `MFA_ROLES` thì không ca nào đỏ.
- Vì sao quan trọng: SR-AUTH-06 cố ý tách hai danh sách. FDL phải bật 2FA, nhưng gán vai FDL không cần bước S2 (`S2_ROLES` chỉ owner/manager). Gộp nhầm hai danh sách là lỗi dễ xảy ra khi sửa sau này.
- Đề xuất sửa: thêm một ca: chủ gán vai FDL cho người dùng thì không có hộp S2; gán vai quản lý thì có.
- Trạng thái: Open

### FB-R5-ARC-FE-116-01
- Mức độ: Minor
- Vị trí: `product/apps/guest-web/src/mocks/handlers.ts` dòng 322–336 và 543–552 (@ `9859d407`); test guest-web
- Vấn đề:
  - Ba hình dạng lỗi vừa sửa theo ARC 107-01 không có test ghim: `arrivalNote` có số thẻ (mã gốc), `arrivalNote` quá 300 (`TOO_LONG`), ghi chú yêu cầu có số thẻ (mã gốc). Đổi bất kỳ cái nào, test vẫn xanh, vì FE đọc được cả hai dạng.
  - Mock còn thiếu ghi chú yêu cầu quá 500 → `VALIDATION_FAILED` + `TOO_LONG` (`guest-requests.service.ts` 384–397).
- Vì sao quan trọng: mục đích của 107-01 là mock trả đúng như máy chủ. Không có test thì lần sửa mock sau có thể làm lệch lại mà không ai biết. FE cũng sẽ mất dịp phát hiện khi máy chủ đổi.
- Đề xuất sửa: thêm 4 ca fetch thẳng vào mock (không qua UI), kiểm `code` gốc và `errors[0].code`: hai ca thẻ, `TOO_LONG` của `arrivalNote`, và `TOO_LONG` của ghi chú yêu cầu sau khi bổ sung vào mock. Làm ở PR sau của FE-B, không chặn #116.
- Trạng thái: Open

### FB-R5-ARC-MOB-97-01
- Mức độ: Major (điều kiện gộp #97, cùng FB-R5-UXD-MOB-PR97-01)
- Vị trí: `product/apps/mobile/src/pages/RoomPage.tsx` dòng 92–108 (ô `main`); `app/overlay.ts` dòng 49; `queue/queue.ts` `waitingRoomEvent` (@ `d3081f93`)
- Vấn đề:
  - "Báo cần dọn" nằm ở ô nút chính. Ngay khi lệnh vào hàng chờ, overlay `OD` trả `start_cleaning`, nên cùng ô đó vẽ lại thành "Bắt đầu dọn".
  - `waitingRoomEvent` chỉ chặn lần chạm cùng sự kiện, không chặn lần chạm rơi vào nút kế tiếp.
  - Ca thử của ARC (mục 4.3): chạm lần hai sau 150 ms gửi `needs_cleaning` rồi `start_cleaning`, căn có khách thành CL.
- Vì sao quan trọng:
  - Chạm đúp chậm hay chạm hai lần do máy chậm là chuyện thường ở buồng phòng.
  - Kết quả là căn có khách bị ghi "đang dọn", và việc dọn chuyển sang đang làm. Buồng phòng có thể gõ cửa khách, và lễ tân thấy sai trạng thái.
  - Còn sửa được trong 10 giây hoàn tác, nhưng chỉ khi người dùng nhận ra.
- Đề xuất sửa:
  - Làm theo UXD PR97-01: bỏ nhánh `needs_cleaning` khỏi `main`, đặt nút phụ trong `hk-stack`. Căn OC không có nút ở chân màn.
  - Thêm ca test: chạm "Báo cần dọn", chờ 150 ms, chạm lại đúng chỗ đó → chỉ có một lệnh `needs_cleaning`, không có `start_cleaning`.
  - Nếu sau khi dời, "Báo sự cố căn này" trượt lên đúng chỗ cũ, lần chạm thừa chỉ mở trang báo sự cố, không ghi gì. Chấp nhận được.
- Trạng thái: Open

### FB-R5-ARC-MOB-97-02
- Mức độ: Minor
- Vị trí: `product/apps/mobile/src/mocks/handlers.ts` `inHkScope` dòng 498–501, handler `transitionRoomStatus` dòng 730–760; `RoomPage.tsx` dòng 104 (@ `d3081f93`)
- Vấn đề:
  - Mock lệch máy chủ ở ba chỗ.
    - **Phạm vi T bỏ qua người được giao.** Máy chủ (`scopeRooms`) chỉ tính việc chưa giao hoặc giao cho chính người gọi.
    - **Mock chỉ kiểm phạm vi cho `needs_cleaning`.** Máy chủ kiểm phạm vi cho mọi sự kiện, ngay sau 404 phòng.
    - **Thứ tự kiểm khác.** Mock kiểm `performedAt` trước 404 / phạm vi; máy chủ làm ngược lại.
  - Ba đột biến sống:
    - M5: bỏ kiểm phạm vi trong handler;
    - M6: R8a luôn tạo việc dọn mới;
    - M7: bỏ `writable` ở nút.
- Vì sao quan trọng: hàng đợi offline dựa vào 404 / 409 của máy chủ để quyết định "Cần xem lại". Mock lệch thì ca HK ngoài phạm vi, hoặc ca việc đã giao cho người khác, chỉ lộ ra trên staging.
- Đề xuất sửa:
  - `inHkScope` theo `scopeRooms`: việc không hủy, chưa giao hoặc giao cho người gọi.
  - Kiểm phạm vi cho mọi sự kiện; thứ tự 404 → phạm vi → `performedAt` → `expectedFrom`.
  - Thêm 3 ca:
    - fetch thẳng `needs_cleaning` của HK ngoài phạm vi → 404;
    - R8a khi đã có `stayover_clean` đang mở → không thêm việc;
    - máy chủ (qua `mockControl`) trả `needs_cleaning` cho phiên chỉ đọc → không có nút.
  - Làm trong #97 nếu MOB kịp, không thì PR sau trong v1.0.5.
- Trạng thái: Open

### FB-R5-ARC-MOB-97-03
- Mức độ: Suggestion
- Vị trí: `product/apps/mobile/src/app/actions.ts` dòng 56 (`targets: ['OD']`)
- Vấn đề: 409 với `currentState = CL` (người khác đã bắt đầu dọn trước khi lệnh trên máy gửi được) hiện vào "Cần xem lại".
- Vì sao quan trọng: ý của "Báo cần dọn" là căn được dọn. CL nghĩa là việc đó đang diễn ra. Báo "Cần xem lại" là đúng an toàn, nhưng thêm một việc cho người dùng.
- Đề xuất sửa: DOM xác nhận CL có tính là "đã áp dụng" không. Nếu có, `targets: ['OD', 'CL']` ở v1.0.6. v1.0.5 giữ như hiện tại.
- Trạng thái: Open

### FB-R5-ARC-FE-MRG-01 (cũ, cập nhật – vẫn Open)
- Bổ sung vấn đề: sau khi #111 gộp (`cd4b4c1f`), #97, #98, #102 **mỗi PR tự xung đột với `main`** ở `strings.js`, không chỉ xung đột với nhau.
- Bổ sung đề xuất:
  - Mỗi PR gộp `main`, lấy `strings.js` của `main`, rồi chạy `python3 product/design/tools/gen_strings.py`. Không sửa tay tệp sinh.
  - Thứ tự gộp giữ #102 → #98 → #97.
  - PR gộp sau giữ một dòng `hk.action.needs_cleaning`.
  - ARC đã thử với #97: sạch, 181/181 đạt.

## 7. Điểm làm tốt

- **#122:** bỏ khóa v1.0.4 gọn. Lỗi sàn–trần gắn đúng từng đêm theo `dates[]` của V5-22. Bản xem cũ được giữ khi bị từ chối. Test có 7/8 đột biến bị bắt, và E2E không thể xanh âm thầm nhờ cổng "UI cases ran".
- **#118:** tách hai danh sách vai đúng như máy chủ (2FA khác S2 / email bảo mật). Tiêu đề Khách đi dùng đúng `departuresDate` 1.19, chỉ thêm ngày khi khác ngày kinh doanh.
- **#116:** chỉ dùng token, không có mã hex. Mock theo đúng code máy chủ. E2E kiểm màu bằng `getComputedStyle` và axe.
- **#97:** đi chung đường hàng đợi với các bước dọn khác, không tạo đường riêng. Có ca mất câu trả lời (cùng khóa), ca 409 hai nhánh, ca offline và ca chạm hai lần cùng nhịp.

## 8. Giả định

- G1: run `42272284043` @ `44535cfe` sẽ có gitleaks xanh vì allowlist `ad70dc21` đã ở gốc gộp. Nếu vẫn đỏ, ORC chuyển SEC xem, không chặn bằng thẻ ARC.
- G2: kết luận #122 tính trên thay đổi `6dd07bf5` (`patch-id` `830c515e`). Nếu FE đẩy thêm commit có mã, cần review lại phần đó.
- G3: lần chạm thứ hai trong 4.3 dùng `fireEvent` trên jsdom. Trên máy thật, khoảng giữa hai lần chạm còn ngắn hơn, vì React vẽ lại sau khoảng một khung hình. Kết luận không đổi.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review 4 PR giao diện** (rounds/round-05/reviews/ARC-on-fe-mob-prs-97-116-118-122.md): **#122 FE-A V5-14 giữ chỗ theo giá gõ @ 6dd07bf5 (HEAD 44535cfe chỉ gộp main, cùng patch-id): DUYỆT CÓ ĐIỀU KIỆN** – CI xanh trên HEAD mới với T14-6 đạt (không bỏ qua; gitleaks đỏ ở run 42271047936 do run tạo trước allowlist ad70dc21), sửa UXD PR122-01; đúng hợp đồng 1.17 (mọi đêm có edited, giữ chỗ không mang giá, RATE_OUT_OF_RANGE theo từng đêm), đột biến 7/8 bị bắt. **#118 FE-A PR-D1 @ e96070a1: DUYỆT** (MFA_ROLES có FDL, email bảo mật và S2 vẫn chủ/quản lý, tiêu đề Khách đi theo departuresDate 1.19); câu 2FA theo UXD PR118-01. **#116 FE GW-01 @ 9859d407: DUYỆT** (chỉ token, mock đúng guest-portal/guest-requests). **#97 MOB V5-15 @ d3081f93: DUYỆT CÓ ĐIỀU KIỆN** – sửa MOB-97-01 cùng UXD PR97-01 (chạm lần hai sau 150 ms rơi vào "Bắt đầu dọn", căn có khách thành CL; dời nút khỏi ô chính, thêm ca test), gộp main và sinh lại chữ (MRG-01: sau #111, #97/#98/#102 mỗi PR xung đột strings.js với main; thứ tự #102 → #98 → #97), CI xanh. Gộp thử main 93198b67 + #122 + #118 + #116: admin-web 1005/1005, guest-web 100/100; main + #97: mobile 181/181. Thẻ: MOB-97-01 Major; FE-122-01, FE-116-01, MOB-97-02 Minor; FE-122-02, FE-122-03, FE-118-01, MOB-97-03 Suggestion; MRG-01 cập nhật. | ARC | Không ESC |`
