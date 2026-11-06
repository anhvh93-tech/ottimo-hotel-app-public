# SEC – Review PR #149 (BE-H, cổng `audit-visibility`: che hoa hồng trong nhật ký, SEC 131-01)

Round 5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Gốc | Phần của PR | CI lúc đọc |
|---|---|---|---|---|---|
| #149 | `r5-audit-visibility` | **`91907134`** | `main` @ `68c7ebb7` | Commit riêng `82112ba5` (8 tệp: 6 `src`, 2 test). `91907134` chỉ gộp `main`; `git show --remerge-diff` rỗng | 8/9 job xanh (gồm `format · lint · audit · test · build`, gitleaks, confidential paths). **E2E smoke còn chạy** |

Đối chiếu:
- `SEC-on-be-h-prs-110-131.md` mục 2.3–2.5 và thẻ FB-R5-SEC-BE-131-01;
- thiết kế `architecture.md` 5.1 và 0.3.14 (b) của hợp đồng 1h (`SEC-on-contract-0313-addenda-1g-1h.md` mục 2.5);
- `rbac-matrix.md` (S27, A60, bảng dữ liệu kinh doanh nhạy cảm), `rbac-cases.csv`;
- G3 (`rounds/round-04/reviews/SEC-on-commission-numbers.md` mục G3; plan V5-30: không ghi tỷ lệ hay số tiền hoa hồng vào repo, PR, test).
- ARC review cùng PR (`ARC-on-be-h-pr-149.md`): đọc **sau** khi SEC tự kiểm và chạy đột biến xong, để không lặp thẻ.

Cách kiểm:
- Đọc diff `68c7ebb7..91907134` trong worktree tạm ở scratchpad (lấy `refs/pull/149/head`). Không checkout vào bản làm việc chung, không gọi staging hay production.
- Tìm mọi nơi đọc `audit_event` trong `src` và migration, mọi bản ghi audit có dữ liệu hoa hồng (`commission.*`, khóa trong các allowlist).
- **Chạy toàn bộ API Vitest** trên cây của PR, với PostgreSQL 17 trong container tạm `sec-149-pg`. Container chỉ dùng cho lần chạy này: vai DB tạo bằng `infra/postgres/init/02-roles.sh`, migrate bằng `ottimo_migrator`, test chạy bằng `ottimo_app`, như CI. Đã xóa sau khi xong.
- 6 đột biến của SEC, mỗi lần chạy lại 2 tệp test của PR rồi trả mã về như cũ (mục 2.3).
- Tệp này không có bí mật, mật khẩu, dữ liệu khách hay số tỷ lệ/tiền hoa hồng. Thẻ 149-01 cố ý **không** chép lại giá trị đang có trong test.

---

## 0. Kết luận: **DUYỆT CÓ ĐIỀU KIỆN** @ `91907134`

Phần mã đóng được 131-01 trên cả hai đường đọc, đúng thiết kế 5.1. Gộp khi đủ hai điều kiện:
1. **FB-R5-SEC-BE-149-01 (Major) xong:** đổi giá trị tỷ lệ và số tiền hoa hồng viết thẳng trong test đơn vị thành tham số thử có tên (G3), và sửa câu tương ứng trong mô tả PR. Chỉ đổi test và chữ; SEC đọc lại phần chênh.
2. CI xanh hết trên đúng SHA cuối, gồm E2E smoke.

| Thẻ | Mức | Trạng thái mới |
|---|---|---|
| FB-R5-SEC-BE-131-01 | Major | **Done khi #149 gộp** (mục 1) |
| FB-R5-SEC-BE-V530-02 | – | Đóng cùng 131-01. Điều kiện còn lại của thẻ này chính là 131-01 |
| FB-R5-SEC-BE-149-01 | **Major** | Open – mới |

0 Blocker · 1 Major · 0 Minor · 0 Suggestion mới. SEC **đồng ý** FB-R5-ARC-BE-149-01 (Minor, lưới quét) và thêm bằng chứng ở mục 2.3. FB-R5-ARC-BE-149-02 (chỉ mục `entity_code`) không có ý bảo mật. ESC mới: **không**.

