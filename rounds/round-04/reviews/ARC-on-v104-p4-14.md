# ARC review mã – P4-14 `v104/be-sensitive` (BE-D, PR-J), giai đoạn A

- Round 4 (v1.0.4), bước **Review chéo** (ma trận BE → ARC), 04/11/2026
- Đối tượng: `origin/v104/be-sensitive` @ `a7b0eff6` (2 commit trên nền `c6cd32a8`), so với `origin/main` @ `7b5b6117`.
- Căn cứ: `plan-v1.0.4.md` dòng P4-14 và mục 2.4 (ngoại lệ `website-request-rules.ts`); `ARC-on-PR24-post-merge.md` thẻ PR24PM-01…04; `v1.0.4-contract-0.3.12.md` 2.5a và (i); `SEC-on-v104-be-d.md` mục 2 (BED-04, BED-05); báo cáo `rounds/round-04/outputs/BE/v1.0.4-be-d-sensitive.md`.
- Không sửa mã.

## Phán quyết: **ĐẠT** cho giai đoạn A (PR24PM-02, 03, 04 + BED-04, BED-05)

Giai đoạn B (PR24PM-01) **chưa có trên nhánh**. Đây không phải lỗi của mã đã nộp, nhưng plan tính nó vào P4-14 → thẻ P414-01 để ORC chốt. Không có Blocker/Major.

## 1. Cách kiểm
- Đọc toàn bộ diff: `sensitive-number.ts`, `shared/log-line.ts`, `worker.ts`, `eslint.config.js` và hai tệp test.
- Cây gộp thử (scratch) `main` + P4-10 + P4-11 + P4-12 + P4-14:
  - `eslint services/api` **0 lỗi**. Luật `no-console` mới cho `src/worker*.ts` và `src/jobs/**` cũng sạch trên mã LP-v2 và P4-10 đã gộp. Nhánh cắt từ `c6cd32a8` (trước `main@L`), nên đây là điểm cần kiểm;
  - `tsc` đạt;
  - `text-safety-units`, `v104-log-line` xanh (trong bộ 468/468; toàn bộ `@ottimo/api` trên cây gộp 4012 đạt, 0 lỗi).
- `git merge-tree` với `main`: sạch.

## 2. Đúng thẻ và quyết định

| Thẻ | Mã | Kết quả |
|---|---|---|
| PR24PM-02 (ARC 2.5a: chấp nhận bản BE-D) | `PAIR_CHAIN` = ≥ 4 nhóm đúng hai chữ số nối cùng **một** dấu `.`/`-`/`/` (tham chiếu ngược `\1`), có neo `(?<!\d)`/`(?!\d)`. `blankDates` chỉ giữ cụm ngày **chồng lên** một chuỗi cặp, mọi cụm ngày khác vẫn xóa như cũ | Đúng. Regex không lồng lượng từ nên tuyến tính; test "cost" có thêm chuỗi |
| BED-04 (lọt có chủ ý) | `it.each('accepted miss, not blocked: …')` có chú thích dẫn SEC | Đúng |
| PR24PM-03 | `logLine` bọc `try/catch` cả bước chép `extra` (getter ném lỗi). Lỗi thì bỏ **mọi** trường phụ, ghi `logError: "UNSERIALIZABLE"`. `level`/`msg` vẫn ghi đè sau cùng, vẫn bỏ `toJSON` | Đúng |
| PR24PM-04 | ESLint `no-console: error` cho `services/api/src/worker*.ts`, `src/jobs/**/*.ts` (trừ `*.test.ts`). `errorTag`, `writeLogLine`, `writeErrorLine` dời về `shared/log-line.ts`. `main().catch` ghi một dòng JSON, chỉ tên + mã | Đúng. Có test bằng `lintText` thật |
| BED-05 | `job failed` = `{ job, ...errorTag(err) }`, SQLSTATE giữ ở `code`, không `err.message` | Đúng. Có test với thông báo lỗi giả chứa giá trị |
| Ranh giới tệp (plan 2.4) | Không đụng `website-request-rules.ts`, `translate.test.ts`, `bug-r4-009-plurals.test.ts` | Đúng |

**Kiến trúc:** `shared/log-line.ts` là chỗ duy nhất được phép `console` trong đường worker. ESLint chặn bằng luật, không dựa vào việc người viết nhớ. Đúng tinh thần PR24PM-04. Không có thay đổi hợp đồng, migration, RBAC hay idempotency trong giai đoạn A.

## 3. Thẻ

### FB-R4-ARC-BE-D-P414-01
- Mức độ: Minor
- Vị trí: plan P4-14, giai đoạn B; `public-site/internal/sensitive-number.ts` → `src/shared/sensitive-number.ts`; `shared/validation.ts` `containsCardNumber`; 1 dòng import ở `website-request-rules.ts`
- Vấn đề: PR24PM-01 (thẻ ARC Minor) chưa làm. Toàn hệ thống vẫn có **hai luật V-09**: bộ dò mới chỉ ở `public-site`, còn `guest-portal`, `registration`, `reservations/inputs`, `refunds`, `receiving-account` vẫn dùng luật cũ. Điều chờ đã xong: `main@L` gộp ở `7224e8fd`, 0.3.12 (i) đã ghi `ID_NUMBER_DETECTED` với điều kiện "bật cùng tag guest-web".
- Vì sao quan trọng: chữ khách gõ ở cổng khách vẫn qua luật không đọc chữ số chen ZWSP hay chữ số toàn chiều rộng.
- Đề xuất: ORC chọn một trong hai, ghi decision-log:
  - **(A, ARC đề xuất)** BE-D làm PR24PM-01 **lõi** ngay trên nhánh này trước khi mở PR-J (06/11 sáng): chuyển tệp sang `shared/`, sửa đúng 1 dòng import, `containsCardNumber` = nửa thẻ của bộ dò mới **OR** luật cũ, test kiến trúc "ngoài `shared/` không tự viết Luhn". Khoảng 3 giờ. Phần `guest-portal` (`ID_NUMBER_DETECTED` cho `note`/`arrivalNote`) chỉ vào khi SEC duyệt **và** guest-web có câu báo vi/en/ru cùng tag; không thì để v1.0.5, máy chủ chưa trả mã này. Hợp đồng không phải sửa trong cả hai trường hợp;
  - **(B)** gộp PR-J chỉ với giai đoạn A, đưa PR24PM-01 sang v1.0.5 và ghi vào danh sách rủi ro còn lại.
