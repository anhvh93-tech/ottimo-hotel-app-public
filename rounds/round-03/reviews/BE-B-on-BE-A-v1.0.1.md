# BE-B review BE-A – bản vá v1.0.1 (B16 tính thử ADR-015, phần folio/tiền)

- Người review: BE-B (folio/tiền) | Round 3 – Review chéo bản vá v1.0.1 (04/11) | Ngày: 27/10/2026
- Đối tượng: nhánh `be-a-v1.0.1`, commit `5e966a5` (cắt từ hợp đồng ARC `22fe06d`, OpenAPI 0.3.9). Đọc qua `git diff 22fe06d 5e966a5` và worktree `agent-aa7d925f78ba216d9` (chỉ đọc, không sửa).
- Đầu vào: báo cáo `rounds/round-03/outputs/BE/v1.0.1-be-a.md` mục 3, ADR-015, `rounds/round-03/reviews/SEC-on-ADR-015.md`, BR-428 (`product/docs/business-rules.md` dòng 172), oracle `product/tests/fixtures/br-examples.json` BR-428-01…06, `EarlyDepartureResult` trong `openapi.yaml` 0.3.9, đặc tả UXD `rounds/round-03/outputs/UXD/v1.0.1-early-departure-and-prices.md`.
- Đường dẫn code dưới đây tính từ `product/services/api/src/`, số dòng theo `5e966a5`.

## Kết luận nhanh

| Việc ORC giao | Kết luận |
|---|---|
| 1. Sáu hàm folio chạy thật rồi bị rollback | **Đạt.** Không có tác dụng ngoài giao dịch, không tiêu số chứng từ khách thấy, không gọi `refundPlan`/J15, không có lệnh `tx.db` nào trong `src/`. Còn 1 lỗ hổng phòng thủ cần bịt (thẻ 03). |
| 2. Vị trí so `AMOUNT_CHANGED` | **Đúng.** So sau `balance`, trước `approvals.submit`. Lỗi được `throw` nên cả giao dịch rollback, kể cả khóa idempotency. Không có đường ghi một phần rồi mới 409. |
| 3. `refundCapped`, `roomChangeDifferenceVnd`, nhãn `0d` | `refundCapped` khớp công thức hợp đồng. **`roomChangeDifferenceVnd` đang là số chưa trần, nhưng đặc tả UXD hiểu là số "đã thu, hoàn đủ"**, nên Desk có thể nói sai với khách (thẻ 01). Nhãn `0d` trên bill đơn chỉ có đêm OTA là lỗi có từ trước (thẻ 02). |
| 4. Chạy lại test | **Đạt**, chạy trên DB riêng `ottimo_test_beb101r`: 3 file mới 48/48, 8 file hồi quy folio/B16 322/322 (chi tiết ở cuối). |

Số thẻ: **0 Blocker · 1 Major · 3 Minor · 2 Suggestion.**

---

## A. Xác nhận việc 1: sáu hàm folio trên đường `simulate`

Cách kiểm: đọc từng hàm và các hàm con, rồi grep toàn `src/` các tác dụng không đi theo giao dịch: HTTP (`fetch`, `axios`, `undici`, `https.request`), `EventEmitter`/`setTimeout`/`nextTick`, trạng thái module/instance có thể ghi, `nextval`/`setval`, `pg_advisory_lock` mức session, `set_config(..., false)`, `LISTEN`, `tx.db`.

