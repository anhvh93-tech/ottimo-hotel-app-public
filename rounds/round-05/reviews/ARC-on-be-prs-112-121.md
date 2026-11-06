# ARC review PR #121 (BE-C PR-C1: V5-1A, V5-44 (b)) và PR #112 (BE-B PR-B1: V5-13, V5-18, V5-44 (a))

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR:
  - **#121**, nhánh `r5-c1`:
    - ARC đọc mã ở **`452e8b01`**. CI của SHA này xanh (run 42263879947);
    - trong lúc review, BE-C đẩy hai commit gộp `main`, không rebase: `e06afa5a` (gộp `main` @ `dc0c5038`) và **`6d412a7b`** (gộp `main` @ `16ea5183`);
    - `git show --cc 6d412a7b`: commit này chỉ gỡ một xung đột, ở `tests/fixtures/br-examples.json` (chuỗi `owner` và `retiredIn` của BR-101-16 → `0.5.16`). `git diff e06afa5a 6d412a7b -- product/services product/apps product/docs/api`: chỉ đổi `br-examples.json` (dòng QA từ `main`);
    - sau khi ARC commit tệp này, BE-C đẩy **`089dbe99`** (SEC FB-R5-SEC-BE-C1-01): một dòng `warn` `list_price_append_only_refused requestId=<id>` khi 0094 từ chối, vẫn 409 `effective`. ARC đọc phần chênh `6d412a7b..089dbe99` (2 tệp: `rooms.service.ts` thêm `Logger` và một dòng log; test đơn vị kiểm đúng một dòng, không có id căn, giá, ngày). Đúng điều ARC đồng ý ở mục 1.5;
    - **SHA cuối ARC duyệt: `089dbe99`**. CI của SHA này đang chạy lúc viết.
  - **#112**, nhánh `r5-b1`:
    - ARC đọc mã ở **`a2378981`**. CI của SHA này xanh (run 42256869962);
    - BE-B gộp `main` @ `999057ce` thành **`f16d7e09`**. Hai tệp gỡ xung đột (`folio-lines.service.ts`, `folio.service.ts`, chỉ phần import) cho ra blob **trùng từng byte** với bản ARC gộp thử (`31d43c59`, `2dcb743c`). `git diff <bản gộp thử của ARC> f16d7e09 -- product/services product/apps` rỗng: mã ARC đã chạy test là mã của `f16d7e09`;
    - sau khi ARC commit tệp này, BE-B đẩy **`7f4aaf44`** (SEC FB-R5-SEC-BE-B1-01): chỉ thêm test, một tệp (`pr-b1-v5-13-18-44.test.ts`, ca HTTP CTV/SAL/FD đọc folio, đơn và tóm tắt). Không đổi mã;
    - **SHA cuối ARC duyệt: `7f4aaf44`**. CI của SHA này đang chạy lúc viết.
  - Hai PR không có migration, không đổi `openapi.yaml`.
- Đã đọc:
  - hợp đồng trên `main`: `contract-0.3.13.md` mục 1.2 (T13), 1.6 (T18), 1.8 (T1A), 1.11 (T44), 1.24 (BE 11, 13, 14, 15, 19), 1.25, 1.26 và mục 2; `openapi.yaml` `createRoom`, `updateRoom`, `cancelScheduledRoomListPrice`, `RoomInput`/`RoomPatch`, `Problem.lockReason`, `Reservation.depositUnverifiedVnd`, `CheckoutSummary.openRefunds`, `OpenRefund`, `Folio.totals.openRefunds`, bảng "Mã lỗi theo trường";
  - `rounds/round-05/plan.md` mục 4a (T1–T11), các dòng 07/11 trong `01-decisions/decision-log.md`, `product/docs/release-notes.md` (v1.0.5 "Dự kiến có");
  - mã có sẵn liên quan: `payments.service.ts` (bút toán đảo), migration `0040` (`payment_refund_approval_check`), `0094` (`room_list_price_append_only`), `ops-check.sh` `check_pricegap`, `UnitOfWork`;
  - review đã có trên `main`, đọc để không lặp thẻ: DOM `DOM-on-prs-112-121-122.md`, SEC `SEC-on-be-prs-112-121.md`.
- Đã chạy. Mọi thứ trong scratchpad của ARC: worktree tách rời, PostgreSQL 17 tạm (image CI cùng digest, mật khẩu CI-only của `ci.yml`, cổng riêng chỉ mở ở `127.0.0.1`). Không chạm staging hay production. Container và worktree đã xóa sau review.
  - Gộp thử:
    - `452e8b01` + `main` @ `1ab71583`: một xung đột ở `br-examples.json`, gỡ đúng như BE-C gỡ sau đó ở `6d412a7b`;
    - `a2378981` + `main` @ `1ab71583`: xung đột import ở hai tệp, giữ cả hai dòng (như `f16d7e09`).
  - Bộ test API đầy đủ trên hai bản gộp thử, chạy song song lúc máy đang tải nặng (load average ≈ 50 trên 10 lõi, các vai khác cũng chạy test):
    - #121: `reversal-debt-g4` (2 ca), `s438-r8/r8ver-01` (3 ca) đỏ, đều chạm mốc 30 giây hoặc chờ khóa;
    - #112: `move-pricing` (2), `b16-preview-v101` (1), `reversal-debt-g4` (8), `minibar-m1` (8) đỏ, cùng kiểu.
    - ARC dừng hai lượt chạy đầy đủ, chạy lại riêng từng nhóm tệp đỏ, mỗi lần một bộ: #121 **2 tệp, 32/32 đạt**; #112 **4 tệp, 124/124 đạt**. Lỗi lần đầu do máy quá tải, không do PR. CI của SHA cuối vẫn là bằng chứng cuối.
  - Đột biến (mục 1.3, 2.3).
  - Thử gộp từng PR với mọi nhánh team đang mở (`git merge-tree`, mục 3).

