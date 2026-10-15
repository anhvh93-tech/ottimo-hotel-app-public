# BE review ARC – Round 1, bước 3

- Người review: BE | Tác giả: ARC (khung api phần cuối do OPS dựng) | Ngày: 15/10/2026
- Phạm vi đã đọc: `product/docs/architecture.md`, `adr/ADR-001…013`, `erd.md` (đủ 15 mục), `api/openapi.yaml` (116 path, ~136 operation; đã parse YAML và đối chiếu `x-stories` với 74 story Must R2 trong `03-backlog/backlog.md`), `coding-standards.md`, `product/services/api/**`, `product/infra/docker-compose.yml`, `product/infra/postgres/init/01-extensions.sql`. Tham khảo `business-rules.md` (mục 1, 2, 13), `state-machines.md`, `qa/test-strategy.md` mục 5, `rounds/round-01/outputs/ARC/report.md`.
- Góc nhìn: người sẽ code R2. Câu hỏi đặt ra cho mỗi phần: làm được bằng Drizzle + PostgreSQL 17 + pg-boss không, có chỗ nào phải đoán khi code không, test được không.
- Kết quả tự kiểm nhanh:
  - OpenAPI parse được, không có `$ref` hỏng.
  - 74/74 story Must R2 có ít nhất 1 operation gắn `x-stories`.
  - Mọi operation đều có `x-roles`.
  - 1 schema thừa (`CommissionStatus`).
  - 5 POST có ghi dữ liệu nhưng thiếu `Idempotency-Key` (thẻ 11).
  - 12 ví dụ UUID sai định dạng (thẻ 13).

Tổng: **18 thẻ** – 0 Blocker · 8 Major · 8 Minor · 2 Suggestion.

---

### FB-R1-BE-ARC-01
- Mức độ: Major
- Vị trí: `erd.md` mục 2 (RLS) và mục 4.2 (`app_user`, `user_session`), 4.5 (`guest_access_token`, `guest_session`); ADR-007 điểm 4; ADR-011 điểm 3; `openapi.yaml` `/v1/auth/login`, `/v1/guest/*`, `/v1/webhooks/payments/{provider}`, `/v1/webhooks/channel/{provider}`
- Vấn đề: RLS đặt ngữ cảnh bằng `SET LOCAL app.organization_id / app.property_id` ở đầu giao dịch. Tuy nhiên có ít nhất 6 truy vấn phải chạy **trước khi** biết tổ chức hoặc cơ sở. Với `FORCE ROW LEVEL SECURITY` và vai `ottimo_app` không có `BYPASSRLS`, cả 6 truy vấn sẽ trả 0 dòng:
  1. Đăng nhập: tìm `app_user` theo `username`. Bảng này ở cấp tổ chức, nhưng lúc đăng nhập chưa biết tổ chức nào. Thêm nữa, `username` chỉ UK **theo tổ chức** trong khi body login không có mã tổ chức, nên khi có ≥ 2 tổ chức sẽ khớp nhiều dòng.
  2. Kiểm cookie `ottimo_sid` mỗi request: đọc `user_session` khi chưa có ngữ cảnh.
  3. `POST /v1/guest/sessions`: tìm `guest_access_token` theo `token_hash`. Đường dẫn `/v1/guest/*` không có `propertyId`.
  4. Webhook/IPN: ADR-011 định nghĩa `POST /v1/webhooks/{provider}/{propertySlug}`, còn OpenAPI là `/v1/webhooks/payments/{provider}` (không có cơ sở). Vì vậy không biết đặt ngữ cảnh cơ sở nào để ghi `inbox_message` / `payment`.
  5. Worker: "mỗi job lặp theo từng cơ sở" cần đọc danh sách `property` trước. Bảng `property` cấp tổ chức, mà worker không có tổ chức.
  6. pg-boss: tạo và dùng schema `pgboss` riêng, không có cột tenant. Cần nói rõ là bảng này nằm ngoài RLS và ai cấp quyền.
  
  ERD chỉ ghi "Job hệ thống dùng vai DB riêng có ghi nhật ký" (ADR-007), nhưng ERD mục 2.1 lại cho `ottimo_app` dùng chung cho cả api và worker. Hai chỗ nói khác nhau và không có cơ chế cụ thể.
- Vì sao quan trọng: đây là đường vào của mọi request (đăng nhập, phiên, app khách, IPN tiền). Nếu không chốt trước, BE sẽ tự chế, mà tự chế thì dễ thành "tạm tắt RLS" hoặc dùng vai `BYPASSRLS` cho cả api, làm mất lớp bảo vệ ADR-007.
- Đề xuất sửa: thêm vào `erd.md` mục 2 một tiểu mục "Truy vấn mồi (bootstrap)":
  - (a) Tạo các hàm `SECURITY DEFINER` hẹp, thuộc `ottimo_owner`, `search_path` cố định, chỉ trả đúng cột cần:
    - `auth_find_user(login text)` → `(user_id, organization_id, password_hash, status, locked_until)`
    - `auth_resolve_session(sid_hash)` → `(user_id, organization_id, active_property_id, expires_at)`
    - `guest_resolve_token(token_hash)` → `(reservation_id, property_id, organization_id, expires_at, revoked_at)`
    - `webhook_resolve_property(provider, slug)`
    - `worker_list_properties()`
  - (b) Chốt `username` **duy nhất toàn hệ thống** (đơn giản nhất cho MVP), hoặc thêm `organizationCode` vào body login.
  - (c) Sửa OpenAPI webhook về dạng của ADR-011 `/v1/webhooks/{kind}/{provider}/{propertySlug}`, hoặc ghi rõ cơ sở được suy từ `paymentId`/`external_property_ref` bằng hàm (a).
  - (d) Ghi rõ schema `pgboss` nằm ngoài RLS, `ottimo_app` chỉ có quyền DML trên đó, còn việc cài/nâng cấp schema do `ottimo_owner` làm ở bước migrate.
  - (e) Bỏ câu "vai DB riêng cho job" ở ADR-007, hoặc định nghĩa vai đó trong ERD mục 2.1.
- Trạng thái: Open