| Hàm (gọi ở `stay.service.ts`) | Hàm con đáng chú ý | Tác dụng ngoài giao dịch? |
|---|---|---|
| `replaceLateCharge` (1601) → `reverseLine` + `syncReductions` (`frontdesk/internal/stay-support.ts:686`) | `liveSurchargeLines`, `syncReductions` → `approvals.setFocState`/`setLineChange` → `outbox_message` + `events.notify` | Không. Outbox là bảng. `notify` = INSERT + `pg_notify`, mà `pg_notify` chỉ được gửi khi COMMIT. |
| `resyncStay` (1614) → `syncStay` (`folio/public/folio.service.ts:1913`) | `moveReductionKeys`, `reverseWithReductions`, `insertLine`, `repostVoidedDifferences`, `syncReductions`, `syncCommission`, `syncChannelFee`, `syncOtaCollect`, `audit.recordMoney`, `nights.setDiscount/setCommissions/setChannelFees` | Không. Riêng `syncOtaCollect` (`folio.service.ts:1864`, `:1881`) cấp **mã phiếu thu** qua `DocNumberService.allocate` = `INSERT … ON CONFLICT DO UPDATE doc_sequence`. Đây là bảng, nên ROLLBACK trả lại số: không có số phiếu bị nhảy. |
| `onReservationVoided` (1616) → `voidCommissions` | UPDATE `commission` + audit | Không. |
| `reverseLine` (1640, `folio.service.ts:957`) | `reverseWithReductions`, `resyncOtaCollect` (có thể cấp mã phiếu như trên), `syncReductions` | Không. |
| `postLines` (1665, `folio.service.ts:871`) | `lockForPosting`, `insertLine`, `syncReductions`, `syncOtaCollect` (dòng `early_departure_fee` thuộc `OTA_COVERED`) | Không. |
| `balance` (1687, `folio.service.ts:1032`) | `payments`, `lines`, `openRefundVnd` | Chỉ đọc. |

Các điểm đã xác nhận thêm:
- **Số bill**: chỉ `settle` cấp (`folio.service.ts:1326`), và `settle` không nằm trên đường B16. Mã phiếu thu (`payment`) và mã chứng từ khác đều đi qua bảng `doc_sequence`, rollback được. Sequence thật bị tiêu chỉ có `audit_event_id_seq` và `state_transition_id_seq` (id nội bộ, khách không thấy, SEC đã chấp nhận).
- **`refundPlan` / J15**: `refundPlan` chỉ chạy trong `closeStayPreview`, `afterSettledMoneyChange`, `closeStayCredit`, `reopenStayCredit`, `refundsDownToCredit` và `reconcileRefundsAfterReversal`. Chỗ gọi các hàm này nằm ở `payments.service.ts` (`:308`, `:609`, `:907`), `folio-lines.service.ts` (`:357`, `:751`) và job đóng folio. Không chỗ nào nằm trên đường B16. J15 (`folio.close` / `closeAfterWindow`) là job của worker, đường B16 không xếp lịch hay gọi nó. `approvals.submit` (loại `refund`) bị bỏ qua khi tính thử (`stay.service.ts:1700`).
- **Trạng thái trong tiến trình**: các `Map`/biến instance tìm được (`approval.service.ts:346-353`, `reservation-hooks.ts:213-222`, `audit-fields.ts:12`, `auth.guard.ts:181`…) chỉ là phần đăng ký lúc khởi động hoặc cache đọc. Đường B16 không ghi vào chúng. `RoomPriceCache` (`stay-support.ts:92`) sống theo từng lần gọi.
- **Hook đặt phòng**: `stay.emit`/`events.publish` chỉ chạy ở lần ghi (sau `if (dryRun) return`). Các listener `transitioned`/`stay_changed` (`frontdesk.module.ts:182`, `registration.module.ts:105/112`, `reporting.module.ts:61`) không đụng tiền folio. Vì vậy số của lần ghi = số của tính thử, không có thay đổi tiền nào xảy ra sau phép so.
- **Khóa tư vấn**: chỉ có `pg_advisory_xact_lock` (`approval.service.ts:662`, `inventory/internal/fridge.ts:57`), tự nhả khi ROLLBACK. `pg_advisory_lock` mức session chỉ có ở `db/migrate.ts`, ngoài đường này.
- **`tx.db` (drizzle)**: grep `\.db\b` trong `src/` chỉ thấy `this.db` (đối tượng `Database`) và một chỗ truyền qua `db: inner.db` (`db/database.ts:231`). **Không module nghiệp vụ nào dùng `tx.db`.** Rủi ro hiện chỉ là lý thuyết (xem thẻ 03).
- **Lối thoát qua SAVEPOINT**: `simulation_guard` được chèn ngay sau `BEGIN` + `SET_CONTEXT_SQL`, trước mọi SAVEPOINT. Vì vậy `ROLLBACK TO` không thể gỡ dòng chốt. Lệch đề xuất SEC (cho SAVEPOINT/RELEASE/ROLLBACK TO) là an toàn.
- **Thông báo khóa thêm do tính thử**: với đơn OTA trả trước, tính thử giữ khóa dòng `doc_sequence` (loại `payment`, toàn property) đến lúc ROLLBACK (xem thẻ 05).

