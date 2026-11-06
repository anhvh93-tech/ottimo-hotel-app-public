# SEC – Review lại PR #129 r4 (OPS: runbook v1.0.5 r4, ghim lại K13)

Round 5 · bước **Review** (review lại sau khi sửa) · SEC · 07/11/2026

Đối tượng:

| PR | Nhánh | HEAD lúc đọc | Phần chênh so với lần SEC duyệt @ `3861ccc4` | Gốc (merge-base với `main`) | CI lúc đọc |
|---|---|---|---|---|---|
| #129 | `r5-ops-runbook-r3` | **`c394ea45`** | `baa32dd5`: bản sửa của OPS, 5 tệp. `246a6db2`: gộp `main` @ `1caa22f4`. `c394ea45`: một dòng chữ ở K13, ngoài khối đã ghim | `1caa22f4` | Lượt trên `c394ea45` đang chạy. Các job đã xong đều xanh, gồm gitleaks và confidential paths. E2E smoke còn chờ |

Đối chiếu:
- `SEC-on-ops-prs-126-129.md` (bản ghim r3, thẻ 129-01, 129-02, 126-01);
- `DOM-on-pr-99-delta-and-129.md` (thẻ 129-01, 129-02, cách 1 và cách 2);
- `ARC-on-ops-prs-126-129.md` (thẻ 129-01, 129-02, 126-01);
- `OPS-responses.md` @ `c394ea45`;
- migration `0000_foundation.sql` (`app_user`, `user_property_role`, `audit_event`), `0001_rls_grants_entry_functions.sql` (quyền trên `audit_event`), `0011_sales_folio_be_b.sql` (`commission`, `folio_line`, `quote`), `0013_reservations_be_a.sql` (`reservation`);
- `product/infra/postgres/init/02-roles.sh`;
- mã trên `main`: `folio.service.ts` `syncCommission`, `commission-rate.ts` `commissionPctFor`, `users.service.ts` `setRoles`.

Cách kiểm:
- Chỉ dùng `git show`/`git diff` trên các SHA trên. Không checkout nhánh vào bản làm việc chung, không gọi staging hay production.
- Trích khối bằng đúng lệnh `awk` của runbook rồi tính `shasum -a 256` trong scratchpad, ở cả ba commit `baa32dd5`, `246a6db2`, `c394ea45`.
- **Chạy thử câu r4 trên DB dùng một lần:**
  - image `postgres:17-alpine`, cùng tag với `docker-compose.prod.yml`, `--network none`, mật khẩu giả chỉ sống trong container;
  - chạy `02-roles.sh` thật của nhánh, rồi đủ **72 migration** theo `meta/_journal.json`, bằng `ottimo_migrator` sau `SET ROLE ottimo_owner`, như `migrate.ts`;
  - chạy câu bằng đúng 5 câu chốt phiên và chuỗi `PGOPTIONS` của khối `v530-run`;
  - dữ liệu chỉ có một tổ chức và một cơ sở giả, không có dòng hoa hồng hay đơn nào;
  - xóa container và tệp tạm khi xong.
- `git merge-tree` của `c394ea45` với `origin/main` @ `6dbc9c82`: không xung đột. Với head #126 (`695a739c`): cũng không xung đột.
- `main` không đổi 5 tệp của OPS từ `527133e3` tới `6dbc9c82`. Vì vậy bản gộp `246a6db2` không đổi gì trong phần SEC đọc.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, tỷ lệ hay số tiền hoa hồng, số đếm, mã đơn hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #129 | **`c394ea45`** | **DUYỆT** | CI xanh trên đúng `c394ea45`. **K13 được ghim lại** ở mục 1 (`V530_PIN`, khối `v530-run` ở mục 6) |

- Câu (2) của K13: SEC chọn **cách 1** (mục 2).
- 0 Blocker · 0 Major · 0 Minor · 1 Suggestion mới (129-03, không chặn gộp).
- Đóng 3 thẻ của SEC: 129-01, 129-02, 126-01.
- ESC mới: **không**.

---

## 1. Bản ghim

SEC tự trích và tự tính. Cả bốn số trùng số OPS đề xuất, và trùng nhau ở `baa32dd5`, `246a6db2`, `c394ea45`.

