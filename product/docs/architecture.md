# Kiến trúc hệ thống – OTTIMO Desk (Pha A)

- Người viết: ARC | Round 1 – Bước 2 – Đợt 2 (Pha A) | Ngày: 15/10/2026 | Phiên bản: 0.1
- Trạng thái: **Bản nháp Pha A + bổ sung Pha B** (job theo lịch mục 9.1, mã chứng từ mục 9a, đơn OTA xung đột mục 8) – chờ review bắt buộc BE, SEC; khuyến nghị OPS, INT, MOB, DATA (plan R1 mục 5)
- Đầu vào: `00-brief/investor-brief.md`, `01-decisions/decision-log.md`, `rounds/round-01/plan.md`, `product/docs/PRD.md`, `03-backlog/backlog.md`, `product/docs/business-rules.md` (BR, mục 13 tham số), `product/docs/integrations.md`, `product/docs/integrations/channel-manager-comparison.md`, `product/integrations/README.md`, `product/docs/security/data-risk-assessment.md`, `02-escalations/ESC-002.md`, `product/docs/round-0-baseline.md` (gọi tắt **BL**)
- Quyết định chi tiết: `product/docs/adr/` (ADR-001 … ADR-013)
- **Pha B (Đợt 3) đã làm**: `erd.md`, `api/openapi.yaml`, `coding-standards.md`, danh sách job đầy đủ (mục 9.1), sinh mã chứng từ (mục 9a + erd mục 10). Mục 18 giữ lại để truy vết đầu vào.

---

## 1. Tóm tắt quyết định

| # | Chủ đề | Quyết định | ADR |
|---|---|---|---|
| 1 | Dạng kiến trúc | Modular monolith (1 API + 1 worker cùng codebase), contract-first OpenAPI | 001 |
| 2 | Backend | Node.js 22 LTS, TypeScript strict, NestJS (Fastify), Drizzle ORM + SQL tay, zod | 002 |
| 3 | Dữ liệu | PostgreSQL 17 là kho duy nhất; hàng đợi/lịch **pg-boss**; **chưa dùng Redis**; real-time SSE + LISTEN/NOTIFY | 003 |
| 4 | Web quản trị, web khách | React + Vite SPA, build tĩnh, Caddy phục vụ; booking-web (R3) chọn công nghệ sau | 004 |
| 5 | App nhân viên | **PWA** (không native ở MVP), đọc offline + hàng đợi ghi offline cho thao tác buồng phòng | 005 |
| 6 | App khách | Web mở bằng link/QR **gắn theo đơn**, token băm, hết hạn sau trả phòng, 2 mức xác minh | 006 |
| 7 | Đa cơ sở | 1 DB, `organization_id` + `property_id` mọi bảng, Row Level Security; MVP 1 cơ sở | 007 |
| 8 | Thời gian | UTC cho thời điểm; `date` cho ngày lưu trú theo `property.timezone` (Asia/Ho_Chi_Minh); `Clock` tiêm được | 008 |
| 9 | Chống đặt trùng | Exclusion constraint PostgreSQL trên `(room_id, daterange)` + idempotency key + khóa lạc quan | 009 |
| 10 | Hosting | 1 VPS tại Việt Nam, Docker Compose, Caddy; ước **0,45–0,9 tr/tháng** | 010 |
| 11 | Tích hợp | Chấp nhận adapter INT + outbox/inbox, bổ sung 10 điểm (B1–B10) | 011 |
| 12 | Repo & công cụ | pnpm + Turborepo, ESLint 9, Prettier, Vitest, Playwright, k6, gitleaks | 012 |
| 13 | Ảnh giấy tờ | Mã hóa phong bì, xóa bằng hủy khóa, log mỗi lần xem | 013 |

Lệch so với mặc định gợi ý của skill ARC (Flutter, Next.js, Redis) – có lý do trong ADR-003, 004, 005: quy mô 10 căn + ngân sách ≤ 1 tr/tháng + đội nhỏ → ít thành phần nhất, một ngôn ngữ (TypeScript) cho mọi phần.

## 2. Ràng buộc và yêu cầu phi chức năng đầu vào

| Nguồn | Ràng buộc | Kiến trúc đáp ứng |
|---|---|---|
| Brief 7 #5, PRD N10 | Hạ tầng ≤ 1 tr/tháng [GIẢ ĐỊNH] | ADR-010: 1 VPS, không dịch vụ managed |
| Brief 7 #7 | Đa cơ sở thiết kế sẵn, MVP 1 | ADR-007 |
| PRD N2, N4; BL 9 #22 | Buồng phòng Android tầm trung, mạng chập chờn | ADR-005 (PWA + offline có giới hạn) |
| PRD N5; BR-001 | Mọi hạn theo giờ Việt Nam | ADR-008 |
| PRD S1; BL 8.2 #30; BR-906 | 0 đặt trùng | ADR-009 |
| PRD N6; SEC | ND 13/2023, Luật 91/2025; C3 mã hóa, log xem, tự xóa | ADR-013, mục 10 |
| PRD N7; SEC | Không chạm số thẻ | Chỉ trang thanh toán của cổng (ADR-011) |
| PRD N8; BR-008 | Truy vết mọi thao tác tiền | Bảng `audit_event` append-only (Pha B) |
| PRD N11 | Mất dữ liệu ≤ 24 giờ | Backup hằng ngày + WAL (mục tiêu ≤ 15 phút) – ADR-010 |
| ESC-002 | Dữ liệu khách nên ở VN | ADR-010 chọn VPS VN, không proxy nước ngoài |
| PRD 2 nguyên tắc 6; decision-log | Mọi con số quy tắc cấu hình được | Bảng tham số theo cơ sở, có ngày hiệu lực + snapshot vào đơn (ADR-007 mục 7, BR-006) |

## 3. C4 – Mức Context