## 0. Kết luận

| PR | SHA cuối | Kết luận | Gộp khi |
|---|---|---|---|
| #121 | `089dbe99` (mã đọc ở `452e8b01` + phần chênh `089dbe99`) | **DUYỆT CÓ ĐIỀU KIỆN** | ĐK-1: CI xanh ở `089dbe99`. Nếu cần gộp `main` thêm lần nữa: commit gộp chỉ gỡ xung đột ở tài liệu hoặc `br-examples.json` thì duyệt này áp cho HEAD mới |
| #112 | `7f4aaf44` (mã đọc ở `a2378981`; `f16d7e09` gộp `main`, `7f4aaf44` chỉ thêm test) | **DUYỆT CÓ ĐIỀU KIỆN** | ĐK-2: CI xanh ở `7f4aaf44`, cùng quy tắc HEAD mới như trên. Gộp **trước** #110 hoặc sau đều được: #110 phải gộp `main` vì xung đột với chính `main` (mục 3) |

Không điều kiện nào là lỗi mã. Cả hai PR đúng hợp đồng 0.3.13 ở mọi ca T1A, T13, T18, T44 mà PR nhận. Mỗi đột biến không tương đương đều bị bắt, trừ một (B12, thẻ ARC-BE-B1-02).

Thẻ:
- #121: **0 Blocker · 0 Major · 0 Minor · 1 Suggestion** (ARC-BE-C1-01).
- #112: **0 Blocker · 0 Major · 1 Minor · 1 Suggestion** (ARC-BE-B1-01, ARC-BE-B1-02).
- Bảng kiểm cắt bản: **1 Minor** cho PO (ARC-PO-112-01, thêm hai dòng mục 4a).
- Không thẻ nào chặn gộp. ESC mới: **không**.

---

## 1. PR #121 – V5-1A (giá đêm bắt buộc, `NIGHTLY_PRICE_UNUSUAL`, căn ngừng bán khi chưa có giá) và V5-44 (b) (trigger 0094 → 409)

### 1.1 Khớp hợp đồng

| Ca / điểm | Mã ở `452e8b01` | Bằng chứng |
|---|---|---|
| T1A-1 `updateRoom` thiếu giá đêm → 422 `REQUIRED`, giá không đổi | `roomPatch.listPrice.nightlyListPriceVnd: money` (bắt buộc), `platform.controller.ts` | Ca T1A-1 / BR-101-17 so giá, `version`, audit trước và sau; M1 đỏ 2 ca |
| T1A-2 `createRoom` thiếu giá đêm → 422, không có căn | `roomInput.nightlyListPriceVnd: money` | Ca T1A-2: không dòng `room`, không audit |
| T1A-3 giá đêm 0 → 422, không 500 | zod `money` = số nguyên 1…`MAX_SAFE_INTEGER` → `VALUE_OUT_OF_RANGE` | Hai ca T1A-3 (tạo, sửa). Mã lỗi khác mock Desk: thẻ ARC-BE-C1-01 |
| T1A-4 đủ hai giá → một dòng giá đúng cả hai số | `rooms.service.ts` tạo/sửa ghi một dòng `room_list_price` | Ca T1A-4 |
| T1A-5 bootstrap hoặc nhập danh mục không có giá → căn ngừng bán, `pricegap` tĩnh = 0 | `production-bootstrap.ts` ghi `is_sellable = false`; `room-catalog-import.ts`: đủ cả hai giá hoặc không giá nào; một giá, giá ≤ 0, `isSellable: true` mà không giá, hay khóa cũ `expectedNightlyListPriceVnd` → `RoomCatalogImportError`; không giá → `isSellable = false` | Test bootstrap đọc **câu SQL thật** của `ops-check.sh` (`test/helpers/pricegap-static.ts`), không chép câu. M6, M7, M11 đỏ |
| `NIGHTLY_PRICE_UNUSUAL` (BR-101 (4), bổ sung 1d): giá đêm × 30 < giá tháng hoặc giá đêm × 5 > giá tháng; đúng biên không cảnh báo | `platform/public/list-price-check.ts`, so bằng `BigInt`; số không an toàn → `RangeError`. Zod đã chặn ở `MAX_SAFE_INTEGER` nên từ HTTP không tới được nhánh này | Test đơn vị hai biên và đúng biên; M3, M4 đỏ |
| Cảnh báo không chặn, trả trong `warnings[]` của 200 | tạo: `{...dto, warnings}`; sửa: `warnings.push(...)` | M8, M9 đỏ |
| T44-3 trigger 0094 từ chối → 409 `INVALID_TRANSITION`, `currentState = effective` | `SAVEPOINT cancel_list_price` → `DELETE` → `RELEASE`. Bắt lỗi thì `ROLLBACK TO SAVEPOINT` rồi ném problem | M2, M10 đỏ |
| T44-4 `check_violation` khác → vẫn 500 | `isAppliedPriceRefusal`: SQLSTATE `23514` **và** tiền tố câu của trigger | Test đơn vị với lỗi giả; M5 đỏ |
| BE 15: bỏ đường tạm ÷ 12 | Gỡ `nightFromMonthly` và `ParameterService` khỏi `rooms.service.ts`; `validate-fixtures.mjs` bỏ ÷ 12; BR-101-16 vào `retiredIds`; DS-E dùng `nightlyListPriceVnd`; TC-NT-018 gửi đủ hai giá | Đọc diff; `br-examples` hợp lệ trong CI |

