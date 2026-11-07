# BE – Review PR #158 của ARC (hợp đồng 0.3.13 bổ sung 1j), hai điểm ARC hỏi BE

Round 5 · bước **Review** · BE (làn BE-D2) · 07/11/2026

## Đối tượng

- PR #158, nhánh `r5-contract-1j`, HEAD ORC giao: **`bf3070fa`**. BE đọc diff bằng `gh pr diff 158` và `git show`, không checkout nhánh.
  - Lúc review, nhánh đã có thêm `9d0b3c62` (SEC 158-01). Commit này chỉ sửa hai dòng K14 ở `contract-0.3.13.md` 1.30, ngoài phạm vi BE. Kết luận dưới đây giữ nguyên cho `9d0b3c62`.
- ORC giao hai điểm:
  1. `Reservation.cancellation.cancelledFrom` (`hold` | `confirmed`, FD+, đọc `reservation.status_before_cancel`, vắng khi chưa hủy, đơn `no_show` không có `cancellation`). Câu hỏi: làm được đúng như chữ trong `reservation-dto.ts` không?
  2. C0313-34: chữ mới nói #148 thêm `assertBankReferenceNotCardFirst` ở cả 5 bộ đọc. Câu này đúng không?
- BE đối chiếu với `main` @ `9419fbde`, gồm #148 (PR-B3), #152 và #154. Chỗ ghi trong hợp đồng:
  - `openapi.yaml` @ `bf3070fa`: dòng 11782 (`cancelledFrom`) và dòng 5927 (`recordPayment` (B), 1j C0313-34);
  - `openapi-schemas.ts` sinh ra: dòng 982 và 4316 (`changeRoom`);
  - `contract-0.3.13.md`: 879, 883 và bảng 1.31.
- Phần K14, danh sách 0.3.14 (k)–(z) và các thẻ SEC, DOM, BE-H không thuộc phạm vi này. BE chỉ xem các mục có ghi tên BE-D2.
- Tệp này không có bí mật, số thẻ hay dữ liệu khách.

## 0. Kết luận: **DUYỆT** PR #158 @ `bf3070fa` (giữ nguyên cho `9d0b3c62`)

0 Blocker · 0 Major · 0 Minor · 1 Suggestion. Không chặn gộp. Không cần ESC.

- **(1) Làm được đúng như chữ.** Không cần migration hay mã lỗi mới. BE mở PR nhỏ ngay sau review này (mục 2).
- **(2) Câu C0313-34 đúng.** Có một chỗ nói hơi rộng ở dòng C0313-31 của 1.30, sửa ở 0.3.14 nếu ARC muốn (thẻ 158-01).
- Thử gộp `origin/r5-contract-1j` với `main` @ `9419fbde` (`git merge-tree`): sạch.

## 1. Đối chiếu

### 1.1 `cancellation.cancelledFrom`

| Chữ hợp đồng | Mã trên `main` | Kết quả |
|---|---|---|
| Đọc từ `reservation.status_before_cancel`, cột đã có, không migration | Cột có từ `0013_reservations_be_a.sql`. CHECK `reservation_status_before_cancel_check`: `status` là `cancelled` hoặc `no_show` thì cột phải là `hold` hoặc `confirmed`. CHECK có từ lần tạo bảng, nên không có đơn cũ nào thiếu giá trị | **Khớp** |
| Giá trị `hold` \| `confirmed` | Năm câu lệnh đóng đơn đều ghi cột này: hủy (`reservations.service.ts` 3043, `= status`), J1 hết hạn giữ chỗ (4796, `hold`), 4887 và `stay.service.ts` 1642 (`confirmed`), `no_show` (4421, `confirmed`). Khôi phục `no_show` (4655) xóa cột | **Khớp** |
| Vắng khi đơn chưa hủy; đơn `no_show` không có `cancellation` | `toReservationDto` chỉ dựng `cancellation` khi `status = 'cancelled'` (`reservation-dto.ts` 206). `no_show` có cột là `confirmed` nhưng không có khối này | **Khớp** |
| Đọc được trong DTO | `RESERVATION_COLUMNS` đã chọn `r.status_before_cancel` (`reservation-store.ts` 100), và `ReservationRow` đã có trường này. Chỉ có một nơi dựng DTO (`reservations.service.ts` 487), dùng cho `getReservation`, `changeRoom` và các thao tác khác trả `Reservation` | **Khớp**, chỉ cần thêm một dòng |
| Chỉ FD+ (serializer bỏ với vai khác) | Serializer xét `v` (`x-visible-to`) ở mọi tầng (`propertyAllowed`, gọi cho từng thuộc tính của mọi object). `cancellation` là object đóng (`open: false`), nên khóa không khai bị bỏ. #158 sinh `v: [owner, manager, front_desk_lead, front_desk]` ở cả hai bản (982, 4316) | **Khớp**: SAL và CTV vẫn thấy `cancellation`, nhưng không có `cancelledFrom` |
| Desk: `hold` → `deposit`, còn lại → `charge`; máy chủ vẫn chặn (422 `NOT_ALLOWED` ở `type`) | `afterClosureType(statusBeforeCancel)` (`payments.service.ts` 83) trả `deposit` khi và chỉ khi giá trị là `hold`. Các ca `type` của `pr-b3-after-closure.test.ts` đã ghim điều này | **Khớp**: Desk và máy chủ đọc cùng một cột |

