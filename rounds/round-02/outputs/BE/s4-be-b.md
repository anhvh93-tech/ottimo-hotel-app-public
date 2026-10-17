# BE-B – Round 2, Sprint 4: FOC theo khóa, thu tiền, duyệt, hoàn (bước Sản xuất)

- Vai: BE (luồng BE-B) | Ngày: 17/10/2026 | Bước: Sản xuất | **Không commit** (ORC commit)
- Đầu vào: `sprint-4-plan.md` (đóng băng D1) mục 3, 4, 4.1, 8.3, 11; OpenAPI 0.3.7 + `outputs/ARC/openapi-0.3.7.md` (mục 10, 11); BR v0.3.6 (BR-434 kể cả thứ tự S4-23, BR-433, BR-412, BR-315 (g), BR-309, BR-522); `br-examples.json`; `qa/bug-list.md` (055, 056, 059, 060, 061, 104); `s4-carryover.md`; decision-log tới dòng MOB đợt 2.
- Tin nhắn ORC trong lúc làm: (1) `closed_reservation_credit` phát qua `openAttention` không `params` (BE-D 2.2) – đã làm; (2) xóa mã lỗi đã sửa khỏi `known-bugs.ts` + sửa **BUG-R2-104** – đã làm; (3) US-066, US-003 AC2 và S4-20 chuyển BE-D – đã bỏ khỏi danh sách; (4) bộ đọc `depositNotices` (0.3.7 bổ sung 1) – đã làm phía payments, chờ cổng của BE-A.

## 1. Kết quả theo mục

| Mục | Trạng thái | Điểm chính | Kiểm chứng |
|---|---|---|---|
| **S4-02** (BUG-R2-056) | **Xong mã – mốc D3** | FOC đi theo = min(**số đã duyệt** trên `approval_request.amount_vnd`, dòng mới) cho mọi khóa: đêm phòng, phụ thu người, nhận sớm/trả muộn (một khóa mỗi lượt), dòng khác (đi theo bản thay của `adjustFolioLine`). Dòng về 0 → `dormant` (không dòng FOC, yêu cầu vẫn `approved`), có lại → `applied` (không duyệt lại). Hạn mức tháng chỉ cộng `applied`/`dormant`; folio đã chốt → số thực áp | BR-434-07, BR-434-08 (4A→3A+1C→2A→4A) xanh; QA E2E TC-NT-047 phần S4-02, TC-NT-049 (2) xanh trên stack riêng |
| **S4-18** (BUG-R2-059) | **Xong mã – mốc D3** | FOC **chờ duyệt** đi theo dòng mới (dòng "chờ duyệt" cũ `rejected`, dòng mới trên dòng hiện tại, `lineChangedNote` cũ → mới, `effectiveAmountVnd` = "khi duyệt sẽ áp X"); duyệt đọc lại dòng trong cùng giao dịch; không còn đêm tương ứng → `cancelled` + `autoCancelReason = line_removed` + thông báo `approval_cancelled` cho người gửi và người đã được hỏi duyệt; FOC đã duyệt bị hủy theo quy tắc → `focState = cancelled` + audit `folio.foc_cancelled` (`approvalRequestId`, `serviceDate`, `amountVnd`, `reason`) + trả hạn mức | BR-434-09, BR-434-10, BR-433-03 xanh; QA E2E TC-NT-046, TC-NT-049 (4)(5)(6) xanh |
| **S4-34** (BUG-R2-061) | Xong mã | `replaceLateCharge` (frontdesk, của BE-A – chạm 1 hàm) không tự mang FOC nữa: đảo dòng cũ (không đồng bộ giữa chừng), ghi dòng mới, gọi hàm đồng bộ một lần (`cause = checkout_time_change`) | BR-412-15/16/17 xanh (giá căn seed 667.000 – cùng bậc %); QA E2E TC-NT-045 (a)(b), TC-NT-046 (a) xanh |
| **S4-23 phần thứ tự** | Xong mã | Nhiều khoản trên một khóa áp theo **thứ tự lúc duyệt**: áp(i) = min(duyệt(i), dòng − Σ áp trước); tổng = min(Σ, dòng), không âm; khoản áp 0 → ngủ; mỗi lần đồng bộ tính lại cả khóa từ số đã duyệt; hàng chờ "khi duyệt sẽ áp X" trừ các khoản đã duyệt; số xin mới ≤ dòng − (đang áp + đang xin) | BR-434-11 (cả hai thứ tự), BR-434-12 xanh (unit + PostgreSQL) |
| **S4-22** (BUG-R2-060) | Xong mã | No-show: FOC đã duyệt của các đêm bị hủy → `suspended` (audit `folio.foc_suspended`, ngoài hạn mức); FOC chờ duyệt của đơn → tự hủy `reservation_no_show`. Khôi phục B12: đêm quay lại → FOC của chính đêm đó áp lại = min(số đã duyệt, giá đêm), audit `folio.foc_restored` (`from = suspended`), hạn mức tính lại | BR-315-06 xanh; QA E2E TC-NT-049 (3) xanh |
| **S4-01 + S4-03** (BUG-R2-055) | Xong mã | Dòng phòng ghi theo **giá gộp** của đêm, FOC là dòng riêng – không còn đêm âm, `allocate` không lỗi; `stay_night.discount_vnd` đặt tuyệt đối = số đang áp; hoa hồng/phí kênh tính trên số ròng **đọc sau** đồng bộ | Ca đơn có người chốt FOC 100 % + B7 hạ giá (BR-107) → 200, FOC = giá mới, base hoa hồng = Σ ròng; ca B8 dời FOC → base đúng ngay; QA E2E BUG-R2-055 xanh |
| **S4-06** | Xong mã | Hủy/no-show: **một** yêu cầu hoàn = số dư thừa sau phí và đảo dịch vụ (không gồm tiền OTA); đã có yêu cầu mở thì chỉ xin phần còn thiếu; mục "Cần chú ý" `closed_reservation_credit` (không `params`, dedupe theo đơn) mở khi còn dư, **tự đóng** khi chi đủ (`RefundsService.payOut`). `CancellationQuote.refundRequestVnd` ở `dryRun` = số lệnh ghi tạo | Ca dryRun = ghi; ca mở/đóng mục chú ý theo chi một phần rồi đủ |
| **S4-08** | Xong mã | `CancellationQuote.serviceLines[]` (ròng sau FOC, `performed` = ngày dịch vụ < ngày nghiệp vụ), `serviceReversedVnd`, `serviceRetainedVnd`; `cancelReservation.retainLines` / `markNoShow.retainLines` (kiểm `NOT_IN_LIST` / `REASON_REQUIRED` theo `retainLines[i].*`); dịch vụ không giữ tự đảo cùng FOC trên nó (FOC → `cancelled`), lý do giữ vào audit `folio.stay_reversed`. Dry run và ghi dùng **một hàm** `FolioService.closeStayPreview` | 2 ca hủy + no-show (gồm 422 trước khi ghi gì) |
| **S4-13** | Xong mã | Test đua duyệt ‖ B7 đổi giá (5 vòng), duyệt ‖ B10, duyệt ‖ B11 (4 vòng) với kiểm bất biến. **Tìm ra deadlock 40P01** (duyệt khóa folio rồi `stay_night`, hủy khóa `stay_night` rồi folio) → thứ tự khóa mới: quyết định FOC khóa **các đơn của folio → folio → yêu cầu** (`ApprovalService.onBeforeDecide`, `FolioService.lockStay`; `requestFoc` cùng thứ tự) | 3 lượt chạy liền xanh, không 40P01 |
| **BUG-R2-104** | Xong | `minRoleFor('special_discount')` = lễ tân trưởng (trong hạn mức BR-433, vượt thì chuyển cấp) | QA E2E TC-NT-049 (4) phần hạn mức xanh |
| **#6 `expectedVersion`** | **Xong trên bản vá riêng – chưa vào cây chung** | `approveRequest`/`rejectRequest.expectedVersion`: `refund` thiếu → 422 `expectedVersion: REQUIRED`, lệch → 412 `VERSION_CONFLICT` (`currentVersion`), không ghi gì; loại khác tùy chọn (gửi thì kiểm). `ApprovalRequest.version` đã có trong phản hồi ngay bây giờ (không gây vỡ) | Bản vá `outputs/BE/s4-be-b-b6-expected-version.patch` (6 tệp, `git apply --check` sạch trên cây hiện tại) – xem mục 3 |
| **S4-35 phần B** | Xong mã | `adjustFolioLine` dòng `room`/`extra_person` của đơn `hold/confirmed/in_house`: gọi `StayNightPricingPort.setNightRate` (BE-A) **trước** khi khóa folio, đảo dòng, ghi lại theo số cổng trả, tính lại FOC của khóa; `newQuantity`/`voidLine` → 422 `NOT_ALLOWED`; ngoài BR-105 → 422 `RATE_OUT_OF_RANGE`. Bỏ chặn tạm ARC-BE-S3-14 | Ca thay ca tạm cũ: 422, FOC 100 % theo giá mới rồi khôi phục khi giá lên lại |
| **S4-37 (`otaPenaltyVnd`)** | Xong | Trần tiền phạt OTA = tiền phòng của đơn OTA (bỏ phụ thu người thu tại quầy); thêm ca 422 | Ca vượt 1 đồng → 422 `VALUE_OUT_OF_RANGE`, bằng → 200 |
| 0.3.7 bổ sung 1 `depositNotices` | Xong phía payments | `payments/public/deposit-notices.ts` (`readDepositNotices`: mới nhất trước, `updatedAt` của lần báo gần nhất, `createdByName`), đăng ký qua `ReservationHooks.provideDepositNotices` **khi BE-A thêm cổng** (gọi có điều kiện – chưa có thì không làm gì) | Ca đọc 2 bản (open/handled) |
| S4-25 (BE) | Không cần thêm mã | Desk xin FOC ngoài nhận phòng bằng `requestFoc` (mọi dòng) và B15 `requestFocForSurcharge` – nay đi qua hàm đồng bộ khóa. Gộp theo rào (sau khi QA đóng 056/059/061) | – |
| S4-28 phía API | Không cần thêm mã | FE-A dùng `createVietQr purpose=deposit`, `confirmDeposit.existingPaymentId` đã có | – |
| B-10 | Đọc mã, không đổi | `recordPayment` 409 `FOLIO_LOCKED` (qua `lockForPosting`), `reversePayment` 409/422 khớp mã đã khai | – |
| US-066, US-003 AC2, S4-20 | **Chuyển BE-D** (ORC) | – | – |
| S4-42, S4-23 phần lọc `service_date` null | Xong ở đợt 2 (mục 9) | – | – |
| S4-43 | Chưa làm (NÊN) | – | – |

