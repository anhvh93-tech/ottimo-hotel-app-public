# SEC review mã BE-D: P4-12 `v104/be-refund-dest` và P4-14 `v104/be-sensitive` (phần A)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (trước PR mã) | 04/11/2026
- Đối tượng:
  - `origin/v104/be-refund-dest` @ `8539bbfb`. Báo cáo `rounds/round-04/outputs/BE/v1.0.4-be-d-refund-dest.md`;
  - `origin/v104/be-sensitive` @ `a48f6564`. Báo cáo `rounds/round-04/outputs/BE/v1.0.4-be-d-sensitive.md`.
- Căn cứ:
  - `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 1.2 (7 điều kiện cho P4-12), mục 4 (`guest-portal`, giai đoạn B);
  - `rounds/round-04/reviews/ARC-on-PR24-post-merge.md` thẻ 02–04;
  - `rounds/round-04/reviews/SEC-on-PR24-text-safety.md`.
- Phạm vi đọc: toàn bộ diff mã (không phải test) của hai nhánh so với `main`, cùng tên ca test. Ngữ cảnh `closeStayCredit` / `refundsDownToCredit` và vòng job của `worker.ts` đọc trên nhánh. **Không** tự chạy test.
- Không sửa tệp nào khác. Không commit. Số tài khoản và tên chủ tài khoản trong tệp này đều không có. Chỉ nhắc tới việc test dùng số giả.

---

## 0. Kết luận

**P4-12: ĐẠT CÓ ĐIỀU KIỆN. P4-14 phần A: ĐẠT CÓ ĐIỀU KIỆN.** Không có Blocker hay Major.

| Điểm ORC hỏi | Quyết định SEC |
|---|---|
| 1. Cách hiểu mục 1.2 ý 4 | **BE-D hiểu đúng ý SEC.** Chữ SEC viết mơ hồ, SEC đính chính: chỉ loại `no_show_restored` (và từ chối/hủy tay, vì không tạo yêu cầu thay thế). `refundsDownToCredit(…, 'superseded')` **thuộc phạm vi**. Mã dùng danh sách cho phép (`cancelReason === 'superseded'`), đúng hướng |
| 2. Hai chốt thêm của BE-D | **Chấp nhận cả hai, giữ làm điều kiện.** Khác người nhập thì không mang: bắt buộc, vì đây là chỗ giữ maker-checker. Mọi nguồn phải `cancelled` thật: đúng, và an toàn khi lỗi (không mang). Chú ý một câu trong báo cáo nói quá lên (mục 1.3) |
| 3. `privacy-log-check.sh` | **SEC dẫn sai tệp ở mục 1.2 ý 5.** Đó là script diễn tập khôi phục. Ca (e) (stdout/stderr + thân 500) và ca (f) (quét DB) **đủ** thay. Thêm một điều kiện nhỏ cho (f), thẻ BED-02 |
| 4. PR24PM-02 bỏ điều kiện "ngày/tháng thật" của ARC | **Chấp nhận.** Ca "không được che" (SĐT Nga) quan trọng hơn. Ca còn lọt phải ghi thành test "lọt có chủ ý" (thẻ BED-04) |
| 5. PR24PM-03/04 | **Đạt.** Một chỗ cùng tinh thần còn sót: dòng `job failed` vẫn in `err.message` (thẻ BED-05) |

- Điều kiện **trước khi gộp** P4-12:
  - ARC thêm `refund.destination_carried` vào `openapi.yaml` 0.3.12 (P4-00 (g)). Không có thì test `module-boundaries` đỏ đúng như BE-D báo;
  - thẻ BED-02.
- Thẻ còn lại nên làm trong PR, không chặn QC.
- ESC mới: **không**.

---

## 1. P4-12: đối chiếu 7 điều kiện mục 1.2

| ĐK | Mã | Kết quả |
|---|---|---|
| 1. Thứ tự, cùng giao dịch, lỗi thì hủy hết | `peekDestination` chạy **trước** vòng `autoCancel` ở cả `closeStayCredit` và `refundsDownToCredit`. `apply` chạy **sau** `submitStayRefund`, trong cùng `tx`, dưới khóa folio và `openRefunds(…, { lock: true })`. Giải mã hay niêm phong lỗi thì ném lỗi, giao dịch lùi. Có ca (e) | **Đạt** |
| 2. Mã hóa lại, không chép bản mã | Giải mã bằng `this.cipher.decrypt` với AAD theo id **cũ**, không qua `getDestination`. Niêm phong lại bằng `cipher.encrypt`, `subjectId` + AAD theo id **mới**, DEK mới. Bản rõ chỉ nằm trong closure của `RefundsService`. Folio chỉ nhận `{ apply }` (có test) | **Đạt** |
| 3. Chép nguồn gốc | Chép `refund_method`, BIN, `last4`, `refund_destination_set_by` / `set_at` **gốc**. Có ca (d): người đã nhập duyệt thì 403, `UPDATE` thẳng thì CHECK 0042 chặn | **Đạt** |
| 4. Luật so | Bộ khóa (phương thức, BIN, số TK, chủ TK chuẩn hóa NFC/trim/gộp cách/không phân biệt hoa thường). Nguồn không có nơi nhận thì bỏ qua. Khác nhau, khác đơn hay khác người nhập thì `null`. Chỉ khi `createVnd > 0`. So trong bộ nhớ, không log | **Đạt** (phạm vi: mục 1.1) |
| 5. Nhật ký | `c3_access_log`: `create` cho yêu cầu mới, `purge` cho yêu cầu cũ qua hook như cũ, 0 `view`. Audit `refund.destination_carried` chỉ có `fromApprovalIds` + `toApprovalId`, và allowlist trường audit chỉ thêm đúng 2 khóa id | **Đạt** (thay `privacy-log-check.sh`: mục 1.4) |
| 6. Yêu cầu mới vẫn Chờ duyệt | `apply` chỉ chép khi đích còn `pending`/`escalated`. `minRequiredRole` mang theo `carriedOrigin` | **Đạt** |
| 7. Test (a)–(f) | 7 ca, khớp danh sách SEC, thêm ca "khác người nhập", "chủ TK khác hoa thường/dấu cách", "tiền mặt" | **Đạt** |

### 1.1 Điểm 1: phạm vi áp dụng (đính chính mục 1.2 ý 4)
- Ý SEC khi viết là: chỉ mang khi một yêu cầu **thay thế** cho cùng đơn được tạo, vì yêu cầu đó **sẽ chi** cho cùng khách. `refundsDownToCredit` với `superseded` đúng là trường hợp này. OTM-00379 đi qua đúng đường này. Loại nó thì gói không còn tác dụng.
- `no_show_restored` (B12 mở lại no-show) bị loại vì đây là **hoàn tác** một lần đóng, không phải thay thế cùng mục đích chi. Giữ loại.
- Yêu cầu **đã duyệt chưa chi** (`approvedCancelIds`) bị đóng rồi mang nơi nhận sang yêu cầu mới **Chờ duyệt**: chấp nhận. Yêu cầu mới phải duyệt lại, và người nhập vẫn bị chốt.
- Ở `closeStayCredit`, khi `createVnd > 0` thì `cancelReason` luôn là `superseded` (mã dòng tính `cancelReason`), nên hai chỗ gọi nhất quán.
- Câu chữ đính chính để ORC ghi decision-log: "SEC 1.2 ý 4 = mang nơi nhận ở mọi lần tạo **một** yêu cầu thay thế với lý do `superseded` (gồm `closeStayCredit` và `refundsDownToCredit`). Không mang khi `no_show_restored`, từ chối hay hủy tay."

### 1.2 Điểm 2: hai chốt thêm
- **Khác người nhập thì không mang: bắt buộc.** `refund_destination_set_by` chỉ chứa một người. Nếu mang khi hai người cùng nhập một số TK, người còn lại duyệt được khoản chi tới số mình đã nhập, vượt maker-checker. BE-D tự thấy điểm SEC bỏ sót. Có test.
- **Mọi nguồn phải `cancelled` thật, đích còn `pending`/`escalated`, chưa có nơi nhận, cùng đơn: chấp nhận.** Kiểm nào không qua thì `return` (không mang), tức là quay về cách v1.0.3: quầy nhập lại. Đây là hướng an toàn khi lỗi.

### 1.3 Câu cần sửa trong báo cáo (không phải mã)
- Báo cáo mục 1 viết "Không bao giờ có hai yêu cầu sống cùng một số TK". **Không đúng hoàn toàn:** `refundsDownToCredit` có thể **giữ** một số yêu cầu đã duyệt (`keptApprovedVnd ≤ credit`), và yêu cầu giữ lại có thể cùng số TK với yêu cầu thay thế.
- Về bảo mật thì **chấp nhận được**: cùng khách, cùng đơn, tổng vẫn ≤ số dư có (bất biến K11-06), và mỗi yêu cầu có maker-checker riêng. Nhưng BA/QA không nên dựa vào câu đó. BE-D sửa câu trong báo cáo (thẻ BED-06, Info).

### 1.4 Điểm 3: thay `privacy-log-check.sh`
- SEC dẫn sai tệp. Mục đích của ý 5 là "không chuỗi số TK/tên chủ TK nào lọt ra log, audit hay Problem". Ca (e) (thân 500 + mọi dòng stdout/stderr khi giải mã lỗi) và ca (f) (quét `audit_event`, `c3_access_log`, `outbox_message`) phủ đúng mục đích đó.
- Thiếu một nơi ghi: `staff_notification` (người yêu cầu và người duyệt được báo khi yêu cầu bị đóng). Mã này không ghi gì mới vào đó, nhưng ca (f) nên quét luôn để khóa về sau (thẻ BED-02).
- SEC tự sửa câu ở mục 1.2 ý 5 bằng dòng decision-log (mục 5), không sửa tệp cũ.

### 1.5 Ghi chú khác (không phải thẻ chặn)
- `peek` giải mã **mọi** nguồn có `bank_transfer` trước khi so. Có thể so phương thức/BIN/người nhập trước để không giải mã khi chắc chắn không mang (giảm số lần bản rõ có trong bộ nhớ). Info, thẻ BED-03.
- `JSON.parse(await cipher.decrypt(…))`: nếu bản rõ không phải JSON (chỉ xảy ra khi có lỗi ghi), thông báo `SyntaxError` của V8 có thể trích đầu chuỗi, tức là đầu số TK. Mẫu này đã có ở `getDestination` (dòng ~574) từ trước. Đề xuất một hàm chung `parseRefundAccount()` bọc `try/catch` rồi ném lỗi trơn. Info, thẻ BED-03.
- Lỗi giải mã làm cả thao tác của quầy trả 500 (ca (e): "thêm phát sinh"). SEC chọn vậy ở ý 1 và **giữ**: bản mã hỏng là dấu hiệu sửa dữ liệu, phải báo to. Nếu vận hành thấy chặn việc quầy thì xem lại ở v1.0.5 (khi lỗi thì "không mang + cảnh báo OPS"). Không đổi bây giờ.

---

## 2. P4-14 phần A

### 2.1 PR24PM-02: `PAIR_CHAIN`, bỏ điều kiện "ngày/tháng thật" (điểm 4)
- **Chấp nhận lệch.** Thêm điều kiện (1) của ARC thì `8 912 345-67-89` bị đọc thành CMND 9 số và bị chặn 422. Khách Nga là nhóm khách chính, và SĐT là thứ họ **phải** gõ được. Chặn nhầm thì khách bỏ form hoặc gửi số qua kênh khác. Cái hại đó lớn hơn số ca lọt thêm.
- `PAIR_CHAIN` (≥ 4 cặp hai chữ số, **cùng** một dấu) đóng đúng 3 ca đã nêu: thẻ viết từng cặp, CCCD `07.92.03.01.23.45` và `07-92-03-01-23-45`. Ngày (`12/11/2026`), dải ngày (`12-15/11/2026`) và SĐT Nga không bị ảnh hưởng (có test).
- Rủi ro còn lại, SEC giữ mức **thấp** như `SEC-on-PR24-text-safety.md`:
  - `079.20.30.12.345` (nhóm 3 số xen nhóm 2 số);
  - `079.203.01.23.45` (chỉ 3 cặp cuối);
  - một cặp đơn lẻ giữa thẻ (`4111 1111 11-11 1111`), vì cụm `11-11` bị xóa như ngày.
  - Điều kiện: ghi các ca này thành test **"lọt có chủ ý"** (kỳ vọng không chặn, có chú thích lý do và dẫn tới tệp này). Ai sửa luật sau này sẽ biết đó là quyết định, không phải sót (thẻ BED-04).
- Chi phí regex: `PAIR_CHAIN` không lồng lượng từ, có neo `(?<!\d)`/`(?!\d)`, nên tuyến tính. Test "cost" có thêm 2 chuỗi. Đạt.

### 2.2 PR24PM-03: `logLine` không bao giờ ném lỗi
- **Đạt.** `try/catch` phủ cả bước sao chép `extra` (getter ném lỗi). Khi lỗi thì bỏ **mọi** trường phụ, không in dở dang, nên không có nửa đối tượng lọt ra. `level`/`msg` vẫn ghi đè sau cùng. Luật bỏ `toJSON` (PR24-04) giữ.

### 2.3 PR24PM-04: `no-console` cho worker và jobs
- **Đạt.**
  - ESLint chặn `console` ở `src/worker*.ts` và `src/jobs/**`, có test bằng `lintText` thật;
  - dòng lỗi khởi động là JSON chỉ có tên + mã;
  - `errorTag` dời sang `shared/log-line.ts` để dùng chung.
- **Còn sót** (BE-D tự ghi ở giả định): `worker.ts` vòng job vẫn ghi `err: err.message` ở dòng `job failed`, ngay cạnh dòng `email dispatch failed` đã dùng `errorTag`.
  - Thông báo lỗi Postgres có thể chứa giá trị (ví dụ "invalid input syntax for type …: "<giá trị>"").
  - `errorTag` đã giữ SQLSTATE (`code`) và tên job, đủ để OPS biết lỗi loại gì.
  - Thẻ BED-05: đổi trong PR này nếu OPS đồng ý, không thì v1.0.5.

---

## 3. Thẻ feedback (theo mức độ)

### Blocker / Major
Không có.

### Minor

#### FB-R4-SEC-BE-BED-01: đính chính phạm vi mục 1.2 ý 4, ghi vào hợp đồng và sổ tay
- Mức độ: Minor
- Người làm: **ORC** (decision-log, mục 5); **ARC** (một câu trong mô tả P4-00 (g)); **BA** (sổ tay 1.8 bước 4 + release notes, như BE-D đã nêu ở báo cáo mục 4)
- Vấn đề: chữ SEC mục 1.2 ý 4 đọc được hai cách. Mã đã theo cách đúng (mục 1.1).
- Đề xuất sửa:
  - ghi câu đính chính ở 1.1;
  - mô tả 0.3.12: "yêu cầu thay thế (`superseded`) mang nơi nhận khi mọi yêu cầu bị đóng có nơi nhận cùng một nơi nhận, cùng người nhập; không mang khi `no_show_restored`";
  - sổ tay: "trống thì nhập lại" cho trường hợp khác nhau.
- Trạng thái: Open

#### FB-R4-SEC-BE-BED-02: ca (f) quét thêm `staff_notification` và ghi rõ là thay `privacy-log-check.sh`
- Mức độ: Minor (**trước khi gộp P4-12**)
- Người làm: **BE-D**
- Vị trí: `test/integration/v104-refund-dest.test.ts` ca (f).
- Đề xuất sửa:
  - thêm `staff_notification` (kể cả `params`) vào danh sách bảng quét số TK thử và tên chủ TK thử;
  - chú thích đầu ca ghi: "thay cho `privacy-log-check.sh` (SEC-on-v104-be-d mục 1.4)".
- Trạng thái: Open

#### FB-R4-SEC-BE-BED-04: test "lọt có chủ ý" cho bộ dò cặp số
- Mức độ: Minor
- Người làm: **BE-D**
- Vị trí: `test/text-safety-units.test.ts`, khối PR24PM-02.
- Đề xuất sửa: 3 ca ở mục 2.1 kỳ vọng **không** chặn. Chú thích "rủi ro thấp đã chấp nhận – SEC-on-v104-be-d 2.1; đổi thì báo SEC".
- Trạng thái: Open

#### FB-R4-SEC-BE-BED-05: dòng `job failed` của worker không in `err.message`
- Mức độ: Minor
- Người làm: **BE-D** (`worker.ts` thuộc P4-14); OPS biết trước
- Vị trí: `services/api/src/worker.ts`, vòng `tick`, `log('error', 'job failed', { job, err: err.message })`.
- Vấn đề: trái SEC S-1 ("không bao giờ `err.message`"), và lệch với dòng `email dispatch failed` ngay bên dưới. Thông báo lỗi DB hoặc thư viện có thể mang giá trị dữ liệu.
- Đề xuất sửa: `log('error', 'job failed', { job: key, ...errorTag(err) })`. SQLSTATE vẫn có trong `code`. Thêm một ca vào `v104-log-line.test.ts`: lỗi có message chứa chuỗi thử thì dòng log không chứa chuỗi đó.
- Trạng thái: Open. Nên làm trong PR P4-14. Không kịp thì v1.0.5.

### Info

#### FB-R4-SEC-BE-BED-03: giảm giải mã và bọc `JSON.parse` của số tài khoản
- Người làm: BE-D (v1.0.5 cũng được)
- Ý 1: trong `peekCarryableDestination`, so phương thức, BIN, đơn và người nhập của **mọi** dòng trước, rồi mới giải mã.
- Ý 2: hàm chung `parseRefundAccount(plain)` dùng ở cả `peek` và `getDestination`, `try/catch` rồi ném `Error('refund account unreadable')` không kèm nội dung.

#### FB-R4-SEC-BE-BED-06: sửa một câu trong báo cáo P4-12
- Người làm: BE-D
- "Không bao giờ có hai yêu cầu sống cùng một số TK" → "Yêu cầu nguồn luôn đã đóng trước khi chép. Yêu cầu đã duyệt được giữ lại (`refundsDownToCredit`) có thể cùng số TK với yêu cầu thay thế: chấp nhận, cùng khách, cùng đơn, tổng ≤ số dư có."

---

## 4. Việc giai đoạn B (nhắc, chưa review)
- PR24PM-01 (chuyển `sensitive-number.ts` sang `shared/`) và phần `guest-portal`: SEC review khi có mã, theo đúng điều kiện SEC-on-plan-v1.0.4 mục 4 (chỉ `note` + `arrivalNote`, 422 `ID_NUMBER_DETECTED` chỉ `field` + `code`, cùng tag với guest-web và mã lỗi 0.3.12, không thì v1.0.5).

---

## 5. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – review mã BE-D P4-12 (be-refund-dest @ 8539bbfb) + P4-14 phần A (be-sensitive @ a48f6564)** (rounds/round-04/reviews/SEC-on-v104-be-d.md): cả hai ĐẠT CÓ ĐK, không Blocker/Major. Đính chính SEC-on-plan-v1.0.4 1.2: ý 4 = mang nơi nhận ở mọi lần tạo MỘT yêu cầu thay thế lý do superseded (closeStayCredit và refundsDownToCredit), không mang khi no_show_restored/từ chối/hủy tay; ý 5 "privacy-log-check.sh" dẫn sai, thay bằng ca (e) stdout/stderr + (f) quét DB (thêm staff_notification – BED-02, trước gộp). Chấp nhận 2 chốt BE-D (khác người nhập → không mang; nguồn phải cancelled thật). PR24PM-02: chấp nhận bỏ điều kiện ngày/tháng thật (giữ SĐT Nga), 3 ca lọt ghi test có chủ ý (BED-04). PR24PM-03/04 đạt; dòng job failed bỏ err.message (BED-05) | SEC | Quyền SEC |`

---

## 6. Giả định

1. Hook `onDecided('refund', cancelled)` vẫn purge nơi nhận và hủy DEK của yêu cầu cũ như SEC-BE-45, và chạy trong vòng `autoCancel` (BE-D dựa vào điều này cho thứ tự `peek` trước).
2. `refundAccountAad(id)` gắn id yêu cầu, nên bản mã chép thẳng sang id khác sẽ không giải được. Đây là lý do của ĐK 2, và ca (a) kiểm "giải mã ra đúng" trên id mới.
3. Không tự chạy test. Kết luận dựa trên đọc mã, tên ca test và hai báo cáo BE-D.
