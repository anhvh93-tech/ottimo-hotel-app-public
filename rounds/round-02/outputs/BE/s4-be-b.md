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
- ~~(m)~~ **Đã gỡ 18/10** – trái BR-434 v0.3.8 (DOM bổ sung 18/10, oracle BR-434-15): đếm lại > 0 thì FOC tự khôi phục. Xem mục 12 (BUG-R2-129).

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

## 12. Phản hồi & sửa vòng 2 (sau `s4-money-reverification.md`, 18/10)

| Mã | Trạng thái | Cách sửa | Kiểm chứng |
|---|---|---|---|
| **BUG-R2-129** (P1, R2FOC-02) | Xong | **Cách chọn: nối chuỗi**, không đổi khóa. `minibar.service.ts` `record()` tìm **dòng cuối của chuỗi từng món** trong lượt ở, qua mọi lần đếm và mọi lần lễ tân chỉnh, dù dòng đó còn sống hay đã đảo (đếm 0, void bằng adjustments). Dòng sống, cùng số → giữ nguyên. Dòng sống, khác số → đảo rồi ghi dòng mới nối vào. Dòng đã đảo, đếm lại > 0 → ghi dòng mới với `related_line_id` = dòng cuối đó. Khóa FOC kiểu "dòng" vốn đi theo chuỗi thay thế (`LineIndex.keyLine`), nên FOC tự khôi phục = min(số đã duyệt, dòng mới). Không duyệt lại, không trừ hạn mức BR-433 lần hai. Chốt folio khi món vẫn không có dòng → hủy `settled_while_dormant` như cũ. **Lý do chọn nối chuỗi (đề nghị ARC xác nhận)**: không đổi hợp đồng, không cần migration (dòng folio không mang mã món); cùng cơ chế với `adjustFolioLine` mà QA đã kiểm (ca contrast); hiệu quả tương đương khóa lượt × minibar × món vì mỗi chuỗi chỉ thuộc một món của một lượt | Oracle **BR-434-15** (bỏ `pendingFix`): 202, 2 → 0 → 2: FOC 35.000, ròng 35.000, folio **827.000**; 2 → 0 → 1: ròng 0; hạn mức FDL không đổi khi khôi phục. Thêm: void dòng rồi đếm 2 → FOC 35.000; 101, 2 → 1 → 2 → 0 → 1 → tổng 667.000, còn thu 0. Skeptic `w-r2foc-1-0` A, B, C và `w-r2foc-1-1` K0–K4: đạt |
| **BUG-R2-130** (P1, R2REGR-03) | Xong (không cần BE-D sửa) | Món đã đếm nhưng nay rời danh mục chuẩn (`is_active = false` hoặc `minibar_standard_qty = 0`) **giữ dòng** khách đã dùng, và dòng đếm của món đó được **chép sang** lần đếm mới (số lượng, giá chụp, `folio_line_id`). Trước đây vòng `gone` đảo dòng. Lần đếm vẫn phải đủ món của danh mục chuẩn **hiện hành** | 402: bia 2 (70.000), tắt bia, đếm lại → giữ 70.000, dòng bia có trong lần đếm mới; thêm 1 snack → 100.000; B18: cần thu 100.000, tổng = tiền phòng + 100.000. Coca đặt định mức 0 → giữ 25.000. Skeptic `r2regr/minibar-gone` M1: đạt |

Ghi chú test skeptic (chạy trên bản sao `wt4`):
- `w-r2foc-1-0` D ("lễ tân tự áp FOC lần hai sau 2 → 0 → 2") nay ra 750.000 / còn thu 0, khác số 785.000 / 35.000 của test. Lý do: FOC đầu đã tự khôi phục, FOC thứ hai là một khoản mới trên cùng món, còn chỗ vì min(70.000 − 35.000). Kỳ vọng của ca này dựa trên hành vi cũ (FOC đầu ngủ), không phải hồi quy. QA cần đổi kỳ vọng.
- `r2foc-attack` M8/M8b đỏ: thuộc R2FOC-03, đã được xếp Note (DOM/UXD/FE-A), không phải việc BE-B.

Kiểm chứng (18/10, DB mới `ottimo_test_beb_s4r`): toàn bộ `@ottimo/api` **2.694/2.694 xanh, 82/82 tệp**; tsc 0 lỗi; eslint và prettier xanh trên tệp chạm; `validate-fixtures` 0 lỗi. Tệp: sửa `src/modules/inventory/internal/minibar.service.ts`, `test/integration/s438-beb.test.ts` (thêm 5 ca: oracle BR-434-15, void rồi đếm lại, chuỗi 2 → 1 → 2 → 0 → 1, món rời danh mục, món định mức 0), `product/tests/fixtures/br-examples.json` (bỏ `pendingFix` BR-434-15), `01-decisions/decision-log.md` (gỡ (m), thêm 1 dòng).

## 13. Phản hồi & sửa vòng 3 – mô hình minibar M-1 (ARC `openapi-0.3.7.md` mục 16) + DOM (f) QR, 18/10

Thay cách "nối chuỗi" của mục 12 (đã để lọt BUG-R2-135) bằng mô hình M-1 do ARC duyệt. Mục 12 (BUG-R2-129 nối chuỗi) nay **bị thay** bởi khóa theo mã món.

| Phần | Cách làm (theo R1–R10) | Kiểm chứng |
|---|---|---|
| **Migration 0065** `0065_minibar_fill.sql` | Bảng `minibar_fill` + `minibar_fill_line`: RLS theo cơ sở, chỉ SELECT/INSERT. UK `minibar_check_live_checkout_key` đổi sang (`reservation_id`, `room_id`). Bù `folio_line.charge_code` = `item.code` cho dòng minibar (cả dòng thay và dòng đảo). Bù lần nạp `backfill` cho tủ của đơn `in_house` đã có lần đếm (mốc/giá theo lần đếm, `filled_at` ngay trước lần đếm đầu). `payment.qr_purpose` (CHECK chỉ `vietqr`) + `qr_context`. Snapshot sinh qua thư mục tạm (`prevId` = 0064), journal idx 42 | `drizzle-kit generate` ở thư mục thật: "No schema changes"; `schema-parity`, `migrations-journal`, `rls` xanh. Phần bù chạy thử trên DB có dữ liệu (BEGIN … ROLLBACK): 79/85 dòng minibar được gắn mã, 6 dòng lễ tân tự ghi không qua đếm để trống; 17 lần nạp `backfill` |
| **Tủ = (lượt, căn)** (R1, R9) | `inventory/internal/fridge.ts` (mới). Lượt = đơn chính của folio. Phòng của lượt = phòng trong segment, cộng mọi tủ đã có lần nạp/lần đếm. Lý do: B14 ngay đêm đầu ghi đè segment tại chỗ, nên tủ căn cũ chỉ còn biết qua lần nạp/đếm. `roomId` của căn khác → 422 `NOT_IN_LIST`. `onCheckedOut` (B14 và B18 gọi) **ghi nhận tủ** (lần nạp `check_in` nếu chưa có), nên tủ căn cũ không mất. Đếm tủ căn cũ sau B14 → sinh việc bổ sung ngay | Ca 3 / BR-703-01 (a, b, c) + `NOT_IN_LIST` |
| **Lần nạp chụp khi danh mục đổi** (R2, D1) | `items.service` `create`/`update`: trước khi ghi, mọi tủ của lượt `in_house` chưa có lần nạp nhận một lần nạp `check_in` = danh mục trước khi sửa, cùng giao dịch. Ngày nạp không sau lần đếm đầu của tủ. [GIẢ ĐỊNH BE-B – ARC] Danh mục chưa có món minibar nào thì không chụp, để tủ không bị trống suốt lượt khi đang khai báo danh mục lúc có khách ở | Ca 5, 11; test BE-D chỉnh theo R2/R3/R5 (xem dưới) |
| **`record()` viết lại** (R3–R7) | Món, mốc, giá lấy từ lần nạp gần nhất (chưa có thì lấy danh mục hiện hành). Món ngoài tủ → `NOT_IN_LIST`; món đã tắt hoặc đổi miễn phí sau lần nạp vẫn đếm được. **Giữ dòng** khi số dùng = lần đếm trước của tủ (cùng kỳ nạp) **hoặc** = số trên dòng folio sống; nếu dòng đã bị void thì giữ "không dòng". Khác cả hai thì đảo dòng sống rồi ghi **một** dòng = dùng × giá lần nạp, `chargeCode = item.code`. Lần đếm mới chép giá, số tiền và `folio_line_id` theo dòng được giữ. `latestCheck`/lần đếm hiện số tiền **dòng folio sống** (R10). Tủ căn cũ: `latestCheck` là lần đếm sống bất kể ngày | Ca 4, 5, 6, 8, 9, 10; BR-702-02/03/04 |
| **Khóa FOC theo món** (R8, D2) | `reductions.ts`: `keyOf` cho minibar có mã → `item:minibar:<code>`. `LineIndex.keyLine` lấy giá trị = Σ dòng minibar sống cùng mã (mọi tủ, mọi kỳ); dòng FOC gắn vào dòng sống đầu tiên. `reductionRequests` đọc `charge_code` của dòng gốc. `reductionHeadroomVnd` tính theo cả món. `adjustFolioLine` vốn đã chép `charge_code`; dòng minibar có mã món vẫn sửa giá được (miễn `PRICE_NOT_EDITABLE`) | Ca 1, ca 2 / BR-434-16 (zeroPath 750.000, recount 792.000, adjustments 792.000; A applied, B dormant; B18 thu 0; B `cancelled` `settled_while_dormant`) |
| **`checkoutStatus`/`uncheckedRooms`** (R9) | Theo từng tủ (món tính tiền theo lần nạp). `uncheckedRooms` cho `CheckoutSummary.minibarUncheckedRooms` (BE-A đã dùng). Loại việc bổ sung tủ căn cũ: `hk_task.type = minibar_refill`, `source = system` | Ca 3: B18 chặn tới khi đếm tủ căn mới |
| **`getMinibarStandard`** | `items` theo lần nạp (`standardQty` = mốc, `unitPriceVnd` = giá lần nạp) + `lastCheckUsedQty`, `folioLineId`, `folioUsedQty`, `folioAmountVnd`, `adjustedAfterLastCheck` (4 trường folio chỉ tính cho FD+). Tham số `roomId` | Ca 5 (tranh chấp DOM (e)), ca 9 (void) |
| **QR – DOM (f)** (D7) | `createVietQr` lưu `qr_purpose` + `qr_context` (`checkinTime`, `addPriorNight`, `priorNightRateVnd`, `checkoutAt`, `extraNightRateVnd`, `lateFeeAsNight`); nhận `lateFeeAsNight` (chỉ `check_out`, khác → 422 `NOT_ALLOWED`). `confirmPaymentReceived`: tính "còn phải thu lúc xác nhận" theo đúng mục đích. `check_in`/`check_out` qua `ReservationSalesPort.amountDueNowFor` của BE-A; `deposit` = cọc còn thiếu; `balance` = số dư folio. Vượt mà thiếu `note` (≥ 3) → 422 `REASON_REQUIRED` (`field` = `note`, `max` = số còn phải thu); audit ghi `overVnd`. `Payment.qrPurpose` + `amountDueNowVnd` (chỉ VietQR `pending`) trong `getFolio.payments[]`, `listPayments` và các phản hồi payment | Ca DOM (f): QR 300.000 khi còn thu 200.000 |