## 2. Cách cài (tóm tắt cho review ARC/QA)

- **Hàm thuần** `folio/public/reductions.ts`: `allocateKey` (S4-23), `maxNewRequestVnd`, `focDateMap` (BR-434 (1)–(3)), `previewNightReductions` (bản tính thử cho đêm sau khi đổi). **Lệnh ghi** `FolioService.syncReductions(tx, folioId, opts)` dùng đúng các hàm đó: nạp yêu cầu `foc`/`special_discount` đang mở hoặc còn sống của folio (khóa `FOR UPDATE`), dựng kế hoạch theo khóa, đối chiếu dòng FOC (giữ nếu đúng; dòng "chờ duyệt" trở thành dòng áp nếu đúng số và đúng dòng – đường cũ; còn lại đảo + ghi mới), đổi `focState` + audit, đặt `stay_night.discount_vnd`. Gọi ở: `syncStay` (B2/B4/B7/B8/B12/B13/B14/B16/PATCH người – sau khi dời khóa theo bản đồ ngày), `voidStay` (B10/B11/di dời – hai pha), `replaceLateCharge`, `reverseLine` (mặc định), `adjustFolioLine`, quyết định duyệt, `settle` (FOC còn ngủ → hủy `settled_while_dormant`).
- **Cho BE-A (M2 – xem trước = ghi)**: `FolioService.previewStayReductions(tx, folioId, reservationId, nights[{date, roomVnd, extraPersonVnd}])` → theo ngày `roomFocVnd`, `roomPendingVnd`, `extraFocVnd`, `extraPendingVnd` + `oldAppliedVnd`/`newAppliedVnd` (folioDeltaVnd = lines delta − (new − old)). `FolioService.pendingReductionsVnd(tx, folioId)` cho BR-402 (M4). `resyncStay` nhận thêm `cause` (tùy chọn) cho `lineChangedNote`. `MoneyBridge.closeStayPreview/closeStayCredit` cho hủy/no-show.
- **Hợp đồng 0.3.7 D1 trên `ApprovalRequest`**: `effectiveAmountVnd`, `focState`, `focCancelReason`, `lineChangedNote`, `autoCancelReason`, `version`; `folioLineId` = **dòng FOC hiện tại** của yêu cầu (đi theo dòng mới) – xem giả định (a) mục 5. Tính bằng `ApprovalService.provideFocView` ← folio (một lần tính mỗi folio của trang danh sách, chỉ đọc).
- **Migration `0060_foc_key_date.sql`** (số ORC cấp): `approval_request.foc_service_date date` + CHECK (chỉ loại FOC) + backfill ngày của dòng gốc + GRANT UPDATE cột. Schema `approvals.ts`, journal +1 dòng; **không** sinh snapshot (ORC sinh khi tích hợp).
- Audit: tập đóng không đổi (`folio.foc_*` đã có ở 0055/`money-actions.ts`); allowlist `approval_request` thêm `approvalRequestId`, `focState`, `focCancelReason`, `effectiveAmountVnd`, `serviceDate`, `reason`, `from`; `folio` thêm `serviceReversedVnd`, `serviceRetainedVnd`.

