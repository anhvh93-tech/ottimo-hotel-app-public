# ARC review PR #149 (BE-H) – che hoa hồng trong audit (T18): cổng `audit/public/audit-visibility.ts`

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#149](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/149), nhánh `r5-audit-visibility`, HEAD **`91907134`**, `base = main`, không phải draft. 8 tệp, +562/−12: 6 tệp `src`, 2 tệp test. Không migration, không sửa `openapi.yaml` hay tệp sinh.
- Việc của PR:
  - ARC FB-R5-ARC-BE-131-01 (Major) và SEC FB-R5-SEC-BE-131-01, cả hai ở `ARC-on-be-h-prs-110-123-131.md` mục 4.1;
  - phần chú thích của ARC FB-R5-ARC-BE-110-01 (Minor).
  - Plan 4a ghi PR này là dòng T18, phải lên `main` trước tag v1.0.5.
- Đối chiếu với:
  - `architecture.md` mục 5.1, đoạn "Đọc `audit_event` – hai cổng của module `audit`", trong PR #147 @ `0943db43` (bổ sung 1h, chưa gộp);
  - `contract-0.3.13.md` bổ sung 1h, mục (a) và (b) trong #147;
  - review cũ của ARC: mục 2.6 (probe), 4.1 (chỗ đặt), thẻ 110-01, 131-01.
- Cách kiểm:
  - Đọc mã trên ref riêng `refs/remotes/arc/pr149`, trong hai worktree ở scratchpad (`arc-149-wt` để chạy đủ, `arc-149-mut` để thử đột biến). Không checkout trong thư mục chính, không push vào nhánh PR.
  - PostgreSQL 17 riêng: container `arc-149-pg`, cùng image CI, chỉ nghe `127.0.0.1:55617`, mật khẩu là mật khẩu CI công khai của repo. Có thêm một database `arc_perf` riêng để đo hiệu năng (mục 6), dữ liệu tổng hợp hoàn toàn. Đã xóa container và cả hai worktree sau review.
  - Không gọi staging hay production. Tệp này không có bí mật, IP máy chủ, tỷ lệ hay số tiền hoa hồng thật, dữ liệu khách.
- CI của #149 lúc viết: 7 job xanh (gitleaks, OpenAPI lint, contract RBAC `--strict`, confidential paths, shellcheck, landing, no test endpoints). Job `format · lint · audit · test · build` còn đang chạy.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện | Thẻ ARC mới |
|---|---|---|---|
| **#149 @ `91907134`** | **DUYỆT** | Không. Gộp trước khi cắt tag v1.0.5, như plan 4a T18 | 149-01 (Minor), 149-02 (Suggestion, lỗi có từ trước #149) |

- Cổng đúng thiết kế ở 5.1. Cả hai đường đọc đều đi qua cổng, ranh giới module đúng, và mỗi đột biến ARC thử đều làm test đỏ (11/11).
- `tsc` sạch. Toàn bộ API trên PostgreSQL thật: **209 tệp (207 qua, 2 tự bỏ qua), 5030 ca qua, 0 hỏng**. Khớp số BE-H báo.
- Khi #149 gộp, ARC đóng **FB-R5-ARC-BE-131-01** và H1-01. Phần BE-H của **110-01** (chú thích) đã xong. Câu hợp đồng của 110-01 nằm trong #147 mục (a).
- Hai thẻ mới không chặn gộp:
  - 149-01: test quét còn hở với vài cách viết SQL mà repo chưa dùng, và ngoại lệ đang miễn cả tệp. Sửa ở `r5-h1c`;
  - 149-02: `getReservationHistory` quét mọi phân vùng audit. Lỗi này có từ Round 2, #149 không làm chậm thêm. Đưa vào B-KYTHUAT v1.0.6.
- Phần quyền thuộc SEC. ARC không lặp lại ở đây.

---

## 1. Ranh giới module: folio khai báo, audit thực thi