**Test đã sửa kỳ vọng theo M-1** (tệp của vai khác, ghi rõ):
- `minibar-catalog-s4-bed.test.ts` (BE-D):
  - khách vào ở **sau** khi có danh mục (R2);
  - khách đang ở khi đổi giá giữ giá lần nạp: 50.000 thay vì 60.000. Khách vào sau khi đổi giá trả 60.000 (R5);
  - món tắt vẫn trong tủ đã nạp; khách vào sau thì không có món đó (R3).
- Tệp của tôi: `s438-beb.test.ts` (bỏ kỳ vọng nối chuỗi; ca void theo ca 9; ca món tắt và định mức 0 sửa qua `updateItem`). `minibar-m1.test.ts` (mới, 9 ca).

**E2E** – ma trận QA `e2e/clock/minibar-matrix.s4.clock.spec.ts` chạy trên stack riêng `ottimo-beb-s4` (dựng từ cây chung, có 0065), **không đụng `ottimo-qa-s4`**, đã gỡ (`down -v`):
- Chạy cả tệp trên stack sạch, không còn mã nào trong `OPEN`: **17/20 đạt** (TC-L4-101…117).
- TC-L4-118, 119, 122 đỏ ở bước dựng: `changeRoom` trả 409 `ROOM_NOT_READY` vì căn đích đang `VD`, do các ca trước trong cùng lượt đã trả phòng. Đặt lại các căn về sạch rồi chạy riêng từng ca: **cả 3 đạt**.
- **Báo QA qua ORC**: ba ca B14 cần dọn căn đích trong `precondition`.
- Đã xóa BUG-R2-135, 136, 137, 138, 140 khỏi `OPEN` (`known-bugs.ts`). BUG-R2-140 còn phần hiển thị của FE-A; QA tự gắn lại mã riêng nếu ca UI cần.

**Kiểm chứng** (18/10, DB mới): toàn bộ `@ottimo/api` **2.731/2.731 xanh, 85/85 tệp**; tsc 0 lỗi; eslint và prettier xanh (cả 6 tệp ORC nhắc); `validate-fixtures` 0 lỗi. Oracle bỏ `pendingFix`: BR-434-16, BR-702-02, BR-702-03, BR-702-04, BR-703-01.

**Giả định / điểm ARC xác nhận:**
- (n) Danh mục trống thì không chụp lần nạp.
- (o) Phòng của lượt gồm cả tủ đã có lần nạp/lần đếm, vì B14 đêm đầu ghi đè segment tại chỗ; B14/B18 ghi nhận tủ qua `onCheckedOut`.
- (p) `latestCheck` của tủ căn cũ là lần đếm sống bất kể ngày; tủ đang ở vẫn theo ngày nghiệp vụ.
- (q) Dòng minibar mang mã món vẫn sửa được giá.
- (r) Đọc `reservation_segment` (module reservations) ở chế độ chỉ đọc trong `inventory/internal/fridge.ts`; nhờ BE-A review.

Tệp đợt này:
- Tạo:
  - `src/db/migrations/0065_minibar_fill.sql`, `src/db/migrations/meta/0065_snapshot.json`
  - `src/modules/inventory/internal/fridge.ts`
  - `test/integration/minibar-m1.test.ts`
- Sửa – BE-B:
  - `src/db/migrations/meta/_journal.json`, `src/db/schema/inventory.ts`, `src/db/schema/folio.ts`
  - `src/modules/inventory/internal/{minibar.service,minibar.controller,items.service}.ts`, `src/modules/inventory/public/minibar-checkout.port.ts`
  - `src/modules/folio/public/{folio.service,reductions,folio-view}.ts`, `src/modules/folio/internal/{folio.controller,folio-lines.service}.ts`
  - `src/modules/payments/internal/{payments.service,payments.controller}.ts`, `src/modules/payments/payments.module.ts`
  - `test/integration/s438-beb.test.ts`
- Sửa – module khác (ghi rõ):
  - `src/modules/inventory/internal/items.service.ts` (BE-D: chụp lần nạp);
  - `test/integration/minibar-catalog-s4-bed.test.ts` (BE-D);
  - `product/tests/e2e/support/known-bugs.ts` (QA: xóa 5 mã);
  - `product/tests/fixtures/br-examples.json` (bỏ 5 `pendingFix`).

ARC 18/10 đồng ý (n), (p), (q); (o) có điều kiện: B14 phải ghi nhận tủ căn cũ trong mọi trường hợp. Mã đã đáp ứng: `onCheckedOut` (B14 gọi) luôn chụp lần nạp cho tủ chưa có, kể cả tủ chưa đếm và danh mục chưa đổi (`registerFridge`); chỉ bỏ qua khi danh mục trống, khi đó không có món tính tiền nên không có gì để chặn. Thêm ca `minibar-m1.test.ts`: B14 đêm đầu (segment bị ghi đè sang 203), tủ 202 chưa đếm → `minibarUncheckedRooms` = [202], B18 409; đếm tủ 202 (`roomId`) → B18 200, thu 35.000, có việc bổ sung tủ 202. Toàn bộ API **2.732/2.732, 85/85 tệp**; tsc, eslint, prettier xanh.

## 14. Phản hồi & sửa vòng 4 (`reviews/s4-money-recheck4.md`; ARC 16.2 R1/R6/R7/R9, 16.13, ca 12–19), 18/10

