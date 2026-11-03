# ARC duyệt runbook phát hành v1.0.2 – mục 1.3, 4, 5, 6 (quay lui về v1.0.1 trên DB đã có 0089 + 0090)

- Tệp được duyệt: `rounds/round-04/outputs/OPS/v1.0.2-release-runbook.md` @ `d80abde3`, mục 1.3, 4, 5, 6. Có đọc thêm K2/K3, K4 và mục 8 vì mục 5 dùng lại chúng.
- Người duyệt: ARC. Round 4, đợt v1.0.2, bước **Review**, ngày 03/11/2026. Đây là phần ARC của **ĐK3** trong `rounds/round-04/qc/v1.0.2-gate.md`: "ARC ghi một dòng xác nhận v1.0.1 chạy được trên DB 0089".
- Cách duyệt: chỉ đọc mã trong repo và `git show v1.0.1:…`. Không SSH tới staging hay production, không chạy SQL, không sửa runbook, không commit.
  - Migration: `0089_simulation_guard_room_price_cancel.sql`, `0090_privacy_notice_append_only.sql`, `meta/_journal.json` (ở `e5fffe05` và ở `v1.0.1`).
  - Đường deploy: `product/infra/server/bin/deploy.sh` (nhánh `--rollback`, bước `migrate` dòng 160–173, `restore_previous`/`fail` dòng 176–188, `record` dòng 263–275), `rollback.sh`, `product/infra/postgres/init/02-roles.sh`, `test/rollback.test.sh`.
  - Bộ migrate của v1.0.1: `src/db/migrate.ts` @ `v1.0.1`, và `drizzle-orm` 0.45.4 (`pg-core/dialect.js`, hàm `migrate`). Phiên bản này giống nhau ở v1.0.1 và v1.0.2.
  - Mã v1.0.1 đụng tới `room_list_price`, `simulation_guard`, `privacy_notice_version`, `audit_event`, nhãn dòng folio, worker/jobs. Thêm diff `v1.0.1..e5fffe05` của `services/api/src` để biết v1.0.2 **ghi** loại dữ liệu nào mà v1.0.1 sẽ phải **đọc** sau khi quay lui.

## Kết luận: **ĐẠT** – xác nhận ARC cho ĐK3: **ĐÚNG**

> **Dòng xác nhận ARC (ĐK3):** v1.0.1 (`sha-755cad1642ca`) chạy được trên DB đã có 0089 + 0090. Bộ migrate của v1.0.1 không chạy gì, `deploy.sh --rollback` nhận `67 ≥ 65`. Mã v1.0.1 không đụng `simulation_guard`, không ghi `privacy_notice_version` (nên không chạm trigger 0090), và không dùng quyền `DELETE` trên `room_list_price`. Dữ liệu v1.0.2 ghi ra (giá hẹn, B16, audit) đều là loại v1.0.1 đã đọc được. Quay lui chỉ đổi image, không hạ schema, không restore.

Mục 1.3, 4, 5, 6 **đúng với mã**. Không có Blocker. Có **1 Major**: runbook chưa có diễn tập trên staging. Việc này thuộc **ĐK4**, không thuộc ĐK3, nên không đổi xác nhận trên, nhưng phải xong trước P0. Có thêm 1 Minor và 1 Suggestion.

---

## 1. Đối chiếu từng ý

### 1.1 Migrator của image v1.0.1 khi DB đi trước: không chạy gì

- `migrate.ts` @ v1.0.1 gọi `migrate()` của drizzle 0.45.4. Hàm này lấy **một** dòng `__drizzle_migrations` có `created_at` lớn nhất, rồi chỉ chạy migration có `folderMillis` (= `when` trong journal) **lớn hơn** giá trị đó (`dialect.js` dòng 56–69). Drizzle không so số dòng, không so hash.
- Sau v1.0.2, `created_at` lớn nhất = `1792782169681` (0090). Journal v1.0.1 có 65 mục, `when` cuối = `1792782165681` (0088). Vậy mọi mục đều không lớn hơn, và drizzle mở rồi đóng một giao dịch rỗng. `CREATE SCHEMA/TABLE IF NOT EXISTS drizzle…` cũng không làm gì.
- Bước đếm trong `deploy.sh` (dòng 163–173): `--rollback` dùng `applied -ge journal` → `67 ≥ 65` qua. Dòng log `migrations: 67 applied / 65 in the image journal` đúng như R4 ghi.
- Hash trong K2 khớp băm tệp ở `e5fffe05`: 0089 = `5d0c0294…4a09`, 0090 = `2c90ac33…1ccf`. Thứ tự `ORDER BY created_at DESC` ra 0090 trước, như runbook ghi.
- API và worker của v1.0.1 **không** tự kiểm schema khi khởi động: không đọc `__drizzle_migrations` hay journal. Vì vậy chúng không từ chối chạy khi DB đi trước.