| Kiểm | Kết quả |
|---|---|
| `audit/public/audit-visibility.ts` có import gì | Không import gì cả. Không biết đến `commission` hay `commissionVnd` |
| Module `audit` có import `folio` không | Không. `grep` trong `src/modules/audit` không thấy `folio`. `line-reductions.ts` vẫn giữ luật "audit never imports folio" |
| Ai khai báo | `folio/audit-entities.ts` gọi `defineManagerOnlyAudit({ entityTypes: ['commission'], fields: ['commissionVnd'] })`, ngay cạnh các `defineAuditEntity` của chính nó |
| Hướng import | `folio` → `audit/public`, `reservations/internal` → `audit/public`. Cả hai đều qua `public`. `module-boundaries.test.ts` xanh trong lần chạy đủ |
| Tiến trình nào nạp khai báo | api nạp qua `folio.module.ts`; worker và CLI nạp qua `src/audit-entities.ts`. Đột biến M7 (bỏ dòng khai báo) làm đỏ 4 ca, trong đó có ca tích hợp dựng app thật. Vậy tiến trình api có nạp khai báo |
| Có mã hoa hồng nào ghi audit với loại khác `commission` không | Không. Cả 7 chỗ ghi `commission.*` (`foc.service.ts:299`; `folio.service.ts` 1586, 1626, 3943, 4097, 4126) đều ghi `entityType: 'commission'`. Khóa `commissionVnd` chỉ có trong allowlist `folio`. `channel_fee.ratePct` là phí kênh OTA, FD vẫn được xem như ở `listChannels`, nên không thuộc diện che |
| `reservation_change` (phần thứ hai của lịch sử) | Chỉ ghi các trường số khách, giờ đến, ngày, phòng và `closer_user_id`. Không có số tiền hay tỷ lệ hoa hồng, nên không cần cổng |

Mô hình ở đây giống `defineAuditEntity`: module chủ dữ liệu khai báo, module `audit` thực thi. PR-M chỉ cần thêm khóa thưởng vào chính dòng khai báo này (xem mục 9).

## 2. Đối chiếu với `architecture.md` 5.1

