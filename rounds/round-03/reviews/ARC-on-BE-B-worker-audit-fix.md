# ARC review BE-B – worker nạp đủ allowlist audit và listener `transitioned` (BUG-R3-037 mở lại, BUG-R3-038, BUG-R3-039)

- Người review: ARC | Round 3 – bước **Review** (bản sửa P1 trước Day D 02/11/2026) | Ngày: 29/10/2026
- Đối tượng: PR #14 (draft) `fix/worker-audit-registry`, head `a753201`, so với `origin/main` `355f01c` (52 tệp, +1273/−332). `a753201` so với `6d78ec8` chỉ sửa báo cáo BE-B (đã kiểm `git diff`), mã giống hệt bản CI đã chạy.
- Báo cáo tác giả: `rounds/round-03/outputs/BE/v1.0.0-worker-audit-fix-be-b.md` (trên nhánh).
- Đầu vào: `outputs/OPS/j15-folio-close-check.md` mục 10, `reviews/ARC-on-BE-B-j15-fix.md` (thẻ 02, 05), `qa/bug-list.md` (037, 038, 039).
- Cách review: đọc diff và mã trên bản xuất `git archive` của hai commit (`355f01c`, `a753201`) trong scratchpad. **Tự chạy lại** dump registry cho cả hai bản, test registry không cần DB, và thử 2 đột biến. Đọc log CI. **Không chạy** bộ test cần DB (dựa vào CI). Không sửa mã, không merge, không approve trên GitHub, không đụng staging/production.

## Kết luận: **Duyệt có điều kiện**

Mã đúng gốc lỗi và đúng phạm vi. Registry của api không đổi một trường nào. Worker nay có registry giống hệt api. Ba listener `transitioned` nối bằng đúng hàm mà module dùng. Test chạy trong tiến trình chỉ nạp worker và bắt được lỗi khi tái phát.

Gộp vào `main` làm rc.6 khi đủ các điều kiện ở mục "Điều kiện" cuối file. Không có Blocker. Có hai thẻ Major, đều là **thủ tục deploy**, không cần sửa mã: WA-01 cho staging, WA-02 cho production.

## Trả lời 5 câu ORC hỏi

### 1. Registry của api trước và sau có giống hệt không? – **Giống hệt, ARC đã tự kiểm**

Cách kiểm: một script riêng của ARC (không dùng test của BE-B), chạy `node -r ts-node/register/transpile-only` trên hai bản xuất. Mỗi lần, script nạp đúng những gì `main.ts` nạp (`app.module` + `feature-modules`), hoặc chỉ `worker-jobs`. Sau đó đọc `auditFieldsOf()` cho mọi tên loại thực thể xuất hiện trong mã.

| Tiến trình | `355f01c` (trước) | `a753201` (sau) |
|---|---|---|
| api (nạp 21 `*.module.ts`) | 31 loại / 237 trường | 31 loại / 237 trường, **bằng nhau từng trường** với bản trước |
| worker (0 `*.module.ts`) | **8 loại / 43 trường** | 31 loại / 237 trường, **bằng api** |

- `auditEntitySnapshot()` trên bản sau cũng cho 31/237. Vậy cách dò theo tên của ARC không sót loại nào.
- Không có trường mới vào allowlist, không mất trường.
  - Các trường trông "nhạy" (`displayName`, `username`, `room.name`, `decisionNote`…) đã có sẵn từ trước, không do PR này thêm.
  - Bộ lọc `FORBIDDEN` trong `defineAuditEntity` vẫn chặn `_enc`, `token`, `password`, `docNumber`…
- `defineAuditEntity` gộp theo phép hợp (`new Set([...prev, ...fields])`), nên thứ tự nạp tệp không làm đổi kết quả.
- Số lệnh gọi `defineAuditEntity` ngoài `audit-fields.ts`: 36 trước, 36 sau.
  - `rate_limit` chuyển sang `test-support/audit-entities.ts` và không vào tệp gom, đúng.
  - `app_user` của `operator-reset.ts` vẫn ở chỗ cũ, đúng: api chưa từng nạp tệp này.
- Chi tiết nhỏ: worker cũ thiếu **23/31** loại (31 − 8), không phải 22 như báo cáo BE-B ghi. Con số 22 trong log là danh sách literal `entityType:` mà mã ghi, không phải số loại thiếu. Không ảnh hưởng kết luận (thẻ WA-05).