### 1.2 0089 – bảng `simulation_guard`, trigger, quyền

| Điểm | Mã v1.0.1 | Rủi ro khi chạy v1.0.1 |
|---|---|---|
| Bảng `simulation_guard` (RLS + FORCE) | Không có trong v1.0.1. `git grep` ở tag không có tên bảng ngoài migration | Không. Bảng rỗng ngoài lúc đang tính thử, vì `Database.simulate` luôn ROLLBACK |
| Constraint trigger `simulation_guard_no_commit` (luôn RAISE khi commit) | Chỉ bắn khi có `INSERT` vào `simulation_guard`, mà v1.0.1 không bao giờ ghi bảng này | Không |
| `GRANT INSERT ON simulation_guard TO ottimo_app` | Không dùng | Không |
| `GRANT DELETE ON room_list_price TO ottimo_app` | v1.0.1 chỉ `SELECT`/`INSERT … ON CONFLICT DO UPDATE` (`rooms.service.ts` `writePrice`, `room-catalog-import.ts`). Không có `DELETE FROM room_list_price` | Không có lỗi chạy. Quyền thừa vẫn còn sau quay lui, nhưng RLS `tenant_isolation` (0005, FORCE, áp mọi lệnh) giới hạn theo cơ sở. Phần còn lại (DELETE được cả dòng giá đã qua) là FB-R4-ARC-BE-A-ED-02, đã Deferred v1.0.3, rủi ro không đổi khi quay lui |
| `02-roles.sh` chạy ở mỗi deploy (bước `roles`) | Chỉ đặt thuộc tính vai, mật khẩu, quyền DB/schema, `DEFAULT PRIVILEGES` cho `ottimo_readonly`. **Không** `REVOKE` quyền bảng | Không thu hồi quyền của 0089, kể cả khi deploy lại v1.0.2 sau quay lui. `ottimo_readonly` có thêm `SELECT` trên `simulation_guard` qua default privileges, vô hại |

### 1.3 0090 – trigger chặn ghi trên `privacy_notice_version`

- Mã app v1.0.1 chỉ có **hai câu SELECT** trên bảng này: `public-booking.service.ts` dòng 610 và 835. `ottimo_app` chỉ có `SELECT` (0086). Không có `UPDATE`, `DELETE` hay `TRUNCATE` nào trong `services/api/src` ở tag (đã `git grep -i truncate`: chỉ ra biến trong `time.ts`).
- Người ghi duy nhất là `publish-privacy-notice.sql`. Gói infra production là bản v1.0.1, và tệp này không đổi tới `e5fffe05`. Tệp chỉ `INSERT`, và `UPDATE … SET superseded_at = now() WHERE … superseded_at IS NULL`. Trigger cho qua đúng ca này vì so đủ 6 cột còn lại, khớp đủ 7 cột của schema. QA đã chạy thử `apply=false` trên staging và ra `dry-run-ok`.
- Worker v1.0.1: thư mục `src/jobs/` và `worker-jobs.ts` không đổi giữa `v1.0.1` và `e5fffe05`. Không job nào đụng `privacy_notice_version`. Job xóa theo hạn lưu chỉ xóa `website_booking_request` (bảng con), không đụng bảng cha.
- `restore-drill` (v1.0.1 và bản mới) chỉ đọc bảng này. `pg_restore` dựng trigger sau khi nạp dữ liệu, và COPY không kích trigger UPDATE/DELETE/TRUNCATE.

### 1.4 Dữ liệu v1.0.2 ghi ra, v1.0.1 đọc lại sau quay lui

