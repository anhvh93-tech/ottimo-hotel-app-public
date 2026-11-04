# SEC review P4-03 `v104/ops-scripts` (phần chưa phủ bởi SEC-on-v104-email-identity + CODEOWNERS theo V104-05)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/ops-scripts` @ **`659e1774`** (3 commit trên `c6cd32a8`: `b8f75eeb`, `c6986f39`, `659e1774`). So với `origin/main` @ `7b5b6117`.
- Đã review trước: `SEC-on-v104-email-identity.md` review `.github/CODEOWNERS` và `.github/pull_request_template.md` ở `b8f75eeb`, và chỉ **đọc** `requeue-email-changed.sh`.
- Phạm vi lần này:
  - `bin/mail-test.sh`, `mail-test.mjs`, `test/mail-test-send.test.sh` (SEC PR30-10, ARC PR30-10, luật ASCII của INT);
  - `bin/requeue-email-changed.sh`, `test/requeue-email-changed.test.sh` (SEC PR32-S2, ARC PR32-06);
  - `.github/CODEOWNERS` và ô mẫu PR ở `659e1774` (SEC V104-05);
  - `rounds/round-04/outputs/OPS/v1.0.4-ops-scripts.md`.
- Không tự chạy test (OPS báo 35/35, 63/63; CI chạy lại khi mở PR). Không sửa tệp nào ngoài tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có thẻ Blocker hay Major. Một thẻ Minor (P403-01, mở rộng CODEOWNERS thêm), không chặn PR và không chặn QC v1.0.4.

| Thẻ | Kết quả SEC |
|---|---|
| **FB-R4-SEC-OPS-PR32-S2** (tag chính xác) | **Verified.** So `${image##*:}` với đúng `<tag><API_TAG_SUFFIX>` của `.env`, cùng tham chiếu mà `deploy.sh` kéo về. Ảnh có digest (`@sha256:`) hay hậu tố khác đều bị từ chối (hỏng về phía an toàn). Có ca registry có cổng |
| **FB-R4-SEC-OPS-PR30-10** (cửa test của `mail-test.sh`) | **Verified.** Cửa đọc stdin không phải terminal cần đủ 3 điều kiện, trong đó `ssh` đầu tiên trong `PATH` phải là `$MTS_DIR/bin/ssh`. Dùng ssh thật thì cửa đóng. Có ca 4c, 4d |
| **ARC PR30-10** (địa chỉ thử không nằm trong env container) | **Đạt về bảo mật.** Địa chỉ chỉ đi qua stdin, không còn trong `read` trên VPS, `-e MAIL_TEST_TO`, `docker inspect Config.Env` hay `/proc/<pid>/environ`. `mail-test.mjs` **từ chối** khi có `MAIL_TEST_TO` trong env, giữ tối đa 256 ký tự, không in lại địa chỉ khi sai. Chương trình đi dạng base64 trong lệnh ssh (thấy được trong danh sách tiến trình, nhưng không chứa địa chỉ hay bí mật). Cần xác nhận trên VPS thật ở 5.0 S14 (`dc run -T` có chuyển stdin) |
| Luật ASCII của INT trong `mail-test.mjs` | **Đạt.** Chỉ bỏ `\r\n` cuối và khoảng trắng hai đầu **trước** khi kiểm. Khoảng trắng bên trong vẫn bị luật từ chối, nên CR/LF không vào được phong bì |
| **ARC PR32-06** (`requeue` hỏi `known-email-templates-cli`) | **Đạt.** Kiểm sự có mặt của tệp lệnh riêng (`fs.existsSync`), không suy từ mã thoát. Mã 0/1 rõ nghĩa, mọi mã khác → `REFUSED`. Image trước v1.0.4 lùi về câu hỏi v1.0.3. Không đổi câu SQL hay điều kiện dòng |
| **FB-R4-SEC-OPS-V104-05** (phần OPS) | **Verified.** Đủ 5 đường dẫn SEC đã yêu cầu: `serializer.test.ts`, `shared-mailboxes.ts`, `integrations/notification/email-address.ts`, `shared/email.ts`, `.github/pull_request_template.md` (cùng `field-policy.ts` và chính `CODEOWNERS`). Chú thích đầu tệp ghi đúng "chỉ dẫn, không phải cổng" và cách ORC kiểm. Ô mẫu PR đổi đúng thành "PR sửa tệp có dòng SEC trong CODEOWNERS…", đòi tên tệp `SEC-on-*.md` nêu commit head. `shared-mailboxes.ts`, `email-address.ts` chưa có trên `main` (tới khi gộp `v104/be-identity`): GitHub nhận dòng trước, không sao. Phần ORC (dòng decision-log) đã có ở decision-log 04/11 |

