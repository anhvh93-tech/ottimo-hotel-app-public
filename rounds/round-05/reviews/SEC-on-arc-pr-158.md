# SEC – Review PR #158 (ARC, hợp đồng 0.3.13 bổ sung 1j và danh sách 0.3.14 (k)–(z))

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần của PR | CI lúc đọc |
|---|---|---|---|---|
| #158 | `r5-contract-1j` → `main` | **`bf3070fa`** | Một commit nội dung `fef304ca`, cộng một commit gộp `main` @ `0b615843` (`git show --remerge-diff` rỗng). 5 tệp: `openapi.yaml`, `api-client` và `openapi-schemas.ts` (sinh lại), `contract-0.3.13.md` (1.21, 1.26 (k)–(z), 1.30, 1.31), `ARC-on-contract-0.3.13-reviews.md` mục 12 | Xanh: API contract (RBAC `--strict`), Redocly, gitleaks, confidential paths, format/lint/test/build, no test endpoints. **E2E smoke đang chạy** |

Đối chiếu:
- thẻ SEC cũ: 1I-01, 1I-02, 1I-03 (`SEC-on-contract-0313-addendum-1i.md`); 148-02 (`SEC-on-be-d2-pr-148.md`); 155-01, 155-03 và 5 luật kênh K14-L (`SEC-on-ops-pr-155-k14.md` mục 5, 6; `SEC-on-ops-pr-155-k14l-r51.md`); S2–S8 và mục 4.4 (`SEC-on-bug-r5-002.md`); 1H-02 (0.3.14 (b));
- runbook K14 / K14-L ở #155 @ `17c6d493` (chưa gộp);
- mã trên `main`: serializer (`serializer.ts`, `field-policy.ts`), `reservation-dto.ts`, `payments.service.ts` `recordAfterClosure`, `reservations.service.ts` `update`, `folio.service.ts` `AFTER_CLOSURE_SQL`/`refundRouting`, `reconcile-attention.ts`, CHECK `reservation_status_before_cancel_check` (0013);
- `DOM-on-be-d2-pr-148.md` (1.1, 1.3, 148-04), `copy-v1.0.5.md` bản 2.5 mục 9.16.

Cách kiểm: đọc `gh pr diff 158` và tệp ở `bf3070fa` bằng `git show`, không checkout nhánh. Một script nhỏ trong scratchpad đọc `openapi.yaml` của PR và liệt kê mọi operation có thân 2xx chạm tới `Reservation`, kèm `x-roles`, `x-scope`. Không chạy DB, không gọi staging hay production.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, tỷ lệ hay số tiền hoa hồng, tên người hay dữ liệu khách.

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN** PR #158 @ `bf3070fa`

0 Blocker · 0 Major · 1 Minor · 5 Suggestion. Không ESC.

- **Gộp được** khi CI xanh trên đúng `bf3070fa`, gồm E2E smoke. Không thẻ nào chặn gộp.
- **Điều kiện:** sửa thẻ 158-01 (một câu ở 1.30) **trước lần chạy K14-L đầu tiên**. Nên sửa luôn trong #158 trước khi gộp. Nếu commit sửa chỉ đổi câu đó (ORC so bằng `git diff`), SEC giữ kết luận, không cần review lại. Tới khi sửa, ORC làm theo runbook K14-L, không theo câu ở 1.30.
- `cancelledFrom` không lộ gì mới. SAL, CTV, HK và trang khách không nhận trường này.
- C0313-38 thay một câu của SEC (mục 4.4 ý 4, `SEC-on-bug-r5-002.md`). SEC đồng ý thay, vì việc đối soát vẫn được theo dõi ở chỗ khác (mục B.1).
- 1H-02 không bị đụng. 1I-02 có chữ, nhưng một vế ngược luật kênh 155-01 (thẻ 158-01).
- Ba thẻ SEC trong danh sách 0.3.14 có đúng người làm. Hai mục cần chính xác hơn về nội dung và thời điểm (158-02, 158-03). Mục (x) cần thêm ca test và người làm phần chốt tay (158-04).

---

## A. `Reservation.cancellation.cancelledFrom`