## B. Xác nhận việc 2: vị trí so `AMOUNT_CHANGED`

- `stay.service.ts:1687-1698`: `credit = balance(...)`, rồi `refundVnd` và `extraPersonRefundVnd`, rồi `earlyDepartureFeeVnd`, rồi phép so, rồi mới `approvals.submit` (1700) và `attachments.bindTo` (1713).
- Sau phép so, không bước nào làm đổi `refundVnd`/`earlyDepartureFeeVnd`: `submit`, `bindTo`, audit, outbox, registration hook, `emit`.
- Lỗi đi bằng `throw problem(...)`, **không** trả `{ fail }`. Điều này quan trọng: `UnitOfWork.runInner` (`shared/http/unit-of-work.ts:198-214`) **COMMIT** khi handler *trả về* một `UseCaseFailure` (nó lưu phản hồi lỗi vào khóa idempotency rồi commit). Với `throw`, `withContext` rollback cả occupancy, đêm void, folio lẫn khóa `in_progress`. Test `409 AMOUNT_CHANGED writes nothing` so ảnh chụp toàn tenant trước và sau, rồi dùng lại cùng `Idempotency-Key` thành công. Như vậy đã có chốt hồi quy cho việc này.
- `assertVersion` (412) chạy trước mọi lần ghi. `f.done()` (422) chạy trước khóa phòng/folio. Không có đường nào ghi một phần rồi trả 409/412/422.

## C. Xác nhận việc 3: công thức

- `refundVnd = min(refundableVnd + phụ thu người đêm bỏ + roomChangeDifferenceVnd, unhandledCreditVnd sau thay đổi)`. Khớp mô tả `EarlyDepartureResult`. Số dư được đọc **sau** khi đảo đêm và ghi dòng phí, nên phí đã nằm trong số dư.
- `refundCapped = refundVnd < refund.refundVnd + droppedFeesVnd + differenceReversedVnd` (1737). Vì `extraPersonRefundVnd + extraPersonReversedVnd = droppedFeesVnd`, công thức này đúng nguyên văn hợp đồng.
- `extraPersonRefundVnd = min(droppedFeesVnd, refundVnd)` (1689). Đúng bậc 1 của thứ tự BR-428 (phụ thu người → chênh lệch đổi phòng → phần 50%).
- Thử tay một ca: đơn trực tiếp 4 × 700.000 trả đủ; phụ thu 150.000/đêm đã ghi nhưng chưa thu; rời sớm 2 đêm, báo trước 1 ngày. Số dư sau thay đổi = 2.800.000 − (1.400.000 + 300.000 + 700.000) = 400.000. Kết quả: `refundVnd` 400.000, `extraPersonRefundVnd` 300.000, `refundCapped` true. Tổng tiền đúng (khách trả 2.800.000, nợ thật 2.400.000).
- `roomChangeDifferenceVnd` lấy từ `differenceReversedVnd` (1736): là số **đã đảo, chưa trần**, gồm cả chênh lệch đã ghi mà chưa thu. Xem thẻ 01.

