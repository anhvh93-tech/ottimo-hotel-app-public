# BE – Review hợp đồng 0.3.13 bổ sung 1i (ARC, PR #152), góc người dùng hợp đồng

Round 5 · bước **Review** · BE (làn BE-D2, PR-B3) · 07/11/2026

## Đối tượng

- PR #152, nhánh `r5-contract-1i`, HEAD **`ca276f8a`**. Phần BE xem là phần của 1i chạm PR-B3:
  - `openapi.yaml` `recordPayment` (B): đoạn thứ tự lỗi (5919–5925) và danh sách test bắt buộc ở PR-B3 (5928–5945);
  - `PaymentCreate.bankReference` (13015);
  - `contract-0.3.13.md` 1.30: quyết định C0313-31, dòng C0313-31 và C0313-32 (858–867).
- ORC giao phạm vi: đối chiếu chữ C0313-31, C0313-32 với điều #148 thật sự làm, gồm thứ tự lỗi, danh sách test, và câu "`bankReference` bị bỏ qua trước PR-B3".
  - Phần 1h (`closerChangeReason`, `updateReservation`), DOM 1H, SEC 1H và C0313-33 không thuộc phạm vi này. SEC đã duyệt ở `SEC-on-contract-0313-addendum-1i.md`.
- BE đối chiếu với:
  - #148 (`r5-b3`) @ `a5911138`: mã 1i ở `e2071bc7`, CI xanh hết;
    - `shared/validation.ts`: `readBankReference` (132), `assertBankReferenceNotCardFirst` (157);
    - `payment.service.ts` `recordManual` (284);
    - các bộ đọc: `payments.controller.ts` 132, `deposits.controller.ts` 131, `reservations.service.ts` 524, `checkin.service.ts` 598, `checkout.service.ts` 1947;
    - test: `pr-b3-bank-reference.test.ts`, `pr-b3-after-closure.test.ts` 624–634;
  - `main` @ `38b12536`, cho câu "bị bỏ qua": `paymentCreateSchema` và `parseBody` (zod `z.object` bỏ khóa không khai); `checkin.service.ts` và `checkout.service.ts` `paymentInput` (1258, 2164; chỉ chép 7 trường có tên); `parseInitialPayment` (1941); `depositPayment`.
- BE chỉ đọc (`git show`, `git merge-tree`). Không sửa #152, không gọi staging hay production. Tệp này không có bí mật, số thẻ hay dữ liệu khách.

## 0. Kết luận: **DUYỆT** PR #152 @ `ca276f8a`

0 Blocker · 0 Major · 2 Minor · 3 Suggestion. Không thẻ nào chặn gộp #152 hay #148. Không cần ESC.

- Luật phương án B khớp mã #148 @ `a5911138` trên cả 5 đường. Ô mã qua kiểu và mẫu của chính ô mà giống số thẻ → 422 `CARD_NUMBER_DETECTED` một mình, trước lỗi các trường khác và trước `NOT_ALLOWED`, không ghi gì.
- Danh sách test C0313-32 (i)–(iv) đều có trong #148 và đều xanh.
- Câu "trước PR-B3 bị bỏ qua, không bị từ chối" đúng với cả 5 bộ đọc trên `main`.
- Chỗ chưa khớp chỉ nằm ở chữ mô tả. Sửa ở 0.3.14 hoặc ở delta chữ kế tiếp:
  - 1i ghi "#148 @ `d533a387` đã theo thứ tự này, PR-B3 không đổi mã". Thật ra #148 phải thêm một hàm kiểm sớm (thẻ 34). Câu này bắt nguồn từ đề xuất (B) của BE ở 1g; BE nhận phần của mình.
  - Câu "cùng luật với `posAuthCode`" rộng hơn mã (thẻ 35).
  - Chữ chưa nói kiểm sớm đứng ở đâu so với 404, 409, 412 (thẻ 36).
  - Chữ ghi "→ 201" cho cả ba đường vốn trả 200 (thẻ 37).
  - Ngoài 1i: hai câu đóng mục `deposit_after_cancel` trái nhau (thẻ 38).
