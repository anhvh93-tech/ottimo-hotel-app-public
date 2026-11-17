# ARC review – BE PR #187 (FB-INV-011: tỷ giá bán Vietcombank, `fx` của monthly-rates)

- Round 5 – bước Review (rút gọn) – FB-INV-011
- PR: #187 `r5-fb011-be-fx` @ `4d16f043`
- Đã đọc: diff toàn bộ (trừ snapshot 14.881 dòng: chỉ kiểm `id`/`prevId`), hợp đồng `rounds/round-05/fb-inv-011/contract.md`, `src/jobs/job-runner.ts`, `src/worker.ts`, `src/db/migrate.ts`, `test/migrations-journal.test.ts`, `infra/postgres/init/02-roles.sh`, journal của #172 @ `1a848c2a`, nhánh cục bộ `r5-v5-45`, phần `fx.ts` của FE #188.
- CI #187: mọi job xanh trừ gitleaks (do nhánh FE cũ, không tính cho PR này theo ORC).

## Kết luận: DUYỆT CÓ ĐIỀU KIỆN

Gộp khi đã sửa 187-01 (chỉ câu chú thích + quy tắc gộp, không đổi mã). Không có Blocker/Major. Không ESC.

## Ba điểm ORC hỏi – quyết định của ARC

### (1) Số và thứ tự migration

Sự thật đã kiểm:
- `main` và production (v1.0.5) có 72 migration: 0000…0095, `idx` 0…71, `when` cuối = `1792782179681` (0095).
- #172 (đã ARC duyệt 07/11, còn mở): `0097_complimentary_follows_revenue`, `idx` 72, `when` `1792782181681`.
- #187: `0098_fx_rates_fb_inv_011`, `idx` 72, `when` `1792782183681`, snapshot `0098` có `prevId` = id của `0095`.
- Drizzle chỉ áp các mục có `when` lớn hơn dòng mới nhất trong `drizzle.__drizzle_migrations`, theo thứ tự mảng. Mục gộp sau mà có `when` nhỏ hơn sẽ bị **bỏ qua im lặng** trên DB đã chạy mục kia. `test/migrations-journal.test.ts` chặn việc này trong CI (`idx` = vị trí, `when` tăng chặt) – nên rủi ro thật chỉ là người gộp sau sửa xung đột sai rồi tắt test.
- Ở thẻ 172-01 (07/11) ARC đã dành 0098 cho V5-45 (`r5-v5-45`) và 0099 cho PR-M. Kiểm lại hôm nay: `r5-v5-45` chỉ còn nhánh cục bộ, không có PR, vẫn dùng tên 0097; PR-M chưa có migration nào trên `main`. Cả hai đang dừng từ 07/11.

**Quyết định (ARC, quyền kỹ thuật):**
1. Tên tệp **cố định**: #172 giữ `0097`, #187 giữ `0098`. Không đổi tên tệp khi gộp. Số trên tên tệp là không gian tên, không phải thứ tự áp (test không đòi tên tăng theo mảng).
2. **Thứ tự áp = thứ tự gộp.** PR gộp **sau** phải dựng lại journal từ `main` mới nhất: `idx` = `idx` cuối + 1, `when` = `when` cuối + 2000, sinh lại snapshot của mình với `prevId` = id snapshot cuối trên `main` (nếu không, hai snapshot cùng `prevId` 0095 làm `drizzle-kit generate` báo va chạm). Không bao giờ trùng `when`.
   - Nếu **#187 gộp trước**: #187 giữ nguyên (`idx` 72, `when` 1792782183681). #172 đổi thành `idx` 73, `when` **1792782185681**, snapshot `0097` có `prevId` = id snapshot `0098`.
   - Nếu **#172 gộp trước**: #172 giữ nguyên (`idx` 72, `when` 1792782181681). #187 đổi `idx` 72 → **73**, giữ `when` 1792782183681, snapshot `0098` có `prevId` = id snapshot `0097`.
3. Thay phần còn lại của thẻ 172-01: chỗ dành 0098 cho V5-45 và 0099 cho PR-M **hết hiệu lực** (hai nhánh dừng, không PR). Khi hồi lại: V5-45 lấy **0099**, PR-M lấy số kế tiếp do ORC cấp. Số 0100 trở đi cần ARC mở rộng dải `ALLOWED` trong `test/migrations-journal.test.ts` (hiện trần 0099) – ARC làm khi có PR thứ nhất cần.
4. Deploy: hai migration đều độc lập (0098 chỉ chèn 2 dòng `config_parameter_def`, `ON CONFLICT DO NOTHING`), nên thứ tự nào cũng an toàn về dữ liệu; chỉ cần journal đúng như trên.

### (2) Gọi mạng Vietcombank bên trong giao dịch DB đang mở