### FB-R1-BE-ARC-02
- Mức độ: Major
- Vị trí: `erd.md` mục 2.3 (mẫu policy) và 2.2; ADR-007 điểm 4
- Vấn đề:
  1. Mẫu policy `property_id = current_setting('app.property_id', true)::uuid` dựa vào giả định "thiếu biến → NULL → 0 dòng". Giả định này **sai khi kết nối được tái sử dụng** (pool). Sau khi một giao dịch có `SET LOCAL app.property_id` kết thúc, trên cùng kết nối đó `current_setting('app.property_id', true)` trả về **chuỗi rỗng `''`**, không phải NULL. Khi đó `''::uuid` ném lỗi `invalid input syntax for type uuid`. Hệ quả: mọi truy vấn quên đặt ngữ cảnh sẽ nổ 500 một cách ngẫu nhiên (tùy kết nối nào lấy từ pool), thay vì trả 0 dòng. Test bắt buộc "context cơ sở B → 0 dòng" (mục 2.6) cũng sẽ đỏ hoặc chập chờn.
  2. ADR-007 dùng `app.property_ids` (số nhiều, cho chủ đầu tư thấy nhiều cơ sở), còn ERD dùng `app.property_id` (số ít). Hai tài liệu không khớp.
  3. `SET LOCAL` không nhận tham số bind. Cần dùng `set_config(name, value, true)`, và điều này chưa được ghi.
- Vì sao quan trọng: RLS là lưới an toàn cách ly dữ liệu giữa các cơ sở (SEC C1). Lỗi kiểu (1) chỉ lộ ra khi chạy với pool thật, rất khó tìm nguyên nhân.
- Đề xuất sửa:
  - Đổi mẫu policy thành `property_id = NULLIF(current_setting('app.property_id', true), '')::uuid`, áp tương tự cho `organization_id`. Đặt biểu thức này trong hàm `app_current_property()` khai báo `STABLE` để policy gọn và planner tối ưu được.
  - Chốt một tên biến: MVP dùng `app.property_id` (số ít, vì mỗi request chỉ một cơ sở theo đường dẫn) và sửa ADR-007 cho khớp. Báo cáo chuỗi (R4+) sẽ dùng policy riêng có `= ANY(app_current_property_ids())`.
  - Ghi vào coding-standards mục 6: middleware gọi `SELECT set_config('app.property_id', $1, true), set_config('app.organization_id', $2, true), set_config('app.user_id', $3, true)` ở **câu lệnh đầu tiên** của giao dịch, và mọi truy vấn (kể cả chỉ đọc) đều chạy trong giao dịch.
  - Thêm test bắt buộc "đã dùng kết nối có ngữ cảnh, rồi truy vấn không ngữ cảnh → 0 dòng, không lỗi".
- Trạng thái: Open

### FB-R1-BE-ARC-03
- Mức độ: Major
- Vị trí: `product/infra/docker-compose.yml` (`DATABASE_URL` của api/worker), `product/infra/postgres/init/01-extensions.sql`, CI service `postgres:17` (ADR-012); khung `services/api/src/main.ts`
- Vấn đề:
  1. Api và worker kết nối bằng `POSTGRES_USER` (`ottimo`), tức là **superuser** do image postgres tạo. Superuser luôn bỏ qua RLS, kể cả khi bảng có `FORCE ROW LEVEL SECURITY`. Ngoài ra `REVOKE UPDATE/DELETE` không có tác dụng với superuser. Như vậy trên dev và CI:
     - mọi test RLS (ERD 2.6) và test K8 "thử DELETE → lỗi quyền" sẽ **không đo được gì**;
     - dev quên đặt ngữ cảnh vẫn thấy đủ dữ liệu, nên lỗi chỉ lộ ra trên staging/production.
  2. Script init chưa tạo 3 vai `ottimo_owner / ottimo_app / ottimo_readonly` (ERD 2.1). Cũng chưa có biến tách URL cho migration và URL cho runtime.
  3. Phụ (khung api): `trustProxy: true` tin mọi `X-Forwarded-For`. Nếu cổng api lộ ra ngoài Caddy thì giới hạn tần suất đăng nhập/xác minh khách theo IP có thể bị giả mạo. Nên giới hạn về địa chỉ mạng của Caddy.
- Vì sao quan trọng: kiến trúc bảo mật dữ liệu theo cơ sở và chống xóa sổ sách tiền dựa vào quyền DB, nên môi trường test phải chạy đúng vai thì kết quả test mới có nghĩa.
- Đề xuất sửa:
  - ARC ghi yêu cầu vào ERD 2.1 / dev-setup; OPS hiện thực ở đầu R2.
  - Init tạo `ottimo_owner` (sở hữu schema, NOSUPERUSER), `ottimo_app` (NOSUPERUSER NOBYPASSRLS, chỉ quyền DML được cấp), `ottimo_readonly`.
  - Thêm `MIGRATION_DATABASE_URL` (owner) bên cạnh `DATABASE_URL` (app) trong `.env.example`, compose và CI. `pnpm db:migrate` dùng URL owner; api/worker/test dùng URL app.
  - Áp tương tự cho DB `ottimo_test`.
  - Thêm test kiến trúc: `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user` phải ra `false,false` khi chạy test.
  - Đổi `trustProxy` thành địa chỉ/subnet của Caddy.
- Trạng thái: Open

### FB-R1-BE-ARC-04
- Mức độ: Major
- Vị trí: ADR-008 điểm 2 và 4; `architecture.md` mục 7 và 9.1 nguyên tắc 1; `coding-standards.md` mục 5; `services/api/src/clock.ts`; `qa/test-strategy.md` mục 5.2 (đề xuất của QA)
- Vấn đề:
  1. Interface `Clock` trong khung chỉ có `now()`. ADR-008 yêu cầu `businessDate(propertyId)` và `atLocal(date, time, propertyId)`, coding-standards lại gọi `clock.todayAt(tz)`: ba tài liệu dùng ba tên khác nhau.
  2. `FixedClock` **đóng băng** thời gian, gây ra:
     - mọi bản ghi tạo trong một phiên dev có cùng `created_at`;
     - hạn giữ chỗ không bao giờ tới;
     - job tick mỗi phút luôn thấy cùng một thời điểm.
  3. Thời gian thật vẫn lọt vào ở hai chỗ mà `CLOCK_OVERRIDE` không với tới:
     - (a) pg-boss lên lịch `startAfter` và cron theo **giờ của DB**, không theo `Clock`. Đặt giờ giả 22:59 thì job J5 lúc 23:00 vẫn chạy theo giờ thật.
     - (b) SQL: cột `DEFAULT now()`, hoặc điều kiện kiểu `hold_expires_at < now()` trong truy vấn quét, đều dùng giờ máy chủ DB.
  4. Api và worker là hai tiến trình riêng. Mỗi bên đọc `CLOCK_OVERRIDE` lúc khởi động nên không thể tua giờ đồng bộ khi đang chạy.
