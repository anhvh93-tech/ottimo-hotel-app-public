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
| Câu READ ONLY 2 trigger PN-01 (P4-13) | Mã xong; **chờ BE-D** xác nhận tên trigger/quyền không đổi | `ops-check db_triggers` (+ 0094), runbook K3/K3b |
| README 5.0 thứ tự deploy | Done | `infra/server/README.md` mục 6.1 (README không có mục 5.0 trùng tên: đặt ở 6.1, ghi chú "plan gọi là 5.0") |
| README 12.3 luật `CONST_ROWS` + dòng SEC duyệt chữ | Done | README 12.3. Chú thích `privacy.ts`: **không** sửa (ORC giao BE) |
| README 13.8 | Done | readonly/roles, `email_config`, `db_triggers`, SENT-02 khi đổi `EMAIL_FROM`, `--owner-email` chỉ dạng hỏi |
| SEC-OPS-01 G2 CI `confidential-paths` | Done | `ci.yml`, `check-confidential-paths.sh`, test |
| Compose + env mẫu `EMAIL_SHARED_MAILBOXES` | Done | `docker-compose.prod.yml` (`x-api-env`), `server/env.production.example`, `server/env.example`, `product/.env.example` – chỉ `…@example.test` |

## Phát hiện mới, báo ORC (không sửa ở gói này)

1. **`deploy.sh` bước `roles` chạy bản cũ của `02-roles.sh`.** Compose gắn **một tệp** vào container postgres; `rsync` của P2b thay tệp bằng inode mới; container postgres không được tạo lại khi deploy, nên vẫn thấy tệp cũ. Hệ quả: GRANT mới của P4-04 không tự tới DB đang chạy. Runbook bù bằng P2b bước 5 (áp lại qua stdin từ tệp trên máy chủ, đã thử trên Postgres tạm), cả staging (S0). Sửa gốc: `deploy.sh` dòng `dc exec -T postgres bash /docker-entrypoint-initdb.d/02-roles.sh` → đọc tệp của máy chủ qua stdin. Tệp thuộc P4-02 (PR #45): ORC quyết giao P4-02 hay v1.0.5.
2. **stderr của `02-roles.sh` trong log deploy.** Khi một câu `ALTER ROLE … PASSWORD :'…'` lỗi, psql có thể in lại câu đã thay giá trị (dòng `LINE n:`), và log deploy của CI là công khai nếu repo công khai. Khả năng thấp (vai được tạo ngay trước đó), nhưng nên che stderr ở bước `roles`. P2b bước 5 của runbook đã bỏ stderr. Báo SEC + P4-02.
