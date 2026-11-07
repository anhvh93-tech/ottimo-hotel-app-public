# SEC – Review PR #160 (PR-B3b) và PR #163 (PR-B3c) của BE-D2

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần SEC đọc | CI lúc đọc |
|---|---|---|---|---|
| #160 (nháp) | `r5-b3b` → `main` | **`9500d251`** | Diff với gốc gộp `dda49347`: 9 tệp. Mã chỉ đổi ở `refunds.service.ts` (2 điều kiện). 5 tệp `src` khác chỉ đổi chú thích. 2 tệp test, `pr-b3.md`. Commit gộp `f5908503`: `git show --remerge-diff` rỗng. `1c407143`, `9500d251` chỉ đổi `pr-b3.md` | Xanh hết, gồm API contract (RBAC `--strict`), gitleaks, E2E smoke |
| #163 (nháp) | `r5-b3c` → `main` | **`23dbf6d7`** (lúc giao việc: `67baa5d0`) | Chỉ commit `67baa5d0`: `reservation-dto.ts` (+14) và 2 tệp test mới. Commit gộp `1602f1ca` lấy `origin/r5-contract-1j` @ `9d0b3c62`; `--remerge-diff` rỗng. #158 đã gộp vào `main` (`ff3ee4be`, đúng head `9d0b3c62`). Trong lúc SEC review, BE-D2 gộp `main` `c82802a8` (`23dbf6d7`): `--remerge-diff` rỗng; `git diff c82802a8 23dbf6d7` chỉ còn 3 tệp của `67baa5d0`; cây của `23dbf6d7` trùng đúng cây gộp thử của SEC (`b3e9e563`) | Ở `23dbf6d7`: xanh hết, trừ E2E smoke đang chạy |

Đối chiếu:
- thẻ SEC 148-01, 148-03 và đề xuất sửa ở `SEC-on-be-d2-pr-148.md` mục 5; probe P2 và đột biến S7, S10 ở mục 3, 4;
- điều kiện S1–S8 (`SEC-on-bug-r5-002.md` mục 3.2) và quyết định PO 17/10 (SEC-37, decision-log);
- `SEC-on-arc-pr-158.md` mục A (ba ca HTTP SEC hẹn xem ở PR DTO);
- plan §4a T23; `pr-b3.md` mục 10 và thân hai PR.

Cách kiểm:
- Ba worktree tạm từ ref PR đã fetch: `9500d251`, `67baa5d0`, và một bản gộp thử `main` `c82802a8` + `9500d251` + `67baa5d0` (không xung đột). PostgreSQL 17 tạm, container riêng của SEC, vai `ottimo_app` như CI, mỗi worktree một database riêng. Đã xóa worktree, container và ref tạm sau khi xong.
- Máy đang tải nặng trong lúc chạy (load average 38–51, nhiều agent chạy test cùng lúc). Vì vậy một số ca đo thời gian và ca có phiên giờ giả đỏ ở lượt đầu. SEC chạy lại từng tệp đó khi tải thấp hơn; kết quả ghi dưới đây.
- #160:
  - `tsc --noEmit` sạch. `pr-b3-after-closure` + `payments-s3`: **61/61 xanh**;
  - toàn bộ API Vitest ở `9500d251`: 220 tệp qua, 2 bỏ qua; 5.207 ca qua, 19 bỏ qua, 1 todo. **1 ca đỏ:** `reservations.test.ts` US-016 AC4, ca đo p95 < 200 ms của sơ đồ phòng (đo được 297 ms). Ca này không thuộc phần diff. Chạy lại ở bản gộp thử khi tải thấp hơn: xanh;
  - 8 đột biến của SEC và một lượt chạy trên mã cũ: **cả 9 đỏ** (mục A.4).
