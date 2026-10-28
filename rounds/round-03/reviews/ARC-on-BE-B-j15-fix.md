# ARC review BE-B – BUG-R3-037: đăng ký J15 `folio.close` trong worker (rc.5)

- Người review: ARC | Round 3 – bước **Review** | Ngày: 28/10/2026
- Đối tượng: nhánh `be-b-v1.0.0-j15`, commit `d810561`, so với `main` `20cb803` (15 tệp, +796/−70). Báo cáo tác giả: `rounds/round-03/outputs/BE/v1.0.0-j15-fix-be-b.md` (trên nhánh).
- Đầu vào: `outputs/OPS/j15-folio-close-check.md`, `qa/bug-list.md` (BUG-R3-037).
- Cách review: đọc mã trong worktree `.claude/worktrees/agent-a80ab06b1aa5ac5b8` (chỉ đọc). **Không chạy test**, không xem CI PR #13 (ORC tự xem). Không đụng staging/production.

## Kết luận: **Duyệt có điều kiện**

Mã đúng hướng, đủ hooks cho J15 và không đổi hành vi api. Gộp vào `v1.0.0` (rc.5) khi có đủ hai điều kiện sau:

1. **FB-R3-ARC-BEB-J15-01:** test (b) `r3-bug-037-worker-j15.test.ts` chạy 4/4 trên Postgres thật, và bộ tích hợp api xanh. Có thể là CI của PR #13 nếu CI chạy bộ tích hợp có DB.
2. **FB-R3-ARC-BEB-J15-02:** thủ tục kiểm sau deploy trên staging lấy **DB làm bằng chứng**, không chỉ dựa vào log `job failed`. Đây là việc của QA/OPS, không cần sửa mã.

Không cần ARC review lại nếu hai điều kiện đạt và mã không đổi thêm.

## Trả lời 5 câu ORC hỏi

### 1. Hành vi api có đổi không? – **Không đổi**

Đã so từng dòng của ba module:

| Module | Trước (`main`) | Sau (nhánh) | Khác biệt |
|---|---|---|---|
| `FolioModule.onModuleInit` | `approvals.provideRefundRouting(routing, makerCheck, approvalCheck)`, gọi trực tiếp | `provideFolioRefundRouting(this.approvals, this.folios)` (`folio/public/refund-routing.ts`) | Cùng 3 lambda, cùng tham số, cùng vị trí (sau `provideFocView`, trước `damage_pricing`). FOC, `special_discount`, `damage_pricing` và đăng ký J15 vào registry api **giữ nguyên**. |
| `FrontdeskModule.onModuleInit` | 4 lệnh `hooks.provide*`: DebtAfterReversal, OpenDebt, DebtSettled, DebtOnCheckout | `provideCheckoutDebtPorts(this.hooks, this.checkout)` (`frontdesk/internal/checkout-debt-ports.ts`) | Cùng 4 cổng, cùng thứ tự, cùng thể hiện `CheckoutService` |
| `PaymentsModule.onModuleInit` | `onDecided('refund')` + `onBeforeDecide('refund')` | `wireRefundDecisionHooks(this.approvals, this.refunds)` (`payments/internal/refund-decision-hooks.ts`) | Cùng hai hook, cùng thứ tự |

- `worker.ts`: chỉ dời danh sách job sang `worker-jobs.ts`, cùng thứ tự, rồi chèn J15 sau J16. Vòng tick, cờ `running` chống chồng nhịp và email dispatcher không đổi.
- Không đổi hợp đồng API, không migration. Hai hàm nối dùng chung đặt trong `internal/` của chính module đó, nên ranh giới module vẫn đúng.

### 2. J15 trong worker có đủ hooks không? Có rủi ro chạy hai lần không? – **Đủ. Không rủi ro chạy hai lần.**

Đối chiếu đường đi của `FolioService.closeAfterWindow` (`folio.service.ts` ~1360–1450) với phần nối trong `folio/public/worker-jobs.ts`:

