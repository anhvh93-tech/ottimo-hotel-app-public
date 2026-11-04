# SEC review mã P4-05 + P4-06 (email, định danh) và CODEOWNERS của P4-03

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (sớm, trước khi mở PR-D) | 04/11/2026
- Đối tượng:
  - `origin/v104/be-identity` @ **`7d2b14ba`**. Head này gộp INT `origin/v104/int-email` @ `51991057` (merge `ac743ab5`). Commit `7d2b14ba` làm INT-BE-31-04 phần API. Mã INT trên head này **giống hệt** `51991057` (không có diff ở `product/integrations/**`);
  - `origin/v104/ops-scripts` @ `b8f75eeb`: chỉ `.github/CODEOWNERS` và `.github/pull_request_template.md`, theo yêu cầu của ORC. Phần `requeue-email-changed.sh` chỉ đọc để đối chiếu với lệnh `known-email-templates-cli`.
- Căn cứ:
  - `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 2 (M18-08) và mục 5 (SENT-02);
  - `rounds/round-04/plan-v1.0.4.md` P4-03, P4-05, P4-06;
  - backlog 5.6 (EM-09, INT-BE-31-04, G-BE-4, PR32-06, SEC-BE-018-01…04, ARC-BE-31-04, V3-04);
  - `SEC-on-v1.0.3-contract-email.md` thẻ EM-09.
- Đã đọc báo cáo:
  - `rounds/round-04/outputs/INT/v1.0.4-int-email.md`;
  - `rounds/round-04/outputs/BE/v104-be-identity.md`;
  - `rounds/round-04/outputs/OPS/v1.0.4-ops-scripts.md`.
- Phạm vi đọc: toàn bộ diff mã (không phải test) của hai nhánh so với `main` (`c6cd32a8`), cùng tên ca test mới. **Không** tự chạy test: ORC đang chạy CI trọn trên head này.
- Không sửa tệp nào khác. Không commit. Không có địa chỉ email, tên tài khoản hay dữ liệu thật trong tệp này.

---

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.**
- **Không** có thẻ Blocker hay Major. Được mở PR-D ngay trên `7d2b14ba`.
- Điều kiện **trước khi gộp**:
  - CI trọn xanh;
  - **SEC-V104-02**: thêm test EM-09 cho hai yêu cầu song song. Đây là điều kiện để SEC ghi Verified cho EM-09.
- Điều kiện **trước khi deploy**: **SEC-V104-04** (runbook OPS).
- Các thẻ Minor khác nên làm trong PR này. Không kịp thì sang v1.0.5, **không** chặn QC v1.0.4.
- ESC mới: **không**. Mọi điểm thuộc quyền SEC (yêu cầu bảo mật kỹ thuật).
- Bổ sung (mục 6): chữ CPY mới cho chân thư ("any code") và 4 câu `receiving_account_changed` **đạt về nghĩa**. Kèm thẻ Minor **SEC-V104-08** (BE/BE-A/INT).

### 0.1 Trạng thái từng thẻ SEC/ARC trong gói

| Thẻ | Kết quả SEC | Ghi chú |
|---|---|---|
| **EM-09** (bắt buộc) | **Đạt, chờ Verified** | Đúng thứ tự RBAC → 422 → 429 → S2. Đếm theo người **được** đổi, mọi `via`. Kiểm lại trong giao dịch ghi, dưới khóa dòng `app_user` (`setOwn` `FOR UPDATE`; `UsersService.update` → `load(…, lock = true)`). `Retry-After` tính đúng. Thân 429 không có địa chỉ. Verified khi có test song song (thẻ 02). Phần meta 429 chờ P4-00 (e). Đề xuất miễn 429 cho việc **xóa** email (thẻ 01) |
| **SENT-02 + M18-01** (Minor sau ESC-049 D) | **Verified** | Danh sách cấu hình độc lập `EMAIL_FROM`, luôn gộp `EMAIL_FROM`, mặc định `info@`/`booking@` ở mọi miền thư, so sau khi bỏ `+…`. Mục sai làm API **dừng khi khởi động**, thông báo chỉ nêu vị trí. Có test "đổi `EMAIL_FROM` vẫn chặn `info@`" (3 giá trị From) và test tích hợp 9 biến thể bị 422 trước S2 |
| **M18-08** | **Verified** | Dispatcher không đổi. Có chú thích cạnh câu SQL. 2 test (a) `disabled` và (b) `locked` đúng mục 2.2 |
| **G-BE-4 / INT-BE-31-05** | **Verified** | Hai lớp độc lập: dispatcher `paramsFor()` bỏ `staffName` khỏi `self`/`previous`, và mẫu `cleanParams` cũng bỏ. Có test cả hai phía |
| **INT-BE-31-04** | **Verified** | `normalizeSecurityEmail` giờ chỉ gọi `normalizeEmailAddress`, regex riêng đã xóa (`7d2b14ba`). Có test tương đương trên VALID ∪ INVALID, test `SECURITY_EMAIL_MAX = EMAIL_ADDRESS_MAX`, và test "không còn bản sao luật". Adapter siết ASCII, **từ chối** (không cắt) khoảng trắng đầu/cuối, nên CR/LF không vào được phong bì. Điều kiện `email_ascii = 0`: xem thẻ 04 |
| **PR32-06 + ARC-BE-31-05** (Major, bắt buộc) | **Đạt** | `known-email-templates-cli`: không DB, không env, không mạng, mã thoát 0/1/2. `requeue-email-changed.sh` trên `v104/ops-scripts` gọi lệnh này, image cũ thì lùi về câu hỏi v1.0.3. Test INT khóa đường xuất. ARC xác nhận phần R9 |
| **SEC-BE-018-01** | **Verified (phần BE)** | Mảng ghim + test liệt kê mọi trường mã D của `Me` và `/v1/me*`. Phần (c) CODEOWNERS: mục 3 |
| **SEC-BE-018-02 + ARC-018-03/04** | **Verified** | Tiền tố `schema:`/`op:` có kiểu `SelfOwner`. Chỉ ghép chuỗi ở nhánh mã D đã từ chối |
| **SEC-BE-018-04** | **Verified** | `noStore()` (Cache-Control + Pragma) cho cả 3 câu trả lời C3 của 2FA |
| **SEC-ARC-018-03** (phần mã) | Chờ P4-00 (f) | Không thuộc lượt này. SEC review lại sau rebase |
| **ARC-BE-31-04** | **Verified** | `auditReason` nằm trên lỗi. `toBody()` chỉ chép trường đã liệt kê, nên không lọt ra thân, header hay log. Có test nhánh TOCTOU. Thân 403 vẫn giống nhánh khác cơ sở (EM-14 giữ) |
| **V3-04** (nếu kịp) | **Đạt có ĐK** | Dấu nhắc ẩn đúng, từ chối giá trị sau cờ, lỗi không nhắc lại địa chỉ, màn hình cuối chỉ in set/not set. Còn lọt dạng `--owner-email=<địa chỉ>` (thẻ 03). Chưa thử trên TTY thật (QA/OPS) |
| Mẫu thư (CPY-INT-05 A, CPY-INT-03) | **Đạt về bảo mật** | Không link, không mã, không địa chỉ. Mọi tham số được thoát HTML và lọc ký tự điều khiển như cũ. Chân thư chống lừa đảo xuất hiện **đúng một lần** trong mỗi thư. Phần chữ do CPY duyệt |

---

## 1. Ghi chú kỹ thuật (để ARC/QA đối chiếu)

### 1.1 EM-09
- Kiểm trước S2 (`assertChangeAllowed`) là giao dịch **chỉ đọc** riêng. Hai yêu cầu song song có thể cùng qua bước này. Bước kiểm thật là lần gọi lại trong `recordChange`, sau `SELECT … FOR UPDATE` của chính dòng `app_user`.
  - Ở READ COMMITTED, yêu cầu thứ hai chờ khóa. Sau khi yêu cầu thứ nhất commit, câu `SELECT changed_at` là câu mới nên thấy dòng `user_email_change` vừa ghi. Lập luận đúng.
  - Hệ quả: yêu cầu thứ hai đã **qua S2** rồi mới bị 429. Như vậy là một lần S2 bị tiêu mà không đổi gì. Chấp nhận, vì chỉ xảy ra khi đua, và S2 đúng thì không bị đếm là thất bại.
  - Thiếu test cho đường này (thẻ 02).
- Ở `setOwn`, `UPDATE app_user` chạy **trước** `recordChange`. Nếu 429 ném ra thì cả giao dịch lùi, không ghi gì. Đúng, nhưng thứ tự này phụ thuộc vào việc UoW lùi giao dịch khi có lỗi. Test 429 "nothing written" đã khóa điều này.
- G-BE-A-104-3 (lần bị 429 không ghi audit): **chấp nhận**. `ops-check email_changes` đã đếm số lần đổi thành công. Lần bị chặn không tạo thư nào.

### 1.2 Hộp thư chung
- G-BE-A-104-1 (mặc định khi chưa cấu hình): **chấp nhận** làm lưới an toàn. Production vẫn phải đặt `EMAIL_SHARED_MAILBOXES` (thẻ 04).
- G-BE-A-104-2 (không bỏ dấu chấm ở phần tên): **chấp nhận**. Google Workspace không coi dấu chấm là bí danh.
- Danh sách có địa chỉ miền thư công cộng thì luật mặc định sẽ chặn thêm `info@`/`booking@` của miền đó. Vô hại: các hộp đó cũng không phải của một người.

### 1.3 Luật địa chỉ một nguồn
- Luật INT giống từng chữ luật v1.0.3, nên mọi địa chỉ đã lưu vẫn hợp lệ. `ops-check email_ascii` là bản SQL của cùng luật, và INT đã ghi "đổi cả hai cùng lúc".
- Adapter bây giờ chặt hơn ở cả `EMAIL_FROM` và `EMAIL_SMTP_USER`. Hai giá trị này không đạt luật thì worker **không khởi động**, và thư bảo mật ngừng gửi. Vì vậy cần thêm bước kiểm trước deploy (thẻ 04).
- `mail-test.mjs` (P4-03) cắt `\r\n` và khoảng trắng của dòng stdin **trước khi** gọi `isEmailAddress`. Khớp với luật mới.

### 1.4 `production-bootstrap --owner-email`
- Đọc địa chỉ ở raw mode. Ctrl-C hủy, Backspace sửa, ký tự điều khiển bị bỏ. Sau đó chạy cùng luật địa chỉ và luật hộp thư chung với `setMyEmail`, **trước** mọi lần ghi.
- Địa chỉ vào thẳng `app_user.email`, không có dòng `user_email_change` và không có thư. Đúng: người dùng chưa tồn tại trước đó, không có "địa chỉ cũ" cần báo.

---

## 2. Thẻ feedback (theo mức độ)

### Blocker
Không có.

### Major
Không có.

### Minor

#### FB-R4-SEC-BE-V104-01: EM-09 không được chặn việc **xóa** email
- Mức độ: Minor
- Người làm: **BE-A** (mã + test); **ARC** (một câu trong mô tả 429 của P4-00 (e))
- Vị trí: `security-email.service.ts`, `assertChangeAllowed` và `recordChange` → `assertWithinLimit`.
- Vấn đề: lần đổi thứ 6 trong 24 giờ bị 429 cho **mọi** giá trị, kể cả `email = null`. Kẻ chiếm được mật khẩu + S2 của một nhân viên có thể đổi 5 lần sang địa chỉ của mình. Sau đó OWN không xóa được địa chỉ đó trong tối đa 24 giờ. Đây cũng là bước 2 của sổ tay M18-08 ("Khóa rồi Xóa email").
- Vì sao quan trọng: **Khóa tài khoản** (`disabled`) đã chặn bản `self`, nên đây không phải lỗ hổng gửi thư. Nhưng địa chỉ lạ vẫn nằm trên hồ sơ, và nếu OWN mở khóa lại trước khi xóa được thì bản `self` lại đi tới địa chỉ đó.
- Đề xuất sửa:
  - giá trị mới là `null` thì **không** áp 429, ở cả `setMyEmail` và `updateUser`;
  - lần xóa **vẫn ghi** `user_email_change` và vẫn được đếm.
  - Lý do an toàn: lần xóa không gửi thư tới địa chỉ mới nào. Mỗi lần xóa chỉ có một bản `previous` (tới địa chỉ vừa bị thay, mà địa chỉ đó đã bị giới hạn khi đặt) và bản `owner`. Số lần xóa có thật luôn ≤ số lần đặt + 1.
  - Test: ở mức 5, `PATCH email: null` → 200, có dòng `user_email_change`; lần đặt kế tiếp → 429.
- Trạng thái: Open. Nên làm trong PR-D. Không kịp thì v1.0.5, ghi vào rủi ro còn lại.

#### FB-R4-SEC-BE-V104-02: thiếu test EM-09 cho hai yêu cầu song song
- Mức độ: Minor (**điều kiện để SEC Verified EM-09**)
- Người làm: **BE-A**; QA xem
- Vị trí: `test/integration/v104-be-identity.test.ts` (5 ca EM-09 đều tuần tự).
- Vấn đề: báo cáo BE-A khẳng định "2 yêu cầu song song không cùng lọt ở mức 4". Mã đúng như vậy (mục 1.1), nhưng chưa có test giữ hành vi này. Sau này ai bỏ `FOR UPDATE` hay chuyển kiểm sang ngoài giao dịch thì không có test nào đỏ.
- Đề xuất sửa: người dùng đang có 4 lần đổi. Gửi song song 2 `setMyEmail` (hoặc 1 `setMyEmail` + 1 `updateUser`) tới 2 địa chỉ khác nhau, có S2 đúng. Kỳ vọng: đúng một 200 và một 429, và có đúng 5 dòng `user_email_change`.
- Trạng thái: Open. **Trước khi gộp PR-D.**

#### FB-R4-SEC-BE-V104-03: `--owner-email=<địa chỉ>` bị bỏ qua mà không báo
- Mức độ: Minor
- Người làm: **BE-A**
- Vị trí: `production-bootstrap-cli.ts`, `ownerEmailFlag()`.
- Vấn đề: hàm chỉ tìm đúng chuỗi `--owner-email`. Nếu OPS gõ `--owner-email=<địa chỉ>` theo thói quen thì cờ không được nhận, lệnh chạy tiếp không có email. Địa chỉ đã nằm trong lịch sử shell và `ps` mà không ai được báo.
- Vì sao quan trọng: mục đích của V3-04 là địa chỉ không bao giờ nằm trên dòng lệnh. Lệnh phải từ chối to để người gõ biết mà xóa lịch sử.
- Đề xuất sửa: mọi đối số bắt đầu bằng `--owner-email=` → từ chối (exit 2), thông báo không nhắc lại giá trị. Thêm một ca vào unit V3-04. README OPS (V3-04) ghi: "Không gõ địa chỉ trên dòng lệnh. Lỡ gõ thì xóa dòng đó khỏi lịch sử shell."
- Trạng thái: Open. Nên làm trong PR-D.

#### FB-R4-SEC-OPS-V104-04: bước kiểm trước deploy cho luật địa chỉ mới và hộp thư chung
- Mức độ: Minor (**trước deploy staging và production v1.0.4**)
- Người làm: **OPS** (runbook v1.0.4, P4-04; `docker-compose.prod.yml`, `env.production.example`, `product/.env.example` sau `main@L`)
- Vị trí: runbook v1.0.4. G-INT-104-2. BE-A báo cáo mục 5.
- Vấn đề: adapter chỉ được siết khi `email_ascii = 0` (điều kiện INT tự đặt từ v1.0.3). Ngoài ra `EMAIL_FROM` và `EMAIL_SMTP_USER` giờ phải đạt luật mới, nếu không thì worker không khởi động. `EMAIL_SHARED_MAILBOXES` cũng chưa có trong cấu hình triển khai.
- Đề xuất sửa (runbook, trước bước deploy):
  1. `ops-check.sh email_ascii` trên staging và production: phải bằng `0`. Khác 0 thì dừng, báo INT. Lùi luật adapter chỉ cần đổi một dòng.
  2. Sau deploy staging: worker khởi động sạch (không có lỗi `CONFIG` về `EMAIL_FROM`/`EMAIL_SMTP_USER`). Chạy `mail-test.sh --verify-only`.
  3. Thêm `EMAIL_SHARED_MAILBOXES` vào `*api-env`. Trong repo chỉ có giá trị mẫu `…@example.test`. Giá trị thật OPS điền trên máy, không commit. Gate kiểm "API không in dòng `warn` `EMAIL_SHARED_MAILBOXES unset`" sau khi lên production.
  4. README 13.8 ghi điều kiện treo của SENT-02 (SEC-on-plan-v1.0.4 mục 5).
- Trạng thái: Open.

#### FB-R4-SEC-OPS-V104-05: CODEOWNERS chỉ là chỉ dẫn, cần mở rộng đường dẫn và ghi rõ cách ORC kiểm
- Mức độ: Minor
- Người làm: **OPS** (sửa `.github/CODEOWNERS`, ô mẫu PR); **ORC** (cách kiểm khi gộp, ghi decision-log)
- Vị trí: `.github/CODEOWNERS`, `.github/pull_request_template.md` trên `v104/ops-scripts` @ `b8f75eeb`; OPS G2.
- Đánh giá: xem mục 3.
- Đề xuất sửa: theo 3 điều kiện ở mục 3.
- Trạng thái: Open. Không chặn PR-D.

### Info (không bắt buộc)

#### FB-R4-SEC-BE-V104-06: audit `production.bootstrapped` ghi có/không có email
- Người làm: BE-A (tùy chọn, v1.0.5 cũng được)
- Thêm `ownerEmailSet: true|false` (boolean, không có địa chỉ hay bản che) vào dòng audit hiện có. Để biết sau này email của OWN đầu tiên có từ lúc khởi tạo, chứ không từ `setMyEmail`. Không đổi gì về bảo mật.

#### FB-R4-SEC-BE-V104-07: dòng `warn` ở `main.ts` dùng `console.log`
- Người làm: BE-A (khi làm PR24PM-04)
- Dòng này không chứa địa chỉ nên không có rủi ro dữ liệu. Nếu PR24PM-04 mở rộng ESLint `no-console` ra `main.ts` thì đổi sang `logLine`, giữ đúng chữ.

---

## 3. CODEOWNERS và cách buộc có review SEC

**Câu hỏi của ORC:** ô đánh dấu trong mẫu PR + ORC kiểm `reviews/` trước khi gộp, có đủ để buộc có review SEC không?

**Trả lời: chấp nhận làm biện pháp hiện tại, có 3 điều kiện.**

- Đồng ý với OPS G2: repo chỉ có một tài khoản GitHub, nên "Require review from Code Owners" sẽ khóa chính chủ repo, vì GitHub không cho tự duyệt PR của mình. Không đề xuất bật.
- Vì vậy CODEOWNERS ở đây **chỉ là chỉ dẫn**, không chặn được gì. Lớp chặn thật nằm ở hai chỗ:
  - (a) test ghim `PINNED_SELF_DATA_FIELDS` (018-01): mọi đổi `SELF_DATA_FIELDS` đều làm test đỏ, trừ khi sửa cả test;
  - (b) bước ORC kiểm trước khi gộp.
- Ô đánh dấu là người viết PR tự khai. Bản thân nó không phải bằng chứng.

**Điều kiện:**
1. **Mở rộng đường dẫn SEC** trong `.github/CODEOWNERS` (cùng tài khoản chủ repo, ghi vai SEC ở chú thích), vì lớp chặn (a) chỉ có tác dụng khi chính tệp test cũng thuộc SEC:
   - `/product/services/api/test/serializer.test.ts` (mảng ghim 018-01);
   - `/product/services/api/src/modules/identity/public/shared-mailboxes.ts` (SENT-02);
   - `/product/integrations/notification/email-address.ts` và `/product/services/api/src/shared/email.ts` (luật địa chỉ, nửa kia là `ops-check email_ascii`);
   - `/.github/pull_request_template.md`.
   - Ô đánh dấu trong mẫu PR đổi thành "PR sửa tệp có dòng SEC trong `.github/CODEOWNERS`…" thay vì chỉ nêu `field-policy.ts`.
2. **Cách ORC kiểm phải cụ thể và có dấu vết.** Trước khi gộp, ORC chạy `git diff --name-only <base>...<head>` và so với các dòng SEC trong CODEOWNERS. Có trùng thì phải có `rounds/<round>/reviews/SEC-on-*.md` thỏa cả 3 ý:
   - nêu **commit head** đã review (hoặc head sau đó chỉ khác ở tệp không thuộc SEC);
   - kết luận ĐẠT / ĐẠT CÓ ĐK;
   - Blocker/Major đã đóng.
   - ORC ghi một dòng decision-log cho quy tắc này. Thông điệp commit gộp nêu tên tệp review.
3. **Nếu repo sau này có tài khoản thứ hai** (máy CI, người vận hành) thì xem lại việc bật "Require review from Code Owners". Đến lúc đó ô đánh dấu chỉ còn là lớp phụ.

Ghi chú: mẫu PR có ô "không dữ liệu khách, email thật…" và ô che ảnh (G4). Hai ô này đúng ý SEC-OPS-01 và SEC-ORC-01. Không có góp ý thêm.

---

## 4. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – review mã P4-05 + P4-06 (be-identity @ 7d2b14ba, gồm int-email @ 51991057) và CODEOWNERS P4-03** (rounds/round-04/reviews/SEC-on-v104-email-identity.md): ĐẠT CÓ ĐK, không Blocker/Major. Verified: SENT-02/M18-01, M18-08, G-BE-4, INT-BE-31-04, 018-01 (BE), 018-02/03/04 (ARC), 018-04, ARC-BE-31-04. EM-09 đạt, Verified khi có test song song (V104-02, trước gộp). Minor: V104-01 miễn 429 khi xóa email (vẫn đếm), V104-03 từ chối --owner-email=<giá trị>, V104-04 runbook OPS (email_ascii = 0, EMAIL_FROM/SMTP_USER qua luật mới, EMAIL_SHARED_MAILBOXES chỉ giá trị mẫu trong repo), V104-05 CODEOWNERS chỉ dẫn + ORC kiểm diff ↔ dòng SEC ↔ tệp SEC-on-* nêu commit head (thêm serializer.test.ts, shared-mailboxes.ts, email-address.ts, shared/email.ts). Chữ CPY mới: chân thư "any code" ĐẠT; 4 câu receiving_account_changed ĐẠT về nghĩa (hủy lịch không bị báo là đã đổi, câu trung tính đúng mọi nhánh), V104-08: payload action set/cancel lấy đúng tham số của controller, dispatcher chỉ cho set/cancel, test đầu–cuối | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |`

