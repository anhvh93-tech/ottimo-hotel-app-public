# SEC – Review PR #103 (BE-S, PR-S1)

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- PR #103, nhánh `r5-s1`, HEAD **`7c6908f0`** (gốc `ab1fc4ae`). 4 commit: `fd986f48` (guard `x-write-roles`), `33c664bb` (V5-14), `a94524fd` (V5-22), `7c6908f0` (gộp `main`). CI của HEAD xanh: API (PostgreSQL), gitleaks, API contract `RBAC --strict`, OpenAPI lint, confidential paths, E2E smoke.
- 14 tệp, `git diff ab1fc4ae..7c6908f0`. Tệp SEC đọc kỹ: `shared/http/write-roles.ts`, `shared/http/auth.guard.ts`, `audit/public/audit-fields.ts`, `sales/internal/quotes.controller.ts`, `sales/internal/quote-pricing.ts`, `reservations/internal/sales-port.adapter.ts`, `reservations/public/rate-out-of-range.ts`, `reservations.service.ts`, `stay.service.ts`, và 5 tệp test.
- Mã có sẵn (không đổi trong PR) SEC đối chiếu: `shared/http/unit-of-work.ts` (`runInner`, `claimKey`, `requestHash`), `reservations/public/pricing.service.ts` (`price`: biên BR-105, `outOfRange` chỉ đêm `manual`), `quotes.service.ts` (`createHold` đọc giá từ snapshot), `audit.service.ts` (`record` lọc `before`/`after` qua allowlist), `http.ts` (Fastify, bộ đọc JSON mặc định), `generated/openapi-meta.ts` (`writeRoles` của `calculateQuote`, `saveQuote`, `createReservationGroup`), các chỗ khác ghi `entityType: 'operation'`.
- Đối chiếu: `contract-0.3.13.md` mục 1.3, 1.9, 1.16, 1.17; thẻ SEC `FB-R5-SEC-ARC-01`, `02`, `06` (`SEC-on-contract-0.3.13.md`); SR-AZ-01, SR-AUD-03. Đã đọc `ARC-on-be-pr-103-s1.md` để không lặp thẻ.

Cách kiểm:
- Đọc diff. Thêm một worktree tách riêng ở `7c6908f0` trong scratchpad của SEC (không checkout bản làm việc chung) và một PostgreSQL 17 tạm trên máy (container riêng, chỉ `127.0.0.1`, mật khẩu CI công khai của repo, xóa sau review).
- Chạy lại `write-roles-gate`, `v5-14-quote-typed-rates`, `v5-22-rate-bounds`, `write-roles-units`: 58/58 qua.
- Viết một tệp test dò (probe) chỉ trong scratchpad, **không** commit, cho 3 câu hỏi BE nhờ SEC xem (mục 1.1, 2.3, 1.2). Kết quả ghi ở từng mục.
- Không gọi staging hay production. Tệp này không có bí mật hay dữ liệu khách.

---

## 0. Kết luận: **DUYỆT**

Gộp được ở `7c6908f0` khi xong thao tác ARC đã nêu: gộp `main` vào `r5-s1` (không rebase), gỡ một xung đột ở dòng import của `quote-pricing.ts`, CI xanh lại. SEC tự chạy `git merge-tree` với `main` @ `dcfca8b1`: đúng một xung đột đó; `auth.guard.ts` tự gộp sạch, cổng trường vẫn đứng sau kiểm 2FA của V5-40. Nếu commit gộp chỉ gỡ xung đột import thì SEC không cần đọc lại. Nếu chạm `auth.guard.ts`, `write-roles.ts`, `unit-of-work.ts` hoặc `quotes.controller.ts` thì SEC đọc lại phần chênh.

0 Blocker · 0 Major · 1 Minor · 2 Suggestion. Không thẻ nào là điều kiện gộp.

| Thẻ SEC ở hợp đồng | Cài đặt ở PR #103 | Ghi chú |
|---|---|---|
| FB-R5-SEC-ARC-01 (báo giá chỉ `direct`/`agent`) | **Khớp** | `quote-pricing.ts` dòng 219–225: `ota`, `internal`, kênh ngừng → 422 `channelId NOT_IN_LIST`, có hay không `nightlyRates`. T14-8/9 có ca SAL kênh `internal`, không lưu báo giá |
| FB-R5-SEC-ARC-02 (ranh giới trường `nightlyRates`, thứ tự kiểm, 403 không trường mở rộng) | **Khớp**, trừ một kẽ hở nhỏ về audit | Mục 1. Kẽ hở: thẻ S1-01 |
| FB-R5-SEC-ARC-06 (đêm `edited` ≠ `true` lấy giá máy chủ) | **Khớp** | `typedCalendar` dòng 619–624 gửi giá lịch của máy chủ với `edited: false`, bỏ số client. T14-11 (gửi `amountVnd` = 1) |

