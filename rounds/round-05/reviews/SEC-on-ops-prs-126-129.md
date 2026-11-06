# SEC – Review PR #126 (OPS: CODEOWNERS, test `postgres-log-terse`) và PR #129 (OPS: runbook v1.0.5 r3, ghim K13)

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:

| PR | Nhánh | HEAD lúc đọc | Gốc (merge-base với `main`) | CI lúc đọc |
|---|---|---|---|---|
| #126 | `r5-ops-pgterse-fix` | **`d11a2700`** (ORC giao @ `6a8039ed`; OPS đẩy thêm `d11a2700` = V525-02 ý 1, SEC đọc cả phần chênh) | `527133e3` | Lượt cũ `cb548be6` đỏ chỉ ở gitleaks (lỗi `ae4a8358`, đã sửa ở `main` @ `ad70dc21`); lượt `d11a2700` đang chờ chạy |
| #129 | `r5-ops-runbook-r3` | **`3861ccc4`** (ORC giao @ `56ee7fc9`; `3861ccc4` chỉ đổi 1 dòng `OPS-responses.md`, runbook không đổi) | `527133e3` | Lượt cũ `abb2c1eb` đỏ chỉ ở gitleaks (cùng nguyên nhân); lượt `3861ccc4` đang chờ chạy |

Đối chiếu:
- `SEC-on-be-pr-100-d1.md`: thẻ D1-04 (4 dòng CODEOWNERS) và mục 7 (sửa vai bằng SQL tay);
- `SEC-on-pr-96-v5-25.md` mục 2, 4.1–4.4, thẻ V525-02 (bản ghim ở `90478b2d`);
- `SEC-on-be-prs-101-108.md` thẻ V530-01;
- `ARC-on-pr-96-v5-25.md` 12.6;
- `DOM-on-be-prs-101-108-110.md` mục 1.2;
- `.github/CODEOWNERS` (luật cổng (a), (b), (c) ở đầu tệp);
- migration `0000_foundation.sql` (`config_parameter`, `user_property_role`), `0002_parameter_catalogue.sql` (`short_stay_commission_pct` có `edit_roles = {owner}`), `0013_reservations_be_a.sql` (`stay_type`, `closer_user_id`, các trạng thái);
- `identity/internal/users.service.ts` `setRoles`, `public/session.service.ts` `revokeAll`.

Cách kiểm:
- Chỉ dùng `git show`/`git diff` trên các SHA trên, không checkout nhánh vào bản làm việc chung, không gọi staging hay production.
- Trích khối và câu SQL bằng đúng lệnh `awk` của runbook và của SEC mục 4.2, rồi tính `shasum -a 256` trong scratchpad. Xóa tệp tạm khi xong.
- SEC thử dựng DB dùng một lần để chạy câu K13, nhưng dừng giữa chừng: thứ tự migration trong scratchpad không khớp cách migrator chạy. SEC dựa vào lượt chạy thử của OPS (dữ liệu giả có chuỗi đánh dấu) và đọc câu đối chiếu với migration.
- `git merge-tree` của cả 2 HEAD với `main` @ `df07ccbc`: không xung đột.

Tệp này không có bí mật, mật khẩu, mã TOTP, mã đơn hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #126 | `d11a2700` | **DUYỆT** | CI xanh trên đúng SHA (gitleaks đã sửa ở `main`) |
| #129 | `3861ccc4` | **DUYỆT** | CI xanh trên đúng SHA. **K13 được ghim** ở mục 2.3 (`V530_PIN`, khối `v530-run`). Trước lần chạy K13 đầu tiên, ORC áp hai luật đọc kết quả của thẻ 129-01; OPS sửa chữ runbook ở r4, không đụng khối đã ghim |

0 Blocker · 0 Major · 1 Minor (129-01, không chặn gộp) · 2 Suggestion. ESC mới: **không**.

---

## 1. PR #126

### 1.1 Năm dòng SEC trong CODEOWNERS: đúng