| Kiểm | Kết quả | Căn cứ |
|---|---|---|
| `x-visible-to` trong hợp đồng | **Đạt.** `[owner, manager, front_desk_lead, front_desk]`, cùng danh sách với `internalNote`, `cardsIssued` | `openapi.yaml` dòng 11782 |
| `v` trong `openapi-schemas.ts` sinh lại | **Đạt, khớp.** Hai chỗ, cả hai `v` = FD+: `schemas.Reservation` (dòng 979) và bản phẳng của `responses.changeRoom['200']` (dòng 4309). Diff chỉ có 8 dòng này. `cancellation` vẫn `open: false` | `gh pr diff 158` |
| Serializer bỏ trường ở tầng lồng | **Đạt.** `walk` gọi `propertyAllowed` cho mọi thuộc tính của mọi object, kể cả object lồng không có tên schema. Vai không có trong `v` thì khóa **vắng**, không `null`. Ba khóa còn lại của `cancellation` vẫn trả. Operation công khai (`roles` rỗng) không qua được `visibleToAllows` | `serializer.ts`, `field-policy.ts` |
| Ai nhận `Reservation` | 19 operation có thân 2xx chạm `Reservation`. SAL, CTV chỉ qua `getReservation`, `extendHold`, `cancelReservation`, `createHoldFromQuote` (`own`; CTV hủy `own_hold_only`) và `confirmDeposit` (SAL `own`). Không operation nào cho HK, MT. Không operation khách hay công khai nào trả `Reservation`. Không có đường SSE/outbox nào gọi `serializeSchema('Reservation')` | Script đọc `openapi.yaml` @ `bf3070fa`; `git grep serializeSchema` |
| Giá trị | **Đạt.** CHECK `reservation_status_before_cancel_check` (0013, chưa đổi): khi `cancelled`/`no_show` thì cột chỉ là `hold` hoặc `confirmed`. DTO chỉ dựng `cancellation` khi `status = cancelled` | Migration 0013; `reservation-dto.ts` |
| CTV/SAL suy ra được "đơn hủy lúc còn giữ chỗ" không | **Không có gì mới.** Với đơn của chính mình, SAL/CTV đã suy ra được từ trường đang thấy: bước `confirmed` của `progress` (theo `confirmed_at`), và `reasonCode = hold_expired`. Họ cũng là người tạo hoặc người chốt đơn. Ẩn trường là quyền tối thiểu, không phải giấu bí mật | `reservation-dto.ts` `progress` |
| Dò qua mã lỗi | **Không dò được.** `recordPayment` (B): người không phải FD+ bị chặn **trước** luật `type` (422 `AMOUNT_EXCEEDS_BALANCE`, `max` 0), không phụ thuộc `status_before_cancel`. CTV không có `recordPayment`. `createDepositNotice` trên đơn `cancelled`/`no_show` → 202 như nhau, mọi lý do (bổ sung 1) | `payments.service.ts` `recordAfterClosure` |
| Máy chủ là nguồn đúng | **Đạt.** Desk chỉ dùng trường để chọn `type`. Gửi sai vẫn bị 422 `NOT_ALLOWED` ở `type` | `afterClosureType` |

**SEC xem ở PR DTO của BE-D2** (không phải thẻ, 1.31 đã ghi test serializer). Test nên đi qua HTTP ở tầng lồng:
- CTV gọi `cancelReservation` trên giữ chỗ của mình: thân 200 có `cancellation` mà **không có khóa** `cancelledFrom`;
- SAL gọi `getReservation` trên đơn hủy của mình: như trên;
- FD gọi cùng đơn: thấy `hold` / `confirmed`.

## B. C0313-38, C0313-34, mục 1.30

### B.1 C0313-38 – mục `deposit_after_cancel` đóng lúc ghi khoản thu

Chữ cũ của SEC (`SEC-on-bug-r5-002.md` 4.4 ý 4, chép vào 1.21): mục đóng "khi đơn đã khôi phục **và** khoản thu đã đối soát, hoặc khi đã hoàn xong". Chữ 1j theo DOM 1.3: mục đóng khi đơn có khoản thu ghi sau lúc đóng đơn, trong lúc mục mở, hoặc khi FD+ bấm "Không thấy tiền".

