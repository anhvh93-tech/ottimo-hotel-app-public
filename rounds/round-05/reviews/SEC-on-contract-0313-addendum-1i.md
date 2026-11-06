# SEC – Review hợp đồng 0.3.13 bổ sung 1i (ARC, PR #152)

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần của PR | CI lúc đọc |
|---|---|---|---|---|
| #152 | `r5-contract-1i` → `main` | **`ca276f8a`** | Ba commit riêng: `a43c1691` (1i: C0313-31, 32, BE-H 1H-01/02, DOM 1H-01), `b722fbc4` (gộp SEC 1H-01…03), `dc9dd48b` (ghi chú FE gửi `closerChangeReason`). Các commit còn lại gộp `main` và gộp `r5-contract-1h` (#147 @ `35e88ffd`); `git show --remerge-diff` của mọi commit gộp đều rỗng | Mọi job xanh, gồm API contract (RBAC `--strict`), Redocly, gitleaks, confidential paths, E2E smoke |

Đối chiếu:
- các thẻ của SEC ở `SEC-on-contract-0313-addenda-1g-1h.md` (1H-01, 1H-02, 1H-03; ARC-24 và luật SR-PAY-10 bản 07/11);
- `contract-0.3.13.md` mục 1.30 và 0.3.14 (b), (i), (j); `ARC-on-contract-0.3.13-reviews.md` mục 11; `architecture.md` 5.1;
- mã đang có: `main` (`auth.guard.ts` `mfaRequired`, bảng `idempotency_key`), #154 (`r5-h1c` @ `4e81c3be`). SEC chỉ đọc #154 để xem chữ 1i có khớp mã hay không, chưa phải review #154;
- `SEC-on-ops-pr-129-r4.md` (cách chạy K13).

Cách kiểm: đọc `gh pr diff 152` và từng commit riêng trong `refs/pull/152/head`. Ba commit riêng chỉ sửa chữ mô tả trong `openapi.yaml` và `api-client` (sinh lại), không đổi schema, `enum`, `required`, `x-roles` hay phần mở rộng. Phần `closerChangeReason` (D12c) ở `openapi-schemas.ts` và `traceability.md` là của 1h.

## Kết luận: **DUYỆT** PR #152 @ `ca276f8a`

0 Blocker · 0 Major · 1 Minor · 2 Suggestion, không thẻ nào chặn gộp. Thứ tự gộp: #147 trước, rồi #152 (PR xếp chồng). Ba thẻ 1h của SEC được gộp đúng ý. Không câu nào làm yếu luật SEC.

