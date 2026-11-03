# ARC duyệt PR #29 – PN-01: migration 0090, `privacy_notice_version` chỉ-thêm-dòng + đăng ký audit entity

- PR: anhvh93-tech/ottimo-hotel-app-public#29, nhánh `be-d/pn-01-0090`, head `4024a3f4`, base `v1.0.2-ed`. Một commit, tách từ `ff16c1dd`. Base đã tiến tới `9d4f0fa8`, nhưng đoạn `ff16c1dd..9d4f0fa8` không đổi gì trong `src/db`. GitHub báo `MERGEABLE`.
- Người duyệt: ARC. Round 4, bước **Review**, đợt v1.0.2. Ngày 03/11/2026. Việc: T7 trong `rounds/round-04/plan-v1.0.1.md`.
- Đã đọc: diff 7 file; báo cáo `rounds/round-04/outputs/BE/pn-01-0090.md`; DDL bảng (0086); `infra/server/publish-privacy-notice.sql`; `bin/restore-drill.sh`; `bin/backup.sh`; 3 test hạ tầng về privacy; e2e `us155-website-requests.r3.spec.ts` và `stackSql` (`support/s3.ts`); `src/audit-entities.ts`, `worker-jobs.ts`, `public-site.module.ts`, `audit-fields.ts`, `audit.service.ts`; vai DB trong `infra/postgres/init/02-roles.sh`.
- CI của PR #29 (run 41577906416): mọi job kiểm đều xanh, kể cả "format · lint · audit · test · build" và "docker images build · E2E smoke". Ba job deploy/publish bị bỏ qua, đúng với một PR.
- ARC không checkout nhánh, không chạy lại test, không sửa mã, không đăng lên PR.

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

Không có Blocker, không có Major. Mã và migration đạt. Các điều kiện dưới đây là **thứ tự gộp và chữ ký SEC**. BE không phải sửa gì trước khi gộp.

**Điều kiện gộp (ORC thực hiện):**
1. **PR #22 gộp trước**, bằng merge commit như các PR gần đây (`dea48d69`, `22b69f4a` đều là merge commit). Không dùng squash hay rebase-merge. Nếu #22 bị squash, `ff16c1dd` không còn là tổ tiên của `main`, và #29 phải rebase lên `main` trước khi đổi base.
2. Sau khi #22 gộp, **đổi base #29 sang `main`**. Kiểm tra 3 điểm:
   - `gh pr diff 29 --name-only` ra đúng 7 file của commit `4024a3f4`;
   - trong `_journal.json` trên `main`, idx 65 = `0089_simulation_guard_room_price_cancel`, và không có migration nào khác chiếm idx 66 hay số `0090`;
   - CI chạy lại trên base `main` và xanh.

   Hiện không có PR mở nào khác đụng `src/db/migrations`. PR #21 chỉ sửa landing. Các PR dependabot không đụng migration.
3. **SEC ký duyệt diff** theo T7. Chưa có `SEC-on-PR29-*.md`.

## Kết quả kiểm theo từng điểm được giao

| # | Điểm kiểm | Kết quả |
|---|---|---|
| 1 | Journal idx 66, `when` liền sau 0089 | **Đạt.** Trước nó là idx 65 `0089_…`, `when` = `1792782167681`. Mục mới là idx 66, `when` = `1792782169681` (+2000, đúng mẫu +2000 các bản trước), tag `0090_privacy_notice_append_only`, `breakpoints: true`. Journal có 67 mục (0..66). |
| 2 | Snapshot 0090 không đổi schema | **Đạt.** So `0089_snapshot.json` với `0090_snapshot.json`: chỉ khác dòng 2–3 (`id` = `3ee59da7-…`, `prevId` = `018c5475-…` = id của 0089). Phần còn lại giống từng byte. BE ghi `drizzle-kit generate` báo "No schema changes", khớp mẫu 0064/0084/0087. |
| 3 | Trigger chỉ cho câu publish; chặn mọi UPDATE/DELETE khác, kể cả `ottimo_owner` | **Đạt.** Xem 3.1–3.3 bên dưới. |
| 4 | pg_dump / pg_restore (restore-drill) | **Không ảnh hưởng.** Xem 3.4. |
| 5 | `session_replication_role` trong e2e | **Không gãy.** Xem 3.5. |
| 6 | Thứ tự gộp | Đúng: #22 trước, sau đó đổi base #29 sang `main`. Kèm điều kiện merge commit (mục điều kiện 1). |
| 7 | Audit entity đặt đúng chỗ api và worker cùng đọc | **Đạt.** Xem 3.6. |