### 1.2 Giao dịch, khóa, idempotency, mã lỗi, phân quyền

- **Giao dịch:** mọi thứ trong giao dịch của `UnitOfWork`. SAVEPOINT giữ giao dịch dùng được sau lỗi của trigger, đúng BE 19. Problem ném ra làm `UnitOfWork` rollback cả lệnh, gồm khóa idempotency, nên gửi lại sau đó vẫn được.
- **Khóa:** không thêm khóa. Đường hủy giá đã lên lịch giữ thứ tự khóa cũ.
- **Idempotency:** không đổi. `warnings[]` là một phần thân 200 đã lưu, nên lệnh gửi lại nhận đúng cảnh báo cũ.
- **Problem:** 422 chỉ có `errors[{field, code}]`. `field` là `listPrice.nightlyListPriceVnd` ở `updateRoom`, `nightlyListPriceVnd` ở `createRoom`, đúng hình hai thân lệnh.
- **Phân quyền:** không đổi `x-roles` hay `x-write-roles` (ba thao tác vốn chỉ OWN/MGR). Không trường mới cần `x-visible-to`.
- **Migration:** không. 0094 giữ nguyên.

### 1.3 Đột biến

11 đột biến, chạy 3 tệp test của PR (`v5-1a-room-prices-units`, `v5-1a-nightly-price`, `production-bootstrap`). Tất cả bị bắt:

| # | Đột biến | Ca đỏ |
|---|---|---|
| M1 | Giá đêm tùy chọn lại ở `roomInput` và `roomPatch` | 2 |
| M2 | Bỏ ánh xạ lỗi 0094 | 2 |
| M3 | Biên trên ÷ 3 (giả định cũ của ARC) | 3 |
| M4 | Đúng biên cũng cảnh báo | 3 |
| M5 | Không kiểm SQLSTATE | 2 |
| M6 | Bootstrap tạo căn đang bán | 1 (lần đầu 0 vì DB bootstrap không rỗng nên test tự bỏ qua; ARC tạo lại DB rỗng rồi chạy lại) |
| M7 | Nhập danh mục không giá vẫn bán | 1 |
| M8 | Tạo căn không trả cảnh báo | 1 |
| M9 | Sửa giá không trả cảnh báo | 2 |
| M10 | Bỏ `ROLLBACK TO SAVEPOINT` | 1 |
| M11 | Nhập danh mục nhận một giá | 5 |

### 1.4 Thẻ

#### FB-R5-ARC-BE-C1-01
- Mức độ: Suggestion
- Người nhận: FE-A (mock, cùng PR V5-5C); ARC (chữ 0.3.14)
- Vị trí: `apps/admin-web/src/mocks/handlers.ts` (dòng 914 và 919 ở `452e8b01`), nhánh giá căn ≤ 0
- Vấn đề:
  - Mock trả `AMOUNT_NOT_POSITIVE` cho giá tháng hoặc giá đêm ≤ 0.
  - Máy chủ trả `VALUE_OUT_OF_RANGE` (zod `money` min 1, giống giá tháng từ R3), và test T1A-3 khóa mã này.
  - Bảng "Mã lỗi theo trường" của `openapi.yaml` ghi chung "`AMOUNT_NOT_POSITIVE` – ô giá ≤ 0", nên người đọc hợp đồng dễ theo mock.
- Vì sao quan trọng: Desk chạy test trên mock. Câu báo theo mã ở mock sẽ không hiện khi gặp máy chủ thật. Rủi ro thấp vì Desk đã chặn giá ≤ 0 trước khi gửi.
- Đề xuất sửa:
  - ARC chốt **giữ mã máy chủ** (`VALUE_OUT_OF_RANGE`, cùng mã với giá tháng đang chạy). Không đổi mã đang có.
  - FE-A sửa hai dòng mock trong PR V5-5C. PR đó sửa đúng khối này để thêm biên trên.
  - ARC thêm câu vào mô tả `createRoom`/`updateRoom` ở 0.3.14: "giá ≤ 0 → `VALUE_OUT_OF_RANGE` (min 1)".
- Trạng thái: Open

### 1.5 ARC trả lời thẻ của vai khác về #121

