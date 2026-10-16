# FE – phản hồi thẻ Round 2 (Sprint 1, vòng sửa sau review)

- Ngày: 16/10/2026 | Phạm vi: `product/apps/admin-web/**`, `product/packages/{ui,i18n,api-client}/**` | OpenAPI 0.3.4-draft (ARC `outputs/ARC/s1-fix.md`)
- Kiểm: `pnpm test` toàn repo 12/12 task xanh (admin-web 70/70); `docker build -f infra/docker/Dockerfile.web .` (xem cuối file). `format:check`, `lint`, `build` toàn repo chỉ còn đỏ ở `services/api` (BE đang sửa song song, ngoài vùng FE) – phần FE xanh.

## UXD-on-FE

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-UXD-FE-01 | Done | Xóa `packages/i18n/src/pending.{vi,en}.json`; `translate.ts` chỉ đọc `design/copy/strings-*.json` (bỏ `pendingKeys`/`uxdKeys`, test tương ứng). Test đăng nhập lấy nhãn qua `translate('vi','auth.login.username')` (`test/render.tsx` `usernameLabel()`), không còn chữ cứng → đổi chữ không làm đỏ test. Test "mọi khóa t() có VI/EN" vẫn xanh khi bỏ pending |
| FB-R2-UXD-FE-02 | Done | `TodayPage` dùng `shell.coming_title` / `shell.coming_body {screen = today.title}`, icon đồng hồ, giữ nút "Mở sơ đồ phòng" theo quyền. `today.empty_*` chỉ dùng khi API trả rỗng (Sprint 3/4). Test `nav.test.tsx` kiểm không còn câu "không có việc" |
| FB-R2-UXD-FE-03 | Done | `paramLabel`: `meta.label` → `params.k.<khóa, . → _>` → `params.k.channel_commission_pct {channel}` cho `channel_commission_pct.<kênh>` → khóa kỹ thuật (cuối cùng). Dòng `<code>` khóa vẫn hiện dưới nhãn. Test đơn vị mới trong `params.test.tsx`. Giả định: `{channel}` = mã kênh thô (vd `agoda`) tới khi UXD có chuỗi tên kênh |
| FB-R2-UXD-FE-04 | Done | `problemView`: lỗi mạng → `common.error_network_body`; chỉ dùng chuỗi có `{request_id}` khi server trả `requestId` thật; 5xx không có mã (proxy 502 không JSON) và lỗi không phải ApiError → cũng `common.error_network_body` (không còn "—"). Test `__tests__/problem.test.ts`. Không truyền thêm `reference` vào `StateView` vì `error.server` đã có mã trong câu (tránh hiện 2 lần). Đề nghị UXD: nếu muốn câu riêng cho "máy chủ lỗi, không có mã" thì thêm khóa `error.server_no_ref` – FE đổi 1 dòng |
| FB-R2-UXD-FE-05 | Done | Banner 429 tính `minutes` từ `lockedUntil - now` ở mỗi tick 1 s → đếm ngược; hết khóa thì ẩn banner và mở nút |
| FB-R2-UXD-FE-06 | Done | Nút dùng `login.hide_password` khi đang hiện mật khẩu |
| FB-R2-UXD-FE-07 | Done | `RoomDrawer` (2 ô giá) và `ParamDialog` (hậu tố tham số tiền) dùng `common.vnd_unit`; `parseVnd` bỏ qua "VND" khi người dùng gõ |
| FB-R2-UXD-FE-08 | Done | `<nav aria-label={t('shell.main_nav')}>` |
| FB-R2-UXD-FE-09 | Done | `LoadingBlock` có `<span class="sr-only" role="status">common.loading</span>` |
| FB-R2-UXD-FE-10 | Done | Tự host qua `@fontsource/lora@5.2.8`, `@fontsource/be-vietnam-pro@5.2.8` (OFL-1.1, gói `@ottimo/ui`): Lora 500/600, Be Vietnam Pro 400/500/600, `font-display: swap`, chia `unicode-range` (latin/vietnamese/cyrillic… – trình duyệt chỉ tải phần cần). Nạp sau `hifi.css` để thay mặt chữ `local()`. File woff2/woff nằm trong `dist/assets` (không CDN ngoài – hợp CSP). Ghi decision-log `[chờ ARC duyệt phụ thuộc]` |
| FB-R2-UXD-FE-11 | Done | `ChangePasswordPage` khóa nút Lưu khi `!online` và hiện `Alert` `login.offline` |
| FB-R2-UXD-FE-12 | Done | Lỗi mở hồ sơ → `Alert tone="bad"` có Thử lại (mở lại đúng hồ sơ) + Đóng; tự xóa khi đổi ô tìm |
| FB-R2-UXD-FE-13 | Done | Bỏ `aria-selected` trên `<tr>`; dùng class `is-editing` (`app.css`: `.table tr.is-editing td { background: var(--oak-soft) }`). UXD có thể chuyển class này vào `hifi.css` v0.3.3 |
| FB-R2-UXD-FE-14 | Done | `main.tsx` bọc `startMockWorker()` trong try/catch; lỗi thì vẫn render App + thanh cảnh báo DEV (chỉ ở `pnpm dev`, không vào bản build) |
| FB-R2-UXD-FE-15 | Deferred | Gom style nội tuyến thành class khi UXD ra DS v0.3.3 (để dùng chung tên class) – Sprint 2. Thẻ mới thêm (`screen-root`, `is-editing`) đã theo hướng class |
| FB-R2-UXD-FE-16 | Done | Toast 6 s (8 s khi câu > 60 ký tự), dừng khi rê chuột/focus, có nút đóng (`common.close`) |