---

### FB-R3-BE-B-BE-A-01
- Mức độ: Major
- Vị trí: `modules/frontdesk/internal/stay.service.ts:1736-1737` (`roomChangeDifferenceVnd: differenceReversedVnd`); `openapi.yaml` 0.3.9 `EarlyDepartureResult.roomChangeDifferenceVnd`; UXD `v1.0.1-early-departure-and-prices.md` dòng 175 và chuỗi `early_departure.row_room_change` (dòng 499)
- Vấn đề:
  - Trong phản hồi B16, hai thành phần tiền hoàn đang dùng hai nghĩa khác nhau:
    - `extraPersonRefundVnd` là phần **được hoàn sau trần** (có cặp `extraPersonReversedVnd` = phần chỉ đảo dòng);
    - `roomChangeDifferenceVnd` là số **đã đảo, trước trần**, gồm cả chênh lệch đã ghi mà khách chưa trả.
  - Code đúng nguyên văn hợp đồng ("chênh lệch … của các đêm bỏ được đảo").
  - Nhưng UXD hiện dòng 6 từ trường này với nhãn "Chênh lệch đổi phòng **đã thu** của các đêm bỏ – **hoàn đủ**" / "already paid … refunded in full".
  - Ví dụ: đơn OTA có chênh lệch 400.000 đã ghi, khách mới trả 100.000 thừa (không có phụ thu người). Server trả `roomChangeDifferenceVnd` 400.000, `refundVnd` 100.000, `refundCapped` true. Desk sẽ hiện "Chênh lệch đổi phòng đã thu – hoàn đủ: 400.000" ngay trên dòng "Hoàn 100.000".
  - Hợp đồng cấm client tự tính phân bổ ("không tự tính thay"), nên FE không có số nào để hiện đúng.
- Vì sao quan trọng:
  - Lễ tân đọc số trên màn hình cho khách. Một con số "đã thu – hoàn đủ" sai là sai tiền ở phần giải thích, dù tổng hoàn vẫn đúng.
  - BR-428 chỉ hoàn 100% chênh lệch "**đã thu tại quầy**", và phần vượt số dư "chỉ đảo dòng, không hoàn".
- Đề xuất sửa (cần DOM chốt nghĩa, ARC chốt hợp đồng):
  - **Phương án A (đề xuất)**: làm giống cặp phụ thu người.
    - `roomChangeDifferenceVnd` = phần **được hoàn sau trần** = `min(differenceReversedVnd, refundVnd − extraPersonRefundVnd)`.
    - Thêm `roomChangeDifferenceReversedVnd` = `differenceReversedVnd − roomChangeDifferenceVnd` (chỉ đảo dòng).
    - Phần 50% được hoàn = `refundVnd − extraPersonRefundVnd − roomChangeDifferenceVnd` (có thể thêm `refundablePaidVnd` để Desk khỏi tự trừ).
    - `refundCapped ⇔ refundVnd < refundableVnd + extraPersonRefundVnd + extraPersonReversedVnd + roomChangeDifferenceVnd + roomChangeDifferenceReversedVnd` (giá trị không đổi).
    - Đổi cả audit `after.roomChangeDifferenceVnd` cho cùng nghĩa.
    - BE-A sửa khoảng 6 dòng ở 1689-1737 và thêm 1 test có chênh lệch bị trần (hiện chưa test nào có chênh lệch + trần).
  - **Phương án B (nếu ARC không muốn đổi hợp đồng ở 0.3.9)**:
    - giữ server như hiện tại;
    - UXD đổi nhãn dòng 6 thành "Chênh lệch đổi phòng của các đêm bỏ (đã đảo)" và bỏ chữ "đã thu – hoàn đủ";
    - khi `refundCapped`, chỉ hiện tổng `refundVnd` và dòng phụ `refund_capped`;
    - làm A ở v1.1.
- Trạng thái: Open

