# SEC – Phản hồi thẻ gửi SEC, Round 5

- Người trả lời: SEC. Ngày: 06/11/2026 (khuya), bổ sung 07/11/2026.
- Thẻ nhận, từ `rounds/round-05/reviews/BE-on-contract-0.3.13.md` mục 7:
  - `FB-R5-BE-ARC-C0313-22`: gửi ARC; ORC nhờ SEC xác nhận phần S6;
  - `FB-R5-BE-ARC-C0313-23`: gửi ARC và SEC;
  - `FB-R5-BE-ARC-C0313-24`, `FB-R5-BE-ARC-C0313-25` (mục 7.8.3, 07/11): gửi SEC và ARC.
- Câu hỏi riêng của ORC (07/11): đổi hạn thẻ SEC `FB-R5-SEC-ARC-20` (mục 5).
- ORC nhờ SEC chốt câu thực hành ở quầy của DOM (07/11): `FB-R5-DOM-BA-01`, giả định 3 của `rounds/round-05/reviews/DOM-on-ba-v105-docs.md` (mục 6).
- Căn cứ:
  - `rounds/round-05/reviews/SEC-on-bug-r5-002.md` mục S6, S8;
  - `SEC-on-contract-0.3.13.md` mục 5;
  - `product/docs/security/security-requirements.md` mục 13 (SR-RL).
- Đã sửa `security-requirements.md`:
  - 06/11: thêm luật chốt cho C0313-23;
  - 07/11: luật đó **đổi số thành SR-RL-15** và đổi nơi lưu thành `rate_limit_counter`; ghi thêm SR-RL-10…14 của trang công khai (C0313-24).

| ID | Trạng thái (phần SEC) | Tóm tắt |
|---|---|---|
| FB-R5-BE-ARC-C0313-22 (Minor) | Done – SEC xác nhận có điều kiện | `afterClosure` tính lúc đọc **đủ để hiển thị**. **Không đủ cho bộ lọc tuần S6**: bộ lọc phải đọc giá trị audit ghi lúc ghi, nên ý 3 của BE (allowlist + test) là **bắt buộc**. Chi tiết ở mục 1 |
| FB-R5-BE-ARC-C0313-23 (Suggestion) | Done – SEC chốt luật SR-RL-15 (06/11 ghi là SR-RL-10; đổi số ở thẻ 24) | Mỗi lần so đều đếm, kể cả khi không trùng. Bộ đếm lưu ở PostgreSQL theo người gọi, tách khỏi khóa đăng nhập. Tối đa 5 lần trong 24 giờ; quá ngưỡng thì bỏ qua phép so. Bộ đếm và audit `security` commit trước khi trả 422. Chi tiết ở mục 2 |
| FB-R5-BE-ARC-C0313-24 (Minor) | Done – SEC đồng ý đề xuất của BE | Nơi lưu = `rate_limit_counter` (0086), khóa `wifi_pw_cmp:<user_id>`, cửa sổ cố định 24 giờ, không migration. Luật Wi-Fi đổi số thành **SR-RL-15**, vì SR-RL-10…14 đã có chủ từ R2. Chi tiết ở mục 3 |
| FB-R5-BE-ARC-C0313-25 (Minor) | Done – SEC chọn (a), có chỉnh | Luật riêng cho mã tham chiếu: chặn khi **toàn bộ** giá trị, sau khi bỏ `.` `/` `_` `-`, là 13–19 chữ số và qua Luhn. Áp cho `bankReference` ở cả `PaymentCreate` và `executeRefund`. Câu báo chỉ cách nhập 8 ký tự cuối. **Nên xếp bug P2** cho `executeRefund` đang chạy. Chi tiết ở mục 4 |
| Hạn thẻ `FB-R5-SEC-ARC-20` | Đồng ý có điều kiện | Đổi thành "trong PR-B3 (BE-D), chữ hợp đồng ở PR ARC-16", với 3 điều kiện ở mục 5 |
| FB-R5-DOM-BA-01 (Minor) – câu "khách lỡ gửi số thẻ qua tin nhắn" | Done – SEC chốt, có sửa (thẻ vẫn Open phía BA) | (a) Đúng hướng; SEC sửa 4 chỗ, quan trọng nhất là thêm "không dùng số đó để thu tiền". (b) Có ghi sổ giao ca, một dòng, không có số nào của thẻ. (c) Ca thường: báo chủ đầu tư trước khi hết ca, tin không có số. Ca bất thường: gọi ngay, muộn nhất 1 giờ. Bỏ nhãn [GIẢ ĐỊNH]. Chi tiết ở mục 6 |
| Câu CPY trả lời khách + INT xóa tin theo kênh (07/11, câu hỏi của ORC) | Done – SEC duyệt, có sửa 6.3 | Giữ thứ tự "trả lời trước, xóa ngay sau"; duyệt chữ "sẽ xóa ngay" (không "đã xóa"). Duyệt bản bỏ vế xóa (CPY mục 5) cho kênh không xóa được theo thiết kế: Zalo OA (tới khi T1 chứng minh xóa được), hộp thư OTA, Messenger. Kênh đó là **ca thường**, không phải ca bất thường số 3. Chốt 6 ghi chú của INT và lượt thử T1–T6. Chi tiết ở mục 6.5 |
| FB-R5-DOM-BA-08 (Suggestion) – khách gửi ảnh giấy tờ qua chat (07/11, câu hỏi của ORC) | Done – SEC xác nhận hai vế, thêm 3 ý (thẻ vẫn Open phía BA, CPY) | Không lưu về máy nào, không chuyển tiếp, không tải từ chat lên Desk; xóa theo kênh như dòng số thẻ; kênh không xóa được là ca thường; ca bất thường như 6.3. Lượt 2 (BA f332f503): lỡ tải về hoặc máy tự lưu rồi xóa ngay là **ca giữa**, ghi sổ một dòng, báo trước khi hết ca, không gọi trong 1 giờ; thư báo về email cơ sở có ảnh là bản sao xóa được. Mục 6.6, 6.6.1 |

**Tổng: 4 thẻ, 4 Done (phần SEC), 0 Rejected, 0 Deferred, 0 Escalated.** Không thẻ nào đổi kiểu sinh: không thêm mã lỗi, không thêm 429. ARC ghi chữ vào hợp đồng trong delta tài liệu tới; BE làm trong PR V5-48 (thẻ 22) và PR V5-58 (thẻ 23). Thẻ vẫn Open ở phía ARC/BE cho tới khi có chữ và test.

---

## 1. C0313-22 – `afterClosure` tính lúc đọc có đủ cho S6 không

S6 có hai nửa:
- (a) **hiển thị** cờ trên màn duyệt hoàn và Nhật ký tiền;
- (b) **bộ lọc tuần** `listAuditEvents.afterClosureOnly`. Bộ lọc này là kiểm soát phát hiện duy nhất của OWN cho đường này, cho tới v1.0.6.

### 1.1 Đồng ý cho (a)

BE đề xuất tính `Payment.afterClosure` lúc đọc. SEC đồng ý, với 2 điều kiện:
- So bằng **`payment.created_at` do server ghi** với `cancelled_at`/`no_show_marked_at`. Không so bằng ngày nhận tiền mà người dùng nhập. Nếu so bằng ngày người dùng nhập, khoản thu muộn có thể ghi lùi ngày về trước lúc hủy để trông như bình thường.
- `Payment.afterClosure` **chỉ để hiển thị**. Các quyết định lúc ghi **không** đọc trường này:
  - V5-48: 422/409, luôn `pending`;
  - 5B-1: hoàn tự tạo, nơi nhận cố định;
  - S5.
  Các quyết định đó đọc trạng thái đơn dưới khóa đơn, trong cùng giao dịch, như `payments.service.ts` đang làm ở `record`.

### 1.2 Không đủ cho (b), nên ý 3 của BE là bắt buộc

- Đơn có thể được khôi phục sau đó: B12 no-show ở v1.0.5, 5B-2 từ 0.3.14. Khi đó cờ tính lúc đọc thành `false`.
- Nếu bộ lọc tuần tính lúc đọc, chuỗi "hủy → ghi khoản thu muộn → khôi phục" sẽ **xóa dấu vết khỏi bộ lọc**. Đây đúng là chuỗi S6 cần cho OWN thấy.
- Vì vậy:
  1. `afterClosureOnly` lọc theo **`after.afterClosure = true` trong `audit_event`**, tức giá trị ghi lúc ghi. Không tính lại từ trạng thái đơn hiện tại.
  2. Allowlist audit thêm khóa, như BE ý 3:
     - `payment`: `afterClosure`, `reservationStatus`;
     - `deposit_notice`: `afterClosure`.
  3. Mục `deposit_after_cancel`/`payment_after_cancel` đóng bằng "Không thấy tiền" (S8) cũng phải hiện trong bộ lọc tuần. Audit của `resolveAttentionEvent` cho các mục này mang `afterClosure: true`, và khóa này có trong allowlist của thực thể tương ứng. Nếu ARC muốn, có thể thay bằng: bộ lọc nhận theo loại mục; khi đó ghi rõ điều này trong mô tả `afterClosureOnly`.
  4. Không khóa nào chứa dữ liệu khách: chỉ cờ, trạng thái đơn, mã.

### 1.3 Test bắt buộc (BE, PR V5-48; QA dẫn vào ca)

- Đọc lại `audit_event`: thấy `after.afterClosure = true` và `after.reservationStatus`. Phải đọc từ bảng, không chỉ kiểm phản hồi API. Thẻ 04 và 10 đã cho thấy kiểm phản hồi API là chưa đủ.
- `afterClosureOnly` trả **đúng một dòng** cho ca h1 của QA.
- **Ca khôi phục**: hủy → ghi khoản thu muộn → khôi phục no-show (B12). Sau đó `Payment.afterClosure` đọc `false`, nhưng `afterClosureOnly` **vẫn trả dòng đó**. Khi có 5B-2 (0.3.14), lặp lại ca này với `restoreHold`.
- Mục đóng bằng "Không thấy tiền" có trong bộ lọc tuần, kèm người bấm và giờ bấm (S8).

### 1.4 `refundRequestId` (ý 2 của BE)

- SEC thích phương án "chưa trả tới 0.3.14", vì ít bề mặt hơn.
- Nếu ARC muốn trả ngay ở v1.0.5, đọc từ audit `payment.recorded`, thì SEC cũng không phản đối. Điều kiện: chỉ trả khi người đọc đã thấy được yêu cầu hoàn đó theo phạm vi hiện có. Đây chỉ là mã, không có dữ liệu khách.

