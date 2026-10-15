# Chuẩn code – OTTIMO Desk

- Người viết: ARC | Round 1 – Bước 4 | Ngày: 16/10/2026 | Phiên bản: 0.2 (sửa theo BE-on-ARC, SEC-on-ARC, QA)
- Áp dụng: mọi mã trong `product/` (apps, services, packages, integrations, infra, tests) từ Round 2. Vai: BE, FE, MOB, INT, OPS, QA.
- Đọc cùng: `architecture.md` (mục 5, 9, 16, 17), `adr/ADR-001…013`, `erd.md`, `api/openapi.yaml`, `rbac-matrix.md`, `security/data-risk-assessment.md`.
- Quy tắc ghi **[LINT]** = được kiểm tự động trong CI (ESLint / tsc / test kiến trúc); **[REVIEW]** = người review bắt buộc kiểm.
- File này là chuẩn kỹ thuật. Hướng dẫn đóng góp ngắn (cách chạy, cách mở PR) nằm ở `product/docs/dev-setup.md` của OPS; nếu sau này cần `product/CONTRIBUTING.md` thì chỉ trỏ về hai file này, không chép lại.

---

## 1. Nguyên tắc nền (đọc trước)

1. **Server là nguồn sự thật** cho mọi tính toán tiền, tồn phòng, trạng thái, quyền (ADR-001). Client chỉ hiển thị kết quả server trả: xem trước giá/phí luôn gọi `POST …/quotes/calculate` hoặc endpoint `*-preview`/`dryRun`. `packages/contracts` **chỉ** chứa `money.ts` (làm tròn, định dạng), kiểu sinh từ OpenAPI và bảng chuyển trạng thái – **không chứa công thức giá** (BE-ARC-17).
2. **Không viết cứng con số nghiệp vụ.** Mọi giờ, hạn, tỷ lệ, phí đọc từ `config_parameter` (erd mục 9) qua `ParameterService.get(key, propertyId, asOfDate)`. Hằng số trong code chỉ được là hằng số kỹ thuật (timeout, kích thước trang). **[REVIEW]** – PR có số tiền/giờ/% nghiệp vụ trong code bị trả lại.
3. **Snapshot khi tạo** (BR-006): đơn, báo giá, HĐ chép tham số dùng để tính vào bản ghi; tính lại về sau đọc snapshot, không đọc tham số hiện hành.
4. **Một ngôn ngữ, một hợp đồng**: TypeScript strict cho mọi phần; kiểu dùng chung sinh từ `docs/api/openapi.yaml` (contract-first). Đổi API = sửa `openapi.yaml` trước, trong cùng PR, và báo MOB/FE/BE/INT (skill ARC "Không được làm").
5. **Bảo mật theo mặc định**: trường không được phép **không có trong JSON** (rbac 8.1); dữ liệu C3 chỉ qua endpoint riêng + `c3_access_log`; không có C2/C3 trong log, URL, thông báo đẩy, outbox, SSE.

## 2. Cấu trúc repo và ranh giới module

- Cấu trúc thư mục: `architecture.md` mục 17 (OPS đã dựng khung; `infra/docker-compose.yml` là vị trí thực tế của file compose dev).
- Backend `services/api/src/modules/<module>/` chia:
  - `public/` – service, DTO, event mà module khác được gọi;
  - `internal/` – repository, entity, logic riêng. **[LINT]** cấm import `modules/*/internal` từ module khác (`no-restricted-imports` + test kiến trúc).
- Tên module theo `architecture.md` mục 5.1 (`reservations`, `folio`, `registration`…). Không tạo module "utils" chung; tiện ích thật sự dùng chung đặt ở `src/shared/` (thời gian, tiền, lỗi, RLS context) hoặc `packages/*`.
- Frontend `apps/<app>/src/`: `routes/` (theo màn hình), `features/<feature>/` (component + hook + api của tính năng), `components/` (dùng chung trong app), `lib/`. Component UI dùng chung giữa app ở `packages/ui`; chuỗi ở `packages/i18n`.
- Adapter tích hợp ở `integrations/` theo README của INT; lõi chỉ gọi interface (ADR-011).