| Nhu cầu của J15 | Trong worker | Đánh giá |
|---|---|---|
| Công nợ: `hooks.debtOnCheckout`, `hooks.openDebt` | `frontdeskWorkerHooks` dựng `CheckoutService` thật rồi gọi **cùng** `provideCheckoutDebtPorts` như api | Đủ. Đường `debtOnCheckout → writeDebt` chỉ dùng `stay.context`, tham số, audit và `events.notify/publish`. **Không** đi qua cổng đăng ký lưu trú, liên kết khách, trẻ em hay minibar. |
| "Cần chú ý" `closed_reservation_credit` (mở khi còn tiền dư, đóng khi folio đóng) | `FolioService` có `events` | Đủ. `openAttention/resolveAttention` ghi bảng. `publish` dùng `pg_notify` trong giao dịch, nên SSE của api vẫn nhận dù sự kiện phát từ tiến trình worker. |
| Định tuyến hoàn khi J15 lập lại yêu cầu hoàn (BUG-R3-012/013) | `provideFolioRefundRouting`, cùng hàm với api | Đủ, và **bắt buộc phải có** (xem câu 5). |
| Hook duyệt `refund`: `onDecided` (xóa tài khoản hoàn, SEC-BE-45) + preLock khóa folio (ARC 16.19) | `paymentsWorkerHooks` → `wireRefundDecisionHooks`, cùng hàm với api | Đủ |
| Hộp thư người duyệt khi xin lại yêu cầu hoàn | `ApprovalService` dựng có `events` | Đủ |

**Chạy hai lần:**
- Registry của api vẫn đăng ký J15, nhưng api **không có vòng tick**. Chỉ endpoint test-support `runOnce` chạy nó, và production tắt test-support (`docker-compose.prod.yml` dòng 69: `INCLUDE_TEST_SUPPORT` mặc định `0`).
- Kể cả khi test-support (staging/CI) và worker chạy J15 cùng lúc, kết quả vẫn đúng:
  - mỗi folio xử lý trong giao dịch riêng;
  - thứ tự khóa: mọi đơn của folio (L1), rồi folio (L3, `lockStay`);
  - **sau khi có khóa** mới đọc lại `status = 'settled'` và cửa sổ. Tiến trình thứ hai chờ khóa, thấy `closed` thì trả `skipped`;
  - `debtOnCheckout` tính lại theo số dưới khóa: X = B thì không ghi thêm.
- Không thể có hai công nợ hay hai bản ghi `folio.closed` cho một folio.
- Lúc deploy, worker cũ không có J15, nên giai đoạn worker cũ và mới chồng nhau không gây chạy đôi. Compose có đúng một worker. Nếu sau này tăng lên 2 worker, khóa vẫn giữ đúng.

### 3. Các giả định của BE-B – **chấp nhận cả ba**

| Giả định | Đánh giá ARC |
|---|---|
| Không nối hook `foc`, `special_discount`, `damage_pricing` | **Đồng ý.** J15 chỉ huỷ hoặc xin lại yêu cầu `refund`: `refundsDownToCredit` gọi `autoCancel`, `cancelApproved` và `submit` loại refund. `ApprovalService.runHooks` chỉ chạy hook theo đúng loại yêu cầu. Thiếu hook ở loại không dùng tới thì không đổi kết quả. Test (a) khóa `decisionHooks() = [refund]`, nên nếu sau này J15 quyết loại khác thì test sẽ đỏ. |
| Các cổng lễ tân không dùng tới để mặc định fail-closed (đăng ký lưu trú, liên kết khách, trẻ em, minibar) | **Đồng ý.** Đã lần đường `debtOnCheckout` và `openDebt`: không gọi các cổng này. Các hook `ReservationHooks` không nối trong worker (`amountDue`, `roomReturn`, `partyCount`, `registrationSummary`) cũng không nằm trên đường J15. Hook chưa nối sẽ **ném lỗi** chứ không trả giá trị rỗng. Giả sử có đường bị bỏ sót, folio đó rollback và giữ `settled`, không có bút toán sai. Cách phát hiện: xem thẻ 02. |
| `CryptoService` dựng hai lần (J16 và J15) | **Đồng ý.** `cryptoServiceFromEnv` chỉ là `new EnvelopeCryptoService(keyringFromEnv(env), clock)`, không có trạng thái dùng chung cần đồng bộ. Hai thể hiện đọc cùng env nên cùng khóa. Mẫu này giống hệt `registrationWorkerJobs` (J16) đang chạy production. |

Đề nghị ORC ghi `decision-log`: *"28/10 | R3 | Worker J15 chỉ nối hook duyệt `refund`; các cổng lễ tân không dùng giữ mặc định fail-closed; CryptoService dựng theo từng module worker | ARC | J15 chỉ quyết yêu cầu refund; cổng chưa nối thì ném lỗi, không ghi sai"*.

