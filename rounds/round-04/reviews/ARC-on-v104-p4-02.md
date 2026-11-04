# ARC review kỹ thuật – P4-02 `v104/ops-deploy-order` (OPS, PR-A)

- Round 4 (v1.0.4), bước Review chéo (ma trận OPS → ARC, `plan-v1.0.4.md` 7.1), 04/11/2026
- Đầu nhánh `eef44c02`, so với `origin/main` @ `7b5b6117` (nền nhánh `c6cd32a8`). Diff 4 tệp, +207 / −12: `infra/server/bin/{deploy,rollback}.sh`, `infra/server/test/rollback.test.sh`, báo cáo OPS.
- Căn cứ: điều kiện ARC của `FB-R4-OPS-ARC-31-01` (`ARC-on-PR32.md` mục 1, ý 1–4); `plan-v1.0.4.md` dòng P4-02, mục 4.1 (chủ tệp `infra/server/**` = OPS), mục 6 ý 8 (PR-A gộp trước PR-F/P4-10).

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Có 1 Major (FB-R4-ARC-OPS-P402-01). Sửa nhỏ, khoảng 15 dòng cùng test, không đổi thiết kế. Gộp được sau khi sửa thẻ này, CI `pull_request` xanh trên đúng đầu PR, và có review SEC. Diễn tập 5.0 (S3/S9) là điều kiện trước Release (P0 runbook v1.0.4), không phải điều kiện gộp.

## 1. Đối chiếu điều kiện ARC

| # | Điều kiện (ARC-on-PR32 mục 1) | Kết quả |
|---|---|---|
| 1 | `switch` tách thành `worker` rồi `api web`; `--rollback` và `restore_previous` đi ngược | **Đạt.** Deploy: `switch_worker --remove-orphans` → `switch_api`. `--rollback`: `switch_api --remove-orphans` → `switch_worker`. `restore_previous` chạy `api web` cũ trước, rồi `worker` cũ. Có chốt (n): nếu `api web` cũ không lên lại thì **không** chạy worker cũ. Đây đúng là chỗ dễ sai, và OPS đã chặn |
| 2 | `rollback.test.sh` có ca kiểm thứ tự lệnh `up` | **Đạt.** Có các ca (j)–(o), và ca (b) đã sửa. Hàm `ups()` lọc đúng lệnh `up` timeout 240, nên tách được lệnh switch khỏi lệnh restore (timeout 180). Ca (k) còn kiểm lệnh `ps worker` nằm **giữa** hai lệnh `up` |
| 3 | Diễn tập lại 5.0 | **Chưa**, đúng lịch (không deploy staging trước 05/11 10:00). Runbook v1.0.4 có S3/S9 đo `State.StartedAt` |
| 4 | Xong trước bản thêm mẫu `staff.email` / job / topic outbox mới | **Đạt về thứ tự gộp** (PR-A trước PR-F). ARC đã kiểm thêm: `STAFF_EMAIL_TEMPLATES` trên `v104/int-email` và `v104/be-identity` vẫn đúng 5 mẫu như `main`. `jobs/` không đổi giữa `v1.0.3` và `main@L` |

## 2. Đúng kiến trúc / compose

- `worker` không phụ thuộc `api` (`docker-compose.prod.yml`: `worker.depends_on` chỉ có `postgres`). `web` phụ thuộc `api` healthy. Nhờ vậy, tách lệnh `up` theo nhóm `worker` / `api web` là đủ để giữ thứ tự.
- **G1 của OPS, ARC đã thử trên máy** (Docker 29.8.2, Compose v5.5.0, stack giả 4 service có cùng `depends_on`):
  - `V=2 up -d --wait --remove-orphans worker` chỉ tạo lại `worker`;
  - `up -d --wait api web` tạo lại `api` và `web`, không đụng `worker`;
  - chiều quay lui cũng vậy;
  - `postgres` không bị tạo lại ở lệnh nào.

  Compose trên VPS có thể là bản khác. 5.0 S3/S9 vẫn phải đo trên máy thật (xem Suggestion P404-07).