## 3. TypeScript

| Quy tắc | Chi tiết |
|---|---|
| Strict | `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` (tsconfig.base) **[LINT]** |
| `any` | Cấm (`@typescript-eslint/no-explicit-any: error`); dữ liệu chưa rõ dùng `unknown` + zod parse |
| Kiểu thương hiệu | Dùng branded type cho giá trị dễ nhầm: `Vnd`, `LocalDate`, `LocalTime`, `PropertyId`, `ReservationId`… (`packages/contracts/src/brands.ts`) |
| Enum | Dùng union string + mảng `as const`, không dùng `enum` của TS; giá trị đúng tên trong `erd.md` mục 5 |
| Null | `null` cho "không có giá trị" từ DB/API; `undefined` cho "không truyền". Không trộn |
| Lỗi | Ném lớp lỗi miền (`DomainError` có `code` thuộc bảng mã lỗi OpenAPI); không ném `string`; không nuốt lỗi (`catch {}` trống bị cấm **[LINT]**) |
| Async | Không có promise trôi nổi (`no-floating-promises` **[LINT]**) |
| Đặt tên | Biến/hàm `camelCase`; kiểu/lớp `PascalCase`; hằng `UPPER_SNAKE` chỉ cho hằng kỹ thuật; tệp `kebab-case.ts`; test `*.test.ts` cạnh tệp hoặc trong `test/` |
| Ngôn ngữ trong code | Tên định danh, commit, comment kỹ thuật bằng **tiếng Anh**; chuỗi hiển thị cho người dùng **không** nằm trong code mà ở `packages/i18n` (vi/en/ru) |

## 4. Tiền, số, làm tròn

1. Tiền là **số nguyên VND** (`bigint` ở DB, `number` an toàn ở TS – giá trị < 2^53; kiểm `Number.isSafeInteger` ở biên). **[LINT]** cấm `parseFloat`; **[REVIEW]** cấm phép chia tiền không qua hàm làm tròn.
2. Mọi làm tròn dùng `roundVnd(amount, unit)` trong `packages/contracts/src/money.ts` với đơn vị đọc từ tham số `rounding.*` (BR-005, "gần nhất"): **điểm giữa làm tròn lên theo trị tuyệt đối** (712.500 → 713.000; −712.500 → −713.000), có test cho số âm (BE-ARC-15). Không dùng `Math.round` trực tiếp cho tiền. Giá đêm niêm yết **đã làm tròn đã lưu** là cơ sở cho mọi phép tính tiếp theo (erd 4.1).
2a. `pg` trả `int8` dạng chuỗi: đăng ký `types.setTypeParser(20, parseSafeBigint)` (ném lỗi khi vượt 2^53); Drizzle `bigint({ mode: 'number' })`.
3. Tỷ lệ là số thập phân phần trăm (`15.5`); nhân tiền với tỷ lệ bằng `applyPct(vnd, pct)` – tính bằng số nguyên (×10 000) để tránh sai số dấu phẩy động.
4. Phân bổ (doanh thu dài hạn theo đêm – DATA Q-10; chia hoa hồng 50/50): dùng `allocate(total, parts)` – phần dư dồn vào phần tử cuối, tổng luôn bằng gốc. Có test thuộc tính (property-based) "tổng các phần = tổng".
5. Không sửa/xóa dòng tiền; sửa = bút toán đảo + dòng mới (BR-008). Repository của `folio_line`, `payment` **không có** hàm `update`/`delete` **[REVIEW]**.
6. Hiển thị: định dạng ở client bằng `Intl.NumberFormat('vi-VN')`; API luôn trả số nguyên.

## 5. Thời gian

