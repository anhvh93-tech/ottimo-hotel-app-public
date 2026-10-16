# BE – Round 2, Tuần 1 (Đợt 0): W10, W13 (phần BE), W17 + xem lại TRUST_PROXY

- Vai: BE | Ngày: 16/10/2026 | Phạm vi: R-C (đã chốt) | Không commit (theo chỉ đạo ORC)
- Đầu vào: `rounds/round-02/plan.md` mục 3.2–3.3; `rounds/round-01/reviews/BE-on-ARC.md` (thẻ 01–07 + bảng ước); `rounds/round-01/responses/ARC-responses.md`; `product/docs/erd.md` v0.2.1 (mục 2, 4, 14, 16); `architecture.md` (9.1, 12.1, 13); ADR-002/007/008/013; `coding-standards.md` mục 6; `openapi.yaml`, `openapi.test.yaml`; `rounds/round-02/outputs/OPS/w1-skeleton-run.md`; mã `product/services/api/`.

## 1. W10 – Đối chiếu thẻ BE-ARC 01–07

Kết luận: **cả 7 thẻ đã đủ để code**. Điều kiện của bảng ước ("không chốt → cộng 1–1,5 tuần") **không kích hoạt**. Còn vài lệch nhỏ (G1–G6) không chặn code, ghi ở cột cuối và mục 1.1.

| Thẻ | Nội dung | Tài liệu chốt (đã đọc lại) | Trạng thái BE | Còn thiếu / ghi chú |
|---|---|---|---|---|
| 01 | Truy vấn trước ngữ cảnh RLS | erd 2.4 (7 hàm `SECURITY DEFINER` có danh sách cột), `username` UK toàn hệ thống (erd 4.2), webhook `/v1/webhooks/{provider}/{propertySlug}` (R3), `pgboss` ngoài RLS (erd 2.5), bỏ "vai job riêng" (ADR-007) | **Đủ để code** | Không thiếu về tài liệu. Webhook là R3 nên R2 không phải làm `webhook_resolve_property` (vẫn tạo hàm trong migration cho đủ bộ) |
| 02 | RLS với kết nối tái sử dụng | erd 2.2–2.3 (`app_current_property()`/`app_current_org()` có `NULLIF`, tên biến số ít, `set_config(…, true)`), policy `doc_sequence`, test 2.7 mục 2; coding-standards 6 "Ngữ cảnh RLS" | **Đủ để code** | Không |
| 03 | Vai DB, superuser, trustProxy | erd 2.1 (4 vai), 2 URL; OPS đã hiện thực và **chạy thật** (w1-skeleton-run 3.1: owner NOLOGIN, migrator `SET` không `INHERIT`, app không super/bypass; test `db-role` 5/5 xanh); `TRUST_PROXY` danh sách IP/CIDR | **Đủ để code** | G4: kiểm `rolsuper/rolbypassrls` **lúc khởi động** api/worker (erd 2.1) chưa có trong `main.ts` – việc của BE-A (module 1), không phải tài liệu. G3: tên biến lệch (mục 1.1) |
| 04 | Clock / giờ giả | ADR-008 điểm 2, 4 (`now/businessDate/atLocal`, `MutableClock` + `dev_clock` + `NOTIFY clock_changed`, `/__test__/*` chỉ ngoài production, cấm `now()` trong SQL nghiệp vụ, tick + so mốc); `openapi.test.yaml` có `/__test__/clock`, `/__test__/jobs/{jobKey}/run`; erd `dev_clock` (ngoại lệ RLS có lý do) | **Đủ để code** | Mã hiện tại còn `FixedClock` + `CLOCK_OVERRIDE` (khung R1) – BE-A thay bằng `MutableClock` + `CLOCK_MODE` trong module 1; TC-X-066 (d) của OPS chạy lại khi có `src/test-support/` |
| 05 | Job đúng một lần | architecture 9.1 "Mẫu handler job" (job_run cùng giao dịch, không `started`), J1 `singletonKey = id:hold_expires_at`, J1 vs `confirm-deposit` khóa đơn trước, thứ tự khóa (coding-standards 6), LISTEN riêng (erd 2.5) | **Đủ để code** | G1: bảng job 9.1 vẫn ghi **J12, J13 = R2**, trong khi R-C dời kỳ thu/gia hạn sang R3 → ARC sửa cột R. G2: J2 mô tả "hẹn giờ tại …" lệch "một cơ chế lập lịch" (ADR-008 điểm 4) – BE làm J2 bằng tick quét `hold_expires_at − reminder ≤ $now` |
| 06 | "Cần chú ý" + thông báo nhân viên | architecture 12.1; erd `attention_event` (có `dedupe_key`), `staff_notification`; OpenAPI `/v1/me/notifications`, `…/read`, `resolveAttentionEvent`, enum `StaffNotification.kind`, SSE `notification.created`; Web Push R3 | **Đủ để code** | Không. Ghi chú: `staff_notification` + `attention_event` là hạ tầng dùng chung → BE-A làm trong module 10 (mục 2) |
| 07 | Nguồn sự thật schema / migration | erd 16, ADR-002, coding-standards 6 (SQL là nguồn sự thật, `--custom`, cấm `push`, CI 2 bước, `setTypeParser(20)`, `uuid@^11`, đổi `src/db.ts` → `src/db/pinger.ts`) | **Đủ để code** | G5: chưa cài `drizzle-orm`/`drizzle-kit`/`uuid`, chưa đổi tên `src/db.ts` – việc đầu tiên của BE-A. CI bước (b) "generate không sinh file mới" cần OPS thêm job khi có migration đầu tiên |

