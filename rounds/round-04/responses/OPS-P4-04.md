# OPS phản hồi – P4-04 `v104/ops-check` (PR-M): runbook v1.0.4 r1 + phần mã

- Tác giả: OPS · Round 4 (v1.0.4), bước **Sản xuất** + **Phản hồi & sửa** · 04/11/2026
- Review được trả lời:
  - `rounds/round-04/reviews/ARC-on-v104-p4-04.md` (FB-R4-ARC-OPS-P404-01…07);
  - `rounds/round-04/reviews/SEC-on-v104-ops-check.md` (5 điều kiện r1, FB-R4-SEC-OPS-P404-01, S1, S2);
  - các thẻ ORC giao thêm trong lượt: ARC P402-01 (cách `worker_ok`), P403-03/04/07/09, P410-02, P411-02; SEC P403-02 (`SEC-on-v104-ops-scripts.md` 5.2).
- Nhánh: `v104/ops-check`, rebase lên `origin/main` @ `7bd0a938`, rồi **gộp** `origin/v104/ops-scripts` @ `c893c3ea` (PR #46, SEC ĐẠT) vì SEC P403-02 sửa hai tệp chỉ có trên PR #46. Khi PR #46 vào `main`, OPS rebase lại: commit gộp này tự rơi ra, không còn xung đột (đã thử: gộp sạch, kể cả `requeue-email-changed.sh`).
- **Đường dẫn SEC đã đổi trong nhánh:** `.github/workflows/ci.yml`, `.github/CODEOWNERS`, `.github/pull_request_template.md`, `product/infra/postgres/init/02-roles.sh`, `product/infra/server/bin/requeue-email-changed.sh`, `product/infra/docker-compose.prod.yml`, `product/infra/ci/check-confidential-paths.sh` (mới). Gộp cần tệp `SEC-on-*.md` nêu đúng đầu nhánh.

## Kiểm đã chạy (Mac, Docker Desktop)

| Kiểm | Kết quả |
|---|---|
| shellcheck 0.10.0 `-x -S warning`, đủ danh sách của CI (gồm 2 tệp mới) | sạch (rc 0) |
| `product/infra/ci/test-ops-check.sh` | 172 passed, 0 failed |
| `product/infra/server/test/ops-check-cwd.test.sh` | 13 passed |
| `product/infra/server/test/ops-check-price.test.sh` | 17 passed |
| `product/infra/server/test/requeue-email-changed.test.sh` (sau khi gộp PR #46) | 68 passed |
| `product/infra/server/test/rollback.test.sh` | 16 passed |
| `product/infra/server/test/mail-test-send.test.sh` (sau khi gộp PR #46) | 37 passed |
| `product/infra/ci/test-confidential-paths.sh` (mới) | 6 passed |
| `product/infra/ci/check-confidential-paths.sh` trên worktree thật | `ok`; **thử đỏ**: ép thêm (`git add -f`) một tệp mẫu `00-brief/context/pricing/red-test-placeholder.md` (nội dung giả) → `FAIL – 1 tracked file(s) …`, `EXIT 1`; `git rm --cached` + xóa tệp → `ok`, `EXIT 0`. Không commit, không push tệp mẫu |
| `product/infra/ci/check-compose.sh` | OK |
| `02-roles.sh` trên Postgres 17 tạm (2 lần, idempotent) | rc 0; `ottimo_requeue on outbox_message: t,f,f,f,t,f`; vai requeue chạy được khối UPDATE 4 cột, bị từ chối `UPDATE payload` và `DELETE` |
| Mọi câu SQL của runbook, chạy bằng `ottimo_readonly` (`PGOPTIONS` như `SQLRO`) trên 69 migration của `origin/main` | hết câu chạy, không `permission denied`; dòng đầu `on`, `ottimo_readonly` |
| `ci.yml` parse YAML | `publish-images.needs` có `confidential-paths` |
| Mẫu migration mới của SEC P403-02 trên 69 migration | 46/69 tệp khớp (trùng số SEC đếm) |

## Thẻ ARC (`ARC-on-v104-p4-04.md`)

| Thẻ | Mức | Trạng thái | Đã làm |
|---|---|---|---|
| FB-R4-ARC-OPS-P404-01 | Minor | Done | Q1, Q2, Q4 đóng bằng câu trả lời của ARC/BE-B (bảng 0.1, 1.3 dòng 0093, 1.4, mục 5 "Hệ quả", 5.0 S5/S7, mục 8). R3b/S5 dùng đúng câu `count(*)` ARC đề xuất (5 mẫu của `STAFF_EMAIL_TEMPLATES`), đúng là `0`, khác thì dừng + báo ARC + INT. S5 giữ "0 `dead BAD_TEMPLATE` mới". "Việc còn lại" #25: lúc cắt so lại danh sách mẫu với `email-templates.ts` ở `SHA_V104` |
| FB-R4-ARC-OPS-P404-02 | Minor | Done | Không có migration GRANT: cả hai quyền nằm ở `02-roles.sh` (chạy lại trước `migrate` mỗi lần deploy). Runbook mục 0 và 1.3: "0096 không dùng lại; 0097 để dành, không cần". ORC sửa dòng 109 của plan khi ghi decision-log |
| FB-R4-ARC-OPS-P404-03 | Minor | Done | Mục 4.1 mới "Quay lui (R4) lỗi giữa chừng": mọi ca bắt đầu bằng K1 + K2 chỉ đọc + `tail deploy-history.log`, mọi ca báo INV; (a) `switch-api`: không chạy worker cũ, chạy lại R4 một lần, vẫn lỗi → R8; (b) `switch-worker`: chạy lại R4; (c) `smoke`: ORC + ARC quyết. Ghi rõ không dùng tờ R4 v1.0.1 cho các ca này |
| FB-R4-ARC-OPS-P404-04 | Minor | Done | Mã: `ops-check containers` so id container + `RestartCount` với lần trước (`state/ops-check/containers.restarts`), container mới phải ở 0, cùng cách `worker_ok` của P4-02 @ `051e1750`; test 6a–6f. Runbook: K4b `WORKER_STATE` (`docker inspect` `Running RestartCount`) đúng là `true 0` + `ops-check containers`; R6, S3, S4, S9 dùng cùng kiểm |
| FB-R4-ARC-OPS-P404-05 | Minor | Done | "Việc còn lại" thành bảng 27 dòng (việc, thẻ, tệp, trạng thái), đủ mục "Việc"/"Tiêu chí đạt" của dòng P4-04 và các dòng ORC 04/11 |
| FB-R4-ARC-OPS-P404-06 | Suggestion | Done | Đầu tệp: `a183b82d` = r0.4; bản này = r1 |
| FB-R4-ARC-OPS-P404-07 | Suggestion | Done | P2, P2b bước 2 và S0 in `docker compose version --short`; khác bản thì K1 production thành kiểm bắt buộc (bảng dừng mục 6). S9: worker sớm hơn api ít nhất 3 giây (P4-02 ngủ 3 giây giữa hai bước, và `smoke` của P4-02 đã so id container worker nên lượt lên `ok` đã chứng minh worker không bị tạo lại) |

## Điều kiện và thẻ SEC (`SEC-on-v104-ops-check.md`)

| Mục | Trạng thái | Đã làm |
|---|---|---|
| Điều kiện r1 số 1 – `SQLRO` và kiểm DB của `ops-check` bằng `ottimo_readonly` READ ONLY | Done | `ops-check` `psql_ro`: `PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly"`, dòng gác đầu tiên phải ra `ro-ok` (`current_user = ottimo_readonly`, `transaction_read_only = on`, BYPASSRLS, không superuser), không thì `FAIL unexpected answer`. `psql_admin` bỏ khỏi `ops-check`. Runbook `SQLRO` cùng cách, thêm `SELECT current_user` (phải `ottimo_readonly`). `requeue-email-changed.sh`: đọc bằng `ottimo_readonly`, câu ghi duy nhất bằng vai mới `ottimo_requeue` (`SELECT` + `UPDATE (status, attempts, next_attempt_at, last_error)`), `02-roles.sh` đọc lại quyền và dừng nếu khác `t,f,f,f,t,f` |
| Điều kiện r1 số 2 – CI `confidential-paths` có và đã thử đỏ | Done trên nhánh | Job mới `confidential-paths` (tự test rồi kiểm), `publish-images` cần job này. Chỉ theo đường dẫn (`00-brief/context/pricing/**`, `*ottimo_pricing_spec*`, không phân biệt hoa thường), không danh sách số, chỉ in đường dẫn. Thử đỏ tại máy (bảng kiểm trên). "Có trên `main`" đạt khi PR-M gộp |
| Điều kiện r1 số 3 – R3b/S5 chỉ `count(*)` | Done | Câu của ARC P404-01; chỉ đọc khóa `template`, không chọn `payload` |
| Điều kiện r1 số 4 – luật địa chỉ chung trong `ops-check` | Done | Hằng `EMAIL_RULE_RE` dùng cho SQL `email_ascii` và hàm `email_rule` của kiểm mới `email_config` (`EMAIL_FROM`, `EMAIL_SMTP_USER`, từng mục `EMAIL_SHARED_MAILBOXES`, biến trên nhiều dòng). Test so luật với các ca của INT `email-address.ts`. Runbook P2c bước 2 và P2d bước 3 gọi `ops-check email_config`, bỏ regex shell riêng. `email_ascii` > 0 nay là `FAIL` |
| Điều kiện r1 số 5 / FB-R4-SEC-OPS-P404-01 – câu 0094 | Done | 1.3, mục 5, R7: dịch vụ so ngày **kinh doanh**, trigger so ngày **lịch**; ca chặn duy nhất là hủy giá hẹn của đúng ngày lịch hôm nay trong khung 00:00 → giờ đổi ngày kinh doanh; v1.0.3 ra 500 chung, v1.0.4 ra 409 (BE-C P411-01); dòng giá đầu ở tương lai không bị chặn; cách làm: chờ qua giờ đổi ngày rồi đặt giá mới |
| FB-R4-SEC-OPS-P404-S1 – bản sao `.env` | Done | K5b: sau khi đạt, xóa các `state/env.before-shared-mailboxes.<hôm nay>-*`, in `BACKUPS` sau khi xóa, không in nội dung; ghi vào phần Ghi nhận |
| FB-R4-SEC-OPS-P404-S2 – ảnh S16 | Done | S16: "Ảnh chỉ commit sau khi QA kiểm che" |
| FB-R4-SEC-OPS-P403-02 (`SEC-on-v104-ops-scripts.md` 5.2) | Done | CODEOWNERS (c) và mẫu PR: đúng lệnh SEC 5.2 (a) (bỏ dòng `--`, `(CREATE\|ALTER\|DROP\|SET)[[:space:]]+ROLE`); thêm dòng SEC cho `deploy.sh`, `rollback.sh`, `requeue-email-changed.sh` (5.2 b). OPS thêm `product/infra/ci/check-confidential-paths.sh` (cổng G2: sửa danh sách đường dẫn là tắt cổng) – SEC xem có giữ không |

## Việc ORC giao thêm

| Việc | Thẻ | Trạng thái | Đã làm |
|---|---|---|---|
| `containers` RestartCount như `worker_ok` | ARC P402-01 / P404-04 | Done | Xem P404-04 |
| `setup-node` trong `ci.yml` | ARC P403-04 | Done | `actions/setup-node` ghim SHA (`# v7.1.0`), `node-version-file: product/.nvmrc` (22) cho job `infra-scripts` |
| S14 hai lượt `--send` | ARC P403-03, P403-09 | Done | S14 ba lượt: `--verify-only`; `--send` với `thu.nghiem@example.test` → `EMAIL_PROVIDER is not smtp`; `--send` với `thu,nghiem@example.test` → `address on stdin is missing or invalid` (đối chứng). Ghi rõ dòng rỗng bị chặn trên Mac, không chứng minh gì. Có lệnh chạy từ `git archive ⟨SHA_V104⟩` |
| Hold quá hạn trước khi lên bản | ARC P410-02 | Done | Một câu ở P2 và 5.0 (chỉ hiện ở Cần chú ý, không có dòng hộp thư; không phải BUG-R3-041); R3b thêm câu đếm READ ONLY `HOLD_OVERDUE_AT_UPGRADE`. Không đổi mã |
| Ghi chú QA MutableClock + 0094 | ARC P411-02 | Done | `product/tests/README.md` (đoạn mới sau bảng) và runbook 5.0: không hủy giá hẹn khi đồng hồ staging đang lùi |
| Nested `.gitignore` của bảng nội bộ | ARC P403-07 | Done (lớp CI) | CI `confidential-paths` bắt mọi tệp **được track** ở đường dẫn bảng nội bộ, dù `.gitignore` nào mở lại |

## Các mục của dòng P4-04 trong plan

| Mục | Trạng thái | Tệp |
|---|---|---|
| PR32-02 (b) `via owner: <n>` | Done | `ops-check.sh`, test, README 13.8 (nhánh F1/F2, "chủ đầu tư") |
| PR30-08 `email_missing` gồm `locked` | Done | `ops-check.sh`, test, README 13.8 |
| PR32-S1 + PR30-09 kiểm DB bằng `ottimo_readonly` READ ONLY, câu trả lời không đúng dạng → `FAIL` | Done | `ops-check.sh` (dòng gác, kiểm dạng từng dòng cho `j16`), test |
| Vai requeue chỉ `SELECT` + `UPDATE` 4 cột | Done | `02-roles.sh`, `requeue-email-changed.sh`, test |
| Câu READ ONLY 2 trigger PN-01 (P4-13) | Xong. BE-D xác nhận 04/11 tên trigger/quyền không đổi (mục r1.1) | `ops-check db_triggers` (+ 0094), runbook K3/K3b |
| README 5.0 thứ tự deploy | Done | `infra/server/README.md` mục 6.1 (README không có mục 5.0 trùng tên: đặt ở 6.1, ghi chú "plan gọi là 5.0") |
| README 12.3 luật `CONST_ROWS` + dòng SEC duyệt chữ | Done | README 12.3. Chú thích `privacy.ts`: **không** sửa (ORC giao BE) |
| README 13.8 | Done | readonly/roles, `email_config`, `db_triggers`, SENT-02 khi đổi `EMAIL_FROM`, `--owner-email` chỉ dạng hỏi |
| SEC-OPS-01 G2 CI `confidential-paths` | Done | `ci.yml`, `check-confidential-paths.sh`, test |
| Compose + env mẫu `EMAIL_SHARED_MAILBOXES` | Done | `docker-compose.prod.yml` (`x-api-env`), `server/env.production.example`, `server/env.example`, `product/.env.example` – chỉ `…@example.test` |

## Phát hiện mới, báo ORC (r1; ORC đã quyết sửa ở r1.1, xem mục dưới)

1. **`deploy.sh` bước `roles` chạy bản cũ của `02-roles.sh`.** Compose gắn **một tệp** vào container postgres; `rsync` của P2b thay tệp bằng inode mới; container postgres không được tạo lại khi deploy, nên vẫn thấy tệp cũ. Hệ quả: GRANT mới của P4-04 không tự tới DB đang chạy. Runbook bù bằng P2b bước 5 (áp lại qua stdin từ tệp trên máy chủ, đã thử trên Postgres tạm), cả staging (S0). Sửa gốc: `deploy.sh` dòng `dc exec -T postgres bash /docker-entrypoint-initdb.d/02-roles.sh` → đọc tệp của máy chủ qua stdin. Tệp thuộc P4-02 (PR #45): ORC quyết giao P4-02 hay v1.0.5.
2. **stderr của `02-roles.sh` trong log deploy.** Khi một câu `ALTER ROLE … PASSWORD :'…'` lỗi, psql có thể in lại câu đã thay giá trị (dòng `LINE n:`), và log deploy nhận nguyên stderr. **Sửa lại ở r1.1 (SEC P404R1-02 c):** log deploy **không** công khai: `deploy-from-ci.sh` chỉ trả một dòng về Actions, log đủ nằm ở `state/deploy-logs/ci-*.log` (0600, giữ 30 tệp) trên máy chủ. Rủi ro thật là mật khẩu nằm trong log **trên máy chủ** (log đó và log container postgres, có thể vào bộ sao lưu). P2b bước 5 của runbook đã bỏ stderr. Báo SEC + P4-02.

## r1.1 (ORC 04/11: sửa gốc phát hiện (a)(b) trên nhánh này, không sửa PR #45; gộp thẻ SEC `SEC-on-v104-p4-04-r1.md` và ARC `ARC-on-v104-p4-04-r1.md`)

- Đầu nhánh trước r1.1: `ce08b63a` (bản SEC/ARC đã review). **Không** rebase lại phần đã có. Phần chênh `ce08b63a..<r1.1>` gồm:
  - `de2355dd`: gộp `origin/v104/ops-deploy-order` @ `051e1750` (PR #45, cách gộp như PR #46). Gộp sạch, không xung đột. Commit này rơi ra khi rebase, sau lúc PR #45 vào `main`;
  - `56439561` và `045e74b9`: bản r1.1 đầu theo hướng "lọc stderr". **Đã bỏ** theo SEC ("bỏ hướng lọc"); commit cuối thay toàn bộ;
  - commit cuối của r1.1: mã, test, runbook, README và tệp này. Đầu nhánh ghi ở báo cáo trả ORC.
- SEC review: `git diff ce08b63a <r1.1>`, trừ phần của PR #45 (`git diff 051e1750 <r1.1> -- product/infra/server/bin/deploy.sh` chỉ ra bước `roles`).
- Đường dẫn SEC đổi trong r1.1:
  - `product/infra/server/bin/deploy.sh`: bước `roles`;
  - `product/infra/postgres/init/02-roles.sh`: `SET log_*` và chú thích;
  - `product/infra/server/bin/requeue-email-changed.sh`: **chỉ chú thích** (S1);
  - `.github/CODEOWNERS` và `.github/pull_request_template.md`: thẻ 01.
- Không đụng `.github/workflows`, `docker-compose.prod.yml`, `check-confidential-paths.sh` hay đường dẫn SEC nào khác. Dòng trả về của `deploy-from-ci.sh` vẫn đúng một dòng: tệp không đổi, test (h) có kiểm.

### Bước `roles` của `deploy.sh` sau r1.1

1. `postgres` lên.
2. Kiểm tệp `$OTTIMO_HOME/infra/postgres/init/02-roles.sh`: có, đọc được, không rỗng. Sai một điều → `FAIL: … missing, empty or unreadable`, dừng ở `step roles`, chưa `exec` lần nào.
3. Chạy `dc exec -T postgres bash -s < tệp`:
   - stdout → `/dev/null`;
   - stderr → tệp `mktemp`, tạo trong `umask 077` (0600) và xóa ngay sau lệnh. Tệp không bao giờ được in, chép hay ghi log.
   - Mật khẩu vẫn lấy từ `*_FILE` **trong** container, không qua `-e` hay đối số.
4. Lệnh lỗi → log in **một câu cố định**: `FAIL: 02-roles.sh failed (rc=N) – output withheld; re-run it by hand on the server (runbook v1.0.4 P2b step 5) to see the error`.
5. `psql_admin` (đã chuyển lên trước bước này) đọc lại dấu hiệu chỉ bản v1.0.4 có, bằng SQL hằng: số `ottimo_requeue` trong `pg_roles`, và `has_table_privilege('ottimo_readonly','drizzle.__drizzle_migrations','SELECT')` (hoặc `absent` khi chưa có bảng).
   - Đúng: `1,true` hoặc `1,absent` (volume mới).
   - Khác → `FAIL: 02-roles.sh applied is not the stack's copy (v1.0.4 markers: …, want 1,true)`, dừng trước `migrate`.
6. Thành công: một dòng `02-roles.sh applied from the infra bundle (ottimo_app limits verified by the script; v1.0.4 markers 1,true)`.

Giữ nguyên:
- thứ tự `appconfig → roles → migrate → switch-worker → switch-api`;
- 6 dòng `[deploy` cho lượt thành công;
- các kiểm của script (`t,f,f,f,t,f`, H3 `rolconfig`): script `exit 1` khi lệch, nên deploy dừng ở `step roles`;
- `--rollback` dùng cùng bước, đọc tệp của gói.

### Điều kiện SEC r1.1 (mục 2) và thẻ SEC

| Mục | Phản hồi | Tệp / test |
|---|---|---|
| ĐK 1: stdin từ `$OTTIMO_HOME`, thiếu tệp thì dừng, mật khẩu chỉ từ `*_FILE` | Xong (bước 1–3 ở trên). Không còn lời gọi `/docker-entrypoint-initdb.d` | `deploy.sh`; `rollback.test.sh` (p), (q) thiếu tệp, (q) tệp rỗng |
| ĐK 2: không dòng stderr nào vào log, kể cả đã lọc; câu cố định + rc; dừng ở `step roles`; giữ `t,f,f,f,t,f` và H3 | Xong. Bỏ hướng lọc của `56439561`, không in dòng nào của script | `deploy.sh`; `rollback.test.sh` (q) |
| ĐK 3 / thẻ 02 (a): `SET log_min_error_statement = panic` trước hai câu `PASSWORD`, có test | Xong. Thêm cả `SET log_statement = 'none'` và `SET log_min_duration_statement = -1`, ở đầu heredoc có `PASSWORD`. Kiểm tĩnh (r): ba dòng `SET` đứng trước mọi `PASSWORD :'` trong cùng heredoc; thử đột biến (xóa dòng) thì đỏ. Đã thử trên Postgres 17-alpine tạm: câu `ALTER ROLE <không có> PASSWORD :'pw'` lỗi → không có `SET`: giá trị thử có trong `docker logs` (1 dòng); có `SET`: 0 dòng. `02-roles.sh` thật chạy đủ, log không có mật khẩu thử | `02-roles.sh`; `rollback.test.sh` (r) |
| ĐK 4: test deploy SENTINEL (i) (ii) (iii) | Xong. `02-roles.sh` giả in `ALTER ROLE x PASSWORD 'SENTINEL…'` ra stderr, thêm một dòng SENTINEL ra stdout, rồi thoát 1. (i) SENTINEL, `password`, `does not exist` không có trong đầu ra `deploy.sh`, trong dòng `deploy-from-ci.sh` trả về CI, hay trong `state/deploy-logs/ci-*.log`. (ii) `step=roles`, không đổi container, `migrate` không chạy. (iii) stdin trùng tệp của gói (`cmp`, `sha256`), không có lời gọi `initdb` | `rollback.test.sh` (q); `test-deploy-from-ci.sh` (h) |
| ĐK 5 / thẻ 01: mở rộng luật migration | Xong, đúng nguyên văn lệnh của SEC ở cả CODEOWNERS (c) và mẫu PR. Câu mẫu PR thêm `SET LOCAL ROLE`, `RESET ROLE`, `SET SESSION AUTHORIZATION`, `session_replication_role`, `OWNER TO` và ghi "chỉ để nhắc". Đã thử: vẫn 46/69 migration; 4 dòng thử của SEC đều khớp; dòng `--` và dòng `+++` không khớp | `.github/CODEOWNERS`, `.github/pull_request_template.md` |
| ĐK 6: runbook | P2b bước 5 vẫn giữ, có đoạn "Khi nào hết cần bước 5": từ khi máy đó có `deploy.sh` v1.0.4 **và** đã chạy xong một lượt deploy bằng nó. Staging S0 làm y như vậy. Câu rủi ro mục 8 viết lại: log **trên máy chủ** (log container postgres, `state/deploy-logs` 0600, có thể vào bộ sao lưu), không phải log Actions. Câu sai "log CI công khai" ở mục "Phát hiện mới" của tệp này cũng đã sửa | runbook P2b bước 5, mục 8; tệp này |
| ĐK 7: không đổi đường dẫn SEC nào khác | Đúng. Chỉ các đường dẫn đã kê ở đầu mục. `requeue-email-changed.sh` chỉ đổi chú thích, theo thẻ S1 | – |
| ĐK 8: nêu đầu nhánh | Đầu nhánh ở báo cáo trả ORC. Phần chênh là `ce08b63a..<r1.1>` | – |
| Thẻ 02 (b), (c) | (b) = ĐK 2. (c) = ĐK 6 | – |
| Thẻ S1: `-c role=` không phải ranh giới | Đã sửa chú thích ở `requeue-email-changed.sh`, `02-roles.sh` (`ottimo_requeue`), đầu `ops-check.sh` và README 13.8: chặn **lỗi vô ý**, không chặn SQL đặt lại vai. Kiểm tĩnh `role_escape_re` ở `test-ops-check.sh` và `requeue-email-changed.test.sh`: không có `SET [LOCAL\|SESSION] ROLE`, `RESET ROLE`, `SESSION AUTHORIZATION`, `set_config('role'`, `transaction_read_only = off`, `READ WRITE` (bỏ qua dòng chú thích). Thử đột biến (thêm một câu) thì đỏ | `requeue-email-changed.sh`, `ops-check.sh`, `02-roles.sh`, README; hai test |
| Thẻ S2: `confidential-paths` là required check | Việc của ORC (bước kiểm trước gộp) và INV (cài đặt nhánh). OPS không đổi gì, chỉ ghi lại để ORC theo dõi | – |

### Thẻ ARC (`ARC-on-v104-p4-04-r1.md`)

| Thẻ | Phản hồi | Tệp / test |
|---|---|---|
| 08 `db_triggers` báo nhầm "not present yet" | Xong. Câu SQL đọc thêm `to_regprocedure('public.room_list_price_append_only()')`. Chỉ khi **cả** hàm lẫn trigger chưa có mới ra `ok … not present yet (before migration 0094)`. Có hàm mà mất trigger → `FAIL … room_list_price_append_only missing (function present – migration 0094 ran)`. Thêm kiểm trigger là `BEFORE DELETE … FOR EACH ROW` (`tgtype & 11 = 11`); sai → `FAIL … (must be O\|f\|t)`. Thiếu dòng `rlpfn` → `unexpected answer`. Đã chạy câu thật trên Postgres 17 tạm cho 3 trạng thái: chưa có gì `rlpfn\|f`; có hàm `rlpfn\|t` và không dòng `rlp`; đủ `rlp\|O\|f\|t` | `ops-check.sh`; `test-ops-check.sh` (3 ca mới); runbook P2b bước 6; README 13.8 |
| 09 `email_config` khớp `smtp.ts` | Xong. `EMAIL_SMTP_MODE` được cắt khoảng trắng, trống = `relay`, chế độ khác `relay\|app_password` → `FAIL … EMAIL_SMTP_MODE invalid`. `USER` và `FROM` cắt khoảng trắng như adapter; `FROM` trống thì lấy `USER`. `relay` không cần `USER`, có đặt thì ghi `(EMAIL_SMTP_USER ignored in relay)`. `app_password` cần `USER` theo luật. Dòng `ok` ghi rõ chế độ. Test: 4 ca của ARC (mode trống + không USER; relay + không USER; app_password + không USER; khoảng trắng hai đầu) cùng mode lạ và relay không FROM | `ops-check.sh`; `test-ops-check.sh`; runbook P2b bước 6, P2c bước 2, P2d bước 3; README 13.8 |
| 10 runbook P2 / R4 / P410-02 | Xong. (a) Khối `SQLRO` của P2 thêm câu `reservation … status = 'hold' AND hold_expires_at < now()` sau `HOLD_BASE`. "Đúng là" thêm `HOLD_OVERDUE_AT_UPGRADE`. Câu P410-02 còn sót viết lại: câu cuối của khối đếm số đó (mốc lúc lên bản), R3b chạy lại câu này khi quay lui. (b) R4: "Các trường hợp khác: mục 4.1", ghi rõ tờ lệnh R4 v1.0.1 không dùng | runbook P2, R4 |
| 11 `deploy.sh` bước `roles` | Xong, theo cả 7 điều kiện (xem "Bước roles" ở trên). (1) stdin, thiếu/rỗng → dừng trước `migrate`. (2) Dấu hiệu v1.0.4 đọc lại; thiếu → `FAIL "02-roles.sh applied is not the stack's copy"`. Đã chạy câu thật trên Postgres tạm: `0,absent` / `1,false` / `1,true` đúng từng trạng thái. (3) stderr vào `mktemp` 0600 rồi xóa, log chỉ có câu cố định + rc và lời dẫn tới P2b bước 5. Tệp tạm xóa ngay sau lệnh, không chờ `EXIT`: không thêm `trap` vào `deploy.sh` (tệp của PR #45), và tệp không sống lâu hơn lệnh. (4) Test: (a) sha256 của stdin = tệp của gói; (b) SENTINEL và mật khẩu giả không lọt, `migrate` không chạy; (c) dấu hiệu thiếu (`0,true`, `1,false`, `0,absent`, rỗng) → `FAIL` ở `step roles`, không `migrate`, không đổi container; `1,absent` đi tiếp với 6 dòng `[deploy`. (5) Thứ tự và 6 dòng giữ nguyên; `--rollback` dùng cùng bước. (6) Runbook: P2b bước 5 giữ cho v1.0.4, chỉ để có quyền trước các kiểm của P2b; lúc Release `deploy.sh` tự áp lại. G6 và "Việc còn lại" #20 đã cập nhật. (7) Sửa trên nhánh này (ORC chốt), không sửa PR-A. Cần tệp `SEC-on-*.md` cho đầu r1.1 | `deploy.sh`; `rollback.test.sh` (p), (q), (s); `test-deploy-from-ci.sh` (h); runbook P2b bước 5, G6, mục 8, #20; README 13.8 |
| 12 (a) `Running=false` lúc `inspect` | Xong (nhỏ). `check_containers` ghi `FAIL … <s> not running at inspect`. Test 6g | `ops-check.sh`; `ops-check-cwd.test.sh` 6g |
| 12 (b) lượt đầu không có mốc | Xong (chỉ runbook). P2b bước 6: dòng `FAIL … since it was created` ở lượt đầu thì ghi số N, OPS **đếm** dòng lỗi `dc logs --since 24h <service>` (không đọc, không chép), rồi chạy lại bước 6. Lượt chạy lại `ok` và không có dòng lỗi mới → ORC + OPS ghi quyết định vào decision-log và đi tiếp. `not running at inspect` luôn dừng | runbook P2b bước 6 |
| 13 K10 / K11 (b) theo property và tz | **Dời v1.0.5.** Sửa cho đúng cần đổi 3 câu (K10, K11 b, P2e), chạy lại trên schema `SHA_V104` và đổi các dòng "Đúng là". Việc này lớn hơn mức "nhỏ" của Suggestion, trong khi kết quả hôm nay vẫn đúng (1 property, N3 làm 09:00–11:00 giờ Đà Lạt). Runbook K10 và K11 (b) đã ghi rõ giới hạn: chỉ đúng khi có **một** property và chạy sau 07:00 giờ Đà Lạt (ARC P404-13, sửa ở v1.0.5) | runbook K10, K11 (b) |
| Điều kiện ARC (3) cũ / "Việc còn lại" #8: xác nhận P4-13 | **Đã nhận (ORC 04/11).** BE-D xác nhận: P4-13 (`v104/be-pn01` @ `3c2b17bb`, migration 0095, journal idx 71) chỉ `CREATE OR REPLACE` thân hàm, **không** đổi tên trigger hay quyền. Hai trigger giữ nguyên: `privacy_notice_version_append_only` (`BEFORE UPDATE OR DELETE`, `FOR EACH ROW`) và `privacy_notice_version_no_truncate` (`BEFORE TRUNCATE`, `FOR EACH STATEMENT`), cả hai `tgenabled = 'O'`, cùng trỏ hàm `privacy_notice_version_append_only()` chủ `ottimo_owner`. `ottimo_app` chỉ `SELECT`. Câu `db_triggers` dùng nguyên được: câu đọc tên + `tgenabled` của hai trigger và 5 cờ `SELECT,INSERT,UPDATE,DELETE,TRUNCATE` (`t,f,f,f,f`). Bộ 6 cờ của BE-D có thêm một cờ: cùng kết luận "chỉ `SELECT`". Thẻ 08 không cần đọc journal: phân biệt "chưa chạy 0094" và "0094 đã chạy mà mất trigger" bằng chính hàm của 0094, nên idx 71 của 0095 không ảnh hưởng | runbook 1.3 dòng "Câu kiểm 2 trigger PN-01", "Việc còn lại" #8 |
| 14 `log_min_error_statement` | SEC quyết làm ngay. Đã làm (= SEC ĐK 3) | `02-roles.sh`; `rollback.test.sh` (r) |

### Kiểm lại r1.1

| Kiểm | Kết quả |
|---|---|
| shellcheck 0.10.0 `-x -S warning`, đủ danh sách CI | sạch (rc 0) |
| `rollback.test.sh` (Mac và `ubuntu:24.04`) | 37 passed, 0 failed (trước r1.1: 27 sau khi gộp P4-02; thêm (p) sha256, (q) ×3, (r), (s) ×5) |
| `test-deploy-from-ci.sh` (`ubuntu:24.04`, có `flock`, `jq`) | rc 0, 44 `ok` (thêm (h)). Trên Mac đỏ ở bước `lock` vì không có `flock`, cả trước r1.1: không do r1.1 |
| `test-ops-check.sh` | 183 passed, 0 failed (172 → 183: ARC 08, 09, SEC S1) |
| `requeue-email-changed.test.sh` | 69 passed (68 → 69: SEC S1) |
| `ops-check-cwd.test.sh` | 14 passed (13 → 14: ARC 12 a) |
| `ops-check-price` / `mail-test-send` / `test-confidential-paths` / `deploy-landing-privacy` / `restore-drill-privacy` / `backup-privacy-log` (ubuntu) | 17 / 37 / 6 / 28 / 8 / 5 passed, 0 failed |
| `check-compose.sh` | OK |
| Postgres 17-alpine tạm (đã dừng, `--rm`) | `log_min_error_statement = panic`: 0 dòng có mật khẩu thử trong log container (không có `SET`: 1 dòng). Câu dấu hiệu v1.0.4 và câu `db_triggers` chạy đúng ở từng trạng thái |
| Quét phần chênh | Không khóa, mật khẩu, IP, email thật hay digest đầy đủ. Giá trị thử chỉ là `SENTINEL-R11-*` và `…@example.test` |