- Compose tạo lại container theo kiểu dừng bản cũ rồi mới chạy bản mới. Mỗi lúc chỉ có một worker, nên giữ đúng giả định lease outbox một người gửi (ARC-INT-EMAIL-03).
- `migrate` vẫn chạy trước mọi lần đổi container. Không đổi `appconfig`, `roles`, digest, guard production, `smoke` hay `record`. Lượt thành công vẫn đúng 6 dòng `[deploy`, test (i) và (k) đã khóa.
- Tên bước `switch-worker` / `switch-api` qua được bộ lọc `tr -cd 'a-z-'` của `deploy-from-ci.sh`. Không script nào so tên bước cũ `switch`.
- Ở chiều deploy, có vài giây worker mới chạy cạnh api cũ. Như vậy an toàn: worker mới đọc được mọi job của api cũ, và J1 mới ghi kind mới thì Desk cũ trả 200 với câu chung (ARC 0.3.12, Q1).

## 3. Kiểm ARC đã chạy (worktree tách riêng, đầu `eef44c02`)

| Kiểm | Kết quả |
|---|---|
| `CI=true bash product/infra/server/test/rollback.test.sh` | 23 passed, 0 failed |
| `bash product/infra/ci/test-deploy-from-ci.sh` (Mac, thêm `flock` giả vào PATH) | tất cả `ok` |
| `git merge-tree` với `origin/main`, `v104/ops-scripts`, `v104/ops-check` | sạch |
| Thử compose thật cho G1 (mục 2) | khớp G1 |
| Thử worker chết lặp với `restart: unless-stopped` (thẻ 01) | **phát hiện lỗ hổng** |

## 4. Thẻ

### FB-R4-ARC-OPS-P402-01
- Mức độ: **Major**
- Vị trí: `infra/server/bin/deploy.sh` dòng 186 (`worker_stays_up`) và dòng 232–233 (kiểm worker ở `smoke`); `test/rollback.test.sh` stub `ps --status running` (dòng 110).
- Vấn đề: `worker_stays_up` dùng `sleep 3; dc ps --status running --quiet worker`. Lệnh này **không** bắt được worker chết rồi khởi động lại liên tục. Mọi service đều có `restart: unless-stopped` (`x-hardening`). Worker chết lúc khởi động (sai cấu hình, thiếu bảng, luật địa chỉ mới của INT) sẽ được Docker chạy lại, nên lúc lấy mẫu container thường đang ở trạng thái `running`.
  - Bằng chứng: ARC thử container `sh -c "sleep 1.5; exit 1"` với `restart: unless-stopped`.
  - `up -d --wait` trả 0.
  - Lấy mẫu `ps --status running` mỗi giây, từ giây 1 đến 12: thấy `running` ở các giây 1, 2, **3**, 5, 7, 9, 12. Ở giây 3, `RestartCount` = 2.
  - Kiểm ở `smoke` (giây thứ 5 sau đó) cũng chỉ lấy mẫu một lần, nên có thể qua theo cách tương tự.
  - Test (l) chỉ mô phỏng "không chạy" (`STUB_WORKER_DOWN=1`), không mô phỏng "chạy lại".
- Vì sao quan trọng: mã và báo cáo OPS cùng hứa "worker chết lúc khởi động thì deploy dừng **trước** khi api đổi". Đây là lý do có bước `switch-worker` riêng. Nếu lỡ ca này:
  - api v1.0.4 vẫn lên, trong khi worker chết lặp;
  - thư bảo mật, Chat yêu cầu đặt phòng và J1 giữ chỗ không chạy;
  - `deploy … ok` vẫn được ghi, và chỉ K4/K7 phát hiện sau đó.

  Diễn tập 5.0 không bắt được lỗi này, vì worker staging khởi động sạch.
- Đề xuất sửa:
  1. Ngay sau `dc up … worker`, lấy id container: `wid=$(dc ps -q worker)`. Sau `sleep 3`, kiểm `docker inspect -f '{{.State.Running}} {{.RestartCount}}' "$wid"` = `true 0`. `RestartCount` về 0 khi container được tạo lại, nên 0 là mốc đúng cho container mới.
  2. Kiểm ở `smoke` (dòng 232–233) dùng cùng hàm.
  3. Thêm vào stub `docker` biến `STUB_WORKER_RESTARTS=<n>`. Ca mới (l2): worker "running" nhưng `RestartCount` = 1, thì `FAIL` ở `switch-worker`, api/web không lên tag mới, và bản trước được đưa lại theo thứ tự `api web` → `worker`.
  4. Giữ đúng 6 dòng `[deploy`.
- Trạng thái: Open