---

## 2. C0313-23 – phép so mật khẩu người gọi ở `setPropertyWifi`

### 2.1 Rủi ro

BE nêu đúng. Người cầm một **phiên** OWN/MGR bị lộ mà không biết mật khẩu vẫn dò được mật khẩu của chủ phiên:
- gửi mật khẩu Wi-Fi đoán thử;
- nhận 422 `NOT_ALLOWED` nghĩa là đoán đúng;
- đoán sai thì Wi-Fi bị ghi đè; GET trả mật khẩu cũ nên kẻ dò ghi trả lại được.

Như vậy phiên lộ thành mật khẩu lộ, và mật khẩu đó có thể đang dùng ở nơi khác. Giới hạn chung 600 lượt/phút/người (SR-RL-09) không đủ chặn kiểu dò này.

### 2.2 SEC chọn

Phương án (b) của BE, với 3 chỉnh:
- đếm cả lần so không trùng;
- bộ đếm lưu ở PostgreSQL;
- bộ đếm commit riêng.

Luật được ghi thành **SR-RL-15** (06/11 ghi là SR-RL-10; đổi số ngày 07/11, mục 3):

1. **Mỗi lần so đều đếm**, dù trùng hay không. Với kẻ dò, "không trùng" là kết quả thường gặp; chỉ đếm lần trùng thì không chặn được gì.
   - Chỉ so (và đếm) khi `password` đã qua kiểm dạng (8–63 ký tự ASCII in được) và khác mật khẩu Wi-Fi đang lưu.
   - Mạng mở (chuỗi rỗng), hoặc chỉ đổi `ssid`: không so, không đếm.
2. **Ngưỡng**: 5 lần so trong 24 giờ, theo người gọi (`user_id`). Cửa sổ cố định được.
   - Bộ đếm lưu ở **PostgreSQL**, cập nhật nguyên tử. Lý do: đây là bộ đếm xác thực theo người dùng (SR-RL mục 13, "bắt buộc PostgreSQL"). Bộ đếm RAM sẽ reset mỗi lần deploy.
   - ~~Dùng cùng nơi lưu với bộ đếm xác nhận lại (SR-RL-02), nhưng khóa đếm riêng.~~ **Sửa 07/11 (thẻ 24):** bảng `rate_limit_counter`, khóa `wifi_pw_cmp:<user_id>`, xem mục 3.
   - **Không** cộng vào `login_lockout`, **không** khóa tài khoản. Nếu cộng vào, một phiên bị lộ có thể khóa chủ tài khoản ra ngoài.
3. **Trong ngưỡng**: so như hợp đồng hiện tại (một lần argon2 verify trên hash của người gọi).
   - Trùng → 422 `NOT_ALLOWED` (`field` = `password`). Ghi thêm audit `security` `property.wifi_password_matches_login`, không có giá trị.
   - Không trùng → lưu như thường.
4. **Quá ngưỡng**: bỏ qua phép so, các luật khác vẫn áp, và lưu như thường.
   - Ghi audit `security` `property.wifi_password_check_skipped` một lần mỗi cửa sổ, không có giá trị.
   - Phản hồi giống hệt bình thường: không 429, không mã mới, không đổi kiểu sinh.
   - Người dùng thật đổi Wi-Fi quá 5 lần một ngày rất hiếm. Cái giá là có thể lọt một lần dùng trùng mật khẩu đăng nhập, chấp nhận được.
5. **Bộ đếm và audit `security` ghi ở giao dịch riêng, commit trước khi trả 422**, giống bộ đếm sai đăng nhập. Nếu ghi chung giao dịch của PUT, 422 làm rollback và mất cả bộ đếm lẫn audit của lần đoán trúng.
6. Không ghi mật khẩu (Wi-Fi hay đăng nhập) vào audit, log, thông báo hay phản hồi, như hợp đồng 1.23 đã ghi.

### 2.3 Test bắt buộc (BE, PR V5-58; QA dẫn vào ca)

- Lần so thứ 6 trong cửa sổ bị bỏ qua: PUT bằng chính mật khẩu đăng nhập của người gọi trả 200, và có audit `property.wifi_password_check_skipped`.
- Bộ đếm còn nguyên sau khi khởi động lại API (vì lưu ở PostgreSQL).
- Lần so trùng: trả 422. Audit `property.wifi_password_matches_login` và bộ đếm vẫn còn trong DB sau khi request bị rollback.
- Bộ đếm `login_lockout` của người gọi không đổi; tài khoản không bị khóa.
- Chỉ đổi `ssid`, hoặc mạng mở: không tăng bộ đếm.
- Không có chuỗi mật khẩu thử nào xuất hiện trong audit, log hay phản hồi.

---

## 3. C0313-24 – nơi lưu bộ đếm và số luật (07/11)

### 3.1 Nơi lưu: đồng ý `rate_limit_counter`

BE nói đúng: SR-RL-02 là 2 cột trên `app_user`, không phải bảng đếm theo khóa. Đọc đúng chữ cũ thì phải có migration. SEC đổi chữ và đồng ý đề xuất của BE:
- Bảng `rate_limit_counter` (0086), PostgreSQL. Bảng này UPSERT nguyên tử, có job `public_site.cleanup` dọn các dòng có `expires_at` < bây giờ, nên không xóa cửa sổ còn hiệu lực.
- `bucket_key` = `wifi_pw_cmp:<user_id>`. Khóa chỉ có mã luật và id, đúng điều kiện của ngoại lệ RLS đã ghi ở 0086. Không email, không tên.
- Cửa sổ **cố định** 24 giờ: `window_start` = đầu cửa sổ, `expires_at` = cuối cửa sổ. Ở chỗ giáp hai cửa sổ có thể so tới 10 lần; SEC chấp nhận.
- `INSERT … ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = count + 1 RETURNING count`, chạy ở **giao dịch riêng**, commit trước khi so và trước khi trả 422. Mẫu là `password-reauth.ts`.
- Đếm cả lần bị bỏ qua. Như vậy audit `property.wifi_password_check_skipped` chỉ ghi khi `count` = 6, đúng một lần mỗi cửa sổ, như BE viết ở 7.8.2.
- Không migration, không thêm cột vào `app_user`. BE ghi decision-log.
- Bảng nằm trong module `public-site`. Nếu `module-boundaries.test.ts` cấm module khác ghi bảng này, ARC đưa hàm UPSERT ra `shared` (hoặc export từ module chủ). **Không chép câu SQL sang module thứ hai.**
- **Hợp đồng (ARC, 0.3.14 hoặc PR ARC-16):**
  - đổi "cùng nơi lưu với bộ đếm xác nhận lại (SR-RL-02)" thành "PostgreSQL `rate_limit_counter`, khóa `wifi_pw_cmp:<user_id>`, cửa sổ cố định 24 giờ (SEC SR-RL-15)";
  - **không** thêm `x-rate-limit` vào `setPropertyWifi`. Theo `openapi.yaml` dòng 77, có `x-rate-limit` là phải khai `429` và QA sinh ca 429, trong khi luật này không bao giờ trả 429. Ghi giới hạn trong `description`.

### 3.2 Số luật: Wi-Fi thành SR-RL-15

- SR-RL-10…14 đã có chủ từ R2: SEC đặt ở `rounds/round-02/reviews/landing-zalo-SEC.md` mục 7, ADR-014 dòng 629, và mã đang dẫn SR-RL-10/11. Lỗi của SEC là chưa chép vào `security-requirements.md`, nên ngày 06/11 SEC dùng trùng số 10.
- SEC đã sửa `security-requirements.md` mục 13:
  - ghi SR-RL-10 (bước 0 RAM, form token), SR-RL-11 (form yêu cầu đặt phòng, `rate_limit_counter`), SR-RL-12 (`recordSiteEvent`, dự kiến), SR-RL-13 (đọc công khai), SR-RL-14 (webhook Zalo, dự kiến), đúng như đã đặt ở R2;
  - luật Wi-Fi đổi số thành **SR-RL-15**.
- Mã và test trang công khai giữ nguyên số SR-RL-10/11; không phải sửa gì.
- ARC: đổi "SEC SR-RL-10" thành "SEC SR-RL-15" ở mô tả `setPropertyWifi` (bổ sung 1e, `openapi.yaml` khoảng dòng 1946), cùng lần sửa chữ ở 3.1.
- BE: chú thích và mã test của V5-58 dẫn SR-RL-15 (T58-11…13).
- QA: traceability dẫn SR-RL-15.

---

## 4. C0313-25 – luật số thẻ V-09 cho trường mã tham chiếu (07/11)

### 4.1 SEC chọn (a), có chỉnh

`containsCardNumber` (V-09) quét mọi cửa sổ 13–19 chữ số. Luật này đúng cho chữ tự do, nhưng sai cho một ô mà mục đích là mã giao dịch ngân hàng. Mục đích của V-09 là không bao giờ lưu số thẻ đầy đủ (PCI). Với ô mã, rủi ro thật là lễ tân dán nhầm **cả** số thẻ vào ô, chứ không phải một số thẻ nằm lẫn giữa chữ.

Luật mới cho ô mã tham chiếu (BE đặt tên hàm, ví dụ `isCardNumberReference`, trong `shared/validation.ts` cạnh `containsCardNumber`):
1. Giá trị đã qua mẫu `^[A-Za-z0-9./_-]{1,64}$` (cả hai đường đều có mẫu này) và đã bỏ khoảng trắng ở controller.
2. Bỏ `.` `/` `_` `-`.
3. Nếu kết quả **toàn bộ** là 13–19 chữ số **và** qua Luhn → 422 `CARD_NUMBER_DETECTED` (`field` = `bankReference`).
4. Ngược lại thì nhận: mã có chữ, dãy số ngắn hơn 13 hoặc dài hơn 19, dãy số không qua Luhn.

Chỉnh so với đề xuất (a) của BE: **không** cộng `looksLikeCard`.
- `looksLikeCard` quét các đoạn số bên trong chuỗi, nên đưa lại đúng kiểu bắt nhầm mà thẻ này muốn bỏ.
- Phần mà nó bắt thêm (ký tự ẩn, chữ số full-width, dấu phẩy) đã bị mẫu ở bước 1 chặn.

Phạm vi:
- `bankReference` ở **mọi đường `PaymentCreate`** (qua `recordInTx`) và ở **`executeRefund`** (`refunds.service.ts` 668–676; chú thích "SEC-BE-44" sửa theo luật mới).
- Mọi ô chữ tự do (ghi chú, lý do, …) **giữ nguyên** `containsCardNumber`.
- Không lưu, không log giá trị bị chặn. 422 không lặp lại giá trị, như hiện nay.

