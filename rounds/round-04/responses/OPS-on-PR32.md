# OPS phản hồi – review PR #32 (ARC, SEC): runbook v1.0.3 r3, `requeue` thiếu `flock`

- Tác giả: OPS · Round 4 (v1.0.3), bước **Phản hồi & sửa**, chuẩn bị Release · 03/11/2026
- Nhánh `ops/v1.0.3-runbook-r3`, tách từ `main` @ `351cf073`. Chưa mở PR (ORC mở sau khi ARC + SEC đối chiếu).
- Review được trả lời: `rounds/round-04/reviews/ARC-on-PR32.md` (thẻ 01–06, mục 4 các ô `⟨CHỜ PR-1⟩`), `rounds/round-04/reviews/SEC-on-PR32.md` (thẻ PR32-01, PR32-02, S1–S3, mục 6).
- Tệp sửa: `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` (r3), `product/infra/server/bin/requeue-email-changed.sh`, `product/infra/server/test/requeue-email-changed.test.sh`, `product/infra/server/README.md` (13.8, 13.9).
- Không SSH vào máy chủ. Không có email thật, IP VPS hay bí mật. Digest chỉ ghi dạng rút gọn 8 + 4 ký tự (README 13.1).

## Giá trị lấy từ `main` thật

| Ô | Giá trị | Cách lấy |
|---|---|---|
| `SHA_V103` (lượt hiện có) | `351cf0739d5eb6d5584606c60a0a5fd4b8d8db41` | CI `push` trên `main`: lượt của `958e8da0` (merge PR #31) bị hủy do `concurrency`; lượt của `351cf073` xanh |
| `CI_RUN` | `41648829367` | `gh run list --branch main` |
| `TAG12` | `sha-351cf0739d5e` | output `tag` của `publish images (GHCR)` |
| digest api / web / landing | `5138d1ac…1ccb` / `e9f928d9…248c` / `3966b756…45f9` | artifact `image-digests` của `CI_RUN` (đọc vào biến, chỉ in rút gọn) |
| `HASH_0091` | `e8bb6cb9…b33a3` (đủ 64 ký tự ở runbook 0.1; đây là băm tệp, không phải digest) | `git show 351cf073:…/0091_user_email_change.sql \| shasum -a 256`, trùng số ARC ở `fb6a281c` |
| `WHEN_0091` | `1792782171681` | `_journal.json` ở `351cf073`: 68 mục, idx 67 = 0091, 0090 = `1792782169681` |
| `git diff v1.0.2 351cf073 -- product/infra` | 9 tệp, +867/−30, đều thuộc bảng 1.2; không compose/env/Caddy/roles/Dockerfile | `git diff --stat` |
| Tiêu đề thư `email_changed` | `OTTIMO – Security notice: notification email changed / Thông báo bảo mật: email nhận thông báo đã thay đổi` | `email-templates.ts` (`emailChangedCopy`, dòng `subject`) |
| Dòng log worker | không có dòng mới; `worker started` thêm job `email_change.purge` → K4 `PURGE_JOB=1` | `worker.ts`, `jobs/builtin-jobs.ts` |
| Tên mục Desk | **Bảo mật tài khoản** → **Email nhận thông báo bảo mật**, nút **Lưu email** | `strings-vi.json` / `strings-en.json` |

## Trả lời từng thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-PR32-01 (Major) | Done | Mục 0 dòng "Migration chạy ở đâu" viết lại theo 0091 thật: tạo bảng → `app_user` `NO FORCE` + `DISABLE` → `UPDATE … SET email = NULL` (rỗng/toàn khoảng trắng) → `ENABLE` + `FORCE` → CHECK → RLS/policy/GRANT bảng mới, một giao dịch; trên production đổi 0 dòng. Bảng 1.3 thêm dòng này. K2 thêm `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid = 'public.app_user'::regclass;`, **Đúng là** `t\|t`, lệch thì dừng, không K8, báo ARC + SEC + BE. R6 (K2 rút gọn) giữ dòng này. Diễn tập 5.0: S3, S7, S13 ghi dòng này trước lùi, sau lùi, sau lên lại. Bảng dừng mục 6 có thêm |
| FB-R4-ARC-OPS-PR32-02 | Done | R9 bước 1: "`<n>` + `<m>` = số `BAD_TEMPLATE` đếm lúc đó; `<n>` ≥ dòng 2 − `BT_BASE`"; `--expect` luôn lấy đúng `<n>` của lần chạy thử |
| FB-R4-ARC-OPS-PR32-03 | Done | R3b: ORC nhắn INV không lưu/đổi email từ R3b tới R5, chờ "đã rõ" (trừ sự cố gấp); R5 báo INV dùng lại Desk. 1.3a thêm lý do compose (`web` chờ `api` healthy, `worker` không healthcheck). Bảng dừng có dòng R3b |
| FB-R4-ARC-OPS-PR32-04 | Done | Mục 4, dòng `switch`/`smoke`: chạy câu `BAD_TEMPLATE` của 1.3a; khác 0 thì ghi số, R9 sau khi Release lại thành công. 1.3a nhắc ca này |
| FB-R4-ARC-OPS-PR32-05 | Done | R9 bước 4, README 13.9: vài phút sau `--apply`, `email_changes` có thể `FAIL` vì tuổi hàng đợi, không làm mục F, chạy lại sau 3 phút. Mục F bước 1, README 13.8 và bảng dừng: trong 30 phút sau R9 `--apply` thì chạy lại sau 3 phút trước khi kết luận. Không đổi mã |
| FB-R4-ARC-OPS-PR32-06 | Deferred | v1.0.4: test khóa đường xuất `@ottimo/integrations/notification` / `isStaffEmailTemplate` (việc của BE/INT, OPS ghi chú). Script vẫn fail-closed (mã 3) |
| ARC mục 4 (ô `⟨CHỜ PR-1⟩`) | Done | Câu CHECK mục 0 thay đúng chữ ARC; P2 thêm dòng **4b** (câu tiền kiểm của 0091), "Đúng là" dòng 4 = 0, hoặc dòng 4 > 0 và 4b = 0 (ghi số, đi tiếp, không cần xác nhận trong chat); 4b > 0 thì dừng. Errata mục 8 viết lại. `HASH_0091`, `WHEN_0091` đã điền và OPS kiểm lại ở `351cf073`. Tên mục Desk ở K8. Bảng 1.2 điền kết quả diff thật. K4 thêm `PURGE_JOB` (đúng là `1`; R6 trên v1.0.2 là `0`) |
| ARC G8 | Ghi nhận | Runbook 1.3a và mục 8 ghi ARC chấp nhận; `FB-R4-OPS-ARC-31-01` v1.0.4, bắt buộc trước bản nào thêm mẫu `staff.email` mới. Dòng decision-log do ORC ghi (đề nghị ở `ARC-on-PR32.md` mục 1) |
| FB-R4-SEC-OPS-PR32-01 | Done | `requeue-email-changed.sh`: có `flock` thì `flock -n 9` như cũ; không có `flock` mà không chạy bộ test (`RQ_TEST_DC` rỗng) thì `REFUSED: flock missing – cannot check state/deploy.lock (install util-linux)` trước mọi lệnh docker/DB. `RQ_TEST_DC` vốn bị từ chối trên production, nên trên production thiếu `flock` luôn dừng. Chặt hơn đề xuất một chút: staging cũng dừng (staging cũng là Ubuntu, có `flock`). Ca test mới: production, `PATH` không có `flock`, không stub → mã 1, đúng câu `REFUSED`, không có lời gọi docker/DB (2 kiểm). Chạy test mới trên bản script cũ: ca này **đỏ** (xác nhận test bắt đúng lỗi). P2b bước 2 thêm `FLOCK: CO`. README 13.9 |
| FB-R4-SEC-OPS-PR32-02 | Done (a); Deferred (b) | (a) Mục F bước 2 tách nhánh: đổi bởi OWN mà INV không làm → tài khoản OWN bị lộ (INV đổi mật khẩu, đăng xuất phiên lạ, báo SEC ngay, SEC quyết `mfa-operator-reset`; không khóa người bị đổi); tự đổi (`via = self`) → INV khóa người đó; INV cố ý đổi hàng loạt → bước 5. Dấu hiệu nhận nhánh: thư `email_changed` có câu "Thay đổi do chủ cơ sở thực hiện" khi `via = owner` (lấy từ `email-templates.ts`). README 13.8 cùng nội dung. (b) đếm `via owner` trong `email_changes`: v1.0.4, để không đổi `ops-check.sh` sát giờ phát hành |
| FB-R4-SEC-OPS-PR32-S1 | Deferred | v1.0.4, gom với ARC PR30-09 / G11. Runbook mục 8 thêm rủi ro R8 và dòng decision-log mục 7 có câu này |
| FB-R4-SEC-OPS-PR32-S2 | Deferred | v1.0.4. Lớp chặn thật là câu hỏi `isStaffEmailTemplate`, SEC đã ghi |
| FB-R4-SEC-OPS-PR32-S3 | Done | R9 và README 13.9: "địa chỉ cũ đã hoặc sẽ bị job `email_change.purge` xóa ở lượt kế tiếp; R6 dòng 3 đếm số này" |
| SEC mục 6 (điều kiện trước Release) | Done (ghi vào runbook) | 6.1: P0 đòi #32 và r3 nằm dưới `SHA_V103`. 6.2: P2b đã có số ≥ 6, `REQUEUE SCRIPT: CO`, `table not present yet`. 6.3: P0 + bảng 5.0 S1 (ca 6 lần → `FAIL`), S4/S11 (R9 hai chiều). 6.4: K5 thêm dừng khi còn `table not present`. 6.5: thẻ PR32-02 ở trên |

## Phần staging (mục 5.0) – điều ORC yêu cầu ghi rõ

Bảng "Biên bản bắt buộc" S1–S13 ở runbook 5.0. Cột "Số thật" để trống: diễn tập chưa chạy (staging chưa deploy v1.0.3). Ba dòng ORC nêu:
- **Ca QA đổi email 6 lần → `email_changes` FAIL**: S1 (trước lùi, đúng là `FAIL … 6 e-mail changes for one user in 24 h (limit 5)`; không `FAIL` thì dừng); S8 và S12 ghi số sau lùi và sau lên lại (`FAIL` vẫn là dự kiến vì số lần/người của S1, không coi là lỗi R9). Sau lùi, `ops-check` vì vậy là 10 `ok` + 1 `FAIL`, không phải 11 `ok`.
- **R9 hai chiều**: S4 (v1.0.2: `REFUSED … does not know the template email_changed`) và S11–S12 (v1.0.3: `1 within 7 days`, `requeued 1 row(s); … now: 0`, rồi `done|-|…`).
- **Số thật `dead|BAD_TEMPLATE`**: S5 (`dead|BAD_TEMPLATE|1`), S6 (câu 1.3a = `BT_BASE` + 1, `WORKER_ERR_R4` = `LOG_BAD_TEMPLATE` = 1), S10 (sau lên lại vẫn `dead|BAD_TEMPLATE`, không tự gửi lại).

Một ô lệch mà ARC/SEC chưa chấp nhận lý do thì diễn tập KHÔNG ĐẠT, P0 không qua.

## Giả định mới

- **G12 (cần ORC quyết thứ tự):** r3 sửa mã trong `product/infra` (SEC PR32-01). P2b lấy gói `infra/` từ `SHA_V103`, P1 đòi `SHA_V103..main` không có tệp mã. Nếu gộp r3 sau khi đã chốt `SHA_V103 = 351cf073`, P1 sẽ dừng và gói production thiếu bản sửa. OPS đề xuất: ARC + SEC đối chiếu → gộp r3 → `SHA_V103` = commit gộp (lượt CI xanh mới nhất có `publish images`), làm lại theo runbook 0.2 (một lệnh, chỉ in rút gọn). Staging chưa deploy v1.0.3 nên chỉ tốn một lượt CI. Giá trị `351cf073` ở 0.1 là của lượt hiện có, dùng để kiểm cách điền và không dùng cho production. **Không duyệt `deploy staging` của lượt `351cf073`** nếu chọn cách này. Cách khác (giữ `351cf073` cho image, lấy gói từ commit khác) OPS không chọn: hai commit cho một bản phát hành, và P1 phải nới ra.

## Kiểm đã chạy (trên nhánh, Mac + Docker, không mạng)

| Kiểm | Kết quả |
|---|---|
| `shellcheck -x -S warning` (`koalaman/shellcheck:v0.10.0`), đúng danh sách tệp của job CI `infra scripts` | 0 cảnh báo |
| `product/infra/ci/test-ops-check.sh` | 118/118 |
| `product/infra/server/test/requeue-email-changed.test.sh` | Mac (không `flock`): 46/46. `ubuntu:24.04` (có `flock`, như CI): 48/48 |
| Test mới chạy trên script cũ (`origin/main`) | 45/46, ca `production without flock refuses` đỏ, đúng dự kiến |
| `product/infra/server/test/ops-check-cwd.test.sh` | 7/7 |
| `product/infra/server/test/rollback.test.sh` | 16/16 |
| `product/infra/server/test/mail-test-send.test.sh` | 20/20 |
| gitleaks `v8.21.2` (image CI), `.github/gitleaks.toml`, toàn bộ lịch sử nhánh | 897 commit (gồm commit r3; lần sửa sau đó chỉ ghi dòng kết quả này), **no leaks found**, mã thoát 0; quét `--no-git` riêng `rounds/round-04` cũng sạch |
| CI `push` `main` lượt `CI_RUN` | `gitleaks` success, `publish images (GHCR)` success; `deploy staging` chờ duyệt, **không duyệt** |

## Việc cần INV đồng ý (ORC hỏi trong chat, theo runbook)

1. **Staging:** duyệt `deploy staging` của lượt `CI_RUN` đã chốt theo 0.2, rồi P2b staging, ca QA 6 lần đổi email, diễn tập 5.0 (lùi về v1.0.2 và lên lại trên staging).
2. **Production:** P2b làm mới gói `infra/`, P3 sao lưu, P4 gắn tag `v1.0.3`, P5 duyệt Release; INV có mặt 15 phút sau K7 để làm K8.
3. **R9 `--apply`** (thao tác ghi): chỉ khi có dòng `BAD_TEMPLATE` sau một lần quay lui (mục 4 `switch`/`smoke`, hoặc mục 5). Trên staging không cần INV.
4. **Mục E** (bật `EMAIL_NO_RECIPIENT_ALERT`) sau ≥ 24 giờ, và **mục 5** quay lui nếu có sự cố.