| Dòng | Thẻ | Kiểm |
|---|---|---|
| `/product/services/api/src/shared/serialization/serializer.ts` | D1-04 | Tệp có trên nhánh; đúng đường dẫn đầy đủ |
| `/product/services/api/src/shared/serialization/serialize.interceptor.ts` | D1-04 | Như trên |
| `/product/services/api/src/shared/http/auth.guard.ts` | D1-04 | Như trên. Cổng `MFA_ENROLLMENT_REQUIRED`, `x-write-roles` và guard idempotency đều ở tệp này |
| `/product/services/api/src/modules/identity/public/mfa-roles.ts` | D1-04 | Như trên. Đây là nguồn duy nhất của danh sách vai 2FA (SR-AUTH-06 bản 07/11) |
| `/product/services/api/scripts/*.sql` | V525-02 ý 1 (`d11a2700`) | Theo luật CODEOWNERS, `*` không đi qua `/`, nên dòng này phủ đúng `sec-be73-check.sql`, `v5-25-parameter-shape-check.sql` và tệp `.sql` mới đặt cùng thư mục. Không phủ `.mjs` hay `.sh`. Tệp `.sql` không đổi byte nào, nên bản ghim V5-25 giữ nguyên |

- Thứ tự: các dòng nằm trong nhóm SEC đầu tệp. Không có mẫu chung nào phía dưới đè lên chúng ("last matching pattern wins").
- Chú thích của từng dòng ghi đúng lý do và mã thẻ.
- Khi ORC làm cổng (b) bằng tay (`git diff --name-only` so với các dòng SEC), dòng `*.sql` là một mẫu, không phải tên tệp. ORC so theo thư mục `product/services/api/scripts/` và đuôi `.sql`.
- Thẻ D1-04 **đóng**. Thẻ V525-02 ý 1 **xong**; ý 2 (lint cho `scripts/*.sql`) và ý 3 vẫn hạn v1.0.6 như OPS ghi.

### 1.2 `postgres-log-terse.test.sh`: đạt

Đây là test của thẻ SEC ARC-08. Bản sửa không nới phép kiểm nào:
- Chờ server thật qua TCP `127.0.0.1` (container `--network none` vẫn có `lo`). Mọi `psql` cũng đi qua TCP, nên server tạm của bước initdb (chỉ nghe socket) không trả lời thay được.
- Bỏ `|| true`. Lỗi kết nối hoặc mã thoát `psql` ≠ 0 thành dòng `HARNESS-ERROR`, test thoát 1 với câu riêng "the log setting was NOT tested". Lỗi harness không còn bị đọc thành "không lộ giá trị", cũng không bị đọc thành "lộ giá trị".
- Lượt đối chứng (không có cài đặt thì log phải lộ giá trị) và phép kiểm 5 cài đặt ghim trong `pg_settings` (đúng 5 dòng) giữ nguyên.
- `POSTGRES_PASSWORD=test-only` và `trust` chỉ sống trong container không mạng, xóa ngay sau test.

---

## 2. PR #129

### 2.1 Khối `v525-run` và câu V5-25: trùng bản ghim

SEC tự trích và tính lại:

| Thứ | Lấy từ | SHA-256 | Kết quả |
|---|---|---|---|
| Khối `v525-run` | Tệp review SEC @ `90478b2d` (commit cuối của tệp trên `main`) | `608724131055a136f81689748b323f34844c62e31973dbe4d506378ee41141eb` | Trùng |
| Khối `v525-run` | Runbook trên #129 | `608724131055…41eb`, 6 dòng, chỉ một khối | Trùng: chép nguyên văn |
| `v5-25-parameter-shape-check.sql` | `git log -1 origin/main -- <tệp>` = `897ff46e…` | `f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f`, 28 081 byte | Trùng |
| Cùng tệp | Nhánh #129 | `f5db74ac…243f` | Trùng; #129 không đổi gì trong `product/services/api/scripts/` |

- `SHA_V525 = 897ff46e` đúng: đây là commit cuối đổi tệp, chính là số mà lệnh ở SEC mục 4.2 tự tìm. Merge `be64cdf4` có cùng nội dung tệp.
- P2c bước 2 kiểm thêm `git diff --quiet ⟨SHA_V525⟩ ⟨SHA_V105⟩`, và kiểm gói có cả `be64cdf4` lẫn `c7431973` (ARC 12.6 ý 2a). Đúng ý SEC 4.1.
- `V525_STOP_KEYS` có 7 khóa (thêm `lease_terms`). SEC 4.4 lấy ô này làm nguồn, nên không phải sửa tệp review hay ghim lại.
- "Câu đọc thứ hai" đúng như ARC 12.6 (c):
  - SEC viết và ghim riêng; chỉ `reservation.code`, `arrival_date`, `status`, không cột khách;
  - chạy cần INV đồng ý riêng;
  - **danh sách mã đơn không vào repo, chat hay subagent**; danh sách chỉ hiện trên máy INV, hoặc OWN tự tìm trên Desk;
  - runbook không chứa câu đó, cũng không có lệnh chạy nó.

  SEC chưa viết câu này. SEC chỉ viết khi P2c cho `open_bookings_cancel_policy_broken` khác 0 và DOM cần mã đơn: ORC báo SEC lúc đó.