### FB-R3-BE-B-BE-A-02
- Mức độ: Minor
- Vị trí: `modules/frontdesk/internal/stay.service.ts:1670` (`description: \`early_departure ${refund.noticeDays}d\``), `:1677` (`labelParams.noticeDays`), `:1790` (audit `reason`); `modules/folio/public/line-labels.ts:118-123`
- Vấn đề:
  - Khi lượt ở chỉ bỏ đêm OTA, `directNetVnd = 0`, nên `refund.noticeDays` giữ giá trị khởi tạo 0.
  - Dòng `early_departure_fee` (`chargeCode: ota_retained`) vì vậy mang `0d`. `line-labels` render thành "Phí trả phòng sớm (báo trước 0 ngày)" / "Early departure fee (0 days' notice)" trên bill in cho khách.
  - Trong khi đó phản hồi 0.3.9 trả `noticeDays` thật (ví dụ 2). Audit `reason` cũng ghi `BR-428 notice 0d`.
  - Lỗi có từ trước v1.0.1 (BE-A đã nêu ở mục 3.4), không phải hồi quy, không sai tiền.
- Vì sao quan trọng:
  - Khách đã báo trước nhiều ngày lại thấy "báo trước 0 ngày" trên bill. Dễ hiểu nhầm là khách bị phạt vì báo muộn.
  - Với đơn OTA, số OTA giữ lại theo chính sách OTA, không theo số ngày báo của OTTIMO.
- Đề xuất sửa (DOM chốt cách hiện):
  - dòng OTA: bỏ hẳn số ngày (`description: 'early_departure'`, không có `labelParams.noticeDays`), bill hiện "Early departure fee";
  - dòng trực tiếp: giữ `refund.noticeDays` (bằng `shownNoticeDays` khi có đêm trực tiếp);
  - audit `reason`: dùng `shownNoticeDays`;
  - không cần migration: dòng cũ giữ nguyên (BR-008), chỉ áp cho dòng mới.
- Trạng thái: Open

### FB-R3-BE-B-BE-A-03
- Mức độ: Minor
- Vị trí: `db/database.ts:220-231` (`SIMULATION_FORBIDDEN`, `db: inner.db` trong `makeSimulationTx`)
- Vấn đề: còn hai đường mà bộ lọc lệnh của `simulate` không che.
  - (a) `tx.db` (drizzle) được trao nguyên trên `tx` của simulate.
    - Hôm nay không module nào dùng `tx.db` (đã grep toàn `src/`).
    - Nhưng không có gì ngăn một use case sau này dùng nó, trong khi hợp đồng ADR-015 dựa vào "mọi lệnh qua `tx.query`".
    - Chốt DB chỉ chặn COMMIT, không chặn các lệnh khác.
  - (b) Regex không chặn `pg_advisory_lock`/`pg_try_advisory_lock` mức **session**.
    - Đây là thứ duy nhất **sống qua ROLLBACK**: kết nối trả về pool vẫn giữ khóa.
    - `SET`/`set_config(..., false)` thì không cần lo: Postgres hoàn lại SET trong giao dịch bị rollback.
- Vì sao quan trọng: ADR-015 cam kết "tính thử không để lại gì". Hai đường trên là chỗ duy nhất một thay đổi về sau có thể phá cam kết đó mà không test nào bắt được.
- Đề xuất sửa:
  - (a) trong `makeSimulationTx`, thay `db` bằng getter `throw new Error('tx.db is not allowed inside a simulation (ADR-015)')`; hoặc thêm test kiến trúc cấm `tx.db` trong `src/modules/**`;
  - (b) thêm `pg_(try_)?advisory_lock(_shared)?\s*\(` (bản không có `xact`) vào danh sách cấm, kèm 1 test đơn vị trong `be-a-v101-units.test.ts`.
- Trạng thái: Open