| Mã | Cách sửa | Kiểm chứng |
|---|---|---|
| **BUG-R2-147** (P2, lối ra (a)) | `folio/public/minibar-foc-resync.ts` `resyncMinibarFocOnce`: chạy `syncReductions` cho mọi folio `open` có yêu cầu FOC/giảm giá trên dòng minibar, **một lần mỗi cơ sở**. Cờ "đã chạy" là một dòng `job_run` (`data_fix.minibar_foc_0065`, slot cố định), ghi cùng giao dịch: lỗi thì rút cả hai, lần khởi động sau chạy lại. Chạy ở `FolioModule.onApplicationBootstrap` (API và worker); không chạy trong test trừ khi `RUN_DATA_FIXES=1`; không bao giờ chặn khởi động | Ca mô phỏng dữ liệu trước 0065 (102): hai FOC sống trên một bia đã về 1 lon → folio **715.000**; chạy bước → **750.000**, A `applied`, B `dormant`, ròng 0; chạy lần hai → `null`; B18 thu 0 |
| **BUG-R2-152** (P2) | `minibar.service.ts` `stay()`: HK được ghi lần đếm `checkout` của **tủ căn cũ** (`roomId` khác căn đang gán) khi có việc buồng phòng chưa hủy ở căn đó, hạn hôm nay (việc `checkout_clean` mà B14 tạo). Tủ căn đang ở vẫn theo phạm vi cũ (ngày đi) | 302 → 401 lúc 10:00; 11:00 HK đếm 302 dùng 2 → **201**, dòng 70.000, phản hồi không có tiền, 1 việc `minibar_refill` số lượng 2; HK đếm tủ đang ở (không phải ngày đi) → 404 |
| **BUG-R2-148** (phần BE-B) | `nightRateBasis`: dòng `charge_code = 'late_fee_as_night'` lấy chính số tiền dòng làm cơ sở hạn mức BR-433 | 911.000 → basis 911.000; MGR xin FOC 911.000 → 201 `approved`. Oracle BR-416-07 **giữ `pendingFix`**: phần BE-A (B18 `lateFeeInsteadOfNight`, BUG-R2-153 người duyệt = người xác nhận) chưa xong |
| **BUG-R2-144** (P1) – kỳ nạp | **Migration 0066** `0066_minibar_period.sql`:<br>- `minibar_check.fill_id` (FK `minibar_fill`); bù cho lần đếm cũ = lần nạp hiệu lực lúc đếm;<br>- UK lần đếm sống theo (`reservation_id`, `room_id`, `fill_id`);<br>- `minibar_fill.source` thêm `carry`; `minibar_fill_line.qty ≥ 0`;<br>- snapshot qua thư mục tạm, journal idx 43.<br>**Mã**:<br>- lần đếm thuộc kỳ hiện tại (lần nạp gần nhất). Tủ chưa có lần nạp được ghi nhận (`check_in`) trước lần đếm;<br>- lần đếm chỉ thay lần đếm cùng kỳ. Lần trước có thể còn sống hoặc đã bị đánh dấu cũ;<br>- giữ dòng (R6) và đảo dòng (R7) chỉ trong kỳ. Lần đếm đầu của kỳ mới ghi dòng riêng; dòng kỳ trước giữ nguyên, vẫn tính vào khóa FOC.<br>**Ở tiếp tủ** – `FrontdeskMinibarPort.onStayContinued(tx, đơn, căn, 'room_entered' \| 'extended')` (BE-A đã gọi ở B14, S4-09, B13):<br>- lần đếm gần nhất của kỳ **có tính tiền** + việc `minibar_refill` của căn **xong sau** lần đếm → lần nạp `refill` (danh mục hiện hành) → kỳ mới;<br>- có tính tiền, chưa xong việc → lần nạp `carry` (mốc = còn lại, giá của kỳ), hủy việc bổ sung còn mở. Phần hủy để trong một hàm riêng `cancelOpenRefills` (ORC dặn để DOM dễ đổi). Enum HK không có `superseded`, nên dùng `reservation_changed` + ghi chú `superseded: …`;<br>- lần đếm **không tính tiền** → không mở kỳ, lần đếm bị đánh dấu cũ (`replaced_by_check_id = id`): B18 đòi đếm lại, lần sau thay lần đó.<br>**"Đã đếm"** (`checkoutStatus` → `minibarUncheckedRooms`/B18) = có lần đếm sống trong kỳ hiện tại; `latestCheck` cũng vậy, null = cần đếm lại, không lọc ngày. Xong việc bổ sung khi lượt đã rời căn không tự mở kỳ | Ca 12 / oracle **BR-703-02** b3 (bỏ `pendingFix`): 202 → 203 → về 202 sau khi bổ sung; B18 409 `minibar_not_checked` (202) tới khi đếm; dòng mới 35.000, dòng 70.000 giữ; minibar **105.000**, tổng **2.481.000**; đếm lại cùng kỳ thay lần trước (ca 17). Ca 13/14: **130.000** / **140.000**. Ca 16 (`carry`): việc bổ sung bị hủy, bia không còn trong tủ, `latestCheck` null, 1 snack → **100.000**. Ca 18/19 (B13 sau lần đếm): 70.000 / 35.000 thay lần đếm 0 |

**Kiểm chứng** (18/10, DB mới):
- `@ottimo/api` **2.751/2.753 xanh** (86 tệp). Hai ca đỏ là của BE-A, về gợi ý giá đêm: `s438r2-money` BUG-R2-125 và `s438r3-money` BUG-R2-134 controls. BE-A đang sửa BUG-R2-145 trên cây chung; không liên quan minibar.
- `minibar-m1.test.ts` 17/17.
- tsc 0 lỗi; eslint và prettier xanh trên tệp chạm.
- `drizzle-kit generate` báo "No schema changes"; `schema-parity` xanh.
- Ma trận QA `minibar-matrix.s4.clock.spec.ts` trên stack riêng `ottimo-beb-s4`: **20/20 đạt** (cả TC-L4-118/119/122). Stack đã gỡ. `OPEN` còn BUG-R2-146 của BE-A.

**Giả định / chờ:**
- (s) Lần nạp `refill` lấy danh mục lúc lượt vào lại căn (≈ lúc xong việc), vì chưa có móc lúc HK xong việc.
- (t) Lần đếm "có tính tiền" = có dòng với số tiền > 0.
- (u) Hủy việc bổ sung dùng `cancel_reason_code = reservation_changed` + ghi chú, vì enum HK chưa có `superseded`.
- (v) Lần đếm không tính tiền bị đánh dấu cũ bằng `replaced_by_check_id = id`.
- DOM đang xem hai giả định R9 (hủy việc bổ sung; không mở kỳ khi lượt đã rời căn); ORC báo nếu đổi.
- Oracle BR-703-02 ca `s409Agoda`: chưa có ca tích hợp riêng. Đường `room_entered` giống ca 12; ma trận QA chưa có ca S4-09.

Tệp đợt này:
- Tạo:
  - `src/db/migrations/0066_minibar_period.sql`, `src/db/migrations/meta/0066_snapshot.json`
  - `src/modules/folio/public/minibar-foc-resync.ts`
- Sửa:
  - `src/db/migrations/meta/_journal.json`, `src/db/schema/inventory.ts`
  - `src/modules/inventory/internal/{fridge,minibar.service}.ts`, `src/modules/inventory/public/minibar-checkout.port.ts`
  - `src/modules/folio/folio.module.ts`, `src/modules/folio/public/folio.service.ts` (`nightRateBasis`)
  - `test/integration/minibar-m1.test.ts` (thêm 7 ca)
  - `product/tests/fixtures/br-examples.json` (bỏ `pendingFix` BR-703-02)

### 14 (bổ sung). ARC 16.14–16.16 + DOM ghi chú 18/10 BR-703-02 (R9 sửa), 18/10

