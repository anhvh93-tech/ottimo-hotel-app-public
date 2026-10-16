# MOB – Báo cáo Sprint 3 (Round 2): guest-web check-in online mức 1

- Người viết: MOB | Ngày: 16/10/2026 | Bước: Sản xuất (Sprint 3)
- Đầu vào: hi-fi H18 (`product/design/hifi/18-guest-checkin.html`), `specs/EP06-registration.md` v0.2 mục 8, `specs/EP14-guest-app.md` (phần R2), OpenAPI 0.3.6-draft (tag `guest-portal`), SEC ĐK-1…6 (`outputs/SEC/s1-decisions.md`, EP06 8.1), `outputs/SEC/s3-checklist.md` mục G + E14-08.
- BE-C đang code guest-portal song song → guest-web chạy trên **MSW mock theo contract** (mặc định ở `pnpm dev`), cờ `VITE_API_MODE=server` (`pnpm dev:server`) để nối API thật.

## 1. Đã làm gì

### 1.1 Bảng màn / trạng thái

| Màn (H18) | Trạng thái | Tải | Rỗng | Lỗi | Mất mạng | Ghi chú |
|---|---|---|---|---|---|---|
| 18.1 Lưu trú (mức 1) | **Xong** | Khung xương | – | `guest.error_*` + Thử lại | Banner `guest.offline_banner` | Chào bằng `guestFirstName`; ngày/giờ chuẩn; Wi-Fi theo khung (null → `gw.wifi_later`); thẻ "Mã cửa: lễ tân giao" + gọi người trực; Chỉ đường (danh sách host SEC E14-08, `noopener noreferrer`) |
| Tab Thông tin | **Xong** | – | – | – | Banner | Địa chỉ, chỉ đường, gọi, nội quy + phí (văn bản thuần, theo ngôn ngữ phiên) |
| Tab Yêu cầu | **Chưa** (Sprint 4 – US-109) | | | | | Thanh điều hướng S3 có 2 mục; không có tab Hóa đơn (ĐK-6) |
| 18.2 Bước 0 Thông báo dữ liệu | **Xong** | Khung xương | – | Alert | Banner | "Tôi đã đọc" → `updateOnlineCheckin{noticeVersion}` |
| 18.2 Bước 1 Giấy tờ | **Xong** | "Đang gửi ảnh n/n – x%" | `gw.docs_none` | `field.FILE_TYPE/FILE_TOO_LARGE/TOO_MANY_FILES`, `error.*` | `gw.offline_upload`, nút Chụp khóa | Mỗi khách: chọn CCCD/Hộ chiếu → Chụp (1–4 ảnh) → chuẩn hóa → gửi ngay; đã gửi chỉ hiện "Đã gửi – ảnh không hiện lại" + Gửi lại; mạng yếu: tự thử lại 1 lần rồi nút "Gửi lại ảnh" |
| 18.3 Bước 2 Giờ đến | **Xong** | – | – | Lỗi ô ghi chú (số thẻ – chặn ngay trên máy và theo 422) | Banner | 4 lựa chọn theo hi-fi; ghi chú ≤ 300, chỉ ghi |
| 18.3 Bước 3 Xác nhận | **Xong** | Nút bận | – | Alert; 409 thiếu bước → nhảy về bước đó | Banner | Hai lựa chọn ngang hàng, không chọn sẵn; nút Gửi khóa tới khi chọn; câu người đi cùng + rút đồng ý qua lễ tân (ĐK-5) |
| 18.3 Hoàn tất | **Xong** | – | – | – | – | `guest.oci.done_body` bản R2 (không hứa mã cửa) |
| 18.5 Đã đóng | **Xong** | | | | | `onlineCheckinAvailable=false` hiện ngay khi mở, không đợi lỗi; 409 `ONLINE_CHECKIN_CLOSED` giữa chừng cũng về đây |
| 18.5 Đã trả phòng | **Xong** | | | | | 403 `GUEST_STAY_ENDED` → "Cảm ơn bạn đã lưu trú" + `gw.ended_body` (không câu bill) |
| 18.5 Quá nhiều lần | **Xong** | | | | | 429 → `error.RATE_LIMITED` với số phút từ `Retry-After` |
| Link hết hạn / sai | **Xong** | | | | | 401 → `guest.link_expired_title` + `error.GUEST_LINK_INVALID`; token sai dạng → không gọi API |
| Ngôn ngữ VI / EN / RU | **Xong** | | | | | Chọn ở đầu trang → `setGuestLocale` + tải lại thông tin (nội quy theo phiên); RU hiện `guest.lang.ru_soon`, thiếu key → EN |
| PWA nhân viên (`apps/mobile`) | Không thuộc S3 | | | | | Sprint 4 theo plan |