- Vì sao quan trọng: khoảng 20 ca test mốc giờ của QA (giữ chỗ, hạn khai báo 23:00 / 12 giờ NN, no-show 18:00 / 23:00, nhắc trả phòng, 07:00 OC→OD) không chạy E2E được. Lỗi "đúng mốc ±1 phút" là loại lỗi sai tiền và sai pháp lý hay gặp nhất.
- Đề xuất sửa (BE đồng ý đề xuất QA, cụ thể hóa):
  - ADR-008 chốt interface: `now(): Instant`, `businessDate(tz): LocalDate`, `atLocal(date, time, tz): Instant`.
  - Cài đặt:
    - `SystemClock` cho production.
    - `MutableClock` cho dev/staging/test. Giờ giả lưu dưới dạng **offset** trong bảng 1 dòng `dev_clock(offset_ms, frozen_at)` để api và worker đọc chung, cache 1 giây và xóa cache bằng `NOTIFY clock_changed`.
  - Endpoint chỉ dev/staging, cùng một guard: `POST /__test__/clock {set|advance}`, `POST /__test__/jobs/{jobKey}/run`.
    - Module này **không được import** khi `NODE_ENV=production`.
    - CI kiểm bundle production không chứa chuỗi `__test__`.
    - Không đưa vào `openapi.yaml` chính; để ở `openapi.test.yaml` riêng.
  - Quy tắc mới trong coding-standards:
    - Cấm `now()`, `current_date`, `CURRENT_TIMESTAMP` trong SQL nghiệp vụ. Thời điểm luôn truyền từ `Clock` làm tham số.
    - `DEFAULT now()` chỉ được dùng cho cột kỹ thuật (`created_at` kỹ thuật của outbox/log).
    - Lint: tìm chuỗi `now()` trong file `.sql` và trong template `sql\``.
  - Job viết theo dạng **quét điều kiện theo `Clock.now()`** (xem thẻ 05). pg-boss chỉ là "chuông" đánh thức, để `/__test__/jobs/{key}/run` cho kết quả giống hệt chạy theo lịch.
- Trạng thái: Open

### FB-R1-BE-ARC-05
- Mức độ: Major
- Vị trí: `architecture.md` mục 9.1 (nguyên tắc 3, 4; J1, J4, J18); `erd.md` 4.12 `job_run`; ADR-003 điểm 2; ADR-008 điểm 4
- Vấn đề: thiết kế "đúng một lần" chưa đủ để code mà không đoán:
  1. **Thời điểm ghi `job_run` chưa rõ.**
     - Nếu INSERT `job_run` (UK) ở giao dịch riêng **trước** khi làm việc, rồi worker chết giữa chừng, thì slot đó đã bị đánh dấu và không bao giờ chạy lại: mất nhắc 23:00.
     - Nếu INSERT ở cuối mà không khóa, hai worker (khi deploy chồng lấn) có thể cùng chạy phần hiệu ứng trước khi đụng UK.
  2. **J1 dùng `singletonKey` = id đơn.** Khi gia hạn giữ chỗ (B3), job mới cùng `singletonKey` sẽ bị pg-boss bỏ qua vì job cũ còn ở trạng thái `created`. Hạn mới chỉ còn dựa vào lần quét mỗi phút. Chạy vẫn đúng nhưng trái mô tả, và job cũ lúc chạy phải tự bỏ qua.
  3. **pg-boss chỉ bảo đảm giao ít nhất một lần.** Chưa có quy tắc "handler idempotent: hiệu ứng nghiệp vụ, `job_run` và outbox nằm trong **cùng một** giao dịch của app (pool app có ngữ cảnh RLS), không dùng kết nối của pg-boss".
  4. **Cron theo múi giờ cơ sở.** pg-boss `schedule()` là theo tên job, toàn cục, nên mỗi cơ sở cần một tên lịch riêng (`j5:<propertyId>`), hoặc đổi sang tick mỗi phút rồi tự so mốc theo `property.timezone`. Kiến trúc đang dùng lẫn cả hai cách.
  5. **J1 đua với `confirm-deposit`.** Chưa ghi thứ tự khóa: cả hai phải `SELECT … FROM reservation WHERE id=$1 FOR UPDATE` trước, rồi kiểm lại `status='hold'` và hạn.
  6. **LISTEN/NOTIFY.** Api cần 1 kết nối riêng ngoài pool để `LISTEN` (SSE, `config_changed`), có tự nối lại khi rớt. Chưa ghi.
- Vì sao quan trọng: J1 (mở lại phòng), J5 (hạn khai báo – bị phạt), J4 (nhắc trả phòng) chạy sai hoặc chạy 2 lần sẽ gây sai tồn phòng, gửi tin trùng cho khách, hoặc bỏ sót hạn pháp lý.
- Đề xuất sửa: thêm "mẫu handler job" vào `architecture.md` 9.1:
  1. `BEGIN`
  2. `set_config` ngữ cảnh cơ sở
  3. `INSERT INTO job_run(...) ON CONFLICT DO NOTHING RETURNING id`. Không ra dòng → `COMMIT` và thoát (slot đã chạy xong).
  4. Làm việc + outbox
  5. Cập nhật `job_run.status='done'`, `stats`
  6. `COMMIT`
  
  Nếu lỗi thì ROLLBACK, bản ghi `job_run` cũng mất, pg-boss retry. Như vậy đúng một lần một cách tự nhiên, không cần trạng thái `started`.
  
  Các điểm còn lại:
  - J1 dùng `singletonKey = reservationId + ':' + hold_expires_at`. Handler luôn kiểm lại `hold_expires_at <= clock.now()` trong giao dịch.
  - Chốt **một** cơ chế lập lịch: tick mỗi phút (`hk.tick`, `reminders.tick`) lặp theo cơ sở và so mốc theo `Clock` (hợp với thẻ 04), bỏ cron theo tz.
  - Ghi thứ tự khóa (đơn trước, rồi `room`, rồi `folio`) để tránh deadlock.
  - Ghi kết nối LISTEN riêng cho api.
- Trạng thái: Open

### FB-R1-BE-ARC-06
- Mức độ: Major
- Vị trí: `architecture.md` 9.1 (J1 "báo người tạo", J2, J5, J6, J7, J10, J11, J14, J17; nguyên tắc 6); ADR-005 điểm 4 (Web Push); `erd.md` (không có bảng tương ứng); `openapi.yaml` `listAttentionItems`, `AttentionItem`
- Vấn đề:
  1. **"Cần chú ý" chưa có mô hình lưu.** Các job ghi "tạo mục Cần chú ý `no_show_call`", "→ `registration_overdue`", "→ `data_quality`"…, nhưng ERD **không có bảng** nào cho các mục này. Đồng thời `AttentionItem` trong OpenAPI giống kết quả **tính lúc đọc** (gộp `count`, `reservationIds`). Chưa chốt mục nào tính lúc đọc từ dữ liệu nghiệp vụ, mục nào là sự kiện phải lưu: ví dụ `deposit_after_cancel`, `channel_sync_error`, `data_quality`, `no_show_call` khi đã gọi rồi thì ẩn ở đâu.
  2. **"Báo người tạo / nhắc bộ phận" chưa có nơi lưu.** J1, J2, J10, J11 và `createDepositNotice` (202 "FD/SAL nhận thông báo") cần một hộp thông báo cho nhân viên. ERD không có bảng `staff_notification` (người nhận, loại, đã đọc), OpenAPI không có `GET /v1/me/notifications`.
  3. **Web Push chưa có API.** ADR-005 chọn Web Push cho PWA, nhưng OpenAPI không có endpoint đăng ký `PushSubscription`, ERD không có bảng, và danh sách biến môi trường thiếu khóa VAPID.