**Chấp nhận** cho v1 này, không bắt tách. Lý do đã kiểm trong mã:
- Trước khi gọi mạng, giao dịch chỉ **đọc** (`params.get`, `SELECT` dòng `fx_rates.vietcombank`) – chưa ghi, chưa giữ khóa dòng, chưa có xid. Không chặn ai, không chặn vacuum đáng kể.
- `AbortSignal.timeout(10 000)` truyền vào `fetch` nên cắt cả lúc đọc thân (vòng `reader.read()` cũng bắt `signal.aborted`) → trần cứng ~10 s, dưới `idle_in_transaction_session_timeout = 30s` của `ottimo_app` (`02-roles.sh`). Thân ≤ 64 KiB.
- Tần suất: lần đầu khi worker khởi động, rồi tối đa 1 lần/giờ tới khi có bảng của hôm nay – thường 1–2 lần/ngày. Một cơ sở.
- Tách fetch ra ngoài cần đổi `JobDefinition` (thêm pha `prepare` ngoài giao dịch) – ảnh hưởng mọi job, không đáng cho một job, nhất là khi pg-boss sẽ thay vòng tick.

Cái giá thật: `worker.ts` chạy các khóa job **tuần tự** trong một tick, và `fx.refresh` đứng **đầu** danh sách của public-site → khi nó gọi mạng, các job tick sau (nhắc SLA yêu cầu web, dọn dẹp…) chậm tối đa 10 s, và giữ 1 kết nối pool. Chấp nhận được; xem Suggestion 187-02.

Điều kiện giữ nguyên trong các lần sửa sau: không thêm bất kỳ lệnh ghi/khóa nào **trước** `source()`; không nâng timeout quá 10 s. Khi chuyển pg-boss (hoặc thêm job gọi mạng thứ hai), tách fetch ra ngoài giao dịch.

### (3) Luật `fx` BE tự thêm

**Đồng ý cả ba**, đã ghi đúng trong OpenAPI `PublicFxRates`:
- **Ghi đè tay 7 ngày tính từ `effectiveFrom`**, hết hạn thì dùng lại tỷ giá Vietcombank còn mới của mã đó: hợp lý và an toàn hơn để tỷ giá tay sống mãi (đúng tinh thần hợp đồng "chỉ trả khi ≤ 7 ngày"). Rủi ro: OWN không biết tỷ giá tay đã hết hạn – xem 187-03.
- **`source = manual` khi có ít nhất một mã tay**: hợp lý. FE #188 không hiện `source` cho khách (chỉ dùng ngày), nên đây chỉ là thông tin vận hành.
- **`asOf` = ngày cũ nhất** trong các tỷ giá trả về: hợp lý, bảo thủ (chú thích không bao giờ nói tỷ giá mới hơn tỷ giá thật đã dùng). Hệ quả nhỏ: trang KRW có thể ghi ngày cũ hơn tỷ giá KRW thật khi USD là tỷ giá tay cũ – chấp nhận, không đáng đổi hợp đồng sang ngày theo từng mã.
- **Khớp FE #188**: FE tính tuổi theo ngày lịch `Asia/Ho_Chi_Minh` và bỏ khi tuổi > 7; BE tính theo **ngày nghiệp vụ** (có `business_day_rollover`), luôn ≤ ngày lịch. Nên mọi `fx` BE trả đều có tuổi FE ≤ tuổi BE + 1; chỉ trường hợp tuổi BE đúng 7 trong mấy giờ giữa nửa đêm và giờ chuyển ngày là FE ẩn (trang về VND). Lỗi an toàn, không cần sửa. Dải hợp lý BE (`FX_RATE_BOUNDS`) nằm trong dải FE (`FX_SANE`, USD 10 000–65 000 ⊃ 10 000–60 000; ba mã kia trùng) → BE không bao giờ trả tỷ giá mà FE lại ẩn.

## Thẻ feedback

### [FB-R5-ARC-BE-187-01]
- Mức độ: Minor
- Vị trí: `product/services/api/src/db/migrations/0098_fx_rates_fb_inv_011.sql` dòng 1–2; mô tả PR mục "Migration"
- Vấn đề: chú thích ghi "provisional, ORC confirms; `when` = 0095 + 4000 so 0097 can go before it". Câu này chỉ đúng khi #172 gộp trước. Nếu #187 gộp và deploy trước, giữ nguyên `when` 1792782181681 của 0097 sẽ làm migration của #172 bị drizzle bỏ qua im lặng trên production (test journal bắt được trong CI, nhưng chú thích đang chỉ sai cách sửa). Ngoài ra 0098 đã từng được dành cho V5-45 (thẻ 172-01).
- Đề xuất: thay hai dòng đầu bằng: "0098 (ARC 17/11, review #187): file name fixed; apply order = merge order – the PR merged second takes idx = last + 1, when = last when + 2000 and regenerates its snapshot from main (ARC-on-be-pr-187 (1))." Sửa mô tả PR tương tự. Gộp theo quy tắc (1) ở trên.

