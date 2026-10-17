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
