# SEC review P4-13 `v104/be-pn01` – migration 0095 (PN-01 Minor)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/be-pn01` @ **`3c2b17bb`**. Chỉ xem `git diff 99f9b4a2..3c2b17bb`, nền là `origin/v104/be-lease-prices` @ `99f9b4a2`. Gồm 5 tệp:
  - `0095_privacy_notice_append_only_whole_row.sql`;
  - `meta/0095_snapshot.json`;
  - `meta/_journal.json`;
  - `test/integration/privacy-notice-append-only.test.ts`;
  - `rounds/round-04/outputs/BE/v1.0.4-p4-13-pn01.md`.
- Căn cứ:
  - thẻ FB-R4-SEC-BE-PN01-01/02/03 (`SEC-on-PR29-pn-01.md`);
  - `0090_privacy_notice_append_only.sql` trên `main`;
  - luật migration mở rộng ở thẻ FB-R4-SEC-OPS-P404R1-01 (`SEC-on-v104-p4-04-r1.md`);
  - `infra/server/publish-privacy-notice.sql`;
  - `check_db_triggers` của `ops-check.sh` trên `origin/v104/ops-check`.
- Không chạy lệnh nào trên staging hay production. Không sửa tệp nào ngoài tệp này.

### Đã tự kiểm

Môi trường: worktree tạm `scratchpad/wt-sec-p413` tách khỏi `3c2b17bb`, container `postgres:17-alpine` tạm `sec-p413-pg` (cổng 127.0.0.1). Roles tạo bằng `02-roles.sh` với mật khẩu giả công khai của CI. Đã xóa cả hai sau khi chạy.

| Kiểm | Kết quả |
|---|---|
| `pnpm db:migrate` (ottimo_migrator → SET ROLE ottimo_owner), 0001 → 0095 | Áp thành công |
| `privacy-notice-append-only.test.ts` + `migrations-journal.test.ts` | 30/30 đạt (24 ca ở tệp PN-01) |
| **Đột biến:** nạp lại thân hàm 0090 | 6 ca đỏ (tương lai 1 ngày, +1 giây, `clock_timestamp()`, trước `published_at`, cột thêm sau, catalogue hàm). Nạp lại thân 0095 thì 24/24 xanh. Khớp báo cáo BE |
| Luật migration 5.2 (a) bản mở rộng (thẻ P404R1-01) trên diff | **Không khớp dòng nào.** Không GRANT/REVOKE, DISABLE TRIGGER, POLICY, SECURITY DEFINER, OWNER TO, SET/RESET ROLE, SESSION AUTHORIZATION hay `session_replication_role` ngoài chú thích. `SECURITY INVOKER` và `SET search_path` không thuộc luật |
| Snapshot | `jq -S 'del(.id,.prevId)'` của 0095 = 0094. `prevId` 0095 = `id` 0094 (`6691350d-…`) |
| Journal | idx 71, `when` = 0094 + 2000, tag đúng tên tệp |
| Quyền trên `privacy_notice_version` sau 0095 | `relacl` = `ottimo_owner=arwdDxtm`, `ottimo_readonly=r`, `ottimo_app=r`. `ottimo_app`: SELECT `t`, INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER `f`. `ottimo_migrator` (không SET ROLE): tất cả `f` |
| Hàm sau 0095 | `prosecdef = f`, `proconfig = {search_path=pg_catalog, pg_temp}`, chủ `ottimo_owner`. Cả 2 trigger `tgenabled = O` |
| `publish-privacy-notice.sql` chạy thật bằng psql (ottimo_migrator → ottimo_owner), property thử, hash giả | dry-run → `dry-run-ok`; apply → `published` (supersede 2 bản cũ); chạy lại → `already-present`; bản kế → `published` (supersede en, vi); đăng lại bản đã thay → `refused … was superseded`. Mọi `superseded_at` nằm trong [`published_at`, `now()`] |

**Thử đường vòng** (mỗi ca trong transaction riêng và ROLLBACK):