- #163: 2 tệp test của PR **17/17 xanh** (13 unit, 4 Postgres). 3 probe HTTP (P1–P3, tệp test tạm, không commit): xanh. 3 đột biến của SEC: cả 3 đỏ.
- Bản gộp thử `main` + #160 + #163:
  - `tsc --noEmit` sạch;
  - toàn bộ API Vitest lượt đầu: 219 tệp qua, 2 bỏ qua; 5.225 ca qua. **9 ca đỏ ở 4 tệp:** `minibar-m1`, `reversal-debt-g4`, `s438r4-money`, `reservations`. Kiểu lỗi: 401 `UNAUTHENTICATED` (phiên giờ giả hết hạn khi chạy chậm), một 409 sai ngày nghiệp vụ, và ca p95 của `reservations`;
  - chạy lại đúng 4 tệp đó trên cùng bản gộp: **112/112 xanh**;
  - job "test · build" của CI cũng xanh trên `9500d251` và `23dbf6d7`.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, tỷ lệ hay số tiền hoa hồng, tên người hay dữ liệu khách. Số thẻ trong test là số thử công khai.

## Kết luận

| PR | HEAD | Kết luận | Thẻ |
|---|---|---|---|
| #160 | `9500d251` | **DUYỆT.** Gộp khi CI xanh trên đúng SHA | 0 Blocker · 0 Major · 0 Minor · 1 Suggestion (160-01) |
| #163 | `23dbf6d7` (nội dung review: commit `67baa5d0`) | **DUYỆT.** Gộp khi CI xanh trên đúng SHA, gồm E2E smoke (đang chạy lúc đọc). #158 đã gộp nên điều kiện thứ tự đã đủ | 0 Blocker · 0 Major · 0 Minor · 1 Suggestion (163-01) |

Không thẻ nào chặn gộp. Không ESC.

- SEC 148-01: sửa đúng chữ SEC đề xuất, ở cả hai chỗ. OWN chỉ có tên trong `origin_actor_ids` nay phải xác thực lại (401 `REAUTH_REQUIRED`), và `refund.paid` có `ownSelfApprovedAndPaid: true`. Test fail trên mã cũ.
- SEC 148-03: bản OWN của ca S2 có, giết được S7 và S10.
- Không thay đổi nào của #160 làm yếu S1–S8. Hai điều kiện mới chỉ **thêm** chốt (step-up, cờ), không bớt.
- #163: `cancelledFrom` chỉ FD+ thấy. Với SAL, CTV, HK và lời gọi công khai, khóa **vắng**, không phải `null`. Ba ca SEC hẹn ở #158 đều đúng qua HTTP (probe P1, P2). Hai ca do PR tự test; ca CTV `cancelReservation` mới chỉ có ở mức serializer (thẻ 163-01).

**T23 (plan §4a).** SHA SEC duyệt cho #160 là `9500d251`. Lúc cắt tag, ORC kiểm `git merge-base --is-ancestor 9500d251 <tag>`.
- Repo gộp PR bằng merge commit, nên head của PR luôn là tổ tiên của `main` sau khi gộp. Không gộp kiểu squash hay rebase cho #160: khi đó `9500d251` không còn là tổ tiên, và điều kiện T23 không kiểm được.
- Nếu BE-D2 thêm commit trước khi gộp: commit gộp `main` có `--remerge-diff` rỗng, hoặc commit chỉ đổi `pr-b3.md`, thì SEC giữ kết luận. Commit chạm `src` hoặc `test` khác thì gửi SEC xem lại.
- Cùng luật cho #163 với `23dbf6d7` (và `67baa5d0` trong đó).

---

## A. PR #160 – SEC 148-01, 148-03

### A.1 SEC 148-01 – OWN chỉ là người gốc thì chi theo đường "tự chi"