---

## 5. Giả định

1. Mức cô lập giao dịch của API là READ COMMITTED (mặc định Postgres). Nếu đổi sang REPEATABLE READ thì yêu cầu thứ hai sẽ bị lỗi tuần tự hóa thay vì 429. Vẫn an toàn, nhưng test của thẻ 02 cần chấp nhận cả hai kết quả.
2. `toBody()` của `ProblemError` vẫn chỉ chép các trường đã liệt kê. Đổi sang chép cả `options` thì `auditReason` lọt ra ngoài, và test unit "không vào thân" sẽ đỏ.
3. Không tự chạy test. Kết luận dựa trên đọc mã, tên ca test và báo cáo INT/BE-A. CI trọn của ORC trên `7d2b14ba` là điều kiện gộp.
4. Phần chữ thư (chân thư mới, bố cục 5 thư) do CPY duyệt. SEC chỉ xét: không link, không mã, không địa chỉ, tham số được thoát.

---

## 6. Bổ sung: nghĩa bảo mật của chữ CPY mới (`CPY-on-v104-email-copy.md` mục 3, thẻ 01 và 03, trên `origin/main`)

ORC hỏi thêm sau mục 0–5. INT đang áp chữ này. SEC xét **nghĩa**, giọng văn do CPY quyết.
- Mã để đối chiếu: `platform.controller.ts` trên `origin/main`:
  - `setParameter` gọi `receivingAccountChanged(tx, input.effectiveFrom, 'set')`;
  - `cancelScheduledParameter` gọi `receivingAccountChanged(…, 'cancel')`;
  - payload outbox hiện chỉ có `template`, `owners`, `effectiveDate`. `action` mới chỉ nằm trong `dedupe_key`.