| Thứ được ghim | Lấy từ | SHA-256 | Ghi chú |
|---|---|---|---|
| `v530.sql` = khối `v530-check` của runbook | Runbook @ `c394ea45` | `c13c4d68e6971554834691780692ede72286a9ea5b6b84ac23301206c1680d71` | 106 dòng, 7 245 byte, chỉ một khối. Đây là **`V530_PIN`** mới |
| `v530_run.sh` = khối `v530-run` | Runbook @ `c394ea45`, và mục 6 của tệp này | `4f89c2182f7dd0fa34913aa58ea9f9825394e0310e2aa82f91a89ac0626b32ab` | 6 dòng, 866 byte. So với khối r3 `e601cfcd…29f3`, `diff` chỉ ra dòng 3, đúng chỗ SHA của câu. Dòng `ssh … PGOPTIONS … psql` giống hệt |
| `v525_run.sh` = khối `v525-run` | Runbook @ `c394ea45` | `608724131055a136f81689748b323f34844c62e31973dbe4d506378ee41141eb` | Không đổi |
| `v5-25-parameter-shape-check.sql` | `c394ea45` và `origin/main` | `f5db74ac17e7306a1fc718dce5874ab0322cf94daddda48c7d6c47ba53a2243f` | 28 081 byte, không đổi. `SHA_V525` = `897ff46e` vẫn là commit cuối đổi tệp, trên cả nhánh lẫn `main` |

**Bản ghim r3 bỏ:**
- câu `9fda2a80…7e98` và khối `e601cfcd…29f3` trong `SEC-on-ops-prs-126-129.md` mục 2.2, 2.3 không còn dùng;
- nếu trích câu r4 rồi chạy khối r3 (hoặc ngược lại), dòng 3 tự dừng với `SHA-256 mismatch`. Lỗi đi về phía an toàn.

Lúc cắt `SHA_V105`, ORC hoặc OPS điền ô `V530_PIN` ở bảng 0.1 của runbook bằng `c13c4d68…0d71` của tệp này. Sửa chữ ngoài khối `v530-check` không đổi SHA của câu.

---

## 2. Câu (2): SEC chọn cách 1

**Quyết định:** cách 1 của DOM, đúng như OPS viết: so `to_jsonb(rate_pct_snapshot)` với `value -> 'staff'` hoặc `value -> 'collaborator'` ngay trong câu, không ép kiểu, không in. Giả định (d) ở runbook mục 8 **đóng**.

Vì sao SEC cho câu đọc `value`:
- **Không có đường báo lỗi nào nhắc lại giá trị.** Câu chỉ dùng toán tử `jsonb` không bao giờ báo lỗi: `->`, `IS DISTINCT FROM`, `to_jsonb(numeric)`, `jsonb_typeof`. Không có phép ép kiểu nào trên `value` hay `pricing_snapshot`. Các phép ép còn lại đều trên hằng (dòng gác `::boolean`) hoặc trên ngày (`::date`, `::text` của ngày).
- **SEC đã thử trên PG 17:**
  - `->` trên số, mảng, chuỗi, `null` ra `NULL`, không lỗi;
  - `5.00` (`numeric(5,2)`) bằng `5` trong `jsonb`;
  - chuỗi `"5"` hoặc thiếu khóa con thì ra "khác", tức đếm thừa. Thừa là hướng an toàn.
- **Câu chỉ in số đếm.** Phần tách chỉ theo **trạng thái** dòng hoa hồng (đã đạt / còn dự kiến), không theo loại người hưởng hay theo người.
- **Đã có tiền lệ:** câu V5-25 đã ghim cũng đọc `value` mà không in.
- **Cách 2 không an toàn hơn.** Cách 2 không đọc `value`, nhưng in ra cùng loại số. Nó đếm thừa, nên INV phải mở đơn không cần chỉnh. Về tiền, cách 1 đúng hơn.

**Điều kiện của bản ghim:**
- Không thêm phần tách theo loại người hưởng (`staff` / `agent`) hay theo người hưởng.
- Lý do: ít CTV thì một số đếm theo loại gần như là căn cứ hoa hồng của một người.
- Thêm phần tách nào thì câu đổi, SHA đổi, SEC review lại.

**Phần còn lại SEC chấp nhận:** số đếm `= 0` hay `> 0` cho biết hàng mới có khác tỷ lệ trên các đơn hay không. Đó là sự thật "có đổi", không phải tỷ lệ. Repo chỉ ghi `= 0` / `> 0` (mục 3).