- **FB-R5-DOM-FE-121-01** (Minor, Desk chưa có biên trên): PO đã đưa vào v1.0.5 thành V5-5C (quyết định 27, mục 4a T10). ARC đồng ý. Mã cảnh báo đã có ở máy chủ; Desk chỉ cần đọc `warnings[]` và dùng khóa UXD 9.3 `rooms.night_high`.
- **FB-R5-DOM-BE-121-02** (Suggestion 0.3.14, chặn bật bán căn chưa có giá): đồng ý. ARC ghi vào danh sách 0.3.14: `updateRoom` với `isSellable = true` cho căn chưa có dòng giá niêm yết → 422 (`field` = `isSellable`, `code` = `NOT_ALLOWED`). Không migration. Tới đó, `ops-check` `pricegap` vẫn là lưới bắt.
- **FB-R5-SEC-BE-C1-01** (Suggestion, log khi trigger 0094 ra tay): đồng ý. Lớp chặn cuối từ chối nghĩa là lớp trước đã sai (đồng hồ lệch, luật ngày bị sửa). Một dòng `warn` chỉ có mã và `requestId` là đủ. Không đổi hợp đồng. BE-C đã làm ở `089dbe99`.
- Chữ 1.24 của `contract-0.3.13.md` ("> giá tháng ÷ 3 [GIẢ ĐỊNH]") đã bị bổ sung 1d thay bằng ÷ 5. ARC sửa câu cũ ở bản hợp đồng tới. Không ảnh hưởng mã.

### 1.6 Điểm làm tốt

- So biên bằng `BigInt`, không chia, nên không lệch do làm tròn. Đúng biên không cảnh báo, đúng chữ DOM.
- Test bootstrap đọc chính câu SQL `pricegap` của `ops-check.sh`, nên `ops-check` đổi câu thì test đổi theo.
- Ánh xạ lỗi 0094 hẹp: phải đúng mã **và** đúng tiền tố câu. Lỗi khác vẫn là 500, nên không che lỗi thật.
- Nhập danh mục từ chối khóa cũ `expectedNightlyListPriceVnd` bằng lỗi rõ, không lặng lẽ bỏ qua.

---

## 2. PR #112 – V5-13 `openRefunds`, V5-18 `depositUnverifiedVnd`, V5-44 (a) `lockReason`

### 2.1 Khớp hợp đồng

| Ca / điểm | Mã ở `a2378981` | Bằng chứng |
|---|---|---|
| T44-1: mọi `409 FOLIO_LOCKED` có `lockReason` (`closed`, `settled`, `post_checkout_window_over`, `debt_reduction_requires_write_off`, `invoice_issued`) | Một hàm `folioLocked(reason, detail?)` ở `folio/public/folio-locked.ts`. `lockForPosting` trả `post_checkout_window_over` khi folio `settled` và người gọi ghi phí sau trả phòng; còn lại theo `lockReasonOfStatus` | Test kiến trúc: không `problem('FOLIO_LOCKED')` nào ngoài tệp này. Enum bằng `Problem.lockReason` của OpenAPI. 5 ca HTTP, mỗi lý do một ca. B1, B2, B3, B14, B16 đỏ |
| BE 11: thu nợ trên folio còn **mở** → 409 `INVALID_TRANSITION`, `currentState = open`, không ghi gì | `payment.service.ts`, kiểm trước mọi lệnh ghi | Ca BE 11; B4 đỏ |
| T13-1, T13-5: tóm tắt Trả phòng và folio có dòng theo lý do; Σ `openVnd` = `creditVnd` − `unhandledCreditVnd` khi có dư (BE 14: = min(`creditVnd`, Σ `openVnd`)) | `openRefundsByReason`: một câu `GROUP BY reason_code HAVING SUM(amount_vnd − refunded_vnd) > 0`, trạng thái `pending`, `escalated`, `approved`; **cùng danh sách** cho `totals.openRefunds`, `CheckoutSummary.openRefunds` và `unhandledCreditVnd` | Ca HTTP T13-1/T13-5, test đơn vị BE 14. B5, B6, B7, B8, B13 đỏ. Thẻ ARC-BE-B1-01 về người đọc |
| T13-2, T13-3: chi một phần → phần còn lại; chi đủ → không dòng | `amount_vnd − refunded_vnd`, `HAVING > 0` | Ca HTTP; B6 đỏ |
| T13-4 / T18-3: SAL, CTV không có trường | `x-visible-to` FD+ ở schema, serializer sinh | Test đơn vị serializer. SEC FB-R5-SEC-BE-B1-01 đề nghị thêm ca HTTP – ARC đồng ý |
| T18-1, T18-2: cọc chờ đối soát; đối soát xong → 0 | `payments/public/deposit-unverified.ts`: Σ cọc `succeeded`, `reconciliation = pending` | Ca HTTP; B9, B15 đỏ |
| T18-4: trần `depositPaidVnd`, không âm | `max(0, min(depositPaidVnd, Σ))` | Test đơn vị; B10 đỏ |
| `reasonCode` = mọi mã lý do của yêu cầu hoàn (BE 14) | Đọc thẳng `approval_request.reason_code` | Danh sách mã cho UXD: DOM FB-R5-DOM-UXD-112-01 |

### 2.2 Giao dịch, khóa, idempotency, mã lỗi, phân quyền

- **Giao dịch:** hai câu đọc mới chạy trong giao dịch của người gọi. `balance()` đọc dưới khóa folio nếu người gọi đã giữ khóa. Không lệnh ghi mới.
- **Khóa:** không thêm khóa, không đổi thứ tự khóa. Danh sách riêng `openRefunds` (có tùy chọn `FOR UPDATE`, dùng khi phân bổ tiền hoàn) giữ nguyên.
- **Hai câu đọc cho cùng một số:**
  - câu theo lý do lấy Σ theo nhóm `HAVING > 0`;
  - câu riêng lấy từng dòng `refunded_vnd < amount_vnd`.
  - Hai tổng bằng nhau vì `refunded_vnd` không vượt `amount_vnd` (CHECK 0040). Đây là điều BE 14 cần.