Rủi ro còn lại, SEC chấp nhận:
- Số thẻ có chữ đứng trước (ví dụ `REF4111…`) sẽ lọt. Việc này cần cố ý; nhập nhầm thì không ra dạng này.
- Mã toàn số 13–19 chữ số vẫn bị chặn nhầm khoảng 10 % (đúng xác suất của Luhn).

### 4.2 Lối ra cho 10 % còn lại (UXD, FE)

- Câu báo cho 422 ở ô mã, cả màn ghi khoản thu và màn chi hoàn. UXD viết; ý gợi ý: "Mã này trông giống số thẻ nên hệ thống không lưu. Nhập 8 ký tự cuối của mã giao dịch."
- 8 ký tự cuối không bao giờ là số thẻ. Vẫn đủ để tìm trên sao kê. Chặn trùng S4 vẫn chạy, vì ai gặp cùng mã cũng nhập cùng 8 ký tự.
- Không gợi ý để trống ô. Để trống thì khoản thu mất chặn trùng S4, và `executeRefund` không cho để trống.

### 4.3 Test (BE-B ở PR-B3; QA dẫn vào ca)

Cả `recordPayment` và `executeRefund`:
- `4111111111111111`, `4111-1111-1111-1111`, `4111.1111.1111.1111`, `4111_1111_1111_1111` → 422 `CARD_NUMBER_DETECTED`. Đây là số thẻ thử công khai, không phải số thật.
- Mã có chữ kèm 14 chữ số, có một cửa sổ qua Luhn → nhận (201).
- 16 chữ số không qua Luhn → nhận. 12 chữ số → nhận. 8 ký tự cuối của một mã bị chặn → nhận.
- Ô ghi chú chứa `4111 1111 1111 1111` → vẫn 422 (luật chung không đổi).

### 4.4 Có nên xếp bug cho production không: có, P2, không phải lỗi bảo mật

- `executeRefund` đang chạy ở production, bắt buộc `bankReference` khi chi chuyển khoản. Với mã toàn số 16 chữ số, khoảng 65 % bị chặn.
- Hậu quả: MGR/OWN không ghi được lệnh chi hoàn. Không mất tiền, không lộ dữ liệu. Cách làm tạm có sẵn: nhập phần cuối của mã.
- Chưa có báo lỗi nào.
- SEC đề nghị:
  - ORC giao QA ghi **bug P2** (sai chức năng trên đường tiền, có cách làm tạm). QA thử lại trên staging bằng mã giả 16 chữ số qua Luhn, như `4111111111111111`. Không dùng mã giao dịch thật.
  - Sửa trong v1.0.5, bằng chính hàm ở 4.1. Áp vào `executeRefund` sớm nhất có thể; không cần chờ hết PR-B3. Không cần hotfix v1.0.4.
  - Trước khi bản sửa lên, ORC báo INV (cho MGR/OWN) cách làm tạm: "gặp lỗi 'giống số thẻ' ở ô mã chuyển khoản thì nhập 8 ký tự cuối của mã".

---

## 5. Hạn thẻ `FB-R5-SEC-ARC-20` (câu hỏi của ORC, 07/11)

**SEC đồng ý** đổi hạn thành "trong PR-B3 (BE-D), chữ hợp đồng ở PR ARC-16". Lý do:
- Mục `deposit_after_cancel` chỉ sinh ở PR-B3. Trước PR-B3 không có mục nào để đóng bằng "Không thấy tiền", nên không có dấu vết nào bị mất.
- Hạn cũ "trước PR-B1" đặt lúc SEC chưa biết mục này chỉ có ở PR-B3.

Điều kiện:
1. **Cùng một PR.** Dòng `attention_event.resolved` trong tập đóng `money` của hợp đồng và hằng `MONEY_AUDIT_ACTIONS` phải lên **cùng một PR**, nếu không `module-boundaries.test.ts` sẽ đỏ. Nếu chữ hợp đồng ở PR ARC-16, thì PR đó thêm luôn hằng (một dòng). PR-B3 chỉ gộp **sau** PR đó.
2. **Không PR nào trước PR-B3** (V5-48, PR-B1) được sinh mục `deposit_after_cancel` hay đóng mục bằng "Không thấy tiền". Nếu có, hạn quay về trước PR đó.
3. **Cùng bản phát hành.** Câu `mlog.a_*` (FE) lên cùng bản với PR-B3, để Nhật ký tiền không hiện `mlog.a_other`.

Ngoài ra, test ở PR-B3 (ghi rõ trong ARC-20):
- Đóng một `deposit_after_cancel` bằng "Không thấy tiền" → có audit `money` `attention_event.resolved`, `after = {kind, afterClosure: true}`. Phải đọc lại từ `audit_event`.
- Dòng đó hiện trong `afterClosureOnly`, có người bấm và giờ bấm.
- Ghi chú tự do không nằm trong `after`.

Nếu dòng cắt của plan bỏ `deposit_after_cancel` khỏi v1.0.5, audit này đi theo nó sang bản sau. Như vậy không có khoảng hở.

SEC đã sửa dòng "Người nhận" và "Hạn" của ARC-20 trong `SEC-on-contract-0.3.13.md` cho khớp. Không cần giao lại cho BE-B.

---

## 6. FB-R5-DOM-BA-01 – khách lỡ gửi số thẻ qua tin nhắn (câu hỏi của ORC, 07/11)

Nguồn: DOM `rounds/round-05/reviews/DOM-on-ba-v105-docs.md`, thẻ FB-R5-DOM-BA-01, giả định 3. Câu DOM đề xuất:

> Khách lỡ gửi số thẻ trong tin nhắn: không chép, không chụp, không chuyển tiếp; xóa tin đó trên máy của cơ sở, nhờ khách thu hồi tin.

Căn cứ:
- `security-requirements.md`:
  - SR-PAY-08: không nơi nào lưu số thẻ;
  - SR-PAY-10: hướng dẫn nhân viên "không nhận số thẻ qua điện thoại/Zalo";
  - SR-INC-01: runbook sự cố dữ liệu.
- Sổ tay `user-manual-v1.0.md`:
  - mục 1, ý 11: số thẻ không nhận qua điện thoại, Zalo, email, giấy;
  - bảng tình huống 2.21, dòng "Khách đọc số thẻ qua điện thoại".
- PCI DSS: số thẻ nhận ngoài ý muốn qua kênh không dành cho thẻ thì không giữ, không dùng để thu tiền, xóa đi.
- Nghị định 13/2023: số thẻ là thông tin tài chính của khách, nên xử lý càng ít càng tốt.

SEC không khẳng định "tuân thủ": đây là các biện pháp đội đã chọn. Nghĩa vụ báo cơ quan chức năng khi có sự cố vẫn do luật sư xác nhận (SR-INC-01).

### 6.1 (a) Câu có đúng không: **đúng hướng, SEC sửa 4 chỗ**

1. **Thêm "không dùng số đó để thu tiền"**, tức không gõ vào máy POS, không nhập Desk. Đây là lỗi dễ xảy ra nhất ở quầy ("khách gửi rồi, gõ cho nhanh"). Đó chính là nhận số thẻ qua tin nhắn, chỉ là làm muộn hơn một bước.
2. **Thứ tự:**
   - trả lời khách trước, bằng **một tin mới**;
   - không bấm Trả lời hay trích dẫn tin có số, vì trích dẫn chép lại số sang tin mới;
   - nhờ khách thu hồi tin nếu kênh có nút thu hồi;
   - rồi xóa ngay, **không chờ** khách thu hồi.
3. **"Máy của cơ sở"** là mọi nơi đang mở tài khoản đó: điện thoại quầy, Zalo hay email trên máy tính quầy. Thêm hai chỗ hay sót:
   - email: xóa cả trong thùng rác;
   - tin là ảnh thẻ: xóa cả ảnh máy đã tự lưu vào thư viện ảnh, và trong thùng rác ảnh.
4. **Không ghi lại ở đâu**: sổ giao ca, sổ giấy, Desk, nhóm chat nội bộ. Kể cả 4 số cuối hay loại thẻ.

**Câu chốt cho BA dán** (thay câu cuối trong đề xuất của DOM, phần còn lại của đoạn giữ nguyên):

> Khách lỡ gửi số thẻ hoặc ảnh thẻ qua tin nhắn, email: không chép, không chụp, không chuyển tiếp, không đọc to, không dùng số đó để thu tiền (không gõ vào máy POS, không nhập Desk). Trả lời khách bằng một tin mới, không trích lại tin có số; nhờ khách thu hồi tin nếu kênh đó có nút thu hồi. Rồi xóa ngay tin đó trên mọi máy của cơ sở đang mở tài khoản này (điện thoại quầy, máy tính quầy); email thì xóa cả trong thùng rác; ảnh thẻ thì xóa cả ảnh đã lưu trong máy. Ghi sổ giao ca, không ghi số. Khách muốn trả bằng thẻ: mời trả tại máy POS ở quầy.

**Câu trả lời khách.** Đây là bản nháp nội dung. UXD/CPY chỉnh chữ theo brand guideline: tiếng Anh dẫn, tiếng Việt hỗ trợ, ngắn, điềm tĩnh, không emoji. Giữ đủ 3 ý: không nhận thẻ qua tin nhắn, cơ sở xóa tin và nhờ khách thu hồi, trả thẻ tại máy POS.

> "Thank you. For your security, OTTIMO does not accept card details by message. We will delete your message on our side; please also recall it if you can. You are welcome to pay by card at our front desk terminal." / "Cảm ơn anh/chị. Vì an toàn của anh/chị, OTTIMO không nhận thông tin thẻ qua tin nhắn. Lễ tân sẽ xóa tin ở phía OTTIMO; anh/chị vui lòng thu hồi tin nếu được. Anh/chị có thể trả bằng thẻ tại máy POS ở quầy."

### 6.2 (b) Có ghi sổ giao ca không: **có, một dòng, không có số**

- Mẫu: "`<giờ>` – `OTM-…` – khách gửi số thẻ qua `<Zalo / email / SMS>` – đã xóa trên `<điện thoại quầy / máy tính quầy>`, đã nhờ khách thu hồi."
- Khách chưa có đơn: thay mã đơn bằng "khách chưa có đơn, kênh `<Zalo>`". Không ghi tên hay số điện thoại khách.
- **Không ghi:** số thẻ, 4 số cuối, loại thẻ, ngày hết hạn, ảnh.
- Vì sao ghi:
  - ca sau biết việc đã xong, nên không đi tìm lại tin, không hỏi lại khách;
  - chủ đầu tư đối chiếu được với tin báo ở 6.3;
  - lặp lại nhiều lần thì thấy được, ví dụ khi BUG-R5-005 đẩy khách sang Zalo.