Kiểm thêm theo yêu cầu ORC:
- Email trong diff: chỉ dạng `…@example.test`. Dòng chú thích dùng tên máy production `desk.<tên miền>` là dòng có sẵn trên `main`, không mới.
- Không IP, không khóa, không token, không digest.
- Không có SQL ghi tay mới. `requeue-email-changed.sh` giữ nguyên câu `UPDATE` đã được SEC/ARC duyệt ở v1.0.3 (chạy có `--expect`, khóa deploy, dry run).
- Tài khoản GitHub trong `CODEOWNERS` là chủ repo công khai (đã có trong URL repo), không phải dữ liệu mới.

## 1. Ghi chú kỹ thuật

- `mail-test.sh`: `$prog` được kiểm lại `^[A-Za-z0-9+/=]+$` trước khi ghép vào lệnh từ xa, nên không có đường chèn lệnh qua nội dung `mail-test.mjs`.
- `mail-test.sh --verify-only` vẫn gửi một dòng rỗng qua stdin. `mail-test.mjs` không đọc stdin ở chế độ này. Đúng.
- `requeue-email-changed.sh`: nếu chính lệnh kiểm tệp (`node -e … existsSync`) lỗi vì lý do khác và thoát 1, script đi nhánh "image trước v1.0.4". Nhánh đó vẫn hỏi thật (import gói); không xác định được thì thoát khác 0/1 → `REFUSED`. Không có đường nào ghi dữ liệu khi chưa biết chắc. Chấp nhận.

## 2. Thẻ

### FB-R4-SEC-OPS-P403-01
- Mức độ: Minor
- Người làm: OPS (cùng P4-04, vì P4-04 sửa `ci.yml`)
- Vị trí: `.github/CODEOWNERS` @ `659e1774`
- Vấn đề: các lớp chặn bảo mật khác đi theo repo chưa có dòng SEC:
  - `/.github/workflows/ci.yml` (gitleaks, sắp có job `confidential-paths` G2) và `/.github/gitleaks.toml`;
  - `/.gitignore` (dòng chặn `00-brief/context/pricing/`, G1);
  - `/product/infra/postgres/init/02-roles.sh` (giới hạn vai DB, SEC H3; P4-04 có thể sửa).
- Vì sao quan trọng: một PR bỏ dòng `.gitignore`, nới `gitleaks.toml` hay tắt job `confidential-paths` sẽ gỡ lớp chặn số hoa hồng và bí mật mà không có tín hiệu nào cho ORC ở bước so `git diff --name-only` với CODEOWNERS (V104-05 ý 2).
- Đề xuất sửa: thêm 4 dòng trên (cùng tài khoản chủ repo, ghi vai SEC ở chú thích). Thêm một câu vào chú thích đầu tệp cho ORC: migration mới có `DISABLE TRIGGER`, `GRANT` hoặc `REVOKE` cũng cần `SEC-on-*.md` (luật của 0094 và PN-01), kiểm bằng `git diff <base>...<head> -- '**/migrations/*.sql' | grep -E 'DISABLE TRIGGER|GRANT|REVOKE'`.
- Trạng thái: Open

## 3. Điểm làm tốt
- Đường đi của địa chỉ thử giờ ngắn nhất có thể: chỉ stdin → bộ nhớ tiến trình. Bảng so sánh v1.0.3/v1.0.4 trong báo cáo OPS rõ ràng.
- `mail-test.mjs` chủ động từ chối `MAIL_TEST_TO`, chặn thói quen cũ thay vì chỉ ghi chú.
- Kiểm sự có mặt của tệp lệnh trước, để "thiếu module" không bị hiểu nhầm thành "image không biết mẫu thư".

