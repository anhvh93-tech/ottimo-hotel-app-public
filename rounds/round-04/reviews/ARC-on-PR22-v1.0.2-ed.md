# ARC review – PR #22 `v1.0.2-ed` (trả phòng sớm B16 + giá hẹn) – Round 4, bước Review

- Người review: ARC · Ngày: 01/11/2026
- PR: #22, head `99734cda`, base `main` `cfbbe3d4` (đã gộp vào nhánh ở `8c7127ef`). GitHub: MERGEABLE, BLOCKED (thiếu duyệt + CI đỏ).
- Phạm vi:
  - Mã BE-A v1.0.1 (`be-a-v1.0.1` `1552e495`, gộp ở `0e322f16`) – lần đầu ARC đọc mã.
  - Phần giải xung đột của BE-A khi gộp `arc-contract-v1.0.1` `c63a4571` → `be-a` → `fe-a-v1.0.1` `43a3a5a7` → `main`.
  - SEC Minor `recordMoney` (`5dd171f9`).
  - Báo cáo BE: `rounds/round-04/outputs/BE/v1.0.2-ed-be-a.md` (trên nhánh).
- Ngoài phạm vi: chữ và giao diện FE-A (UXD thẻ 13–15), số tiền theo oracle khi chạy tay (QA), xác nhận FB-01 lượt 2 (BE-B).
- Không sửa mã, không commit nhánh. Kiểm bằng worktree tạm trong scratchpad (`git worktree --detach origin/v1.0.2-ed`) và Postgres 17 tạm trong Docker (vai và mật khẩu CI, đã xóa sau khi chạy).

## 1. Đã kiểm gì (bằng chứng)

| # | Kiểm | Kết quả |
|---|---|---|
| K1 | `gh pr checks 22` | Đạt: API contract (validator + RBAC `--strict`), Redocly, gitleaks, shellcheck, landing, "no test endpoints". **Đỏ: job `format · lint · audit · test · build`**. Format, lint (13 gói), drizzle "no file", migrate đều xanh. Bước `pnpm test` dừng ở `@ottimo/tests#test` (32 lỗi `br-examples`, có sẵn trên `main`). Turbo báo `8 successful, 14 total`, nghĩa là **`@ottimo/api:test` và `@ottimo/admin-web:test` không chạy xong trên CI** (FB-01) |
| K2 | 32 lỗi `test:fixtures` của CI | Đều là nhãn `INV-004/036`/GIẢ ĐỊNH ở BR-101/103/201–210, cộng thiếu oracle BR-115/116. **Không có lỗi nào ở BR-428**, nên việc bỏ `pendingFix` BR-428-08/09 không gây đỏ thêm |
| K3 | ARC chạy lại: `b16-preview-v101` + `rooms-scheduled-prices-v101` trên PG 17 (migrate sạch 0000→0089 bằng `ottimo_migrator`, test bằng `ottimo_app`) | **21/21 đạt.** Có BR-428-01…09 qua cả tính thử và ghi thật, ảnh chụp 72 bảng, 6 ca `Database.simulate` |
| K4 | Chạy lại các test không cần DB: `audit-record-db-only`, `be-a-v101-units`, `migrations-journal`, `worker-audit-registry` | 4 tệp đạt, 57 ca: 54 đạt, 3 bỏ qua (có chủ đích). `worker-audit-registry` cần build `@ottimo/integrations` trước khi chạy |
| K5 | admin-web: `v101-early-departure-fea`, `v101-scheduled-prices-fea`, `folio-ed-label`, `rooms` | 47/47 đạt |
| K6 | `gen-openapi-meta.mjs --check`; api-client test; `gen_strings.py` chạy lại | Meta/schemas "up to date"; api-client đạt; `gen_strings.py` không đổi byte nào |
| K7 | Toàn bộ api (Vitest, PG thật) tại `99734cda` | Xem mục 6 |
| K8 | Snapshot `0089` so với `0088` trên `main` (Python, so từng bảng) | Chỉ thêm `public.simulation_guard`, không bảng nào khác đổi. `prevId` của 0089 = `id` của 0088 (`03fbd7b0…`) |
| K9 | Registry audit: `frontdesk.module.ts`, `platform.module.ts` so với `main` | **Trùng byte với `main`.** 18 khóa `reservation` và 1 khóa `room` mà BE-A thêm vào module ở `1552e495` nay nằm đúng trong `modules/{frontdesk,platform}/audit-entities.ts`. Danh sách trùng từng khóa với diff gốc. Mọi khóa `after` của `reservation.early_departure` (gồm `departureDate`, `refundableVnd`, `retainedVnd`) có trong registry hợp nhất. `src/audit-entities.ts` (worker + CLI) import cả hai tệp |
| K10 | `git merge-tree` PR #22 với #16, #20, #21, `lp-v2` | #16: sạch. #21: sạch. #20: xung đột `strings-{en,vi}.json` + `strings.js`. Đây là tệp sinh: ARC đã thử gộp #16 rồi #20 lên PR #22, chạy `gen_strings.py` (3351 chuỗi + 8 mẫu) thì hết dấu xung đột. `lp-v2`: xung đột `openapi.yaml`, `_journal.json`, `openapi-meta/schemas`, chuỗi (đã lường trước, xem mục 4) |