## SEC-on-FE

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-FE-01 | Done | Bản nháp form khách chuyển sang **bộ nhớ** (`app/clientData.ts`), không còn ghi `sessionStorage`. Giữ qua đóng dialog và qua hết phiên của **cùng** người dùng trong tab; mất khi tải lại trang, đăng xuất/"Đổi ca", hoặc người khác đăng nhập (`SessionProvider` so `me.id`). Test mới `guests.test.tsx`: điền tên + SĐT → Web Storage không chứa tên/SĐT/`ottimo.draft` → đăng xuất → đăng nhập lại → form trống. Sửa chú thích `storage.ts` |
| FB-R2-SEC-FE-02 | Done | `vite.config.ts`: `sourcemap: false` (chỉ `SOURCEMAP=1` mới sinh map `hidden`, không có `sourceMappingURL`). Đã kiểm `dist/` không có `.map`/`sourceMappingURL`. OPS có thể thêm bước CI grep |
| FB-R2-SEC-FE-03 | Done | `clearClientData()` duy nhất: xóa nháp trong bộ nhớ, mọi khóa `ottimo.*` của `sessionStorage`, Cache Storage; có `onClientDataClear()` để Sprint 3 đăng ký xóa cache truy vấn/clipboard C3. Gọi ở `logout` và khi người dùng khác đăng nhập. Nhánh `UNAUTHENTICATED` của cùng người dùng giữ nháp (đúng đề xuất SEC); tải lại trang thì bộ nhớ mất tự nhiên |
| FB-R2-SEC-FE-04 | Done | Plugin Vite `ottimo-drop-msw-worker` xóa `mockServiceWorker.js` khỏi `dist/` khi build (đã kiểm). Đề xuất OPS thêm `worker-src 'none'` vào CSP admin-web (ngoài vùng FE) |