### 2.2 K13: SEC ghim

Đọc câu `v530-check` (60 dòng):
- **Chỉ đọc:** câu tự mở `BEGIN TRANSACTION READ ONLY` và kết bằng `ROLLBACK`. Khối chạy giữ 5 câu chốt phiên của V5-25: `default_transaction_read_only=on`, `role=ottimo_readonly`, `statement_timeout=30s`, `lock_timeout=3s`, và dòng `rolbypassrls`. Không có `SET ROLE`, `set_config`, `COMMIT`, `DO`, lệnh `\` của psql, hay giá trị ghép từ ngoài vào.
- **In gì:** nhãn hằng, `effective_from`, tên vai, ngày tạo, số đếm. Không in `value`, id, mã đơn hay cột của khách. Đối chiếu migration: `config_parameter` (`key`, `property_id`, `effective_from`, `created_by`, `created_at`), `user_property_role.granted_at/revoked_at`, `reservation.stay_type/closer_user_id/status/created_at`, `property.timezone` đều có thật.
- **Dòng gác:** cùng khuôn V5-25. Chạy sai vai (không BYPASSRLS, không tenant) hoặc không thấy cơ sở thì ép một câu hằng sang `boolean`, nên psql dừng với câu báo không chứa dữ liệu. Không bao giờ ra số 0 giả.
- **Kiểm toàn vẹn có ích:** vai người tạo phải có `owner`, vì catalog chỉ cho OWN sửa khóa này (`edit_roles = {owner}`, 0002). Vai `none` hoặc không có `owner` thì dừng K13 và báo SEC. Cách này bắt được cả dòng ghi bằng SQL tay lẫn lỗi phân quyền.
- **Câu là hằng** (không ghép giờ triển khai), nên ghim được bằng SHA.

Giả định của OPS (runbook mục 8):
- **(a) Không lọc theo giờ triển khai, in ngày tạo của từng dòng: SEC đồng ý.** Đây là lệch so với chữ thẻ V530-01, nhưng tốt hơn: câu hằng ghim được, và không báo "chưa nhập" sai khi INV nhập ngay trên v1.0.4 (DOM 1.2 ý 1).
- **(b) Vai lúc tạo dòng; gặp `none` thì dừng, hỏi SEC: SEC đồng ý.** `setRoles` ghi đè `granted_at` khi cấp lại vai (`ON CONFLICT … DO UPDATE SET granted_at = EXCLUDED.granted_at`), nên `none` có thể là cấp lại chứ không phải lỗi. Khi gặp `none`, SEC xem audit `user.roles_changed` của người tạo trên Desk cùng INV. Không chạy thêm câu nào trên production để đoán.
- **(c) Định nghĩa "đơn có người chốt"** là việc DOM xác nhận, không phải SEC. Ghi chú cho DOM: tổng `closer_bookings_old_rate` gồm mọi trạng thái (cả `hold`, `confirmed`, `in_house`, `checked_out`); chỉ `cancelled`, `no_show` được tách riêng. DOM đổi định nghĩa thì OPS sửa câu, SHA đổi, SEC ghim lại. Khối chạy so SHA trước, nên câu cũ hay câu mới chưa ghim đều tự dừng.

SEC đặt `V530_PIN` = SHA-256 của `v530.sql`, tức câu trích bằng `awk` từ runbook ở commit cuối của tệp trên `origin/main`:

| Thứ được ghim | SHA-256 | Ghi chú |
|---|---|---|
| `v530.sql` = khối `v530-check` của runbook (60 dòng, 3 581 byte) | `9fda2a80f39d218c47f3d1152f8bd9fdb623bb5124ea2655772a296407567e98` | Trùng số OPS tính |
| `v530_run.sh` = khối `v530-run` ở mục 2.3 (6 dòng) | `e601cfcddabdfb7116bec5a2b222acca493d710c4bc4b68eeed58316e04f29f3` | Khác khối `v525-run` đúng 3 chỗ: hai dòng đánh dấu, tên tệp và SHA ở dòng 3, tên tệp ở dòng 4. Dòng `ssh … PGOPTIONS … psql` giống hệt |

Điều kiện chạy (ORC):
1. Chỉ chạy sau khi #129 đã gộp `main`. Trước đó, lệnh trích trên `main` ra câu cũ hoặc ra rỗng, SHA lệch, khối tự dừng.
2. DOM đã xác nhận định nghĩa (c) trong decision-log, hoặc DOM không đổi gì sau review này.
3. Một lần gọi `bash "$W/v530_run.sh"`, không `| tee`, không `>`. Không chạy khi `deploy.sh` hoặc migrate đang chạy. Xong thì xóa `$W`.
4. Áp hai luật đọc của thẻ 129-01.

### 2.3 Khối chạy đã ghim và lệnh trích

Trích trên Mac, từ thư mục repo. Chỉ chạy khi cả 2 dòng `shasum` trùng bảng ở 2.2:

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
R=$(git log -1 --format=%H origin/main -- rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md)
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-ops-prs-126-129.md)
W=$(mktemp -d)
git show "${R}:rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md" \
  | awk '/^-- >>> v530-check$/ {f=1} f {print} /^-- <<< v530-check$/ {f=0}' > "$W/v530.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-ops-prs-126-129.md" \
  | awk '/^# >>> v530-run$/ {f=1} f {print} /^# <<< v530-run$/ {f=0}' > "$W/v530_run.sh"
cd "$W" && shasum -a 256 v530.sql v530_run.sh
```

