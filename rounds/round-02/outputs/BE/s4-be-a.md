# BE-A – Round 2, Sprint 4: tiền phía đơn, nhận/trả phòng

- Vai: BE (BE-A) | Ngày: 17/10/2026 | Bước: **Sản xuất** | **Không commit** (ORC commit) | Không đụng stack demo
- Đầu vào: `sprint-4-plan.md` (đóng băng D1: mục 3, 4, 4.1, 8.3, 11), OpenAPI 0.3.7 + `outputs/ARC/openapi-0.3.7.md` (mục 10, 11.3, 11.5), BR v0.3.6 (BR-012, BR-402, BR-424, BR-429 (a)–(h), BR-434), `br-examples.json`, `s4-carryover.md`, `qa/bug-list.md` (BUG-R2-038, 057, 058), decision-log tới dòng "ORC – mở Sprint 4 (D1) – cấp số migration".
- DB test riêng (mới tạo, migrate từ đầu): `ottimo_test_bea_s4a` (làm việc), `ottimo_test_bea_s4h` (lượt cuối). Stack E2E riêng: API `:3311` (ts-node, `CLOCK_MODE=mutable`, test-support) trên DB `ottimo_e2e_bea_s4*` + DS-E nạp từ bản sao trong scratch (không ghi `tests/fixtures/seed/.out` dùng chung).

## 1. Tình trạng việc được giao

| # | Việc | Trạng thái | Kiểm chứng |
|---|---|---|---|
| 1 | **S4-07** (BUG-R2-058) – B7/B7a đổi/gán căn khác định mức: phụ thu người từng đêm theo nguyên nhân | **Xong mã – mốc D3** | BR-429-08 (3 tình huống), BUG-058 (c) 450.000 → 450.000 → 0, folio 2.100.000; (d) đơn xung đột chưa gán căn → B7a tính 150.000 × 2 |
| 2 | **S4-05** (BUG-R2-057) – B14 đơn OTA: chênh lệch so căn gốc, đảo rồi ghi lại | **Xong mã – mốc D3** | BR-424-04: 203 → 401 → 203 → 401 = **250.000** (không 750.000); B7 OTA BR-429-07: 500.000 → 250.000 → 0 |
| 3 | **S4-21 + S4-04** – ESC-019 A, xem trước = lệnh ghi (B7 và B14), FOC qua hàm của BE-B | **Xong mã** | BR-429-03/04/05/06/07/09/10; BR-434-06 (B7 và B14), BR-434-09 (FOC chờ duyệt đi theo, không vào delta), BR-434-11 (thứ tự S4-23 qua 401 → 302 → 101 → 401); S4-04: FOC 792.000 > giá mới 708.000 → xem trước −84.000 = folio đổi thật |
| 4 | **M4 / S4-10** (BUG-R2-038) – `checkIn.payment` theo BR-402 v0.3.6 | **Xong mã** | BR-402-01: xem trước 1.500.000/1.710.000; thu 1.500.000 với FOC 210.000 chờ → nhận được; 1.400.000 → 409 không ghi gì; từ chối → còn 210.000; duyệt → 0; FOC 100.000 → cần 1.610.000; trả 1.710.000 → duyệt xong thừa 210.000; > 1.710.000 → 422 |
| 5 | **S4-35 phần A** – `StayNightPricingPort.setNightRate` | **Xong mã** | BR-429-09 "giữ ưu đãi": 937.000/đêm → 2.811.000; 700.000 ngoài sàn → 422 `RATE_OUT_OF_RANGE`; OTTIMO dời căn sau đó vẫn giữ giá sửa. E2E TC-L2-099 (c) (cần phần B của BE-B) đã **chạy xanh** trên stack riêng |
| 6 | **BR-012 phía folio** – `labelParams.room/from/to` = tên phòng, `folio.settled_room_names`, `Bill.roomName` | **Xong mã** | BR-012-01: dòng phòng/bill ghi "The Valley", không có "202"; chốt B18 rồi đổi tên căn → bill vẫn "The Valley" |
| ORC 0.3.7 bổ sung 1 (1) | `checkIn` nhánh 202 + `payment` → 422 `NOT_ALLOWED` (CỔNG cùng M4) | **Xong** | FD + căn VD + `payment` → 422, không `ApprovalRequest`, folio không đổi; bỏ `payment` → 202 |
| ORC bổ sung 1 (2) | `ReservationHooks.provideDepositNotices` + `getReservation.depositNotices` | **Xong (phần BE-A)** | BE-B đã đăng ký bộ đọc (`payments/public/deposit-notices.ts`); kiểu cổng khớp DTO của BE-B (chuỗi giờ đã định dạng) |
| ORC bổ sung 1 (3) | `Bill.settledAt` (NÊN) | **Xong** | `null` khi folio `open`; giờ chốt sau B18 |
| ORC | Bỏ 2 lệnh `outboxStaffPush` cũ ở B11/B12 (trùng hook của BE-D) | **Xong** | `markNoShow`/`restoreNoShow` không còn push `ota_no_show_report`/`no_show_restored` |
| ORC | Xóa mã đã sửa khỏi `OPEN` (`tests/e2e/support/known-bugs.ts`) | **Xong** | Đã xóa BUG-R2-038, 057, 058, S4-21, S4-04. **Giữ S4-35** (phần B của BE-B) |

Oracle: đã bỏ `pendingFix` của **10 dòng** BR-402-01, BR-424-04, BR-429-03…10 (`validate-fixtures` 0 lỗi). Các dòng BE-B (BR-434-09/11/12…) không đụng.

## 2. Thiết kế chính

### 2.1 Một hàm tính cho mọi lần đổi căn (ARC 10.4, critic #10)
- `reservations/internal/move-planner.ts` – `MovePlanner.planBooking()` nhận (đơn, phạm vi đêm từ ngày đổi, căn mới, nguyên nhân) và trả từng đêm: giá cũ → mới, lịch giá, cờ giá sửa tay, phụ thu người + số người + định mức bảo vệ, chênh lệch OTA cũ/mới, FOC áp và FOC chờ (của BE-B), tổng `folioDeltaVnd`.
- Dùng ở **B7/B8** (`previewMoveReservation` mới – GET chỉ đọc; `moveReservation`), **B7a** (`assignRoom`) và **B14** (`changeRoom` `dryRun` + lệnh thật). Lệnh ghi khóa đơn → căn → folio rồi **chạy lại đúng hàm đó**, so `expectedDeltaVnd`, ghi đúng các đêm hàm trả (`writePlannedNights` / `writeMovedNights`), folio chỉ đồng bộ theo đêm đã ghi.
- **Giá** (BR-429 (a)–(c), (g), (h); `room_move_pricing`): khách tự xin + đổi căn → lịch giá hiện hành căn mới cho mọi đêm, BR-107 tính lại, hai chiều; giá sửa tay không mang sang (cảnh báo `MANUAL_RATE_REPRICED` + `suggestedRateVnd` giữ cùng % – NÊN). Do OTTIMO và `other` → giữ giá; `other` sang căn giá hiện hành cao hơn → chỉ FDL+ (403). Đơn OTA → giữ giá OTA, chênh lệch theo căn gốc. HĐ dài hạn nhập tay → `pricingBasis = external_contract`, chênh 0.
- **Phụ thu người** (BR-429 v0.3.4, BR-424): khách xin → định mức căn mới; do OTTIMO → min(cũ, mới) = phụ thu tại max(định mức cũ, mới), lưu ở `stay_night.extra_person_base` để lần đổi số người sau vẫn được bảo vệ (`nightBases` đọc cột này). OTA: vượt max(định mức, số khách OTA).
- **Chênh lệch OTA** (BR-424 v0.3.5): căn gốc = `reservation.origin_room_id` (ghi một lần ở lần đổi căn đầu tiên = căn trước lần đổi đó; đơn xung đột: căn được gán cùng nhóm, hoặc căn khách đặt nếu `upgraded`). Khách xin đổi → đảo mọi dòng `room_change_difference` từ đêm đổi rồi ghi lại max(0, Trực tiếp căn mới − căn gốc) từng đêm (doanh thu phòng). Do OTTIMO → giữ nguyên dòng.
- **FOC**: không tự tính – `FolioService.previewStayReductions` của BE-B (cùng phân bổ `allocateKey` với lệnh đồng bộ, bản đồ ngày BR-434, thứ tự S4-23). `folioDeltaVnd` = thay đổi dòng − (FOC sau − FOC trước); FOC chờ duyệt ra ở `nights[].pendingFocVnd`, không vào delta.
- Thứ tự kiểm B7: dữ liệu → trạng thái/quy tắc lý do (`inventory_optimize` khi `roomDisclosedToGuest = true` → 422 `NOT_IN_LIST`) → căn/sức chứa → **tồn phòng (409) trước mọi câu hỏi tiền** → khách xin đổi căn: `applyDifference` (422 `REQUIRED`) + `expectedDeltaVnd` (thiếu 422, lệch 409 `SURCHARGE_CHANGED`). Lý do do OTTIMO: bỏ qua `applyDifference`/`expectedDeltaVnd`. B7 `guest_request` sang căn khác → `roomDisclosedToGuest = true`; audit tiền `reservation.room_change_repriced` (kèm lý do).

### 2.2 `checkIn.payment` (M4, BR-402 v0.3.6)
- `previewCheckIn` thêm `balanceDueVnd`, `amountDueAtCheckinVnd` = còn phải thu − tiền thừa + phụ thu sẽ ghi + đêm B9a − FOC chờ đã có trên khoản phát sinh; điều kiện `balance_paid` theo số này.
- `checkIn`: thứ tự `SURCHARGE_CHANGED` → ghi phụ thu / đêm B9a (+ yêu cầu FOC) → ghi `payment` (`type = charge`, trần = còn phải thu sau các dòng, vượt → 422 `AMOUNT_EXCEEDS_BALANCE` + `max`) → **xét `balance_paid` trên folio thật**: còn phải thu − FOC chờ trên khoản phát sinh (mỗi yêu cầu theo "khi duyệt sẽ áp" – `FolioService.focViews` của BE-B) > 0 → 409 `CHECKIN_CONDITIONS_NOT_MET [balance_paid]`, cả giao dịch hoàn (không ghi gì). `ota_prepaid` như cũ. Nhánh 202 + `payment` → 422 `NOT_ALLOWED`.
- Sửa kèm: dòng FOC chờ tạo ở bước nhận phòng/trả muộn nay gắn `approval_request_id` (như `requestFoc` của BE-B) – E2E TC-L3-078 tìm yêu cầu qua dòng này.

### 2.3 `StayNightPricingPort` (S4-35 phần A)
- `reservations/public/stay-night-pricing.ts`, provider/export của `ReservationsModule`; không phụ thuộc ReservationsService/FolioService (tránh vòng DI: FolioLinesService → port). Khóa đơn (`FOR UPDATE`) – **BE-B gọi trước khi khóa folio**.
- `room`: giá nhập = giá lịch của đêm → `calendar_rate_vnd`, gross = làm tròn(giá × (1 − bậc BR-107 hiện hành)) (Trực tiếp/CTV; OTA/nội bộ = giá nhập), sàn–trần BR-105 nhóm căn, snapshot đánh dấu `manual`, `total_room_vnd` tính lại, audit `reservation.repriced`. Trả `lineAmountVnd` để BE-B đảo + ghi dòng. `extra_person`: phụ thu riêng của đêm.

### 2.4 BR-012 phía folio
- `folio/public/line-labels.ts`: `LabelContext.roomName`; `room`/`from`/`to` đổi sang tên phòng sau khi gộp `labelParams` (dòng giữ số căn – tên đọc lúc hiển thị). Căn chưa có tên → số căn.
- `folio/public/room-names.ts`: `snapshotSettledRoomNames` (gọi ngay sau `FolioService.settle` ở B18, cùng giao dịch; ghi `{số căn: tên}` mọi căn của lượt ở) và `roomNamesOf` (đã chốt → tên chụp; còn mở → bảng `room`). Dùng ở `getFolio`, `getBill`, `getCheckoutSummary`.
- `Bill.roomName` (tên căn đêm cuối, cùng nguồn), `Bill.settledAt`; `Bill.roomNo` vẫn trả (deprecated) để Desk cũ không gãy.

