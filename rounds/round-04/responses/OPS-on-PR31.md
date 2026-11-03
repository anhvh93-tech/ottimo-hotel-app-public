# OPS phản hồi – review PR #31 phần giao cho OPS, cùng thẻ lượt 2 của PR #30

- Tác giả: OPS · Round 4 (v1.0.3), bước **Phản hồi & sửa** (PR-2 lượt bổ sung) · 03/11/2026
- Nhánh `ops/v1.0.3-email-alert-2`, cắt từ `origin/ops/v1.0.3-email-alert` @ `bd74ef86`. Nhánh PR #30 không bị sửa. Chưa mở PR: ORC mở sau khi PR #30 gộp.
- Review được trả lời:
  - `rounds/round-04/reviews/SEC-on-PR31-v1.0.3-email.md`: thẻ `FB-R4-SEC-OPS-PR31-01`;
  - `rounds/round-04/reviews/ARC-on-PR31-v1.0.3-email.md`: thẻ `FB-R4-ARC-BE-31-02`, phần chuyển cho OPS;
  - `rounds/round-04/reviews/INT-on-PR31-dispatcher.md`: `FB-R4-INT-BE-31-02` (b) (câu xếp lại hàng đợi), `FB-R4-INT-BE-31-04` điều kiện (1) (câu đếm ASCII);
  - trên `main`: `SEC-on-PR30-email-alert.md` lượt 2 (`FB-R4-SEC-OPS-PR30-09`), `ARC-on-PR30-email-alert.md` lượt 2 (`FB-R4-ARC-OPS-PR30-11`).
- Không SSH vào máy chủ. Không có email thật, IP VPS, digest hay bí mật mới trong repo.

