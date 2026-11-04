# OPS – trả lời review P4-03 `v104/ops-scripts`

- Round 4 (v1.0.4), bước **Phản hồi & sửa**, 04/11/2026.
- Review: `rounds/round-04/reviews/ARC-on-v104-p4-03.md` (ARC @ `659e1774`), `rounds/round-04/reviews/SEC-on-v104-ops-scripts.md` (SEC @ `659e1774`).
- Bản sửa: commit trên `v104/ops-scripts`, nối tiếp `659e1774` (không rebase, để giữ commit đã review; `git merge-tree` với `origin/main` sạch theo ARC mục 2).
- Nhánh này sửa `.github/CODEOWNERS`, mẫu PR, `mail-test.sh`/`.mjs`: đều là đường dẫn SEC. Đầu nhánh mới cần SEC xác nhận lại (V104-05); `mail-test.mjs` cần INT xác nhận lại.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-P403-01 | Done | `.github/CODEOWNERS` thêm dòng SEC (mỗi nhóm có chú thích vai): `/.github/workflows/` (gồm `ci.yml`, cả `release.yml`), `/.github/gitleaks.toml`, `/.gitignore`, `/product/infra/postgres/init/02-roles.sh`, `/product/infra/server/bin/mail-test.sh`, `/product/infra/server/mail-test.mjs`. Hệ quả đã biết: PR-M (P4-04, sửa `ci.yml`, `02-roles.sh`) cần `SEC-on-*.md` |
| FB-R4-SEC-OPS-P403-01 | Done | Cùng bản sửa trên (đủ 4 dòng SEC nêu, thêm 2 dòng `mail-test` theo ARC). Chú thích đầu tệp thêm ý (c) cho ORC: migration mới có `DISABLE TRIGGER`, `GRANT` hoặc `REVOKE` cần `SEC-on-*.md`, kiểm bằng `git diff <base>...<head> -- '**/migrations/*.sql' \| grep -E '^\+.*(DISABLE TRIGGER\|GRANT\|REVOKE)'` (chỉ dòng thêm). Mẫu PR thêm ô cùng nội dung |
| FB-R4-ARC-OPS-P403-02 | Done | `requeue-email-changed.sh` so cả tham chiếu: `"$images" = "$(envval API_IMAGE):<tag><API_TAG_SUFFIX>"`, sau kiểm tag cũ (giữ câu báo cũ cho sai tag). Đã thử compose thật: `ps --format '{{.Image}}'` in đúng chuỗi cấu hình (cả `docker.io/library/…`). Test: thêm `API_IMAGE` vào `.env` giả; ca mới "cùng tag, repository khác" và "registry có cổng, `.env` không có" → `REFUSED`, không ghi; giữ ca "registry có cổng" |
| FB-R4-ARC-OPS-P403-03 | Done (mã) / chuyển P4-04 (runbook) | `mail-test.mjs`: thứ tự kiểm mới là `MAIL_TEST_TO` → dòng địa chỉ stdin (chỉ khi gửi) → `EMAIL_PROVIDER`. `--verify-only` không đổi (runbook v1.0.3 vẫn đúng). Test thêm M10 (mock: dòng rỗng → "address … invalid", địa chỉ hợp lệ → "EMAIL_PROVIDER is not smtp", không gửi gì) và M10b (`--verify-only` trên mock). Hai lượt `--send` ở runbook 5.0 S14 do P4-04 ghi (README/runbook thuộc P4-04); câu chữ đã ghi sẵn ở báo cáo OPS mục 7. Cần INT xác nhận `mail-test.mjs` |
| FB-R4-ARC-OPS-P403-04 | Deferred → P4-04 | `ci.yml` thuộc P4-04 (PR-M). OPS sẽ thêm `actions/setup-node` ghim SHA, `node-version` theo image api ở job `infra-scripts` trong P4-04. Không sửa ở nhánh này để không chồng tệp với P4-04 |
| FB-R4-ARC-OPS-P403-05 | Done | Nhánh có tệp lệnh, mã 1: `REFUSED: the worker image <tag> does not know the template email_changed, or dist/admin/known-email-templates-cli.js failed – nothing written; see: dc exec worker node … --list`. Không còn gợi ý "(v1.0.2?) – go up to v1.0.3" ở nhánh này; nhánh image cũ giữ câu cũ. Test có ca khóa câu mới |

## Kiểm đã chạy (04/11, Mac + Docker cục bộ, không mạng ra ngoài, không SSH)