- **Idempotency:** lệnh thu nợ trên folio mở bị từ chối trong `UnitOfWork`, trước khi ghi. Khóa idempotency rollback theo, nên sau khi folio sang `settled` có thể gửi lại.
- **Problem:** `lockReason` là trường mở rộng cấp đầu của `Problem`. `detail` chỉ có khi truyền vào (hai chỗ ở `folio-lines.service.ts`, giữ câu cũ: cửa sổ sau trả phòng và giảm nợ quá cửa sổ BR-525; câu tiếng Anh, không có số tiền hay tên). Desk đọc `lockReason`, không đọc `detail` (T44-2).
- **Phân quyền:** `openRefunds` và `depositUnverifiedVnd` theo `x-visible-to` FD+; `getCheckoutSummary` vốn chỉ FD+. Không đổi `x-roles`.
- **Migration:** không.

### 2.3 Đột biến

16 đột biến, chạy 2 tệp test của PR (`pr-b1-units`, `pr-b1-v5-13-18-44`, 22 ca):

| # | Đột biến | Ca đỏ |
|---|---|---|
| B1 | `lockForPosting` không bao giờ trả `post_checkout_window_over` | 1 |
| B2 | Cửa sổ ở `folio-lines` → `settled` | 1 |
| B3 | `invoice_issued` → `closed` | 1 |
| B4 | Thu nợ trên folio mở → `FOLIO_LOCKED` | 1 |
| B5 | Bỏ trạng thái `approved` | 1 |
| B6 | Bỏ `HAVING` | 1 |
| B7 | `totals.openRefunds` rỗng | 3 |
| B8 | Tóm tắt Trả phòng `openRefunds` rỗng | 1 |
| B9 | Bỏ điều kiện `reconciliation = pending` | 1 |
| B10 | Bỏ trần `depositPaidVnd` | 1 |
| B11 | Bỏ điều kiện `reversal_of_id IS NULL` | **0 – tương đương**: dòng đảo có `reconciliation = not_required` và dòng gốc sang `reversed` (`payments.service.ts`, đảo bút toán), nên hai điều kiện kia đã loại. Giữ điều kiện như lớp phòng thủ |
| B12 | Chỉ lấy đơn chính của folio, bỏ đơn con theo dòng | **0** – chạy thêm 5 tệp rộng hơn (`payments-s3`, `ota-prepaid-flow`, `folio-payments`, `close-stay-dom-s4`, `move-pricing`; 101 ca): vẫn 0. Thẻ ARC-BE-B1-02 |
| B13 | `sumOpenRefunds` trả 0 | 3 |
| B14 | `lockReasonOfStatus` luôn `settled` | 2 |
| B15 | DTO bỏ `depositUnverifiedVnd` | 1 |
| B16 | `debt_reduction_requires_write_off` → `settled` | 1 |

### 2.4 Thẻ

#### FB-R5-ARC-BE-B1-01
- Mức độ: Minor
- Người nhận: BE-B (cùng PR test với SEC B1-01, hoặc commit nhỏ trước tag)
- Vị trí: `test/integration/pr-b1-v5-13-18-44.test.ts`, ca "T13-1, T13-5: FD makes the B16 refund, the lead and MGR read the summary"
- Vấn đề:
  - Hợp đồng T13-1 ghi "**FD-2** đọc tóm tắt, yêu cầu hoàn `pending` do FD-1 tạo". Đây đúng là ca QA TC-V104-CO-01b, lý do có V5-13: ở v1.0.4, FD khác người tạo không thấy dòng "Đang chờ hoàn".
  - Test cho FDL và MGR đọc. Hai vai này vốn thấy mọi yêu cầu. Lỗi cũ là lỗi phạm vi "M" của FD, nên test không bắt được nếu ai đó lọc theo người tạo.
- Vì sao quan trọng: mã hiện nay đúng (câu SQL không lọc theo người gọi). Nhưng ca duy nhất chứng minh mục tiêu của V5-13 lại không có trong test.
- Đề xuất sửa: thêm `fd2: ['front_desk']` vào `createTenant`, cho `fd2` đọc tóm tắt Trả phòng và folio, mong đợi dòng `early_departure` với `openVnd` đúng. Khoảng 10 dòng. Không chặn gộp #112.
- Trạng thái: Open

#### FB-R5-ARC-BE-B1-02
- Mức độ: Suggestion
- Người nhận: BE-B (v1.0.6, hoặc cùng PR-B3 nếu chạm `folio.service.ts`)
- Vị trí: `folio.service.ts`: `openRefundsByReason` (dòng ~1125), `openRefunds` riêng (~1147), `stayReservationIds` (~3378)
- Vấn đề:
  - Tập đơn của một folio (đơn chính + `reservation_id` của các dòng) được tính ở ba chỗ, mỗi chỗ một vòng lặp.
  - Đột biến B12 (chỉ lấy đơn chính) không bị test nào bắt, kể cả 5 tệp rộng hơn.
  - Ca có yêu cầu hoàn gắn với đơn con (gia hạn B13, hủy đơn con) vì vậy chưa được kiểm. Ở ca này `unhandledCreditVnd` và `openRefunds` cùng sai nếu tập đơn sai.