### 2. Hành vi api có đổi không? 3 listener của worker có tương đương module? Có nguy cơ chạy 2 lần hoặc thiếu? – **Không đổi, tương đương, không chạy 2 lần**

**Api.** Các dòng `+` trong `*.module.ts` chỉ gồm hai loại:
- `import './audit-entities'`;
- ba lệnh gọi hàm nối: `wireRegistrationReservationHooks`, `wireCancelRevocation`, `wireNoShowNotices`.

Thân của ba hàm này chuyển nguyên văn từ `onModuleInit`, cùng vị trí trong `onModuleInit`. Vì vậy thứ tự đăng ký listener trong api không đổi. Không đổi hợp đồng API, không có migration.

**Đủ listener.** Trên nhánh, `grep` cho thấy toàn bộ `src` chỉ có **3** lệnh `hooks.on('transitioned', …)`: registration (K11/K12), front desk (B-13), reporting (no-show). Worker nối đủ cả 3. Thêm vào đó, registration nối `created`, `stay_changed` và `provideRegistrationSummary`; không job nào của worker phát hai sự kiện kia, nên vô hại.

**Tương đương.** `guestAccessPortForWorker` dựng `GuestPortalService(regs, parameters, audit, clock, events)`, đúng thứ tự tham số của constructor mà `GuestPortalModule` inject. `revokeAll` chỉ có 2 câu `UPDATE … WHERE revoked_at IS NULL`, không cần env hay khóa. `EventsService.publish` là `pg_notify`, nên SSE của api vẫn nhận `reservation.changed`.

**Không chạy 2 lần.** `ReservationHooks` là đối tượng trong bộ nhớ của từng tiến trình. `emit` chỉ gọi listener của chính tiến trình phát, trong cùng giao dịch.
- Chỉ `worker.ts` tạo `JobRunner`, nên api không tick job. `runOnce` của test-support là đường riêng, chạy trong api với hooks của api.
- J1 lấy hold bằng `FOR NO KEY UPDATE SKIP LOCKED`, kiểm lại `status = 'hold'` sau khi khóa, và `UPDATE … WHERE status = 'hold'`. Nếu lễ tân hủy hold cùng lúc thì một bên chờ khóa rồi gặp trạng thái `cancelled`, nên chỉ một bên phát `transitioned`.
- Trong worker, `hooks` dùng chung chỉ được nối **một lần**. Folio J15 vẫn dùng instance riêng, chỉ có các cổng nợ.
- Hai job khác dùng `ReservationsService` của reservations: `lease.nights` (`backfillLeaseNights`, không `emit`) và `ooo.activate` (`RoomBlocksService`, không dùng hooks). Hai job này không đổi hành vi.

**Khác biệt chấp nhận được:** thứ tự listener trong worker là registration → front desk → reporting, còn ở api phụ thuộc thứ tự `onModuleInit`. Ba listener ghi vào ba bảng riêng (`registration`, `guest_access_token`/`guest_session`, thông báo), không phụ thuộc nhau, nên thứ tự không ảnh hưởng kết quả.

**Còn lại (đã biết, BE-B ghi rõ):**
- `FolioService` trong composition của J1 không có `ApprovalService`. Hold có yêu cầu giảm giá hoặc FOC sẽ `failed` ở mỗi nhịp (thẻ WA-04).
- Các cổng `provideAmountDue`, `provideRoomReturn`, `provideDepositNotices`, `providePartyCount` không nối trong worker. Đường J1 không gọi các cổng này (đã đọc `expireOne`). `partyCount` mặc định trả 0.

### 3. Test worker-only có thật sự cô lập và bắt được lỗi tái phát không? CI có chạy không? – **Có, cả ba ý**

- **Cô lập.** `worker-only-child.ts` chạy trong tiến trình Node mới (`execFile process.execPath -r ts-node/register/transpile-only`) và chỉ `require` `src/worker-jobs`. Mỗi lần chạy, test khẳng định `moduleFiles` (các `*.module.ts` có trong `require.cache`) **rỗng**. Tiến trình `api` đối chứng thì khẳng định có nạp `folio.module.ts` và `payments.module.ts`, nên phép so sánh có nghĩa.
- **Bắt tái phát.** ARC chạy lại `test/worker-audit-registry.test.ts` trên bản xuất của nhánh: 4/4 đạt. Sau đó thử 2 đột biến:
  - bỏ `import './audit-entities'` khỏi `worker-jobs.ts` → **3/4 đỏ**;
  - bỏ một dòng `sales` khỏi tệp gom → **3/4 đỏ**.

  BE-B báo thêm hai kết quả mà ARC không chạy lại vì cần DB: (d) đỏ khi bỏ `hooks`, và cả 6 ca đỏ trên mã cũ với lỗi trùng log staging. Hai kết quả này khớp với cách viết test.