### FB-R4-ARC-OPS-P402-02
- Mức độ: Suggestion
- Vị trí: `deploy.sh` dòng 186 (`sleep 3`), báo cáo OPS G2.
- Vấn đề: thời gian chờ 3 giây chọn theo cảm nhận, chưa đo thời gian worker thật cần để nạp cấu hình. Sau khi sửa thẻ 01, worker chết muộn hơn 3 giây vẫn bị `RestartCount` ở `smoke` bắt, nên rủi ro thấp.
- Đề xuất: chỉ ghi giờ thật (từ `up` tới dòng `worker started`) vào biên bản 5.0. Nếu thấy lớn hơn 2 giây thì tăng lên 5. Không cần đổi bây giờ.
- Trạng thái: Open

## 5. Điểm làm tốt
- Chốt (n): không chạy worker cũ khi api mới có thể vẫn đang trả lời. Đây là ca ARC không nêu, OPS tự thấy và khóa bằng test.
- Test chứng minh được rằng bộ test bắt được mã cũ: các ca (b), (j), (k) FAIL khi chạy với `deploy.sh` của `main`. Ca (o) chặn ai đó gộp lại `api worker` vào một lệnh.
- Không thêm dòng log, nên mọi tờ lệnh INV và runbook cũ vẫn đúng.

## Xác nhận (04/11)

- Đầu nhánh mới **`051e1750`** (1 commit nối tiếp `eef44c02`, không rebase). Diff `eef44c02..051e1750`: 4 tệp, +129 / −16 (`deploy.sh`, `rollback.test.sh`, báo cáo OPS, `responses/OPS-P4-02.md`).
- `origin/main` lúc kiểm: `f758d44d`. `git merge-tree` của nhánh với `origin/main` và với `v104/ops-scripts` @ `67980030`: sạch.

### Phán quyết gộp: **ĐẠT**

