# BE – Review hợp đồng OpenAPI 0.3.13-draft (ARC, PR #94)

Round 5 · bước **Review** · BE · 06/11/2026

Đối tượng:
- PR #94, nhánh `r5-contract-0313`, commit `f4c40d9b`: `product/docs/api/openapi.yaml` (0.3.12 → 0.3.13-draft), mã sinh (`openapi-meta.ts`, `openapi-schemas.ts`, `api-client`), `rbac-cases.*`, `rounds/round-05/outputs/ARC/contract-0.3.13.md`.
- Phạm vi ORC giao: V5-10, 13, 14, 15, 16 (phần lọc), 18, 1A, 22, 30 (phần không mặc định), 44, 58; thêm thẻ `weekend_nights` (V5-25, BUG-R5-001).

BE đọc từ góc người sẽ viết mã máy chủ, đối chiếu với `main` trong `product/services/api/src/`:
- `frontdesk/internal/checkout.service.ts` (`postMidnight`, `departure()` 671–731, `amountDueForQr` ~793, `summary()` 963, B18 1310/1455, `decide()` 1585, `readInput` 1753), `stay-support.ts` (`checkTypedTime` 783), `stay.service.ts` (`lateQuote` 737, B13 378);
- `reservations/internal/allowed-actions.ts` (57–62, 115), `reservations.service.ts` (441–485, 725–745, 4812–4866), `reservations/public/pricing.service.ts` (`price()`, 380–420), `reservations/public/pricing.ts` (`minStayNights` 303), `reservations/internal/sales-port.adapter.ts`;
- `sales/internal/quote-pricing.ts` (140, 201, 362), `sales/internal/quotes.service.ts`;
- `reporting/internal/stay-lists.ts` (`departureRows` 83);
- `registration/internal/registration.service.ts` (`onCheckedOut` 2486–2510, `scheduleAfterStay` 1729);
- `inventory/public/minibar-checkout.port.ts` (`fridgeState`);
- `folio/public/folio.service.ts` (`openRefundVnd` 1080, `depositPaid` 842), `folio-lines.service.ts` (657, 687, 725), `payments/internal/deposits.service.ts`, `payments/internal/refunds.service.ts`;
- 14 chỗ ném `FOLIO_LOCKED` (liệt kê ở thẻ 11);
- `platform/internal/rooms.service.ts` (297–339, 383, 434, 595), `platform.controller.ts` (zod `roomInput`, `roomPatch`), `platform/internal/parameter-rules.ts` (180–187, 243–254), `parameters.service.ts` (91, 153), `platform/public/parameter.service.ts` (187–202), `platform/public/room-catalog-import.ts`;
- `admin/production-bootstrap.ts`, `admin/production-defaults.ts` (176–180, 241, 471–537);
- `guest/internal/guest-portal.service.ts` (`wifiOf` 845), migration 0000, 0001, 0002, 0081, 0094;
- `shared/audit` (`defineAuditEntity`, SR-AUD-03).

BE chỉ đọc diff (`git show origin/r5-contract-0313:…`), không checkout bản làm việc chung, không sửa mã. Không SSH, không gọi staging hay production. Tệp này không có mật khẩu Wi-Fi, tỷ lệ hoa hồng, bí mật hay dữ liệu khách.

Thẻ SEC đã nêu thì BE không lặp lại, chỉ dẫn số (SEC-on-contract-0.3.13: ARC-01 kênh báo giá, ARC-02 thứ tự 403, ARC-03 kiểm soát MGR đường quá ngày đi, ARC-04/05 ô Wi-Fi).

---

## 0. Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

> Đọc lại 06/11 khuya trên `2cb549cc`: xem **mục 7**. 21/21 thẻ đóng; kết luận gộp vẫn là DUYỆT CÓ ĐIỀU KIỆN, điều kiện mới ở 7.0.

0 Blocker · 6 Major · 12 Minor · 3 Suggestion.

Nhận định chung:
- PR-0 chỉ thêm trường và mô tả. Mọi mục trong phạm vi làm được **không cần migration**, đúng như ARC nói. Không cột, trigger hay index nào bị thiếu (bảng ở mục 1 (1)).
- Lỗi nằm ở chữ hợp đồng: vài luật tiền chưa đủ chặt để hai người BE viết ra cùng một số (thẻ 01, 03, 04, 05). Sửa chữ thì không đổi kiểu sinh, FE không phải làm lại.
- Không cần ESC. Các điểm cần quyết đều thuộc ARC hoặc DOM.

| Điều kiện | Thẻ | Hạn |
|---|---|---|
| QR `check_out` và `amountDueNow` kiểm cùng luật "giờ tương lai" như B18; tóm tắt báo cờ cho Desk | 01 (Major) | Trước khi gộp PR-0 (07/11), hoặc "bổ sung 1" trước khi gộp PR-A1 |
| Nghĩa của `getArrivalsDepartures` khi vắng `date` trong cửa sổ sau nửa đêm (nửa còn lại của BUG-R4-036) | 02 (Major) | Bổ sung 1, trước khi gộp PR-A1 |
| B18 ghi thời điểm nào vào `reservation.actual_checkout_at`, `registration.actual_checkout_at`, `stay_ended_at` | 03 (Major) | Bổ sung 1, trước khi gộp PR-A1 |
| `postedByActor`/`sameBusinessDay` tính trên **dòng gốc**; thêm hai khóa vào allowlist audit `folio_line` | 04 (Major) | Trước khi gộp PR-B1 |
| `QuoteInput.nightlyRates`: một nghĩa với `createReservation`; giá gõ trước LOS; báo giá dùng chung bộ tính giá của đơn | 05 (Major) | Trước khi BE-sales viết PR-S1 (≤ 08/11) |
| Validator `min_stay` chặn dạng gây 500 | 06 (Major, mã BE) | Cùng PR V5-25 |

BE-B và BE-C bắt đầu được ngay khi PR-0 gộp: các thẻ của hai làn này không đổi kiểu sinh. BE-A và BE-sales chờ chữ của thẻ 01, 02, 03, 05 (sửa thẳng trong PR-0 thì tốt nhất).

---

## 1. Trả lời 7 câu hỏi của ORC

### (1) Có làm được không migration không? ARC có bỏ sót gì?

| Mục | Không migration? | Bằng chứng / điều ARC chưa nói |
|---|---|---|
| V5-10 | Đúng | Chỉ đổi cách quy đổi giờ và `allowedActions`. Thiếu: QR không kiểm giờ tương lai (thẻ 01), danh sách "đi hôm nay" (thẻ 02), `ActionContext` chưa có ngày lịch (thẻ 09) |
| V5-13 | Đúng | Dùng lại `FolioService.openRefundVnd` (`approval_request`, gom theo `reason_code`, cột này NOT NULL). Không index mới: lọc theo `reservation_id` của folio |
| V5-14 | Đúng | `quote.pricing_snapshot` là jsonb; `manual_agreed` đã có từ migration 0064 |
| V5-15 | Đúng | Không cột mới. `actual_checkout_at` đã có ở `reservation` và `registration`. Chưa nói ghi giá trị nào (thẻ 03) |
| V5-16 (lọc) | Đúng | `audit_event` chia phân vùng theo tháng, có index `(property_id, category, occurred_at DESC)`. Không cần index mới (thẻ 20) |
| V5-18 | Đúng | Dùng lại `unverifiedDepositVnd`; cần chặn trên (thẻ 13) |
| V5-1A | Đúng | `room_list_price.nightly_list_price_vnd` đã có, `CHECK > 0` đã có. Thiếu: bootstrap tạo căn bán được mà chưa có giá (thẻ 15) |
| V5-22 | Đúng | Sàn, trần có sẵn ở `PricedNight.floorVnd/ceilingVnd` |
| V5-30 (không mặc định) | Đúng | `config_parameter_def.default_value` của hai khóa hoa hồng vốn NULL (migration 0002). Số nằm ở `production-defaults.ts`. Bỏ ở đó không đổi giá trị đang chạy trên production (thẻ 17) |
| V5-44 | Đúng | (a) thêm trường vào `Problem`; (b) bắt lỗi của trigger 0094 trong mã (thẻ 19) |
| V5-58 | Đúng | `property.wifi_info_i18n` (jsonb, migration 0000), `ottimo_app` có `UPDATE` trên `property` (0001) |

### (2) V5-1A – mọi nơi tạo căn hoặc đổi giá mà không có giá đêm

Mã chạy:
- `platform/internal/rooms.service.ts`: `create` luôn tự tính giá đêm (dòng 434, `nightlyFromMonthly` 383). `RoomCreateInput` không có trường giá đêm. `update` dòng 595: `lp.nightlyListPriceVnd ?? nightlyFromMonthly(...)`.
- `platform.controller.ts`: zod `roomInput` không có `nightlyListPriceVnd`, và bộ đọc không chặt nên **bỏ âm thầm** trường này nếu client có gửi. `roomPatch.listPrice.nightlyListPriceVnd` đang `optional`.
- `platform/public/room-catalog-import.ts`: tự tính bằng số chia, chỉ đối chiếu với `expectedNightlyListPriceVnd`. Dùng ở seed DS-E (`db/seed/ds-e.ts:332`) và test.
- `admin/production-bootstrap.ts`: tạo căn `is_sellable = true` mà **không có dòng giá nào**.

Dữ liệu thử và test:
- `tests/fixtures/seed/ds-e.json`: 10 căn có `expectedNightlyListPriceVnd` (đổi thành giá nhập).
- `tests/fixtures/br-examples.json` dòng 1068–1079 (ví dụ BR-101 (5), phải bỏ) và `test/reservations-pricing.test.ts:207` dùng dòng đó.
- `tests/tools/validate-fixtures.mjs` dòng 194 và 914 (kiểm "÷ 12").
- `test/integration/platform-catalog.test.ts`: 55, 75, 95 (nhập danh mục); 155, 169, 178, 185, 194 (`createRoom`, chờ giá đêm tự tính); 227, 248 (PATCH không giá đêm).
- `bug-r4-004-public-room-type.test.ts` 153, 165; `rooms-scheduled-prices-v101.test.ts` 291, 311; `be-b-review-fixes.test.ts` 567, 586 (`createRoom` không giá đêm).
- `rbac-sprint1.test.ts` 166–170: thân `createRoom` không giá đêm, chờ OWN 2xx. Sau V5-1A thành 422, nên ca quyền phải gửi đủ hai giá.
- `tests/e2e/rbac/sprint1-ops.ts` 183–191 (nhận 404/409/422, không vỡ nhưng mất nghĩa); `tests/e2e/api/platform.api.spec.ts` 383–392.
- `tests/e2e/serial/platform-mutations.serial.spec.ts` 194–230: TC-NT-018 khẳng định "giá đêm mới = giá tháng ÷ 12" và trả giá về chỉ bằng giá tháng. Phải viết lại.
- `test/helpers/feature-app.ts:121` còn tham số số chia.
- Phía FE: `apps/admin-web/src/mocks/handlers.ts` (mock MSW).

Desk: `RoomDrawer.tsx` 268–276 luôn gửi đủ hai giá khi đổi giá. Desk **không có** màn tạo căn. Câu changelog "form tạo căn của Desk phải thêm ô giá đêm (FE-A)" (`openapi.yaml` dòng 310) sai, xem thẻ 15.

### (3) V5-10 – quy đổi `checkoutAt` phía máy chủ có khớp `stay.service.ts` và BUG-R4-036/051 không?

Khớp phần lõi:
- `lateQuote` và `checkTypedTime` đều tính trên trục ngày nghiệp vụ (`businessMinutes`). Luật "ứng viên muộn nhất không sau giờ server + dung sai" cho cùng bậc phụ thu với `lateQuote`.
- Ví dụ ARC nêu (07:00 gõ 05:30 → cùng ngày, cửa sổ sau nửa đêm) sửa đúng BUG-R4-051.
- B13 gia hạn từ ngày đi hiệu lực (`options().from = eff.departureDate`), nên đường "gia hạn rồi trả quá ngày đi" của V5-15 chạy được với mã hiện có.

Chưa khớp:
- QR và `amountDueNow` không kiểm giờ tương lai. Tóm tắt lại được phép trả `checkoutAt` tương lai (thẻ 01).
- BUG-R4-036 mới sửa ở `allowedActions`, chưa sửa danh sách Hôm nay (thẻ 02). `allowedActions` còn so ngày đi của chính đơn, không theo ngày đi hiệu lực (thẻ 09).
- Câu "luật mới chỉ đổi kết quả ở các ca trước đây bị 422" chưa đúng với một ca (thẻ 07).

### (4) V5-44 – trigger 0094 trả 409 mà không migration thế nào?

Làm được hoàn toàn trong `rooms.service.ts` `cancelScheduledListPrice`:
- Trigger `room_list_price_append_only` (BEFORE DELETE) ném `check_violation` (SQLSTATE `23514`), câu bắt đầu bằng `room_list_price: applied price row is append-only`.
- Bọc lệnh `DELETE` (dòng 339) trong `SAVEPOINT`, như mẫu `create_room` đang làm với `23505`. Bắt khi `pgCode(err) === '23514'` **và** câu khớp tiền tố trên, rồi ném `problem('INVALID_TRANSITION', { extras: { currentState: 'effective' } })`. Lỗi `23514` khác vẫn ném lại (500).
- Không cần SAVEPOINT cũng được: lỗi thành `ProblemError`, unit of work cuộn lại cả giao dịch. Audit ghi sau `DELETE` nên không có bản ghi thừa. BE vẫn khuyên SAVEPOINT để thứ tự rõ.
- Trigger dùng `now()` của DB theo múi giờ cơ sở; mã kiểm trước theo `ctx.today`. Ca đua lúc qua 06:00 chỉ trigger bắt được, nên test T44 phải có ca "mã cho qua, trigger chặn" (giả đồng hồ ứng dụng lệch 1 ngày).

Chi tiết ở thẻ 19.

### (5) V5-58 – Wi-Fi ghi vào cột trang khách đọc

- Cột: `property.wifi_info_i18n`, jsonb, **không mã hóa** (migration 0000). Trang khách đọc qua `wifiOf(raw, locale)` (`guest-portal.service.ts:845`):
  - nhận dạng phẳng `{ssid, password}`;
  - rồi `raw[locale]`, rồi `raw.vi`;
  - chỉ hiện khi khách đang ở, hoặc ngày nghiệp vụ ≥ ngày đến; `getGuestStay` có `Cache-Control: no-store`.