- Khi dán vào zsh, không thêm chú thích `#` vào cuối dòng.
- Khối `v530-run` trong runbook còn chỗ chờ `⟨V530_PIN⟩`, nên trích từ runbook sẽ lệch SHA và dừng. Hãy trích từ tệp này. OPS có thể thay chỗ chờ trong runbook bằng SHA trên ở r4. Khi đó khối trong runbook phải ra đúng `e601cfcd…29f3`.

Khối đã ghim:

```bash
# >>> v530-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 v530.sql | cut -d ' ' -f 1)" = 9fda2a80f39d218c47f3d1152f8bd9fdb623bb5124ea2655772a296407567e98 || { echo 'v530.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat v530.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< v530-run

```

---

## 3. README mục 11.1 (đổi vai bằng SQL tay): đúng, một gợi ý

- So với mã: `setRoles` làm đúng 5 việc README kể, trong một giao dịch:
  - sửa `user_property_role`, thu hồi bằng `revoked_at`;
  - tăng `roles_version`, `version`;
  - `revokeAll(…, 'role_changed')` đặt `revoked_at`, `revoked_reason` cho mọi phiên;
  - xóa `mfa_login_challenge`;
  - ghi audit `security` `user.roles_changed`.
- Bốn bước của script một lần khớp các việc trên. Phần "Vì sao" đúng: cache `user_id:roles_version` sống 60 giây; phiên hạn chế "chỉ bật 2FA" chỉ ghi lúc đăng nhập.
- Luật "không runbook nào sửa `user_property_role` bằng SQL tay; sự cố thì script một lần có ARC + SEC review và INV đồng ý riêng" đúng ghi chú mục 7 của SEC. Mục này đóng.
- Gợi ý ở thẻ 129-02.

---

## 4. Thẻ

#### FB-R5-SEC-OPS-129-01
- Mức độ: Minor (không chặn gộp; ORC áp trước lần chạy K13 đầu tiên)
- Người nhận: ORC (khi chạy), OPS (chữ runbook r4, ngoài khối đã ghim)
- Vị trí: runbook v1.0.5, K13 "Cách đọc" và bảng "Đúng là"
- Vấn đề:
  1. K13 ghi `n`, `m` (số đơn ngắn ngày do sale/CTV chốt từ 01/11) vào decision-log và `round-summary.md`, mà repo là **công khai**. Với ít CTV, `n` gần như là số đơn của một người, tức căn cứ hoa hồng của một nhân viên xác định được. Đây là dữ liệu cá nhân về thu nhập, cùng lý do với thẻ V530-02. Ngoài ra đây là số kinh doanh nội bộ.
  2. K13 không nhắc các luật "Thêm" của P2c: quá 200 dòng thì dừng; `permission denied` thì dừng, không chạy lại bằng vai quản trị; lỗi khác lỗi dòng gác thì chỉ báo SEC **loại** lỗi, không chép câu báo lỗi.
