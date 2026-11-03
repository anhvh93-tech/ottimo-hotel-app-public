# ARC duyệt PR #30 – OPS v1.0.3 PR-2: `ops-check email_missing`, `bin/mail-test.sh`, README 13.7/13.8, runbook v1.0.3 r0

- PR: anhvh93-tech/ottimo-hotel-app-public#30, nhánh `ops/v1.0.3-email-alert` @ `540411de` (một commit trên `main` @ `f11db568`).
- Người duyệt: ARC. Round 4, đợt v1.0.3, bước **Review**. Ngày 03/11/2026.
- Đối chiếu: `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` 2.4, 2.9, 2.10, 3.2; schema `main` (migration 0000, 0042, 0079); hợp đồng 0.3.10 trên `arc/v1.0.3-contract` (`openapi.yaml` dòng 848, `erd.md` 4.16); `src/jobs/email-dispatch.ts` bản v1.0.2 (đang chạy production).
- Cách review:
  - Đọc `git diff origin/main origin/ops/v1.0.3-email-alert` (9 tệp). Không checkout, không sửa nhánh.
  - Chạy test trên bản `git archive` của `540411de` trong scratchpad: `test-ops-check.sh` **55/55**, `mail-test-send.test.sh` **17/17** (bash macOS).
  - Kiểm `read` của `dash` (sh của Ubuntu trên VPS): `{ dòng 1; phần còn lại; } | dash -c 'IFS= read -r X; cat'` chỉ lấy dòng 1, phần còn lại đi tiếp nguyên vẹn. Giả định G3 của OPS đúng cả với `dash`.
  - Không chạy shellcheck tại chỗ (máy không có). Job shellcheck của CI xanh.
  - Không sửa mã, không commit, không đăng lên PR.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Gộp PR #30 khi đủ hai điều kiện: **FB-01 (Blocker)** và **FB-02 (Major)** đã xử lý, và `gh pr checks 30` xanh hết. Các thẻ Minor 03–07 sửa ở runbook **r1**, trước khi chạy bất kỳ bước nào trên production. Runbook đang là bản nháp nên không chặn việc gộp.

Phần mã `ops-check` đúng thiết kế 2.10:
- câu SQL **trùng từng chữ** với câu ở 2.10;
- chạy trong giao dịch READ ONLY, chỉ `count(*)`;
- lỗi truy vấn báo theo loại cố định (CWD-03);
- dùng chung công tắc với `email_dead`, và `.env` thắng biến môi trường.

`mail-test.sh` đóng đúng điểm 2.9: địa chỉ người nhận không nằm trong tham số lệnh nào, không vào lịch sử shell.

## CI của PR #30 (`gh pr checks 30`, 03/11 khoảng 10:25 UTC, run 41618329549)

| Job | Trạng thái |
|---|---|
| format · lint · audit · test · build | pass |
| infra scripts (shellcheck) | pass |
| landing LP-v1 · Playwright | pass |
| API contract · OpenAPI lint (Redocly) · no test endpoints | pass |
| **gitleaks** | **fail** – 4 phát hiện `generic-api-key`, xem FB-01 |
| docker images build · E2E smoke | **pending** (đang chạy lúc ghi) |

`mergeStateStatus = BLOCKED`. CI `main` cũng đỏ ở job gitleaks từ `642e1947` (cả `85999b89` và `f11db568`), nên `publish images` của `main` bị bỏ qua.

## Kiểm câu SQL `email_missing` trên schema 67 (v1.0.2) và 68 (v1.0.3)