- **CI.** Đã đọc log CI run `40858172485` (commit `6d78ec8`), job `format · lint · audit · test · build`:
  - `✓ test/integration/s438-r8/r3-worker-only-jobs.test.ts (3 tests) 17663ms`;
  - `✓ test/worker-audit-registry.test.ts (4 tests)`;
  - `✓ r3-bug-037-worker-j15 (4 tests)`.

  Không có ký hiệu `↓` (bỏ qua). Thời gian 17,6 giây cho thấy test có chạy thật trên Postgres. Tổng: 138 tệp đạt, 2 tệp bỏ qua (`debt-fuzz`, `extend-62.perf`), giống trước.
- CI run `40861720879` trên head `a753201` **đang chạy** (job `docker images build · E2E smoke` chưa xong). Thay đổi giữa hai commit chỉ là tài liệu, nhưng vẫn đặt run này xanh làm điều kiện gộp.
- **Lỗ còn lại (Minor, WA-03):** chưa có kiểm tra cấu trúc rằng số listener theo từng loại sự kiện của worker bằng của api. Test (d) chỉ phủ K11 và B-13, không phủ listener reporting và `reservation.changed`. Nếu ai thêm `hooks.on('transitioned')` mới vào một `onModuleInit`, test sẽ không đỏ.

### 4. Rủi ro khi deploy: nhịp đầu xử lý dồn – **Phải đếm trước, xem WA-01 và WA-02**

Nhịp đầu tiên sau deploy sẽ chạy ba việc dồn:

**J15.** Đóng 5 folio `settled` quá cửa sổ trên staging. Mỗi lô tối đa 200 folio, nên hết trong một nhịp.

**J24.** Chuyển 2 payment `pending` quá hạn thành `expired`. Cả lô chạy trong một giao dịch.

**J1.** Hủy **mọi hold đã quá hạn từ trước tới nay**, tối đa 100 hold mỗi nhịp. Với mỗi hold:
- nhả `room_occupancy` và ghi outbox availability `hold.expired`;
- void đêm và folio (`money.voided`);
- đưa lead về `quoted` (`onHoldEnded`);
- void registration, thu hồi link khách;
- gửi push `hold_expired` cho người tạo hold và người chốt.

Hold đã nhận tiền (`kept_paid`) không bị hủy. Thay vào đó có push `hold_overdue_partial` cho FD/FDL và `hold_overdue_cap` cho MGR, có khóa chống trùng, nên chỉ gửi một lần cho mỗi hold.

Rủi ro:

| Rủi ro | Mức | Cách chặn/đếm |
|---|---|---|
| Hold quá hạn **trên production** thuộc booking thật: lễ tân tưởng hold vẫn "sống" vì J1 chưa từng chạy. Nhịp đầu sẽ hủy hold, nhả căn và gửi push | Major | WA-02: đếm READ ONLY trên production trước deploy. Nếu > 0, gửi danh sách mã (không kèm dữ liệu khách) cho lễ tân xử lý trước: gia hạn, xác nhận, hoặc để hệ thống hủy |
| Hold có yêu cầu giảm giá/FOC: `failed` ở **mọi nhịp**, vẫn giữ căn, log lỗi lặp lại | Minor (có sẵn, nay mới lộ) | Đếm trước. Nếu > 0, lễ tân hủy tay qua api (api có `ApprovalService`) |
| Dồn push/email tới nhân viên ở nhịp đầu | Thấp (10 căn, dữ liệu giả trên staging) | Đếm trước, báo nhân viên nếu số lớn |
| J1 nhả căn → outbox availability có thể đẩy tồn phòng sang kênh (nếu đã nối kênh) | Thấp | OPS ghi số dòng outbox mới sau nhịp đầu |

### 5. Đủ điều kiện gộp làm rc.6 không? – **Đủ, khi có các điều kiện cuối file**

`main` local đang đi trước `origin/main` 2 commit, đều là tài liệu (decision-log, OPS, QA, SEC). Hai commit này không chạm tệp nào của PR, nên không xung đột. ORC đẩy lên trước khi gộp để rc.6 mang đủ lịch sử.

## Thẻ feedback

