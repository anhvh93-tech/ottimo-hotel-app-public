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
