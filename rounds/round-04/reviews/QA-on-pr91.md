# QA – Review + Kiểm thử PR #91 `v104/fix-ru-notice-locale` (BUG-R4-053)

- Người làm: QA (người thứ hai, không phải QA đang viết checklist staging) | Round 4 – v1.0.4 – Bước **Review + Kiểm thử** (bản sửa BUG-R4-053) | 05/11/2026, 15:25–15:45 (giờ máy QA)
- Đối tượng: PR #91 vào `main`, cắt từ `7b2d79ec` (chứa `SHA_V104` `0d11db20`). Đọc `gh pr diff 91` và báo cáo BE `rounds/round-04/outputs/BE/v1.0.4-fix-ru-notice-locale.md`. Có **hai head**:
  - **`19c9a2e7`**: QA review và chạy mọi test ở head này (mục 0, 1);
  - **`9216394f`** (ORC báo 15:40, sửa thẻ ARC FB-R4-ARC-BE-PR91-01): `git diff 19c9a2e7 9216394f` chỉ thêm 1 dòng `"$TURBO_ROOT$/apps/guest-web/src/app/i18n.tsx",` vào `test.inputs` của `product/services/api/turbo.json`. Mã và test không đổi, nên số test của `19c9a2e7` giữ nguyên cho `9216394f`. Ở `9216394f`, QA chỉ chạy lại phép thử hash turbo (thẻ 01).
- Căn cứ: quy tắc SEC `rounds/round-04/reviews/SEC-on-ru-notice-locale-drill.md` mục 4 (4.1–4.5) và mục 2 (T4); ARC `rounds/round-04/reviews/ARC-on-s16-release-path.md` mục 3 (A1', S16'); luật khai `inputs` của turbo (decision-log 04/11 OPS, BUG-R4-029; `product/docs/dev-setup.md` mục 5); mục BUG-R4-053 trong `rounds/round-04/qa/bug-list-v1.0.4.md`.
- Cách chạy: worktree tách rời của `19c9a2e7` ở scratchpad. Postgres 17 tạm dùng một lần (`postgres:17-alpine`, cùng digest với service của `ci.yml`), cổng chỉ `127.0.0.1`, tạo vai bằng `02-roles.sh` và mật khẩu CI giả, như `rounds/round-04/outputs/OPS/v1.0.4-ci-turbo-inputs.md` mục 3. `pnpm install --frozen-lockfile`, `turbo run build --filter=@ottimo/api^...`, `pnpm db:migrate` (72 migration). Vitest `--retry=0`. Container và worktree của `19c9a2e7` **đã dọn** lúc 15:36. Worktree thứ hai của `9216394f` (chỉ `pnpm install` + turbo `--dry`, không DB) đã dọn lúc 15:44.
- Không đăng nhập staging, không chạm production, không sửa mã sản phẩm, không commit. Dữ liệu test chỉ là dữ liệu giả của bộ test.

## 0. Kết luận

**ĐẠT** ở head `9216394f` (gộp được).
- Bản sửa đúng quy tắc SEC mục 4, test bắt được lỗi, CI của `19c9a2e7` xanh. 0 lỗi P0–P3 mới trong mã sản phẩm.
- Ở `19c9a2e7` QA thấy 1 thẻ Major: test canh G-RU có thể xanh giả trên CI vì thiếu khai `inputs`. ARC ghi cùng chỗ này (FB-R4-ARC-BE-PR91-01). BE đã sửa ở `9216394f`, QA đã kiểm lại (thẻ 01: Done).
- Còn 1 thẻ Suggestion, không chặn.