| Thành phần | Nguồn | Kết quả |
|---|---|---|
| `app_user.status` (`active`/`locked`/`disabled`), `app_user.email citext NULL` | 0000 dòng 59, 72, 83 | Có từ 0000. Sau đó không migration nào đổi |
| `user_property_role.role` (`'owner'`, `'manager'` đúng chính tả CHECK), `revoked_at`, `user_id` | 0000 dòng 108–117 | Có từ 0000 |
| 0091 (tech plan 2.4) | Chỉ thêm CHECK lên `app_user.email` và bảng mới | Không đổi cột nào câu này dùng. Vế `u.email::text = ''` sau 0091 luôn sai, vì CHECK chặn `''`. Vô hại |
| RLS: `app_user`, `user_property_role` FORCE RLS (0042, 0079) | `dc exec … psql -U "$POSTGRES_USER"` | `POSTGRES_USER` là superuser (`02-roles.sh` dòng 11), nên bỏ qua RLS và đếm đủ mọi tổ chức. Cùng giả định với `email_dead`/`j16`. Xem FB-09 |
| READ ONLY | `PGOPTIONS="-c default_transaction_read_only=on"` trong container | Đúng. Test kiểm chuỗi lệnh. Runbook P2 dòng 5 chạy cùng câu này trên DB 67 thật trước P2b, nên đó cũng là lần chạy thật đầu tiên |

Kết luận: chạy đúng trên cả 67 và 68. Câu này khớp với cách dispatcher v1.0.2 chọn người nhận `owners`: `status = 'active'`, `role = 'owner'`, `revoked_at IS NULL`, email khác rỗng. Có một khác biệt nhỏ ở phía người được báo, xem FB-08.

## Trả lời câu hỏi OPS (runbook mục 8)

**Q1 – worker v1.0.2 gặp dòng outbox `email_changed` sau khi quay lui.** Đọc từ mã v1.0.2 (`email-dispatch.ts` dòng 188–201, 291, 301, 350):
- Lượt claim đầu tiên: `isStaffEmailTemplate('email_changed')` = false. Dòng thành `dead`, `last_error = 'BAD_TEMPLATE'`, `attempts = 1`. Không gửi gì, không đọc `app_user`.
- Log: một dòng `{"level":"error","msg":"email dead","outboxId":…,"template":"email_changed","attempt":1,"code":"BAD_TEMPLATE"}`. Dòng này **không** phải `job failed`. Nó làm `WORKER_ERR` (K7) ≥ 1.
- **Không** tính vào `email_dead`, vì kiểm này chỉ đếm `NO_RECIPIENT`. Không có cảnh báo, kể cả khi công tắc đã bật.
- Lên lại v1.0.3 (R8): dòng **không** được gửi lại, vì claim chỉ lấy `pending`/`failed`/`in_flight`. Điều này khớp 2.11 (không gửi lại thư cũ). Thư `email_changed` đó mất hẳn.
- Thông báo trong app: hợp đồng 0.3.10 dùng kind có sẵn `account_security_change` (`refCode = user.email_changed`), không thêm kind mới. CHECK `staff_notification_kind_check` không đổi, và v1.0.2 đọc được dòng này. Diễn tập 5.0 nên mở danh sách thông báo của `qa.owner` trên v1.0.2 để xác nhận Desk hiện được `refCode` lạ (FB-03).
- Đưa vào runbook: FB-03.

**Q2 – `old_email` NULL ở lần đặt đầu.** **Xác nhận.** Hợp đồng 0.3.10 (`openapi.yaml` dòng 848) và erd 4.16 ghi: mỗi lần đổi ghi một dòng `user_email_change`, trong đó `old_email` = địa chỉ cũ, hoặc `null` khi trước đó chưa có. Lần INV đặt email đầu tiên ở K8 vì vậy không giữ địa chỉ nào. Có một ngoại lệ: nếu INV sửa lại địa chỉ (A → B) và quay lui trước khi worker v1.0.3 gửi xong, thì A nằm lại trong bảng suốt thời gian chạy v1.0.2. Đưa vào runbook: FB-04.