- Vì sao quan trọng: US-012, US-085 AC2, US-110 AC2, US-136 AC1 đều phụ thuộc vào phần này. Thiếu nó thì BE và FE/MOB sẽ mỗi bên tự chế một kiểu.
- Đề xuất sửa:
  - Chốt trong ERD:
    - (a) "Cần chú ý" **tính lúc đọc** cho các mục suy ra được từ trạng thái (giữ chỗ sắp hết, khai báo đến hạn, thị thực, kỳ thu, OOO, phiếu Cao). Các mục là sự kiện (`deposit_after_cancel`, `channel_sync_error`, `data_quality`, `overbooking`) thì lưu bảng `attention_event(kind, severity, ref_type, ref_id, created_at, resolved_at, resolved_by)`.
    - (b) Bảng `staff_notification(user_id, kind, ref_type, ref_id, created_at, read_at)` + `push_subscription(user_id, endpoint, keys_enc, created_at, revoked_at)`.
  - Chốt trong OpenAPI: `GET /v1/me/notifications`, `POST /v1/me/notifications/{id}/read`, `PUT /v1/me/push-subscription`; SSE thêm sự kiện `notification.created`.
  - Thêm `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` vào danh sách biến môi trường.
  - Nếu muốn giảm phạm vi R2: ghi rõ "Web Push R3, R2 chỉ thông báo trong app + SSE".
- Trạng thái: Open

### FB-R1-BE-ARC-07
- Mức độ: Major
- Vị trí: ADR-002 (Drizzle + "migration SQL do drizzle-kit sinh"); `coding-standards.md` mục 6 dòng Migration (`NNNN_<mô-tả>.sql` viết tay); `erd.md` mục 2, 4.5, 4.6, 6; khung `services/api` (chưa có `src/db/`)
- Vấn đề: chưa chốt **nguồn sự thật của schema**. ADR-002 cho drizzle-kit **sinh** migration, coding-standards lại mô tả file SQL đánh số **viết tay**. Đồng thời ERD dùng nhiều thứ drizzle-kit không sinh được hoặc sinh sai:
  - `EXCLUDE USING gist` (K1)
  - kiểu `daterange` (Drizzle không có sẵn, phải dùng `customType`)
  - policy RLS sinh tự động cho mọi bảng
  - `REVOKE` trên bảng append-only (K8)
  - trigger K7 và trigger kiểm `reservation_segment.room_id`
  - cột generated gọi hàm `revenue_group_of()` (phải là `IMMUTABLE`)
  - FK `DEFERRABLE` (thẻ 09)
  - hàm `SECURITY DEFINER` (thẻ 01)
  
  Nếu dùng `drizzle-kit push`/`generate` mà không có quy tắc, drizzle-kit sẽ không biết các đối tượng này. Lần generate sau có thể sinh lệnh xóa hoặc tạo lại sai, và schema thật lệch khỏi `schema.ts` mà không ai thấy.
  
  Thêm hai điểm nhỏ cùng nhóm:
  - `pg` trả `int8`/`bigint` dưới dạng **chuỗi**. Chưa có quy tắc parse kèm kiểm `Number.isSafeInteger` (coding-standards 4.1).
  - UUIDv7 "sinh ở ứng dụng": Node 22 và PostgreSQL 17 đều không có sẵn hàm này, nên cần chọn thư viện.
- Vì sao quan trọng: migration là việc đầu tiên của R2 (ước ~60 bảng). Nếu chọn sai quy trình, sửa lại sẽ tốn và có rủi ro mất ràng buộc chống đặt trùng một cách âm thầm.
- Đề xuất sửa (BE đề xuất, ARC chốt trong ADR-002 / coding-standards 6):
  - `src/db/schema/*.ts` (Drizzle) là nguồn **kiểu** cho truy vấn.
  - Migration là SQL trong `src/db/migrations/`:
    - sinh nháp bằng `drizzle-kit generate`, **được phép sửa tay**;
    - đối tượng drizzle-kit không biết thì nằm trong file `--custom`.
  - Cấm `drizzle-kit push` ở mọi môi trường.
  - CI có 2 bước:
    - (a) migrate từ DB rỗng, rồi chạy test kiến trúc kiểm: có EXCLUDE trên `room_occupancy`, mọi bảng có `property_id`/`organization_id` đều có RLS, bảng append-only không có quyền `UPDATE/DELETE`;
    - (b) `drizzle-kit generate` trên nhánh không được sinh file mới (`schema.ts` khớp migration).
  - `types.setTypeParser(20, parseSafeBigint)` (ném lỗi khi vượt `2^53`); Drizzle dùng `bigint({ mode: 'number' })`.
  - UUIDv7 dùng `uuid@^11` (`v7()`).
  - Đổi `src/db.ts` của khung thành `src/db/pinger.ts` để tránh trùng tên với thư mục `src/db/` theo `architecture.md` 17.
- Trạng thái: Open

### FB-R1-BE-ARC-08
- Mức độ: Minor
- Vị trí: ADR-009 điểm 2, 4, 7; `erd.md` 4.5 `room_occupancy` + mục 7.5; `openapi.yaml` `changeRoom`, `moveReservation`
- Vấn đề:
  1. **Exclusion constraint đang là IMMEDIATE (mặc định).** Đổi chéo căn giữa 2 đơn (A 203→204, B 204→203) là thao tác thật khi xử lý xung đột OTA (mục 7.5, B14). Với IMMEDIATE, hai lệnh chạy lần lượt trong cùng giao dịch sẽ luôn nổ 23P01 ở lệnh đầu tiên, và API không có hành động "đổi chéo".
  2. **Biên ngày.**
     - Khách nhận rồi rời ngay trong ngày (trả sớm B16 với ngày đi = hôm nay = ngày đến) sinh `daterange` rỗng và vi phạm CHECK `departure_date > arrival_date`. Chưa có quy tắc xử lý.
     - `room_occupancy` cũng nên có `CHECK (NOT isempty(stay_range))`.
  3. **Thứ tự khóa.** Kiểm mức giờ (điểm 7) khóa `room … FOR UPDATE`, nhưng chưa quy định **mọi** luồng ghi `OccupancyService` đều khóa dòng `room` theo thứ tự `room_id` tăng dần. Thiếu quy định này thì luồng đổi phòng (khóa 2 căn) và luồng đặt mới có thể deadlock.
  4. **Danh sách đêm trùng.** Lỗi 23P01 không cho biết đêm nào trùng. `ROOM_UNAVAILABLE.conflicts[]` cần một truy vấn bổ sung sau khi rollback. Nên ghi rõ để không ai cố đọc chi tiết từ thông báo lỗi.
