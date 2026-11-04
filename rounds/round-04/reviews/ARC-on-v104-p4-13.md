# ARC review – P4-13 `v104/be-pn01` (BE-D, PR-H, migration 0095)

- Round 4 (v1.0.4), bước **Review** (ma trận BE → ARC), 04/11/2026.
- Nhánh `origin/v104/be-pn01` @ `3c2b17bb`, nền `origin/v104/be-lease-prices` @ `99f9b4a2`. Chỉ review `git diff 99f9b4a2..3c2b17bb`, gồm 5 tệp:
  - `0095_privacy_notice_append_only_whole_row.sql`;
  - `meta/0095_snapshot.json`, `meta/_journal.json`;
  - `test/integration/privacy-notice-append-only.test.ts`;
  - `rounds/round-04/outputs/BE/v1.0.4-p4-13-pn01.md`.
- Đọc trước:
  - `plan-v1.0.4.md`: dòng P4-13, bảng migration 0093–0095, thứ tự PR-F → G → H;
  - `ARC-on-PR29-pn-01.md`: thẻ PR29-01/02/S1/S2;
  - 0090 trên `main`;
  - `publish-privacy-notice.sql`, `us155-website-requests.r3.spec.ts`;
  - `ops-check.sh` (`check_db_triggers`) và README 13.7 trên `origin/v104/ops-check` @ `045e74b9`;
  - `ARC-on-v104-p4-04-r1.md`, điều kiện 3.

## Phán quyết: **ĐẠT**

- Không có Blocker, Major hay Minor cho BE. Bốn thẻ PR29-01/02/S1/S2 đã đóng thật (mục 1). ARC đã chạy lại trên Postgres 17 và tự thử đột biến (mục 3).
- Chuỗi migration đúng: 0093 (idx 69) → 0094 (idx 70) → 0095 (idx 71). `when` tăng đều +2000. Snapshot 0095 giống 0094, chỉ khác `id`/`prevId`.
- Tên 2 trigger, chủ hàm và quyền `ottimo_app` giữ nguyên. `ops-check` của P4-04 dùng được ngay, không phải sửa. **Điều kiện 3 trong `ARC-on-v104-p4-04-r1.md` coi như đã đóng.**
- PR-H gộp được sau PR-G. Còn 2 thẻ Suggestion cho BE (chữ trong báo cáo) và 2 thẻ cho OPS (P4-04 r1.1, không chặn PR-H).

## 1. Thẻ ARC PR29: đã đóng chưa

| Thẻ | Trạng thái BE | ARC | Bằng chứng |
|---|---|---|---|
| PR29-01 (Minor): so cả hàng | Done | **Verified** | Hàm dùng `(to_jsonb(NEW) - 'superseded_at') = (to_jsonb(OLD) - 'superseded_at')`. Có 2 lớp test: (a) bảng tạm `LIKE … , extra text`: sửa `extra` kèm gắn `superseded_at` thì bị chặn, chỉ gắn `superseded_at` thì qua; (b) chốt đúng 7 cột trong `information_schema.columns`. Đúng cả 2 hướng ARC đề xuất. Đột biến "bỏ dòng so jsonb" làm đỏ 7 ca (mục 3) |
| PR29-02 (Minor): khoảng `superseded_at` | Done | **Verified** | `NEW.superseded_at >= OLD.published_at AND NEW.superseded_at <= now()`. Có 4 ca bị chặn: +1 ngày, +1 giây, `clock_timestamp()`, `published_at − 1 s`. Có 1 ca biên dưới `= published_at` được qua. Ca "mẫu publish" (INSERT `published_at = now()` rồi supersede bằng `now()` trong cùng transaction) được qua. Đối chiếu `publish-privacy-notice.sql` dòng 154/157: cả hai đều dùng `now()`, đúng giả định |
| PR29-S1: ENABLE, không ALWAYS | Done | **Verified** | Chú thích 0095 ghi rõ lý do, nêu tên spec, kèm câu "Do not harden with ENABLE ALWAYS". Test khóa `tgenabled = 'O'` |
| PR29-S2: pg_restore | Done | **Verified** | Câu chú thích đúng nguyên văn đề xuất: "COPY only INSERTs (not trapped here)", trigger tạo ở post-data |