| v1.0.2 ghi | v1.0.1 đọc thế nào | Kết luận |
|---|---|---|
| Giá hẹn (`room_list_price`, `effective_from` > ngày nghiệp vụ) | v1.0.1 đã cho đặt giá có ngày tương lai (`writePrice`, `effectiveFrom ≥ today`), và các câu tính giá đọc theo `effective_from` | Áp đúng khi tới ngày, như mục 1.3 ghi. Desk v1.0.1 không thấy danh sách giá hẹn (BUG-R3-018), nhưng vẫn có cách thay một giá hẹn (thẻ 03) |
| Xóa giá hẹn (`DELETE` một dòng) | Dòng không còn → giá ngày đó lấy từ dòng trước | Không có gì để đọc sai |
| B16 thật: dòng folio `early_departure_fee`, yêu cầu `refund` (`reasonCode: early_departure`) | v1.0.1 đã có B16 phía server với cùng loại dòng và loại yêu cầu. Khác biệt: dòng phần OTA nay có `description = 'early_departure'` (không có `Nd`) và `labelParams = {nights}` | `line-labels.ts` @ v1.0.1 ra `noticeDays: null`, sau đó `clean()` bỏ giá trị null. `admin-web/src/app/folio.ts` chọn khóa gốc `bill.line.early_departure_fee` khi thiếu `noticeDays`. Bill hiện đúng, không in `{noticeDays}` |
| Audit: khóa mới trong `before/after` (`previewConfirmed`, `expectedRefundVnd`…, `cancelledEffectiveFrom`), action `room.list_price_cancelled` | Danh sách cho phép (`audit-fields.ts`) chỉ dùng **khi ghi**. Khi đọc, `audit-log.controller.ts` trả JSON nguyên dạng. Trang Nhật ký tiền (`MoneyPage.tsx`) có nhánh `mlog.a_other` cho action lạ. v1.0.2 không thêm action `money` mới | Không lỗi |
| Tin Chat / email trong hàng đợi lúc đổi image | Hàng đợi dùng chung schema và chủ đề. v1.0.1 làm sạch tin bằng bộ lọc cũ (bản đang chạy production tới hôm nay) | Chấp nhận được, đúng hành vi v1.0.1 |

### 1.5 Mục 4 – bảng lỗi theo `step=`

- Đúng với `deploy.sh`:
  - `restore_previous` chỉ chạy khi `rollback -eq 0` và lỗi ở `switch`/`smoke` (hàm `fail`);
  - lỗi ở bước trước đó thì `exit` trước khi đổi container;
  - `record` chưa chạy nên `current_tag` giữ `sha-755cad1642ca` và `previous_tag` giữ `sha-8b3aec89486f`. Vì vậy luật "không bao giờ chạy `rollback.sh` không tham số" là đúng và cần thiết.
- Dòng `migrate` đúng: drizzle chạy cả 0089 + 0090 trong **một** `session.transaction`. SQL lỗi thì DB vẫn 65; SQL xong mà bước đếm lỗi thì DB 67. Cả hai ca, v1.0.1 vẫn chạy đúng như mục 1.1–1.4.
- Lúc `migrate` chạy, v1.0.1 vẫn phục vụ. `CREATE TRIGGER` trên `privacy_notice_version` lấy khóa SHARE ROW EXCLUSIVE, `GRANT` lấy khóa ngắn. Chỉ có thể chờ một câu SELECT ngắn của form. Production chưa có khách (G2), nên không cần thêm bước.

### 1.6 Mục 5 – R1 đến R7

- R4: dòng "Đúng là" khớp đúng từng `log` trong `deploy.sh`: `deploy … rollback=1`, `image digests match the release`, `api/worker configuration accepted…`, `02-roles.sh applied…`, `migrations: 67 applied / 65…`, `OK: … is live`. Production guard lấy digest từ `state/digests/sha-755cad1642ca` (dòng 78–80). `rollback.sh <tag>` chuyển đúng `--rollback` (dòng 22).
- R5: sau R4, `record` ghi `previous_tag = sha-e5fffe05ed55`. Câu cấm `rollback.sh` không tham số là đúng.
- R6: dòng worker dạng cũ `{"level":"A","msg":"chat detail level"}` đúng với v1.0.1 (`JSON.stringify({ level, msg, ...extra })`, nên `extra.level` đè `level`).
- Đường deploy trên production là gói infra v1.0.1. `git diff v1.0.1 e5fffe05` không đổi `deploy.sh`, `rollback.sh`, `dc`, `docker-compose.prod.yml` hay `postgres/`. Vậy mã ARC đọc ở `HEAD` chính là mã sẽ chạy.

### 1.7 Mục 6 – bảng dừng

Đúng và đủ với các bước P0–K7. Dòng P0 nên có thêm ĐK4 (thẻ 01).

---

## 2. Thẻ feedback