### 6.3 (c) Có báo chủ đầu tư không, trong bao lâu

**Ca thường** (đã xóa trong ca, không ai chép, chụp hay chuyển tiếp):
- **báo chủ đầu tư trước khi hết ca**, bằng một tin ngắn không có số (như dòng sổ giao ca) hoặc nói trực tiếp;
- lễ tân không phải chờ chủ đầu tư trả lời mới xử lý.

Lý do:
- khách tự gửi và cơ sở đã xóa ngay, nên đây không phải sự cố lộ dữ liệu của cơ sở;
- chủ đầu tư vẫn cần biết để kiểm lại và thấy nếu ca này lặp lại;
- không dựa vào lượt kiểm bảo mật buổi sáng, vì lượt đó chỉ là việc tạm (sổ tay 1.1, "tới khi đội bảo mật báo bỏ").

**Ca bất thường: gọi chủ đầu tư ngay, muộn nhất 1 giờ kể từ lúc biết, kể cả ban đêm.** Gồm một trong các ca sau:
1. số hoặc ảnh thẻ đã bị chép, chụp, chuyển tiếp (kể cả vào nhóm chat nội bộ), đọc to, gõ vào máy POS, Desk hay sổ giấy, hoặc người ngoài quầy đã thấy;
2. máy giữ tin bị mất, hoặc người khác dùng máy đó trước khi tin được xóa;
3. không xóa được: tin nằm trên máy hay tài khoản lễ tân không mở được, hoặc tài khoản đó có người ngoài cơ sở dùng chung;
4. khách báo thẻ bị trừ tiền lạ, hoặc nghi số thẻ đã bị lộ.

Khi gọi:
- **gọi, không nhắn số**;
- không gọi được thì nhắn "Cần gọi lại – sự cố số thẻ khách, `OTM-…`" (không có số), ghi sổ giao ca, rồi gọi lại tới khi gặp.

Sau đó chủ đầu tư cùng SEC xử lý theo SR-INC-01: khoanh vùng, đánh giá, quyết có báo khách liên hệ ngân hàng không, có phải báo cơ quan chức năng trong 72 giờ không (luật sư xác nhận). Lễ tân không tự hứa gì với khách ngoài câu ở 6.1.

### 6.4 Việc tiếp và giới hạn

- **BA** đưa câu chốt ở 6.1 vào hai chỗ:
  - release notes v1.0.5, dòng BUG-R5-005, như thẻ của DOM;
  - sổ tay, bảng tình huống ngay dưới dòng "Khách đọc số thẻ qua điện thoại", **thành luật chung**, kèm 6.2 và 6.3. Ca này không chỉ xảy ra với lỗi BUG-R5-005.

  Nên thêm dòng tương ứng vào `guides/02-le-tan.md`.
- **UXD/CPY** chỉnh câu trả lời khách ở 6.1 trước khi in.
- **DOM:** giả định 3 bỏ nhãn [GIẢ ĐỊNH]; SEC đã chốt.
- **SEC** không sửa `security-requirements.md`. SR-PAY-10 đã đòi có hướng dẫn này trong tài liệu vận hành; nay đã có câu cụ thể.
- **Không ESC:** không có quyết định mới về tiền, phạm vi hay pháp lý. Hạn 72 giờ đã có ở SR-INC-01 và vẫn chờ luật sư xác nhận như cũ.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – chốt câu "khách lỡ gửi số thẻ qua tin nhắn"** (FB-R5-DOM-BA-01, DOM giả định 3; rounds/round-05/responses/SEC-responses.md mục 6). (a) Câu DOM đúng hướng, SEC sửa 4 chỗ: thêm không dùng số để thu tiền (không gõ POS, không nhập Desk); trả lời khách bằng tin mới, không trích tin có số, nhờ thu hồi nếu kênh có nút, rồi xóa ngay không chờ; xóa trên mọi máy cơ sở đang mở tài khoản, cả thùng rác email và ảnh đã lưu; không ghi ở đâu, kể cả 4 số cuối. (b) Có ghi sổ giao ca: một dòng mã đơn + kênh + đã xóa, không số, không tên/SĐT khách. (c) Ca thường: báo chủ đầu tư trước khi hết ca, tin không có số. Ca bất thường (đã chép/chụp/chuyển/gõ POS, mất máy trước khi xóa, không xóa được, khách báo trừ tiền lạ): gọi ngay, muộn nhất 1 giờ, kể cả ban đêm, rồi xử lý theo SR-INC-01 (72 giờ chờ luật sư xác nhận). BA đưa vào sổ tay bảng tình huống thành luật chung; UXD/CPY chỉnh câu trả lời khách theo brand guideline. Không ESC | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật, mức rủi ro) |`

### 6.5 Câu CPY và cách xóa theo kênh (07/11, câu hỏi của ORC)

Nguồn:
- CPY `rounds/round-05/outputs/CPY/guest-reply-card-number.md` (`dc0c5038`): bản đầy đủ (mục 2), bản ngắn Zalo (mục 3), bản bỏ vế xóa (mục 5);
- INT `rounds/round-05/outputs/INT/message-deletion-by-channel.md` (`40cd4651`): bảng xóa theo kênh, 6 ghi chú (mục 5), lượt thử T1–T6 (mục 4).

#### 6.5.1 Thứ tự: giữ "trả lời trước, xóa ngay sau"; duyệt chữ "sẽ xóa ngay"

SEC giữ thứ tự ở 6.1, không đổi sang "xóa trước, trả lời sau". Lý do:
- email: phải còn thư thì lễ tân mới chép đúng địa chỉ người gửi để soạn thư mới;
- khách được báo trước khi tin mất ở phía OTTIMO, nên ít khả năng khách tưởng tin bị bỏ qua rồi gửi lại số;
- thời gian thêm chỉ là lúc dán một câu mẫu, dưới một phút. Lỗi trích lại tin có số đã bị chặn bằng luật "tin mới, không bấm Trả lời".

Vì vậy SEC **duyệt**:
- bản đầy đủ (CPY mục 2): "We will delete your message on our side straight away." / "Ở phía OTTIMO, lễ tân sẽ xóa ngay tin bạn đã gửi.";
- bản ngắn Zalo (CPY mục 3): "we are deleting your message on our side now" / "lễ tân sẽ xóa ngay".

**Không** dùng "đã xóa". Phần còn lại của hai bản cũng đạt: không chữ số, không hứa thêm, không link trả thẻ, "cách khác" gửi bằng tin riêng (VietQR Desk tạo cho đúng đơn, kèm câu chống giả danh). Email và SMS bỏ câu 4 là đúng.

#### 6.5.2 Bản bỏ vế xóa (CPY mục 5): duyệt, cho kênh không xóa được theo thiết kế

- SEC duyệt nguyên văn CPY mục 5 (EN, VI). Khóa khi làm mẫu tin: `msg.card_by_message_no_delete`.
- "Kênh không xóa được theo thiết kế" = phía OTTIMO **không có thao tác xóa** tin khách gửi khỏi tài khoản. Hiện gồm:
  - **Zalo OA** (OA Manager, kênh chính ESC-021 A): dùng bản mục 5 **ngay từ bây giờ**. Chỉ quay về bản ngắn mục 3 khi T1 cho thấy tin xóa được khỏi tài khoản OA, tức quản trị viên thứ hai mở OA Manager (web và mini app) cũng không còn thấy. INT báo lại khi có kết quả;
  - hộp thư OTA (Airbnb, Booking, Agoda);
  - Messenger fanpage, tới khi INT tra xong.
- "Đánh dấu spam" và nhãn "Hoàn thành" của OA chỉ ẩn hội thoại, **không** phải xóa. Không đánh dấu spam hội thoại của khách.

#### 6.5.3 Sửa 6.3: kênh không xóa được theo thiết kế là ca thường

SEC chọn phương án (b) ở ghi chú 1 của INT. Ca bất thường số 3 ở 6.3 nay chỉ gồm:
- tin nằm trên máy hoặc tài khoản mà lễ tân không mở được;
- tài khoản đó có người ngoài cơ sở dùng chung;
- kênh xóa được nhưng xóa không thành, tức vẫn thấy tin sau khi xóa.

Kênh ở 6.5.2 là **ca thường**. Lễ tân làm 4 việc:
1. Gửi bản mục 5. Mọi luật khác của 6.1 vẫn áp: không chép, không chụp, không chuyển tiếp, không đọc to, không gõ vào máy POS, không nhập Desk.
2. Xóa mọi bản sao xóa được:
   - ảnh máy đã tự lưu, cả trong thùng rác ảnh;
   - thư báo tin nhắn mà OTA hoặc Zalo gửi về email cơ sở, nếu thư có nội dung tin (xóa cả trong Thùng rác).
3. Ghi sổ giao ca một dòng: "`<giờ>` – `OTM-…` – khách gửi số thẻ qua `<Zalo OA / hộp thư OTA>` – kênh không xóa được, đã nhờ khách thu hồi". Không số, không tên hay số điện thoại khách.
4. Báo chủ đầu tư trước khi hết ca, như ca thường.

Ca bất thường số 1, 2 và 4 vẫn áp cho mọi kênh, kể cả Zalo OA.

Vì sao không gọi chủ đầu tư mỗi lần:
- chủ đầu tư cũng không xóa được tin trên OA hay OTA, nên cuộc gọi ban đêm không thêm lớp bảo vệ nào;
- lớp bảo vệ thật là không ai chép hay dùng số, và chỉ ít người xem được lịch sử chat.

Rủi ro còn lại, SEC chấp nhận ở mức **Low**:
- tin có số thẻ còn trong lịch sử OA hoặc OTA; mọi quản trị viên của tài khoản đó xem được;
- cách giảm đang có: OA chỉ cấp quản trị cho người cần, mỗi người một tài khoản, gỡ ngay khi nghỉ việc (SEC 17/10);
- khi nhận báo, chủ đầu tư có thể hỏi bộ phận hỗ trợ của Zalo hoặc OTA cách gỡ tin. Lễ tân không hứa việc này với khách;
- gợi ý cho v1.0.6, không bắt buộc (CPY, INT): tin chào tự động của OA nói OTTIMO không nhận thông tin thẻ qua chat, để giảm số lần khách gửi.

#### 6.5.4 Sáu ghi chú của INT

| # | Ghi chú INT (mục 5) | SEC chốt |
|---|---|---|
| 1 | Zalo OA không xóa được | Như 6.5.2 và 6.5.3 |
| 2 | SMS có "Đã xóa gần đây" / "Thùng rác" | **Có.** Thêm vào câu 6.1: "SMS thì xóa cả trong Đã xóa gần đây / Thùng rác của app tin nhắn" |
| 3 | Telegram, ô "Also delete for {tên khách}" | **Không đánh dấu.** Lời hứa với khách là "ở phía OTTIMO"; bản của khách do khách quyết, câu 4 đã nhờ khách thu hồi. Mọi kênh làm cùng một cách: WhatsApp chọn "Xóa ở phía tôi", Viber chọn "Delete for myself" |
| 4 | Tắt tự lưu ảnh trên điện thoại cơ sở | **Có, thành quy định:** tắt tự lưu ảnh và file vào thư viện ảnh ở Zalo, WhatsApp, Telegram, Viber trên điện thoại cơ sở. Làm trong lượt thử (6.5.5). Bước "xóa cả ảnh đã lưu" ở 6.1 vẫn giữ, phòng khi cài đặt bị bật lại sau khi cập nhật app |
| 5 | Google Workspace: quản trị viên còn khôi phục được 25 ngày sau "Delete forever"; Vault | **Không đổi chữ.** Lời hứa nói về hộp thư lễ tân dùng, và điều đó đúng. Phần còn khôi phục được chỉ quản trị viên Workspace làm được: rủi ro Low. Ở lượt thử T5, chủ đầu tư cho biết Vault có bật quy tắc giữ thư không; có thì báo SEC. SEC ghi vào phần rủi ro còn lại của SR-INC-01 ở lần sửa `security-requirements.md` tới |
| 6 | Bản sao lưu chat (Google Drive, iCloud, Zalo) | **Chấp nhận**, Low; không đổi chữ, không bắt tắt sao lưu. Nếu điện thoại cơ sở bật sao lưu chat thì để một bản, tự ghi đè hằng ngày; không giữ nhiều bản cũ |

Thêm cho mọi kênh xóa được: tài khoản đang mở trên nhiều máy (điện thoại, máy tính, bản web) thì xóa trên **từng máy**. Chỉ bỏ bước này khi lượt thử T2–T4 cho thấy xóa tự đồng bộ.

#### 6.5.5 Lượt thử trên máy thật (T1–T6 của INT mục 4)

- Người làm: lễ tân, có chủ đầu tư hoặc quản lý đi cùng.
- Tin thử: chữ "TEST XOA", gửi từ tài khoản của một nhân viên tới tài khoản OTTIMO. Không chữ số, không ảnh thẻ, kể cả số thẻ thử công khai. Không dùng tài khoản hay dữ liệu khách.
- **Làm T1 trước**, vì OA là kênh chính.
- SEC thêm hai việc vào lượt thử:
  - ở T2, T3, T4, và với Zalo, Telegram trên điện thoại cơ sở: tắt tự lưu ảnh (6.5.4 ý 4), ghi lại là đã tắt;
  - ở T5: chủ đầu tư cho biết Vault có bật không (6.5.4 ý 5).
- Không lượt thử nào chặn bản phát hành. Tới khi có kết quả, lễ tân làm theo 6.5.2–6.5.4.
- Kết quả gửi ORC. INT cập nhật bảng của mình; CPY và BA sửa câu nếu kết quả khác bảng.

#### 6.5.6 Việc cho BA, CPY

**BA** (sổ tay `user-manual-v1.0.md`, `guides/02-le-tan.md`):
1. Thay "(câu chuẩn: chờ CPY)" bằng dòng ở CPY mục 6, **sửa** phần trong ngoặc thành: "(câu chuẩn ở dưới bảng; Zalo số cơ sở dùng bản ngắn; Zalo OA, hộp thư OTA và Messenger dùng bản không có vế xóa; email soạn thư mới; email và SMS bỏ câu thu hồi)". Đặt bản CPY mục 5 (EN, VI) cạnh bốn đoạn của CPY mục 2 và 3.
2. Câu chốt 6.1 thêm: "SMS thì xóa cả trong Đã xóa gần đây / Thùng rác. WhatsApp chọn Xóa ở phía tôi; Telegram không đánh dấu ô xóa cho khách. Tài khoản mở trên nhiều máy thì xóa trên từng máy."
3. Thêm một dòng ngay dưới: kênh không xóa được (Zalo OA, hộp thư OTA, Messenger) làm 4 việc ở 6.5.3; không đánh dấu spam.
4. Sửa ca bất thường số 3 (6.3) theo 6.5.3.
5. Ở phần cài đặt điện thoại cơ sở (hoặc việc của chủ đầu tư khi giao máy): tắt tự lưu ảnh của Zalo, WhatsApp, Telegram, Viber.

**CPY** (tệp của CPY):
- bảng "Chọn bản" ở mục 1: tách dòng Zalo thành Zalo OA (bản mục 5) và Zalo số cơ sở (bản ngắn); hộp thư OTA và Messenger dùng bản mục 5, không còn "chưa dùng";
- mục 5 bỏ dòng "chờ SEC";
- dòng nhắc ở mục 6 "Gửi xong thì xóa ngay tin của khách" thêm "(kênh xóa được)".

**Không ESC.** Không có quyết định mới về tiền, phạm vi hay pháp lý. SEC không sửa `security-requirements.md` ở lượt này; ý 5 vào lần sửa tới.

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – duyệt câu CPY trả lời khách gửi số thẻ, chốt cách xóa theo kênh** (rounds/round-05/responses/SEC-responses.md mục 6.5; CPY dc0c5038, INT 40cd4651). Giữ thứ tự trả lời trước, xóa ngay sau; duyệt "sẽ xóa ngay / straight away / deleting now", không "đã xóa". Duyệt bản bỏ vế xóa (CPY mục 5) cho kênh không xóa được theo thiết kế: Zalo OA (tới khi T1 chứng minh xóa được khỏi tài khoản OA), hộp thư OTA, Messenger. Sửa 6.3: kênh đó là ca thường (gửi bản mục 5, xóa bản sao xóa được, ghi sổ giao ca, báo chủ đầu tư trước hết ca); ca bất thường số 3 chỉ còn máy/tài khoản không mở được, tài khoản dùng chung với người ngoài, xóa không thành. Rủi ro còn lại Low (lịch sử OA/OTA còn số thẻ, chỉ quản trị viên xem). INT: thêm thùng rác SMS vào câu 6.1; Telegram không đánh dấu "Also delete for"; tắt tự lưu ảnh trên điện thoại cơ sở là quy định; Workspace khôi phục 25 ngày và bản sao lưu chat chấp nhận Low. Lượt thử T1–T6 (T1 trước) do lễ tân cùng chủ đầu tư/quản lý làm bằng tin "TEST XOA", thêm bước tắt tự lưu ảnh và hỏi Vault; không chặn phát hành. Không ESC | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật, mức rủi ro) |`

