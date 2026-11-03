# SEC review – PR #29: PN-01, migration 0090 (`privacy_notice_version` chỉ thêm dòng)

- Round 4, bước Review, đợt v1.0.2. Người review: SEC. Tác giả: BE-D.
- Nhánh `be-d/pn-01-0090`, head `4024a3f4`, base `v1.0.2-ed`. Đối chiếu với `db29b4ca` (lượt 1 của PR #16, SEC đã đọc).
- Cách kiểm: `gh pr view/checks 29`, `git show` / `git diff`. Không checkout, không chạy lại test, không push.
- CI của head: các job bắt buộc đều xanh (format · lint · audit · test · build; docker images · E2E smoke; gitleaks; API contract; shellcheck). Job deploy/publish bỏ qua, đúng với PR.

**Kết luận: DUYỆT (phía SEC).** Không có Blocker hay Major. Hai thẻ Minor và một Suggestion không chặn gộp, có thể làm ở v1.0.3.

---

## 1. Mã trigger có đổi so với `db29b4ca` không

| Kiểm | Cách kiểm | Kết quả |
|---|---|---|
| Thân migration 0090 | `diff` phần từ dòng `CREATE` đầu tiên tới hết tệp, giữa `db29b4ca` và `4024a3f4` | **Giống hệt từng byte.** Chỉ dòng chú thích 2–3 đổi ("snapshot của 0088 / 0089 chưa có trên main" → "snapshot của 0089, dựng lại cho v1.0.2"). |
| `audit-entities.ts`, `privacy-notice-append-only.test.ts`, `worker-audit-registry.test.ts` | So các dòng `+/-` của commit cũ và commit mới | Giống hệt. |
| `0090_snapshot.json` | Bỏ `id`, `prevId` rồi so JSON với `0089_snapshot.json` | Giống hệt. `prevId` = `018c5475-…` = id của 0089. Không đổi schema. |
| `_journal.json` | Đọc 3 dòng cuối | idx 64 = 0088, 65 = 0089, **66 = 0090**, `when` = 0089 + 2000 ms. Đúng thứ tự ARC đặt (0089 → 0090). |

Kết luận: BE nói đúng. Logic không đổi; nhận xét của SEC ở lượt 1 PR #16 vẫn áp dụng nguyên vẹn.

## 2. Logic trigger (đọc lại trên head)

- Bảng có đúng 7 cột (0086 dòng 20–32). Nhánh cho qua so **cả 6 cột** còn lại bằng `IS NOT DISTINCT FROM`. Chỉ nhận `superseded_at` đi từ NULL sang có giá trị. Không có cột nào lọt.
- Trigger `BEFORE UPDATE OR DELETE` theo dòng. Trigger `BEFORE TRUNCATE` theo câu lệnh, dùng cùng hàm, nhánh `TG_OP='TRUNCATE'` rơi xuống `RAISE`. TRUNCATE … CASCADE từ bảng khác cũng kích hoạt trigger này.
- Hàm **không** `SECURITY DEFINER`. Hàm không đọc bảng nào, chỉ đọc OLD/NEW, nên không có rủi ro `search_path`. Hàm trigger không gọi trực tiếp được, nên quyền EXECUTE mặc định của PUBLIC không mở đường nào.
- Đường ghi duy nhất là `infra/server/publish-privacy-notice.sql`: một INSERT và `UPDATE … SET superseded_at = now() … AND superseded_at IS NULL`. Câu UPDATE này khớp đúng nhánh cho qua. BE đã chạy thật hai lần đăng bản, có trong báo cáo.
- Trong mã không còn câu ghi nào khác (`git grep` các lệnh INSERT/UPDATE/DELETE/TRUNCATE nhắm vào bảng này). Test chỉ INSERT. Spec e2e `us155-website-requests.r3` đặt lại `superseded_at` bằng superuser với `session_replication_role = replica`, chỉ chạy trên stack test.

## 3. Đường vòng

| Đường | Ai làm được | Đánh giá |
|---|---|---|
| UPDATE / DELETE / TRUNCATE bằng `ottimo_app` | Không | Cấp quyền chỉ có `GRANT SELECT` (0086:178). Không có `DEFAULT PRIVILEGES` cấp DML cho app (`02-roles.sh`: chỉ SELECT cho `ottimo_readonly`). App không là thành viên `ottimo_owner` (`REVOKE ottimo_owner FROM ottimo_app`, và có startup-check). Kể cả khi lỡ cấp quyền, trigger vẫn chặn. |
| UPDATE / DELETE / TRUNCATE bằng `ottimo_owner` (qua `ottimo_migrator` + `SET ROLE`) | Bị trigger chặn | Test tích hợp có 6 ca bị từ chối, 1 ca cho qua. BE còn chạy tay `superseded_at = NULL` và `DELETE` bằng `ottimo_owner` trên PG 17: cả hai bị chặn. |
| `SECURITY DEFINER` (chủ là `ottimo_owner`) ghi vào bảng | Không có | Hàm duy nhất trong 0086 là `public_resolve_property` (STABLE, chỉ đọc, `search_path` cố định). Không hàm DEFINER nào ghi bảng này. Nếu sau này có, trigger vẫn chặn vì nó chạy bằng quyền `ottimo_owner`. |
| `session_replication_role = replica` (tắt trigger) | Chỉ superuser | Không có `GRANT SET ON PARAMETER` cho vai nào. `ottimo_owner` và `ottimo_migrator` đều NOSUPERUSER. |
| `ALTER TABLE … DISABLE TRIGGER`, `DROP TRIGGER`, `CREATE OR REPLACE FUNCTION`, `DROP TABLE … CASCADE` | **`ottimo_owner`** (chủ bảng) | **Còn lại, do bản chất PostgreSQL.** Trigger chỉ chặn DML. Lệnh DDL thì chủ bảng chạy được. Ai giữ mật khẩu `ottimo_migrator` (chỉ có trong secret trên VPS) và vào được socket trong container postgres thì tắt được trigger. Biện pháp hiện có: `SET ROLE` để lại dấu trong log PG; mọi migration đều phải qua review. Vai app **không** có đường này (không là chủ, không là thành viên). Câu đầu tệp "append-only for EVERY role, ottimo_owner included" chỉ đúng với DML. Xem thẻ 02. |
| pg_restore | Không đổi | pg_dump tạo trigger ở phần post-data, sau COPY, nên restore-drill không vướng. Bản dump cũng không bị sửa được qua đường này. |

Kết luận: `ottimo_app` và `ottimo_owner` **không xóa hay sửa được bằng chứng bằng DML**. Phần còn lại (DDL của chủ bảng, superuser) nằm ngoài phạm vi một trigger, và bị giới hạn bằng quản lý mật khẩu migrator và quyền vào VPS.

## 4. Audit entity

- `defineAuditEntity('privacy_notice_version', [version, locales, shaVi, shaEn, landingTag, landingDigest, superseded])`. Đối chiếu với `jsonb_build_object` trong `publish-privacy-notice.sql` dòng 148–151: **đủ 7 khóa, không thừa, không thiếu**. Registry của worker cũng đã có (test `worker-audit-registry`).
- `reason` ghi `operator: <mã nhân viên>`. Email đã bị công cụ OPS từ chối từ R3 (ca 8). Không có dữ liệu khách: chỉ có version, băm, tag, digest.
- Trigger từ chối thì không ghi audit, vì giao dịch bị hủy. Lỗi vẫn có trong log PG. Như vậy là chấp nhận được.

## 5. Dữ liệu cá nhân, bí mật

- Diff không có dữ liệu khách, email hay IP. Băm trong test là giá trị giả (`'d'.repeat(64)`).
- Báo cáo BE chỉ nhắc "mật khẩu CI giả công khai `ci_*_only`", không ghi giá trị. gitleaks xanh.
- Thông báo lỗi trigger chỉ in `TG_OP`, không in giá trị dòng.

## 6. Ca tạm ★2-bis (chụp `\dp privacy_notice_version`)

**Bỏ được sau khi 0090 lên production**, kèm một bằng chứng đọc lại một lần thay cho ảnh chụp:

- ★2-bis chỉ là biện pháp tạm cho trường hợp "PN-01 trễ hơn ngày đặt C" (`round-03/reviews/SEC-on-BE-gchat-notify.md` dòng 158). Khi 0090 đã áp, `published_at` không sửa lùi được bằng DML, kể cả với `ottimo_owner`. Đó chính là điều ★2 cần.
- Bằng chứng thay thế (OPS, chạy một lần trên production sau khi migrate, bằng lệnh READ ONLY trong `ops-check`/`deploy.sh`, ghi vào báo cáo phát hành):
  `SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'privacy_notice_version'::regclass AND NOT tgisinternal ORDER BY 1;`
  Phải có đúng 2 dòng `privacy_notice_version_append_only` và `privacy_notice_version_no_truncate`, cả hai `tgenabled = 'O'`.
- Phần "`ottimo_app` chỉ SELECT" của ★2-bis: migration 0086 đã bảo đảm. Thẻ 01 đưa phần này vào CI, nên không cần chụp tay nữa.
- Dòng runbook "không chạy UPDATE/DELETE tay trên bảng này" **nên giữ** như quy tắc thường trực, vì DDL của chủ bảng vẫn còn (mục 3). Dòng này không còn là điều kiện để đặt C.
- Nếu 0090 **chưa** lên production vào ngày đặt C, ★2-bis vẫn áp dụng nguyên như cũ.

SEC sẽ ghi decision-log khi OPS nộp bằng chứng đọc lại trên production. Lúc đó ★2-bis đổi thành "Đã thay bằng 0090".

## 7. Ghi chú quy trình

- Base của PR là `v1.0.2-ed`. Khi ORC đổi base sang `main` sau PR #22, nếu phải đánh số lại (idx 66 hoặc số tệp 0090 bị chiếm), thân trigger **phải giữ nguyên**. SEC chỉ cần xem lại diff chú thích, journal và snapshot. Không cần review lại toàn bộ.

---

## Thẻ feedback

### FB-R4-SEC-BE-PN01-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/privacy-notice-append-only.test.ts` (ca "the row trigger … exist"); `test/integration/architecture.test.ts` (K8)
- Vấn đề: Test chỉ kiểm tên 2 trigger có trong `pg_trigger`, không kiểm `tgenabled`. Như vậy một migration sau này chạy `DISABLE TRIGGER` vẫn qua test. Ngoài ra, chưa test nào khẳng định `ottimo_app` chỉ có SELECT trên `privacy_notice_version`. K8 chỉ liệt kê `audit_event` và `c3_access_log`. Trigger không chặn INSERT, nên phần INSERT vẫn dựa hoàn toàn vào việc cấp quyền.
- Vì sao quan trọng: đây là bằng chứng pháp lý "khách đồng ý với văn bản nào" (Nghị định 13/2023). Có test trong CI thì một hồi quy vô tình sẽ bị chặn trước khi gộp, và ★2-bis không cần chụp `\dp` tay nữa.
- Đề xuất sửa: (a) thêm `tgenabled` vào câu SELECT, mong đợi `'O'` cho cả 2 trigger; (b) thêm một ca dùng `has_table_privilege('ottimo_app', 'privacy_notice_version', …)` cho INSERT/UPDATE/DELETE/TRUNCATE, cả bốn đều `false`, SELECT `true`.
- Trạng thái: Open

### FB-R4-SEC-BE-PN01-02
- Mức độ: Minor
- Vị trí: đầu tệp `0090_privacy_notice_append_only.sql` (dòng 5: "append-only for EVERY role, ottimo_owner included"); `infra/server/bin/ops-check` hoặc `deploy.sh` (OPS)
- Vấn đề: Câu chú thích chỉ đúng với DML. `ottimo_owner` là chủ bảng, vẫn `ALTER TABLE … DISABLE TRIGGER`, `DROP TRIGGER` hay `CREATE OR REPLACE FUNCTION` được. Hiện chưa có lần kiểm định kỳ nào trên production phát hiện trigger bị tắt.
- Vì sao quan trọng: người đọc sau dễ tưởng DB chặn tuyệt đối. Nếu trigger bị tắt ngầm, không có tín hiệu nào báo.
- Đề xuất sửa: (a) BE: khi có dịp sửa tệp này (ví dụ lúc đánh số lại), đổi thành "append-only for every role at the DML level; the table owner can still alter or disable the trigger (DDL) – reviewed migrations only". Không đổi thân trigger. (b) OPS: thêm vào `ops-check` câu READ ONLY ở mục 6, sai thì cảnh báo. Có thể dời sang v1.0.3.
- Trạng thái: Open

### FB-R4-SEC-BE-PN01-03
- Mức độ: Suggestion
- Vị trí: hàm `privacy_notice_version_append_only()`, nhánh cho qua
- Vấn đề: Nhánh cho qua nhận **mọi** giá trị `superseded_at` khác NULL, kể cả giá trị trước `published_at` hoặc rất xa trong tương lai. Không ảnh hưởng ★2 (cổng so theo `published_at`). Chỉ ảnh hưởng readiness (form có mở hay không), và chỉ `ottimo_owner` làm được.
- Vì sao quan trọng: giữ mốc "bản này hết hiệu lực lúc nào" hợp lý nếu sau này phải chứng minh trước cơ quan chức năng.
- Đề xuất sửa: thêm điều kiện `AND NEW.superseded_at >= OLD.published_at` (có thể cả `<= now() + interval '1 minute'`) trong một migration sau. Tác giả tự cân nhắc. Không đổi 0090 trong PR này.
- Trạng thái: Open

---

## Điểm làm tốt

1. BE dựng lại bằng cherry-pick và tự kiểm "No schema changes". Snapshot chỉ khác `id`/`prevId`, nên dễ chứng minh mã không đổi. Không phải review lại phần đã duyệt.
2. Có ca test "supersede AND change the hash" bị từ chối. Ca này chặn đúng cách lách tinh vi nhất: kèm đổi cột khác vào câu UPDATE hợp lệ.
3. BE đã kiểm trước rằng spec e2e dùng `session_replication_role = replica` không gãy, và restore-drill không vướng trigger.