### 4. Folio tồn có bị đóng hàng loạt ở tick đầu không?

**Có, và đó là hành vi mong muốn.** Điều kiện là `status = 'settled' AND post_checkout_window_until <= now`, tối đa 200 folio mỗi nhịp mỗi cơ sở. Worker chạy `tick()` ngay khi khởi động, rồi lặp mỗi 60 giây.

- **Staging:** 3 folio OTM-00239, OTM-00294, OTM-00297 sẽ đóng ở lần tick đầu, khoảng vài giây sau khi worker rc.5 lên.
  - Folio đã trả đủ: chuyển `closed`, có audit `folio.closed`.
  - OTM-00297 (còn nợ 150.000): nếu B18 chưa ghi đủ nợ, J15 ghi **một** công nợ `post_checkout_unpaid`, hạn thu tính từ **ngày J15 chạy**, không từ lúc hết cửa sổ, và gửi thông báo `debt_recorded` vào hộp thư OWN và MGR (không gửi email). Nếu B18 đã ghi đủ (X = B), J15 chỉ đóng folio.
  - Không thể đảo lại sau khi đóng. QA mất ca "settled quá cửa sổ" để so. Bảng mục 3.4 của OPS đã đủ làm ảnh chụp "trước".
- **Production:** đúng như ORC nói, chưa có folio nào. Bộ `smoke-prod` chỉ đọc (`readonly.prod.spec.ts`), nên không tạo folio. Tick đầu sẽ không làm gì. J15 bắt đầu có việc khoảng 24 giờ sau lượt trả phòng thật đầu tiên (02/11 trở đi).
  - Đề nghị OPS chạy thêm một truy vấn chỉ đọc ngay trước deploy production: `SELECT count(*) FROM folio WHERE status='settled' AND post_checkout_window_until <= now()`. Kỳ vọng `0`. Nếu khác 0, báo ORC trước khi deploy.
- **Tải:** với 10 căn, mỗi nhịp chỉ vài folio, không ảnh hưởng hiệu năng. Có một giới hạn sẵn có từ trước (thẻ 03), không liên quan bản sửa.

### 5. Có phương án nhỏ hơn, an toàn hơn cho v1.0.0 không?

So ba phương án:

| | A. Bản của BE-B (đề xuất giữ) | B. "J15 + hooks tối thiểu" trong `worker.ts` | B'. Như A nhưng không đụng 3 module api (nối trùng trong worker) |
|---|---|---|---|
| Phần phải dựng trong worker | `CheckoutService` (kéo theo StaySupport, StayService, CheckinService, stay port) + Events + Approvals + Refunds | **Gần như y hệt A.** Muốn có `debtOnCheckout`/`openDebt` thì vẫn phải dựng cả chuỗi `CheckoutService`. "Tối thiểu" chỉ bớt được Events, định tuyến hoàn và hook refund. | Như A |
| Diff mã api | 3 chỗ, dời nguyên văn | 0 | 0 |
| Rủi ro tiền / bảo mật | Thấp | **Cao.** (1) Bớt Events: tiền dư của khách nằm im, không có "Cần chú ý", tức là quay lại BUG-R3-002 (từng là P0). (2) Bớt định tuyến hoàn: `ApprovalService.submit` **bỏ qua im lặng** khi `refundRouting` null (`approval.service.ts` dòng 503 `&& this.refundRouting`). Yêu cầu hoàn J15 xin lại sẽ sai cấp duyệt, sai BR-433 (e), và không có lỗi nào báo. (3) Bớt hook refund: yêu cầu bị hủy không xóa tài khoản hoàn (SEC-BE-45); thiếu preLock nên đảo thứ tự khóa L3/L4, có nguy cơ deadlock với api. | Thấp. Nhưng hai nơi nối lại lệch nhau, đúng kiểu gây ra BUG-R3-037. |
| Rủi ro api đổi hành vi | Rất thấp: dời nguyên văn, CI tích hợp phủ (G-4, ARC 16.26, refund) | Không có | Không có |
| Chống tái phát | Test (a) + một chỗ nối | Chỉ test (a) | Test (a), nhưng nối trùng |