### 2.1 Đọc lại câu r4 về bảo mật

- **Chỉ đọc:**
  - câu tự mở `BEGIN TRANSACTION READ ONLY` và kết bằng `ROLLBACK`;
  - không có `SET ROLE`, `set_config`, `COMMIT`, `DO`, lệnh `\` của psql, hay giá trị ghép từ ngoài vào;
  - 5 câu chốt phiên của khối chạy giữ nguyên.
- **In gì:** nhãn hằng, ngày, tên vai, số đếm. `amount_vnd` (`> 0`) và `pricing_snapshot` (chỉ `jsonb_typeof`) được đọc nhưng không in. Câu không đọc cột nào của khách: id đơn chỉ dùng để đếm không trùng, `closer_user_id` chỉ để nối bảng.
- **Cột có thật, có từ v1.0.4.** SEC đối chiếu DDL:
  - `commission` (0011): `payee_type` ∈ {`agent`, `staff`}, `rate_pct_snapshot` `numeric(5,2) NOT NULL`, `status` ∈ {`projected`, `earned`, `payable`, `paid`, `void`};
  - `reservation` (0013): `stay_type`, `parent_reservation_id`, `quote_id`, `pricing_snapshot jsonb NOT NULL`, `closer_user_id`, `status`;
  - `quote.created_at`; `folio_line` (0011): `category` có `cancellation_fee` / `no_show_fee`, `line_state`, `reversal_of_id`, `amount_vnd`;
  - `app_user.status`, `user_property_role`.

  Câu chạy được trên cả v1.0.4 lẫn v1.0.5.
- **Khóa con đúng mã.** `agent` → `collaborator`, `staff` → `staff`, giống `commissionPctFor` trong `commission-rate.ts`.
- **Lượt chạy trên DB dùng một lần**, có `02-roles.sh` thật và 72 migration:
  - không có `property`: thoát mã 3 ngay sau `BEGIN`, câu báo hằng "no property is visible";
  - chạy bằng `role=ottimo_app` (không BYPASSRLS, không tenant): thoát mã 3, câu báo hằng của dòng gác RLS;
  - có một cơ sở giả, chạy bằng `ottimo_readonly`:
    - ra 5 dòng chốt phiên, `BEGIN`, `commission_rows_from_2026_11_01`, ba dòng `closer_bookings_old_rate*` đúng thứ tự, `closer_bookings_cancelled_or_no_show`, `ROLLBACK`, `#END`, mã thoát 0;
    - thứ tự khớp bảng "Đúng là";
    - không có `permission denied`, vì `02-roles.sh` cho `ottimo_readonly` quyền `SELECT` mặc định trên bảng của `ottimo_owner`.
- **Ba số khớp luôn đúng khi dữ liệu đúng:**
  - `commission_status_check` (0011) chỉ có 5 trạng thái, và câu đã loại `void`;
  - vì vậy mỗi đơn được đếm có ít nhất một dòng thuộc một trong hai phần tách, nên `b ≤ a`, `c ≤ a`, `a ≤ b + c`;
  - nếu sau này có trạng thái mới, phép kiểm hỏng và K13 tự dừng: hướng an toàn.
- **Chỗ OPS lệch chữ DOM:** đơn không có tỷ lệ chụp thì ngày chụp là `commission.created_at`.
  - SEC đọc `syncCommission`: mỗi khi người hưởng, tỷ lệ hay cơ sở tính đổi, mã void dòng cũ và chèn dòng mới với `created_at = now`. Tỷ lệ trên dòng đang sống vì vậy là tỷ lệ của ngày tạo dòng đó, nên chỗ lệch khớp mã.
  - Đây là câu hỏi nghiệp vụ: DOM xác nhận. Không có vấn đề bảo mật.

---

## 3. "Ghi gì, ở đâu" và thẻ 129-01: xong

SEC kiểm tại `c394ea45`:
- **Repo** (decision-log, `round-summary.md`):
  - chép nguyên dòng `commission_row` và `commission_rows_from_2026_11_01`;
  - với 4 dòng `closer_bookings_*`, chỉ ghi `= 0` / `> 0` và "ba số khớp: đúng".
