# ARC review BE-D2 PR #160 (`r5-b3b`) và PR #163 (`r5-b3c`)

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR:
  - [#160](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/160), nhánh `r5-b3b`, nháp, head **`9500d251`**. Sửa theo review #148 (SEC 148-01, 148-03; ARC 148-01…04, ghi chú ARC 2.1). CI 9/9 job xanh trên đúng SHA, kể cả `docker images build · E2E smoke`.
  - [#163](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/163), nhánh `r5-b3c`, nháp, head lúc giao việc **`67baa5d0`**. `Reservation.cancellation.cancelledFrom` theo bổ sung 1j. ARC chỉ review commit `67baa5d0`; commit gộp `1602f1ca` (nhánh #158 @ `9d0b3c62`) chỉ để CI có tệp sinh. Trong lúc review, #158 gộp (`ff3ee4be`) và BE-D2 gộp `main` vào nhánh: head mới **`23dbf6d7`**, không đổi nội dung của `67baa5d0` (mục 6).
- Đối chiếu:
  - `ARC-on-be-d2-pr-148.md` (thẻ 148-01…04, mục 2.1, 2.4, 4.2), `SEC-on-be-d2-pr-148.md` (thẻ 148-01, 148-03);
  - `rounds/round-05/outputs/BE/pr-b3.md` mục 10, mô tả hai PR;
  - hợp đồng bổ sung 1j trên nhánh #158 @ `9d0b3c62`: `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.31, `openapi.yaml` `Reservation.cancellation.cancelledFrom`;
  - `plan.md` mục 4a T21, T23.
- Cách kiểm:
  - ref riêng `refs/arc-review/pr160`, `pr163`, `pr158` (lấy bằng `git fetch origin pull/<n>/head`); hai worktree tạm trong scratchpad, mỗi PR một cây gộp thử. Không checkout nhánh PR trong thư mục chính, không push vào nhánh PR.
  - PostgreSQL 17 tạm (cùng image và digest như CI): container `ottimo-arc160-pg`, chỉ nghe `127.0.0.1`, mật khẩu là mật khẩu CI công khai của repo. Database riêng cho từng lần chạy đủ và một database cho đột biến.
  - Container, worktree và ref tạm đã xóa sau review. Không gọi staging hay production. Tệp này không có bí mật, số hoa hồng hay dữ liệu khách. Số tiền trong tệp là số thử của fixture.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Ghi chú gộp | Thẻ ARC |
|---|---|---|---|
| **#160 @ `9500d251`** | **DUYỆT** | Bỏ nháp khi SEC duyệt (SEC 148-01, 148-03 là thẻ của SEC). Gộp bằng merge commit. Plan T23: tag có #148 thì phải có #160; kiểm lúc cắt bằng SHA SEC duyệt | 160-01, 160-02, 160-03 (Suggestion) |
| **#163 @ `67baa5d0`**, head mới **`23dbf6d7`** | **DUYỆT** | #158 đã gộp (`ff3ee4be`). Head mới `23dbf6d7` chỉ gộp `main`: `git diff origin/main...23dbf6d7` đúng 3 tệp của `67baa5d0`, cùng blob; CI 9/9 xanh trên `23dbf6d7`. Gộp được ngay, trước PR Desk 5B-1 (FE-A) | Không thẻ |

- #160: cả 6 commit thẻ làm đúng điều review #148 xin (mục 1). Mã chỉ đổi hai điều kiện ở `refunds.service.ts`, không thêm khóa, không đổi thứ tự khóa (mục 2). Không migration, không đổi hợp đồng.
- #160 gộp thử với `main` @ `f63afee0`: không xung đột; `tsc` sạch; toàn bộ API Vitest xanh, trừ một ca hết giờ vì máy tải nặng, chạy riêng thì xanh (mục 3).
- #160 đột biến: ARC kiểm lại 4 đột biến của BE-D2 (B1, B2, B3, B5), cả 4 đỏ. ARC chạy thêm 9 đột biến khác B1–B15: 3 đỏ, 6 sống (mục 4). Cả 6 là thiếu ca biên, không phải lỗi mã → 3 thẻ Suggestion, không chặn gộp, không chặn tag.
- #163 khớp 1j ở mọi điểm (mục 5). 17 ca mới xanh; 5 đột biến của ARC đều đỏ; toàn bộ API Vitest trên cây gộp `main` + #158 + `67baa5d0` xanh trừ các ca hết giờ do tải, chạy lại hoặc đối chứng cho thấy không do PR (mục 6).

---

## 1. #160 – đối chiếu từng thẻ

| Thẻ (review #148) | Commit | Review #148 xin | #160 làm | ARC |
|---|---|---|---|---|
| **SEC 148-01** (Minor, trước tag) | `1699caec` | `isOwnSelfPayout` thêm `OR $2::uuid = ANY(origin_actor_ids)`; `ownSelf` thêm `origin_actor_ids`; ca P2 của SEC: 401 không step-up, 201 + cờ có step-up | Đúng hai điều kiện, đúng chỗ. Ca mới: OWN ghi chuyển khoản 900.000 → yêu cầu 5B-1 đứng tên OWN; MGR từ chối, MGR2 tạo lại; ca kiểm OWN không là người tạo, người duyệt hay người đặt nơi nhận, chỉ là người gốc; chi không step-up → 401 `REAUTH_REQUIRED`, `refunded_vnd = 0`; step-up rồi chi → 201, audit `refund.paid` có `ownSelfApprovedAndPaid: true` | Đúng về kỹ thuật. Quyết là của SEC. Ghi chú phạm vi của BE-D2 đúng: OWN làm A32 không vào `origin_actor_ids` (`refundRouting` lọc `actor_role <> 'owner'`, `submitStayRefund` nguồn `a32` chỉ chạy cho người dưới OWN), nên điều kiện mới chỉ chạm OWN ghi tiền sau khi đóng. `origin_actor_ids` chỉ ghi lúc INSERT (trigger của 0085), nên kiểm trước ở controller và kiểm dưới khóa ở `payOut` luôn thấy cùng một mảng |
| **ARC 148-01** (Minor, trước tag) | `1699caec` | P1: đảo khoản chuyển khoản sau khi đóng → yêu cầu 5B-1 `cancelled`, không yêu cầu mới, `closed_reservation_credit` đóng. P2: MGR ghi `card_pos` trước khi hủy, đồng hồ tiến, FD ghi sau khi đóng → `origin_actor_ids = [FD]`, MGR duyệt 200. Ghi chú đồng hồ ở đầu tệp | Đủ cả ba. P1 kiểm thêm folio còn phải thu lại đúng 500.000. P2 kiểm `afterClosure` của khoản trước khi hủy không bật, N = 400.000, yêu cầu 200.000 | **Done.** A1 của ARC (= B5) nay đỏ ở P2; R7 (đổi lý do hủy) đỏ ở P1. Đóng thẻ khi #160 gộp |
| SEC 148-03 (Suggestion) | `a696030f` | Bản OWN của ca S2: OWN duyệt → 403; OWN chi tiền mặt → 403; chi chuyển khoản theo 148-01 | Đủ. OWN duyệt yêu cầu 5B-1 của mình và yêu cầu MGR2 tạo lại → 403 `SELF_APPROVAL_FORBIDDEN`; OWN chi tiền mặt → 403 `SELF_REFUND_FORBIDDEN`, chưa chi đồng nào | Đúng. Quyết là của SEC. Ca dùng lỗ SEC 148-02 (yêu cầu tạo lại nhận nơi nhận `cash`, 200) để kiểm chốt chi tiền mặt, có chú thích. Khi 5B-2 làm SEC 148-02 (v1.0.6), câu đó thành 409: phải đổi ca, giữ câu "OWN người gốc không chi tiền mặt" bằng đường khác (mục 7) |
| **ARC 148-02** (Minor) | `eea96017` | Sửa chú thích `AFTER_CLOSURE_SQL`: có một quyết định lúc ghi đọc nó (`refundRouting`, S2, dưới L3); đơn khôi phục đọc `false`; 5B-2 thay bằng dấu lưu lúc ghi | Đúng, ở ba chỗ: `AFTER_CLOSURE_SQL`, `PaymentRowLite.after_closure`, `refundRouting`. Chú thích dặn không đặt thêm quyết định lúc ghi nào lên biểu thức này | **Done** phần BE-D2. Một chữ chưa đủ: "chỉ MGR là người ghi mới có lợi" – OWN cũng duyệt hoàn (thẻ 160-03). Phần chữ hợp đồng 1e là việc ARC ở 0.3.14 |
| ARC 148-03 (Suggestion) | `3b6093a9` | Năm câu kiểm biên: A8 (25 giờ), A7 (cùng đơn), A19 (thẻ, tiền mặt), A9 (khoản trước khi đóng), A5 (báo đã `handled`); sửa tên tệp ở đầu `v5-48-closed-booking-money.test.ts` | Đủ năm câu, gộp trong một ca có đồng hồ riêng; A19 có ca đối chứng (khoản chuyển khoản ở đơn thứ ba thì có cờ); A8 có cặp cùng giờ có cờ cho nhau. Tên tệp đã sửa | **Done.** B8–B13 của BE-D2 đỏ. Đột biến mới của ARC còn sống ở cùng vùng: khung một phía, khung 23 giờ, VietQR (thẻ 160-01) |
| ARC 148-04 (Suggestion) | `42f65f96` | Một dòng chú thích ở `recordManual`: thứ tự khóa và điều kiện để không deadlock | Đúng chữ ARC đề xuất: L1/L3 → khóa tư vấn `bank-ref` → `doc_sequence`; giao dịch ghi khoản có mã phải ghi trước khi cấp số `payment` khác; ngược lại 40P01 → 409 `CONCURRENT_UPDATE`, không ghi đôi | **Done** phần BE-D2. `architecture.md` là việc ARC ở 0.3.14 |
| Ghi chú ARC 2.1 (không phải thẻ) | `3162abf0` | Chú thích ở hai lời gọi kiểm sớm 1i tương đương | Đúng, ở `createReservation` và `checkOut`, nêu M34/A16 và M36/A15 | Done |

Ba commit sau cùng:
- `f5908503` gộp `main` @ `dda49347`. ARC dựng lại phép gộp `3162abf0` + `dda49347` bằng `git merge-tree`: cây trùng đúng cây của `f5908503` (`3e5eb8b1`). Không có sửa tay trong commit gộp.
- `1c407143`, `9500d251` chỉ sửa `rounds/round-05/outputs/BE/pr-b3.md`.
- `git diff dda49347 9500d251`: 8 tệp `product/` (6 tệp `src`, chỉ `refunds.service.ts` đổi mã; 2 tệp test) và `pr-b3.md`. Không migration, không `openapi.yaml`, không tệp sinh, không `strings.js`.

Không làm trong #160, đúng như ORC dời v1.0.6: SEC 148-02 (S3 mức folio, cùng DOM 148-03), yêu cầu thay thế "pha trộn", câu 409 của `executeRefund`. DOM 148-07 (chữ `detail` của 409) không có trong danh sách ORC giao; ARC ghi vào danh sách 0.3.14 cùng 5B-2 (mục 8).

---

## 2. #160 – thứ tự khóa

**Không đổi.** #160 không thêm khóa, không đổi chỗ khóa:
- `isOwnSelfPayout` vẫn là một câu đếm chỉ đọc, chạy trong giao dịch `readOnly` riêng ở controller, trước unit of work. Không `FOR UPDATE`. Chỉ thêm một điều kiện vào `WHERE`.
- `ownSelf` là phép tính thuần, chạy sau khóa folio rồi khóa yêu cầu (thứ tự ARC-BE-S3-25: folio → approval), như trước.
- Không có cửa đua giữa kiểm ở controller và kiểm dưới khóa cho điều kiện mới: `origin_actor_ids` chỉ ghi lúc INSERT (trigger 0085 ném lỗi khi UPDATE đổi cột này).
- `42f65f96` chỉ là chú thích. ARC chạy đối chứng K1 trên cây gộp thử: chuyển `assertBankReferenceFree` ra sau `allocate(tx, 'payment')` → ca đua ARC-15 của `pr-b3-bank-reference.test.ts` **đỏ**. Ca đó vẫn giữ đúng thứ tự mà chú thích mô tả.
- Câu "không đường v1.0.5 nào cấp số trước" của chú thích vẫn đúng trên `main` @ `f63afee0`:
  - vẫn đúng 6 chỗ gọi `allocate(tx, 'payment')` như lúc review #148 (`refunds.service.ts`, `payments.service.ts` ×2, `payment.service.ts`, `folio.service.ts` ×2 trong `syncOtaCollect`);
  - `checkOut` vẫn ghi `finalPayment` (`recordInTx`, dòng 1377) trước `resyncOtaCollect` (dòng 1413);
  - các thay đổi `main` từ `a5911138` tới nay (#154, #157, #145, #159) không thêm chỗ cấp số nào.

---

## 3. #160 – gộp thử và chạy đủ bộ API

- `refs/arc-review/pr160` (`9500d251`) gộp `origin/main` @ `f63afee0`. Git tự gộp `folio.service.ts` và `reservations.service.ts`, không xung đột.
  - Từ `f63afee0` tới `main` lúc viết (`dcb3ac50`): tài liệu, review và hợp đồng #158 (`openapi.yaml`, hai tệp sinh). Không đổi mã `src` nào #160 chạm. `git merge-tree` của #160 với `dcb3ac50`: sạch. Kết quả dưới vẫn áp.
- `pnpm install --frozen-lockfile`, dựng gói phụ thuộc của API, `tsc -p tsconfig.json --noEmit` (src + test): **sạch**.
- `vitest run` toàn bộ API trên PostgreSQL 17 tạm (vai `ottimo_app`, migration bằng `ottimo_migrator`, database bootstrap riêng): **220 tệp qua, 1 hỏng, 2 tự bỏ qua; 5.216 ca qua, 1 hỏng, 19 bỏ qua, 1 todo** (617 s).
  - Ca hỏng: `guard-s3.test.ts` "SEC-BE-35: 600 requests per user and minute…" hết giờ 30 s. Lúc đó máy chạy thêm test #163 và các container của làn khác. Chạy lại riêng tệp đó trên cùng cây, cùng database: **4/4 xanh**. #160 không chạm guard hay `shared/http`. Như vậy là chập chờn do tải, không do PR.
  - Số ca lớn hơn số BE-D2 báo (5.208 trên `f5908503`) vì `main` đã có thêm #145, #159 và các PR khác.
- `pr-b3-after-closure.test.ts` trên cây gộp: 18/18 xanh (5 ca mới).

---

## 4. #160 – đột biến

Chạy trên cây gộp thử, mỗi lần một chỗ sửa, database riêng, rồi trả mã về (`git status` sạch sau mỗi lần). Tệp chạy mặc định: `pr-b3-after-closure.test.ts` (18 ca). Đột biến nào sống thì chạy lại trên mọi tệp test liên quan (cột cuối).

### 4.1 Kiểm lại đột biến của BE-D2

| # | Đột biến | Kết quả |
|---|---|---|
| V-B1 | `isOwnSelfPayout` bỏ điều kiện `origin_actor_ids` | đỏ (ca SEC 148-01) |
| V-B2 | `ownSelf` bỏ điều kiện `origin_actor_ids` | đỏ (ca SEC 148-01) |
| V-B3 | `payOut` chặn luôn OWN người gốc chi chuyển khoản (A3 của ARC, S7 của SEC) | đỏ |
| V-B5 | `refundRouting` thêm mọi người ghi của folio (A1 của ARC) | đỏ (P2) |

Khớp bảng B1–B15 của `pr-b3.md` mục 10.

### 4.2 Đột biến mới của ARC

| # | Đột biến | Kết quả | Tệp đã chạy khi sống |
|---|---|---|---|
| R1 | "Có thể trùng": khung chỉ một phía (`p.received_at − 24 h` … `p.received_at`). Khoản ghi **trước** không nhận cờ từ khoản ghi sau | **sống** → 160-01 | 8 tệp có `possibleDuplicateCodes` / `bankReference` (410 ca) |
| R2 | Khung 24 giờ → 23 giờ (hai phía) | **sống** → 160-01 | như R1 |
| R3 | Khoản trùng chỉ tính `bank_transfer`, bỏ `vietqr` | **sống** → 160-01 | như R1 |
| R4 | Khoản VietQR không bao giờ nhận cờ | **sống** → 160-01 | như R1 |
| R5 | `isOwnSelfPayout` mất ngoặc: `(… id = $1 AND type = 'refund' AND (…)) OR $2 = ANY(origin_actor_ids)` – OWN là người gốc ở **bất kỳ** yêu cầu nào thì mọi lần chi chuyển khoản đều đòi step-up | **sống** → 160-02 | + `approvals-refund-payout`, `payments-s3` (68 ca) |
| R6 | `reconcileRefundsAfterReversal` chỉ đóng `closed_reservation_credit` khi đơn `cancelled`, bỏ `no_show` | **sống** → 160-02 | 12 tệp có `closed_reservation_credit` (121 ca) |
| R7 | Đảo khoản: yêu cầu đi kèm hủy với lý do `no_show_restored` thay vì `superseded` | đỏ (P1) | – |
| R8 | `AFTER_CLOSURE_SQL`: `created_at >= cancelled_at` → `>` | đỏ (ca SEC 148-01, SEC 148-03) | – |
| K1 | Đối chứng thứ tự khóa: khóa tư vấn `bank-ref` sau `doc_sequence` | đỏ (ca đua ARC-15) | – |

- R5 sai theo chiều chặt (đòi step-up nhiều hơn, cờ vẫn đúng vì `ownSelf` tính riêng dưới khóa). Không có lỗ tiền. Thẻ 160-02 chỉ xin một ca đối chứng.
- R8 đỏ là tốt: ca mới ghim nghĩa `>=` mà ghi chú đầu tệp nói tới.

### 4.3 Ca ARC viết thử (P3)

ARC chép vào cuối `pr-b3-after-closure.test.ts`, chỉ trong worktree tạm. Ca dùng fixture và đồng hồ giả của tệp:
- 02/12 09:00: FD ghi chuyển khoản 666.000 trên đơn `f1`;
- 03/12 08:30 (cách 23 giờ 30 phút): FD ghi chuyển khoản 666.000 trên đơn `f2`;
- kiểm: khoản của `f1` có `possibleDuplicateCodes = [f2]`, khoản của `f2` có `[f1]`.

P3 **xanh** trên mã hiện tại, và làm **đỏ cả R1 lẫn R2**. Lần viết đầu ARC đặt hai khoản cách đúng 23 giờ: R2 vẫn sống, vì `BETWEEN` lấy cả hai đầu mút. Ca biên phải nằm giữa 23 và 24 giờ.

---

## 5. #163 – đối chiếu bổ sung 1j

| Điểm 1j (`contract-0.3.13.md` 1.31, `openapi.yaml`) | `67baa5d0` | Kết quả |
|---|---|---|
| Trường `Reservation.cancellation.cancelledFrom`, `enum [hold, confirmed]` | `cancelledFrom(row)` trải vào `cancellation`, chỉ trả `hold` hoặc `confirmed` | Khớp |
| Đọc từ `reservation.status_before_cancel`, không migration | Đọc thẳng cột. Cột và CHECK `cancelled`/`no_show` → `hold` \| `confirmed` có từ 0013; `RESERVATION_COLUMNS` đã chọn cột | Khớp. Không có migration |
| Vắng khi đơn chưa hủy; `no_show` không có `cancellation` | `cancellation` vẫn chỉ có khi `status = 'cancelled'` và có `cancelled_at`. Mọi giá trị khác của cột → không có khóa, không bao giờ `null` | Khớp. Đơn đã khôi phục (B12, 5B-2) có `status` khác `cancelled`, nên không lộ giá trị cũ của cột |
| `x-visible-to` FD+ (`owner, manager, front_desk_lead, front_desk`) | Không lọc trong DTO. Serializer theo vai đọc `v` sinh từ #158, ở cả hai bản của schema (`Reservation` và bản chép trong câu trả lời `changeRoom`) | Khớp. ARC chạy `pnpm gen:openapi` trên cây gộp: tệp sinh không đổi |
| Desk: `hold` → `deposit`, còn lại → `charge`; gửi sai vẫn 422 | Cùng cột với `afterClosureType` của máy chủ (`statusBeforeCancel === 'hold' ? 'deposit' : 'charge'`) | Khớp. Desk và máy chủ không thể lệch nhau: thiếu trường thì Desk gửi `charge`, máy chủ cũng chọn `charge` |
| Không mã lỗi mới | Không | Khớp |

Ngoài 1j:
- `toReservationDto` chỉ được gọi ở một chỗ (`reservations.service.ts`). Không có bộ dựng `cancellation` nào khác cho `Reservation`. Các `cancellation` khác trong tệp sinh là `CancellationQuote` của lệnh hủy, không liên quan.
- API không có trả lời 304 theo `ETag` cho `getReservation`, nên sau khi lên bản, Desk không giữ thân cũ thiếu trường.
- SAL và CTV không cần trường này: ghi tiền trên đơn đã đóng chỉ FD+ (V5-48), sale dùng `createDepositNotice`.

---

## 6. #163 – test, đột biến, gộp thử

- Commit gộp `1602f1ca` = `acda7f83` (main) + `9d0b3c62` (#158). ARC dựng lại bằng `git merge-tree`: cây trùng (`05546cff`). Ngoài phép gộp, PR chỉ có `67baa5d0`: 3 tệp, +313 dòng, không xóa dòng nào.
- Head mới `23dbf6d7` (sau khi #158 gộp): `git diff origin/main...23dbf6d7` chỉ có 3 tệp, blob trùng từng tệp với `67baa5d0`; giữa `ff3ee4be` (#158 gộp) và `23dbf6d7`, `openapi.yaml` và tệp sinh không khác.
- Gộp thử `refs/arc-review/pr163` với `origin/main` @ `f63afee0`: không xung đột. Cây này chính là trạng thái sau khi gộp theo thứ tự #158 → #163. So với `main`, `product/` chỉ khác ở `openapi.yaml`, hai tệp sinh (từ #158) và 3 tệp của `67baa5d0`.
- `tsc --noEmit` (src + test): sạch.
- Hai tệp test mới: **17/17 xanh** (13 ca đơn vị, 4 ca PostgreSQL). Ca J1, ca OTA hủy, ca không đến đọc lại `status_before_cancel` từ DB trước khi kiểm, nên ca không dựa vào giả định về dữ liệu mẫu.
- Toàn bộ API Vitest trên cây gộp, database mới: **219 tệp qua, 4 hỏng, 2 tự bỏ qua; 5.221 ca qua, 8 hỏng, 19 bỏ qua, 1 todo** (807 s). Lúc chạy, máy có tải trung bình 50–100 (khoảng 80 tiến trình Vitest của các làn khác).
  - 8 ca hỏng ở 4 tệp không liên quan đến `Reservation`: `br417-an-table`, `r3-debt-210-209`, `r8ver-01`, `guard-s3`. Dạng lỗi: hết giờ, rồi 401 `UNAUTHENTICATED` và 409 `CONCURRENT_UPDATE` ở các ca chạy sau ca hết giờ.
  - Chạy lại riêng 4 tệp: 3 tệp xanh, 73/74 ca. Còn `guard-s3` SEC-BE-35 (600 lần gọi trong 30 s) hết giờ.
  - Đối chứng: cùng ca `guard-s3` trên cây #160, cùng lúc, cũng hết giờ. Trước đó, khi máy nhẹ hơn, ca này xanh 4/4 trên cây #160. Mã `src/shared` và tệp test giống hệt nhau ở hai cây. Như vậy là do tải, không do `67baa5d0`.
  - CI của #163 xanh 9/9 job (kể cả E2E smoke) trên head mới `23dbf6d7`.
- Đột biến của ARC, khác C1–C7 của BE-D2, chạy trên hai tệp test mới:

| # | Đột biến | Kết quả |
|---|---|---|
| D1 | Giá trị khác → `cancelledFrom: null` thay vì không có khóa | đỏ |
| D2 | Suy ra từ `confirmed_at` thay vì đọc `status_before_cancel` | đỏ (2 ca) |
| D4 | Đặt trường ở gốc `Reservation` thay vì trong `cancellation` | đỏ (10 ca, cả 2 ca PostgreSQL) |
| D5 | Tệp sinh: thêm `collaborator` vào `x-visible-to` | đỏ (2 ca) |
| D8 | Nhận mọi chuỗi khác rỗng (`in_house`, `HOLD`) | đỏ |

Không thẻ cho #163.

---

## 7. Thẻ feedback

### FB-R5-ARC-BE-160-01
- Mức độ: Suggestion – BE-D2, QA biết. Không chặn gộp, không chặn tag. Làm cùng PR kế tiếp chạm `pr-b3-after-closure.test.ts`, hoặc ở làn 5B-2.
- Vị trí: `pr-b3-after-closure.test.ts`, ca "FB-R5-ARC-BE-148-03 – the edges of Có thể trùng"; `folio.service.ts` `POSSIBLE_DUPLICATES_SQL`.
- Vấn đề:
  - R1 sống: mọi cặp có cờ trong test đều ghi ở **cùng một giờ giả**. Không ca nào chứng minh khoản ghi trước nhận cờ khi khoản trùng ghi sau. Khung một phía vẫn qua cả 410 ca của 8 tệp liên quan.
  - R2 sống: có ca 25 giờ → không cờ, nhưng không có ca giữa 23 và 24 giờ → có cờ.
  - R3, R4 sống: không ca nào có khoản VietQR, dù hợp đồng (B) và `POSSIBLE_DUPLICATES_SQL` tính cả `vietqr` ở hai phía.
- Vì sao quan trọng: cờ được tính lúc đọc. Khi người duyệt mở yêu cầu hoàn 5B-1, khoản trùng có thể đã ghi **sau** khoản tiền về sau khi hủy (sale ghi cọc cho đơn mới của cùng khách muộn hơn). Khung một phía làm mất cờ đúng ở ca DOM 11.4 (i), "hoàn tiền khách đã dùng làm cọc". Đây là cảnh báo duy nhất ở máy chủ cho ca đó tới v1.0.6.
- Đề xuất sửa:
  - thêm ca P3 (mục 4.3): hai khoản cùng số trên hai đơn, cách 23 giờ 30 phút, **cả hai** có cờ của nhau. Ca này làm đỏ R1 và R2;
  - thêm một cặp có khoản VietQR (đi đường `createVietQr` → xác nhận đã nhận) cùng số với một khoản chuyển khoản ở đơn khác → cả hai có cờ (R3, R4).
- Trạng thái: Open

### FB-R5-ARC-BE-160-02
- Mức độ: Suggestion – BE-D2, QA biết.
- Vị trí: `pr-b3-after-closure.test.ts` (ca SEC 148-01, ca ARC 148-01 P1); `refunds.service.ts` `isOwnSelfPayout`; `folio.service.ts` `reconcileRefundsAfterReversal`.
- Vấn đề:
  - R5 sống: không ca nào ghim phạm vi `id = $1` của câu `isOwnSelfPayout` mới. Mất ngoặc thì OWN là người gốc ở một yêu cầu bị đòi step-up ở mọi yêu cầu khác. Sai theo chiều chặt, không lộ tiền, nhưng OWN bị hỏi mật khẩu mà không hiểu vì sao.
  - R6 sống: P1 chỉ có đơn `cancelled`. Nhánh `no_show` của việc đóng `closed_reservation_credit` sau khi đảo khoản không có ca ở cả 12 tệp liên quan. Bỏ nhánh này thì đơn không đến có khoản tiền về sau khi đóng bị đảo vẫn để lại mục "Cần chú ý" không còn đúng.
  - Ca SEC 148-03 dùng lỗ SEC 148-02 (yêu cầu tạo lại nhận nơi nhận `cash`, 200). Khi 5B-2 đóng lỗ này, câu đó thành 409 và ca phải đổi.
- Vì sao quan trọng: hai nhánh trên là mã của #148/#160 chưa có ca ghim. Người sửa ở 5B-2 (đổi `refundRouting`, `reconcileRefundsAfterReversal`) có thể làm hỏng mà không ca nào đỏ.
- Đề xuất sửa:
  - đối chứng cho R5: OWN đang là người gốc của yêu cầu A; OWN chi yêu cầu B của đơn khác (MGR tạo, MGR2 duyệt, FD đặt nơi nhận), không step-up → 201, audit `refund.paid` không có `ownSelfApprovedAndPaid`;
  - biến thể `no_show` của P1: đơn không đến, FD ghi chuyển khoản sau lúc đánh dấu, MGR đảo → yêu cầu `superseded`, `closed_reservation_credit` đóng;
  - ở PR 5B-2 làm SEC 148-02: đổi ca SEC 148-03 sang "đặt `cash` → 409", và giữ câu "OWN người gốc không chi tiền mặt" bằng một yêu cầu nơi nhận `cash` hợp lệ khác (ví dụ folio không có khoản chuyển khoản sau khi đóng).
- Trạng thái: Open

### FB-R5-ARC-BE-160-03
- Mức độ: Suggestion – BE-D2. Sửa chữ khi chạm lại tệp (5B-2 sẽ thay đoạn này).
- Vị trí: `folio.service.ts`, chú thích `AFTER_CLOSURE_SQL` (commit `eea96017`): "Accepted for v1.0.5: FD never decides a refund, so only an MGR recorder could gain".
- Vấn đề: yêu cầu hoàn do MGR+ quyết, tức cả MGR và OWN. OWN ghi tiền sau khi đóng cũng bị luật S2 chặn (ca SEC 148-03 ghim điều này). Sau khi đơn được khôi phục, OWN đó cũng duyệt được yêu cầu tạo tay. Chữ hiện tại chỉ nói MGR. Review #148 của ARC (148-02) cũng viết thiếu như vậy.
- Vì sao quan trọng: thấp. OWN là chủ đầu tư, tiền chỉ chi khi đã đối soát. Nhưng đoạn chú thích này là chỗ người làm 5B-2 đọc để biết luật S2 đang hở ở đâu. Thiếu OWN thì người đó dễ chỉ kiểm vai MGR.
- Đề xuất sửa: "FD never decides a refund, so only an MGR or OWN recorder could gain (S2); B12 is MGR+; …".
- Trạng thái: Open

---

## 8. Việc của ARC sau review này

Ghi vào danh sách 0.3.14 (mục 1.26 của `contract-0.3.13.md`), cùng PR tài liệu kế tiếp:
1. 1e: câu "quyết định lúc ghi không đọc trường này" sửa theo chú thích `eea96017`, nêu cả MGR và OWN (160-03).
2. `architecture.md`: khóa tư vấn `bank-ref` trong danh sách thứ tự khóa (148-04), chữ như chú thích `42f65f96`.
3. Thiết kế 5B-2: khi S3 lên mức folio (SEC 148-02), ca SEC 148-03 đổi như thẻ 160-02 ý 3; DOM 148-07 (chữ `detail` của 409 khi nơi nhận cố định) làm cùng.

---

## 9. Điểm làm tốt

- Mỗi thẻ một commit, thông điệp nêu đúng thẻ và đột biến nó giết. Review từng thẻ chỉ cần đọc một diff, và đối chiếu thẳng với bảng B1–B15.
- Ca SEC 148-01 tự kiểm tiền đề trước khi kiểm kết quả: OWN không là người tạo, người duyệt hay người đặt nơi nhận, chỉ là người gốc. Không có câu đó thì ca có thể xanh vì một lý do khác.
- #163 làm trường tối thiểu đúng như 1j, có ca đọc lại cột trong DB và ca serializer cho cả 6 vai, ở cả hai bản chép của schema. Mô tả PR nói rõ vì sao không được gộp trước #158.

---

## 10. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do / tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | **ARC DUYỆT BE-D2 PR #160 (`r5-b3b`, sửa theo review #148) @ `9500d251` và PR #163 (`r5-b3c`, `Reservation.cancellation.cancelledFrom`) @ `67baa5d0` / head `23dbf6d7`.** #160: 6 commit thẻ đúng điều review #148 xin – SEC 148-01 (`isOwnSelfPayout` và `ownSelf` thêm `origin_actor_ids`: OWN chỉ là người gốc chi chuyển khoản → 401 `REAUTH_REQUIRED` khi chưa step-up, 201 + cờ `ownSelfApprovedAndPaid`), ARC 148-01 (P1 đảo khoản → yêu cầu 5B-1 `superseded`, mục tín dụng đóng; P2 người ghi trước khi đóng không vào `origin_actor_ids`, MGR duyệt 200; ghi chú đồng hồ), SEC 148-03 (bản OWN của S2), ARC 148-02/148-04/2.1 (chỉ chú thích), ARC 148-03 (5 câu biên "Có thể trùng"); không migration, không đổi hợp đồng; thứ tự khóa không đổi (không khóa mới, `origin_actor_ids` chỉ ghi lúc INSERT nên không đua giữa kiểm controller và kiểm dưới khóa; đối chứng K1 đỏ; 6 chỗ cấp số `payment` như cũ); commit gộp `f5908503` trùng phép gộp tự động. Gộp thử `main` @ `f63afee0` (tới `dcb3ac50` chỉ thêm tài liệu và hợp đồng #158; `merge-tree` với `dcb3ac50` sạch): không xung đột, `tsc` sạch, API Vitest 220 tệp / 5.216 ca xanh + `guard-s3` hết giờ do tải, chạy riêng 4/4 xanh. Đột biến: V-B1/B2/B3/B5 của BE-D2 đỏ; 9 đột biến ARC: R7, R8, K1 đỏ, R1–R6 sống (khung "Có thể trùng" một phía và 23 giờ, VietQR, phạm vi `id` của `isOwnSelfPayout`, nhánh `no_show` khi đảo khoản) → ca thử P3 (cách 23 giờ 30 phút, cả hai có cờ) làm đỏ R1, R2. Thẻ 160-01, 160-02, 160-03 Suggestion; đóng ARC 148-01 khi #160 gộp; plan T23: tag có #148 phải có #160 (SHA SEC duyệt). #163: khớp 1j (`hold` \| `confirmed` từ `status_before_cancel`, vắng thay vì `null`, chỉ trong `cancellation` của đơn `cancelled`, `x-visible-to` FD+ qua serializer sinh ở cả hai bản schema, cùng cột với `afterClosureType`); 17/17 ca mới xanh, 5 đột biến ARC đỏ, API Vitest trên `main` + #158 + `67baa5d0` xanh trừ ca hết giờ do tải (chạy lại 3/4 tệp xanh, `guard-s3` hết giờ cả ở cây đối chứng); CI 9/9 xanh trên head mới `23dbf6d7` (= `main` + `67baa5d0`, cùng blob; #158 đã gộp `ff3ee4be`); gộp được ngay, trước Desk 5B-1. Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-d2-prs-160-163.md |