## 2. Kết luận theo từng việc được giao

**(1) Mã BE-A v1.0.1 – ĐẠT.** Mã đúng ADR-015 và hợp đồng 0.3.9 (cả bổ sung 1–3).
- **Chế độ tính thử:** `earlyDeparture` đọc chế độ từ `tx.ctx.simulation` và từ chối khi thân lệnh và loại giao dịch lệch nhau (thẻ SEC-ARC-01 (2)). Bước ghi bắt buộc có `If-Match`; tính thử bỏ kiểm phiên bản.
- **Không có tác dụng ngoài giao dịch:** các bước như yêu cầu hoàn, gắn tệp, nhật ký tiền, hook đăng ký, outbox, SSE, hook đặt phòng đều nằm sau `if (dryRun) return`. Ngoài ra còn chặn ngay tại nguồn (`ApprovalService.submit`, `AttachmentService.bindTo`, `ReservationHooks.emit` ném lỗi). Phần còn chạy trong tính thử chỉ dùng `tx.query`. `events.publish` là `pg_notify`, có giao dịch, nên bị rollback cùng. PR #16 thêm `enqueueStaffChat`, nhưng đó cũng là một dòng outbox trong giao dịch → không phá vỡ bất biến khi gộp sau.
- **Tách hoàn tiền theo phương án A:** `splitEarlyDepartureRefund` là hàm thuần, có test bất biến. Câu trả lời API, nhật ký audit và yêu cầu hoàn dùng cùng 3 cặp số.
- **409 `AMOUNT_CHANGED`:** kiểm ngay trước `approvals.submit`, sau thứ tự khóa K11-01. Lỗi ném ra làm rollback cả giao dịch. Test có ca "cùng khóa, gửi lại thì thành công".
- **Giá hẹn:**
  - `cancelScheduledListPrice` khóa phòng `FOR UPDATE`, khớp `If-Match` với `room.version` rồi tăng version. Từ chối 404, 409 `effective` và 409 `only_price`. Audit `config` dùng khóa có trong registry.
  - `scheduledListPrices` đọc theo lô (một truy vấn cho cả danh sách phòng), không N+1.
- **`stayDepartureDate`:** thêm một truy vấn gộp mỗi DTO, cùng kiểu với các truy vấn đã có trong `dtoOf`. Chấp nhận được.
- **Điểm còn lại:** FB-02 (Minor) và FB-03 (Suggestion).

**(2) Nối registry audit khi giải xung đột – ĐẠT** (K9). Cách giải giữ module bản `main` và chuyển khóa sang `*/audit-entities.ts` là đúng kiến trúc sau bản sửa J15. Worker và api dùng cùng một registry. Các chốt chặn fail-closed nằm trong lớp dịch vụ nên worker có sẵn. Port `hasForeignGuestDocument` là tùy chọn và không có trên đường của worker.

**(3) `Database.simulate` trên nền `main` – ĐẠT.** `withContext` trên `main` không đổi kể từ gốc của `be-a` (`SET_CONTEXT_SQL` 6 tham số, cờ đơn vị công việc `unitOfWorkScope`). `simulate` đi cùng đường đó với các điểm sau:
- Từ chối kết nối lồng.
- Bắt buộc có ngữ cảnh property.
- Dòng `simulation_guard` được ghi ở cấp ngoài cùng, trước `fn`, nên không savepoint nào xóa được.
- Kiểm `txid` trước và sau `fn`.
- `ROLLBACK` trong `finally`. Nếu `ROLLBACK` lỗi thì hủy kết nối, không trả về pool.