- Vì sao quan trọng: đổi chéo và rời trong ngày là tình huống thật ở quầy. Deadlock gây lỗi 500 ngẫu nhiên lúc cao điểm.
- Đề xuất sửa:
  - Khai báo `EXCLUDE … DEFERRABLE INITIALLY IMMEDIATE`. Riêng use case đổi chéo dùng `SET CONSTRAINTS room_occupancy_no_overlap DEFERRED` (lỗi lúc COMMIT vẫn map ra `ROOM_UNAVAILABLE`).
  - Thêm action `POST …/reservations/{id}/actions/swap-room` (hoặc tham số `swapWithReservationId` trong `changeRoom`/`move`).
  - Quy tắc rời trong ngày: hoặc chuyển thành hủy/no-show có phí theo BR, hoặc giữ đêm đầu (đề nghị DOM chốt).
  - Thêm CHECK `NOT isempty`.
  - Ghi thứ tự khóa trong coding-standards 6 (dòng Tồn phòng).
  - Ghi: sau 23P01, rollback rồi `SELECT` các dòng `active` giao khoảng để dựng `conflicts[]`.
- Trạng thái: Open

### FB-R1-BE-ARC-09
- Mức độ: Minor
- Vị trí: `erd.md` 4.5 (`reservation.folio_id` not null), 4.6 (`folio.primary_reservation_id` UK); ADR-007 điểm 2 ("khóa ngoại kép")
- Vấn đề:
  1. **Khóa ngoại vòng.** `reservation.folio_id NOT NULL → folio` và `folio.primary_reservation_id → reservation` là khóa ngoại vòng. Nếu cả hai NOT NULL và FK thường thì không INSERT được bản ghi nào trước. Cần ít nhất một FK `DEFERRABLE INITIALLY DEFERRED`, và drizzle-kit không sinh được loại này.
  2. **Khóa ngoại kép chưa được đặc tả.** ADR-007 hứa "khóa ngoại kép để không thể trỏ chéo cơ sở", nhưng ERD không ghi cặp FK `(property_id, room_id) REFERENCES room(property_id, id)`, cũng như UK `(property_id, id)` cần có ở bảng cha.
- Vì sao quan trọng: (1) chặn ngay migration đầu tiên. (2) nếu bỏ qua thì RLS là lớp duy nhất ngăn một đơn của cơ sở A trỏ tới căn của cơ sở B.
- Đề xuất sửa:
  - Giữ `folio.primary_reservation_id` NOT NULL, `reservation.folio_id` NOT NULL `DEFERRABLE INITIALLY DEFERRED`, sinh cả hai id ở ứng dụng (UUIDv7) rồi INSERT trong một giao dịch.
  - ERD mục 1 thêm quy ước: mọi bảng cấp cơ sở có `UNIQUE (property_id, id)`; FK tới bảng cấp cơ sở luôn là cặp `(property_id, x_id)`. Liệt kê các FK áp dụng: room, reservation, folio, registration, room_block.
- Trạng thái: Open

### FB-R1-BE-ARC-10
- Mức độ: Minor
- Vị trí: `erd.md` 4.1 `doc_sequence` và mục 10; mục 2.3 ("policy sinh tự động cho mọi bảng có cột tương ứng")
- Vấn đề:
  1. `doc_sequence` dùng cột `scope_id`, khi là `property_id` khi là `organization_id` (mã khách `KH-`). Bộ sinh policy tự động dựa theo tên cột sẽ bỏ sót bảng này, còn test kiến trúc "bảng thiếu RLS → fail" sẽ không phát hiện vì bảng không có cột `property_id`.
  2. Thuật toán hai câu (`INSERT … DO NOTHING` + `UPDATE … RETURNING`) đúng, nhưng có thể gộp thành một câu và trả số rõ hơn.
- Vì sao quan trọng: bộ đếm mã chứng từ là chỗ mọi luồng tạo bản ghi đều đi qua (US-023). Bảng không được RLS bảo vệ thì cơ sở A có thể đọc hoặc tăng bộ đếm của B.
- Đề xuất sửa:
  - Tách thành 2 cột rõ ràng `property_id uuid NULL`, `organization_id uuid NOT NULL`, PK `(organization_id, coalesce(property_id, '00000000-…'), doc_type, period_key)` hoặc 2 UK một phần. Policy theo `organization_id` + `(property_id IS NULL OR property_id = app_current_property())`.
  - Gộp thuật toán thành một câu:
    ```sql
    INSERT INTO doc_sequence (..., next_value) VALUES (..., 2)
    ON CONFLICT (...) DO UPDATE SET next_value = doc_sequence.next_value + 1
    RETURNING next_value - 1 AS allocated
    ```
- Trạng thái: Open

### FB-R1-BE-ARC-11
- Mức độ: Minor
- Vị trí: `openapi.yaml` info.description (Idempotency, Khóa lạc quan), `components.parameters.IdempotencyKey`; `erd.md` 4.12 `idempotency_key`; các operation `withdrawQuote`, `cancelRequest`, `lookupGuestByContact`, `addFolioLine`; `cancelReservation` / `setLateCheckout` (`dryRun`)
- Vấn đề:
  1. **Thứ tự kiểm** `Idempotency-Key` và `If-Match` chưa ghi. Hàng đợi offline của PWA gửi lại một thao tác đã thành công: nếu kiểm `If-Match` trước thì nhận `412` (vì version đã tăng) thay vì phản hồi cũ, và mục đó bị đẩy nhầm vào "Không áp dụng được".
  2. **Cột khóa của `idempotency_key` mơ hồ**: PK ghi là `user_id_or_guest_session`. Chưa ghi việc ghi/đọc khóa nằm **cùng giao dịch** nghiệp vụ hay giao dịch riêng (ảnh hưởng trực tiếp cách sinh `409 IDEMPOTENCY_IN_PROGRESS`).
  3. **`dryRun: true` vẫn bắt buộc `Idempotency-Key` + `If-Match`.** Gọi thử rồi gọi thật với cùng key sẽ ra `422 IDEMPOTENCY_KEY_REUSED` (body khác), hoặc trả lại kết quả thử.
  4. **Header bắt buộc thiếu sẽ ra mã lỗi khác bảng mã.** `IdempotencyKey` khai `required: true`, nên validator theo spec sẽ trả `422 VALIDATION_FAILED`, không phải `428 PRECONDITION_REQUIRED` như bảng mã lỗi.
  5. **5 POST ghi dữ liệu không có `Idempotency-Key`**: `withdrawQuote`, `cancelRequest` (approval), `logout`, `calculateQuote`, `lookupGuestByContact`. Hai cái đầu đổi trạng thái nên cần có.
  6. **`addFolioLine` không có `If-Match`**, trái coding-standards 7.5 ("action trên folio bắt buộc If-Match"). Cần chốt: dòng folio chỉ thêm (append-only) nên không cần If-Match, còn `checkOut` khóa `folio FOR UPDATE` khi chốt số dư.