### 6.1 Kết luận

**ĐẠT về nghĩa.** Không câu nào nói sai sự thật ở nhánh hủy lịch. Mọi câu dự phòng đều đúng cho cả hai nhánh. Có 3 điều kiện kỹ thuật ở 6.4, gộp thành thẻ SEC-V104-08.

### 6.2 Chân thư "…never ask for your password or any code."
- **Chấp nhận** (EN và VI "…hay bất kỳ mã nào").
- Câu đúng với hệ thống hiện tại: không thư bảo mật nào hỏi mã. Câu cũng rộng hơn "sign-in codes", nên phủ cả mã khôi phục, là thứ kẻ gian hay xin nhất.
- "ask for" (hỏi xin) khác "contain" (chứa). Nếu sau này có thư **gửi** mã một lần (xác minh email chẳng hạn), câu vẫn đúng. Nhưng thư đó **không** được là "security notice" mang chân thư này, và chữ phải đọc lại cùng SEC. Ghi vào ghi chú mẫu.

### 6.3 Bốn câu của `receiving_account_changed`

| Câu | Đúng khi `set`? | Đúng khi `cancel`? | Nhận xét SEC |
|---|---|---|---|
| Tiêu đề "Security notice: receiving account update" | Có | Có | Trung tính, đúng cả hai nhánh. Cùng họ "Security notice:" với 4 mẫu kia, giúp người đọc nhận ra thư thật |
| `set`: "A new receiving bank account was set, effective from {date}." | Có | — | Nếu chủ đầu tư đặt lại **cùng** số tài khoản (chỉ sửa tên hay ngày) thì chữ "new" hơi quá. Sai theo hướng **báo động thừa**, không theo hướng trấn an sai. Chấp nhận |
| `cancel`: "The receiving bank account change scheduled for {date} was cancelled." | — | Có | Chỉ nói đúng lịch của ngày đó bị hủy. Không hứa "tài khoản không đổi", nên vẫn đúng khi còn lịch khác ở ngày khác |
| Thiếu `change`, có ngày: "…schedule for {date} was updated." | Có | Có | Hủy cũng là một lần cập nhật. Dùng được cho dòng outbox cũ và cho thứ tự deploy bất kỳ |
| Thiếu ngày: "…settings were updated." | Có | Có | Đúng mọi nhánh |
| Câu hành động "Open OTTIMO Desk as usual and check the receiving account. If you did not expect this, do it today." | Có | Có | Không link, bảo người đọc tự mở Desk. Đúng mẫu chống lừa đảo |

