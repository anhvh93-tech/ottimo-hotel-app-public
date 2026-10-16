# MOB – phản hồi thẻ Round 2 · Sprint 3 (bước Phản hồi & sửa)

- Ngày: 17/10/2026 | Vùng: `product/apps/guest-web/**` | Hợp đồng: OpenAPI **0.3.6-draft + bổ sung 17/10** (`OnlineCheckin.currentNoticeVersion`, `imageRetentionDays`, `ConsentInput.retentionDays`). Đã chạy `pnpm --filter @ottimo/api-client gen` → "openapi.ts up to date" (ARC đã sinh lại; không sửa api-client bằng tay).
- Đầu vào: `reviews/s3-UXD.md` (MOB-S3-01…08), `reviews/s3-SEC.md` (MOB-01, MOB-02 + quyết định (a)(b)), decision-log 17/10 (ORC chốt RU; SEC ĐK-2; ARC 0.3.6 bổ sung; ARC dời 0.3.7).
- Không commit.

## Kết quả lệnh (thư mục `product/`)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/guest-web test` | **6 tệp / 50 ca xanh**. Tệp mới `bundle.test.ts` tự build bundle và quét bundle mỗi lần chạy (MOB-01). Ca mới gồm: khối pháp lý RU, fail closed (3 trường hợp), gửi lại khi máy chủ bận, hủy "Gửi lại", thẻ đến khuya, tiến trình, nút khóa có lý do, trang 429 / đã trả phòng |
| `pnpm --filter @ottimo/guest-web build` | Xanh – JS **214 kB** (gzip 70 kB), trước là 246 kB, nhờ chỉ đóng gói khóa có dùng |
| `pnpm --filter @ottimo/guest-web typecheck` · `eslint apps/guest-web` · `prettier --check apps/guest-web` | Xanh. eslint 0 lỗi; còn 1 cảnh báo cũ ở tệp sinh `mockServiceWorker.js` |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0**. `/srv/guest-web` chỉ có `index.html` và `assets` |
| `turbo run typecheck` (toàn repo) | Đỏ chỉ ở `@ottimo/api` (`registration.service.ts:524,659` – BE đang sửa song song). Phần MOB xanh |

Đã xem lại ở 375×812: trang RU (bước Thông báo có câu RU + khối EN + nút EN; bước Giấy tờ có lý do cạnh nút "Далее").