### 2.5 Migration `0059_s4_move_pricing.sql` (số ORC cấp)
`stay_night.extra_person_base` (+ CHECK ≥ 0), `reservation.origin_room_id` (+ FK `(property_id, origin_room_id) → room`), khóa danh mục `room_move_pricing` (json, OWN, mặc định `{"guestRequest":"new_room_rate"}`). Schema `.ts` + 1 dòng journal (`when` 1792240590000, sau 0055); **không sinh snapshot** (ORC).

## 3. File tạo / sửa (của BE-A)
**Mới**
- `product/services/api/src/db/migrations/0059_s4_move_pricing.sql`
- `product/services/api/src/modules/reservations/internal/move-planner.ts`
- `product/services/api/src/modules/reservations/public/stay-night-pricing.ts`
- `product/services/api/src/modules/folio/public/room-names.ts` (BR-012 phía folio – ORC D1 (3))
- `product/services/api/test/integration/move-pricing.test.ts` (17 ca), `product/services/api/test/integration/checkin-payment.test.ts` (5 ca)

**Sửa**
- `src/db/migrations/meta/_journal.json` (+1 dòng), `src/db/schema/reservations.ts` (2 cột, FK, CHECK)
- `src/modules/reservations/`: `internal/reservations.service.ts` (B7/B8/B7a theo plan, `previewMove`, PATCH `roomDisclosedToGuest`, BUG-058 (d) giữ số khách OTA khi chưa có căn, `repriceExtraPersons` theo đêm, `nightBases` đọc định mức bảo vệ, `writeMovedNights`/`repostPlannedDifferences`, đơn xung đột tạo với `room_disclosed_to_guest = false`, `getReservation.depositNotices`, bỏ 2 push B11/B12), `internal/reservations.controller.ts` (route `move-preview`), `internal/money-bridge.ts` (`lockFolio`, `previewReductions`, `differenceLines`, `repostDifferences`), `internal/reservation-store.ts`, `internal/reservation-dto.ts` (`roomDisclosedToGuest`), `public/stay-port.ts` (`planMove`, `lockFolio`, `writeMovedNights`, `repostDifferences`), `public/reservation-hooks.ts` (`provideDepositNotices`), `reservations.module.ts` (`StayNightPricingPort`)
- `src/modules/frontdesk/internal/`: `stay.service.ts` (B14 theo plan), `checkin.service.ts` (M4, 202 + payment, `room_disclosed_to_guest` ở B9), `checkout.service.ts` (chụp tên phòng khi chốt, tên phòng ở tóm tắt trả phòng), `stay-support.ts` (dòng FOC chờ gắn yêu cầu)
- `src/modules/folio/public/line-labels.ts`, `src/modules/folio/internal/bill.service.ts` (BE-B review)
- Test đổi theo hành vi 0.3.7: `test/integration/frontdesk.test.ts` (TC-L3-011 tương đương: chưa thu phụ thu → 409 không ghi gì, vượt trần 422, `deposit` 422, thu đủ → 200), `frontdesk-stay.test.ts` (đêm B9a phải thu), `reservations.test.ts` + `room-capacity.test.ts` (đổi căn không phải chủ đề → `property_fault`), `foc-resync.test.ts` của BE-B ca (i) (đổi căn **do OTTIMO** – BR-434-06 "B7 OTTIMO giữ giá"; báo BE-B)
- `product/tests/fixtures/br-examples.json` (bỏ 10 `pendingFix`), `product/tests/e2e/support/known-bugs.ts` (xóa 5 mã)
- `01-decisions/decision-log.md` (2 dòng: cách cài + giả định)

## 4. Kết quả lệnh (17/10 ~20:15–20:35)
| Lệnh | Kết quả |
|---|---|
| vitest `services/api` toàn bộ, DB mới `ottimo_test_bea_s4h` | **2556/2559 xanh, 69/72 tệp**. Đỏ: `schema-parity` (chờ ORC sinh snapshot 0056–0060 – đã biết), 1 ca BUG-R2-033 trong `frontdesk-s3-fixes` (ca BE-C đang sửa cho S4-11), 2 ca `minibar-catalog-s4-bed` (BE-D đang làm). Mọi ca BE-A xanh |
| `move-pricing.test.ts` + `checkin-payment.test.ts` | 22/22 |
| E2E QA trên stack riêng – `api/money-s4.api.spec.ts` (`--workers=1`) | **34/34** (với `E2E_FIXED_BUGS` gồm mã của BE-A và BE-B) |
| E2E `clock/money-s4.clock.spec.ts` | 5/5 chạy được xanh (TC-L4-097 BR-424-04, TC-L4-098 a/b S4-04, TC-NT-045 …); TC-L3-078 BR-402-01 xanh khi buồng sạch; 3 ca bỏ qua (cần `E2E_COMPOSE_CONTROL`) |
| E2E project `api` đầy đủ (song song) | 189/201: các đỏ còn lại không do BE-A (xem mục 6) |
| `tsc --noEmit` api | 0 lỗi ở tệp BE-A (lỗi lúc chạy cuối nằm ở tệp đang sửa của BE-B `folio-lines.service.ts:80` và BE-D `be-d-s4-units.test.ts`) |
| eslint / prettier tệp BE-A | xanh (`document-party.port.ts` của BE-C chưa format – không phải BE-A sửa) |
| `tests` `validate-fixtures` | OK – 0 lỗi |

## 5. Review theo yêu cầu ORC
- **BE-D `frontdesk/internal/attention-sources.ts`** (no-show theo ETA): **Đồng ý**. Ghi chú nhỏ (Suggestion): `business_day_rollover ?? '06:00'` viết cứng mặc định – tham số luôn có, nên ném lỗi cấu hình thay vì đoán; truy vấn bỏ `LIMIT` – ổn với 10 căn.
- **BE-D `reservations/public/guest-room-view.ts`**: **Đồng ý**. Đúng BR-012 (4): khách chỉ thấy tên khi `room_disclosed_to_guest` và căn có tên; số căn chỉ cho nhân viên; đọc segment mới nhất nên khách thấy tên căn mới sau B7/B14. Lưu ý: S4-09 (`until_parent_departure`, chưa cài) sẽ cần chọn segment theo ngày nghiệp vụ thay vì "mới nhất".
- **BE-D `reporting/internal/no-show-notices.ts`**: đúng thay cho 2 push cũ (đã bỏ ở B11/B12). Điều kiện ARC 11.4 C2 (không `UPDATE attention_event` thẳng) là việc của BE-D.
- **BE-B `payments.module.ts`**: nay `ReservationHooks.provideDepositNotices` có thật – bỏ được ép kiểu `as … & { provideDepositNotices?… }`.