| Kiểm | Kết quả | Căn cứ |
|---|---|---|
| `isOwnSelfPayout` | **Đạt, đúng chữ đề xuất.** Thêm `OR $2::uuid = ANY(origin_actor_ids)` | `refunds.service.ts` dòng 716–725 |
| `ownSelf` trong `payOut` | **Đạt, đúng chữ đề xuất.** Thêm `\|\| (row.origin_actor_ids ?? []).includes(actor.userId)`, vẫn chỉ khi `ownerTransfer` | dòng 808–811; cờ ở audit dòng 956 |
| Controller | **Không đổi luồng.** OWN → `isOwnSelfPayout` (giao dịch chỉ đọc, RLS theo phiên) → `assertStepUp` → rồi mới vào `uow.run`. Chỉ đổi chú thích | `refunds.controller.ts` dòng 213–222 |
| Khe giữa lúc đọc (ngoài giao dịch) và lúc khóa | **Không có khe mới.** `origin_actor_ids` chỉ ghi lúc INSERT: trigger của migration 0085 chặn mọi UPDATE cột này. Cột `NOT NULL DEFAULT '{}'`, nên `ANY` không gặp `NULL` | `0085_settled_reduction_a32_refund.sql` |
| Phạm vi | **Đúng như BE-D2 ghi.** `refundRouting` bỏ người làm A32 là OWN (`actor_role <> 'owner'`). Vì vậy điều kiện mới chỉ chạm OWN ghi tiền sau khi đóng đơn. Kể cả nếu phạm vi rộng hơn, điều kiện chỉ thêm step-up và cờ, không mở thêm quyền nào | `folio.service.ts` `refundRouting` |
| Không lộ gì | Cờ là boolean, nằm trong allowlist audit `payment` (`audit-entities.ts`). Không thêm dữ liệu tài khoản, số tiền mới hay chữ tự do. Lỗi 401 như mọi ca OWN tự chi | – |
| Test (ca P2 của SEC) | **Đạt.** `pr-b3-after-closure.test.ts` dòng 857: OWN ghi 900.000 → yêu cầu 5B-1 đứng tên OWN → MGR từ chối → MGR2 tạo lại. Test kiểm OWN có trong `origin_actor_ids` và **không** là người tạo, người duyệt hay người đặt nơi nhận. Không step-up → 401 `REAUTH_REQUIRED`, `refunded_vnd` = 0. Step-up → 201, `refund.paid` có `{recordedByRole: 'owner', ownSelfApprovedAndPaid: true}` | Đột biến mục A.4 |
| Fail trên mã cũ | **Có.** Ca 148-01 chạy với `refunds.service.ts` và `refunds.controller.ts` của `dda49347` (trước 148-01): đỏ ở dòng 903, `expected 201 to be 401`. OWN chi được mà không xác thực lại, đúng probe P2 | Mục A.4 |

Ghi chú cho PO, UXD (không phải thẻ): cờ `ownSelfApprovedAndPaid` hiện ở Nhật ký tiền là "OWN tự duyệt và chi". Từ PO 17/10, cờ đã bật cả khi OWN chỉ đặt nơi nhận. Nay cờ bật cả khi OWN chỉ là người ghi khoản thu. Nghĩa thật là "OWN chi theo đường tự chi". Nếu chủ đầu tư thấy nhãn gây hiểu nhầm khi đọc màn tuần, UXD sửa chữ. Không đổi luật.

### A.2 SEC 148-03 – bản OWN của ca S2

Test dòng 922. OWN ghi chuyển khoản 900.000 sau khi đóng đơn:
- OWN duyệt yêu cầu 5B-1 của chính mình → 403 `SELF_APPROVAL_FORBIDDEN`;
- MGR từ chối, MGR2 tạo lại → OWN có trong `origin_actor_ids`; OWN duyệt → 403 `SELF_APPROVAL_FORBIDDEN`;
- FD đặt nơi nhận `cash`, MGR duyệt → OWN chi tiền mặt → 403 `SELF_REFUND_FORBIDDEN`, `refunded_vnd` = 0.

Phần chuyển khoản (step-up, cờ) nằm ở ca 148-01. Hai đột biến sống ở #148 nay đỏ: S7 (M3), S10 (M5). Đúng thẻ.

Ca này dùng lỗ 148-02 (yêu cầu tạo lại nhận nơi nhận `cash`, 200) để tới được chốt chi tiền mặt. Test ghi rõ điều đó. Khi 148-02 được sửa ở v1.0.6, ca này sẽ đỏ và phải viết lại, đúng cách: thẻ 160-01.

### A.3 Không làm yếu S1–S8