- Ghi dạng phẳng là đúng (một mạng cho cả cơ sở). Hàm đọc của `getPropertyWifi` phải dùng lại `wifiOf` để đọc được dữ liệu cũ dạng theo ngôn ngữ.
- Mã hóa: mật khẩu đưa cho mọi khách có link, nên mã hóa ở cột không thêm bảo vệ đáng kể; bản sao lưu đã mã hóa bằng age. BE đề nghị giữ dạng chữ thường, SEC xác nhận (SEC đã không đòi mã hóa ở ARC-04/05).
- RLS của `property` là theo **tổ chức** (`organization_id = app_current_org()`), nên lệnh `UPDATE` bắt buộc có `WHERE id = $propertyId`. Thiếu điều kiện này thì ghi đè Wi-Fi mọi cơ sở của tổ chức.
- Audit: thực thể `property` **chưa đăng ký** ở allowlist → ghi audit sẽ ném `AuditEntityNotRegisteredError`. Đăng ký với khóa `ssid`, `passwordChanged` (boolean). Regex tên cấm có `password$` nên `password` không lọt vào được, còn `passwordChanged` được nhận.
- Mã sinh: `setPropertyWifi` không có `Idempotency-Key`, không `If-Match`. Ghi đè nguyên giá trị nên lặp lại vô hại; hai người sửa cùng lúc thì người sau thắng (thẻ 21).

Chi tiết ở thẻ 16.

### (6) `RATE_OUT_OF_RANGE` có `min`/`max` như giả định G2 của UXD không?

Có. Hợp đồng ghi rõ ở 1.9: mọi `RATE_OUT_OF_RANGE` và `RATE_OUT_OF_RANGE_WARNING` có `min`, `max` = sàn, trần của đêm đầu tiên trong `dates[]`. **G2 xác nhận**: UXD đã bỏ `{group}`, câu chỉ cần `{min}`, `{max}`.

Hiện trạng mã:
- Đã có `min`/`max`: `checkin` 207, 767; `checkout` 825, 1104; `stay-night-pricing` 200; `folio-lines` 596.
- B13 (`stay.service.ts` 378) có `min`/`max` nhưng trả `date` số ít, không `dates[]`.
- Chưa có: `reservations.service.ts` 740 (ARC đã nêu) **và 735** (bản `WARNING` của OTA, ARC chưa nêu ở phần cài đặt). Chỗ mới của báo giá (V5-14) cũng phải có.

Chi tiết ở thẻ 12.

### (7) Ước công

Xem mục 4. Tóm tắt: khoảng 22–23 ngày BE cho đợt chạy ngay sau PR-0, khoảng 26 ngày nếu tính cả phần chờ DOM. Cần ít nhất 4 BE chạy song song. BE-A là làn quá tải: phải tách PR-A1 và chuyển hai việc nhỏ sang BE-D thì mới xong ngày 14/11.

### (+) `weekend_nights` – 0.3.13 có phải đổi schema tham số không?

**Không phải đổi schema OpenAPI.** `Parameter.value` không khai kiểu, các phần tử `allowed[]` là `{}`. Kiểu của từng khóa nằm ở từ điển tham số và erd 9.1a, nơi đều ghi `Weekday[]`. BE đề nghị ARC thêm **một dòng** vào mô tả `setParameter` để FE biết `allowed[]` đổi từ số sang chữ. Chi tiết ở thẻ 18.

---

## 2. Thẻ feedback – ARC (hợp đồng 0.3.13)

### FB-R5-BE-ARC-C0313-01
- Mức độ: Major
- Vị trí: `checkOut` mục "Quy đổi giờ trả" (`openapi.yaml` 4013–4019); `CheckoutSummary.checkoutAt` (11977–11981); `createVietQr.checkoutAt` (6228); mã `checkout.service.ts` `amountDueForQr` (~793), `amountDueNow`.
- Vấn đề:
  - Theo luật mới, khi không ứng viên nào đạt thì máy chủ chọn ứng viên sớm nhất, và "B18 trả `TIME_AFTER_ACTION`". Tóm tắt không trả 422 theo giờ gõ, nên nó trả về một `checkoutAt` **trong tương lai**.
  - Hợp đồng dặn Desk gửi đúng `checkoutAt` của tóm tắt cho QR `check_out`. Nhưng `amountDueForQr` hiện chỉ kiểm ngày đi và cửa sổ sau nửa đêm, **không kiểm giờ tương lai**. `amountDueNow` cũng vậy.
  - Ví dụ: đi 24/11, giờ hẹn trả muộn 17:00. Khách rời lúc 01:00 ngày 24/11, lễ tân mở tóm tắt mà chưa gõ giờ.
    - t = 17:00 ≥ 06:00 nên chỉ có một ứng viên: 24/11 17:00, ở tương lai.
    - Tóm tắt tính phụ thu trả muộn bậc 17:00, trong khi đúng ra là 0 đ (cửa sổ sau nửa đêm).
    - Nếu giờ gõ sau mốc cuối thì tóm tắt còn cộng **đêm thêm**.
    - QR tạo theo số đó, khách trả. Sau đó B18 trả 422 `TIME_AFTER_ACTION`. Lễ tân sửa giờ thì còn phải thu giảm, phần đã thu thành tiền thừa phải hoàn.
  - BUG-R4-051 đã có ca QR nhận số có đêm thêm. Luật mới giảm ca đó nhưng chưa đóng hẳn.
- Vì sao quan trọng: thu sai tiền của khách rồi phải hoàn, mà không ai bị chặn trước. Desk không tự kiểm được vì không biết `manual_time_tolerance_minutes`.
- Đề xuất sửa:
  1. Một hàm quy đổi dùng chung cho tóm tắt, QR, B18 (ví dụ `resolveCheckoutAt` trong `stay-support.ts`). QR `check_out` và `amountDueNow` kiểm `TIME_AFTER_ACTION` như B18 → 422, không tạo QR, không ghi gì.
  2. `CheckoutSummary` thêm `checkoutAtAfterNow: boolean` (`checkoutAt` > giờ server + dung sai). Desk dựa vào cờ này để tắt nút QR và Hoàn tất, và hiện câu "Giờ trả đang ở sau giờ hiện tại". Tên trường do ARC chọn.
  3. Test T10-9: tóm tắt có `checkoutAt` tương lai → cờ `true`; QR với `checkoutAt` đó → 422 `TIME_AFTER_ACTION`, không có dòng `payment_intent`, không audit.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-02
- Mức độ: Major
- Vị trí: `getArrivalsDepartures` (`openapi.yaml` 2202); `checkOut` câu cuối mục V5-10 ("`allowedActions` có `check_out` từ 00:00 ngày lịch = ngày đi – BUG-R4-036"); mã `reporting/internal/stay-lists.ts` `departureRows` (83).
- Vấn đề:
  - BUG-R4-036 có hai nửa: nút Trả phòng của đơn, và danh sách "Khách đi hôm nay" trên trang Hôm nay. Hợp đồng chỉ sửa nửa đầu.
  - `getArrivalsDepartures` vắng `date` thì dùng ngày nghiệp vụ. Lúc 01:00 ngày 24/11, ngày nghiệp vụ là 23/11, nên danh sách "đi hôm nay" là khách đi 23/11 (đã qua). Khách đi 24/11, những người lễ tân ca đêm đang được phép trả phòng, không có trong danh sách.
  - Hợp đồng không nói `date` vắng nghĩa là gì trong cửa sổ sau nửa đêm.
- Vì sao quan trọng: ca đêm là lúc sửa BUG-R4-036 có tác dụng. Nút có ở trang đơn mà danh sách Hôm nay không có khách, thì lễ tân phải tìm tay. Đó chính là lỗi QA đã ghi.
- Đề xuất sửa:
  1. ARC ghi: vắng `date` trong cửa sổ sau nửa đêm (ngày lịch = ngày nghiệp vụ + 1, trước `business_day_rollover`) → phần `departures` lấy lượt có ngày đi **hiệu lực** = ngày lịch. Phản hồi thêm `departuresDate` (ngày đã dùng) để Desk ghi tiêu đề đúng. Phần `arrivals` giữ theo ngày nghiệp vụ.
  2. Lượt đã quá ngày đi (V5-15) không vào `departures`. Nếu DOM muốn có danh sách riêng thì để bản sau.
  3. Test T10-10: 01:00 ngày 24/11 → `departures` có lượt đi 24/11, `departuresDate = 2026-11-24`; 07:00 ngày 24/11 → như cũ.
  4. Việc này ở module `reporting`, khoảng 0,5 ngày. Đề nghị giao BE-D để giảm tải BE-A (mục 4).
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-03
- Mức độ: Major
- Vị trí: `checkOut` mục V5-15 (`openapi.yaml` 4020–4027: "`post_checkout_window_until` tính từ lúc ghi", audit `after.overdue`); mã `checkout.service.ts` 1310 (`actual_checkout_at = ctx.now`) và 1455 (`registration.onCheckedOut(tx, id, ctx.now)`); `registration.service.ts` `onCheckedOut` (2486–2510), `scheduleAfterStay` (1729).
- Vấn đề:
  - Hợp đồng nói cửa sổ sau trả phòng tính từ lúc ghi, và audit giữ cả `checkoutAt` lẫn `recordedAt`. Hợp đồng **không nói** giá trị nào ghi vào `reservation.actual_checkout_at` và `registration.actual_checkout_at`.
  - Mã hiện ghi `ctx.now` cho cả hai. Từ `onCheckedOut(at)`, thời điểm này đi tiếp vào:
    - `registration.stay_ended_at`, là mốc tính hạn xóa ảnh giấy tờ (migration 0081, SEC BE-32);
    - yêu cầu cập nhật khai báo lúc đi cho khách nước ngoài (`requireUpdate(…, 'departure')`, BR-604);
    - mốc giữ chứng cứ phạt 12 tháng (`setRetentionAnchor penalty_evidence`, SEC I5);
    - các danh sách khai báo lọc theo `actual_checkout_at`.
  - Ghi đơn quá ngày đi trễ 3 ngày thì mọi mốc trên lệch 3 ngày: khai báo đi sai ngày, ảnh giấy tờ giữ lâu hơn cần.
  - B18 thường cũng có lệch, nhưng nhỏ (trong dung sai, hoặc có ghi chú giờ).
- Vì sao quan trọng: khai báo lưu trú là nghĩa vụ pháp lý. Mốc giữ dữ liệu liên quan Nghị định 13/2023. Hai BE đọc cùng hợp đồng có thể ghi khác nhau.
- Đề xuất sửa:
  1. ARC ghi: với đường quá ngày đi (và nên áp cho mọi B18 có `checkoutAt`), `reservation.actual_checkout_at` = `registration.actual_checkout_at` = `checkoutAt` (giờ khách rời thật). Giờ ghi (`recordedAt`) chỉ dùng cho audit và `post_checkout_window_until`, như hợp đồng đã viết.
  2. DOM xác nhận khai báo đi dùng giờ rời thật. SEC xác nhận mốc giữ ảnh tính từ giờ rời thật (hạn xóa sớm hơn, theo hướng giữ ít).
  3. Test T15-8: ghi quá ngày đi 2 ngày → `actual_checkout_at` = `checkoutAt`; `stay_ended_at` = `checkoutAt`; `post_checkout_window_until` = giờ ghi + cửa sổ.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-04
- Mức độ: Major
- Vị trí: `listAuditEvents.removalsOnly` (`openapi.yaml` 7001–7006); `contract-0.3.13.md` 1.5; mã `folio-lines.service.ts` 657, 687, 725 (`folio_line.adjusted`); allowlist audit `folio_line`.
- Vấn đề:
  - (a) Sửa dòng phát sinh = đảo dòng cũ và ghi dòng thay thế có `related_line_id`. Dòng thay thế mang `posted_by` = người sửa, `business_date` = ngày sửa.
    - Nếu `postedByActor` và `sameBusinessDay` so với **dòng đang sửa**, có đường vòng hai bước.
    - Ví dụ: FD-1 ghi minibar hôm qua. Hôm nay FD-2 giảm còn 1.000 đ, rồi giảm tiếp về 0.
    - Ở bước hai, dòng đang sửa là dòng FD-2 vừa ghi, nên `postedByActor = true` và `sameBusinessDay = true`.
    - Luật chặn của SEC (a), làm ở PR-B2 sau khi DOM chốt, sẽ coi đây là "tự sửa dòng của mình trong ngày" và cho qua.
  - (b) Bước một (giảm còn 1.000 đ) không vào bộ lọc `removalsOnly`, vì `after.amountVnd` ≠ 0.
  - (c) Allowlist `folio_line` hiện có `category, amountVnd, lineState, relatedCategory, reversedVnd, openDebtVnd, windowVnd, reducedVnd, actorRole`. **Không có** `postedByActor`, `sameBusinessDay`. Allowlist lọc khóa ở cấp trên cùng (SR-AUD-03), nên hai khóa mới bị bỏ âm thầm. Test chỉ kiểm phản hồi API thì vẫn xanh.
- Vì sao quan trọng: đây là kiểm soát chống lễ tân xóa tiền phát sinh (FB-R4-SEC-BE-A31-01, Major). Khóa sai thì luật chặn sau này dựa trên dữ liệu sai.
- Đề xuất sửa:
  1. ARC ghi: `postedByActor` và `sameBusinessDay` tính trên **dòng gốc** của chuỗi `related_line_id` (dòng đầu tiên, `posted_by` và `business_date` của nó). Thêm `before.rootLineId` (chỉ id, không tiền) để OWN lần ra chuỗi.
  2. Hỏi DOM ở PR-B2: giảm còn số rất nhỏ (ví dụ 1.000 đ) có tính là "bỏ" không. Gợi ý: giảm ≥ một tỷ lệ của dòng gốc, theo tham số. Không đổi `removalsOnly` ở 0.3.13.
  3. PR-B1 thêm hai khóa vào allowlist `folio_line`. Test đọc lại bản ghi `audit_event` (không chỉ phản hồi API) và kiểm có `postedByActor`, `sameBusinessDay`. Ca hai bước như trên → bước hai có `postedByActor = false`.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-05
- Mức độ: Major
- Vị trí: `QuoteInput.nightlyRates` (`openapi.yaml` 12267–12275); `contract-0.3.13.md` 1.3; mã `sales/internal/quote-pricing.ts`, `reservations/public/pricing.service.ts` `price()`, `reservations/internal/sales-port.adapter.ts` `createHoldFromQuote`.
- Vấn đề:
  - (a) Chữ tự mâu thuẫn. Hợp đồng ghi "cùng nghĩa với `ReservationCreate.nightlyRates`", rồi "đêm vắng = giá lịch". Ở `createReservation`, `nightlyRates` phải phủ **mọi** đêm; thiếu một đêm → 422 `REQUIRED` (`byDate.size !== dates.length`).
  - (b) Hợp đồng không nói giá gõ là trước hay sau giảm giá ở dài (LOS) và mã khách quay lại. Ở `createReservation` (BR-107 v0.3.8), giá gõ của kênh Trực tiếp/CTV là **giá lịch** của đêm (`calendarVnd`), LOS áp trên đó. Báo giá áp khác đi thì số báo giá, số đơn và số cọc lệch nhau, mà V5-14 sinh ra chính là để sửa lệch cọc.
  - (c) `quote-pricing.ts` là bộ tính giá riêng, **không có** sàn–trần BR-105. Sàn–trần của đơn lấy theo giá OTA gốc của nhóm hoặc giá niêm yết (`pricing.service.ts`). Viết lại luật này trong module sales sẽ thành hai bản dễ lệch nhau.
  - (d) `createHoldFromQuote` đặt mọi đêm `source: 'calendar'`, và snapshot không có `agreedRate`. Hợp đồng muốn `manual` và `bookingRateSource = manual_agreed`, nên cần thêm dữ liệu vào snapshot. Nếu không, B9a, B13, B18 sẽ gợi ý giá lịch thay giá đã thỏa thuận.