1. **Chỉ lấy giờ qua `Clock`** được tiêm (ADR-008). **[LINT]** cấm `new Date()` không tham số và `Date.now()` trong `services/**`, `integrations/**` (đã có trong `eslint.config.js`).
2. Ba kiểu, không trộn: `Instant` (thời điểm, UTC trong DB, ISO có offset ở API), `LocalDate` (ngày lưu trú theo giờ cơ sở), `LocalTime` (giờ cấu hình `HH:mm`). Chuyển đổi chỉ qua `src/shared/time.ts` với `property.timezone`.
3. Khoảng lưu trú luôn `[from, to)` (BR-002). Hàm nhận khoảng đặt tên `fromDate`/`toDate`, không dùng `start/end` mơ hồ.
4. "Hôm nay" = `clock.todayAt(property.timezone)`, không phải ngày UTC. Test mốc giờ (23:00, 12:00, 06:00, 18:00) bằng `FixedClock` ở **cả hai phía** của mốc.
5. Job theo lịch tuân theo `architecture.md` mục 9.1 (đúng một lần, bắt kịp, đọc tham số khi chạy).

## 6. Cơ sở dữ liệu

| Chủ đề | Quy tắc |
|---|---|
| Đặt tên | Theo `erd.md` mục 1: bảng số ít `snake_case`, cột `*_at/*_date/*_vnd/*_pct`, enum `text + CHECK` |
| ORM | Drizzle cho CRUD; SQL tay (template có tham số) cho truy vấn báo cáo, rack, ràng buộc phức tạp. **Không** nối chuỗi SQL với dữ liệu người dùng **[LINT]** (`no-restricted-syntax` với template không gắn tag `sql`) |
| Migration | Theo `erd.md` mục 16: migration SQL trong `services/api/src/db/migrations/` là nguồn sự thật; `drizzle-kit generate` sinh nháp được sửa tay; đối tượng drizzle-kit không biết (EXCLUDE, RLS, REVOKE, trigger, FK DEFERRABLE, hàm SECURITY DEFINER, phân vùng) ở file `--custom`; **cấm `drizzle-kit push`** **[LINT]**; **chỉ tiến**; expand → migrate → contract cho thay đổi phá vỡ. Chạy bằng `MIGRATION_DATABASE_URL` (vai `ottimo_migrator`) như bước riêng trước khi bật api mới; CI kiểm schema.ts khớp migration **[LINT]** |
| Vai DB | api/worker/test dùng `DATABASE_URL` vai `ottimo_app` (không superuser, không BYPASSRLS). Khởi động kiểm `rolsuper/rolbypassrls = false` **[LINT – test kiến trúc]** |
| Ngữ cảnh RLS | Câu lệnh đầu tiên của **mọi** giao dịch: `SELECT set_config('app.organization_id',$1,true), set_config('app.property_id',$2,true), set_config('app.user_id',$3,true), set_config('app.actor_type',$4,true)`; mọi truy vấn (kể cả chỉ đọc) chạy trong giao dịch. Truy vấn trước khi có ngữ cảnh chỉ qua hàm SECURITY DEFINER ở erd 2.4 – không tự viết đường vòng **[REVIEW]** |
| Thời gian trong SQL | Cấm `now()`, `current_date`, `CURRENT_TIMESTAMP` trong SQL nghiệp vụ – truyền `$now` từ `Clock`; `DEFAULT now()` chỉ cho cột kỹ thuật **[LINT]** (tìm chuỗi trong `.sql` và template `sql\``) |
| RLS | Mọi bảng mới có `property_id`/`organization_id` phải có policy (erd mục 2) – test kiến trúc quét `pg_class` và **fail** nếu bảng thiếu RLS **[LINT]** |
| Giao dịch | Mọi use case ghi = 1 giao dịch: kiểm quyền → khóa/kiểm → ghi nghiệp vụ → `state_transition` + `audit_event` → outbox. Không gọi HTTP ra ngoài trong giao dịch (dùng outbox) **[REVIEW]** |
| Tồn phòng | Chỉ `OccupancyService` ghi `room_occupancy`; lỗi `23P01` → rollback rồi truy vấn dựng `conflicts[]` + `suggestions[]` → `ROOM_UNAVAILABLE`. Không kiểm trùng bằng SELECT-rồi-INSERT (ADR-009) **[REVIEW]** |
| Thứ tự khóa | Mọi luồng khóa theo thứ tự: `reservation … FOR UPDATE` → các dòng `room` theo `room_id` tăng dần → `folio`. Lệch thứ tự = lỗi review (deadlock) **[REVIEW]** |
| Job theo lịch | Theo mẫu handler đúng-một-lần ở `architecture.md` 9.1: `job_run` + nghiệp vụ + outbox trong **một** giao dịch của pool app; không dùng kết nối pg-boss cho nghiệp vụ; điều kiện thời gian so với `$now` từ `Clock` **[REVIEW]** |
| Mã chứng từ | Chỉ `DocNumberService.allocate()` (erd mục 10) trong cùng giao dịch; không tự format mã ở chỗ khác |
| Khóa lạc quan | Bảng có `version`; `UPDATE … WHERE id = $1 AND version = $2` – 0 dòng → `412 VERSION_CONFLICT` |
| Khóa ngoại | FK tới bảng cấp cơ sở luôn là cặp `(property_id, x_id)` (erd mục 1); `reservation.folio_id` DEFERRABLE INITIALLY DEFERRED |
| UUID | `uuid@^11` `v7()` sinh ở ứng dụng |
| Xóa | Không `DELETE` bảng nghiệp vụ; vai `ottimo_app` bị REVOKE trên bảng append-only (erd K8) |
| Chỉ mục | Mỗi truy vấn danh sách có chỉ mục khớp bộ lọc chính; PR thêm truy vấn mới kèm `EXPLAIN` khi bảng > 10k dòng dự kiến **[REVIEW]** |
| Seed | `db/seed` chỉ dữ liệu **giả** (10 căn BL 4.1, khách mẫu BL 3.21 đã đổi tên/số); không bao giờ seed dữ liệu khách thật |

