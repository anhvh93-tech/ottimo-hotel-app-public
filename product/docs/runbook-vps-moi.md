# Runbook "VPS mới": dựng lại OTTIMO khi mất hẳn máy chủ (r0)

OPS · 06/11/2026 · V5-64 (OR-M4). **Chỉ viết, chưa diễn tập.** Diễn tập trên một VPS dùng một lần có tốn tiền, nên nằm ở B-OPS và cần ESC. Vì vậy RTO ≤ 4 giờ trong `hosting-plan.md` mục 7 vẫn là giả định.

**Dùng khi:** VPS mất hẳn, gồm hỏng đĩa, hãng khóa tài khoản, hoặc bị chiếm quyền rồi bị xóa. Khi DB hỏng mà máy còn, dùng bản sao lưu trên máy (README `infra/server` mục 7), không dùng runbook này.

**Người chạy:** OPS, hoặc ORC khi INV cho phép. **INV:** quyết bắt đầu, đưa các thứ ngoại tuyến, sửa DNS và secret GitHub. Không ai gửi mật khẩu, khóa hay IP qua chat. Mọi lệnh dùng `<IP-mới>`.

**Nghi bị chiếm quyền:** không dùng lại bất cứ thứ gì lấy từ máy cũ, kể cả khóa SSH, token, `.env` hay bản sao lưu chưa so băm. Chỉ dùng bản trên Mac đã so `.sha256`. SEC quyết có xoay KEK sau khi chạy lại hay không (xoay = thêm phiên bản, bọc lại DEK, ADR-013).

## 0. Cần có trước khi bắt đầu

| Thứ | Ở đâu | Ai |
|---|---|---|
| Bộ sao lưu mới nhất `db-`, `blobs-`, `purge-journal-`, `counts-`, `privacy-notice-<stamp>` (`.age` + `.sha256`) | Mac, `~/.ottimo/backups/ottimo-prod`. Dữ liệu mất tính từ `<stamp>` (README mục 7: tối đa khoảng 60 giờ với nhịp kéo tay) | OPS |
| Khóa giải mã `age` production | 2 bản ngoại tuyến (hosting-plan 8.1). Chỉ dùng trên Mac, **không** đưa lên VPS | INV |
| Bản ngoại tuyến `data_kek_current` production | INV giữ (README 4.2). Thiếu bản này thì ảnh giấy tờ và dữ liệu mã hóa không đọc lại được | INV |
| Tag app và tag landing đang chạy | GitHub Release mới nhất (artifact `image-digests`) và decision-log | ORC |
| VPS mới: Ubuntu 24.04, 2 vCPU / 4 GB / ≥ 40 GB, đặt ở VN. Tắt snapshot của hãng hoặc giữ ≤ 7 ngày | INV thuê, dán khóa công khai `ottimo_ops.pub` vào root hoặc tạo `ottimo-admin` (README mục 0, cách B) | INV |
| Bí mật tích hợp (cổng thanh toán, Google Chat, Healthchecks, mật khẩu ứng dụng mail nếu dùng) | Tài khoản của từng hãng (`integrations.md` 4.1). Các bí mật này không nằm trong bản sao lưu | INV + INT |

## 1. Các bước (dự kiến 3–4 giờ, chưa đo)