Ba thẻ trên đã Closed ở bước hợp đồng. SEC không mở lại, chỉ xác nhận mã làm đúng.

ESC mới: **không**.

---

## 1. Guard `x-write-roles`

### 1.1 Thứ tự kiểm và 403 không lộ gì

`auth.guard.ts` dòng 345–371: cổng trường chỉ chạy khi vai đã qua `x-roles`. Kết quả gộp vào `allowed`, nên dùng lại đúng đường quyết định vai có sẵn (403 + `access.denied`, hoãn qua UnitOfWork khi replay).

| Đường đi | Kết quả | Bằng chứng |
|---|---|---|
| `calculateQuote` (không có `Idempotency-Key`) | 403 ngay trong guard, trước handler. Không tính giá, không `min`/`max` | dòng 367; H-06, H-07 (SAL dưới sàn → 403, không 422) |
| `saveQuote`, khóa mới hoặc không có khóa | 403 trong guard. Không ghi dòng `idempotency_key`, không lưu báo giá | dòng 369–371; test "before every body check" kiểm 0 dòng khóa; H-05 |
| `saveQuote`, khóa đã xong, **cùng** thân lệnh (người dùng mất vai FD sau đó) | Trả lại câu trả lời cũ (ADR-009). Không ghi gì mới, không lộ gì mới: người đó đã nhận câu trả lời này lúc còn quyền | test ADR-009 |
| `saveQuote`, khóa đã xong, **khác** thân lệnh, kèm `nightlyRates` | 422 `IDEMPOTENCY_KEY_REUSED`. Không 403, **không** `access.denied`. Thân lệnh sai dạng thì 422 `VALIDATION_FAILED` kèm danh sách trường, tức kiểm thân lệnh chạy trước 403 | Probe P1 (mục 1.4). Thẻ **S1-01** |
| Lỗi ném trong handler (vd. `RATE_OUT_OF_RANGE`) | Giao dịch rollback, khóa bị xóa, không lưu câu trả lời có `min`/`max` để replay | `unit-of-work.ts` dòng 203–215 |

Thân lỗi 403: `problem('FORBIDDEN_ACTION')`, không trường mở rộng (`min`, `max`, `dates`, `errors`). Test so mọi khóa của thân lỗi với danh sách Problem thuần.

**Kết luận 1.1:** SAL/CTV không có đường nào nhận được sàn–trần hay ghi được giá gõ. ARC-02 (d) vẫn đóng.

### 1.2 Ngữ nghĩa "đã gửi" và fail-closed

- Chỉ xét thuộc tính riêng (`hasOwnProperty`). `null`, `[]`, `{}`, `0` đều tính là đã gửi (test).
- Mảng gặp ở bất kỳ vị trí nào trên đường dẫn đều được duyệt từng phần tử. Thân lệnh không phải object thì không gửi gì.
- Khóa kế thừa không thể đến từ thân JSON: Fastify dùng bộ đọc JSON mặc định (`onProtoPoisoning` = `error`), `http.ts` không đổi. Thân `__proto__` bị từ chối ở tầng đọc.
- Probe P3: CTV gửi thân là **mảng** `[{ nightlyRates: … }]` lên `calculateQuote` → cổng cho qua, nhưng `parseBody` trả 422 `VALIDATION_FAILED`, không tính giá, không trả số nào. Chấp nhận được: handler không thể đọc trường gốc từ một mảng.
- Kẽ hở lý thuyết cho R3: ở vị trí `a[]`, object được xét như **một** phần tử, nên `rooms: { "0": { nightlyRates: […] } }` không bị tính là đã gửi `rooms[].nightlyRates`. Hiện không khai thác được: `createReservationGroup` chưa có route, và schema mảng chặt sẽ trả 422. Thẻ **S1-02** (Suggestion) để khóa lại khi R3 thêm route.

### 1.3 Audit không lộ giá trị