---

### 6.6 FB-R5-DOM-BA-08: khách gửi ảnh giấy tờ (CCCD, hộ chiếu) qua chat (07/11, câu hỏi của ORC)

Nguồn: DOM `DOM-on-ba-v105-docs.md` thẻ BA-08; BA `rounds/round-05/outputs/BA/report.md` lượt 4 ("SEC xác nhận vế xóa và vế 'không tải ảnh từ chat lên Desk'"). Ở `da596507`, BA chưa viết dòng này vào sổ tay; BA chờ câu trả lời này.

**SEC xác nhận cả hai vế** trong câu DOM đề xuất, với 3 ý thêm.

1. **"Không lưu ảnh về máy, không chuyển tiếp, không tải từ chat lên Desk": đúng.**
   - Ảnh giấy tờ là dữ liệu C3. Desk chỉ nhận ảnh giấy tờ theo hai đường:
     - khách tự tải lên qua check-in online (`02` 17.3), sau khi đã thấy thông báo xử lý dữ liệu bản 2;
     - ở quầy, sau khi khách xem tờ **Your ID details** và đồng ý lưu ảnh ở Khối 1 (`02` 7.2, 8.2).
   - Tải ảnh từ chat lên Desk là bỏ qua bước thông báo và đồng ý đó.
   - Muốn tải lên thì phải lưu ảnh xuống máy trước. Ảnh khi đó nằm ngoài vòng xóa của Desk (SR-RET), đúng điều luật tắt tự lưu ảnh muốn tránh.
   - Ảnh qua chat cũng không thay được bước đối chiếu bản gốc lúc nhận phòng.
   - **Thêm (a):** "máy" là **mọi** máy của cơ sở: điện thoại, máy tính quầy, Zalo PC, bản web. Không bấm Tải về, không chụp màn hình, không mở ảnh bằng app khác. Lỡ tải về thì xóa ở thư mục Tải về và Thùng rác, hoặc Đã xóa gần đây ở điện thoại.
2. **"Xóa tin có ảnh theo cách xóa của kênh, như dòng số thẻ; kênh không xóa được thì để nguyên, không chuyển tiếp": đúng.** Dùng nguyên cách xóa và danh sách kênh của 6.5:
   - xóa ở **từng** máy đang mở tài khoản đó;
   - SMS thì xóa cả trong Đã xóa gần đây hoặc Thùng rác;
   - Telegram không đánh dấu "Also delete for…";
   - email thì xóa cả trong Thùng rác;
   - Zalo OA (tới khi lượt thử T1 cho thấy xóa được), hộp thư OTA, Messenger: để nguyên, không chuyển tiếp.

   **Thêm (b):** trả lời khách **trước**, xóa ngay sau, như 6.5.1. Câu trả lời (CPY viết) nói "sẽ xóa", không nói "đã xóa". Câu chỉ khách hai lối:
   - đơn đã xác nhận: link check-in online, gửi riêng 1–1 theo `02` 17.3;
   - chưa xác nhận: mang bản gốc khi nhận phòng.

   Câu không mời khách gửi lại qua kênh chat khác.
