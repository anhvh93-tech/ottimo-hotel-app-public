# OPS – trả lời review P4-02 `v104/ops-deploy-order`

- Round 4 (v1.0.4), bước **Phản hồi & sửa**, 04/11/2026.
- Review: `rounds/round-04/reviews/ARC-on-v104-p4-02.md` (ARC @ `eef44c02`), `rounds/round-04/reviews/SEC-on-v104-ops-deploy-order.md` (SEC @ `eef44c02`).
- Bản sửa: commit trên `v104/ops-deploy-order`, nối tiếp `eef44c02` (không rebase, để giữ commit đã review; `git merge-tree` với `origin/main` sạch theo ARC mục 3).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-P402-01 | Done | `deploy.sh`: `worker_stays_up` (lấy mẫu `ps --status running`) thay bằng `worker_ok`. Đọc id container worker và `RestartCount` trước `up`. Container mới thì mốc 0, container compose giữ nguyên (cùng id) thì mốc là số đọc trước `up` ("không tăng so với trước lúc `up`"). Sau 3 giây phải là `true <mốc>` và đúng id. Bước `smoke` gọi lại cùng hàm trên cùng container, nên chỗ hở ở dòng 232–233 cũ cũng được bịt. `rollback.test.sh`: stub `docker inspect` có `STUB_WORKER_RESTARTS` (chuỗi theo lượt đọc), `STUB_WORKER_KEEP`, `STUB_WORKER_OLD_RESTARTS`. Ca mới: **(l2)** chết sau 1,5 giây, Docker chạy lại, `running` + `RestartCount` 1 → `FAIL` ở `switch-worker`, api/web không lên tag mới, bản trước về theo `api web` → `worker`; **(l3)** chạy lại sau bước switch → `FAIL` ở `smoke`; **(l4)** container giữ nguyên với số đếm cũ 4 → không báo nhầm. (k) thêm kiểm `smoke` đọc lại đúng container. Vẫn 6 dòng `[deploy`. Chạy test mới với `deploy.sh` @ `eef44c02`: (l2), (l3) **FAIL** (deploy qua, rc=0), tức test bắt được lỗi cũ. Kiểm thật Docker 29.8.2 / Compose 5.5.0: `sleep 1.5; exit 1` + `unless-stopped` cho `true 2` ở giây 3 (khớp bằng chứng ARC) |
| FB-R4-ARC-OPS-P402-02 | Accepted (5.0) | Không đổi `sleep 3` bây giờ, đúng đề xuất. Biên bản diễn tập 5.0 ghi giờ thật từ `up` tới dòng `worker started`; lớn hơn 2 giây thì OPS tăng lên 5 trong một commit riêng. Đã ghi vào báo cáo OPS (G2) |
| FB-R4-SEC-OPS-P402-I1 | Done | Info. Đã làm đúng ý SEC: kiểm `RestartCount` không tăng giữa lần đọc trước `up`, sau 3 giây và ở `smoke`. Không đổi guard, digest, roles, migrate, log |

## Kiểm đã chạy (04/11, Mac, không mạng ra ngoài, không SSH)

| Kiểm | Kết quả |
|---|---|
| `CI=true bash product/infra/server/test/rollback.test.sh` | **27 passed, 0 failed** (trước sửa: 23) |
| Test mới chạy với `deploy.sh` @ `eef44c02` (stub `ps --status running` cũ thêm lại cho công bằng) | (k) 2 ca, (l2), (l3) **FAIL** như mong đợi |
| shellcheck `v0.10.0` (image có sẵn, `--network none`), đúng danh sách tệp job CI `infra scripts`, `-x -S warning` | Sạch |
| `bash product/infra/ci/test-deploy-from-ci.sh` (thêm `flock` giả vào PATH) | Tất cả `ok` |
| Docker thật, compose 2 service `alpine:3.20` `network_mode: none` | crash-loop: `true 2` (3 s), `true 4` (8 s); khỏe: `true 0`; `up` lại không đổi: cùng id, giữ số; `up` đổi cấu hình: id mới, số 0 |

## Ghi chú cho đợt sau (không thuộc thẻ)
- `ops-check.sh` (K-containers) cũng chỉ lấy mẫu `ps --status running`. Worker chết lặp vẫn có thể hiện OK ở một lượt kiểm. Đề xuất thêm kiểm `RestartCount` tăng giữa hai lượt K vào việc của nhánh `v104/ops-check`; chưa làm ở đây để giữ PR-A gọn.