| Việc | Cách cài | Kiểm chứng (`minibar-m1.test.ts`, oracle BR-703-02) |
|---|---|---|
| **16.14 `uncheckedRooms.reason`** | Cổng trả `never_counted \| stay_continued \| new_fill`. R2: tủ đã có lần đếm `checkout` trong lượt mà nay chưa đếm → `stay_continued` (kể cả kỳ mở bằng `refill`); chưa đếm lần nào → `never_counted`; `new_fill` để R3. BE-A chép sang `CheckoutSummary` – kiểu trả về trong `frontdesk/public/ports.ts` (tệp BE-A) thêm `reason?` | Ca 12 (kỳ `refill`), ca 16b và ca 16.14 (B13) → `stay_continued`; ca ARC (o) (tủ 202 chưa đếm) → `never_counted` |
| **16.14 `FolioLine.chargeCode`** | `folioLineDto` thêm `chargeCode` từ cột `charge_code` có sẵn; `x-visible-to` FD trở lên do serializer lọc | Dòng minibar mang `bia`/`coca`; dòng thay của `adjustFolioLine` (60.000) giữ `bia`; dòng phòng không có trường |
| **(s)** | Nhánh "việc xong trước khi lượt vào lại": `filled_at` = `hk_task.done_at`; mốc, giá vẫn lấy danh mục lúc vào lại (tạm tới R3) | Ca 12 (giữ số 105.000 / 2.481.000) |
| **(u)** | Không còn dùng: DOM bỏ hủy việc bổ sung, đã xóa `cancelOpenRefills` | Ca 16: T1 vẫn `open` |
| **(v)** | Tự trỏ chỉ đặt trong `onStayContinued` cho lần đếm sống của kỳ hiện tại; không truy vấn nào đi theo `replaced_by_check_id` | Ca mới: đếm 0 → B13 → 1 bản tự trỏ → HK xong T1 khi khách ở căn → 0 → B18 → lượt đã trả phòng **không còn** bản tự trỏ |
| **Chỉ mục** | `minibar_check_live_checkout_key` thêm `NULLS NOT DISTINCT`, sửa thẳng trong 0066 (chưa commit). Drizzle không biểu diễn được tùy chọn này trên chỉ mục nên snapshot giữ nguyên; `drizzle-kit generate` báo "No schema changes"; `schema-parity` so tên | Ca (v) đọc `pg_get_indexdef` có `NULLS NOT DISTINCT` |
| **DOM 1 – không hủy việc** | Bỏ `cancelOpenRefills`; kỳ `carry` giữ nguyên | Ca 16 / r9_16: T1 mở, 1 snack → **100.000**; sau B18 có T1 (2 bia) + T2 (1 snack) |
| **DOM 5 – (t)** | "Có tính tiền" = có món có giá bán **trong kỳ** (giá ở dòng lần nạp của kỳ) với `used_qty > 0`; không theo `amount_vnd` | Ca 20 / r9_t: FOC 70.000 đã duyệt, về 202 → kỳ `carry` (mốc bia 0); B18 không dòng mới; 70.000 − 70.000 = **0** |
| **DOM 1/4 – B13 sinh việc** | `onStayContinued(extended)`: sau khi xử lý kỳ, mọi lần đếm sống có dùng món chưa gắn việc của tủ được sinh việc như B18 | Ca 18 / r9_18 (a): sau B13 có T1 (2 bia); B18 **70.000**, vẫn 1 việc |
| **DOM 2 – cổng 16.16** | Tệp mới `housekeeping/public/minibar-refill-done.port.ts` (token `MINIBAR_REFILL_DONE_PORT`). `HousekeepingService` (tệp BE-C) tiêm `@Optional()`, gọi trong `setTaskStatus` cùng giao dịch khi việc `minibar_refill` → `done` (theo mẫu `onLinkedWorkDone`). `refill_items` `[{itemId, quantity}]` đổi sang `{itemId, qty}`. Inventory cài trong `MinibarCheckoutPort.onRefillDone` và cung cấp token (module `@Global`; cổng không phụ thuộc provider nào của housekeeping nên không có vòng DI). Điều kiện: đơn chính `in_house` và căn hiện tại của lượt (segment hiệu lực mới nhất tới ngày nghiệp vụ của một đơn `in_house` trong lượt) = căn của việc; việc không có đơn hoặc không có món → không làm gì. Mốc = còn lại của lần đếm gần nhất trong kỳ (kể cả bản tự trỏ; kỳ chưa đếm → mốc kỳ, gồm số 0 của `carry`) + `refill_items`; bỏ món mốc 0; giá, giá vốn = danh mục lúc xử lý, món đã tắt giữ giá kỳ. `filled_at` = `performedAt`, `created_at` = `now` | Ca 16b / r9_16b: mốc bia 2, snack 1, `filled_at` = giờ HK làm → B18 **135.000**. Ca 16c / r9_16c: mốc bia 2, bỏ snack → B18 bia 2/2 không dòng mới, **100.000** (không 130.000); T2 (1 snack) từ lần đếm 09:00. Ca 18 (b): mốc bia 2, snack 1 → **70.000**, chỉ T1 |
| **DOM 3** | Xong việc khi lượt đã rời căn → không làm gì (giữ nguyên) | Ca 12, 13/14 (HK xong khi khách ở căn khác) giữ số |
| **DOM 4 – bất biến** | `onCheckedOut` sinh việc cho **mọi** lần đếm sống có dùng món chưa gắn việc của tủ, cũ trước mới sau (`createRefillTasks`, dùng chung với B13). Trả về id việc tạo sau cùng (chữ ký cổng BE-A giữ `string \| null`) | Ca 16c: B18 sinh T2 từ lần đếm kỳ `carry` |

**Giả định mới** (đã ghi decision-log):
- (w) Lần nạp ở cổng 16.16 đóng kỳ đang có bản tự trỏ → bỏ tự trỏ (`replaced_by_check_id = NULL`): lần đếm đó là lần đếm cuối của kỳ đã đóng và là mốc của lần nạp. Nếu không bỏ, lượt trả phòng vẫn còn bản tự trỏ (trái điều kiện ARC (v)). Nếu lần đếm đó có dùng món miễn phí thì B18 sinh việc cho nó, đúng bất biến DOM 4.
- (x) Thứ tự kỳ của tủ theo `minibar_fill.created_at` (lúc xử lý – ARC 16.16 "`now` … thứ tự kỳ"), không theo `filled_at`. Lý do: `filled_at` = `performedAt`/`done_at` có thể sớm hơn lần nạp trước (hàng đợi offline, (s)). `latestFill` đổi `ORDER BY created_at DESC, id DESC`.
- (y) Sinh việc ngay chỉ cho lý do `extended` (đúng chữ ARC/DOM). Với `room_entered`, lần đếm của căn cũ đã có việc từ B14 (`onCheckedOut`) hoặc từ lần đếm tủ căn cũ.
- (z) Món trong `refill_items` không có trong kỳ và không còn trong danh mục: lấy giá của hàng hóa hiện tại. Trường hợp này không xảy ra trong luồng hiện có.
- Không khóa folio trong `onRefillDone`, vì vai HK không có quyền `UPDATE` folio nên không dùng được `FOR UPDATE`. Chỉ khóa lần đếm gần nhất của kỳ. Rủi ro đua với một lần đếm cùng lúc là thấp ở quy mô 10 căn.

**Tệp đợt bổ sung:**
- Tạo: `src/modules/housekeeping/public/minibar-refill-done.port.ts`
- Sửa – BE-B: `src/modules/inventory/{inventory.module.ts, public/minibar-checkout.port.ts, internal/fridge.ts}`, `src/modules/folio/public/folio-view.ts`, `src/db/migrations/0066_minibar_period.sql`, `src/db/schema/inventory.ts` (chú thích), `test/integration/minibar-m1.test.ts` (sửa ca 16, 18; thêm 16b, 16c, 18 (b), 20, (v), 16.14)
- Sửa – module khác (ghi rõ): `src/modules/housekeeping/internal/housekeeping.service.ts` (BE-C: tiêm cổng, gọi trong `setTaskStatus`, hàm `refillItemsOf`); `src/modules/frontdesk/public/ports.ts` (BE-A: kiểu `reason?`)

**Kiểm chứng** (18/10, DB mới `ottimo_test_beb_s4r`, 0066 đã sửa): `@ottimo/api` **2.763/2.763 xanh, 87/87 tệp**; `minibar-m1.test.ts` 23/23; tsc 0 lỗi; eslint, prettier xanh trên tệp chạm; `drizzle-kit generate` "No schema changes". Không commit, không chạy E2E (không đụng stack nào).

**Chờ**: ARC xem (w)–(z). (t) và hai giả định R9 đã theo ghi chú DOM 18/10.

## 15. Vòng sửa 4b – khóa chung theo tủ (ARC `openapi-0.3.7.md` 16.16 bổ sung), 18/10

ARC đồng ý (w), (x), (y), (z). Phần sửa này vào gộp #11; cây chung trước khi sửa là `ce90d19`.

