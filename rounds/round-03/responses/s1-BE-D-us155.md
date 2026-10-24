# BE-D trả lời review – US-155 "Yêu cầu đặt phòng từ website" (v1.0)

- Người trả lời: BE-D | Ngày: 24/10/2026 | Bước: Phản hồi & sửa
- Review được trả lời: `rounds/round-03/reviews/s1-SEC-on-us155.md`, `rounds/round-03/reviews/s1-ARC-on-us155.md`
- Nhánh `be-d/r3-us155-v1`, đã rebase lên `main` daf814c (có hợp đồng 0.3.8 bổ sung 4 `notePurgedAt`). Chưa push. `openapi-meta.ts`/`openapi-schemas.ts` sinh lại bằng `gen-openapi-meta.mjs` (không gộp tay; sau khi sinh lại không khác bản tự gộp).

## Thẻ SEC

### FB-R3-SEC-US155-01 (Major) – Done (cách (a))
- `UseCaseResult.storeBody?: false` (mới, `shared/http/unit-of-work.ts`): use case tự quyết lưu `{ id }` thay cho cả phản hồi – cùng cơ chế `RunOptions.storeBody` đã có cho C3.
- Áp dụng:
  - `transitionWebsiteBookingRequest` (claim, release, decline, mark-spam, reopen, erase): luôn chỉ lưu `{ id }`. Khi phát lại thì đọc lại yêu cầu theo **quyền hiện tại** của người gọi (`getWebsiteBookingRequest`): đã xóa WR8 → không có C2; ra khỏi phạm vi → 404.
  - `createHoldFromQuote` khi giữ chỗ là `website` (chỉ báo giá gắn yêu cầu mới ra `website`) và `createReservation` có `websiteBookingRequestId`: chỉ lưu `{ id }`; phát lại → đọc lại đơn cho người gọi.
- Test (`public-site-r3-bed.test.ts`):
  - claim lưu `{ id }`, phát lại 200 + `Idempotent-Replayed` + đọc lại đủ (người giữ thấy liên hệ);
  - sau WR8, phát lại cùng khóa → không còn `guestName`/`phone`/`email`/`note`;
  - giữ chỗ và đơn B2 lưu `{ id }`; B2 phát lại đọc lại đơn;
  - **quét** `idempotency_key.response_body` của tenant sau mọi luồng (claim, decline, reopen, mark-spam, erase, giữ chỗ, B2): 0 dòng chứa tên, SĐT hay lời nhắn của người gửi.
- Không làm (b) (xóa dòng `idempotency_key` khi xóa C2): với (a) bảng không còn chứa C2.

### FB-R3-SEC-US155-02 (Minor) – Done (phần BE)
- `http.ts`: hook `onRoute` đặt `bodyLimit` = 8 KB cho mọi route `/v1/public/` (2 route form). Fastify dừng body (cả chunked) **trước khi parse** → 413 `PAYLOAD_TOO_LARGE`.
- Test: chunked 64 KB → 413; `Content-Length` 9 KB → 413; 9 KB với Origin lạ → vẫn 413 (bị chặn trước handler – trước đây handler trả 403); route nhân viên giữ giới hạn chung.
- Còn: **OPS** xác nhận `request_body max_size 16KB` trên vhost landing + ca chunked 64 KB → 413 qua Caddy.

### FB-R3-SEC-US155-03 (Minor) – Done phía server
Ca mới trong `public-site-r3-bed.test.ts` / `be-d-r3-s1-units.test.ts`:
- B.1.1: lần 31/giờ/IP → 429 + `Retry-After`; `db.pool.connect` **không được gọi** (spy) cho cả GET token lẫn POST.
- B.1.2: 4 request đang chạy (giữ bằng cổng chờ) → request thứ 5 nhận 503 `SERVICE_UNAVAILABLE`, `Retry-After: 5`; trong lúc đó Desk vẫn trả 200; nhả ra thì cả 4 xong 200.
- B.1.4: gửi kèm cookie OWN → 202 như người lạ, không cột người dùng nào được ghi, khóa idempotency `public_site`. Cookie FD gọi thao tác Desk từ origin landing (app cấu hình origin như staging) → 403 trước khi tìm bản ghi.
- B.1.6: app `trustProxy = ['10.0.0.5']`: qua proxy, khách = mục chưa tin cậy ngoài cùng bên phải của `X-Forwarded-For`; phần trái giả không đổi bộ đếm (lần 31 → 429); khách thật khác sau cùng proxy có bộ đếm riêng; gọi thẳng không qua proxy thì header bị bỏ qua.
- B.1.10: khóa ký < 32 ký tự → module từ chối khởi động; trùng giá trị với `SESSION_SECRET` → lỗi cấu hình.
- B.1.12: 40 lần/ngày từ một /48 (mỗi lần một /64 khác) → lần 41 bị 429; /48 khác vẫn 202.
- B.2.8: SSE `website_request.changed` – qua kênh `LISTEN` thật và qua hub: dữ liệu chỉ `{ id }`, gói tin chỉ `p,t,id,r,u`, không có tên/SĐT/lời nhắn; FD nhận 3 sự kiện (mới, nhận, từ chối), SAL giữ nhận 3, SAL khác nhận 2 (mới + nhận), không nhận sự kiện từ chối.
- B.2.1–B.2.3 (hiển thị chuỗi độc hại trên Desk) thuộc FE-B/QA.

### FB-R3-SEC-US155-04 (Suggestion) – Ghi nhận
Bộ đếm RAM và `inFlight` theo tiến trình: đúng khi 1 bản. Chuyển OPS ghi vào runbook (cùng ARC US155-04).

## Thẻ ARC

### FB-R3-ARC-US155-01 (Major) – Done (cách (a))
- Migration mới **0087** `0087_public_site_slug_unique.sql` (không sửa 0086). Không đổi schema, snapshot là bản của 0086 (giống mẫu 0064/0084); journal `when` = 0086 + 2 s.
- `public_resolve_property` viết lại: CTE các cơ sở `active` khớp slug, chỉ trả khi `count = 1`. App (`PublicBookingService.resolve`): `rows.length !== 1` → 404.
- Test: tạo tổ chức thứ hai có cơ sở cùng mã → form token 404, gửi form 404, không tổ chức nào có thêm dòng; đổi mã đi thì form chạy lại.

### FB-R3-ARC-US155-02 (Minor) – Done
- 0087: trigger `BEFORE DELETE` `website_booking_request_delete_spam_only` – chỉ cho xóa dòng `status = 'spam'`, khác → `check_violation`.
- Test kiến trúc (unit): trong `src` chỉ có **một** câu `DELETE FROM website_booking_request` (job T19 `public-site/public/worker-jobs.ts`), có `status = 'spam'`; 0087 có trigger. Test trên PostgreSQL: xóa một dòng không phải spam → lỗi trigger.

### FB-R3-ARC-US155-03 (Minor) – Việc còn lại (Sprint 2, theo đề xuất ARC)
Chuyển interface + token `WEBSITE_REQUEST_PORT` sang `reservations/public` (hoặc `sales/public`), `public-site` provide; thêm luật `module-boundaries`.

### FB-R3-ARC-US155-04 (Minor) – Việc còn lại (OPS)
Runbook/`docker-compose.prod.yml`: "api 1 bản cho tới khi bộ đếm bước 0 chuyển sang `rate_limit_counter`".

## Hợp đồng
`notePurgedAt` (0.3.8 bổ sung 4) đã có trên `main`; sau rebase serializer tự trả trường này (mã T13 trên `main` đã điền). Không còn việc BE cho mục này.