- `after.fields` lấy từ **khóa của `operation.writeRoles`** trong meta sinh từ hợp đồng, đã sắp xếp. Không bao giờ là khóa hay giá trị người dùng gửi lên. Không có đường để chuỗi tùy ý vào log.
- `audit.service.ts` `record` lọc `before`/`after` qua allowlist (SR-AUD-03). Allowlist `operation` thêm `fields`. SEC rà các chỗ khác ghi `entityType: 'operation'` (`step-up.controller.ts`, `c3-access-gate.ts`, `attachments.controller.ts`, kiểm CSRF/Origin trong guard): không chỗ nào đặt `after.fields`, nên thêm khóa này không mở thêm dữ liệu.
- `reason = WRITE_ROLES` cùng kiểu với `ORIGIN`, `CSRF`.
- Mỗi lần bị chặn ghi đúng một `access.denied` (H-09), trừ đường dùng lại khóa ở thẻ S1-01.

### 1.4 Probe P1 – dùng lại khóa đã xong

SAL lưu một báo giá hợp lệ (không `nightlyRates`) với khóa K → 201. Sau đó SAL gửi lại khóa K:

| Thân lệnh | Ở `7c6908f0` | Khi `hasCompletedKey` so thêm `request_hash` (bản sửa thử của SEC) |
|---|---|---|
| Báo giá hợp lệ + `nightlyRates` dưới sàn | 422 `IDEMPOTENCY_KEY_REUSED`, 0 `access.denied` | 403 `FORBIDDEN_ACTION`, có `access.denied` |
| `{ type: 'weekly', nightlyRates: 'x' }` | 422 `VALIDATION_FAILED` + 6 lỗi trường, 0 `access.denied` | 403, có `access.denied` |

Không lộ giá, không ghi gì. Nhưng mọi SAL/CTV đều có sẵn khóa đã xong (họ lưu báo giá hằng ngày), nên ai cũng thử gửi giá được mà không để lại dòng audit nào.

Với bản sửa thử (guard so `method`, `path`, `request_hash`), cả 118 tệp test tích hợp vẫn qua (3054 ca), kể cả test replay ADR-009 của PR. Chi tiết ở thẻ S1-01.

---

## 2. V5-14 – giá gõ trong báo giá

### 2.1 Chỉ kênh `direct`/`agent`
Kiểm kênh chạy độc lập với `nightlyRates` (dòng 219–225). Đơn Nội bộ không đi đường báo giá. Giá đêm 0 đ bị chặn hai lớp: `typedNightRates` (`AMOUNT_NOT_POSITIVE`) và `PricingService.price` (0 đ chỉ được ở kênh `internal`).

### 2.2 Giá gõ không vượt quyền vai
- SAL/CTV: bị cổng trường chặn ở `calculateQuote` và `saveQuote` (mục 1). `createHoldFromQuote` không nhận trường giá (mục 2.3). Giữ chỗ lấy giá từ `pricing_snapshot` do máy chủ ghi (`quotes.service.ts` dòng 580–606), không từ thân lệnh.
- FD+: giá gõ luôn qua sàn–trần BR-105 của `PricingService.price`. Biên luôn có: báo giá ném 422 khi một đêm không có giá niêm yết (`listPrices`), nên không có đêm "không biên" lọt qua.
- SAL/CTV giữ chỗ được báo giá trong phạm vi của mình (người chốt) mà FD đã gõ giá. Đó là quyết định của FD, đơn mang `manual_agreed` và nguồn `manual`, nên vẫn hiện trong báo cáo giá tay. Không phải vượt quyền.
- Snapshot lưu `nights[].source`, `agreedRateVnd`, `bookingRateSource`, **không** lưu sàn–trần. `getQuote` chỉ trả `calc`. SAL/CTV đọc báo giá không thấy biên.

### 2.3 422 trường giá của `createHoldFromQuote` đứng trước bước tra phạm vi
**Không lộ sự tồn tại của báo giá.** Probe P2, SAL gửi `depositVnd` lên ba loại `quoteId`:

| `quoteId` | Có trường giá | Không trường giá |
|---|---|---|
| Báo giá của chính SAL | 422 `errors: [{ field: depositVnd, code: NOT_ALLOWED }]` | – |
| Báo giá của SAL khác (ngoài phạm vi) | cùng 422, thân lỗi giống hệt (bỏ `requestId`) | 404 |
| UUID không tồn tại | cùng 422 | – |