| Việc | Cách cài | Kiểm chứng |
|---|---|---|
| **Khóa theo tủ** | `fridge.ts` `lockFridge(tx, đơn chính, căn)` = `pg_advisory_xact_lock(hashtextextended('minibar:' \|\| reservation_id \|\| ':' \|\| room_id, 0))`, gọi ở `record()`, `onRefillDone`, `onStayContinued`, `onCheckedOut`. Lần nạp và lần đếm gần nhất chỉ được đọc **sau** khi có khóa. `record()`: kiểm 422 sớm (không khóa) → khóa đơn → khóa folio → khóa tủ → `registerFridge` → đọc lại kỳ → **kiểm 422 lần nữa** trên kỳ đang hiệu lực → ghi | 4 ca đua mới trong `minibar-m1.test.ts` |
| **Thứ tự khóa** | `record()`: các đơn của folio (`FOR KEY SHARE`, theo id) → folio → tủ. `onStayContinued`, `onCheckedOut`: folio (`lockStayFolio`; người gọi B13/B14/B18 đã giữ thì không phải chờ) → tủ. `onRefillDone`: việc HK (do `setTaskStatus` khóa) → tủ. Không đường nào khóa folio hoặc việc HK sau khi đã giữ tủ | Như trên; nhật ký Postgres không còn 40P01 |
| **Hai chỗ khóa ARC chưa nêu** (test đua tìm ra, đều là 40P01) | (1) `lockFridge` lấy `FOR KEY SHARE` đơn chính và căn **trước** khóa tủ. Thiếu bước này thì: B13/B14/B18 giữ đơn và căn `FOR UPDATE` rồi chờ tủ; lần nạp đang giữ tủ thì chờ phép kiểm FK của `minibar_fill` lên chính đơn/căn đó. (2) `record()` lấy `FOR KEY SHARE` các đơn của folio **trước** folio (đúng thứ tự S4-13 đơn → folio). Thiếu bước này thì lần đếm giữ folio và chờ phép kiểm FK của dòng minibar lên đơn, còn B13 giữ đơn `FOR UPDATE` và chờ folio (`resyncStay`). Có từ trước khi có khóa tủ. `KEY SHARE` không chặn lệnh `UPDATE` thường hay phép kiểm FK khác, chỉ chặn `FOR UPDATE` | Lần đầu chạy ca "đếm lại ‖ B13" và ca "nạp ‖ đếm" ra 409 `CONCURRENT_UPDATE` (40P01). Sửa xong thì cả 4 ca xanh, chạy lặp 3 lần |
| **Test đua** | Một kết nối riêng giữ khóa tủ. Từng bước được khởi chạy, và bước sau chỉ chạy khi bước trước đã chờ khóa đó (đọc `pg_locks`, `pg_blocking_pids`). Sau đó nhả khóa, các bước chạy đúng thứ tự đã đặt. Bước nào không chờ khóa tủ thì ca hỏng | (a) **nạp → đếm**: lần đếm soạn trên kỳ `carry` gặp kỳ `refill` → 422 `MINIBAR_ITEMS_INCOMPLETE`, như chạy tuần tự (không ghi vào kỳ đã đóng); mốc bia 2, snack 1; đếm lại → 100.000. (b) **đếm → nạp**: lần nạp đọc lần đếm vừa ghi → mốc bia 2, bỏ snack (không lấy "còn lại" cũ snack 1); B18 → 100.000, T2 (1 snack). (c) **đếm lại → B13**: kỳ `carry` mở từ lần đếm mới (bia 0), việc 2 bia; 70.000. (d) **nạp → B13**: không 40P01; mốc bia 2 bỏ snack; B13 sinh T2 (1 snack) cho lần đếm kỳ `carry`; 100.000. Đối chứng trên bản sao riêng (`lockFridge` tắt): cả 4 ca hỏng |
| **0066 `NULLS NOT DISTINCT`** | Ghi chú cạnh chỉ mục trong `db/schema/inventory.ts`. `schema-parity.test.ts` thêm danh sách ngoại lệ có tên `SQL_ONLY_INDEX_OPTIONS` (`minibar_check_live_checkout_key` → `NULLS NOT DISTINCT`, kèm lý do) và một ca mới. Ca này đọc `pg_indexes`: chỉ mục trong danh sách có tùy chọn này, không chỉ mục nào khác có, snapshot vẫn giữ chỉ mục cùng tên | `schema-parity` xanh; ca (v) của `minibar-m1` cũng đọc `pg_get_indexdef` |
| **(y) phòng thủ – tùy chọn** | `onStayContinued(room_entered)` gặp lần đếm sống có dùng món mà chưa gắn việc → chỉ ghi log `warn` (chỉ id đơn, căn, lần đếm), **không sinh việc** – theo ORC. ARC 16.16 bổ sung gợi ý "tạo việc + log"; ORC chọn chỉ log | Không có ca: theo bất biến DOM 4, đường này không xảy ra |

**Kiểm chứng** (18/10, DB mới `ottimo_test_beb_s4r`): `@ottimo/api` **2.768/2.768 xanh, 87/87 tệp**; `minibar-m1` 27/27, trong đó 4 ca đua chạy lặp 3 lần đều xanh; tsc 0 lỗi; eslint, prettier xanh trên tệp chạm; `drizzle-kit generate` báo "No schema changes". Không commit.

**Giả định mới**:
- (aa) `FOR KEY SHARE` trên đơn/căn trước khóa tủ, và trên các đơn của folio trước folio trong `record()`. Đây là phần bổ sung vào thứ tự khóa của ARC; lý do ở bảng trên. ARC xem.
- (ab) Lần đếm soạn trên kỳ cũ mà gặp kỳ mới (do lần nạp hoặc lượt ở tiếp vừa ghi) thì trả 422 như chạy tuần tự. Desk/PWA tải lại `minibar-standard` rồi đếm lại; không có mã lỗi riêng.
- Chưa thêm dòng decision-log cho (aa), (ab) vì ORC giới hạn tệp được sửa ở vòng này. Nhờ ORC ghi.

**Tệp vòng 4b**: `src/modules/inventory/internal/{fridge,minibar.service}.ts`, `src/modules/inventory/public/minibar-checkout.port.ts`, `src/db/schema/inventory.ts` (chú thích), `test/integration/minibar-m1.test.ts` (4 ca đua), `test/integration/schema-parity.test.ts`; tài liệu này.

## 16. Vòng sửa 4c – `periodId` và 409 `MINIBAR_PERIOD_CHANGED` (ARC `openapi-0.3.7.md` 16.16 bổ sung 2 (ab)), 18/10

ARC chốt: (aa) đúng; nhánh `room_entered` chỉ ghi log (giữ nguyên). (ab) phải sửa vì gây sai tiền. Lần đếm soạn trên kỳ cũ, nếu danh sách món giống kỳ mới, bị áp vào kỳ mới. Ví dụ: kỳ `carry` mốc bia 1, lần nạp đưa mốc lên 2, lễ tân đếm "còn 0" từ trước lúc nạp → tính 2 bia (70.000) thay vì 1.

| Việc | Cách cài | Kiểm chứng (`minibar-m1.test.ts`) |
|---|---|---|
| `MinibarStandard.periodId` | `standard()` trả `periodId` = id lần nạp mở kỳ hiện tại; `null` = tủ chưa có lần nạp. Không có `x-visible-to`, nên HK cũng thấy | Ca BUG-R2-152: HK GET có `periodId` và gửi lại |
| `MinibarCheckInput.periodId` (tùy chọn) | Controller nhận `uuid \| null`. `record()` so hai lần: một lần sớm, trước kiểm 422; lần quyết định **sau khi khóa tủ**, trước mọi lệnh ghi. Khác thì 409 `MINIBAR_PERIOD_CHANGED`, không ghi gì. `fridge.ts` `isCurrentPeriod`: `null` khớp khi tủ chưa có lần nạp, hoặc khi lần nạp duy nhất là `check_in` ghi sau đó cho cùng mức. `check_in` này do lần đếm đầu (`registerFridge`) hoặc copy-on-write tạo, theo R2. Có `refill`/`carry` thì không khớp | Soạn trên kỳ `carry` (bia 1) → HK xong T1 (bia 1 + 1 = 2, **cùng danh sách món**) → gửi kèm `periodId` cũ → **409**, folio và số lần đếm không đổi. Tải lại → `periodId` mới → **201**, 35.000 + 35.000 |
| Vắng `periodId` | Không so, giữ cách cũ: 422 khi khác danh sách hoặc mốc. PWA HK cũ vẫn chạy | Ca `null`/vắng/lạ: `null` trên tủ chưa nạp → 201, đếm lại với `null` → 201; `periodId` lạ → 409, không ghi; vắng → 201 (100.000). Ca đua (a) của mục 15, không gửi `periodId`, vẫn 422 |
| Đua có `periodId` | Phép so nằm sau `lockFridge` | Nạp → đếm: **409** (không phải 422). Đếm → nạp: 201, lần nạp lấy lần đếm làm gốc (bia 0 + 1) |
| Idempotency (ORC) | 409 được ném ra, không trả kiểu `{ fail }`, nên `UnitOfWork` rút cả giao dịch, kể cả dòng `idempotency_key` `in_progress`. Không có bản ghi hoàn tất nào được lưu | Gửi cùng `Idempotency-Key`: lần đầu 409; lần hai, thân mới → **201**, không phải 422 `IDEMPOTENCY_KEY_REUSED`; lần ba, cùng thân → 201 `Idempotent-Replayed: true`, cùng id |
| Rà khóa `reservation FOR UPDATE` (folio, payments, approvals, inventory) | Đổi **1 chỗ**: `FolioService.lockStay` từ `FOR UPDATE OF r` sang `FOR NO KEY UPDATE OF r`, theo quy tắc BE-A mục 16. Khóa chính của đơn không bao giờ đổi. Vẫn tuần tự hóa với các lệnh đơn, nhưng không chặn kiểm FK. Còn lại: `payments` khóa đơn qua `lockForDeposit` của BE-A (module reservations, không thuộc phạm vi rà). `approvals` và các khóa khác của `folio` khóa bảng khác (approval_request, commission, channel_fee, payment). `inventory` khóa đơn bằng `FOR KEY SHARE` (mục 15) | Toàn bộ API xanh, gồm các ca đua S4-13 |