## 3. #6 `expectedVersion` – bàn giao cùng FE-A (một PR)

- Tệp: `rounds/round-02/outputs/BE/s4-be-b-b6-expected-version.patch` – `git apply` từ gốc repo. Gồm: `approvals.controller.ts` (đọc `expectedVersion` – số nguyên ≥ 0, sai kiểu → 422), `approval.service.ts` (`assertExpectedVersion` sau khi khóa dòng), test BE (`approvals-refund-payout`: ca B-6 422/412/200 cho duyệt và từ chối; cập nhật các chỗ duyệt/từ chối `refund` ở `payments-s3`, `frontdesk.test` – tệp của BE-A), và **xóa `B-6` khỏi `OPEN`** của `tests/e2e/support/known-bugs.ts`.
- Đã chạy trên bản sao cây hiện tại có áp bản vá: 168/168 ca liên quan + `frontdesk.test` 18/18 xanh; toàn bộ suite không phát sinh đỏ mới do bản vá.
- **ORC/QA lưu ý khi gộp**: E2E/UI còn duyệt `refund` mà không gửi `expectedVersion` (vd. helper `support/s3.ts`, `ui/desk-writes.*`) sẽ nhận 422 – QA cập nhật cùng PR; Desk (FE-A) gửi `version` đọc từ `listApprovalRequests`.

## 4. Test và lệnh (17/10 ~20:30, Node 22.23, PostgreSQL 17 `ottimo-dev`, DB riêng `ottimo_test_beb_s4` tạo lại sạch; E2E trên stack riêng cổng 3270 + DB `ottimo_e2e_beb`, **không đụng stack demo**)