- Vì sao quan trọng: idempotency là nền của hàng đợi offline buồng phòng (ADR-005) và của chống ghi tiền 2 lần. Sai thứ tự kiểm sẽ sinh lỗi giả cho người dùng.
- Đề xuất sửa:
  - Ghi vào info.description:
    - Thứ tự: xác thực → `Idempotency-Key` (trả lại phản hồi cũ nếu đã hoàn tất) → `If-Match` → nghiệp vụ.
    - Bản ghi khóa INSERT `state='in_progress'` **trong cùng giao dịch** nghiệp vụ. Request trùng song song chờ UK rồi nhận `409 IDEMPOTENCY_IN_PROGRESS`; nếu rollback thì khóa cũng mất và client gửi lại được.
  - ERD đổi PK thành `(principal_type, principal_id, key)` với `principal_type ∈ {user, guest_session}`.
  - `dryRun=true` không bắt buộc và không tiêu `Idempotency-Key`. Tốt hơn nữa: tách thành `GET …/cancellation-preview`, giống `check-in-preview`.
  - Khai `required: false` ở spec + middleware trả `428`, hoặc sửa bảng mã cho khớp.
  - Bổ sung `Idempotency-Key` cho `withdrawQuote`, `cancelRequest`.
- Trạng thái: Open

### FB-R1-BE-ARC-12
- Mức độ: Minor
- Vị trí: ADR-009 điểm 9 (`409 VERSION_CONFLICT`) và điểm 8, so với `openapi.yaml` (`412 VERSION_CONFLICT`); `openapi.yaml` `/health` so với `services/api/src/health/*`
- Vấn đề:
  1. **Mã HTTP cho cùng một lỗi khác nhau giữa tài liệu.** ADR-009 ghi `409 VERSION_CONFLICT`, OpenAPI và coding-standards ghi `412`.
  2. **`/health` của khung lệch hợp đồng.** Khi DB down, khung trả `503` với `{status:"error", db:"down"}`. OpenAPI chỉ có `200` với `status: enum [ok]`, không có `503`, và body lỗi không phải `problem+json`. Test so khớp spec (coding-standards 7.1) sẽ đỏ ngay khi bật.
- Vì sao quan trọng: FE/MOB sinh kiểu từ spec; hai nguồn nói khác nhau thì client xử lý sai nhánh.
- Đề xuất sửa:
  - Sửa ADR-009 thành 412 cho khớp OpenAPI.
  - Bổ sung `503` cho `/health` vào spec, chọn một trong hai:
    - `status: enum [ok, error]`, giữ body JSON thường (health là ngoại lệ có chủ đích, ghi chú rõ);
    - hoặc OPS đổi khung sang `problem+json`.
- Trạng thái: Open

### FB-R1-BE-ARC-13
- Mức độ: Minor
- Vị trí: `openapi.yaml`, 12 chỗ dùng UUID ví dụ có ký tự ngoài hệ 16: `…-0000000ch002`, `…-0000000ch006`, `…-0000000ch010`, `…-0000000g0003`, `…-0000000g0012`, `…-0000000g0013`, `…-0000000at001`, `…-0000000at010`, `…-0000000it001`, `…-0000000it002` (ví dụ trong `createReservation`)
- Vấn đề: các giá trị này không phải UUID hợp lệ, trong khi schema là `format: uuid`. Validator ví dụ (Redocly `no-invalid-media-type-examples`), mock server dựng từ ví dụ, và test hợp đồng dùng ví dụ làm request đều sẽ fail hoặc trả 422.
- Vì sao quan trọng: CI R2 bật lint OpenAPI sẽ đỏ ngay. FE/MOB dùng mock từ ví dụ cũng sẽ bị 422.
- Đề xuất sửa: đổi sang hệ 16 có tiền tố dễ đọc, ví dụ `…-0000000c0002` cho kênh, `…-00000000a003` cho khách. Thêm `@redocly/cli lint` với rule kiểm ví dụ vào CI (ADR-012 đã liệt kê).
- Trạng thái: Open

### FB-R1-BE-ARC-14
- Mức độ: Minor
- Vị trí: `erd.md` mục 6 K7 (trigger khóa bill "trừ `adjustment` do MGR+ …"); 4.6 `v_folio_balance`
- Vấn đề:
  1. **Trigger K7 cần biết vai người gọi** (MGR+), nhưng biến phiên mục 2.2 chỉ có `app.user_id` và `app.actor_type`. Nếu trigger tự tra `user_property_role` thì vừa chậm vừa lặp lại logic quyền ở 2 tầng.
  2. **View `v_folio_balance`** mặc định chạy với quyền chủ view. Trên dev đang dùng superuser (thẻ 03), view sẽ bỏ qua RLS. Ngay cả với `ottimo_owner`, hành vi phụ thuộc `FORCE`.
- Vì sao quan trọng: bill đã khóa (US-038 AC2) là kiểm soát thất thoát. Số dư sai nghĩa là sai tiền thu khi trả phòng.
- Đề xuất sửa:
  - Trigger K7 chỉ chặn trường hợp **chắc chắn sai**: `folio.status='closed'`, hoặc `status='settled'` mà `category <> 'adjustment'` và đã quá `post_checkout_window_until`. Phần "ai được ghi adjustment" để guard ứng dụng kiểm (A-xx).
  - Nếu ARC muốn trigger kiểm vai thì thêm biến phiên `app.roles`.
  - Tạo view bằng `WITH (security_invoker = true)` (PG ≥ 15).
  - Ghi quy tắc: `checkOut` và `recordPayment` khóa `folio … FOR UPDATE` trước khi tính số dư.
- Trạng thái: Open