**Q3 – câu đếm "CHECK trước 0091" ở tech plan 2.4.** **Đúng một nửa.**
- Thiếu vế `< 3`: **đúng**. Ví dụ `'a@'` dài 2 ký tự, `position('@') = 2 > 1`. Câu cũ không đếm dòng này, nhưng CHECK sẽ từ chối.
- Chuỗi rỗng `''`: câu cũ **đã** đếm, vì `position('@' in '') = 0 ≤ 1`.
- Câu OPS dùng ở P2 dòng 4 là **phủ định đúng của CHECK**. Đây là dạng đúng, ARC chốt dạng này:
  ```sql
  SELECT count(*) FROM app_user
   WHERE email IS NOT NULL
     AND NOT (char_length(email::text) BETWEEN 3 AND 254 AND position('@' in email::text) > 1);
  ```
- Errata tech plan 2.4 ghi ở FB-07. Không sửa tệp tech plan trên `main` trong bước này.

---

## Thẻ feedback

### FB-R4-ARC-OPS-PR30-01
- Mức độ: **Blocker**
- Vị trí: job `gitleaks` (CI run 41618329549); `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` dòng 519 (mục 5.0); lịch sử `main`: `v1.0.2-release-runbook.md` dòng 480 và 492, `v1.0.2-rollback-drill-staging.md` dòng 68; `.github/gitleaks.toml`.
- Vấn đề: gitleaks bắt `generic-api-key` ở 4 chỗ, đều là chữ `--api-digest sha256:<64 hex>` (từ "api" đứng cạnh một chuỗi entropy cao).
  - 3 chỗ đã nằm trên `main` từ `642e1947`/`b046363b`, đều là digest api của v1.0.1 `7ad36566…2d72`.
  - 1 chỗ mới do PR này thêm: digest api của v1.0.2 `f064700d…a9be` ở lệnh diễn tập 5.0.
  - Cả hai là digest image công khai, đã in trong log Release, nên không phải bí mật. Tuy vậy CI vẫn đỏ: PR #30 bị `BLOCKED`, và `main` đỏ từ `642e1947`.