## 4. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-03 ops-scripts @ 659e1774: ĐẠT** (rounds/round-04/reviews/SEC-on-v104-ops-scripts.md): Verified PR32-S2 (tag = <tag><API_TAG_SUFFIX> chính xác), PR30-10 (cửa test 3 điều kiện), V104-05 phần OPS (đủ 5 đường dẫn SEC + ô mẫu PR); ARC PR30-10 đạt về bảo mật (địa chỉ chỉ qua stdin, MAIL_TEST_TO trong env bị từ chối; xác nhận dc run -T ở 5.0 S14); requeue hỏi known-email-templates-cli đạt. Minor P403-01: thêm ci.yml, gitleaks.toml, .gitignore, 02-roles.sh vào CODEOWNERS + câu kiểm migration DISABLE TRIGGER/GRANT | SEC | Quyền SEC |`

---

## 5. Xác nhận PR #46 tại đầu `c893c3ea` (04/11)

- Đối tượng: `origin/v104/ops-scripts` @ **`c893c3ea`**. SEC đọc toàn bộ phần sau head đã review `659e1774`: `67980030` (sửa theo review ARC), `84933d92` (prettier), `c893c3ea` (ARC P403-07/08/10), cùng `responses/OPS-P4-03.md` Lượt 3. Không tự chạy test (OPS báo 37/37, 67/67, 16/16, shellcheck và prettier sạch).

### 5.1 Kết luận

**ĐẠT. Được gộp PR #46 ở `c893c3ea`.** Không có Blocker hay Major. **FB-R4-SEC-OPS-P403-01: Verified.** Có một thẻ Minor mới (P403-02), làm ở gói P4-04, **không** chặn PR #46.

| Phần | Đánh giá |
|---|---|
| `requeue-email-changed.sh` (`67980030`, ARC P403-02/05) | Chặt hơn: tham chiếu image phải **đúng bằng** `API_IMAGE:<tag><API_TAG_SUFFIX>` (không nhận repository khác). Với image v1.0.4+, mã 1 dừng với câu báo riêng, không ghi gì. Câu `UPDATE` và điều kiện dòng không đổi |
| `mail-test.mjs` (`67980030`, ARC P403-03) | Đổi thứ tự: từ chối `MAIL_TEST_TO` → đọc địa chỉ stdin (chỉ `--send`) → kiểm `EMAIL_PROVIDER`. Không có đường in địa chỉ: các câu báo là chữ cố định. Đọc stdin trước khi kiểm provider không ghi gì ra đĩa hay log. `84933d92` chỉ xuống dòng, M9 vẫn bắt việc đọc `MAIL_TEST_TO` từ env |
| CODEOWNERS `.gitignore` (ARC P403-07) | Đúng: không có `/` ở đầu nên khớp **mọi** `.gitignore`, kể cả tệp mới ở thư mục con. Một `!pricing/` lồng không qua được bước kiểm của ORC |
| 5 đường dẫn mới (ARC P403-10) | Đồng ý cả 5, đường dẫn đều có tệp thật: `deploy-from-ci.sh` (lệnh bắt buộc của khóa SSH CI), `init-secrets.sh`, `bootstrap-vps.sh` (sshd/sudoers, tắt ghi I/O của sudo), `docker-compose.prod.yml` (secret theo service, volume blob không vào `web`), `privacy-log-check.sh` |
| Đủ đường dẫn V104-05 + P403-01 | Có: `field-policy.ts`, `serializer.test.ts`, `shared-mailboxes.ts`, `email-address.ts`, `shared/email.ts`, mẫu PR, `CODEOWNERS`, `workflows/`, `gitleaks.toml`, `.gitignore`, `02-roles.sh`, `mail-test.sh`, `mail-test.mjs` |
| Bí mật, IP, email | Không có. Chỉ có `…@example.test` |

### 5.2 Quyết định của SEC