**Kết luận: giữ phương án A cho v1.0.0.**
- Phương án B nhỏ hơn không đáng kể (phần nặng là `CheckoutService`), nhưng mở ra ba lỗ tiền và bảo mật, trong đó một lỗ **không báo lỗi**. Không chấp nhận.
- B' chỉ tránh được 3 chỗ dời nguyên văn trong api, đổi lại hai nơi nối có thể lệch nhau. Không đáng.
- Phần refactor lớn (worker khởi động bằng `NestFactory.createApplicationContext`, bỏ đăng ký trùng) để sang **v1.0.1**, có ADR riêng (thẻ 05).

## Thẻ feedback

### FB-R3-ARC-BEB-J15-01
- Mức độ: **Major** (điều kiện gộp rc.5)
- Vị trí: `product/services/api/test/integration/s438-r8/r3-bug-037-worker-j15.test.ts`; báo cáo BE-B mục 2 "CHƯA chạy được"
- Vấn đề: test (b), chạy J15 qua `JobRunner` của worker trên DB thật, mới qua typecheck, chưa chạy lần nào. Hồi quy tích hợp của các bộ có J15 và hook liên quan cũng chưa chạy, vì Docker trên máy BE-B treo. Bằng chứng "đỏ trước khi sửa" hiện chỉ có ở test (a), test không dùng DB.
- Vì sao quan trọng: phần nối mới dựng cả chuỗi `CheckoutService` ngoài Nest. Lỗi thiếu phụ thuộc chỉ lộ khi chạy thật: hook ném lỗi thì folio bị rollback và giữ `settled`, đúng triệu chứng của BUG-R3-037. Test (a) chỉ kiểm hook đã được gán, không kiểm hook chạy đúng.
- Đề xuất sửa: trước khi gộp vào `v1.0.0`:
  - test (b) 4/4 xanh, và `stats.failed = 0` ở mọi lần chạy (test đã assert);
  - toàn bộ `vitest run` của api trên `ottimo_test` xanh. Tối thiểu các bộ `s438-r8/`, `reversal-debt-g4`, `approvals-refund-payout`, `s438-beb`, `checkout-due`, `frontdesk-stay`.

  CI của PR #13 được tính nếu job tích hợp có Postgres và chạy cả tệp mới. ORC xác nhận trong log CI rằng tệp mới **có chạy**, không bị `skipIf(!HAS_DB)` bỏ qua.
- Trạng thái: Open

### FB-R3-ARC-BEB-J15-02
- Mức độ: **Major** (thủ tục kiểm sau deploy rc.5, không sửa mã)
- Vị trí:
  - `folio/public/folio-close-job.ts`, khối `catch`: lỗi từng folio chỉ đi vào `Logger('J15').error`, dạng chữ của Nest, không phải JSON;
  - `worker.ts` vòng tick: chỉ log `job done` kèm số cơ sở, **không log `stats.failed`**;
  - `j15-folio-close-check.md` mục 6.4 lấy "không có `job failed` cho `folio.close`" làm bằng chứng.
- Vấn đề: một folio lỗi ở J15 không bao giờ sinh dòng `job failed`, vì job vẫn trả `done`. Kiểm theo mục 6.4 có thể báo đạt trong khi folio vẫn kẹt `settled`.
- Vì sao quan trọng: đây chính là kiểu lỗi im lặng đã giấu BUG-R3-037 suốt 10 ngày. Sau rc.5 cần bằng chứng là J15 **đóng được folio thật**, không chỉ là "đã đăng ký".
- Đề xuất sửa (QA/OPS, sau deploy rc.5 lên staging; chỉ đọc):
  1. Dòng `worker started` có `folio.close` (OPS 6.3).
  2. DB, ở `READ ONLY`: OTM-00239, OTM-00294, OTM-00297 thành `closed` và có `closed_at`; có đủ 3 bản ghi audit `folio.closed`; `SELECT count(*) FROM folio WHERE status='settled' AND post_checkout_window_until <= now()` = 0; OTM-00297 có công nợ đang mở (hoặc đã có từ B18).
  3. `grep "J15"` trên log worker: không có dòng `ERROR [J15]`.

  Cùng các kiểm này cho production sau lượt trả phòng thật đầu tiên + 24 giờ: kiểm DB, chỉ đọc.

  Tùy chọn cho rc.5 (khoảng 3 dòng, BE-B tự cân nhắc): trong `worker.ts`, nếu `stats.failed > 0` thì log JSON `level:error`. Nếu không kịp thì để v1.0.1 (thẻ 04).