Major P402-01 đã đóng. Điều kiện còn lại chỉ là CI `pull_request` xanh trên đúng `051e1750` (PR #45). Lúc ARC kiểm, mọi job đã xanh trừ `format · lint · audit · test · build` còn đang chạy. Nhánh chỉ đổi tệp `.sh` trong `product/`, nên job này không có lý do đỏ vì diff. Diễn tập 5.0 S3/S9 vẫn là điều kiện trước Release, không phải điều kiện gộp.

### Trạng thái thẻ

| ID | Tác giả trả lời | ARC xác nhận | Ghi chú |
|---|---|---|---|
| FB-R4-ARC-OPS-P402-01 (Major) | Done | **Verified** | Xem kiểm bên dưới |
| FB-R4-ARC-OPS-P402-02 (Suggestion) | Accepted (5.0) | **Đồng ý** | Giờ thật `up` → `worker started` ghi vào biên bản 5.0. Lớn hơn 2 giây thì tăng lên 5 trong commit riêng |
| FB-R4-ARC-OPS-P402-03 (Suggestion, mới) | – | Open | Container one-off trong `ps --all` (thẻ bên dưới). Không chặn gộp |

### Đọc mã `worker_ok`

- Mốc đúng. `pre_cid` và `pre_n` được đọc **trước** `up`.
  - Compose tạo container mới (id khác) thì mốc là 0.
  - Compose giữ nguyên container (cùng id) thì mốc là số đọc trước `up`.
  - Container đã chết lặp từ trước mà compose giữ nguyên thì số vẫn tăng sau 3 giây, nên vẫn `FAIL`. Không có ca lọt.
- `smoke` gọi lại cùng hàm và so với `w_cid` của bước switch. Container bị thay sau switch thì báo lỗi riêng, nên lỗ hở ở dòng 232–233 cũ đã bịt.
- Có kiểm mọi giá trị đọc được: id rỗng, trạng thái rỗng, số không phải số đều ra `FAIL` với lý do rõ (đều hỏng về phía an toàn).
  - `[[ =~ ^[0-9]+$ ]]` chặn được ca `[ -eq ]` gặp chuỗi lạ khi chạy dưới `set -e`.
  - `w_base` chỉ nhận số đã qua regex.
- Docker để container trong lúc chờ chạy lại (backoff) ở `Running=true`, `Restarting=true`. Lúc đó `RestartCount` đã tăng, nên `worker_ok` vẫn bắt được.
- Vẫn đúng 6 dòng `[deploy`. Không đổi guard production, digest, `appconfig`, `roles`, `migrate`, `record`. Thứ tự `restore_previous` giữ nguyên.

### Kiểm ARC đã chạy (worktree tách riêng, đầu `051e1750`)

| Kiểm | Kết quả |
|---|---|
| `CI=true bash product/infra/server/test/rollback.test.sh` (Mac) | **27 passed, 0 failed**. Có (k) 2 ca mới, (l2), (l3), (l4) |
| `bash product/infra/ci/test-deploy-from-ci.sh` (Mac, thêm `flock` giả) | tất cả `ok` |
| shellcheck `v0.10.0` (`--network none`, `-x -S warning`) trên `deploy.sh` và `rollback.test.sh` | sạch |
| Quét diff tìm email, IPv4, khóa | 0 kết quả |
| Compose thật (Docker 29.8.2, Compose v5.5.0, `alpine:3.20`, `network_mode: none`): `ps --all --quiet worker` khi đang có container `dc run worker` | **in cả container one-off** (thẻ 03) |

### FB-R4-ARC-OPS-P402-03
- Mức độ: Suggestion
- Vị trí: `deploy.sh` `worker_cid()` (`dc ps --all --quiet worker | head -n 1`).
- Vấn đề: `docker compose ps --all` liệt kê **cả** container one-off của `dc run … worker`, ví dụ `mail-test.sh` và lệnh admin trong runbook. ARC đã thử trên máy: ra 2 id, `<project>-worker-1` và `<project>-worker-run-<hash>`. Hiện tại đúng **nhờ thứ tự**: compose in theo tên, và `-worker-1` đứng trước `-worker-run-…`, nên `head -n 1` lấy đúng container của service. Thứ tự này là chi tiết cài đặt của compose, không phải cam kết. Nếu bản compose trên VPS in theo thứ tự khác, và lúc deploy đang có một container one-off chạy, thì `pre_cid` và `w_cid` có thể cùng trỏ vào container one-off. Khi đó `worker_ok` kiểm nhầm container và bỏ lọt worker thật đang chết lặp. Ca này hiếm, vì cần chạy `mail-test` trùng lúc deploy.
- Vì sao quan trọng: đây đúng là lỗi mà thẻ 01 vừa đóng, chỉ là qua một đường khác.
- Đề xuất: chọn container theo nhãn thay vì theo thứ tự, ví dụ `docker ps -aq --filter label=com.docker.compose.project=<project> --filter label=com.docker.compose.service=worker --filter label=com.docker.compose.oneoff=False`. Hoặc `dc ps --all --format '{{.ID}} {{.Name}}' worker`, bỏ tên có `-run-`, rồi báo lỗi nếu còn khác đúng 1 dòng. Thêm vào stub một ca "có container one-off". Làm ở PR sau cũng được, không chặn PR-A. `ops-check.sh` K-containers (ghi chú của OPS) nên dùng cùng hàm chọn container này.
- Trạng thái: Open

### Ghi chú của OPS về `ops-check.sh`
ARC đồng ý. K-containers cũng chỉ lấy mẫu `ps --status running` một lần. Việc này để cho `v104/ops-check`: so `RestartCount` giữa hai lượt K, chọn container theo nhãn như thẻ 03. Không thuộc PR-A.

## Góc SEC/INT (ARC đọc thay)

Phần này để SEC duyệt chéo sau. Đây không phải phán quyết của SEC.

- **Đường dẫn SEC (V104-05):** diff `eef44c02..051e1750` không chạm dòng nào có trong `.github/CODEOWNERS` (bản trên `v104/ops-scripts` @ `67980030`). `deploy.sh` và `rollback.test.sh` không phải đường dẫn SEC, nên theo luật V104-05 thì không bắt buộc có `SEC-on-*.md` mới. SEC đã kết luận ĐẠT tại `eef44c02` (`SEC-on-v104-ops-deploy-order.md`). Bản sửa làm đúng ghi chú Info `FB-R4-SEC-OPS-P402-I1`.
- **Bề mặt mới:** chỉ thêm hai lệnh đọc, là `docker inspect --format '{{.State.Running}} {{.RestartCount}}'` và `dc ps --all --quiet worker`. Không in env, digest hay cấu hình. Câu báo lỗi chỉ có id ngắn hoặc số đếm, không có dữ liệu khách.
- **Bí mật, IP, email:** quét diff được 0 kết quả. Dữ liệu test chỉ là `cid-worker-<n>` và tag giả.
- **INT:** không chạm đường gửi thư. Thẻ 03 có liên quan gián tiếp: `mail-test.sh` tạo container one-off `worker`.