```mermaid
flowchart TB
  subgraph Users["Người dùng"]
    INV["Chủ đầu tư / Quản lý<br/>(laptop + điện thoại)"]
    FO["Lễ tân<br/>(máy tính quầy)"]
    HK["Buồng phòng / Bảo trì<br/>(Android tầm trung)"]
    SALE["CTV / Sale<br/>(điện thoại)"]
    GUEST["Khách lưu trú<br/>(điện thoại, không cài app)"]
  end

  DESK["OTTIMO Desk<br/>(hệ thống đang xây)"]

  subgraph Ext["Hệ thống bên ngoài"]
    CM["Channel manager<br/>(đề xuất Beds24)"]
    OTA["6 OTA: Airbnb, Booking, Agoda,<br/>Expedia, Trip.com, Traveloka"]
    PAY["Cổng thanh toán<br/>VNPay / MoMo (R3)"]
    BANK["Ngân hàng: VietQR +<br/>báo tiền về SePay/payOS (R3)"]
    MISA["MISA meInvoice (R3)"]
    MAIL["Dịch vụ email giao dịch"]
    ZALO["Zalo OA / ZNS (R3/sau)"]
    LOCK["Cloud khóa cửa<br/>(sau MVP – hãng chưa rõ)"]
    BCA["Cổng khai báo lưu trú BCA / ASM<br/>(không có API – thao tác tay)"]
  end

  INV & FO & HK & SALE --> DESK
  GUEST -->|link/QR theo đơn| DESK
  DESK <-->|API + webhook| CM
  CM <--> OTA
  DESK <-->|redirect + IPN| PAY
  BANK -->|webhook biến động số dư| DESK
  DESK -->|phát hành HĐĐT| MISA
  DESK --> MAIL & ZALO
  DESK -.->|tạo/xóa mã| LOCK
  FO -.->|sao chép dữ liệu, nhập mã hồ sơ| BCA
```

## 4. C4 – Mức Container

```mermaid
flowchart LR
  subgraph Clients["Client (trình duyệt)"]
    ADMIN["admin-web<br/>React+Vite SPA<br/>Lễ tân, quản lý, chủ đầu tư"]
    STAFF["mobile (OTTIMO Staff)<br/>React+Vite PWA<br/>Buồng phòng, bảo trì, sale/CTV<br/>IndexedDB + Service Worker"]
    GWEB["guest-web<br/>React+Vite, mobile-first<br/>VI/EN (+RU R3)"]
    BWEB["booking-web (R3, Should)<br/>trang tĩnh SEO"]
  end

  subgraph VPS["VPS tại Việt Nam – Docker Compose"]
    CADDY["Caddy<br/>TLS tự động, tệp tĩnh,<br/>reverse proxy, che /g/* trong log"]
    API["api – NestJS (Fastify)<br/>REST /v1, SSE, webhook vào"]
    WORKER["worker – cùng codebase<br/>pg-boss: job lịch, outbox, inbox,<br/>đối soát kênh, xóa theo hạn"]
    PG[("PostgreSQL 17<br/>dữ liệu + hàng đợi + phiên<br/>RLS theo cơ sở")]
    FILES[("Volume tệp mã hóa<br/>ảnh giấy tờ, ảnh sự cố")]
  end

  BACKUP[("Đích sao lưu off-site<br/>tại VN, đã mã hóa")]
  EXT["Adapter tích hợp<br/>(@ottimo/integrations)<br/>→ CM, cổng TT, MISA, email…"]

  ADMIN & STAFF & GWEB & BWEB -->|HTTPS| CADDY
  CADDY --> API
  API <--> PG
  WORKER <--> PG
  API -. LISTEN/NOTIFY .- WORKER
  API --> FILES
  WORKER --> FILES
  WORKER --> EXT
  EXT -->|webhook/IPN| CADDY
  PG -->|pg_dump + WAL| BACKUP
  FILES --> BACKUP
```

## 5. Thành phần

### 5.1 `services/api` – module theo phân hệ PRD
| Module (code) | Phân hệ PRD | Trách nhiệm chính |
|---|---|---|
| `platform` | M0 | Tổ chức, cơ sở, căn, nhóm căn, tham số cấu hình (có hiệu lực theo ngày), bộ đếm mã chứng từ, `Clock` |
| `identity` | M0 | Đăng nhập nhân viên, phiên, vai × cơ sở, kiểm quyền theo màn hình/hành động/trường (theo `rbac-matrix.md` của BA), phê duyệt (FOC) |
| `audit` | M0 | Nhật ký thao tác tiền + thao tác nhạy cảm (append-only), `c3_access_log` |
| `reservations` | M2, M8 | Đơn, phân đoạn, giữ chỗ, gia hạn, đổi phòng, `room_occupancy` (ADR-009), báo giá, hợp đồng dài hạn, lịch thu |
| `frontdesk` | M2 | Nhận/trả phòng 3 bước, phụ thu sớm/muộn, nhắc trả phòng |
| `folio` | M2, M12 | Folio, bút toán (không xóa, chỉ điều chỉnh), thanh toán, hoàn tiền, bill, hóa đơn điện tử (gọi adapter) |
| `registration` | M3 | Giấy tờ (C3, ADR-013), đối chiếu, đồng ý, khai báo bán tự động, hạn khai báo |
| `housekeeping` | M4 | Trạng thái buồng (BR-802), việc hôm nay, checklist, lịch dọn dài hạn |
| `maintenance` | M5 | Phiếu sửa chữa, OOO (ghi `room_occupancy` loại `ooo`), công tơ điện nước |
| `inventory` | M6 | Minibar, mặt hàng, (R3: xuất nhập tồn) |
| `guests` | M7 | Hồ sơ khách cấp tổ chức, chống trùng (BR-95x), người đi cùng, đồng ý theo mục đích |
| `channels` | M9 | Ánh xạ kênh (`channel_mapping`), đơn OTA vào, đẩy tồn/giá, đối soát |
| `reporting` | M1, M10 | KPI tính từ dữ liệu (theo `metrics-definitions.md` của DATA), "Cần chú ý" (BR-907) |
| `guest-portal` | M11 | Phiên khách theo token đơn, yêu cầu khách (định tuyến BL 5.19), check-in online |
| `messaging` | M13 | Mẫu tin đa ngôn ngữ, gửi qua `NotificationAdapter` |
| `doorlock` | M14 | Mã cửa (MVP nhập tay; sinh mã ở lõi), thẻ phòng |
| `integrations-hub` | – | Outbox/inbox, webhook endpoint, `integration_log`, `IntegrationRegistry` |

Quy tắc module: module khác chỉ gọi qua `modules/<x>/public` (service + DTO); thư mục `internal` bị lint chặn import chéo.

### 5.2 `worker`
Cùng image với `api`, entrypoint khác (`node dist/worker.js`). Chạy: job theo lịch (mục 9), dispatcher outbox, xử lý inbox, đối soát kênh hằng đêm, xóa dữ liệu theo hạn, tạo việc buồng phòng định kỳ.

### 5.3 Client
| App | Thư mục | Người dùng | Ghi chú |
|---|---|---|---|
| Web quản trị | `apps/admin-web` | Lễ tân, quản lý, chủ đầu tư (laptop; responsive cho chủ đầu tư dùng điện thoại xem Tổng quan) | Room rack, đơn, folio, khai báo, cấu hình, báo cáo |
| App nhân viên | `apps/mobile` | Buồng phòng, bảo trì, sale/CTV, (chủ đầu tư khi cần duyệt nhanh) | PWA, offline mục 11 |
| App khách | `apps/guest-web` | Khách | ADR-006 |
| Đặt phòng trực tiếp | `apps/booking-web` | Khách mới (R3, Should) | Chỉ giữ thư mục + README ở R1–R2 |