| Kiểm | Kết quả |
|---|---|
| `test/integration/foc-keys-s4.test.ts` (mới, 21 ca – oracle BR-434-07…12, BR-433-03, BR-412-15…17, BR-315-06, S4-22 chờ duyệt, S4-01, S4-03, S4-13 ×2, S4-08 ×2, S4-37, `depositNotices`) | 21/21 xanh |
| `test/be-b-s4-units.test.ts` (mới, 8 ca thuần đọc `br-examples.json`) | 8/8 |
| Bộ liên quan (`payments-s3`, `folio-payments`, `approvals-refund-payout`, `foc-resync`, `ota-prepaid-flow`, `approvals-audit`, `be-b-review-fixes`, `be-b-s3-units`, `module-boundaries`, `migrations-journal`) | 246/246 |
| Toàn bộ `@ottimo/api` (bản sao cây chung **có áp bản vá #6**, xem vướng mắc 1) | 2.493 xanh; 63 đỏ: 1 do bản vá #6 (`frontdesk.test` A-34 duyệt `refund` không gửi `expectedVersion` – đã thêm sửa vào bản vá, chạy lại 18/18); 62 **ngoài phạm vi BE-B**: 57 do bỏ `HousekeepingModule` trong bản sao (housekeeping-s4, rbac-sprint4-bec), 1 BE-C BUG-033 đang làm (frontdesk-s3-fixes), 1 `openapi-meta` cũ (contract), 3 do bản sao thiếu `design/copy` (ca sinh chuỗi); tệp `schema-parity` đỏ vì chưa có snapshot 0055–0061 (theo quy tắc ORC – ORC sinh khi tích hợp) |
| QA E2E `api/money-s4.api.spec.ts` (stack riêng) | Ca của 055/056/059/060/061/104/S4-23: xanh. Ca còn gắn `S4-21`/`S4-07` (BE-A) báo "expected to fail but passed" – BE-A xóa mã của mình; với `E2E_FIXED_BUGS=S4-21,S4-04,BUG-R2-057,BUG-R2-058`: 33/34, đỏ duy nhất TC-L2-092 (BE-A, `property_fault` + `applyDifference` → 409) |
| QA E2E `clock/money-s4.clock.spec.ts` | 6 xanh (gồm 060, 061, 104, BR-433-03), 1 `test.fail` đúng dự kiến (BUG-R2-038 – BE-A), 3 bỏ qua (S4-05/S4-04 chưa đóng) |
| `tsc --noEmit` api | 0 lỗi ở tệp BE-B (còn 2 lỗi của BE-C đang làm: `frontdesk.module.ts`, `document-party.port.ts`) |
| eslint, prettier (tệp BE-B chạm) | xanh |
| `node tests/tools/validate-fixtures.mjs` | 0 lỗi, 1 cảnh báo cũ |

**`br-examples.json`**: bỏ `pendingFix` của 11 dòng: BR-315-06, BR-412-15/16/17, BR-433-03, BR-434-07/08/09/10/11/12. **`known-bugs.ts`**: xóa `BUG-R2-055`, `056`, `059`, `060`, `061`, `104`, `S4-23` khỏi `OPEN` (giữ `B-6` tới khi gộp bản vá #6).

## 5. Giả định (đã ghi decision-log)

- (a) [GIẢ ĐỊNH BE-B – ARC] `ApprovalRequest.folioLineId` = dòng FOC hiện tại (âm), không phải "dòng gốc" như mô tả 0.3.7; dòng gốc = `relatedLineId` của nó. Ca E2E của QA và Desk đang đọc theo nghĩa này → đề nghị ARC sửa mô tả.
- (b) [GIẢ ĐỊNH BE-B – ARC] `lineChangedNote.cause` mặc định theo loại khóa khi bên gọi không truyền (`late/early` → `checkout_time_change`, `extra_person` → `party_change`, còn lại `move`); enum chưa có nguyên nhân cho `adjustFolioLine`.
- (c) [GIẢ ĐỊNH BE-B – DOM] S4-06: một yêu cầu hoàn = dư thừa sau phí và đảo dịch vụ; yêu cầu đã mở **không đổi số** (SM-10), chỉ xin phần còn thiếu; mục chú ý tự đóng khi chi đủ – chưa có thao tác "khách để lại" cho đơn đã đóng.
- (d) [GIẢ ĐỊNH BE-B – DOM] FOC trên dịch vụ bị đảo khi hủy → hủy theo quy tắc; dịch vụ giữ (`retainLines`) giữ FOC; FOC trên dòng bị đảo không bản thay (đếm lại minibar) → ngủ, chốt folio → hủy.
- (e) Danh sách "dịch vụ" S4-08 theo giả định ARC (b): `early_checkin`, `late_checkout`, `minibar`, `fnb`, `laundry`, `cleaning`, `service_fee`, `utilities`; `performed` chỉ theo ngày dịch vụ (chưa có cờ "đã dùng").

## 6. Rủi ro / vướng mắc

1. **Cây chung không khởi động được app trong test** (17/10 ~19:50): `HousekeepingModule` (BE-C, mới nối vào `feature-modules.ts`) làm `startFeatureApp` treo → mọi test tích hợp dùng app hết giờ (60 s). Đã cô lập: bỏ riêng module này trong bản sao thì chạy được. Kết quả mục 4 chạy trên **bản sao cây chung trừ dòng nối `HousekeepingModule`**. → ORC báo BE-C.
2. **Thư mục scratchpad dùng chung giữa các agent**: `env.sh` của tôi bị BE-A ghi đè (cùng tên) → khoảng 19:45–19:50 có **3 lượt vitest của BE-B chạy nhầm vào DB `ottimo_e2e_bea_s4` của BE-A**: `globalSetup` áp migration còn thiếu (gồm `0060` – chỉ thêm cột/GRANT) và `beforeAll` tạo vài tổ chức thử (tenant riêng, không đụng dữ liệu DS-E). Không xóa gì. Từ đó BE-B chỉ dùng `scratchpad/beb-s4/` (script chặn tên DB khác `ottimo_test_beb*`/`ottimo_e2e_beb*`). → ORC báo BE-A; đề nghị mỗi luồng một thư mục con.
3. rbac 5.1 dòng "Giảm giá đặc biệt tiền phòng … MGR/OWN theo hạn mức" lệch A36/BR-433 sau khi sửa BUG-R2-104 → BA sửa câu.
4. `stay-support.ts`, `reservations.service.ts` (`cancel`, `cancellationQuote`, `markNoShow`, trần `otaPenaltyVnd`), `money-bridge.ts`, `folio-sync-port.ts` là tệp của BE-A – BE-B chạm đúng các chỗ ghi ở mục 7, **BE-A review**. BE-A đang sửa cùng tệp; các đoạn của BE-B có chú thích "S4-0x (BE-B)".
5. Hoa hồng/phí kênh sau `adjustFolioLine` dòng đêm chỉ phân bổ lại ở lần đồng bộ đêm kế tiếp (B18 có gọi `resyncStay`) – folio không đọc được `ConfirmedStay` (ranh giới module).

## 7. Tệp tạo / sửa

Tạo:
- `product/services/api/src/db/migrations/0060_foc_key_date.sql`
- `product/services/api/src/modules/folio/public/reductions.ts`
- `product/services/api/src/modules/payments/public/deposit-notices.ts`
- `product/services/api/test/integration/foc-keys-s4.test.ts`
- `product/services/api/test/be-b-s4-units.test.ts`
- `rounds/round-02/outputs/BE/s4-be-b-b6-expected-version.patch`
- `rounds/round-02/outputs/BE/s4-be-b.md`

Sửa – module BE-B: `src/db/migrations/meta/_journal.json` (+0060), `src/db/schema/approvals.ts`, `src/modules/approvals/public/approval.service.ts`, `src/modules/approvals/internal/approvals.controller.ts`, `src/modules/approvals/internal/limits.ts`, `src/modules/folio/public/folio.service.ts`, `src/modules/folio/folio.module.ts`, `src/modules/folio/internal/foc.service.ts`, `src/modules/folio/internal/folio-lines.service.ts`, `src/modules/payments/internal/refunds.service.ts`, `src/modules/payments/payments.module.ts`, `src/modules/reservations/public/stay-night-allocation.ts` (tệp BE-B đặt ở `reservations/public`).

Sửa – **module khác (ghi rõ, BE-A review)**: `src/modules/frontdesk/internal/stay-support.ts` (`replaceLateCharge`), `src/modules/reservations/internal/reservations.service.ts` (`retainLinesOf`, `cancel`, `markNoShow`, trần `otaPenaltyVnd`), `src/modules/reservations/internal/money-bridge.ts` (`closeStayPreview`, `closeStayCredit`), `src/modules/reservations/public/folio-sync-port.ts` (`VoidStayInput.services`).

Sửa – test/fixture: `test/integration/payments-s3.test.ts` (ca S4-06 theo quy tắc mới; ca S4-35 B thay ca tạm ARC-BE-S3-14), `test/integration/approvals-refund-payout.test.ts` (ca S4-06), `product/tests/fixtures/br-examples.json` (bỏ 11 `pendingFix`), `product/tests/e2e/support/known-bugs.ts` (xóa 7 mã), `01-decisions/decision-log.md` (4 dòng BE-B).

## 8. Việc chưa xong

- Gộp #6 cùng FE-A (bản vá sẵn sàng). BE-A thêm `provideDepositNotices` vào `ReservationHooks` (bộ đọc đã đăng ký có điều kiện) và dùng `previewStayReductions` trong `MovePreview` (`focVnd`, `pendingFocVnd`, `folioDeltaVnd`).
- NÊN: S4-43 (x-scope `…refund_queue` phần (b)). (S4-42 và S4-23 phần lọc `service_date` null đã làm ở đợt 2 – mục 9.)
- QA đóng 055…061, 104 (kiểm lại trên stack QA) và chạy S4-38 với phạm vi tiền mới (S4-06, S4-08, S4-35 B, S4-37).

## 9. Đợt 2 (ORC giao sau mốc D3, 17/10 ~20:15–21:00)

| Việc | Trạng thái | Nội dung | Kiểm chứng |
|---|---|---|---|
| **S4-25 phần BE** | **Bản vá** `outputs/BE/s4-be-b-s4-25.patch` (chưa vào cây chung – gộp sau khi QA đóng 056/059/061) | API đã đủ cho Desk: H15 và H16 bước 2 dùng `setLateCheckout.requestFocForSurcharge`; dòng phát sinh dùng `requestFoc`; lễ tân tự áp FOC minibar dùng `requestFoc` + `authMethod/secret` (BR-436); thêm người kèm đề nghị FOC (BUG-R2-093) = `addPartyMember` có phụ thu, rồi `requestFoc` **mỗi đêm một yêu cầu** (khóa theo ngày). Bản vá thêm: `FolioService.reductionHeadroomVnd` (trần số xin theo khóa, S4-23 (6)), dùng ở `FolioFocService.request` và `StaySupport.requestFoc` (trước đây `requestFocForSurcharge` chỉ so với cả dòng, nên xin được vượt phần FOC đã áp). Thêm 4 ca test `test/integration/foc-s4-25.test.ts` | Bản sao cây chung có áp bản vá: 4/4 ca mới + 134/134 bộ liên quan; `git apply --check` sạch trên cây hiện tại (cùng với bản vá #6) |
| Câu hỏi ARC (S4-25, không tự sửa `openapi.yaml`) | Chờ ARC | Có thêm `PartyMemberCreate.requestFocForSurcharge` (tùy chọn – server tạo một yêu cầu cho mỗi đêm có phụ thu) không? Hiện Desk phải gọi `requestFoc` N lần cho N đêm, mỗi đêm một lượt duyệt. Đề xuất BE-B: **giữ như hiện tại ở Sprint 4** (không đổi hợp đồng sau đóng băng), cân nhắc ở R3 | – |
| **S4-23 phần lọc `service_date` null** | Xong (cây chung) | `focDateMap` bỏ ngày rỗng trước khi ghép (ngày rỗng xếp đầu từng đẩy lệch mọi đêm bỏ – s3-round8 code-2) | Ca unit mới trong `be-b-s4-units.test.ts` |
| **S4-42** | Xong (cây chung) | `refund_ready` khi duyệt hoàn: người tạo yêu cầu + mọi FD/FDL đang hoạt động khi nơi nhận là tiền mặt hoặc chưa chọn; chuyển khoản chỉ người tạo. [GIẢ ĐỊNH BE-B] Chưa có bảng ca nên "trong ca" = mọi FD/FDL đang hoạt động | Ca mới trong `approvals-refund-payout.test.ts` (4/4) |
| **Gợi ý S4-38** | Xong | `outputs/BE/s4-be-b-s4-38-hints.md`: 11 đường tiền BE-B đã chạm + ca biên theo nhóm (đua, nhiều khoản trên một khóa, `otaPenaltyVnd`, hủy/no-show có dịch vụ, sửa giá đêm, hạn mức tháng) + giới hạn đã biết. Có một nghi vấn BE-B tự nêu: A7 – `postLines` không gọi đồng bộ FOC | – |
| Bản vá #6 | Sinh lại | Ca S4-42 mới làm bản cũ không còn áp được, nên đã sinh lại trên cây hiện tại (6 tệp; có `ver()` cho ca S4-42 qua helper `approve`) | Bản sao có áp: 141/141 (`approvals-refund-payout`, `payments-s3`, `frontdesk`, `approvals-audit`) |

Môi trường: cây chung chạy lại được (BE-D đã gỡ vòng phụ thuộc). Các lượt kiểm ở đợt 2 chạy trên cây chung với DB `ottimo_test_beb_s4`. Riêng hai bản vá kiểm trên bản sao git trong `scratchpad/beb-s4/` (`s425/`, `b6/`).

Tệp đợt 2:
- Tạo: `rounds/round-02/outputs/BE/s4-be-b-s4-25.patch`, `rounds/round-02/outputs/BE/s4-be-b-s4-38-hints.md`.
- Sinh lại: `rounds/round-02/outputs/BE/s4-be-b-b6-expected-version.patch`.
- Sửa trên cây chung: `product/services/api/src/modules/folio/public/reductions.ts`, `product/services/api/src/modules/payments/internal/refunds.service.ts`, `product/services/api/test/be-b-s4-units.test.ts`, `product/services/api/test/integration/approvals-refund-payout.test.ts`, `01-decisions/decision-log.md` (1 dòng).

## 10. Đợt 3 (ORC giao 17/10 ~20:35–21:45): S4-10, V-09, DOM-S4-12…15

| Việc | Trạng thái | Nội dung | Kiểm chứng |
|---|---|---|---|
| **S4-10** (phần còn lại BUG-R2-038) | **Xong (cây chung)** | Nguyên nhân 422: enum zod `purpose` ở `payments.controller.ts` thiếu `check_in`/`check_out`, schema thiếu các ô giờ. Nay: nhận `checkinTime`/`addPriorNight`/`priorNightRateVnd` (chỉ `check_in`) và `checkoutAt`/`extraNightRateVnd` (chỉ `check_out`), sai purpose → 422 `NOT_ALLOWED` (giá đêm trước khi không `addPriorNight` cũng `NOT_ALLOWED`); SAL/CTV → 403; đơn sai trạng thái → 409 `INVALID_TRANSITION` (kiểm sớm ở payments); trần = `ReservationSalesPort.amountDueFor` của BE-A (cùng phép tính `previewCheckIn.amountDueAtCheckinVnd` / `getCheckoutSummary.amountDueAtCheckoutVnd`, port tự kiểm ngày nghiệp vụ, cửa sổ B9a/sau nửa đêm, khoảng giá). Không ghi dòng folio nào; kiểu giao dịch `charge` | `test/integration/vietqr-stay-step.test.ts` (mới, 3 ca, oracle BR-402-01): 1.710.000 tạo được (> số còn phải thu 1.500.000), +1 → 422 `max`, xác nhận đã nhận → cần thu 0 → B9 không kèm `payment`; ca chéo trường/403/409; ca `check_out` theo `amountDueAtCheckoutVnd`. E2E TC-L3-079 (E)(b) trên stack riêng `ottimo-beb-s4` (ảnh qa-s4, dist từ cây chung): **đạt** khi chạy trên stack sạch (xem ghi chú E2E dưới) |
| `known-bugs` | Đã xóa `S4-10` khỏi `OPEN` | – | – |
| **V-09** (BE-A review) | Xong (cây chung, tệp BE-A) | `retainLinesOf` chặn số thẻ trong `retainLines[i].reason` → 422 `CARD_NUMBER_DETECTED` (kiểm **trước** độ dài, như BUG-R2-043), cùng bộ lọc `containsCardNumber` | Ca mới trong `foc-keys-s4.test.ts` (S4-08) |
| **DOM-S4-12** (BR-309-09) | Xong | Gợi ý `performed`: hủy → ngày dịch vụ **<** ngày nghiệp vụ; no-show → **≤** (nhận biết bằng `feeCategory = no_show_fee`, không đổi chữ ký hàm) | `close-stay-dom-s4.test.ts` |
| **DOM-S4-13** (BR-429-17) | Xong | `voidStay` đảo `room_change_difference` của đêm bị hủy/no-show cùng giao dịch (lý do đảo riêng); tính thử `closeStayPreview` bỏ cả dòng chênh lệch. **Thêm để không gây hồi quy**: B12 khôi phục no-show ghi lại dòng chênh lệch đã đảo vì no-show cho các đêm bán lại (đi theo đêm cả hai chiều) | Oracle: đảo 500.000, còn phải thu 0; ca no-show → B12 đủ lại dòng chênh lệch |
| **DOM-S4-14** (BR-522-05, phần BE-B) | Xong | Hàm thuần `refundPlan` (`folio/public/refund-plan.ts`) dùng chung cho tính thử và ghi: tổng yêu cầu đang mở < dư thừa → yêu cầu bổ sung; > dư thừa → mọi yêu cầu **chờ duyệt** tự hủy (`autoCancel`: báo người tạo và người được hỏi) rồi tạo lại đúng số = dư thừa − phần yêu cầu đã duyệt còn nợ. Lý do tự hủy: `superseded` khi có yêu cầu mới thay, nếu không thì `reservation_cancelled` / `reservation_no_show`. Yêu cầu đã duyệt không hủy (chi vẫn ≤ dư thừa hiện tại – đã có) | Oracle 3 ca (a) +350.000, (b) không thêm, (c) yêu cầu 700.000 tự hủy + có thông báo; unit `refundPlan` |
| **DOM-S4-15** (BR-434-13) | Xong | Dịch vụ lễ tân **giữ**: hủy đơn → FOC trên dòng giữ `cancelled` (`reservation_cancelled`), khách chịu đủ dòng; no-show → FOC `suspended` (dòng FOC đảo, ra khỏi hạn mức), B12 áp lại (`foc_restored` từ `suspended`); folio chốt khi còn tạm dừng → hủy. Dòng không phải dịch vụ (phạt, hư hại, điều chỉnh) giữ FOC như cũ. Tính thử: dòng giữ hiện số khách chịu (không trừ FOC) | Oracle 3 ca (300.000 / 0 / 300.000; `cancelled` / `cancelled` / `suspended`) + B12 về `applied` |
| `br-examples.json` | Bỏ `pendingFix` 4 dòng | BR-309-09, BR-429-17, BR-434-13, BR-522-05 (BR-309-10 BE-A đã bỏ) | `node tests/tools/validate-fixtures.mjs`: 0 lỗi |
| Review test BE-A sửa trong vùng BE-B | Đồng ý | `foc-keys-s4` (`moveDates`/`shown`, ca đua S4-13 nhận 409 rồi xem lại và lưu lại), `foc-resync` (`shown`), `folio-payments` (DOM-BE-03), `payments-s3` (3 ca phí theo DOM-S4-14): đúng quy tắc mới, không che lỗi. Góp ý nhỏ: ca đua S4-13 chỉ thử lại khi mã là `SURCHARGE_CHANGED` – nếu BE-A đổi mã thì ca sẽ đỏ (đúng ý, không cần sửa) | Toàn bộ xanh |

**Kiểm chứng đợt 3** (17/10 ~21:45, DB mới `ottimo_test_beb_s4r`): toàn bộ `@ottimo/api` **2.642/2.642 xanh, 78/78 tệp**; `tsc --noEmit` 0 lỗi; eslint + prettier xanh trên mọi tệp chạm.

**Ghi chú E2E TC-L3-079 (E)(b)** (stack riêng `ottimo-beb-s4`: Postgres/API/web riêng cổng 47xxx, ảnh `ottimo-api:qa-s4` + dist biên dịch từ cây chung, web `aw-dist` của QA chỉ đọc; không đụng stack demo/QA):
- Chạy riêng trên stack sạch: **đạt** 2 lần (lần cuối đã xóa `S4-10` khỏi `OPEN`, không dùng `E2E_FIXED_BUGS`, dist có cả thay đổi DOM-S4-12…15): QR `check_in` 201 đúng 1.710.000 kèm `checkinTime`, xác nhận 200, cần thu về 0, B9 không kèm `payment`, số dư 0. Cùng lượt: TC-L2-102 (E)(b) (H11 no-show giữ dòng, S4-08) đạt.
- `api/money-s4.api.spec.ts` trên cùng stack: 27 đạt, 7 đỏ – **cả 7** đỏ ở bước dời căn/ngày với 422 `applyDifference REQUIRED` (quy tắc DOM-S4-06 của BE-A; ca QA chưa gửi tick + số đã hiện, chưa gắn `knownBug('DOM-S4-06')`). Không ca nào đỏ ở phần tiền BE-B. Báo QA qua ORC.
- Chạy cả tệp `stay-money.s4.spec.ts` theo thứ tự: (b) và TC-L3-081 đỏ ở bước bấm "Nhận phòng" vì điều kiện `room_ready` không đạt (căn **201 đang OC**). Nguyên nhân phía test: ca (a) nhận khách vào 201 rồi để `in_house` (dọn dữ liệu chỉ hủy đơn `hold`/`confirmed`), các ca sau dùng lại căn 201 ở ngày ảo khác nên trạng thái buồng hiện tại vẫn OC. Phần API của S4-10 trong cùng lượt chạy vẫn đạt (QR 201, xác nhận 200, cần thu 0). **Báo QA qua ORC**: cho (b)/081 dùng căn khác hoặc trả phòng/đặt lại trạng thái 201 sau ca (a).

**Giả định / câu hỏi ARC đợt 3** (đã ghi decision-log):
- (f) [GIẢ ĐỊNH BE-B – ARC] S4-10: `priorNightRateVnd` không kèm `addPriorNight=true` → 422 `NOT_ALLOWED`; trạng thái sai kiểm ở payments trước khi khóa folio (409), ngày sai do port BE-A trả 409.
- (g) [GIẢ ĐỊNH BE-B – ARC] DOM-S4-15: folio chốt khi FOC còn `suspended` → `cancelled` với `focCancelReason = settled_while_dormant` (enum 0.3.7 chưa có giá trị riêng). Đề nghị ARC ghi rõ hoặc thêm giá trị ở bản sau.
- (h) [ĐỀ NGHỊ ARC sửa mô tả, không đổi trường] `CancellationQuote.serviceLines[].performed`: no-show là "≤ ngày nghiệp vụ" (BR-309 v0.3.8); `amountVnd` của dòng **giữ** = số khách chịu sau khi đóng đơn (FOC trên dòng giữ không còn áp).
- (i) DOM-S4-13: B12 ghi lại dòng chênh lệch đổi căn đã đảo vì no-show (nhận biết bằng lý do đảo `night voided with its booking (BR-429 (c))`).

Tệp đợt 3:
- Tạo: `product/services/api/src/modules/folio/public/refund-plan.ts`, `product/services/api/test/integration/vietqr-stay-step.test.ts`, `product/services/api/test/integration/close-stay-dom-s4.test.ts`.
- Sửa – module BE-B: `src/modules/payments/internal/payments.controller.ts`, `src/modules/payments/internal/payments.service.ts`, `src/modules/folio/public/folio.service.ts`.
- Sửa – **module khác (ghi rõ)**: `src/modules/reservations/internal/reservations.service.ts` (`retainLinesOf` – V-09, tệp BE-A).
- Sửa – test/fixture: `test/integration/foc-keys-s4.test.ts` (ca V-09), `test/be-b-s4-units.test.ts` (unit `refundPlan`), `product/tests/fixtures/br-examples.json` (bỏ 4 `pendingFix`), `product/tests/e2e/support/known-bugs.ts` (xóa `S4-10`), `01-decisions/decision-log.md`.

## 11. Phản hồi & sửa sau S4-38 (ORC giao 17/10 ~22:50–23:20)

| Mục | Trạng thái | Cách sửa | Kiểm chứng |
|---|---|---|---|
| **S438-FOC-01** (P1) + **BUG-R2-095** (S4-50) | Xong | `inventory/internal/minibar.service.ts` `record()`: đếm lại **cùng số** của một món → giữ nguyên dòng (và FOC, và số lễ tân đã sửa), không đảo, không ghi lại. Đổi số → đảo dòng cũ (`skipReductionSync`) và ghi dòng mới **làm bản thay** (`related_line_id` = dòng cũ), FOC theo chuỗi thay thế = min(số đã duyệt, dòng mới). Món về 0 → đảo, FOC ngủ ngay (đồng bộ một lần cuối, `cause = manual_adjust`). Gốc chung "nghi vấn A7": `FolioService.postLines` nay tự `syncReductions` sau khi ghi dòng tính tiền `posted` trên folio `open`, có `opts.cause` | Ca mới: cùng số → không có bút toán đảo mới, FOC `applied`, B18 cần thu 35.000, sau B18 FOC vẫn `applied`, minibar ròng 35.000. FOC 70.000 / đếm lại 1 lon → bản thay 35.000, FOC 35.000, khách trả 0. Đếm lại 0 → `dormant`. Test skeptic A7-minibar-1/2 + contrast: đạt |
| **S438-FOC-03** (P1, BR-434-14) | Xong | `reductions.ts`: `room_change_difference` thuộc `DATED_KEY_CATEGORIES` (khóa theo đêm như phụ thu người, FOC tìm dòng theo ngày). No-show → `suspended` (pha `before` của `voidReductionKeys`), B12 ghi lại chênh lệch (`repostVoidedDifferences`) rồi `syncReductions` đưa FOC về `applied`. `foc.service.ts` ghi ngày khóa cho mọi khóa theo đêm. `defaultCause(room_change_difference) = room_change` | Oracle BR-434-14: `suspended` → B12 `applied` 250.000, còn thu 250.000 (không phải 500.000). Đã bỏ `pendingFix`. Test skeptic "BR-315 (g) difference": đạt |
| **S438-FOC-04** (P1) – phần khóa/allocate của BE-B | Xong; **đã gửi ORC tên hàm cho BE-A** | Lệnh ghi: FOC đi theo đêm, kèm `postLines` tự đồng bộ, nên lần đổi căn thứ hai cho FOC = min(250.000, 208.000) ngay cả khi BE-A chưa sửa. Xem trước: `FolioService.previewStayReductions(tx, folioId, reservationId, nights[{date, roomVnd, extraPersonVnd, differenceVnd?}], { differences?: boolean })`. Khi `differences = true`, `oldAppliedVnd`/`newAppliedVnd` gồm FOC trên chênh lệch. `NightReductionPreview` có thêm `differenceFocVnd`/`differencePendingVnd`; không truyền thì kết quả như cũ. **BE-A còn làm**: truyền chênh lệch mới vào move-planner để `folioDeltaVnd` đúng, và trong `repostDifferences` đảo với `skipReductionSync` để không qua trạng thái ngủ | Ca mới: xem trước old 250.000 → new 208.000; ghi FOC `applied`, chênh lệch ròng 208.000, còn thu 208.000. Test skeptic A7-difference: đạt |
| **S438-CANCEL-03** (P2) | Xong | `FolioService.reopenStayCredit` (gọi ở B12 qua `money-bridge.reopenStayCredit`): yêu cầu hoàn đang mở vượt dư thừa hiện tại → các yêu cầu chờ duyệt tự hủy (`superseded`, báo người tạo); còn dư thừa thì tạo lại đúng số (`overpayment`). Mục "Cần chú ý" `closed_reservation_credit` đóng | Ca X3: yêu cầu 300.000 → `cancelled`/`superseded`, có thông báo; mục chú ý đã đóng; còn thu = tổng − 800.000. Test skeptic X3, Y11: đạt |
| **S438-CANCEL-04** (P2/P3) | Xong | `closeStayCredit` trả thêm `created`. `cancel()` ghi `refundRequestVnd` = số của yêu cầu do **lần hủy này** tạo, khớp `refundPlan` của bản xem thử. `refundApprovalRequestId` vẫn trỏ yêu cầu đang mở | Ca X2 / BR-522-05 (b): xem thử = lưu = 0, id = yêu cầu mở. Test skeptic X2, Y6: đạt |

**Kiểm chứng** (17/10 ~23:20, DB mới `ottimo_test_beb_s4r`): toàn bộ `@ottimo/api` **2.671/2.671 xanh, 81/81 tệp**; tsc 0 lỗi; eslint + prettier xanh trên tệp chạm; `validate-fixtures` 0 lỗi. Test tái hiện của skeptic chạy trên **bản sao** cây chung (`scratchpad/beb-s4/wt4`, không chép vào cây chung):
- `foc-attack.test.ts`: 29 đạt. Đỏ duy nhất là **B18-extra-night (S438-FOC-02, `checkout.service extraNightDelta`)**, phần BE-A.
- `cancel/`: 22 đạt. 7 đỏ thuộc CANCEL-01/02/05 và Z4 (cơ sở phí theo cọc yêu cầu tính lại, đêm cao điểm, trần phí kênh OTA), phần BE-A.

**Giả định** (đã ghi decision-log):
- (j) [GIẢ ĐỊNH BE-B – ARC] Tự hủy yêu cầu hoàn ở B12 dùng `autoCancelReason = superseded`, vì enum chưa có "khôi phục no-show".
- (k) `postLines` tự đồng bộ FOC. Bên gọi tự đồng bộ thì vẫn đúng: thao tác không đổi kết quả nếu chạy lại.
- (l) Đếm lại minibar khi số không đổi giữ dòng cũ, kể cả khi lễ tân đã sửa giá dòng đó. Đổi số thì ghi lại theo giá danh mục như trước.
- (m) Một món đếm về 0 rồi đếm lại > 0 ghi dòng mới, không nối chuỗi, nên FOC cũ vẫn ngủ. Trường hợp hiếm; chốt folio thì hủy theo quy tắc.

Tệp đợt này:
- Tạo: `product/services/api/test/integration/s438-beb.test.ts` (6 ca).
- Sửa – BE-B: `src/modules/folio/public/reductions.ts`, `src/modules/folio/public/folio.service.ts`, `src/modules/folio/internal/foc.service.ts`, `src/modules/inventory/internal/minibar.service.ts`, `src/modules/approvals/public/approval.service.ts` (thêm `manual_adjust` vào `LineChange.cause`, đã có trong hợp đồng).
- Sửa – **module khác (ghi rõ)**: `src/modules/reservations/internal/money-bridge.ts` (`reopenStayCredit`, kiểu trả về `closeStayCredit`), `src/modules/reservations/internal/reservations.service.ts` (B12 gọi `reopenStayCredit`; `cancel` dùng `created`).
- Sửa – fixture: `product/tests/fixtures/br-examples.json` (bỏ `pendingFix` BR-434-14).

### 11.1 Migration 0063 – `autoCancelReason = no_show_restored` (0.3.7 bổ sung 4, `openapi-0.3.7.md` mục 15, erd 4.6)

- `0063_no_show_restored.sql` mở rộng CHECK `approval_request_auto_cancel_reason_check` thêm `no_show_restored`, vẫn chỉ hợp lệ khi `status = 'cancelled'`. Bản nháp sinh bằng drizzle-kit trong thư mục tạm (journal tới 0062 + `0062_snapshot.json`), rồi đổi tên thành `0063_snapshot.json` (đã chạy prettier; `prevId` = id của 0062). Journal: idx 40, `when` 1792254720821 > 0062. `drizzle-kit generate` ở thư mục thật báo "No schema changes".
- `schema/approvals.ts` cập nhật CHECK. Kiểu `AutoCancelReason` thêm `no_show_restored`. `FolioService.reopenStayCredit` (B12) nay ghi `no_show_restored` thay cho `superseded`, nên giả định (j) đã được ARC chốt.
- Test: ca CANCEL-03 trong `s438-beb.test.ts` kiểm DB lẫn API (`autoCancelReason = no_show_restored`), thêm một ca CHECK từ chối lý do này trên yêu cầu chưa hủy. `schema-parity`, `migrations-journal` xanh. Toàn bộ API **2.687/2.687, 82/82 tệp** (DB mới); tsc, eslint, prettier xanh.
- Tệp: tạo `src/db/migrations/0063_no_show_restored.sql`, `src/db/migrations/meta/0063_snapshot.json`; sửa `src/db/migrations/meta/_journal.json`, `src/db/schema/approvals.ts`, `src/modules/approvals/public/approval.service.ts`, `src/modules/folio/public/folio.service.ts`, `test/integration/s438-beb.test.ts`.