## QA-on-FE

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-QA-FE-01 | Done | ORC đã mở `design/wireframes/assets/tokens.css`, `hifi.css`, `strings-*.json` trong `.dockerignore`. FE kiểm `docker build -f infra/docker/Dockerfile.web .` (kết quả cuối file) và thêm bước này vào checklist trước khi báo xong |
| FB-R2-QA-FE-02 | Done | = BUG-R2-009: nhãn lấy qua i18n; admin-web 70/70 |
| FB-R2-QA-FE-03 | Done | Mock theo hợp đồng 0.3.4: (a) SAL/CTV ngoài phạm vi → `{ matches: [], match: 'possible_duplicate' }` (không id); (b) 409 `DUPLICATE_GUEST` có `errors[{field}]`, `existingGuest*` chỉ khi trong phạm vi; (c) đổi mật khẩu sai → `401 REAUTH_FAILED` + `errors[{field: currentPassword}]`, thành công → CSRF mới + `version`+1 (giống cookie mới); `trustCurrentDevice` sai mật khẩu cùng dạng. Dialog dựa vào `match === 'possible_duplicate'` để hiện `field_error.possible_duplicate_other`; 409 không có id → cùng câu đó tại ô bị trùng. Test SAL hiện có giờ chạy đúng hình dạng thật. Test hợp đồng tự động (so ví dụ OpenAPI với mock) → Deferred Sprint 2 |
| FB-R2-QA-FE-04 | Done | = BUG-R2-010: `canOpen` (route guard) = `screens` ∩ `roles` của mục menu – cùng luật với menu; MGR mở `/settings/users` → `NoAccessPage` kể cả khi server có trả S26. Test mới `nav.test.tsx` |
| FB-R2-QA-FE-05 | Done | `data-screen="Sxx"` trên mục menu và trên khung trang của mỗi route (`.screen-root`, `display: contents`); ô đăng nhập có `name="username"` / `name="password"` |

## Lỗi QA

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| BUG-R2-009 | Fixed | Xem FB-R2-QA-FE-02 |
| BUG-R2-006 (phần FE) | Fixed | `packages/ui` vẫn import `tokens.css`/`hifi.css` từ `design/` (UXD là nguồn duy nhất); ORC đã mở 4 tệp trong `.dockerignore`. Ảnh web build xanh (cuối file) |
| BUG-R2-010 | Fixed | Xem FB-R2-QA-FE-04 |

## Áp OpenAPI 0.3.4 (ARC s1-fix Q1–Q8)
- Q1: `lookupGuestByContact` kiểu trả về lấy từ `ResponseOf<'lookupGuestByContact'>` (có `match`) – H06 cảnh báo nghi trùng cho SAL/CTV.
- Q3/Q4: `changeMyPassword` và `trustCurrentDevice` bỏ cờ `local` – bộ xử lý lỗi chung chỉ coi `code = UNAUTHENTICATED` là hết phiên; `REAUTH_FAILED` là lỗi ô "Mật khẩu hiện tại" (`ChangePasswordPage`, `DevicesPage` xét theo `code`, không theo 401). Đổi mật khẩu xong gọi lại `getMe` → `csrfToken` mới (đã có, giữ).
- Q5: 409 `DUPLICATE_GUEST` không id → lỗi tại ô `errors[].field`.
- Q6: H04 hiện cột "Bố trí giường" (`rooms.col_beds`) và ô sửa `bedSetup` (≤ 100) trong drawer. `bedCount`, `areaM2` chưa có trên hi-fi H04 → chưa hiện (chờ UXD).
- Q7: `GuestSummary.possibleDuplicate` → chip "Nghi trùng" (`crm.suspect_dup`) trong danh sách khách (chỉ FD+ nhận trường này).
- SĐT E.164 có `+`: form hiện nguyên giá trị server; `normalizePhone` đã nhận `+84…`.

## Kết quả lệnh (16/10/2026, máy FE)
| Lệnh | Kết quả |
|---|---|
| `docker build -f infra/docker/Dockerfile.web .` (context `product/`) | **exit 0** – ảnh build xanh (admin-web, mobile, guest-web) |
| `pnpm test` | 12/12 task xanh; admin-web 70/70, ui 7/7, i18n 3/3, api-client 5/5 |
| `pnpm --filter @ottimo/admin-web build` | xanh; `dist/` không có `.map`, `sourceMappingURL`, `mockServiceWorker.js` |
| `pnpm format:check` | đỏ 6 tệp **chỉ ở `services/api`** (BE đang sửa); vùng FE sạch |
| `pnpm lint` | eslint 0 lỗi (1 cảnh báo cũ ở `public/mockServiceWorker.js` – tệp sinh của MSW); typecheck đỏ **chỉ `@ottimo/api`** (`session-policy.interceptor.ts:63`, BE) |
| `pnpm build` | đỏ **chỉ `@ottimo/api#build`** (cùng lỗi BE); 5/6 task khác xanh |