### FB-R4-ARC-OPS-V102RB-01
- Mức độ: **Major**
- Vị trí: runbook mục 1.3, gạch đầu dòng thứ ba ("`rollback.test.sh` (CI) đã diễn tập đúng ca database ahead"); mục 3 P0; mục 6 dòng P0. Đối chiếu QC `v1.0.2-gate.md` **ĐK4** (cột "Trước khi INV duyệt Release", bằng chứng "Log diễn tập, ghi trong runbook").
- Vấn đề:
  - Runbook không có bước, lệnh hay ô ghi log cho việc diễn tập quay lui trên staging (ĐK4). P0 chỉ ghi chung "các điều kiện trước Release đã xong".
  - Mục 1.3 lấy `rollback.test.sh` làm bằng chứng. Nhưng test này giả lập `dc`, `docker`, `curl` (dòng 2–4 của test), và số migration là số giả (`40 applied / 39`). Nó chứng minh **cổng đếm** của `deploy.sh`. Nó **không** chạy bộ migrate drizzle thật của image v1.0.1 trên DB có 0089/0090, và không khởi động api/worker v1.0.1 trên DB đó.
  - Xác nhận của ARC ở trên dựa trên đọc mã, giống S4 của QC ("về lý thuyết"). Chưa có lần chạy thật nào.
- Vì sao quan trọng: đây là đường lùi duy nhất khi v1.0.2 hỏng trên production, mà không mất dữ liệu. Staging đang ở 67 migration, cùng image `sha-755cad1642ca` có sẵn trên Docker daemon dùng chung. Một lần chạy 5–10 phút trên staging biến "lý thuyết" thành bằng chứng, và cho ORC thấy trước đúng 6 dòng log của R4.
- Đề xuất sửa: OPS thêm mục **"5.0 Diễn tập trên staging (ĐK4)"**, rồi thêm một ô vào P0: "ĐK4 có log, MA THOAT 0 cả hai chiều". Nội dung tối thiểu:
  1. Cùng khuôn lệnh R4, nhưng trên home staging (`/opt/ottimo`, OPS xác nhận đường dẫn): `rollback.sh sha-755cad1642ca` → `MA THOAT: 0`, có dòng `migrations: 67 applied / 65 in the image journal`.
  2. Kiểm như R5/R6 trên staging: `dc ps` api/web healthy với `sha-755cad1642ca`; worker không có `job failed`; K2 READ ONLY vẫn 67, 2 trigger `O`, `simulation_guard` 0 dòng; `smoke-prod` chỉ đọc PS-01…05; Desk mở được một đơn và một báo giá.
  3. Đưa lại v1.0.2: `deploy.sh sha-e5fffe05ed55` (deploy thường, phải ra `67 applied / 67`) → `MA THOAT: 0`, `current_tag = sha-e5fffe05ed55`. Không duyệt job CI `deploy staging` nào khác trong lúc này (R1 mục 8).
  4. Giới hạn:
     - xong trước 06:00 ngày 04/11, vì ĐK10 cần v1.0.2 chạy B18 sau B16 trên dữ liệu QA;
     - tránh giờ chạy job theo lịch của worker, vì worker v1.0.1 sẽ chạy job trên dữ liệu QA nếu trùng giờ;
     - không xóa hay sửa dữ liệu;
     - dán 6 dòng `[deploy` của cả hai chiều vào runbook (mục 5.0) và decision-log.
  5. Sửa câu ở 1.3 thành: "`rollback.test.sh` kiểm cổng đếm của `deploy.sh --rollback` (giả lập). Bộ migrate và app v1.0.1 chạy thật trên DB 67 được chứng minh ở 5.0 (staging)."
- Trạng thái: Open

### FB-R4-ARC-OPS-V102RB-02
- Mức độ: **Minor**
- Vị trí: runbook mục 5, R4, gạch đầu dòng "Mọi kết quả khác … không chạy lại, báo OPS ngay, chạy R6. `rollback.sh` không tự trả về v1.0.2 khi hỏng."
- Vấn đề: câu này đúng, nhưng chỉ dẫn tiếp thì thiếu ở hai ca:
  - (a) **Lỗi `pull`** (GHCR lỗi mạng hay đăng nhập). Image v1.0.1 vẫn có trên máy (mục 8, R3), và `rollback.sh` chuyển tiếp `--no-pull` (`"$@"`). Digest vẫn được kiểm trên `RepoDigests` của image có sẵn trên máy (`digest_ok`). Runbook chưa nêu cách này.
  - (b) **Lỗi `switch`/`smoke` khi đang quay lui.** Với `--rollback`, `restore_previous` bị tắt. Có thể không còn bản nào healthy (v1.0.2 đã bị gỡ, v1.0.1 không lên). Lúc đó `current_tag` vẫn là `sha-e5fffe05ed55`, vì `record` chưa chạy. `state/digests/sha-e5fffe05ed55` đã có từ lượt Release, nên `rollback.sh sha-e5fffe05ed55` đưa đúng image đã phát hành lên lại: guard lấy digest từ state, `67 ≥ 67` qua. Lệnh này không vượt Release, vì cùng digest Release đã kiểm. Runbook hiện chỉ ghi "báo OPS", nên Desk có thể nằm im trong lúc chờ OPS.
  - (c) Lỗi ở bước trước `switch` (`config`, `pull`, `appconfig`, `roles`, `migrate`) thì v1.0.2 vẫn đang chạy. Nhưng R6 lại ghi "Đúng là" theo v1.0.1, nên ORC có thể đọc nhầm.