Lỗi 422 chỉ phụ thuộc thân lệnh. `quoteId` sai dạng → 404 trước đó, cũng không phụ thuộc dữ liệu. Kiểm chạy trước UnitOfWork nên không giữ khóa idempotency và không ghi gì. SEC đồng ý với ARC mục 2 (c). Đề xuất khóa thứ tự này bằng test: thẻ S1-03.

---

## 3. V5-22 – `min`/`max` trong `RATE_OUT_OF_RANGE`

Sàn–trần nay hiện trong câu lỗi. SEC rà ai nhận được:
- `PricingService.price` chỉ đưa vào `outOfRange` các đêm `manual`, tức chỉ khi người gọi gửi `nightlyRates`.
- Những lệnh gửi được `nightlyRates`: `createReservation` (`x-roles` FD+), `extendStay` B13 (FD+), `calculateQuote`/`saveQuote` (cổng trường FD+), `createReservationGroup` (cổng trường FD+, chưa có route).
- Cảnh báo OTA (`RATE_OUT_OF_RANGE_WARNING`) cũng chỉ ở `createReservation`, tức FD+.

FD+ được xem sàn–trần là đúng ý BUG-R4-040: Desk cần nói "từ 530.000 đến 1.900.000". SAL/CTV và khách không có đường nào nhận số này.

---

## 4. Thẻ

### FB-R5-SEC-BE-S1-01
- Mức độ: **Minor**. Cùng chỗ với `FB-R5-ARC-BE-S1-04` (ARC để Suggestion và nhờ SEC cân nhắc). SEC nâng lên Minor vì đây là kiểm soát phát hiện của SR-AZ-01. BE trả lời chung một dòng cho cả hai thẻ. Không chặn gộp #103. Khuyến nghị làm trước tag v1.0.5, cùng PR test của `FB-R5-ARC-BE-S1-01`; chậm nhất v1.0.6.
- Vị trí: `auth.guard.ts` `hasCompletedKey` (dòng 376–400, truy vấn so `method`, `path`, không so `request_hash`); `quotes.controller.ts` `save` (dòng 201 `parseBody` chạy trước `uow.run`); `unit-of-work.ts` `claimKey` (dòng 337–338).
- Vấn đề:
  - Guard chỉ hoãn quyết định vai khi người gọi có khóa đã xong cùng `method` + `path`, mà không so thân lệnh. Mọi SAL/CTV đều có khóa như vậy từ những lần lưu báo giá bình thường.
  - Dùng lại khóa đó với thân lệnh khác có `nightlyRates`: thân sai dạng → 422 `VALIDATION_FAILED` (kiểm thân lệnh chạy trước 403, ngược mục 1.16); thân đúng dạng → 422 `IDEMPOTENCY_KEY_REUSED`. Cả hai **không** có `access.denied` (probe P1).
  - Không lộ giá, không ghi gì: tiền và dữ liệu an toàn. Thiệt hại chỉ là lần thử trái quyền không để lại dấu.
  - `x-roles` đã có hành vi này từ R2. `x-write-roles` làm số người dùng được nó tăng từ "người vừa mất vai" lên "mọi SAL/CTV".
- Vì sao quan trọng: SR-AZ-01 và H-09 yêu cầu mỗi lần bị từ chối quyền có một dòng `access.denied`. OWN dùng các dòng này để phát hiện nhân viên thử đặt giá. Ở 0.3.14, các luật trường cũ (`overBalanceReason`, `documentBlockOverride`…) chuyển sang `x-write-roles`, nên kẽ hở sẽ rộng thêm nếu không sửa ở guard.
- Đề xuất sửa (không đổi hợp đồng, không migration):
  1. Tách `canonicalJson` + `requestHash` ra một tệp riêng, ví dụ `shared/http/request-hash.ts`, để guard và UnitOfWork cùng dùng. **Không** import từ `unit-of-work.ts` vào guard: SEC thử thì vòng import làm Nest không dựng được `UnitOfWork` ("can't resolve dependencies… index [1]").
  2. `hasCompletedKey` thêm điều kiện `AND request_hash = $5`. Chỉ replay thật mới được hoãn; mọi yêu cầu khác nhận 403 + `access.denied` ngay trong guard, trước mọi kiểm thân lệnh.
  3. Thân nhị phân (multipart): `requestHash` ném lỗi với Buffer. Ở guard thì coi như không có khóa hoàn tất (không hoãn, 403). Không để guard ném 422 hay 500.
  4. Test: (a) SAL có khóa đã xong của thân A, gửi thân B có `nightlyRates` cùng khóa → 403 `WRITE_ROLES`, đúng một `access.denied`; (b) như (a) nhưng thân B sai dạng → vẫn 403; (c) test ADR-009 hiện có vẫn replay.
  5. SEC đã thử bước 1–2 trong worktree riêng: probe P1 ra 403 + `access.denied`; 118 tệp test tích hợp qua (3054 ca).