| # | Cách thử | Kết quả |
|---|---|---|
| A1 | `ottimo_migrator` UPDATE thẳng, không SET ROLE | `permission denied` |
| A2 | `ottimo_owner`: `SET LOCAL session_replication_role = replica` | `permission denied to set parameter` |
| A3 | `ottimo_owner`: `ALTER ROLE/DATABASE … SET session_replication_role` | `permission denied` (cả hai) |
| A4 | Supersede bằng `now()` khi đặt `timezone = 'Pacific/Kiritimati'` | Qua (đúng, vì `to_jsonb` hai vế cùng múi giờ) |
| A5 | `INSERT … ON CONFLICT DO UPDATE SET body_sha256 = …, superseded_at = now()` | Bị chặn (23514) |
| A6 | `MERGE … UPDATE SET url_path = …, superseded_at = now()` | Bị chặn |
| A7 | Supersede một dòng có `published_at` ở tương lai (INSERT tay) | Bị chặn. Đóng an toàn: script luôn ghi `published_at = now()` |
| A8 | UPDATE qua view tạm | Bị chặn |
| A9 | Che `search_path`: tạo `pg_temp.now()` trả năm 2999 và `public.to_jsonb(anyelement)` trả `{}`, đặt `search_path = public, pg_temp, pg_catalog`, rồi supersede năm 2999 kèm đổi hash | Bị chặn. `SET search_path = pg_catalog, pg_temp` của hàm có hiệu lực |
| A10 | Đặt lại `superseded_at = NULL` (để supersede lần hai) | Bị chặn |
| A11 | `ottimo_app`: INSERT / UPDATE / DELETE / TRUNCATE / `SET session_replication_role` | Tất cả `permission denied` |
| A12 | Superuser + `SET LOCAL session_replication_role = replica` (đúng câu e2e US-155) | Chạy được; không replica thì bị chặn. Ghi chú ENABLE không ALWAYS đúng |

Quét diff (trừ snapshot):
- IPv4: chỉ `127.0.0.1` trong báo cáo BE.
- Không có chuỗi hex ≥ 20 ký tự là khóa thật. Hash trong test là `'d'.repeat(64)` và các giá trị giả tương tự.
- Mật khẩu: chỉ nhắc `ci_*_only`, mật khẩu giả công khai đã có trong `ci.yml`.
- Không có email, tên khách hay dữ liệu cá nhân. Property thử `PNT413` là mã giả.

---

## 0. Kết luận

**ĐẠT.**
- Không có Blocker, Major hay Minor. Có 2 thẻ Suggestion, tác giả tự cân nhắc, không chặn gộp.
- Gộp được ở `3c2b17bb` theo thứ tự PR-H (sau PR-G/0094).
- Nếu rebase đổi idx hoặc `when`, SEC chỉ cần xem diff journal và snapshot. Điều kiện là thân hàm và test giữ nguyên byte.

### 0.1 Các thẻ trước

| Thẻ | Trạng thái | Bằng chứng |
|---|---|---|
| FB-R4-SEC-BE-PN01-01 (Minor) | **Verified – đóng** | Test catalogue so `tgname`, `tgenabled = 'O'`, `tgtype` (ROW+BEFORE+DELETE+UPDATE; BEFORE+TRUNCATE), tên hàm, `prosecdef = false`, `proconfig`, chủ `ottimo_owner`. Test quyền dùng `has_table_privilege` cho SELECT/INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER, thêm `has_any_column_privilege` cho UPDATE/INSERT cấp cột (chặt hơn đề xuất). Chạy trong job CI có Postgres. SEC chạy lại trên DB tạm: khớp |
| FB-R4-SEC-BE-PN01-02 (Minor), phần (a) của BE | **Verified – đóng phần BE** | Chú thích 0095 ghi đúng phạm vi: "append-only … AT THE DML LEVEL". Chủ bảng vẫn DISABLE/DROP TRIGGER hoặc CREATE OR REPLACE FUNCTION được (DDL), chỉ qua migration có review. INSERT dựa vào quyền. 0090 không sửa, đúng chủ trương không sửa migration đã áp. Câu cũ "for EVERY role" ở 0090 vẫn còn → Suggestion S1. Phần (b) `ops-check` là của OPS P4-04 (`check_db_triggers` trên `origin/v104/ops-check`), đã review riêng. Thẻ đóng hẳn khi P4-04 gộp |
| FB-R4-SEC-BE-PN01-03 (Suggestion) | **Verified – đóng** | `NEW.superseded_at >= OLD.published_at AND NEW.superseded_at <= now()`. Chặt hơn đề xuất (không có dung sai +1 phút). Hợp lệ vì `now()` trong trigger là giờ bắt đầu transaction, cùng giá trị `now()` script dùng. SEC chạy thật script: qua |

### 0.2 Trọng tâm ORC giao