## 7. API (theo `openapi.yaml`)

1. **Contract-first**: sửa `docs/api/openapi.yaml` → sinh kiểu `packages/contracts` (`openapi-typescript`) → cài đặt. CI chạy `redocly lint` + `openapi-spec-validator` + script kiểm mọi operation có `x-roles`, ví dụ UUID hợp lệ, không component thừa; so khớp route NestJS với spec (test "mọi operationId có handler, mọi handler có trong spec") **[LINT]**.
2. JSON `camelCase`; enum `snake_case`; tiền số nguyên; ngày `YYYY-MM-DD`; thời điểm ISO có offset; giờ `HH:mm`.
3. Lỗi: luôn `application/problem+json` với `code` trong bảng mã lỗi; validation trả `errors[]` theo trường. Không lộ stack, SQL, tên bảng.
4. Phân trang con trỏ (`cursor`, `limit` ≤ 100). Không dùng `offset` cho bảng lớn.
5. `Idempotency-Key` bắt buộc với POST tạo/chuyển trạng thái/thu tiền; `If-Match` bắt buộc với PATCH và action trên đơn/folio/khai báo (ADR-009). Middleware dùng chung, không tự cài lại ở từng controller. **Thứ tự kiểm**: xác thực → CSRF/Origin → thiết bị tin cậy → `Idempotency-Key` (đã hoàn tất → trả lại phản hồi cũ) → `If-Match` → quyền → nghiệp vụ. Khóa idempotency INSERT trong **cùng giao dịch** nghiệp vụ. Spec khai 2 header `required: false`; middleware trả `428` khi thiếu. `dryRun: true` không cần 2 header. Ngoại lệ: `addFolioLine` không cần `If-Match` (chỉ-thêm, khóa folio FOR UPDATE).
6. Đường dẫn hành động: `POST …/{id}/actions/<verb>`; không dùng PATCH `status` trực tiếp.
7. **Phân quyền 3 lớp** (rbac mục 8):
   - Guard hành động đọc `x-roles` (sinh từ spec) – test bảng: mỗi operation × mỗi vai → 2xx/403 đúng như spec **[LINT – test sinh tự động]**.
   - Phạm vi dữ liệu (`x-scope`: `own`, `today`…) lọc trong repository bằng điều kiện SQL, **không** lọc sau khi tải về.
   - Serializer theo vai: thuộc tính có `x-visible-to` bị **xóa khỏi object** (không đặt `null`). Test snapshot JSON cho từng vai ở các endpoint có trường nhạy cảm (US-003).