- Thử gộp #152 với `main` @ `38b12536` (`git merge-tree`): sạch. GitHub lúc đọc báo `CONFLICTING`, chắc là trạng thái cũ. ARC xem lại trước khi gộp.

| Mục 1i | #148 @ `a5911138` | Kết quả |
|---|---|---|
| C0313-31 (B): số thẻ ở `bankReference` báo trước, một mình, kèm tiền tố trường | `assertBankReferenceNotCardFirst(body, at)` chạy trên thân thô, đầu tiên ở cả 5 bộ đọc. Ô phải là chuỗi qua mẫu sau khi bỏ khoảng trắng hai đầu. `readBankReference` (mẫu → số thẻ → phương thức) và kiểm chốt ở `recordManual` không đổi | **Khớp.** Thẻ 34, 35, 36 chỉ sửa chữ |
| "trước `NOT_ALLOWED` (phương thức) của chính ô" | `cash` kèm số thẻ → `CARD_NUMBER_DETECTED` ở cả 5 đường (test 533) | **Khớp** |
| "`note` giữ thứ tự hiện có của từng đường" | #148 không đổi chỗ kiểm `note` | **Khớp** |
| "`executeRefund` giữ thứ tự của #119" | #148 sửa `refunds.service.ts`, nhưng không đụng dòng nào về `bankReference` hay số thẻ ở `executeRefund` | **Khớp** |
| C0313-32 (i): SAL `recordPayment` (cọc) và SAL `confirmDeposit` trùng mã → 409, không có `duplicateReservationCode`; FD cùng ca thì có mã đơn | Có (test 231, 300) | **Khớp** |
| (ii): ca HTTP ở từng đường: số thẻ → 422 có tiền tố, không ghi gì; mã chữ thường → lưu chữ hoa; mã trùng → 409. Danh sách mức hàm ở `v09-reference-card-units.test.ts` (#119), không chép lại | Có ở cả 5 đường (187–231, 300, 395). Ca đua khóa advisory (cùng mã, khác hoa thường): một 201, một 409 (286). Mã trùng mã chi hoàn → 201 (`pr-b3-after-closure.test.ts`) | **Khớp**, trừ mã thành công (thẻ 37) |
| (iii): "Không thấy tiền" có ghi chú thiếu, ngắn hoặc chỉ ký tự ẩn → 422 `REASON_REQUIRED`, mục còn mở, không có dòng audit | Có, thêm ca chỉ khoảng trắng (624–634) | **Khớp** |
| (iv): lỗi dạng ở trường khác cộng số thẻ ở ô mã → `CARD_NUMBER_DETECTED` một mình; `cash` cộng số thẻ → không phải `NOT_ALLOWED` | Có ở cả 5 đường. Lỗi dạng gồm lỗi kiểu của zod, `type: refund`, giờ sai, `roomId` sai. Đếm lại: không có dòng nào được ghi | **Khớp** |
| (d): `GroupDepositInput` là R3 | #148 không có handler. `allocateGroupDeposit`, `createReservationGroup` chưa có controller trên `main` | **Khớp** |
| `PaymentCreate.bankReference`: trước PR-B3 bị bỏ qua, không bị từ chối | Trên `main`: `recordPayment` dùng zod `z.object`, bỏ khóa không khai. `confirmDeposit` (`depositPayment`), `checkIn`/`checkOut` (`paymentInput`) và `parseInitialPayment` chỉ chép các trường có tên. `checkPaymentShape` có đọc `raw.bankReference`, nhưng không đường HTTP nào đưa được trường này tới đó | **Đúng** |
| `ReservationCreate.initialPayment` (sửa tên từ `.payment`) | Tiền tố `initialPayment.bankReference` | **Khớp** |

Khóa: chữ ghi "khóa advisory **trước** câu kiểm trùng". #148 còn đặt khóa này trước việc cấp số `PT-` (`doc_sequence`). Đây là chi tiết cài đặt, hợp đồng không cần ghi. BE đã nêu cho ARC ở #148 (chỗ có thể deadlock: 409 `CONCURRENT_UPDATE`, không bao giờ ghi hai khoản thu). Không thành thẻ ở đây.

---

## 1. Thẻ feedback

#### FB-R5-BE-ARC-C0313-34
- Mức độ: Minor – gửi ARC (chữ, review #148)
- Vị trí: `openapi.yaml` 5921 @ `ca276f8a` ("PR-B3 giữ thứ tự này, không đổi mã"); `contract-0.3.13.md` 862 ("với #148 @ `d533a387`") và 866 ("#148 giữ mã").
- Vấn đề: ở `d533a387`, ba đường còn trả lỗi khác trước số thẻ:
  - `recordPayment`: lỗi kiểu của zod ở trường khác (zod chạy trước `checkPaymentShape`), và `type: refund` (bị từ chối sớm bằng `type` `NOT_IN_LIST`);
  - `confirmDeposit`: lỗi kiểu của zod ở `payment.*`;
  - `checkIn`: `payment` chỉ được kiểm lúc ghi, nên lỗi thân check-in, 412 và 409 trạng thái đều đi trước.
  - Viết ca (iv) ở từng đường mới thấy ba chỗ này. #148 thêm `assertBankReferenceNotCardFirst` ở `e2071bc7`: 36 dòng thêm ở 6 tệp `src`, không xóa dòng nào. `readBankReference` và kiểm chốt ở `recordManual` không đổi. Hai đường `createReservation` và `checkOut` vốn đã đúng, nên đột biến M34, M36 tương đương.
  - Câu này bắt nguồn từ đề xuất (B) của BE ở review 1g ("như #148 đang làm, không đổi mã"), viết khi chưa có ca (iv). BE nhận phần của mình.
- Vì sao quan trọng: ARC review #148 theo chữ "không đổi mã" có thể coi `e2071bc7` là việc ngoài phạm vi. Nếu bỏ hàm này thì (iv) đỏ ở 3 đường.
- Đề xuất sửa:
  - Ở 0.3.14 (chỉ chữ), thay bằng: "PR-B3 kiểm sớm trên thân thô ở cả 5 bộ đọc (`assertBankReferenceNotCardFirst`, #148)".
  - ARC xác nhận hàm này khi review #148. Có thể bỏ lời gọi ở `createReservation` và `checkOut` nếu ARC muốn, nhưng BE đề nghị giữ để một luật chạy ở cả 5 đường.
- Hạn: ARC review #148 (xác nhận mã); 0.3.14 (chữ). Không chặn #152.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-35
- Mức độ: Suggestion – gửi ARC (chữ 0.3.14), QA
- Vị trí: `openapi.yaml` 5921 ("Cùng luật với `posAuthCode` (BUG-R2-043: số thẻ trước độ dài)"); `contract-0.3.13.md` 862.
- Vấn đề:
  - Phần giống nhau thật: số thẻ báo trước lỗi độ dài hay mẫu của **chính ô**.
  - Phần "trước lỗi các trường khác, trước mọi tra cứu" chỉ có ở `bankReference`. `posAuthCode` vẫn kiểm trong `checkPaymentShape`, theo thứ tự của từng đường. Ví dụ ở `recordPayment`: lỗi kiểu zod của `amountVnd` đi trước số thẻ ở `posAuthCode`, vì zod chạy trước service.
  - #148 ghim điều này: `posAuthCode` chỉ báo số thẻ trước khi ô mã **không** phải số thẻ (test 588–592).
  - Đọc "cùng luật" theo chữ, QA có thể viết ca (iv) cho `posAuthCode`, và ca đó sẽ đỏ.
- Đề xuất sửa: thêm một câu ở 0.3.14: "Luật 'báo trước mọi lỗi khác' chỉ áp cho `bankReference`. `posAuthCode` giữ BUG-R2-043 (số thẻ trước độ dài của chính ô) và thứ tự của từng đường." Không đổi mã.
- Hạn: 0.3.14, hoặc trước khi QA viết ca thứ tự cho `posAuthCode`.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-36
- Mức độ: Suggestion – gửi ARC (chữ 0.3.14), SEC, QA
- Vị trí: `openapi.yaml` 5920–5921 ("trước lỗi của các trường khác và trước `NOT_ALLOWED`").
- Vấn đề: chữ chỉ nói về lỗi của trường. #148 kiểm trên thân thô **trước mọi tra cứu**, nên số thẻ ở ô mã cũng đi trước:
  - 404 (đơn hay folio ngoài phạm vi);
  - 409 (trạng thái): test 533 gửi `checkOut` cho một đơn `confirmed` và nhận 422 số thẻ;
  - 412 (`If-Match` ở `checkIn`, `checkOut`);
  - các 403 ở tầng service của `recordPayment` (ví dụ: vai không phải lễ tân ghi khoản khác cọc → `FORBIDDEN_ACTION`).
  - Nó chỉ đi sau 401/403 của guard (`x-roles`). Ở `checkOut`, nó đi sau cổng quá giờ V5-15 (403 trước thân, 1.18), vì `readInput` chạy sau `overdueGate`.
  - Không lộ gì: câu trả lời chỉ phụ thuộc thân yêu cầu, không phụ thuộc dữ liệu đơn. Lý lẽ giống SEC 1I-01 (lỗi dạng của thân đi trước 403).
  - QA viết ca theo chữ có thể chờ 404 hay 412 khi thân có số thẻ, trong khi máy chủ trả 422.
- Đề xuất sửa: thêm vào câu thứ tự ở 0.3.14: "kiểm trên thân yêu cầu, trước mọi tra cứu (404, 409, 412, 403 của service); sau 401/403 của guard và sau cổng quá giờ V5-15 của `checkOut`". SEC xác nhận không cần đổi thứ tự.
- Hạn: 0.3.14.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-37
- Mức độ: Suggestion – gửi ARC (chữ 0.3.14), QA
- Vị trí: `openapi.yaml` 5938, (ii): "một mã thường viết chữ thường → 201".
- Vấn đề: chỉ `recordPayment` và `createReservation` trả 201. `confirmDeposit` và `checkOut` trả 200. `checkIn` trả 200, hoặc 202 khi phải xin duyệt. Các mã này khai ở `responses` của chính hợp đồng, và test #148 kiểm đúng như vậy.
- Đề xuất sửa: "→ thành công của đường (201 `recordPayment`, `createReservation`; 200 `confirmDeposit`, `checkIn`, `checkOut`), lưu chữ hoa".
- Hạn: 0.3.14.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-38
- Mức độ: Minor – gửi ARC (chữ), DOM (xác nhận), QA. Ngoài 1i: 1i không sửa đoạn này, nhưng đoạn này rơi vào #148.
- Vị trí: `openapi.yaml` @ `ca276f8a`:
  - `recordPayment` (B), 5946: "`deposit_after_cancel` … đóng khi đã hoàn xong (hoặc đã khôi phục **và** khoản thu đã đối soát – 5B-2), hoặc 'Không thấy tiền'";
  - `createDepositNotice`, 3030: "Mục tự đóng khi đơn có khoản thu ghi sau lúc báo (5B-1, 5B-2), hoặc FD+ đóng bằng `resolveAttentionEvent`".
- Vấn đề:
  - Hai câu trái nhau. #148 theo câu ở `createDepositNotice` (DOM 11.4 mục 5): khoản thu ghi sau lúc đóng đơn sẽ đóng mục và chuyển các báo đang mở thành `handled`. Phần tiền dư thì mở `closed_reservation_credit`; mục đó đóng khi hoàn xong.
  - Câu ở (B) có vẻ gộp hai mục làm một.
  - QA viết ca 5B-1 theo câu (B) sẽ chờ `deposit_after_cancel` còn mở sau khi đã ghi khoản thu, trong khi máy chủ đóng nó.
- Đề xuất sửa: sửa câu (B) thành "`deposit_after_cancel` tự đóng khi đơn có khoản thu ghi sau lúc báo (báo → `handled`), hoặc FD+ 'Không thấy tiền'. Phần tiền dư theo `closed_reservation_credit` (đóng khi hoàn xong; 5B-2: khôi phục và đối soát)". DOM xác nhận đây đúng ý DOM 11.4 mục 5. BE đã nêu điểm này cho ARC trong mô tả #148.
- Hạn: trước khi QA viết ca 5B-1 cho v1.0.5; chữ ở 0.3.14. Không chặn #152 hay #148.
- Trạng thái: Open

---

## 2. Ảnh hưởng tới các làn

| Làn | Việc thêm | Ước |
|---|---|---|
| BE-D2 (#148) | Không. Mã và test đã khớp 1i; chờ ARC và SEC review | 0 |
| ARC | Xác nhận `assertBankReferenceNotCardFirst` khi review #148 (thẻ 34). Chữ ở 0.3.14 (thẻ 34–38) | < 0,1 ngày |
| QA | Ca thứ tự chỉ cho `bankReference` (thẻ 35, 36). Mã thành công theo đường (thẻ 37). `deposit_after_cancel` đóng khi có khoản thu (thẻ 38) | – |
| DOM | Xác nhận thẻ 38 | – |
| FE | Không. Desk hiện lỗi theo `field` và `code`, không phụ thuộc thứ tự | 0 |

---

## 3. Giả định đã dùng

- #148 @ `a5911138` là bản BE-D2 đưa review (ARC, SEC). `a5911138` chỉ thêm tài liệu trên `d7cc3c8e`; mã 1i ở `e2071bc7`. Toàn bộ API Vitest ở `d7cc3c8e`: 217 tệp, 5.170 test xanh. CI của `a5911138` xanh hết.
- `main` @ `38b12536` là bản đối chiếu cho câu "bị bỏ qua". #147 (1h) đã gộp. Phần 1h của #152 không thuộc phạm vi review này.
- Số dòng `openapi.yaml` và `contract-0.3.13.md` là ở `ca276f8a`. Số dòng mã và test là ở `a5911138`.
- Mã thẻ C0313-34…38 nối tiếp C0313-31…33 của review 1g. Trên `main` chưa có mã nào trùng.
- Không cần ESC. Mọi điểm đều thuộc quyền ARC (chữ), DOM (xác nhận thẻ 38) và QA (ca).

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **BE – review người dùng hợp đồng 0.3.13 bổ sung 1i (PR #152 @ ca276f8a), phần C0313-31/32: DUYỆT**. 0 Blocker, 0 Major. Phương án B (số thẻ ở bankReference báo trước, một mình, trước NOT_ALLOWED) khớp #148 @ a5911138 ở cả 5 đường; test C0313-32 (i)–(iv) đều có trong #148 và xanh; "bankReference bị bỏ qua trước PR-B3" đúng với cả 5 bộ đọc trên main @ 38b12536 (zod z.object, paymentInput, parseInitialPayment, depositPayment). Minor C0313-34 (chữ "#148 @ d533a387 đã theo thứ tự này, PR-B3 không đổi mã" sai: #148 phải thêm assertBankReferenceNotCardFirst trên thân thô ở e2071bc7 cho recordPayment, confirmDeposit, checkIn – ARC xác nhận khi review #148, sửa chữ ở 0.3.14; câu gốc từ đề xuất (B) của BE ở 1g). Suggestion C0313-35 (luật "báo trước mọi lỗi" chỉ cho bankReference, posAuthCode giữ BUG-R2-043 và thứ tự từng đường). Suggestion C0313-36 (kiểm sớm đi trước cả 404/409/412 và 403 tầng service, sau guard và cổng quá giờ V5-15 của checkOut – ghi vào chữ). Suggestion C0313-37 ((ii) "→ 201" sai cho confirmDeposit/checkIn/checkOut – 200). Minor C0313-38 (ngoài 1i: hai câu đóng deposit_after_cancel trái nhau; #148 theo createDepositNotice/DOM 11.4 mục 5 – khoản thu ghi sau lúc báo đóng mục; DOM xác nhận, sửa câu recordPayment (B)). Trial merge #152 với main sạch. Không ESC | BE | rounds/round-05/reviews/BE-on-contract-0313-addendum-1i.md |`