- Vì sao quan trọng: từ #112, `unhandledCreditVnd` (E15-05, chặn Hoàn tất khi còn tiền dư chưa xử lý) đọc từ `openRefundsByReason`. Sai tập đơn thì Desk báo "còn dư chưa xử lý" cho tiền đã có yêu cầu hoàn.
- Đề xuất sửa: một hàm riêng `folioReservationIds(tx, folioId, lines?)` cho cả ba chỗ, và một ca: đơn có đơn con gia hạn, yêu cầu hoàn trên đơn con → có trong `openRefunds`, Σ khớp `unhandledCreditVnd`.
- Trạng thái: Open

#### FB-R5-ARC-PO-112-01
- Mức độ: Minor
- Người nhận: PO (bảng kiểm cắt bản `plan.md` mục 4a); ORC biết
- Vị trí: `rounds/round-05/plan.md` mục 4a; `product/docs/release-notes.md` v1.0.5 "Dự kiến có", dòng **Trả phòng và tiền ở quầy**
- Vấn đề:
  - #112 chỉ là phần máy chủ. Desk hiện chưa đọc `openRefunds`, `depositUnverifiedVnd` hay `Problem.lockReason`: `admin-web/src` trên `main` không có hai chuỗi đầu, và chuỗi `lockReason` duy nhất (`StayDialogs.tsx`) là biến cục bộ của hộp thêm khách. Chưa có PR FE nào đang mở cho V5-13, V5-18, V5-44 (a).
  - Release notes đã hứa: "Trang Trả phòng và folio hiện tổng tiền đang chờ hoàn của đơn, kể cả yêu cầu người khác tạo" và phần cọc chưa đối soát.
  - Ngược lại, nếu Desk V5-44 đổi sang đọc `lockReason` mà lên tag thiếu #112, máy chủ không gửi trường đó và Desk mất câu giải thích trên hộp folio.
- Vì sao quan trọng: không có dòng kiểm thì dễ cắt tag với câu release notes sai, hoặc Desk đọc trường máy chủ chưa có.
- Đề xuất sửa: PO thêm hai dòng (số kế tiếp T10, T11 đã dùng):
  - **T12 – #112 + FE V5-13 + FE V5-18:** thiếu FE thì bỏ hai vế trên khỏi release notes, hoặc chuyển sang **Giới hạn đã biết** (CO-01b vẫn là giới hạn của v1.0.4).
  - **T13 – FE V5-44 (a) cần #112:** không gộp PR Desk đọc `lockReason` vào tag thiếu #112.
- Trạng thái: Open

### 2.5 ARC trả lời thẻ của vai khác về #112

- **FB-R5-DOM-UXD-112-01** (Suggestion, sáu nhóm nhãn tiền hoàn): đồng ý. Trong đó mọi `CancelReasonCode` và `no_show` gom thành "Hoàn khi hủy đơn", kèm bảng nghĩa `lockReason` ở DOM 2.2. ARC thêm vào mô tả `OpenRefund.reasonCode` ở 0.3.14: "giá trị = `approval_request.reason_code`, gồm mọi `CancelReasonCode`". UXD dùng bảng DOM làm khóa chữ.
- **FB-R5-SEC-BE-B1-01** (ca HTTP cho SAL/CTV): đồng ý; BE-B đã làm ở `7f4aaf44`. FB-R5-ARC-BE-B1-01 (người đọc FD-2) vẫn mở.
- **FB-R5-SEC-BE-B1-02** (gỡ xung đột ở nhánh gộp sau): đồng ý. Test kiến trúc của #112 là chốt chặn. Ai gỡ xung đột mà phải sửa test đó thì gửi ARC xem.

### 2.6 Điểm làm tốt

- Một hàm cho mọi `FOLIO_LOCKED`, có test kiến trúc. Lần sau thêm chỗ khóa folio không quên được `lockReason`.
- `unhandledCreditVnd` và `openRefunds` đọc từ cùng một danh sách. T13-5 đúng theo cách dựng, không phải nhờ hai câu tình cờ khớp.
- Đột biến bị bắt gần hết. Ca B11 tương đương được giải thích bằng cách đảo bút toán đang chạy, không phải bỏ qua.

---

## 3. Xung đột với PR khác (thử gộp `git merge-tree` với mọi nhánh team đang mở lúc 01:47)

- **#121 (`6d412a7b`):**
  - không xung đột với #97, #98, #99, #102, #105, #112, #113, #114, #116, #118, #119, #120, #122–#131;
  - với #110: `merge-tree` báo xung đột ở `folio-lines.service.ts`, tệp #121 không sửa. Lý do: #110 (`c71ae350`) xung đột với chính `main` hiện tại ở tệp này. #110 phải gộp `main` trước khi gộp, không liên quan #121.
- **#112 (`f16d7e09`):**
  - gộp sạch với `main` @ `cb778644`;
  - không xung đột với mọi nhánh trên trừ #110. #110 xung đột ở cùng tệp `folio-lines.service.ts`, phần import và chỗ ném lỗi khóa: xem SEC B1-02;
  - #105 và #119 cùng sửa `payment.service.ts`/`payments.service.ts`, tự gộp được (ARC đã gộp thử ở lượt trước).