**SEC đồng ý thay.** Ý của câu cũ là giữ khoản tiền chưa kiểm trong tầm mắt quản lý. Ý đó vẫn được giữ, ở bốn chỗ:
- `reconcile_overdue` (MGR+): đếm **mọi** khoản thu `pending` quá `bank_reconcile_alert_days`, kể cả khoản ghi sau khi đóng. Mục này chỉ có số đếm và số ngày, không có mã đơn hay số tiền;
- tiền chỉ được chi sau khi đối soát (DOM 11.4 2(d));
- `payment.recorded` có `afterClosure: true`, nằm trong bộ lọc tuần `afterClosureOnly` (S6);
- 1.21 (5B-2) vẫn giữ audit `reservation.restored_after_cancel` và tin báo OWN, MGR.

Luật SEC không bị yếu đi:
- S7 giữ nguyên: báo không sinh khoản thu, ảnh của báo không làm chứng từ.
- S8 giữ nguyên cho cách đóng bằng tay.
- Vế mới ở `createDepositNotice` (khoản thu ghi **trước** lúc báo không đóng mục của báo sau) làm S8 chặt hơn.

Còn một ca hở nhỏ của luật DOM, xem thẻ 158-06: một khoản quẹt thẻ đóng luôn báo "khách đã chuyển".

### B.2 C0313-34

Chỉ sửa chữ cho đúng sự thật: #148 có kiểm sớm `assertBankReferenceNotCardFirst` ở cả 5 bộ đọc, và ARC giữ cả 5. SEC đã kiểm lớp này ở #148 (probe P3, đột biến S4 đỏ). Không yếu đi luật nào. SR-PAY-10 và phương án B của C0313-31 giữ nguyên.

### B.3 Mục 1.30 – cách chạy truy vấn DOM 1H-01 (SEC 1I-02, 155-01)

Đúng ý 1I-02:
- chạy qua khối K14 đã ghim;
- SQL ghim bằng SHA, vai chỉ đọc, `default_transaction_read_only`, `statement_timeout`/`lock_timeout`;
- không in ra log CI, xóa tệp tạm;
- "Không chạy tay ngoài khối này".

Các cột của Danh sách 1, 2 khớp sáu điều kiện tên của 155-03.

Lệch luật kênh 155-01: câu "đầu ra chỉ tới **ORC/INV** qua kênh riêng", và câu "Gửi chủ đầu tư trong ngày" ở gạch "Khi chạy". Danh sách có tên nhân viên là K14-L. Luật SEC và runbook #155 nói danh sách đó chỉ hiện trên màn hình Mac của INV, không đi qua phiên ORC. Chi tiết và chữ đề xuất: thẻ 158-01.

### B.4 SEC 1H-02

Không câu nào của 1j đụng số thưởng quản lý. 0.3.14 (b) giữ nguyên. Chỗ kế tiếp có thể ghi số hoa hồng vào audit là mục (z), xem thẻ 158-05.

## C. Danh sách 0.3.14 (k)–(z): thẻ SEC và các mục SEC liên quan