- Vì sao quan trọng: sai tiền cọc và giá đêm của đơn. Đây là mục tiền rủi ro nhất của làn sales.
- Đề xuất sửa:
  1. ARC chọn một nghĩa và ghi rõ. BE nghiêng về: báo giá **giống hẳn** `createReservation` (gửi thì phủ mọi đêm, `edited` đánh dấu đêm gõ). Desk đã có đủ đêm trên hộp.
  2. Ghi: giá gõ = giá trước LOS và mã quay lại, theo BR-107 v0.3.8, như `createReservation`.
  3. Ghi hướng cài đặt: phần giá đêm và sàn–trần của báo giá gọi `PricingService.price` (module reservations, public), không viết lại. Snapshot lưu `nights[].source` và `agreedRate`. Adapter dùng nguồn trong snapshot.
  4. Test T14-7 (oracle chung): cùng căn, ngày, khách, giá gõ → `calculateQuote.totalVnd` và `depositVnd` = `createReservation` `previewOnly`.
  5. Cùng hướng với SEC ARC-01: chỉ kênh `direct`/`agent`.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-07
- Mức độ: Minor
- Vị trí: `checkOut` mục "Quy đổi giờ trả", câu "Luật mới chỉ đổi kết quả ở các ca trước đây bị 422 `TIME_AFTER_ACTION`" (`openapi.yaml` 4017–4018); mã `checkout.service.ts` `departure()`, `decide()`.
- Vấn đề:
  - Câu trên chưa đúng với một ca. Đi 24/11; lúc 01:05 ngày 24/11 lễ tân ghi khách đã rời lúc 23:50 tối 23/11, chỉ gõ giờ.
  - Mã hiện tại: cửa sổ sau nửa đêm tính theo giờ server, nên phụ thu 0, giờ sớm hơn quá ngưỡng thì cần ghi chú. B18 **chạy được**.
  - Luật mới: t = 23:50 ≥ 06:00, nên chỉ có ứng viên 24/11 23:50, ở tương lai → B18 422 `TIME_AFTER_ACTION`, tóm tắt cộng đêm thêm. Câu báo "giờ trong tương lai" lại sai với điều lễ tân vừa làm.
  - Mã hiện cũng không nhất quán: gửi `checkoutAt` = 23/11 23:50 thì bị 422 `DATE_INVALID`, nhưng chỉ gõ giờ thì qua.
- Vì sao quan trọng: đổi hành vi mà hợp đồng nói là không đổi. Ca này thuộc V5-11 (trả sớm lúc 00:00–05:59, DOM chốt luật).
- Đề xuất sửa:
  1. ARC bỏ câu "chỉ đổi kết quả…", hoặc ghi ca này là đổi hành vi có chủ ý.
  2. DOM (V5-11) chọn: khách rời trước nửa đêm của đêm cuối là B16 (trả sớm) hay B18 phụ thu 0. Trong lúc chờ, máy chủ trả 422 `DATE_INVALID` (`field` = `checkoutTime`) để Desk hướng sang Trả sớm, thay vì `TIME_AFTER_ACTION`.
  3. Test T10-8 cho ca này, chờ DOM chốt kết quả.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-08
- Mức độ: Minor
- Vị trí: `createVietQr.checkoutAt` (`openapi.yaml` 6228: "vắng = giờ server"); `getCheckoutSummary` (3815–3818).
- Vấn đề:
  - Mô tả QR còn câu cũ "vắng = giờ server". Theo luật mới, vắng `checkoutAt` thì quy đổi theo giờ gõ, rồi giờ hẹn, rồi giờ chuẩn. Hai câu cho hai số khác nhau.
  - Tóm tắt vắng cả hai tham số thì quy đổi theo giờ hẹn hoặc giờ chuẩn, không theo `serverTime` như bước 2 của Desk (S4-47). Desk gọi tóm tắt lần đầu chưa có giờ sẽ nhận `checkoutAt` là "giờ dự kiến", và có thể ở tương lai (thẻ 01).
- Vì sao quan trọng: BE và FE đọc hai câu sẽ cài khác nhau. Lỗi kiểu BUG-R4-051 quay lại.
- Đề xuất sửa:
  1. Thay câu ở `createVietQr.checkoutAt`: "vắng → quy đổi như `checkOut` mục Quy đổi giờ trả".
  2. Ghi ở `getCheckoutSummary`: Desk chỉ chuyển tiếp `checkoutAt` của lần tóm tắt **có gửi `checkoutTime` hoặc `checkoutAt`** (giờ bước 2), không chuyển tiếp lần gọi không tham số.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-09
- Mức độ: Minor
- Vị trí: `checkOut` mục V5-10 (`allowedActions`), `AllowedAction.overdue`; mã `reservations/internal/allowed-actions.ts` 115, `ActionContext`; `reservations.service.ts` 441–485.
- Vấn đề:
  - `check_out` hiện so `c.today === c.departureDate`, tức ngày đi của **chính đơn**. B16 ngay trên lại dùng `stayDepartureDate` (ngày đi hiệu lực, gồm đơn con, BR-422).
  - Đơn OTA gia hạn bằng đơn con: đơn chính đi 23/11, đơn con tới 25/11. Ngày 23/11 nút Trả phòng hiện trên đơn chính, B18 máy chủ lại chặn. Từ 24/11, `overdue` mới sẽ coi đơn chính là "quá ngày đi" trong khi khách vẫn ở theo đơn con.
  - `ActionContext` chưa có ngày lịch, nên chưa tính được cửa sổ sau nửa đêm.
- Vì sao quan trọng: nút sai làm lễ tân bấm rồi gặp lỗi; `overdue` sai đẩy lễ tân sang nhờ MGR không cần thiết.
- Đề xuất sửa:
  1. ARC ghi: `check_out`, cửa sổ sau nửa đêm và `overdue` đều theo **ngày đi hiệu lực** của lượt (`stayDepartureDate`).
  2. BE thêm `calendarDate` vào `ActionContext`.
  3. Test: đơn chính + đơn con, ngày đi của đơn chính → không có `check_out`, không `overdue`.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-10
- Mức độ: Minor
- Vị trí: `checkOut` mục V5-15 (`openapi.yaml` 4020–4027); mã `checkout.service.ts` `readInput` (1753), `decide()` (1585), `amountDueForQr` (~793); `inventory/public/minibar-checkout.port.ts` `fridgeState`; allowlist audit `reservation`.
- Vấn đề: đọc hợp đồng thì đủ, nhưng có năm chỗ mã hiện tại làm ngược lại. Hợp đồng nên ghi rõ để PR-A1 không trượt:
  1. "403 kiểm trước thân lệnh": `readInput` chạy **trước** khi tải đơn, nên chưa biết đơn quá ngày đi hay không. Phải tải đơn (không khóa) trước, kiểm vai, rồi mới đọc thân. Thứ tự này áp cả bước 0 của `lateFeeInsteadOfNight` (tra `Idempotency-Key` trước, như SEC ARC-02).
  2. `checkoutTime` đang **bắt buộc** ở `readInput`. Đường quá ngày đi bắt buộc `checkoutAt`. Cần ghi: `checkoutTime` có thể vắng khi có `checkoutAt`; nếu gửi thì phải khớp giờ địa phương của `checkoutAt`.
  3. `decide()` so `checkoutAt` với giờ hiện tại và đòi `checkoutTimeNote` khi sớm hơn quá ngưỡng. Với đơn quá ngày đi, luôn sớm hơn vài ngày. Hợp đồng đã ghi "không bắt buộc", nhưng câu "không sau giờ server" chưa rõ có dung sai không (đường thường có `manual_time_tolerance_minutes`).
  4. QR: `amountDueForQr` trả 409 `INVALID_TRANSITION` khi ngày đi ≠ hôm nay và ngoài cửa sổ. Phải mở cho OWN/MGR với đơn quá ngày đi; FD/FDL → 403 trước kiểm trạng thái.
  5. Minibar: `fridgeState` (module inventory) đòi lần đếm có `business_date === today` khi khách còn ở. Đơn quá ngày đi có lần đếm ở ngày đi sẽ gặp blocker `not_today`. Ngoại lệ K11-09 cần đổi chữ ký cổng (`countFrom: LocalDate`), tức sửa module khác.
  - Thêm: allowlist `reservation` phải có `overdue`, không thì `after.overdue` bị bỏ âm thầm (như thẻ 04).
- Vì sao quan trọng: mỗi chỗ là một lỗi 409/422 hoặc mất audit khi chạy thật. Ca 403 không có trong `rbac-cases` tự sinh (SEC ARC-02), nên CI không bắt.
- Đề xuất sửa: ARC thêm 3 câu vào mô tả `checkOut` (ý 1, 2, 3) và một câu cho QR (ý 4). Ý 5 ghi vào mục 2 của `contract-0.3.13.md`: PR-A1 sửa `minibar-checkout.port.ts`, người giữ module inventory review. Test: T15-1 thêm FDL (SEC đã nêu); T15-9 đọc lại `audit_event` có `after.overdue`.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-11
- Mức độ: Minor
- Vị trí: `Problem.lockReason` (`openapi.yaml` 10413–10419); 14 chỗ ném `FOLIO_LOCKED`.
- Vấn đề:
  - Hợp đồng ghi `lockReason` **luôn có** với `409 FOLIO_LOCKED`, enum 4 giá trị. BE rà 14 chỗ ném:
    - `deposits.service.ts` 149; `payments` 1023; `refunds.service.ts` 379, 713;
    - `foc.service.ts` 86; `folio-lines.service.ts` 508, 519, 576;
    - `folio.service.ts` 885 (`lockForPosting`), 1001, 1644, 1942;
    - `bill.service.ts` 315; `payment.service.ts` 339.
  - Hai chỗ không có giá trị nào hợp:
    - `bill.service.ts` 315 ném khi hóa đơn điện tử **đã phát hành** (`einvoice_status = 'issued'`), không phải folio đóng;
    - `payment.service.ts` 339 ném khi thu nợ (`debtCollection`) trên folio **đang mở**: folio không khóa, chỉ là sai trạng thái.
- Vì sao quan trọng: Desk chọn câu theo `lockReason`. Gửi `closed` cho ca hóa đơn đã phát hành là nói sai với lễ tân.
- Đề xuất sửa:
  1. Thêm `invoice_issued` vào enum.
  2. Nhánh `debtCollection` của 339 (folio `open`) đổi sang `409 INVALID_TRANSITION` (`currentState: 'open'`), hoặc thêm `not_settled`. ARC chọn; BE nghiêng về `INVALID_TRANSITION` vì đúng nghĩa hơn. Nhánh còn lại (folio `closed`) giữ `FOLIO_LOCKED` + `closed`.
  3. BE làm hàm chung `folioLocked(reason)` ở `folio/public`, và thêm test quét mã: không còn `problem('FOLIO_LOCKED'` nào ngoài hàm này. Chỗ bắt lỗi theo mã (`guest-request-lifecycle.ts` 184) không bị ảnh hưởng.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-12
- Mức độ: Minor
- Vị trí: `contract-0.3.13.md` 1.9; mã `reservations.service.ts` 735, 740; `stay.service.ts` 378; chỗ mới ở `quote-pricing.ts` (V5-14).
- Vấn đề:
  - Phần cài đặt của 1.9 chỉ nêu dòng 740. Dòng 735 (`RATE_OUT_OF_RANGE_WARNING`, OTA) cũng chỉ có `dates`.
  - B13 trả `date` (số ít) + `min`/`max`, không có `dates[]` như câu "cạnh `dates[]`".
  - `PriceResult.outOfRange` chỉ là danh sách ngày. Sàn, trần lấy từ `nights.find(n => n.date === outOfRange[0])`.
- Vì sao quan trọng: thiếu một chỗ là Desk lại hiện câu có `{min}`/`{max}` trống, đúng lỗi BUG-R4-040.
- Đề xuất sửa:
  1. Ghi đủ 3 chỗ phải sửa (735, 740, báo giá mới).
  2. B13 thêm `dates: [date]` và giữ `date` cho client cũ.
  3. T22-3: OTA dưới sàn không có lý do → 422 có `min`, `max`.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-13
- Mức độ: Minor
- Vị trí: `Reservation.depositUnverifiedVnd` (`openapi.yaml` 11377); `contract-0.3.13.md` 1.6; mã `deposits.service.ts` `unverifiedDepositVnd`.
- Vấn đề:
  - `unverifiedDepositVnd` = Σ cọc `succeeded`, không phải dòng đảo, chờ đối soát. Hàm này **không có chặn trên**.
  - Audit lại ghi `Math.min(paid, unverified)`, với `paid` = `depositPaid` (Σ cọc, trừ phần đã hoàn).
  - Hợp đồng nói "cùng câu truy vấn" với nguồn của audit. Khi cọc chờ đối soát đã hoàn một phần, trường đọc sẽ lớn hơn số cọc đang giữ, còn audit ghi số nhỏ hơn.
- Vì sao quan trọng: hộp "chấp nhận cọc thiếu" sẽ nêu số chờ đối soát lớn hơn số đã cọc.
- Đề xuất sửa:
  1. Ghi `depositUnverifiedVnd = min(depositPaidVnd, Σ cọc chờ đối soát)`, đúng như audit.
  2. T18-4: cọc 3 tr chờ đối soát, đã hoàn 1 tr → 2 tr.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-14
- Mức độ: Minor
- Vị trí: `OpenRefund.reasonCode` (`openapi.yaml` 12015); `contract-0.3.13.md` 1.2, T13-5.
- Vấn đề:
  - T13-5 ghi "Σ `openVnd` = `creditVnd` − `unhandledCreditVnd` khi có dư". Mã: `unhandled = max(0, credit − openRefund)`. Khi tổng chờ hoàn > số dư (folio thay đổi sau khi xin hoàn), vế phải = `creditVnd`, không bằng Σ. Test viết theo chữ sẽ đỏ, hoặc BE sửa mã cho khớp test sai.
  - `reasonCode` ghi "hiện `early_departure`, `overpayment`". Mã còn có `overbooking_relocated` (`reservations.service.ts` 4866) và các mã nhập tay của A32 (`refunds.service.ts` 393, 846). UXD cần đủ danh sách để làm nhãn.