### [FB-R5-ARC-BE-187-02]
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/public-site/public/worker-jobs.ts` – `publicSiteWorkerJobs` trả `fxRefreshJob` ở **đầu** mảng
- Vấn đề: tick chạy tuần tự theo thứ tự đăng ký; lúc `fx.refresh` gọi mạng (≤ 10 s) các job tick đứng sau phải chờ.
- Đề xuất: đặt `fxRefreshJob(...)` ở **cuối** mảng (một dòng), để job nội bộ chạy trước, job gọi mạng chạy sau cùng. Không cần test mới.

### [FB-R5-ARC-BE-187-03]
- Mức độ: Suggestion
- Vị trí: `fx-rates.ts` `publicFxBlock` (ghi đè tay hết hạn sau 7 ngày); màn Tham số Desk
- Vấn đề: tỷ giá tay hết hạn im lặng; OWN có thể tưởng tỷ giá mình đặt vẫn đang dùng (hoặc, khi Vietcombank cũng lỗi quá 7 ngày, trang chỉ còn VND mà không ai biết lý do).
- Đề xuất: không làm trong PR này. Ghi vào backlog cho FE Desk khi thêm nhãn tiếng Việt của 2 khóa (đã nêu trong PR): dòng gợi ý "Tỷ giá tay chỉ dùng 7 ngày từ ngày hiệu lực". Mục "Cần chú ý" `fx_rate_fetch_failed` đã phủ trường hợp Vietcombank lỗi.

## Đã kiểm, không có vấn đề
- Đúng hợp đồng: `fx` tùy chọn, `base` VND, 4 mã allowlist, số dương, vắng khi không có tỷ giá ≤ 7 ngày, không endpoint mới, cùng cache 60 s/READ ONLY/`statement_timeout` 1 s; `price-estimate` không đổi.
- Đọc XML không dùng thư viện, chặn DOCTYPE/ENTITY/CDATA/PI/thực thể lạ, host allowlist, không theo redirect, cắt 64 KiB khi đọc luồng (SEC sẽ review sâu phần này).
- `fx_rates.vietcombank` chỉ worker ghi (hook `before` → 403); `fx_rate_overrides` chỉ OWN, mã ngoài allowlist 422 `NOT_ALLOWED`, ngoài dải 422 `PARAM_OUT_OF_RANGE` kèm `min`/`max`.
- Job: bảng cũ hơn không ghi đè bảng đã lưu; lỗi giữ tỷ giá cũ, log chỉ mã lỗi; mục "Cần chú ý" tối đa 1/ngày, tự đóng khi lấy được; `FX_RATES_FETCH` để trống chỉ bật trên staging/production, giá trị sai làm worker dừng khi khởi động; api đăng ký job ở chế độ `off` (api không gọi ra ngoài).
- Worker ghi thẳng `config_parameter` (không qua `setParameter`) nên cache monthly-rates của api chỉ hết theo TTL 60 s – đúng mô tả "chậm tối đa 60 giây", chấp nhận.
- OpenAPI 0.3.13 bổ sung 3 chỉ thêm; generated `openapi-schemas.ts` và api-client đã sinh lại; spec validator, RBAC `--strict`, Redocly xanh.

| 2026-11-17 | 5 | ARC DUYỆT CÓ ĐIỀU KIỆN BE #187 (FB-INV-011) @ `4d16f043`: (1) migration – tên tệp cố định 0097 (#172) và 0098 (#187), thứ tự áp = thứ tự gộp, PR gộp sau lấy `idx` = cuối + 1, `when` = cuối + 2000 và sinh lại snapshot từ `main` (#187 trước: #172 → idx 73, when 1792782185681; #172 trước: #187 → idx 73, giữ when 1792782183681); chỗ dành 0098 V5-45/0099 PR-M của thẻ 172-01 hết hiệu lực, V5-45 hồi lại lấy 0099, ≥ 0100 cần ARC mở dải test; (2) chấp nhận gọi Vietcombank trong giao dịch job (chỉ đọc trước fetch, trần 10 s < idle 30 s, ≤ 1 lần/giờ), tách khi chuyển pg-boss; (3) đồng ý luật `fx` (tay ≤ 7 ngày từ hiệu lực, `manual` khi có một mã tay, `asOf` cũ nhất), khớp FE #188 (dải BE ⊂ dải FE, FE theo ngày VN). Thẻ 187-01 Minor (sửa chú thích migration trước gộp), 187-02/03 Suggestion. Không ESC | ARC | rounds/round-05/reviews/ARC-on-be-pr-187.md |