Nếu nhánh có thêm commit thì SEC đọc lại phần chênh khi commit đó chạm: `audit-visibility.ts`, `folio/audit-entities.ts`, `audit-log.controller.ts`, `rack.service.ts` `history()`, hai tệp test. Commit chỉ gộp `main` mà không chạm các tệp đó thì không cần đọc lại.

---

## 1. Bảng kiểm theo yêu cầu ORC

### 1.1 Các khóa hoa hồng có bị che hết không (`ratePct`, `baseVnd`, `amountVnd`, `commissionVnd`)

| Nơi có số hoa hồng trong audit | Khóa | Cách #149 che | Kết quả |
|---|---|---|---|
| `commission.projected`, `commission.earned`, `commission.voided` (6 chỗ ghi, đều `entityType = 'commission'`) | `ratePct`, `baseVnd`, `amountVnd`, `status`, `payeeType`, `voidReason` | Bỏ **cả dòng** bằng mệnh đề SQL `COALESCE(e.entity_type, '') <> ALL($n::text[])`. Nếu dòng nào lọt qua mệnh đề, `redactAuditFields` vẫn trả `null` cho `before`/`after` | **Đạt.** Ba khóa thẻ 131-01 nêu nằm trong các dòng này, nên bị che theo dòng |
| `folio.line_posted`, `folio.line_reversed` (đồng bộ đêm) | `commissionVnd` cạnh `roomVnd` | Bỏ khóa `commissionVnd`, giữ dòng và `roomVnd` | **Đạt** |
| `amountVnd`, `baseVnd`, `ratePct` ở thực thể **khác** (`folio_line`, `reservation`, `payment`, `channel_fee`…) | – | Không che, đúng: đó là tiền folio, cọc, phí kênh, không phải hoa hồng của sale/CTV. Che theo tên khóa ở mọi thực thể sẽ làm hỏng Nhật ký tiền của lễ tân | **Đạt** |
| `config_parameter` (OWN lưu bảng tỷ lệ) | `value` | Không che. FD/FDL chỉ đọc bản ghi **của mình** ở `listAuditEvents`; chỉ OWN ghi được khóa tỷ lệ (#131); lịch sử đơn không lấy dòng tham số | **Đạt**, không có đường tới FD/FDL |
| Khóa thưởng của PR-M | – | Chưa có. 5.1 ghi "PR-M thêm khóa thưởng cùng cách" | Xem thẻ SEC 1H-02 ở hợp đồng 1h: thưởng chỉ OWN và chính MGR đó, cổng hiện chỉ có một mức OWN/MGR |

Không còn chỗ ghi audit nào khác mang số hoa hồng: SEC đã tìm mọi `action: 'commission.*'` và mọi khóa có `commission`, `Pct`, `payee`, `bonus` trong 14 tệp `audit-entities.ts`.

### 1.2 Mọi đường theo vai

| Vai | `listAuditEvents` | `getReservationHistory` | Bằng chứng |
|---|---|---|---|
| OWN, MGR | Đầy đủ | Đầy đủ | Integration ca 4: thấy `commission.projected`/`earned` có `ratePct`, `baseVnd`, `amountVnd` và khóa `commissionVnd`. Đúng A60 |
| FDL | Dòng của mình, **không** hoa hồng | Mọi dòng của đơn, **không** hoa hồng | Integration ca 2, 3: FDL làm cả lượt ở (tạo đơn của sale, thu, nhận phòng, B18). Lọc trước khi phân trang, nên số dòng mỗi trang không lộ gì |
| FD | Như FDL | Như FDL | Như trên, và ca hỏi thẳng `action=commission.projected&action=commission.earned` → rỗng. Lịch sử đơn của **người khác** làm cũng không có hoa hồng |
| FD + SAL (một người hai vai) | Có cổng | Có cổng | `seesFullAudit` chỉ đúng khi có `owner`/`manager`. `rbac-cases.csv`: `qa.fdsal` vào được cả hai operation |
| SAL, CTV, HK, MT | 403 ở guard | 403 ở guard | `x-roles` của cả hai operation chỉ OWN/MGR/FDL/FD; `rbac-cases.csv` có ca 403 cho từng vai. Test đơn vị: hàm vẫn trả mệnh đề cho SAL, CTV, HK (lớp thứ hai nếu sau này mở quyền) |
| Người có vai MGR ở cơ sở khác | Có cổng | Có cổng | Vai lấy theo **cơ sở trong đường dẫn** (`rolesAt` của guard), không gộp mọi cơ sở |

### 1.3 Ba ngoại lệ của test quét

| Tệp | Lý do trong test | SEC đọc mã | Kết quả |
|---|---|---|---|
| `housekeeping/internal/work-orders.service.ts` | Lịch sử phiếu việc, chỉ dòng `work_order.*` | `WHERE e.entity_type = 'work_order' AND e.entity_id = $1`; chỉ trả `change`/`from`/`to` và ghi chú | **Hợp lý** |
| `identity/internal/auth.service.ts` | Khóa MFA: `SELECT 1` trên `mfa.verify_failed`, không trả gì | Đúng câu đó, chỉ để gộp lần thử sai theo phút | **Hợp lý** |
| `audit/public/line-reductions.ts` | Đếm BR-438, chỉ trả `{ actorUserId, n }` | Đúng. Kết quả đi vào mục Cần chú ý chỉ OWN; danh sách `reductionsOnly` chạy trong `listAuditEvents`, tức đã qua cổng | **Hợp lý** |

Migration có đọc `audit_event` (0064, 0068) nhưng đó là câu sửa dữ liệu một lần. Không có view hay hàm SQL nào đọc bảng này. Không module nào dùng bộ dựng truy vấn Drizzle trên `auditEvent`.

### 1.4 Khớp thiết kế 5.1

| 5.1 | #149 | Kết quả |
|---|---|---|
| `defineManagerOnlyAudit({ entityTypes?, fields? })`, do module chủ dữ liệu khai | Có. `folio/audit-entities.ts` khai `commission` + `commissionVnd`; tệp này đã được api, worker, CLI nạp (`src/audit-entities.ts`) | **Khớp** |
| `auditVisibleWhere(alias, ph, roles)`, rỗng khi có OWN/MGR | Có. Dòng không có `entity_type` vẫn hiện (`COALESCE`) | **Khớp** |
| `redactAuditFields(value, roles)` | `redactAuditFields(entityType, value, roles)`: thêm tham số loại thực thể để trả `null` cho dòng hạn chế | Lệch nhỏ, chặt hơn. ARC sửa chữ 5.1 khi tiện |
| Áp ở `listAuditEvents` và `getReservationHistory` | Cả hai, bằng cả hai hàm | **Khớp** |
| Test quét "mọi `FROM audit_event`" | Quét `FROM` **và** `JOIN`, không phân biệt hoa thường; tệp đọc phải gọi mỗi hàm ít nhất bằng số lần đọc | **Khớp**, rộng hơn chữ 5.1. Còn lỗ → ARC 149-01, mục 2.3 |
| Lọc lúc đọc, không migration | Đúng. Không đổi `openapi.yaml`, không đổi cách ghi | **Khớp** |

---

## 2. Chạy lại

### 2.1 Toàn bộ API Vitest trên PostgreSQL 17 (container tạm, đã xóa)

- **209 tệp** (206 qua, 2 bỏ qua, 1 đỏ): **5029 ca qua, 1 đỏ**, 19 bỏ qua (cần môi trường riêng, như CI), 1 todo.
- Ca đỏ: `integration/reservations.test.ts` › "US-016 AC4 rack by role … p95 < 200 ms". Đo được 240 ms > 200 ms, lúc máy đang chạy thêm 13 container khác.
  - Chạy lại riêng tệp đó, cùng 2 tệp của PR: **25/25 qua**.
  - Ca này đo truy vấn sơ đồ phòng (`getRack`). #149 không chạm truy vấn đó, chỉ sửa `history()` trong cùng tệp.
  - Job `test` của CI trên `91907134` xanh. SEC coi đây là ca chập chờn vì tải máy, không do #149.
- Hai tệp của PR: 7/7 qua (3 ca đơn vị, 4 ca tích hợp).

### 2.2 Bốn đột biến M1–M4 của BE-H

SEC lặp lại M2 (bỏ che `after` ở danh sách) và M3 (bỏ mệnh đề ở lịch sử đơn): đều đỏ (S5, S6 dưới). Không lặp M1, M4: cùng cơ chế với M2, M3.

### 2.3 Sáu đột biến của SEC

| # | Đột biến | Kết quả | Ý nghĩa |
|---|---|---|---|
| S1 | Folio **không** khai hoa hồng là chỉ OWN/MGR | 4/7 đỏ | Quên khai báo thì test đỏ, kể cả trên app Nest thật |
| S2 | FDL được đọc nhật ký đầy đủ | 3/7 đỏ | Nới vai thì test đỏ |
| S3 | Thêm một tệp mới đọc `audit_event` không qua cổng | 1/7 đỏ (test quét) | Nơi đọc thứ ba bị bắt |
| S4 | Thêm một lần đọc **thứ hai**, không qua cổng, vào tệp ngoại lệ `auth.service.ts` | **7/7 xanh** | Ngoại lệ miễn cả tệp. Cùng điều ARC 149-01 (b) đã thấy ở `work-orders.service.ts` |
| S5 | Bỏ mệnh đề ở lịch sử đơn (= M3) | 1/7 đỏ | Dòng `commission.*` hiện lại theo `action`, test bắt được |
| S6 | Bỏ che `after` ở danh sách (= M2) | 2/7 đỏ | – |

Ý kiến về **FB-R5-ARC-BE-149-01**: SEC đồng ý cả ba ý: (a) regex, (b) ngoại lệ ghim số lần đọc, (c) controller dùng `seesFullAudit`. Ý (c) quan trọng với SEC: luật "ai đọc đủ" đang ở hai chỗ. Đây đúng là kiểu lệch hai nguồn danh sách vai mà thẻ D1-05 đã muốn bỏ. Hạn ARC đặt ("trong `r5-h1c`") được, miễn là **trước PR-M**, vì PR-M thêm nơi đọc thứ ba.

---

## 3. Thẻ feedback

### FB-R5-SEC-BE-149-01
- Mức độ: **Major**. Chặn gộp #149. Chỉ cần đổi test và chữ, không đổi mã.
- Người nhận: BE-H. ORC cho mục "Kiểm tra riêng" dưới đây.
- Vị trí:
  - `product/services/api/test/audit-visibility-gate.test.ts` dòng 100–101 (ca "OWN/MGR read in full; FD, FDL, SAL, CTV, HK get the clause and the redaction"): object `line` và `row` dùng một **số tỷ lệ hoa hồng viết thẳng** (số tròn), kèm số tiền cơ sở và số tiền hoa hồng. Từ hai số tiền suy ra được đúng tỷ lệ đó;
  - mô tả PR #149, mục "Test": "Chỉ dùng tỷ lệ thử `test_rate_*`". Câu này đúng với test tích hợp (bộ dữ liệu DS-E), nhưng sai với test đơn vị.
- Vấn đề:
  - G3 (SEC 04/11, plan V5-30): seed, fixtures, **test**, ví dụ API, mô tả PR chỉ dùng tham số thử **đặt tên rõ** (`test_rate_*`, ví dụ `test_rate_short` ở `v5-30-commission-rate.test.ts`), và không ghi số tiền hoa hồng.
  - Một số tròn trông như tỷ lệ thật thì không ai đọc repo phân biệt được với bảng nội bộ, kể cả SEC. Mục đích của G3 là để không ai phải biết bảng thật mới review được.
  - Tỷ lệ cũ trong `sales.test.ts` (BR-903-01) là số **trước 01/11**, đã công khai, không thuộc thẻ này.
- Vì sao quan trọng: repo công khai. Tỷ lệ là chính sách trả người bán mà chủ đầu tư giữ kín (FB-R4-SEC-BE-01, Major). Số đã đẩy lên thì **không thu hồi được**, theo rủi ro R1 ở review 04/11. Gộp vào `main` thì số đi vào mọi bản clone sau này.
- Đề xuất sửa:
  1. Trong test đơn vị, dùng một hằng có tên, như các test V5-30 đã làm (ví dụ `const test_rate_short = <giá trị lẻ>`). Tính số tiền bằng `applyPct` hoặc dùng số tiền lẻ không gợi tỷ lệ. Test này chỉ kiểm khóa nào bị bỏ; giá trị không quan trọng.
  2. Sửa câu trong mô tả PR cho đúng.
  3. Không cần viết lại lịch sử nhánh: commit cũ đã nằm trên ref của PR công khai.
- Kiểm tra riêng (ORC): hỏi DOM, người giữ bảng nội bộ ngoài repo, **chỉ một câu có/không**: số trong test có trùng giá trị nào của bảng thật không. Không ghi số vào repo, PR hay chat.
  - "Không": hết việc;
  - "Có": báo SEC. SEC đánh giá lại mức rủi ro và mở ESC nếu cần, vì ref của PR công khai không xóa được bằng git.
- Trạng thái: **Closed** @ `80f2d239` (mục 7). DOM trả lời "không trùng"

---

## 4. Ghi nhận, không thẻ

- **Phí kênh OTA trong lịch sử đơn.** Dòng `channel_fee.recorded`/`updated` có `entity_code` của đơn. FD/FDL vì vậy thấy ở lịch sử đơn các khóa `baseVnd`, `ratePct`, `amountEstimatedVnd`, `amountActualVnd`.
  - `rbac-matrix` ghi "Phí kênh thực tế từng đơn": FD/FDL K. "Tỷ lệ phí kênh cấu hình": FD/FDL được đọc (R).
  - Đây không phải hoa hồng của sale/CTV, nên ngoài 131-01. Lễ tân cũng tự nhập `otaChannelFeeVnd` từ extranet khi tạo đơn OTA. Phần thật sự mới với FD chỉ là số MGR đối soát lại (`reconcileChannelFee`).
  - Mức **Low**. Nếu BA/DOM muốn đúng từng chữ của ma trận thì một dòng `defineManagerOnlyAudit({ fields: ['amountActualVnd'] })` ở `folio/audit-entities.ts` là đủ, trong v1.0.6.
- **Dòng hạn chế lọt qua mệnh đề:** `redactAuditFields` trả `null` cho `before`/`after`, nhưng `action` và cột `reason` của dòng đó vẫn hiện. Bản ghi `commission.*` không ghi `reason`, nên hôm nay không lộ gì. Lớp chính là mệnh đề SQL, đã có test đỏ khi bỏ (S5).

---

## 5. Điểm làm tốt
- Test tích hợp kiểm trước rằng các dòng hoa hồng **có thật** trong bảng, dưới tên FD/FDL, rồi mới kiểm FD/FDL không thấy chúng. Nên test không thể xanh vì bảng rỗng.
- Lọc bằng SQL **trước** khi phân trang, không lọc sau khi đọc. Trang của FD không ngắn bất thường, và con trỏ không lộ có dòng bị giấu.
- Module `audit` không biết hoa hồng là gì; module chủ dữ liệu tự khai. PR-M và các module sau theo cùng một chỗ.

---

## 6. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – PR #149 (BE-H, cổng audit-visibility) @ 91907134: DUYỆT CÓ ĐIỀU KIỆN.** Đóng FB-R5-SEC-BE-131-01 (và V530-02) khi gộp: folio khai commission + commissionVnd là chỉ OWN/MGR; listAuditEvents và getReservationHistory dùng cả auditVisibleWhere (SQL, trước phân trang) và redactAuditFields; FD/FDL không còn thấy commission.* (ratePct, baseVnd, amountVnd) và khóa commissionVnd trên cả hai đường, OWN/MGR thấy đủ; SAL/CTV/HK/MT 403 ở guard (rbac-cases); vai theo cơ sở trong đường dẫn; 3 ngoại lệ quét có lý do đúng; khớp architecture 5.1. API Vitest trên PostgreSQL 17 tạm: 209 tệp, 5029 ca qua, 1 đỏ (ca p95 sơ đồ phòng chập chờn vì tải máy, chạy riêng xanh, không do #149); 6 đột biến SEC, 5 đỏ, S4 (đọc thứ hai trong tệp ngoại lệ) xanh → đồng ý ARC 149-01, làm trước PR-M. Điều kiện gộp: FB-R5-SEC-BE-149-01 Major (test đơn vị viết thẳng tỷ lệ và số tiền hoa hồng, trái G3 – đổi sang tham số thử có tên, sửa mô tả PR; ORC hỏi DOM có/không trùng bảng thật) và E2E smoke xanh trên SHA cuối. Ghi nhận Low: phí kênh đối soát (amountActualVnd) hiện ở lịch sử đơn cho FD/FDL, BA/DOM quyết ở v1.0.6. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-h-pr-149.md |`

---

## 7. Phần chênh @ `80f2d239` (Review delta, 07/11/2026)

**Đối tượng:** `91907134..80f2d239`, đúng một commit `80f2d239` (cha là `91907134`). Commit chỉ chạm `test/audit-visibility-gate.test.ts` (+15 −3), không chạm tệp nào trong `src`. Theo quy tắc ở mục 0, SEC chỉ đọc lại phần chênh; kết luận về mã ở mục 1 và 2 giữ nguyên.

| Điểm kiểm | Kết quả |
|---|---|
| Phần chênh | **Đạt.** Tỷ lệ là hằng thử có tên `test_rate_short`, cùng tên và cùng giá trị thử với các test G3 đã có (`v5-30-commission-status.test.ts`, `v105-early-hours.test.ts`). Số tiền phòng là hằng thử có tên `test_room_vnd`, giá trị lẻ. `commissionVnd` tính bằng `applyPct` từ hai hằng đó; `ratePct`, `baseVnd`, `amountVnd` của `row` cũng lấy từ hai hằng này. Trong tệp, kể cả chú thích, không còn số tỷ lệ hay số tiền hoa hồng nào viết thẳng. Ngoài hai hằng có tên, số tiền duy nhất còn viết thẳng là của dòng minibar ở ca "thực thể thường": không phải hoa hồng, ngoài phạm vi G3. Các phép kiểm giữ nguyên ý: OWN/MGR nhận đúng object, FD bị bỏ `commissionVnd` |
| Chạy lại | Test cổng 3/3 xanh @ `80f2d239`; `tsc` không báo lỗi ở tệp này. Không chạy lại toàn bộ Vitest: chỉ test đơn vị này đổi, và nó không dùng cơ sở dữ liệu |
| Mô tả PR (`gh pr view 149`, head `80f2d239`) | **Đạt.** Mục "Test" nay ghi: test đơn vị dùng `test_rate_short` và `applyPct`; test tích hợp lấy tỷ lệ từ bộ thử DS-E và chỉ kiểm khóa nào hiện, khóa nào bị bỏ. Cả mô tả không có tỷ lệ hay số tiền hoa hồng nào. Thông điệp commit `80f2d239` cũng không có số |
| Cả PR (`68c7ebb7..80f2d239`, 8 tệp) | **Đạt.** SEC quét mọi dòng thêm tìm số tỷ lệ hay số tiền hoa hồng: không còn. Test tích hợp chỉ kiểm khóa; tỷ lệ đến từ fixture DS-E đã có trên `main`, không thuộc PR này |
| Lịch sử | Số cũ vẫn còn trên ref công khai của PR (`91907134`). Đúng như ý 3 của thẻ, không cần viết lại lịch sử: DOM đã trả lời "không trùng bảng thật". Không ESC |

**Kết luận:** FB-R5-SEC-BE-149-01 **Closed @ `80f2d239`**. Về phía SEC, #149 nay **DUYỆT @ `80f2d239`**. Điều kiện gộp còn lại là CI xanh trên SHA cuối, gồm E2E smoke; ORC tự kiểm. Lúc SEC đọc, `format · lint · audit · test · build` còn đang chạy; gitleaks, confidential paths, API contract đã xanh. Nếu có thêm commit, áp lại quy tắc ở mục 0.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | **SEC – PR #149 delta @ 80f2d239: FB-R5-SEC-BE-149-01 Closed; #149 DUYỆT @ 80f2d239 (phía SEC).** Một commit, chỉ test/audit-visibility-gate.test.ts. Tỷ lệ là hằng thử có tên test_rate_short (cùng tên, cùng giá trị thử như các test G3 V5-30), số tiền phòng là hằng thử có tên, hoa hồng tính bằng applyPct; tệp không còn số tỷ lệ hay số tiền hoa hồng viết thẳng, kể cả chú thích. Mô tả PR và thông điệp commit không có số. Quét cả PR (8 tệp): không còn số hoa hồng. Test cổng 3/3 xanh. DOM trả lời không trùng bảng thật → không viết lại lịch sử, không ESC. Còn điều kiện CI xanh trên SHA cuối gồm E2E smoke (ORC kiểm) | SEC | rounds/round-05/reviews/SEC-on-be-h-pr-149.md |`