- **#111** đã gộp (`ce404dd6`); hai PR đã có trong nền của commit gộp `main`.

---

## 4. Ghi chú cho ORC

- Thứ tự gộp: #121 và #112 độc lập. Gộp được ngay khi CI xanh ở SHA cuối.
- Sau khi #121 gộp: PO + DOM làm việc của dòng ĐK-6 và T11 (từ điển `night_from_month_divisor` "không còn được đọc từ v1.0.5"). Việc này đã có ở plan.
- Sau khi #112 gộp: #110 gộp `main` sẽ gặp xung đột ở `folio-lines.service.ts`. Người gỡ giữ `folioLocked(...)`; test kiến trúc `pr-b1-units` phải xanh mà không sửa test.
- Lượt chạy test đầy đủ song song trên máy chung cho kết quả đỏ giả do quá tải (≥ 30 giây). Lần sau, vai nào chạy bộ đầy đủ tại chỗ nên chạy một bộ mỗi lần, hoặc dựa vào CI.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #121 (BE-C PR-C1, V5-1A + V5-44 (b)) @ 089dbe99 và PR #112 (BE-B PR-B1, V5-13/V5-18/V5-44 (a)) @ 7f4aaf44: cả hai DUYỆT CÓ ĐIỀU KIỆN** (rounds/round-05/reviews/ARC-on-be-prs-112-121.md). Mã đọc ở 452e8b01 và a2378981; các commit gộp main sau đó chỉ gỡ xung đột ở br-examples.json và phần import, blob trùng bản gộp thử của ARC; 089dbe99 thêm một dòng warn khi 0094 từ chối (SEC C1-01), 7f4aaf44 chỉ thêm test HTTP theo vai (SEC B1-01). Điều kiện duy nhất: CI xanh ở SHA cuối. Đúng hợp đồng 0.3.13 ở mọi ca T1A-1…5, T44-1/3/4, T13-1…5, T18-1…4, BE 11/13/14/15/19. Đột biến: #121 11/11 bị bắt; #112 14/16 (B11 tương đương; B12 – bỏ đơn con khỏi tập đơn của folio – không test nào bắt, thẻ ARC-BE-B1-02). Không migration, không đổi openapi. Lỗi khi chạy bộ đầy đủ song song là do máy quá tải: chạy riêng các tệp đỏ thì 32/32 và 124/124 đạt. ARC chốt giữ VALUE_OUT_OF_RANGE cho giá căn ≤ 0, FE-A sửa mock ở V5-5C (ARC-BE-C1-01). Đồng ý DOM FE-121-01 (V5-5C), BE-121-02 (0.3.14: chặn isSellable = true khi căn chưa có giá), UXD-112-01 (sáu nhóm nhãn; ARC thêm mô tả OpenRefund.reasonCode ở 0.3.14), SEC C1-01 (log warn khi 0094 từ chối – đã làm ở 089dbe99), SEC B1-01 (đã làm ở 7f4aaf44)/B1-02. Thẻ mới: ARC-BE-B1-01 Minor (ca FD-2 đọc yêu cầu hoàn của FD-1 – đúng CO-01b), ARC-BE-B1-02 Suggestion, ARC-PO-112-01 Minor (PO thêm T12 #112 + FE V5-13/V5-18 hoặc sửa release notes; T13 FE V5-44 (a) không lên tag thiếu #112). Không ESC. |`

---

## 5. PR #144 `r5-be-b-test-followups` @ `bdd6ba7b` (BE-B, chỉ test) – đóng B1-01, 105-01, 105-02, 96-01

- Lời giao: ORC, bước Review round 5. PR cắt từ `main` @ `c1c41043`, một commit. Head không đổi trong lúc review.
- Thẻ được đóng nằm ở ba tệp review:
  - B1-01, B1-02: tệp này, mục 2.4;
  - 105-01, 105-02: `ARC-on-prs-105-119-125-128.md`;
  - 96-01: `ARC-on-be-a1-prs-127-113-114.md` mục 6.1.
- **Kết luận: DUYỆT @ `bdd6ba7b`.** 0 Blocker, 0 Major, không thẻ mới.
  - Bốn thẻ Minor: **Done**.
  - Cách xử lý B1-02: đồng ý.
  - Điều kiện gộp: CI xanh ở `bdd6ba7b`. Lúc ghi, job `docker images build · E2E smoke` còn đang chạy.

### 5.1 Chỉ có test

- `git diff c1c41043 bdd6ba7b`: 4 tệp, đều dưới `product/services/api/test/` (+200/−9). Không mã nguồn, không migration, không hợp đồng.
- `s438-r8/fixture.ts` (tùy chọn `startFixture({ extraUsers })`) có blob **trùng từng byte** với bản của #139 (`171c00f4`). Gộp theo thứ tự nào cũng không xung đột.
- Người dùng thêm chỉ có trong tệp gọi `extraUsers`. Tenant chung của các tệp khác giữ nguyên, nên số thông báo FD ở các tệp đó không đổi.
- `tsc --noEmit` sạch. Ba tệp của PR trên PostgreSQL 17 riêng: **15/15**.

### 5.2 Mỗi thẻ một đột biến (chạy lại trên `bdd6ba7b`, mỗi lần một chỗ, rồi trả mã về)