**(a) Mẫu `ROLE ` trong luật migration: không giữ nguyên.** SEC đã thử trên 69 migration hiện có:
- regex của ARC khớp 55 tệp. Có 9 tệp khớp **chỉ** vì `ROLE `, và cả 9 là nhiễu: tên cột `role`, `recorded_by_role IN (…)`, `user_property_role`, và dòng chú thích `-- Runs as ottimo_owner (SET ROLE by src/db/migrate.ts)` có ở 19 tệp;
- **không** migration nào có lệnh `CREATE/ALTER/DROP/SET ROLE` thật. Vai DB nằm ở `02-roles.sh`, tệp này đã là đường dẫn SEC.
- Một luật kêu ở hầu hết migration sẽ thành thói quen bỏ qua. Đổi sang dạng chính xác dưới đây và bỏ dòng chú thích. Kết quả còn 46/69 tệp, toàn là tệp thật sự đụng RLS, policy, grant hay `SECURITY DEFINER`. Các tệp này đúng là cần SEC.
```
git diff <base>...<head> -- '**/migrations/*.sql' | grep -E '^\+' | grep -vE '^\+[[:space:]]*--' \
  | grep -iE 'DISABLE TRIGGER|GRANT|REVOKE|ROW LEVEL SECURITY|POLICY|SECURITY DEFINER|(CREATE|ALTER|DROP|SET)[[:space:]]+ROLE'
```

**(b) `deploy.sh`, `rollback.sh`: CÓ thêm vào CODEOWNERS.** Thêm luôn `requeue-email-changed.sh`.
- `deploy.sh` giữ guard production, kiểm digest sau pull, bước `roles` (áp lại giới hạn vai, SEC H3) và smoke `SEC C2` (volume blob không vào `web`).
- `rollback.sh` kiểm lại digest đã ghi của tag. Bỏ một dòng ở đây là có thể chạy image chưa kiểm trên production.
- `requeue-email-changed.sh` là lệnh duy nhất trong repo **ghi** vào DB production (`UPDATE outbox_message`).
- Hệ quả cho PR #45 (P4-02): cần tệp SEC nêu đúng đầu `051e1750`. SEC đã xác nhận ở `SEC-on-v104-ops-deploy-order.md` mục 5 (cùng commit với mục này).

#### FB-R4-SEC-OPS-P403-02
- Mức độ: Minor
- Người làm: OPS, trong gói P4-04 (gói đó sửa `ci.yml` và `.github/`, nên có SEC review sẵn). Không làm thêm commit trên PR #46, để không phải xác nhận lại một đầu nhánh mới.
- Vị trí: `.github/CODEOWNERS` luật (c), `.github/pull_request_template.md` ô migration.
- Đề xuất sửa:
  1. Thay lệnh ở cả hai chỗ bằng lệnh ở (a). Câu trong mẫu PR đổi "đổi vai (`ROLE`)" thành "`CREATE/ALTER/DROP/SET ROLE`".
  2. Thêm 3 dòng SEC (+ OPS): `/product/infra/server/bin/deploy.sh`, `/product/infra/server/bin/rollback.sh`, `/product/infra/server/bin/requeue-email-changed.sh`. Ghi vai ở chú thích (guard + digest + roles; kiểm digest khi quay lui; lệnh ghi DB production).
- Trạng thái: Open
- Cho tới khi gộp P4-04: ORC dùng lệnh ở (a) cho bước kiểm (c), và coi 3 tệp ở (b) là đường dẫn SEC.

### 5.3 Dòng decision-log đề xuất (ORC ghi khi gộp, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – xác nhận PR #46 ops-scripts @ c893c3ea: ĐẠT, được gộp** (SEC-on-v104-ops-scripts.md mục 5): requeue chặt hơn (đúng API_IMAGE), mail-test đổi thứ tự kiểm không lộ địa chỉ, CODEOWNERS khớp mọi .gitignore + 5 đường dẫn biên máy chủ; P403-01 Verified. SEC quyết: (a) luật migration bỏ mẫu 'ROLE ' (9/69 tệp chỉ khớp vì tên cột/chú thích, không có lệnh ROLE thật), thay bằng (CREATE|ALTER|DROP|SET) ROLE và bỏ dòng chú thích → 46/69; (b) thêm deploy.sh, rollback.sh, requeue-email-changed.sh vào CODEOWNERS (guard/digest/roles; lệnh ghi DB production). Minor P403-02 làm ở P4-04. Tới lúc đó ORC áp (a)(b) bằng tay | SEC | Quyền SEC |`