| Điều kiện | Kết quả | Căn cứ |
|---|---|---|
| S1 – luật (a)–(d) ở máy chủ, mọi vai | Không đổi | Không có mã nào của V5-48 hay `recordAfterClosure` trong diff |
| S2 – người ghi không duyệt, không chi, kể cả yêu cầu tạo lại | **Chặt hơn.** Ngoại lệ OWN chi chuyển khoản nay có hai chốt bù của PO 17/10. Kiểm `origin_actor_ids` ở `payOut` và `assertNotSelf` không đổi. CHECK `approval_request_origin_check` (0085) vẫn là lớp thứ hai | M4, M6, M7 đỏ |
| S3 – `original_method`, không chi tiền mặt | Không đổi. Vẫn chỉ áp cho yêu cầu 5B-1 (148-02, v1.0.6) | `serverFixedDestination` không trong diff |
| S4 – "Có thể trùng", một mã ngân hàng một khoản thu | Không đổi mã. Thêm test biên (ARC 148-03: A5, A7, A8, A9, A19). Chú thích thứ tự khóa (ARC 148-04) đúng với mã: khóa tư vấn mã ngân hàng trước `doc_sequence`; nếu có deadlock thì kết thúc an toàn bằng 409 `CONCURRENT_UPDATE`, không ghi đôi | `payment.service.ts` dòng 293–299 |
| S5 – trần | Không có trong PR (ORC đã cắt) | – |
| S6 – cờ và chỗ xem | **Chặt hơn** (cờ OWN ở ca mới) | M2 đỏ |
| S7, S8 | Không đổi | – |
| SR-PAY-10 (số thẻ ở ô mã) | Không đổi. Hai lời gọi kiểm sớm ở `createReservation`, `checkOut` vẫn còn, chỉ thêm chú thích (ARC 2.1) | `reservations.service.ts`, `checkout.service.ts` |
| Test cũ | Không xóa `expect` nào. Các dòng `-` của diff test chỉ là chú thích đầu tệp và việc tách helper `otaCancelled` thành `otaBooking` + `otaCancel`. `otaCancelled` vẫn kiểm còn phải thu = N | `git diff dda49347 9500d251 -- test` |

Chú thích ARC 148-02 (`AFTER_CLOSURE_SQL` theo trạng thái **hiện tại** của đơn) ghi đúng hạn chế SEC đã chấp nhận mức Low tới v1.0.6 ở `SEC-on-arc-pr-158.md` (mục (v)). Chú thích dặn không đặt thêm quyết định lúc ghi nào lên biểu thức này. SEC đồng ý.

### A.4 Đột biến của SEC trên `9500d251`

Mỗi đột biến sửa một chỗ, chạy lại `pr-b3-after-closure.test.ts`, rồi trả mã về. Cuối cùng worktree sạch.