| Trọng tâm | Kết luận |
|---|---|
| Không còn đường vòng sửa hàng đã công bố | **Đạt ở mức DML.** UPDATE chỉ còn một dạng được qua: `superseded_at` từ NULL sang một giá trị trong [`published_at`, `now()`], các cột khác giữ nguyên. DELETE và TRUNCATE bị chặn. Đã thử 12 đường (bảng trên): ON CONFLICT, MERGE, view, che `search_path`, `session_replication_role` (vai không superuser không đặt được), đặt lại NULL. Đường còn lại đều là DDL của chủ bảng hoặc superuser, đã ghi rõ trong chú thích. Cách phát hiện: `ops-check` (trigger tắt) và test CI (thân hàm yếu đi, đột biến cho 6 ca đỏ). S2 bổ sung trường hợp thay thân hàm bằng tay trên production |
| `to_jsonb` so cả hàng | Đúng với 7 cột hiện có (uuid, text, timestamptz). Hai vế được dựng trong cùng câu, cùng múi giờ phiên (A4). Cột bị DROP không có trong `to_jsonb`. Giả định G2 của BE đúng: kiểu số trong jsonb so theo giá trị, tương đương `IS NOT DISTINCT FROM`, không lỏng hơn. Test chốt 7 cột buộc phải review lại khi thêm cột |
| `ottimo_app` chỉ SELECT | **Đạt**, giờ có test trong CI. Diff không có GRANT/REVOKE. `CREATE OR REPLACE FUNCTION` không đổi ACL của bảng |
| SECURITY INVOKER + `search_path` cố định | **Đạt.** Thân hàm không đọc bảng nào, nên INVOKER là lựa chọn đúng: không nâng quyền, không vướng RLS. `pg_catalog` đứng đầu, `pg_temp` cuối. A9 chứng minh không che được `now()` hay `to_jsonb`. `proacl` mặc định (PUBLIC EXECUTE) vô hại: hàm `RETURNS trigger` không gọi trực tiếp được |
| Ghi chú ENABLE / replica | **Đúng.** Trigger ở chế độ origin (`O`) không chạy khi `session_replication_role = replica`. Chỉ superuser đặt được tham số này (A2, A3, A11: `ottimo_owner`, `ottimo_migrator`, `ottimo_app` đều bị từ chối). Superuser vốn đã vượt mọi trigger (DISABLE, DROP). Vì vậy ENABLE ALWAYS không thêm ranh giới thật mà lại làm gãy e2e. Không mở lỗ hổng |
| Ghi chú pg_restore | **Đúng.** COPY chỉ INSERT (không bị bắt). pg_dump tạo trigger ở post-data. `--clean` là DROP (DDL). Restore-drill không vướng |
| `publish-privacy-notice.sql` vẫn chạy | **Đạt**: SEC chạy thật 5 bước (bảng trên). Script không đổi |
| `ops-check` / K3 | Tên trigger, `O` và dạng `t,f,f,f,f` không đổi, nên `check_db_triggers` (P4-04) và K3 vẫn đúng sau 0095 |
| Bí mật / PII | Không có |

### 0.3 Rủi ro còn lại (chấp nhận, không thẻ)

- `ottimo_owner` vẫn đặt được `superseded_at` **sớm hơn** giờ thật, trong khoảng [`published_at`, `now()`]. Việc này chỉ rút ngắn khung grace của readiness (chặt hơn, không lỏng hơn). Nó không đổi bằng chứng đồng ý, vì `consent_fk` trỏ đúng (version, locale). Giờ thật vẫn còn ở `audit_event privacy_notice.published` (`occurred_at = now()`). Script duy nhất ghi bảng này luôn dùng `now()`.
- INSERT với `published_at` / `superseded_at` tùy ý vẫn không bị trigger bắt. Điều này giữ như 0090: chỉ `ottimo_owner` qua script làm được, đã chấp nhận ở PN-01.

## 1. Thẻ