### FB-R1-BE-ARC-15
- Mức độ: Minor
- Vị trí: `erd.md` 4.1 `room_list_price.nightly_list_price_vnd` ("tính theo BR-101 rồi lưu"); `coding-standards.md` mục 4.2 và 10.2 (ví dụ số BR là test vàng); `business-rules.md` BR-101, BR-107, BR-005
- Vấn đề:
  1. **Giá gốc không thống nhất.** ERD lưu giá đêm niêm yết **đã làm tròn**. BR-101: căn 401 là 12.500.000 ÷ 12 → 1.042.000. Nhưng ví dụ BR-107 lại nhân giảm giá trên giá **chưa làm tròn** (791.667 × 0,9). Hai cách cho kết quả khác nhau, ví dụ căn 401, 14 đêm, giảm 15%:
     - 1.041.667 × 0,85 = 885.417 → 885.000/đêm;
     - 1.042.000 × 0,85 = 885.700 → 886.000/đêm.
     
     Lệch 14.000 đ mỗi đơn. Test vàng lấy từ BR-107 sẽ không khớp với dữ liệu ERD.
  2. **`roundVnd` "gần nhất" chưa nói hai điểm**: cách xử lý điểm giữa (ví dụ 712.500 → 713.000 ngầm định là làm tròn lên khi đúng nửa), và số âm (hoàn tiền, giảm trừ).
- Vì sao quan trọng: đây là sai tiền có hệ thống, dù nhỏ. Nó cũng làm test vàng (coding-standards 10.2) đỏ mà không rõ ai đúng.
- Đề xuất sửa:
  - ARC + DOM chốt một quy tắc, đề xuất: **mọi phép tính tiếp theo dùng giá đêm niêm yết đã làm tròn đã lưu** (khớp ERD, khớp cái lễ tân nhìn thấy). DOM sửa ví dụ BR-107 cho khớp. Đây là quyết định kỹ thuật–nghiệp vụ nhỏ, đội tự chốt và ghi decision-log có nhãn giả định, không cần ESC.
  - `money.ts` ghi rõ: làm tròn nửa lên theo **trị tuyệt đối** (−712.500 → −713.000), có test cho số âm.
- Trạng thái: Open

### FB-R1-BE-ARC-16
- Mức độ: Major
- Vị trí: `rounds/round-01/outputs/ARC/report.md` mục 5 ("BE khoảng 9–11 tuần-người"); `architecture.md` mục 19 T1
- Vấn đề: BE ước lại theo từng module dựa trên ERD, OpenAPI và job đã đặc tả, ra **20–25 tuần-người** cho 1 BE (bảng cuối file), tức khoảng 2–2,3 lần ước của ARC. Các phần ARC có vẻ chưa tính đủ:
  - (a) Phần nền (Drizzle + ~60 bảng, RLS + vai DB + hàm bootstrap, middleware idempotency / If-Match / x-roles / x-visible-to / problem+json, test kiến trúc, `MutableClock` + endpoint test) đã khoảng **3–3,5 tuần** trước khi có story đầu tiên.
  - (b) Bộ máy giá + báo giá ngắn và dài hạn + sinh HĐ / lịch kỳ thu + snapshot tham số là phần nhiều quy tắc nhất: khoảng 30 BR có ví dụ số phải thành test.
  - (c) Mã hóa phong bì C3 + `c3_access_log` + xóa theo hạn.
  - (d) 18 job R2 phải viết theo mẫu đúng một lần (thẻ 05).
  - (e) Thời gian hỗ trợ FE/MOB/QA và sửa lỗi trong round.
- Vì sao quan trọng: kế hoạch R2 dựa trên 9–11 tuần sẽ trễ, hoặc buộc cắt test đồng thời / RLS. Đó đúng là phần không được cắt (S1 "0 đặt trùng", SEC).
- Đề xuất sửa:
  - ARC cập nhật mục 19 T1 bằng bảng ước theo module (lấy bảng dưới làm đầu vào) và ghi giả định rõ ràng.
  - PO/ORC chọn một trong ba phương án cho plan R2:
    - (i) 2 BE (khoảng 10–13 tuần lịch);
    - (ii) giữ 1 BE và dời sang R3 các phần ít rủi ro: báo giá/HĐ dài hạn (US-081, phần H1 của US-086), app khách mức 2 + mã cửa (US-111, US-128), J12–J14, `messaging` render (US-125), giảm khoảng 3–4 tuần;
    - (iii) kéo dài R2.
  - Vì đụng tới mốc phát hành / nhân lực, BE đề nghị ORC xem có cần ESC không (BE không tự tạo ESC ở bước này theo chỉ đạo của ORC).
- Trạng thái: Open

### FB-R1-BE-ARC-17
- Mức độ: Suggestion
- Vị trí: `coding-standards.md` mục 1.1 ("client … có thể tính xem trước bằng cùng hàm trong `packages/contracts`") so với ADR-001 điểm 4 ("không có công thức giá chạy ở client")
- Vấn đề: hai tài liệu mâu thuẫn. Nếu hàm giá nằm trong `packages/contracts` để client dùng, thì gói này phải nạp được tham số (`config_parameter`) ở client. Như vậy client cần quyền đọc tham số, mà rbac đang chặn SAL/CTV xem phần lớn tham số.
- Vì sao quan trọng: nếu để mở, FE có thể tự tính giá và lệch với server, lặp lại đúng lỗi BL 8.2 #10–#13.
- Đề xuất sửa: giữ ADR-001: client luôn gọi `POST …/quotes/calculate` hoặc các endpoint `*-preview`. `packages/contracts` chỉ chứa `money.ts` (làm tròn, định dạng) và bảng chuyển trạng thái, không chứa công thức giá.
- Trạng thái: Open

### FB-R1-BE-ARC-18
- Mức độ: Suggestion
- Vị trí: `erd.md` mục 12 T15 ("partition theo tháng – R3") cho `audit_event`, `c3_access_log`, `state_transition`
- Vấn đề: đổi một bảng thường sang bảng phân vùng ở R3 nghĩa là phải tạo bảng mới, chép dữ liệu và đổi tên. Với bảng append-only đã `REVOKE` và có FK trỏ vào thì rủi ro hơn nhiều so với tạo phân vùng ngay từ đầu.
- Vì sao quan trọng: tránh phải làm một migration nặng trên dữ liệu thật ở R3/R4.
- Đề xuất sửa: tạo 3 bảng này dạng `PARTITION BY RANGE (occurred_at)` ngay migration R2, kèm phân vùng mặc định + job tạo phân vùng tháng tới (gắn vào J16). PK đổi thành `(id, occurred_at)`. Chi phí thêm khoảng 0,5 ngày.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)

