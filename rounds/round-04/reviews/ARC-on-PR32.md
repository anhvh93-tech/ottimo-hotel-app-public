# ARC duyệt PR #32 – `ops/v1.0.3-email-alert-2` (PR-2 lượt bổ sung: `email_changes`, `email_ascii`, `requeue-email-changed.sh`, runbook r2)

- PR #32, nhánh `ops/v1.0.3-email-alert-2` @ `24882c38`, base `main`. Diff đọc: `git diff bd74ef86 origin/ops/v1.0.3-email-alert-2` (9 tệp, +783/−63).
- Người duyệt: ARC. Round 4, đợt v1.0.3, bước **Review**. Ngày 03/11/2026.
- Đối chiếu:
  - `rounds/round-04/responses/OPS-on-PR31.md` (trên nhánh PR #32), gồm giả định G8–G11 và thẻ đề xuất `FB-R4-OPS-ARC-31-01`;
  - `ARC-on-PR31-v1.0.3-email.md` thẻ `FB-R4-ARC-BE-31-02` (trên `origin/v1.0.3-email`);
  - `ARC-on-PR30-email-alert.md` lượt 2, thẻ `FB-R4-ARC-OPS-PR30-11` (trên `main`);
  - migration 0091 và journal thật trên `origin/v1.0.3-email` @ `fb6a281c`;
  - `SEC-on-PR32.md` (bản đang có trong thư mục chính), để không lặp thẻ.
- Không checkout, không sửa mã, không commit, không đăng lên PR.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Mã (`ops-check.sh`, `requeue-email-changed.sh`, CI) **đạt**, không có thẻ chặn. Điều kiện nằm ở runbook: OPS ra bản r3 **trước Release**, gồm thẻ 01 (Major), các ô `⟨CHỜ PR-1⟩` ARC điền sẵn ở mục 4, và các thẻ Minor 02–05. Bản r3 không cần ARC duyệt lại cả tệp. ARC chỉ đối chiếu các chỗ sửa.

**Quyết định G8: CHẤP NHẬN cho v1.0.3.** Không sửa `deploy.sh` trước Release. Thẻ `FB-R4-OPS-ARC-31-01` được nhận, làm ở v1.0.4 (mục 1).

## Kiểm đã chạy

| Kiểm | Kết quả |
|---|---|
| `git archive` nhánh vào thư mục tạm, chạy `test-ops-check.sh`, `requeue-email-changed.test.sh`, `ops-check-cwd.test.sh`, `rollback.test.sh` (Mac, bash 3.2) | 118/118, 44/44, 7/7, 11/11 |
| Câu SQL `email_changes` chép nguyên từ `ops-check.sh`, chạy trên Postgres 17.11 tạm (mật khẩu giả, container đã xóa), phiên `default_transaction_read_only=on` | Chưa có bảng (DB 67): `changes\|-1\|-1`, `queue\|1\|2400`, mã thoát 0. Có bảng, 6 + 2 lần trong 24 giờ, 1 lần ngoài 24 giờ: `changes\|8\|6`. Bảng rỗng: `changes\|0\|0` |
| Câu hỏi mẫu của `requeue-email-changed.sh`, chạy đúng nguyên văn bằng `node --input-type=module -e` trong 2 image api cũ có trên máy (`sha-70fe734e9077`, `sha-8b3aec89486f-test`), `--network none` | `email_changed` → mã 1 (từ chối), `mfa_reset` → mã 0. WORKDIR `/app`, uid 1000, giống worker production |
| Mã `STAFF_EMAIL_TEMPLATES` trên `origin/v1.0.3-email` | Có `email_changed`, được xuất qua `@ottimo/integrations/notification` (`index.ts` → `export * from './email-templates.js'`). Image v1.0.3 sẽ trả mã 0 |
| 0091 trên `origin/v1.0.3-email` @ `fb6a281c` | `sha256` của tệp = `e8bb6cb9…b33a3`, trùng bản `3aaa971c` mà runbook nhắc. Journal idx 67 `when` = `1792782171681`. Quy ước băm: `sha256` của 0090 = `2c90ac33…1ccf`, trùng dòng K2 của runbook, nên `HASH_0091` = `sha256` của tệp 0091 |
| `git diff --name-only 1b5fd874 origin/v1.0.3-email -- product/infra .github` (`1b5fd874` = merge-base với `main`, tức lúc gộp PR #30) | Rỗng: PR-1 không đổi `product/infra` hay `.github` |

## 1. G8: thứ tự worker → api

### Hiện trạng mã
- `deploy.sh`: `migrate` luôn chạy **trước** `switch`. Đây là phần quan trọng nhất của quyết định `FB-R4-ARC-BE-31-02` (worker v1.0.3 cần bảng 0091), và mã đã bảo đảm.
- `switch`, `--rollback` và `restore_previous` đều đổi `api worker web` trong một lệnh `dc up --wait`. OPS mô tả đúng.
- OPS bỏ sót một chi tiết trong compose prod, và chi tiết này có lợi: `web` có `depends_on: api: service_healthy`. `api` và `worker` chỉ phụ thuộc `postgres`, nên compose đổi hai service này song song. `worker` không có healthcheck nên lên trong 1–3 giây. `api` cần qua healthcheck (`interval: 15s`). Web v1.0.3, nơi duy nhất có ô nhập email, chỉ được đổi **sau** khi api v1.0.3 healthy.

### Rủi ro khi api và worker đổi cùng lúc

| Chiều | Cửa sổ | Điều kiện để thành sự cố | Hậu quả | Phát hiện / khắc phục |
|---|---|---|---|---|
| Deploy v1.0.2 → v1.0.3 | api v1.0.3 đã nhận lệnh, worker v1.0.2 còn chạy | Có người lưu email qua API v1.0.3, xác thực S2 (mật khẩu + TOTP), trong vài giây trước khi worker cũ dừng. SPA v1.0.2 đang mở trong trình duyệt **không có** ô email. Web v1.0.3 chưa phát. Chỉ còn cách gọi API thẳng | Gần như bằng 0 | K2 dòng cuối; R9 (lúc đó worker đã là v1.0.3) |
| Quay lui v1.0.3 → v1.0.2 | worker v1.0.2 đã chạy, api v1.0.3 chưa dừng | (1) Dòng `email_changed` **đã có sẵn** trong hàng đợi trước lúc lùi, kể cả dòng `in_flight` bị ngắt giữa chừng. Đây là rủi ro thật, và đổi thứ tự trong mã **không** chữa được. (2) Có người hoàn tất S2 đổi email trong vài giây lùi. SPA v1.0.3 còn mở trong trình duyệt nên ca này khả dĩ hơn chiều deploy một chút | (1) có thể xảy ra; (2) rất thấp | (1) R3b rút hàng đợi; (2) thẻ 03; cả hai: R6 đếm, R9 xếp lại |
| `restore_previous` (deploy lỗi ở `switch`/`smoke`) | Như quay lui | Như quay lui (1) | Thấp | Thẻ 04 |

Hậu quả xấu nhất của một dòng bị worker cũ xử lý là dòng đó thành `dead BAD_TEMPLATE`, và thư `self`/`previous`/`owner` của lần đổi đó không được gửi. Theo câu trả lời Q1 (đã kiểm ở diễn tập 5.0):
- không gửi gì;
- không đọc `app_user`, không ghi địa chỉ vào log;
- không đổi dữ liệu nào khác.

Thông báo trong app (`account_security_change`) không qua hàng đợi nên vẫn tới OWN. DB không mất gì, không sai tiền, không lộ dữ liệu cá nhân. Thư chỉ bị **trễ**, có số đếm và có đường xếp lại trong 7 ngày (R9).

### Quyết định
- **Chấp nhận** cách đạt thứ tự bằng thao tác cho v1.0.3 (runbook 1.3a).
- **Không** sửa `deploy.sh` trước Release. Lý do:
  - phần bắt buộc (migrate trước) đã có trong mã;
  - phần còn lại chỉ thu hẹp một cửa sổ vài giây mà rủi ro đã gần bằng 0, và không chữa được rủi ro thật (hàng đợi có sẵn lúc lùi);
  - đổi đường deploy production sát giờ phát hành thì phải duyệt lại ARC + SEC và diễn tập lại 5.0, tức rủi ro trễ mốc lớn hơn rủi ro được giảm.
- Thẻ `FB-R4-OPS-ARC-31-01`: **Accepted, v1.0.4**. Điều kiện ARC:
  1. `switch` tách thành `worker` rồi `api web`. `--rollback` và `restore_previous` theo thứ tự ngược lại.
  2. `rollback.test.sh` có ca kiểm thứ tự lệnh `up`.
  3. Diễn tập lại 5.0.
  4. **Phải xong trước bản nào thêm mẫu thư `staff.email` mới, hoặc thêm job/topic outbox mà worker cũ không xử lý được**. PO đưa điều kiện này vào backlog v1.0.4.
- Dòng decision-log đề nghị (ORC ghi):
  `| 2026-11-03 | 4 | ARC – G8 (PR #32): chấp nhận cho v1.0.3 thứ tự worker/api đạt bằng thao tác (runbook 1.3a: K2 đếm BAD_TEMPLATE, R3b rút hàng đợi, INV không lưu email từ R3b tới R5, R6 đếm, R9 xếp lại). deploy.sh giữ nguyên tới Release: migrate đã chạy trước switch; web chờ api healthy nên ô email v1.0.3 chỉ có sau khi api lên; rủi ro còn lại là dòng email_changed có sẵn khi quay lui, đổi thứ tự trong mã không chữa được. Tách bước switch (worker → api; quay lui api → worker) + test thứ tự + diễn tập lại 5.0 ở v1.0.4, bắt buộc trước bản nào thêm mẫu staff.email mới | ARC | Quyền ARC (kiến trúc, quy trình deploy) |`

## 2. `ops-check email_changes` / `email_ascii`: **đạt**

- Chạy được trên DB 67 qua `\if`:
  - `\gset` gán `has_uec` = `t`/`f`, và `\if` của psql nhận được giá trị này.
  - Nhánh `\if` không chạy thì psql bỏ qua, không gửi lên server. Câu đếm `user_email_change` vì vậy không lỗi khi chưa có bảng.
  - ARC đã chạy cả ba ca trên Postgres 17 (bảng trên).
- Chỉ có số ra khỏi DB. Câu trả lời lạ bị từ chối và không in. Ngưỡng không tắt được. Lỗi truy vấn báo theo loại cố định. Tất cả đúng khuôn `email_missing`.
- Dùng `sum(n)` cho tổng số lần đổi là đúng ý SEC, không phải `count(*)` số người. Đồng ý với OPS.
- `email_ascii`: regex là phủ định đúng của luật `normalizeSecurityEmail` (OPS đã so 29 ca). Dòng rỗng không bị đếm, vì đã thuộc `email_missing`. Đạt.
- Chỗ cần ghi thêm (thẻ 05): sau khi R9 xếp lại hàng đợi, các dòng giữ `created_at` cũ, nên `email_changes` có thể `FAIL … oldest waiting … min old` vài phút.

## 3. `requeue-email-changed.sh`: **đạt**

- Câu hỏi mẫu trong container đúng thiết kế, và ARC đã kiểm:
  - `dc exec -T worker` chạy đúng container đang sống, sau khi đã kiểm có đúng một container worker chạy đúng tag;
  - WORKDIR `/app` có `node_modules/@ottimo/integrations` (`pnpm deploy --prod`), và `exports["./notification"]` tồn tại;
  - root filesystem chỉ đọc không ảnh hưởng (`node -e` không ghi gì);
  - mã 0/1/khác được tách rõ, "khác" thì từ chối (fail-closed);
  - đây cũng chính là hàm và module mà dispatcher dùng (`jobs/email-dispatch.ts:29,216`), nên câu trả lời đúng với hành vi thật của worker.
- Khóa `deploy.lock` giữ suốt lượt chạy. Số dòng được kiểm lại trong giao dịch (`GET DIAGNOSTICS` + `RAISE`). Câu `WHERE` chung cho câu đếm và câu `UPDATE`. Cửa sổ 7 ngày đúng điều kiện ARC. Ghi lại `status`/`attempts`/`next_attempt_at`/`last_error` khớp điều kiện claim của dispatcher (`pending AND next_attempt_at IS NULL`).
- Trường hợp `flock` vắng thì bỏ qua khóa: SEC đã có thẻ `FB-R4-SEC-OPS-PR32-01`. ARC đồng ý, không lặp thẻ.

## 4. Runbook r2 và đối chiếu với 0091 thật

### ARC `FB-R4-ARC-OPS-PR30-11`: đủ 3 chỗ, **Done**
- (a) Mục 7: dòng decision-log của PR-2 đã ghi "phủ định đúng của CHECK (ARC chốt, errata tech plan 2.4)".
- (b) Mục 0: câu đã sửa đúng chữ ARC đề xuất. Khi điền ô `⟨CHỜ PR-1⟩` ngay sau đó, câu này cần viết lại cho khớp 0091 thật (xem bảng dưới): `''` không còn làm gãy migration.
- (c) R6: một mốc **giờ R4** cho mọi lệnh đếm log, lỗi thì in `ERR`. Phía DB so với `BT_BASE` thay vì lọc `created_at > giờ R4`. **ARC chấp nhận chỗ khác đề xuất này**: dòng `email_changed` được tạo lúc đổi email, trước lúc lùi, nên lọc theo giờ R4 sẽ bỏ sót đúng dòng cần đếm. OPS đúng.

### Mục 1.3a, K2, R3b, R6, R9: **đạt**, kèm thẻ 01–05
- 1.3a ghi đúng quyết định ARC và đúng giới hạn của mã. Nên thêm lý do compose ở mục 1 vào đó (thẻ 03).
- K2 có câu đếm `BAD_TEMPLATE` đúng nguyên văn ARC, không có khung thời gian. Nhưng K2 thiếu kiểm RLS của `app_user` (thẻ 01).
- R3b: đếm cả `in_flight`, chờ tối đa 5 phút, sự cố gấp thì đi tiếp có ghi số. Đúng.
- R9 làm đúng hai điều kiện ARC:
  - chỉ sau khi lên lại v1.0.3; script tự từ chối nếu chưa;
  - chỉ dòng trong 7 ngày.

  `--apply` cần INV đồng ý. Bước 4 dùng cửa sổ 7 ngày thay cho câu 3 giờ, đúng. Thẻ 02 sửa một câu "Đúng là".

### Đối chiếu với 0091 trên `origin/v1.0.3-email` @ `fb6a281c`
- Thứ tự trong tệp, cả khối chạy trong **một** giao dịch của migrator:
  1. `CREATE TABLE user_email_change`
  2. FK + index
  3. `app_user NO FORCE` + `DISABLE RLS`
  4. `UPDATE app_user SET email = NULL WHERE email IS NOT NULL AND btrim(email::text) = ''`
  5. `ENABLE` + `FORCE RLS`
  6. `ADD CONSTRAINT app_user_email_check`
  7. RLS/policy/GRANT của bảng mới

  Bước chuyển `''` (và chuỗi toàn khoảng trắng) → NULL **chạy trước** CHECK: **xác nhận**.
- Ở lượt review PR #31, ARC đã thử ca gãy: rollback trọn, `app_user` vẫn FORCE RLS.
- Mục 0 dòng "Migration chạy ở đâu" ghi "0091 chỉ thêm … Không sửa dòng có sẵn". Câu này **sai** với 0091 thật: 0091 có một `UPDATE` dữ liệu và tắt/bật RLS của `app_user`. Bảng 1.3 cũng thiếu dòng này (thẻ 01).
- Câu tiền kiểm ở đầu tệp 0091 là phủ định đúng của CHECK, chỉ xét dòng không rỗng: `btrim(email) <> '' AND (char_length NOT BETWEEN 3 AND 254 OR position('@') <= 1)`. Câu P2 dòng 4 chặt hơn: đếm cả dòng rỗng, nên P2 dòng 4 = 0 thì `UPDATE` của 0091 đổi 0 dòng.

### Ô `⟨CHỜ PR-1⟩` điền được ngay (giá trị ở `fb6a281c`; P1 kiểm lại ở `SHA_V103`)

| Ô (runbook r2) | Giá trị ARC xác nhận | Kiểm lại ở P1 |
|---|---|---|
| Mục 0 dòng "CHECK 0091 có thể gãy không" | Viết lại: "Chỉ khi có dòng `app_user.email` không NULL, **không rỗng / không toàn khoảng trắng**, mà CHECK từ chối (sai dạng, ngắn hơn 3, dài hơn 254). Dòng `''` hoặc toàn khoảng trắng được 0091 đổi thành NULL **trước** CHECK, trong cùng giao dịch (đã đối chiếu `fb6a281c`). P2 dòng 4 vẫn đếm chặt, kèm dòng 4b." Bỏ ô chờ. | Không |
| Mục 8 dòng 840 (dòng 4 > 0 thì sao) | **ARC duyệt trước**, không cần ARC + BE xác nhận trong chat lúc phát hành. Thêm vào P2 dòng **4b** = đúng câu tiền kiểm ở đầu tệp 0091: `SELECT count(*) FROM app_user WHERE email IS NOT NULL AND btrim(email::text) <> '' AND (char_length(email::text) NOT BETWEEN 3 AND 254 OR position('@' in email::text) <= 1);`. **Đúng là:** dòng 4 = `0`; hoặc dòng 4 > 0 và dòng 4b = `0` (chỉ có dòng rỗng, 0091 tự làm sạch: ghi số vào decision-log rồi đi tiếp). Dòng 4b > 0 thì **dừng**, như cũ. | Không |
| `HASH_0091` (K2) | `e8bb6cb92a43a85b793fc5c73a197a9236c407d918b8ff70cb054c21fecb33a3` | `git show ⟨SHA_V103⟩:product/services/api/src/db/migrations/0091_user_email_change.sql \| shasum -a 256` phải ra đúng số này. Khác thì 0091 đã đổi sau review: **dừng**, báo ARC + BE |
| `WHEN_0091` (K2) | `1792782171681` (journal idx 67, = 0090 + 2000) | Như trên, với `meta/_journal.json` |
| Tên mục Desk (K8 bước 2) | Menu **Bảo mật tài khoản** (EN *Account security*, khóa `shell.account_security`) → khối **Email nhận thông báo bảo mật** (EN *Notification email*, khóa `secmail.title`) | Chữ do UXD/FE-A chốt. Nếu PR-1 còn sửa chữ thì đối chiếu `product/design/copy/strings-vi.json` |
| 1.2 "PR-1 có đổi `product/infra` không" | **Không.** `git diff --name-only 1b5fd874 origin/v1.0.3-email -- product/infra .github` rỗng. Bảng 1.2 giữ nguyên, P2b không có bước kiểm thêm | Lệnh P1 `git diff --name-only v1.0.2 "$S" -- product/infra` chỉ được ra các tệp ở bảng 1.2 |
| K4 "dòng log worker mới" | PR-1 **không** thêm dòng khởi động mới. Dòng `worker started` có thêm job `email_change.purge` trong `jobs`. Nên thêm vào lệnh K4: `echo "PURGE_JOB=$(printf "%s\n" "$L" \| grep "\"msg\":\"worker started\"" \| grep -c "\"email_change.purge\"")"`. **Đúng là** `PURGE_JOB=1`. R6 trên v1.0.2: `PURGE_JOB=0`, đúng (job là mã v1.0.3) | Không |

Còn chờ PR-1 gộp (không điền được bây giờ): `SHA_V103`, `TAG12`, `API_DIGEST`, `WEB_DIGEST`, `CI_RUN`. Tên tệp QC vẫn là giả định của OPS.

## 5. Thẻ feedback

### FB-R4-ARC-OPS-PR32-01
- Mức độ: Major
- Vị trí: runbook r2 mục 0 dòng "Migration chạy ở đâu"; bảng 1.3; K2; R6 gạch đầu dòng K2
- Vấn đề:
  - Mục 0 ghi "0091 chỉ thêm … Không sửa dòng có sẵn". Bảng 1.3 chỉ có CHECK và bảng mới. 0091 thật (`fb6a281c`) còn có `ALTER TABLE app_user NO FORCE / DISABLE ROW LEVEL SECURITY` → `UPDATE … SET email = NULL` → `ENABLE / FORCE`.
  - K2 chỉ kiểm RLS của `user_email_change`. Không có dòng nào xác nhận `app_user` vẫn ENABLE + FORCE sau migration.
- Vì sao quan trọng:
  - RLS FORCE trên `app_user` là chốt cách ly dữ liệu giữa các tổ chức (ADR multi-tenant).
  - Đây là migration production đầu tiên kể từ 0042/0043 tắt rồi bật lại RLS của một bảng lõi.
  - ARC đã thử trên DB tạm: thành công thì bật lại, gãy thì rollback trọn. Nhưng production cần bằng chứng riêng. Kiểm chỉ tốn một câu `SELECT` READ ONLY.
- Đề xuất sửa (runbook r3, trước Release):
  - Mục 0 và bảng 1.3: thêm dòng "0091 đổi `app_user.email` rỗng/toàn khoảng trắng thành NULL, tắt RLS `app_user` cho riêng câu đó rồi bật lại ENABLE + FORCE trong cùng giao dịch. Trên production P2 dòng 4 = 0 nên câu này đổi 0 dòng. v1.0.2 chạy được với kết quả này (NULL = chưa có email)."
  - K2: thêm `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid = 'public.app_user'::regclass;` → **Đúng là** `t|t`. Lệch thì **dừng, không làm K8**, báo ARC + SEC + BE.
  - R6 (K2 rút gọn) giữ dòng này.
  - Diễn tập 5.0: ghi dòng này cả hai chiều.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR32-02
- Mức độ: Minor
- Vị trí: runbook r2 R9 bước 1, câu "`<n>` bằng số R6 dòng 2 − `BT_BASE` (nếu còn trong 7 ngày)"
- Vấn đề: script xếp lại **mọi** dòng `BAD_TEMPLATE` `email_changed` trong 7 ngày, kể cả dòng đã có trong `BT_BASE` (của một lần lùi trước, trong 7 ngày). Khi `BT_BASE` > 0, `<n>` sẽ lớn hơn "dòng 2 − `BT_BASE`", và ORC tưởng là lệch.
- Vì sao quan trọng: một câu "Đúng là" sai làm ORC dừng nhầm, hoặc đoán số cho `--expect`.
- Đề xuất sửa: "Đúng là: `<n>` + `<m>` = số `BAD_TEMPLATE` đếm ngay lúc đó (câu R6 dòng 2). `<n>` ≥ dòng 2 − `BT_BASE` nếu các dòng mới còn trong 7 ngày." `--expect` luôn lấy đúng số chạy thử in ra.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR32-03
- Mức độ: Minor
- Vị trí: runbook r2 mục 1.3a gạch "Quay lui"; R3b; R4; R7
- Vấn đề: chiều quay lui còn một cửa sổ vài giây: người dùng còn mở SPA v1.0.3 và lưu email đúng lúc `rollback.sh` đổi container. Runbook chưa có câu nào yêu cầu tránh việc này. Chiều deploy thì đã có ("INV chỉ làm K8 sau K7").
- Vì sao quan trọng: đây là phần thao tác thay cho việc tách bước `switch` trong mã (G8). Không đóng cửa sổ này thì chỉ còn đếm và xếp lại sau.
- Đề xuất sửa:
  - R3b, trước khi đếm: ORC nhắn INV "từ giờ tới khi đội báo xong (R5), anh/chị **không lưu hay đổi email** trên Desk". INV là OWN duy nhất và là người duy nhất đổi được email.
  - 1.3a: thêm lý do compose: `web` chờ `api` healthy, `worker` không có healthcheck. Ô email v1.0.3 vì vậy chỉ xuất hiện sau khi api lên, và chiều deploy gần như không có cửa sổ.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR32-04
- Mức độ: Minor
- Vị trí: runbook r2 mục 4, dòng `step=` `switch`, `smoke`
- Vấn đề: khi `switch`/`smoke` lỗi, `restore_previous` đưa v1.0.2 lên lại. Đây là một lần quay lui ngoài kế hoạch: không có R3b, và worker v1.0.2 gặp mọi dòng `email_changed` còn chờ. Dòng này chỉ yêu cầu K1, không yêu cầu đếm `BAD_TEMPLATE`.
- Vì sao quan trọng: ít khả năng có dòng như vậy (chưa ai đổi email trước K8), nhưng nếu có thì mất thư mà không ai biết. Đúng lỗ hổng mà `FB-R4-ARC-BE-31-02` muốn bịt.
- Đề xuất sửa: thêm vào cột "Làm gì": "chạy câu `BAD_TEMPLATE` của 1.3a (READ ONLY). Khác 0: ghi số, R9 sau khi Release lại thành công".
- Trạng thái: Open

### FB-R4-ARC-OPS-PR32-05
- Mức độ: Minor
- Vị trí: runbook r2 R9 bước 4; README 13.9; mục F
- Vấn đề: dòng được xếp lại giữ `created_at` cũ (giờ đổi email, có thể vài giờ tới vài ngày trước). Ngay sau `--apply`, `email_changes` thấy thư "đang chờ" cũ hơn 30 phút và ra `FAIL … oldest waiting staff e-mail … – security notices delayed` cho tới khi worker gửi xong (10 thư/phút/cơ sở). Nếu timer 30 phút chạy đúng lúc đó, webhook báo động, và ORC có thể làm mục F nhầm.
- Vì sao quan trọng: cảnh báo giả ngay sau một thao tác ghi có chủ đích làm người vận hành mất tin vào cảnh báo.
- Đề xuất sửa: R9 bước 4 và README 13.9: "Trong vài phút sau `--apply`, `email_changes` có thể `FAIL` vì tuổi hàng đợi. Đó là dự kiến, **không** làm mục F. Chạy lại sau 3 phút, phải `ok`." Mục F bước 1: "Nếu trong 30 phút trước có R9 `--apply`, chạy lại sau 3 phút trước khi kết luận." Không đổi mã.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR32-06
- Mức độ: Suggestion (v1.0.4)
- Vị trí: `requeue-email-changed.sh` biến `probe`; `email-dispatch.ts:29`
- Vấn đề: câu hỏi mẫu phụ thuộc đường xuất `@ottimo/integrations/notification` và tên hàm `isStaffEmailTemplate`. Nếu v1.0.4 đổi chỗ (ví dụ theo `FB-R4-ARC-BE-31-05`, gom tên mẫu về `STAFF_EMAIL_TEMPLATES`), script trả mã 3 và từ chối. Như vậy vẫn an toàn (fail-closed), nhưng R9 sẽ hỏng đúng lúc cần.
- Đề xuất sửa: v1.0.4: thêm một test ở `@ottimo/integrations` khóa đường xuất này, ghi chú "dùng bởi `infra/server/bin/requeue-email-changed.sh`". Hoặc BE xuất một lệnh nhỏ `node dist/cli/known-templates.js` để script gọi.
- Trạng thái: Open

## 6. Trả lời giả định OPS

| Mã | Quyết định ARC |
|---|---|
| G8 | **Chấp nhận** (mục 1). Không sửa `deploy.sh` trước Release. `FB-R4-OPS-ARC-31-01` Accepted v1.0.4, kèm điều kiện "trước bản nào thêm mẫu thư mới" |
| G9 | Khoảng chỉnh 1–20 / 1–200 / 5–240 hợp lý về kỹ thuật: số nguyên, có trần, không tắt được. Giá trị ngưỡng là quyền SEC |
| G10 | **Chấp nhận.** `failed` đang chờ thử lại là thư bảo mật bị trễ thật. SMTP hỏng quá 30 phút mà ra `FAIL` là đúng |
| G11 | **Chấp nhận** cho v1.0.3. Việc chuyển mọi kiểm DB sang vai chỉ đọc vẫn gom vào ARC PR30-09 / SEC PR32-S1 ở v1.0.4 |

## 7. Điểm làm tốt

1. OPS phát hiện `deploy.sh` không bảo đảm thứ tự mà quyết định ARC giả định. OPS nói thẳng trong phản hồi, không lặng lẽ "đạt bằng giấy", và tự đề xuất thẻ sửa có test. Lần sau, khi một quyết định kiến trúc đụng tới đường deploy, cứ đọc mã như vậy.
2. Dùng `\if` + `to_regclass` để một kiểm chạy được trên cả DB 67 lẫn 68 là cách gọn, đúng với kế hoạch làm mới gói `infra/` trước Release. Kiểm ngưỡng "chỉnh được nhưng không tắt được" cũng đúng tinh thần fail-closed.
3. `requeue-email-changed.sh` đúng khuôn một thao tác ghi trên production: mặc định chạy thử; `--expect` lấy từ chính lần chạy thử; giao dịch tự hủy khi lệch số; hỏi chính image đang chạy chứ không tin tag. Các script ghi sau này nên theo khuôn này.

---

## PR #33 – `ops/v1.0.3-runbook-r3` @ `37e27362` (runbook r3, `flock` trong `requeue`)

- Base `main` @ `351cf073`. Diff đọc: `git diff origin/main...origin/ops/v1.0.3-runbook-r3` (5 tệp, +249/−80). Đối chiếu `responses/OPS-on-PR32.md` @ `37e27362` và các thẻ ở trên.
- Người duyệt: ARC. Round 4, v1.0.3, bước **Review**. Ngày 03/11/2026. Không checkout, không commit, không đăng lên PR.

### Kết luận PR #33: **ĐẠT CÓ ĐIỀU KIỆN**

- Mã (`requeue-email-changed.sh` + test) **đạt**.
- Thẻ ARC PR32-01 (Major) và 02–05 **đã đóng**. Mọi ô đã điền **khớp `main` thật**.
- G12: ARC **đồng ý** về nguyên tắc.
- Điều kiện: mục 0.2, như đang viết, **không chạy được**, vì lọc lượt CI theo `conclusion == success` (thẻ PR33-01, Major). OPS sửa 0.2 bằng một commit tài liệu **trên chính nhánh PR #33, trước khi gộp**. Sửa sau khi gộp thì lần push tài liệu đó hủy chính lượt CI của `SHA_V103` (xem thẻ). ARC chỉ đối chiếu lại mục 0.2. Thẻ 02, 03 làm cùng commit đó.

### Kiểm đã chạy

| Kiểm | Kết quả |
|---|---|
| `requeue-email-changed.test.sh` từ `git archive 37e27362`: Mac (không `flock`) và `ubuntu:24.04` (`--network none`, có `flock`) | 46/46 và 48/48 |
| Đọc mã khóa | `flock` có thì `flock -n 9` như cũ. Không có `flock` mà `RQ_TEST_DC` rỗng thì `REFUSED` trước mọi lệnh `dc`. `RQ_TEST_DC` đã bị từ chối khi `is_prod` (trên đoạn khóa), nên trên production thiếu `flock` luôn dừng. Khớp `deploy.sh:53` (gọi `flock` không điều kiện). Ca test mới chạy với `env -i` và `PATH` tối thiểu, kiểm cả "không có lời gọi docker/DB". Đạt |
| PR #33 CI (`41654939930`) | `gitleaks` pass (bảng 0.1 có `HASH_0091` đủ 64 ký tự: không bị báo nhầm), `infra scripts` pass |
| `gh run list --branch main --event push`; `gh run view` | Lượt `351cf073` (`41648829367`) đang **`waiting`**, `conclusion` rỗng (job `deploy staging` chờ duyệt). Lượt `bf1e0ae9` (`41639432861`): `publish images` success, `deploy staging` **cancelled** khi có push mới. Lượt `success` gần nhất là `e5fffe05` (v1.0.2) |
| `release.yml:57` | `resolve` tìm lượt CI bằng `head_sha=<tag>&event=push&status=success`. Lượt CI của `SHA_V103` phải **xong và success**, kể cả job `deploy staging` |

### 1. Thẻ ARC PR32

| Thẻ | Trạng thái | Đối chiếu r3 |
|---|---|---|
| PR32-01 (Major) | **Done** | Mục 0 "Migration chạy ở đâu" đúng thứ tự 0091 thật: bảng → `NO FORCE`/`DISABLE` → `UPDATE … = ''` → `ENABLE`/`FORCE` → CHECK → RLS bảng mới. Bảng 1.3 có dòng mới. K2 có `relrowsecurity, relforcerowsecurity` của `app_user`, đúng là `t\|t`, lệch thì dừng, không K8, báo ARC + SEC + BE. R6 giữ dòng này. 5.0 có S3/S7/S13. Bảng dừng mục 6 có |
| PR32-02 | **Done** | R9 bước 1: `<n>` + `<m>` = R6 dòng 2; `<n>` ≥ dòng 2 − `BT_BASE`; `--expect` lấy đúng số chạy thử |
| PR32-03 | **Done** | R3b: ORC nhắn INV, chờ "đã rõ" (trừ sự cố gấp); R5: báo INV dùng lại Desk. 1.3a: có lý do compose. Bảng dừng có dòng R3b |
| PR32-04 | **Done** | Mục 4 dòng `switch`/`smoke`: đếm `BAD_TEMPLATE` 1.3a, khác 0 thì R9 sau khi Release lại |
| PR32-05 | **Done** | R9 bước 4, README 13.8/13.9, mục F bước 1, bảng dừng F. Không đổi mã |
| PR32-06 | Deferred v1.0.4 | Chấp nhận |

### 2. Ô đã điền so với `main` @ `351cf073`

| Ô | Runbook r3 | ARC kiểm trên `main` | Khớp |
|---|---|---|---|
| `HASH_0091` | `e8bb6cb9…b33a3` | `git show 351cf073:…/0091_user_email_change.sql \| shasum -a 256`, ra đúng số này, trùng `fb6a281c` | Có |
| `WHEN_0091` | `1792782171681` | `_journal.json`: 68 mục; idx 67 = `0091_user_email_change` `1792782171681`; 0090 = `1792782169681` | Có |
| Câu CHECK (mục 0, 1.3) | `email IS NULL OR (char_length BETWEEN 3 AND 254 AND position('@') > 1)`; `UPDATE` trước CHECK | 0091 dòng 27–37: đúng thứ tự, đúng biểu thức | Có |
| P2 dòng 4b | `btrim(email::text) <> '' AND (char_length(email::text) NOT BETWEEN 3 AND 254 OR position('@' in email::text) <= 1)` | Trùng từng chữ câu tiền kiểm ở dòng 7–8 tệp 0091. "Đúng là" và bảng dừng đúng chữ ARC duyệt trước. Thứ tự đầu ra `on, 67, t, 0, 0, 1, 1` khớp 7 câu | Có |
| K4 `PURGE_JOB` | grep `"email_change.purge"` trong dòng `worker started` | `worker.ts:74` log `jobs: registry.keys()`; `builtin-jobs.ts:73` khóa `email_change.purge`. R6 trên v1.0.2 là `0` | Có |
| Tên mục Desk | **Bảo mật tài khoản** → **Email nhận thông báo bảo mật**, nút **Lưu email**; câu `secmail.saved_first` | `strings-vi.json`/`strings-en.json`: `shell.account_security`, `secmail.title`, `secmail.save` = "Lưu email", `secmail.saved_first` bắt đầu đúng câu runbook | Có |
| Tiêu đề thư | `OTTIMO – Security notice: notification email changed / Thông báo bảo mật: email nhận thông báo đã thay đổi` | `email-templates.ts`: `subject = \`OTTIMO – ${subjectEn} / ${subjectVi}\`` với hai chuỗi trên. Câu "Thay đổi do chủ cơ sở thực hiện." chỉ khi `via = owner` (dùng ở mục F): đúng | Có |
| `git diff v1.0.2..main -- product/infra` | 9 tệp, +867/−30, danh sách ở bảng 1.2 | `git diff --stat v1.0.2 351cf073 -- product/infra` ra đúng 9 tệp, +867/−30. Ngoài `infra`: chỉ `.github/gitleaks.toml`, `.github/workflows/ci.yml`. Không có compose/env/Caddy/roles/Dockerfile. PR #33 không thêm tệp nào, nên P1 "đúng 9 tệp" vẫn đúng ở `SHA_V103` mới | Có |

### 3. G12 và mục 0.2

**Đồng ý G12**: `SHA_V103` = **commit gộp PR #33**. Một commit dùng chung cho image, gói `infra/` (có bản sửa `flock`) và tag. Không cho P1 nới lỏng. Không duyệt `deploy staging` của lượt `351cf073`. Lần gộp PR #33 sẽ tự hủy lượt đó, đúng ý.

**Digest:** 0.2 không cần dán digest đầy đủ. **Đạt**:
- `sed` chỉ in 8 + 4 ký tự;
- `release.yml` tự đọc artifact;
- lệnh lên lại ở 5.0 và R8 đọc digest vào biến.

**Chọn đúng commit:** 0.2 **chưa đạt** (thẻ 01):
- Câu `select(.conclusion=="success")` không thấy lượt CI của commit gộp. Lượt đó dừng ở `waiting` (chờ duyệt `deploy staging`) cho tới bước 4, nên bước 3 sẽ lấy `e5fffe05` (v1.0.2). Kiểm băm 0091 và diff sẽ lệch, nên ORC dừng: thủ tục an toàn nhưng **không đi tới được**.
- 0.2 lấy "lượt xanh mới nhất", không ghim đúng commit gộp. Ý G12 cần đúng commit gộp.
- 0.2 không cấm push lên `main` trong lúc lượt CI của `SHA_V103` còn chờ. `concurrency.cancel-in-progress` sẽ hủy lượt đó, như lượt `bf1e0ae9` ở trên. Khi đó `resolve` của Release (`status=success`) từ chối tag.

### 4. Bảng biên bản S1–S13 (mục 5.0)

- **Đủ cho phần mới của v1.0.3.** Mỗi dòng có lúc làm, lệnh, "Đúng là" cụ thể và cột số thật. Có luật: một ô lệch mà ARC/SEC chưa chấp nhận lý do thì KHÔNG ĐẠT. Các phần có trong bảng:
  - 0091: `app_user` `t|t` cả ba thời điểm;
  - Q1: `dead|BAD_TEMPLATE|1`, `BT_BASE` + 1, `WORKER_ERR_R4` = `LOG_BAD_TEMPLATE` = 1, không tự gửi lại;
  - R9 hai chiều;
  - ca 6 lần đổi email;
  - `AT_IN_LOG`;
  - `PURGE_JOB`.
- ARC đã kiểm "đúng là `1`" ở S5/S11 với mã: mỗi lần đổi email chỉ tạo **một** dòng outbox (`security-email.service.ts:161–166`, khóa `email:email_changed:<changeId>`). Đúng.
- **Chưa đủ để QC chấm cả diễn tập chỉ từ bảng** (thẻ 03). P0 đòi diễn tập "trên đúng `TAG12`" và các điều kiện sau, nhưng bảng không có dòng nào cho chúng:
  - `MA THOAT: 0` hai chiều, `68 / 67` và `68 / 68`;
  - số đếm và băm dữ liệu không đổi;
  - `smoke-prod`, trigger PN-01 sau lùi.

  Sau G12, dòng "staging chạy đúng `TAG12` của commit gộp" là dòng quan trọng nhất cho QC.

### 5. Thẻ feedback

#### FB-R4-ARC-OPS-PR33-01
- Mức độ: Major
- Vị trí: runbook r3 mục 0.2 bước 2–4; bảng dừng mục 6 dòng P0; rủi ro R5 mục 8
- Vấn đề: như mục 3 ở trên:
  - lọc lượt CI theo `conclusion == success`, trong khi lượt của commit gộp còn `waiting`;
  - không ghim đúng commit gộp;
  - không cấm push lên `main` khi lượt đó chưa xong. Bằng chứng: lượt `41648829367` đang `waiting`; lượt `41639432861` bị hủy ở `deploy staging`; `release.yml:57` đòi `status=success`.
- Vì sao quan trọng: đây là mục chốt commit sẽ lên production. Viết như hiện tại thì ORC hoặc dừng (thủ tục an toàn nhưng trễ mốc), hoặc tự chế lệnh lúc phát hành. Chỉ một lần push tài liệu cũng làm Release bị từ chối, và phải dựng lại image, deploy lại staging, diễn tập lại 5.0.
- Đề xuất sửa (commit tài liệu trên nhánh PR #33, **trước khi gộp**):
  1. Bước 1 thêm câu: **từ lúc gộp PR #33 tới khi lượt CI của commit gộp `completed success` (sau khi duyệt `deploy staging`), không push gì lên `main`, kể cả gộp PR khác.** Commit tài liệu (bảng 0.1, biên bản) chỉ commit local, push ở P1.
  2. Bước 3 thay bằng lệnh ghim commit gộp, chọn lượt theo `headSha` và kiểm theo **job**, không theo kết luận của cả lượt:
     ```bash
     cd /Users/anhvh/Desktop/hotel-app && R=anhvh93-tech/ottimo-hotel-app-public && git fetch origin \
      && S=$(gh pr view 33 -R $R --json state,mergeCommit --jq 'select(.state=="MERGED") | .mergeCommit.oid') && test -n "$S" \
      && git merge-base --is-ancestor "$S" origin/main && echo "SHA_V103=$S TAG12=sha-$(printf %s "$S" | cut -c1-12)" \
      && CI_RUN=$(gh run list -R $R -w CI --event push --branch main --commit "$S" -L 1 --json databaseId --jq '.[0].databaseId') && test -n "$CI_RUN" && echo "CI_RUN=$CI_RUN" \
      && gh run view $CI_RUN -R $R --json status,jobs --jq '"run: \(.status)", (.jobs[] | select(.name=="gitleaks" or .name=="publish images (GHCR)" or .name=="deploy staging") | "\(.name): \(.status) \(.conclusion)")' \
      && d=$(mktemp -d) && gh run download $CI_RUN -R $R -n image-digests -D "$d" \
      && sed -nE 's/^([a-z]+)=sha256:([0-9a-f]{8})[0-9a-f]{52}([0-9a-f]{4})$/\1=\2…\3/p' "$d/image-digests.txt"; rm -rf "${d:-/nonexistent}" \
      ; git show "$S:product/services/api/src/db/migrations/0091_user_email_change.sql" | shasum -a 256 \
      ; git diff --name-only 351cf0739d5eb6d5584606c60a0a5fd4b8d8db41 "$S" -- product/infra product/services product/apps product/packages product/integrations .github; echo "END CODE DIFF SINCE 351cf073"
     ```
     **Đúng là:**
     - `run: waiting`;
     - `gitleaks: completed success`, `publish images (GHCR): completed success`, `deploy staging: waiting`;
     - 3 dòng 8 + 4 ký tự;
     - băm = `HASH_0091`;
     - diff có **đúng** ba tệp: `requeue-email-changed.sh`, test của nó, `server/README.md`.

     Thiếu dòng nào, kể cả không có lượt CI cho `S`, thì **dừng**.
  3. Bước 4: INV đồng ý → duyệt `deploy staging` của **chính** `CI_RUN`. Sau đó `gh run watch $CI_RUN -R $R --exit-status` phải ra mã 0 và `gh run view $CI_RUN --json conclusion` = `success`. **Chỉ sau đó** mới được push. Ghi chú `release.yml:57` để ORC biết vì sao.
  4. Nếu lượt bị hủy hoặc đỏ trước khi `success`: không gắn tag. Chạy `gh run rerun $CI_RUN` (cùng `S`), làm lại bước 3 (digest có thể đổi), deploy staging lại, rồi diễn tập 5.0 trên digest mới.
  5. Bảng dừng P0 và rủi ro R5 thêm ý "push lên `main` trước khi `CI_RUN` success".
- Trạng thái: Open

#### FB-R4-ARC-OPS-PR33-02
- Mức độ: Minor
- Vị trí: runbook r3, ngay sau mục 0.2 (dòng 89–98 của tệp)
- Vấn đề: còn sót phần cuối bảng ô chờ của r2: một dòng `---|---|---|` không có tiêu đề, và các dòng cũ, ví dụ "plan 6.2: **Tài khoản của tôi**", "Dòng log worker mới (nếu có) | PR-1", "(giả định)". Khi hiển thị, phần này dính vào mục 0.2 và mâu thuẫn với bảng 0.1.
- Vì sao quan trọng: ORC đọc 0.1/0.2 lúc phát hành. Thấy hai giá trị cho một ô (tên mục Desk) thì phải dừng hỏi.
- Đề xuất sửa: xóa dòng 89–98 (từ `---|---|---|` tới dòng "Tên tệp QC … (giả định)"), giữ `---` phân cách trước mục 1.
- Trạng thái: Open

#### FB-R4-ARC-OPS-PR33-03
- Mức độ: Minor (làm trước diễn tập, cùng commit với thẻ 01)
- Vị trí: runbook r3 mục 5.0, bảng "Biên bản bắt buộc"
- Vấn đề: như mục 4 ở trên. Các điều kiện P0 về tag, mã thoát, dữ liệu không đổi, `smoke-prod`, PN-01 chỉ nằm trong phần chữ. S8 có "hoặc số thật của QA", nên không có chuẩn chấm. S5 nói "chỉ dòng `email_changed`" nhưng câu K9 không lọc theo mẫu.
- Vì sao quan trọng: QC chấm từ biên bản. Thiếu dòng tag thì QC không chứng minh được staging chạy đúng image sẽ lên production, mà đó là toàn bộ lý do của G12.
- Đề xuất sửa: thêm các dòng:
  - **S0** (trước tất cả): `current_tag` staging = `TAG12` ở 0.1 đã chốt theo 0.2; api/web 8 + 4 ký tự trùng 0.1; job `deploy staging` của `CI_RUN` = success.
  - **S4b** (lệnh lùi): `migrations: 68 applied / 67`, `OK: sha-e5fffe05ed55 is live`, `MA THOAT: 0`.
  - **S9b** (lên lại): `deploy ⟨TAG12⟩: ok`, `68 / 68`, `MA THOAT: 0`.
  - **S14**: số đếm + băm OTM-00378…00382 trùng lúc trước, cả sau lùi lẫn sau lên lại.
  - **S15** (sau lùi): `smoke-prod` 7 passed / 1 skipped; PN-01 2 trigger `O`.

  Sửa thêm:
  - S8: "Đúng là" = `FAIL` với số lần/người = số `user_email_change` của người thử ở S2 + 1. QA ghi trước người thử nào nhận lần đổi lúc dừng worker.
  - S5: ghi rõ câu `… AND payload->>'template' = 'email_changed' GROUP BY 1, 2`.
- Trạng thái: Open

#### FB-R4-ARC-OPS-PR33-04
- Mức độ: Suggestion
- Vị trí: runbook r3 mục 0.2 bước 3, lệnh `sed -E 's/…/…/'`
- Vấn đề: `sed` không có `-n … p`, nên dòng nào của `image-digests.txt` không khớp mẫu (đổi định dạng, thêm dòng) sẽ được in nguyên, tức in digest đầy đủ ra terminal, rồi có thể bị dán vào chat.
- Đề xuất sửa: dùng `sed -nE '…/p'` (đã có trong lệnh ở thẻ 01). Thiếu dòng thì "Đúng là" 3 dòng không đạt, và ORC dừng.
- Trạng thái: Open

### 6. Dòng decision-log đề nghị (ORC ghi)

`| 2026-11-03 | 4 | ARC – PR #33 runbook v1.0.3 r3: ARC PR32-01…05 đóng; ô 0.1 khớp main 351cf073 (HASH_0091, WHEN_0091, CHECK, P2 4b, PURGE_JOB, tên mục Desk, tiêu đề thư, v1.0.2..main -- product/infra 9 tệp). requeue thiếu flock → REFUSED đạt (46/48 test). G12 chấp nhận: SHA_V103 = commit gộp PR #33 (một commit cho image, gói infra, tag). Mục 0.2 sửa trước khi gộp: ghim mergeCommit, chọn lượt CI theo headSha và kiểm theo job, không push main tới khi lượt đó completed success (release.yml đòi status=success; cancel-in-progress hủy lượt đang chờ duyệt staging) | ARC | Quyền ARC (quy trình phát hành) |`

### 7. Điểm làm tốt

1. OPS tự phát hiện G12, tức sửa mã sau khi đã chốt `SHA_V103` thì gói production thiếu bản sửa. OPS chọn một commit cho cả image, gói và tag, thay vì nới P1. Đúng hướng.
2. Ca test "thiếu `flock`" chạy với `env -i` + `PATH` tối thiểu. Nó kiểm cả "không có lời gọi docker/DB". OPS còn chạy test mới trên script cũ để chứng minh test bắt đúng lỗi. Đây là cách viết test cho chốt an toàn nên theo.
3. Bảng 0.1 ghi rõ nguồn và cách kiểm lại cho từng ô. Vì vậy ARC đối chiếu hết trong vài lệnh.