| Thẻ | Ca mới | Đột biến của ARC | Bản `bdd6ba7b` | Bản trên `main` `c1c41043` |
|---|---|---|---|---|
| **B1-01** | T13-1: FD-2 (một vai `front_desk`, không tạo yêu cầu nào) đọc tóm tắt Trả phòng **đầu tiên**, rồi tới lead, MGR, OWN, FD-1. FD-2 đọc cả folio (`openRefunds`, `unhandledCreditVnd`). Đọc lại `approval_request` để chắc người tạo chỉ là FD-1 | `openRefundsByReason`: người gọi có vai `front_desk` chỉ thấy yêu cầu mình tạo (đúng dạng lỗi v1.0.4, TC-V104-CO-01b) | **Đỏ**, đúng 1 ca, ở `fd2: expected [] to deeply equal [...]` | Xanh 10/10: lỗ hổng cũ có thật |
| **105-01** | Hủy lúc T = 11:00, FD ghi lúc 12:00 với `receivedAt` 09:00. Ca tự kiểm tiền đề (`received_at` < `cancelled_at` < `created_at`) → `afterClosure: true`, có trong `afterClosureOnly`, audit `reservationStatus: cancelled` | m6: `AFTER_CLOSURE_SQL` dùng `received_at` thay `created_at` | **Đỏ** | (không có ca) |
| **105-02** | Mức service, `PaymentService.expirePendingQrOnClosure` với `folioId` của đơn chính: đơn khác → `[]`, QR vẫn `pending`; đơn chính → QR `expired`, SM-12 `reservation_closed`, `actor_type: system` | m9: bỏ hiệu lực vế `f.primary_reservation_id = $2` | **Đỏ** | (không có ca) |
| **96-01** | Bỏ `requestId` và `instance` trước khi so; `150` chỉ khớp khi là một số đứng riêng (`\b150\b`) | R1: mọi `requestId` bắt đầu bằng `1503222a` (đúng lần CI đỏ cũ) | **Xanh 3/3**: hết chập chờn | **Đỏ 3/3**: tái hiện lỗi chập chờn |
| 96-01 (đối chứng) | – | L2: giá trị hỏng lộ ra một trường thêm của thân lỗi (`extras.stored`) | **Đỏ 2/3** | – |

- **105-02 ở mức service: chấp nhận.**
  - Luật nằm trọn trong `expirePendingQrOnClosure`.
  - `MoneyBridge.voided` gọi hàm này với đúng `input.folioId` (folio của đơn, tức folio chung với đơn con) và `input.reservationId`. Ca service dựng đúng dạng lời gọi đó.
  - Đi qua HTTP phải dựng cả luồng đơn con đang ở rồi hủy. Dài, mà không chứng minh thêm điều gì cho luật này.
- **96-01, đối chứng L2:** ca "giá trị số 50" không đỏ. Lý do: regex chỉ tìm `150` và hai tên khóa, chưa bao giờ tìm `50`, kể cả trước #144. Đây là giới hạn có từ #96, không do PR này và không thuộc thẻ.
  - Gợi ý cho lần BE-C sửa tệp này (v1.0.6, không thẻ): dựng regex từ chính giá trị của từng ca, ví dụ `\b50\b` cho ca số.

### 5.3 FB-R5-ARC-BE-B1-02 (Suggestion): đồng ý cách chuyển

- Lời BE-B: PR-B3 (BE-D) sửa `folio.service.ts` thì hàm chung `folioReservationIds` và ca hoàn tiền cho đơn con B13 đi cùng PR-B3. Không thì sang v1.0.6.
- ARC đồng ý. PR chỉ có test thì không nên gom mã.
- Hai lưu ý cho người làm:
  - Có **ba** chỗ dựng cùng tập đơn của folio, không phải hai: `openRefundsByReason` (dòng ~1147), `openRefunds` (~1169), và `stayReservationIds` (~3399, dùng ở ~3230 và ~3314). Hàm chung nên thay cả ba.
  - Nếu PR-B3 không nhận, PO thêm một dòng backlog v1.0.6 cho B1-02. Như vậy thẻ không chỉ còn nằm trong thân PR.
- Thẻ B1-02 giữ trạng thái Open (Deferred) tới khi có PR.

### 5.4 Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-07 | 5 | ARC – PR #144 (BE-B, chỉ test) DUYỆT @ bdd6ba7b: 4 tệp đều dưới test/, không mã, không migration; fixture extraUsers trùng blob với #139 nên gộp không xung đột. Bốn thẻ Minor Done, mỗi thẻ một đột biến ARC chạy lại: B1-01 (FD chỉ thấy yêu cầu mình tạo → đỏ đúng ở FD-2, bản test trên main xanh); 105-01 (m6 received_at → đỏ); 105-02 (m9 bỏ vế đơn chính → đỏ; mức service chấp nhận vì MoneyBridge gọi đúng dạng đó); 96-01 (requestId bắt đầu 1503222a → bản #144 xanh, bản main đỏ 3/3). B1-02 Suggestion: đồng ý đi cùng PR-B3 nếu PR-B3 sửa folio.service.ts, không thì v1.0.6 và PO thêm dòng backlog; hàm chung phải thay cả ba chỗ dựng tập đơn (gồm stayReservationIds). Gộp khi CI (E2E) xanh | ARC | rounds/round-05/reviews/ARC-on-be-prs-112-121.md |`