| Mục | Thẻ | Người làm, thời điểm | Nội dung | Kết quả |
|---|---|---|---|---|
| (k) | SEC 1I-01 (+ BE-H 1I-02, ARC #154 mục 9 ý 1) | ARC (chữ), QA; BE-H (#157). 0.3.14 – **đúng** | Đã thêm lỗi dạng của thân trước 403, đúng ý thẻ. Nhưng chữ đặt 412 trước lỗi dạng của thân và bỏ 404. Trong mã, thứ tự là 428 (controller) → 422 dạng → 404 → 412 → 409 trạng thái → 403 → 422 cần đơn → 409 hoa hồng | **Đúng người, đúng lúc; sửa thứ tự** – thẻ 158-02. SEC chấp nhận 409 trạng thái và 412 đứng trước 403: mọi vai gọi `updateReservation` là FD+, đọc được trạng thái và `version` qua `getReservation`; mỗi 403 vẫn ghi đúng một `access.denied` |
| (m) | SEC 1I-03 | UXD, FE-A, ARC – **đúng người** | UXD đã làm xong (`copy-v1.0.5.md` bản 2.5, 9.16, khóa `rsv.closer.reason_help`, thêm cả số thẻ). Dòng này bắt buộc đi cùng PR Desk đổi người chốt của FE-A. Chỉ một câu hợp đồng của ARC là việc 0.3.14. Mục 12 ghi cả thẻ "Deferred – 0.3.14" | **Sửa thời điểm** – thẻ 158-03 |
| (n) | SEC 1I-02 | OPS (gộp #155), SEC – **đúng** | Phần OPS: Closed khi #155 gộp (`SEC-on-ops-pr-155-k14l-r51.md`) | Phần ARC: thẻ 158-01 |
| (p) | BE C0313-36 ("SEC xác nhận không đổi thứ tự") | – | SEC đã xác nhận ở `SEC-on-be-d2-pr-148.md` mục 1 ý 3: kiểm sớm chỉ theo thân, không lộ gì | **Đạt**, SEC không cần làm thêm |
| (s) | SEC 154-01 | ARC (chữ), BE-H (#157 đã gộp) – **đúng** | Kiểm độ sâu ở `canonicalJson`, mọi nơi gọi | **Đạt** |
| (u) | – | ARC | `card_pos` không bắt ảnh: đúng quyết định SEC 07/11 | **Đạt** |
| (v) | – (ARC 148-02) | ARC, BE-D2 | Đơn khôi phục bằng B12 (`restoreNoShow`) đọc `AFTER_CLOSURE_SQL` = false. Khi đó người ghi khoản sau khi đóng không còn vào `origin_actor_ids` của yêu cầu hoàn **mới** (S2) | SEC chấp nhận mức Low tới v1.0.6: cần nhiều bước có audit, và tiền chỉ chi sau đối soát. Ý (x)(iii) đóng lỗ này |
| (x) | SEC 148-02 (+ DOM 148-03) | ARC (thiết kế 0.3.14), BE làn 5B-2 (v1.0.6), SEC, DOM xem – **đúng**, khớp thẻ | Đúng luật mức folio, áp cho yêu cầu tạo lại và yêu cầu thay thế, nơi nhận do máy chủ đặt, có audit `refund.destination_set` | **Thêm ca test và người làm phần chốt tay** – thẻ 158-04 |
| (z) | – (DOM 155-05) | ARC, BE-H, DOM xem | Đổi luật quyền của 1h/1i (`closerUserId: null`, đồng bộ lại) và sinh dòng `void` hoa hồng. SEC chưa có tên trong mục này | Thẻ 158-05 |

---

## Thẻ

### FB-R5-SEC-ARC-158-01
- Mức độ: Minor
- Người nhận: ARC (chữ). Hạn: trước lần chạy K14-L đầu tiên; nên sửa trong #158. Không chặn gộp.
- Vị trí: `contract-0.3.13.md` 1.30, gạch "Cách chạy (bổ sung 1j, SEC 1I-02)" (dòng 898) và gạch "Khi chạy" (dòng 899).
- Vấn đề:
  - Câu "đầu ra chỉ tới ORC/INV qua kênh riêng" cho phép ORC nhận Danh sách 1, 2. Đây là K14-L, có tên hiển thị nhân viên gắn với mã đơn và người hưởng hoa hồng.
  - SEC 155-01 (`SEC-on-ops-pr-155-k14.md` mục 5) và runbook K14-L ở #155 cho đầu ra đi tới **đúng một người**: INV tự chạy một dòng lệnh trong cửa sổ Terminal của macOS. Đầu ra không đi qua phiên ORC, chat, repo hay subagent. ORC không nhìn.
  - Câu "Gửi chủ đầu tư trong ngày" cũng hiểu là có người chạy rồi gửi danh sách cho INV.
  - Ngược lại, câu "không in ra … chat" chặt hơn runbook ở phần **đếm**: runbook K14 cho ORC báo số đơn cho INV trong chat, repo chỉ ghi 0 / > 0 (như K13, SEC 129-01). Không nguy hiểm, nhưng hai tài liệu nói khác nhau.
- Vì sao quan trọng: ORC đọc hợp đồng này khi chạy K14. Theo câu hiện tại, ORC có thể chạy K14-L hoặc nhận danh sách vào phiên của mình. Điều 155-01 cấm đúng việc đó: phiên ORC và tab Terminal trong ứng dụng Claude đều là chỗ ORC đọc được, tên sẽ vào tệp phiên.
- Đề xuất sửa: thay hai gạch bằng:
  - "**Cách chạy (bổ sung 1j, SEC 1I-02, 155-01):** chỉ theo runbook v1.0.5 mục K14, bằng câu và khối SEC đã ghim (`K14_PIN`): vai chỉ đọc, READ ONLY, `statement_timeout`/`lock_timeout`, không in ra log CI, xóa tệp tạm. Không chạy tay ngoài các khối này. **K14 đếm:** ORC chạy; chỉ ra số đơn; ORC báo INV trong chat; repo chỉ ghi 0 / > 0. **K14-L (Danh sách 1, 2, có tên hiển thị nhân viên):** INV tự chạy dòng lệnh ORC đưa, trong cửa sổ Terminal của macOS, theo 5 luật kênh của runbook K14-L. Danh sách chỉ hiện trên màn hình của INV, không qua phiên ORC, không vào chat, repo hay subagent."
  - "**Khi chạy:** K14 đếm ngay sau Release có `r5-h1c`, không phải lúc cắt tag. K14-L khi K14 ra (a) > 0 hoặc (b) − (b3) > 0, INV chạy trong ngày. Chạy lại cả hai, theo cùng cách, nếu kỳ chi kế tới trước khi INV xử lý xong."
- Trạng thái: Open

### FB-R5-SEC-ARC-158-02
- Mức độ: Suggestion
- Người nhận: ARC (chữ 0.3.14), QA (ca thứ tự)
- Vị trí: `contract-0.3.13.md` 1.26 (k) (dòng 810)
- Vấn đề:
  - (k) ghi "If-Match (428/412) → lỗi dạng của thân → 409 trạng thái đơn → 403 → …".
  - Trong mã (`main`):
    - controller đọc `If-Match`, thiếu thì 428;
    - service kiểm dạng thân (`f.done()`) **trước** khi tải đơn;
    - rồi tải đơn (ngoài phạm vi thì 404);
    - rồi mới so phiên bản (412, `assertVersion`).
  - Như vậy: FD gửi `If-Match` cũ kèm `closerUserId` sai dạng thì nhận 422, không phải 412 như chữ (k). Chữ (k) cũng bỏ mất 404.
  - Không lộ gì: lỗi dạng không đọc dữ liệu; 412 trả `currentVersion`, mà FD+ đã đọc được qua ETag của `getReservation`.
- Đề xuất sửa: "428 (thiếu/sai `If-Match`) → 422 lỗi dạng của thân (kiểu, biên, uuid; trước khi tải đơn) → 404 → 412 → 409 trạng thái đơn (`editable`; đơn `checked_out` có trường khác) → 403 (mỗi 403 một `access.denied`) → 422 cần đơn (`closerUserId` `NOT_IN_LIST`/kênh, `closerChangeReason`) → 409 hoa hồng `payable`/`paid`". QA thêm ca "If-Match cũ + uuid sai dạng → 422".
- Trạng thái: Open

### FB-R5-SEC-ARC-158-03
- Mức độ: Suggestion
- Người nhận: ARC (chữ (m) và dòng 1I-03 ở mục 12), FE-A (biết)
- Vị trí: `contract-0.3.13.md` 1.26 (m) (dòng 812); `ARC-on-contract-0.3.13-reviews.md` mục 12, dòng `FB-R5-SEC-ARC-1I-03`
- Vấn đề:
  - (m) nằm trong danh sách "ghi chữ ở 0.3.14". Mục 12 ghi cả thẻ là "Deferred – 0.3.14 (m) – UXD, FE-A".
  - Thực tế phần UXD đã xong: `copy-v1.0.5.md` bản 2.5, 9.16, khóa `rsv.closer.reason_help`. UXD còn ghi đây là điều kiện bắt buộc của PR Desk đổi người chốt.
  - Đọc theo mục 12, FE-A có thể hiểu là dòng nhắc được đợi tới 0.3.14, trong khi ô lý do có thể lên Desk trước.
  - Ô lý do không có dòng nhắc thì OWN có thể gõ số hoa hồng vào lý do, và FD/FDL đọc được lý do đó qua Lịch sử đơn.
- Đề xuất sửa:
  - (m): "Phần UXD xong (copy 2.5, 9.16). FE-A gắn `rsv.closer.reason_help` **trong cùng PR** thêm ô lý do đổi người chốt, ở bất kỳ bản nào. Chỉ câu trỏ ở `closerChangeReason` là việc 0.3.14 của ARC."
  - Mục 12: "UXD Done; FE-A cùng PR Desk đổi người chốt; ARC Deferred 0.3.14 (m)".
- Trạng thái: Open

### FB-R5-SEC-ARC-158-04
- Mức độ: Suggestion
- Người nhận: ARC (chữ (x)), BE làn 5B-2 (test), BA và PO (phần chốt tay)
- Vị trí: `contract-0.3.13.md` 1.26 (x) (dòng 823)
- Vấn đề: (x) ghi đúng thiết kế của thẻ SEC 148-02. Còn thiếu hai thứ thẻ đã nêu:
  - **Ca test.** Thiếu ca P1 của SEC:
    - yêu cầu 5B-1 bị từ chối, người khác tạo lại, FD đặt nơi nhận `cash` → 409;
    - chi tiền mặt → 409;
    - cùng hai ca cho yêu cầu thay thế pha trộn (DOM 148-03 (i));
    - một ca cho S2 sau khi khôi phục B12, vì (x)(iii) đóng lỗ ở (v).
  - **Người làm và hạn của phần chốt tay tới v1.0.6.** (x) chỉ ghi "câu sổ tay DOM 148-04 ý 2, lời dặn người duyệt của SEC". Trên `main` chưa có câu nào trong hai câu này. 5B-1 lên ở v1.0.5, nên lỗ P1 có thật từ v1.0.5 tới v1.0.6. SEC chấp nhận mức Low chính nhờ hai câu này.
- Đề xuất sửa: thêm vào (x):
  - "Test bắt buộc: P1 (đặt `cash` → 409, chi tiền mặt → 409) trên yêu cầu tạo lại và yêu cầu thay thế; S2 sau B12."
  - "Tới v1.0.6: BA thêm DOM 148-04 ý 2 vào sổ tay (cùng PR Desk 5B-1, như thẻ DOM). PO đặt lời dặn người duyệt của SEC ('Đơn đã hủy có khoản tiền về sau khi hủy: không duyệt yêu cầu hoàn có nơi nhận tiền mặt.') vào release notes v1.0.5 hoặc phần duyệt hoàn của sổ tay chủ đầu tư, trước tag v1.0.5."
- Trạng thái: Open

### FB-R5-SEC-ARC-158-05
- Mức độ: Suggestion
- Người nhận: ARC (khi viết hợp đồng (z)), BE-H
- Vị trí: `contract-0.3.13.md` 1.26 (z) (dòng 825)
- Vấn đề:
  - (z) đổi luật quyền đã duyệt ở 1h/1i: nhận `closerUserId: null` sau nhận phòng; gửi lại đúng người chốt hiện tại thì đồng bộ lại; nới 409 `checked_out`.
  - (z) cũng sinh dòng `void` cho hoa hồng (`closer_corrected`).
  - Mục này chỉ ghi "ARC, BE-H, DOM xem". Chưa ghi SEC, cũng chưa ghi điều kiện bảo mật.
- Vì sao quan trọng: đây là thao tác đổi người được chi tiền. Không ghi điều kiện từ đầu thì dễ mất các luật đã có: chỉ OWN; `access.denied`; lý do ở cột `reason`; không ghi số tiền.
- Đề xuất sửa: thêm "SEC xem" và các điều kiện sau vào (z), để ARC viết vào hợp đồng khi làm:
  1. Cả hai việc chỉ OWN, sau nhận phòng. Vai khác → 403, đúng một `access.denied` (`CLOSER_CHANGE_AFTER_CHECKIN`), như 1H-03. `null` trước nhận phòng theo luật đổi của 1h, không mở đường mới cho FD/FDL.
  2. Lý do bắt buộc, nằm ở cột `reason`, không ở `after`. Áp dòng nhắc 1I-03.
  3. Audit của `void` / đồng bộ lại chỉ có id, trạng thái, `void_reason`. Không có tỷ lệ hay số tiền hoa hồng (cùng tinh thần 1H-02 và SEC 129).
  4. Thứ tự lỗi theo (k) đã sửa (158-02). Thêm ca: FD/FDL/MGR gửi `null` sau nhận phòng → 403, không ghi gì.
- Trạng thái: Open

### FB-R5-SEC-ARC-158-06
- Mức độ: Suggestion
- Người nhận: DOM (luật), ARC (chữ C0313-38), BE (một điều kiện SQL). Hạn: 0.3.14 / v1.0.6, cùng DOM 148-05. Không chặn #158.
- Vị trí: `openapi.yaml` `recordPayment` (B), gạch "Bổ sung 1j (BE C0313-38 …)" (dòng 5952); `payments.service.ts` `recordAfterClosure` (`UPDATE deposit_notice … WHERE reservation_id = $1 AND status = 'open'`)
- Vấn đề:
  - Chữ 1j và mã #148: mọi khoản thu ghi sau lúc đóng đơn đều đóng mục `deposit_after_cancel` và chuyển **mọi** báo `open` của đơn thành `handled`. Kể cả khoản `card_pos` (phí hủy, phí không đến – 105-03).
  - Báo "khách đã chuyển" nói về một lần chuyển khoản. Một khoản quẹt thẻ ở quầy không trả lời báo đó. Ví dụ: đơn trực tiếp đã hủy còn phí; sale báo khách đã chuyển; lễ tân quẹt thẻ thu phí. Báo chuyển khoản thành `handled` mà không ai kiểm sao kê.
- Vì sao quan trọng: đây đúng là điều S8 muốn tránh: một báo về tiền thật của khách bị đóng mà không ai quyết. Mức thấp:
  - tiền nằm trong tài khoản OTTIMO, không ai lấy ra được;
  - báo vẫn nối với `handled_payment_id`;
  - đối soát sao kê của chủ đầu tư sẽ thấy một khoản tiền vào không khớp.
  Nhưng khách có thể chờ hoàn lâu.
- Đề xuất sửa: chỉ khoản `bank_transfer` / `vietqr` mới tự đóng báo và mục. Khoản `card_pos` để mục mở; FD+ kiểm rồi đóng tay ("Không thấy tiền", ghi mã phiếu vào ghi chú, như vế mới của `createDepositNotice`). DOM quyết. Nếu DOM giữ luật hiện tại, ghi một câu ở sổ tay: "quẹt thẻ phí trên đơn có báo 'khách đã chuyển' thì vẫn kiểm sao kê".
- Trạng thái: Open

---

## Trạng thái thẻ SEC liên quan

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-ARC-1I-01 (Suggestion) | Đã vào 0.3.14 (k), đúng người, đúng lúc. Còn mở tới khi chữ 0.3.14 có thứ tự như 158-02 |
| FB-R5-SEC-ARC-1I-02 (Minor) | Phần OPS: Closed khi #155 gộp. Phần ARC: có chữ ở 1.30; **Closed khi sửa 158-01** |
| FB-R5-SEC-ARC-1I-03 (Suggestion) | Phần UXD: **Done** (copy 2.5, 9.16). Phần FE-A: mở, cùng PR Desk đổi người chốt. Phần ARC: 0.3.14 (m) – 158-03 |
| FB-R5-SEC-BE-148-02 (Minor) | Deferred v1.0.6 qua (x), đúng người. Chốt tay tới v1.0.6: 158-04 |
| SEC `SEC-on-bug-r5-002.md` 4.4 ý 4 | **Thay** bằng chữ C0313-38 (SEC đồng ý, mục B.1) |
| S2 sau khôi phục B12 (ARC (v)) | Low, chấp nhận tới v1.0.6; (x)(iii) đóng lỗ |

ESC mới: **không**.

## Điểm làm tốt

- Trường mới mang `x-visible-to` ngay trong hợp đồng, nên serializer sinh từ hợp đồng tự bỏ trường cho vai khác. PR DTO sau này không thể quên luật này.
- 1j sửa lại chữ "không đổi mã" thành đúng sự thật của #148, không giữ một câu sai cho đẹp.
- Danh sách 0.3.14 ghi người làm ở cuối từng mục, nên kiểm được từng thẻ, kể cả thẻ của SEC.

## Dòng decision-log (ORC ghi)

| 2026-11-07 | 5 | **SEC – review ARC PR #158 (hợp đồng 0.3.13 bổ sung 1j + danh sách 0.3.14 (k)–(z)) @ bf3070fa: DUYỆT CÓ ĐIỀU KIỆN.** Gộp khi CI xanh trên đúng SHA (E2E smoke đang chạy lúc đọc). Điều kiện: sửa 158-01 trước lần chạy K14-L đầu tiên, nên sửa ngay trong #158; commit sửa chỉ đổi câu đó thì SEC giữ kết luận. (A) Reservation.cancellation.cancelledFrom: x-visible-to FD+, openapi-schemas.ts v = FD+ ở cả hai chỗ (Reservation, changeRoom 200); serializer kiểm v ở mọi tầng lồng, khóa vắng với SAL/CTV/HK/công khai; không operation khách hay HK nào trả Reservation, không SSE serializeSchema; CHECK 0013 giữ hold hoặc confirmed. Không lộ gì mới: SAL/CTV đã suy ra được từ progress và reasonCode trên đơn của mình; không dò được qua lỗi (recordPayment chặn người không phải FD+ trước luật type; createDepositNotice 202 như nhau). (B) C0313-38 thay SEC bug-r5-002 4.4 ý 4 ("đóng khi khôi phục và đã đối soát"): SEC đồng ý, vì reconcile_overdue (MGR+) đếm mọi khoản pending, tiền chỉ chi sau đối soát, afterClosureOnly (S6), audit khôi phục và tin OWN/MGR giữ ở 1.21; S7, S8 không yếu đi. C0313-34 chỉ sửa chữ, kiểm sớm ở 5 bộ đọc giữ nguyên. 1.30: K14 ghim, chỉ đọc, đúng 1I-02; nhưng "đầu ra tới ORC/INV" và "gửi chủ đầu tư" ngược luật kênh 155-01 (K14-L chỉ trên màn hình Mac của INV). 1H-02 không bị đụng. (C) 1I-01 → (k), 1I-03 → (m), 148-02 → (x): đúng người. Thẻ: 158-01 Minor ARC (sửa câu kênh ở 1.30: K14 đếm ORC báo trong chat; K14-L INV tự chạy theo 5 luật); 158-02 Suggestion ARC/QA (thứ tự (k) theo mã: 428 → 422 dạng → 404 → 412 → 409 trạng thái → 403 → 422 cần đơn → 409 hoa hồng); 158-03 Suggestion ARC (dòng nhắc 1I-03 UXD đã xong, FE-A gắn cùng PR Desk đổi người chốt, chỉ câu hợp đồng là 0.3.14); 158-04 Suggestion ARC/BE 5B-2/BA/PO (test P1 và S2 sau B12; người làm và hạn trước tag v1.0.5 cho câu sổ tay DOM 148-04 ý 2 và lời dặn người duyệt); 158-05 Suggestion ARC/BE-H (SEC xem (z), 4 điều kiện: chỉ OWN + access.denied, lý do ở cột reason, audit không tỷ lệ hay số tiền, ca null → 403); 158-06 Suggestion DOM/ARC/BE (card_pos không tự đóng báo "khách đã chuyển"). S2 sau khôi phục B12 (ARC (v)) Low, chấp nhận tới v1.0.6. Không ESC | SEC | rounds/round-05/reviews/SEC-on-arc-pr-158.md |