### 1.1 Lệch nhỏ cần ARC/OPS sửa (không chặn code)
| # | Lệch | Đề xuất | Ai |
|---|---|---|---|
| G1 | architecture 9.1: J12 `billing.status`, J13 `lease.renewal_offer` ghi R2; R-C dời sang R3 | Sửa cột R → R3 (giữ trạng thái kỳ thu cho đơn dài hạn nhập tay: không có kỳ) | ARC |
| G2 | J2 "hẹn giờ" vs ADR-008 điểm 4 | Ghi J2 = tick mỗi phút quét theo `Clock` (như J1) | ARC |
| G3 | architecture 13 dùng `TRUST_PROXY_CIDR`, `DATA_KEK_FILE`, `CLOCK_MODE`, `TEST_SUPPORT_TOKEN`, `ADMIN_BASE_URL`/`STAFF_BASE_URL`; mã + `.env.example` + hosting-plan dùng `TRUST_PROXY`, `DATA_KEK_CURRENT(_FILE)`, `CLOCK_OVERRIDE`, `APP_BASE_URL` | Giữ `TRUST_PROXY` và `DATA_KEK_CURRENT` (+ cơ chế `X_FILE` chung) vì đã chạy thật ở OPS; `CLOCK_MODE` + `TEST_SUPPORT_TOKEN` + 3 origin BE thêm khi làm MutableClock/test-support (OPS cập nhật `.env.example`); ARC sửa mục 13 cho khớp | ARC + OPS + BE |
| G4 | Kiểm vai DB lúc khởi động chưa có | BE-A, module 1 | BE |
| G5 | Drizzle/uuid chưa cài, `src/db.ts` chưa đổi tên | BE-A, module 1 | BE |
| G6 | Phụ thuộc ngoài thẻ 01–07 cần có **trước Sprint 2**: hợp đồng API AC5a "đơn dài hạn nhập tay" (ARC việc 3), DOM chốt E6 "rời trong ngày" (erd 14 – đang giả định giữ đêm đầu) | ARC, DOM chốt trong Sprint 1 | ARC, DOM |

## 2. W13 (phần BE) – Ước lượng R-C chốt và chia 2 luồng

Giả định giữ nguyên bảng BE-on-ARC (1 người/luồng toàn thời gian, có AI hỗ trợ, đã gồm unit + integration test PostgreSQL thật + test đồng thời; chưa gồm INT thật, OPS, FE/MOB). W10 đạt nên không cộng 1–1,5 tuần.