- Vì sao quan trọng: test sai làm chậm PR-B1; thiếu nhãn thì Desk hiện "Hoàn tiền" chung cho ca chuyển khách do quá tải.
- Đề xuất sửa:
  1. T13-5 thành hai ý: Σ `openVnd` = `openRefundVnd` (luôn đúng); `creditVnd − unhandledCreditVnd = min(creditVnd, Σ openVnd)`.
  2. `reasonCode`: "mọi `ApprovalRequest.reasonCode` của yêu cầu loại `refund`", kèm danh sách hiện có để UXD làm nhãn.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-15
- Mức độ: Minor
- Vị trí: `contract-0.3.13.md` 1.8; changelog `openapi.yaml` 310; `admin/production-bootstrap.ts`; danh sách nơi gọi ở mục 1 (2).
- Vấn đề:
  - Câu "form tạo căn của Desk phải thêm ô giá đêm (FE-A)" sai: Desk không có màn tạo căn. Chỉ có mock `admin-web` và các test.
  - Bootstrap production tạo căn `is_sellable = true` mà không có dòng giá. Sau V5-1A vẫn vậy, vì bootstrap không đi qua `createRoom`. Kiểm tĩnh V5-73 sẽ bắt, nhưng đó là phát hiện sau, không phải chặn trước.
  - Danh sách việc kèm theo chưa có trong 1.8: viết lại TC-NT-018, bỏ ví dụ BR-101 (5) ở `br-examples.json`, sửa `validate-fixtures.mjs` (÷ 12), đổi trường `expectedNightlyListPriceVnd` của DS-E thành giá nhập.
  - Sau V5-1A, `night_from_month_divisor` không còn chỗ dùng trong mã chạy. Từ điển đang ghi "khóa còn dùng ở đường API".
- Vì sao quan trọng: thiếu việc kèm theo thì CI đỏ ở PR-C1. Thiếu chặn ở bootstrap thì căn mới có thể lên web không có giá.
- Đề xuất sửa:
  1. Thay câu changelog bằng "`admin-web` mock và các test phải gửi giá đêm".
  2. Thêm T1A-5: bootstrap tạo căn `is_sellable = false` cho tới khi OWN nhập giá, kèm một dòng ở sổ vận hành.
  3. Chép danh sách nơi gọi ở mục 1 (2) vào 1.8 làm checklist PR-C1.
  4. DOM ghi `night_from_month_divisor` "ngừng dùng từ v1.0.5", giữ dòng danh mục, không migration.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-16
- Mức độ: Minor
- Vị trí: `getPropertyWifi`, `setPropertyWifi` (`openapi.yaml` 1840–1888); `contract-0.3.13.md` 1.13; mã `guest-portal.service.ts` `wifiOf` (845), migration 0000, 0001; allowlist audit.
- Vấn đề: bốn chỗ hợp đồng chưa nói:
  1. RLS `property` theo tổ chức, nên `UPDATE` phải lọc `id`.
  2. Thực thể audit `property` chưa đăng ký → ném `AuditEntityNotRegisteredError` ngay lần ghi đầu.
  3. Dữ liệu cũ có thể ở dạng theo ngôn ngữ (`{vi: {…}, en: {…}}`); `getPropertyWifi` phải đọc như `wifiOf`, ghi luôn về dạng phẳng.
  4. Ký tự cho phép của mật khẩu chưa ghi: WPA2 nhận 8–63 ký tự ASCII in được.
- Vì sao quan trọng:
  - Ý 1: ghi nhầm Wi-Fi của cơ sở khác khi tổ chức có hơn một cơ sở.
  - Ý 2: lệnh luôn 500.
  - Ý 3: OWN thấy ô trống dù khách vẫn thấy mạng.
  - Ý 4: khách gõ không được mật khẩu có dấu.
- Đề xuất sửa:
  1. ARC ghi mật khẩu 8–63 ký tự ASCII 0x20–0x7E, ngoài khoảng → 422 `VALIDATION_FAILED`, không lặp lại giá trị (SEC ARC-05).
  2. Ghi: đọc theo cùng luật với trang khách, ghi dạng phẳng.
  3. BE tự làm, không cần chữ hợp đồng: `WHERE id = $1`; đăng ký `property` với `ssid`, `passwordChanged`; tách `wifiOf` ra `platform/public` dùng chung.
  4. Test T58-7: tổ chức 2 cơ sở → chỉ một cơ sở đổi; T58-8: dữ liệu dạng theo ngôn ngữ → GET đọc ra đúng.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-17
- Mức độ: Minor
- Vị trí: `listParameters.missing` (`openapi.yaml` 1921–1924); `contract-0.3.13.md` 1.10; mã `parameters.service.ts` 91, 153; `parameter.service.ts` `get` (187–202); `quote-pricing.ts` 362; `folio.service.ts` ~3987; `production-defaults.ts` 471–537.
- Vấn đề:
  1. `missing[]` cho OWN/MGR. `data` đã lọc khóa chỉ của OWN (`ownerOnlyKey`) khỏi MGR, còn `missing[]` chưa nói. MGR có thể thấy tên khóa mình không được thấy.
  2. `ParameterService.get` **ném** `ParameterMissingError` khi không có giá trị và mặc định NULL. `quote-pricing.ts` 362 và `folio.service.ts` ~3987 đọc hoa hồng bằng `get`. Bỏ mặc định thì báo giá có người chốt và việc chốt đơn sẽ lỗi, không ra `rate_missing`.
  3. `missing[]` tính theo khóa. Hoa hồng thuê dài nằm **trong** `lease_terms[]`, cạnh các mức khác có giá trị. Bỏ phần hoa hồng thì `lease_terms` vẫn có giá trị, nên không vào `missing[]`.
  4. Production đã có giá trị hoa hồng do bootstrap ghi. Bỏ số ở `production-defaults.ts` chỉ đổi lần bootstrap sau và seed, không đổi production. Hợp đồng nên nói rõ để QA không chờ `rate_missing` trên staging hay production.
- Vì sao quan trọng: ý 2 làm hỏng báo giá và chốt đơn ngay khi chạy seed mới. Ý 3 làm OWN tin là đã nhập đủ.
- Đề xuất sửa:
  1. `missing[]` áp cùng bộ lọc vai với `data`.
  2. Ghi: mọi chỗ đọc khóa hoa hồng bắt `ParameterMissingError` → `rate_missing`. BE thêm test quét mã.
  3. `missing[]` nhận đường dẫn con, ví dụ `lease_terms[].commissionStaffPct`, hoặc chờ DOM tách hoa hồng thuê dài khỏi `lease_terms` ở H2. ARC chọn.
  4. T30-5: seed mới không có hoa hồng → báo giá 200 với `rate_missing`, không 500. Seed và test chỉ dùng tham số `test_rate_*` (G3).
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-19
- Mức độ: Suggestion
- Vị trí: `cancelScheduledRoomListPrice` (V5-44 (b)); `contract-0.3.13.md` 1.11 (b); mã `rooms.service.ts` 297–339; migration 0094.
- Vấn đề: hợp đồng nói "trigger 0094 → 409, không migration" mà chưa nói cách bắt. Có hai cách dễ sai:
  - bắt mọi `23514`, che mất lỗi ràng buộc khác;
  - so cả câu lỗi, vỡ khi đổi câu trigger.
- Vì sao quan trọng: lỗi ràng buộc thật mà trả 409 thì không ai thấy.
- Đề xuất sửa:
  1. ARC ghi một dòng: bắt khi `SQLSTATE = 23514` **và** câu bắt đầu bằng `room_list_price: applied price row is append-only` → 409 `INVALID_TRANSITION` (`currentState: 'effective'`). Còn lại ném lại.
  2. BE dùng `SAVEPOINT` như mẫu `create_room`. Audit ghi sau `DELETE` nên không có bản ghi thừa.
  3. Test T44-4: giả đồng hồ ứng dụng chậm 1 ngày → mã cho qua, trigger chặn → 409, `room_list_price` còn nguyên, không audit, `version` không tăng.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-20
- Mức độ: Suggestion
- Vị trí: `listAuditEvents.removalsOnly` (`openapi.yaml` 7001–7006); G5.
- Vấn đề: ORC hỏi `removalsOnly` có cần index không. BE: **không cần**, nếu máy chủ ghim điều kiện.
  - `audit_event` chia phân vùng theo tháng. Lọc `from`/`to` (tối đa 92 ngày) chỉ chạm 3–4 phân vùng.
  - Index `(property_id, category, occurred_at DESC)` có sẵn.
  - Mỗi tuần một cơ sở 10 căn có khoảng vài trăm bản ghi `money`. Lọc jsonb trên số đó không đáng kể.
- Vì sao quan trọng: thêm index cho mọi phân vùng là migration, không đáng.
- Đề xuất sửa:
  1. Khi `removalsOnly = true`, máy chủ tự thêm `category = 'money'` và `action = 'folio_line.adjusted'`, kể cả khi client không gửi, để luôn dùng index trên.
  2. So jsonb an toàn: `(after->>'amountVnd')::numeric = 0`, `after->>'category' <> 'room'`.
  3. DOM xác nhận `extra_person` và `late_fee_as_night` có bị loại như tiền phòng không.
  4. QA chạy `EXPLAIN` trên staging với seed lớn và ghi vào báo cáo hiệu năng.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-21
- Mức độ: Suggestion
- Vị trí: `setPropertyWifi` (`openapi.yaml` 1858–1888).
- Vấn đề:
  - Phản hồi PUT trả lại `password`. SEC ARC-05 đã đòi `no-store`.
  - Lệnh không có `If-Match`: hai người sửa cùng lúc thì người sau ghi đè mà không biết.
- Vì sao quan trọng: ít đường để mật khẩu nằm lại ở bộ đệm và log phía client. Tránh ghi đè lẫn nhau.
- Đề xuất sửa:
  1. Phản hồi PUT chỉ có `ssid`, `updatedAt` và `passwordSet: true`. Desk đã có giá trị vừa gõ.
  2. Thêm `If-Match` theo `property.version` nếu ARC thấy cần. Mức Suggestion: tần suất sửa rất thấp.
- Trạng thái: Open

---

## 3. Thẻ feedback – mã máy chủ hiện có (BE tự sửa, ARC ghi một dòng)

### FB-R5-BE-ARC-C0313-06
- Mức độ: Major
- Vị trí: `platform/internal/parameter-rules.ts` 243–254 (`min_stay`); bộ tính giá `reservations/public/pricing.ts` `minStayNights` (303–317), `pricing.service.ts` 176, `quote-pricing.ts` 201–202.
- Vấn đề:
  - Validator `min_stay` nhận số nguyên 1–7, hoặc đối tượng `{nights}`.
  - Dạng danh sách luật (`MinStayRule[]`), là dạng từ điển và hai bộ tính giá dùng, thì **không được kiểm**: mảng không có `.nights`, nên lọt qua mọi điều kiện.
  - Hai bộ tính giá chạy `for (const r of rules)`. Lưu `2` hay `{nights: 2}` (hai dạng validator cho qua) thì mọi báo giá và mọi lần tạo đơn ngắn ngày ném `TypeError: rules is not iterable` → 500 toàn cơ sở.
  - Ngược lại, danh sách luật hỏng (`nights: 0`, thiếu `arrivalWeekdays`) cũng lọt qua.
- Vì sao quan trọng: OWN lưu một giá trị validator cho qua là dừng cả đặt phòng lẫn báo giá. Lỗi chỉ lộ ra khi khách hỏi giá.
- Đề xuất sửa:
  1. BE (cùng PR V5-25): `min_stay` chỉ nhận `MinStayRule[]`. Mỗi phần tử có `nights` nguyên 1–7, `arrivalWeekdays` là `Weekday[]` không trùng, `arrivalOnSpecialDates` boolean, `channels` thuộc danh mục nhóm kênh. Dạng số hoặc đối tượng → 422 `PARAM_OUT_OF_RANGE`.
  2. Hai bộ tính giá đọc phòng thủ: không phải mảng → coi như rỗng và ghi log cảnh báo một lần. Không 500.
  3. ARC ghi một dòng ở `setParameter`, như thẻ 18.
  4. Test: lưu `2` → 422; lưu danh sách hợp lệ → báo giá thứ Sáu đòi 2 đêm; giá trị hỏng chèn thẳng DB → báo giá 200.
  5. Rà luôn các khóa dạng bậc khác (ghi chú TODO ở đầu tệp: danh sách bậc chưa được kiểm). Ghi các khóa còn thiếu vào backlog nếu không kịp.
- Trạng thái: Open

### FB-R5-BE-ARC-C0313-18
- Mức độ: Minor
- Vị trí: `platform/internal/parameter-rules.ts` 180–187 (`weekend_nights`); `setParameter` (`openapi.yaml` 1957); từ điển `product/docs/tham-so-quy-tac.md`/`.json`; plan V5-25 (BUG-R5-001).
- Vấn đề:
  - Validator chỉ nhận số 1–7 (`isInt(d) && d >= 1 && d <= 7`), báo `allowed: [1…7]`.
  - Giá trị đang chạy, `production-defaults.ts` và hai bộ tính giá (`pricing.service.ts` 165, `quote-pricing.ts` 305) dùng `Weekday[]` (`["FRI","SAT"]`).
  - Hậu quả:
    - Lưu đúng mức từ điển đề xuất → 422.
    - Lưu dạng số thì lưu được, nhưng bộ tính giá không còn nhận ra đêm cuối tuần.
    - Hiện chưa sai tiền vì `weekend_uplift_pct` = 0 %.
- Vì sao quan trọng: chủ đầu tư không chỉnh được tham số cuối tuần trên Desk. Khi mức tăng cuối tuần > 0, lưu dạng số sẽ làm mất phụ thu cuối tuần mà không báo.
- Đề xuất sửa:
  1. **0.3.13 không phải đổi schema OpenAPI.** `Parameter.value` không khai kiểu; kiểu khóa nằm ở từ điển và erd 9.1a (đều đã ghi `Weekday[]`).
  2. ARC thêm một dòng vào mô tả `setParameter`: "`weekend_nights` = `Weekday[]` (`MON`…`SUN`, không trùng, ít nhất 1); khác → 422 `PARAM_OUT_OF_RANGE` với `allowed` = 7 mã chữ". Dòng này báo cho FE biết `allowed[]` của khóa này đổi từ số sang chữ: Desk đang hiện `allowed[]` thì phải chịu được chuỗi.
  3. BE (PR V5-25, làn C): validator nhận `Weekday[]`, từ chối dạng số với `allowed` mới.
  4. Test:
     - lưu `["FRI","SAT"]` qua API tham số → 200;
     - lưu `[5,6]` → 422 có `allowed` = 7 mã chữ;
     - báo giá thử sau khi lưu vẫn coi thứ Sáu, thứ Bảy là cuối tuần (đặt `weekend_uplift_pct` thử > 0 trong test để thấy số).
  5. Giữ dặn trong release notes: không sửa ô này cho tới khi bản có V5-25 lên.