**Kiểm chứng** (18/10, DB mới `ottimo_test_beb_s4r`, cây chung có cả phần đang làm của BE-A/FE-A): `@ottimo/api` **2.773/2.773 xanh, 87/87 tệp**; `minibar-m1` 31/31; tsc 0 lỗi; eslint, prettier xanh trên tệp chạm. Không commit.

**Giả định**: (ac) `periodId: null` vẫn khớp với lần nạp `check_in` duy nhất ghi sau lúc soạn, vì đó cùng mức tủ (R2). FE-A gửi `null` khi tủ chưa nạp, đúng với cách này.

**Tệp vòng 4c**:
- `src/modules/inventory/internal/{minibar.controller,minibar.service,fridge}.ts`
- `src/modules/folio/public/folio.service.ts` (`lockStay`)
- `test/integration/minibar-m1.test.ts` (4 ca mới + kiểm HK)
- tài liệu này; `01-decisions/decision-log.md`

## 17. Vòng sửa 5 – kiểm lại tiền lần 5 (`reviews/s4-money-recheck5.md`; ARC `openapi-0.3.7.md` 16.3, 16.4 ca 21–28, 16.17; DOM 18/10), 18/10

| Mã | Cách sửa | Kiểm chứng (`minibar-m1.test.ts`) |
|---|---|---|
| **BUG-R2-158** (A1, ca 28) | Đã sửa ở #11 (`f04052d`): `record()` lấy khóa tủ trước `registerFridge`/`fridgeItems`. Vòng này chỉ thêm test chính thức | Lễ tân ‖ HK đếm tủ chưa nạp, ép **cả hai thứ tự** bằng khóa tủ: hai lệnh 201, **1** lần nạp `check_in`, **1** lần đếm sống, **70.000** = `latestCheck.totalVnd` = B18, 1 việc `{bia: 2}` |
| **BUG-R2-164** (ca 27) – migration **0067** `0067_minibar_fill_backfill_unfilled.sql` (chỉ dữ liệu; snapshot = 0066 đổi id/prevId, journal idx 44; `drizzle-kit generate` báo "No schema changes") | (b) `RAISE EXCEPTION` kèm danh sách nếu một tủ có hơn 1 lần đếm sống mà `fill_id` NULL; không tự sửa tiền. (a) Tủ của lượt `in_house` có lần đếm `checkout` mà chưa có lần nạp → lần nạp `backfill`: `filled_at` = `created_at` = lần đếm đầu − 1 ms; dòng = `standard_qty` và giá/giá vốn chụp của lần đếm đầu. Sau đó mọi lần đếm `fill_id` NULL nhận lần nạp hiệu lực lúc đếm (luật 0066), có chặn trùng lần đếm sống. (c) Hủy việc `minibar_refill` hệ thống đang mở của lượt `in_house` mà không lần đếm sống nào trỏ tới (`reservation_changed`, ghi chú `minibar_duplicate_refill_0067`) | **Hai pha**: dữ liệu dạng 365486f (lần đếm không có lần nạp) → câu bù của 0066 (`fill_id` vẫn NULL) → các câu dữ liệu của 0067 chạy dưới quyền `ottimo_owner` với RLS theo cơ sở → K1–K3 = 0. Lễ tân xác nhận lại cùng số → **không thêm dòng** (70.000, 1 lần đếm sống). Đếm 1 → đảo, ghi 35.000. B18 = phòng + 35.000. Test A2 của người kiểm, có thêm bước chạy 0067, xanh trên DB mới |
| **BUG-R2-159** (ca 21–25) – ARC 16.17 I1–I4 | Tệp mới `inventory/internal/refill-tasks.ts`: `reconcileRefillTasks(tx, lock: FridgeLock, { create, now, today, events })` là **chỗ duy nhất** ghi việc `minibar_refill` hệ thống và `minibar_check.refill_task_id`. `FridgeLock` chỉ có được từ `lockFridge`, nên không gọi được hàm khi chưa khóa tủ (kiểm lúc biên dịch). Đã **xóa** `createRefillTasks`. Hàm làm theo từng kỳ có lần đếm sống: need = đã dùng − Σ việc đã xong (tính theo món); need rỗng → hủy việc đang mở (`minibar_recount_zero`); có việc mở → giữ việc mới nhất, cập nhật số, hủy việc thừa (`minibar_duplicate_refill`), chuyển trỏ sang lần đếm sống; không có việc mở mà `create` → tạo việc. Mỗi lần hủy ghi `state_transition` SM-14 (DOM 3). Nơi gọi: `record()` (`create` = tủ căn cũ hoặc `prev` đã có việc); `onCheckedOut` (`create: true`, vẫn trả id việc do chính lệnh tạo – hợp đồng `createdTaskIds` của BE-A); `onStayContinued` (`extended` → `true`, `room_entered` → `false` kèm log), gọi **trước** `openNextPeriod`. `onRefillDone` chỉ đọc: bỏ qua việc không sống (I2). **409 `MINIBAR_PERIOD_CHANGED`** khi đếm lại kỳ mà việc sống đã xong. `detail` gợi ý sửa dòng folio có lý do (BR-702/BR-008), không đếm lại – DOM 1 | Ca 21 (D1): HK đếm lại cùng số → T1 chuyển sang lần đếm mới, 1 việc `{bia: 2}`; về 202, HK xong trong căn → mốc bia 2; uống 1 → **105.000**. Ca 22 (D2): sửa 2 → 1 → 35.000, T1 `{bia: 1}`. Ca 23 (A4): HK + lễ tân cùng 2 bia → 1 việc, mốc 2, **70.000**. Ca 24: đếm lại 0 → đảo, T1 hủy (`reservation_changed`, `minibar_recount_zero`). Ca 25: (a) T1 đã xong → **409**, giữ 35.000; (b) đếm lại 2 trước khi xong → T1 `{bia: 2}`, 70.000, 1 việc. K1–K3 = 0 sau ca 21, 22, 24, 27 |
| **BUG-R2-163** (ca 26) – ARC 16.17 mục 2 | So thứ tự theo **giờ xử lý**: việc xong = `state_transition.occurred_at` của bước `complete` (`completedAt()`), so với `minibar_check.created_at`. Không dùng `done_at`/`performedAt`/`filled_at`. `openNextPeriod`: mốc = còn lại của lần đếm sống + số của **việc sống** đã xong sau lần đếm; > 0 → kỳ `refill` (giá danh mục hiện hành, món đã rời danh mục giữ giá kỳ), = 0 → kỳ `carry`. `filled_at` = `done_at`, chỉ để hiển thị | Ca 26 (Z2): HK offline đếm lúc 16:30 và xong T1 lúc 16:45, cả hai đồng bộ lúc 18:00/18:05 → về 301: kỳ `refill`, mốc bia 2; uống 1 → **105.000** (không phải 70.000) |
| **Thứ tự khóa** (test đua tìm ra) | `record()`: đơn (`FOR NO KEY UPDATE`, như BE-A) → folio → việc bổ sung đang mở của tủ (`FOR UPDATE`, lấy trong `lockFridge(…, { refillTasks: true })`) → tủ. Đường HK: việc → tủ. Các đường đặt phòng (B13/B14/B18) không khóa trước việc, vì chúng giữ căn `FOR UPDATE`. Khi cần ghi vào việc, `reconcileRefillTasks` khóa `NOWAIT`: việc đang bận → 409 `CONCURRENT_UPDATE`, client thử lại, không phải chờ khóa. `lockStayBookingsShared` đổi tên thành `lockStayBookings` (NO KEY UPDATE) | Các ca đua cũ (mục 15–16) xanh. Ca "đếm → nạp" từng ra 40P01 trước khi khóa việc trước tủ |