- Trạng thái: Open

### FB-R5-SEC-BE-S1-02
- Mức độ: **Suggestion** (làm khi `createReservationGroup` có route, R3).
- Vị trí: `write-roles.ts` `sentAt` (dòng 22–29) và chú thích đầu tệp ("an object met where the path expects an array (`a[]`) is searched as that one element").
- Vấn đề:
  - Ở vị trí `a[]`, object chỉ được xét như một phần tử. Thân `{ rooms: { "0": { nightlyRates: [] } } }` không bị tính là đã gửi `rooms[].nightlyRates`.
  - Hiện an toàn chỉ vì schema `rooms` (khi có) là mảng chặt và từ chối object. Tức cổng trường đang dựa vào bước kiểm thân lệnh, trong khi chú thích tệp nói cổng "must not depend on it".
- Vì sao quan trọng: nếu sau này có bộ đọc biến object thành mảng (`z.preprocess(Object.values)`, kiểu `qs`), SAL/CTV gửi được giá gõ cho đoàn. Đây là đường tiền.
- Đề xuất sửa (chọn một):
  - Ở vị trí có `[]` mà gặp object không phải mảng: xét cả object đó **và** từng giá trị của nó (`Object.values`), để fail-closed thật. Hoặc
  - Giữ nguyên mã, thêm ca vào `write-roles-units` ghi rõ giới hạn này, và khi thêm route `createReservationGroup` thì thêm ca tích hợp: CTV gửi `rooms` dạng object có khóa số + `nightlyRates` → 403, hoặc 422 không có `min`/`max` và không tính giá.
- Trạng thái: Open

### FB-R5-SEC-BE-S1-03
- Mức độ: **Suggestion**.
- Vị trí: `test/integration/v5-14-quote-typed-rates.test.ts` T14-5; `quotes.controller.ts` `createHold` (dòng 304–305).
- Vấn đề: T14-5 chỉ chạy trên báo giá có thật trong phạm vi. Không ca nào khóa tính chất "câu trả lời 422 không phụ thuộc báo giá có tồn tại hay trong phạm vi". Sau này nếu ai chuyển `rejectHoldPriceFields` vào service, sau bước đọc báo giá mà trước bước kiểm phạm vi, thì 422/404 sẽ thành công cụ dò báo giá của người khác.
- Vì sao quan trọng: ARC và SEC cùng muốn giữ thứ tự này (ARC mục 2 (c)). Cần test để giữ.
- Đề xuất sửa: thêm vào T14-5 (hoặc PR test của ARC-01): SAL gửi `depositVnd` lên báo giá của SAL khác và lên UUID ngẫu nhiên → cùng 422, cùng `errors` như báo giá của mình. Không trường giá → 404 với báo giá ngoài phạm vi. Probe P2 của SEC làm đúng việc này, BE có thể lấy làm mẫu.
- Trạng thái: Open

---

## 5. Điểm làm tốt

- Cổng trường nằm ở **một** chỗ (AuthGuard, đọc meta sinh từ hợp đồng) và gộp vào `allowed`, nên replay ADR-009, đường hoãn qua UnitOfWork và audit không phải viết lại. Không có danh sách vai viết tay trong service.
- Fail-closed được nghĩ kỹ: `null` và `[]` tính là đã gửi, chỉ thuộc tính riêng, mảng được duyệt ở mọi vị trí. Test có ca "thân sai dạng vẫn 403", ca "không ghi dòng khóa", và ca tài khoản nhiều vai.
- ARC-06 làm đúng tinh thần: đêm không sửa lấy giá lịch của **máy chủ**, không tin số client. Snapshot không chứa sàn–trần nên báo giá đọc lại không lộ biên.

---

## 6. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ giá (BR-107, BR-111, cộng dồn). Phần đó thuộc ARC (thẻ ARC S1-01, S1-02) và DOM.
- Worktree, tệp probe và container PostgreSQL tạm của SEC chỉ nằm trong scratchpad `sec-pr103/`, đã xóa sau review. Không commit vào nhánh `r5-s1`.
- SEC không approve hay gộp trên GitHub. ORC gộp.