| # | Module | PO đề xuất (R-C) | **BE chốt** | Luồng | Lý do điều chỉnh |
|---|---|---|---|---|---|
| 1 | Nền tảng kỹ thuật | 3,0–3,5 | **3,0–3,5** | BE-A | Giữ. Gồm thêm G4, G5, thay `CLOCK_OVERRIDE` bằng MutableClock, `TestSupportModule` – đều đã nằm trong phạm vi gốc |
| 2 | identity | 1,0 | **1,0** | BE-B | Giữ |
| 3 | platform | 0,5–0,75 | **0,5–0,75** | BE-B | Giữ |
| 4 | reservations + giá + báo giá ngắn + giữ chỗ + AC5a | 2,75–3,5 | **2,75–3,5** | BE-A | Giữ. Gồm `swapRoom` (BE-ARC-08), xung đột OTA US-139, đơn dài hạn nhập tay (≈ 0,25, đã tính) |
| 5 | frontdesk + folio + VietQR | 2,0–2,5 | **2,0–2,5** | BE-B | Giữ. W15 (step-up mã cửa) **không** vào R2 vì US-128 dời R3 |
| 6 | registration + C3 | 1,75–2,25 | **1,75–2,25** | BE-B | Giữ |
| 7 | housekeeping + maintenance + inventory | 1,5–2,0 | **1,5–2,0** | BE-B | Giữ |
| 8 | guests | 0,5–0,75 | **0,5–0,75** | BE-B | Giữ (Sprint 1 cần cho bộ chọn khách) |
| 9 | guest-portal mức 1 + yêu cầu khách | 0,5–0,75 | **0,75–1,0** | BE-B | **+0,25**: còn lại ở R2 vẫn có phiên khách theo link (`guest_resolve_token`, `guest_session`, link chờ/không thu hồi link đang dùng – SEC-03), API tải giấy tờ check-in online qua token (rate limit, SR-FILE, chỉ trả "đã tải n/m" theo P-R2-4), thông tin lưu trú theo khung Wi-Fi, gửi/xem yêu cầu + định tuyến. Nếu SEC không chấp nhận P-R2-4 → thêm +0,5 (US-141) |
| 10 | reporting R2 + SSE + `attention_event` + `staff_notification` | 0,75–1,0 | **0,75–1,0** | BE-A | Giữ |
| 11 | worker J1–J18 phần R2 + outbox Mock | 1,0–1,25 | **1,0–1,25** | BE-A | Giữ (J12, J13 ra khỏi R2 – G1) |
| 12 | Ổn định cuối round | 1,25–2,0 | **1,25–2,0** | A 0,75–1,0 · B 0,5–1,0 | Chia theo tải: B nặng hơn nên A nhận phần test hiệu năng rack + RLS 2 cơ sở |
| | **Tổng** | 16,5–21,25 | **≈ 16,75–21,5** | | **BE-A ≈ 8,25–10,25 · BE-B ≈ 8,5–11,25** |

### 2.1 Lịch và thứ tự trong luồng
- **BE-A**: Đợt 0–Sprint 1 module 1, giao theo từng phần để BE-B không chờ: (a) cuối tuần 1: pipeline migration + vai DB + giao dịch có ngữ cảnh + 7 hàm đường vào + test kiến trúc; (b) giữa Sprint 1: problem+json, Idempotency/If-Match, guard `x-roles` + serializer `x-visible-to`, `audit_event`, `DocNumberService`, `ParameterService`, MutableClock + `/__test__`. → Sprint 2 module 4 → Sprint 3 module 11 (J1, J5, J16 trước) + 10 → Sprint 4 module 10 phần dashboard/SSE + 12.
- **BE-B**: Sprint 1 module 2, 3, 8 (trên phần (a) của BE-A; tuần 1 dựng route/DTO theo contract, nối vào guard khi (b) xong) → Sprint 2 nền folio của module 5 → Sprint 3 module 5 + 6 → Sprint 4 module 7 + 9 → 12.
- Lịch: luồng dài nhất là BE-B 8,5–11,25 tuần → R2 khoảng **10–12 tuần lịch** gồm tuần 1 (plan ghi 10–11). Đầu trên vượt 11 tuần chỉ khi mọi module rơi vào cận trên; giữ 11 tuần bằng cách dồn Should R2 (US-094, 058, 137, 013, 033) sang R3 – không ảnh hưởng QC R2. Một luồng BE: ≈ 4–5 tháng (không đổi).
- Rủi ro lịch: BE-B phụ thuộc phần (a)/(b) của BE-A; trễ (b) quá giữa Sprint 1 → BE-B trễ tương ứng. Đây là điểm ORC cần theo dõi hằng ngày trong Sprint 1.

## 3. W17 – `GUEST_CODE_SIGNING_KEY` + mỗi mục đích một khóa

Sửa `product/services/api/src/config.ts`:
- `REQUIRED_SECRETS` = `SESSION_SECRET`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY`, **`GUEST_CODE_SIGNING_KEY`** (export để test kiểm). Trống chỉ được ở `dev`/`test`; đặt thì phải ≥ 32 ký tự ở mọi môi trường; staging/production thiếu → dừng khởi động. Đọc được từ Docker secret qua `GUEST_CODE_SIGNING_KEY_FILE` (cơ chế `X_FILE` sẵn có).
- **Mỗi mục đích một khóa (ADR-013 điểm 5)**: dừng khởi động nếu 2 giá trị bất kỳ trong `SESSION_SECRET`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY`, `GUEST_CODE_SIGNING_KEY`, `DATA_KEK_CURRENT` trùng nhau (mọi môi trường – chặn cả thói quen dán một khóa cho tất cả ở dev). Thông báo chỉ nêu tên biến, không nêu giá trị.