### FB-R3-BE-B-BE-A-04
- Mức độ: Minor
- Vị trí: `test/integration/b16-preview-v101.test.ts` (các ca `cleanPreview`)
- Vấn đề: ảnh chụp "không để lại gì" chưa phủ hai nhánh folio có ghi chứng từ.
  - (a) Đơn OTA trả trước với `otaRetainedVnd > 0`:
    - `postLines(early_departure_fee)` gọi `syncOtaCollect` **lần hai**;
    - lần này đảo phiếu thu OTA và cấp thêm mã phiếu `payment` từ `doc_sequence` (`folio.service.ts:1864/1881`);
    - ca BR-428-06 chỉ dùng `otaRetainedVnd: 0` hoặc thiếu.
  - (b) `reverseLine` dòng `room_change_difference` cộng với trần số dư. BE-A đã tự nêu ở mục 6 (thẻ 03 c).
  - Ngoài ra chưa có test phân bổ BR-428 khi bị trần mà có cả ba thành phần (phụ thu người + chênh lệch + 50%).
- Vì sao quan trọng:
  - Đây là hai nhánh duy nhất trên đường B16 cấp mã chứng từ khách thấy (mã phiếu thu).
  - Chúng cũng là nhánh có thẻ 01.
  - Phân tích tĩnh cho thấy rollback trả lại số (bảng), nhưng nên có test giữ điều đó.
- Đề xuất sửa: thêm hai ca `cleanPreview`, so ảnh chụp đủ 72 bảng (gồm `doc_sequence`, `payment`):
  - (a) Agoda trả trước, `otaRetainedVnd = otaRetainedMaxVnd / 2`;
  - (b) OTA có B14 `room_change_difference` đã thu một phần, rời sớm, bị trần.
  - Assert lần ghi ra cùng số và phân bổ theo thứ tự BR-428.
- Trạng thái: Open

### FB-R3-BE-B-BE-A-05
- Mức độ: Suggestion
- Vị trí: `shared/http/unit-of-work.ts` (`SIMULATE_*_TIMEOUT_MS`); `platform/public/doc-number.service.ts:78-91`
- Vấn đề:
  - Trong lúc chạy, tính thử giữ cùng bộ khóa với lần ghi: đơn, đơn con, căn, folio.
  - Với đơn OTA trả trước, nó còn giữ khóa dòng `doc_sequence` (loại `payment`, **toàn property**) tới ROLLBACK.
  - Nếu Desk gọi tính thử mỗi lần đổi ô và chưa có giới hạn tần suất (SEC thẻ 04 b), một lần thu tiền ở quầy khác có thể phải chờ khóa này, hoặc tính thử nhận 409 `CONCURRENT_UPDATE`.
  - Chỉ có `statement_timeout` theo câu lệnh, không có trần cho cả giao dịch.
- Vì sao quan trọng: tranh chấp khóa trên bộ đếm phiếu thu ảnh hưởng mọi thao tác thu tiền của property. Ở 10 căn thì rủi ro thấp, nhưng nên chặn từ đầu.
- Đề xuất sửa:
  - FE-A chỉ gọi tính thử khi rời ô hoặc bấm "Tính lại", debounce ≥ 400 ms;
  - `Database.simulate` thêm `SET LOCAL idle_in_transaction_session_timeout = '5s'`;
  - v1.1 làm giới hạn tần suất (SEC 04 b).
- Trạng thái: Open

### FB-R3-BE-B-BE-A-06
- Mức độ: Suggestion
- Vị trí: `openapi.yaml` 0.3.9 `earlyDeparture` (`expectedFeeVnd`); `stay.service.ts:1418-1421`, `:1693-1698`
- Vấn đề:
  - Lần tính thử đầu của đơn OTA không có `otaRetainedVnd`, nên phần OTA tính 0. `earlyDepartureFeeVnd` ở lần này chưa phải số sẽ ghi.
  - Nếu Desk gửi `expectedFeeVnd` lấy từ lần này cùng `otaRetainedVnd` > 0, lần ghi **luôn** 409.
  - Server làm đúng; chỉ là luồng này chưa được viết ra.