### FB-R3-ARC-BEB-WA-01
- Mức độ: **Major** (thủ tục deploy staging rc.6, không sửa mã)
- Vị trí: quy trình deploy rc.6 lên staging; `outputs/OPS/j15-folio-close-check.md` mục 10.4
- Vấn đề: nhịp đầu xử lý dồn J1/J15/J24 (mục 4). Nếu không có số đếm trước, sẽ không phân biệt được "đúng như kỳ vọng" với "sai". rc.5 đã có lỗi im lặng kiểu này: job log `job done` trong khi mọi folio rollback.
- Vì sao quan trọng: bản sửa này chỉ được tính là đạt khi có bằng chứng từ DB. BUG-R3-037 đã bị mở lại một lần vì test xanh giả.
- Đề xuất sửa (OPS, trong `BEGIN READ ONLY … ROLLBACK`, chỉ in số đếm và mã đơn):
  - (a) **Trước deploy, đếm:**
    - `reservation` có `status = 'hold' AND hold_expires_at <= now()`, tách thành 3 nhóm: đã có tiền (kept_paid), có yêu cầu giảm giá/FOC trên folio, còn lại;
    - `folio` `settled` quá cửa sổ (kỳ vọng 5);
    - `payment` `pending` có `expires_at <= now()` (kỳ vọng 2).
  - (b) **Sau deploy, kiểm 2 nhịp đầu:**
    - `worker started` có 20 job;
    - không có `ERROR [` hay `job failed` ở **mọi** job;
    - `hold.expire` có `expired` bằng nhóm "còn lại" (chia theo lô 100), `failed` bằng nhóm FOC (kỳ vọng 0);
    - `folio.close` đóng 5 folio, có 5 audit `folio.closed`, OTM-00297 không có công nợ thứ hai;
    - 2 payment thành `expired`, có 2 audit `payment.expired`;
    - các hold vừa hủy có registration `void` và audit `reservation.hold_expired`.
  - (c) Bảng kết quả theo mẫu mục 10.1.
- Trạng thái: Open

### FB-R3-ARC-BEB-WA-02
- Mức độ: **Major** (thủ tục deploy production, không sửa mã)
- Vị trí: production rc.3 (`/opt/ottimo-prod`), kế hoạch đưa rc.6 lên trước Day D 02/11
- Vấn đề: production đang chạy cùng mã lỗi: J1, J15, J24 không làm được gì (BUG-R3-037/038/039). Production đã có dữ liệu thật từ B2 (chủ, phòng, giá). Nếu lễ tân đã nhập hold trước Day D, nhịp đầu sau deploy rc.6 sẽ hủy mọi hold quá hạn và nhả căn, mà lễ tân không biết trước.
- Vì sao quan trọng: thiếu rc.6 thì hold quá hạn giữ căn mãi (mất bán), VietQR không hết hạn, folio không đóng. Có rc.6 mà không báo trước thì lễ tân bất ngờ thấy đơn bị hủy.
- Đề xuất sửa:
  - (1) rc.6 lên production **chỉ sau khi** WA-01 đạt trên staging, và **trước** khi nhận hold, VietQR hay trả phòng thật.
  - (2) Ngay trước deploy production, chạy đúng các câu đếm của WA-01 (a) trên production (READ ONLY).
  - (3) Nếu có hold quá hạn: ORC gửi danh sách mã đơn, không kèm dữ liệu khách, cho lễ tân/chủ xác nhận trước. Đây là quy tắc vận hành đã chốt (hold hết hạn thì hủy), không phải quyết định mới, nên không cần ESC.
  - (4) Sau deploy, kiểm như WA-01 (b).
- Trạng thái: Open

### FB-R3-ARC-BEB-WA-03
- Mức độ: Minor (v1.0.1, gộp vào thẻ FB-R3-ARC-BEB-J15-05)
- Vị trí: `test/worker-audit-registry.test.ts`, `test/integration/s438-r8/r3-worker-only-jobs.test.ts` (d)
- Vấn đề: allowlist đã có kiểm tra cấu trúc (worker == api). Listener `ReservationHooks` thì chưa có. Test (d) chỉ kiểm K11 và B-13 qua dữ liệu, không kiểm listener reporting và `reservation.changed`. Một `hooks.on(...)` mới trong `onModuleInit` sẽ lọt, và worker lại lệch api như lần này.
- Vì sao quan trọng: đây là cùng một kiểu lỗi (thứ gì chỉ chạy khi Nest dựng module thì worker thiếu), chỉ khác đối tượng.
- Đề xuất sửa: trong tiến trình con, so số listener theo từng loại sự kiện (`created`, `transitioned`, `stay_changed`) và tập cổng `provide*` đã nối, giữa hooks của worker và hooks của một `createApplicationContext` api. Cổng chỉ api cần thì đưa vào danh sách ngoại lệ có ghi lý do. Cách khác: chuyển worker sang `NestFactory.createApplicationContext` (thẻ 05), khi đó test này không còn cần.
- Trạng thái: Open