## UXD (`reviews/s3-UXD.md`)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R2-UXD-MOB-S3-01 (Major) | **Done** | Thực hiện đúng quyết định ORC/SEC/UXD 17/10. **Danh sách khóa:** 7 chuỗi pháp lý + `gw.notice_read` nằm trong `RU_UNREVIEWED_LEGAL` (`src/app/i18n.tsx`); chỉ gỡ khi UXD + SEC ký bản RU và tăng phiên bản thông báo. **Khối `LegalBlock`** (`CheckinFlow.tsx`): trên trang RU, câu `gw.legal_en_notice` (RU, nằm ngoài khối) đứng ngay trên `<div lang="en">`. Bước Thông báo: khối chứa `guest.oci.why` + `gw.notice_body`, nút "I've read this" có `lang="en"`. Bước Xác nhận: khối chứa câu hỏi + 2 lựa chọn + `consent_optional` + `withdraw_hint`; câu `companions_at_desk` để ngoài khối, giữ tiếng Nga. **Banner:** bỏ hẳn banner "Русская версия скоро" ở mọi màn. **Bằng chứng:** đồng ý ghi `locale = shownLocale(…) = en`, `noticeVersion` không đổi. **Test:** `flow.test` "RU page…" kiểm `lang="en"`, vị trí câu báo, `locale: 'en'`, `retentionDays: 30` |
| S3-02 | **Done** | Gửi ảnh gặp `CONCURRENT_UPDATE` / `SERVICE_UNAVAILABLE`: giữ ảnh trong bộ nhớ, hiện `error.*` tương ứng, chờ `Retry-After` (thiếu thì 2 giây, trần 10 giây), tự gửi lại một lần với cùng `Idempotency-Key`, sau đó mới hiện nút "Gửi lại ảnh". Lỗi mạng xử lý như trước (3 giây). Test với mock 503 + `Retry-After: 1` |
| S3-03 | **Done** | Khi `lateArrival` → dùng `gw.oci_done_card_body_late {n, m, time = etaTime ?? '22:00'}`; bỏ ký hiệu "+". Có test |
| S3-04 | **Done** | Màn hình hiện `gw.upload_progress {count, pct}`, vùng này không `aria-live`. Một vùng `aria-live` riêng chỉ đọc lúc bắt đầu gửi và `gw.upload_done {person}` lúc xong. Bỏ `guest.oci.uploading` |
| S3-05 | **Done** | "Tiếp tục" (Giấy tờ, Giờ đến) và "Gửi thủ tục" chuyển sang `aria-disabled` + `aria-describedby` tới câu lý do (`gw.next_needs_docs` / `gw.eta_first` / `gw.consent_first`) đặt cạnh nút. Bấm khi đang khóa thì cuộn tới và focus: tên khách đầu tiên còn thiếu / lựa chọn giờ đến đầu tiên / lựa chọn "Có". Test kiểm mô tả + focus ở bước Giấy tờ, khóa + lý do ở bước Xác nhận |
| S3-06 | **Done** | Ô ngôn ngữ cỡ chữ `1rem`. **0 style nội tuyến** trong `src/`: dùng lớp DS (`.m-0`, `.mt-4/8/12`, `.mb-12`, `.mono`), lớp `.gw-*` trong `styles.css`, và `.gw-stack` cho khoảng cách giữa các skeleton. Nút Quay lại dùng `<Icon name="chevron" />` xoay 180° |
| S3-07 | **Done** | Trang 429 dùng `StateView` (icon đồng hồ, tiêu đề `error.RATE_LIMITED`) + nút `guest.contact.call`. Trang đã trả phòng và trang "đã đóng" cũng có nút gọi. SĐT lấy từ cơ sở nếu đã biết, không thì `fallbackDeskPhone()`. Có test |
| S3-08 (Suggestion) | **Done** | Khi đang mở lại ô chụp của người đã gửi, nút phụ "Hủy" (`common.cancel`) đưa về trạng thái "Đã gửi", ảnh cũ trên server không bị đụng tới. Có test |

## SEC (`reviews/s3-SEC.md`)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R2-SEC-MOB-01 (Major) | **Done** | **(1)** Tệp mới `src/__tests__/bundle.test.ts` (môi trường node). Mỗi lần `pnpm test` (cả trong CI), test tự build guest-web bằng chính `vite.config.ts` (chế độ production, `NODE_ENV=production`) vào thư mục tạm rồi quét: không khóa ĐK-6, không đường dẫn OTP / verify / folio / withdraw / guest-verification-code, không dữ liệu mock, không đăng ký service worker, không `mockServiceWorker.js`. Không còn `skipIf`, nên không phụ thuộc thứ tự CI hay turbo. Lúc viết, test đã bắt được một lỗi thật: build dưới `NODE_ENV=test` đóng gói cả MSW mock vào bundle; `pnpm build` thật không bị lỗi này. **(2)** Lọc chuỗi theo **khóa thực sự dùng**: `build/used-keys.ts` thu khóa từ literal trong mã nguồn; khóa ghép bằng template chỉ còn 2 tiền tố hẹp `gw.doc.` và `gw.doc_hint.` (có test chặn tiền tố mới); bỏ cả mẫu `error.${code}` / `field.${code}` / `guest.lang.${l}` thay bằng bảng khóa tường minh. Bundle không còn `error.GUEST_STAY_ENDED`, `guest.req.fee_notice`, `error.INVALID_TRANSITION`, `guest.lang.ru_soon` (có test) |
| FB-R2-SEC-MOB-02 (Minor) | **Done một phần** | **Đã làm:** `gw.notice_read` vào danh sách EN. Bỏ hằng `NOTICE_VERSION` / `RETENTION_DAYS_DEFAULT`; dùng `OnlineCheckin.currentNoticeVersion` / `imageRetentionDays`, và gửi `ConsentInput.retentionDays`. **Fail closed:** thiếu trường, hoặc phiên bản thông báo không có văn bản tương ứng trong `NOTICE_TEXT_VERSIONS` → không hiện bước Thông báo / câu đồng ý, mà hiện "làm thủ tục tại quầy" + nút gọi (test 3 trường hợp). Test RU: 8 khóa hiện EN, `recordGuestConsent.locale = 'en'`. **Chờ hợp đồng – Deferred, không gọi API ngoài contract:** (a) ngôn ngữ thông báo đã đọc (`noticeLocale`): `updateOnlineCheckin` 0.3.6 chưa có trường này, nên client chưa gửi được; đang chờ BE-50 (server ghi `en` khi phiên là `ru`) và ARC thêm trường nếu cần. (b) Khôi phục ngôn ngữ phiên khi tải lại trang: cần `GET /v1/guest/sessions/current` – ARC dời sang 0.3.7 (đầu Sprint 4); MOB nối ngay khi có |