- **Số chính xác** chỉ đi một đường: ORC báo INV trong chat với INV. Không vào repo, không vào subagent, không vào chat với vai khác. Kết quả chỉ ở terminal, không chép ra tệp tạm.
- **Không còn số chính xác ở đâu khác:**
  - SEC tìm `m ≤ n`, "ghi `n`, `m`" và mọi dòng `closer_bookings_*|<số>` trong runbook: không còn chỗ nào ghi số;
  - câu đồng ý P5, câu đồng ý lần 2, dòng K của mục 6, dòng mẫu decision-log mục 7 và mục 10 của `report.md` đều chỉ nói "có / không" hoặc `= 0` / `> 0`;
  - phần chạy thử của OPS không còn ghi số đếm.
- **`m ≤ n` đã bỏ** (DOM 129-02), thay bằng ba số khớp `b ≤ a`, `c ≤ a`, `a ≤ b + c`. ORC làm phép kiểm này trên số chính xác ngay ở terminal. Repo chỉ ghi kết quả "ba số khớp: đúng". Không khớp thì dừng K13.
- **K13 áp đủ luật "Thêm" của P2c:**
  - trên 200 dòng thì dừng;
  - `permission denied` thì dừng, không chạy lại bằng vai quản trị;
  - lỗi khác lỗi dòng gác thì chỉ báo **loại** lỗi, không chép câu báo lỗi.

Ghi chú cho ORC (không phải thẻ): khi K13 dừng vì ba số không khớp, ORC báo SEC + OPS **phép kiểm nào hỏng** (ví dụ "`a > b + c`"), không kèm số. Luật "không vào subagent" đã phủ ý này.

Thẻ **FB-R5-SEC-OPS-129-01: Closed.**

---

## 4. README 11.1: khớp mã

- **Cấp vai** (ARC 129-02):
  - câu `INSERT … ON CONFLICT (user_id, property_id, role) DO UPDATE SET revoked_at = NULL, granted_by = EXCLUDED.granted_by, granted_at = EXCLUDED.granted_at` giống hệt nhánh cấp lại của `setRoles` (`users.service.ts`);
  - khóa đích đúng khóa chính `user_property_role_pkey (user_id, property_id, role)` (0000);
  - `granted_at = now()` cả khi cấp lại, nên K13 (b) đọc "vai lúc tạo" đúng;
  - `granted_by` = OWN đã duyệt, không để trống.
- **Bước 4** đúng thẻ 129-02 của SEC:
  - decision-log ghi vai trước, vai sau, chỉ tên vai;
  - dòng `audit_event` `security` `user.roles_changed` chỉ ghi khi ARC xác nhận trong lần review script;
  - các dữ kiện README nêu là đúng: `ottimo_app` có `SELECT, INSERT` trên `audit_event` (0001), bảng chia phân vùng theo `occurred_at` (0000).
- **Vai DB và cách mở giao dịch:** ARC + SEC chốt trong lần review của chính script đó, README không đặt sẵn. Đúng ý SEC.
- Còn một chỗ nhỏ: README chưa nói decision-log nhận diện "người đó" bằng gì. Xem thẻ 129-03.

Thẻ **FB-R5-SEC-OPS-129-02: Closed.**

---

## 5. CODEOWNERS: 3 dòng SEC mới (cổng (b)) đúng

| Dòng | Thẻ | Kiểm |
|---|---|---|
| `/product/infra/server/test/postgres-log-terse.test.sh` | ARC 126-01 | Tệp có trên head. Đây là bằng chứng của SEC-ARC-08 và 93-03; SEC đồng ý |
| `/product/services/api/scripts/*.sh` | SEC 126-01 | Trên head, mẫu này phủ đúng `mfa-operator-reset.sh` và `production-bootstrap.sh`. Không phủ 6 tệp `.mjs` hay 2 tệp `.sql`; hai tệp `.sql` do dòng `scripts/*.sql` của #126 phủ khi #126 gộp |
| `/product/services/api/src/admin/` | SEC 126-01 | Thư mục có 5 tệp, đều là lệnh quản trị chạy trên production: `mfa-operator-reset-cli.ts`, `production-bootstrap-cli.ts`, `production-bootstrap.ts`, `production-defaults.ts`, `known-email-templates-cli.ts`. Để cả thư mục là SEC là đúng |

