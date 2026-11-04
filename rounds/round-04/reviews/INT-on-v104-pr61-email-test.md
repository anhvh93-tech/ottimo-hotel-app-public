# INT review – PR #61, tệp `email-address.test.ts` (BUG-R4-031)

- Người review: INT (chủ tệp test) | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Đối tượng: `v104/ci-turbo-inputs` @ `d0b8fd58`. Đọc bằng `git diff origin/main...origin/v104/ci-turbo-inputs -- product/integrations`.
- Phạm vi: chỉ `product/integrations/notification/email-address.test.ts`, đối chiếu với `infra/server/bin/ops-check.sh` và `integrations/notification/email-address.ts` ở cùng commit. Phần `turbo.json` và BOOTSTRAP env thuộc OPS/ARC, chỉ đọc lướt đường dẫn.
- CI của PR lúc review: xanh hết (`format · lint · audit · test · build`, `infra scripts`, `E2E smoke`…).
- Cách chạy: chép 3 tệp của nhánh (test, `email-address.ts`, `ops-check.sh`) vào scratchpad, dùng `node_modules` của `main`, chạy `vitest run` không cache. Không sửa nhánh.

## Phán quyết: **ĐẠT**

Không có Blocker/Major. Có 1 thẻ Minor, dời được sang v1.0.5, không chặn gộp.

## 1. Test còn đúng ý định cũ không?

Ý định cũ (EM-14): luật địa chỉ email của Desk/API (`normalizeEmailAddress`) và bản SQL trong `ops-check email_ascii` phải chấp nhận và từ chối cùng một tập địa chỉ. Kể từ P4-04, bản bash `email_rule` (dùng cho `email_config`) cũng phải giống như vậy.

| Câu hỏi | Kết luận | Căn cứ |
|---|---|---|
| Lỗi BUG-R4-031 có tái hiện ở test cũ không? Đã hết ở test mới chưa? | Có, và đã hết | Test cũ (`main`) chạy với `ops-check.sh` hiện hành: **1 đỏ, 38/39**. Lý do: test bóc ra chữ `$EMAIL_RULE_RE` thay vì giá trị. Test mới: **40/40 xanh**. |
| Test có so giá trị thật của hằng không? | Có | `shellValue()` đổi `$NAME` hoặc `${NAME}` thành giá trị của dòng `NAME='…'` duy nhất ở đầu dòng. Có 0 hoặc từ 2 dòng trở lên thì đỏ. Sau đó test kiểm thêm: mẫu phải neo đủ `^…$`. |
| Bảng ca kiểm có bị đổi hay bớt không? | Không | `VALID` và `INVALID` giữ nguyên. Vòng so `sqlAccepts` với `normalizeEmailAddress` vẫn như cũ. |
| Còn xanh giả khi thiếu tệp không? | Không | Đã bỏ nhánh `catch { return; }`. `readFileSync(OPS_CHECK)` ném lỗi thì test đỏ. Ghi chú trong test cũng chỉ rõ chỗ cần sửa khi đổi đường dẫn: test và `integrations/turbo.json`. |
| Luật thật có đổi không? | Không | `git diff origin/main origin/v104/ci-turbo-inputs -- …/email-address.ts …/ops-check.sh` rỗng. |
| Lần sửa `ops-check.sh` sau có làm test chạy lại không? | Có | `integrations/turbo.json` khai `$TURBO_ROOT$/infra/server/bin/ops-check.sh` trong `test.inputs` (BUG-R4-029). Đường dẫn có thật ở `product/`. |

## 2. Ca mới có kiểm thật không? Thử đột biến bằng tay

Mỗi đột biến sửa một bản chép của `ops-check.sh`, chạy test, rồi trả về bản gốc. Lệnh chạy ở `scratchpad/int-pr61-mutate.sh`, không nằm trong repo.