Ngoài thẻ:
- `SECURITY INVOKER` + `SET search_path = pg_catalog, pg_temp`, giống 0094. Thân hàm chỉ dùng `to_jsonb`, toán tử `jsonb -`/`=`, `now()` và so sánh `timestamptz`, tất cả nằm trong `pg_catalog`. Không đọc bảng nào, nên `search_path` hẹp là an toàn.
- Nhánh TRUNCATE giờ nằm ngoài khối đọc OLD/NEW, có test chạy thật trên bảng tạm. Tốt hơn chỉ kiểm catalogue như ở 0090.

## 2. Kiến trúc và triển khai

### 2.1 Không đổi tên, không đổi oid (P4-04 dùng nguyên)
- 0095 chỉ có `CREATE OR REPLACE FUNCTION`, không DROP/CREATE trigger. PG giữ oid hàm, nên `tgfoid` của 2 trigger trỏ đúng thân mới. Trên DB thử: oid không đổi sau nhiều lần nạp lại, và 2 trigger cùng trỏ một oid.
- Câu của `check_db_triggers` (`origin/v104/ops-check`, dòng 537–544) chỉ đọc `tgname`, `tgenabled` và `has_table_privilege`. Trên DB sau 0095, câu đó ra:
  - `privacy_notice_version_append_only|O`;
  - `privacy_notice_version_no_truncate|O`;
  - quyền `ottimo_app`: `t,f,f,f,f`.

  Kết quả khớp đúng mẫu regex, nên ops-check ra `ok`.
- Chủ hàm `ottimo_owner`, `prosecdef = f`, `proconfig = {search_path=pg_catalog, pg_temp}`. Test khóa cả bốn thuộc tính này.
- Không có GRANT/REVOKE. 0090 không đổi một byte (diff không chạm tệp này).

### 2.2 Journal, snapshot, thứ tự gộp
- Journal: 66 (0090) … 68 (0092, giống `origin/main`), 69 (0093), 70 (0094), **71 (0095)**. `when` = `1792782179681` = 0094 + 2000.
- Chuỗi snapshot: 0093 `96671c28` ← 0094 `6691350d` (prevId `96671c28`) ← 0095 `852fa236` (prevId `6691350d`). ARC đã chạy `jq -S 'del(.id,.prevId)'` trên 0094 và 0095: giống hệt.
- Không nhánh v104 nào khác giữ 0095 hay idx 71. Nhánh `be-holds` chỉ có 0093, `be-lease-prices` có 0093 + 0094.
- Rủi ro rebase BE đã ghi đúng. Nếu PR-F/PR-G đổi số trước khi gộp, 0095 lấy lại idx/`when` theo luật journal 4.2a và sinh lại snapshot từ 0094 mới.

### 2.3 Tương thích, quay lui, e2e replica
- 0095 **siết** trigger, không nới. Một UPDATE trước đây lọt qua (`superseded_at` ở tương lai hoặc trước `published_at`, hay sửa cột khác cùng lúc) giờ bị chặn. Không đổi schema, không đổi dữ liệu, không kiểm lại dòng cũ: trigger chỉ xét lúc chuyển từ NULL. Script publish vẫn qua (BE đã chạy thật 6 bước, ARC đối chiếu mã).
- App v1.0.3 (`sha-da6d6f3dc22b`) không ghi bảng này, nên quay lui ảnh mà không lùi DB vẫn an toàn. Xem thẻ BE-P413-S2 về cách ghi chữ.
- e2e US-155 chế độ replica: ARC chạy 2 câu của spec (dòng 63–64, 69–71) bằng superuser với `SET LOCAL session_replication_role = replica`:
  - `superseded_at = now() - 30 days` (trước `published_at`): `UPDATE 1`;
  - `superseded_at = NULL`: `UPDATE 1`.

  Cùng câu đó mà không có replica thì bị chặn (`check_violation`). Spec không gãy.
- Biên đồng hồ: nếu đồng hồ DB bị lùi (NTP chỉnh) giữa 2 lần publish, để `now() < OLD.published_at`, thì publish bị chặn to, không ghi lặng lẽ. Chạy lại sau đó là qua. Hướng "đóng khi lỗi" như vậy là đúng cho bảng bằng chứng, không cần thẻ.