1. **Chống đặt trùng làm đúng chỗ.** Dùng một bảng `room_occupancy` + `EXCLUDE USING gist` + `daterange '[)'`. Đơn OTA xung đột được tạo với `room_id NULL` và **không** chèn vào bảng chiếm phòng, nên ràng buộc vẫn tuyệt đối mà không mất đơn. Đây là thiết kế đúng nhất có thể với PostgreSQL và test được bằng test đồng thời thật.
2. **Hợp đồng API đủ chi tiết để code.** Có `x-roles`, `x-scope`, `x-visible-to`, `x-transition`, `x-stories` cho từng operation; bảng mã lỗi ổn định; hành động `…/actions/<verb>` khớp mã chuyển của BA. 74/74 story Must R2 có endpoint, nên sinh được test phân quyền tự động.
3. **Tham số có hiệu lực theo ngày + snapshot vào bản ghi (BR-006), mã chứng từ cấp trong giao dịch bằng khóa hàng.** Hai thiết kế này giải quyết tận gốc hai nhóm lỗi tiền lớn của prototype (BL 8.2 #18, #10–#13) và không phụ thuộc client.

---

## Ước lượng R2 của BE theo module

Giả định:
- 1 BE toàn thời gian, có AI hỗ trợ, 5 ngày/tuần.
- Đã gồm unit + integration test với PostgreSQL thật và test đồng thời theo coding-standards mục 10.
- Chưa gồm: adapter thật của INT (R2 dùng Mock), staging/CI của OPS, FE/MOB.
- Giả định thẻ 01–07 được ARC chốt trong tuần đầu R2. Nếu không, cộng thêm 1–1,5 tuần cho việc làm lại.

| # | Module / phần việc | Story Must R2 chính | Ước (tuần-người) | Ghi chú rủi ro |
|---|---|---|---|---|
| 1 | Nền tảng kỹ thuật: Drizzle + migration ~60 bảng, vai DB, RLS + hàm bootstrap, giao dịch có ngữ cảnh, problem+json, middleware Idempotency / If-Match, guard `x-roles` + serializer `x-visible-to` sinh từ spec, test kiến trúc, `audit_event` / `state_transition`, `DocNumberService`, `ParameterService` + seed tham số, seed dữ liệu giả, `MutableClock` + endpoint test | US-003, US-023 (nền) | 3,0 – 3,5 | Thẻ 01, 02, 03, 04, 07, 09 |
| 2 | `identity`: đăng nhập argon2id, phiên cookie + CSRF, khóa tạm, người dùng / vai theo cơ sở, `Me.screens` | US-001, US-002, US-087 (phạm vi M) | 1,0 | |
| 3 | `platform`: căn, nhóm, giá niêm yết theo hiệu lực, kênh, tham số + lịch sử | US-004, US-005 | 0,5 – 0,75 | |
| 4 | `reservations`: `OccupancyService`, `stay_night`, availability, rack, tạo đơn / OTA xung đột, move / đổi phòng / gia hạn / trả sớm / trả muộn, hủy theo chính sách, no-show + khôi phục, nhắc trả phòng; bộ máy giá + báo giá ngắn và dài hạn, lead, giữ chỗ từ báo giá, xác nhận cọc → HĐ + lịch kỳ thu | US-016…031, US-136, US-137, US-080…087, US-139 | 4,0 – 5,0 | Nhiều BR có ví dụ số nhất; thẻ 08, 15 |
| 5 | `frontdesk` + `folio`: nhận phòng (điều kiện BR-402, phụ thu sớm), trả phòng 3 bước, dòng folio / điều chỉnh, FOC + duyệt (SM-10, hạn mức), thanh toán / đảo, chuỗi VietQR, bill + số bill, minibar, thông tin HĐ GTGT | US-025…027, US-032…039, US-007, US-119, US-120, US-135 | 2,0 – 2,5 | Thẻ 14; test đồng thời duyệt FOC |
| 6 | `registration` + C3: `CryptoService` mã hóa phong bì, `BlobStore` local, giấy tờ / ảnh / đồng ý, `c3_access_log`, đối chiếu, hạn khai báo, chuyển trạng thái SM-05, dữ liệu sao chép cổng, xóa ảnh (J16 phần R2) | US-042…050, US-003 (C3) | 1,75 – 2,25 | Phụ thuộc SEC Phần 2 |
| 7 | `housekeeping` + `maintenance` + `inventory`: SM-03, việc buồng phòng + nhận thao tác offline (idempotent), checklist kiểm phòng, tệp đính kèm, phiếu sửa, khối OOO (`ooo` trong occupancy), mặt hàng | US-052…057, US-061, US-062, US-066 | 1,5 – 2,0 | |
| 8 | `guests`: hồ sơ, chống trùng SĐT/email, tìm có/không dấu (trigram), lookup | US-071…073 | 0,5 – 0,75 | |
| 9 | `guest-portal` + yêu cầu khách + `messaging` + `doorlock`: phiên khách mức 1/2, check-in online, folio khách, định tuyến yêu cầu, render mẫu tin VI/EN/RU, mã cửa nhập tay | US-106…112, US-110, US-125, US-128 | 1,5 – 2,0 | Rate limit xác minh |
| 10 | `reporting` (R2) + SSE + thông báo: KPI đêm nay, khách đến/đi, "Cần chú ý", luồng SSE + LISTEN, thông báo nhân viên | US-010…012 | 1,0 – 1,25 | Thẻ 06 |
| 11 | `worker`: mẫu handler đúng một lần + J1–J18 (phần R2) + `outbox.dispatch` với Mock | (xuyên suốt) | 1,5 – 2,0 | Thẻ 04, 05 |
| 12 | Ổn định cuối round: test đồng thời / RLS 2 cơ sở, `EXPLAIN` + p95 rack, hỗ trợ FE/MOB/QA, sửa lỗi P0/P1 | – | 1,5 – 2,0 | |
| | **Tổng** | 74 story Must R2 | **≈ 20 – 25** (≈ 16–21 nếu áp dụng phương án cắt (ii) ở thẻ 16) | So với ARC: 9–11 |

Kết luận ước lượng:
- Với **1 BE**, R2 cần khoảng **5–6 tháng lịch**.
- Với **2 BE** chia theo cụm, R2 còn khoảng **10–13 tuần lịch** (ước của ARC chỉ đạt được với cách này):
  - BE-A: module 1, 2, 3, 4, 11;
  - BE-B: module 5, 6, 7, 8, 9, 10, 12.
- Hoặc **cắt khoảng 3–4 tuần phạm vi** theo phương án (ii) ở thẻ 16.
- Phần **không được cắt**: module 1, tồn phòng / chống trùng của module 4, folio / thanh toán của module 5, C3 của module 6.