## 6. Việc cho vai khác
| Gửi | Nội dung |
|---|---|
| **QA** | (1) `support/s3.ts` `checkIn`/`inHouse`: ca nhận sớm có phụ thu mà không thu tiền nay 409 `balance_paid` (0.3.7 #1 – đúng hợp đồng) → TC-NT-029, TC-NT-036 (`clock/approvals-foc.s3.clock.spec.ts`) đỏ; đề nghị harness mặc định gửi `payment` = `amountDueAtCheckinVnd` của `previewCheckIn` khi ca không nói gì về tiền (giống `autoDecision`). (2) TC-L3-078 cần buồng sạch (`cleanRooms`/FDL ghi đè) – chạy sau các ca trả phòng thì 409 `room_ready`. (3) TC-L2-095 và TC-L2-099 (a)(b) trùng phòng/tuần khi chạy song song (cùng 101/401 tuần 29/06/2027) – tách tuần hoặc `mode: 'serial'`; chạy `--workers=1` thì xanh. (4) TC-L2-099 (c) S4-35 và TC-L3-032 (b) BUG-R2-033 đã "expected to fail but passed" trên cây làm việc – chờ BE-B/BE-C xóa mã. (5) Có thể bỏ `pendingFix`/`test.fail` của BR-402-01, BR-424-04, BR-429-03…10 (BE-A đã bỏ ở fixture). (6) Ca mới nên thêm: 202 + `payment` → 422 `NOT_ALLOWED`; `Bill.settledAt`; `getReservation.depositNotices` |
| **BE-B** | (1) `foc-resync.test.ts` ca (i): đổi lý do sang `property_fault` (0.3.7: khách xin đổi căn tính giá căn mới) – xin review. (2) `adjustFolioLine` gọi `StayNightPricingPort.setNightRate` **trước** `lock` folio (cổng khóa đơn). (3) `previewStayReductions` dùng tốt cho B7 (mọi đêm) và B14 (truyền mọi đêm của đơn, đêm chưa đổi giữ giá trị hiện tại) |
| **FE-A** | `previewMoveReservation` sẵn sàng (GET, cùng query với body); B7 khách xin đổi căn bắt buộc `applyDifference` + `expectedDeltaVnd`; `MovePreview.nights[].focVnd/pendingFocVnd/suggestedRateVnd`, `warnings` `MANUAL_RATE_REPRICED`, `roomName`. H13: `CheckInPreview.amountDueAtCheckinVnd` + `checkIn.payment`; nhánh 202 không gửi `payment`. Bill: in `roomName`, `settledAt` |
| **ARC** | Thêm vào erd: `stay_night.extra_person_base`, `reservation.origin_room_id` (0059). `MovePreview.returningGuestDiscountPct` luôn vắng (đơn không lưu mã khách quay lại – chỉ báo giá có) |
| **DOM** | Xác nhận các [GIẢ ĐỊNH BE-A] ở decision-log 17/10 (căn gốc khi OTTIMO đổi căn trước ngày đến, `other`/`force_majeure` như OTTIMO, bảo vệ phụ thu người kéo dài, trần khoản thu khi nhận phòng) |
| **ORC** | Sinh snapshot gộp cho 0056–0060 (schema-parity). NÊN S4-37 TC-L2-057: 409 `CONCURRENT_UPDATE` chỉ xảy ra khi E2E chạy song song nhiều worker trên 10 căn (khóa dòng `room` + `lock_timeout` – fail-fast SEC-BE-23, đúng thiết kế); chạy lại trên stack mới thì xanh – **không phải lỗi nghiệp vụ**, QA có thể cho helper thử lại 409 `CONCURRENT_UPDATE` |

## 7. Giả định (đã ghi decision-log, nhãn [GIẢ ĐỊNH BE-A – DOM xác nhận])
(a) Đổi căn do OTTIMO không đổi căn gốc; (b) `other`, `force_majeure` như OTTIMO; (c) bảo vệ phụ thu người kéo dài qua lần đổi số người; (d) "căn giá hiện hành cao hơn" = tổng giá lịch Trực tiếp các đêm; (e) BR-111 không áp khi đổi căn; (f) trần `checkIn.payment` không trừ FOC chờ (oracle `paymentCapVnd`), "khoản phát sinh" = mọi loại dòng trừ `room`/`room_change_difference`; (g) đêm B9a đơn Trực tiếp phải thu khi nhận phòng; (h) B7 chỉ đổi ngày: `expectedDeltaVnd` tùy chọn; (i) phụ thu người sửa tay không "giữ" khi đổi số người; (j) `Bill.roomNo` vẫn trả (deprecated).

## 8. Rủi ro / việc chưa xong
- **ESC mới: không.**
- `schema-parity` và bước CI "drizzle-kit generate không sinh tệp" đỏ tới khi ORC sinh snapshot gộp (đúng quy định ORC D1).
- E2E S3 của QA cần sửa harness (mục 6) – nếu không, CI đỏ ở TC-NT-029/036 khi gộp M4.
- ~~NÊN chưa làm: S4-09, S4-44, S4-47, BUG-078~~ → đã làm ở đợt 2 (mục 9).
- Phản hồi S4-38 ở `responses/s3-BE-A.md` làm khi vòng kiểm chứng có kết quả.

## 9. Đợt 2 (sau handback, ORC 17/10): review BE-B, S4-47, S4-09, S4-44, BUG-R2-078

### 9.1 Tình trạng
| # | Việc | Trạng thái | Kiểm chứng |
|---|---|---|---|
| A | Review thay đổi của BE-B trong module BE-A | **Xong – Đồng ý, 1 Minor** | mục 9.2 |
| B | `ReservationHooks.provideDepositNotices` | Xong (đợt 1) | `move-pricing.test.ts` BR-012-01 đọc `depositNotices` |
| C | `MovePreview` dùng `previewStayReductions` của BE-B | Xong (đợt 1) | BR-434-06/09/11 |
| 1 | **S4-47** `CheckoutSummary.serverTime` + `amountDueAtCheckoutVnd`; đêm thêm sau 18:00 thu bằng `finalPayment` ở B18 | **Xong** | `checkout-due.test.ts` 4 ca: trả muộn 15:00 (vượt → 422 `max`, đúng số → chốt 0/0), FOC đã duyệt trên dòng trả muộn, đêm thêm Trực tiếp (tính lại bậc) và OTA (đơn con) |
| 2 | **S4-09** B14 `stayScope = until_parent_departure` + `roomReturnRecorded` | **Xong phần BE-A** – phần J8 (việc dọn căn cũ/xếp hạng ngày về) là module HK, chuyển BE-C (mục 9.4) | `move-pricing.test.ts` BR-424-05: không đơn con → 422 `stayScope NOT_ALLOWED`; `whole_stay` → 409 `parentOnlyAvailable: true`; dryRun `stayScope`/`returnToRoomDate`; chỉ đêm đơn gốc sang 302, đêm đơn con ở lại 203; **0 việc dọn sinh sẵn** cho ngày về; ghi trên đơn gốc → 409; ghi trên đơn con 10:30 → 302 `VD` + `checkout_clean` hạng 2 (có khách đến), 203 `OC`; ghi lần 2 → 409; không phụ thu trả muộn |
| 3 | **S4-44** `listReservations.q` theo tên người đứng tên + số căn/tên phòng (0.3.7 D1, BR-012 (2)) | **Xong** | `reservation-list.test.ts`: "ha"/"Hà"/"thu hà"/"NGUYEN" → đơn Nguyễn Thu Hà; "à" (1 chữ) không khớp tên; SAL → `[]`; "401" khớp đúng, "pine"/"The Pine"/"PIN" → 401, "pi" không; lọc theo `stayFrom`–`stayTo` |
| 4 | **BUG-R2-078** `ReservationSummary.balanceDueVnd` | **Xong** | cùng số với `getReservation.balanceDueVnd` (2 đơn cọc khác nhau) |

`pendingFix` của **BR-424-05 giữ nguyên** (`S4-09`): oracle còn 3 kịch bản J8 lúc 07:00 ngày về (căn cũ VC → không sinh việc; VD có việc mở → việc lên hạng "khách đến" hạn 12:00; VD không việc → `priority_clean`) – thuộc J8/xếp hạng HK của BE-C. Phần BE-A (đổi căn, không sinh sẵn, ghi chuyển về) đã xanh.

### 9.2 Review BE-B (yêu cầu A) – **Đồng ý**
| Chỗ sửa | Kết luận |
|---|---|
| `frontdesk/internal/stay-support.ts` `replaceLateCharge` | Đúng: đảo dòng trả muộn cũ rồi ghi dòng mới, FOC đi qua `syncReductions` (một nơi áp FOC theo khóa) – không còn tự cộng/trừ FOC ở desk. S4-47 tính `amountDueAtCheckoutVnd` cùng quy tắc (FOC đã duyệt, tối đa bằng phụ thu mới) |
| `reservations/internal/reservations.service.ts` `cancel`, `markNoShow` | Đúng thứ tự khóa (đơn → căn → folio); `closeStayPreview` dùng cho cả `dryRun` lẫn lệnh thật (một hàm tính), `closeStayCredit` ghi tiền thừa sau đảo dòng – không đổi luồng tồn phòng/đêm của BE-A |
| `otaPenaltyVnd` trần = `total_room_vnd` (S4-37) | Đúng "giá trị đơn" OTA (phí phạt không vượt tiền phòng của đơn) |
| `retainLinesOf` | **Minor (V-09)**: `reason` là chữ tự do đi vào lý do dòng folio/audit nhưng chưa qua `assertNoCardNumber` (folio chỉ `trim` + ≥ 3 ký tự). Đề nghị BE-B thêm `assertNoCardNumber(\`retainLines[${i}].reason\`, reason)` ở `retainLinesOf` hoặc `closeStayPreview` |
| `reservations/internal/money-bridge.ts` (`closeStayPreview`, `closeStayCredit`) | Đồng ý – chỉ chuyển tiếp sang `FolioService`, giữ ranh giới module |
| `reservations/public/folio-sync-port.ts` `VoidStayInput.services` | Đồng ý – trường tùy chọn, các nơi gọi cũ không đổi |
| `payments.module.ts` | Nay `provideDepositNotices` có thật – bỏ được ép kiểu |

### 9.3 Thiết kế
- **S4-47**: `getCheckoutSummary` trả `serverTime` (`ctx.iso(now)`) và `amountDueAtCheckoutVnd` = max(0, còn phải thu − tiền thừa + (phụ thu mới − FOC đã duyệt áp được) − (dòng trả muộn hiện có − FOC của nó) + đêm thêm). Đêm thêm sau mốc cuối: Trực tiếp/CTV = chênh lệch tính lại bậc khi gia hạn + phụ thu người; OTA/HĐ ngoài = giá đêm + phụ thu người. `checkOut.finalPayment` kiểm trần **trước** khi ghi → 422 `AMOUNT_EXCEEDS_BALANCE` (`finalPayment.amountVnd`, `max`).
- **S4-09**: `changeRoom` đọc `stayScope` (`whole_stay` mặc định). `until_parent_departure`: chỉ đơn gốc dời căn (đơn con giữ căn cũ), tồn phòng kiểm tới `departure_date` của đơn gốc, xem trước trả `stayScope` + `returnToRoomDate` (= ngày đến sớm nhất của đơn con). Không sinh `priority_clean` (DOM 17/10 sửa giả định ARC (b)). `roomReturnRecorded` (PATCH đơn con) → `ReservationHooks.roomReturn` → `StayService.recordRoomReturn` (frontdesk cài ở `onModuleInit`): kiểm "ngày về" qua `reservations/public/room-return.ts` `roomReturnsOn()` (đơn con `in_house`, ngày đến = hôm nay, đêm trước của đơn gốc ở căn khác, chưa ghi) → căn đơn gốc `VD` (B14, lý do `room_return`) + `checkout_clean` (hạng 2 khi căn có khách đến hôm nay, không thì 5) + `minibar.onCheckedOut`; căn cũ `OC`; đặt lại "đã giao thẻ" của đơn con; `reservation_change` `room_return` (dấu một lần); audit `state` `reservation.room_returned`; SSE `room.status_changed` (qua `RoomStatusService`) + `reservation.changed`.
- **S4-44**: thêm vào điều kiện `q` (OR): `g.name_search LIKE %nameSearchKey(q)%` khi khóa ≥ 2 ký tự; căn khớp (số căn đúng, hoặc tên phòng bỏ "The" chuẩn hóa như tên khách, ≥ 3 ký tự, lọc ở server trên ≤ 10 căn) → `EXISTS` đoạn còn hiệu lực trên căn đó (giao `stayFrom`–`stayTo` nếu có). Không tìm SĐT/email, không tìm người đi cùng.
- **BUG-078**: `RackService.list` gọi `MoneyBridge.balanceDue` (cùng hàm `getReservation`) một lần mỗi folio của trang, chỉ khi người gọi FD+ (serializer vẫn lọc `x-visible-to`).

### 9.4 Việc cho vai khác (đợt 2)
| Gửi | Nội dung |
|---|---|
| **BE-C** (J8 `hk.daily` + xếp hạng HK) | BR-424-05 phần ngày về: (1) J8 hiện coi đơn con `in_house` ở căn cũ là **khách ở tiếp** → sinh `stayover_clean` cho căn cũ ngày về (sai: VC/VI → không việc; chưa sạch → việc hạng "khách đến" hạn `checkout_time`; không có việc mở → `priority_clean`). (2) `ranked()` chỉ tính "khách đến" cho đơn `hold`/`confirmed` → căn cũ ngày về không lên hạng 2. Dùng `roomReturnsOn(tx, today)` (`reservations/public/room-return.ts`, hàm thuần, worker gọi được): `returnRoomId` = căn có khách đến, `movedRoomId` = căn có khách đi (J8 hiện **không** chuyển căn này sang VD lúc 07:00 – đúng oracle, giữ nguyên). BR-806 quên ghi: `recorded = false`. Xong thì bỏ `pendingFix` BR-424-05 |
| **BE-B** | (1) Minor V-09 ở `retainLinesOf` (mục 9.2). (2) `known-bugs.ts` mã `S4-10` (QA): `createVietQr` `purpose` `check_in`/`check_out` còn 422 vì `payments.controller.ts` zod chỉ nhận `deposit`/`balance`/`billing_period`; trần theo hợp đồng = `CheckInPreview.amountDueAtCheckinVnd` / `CheckoutSummary.amountDueAtCheckoutVnd`. BE-A sẵn sàng thêm vào `ReservationSalesPort` hàm `amountDueFor(tx, reservationId, purpose)` (qua `ReservationHooks`, frontdesk cài – không vòng phụ thuộc) nếu ORC giao |
| **FE-A** | H18: in `amountDueAtCheckoutVnd`, gửi `finalPayment` ≤ số này; đồng hồ trả muộn theo `serverTime`. B14: ô "chỉ chuyển tới hết đơn gốc" khi 409 có `parentOnlyAvailable: true` (hoặc đơn có đơn con), ngày về `returnToRoomDate`; nút "Khách đã chuyển về" trên đơn con ngày về = PATCH `roomReturnRecorded: true`. Danh sách đơn: cột "Còn phải thu" đọc `balanceDueVnd`; ô tìm nhận tên khách/số căn/tên phòng |
| **QA** | Ca mới: S4-44 (tên không dấu, 1 ký tự, SAL own, số căn/tên phòng), BUG-078 (danh sách = chi tiết), S4-47 (`serverTime`, vượt `max` → 422), S4-09 (409 `parentOnlyAvailable`, 422 không đơn con, ghi chuyển về một lần). Phần J8 của BR-424-05 chờ BE-C |

### 9.5 File đợt 2
**Mới**: `product/services/api/src/modules/reservations/public/room-return.ts`, `product/services/api/test/integration/checkout-due.test.ts` (4 ca), `product/services/api/test/integration/reservation-list.test.ts` (3 ca).
**Sửa**: `src/modules/frontdesk/internal/checkout.service.ts` (S4-47), `src/modules/frontdesk/internal/stay.service.ts` (S4-09 `stayScope`, `recordRoomReturn`), `src/modules/frontdesk/frontdesk.module.ts` (`provideRoomReturn`), `src/modules/reservations/public/reservation-hooks.ts` (`RoomReturnHandler`), `src/modules/reservations/internal/reservations.service.ts` (PATCH `roomReturnRecorded`), `src/modules/reservations/internal/rack.service.ts` (S4-44, BUG-078), `test/integration/move-pricing.test.ts` (+1 ca BR-424-05), `01-decisions/decision-log.md` (+2 dòng: cách cài NÊN + giả định (k)–(m)).

### 9.6 Kết quả lệnh (17/10 ~20:30)
| Lệnh | Kết quả |
|---|---|
| vitest `services/api` toàn bộ trên **cây chung** (BE-D đã gỡ vòng guest-portal ↔ housekeeping), DB mới `ottimo_test_bea_s4i` | **2614/2614 xanh, 75/75 tệp** (gồm `schema-parity`) |
| `tsc --noEmit` api | 0 lỗi |
| eslint + prettier tệp BE-A đợt 2 | xanh |

Giả định mới (decision-log, chờ DOM): (k) ghi chuyển về **không chặn** khi minibar căn đơn gốc chưa đếm (hợp đồng không khai `MINIBAR_NOT_CHECKED`), đã đếm thì sinh việc bổ sung như B18; (l) chỉ ghi được trong ngày về, quên → BR-806; (m) `finalPayment` vượt trần bị chặn cứng. **ESC mới: không.**

## 10. Đợt 3 (ORC 17/10 tối): review BE-C, `amountDueFor` (S4-10), `touchLastStay`

### 10.1 Review các sửa của BE-C trong module BE-A – **Đồng ý, 2 Minor + 3 gợi ý**
So với commit `94c711d` (`git diff HEAD`), đọc cùng `outputs/BE/s4-be-c.md` mục 1.1, 1.3, 1.4, 3.

| Tệp | Kết luận |
|---|---|
| `frontdesk/public/ports.ts` | Đồng ý: `GuestUploadChoice = number \| 'none'`, tham số tùy chọn ở `onPartyMemberRemoved` – các bản cài cũ (mặc định, test) không gãy |
| `frontdesk/internal/frontdesk.controller.ts` | Đồng ý: `guestUploadPersonIndex` là số nguyên 2…20 hoặc `none`, sai → 422 `NOT_IN_LIST`, vắng hoặc rỗng = không gửi. Kiểm trước khi mở UoW |
| `frontdesk/internal/party.service.ts` | Đồng ý: chuyển tiếp lựa chọn. 422 `REQUIRED`/`NOT_ALLOWED` của cổng registration xảy ra trong cùng giao dịch → cả lệnh bỏ người hoàn lại (khóa đơn trước, rồi mới gọi registration – đúng thứ tự khóa) |
| `frontdesk/public/room-status.service.ts` (shim B-14) | Đồng ý: chỉ re-export, đường import của desk giữ nguyên. Hành vi mới của `set` (S4-31: sự kiện `B13` `OC → OD` sinh hoặc đổi sang `stayover_clean`) **không ảnh hưởng** luồng BE-A: B9/B14/B17/B18/ghi chuyển về dùng sự kiện khác. B13 gia hạn giữa kỳ thì căn thường đã `OD` sau J8, còn trùng việc thì `ON CONFLICT DO NOTHING`. **Gợi ý (R3):** `RoomStatusService` hiện được cung cấp ở hai nơi (FrontdeskModule và HousekeepingModule `@Global`). Hiện cùng lớp, không giữ trạng thái nên vô hại; nên bỏ provider/export ở FrontdeskModule để chỉ còn một instance |
| `frontdesk/internal/document-party.port.ts` (viết lại theo nhóm D mục A) | Đồng ý với thứ tự khớp: thành viên theo khóa → tên + ngày sinh → hồ sơ P05 ngoài đơn → hồ sơ "từ giấy tờ". Trẻ không khớp → null; trùng tên + ngày sinh ngoài đơn chỉ bật cờ. **Minor (có từ S3, không do BE-C):** `addDocument` khóa `registration` rồi mới khóa `reservation FOR UPDATE` ở đây. B9/B16/B18/bỏ người khóa theo chiều ngược lại (đơn → registration), nên hai lệnh đồng thời trên cùng đơn có thể deadlock. Lỗi tự hết khi chạy lại (409/40P01). Đề nghị R3: registration khóa đơn trước qua cổng của reservations. **Gợi ý:** `addCompanion` không phát `reservation.changed` (chỉ có `registration.changed`) nên danh sách người trên Desk không tự làm mới. **Lưu ý nghiệp vụ:** người vượt số khai (`overCount`) không đổi `adults`/phụ thu BR-110. Nhưng lần `addPartyMember` sau, `PartyService.add` tính `max(khai, hiện có)` nên nâng số khai và phụ thu **cả người vượt từ giấy tờ** từ `effectiveFrom`. Nhất quán với "lễ tân quyết", FE-A cần hiện cảnh báo `overCount` |
| `reservations/internal/room-blocks.service.ts` | Đồng ý: đúng một trong `endDatePlanned`/`expectedDoneDate`, server cộng `ooo_reopen_buffer_days` (BR-804), giữ `expected_done_date`, `get()`, `viaWorkOrder` chỉ đi qua `RoomBlockPort`. **Minor:** tham số `ooo_reopen_buffer_days` cho phép **0** (`0003_parameter_bounds`: min 0). Khi đó `expectedDoneDate = startDate` cho khối rỗng `[start, start)`, lỗi chỉ lộ ra ở tầng tồn phòng. Đề nghị kiểm `end > start` **sau** khi cộng đệm (422 `expectedDoneDate DATE_ORDER`) |
| `reservations/public/room-block.port.ts` | Đồng ý: mọi khối OOO vẫn đi qua aggregate đặt phòng (ADR-009). Cùng kiểm tra và 409 như `createRoomBlock`, khóa `room_block` trước rồi `transition` (cùng giao dịch). Đóng phiếu không qua quy tắc MGR+ (A87 chỉ áp cho mở khóa **không** có phiếu) |
| `reservations/reservations.module.ts` | Đồng ý: provider/export `RoomBlockPort` (cạnh `StayNightPricingPort` của BE-A) |
| `test/integration/frontdesk-s3-fixes.test.ts` (BUG-R2-033) | Đồng ý: ca viết lại đúng hành vi mới (cờ khách quen, P05 theo khóa, hồ sơ từ giấy tờ, trẻ → null, `name_search` không dấu). **Gợi ý:** thêm kiểm `adults` và dòng `extra_person` không đổi sau người `overCount` |

### 10.2 `ReservationSalesPort.amountDueFor` (S4-10 phía BE-A – cho BE-B làm trần `createVietQr purpose=check_in/check_out`)
- **Hàm:** `amountDueFor(tx: Tx, q: AmountDueQuery): Promise<number>` (`reservations/public/sales-port.ts`). Kiểu:
  `AmountDueQuery = { reservationId: string; purpose: 'check_in' | 'check_out'; actor: { userId: string; roles: readonly string[]; requestId?: string }; checkinTime?: LocalTime; addPriorNight?: boolean; priorNightRateVnd?: number; checkoutAt?: Date; extraNightRateVnd?: number }`.
- **Một nguồn tính:** `check_in` = `CheckInPreview.amountDueAtCheckinVnd` (đêm B9a tính theo `priorNightRateVnd` khi `addPriorNight`); `check_out` = `CheckoutSummary.amountDueAtCheckoutVnd` (`dueAtCheckout` dùng chung với `getCheckoutSummary` và trần `finalPayment`). Module frontdesk cài qua `ReservationHooks.provideAmountDue`, không tạo vòng phụ thuộc.
- **Mặc định giờ:** vắng `checkinTime`/`checkoutAt` = giờ server (đúng thứ B9/B18 tính lúc đó). Lưu ý: khác mặc định của **form** xem trước (giờ chuẩn), nên Desk cần gửi cùng giờ đang hiển thị.
- **Lỗi** (ném `ProblemError`, BE-B để nổi lên):
  - không phải FD+ → 403 `FORBIDDEN_ACTION`;
  - sai trạng thái (`confirmed`/`in_house`), sai ngày (ngày đến hoặc cửa sổ B9a; ngày đi hoặc cửa sổ sau nửa đêm), đơn con khi trả phòng → 409 `INVALID_TRANSITION`;
  - `addPriorNight`/`priorNightRateVnd` khi không có đêm B9a, hoặc `extraNightRateVnd` khi không có đêm thêm → 422 `VALIDATION_FAILED` `NOT_ALLOWED`;
  - giá ngoài sàn–trần → 422 `RATE_OUT_OF_RANGE` (field `priorNightRateVnd`/`extraNightRateVnd`, `min`/`max`);
  - `checkoutAt` khác ngày đi → 422 `checkoutAt DATE_INVALID`.
- **Phần BE-B còn làm** (module payments): zod `purpose` thêm `check_in`/`check_out` + các trường kèm theo (422 `NOT_ALLOWED` khi sai purpose), gọi `amountDueFor` làm `capVnd`.

### 10.3 `touchLastStay` (việc BE-C nhờ)
B18 gọi `DocumentProfileService.touchLastStay(tx, guestIds, now)` cho người đứng tên của mọi đơn trong lượt ở (đơn gốc + đơn con) và các thành viên còn trong đoàn – cùng tập J25 tự bù. B16 không trả phòng (chỉ rút ngày đi, B18 làm sau) nên không gọi ở B16.

### 10.4 File đợt 3
- Sửa:
  - `src/modules/reservations/public/sales-port.ts` (`AmountDueQuery`, `amountDueFor`), `src/modules/reservations/public/reservation-hooks.ts` (`provideAmountDue`), `src/modules/reservations/internal/sales-port.adapter.ts`;
  - `src/modules/frontdesk/frontdesk.module.ts` (đăng ký handler), `src/modules/frontdesk/internal/checkin.service.ts` (`amountDueForQr`), `src/modules/frontdesk/internal/checkout.service.ts` (`dueAtCheckout` dùng chung, `amountDueForQr`, `touchLastStay`);
  - `test/integration/checkout-due.test.ts` (+1 ca S4-10, +kiểm `last_stay_checkout_at`).
- Không sửa module payments (của BE-B).

### 10.5 Kết quả lệnh (17/10 ~20:45)
| Lệnh | Kết quả |
|---|---|
| vitest `services/api` toàn bộ, cây chung, DB mới `ottimo_test_bea_s4l` (sau khi ORC đổi journal) | **2620/2620 xanh, 76/76 tệp**. Gồm `vietqr-stay-step.test.ts` của BE-B (3 ca S4-10) chạy **qua `amountDueFor` của BE-A**. Một lượt trước đó đỏ 2 ca này là do BE-B đang sửa `payments.service.ts` giữa chừng; chạy lại thì xanh |
| `checkout-due.test.ts` | 5/5 (S4-47 4 ca + S4-10 phía BE-A) |
| `tsc --noEmit`, eslint, prettier tệp BE-A đợt 3 | xanh |

## 11. Phản hồi & sửa theo BR v0.3.8 (ORC 17/10 tối – DOM-S4-01…06, DOM-S4-14 phần BE-A)

### 11.1 Kết quả theo oracle (chạy thật trên PostgreSQL, `move-pricing.test.ts`)
| Mã DOM | Oracle | Kết quả | Sửa ở |
|---|---|---|---|
| DOM-S4-01 | BR-429-11: `force_majeure` dời 2 đêm thường sang thứ Sáu + thứ Bảy, OTTIMO xếp 202 → 401 | **1.822.000** (lịch 202), chênh +238.000; không tick → 422 `applyDifference REQUIRED`, không số → 422 `expectedDeltaVnd REQUIRED` | `move-planner.ts` (căn tính giá đêm thêm) |
| DOM-S4-02 | BR-429-14: 3 người lớn 202, lễ tân sửa phụ thu đêm 1 còn 100.000 (`adjustFolioLine`) → OTTIMO đổi 203 | đêm 1 giữ **100.000**, đêm 2 giữ 150.000, định mức bảo vệ 2, chênh 0 | `move-planner.ts` (min với phụ thu đang ghi, chỉ đêm đã có căn) |
| DOM-S4-03 | BR-429-15: báo giá mã OTTIMO-BACK5, 101 → 401 | **990.000/đêm, 1.980.000**, `returningGuestDiscountPct` 5, `losDiscountPct` 0, chênh 712.000 | `pricing.ts` (hàm BR-111 chung), `move-planner.ts`, `retierStay`, `stay-night-pricing.ts` |
| DOM-S4-04 | BR-429-16: báo giá 7 đêm −10 % dời 1 ngày | **5.205.000**, đêm thêm 713.000, chênh 0 (không giảm lần hai); `calendarRateVnd` từng đêm có trong đơn | `sales-port.adapter.ts` (`createHoldFromQuote`) |
| DOM-S4-05 | BR-402-02: Agoda 203 → 401 (khách xin) | (a) 14:00: phải thu **500.000** – không thu → 409 `balance_paid`, thu đủ → nhận phòng; (b) 04:30 B9a: **1.542.000** | `checkin.service.ts` (`incidentalNet`; xem trước, điều kiện, kiểm cuối) |
| DOM-S4-06 | BR-429-12: khách đổi ngày giữ căn +119.000 | 422 thiếu tick, 409 `SURCHARGE_CHANGED` khi số cũ (0), đúng số → 200, 2.495.000 | `reservations.service.ts` `move()` |
| DOM-S4-14 | BR-309-10; phí BR-522-05 (a)(b)(c) | phí **700.000**, hoàn 300.000; (a) 350.000, (b) 700.000, (c) 700.000 (trước là 0) | `retainableDeposit`, `cancellationQuote` |

- Đã bỏ `pendingFix` của **BR-429-11, -12, -14, -15, -16, BR-402-02, BR-309-10**.
- **Giữ** `pendingFix` của BR-522-05, vì phần "bổ sung yêu cầu hoàn / tự hủy yêu cầu chờ duyệt vượt dư" là của BE-B. Phần phí của BE-A đã kiểm trong cùng ca.
- Ghi chú: API không cho tạo yêu cầu hoàn khi folio chưa có tiền thừa (`REFUND_EXCEEDS_APPROVED`). Vì vậy ca "yêu cầu hoàn tạo nhầm" phải ghi dòng `approval_request` trực tiếp trong fixture.
- Đã xóa `DOM-S4-06` khỏi `OPEN` (`product/tests/e2e/support/known-bugs.ts`) theo ORC. Ca TC-L2-103 (b) chưa chạy E2E UI ở máy BE-A; hành vi server được kiểm bằng BR-429-12.

### 11.2 Test cũ sửa theo quy tắc mới (thay đổi hành vi có chủ ý)
- **Tệp của BE-B – xin BE-B review:**
  - `foc-keys-s4.test.ts`:
    - helper `moveDates` qua `move-preview` rồi gửi tick + số đã hiện (ca BR-434-07, -09, -10, BR-433-03, S4-01);
    - ca đua S4-13: nếu duyệt FOC commit trước làm đổi số thì nhận 409 `SURCHARGE_CHANGED`, xem lại rồi lưu lại – đúng như Desk làm.
  - `foc-resync.test.ts`: helper `shown`; `moveTo` và 2 lệnh dời ngày ở ca (A) (các ca c2, d4, BR-434-03).
  - `folio-payments.test.ts`: ca DOM-BE-03, xem trước rồi lưu.
  - `payments-s3.test.ts`: 3 ca viết theo quy tắc phí cũ VER-BE-S3-01, nay DOM-S4-14 đã thay:
    - DOM BE-14: `refundableVnd` không đổi khi có yêu cầu hoàn mở;
    - VER-BE-S3-01: phí = cọc yêu cầu, không phải giá trị đơn;
    - REFUND #1: no-show giữ cọc yêu cầu, phần còn lại có yêu cầu hoàn – không còn tiền thừa chưa xử lý.
  - `sales.test.ts` BR-302-01: đơn từ báo giá nay có `calendarRateVnd` (DOM-S4-04).
- **Tệp của BE-A:**
  - `move-pricing.test.ts`: BR-429-08, BUG-058 (c) (OTTIMO giảm phụ thu −450.000 → phải tick), BR-434-09;
  - `reservations.test.ts` US-024: đêm thêm theo lịch căn cũ, tick khi có chênh;
  - `reservations-fix.test.ts` BR-107-04;
  - `frontdesk-stay.test.ts` và `ota-prepaid-flow.test.ts`: đơn OTA B9a phải thu đêm trước khi nhận phòng (409 khi không thu).

### 11.3 Review BE-D `frontdesk/internal/attention-sources.ts` `noShows` (DOM-S4-07) – **Đồng ý**
- Đơn `confirmed` có ngày đến đã qua luôn ở dòng `no_show_mark` (critical), mọi giờ, kể cả sau 06:00 hôm sau. Hạn của dòng = giờ đánh dấu của đơn đến sớm nhất.
- Đơn đến hôm nay vẫn theo giờ gọi/giờ đánh dấu và ETA (ETA 01:30 vào dòng sau 01:30 trên trục ngày nghiệp vụ, sang ngày mới thì thành đơn quá hạn).
- Khớp B11 của BE-A: `markNoShow` cho phép mọi lúc sau giờ đánh dấu của ngày đến, kể cả các ngày sau.
- Gợi ý cũ vẫn còn: `business_day_rollover ?? '06:00'`.

### 11.4 Kết quả lệnh (17/10 ~21:35)
| Lệnh | Kết quả |
|---|---|
| vitest api toàn bộ, cây chung, DB mới `ottimo_test_bea_s4r` | **2635/2636**. Ca đỏ duy nhất là `contract.test.ts` "OpenAPI-generated metadata is up to date": `openapi.yaml` đang được sửa lúc 21:32 (ARC, mô tả DOM-S4-06?) mà chưa chạy `gen:openapi`. BE-A không sửa hợp đồng. Một lượt trước đó đỏ 236 ca do `FolioService.repostVoidedDifferences` của BE-B đang viết dở; chạy lại thì hết |
| `move-pricing.test.ts` | 25/25 (7 ca v0.3.8 mới) |
| tsc, eslint, prettier (tệp BE-A + test đã sửa) | xanh |
| `validate-fixtures` | OK – 0 lỗi |

**Lưu ý tệp oracle:** lúc bỏ `pendingFix`, BE-A ghi lại `br-examples.json` bằng bộ đọc JSON.
- 324/349 dòng không đổi so với HEAD giữ đúng nguyên văn.
- 25 dòng DOM thêm/sửa hôm nay (chưa commit) được prettier định dạng lại: nội dung không đổi, đã so từng dòng; chỉ khác xuống dòng.

Giả định mới (decision-log, chờ DOM): (n) no-show cùng cơ sở mới; (o) đơn OTA trả trước thu khoản phát sinh khi trả phòng; (p) không bắt buộc tick thì bỏ qua số gửi kèm; (q) báo giá đã cộng dồn mã quay lại thì tính lại vẫn cộng dồn; (r) không sửa dữ liệu đơn báo giá cũ. **ESC mới: không.**

### 11.5 Review lượt 2 của BE-C trong module BE-A (`s4-be-c.md` mục 7) – **Đồng ý, không mâu thuẫn với các sửa DOM-S4**
- `frontdesk/frontdesk.module.ts`:
  - Đã bỏ provider/export `RoomStatusService`. Nay chỉ còn một instance, do HousekeepingModule (`@Global`) cung cấp. `StaySupport` vẫn import qua tệp re-export `frontdesk/public/room-status.service.ts`.
  - Phần đăng ký `provideRoomReturn` và `provideAmountDue` của BE-A còn nguyên.
- `frontdesk/internal/document-party.port.ts`: `addCompanion` phát `reservation.changed` như `addPartyMember`, đúng gợi ý. Không đụng tiền hay đổi căn.
- `reservations/internal/room-blocks.service.ts`:
  - Kiểm `end > start` sau khi cộng `ooo_reopen_buffer_days`. Đệm 0 mà `expectedDoneDate = startDate` → 422 `DATE_ORDER`; `expectedDoneDate < startDate` vẫn báo lỗi như trước.
  - Không liên quan DOM-S4-14 (phần đó nằm ở `reservations.service.ts`).
- Kiểm: tsc sạch. Vitest api toàn bộ trên cây chung, DB mới `ottimo_test_bea_s4s`: **2641/2641, 78/78 tệp** (ARC đã sinh lại metadata nên `contract.test` xanh).

### 11.6 DOM-S4-19 (sửa giả định (p)) + oracle BR-311-03, BR-429-18
| Mã | Kết quả |
|---|---|
| DOM-S4-19 / BR-429-19 | `move()`: tick không bắt buộc mà bên gọi vẫn gửi `expectedDeltaVnd` lệch → 409 `SURCHARGE_CHANGED`, không lưu. OTTIMO 202 → 203 (chênh 0) gửi 119.000 → 409, căn vẫn 202; không gửi → 200. Đã bỏ `pendingFix` (sửa trực tiếp trên văn bản, chỉ xóa 1 dòng) |
| BR-311-03 ((n)) | No-show: cọc đã thu 800.000, cọc yêu cầu 500.000 → dòng `no_show_fee` **500.000**, đúng một yêu cầu hoàn **300.000** – xanh, không cần sửa mã |
| BR-429-18 ((q)) | Báo giá lập lúc `stackable = true` (dòng `config_parameter` chỉ hiệu lực ngày lập báo giá), 101 → 401 khách xin → đêm thường **891.000** (1.042.000 → 938.000 → 891.000), `losDiscountPct` 10 + `returningGuestDiscountPct` 5 – xanh, không cần sửa mã |

E2E `money-s4.api.spec.ts` TC-L2-092 (a) không gửi `expectedDeltaVnd` (helper `move` thường) nên không bị ảnh hưởng; Desk chỉ gửi số khi phải tick (FE-A).
Kiểm: `move-pricing.test.ts` 28/28; vitest api toàn bộ trên DB mới `ottimo_test_bea_s4v` **2645/2645, 78/78 tệp**; tsc, eslint, prettier, `validate-fixtures` sạch.

## 12. Phản hồi & sửa sau kiểm chứng đối kháng S4-38 (commit 08dabd3; DOM BR v0.3.8 bổ sung S4-38)

### 12.1 Kết quả theo mục (test `test/integration/s438-money.test.ts`, 16 ca, PostgreSQL thật)
| Mục | Sửa | Kiểm chứng |
|---|---|---|
| **MOVE-01** | `swapRoom` (K12) lập kế hoạch bằng MovePlanner với lý do OTTIMO cho từng đơn (khóa đơn → căn → folio); ghi đêm bằng `writePlannedNights` (phụ thu min, định mức bảo vệ theo đêm); resync folio | 202 (3 NL, 300.000) ↔ 302: A còn 0; B giữ định mức 3, sửa 3 → 2 → 3 người vẫn 0 |
| **MOVE-02, MOVE-03, REGR-02** | swap, B12 sang căn khác và B12 vào làn chưa gán ghi `origin_room_id = COALESCE(…, căn cũ)`. B12 ghi `reservation_change` bằng số căn (trước ghi id), làn chưa gán ghi thêm dòng `room` cũ → null. Dòng cũ trước 0059 có `origin_room_id` NULL: lấy căn gốc từ lịch sử `reservation_change` (`internal/room-history.ts`) | Agoda 203 swap với 101 rồi khách xin 401 → 500.000; no-show → khôi phục vào 101 → khách xin 401 → 500.000; dòng cũ (xóa cột) → 500.000 |
| **MOVE-04** | `OccupancyService.claim` dùng lại dòng occupancy của segment (đã nhả) thay vì INSERT thứ hai – hết 500 23505 | no-show, 203 bán lại, khôi phục vào làn chưa gán → B7a gán 201 → 200, occupancy 201 active |
| **REGR-03** | B12 sang căn khác đi qua kế hoạch OTTIMO, ghi định mức bảo vệ. Planner luôn ghi rõ `extra_person_base` trên đêm đổi căn, nên NULL chỉ còn nghĩa "chưa đổi căn từ sau 0059". Đêm NULL (dòng cũ, đêm thêm B13/B9a/B18) lấy định mức bảo vệ từ lịch sử đổi căn do OTTIMO sau lần khách xin cuối (`protectedBaseOf`, dùng trong planner và `nightBases`) | 302 (3 NL) no-show → khôi phục vào 202 → 3 → 2 → 3 người: 0; dòng cũ 402 → 203 (xóa cột): 0 |
| **MOVE-05, PAY-03** (BR-107-05/-06) | Giá lễ tân nhập là **giá lịch**: bậc BR-107 áp trên đó ở lúc đặt (`PricingService` – giá nhập 7 đêm có −10 %; kiểm BR-105 trên giá nhập), B7 (`move-planner` tính lại cả đêm nhập tay), `retierStay` (B13/B9a/B18 – bỏ ngoại lệ ARC-BE-S3-24.3), S4-35. Cờ `manual` giữ lại cho BR-429 (g) | s1 4.320.000 (đêm nhập 540.000); s2 3.987.000 (700.000); (a) 4.898.000; (b) 5.122.000 (630.000) |
| **CANCEL-01** (BR-309-11) | Lệnh B7/B8 tính lại `deposit_required_vnd` = 30 % tiền phòng mới (BR-305, làm tròn theo snapshot). Khách xin giảm khi còn < 7 ngày tới ngày đến thì giữ mức cũ. Không đổi `depositShortfall`, Desk không đòi cọc thêm | x6 1.600.000/0; x6b 500.000/hoàn 1.100.000; x6bLate giữ 1.600.000 → phí 1.584.000/hoàn 16.000 |
| **CANCEL-02** (BR-309-12) | `cancellationQuote` xét đêm cao điểm trên đêm hiện có. `writePlannedNights` ghi `hasPeakNight` = có đêm cao điểm bây giờ, hoặc trước đã có và đơn đã cọc | x1 dời vào Giỗ Tổ → phí 500.000, hoàn 0; x1b dời ra → phí 500.000, hoàn 100.000 |
| **PAY-01, PAY-02, REGR-01, S438-DOM-01** (BR-417-04…06) | `evaluate()` tính đêm B9a đúng như `addPriorNight` ghi (`priorNightDelta`): Trực tiếp = bậc tính lại trên giá gõ (giá lịch) + phụ thu người của đêm thêm + FOC đi theo; OTA/HĐ ngoài = đêm con + phụ thu (trừ đơn OTA trả trước, phụ thu là khoản phát sinh). Cộng đủ rồi mới kẹp 0. QR với giá gõ tính lại cả số, không "kẹp rồi dời". Giá mặc định đêm B9a = lịch Trực tiếp của chính đêm đó (dài hạn giữ giá cơ sở) | 101 thứ Bảy 767.000, phải thu 3.180.000 = trần QR = B9a; gõ 667.000 → 3.090.000; 102 (3 NL) 2.200.000; folio thừa 1.584.000 + gõ 1.000.000 → trần 0 (QR 422 `max` 0), sau B9 thừa 584.000 |
| **PAY-04** (BR-416-04) | Đêm B18 "tính thêm 1 đêm" và đêm B9a: giá nhập là giá lịch, bậc như B13 | Cùng đêm thứ Bảy: B13 777.000 = B18 777.000, tổng 4.929.000 |
| **FOC-02** (BR-416-05) | `extraNightDelta` (và `priorNightDelta`) trừ phần FOC đổi theo, qua `FolioService.previewStayReductions` của BE-B | `amountDueAtCheckoutVnd` 370.000 = B18 cần, tổng 5.670.000, chốt 0/0 |
| **FOC-04 (phần BE-A)** | `repostDifferences`: đảo với `skipReductionSync`, ghi mới bằng `postLines(…, { cause: 'room_change' })` (tự đồng bộ). Không có dòng mới thì gọi `syncReductions` một lần. Planner truyền `differenceVnd` theo đêm và `{ differences: true }` vào `previewStayReductions` (khóa đêm của BE-B), nên `folioDeltaVnd` gồm FOC trên chênh lệch | Agoda 203 → 401, FOC 250.000 trên chênh lệch 20/12, → 402: xem trước −42.000 = lệnh ghi, tổng 1.808.000, FOC `applied` 208.000 |

- Bỏ `pendingFix` của **BR-107-05, BR-107-06, BR-309-11, BR-309-12, BR-416-04, BR-416-05, BR-417-04, BR-417-05, BR-417-06**. Cách bỏ: xóa đúng 1 dòng trong văn bản, các dòng khác giữ nguyên.
- BR-434-14 (FOC-03) là phần của BE-B.
- **Chưa làm MOVE-06**: B14 so `expectedDeltaVnd` khi chênh 0. ORC chưa giao, DOM chưa chốt phạm vi.

### 12.2 Đối chiếu với test tái hiện của skeptic
Đã chép 16 thư mục `test/s438/v-*` vào một cây sao riêng (`scratchpad/bea-s4/mirror`), không chép vào cây chung, rồi chạy trên mã đã sửa: 49/64 ca xanh. 15 ca đỏ còn lại đều do test ghi số **trước** khi DOM chốt, hoặc do cách viết test, không phải lỗi mã:
- v-cancel-0-0 V1–V5 ghi lại hành vi cũ "cọc đóng băng" (nay đúng là đã đổi);
- X1b đòi hoàn 600.000 theo chữ BR, nhưng DOM chốt không hoàn;
- v-foc-1-0 dùng số 470.000 / 6.670.000 của trước khi sửa PAY-04 (DOM: 370.000);
- v-pay-1-0 A/C nhận phòng hai lần: lần đầu với số xem trước nay đã thành công;
- v-pay-3-0 N1-Y2 coi 777.000 là giá cuối, nhưng DOM chốt giá nhập là giá lịch;
- N2b có biểu thức `expect` đảo ngược ('preview-paid' so với 200).

### 12.3 Kết quả lệnh (17/10 ~23:25)
| Lệnh | Kết quả |
|---|---|
| vitest api toàn bộ, cây chung, DB mới `ottimo_test_bea_s438k` | **2687/2687** (gồm `s438-money.test.ts` 16 ca) |
| tsc, eslint, prettier (reservations, frontdesk, test mới, `br-examples.json`) | sạch |
| `validate-fixtures` | OK – 0 lỗi |

### 12.4 Sửa thêm (FE-A H09/E04-07, BUG-R2-124)
Bối cảnh: theo DOM, giá gõ là giá lịch, bậc BR-107 áp lên trên. Vì vậy mọi số máy chủ đưa cho Desk để gõ lại phải là giá lịch.
- **`calculateQuote`** nay trả `nightlyRates[].calendarRateVnd` (giá lịch trước bậc). Đơn tạo từ báo giá giữ đúng các đêm đó. `sales.test.ts` BR-302-01 cập nhật theo.
- **`ExtensionOptions.currentBookingRateVnd`** (lỗi tiền) trước trả giá đã giảm của đêm gõ tay cuối, nên "Giữ giá đơn" ở B13 bị giảm hai lần. Nay trả **giá lịch** của đêm đó.
  - Ca test: đơn 202, 7 đêm gõ 700.000 (ghi 630.000). Gợi ý 700.000. Gia hạn đêm 8 với số gợi ý → 630.000, tổng 5.040.000 (giảm đúng một lần).
- **Rà các trường khác Desk có thể gửi lại làm giá gõ** – đều đã là giá lịch:
  - `ExtensionOptions.nights[].defaultRateVnd`;
  - `CheckInPreview.priorNight.defaultRateVnd`;
  - `CheckoutSummary.extraNightDefaultRateVnd`;
  - `MovePreview.nights[].suggestedRateVnd`;
  - `Reservation.nightlyRates[].calendarRateVnd`.
- **Chỉ để hiển thị**, không được gửi lại làm giá gõ (FE-A lưu ý): `MovePreview.oldRateVnd`/`newRateVnd` và `nightlyRates[].amountVnd`.
- **Cần ARC sửa mô tả hợp đồng**: `currentBookingRateVnd` đang ghi "giá ròng", nay là giá lịch.
- **BUG-R2-124**: B12 sang căn khác ghi `reservation_change` bằng số căn (đã sửa trong đợt S4-38). `room-history.ts` đọc được cả dòng cũ ghi id phòng (so `room_no` hoặc `id::text`). Ca test: lịch sử B12 = `203 → 101`; một dòng giả ghi id phòng vẫn đọc ra đúng căn.
- **Kiểm**: vitest api toàn bộ, DB mới `ottimo_test_bea_s438o`: **2688/2688**. tsc, eslint, prettier sạch.
  - Lần chạy trước có 1 ca chập chờn `architecture.test.ts` "dev_clock has a row" – không do BE-A (skeptic REGR đã ghi nhận). Lần sau không lặp lại.

### 12.5 Giá gợi ý của đơn có giá thỏa thuận (CI `72fa486` TC-L3-013; DOM: BR-411-07 = 700.000 đúng)
- **Đơn có giá thỏa thuận** là đơn Trực tiếp/CTV ngắn ngày đặt bằng `nightlyRates` gõ tay. `PricingService` nay ghi `pricing_snapshot.bookingRateSource = 'manual_agreed'`. Với đơn tạo trước khi có cờ: coi là thỏa thuận khi mọi đêm đều gõ tay. Đơn theo lịch giá chỉ có MỘT đêm sửa sau (S4-35) **không** tính là thỏa thuận (giữ BR-107-05).
- **`StaySupport.agreedRate`** trả giá lịch đã gõ (trước bậc):
  - B9a lấy đêm gõ tay đầu tiên;
  - B13 và B18 lấy đêm gõ tay cuối;
  - ngày đặc biệt luôn lấy lịch của ngày đó.
  Áp cho `CheckInPreview.priorNight.defaultRateVnd`, `ExtensionOptions.nights[].defaultRateVnd` (+ mặc định của `extend` khi không gõ giá), `CheckoutSummary.extraNightDefaultRateVnd`. Đơn theo lịch giá giữ S438-DOM-01: lịch Trực tiếp của chính đêm đó (BR-417-04, thứ Bảy 767.000).
- **Kiểm vitest**: đơn 201 gõ 700.000:
  - 05:30 → phụ thu 0, gợi ý đêm B9a 700.000 (BR-411-07);
  - gia hạn gợi ý 700.000, 2 đêm = 1.400.000 (BR-421-01);
  - B18 19:00 gợi ý đêm thêm 700.000 (BR-416-02).
- **Vitest api toàn bộ**: 2689/2689.
- **E2E TC-L3-013 chưa chạy được** trên stack riêng của BE-A (API ts-node :3311): ca bị bỏ qua vì cần `E2E_COMPOSE_CONTROL=1` để làm sạch buồng, mà stack này không chạy bằng compose. Không dùng stack QA/demo. Nhờ QA chạy lại TC-L3-013 bằng `clock-run.sh` sau khi build lại stack QA từ cây chung.

## 13. Phản hồi & sửa vòng 2 sau lượt kiểm lại S4-38 (commit 2f77889; `reviews/s4-money-reverification.md`; DOM bổ sung 18/10)

### 13.1 Kết quả theo mã (test `test/integration/s438r2-money.test.ts`, 14 ca, PostgreSQL thật, số của báo cáo)
| Mã | Sửa | Kiểm chứng |
|---|---|---|
| **BUG-R2-125** (P1, hồi quy) | `ReservationsService.addedNightFee(tx, ctx, row, side, roomBase)`: phụ thu người của đêm thêm lấy định mức của đêm liền kề (đêm đầu cho B9a, đêm cuối cho B18) từ `nightBases` = max(`protectedBaseOf`, định mức căn) – cùng nguồn với lệnh ghi. Dùng ở `priorNightDelta` (xem trước, trần QR `check_in`, kiểm `payment`), `extraNightDelta` (summary, trần QR `check_out`, kiểm `finalPayment`), nhánh OTA/HĐ ngoài (đơn con Trực tiếp), `feesForNewNights` và `createChildStay` | 302 (3 NL) B7 sự cố → 202, B9a 792.000: xem trước = trần QR = B9a = **2.026.000**, tổng 2.626.000, phụ thu 0. Swap 402 ↔ 101, B9a 667.000: **2.067.000**. B14 sự cố 402 → 203, B18 19:00: **792.000** = trần QR = B18. B14 302 → 201: QR `check_out` **708.000** rồi B18 → thừa 0. Đối chứng 202 đặt thẳng 3 NL: **2.226.000** (phụ thu 450.000) |
| **BUG-R2-126** (P1, hồi quy) + R2PAY-04 | Mọi đơn ghi `pricing_snapshot.bookingRateSource` (`manual_agreed` hoặc `calendar`): B2, hold từ báo giá, đơn con B9a/B18, dài hạn nhập tay. Migration **0064** (dữ liệu; snapshot head sinh như các lần trước) bù cờ cho đơn cũ theo lúc đặt: có audit `reservation.priced` với `after.rateSource = 'manual'` → `manual_agreed`, còn lại `calendar`. Bỏ nhánh dự phòng `flag === undefined` trong `agreedRate`. Đêm S4-35/B9a/B13/B18 không đổi cờ | 203 sửa 650.000 → B9a **792.000**. 201 sửa 600.000 → B13 **708.000**, tổng **1.308.000** (gợi ý = ghi). 101 hai đêm sửa 600.000 → B18 **667.000** = summary = ghi. Sửa tăng 900.000: 203 thứ Sáu **911.000**, 202 thứ Tư **792.000**. Đơn cũ (xóa cờ, chạy lại câu UPDATE của 0064): thỏa thuận 302 → `manual_agreed`, B9a/B13/B18 **800.000**, tổng **4.000.000**; đơn lịch → `calendar` |
| **BUG-R2-127** (P1) | `evaluate()` chỉ cộng `priorDeltaVnd` khi `priorNight.available`. `amountDueForQr` từ chối `addPriorNight`/`priorNightRateVnd` (422 `VALIDATION_FAILED`, `NOT_ALLOWED`) khi không có đêm trước trống | 103 đêm trước có khách: **1.000.000**; QR có `addPriorNight` → 422 `NOT_ALLOWED`; trần QR không cờ 1.000.000. 302: QR **1.234.000** rồi B9 14:00 → tổng 1.834.000, còn 0, thừa 0. Đối chứng 203 trống: **1.876.000** = trần = B9a, tổng 2.376.000 |
| **BUG-R2-128 / BR-309-13** (P1) | `setNightRate` (S4-35) tính lại `deposit_required_vnd` bằng `requiredDepositAfterChange` (cùng quy tắc B7/B8), `guestRequest = false`, cả `hold`. Ngoại lệ "< 7 ngày giữ mức cũ" chỉ cho `guest_request` (B7/B8 `other`, `force_majeure`, sự cố, OTTIMO cũng không giữ) | 201 2 × 540.000 sửa khi còn 2 ngày: cọc yêu cầu **300.000**, phí **300.000**, hoàn **200.000**; có B7 sự cố xen vào: cùng số; no-show: giữ **300.000**, yêu cầu hoàn 200.000. 2 × 900.000: 500.000 / 0. 2 × 1.000.000, cọc 700.000: 600.000 / 100.000. Hold: **600.000 → 300.000** |
| **BR-309-14** (S438R2-CANCEL-02) | Mức giữ do khách rút ngắn muộn lưu ở `pricing_snapshot.depositHeldVnd`. Mọi lần B7/B8/S4-35 sau: cọc yêu cầu = max(mức giữ, 30 % tiền phòng hiện hành). `requiredDepositAfterChange` trả `{ requiredVnd, heldVnd }` | 203: 7 → 2 đêm (còn 5 ngày) → 3 đêm (3 ngày) → OTTIMO đổi sang 202: cọc yêu cầu 1.600.000 cả 3 bước; hủy còn 2 ngày: phí **1.600.000**, hoàn 0 |
| **BUG-R2-131** (P2) | `incidentalNet`: dòng đảo lấy loại của dòng nó đảo, FOC/giảm giá lấy loại của dòng theo `related_line_id`, đệ quy (dòng đảo của FOC trên chênh lệch đổi căn là tiền phòng) | Agoda 203 → 401, FOC 250.000, no-show + B12 → nhận phòng đòi **250.000**; → 402: **208.000**; 203 → 302 (FOC 125.000) → 401: **375.000**. Không trả → 409; trả đúng số → 200, folio 0/0. Đề nghị đóng BUG-R2-111 |
| **BUG-R2-132** (P2) | `currentBookingRate` = `agreedRate(tx, row, 'last')` | 101 sau B9a thứ Bảy 767.000 → **null**, đêm 23/5 667.000, tổng **2.768.000**. 202 có đêm S4-35 → null, thứ Năm 792.000. 103 có đêm B13 gõ 700.000 → null, thứ Năm 750.000. Đơn thỏa thuận giữ giá (700.000 ở `s438-money`, 800.000 ở ca 0064) |
| **BR-424-07** (MOVE-06, P3) | `changeRoom` so `expectedDeltaVnd` đã gửi kể cả khi chênh 0 → 409 `SURCHARGE_CHANGED`, không ghi | 202 → 203 sự cố, gửi 119.000 → 409, version và căn không đổi; gửi 0 → 200 |

- **Thử đột biến** trên bản sao: 7 đột biến, mỗi cái bỏ một sửa. Mỗi đột biến làm đỏ đúng ca của mã đó: 127 (1 ca), 125 (3), 126 + 132 (2), 128 (3), 131 (1), BR-424-07 (1), BR-309-14 (1).
- Bỏ `pendingFix` của **BR-309-13, BR-309-14, BR-424-07** (xóa đúng 1 dòng mỗi id).
- Dọn: bỏ biến `party` không dùng ở `priorNightDelta`/`extraNightDelta` (eslint).
- BUG-R2-123 và BUG-R2-133 để tuần Ổn định, theo ORC.

### 13.2 Chạy lại test tái hiện `r2*` ở bản sao (`scratchpad/bea-s4/mirror`, DB mới)
100 ca: 82 xanh, 18 đỏ. Cả 18 ca đều là test ghi hành vi cũ, hoặc trái hướng sửa ORC/DOM đã chốt. Không ca nào là lỗi mã:
- **7 ca khẳng định cờ `bookingRateSource` vắng hoặc null**: `w-r2regr-0-0` SETUP, `w-r2regr-0-1` setup, `w-r2pay-0-1` W-D2, `w-r2pay-2-0` K1/K2/K4, `w-r2pay-2-1` K1. Nay mọi đơn có cờ `calendar` (BUG-R2-126). Trong các ca này, mọi kỳ vọng về tiền đều xanh; chỉ dòng kiểm cờ đỏ.
- **7 ca đơn cũ**: `w-r2pay-3-0` L1/L3/L4/L5, `w-r2pay-3-1` L1/L2/C1. Test xóa cờ lúc chạy (sau khi migration đã chạy) để giả đơn cũ. Khi đã bỏ nhánh dự phòng, đơn không cờ được coi là đơn lịch. Đơn cũ thật được 0064 bù cờ. Ca 0064 trong `s438r2-money` (xóa cờ rồi chạy lại câu UPDATE) ra đúng số báo cáo: 800.000, tổng 4.000.000.
- **2 ca E1b** (`w-r2pay-1-0`, `w-r2pay-1-1`): test tạo QR `check_in` với `addPriorNight: true` khi đêm trước có khách. Nay QR đó bị từ chối 422 (BUG-R2-127), nên không có tiền, và B9 14:00 → 409 `balance_paid`. Ca tương ứng trong `s438r2-money` (QR không cờ 1.234.000 → B9 → 0/0) xanh.
- **2 ca "theo chữ BR-309-11"** (`w-r2cancel-1-0` W1x, `w-r2cancel-1-1` C1): DOM đã sửa chữ thành BR-309-14 (giữ 2.100.000).
- Ghi chú: `w-r2cancel-0-0` và `-1-0` ghi log vào đường cố định. Phải tạo trước thư mục `scratchpad/bea-s4/w-r2cancel-*`, nếu không sẽ ENOENT.

Người kiểm lại cần đổi kỳ vọng của 18 ca này.

### 13.3 Kết quả lệnh (18/10 ~01:45)
| Lệnh | Kết quả |
|---|---|
| vitest api toàn bộ, cây chung, DB mới `ottimo_test_bea_r2full2` | **2708/2708** (gồm `s438r2-money.test.ts` 14 ca) |
| Lần chạy trước, DB mới `ottimo_test_bea_r2full` | 2707/2708. Ca đỏ: `registration-flow.test.ts` BUG-R2-036 purge (`t01Images ≥ 1`; tick dùng chung giữa các tệp chạy song song). Chạy riêng tệp: 22/22; chạy lại toàn bộ: xanh. Không thuộc module BE-A |
| tsc; eslint `src` + `test`; prettier `src` + `test` | sạch (đã chạy prettier cho `0064_snapshot.json`) |
| Migration 0064 | áp được trên DB mới (cả bộ test migrate từ đầu); `schema-parity`, `migrations-journal` xanh |

### 13.4 Việc cho vai khác
- **ARC** – sửa mô tả hợp đồng:
  - `CheckInPreview.amountDueAtCheckinVnd`: chỉ cộng đêm B9a khi `priorNight.available`;
  - `createVietQr purpose=check_in`: `addPriorNight` khi đêm trước không trống → 422 `NOT_ALLOWED`;
  - `ExtensionOptions.currentBookingRateVnd`: null = đơn không có giá thỏa thuận lúc đặt; có giá thỏa thuận → giá lịch của đêm gõ cuối;
  - `changeRoom.expectedDeltaVnd`: so cả khi chênh 0;
  - `Reservation.depositRequiredVnd`: đổi theo S4-35.
- **FE-A**: `CheckInPage.tsx` đọc `priorNight.available`, không gửi `addPriorNight` khi false (server nay trả 422).
- **QA / người kiểm lại**: đổi kỳ vọng 18 ca ở 13.2; cập nhật bug-list (125, 126, 127, 128, 131, 132 đã sửa; đóng BUG-R2-111).
- **OPS**: 0064 là migration dữ liệu. Sau khi deploy, kiểm `SELECT count(*) FROM reservation WHERE NOT (pricing_snapshot ? 'bookingRateSource')` = 0.

### 13.5 Giả định (ghi decision-log, nhãn [GIẢ ĐỊNH BE-A])
- (r2-1) Cờ của đơn cũ suy từ audit `reservation.priced` lúc tạo (`rateSource = 'manual'`), có từ Sprint 2. Đơn tạo thẳng bằng SQL (không có audit) → `calendar`.
- (r2-2) Mức giữ BR-309-14 lưu ở `pricing_snapshot.depositHeldVnd`, không thêm cột. Mức giữ chỉ sinh khi `guest_request` làm giảm lúc còn < 7 ngày. Các thay đổi sau không xóa mức giữ. Nếu INV chọn ESC-023 B/C thì bỏ phần sinh mức giữ.
- (r2-3) Đơn `hold` chưa có dòng folio. Vì vậy S4-35 trên hold chỉ đi qua cổng `StayNightPricingPort.setNightRate` (ca test gọi thẳng cổng). Desk hiện chưa có đường sửa giá hold qua folio.
- (r2-4) `setNightRate` không tính lại cọc cho đơn OTA, nội bộ, HĐ ngoài và dài hạn (các đơn này không có cọc 30 % theo BR-305), giống B7/B8.

## 14. Vòng sửa 3 sau kiểm lại lần 3 (commit 42fb458; `reviews/s4-money-recheck3.md`; DOM 18/10; ARC `openapi-0.3.7.md` mục 16; SEC `s4-SEC-lateFee-reauth.md`)

### 14.1 Kết quả theo mã (test `test/integration/s438r3-money.test.ts`, 12 ca, PostgreSQL thật)
| Mã | Sửa | Kiểm chứng |
|---|---|---|
| **BUG-R2-134 / BR-417-07, BR-429 (b1)** (P1) | **Một hàm giá gợi ý đêm kề** `StaySupport.addedNightRate` (+ `addedNightContext`) cho B9a, B13 (mặc định + `currentBookingRateVnd`), B18: (1) giá nhập tay (lúc đặt hoặc S4-35) của **đêm kề** (đầu cho B9a, cuối cho B13/B18) khi đêm đó ở căn hiện tại (`agreedRate` theo đêm kề, không còn "đêm gõ tay cuối bất kỳ"); (2) khách xin đổi căn → đêm đã chuyển mất cờ gõ tay → lịch căn mới, `currentBookingRateVnd` null; (3) căn hiện tại ≠ căn khách mua (`boughtRoomOf`: căn của lần khách xin cuối, else căn gốc) → min(giá khách mua – giá thỏa thuận hoặc lịch căn mua – lịch căn hiện tại), cả đơn lịch giá; (4) luôn kẹp sàn–trần BR-105. Đêm B13 mặc định khác lịch được ghi là đêm gõ tay; gõ đúng số gợi ý = để mặc định; mặc định cũng qua kiểm sàn–trần. MovePlanner (b1): đêm thêm khi khách ở căn OTTIMO chọn = min(lịch căn mua, lịch căn của đêm) – thay "lịch căn cũ" DOM-S4-01. `writeMovedNights` ghi lại snapshot khi có đêm gõ tay bị định giá lại (kể cả khi tổng tiền không đổi) | 201 thỏa thuận 700.000 → 401 (khách xin): B13 **1.042.000**, gõ lại số đó = mặc định, B18 thứ Sáu 1.198.000 = trần QR = ghi. 302 1.000.000 → 101: **667.000 / 767.000 / 3.768.000**. 202 650.000 → 301: **958.000 / 1.102.000 / 4.626.000**. 302 1.100.000 → 102: **750.000 / 863.000 / 4.213.000**. Đối chứng: không đổi căn → 650.000; sự cố → 402: **700.000** (min) và lần gia hạn sau vẫn 700.000; sự cố → 101: 667.000. Đơn lịch giá sự cố 202 → 401: B9a 792.000, B13 792.000 (`currentBookingRateVnd` 792.000), B18 thứ Sáu 911.000. Hoãn bất khả kháng 401 → 202: đêm mới theo 202 (1.584.000); BR-429-11 (202 → 401) vẫn 1.822.000 |
| **BUG-R2-139 / BR-416-06** (P2, trước cổng) | `dueAtCheckout` không bao giờ cộng đêm không bán được; tóm tắt có `lateFeeAsNightVnd` (= `extraNightDefaultRateVnd`) và `amountDueAtCheckoutVnd` gồm khoản này. QR: `AmountDueQuery.lateFeeAsNight` (vắng → không gồm; sai trường hợp → 422 `NOT_ALLOWED`; `extraNightRateVnd` khi không bán được → 422 `NOT_ALLOWED`). B18 `lateFeeInsteadOfNight { amountVnd, reason, approverUsername?, authMethod, secret, requestFoc? }`: thiếu → 422 `LATE_CHECKOUT_AFTER_LIMIT` (`field` = `lateFeeInsteadOfNight`), số lệch → 409 `SURCHARGE_CHANGED`, ghi dòng `late_checkout` `charge_code = late_fee_as_night` (không `stay_night`, không tính lại bậc), FOC trả muộn đã duyệt đi theo; `requestFoc` duyệt ngay trong giao dịch bởi người xác nhận (vượt khoản → 422 `VALUE_OUT_OF_RANGE`, vượt hạn mức → 403 `APPROVAL_LIMIT_EXCEEDED`, không ghi gì); audit `money` `reservation.late_fee_instead_of_night` (người gọi, người xác nhận, kênh `desk`/`self`, `authMethod`) | 203 16–18/04/2030, đã thu đủ, căn có khách đến: tóm tắt **792.000** = trần QR (`lateFeeAsNight`) = B18; không cờ → trần 0. Sai mật khẩu / tên không có / FD không đủ vai → cùng 401; `pin` → 422; số 700.000 → 409; miễn 50 % → FOC **396.000**, khách trả **396.000**, folio 0/0, đơn 2 đêm 1.584.000. MGR tự làm B18 với mật khẩu của mình → 200. Đối chứng căn trống: đêm thêm 792.000, tổng 2.376.000 |
| **SEC BE-59…64** (điều kiện D5) | `PasswordReauth.verifyApprover` (hàm riêng): tìm dưới RLS trong tổ chức, ghép `user_property_role` đúng cơ sở, OWN/MGR chưa thu hồi; đủ điều kiện = `active`, không khóa, không `must_change_password`, không `mfa_enabled`; argon2 đúng 1 lần (hash dummy khi không đủ điều kiện); mọi lỗi cùng 401; người gọi hoặc người xác nhận đang khóa → 429. Sai: tăng bộ đếm người gọi và người xác nhận (đủ điều kiện), giao dịch riêng; đúng: chỉ xóa bộ đếm người xác nhận. Audit `security` không ghi tên đã gõ; bị khóa → `security_alert`; xác nhận hộ thành công → `account_security_change` cho người xác nhận. Kiểm nghiệp vụ chỉ đọc (`lateFeePrecheck`) trước khi thử mật khẩu. Log: `formatters.log` che `secret` ở mọi độ sâu (gồm `setParameter.reauth.secret`); `withoutSecrets` giữ nguyên Error/Date | Ca BR-416-06: bộ đếm FD 3, MGR 1 sau 3 lần sai → MGR 0 sau lần đúng; mật khẩu thử không có trong audit, `idempotency_key`, thân Problem; ca log: `Pw-Leak` không có trong log, thông điệp lỗi vẫn còn |
| **BUG-R2-136 (phần BE-A)** | B14 gọi `FrontdeskMinibarPort.onCheckedOut(đơn, căn cũ)` (như B18 và trả về căn cũ), không chặn đổi phòng. Tóm tắt `minibarUncheckedRooms` + blocker B18 xét mọi tủ qua `uncheckedRooms?` của BE-B (thiếu thì chỉ căn hiện tại như cũ) | Spy cổng: B14 202 → 203 gọi `onCheckedOut` cho 202 đúng một lần |
| **BR-309-15 (BUG-R2-143, S438R3-GAP-Q1)** | Khách xin dời ngày đến khi còn < 7 ngày tới ngày đến cũ (đơn đã cọc) → `pricing_snapshot.refundPctCap` = min(trần cũ, % hoàn lúc dời); hủy sau đó hoàn theo min(% lúc hủy, trần) | 203 dời lúc còn 5 ngày, hủy trước 60 ngày: hoàn **250.000**, phí **250.000**; dời lúc còn 16 ngày: hoàn 500.000 |
| **BR-309 (v)** | Mức giữ chỉ cho đơn đã cọc: B7/B8 của đơn `hold`/chưa thu cọc và S4-35 trên `hold` luôn tính 30 % tiền phòng hiện hành | Hold có `depositHeldVnd` 600.000 (giả) sửa 2 × 540.000 → **300.000** |
| **BR-110-17** (kiểm mã) | Không đổi mã | Agoda 302 3 NL → 202: B9a đêm con phụ thu **0** (sự cố) / **150.000** (khách xin); đêm OTA 0 |
| **Ví dụ BR-309 (Gaps 3)** (kiểm mã) | Không đổi mã | 2 × 550.000 (500.000 dưới sàn 201) cọc 1.000.000, một đêm giảm đặc biệt 100 %: phí **300.000**, hoàn **700.000** |

- **Thử đột biến** (bản sao, 7 đột biến): `agreedRate` theo đêm gõ tay cuối bất kỳ → đỏ 2 ca 134; bỏ min sau OTTIMO → đỏ 2 ca; bỏ phụ thu thay đêm → đỏ BR-416-06; bỏ gọi `onCheckedOut` ở B14 → đỏ; bỏ khóa bậc hoàn → đỏ BR-309-15; bỏ "hold không mức giữ" → đỏ. Bỏ min trong MovePlanner không đỏ ca của tệp này (đổi căn rẻ hơn cho cùng số) nhưng đỏ BR-429-11 ở `move-pricing.test.ts`.
- Bỏ `pendingFix`: **BR-417-07, BR-416-06, BR-309-15**. BR-703-01 (136) để BE-B.
- E2E: TC-L4-120/121 (QA, `late-fee-qr.s4.clock.spec.ts`) chạy trên stack riêng BE-A (API :3311, DB mới, DS-E), `E2E_FIXED_BUGS=BUG-R2-139`: TC-L4-121 **đạt**; TC-L4-120 đạt mọi bước BR-416-06, chỉ lệnh B18 cuối trả 409 `MINIBAR_NOT_CHECKED` – ca **thiếu bước đếm minibar** (DS-E có món tính tiền; B18 luôn chặn khi chưa đếm, cả trước sửa). Bản sao thêm `minibarCheck` trước B18: **2/2 đạt** (bản sao đã xóa). Đã xóa `BUG-R2-139` khỏi `OPEN`. **Không** chạy qua `qa-s4/clock-run.sh`: stack QA đang chạy dist 42fb458, dựng lại bằng cây chung (đang có việc dở của BE-B) là việc của QA/OPS.
- Test tái hiện r3 ở bản sao (`x-r3rate-*`, `x-r3pay-0-*`, `r3rate`): 29/34 xanh, 5 skip (thiếu `R3_MIG_URL`), 5 đỏ đều là kỳ vọng cũ: X1 B18 thứ Sáu 05/03/2027 kỳ vọng 1.042.000 (đúng là lịch thứ Sáu 1.198.000); A1 lần gia hạn gõ số gợi ý nay đạt nên ngày đi lùi một ngày, B18 gọi sớm → 409 (số trong log: 958.000 / 1.102.000 / tổng 4.626.000 đúng); x-r3pay-0-0 A, x-r3pay-0-1 MAIN kỳ vọng tóm tắt 0 (ARC chốt gồm `lateFeeAsNightVnd` 792.000) và chưa có đường `lateFeeInsteadOfNight`; x-r3pay-0-0 C tạo QR theo số tóm tắt mà không gửi `lateFeeAsNight` → trần 0 (ARC D6), nên B18 409 `BALANCE_DUE`.

### 14.2 Kết quả lệnh (18/10 ~03:25)
| Lệnh | Kết quả |
|---|---|
| vitest api toàn bộ, cây chung, DB mới `ottimo_test_bea_r3full2` | **2730/2730** (gồm `s438r3-money` 12 ca; cây có phần minibar M-1 và 0065 của BE-B) |
| tsc; eslint `src` + `test` | sạch |
| prettier tệp BE-A | sạch (6 tệp BE-B đang sửa dở chưa format: `folio.service.ts`, `fridge.ts`, `minibar.service.ts`, `minibar-m1`, `minibar-catalog-s4-bed`, `s438-beb`) |
| `gen-openapi-meta --check`, api-client `gen` | up to date (api-client sinh lại sau khi thêm mã audit) |
| `validate-fixtures` | 0 lỗi (1 cảnh báo cũ ds-0) |

### 14.3 Tệp ngoài module BE-A (nhờ chủ xem)
- `identity/public/password-reauth.ts` (BE-B/SEC): thêm `verifyApprover` – theo SEC BE-59/60/63, không đụng `verify`.
- `http.ts`, `shared/secret-fields.ts` (ARC/OPS): `formatters.log` + `withoutSecrets` bỏ qua đối tượng không phải JSON thuần (SEC BE-61).
- `audit/public/money-actions.ts` + `docs/api/openapi.yaml` (ARC): thêm `reservation.late_fee_instead_of_night` vào danh sách đóng `AuditEvent.action` (mô tả `checkOut` của ARC đã dùng mã này; test `module-boundaries` buộc hai bên khớp); api-client sinh lại. UXD/FE cần câu `mlog.a_reservation_late_fee_instead_of_night`.
- `frontdesk/public/ports.ts` (của BE-A): `FrontdeskMinibarPort.uncheckedRooms?` (BE-B đã cài).
- `tests/e2e/support/known-bugs.ts` (QA): xóa `BUG-R2-139` khỏi `OPEN`.

### 14.4 Cho vai khác
- **BE-B**: dùng `ReservationSalesPort.amountDueNowFor(tx, q: AmountDueQuery): Promise<number>` ở `confirmPaymentReceived` (D7 – tính lại lúc xác nhận theo ngữ cảnh lưu, không từ chối: tùy chọn hết hiệu lực bị bỏ, đơn đã qua bước → số dư folio); truyền `lateFeeAsNight?: boolean` vào `AmountDueQuery` cho `createVietQr` (đã thấy ở `payments.controller`). Đếm tủ căn cũ sau B14 phải tự sinh việc bổ sung ở `record()` (B14 chỉ gọi `onCheckedOut` khi đã có lần đếm).
- **QA**: TC-L4-120 thêm `minibarCheck` trước lệnh B18 cuối; chạy lại TC-L4-120/121 qua `clock-run.sh` sau khi dựng lại stack QA; đổi kỳ vọng 5 ca r3 ở 14.1.
- **ARC**: ARC-24 (401/403/429 cho `checkOut`), mã audit mới trong danh sách đóng, `amountDueNowFor`.
- **FE-A**: `CheckOutPage` đường "phụ thu bằng giá 1 đêm" (tên đăng nhập + mật khẩu quản lý + lý do; `requestFoc` tùy chọn); QR `check_out` gửi `lateFeeAsNight`.

### 14.5 Giả định (ghi decision-log)
- (r3-1) "Căn khách mua" = căn của lần khách xin đổi cuối, không có thì căn gốc; ngày đặc biệt: min giữa lịch đặc biệt của hai căn. **DOM sửa phạm vi 18/10**: min sau OTTIMO áp **cả đêm con Trực tiếp của đơn OTA** (B9a, gia hạn, B18) – đã sửa `addedNightContext`; oracle mới **BR-417-10** (Agoda 203 → 401 sự cố, gia hạn thứ Tư **792.000**; khách tự xin → 1.042.000), ca test trong `s438r3-money` (13 ca), đột biến bỏ nhánh OTA làm đỏ ca; vitest api toàn bộ **2731/2731**. (r3-2…r3-4) DOM đồng ý.
- (r3-2) Đêm gõ tay ở căn hiện tại sau một lần OTTIMO đổi căn (S4-35 sau đổi) vẫn qua min – có lợi cho khách.
- (r3-3) Khóa bậc hoàn (BR-309 (iv)) chỉ khi ngày đến đổi do `guest_request`, gồm cả "dời thay hoàn"; tính % theo bậc thường (đêm cao điểm đã có cờ riêng).
- (r3-4) `requestFoc` của BR-416-06 chỉ nhận `kind = foc` (giảm giá đặc biệt chỉ cho dòng phòng – quy tắc folio); người gọi là OWN/MGR thì yêu cầu tự duyệt khi gửi.
- (r3-5) Người xác nhận không đủ điều kiện (không vai, khóa, MFA, đổi mật khẩu bắt buộc) không bị tăng bộ đếm; chỉ người gọi bị tăng.