- Vì sao quan trọng: lễ tân gặp 409 lặp lại mà không hiểu lý do.
- Đề xuất sửa:
  - ARC ghi một câu vào mô tả `expectedFeeVnd`: "lấy từ lần tính thử có cùng `otaRetainedVnd`; `otaRetainedRequired = true` thì chưa được ghi";
  - FE-A gọi lại tính thử sau khi nhập số OTA giữ lại.
- Trạng thái: Open

---

## Câu cần DOM / ARC chốt

1. **DOM (BR-428, thẻ 01)**:
   - Khi số dư thừa không đủ, "chênh lệch đổi phòng hoàn 100%" trên màn hình và trong yêu cầu hoàn là phần **được hoàn sau trần** (phân bổ phụ thu người → chênh lệch → 50%)? Hay là toàn bộ chênh lệch đã đảo?
   - BE-B đề xuất: **sau trần**, kèm cặp "đã đảo, không hoàn", giống phụ thu người.
2. **ARC (hợp đồng, thẻ 01)**: chọn A hay B.
   - A: đổi nghĩa `roomChangeDifferenceVnd` và thêm `roomChangeDifferenceReversedVnd` ngay trong 0.3.9/v1.0.1. BE-B đề xuất A vì trường mới chưa client nào dùng.
   - B: giữ nguyên, UXD đổi nhãn, làm A ở v1.1.
3. **DOM (thẻ 02)**: dòng phí trả sớm của đơn OTA trên bill có hiện số ngày báo trước không?
   - BE-B đề xuất **không** (số OTA giữ lại theo OTA).
   - Dòng trực tiếp giữ "báo trước N ngày".
4. **ARC (thẻ 06)**: thêm câu ràng buộc `expectedFeeVnd` ↔ `otaRetainedVnd` vào mô tả hợp đồng.

## Kết quả chạy test (BE-B, 27/10)

- DB: Postgres 17 của compose `ottimo-esc031`, **DB riêng `ottimo_test_beb101r`**.
  - Tạo bằng `infra/postgres/init` (extension + `02-roles.sh` với `OTTIMO_DATABASES`).
  - Không dùng `ottimo_test` hay `ottimo_test_bea101`.
  - Mật khẩu đọc từ biến môi trường của container, không in ra.
- Chạy `vitest` trong worktree của BE-A, không sửa file nào.
- 3 file mới:
  - `b16-preview-v101.test.ts`, `rooms-scheduled-prices-v101.test.ts`, `be-a-v101-units.test.ts`;
  - **48/48 pass**.
- 8 file hồi quy B16/folio:
  - `frontdesk-rules`, `frontdesk-stay`, `rbac-sprint3-bea`, `frontdesk-s3-fixes`, `foc-resync`, `ota-prepaid-flow`, `a7-lease-nights`, `folio-payments`;
  - **322/322 pass**.
- Không chạy lại toàn bộ 137 file (BE-A đã chạy). Không chạy lint/tsc.

## Điểm làm tốt (nên giữ)

- Tính thử chạy **chính hàm ghi** trong giao dịch luôn rollback, có chốt ở tầng DB (`simulation_guard` + trigger hoãn). Nhờ vậy số tính thử bằng số ghi ngay từ cách dựng, không phải duy trì hai công thức.
- Test "không để lại gì" so md5 toàn bộ bảng của tenant, có kiểm SSE, và tự chứng minh không mù (sau lần ghi thật thì ảnh chụp đổi). Đây là mẫu tốt cho mọi `dryRun` sau này.
- `AMOUNT_CHANGED` đặt đúng chỗ, dùng `throw` (rollback cả khóa idempotency), có test dùng lại cùng khóa thành công và audit `previewConfirmed`.