### FB-R4-SEC-BE-P413-S1
- Mức độ: Suggestion
- Vị trí: đầu tệp `0090_privacy_notice_append_only.sql` (dòng 5: "append-only for EVERY role, ottimo_owner included") và catalogue của hàm/bảng
- Vấn đề: 0095 đã ghi đúng phạm vi ("AT THE DML LEVEL"). Nhưng ai đọc 0090, hoặc xem `\d+ privacy_notice_version` trên DB, không thấy 0095. Câu cũ dễ khiến người đó nghĩ DB chặn tuyệt đối. Không sửa 0090 là đúng.
- Vì sao quan trọng: đây là bảng làm bằng chứng đồng ý (Nghị định 13/2023). Người vận hành nắm sai phạm vi chặn thì có thể bỏ qua bước kiểm `ops-check`.
- Đề xuất sửa: trong migration kế tiếp có đụng bảng này (không cần migration riêng), thêm `COMMENT ON FUNCTION privacy_notice_version_append_only() IS '…DML level only; table owner DDL (DISABLE/DROP TRIGGER, CREATE OR REPLACE FUNCTION) via reviewed migrations; see 0095'`, và câu tương tự cho `COMMENT ON TABLE`. Phạm vi lúc đó hiện ngay trong `\df+` / `\d+`. Không sửa 0090.
- Trạng thái: Open

### FB-R4-SEC-OPS-P413-S2
- Mức độ: Suggestion
- Người làm: OPS (P4-04 `check_db_triggers`), nếu nhận. ORC chuyển giúp.
- Vị trí: `infra/server/bin/ops-check.sh` `check_db_triggers`, phần `pn`
- Vấn đề: `ops-check` bắt được trigger bị tắt hoặc bị xóa, và quyền của `ottimo_app` bị nới. Nó **không** bắt được trường hợp chủ bảng chạy `CREATE OR REPLACE FUNCTION privacy_notice_version_append_only()` bằng tay trên production với thân yếu hơn: tên, `tgenabled = O` và quyền vẫn đúng. Test CI chỉ chặn đường qua migration. Phần `rlp` đã kiểm `prosecdef`; phần `pn` thì chưa.
- Vì sao quan trọng: khả năng thấp (cần quyền migrator trên VPS, runbook cấm SQL tay). Nhưng đây là tín hiệu duy nhất còn thiếu cho đường vòng DDL mà thẻ PN01-02 nêu.
- Đề xuất sửa: thêm vào câu `pn` hai trường của hàm mà trigger trỏ tới: `p.prosecdef` (phải `f`) và `md5(p.prosrc)`. Giá trị sau 0095, SEC đo trên DB tạm: `7a601d0ee740b1861663efa9b89473f5`. Lệch thì `FAIL`, và chỉ in cờ, không in thân hàm. Thêm vào `test-ops-check.sh` một ca đỏ cho hash khác. Mỗi migration sau này đổi thân hàm phải cập nhật hằng này: đó là điểm review có chủ đích. Có thể làm ở r1.1 của P4-04 hoặc dời sang v1.1.
- Trạng thái: Open

## 2. Điểm làm tốt

1. Có thử đột biến bằng thân 0090. Mỗi ca "bị chặn" chạy trong transaction riêng và ROLLBACK, nên một thân hàm quá lỏng làm đỏ từng ca. SEC chạy lại: đúng 6 ca đỏ.
2. Test chặt hơn đề xuất: có `tgtype`, `prosecdef`/`proconfig`, quyền cấp cột, bảng tạm có thêm cột để chứng minh so cả hàng, và nhánh TRUNCATE chạy thật trên bảng tạm.
3. BE chạy thật `publish-privacy-notice.sql` và hai câu replica của e2e trên DB thử, thay vì chỉ lập luận. Báo cáo ghi rõ những gì không đổi (tên trigger, quyền, mã lỗi), đúng thứ `ops-check` và K3 dựa vào.

## 3. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-13 (v104/be-pn01 @ 3c2b17bb, diff 99f9b4a2..3c2b17bb, migration 0095): ĐẠT** (rounds/round-04/reviews/SEC-on-v104-p4-13.md): PN01-01 + PN01-03 Verified đóng, PN01-02 phần BE đóng (phần ops-check theo P4-04). SEC tự chạy: migrate 0095, 30/30 test, đột biến thân 0090 cho 6 đỏ, publish-privacy-notice.sql 5 bước thật, 12 đường vòng (ON CONFLICT, MERGE, view, che search_path, session_replication_role không superuser không đặt được, …) đều bị chặn; ottimo_app chỉ SELECT; luật migration mở rộng không khớp dòng nào; snapshot = 0094; không bí mật/PII. 2 Suggestion: S1 COMMENT ON phạm vi DML (migration sau), S2 ops-check thêm prosecdef + md5(prosrc) cho hàm PN (OPS) | SEC | Quyền SEC |`
