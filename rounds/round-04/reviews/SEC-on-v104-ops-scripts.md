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