### 3.1 Trigger so đủ mọi cột của bảng
Bảng có đúng 7 cột (0086): `organization_id`, `version`, `locale`, `body_sha256`, `url_path`, `published_at`, `superseded_at`. Hàm trigger cho qua một UPDATE khi đủ hai điều kiện:
- `OLD.superseded_at IS NULL AND NEW.superseded_at IS NOT NULL`;
- 6 cột còn lại `IS NOT DISTINCT FROM` giá trị cũ.

Mọi trường hợp khác đều `RAISE … check_violation`: DELETE, TRUNCATE (trigger theo câu lệnh, gọi cùng hàm, `TG_OP = 'TRUNCATE'` nên rơi xuống RAISE), xóa `superseded_at`, gắn `superseded_at` lần hai.

`RETURN NEW` chỉ có ở nhánh UPDATE hợp lệ. Với DELETE thì không bao giờ tới `RETURN`, nên không lo trả về `NULL` làm câu lệnh lặng lẽ bị bỏ qua. Lỗi được nêu to, đúng ý đồ.

### 3.2 Câu publish đi qua được
`publish-privacy-notice.sql` dòng 127: `UPDATE privacy_notice_version SET superseded_at = now() WHERE … AND version <> v_version AND superseded_at IS NULL`.
- Câu này chỉ đụng các dòng đang NULL và chỉ đổi `superseded_at`, nên lọt đúng nhánh hợp lệ.
- Câu INSERT không có trigger.
- `LOCK TABLE … SHARE ROW EXCLUSIVE` không liên quan tới trigger.

`git grep` trên toàn `product/` (trừ tài liệu): ngoài file này, test 0090 và e2e US-155, không còn chỗ nào UPDATE, DELETE hay TRUNCATE bảng này. Không có câu `DELETE FROM organization`, cũng không có helper test nào TRUNCATE dạng CASCADE.

### 3.3 Chặn cả `ottimo_owner`
- Trigger thường (không `SECURITY DEFINER`, không điều kiện vai) chạy cho mọi vai không phải superuser.
- `ottimo_app` vốn chỉ có SELECT.
- Test tích hợp chạy dưới `SET LOCAL ROLE ottimo_owner` và phủ 6 ca bị từ chối (gắn lần hai, xóa, đổi hash, vừa gắn vừa đổi hash, đổi `published_at`, DELETE) cùng 1 ca hợp lệ. TRUNCATE chỉ được kiểm qua catalogue. Lý do có ghi rõ trong test: FK từ `website_booking_request` chặn TRUNCATE trước, và DB test dùng chung.

**Giới hạn đã biết, không phải lỗi:** chủ bảng (`ottimo_owner`, mà `ottimo_migrator` SET ROLE được) vẫn có thể `DROP TRIGGER`, `ALTER TABLE … DISABLE TRIGGER`, hoặc viết migration mới để gỡ. Vì vậy trigger chặn **lỡ tay và câu SQL gõ tay**, không chặn người cố ý có quyền DDL. Muốn gỡ thì phải qua migration (có review và có trong journal) hoặc superuser. Mức này đúng với yêu cầu SEC FB-R3-SEC-ARC-PN-01. Không vai ứng dụng nào được `SET session_replication_role`: 02-roles.sh không `GRANT SET ON PARAMETER`, mọi vai đều NOSUPERUSER.

### 3.4 pg_dump / pg_restore (restore-drill)
- `restore-drill.sh` dòng 103: `pg_restore -U ottimo_admin --exit-on-error --single-transaction` vào DB mới, sau khi `02-roles.sh` đã tạo vai.
- pg_dump đặt hàm ở pre-data và trigger ở **post-data**, tức trigger được tạo **sau** khi COPY dữ liệu xong.
- Kể cả khi trigger có sẵn, COPY là INSERT, còn trigger chỉ bắt UPDATE/DELETE/TRUNCATE.

Kết luận: restore-drill không bị ảnh hưởng. `backup.sh` và `privacy-log-check.sh` chỉ đọc. Ghi chú nhỏ về câu chú thích trong SQL: xem S2.