| # | Đột biến | Kết quả |
|---|---|---|
| OLD | `refunds.service.ts` + `refunds.controller.ts` về bản của `dda49347` (mã trước #160) | **đỏ** – ca 148-01 (`expected 201 to be 401`) |
| M1 | `isOwnSelfPayout` bỏ `OR $2::uuid = ANY(origin_actor_ids)` | đỏ – ca 148-01 |
| M2 | `ownSelf` bỏ vế `origin_actor_ids` (cờ mất) | đỏ – ca 148-01 |
| M3 | `payOut` chặn luôn OWN người gốc chi chuyển khoản (SEC S7 ở #148) | đỏ – ca 148-01 |
| M4 | `payOut` bỏ hẳn kiểm `origin_actor_ids` (SEC S6 ở #148) | đỏ – ca S2 của MGR và ca 148-03 |
| M5 | `refundRouting` bỏ OWN ghi sau khi đóng khỏi `origin_actor_ids` (SEC S10 ở #148) | đỏ – ca 148-01 và 148-03 |
| M6 | Ngoại lệ OWN áp cả tiền mặt (bỏ điều kiện `channel === 'transfer'`) | đỏ – ca 148-03 |
| M7 | `assertNotSelf` cho OWN người gốc duyệt (chỉ sửa service; CHECK 0085 vẫn còn) | đỏ – ca 148-03 |
| M8 | Controller không bao giờ đòi step-up | đỏ – ca 148-01 |

9/9 đỏ. SEC không chạy lại B1–B15 và M1–M37 của BE-D2. M1, M2, M3, M5 của SEC trùng ý với B1, B2, B3, B4 của BE-D2 và cho cùng kết quả.

## B. PR #163 – `Reservation.cancellation.cancelledFrom` (chỉ `67baa5d0`)

### B.1 Mã

| Kiểm | Kết quả | Căn cứ |
|---|---|---|
| Giá trị | Chỉ `hold` hoặc `confirmed`, đọc từ `status_before_cancel`. Giá trị khác → không có khóa. `cancellation` chỉ có khi `status = cancelled`, nên `no_show` không có cả hai | `reservation-dto.ts` dòng 213, 238–241 |
| Nơi dựng DTO | Chỉ `toReservationDto` → `dtoOf`. Mọi nơi gọi (`reservations`, `frontdesk`, `sales`, `payments`) hoặc trả qua operation có hợp đồng, nên qua serializer toàn cục, hoặc chỉ đọc nội bộ một trường khác (`channelId`, `depositRequiredVnd`, `totalRoomVnd`). `guest-portal`, `public-site` không gọi DTO này | `git grep dtoOf\|reservationView` |
| Hợp đồng | `x-visible-to` FD+ ở cả hai chỗ của `openapi-schemas.ts` (đã gộp vào `main` qua #158). `cancelReservation` 200 trả `reservation` là `$ref Reservation`, nên dùng cùng luật | `openapi-schemas.ts` dòng 982, 4316 |

### B.2 Ba ca SEC hẹn ở #158 (mục A của `SEC-on-arc-pr-158.md`)

| Ca | Test của PR | Probe SEC (HTTP, Postgres) |
|---|---|---|
| CTV `cancelReservation` giữ chỗ của mình: thân 200 có `cancellation`, **không có khóa** `cancelledFrom` | **Chưa có ở HTTP.** Chỉ có ở mức serializer (`getReservation` và schema `Reservation` với vai `collaborator`) | **P1 đạt:** 200, `reservation.cancellation` có `cancelledAt`, chuỗi thân không có `cancelledFrom`. CTV `getReservation` sau đó: như trên |
| SAL `getReservation` đơn hủy của mình | **Có** (`pr-b3c-cancelled-from.test.ts`, `not.toHaveProperty`, tức khóa vắng) | **P2 đạt**, thêm SAL `cancelReservation` giữ chỗ của mình: thân không có `cancelledFrom` |
| FD cùng đơn: thấy `hold` / `confirmed` | **Có** (OWN, MGR, FDL, FD → `confirmed`; FD → `hold`) | P1, P2: FD đọc → `hold`; FD hủy → thân 200 có `hold` |
| HK | – (không operation nào) | P1: HK `getReservation` → 403, thân không có trường |
| Công khai / không vai | Unit: `serializeSchema('Reservation', …, { roles: [] })` không có khóa | Không operation công khai hay của khách nào trả `Reservation` |

Thêm ở probe:
- **P1:** 0 dòng `audit_event` (`before`/`after`) và 0 dòng `outbox_message` chứa `cancelledFrom` sau các lần hủy.
- **P3:** CTV gửi lại lệnh hủy với cùng `Idempotency-Key` → 200, `idempotent-replayed: true`, thân không có `cancelledFrom`.
  - Bảng `idempotency_key` lưu thân **trước** serializer, nên có trường này. Lúc trả lại, thân đi qua serializer theo người gọi (`serialize.interceptor.ts`).
  - Đây là thiết kế đã có, cho mọi trường `x-visible-to`. #163 không đổi gì ở đây. Riêng `cancelledFrom` không phải dữ liệu khách.

### B.3 Đột biến của SEC trên `67baa5d0`

| # | Đột biến | Kết quả |
|---|---|---|
| C-S1 | DTO trả `cancelledFrom: null` cho giá trị khác | đỏ (unit "key absent, never null") |
| C-S2 | `openapi-schemas.ts`: thêm `collaborator` vào `v` của `Reservation` | đỏ (unit `collaborator`, schema `Reservation`). **Không ca HTTP nào đỏ** – thẻ 163-01 |
| C-S3 | Serializer trả `null` thay vì bỏ khóa cho trường `v` bị ẩn | đỏ (5 ca, gồm ca HTTP của SAL) |

BE-D2 đã chạy C1–C7 (bỏ trường, bỏ điều kiện, đảo `hold`/`confirmed`, bỏ `v` ở từng bản, thêm SAL). SEC không chạy lại.

---

## Thẻ

### FB-R5-SEC-BE-160-01
- Mức độ: Suggestion
- Người nhận: BE làn 5B-2 (PR sửa SEC 148-02 / DOM 148-03 ở v1.0.6), QA biết. Không chặn #160.
- Vị trí: `test/integration/pr-b3-after-closure.test.ts` dòng 922, ca "FB-R5-SEC-BE-148-03 – S2 with an OWN recorder …", bước `refund-destination` `cash` → `expect(...).toBe(200)`.
- Vấn đề:
  - Ca này cần lỗ 148-02 để tới được chốt "người gốc không chi tiền mặt": test **khẳng định** yêu cầu tạo lại nhận nơi nhận `cash` (200).
  - Khi luật S3 mức folio lên ở v1.0.6, bước này sẽ đỏ (409). Người sửa có thể "sửa test" bằng cách đổi chỗ khác để có lại 200, tức là nới lại S3. Hoặc xóa luôn phần chi tiền mặt, và chốt `SELF_REFUND_FORBIDDEN` cho người gốc ở `executeCashRefund` mất test.
- Vì sao quan trọng: chốt chi tiền mặt cho người gốc là lớp thứ hai sau S3. Sau v1.0.6, đường HTTP thường không còn tới được chốt này, nên rất dễ mất test.
- Đề xuất sửa (trong PR 5B-2):
  - đổi bước này thành: đặt `cash` → **409**, và chi tiền mặt → **409**, như ca P1 của SEC ở `contract-0.3.13.md` 1.26 (x) (thẻ 158-04);
  - giữ chốt người gốc bằng một ca riêng: dựng yêu cầu có nơi nhận `cash` bằng câu SQL của fixture (như các ca khác dựng trạng thái), hoặc test service `payOut` với `channel = 'cash'`. Kiểm OWN người gốc → 403 `SELF_REFUND_FORBIDDEN`, `refunded_vnd` = 0;
  - giữ đột biến B15 của BE-D2 (người gốc chi tiền mặt) đỏ.
- Trạng thái: Open

### FB-R5-SEC-BE-163-01
- Mức độ: Suggestion
- Người nhận: BE-D2 (trong #163 nếu còn sửa, không thì PR test kế tiếp), QA biết. Không chặn #163.
- Vị trí: `test/integration/pr-b3c-cancelled-from.test.ts`.
- Vấn đề:
  - `SEC-on-arc-pr-158.md` mục A hẹn ba ca HTTP. Ca CTV `cancelReservation` chưa có. Thân 200 của operation này bọc `Reservation` trong `reservation`, và đây là chỗ chính CTV thấy `cancellation`.
  - Vai CTV mới chỉ được kiểm ở mức serializer. Đột biến C-S2 (thêm `collaborator` vào `v`) chỉ làm đỏ unit, không ca HTTP nào đỏ.
  - Probe P1 của SEC cho thấy hành vi đúng. Thiếu là thiếu test, không phải lỗi.
- Vì sao quan trọng: unit test đọc `openapi-schemas.ts` đúng như sinh hôm nay. Ca HTTP giữ luật "CTV không thấy" kể cả khi sau này `cancelReservation` có bản phẳng riêng (như `changeRoom`), hoặc thân đổi cách bọc.
- Đề xuất sửa: thêm một ca, giống probe P1:
  - CTV tạo giữ chỗ (`createHold` với vai `collaborator`), rồi CTV gọi `cancelReservation` → 200;
  - `reservation.cancellation` có `cancelledAt`, `expect(res.body).not.toContain('cancelledFrom')`;
  - CTV `getReservation` → như trên; FD đọc cùng đơn → `cancelledFrom: 'hold'`.
- Trạng thái: Open

---

## Trạng thái thẻ SEC liên quan

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-BE-148-01 (Minor, trước tag) | **Done** ở #160 @ `9500d251` → **Closed** khi #160 gộp |
| FB-R5-SEC-BE-148-03 (Suggestion) | **Done** ở #160 → **Closed** khi #160 gộp |
| FB-R5-SEC-BE-148-02 (Minor) | Deferred v1.0.6 (0.3.14 (x)), không đổi. Thêm 160-01 cho test của PR đó |
| SEC #158 mục A (ca HTTP của PR DTO) | Hai trên ba ca có test HTTP; ca CTV: 163-01 |

ESC mới: **không**.

## Điểm làm tốt

- Hai điều kiện sửa đúng từng chữ SEC đề xuất. Test kiểm luôn rằng OWN **chỉ** là người gốc, nên ca test thật sự đi qua nhánh mới, không đi tắt qua `requested_by`.
- Mỗi thẻ một commit; chú thích sửa lại câu sai cũ ("không quyết định lúc ghi nào đọc biểu thức này") thay vì để nguyên.
- #163 giữ luật "khóa vắng, không `null`" ở cả DTO lẫn test, và dùng `x-visible-to` sinh từ hợp đồng thay vì tự lọc trong mã.

## Dòng decision-log (ORC ghi)

| 2026-11-07 | 5 | **SEC – review BE-D2 PR #160 (r5-b3b, PR-B3b) @ 9500d251: DUYỆT; PR #163 (r5-b3c, PR-B3c) @ 23dbf6d7 (nội dung 67baa5d0): DUYỆT. Gộp mỗi PR khi CI xanh trên đúng SHA (E2E smoke #163 đang chạy lúc đọc).** #160: SEC 148-01 đúng chữ đề xuất ở cả hai chỗ (isOwnSelfPayout thêm OR $2::uuid = ANY(origin_actor_ids); ownSelf thêm origin_actor_ids) → OWN chỉ là người gốc chi chuyển khoản phải step-up (401 REAUTH_REQUIRED), refund.paid có ownSelfApprovedAndPaid; origin_actor_ids chỉ ghi lúc INSERT (trigger 0085) nên không có khe giữa lúc đọc ngoài giao dịch và lúc khóa; test fail trên mã cũ (dòng 903, expected 201 to be 401). SEC 148-03 có bản OWN của ca S2, giết S7 và S10. Diff chỉ thêm chốt; 5 tệp src khác chỉ chú thích; không xóa expect nào; S1–S8 và SR-PAY-10 không yếu đi. 8 đột biến SEC + mã cũ: 9/9 đỏ. 148-01, 148-03 Done → Closed khi #160 gộp. T23: SHA SEC duyệt 9500d251 phải là tổ tiên của tag; gộp bằng merge commit, không squash/rebase; commit thêm chỉ gộp main (remerge-diff rỗng) hoặc chỉ pr-b3.md thì SEC giữ kết luận, chạm src/test thì gửi SEC xem lại. #163: cancelledFrom chỉ hold/confirmed từ status_before_cancel, x-visible-to FD+; SAL, CTV, HK, công khai: khóa vắng, không null; probe HTTP: CTV cancelReservation + getReservation, SAL cancelReservation + getReservation không có trường, FD thấy hold, HK 403; 0 dòng audit_event/outbox_message chứa trường; idempotency_key lưu thân trước serializer nhưng lần gửi lại đi qua serializer theo người gọi (thiết kế cũ, không đổi). 3 đột biến SEC đỏ. 23dbf6d7 = gộp main c82802a8, remerge-diff rỗng, cây trùng bản gộp thử của SEC. Gộp thử main + #160 + #163: tsc sạch, API Vitest xanh sau khi chạy lại 4 tệp đỏ vì máy tải nặng (p95, phiên giờ giả). Thẻ: 160-01 Suggestion BE 5B-2 (khi sửa 148-02 ở v1.0.6, ca 148-03 đổi thành đặt cash → 409, chi tiền mặt → 409, và giữ chốt người gốc không chi tiền mặt bằng ca riêng, không nới S3); 163-01 Suggestion BE-D2/QA (thêm ca HTTP CTV cancelReservation và getReservation, kiểm chuỗi thân không có cancelledFrom). Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-d2-prs-160-163.md |