- **Vị trí:** các dòng nằm cuối tệp. Tệp không có mẫu chung nào phía trên, nên luật "last matching pattern wins" không làm mất dòng nào. Chú thích ghi vai và mã thẻ.
- **Với #126:**
  - gộp cả hai không xung đột: 5 dòng của #126 và 3 dòng của #129 cùng có mặt;
  - head #126 nay là `695a739c` = `d11a2700` + gộp `main`. Hai tệp SEC của #126 (`CODEOWNERS`, `postgres-log-terse.test.sh`) không đổi so với `d11a2700`;
  - nên bản duyệt SEC @ `d11a2700` vẫn dùng được cho cổng (b): head chỉ khác ở tệp không phải SEC.
- **Cổng (b) làm tay:** `*.sh` là mẫu, `src/admin/` là tiền tố thư mục. ORC so theo thư mục + đuôi tệp và theo tiền tố, như với `*.sql`.

Thẻ **FB-R5-SEC-OPS-126-01: Closed.**

---

## 6. Điều kiện chạy K13, lệnh trích và khối đã ghim

**ORC chỉ chạy K13 khi đủ cả 4 điều kiện:**
1. #129 đã gộp `main`, sau khi CI xanh trên `c394ea45`.
2. DOM đã xác nhận câu r4 khớp định nghĩa 129-01 và 129-02 (dòng decision-log), kể cả hai điểm OPS ghi:
   - đơn không có tỷ lệ chụp thì ngày chụp là `commission.created_at`;
   - giả định (e): không đếm `deposit_forfeit`.

   DOM đổi gì thì câu đổi, SHA đổi, SEC ghim lại.
3. Trích bằng lệnh dưới. Chỉ chạy khi **cả 2 dòng `shasum`** trùng bảng ở mục 1.
   - Không dùng lệnh trích của `SEC-on-ops-prs-126-129.md` mục 2.3: lệnh đó ra khối r3 `e601cfcd…` và dừng.
4. Một lần gọi `bash "$W/v530_run.sh"`:
   - không `| tee`, không `>`;
   - không chạy khi `deploy.sh` hoặc migrate đang chạy;
   - xong thì xóa `$W`;
   - ghi kết quả theo mục 3.

Lệnh trích, chạy trên Mac từ thư mục repo. Khi dán vào zsh, không thêm chú thích `#` vào cuối dòng:

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
R=$(git log -1 --format=%H origin/main -- rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md)
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-ops-pr-129-r4.md)
W=$(mktemp -d)
git show "${R}:rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md" \
  | awk '/^-- >>> v530-check$/ {f=1} f {print} /^-- <<< v530-check$/ {f=0}' > "$W/v530.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-ops-pr-129-r4.md" \
  | awk '/^# >>> v530-run$/ {f=1} f {print} /^# <<< v530-run$/ {f=0}' > "$W/v530_run.sh"