3. **Thêm (c): mức báo.**
   - **Ca thường** (đã trả lời, đã xóa ở kênh xóa được, hoặc kênh không xóa được theo thiết kế, và không ai lưu, chụp hay chuyển tiếp): không ghi sổ giao ca, không báo chủ đầu tư. Lý do:
     - khách tự gửi giấy tờ của chính mình, cho đúng việc lưu trú;
     - ca này gặp thường xuyên; báo mỗi lần chỉ thành tiếng ồn.
   - **Ca bất thường:** báo như 6.3 (gọi chủ đầu tư ngay, muộn nhất 1 giờ). Gồm:
     - ảnh đã bị lưu, chụp hay chuyển tiếp, kể cả vào nhóm chat nội bộ;
     - máy giữ tin bị mất trước khi xóa;
     - kênh xóa được mà xóa không thành;
     - tài khoản đó có người ngoài cơ sở dùng chung.

     Ảnh giấy tờ lọt ra ngoài là sự cố dữ liệu C3 (SR-INC-01). Đồng hồ 72 giờ (luật sư xác nhận) có thể bắt đầu từ lúc biết, nên không chờ hết ca.

Việc cho BA (khi viết dòng BA-08 vào sổ tay 2.21 và `02` 16.1): ghi đúng 1–3 trên. Dẫn sang cách xóa theo kênh của dòng số thẻ, không chép lại bảng. Thêm "mọi máy" vào câu "Không chụp giấy tờ khách, không gửi giấy tờ qua Zalo/Messenger" ở `02`.

Việc cho CPY: câu trả lời theo 2(b), ba bản theo kênh như câu số thẻ (bản bỏ vế xóa cho kênh không xóa được).

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – xác nhận DOM BA-08 (khách gửi ảnh giấy tờ qua chat)** (rounds/round-05/responses/SEC-responses.md mục 6.6). Không lưu về máy nào của cơ sở (điện thoại, máy tính, Zalo PC, bản web), không chụp màn hình, không chuyển tiếp, không tải từ chat lên Desk (bỏ qua thông báo xử lý dữ liệu và đồng ý ở Khối 1; ảnh nằm ngoài vòng xóa SR-RET); xóa theo kênh như dòng số thẻ (SEC 6.5), kênh không xóa được là ca thường; trả lời khách trước (check-in online cho đơn đã xác nhận, hoặc mang bản gốc), xóa ngay sau. Ca thường không ghi sổ, không báo; ca bất thường báo chủ đầu tư như 6.3 (sự cố C3, SR-INC-01). BA viết dòng vào sổ tay 2.21 và 02 16.1, CPY viết câu trả lời. | SEC |`

#### 6.6.1 Hai câu BA hỏi lại về dòng BA-08 (07/11, BA `f332f503`, câu hỏi của ORC)

Nơi BA viết: sổ tay 2.21 và `02` 16.1 (dòng "Khách gửi ảnh giấy tờ"), sổ tay 0.8 và `02` 16.2.

**(1) "Ảnh đã bị lưu" ở 6.6 (c) có gồm lần lỡ tải về rồi xóa ngay không: SEC sửa. Không gồm.**

Chữ "lưu" ở 6.6 (c) của SEC viết chưa rõ, nên BA đọc như vậy là đúng chữ. Ý SEC: ảnh được **giữ lại** hoặc **đi ra khỏi máy**, không phải một bản lỡ tải về đã xóa ngay. Lý do sửa:
- Dòng số thẻ đã coi ảnh thẻ máy tự lưu là một bản sao xóa được: xóa trong bước thường, không gọi (6.1, 6.5.3 ý 2). Ảnh giấy tờ không nên chặt hơn ảnh thẻ.
- Sổ tay 2.4 đã có câu cho máy tự lưu: "xóa ảnh đó, cả trong thùng rác ảnh, tắt lại cài đặt, báo chủ đầu tư". Câu này là **báo**, không phải gọi trong 1 giờ.
- Bản đã xóa trên máy của cơ sở không lọt ra ngoài cơ sở. Phần còn phải kiểm là **bản sao trên mây**, nếu máy đó sao lưu ảnh hoặc file lên tài khoản mây. Lễ tân thường không mở được tài khoản đó, nên chủ đầu tư kiểm. Việc này chờ được tới cuối ca.

Câu SEC đề nghị BA dùng ở cả 2.21 và `02` 16.1, thay câu "Lỡ tải về, hoặc thấy máy tự lưu ảnh: … rồi gọi":

- **Lỡ tải về, hoặc thấy máy tự lưu ảnh**, trên máy của cơ sở, và ảnh chưa được mở bằng app khác, chưa được gửi hay tải lên đâu:
  - xóa ngay ở thư mục **Tải về** và **Thùng rác** (điện thoại: cả **Đã xóa gần đây**);
  - tắt lại tự lưu (sổ tay 2.4, `02` 4.1);
  - **ghi sổ giao ca một dòng**, không mã đơn, không tên khách: "hh:mm – ảnh giấy tờ khách gửi qua chat bị lưu vào `<điện thoại quầy / máy tính quầy>` (lỡ tải về / máy tự lưu) – đã xóa cả Thùng rác, đã tắt tự lưu";
  - **báo chủ đầu tư trước khi hết ca**, bằng tin ngắn như dòng sổ, không gửi ảnh. Không phải gọi trong 1 giờ.
- **Việc của chủ đầu tư khi nhận báo:**
  - kiểm máy đó có sao lưu ảnh hoặc file lên tài khoản mây không (iCloud Ảnh, Google Photos, Google Drive). Có thì xóa bản trên mây, cả trong thùng rác của mây;
  - tài khoản mây đó không phải của cơ sở (SR-DEV-08), hoặc có người ngoài cơ sở dùng chung: xử như sự cố theo SR-INC-01.

  BA thêm ý này vào sổ tay 1.16 (việc của chủ đầu tư) hoặc 2.21, chỗ nào hợp.
- **Vẫn gọi chủ đầu tư ngay, muộn nhất 1 giờ** khi gặp một trong các ca sau. BA bỏ chữ "lưu, tải về" khỏi danh sách gọi và để lại các ý khác:
  - ảnh đã bị chụp màn hình, chuyển tiếp (kể cả vào nhóm chat nội bộ), mở hay gửi sang app khác, hoặc tải lên bất kỳ đâu, kể cả Desk;
  - không xóa được bản đã tải về hoặc tự lưu: không tìm thấy tệp, máy đang ở tay người khác;
  - ảnh nằm trên **máy cá nhân** của nhân viên;
  - máy giữ tin bị mất trước khi xóa;
  - kênh xóa được mà xóa không thành;
  - tài khoản đó có người ngoài cơ sở dùng chung.

Chỗ dẫn mục của BA đúng, SEC đã kiểm: sổ tay 2.4, `02` 4.1.

**(2) Thư báo tin nhắn có ảnh mà OTA hoặc Zalo gửi về email cơ sở: SEC xác nhận.** Đó là bản sao xóa được, như ở 6.5.3 ý 2. Ba ý làm rõ:
- Áp khi thư **có ảnh** (đính kèm, hiện trong thân thư, hoặc ảnh thu nhỏ) hoặc có nội dung tin. Thư chỉ báo "bạn có tin mới" thì để nguyên.
- Cách xóa như email ở 6.5:
  - xóa thư, rồi xóa cả trong **Thùng rác**;
  - không mở hay tải tệp đính kèm, không chuyển tiếp;
  - thư vẫn hiện trên máy khác đang mở hộp thư đó thì xóa ở máy đó, tới khi lượt thử T5 cho thấy xóa tự đồng bộ.
  
  Xóa xong là ca thường: không ghi sổ, không báo. Tin gốc trong hộp thư OTA hoặc Zalo OA vẫn để nguyên, như 6.5.2.
- Thư báo đi tới hộp thư mà lễ tân không mở được, ví dụ email chủ đầu tư đăng ký với OTA: lễ tân không cần làm gì thêm. Chủ đầu tư tự xóa thư đó ở hộp thư của mình, cả trong Thùng rác. BA thêm một câu vào sổ tay 1.16 nếu chưa có.

Phần Google Workspace còn khôi phục được 25 ngày sau "Delete forever" vẫn là rủi ro còn lại mức Low (6.5.4 ý 5, SR-INC-01).

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – trả lời 2 câu BA về dòng BA-08 (f332f503)** (rounds/round-05/responses/SEC-responses.md mục 6.6.1). (1) Sửa: lỡ tải về hoặc máy tự lưu ảnh giấy tờ trên máy của cơ sở, chưa mở hay gửi sang đâu, là **ca giữa**: xóa ở Tải về và Thùng rác (Đã xóa gần đây), tắt lại tự lưu, ghi sổ giao ca một dòng không mã đơn, không tên khách, báo chủ đầu tư trước khi hết ca, không gọi trong 1 giờ; chủ đầu tư kiểm bản sao lưu trên mây (iCloud Ảnh, Google Photos, Google Drive) và xóa. Vẫn gọi trong 1 giờ khi ảnh bị chụp màn hình, chuyển tiếp, mở hay gửi sang app khác, tải lên đâu (kể cả Desk), không xóa được, nằm trên máy cá nhân, mất máy, xóa không thành, tài khoản dùng chung với người ngoài. (2) Xác nhận: thư báo có ảnh hoặc có nội dung tin mà OTA hay Zalo gửi về email cơ sở là bản sao xóa được như 6.5.3: xóa cả trong Thùng rác, không mở tệp đính kèm, ca thường. Thư về hộp thư của chủ đầu tư thì chủ đầu tư tự xóa. | SEC |`

---

## 7. DOM review V5-74 – runbook sự cố dữ liệu khách (07/11)