- Trạng thái: Open

---

## 4. Ước công theo làn

Đơn vị: ngày BE (một agent BE, gồm viết test và tự review). Mốc giả định:
- PR-0 gộp 07/11, có sửa chữ theo các thẻ Major;
- code xong 14/11, review chéo 15–16/11, QA 17–19/11, họp review 20/11.

| Làn | PR | Việc | Ước | Ghi chú |
|---|---|---|---|---|
| BE-A | PR-A1a: V5-10 | Hàm quy đổi chung (tóm tắt, QR, B18) 1; chặn giờ tương lai ở QR và cờ tóm tắt (thẻ 01) 0,5; `allowedActions` theo ngày đi hiệu lực, thêm ngày lịch (thẻ 09) 0,5; test T10-1…10 1 | **3** | Mục tiêu gộp 11/11 |
| BE-A | PR-A1b: V5-15 | Kiểm vai trước thân lệnh, `checkoutTime` không bắt buộc 0,5; đường quá ngày đi trong `departure()`/`decide()`/QR 1; ghi `actual_checkout_at` và registration (thẻ 03) 0,5; audit `overdue` 0,25; test và ca từ chối viết tay 0,75 | **3** | Cùng tệp `checkout.service.ts`, nên làm **sau** A1a, cùng người. Gộp 13–14/11 |
| BE-D (đề nghị chuyển) | Phần của V5-10/V5-15 ở module khác | Danh sách đi hôm nay (thẻ 02, `reporting`) 0,5; ngoại lệ minibar (`inventory` port) 0,5 | **1** | Tách khỏi BE-A để BE-A không quá tải |
| BE-A | PR-A2: V5-11 (sau DOM), V5-40, V5-43 | 1 + 0,5 + 0,5–1 | **2–2,5** | **Không** kịp 14/11 nếu BE-A làm cả A1. Đề nghị V5-40, V5-43 sang BE-D; V5-11 làm ngay sau A1b (15–16/11) hoặc dời |
| BE-B | PR-B1: V5-13 + V5-18 + V5-44 (a) + V5-16 lọc | V5-13 1; V5-18 0,5; V5-44 (a) hàm chung và 14 chỗ ném 1; V5-16 lọc, khóa audit trên dòng gốc, allowlist 1,75 | **4,25–4,5** | Bắt đầu ngay khi PR-0 gộp. Vừa |
| BE-B | PR-B2: chặn V5-16 (sau DOM) | | **1** | Sau DOM chốt luật (a) |
| BE-C | PR-C1: V5-1A + V5-44 (b) + V5-58 | V5-1A mã 0,75, test và fixtures khoảng 15 tệp 1,25; V5-44 (b) 0,25; V5-58 1,5; bootstrap `is_sellable = false` 0,25 | **4** | Chờ V5-73 gộp (khoảng 10/11). Vừa |
| BE-C | PR V5-25 | `weekend_nights` 0,5; `min_stay` (thẻ 06) 0,5 | **1** | Không chờ PR-0 |
| Sales | PR-S1: V5-14 + V5-22 | V5-14: đọc `nightlyRates`, dùng chung `PricingService.price`, snapshot, adapter `manual_agreed`, 422 trường giá ở `createHoldFromQuote`, test T14-1…7, 3,5–4; V5-22 0,5 | **4–4,5** | Vừa nhưng sát. Mục tiền rủi ro nhất; cần ARC chốt thẻ 05 trước 08/11 |
| Hoa hồng | PR-H1: V5-30 phần làm ngay | `status`, `missing[]` có lọc vai, bỏ số mặc định, bắt `ParameterMissingError`, test quét 1,5–2 | **1,5–2** | |
| Hoa hồng | PR-H2 (sau DOM + ARC bổ sung) | | **1,5** | Hạn cứng 01/12 |

Tổng:
- Đợt chạy ngay sau PR-0 (A1a, A1b, BE-D phần chuyển, B1, C1, V5-25, S1, H1): khoảng **22–23 ngày BE**.
- Kể cả phần chờ DOM (A2, B2, H2): khoảng **26 ngày BE**.

Để code xong 14/11:
- Cần **ít nhất 4 BE song song**: BE-A, BE-B, BE-C (gồm H1 sau C1, hoặc một BE riêng cho H1), BE-sales. Thêm BE-D cho phần chuyển từ BE-A.
- BE-A là làn quá tải: 6 ngày cho A1 trong cửa sổ 6 ngày 09–14/11. Chỉ kịp khi tách A1a/A1b, chuyển 1 ngày sang BE-D, và không nhận thêm V5-40, V5-43.
- BE-C: C1 (4) + V5-25 (1) + H1 (2) = 7 ngày, quá cửa sổ. Đề nghị H1 giao BE-D hoặc BE-B sau B1.

---

## 5. Điểm làm tốt (nên giữ)

- Chia PR theo module và ghi rõ phụ thuộc (V5-73 trước PR-C1, PR-B2 sau DOM). BE nhận việc không phải đoán thứ tự, ít xung đột tệp.
- Mỗi V5 có bảng test bắt buộc với số cụ thể. BE viết test từ bảng được, QA có sẵn ca hồi quy. Các thẻ trên chủ yếu là bổ sung ca, không phải viết lại.
- Giữ đúng ranh giới "không migration" cho bản v1.0.5 (QC R4 ĐK-2), và dồn mọi việc cần migration về mục 4 riêng của tài liệu.

---

## 6. Giả định BE đã dùng

- DOM sẽ xác nhận `actual_checkout_at` = giờ khách rời thật (thẻ 03). Ước công ở mục 4 tính theo hướng đó.
- Phần danh sách Hôm nay (thẻ 02) sửa ở module `reporting`, không đổi kiểu `allowedActions`.
- Không cần ESC: mọi điểm thuộc quyền ARC (chữ hợp đồng) hoặc DOM (luật nghiệp vụ), đã có trong mục chờ DOM.
- Hôm nay là thứ Sáu 06/11/2026. Agent làm cả cuối tuần, nên 09–14/11 tính là 6 ngày làm việc.

---

## 7. Đọc lại 06/11 khuya (PR #94 @ `2cb549cc`)

Round 5 · bước **Review** (đọc lại) · BE.

BE đọc:
- `gh pr diff 94`, `gh pr checks 94`;
- trên nhánh: `rounds/round-05/responses/ARC-on-contract-0.3.13-reviews.md`; `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 0, 1.14–1.24, mục 2, mục 6 (G9–G15); diff `openapi.yaml` từ `f4c40d9b` (lượt đầu) tới `2cb549cc`.

BE đối chiếu với mã `main`:
- `shared/http/auth.guard.ts`;
- `reservations/internal/allowed-actions.ts` 115, `reporting/internal/stay-actions.ts` `checkOutAction`, `reporting/internal/dashboard.service.ts` 86–125, `tonight-kpi.ts` 91;
- `reservations/public/pricing.service.ts` 255–300;
- `payments/audit-entities.ts`, `payments/internal/refunds.service.ts` 740;
- `admin/production-defaults.ts` 238–248, 486–520;
- migration 0011 (`payment`), 0040 (`payment_approval_request_check`), 0030 (`attention_event`), 0085.

Không sửa mã, không gọi staging hay production. Tệp này không có mật khẩu Wi-Fi, tỷ lệ hoa hồng, bí mật hay dữ liệu khách.

### 7.0 Kết luận: **DUYỆT CÓ ĐIỀU KIỆN** để gộp PR #94

- **21/21 thẻ C0313 đóng** (7.2). Ý `If-Match` của thẻ 21 (ARC gọi là ý 3): **BE chấp nhận lý do ARC từ chối**.
- Mã sinh khớp `openapi.yaml`, typecheck đạt (7.1).
- 2 thẻ mới, **không chặn gộp**:
  - C0313-22 (Minor): nguồn dữ liệu của `Payment.afterClosure`, `refundRequestId`; allowlist audit `payment`, `deposit_notice`;
  - C0313-23 (Suggestion, gửi ARC và SEC): nhánh so mật khẩu người gọi ở `setPropertyWifi`.
- **Điều kiện gộp duy nhất – delta ARC sắp đẩy** (G9 = giá tháng ÷ 5 theo DOM `1568e523`, bỏ các dòng "chờ DOM"). BE chấp nhận delta này **mà không đọc lại**, khi cả bốn ý sau đúng:
  1. chỉ đổi tệp `.md` và chữ `description`/changelog trong `openapi.yaml`;
  2. tệp sinh (`openapi-meta.ts`, `openapi-schemas.ts`, `api-client/src/generated/openapi.ts`, `rbac-cases.*`, `traceability.md`) không đổi, hoặc chỉ đổi ở chú thích sinh từ `description`;
  3. không đổi schema, `enum`, `required`, `x-roles`, `x-write-roles`, `x-rbac`, `x-scope`, bảng mã lỗi;
  4. CI trên HEAD mới xanh như trên `2cb549cc`.
  Delta đổi gì ngoài bốn ý trên thì ORC hỏi lại BE.
- Lịch làn phải chỉnh để kịp 14/11 (7.4). Đây là việc ORC giao làn sau khi gộp, không phải điều kiện gộp.

### 7.1 Kiểm cục bộ – worktree `git worktree add --detach … 2cb549cc` trong scratchpad, đã gỡ sau khi chạy

| Lệnh (trong `product/`) | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile --offline` | Đạt |
| `services/api`: `node scripts/gen-openapi-meta.mjs --check` | `openapi-meta.ts and openapi-schemas.ts are up to date`, exit 0 |
| `python3 tests/tools/gen_rbac_cases.py --check` | `OK – rbac-cases up to date`. Có 210 operation, 2310 ca, 21 `fieldCases` (6 × 403, 15 × pass), `rbac mismatch []` |
| `python3 tests/tools/gen_traceability.py --strict --out <scratchpad>` | exit 0; 0 operation lệch; 1 thuộc tính lệch (`email` D27, đã có trên `main`). Bản sinh **trùng byte** với `docs/qa/traceability.md` đã commit |
| `pnpm --filter @ottimo/api-client gen` | `openapi.ts up to date`, không tệp nào đổi |
| `npx turbo run typecheck --force --no-cache` | 13/13 đạt (0 cache) |
| `services/api`: `npx vitest run test/contract.test.ts` | 5/5 đạt |
| `gh pr checks 94` | 9 job đạt (contract, Redocly, unit/build, E2E smoke, gitleaks, shellcheck, landing, confidential paths, no test endpoints); 3 job deploy bỏ qua |

Gộp PR-0 **không đổi hành vi máy chủ đang chạy**:
- meta có thêm 3 operation chưa có route (`getPropertyWifi`, `setPropertyWifi`, `getManagerPerformanceBonus`), nên gọi vào trả 404 tới khi BE làm;
- `writeRoles` chưa có mã nào đọc (guard ở PR-S1);
- schema serializer của `createRoom` 201 chuyển từ `$ref Room` sang đối tượng gộp. Đã xem bản sinh: đủ thuộc tính và `x-visible-to` của `Room`, thêm `warnings`.

Lưu ý cho FE: thân `checkOut` bỏ `required: [checkoutTime]` nên kiểu sinh cho phép vắng. Máy chủ vẫn bắt buộc trường này tới khi PR-A1b gộp, nên Desk chưa được bỏ `checkoutTime`.

### 7.2 Trạng thái thẻ C0313-01…21