Bộ lọc câu lệnh (`isForbiddenInSimulation`) chỉ để nhắc lập trình viên, đúng như chú thích. Ranh giới bảo mật thật là trigger `DEFERRABLE INITIALLY DEFERRED` cộng với kiểm `txid`. `SET CONSTRAINTS … IMMEDIATE` cũng không vượt được: trigger chạy ngay và vẫn báo lỗi. Muốn tắt trigger hay dùng `session_replication_role` thì phải là owner hoặc superuser, mà `ottimo_app` không có quyền đó.

**(4) Migration 0089 – ĐẠT.**
- Journal idx 65 = vị trí trong mảng. `when` 1792782167681 = 0088 + 2000. `main` chưa có migration nào sau 0088.
- Snapshot đúng chuỗi `prevId` (K8). drizzle trên CI báo "no file".
- RLS `ENABLE` + `FORCE`, có policy tenant. Hàm trigger đặt `search_path` và `REVOKE … FROM PUBLIC`. `ottimo_app` chỉ có quyền INSERT.
- `GRANT DELETE ON room_list_price` đủ dùng nhưng quá rộng → FB-02.

**(5) OpenAPI (bổ sung 3) – ĐẠT.** Báo cáo BE ghi đúng: bổ sung 3 chỉ đổi mô tả. Meta và schema sinh lại không đổi byte (K6), CI contract và Redocly xanh. ARC tự ghi một việc của mình ở mục 5 (câu chữ về sequence).

**(6) `br-examples.json` bỏ `pendingFix` BR-428-08/09 – ĐẠT (phía kỹ thuật).** Oracle 07/08/09 chạy xanh qua cả tính thử và ghi thật (K3), CI không báo lỗi BR-428 (K2). Giả định G2 của BE vẫn đúng: **BE-B phải xác nhận FB-01 lượt 2** trước khi ORC gộp. Đây là điều kiện của kế hoạch, ARC không thay BE-B xác nhận được.

## 3. Thẻ feedback

### FB-R4-ARC-BE-A-ED-01
- Mức độ: **Major** (điều kiện gộp; không phải lỗi mã của BE-A)
- Vị trí: CI PR #22, job `format · lint · audit · test · build`, bước "Test (Vitest, real PostgreSQL as ottimo_app)", run 41313592661. Kế hoạch `plan-v1.0.1.md` mục 2 dòng 3 ("ảnh chụp 72 bảng + api + admin-web xanh").
- Vấn đề:
  - `@ottimo/tests#test` (`test:fixtures`) đỏ do lỗi có sẵn trên `main`. Turbo dừng ở lỗi đầu tiên (`Tasks: 8 successful, 14 total`), nên `@ottimo/api:test` (3339 ca, gồm ảnh chụp 72 bảng) và `@ottimo/admin-web:test` (676 ca) **chưa chạy trên CI cho PR này**.
  - Bằng chứng xanh hiện chỉ có từ máy local: của BE-A (toàn bộ) và của ARC (K3–K7).
- Vì sao quan trọng: PR gộp ba nhánh cũ (gốc kém `main` 171 commit) và có một lần merge `main`. CI trên đúng commit gộp là chốt duy nhất mà QC và ORC dựa vào được. Nếu gộp khi job đỏ, `main` mang thêm một lần đỏ không biết nguyên nhân thật.
- Đề xuất sửa (chọn một, ORC quyết):
  - (a) **Ưu tiên:** gộp PR sửa nhãn của DOM vào `main` trước. BE-A merge `main` vào `v1.0.2-ed` rồi chờ CI xanh trọn job.
  - (b) Nếu DOM chưa xong: OPS chạy tay workflow trên head `99734cda` với `turbo run test --continue` (hoặc `--filter='!@ottimo/tests'`) và lưu link run vào PR làm bằng chứng api + admin-web xanh. ORC ghi ngoại lệ vào `decision-log.md` (CI đỏ chỉ vì `test:fixtures` có sẵn trên `main`).
  - Không được dùng "Merge without waiting for requirements" khi chưa có (a) hoặc (b).
- Trạng thái: Open

### FB-R4-ARC-BE-A-ED-02
- Mức độ: Minor
- Vị trí: `services/api/src/db/migrations/0089_simulation_guard_room_price_cancel.sql` (dòng 45 `GRANT DELETE ON room_list_price TO ottimo_app`); `platform/internal/rooms.service.ts` `cancelScheduledListPrice`.
- Vấn đề:
  - Luật "chỉ xóa dòng giá có ngày hiệu lực **sau** ngày nghiệp vụ, không bao giờ xóa dòng duy nhất" chỉ nằm ở lớp dịch vụ.
  - Ở mức DB, `ottimo_app` xóa được mọi dòng của property, kể cả lịch sử giá đã áp dụng. Từ trước đến giờ, lịch sử này chỉ được thêm, không bị xóa.