Thẻ từ `rounds/round-05/reviews/DOM-on-sec-v5-74.md` (`fc4c2b08`), sửa ở `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.1. Thẻ BA, OPS chưa tới.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-SEC-V574-01 (Major) | Done – phương án (a) | Mức Thấp cần **cả hai**: link chưa mở và tin gửi kèm chỉ có link. Tin có tên, ngày ở hay căn thì là Vừa, dù link chưa mở. Chưa biết tin kèm gì thì coi như có tên. Mẫu dòng (mục 6) có ô "tin: chỉ link / có tên / có ngày ở / có căn", chỉ ghi loại, không chép nội dung. `guides/02` 17.3 bước 5 và `guides/01` 14.1 ghi thêm ô này, vì chỉ quầy biết tin kèm gì. **(b) SEC khuyến nghị làm thêm, không chặn:** câu gửi link chỉ chào chung, không tên, ngày ở, căn. Đây là tối thiểu dữ liệu từ gốc. CPY viết theo giọng OTTIMO, BA đưa vào `guides/02` 17.3 bước 3. Khi đó runbook vẫn đúng, ô "tin" sẽ là "chỉ link" |
| FB-R5-DOM-SEC-V574-02 (Minor) | Done | Ghi lạ: hỏi lại khách giờ đến và yêu cầu khi gửi link mới, không cần kể chuyện gửi nhầm; sửa giờ đến; yêu cầu khách không gửi thì hủy hoặc từ chối, không tính phí; khách đến làm giấy tờ tại quầy như khách không check-in online (thay "đối chiếu bản gốc"). Người nhận nhầm là khách đơn khác: gửi link của chính đơn họ, một câu xin lỗi ngắn, không nói gì về đơn kia. **SEC xác nhận đây không phải "báo người nhận nhầm"**: việc đó phục vụ đơn của chính họ và không đưa thêm dữ liệu nào của khách kia. Ảnh họ tải lên đơn sai: không Gắn người, quản lý Xóa ảnh |
| FB-R5-DOM-SEC-V574-03 (Suggestion) | Done | Báo OWN = nhắn thẳng tới liên hệ OWN đã lưu trên điện thoại cơ sở, đúng dòng mẫu, nhắn ngay, muộn nhất trong ngày, sau 22:00 vẫn nhắn; có ghi lạ thì gọi ngay. Không chụp màn hình hội thoại gửi nhầm |
| FB-R5-DOM-SEC-V574-04 (Suggestion) | Done | Câu dưới bảng mục 1: Xóa ảnh chỉ quản lý, chủ đầu tư (A74); người trực chỉ có vai lễ tân thì không Gắn người, ghi sổ, báo OWN ngay, OWN hoặc quản lý xóa |
| Đề xuất mẫu dòng của DOM (mục 3 review) | Done | Thêm ngày gửi nhầm, tin kèm gì, ghi lạ, ảnh đã xóa. Nhánh B thêm ngày lượt kéo |

Ngoài runbook, SEC sửa tối thiểu `guides/02` 17.3 bước 5 và `guides/01` 14.1 cho quầy và chủ đầu tư làm cùng một cách (ghi "chưa đánh số bản" ở lịch sử tệp). Còn cho vai khác, ORC giao:
- BA: chép cùng ý sang sổ tay 2.9 bước 6, đánh số bản bộ hướng dẫn;
- PO: Tờ 1, dòng "Gửi nhầm người", thêm "tin kèm gì" vào dòng sổ giao ca và "nhắn chủ đầu tư" (tờ in, INV in lại khi PO sửa);
- CPY + BA: phương án (b) của V574-01, nếu ORC xếp.

**Tổng: 4 thẻ, 4 Done, 0 Rejected, 0 Deferred, 0 Escalated.** Không ESC.

---

## 8. OPS và BA review V5-74 – runbook bản 1.2 (07/11)

Thẻ từ `rounds/round-05/reviews/OPS-on-sec-v5-74.md` (bản 1.0 @ `2f732f58`) và `rounds/round-05/reviews/BA-on-sec-v5-74.md` (bản 1.1 @ `3174ce65`). Sửa ở `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.2.

Bối cảnh: INV quyết 07/11 chuyển bản sao lưu lên Google Drive công ty (OPS làm PR riêng, SEC review sau). Nhánh B bản 1.2 vì vậy viết theo **"bản ngoài máy"**: bản nằm ngoài máy chủ mà máy chủ không ghi đè, không xóa được. Hôm nay là Mac; khi chuyển Drive thì các bước giữ nguyên. Điều kiện "máy chủ không ghi đè, không xóa được bản đã có" là điều SEC sẽ kiểm ở PR Drive: nếu máy chủ tự đẩy lên Drive bằng khóa nằm trên máy chủ, máy bị chiếm sửa được cả bản trên Drive, và cách phát hiện mã 3 (kéo, so tên trùng) không còn.

### 8.1 Thẻ OPS

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-OPS-SEC-V574-01 (Major) | Done | Mục 5 bước 3: băm tin được là `.sha256` **ngoài máy**. (1) lấy bản máy chủ của đúng tệp bị báo bằng khóa kéo chỉ đọc vào thư mục mới, trống, ngoài thư mục sao lưu, không đăng nhập; (2) tính băm ở máy ngoài, so với `.sha256` ngoài máy; (3) ba ca kết luận theo đúng đề xuất OPS; (4) để nguyên thư mục tạm cho SEC. Chữ cho README: mục 8.3 |
| FB-R5-OPS-SEC-V574-02 (Minor) | Done | Bước 2: không chạy lại `pull-backups.sh`, kể cả lịch V5-60 hay lịch đồng bộ Drive (tắt lịch trước); lý do: mỗi lượt kéo thêm từ máy bị nghi và xóa bản ngoài máy quá 35 ngày; tệp của lượt mã 3 không dùng để dựng lại. Lệnh tắt lịch: OPS thêm vào README khi V5-60 xong, báo SEC để trỏ |
| FB-R5-OPS-SEC-V574-03 (Minor) | Done (phần SEC) | Runbook trỏ tới cách xử lý mã 1 ở README (`quarantine/`, không xóa); SEC quyết khi xóa `quarantine/` (SR-BAK-03). OPS viết cách xử lý vào README (mục 8.3, ý 3) |
| FB-R5-OPS-SEC-V574-04 (Minor) | Done (phần SEC) | Runbook giữ câu trỏ, thêm "(ca máy còn chạy và việc với máy cũ: tắt, giữ, hủy thuê – OPS ghi ở đó)". SEC đồng ý nội dung OPS đề xuất cho `runbook-vps-moi.md` "Dùng khi": tắt máy cũ bằng console nhà cung cấp khi OWN quyết theo đề nghị SEC; **không xóa, không hủy thuê** tới khi SEC (và luật sư, nếu đang hỏi) cho; tiền thuê máy thứ hai OWN quyết, vượt ngân sách thì OPS tạo ESC |
| FB-R5-OPS-SEC-V574-05 (Suggestion) | Done | Bước 4: `.last_pull` chỉ cho biết tệp bị sửa sau giờ đó, không cho biết lúc bị vào; SEC chọn theo dấu hiệu khác, không chắc thì lùi thêm một bản. Bản chụp journal chỉ đọc trước khi tắt máy cũ: SEC sẽ xin ở lúc có sự cố, ghi trong khối máy cũ của OPS |
| Việc phụ: đếm lượt mở link đã thu hồi (OPS mục 3) | Ghi nhận | SEC đồng ý hình dạng (khuôn K14, `audit_event guest_session.opened` trước `revoked_at`, đầu ra chỉ nhãn và số). **SEC quyết: không đếm số `ip_hmac` khác nhau** ở lượt đầu: con số đó không đổi mức sự cố (link có mở là Vừa), mà lại đưa định danh bí danh vào phép đếm. Xét lại nếu luật sư cần tách "một người hay nhiều người". Bước 4 nhánh A ghi "OPS đang làm khối chạy, SEC ghim"; khi có khối, SEC trỏ tên khối |

### 8.2 Thẻ BA

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-BA-SEC-V574-01 (Major) | Done (phần SEC) | Mục 4 bước 1 dán nguyên văn câu DOM (`DOM-on-ba-card-v574-01.md` mục 1), mục 2 và dòng mẫu mục 6 theo DOM. Xem mục 8.5. Đóng khi BA chép 17.3 bước 5 và PO sửa Tờ 1 |
| FB-R5-BA-SEC-V574-02 (Minor) | Done | Mục 2 bước 2 tách thành bảng "ai chặn gì": quầy A114, A112; OWN A100, A115, A110 (`guides/01` mục 1.9), không duyệt phát hành, tắt máy chủ; OPS khi OWN đồng ý. Mục 1 dòng người trực: "**Thu hồi link** khách"; dòng OWN thêm khóa tài khoản, thu hồi phiên và thiết bị |
| FB-R5-BA-SEC-V574-03 (Minor) | Done | Một câu ở mục 1 (dưới bảng), mục 2 bước 4, mục 3 dòng Vừa: "OWN quyết; SEC đề xuất; luật sư xác nhận". Mục 1 bỏ "(cùng SEC)". Mẫu decision-log mục 6: cột người quyết `OWN`, câu quyết có "SEC đề xuất <báo/không báo>" |
| FB-R5-BA-SEC-V574-04 (Minor) | Done | Mục 2 "Khi chưa ai trả lời", ghi `[GIẢ ĐỊNH – chờ INV xác nhận]`, ESC-001 / Q12. Vừa mà luật sư im tới giờ 48: làm như Cao (SEC soạn bản báo bằng số đếm, OWN quyết gửi trước giờ 72; không gửi thì ghi lý do). OWN im: ORC nhắc ở giờ 24 và 48 kèm đề xuất và bản soạn sẵn; giờ 48 vẫn im thì ghi decision-log "chưa có quyết định của OWN"; đội không gửi thay |
| FB-R5-BA-SEC-V574-05 (Minor) | Done | Dòng 3: "Quầy làm theo `guides/02` mục 17.3 bước 5 và Tờ 1 (cùng nội dung mục 4 bước 1–2). Runbook này không phát cho quầy." |
| FB-R5-BA-SEC-V574-06 (Suggestion) | Chờ BA | SEC không sửa gì. Mục 6 thêm câu "đổi mẫu nhánh A thì SEC báo BA chép lại". SEC xác nhận khi BA chép xong ở S6 (17.3 bước 5, sổ tay 2.9 bước 6) |
| FB-R5-BA-SEC-V574-07 (Suggestion) | Done | "Dùng khi" thành bốn gạch. Mục 5 bước 4: "SEC + OPS, khi OWN đồng ý trong chat". "Mã 3 che mã 1" → "Mã 3 được báo thay cho mã 1, nên có thể có cả dòng `checksum mismatch` trong cùng lượt" |
| FB-R5-BA-SEC-V574-08 (Suggestion) | Done (phần SEC) | Đầu runbook ghi rõ ba mặc định pháp lý tạm là `[GIẢ ĐỊNH – chờ INV xác nhận]`, ESC-001 / Q12. ORC ghi dòng decision-log ở mục 8.6 và nêu trong round-summary |

**Tổng mục 8.1–8.2: 13 thẻ (OPS 5, BA 8) + việc phụ. 10 Done, 3 Done phần SEC chờ vai khác (OPS-03, OPS-04 chờ OPS sửa README và runbook VPS mới; BA-01 chờ BA, PO chép), BA-06 chờ BA; 0 Rejected, 0 Deferred, 0 Escalated.** Không ESC mới.

### 8.3 Chữ cần đổi ở `product/infra/server/README.md` (OPS sửa, cùng lượt thẻ 01)