Thứ tự gộp:
- Trước khi #158 gộp, serializer bỏ `cancelledFrom` với **mọi** vai, vì `openapi-schemas.ts` trên `main` chưa khai trường này. Thêm trường vào DTO sớm không làm lộ gì.
- Nhưng ca "FD+ thấy" chỉ xanh khi đã có tệp sinh của #158. Vì vậy PR của BE-D2 gộp `origin/r5-contract-1j` vào nhánh để CI chạy, và phải gộp **sau** #158. Thứ tự: #158 → PR BE-D2 → PR Desk 5B-1 của FE-A, đúng như 1.31.

### 1.2 C0313-34

| Chữ 1j | Thực tế | Kết quả |
|---|---|---|
| `openapi.yaml` 5927: "PR-B3 kiểm sớm trên thân thô ở cả 5 bộ đọc (`assertBankReferenceNotCardFirst`, #148); ARC giữ lời gọi ở cả 5 (review #148 mục 2.1)" | Năm lời gọi trên `main`, mỗi lời gọi chạy trên thân thô trước khi đọc gì khác:<br>- `payments.controller.ts` 132 (`recordPayment`, `at = null`);<br>- `deposits.controller.ts` 131 (`confirmDeposit`, `payment`);<br>- `reservations.service.ts` 532 (`createReservation`, `initialPayment`);<br>- `checkin.service.ts` 598 (`checkIn`, `payment`);<br>- `checkout.service.ts` 1947 (`checkOut` `readInput`, `finalPayment`).<br>`git log -S` chỉ ra đúng một commit thêm hàm này: `e2071bc7`, thuộc #148. Hàm nhận `body: unknown` (`shared/validation.ts` 157) | **Đúng** |
| `contract-0.3.13.md` 879: "~~không đổi mã~~ (1j, C0313-34: #148 thêm `assertBankReferenceNotCardFirst` ở cả 5 bộ đọc, ARC giữ cả 5)" | Như trên | **Đúng** |
| `contract-0.3.13.md` 883: "#148 thêm kiểm sớm ở cả 5 bộ đọc để (iv) xanh" | Chỉ 3 đường cần lời gọi này để (iv) xanh: `recordPayment`, `confirmDeposit`, `checkIn`. Hai đường `createReservation` và `checkOut` vốn đã báo số thẻ trước, vì chúng gom lỗi các trường rồi mới ném lỗi số thẻ. Đột biến M34, M36 tương đương (`pr-b3.md` mục 9). Hai lời gọi này được giữ để một luật chạy ở cả 5 đường. #160 (`3162abf0`) ghi chú điều đó ngay tại chỗ gọi | **Đúng về mã**, chữ hơi rộng (thẻ 158-01) |

Ngoài hai điểm ORC hỏi, BE đọc lướt các mục 1j có tên BE:
- **C0313-38**: chữ mới khớp mã trên `main` (`payments.service.ts`, đoạn sau `afterClosureRefundVnd`):
  - khoản thu ghi trên đơn đã đóng chuyển mọi báo `open` thành `handled` (`handled_payment_id`) và đóng mục `deposit_after_cancel` trong cùng giao dịch;
  - khoản thu ghi **trước** lúc báo thì không đóng mục của báo sau.
  - Ca A5 ở #160 ghim thêm: khoản thu thứ hai không ghi đè `handled_payment_id`.
- **0.3.14 (v) và (w)**: phần BE-D2 (chú thích `AFTER_CLOSURE_SQL`, chú thích thứ tự khóa ở `recordManual`) đã làm ở #160: `eea96017` (ARC 148-02) và `42f65f96` (ARC 148-04). ARC chỉ còn phần chữ, `architecture.md`.

---

## 2. Việc BE-D2 làm tiếp