8. Bản ghi ngoài phạm vi/cơ sở khác → 404; vai không có quyền hành động → 403 + `audit_event access.denied`.
8a. **C3**: operation có `x-requires-trusted-device` → guard thiết bị (`403 DEVICE_NOT_TRUSTED`); `x-step-up` → cửa sổ xác nhận lại (`401 REAUTH_REQUIRED`); `x-guest-level` → guard mức phiên khách; sau trả phòng → `403 GUEST_STAY_ENDED`. Test sinh tự động từ spec cho từng extension **[LINT – test sinh tự động]**.
8b. **Endpoint kiểm thử** `/__test__/*` (`docs/api/openapi.test.yaml`): module chỉ import khi `APP_ENV ≠ production`; CI kiểm bundle production không chứa `__test__` **[LINT]**.
8c. Đổi vai/khóa/đặt lại hoặc đổi mật khẩu/tắt 2FA → thu hồi mọi phiên của người đó trong cùng giao dịch; cache quyền ≤ 60 giây theo `roles_version`.
9. Không đưa C2/C3 vào query string (tìm theo SĐT/email dùng `POST …/guests/lookup`).
10. Phiên bản: `/v1`; thêm trường tùy chọn là tương thích; đổi/xóa trường hoặc đổi nghĩa = phiên bản mới hoặc giai đoạn chuyển tiếp có cờ `deprecated` ≥ 1 round.

## 8. Dữ liệu nhạy cảm và bí mật

1. Mức C0–C3 theo SEC; cột C3 mã hóa bằng `CryptoService` (ADR-013) – không tự gọi `crypto` ở nơi khác **[REVIEW]**.
2. **Log**: dùng logger có cấu hình `redact` (pino) cho các khóa: `password`, `pin`, `secret`, `token`, `mfaToken`, `code`, `otp`, `docNumber`, `phone`, `email`, `address`, `visa*`, `passport*`, `authorization`, `cookie`, `qrPayload`, `keys`. Không log body request/response của endpoint C3 và endpoint xác minh khách. Log truy cập che `/g/*` (ADR-006) và query `/v1/webhooks/*`. IP ghi dạng HMAC (`LOG_IP_HMAC_KEY`), không SHA-256 trần.
3. Ô văn bản tự do (ghi chú, tin nhắn) chạy validator `noCardNumber()` (Luhn 13–19 chữ số) → `CARD_NUMBER_DETECTED` (R-PAY-07).
4. Bí mật chỉ qua biến môi trường; `.env.example` chỉ placeholder; gitleaks chạy trong CI **[LINT]**. Không commit `.env`, khóa, dump DB, ảnh giấy tờ (kể cả ảnh mẫu thật).
5. Upload (SR-FILE v0.2): chỉ JPEG/PNG/WebP theo magic bytes (không PDF/HEIC); ≤ 10 MB, ≤ 40 MP; server mã hóa lại bằng `sharp` (`limitInputPixels`), bỏ EXIF/GPS; không ghi tệp tạm dạng rõ; đổi tên ngẫu nhiên; không phục vụ trực tiếp từ thư mục tĩnh; client chuẩn hóa qua canvas trước khi tải.
7. Bí mật mật mã (KEK, `ID_HASH_KEY`) đọc từ tệp `*_FILE` một lần khi khởi động (ADR-013); production thiếu/yếu bí mật, `CLOCK_MODE≠system`, adapter tiền `mock`, hoặc vai DB có BYPASSRLS → dừng khởi động (SR-SECR-05).
6. Không bao giờ nhận/lưu số thẻ (R-PAY-01). Mọi PR chạm thanh toán cần SEC review.

## 9. Frontend (admin-web, mobile PWA, guest-web)