| Thẻ | Mức | Trạng thái | Bằng chứng trên nhánh / ghi chú |
|---|---|---|---|
| 01 | Major | **Đóng** | `checkOut` "Quy đổi giờ trả": QR `check_out` và `amountDueNow` dùng `resolveCheckoutAt`, sau giờ server + dung sai → 422 `TIME_AFTER_ACTION`; `CheckoutSummary.checkoutAtAfterNow`; T10-9 |
| 02 | Major | **Đóng** | `getArrivalsDepartures.date`, `departuresDate`; T10-10. `reporting/internal/stay-actions.ts` `checkOutAction` đã có `calendarDate` và cửa sổ sau nửa đêm, nên PR-D1 chỉ đổi tập dòng. Lưu ý: `departureRows` còn dùng ở `getTonightKpi` (`tonight-kpi.ts` 91), giữ theo ngày nghiệp vụ ở đó |
| 03 | Major | **Đóng** | `checkOut` "thời điểm ghi"; contract 1.18. Bảng test chưa có ca cho giá trị ghi: BE tự thêm trong PR-A1b (`actual_checkout_at` đơn + đăng ký, `stay_ended_at` = `checkoutAt`; `post_checkout_window_until` = giờ ghi + cửa sổ) |
| 04 | Major | **Đóng** | `listAuditEvents.removalsOnly` bổ sung 1: dòng gốc, `rootLineId`, `rootLineManual`, allowlist 4 khóa; BR-438 xét dòng gốc (T16-9) |
| 05 | Major | **Đóng** | `QuoteInput.nightlyRates`: phủ mọi đêm, giá lịch trước BR-107/BR-111, sàn–trần, `PricingService.price`, snapshot `nights[].source`; T14-7. Ghi chú cho test: B1 (`pricing.service.ts` 258–290) dùng `amountVnd` client cả với đêm `edited = false`, còn `edited` vắng thì coi là sửa. Báo giá thì lấy giá máy chủ cho mọi đêm `edited` ≠ `true`. Vì vậy T14-7 phải gửi `edited` tường minh cho mọi đêm, và đêm không sửa mang đúng giá lịch, thì oracle mới bằng nhau |
| 06 | Major | **Đóng** | `setParameter` bổ sung 1: `min_stay` theo DOM 12.1, kiểm ngược `short_stay_max_nights`, bộ đọc phòng thủ. Giá trị `production-defaults.ts` 241–247 qua được luật mới (có `channels: 'all'`, mỗi luật áp ít nhất một ngày), nên bộ đọc phòng thủ không bỏ luật nào đang chạy. PR #96 đang làm |
| 07 | Minor | **Đóng** | Bỏ câu "chỉ đổi kết quả…"; ứng viên thứ ba (ngày đi − 1, `t`) giữ hành vi hiện có; `checkoutAt` gửi thẳng ngày đi − 1 cùng điều kiện; T10-8; G10. BE chấp nhận thay cho 422 `DATE_INVALID` tạm, vì DOM V5-11 cùng hướng. Giờ gõ rất sớm vẫn bị chặn bởi `TIME_NOTE_REQUIRED` |
| 08 | Minor | **Đóng** | `createVietQr.checkoutAt` vắng → quy đổi như `checkOut`; Desk chỉ chuyển tiếp tóm tắt có gửi giờ |
| 09 | Minor | **Đóng** | Ngày đi hiệu lực cho `check_out`, cửa sổ sau nửa đêm, `overdue`; `ActionContext` thêm ngày lịch; T15-15. Cài ở PR-A1a (xem 7.5) |
| 10 | Minor | **Đóng** | Đủ 5 ý: thứ tự Idempotency → tải đơn không khóa → vai/trần → thân; `checkoutTime` tùy chọn khi có `checkoutAt`; dung sai; QR FD/FDL 403 trước 409; cổng minibar ở PR-A1b; allowlist `reservation` có `overdue` |
| 11 | Minor | **Đóng** | `lockReason` + `invoice_issued`; thu nợ trên folio mở → 409 `INVALID_TRANSITION`; `folioLocked(reason)` |
| 12 | Minor | **Đóng** | Bảng trường mở rộng: `min`, `max` ở mọi nơi (gồm `_WARNING`, B13, báo giá); B13 thêm `dates[]`, giữ `date`; T22-3 |
| 13 | Minor | **Đóng** | `depositUnverifiedVnd` = min(`depositPaidVnd`, Σ chờ đối soát); T18-4 |
| 14 | Minor | **Đóng** | `OpenRefund.reasonCode` liệt kê đủ (thêm `overbooking_relocated`, `payment_after_cancel`); T13-5 sửa ở 1.24. Bảng 1.2 dòng T13-5 còn chữ cũ, nhưng luật "1.16–1.24 thắng" đã che |
| 15 | Minor | **Đóng** | Changelog sửa; `createRoom` bổ sung 1 bootstrap `isSellable = false`; T1A-5; checklist ở 1.24. Còn một việc cho ORC: plan ĐK-6 (dòng 228) ghi `night_from_month_divisor` "còn dùng ở đường API". Sau PR-C1 câu này sai; DOM/BA sửa thành "ngừng dùng từ v1.0.5" |
| 16 | Minor | **Đóng** | `getPropertyWifi` đọc như `wifiOf`; `setPropertyWifi`: ASCII 0x20–0x7E, `WHERE id`, thực thể audit `property`; T58-7, T58-8 |
| 17 | Minor | **Đóng** | `listParameters.missing` lọc vai; bắt `ParameterMissingError`; `long_stay_commission` ở PR-M. Lưu ý cho PR-H1: bỏ `lease_terms[].commission*` thì nhánh đọc hoa hồng thuê dài phải ra `rate_missing` (không 0, không NaN). Nếu PR-M trượt khỏi v1.0.5, `missing[]` không báo hoa hồng thuê dài. Production đã có giá trị nên không đổi; chỉ seed và bootstrap mới bị ảnh hưởng. QA ghi vào ca T30-5 |
| 18 | Minor | **Đóng** | `weekend_nights` = `Weekday[]`; `erd.md` 9.1, 9.1a đã sửa |
| 19 | Suggestion | **Đóng** | `cancelScheduledRoomListPrice`: SQLSTATE `23514` + tiền tố câu, trong `SAVEPOINT`. Ca "mã cho qua, trigger chặn" là T44-3 (staging); BE thêm bản integration với đồng hồ giả |
| 20 | Suggestion | **Đóng** | Ghim `category`, `action`; loại `room`, `extra_person`, `room_change_difference`. `late_fee_as_night` không bị loại – chấp nhận, DOM chưa đòi |
| 21 | Suggestion | **Đóng** | PUT trả `passwordSet`, không `password`; `no-store` cả PUT. **Ý `If-Match`: chấp nhận từ chối.** Lý do: một mạng chung, chỉ OWN/MGR sửa, rất hiếm; PUT ghi đè trọn nên lặp lại vô hại; audit giữ `before.ssid`. Vế "buộc Desk đọc lại trước mỗi lần lưu" là lý do yếu, vì Desk vốn GET trước khi mở form. Hai lý do đầu đã đủ, và thẻ gốc chỉ là Suggestion |

### 7.3 Thẻ mới

#### FB-R5-BE-ARC-C0313-22
- Mức độ: Minor
- Vị trí:
  - `recordPayment` bổ sung 1 (A) V5-48, (B) 5B-1; `Payment.afterClosure`, `Payment.refundRequestId`;
  - `createDepositNotice` (audit `afterClosure`), `listAuditEvents.afterClosureOnly`;
  - mã `payments/audit-entities.ts`; migration 0011 (`payment`), 0040 (`payment_approval_request_check`).
- Vấn đề:
  1. Hợp đồng ghi "không migration", nhưng hai trường đọc mới không có chỗ lưu và cũng chưa nói cách tính:
     - bảng `payment` không có cột cờ hay jsonb dùng được: `qr_context` chỉ dành cho VietQR;
     - CHECK 0040 buộc `payment.approval_request_id IS NULL` khi `type <> 'refund'`, nên không dùng cột này để nối khoản thu với yêu cầu hoàn `payment_after_cancel` được;
     - yêu cầu hoàn trỏ `target_type = 'reservation'` (`refunds.service.ts` 397), không trỏ khoản thu.
     Vì hợp đồng không nói, hai BE sẽ làm khác nhau, hoặc thêm migration.
  2. Allowlist audit thiếu khóa mới:
     - `payment` hiện không có `afterClosure`, `reservationStatus`;
     - `deposit_notice` chỉ có `amountVnd`, `status`.
     Các khóa này bị bỏ âm thầm (SR-AUD-03). Khi đó `afterClosureOnly` (SEC S6) trả rỗng mà test chỉ kiểm phản hồi API vẫn xanh. Đây cùng kiểu lỗi thẻ 04 và 10. Hợp đồng đã ghi allowlist cho `folio_line` và `reservation`, nhưng chưa ghi cho `payment` và `deposit_notice`.
- Vì sao quan trọng: tới v1.0.6, bộ lọc tuần "Tiền về sau khi đơn đã đóng" là kiểm soát phát hiện duy nhất của OWN cho đường này.
- Đề xuất sửa (đều là chữ, không đổi kiểu sinh):
  1. `afterClosure` tính lúc đọc: đơn chính của folio đang `cancelled`/`no_show`, và `payment.created_at` ≥ `cancelled_at`/`no_show_marked_at`. Ghi rõ: nếu đơn được khôi phục sau đó (B12 no-show, 5B-2) thì cờ đọc thành `false`; audit giữ giá trị lúc ghi. Nếu cần giữ cờ cố định, thêm cột ở migration của 5B-2 (0.3.14).
  2. `refundRequestId`: giữ trường trong schema nhưng ghi "chưa trả tới 0.3.14". Tới đó Desk tìm yêu cầu qua `openRefunds` (`reasonCode = payment_after_cancel`) và màn duyệt. Cột thêm ở migration 5B-2. Nếu ARC muốn trả ngay ở v1.0.5 thì đọc từ audit `payment.recorded` (`after.refundRequestId`, index `audit_event_entity_idx`), và thêm khóa này vào allowlist.
  3. Ghi vào mô tả `recordPayment`, `createDepositNotice`:
     - allowlist `payment` thêm `afterClosure`, `reservationStatus`;
     - allowlist `deposit_notice` thêm `afterClosure`;
     - test đọc lại `audit_event`;
     - test `afterClosureOnly` có đúng một dòng cho ca h1 của QA.
  4. BE làm ý 1 và ý 3 trong PR V5-48, ghi decision-log; ARC chỉ cần xác nhận cách tính ở ý 1 (gộp vào delta tài liệu được).
- Hạn: ý 1 và ý 3 trước khi PR V5-48 viết đường đọc (khoảng 08/11); ý 2 trước khi PR-B3 bắt đầu.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-23
- Mức độ: Suggestion – gửi ARC và SEC (SEC ARC-04 (b) đề xuất luật này)
- Vị trí: `setPropertyWifi` bổ sung 1, mục "Kiểm `password`" (so với mật khẩu đăng nhập của người gọi, argon2, không đếm khóa); contract 1.23, T58-9.
- Vấn đề:
  - Luật chỉ so với chính người gọi, nên không dò được mật khẩu người khác. Nhưng người cầm một **phiên** OWN/MGR bị lộ, không biết mật khẩu, lại dò được mật khẩu của chủ phiên: gửi mật khẩu đoán, nhận 422 `NOT_ALLOWED` là đoán đúng.
  - Nhánh này không đếm khóa, không có 429, không step-up.
  - Đoán sai thì Wi-Fi bị ghi đè và có audit, tức là có tiếng động. Nhưng GET trả mật khẩu cũ, nên kẻ dò ghi trả lại được sau mỗi lần đoán.
- Vì sao quan trọng: phiên lộ thành mật khẩu lộ. Luật này qua mặt bộ khóa đăng nhập.
- Đề xuất sửa: SEC chọn một trong hai:
  - đếm lần so này vào bộ đếm sai của người dùng, chỉ chặn phép so, không khóa tài khoản;
  - giới hạn N lần mỗi giờ mỗi người; vượt thì bỏ qua phép so và ghi audit `security`.
  Không đổi kiểu sinh.
- Hạn: trước khi PR V5-58 viết nhánh so mật khẩu.
- Trạng thái: Open

### 7.4 Bổ sung 1/1b/1c so với ước công và các làn (cập nhật mục 4)

Mốc: PR-0 gộp sáng 07/11. Làn chỉ chờ PR-0 có cửa sổ 07–14/11, tức 8 ngày (agent làm cả cuối tuần). PR-C1 chờ V5-73 (khoảng 10/11), còn 5 ngày.

