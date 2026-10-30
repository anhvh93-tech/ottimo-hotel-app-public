# J15 `folio.close` không đóng folio trên staging – kết quả kiểm

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** (hỗ trợ QA, `qa3-rc1.md` 17.8) | 28/10/2026 06:20–06:40 giờ VN
- Phạm vi: đọc mã trong `product/`; staging `/opt/ottimo` **chỉ đọc** (`dc ps`, `dc logs worker`, `grep` trong container worker, `SELECT` trong giao dịch `READ ONLY` rồi `ROLLBACK`).
- Không làm: ghi DB, restart/redeploy, đổi cấu hình, chạy job tay, duyệt deployment, gắn tag. **Không đụng `/opt/ottimo-prod`**, kể cả đọc.
- Lỗi đã ghi: **BUG-R3-037** trong `rounds/round-03/qa/bug-list.md`.

## 1. Kết luận

**Job không chạy.** J15 `folio.close` **không được đăng ký trong tiến trình worker**, nên không bao giờ chạy theo lịch. Điều kiện chọn folio, cách tính cửa sổ và dữ liệu đều đúng.

| Câu hỏi | Trả lời |
|---|---|
| Nguyên nhân | `src/worker.ts` tự dựng `JobRegistry` riêng và đăng ký từng job bằng tay. J15 chỉ được đăng ký trong `FolioModule.onModuleInit()`, tức registry của **tiến trình api** (Nest). Tiến trình api không có vòng tick; registry đó chỉ dùng cho endpoint test-support `runOnce`. |
| Loại | Job không chạy. Không phải điều kiện sai, không phải hành vi đúng thiết kế. |
| Mức đề xuất | **P1** (lý do ở mục 5) |
| Chặn v1.0.0? | Đề xuất **có**: sửa nhỏ, nên vào rc.5 trước tag. Phương án dự phòng ở mục 6. |
| Production | **Gần như chắc chắn bị y hệt** (suy từ repo, mục 4). |
| Sửa | BE-B đăng ký J15 trong worker + test chặn lặp lại; ARC chốt một nguồn danh sách job; OPS thêm kiểm danh sách job sau deploy (mục 6). |

## 2. Đọc mã J15

| Hạng mục | Mã | Ghi chú |
|---|---|---|
| Định nghĩa job | `product/services/api/src/modules/folio/public/folio-close-job.ts` | Khóa `folio.close`, lịch `{ kind: 'tick' }` – chạy mỗi nhịp worker, không có slot `job_run` |
| Điều kiện chọn | cùng tệp, dòng 42–46 | `status = 'settled' AND post_checkout_window_until <= now`, tối đa 200 folio/nhịp/cơ sở. **Đúng.** |
| Xử lý từng folio | `folio.service.ts` `closeAfterWindow` (~dòng 1351–1450) | Khóa đơn → folio; còn nợ thì ghi 1 công nợ `post_checkout_unpaid`; có tiền dư chưa xử lý thì mở "Cần chú ý" `closed_reservation_credit` và chờ; xong thì `closed` + audit `folio.closed`. Mỗi folio một giao dịch, lỗi một folio không chặn folio khác. |
| Cách tính cửa sổ | `folio.service.ts` (lúc B18 chốt folio, ~dòng 1320) | `post_checkout_window_until = thời điểm trả phòng + post_checkout_charge_hours` (24 giờ). **Giờ tuyệt đối**, không theo ngày nghiệp vụ. Không có lỗi ngày nghiệp vụ ở đây. |
| Khóa ghi sau cửa sổ (N-15) | `folio-lines.service.ts` ~dòng 489–499 | Quá cửa sổ thì ghi dòng bị `409 FOLIO_LOCKED` ngay cả khi J15 chưa đóng – đây là lý do QA gặp 409 ở OTM-00239 |
| Đăng ký trong api (Nest) | `folio.module.ts` dòng 196–198 | `this.jobs.register(folioCloseJob(...))` – registry của api |
| Vòng tick thật | `src/worker.ts` dòng 42–79, 110–146 | `new JobRegistry()` riêng, đăng ký tay: builtin, reservations, registration, J24, late-fee review, J2, J10, T13, housekeeping, guests, public-site. **Không có `folioCloseJob`.** `setInterval(tick, 60_000)` chỉ chạy các khóa trong registry này |
| Test | `product/tests/e2e/clock/*.spec.ts`, `services/api/test/integration/*` | Gọi `folio.close` qua endpoint test-support → registry của **api**, nên luôn xanh. Không test nào so danh sách job của worker. |

Đối chiếu toàn bộ khóa job trong mã với danh sách worker: **chỉ `folio.close` thiếu**. Các job khác đều được đăng ký ở cả hai nơi.

Lịch sử: J15 vào mã ngày 18/10 (`4274994`, R2 Sprint 4). `worker.ts` tại `v1.0.0-rc.1`, `v1.0.0-rc.3`, `d12cda6` (rc.4) và `HEAD` đều **không** có `folio`.

## 3. Bằng chứng trên staging (chỉ đọc, 28/10 ~06:24)

**3.1 Container** (`dc ps`): api, web, worker cùng image `ottimo-api:sha-d12cda6f26a4` (rc.4); worker Up 5 giờ, lệnh `node dist/worker.js`.

**3.2 Log worker**
- Dòng khởi động 27/10 18:00:54 UTC (01:00:54 giờ VN 28/10) `"msg":"worker started"` liệt kê **19 job**: `guest.document_profile_anonymize, guest_request.purge, guest_request.sla, hk.daily, hold.expire, hold.remind, idempotency.purge, late_fee.post_review_overdue, lease.nights, log.partitions, ooo.activate, payment.expire, public_site.cleanup, registration.deadline, retention.purge, web_request.purge, web_request.sla, web_request.stale, work_order.sla`. **Không có `folio.close`.**
- `grep -ciE "folio.close|J15"` trên log worker 72 giờ: **0 dòng**.
- 6 giờ gần nhất: các job tick chạy đều 323 lần (`hold.expire`, `payment.expire`…). Worker sống và tick bình thường.

**3.3 Mã trong image đang chạy**: `/app/dist/worker.js` – `grep -c folio-close` = **0**; `registrationWorkerJobs` = 1 (đối chứng: đúng tệp).

**3.4 DB staging** (`BEGIN READ ONLY … ROLLBACK`, giờ VN, không đọc dữ liệu khách):

| Đơn | Đơn | Folio | version | Chốt lúc | Hết cửa sổ | `closed_at` |
|---|---|---|---|---|---|---|
| OTM-00239 | `checked_out` | `settled` | 11 | 25/10 12:26:22 | **26/10 12:26:22** | trống |
| OTM-00294 | `checked_out` | `settled` | 9 | 27/10 06:01:23 | **28/10 06:01:23** | trống |
| OTM-00297 | `checked_out` | `settled` | 7 | 27/10 06:01:51 | **28/10 06:01:51** | trống |

- Cả 3 có `post_checkout_window_until` hợp lệ (không rỗng) và đã qua lúc kiểm (06:24) → khớp điều kiện của J15, đúng như QA thấy.
- Toàn DB: 5 folio `settled`, **3 đã quá cửa sổ** (đúng 3 đơn trên); 0 folio `closed`.
- `audit_event` hành động `folio.closed`: **0 bản ghi từ trước tới nay** → J15 chưa từng chạy trên staging.

Không cần chạy job tay để chứng minh: mã, image, log khởi động và DB cùng chỉ một nguyên nhân. Nếu ORC vẫn muốn một bằng chứng chạy được, xem mục 7.

## 4. Production có bị không? (chỉ suy từ repo)

**Gần như chắc chắn có**, cùng nguyên nhân:
- `product/infra/docker-compose.prod.yml` dùng cho cả staging và production (`infra/server/bin/dc`); dịch vụ `worker` cùng image api, `command: ['node', 'dist/worker.js']` (dòng 188–191).
- Production chạy image rc.3 (`rounds/round-03/outputs/OPS/v1-production.md` dòng 701). `worker.ts` tại `v1.0.0-rc.3` không có J15. Không có biến môi trường hay cờ cấu hình nào bật/tắt J15 – thiếu là thiếu trong mã.
- Hiện production chưa có khách thật trả phòng, nên **chưa có folio nào bị kẹt**. Lỗi bắt đầu có tác dụng từ lượt trả phòng thật đầu tiên sau ngày D (02/11), cửa sổ hết sau 24 giờ.
- OPS **không** kiểm production (theo lệnh). Sau khi sửa, kiểm bằng log khởi động worker production (mục 6.3), chỉ đọc.