Đã chạy thử trên trình duyệt 375×812 (mock): Lưu trú → Thông báo → Giấy tờ (0/2, 2/2) → Giờ đến (EN) → Xác nhận (RU) → Hoàn tất – bố cục khớp H18.

### 1.2 Bảo mật – đối chiếu s3-checklist mục G (phần guest-web)

| # | Cách đáp ứng ở guest-web | Kiểm bằng |
|---|---|---|
| G1 ĐK-1 | Chỉ 8 operation mức 1; không có code/chuỗi/route OTP, verify, folio, withdraw, guest-verification-code; bỏ qua `verification` của phiên | `guard.test.ts` quét `src` + `dist`; mock có "bẫy" ghi lại nếu bị gọi |
| G2 ĐK-2 | Lọc trắng phía client: `GuestStay` bỏ `guestFullName`/`doorCode`/`doorCodeAvailableFrom`; `OnlineCheckin` chỉ 9 khóa; `arrivalNote` chỉ ghi, ô luôn trống khi mở lại | `units.test.ts`; `states.test.tsx` (server lỡ trả mã cửa → DOM không có) |
| G3 ĐK-3 | Không dùng `localStorage`/`sessionStorage`/IndexedDB/Cache/service worker (kể cả ngôn ngữ); ảnh chỉ trong bộ nhớ, không xem trước, không object URL (đường chính), object URL của đường dự phòng `<img>` thu hồi ngay sau decode; rời bước → xóa ảnh chờ; build xóa `mockServiceWorker.js` | `guard.test.ts`; `flow.test.tsx` kiểm storage rỗng sau luồng, không `<img>` |
| G4 ĐK-4 | `/g/{token}` đọc ở `main.tsx`, `history.replaceState('/')` trước khi render/gọi API; token chỉ trong body `POST /v1/guest/sessions`; `<meta name="referrer" content="no-referrer">`; phiên tự đóng khi qua `expiresAt`; token sai dạng không gọi server (giảm dò link) | `flow.test.tsx` (`location.href` không còn token), `states.test.tsx` |
| G5 | Không script/font/analytics bên thứ ba (font tự host qua `@ottimo/ui`); header CSP/Origin là việc OPS/BE | – |
| G6 | Canvas → JPEG 0,85 (hạ 0,75/0,6 nếu > 10 MB), cạnh dài ≤ 2.500 px, áp hướng EXIF rồi bỏ toàn bộ metadata; từ chối PDF/khác ảnh trước khi gửi | `image.test.ts` |
| G7 ĐK-5 | Chỉ Khách 1, `channel=guest_app`, `personIndex=1`, `noticeVersion`, `locale` = ngôn ngữ thực hiện câu đồng ý; hai nút ngang hàng không chọn sẵn; câu `guest.oci.withdraw_hint` | `flow.test.tsx` |
| G8 ĐK-6 | Không dùng chuỗi cấm; **bundle không chứa** các khóa đó (lọc lúc build) | `guard.test.ts` quét `dist` |
| G9 | Ghi gộp: mỗi bước 1 lần ghi; `Idempotency-Key` cho upload + complete (giữ khi bấm lại) | Mock trả 429 → trang 18.5 |