## Trả lời từng thẻ

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-PR31-01 | Done | Thêm kiểm `email_changes` vào `ops-check.sh`, có trong lượt chạy đầy đủ của timer. Chạy trong giao dịch READ ONLY (`psql_ro`). Chỉ ra **số**: không chọn địa chỉ, id hay payload. Kiểm đếm 4 số: (1) tổng số lần đổi email trong 24 giờ, (2) số lần của người bị đổi nhiều nhất, (3) số thư `staff.email` còn chờ (`pending`/`failed`/`in_flight`), (4) tuổi thư cũ nhất (phút). Ngưỡng đúng của SEC: `FAIL` khi một người > **5**, tổng > **20**, hoặc thư cũ nhất chờ > **30** phút. Kiểm này luôn cảnh báo, không theo công tắc `EMAIL_NO_RECIPIENT_ALERT`. Ba ngưỡng chỉnh được trong `.env` (`EMAIL_CHANGES_USER_MAX`, `EMAIL_CHANGES_TOTAL_MAX`, `STAFF_EMAIL_QUEUE_MAX_MIN`), nhưng **không tắt được**: phải là số nguyên trong 1–20, 1–200, 5–240. Giá trị khác làm kiểm `FAIL`. Cả hai chỉ số đổi email (theo người và tổng) luôn được tính và in ra. Chạy được trên DB 67: chưa có bảng 0091 thì dùng `\if` của psql để bỏ phần đếm đổi email, chỉ xét hàng đợi. Lỗi truy vấn báo theo loại cố định, như các kiểm khác. Test: 48 kiểm mới trong `test-ops-check.sh`, gồm các biên 5/6, 20/21 và 30/31 phút, ngưỡng từ `.env`, 10 giá trị ngưỡng bị từ chối, câu trả lời lạ (có `@`) không bị in, và câu SQL không có cột địa chỉ. Ca 4c của `ops-check-cwd.test.sh` có thêm kiểm này. Câu SQL đã chạy thật trên Postgres 17 tạm: có bảng ra đúng `8\|6`, chưa có bảng ra `-1\|-1`. Runbook r2: P2b, K5, K9, R6, P0 (ca QA "đổi 6 lần → FAIL") và mục **F** (xử lý khi FAIL: INV khóa tài khoản đang dội trên Desk, báo SEC, không xóa outbox, không nới ngưỡng). README 13.8. Một chỗ lệch nhỏ so với câu mẫu của SEC: `count(*)` ở truy vấn ngoài của SEC đếm số **người**, không đếm số lần. OPS dùng `sum(n)` cho tổng số lần, đúng ý "tổng > 20/24 giờ". "Người" là người **bị đổi** (`user_id`), khớp giới hạn v1.0.4 của SEC |
| FB-R4-INT-BE-31-04 (điều kiện 1, phần OPS) | Done | Thêm kiểm `email_ascii`: đếm `app_user.email` không rỗng mà luật `normalizeSecurityEmail` sẽ từ chối. Luật gồm: cắt khoảng trắng, chữ thường, phần tên `[a-z0-9._%+-]{1,64}`, ≥ 2 nhãn `[a-z0-9-]{1,63}`, đuôi là chữ, 3–254 ký tự. Chạy READ ONLY, chỉ `count(*)` ra khỏi DB, luôn chỉ báo số. INT dùng số này cho điều kiện (3): chỉ siết adapter khi số bằng 0. ARC nói tới vai `ottimo_readonly`; OPS dùng `psql_ro` (`POSTGRES_USER`, giao dịch READ ONLY) như `email_missing`, vì đó là đường kiểm đang chạy trên máy chủ. Đã so regex Postgres với bản sao hàm TypeScript trên 29 ca (Postgres 17 tạm): khớp cả 29. Test 15 kiểm. Điều kiện (2) và (3) vẫn là việc của INT ở v1.0.4 |
| FB-R4-INT-BE-31-02 (b) | Done | Câu xếp lại hàng đợi là thao tác ghi, nên chỉ chạy qua script mới `bin/requeue-email-changed.sh`, không gõ SQL tay. Mặc định là chạy thử: kiểm + đếm, không ghi. `--apply` cần `--expect <n>` bằng số dòng vừa đếm, và cần INV đồng ý trong chat. Script từ chối khi: đang deploy/quay lui (`state/deploy.lock`); `--tag` khác `state/current_tag`; worker đang chạy không đúng tag; image worker không biết mẫu `email_changed` (gọi `isStaffEmailTemplate` ngay trong container, nên v1.0.2 bị từ chối); chưa có bảng 0091. Chỉ đụng dòng `staff.email`/`dead`/`BAD_TEMPLATE`/mẫu `email_changed` có `created_at` trong **7 ngày** (điều kiện ARC). Câu `UPDATE` đúng như INT viết, chạy trong một khối `DO` của một giao dịch; giao dịch tự hủy nếu số dòng đổi khác `--expect`. Đầu ra chỉ có số. Test `requeue-email-changed.test.sh`: 44 kiểm (46 khi có `flock`). Đã chạy thật trên Postgres 17 tạm: 2 dòng trong 7 ngày được xếp lại; dòng 8 ngày, dòng mẫu khác, dòng `NO_RECIPIENT` và dòng topic khác giữ nguyên; `--expect` sai thì `RAISE` và giao dịch hủy. Đã chạy lệnh hỏi mẫu trên một image api cũ có sẵn trên máy: `email_changed` trả 1 (từ chối), `mfa_reset` trả 0. Runbook R9 + diễn tập ở 5.0. README 13.9. CI có bước riêng, shellcheck có tệp test |
| FB-R4-ARC-BE-31-02 (phần OPS) | Done, có giả định G8 | Runbook mục 1.3a ghi quyết định ARC: deploy migrate → worker → api, quay lui api → worker, DB giữ nguyên. **Lưu ý cho ARC/ORC:** `deploy.sh` chạy `migrate` trước mọi đổi container, nhưng đổi `api worker web` trong **một** lệnh `docker compose up`, cả khi deploy lẫn khi `--rollback`. Tức là mã chưa bảo đảm thứ tự worker/api. OPS không sửa `deploy.sh` ở đợt này: đó là đường deploy production, sửa thì cần ARC + SEC duyệt lại và diễn tập lại 5.0. Runbook đạt ý ARC bằng thao tác: K2 đếm `BAD_TEMPLATE` sau Release (phải 0); R3b rút hàng đợi `email_changed` trước khi lùi (đợi tối đa 5 phút); R6 đếm sau khi lùi; R9 xếp lại sau khi lên lại v1.0.3. Câu đếm `BAD_TEMPLATE` READ ONLY đúng như ARC viết, không có khung thời gian. R6 so với số nền `BT_BASE` đo ở R2, vì `created_at` là lúc đổi email (trước khi lùi). Đề xuất v1.0.4 (thẻ mới bên dưới): tách bước `switch` trong `deploy.sh` theo đúng thứ tự, có test trong `rollback.test.sh` |
| FB-R4-SEC-OPS-PR30-09 | Done | `SUDO_IO_LOG` (P2b bước 4, K8 bước 4, README 13.8): `{ sudo -n grep …; [ $? -le 1 ] \|\| echo X; } \| awk …` in `ERR` khi `grep` thoát > 1, hoặc khi không có dòng nào (ví dụ `sudo -n` đòi mật khẩu). `ONEOFF` (K8 bước 4, README 13.8): `L=$(sudo -n -u ottimo docker ps …) && echo "ONEOFF=$(printf %s "$L" \| grep -c .)" \|\| echo "ONEOFF=ERR"`. "Đúng là" ghi rõ: `ERR` tính như khác 0, nên cấm `--send` hoặc báo OPS dọn tay. Bảng dừng mục 6 có thêm hai dòng (P2b, K8). Đã thử với `sudo` giả: không khớp → `0`, một dòng → `1`, tệp không đọc được → `ERR`, `sudo` từ chối → `ERR`; `docker ps` rỗng → `0`, 2 container → `2`, docker lỗi → `ERR`. Lệnh đếm log mới ở R6 cũng theo khuôn này |
| FB-R4-ARC-OPS-PR30-11 | Done | (a) Mục 7: thay "thêm vế < 3 và chuỗi rỗng" bằng "= phủ định đúng của CHECK (ARC chốt, errata tech plan 2.4)". (b) Mục 0: "có dòng `app_user.email` không NULL mà CHECK từ chối (sai dạng, ngắn hơn 3, dài hơn 254, hoặc `''`)". Kèm ô `⟨CHỜ PR-1⟩`: 0091 trên nhánh PR-1 (`3aaa971c`) đã đổi `''` thành NULL trước khi thêm CHECK. P2 dòng 4 vẫn đếm chặt; nếu > 0 thì chạy thêm câu tiền kiểm ở đầu tệp 0091 để tách ca (errata mục 8). (c) R6: một mốc chung là **giờ R4**, ghi ngay trước lệnh R4. `WORKER_ERR_R4` và `LOG_BAD_TEMPLATE` đếm cùng một lệnh log `--since ⟨giờ R4⟩`, lỗi thì in `ERR`. Phía DB so với `BT_BASE` của R2, không lọc `created_at > giờ R4`: lọc như vậy sẽ bỏ sót đúng dòng cần đếm, vì dòng được tạo lúc đổi email, trước khi lùi. Khác đề xuất ở điểm này; lý do như trên |