## 5. Mức lỗi và tác động với ngày D 02/11

**Đề xuất P1.** Theo `test-strategy.md` mục 8, không sai số tiền và không mất dữ liệu (nên không P0), nhưng một quy tắc tiền nghiệp vụ cốt lõi (BR-427 (d), BR-525, A19) hoàn toàn không chạy trên production.

Từ lượt trả phòng thật đầu tiên (02/11), mỗi folio sẽ ở `settled` mãi:

| Tác động | Mức |
|---|---|
| Khoản ghi trong 24 giờ sau trả phòng (minibar, giặt, hư hỏng…) mà khách chưa trả **không thành công nợ** `post_checkout_unpaid` → không vào danh sách công nợ, không có hạn thu, dễ bị quên thu | Tiền – chính |
| Tiền dư sau cửa sổ (trả thừa, A32 giảm dòng) mà chưa có yêu cầu hoàn **không sinh "Cần chú ý" `closed_reservation_credit`** → tiền của khách có thể nằm im không ai biết | Tiền – chính |
| Yêu cầu hoàn mở vượt số dư không được J15 lập lại (BUG-R3-012/013) | Tiền – phụ |
| Mục "tiền dư đơn đã đóng" của BUG-R3-034 không tự hết sau 24 giờ như mô tả ở lỗi đó – kéo dài vô hạn | Báo động giả |
| Nút **Thêm phát sinh** hiện trên mọi đơn cũ; lễ tân bấm sẽ gặp 409 `FOLIO_LOCKED` | Khó chịu, không sai dữ liệu (N-15 vẫn khóa) |
| Ca `closed` của BUG-R3-022 không kiểm được trên staging | Chặn kiểm thử |

Điều giảm nhẹ:
- Khóa ghi N-15 vẫn chặn đúng sau cửa sổ, nên **không có bút toán sai**.
- Số "còn phải thu" của folio vẫn hiện đúng; lễ tân vẫn thu được.
- **Tự lành khi sửa**: điều kiện là `post_checkout_window_until <= now`, nên lần tick đầu sau khi deploy bản sửa sẽ đóng hết folio tồn (200 folio/nhịp). Không mất dữ liệu, chỉ chậm. Công nợ ghi muộn có hạn thu tính từ lúc J15 chạy, không từ lúc hết cửa sổ.

## 6. Đề xuất sửa (OPS không tự sửa mã)

1. **BE-B (chính) – sửa lỗi:** đăng ký J15 trong `src/worker.ts`, cùng kiểu các job khác. Ví dụ dựng `FolioService` + `ReservationHooks` cho worker, hoặc tách `folioWorkerJobs(deps)` như `reservationWorkerJobs`. Phải nối đủ `provideDebtOnCheckout` và `provideOpenDebt` của frontdesk cho hooks; nếu thiếu, J15 sẽ ném lỗi ở mọi folio còn nợ.
   - Test bắt buộc (đỏ trước khi sửa): khởi động registry của worker và kiểm danh sách khóa **bằng** danh sách của registry Nest (hoặc ít nhất có `folio.close`). Một test integration chạy J15 qua `JobRunner` của worker, không qua test-support.
2. **ARC – chặn lặp lại:** hai nơi đăng ký job đang lệch nhau mà không ai biết. Đề xuất một danh sách job dùng chung cho cả worker và api, hoặc worker khởi động bằng Nest application context. Có thể để v1.0.1; test ở bước 1 đủ chặn cho v1.0.0.
3. **OPS – kiểm sau deploy:** thêm vào `deploy.sh` / smoke sau deploy một bước đọc dòng `worker started` và so với danh sách job bắt buộc (có `folio.close`). Thiếu thì deploy báo đỏ. OPS làm khi ORC giao, cùng rc.5.
4. **QA – sau khi sửa (staging):**
   - Lần tick đầu, OTM-00239/294/297 phải thành `closed`. OTM-00297 (còn nợ 150.000) phải có công nợ (hoặc giữ công nợ đang mở nếu B18 đã ghi đủ).
   - Kiểm lại ca `closed` của BUG-R3-022 và BUG-R3-034.
   - Log worker có `"job":"folio.close"` hoặc không có `job failed` cho `folio.close`.

## 7. Nếu cần chạy job tay trên staging để chứng minh (chưa làm – chờ ORC)

- Không cần cho kết luận. Nếu ORC muốn: gọi endpoint test-support `runOnce('folio.close')` trên staging (chỉ khi staging bật test-support), hoặc dùng bản sửa ở bước 1.
- Ảnh hưởng: sẽ **đóng thật** 3 folio trên (không đảo được), có thể ghi công nợ cho OTM-00297. QA không còn ca `settled` quá cửa sổ để so.
- Người chạy: QA hoặc OPS, khi ORC đồng ý. OPS không tự chạy.

## 8. Phương án nếu không kịp sửa trước tag v1.0.0

Không khuyến nghị. Nếu ORC/QC chọn phát hành rc.4 làm v1.0.0:
- Ghi BUG-R3-037 là known issue.
- Hotfix v1.0.1 trong tuần đầu sau 02/11; tự lành như mục 5.
- Tới lúc đó, MGR xem tay mỗi sáng các đơn đã trả phòng hơn 24 giờ mà folio còn nợ hoặc còn dư (lọc trên Desk), ghi công nợ hoặc yêu cầu hoàn bằng tay.

## 9. Giả định

- Production đang chạy image rc.3 như `v1-production.md` ghi; không kiểm trên máy chủ (theo lệnh).
- Mức P1 là đề xuất của OPS; QA/QC chốt.
- Lệnh SSH dùng host đã có sẵn trong `known_hosts` (kiểm khóa máy chủ nghiêm ngặt). `~/.ssh/config` không có mục cho staging. Không ghi IP vào repo.