**Hàm và tệp phụ**:
- `fridge.ts`: `lockFridge` trả `FridgeLock`; thêm `refillFillItems` (mốc và giá cho lần nạp `refill`, dùng chung cho `onRefillDone` và `openNextPeriod`).
- `housekeeping.service.ts` (BE-C) không đổi trong vòng này.
- BE-C (P3) vẫn còn việc: `transitionHkTask` từ chối `performedAt` < `hk_task.created_at`.

**Test người kiểm** (chép vào bản sao riêng của cây chung, DB `ottimo_test_beb_s4c`, không ghi vào cây chung):
- `r5mini-attack`: A1, A3, A3c, A4, A4b, A4c, A5–A7, K1 xanh. A2 xanh khi thêm bước chạy 0067 (bản gốc chỉ chạy 0066).
- `y-r4mini-1-0`: MAIN, C1, C2 xanh.
- `mb-r5` R5-D1…D3 xanh.
- Các ca chuyển sang đỏ đúng như dự kiến, vì chúng khẳng định lỗi cũ:
  - Z1 "finding as written" (kỳ `carry`, 70.000);
  - Z2b (còn việc T2 trùng);
  - V4 (mốc 4).
- Các ca đánh dấu việc "xong" bằng `UPDATE hk_task` trực tiếp, không có bước `complete`: `mb-r5` ca 12, 13/14; `r4mini` B3, B6; `y-fridge-return` Y1b, Y3. Theo 16.17 mục 2, những việc này không tính là "xong sau lần đếm". Khi thêm dòng `state_transition` `complete` thì cả 56 ca xanh.
- **QA đổi kỳ vọng cho các ca trên**: hoàn tất việc qua API hoặc ghi kèm `state_transition`.
- `minibar-m1.test.ts` của tôi đã đổi `refillDone` sang gọi API.

**Truy vấn kiểm cho OPS/DATA** (chạy sau 0067; mỗi truy vấn phải trả 0 dòng – ARC 16.17 mục 3):
```sql
-- K1: lần đếm sống fill_id NULL của lượt đang ở
SELECT c.id FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
 WHERE r.status = 'in_house' AND c.mode = 'checkout'
   AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id) AND c.fill_id IS NULL;
-- K2 (I1): kỳ có > 1 việc minibar_refill mở
SELECT c.reservation_id, c.room_id, c.fill_id, count(DISTINCT t.id) AS open_tasks
  FROM minibar_check c JOIN hk_task t ON t.id = c.refill_task_id
 WHERE t.type = 'minibar_refill' AND t.status IN ('open', 'in_progress')
 GROUP BY 1, 2, 3 HAVING count(DISTINCT t.id) > 1;
-- K3 (I2): việc minibar_refill do hệ thống sinh, đang mở (có đơn), không gắn lần đếm sống
SELECT t.id FROM hk_task t
 WHERE t.type = 'minibar_refill' AND t.source = 'system' AND t.status IN ('open', 'in_progress')
   AND t.reservation_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM minibar_check c WHERE c.refill_task_id = t.id
                    AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id));
```
K3 và bước (c) của 0067 chỉ xét việc `source = 'system'` (ARC đồng ý (ag), 16.17 bổ sung), nên việc HK tạo tay không bị đếm hay hủy.

**Kiểm chứng** (18/10, DB mới `ottimo_test_beb_s4r`, cây chung có cả phần đang làm của BE-A/FE-A):
- `@ottimo/api` **2.782/2.785**. 3 ca đỏ đều là của BE-A: `s438r4-money` BUG-R2-145 (giá đêm thêm/phí trả muộn). `reservations.service.ts`/`checkout.service.ts` đang sửa dở và còn lỗi tsc `NightSource`. Không liên quan minibar.
- `minibar-m1` 39/39; `payments-s3` xanh.
- tsc 0 lỗi trên tệp của tôi; eslint, prettier xanh trên tệp chạm.
- Không commit.

**Giả định**:
- (ad) `reconcileRefillTasks` nhận thêm `today` (hạn của việc tạo mới) và `events` (SSE) trong `opts`, ngoài `create`, `now` mà ARC nêu.
- (ae) `onCheckedOut` vẫn trả id việc **do chính lệnh tạo**, không phải "việc sống của kỳ hiện tại", để giữ nghĩa `createdTaskIds` của B18. Gọi lại B18 thì trả null.
- (af) Phần ghi vào việc trên đường B13/B14/B18 dùng `NOWAIT`. Hiếm khi bận (HK đang bấm xong đúng việc đó); khi bận thì trả 409 để thử lại, thay vì chờ 1 giây rồi gặp 40P01.
- (ag) Bước (c) của 0067 và K3 chỉ xét việc do hệ thống sinh (`source = 'system'`).
- ARC đồng ý (ad), (ae), (af), (ag) và thứ tự khóa mới (16.16, 16.17 bổ sung).

**Tệp vòng 5**:
- Tạo: `src/modules/inventory/internal/refill-tasks.ts`, `src/db/migrations/0067_minibar_fill_backfill_unfilled.sql`, `src/db/migrations/meta/0067_snapshot.json`.
- Sửa: `src/db/migrations/meta/_journal.json`, `src/modules/inventory/internal/{fridge,minibar.service}.ts`, `src/modules/inventory/public/minibar-checkout.port.ts`, `test/integration/minibar-m1.test.ts` (ca 21–28, K1–K3, `refillDone` qua API); tài liệu này; `01-decisions/decision-log.md`.

## 18. Vòng sửa 5b – kiểm lại tiền lần 5b (`reviews/s4-money-recheck5b.md`; ARC `openapi-0.3.7.md` 16.19 và 16.19 bổ sung; DOM 18/10 BR-522, BR-703 ghi chú 7), 18/10

Trước khi #12 (`3bd4ac4`) commit, tôi soạn bản sửa trên bản sao riêng của cây chung. Sau commit thì áp vào cây chung bằng script (`scratchpad/beb-s4/apply5b*.py`).