| # | Việc | Lệnh / nơi | Kiểm |
|---|---|---|---|
| 1 | Hạ TTL DNS xuống 300 giây (nếu còn vào được nhà đăng ký) | INV | – |
| 2 | Gói `infra/` từ **tag đang chạy**, không lấy từ `main` | `git archive` như runbook v1.0.5 P2b bước 1, chép bằng `scp` | Băm trên Mac trùng băm trên VPS |
| 3 | Bootstrap **production trước**, rồi staging (staging để sau cũng được) | README 12 dòng 1: `bootstrap-vps.sh --env production --deploy-key <ottimo_ops.pub> --ci-key <khóa CI mới> --backup-pull-key <khóa kéo mới> --admin-user ottimo-admin` | `sshd -T` không cho mật khẩu; firewall chỉ mở 22/80/443 |
| 4 | **Ngay sau đó, gỡ dòng `--deploy-key`** khỏi `authorized_keys` của `ottimo` | Runbook v1.0.5 W0 (README mục 3: `--deploy-key` chỉ dùng lúc dựng máy). Số dòng `CI`/`PULL` ở W0 bước 2 tính theo số stack đã bootstrap | `ops-check sshkeys` ok ở bước 12 |
| 5 | Khóa CI và khóa kéo **mới**, không dùng lại khóa cũ. Host key của VPS mới cũng mới | INV sửa secret GitHub `PRODUCTION_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS`, `PRODUCTION_SSH_HOST` (staging: `STAGING_SSH_*`). OPS sửa `known_hosts` trên Mac | Lượt kéo đầu `pull-backups.sh` thoát 0 |
| 6 | `.env` từ mẫu, **không** từ máy cũ | `env.production.example` → `/opt/ottimo-prod/.env` (`ottimo 0600`). Điền host, `ACME_EMAIL`, `LANDING_*`, `MFA_ENFORCED=true`, `PAYMENT_VIETQR_MODE=production` và các giá trị đã đổi ghi trong decision-log | `dc config -q` ok |
| 7 | **KEK trước, `init-secrets.sh` sau.** `init-secrets.sh` không bao giờ ghi đè tệp đã có. Phải đặt KEK cũ vào trước, nếu không nó sinh KEK mới và dữ liệu mã hóa coi như mất | root: tạo `/opt/ottimo-prod/secrets/data_kek_current` từ bản ngoại tuyến (`install -o 1000 -g 1000 -m 0400`, đọc từ stdin, không làm tham số lệnh), rồi chạy `init-secrets.sh` | `init-secrets.sh` không báo tạo `data_kek_current` |
| 8 | Khóa công khai `age` vào `backup/recipients.txt` | README 4.3. Dùng cùng khóa công khai cũ để Mac giải mã được bản mới | – |
| 9 | Khôi phục DB: giải mã **trên Mac**, đẩy qua SSH vào `pg_restore`, theo đúng các bước của `restore-drill.sh` (bước 3–4) | `age -d -i <khóa> db-<stamp>.dump.age \| ssh … 'sudo -n -u ottimo …/dc exec -T postgres sh -c "pg_restore -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\" --exit-on-error --single-transaction"'`. Chạy sau `dc up -d postgres`, để `02-roles.sh` tạo các vai | Thoát 0 |
| 10 | Khôi phục kho tệp vào volume `blobdata`, chủ uid 1000, `0700` | Như `restore-drill.sh` bước 4, `tar -xf -` từ stdin | Số tệp trùng biên bản `counts` |
| 11 | Deploy đúng tag đang chạy, kèm digest | `deploy.sh <tag> --api-digest … --web-digest …` (migrate không làm gì vì DB đã đủ). Landing: `deploy-landing.sh <tag landing> --digest …` | `deploy <tag>: ok` |
| 12 | Kiểm: số đếm, trigger, ops-check | `backup-counts.sql` qua `SQLRO` so với `counts-<stamp>` giải mã trên Mac. `ops-check.sh` đủ mục, gồm `db_triggers`, `sshkeys`, `pricegap` | Mọi số trùng, `EXIT: 0` |
| 13 | DNS: bản ghi A trỏ về `<IP-mới>` | INV, `hosting-plan.md` mục 10 | Có chứng chỉ, Desk 200 |
| 14 | Bật timer sao lưu và ops-check. Chạy một lượt sao lưu tay, kéo về Mac | README 12 dòng "Timer production"; runbook v1.0.5 W1 | `OK: <n> encrypted files`, lượt kéo thoát 0 |
| 15 | Cài lại bí mật tích hợp: `--set-booking-chat`, Healthchecks, cổng thanh toán | README 13.2; `integrations.md` | Tin thử tới đúng phòng |

## 2. Mất gì dù làm đúng

- **Dữ liệu ghi sau `<stamp>`**: đơn, folio, thanh toán, yêu cầu web. Lễ tân nhập lại từ sổ giấy, Zalo, sao kê ngân hàng (sổ vận hành).
- Mọi phiên đăng nhập, vì `session_secret` mới. Mã khách đang chờ (≤ 30 phút) cũng mất. Đăng ký Web Push phải làm lại, vì có cặp VAPID mới.
- **`id_hash_key` không có bản ngoại tuyến** (hosting-plan 8.1 chỉ có KEK). Khóa mới làm chỉ mục mù (tìm khách theo số giấy tờ, nhận khách quay lại) và băm chống trùng không khớp với dữ liệu cũ, cho tới khi băm lại (runbook R2, cần lệnh của BE).
  - **Đề xuất cho SEC + ARC:** INV giữ thêm bản ngoại tuyến `id_hash_key` cạnh KEK. Việc này không tốn tiền.
- Các lần xóa theo yêu cầu khách sau `<stamp>` mất cùng `purge_journal` trên máy cũ. Phải làm lại theo danh sách của lễ tân (SR-BAK-06). Các lần xóa theo hạn sẽ tự chạy lại ở đêm đầu (J16).

## 3. Chưa diễn tập: giả định cần kiểm khi diễn tập

Các bước 7, 9, 10 chưa từng chạy trên một stack thật (chỉ `restore-drill.sh` trên stack dùng một lần). Bước 7 chưa có lệnh viết sẵn. Bước 11 giả định `deploy.sh` nhận một DB đã ở đúng số migration. Thời gian 3–4 giờ là ước tính. Diễn tập: B-OPS (OR-M4-drill, cần ESC).