## 6. Đa cơ sở (ADR-007)
- `organization` → nhiều `property`. Người dùng thuộc tổ chức; quyền theo `(user, property, role)`.
- Mọi bảng nghiệp vụ: `organization_id`, `property_id` (nếu cấp cơ sở), RLS bật. Hồ sơ khách ở cấp tổ chức (khách quen dùng chung chuỗi), nhưng **dữ liệu C3 gắn với lượt lưu trú tại cơ sở**, không chia sẻ chéo cơ sở.
- API: `/v1/properties/{propertyId}/…`. Mã chứng từ, tham số, múi giờ theo cơ sở.
- MVP: seed 1 tổ chức "OTTIMO", 1 cơ sở "OTTIMO Boutique Stay – Đà Lạt", 10 căn / 3 nhóm (BL 4.1).
- Kiểm chứng: bộ test có 2 cơ sở; người dùng cơ sở A gọi API cơ sở B → 404 (không lộ tồn tại).

## 7. Thời gian và múi giờ (ADR-008)
- `timestamptz` (UTC) cho thời điểm; `date` cho ngày lưu trú/kỳ thu; `time` cho giờ cấu hình (14:00, 12:00, 23:00).
- Khoảng lưu trú `[arrival, departure)` (BR-002). Đêm gắn ngày bắt đầu ngủ; nhận phòng trước 06:00 tính đêm trước (BR-003) – logic ở module `frontdesk`, dùng `Clock.atLocal`.
- Server/DB chạy `TZ=UTC`; API trả thời điểm có offset `+07:00`; client hiển thị theo `property.timezone`.
- `Clock` là nguồn thời gian duy nhất; dev/staging cho đặt giờ giả để QA test mốc 23:00, 12 giờ khai báo NN, hết hạn giữ chỗ.

## 8. Tồn phòng và chống đặt trùng (ADR-009)

```mermaid
sequenceDiagram
  participant A as Lễ tân A
  participant B as Lễ tân B / webhook OTA
  participant API
  participant DB as PostgreSQL
  A->>API: POST /reservations (Idempotency-Key k1) căn 203, 20–21/10
  B->>API: POST /reservations (Idempotency-Key k2) căn 203, 20–22/10
  API->>DB: BEGIN; INSERT reservation; INSERT room_occupancy(203,[20,21))
  API->>DB: BEGIN; INSERT reservation; INSERT room_occupancy(203,[20,22))
  DB-->>API: A: COMMIT OK
  DB-->>API: B: lỗi 23P01 (exclusion violation) → ROLLBACK
  API-->>A: 201 Created OTM-00172
  API-->>B: 409 ROOM_UNAVAILABLE {room:203, nights:[2026-10-20]}
  Note over API,DB: Webhook OTA bị 409 → không từ chối im lặng:<br/>thử căn khác cùng nhóm → hết thì đơn cờ "xung đột" + Cần chú ý (BR-312)
```

**Chốt ở Pha B (khớp BA `state-machines.md` 1.3)**: đơn OTA không còn căn vẫn tạo `confirmed` với `conflict_state='open'`, segment **chưa gán căn** (`room_id NULL`), không chèn `room_occupancy` → ràng buộc chống trùng giữ tuyệt đối; hiện ở làn "Chưa gán căn" trên rack + `overbooking_incident`; xử lý bằng B7/B14. Chi tiết `erd.md` mục 7. Thay thế điểm 5 để ngỏ của ADR-009.