## Thay đổi khác cùng đợt
- Mock MSW: mọi phản hồi `OnlineCheckin` có thêm `currentNoticeVersion` / `imageRetentionDays` (kịch bản có thể bỏ trường hoặc đặt phiên bản lạ). `recordGuestConsent` đòi `retentionDays` = tham số hiện hành (sai → 422 `NOT_IN_LIST`). Upload có kịch bản `busy` (503 + `Retry-After`).
- Bộ lọc trắng `OnlineCheckin` phía client tăng từ 9 lên 11 khóa (SEC ĐK-2 17/10).

## File sửa
- `product/apps/guest-web/build/used-keys.ts` (mới), `vite.config.ts`, `tsconfig.json`
- `src/app/{api.ts,config.ts,i18n.tsx,problem.ts}`
- `src/checkin/{CheckinFlow.tsx,DocumentsStep.tsx}`
- `src/pages/{GuestShell.tsx,HomePage.tsx,InfoPage.tsx,TerminalPage.tsx,WifiBlock.tsx}`, `src/App.tsx`, `src/styles.css`
- `src/mocks/handlers.ts`, `src/test/setup.ts`
- `src/__tests__/{bundle.test.ts (mới), guard.test.ts, flow.test.tsx, states.test.tsx}`

## Giả định / phụ thuộc
- ~~Màn fail closed tạm dùng chuỗi có sẵn~~ → đã thay bằng chuỗi UXD `gw.oci_unavailable_title` / `_body` / `_late {time=22:00}` (+ nút gọi người trực), có test.
- `NOTICE_TEXT_VERSIONS = ['privacy-2026-10-v1']` là danh sách phiên bản **có văn bản trong bundle**. Khi tăng phiên bản thông báo, UXD và MOB phải thêm văn bản và phiên bản cùng lúc; nếu không, trang tự fail closed (đúng chủ ý).
- Phụ thuộc: BE-C cài 3 trường bổ sung 0.3.6 và BE-50 (`notice_locale`). Trước khi BE-C xong, chạy với API thật (`dev:server`) sẽ rơi vào màn fail closed – đúng thiết kế, không phải lỗi.

## Bổ sung 17/10 (ORC)
- Màn "làm thủ tục tại quầy" (fail closed) dùng `gw.oci_unavailable_title`, `gw.oci_unavailable_body` và `gw.oci_unavailable_late {time}`; `time` = `LATE_ARRIVAL_FROM` (22:00, cùng mốc với lựa chọn "Sau 22:00"). Không còn dùng `guest.cta.checkin` / `guest.late.not_ready` ở màn này.
- `apps/mobile/vite.config.ts`: `sourcemap: false` (trước là `true`). Khi cần gỡ lỗi tại máy: `pnpm --filter @ottimo/mobile build --sourcemap hidden`. Không dùng biến `process.env`, vì gói mobile không có `@types/node`.
- Kiểm lại:
  - guest-web: 50/50 test, build, typecheck, eslint 0 lỗi, prettier đều xanh.
  - mobile: test 1/1, build và typecheck xanh; `dist/assets` không còn `.map`.
  - `docker build -f infra/docker/Dockerfile.web .` exit 0; `find /srv -name '*.map'` trong image = **0**.