- Không câu nào nêu số tài khoản, tên ngân hàng hay người thực hiện (Q51-6 giữ).
- Bản VI tương ứng từng câu, không thêm ý.

Điểm SEC quan tâm nhất: thư hủy **không** được trông giống thư đặt lịch, và ngược lại. Ở chữ cũ, chủ đầu tư hủy một lịch lạ sẽ nhận "was changed", nghĩa là được báo sai rằng việc hủy không có tác dụng. Chữ mới tách hẳn hai nhánh. Khi không biết nhánh thì dùng câu trung tính, không chọn bừa một bên.

### 6.4 Điều kiện kỹ thuật (thẻ FB-R4-SEC-BE-V104-08)
- Mức độ: Minor
- Người làm: **BE** (người ORC giao cho `platform.controller.ts`, giai đoạn B), **BE-A** (`email-dispatch.ts`), **INT** (mẫu + test)
- Đề xuất:
  1. **Một nguồn sự thật cho nhánh:** payload outbox thêm `action: 'set' | 'cancel'`, lấy **đúng** tham số `action` đang truyền vào `receivingAccountChanged`, không suy ra từ chỗ khác. Dispatcher chỉ cho qua `set`/`cancel` thành tham số `change`, giá trị khác thì bỏ (ra câu trung tính).
  2. **Test đầu–cuối** (API → outbox → dispatcher → bản dựng): `setParameter` ra câu `set`, `cancelScheduledParameter` ra câu `cancel` và **không** chứa "new"/"effective"/"mới"/"có hiệu lực". Dòng outbox không có `action` (bản cũ) ra câu trung tính.
  3. Ngày trong thư hủy là `effectiveFrom` của **chính lịch bị hủy**. Mã hiện tại đã đúng (lấy `input.effectiveFrom`, cùng giá trị dùng để hủy). Test giữ điều này.
- Quay lui: worker v1.0.3 bỏ qua tham số lạ (`change`), nên vẫn ra câu cũ. Quay lui là trạng thái tạm, SEC chấp nhận. Không ảnh hưởng thứ tự deploy worker → api (OPS-ARC-31-01).
- BE không kịp v1.0.4 thì INT vẫn ra mẫu mới, và thư luôn dùng câu trung tính có ngày. Như vậy **đạt** về nghĩa (đúng như CPY thẻ 01 nói), chỉ kém cụ thể.
