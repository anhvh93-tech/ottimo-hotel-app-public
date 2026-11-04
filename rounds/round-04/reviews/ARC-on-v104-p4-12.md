# ARC review mã – P4-12 `v104/be-refund-dest` (BE-D, PR-I)

- Round 4 (v1.0.4), bước **Review chéo** (ma trận BE → ARC), 04/11/2026
- Đối tượng: `origin/v104/be-refund-dest` @ `d14288c6` (2 commit trên nền `9ddda8a5`), so với `origin/main` @ `7b5b6117`.
- Căn cứ: `plan-v1.0.4.md` dòng P4-12 và quyết định ARC 6.3; `v1.0.4-contract-0.3.12.md` (g) và mục 3 dòng BE-D; `SEC-on-plan-v1.0.4.md` 1.2 (7 điều kiện); `SEC-on-v104-be-d.md` (ĐẠT CÓ ĐK, BED-01…06); báo cáo `rounds/round-04/outputs/BE/v1.0.4-be-d-refund-dest.md`.
- Không sửa mã. Test dùng số tài khoản giả. Tệp này không có số tài khoản hay tên chủ tài khoản.

## Phán quyết: **ĐẠT**

Không có Blocker/Major. Điều kiện trước gộp của SEC đã xong trên `d14288c6`:
- `refund.destination_carried` đã có trong `openapi.yaml` 0.3.12 trên `main` (PR #35);
- dòng `money-actions.ts` giống từng ký tự giữa hai nhánh, nên gộp không xung đột;
- BED-02: ca (f) quét thêm `staff_notification`, có chú thích "thay `privacy-log-check.sh`".

Còn 2 thẻ Minor và 1 Suggestion, nên làm trong PR, không chặn.

## 1. Cách kiểm
- Đọc toàn bộ diff mã: `folio.service.ts`, `refund-routing.ts`, `refunds.service.ts`, `refund-decision-hooks.ts`, `audit-fields.ts`, `money-actions.ts`. Đọc ngữ cảnh `closeStayCredit` và `refundsDownToCredit` trên cây gộp.
- Cây gộp thử (scratch) `main` + P4-10 + P4-11 + P4-12 + P4-14: `tsc` đạt, `eslint` 0 lỗi. `v104-refund-dest` 7/7 và `module-boundaries` xanh, trong bộ 468/468. Toàn bộ `@ottimo/api` trên cây gộp: 4012 đạt, 0 lỗi (`ARC-on-v104-p4-10.md` mục 1).
- `git merge-tree` với `main`: sạch. Với P4-10 (cùng đụng thành phần worker): sạch, `tsc` đạt.

## 2. Đúng thiết kế ARC 6.3 và hợp đồng (g)

| Ý 6.3 / (g) | Mã | Kết quả |
|---|---|---|
| Chỉ khi đóng các yêu cầu của **cùng đơn** và tạo **một** yêu cầu thay thế | `closeStayCredit`: chỉ khi `plan.createVnd > 0`. `refundsDownToCredit`: chỉ khi `createVnd > 0 && cancelReason === 'superseded'` (loại `no_show_restored`, đúng đính chính SEC 1.1) | Đúng (thẻ P412-02 Suggestion) |
| Mọi yêu cầu bị đóng có nơi nhận đều cùng **một** nơi nhận và cùng khách → chép; khác → không | `peekCarryableDestination`: so bộ khóa (phương thức, BIN, số TK, chủ TK chuẩn hóa). Khác đơn, khác người nhập, thiếu bản mã → `null` | Đúng, chặt hơn 6.3 (thêm "cùng người nhập" – giữ maker-checker, SEC đồng ý) |
| Chép **trong cùng giao dịch**, giải mã **trước** khi tự hủy yêu cầu cũ, mã hóa lại DEK mới / AAD id mới | `peek` chạy trước vòng `autoCancel`/`cancelApproved`; `apply` chạy sau `submitStayRefund` trong cùng `tx`, dưới khóa folio + `openRefunds(lock)`; `cipher.encrypt` với `subjectId` và AAD của id **mới** | Đúng |
| Chép `refund_destination_set_by/at` gốc | `UPDATE … refund_destination_set_at = $7, refund_destination_set_by = $8` từ nguồn | Đúng |
| Lỗi → hủy cả giao dịch | giải mã/niêm phong ném lỗi, không bắt. Ca (e) | Đúng |
| Rồi xóa ở yêu cầu cũ theo SEC-BE-45 | hook `onDecided('refund', cancelled)` vẫn purge như cũ. `apply` kiểm mọi nguồn đã `cancelled` thật, không thì không chép | Đúng |
| Yêu cầu mới vẫn **Chờ duyệt** | `apply` chỉ chép khi đích `pending`/`escalated`, chưa có nơi nhận, cùng đơn | Đúng |
| Audit `refund.destination_carried` chỉ mã yêu cầu | `after: { fromApprovalIds, toApprovalId }`. Allowlist `approval_request` chỉ thêm 2 khóa id. `c3_access_log` `create` (mới), `purge` (cũ), 0 `view` | Đúng |
| Không số tài khoản ra log/audit/Problem | ca (e) stdout/stderr + thân 500; ca (f) quét `audit_event`, `c3_access_log`, `outbox_message`, `staff_notification` | Đúng (thẻ P412-01 về một đường còn lại) |

## 3. Kiến trúc
- **Đảo phụ thuộc đúng mẫu có sẵn:** `folio/public/refund-routing.ts` khai kiểu `RefundDestinationCarrier`/`Carry`. `payments` cung cấp bản cài qua `provideRefundDestinationCarrier`, giống `provideQrDueNow`. Bản rõ chỉ nằm trong closure của `RefundsService`. Folio chỉ nhận `{ apply }`.
- **Nối dây ở cả api và worker:** `wireRefundDecisionHooks` gọi `provideDestinationCarrier()`. Hàm này chạy ở `payments.module.ts` (api) và `payments/public/worker-hooks.ts` (worker, J15 `folio.close`). Không có thành phần nào có hook purge mà thiếu bộ chép, hay ngược lại.
- **Thành phần worker mới của P4-10** (`reservationWorkerComposition`) có `FolioService` riêng, không có bộ chép và không có hook purge của `refund`. Chấp nhận được: J1 chỉ hủy hold **chưa nhận tiền**, nên không có yêu cầu hoàn nào. Khi đó `peekDestination` trả `null`, tức là về cách v1.0.3.
- **Khóa:** không thêm khóa mới. `apply` khóa `FOR UPDATE` dòng đích. Dòng này vừa tạo trong cùng giao dịch, nên không có chờ.
- **Idempotency:** thao tác gốc (ghi phát sinh, đóng folio, J15) có `Idempotency-Key`/khóa job như cũ. Lần chạy lại không có yêu cầu nào để thay, nên không chép lần hai.
- **Hiệu năng:** vài dòng mỗi lần, một lần giải mã mỗi nguồn `bank_transfer`.

## 4. Test theo tiêu chí nghiệm thu

| AC (plan P4-12) | Ca |
|---|---|
| Một yêu cầu cũ có nơi nhận → yêu cầu mới có cùng nơi nhận, yêu cầu cũ bị xóa nơi nhận (SEC-BE-45 giữ) | (a): giải mã đúng trên id mới; bản mã + DEK cũ đã mất; `c3_access_log` create + purge, không view |
| Hai yêu cầu khác nơi nhận → yêu cầu mới không có | (b), gồm cả "cùng số TK nhưng hai người nhập" |
| Khác khách → không mang | "another booking → nothing carried" |
| Log/Problem sạch | (e), (f) |
| Maker-checker | (d): MGR đã nhập thì 403 + CHECK 0042; MGR khác duyệt được |
| Biên | (c): một có một không → mang; chủ TK khác hoa thường/dấu cách → mang |

## 5. Thẻ

### FB-R4-ARC-BE-D-P412-01
- Mức độ: Minor (nên làm trong PR-I; không kịp thì v1.0.5)
- Vị trí: `payments/internal/refunds.service.ts` `peekCarryableDestination` (`JSON.parse(await this.cipher.decrypt(…))`, dòng ~201) và `getDestination` (dòng ~576)
- Vấn đề: SEC để ở mức Info (BED-03 ý 2). ARC nâng lên Minor vì P4-12 thêm **một chỗ gọi mới** của cùng mẫu, và trên đường này lỗi được ném thẳng ra `ProblemFilter`. Bộ lọc ghi `unhandled error … ${describeError(err)}` = `name: redactText(message)`. `redactText` che thẻ, CCCD/CMND, SĐT, email, hộ chiếu, **không** che số tài khoản ngân hàng hay tên chủ tài khoản. Nếu bản rõ giải mã được mà không phải JSON (chỉ khi có lỗi ghi), thông báo `SyntaxError` của V8 trích nguyên chuỗi vào, ví dụ `Unexpected token 'a', "…" is not valid JSON`. ARC đã thử trên Node 22: chuỗi ngắn được in nguyên văn. Phần đó đi ra stdout của api.
- Vì sao quan trọng: số tài khoản khách là dữ liệu C3. Ca (e) chỉ phủ lỗi **giải mã**, chưa phủ lỗi **đọc JSON** sau khi giải mã.
- Đề xuất sửa: một hàm chung `parseRefundAccount(plain)`, dùng ở cả `peek` và `getDestination`. Hàm `try/catch` rồi ném `new Error('refund account unreadable')` không kèm nội dung, và kiểm kiểu hai trường. Thêm một ca: bản rõ niêm phong hợp lệ nhưng không phải JSON → thao tác 500, stdout/stderr và thân 500 không chứa chuỗi thử.
- Trạng thái: Open

### FB-R4-ARC-BE-D-P412-02
- Mức độ: Suggestion
- Vị trí: `folio/public/folio.service.ts` `closeStayCredit` (`const destination = plan.createVnd > 0 ? … : null`)
- Vấn đề: `closeStayCredit` dựa vào điều ngầm "`createVnd > 0` ⇒ `cancelReason = 'superseded'`". `refundsDownToCredit` thì viết rõ `cancelReason === 'superseded'`. Hai chỗ gọi cùng một luật (đính chính SEC 1.1) nhưng viết hai cách. Ai đổi cách tính `cancelReason` sau này có thể làm `closeStayCredit` mang nơi nhận ở một lý do không phải `superseded`.
- Đề xuất: viết `plan.createVnd > 0 && cancelReason === 'superseded'` ở cả hai chỗ. Hoặc chuyển điều kiện vào `peekDestination(tx, ids, reservationId, cancelReason)` để chỉ còn một nơi quyết.
- Trạng thái: Open

### FB-R4-ARC-BE-D-P412-03
- Mức độ: Minor
- Vị trí: `peekCarryableDestination`, vòng `for (const r of rows)`
- Vấn đề: hàm giải mã từng nguồn `bank_transfer` ngay trong vòng, **trước** khi biết các nguồn có cùng phương thức, BIN, đơn và người nhập không (BED-03 ý 1 của SEC). Khi chắc chắn không mang, bản rõ vẫn đã nằm trong bộ nhớ. Có lỗi giải mã ở nguồn sẽ không được mang thì cả thao tác của quầy vẫn trả 500.
- Đề xuất: tách hai lượt. Lượt 1 so các trường không mã hóa (`target`, `refund_method`, `refund_bank_bin`, `refund_destination_set_by`, có bản mã) trên mọi dòng. Lượt 2 chỉ giải mã khi lượt 1 qua. Không đổi kết quả của 7 ca hiện có. Có thể làm cùng P412-01.
- Trạng thái: Open

## 6. Điểm làm tốt
- Hai bước `peek` → `apply` tách rõ "đọc trước khi purge" và "ghi sau khi tạo". Bản rõ không bao giờ rời `payments`.
- Tự thêm hai chốt an toàn khi lỗi (khác người nhập; nguồn phải `cancelled` thật). Cả hai nhánh đều quay về cách v1.0.3, không bao giờ mang sai.
- Phối hợp hợp đồng tốt: dòng `money-actions.ts` giống hệt P4-00, nên gộp được theo mọi thứ tự.