Test `product/services/api/test/config.test.ts` (10 → 16 ca): fixture production dùng 5 khóa khác nhau; ca mới: thiếu/trống/ngắn `GUEST_CODE_SIGNING_KEY` ở staging và production → đỏ; vòng lặp mọi khóa trong `REQUIRED_SECRETS` × {staging, production}; dev/test được trống nhưng vẫn kiểm độ dài khi đặt; đọc từ `_FILE`; trùng khóa giữa các mục đích (cả KEK) → đỏ, thông báo không chứa giá trị; IP/CIDR sai dạng.

**Chứng minh test đỏ thật**: tạm xóa `GUEST_CODE_SIGNING_KEY` khỏi `REQUIRED_SECRETS` rồi chạy `vitest run test/config.test.ts` → `Tests 3 failed | 13 passed (16)` (ca W17, ca dev/test, ca trùng khóa); khôi phục → `16 passed`.

## 4. Xem lại thay đổi TRUST_PROXY của OPS
- **Đồng ý**: Fastify ≥ 5.12 không tin proxy theo số bước (GHSA-3m5p-2c4r-xxw2) → từ chối số bước và `true` lúc khởi động là đúng; kiểu `false | string[]` khớp `http.ts`; mặc định không tin ai.
- **BE siết thêm**: regex cũ `^[0-9a-fA-F:.]+(/\d{1,3})?$` nhận cả `...`, `999.1.1.1`, `10.0.0.0/33`. Đổi sang `node:net isIP` + prefix ≤ 32 (IPv4) / ≤ 128 (IPv6). Test thêm 7 dạng sai + IPv6 hợp lệ.
- **Đề xuất cho OPS/SEC (không sửa file OPS)**: staging/production phải đặt `TRUST_PROXY` = IP container Caddy (hosting-plan đã ghi). Nếu để trống sau Caddy, mọi request có cùng IP Caddy → giới hạn tần suất theo IP (đăng nhập, xác minh khách) gộp thành một – một người thử sai có thể khóa tạm cả quầy. Khi OPS viết `docker-compose.prod.yml`/staging, BE có thể thêm kiểm "staging/production bắt buộc có `TRUST_PROXY`" nếu SEC đồng ý.
- Tên biến lệch `TRUST_PROXY_CIDR` ở architecture 13 → G3.

## 5. Kết quả chạy (thật, 16/10/2026, máy INV, Node 22.23.3, pnpm 9.15.4, PostgreSQL 17.11 compose `ottimo-dev`)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `pnpm -s format:check` | `All matched files use Prettier code style!` | 0 |
| `pnpm -s lint` (lần 1) | ĐỎ: 2 lỗi `@typescript-eslint/no-unused-vars` (`_omit` trong test mới) → sửa bằng hàm `without()` | 1 |
| `pnpm -s lint` (lần 2) | ESLint sạch, `typecheck` 8/8 task | 0 |
| `pnpm -s test` với `DATABASE_URL` (ottimo_app) + `MIGRATION_DATABASE_URL` (ottimo_migrator) → `ottimo_test` | `@ottimo/api` **Tests 34 passed (34)** (trước: 28; `config.test.ts` 16, `db-role` 5, không skipped); integrations 6, 3 app × 1; Turbo 8/8 | 0 |
| Đối chứng đỏ W17 (mục 3) | `3 failed | 13 passed` → khôi phục `16 passed` | 1 → 0 |

Postgres compose để chạy (`docker compose … up -d postgres`), không xóa volume.

## 6. File tạo/sửa
- `product/services/api/src/config.ts` – W17, kiểm trùng khóa, siết `parseTrustProxy`
- `product/services/api/test/config.test.ts` – 6 ca mới, fixture khóa riêng từng mục đích
- `01-decisions/decision-log.md` – 3 dòng BE (W17, TRUST_PROXY, W10/W13)
- `rounds/round-02/outputs/BE/w1-report.md` – file này

## 7. Giả định
- J2 làm bằng tick quét theo `Clock` (G2) cho tới khi ARC sửa câu chữ.
- Giữ tên biến `TRUST_PROXY`, `DATA_KEK_CURRENT(_FILE)` theo mã + OPS (G3).
- Ước module 9 tính theo P-R2-4 được SEC chấp nhận; không thì +0,5 tuần-người BE-B.
- 2 luồng BE song song như plan 3.3 (ORC quyết).

## 8. Rủi ro / việc chưa xong
- Không có ESC mới (mọi điểm trên thuộc quyền ARC/OPS/BE).
- Chưa có CI GitHub chạy thật (OPS, chờ repo) – kết quả trên là chạy cục bộ.
- Việc tiếp theo của BE-A ngay sau W1: module 1 phần (a) – G4, G5, migration đầu tiên.