| # | Đột biến trong `ops-check.sh` | Kết quả | Ca bắt được |
|---|---|---|---|
| M1 | Hằng: TLD `{2,63}` thành `{1,63}` | Đỏ 1 | SQL parity (`a@example.t`) |
| M2 | Hằng: bỏ `+` khỏi phần local | Đỏ 1 | SQL parity (`fd.le+desk@…`) |
| M3 | SQL quay về mẫu chữ, khác hằng | Đỏ 2 | SQL parity và ca mới |
| M4 | SQL `BETWEEN 3 AND 255` | Đỏ 2 | SQL parity (ca 255 ký tự) và ca mới |
| M5 | bash `-le 254` thành `-le 320` | Đỏ 1 | **ca mới** |
| M6 | bash `grep` dùng mẫu riêng `'^.+@.+$'` | Đỏ 1 | **ca mới** |
| M7 | Khai thêm dòng `EMAIL_RULE_RE='^.+$'` thứ hai | Đỏ 1 | `shellValue` (đúng 1 dòng) |
| M8 | Hằng mất `^` đầu | Đỏ 1 | Kiểm neo `^…$` |
| G1 | bash `grep -qvE` (đảo kết quả) | **Xanh** | – |
| G2 | `local EMAIL_RULE_RE=".*"` trong `email_rule` | **Xanh** | – |
| G3 | bash thêm `-e '@'` sau hằng (nới luật) | **Xanh** | – |
| G4 | heredoc SQL thành `<<'SQL'` (không thay biến) | Xanh | – (xem ghi chú) |

Kết luận: ca mới bắt đúng hai kiểu lệch hay gặp nhất, là bash tự viết mẫu riêng (M6) và đổi giới hạn độ dài (M5). Ca SQL cũ, sau khi sửa, bắt mọi lần đổi hằng (M1, M2, M7, M8). Ba đột biến còn sống (G1–G3) đều đổi **hành vi** của `email_rule` mà vẫn giữ nguyên chữ `"$EMAIL_RULE_RE"`. Xem thẻ 01.

G4 không thành thẻ. Nếu heredoc bị đặt trong nháy, Postgres nhận chữ `$EMAIL_RULE_RE`. Mẫu này không khớp địa chỉ nào, nên mọi địa chỉ đều bị đếm và `email_ascii` báo FAIL ngay lần chạy đầu. Đây là đỏ giả, ồn, không phải xanh giả.

Giới hạn 3–254: ca mới so cận dưới và cận trên của bash với SQL, và so cận trên với `EMAIL_ADDRESS_MAX`. Cận dưới 3 không so với TS vì TS không xuất hằng này. Mẫu regex đã đòi tối thiểu 6 ký tự (`a@b.co`), nên cận 3 không bao giờ là điểm chặn. Chấp nhận.

## 3. Địa chỉ email trong test

- PR thêm **0** địa chỉ: không dòng `+` nào trong diff có `@`.
- Toàn tệp: các địa chỉ hợp lệ đều ở `example.test` hoặc tên miền con của nó, trừ `a@b.co`, có từ v1.0.3. Ca này cố ý thử TLD 2 chữ và được chép từ bảng `services/api/test/be-a-v103-email-units.test.ts`. Các ca sai dạng (`a@b`, `a@localhost`, `a@-`, `example.t`, `example.123`…) không có hộp thư.
- Test chỉ gọi hàm thuần, không qua adapter SMTP, nên không có thư nào được gửi đi.
- `a@b.co` nằm ngoài phạm vi PR này. INT sẽ tự xử lý, xem mục 5.

## Thẻ feedback