- PR nhỏ `cancellation.cancelledFrom`, nhánh mới từ `main`, gồm:
  - commit gộp `origin/r5-contract-1j`, để có tệp sinh;
  - **một** commit mã và test.
- Mã: thêm `cancelledFrom` vào `cancellation`, chỉ khi cột là `hold` hoặc `confirmed`. Nếu dữ liệu sai, khóa này vắng: không bao giờ có `null` hay giá trị lạ.
- Test:
  - mức hàm: DTO, và serializer cho cả 6 vai;
  - trên PostgreSQL:
    - đơn OTA hủy → `confirmed`;
    - giữ chỗ của SAL hết hạn qua J1 → `hold`; chính SAL đọc thì thấy `cancellation` nhưng không có `cancelledFrom`;
    - đơn `no_show` → không có `cancellation`;
    - đơn còn mở → không có `cancellation`.
- Gộp **sau** #158 và **trước** PR Desk 5B-1 của FE-A. ORC báo FE-A tên trường khi PR gộp.

---

## 3. Thẻ feedback

#### FB-R5-BE-ARC-158-01
- Mức độ: Suggestion – gửi ARC (chữ 0.3.14)
- Vị trí: `contract-0.3.13.md` 883 @ `bf3070fa`, dòng C0313-31 của 1.30: "**1j:** #148 thêm kiểm sớm ở cả 5 bộ đọc để (iv) xanh".
- Vấn đề:
  - Chỉ 3 trong 5 đường cần kiểm sớm để (iv) xanh: `recordPayment`, `confirmDeposit`, `checkIn`.
  - Ở `createReservation` và `checkOut`, kiểm sớm tương đương với mã cũ (M34, M36 sống). Lời gọi ở hai đường này chỉ để một luật chạy ở cả 5 đường.
  - Người đọc sau có thể tưởng bỏ lời gọi ở hai đường đó thì (iv) đỏ, hoặc tưởng một đột biến sống ở đó là lỗ hổng của test.
- Đề xuất sửa: khi ghi chữ 0.3.14 thì đổi thành "#148 thêm kiểm sớm ở cả 5 bộ đọc. 3 đường cần nó để (iv) xanh (`recordPayment`, `confirmDeposit`, `checkIn`); 2 đường tương đương, giữ để một luật chạy ở cả 5 (review #148 mục 2.1)". Không đổi mã, không chặn #158.
- Hạn: 0.3.14.
- Trạng thái: Open

---

## 4. Giả định đã dùng

- HEAD được review là `bf3070fa`, như ORC giao. `9d0b3c62` chỉ sửa hai dòng K14 (SEC 158-01), không chạm hai điểm trên.
- `main` @ `9419fbde` là bản đối chiếu mã. Số dòng mã là ở `main`; số dòng hợp đồng là ở `bf3070fa`.
- Mã thẻ `FB-R5-BE-ARC-158-01` theo số PR, như các thẻ của review #148.
- Không cần ESC. Điểm còn lại thuộc quyền ARC (chữ).

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **BE – review PR #158 (ARC, hợp đồng 0.3.13 bổ sung 1j) @ bf3070fa, hai điểm ARC hỏi BE-D2: DUYỆT** (giữ nguyên cho 9d0b3c62, chỉ sửa dòng K14). 0 Blocker, 0 Major, 0 Minor. (1) Reservation.cancellation.cancelledFrom làm được đúng như chữ: cột status_before_cancel có từ 0013, có CHECK (cancelled/no_show → hold|confirmed); 5 câu lệnh đóng đơn đều ghi cột; RESERVATION_COLUMNS đã chọn; một nơi dựng DTO; serializer xét x-visible-to ở mọi tầng và bỏ khóa không khai của object đóng, nên trước khi #158 gộp không lộ gì; Desk hold → deposit khớp afterClosureType của máy chủ. BE-D2 mở PR nhỏ (gộp nhánh #158 cho CI, một commit mã + test), gộp sau #158, trước PR Desk 5B-1 của FE-A. (2) C0313-34 đúng: cả 5 bộ đọc gọi assertBankReferenceNotCardFirst trên thân thô, thêm ở e2071bc7 (#148). Suggestion 158-01: "để (iv) xanh" chỉ đúng cho 3 đường (recordPayment, confirmDeposit, checkIn); createReservation, checkOut tương đương (M34/M36), sửa chữ ở 0.3.14. C0313-38 khớp mã; phần BE của 0.3.14 (v), (w) đã làm ở #160. Trial merge với main sạch. Không ESC | BE | rounds/round-05/reviews/BE-on-arc-pr-158.md |`
