# FE-B review: phần frontend của nhánh `lp-v2-main`

- Người review: FE-B (chủ landing) | Ngày: 04/11/2026 | Round 4, gói LP-v2, bước **Review chéo**
- Đối tượng: `origin/lp-v2-main` @ `bfad4f2c` (ARC lắp ráp: `4fea688e` gộp main + lp-v2, `58d6afcd` gộp PR #21, `65f70b0a` gộp main tài liệu). Sau đó thêm `cc045857` (ARC, chỉ sửa biên bản).
- Đọc: `rounds/round-04/outputs/ARC/lp-v2-main-merge.md`, `outputs/SEC/notice-2026-10-31-final.md` mục 1 và 7, `reviews/SEC-on-lp-v2-main.md` (origin/main `699af78e`) mục 2 và thẻ 02, `qa/bug-list.md` (BUG-R4-007/008, R3-050).
- Phạm vi: `apps/landing-web`, `tests/e2e/landing`, `design/copy` + `gen_strings.py`, `apps/admin-web` (Desk), `packages/i18n`. Phía server, migration và hạ tầng thuộc BE/OPS/SEC.

## 1. Kết luận

**ĐẠT.** Phần frontend không có Blocker hay Major. Việc gộp không làm mất phần nào của v1.0.3 hay của LP-v2. Thẻ SEC LPV2M-02 (đổi nhãn sang `2026-11-04`) FE-B đã sửa luôn trong lượt này (mục 4). Còn 2 thẻ Minor/Suggestion, không chặn.

## 2. Đã kiểm và kết quả

| # | Kiểm | Cách làm | Kết quả |
|---|---|---|---|
| 1 | Gộp tự động FE có lệch so với bản ARC không | `git merge-tree --write-tree e6b0fa6d 93c549ea`, so cây với `4fea688e` trong `apps/` + `packages/` | Chỉ lệch ở 2 tệp ARC có giải tay: `translate.test.ts` (giữ ca bảng plural của LP-v2 và chữ "Room charge") và `api-client/generated/openapi.ts` (chỉ nhãn 0.3.11). Bốn tệp admin-web gộp tự động (`AppShell.tsx`, `RoomDrawer.tsx`, `mocks/handlers.ts`, `mocks/reservations.ts`) giữ đủ cả hai bên: số đếm S35 dùng `loadWebreqNewCount` + nhắc email bảo mật v1.0.3; RoomDrawer có cả `PUBLIC_ROOM_TYPES` (BUG-R4-004) lẫn giá hẹn ngày v1.0.1 |
| 2 | Privacy en/vi = PR #21 từng ký tự | Script tách mọi chuỗi trong khối `en`/`vi` của `privacy.ts`, so với `5474b6e1` | en 40/40, vi 40/40 trùng. `consentMore` en/vi trùng PR #21 (Δ6 "from our server" / "khỏi máy chủ của OTTIMO") |
| 3 | 3 câu Δ5 ko/zh/ru của SEC | So nguyên văn với `notice-2026-10-31-final.md` mục 7 | Trùng. `privacy.test.ts` khóa đúng 5 đoạn Δ5. `consentMore` ko/zh/ru đã có ý "khỏi máy chủ" từ LP-v2 |
| 4 | Giữ "Nhắn Zalo" của LP-v2 | `vi.ts` + trang dựng | `chatOnZalo: 'Nhắn Zalo'`, `chatOnPrefix: 'Nhắn '` (PR #21 có "Nhắn qua Zalo", đã bỏ đúng). Đầu trang vi 375/1440: "Nhắn Zalo" |
| 5 | Font zh dựng lại | `brand.test`, `dist-checks` (glyphs, langFonts) | Xanh. Mọi chữ Hán của câu Δ5 mới có trong tệp cắt |
| 6 | Strings gộp | Làm phẳng `strings-en/vi.json` của base `bfbe8b1c`, `main`, `lp-v2`, HEAD | HEAD 3439 khóa. Không thiếu khóa nào của `main`: `secmail.*` 25/25, `early_departure` 109/109. Có `webreq.locale.{vi,en,ko,zh,ru}` và `webreq.locale_all`. Chỉ thiếu `rooms.price_same_today/future` (main bỏ có chủ đích ở v1.0.1). Sửa của `main` chỉ không vào HEAD ở `guest.bill.line.room_*`, nơi bản "Room charge, …" của LP-v2 thắng (UXD đã duyệt, ARC mục 2 #4). Không chuỗi nào lệch cả hai bên |
| 7 | `gen_strings.py` chạy lại | `python3 design/tools/gen_strings.py` | 3426 chuỗi + 8 mẫu, **không đổi byte** |
| 8 | Desk: cột/lọc ngôn ngữ (BUG-R4-007), ghi chú ngôn ngữ khi báo giá (BUG-R4-008), R3-050 | Đọc `WebRequestsPage.tsx` (lọc `locale`, cột `webreq.col.locale`), `QuoteDialog.tsx` (`LangNote` ko/zh/ru, `sendLocaleOf`), test `r4-lp-v2-fea*.test.tsx`, `r4-lp-v2-fe5.test.tsx` | Có đủ, giống `lp-v2`. `main` không sửa các tệp webreq/quote nên không có xung đột |
| 9 | Desk không mất v1.0.3 | So `origin/lp-v2..HEAD` trong admin-web: `SecurityEmailCard`, `UserEmailDialog`, `EarlyDepartureDialog`, `StrongReauthDialog`, `app/email.ts`, các test `v103-email-fea`, `v101-early-departure-fea`, `r4-bug014-early-departure-lease`, `v101-scheduled-prices-fea` | Còn đủ (= `main`) |
| 10 | Build + typecheck + vitest | `turbo run build test typecheck --filter=@ottimo/landing-web --filter=@ottimo/admin-web --force` | 7/7 task xanh. landing 12 tệp / **283 test**, `astro check` 0 lỗi 0 cảnh báo. admin-web 70 tệp / **799 test**. Vite cảnh báo chunk > 500 kB như trên `main`, không mới |
| 11 | `check:dist` (3 bản dựng) | `build`, `build:booking-preview`, `build:booking-live-test`, `check:dist` | Mọi kiểm `ok` (budgets, images, glyphs, langFonts, noticeVersion…) |
| 12 | Landing Playwright (axe, CSP, budgets, 5 ngôn ngữ) | `CI=1 test:e2e:landing`, cổng riêng 6186–6188 | Trước khi sửa: **149/149**. Sau khi đổi nhãn: xem mục 4 |
| 13 | So ảnh nhanh 375/1440 | Script Playwright tạm (đã xóa) trên `dist-booking-preview`: trang chủ, form và đoạn Δ5 của privacy, 5 ngôn ngữ | Không tràn ngang, 0 lỗi console. Đoạn Δ5 zh và ru (dài nhất) xuống dòng gọn ở 375. Thẻ meta có nhãn. Đúng brand: nền Ivory/Cream, tiêu đề Lora, chữ Be Vietnam Pro, nút Ink, đường kẻ Light Oak, không emoji. Ảnh để ngoài repo (scratchpad), không commit |

## 3. Thẻ

### FB-R4-FE-B-LPV2M-01
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/checks/dist.test.ts`, ca "every sentence of PRIVACY_NOTICE and consentMore is on the built page verbatim" (từ PR #21)
- Vấn đề: ca này chỉ chạy cho `en` và `vi`. Với ko/zh/ru, câu Δ5 mới của SEC chỉ được khóa ở mức nguồn (`privacy.test.ts`), chưa kiểm trên trang dựng. Nếu Astro hay bước thoát ký tự làm hỏng một câu ko/zh/ru (chẳng hạn dấu `，` hay `«»`), test không bắt được.
- Vì sao quan trọng: thông báo là văn bản pháp lý. SEC yêu cầu chữ trên trang trùng từng ký tự với chữ đã duyệt cho cả 5 ngôn ngữ.
- Đề xuất sửa: mở danh sách `[lang, path, home]` ra 5 ngôn ngữ (`/ko/privacy/`, `/zh/privacy/`, `/ru/privacy/`) và thêm `COPY` ko/zh/ru. Lượt này chưa làm vì ngoài thẻ SEC; FE-B làm ở lần chạm tiếp theo vào `dist.test.ts` (v1.0.4), hoặc ngay nếu QC yêu cầu.
- Trạng thái: Open

### FB-R4-FE-B-LPV2M-02
- Mức độ: Suggestion
- Vị trí: `product/tests/e2e/landing/playwright.config.ts` (`reuseExistingServer: !isCI`, cổng cố định 5186–5188)
- Vấn đề: chạy tại máy không đặt `CI=1` thì Playwright dùng lại server đang nghe ở 5186–5188. Khi nhiều worktree chạy song song (như đội đang làm), một lượt có thể âm thầm test bản dựng của worktree khác mà vẫn báo xanh.
- Vì sao quan trọng: kết quả "149/149" có thể không phải của nhánh đang review.
- Đề xuất sửa: ghi vào README test hoặc đầu config: "chạy song song thì đặt `CI=1` và `LANDING_PORT/LANDING_FORM_PORT/LANDING_LIVE_PORT` riêng". Lượt này FE-B làm đúng như vậy.
- Trạng thái: Open

Đã có thẻ khác ghi, không lặp lại ở đây: ARC LPV2M-01 (chú thích "0.3.10" → "0.3.11" trong admin-web/api-client, Minor, FE-A làm ở v1.0.4).

## 4. Đã sửa trên nhánh: FB-R4-SEC-LPV2M-02 (cũng là ARC LPV2M-02, FB-R4-SEC-FE-02)

- `product/apps/landing-web/src/content/privacy.ts`: `VERSION = '2026-11-04'`. Khối chú thích "TEMPORARY LABEL" thay bằng ghi chú nguồn nhãn (SEC-on-lp-v2-main mục 2; en/vi là chữ `2026-10-31` của PR #21, chưa từng đăng riêng (P4); Δ5 ko/zh/ru theo notice-final mục 7) và quy tắc không dùng lại nhãn cho chữ khác. Chú thích CHAT_DETAILS_MIN_NOTICE_VERSION đổi theo SEC LPV2M-01 (cổng là thông báo **đã đăng** đầu tiên có nêu Google Chat, tức `2026-11-04`). Câu chữ trên trang không đổi, chỉ đổi nhãn.
- Đổi 3 test: `tests/e2e/landing/form-live.landing.spec.ts` (`NOTICE_VERSION`), `tests/e2e/landing/lp-v2.landing.spec.ts` (`consentVersion` của POST), `apps/landing-web/src/scripts/price-estimate.test.ts` (`consentVersion`).
- Lệnh chạy lại: 3 bản dựng; `check:dist`: mọi kiểm `ok`, kể cả `noticeVersion`; vitest landing **283/283** (gồm `privacy.test`, `dist.test` trên bản dựng mới); `astro check` 0 lỗi; landing Playwright (gồm `pages.spec`): kết quả ghi ở mục 4.1.
- sha256 trang privacy dựng (`dist-booking-live`, `LANDING_BOOKING_FORM=true`, slug `dl01`; thẻ meta `ottimo-notice-version` = `2026-11-04` ở cả 5 trang). Bản `dist` mặc định tắt form nên không có trang privacy. OPS vẫn so băm trên image thật khi đăng, vì biến dựng của CI có thể khác:

| Trang | sha256 |
|---|---|
| `/privacy/` (en) | `7d610c5e754874c3e1d2d53d28e06a2302cae09c5bdb14ae42edfebdf5a5f2fa` |
| `/vi/privacy/` | `c2ab41213442e07d536005984de037ea00ae2cbdfaa6b64a836fbf569857160b` |
| `/ko/privacy/` | `dcc008dbe32c0643fae1c9ba66b13c99c9bbb951afb12e5d8e8657c32b1de73f` |
| `/zh/privacy/` | `4c813cc4b328e2d81ad8a51239aeda3d2e19e2629f4cdb2685321671298cf9d1` |
| `/ru/privacy/` | `79246edae1658f6a90463059ec35855282e4de17df3388ad005ec2dab0de0577` |

### 4.1 Playwright sau khi đổi nhãn
`CI=1 LANDING_PORT=6186 LANDING_FORM_PORT=6187 LANDING_LIVE_PORT=6188 pnpm test:e2e:landing` trên 3 bản dựng mới: **149/149 đạt** (2,0 phút). Gồm `form-live` (POST `consentVersion` = `2026-11-04`), `lp-v2` (5 ngôn ngữ), `pages`, `layout` (axe 0, CSP sạch, không bên thứ ba), `budget`. Lần chạy đầu bị gián đoạn khi máy mất mạng: 122 đạt, phần còn lại hết giờ sau 1 giờ. Lần chạy lại sạch. Ảnh TC-LP-061 mà test tự ghi vào `rounds/round-04/outputs/FE/screenshots/` đã trả về bản commit, không đưa vào commit.

Việc còn của người khác (không thuộc FE-B): `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` phía api (SEC LPV2M-01, BE); README/runbook OPS (SEC LPV2M-03).

## 5. Điểm làm tốt
- ARC giải `privacy.ts` sạch: en/vi trùng PR #21 từng ký tự mà vẫn giữ thẻ meta, `data-notice-version` và bộ chọn ngôn ngữ của LP-v2. Font zh được dựng lại đúng quy trình, không vá tay.
- Strings không sửa tay. Chạy lại `gen_strings.py` không đổi byte, nên bước CI "Copy is generated" đáng tin.
- Biên bản ARC ghi rõ từng xung đột, nên lượt review đối chiếu nhanh và chắc.