| Chủ đề | Quy tắc |
|---|---|
| Stack | React + Vite + TypeScript (ADR-004, 005); router theo app; TanStack Query cho dữ liệu server; react-hook-form + zod (schema từ `packages/contracts`) cho form |
| Trạng thái | Dữ liệu server chỉ ở TanStack Query cache, không chép vào store toàn cục. Store cục bộ (nếu cần) cho trạng thái UI |
| Quyền | Menu/nút dựa vào `Me.screens` và `allowedActions` của server; không tự suy luận quyền theo tên vai ở client |
| Cập nhật | Thao tác tiền/tồn phòng chờ server (không cập nhật lạc quan); thao tác buồng phòng được cập nhật lạc quan + hàng đợi offline |
| Offline (mobile) | Hàng đợi IndexedDB, mỗi mục có `Idempotency-Key` + `performedAt`; gửi lại theo thứ tự; 409 → đưa vào "Không áp dụng được" kèm lý do, không thử lại vô hạn; chỉ endpoint được đánh dấu offline trong ADR-005 |
| Chuỗi | Không chuỗi cứng trong JSX **[LINT]** (`i18next/no-literal-string` cho `apps/**`); khóa chuỗi theo `packages/i18n`; VI + EN bắt buộc, RU theo lộ trình |
| A11y | WCAG 2.2 AA (decision-log UXR): nhãn cho mọi điều khiển, trạng thái không chỉ bằng màu (US-016 AC2), điều hướng bàn phím; `eslint-plugin-jsx-a11y` **[LINT]**; Playwright + axe cho màn chính |
| Thiết kế | Chỉ dùng token từ `packages/ui` (sinh từ `design/tokens.json`); không mã màu/kích thước rời |
| Ngày giờ | Hiển thị theo `property.timezone` từ `Me`, không theo múi giờ máy |
| Hiệu năng | Ngân sách bundle (architecture 16) kiểm bằng `size-limit` trong CI từ R2 **[LINT]**; chia route lazy; ảnh nén trước khi upload |
| Bảo mật | Không lưu token/dữ liệu C2–C3 trong `localStorage`; cache PWA không chứa endpoint C3 (`no-store`); guest-web dùng `Referrer-Policy: no-referrer` |

## 10. Kiểm thử

| Tầng | Công cụ | Bắt buộc với |
|---|---|---|
| Unit | Vitest | Mọi hàm tính tiền/giờ (`packages/contracts`, `shared/time`, `money`), máy trạng thái (bảng chuyển + guard), serializer theo vai |
| Integration (API + Postgres thật) | Vitest + Postgres container (testcontainers hoặc service CI) | Mọi endpoint ghi; RLS 2 cơ sở; idempotency (gửi lại cùng key); `If-Match` lệch; quyền theo bảng vai |
| Đồng thời | Vitest + `Promise.all` trên DB thật | Đặt trùng (2 request cùng căn/đêm → đúng 1 thành công – US-018), mã chứng từ song song (US-023), duyệt FOC đồng thời |
| Hợp đồng | Kiểm spec + so khớp route; client mock từ OpenAPI | Mọi PR đổi API |
| E2E | Playwright | Luồng 2–7 của plan R1 (đặt → giữ chỗ → cọc → nhận → trả → buồng phòng), app khách |
| Tải | k6 (R3) | p95 theo architecture 16 |

Quy tắc:
1. Test mốc giờ dùng `MutableClock` (đặt/tua giờ; dùng chung api + worker qua `dev_clock`) và kiểm **trước/sau** mốc 1 phút; E2E dùng `POST /__test__/clock` + `POST /__test__/jobs/{jobKey}/run`. Mốc ngày nghiệp vụ 06:00 có test 05:59/06:00.
1a. Test bắt buộc thêm: RLS với kết nối tái sử dụng (ngữ cảnh rỗng → 0 dòng, không lỗi); vai test không superuser; K8 REVOKE; mỗi hàm SECURITY DEFINER chỉ trả cột cho phép; idempotency gửi lại sau khi đã thành công → phản hồi cũ chứ không `412`; đổi chéo căn; deadlock theo thứ tự khóa.
2. Ví dụ số trong `business-rules.md` (cột "Mặc định & ví dụ số") là test vàng: mỗi BR có ví dụ số → ít nhất 1 test unit dùng đúng số đó (ví dụ BL 5.2 → 56.339.000).
3. Dữ liệu test chỉ giả; fixture chung ở `tests/fixtures`.
4. Ngưỡng phủ: `packages/contracts` (tiền, giờ, máy trạng thái) ≥ 90% nhánh; module backend ≥ 70% dòng. Không chạy theo con số – thiếu test cho quy tắc tiền là lỗi review dù phủ cao.
5. Test không phụ thuộc thứ tự và giờ thật; test lỗi ngẫu nhiên (flaky) phải sửa hoặc cách ly trong 1 ngày.