- Trạng thái: Open

### FB-R4-ARC-BE-D-P414-02
- Mức độ: Suggestion
- Vị trí: `test/v104-log-line.test.ts` ca BED-05 (`expect(worker).toMatch(/log\('error', 'job failed', \{ job: key, \.\.\.errorTag\(err\) \}\)/)`)
- Vấn đề: test khớp **nguyên văn mã nguồn** của `worker.ts`. Prettier đổi xuống dòng hay đổi tên biến `key` là test đỏ, dù hành vi không đổi. Ý `not.toMatch(/\.message\b/)` thì có giá trị và nên giữ.
- Đề xuất: giữ kiểm `.message`, bỏ kiểm nguyên văn, hoặc nới thành `/'job failed',\s*\{[^}]*\.\.\.errorTag\(err\)/`. Không chặn.
- Trạng thái: Open

## 4. Điểm làm tốt
- Sửa PR24PM-02 đúng chỗ, hẹp (một regex, một hàm). Ghi rõ vì sao không theo đề xuất ban đầu của ARC, và giữ được ca "không được che" (SĐT Nga).
- `logLine` lỗi thì bỏ hết trường phụ, không in dở dang. Đây là cách an toàn nhất cho dòng log.
- Đổi lời nói "không `console` trong worker" thành luật ESLint có test.

## Xác nhận P414-01 (04/11)

- Đối tượng: `origin/v104/be-sensitive` @ `cb366588`, rebase lên `main` @ `4e94fbcc`. Commit giai đoạn B: `cb366588`. Bảng trả lời: `rounds/round-04/responses/BE-D-P4-14.md`.
- **Phạm vi đúng phương án A** (ORC chọn):

| Ý của phương án A | Mã trên `cb366588` | Kết quả |
|---|---|---|
| Chuyển `sensitive-number.ts` sang `src/shared/` | `git mv` (95 % giống), tệp thuần hàm, chỉ nhập `./redact`. Bản `luhn` riêng bỏ, dùng `luhnValid` của `shared/redact.ts` | Đúng |
| Sửa đúng 1 dòng import ở `website-request-rules.ts` (ngoại lệ plan 2.4) | 1 dòng `from '../../../shared/sensitive-number'` | Đúng |
| `containsCardNumber` = nửa thẻ của bộ dò mới **OR** luật cũ | `containsCardNumberOriginalRule(text) \|\| looksLikeCard(text)`. Mã lỗi `CARD_NUMBER_DETECTED` không đổi. **Không** áp nửa giấy tờ. Có ca chứng minh cần cả hai vế (`4111 1111 11-11 1111` / ZWSP) | Đúng |
| Test kiến trúc "ngoài `shared/` không tự viết Luhn" | `v104-card-rule-shared.test.ts`: quét `src/`, dấu hiệu dò bắt được bản thật trong `shared/`, ngoài `shared/` 0 tệp | Đúng |
| `guest-portal` `ID_NUMBER_DETECTED` chỉ khi SEC duyệt và guest-web cùng tag | **Không làm**, máy chủ chưa trả mã này. Hợp đồng 0.3.12 (i) đã ghi điều kiện bật, không phải sửa | Đúng |
| Không đổi tệp cấm (`translate.test.ts`, `bug-r4-009-plurals.test.ts`) | Không đụng | Đúng |

- ARC chạy lại trên `cb366588`:
  - `tsc` (api) đạt, `eslint services/api` 0 lỗi;
  - toàn bộ `@ottimo/api` trên PostgreSQL 17 riêng: **156 tệp đạt, 2 bỏ qua; 3943 ca đạt, 24 bỏ qua, 0 lỗi**;
  - thử thêm 10 câu ghi chú thật của quầy (số tiền có dấu phẩy/chấm/cách, danh sách phòng, danh sách đêm, số hợp đồng, số tài khoản 13 số): `containsCardNumber` = `false` cả 10. Luật mới không chặn nhầm câu tiền thường gặp.
- P414-02: ca BED-05 nay khớp `/'job failed',\s*\{[^}]*\.\.\.errorTag\(\w+\)/`, vẫn giữ `not.toMatch(/\.message\b/)`. **Closed.**
- Rủi ro BE-D nêu ở mục 4 ý 1 (ô chữ tự do ở các module khác có thể 422 nhiều hơn một chút) là đúng hướng an toàn. ARC đồng ý để QA chạy lại TC-V104-SN-04/05. Mục 4 ý 2: vòng Luhn ở `apps/guest-web`, `integrations/common` nằm ngoài phạm vi thẻ (thẻ chỉ nói API). Ghi làm việc v1.0.5 nếu muốn gom một chỗ; không chặn.

**Phán quyết P4-14 trên `cb366588`: ĐẠT** (giai đoạn A + B lõi). FB-R4-ARC-BE-D-P414-01 và P414-02 **Closed**. Phần `guest-portal` để theo điều kiện SEC/guest-web hoặc v1.0.5.