| 5.1 (#147) | #149 | Kết luận |
|---|---|---|
| `defineManagerOnlyAudit({ entityTypes?, fields? })` | Đúng chữ ký. Hai `Set` toàn tiến trình, khai báo lúc import, không import Nest | Khớp |
| `auditVisibleWhere(alias, ph, roles)`: mệnh đề loại các `entity_type` hạn chế, rỗng với OWN/MGR | Trả `COALESCE(e.entity_type, '') <> ALL($n::text[])`. Rỗng khi người gọi có OWN/MGR, hoặc khi chưa có gì được khai báo | Khớp. `COALESCE` cần thiết: không có nó thì bản ghi không có `entity_type` bị loại nhầm (`NULL <> ALL` cho ra NULL). Đột biến M9 đỏ |
| `redactAuditFields(value, roles)` | `redactAuditFields(entityType, value, roles)`, tức thêm tham số đầu. Bản ghi thuộc loại hạn chế lọt qua mệnh đề thì trả `null` cho cả `before` và `after` | **Lệch có lợi**: thêm một lớp chặn ở mức bản ghi (M8 đỏ). ARC sửa câu 5.1 trong #147 cho khớp chữ ký 3 tham số, BE-H không phải làm gì |
| Luật: mọi nơi đọc trả cho người không có OWN/MGR dùng **cả hai** hàm | `listAuditEvents` dùng 1 lần `auditVisibleWhere` và 2 lần `redactAuditFields`. `history` cũng vậy | Khớp |
| Test quét `FROM audit_event`, ngoại lệ có lý do | Có, với 3 ngoại lệ đúng danh sách 5.1. Quét cả `JOIN` | Khớp. Hở ở mục 3 |
| Lọc lúc đọc, không migration | Đúng | Khớp |

Ở `listAuditEvents`, mệnh đề được đặt **trong SQL, trước `LIMIT`/con trỏ**. Vì vậy trang của FD không bị thiếu dòng hay rỗng giữa chừng. Ca tích hợp đọc theo con trỏ (`limit=100`, theo `nextCursor`) tới trang cuối.

Ghi chú nhỏ, không thành thẻ: `audit-log.controller.ts:163` vẫn tự tính `full = roles.includes('owner') || roles.includes('manager')` thay vì gọi `seesFullAudit(p.roles)`. Hai chỗ đang cùng một luật. Nếu một ngày có thêm vai đọc đủ, hai chỗ có thể lệch nhau. Gộp vào thẻ 149-01, điểm (c).

## 3. Test quét: có bắt được đường đọc lách cổng không

ARC thêm từng đường đọc tạm vào worktree `arc-149-mut`, chạy `test/audit-visibility-gate.test.ts`, rồi trả mã về.

| # | Đường đọc tạm | Kết quả | Ghi chú |
|---|---|---|---|
| S1 | Tệp mới `sales/internal/zz-probe-reader.ts`, `FROM audit_event e`, không qua cổng | **Đỏ** | Đúng mục đích |
| S2 | Tệp mới, qua cổng đủ (1 `auditVisibleWhere`, 2 `redactAuditFields`) | **Đỏ** | Danh sách người đọc là danh sách đóng, nên mọi nơi đọc mới đều phải qua review và sửa test. Đúng ý 5.1 |
| S3 | Thêm một lần đọc thứ hai, không qua cổng, trong `rack.service.ts` | **Đỏ** | Test đếm số lần gọi helper so với số lần đọc |
| S9 | Bỏ mệnh đề ở `listAuditEvents` (giống M1) | **Đỏ** | |
| S10 | Bỏ che `after` ở `history` (giống M4) | **Đỏ** | |
| S4 | Thêm một lần đọc theo `entity_code`, không qua cổng, trong tệp ngoại lệ `work-orders.service.ts` | Xanh | **Hở**: ngoại lệ đang miễn cả tệp |
| S5 | `FROM app_user u, audit_event e` (nối bằng dấu phẩy) | Xanh | **Hở**: regex chỉ nhận `FROM`/`JOIN` đứng ngay trước tên bảng |
| S6 | `FROM ONLY audit_event e` | Xanh | Hở |
| S7 | `FROM "audit_event" e` | Xanh | Hở |
| S8 | `FROM public.audit_event e` | Xanh | Hở |

- Năm cách viết S4–S8 **chưa xuất hiện ở đâu trong `src`**. Repo chỉ dùng SQL thô dạng `FROM x e LEFT JOIN`, không nối bằng dấu phẩy, không dùng bộ dựng truy vấn Drizzle để đọc. Vì vậy hôm nay không có lỗ nào bị lợi dụng, và thẻ chỉ ở mức Minor.
- Đọc thẳng một phân vùng (`audit_event_p202611`) thì không cần quét: migration 0001 `REVOKE ALL` phân vùng khỏi `ottimo_app`, nên database tự chặn.
- Ba ngoại lệ đều hợp lý:
  - `work-orders.service.ts:196`: `WHERE e.entity_type = 'work_order' AND e.entity_id = $1`. Không bao giờ ra bản ghi `commission`;
  - `auth.service.ts:362`: `SELECT 1 … action = 'mfa.verify_failed'`. Không trả gì cho người gọi;
  - `line-reductions.ts` `countLineReductionsByActor`: chỉ trả `{ actorUserId, n }` của `folio_line.adjusted`. Hàm `lineReductionWhere` cùng tệp chạy bên trong `listAuditEvents`, nơi đã qua cổng.
- Regex thay thế ARC đã thử trên `src` hiện tại (thẻ 149-01): `/(?:\bFROM|\bJOIN|,)\s+(?:ONLY\s+)?(?:\w+\.)?"?audit_event\b/gi`, sau khi bỏ chú thích `//` và `/* */`.
  - Regex này bắt cả S5–S8.
  - Trên `src` hiện tại nó cho đúng 5 tệp như cũ, nếu bỏ chú thích trước. Không bỏ thì chú thích ở `parameter.service.ts:8` ("changed), audit_event category") khớp nhầm.

## 4. Thử đột biến (mỗi lần sửa một chỗ, chạy 2 tệp test của PR, rồi trả mã về)

Đường cơ sở: 7/7 ca qua.

| # | Đột biến | Kết quả | Ca bắt được |
|---|---|---|---|
| M1 | `listAuditEvents`: bỏ `auditVisibleWhere` | **2 đỏ** | quét + tích hợp FD/FDL |
| M2 | `listAuditEvents`: `after` không che | **2 đỏ** | quét + tích hợp |
| M3 | `history`: bỏ mệnh đề SQL | **1 đỏ** | tích hợp (bản ghi `commission.*` hiện ra, dù `before`/`after` đã thành `null`) |
| M4 | `history`: `after` không che | **2 đỏ** | quét + tích hợp |
| M5 | `redactAuditFields` không bỏ khóa nào | **3 đỏ** | đơn vị + 2 tích hợp |
| M6 | `FULL_AUDIT_ROLES` thêm `front_desk_lead` | **3 đỏ** | đơn vị + 2 tích hợp |
| M7 | `folio/audit-entities.ts` bỏ `defineManagerOnlyAudit` | **4 đỏ** | khai báo + đơn vị + 2 tích hợp |
| M8 | Bỏ lớp `null` cho bản ghi thuộc loại hạn chế | **1 đỏ** | đơn vị |
| M9 | Bỏ `COALESCE` trong mệnh đề | **1 đỏ** | đơn vị (so đúng chuỗi mệnh đề) |
| M10 | `history`: `before` không che | **1 đỏ** | quét (đếm `redactAuditFields`) |
| M11 | Che luôn cả với OWN/MGR (che quá tay) | **1 đỏ** | tích hợp MGR/OWN |

11/11 đỏ, gồm cả M1–M4 BE-H đã báo. M9 và M10 chỉ có test đơn vị hoặc test quét bắt. Mức đó đủ, vì hai điểm này là hình dạng mã, không phải hành vi riêng.

## 5. ARC 110-01: chú thích

Câu ARC đề xuất: "cùng mệnh đề; khung khác ở 00:00–05:59 ngày 1 và ở bản ghi không có `actorRole`".

| Chỗ | Chú thích mới | Kết luận |
|---|---|---|
| `audit/public/line-reductions.ts` dòng 1–7 | "ONE definition … use the same clauses. Their WINDOWS differ: the count takes the business month (from 06:00 of day 1) and the role at the time …, the list behind `month=` takes calendar days and the person only – so they can differ for reductions made 00:00–05:59 on day 1, for rows without `actorRole` (written before v1.0.5) and for a person whose role changed within the month." | **Khớp**, đủ cả 3 nguồn lệch ở mục "Vấn đề" của thẻ. "Can never disagree" đã bỏ |
| `reporting/internal/attention-sources.ts` (d), dòng 34 và 203 | Cùng ý: "SAME clauses …, but NOT the same window", có trỏ về (d) | Khớp |
| `audit-log.controller.ts` cạnh `lineReductionWhere` | "the window here is calendar days, the count's is the business month" | Khớp |

Phần ARC (câu hợp đồng) ở #147 mục (a), cùng ý. Phần QA (oracle BR-438-04) vẫn mở, không thuộc PR này. Thẻ 110-01 chuyển **Done** cho điểm 1 khi #149 gộp, và cho điểm 2 khi #147 gộp.

## 6. Hiệu năng `getReservationHistory`

Đo trên `arc_perf`, dữ liệu tổng hợp: 600 000 dòng `audit_event` của một cơ sở, rải đều 14 tháng (15 phân vùng), 4000 mã đơn, mỗi đơn 150 dòng, 1/6 là `commission`. Chạy bằng vai `ottimo_app` với RLS thật, truy vấn y hệt mã, mỗi phương án đo hai lần.

| Phương án | Kế hoạch | Thời gian chạy |
|---|---|---|
| Trước #149 (mọi vai hôm nay) | Parallel Seq Scan cả 15 phân vùng | 54,5 ms / 47,8 ms (150 dòng) |
| Sau #149, FD/FDL (có mệnh đề cổng) | **Cùng kế hoạch**. Mệnh đề chỉ là bộ lọc thêm | 41,8 ms / 36,1 ms (125 dòng) |
| Thử thêm chỉ mục `(property_id, entity_code)`, chỉ trên `arc_perf` | BitmapOr của `audit_event_entity_idx` và chỉ mục mới trên từng phân vùng | **0,7 ms** |

- **#149 không tạo bẫy hiệu năng**:
  - mệnh đề không đổi kế hoạch, không làm mất chỉ mục;
  - `redactAuditFields` chỉ duyệt khóa của từng dòng, chi phí O(số khóa);
  - với OWN/MGR, câu SQL giống hệt trước.
  - Thứ tự tham số đúng: `$4` được thêm vào sau 3 tham số cố định, trước khi chạy truy vấn. `AND (A OR B)` vẫn nằm trong ngoặc, nên mệnh đề cổng không lọt vào nhánh `OR`.
- **Có một bẫy từ trước** (thẻ 149-02):
  - `entity_code` không có chỉ mục, và truy vấn lịch sử không giới hạn thời gian. Vì vậy mỗi lần mở lịch sử một đơn là một lần quét toàn bộ audit của cơ sở, qua mọi phân vùng;
  - thời gian tăng theo tổng số dòng audit, không theo số dòng của đơn;
  - 600 000 dòng mất khoảng 50 ms, nên vài triệu dòng sẽ chạm ngân sách p95 300 ms;
  - truy vấn này có từ `cf6c5575` (16/10, Round 2).

## 7. Vitest, tsc, lint trên cây PR

| Lệnh (trên `arc-149-wt` @ `91907134`, PostgreSQL 17 thật) | Kết quả |
|---|---|
| `pnpm --filter @ottimo/api typecheck` (`tsc --noEmit`) | Sạch |
| `vitest run` toàn bộ API | **Test Files 207 passed, 2 skipped (209); Tests 5030 passed, 19 skipped, 1 todo (5064)**, 148,7 s |
| `eslint` trên 8 tệp của PR | Sạch |
| `git merge-tree origin/main arc/pr149` (`main` @ `ec4bcbe2`) | Không xung đột. Từ `68c7ebb7` tới `ec4bcbe2`, `main` chỉ đổi `packages/api-client` và `packages/ui` CSS, không chạm `services/api`. Kết quả API ở trên vẫn đúng với `main` hiện tại |

## 8. Thẻ feedback ARC

### FB-R5-ARC-BE-149-01
- Mức độ: **Minor** (không chặn gộp #149; làm trong `r5-h1c`)
- Người sửa: BE-H
- Vị trí:
  - `product/services/api/test/audit-visibility-gate.test.ts` (`READ`, `EXCEPTIONS`, cách đếm);
  - `audit/internal/audit-log.controller.ts:163` (`full`).
- Vấn đề:
  - (a) Regex `\b(?:FROM|JOIN)\s+audit_event\b` không bắt 4 cách viết SQL hợp lệ: nối bằng dấu phẩy, `FROM ONLY`, tên bảng trong ngoặc kép, tên có schema (`public.audit_event`). ARC đã thử: S5–S8 ở mục 3 đều xanh.
  - (b) Ngoại lệ đang miễn **cả tệp**. Thêm một lần đọc theo `entity_code`, không qua cổng, vào `work-orders.service.ts` thì test vẫn xanh (S4).
  - (c) Luật "ai đọc đủ" đang có ở hai chỗ: `seesFullAudit` và `full` tự tính trong controller.
- Vì sao quan trọng: 5.1 hứa rằng nơi đọc thứ ba (PR-M, báo cáo ca v1.0.6) không thể lọt lưới. Hôm nay repo chưa dùng các cách viết trên, nhưng người viết sau sẽ tin vào lưới này.
- Đề xuất sửa:
  1. Bỏ chú thích `//` và `/* */` trước khi quét. Đổi `READ` thành `/(?:\bFROM|\bJOIN|,)\s+(?:ONLY\s+)?(?:\w+\.)?"?audit_event\b/gi`. ARC đã thử: sau khi bỏ chú thích, regex này cho đúng 5 tệp như cũ.
  2. Đổi `EXCEPTIONS` thành `{ reason, reads }`, với `reads` là số lần đọc hiện có (1 cho mỗi tệp). Tệp ngoại lệ có nhiều lần đọc hơn thì đỏ.
  3. Controller dùng `const full = seesFullAudit(p.roles)`.
  4. Thêm vào test quét ba ca đơn vị nhỏ, chạy regex trên chuỗi mẫu S5–S8, để regex không bị nới lại về sau.
- Trạng thái: Open

### FB-R5-ARC-BE-149-02
- Mức độ: **Suggestion** (có từ Round 2, không do #149; đưa vào B-KYTHUAT v1.0.6)
- Người sửa: BE-H (migration), OPS (chạy trên production), ARC (cập nhật `erd.md` 4.3)
- Vị trí:
  - `reservations/internal/rack.service.ts` `history`, truy vấn `audit_event`;
  - `db/schema/audit.ts` (chưa có chỉ mục theo `entity_code`).
- Vấn đề: `WHERE property_id = $1 AND ((entity_type = 'reservation' AND entity_id = $2) OR entity_code = $3)` không dùng được chỉ mục, vì nhánh `entity_code` không có chỉ mục, và truy vấn không có cận thời gian để cắt bớt phân vùng. Kết quả là quét toàn bộ audit của cơ sở. Số đo ở mục 6: khoảng 50 ms với 600 000 dòng, và tăng tuyến tính.
- Vì sao quan trọng: lễ tân mở lịch sử đơn nhiều lần mỗi ca. Audit chỉ tăng, không bao giờ xóa (append-only), nên đường này sẽ vượt ngân sách p95 300 ms trước mọi đường đọc khác. Lúc đó không có cảnh báo nào báo trước.
- Đề xuất sửa:
  - migration thêm chỉ mục `audit_event_property_entity_code_idx` trên `(property_id, entity_code)`. Thử trên `arc_perf` cho 0,7 ms;
  - bảng có phân vùng, nên trên production tạo theo cách không khóa bảng: `CREATE INDEX … ON ONLY audit_event`, rồi `CREATE INDEX CONCURRENTLY` trên từng phân vùng, rồi `ATTACH PARTITION`. J16 tự áp chỉ mục cho phân vùng tháng mới;
  - không đổi truy vấn, không đổi hợp đồng.
- Trạng thái: Open

## 9. Ghi chú cho ORC, PR-M và các review sau

- **ARC tự sửa trong #147:** câu `redactAuditFields(value, roles)` ở 5.1 đổi thành `redactAuditFields(entityType, value, roles)`, kèm ý "trả `null` cho bản ghi thuộc loại hạn chế". Không ảnh hưởng BE-H.
- **PR-M (khóa thưởng):** `fields` hiện áp cho **mọi** loại bản ghi, không riêng `folio`.
  - Khai một tên chung như `amountVnd` thì tên đó bị bỏ khỏi `folio_line`, `payment`… với FD/FDL. Khóa thưởng phải có tên riêng (ví dụ `bonusVnd`).
  - Nếu cần che một tên chung chỉ trong một loại bản ghi, thì lúc đó mới đổi `fields` thành dạng `{ [entityType]: string[] }`. ARC xem.
- **Đóng thẻ khi #149 gộp:**
  - ARC FB-R5-ARC-BE-131-01 → Done; ARC H1-01 → Done;
  - ARC FB-R5-ARC-BE-110-01: điểm 1 Done, điểm 2 Done khi #147 gộp, điểm 3 (QA) còn mở.
  - SEC 131-01 và V530-02 do SEC đóng.
- **Thứ tự gộp:** #149 không phụ thuộc #147, vì #149 không đổi tệp sinh nào. Gộp được ngay khi job `format · lint · audit · test · build` xanh và SEC duyệt.

## 10. Điểm làm tốt

- Đúng chỗ đặt ARC đề xuất:
  - module chủ khai báo, `audit` không biết gì về hoa hồng;
  - một cổng dùng chung cho cả hai đường đọc, nên đóng được đường lộ thứ hai (mục 2.6 review cũ) chứ không chỉ đường SEC nêu.
- Ca tích hợp kiểm trước rằng bản ghi hoa hồng **có thật trong bảng**, dưới tên FD/FDL, rồi mới kiểm FD/FDL không thấy. Nhờ vậy test không thể xanh vì bảng rỗng. Ca này còn đọc theo con trỏ tới trang cuối, và gọi thẳng `action=commission.*` theo tên.
- Thêm lớp `null` ở mức bản ghi trong `redactAuditFields` và `COALESCE` cho bản ghi không có loại. Cả hai là chi tiết nhỏ, dễ quên, và đều có test bắt (M8, M9).

## 11. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC duyệt BE-H #149 @ `91907134` (T18, che hoa hồng trong audit): cổng `audit/public/audit-visibility.ts` do `folio` khai báo, `audit` thực thi, không import ngược; dùng ở `listAuditEvents` và `getReservationHistory`; 11/11 đột biến đỏ; `tsc` sạch, API 209 tệp / 5030 ca xanh trên PostgreSQL 17. Đóng ARC 131-01, H1-01 khi gộp. Thẻ mới 149-01 Minor (test quét: regex rộng hơn, ngoại lệ theo số lần đọc, `seesFullAudit` ở controller; làm ở `r5-h1c`), 149-02 Suggestion (chỉ mục `(property_id, entity_code)` cho lịch sử đơn, có từ R2, B-KYTHUAT v1.0.6). ARC sửa chữ ký `redactAuditFields` ở 5.1 trong #147 | ARC | rounds/round-05/reviews/ARC-on-be-h-pr-149.md |
