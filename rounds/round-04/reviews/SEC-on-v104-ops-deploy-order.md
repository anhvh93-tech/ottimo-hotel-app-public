# SEC review P4-02 `v104/ops-deploy-order` (thứ tự đổi container)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/ops-deploy-order` @ **`eef44c02`** (1 commit trên `c6cd32a8`). So với `origin/main` @ `7b5b6117` bằng `git diff origin/main...eef44c02`.
- Tệp đã đọc: `product/infra/server/bin/deploy.sh`, `bin/rollback.sh`, `test/rollback.test.sh`, `rounds/round-04/outputs/OPS/v1.0.4-ops-deploy-order.md`.
- Căn cứ: `plan-v1.0.4.md` P4-02, FB-R4-OPS-ARC-31-01 (điều kiện ARC ở `ARC-on-PR32.md` mục 1), SEC-on-PR26-rollback (guard production, digest).
- Không tự chạy test (OPS báo 23/23 trên Mac; CI chạy lại khi mở PR). Không sửa tệp nào ngoài tệp này.

---

## 0. Kết luận

**ĐẠT.** Không có thẻ Blocker, Major hay Minor. Một ghi chú Info.

- Kiểm thêm theo yêu cầu ORC:
  - không bí mật, không IP, không email trong diff (quét regex email/IPv4/khóa: 0 kết quả);
  - không in digest đầy đủ (diff không chạm phần digest; `rollback.sh` vẫn kiểm `state/digests/<tag>` sau pull);
  - không có SQL nào (gói chỉ đổi bước `switch`).
- Điều kiện đóng FB-R4-OPS-ARC-31-01 vẫn là diễn tập 5.0 trên staging (OPS mục 6). Việc đó thuộc ARC/ORC, không phải điều kiện SEC.

## 1. Điểm đã kiểm

| Điểm | Kết quả |
|---|---|
| Guard production, kiểm digest, `appconfig`, `roles` (SEC H3), `migrate` trước mọi đổi container | **Không đổi.** `migrate` vẫn chạy trước `switch-worker`, nên worker mới không bao giờ chạy trên schema cũ |
| Thứ tự deploy: `worker` → `api web`; quay lui: `api web` → `worker` | Đúng ý ARC. Mỗi `dc up` chỉ một nhóm. Test (o) chặn việc gộp lại |
| `restore_previous` khi deploy lỗi | Đi theo thứ tự quay lui. Nếu `api web` cũ không lên healthy thì **không** chạy worker cũ. Đây là hướng hỏng an toàn: worker mới (biết mọi mẫu thư) tiếp tục xử lý job, không có job nào bị giết thành `BAD_TEMPLATE` |
| `--rollback` lỗi giữa chừng | Như cũ, không tự đưa bản khác lên. Nếu lỗi ở `switch-worker` thì đang có api cũ + worker mới, là tổ hợp an toàn (worker mới đọc được job của api cũ) |
| `--remove-orphans` chỉ ở `up` đầu | Không đụng container one-off của `mail-test` (container của service đã khai báo không phải orphan) |
| Tên bước mới `switch-worker` / `switch-api` | `deploy-from-ci.sh` vẫn lọc `a-z-` và cắt 32 ký tự, nên tên bước không mang được dữ liệu lạ ra log CI |
| Số dòng `[deploy …]` | Giữ đúng 6 dòng. Tờ lệnh INV cũ (R4) không phải sửa. Test (i), (k) khóa điều này |
| Log mới | Chỉ có tên tag và chữ cố định. Không in `.env`, digest hay đầu ra `dc logs` |

## 2. Thẻ

### Info (không bắt buộc)

#### FB-R4-SEC-OPS-P402-I1: `worker_stays_up` 3 giây chỉ bắt lỗi khởi động sớm
- Vị trí: `deploy.sh` hàm `worker_stays_up`.
- Ghi chú: worker có `restart` thì một vòng chết–khởi động lại có thể đang ở trạng thái `running` đúng lúc kiểm. Bước `smoke` (chờ 5 giây, kiểm worker chạy) vẫn là lớp thứ hai, như OPS ghi ở G2. Không có hệ quả bảo mật. Nếu diễn tập 5.0 thấy worker lỗi muộn mà vẫn qua, OPS cân nhắc kiểm `RestartCount` không tăng giữa hai lần đọc.
- Trạng thái: Open (Info).

## 3. Điểm làm tốt
- Trường hợp (n) được nghĩ tới và có test: không chạy worker cũ cạnh api mới khi khôi phục thất bại.
- Test kiểm thứ tự bằng **thứ tự dòng lời gọi**, và OPS chạy thử test với `deploy.sh` cũ để chắc test bắt được mã cũ.
- Không thêm dòng log nào làm lệch các tờ lệnh INV đã phát.

## 4. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-02 ops-deploy-order @ eef44c02: ĐẠT** (rounds/round-04/reviews/SEC-on-v104-ops-deploy-order.md): thứ tự worker → api+web / quay lui api+web → worker, restore_previous không chạy worker cũ khi api cũ không lên (hỏng an toàn); guard, digest, roles, migrate không đổi; không bí mật/IP/email/SQL. Info P402-I1. Đóng ARC-31-01 vẫn chờ diễn tập 5.0 | SEC | Quyền SEC |`

---

## 5. Xác nhận PR #45 tại đầu `051e1750` (04/11)

- Lý do: SEC quyết đưa `deploy.sh` và `rollback.sh` vào đường dẫn SEC của CODEOWNERS (SEC-on-v104-ops-scripts mục 5.2 (b)). Vì vậy PR #45 cần tệp SEC nêu đúng đầu nhánh.
- Đối tượng: `origin/v104/ops-deploy-order` @ **`051e1750`** (một commit trên `eef44c02`, ARC FB-R4-ARC-OPS-P402-01). Tệp: `deploy.sh`, `test/rollback.test.sh` (ca l2/l3/l4), báo cáo OPS, `responses/OPS-P4-02.md`.

**Kết luận: ĐẠT. Được gộp PR #45 ở `051e1750`.** Không có thẻ mới. **FB-R4-SEC-OPS-P402-I1: Verified** (đóng).

| Kiểm | Kết quả |
|---|---|
| Kiểm worker | `worker_stays_up` (chỉ xem `running`) thay bằng `worker_ok`. Hàm này đọc `State.Running` + `RestartCount` của **đúng** container sau bước switch, và từ chối nếu container bị thay hoặc số lần khởi động lại tăng. Bước `smoke` gọi lại cùng hàm sau 5 giây. Đây đúng là điều thẻ Info P402-I1 gợi ý (bắt worker chết–khởi động lại vòng lặp) |
| Đọc gì | `docker inspect` chỉ in `{{.State.Running}} {{.RestartCount}}`. Câu lỗi chỉ có chữ cố định, số lần khởi động lại, hoặc trạng thái đọc được. Không in env, cấu hình, digest hay log container |
| Hỏng an toàn | Không có container, không đọc được số, hoặc container bị thay → `fail` → `restore_previous` theo thứ tự quay lui đã duyệt |
| Phần không đổi | Guard production, digest, `roles`, `migrate`, thứ tự switch, 6 dòng `[deploy`, `rollback.sh` |
| Bí mật, IP, email, SQL | Không có |