Hai việc còn lại không chặn gộp #91, nhưng phải xong trước khi đóng lỗi:
1. **RG-35** (S16') đạt trên staging sau khi `TAG12` r3 lên (SEC T4). Ca đã ghi ở `rounds/round-04/qa/v1.0.4-test-cases.md` bản 0.19. BUG-R4-053 chỉ đóng khi RG-35 đạt.
2. CI của `9216394f` (run `41995698312`) lúc QA xem (15:42) còn chờ job `format · lint · audit · test · build`. ORC gộp khi job này xanh.

| Kiểm | Kết quả |
|---|---|
| 3 tệp liên quan, `--retry=0`, head `19c9a2e7` | **24/24 đạt**: `bug-r4-053-notice-locale` 9, `integration/bug-r4-053-ru-notice-locale` 4, `integration/guest-portal` 11. Chạy **4 lượt liên tiếp**, cả 4 lượt 24/24 (96/96), 0 flaky |
| Mã chưa sửa (chỉ thay `guest-portal.service.ts` bằng bản `0d11db20`), 2 tệp tích hợp | **1 đỏ, 14 đạt / 15.** Ca đỏ là (a): `notice_locale` nhận `"en"`, mong `"ru"`. Khớp số BE |
| Đột biến `RU_UNREVIEWED_LEGAL = ['gw.notice_body']` ở guest-web | G-RU **đỏ** (1 đỏ, 8 đạt / 9). Đã trả tệp về như cũ |
| Turbo `--dry=json`, hash của `@ottimo/api#test`, head `19c9a2e7` | Gốc `14d27695f5602cd9`. Thêm dòng trống vào `apps/guest-web/src/app/i18n.tsx`: **không đổi** (`14d27695f5602cd9`). Thêm vào `config.ts`: đổi (`21a36ace32719e06`). Xem thẻ 01 |
| Như trên, head `9216394f` (worktree tạm khác, đã dọn) | Gốc `5f33deed57ba2d24`. Sửa `i18n.tsx`: **đổi** (`10ff32ad8b7643e2`). Sửa `config.ts`: đổi (`875540e2c2a1668f`). Thẻ 01 đã được sửa |
| CI PR #91, run `41993899061`, job `127132357721` | Đạt (9 phút 16 giây). `@ottimo/api:test` **cache miss**: 171 tệp đạt, 2 bỏ qua (173); 4165 ca đạt, 19 bỏ qua, 1 todo. Ba tệp trên đều có dòng ✓ (11, 4, 9 ca). Khớp số BE. Lúc QA xem (15:33), job `docker images build · E2E smoke` còn chờ |
| A1' (chỉ git) | `git diff --name-only 0d11db20 19c9a2e7 -- product ':!product/docs' .github` ra đúng 4 tệp; `product/docs/api` rỗng; không có tệp migration. Ở `9216394f` ra 5 tệp: thêm `product/services/api/turbo.json` theo thẻ của ARC |

## 1. Đối chiếu quy tắc SEC mục 4

| SEC | Mã / test | QA |
|---|---|---|
| 4.1 `notice_locale` = `g.locale` nếu thuộc danh sách của phiên bản **hiện hành**, không thì `en` | `update` gọi `noticeLocaleShown(current, g.locale)`. `current` là phiên bản hiện hành, đã so khớp `body.noticeVersion` ở dòng ngay trên (lệch thì `NOT_IN_LIST`, không ghi) | Đúng |
| 4.2 Bảng theo phiên bản: v1 vi/en; v2 vi/en/ru; lạ vi/en | `NOTICE_LOCALES_BY_VERSION` đóng băng, `Object.hasOwn` nên `constructor`/`__proto__` là phiên bản lạ. Test T1 khóa đúng bảng, T2 đóng băng, U-d các khóa prototype | Đúng |
| 4.3 Thêm ngôn ngữ cần ký + client cùng bản + test hai phía | Chú thích ghi luật. Test G-RU nối bảng server với `RU_UNREVIEWED_LEGAL` của guest-web | Đúng. Ở `19c9a2e7` CI có thể phát lại kết quả cũ (thẻ 01); `9216394f` đã sửa |
| 4.4 Không đổi hợp đồng, server lấy ngôn ngữ từ phiên | Không đổi `docs/api`, không nhận ngôn ngữ từ client ở bước thông báo | Đúng |
| 4.5 (a)–(d) | Tích hợp (a)–(d) trên Postgres thật qua HTTP, một tenant cho mỗi phiên bản; unit U-a…U-d | Đủ 4 ca, đạt |

Ghi nhận thêm (không thành thẻ):
- Test cũ `guest-portal.test.ts:563` đổi tên thành ca (c), giữ kỳ vọng `en`. Đúng, vì tenant của tệp đó ở v1 mặc định.
- G-RU chỉ đọc `RU_UNREVIEWED_LEGAL`. `legalLocale('ru')` của guest-web còn cần đủ 11 khóa pháp lý trong `strings-ru.json`. Nếu thiếu một khóa RU thì trang về EN mà G-RU vẫn xanh. Chỗ này đã có test phía guest-web chặn: `apps/guest-web/src/__tests__/units.test.ts:122–143` đòi `legalLocale('ru') = 'ru'` với bộ chữ hiện tại. Bảng dùng chung sinh từ `gen_strings.py` (v1.0.5, FB-R4-ARC-BE-S16-03) sẽ bỏ được cả hai chỗ đọc mã nguồn.
- Bấm "đã đọc" lần nữa thì `notice_locale` và `notice_accepted_at` bị ghi đè theo lần bấm sau. Hành vi này có từ trước, không đổi ở #91.
- Giả định 1 của BE (đổi ngôn ngữ mà `PUT /v1/guest/locale` lỗi mạng thì trang và phiên lệch nhau) là rủi ro có từ trước với vi/en. N6b của SEC bắt được. QA không ghi lỗi mới.

## 2. Thẻ feedback

### FB-R4-QA-BE-PR91-01
- Mức độ: Major
- Vị trí: `product/services/api/test/bug-r4-053-notice-locale.test.ts` (khối G-RU, `literalArray('i18n.tsx', …)`); `product/services/api/turbo.json` `tasks.test.inputs`
- Vấn đề: G-RU đọc hai tệp ngoài gói `@ottimo/api`: `apps/guest-web/src/app/config.ts` và `apps/guest-web/src/app/i18n.tsx`. `turbo.json` của api chỉ khai `config.ts` (có từ #61), **không** khai `i18n.tsx`. Bằng chứng (turbo `--dry=json` trên head `19c9a2e7`): sửa `i18n.tsx` thì hash `@ottimo/api#test` giữ nguyên `14d27695f5602cd9`; sửa `config.ts` thì đổi sang `21a36ace32719e06`.
- Vì sao quan trọng: G-RU sinh ra để bắt đúng kiểu lệch đã gây BUG-R4-053, tức guest-web đổi `RU_UNREVIEWED_LEGAL` mà server không đổi. Lệch đó nằm ở `i18n.tsx`. Một PR sau chỉ đưa khóa RU trở lại `RU_UNREVIEWED_LEGAL` (ví dụ SEC rút bản RU của v2) sẽ không làm mất cache của `@ottimo/api#test`. CI khi đó phát lại kết quả xanh cũ (khóa cache lùi về tiền tố, OPS mục 8), còn server vẫn ghi `ru` cho trang đang hiện EN. Đó là kiểu "ghi khống" mà quyết định (a) 17/10 cấm. Đây cũng là họ lỗi BUG-R4-029, trái luật OPS đã ghi decision-log 04/11. Bản cắt v1.0.4 không bị ảnh hưởng: mã hiện tại đúng, và SHA cắt chạy `--force`.
- Đề xuất sửa: thêm `"$TURBO_ROOT$/apps/guest-web/src/app/i18n.tsx"` vào `tasks.test.inputs` của `product/services/api/turbo.json`. Kiểm lại bằng `turbo run test --filter=@ottimo/api --dry=json`: sửa `i18n.tsx` thì hash phải đổi. Việc tự động hóa (OPS mục 8 (b): CI so công cụ dò với `inputs` đã khai) thì để v1.0.5.
- Trạng thái: **Done** (trùng thẻ ARC FB-R4-ARC-BE-PR91-01). BE sửa ở `9216394f` đúng dòng trên. QA kiểm lại ở `9216394f`: sửa `i18n.tsx` thì hash `@ottimo/api#test` đổi từ `5f33deed57ba2d24` sang `10ff32ad8b7643e2`. BE trả lời thẻ này cùng thẻ ARC, không cần sửa gì thêm.

### FB-R4-QA-BE-PR91-02
- Mức độ: Suggestion
- Vị trí: `product/services/api/test/integration/bug-r4-053-ru-notice-locale.test.ts` ca (a), phần `POST /v1/guest/consents`
- Vấn đề: nửa `consent_record` của ca (a) gửi cứng `locale: 'ru'` rồi đọc lại `ru`. Server chưa kiểm `body.locale` (SEC 4.6, v1.0.5). Vì vậy nửa này chỉ chứng minh server lưu đúng giá trị nhận được. Nó không chứng minh guest-web gửi `ru`. Phần đó do `apps/guest-web/src/__tests__/flow.test.tsx:497` (chạy trên mock) và RG-35 trên staging chứng minh.
- Vì sao quan trọng: người đọc test có thể nghĩ "cặp S16 khớp nhau" đã được chứng minh đầu-cuối ở CI, rồi bỏ RG-35.
- Đề xuất sửa: không bắt buộc. Thêm một dòng chú thích ở ca (a) rằng nửa consent dựa vào giá trị guest-web gửi (`legalLocale`). Bằng chứng đầu-cuối là RG-35 (SEC T4). Khi làm SEC 4.6 ở v1.0.5, thêm ca `ru` + v1 → 422 `NOT_IN_LIST` cho `recordGuestConsent`.
- Trạng thái: Open

## 3. Điểm làm tốt

- Bảng theo phiên bản, đóng băng, chỉ đọc khóa riêng, có test cho các khóa prototype. Cách này an toàn hơn so sánh chuỗi phiên bản "v2 trở lên", và ghi đúng `en` cho tab v1.0.3 cũ còn mở trong lúc H05 = v1.
- G-RU nối bảng server với nguồn của guest-web, và đỏ khi không tìm thấy khai báo thay vì bỏ qua. QA thử đột biến: G-RU bắt được.
- Có bằng chứng "đỏ trên mã cũ" (QA chạy lại ra đúng 1/15), phạm vi đúng A1', và mô tả ảnh hưởng dữ liệu cũ rõ ràng (staging giữ dòng `en` làm bằng chứng, production không có dòng sai).