- Vì sao quan trọng: lịch sử giá niêm yết là căn cứ đối soát báo giá và giải thích giá cho chủ đầu tư. Một lỗi lập trình hay một truy vấn sai về sau có thể xóa lịch sử mà DB không chặn. Nguyên tắc chung của dự án là DB phải tự giữ bất biến (như `simulation_guard`, như PN-01).
- Đề xuất sửa (v1.0.3, không chặn PR #22):
  - Thêm trigger `BEFORE DELETE ON room_list_price`, từ chối khi `OLD.effective_from <= (now() AT TIME ZONE <tz của property>)::date`. Lấy tz từ `property`; chấp nhận lệch theo giờ chuyển ngày, vì lớp dịch vụ đã chặn chặt hơn. Có thể chặn thêm khi đó là dòng cuối cùng của phòng.
  - Đặt chung đợt với migration sau PN-01 theo luật số kế tiếp. SEC quyết có cần hay không.
- Trạng thái: Open

### FB-R4-ARC-BE-A-ED-03
- Mức độ: Suggestion
- Vị trí: `frontdesk/internal/stay.service.ts` `earlyDeparture` (dòng 1366–1878 trên nhánh).
- Vấn đề:
  - Hàm nay dài khoảng 510 dòng, có 10 chỗ rẽ nhánh theo `dryRun` rải khắp hàm.
  - Bất biến "tính thử = ghi thật" được giữ nhờ dùng chung một hàm. Nhưng người sửa sau phải tự nhớ đặt bước mới có tác dụng ngoài giao dịch **sau** `if (dryRun) return`. Hiện có chốt chặn tại nguồn cho 3 dịch vụ, nhưng các dịch vụ mới thì chưa có.
- Vì sao quan trọng: dễ đọc, dễ sửa ở v1.1, khi B16 sẽ thêm luật HĐ tháng (BR v0.5.1, ESC-045 câu 4).
- Đề xuất sửa (v1.1):
  - Tách thành 4 bước: `loadAndValidate` → `applyInTransaction` (chỉ `tx.query` và các port DB) → `explain` → `commitSideEffects`. Bước cuối chỉ được gọi khi `!tx.ctx.simulation`. Giữ một điểm vào duy nhất để không sinh công thức thứ hai.
  - Mọi dịch vụ mới có tác dụng ngoài DB phải có chốt `tx.ctx.simulation` tại nguồn. Ghi luật này vào `coding-standards`; ARC làm phần này.
- Trạng thái: Open

## 4. Thứ tự gộp (so với các PR đang mở)

Đúng như `plan-v1.0.1.md` mục 2. Bổ sung bằng chứng `merge-tree` (K10):

| Thứ tự | PR | Quan hệ với PR #22 | Việc khi gộp |
|---|---|---|---|
| 1 | **#16** Chat (head `98ff43bb`) | Gộp sạch (chỉ `decision-log.md` tự gộp). Không có migration. `events.service.ts` chỉ thêm `enqueueStaffChat` (outbox trong giao dịch) → không đụng bất biến ADR-015 | Gộp trước PR #22 như kế hoạch. Không cần làm gì thêm cho PR #22 |
| 2b | **#20** số ít/nhiều (`ee375e6d`) | Xung đột 3 tệp sinh (`strings-en/vi.json`, `strings.js`). `gen_strings.py`, `content-guide.md`, `strings-tables.md` tự gộp | PR gộp sau thì merge `main` rồi chạy `python3 -I product/design/tools/gen_strings.py`. ARC đã thử: ra 3351 chuỗi + 8 mẫu, hết dấu xung đột. Sau đó chạy `git diff --exit-code` cho tệp sinh và chạy test i18n/admin-web |
| 2c | **#21** thông báo `2026-10-31` | Gộp sạch, chỉ `landing-web` | Thứ tự tự do |
| 3 | **#22** (PR này) | – | Điều kiện: FB-01 (CI), BE-B xác nhận FB-01 lượt 2, UXD xác nhận 13–15, QA đạt. Nếu #16/#20 vào `main` trước thì merge `main` lại và chạy lại CI |
| 4 | **PN-01** (0090) | Phải đi sau PR #22 | Journal **idx 66**, `when` = **1792782169681** (0089 + 2000). Snapshot `0090` có `prevId` = `018c5475-b982-44a7-93ef-731f6dac0f18` (id của 0089), nội dung = 0089 (không đổi schema). Đăng ký audit entity vào `*/audit-entities.ts`, **không** vào `*.module.ts` |
| 6 | **LP-v2** (0091) | Hiện `origin/lp-v2` ghi 0091 ở **idx 65** và snapshot có `prevId` = 0088 (`03fbd7b0…`). Đó cũng là cha của 0089, nên sau PR #22 sẽ có hai snapshot cùng cha: `drizzle-kit generate` báo lỗi và test journal đỏ | Khi rebase: idx **67**; `when` giữ 1792782171681 (đã lớn hơn 0090); snapshot sinh lại từ 0090, phải có `simulation_guard`. OpenAPI **0.3.10** dựng trên 0.3.9: giải xung đột `openapi.yaml` theo nội dung rồi sinh lại `openapi-meta/schemas` và api-client, không sửa tay tệp sinh. Chuỗi: chạy `gen_strings.py` |

`test:fixtures` đỏ trên `main` là việc của DOM (PR riêng). Không yêu cầu PR #22 sửa nhãn BR-101…210, vì sửa ở đây sẽ đụng PR của DOM.

## 5. Việc của ARC (tự ghi, không phải thẻ cho BE)
- `openapi.yaml` B16, mô tả `dryRun`: câu "không cấp mã/số từ sequence" dễ hiểu lệch với ADR-015 §4 ("khoảng trống id do sequence là bình thường"). Ý đúng: không cấp **mã/số có nghĩa nghiệp vụ** (mã yêu cầu duyệt, số bill, `doc_sequence`); id kỹ thuật thì vẫn có thể nhảy. ARC sửa câu chữ ở 0.3.10 (chỉ mô tả, không đổi hình dạng API, không cần BE/FE sửa).
- Thêm vào `coding-standards`: "dịch vụ có tác dụng ngoài DB phải chặn `tx.ctx.simulation` tại nguồn" (gắn với FB-03).

## 6. Toàn bộ api tại `99734cda` (K7)

**142 tệp đạt, 2 bỏ qua; 3339 ca đạt, 19 bỏ qua, 0 lỗi** (172 s). Chạy trên PG 17-alpine trong Docker, với vai và mật khẩu CI (`02-roles.sh`) và đủ bốn biến `DATABASE_URL` / `MIGRATION_` / `BOOTSTRAP_`. Kết quả trùng con số trong báo cáo BE-A.

Đây là bằng chứng độc lập thứ hai ngoài máy BE-A, nhưng **không thay CI** (FB-01): máy local không đi qua bước cache, format và build của job CI.

## 7. Kết luận

**Duyệt phía ARC, có điều kiện.** Mã BE-A v1.0.1, phần giải xung đột registry audit, `Database.simulate`, migration 0089, OpenAPI 0.3.9 bổ sung 3 và `br-examples.json` đều đạt. Không có Blocker. Còn **1 Major là điều kiện gộp** (FB-01: CI phải chạy xong api + admin-web trên commit gộp), 1 Minor (FB-02, dời v1.0.3) và 1 Suggestion (FB-03, v1.1).

ORC chỉ gộp khi đủ:
1. FB-01 theo (a) hoặc (b).
2. BE-B xác nhận FB-01 lượt 2.
3. UXD xác nhận thẻ 13–15.
4. QA đạt theo oracle BR-428-01…09 và giá hẹn/hủy.
5. SEC đọc lại diff gộp (không bắt buộc với ARC).

Nếu #16/#20 gộp trước thì merge `main` lại và sinh lại chuỗi theo mục 4.

## 8. Điểm làm tốt
- Giải xung đột registry đúng theo kiến trúc mới, không theo cách cũ của nhánh: khóa đặt đúng chỗ worker cũng đọc được, có test registry chung.
- `Database.simulate` có hai lớp chặn độc lập (trigger trong DB + kiểm `txid`) và có test đột biến cho từng cách thoát. Test "chỉ-DB" cho `recordMoney` khóa cả danh sách import, nên mọi thay đổi về sau buộc phải qua review ADR-015.
- Báo cáo BE nêu rõ phần nào không thuộc nhánh (`test:fixtures` đỏ có sẵn, đã đối chứng bằng `br-examples` của `main`). Nhờ đó review khoanh vùng nhanh.