- Vì sao quan trọng: `release.yml` bước `resolve` đòi một CI **push `main` thành công** cho đúng `SHA_V103`, kèm artifact `image-digests` mà job `publish images` tạo ra. Job đó đang bị bỏ qua. Nếu `main` còn đỏ thì **không phát hành được v1.0.3** vào ngày 09/11, dù PR-1 và PR-2 đều tốt. Đây là chỗ chặn chung của đợt, và PR #30 là nơi hợp nhất để sửa.
- Đề xuất sửa (trong PR #30):
  1. Runbook 5.0: bỏ hai digest viết sẵn. `rollback.sh` tự đọc `state/digests/<tag>` (dòng 8 của script), và staging đã có `digests/sha-e5fffe05ed55` từ diễn tập 03/11. Dùng đúng khuôn R4: `rollback.sh sha-e5fffe05ed55` không kèm `--api-digest`/`--web-digest`. Như vậy không còn phát hiện mới, và runbook không phải giữ hai chuỗi 64 ký tự.
  2. `.github/gitleaks.toml`: thêm **một** regex khớp đúng giá trị cho digest lịch sử, theo tiền lệ PR #19: neo hai đầu, có lý do và commit. Ví dụ `'''^(sha256:)?7ad36566afebcca5c690aec80a0c821b10a7d04b65f377d39012f1b41a222d72$'''`, lý do "public api image digest of v1.0.1 (Release log), quoted in v1.0.2 runbook/drill, commits 642e1947, b046363b". **Không** cho qua mọi chuỗi 64 hex, vì khóa thật dạng hex cũng có thể trông như vậy. Không tắt rule, không dùng `.gitleaksignore` theo fingerprint (fingerprint gắn với commit, gộp kiểu squash là hỏng).
  3. Chạy `gitleaks detect` tại chỗ (cùng image `v8.21.2` và config) trước khi push, đúng là `no leaks found`. SEC duyệt dòng allowlist, như PR #19.
  4. Thêm quy ước vào README 13.x và khuôn runbook: không dán digest vào dòng lệnh. Lệnh đọc digest từ `state/digests/<tag>` (như R8) hoặc dùng ô `⟨API_DIGEST⟩`. Chỗ đối chiếu với log Release chỉ ghi dạng rút gọn `f064700d…a9be`.
  5. Sau khi gộp: ORC kiểm CI `main` xanh **cả** gitleaks và `publish images` trước P1/P4. Ghi điều kiện này vào P0 của runbook.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-02
- Mức độ: **Major**
- Vị trí: `product/infra/server/bin/mail-test.sh` (mode `100644`); `product/infra/server/test/mail-test-send.test.sh` (`100644`); runbook K8 nhánh lỗi bước 3–4; README 13.8.
- Vấn đề: script mới không có quyền chạy trong git. Mọi script khác trong `bin/` đều `100755`. Runbook gọi thẳng `product/infra/server/bin/mail-test.sh --ssh …`, nên trên Mac sẽ ra `permission denied`. Test không bắt được lỗi này vì nó gọi `bash "$script"`.
- Vì sao quan trọng: lệnh này chỉ dùng trong nhánh lỗi của K8, tức lúc đang điều tra thư không tới, và INV có thể là người gõ. Gặp lỗi quyền đúng lúc đó gây rối, dễ dẫn tới gõ tay dạng cũ `-e MAIL_TEST_TO=<địa chỉ>`, đúng việc 2.9 muốn chặn.
- Đề xuất sửa: `git update-index --chmod=+x product/infra/server/bin/mail-test.sh product/infra/server/test/mail-test-send.test.sh`. Thêm vào test một kiểm `[ -x "$script" ] || ko "mail-test.sh not executable"`, hoặc kiểm bằng `git ls-files -s`, để CI bắt được lần sau. Có thể thêm một ca gọi trực tiếp `"$script" …` thay vì `bash "$script"`.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-03
- Mức độ: Minor
- Vị trí: runbook 1.3 (gạch đầu dòng Q1), 5.0, R6, R7.
- Vấn đề: runbook để Q1 mở và đoán sai dấu hiệu. R6 ghi "`JOB_FAILED` > 0 … có thể là dòng `email_changed`". Thực tế, như trả lời Q1 ở trên, dấu hiệu là một dòng `"level":"error","msg":"email dead"` với `code = BAD_TEMPLATE`. Dòng này làm **`WORKER_ERR`** (K7) ≥ 1 chứ không làm `JOB_FAILED` tăng. Ngoài ra thư đó mất hẳn, kể cả khi lên lại v1.0.3.
- Vì sao quan trọng: nếu không sửa, ORC sẽ dừng hoặc báo động nhầm ở K7/R6 sau quay lui, và không báo INV rằng thư xác nhận đổi email sẽ không tới.
- Đề xuất sửa:
  - 1.3: thay câu hỏi Q1 bằng câu trả lời: `dead|BAD_TEMPLATE`, không vào `email_dead`, không gửi lại.
  - R6: "`WORKER_ERR` = số dòng `email dead` có `BAD_TEMPLATE` (đếm bằng `grep -c '"code":"BAD_TEMPLATE"'`) là đúng. Khác số đó thì OPS đọc log". Thêm câu READ ONLY `SELECT count(*) FROM outbox_message WHERE topic = 'staff.email' AND status = 'dead' AND last_error = 'BAD_TEMPLATE' AND created_at > now() - interval '24 hours'`. Câu này không đọc `payload`, đúng luật 1.4 của runbook. Trên v1.0.2, chỉ mẫu `email_changed` mới ra `BAD_TEMPLATE`.
  - R7: báo INV: "nếu vừa đổi email ngay trước khi quay lui, thư xác nhận sẽ không tới. Email đã lưu vẫn dùng được".
  - 5.0: để dòng chắc chắn còn chờ, QA **dừng worker** (`dc stop worker`) trước khi đổi email `…@example.test`, rồi mới quay lui (quay lui tự bật worker v1.0.2). Đúng là `dead|BAD_TEMPLATE|1`. Thêm bước: mở danh sách thông báo của `qa.owner` trên v1.0.2. Đúng là thông báo `account_security_change` với `refCode = user.email_changed` hiện được, Desk không lỗi.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-04
- Mức độ: Minor
- Vị trí: runbook 1.3 (gạch đầu dòng Q2), R6, K9.
- Vấn đề: câu "đợt này không có địa chỉ nào bị giữ" chỉ đúng khi INV đặt email **một lần**. Nếu INV sửa lại (K8 nhánh "gõ sai") và quay lui trước khi worker v1.0.3 gửi xong, dòng `user_email_change` thứ hai giữ địa chỉ A. Trên v1.0.2 không có gì dọn dòng này: `finish` mới và nhánh chốt chặn 7 ngày của J16 đều là mã v1.0.3. Trên v1.0.2, thư của dòng đó cũng thành `BAD_TEMPLATE` (FB-03).
- Vì sao quan trọng: địa chỉ cũ (C2) bị giữ quá hạn 7 ngày nếu v1.0.2 chạy lâu. Đây là cam kết thời hạn giữ dữ liệu của erd mục 12.
- Đề xuất sửa: R6 thêm câu READ ONLY `SELECT count(*) FROM user_email_change WHERE old_email IS NOT NULL` (chỉ số). Đúng là `0`. Nếu > 0 và dự kiến ở v1.0.2 quá 7 ngày, báo ARC + SEC quyết: lên lại bản có PR-1 (J16 sẽ dọn), hoặc chạy một lệnh dọn có review. **Không** gõ SQL tay.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-05
- Mức độ: Minor
- Vị trí: runbook K4, K9 (`AT_IN_LOG=… grep -c "@"`), mục 6.
- Vấn đề: đếm mọi dòng có ký tự `@` là quá rộng. Log Node/pino có thể chứa `@` mà không phải email, ví dụ đường dẫn `node_modules/@ottimo/…` hoặc `@nestjs/…` trong stack trace, `@` trong User-Agent của log api. Chưa có số nền: runbook v1.0.2 chưa đo chỉ số này. Hiện K4/K9 coi `AT_IN_LOG` > 0 là **sự cố dữ liệu cá nhân, báo SEC ngay**.
- Vì sao quan trọng: một báo động giả loại này tốn công SEC và INV, và làm người ta quen bỏ qua tín hiệu thật.
- Đề xuất sửa: đếm theo dạng email, ví dụ `grep -cE '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}'`, vẫn chỉ in số. Đo số nền ở P2 (production v1.0.2) và trên staging v1.0.3 trước. "Đúng là" = bằng số nền, thường là `0`.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-06
- Mức độ: Minor
- Vị trí: runbook K8 nhánh lỗi bước 4 (`cd ~/Desktop/hotel-app && git pull --ff-only && …`).
- Vấn đề: thư mục này là bản làm việc chung của đội. Lúc review, nó đang ở nhánh `be-a/v1.0.3-email`, có tệp chưa theo dõi, kèm nhiều worktree. `git pull` sẽ kéo vào nhánh đang mở, có thể lỗi, hoặc chạy một `mail-test.sh` không phải bản trên `main`.
- Vì sao quan trọng: INV là người gõ lệnh, trong lúc có sự cố. Lệnh phải chạy đúng bản đã duyệt và không đụng vào việc của đội.
- Đề xuất sửa: lấy bản `main` ra thư mục tạm rồi chạy bằng `bash`. Cách này cũng không phụ thuộc bit chạy (FB-02):
  ```bash
  cd ~/Desktop/hotel-app && git fetch origin && d=$(mktemp -d) && git archive origin/main product/infra/server | tar -x -C "$d" && bash "$d/product/infra/server/bin/mail-test.sh" --ssh ottimo-admin@desk.ottimo.vn --stack production --send; rm -rf "$d"
  ```
  Dùng cùng cách cho lệnh `--verify-only` ở bước 3.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-07
- Mức độ: Minor (errata ARC, không phải lỗi của PR)
- Vị trí: `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` 2.4 (gạch đầu dòng "Kiểm trên staging/production trước khi chạy").
- Vấn đề: câu đếm của ARC thiếu vế `char_length < 3` (xem Q3). Vế `''` thì câu cũ đã đếm.
- Vì sao quan trọng: nếu có dòng dài 1–2 ký tự chứa `@` ở vị trí > 1, câu cũ báo `0`, rồi 0091 gãy ở bước `migrate`. Giao dịch hủy, v1.0.2 vẫn chạy, nên không mất dữ liệu, nhưng Release đỏ. Thực tế production chưa ai có email, nên khả năng này rất thấp.
- Đề xuất sửa: ARC thay câu ở 2.4 bằng phủ định đúng của CHECK (khối SQL ở Q3) trong bước Phản hồi & sửa, và ghi decision-log. Runbook P2 dòng 4 giữ nguyên. Sửa câu chữ 1.4 dòng 184 của runbook: "OPS dùng phủ định đúng của CHECK". Bỏ ý "bổ sung chuỗi rỗng", vì câu cũ đã đếm chuỗi rỗng.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-08
- Mức độ: Suggestion
- Vị trí: `ops-check.sh` `check_email_missing`; tech plan 2.10 điều kiện 2.
- Vấn đề: dispatcher v1.0.2 gửi thư cho **người được báo** (`userIds`) khi `status IN ('active', 'locked')`, nhưng `email_missing` chỉ đếm `active`. Vì vậy một OWN/MGR bị khóa và chưa có email không được đếm. Câu hiện tại đúng từng chữ với 2.10, nên đây là thiếu sót của ARC, không phải lỗi của OPS.
- Vì sao quan trọng: thấp. Sau khi bật, `email_dead` vẫn bắt được thư chết thật. Còn `email_missing` là chỉ báo sớm.
- Đề xuất sửa: để v1.0.4, không đổi ngay trước phát hành. Đổi thành `u.status IN ('active', 'locked')`, cập nhật test và README 13.8. ARC ghi errata 2.10 cùng FB-07.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-09
- Mức độ: Suggestion
- Vị trí: `ops-check.sh` `psql_admin` (`email_dead`, `j16`), `psql_ro`.
- Vấn đề:
  - (a) `email_dead` và `j16` cũng chỉ đọc, nhưng vẫn chạy bằng `psql_admin`, không READ ONLY.
  - (b) Cả ba kiểm dựa vào việc `POSTGRES_USER` bỏ qua FORCE RLS (superuser). Nếu sau này kiểm chạy bằng vai không có `BYPASSRLS`, các câu đếm lặng lẽ ra `0`, tức báo `ok` giả.
- Đề xuất sửa: dùng `psql_ro` cho cả ba. Trong câu của `email_missing`, thêm một chốt rẻ: `SELECT CASE WHEN (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN count(*)::text ELSE 'rls' END …`. Câu trả lời không phải số sẽ thành `FAIL unexpected answer` qua nhánh đã có.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR30-10
- Mức độ: Suggestion
- Vị trí: `bin/mail-test.sh` (`dc run -e MAIL_TEST_TO`), README 13.8.
- Vấn đề: địa chỉ không nằm trong argv hay lịch sử shell, đúng mục tiêu 2.9. Nhưng trong vài giây container một lần chạy, địa chỉ có trong biến môi trường của container: `docker inspect` (`Config.Env`) và `/proc/<pid>/environ`, chỉ root và nhóm `docker` trên VPS đọc được. `--rm` xóa container sau đó.
- Đề xuất sửa: ghi một câu vào README 13.8 để SEC biết giới hạn này. Có thể làm ở v1.0.4: `mail-test.mjs` đọc địa chỉ từ dòng đầu stdin thay vì từ biến môi trường, khi đó không còn trong env.
- Trạng thái: Open

---

## Rà phần runbook theo yêu cầu (ngoài các thẻ)

- **P2b – làm mới gói infra production từ v1.0.1: đồng ý.**
  - `git diff --stat v1.0.1 origin/ops/v1.0.3-email-alert -- product/infra` ra 12 tệp. Không có compose, env, Caddy, `02-roles.sh`, systemd hay `deploy*.sh`/`rollback.sh`/`dc`. Tệp `ci/test-ops-check.sh` và `test/rollback.test.sh` không có trong bảng 1.2, nhưng chỉ dùng cho CI hoặc bị rsync loại, nên vô hại. Có thể ghi thêm cho đủ.
  - Làm trước P3, staging làm trước. Gói lấy từ `SHA_V103`. Bản cũ giữ ở `/root/ottimo-prod-bundles/`. Chạy `dc --profile deploy config -q` và `init-secrets` "nothing to do". Đúng khuôn README 13.1, và v1.0.1 đã chạy thật khuôn này.
  - Cờ `--delete-excluded` chỉ xóa `.out`/`.work`/`.env*`/`server/test/` trong `infra/` (theo `bootstrap-vps.sh` dòng 202, đó là tệp chỉ dùng ở máy), không đụng `/opt/ottimo-prod/.env`.
  - Quay lui app không cần quay lui gói, đúng như OPS phân tích.
- **Mục 5 – quay lui về v1.0.2 với 0091: đồng ý về nguyên tắc** (V102RB). Chỉ đổi image. `--rollback` nhận `68 applied / 67`. Không restore, không xóa CHECK hay bảng. v1.0.2 không ghi `app_user.email` nên CHECK không gãy. Hợp đồng dùng kind thông báo có sẵn nên bảng `staff_notification` không đổi. Cần bổ sung FB-03 và FB-04. Lệnh 5.0 sửa theo FB-01 ý 1.
- **Mục E – bật cảnh báo: đồng ý.**
  - 4 điều kiện khớp 2.10.
  - **G5** (đếm sau giờ T + 24 giờ) chặt hơn chữ của ARC và đúng ý thiết kế. ARC chấp nhận G5 là cách đọc chính thức của điều kiện 4.
  - Lệnh E2 không in `.env`, giữ inode, chủ `ottimo` và quyền 0600, kiểm `SWITCH_LINES`/`SWITCH_ON`, không dựng lại container (api/worker không đọc biến này), có đường trả lại. Staging không bật.
  - Cách tắt lại khi thêm MGR mới đã có ở E3 và README 13.8.

## Điểm làm tốt (giữ lại)

1. `email_missing` làm đúng khuôn kiểm sẵn có: chung `cmd_failed`, công tắc chung qua `email_alert_armed`, và câu trả lời không phải số không bao giờ ra stdout, tệp trạng thái hay webhook. Test chặn cả việc chọn thêm cột (chỉ `SELECT count(*)` và `SELECT 1`) lẫn việc in `@`.
2. `mail-test.sh` thiết kế chặt: mặc định không gửi; `--send` từ chối khi không có TTY (agent không thể vô tình gửi); kiểm `--ssh`/`--stack`; chỉ để lọt đúng một dòng cố định của `mail-test.mjs`. Test giả `ssh` chứng minh địa chỉ không nằm trong argv, và phần stdin sau dòng đầu trùng `mail-test.mjs` từng byte.
3. Runbook nhất quán với luật "không địa chỉ ở đâu cả": mọi SQL chỉ đếm, có khối `SQLRO` với dòng chốt `SHOW default_transaction_read_only`, và INV chỉ báo một trong ba câu cố định.