| Làn | PR | Việc thêm do bổ sung 1/1b/1c | Ước cũ → mới (ngày BE) | Dự kiến | Vừa 14/11? |
|---|---|---|---|---|---|
| BE-A1 | PR-A1a (V5-10) rồi PR-A2 (V5-11) | Ứng viên thứ ba và `checkoutAt` ngày đi − 1 (07) 0,5; nhận cả phần `allowed-actions.ts` của thẻ 09 0,5; bỏ thẻ 02 (sang D1) | A1a 3 → **3,5**; A2 **1** | A1a 07–10/11; A2 11–12/11 | Vừa |
| BE-A2 | PR-A1b (V5-15) | Trần MGR, `nightsNotBilled`, `requiredRole` 0,5; `overdueOnly` 0,25; D12c cho `overdueReason` 0,1; `CheckoutSummary.nightsNotBilled`, `AllowedAction.overdue` 0,25; cổng minibar quay về A1b 0,5; H-01…H-04 0,25; test thẻ 03 0,25 | 3 → **5** | 08/11 (sau commit đầu của A1a) → 13–14/11 | Vừa sát, **chỉ khi là người thứ hai**. Một người làm cả A1a, A1b, A2 thì mất 9,5 ngày, không vừa |
| BE-D | PR-D1 rồi PR-B3 (5B-1, ORC giao `d2a710e9`) | D1: V5-40 0,5, V5-43 1, `departuresDate` 0,5. B3 theo SEC S1–S8, ARC-15: hoàn tự tạo, `origin_actor_ids`, nơi nhận cố định 1; `setRefundDestination`/`executeCashRefund` 409 0,25; `possibleDuplicateCodes` 0,5; `bankReference` + khóa tư vấn + 5 điều kiện ARC-15 0,5; trần S5 0,25; `createDepositNotice` 202 + `deposit_after_cancel` + đóng mục + S8 0,75; `afterClosureOnly` 0,25; test 1 | D1 **2**; B3 **4–4,5** (plan ghi 2,5–3) | D1 07–08/11; B3 10/11 (sau V5-48) → 14–15/11 | D1 vừa. B3 trượt khoảng 0,5 ngày; áp dòng cắt của plan (bỏ `deposit_after_cancel`, 0,75) thì vừa |
| BE-B | V5-48 (PR riêng) → PR-B1 → PR-B2 | V5-48 1,5 + hết hạn QR `pending` trong giao dịch hủy (J1, B5, B10, B11) 0,5 + thẻ 22. B1 thêm `reductionsOnly` 0,25. B2: 403 trên dòng gốc dưới khóa L3 0,75; `lineReductions` 0,5; `line_reduction_count` 0,25; `entered_in_error` 0,1; T16-6…12 0,5 | V5-48 **2**; B1 4,5 → **4,75**; B2 1 → **2** | V5-48 07–08/11, gộp 09–10/11; B1 09–13/11; B2 14–15/11 | **Không vừa** (8,75 ngày trong 8). Xem đề xuất (a) |
| BE-C | PR-C2 (#96) rồi PR-C1 | C2: luật lưu DOM 12.1 đủ, kiểm ngược `short_stay_max_nights` cả giá trị đã lên lịch, bộ đọc phòng thủ 3 chỗ. C1: cảnh báo `NIGHTLY_PRICE_UNUSUAL` 0,25; V5-58 bổ sung (byte `ssid`, trùng tên đăng nhập, so mật khẩu người gọi, `no-store` PUT, `passwordSet`) 0,5 | C2 1 → **2–2,5**; C1 4 → **4,75** | C2 07–09/11, gộp 10/11; C1 10–15/11 | C2 vừa; C1 trượt khoảng 1 ngày. Xem đề xuất (b) |
| BE-S | PR-S1 (V5-14, V5-22, guard) | Guard chung `x-write-roles` (khớp `a`, `a.b`, `a[].b`; `null`/mảng rỗng tính là có gửi; nối với tra replay của `auth.guard.ts`) 1; test chạy `fieldCases` 0,25; chỉ kênh `direct`/`agent`, đêm `edited` ≠ `true`, T14-8…12 0,5; H-05…H-07 0,25 | 4–4,5 → **6–6,5** | 07/11 → 13/11 | **"≤ 08/11" không làm được** – xem đề xuất (c) |
| BE-H | PR-H1, rồi PR-M | H1 không đổi (thêm nhánh `rate_missing` cho `lease_terms`). PR-M: migration 0,5; `long_stay_commission` 2 đợt + `voidReason` 1,5; `getManagerPerformanceBonus` 1; `commission_rate_missing` 0,5; `long_stay_cleaning_fee_by_room` + `feeFallback` 0,75; test 0,75 | H1 **1,5–2**; PR-M **5** | H1 07–08/11; còn trống 09–14/11; PR-M sau 14/11, trước 01/12, chờ V5-61 | H1 vừa, **còn 6 ngày trống** |

Tổng việc trong v1.0.5 (không tính PR-M, 5B-2): khoảng **40 ngày BE**. Lượt đầu ước 22–23 ngày; phần tăng đến từ V5-48, 5B-1, guard `x-write-roles`, trần MGR, luật lưu `min_stay` và BR-438. Bảy người (A1, A2, B, C, D, S, H) × 8 ngày = 56 ngày, nên **đủ người nếu chia lại**. Vướng là phân bổ, không phải tổng sức.

Đề xuất cho ORC (đều không đổi hợp đồng):
- (a) BE-B làm theo thứ tự V5-48 → **phần lọc của B1** (V5-16 lọc, `reductionsOnly`, khóa audit dòng gốc, allowlist; khoảng 2 ngày, gộp khoảng 11/11) → phần còn lại của B1. **PR-B2 giao BE-H** sau PR-H1, bắt đầu khi phần lọc gộp. Nếu vẫn giữ PR-B2 ở BE-B thì dời `lineReductions` sang v1.0.6 (hợp đồng mục `ShiftReport.lineReductions` cho phép), B2 còn 1,25 ngày, nhưng vẫn sát.
- (b) Tách **V5-58** khỏi PR-C1 thành PR riêng, giao BE-H. V5-58 không chờ V5-73, làm được từ 09/11. PR-C1 còn khoảng 2,75 ngày, kịp 10–13/11. (Plan dòng 240 có câu "V5-57, 58, 68 phần máy chủ" ngay sau câu giao việc BE-B, còn contract mục 2 để V5-58 ở PR-C1. ORC chốt một chỗ.)
- (c) PR-S1 "≤ 08/11" (plan dòng 207, contract mục 2): hạn ≤ 08/11 của thẻ 05 là hạn để **ARC sửa chữ trước khi BE-S viết**, và đã đạt. Đó không phải hạn gộp. Đề xuất mục tiêu gộp **13/11**, guard là commit đầu. Đồng ý với ARC mục 7: không cho V5-14 lên mà thiếu chặn SAL/CTV.
- (d) BE-A cần **hai người** như contract mục 2 (BE-A1, BE-A2). Plan dòng 208 ghi "PR-A1a rồi PR-A1b (BE-A)", nếu một người thì không vừa.
- (e) **V5-1B** (tin `hold_expired`, bắt buộc, hạn 14/11) chưa có làn ở contract mục 2 lẫn plan dòng 208. Đề xuất giao BE-D trong PR-D1 (0,5 ngày).

### 7.5 Mỗi làn bắt đầu được ngay sau khi gộp chưa

| Làn / PR | Bắt đầu ngay? | Cần trước khi bắt đầu, hoặc trong lúc làm |
|---|---|---|
| PR-A1a | **Có** | ORC chốt chủ tệp: A1a giữ `readInput`, `resolveCheckoutAt` và toàn bộ `reservations/internal/allowed-actions.ts` (ngày lịch, cửa sổ W, `stayDepartureDate`). Quy tắc W tách thành một hàm dùng chung với `reporting/internal/stay-actions.ts` `checkOutAction` (đã có `calendarDate`), và hàm "ngày lịch tối thiểu" cho B16 |
| PR-A1b | **Có**, với người thứ hai | Cắt nhánh từ nhánh PR-A1a sau commit đầu (hàm quy đổi + `readInput`); cập nhật bằng merge, không rebase; gộp sau A1a. A1b chỉ thêm nhánh `overdue` trên phần của A1a. ORC nêu tên người giữ module inventory để review cổng minibar. BE tự thêm test thời điểm ghi (thẻ 03) |
| PR-A2 (V5-11) | Sau PR-A1a | Hợp đồng đủ (1.21) |
| PR-D1 | **Có** | Giữ `getTonightKpi` theo ngày nghiệp vụ (`departureRows` dùng chung). Nhận V5-1B nếu ORC giao |
| V5-48 (PR riêng) | **Có** | Thẻ 22 ý 1, 3 (BE tự làm, ARC xác nhận cách tính `afterClosure`); thứ tự 404 trước 409 theo SEC ARC-17 |
| PR-B1 | **Có** | – |
| PR-B2 | Sau phần lọc của PR-B1 | Hợp đồng đủ (1.20). Người làm theo đề xuất (a) |
| PR-B3 (5B-1) | Sau khi V5-48 gộp | Thẻ 22 ý 2 (`refundRequestId`); 5 điều kiện `bankReference` của SEC ARC-15; `ApprovalRequest.possibleDuplicateCodes` thêm `x-visible-to` (SEC ARC-16) |
| PR-S1 | **Có** | Dời hạn gộp (đề xuất (c)). Viết T14-7 theo ghi chú thẻ 05 |
| PR-C2 | **Đang làm** (#96), không chờ PR-0 | – |
| PR-C1 | Chờ V5-73 | G9 theo DOM `1568e523` (÷ 5, so số nguyên) sau delta của ARC; nếu tách V5-58 thì theo đề xuất (b); ĐK-6 của plan sửa chữ (thẻ 15) |
| V5-58 | **Có** (nếu tách) | Thẻ 23 do SEC chốt trước nhánh so mật khẩu; dòng rbac đọc Wi-Fi cho FD vẫn chờ BA, tới đó FD → 403 (T58-4) |
| PR-H1 | **Có** | Nhánh `lease_terms[].commission*` vắng → `rate_missing` (thẻ 17) |
| PR-M | Viết được; **chưa gộp được** | Chờ V5-61. BA cần thêm dòng rbac cho `getManagerPerformanceBonus` (operation chưa có `x-rbac`). QA: nếu v1.0.5 lên không có PR-M, bỏ ca rbac R5 của operation này |

### 7.6 Giả định đã dùng

- PR-0 gộp sáng 07/11 sau delta tài liệu của ARC; agent làm cả cuối tuần.
- Phần lọc của PR-B1 gộp trước được mà không cần V5-13, V5-18 (khác tệp: `folio-lines.service.ts`, module audit).
- `afterClosure` tính lúc đọc là đủ cho v1.0.5, vì 5B-2 (khôi phục) ở v1.0.6.
- Không cần ESC: các điểm mới thuộc quyền ARC (chữ hợp đồng), SEC (thẻ 23) hoặc ORC (giao làn).

### 7.7 Đọc lại delta bổ sung 1d (`2cb549cc..45d42368`)

**Kết luận delta: DUYỆT.** ORC gộp khi job `format · lint · audit · test · build` (đang chạy lúc đọc) và E2E smoke trên `45d42368` xanh.

Delta không chỉ đổi tài liệu, nên điều kiện (3) ở 7.0 không áp được. BE đã đọc riêng commit ARC `45d42368`, bỏ qua hai commit gộp `main` (`1f430c39`, `b96203e4`). Phần sản phẩm do hai commit gộp mang vào: `rbac-matrix.json`/`.md` 0.2.8 của BA, `business-rules.md`, `state-machines.md`, `release-notes.md`.

| Đổi | BE đánh giá |
|---|---|
| `getPropertyWifi`: `x-rbac` S24 → S36, `x-roles` thêm `front_desk` (BA rbac 0.2.8 ghi chú 47; SEC ARC-10) | Đúng với DOM 7.5. Meta đổi đúng 2 dòng (`roles`, `rbac`). `rbac-cases` đổi đúng 11 dòng của operation này: FD và FD ∪ SAL thành 2xx; HK, MT, SAL, CTV vẫn 403. T58-4 đã sửa thành FD → 200. Dòng V5-58 ở 7.5 ("FD → 403 tới khi BA có dòng") không còn đúng: PR V5-58 làm theo S36 |
| `getManagerPerformanceBonus` `x-rbac: [A120]` | Meta `rbac: []` → `['A120']`. `rbac-cases` đổi 11 dòng, chỉ ở cột mã rbac; vai và kết quả mong đợi không đổi. Việc "BA cần dòng rbac" ở 7.5 (PR-M) đã xong; PR-M chỉ còn chờ V5-61 |
| `screens.ts`: `Me.screens` thêm S36 cho OWN, MGR, FDL, FD | Mã chạy đổi: `getMe` trả thêm `S36` cho bốn vai này. Test `be-d-r3-s1-units.test.ts` ("SCREENS_BY_ROLE = rbac-matrix.md section 3") đạt với ma trận 0.2.8. Desk chưa có màn S36 (mock `seed.ts` tới S35); mã màn lạ không làm vỡ gì. Khi làm màn Wi-Fi, FE-A thêm S36 vào mock |
| G9: cảnh báo khi giá đêm × 30 < giá tháng hoặc giá đêm × 5 > giá tháng; so số nguyên, đúng bằng biên không cảnh báo, hằng số | Chỉ mô tả. Cài đặt rõ (nhân, không chia, nên không có lỗi làm tròn). Áp ở PR-C1 |
| `nightsNotBilled` theo ngày nghiệp vụ lúc bấm, cả `dryRun` | Chỉ mô tả, khớp cách BE đã ước ở 7.4 |
| Tên hành động SM-01 B19 = `restore_hold`, thân `restoreHold` chỉ có từ 0.3.14 | Chỉ mô tả, không ảnh hưởng v1.0.5 |

Kiểm cục bộ trên worktree tách ở `45d42368` (đã gỡ):

| Lệnh | Kết quả |
|---|---|
| `gen-openapi-meta.mjs --check` | Đều cập nhật, exit 0 |
| `gen_rbac_cases.py --check` | OK. 210 operation, 2310 ca (2xx 1108 → 1110, 403 857 → 855), 21 `fieldCases`, `rbac mismatch []` |
| `gen_traceability.py --strict` | exit 0; 0 operation lệch; 1 thuộc tính lệch có sẵn (`email` D27). Bản sinh trùng byte với `traceability.md` trên nhánh |
| `pnpm --filter @ottimo/api-client gen` | `openapi.ts up to date`, không đổi tệp |
| `turbo run typecheck --force --no-cache` | 13/13 (0 cache) |
| `vitest run` `be-b-units`, `be-d-r3-s1-units`, `contract` | 3 tệp, 70/70 |
| `gh pr checks 94` lúc đọc | 7 job đạt, `format · lint · audit · test · build` đang chạy; `MERGEABLE` |

Thẻ: delta không mở lại thẻ C0313 nào. C0313-22 và 23 vẫn mở, ORC đã chuyển ARC và SEC. Delta không chạm hai thẻ này: nhánh so mật khẩu vẫn chỉ ở `setPropertyWifi` (OWN, MGR); FD chỉ thêm quyền đọc.

Làn BE: BE ghi nhận các quyết định ORC chốt sau 7.4–7.5:
- PR-A1a giữ `readInput`, `resolveCheckoutAt` và toàn bộ `allowed-actions.ts`;
- PR-A1b giao người thứ hai, cắt nhánh từ A1a, cập nhật bằng merge;
- V5-1B vào PR-D1;
- PR-B2 sang BE-H sau phần lọc V5-16 của PR-B1;
- V5-58 tách khỏi PR-C1, giao BE-H;
- PR-S1 mục tiêu gộp 13/11, guard là commit đầu;
- PR-M chỉ gộp khi V5-61 đạt.

Các quyết định này không đổi ước công ở 7.4.

### 7.8 Bổ sung 1e @ `f9a1b062` (PR #104, nhánh `r5-contract-0313e`)

Round 5 · bước **Review** (đọc nhanh, chỉ chữ) · BE · 07/11/2026.

BE đọc:
- `gh pr view 104`, `gh pr checks 104`;
- diff `ab1fc4ae..f9a1b062` (2 commit ARC `30566c02`, `f9a1b062`; gốc là `main` @ `ab1fc4ae`), 5 tệp: `openapi.yaml`, `erd.md` 9.1a, `api-client/src/generated/openapi.ts`, `contract-0.3.13.md` (1.24, 1.25, mục 5), `ARC-on-contract-0.3.13-reviews.md` mục 7.

BE đối chiếu với mã `main`:
- `audit/public/audit-fields.ts`, `payments/audit-entities.ts`, `src/audit-entities.ts`;
- `events/internal/attention.service.ts` 100–141, `events/public/events.service.ts` 110, 219;
- `payments/internal/payments.service.ts` 521–536 (`confirmReceived`), 972–1014 (`createVietQr`);
- `payments/internal/refunds.service.ts` 668–676, 761, `refunds.controller.ts` 232, `shared/validation.ts` 42–60 (`containsCardNumber`);
- `identity/public/password-reauth.ts` 40–80, `identity/public/rate-limiter.ts`, migration 0013, 0055, 0086;
- `public-site/internal/website-request-rules.ts` 250, `public-booking.service.ts` 417;
- nhánh PR #96 `r5-v5-25` @ `897ff46e`: `parameter-rules.ts` 72–86, 303–321, `parameters.service.ts` 237, `parameter-shapes.ts`.

Không sửa mã, không gọi staging hay production. Tệp này không có mật khẩu, bí mật hay dữ liệu khách.

#### 7.8.0 Kết luận: **DUYỆT** để gộp PR #104

- Đủ cả bốn điều kiện của 7.0 (7.8.1).
- Không mở lại thẻ C0313 nào:
  - C0313-22 **đóng phần chữ**, BE làm theo 7.8.2;
  - C0313-23 **đóng phần chữ**, phần nơi lưu bộ đếm chuyển sang thẻ 24.
- 2 thẻ mới, **không chặn gộp**:
  - C0313-24 (Minor, SEC + ARC): nơi lưu bộ đếm SR-RL-10 và mã SR-RL-10 bị dùng trùng. Hạn: trước khi PR V5-58 viết bộ đếm;
  - C0313-25 (Minor, SEC + ARC): luật số thẻ V-09 bắt nhầm `bankReference`. Hạn: trước khi PR-B3 viết kiểm `bankReference`.

#### 7.8.1 Bốn điều kiện delta chữ – kiểm trên worktree tách ở `f9a1b062` trong scratchpad (đã gỡ)

| Điều kiện | Kết quả |
|---|---|
| (1) Chỉ `.md` và chữ `description`/changelog | **Đạt.** Ngoài `openapi.yaml` và `openapi.ts`, chỉ đổi 3 tệp `.md`. So `openapi.yaml` sau khi bỏ mọi khóa `description`: **0 chỗ khác**. `description` đổi ở 12 chỗ: `info` (changelog (n)); `Payment.afterClosure`, `Payment.refundRequestId`, `PaymentCreate.bankReference`; `createDepositNotice`, `setPropertyWifi`, `createVietQr`, `cancelScheduledParameter`, `confirmPaymentReceived`, `setParameter`, `recordPayment`; tham số `afterClosureOnly` của `listAuditEvents` |
| (2) Tệp sinh không đổi, hoặc chỉ đổi chú thích | **Đạt.** `openapi-meta.ts`, `openapi-schemas.ts`, `rbac-cases.*`, `traceability.md` không có trong diff. `openapi.ts`: +46/−7, mọi dòng đổi đều là JSDoc (`*`, `/**`, `*/`). `gen-openapi-meta.mjs --check`: "up to date", exit 0. `gen_rbac_cases.py --check`: OK, 210 operation, 2310 ca (2xx 1110, 401 345, 403 855), 21 `fieldCases`, `rbac mismatch []`. `pnpm --filter @ottimo/api-client gen`: `openapi.ts up to date`, worktree sạch. Ngoài yêu cầu: `gen_traceability.py --strict` exit 0, bản sinh **trùng byte** với `docs/qa/traceability.md` |
| (3) Không đổi schema, `enum`, `required`, `x-roles`, `x-write-roles`, `x-rbac`, `x-scope`, bảng mã lỗi | **Đạt.** Đã có ở (1): ngoài `description` không khác gì. Mã nhắc tới đều đã có: `CARD_NUMBER_DETECTED` (bảng mã dòng 154), `NOT_ALLOWED`, `DUPLICATE_BANK_REFERENCE`, `PARAM_OUT_OF_RANGE` và các mã trường |
| (4) CI xanh | **Đạt.** `gh pr checks 104`: 9 job đạt (contract, Redocly, format · lint · audit · test · build, E2E smoke, gitleaks, shellcheck, landing, confidential paths, no test endpoints); 3 job deploy bỏ qua. `MERGEABLE` |

#### 7.8.2 Chữ chạm làn BE – đối chiếu mã

| Mục | BE đánh giá | Việc cho làn (không đổi hợp đồng) |
|---|---|---|
| **C0313-22: allowlist bắt buộc, lọc theo audit lúc ghi** | Đúng đề xuất của thẻ. Không cần migration: `reservation.cancelled_at`, `no_show_marked_at` có từ 0013; `attention_event.kind` không có CHECK DB (0055 dòng 9). `afterClosureOnly` lọc `after.afterClosure = true` trên tập `action` ghim sẵn. Nhờ vậy chuỗi "hủy → ghi muộn → khôi phục" vẫn còn trong bộ lọc | BE-B: thêm `afterClosure`, `reservationStatus` vào allowlist `payment` ở `payments/audit-entities.ts`. Tệp này không import Nest và đã nạp ở cả api lẫn worker qua `src/audit-entities.ts`. `afterClosure` lúc đọc tính ngay trong câu đọc khoản thu (nối folio → đơn chính), không N+1. Test đọc lại `audit_event` |
| **Audit `attention_event.resolved` khi đóng `deposit_after_cancel`** (ARC: BE làm ở PR V5-48) | Làm được, nhưng **lệch làn**: mục `deposit_after_cancel` chỉ sinh ở PR-B3 (5B-1, contract mục 2 dòng 746). Trên `main` chưa có mã nào sinh mục này (`deposit_after_cancel` chỉ có trong danh sách kind ở `events.service.ts` 110). Nếu làm ở V5-48 thì thành mã chưa có nguồn: ca "đóng bằng Không thấy tiền có trong bộ lọc" phải chèn dòng thẳng vào DB. Nếu PR-B3 áp dòng cắt của plan (bỏ `deposit_after_cancel`) thì phần audit này thành mã chết. Ngoài ra, `resolve()` (`attention.service.ts` 100–141) hiện không ghi audit và chỉ bắt ghi chú khi mục `critical`. Chữ hợp đồng thì đòi "Không thấy tiền" **có ghi chú bắt buộc** | **Đề xuất ORC:** chuyển audit `attention_event.resolved` và allowlist `attention_event` (`kind`, `afterClosure`) sang **PR-B3**, cùng nơi sinh mục. V5-48 giữ allowlist `payment` và audit `payment.recorded`. Thực thể mới đặt ở `events/audit-entities.ts` không import Nest, nạp ở `src/audit-entities.ts` (nếu không, `worker-audit-registry.test.ts` báo lệch). Ghi chú bắt buộc theo kind `deposit_after_cancel`. Audit không chứa `resolution_note` (chữ tự do) |
| **ARC-17: 404 trước 409** | Khớp mã hiện có. `confirmReceived`: 404 ở `scopedReservation` (dòng 533) và ở nhánh SAL không phải cọc (534). `createVietQr`: 403 (998, 1000) → 404 (1008–1010). 409 đơn đã đóng chèn ngay sau 404: trước `assertHoldOpenForSales` (536), trước luật `check_in`/`check_out` (1014) | **Giả định BE:** kiểm dạng thân không cần DB (`note`, `receivedAt`, `amountVnd`, `purpose = billing_period`, `overBalanceReason`) giữ chỗ hiện nay, tức trước 404. "Mọi kiểm khác" hiểu là các kiểm cần đơn, folio hoặc khoản thu. QA không viết ca "đơn đã hủy + thân sai dạng → 409". Ca SAL → 404 không có `reservationStatus` viết ở PR-B1 |
| **ARC-15: `bankReference`** | Chuẩn hóa không mâu thuẫn mẫu `^[A-Za-z0-9./_-]{1,64}$`: bỏ khoảng trắng ở controller trước khi so mẫu, như `refunds.controller.ts` 232. Khoản thu trước PR-B3 không có `bank_reference` (trường lạ bị từ chối), nên không phải chuẩn hóa dữ liệu cũ. Sáu đường `PaymentCreate` đều qua `recordInTx` (SEC 5.3), nên chỉ kiểm ở một chỗ. 409 không có `duplicateReservationCode` cho người không có vai FD+ là một nhánh trong bộ dựng lỗi | Kiểm số thẻ: xem **thẻ C0313-25** |
| **1.24: kiểm hai chiều `min_stay` ↔ `short_stay_max_nights` theo khoảng hiệu lực** | **Khớp PR #96 @ `897ff46e`**. `valuesDuringOwnRow` lấy giá trị khóa kia đang hiệu lực ở `effectiveFrom`, cộng các dòng đã lên lịch sau đó và trước dòng kế tiếp của chính khóa đang lưu. `min_stay`: `max` = min(7, nhỏ nhất). `short_stay_max_nights`: `min` = `nights` lớn nhất. Bảng 9.1a khớp `parameter-shapes.ts`: phần trăm 2 chữ số thập phân, `cancel_policy_direct` không rỗng, `max_open_holds_per_user` đủ hai vai, `lease_terms` 1–12 kỳ | (a) Lưu ý cho QA: kiểm ngược trả `errors[0].code = VALUE_OUT_OF_RANGE` kèm `min` (`parameter-rules.ts` 320). Câu "luật số cũ giữ `PARAM_OUT_OF_RANGE`" không áp cho trường hợp này, vì đây là luật chéo mới. (b) Suggestion cho BE-C: chưa có khóa giữa hai khóa. Hai người lưu `min_stay` và `short_stay_max_nights` cùng lúc có thể cùng qua, vì giao dịch nào cũng chưa thấy dòng của bên kia. Thêm `pg_advisory_xact_lock(hashtextextended('param-cross:' \|\| property_id, 0))` khi lưu khóa có luật chéo, ghi decision-log. (c) `cancelScheduledParameter` chưa kiểm lại (0.3.14). Hủy dòng `short_stay_max_nights` đã lên lịch có thể để `min_stay` vượt trần trong một khoảng ngày. Đề xuất PO/DOM thêm một dòng release notes v1.0.5 cho OWN/MGR |
| **SR-RL-10 cho V5-58** | Làm được, theo mẫu `password-reauth.ts`: bộ đếm và audit ghi ở giao dịch riêng, commit trước khi ném lỗi. Thứ tự: mọi kiểm dạng (`ssid`, `password`), rồi đọc mật khẩu Wi-Fi đang lưu, rồi mới so khi giá trị khác. Đếm cả lần bị bỏ qua, nên audit `wifi_password_check_skipped` chỉ ghi lúc đếm chạm 6, đúng một lần mỗi cửa sổ | Nơi lưu bộ đếm: xem **thẻ C0313-24**. Ước công V5-58 +0,25 ngày (bộ đếm và T58-11…13) |

#### 7.8.3 Thẻ mới

##### FB-R5-BE-ARC-C0313-24
- Mức độ: Minor – gửi SEC (SR-RL-10), ARC (một câu ở mô tả `setPropertyWifi`, đưa vào 0.3.14)
- Vị trí:
  - `setPropertyWifi`, khối "Bổ sung 1e": "cùng nơi lưu với bộ đếm xác nhận lại (SR-RL-02) nhưng khóa đếm riêng";
  - `security-requirements.md` dòng 230;
  - `ADR-014-landing-site.md` dòng 629;
  - mã `public-site/internal/website-request-rules.ts` 250, test `be-d-r3-s1-units.test.ts` dòng 4.
- Vấn đề:
  1. **Nơi lưu.** SR-RL-02 không phải bảng đếm theo khóa. Nó là hai cột trên `app_user` (`approval_pin_failed_count`, `approval_pin_locked_until`; `password-reauth.ts` 40–66, `db/schema/identity.ts` 49–50). Đọc đúng chữ "cùng nơi lưu, khóa đếm riêng" thì phải thêm cột vào `app_user`, tức là có migration. Như vậy trái câu "không migration" của 1e và phải chờ V5-61 (QC R4 ĐK-2). Trong khi đó, PostgreSQL đã có bảng đếm theo khóa, cửa sổ cố định: `rate_limit_counter` (0086). Bảng này UPSERT nguyên tử (`public-booking.service.ts` 417), có job dọn `public_site.cleanup`, đã cấp quyền `ottimo_app`, ngoại lệ RLS có ghi (khóa chỉ chứa mã luật + id).
  2. **Mã luật trùng.** ADR-014 dòng 629 đã đặt SR-RL-10…13 cho endpoint công khai. Mã đang dẫn SR-RL-10 cho khóa IP của form công khai (`website-request-rules.ts` 250 "IP keys (SR-RL-10/11 …)", `be-d-r3-s1-units.test.ts` "IP buckets (SR-RL-10)"). `security-requirements.md` chưa từng có dòng SR-RL-10…13 cho trang công khai, và nay SR-RL-10 là luật Wi-Fi.
- Vì sao quan trọng: người làm V5-58 theo chữ sẽ viết migration (bị chặn bởi V5-61), hoặc để bộ đếm trong RAM như `RateLimiter` (sai SR-RL-10). Mã luật trùng thì QA và traceability dẫn sai luật.
- Đề xuất sửa:
  - BE-H dùng `rate_limit_counter`:
    - `bucket_key` = `wifi_pw_cmp:<user_id>`, chỉ có id, đúng điều kiện của 0086;
    - `window_start` = đầu cửa sổ 24 giờ cố định, `expires_at` = cuối cửa sổ;
    - `INSERT … ON CONFLICT DO UPDATE … RETURNING count` ở giao dịch riêng.
    Không migration, ghi decision-log. ARC đổi chữ ở 0.3.14 thành "PostgreSQL (`rate_limit_counter`), khóa đếm riêng", thay cho "cùng nơi lưu với SR-RL-02". SEC xác nhận một dòng.
  - SEC chọn một trong hai: đổi số luật Wi-Fi sang số chưa dùng (ví dụ SR-RL-14), hoặc ghi SR-RL-10…13 công khai vào bảng rồi đánh số lại. ARC theo ở 0.3.14 (chỉ chữ). BE sửa chú thích trong mã khi chạm tệp.
- Hạn: trước khi PR V5-58 viết bộ đếm. Không chặn gộp #104.
- Trạng thái: Open

##### FB-R5-BE-ARC-C0313-25
- Mức độ: Minor – gửi SEC (luật V-09 cho trường mã tham chiếu), ARC (chữ), BE-B (PR-B3)
- Vị trí:
  - `recordPayment` (B), khối "Bổ sung 1e (SEC ARC-15)": "chuỗi giống số thẻ → 422 `CARD_NUMBER_DETECTED` … như `executeRefund`";
  - `PaymentCreate.bankReference`;
  - mã `shared/validation.ts` 42–60, `payments/internal/refunds.service.ts` 668–676, 761–762.
- Vấn đề:
  - `containsCardNumber` (luật gốc V-09) thử **mọi cửa sổ 13–19 chữ số, ở mọi vị trí**, qua Luhn. Hợp với chữ tự do, nhưng bắt nhầm nhiều với mã giao dịch.
  - BE mô phỏng đúng luật gốc trên dãy số ngẫu nhiên, 20.000 mẫu mỗi độ dài, chưa tính `looksLikeCard`. Tỉ lệ bị chặn: 12 chữ số trở xuống 0 %; 13 → 9,9 %; 14 → 27,5 %; 15 → 46,7 %; 16 → 65,0 %; 18 → 88,7 %. Mã giao dịch ngân hàng nào có phần số dài từ 13 chữ số trở lên sẽ bị 422 khá thường, dù không phải số thẻ.
  - Ở `PaymentCreate`, trường này tùy chọn. Lễ tân gặp 422 sẽ bỏ trống, và khoản đó mất chặn trùng S4 mà không ai biết.
  - Ở `executeRefund` (đang chạy), `bankReference` **bắt buộc** khi chi chuyển khoản (`refunds.service.ts` 761). Nếu mã bị bắt nhầm, MGR/OWN không ghi được lệnh chi, trừ khi sửa mã đi. BE chưa thấy báo lỗi production nào; xác suất như trên.
- Vì sao quan trọng: thao tác tiền bị chặn nhầm, hoặc người dùng bị đẩy tới chỗ bỏ trống hay sửa mã, làm chặn trùng mất tác dụng.
- Đề xuất sửa (SEC chọn):
  - (a) Luật riêng cho trường mã tham chiếu (`bankReference` ở cả `PaymentCreate` và `executeRefund`): chỉ chặn khi **toàn bộ giá trị**, sau khi bỏ `.` `/` `_` `-`, là 13–19 chữ số và qua Luhn (cộng `looksLikeCard` trên toàn giá trị). Mã có chữ, hoặc dãy số ngoài 13–19 chữ số, không bị chặn. Với mã toàn số 13–19 chữ số, tỉ lệ nhầm còn khoảng 10 %. Hàm đặt ở `shared/validation.ts`, cạnh `containsCardNumber`.
  - (b) Giữ luật chung và chấp nhận tỉ lệ trên: release notes ghi cách làm; UXD có câu cho 422 ở ô mã ("Mã này giống số thẻ – để trống ô này"); QA chỉ dùng mã tối đa 12 chữ số.
  - Test PR-B3 theo (a): mã có chữ kèm 14 chữ số qua Luhn ở một cửa sổ → 201; `4111111111111111` → 422.
- Hạn: trước khi PR-B3 viết kiểm `bankReference`. Không chặn gộp #104: chữ 1e đúng ý SEC ARC-15 ý 2, chỗ cần chốt nằm ở luật V-09 áp cho trường mã.
- Trạng thái: Open

#### 7.8.4 Giả định đã dùng

- ARC-17: kiểm dạng thân không cần DB vẫn đứng trước 404 phạm vi (7.8.2).
- `rate_limit_counter` là nơi lưu PostgreSQL hợp SR-RL-10, chờ SEC xác nhận ở thẻ 24.
- Không cần ESC: các điểm thuộc quyền SEC (V-09, SR-RL), ARC (chữ 0.3.14), ORC (đặt audit đóng mục vào PR-B3) hoặc BE (khóa luật chéo, cách cài bộ đếm).