Một lưu ý vận hành cho tương lai, không có trong script hiện tại: nếu ai đó làm `pg_restore --data-only` vào bảng đã có dữ liệu và cần TRUNCATE trước, câu TRUNCATE sẽ bị từ chối. Đây là hành vi mong muốn. Cách đúng là restore vào DB mới, như restore-drill đang làm.

### 3.5 `session_replication_role` trong e2e
- `stackSql` chạy `psql -U "$POSTGRES_USER"`, tức superuser của stack dùng một lần.
- `publishNotices()`: INSERT … ON CONFLICT DO NOTHING (ngoài transaction replica, không bị trigger chặn), rồi `BEGIN; SET LOCAL session_replication_role = replica; UPDATE … SET superseded_at = NULL …; COMMIT`.
- `unpublishNotices()`: cùng cách, đặt `superseded_at = now() - 30 days`.
- Trigger 0090 tạo mặc định (`ENABLE`, không `ENABLE ALWAYS`), nên ở chế độ `replica` không chạy.

BE đã chạy đúng 2 câu này trên DB có 0090, và CI "E2E smoke" xanh. Không gãy.

Nếu sau này có ai đổi trigger sang `ENABLE ALWAYS`, spec này sẽ gãy. Xem S1.

### 3.6 Audit entity
- `modules/public-site/audit-entities.ts` không import Nest. File này được nạp bởi:
  - `public-site.module.ts:27` (api);
  - `src/audit-entities.ts:23` (worker qua `worker-jobs.ts:7`, và 2 CLI admin).
- Đây đúng là chỗ cả api và worker cùng đọc (mẫu sau BUG-R3-037/038). `worker-audit-registry.test.ts` kiểm registry của worker có đủ 7 trường và bằng registry của api.
- Tên 7 trường trùng đúng khóa `jsonb_build_object` mà `publish-privacy-notice.sql` ghi vào `audit_event.after`: `version`, `locales`, `shaVi`, `shaEn`, `landingTag`, `landingDigest`, `superseded`. Không trường nào khớp mẫu `FORBIDDEN` của `audit-fields.ts`, và không có dữ liệu khách.

Hiện nay người ghi audit cho entity này là SQL của OPS, không đi qua `AuditService`. `pickAuditFields` chỉ chạy lúc ghi, không chạy lúc đọc. Vì vậy việc đăng ký này có tác dụng chặn trước: sau này có chỗ TypeScript nào ghi audit `privacy_notice_version` thì không bị `AuditEntityNotRegisteredError`, và chỉ ghi đúng 7 trường. Hợp lý. Không thẻ.

### 3.7 Triển khai và rollback
- `CREATE TRIGGER` cần quyền chủ bảng. Migrator SET ROLE `ottimo_owner`, là chủ bảng, nên đủ quyền.
- Lệnh này giữ khóa SHARE ROW EXCLUSIVE trong chốc lát, trên một bảng vài dòng, nên không đáng kể.
- Nếu rollback ảnh api về v1.0.1, DB vẫn giữ trigger. Mã v1.0.1 không ghi bảng này (chỉ có script OPS ghi), nên tương thích. Không cần migration đi xuống. Bảng rollback v1.0.2 chỉ cần ghi một dòng: "0090 giữ nguyên khi lùi ảnh".

## Thẻ feedback