## 10. rc.5 trên staging 29/10

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 29/10/2026 17:02–17:06 giờ VN, ngay sau CI run 40615225724 deploy staging.
- Bản kiểm: rc.5 = `1078b5b` (rc.4 + BUG-R3-037). Điều kiện kiểm theo `reviews/ARC-on-BE-B-j15-fix.md` thẻ FB-R3-ARC-BEB-J15-02.
- Cách làm như mục 3: SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`; `dc ps`, `dc logs worker`, `docker inspect`; SQL trong `BEGIN READ ONLY … ROLLBACK`. Không ghi DB, không restart, không deploy, không chạy job tay. **Không đụng `/opt/ottimo-prod`.** Không in env, bí mật, IP hay dữ liệu khách.

### 10.1 Kết luận: **CHƯA ĐẠT**

J15 nay **đã đăng ký và chạy** trong worker (BUG-R3-037 phần "không đăng ký" đã hết), nhưng **không đóng được folio nào**. Mỗi nhịp, J15 lỗi ở cả 5 folio với `AuditEntityNotRegisteredError`, mỗi folio rollback giao dịch riêng, nên dữ liệu không sai nhưng cũng không đổi. Đúng kiểu lỗi im lặng ARC cảnh báo ở thẻ 02: job vẫn log `job done`, không có `job failed`.

| Hạng mục | Kết quả | Đạt? |
|---|---|---|
| Image api/worker | api, web, worker cùng `ottimo-api`/`ottimo-web:sha-1078b5b5574a` (khớp `1078b5b5574a…`), tạo 17:00:55 | Đạt |
| Sức khỏe | api, web `healthy`; worker `running`, `RestartCount=0` (worker không có healthcheck theo thiết kế compose) | Đạt |
| `worker started` | 20 job, **có `folio.close`** (rc.4: 19 job) | Đạt |
| J15 chạy | 2 nhịp (17:00:58, 17:01:58), mỗi nhịp `{"msg":"job done","job":"folio.close"}` | Đạt |
| Không có `ERROR [J15]` | **10 dòng** `ERROR [J15] folio <id>: AuditEntityNotRegisteredError` (5 folio × 2 nhịp) | **Chưa** |
| 3 folio thành `closed` | OTM-00239/00294/00297 vẫn `settled`, `closed_at` trống, version 11/9/7 (không đổi so với 28/10) | **Chưa** |
| 3 audit `folio.closed` | 0 | **Chưa** |
| OTM-00297 công nợ | Đã có từ B18: mở 27/10 06:01:51, ghi 150.000, hạn 30/10, chưa tất toán. Không có công nợ thứ hai | Đạt |
| Folio `settled` quá cửa sổ | **5** (kỳ vọng 0): 3 đơn trên + OTM-00357 (hết cửa sổ 29/10 00:15) + OTM-00365 (29/10 06:03) | **Chưa** |

### 10.2 Nguyên nhân (đọc mã, chỉ đọc)

- `pickAuditFields` (`modules/audit/public/audit-fields.ts` dòng 41–47) ném `AuditEntityNotRegisteredError` khi loại thực thể chưa có allowlist.
- Allowlist được đăng ký bằng lệnh `defineAuditEntity(...)` chạy **khi nạp tệp module**: `folio.module.ts` dòng 33–91 (`folio`, `folio_line`, `approval_request`, `reservation` phần tiền…), `payments.module.ts` dòng 29–50 (`payment`, `deposit_notice`, `approval_request`).
- Worker không dựng Nest và **không import** `folio.module.ts` hay `payments.module.ts` (`worker.ts`, `worker-jobs.ts`, `folio/public/worker-jobs.ts`, `payments/public/worker-hooks.ts` chỉ import service). Nên trong tiến trình worker, loại `folio` (và `payment`) không có allowlist → J15 ghi audit `folio.closed` là ném lỗi → rollback.
- Test (b) của BE-B xanh vì registry allowlist là biến toàn cục của tiến trình test: tiến trình vitest có nạp các tệp module (qua app Nest/fixture), nên che mất lỗi. Đây là cùng gốc với thẻ FB-R3-ARC-BEB-J15-05 (worker dựng tay, lệch với container Nest).

### 10.3 Phát hiện thêm: `payment.expire` cũng lỗi cùng gốc (có từ trước rc.5)

- Log worker rc.5: mỗi nhịp `{"level":"error","msg":"job failed","job":"payment.expire","err":"audit before/after for entity type payment without an allowlist – call defineAuditEntity()"}`.
- DB staging: **2 payment `pending` đã quá `expires_at`** (cũ nhất từ 27/10 06:00) chưa bao giờ thành `expired`; audit hết hạn payment = 0 bản ghi từ trước tới nay.
- `worker.ts` ở rc.4 (`d12cda6`) cũng không import `payments.module.ts`, nên lỗi này **không do rc.5 sinh ra**; nó chỉ lộ khi có payment cần hết hạn. Báo cáo 28/10 mục 3.2 ghi `payment.expire` "chạy đều" là đúng về lịch, nhưng không thấy lỗi vì lúc đó OPS chỉ đếm dòng tick, không lọc `job failed` của job khác. OPS ghi nhận thiếu sót này.
- Tác động production (suy từ mã, không kiểm): mã VietQR `pending` không tự hết hạn; đơn giữ chỗ chờ cọc có thể không được nhả đúng lúc nếu luồng nhả phụ thuộc trạng thái payment. Đề xuất QA ghi lỗi mới (đề xuất **P1**, cùng gốc BUG-R3-037) và BE kiểm các job worker khác có ghi audit loại thực thể chỉ đăng ký trong tệp `*.module.ts`.

### 10.4 Đề xuất (OPS không tự sửa mã)

1. **BE-B:** cho worker nạp allowlist audit. Cách gọn nhất: tách các `defineAuditEntity(...)` của từng module ra tệp `audit-entities.ts` (không phụ thuộc Nest) và import tệp đó từ cả `*.module.ts` lẫn `worker-jobs.ts`/`worker-hooks.ts`; hoặc `worker.ts` import một tệp gom tất cả allowlist.
   - Test bắt buộc: chạy J15 và `payment.expire` trong **tiến trình con chỉ nạp `worker-jobs.ts`** (hoặc reset registry allowlist trước test), kiểm folio thành `closed` và có `folio.closed`; thêm test "mọi `entity_type` mà job worker ghi audit đều có allowlist khi chỉ nạp worker".
2. **ARC:** thẻ 05 (worker khởi động bằng `NestFactory.createApplicationContext`) chặn tận gốc cả hai lỗi; nên cân nhắc kéo sớm nếu sửa ở bước 1 phình to.
3. **OPS (khi ORC giao):** kiểm sau deploy bổ sung: (a) `worker started` có đủ job bắt buộc; (b) 2 nhịp đầu không có `ERROR [` hay `job failed` trong log worker; báo đỏ nếu có.
4. **Sau bản sửa (rc.6), kiểm lại đúng bảng 10.1.** Kỳ vọng tick đầu đóng 5 folio (không chỉ 3), có 5 audit `folio.closed`, OTM-00297 không có công nợ thứ hai; 2 payment `pending` quá hạn thành `expired`.

### 10.5 Giả định

- Thời gian deploy lấy theo `CreatedAt` container (17:00:55) và `StartedAt` worker (10:00:56Z); log worker đọc 30 phút gần nhất (39 dòng, bao trọn từ lúc khởi động).
- Worker không có healthcheck trong `docker-compose.prod.yml`; "healthy" của worker hiểu là `running`, không restart, có dòng `worker started`.
- Trạng thái công nợ đọc từ các cột `reservation.debt_*`; không đọc lý do ghi nợ hay dữ liệu khách ra báo cáo ngoài trạng thái/số tiền.
- Mức P1 cho lỗi `payment.expire` là đề xuất của OPS; QA/QC chốt.

## 11. rc.6 – mốc trước deploy staging

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 29/10/2026 18:07–18:10 giờ VN, staging còn chạy rc.5, **trước** deploy rc.6.
- Làm theo thẻ FB-R3-ARC-BEB-WA-01 (a) và checklist rc.6 phần A (`qa/bug-list.md`).
- Cách làm như mục 10: SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`, host lấy từ phân giải `desk.staging.ottimo.vn` (khớp `known_hosts`); `dc ps`, `docker inspect`, `dc logs worker`; SQL trong `BEGIN READ ONLY … ROLLBACK`, `ON_ERROR_STOP`.
- Không ghi DB, không restart, không deploy, không chạy job tay. **Không đụng `/opt/ottimo-prod`.** Không in env, bí mật, IP hay dữ liệu khách; chỉ in mã đơn, mã phiếu thu, số đếm.

### 11.1 Bảng mốc (DB lúc 18:08:28 giờ VN)

| Hạng mục | Số | Mã | Kỳ vọng ARC/QA | Ghi chú |
|---|---|---|---|---|
| Hold quá hạn (`status='hold' AND hold_expires_at <= now()`) | **0** | – | ghi N | Staging hiện **không có đơn `hold` nào** (cả chưa quá hạn: 0). Hold tạo gần nhất lúc 27/10 10:48 nay không còn `hold`; chưa đơn nào bị hủy vì hết hạn (mọi đơn hủy đều do người dùng) |
| – nhóm 1: đã có tiền/cọc (`kept_paid`) | 0 | – | – | Cùng công thức `FolioService.depositPaid` |
| – nhóm 2: có yêu cầu FOC/giảm giá (`pending`/`escalated` hoặc `approved` còn hiệu lực) | 0 | – | 0 | Cùng điều kiện `reductionRequests`, nhóm này sẽ `failed` trên rc.6 (BUG-R3-039, giới hạn còn lại) |
| – nhóm 3: còn lại (sẽ bị hủy ở nhịp đầu) | 0 | – | – | – |
| Folio `settled` quá `post_checkout_window_until` | **5** | OTM-00239 (hết cửa sổ 26/10 12:26, v11), OTM-00294 (28/10 06:01, v9), OTM-00297 (28/10 06:01, v7), OTM-00357 (29/10 00:15, v11), OTM-00365 (29/10 06:03, v12) | 5 | **Khớp.** Toàn DB: `open` 361, `settled` 5, `closed` 0 |
| Payment `pending` có `expires_at <= now()` | **2** | PT-000444 (OTM-00352, VietQR, hết hạn 27/10 06:00), PT-000458 (OTM-00361, VietQR, hết hạn 28/10 06:00) | 2 | **Khớp** |
| Audit `folio.closed` | **0** | – | 0 | Từ trước tới nay. Cùng lúc: `payment.expired` 0, `reservation.hold_expired` 0 |
| Công nợ OTM-00297 | 1 khoản | mở 27/10 06:01, 150.000, hạn 30/10, chưa tất toán | đúng 1 khoản | Không đổi so với mục 10.1 |
| Đơn theo trạng thái | – | `cancelled` 353, `confirmed` 6, `in_house` 2, `checked_out` 5, `hold` 0 | – | Lý do hủy: 0 đơn `hold_expired` |

### 11.2 Image và worker đang chạy

| Container | Image | Tạo lúc (UTC) | Restart |
|---|---|---|---|
| api | `ottimo-api:sha-1078b5b5574a` (rc.5) | 29/10 10:00:55 | 0, `healthy` |
| worker | `ottimo-api:sha-1078b5b5574a` (rc.5) | 29/10 10:00:55 | 0, `running` |
| web | `ottimo-web:sha-1078b5b5574a` (rc.5) | 29/10 10:00:55 | 0, `healthy` |
| postgres | `postgres:17-alpine` (digest cố định) | – | Up 3 ngày, `healthy` |

Log worker 3 phút gần nhất (18:05–18:08): mỗi nhịp `job done` cho `folio.close` và `hold.expire`; `job failed` cho `payment.expire` (BUG-R3-038); 5 dòng `ERROR [J15] … AuditEntityNotRegisteredError` mỗi nhịp (BUG-R3-037). Đúng tình trạng rc.5 ở mục 10.

### 11.3 Điều cần biết khi kiểm sau deploy (WA-01 (b), checklist B–F)

1. **Lọc `ERROR [` phải bỏ mã màu trước.** Nest logger trong worker in mã màu ANSI giữa `ERROR` và `[J15]`, nên `grep -c "ERROR \["` trên `dc logs --no-color` cho **0** dù có 15 dòng lỗi (đã thử lúc 18:08). Lệnh đúng: `dc logs --no-color --since <mốc> worker | sed 's/\x1b\[[0-9;]*m//g' | grep -cE 'ERROR \[|job failed'`. OPS sẽ dùng cách này cho mọi job ở 2 nhịp đầu.
2. **Số `expired`/`failed` của `hold.expire` không có trong log.** `worker.ts` (cả trên nhánh rc.6 `fix/worker-audit-registry`) chỉ log `{"msg":"job done","job":…,"properties":n}`; kết quả của handler tick bị bỏ, không ghi `job_run`. Lỗi từng hold rollback trong savepoint và **không** in dòng nào. Vì vậy mục C "đọc `failed` trong `job done`" không làm được: OPS/QA lấy bằng chứng từ DB (trạng thái đơn, `cancel_reason_code`, audit `reservation.hold_expired`, `room_occupancy.active`). Đề xuất BE-B/ARC cho worker log `stats` của job tick (v1.0.1, gộp thẻ FB-R3-ARC-BEB-J15-05), OPS không tự sửa mã.
3. **Hold: N = 0 nên nhịp đầu rc.6 sẽ không hủy đơn nào.** Kỳ vọng sau deploy: audit `reservation.hold_expired` mới = 0, không đơn nào đổi trạng thái vì J1. BUG-R3-039 trên staging chỉ chứng minh được qua ca tạo hold mới (checklist F, dữ liệu giả, hạn ngắn) – ca này là bằng chứng duy nhất cho J1.
4. Kỳ vọng còn lại giữ như ARC: 5 folio trên thành `closed`, 5 audit `folio.closed`, OTM-00297 không có công nợ thứ hai; PT-000444, PT-000458 thành `expired`, 2 audit `payment.expired`.

### 11.4 Giả định

- Nhóm "đã có tiền" tính đúng công thức `FolioService.depositPaid` (biên lai `deposit` `succeeded`, không tính dòng đảo, giới hạn bởi tiền còn giữ); nhóm FOC tính đúng điều kiện `FolioService.reductionRequests` (gồm cả yêu cầu đã duyệt còn hiệu lực, không chỉ "chờ duyệt"), xét sau nhóm 1 vì J1 trả `kept_paid` trước khi đụng folio. Với N = 0 hai cách tính không ảnh hưởng kết quả.
- Giờ "hết cửa sổ" và "hết hạn" đổi sang giờ VN (`Asia/Ho_Chi_Minh`).
- Mốc chỉ đúng tại 18:08:28. Nếu QA/E2E tạo hold hay VietQR trên staging trước khi deploy rc.6, OPS chạy lại cùng truy vấn ngay trước deploy.

## 12. rc.6 trên staging – sau deploy

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 29/10/2026 18:59–19:01 giờ VN, ngay sau CI run 40865799549 deploy staging.
- Bản kiểm: rc.6 = `main` `8b3aec8` (`8b3aec89486f…`, gộp PR #14: BUG-R3-037/038/039). Tiêu chí: thẻ FB-R3-ARC-BEB-WA-01 (b) và checklist rc.6 phần B, C, D, E (phần DB) trong `qa/bug-list.md`. Mốc so sánh: mục 11.
- Cách làm như mục 11: SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`; `dc ps`, `docker inspect` (qua `sudo -u ottimo`), `dc logs --no-color --timestamps worker` rồi **bỏ mã màu ANSI** (`sed 's/\x1b\[[0-9;]*m//g'`, kiểm lại còn 0 ký tự ESC) trước khi lọc; SQL trong `BEGIN READ ONLY … ROLLBACK`, `ON_ERROR_STOP`, giờ `Asia/Ho_Chi_Minh`.
- Không ghi DB, không restart, không deploy, không chạy job tay. **Không đụng `/opt/ottimo-prod`.** Không in env, bí mật, IP hay dữ liệu khách; chỉ in mã đơn, mã phiếu thu, số bill, số đếm.

### 12.1 Kết luận: **ĐẠT** (phần OPS của WA-01 (b), checklist B, C, D-DB, E-DB)

Nhịp đầu sau deploy (18:57:57) J15 đóng đủ 5 folio, J24 chuyển 2 payment sang `expired`, mỗi việc có audit tương ứng. 3 nhịp đầu không có dòng lỗi nào ở mọi job. Nhịp 2 và 3 không xử lý lại gì.

| Hạng mục | Kết quả | Đạt? |
|---|---|---|
| Image | api, worker `ottimo-api:sha-8b3aec89486f`; web `ottimo-web:sha-8b3aec89486f` (khớp `8b3aec89486f0f01…`); `state/current_tag` = `sha-8b3aec89486f`. Tạo 11:57:53Z (18:57:53 giờ VN) | Đạt |
| Sức khỏe | api, web `healthy`; worker `running` (không có healthcheck theo thiết kế); `RestartCount` = 0 cả ba, kiểm lại lúc 19:00:48 | Đạt |
| `worker started` | 18:57:57, **20 job**, có `folio.close`, `payment.expire`, `hold.expire` | Đạt |
| Log worker 3 nhịp (18:57:57, 18:58:57, 18:59:57) | 43 dòng; mỗi nhịp 14 job tick `job done`. Sau khi bỏ ANSI: **0** `ERROR [`, **0** `job failed`, **0** dòng mức khác `info` | Đạt |
| J15: 5 folio | OTM-00239/00294/00297/00357/00365 → `closed`, `closed_at` = 18:57:57.096, version +1 (12/10/8/12/13). Folio quá cửa sổ còn **0**. Toàn DB: `closed` 5, `open` 361, `settled` 0 | Đạt |
| Audit `folio.closed` | **5** (F26-000001…000005, `actor_type=system`, 18:57:57), nối đúng 5 folio trên; trước deploy 0 | Đạt |
| OTM-00297 công nợ | Vẫn **1** khoản: mở 27/10 06:01:50, 150.000, hạn 30/10, chưa tất toán (không đổi). Audit `debt` duy nhất là `reservation.debt_on_checkout` 27/10; audit loại `debt` sau deploy toàn DB: 0. Sau deploy đơn này chỉ có 1 audit `folio.closed` | Đạt |
| J24: 2 payment | PT-000444, PT-000458 → `expired` (18:57:57.657, version 2); 2 audit `payment.expired` (`system`, before `pending`, after `expired`); 2 `state_transition` SM-12 `pending→expired`. Payment `pending` quá hạn còn **0** | Đạt |

### 12.2 Đối chiếu khác với mốc mục 11

- Audit sau deploy toàn DB (tới 19:00:40): `folio.closed` 5, `payment.expired` 2, `auth.login_succeeded` 1 (người dùng đăng nhập, không phải job). Không có audit nào khác do worker ghi.
- Hold: 0 đơn `hold`, 0 quá hạn, audit `reservation.hold_expired` 0 – đúng kỳ vọng N = 0 ở 11.3 mục 3. Đơn theo trạng thái không đổi (`cancelled` 353, `confirmed` 6, `in_house` 2, `checked_out` 5).
- Nhịp 2, 3 không đóng thêm folio, không thêm audit: mọi `closed_at` và audit đều thuộc nhịp 18:57:57.

### 12.3 Giới hạn của lần kiểm này (chuyển QA)

1. **6/20 job là job theo lịch (slot)**, không chạy trong 3 nhịp: `guest.document_profile_anonymize`, `hk.daily`, `lease.nights`, `log.partitions`, `web_request.purge`, `web_request.stale`. "0 lỗi ở mọi job" ở đây nghĩa là 14 job tick đã chạy. Đề xuất QA/OPS đọc lại log worker sau lần chạy slot kế tiếp của 6 job này (cùng lệnh lọc).
2. `hold.expire` với N = 0 không chứng minh được BUG-R3-039; như 11.3 mục 2–3, chỉ ca hold mới (checklist F) mới là bằng chứng. Số `failed` của job tick vẫn không có trong log.
3. Checklist D (ca BUG-R3-022, 034 trên giao diện), E (tạo VietQR mới hạn ngắn, nhả/giữ đơn), F (hold mới) cần QA thao tác trên staging; OPS chỉ đọc.
4. Mục G (cập nhật trạng thái 037/038/039 trong `bug-list.md`, ghi `qa3-rc1.md`) là việc của QA; OPS không sửa.

### 12.4 Giả định

- Mốc deploy lấy theo `StartedAt` worker 11:57:55Z; log đọc `--since 11:57:50Z`, bao trọn từ lúc khởi động.
- Công nợ đọc từ các cột `reservation.debt_*` (mỗi đơn chỉ một khoản); "không có bản thứ hai" kiểm bằng `debt_opened_at`/`debt_recorded_vnd` không đổi và không có audit `*debt*` mới.
- Audit `folio.closed` mang `entity_code` là số bill (F26-…), không phải mã đơn; nối về đơn qua `folio.primary_reservation_id`.

## 13. Production trước deploy rc.6 (WA-02)

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 29/10/2026 22:32–22:36 giờ VN. Production đang chạy rc.3 (`sha-70fe734e9077`), **trước** deploy rc.6.
- Tiêu chí: thẻ FB-R3-ARC-BEB-WA-02 (2) trong `reviews/ARC-on-BE-B-worker-audit-fix.md`. INV đã đồng ý đưa rc.6 lên production (ORC ghi). OPS chỉ kiểm, **không** đẩy tag, **không** deploy.
- Cách làm như mục 11 nhưng với `/opt/ottimo-prod`: SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`, host lấy từ phân giải `desk.ottimo.vn` (khớp `known_hosts`); `dc ps`, `docker inspect`, `dc logs --no-color --timestamps worker` qua `sudo -u ottimo`.
- SQL: cùng các câu đếm của mục 11 (WA-01 (a)), thêm đếm outbox. Chạy hai lớp chỉ đọc:
  - `PGOPTIONS='-c default_transaction_read_only=on'`;
  - `BEGIN TRANSACTION READ ONLY … ROLLBACK`, `ON_ERROR_STOP`, giờ `Asia/Ho_Chi_Minh`.
  - Phiên in `transaction_read_only = on`. Bộ câu đã chạy thử trên staging ngay trước đó (22:34:08) để chắc cú pháp đúng.
- Không ghi DB, không restart, không chạy job tay, không sao lưu tay. Không in env, bí mật, IP hay dữ liệu khách. Production chưa có đơn nào, nên bảng dưới không có mã đơn nào.

### 13.1 Kết luận: **ĐƯỢC deploy** rc.6 lên production, kèm 3 điều kiện ở 13.6

- Không có hold, folio hay payment nào trên production, nên nhịp đầu rc.6 không có gì để hủy, đóng hay cho hết hạn.
- Không có migration mới (65 = 65).
- Máy còn đủ đĩa và RAM; 4 container đang chạy ổn.
- Log worker rc.3 sạch. Có 1 dòng lỗi đã biết (BUG-R3-032).
- Không có hold quá hạn, nên **không có danh sách mã đơn** cần gửi lễ tân/chủ xác nhận (WA-02 (3) không phát sinh).

### 13.2 Số đếm WA-01 (a) trên production (DB lúc 22:34:19 giờ VN)

| Hạng mục | Số | Mã | Ghi chú |
|---|---|---|---|
| Hold quá hạn (`status='hold' AND hold_expires_at <= now()`) | **0** | – | Tổng đơn `hold` (cả chưa quá hạn): **0**. Bảng `reservation` **0 dòng**: chưa có đơn nào, kể cả đơn thử "TEST" của C1 (dời sang 30/10, xem `b2-runbook.md` Phần 3) |
| – nhóm 1: đã có tiền (`kept_paid`) | 0 | – | Cùng công thức `FolioService.depositPaid` như mục 11 |
| – nhóm 2: có yêu cầu FOC/giảm giá đang chờ hoặc còn hiệu lực | 0 | – | Cùng điều kiện `FolioService.reductionRequests` |
| – nhóm 3: còn lại (nhịp đầu sẽ hủy) | 0 | – | – |
| `room_occupancy` đang giữ bởi hold | 0 | – | – |
| Folio `settled` quá `post_checkout_window_until` | **0** | – | Bảng `folio` **0 dòng** |
| Payment `pending` có `expires_at <= now()` | **0** | – | Bảng `payment` **0 dòng** |
| Audit `folio.closed` / `payment.expired` / `reservation.hold_expired` | **0 / 0 / 0** | – | Từ trước tới nay |
| Outbox, tổng | **3** | – | `staff.email` `dead` 1: thư `receiving_account_changed`, `NO_RECIPIENT`, đã biết (BUG-R3-032, b2-runbook Phần 3). `staff.push` `pending` 2 |
| Outbox `channel.availability_changed` | **0** | – | Chủ đề outbox mà J1 ghi khi nhả căn (`reservation-store.ts`). Mốc so sánh sau deploy: vẫn 0 |

**Kỳ vọng sau deploy** (để kiểm WA-02 (4) = WA-01 (b)):
- nhịp đầu J1, J15, J24 không xử lý gì;
- audit mới của 3 loại trên = 0;
- outbox `channel.availability_changed` = 0, tổng outbox chỉ tăng nếu có người dùng thao tác.

Nếu có người tạo đơn trên production trước giờ deploy, kỳ vọng này không còn đúng. Xem điều kiện 2 ở 13.6.

### 13.3 Migration khi lên rc.6 từ rc.3

| Nguồn | Kết quả |
|---|---|
| `git diff --name-status 70fe734 8b3aec8 -- product/services/api/src/db/migrations` | **Rỗng**: không thêm, sửa hay xóa tệp `.sql` hay `meta/` nào. Toàn bộ diff rc.3 → rc.6 cũng không có tệp nào chứa `migrat`, `.sql` hay `schema` |
| Journal của image | rc.3 và rc.6 đều **65 mục**, mục cuối `0088_late_fee_post_review` (`when` 1792782165681) |
| `drizzle.__drizzle_migrations` trên production | **65** dòng, `max(created_at)` = 1792782165681, khớp mục cuối của journal |

Khi deploy rc.6:
- **0 migration sẽ chạy**. Bước `migrate` của `deploy.sh` vẫn chạy nhưng không làm gì; kiểm số migration sẽ là 65 = 65.
- **Không có migration khóa bảng lâu hay xóa dữ liệu.**
- Quay lui về rc.3 (`rollback.sh`, `state/digests/sha-70fe734e9077` có sẵn) chạy trên đúng lược đồ hiện tại.
- Các thay đổi rc.3 → rc.6 nằm ở `services/api/src`: tách `audit-entities.ts`, `worker.ts`, `worker-jobs.ts` và test. Không đổi `config.ts`, compose, Dockerfile, `package.json` hay tệp env mẫu. Trong `product/infra` chỉ đổi `ci/playwright-deps.sh` (dùng cho CI, không lên máy chủ).

### 13.4 Sao lưu trước migrate

- **`deploy-from-ci.sh` và `deploy.sh` không sao lưu DB trước migrate.** Kiểm trên cả bản trong repo (rc.3 = rc.6 = HEAD) và bản đang nằm trên production. `grep -iE 'backup|pg_dump'` trên hai tệp của production: không có dòng nào. Thứ tự các bước: `config → pull → roles → migrate → switch → smoke → record`.
- Bản sao lưu gần nhất của production:
  - **`20261029T033257Z`** (29/10 10:33 giờ VN, chạy tay ở B2 Phần 5, `Result=success`, dump 705.787 byte). Bản này đã kéo về Mac và kiểm checksum.
  - Bản đêm kế tiếp: 30/10 03:04 (timer `ottimo-backup@ottimo-prod`).
- Đánh giá: rc.6 không có migration và DB chưa có đơn. Từ 10:33 tới giờ chỉ thêm đăng nhập/audit (INV đăng nhập lại ở Phần 6). Rủi ro mất dữ liệu khi deploy **rất thấp**.
- Dù vậy, runbook dặn chụp tay trước nâng cấp. **OPS đề xuất, chưa chạy** (thủ tục giống B2 Phần 5 bước 1–2, khoảng 3 giây, không đụng DB ứng dụng):
  1. Ngay trước khi ORC đẩy tag: `sudo systemctl start ottimo-backup@ottimo-prod.service`. Đạt khi `systemctl show … -p Result` ra `success` và trong `/var/backups/ottimo-prod` có `db-<mã giờ mới>.dump.age` kèm `.sha256`.
  2. (Khuyến nghị) Kéo về Mac bằng lệnh của `v1-production.md` 19.2 (container `alpine:3.20`, khóa `ottimo_backup_pull`). Đạt khi không có `checksum mismatch`.

  ORC giao thì OPS chạy. Bước này ghi tệp vào thư mục sao lưu, không ghi DB.

### 13.5 Máy chủ và log "trước" (29/10 22:32–22:36)

| Hạng mục | Kết quả |
|---|---|
| Image đang chạy | api, worker `ottimo-api:sha-70fe734e9077`; web `ottimo-web:sha-70fe734e9077`; landing `ottimo-landing:sha-70fe734e9077`. `state/current_tag` = `sha-70fe734e9077`, `previous_tag` = `sha-29636757822b`. Có sẵn `state/digests/sha-70fe734e9077` (dùng khi quay lui) |
| Sức khỏe | api, web, landing, postgres `healthy`; worker `running` (không có healthcheck theo thiết kế). `RestartCount` = 0 cả bốn; api/worker/web chạy từ 27/10 01:36Z, postgres từ 26/10 07:57Z |
| Đĩa | `/` 55 GB, đã dùng 8,8 GB (**18 %**), còn **43 GB**. Image docker 2,7 GB, trong đó 1,4 GB thu hồi được. Pull rc.6 cần khoảng vài trăm MB |
| RAM | 4,9 GB; `available` 3,8 GB |
| Timer | `ottimo-backup@ottimo-prod` lần cuối 29/10 03:03, kế 30/10 03:04; `ottimo-ops-check@ottimo-prod` mỗi 30 phút (lần cuối 22:26) |
| Log worker production (rc.3), từ lúc khởi động 27/10 01:36Z tới 29/10 15:33Z | 27.381 dòng. Đã bỏ mã màu ANSI và kiểm lại còn 0 ký tự ESC. **0** `ERROR [`, **0** `job failed`. Có **1** dòng mức `error`: `email dead … receiving_account_changed … NO_RECIPIENT` (29/10 10:20, BUG-R3-032, đã biết) |
| 24 giờ gần nhất (từ 28/10 15:35Z) | 18.728 dòng: 0 `ERROR [`, 0 `job failed`, 1 dòng `error` (dòng trên). api: 0 `ERROR [` |
| `worker started` (rc.3) | **19 job**, không có `folio.close`. Sau rc.6 phải là **20 job** |

Ghi chú:
- Log rc.3 sạch **không** có nghĩa J15/J24 chạy đúng. Production chưa có folio hay payment nào cần xử lý, nên lỗi BUG-R3-037/038 chưa có dịp lộ ra (giống staging trước 29/10, mục 10.3).
- **Bundle `infra/` trên production cũ hơn repo một bậc.** `deploy.sh` trên production có sha `c4d8d7df…` = bản `751ce79`; repo là `949ac32a…` = bản `6e2ecc0`. Bản production chỉ thiếu bước `appconfig` (kiểm cấu hình của image mới trước khi đổi container). `deploy-from-ci.sh` và `backup.sh` thì khớp repo.
  - Với rc.6, cấu hình không đổi so với rc.3, nên thiếu bước này không chặn.
  - Nếu image mới không chạy được, `deploy.sh` vẫn tự đưa rc.3 về ở bước `switch`/`smoke`.
  - Đã ghi rủi ro này ở `v1-production.md` 17.6 mục 2: làm mới bundle ngoài giờ khách, không vào D−1/D. Không làm chung lần deploy này.

### 13.6 Điều kiện kèm theo khi deploy

1. **Tag `v1.0.0-rc.6` phải trỏ vào `8b3aec8`** (bản staging đã đạt WA-01, image `sha-8b3aec89486f`). Không trỏ vào `HEAD` (`5b77a87`, gồm thêm commit tài liệu).
   - `release.yml` lấy image theo commit của tag (`sha-${GITHUB_SHA::12}`).
   - Commit khác thì chạy image khác với bản staging đã kiểm.
   - `8b3aec8` đã có trên `origin/main` (đã kiểm).
2. **Nếu có đơn được tạo trên production trước giờ deploy** (ví dụ đơn "TEST" của C1, dự kiến từ 30/10), ORC gọi OPS chạy lại đúng bộ câu 13.2 ngay trước khi đẩy tag.
   - Nếu lúc đó có hold quá hạn, OPS gửi ORC danh sách mã đơn (không kèm dữ liệu khách) để chủ/lễ tân xác nhận trước (WA-02 (3)).
   - Đơn giản nhất là deploy **trước** C1: khi đó VietQR thử của C1 chạy luôn trên rc.6 (có J24).
3. **Sao lưu tay theo 13.4** ngay trước khi đẩy tag. Đây là khuyến nghị: thiếu bước này không làm sai deploy, vì 0 migration và có bản sao lưu 29/10 10:33.

Sau deploy, OPS kiểm WA-02 (4) theo cách của mục 12:
- image `sha-8b3aec89486f`;
- `worker started` 20 job;
- 2–3 nhịp đầu: 0 `ERROR [` / `job failed` (sau khi bỏ ANSI);
- audit mới `folio.closed`/`payment.expired`/`reservation.hold_expired` = 0;
- outbox `channel.availability_changed` = 0;
- `ops-check` 7/7.

### 13.7 Giả định

- "Hold có yêu cầu giảm giá/FOC đang chờ" tính như mục 11.4 (gồm cả yêu cầu đã duyệt còn hiệu lực). Production có 0 hold nên cách tính không ảnh hưởng kết quả.
- Outbox availability lấy theo chủ đề `channel.availability_changed`, chủ đề duy nhất mà luồng nhả căn ghi.
- Mốc chỉ đúng tại 22:34:19 ngày 29/10.
- 6 job theo lịch (`hk.daily`, `lease.nights`…) đã chạy 2 lần trên production rc.3, 0 lỗi. Nhận xét "log sạch" bao gồm cả 6 job này.

### 13.8 Sao lưu tay và đếm lại (29/10 22:37, ORC giao theo điều kiện 3 ở 13.6)

Cùng cách làm như 13.2–13.5. Không đẩy tag, không deploy, không ghi DB.

| # | Việc | Kết quả | Đạt? |
|---|---|---|---|
| 1 | `sudo systemctl start ottimo-backup@ottimo-prod.service` (22:37:19–22:37:22 giờ VN) | `Result=success`, `ExecMainStatus=0`. Nhật ký in `OK: 28 encrypted files in /var/backups/ottimo-prod` | Đạt |
| 2 | Bản mới **`20261029T153719Z`** | 4 tệp `.age`: `db-…dump.age` 706.362 byte, `counts-…`, `blobs-…`, `purge-journal-…`. Mỗi tệp kèm `.sha256`. Quyền 0600, chủ `ottimo` | Đạt |
| 3 | Đếm lại `wa02.sql`, chỉ đọc (22:37:32), thêm câu đếm số dòng của 3 bảng | `transaction_read_only = on`. `reservation` / `folio` / `payment` = **0 / 0 / 0**. Hold 0 (quá hạn 0), occupancy giữ bởi hold 0, migration 65 (mục cuối khớp journal), outbox tổng 3 (`staff.email` dead 1, `staff.push` pending 2, availability 0), 3 loại audit 0. **Không đổi so với 13.2** | Đạt |

- Chưa kéo bản này về Mac. Lệnh kéo về ở `v1-production.md` 19.2, nên chạy nếu ORC giao.
- Kỳ vọng sau deploy ở 13.6 giữ nguyên.

## 14. Production sau deploy rc.6

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 30/10/2026 07:54–07:57 giờ VN, ngay sau release run 40903554902 (tag `v1.0.0-rc.6` → `sha-8b3aec89486f`, báo `deploy sha-8b3aec89486f: ok` lúc 07:51:44). INV đã đồng ý deploy này (ORC ghi).
- Tiêu chí: thẻ FB-R3-ARC-BEB-WA-02 (4) = WA-01 (b) trong `reviews/ARC-on-BE-B-worker-audit-fix.md`, kỳ vọng ở 13.2 và 13.6.
- Cách làm như mục 13: SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`, host lấy từ phân giải `desk.ottimo.vn`; `dc ps`, `docker inspect`, `dc logs --no-color --timestamps worker` qua `sudo -u ottimo`, **bỏ mã màu ANSI** rồi kiểm lại còn 0 ký tự ESC trước khi lọc. SQL: đúng bộ câu `wa02.sql` của 13.2/13.8, thêm đếm số dòng 3 bảng, audit và outbox tạo sau 07:51. Hai lớp chỉ đọc (`PGOPTIONS default_transaction_read_only=on` + `BEGIN TRANSACTION READ ONLY … ROLLBACK`), phiên in `transaction_read_only = on`.
- Không ghi DB, không restart, không chạy job tay, không chạy tay `ops-check.sh` (chỉ đọc nhật ký của timer). Không in env, bí mật, IP hay dữ liệu khách.

### 14.1 Kết luận: **ĐẠT** (WA-02 (4))

| Hạng mục | Kết quả | Đạt? |
|---|---|---|
| Image | api, worker `ottimo-api:sha-8b3aec89486f`; web `ottimo-web:sha-8b3aec89486f`. `state/current_tag` = `sha-8b3aec89486f`, `previous_tag` = `sha-70fe734e9077` (có sẵn `state/digests/sha-70fe734e9077` để quay lui). `deploy-history.log`: `2026-10-30T00:51:43Z sha-8b3aec89486f`. Container tạo 00:51:24Z, chạy từ 00:51:25Z (07:51:25 giờ VN). Landing giữ `ottimo-landing:sha-70fe734e9077` (đúng: release không đổi landing) | Đạt |
| Sức khỏe | api, web, landing, postgres `healthy`; worker `running` (không có healthcheck theo thiết kế, như 13.5). `RestartCount` = **0** cả năm container. Kiểm 07:54:23 | Đạt |
| `worker started` | **1** dòng, **20 job**, có `folio.close`, `payment.expire`, `hold.expire` (rc.3 là 19) | Đạt |
| Log worker 07:51:25 → 07:56:23 | 72 dòng, 0 ký tự ESC còn lại. **5 nhịp** (07:51:29, 07:52:29, 07:53:29, 07:54:29, 07:55:29), mỗi nhịp 14 job tick `job done`. **0** `ERROR [`, **0** `job failed`, **0** `AuditEntityNotRegisteredError`; 72/72 dòng mức `info` | Đạt |
| Log api từ 07:51 | 291 dòng: 0 `ERROR [`, 0 dòng mức `error` | Đạt |
| DB (07:54:59, đếm lại 07:57:03 sau 5 nhịp, giống nhau) | `reservation` / `folio` / `payment` = **0 / 0 / 0**. Migration **65**, mục cuối 1792782165681 (khớp journal, không migration mới). Hold 0 (quá hạn 0), occupancy giữ bởi hold 0. Outbox `channel.availability_changed` **0**; tổng outbox 3 (`staff.email` dead 1 = BUG-R3-032, `staff.push` pending 2), **không đổi so với 13.2/13.8**. Audit `folio.closed` / `payment.expired` / `reservation.hold_expired` = 0 / 0 / 0. Không có audit hay outbox nào tạo từ 07:51 | Đạt |
| api `/health` (trong container) | `{"status":"ok","db":"ok"}` | Đạt |
| Từ Internet (Mac, 07:56) | `desk`, `staff`, `g`, `ottimo.vn` trả 200 `text/html`; `desk/health` 404 (đúng, chặn từ ngoài); `desk/v1/me` 401 `problem+json`; `desk/v1/does-not-exist` 404 `problem+json` | Đạt |
| `ops-check` (timer, lần 07:56:30 – lần đầu sau deploy) | **7/7 ok**: containers (postgres, api, worker, web, landing running, api healthy), j16, backup (4 giờ trước), disk 17 %, mem 77 % (3.825 MB), tls, http5xx 0 trong 35 phút. `Result=success`, `ExecMainStatus=0`. Nhật ký `ottimo-alert` từ 07:00: không có dòng nào | Đạt |
| Máy | `/` 55 GB, dùng 8,6 GB (17 %); RAM `available` 3,8 GB | – |

Kỳ vọng ở 13.2 giữ đúng: production chưa có đơn nên nhịp đầu J1, J15, J24 không xử lý gì, không sinh audit hay outbox.

### 14.2 Giới hạn

- Như 12.3: 6/20 job là job theo lịch (`guest.document_profile_anonymize`, `hk.daily`, `lease.nights`, `log.partitions`, `web_request.purge`, `web_request.stale`), chưa tới giờ chạy trong 5 nhịp này. Trên rc.3 production 6 job này đã chạy sạch (13.7); mã của chúng không đổi ở rc.6. Nên đọc lại log worker sau lần chạy slot kế tiếp (cùng lệnh lọc).
- Production có 0 hold/folio/payment, nên lần này chỉ chứng minh rc.6 chạy sạch trên production, **không** chứng minh J1/J15/J24 xử lý đúng dữ liệu thật. Bằng chứng xử lý đúng nằm ở staging: J15/J24 mục 12, J1 ở `qa/qa3-rc1.md` 19.6.
- Từ giờ mọi đơn/VietQR thử trên production (ví dụ C1) chạy trên rc.6.

### 14.3 Giả định

- "Cả 4 healthy" hiểu là api, web, postgres, landing `healthy` và worker `running`: worker không có healthcheck theo thiết kế (13.5, 12.1).
- Mốc deploy lấy theo `StartedAt` của worker (00:51:25Z); log đọc `--since 00:51:00Z`, bao trọn từ lúc khởi động.
- "Health web" kiểm bằng trang gốc 200 qua Caddy; `/health` không mở ra Internet theo thiết kế, nên kiểm trong container api.

## 15. T3 – 6 job theo lịch trên staging rc.6

- Người kiểm: OPS | Round 3 – bước **Kiểm thử** | 30/10/2026 08:27–08:30 giờ VN. Điều kiện **T3** của cổng QC v1.0 (`qc/v1-gate.md` mục 4.1), câu hỏi QC-G7.
- Bản kiểm: staging rc.6 `sha-8b3aec89486f` (`state/current_tag` khớp). api, web `healthy`, worker `running`, `RestartCount` = 0 cả ba. Worker chạy từ 29/10 11:57:55Z (18:57:55 giờ VN), không khởi động lại lần nào.
- Cách làm như mục 12:
  - SSH `ottimo-admin`, khóa `~/.ssh/ottimo_ops`, `StrictHostKeyChecking=yes`.
  - Log: `dc logs --no-color --timestamps --since 2026-10-29T11:57:50Z worker`, rồi **bỏ mã màu ANSI** (`sed 's/\x1b\[[0-9;]*m//g'`). Kiểm lại còn 0 ký tự ESC trước khi lọc. Tệp tạm trên máy chủ đã xóa sau khi đọc.
  - SQL: hai lớp chỉ đọc (`PGOPTIONS default_transaction_read_only=on` + `BEGIN TRANSACTION READ ONLY … ROLLBACK`), `ON_ERROR_STOP`, giờ `Asia/Ho_Chi_Minh`. Phiên in `transaction_read_only = on`.
- Không ghi DB, không restart, không chạy job tay. **Không đụng `/opt/ottimo-prod`.** Không in env, bí mật, IP hay dữ liệu khách; chỉ in số đếm và tên job.

### 15.1 Kết luận: **ĐẠT**

Cả 6 job đã chạy lượt theo lịch đầu tiên trên mã rc.6, mỗi job đúng 1 lần, trong slot ngày 30/10.

Toàn bộ log worker từ lúc khởi động tới 08:27 30/10 (11.347 dòng) sạch:
- **0** `ERROR [`;
- **0** `job failed`;
- **0** `AuditEntityNotRegisteredError`;
- **0** dòng không phải mức `info`, không có dòng stack trace.

Không có job nào phải chờ tới giờ chạy.

| Job | Lịch (giờ VN, `catchUp: always`) | Chạy trên rc.6 (log `job done`) | `job_run` 30/10 (DB) | Lỗi trong log | Đạt? |
|---|---|---|---|---|---|
| `log.partitions` | 03:00 | 30/10 03:00:09 | `done` 03:00:09, `partitions` = `audit_event_p202611`, `c3_access_log_p202611` | 0 | Đạt |
| `lease.nights` | 03:10 | 30/10 03:10:09 | `done` 03:10:09, `bookings` 0, `nights` 0 | 0 | Đạt |
| `web_request.purge` | 03:10 | 30/10 03:10:09 | `done` 03:10:09, `aged` 0, `purged` 0, `ipCleared` 0, `spamDeleted` 0 | 0 | Đạt |
| `guest.document_profile_anonymize` | 03:30 | 30/10 03:30:09 | `done` 03:30:09, `anonymized` 0 | 0 | Đạt |
| `web_request.stale` | 06:05 | 30/10 06:05:13 | `done` 06:05:13, `closed` 0 | 0 | Đạt |
| `hk.daily` | `daily_clean_status_time` = 07:00 | 30/10 07:00:15 | `done` 07:00:15, `dayEnded` 0, `carriedOver` 0, `stayover` 0, `markedDirty` 0, `returnPrepared` 0 | 0 | Đạt |

### 15.2 Đối chiếu

- **Đây là lượt rc.6 đầu tiên của cả 6 job.** Slot ngày 29/10 của 6 job đã được rc.5 chạy lúc 03:00–07:00 29/10, trước deploy rc.6 (18:57). `job_run` khóa mỗi slot một lần, nên rc.6 không chạy lại slot 29/10. Slot ngày 30/10 là slot đầu của rc.6. Mỗi job có đúng 1 dòng `job done` trong log rc.6. Log khớp `job_run`, `run_at` lệch dưới 1 giây.
- **Số 0 ở các job là đúng dữ liệu, không phải job bỏ qua:**
  - `log.partitions`: partition tháng 11 của `audit_event` và `c3_access_log` đã có từ trước. Hàm tạo partition không tạo trùng, chỉ trả lại tên. Cả hai bảng có sẵn partition tới 12/2027, kèm partition `default`.
  - `hk.daily`: staging có 2 đơn `in_house`, đều ngắn ngày và đến hạn trả phòng ≤ 30/10. Không đơn nào ở qua đêm 30/10, nên `stayover` = 0 (BR-807-01). Không có việc `stayover_clean`/`long_stay_clean` nào còn mở từ 29/10, nên `dayEnded` = 0. Bảng `hk_task` không có việc nào tạo trong 07:00–07:02 30/10.
  - Rc.5 cũng ra số 0 tương tự ở slot 29/10 với 5 job còn lại. Riêng `hk.daily` 28/10 ra `stayover` 2, `carriedOver` 2. Tức job có xử lý khi có dữ liệu.
- **Audit:** audit `system` từ lúc deploy rc.6 tới 08:28 30/10 gồm:
  - `folio.closed` 5 và `payment.expired` 2, cùng lúc 18:57:57 (J15/J24, mục 12);
  - `reservation.hold_expired` 1 và `lead.hold_ended` 1, cùng lúc 07:04:15 30/10 (J1, hold thử của QA, checklist F).
  
  6 job này không ghi audit nào, khớp với số 0 ở bảng trên.

### 15.3 Giới hạn

1. **Nhánh ghi audit của 6 job chưa được chạy thật trên staging**, vì không có dữ liệu cần xử lý:
   - `guest.document_profile_anonymize` chưa ẩn danh hồ sơ nào;
   - `web_request.purge` và `web_request.stale` chưa xóa hay đóng yêu cầu nào;
   - `lease.nights` chưa điền đêm dài hạn nào.
   
   "0 lỗi" nghĩa là job khởi chạy, mở giao dịch, ghi `job_run` và kết thúc sạch trên rc.6. Nó **không** chứng minh nhánh có ghi audit chạy đúng.
   
   Phần đó được che bằng đọc mã: `audit-entities.ts` của worker import allowlist của `guests`, `public-site`, `reservations`, `housekeeping`… Test `worker-audit-registry` (PR #14, CI xanh trên `8b3aec8`) so registry của worker với registry của api. Đây chính là gốc của BUG-R3-037/038/039.
   
   Nếu QC cần bằng chứng chạy thật, phải tạo dữ liệu thử đến hạn (ví dụ yêu cầu web đã từ chối quá hạn lưu). Việc này cần chạy job hoặc chờ slot kế, nên OPS **không** làm khi chưa có lệnh của ORC.
2. Kết quả chỉ đúng cho slot 30/10. Slot kế tiếp trên staging (31/10):
   - `log.partitions` 03:00;
   - `lease.nights` và `web_request.purge` 03:10;
   - `guest.document_profile_anonymize` 03:30;
   - `web_request.stale` 06:05;
   - `hk.daily` 07:00.

### 15.4 Giả định

- "Lượt chạy theo lịch đầu tiên trên rc.6" là slot ngày 30/10. Slot 29/10 đã do rc.5 chạy (`job_run` 29/10 03:00:33 … 07:00:38, trước 18:57).
- Giờ `hk.daily` lấy từ `config_parameter.daily_clean_status_time` = `"07:00"` (hiệu lực từ 01/10). Trên staging không có bản ghi đổi giờ nào sau đó.
- Số liệu DB đọc lúc 08:28:44 30/10.

### 15.5 Khung D-T6 – production, sau lượt theo lịch đầu tiên trên rc.6 (**chưa đọc**)

- Thời điểm đọc: **sau 07:05 ngày 31/10**, không phải 03:00.
  - Production lên rc.6 lúc 07:51 30/10. Lúc đó cả 6 slot ngày 30/10 (03:00–07:00) đã do rc.3 chạy (13.7). Vậy lượt rc.6 đầu tiên của cả 6 job là slot 31/10.
  - Trong 6 job có `web_request.stale` chạy 06:05 và `hk.daily` chạy 07:00. Giờ `hk.daily` sẽ đọc lại từ `daily_clean_status_time` trên production.
  - Nếu chỉ đọc sau 03:30 thì mới kiểm được 4/6 job.
- Cách làm như mục 14, với `/opt/ottimo-prod`, host `desk.ottimo.vn`. Log `--since 2026-10-30T00:51:00Z`, bỏ ANSI, kiểm lại còn 0 ký tự ESC. SQL hai lớp chỉ đọc. Không ghi DB, không chạy job tay.
- Câu SQL: `rounds/round-03/outputs/OPS/t3-scheduled-jobs.sql` (đã chạy trên staging 30/10, đổi ngày theo ghi chú đầu tệp): `job_run` 6 job theo `business_date`, partition, `hk_task` theo `due_date`, audit `system` theo `action`.

| Job | Slot rc.6 đầu tiên (31/10, giờ VN) | Log `job done` | `job_run` 31/10 (`run_at`, `stats`) | `ERROR [` / `job failed` / `AuditEntityNotRegisteredError` | Đạt? |
|---|---|---|---|---|---|
| `log.partitions` | 03:00 | _chưa đọc_ | _chưa đọc_ (kỳ vọng `audit_event_p202611`, `c3_access_log_p202611`) | _chưa đọc_ | – |
| `lease.nights` | 03:10 | _chưa đọc_ | _chưa đọc_ | _chưa đọc_ | – |
| `web_request.purge` | 03:10 | _chưa đọc_ | _chưa đọc_ | _chưa đọc_ | – |
| `guest.document_profile_anonymize` | 03:30 | _chưa đọc_ | _chưa đọc_ | _chưa đọc_ | – |
| `web_request.stale` | 06:05 | _chưa đọc_ | _chưa đọc_ | _chưa đọc_ | – |
| `hk.daily` | `daily_clean_status_time` (mặc định production 07:00) | _chưa đọc_ | _chưa đọc_ | _chưa đọc_ | – |

Kèm theo khi đọc D-T6:
- Toàn log worker từ 07:51 30/10: số dòng, 0 ký tự ESC, đếm `ERROR [` / `job failed` / `AuditEntityNotRegisteredError` / dòng không phải `info`. Dòng BUG-R3-032 (`email dead … NO_RECIPIENT`) đã biết, tách riêng.
- Kiểm `job_run` slot 30/10 của 6 job có `run_at` trước 07:51. Nếu có slot nào `run_at` sau 07:51 (rc.3 chưa chạy kịp), thì slot đó là lượt rc.6 đầu và được tính luôn.
- Truy vấn vai sau D-INV-2; truy vấn `logout` sau D-INV-1 (SEC chủ trì). Hai việc này ghi ở mục riêng khi tới lượt.
- Số đếm đơn, folio, payment trên production lúc đọc. Từ 30/10 có thể đã có đơn thử C1, nên số 0 ở `hk.daily`/`lease.nights` không còn mặc nhiên.