- Trạng thái: Open

### FB-R3-ARC-BEB-J15-03
- Mức độ: Minor (có từ trước, không do bản sửa; dời v1.0.1)
- Vị trí:
  - `folio-close-job.ts` `handler`: giao dịch ngoài của `runOnce` chỉ chạy một `SELECT`, rồi để yên trong lúc từng folio chạy ở giao dịch riêng (`db.withContext`);
  - `infra/postgres/init/02-roles.sh` dòng 73: `idle_in_transaction_session_timeout = '30s'` cho `ottimo_app`, được `deploy.sh` dòng 198 kiểm.
- Vấn đề: nếu một nhịp xử lý lâu hơn 30 giây (nhiều folio, hoặc vài folio chờ khóa tới `JOB_LOCK_TIMEOUT_MS` 10 giây), Postgres cắt kết nối ngoài. Khi đó `runOnce` ném lỗi và worker log `job failed`. Các folio đã commit vẫn đúng, nhịp sau làm tiếp.
- Vì sao quan trọng: không sai tiền. Với 10 căn gần như không xảy ra. Rủi ro chỉ là báo động giả trong log khi quy mô lớn lên hoặc có tranh chấp khóa.
- Đề xuất sửa (v1.0.1): đọc danh sách folio xong thì kết thúc giao dịch ngoài, hoặc để J15 tự mở giao dịch cho từng folio mà không giữ giao dịch ngoài. Ghi vào ADR ở thẻ 05.
- Trạng thái: Open

### FB-R3-ARC-BEB-J15-04
- Mức độ: Minor (v1.0.1)
- Vị trí: `worker.ts` vòng tick; `jobs/job-runner.ts` `runDue`
- Vấn đề: worker không ghi `stats` của job tick. Không thấy được số folio J15 đã đóng, đã ghi nợ, đang chờ hoàn hay bị lỗi qua mỗi nhịp.
- Vì sao quan trọng: OPS/MGR không theo dõi được J15 trên production. Phát hiện lỗi im lặng phải dựa vào truy vấn DB bằng tay.
- Đề xuất sửa: log JSON `job done` kèm `stats` khi stats khác 0, và `level:error` khi `failed > 0`. OPS thêm cảnh báo theo `failed`. Có thể làm sớm ở rc.5 theo phần tùy chọn của thẻ 02.
- Trạng thái: Open

### FB-R3-ARC-BEB-J15-05
- Mức độ: Suggestion (ARC nhận việc, v1.0.1)
- Vị trí: `src/worker-jobs.ts`, các `*WorkerJobs`/`*WorkerHooks`, cùng các `onModuleInit` đăng ký job trong api
- Vấn đề: gốc của lỗi vẫn còn. Worker dựng đối tượng bằng tay song song với container Nest, và J15 vẫn được đăng ký hai nơi. Test (a) chặn việc thiếu job (api ⊆ worker), nhưng không chặn hook nối lệch ở các job khác. Test (a) cũng đọc trường private (`debtOnCheckoutHandler`…), dễ vỡ khi đổi tên.
- Vì sao quan trọng: mỗi job mới cần nối hook xuyên module lại phải viết một "worker composition" riêng. Rủi ro lệch tăng dần theo số job.
- Đề xuất sửa: ADR-0xx (ARC, v1.0.1): worker khởi động bằng `NestFactory.createApplicationContext(WorkerModule)`, dùng chung các module với api trừ HTTP. Danh sách job lấy từ một `JobRegistry` duy nhất. Bỏ các `*WorkerJobs`/`*WorkerHooks` và test đọc trường private. Đi kèm thẻ 03 và 04.
- Trạng thái: Open

## Điểm làm tốt
- Chứng minh test (a) **đỏ trên mã cũ** (thiếu đúng `folio.close`, khớp log 19 job của OPS) trước khi sửa. Test đặt ở mức "api ⊆ worker" nên chặn được cả lớp lỗi này cho mọi job sau.
- Tách hàm nối dùng chung thay cho chép lại, nên api và worker đi chung một đường cho công nợ, định tuyến hoàn và hook refund. Phần dời trong api đúng nguyên văn, dễ review.
- Báo cáo nói thẳng phần chưa chạy được và tự đặt điều kiện "chưa xanh trên DB thì không gộp". Đúng tinh thần của protocol.