### 2.4 Giả định BE
- **G1 (chỉ dùng `now()`, không hẹn giờ thay bản): đồng ý.** Muốn hẹn giờ thì phải có migration mới, ARC + SEC review. Đây đúng là chỗ cần chặn.
- **G2 (`to_jsonb` tương đương `IS NOT DISTINCT FROM`): đúng với 7 cột hiện có** (uuid, text, timestamptz). ARC đã thử thêm: đổi `published_at` 1 micro giây thì bị chặn, kể cả khi `TimeZone = Asia/Ho_Chi_Minh` (OLD/NEW cùng phiên, cùng múi giờ). Riêng câu "cột lạ sẽ chặn chặt hơn chứ không lỏng hơn" thì chưa chính xác. Với cột `json`, đổi thứ tự khóa hoặc khoảng trắng vẫn qua (ARC đã thử: `t`); với `numeric`, đổi `1.0` thành `1.00` cũng qua. Đó là thay đổi cùng nghĩa, không đổi bằng chứng, và test 7 cột đã buộc review khi thêm cột. Vì vậy chỉ cần sửa chữ: thẻ BE-P413-S1.

## 3. ARC chạy lại

Worktree tạm `scratchpad/wt-arc-p413` @ `3c2b17bb`. Postgres `postgres:17-alpine` (đúng digest CI) trên `127.0.0.1:55513`. Roles tạo bằng `infra/postgres/init/02-roles.sh`, mật khẩu giả công khai của CI. Worktree và container đã xóa sau khi chạy.

- `pnpm db:migrate` (ottimo_migrator → ottimo_owner): `migrations applied`, 72 dòng trong `drizzle.__drizzle_migrations`.
- `privacy-notice-append-only.test.ts` + `migrations-journal.test.ts`: **30/30 xanh**, trong đó tệp PN-01 có **24 ca**.
- Thử đột biến (nạp thân hàm khác vào DB thử, chạy lại tệp PN-01):

| Thân hàm nạp vào | Kết quả |
|---|---|
| 0090 (6 cột viết tay) | 6 đỏ / 24. Khớp báo cáo BE |
| 0095 bỏ dòng so `to_jsonb` | 7 đỏ (6 ca "supersede AND change …" + cột thêm sau) |
| 0095 bỏ `<= now()` | 3 đỏ (+1 ngày, +1 giây, `clock_timestamp()`) |
| 0095 bỏ `>= published_at` | 1 đỏ (trước `published_at`) |
| 0095 nguyên bản | 24/24 xanh |

  Mỗi điều kiện của hàm đều có ít nhất một ca test bắt riêng. Mỗi ca "bị chặn" chạy trong transaction riêng có ROLLBACK, nên một thân quá lỏng làm đỏ từng ca.
- `prettier --check` (test, journal): sạch. `eslint` tệp test: sạch.
- ARC không chạy toàn bộ Vitest api: 0095 chỉ đụng bảng này. Ca đỏ do đo thời gian mà BE nêu ở mục 5 không liên quan, CI sẽ chạy đủ.

## Thẻ feedback

### FB-R4-ARC-BE-P413-S1
- Mức độ: Suggestion
- Vị trí: `rounds/round-04/outputs/BE/v1.0.4-p4-13-pn01.md`, mục 4, G2
- Vấn đề: câu "cột thêm sau mà có kiểu JSON biểu diễn không đơn nghĩa sẽ bị chặn chặt hơn chứ không lỏng hơn" chưa đúng hẳn. `to_jsonb` chuẩn hóa giá trị:
  - với cột `json`, đổi thứ tự khóa hoặc khoảng trắng vẫn qua;
  - với `numeric`, đổi `1.0` thành `1.00` vẫn qua.

  ARC đã thử trên PG 17, cả hai đều ra `t`.
- Vì sao quan trọng: người thêm cột sau dựa vào câu này để quyết định có cần sửa hàm không. Thực tế, các thay đổi đó cùng nghĩa nên không làm yếu bằng chứng, và test 7 cột đã buộc phải review. Rủi ro thấp, nhưng tài liệu nên nói đúng.
- Đề xuất sửa: ghi lại G2 thành "`to_jsonb` so theo giá trị đã chuẩn hóa: cùng nghĩa thì coi là bằng (khóa `json` đổi thứ tự, `numeric` đổi scale). Với 7 cột hiện có thì tương đương `IS NOT DISTINCT FROM`. Thêm cột thì test 7 cột đỏ, phải review lại hàm". Không cần sửa mã.
- Trạng thái: Open

