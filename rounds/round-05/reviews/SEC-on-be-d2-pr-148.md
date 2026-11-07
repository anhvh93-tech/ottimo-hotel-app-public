# SEC – Review PR #148 (BE-D2, PR-B3 – 5B-1 "Tiền về sau khi hủy")

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần đọc | CI lúc đọc |
|---|---|---|---|---|
| #148 | `r5-b3` → `main` | **`a5911138`** | `git diff d6efc170..a5911138` (31 tệp: 25 tệp `src`, 5 tệp test, `pr-b3.md`), cùng mã xung quanh ở `refunds.service.ts`, `folio.service.ts`, `unit-of-work.ts`, `staff-notify.ts`, `platform/public/validation.ts` | Mọi job xanh, gồm API contract (RBAC `--strict`), gitleaks, E2E smoke |

Đối chiếu:
- `security-requirements.md`: SR-PAY-10 bản 07/11, SR-INP-05, SR-AUD-03, SR-LOG-01/04;
- điều kiện S2–S8 ở `SEC-on-bug-r5-002.md` mục 3.2;
- hợp đồng 0.3.13 bổ sung 1g/1h (trên `main`), 1i (#152) và `SEC-on-contract-0313-addendum-1i.md` (C0313-31 phương án B, danh sách test C0313-32);
- các thẻ SEC cũ: FB-R5-SEC-BE-119-02 ý 1–2, FB-R5-SEC-BE-127-02 (`SEC-on-be-a1-prs-127-113.md` mục 8.5);
- quyết định PO 17/10 (SEC-37, OWN tự duyệt và chi);
- `DOM-on-be-d2-pr-148.md` (148-03, 148-04, 148-07). SEC không lặp lại các thẻ của DOM.

Cách kiểm:
- Worktree tạm ở `a5911138`. PostgreSQL 17 tạm (container riêng của SEC, vai `ottimo_app` như CI). Cả hai đã xóa sau khi xong.
- 6 tệp test liên quan (`pr-b3-after-closure`, `pr-b3-bank-reference`, `pr-b3-units`, `v5-48-closed-booking-money`, `v5-48-arc-followups`, `v09-reference-card-units`): **121/121 xanh**.
- 3 probe (P1–P3, tệp test tạm, không commit) và 17 đột biến của SEC (S1–S17).
- Gộp thử `a5911138` vào `origin/main` `38b1f476`: không xung đột, `tsc --noEmit` sạch, toàn bộ API Vitest xanh (mục 4).

## Kết luận: **DUYỆT** PR #148 @ `a5911138`. Gộp khi CI xanh trên đúng SHA

0 Blocker · 0 Major · 2 Minor · 1 Suggestion. Không thẻ nào chặn gộp. Không ESC.

- Không có đường nào lưu hay ghi log số thẻ. Có ba lớp: kiểm sớm, bộ đọc, chốt ở `recordManual`. Thêm CHECK mẫu của cột (0040).
- Audit không có số tài khoản, tên chủ tài khoản hay mã ngân hàng.
- Không có operation mới. Ba trường mới chỉ FD+ đọc được.
- Thân lỗi không có dữ liệu khách.
- 127-02 và 119-02 ý 1–2 đã làm đúng.
- Hai lỗ nhỏ, cả hai quanh yêu cầu hoàn **tạo lại** sau khi yêu cầu 5B-1 bị từ chối:
  - OWN chỉ có tên trong `origin_actor_ids` chi chuyển khoản mà không phải xác thực lại, nhật ký không có cờ (148-01);
  - yêu cầu tạo lại nhận nơi nhận tiền mặt và chi tiền mặt được, nên luật S3 mất (148-02).

## 1. Trả lời 6 điểm BE-D2 hỏi

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | `readBankReference`: mẫu → số thẻ → phương thức | **Đạt** | Đúng SR-PAY-10: luật ô mã chỉ chạy trên giá trị đã qua mẫu `^[A-Za-z0-9./_-]{1,64}$` và đã bỏ khoảng trắng hai đầu. Số thẻ có dấu cách hoặc ký tự lạ thì trượt mẫu (`VALIDATION_FAILED`), không bao giờ được lưu. Số thẻ báo trước phương thức, đúng C0313-31 B. Không phải chuỗi → `VALIDATION_FAILED`; zod `max(64)` → `TOO_LONG`. Lỗi chỉ có `field` + `code`, không lặp giá trị. Đột biến S1 (lỗi lặp giá trị) và S2 (bỏ luật số thẻ ở bộ đọc) đều đỏ |
| 2 | Chốt ở `recordManual` | **Đạt** | Chuẩn hóa (bỏ khoảng trắng, chữ hoa), rồi mẫu → số thẻ → phương thức, trước khóa tư vấn và trước số `PT-`. `field` không có tiền tố. Chấp nhận được, vì chỉ đường bỏ qua bộ đọc mới chạm tới đây. Lớp thứ tư là CHECK `payment_bank_reference_check` (chỉ kiểm mẫu). Đột biến S3 đỏ |
| 3 | Kiểm sớm `assertBankReferenceNotCardFirst`: đứng trước 404/409/412 và 403 tầng service, sau 401/403 của guard; ở `checkOut` sau cổng V5-15 | **Đạt, không lộ gì** | Câu trả lời chỉ phụ thuộc thân yêu cầu, không đọc dữ liệu nào. Probe P3: FD gửi tới folio có thật, FD gửi tới uuid không tồn tại, SAL gửi tới folio ngoài phạm vi → **cùng một** 422 (chỉ `requestId` khác). HK → 403 của guard trước. Vì vậy không dò được folio có tồn tại không, có thuộc phạm vi không, phiên bản hay trạng thái. Vai không có operation vẫn nhận 403 và dòng `access.denied`. Ở `checkOut`, cổng V5-15 trả lời theo vai và trạng thái đơn, có hay không có số thẻ đều như nhau, và không đọc thân. Đặt kiểm sớm sau cổng không lộ thêm gì. Hệ quả duy nhất: yêu cầu có số thẻ ở ô mã không ghi dòng từ chối tầng service (403/404). Chấp nhận được: không làm gì, không học được gì. Không lưu gì: lỗi ném trước hoặc trong `uow.run`, giao dịch rollback, không có dòng `idempotency_key`. P3: 0 dòng `payment`, `audit_event`, `idempotency_key` chứa dãy số thẻ. Đột biến S4 đỏ. SEC đồng ý BE C0313-36: ghi thứ tự này vào chữ hợp đồng ở 0.3.14 |
| 4 | Giữ ngoại lệ OWN chi chuyển khoản | **Giữ, có điều kiện (thẻ 148-01)** | Đồng ý với DOM: tiền là của chủ đầu tư, nơi nhận đã cố định về tài khoản đã chuyển, và chi chỉ khi đã đối soát. Nhưng PO 17/10 cho ngoại lệ này **kèm** xác thực lại ở mỗi bước và cờ "OWN tự duyệt và chi" trong Nhật ký tiền. Probe P2: OWN chỉ có tên trong `origin_actor_ids` (yêu cầu tạo lại sau khi bị từ chối) thì chi được mà không phải xác thực lại, và nhật ký không có cờ. Đột biến S7 (chặn luôn OWN) sống: không test nào giữ ngoại lệ (thẻ 148-03) |
| 5 | Tin đẩy `deposit_after_cancel`, audit `refund.destination_set` | **Đạt** | Tin đẩy chỉ có `kind`, `roles` (FD, FDL, MGR, OWN), `userIds`, `refType`, `refId`, `refCode`; không có số tiền hay tên. Người báo bị loại khỏi danh sách nhận. Giới hạn gửi lại `NOTICE_REPUSH_MS` vẫn áp, vì nằm trước nhánh đơn đã đóng. Tham số của mục "Cần chú ý" theo danh sách cho phép `['code']`. Sale không phải người tạo hay người chốt đơn → 404 (P3). Đột biến S12, S13 đỏ. `refund.destination_set`: nhóm tiền, `before = {status, refundMethod: null}`, `after = {status, refundMethod: 'original_method'}`, mã đơn. Không có số tài khoản, tên chủ tài khoản hay 4 số cuối. Test đọc lại đúng nguyên bản ghi. `attention_event.resolved`: `after = {kind, afterClosure}`, `reason` rỗng, ghi chú chỉ nằm ở dòng mục (FD+ đọc). Đột biến S11 (đưa ghi chú vào cột `reason`) đỏ |
| 6 | `duplicateReservationCode` theo vai người ghi | **Đạt** | Ở cả 5 đường, người ghi chính là người gọi HTTP. Không đường nào ghi khoản thu có mã thay người khác. Vai lấy từ `recordedByRole` (ảnh chụp) hoặc vai cao nhất ở cơ sở. Không có vai → không có mã đơn (an toàn). Chỉ `DESK_ROLES` nhận mã; SAL/CTV nhận 409 không có mã, có test ở `recordPayment` và `confirmDeposit` (đột biến S5 đỏ). Mã đơn chỉ lấy trong cùng cơ sở: có điều kiện `property_id`, và RLS `tenant_isolation` trên `payment` chặn thêm một lớp. Rủi ro còn lại: sale biết một mã ngân hàng đã được dùng ở cơ sở hay chưa (có/không). Low, đã chấp nhận ở ARC-21/24. Riêng mã ngân hàng không mang dữ liệu khách |

## 2. Danh sách kiểm của ORC

| Mục | Kết quả | Ghi chú |
|---|---|---|
| Không lưu, không log số thẻ | **Đạt** | Bốn lớp (mục 1, ý 1–3). Diff không thêm lời gọi logger nào. Problem chỉ có `field` + `code`. `parseBody` đổi lỗi zod thành `field`/`code`, không trả `input`. SR-LOG-01 không ghi thân yêu cầu |
| Audit không có dữ liệu tài khoản, chủ tài khoản ngoài phần SR-PAY-10 cho | **Đạt** | `payment.recorded` không thêm `bankReference`, và allowlist `payment` cũng không có khóa này (hai lớp). `refund.destination_set`, `attention_event.resolved`: như mục 1. `deposit_notice.created` chỉ thêm `afterClosure`. Giá trị bị chặn không đi tới đâu cả |
| Phân quyền ở mọi đường mới | **Đạt** | Không có operation mới, không đổi `x-roles` (`openapi.yaml` không đổi; CI RBAC `--strict` xanh). Hành vi mới nằm trong operation cũ: ghi khoản thu trên đơn đã đóng chỉ FD+, kể cả nhánh `card_pos` (SAL bị chặn như V5-48); báo cọc trên đơn đã đóng chỉ SAL/CTV trong phạm vi của mình, ngoài phạm vi → 404 (P3), cùng FD+; "Không thấy tiền" chỉ FD+ và chỉ mục người gọi thấy được. Ba trường `Payment.bankReference`, `Payment.possibleDuplicateCodes`, `ApprovalRequest.possibleDuplicateCodes` có `x-visible-to` FD+ qua serializer sinh từ hợp đồng (S14, S15 đỏ). Hoàn tiền: nơi nhận do máy chủ đặt thì không đổi được, không chi tiền mặt được (S8, S9, S17 đỏ); `payOut` chặn người trong `origin_actor_ids` (S6 đỏ). Hai lỗ ở thẻ 148-01, 148-02 |
| Thân lỗi không có dữ liệu cá nhân | **Đạt** | 409 `DUPLICATE_BANK_REFERENCE` chỉ có mã lỗi, thêm mã đơn nếu người ghi là FD+. 422 chỉ có `field`/`code`. `AMOUNT_EXCEEDS_BALANCE` có `max` = N (số tiền, không phải dữ liệu khách). `INVALID_TRANSITION` có chữ chi tiết cố định. Ghi chú máy của yêu cầu hoàn tự tạo: "Tự sinh từ khoản thu {PT-…} {phương thức}", không có dữ liệu khách |
| FB-R5-SEC-BE-127-02 | **Done → Closed khi gộp** | `accountHolder` qua `stripControlChars` rồi mới bỏ khoảng trắng. Chỉ còn ký tự ẩn → `REQUIRED`. Kiểm Luhn chạy trên chữ đã lọc. Hằng riêng C0 + DEL đã xóa. Test 3 × U+2060 và U+202E có. Đột biến S16 đỏ |
| FB-R5-SEC-BE-119-02 ý 1–2 | **Done → Closed khi gộp** | Cả 5 bộ đọc khai và đọc trường, có chốt ở `recordManual`, có ca HTTP ở từng đường (C0313-32 (ii)) |
| C0313-31 B, C0313-32 (1i) | **Đạt** | Ca (iv) có ở cả 5 đường. `cash` kèm số thẻ → `CARD_NUMBER_DETECTED`, không phải `NOT_ALLOWED`. SAL `confirmDeposit` → 409 không có mã đơn. "Không thấy tiền" thiếu ghi chú → 422, mục còn mở, không có dòng audit |

**Điều kiện S2–S8 sau #148:**

| Điều kiện | Kết quả |
|---|---|
| S2 – người ghi không duyệt, không chi, kể cả yêu cầu tạo lại | Đạt. Có test cho MGR. Bản OWN chưa có test (S10 sống – thẻ 148-03). Ngoại lệ OWN chi chuyển khoản: thẻ 148-01 |
| S3 – nơi nhận `original_method`, không chi tiền mặt | Đạt trên yêu cầu 5B-1. **Không** theo sang yêu cầu tạo lại (P1) hay yêu cầu thay thế pha trộn (DOM 148-03 (i)) – thẻ 148-02 |
| S4 – tối thiểu "Có thể trùng"; bản tốt hơn: một mã ngân hàng một khoản thu | Đạt cả hai |
| S5 – trần | Không có trong PR (nên có; ORC đã cắt theo đường cắt V5-5B) |
| S6, S7, S8 | Đạt |

Thứ tự khóa: khóa tư vấn trước `doc_sequence`. Ca deadlock BE-D2 nêu kết thúc an toàn: 409 `CONCURRENT_UPDATE`, không có khoản thu đôi. SEC không có ý kiến, ARC quyết.

## 3. Probe

| # | Ca | Kết quả |
|---|---|---|
| P1 | Đơn OTA hủy, N = 500.000. FD ghi chuyển khoản 800.000 → yêu cầu 5B-1 300.000. OWN từ chối. MGR2 tạo lại yêu cầu 300.000. FD đặt nơi nhận `cash` | **200**. MGR duyệt, MGR đối soát khoản chuyển khoản, OWN chi tiền mặt (có ảnh phiếu ký) → **201**. Tiền khách chuyển khoản được chi bằng tiền mặt → thẻ 148-02 |
| P2 | OWN ghi chuyển khoản 900.000 → yêu cầu 5B-1 đứng tên OWN. MGR từ chối, MGR2 tạo lại; OWN vào `origin_actor_ids` của yêu cầu mới. FD đặt `original_method`, MGR duyệt, MGR đối soát. OWN chi chuyển khoản, phiên không có step-up | **201**. `isOwnSelfPayout` = false. Audit `refund.paid` không có `ownSelfApprovedAndPaid`. Đối chứng P2b: OWN là người tạo yêu cầu thì cùng phiên đó nhận **401 `REAUTH_REQUIRED`** → thẻ 148-01. SEC thử bản sửa đề xuất trong worktree tạm: P2 → 401, 56/56 ca của `pr-b3-after-closure` + `payments-s3` vẫn xanh |
| P3 | `recordPayment` có `bankReference` là số thẻ thử, gửi bởi: FD tới folio thật; FD tới uuid không tồn tại; SAL2 tới folio ngoài phạm vi; HK. Thêm: SAL2 báo cọc trên đơn đã đóng không phải của mình | Ba ca đầu: cùng 422 `CARD_NUMBER_DETECTED` (`field` = `bankReference`). HK: 403 `FORBIDDEN_ACTION`. 0 dòng `payment`/`audit_event`/`idempotency_key` chứa dãy số. Báo cọc của SAL2 → 404 |

## 4. Đột biến của SEC

Chạy trên `a5911138`. Mỗi đột biến sửa một chỗ, chạy lại tệp test liên quan, rồi trả mã về như cũ. Cuối cùng worktree sạch.

| # | Đột biến | Kết quả |
|---|---|---|
| S1 | 422 `CARD_NUMBER_DETECTED` lặp lại giá trị (`extras.value`) | đỏ (6 ca) |
| S2 | `readBankReference` bỏ luật số thẻ (còn kiểm sớm và chốt) | đỏ |
| S3 | `recordManual` bỏ luật số thẻ ở chốt | đỏ |
| S4 | `recordPayment` bỏ kiểm sớm trên thân thô | đỏ |
| S5 | `duplicateReservationCode` cho mọi vai người ghi | đỏ |
| S6 | `payOut` bỏ kiểm `origin_actor_ids` | đỏ |
| S7 | `payOut` bỏ ngoại lệ OWN (chặn cả OWN là người gốc) | **sống** – thẻ 148-03 |
| S8 | `setRefundDestination` bỏ kiểm nơi nhận do máy chủ đặt | đỏ |
| S9 | `serverFixedDestination` chỉ xét `reason_code` | đỏ (unit) |
| S10 | `refundRouting` không đưa OWN ghi sau khi đóng vào `origin_actor_ids` | **sống** – thẻ 148-03 |
| S11 | "Không thấy tiền" chép ghi chú vào cột `reason` của audit | đỏ |
| S12 | Tin `deposit_after_cancel` gửi cả sale, không loại người báo | đỏ |
| S13 | Mục `deposit_after_cancel` mang số tiền | đỏ |
| S14 | Serializer: `Payment.bankReference` hiện cho mọi vai | đỏ |
| S15 | Serializer: `Payment.possibleDuplicateCodes` hiện cho mọi vai | đỏ |
| S16 | 127-02: `accountHolder` quay lại bộ lọc riêng C0 + DEL | đỏ |
| S17 | Nơi nhận cố định chi về khoản thu mới nhất bất kỳ (kể cả tiền mặt/OTA) | đỏ |

SEC không chạy lại 37 đột biến của BE-D2. S3, S4, S5, S6, S8 trùng ý với M26, M32, M11, M6, M7 của BE-D2 và cho cùng kết quả.

Gộp thử với `origin/main` `38b1f476`: không xung đột; `tsc --noEmit` sạch. Toàn bộ API Vitest trên bản gộp thử (PostgreSQL 17 tạm, vai `ottimo_app`): **220 tệp qua, 2 bỏ qua; 5.180 ca qua, 19 bỏ qua, 1 todo**.

## 5. Thẻ

### FB-R5-SEC-BE-148-01
- Mức độ: Minor
- Người nhận: BE-D2. Nên làm ngay trong #148 (một điều kiện SQL, một dòng, một ca test). Không kịp thì PR nhỏ **trước tag v1.0.5**. Không chặn gộp.
- Vị trí: `refunds.service.ts`:
  - `isOwnSelfPayout` (`requested_by = $2 OR approver_id = $2 OR refund_destination_set_by = $2`);
  - `payOut`, biến `ownSelf`;
  - controller `executeTransfer` gọi `assertStepUp` chỉ khi `isOwnSelfPayout` đúng.
- Vấn đề:
  - #148 thêm luật: người trong `origin_actor_ids` không chi. OWN chi chuyển khoản được miễn (`!ownerTransfer`).
  - Nhưng hai chốt đi kèm ngoại lệ PO 17/10 chỉ nhận ra OWN qua `requested_by`, `approver_id`, `refund_destination_set_by`. Hai chốt đó là xác thực lại ở mỗi bước và cờ `ownSelfApprovedAndPaid` trong Nhật ký tiền.
  - Ca lọt: OWN ghi khoản thu sau khi đóng, yêu cầu 5B-1 bị từ chối, người khác tạo lại. OWN khi đó chỉ là người gốc. Probe P2: OWN chi 400.000 mà không phải xác thực lại, nhật ký không có cờ. Cùng phiên đó, ở yêu cầu do chính OWN tạo, thì nhận 401 `REAUTH_REQUIRED`.
- Vì sao quan trọng:
  - Ngoại lệ OWN được duyệt vì có hai chốt bù. Chính sách tách nhiệm cho người ghi (S2) được nới cho OWN mà thiếu chốt bù.
  - Nếu phiên OWN bị chiếm, kẻ chiếm chi được khoản hoàn sinh từ khoản thu OWN đã ghi mà không cần mật khẩu.
  - Chủ đầu tư đọc màn tuần cũng không thấy dòng "OWN tự duyệt và chi".
  - Mức thấp: vẫn cần MGR duyệt (OWN là người gốc thì không duyệt được), và tiền chỉ ra khi đã đối soát.
- Đề xuất sửa:
  - `isOwnSelfPayout`: thêm `OR $2::uuid = ANY(origin_actor_ids)`;
  - `ownSelf`: thêm `|| (row.origin_actor_ids ?? []).includes(actor.userId)`.
  - SEC đã thử bản này trong worktree tạm: P2 → 401; `pr-b3-after-closure` + `payments-s3` 56/56 xanh.
  - Test (gộp với thẻ 148-03): ca P2 → 401 khi không có step-up; có step-up → 201 và audit `refund.paid` có `ownSelfApprovedAndPaid: true`.
- Trạng thái: Open

### FB-R5-SEC-BE-148-02
- Mức độ: Minor
- Người nhận: BE (làn 5B-2), ARC. Đích v1.0.6, làm cùng DOM FB-R5-DOM-BE-148-03 (i) và SEC FB-R5-SEC-ARC-B002-03 ý 3. Không chặn #148, không chặn v1.0.5.
- Vị trí: `refunds.service.ts` `serverFixedDestination`, `setRefundDestination`; `folio.service.ts` `refundRouting`, `refundsDownToCredit`/`peekDestination`.
- Vấn đề:
  - S3 chỉ gắn vào **yêu cầu 5B-1**: `reason_code = payment_after_cancel`, hoặc `original_method` không có người đặt.
  - Một yêu cầu hoàn mới trên cùng folio thì không mang luật này. Probe P1: yêu cầu 5B-1 bị từ chối, MGR2 tạo lại, FD đặt nơi nhận `cash` (200), MGR duyệt, OWN chi tiền mặt (201). Tiền khách chuyển khoản vào tài khoản OTTIMO được chi bằng tiền mặt.
  - Đường thứ hai là yêu cầu thay thế pha trộn (DOM 148-03 (i)).
  - S2 thì #148 đã kéo sang mọi yêu cầu mới của folio (`refundRouting`). S3 chưa.
- Vì sao quan trọng:
  - Lý do của S3: tiền thật của khách đã về và đã đối soát. Chi tiền mặt cho người tự xưng là khách thì khách thật vẫn chờ hoàn.
  - Đường P1 có thể xảy ra ngay trong việc thường ngày: quản lý từ chối "chưa thấy tiền trên sao kê", sau đó có người tạo lại yêu cầu.
  - Mức thấp: cần nhiều người (từ chối, tạo lại, đặt nơi nhận, duyệt, chi kèm phiếu ký A47a), và mọi bước có audit. Lỗ chung của B002-03 ý 3 cũng đã được SEC dời sang v1.0.6.
- Đề xuất sửa: một luật ở mức folio, cùng điều kiện với câu đọc người ghi sau khi đóng trong `refundRouting` (`AFTER_CLOSURE_SQL`):
  - folio có khoản thu chuyển khoản/VietQR ghi sau khi đóng, chưa đảo → mọi yêu cầu hoàn mới của folio nhận nơi nhận `original_method` do máy chủ đặt lúc `submit`, có audit `refund.destination_set`. Áp cho cả yêu cầu tạo lại và yêu cầu thay thế;
  - từ đó `setRefundDestination` và `executeCashRefund` → 409 như hôm nay.
  - Luật này đóng luôn DOM 148-03 (i). Thêm test: ca P1 → đặt `cash` bị 409, chi tiền mặt bị 409.
  - Tới v1.0.6, chốt tay là câu sổ tay DOM 148-04 ý 2: mọi yêu cầu hoàn của đơn có khoản "Tiền về sau khi hủy" chưa đảo chỉ chi chuyển khoản về tài khoản đã chuyển, kể cả yêu cầu tạo lại.
  - SEC thêm một câu vào lời dặn người duyệt (`SEC-on-bug-r5-002.md` 3.3, PO chọn chỗ đặt như PO-B002-05): "Đơn đã hủy có khoản tiền về sau khi hủy: không duyệt yêu cầu hoàn có nơi nhận tiền mặt."
- Trạng thái: Open

### FB-R5-SEC-BE-148-03
- Mức độ: Suggestion
- Người nhận: BE-D2 (cùng commit với 148-01 nếu làm trong #148), QA biết.
- Vị trí: `test/integration/pr-b3-after-closure.test.ts`, ca "S2 – MGR records 900.000 …".
- Vấn đề: hai đột biến về phía OWN sống:
  - S7: chặn luôn OWN là người gốc khi chi chuyển khoản. Không test nào giữ ngoại lệ mà #148 cố ý giữ.
  - S10: `refundRouting` không đưa OWN ghi sau khi đóng vào `origin_actor_ids`. Khi đó OWN duyệt được yêu cầu tạo lại từ khoản thu của chính mình.
  - Ca S2 hiện chỉ dùng MGR làm người ghi.
- Đề xuất sửa: thêm bản OWN của ca S2. OWN ghi → MGR từ chối → MGR2 tạo lại. Kiểm:
  - OWN duyệt → 403 `SELF_APPROVAL_FORBIDDEN`;
  - OWN chi tiền mặt → 403;
  - OWN chi chuyển khoản: không step-up → 401 (sau 148-01); có step-up → 201 kèm cờ.
- Trạng thái: Open

## 6. Điểm làm tốt

- Một bộ đọc chung cho cả 5 đường, có chốt ở chỗ INSERT duy nhất. Đường thu mới sau này không thể quên luật số thẻ.
- Tự tìm ra ba chỗ mà chữ 1i ("không đổi mã") chưa đúng, rồi sửa bằng một kiểm sớm thuần theo thân, không đọc dữ liệu nên không lộ gì. Có đột biến chứng minh hai đường là đột biến tương đương.
- Test đọc lại audit từ bảng và qua đúng lời gọi màn tuần của OWN, kèm kiểm "không có chữ tự do". Bảng đột biến gắn với từng thẻ, kể cả thẻ của SEC.

## Trạng thái thẻ SEC liên quan

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-BE-127-02 (Minor) | Done ở #148 → **Closed** khi #148 gộp |
| FB-R5-SEC-BE-119-02 ý 1–2 | Done ở #148 → **Closed** khi #148 gộp |
| C0313-31, C0313-32 (1i) | Mã đạt, có ca (iv) ở 5 đường |
| S2–S8 | Như bảng mục 2; S3 còn thẻ 148-02 |

ESC mới: **không**.

## Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – review BE-D2 PR #148 (r5-b3, PR-B3 5B-1) @ a5911138: DUYỆT, gộp khi CI xanh trên đúng SHA.** Không lưu/log số thẻ: 4 lớp (kiểm sớm trên thân thô, readBankReference mẫu → số thẻ → phương thức, chốt recordManual, CHECK 0040); lỗi chỉ field + code. Kiểm sớm trước 404/409/412 và 403 tầng service, sau guard, sau cổng V5-15 ở checkOut: không lộ gì (câu trả lời chỉ theo thân; P3: folio thật, uuid không có, folio ngoài phạm vi → cùng 422; HK 403 guard trước; 0 dòng payment/audit/idempotency chứa số). Audit không có tài khoản/chủ tài khoản/mã ngân hàng (refund.destination_set chỉ status + refundMethod; attention_event.resolved {kind, afterClosure}, reason rỗng). Tin deposit_after_cancel chỉ mã đơn, FD/FDL/MGR/OWN, không gửi người báo, vẫn giới hạn gửi lại. duplicateReservationCode theo vai người ghi (= người gọi ở cả 5 đường), SAL/CTV không có, cùng cơ sở + RLS. Không operation mới; bankReference, possibleDuplicateCodes (Payment, ApprovalRequest) chỉ FD+. 127-02 và 119-02 ý 1–2 Done → Closed khi gộp. Ngoại lệ OWN chi chuyển khoản cho người gốc: SEC đồng ý giữ (PO 17/10), với điều kiện có step-up và cờ ownSelfApprovedAndPaid như mọi ca OWN tự chi (148-01). 121/121 ca liên quan xanh; 17 đột biến SEC: 15 đỏ, S7 và S10 sống. Gộp thử với origin/main 38b1f476 không xung đột, tsc sạch, toàn bộ API Vitest xanh (220 tệp, 5180 ca). Thẻ: 148-01 Minor (OWN chỉ là người gốc chi chuyển khoản không step-up, không cờ – P2; thêm origin_actor_ids vào isOwnSelfPayout và ownSelf; trước tag v1.0.5), 148-02 Minor (S3 không theo sang yêu cầu tạo lại sau khi từ chối – P1 chi tiền mặt được – hay yêu cầu thay thế pha trộn; luật mức folio: có khoản chuyển khoản/VietQR ghi sau khi đóng chưa đảo thì mọi yêu cầu hoàn mới nhận original_method do máy chủ đặt; v1.0.6 cùng DOM 148-03 (i), B002-03 ý 3; tới đó sổ tay DOM 148-04 ý 2 + câu lời dặn người duyệt), 148-03 Suggestion (test bản OWN của ca S2). Rủi ro còn lại Low tới v1.0.6. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-d2-pr-148.md |`