| Kiểm | Kết quả |
|---|---|
| `CI=true bash product/infra/server/test/mail-test-send.test.sh` (Mac, node có sẵn) | **37 passed, 0 failed** (trước: 35; thêm M10, M10b) |
| `CI=true bash product/infra/server/test/requeue-email-changed.test.sh` (Mac) | **67 passed, 0 failed** (trước: 63; ca khóa deploy SKIP vì Mac không có `flock`) |
| `requeue-email-changed.test.sh` trên `ubuntu:24.04` (`--network none`, repo chỉ đọc, có `flock`) | **69 passed, 0 failed** |
| `mail-test-send.test.sh` trên `ubuntu:24.04` (không node, không `CI`) | 22 passed (phần 1; phần 2 SKIP vì không node, CI đặt `CI=true` thì đỏ) |
| `CI=true bash product/infra/server/test/rollback.test.sh` | 16 passed, 0 failed (nhánh này chưa có P4-02) |
| shellcheck `v0.10.0`, đúng danh sách tệp job CI `infra scripts`, `-x -S warning` | Sạch |
| Compose thật, `ps --format '{{.Image}}'` với `API_IMAGE=alpine` và `docker.io/library/alpine` | In đúng chuỗi cấu hình, khớp `API_IMAGE:<tag>` |

## Sửa thêm sau CI PR #46 (04/11)
- CI bước Format check đỏ ở `product/infra/server/mail-test.mjs`. Đã chạy prettier 3.9.10 (bản trong `pnpm-lock.yaml`) `--write`. Prettier chỉ xuống dòng câu từ chối `MAIL_TEST_TO`, hành vi không đổi.
- M9 của `mail-test-send.test.sh` so chuỗi theo dòng, nên đã chỉnh để nhận câu từ chối nằm trên hai dòng. Thử ngược: thêm một dòng `process.env.MAIL_TEST_TO` thì M9 vẫn FAIL.
- Kết quả: `mail-test-send.test.sh` 37/37 (`CI=true`), `prettier --check` sạch trên mọi tệp nhánh sửa, shellcheck sạch.

## Lượt 3: thẻ mới của ARC @ `84933d92` (04/11)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-P403-06 | Done | ARC đã Verified ở `84933d92` (prettier + M9) |
| FB-R4-ARC-OPS-P403-07 | Done | CODEOWNERS: `/.gitignore` → `.gitignore`, khớp **mọi** `.gitignore`, kể cả tệp mới ở thư mục con. Chú thích nêu lý do: một `!pricing/` lồng mở lại G1. Hiện khớp 4 tệp (gốc + 3 tệp lồng) |
| FB-R4-ARC-OPS-P403-08 | Done | Luật (c) trong CODEOWNERS và ô mẫu PR dùng cùng lệnh: `grep -iE '^\+.*(DISABLE TRIGGER\|GRANT\|REVOKE\|ROW LEVEL SECURITY\|POLICY\|SECURITY DEFINER\|ROLE )'`. Không phân biệt hoa thường, phủ RLS (`ENABLE`/`DISABLE`/`FORCE`/`NO FORCE ROW LEVEL SECURITY`), `CREATE`/`DROP POLICY`, `SECURITY DEFINER`, `ALTER ROLE`/`SET ROLE`. Lấy đủ regex ARC đề xuất, theo hướng an toàn: đa số migration RLS của BE sẽ cần SEC. Thử: viết thường `disable row level security`, `create policy` đều khớp; trên lịch sử `main` lệnh khớp 575 dòng thêm |
| FB-R4-ARC-OPS-P403-09 | Open → P4-04 | ORC chưa giao ở lượt này. Câu chữ S14 sẽ ghi theo đề xuất ARC ở P4-04: lượt 1 `thu.nghiem@example.test` → `EMAIL_PROVIDER is not smtp`; lượt 2 `thu,nghiem@example.test` → `address on stdin is missing or invalid` |
| FB-R4-ARC-OPS-P403-10 | Done | Thêm 5 dòng SEC (+ OPS), có chú thích vai: `deploy-from-ci.sh`, `init-secrets.sh`, `bootstrap-vps.sh`, `docker-compose.prod.yml`, `privacy-log-check.sh`. Chưa thêm `deploy.sh`/`rollback.sh`; SEC quyết nếu muốn thêm (khi đó PR-A cũng cần `SEC-on-*.md`) |

Kiểm lượt 3:
- Test, chạy với `CI=true` trên Mac:
  - `mail-test-send.test.sh`: 37/37;
  - `requeue-email-changed.test.sh`: 67/67;
  - `rollback.test.sh`: 16/16.
- shellcheck `v0.10.0`, đúng danh sách tệp CI: sạch.
- `prettier --check` trên mọi tệp nhánh sửa trong `product/`: sạch.
- Mọi đường dẫn trong CODEOWNERS đều có tệp thật, trừ `shared-mailboxes.ts` và `email-address.ts`. Hai tệp này sẽ có khi gộp `be-identity` và `int-email`.