## Thẻ mới OPS đề xuất (cho ARC, v1.0.4)

### FB-R4-OPS-ARC-31-01
- Mức độ: Suggestion
- Vị trí: `product/infra/server/bin/deploy.sh` bước `switch` (`dc up --detach --wait … api worker web`) và `restore_previous`
- Vấn đề: quyết định ARC `FB-R4-ARC-BE-31-02` (deploy worker trước api, quay lui api trước worker) chưa nằm trong mã. Hiện compose đổi ba service song song.
- Vì sao quan trọng: v1.0.3 đạt ý bằng thao tác trong runbook (K2, R3b, R6, R9). Các bản sau có thể thêm mẫu thư mới, và mỗi lần như vậy lại có cùng cửa sổ. Thứ tự nằm trong mã thì người chạy không phải nhớ.
- Đề xuất sửa: deploy thường: `dc up … worker` rồi `dc up … api web`. `--rollback` và `restore_previous`: `api web` trước, `worker` sau. Sửa `rollback.test.sh` (đang so đúng chuỗi lệnh `up`) và thêm một ca kiểm thứ tự. Diễn tập lại 5.0 khi có thay đổi.
- Trạng thái: Open

## Giả định

- **G8:** ARC chấp nhận cách đạt thứ tự worker/api bằng thao tác cho v1.0.3 (runbook 1.3a). ARC muốn có trong mã trước Release thì OPS làm thẻ trên ngay, kèm diễn tập lại.
- **G9:** ngưỡng `email_changes` = SEC (5/người, 20 tổng, 30 phút). Khoảng chỉnh 1–20 / 1–200 / 5–240 là OPS tự chọn: đủ rộng để nới khi OWN cố ý đổi email cho cả đội, đủ hẹp để không tắt được kiểm bằng một số rất lớn. SEC xác nhận hoặc đổi khoảng.
- **G10:** thư `failed` đang đợi thử lại cũng tính là "đang chờ" (đúng câu SQL của SEC). SMTP hỏng quá 30 phút sẽ ra `FAIL email_changes … security notices delayed`. Đó là cảnh báo đúng, và runbook mục F bước 3 có cách xử lý.
- **G11:** vai `ottimo_readonly` (INT 04) không dùng ở đây; `email_ascii` chạy cùng đường READ ONLY với `email_missing`. Việc chuyển mọi kiểm DB sang một vai chỉ đọc gom vào ARC PR30-09 (v1.0.4, đã hoãn).