- Vì sao quan trọng: decision-log ở repo công khai giữ mãi. Một câu báo lỗi ép kiểu có thể nhắc lại giá trị.
- Đề xuất sửa:
  - Repo (decision-log, `round-summary.md`) chép nguyên các dòng `commission_row` và `commission_rows_from_2026_11_01`. Với hai dòng `closer_bookings_old_rate*`, repo chỉ ghi "`= 0`" hoặc "`> 0`" và "`m ≤ n`: đúng".
  - ORC báo số `n`, `m` chính xác cho INV trong chat với INV, không vào repo hay subagent.
  - K13 áp nguyên các luật "Thêm" của P2c.
  - Câu đồng ý lần 2 giữ nguyên.
  - Sửa ở phần chữ, ngoài khối `v530-check`, nên `V530_PIN` không đổi.
- Trạng thái: Open

#### FB-R5-SEC-OPS-129-02
- Mức độ: Suggestion
- Người nhận: OPS (README 11.1), ARC
- Vị trí: `product/infra/server/README.md` 11.1, bước 4 của script một lần ("Lần sửa này không có dòng `audit_event` của app")
- Vấn đề: một lần đổi vai ngoài app chỉ để lại dấu ở decision-log. Ai đọc Nhật ký bảo mật trên Desk sẽ không thấy lần đổi vai đó. README cũng chưa nói script chạy bằng vai DB nào.
- Đề xuất sửa: thêm vào README:
  - script một lần ghi thêm một dòng `audit_event` `security` `user.roles_changed` (before/after vai, `reason` có mã sự cố), nếu ARC xác nhận bảng cho phép ghi như vậy. Nếu không thì giữ decision-log như hiện nay;
  - vai DB chạy script và cách mở giao dịch do ARC + SEC chốt trong lần review script đó, không đặt sẵn trong README.
- Trạng thái: Open

#### FB-R5-SEC-OPS-126-01
- Mức độ: Suggestion
- Người nhận: OPS (PR CODEOWNERS sau, hạn v1.0.6 cùng V525-02 ý 2)
- Vị trí: `.github/CODEOWNERS`
- Vấn đề: hai lệnh quản trị chạy trên production chưa có dòng SEC: `product/services/api/scripts/mfa-operator-reset.sh` (reset 2FA khi không còn OWN nào, SR-AUTH-06 06.33) và `production-bootstrap.sh` (tạo OWN đầu tiên, in mật khẩu tạm một lần). Mã thật của hai lệnh nằm ở `product/services/api/src/admin/`. PR sửa các tệp này sẽ không hiện dấu "cần SEC" ở cổng (b).
- Đề xuất sửa: thêm `/product/services/api/scripts/*.sh` và `/product/services/api/src/admin/` (SEC), chú thích "lệnh quản trị trên production – cổng (b)". Không thêm cả thư mục `scripts/`: các `.mjs` sinh copy không phải đường dẫn SEC.
- Trạng thái: Open

---

## 5. Giới hạn

- SEC không chạy câu K13 trên DB nào và không chạy test `postgres-log-terse`. SEC dựa vào lượt thử của OPS và CI.
- SEC chỉ đọc phần runbook ORC chỉ định (bảng 0.1, P2c, K13, mục 6, mục 8) và README 11.1. Không đọc lại toàn bộ 850 dòng; các bước W0–W7 đã review ở `SEC-on-ops-prs-92-93-95.md`.
- `rounds/round-05/outputs/OPS/report.md` (+30 dòng) chỉ đọc lướt.
- SEC không approve hay comment trên GitHub; ORC gộp.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review PR #126 @ d11a2700: DUYỆT; PR #129 @ 3861ccc4: DUYỆT; K13 ghim** (rounds/round-05/reviews/SEC-on-ops-prs-126-129.md). #126: 5 dòng CODEOWNERS SEC đúng (serializer, interceptor, auth guard, mfa-roles – đóng D1-04; scripts/*.sql – V525-02 ý 1), test terse báo lỗi harness riêng, không nới phép kiểm. #129: khối v525-run trùng bản ghim 60872413…41eb, tệp SQL f5db74ac…243f tại SHA_V525 = 897ff46e, không sửa; câu đọc thứ hai chưa có, SEC chỉ viết khi cần, INV đồng ý riêng, mã đơn không vào repo/chat/subagent. V530_PIN = 9fda2a80…7e98 (câu v530-check), khối v530-run e601cfcd…29f3 lấy từ tệp review SEC; giả định K13 (a), (b) đồng ý; (c) DOM xác nhận. Chạy K13 sau khi #129 gộp, theo 129-01 (Minor): repo chỉ ghi closer_bookings_old_rate = 0 / > 0, số chính xác báo INV trong chat; áp luật "Thêm" của P2c. README 11.1 khớp setRoles. Thẻ mới: 129-01 (Minor), 129-02, 126-01 (Suggestion). | SEC |`