## 2. File tạo / sửa

Tạo (tất cả trong `product/apps/guest-web/`):
- `README.md`, `public/mockServiceWorker.js` (sinh bởi msw, chỉ dev), `src/styles.css`, `src/vite-env.d.ts`
- `src/app/`: `api.ts`, `config.ts`, `i18n.tsx`, `image.ts`, `link.ts`, `problem.ts`, `useOnline.ts`, `validation.ts`
- `src/pages/`: `GuestShell.tsx`, `HomePage.tsx`, `InfoPage.tsx`, `TerminalPage.tsx`, `WifiBlock.tsx`
- `src/checkin/`: `CheckinFlow.tsx`, `DocumentsStep.tsx`, `eta.ts`
- `src/mocks/`: `handlers.ts`, `browser.ts`, `node.ts`; `src/test/setup.ts`
- `src/__tests__/`: `helpers.tsx`, `flow.test.tsx`, `states.test.tsx`, `units.test.ts`, `image.test.ts`, `guard.test.ts`

Sửa:
- `product/apps/guest-web/package.json` (thêm `@ottimo/api-client|i18n|ui`, msw, testing-library, jsdom; script `dev:server`), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/App.tsx`, `src/main.tsx`; xóa `src/App.test.tsx` (khung R1)
- `product/pnpm-lock.yaml` (pnpm install – chỉ phần importer guest-web)
- `product/.dockerignore` – thêm `!design/copy/strings-ru.json` (**ngoài vùng MOB**, 1 dòng; thiếu thì `docker build` web đỏ vì guest-web nhập chuỗi RU) → nhờ OPS xác nhận
- `01-decisions/decision-log.md` – 1 dòng quyết định cài đặt của MOB

Không sửa `packages/api-client` (đã chạy `gen`: "openapi.ts up to date"), `packages/ui`, `packages/i18n`.

## 3. Kết quả lệnh (16/10, trên máy dev, từ `product/`)

| Lệnh | Kết quả | Phần MOB |
|---|---|---|
| `pnpm --filter @ottimo/api-client gen` | `openapi.ts up to date` (0.3.6) | – |
| `pnpm format:check` | Đỏ – 6 tệp của người khác (`admin-web/src/components/states.tsx`, `ReservationDialogs.tsx`, `services/api/...` 4 tệp) | **Xanh** (`prettier --check apps/guest-web`) |
| `pnpm lint` (eslint + typecheck) | eslint đỏ do tệp sinh `tests/e2e/playwright-report/trace/*.js` (QA – chưa có trong ignore); `turbo run typecheck` **12/12 xanh** | **Xanh** (eslint guest-web 0 lỗi, 1 cảnh báo của tệp sinh `mockServiceWorker.js` – giống admin-web) |
| `pnpm test` | 10/12 task xanh; `@ottimo/api` đỏ 2 ca trong `test/be-b-s2-units.test.ts` (BE-B: folio totals, quote copy stale) | **Xanh** – guest-web 5 tệp / **35 ca** |
| `turbo run test --filter=@ottimo/admin-web` | 108/108 | – |
| `pnpm build` | **6/6 xanh** | guest-web JS 229 kB (gzip 75 kB) – đã lọc chuỗi (trước 451 kB) |
| `docker build -f infra/docker/Dockerfile.web .` | **Xanh** (sau sửa `.dockerignore`); `/srv/guest-web` chỉ có `index.html` + `assets` (không có mock worker) | Đã xóa image thử |

## 4. Giả định

- `[GIẢ ĐỊNH MOB – chờ ARC]` Phiên bản thông báo hiện hành `privacy-2026-10-v1` là hằng số khớp chuỗi `gw.notice_body` (contract chưa có cách đọc phiên bản hiện hành; lệch → 422 `NOT_IN_LIST` → hiện lỗi chung).
- `[GIẢ ĐỊNH MOB – chờ ARC]` Số ngày lưu ảnh trong câu đồng ý = 30 (mặc định BR-610 `id_image_retention_days_after_checkout`), API khách chưa trả tham số này. OWN đổi tham số thì câu trên app khách sai → cần ARC thêm trường.
- `[GIẢ ĐỊNH MOB]` Giờ đến theo hi-fi H18 cập nhật (khung 2 giờ từ giờ nhận phòng chuẩn tới 22:00 + "Sau 22:00") thay cho "khung 30 phút 06:00–23:30" của EP06 8.3; `etaTime` = **đầu khung**; "Sau 22:00" → `22:00` + `lateArrival=true`.
- `[GIẢ ĐỊNH MOB]` Loại giấy tờ trên app khách chỉ CCCD / Hộ chiếu (trẻ em không cần ảnh – lễ tân nhập); `requiredPeople` do server tính đã trừ người không cần ảnh.
- ~~Chưa có UI "Bổ sung tại quầy"~~ → đã làm ở đợt 2 (mục 8).
- `[GIẢ ĐỊNH MOB]` Tải lại trang (cookie còn, token đã xóa khỏi URL): không có endpoint đọc lại `GuestSession` → tiêu đề hiện mã đặt phòng thay cho "Xin chào, {tên}", ngôn ngữ theo trình duyệt.
- `[GIẢ ĐỊNH MOB]` Ngôn ngữ mặc định khi mở link = `GuestSession.locale` (server lấy từ hồ sơ khách); khi không có phiên mới → theo trình duyệt (`en*` → EN, `ru*` → RU, còn lại VI).
- Khách đã chọn Có/Không trước đó (`consentRecorded=true`) mở lại link: được gửi mà không phải chọn lại; chọn lại thì ghi bản ghi mới.

## 5. Yêu cầu cho vai khác (đề nghị thẻ review chéo – không chặn)

| Tới | Việc | Mức đề xuất |
|---|---|---|
| ARC (+SEC theo ĐK-2) | Thêm vào `OnlineCheckin` (mức 1): `currentNoticeVersion` và `imageRetentionDays` – để app không phải đoán phiên bản thông báo và số ngày lưu ảnh | Major (sai số ngày trong câu đồng ý = sai bằng chứng đồng ý) |
| ARC | `GET /v1/guest/sessions/current` (trả `GuestSession` theo cookie) hoặc cho `guestFirstName` vào `GuestStay` mức 1 – để tải lại trang vẫn chào đúng tên và đúng ngôn ngữ phiên | Minor |
| UXD (**xong ở đợt 2 – mục 8**) | Chuỗi mới: nhãn thanh điều hướng (`gw.nav_label`), nhãn danh sách bước (`gw.steps_label`), "Bổ sung tại quầy" cho người chưa có ảnh (`gw.defer_at_desk` + câu giải thích), nhãn "Loại giấy tờ" riêng cho khách (đang dùng `checkin.docs.field.doc_type` của Desk), trạng thái trang Lưu trú sau khi đã hoàn tất check-in (đang vẫn hiện nút "Làm thủ tục trước" → mở ra màn Xong) | Minor |
| UXD (**đã duyệt, sửa 5 điểm – mục 8**) | H18 không vẽ chọn loại giấy tờ; MOB thêm Seg CCCD/Hộ chiếu cạnh nút Chụp – UXD duyệt | Minor |
| OPS | Xác nhận dòng `.dockerignore` (strings-ru); Caddy guest-web: CSP theo G5 (`img-src 'self' blob: data:`, `connect-src 'self'`), `Referrer-Policy: no-referrer`, không cache `index.html`; thêm `tests/e2e/playwright-report/` vào ignore của eslint (đang làm `pnpm lint` đỏ) | Major (lint đỏ toàn repo) |
| BE-C | Mock bám contract 0.3.6: `uploadGuestDocument` nhận `image` lặp nhiều phần, `Idempotency-Key` bắt buộc, 409 `INVALID_TRANSITION` có `currentState` (client dùng để nhảy về bước thiếu), 413 không phải JSON được client hiểu là `PAYLOAD_TOO_LARGE` | Thông tin |
| FE | Không yêu cầu đổi `@ottimo/i18n`: guest-web tự nạp `strings-ru.json` trực tiếp (cùng nguồn UXD, không chép) | – |

## 6. Rủi ro / vướng mắc

- **Chưa thử trên máy thật** (iPhone Safari, Android Chrome) – SEC G6 yêu cầu; jsdom không có canvas nên chuẩn hóa ảnh chỉ được unit test với canvas giả. Cần QA/MOB thử trên staging (HEIC từ iPhone, ảnh 48 MP, xoay EXIF).
- Chỉ chạy với MSW; khi BE-C xong cần chạy lại luồng bằng `dev:server` + E2E QA. Trình duyệt nhúng không đăng ký được service worker MSW (giống admin-web) – mở dev bằng Chrome/Safari.
- Trang không có giới hạn thời gian "nhàn rỗi" phía client ngoài `expiresAt` của phiên; phiên ngắn do server quyết (SR-GST-05/09).

## 7. Việc chưa xong

- Tab Yêu cầu (US-109/110) và trang công khai của căn `/u/{unitSlug}` (QR trong phòng) – Sprint 4.
- PWA nhân viên `apps/mobile` – Sprint 4.
- Thử trên thiết bị thật; axe a11y tự động cho guest-web (chờ khung E2E QA thêm project guest-web).

## ESC mới
Không có.

## 8. Đợt 2 (17/10) – áp chuỗi UXD đợt 2 + 5 điểm Minor UXD 8.3

Đầu vào: `outputs/UXD/s3-report.md` mục 8, H18 cập nhật (18.2 biến thể, 18.5 thẻ "Đã làm thủ tục trước"), hifi.css mục 15.

| # | Việc | Đã làm |
|---|---|---|
| 1 | Chuỗi khách thay chuỗi Desk | `gw.doc.cccd` / `gw.doc.passport` / `gw.doc_type`. Bỏ hẳn `ci.doc.*`, `checkin.docs.field.doc_type` khỏi mã và khỏi bộ lọc chuỗi khi build |
| 2 | Nhãn "Loại giấy tờ" nhìn thấy được | Nhãn đặt cạnh Seg trong hàng `.gw-docs-row`; nhóm được đặt tên bằng `aria-labelledby` = "Khách n" + nhãn |
| 3 | Chưa chọn loại → lý do khóa nút | Nút Chụp dùng `aria-disabled` (vẫn focus được, bấm không làm gì). Câu `gw.doc_type_first` gắn bằng `aria-describedby`; chọn loại xong thì câu mô tả đổi sang gợi ý chụp |
| 4 | Thứ tự và chọn sẵn | `vi` → CCCD trước; ngôn ngữ khác → Hộ chiếu trước. Khách 1 không chọn sẵn; khách 2…n lấy loại của khách gần nhất phía trên đã chọn, vẫn đổi được |
| 5 | Gợi ý chụp đổi theo loại | `gw.doc_hint.{cccd,passport}`; khi chưa chọn loại thì dùng `guest.oci.add_doc` |
| – | "Bổ sung tại quầy" | Nút phụ `gw.defer_at_desk` + câu `gw.defer_help` cho người chưa có ảnh. Người đã chọn thì hiện thẻ đồng hồ `gw.deferred` + nút `gw.defer_undo`. Câu tổng `gw.docs_have_deferred`. Đủ (có ảnh **hoặc** bổ sung tại quầy) thì được Tiếp tục. `deferredPeople` (bỏ người đã có ảnh) gửi kèm `completeOnlineCheckin`. Màn Xong có `gw.oci_done_card_deferred`. Tải ảnh cho người đã đánh dấu thì tự bỏ đánh dấu |
| – | Thẻ "Đã làm thủ tục trước" | Trang Lưu trú đọc `getOnlineCheckin` ở nền (lỗi thì giữ thẻ CTA). Khi `completedAt` / `currentStep=done`: hiện `gw.oci_done_card_title` / `_body {n,m,eta}` / `_deferred {k}` + nút `gw.oci_done_card_view` mở màn Xong. Thẻ cập nhật ngay khi luồng hoàn tất (CheckinFlow báo `onCheckinChange`) |
| – | Lỗi máy chủ | `gw.error_server {request_id}` thay `error.INTERNAL_ERROR` |
| – | Nhãn a11y | `nav` → `gw.nav_label`; `ol.progress-steps` → `gw.steps_label` |
| – | CSS | Dùng `.upload-slot.gw-slot` / `.gw-docs-row` của hifi.css mục 15; bỏ các quy tắc trùng trong `src/styles.css` |

Mock: `completeOnlineCheckin` nhận `deferredPeople` (số nguyên 1…`requiredPeople`, không trùng; bỏ chỉ số đã có ảnh) như ĐK-2.

**Giả định mới** `[GIẢ ĐỊNH MOB – UXD/SEC xác nhận]`: trên trang RU, 7 chuỗi pháp lý vẫn hiện **bản EN đã duyệt** cho tới khi bản RU được người dịch duyệt. 7 chuỗi gồm `gw.notice_body`, `guest.oci.why`, `guest.oci.consent_q`, `guest.oci.consent`, `guest.oci.consent_no`, `guest.oci.consent_optional`, `guest.oci.withdraw_hint`. Lý do: content-guide HR-01 và EP06 8.5 (không dịch máy); RU_EXTRA đang ghi "cần người bản ngữ duyệt". Bằng chứng đồng ý ghi `locale=en` cho các trang này. Danh sách là một hằng `RU_UNREVIEWED_LEGAL` trong `src/app/i18n.tsx`, bỏ khóa khỏi đó là xong.

**Giả định khác**:
- Ô "dự kiến đến {eta}" của thẻ: khi khách chọn "Sau 22:00" thì hiện `22:00+`.
- Lựa chọn "Bổ sung tại quầy" chỉ nằm trong bộ nhớ trang tới khi gửi, vì contract chỉ nhận `deferredPeople` ở `completeOnlineCheckin`. Mở lại link trước khi gửi thì phải chọn lại → có thể đề nghị ARC cho `updateOnlineCheckin` nhận `deferredPeople` (Minor).

**Kết quả lệnh đợt 2** (guest-web):
- prettier xanh; eslint 0 lỗi; typecheck xanh.
- Vitest **39/39**, gồm 4 ca mới: bộ chọn loại giấy tờ, thứ tự theo ngôn ngữ, bổ sung tại quầy + thẻ hoàn tất, `gw.error_server`.
- build xanh: JS 246 kB, gzip 80 kB (tăng do chuỗi RU mới).
- `docker build -f infra/docker/Dockerfile.web .` xanh.
- Đã xem lại ở 375×812: bước Giấy tờ (chưa chọn loại / đã chọn CCCD, khách 2 theo khách 1) và thẻ "Đã làm thủ tục trước" (1/2 + 1 bổ sung tại quầy).

**File sửa đợt 2**:
- `apps/guest-web/src/checkin/{DocumentsStep.tsx,CheckinFlow.tsx}`
- `src/pages/{GuestShell.tsx,HomePage.tsx}`
- `src/app/{i18n.tsx,problem.ts}`
- `src/styles.css`, `vite.config.ts`, `src/mocks/handlers.ts`
- `src/__tests__/{flow.test.tsx,units.test.ts}`