## Kiểm đã chạy

- shellcheck v0.9.0 và v0.10.0, `-x -S warning`, đúng danh sách tệp của job CI (có thêm `requeue-email-changed.test.sh`): exit 0.
- Mac (bash 3.2):
  - `test-ops-check.sh` **118/118** (trước đây 55);
  - `ops-check-cwd.test.sh` 7/7;
  - `mail-test-send.test.sh` 20/20;
  - `requeue-email-changed.test.sh` 44/44;
  - `deploy-landing-privacy.test.sh` 13/13;
  - `rollback.test.sh` 16/16;
  - `restore-drill-privacy.test.sh` 8/8.
- `ubuntu:24.04` (người dùng thường, có `flock`):
  - `requeue-email-changed.test.sh` **46/46** (có ca khóa deploy);
  - `test-ops-check.sh` 118/118;
  - `mail-test-send.test.sh` 20/20;
  - `backup-privacy-log.test.sh` 5/5;
  - `restore-drill-privacy.test.sh` 8/8.
- `test-deploy-from-ci.sh` đỏ tại chỗ cả trên Mac (11, thiếu `flock`) lẫn ubuntu (3, thiếu công cụ của stub). Bản gốc `bd74ef86` cũng đỏ y hệt, và các tệp nó test không bị sửa. Trên CI, test này xanh ở `bd74ef86`.
- Postgres 17 tạm (container dùng một lần, mật khẩu giả, đã xóa sau khi chạy):
  - câu `email_changes` chạy với bảng và không bảng;
  - câu `email_ascii` so với hàm TS trên 29 ca;
  - `requeue-email-changed.sh` (dc giả trỏ vào container) chạy thử / `--expect` sai / v1.0.2 bị từ chối / `--apply` / chạy thử lại;
  - khối `DO` với số sai thì giao dịch hủy (0 dòng đổi).
- Lệnh đếm của runbook (`SUDO_IO_LOG`, `ONEOFF`, R6) chạy với `sudo`/`docker` giả, dưới `sh` và `bash`.
- **gitleaks v8.21.2** (image ghim digest như `ci.yml`), đúng lệnh CI `detect --source=/repo --config=/repo/.github/gitleaks.toml --redact --verbose --exit-code 1`, trên bản `git clone` của nhánh: 855 commit, `no leaks found`, exit 0. Không thêm dòng allowlist nào. Không có `.gitleaksignore`.