| Mục 1i | Kết quả | Ghi chú |
|---|---|---|
| **1H-01**: lý do vào cột `reason` | **Đạt → Closed (phần ARC).** `updateReservation` và `ReservationPatch.closerChangeReason`: lý do ghi vào `AuditEntry.reason`, không vào `after`; `after` = `{ closerUserId }`; allowlist `reservation` chỉ thêm `closerUserId` (một id). `#154` @ `4e81c3be` đã làm đúng: `reason` ở cấp trên của bản ghi audit; `reservations/audit-entities.ts` chỉ thêm `closerUserId`, kèm chú thích cấm khóa `reason` | Người đọc lý do vẫn là nhóm D12c (FD+, qua `getReservationHistory`) – xem thẻ 1I-03 |
| **1H-02**: không ghi số thưởng vào audit | **Đạt → Closed (phần ARC).** `architecture.md` 5.1 và 0.3.14 (b): PR-M chỉ ghi id và trạng thái, không khai khóa thưởng ở `defineManagerOnlyAudit`; số thưởng chỉ đọc qua `getManagerPerformanceBonus` (`x-roles: [owner, manager]`, `x-scope: { manager: own }`). Cổng một mức OWN/MGR không có gì để che, nên MGR này không thấy được thưởng của MGR khác | SEC xem lại ở PR-M: không bản ghi audit, tin báo hay báo cáo nào mang số thưởng |
| **1H-03** ý 1, 2: `access.denied` ở cả hai nhánh 403, thứ tự lỗi | **Đạt → Closed (phần ARC).** Hai mã `auditReason`: `CLOSER_CHANGE_BEFORE_CHECKIN`, `CLOSER_CHANGE_AFTER_CHECKIN`. Mỗi 403 ghi đúng một dòng, không chứa lý do người gọi gõ. Thứ tự 403 → 422 → 409. `#154` kiểm quyền ngay sau khi tải đơn dưới khóa. Lỗi `NOT_IN_LIST` của người chốt và lỗi của lý do chỉ trả ở `f.done()` sau 403, nên vai bị từ chối không dò được danh sách người chốt, luật lý do hay trạng thái hoa hồng | Một chỗ chữ cần rõ hơn: thẻ 1I-01 |
| **1H-03** ý 3: dòng `rbac-matrix` | **Deferred 0.3.14 (j)**, BA làm, ARC xem. SEC đồng ý: đổi `rbac-matrix` mà không đổi tệp màn hình cùng lúc thì `main` đỏ | – |
| **C0313-31** phương án B: số thẻ ở ô mã báo trước | **Đạt.** `bankReference` qua kiểu và mẫu của chính ô mà giống số thẻ → 422 `CARD_NUMBER_DETECTED` một mình, trước lỗi của trường khác và trước `NOT_ALLOWED` (phương thức); không ghi gì. Cùng luật với `posAuthCode` (BUG-R2-043). SEC thấy B tốt hơn A: người gõ được báo ngay ô đó là số thẻ, kể cả khi phương thức sai. Câu lỗi không lặp giá trị. Mã giống số thẻ có khoảng trắng thì trượt mẫu `^[A-Za-z0-9./_-]{1,64}$`, nên cũng không được lưu | ARC ghi #148 @ `d533a387` đã theo thứ tự này. SEC kiểm ca (iv) khi review #148 |
| **C0313-32**: danh sách test PR-B3 | **Đạt.** Đủ các ý SEC cần ở ARC-24: (i) SAL `confirmDeposit` 409 không có `duplicateReservationCode`; (ii) theo cột kiểm của SR-PAY-10 bản 07/11, có ca **HTTP ở từng đường** `PaymentCreate`, vì bộ đọc lặng lẽ bỏ khóa không khai; (iii) đóng "Không thấy tiền" mà thiếu ghi chú → 422, không dòng audit; (iv) hai ca thứ tự lỗi | – |
| `GroupDepositInput` để R3 | **Đạt.** `allocateGroupDeposit`, `createReservationGroup` chỉ có trong mã sinh ở `main`, không có controller, nên chưa có đường nào bị hở | Luật áp khi R3 làm hai operation này |
| `bankReference` trước PR-B3: bỏ qua, không từ chối | **Đạt, không rủi ro bảo mật.** Trường bị bỏ thì không được lưu. `idempotency_key` chỉ giữ `request_hash` và thân trả lời, không giữ thân yêu cầu. Desk chỉ gửi trường này khi PR-B3 đã lên | – |
| `ReservationCreate.payment` → `initialPayment` | Sửa tên cho đúng schema (`initialPayment`) | – |
| **C0313-33** → 0.3.14 (i): `p_mfa_roles DEFAULT NULL` | **Đạt, có ghi chú cho 0.3.14.** NULL → `mfa_required = false`, SQL vẫn không chứa tên vai (giữ điều kiện ARC-23). Hướng an toàn có thật: guard `mfaRequired()` chỉ tin `true`; khi khác `true`, guard tự kiểm đủ ba vai (#124, có trên `main`). Thêm DROP, REVOKE/GRANT theo chữ ký mới, và test "chỉ một bản hàm" | Khi review migration 0.3.14, SEC sẽ đòi một ca: gọi hàm không truyền `p_mfa_roles` thì guard vẫn bắt 2FA cho ba vai |
| BE-H 1H-01, 1H-02; DOM 1H-03…05 | Không có ý bảo mật mới. Câu "đơn `checked_out` chỉ nhận người chốt, trường khác → 409" chính là điều kiện SEC đặt ở review 1h. Nay đã có chữ, nên điều kiện đó được gỡ | – |
| DOM 1H-01: truy vấn OPS đọc `reservation_change` | Hướng đúng: repo và runbook chỉ ghi 0 / > 0; danh sách không có dữ liệu khách hay số hoa hồng; gửi chủ đầu tư qua kênh riêng. Còn thiếu cách chạy trên production | Thẻ 1I-02 |

## Thẻ

### FB-R5-SEC-ARC-1I-01
- Mức độ: Suggestion
- Vị trí: `openapi.yaml` `updateReservation`, gạch "Quyền theo mốc" (câu thứ tự của 1i); `contract-0.3.13.md` 1.29 và 1.30
- Vấn đề:
  - Câu ghi "403 → 422 (`closerUserId`, `closerChangeReason`) → 409". Trong mã (#154), lỗi **dạng** của thân được kiểm trước khi tải đơn, nên đi trước 403. Ví dụ: `closerUserId` không phải uuid, hoặc trường lạ.
  - Chỉ các lỗi 422 cần đơn mới đi sau 403: `NOT_IN_LIST`, người chốt không hợp kênh, `closerChangeReason`.
  - Điều này không làm lộ gì, vì lỗi dạng không cần dữ liệu đơn. Nhưng QA viết ca theo chữ sẽ chờ 403 cho FD gửi uuid sai, trong khi máy chủ trả 422.
- Đề xuất sửa: ở 0.3.14, sửa câu thành: "lỗi dạng của thân (kiểu, định dạng) → 403 → 422 cần đơn (`closerUserId` `NOT_IN_LIST`/kênh, `closerChangeReason`) → 409". Hoặc ghi rằng "422" ở đây là các kiểm sau khi tải đơn.
- Người nhận: ARC (0.3.14), QA
- Trạng thái: Open

### FB-R5-SEC-ARC-1I-02
- Mức độ: Minor
- Vị trí: `contract-0.3.13.md` 1.30, "Truy vấn OPS chỉ đọc (DOM 1H-01)"
- Vấn đề:
  - Truy vấn đọc production và trả tên hiển thị nhân viên, mã đơn, người hưởng hoa hồng. 1.30 chỉ ghi phần đầu ra ("0 / > 0, như K13").
  - 1.30 chưa ghi cách chạy mà SEC đã duyệt cho K13 (`SEC-on-ops-pr-129-r4.md`): câu SQL ghim bằng SHA và SEC xem trước; vai chỉ đọc; `default_transaction_read_only`; `statement_timeout`/`lock_timeout`; không in ra log CI hay chat; xóa tệp tạm.
  - Câu "chạy ngay sau khi `r5-h1c` lên, gửi trong ngày" dễ dẫn tới một lần chạy tay ngoài quy trình.
- Vì sao quan trọng: đây là đọc dữ liệu production có tên người và quan hệ hoa hồng. Không có cách chạy được ghim thì không ai kiểm được câu đã chạy là câu nào, và kết quả có thể rơi vào nơi không nên có.
- Đề xuất sửa: OPS viết truy vấn thành một khối runbook như K13, gồm SQL ghim SHA, chạy bằng vai chỉ đọc, đầu ra chỉ tới ORC/INV qua kênh riêng. SEC duyệt khối đó ở PR runbook **trước lần chạy đầu**. ARC thêm một dòng ở 0.3.14 hoặc 1.30: "chạy theo khối runbook đã ghim, như K13". Không chặn gộp #152.
- Người nhận: OPS (runbook), ARC (một dòng chữ), SEC (duyệt khối)
- Trạng thái: Open

### FB-R5-SEC-ARC-1I-03
- Mức độ: Suggestion
- Vị trí: `ReservationPatch.closerChangeReason`; ghi chú FE ở `updateReservation` (`dc9dd48b`); ô "Lý do đổi người chốt" khi FE-A làm
- Vấn đề:
  - Lý do nằm ở cột `reason` của `reservation.closer_changed`. `getReservationHistory` trả cột này cho FD/FDL, vì bản ghi có `entityType = reservation` và không bị cổng 131-01 lọc.
  - Schema đã ghi "không ghi … số tiền hoa hồng". Nhưng nếu OWN gõ tỷ lệ hay số tiền hoa hồng vào lý do (ví dụ để giải thích vì sao đổi), FD/FDL vẫn đọc được. Cổng #149 không che chữ tự do.
- Đề xuất sửa: dòng help dưới ô (UXD viết, FE-A gắn, luôn hiện như D12c ở #145) nói rõ "nhân viên lễ tân đọc được lý do này" và "không ghi họ tên, số giấy tờ của khách, tỷ lệ hay số tiền hoa hồng". Máy chủ không cần thêm luật.
- Người nhận: UXD, FE-A (PR đổi người chốt trên Desk)
- Trạng thái: Open

## Trạng thái thẻ SEC 1h sau 1i

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-ARC-1H-01 (Minor) | **Closed** phần hợp đồng. Phần mã: #154 @ `4e81c3be` đã làm; SEC xác nhận khi review #154 |
| FB-R5-SEC-ARC-1H-02 (Minor) | **Closed** phần hợp đồng. Phần mã: SEC xem ở PR-M |
| FB-R5-SEC-ARC-1H-03 (Suggestion) | Ý 1, 2 **Closed** phần hợp đồng (mã ở #154); ý 3 **Deferred** 0.3.14 (j), BA |
| Điều kiện "đơn `checked_out` chỉ nhận người chốt" (review 1h) | **Đã đủ**, có chữ ở 1i |

ESC mới: **không**.

## Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – hợp đồng 0.3.13 bổ sung 1i (PR #152 @ ca276f8a, chỉ mô tả, xếp trên #147): DUYỆT, gộp sau #147.** 1H-01 Closed phần hợp đồng (lý do ở cột reason của audit, after = closerUserId, allowlist chỉ thêm closerUserId; #154 @ 4e81c3be đã làm đúng). 1H-02 Closed phần hợp đồng (PR-M không ghi số thưởng vào audit, chỉ đọc qua getManagerPerformanceBonus OWN/MGR của mình; architecture 5.1, 0.3.14 (b)). 1H-03 ý 1, 2 Closed (access.denied CLOSER_CHANGE_BEFORE/AFTER_CHECKIN, mỗi 403 một dòng không chứa lý do, 403 → 422 → 409), ý 3 → 0.3.14 (j) BA. C0313-31 phương án B (số thẻ ở bankReference báo trước, cả trước NOT_ALLOWED) SEC đồng ý; C0313-32 đủ ca SEC cần (HTTP từng đường, SAL không duplicateReservationCode, thứ tự, thiếu ghi chú); GroupDepositInput chưa có đường thật; bankReference trước PR-B3 bị bỏ, không lưu; C0313-33 DEFAULT NULL an toàn nhờ guard tự kiểm 3 vai, SEC đòi ca ở migration 0.3.14. Điều kiện checked_out của review 1h đã đủ. Thẻ: 1I-01 Suggestion (lỗi dạng của thân đi trước 403 – sửa câu thứ tự ở 0.3.14), 1I-02 Minor (truy vấn OPS DOM 1H-01 chạy theo khối runbook ghim như K13, vai chỉ đọc, SEC duyệt trước lần chạy đầu), 1I-03 Suggestion (help ô lý do đổi người chốt: FD/FDL đọc được, không ghi số hoa hồng). Không ESC | SEC | rounds/round-05/reviews/SEC-on-contract-0313-addendum-1i.md |`