### FB-R4-ARC-BE-P413-S2
- Mức độ: Suggestion
- Vị trí: `v1.0.4-p4-13-pn01.md`, mục 1 "Migration", dòng "Chỉ nới/giữ"; và runbook v1.0.4 (P4-04) dòng "migration 0092–0095 chỉ nới"
- Vấn đề: 0095 **siết** trigger, không nới. Ví dụ: một UPDATE gắn `superseded_at` ở tương lai trước đây lọt qua, giờ bị chặn. Gọi là "chỉ nới" thì sai về chữ, dù kết luận quay lui vẫn đúng.
- Vì sao quan trọng: bảng quay lui của runbook dùng chữ "chỉ nới" để kết luận "lùi ảnh, không lùi DB". Lý do đúng ở đây là "không đổi schema, không đổi dữ liệu, và người ghi duy nhất (script publish, dùng `now()`) vẫn qua". Ghi đúng lý do thì lần sau gặp migration siết thật, người đọc không suy rộng sai.
- Đề xuất sửa: báo cáo BE ghi "Siết trigger, không đổi schema/dữ liệu; v1.0.3 không ghi bảng; script publish vẫn qua → lùi ảnh không lùi DB". Báo OPS dùng cùng câu cho 0095 trong runbook P4-04.
- Trạng thái: Open

### FB-R4-ARC-OPS-P413-01
- Mức độ: Minor
- Vị trí: `product/infra/server/README.md`, mục 13.7 "Luật thường trực": dòng 457 trên `main`, dòng 477 trên `origin/v104/ops-check`. Câu "(ví dụ PN-01 Minor, 0094)"
- Vấn đề: PN-01 Minor nay là migration **0095** (plan-v1.0.4 bảng migration; 0094 là trigger `room_list_price` của P4-11).
- Vì sao quan trọng: đây là luật vận hành cho bảng bằng chứng đồng ý. Ghi sai số migration làm người trực ca tìm nhầm tệp khi đối chiếu thân hàm.
- Đề xuất sửa: trong P4-04 r1.1, đổi thành "(ví dụ PN-01 Minor, 0095)". Có thể thêm "0095 đặt SECURITY INVOKER + search_path cố định".
- Trạng thái: Open

### FB-R4-ARC-OPS-P413-S1
- Mức độ: Suggestion
- Vị trí: `product/infra/server/bin/ops-check.sh`, `check_db_triggers`, câu `'pn'` (dòng 537–539 trên `origin/v104/ops-check`)
- Vấn đề: với `room_list_price`, ops-check đọc `prosecdef` và bắt buộc phải là `f`. Với 2 trigger PN-01 thì chỉ đọc `tgenabled`. Sau 0095, hàm PN-01 cũng được khai báo rõ là SECURITY INVOKER (CI khóa bằng test), nhưng trên production thì không có câu kiểm nào xác nhận.
- Vì sao quan trọng: cùng một loại hàm gác thì nên kiểm cùng một cách. Chủ bảng `CREATE OR REPLACE` tay với SECURITY DEFINER sẽ không lộ ra (README 13.7 cấm việc này). Rủi ro thấp, vì hàm không đọc bảng nào.
- Đề xuất sửa (tùy OPS): `JOIN pg_proc p ON p.oid = t.tgfoid`, in thêm `p.prosecdef`, regex `^pn\|(…)\|([OoRAD])\|([tf])$`, và `t` thì FAIL, giống nhánh `rlp`. Thêm một ca trong `ops-check*.test.sh`. Không chặn PR-H hay PR-M.
- Trạng thái: Open

## Điểm làm tốt
- Đóng đúng và đủ thẻ. Thử đột biến bằng thân 0090 cho thấy test mới thật sự bắt được lỗi. Mỗi ca chặn chạy trong transaction riêng có ROLLBACK, nên một thân lỏng không thể "qua nhờ ca trước".
- Giữ nguyên "hợp đồng vận hành": tên trigger, oid hàm, chủ hàm, mã lỗi, tiền tố thông báo, quyền `ottimo_app`. Có test khóa từng thứ. OPS P4-04 không phải sửa gì.
- Kiểm đúng 3 chỗ dễ gãy: chạy thật `publish-privacy-notice.sql` 6 bước, chạy 2 câu e2e ở chế độ replica, và ca biên dưới `superseded_at = published_at`.