- Vì sao quan trọng: thời gian Desk ngừng khi quay lui hỏng. Hiện chưa có khách (G2), nên chỉ là Minor. Tuy vậy, runbook là thứ ORC làm theo từng chữ.
- Đề xuất sửa: thêm "R4b. Khi R4 lỗi" gồm 3 dòng:
  - (a) `MA THOAT: 1`, có dòng lỗi registry, chưa có dòng `migrations:` → INV đồng ý → chạy lại R4 với `rollback.sh sha-755cad1642ca --no-pull`;
  - (b) có `FAIL:` sau dòng `migrations:` → chạy R2. Nếu api không healthy → INV đồng ý → `rollback.sh sha-e5fffe05ed55` (cùng khuôn grep R4). "Đúng là": `OK: sha-e5fffe05ed55 is live`, `67 applied / 67`. Rồi báo OPS;
  - (c) lỗi trước dòng `migrations:` → chưa đổi gì, chạy K1 (không phải R6) để xác nhận v1.0.2 vẫn chạy.
- Trạng thái: Open

### FB-R4-ARC-OPS-V102RB-03
- Mức độ: **Suggestion**
- Vị trí: mục 1.3 "Hệ quả nghiệp vụ" (gạch 2) và R7 gạch 2 ("không hủy được trên Desk. OWN ghi lại nếu muốn bỏ một giá hẹn").
- Vấn đề: v1.0.1 không hủy được giá hẹn, nhưng **thay** được. Trong `RoomDrawer.tsx` @ v1.0.1 (dòng 88–93, nhánh `restate`), nhập lại đúng giá hiện hành với ngày hiệu lực là ngày của giá hẹn sẽ ghi đè dòng đó. Phía server, `writePrice` làm `ON CONFLICT (room_id, effective_from) DO UPDATE … WHERE effective_from >= today`. Kết quả tương đương việc hủy giá hẹn. Có một điểm vướng: Desk v1.0.1 không hiện ngày của các giá hẹn.
- Vì sao quan trọng: nếu một giá hẹn sai mà phải quay lui, lễ tân/OWN có cách tự sửa trước ngày áp, thay vì chờ v1.0.3.
- Đề xuất sửa:
  - ở R2, thêm một câu SQL READ ONLY liệt kê giá hẹn: `SELECT r.room_no, p.effective_from, p.monthly_list_price_vnd, p.nightly_list_price_vnd FROM room_list_price p JOIN room r ON r.id = p.room_id WHERE p.effective_from > (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ORDER BY 1, 2;` (OPS chỉnh cho đúng ngày nghiệp vụ). Số liệu này không chứa dữ liệu khách;
  - ở R7, ghi: "Muốn bỏ giá hẹn ngày X của căn Y: OWN mở căn, nhập lại đúng giá hiện hành, chọn ngày hiệu lực X, lưu";
  - QA thử thao tác này một lần trong buổi diễn tập 5.0 (thẻ 01).
- Trạng thái: Open

---

## 3. Điểm làm tốt (nên giữ)

- Mục 1.3 tách đúng hai việc: quay lui image và khôi phục dữ liệu. Câu "không restore để quay lui, không SQL tay, không xóa trigger 0090" vừa đúng thiết kế "expand trước, contract sau" (hosting-plan 6.3), vừa đúng yêu cầu ★2 của SEC.
- Mục 4 đọc đúng hành vi thật của `deploy.sh` ở từng `step=`, gồm các ca khó nhất: `current_tag`/`previous_tag` sau khi tự trả về bản cũ, và cấm `rollback.sh` không tham số. Đây là chỗ dễ đưa nhầm v1.0.0 lên nhất.
- K2 kiểm cả hash migration và `tgenabled`, không chỉ đếm dòng. Hash khớp băm tệp ở `e5fffe05`, nên K2 dùng được làm bằng chứng cho SEC.
