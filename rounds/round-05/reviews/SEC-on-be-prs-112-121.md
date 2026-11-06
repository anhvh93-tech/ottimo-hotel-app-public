# SEC – Review PR #112 (BE-B PR-B1) và PR #121 (BE-C PR-C1)

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- **PR #112**, nhánh `r5-b1`, HEAD **`a2378981`** (1 commit, gốc `ab1fc4ae`). V5-13 `openRefunds`, V5-18 `depositUnverifiedVnd`, V5-44 (a) `lockReason` (BE C0313-11, 13, 14). CI của HEAD xanh: `format · lint · audit · test · build`, gitleaks, API contract (`RBAC --strict`), OpenAPI lint, confidential paths, E2E smoke. GitHub báo `CONFLICTING / DIRTY`.
- **PR #121**, nhánh `r5-c1`. V5-1A giá đêm bắt buộc + `NIGHTLY_PRICE_UNUSUAL`, bootstrap căn ngừng bán, V5-44 (b) trigger 0094 → 409.
  - SEC đọc ở **`452e8b01`** (gốc `37345dab`; 3 commit `ca021763`, `abdf3aa5` gộp `main`, `452e8b01`). CI của `452e8b01` xanh, trừ E2E smoke chưa báo.
  - Trong lúc review, BE-C đẩy thêm hai commit gộp `main`, không rebase:
    - **`e06afa5a`**: gộp `main` @ `dc0c5038` (#103, #117, #109);
    - **`6d412a7b`**: gộp `main` @ `16ea5183` (tài liệu, oracle QA BR-438).
  - CI của `6d412a7b` đang chạy lúc SEC viết tệp này (OpenAPI lint đã xanh).
- SHA cuối SEC duyệt: **#112 `a2378981`**, **#121 `6d412a7b`**.

Cách kiểm:
- Đọc diff `ab1fc4ae..a2378981` và `37345dab..452e8b01`, rồi đọc phần chênh `452e8b01..6d412a7b`:
  - `git show --remerge-diff` cho `e06afa5a` và `6d412a7b`: mỗi commit gộp chỉ gỡ một xung đột, ở phần đầu tệp (`owner`, lịch sử phiên bản) của `tests/fixtures/br-examples.json`;
  - patch-id của phần `services/api/src` so với `main` cha (`dc0c5038`, rồi `16ea5183`) trùng với `37345dab..452e8b01`. Mã máy chủ của PR không đổi khi gộp;
  - `e06afa5a..6d412a7b` không chạm `product/services`, `product/apps`, `product/infra`.
- Mã có sẵn SEC đối chiếu (không đổi trong PR):
  - `shared/serialization/serializer.ts`, `field-policy.ts` (lọc `x-visible-to`, bỏ khóa không khai báo);
  - `shared/problem.ts` (500 chỉ trả `INTERNAL_ERROR`; log lỗi PostgreSQL chỉ có mã, ràng buộc, routine);
  - `generated/openapi-meta.ts` (vai của `getCheckoutSummary`, `createRoom`, `updateRoom`, `cancelScheduledRoomListPrice`; danh sách `writeRoles`);
  - migration `0094_room_list_price_append_only.sql`;
  - các chỗ tạo `approval_request` loại `refund` (nguồn của `reason_code`);
  - `ops-check.sh` `check_pricegap`.
- Đối chiếu tài liệu:
  - hợp đồng 0.3.13 mục 1.2, 1.6, 1.8, 1.11, 1.24, giả định G3 (`rounds/round-05/outputs/ARC/contract-0.3.13.md`) và `product/docs/api/openapi.yaml`;
  - `product/docs/security/security-requirements.md`: SR-AZ-01, SR-AZ-04, SR-AUD-01, SR-AUD-03, SR-LOG-04, SR-PAY-08;
  - thẻ SEC cũ FB-R5-SEC-ARC-12, FB-R4-SEC-FE-HOLDS-03;
  - `SEC-on-be-pr-103-s1.md` (cổng `x-write-roles`);
  - DOM `DOM-on-prs-112-121-122.md`, đọc để không lặp thẻ.
- Chạy thật trên máy, chỉ trong scratchpad của SEC:
  - worktree tách riêng ở `a2378981`, `452e8b01`, `e06afa5a`, và một bản gộp thử `main` @ `7496e5bc` + `a2378981`. Bản gộp thử chỉ giữ cả hai dòng import ở `folio-lines.service.ts` và không commit;
  - một PostgreSQL 17 tạm, chỉ mở ở `127.0.0.1`, dùng mật khẩu CI công khai của repo; xóa sau review;
  - hai tệp test dò (probe) chỉ trong scratchpad, **không** commit: P1 (#112), P2 và P3 (#121).
- Không gọi staging hay production. Tệp này không có bí mật, dữ liệu khách thật hay số hoa hồng.

---

## 0. Kết luận

| PR | SHA | Kết luận SEC | Điều kiện gộp |
|---|---|---|---|
| **#112** | `a2378981` | **DUYỆT** | Gộp `main` vào `r5-b1` (không rebase), CI xanh lại. SEC đọc lại nếu commit gộp chạm thêm gì ngoài dòng import (mục 1.6) |
| **#121** | `6d412a7b` (đọc `452e8b01`, test chạy ở `e06afa5a`) | **DUYỆT** | CI của `6d412a7b` xanh |

- 0 Blocker · 0 Major · 0 Minor · 3 Suggestion. Không thẻ nào là điều kiện gộp.
- RBAC, `x-write-roles`: hai PR không thêm operation, không đổi `x-roles`, không thêm `x-write-roles`. Cổng `x-write-roles` của #103 hiện chỉ có ở `calculateQuote`, `saveQuote`, `createReservationGroup`; hai PR không chạm các lệnh này. Không có gì phải khớp thêm.
- Số tiền hoàn và cọc chờ đối soát chỉ tới FD+ (OWN, MGR, FDL, FD). SEC thử qua HTTP: CTV đọc đơn của mình không nhận hai trường; SAL nhận 404; tóm tắt trả phòng trả 403 cho cả hai (P1).
- Không có thông tin thẻ, giấy tờ hay dữ liệu cá nhân mới trong thân trả về, log hay audit.
- Migration: không. Trigger 0094 không đổi, vẫn là chốt cuối. PR chỉ đổi mã lỗi trả về khi trigger từ chối (mục 2.3).
- SQL của cả hai PR đều tham số hóa.
- ESC mới: **không**.

---

## 1. PR #112 – `openRefunds`, `depositUnverifiedVnd`, `lockReason`

### 1.1 Ai thấy số tiền hoàn (V5-13)

- Hợp đồng: `Folio.totals.openRefunds` có `x-visible-to: [owner, manager, front_desk_lead, front_desk]`. `CheckoutSummary.openRefunds` không có `x-visible-to`, nhưng `getCheckoutSummary` có `x-roles` FD+. Khớp G3 của ARC: `openRefunds` theo `unhandledCreditVnd`, không theo quyền đọc folio.
- Mã:
  - `folio-view.ts` đưa `openRefunds` vào `totals`;
  - `checkout.service.ts` dòng 1009 đưa `balance.openRefunds` vào tóm tắt;
  - serializer toàn cục (`SerializeInterceptor`) bỏ trường theo `x-visible-to`, và bỏ khóa không có trong schema.
- SEC rà các chỗ dùng `FolioBalance`/`FolioTotals`: không chỗ nào trải (`...balance`) vào thân trả về hay vào `after` của audit. `FolioService.totals()` không còn nơi gọi.
- Probe P1 (`main` + PR và PR riêng, cả hai qua):
  - Đơn CTV (kênh Cộng tác viên, người chốt là CTV), cọc chuyển khoản chờ đối soát, rồi FD hủy đơn → có yêu cầu hoàn.
  - FD đọc folio: `totals.openRefunds = [{ reasonCode: found_other, openVnd: … }]`.
  - CTV đọc folio: 200, thân không có chuỗi `openRefunds`.
  - SAL đọc folio: 404, không lộ đơn có tồn tại.
  - Cả hai đọc `checkout-summary`: 403.

**Nội dung:** mỗi dòng chỉ có `reasonCode` và `openVnd`. Không mã yêu cầu, không người tạo, không nơi nhận, không `reason_note` (chữ tự do). SEC lần mọi chỗ tạo `approval_request` loại `refund`:
- `reason_code` luôn do máy chủ đặt:
  - `overpayment`, `early_departure`, `overbooking_relocated`;
  - mã lý do hủy (`CancelReasonCode`, có CHECK ở DB);
  - `no_show`.
- Không đường nào để nhân viên gõ chữ tự do vào `reason_code`. Vì vậy trường này không mang được dữ liệu cá nhân hay số thẻ.
- Chữ lý do do người gõ nằm ở `reason_note` và không ra ngoài qua trường mới.

**Phạm vi:** gồm cả yêu cầu do người khác tạo, theo hợp đồng A1 (b). FD đã thấy `creditVnd` và `unhandledCreditVnd` của cùng folio. Thứ mới FD thấy chỉ là cách chia theo lý do. Không cần nới phạm vi `listApprovalRequests`. Câu truy vấn chạy dưới RLS của người gọi, tham số `$1::uuid[]`.

### 1.2 Ai thấy cọc chưa đối soát (V5-18)

- `Reservation.depositUnverifiedVnd` có `x-visible-to` FD+. Giá trị được tính cho mọi người gọi (`reservations.service.ts` dòng 432), và serializer bỏ nó với SAL/CTV. P1: CTV đọc đơn của mình → 200, có `depositPaidVnd` (CTV vốn được thấy), không có `depositUnverifiedVnd`; FD thấy 200.000.
- Thân `Reservation` còn được dựng ở replay idempotency và ở các thân trả về của lễ tân (`frontdesk.controller.ts`, đều FD+). Các đường này đều đi qua serializer.
- Các chỗ gọi `reservationView` trong mã (`bill.service.ts`, `folio.controller.ts`, `payments.service.ts`, `deposits.service.ts`) chỉ lấy vài trường cụ thể: mã, ngày, kênh, người đặt, `segments`. Không chỗ nào đưa nguyên thân vào outbox, SSE hay audit.
- Một câu truy vấn dùng chung (`payments/public/deposit-unverified.ts`) cho trường đọc và cho `after.unverifiedPaidVnd` của audit `reservation.deposit_confirmed`. Allowlist audit không đổi: khóa này đã có từ R4 (SR-AUD-03). Kết quả kẹp trong `[0, depositPaidVnd]`.

### 1.3 `lockReason` (V5-44 (a))

- Tất cả các chỗ trả `409 FOLIO_LOCKED` nay đều qua `folioLocked(reason, detail?)`. Giá trị là enum 5 mã, giống hợp đồng. Không có id, số tiền hay ngày trong `lockReason`.
- `detail` vẫn là hai câu cũ, có số hiệu BR (BR-427 d, BR-525). Không lộ chi tiết nội bộ. Desk thôi so chữ trong `detail`, nên câu cho người dùng không còn phụ thuộc chuỗi log.
- Test kiến trúc (`pr-b1-units.test.ts`) chặn mọi `problem('FOLIO_LOCKED'…)` mới dưới `src/modules`.
  - Trên bản gộp thử với `main` @ `7496e5bc`, không còn chỗ nào sót.
  - SEC dò thêm các nhánh đang mở cũng sửa `folio`/`payments` (#105, #110, #99, #114, #119): không nhánh nào thêm chỗ ném `FOLIO_LOCKED`. PR nào gộp sau thì test này giữ luật.
- Nhánh thu nợ trên folio `open` đổi từ `FOLIO_LOCKED` sang `409 INVALID_TRANSITION`, `currentState: open`. Điều kiện chặn không đổi (thu nợ chỉ trên folio đã chốt, thu thường không trên folio `closed`). Nhánh không ghi gì; test "nothing written" kiểm điều đó.
- `guest-request-lifecycle.ts` vẫn bắt lỗi theo `err.code === 'FOLIO_LOCKED'`, không đổi hành vi.

### 1.4 Audit cho thao tác tiền

PR không thêm thao tác ghi tiền nào. Hai trường mới chỉ để đọc. Nhánh 409 mới không ghi gì. Không cần thêm audit.

### 1.5 Đã chạy

- Ở `a2378981`: `pr-b1-v5-13-18-44`, `pr-b1-units`, `folio-payments` → 3 tệp, 39 ca qua.
- Trên bản gộp thử `main` + PR, SEC chạy cùng 3 tệp, P1 và 18 tệp tích hợp tiền/folio nhóm `s438*` (gồm cả thư mục `s438-r8`, nơi có fixture mà test của PR dùng).
  - 22 tệp chạy; 19 tệp qua lần đầu.
  - 3 tệp tiền nặng của BE-A (`s438r2-money`, `s438r3-money`, `s438-r8/r8ver-01`) lỗi khi chạy song song: 7 ca quá thời gian 30 giây và 2 ca hỏng dây chuyền theo sau. Lúc đó máy đang chạy PostgreSQL của nhiều vai cùng lúc.
  - Chạy lại một luồng (`--maxWorkers=1`): xem mục 3.

### 1.6 Điều kiện gộp

- PR đang `DIRTY`. SEC gộp thử bằng `git merge-tree` với `main` @ `7496e5bc`: chỉ một xung đột, ở dòng import của `folio-lines.service.ts` (`readDamageCatalog` từ #109 và `folioLocked`). Phải giữ cả hai dòng.
- Commit gộp chỉ gỡ xung đột đó: SEC không cần đọc lại.
- Commit gộp chạm thêm một trong các tệp sau: SEC đọc phần chênh trước khi gộp.
  - `folio.service.ts` (`openRefundsByReason`);
  - `folio-view.ts`;
  - `reservation-dto.ts`;
  - `deposit-unverified.ts`;
  - `payment.service.ts`;
  - `openapi.yaml` (ở các trường `openRefunds`, `depositUnverifiedVnd`, `Folio.totals`).

---

## 2. PR #121 – giá đêm bắt buộc, cảnh báo giá, bootstrap, trigger 0094

### 2.1 RBAC và đầu vào

- `createRoom`, `updateRoom`, `cancelScheduledRoomListPrice` vẫn `x-roles: [owner, manager]`.
- Probe P3: FDL, FD, SAL, CTV gọi cả ba lệnh, thân lệnh có giá đêm 1 đ.
  - Kết quả: 12/12 lần 403, đủ 12 dòng `access.denied`, số dòng `room_list_price` không đổi.
  - Thân 403 không có trường mở rộng.
- `money = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)` (`platform.controller.ts` dòng 74, 108, 132). Vì thế `nightlyPriceUnusual` không bao giờ ném `RangeError` từ HTTP. Công cụ nhập kiểm `isPrice` (số nguyên an toàn > 0) trước khi gọi.
- Phép so `× 30` / `× 5` dùng BigInt, nên không tràn số.
- Thiếu giá đêm → 422 `REQUIRED`. Giá 0 → 422, không 500 (T1A-1…3).

### 2.2 Cảnh báo `NIGHTLY_PRICE_UNUSUAL` và audit giá

- Cảnh báo chỉ có `code`, không số, không id. Chỉ OWN/MGR nhận.
- Audit `config` giữ đủ hai giá:
  - `room.created` `after.nightlyListPriceVnd`;
  - `room.updated` `before/after.listPrice`.
- Thẻ FB-R5-SEC-ARC-12 đã Closed với điều kiện này (SEC chấp nhận không có ô lý do vì audit ghi giá). PR làm đúng điều kiện đó.

### 2.3 Trigger 0094 → 409 (V5-44 (b))

- `cancelScheduledListPrice` (`rooms.service.ts` dòng 361–375) xóa trong `SAVEPOINT cancel_list_price`.
- Lỗi được ánh xạ khi có **cả hai**: SQLSTATE `23514` và thông báo bắt đầu bằng câu của trigger. Khi đó máy chủ `ROLLBACK TO SAVEPOINT` rồi ném 409 `INVALID_TRANSITION`, `currentState: effective`.
- Mọi lỗi khác ném lại nguyên trạng → 500 `INTERNAL_ERROR`. Thân lỗi không có chữ của PostgreSQL. Log chỉ ghi mã và routine.
- **Không mở lối ghi vượt quyền:**
  - trigger, quyền `DELETE` của `ottimo_app` và luật trong service không đổi;
  - trigger vẫn đọc đồng hồ thật của DB, nên đồng hồ staging `CLOCK_MODE=mutable` lùi về quá khứ cũng không xóa được dòng đã áp dụng (T44-3);
  - sau 409, UnitOfWork rollback cả giao dịch. Không tăng `version`, không audit, không giữ khóa idempotency.
- Thông báo 409 không nêu id, giá hay ngày. Lệnh này chỉ OWN/MGR gọi được.
- Mặt mất đi: trước đây trigger từ chối thì có một dòng log `unhandled error … 23514` (đúng mục đích phát hiện ghi ở đầu 0094). Nay là một 409 bình thường, không phân biệt được với 409 do service tự chặn. Rủi ro thấp: ở production chỉ xảy ra khi ngày lịch sang đúng lúc đang xóa. Thẻ **C1-01** (Suggestion).

### 2.4 Bootstrap và công cụ nhập

- `production-bootstrap.ts` tạo 10 căn `is_sellable = false`. CLI in thêm một dòng hướng dẫn, không in bí mật mới. Mật khẩu tạm của OWN đầu tiên vẫn chỉ in một lần như R3 (FB-R3-SEC-BOOT-02).
- `importRoomCatalog` đổi như sau:
  - từ chối căn chỉ có một trong hai giá;
  - từ chối căn `isSellable: true` mà không có giá;
  - từ chối khóa cũ `expectedNightlyListPriceVnd`;
  - không có giá → căn ngừng bán.
- Công cụ không có route HTTP. Câu lỗi chỉ nêu số căn.
- Test helper `pricegap-static.ts` đọc câu SQL hằng từ `ops-check.sh`, kiểm phải bắt đầu bằng `SELECT count(*)`, và chỉ chạy trong test.

### 2.5 Căn chưa có giá mà bật "Đang bán" (DOM FB-R5-DOM-BE-121-02)

Probe P2 trên `e06afa5a`:
- Nhập một căn không giá → căn ngừng bán.
- MGR `PATCH isSellable: true` → 200, `warnings: []`.
- OWN tạo đơn trên căn đó → 422 `VALIDATION_FAILED`, `roomId NOT_IN_LIST`, `detail` "room has no list price for the stay". Không lộ gì thêm.
- Web bỏ căn này khỏi giá ước tính, và `pricegap` báo.

Không có đường bán sai tiền (không giá 0, không giá suy từ giá tháng). SEC đồng ý thẻ DOM (chặn ở 0.3.14) và không mở thẻ trùng. Khi làm, luật chặn phải nằm ở máy chủ, áp cho mọi vai kể cả OWN; Desk chỉ khóa công tắc.

### 2.6 Đã chạy

- Ở `452e8b01`: 7 tệp, 303 ca qua:
  - `v5-1a-nightly-price`, `v5-1a-room-prices-units`;
  - `platform-catalog`, `production-bootstrap`;
  - `rbac-sprint1`, `rooms-scheduled-prices-v101`, `seed`.
- Ở `e06afa5a`: cùng 7 tệp, thêm `write-roles-gate` (#103) và probe P2, P3 → qua. SEC không chạy lại ở `6d412a7b`: mã máy chủ giống hệt, commit gộp chỉ đổi phần đầu `br-examples.json`.
  - `production-bootstrap` lần đầu báo "DB không trống" vì dùng lại DB bootstrap của lần chạy trước. Tạo lại DB thì 11/11 qua. Đây là lỗi môi trường của SEC, không phải lỗi PR.

---

## 3. Chạy lại các tệp tiền nặng (bản gộp thử #112)

Ba tệp lỗi ở lần chạy song song (mục 1.5): `s438-r8/r8ver-01`, `s438r3-money`, `s438r2-money`. SEC chạy lại từng tệp một (`--maxWorkers=1`), cùng một DB tạm:

| Bản | Kết quả |
|---|---|
| `main` @ `7496e5bc` | 3 tệp, 32/32 ca qua |
| Bản gộp thử `main` @ `7496e5bc` + `a2378981` | 3 tệp, 32/32 ca qua |

Lỗi lần đầu là do máy quá tải, không phải do #112. Kết luận ở mục 0 giữ nguyên. CI của commit gộp thật vẫn là bằng chứng cuối.

---

## 4. Thẻ

### FB-R5-SEC-BE-B1-01
- Mức độ: **Suggestion**. Không chặn gộp #112.
- Vị trí: `test/pr-b1-units.test.ts` khối "T13-4 / T18-3"; hợp đồng 0.3.13 mục 1.2 T13-4 ("SAL đọc folio") và 1.6 T18-3.
- Vấn đề:
  - T13-4 và T18-3 chỉ chạy `serializeSchema('Folio' | 'Reservation', …)` trên dữ liệu dựng tay.
  - Không có ca HTTP nào: CTV/SAL gọi `getFolio`, `getReservation`, `getCheckoutSummary` thật.
  - Vì vậy test không bắt được các thay đổi sau này ở chỗ khác:
    - một thân trả về mới bọc `Reservation` trong object mở (`additionalProperties: true`);
    - một thao tác SAL/CTV trả folio qua schema khác;
    - một ai đó bỏ `x-visible-to` khỏi `totals.openRefunds`.
- Vì sao quan trọng: đây là hai số tiền chỉ FD+ được xem (rbac mục 6). SR-AZ-04 đòi test snapshot JSON theo vai, chạy trên đường trả về thật.
- Đề xuất sửa: thêm một ca tích hợp, lấy probe P1 của SEC làm mẫu (mục 1.1):
  - FD tạo đơn kênh CTV, có cọc chuyển khoản chờ đối soát, rồi hủy;
  - CTV đọc folio và đơn → 200, thân không có chuỗi `openRefunds` hay `depositUnverified`;
  - SAL → 404;
  - cả hai gọi `checkout-summary` → 403;
  - FD → có cả hai trường.
  - Làm ở PR test sau (cùng PR test của S1-01 hay PR-B3), không cần làm trong #112.
- Trạng thái: Open

### FB-R5-SEC-BE-C1-01
- Mức độ: **Suggestion**. Không chặn gộp #121.
- Vị trí: `rooms.service.ts` `cancelScheduledListPrice`, nhánh `isAppliedPriceRefusal` (dòng 369–372); đầu migration `0094` ("only fires on a programming error or an injected statement").
- Vấn đề:
  - Trước PR, trigger 0094 từ chối → 500 và một dòng log lỗi (`code=23514`). Đó là dấu hiệu phát hiện mà SEC đặt cho 0094 ở R4.
  - Nay → 409 `effective`, không log, không audit. Câu trả lời giống hệt 409 do service tự chặn.
  - Không còn cách biết trigger đã phải ra tay. Ví dụ: đồng hồ app và DB lệch, hoặc luật ngày trong service bị sửa sai.
- Vì sao quan trọng: 0094 là lớp phòng thủ sau cùng cho lịch sử giá niêm yết, tức căn cứ đối soát báo giá (Tampering/Repudiation). Lớp phòng thủ sau cùng mà chạy im lặng thì không ai biết lớp trước đã hỏng.
- Đề xuất sửa:
  - Trong nhánh ánh xạ, ghi **một** dòng `logger.warn`, ví dụ `list_price_append_only_refused requestId=<id>`. Không ghi id căn, giá hay ngày (SR-LOG-04).
  - Hoặc tăng một bộ đếm, nếu OPS muốn đưa vào `ops-check` sau.
  - Giữ nguyên 409 cho client.
  - Không cần đổi hợp đồng hay migration. Làm ở v1.0.5 nếu tiện, chậm nhất v1.0.6.
- Trạng thái: Open

### FB-R5-SEC-BE-B1-02
- Mức độ: **Suggestion**. Ghi cho người làm PR gộp sau, không phải lỗi của #112.
- Vị trí: #105 (V5-48), #110 (V5-16 chặn BR-438), #99, #114. Các PR này cùng sửa `payments.service.ts`, `payment.service.ts`, `folio-lines.service.ts`, `money-bridge.ts`.
- Vấn đề:
  - Khi gộp `main` có #112 vào các nhánh trên, xung đột ở các chỗ ném lỗi khóa folio rất dễ được gỡ bằng cách giữ dòng `problem('FOLIO_LOCKED')` cũ.
  - Test kiến trúc của #112 sẽ đỏ, nên không lọt được. Nhưng người gỡ có thể "sửa" test thay vì sửa mã.
  - Riêng `payment.service.ts`: #105 thêm nhánh cho đơn đã đóng, ngay cạnh nhánh `debtCollection` mà #112 vừa tách ra thành `INVALID_TRANSITION`.
- Vì sao quan trọng: nếu gộp sai ở nhánh `debtCollection`/`closed`, khoản thu có thể đi vào folio không được nhận. V5-48 là đường tiền.
- Đề xuất sửa:
  - Người gộp sau giữ `folioLocked(...)` và không sửa `pr-b1-units.test.ts`.
  - Với #105: chạy lại `pr-b1-v5-13-18-44` cùng test của V5-48 trên bản đã gộp.
  - SEC đọc lại phần chênh ở `payment.service.ts` khi #105 gộp main.
- Trạng thái: Open

---

## 5. Điểm làm tốt

- Chỉ một câu truy vấn cho cả `openRefunds` lẫn phần trừ trong `unhandledCreditVnd`, và chỉ một câu cho cả `depositUnverifiedVnd` lẫn audit. Hai số không thể lệch nhau. Trường mới chỉ chở số tiền theo mã lý do do máy chủ đặt, không chở chữ tự do.
- `folioLocked` là đường duy nhất, có test kiến trúc giữ. Desk thôi so chữ trong `detail`, nên câu log không còn là một phần của hợp đồng.
- Ánh xạ 0094 hẹp và đúng chỗ: cần cả SQLSTATE lẫn tiền tố câu, trong `SAVEPOINT`, chỉ ở một lệnh. Test có ca phủ định cho cả hai điều kiện. Bootstrap tạo căn ngừng bán là mặc định an toàn (fail closed).

---

## 6. Giả định

- G1. Serializer toàn cục (`SerializeInterceptor`) chạy cho mọi `@Operation`, như mô tả ở `serializer.ts`. SEC dựa vào đó để kết luận về `x-visible-to`; P1 xác nhận trên ba đường chính.
- G2. Commit gộp `main` của #112 sẽ chỉ gỡ dòng import như bản gộp thử của SEC. Nếu khác, áp mục 1.6.
- G3. CI của `6d412a7b` (#121) sẽ xanh như các test SEC chạy trên máy. Nếu đỏ ở tệp ngoài phạm vi PR, ORC xử lý theo luật CI; đỏ ở `rooms.service.ts` hay `room-catalog-import.ts` thì SEC đọc lại.

---

## 7. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ: biên ÷ 30 / ÷ 5, nhãn lý do hoàn, nghĩa từng `lockReason`. Phần đó DOM đã duyệt (`DOM-on-prs-112-121-122.md`).
- Worktree, tệp probe, bản gộp thử và PostgreSQL tạm của SEC chỉ nằm trong scratchpad `sec-112-121/`, xóa sau review. Không commit vào `r5-b1` hay `r5-c1`. SEC không approve hay gộp trên GitHub.

---

## 8. Dòng decision-log đề xuất (ORC chép)

`| 2026-11-07 | 5 | **SEC – review PR #112 (BE-B PR-B1) @ a2378981: DUYỆT; PR #121 (BE-C PR-C1) @ 6d412a7b (đọc 452e8b01; hai commit gộp main e06afa5a, 6d412a7b chỉ đổi br-examples.json): DUYỆT** (rounds/round-05/reviews/SEC-on-be-prs-112-121.md). openRefunds và depositUnverifiedVnd chỉ FD+ (x-visible-to; getCheckoutSummary FD+); probe HTTP: CTV 200 không có trường, SAL 404, tóm tắt 403; reasonCode luôn do máy chủ đặt, không chữ tự do. lockReason enum, mọi 409 FOLIO_LOCKED qua folioLocked, có test kiến trúc. #121 không đổi vai (OWN/MGR, 12/12 lần 403 + access.denied); 0094 → 409 chỉ khi SQLSTATE 23514 + câu trigger, trong SAVEPOINT, rollback, trigger vẫn là chốt cuối; bootstrap căn ngừng bán. Điều kiện: #112 gộp main (chỉ dòng import folio-lines.service.ts, khác thì SEC đọc lại), #121 CI xanh ở 6d412a7b. Thẻ Suggestion BE-B1-01 (test HTTP theo vai cho hai trường), BE-C1-01 (một dòng log khi 0094 từ chối), BE-B1-02 (giữ folioLocked khi #105/#110/#99/#114 gộp main). SEC đồng ý DOM BE-121-02 (chặn bật Đang bán khi chưa có giá, 0.3.14, máy chủ áp mọi vai) | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật); không ESC |`