Điểm chính:
1. Bảng `room_occupancy` (căn × `daterange` × loại `reservation|hold|ooo` × `active`) + `EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (active)`.
2. Mọi luồng (đặt, giữ chỗ, gia hạn, đổi phòng, hợp đồng, OOO, đơn OTA) ghi qua **một service** `OccupancyService` trong giao dịch của luồng đó.
3. Hold hết hạn/hủy/no-show → `active=false` cùng giao dịch → outbox đẩy mở phòng lên kênh.
4. Phòng trống cho kênh và rack tính trực tiếp từ bảng này (không bảng đếm riêng).
5. Xung đột mức giờ (trả muộn vs khách đến cùng ngày) kiểm ở ứng dụng với `SELECT … FOR UPDATE` trên dòng căn.
6. `Idempotency-Key` cho POST quan trọng; `If-Match`/`version` cho sửa đơn.
7. Test bắt buộc (QA + BE): 2 request song song cùng căn/đêm → đúng 1 thành công; OOO chặn bán (BL 8.2 #5); hold hết hạn mở lại phòng.

## 9. Bất đồng bộ: outbox/inbox và job theo lịch
- Outbox ghi cùng giao dịch nghiệp vụ; worker gửi qua adapter; retry 5 lần lùi cấp số nhân → "Cần chú ý".
- Inbox: khóa duy nhất theo `(provider, external_event_id)`; xử lý idempotent.
- Job theo lịch: **danh sách đầy đủ chốt ở Pha B – mục 9.1**. Mã chứng từ: **mục 9a**.

### 9.1 Danh sách job theo lịch (Pha B)

Nguyên tắc chung cho mọi job:
1. Chạy trong `worker` bằng pg-boss; mỗi job lặp theo từng cơ sở, đặt context RLS của cơ sở đó (erd mục 2) và đọc giờ qua `Clock` (dev/staging dùng `CLOCK_OVERRIDE` để QA thử mốc 23:00, 12:00, 18:00…).
2. **Mốc giờ đọc từ tham số tại thời điểm chạy** (erd mục 9), không viết cứng – đổi tham số không cần deploy (rủi ro T8).
3. **Đúng một lần**: job theo mốc giờ ghi `job_run(job_key, property_id, business_date, slot)` có UK; job theo thời điểm lưu trên bản ghi (hạn giữ chỗ, hạn khai báo) dùng `SELECT … FOR UPDATE SKIP LOCKED` và kiểm lại điều kiện trong giao dịch.
4. **Bắt kịp sau khi worker dừng**: job theo thời điểm luôn chạy bù; job nhắc theo mốc chỉ chạy bù nếu trễ ≤ `job_catchup_minutes` (mặc định 60), quá thì ghi `skipped` vào `job_run.stats` (không gửi nhắc "20:00 hôm trước" vào sáng hôm sau).
5. Không job nào **tự đánh dấu no-show** hay tự đổi tiền – chỉ tạo nhắc/"Cần chú ý" (BR-311). Mọi chuyển trạng thái do SYS ghi `state_transition` với `actor_type='system'`.
6. Kết quả hiển thị cho người dùng qua bảng nghiệp vụ + SSE `attention.changed`; lỗi job → log + cảnh báo OPS (R2 cấu hình giám sát).

| # | Job (`job_key`) | Kích hoạt (giờ cơ sở) | Việc làm | Tham số | BR / US | R |
|---|---|---|---|---|---|---|
| J1 | `hold.expire` | Job hẹn giờ tại `hold_expires_at` (pg-boss `startAfter`, `singletonKey` = id đơn) **+** quét dự phòng mỗi 1 phút | B6: đơn `hold` quá hạn mà **không** có giao dịch cọc `succeeded` nhận trước hạn → `cancelled` (lý do `hold_expired`), `room_occupancy.active=false`, `stay_night` void, khai báo `void`, lead → `quoted`, outbox mở phòng, báo người tạo. Tiền về sau khi đã hủy → cảnh báo "Tiền về cho đơn đã hủy" (không tự khôi phục) | `hold_hours_*` (đã chép vào đơn) | BR-302/303; US-085 AC1, AC4; DATA S7 (≤ 5 phút – thiết kế đạt ≤ 1–2 phút) | R2 |
| J2 | `hold.remind` | Hẹn giờ tại `hold_expires_at − hold_expiry_reminder_hours` | Nhắc người tạo + mục "Cần chú ý" `hold_expiring` | `hold_expiry_reminder_hours` | BR-303; US-085 AC2 | R2 |
| J3 | `quote.expire` | Hằng ngày 00:05 | Q3: báo giá `active` có `expires_at` đã qua → `expired` | `quote_validity_days` (đã chép) | BR-304 | R2 |
| J4 | `checkout.reminders` | Tick mỗi 1 phút, so với từng mốc của `checkout_reminders` | Mốc "tối hôm trước": tạo nhắc (mẫu tin `checkout_reminder` để sao chép – R2; gửi Zalo/email – R3); mốc sáng: nhắc lần 2; mốc "cần gọi": đơn chưa phản hồi → `call_needed` + báo lễ tân; mốc giờ trả: `overdue` → báo đỏ FD + MGR, đẩy căn có khách đến hôm nay lên đầu. Ghi `checkout_reminder_log`. Dài hạn: nhắc trước 7 và 1 ngày | `checkout_reminders`, `checkout_time` | BR-425; US-030, US-031 | R2 |
| J5 | `registration.deadline` | Tick mỗi 5 phút **+** mốc `registration_reminder_times` | Hồ sơ trạng thái < `sent` và `deadline_at` đã qua → `registration_overdue` (đỏ); còn ≤ `registration_reminder_before_minutes` → nhắc; tại mốc nhắc ca tối/sáng (BR-611) gửi tổng hợp cho người trực FD + MGR. `deadline_at` tính khi nhận phòng (B9) theo công thức dưới; đổi tham số → tính lại hạn các hồ sơ chưa khai (US-042 AC3) | `registration_deadline_vn`, `registration_deadline_foreigner_hours`, `registration_deadline_foreigner_mode`, `registration_reminder_*` | BR-602, 603, 611; US-042; S8 | R2 |
| J6 | `no_show.call` | Mốc `no_show_call_time` | Đơn `confirmed` đến hôm nay chưa nhận phòng, không có giờ đến dự kiến sau mốc → "Cần chú ý" `no_show_call` cho FD | `no_show_call_time` | BR-311; US-136 AC1 | R2 |
| J7 | `no_show.mark_prompt` | Mốc `no_show_mark_time` | Đơn trên vẫn chưa đến → `no_show_mark` (mở khóa nút No-show khi đã ghi kết quả liên lạc). **Không tự đánh dấu** | `no_show_mark_time` | BR-311; US-136 AC2, AC3 | R2 |
| J8 | `hk.daily` | Mốc `daily_clean_status_time` | (a) R8: căn có khách **ngắn ngày** `OC` → `OD` + việc "Dọn phòng khách đang ở" (trừ khách từ chối); (b) việc dọn dài hạn theo `cleaning_schedule` trong ngày (US-056); (c) xếp ưu tiên BR-807; (d) R5: `VI` quá `vacant_reinspect_days` → `VC`; (e) đối chiếu buồng – đơn (BR-806) → cảnh báo, không tự sửa | `daily_clean_status_time`, `linen_change_every_nights`, `vacant_reinspect_days` | BR-802, 805, 806, 807; US-054, US-056 | R2 |
| J9 | `ooo.activate` | Hằng ngày 00:01 | O2: khối `planned` có `start_date` = hôm nay → `active`, buồng → `OOO` (R10), hủy việc dọn mở của căn | – | BR-804; SM-02 | R2 |
| J10 | `guest_request.sla` | Mỗi 1 phút | Yêu cầu `new` quá `ack_due_at` → nhắc bộ phận được định tuyến; trả lời tự động ngoài giờ trực xảy ra **lúc tạo** (không chờ job) | `guest_request_response_minutes`, `front_desk_hours` | BR-811; US-110 AC2 | R2 |
| J11 | `work_order.sla` | Mỗi 5 phút | Phiếu quá hạn nhận/xử lý theo mức → "Cần chú ý"; mức Cao quá hạn phương án → gợi ý đổi phòng + FOC bù sự cố | `wo_sla` | BR-809 | R2 |
| J12 | `billing.status` | Hằng ngày 08:00 | T1: kỳ thu `scheduled → due_soon → due → overdue → escalated` theo số ngày; "Cần chú ý" kỳ thu trong 7 ngày; không khóa cửa | `rent_reminder_days`, `rent_overdue_alert_days`, `rent_overdue_escalate_days`, `utility_bill_due_days` | BR-207, 504; US-012 AC2 | R2 (trạng thái + nhắc); thu R3 |
| J13 | `lease.renewal_offer` | Hằng ngày 08:00 | HĐ hết hạn trong `lease_renewal_offer_days` → "Cần chú ý" chào gia hạn | `lease_renewal_offer_days` | BR-211, 907 | R2 |
| J14 | `visa.warning` | Hằng ngày 06:00 | Giấy tờ có `visa_alert_on ≤ hôm nay` của đơn `confirmed`/`in_house` → `visa_expiring` | `visa_expiry_warning_days` | BR-605; US-044 AC3, US-012 AC3 | R2 |
| J15 | `folio.close` | Mỗi giờ | Folio `settled` quá `post_checkout_window_until` và còn phải thu = 0 (hoặc công nợ đã ghi) → `closed` | `post_checkout_charge_window_hours` | BR-427; SM-13 | R2 |
| J16 | `retention.purge` | Hằng ngày 03:00 | Xóa/ẩn danh theo T01–T18 (erd mục 12), hủy DEK, bỏ qua `legal_hold`, ghi `retention_run`; dọn `user_session`, `guest_session`, `guest_access_token`, `idempotency_key` hết hạn | `retention.*`, `id_image_retention_days_after_checkout`, `idempotency_ttl_hours` | BR-609, 610; SEC mục 7; US-049 AC1 | R2 (ảnh T01/T02, mã cửa T11, phiên); R3 (phần còn lại) |
| J17 | `data.integrity` | Hằng ngày 04:00 | Kiểm DATA R-04, R-05, R-06; kiểm không có 2 dòng `room_occupancy` active giao nhau (phòng thủ cho S1); lệch → `data_quality` cho OWN | – | metrics mục 6; PRD S1 | R2 |
| J18 | `outbox.dispatch` | Liên tục (LISTEN/NOTIFY + quét 5 giây) | Gửi qua adapter (Mock ở R2); retry 5 lần lùi cấp số nhân → `dead` + "Cần chú ý" `channel_sync_error` | – | BR-905; ADR-011 | R2 |
| J19 | `inbox.process` | Liên tục | Xử lý webhook/IPN idempotent; webhook kênh = tín hiệu → kéo lại đơn (ADR-011 B4); đơn OTA trùng → luồng xung đột (erd mục 7) | – | BR-312, 905 | R3 |
| J20 | `channel.reconcile` | Hằng ngày 02:00 | So tồn Desk với channel manager, đẩy lại chênh lệch, báo lệch | – | BR-905 | R3 |
| J21 | `foc.alert` | Hằng ngày 06:00 | FOC tháng > ngưỡng % doanh thu phòng hoặc một người duyệt > N lần → báo OWN | `foc_alert_*` | BR-435 | R3 |
| J22 | `commission.cycle` | Ngày 1 hằng tháng | SM-11 `earned → payable` gộp theo tháng (chờ DOM SQ-4); đợt 2 dài hạn khi qua mốc thời hạn | `commission_payout` | BR-212, 903 | R3 |
| J23 | `maintenance.plan` / `meter.reminder` | Hằng ngày 07:30 | Bảo trì định kỳ sắp đến hạn; công tơ chưa chốt quanh `meter_reading_day` | `meter_reading_day` | BR-502, 810 | R3 |

**Công thức hạn khai báo** (tính một lần khi nhận phòng, lưu `registration.deadline_at` + `deadline_basis`; `t` = giờ nhận phòng thực tế theo giờ cơ sở):
- `vn(t)` = 23:00 cùng ngày nếu `t` trước 23:00; ngược lại 08:00 ngày hôm sau (`registration_deadline_vn`, BR-602).
- Hồ sơ có người nước ngoài: `registration_deadline_foreigner_mode = earlier_of` → `min(t + registration_deadline_foreigner_hours, vn(t))`; `hours_only` → `t + giờ`. Hồ sơ hỗn hợp lấy hạn sớm nhất.
- Trước khi nhận phòng, danh sách hiển thị "Khi nhận phòng" (US-042). Ví dụ BR-603 "nhận 21:30 → 09:30 hôm sau" **không khớp** chế độ `earlier_of` (cho 23:00) – đã đưa vào report ARC mục 4 để DOM/luật sư chốt (ESC-001); đổi chế độ chỉ là đổi tham số.

## 9a. Mã chứng từ do server cấp (BR-007, BL 8.2 #18)
Bộ đếm `doc_sequence` theo `(cơ sở hoặc tổ chức, loại mã, kỳ)`, cấp trong **cùng giao dịch** tạo bản ghi bằng `UPDATE … SET next_value = next_value + 1 RETURNING` (khóa hàng) – không hở số khi rollback, không trùng, không dùng thời gian/số ngẫu nhiên/`SEQUENCE`. Bill cấp số khi folio `settled` (đánh lại theo ngày `F-yymmdd-nnnn`). Chi tiết định dạng, thuật toán, seed nối tiếp prototype: `erd.md` mục 10. Test bắt buộc: 50 request song song → 50 mã liên tiếp, không trùng (US-023).

## 10. Bảo mật ở mức kiến trúc (SEC Phần 2 sẽ chi tiết trong `threat-model.md`, `security-requirements.md`)
- **Xác thực nhân viên**: phiên phía server (bảng `session` trong Postgres), cookie `HttpOnly; Secure; SameSite=Lax`, mật khẩu argon2id, khóa tạm sau nhiều lần sai; 2FA (TOTP) cho chủ đầu tư/quản lý – R3. Phê duyệt FOC bằng tài khoản người duyệt (BR-432), xác nhận lại mật khẩu/PIN (R3).
- **Phân quyền**: kiểm ở server theo vai × cơ sở × hành động; **lọc trường nhạy cảm ở server** (serializer theo quyền) – client không nhận dữ liệu nó không được xem (sửa BL 8.2 #27).
- **Khách**: token theo đơn (ADR-006).
- **C3**: ADR-013. **Không** đưa C2/C3 vào URL, log, thông báo đẩy, tiêu đề email.
- **Bí mật**: chỉ biến môi trường (file `.env` trên máy chủ, quyền 600; `.env.example` chỉ placeholder); KEK tách riêng; không bí mật nào trong image Docker.
- **Webhook/IPN**: xác thực chữ ký; IPN chỉ chấp nhận khi khớp số tiền; webhook kênh → kéo lại dữ liệu qua API (ADR-011 B4).
- **Biên mạng**: chỉ mở 80/443 (+ SSH bằng khóa, giới hạn IP nếu được); Postgres không mở ra ngoài; rate limit đăng nhập và endpoint khách (trong API, bộ đếm ở Postgres/RAM).
- **Header**: CSP chặt cho SPA, HSTS, `X-Content-Type-Options`, `Referrer-Policy: no-referrer` cho guest-web (token trong đường dẫn).

## 11. Offline cho app nhân viên (ADR-005)
| Nhóm thao tác | Offline? | Cách làm |
|---|---|---|
| Xem việc hôm nay, trạng thái 10 căn, checklist, danh mục minibar | Đọc được | Cache IndexedDB, hiện "cập nhật lúc hh:mm" |
| Đổi trạng thái buồng, tick checklist, đếm minibar, báo sự cố (kèm ảnh nén) | Ghi vào hàng đợi | Idempotency-Key sinh trên máy + `performedAt`; gửi lại bằng Background Sync / khi online |
| Đặt/giữ chỗ/gia hạn/thu tiền/FOC/xem giấy tờ | **Không** | Nút khóa + "Cần có mạng" (cần server kiểm trùng/kiểm quyền) |
| Xung đột khi gửi lại | – | Server kiểm chuyển trạng thái hợp lệ; bị từ chối → mục "Không áp dụng được" + lý do; không ghi đè im lặng |

Lễ tân mất mạng tại quầy (tình huống S7): admin-web giữ rack đã tải ở chế độ chỉ xem + banner; khi có mạng, worker đẩy lại tồn và đối soát kênh. **UXD** cần thiết kế: banner mất kết nối, huy hiệu "đang chờ gửi (n)", danh sách mục không áp dụng được.

## 12. Cập nhật thời gian thực
SSE `GET /v1/properties/{id}/events` phát sự kiện nhẹ (`room.status_changed`, `reservation.changed`, `attention.changed`, `task.assigned`) chỉ chứa ID + loại; client gọi lại API để lấy dữ liệu theo quyền của mình (không đẩy dữ liệu nhạy cảm qua kênh sự kiện). Mất kết nối → TanStack Query refetch khi online/focus + poll 30 giây.

## 13. Lớp adapter tích hợp – khớp interface INT (ADR-011)

| Interface INT (`product/integrations/README.md`) | Module lõi gọi | Mock R2 | Thật | Nhận xét ARC |
|---|---|---|---|---|
| `ChannelAdapter` | `channels` | Có (kịch bản trễ/trùng/xung đột) | Beds24 (R3, theo ESC) | Chấp nhận; bổ sung B1–B4, B9 (đa cơ sở, `LocalDate`, thêm trường sự kiện, webhook = tín hiệu rồi kéo lại, push theo khoảng ngày). Cần thêm `fetchBooking(externalId)` |
| `PaymentAdapter` | `folio` | Có | VietQR (R2, chỉ sinh chuỗi), VNPay/MoMo (R3), bankfeed (R3) | Chấp nhận; `verifyCallback` → async (B5); `paymentId` sinh trước khi gọi cổng là đúng; trạng thái giao dịch của INT dùng nguyên trong ERD |
| `EInvoiceAdapter` | `folio` | Có | MISA (R3) | Chấp nhận; `invoiceRef` = khóa idempotency; phát hành qua outbox, lỗi không chặn trả phòng |
| `DoorLockAdapter` | `doorlock` | `manual` + `mock` | TTLock/Tuya (sau MVP) | Chấp nhận; sinh mã ở lõi (không trùng mã hiệu lực trên cùng khóa); mã cửa đang hiệu lực là C3 → mã hóa trường |
| `NotificationAdapter` | `messaging` | `mock`, `manual_copy` | email (R2), ZNS (R3/sau) | Chấp nhận; nội dung render ở lõi theo `templateId` + `locale` |
| `GuestRegistrationAdapter` | `registration` | – | `semi_auto` duy nhất | Chấp nhận; không scrape cổng BCA |
| (chung) | `integrations-hub` | – | – | Thêm `IntegrationError` (B6), `healthCheck()` (B7), credential theo cơ sở (B8), Mock có kịch bản lỗi (B10) |

Biến môi trường: dùng nguyên danh sách INT mục 4; OPS đưa vào `product/.env.example` (giá trị trống). Thêm của ARC: `DATABASE_URL`, `APP_BASE_URL`, `GUEST_BASE_URL`, `SESSION_SECRET`, `DATA_KEK_CURRENT`, `DATA_KEK_VERSION`, `ID_HASH_KEY`, `BLOBSTORE_PROVIDER=local|s3`, `BLOBSTORE_LOCAL_PATH`, `CLOCK_OVERRIDE` (chỉ dev/staging), `LOG_LEVEL`.

Các điểm B1–B10 sẽ được ghi thành thẻ trong `rounds/round-01/reviews/ARC-on-INT.md` ở bước 3 để INT cập nhật README (ARC không sửa file của INT).

## 14. Nhận xét bảng so sánh channel manager – góc kỹ thuật (cùng INT)

Đánh giá trên `product/docs/integrations/channel-manager-comparison.md` bản 1. ARC **đồng ý đề xuất Beds24** với các điều kiện kỹ thuật dưới.

| Tiêu chí kỹ thuật | Beds24 | ezCloud | Channex | Cloudbeds |
|---|---|---|---|---|
| App OTTIMO giữ vai nguồn tồn duy nhất (BR-905) | Được – API V2 đẩy tồn/giá, webhook đơn | **Không được** khi chưa có API: phải dùng PMS ezCloud song song → 2 nguồn tồn → nguy cơ đặt trùng (vi phạm ADR-009 mục tiêu S1) | Được – sản phẩm thiết kế cho PMS bên ngoài | Không – Cloudbeds tự là PMS; OTTIMO sẽ "đứng sau" |
| Hợp mô hình tồn theo từng căn (ADR-009) | Hợp: Beds24 quản lý theo "room" có số lượng đơn vị; ánh xạ được cả căn lẻ (Airbnb) và nhóm (OTA khác) qua `channel_mapping` | Chưa rõ | Hợp | – |
| Giới hạn tốc độ | 100 credit/5 phút [Nguồn INT] → **bắt buộc gộp lô** (ADR-011 B9, mục tiêu ≤ 1 phút vẫn đạt với 10 căn); cân nhắc gói +€10 nếu đối soát tốn credit | – | Không thấy giới hạn chặt [chưa xác minh] | – |
| Môi trường thử | Không có sandbox tách riêng [Chưa xác minh] → **rủi ro**: thử trên tài khoản thật có thể đẩy tồn ra OTA thật. Giảm thiểu: tài khoản thử riêng chưa nối OTA, hoặc chỉ bật kênh sau khi đối soát | Dùng thử 7 ngày | Staging miễn phí – tốt nhất | Staging đối tác |
| Độ tin cậy webhook | Chưa xác minh có chữ ký → dùng mẫu "webhook = tín hiệu, kéo lại qua API" (B4) – an toàn bất kể | – | Có API đầy đủ | – |
| Rủi ro khóa nhà cung cấp | Thấp nhờ adapter (ADR-011); dự phòng Channex chỉ cần viết adapter mới | Cao nếu phải dùng PMS của họ | Thấp | Cao |
| Dữ liệu ra nước ngoài (ESC-002) | Có (C2: tên, ngày ở, liên hệ OTA) – không tránh được với mọi CM nước ngoài; **không gửi giấy tờ, không kéo VCC** | Có thể ở VN [chưa xác minh] – điểm cộng duy nhất về pháp lý | Có | Có |

Đề nghị kỹ thuật bổ sung trước khi chốt ESC (INT làm, không cần tài khoản thật):
1. Đọc tài liệu Beds24 API V2: cách xác thực webhook, đơn vị tính "credit" của từng lời gọi, có đặt được tồn theo khoảng ngày trong 1 lời gọi không → ước số lời gọi/ngày cho 10 căn × 365 ngày.
2. Xác nhận Beds24 có cho tắt sửa đơn/tồn trực tiếp trên giao diện Beds24 (tránh nhân viên sửa ở 2 nơi); nếu không, quy định vận hành + đối soát hằng đêm phát hiện lệch.
3. Hỏi ezCloud bằng văn bản về API đối tác 2 chiều – nếu không có, **ARC đề nghị loại ezCloud** khỏi ESC vì mâu thuẫn nguyên tắc "một nguồn sự thật cho phòng trống" (PRD mục 2 nguyên tắc 2).
4. Ghi trong ESC: phí CM nằm **ngoài** ngân sách hạ tầng ≤ 1 tr/tháng (Beds24 ước 0,9–2,3 tr) – INV duyệt riêng.

## 15. Hosting, chi phí, triển khai (ADR-010)

Tóm tắt bảng chi phí (chi tiết, nguồn và mức xác minh ở ADR-010):

| | A. Việt Nam (đề xuất) | B. Singapore | C. Châu Âu |
|---|---|---|---|
| Tổng ước/tháng | **~450.000–900.000 đ** | ~650.000–1.150.000 đ | ~300.000–450.000 đ |
| Dữ liệu khách tại VN | Có | Không | Không |
| Trễ từ Đà Lạt | thấp | trung bình | cao |

→ **Không vượt ngân sách**; ủng hộ phương án A của ESC-002. Mọi giá là [Bên thứ ba]/[Chưa xác minh]; OPS lấy báo giá chính thức ở `hosting-plan.md`.

Triển khai: image Docker build trong CI → đẩy lên registry (GitHub Container Registry, gói miễn phí cho repo riêng tư trong hạn mức [Chưa xác minh]) → VPS `docker compose pull && up -d`; migration DB chạy như bước riêng trước khi bật api mới; giữ image trước để quay lui. Chi tiết: OPS (R2).

## 16. Ngân sách hiệu năng

| Chỉ số | Đích | Cách đo |
|---|---|---|
| API p95 (đọc) | < 300 ms tại máy chủ | Log thời gian xử lý; k6 (R3) |
| API p95 (ghi đặt phòng/folio) | < 500 ms | k6 |
| Mở app (admin-web, PWA, guest-web) trên 4G, Android tầm trung | < 2 giây (lần đầu), < 1 giây (lần sau, có cache SW) | Lighthouse CI / Playwright trace |
| Chuyển màn hình | < 300 ms | Playwright |
| Bundle JS lần tải đầu (gzip) | guest-web ≤ 150 KB; mobile ≤ 180 KB; admin-web ≤ 300 KB (chia theo route) | Kiểm trong CI (`size-limit`) từ R2 |
| Phản hồi lưu (PRD N3) | ≤ 1 giây cảm nhận | Cập nhật lạc quan ở UI chỉ cho thao tác buồng phòng; thao tác tiền chờ server |
| Đồng bộ tồn lên kênh | ≤ 1 phút (BR-905) | `integration_log` |
| Room rack 14 ngày × 10 căn | 1 request, < 200 ms | Truy vấn `room_occupancy` theo khoảng |

## 17. Cấu trúc repo `product/` và công cụ (cho OPS dựng khung – ADR-012)

```
<gốc repo>/
├── .github/workflows/ci.yml          # CI: working-directory product/
└── product/
    ├── package.json                  # scripts gốc: lint, test, build, format:check, dev, db:migrate, db:seed, e2e
    ├── pnpm-workspace.yaml           # apps/*, services/*, packages/*, integrations, tests/e2e
    ├── pnpm-lock.yaml
    ├── turbo.json
    ├── tsconfig.base.json
    ├── .nvmrc                        # 22
    ├── .env.example                  # chỉ placeholder (mục 13 + INT mục 4)
    ├── .editorconfig, .prettierrc, eslint.config.js
    ├── apps/
    │   ├── admin-web/                # FE – React+Vite SPA
    │   ├── mobile/                   # MOB – PWA "OTTIMO Staff" (React+Vite, service worker)
    │   ├── guest-web/                # MOB (chính) + FE – app khách theo link/QR
    │   └── booking-web/              # FE – R3; R1–R2 chỉ README
    ├── services/
    │   └── api/                      # BE – NestJS; src/main.ts (api), src/worker.ts (worker)
    │       ├── src/modules/<module>/{public,internal}
    │       ├── src/db/{schema,migrations,seed}
    │       └── test/                 # Vitest: unit + integration với Postgres thật
    ├── packages/
    │   ├── contracts/                # kiểu TS sinh từ docs/api/openapi.yaml + zod dùng chung
    │   ├── ui/                       # token CSS từ design/tokens.json + component
    │   ├── i18n/                     # chuỗi vi/en/ru
    │   ├── config-eslint/            # cấu hình ESLint chung + quy tắc riêng (Clock, tiền)
    │   └── config-ts/                # tsconfig preset (nếu cần tách khỏi tsconfig.base)
    ├── integrations/                 # INT – package @ottimo/integrations (cấu trúc theo README của INT)
    ├── infra/
    │   ├── docker/                   # Dockerfile.api (multi-stage, dùng cho api + worker), Dockerfile.web
    │   ├── compose/                  # docker-compose.yml (dev), docker-compose.prod.yml
    │   ├── caddy/Caddyfile
    │   └── scripts/                  # backup.sh, restore.sh, deploy.sh
    ├── tests/
    │   ├── e2e/                      # Playwright (R2+)
    │   ├── load/                     # k6 (R3)
    │   ├── fixtures/                 # dữ liệu mẫu 10 căn, khách mẫu BL 3.21 (giả, không dữ liệu thật)
    │   └── test-cases/               # tài liệu test case của QA
    ├── design/                       # UXD (không phải code build)
    ├── docs/
    └── legacy/round-0-prototype/     # giữ nguyên, không build
```

Ghi chú cho OPS (Đợt 3):
- Thư mục `product/apps/mobile` (đã có) **giữ tên** theo protocol, nội dung là PWA – không phải Flutter.
- Khung R1 tối thiểu để CI xanh: `services/api` có endpoint `GET /health` (trả `{status:"ok", db:"ok", time:"<ISO +07:00>"}`) và 1 test Vitest; `apps/admin-web`, `apps/mobile`, `apps/guest-web` mỗi app 1 trang trống build được + 1 test; `packages/contracts` rỗng build được; `integrations` có interface + 1 Mock + 1 test.
- `docker-compose.yml` dev: `postgres:17-alpine` (có `btree_gist`), `api`, `worker`, `caddy` (tùy chọn ở dev); Vite dev server chạy ngoài container cho nhanh.
- Lệnh và bước CI: xem ADR-012.

## 18. Pha B (Đợt 3) cần gì từ các vai khác

| Từ | Cần | Dùng cho | Mức tối thiểu để ARC bắt đầu |
|---|---|---|---|
| **BA** | `state-machines.md`: đơn (gồm cách biểu diễn "xung đột OTA" – trạng thái hay cờ), phân đoạn đơn/đổi phòng, hợp đồng dài hạn + kỳ thu, buồng (7 mã, BR-802), phiếu sửa chữa, khai báo lưu trú, thanh toán/hoàn tiền, yêu cầu khách | Enum + bảng trạng thái + chuyển trạng thái hợp lệ trong ERD/OpenAPI | Sơ đồ có điều kiện chuyển + vai được chuyển |
| **BA** | `rbac-matrix.md` theo màn hình × hành động × **trường** (C0–C3), gồm khách (mức 1/mức 2 – ADR-006) | Thiết kế serializer theo quyền, scope API, RLS | Bảng vai × hành động × trường nhạy cảm |
| **BA** | `use-cases.md` các luồng R2 (ít nhất luồng 2–7 của plan 3.3) | Danh sách endpoint OpenAPI | Tên use case + bước chính |
| **DATA** | `metrics-definitions.md` + **danh sách trường dữ liệu bắt buộc**: trạng thái đơn theo đêm, đêm OOO, phí kênh thực tế vs ước tính, phân bổ doanh thu dài hạn (theo đêm vs theo kỳ thu), doanh thu phòng vs doanh thu khác, nguồn/kênh/người bán, thời điểm các mốc (tạo, xác nhận, nhận, trả) để đo S2–S5 | Cột trong ERD; bảng/khung nhìn báo cáo | Danh sách trường + công thức Occupancy/ADR/RevPAR/GOP |
| **DOM** | Xác nhận: quy tắc gán căn tự động cho đơn OTA (ưu tiên căn nào), định dạng mã chứng từ (BR-007), chính sách xung đột (BR-312) đủ để code | Thuật toán gán căn, bộ đếm mã | Có trong BR hiện tại – chỉ cần DOM xác nhận khi review |
| **SEC** | Bảng thời hạn lưu (mục 7) dạng khóa tham số; danh sách trường C3 cuối cùng; yêu cầu xác minh khách mức 2 | Bảng `retention_policy`, mã hóa trường, endpoint khách | Đã có ở Phần 1 – đủ để bắt đầu |
| **INT** | Phản hồi B1–B10; mẫu payload Beds24 (đơn, tồn) từ tài liệu API V2; danh sách trường `channel_mapping` | Bảng `channel_mapping`, `inbox_message`, `ota_booking_raw` | Sau thẻ review bước 3; không chặn ERD lõi |
| **PO** | Danh sách story **Must R2** đã có AC (backlog mục 4) | Phạm vi OpenAPI R2 (QC A11, C1) | Đã có 71 story Must R2 |
| **UXD** | Wireframe luồng 2–7 (để đối chiếu endpoint, dữ liệu mỗi màn hình) | Kiểm OpenAPI đủ dữ liệu cho màn hình | Không chặn; đối chiếu ở bước 4 |

Sản phẩm Pha B: `product/docs/erd.md` (bảng, khóa, constraint, RLS, cột C3 mã hóa, bảng tham số có hiệu lực), `product/docs/api/openapi.yaml` (luồng R2, chuẩn lỗi RFC 9457 `application/problem+json`, phân trang cursor, `Idempotency-Key`, `If-Match`, ví dụ request/response), sinh mã chứng từ an toàn (BL 8.2 #18 – bộ đếm theo `(property, doc_type, kỳ)` khóa hàng trong giao dịch), danh sách job đầy đủ (mục 9), `product/docs/coding-standards.md` (hoặc `product/CONTRIBUTING.md`).

## 19. Rủi ro kỹ thuật

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| T1 | Phạm vi R2 lớn (71 story Must) so với năng lực BE/FE/MOB | Cao | Kiến trúc tối giản (1 ngôn ngữ, ít thành phần); đề nghị PO/ORC cắt theo thứ tự PRD D6; ARC ước lượng khi có OpenAPI (Pha B) |
| T2 | PWA trên iOS hạn chế (Background Sync, push) | Thấp–TB | Nhân viên buồng phòng dùng Android (giả định); fallback gửi lại khi mở app; điều kiện chuyển native ở ADR-005 |
| T3 | Beds24 không có sandbox riêng – thử có thể ảnh hưởng OTA thật | TB | Tài khoản thử chưa nối OTA; Mock có kịch bản; bật kênh từng bước ở R3 |
| T4 | 1 VPS là điểm lỗi đơn | TB | Backup + WAL off-site tại VN; runbook dựng lại ≤ 4 giờ; thử khôi phục mỗi round |
| T5 | Mất KEK = mất ảnh giấy tờ; lộ KEK = lộ ảnh | TB | KEK ngoài máy chủ, INV giữ bản sao; xoay khóa; ảnh chỉ giữ ngắn hạn |
| T6 | Drizzle/pg-boss là thư viện nhỏ hơn Prisma/BullMQ | Thấp | Khóa phiên bản; lớp repository/queue bọc lại để thay được (Kysely; BullMQ+Redis) |
| T7 | Giá hosting chưa xác minh | Thấp | OPS lấy báo giá R2; nếu vượt → ESC |
| T8 | Hạn khai báo NN 12 giờ (SEC L4) chưa chắc | TB | Hạn là tham số cấu hình (BR mục 13), job đọc tham số – đổi không cần sửa code |

## 20. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 – Đợt 2 | Bản Pha A: kiến trúc tổng thể, ADR-001…013, chi phí hạ tầng, adapter, nhận xét channel manager, cấu trúc repo | ARC |
| 15/10/2026 | 1 – Đợt 3 | Pha B: danh sách 23 job theo lịch + nguyên tắc chạy đúng một lần/bắt kịp (9.1), công thức hạn khai báo, mã chứng từ (9a), chốt biểu diễn đơn OTA xung đột (8); tài liệu mới `erd.md`, `api/openapi.yaml`, `coding-standards.md` | ARC |