Dòng "Bản sao lưu ngoài máy". SEC không sửa tệp của OPS; chữ dưới để hai nơi dùng chung một ý.

1. **Thay** câu "Nếu cùng tệp đó còn báo `checksum mismatch` thì có thể bản trên Mac mới là bản hỏng: so tay với `.sha256` trên máy chủ trước khi kết luận." **bằng:**
   > Nếu cùng tệp đó còn báo `checksum mismatch` thì có thể bản trên Mac mới là bản hỏng. Không so với `.sha256` trên máy chủ (máy bị nghi sửa được cả hai tệp), không đăng nhập máy chủ: kéo bản máy chủ của đúng tệp bị báo bằng khóa kéo chỉ đọc vào một thư mục mới, trống, ngoài thư mục sao lưu (lệnh dưới), tính băm trên Mac, so với `.sha256` **trên Mac**. Kết luận theo runbook sự cố dữ liệu khách mục 5 bước 3. Để nguyên thư mục tạm cho SEC, không chép vào thư mục sao lưu.
2. **Thêm** dòng lệnh cho bước kéo (OPS soạn), với các ràng buộc:
   - cùng khóa, cùng `known_hosts`, cùng lệnh `rsync` của script, chỉ `--include` đúng tên tệp bị báo (cả `.age` lẫn `.age.sha256` nếu cả hai bị báo), `--exclude '*'`;
   - thư mục đích tạo bằng `mktemp -d`, nằm ngoài thư mục sao lưu;
   - **chỉ in** mã thoát của `rsync` và 8 ký tự đầu của: băm tệp vừa kéo, nội dung `.sha256` ngoài máy, (nếu có) `.sha256` vừa kéo. Không in IP, không in đường dẫn có tên người;
   - tên máy dùng tên trong `~/.ssh/config`, không gõ IP vào lệnh (như `runbook-vps-moi.md` mục 1.0).
3. **Thêm** cách xử lý mã 1:
   > Mã 1 (checksum cục bộ sai): không xóa tệp. Chuyển tệp hỏng và `.sha256` của nó vào thư mục con `quarantine/` (cùng thư mục sao lưu, script không đụng tới), rồi kéo lại: lượt kéo lấy bản máy chủ cho tên đó và kiểm băm. SEC quyết khi xóa `quarantine/` (SR-BAK-03). Mã 1 cùng lúc với mã 3: làm theo runbook sự cố dữ liệu khách mục 5 trước, không kéo lại.
4. **Thêm** sau "rồi thoát 3 → …": "Không chạy lại script, kể cả lịch tự động, tới khi SEC báo: mỗi lượt kéo thêm từ máy chủ và xóa bản trên Mac quá 35 ngày (runbook sự cố dữ liệu khách mục 5 bước 2)."
5. Khi chuyển sang Google Drive công ty: giữ cả bốn ý, đổi "trên Mac" thành nơi mới, **chỉ khi** máy chủ không ghi đè, không xóa được bản đã có ở đó (SEC kiểm ở PR Drive).

### 8.4 Tờ 1 (PO `a38bfcdc`) so với runbook

Dòng "Gửi nhầm người" (`product/docs/staff-one-pager.md` dòng 50) **khớp** runbook 1.1 và 1.2 ở mọi việc của quầy: **Thu hồi link** ngay, tạo link mới; sổ giao ca có mã đơn, ngày giờ gửi, **tin kèm gì** (chỉ loại), giờ thu hồi, kênh; không ghi tên khách, tên hay số người nhận nhầm; không chụp hội thoại; nhắn thẳng chủ đầu tư đúng dòng đó trong ngày; ghi lạ thì không dùng giấy tờ, gọi ngay. Bản 1.2 không đổi việc nào của quầy ngoài BA-01.
- Tờ 1 không có ba ô "đã tạo link mới, ghi lạ, ảnh đã xóa" của mẫu mục 6: SEC chấp nhận, vì Tờ 1 giới hạn chữ (plan R5 quyết định 21), ba ô đó không đổi mức sự cố, và 17.3 bước 5 có đủ mẫu (BA S6).
- **Còn một việc cho PO (BA-01):** thay vế "tạo link mới cho đúng khách" bằng câu ngắn DOM đã chốt (`DOM-on-ba-card-v574-01.md` mục 3). SEC đồng ý câu đó cho Tờ 1, kể cả khi phải bỏ câu cuối "Không sửa liên hệ…" vì không vừa 8,25 pt. Tới lúc in lại, Tờ 1 bản 07/11 vẫn dùng được: chữ "cho đúng khách" không bảo quầy gửi lại vào liên hệ đã sai.

### 8.5 FB-R5-BA-SEC-V574-01 (Major) – liên hệ trên đơn sai

DOM chốt câu ở `rounds/round-05/reviews/DOM-on-ba-card-v574-01.md` (`cd7ad531`). SEC dán **nguyên văn** mục 1 vào runbook 1.2 mục 4 bước 1, thêm câu cuối gạch 2 của DOM vào bước 2, và dùng dòng mẫu mục 6 của DOM (thêm "liên hệ trên đơn sai: có/không", "link mới: đã tạo / không tạo").

SEC đọc câu DOM về bảo mật: **đồng ý**. Đây là tối thiểu dữ liệu: không gửi thêm gì tới một liên hệ đã biết là sai, kể cả tin xác nhận và nhắc giờ đến. Không sửa liên hệ theo lời người lạ cũng chặn đúng lối giả làm khách để lấy link mới.
- SEC thêm một nửa câu ở gạch 2: "Không hỏi lại người nhận để kiểm (không nêu tên, ngày ở của khách cho họ xác nhận)". Câu DOM nói người nhận "trả lời sai tên, sai ngày ở": SEC muốn chắc quầy không đọc tên hay ngày ở cho người nhận để hỏi "có đúng anh/chị không". DOM, BA chép cùng ý khi chép 17.3 nếu đồng ý; không cần cho Tờ 1.
- Mức sự cố không đổi: "liên hệ trên đơn sai" không tự làm mức cao hơn. Ô đó cho SEC biết có cần kiểm thêm các tin đã gửi trước tới liên hệ sai (xác nhận, nhắc giờ) hay không: nếu có, SEC tính các tin đó vào "tin kèm gì".

Việc còn lại: BA chép `DOM-on-ba-card-v574-01.md` mục 2 sang `guides/02` 17.3 bước 5 (và sổ tay 2.9 bước 6); PO sửa Tờ 1 theo mục 3 của DOM.

### 8.6 Câu hỏi UXD: Wi-Fi trùng mật khẩu đăng nhập Desk

**Có, nên nhắc**, một câu, chỉ trong thông báo lỗi 422 `NOT_ALLOWED` của SR-RL-15 (khi phép so thật sự chạy và trùng). Lý do: mật khẩu Wi-Fi được đưa cho khách (thẻ phòng, tin chào, trang khách). Nếu bộ phát **đã** dùng mật khẩu đó, thì mật khẩu Desk của người này coi như đã lộ, dù Desk từ chối lưu.
- Ý của câu (UXD viết chữ, theo giọng OTTIMO): mật khẩu này đang là mật khẩu đăng nhập Desk của bạn, chọn mật khẩu Wi-Fi khác; nếu bộ phát đang dùng mật khẩu này, đổi mật khẩu Desk ngay, rồi đổi cả mật khẩu bộ phát. Có nút hoặc chỉ đường tới **Đổi mật khẩu** (A112, mọi vai).
- Không lặp lại mật khẩu, không che một phần. Không nói gì về tài khoản khác (phép so chỉ so với mật khẩu của chính người gọi).
- Không hiện câu nhắc khi phép so bị bỏ qua (quá 5 lần/24 giờ): lúc đó Desk không biết có trùng hay không.
- Không bắt buộc đổi, không khóa tài khoản (SR-RL-15 không cộng vào `login_lockout`).

### 8.7 Dòng decision-log (ORC chép)

`| 2026-11-07 | 5 | **SEC – Phản hồi & sửa V5-74: runbook sự cố dữ liệu khách bản 1.2** theo OPS (V574-01 Major, 02–05) và BA (V574-01 Major theo câu DOM DOM-on-ba-card-v574-01.md nguyên văn, 02–05, 07, 08). Nhánh A: nhầm do người gửi thì tạo link mới tới liên hệ trên đơn; liên hệ trên đơn sai hoặc không chắc thì không tạo link mới, không nhắn thêm, khách làm giấy tờ tại quầy, không sửa liên hệ theo lời người khác; SEC thêm "không hỏi lại người nhận để kiểm". Nhánh B: băm tin được là .sha256 ngoài máy, không phải trên máy chủ; lấy bản máy chủ của tệp bị báo bằng khóa kéo chỉ đọc vào thư mục tạm, không đăng nhập; ba ca kết luận; không chạy lại script, tắt lịch; tệp hỏng vào quarantine/; .last_pull không cho biết lúc bị vào. Viết theo "bản ngoài máy" để dùng được khi sao lưu chuyển lên Google Drive công ty, với điều kiện máy chủ không ghi đè, không xóa được bản ở đó (SEC kiểm ở PR Drive). Khoanh vùng tách theo người làm (A100, A110, A115 chỉ OWN); một câu "OWN quyết; SEC đề xuất; luật sư xác nhận"; quầy dùng 02 17.3 và Tờ 1. SEC quyết: đếm lượt mở link đã thu hồi không đếm số ip_hmac khác nhau ở lượt đầu. Chữ README infra/server cho OPS: SEC-responses mục 8.3. Tờ 1 (a38bfcdc) khớp | SEC | rounds/round-05/responses/SEC-responses.md mục 8 |`

`| 2026-11-07 | 5 | [GIẢ ĐỊNH – chờ INV xác nhận] Mặc định pháp lý tạm của runbook sự cố dữ liệu khách (SR-INC-01) tới khi luật sư trả lời Q12 (ESC-001): đồng hồ 72 giờ tính từ giờ xảy ra nếu biết, không thì giờ phát hiện; quyết có báo chậm nhất giờ thứ 48; mức Vừa hỏi luật sư mỗi ca, luật sư chưa trả lời tới giờ 48 thì làm như mức Cao (soạn bản báo, OWN quyết gửi trước giờ 72); mức Cao mặc định chuẩn bị báo; OWN chưa trả lời thì ORC nhắc ở giờ 24 và 48, đội không gửi thay | SEC đề xuất, INV xác nhận | runbook-su-co-du-lieu-khach.md mục 2, 3; BA FB-R5-BA-SEC-V574-04, 08 |`