### FB-R4-ARC-BE-PR29-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/db/migrations/0090_privacy_notice_append_only.sql`, dòng 14–21 (danh sách cột `IS NOT DISTINCT FROM`)
- Vấn đề: trigger liệt kê tay 6 cột. Nếu sau này thêm cột vào `privacy_notice_version` (ví dụ `title`, `body_sha256_ru`) mà quên sửa hàm, thì một câu UPDATE vừa gắn `superseded_at` vừa sửa cột mới sẽ lọt qua.
- Vì sao quan trọng: bảng này là bằng chứng "khách đã đồng ý văn bản nào". Một lỗ hổng lặng lẽ khi thêm cột sẽ làm yếu bằng chứng, và không test nào bắt được vì test hiện tại cũng liệt kê cột theo tay.
- Đề xuất sửa: ở migration kế tiếp có đụng bảng này (không cần làm trong #29), thay 6 dòng bằng `(to_jsonb(NEW) - 'superseded_at') = (to_jsonb(OLD) - 'superseded_at')`. Hoặc thêm vào `privacy-notice-append-only.test.ts` một ca so danh sách cột trong `information_schema.columns` với danh sách cố định 7 cột, để thêm cột là test đỏ.
- Trạng thái: Open

### FB-R4-ARC-BE-PR29-02
- Mức độ: Minor
- Vị trí: `0090_privacy_notice_append_only.sql`, điều kiện `NEW.superseded_at IS NOT NULL`
- Vấn đề: trigger nhận **mọi** giá trị khác NULL. Ai đó gõ tay với quyền chủ bảng có thể đặt `superseded_at` ở tương lai xa. `public-booking.service.ts:613` chấp nhận phiên bản cũ khi `superseded_at > now() - 7 days`, nên phiên bản đó sẽ được chấp nhận vô thời hạn. Đặt `superseded_at` trước `published_at` cũng lọt.
- Vì sao quan trọng: cửa sổ ân hạn 7 ngày cho form đang mở là quy tắc SEC C-3. Script publish luôn dùng `now()`, nên chỉ câu gõ tay mới gây ra được, vì vậy mức Minor.
- Đề xuất sửa: cùng lúc với thẻ 01, thêm `AND NEW.superseded_at BETWEEN OLD.published_at AND now()`. Trong trigger, `now()` là giờ bắt đầu transaction, bằng đúng `now()` của câu publish trong cùng transaction. Thêm 1 ca test "gắn `superseded_at` ở tương lai → bị từ chối". Spec e2e dùng `replica` nên không bị ảnh hưởng.
- Trạng thái: Open

### FB-R4-ARC-BE-PR29-S1
- Mức độ: Suggestion
- Vị trí: `0090_privacy_notice_append_only.sql`, chú thích đầu file
- Vấn đề: e2e US-155 dựa vào việc trigger **không** chạy ở `session_replication_role = replica`, nhưng điều này chưa được ghi ở đâu.
- Vì sao quan trọng: người sửa sau có thể "siết" bằng `ALTER TABLE … ENABLE ALWAYS TRIGGER` và làm gãy e2e mà không hiểu vì sao.
- Đề xuất sửa: thêm một dòng chú thích: "ENABLE (not ALWAYS) on purpose: the disposable e2e stack resets rows as superuser under session_replication_role = replica (us155-website-requests.r3.spec.ts)".
- Trạng thái: Open

### FB-R4-ARC-BE-PR29-S2
- Mức độ: Suggestion
- Vị trí: `0090_privacy_notice_append_only.sql`, dòng 9: "pg_restore (COPY) fires none of these triggers."
- Vấn đề: câu đúng về kết quả, nhưng lý do chưa đủ. COPY **có** kích hoạt trigger INSERT. Ở đây không sao vì hai lý do: trigger chỉ bắt UPDATE/DELETE/TRUNCATE, và pg_dump tạo trigger ở post-data, sau phần dữ liệu.
- Vì sao quan trọng: tránh người đọc suy rộng sai sang các bảng có trigger INSERT.
- Đề xuất sửa: ghi lại thành "pg_restore is unaffected: COPY only INSERTs (not trapped here) and triggers are created in post-data, after the data." Có thể gộp vào cùng lần sửa thẻ 01/02.
- Trạng thái: Open

## Việc ARC tự nhận (không phải thẻ cho BE)
- `product/docs/erd.md` chưa có mục cho bảng `privacy_notice_version`, chỉ có FK ở dòng 1071. ARC sẽ bổ sung khi chốt tài liệu v1.0.2: 7 cột, khóa chính, append-only bằng trigger 0090 (khác K8 vì chặn cả chủ bảng), và cửa sổ 7 ngày. Không chặn gộp.

## Điểm làm tốt
- Trigger trả lỗi to (`check_violation`), không lặng lẽ bỏ qua. Nó so đủ cả 6 cột hiện có, và có thêm trigger theo câu lệnh cho TRUNCATE. Một hàm dùng cho cả hai.
- Dựng lại gọn trên 0089: snapshot chỉ khác `id`/`prevId`, `when` đúng mẫu +2000. Báo cáo ghi rõ commit `1420521e` thành rỗng và vì sao.
- Báo cáo kiểm đúng các câu cần kiểm: chạy `publish-privacy-notice.sql` thật hai lần, rồi thử phá bằng `ottimo_owner`; chạy đúng 2 câu SQL của e2e trên DB đã có 0090.