## 11. Git, commit, PR

- Nhánh: `main` luôn deploy được; nhánh tính năng `feat/<US-xxx>-<mô-tả>`, sửa lỗi `fix/<BUG-xxx>-…`, tài liệu `docs/…`. Merge bằng squash sau khi CI xanh + review.
- Commit: **Conventional Commits** tiếng Anh – `feat(reservations): block overlapping holds (US-018)`; loại: `feat, fix, refactor, test, docs, chore, ci, perf, build`; phạm vi = tên module/app. Thay đổi phá vỡ ghi `BREAKING CHANGE:`.
- PR nhỏ (< 400 dòng thay đổi không tính tệp sinh); mô tả gồm: story/bug, thay đổi API (nếu có), migration (nếu có), cách test, ảnh chụp với thay đổi UI.
- Review bắt buộc theo protocol mục 5 (BE ← ARC + QA; FE/MOB ← UXD + QA; INT ← ARC + SEC; OPS ← ARC + SEC). PR chạm C3, thanh toán, quyền, RLS → thêm SEC.
- Checklist PR (copy vào mô tả):
  - [ ] Không con số nghiệp vụ viết cứng (đọc tham số)
  - [ ] Tiền số nguyên, làm tròn qua `roundVnd`
  - [ ] Giờ qua `Clock`, ngày theo `property.timezone`
  - [ ] Ghi trong 1 giao dịch; tồn phòng qua `OccupancyService`; gọi ngoài qua outbox
  - [ ] Quyền: guard hành động + phạm vi + serializer; test vai
  - [ ] Không C2/C3 trong log/URL/outbox/SSE
  - [ ] OpenAPI cập nhật (nếu đổi API) + báo vai liên quan
  - [ ] Migration chỉ tiến, có RLS cho bảng mới
  - [ ] Test: unit + integration; đồng thời nếu chạm tồn phòng/mã/tiền
  - [ ] Chuỗi hiển thị qua i18n (VI + EN)

## 12. Ngân sách hiệu năng và vận hành

- API p95: đọc < 300 ms, ghi đặt phòng/folio < 500 ms; rack 14 ngày < 200 ms; mở app < 2 s lần đầu trên 4G; chuyển màn < 300 ms (architecture 16). Vượt ngân sách = lỗi P2 trở lên.
- Mọi request có `requestId` (header `X-Request-Id`, trả về trong `Problem.requestId`) và log thời gian xử lý.
- Health: `GET /health` kiểm DB; worker có heartbeat ghi DB mỗi phút để OPS giám sát.
- Không thêm phụ thuộc (thư viện, dịch vụ) mới mà không có lý do trong PR; dịch vụ có phí định kỳ → ARC tạo ESC (skill ARC).

## 13. Definition of Done kỹ thuật (bổ sung DoD của protocol)

Một story chỉ "Xong" khi: AC đạt trên staging; test theo mục 10 có và xanh; OpenAPI khớp; không lỗi lint/type; review đủ vai; nhật ký tiền/C3 ghi đúng (với story liên quan); VI + EN đủ chuỗi; không vượt ngân sách hiệu năng; tài liệu (erd/openapi/architecture) cập nhật nếu thay đổi.

## 14. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 – Đợt 3 (Pha B) | Bản đầu | ARC |
| 16/10/2026 | 1 – Bước 4 | v0.2: contracts không chứa công thức giá; làm tròn điểm giữa/số âm; int8 parser; migration (erd 16), vai DB, ngữ cảnh RLS `set_config`, cấm `now()` trong SQL, thứ tự khóa, mẫu job; thứ tự kiểm idempotency/If-Match, 428 do middleware; extension C3/khách; `/__test__`; log redact + HMAC IP; upload SR-FILE v0.2; MutableClock | ARC |
