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