### FB-R3-ARC-BEB-WA-04
- Mức độ: Minor (có từ trước, v1.0.1 cùng thẻ 05)
- Vị trí: `modules/reservations/public/worker-jobs.ts` (`FolioService` dựng không có `ApprovalService`) → `folio.service.ts` `voidReductionKeys` → `requireApprovals()`
- Vấn đề: hold quá hạn có folio mang yêu cầu giảm giá/FOC sẽ `failed` ở mỗi nhịp J1. Hold đó vẫn là `hold` và giữ `room_occupancy`. Hold lỗi xếp đầu lô (`ORDER BY hold_expires_at LIMIT 100`), nên nếu số hold lỗi vượt 100 thì các hold sau bị chặn. Với 10 căn, khả năng này rất thấp.
- Vì sao quan trọng: căn bị giữ tới khi lễ tân hủy tay, và log báo lỗi lặp lại mỗi phút.
- Đề xuất sửa: v1.0.1 dùng chung `ApprovalService` (thẻ 05). Với rc.6: OPS đếm nhóm này trong WA-01/02; nếu > 0, lễ tân hủy tay qua api.
- Trạng thái: Open

### FB-R3-ARC-BEB-WA-05
- Mức độ: Suggestion
- Vị trí: báo cáo BE-B mục 1; `modules/registration/public/worker-jobs.ts`; `product/docs/architecture.md`
- Vấn đề:
  - (1) Báo cáo ghi worker thiếu "22/31" loại; số đúng là 23/31.
  - (2) `registrationWorkerJobs` nay không còn ai gọi (worker dùng `registrationWorkerComposition`).
  - (3) Quy ước "allowlist ở `modules/<m>/audit-entities.ts`, nạp từ `*.module.ts` và tệp gom `src/audit-entities.ts`" chưa có trong tài liệu kiến trúc.
- Vì sao quan trọng: người viết module mới cần biết quy ước. Test sẽ đỏ nếu quên, nhưng biết trước thì đỡ mất công.
- Đề xuất sửa: BE-B sửa con số và bỏ hàm thừa ở lần chạm mã tới. ARC ghi quy ước vào `architecture.md` và `CONTRIBUTING.md` (ARC tự nhận).
- Trạng thái: Open

## Điều kiện

**Gộp vào `main` làm rc.6:**
1. CI run `40861720879` trên `a753201` xanh toàn bộ, gồm cả `docker images build · E2E smoke`.
2. Không đổi mã sau `a753201`. Nếu đổi, ARC review lại phần chênh.
3. ORC đẩy 2 commit tài liệu đang có ở `main` local lên trước khi gộp (không xung đột).

**Sau deploy staging (QA/OPS):**
4. Đạt WA-01 (a) và (b) trên DB staging, ghi kết quả vào `j15-folio-close-check.md` (mục mới).
5. Kiểm xong mới đóng BUG-R3-037/038/039. Riêng BUG-R3-039 đóng khi hold quá hạn trên staging về 0, trừ nhóm FOC nếu có và đã ghi rõ.

**Production:**
6. rc.6 lên production trước Day D, theo WA-02.

Không cần ARC review lại nếu các điều kiện trên đạt và mã không đổi.

## Điểm làm tốt
- Sửa đúng gốc chung cho cả 3 job: allowlist tách khỏi Nest, có tệp gom. BE-B còn tự rà cả 20 job và phát hiện thêm J1 cùng lỗi, thay vì chỉ vá J15/J24.
- Test lần này chạy trong tiến trình Node riêng và tự khẳng định "không nạp `*.module.ts`". Đây đúng là chỗ test (b) cũ hở. Có bằng chứng đỏ trên mã cũ, xanh sau sửa, và đã thử đột biến cho phần hooks.
- Listener được nối bằng **cùng một hàm** cho cả module lẫn worker, nên api không đổi hành vi và hai tiến trình khó lệch nhau. Báo cáo ghi rõ phần chưa sửa (FOC, thẻ 05), không nói quá.