cd "$W" && shasum -a 256 v530.sql v530_run.sh
```

Khối `v530-run` trong runbook @ `c394ea45` đã mang đúng SHA của câu r4. Trích khối từ runbook (cùng lệnh `awk`, đổi đường dẫn) cũng ra `4f89c218…32ab`. Nguồn ghim là tệp này.

Khối đã ghim:

```bash
# >>> v530-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 v530.sql | cut -d ' ' -f 1)" = c13c4d68e6971554834691780692ede72286a9ea5b6b84ac23301206c1680d71 || { echo 'v530.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat v530.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< v530-run
```

---

## 7. Thẻ

| Thẻ | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R5-SEC-OPS-129-01 | Minor | **Closed** | Mục 3 |
| FB-R5-SEC-OPS-129-02 | Suggestion | **Closed** | Mục 4 |
| FB-R5-SEC-OPS-126-01 | Suggestion | **Closed** | Mục 5. Đi trong #129, không đi trong #126 |
| FB-R5-SEC-BE-V530-01 (phần OPS: bước đếm) | – | **Done, ghim r4** | Thẻ đóng hẳn khi ORC ghi lần chạy K13 đầu tiên theo mục 3 |
| Giả định K13 (a), (b) | – | Vẫn đồng ý | Câu (1) không đổi |
| Giả định K13 (d) | – | **Đóng: cách 1** | Mục 2 |
| Giả định K13 (c), (e); DOM 129-01, 129-02 | – | Của DOM | SEC không có ý kiến bảo mật. DOM xác nhận là điều kiện 2 ở mục 6 |
| ARC 129-01 (`git -C`), 129-02, 126-01 | – | Của ARC | SEC đã đọc. Hai lệnh `git -C` chỉ đọc; khối `v525-run` không đổi; luật đọc dòng `fatal:` tránh được `KHAC`/`THIEU` giả. Không có ý kiến bảo mật |
| FB-R5-SEC-OPS-129-03 | Suggestion | **Open (mới)** | Dưới đây |

#### FB-R5-SEC-OPS-129-03
- Mức độ: Suggestion (không chặn gộp)
- Người nhận: OPS (README 11.1); ARC + SEC trong lần review script một lần
- Vị trí: `product/infra/server/README.md` mục 11.1, bước 4 ("vai trước, vai sau của người đó. Chỉ ghi tên vai…")
- Vấn đề: README nói chỉ ghi tên vai, nhưng không nói decision-log nhận diện "người đó" bằng gì. Repo là công khai. Ghi tên, username, email hay số điện thoại của một nhân viên cạnh một sự cố bảo mật là đưa dữ liệu cá nhân vào repo công khai. Username thường là tên người.
- Vì sao quan trọng: dòng decision-log nằm mãi trong lịch sử git (Nghị định 13/2023: dữ liệu cá nhân của nhân viên).
- Đề xuất sửa: thêm một gạch ở bước 4:
  - nhận diện người đó bằng vai cộng **8 ký tự cuối** của `app_user.id`, hoặc một nhãn nội bộ (ví dụ "OWN thứ 2");
  - không ghi tên, username, email hay số điện thoại;
  - chi tiết đầy đủ chỉ nói với INV trong chat.

  Làm ở lần sửa README sau, hoặc ngay trong lần review script một lần, cái nào tới trước. Không chặn #129.
- Trạng thái: Open

---

## 8. Giới hạn

- SEC không nạp dữ liệu hoa hồng hay đơn vào DB thử. Đếm đúng từng ca là phần lượt chạy thử của OPS (bảng ca trong K13) và DOM xác nhận. SEC chỉ kiểm cú pháp, cột, quyền, dòng gác, thứ tự dòng và các đường báo lỗi.
- SEC chỉ đọc phần chênh r4 của runbook:
  - đoạn r4 ở đầu tệp; bảng 0.1 `V530_PIN`; câu P5 ở 0.2;
  - P2c bước 2; K13;
  - dòng K của mục 6, mẫu mục 7, giả định mục 8.

  Ngoài runbook, SEC đọc README 11.1, `CODEOWNERS`, `OPS-responses.md` và mục 10 của `report.md`. Phần `main` gộp vào ở `246a6db2` (75 tệp) đã review ở các PR riêng.
- SEC không approve hay comment trên GitHub. ORC gộp.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review lại PR #129 r4 @ c394ea45: DUYỆT; K13 ghim lại.** V530_PIN = c13c4d68…0d71 (v530.sql, 106 dòng), khối v530-run 4f89c218…32ab (khác khối r3 chỉ ở SHA dòng 3); bản ghim r3 9fda2a80…7e98 / e601cfcd…29f3 bỏ. v525-run 60872413…41eb và v525.sql f5db74ac…243f (SHA_V525 897ff46e) không đổi. Câu (2) dùng cách 1: so jsonb trong câu, không ép kiểu, không in, chỉ tách theo trạng thái dòng hoa hồng, không tách theo loại người hưởng. Chạy thử trên DB dùng một lần (02-roles.sh + 72 migration): dòng gác dừng đúng, thứ tự dòng đúng, không permission denied. Repo chỉ ghi closer_bookings_* = 0 / > 0 và "ba số khớp" (b ≤ a, c ≤ a, a ≤ b + c); số chính xác ORC chỉ báo INV trong chat. README 11.1 khớp setRoles; 3 dòng CODEOWNERS SEC đúng; #126 @ 695a739c chỉ gộp main, bản duyệt @ d11a2700 vẫn dùng được. Đóng 129-01, 129-02, 126-01; mới 129-03 (Suggestion: decision-log không ghi tên người đổi vai). K13 chỉ chạy sau khi #129 gộp, DOM xác nhận câu r4, trích bằng lệnh mục 6 | SEC | rounds/round-05/reviews/SEC-on-ops-pr-129-r4.md |`