| Mã | Cách sửa | Kiểm chứng (oracle tiền + đối chứng tuần tự) |
|---|---|---|
| **K11-02** (P1) – migration **0069** `0069_minibar_fill_check_in_key.sql` (snapshot sinh qua thư mục tạm, journal idx 46 sau 0068; `drizzle-kit generate` báo "No schema changes") | Kiểm dữ liệu trước: tủ có > 1 lần nạp `check_in` → `RAISE` kèm danh sách, không tự sửa. Sau đó tạo `CREATE UNIQUE INDEX minibar_fill_check_in_key ON minibar_fill (reservation_id, room_id) WHERE source = 'check_in'`. Schema drizzle khai báo cùng chỉ mục. `writeFill` ghi bằng `INSERT … ON CONFLICT (reservation_id, room_id) WHERE source = 'check_in' DO NOTHING RETURNING id`; không có dòng trả về thì đọc lại lần nạp thắng. Cả `registerFridge` (đường đếm) và copy-on-write (đường danh mục) đều qua hàm này. L0: `items.service.ts` (tệp BE-D) khóa món bằng `FOR NO KEY UPDATE`, nên phép kiểm FK `KEY SHARE` của dòng đếm/lần nạp không phải chờ lần sửa danh mục | Lần đếm đầu của HK (bia dùng 2, `periodId: null`, `roomId`) ‖ OWN `POST /items`, ép **cả hai thứ tự** bằng khóa dòng món bia: hai lệnh 201, **1** `check_in`, 1 lần đếm sống, tóm tắt không chặn minibar, **70.000**, B18 200, **1** việc `{bia: 2}` |
| **K11-03** (P1) – hợp đồng 16.19 | Có `periodId` (kể cả `null`) mà vắng `roomId` → 422 `REQUIRED` (`field: roomId`). `isCurrentPeriod` theo (ac) mới: `null` chỉ khớp khi tủ **chưa có** lần nạp nào; `periodId` là id thì phải đúng lần nạp mới nhất của **chính tủ đó**. Sai thì 409. `MinibarStandard.roomId` = tủ của bản chuẩn (trường sẽ hiện ra khi ARC sinh lại generated) | Ca (ab)/(ac): 422 `REQUIRED`; `null` lần đầu 201, `null` lần hai 409; đúng `periodId` 201; id lạ 409, không ghi. Ca K11-03: soạn tủ 202 (`null`), bàn khác B14 202 → 203 (B14 ghi lần nạp tủ 202) → 409; tải lại → 201 vào **tủ 202**, 35.000, việc `{bia: 1}` sinh ngay; hôm sau B18 đòi tủ 203 (`never_counted`); tổng **35.000**; K1–K4 = 0 |
| **K11-04** (P2) | `record()` theo thứ tự 16.19: L1 đơn của folio `KEY SHARE` (`lockStayBookings`) → L2 căn của tủ `KEY SHARE` (`lockFridgeParents`, tách khỏi `lockFridge`) → L3 `lockForPosting` → L4 các việc bổ sung đang mở → L5 tủ. `lockFridge` chỉ còn L4 (tùy chọn) và L5. `onRefillDone`: việc (L4, đã giữ) → L1/L2 → L5 (E2) | B18 ‖ đếm lại cùng tủ, B18 trước (ép bằng khóa tủ): đếm chờ ở căn, không 40P01. B18 200 thu **35.000**; lần đếm muộn trả 409 và không đổi gì. Các ca đua cũ (mục 15–17) xanh |
| **K11-05** (P2) | Dưới L3: đọc lại lượt, căn hiện tại và tủ. Vắng `roomId` mà căn đã đổi trong lúc chờ → 409 `MINIBAR_PERIOD_CHANGED`. Cờ `create` của `reconcileRefillTasks` xét theo căn đọc dưới khóa | Đếm vắng `roomId`/`periodId` (client cũ) chờ trong lúc B14 301 → 302 commit (ép bằng khóa tủ) → 409, **0** lần đếm, minibar 0 (không lặng lẽ ghi vào tủ sai) |
| **K11-06** (P3, DOM BR-522) | `addFolioLine`: L1 đơn `KEY SHARE` → L3 folio, rồi đọc trạng thái đơn → `cancelled`/`no_show` trả 409 `INVALID_TRANSITION` (`currentState`) cho **mọi vai**. Dòng hệ thống và void/sửa giữ nguyên | `approvals-refund-payout`: cọc, hủy `found_other`; FD, MGR, OWN thêm F&B 90.000 → 409, totals giữ, yêu cầu hoàn = số cọc; chi đủ → `refunded_vnd` = số cọc (SM-10 giữ `approved`) |
| **K11-07** (P3) | Chú thích `record()` viết lại theo thứ tự khóa thật | – |
| **K11-09** (DOM BR-703 ghi chú 7) – ca 29 | `checkoutStatus`/`uncheckedRooms`/`standard().latestCheck`: tủ **căn đang ở** cần lần đếm có `business_date` = ngày nghiệp vụ hiện tại; tủ căn đã rời giữ quy tắc cũ. `reason` thêm `not_today` (kiểu ở `ports.ts` và `checkout.service.ts` của BE-A, chỉ đổi kiểu) | Lần đếm "dùng 0" soạn trước B13, gửi sau B13 → hôm sau B18 chặn, `reason: not_today`, `latestCheck` null; đếm 1 bia → **35.000**, không phải 0 |
| **K4** | Thêm vào `invariants()` của `minibar-m1`: lần đếm sống có dùng món, chưa gắn việc, của tủ lượt đã rời hoặc lượt `checked_out` | = 0 cùng K1–K3 ở ca 21, 22, 24, 27, K11-03 |

**Rà theo quy tắc đọc 16.19 (ORC):**
- **`postFee`** (phí HK khi xong việc; `guest-request-lifecycle.ts`, BE-D): **an toàn**. Hàm chỉ ghi dòng qua `FolioService.postLines`. Hàm này khóa folio (L3) trước, rồi mới đọc trạng thái folio (`open` / trong cửa sổ sau trả phòng) để quyết định. Không đọc số dư. Lưu ý cho ARC: đường này giữ việc HK (L4) rồi mới lấy folio (L3). Hiện chưa có vòng chờ, vì không đường nào giữ folio rồi chờ việc `guest_request`; nên ghi thành ngoại lệ có tên.
- **Dòng damage**:
  - Tạo dòng (`addFolioLine` category `damage`): **an toàn**, nay L1 → L3 ngay đầu lệnh.
  - Duyệt giá (`onDamageDecided`): **đã sửa**. Trước đây đường duyệt khóa yêu cầu (L4) rồi chuyển dòng `pending_approval` → `posted` mà không khóa folio. Tôi thêm `damage_pricing` vào hook `onBeforeDecide` (`folio.module.ts`), như FOC: L1 → L3 trước yêu cầu.
  - Test: MGR duyệt damage 400.000 ‖ B18 không thu tiền, duyệt trước (ép bằng khóa dòng folio) → B18 thấy dòng đã ghi, 409 `BALANCE_DUE`, folio `open`, nợ 400.000, đơn vẫn `in_house`. Không có hook thì lệnh duyệt không chờ folio, nên ca hỏng.

**Test người kiểm** (`k11period`, `q-k11period-1-*`, `q-k11lock-1-*`, chạy trên bản sao riêng): 51/60 đỏ. Phần lớn do hợp đồng mới: 23 ca gửi `periodId` mà vắng `roomId` nên nay nhận 422. Một số đầu dò chờ khóa ở chỗ cũ (folio, dòng món) trong khi thứ tự mới chờ ở căn. Các ca bị cắt giữa chừng thì sinh lỗi kết nối `25P03`. **QA cần cập nhật các ca này theo 16.19 trước khi kiểm lại lần 6.** Các ca tương ứng của tôi (kèm oracle tiền) đã có trong `minibar-m1`.

**Kiểm chứng** (18/10, DB mới `ottimo_test_beb_s4r`, cây chung sau `3bd4ac4`, có cả phần đang làm của BE-A/ARC): `@ottimo/api` **2.844/2.844 xanh, 89/89 tệp**; `minibar-m1` 45/45; tsc 0 lỗi; eslint, prettier xanh trên tệp chạm; `drizzle-kit generate` "No schema changes". Không tự sinh generated. Không commit.

**Giả định:**
- (ah) (ac) theo 16.19 làm ví dụ K11-03 của ARC đổi kết quả. B14 rời căn gọi `registerFridge`, nên tủ căn cũ có `check_in`. Lần đếm soạn với `null` trước B14 vì thế nhận 409 và phải tải lại (ARC ghi 201). Tôi chọn đúng hợp đồng (ac). ARC xem.
- (ai) `checkoutStatus` không lấy L5 khi đọc. Trong B18, mọi bên ghi tủ đã bị khóa căn `FOR UPDATE` của B18 chặn từ L2 (ARC 16.19). Đường tóm tắt trả phòng chỉ để hiển thị.
- (aj) `FolioService.lockStay` (FOC, damage) giữ L1 `FOR NO KEY UPDATE`, không đổi sang `KEY SHARE` như bảng 16.19 ghi. Đổi thì quyết định FOC và lệnh hủy đơn đang giữ `stay_night` không còn tuần tự ở L1, mở lại deadlock S4-13. ARC xem.
- (ak) Phần ngày của K11-09 dùng cột `minibar_check.business_date`. Cột này ghi đúng ngày nghiệp vụ của `created_at` lúc đếm.

**Tệp vòng 5b:**
- Tạo:
  - `src/db/migrations/0069_minibar_fill_check_in_key.sql`, `src/db/migrations/meta/0069_snapshot.json`
- Sửa – BE-B:
  - `src/db/migrations/meta/_journal.json`, `src/db/schema/inventory.ts`
  - `src/modules/inventory/internal/{fridge,minibar.service}.ts`, `src/modules/inventory/public/minibar-checkout.port.ts`
  - `src/modules/folio/internal/{folio-lines.service,folio.controller}.ts`, `src/modules/folio/folio.module.ts`
  - `test/integration/{minibar-m1,approvals-refund-payout}.test.ts`
- Sửa – module khác (chỉ những dòng ghi ở đây):
  - `src/modules/inventory/internal/items.service.ts` (BE-D, L0 `FOR NO KEY UPDATE`)
  - `src/modules/frontdesk/public/ports.ts`, `src/modules/frontdesk/internal/checkout.service.ts` (BE-A, kiểu `reason` thêm `not_today`)