### FB-R4-INT-OPS-PR61-01
- Mức độ: Minor
- Vị trí: `product/integrations/notification/email-address.test.ts`, ca `email_rule (bash, email_config) uses the same constant and the same length bounds as the SQL` (khoảng dòng 143–155)
- Vấn đề: Ca mới chỉ kiểm **chữ** trong thân `email_rule()`: có `"$EMAIL_RULE_RE"`, đúng định dạng `-ge N ] && [ … -le M`. Ca này không **chạy** hàm. Ba đột biến đổi kết quả mà giữ nguyên chữ (G1 `grep -qvE`, G2 `local EMAIL_RULE_RE=".*"`, G3 thêm `-e '@'`) vẫn cho 40/40 xanh. Khi đó `email_config` có thể nhận `EMAIL_FROM` hoặc `EMAIL_SMTP_USER` mà adapter v1.0.4 sẽ từ chối lúc khởi động.
- Vì sao quan trọng: `email_config` là bước P2c/P2d của runbook phát hành, dùng để báo trước "worker/api v1.0.4 sẽ dừng khi khởi động". Nếu bash lệch luật mà test vẫn xanh, OPS tin `.env` đã đúng, rồi worker dừng thật trên máy chủ. Khả năng xảy ra thấp, vì ba kiểu sửa trên đều hiếm, nên mức là Minor.
- Đề xuất sửa: thêm 1 ca chạy hàm thật, giữ nguyên ca chữ hiện có vì nó báo lỗi rõ hơn. Cách làm:
  1. Bóc dòng `EMAIL_RULE_RE='…'` và thân `email_rule() { … }` từ `ops-check.sh`. Không `source` cả tệp, vì tệp sẽ chạy các check.
  2. Chạy `spawnSync('bash', ['-c', def + fn + 'while IFS= read -r -d "" e; do email_rule "$e" && echo 1 || echo 0; done'])` với bảng `VALID`/`INVALID` đã `trim().toLowerCase()`, nối bằng NUL.
  3. So từng dòng với `normalizeEmailAddress(raw) !== null`.

  INT đã thử bản nháp trong scratchpad: **41/41 xanh** trên bash 3.2 (macOS) với `ops-check.sh` thật, và **bắt được G1 và G2**. Ca này cần `bash` và `grep` trên runner. CI `ubuntu-latest` đã có sẵn cả hai. Không cần gộp trước v1.0.4. Nếu OPS đồng ý, INT nhận viết ca này ở v1.0.5, vì tệp là của INT.
- Trạng thái: Open

## Ghi chú, không thành thẻ
- `shellValue()` vẫn nhận mẫu chữ ("a literal pattern is used as is"), trong khi ca mới lại bắt SQL phải dùng hằng. Hai ca như vậy không mâu thuẫn. Nếu SQL quay về mẫu chữ, ca SQL vẫn so được ngữ nghĩa, còn ca mới báo lệch cấu trúc (M3 đỏ cả hai ca). Giữ nguyên.
- Regex bóc giới hạn độ dài bash phụ thuộc đúng cách viết `"${#1}" -ge N ] && [ "${#1}" -le M`. Nếu OPS viết lại dòng này, test sẽ đỏ với thông báo rõ (`length bounds of email_rule not found`), không xanh giả. Chấp nhận.

## 4. Điểm làm tốt
- Bỏ hẳn nhánh `return` khi thiếu tệp, và ghi trong test chỗ cần sửa khi dời đường dẫn (test và `turbo.json`). Đây đúng là cách đóng lỗi xanh giả.
- `shellValue()` đòi **đúng một** dòng khai báo và mẫu phải neo `^…$`. Hai điều kiện nhỏ này bắt được M7 và M8, là những lỗi mà cách "lấy dòng đầu tiên" sẽ bỏ sót.
- Ca mới nối cận trên của bash với `EMAIL_ADDRESS_MAX` của TS, nên con số 254 nằm ở một chỗ.

## 5. Việc INT tự nhận (ngoài PR #61, không phải thẻ cho OPS)
- `notification/email-templates.test.ts` dòng 536–543 cũng có kiểu xanh giả như BUG-R4-031: `catch { return; // script gone … }` khi đọc `requeue-email-changed.sh`. Ngoài ra `if (imports.length > 0)` cho xanh khi script không còn import gì. OPS đã khai tệp này vào `turbo.json` ở PR #61, nhưng test vẫn tự bỏ qua. INT sẽ sửa ở v1.0.5, cùng lúc với thẻ 01.
- `a@b.co`: INT đề xuất đổi sang mã 2 chữ không bao giờ được cấp làm TLD (ví dụ `a@b.zz`, vùng ISO 3166 dành cho người dùng tự đặt). Phải đổi đồng thời ở bảng BE-A `be-a-v103-email-units.test.ts`. Việc này cần BE-A đồng ý, ưu tiên thấp, dời v1.0.5.
