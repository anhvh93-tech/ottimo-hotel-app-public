# ARC review lại – P4-04 `v104/ops-check` r1 + phần mã (OPS, PR-M)

- Round 4 (v1.0.4), bước **Review** (ma trận OPS → ARC, `plan-v1.0.4.md` 7.1), 04/11/2026.
- Đầu nhánh `ce08b63a`. Chỉ review phần riêng của P4-04:
  - `3e8d0921`: mã;
  - `a9f2c75d`: runbook r1 + `product/tests/README.md`;
  - `ce08b63a`: CODEOWNERS, mẫu PR, `responses/OPS-P4-04.md`.
- Không review lại commit gộp `e16b3821` (ops-scripts @ `c893c3ea`, PR #46, ARC đã duyệt). Chỉ kiểm rằng sau khi gộp, `requeue-email-changed.sh` vẫn ghi bằng `ottimo_requeue` (dòng 76/79).
- Đọc trước:
  - `ARC-on-v104-p4-04.md` (P404-01..07), `ARC-on-v104-p4-03.md` (P403-03/04/07/09);
  - `ARC-on-v104-p4-10.md` P410-02, `ARC-on-v104-p4-11.md` P411-02;
  - `plan-v1.0.4.md` (2.2, dòng P4-04), decision-log 04/11 (ARC P404-02, journal 0092–0094, H05);
  - `responses/OPS-P4-04.md`, runbook r1 trên nhánh;
  - mã đối chiếu: `deploy.sh` của P4-02 @ `051e1750`, `smtp.ts` + `email-address.ts` của `v104/int-email`, `shared-mailboxes.ts` của `v104/be-identity`, 0093 của `v104/be-holds`, 0094 của `v104/be-lease-prices`.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

- Không có Blocker hay Major. P404-01..07 đã đóng thật, xem mục 1.
- Phần mã đúng kiến trúc, và ARC đã chạy thật trên Postgres 17 (mục 3):
  - kiểm DB chạy bằng `ottimo_readonly` READ ONLY, có dòng gác;
  - vai requeue chỉ có quyền tối thiểu;
  - GRANT nằm ở `02-roles.sh`, không cần migration.
- **PR-M gộp được khi đủ 4 điều kiện:**
  1. **r1.1 sửa `deploy.sh` bước `roles`** theo đúng các điều kiện ở FB-R4-ARC-OPS-P404-11. Nếu ORC giao việc này cho P4-02 thì PR-A phải gộp trước PR-M.
  2. **Sửa 3 thẻ Minor 08, 09, 10** trong cùng lượt r1.1. Mỗi thẻ chỉ vài dòng mã hoặc chữ.
  3. **BE-D xác nhận P4-13** không đổi tên trigger PN-01 và quyền `ottimo_app` (bảng 0.1, "Việc còn lại" #8). Hiện chưa có nhánh `v104/be-pn01`.
  4. **CI của PR-M xanh**, gồm job mới `confidential-paths` và bước `setup-node` của `infra-scripts`. ARC không có shellcheck trên máy nên chưa tự chạy shellcheck.
- ARC không cần review lại toàn bộ. Khi có r1.1, ARC chỉ đọc diff r1 → r1.1 và test.

## 1. Thẻ ARC P404-01..07: đã đóng chưa

| Thẻ | OPS trả lời | ARC xác nhận | Bằng chứng |
|---|---|---|---|
| P404-01 (Minor) | Done | **Verified** | Bảng 0.1 không còn ô Q1/Q2/Q4. R3b/S5 dùng đúng câu `count(*)` 5 mẫu. 1.3 dòng 0093, 1.4 ý cuối, mục 5 "Hệ quả", 5.0 S7 khớp câu trả lời. "Việc còn lại" #25: lúc cắt so lại `email-templates.ts`. Câu R3b chạy được trên schema 71 migration (mục 3) |
| P404-02 (Minor) | Done | **Verified, kèm điều kiện thẻ 11** | Runbook mục 0 và 1.3 ghi "0096 không dùng lại; 0097 không cần". ARC xác nhận không cần 0097 (mục 2) |
| P404-03 (Minor) | Done | **Verified** | Có bảng 4.1 (a)/(b)/(c), và các ca `lock`…`migrate`/`cancelled`. Mọi ca bắt đầu chỉ đọc và đều báo INV. Còn một câu cũ ở R4, chưa sửa: thẻ 10 |
| P404-04 (Minor) | Done | **Verified** | `check_containers` so id + `RestartCount` với `state/ops-check/containers.restarts`, cùng cách `worker_ok` của P4-02. Test 6a–6f xanh (13/13). K4b, R6, S3, S4, S9 dùng `true 0`. Một kẽ nhỏ: thẻ 12 |
| P404-05 (Minor) | Done | **Verified** | "Việc còn lại" có 27 dòng, đủ các mục "Việc" và "Tiêu chí đạt" của dòng P4-04, cộng các dòng ORC 04/11 (README 12.3, `privacy.ts` giao BE) |
| P404-06 (Sugg.) | Done | **Verified** | Đầu tệp ghi: `a183b82d` = r0.4, bản này = r1 |
| P404-07 (Sugg.) | Done | **Verified** | P2, P2b bước 2 và S0 in `COMPOSE=`. K1 thành kiểm bắt buộc khi bản Compose khác nhau (bảng 6). S9 đòi `StartedAt` của worker sớm hơn api ít nhất 3 giây. Ngoài ra `smoke` của P4-02 so id container worker |

### Việc ORC giao thêm

| Việc | ARC xác nhận | Ghi chú |
|---|---|---|
| P403-03 + P403-09: S14 ba lượt | **Verified** | Khớp thứ tự trong `mail-test.mjs`: dòng 56–58 đọc stdin trước khi kiểm provider, còn `--verify-only` không đọc stdin.<br>(1) `--verify-only` trên `mock` → `EMAIL_PROVIDER is not smtp`;<br>(2) `thu.nghiem@example.test` → `not smtp`;<br>(3) `thu,nghiem@example.test` → `address on stdin is missing or invalid`.<br>Câu "dòng rỗng bị chặn trên Mac" ghi đúng. Lệnh chạy từ `git archive ⟨SHA_V104⟩` |
| P403-04: `setup-node` | **Verified (chờ CI)** | Cùng SHA ghim `949feb24…` (`# v7.1.0`) với 4 job khác. `node-version-file: product/.nvmrc` (= 22) |
| P403-07: `.gitignore` lồng | **Verified (lớp CI)** | `check-confidential-paths.sh` đọc chỉ mục git bằng `ls-files` với pathspec `top,icase,glob`. Vì vậy `.gitignore` nào cũng không che được tệp đã track. Test 6/6, có ca `git add -f` và ca đổi tên khác hoa thường. Chỉ in đường dẫn |
| P410-02: hold quá hạn lúc lên bản | **Verified, còn sót chữ** (thẻ 10) | P2 ý cuối và rủi ro mục 8 có câu "chỉ hiện ở Cần chú ý". R3b có `HOLD_OVERDUE_AT_UPGRADE`. Nhưng P2 bảo "chạy câu đó ở đây một lần" mà khối SQL của P2 không có câu này |
| P411-02: ghi chú `MutableClock` | **Verified** | `product/tests/README.md` (đoạn sau bảng) và runbook 5.0 "Đồng hồ staging" có cùng luật |
| "OWN đặt H05 = v2" | **Verified** | 1.8, N1–N6, mục 5 "theo H05 lúc lùi", bảng 6 khớp quyết định ORC 04/11. Thứ tự: deploy → thay tờ → OWN đặt trên Desk, hiệu lực hôm nay, không SQL tay, không `publish-privacy-notice` → SEC kiểm → ORC mở lại. Sau N2 không đặt H05 về v1. K11 (b) có kẽ nhỏ: thẻ 13 |

## 2. Thứ tự bước runbook, deploy-order P4-02 và migration journal

**Thứ tự deploy.** Đối chiếu với `deploy.sh` P4-02 @ `051e1750`:
- Các bước: `lock → config → pull → appconfig → roles → migrate → switch-worker (sleep 3 + worker_ok) → switch-api → smoke (worker_ok, so id) → record`.
- `--rollback` đi ngược: `switch_api --remove-orphans` rồi `switch_worker`.
- Runbook khớp ở 1.4, mục 4, 4.1, K1, R5 và 5.0 S3/S9.
- P2b bước 2 đếm 2 dòng `^  switch_worker --remove-orphans$` và `^  switch_api --remove-orphans$`, đúng 2 dòng 240 và 237 của P4-02.
- Thứ tự chạy runbook hợp lý: P2 → P2e → P2b (1–6) → P2c → P2d → P3 → P4 → P5. P2b bước 5 (áp lại vai) chạy **trước** bước 6 (`ops-check` gói mới) và trước khi đếm migration.

**Migration journal.**

| Số | Nhánh | idx | Kiểm |
|---|---|---|---|
| 0092 | `origin/main` | 68 | `when` 1792782173681 |
| 0093 | `v104/be-holds` | 69 | `when` …175681 |
| 0094 | `v104/be-lease-prices` | 70 | `when` …177681, `SECURITY INVOKER` |
| 0095 | P4-13, chưa có nhánh | 71 (dự kiến) | – |
| 0096 | – | – | Bỏ hẳn, runbook không nhắc lại như số dùng được |

Runbook ghi `N_V104 = 68 + số migration đã gộp`. ARC đã áp 71 migration (tới 0094) lên DB tạm, đếm ra `71` = 68 + 3. Khớp.

**0097: ARC xác nhận không cần.** Bằng chứng ở mục 3:
- Cả hai GRANT đặt được trong `02-roles.sh` vì đối tượng đã có trên DB đang chạy. `to_regclass` + `\gexec` làm câu GRANT an toàn trên volume mới.
- `ALTER DEFAULT PRIVILEGES … TO ottimo_readonly` (có từ R1) đã phủ mọi bảng `public` mà 0093–0095 tạo ra.
- `pg_dump` mang theo ACL, nên bản restore giữ quyền.

Điều kiện kèm theo:
- (i) GRANT chỉ tới DB đang chạy khi `02-roles.sh` **bản mới** thật sự chạy. Vì vậy cần P2b bước 5 cho tới khi có r1.1 (thẻ 11).
- (ii) Nếu sau này cần GRANT trên một bảng do migration mới tạo ra mà quyền mặc định không phủ (ví dụ `ottimo_requeue` trên bảng mới), GRANT đó vào **chính migration tạo bảng**. Chỉ GRANT cho đối tượng **đã có** mới để ở `02-roles.sh`. Số 0097 vẫn để dành.

## 3. Kiểm ARC đã chạy

Môi trường: worktree tạm `ce08b63a`; container `postgres:17-alpine` tạm, không cổng, dùng mật khẩu giả. Đã xóa cả hai sau khi kiểm.

| Kiểm | Kết quả |
|---|---|
| `test-ops-check.sh` / `ops-check-cwd.test.sh` / `ops-check-price.test.sh` / `test-confidential-paths.sh` / `requeue-email-changed.test.sh` | 172 / 13 / 17 / 6 / 68 passed, 0 failed |
| `check-confidential-paths.sh` trên worktree | `ok` |
| 71 migration (`main` + 0093 + 0094) chạy bằng `SET ROLE ottimo_owner`, trước khi áp lại vai | `ottimo_readonly` đọc `drizzle.__drizzle_migrations` → `permission denied for schema drizzle` (đúng ý runbook P2b) |
| P2b bước 5 đúng dạng lệnh (`bash -s < 02-roles.sh`, bỏ stderr), sau khi đã thu hồi quyền và xóa `ottimo_requeue` | `rc=0`, dòng cuối `ottimo_requeue on outbox_message: t,f,f,f,t,f`. Rồi `SQLRO`: `ottimo_readonly`, `71`. Chạy lại lần hai: `rc=0` (idempotent) |
| `ops-check.sh` **thật** (bản `ce08b63a`) gọi qua `dc` giả → `docker exec`, chạy `j16 email_dead email_missing email_changes email_ascii email_config priceswitch db_triggers` | Cả 8 `ok`. Mọi câu SQL chạy bằng `ottimo_readonly` qua dòng gác. Có `via owner: 0` và `active/locked` |
| Dòng gác: `ALTER ROLE ottimo_readonly NOBYPASSRLS` | `email_missing`, `j16` → `FAIL unexpected answer` (không ra số 0 lặng lẽ) |
| `db_triggers`: tắt 0094 / tắt `privacy_notice_version_no_truncate` / `GRANT INSERT … TO ottimo_app` | `FAIL … D\|f (must be O\|f)` / `FAIL … not enabled (D)` / `FAIL … not SELECT only` |
| `db_triggers`: **xóa** trigger 0094 sau khi 0094 đã chạy | `ok … not present yet (before migration 0094)`: sai, xem thẻ 08 |
| `ottimo_requeue`: khối `DO` UPDATE 4 cột của `requeue-email-changed.sh` trên một dòng thử | `pending\|0`; `current_user` = `ottimo_requeue`; `UPDATE … SET payload` → `permission denied` |
| Mọi câu SQL của runbook (P2, P2e, P2b bước 5, K2 + tên CHECK 0093, K3b, K9, K10, K11 b/d, R3b + `hold_expires_at`) bằng `ottimo_readonly` trên schema có **0093 + 0094** | Hết câu chạy, không `permission denied`. G5 của runbook mới thử tới 0092 |
| `email_config` so với `smtp.ts` (`v104/int-email`) | 4 ca báo `FAIL` sai: thẻ 09 |
| `ALTER ROLE … PASSWORD :'pw'` lỗi (vai không có) | stderr của psql không chép lại câu lệnh, nhưng **log máy chủ Postgres có giá trị mật khẩu** (1 dòng `STATEMENT:`). Xem thẻ 14 |

## 4. Thẻ mới

### FB-R4-ARC-OPS-P404-08
- Mức độ: Minor
- Vị trí: `ops-check.sh` `check_db_triggers` (`case "$rlp" in absent | "O|f")`); README 13.8 dòng `db_triggers`; runbook K3/K5.
- Vấn đề: `db_triggers` coi "không có `room_list_price_append_only`" là `ok … not present yet (before migration 0094)` **ở mọi lúc**. ARC đã thử trên DB đã chạy 0094: xóa trigger → `ok`. Như vậy kiểm không phát hiện đúng loại trôi cấu hình mà nó được viết ra để bắt, tức trigger ED-02 bị gỡ sau migration. Câu báo `before migration 0094` lại còn dẫn người đọc sai hướng.
- Vì sao quan trọng: ED-02 là lớp phòng thủ cho lịch sử giá niêm yết (đối chiếu báo giá), SEC đã nói "cần". Sau v1.0.4, `db_triggers` là kiểm định kỳ duy nhất của trigger này: K3 thay câu tay, còn K3b chỉ để xem khi đã `FAIL`.
- Đề xuất sửa: phân biệt "trước 0094" với "0094 đã chạy mà mất trigger".
  - Cách gọn, không cần quyền mới: thêm `to_regprocedure('public.room_list_price_append_only()') IS NOT NULL AS has_rlp_fn`. Hàm có mà trigger không có → `FAIL … room_list_price_append_only missing (function present – migration 0094 ran)`.
  - Có thể kiểm thêm `tgtype` là `BEFORE DELETE FOR EACH ROW`.
  - Thêm 2 ca test: có hàm mà không có trigger → `FAIL`; không có cả hai → `ok … not present yet`.
  - P2b bước 6 (DB 68) vẫn ra đúng dòng `ok … not present yet` như runbook ghi.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-09
- Mức độ: Minor
- Vị trí: `ops-check.sh` `check_email_config`; README 13.8; runbook P2c bước 2.
- Vấn đề: SEC điều kiện r1 số 4 đòi "cùng một luật với adapter", nhưng `email_config` lệch với `smtp.ts` (`smtpConfigFromCredentials`, nhánh `v104/int-email`) ở 3 chỗ. ARC chạy thử, cả 3 đều ra `FAIL … worker/api v1.0.4 stop at start`, trong khi adapter khởi động bình thường:
  1. **`EMAIL_SMTP_MODE` không đặt.** Compose đặt mặc định `EMAIL_SMTP_MODE: ${EMAIL_SMTP_MODE:-relay}`, và `smtp.ts` cũng mặc định `relay`. Nhưng `email_config` so `envval EMAIL_SMTP_MODE != relay`, nên `.env` không có dòng này mà `EMAIL_SMTP_USER` trống thì ra `FAIL`.
  2. **Ở `relay`, adapter không dùng `EMAIL_SMTP_USER`** (chỉ kiểm `isEmailAddress(user)` ở `app_password`). `email_config` vẫn kiểm `USER` nếu có giá trị.
  3. **Adapter `trim()` `USER` và `from` trước khi kiểm.** `email_config` không cắt khoảng trắng, nên `EMAIL_FROM=…test ` (dư một dấu cách cuối) ra `FAIL`.

  Lệch theo hướng chặt hơn nên không lọt lỗi thật. Nhưng P2c là cổng **dừng Release**. Timer cũng gửi `FAIL` mỗi 30 phút với câu báo sai ("stop at start").
- Vì sao quan trọng:
  - Chặn nhầm lượt Release sát giờ cắt 06/11.
  - Người chạy sẽ đi sửa `.env` production không cần thiết, và mỗi lần sửa là một lần có rủi ro.
  - Nếu sau đó tắt hay bỏ qua kiểm này thì mất luôn cổng của SEC V104-04.
- Đề xuất sửa (giữ một hằng `EMAIL_RULE_RE`):
  - `mode=$(envval EMAIL_SMTP_MODE)`, rỗng thì là `relay` (như compose/`smtpModeOf`). Mode khác `relay|app_password` → `FAIL EMAIL_SMTP_MODE invalid`.
  - `app_password`: `USER` bắt buộc và phải theo luật. `relay`: không kiểm `USER`, chỉ in `EMAIL_SMTP_USER ignored (relay)` khi có giá trị.
  - Cắt khoảng trắng hai đầu của `USER` và `EMAIL_FROM` trước `email_rule`, như `.trim()` của adapter. `from` = `EMAIL_FROM` đã cắt, rỗng thì lấy `USER`.
  - Thêm 4 ca test đúng 4 ca ARC đã chạy:
    - mode không đặt + `USER` trống → `ok`;
    - `relay` + `USER` không phải địa chỉ → `ok`;
    - `FROM` dư dấu cách → `ok`;
    - `FROM` dạng `Tên <địa chỉ>` → vẫn `FAIL`, vì adapter cũng từ chối (`email-adapter.ts` truyền nguyên `env.EMAIL_FROM`).
  - Chú thích mã ghi "đổi cùng `smtp.ts`".
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-10
- Mức độ: Minor
- Vị trí: runbook P2 (ý `HOLD_OVERDUE_AT_UPGRADE` và khối `SQLRO`); R4 câu cuối.
- Vấn đề:
  - (a) P2 viết "chạy câu đó ở đây một lần để có mốc". Nhưng khối SQL của P2 không có câu `reservation … hold_expires_at < now()`, và dòng "Đúng là" chỉ có `LEASE_BASE`, `HOLD_BASE`. Người chạy phải tự ghép câu từ R3b.
  - (b) R4 vẫn ghi "Các trường hợp khác: như tờ lệnh R4 của v1.0.1", trong khi 4.1 ghi "không dùng cho các ca trên" (P404-03).
- Vì sao quan trọng: runbook chạy trong lúc có sự cố. Hai câu chỉ hai hướng ngược nhau thì người chạy dễ làm sai.
- Đề xuất sửa:
  - (a) Thêm câu đó vào khối `SQLRO` của P2 sau `HOLD_BASE`. "Đúng là" thêm `HOLD_OVERDUE_AT_UPGRADE` (ghi số).
  - (b) R4: "Các trường hợp khác: mục 4.1".
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-11
- Mức độ: Minor (điều kiện gộp PR-M; tệp của P4-02)
- Vị trí: `deploy.sh` bước `roles` (`dc exec -T postgres bash /docker-entrypoint-initdb.d/02-roles.sh >/dev/null`); runbook P2b bước 5, G6, rủi ro mục 8; "Việc còn lại" #20.
- Vấn đề: phát hiện của OPS là đúng, và ARC đã kiểm lý lẽ.
  - Compose gắn **một tệp** (`./postgres/init/02-roles.sh:/docker-entrypoint-initdb.d/02-roles.sh:ro`).
  - P2b rsync bằng `rsync -a` không có `--inplace`, tức ghi tệp tạm rồi đổi tên, nên tệp mới có inode mới.
  - Postgres không được tạo lại khi deploy, nên bước `roles` chạy **bản cũ**. GRANT của P4-04 không bao giờ tự tới DB đang chạy.
  - Ngoài ra, stderr của bước này đi thẳng vào log deploy (log CI là công khai nếu repo công khai).
- **Điều kiện ARC cho r1.1:**
  1. **Nguồn tệp:** đọc tệp của stack qua stdin: `dc exec -T postgres bash -s < "$OTTIMO_HOME/infra/postgres/init/02-roles.sh"`. Dùng đường dẫn tuyệt đối từ `OTTIMO_HOME`, không dùng cwd (`deploy.sh` chạy từ `/`). Thiếu tệp hoặc tệp rỗng → `fail` **trước** `migrate`, không đổi container nào. Bảng mục 4 dòng `roles` vẫn đúng: v1.0.3 chạy nguyên.
  2. **Chứng minh đã chạy bản mới:** sau bước này, `psql_admin` đọc lại một dấu hiệu chỉ bản mới có. Ví dụ `ottimo_requeue` có trong `pg_roles`, và `has_table_privilege('ottimo_readonly','drizzle.__drizzle_migrations','SELECT')` khi bảng có. Sai → `fail "02-roles.sh applied is not the stack's copy"`. Giữ kiểm `rolconfig` H3 như hiện tại.
  3. **stderr:** không đưa dòng nào của psql hay `02-roles.sh` vào log deploy, stdout hay CI. Ghi stderr vào tệp riêng (`mktemp`, 0600, xóa khi `EXIT`). Log chỉ in một loại lỗi cố định (như `cmd_failed` của `ops-check`) và mã thoát, kèm câu "đọc lỗi bằng P2b bước 5 trong phiên riêng". Không chỉ `2>/dev/null` lặng lẽ.
  4. **Test** (trong `rollback.test.sh` hoặc test deploy của P4-02):
     - (a) `dc` giả kiểm lời gọi là `exec -T postgres bash -s` và stdin có đúng nội dung tệp của stack (so `sha256`);
     - (b) `dc` giả in ra stderr một dòng giả `LINE 1: ALTER ROLE ottimo_app … PASSWORD 'x-test-marker'` rồi thoát 1 → deploy `FAIL` ở `step=roles`, chuỗi `x-test-marker` không có trong log hay stdout, `migrate` không chạy;
     - (c) dấu hiệu bản mới thiếu → `FAIL`.
  5. **Thứ tự không đổi:** `appconfig → roles → migrate → switch-worker → switch-api`. Lượt thành công vẫn in đúng 6 dòng `[deploy`. `--rollback` cũng chạy `roles` bằng tệp của stack (vô hại với v1.0.3).
  6. **Runbook:**
     - P2b bước 5 **vẫn giữ cho v1.0.4**. Lý do: bước 6 (`ops-check`) và lệnh đếm migration ở P2b chạy **trước** Release, còn `deploy.sh` mới chỉ chạy lúc Release.
     - Sửa câu "Chạy lại bước 5 … tới khi `deploy.sh` đọc tệp của máy chủ" thành: từ gói có r1.1, bước 5 chỉ còn để có quyền trước khi kiểm ở P2b. Lúc Release, `deploy.sh` tự áp lại.
     - G6 và "Việc còn lại" #20 cập nhật theo.
  7. **Review:** `deploy.sh` có dòng SEC trong CODEOWNERS (`ce08b63a`), nên r1.1 cần tệp `SEC-on-*.md` nêu đúng đầu nhánh. Nếu sửa ở PR-A (P4-02) thì PR-A gộp trước PR-M, và runbook P2b bước 2 thêm một `grep -c "bash -s <"` cho `deploy.sh`.
- Vì sao quan trọng:
  - Nếu chỉ dựa vào bước tay, lần làm mới gói nào quên bước 5 thì `requeue-email-changed.sh` hỏng khi đang có sự cố (`permission denied`), và K2 không đếm được migration.
  - stderr có thể chép lại câu chứa mật khẩu vai vào log công khai.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-12
- Mức độ: Suggestion
- Vị trí: `ops-check.sh` `check_containers` (regex `^(true|false)\ [0-9]+$`); runbook P2b bước 6.
- Vấn đề:
  - (a) `Running=false` lúc `docker inspect` (container chết giữa `ps` và `inspect`) vẫn qua regex và không bị coi là lỗi. Khoảng thời gian này rất hẹp, lượt sau sẽ bắt được.
  - (b) Lượt đầu sau P2b không có mốc. Một container v1.0.3 tạo từ trước, đã từng khởi động lại (RestartCount > 0), sẽ ra `FAIL … since it was created`. Bảng mục 6 coi "bước 6 có `FAIL`" là **dừng**, trong khi lượt chạy kế tiếp lại `ok`.
- Đề xuất:
  - (a) `false` → `FAIL "<s> not running at inspect"`.
  - (b) P2b bước 6 ghi rõ: `FAIL containers … since it was created` của container có từ trước P2b thì ghi số, OPS đếm dòng lỗi `dc logs <service>` (chỉ đếm), ORC + OPS quyết. Không tự dừng Release nếu lượt chạy lại `ok` và không có dòng lỗi mới.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-13
- Mức độ: Suggestion
- Vị trí: runbook K10 và K11 (b) (`config_parameter … WHERE key = … AND effective_from <= current_date ORDER BY effective_from DESC LIMIT 1`).
- Vấn đề: hai câu này không lọc theo property, và dùng `current_date` của DB (UTC) thay cho ngày của property. Ràng buộc `UNIQUE (property_id, key, effective_from)` chỉ đảm bảo duy nhất **theo từng property**. Hôm nay OTTIMO chỉ có 1 property, và N3 làm trong khung 09:00–11:00 (UTC cùng ngày), nên kết quả đúng. Nhưng câu sẽ sai lặng lẽ khi có property thứ hai, hoặc khi N3 làm trước 07:00 giờ Đà Lạt.
- Đề xuất: `GROUP BY property_id` (in `property_id` dạng số thứ tự, không in tên), hoặc lọc theo property duy nhất. So ngày bằng `(now() AT TIME ZONE p.timezone)::date` như trigger 0094. P2e đã ghi chú rủi ro này; nên dùng cùng cách cho cả ba câu.
- Trạng thái: Open

### FB-R4-ARC-OPS-P404-14
- Mức độ: Suggestion (chuyển SEC quyết)
- Vị trí: `postgres/init/02-roles.sh`, khối `ALTER ROLE … PASSWORD :'migrator_pw' / :'app_pw'`.
- Vấn đề: psql thay biến ở phía client, nên câu gửi lên máy chủ chứa mật khẩu ở dạng chữ. Với `log_min_error_statement` mặc định (`error`), nếu câu đó lỗi thì Postgres ghi nguyên câu vào **log máy chủ** (`docker logs postgres`). ARC đã thử với một vai không có: log có đúng giá trị mật khẩu thử. Thẻ 11 điều kiện 3 chỉ che log của deploy, không che log của Postgres.
- Đề xuất: đầu phiên psql có mật khẩu trong `02-roles.sh` thêm `SET log_min_error_statement = panic;` (phiên superuser được đặt). Có thể kiểm thêm `SHOW log_statement` khác `ddl`/`all`. Thêm khi đang sửa `02-roles.sh` ở r1.1, hoặc dời v1.0.5 nếu SEC cho là đủ thấp.
- Trạng thái: Open

## 5. Điểm làm tốt
- Dòng gác `ro-ok` đặt trong cùng phiên với câu kiểm, và phiên nào không qua gác thì **không** được ra số. ARC đã chứng minh trên DB thật: vai mất BYPASSRLS thì kiểm `FAIL`, không ra `0` lặng lẽ. Cách này chặn đúng rủi ro "đếm 0 vì RLS".
- Vai `ottimo_requeue` có quyền tối thiểu (UPDATE theo cột), được `02-roles.sh` tự đọc lại và dừng khi khác `t,f,f,f,t,f`. Không cần migration, chạy lại an toàn.
- `check-confidential-paths.sh` chỉ dùng đường dẫn (pathspec `icase,glob` trên chỉ mục git), không giữ danh sách số, có test tự đỏ trên repo tạm. Lớp này cũng đóng luôn kẽ `.gitignore` lồng (P403-07).
