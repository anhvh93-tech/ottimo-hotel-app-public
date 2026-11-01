# ARC review – các lượt sửa lỗi QA của LP-v2 (Round 4, bước Review)

- Người review: ARC · Ngày: 01/11/2026
- Phạm vi: `git diff 20afedff 0a25716a` (nhánh `origin/lp-v2`), từng commit:
  - `73a80804` FE3 – so giá web theo slug (BUG-R4-001), luật slug sang `@ottimo/contracts`
  - `2f7b55f7` – chuyển 14 khóa thêm tay của LP-v2 vào `gen_strings.py`
  - `ee375e6d` BE3 – số ít/nhiều cho câu hướng khách (BUG-R4-009); `577eebb0` = merge vào `lp-v2`
  - `0a25716a` FE4 – cột/lọc/tổng theo ngôn ngữ S35 (BUG-R4-007), ghi chú ngôn ngữ (BUG-R4-008), hồ sơ tạo nhanh (BUG-R3-050), hợp đồng **0.3.10 bổ sung 4**
- Không sửa mã, không commit. Các lệnh kiểm chạy trong worktree có sẵn của `lp-v2-fe4` (`0a25716a`) và một worktree tạm trong scratchpad (đã gỡ).

## 1. Đã kiểm gì (bằng chứng)

| # | Kiểm | Kết quả |
|---|---|---|
| K1 | `tsc --noEmit` của `@ottimo/api` và `@ottimo/admin-web` tại `0a25716a` | Sạch |
| K2 | `require('@ottimo/contracts')` từ thư mục api (CommonJS → ESM, Node 22.23) | Chạy, trả `premium-one-bedroom-1` |
| K3 | `pnpm --filter=@ottimo/api deploy --prod` (bước của `Dockerfile.api`) ra thư mục tạm | `node_modules/@ottimo/contracts/dist` có mặt, `require` chạy. Không chạy được `docker build` (máy không có Docker daemon) – CI bước "docker build Dockerfile.api" là chốt cuối |
| K4 | `turbo run build --filter=@ottimo/admin-web --filter=@ottimo/api --dry` | Đồ thị có `@ottimo/contracts#build` trước api và admin-web → `Dockerfile.api` (turbo prune + build `...`) và `Dockerfile.web` (build `./apps/*`) đều dựng `dist` của contracts trước khi dùng |
| K5 | `turbo run dev --filter=@ottimo/admin-web --dry` | Chỉ `admin-web#dev` – **không** dựng contracts (xem FB-…-06) |
| K6 | Vitest: contracts 2/2, i18n 21/21, api `bug-r4-009-plurals` + `be-b-s2-units` + `workspace-packages` + `be-d-r3-s1-units` 68/68 | Xanh |
| K7 | `gen-quote-copy.mjs --check`, `gen-openapi-meta.mjs --check`, api-client `gen.mjs --check` | Cả ba "up to date" |
| K8 | Chạy lại `gen_strings.py` tại `0a25716a` (hàm `build()` ghi **toàn bộ** JSON từ bảng, không trộn với JSON cũ) | `strings-{vi,en,ru}.json`, `strings.js`, `strings-tables.md` không đổi một byte → **không còn khóa thêm tay** |
| K9 | Mô phỏng cherry-pick `ee375e6d` lên `main` (`38ced860`) | Chỉ xung đột `wireframes/assets/strings.js` (tệp sinh). Sinh lại bằng `gen_strings.py` → 3 JSON trùng byte với bản cherry-pick; `gen-quote-copy --check` xanh; api `tsc` sạch; i18n 21/21, api 21/21. (Test guest-web không chạy được trong worktree tạm vì `node_modules` liên kết về `main`, không phải lỗi của commit) |
| K10 | `git merge-tree` `ee375e6d` lên `be-a-v1.0.1` / `fe-a-v1.0.1` | `be-a`: chỉ `strings.js`. `fe-a`: `strings-en.json`, `strings-vi.json`, `strings.js` – **đều là tệp sinh**; `gen_strings.py`, `CheckOutPage.tsx`, `quotes.service.ts` tự gộp |

## 2. Kết luận theo 4 việc được giao

**(1) Luật slug trong `@ottimo/contracts` – ỔN cho build và `Dockerfile.api`.** `slugOf` chỉ gọi `publicRoomTypeSlug`, Desk import cùng hàm, không còn bản thứ hai. Chuyển `@ottimo/contracts` từ devDependency sang dependency của api là **bắt buộc và đúng**: trước đây api chỉ `import type` (bị xóa khi biên dịch), nay `require` lúc chạy. Nếu vẫn để ở devDependency thì `pnpm deploy --prod` bỏ gói và image sẽ chết khi khởi động. Mẫu "api CommonJS `require()` gói ESM của workspace" đã có tiền lệ (`@ottimo/integrations`, Node ≥ 22.12 ghi trong `Dockerfile.api` và `engines`). TS 5.8 `nodenext` chấp nhận kiểu import này. Lockfile đổi khớp. Còn một chỗ ở môi trường dev (FB-…-06) và tài liệu kiến trúc chưa nói contracts nay có mã chạy.

**(2) Số ít/nhiều – ĐẠT.** `pluralForm()` (Intl.PluralRules, gom về 4 dạng) và `quoteCount()` đúng. Mọi ngôn ngữ mang đủ `_one/_few/_many/_other`, nên khi `ru` thiếu khóa (`bill.ota_prepaid_*`) và rơi về `en`, dạng do luật `ru` chọn vẫn có chữ. `gen-quote-copy` ném lỗi khi `en` thiếu khóa, và `--check` có trong test (`be-b-s2-units`). Bộ lọc khóa của guest-web bắt được tiền tố template (`` `guest.stay.dates_${` ``). Thứ tự cherry-pick sang v1.0.1 ở mục 4. `pluralForm` có hai bản (i18n + api, do api CommonJS không đọc được gói chỉ có nguồn TS), nhưng chỉ 6 dòng bọc API chuẩn và có test ở cả hai phía → chấp nhận (Suggestion BE-10).

**(3) FE4 – hợp đồng 0.3.10 bổ sung 4: ARC XÁC NHẬN.** Chỉ thêm, không làm gãy client: query `locale` (`form`, `explode: false`, khớp `split(',')` phía server, ngoài danh sách → 422 `NOT_IN_LIST` như `status`), `total` trong phản hồi. Server: page và `total` dùng cùng một mệnh đề `where` (status/refCode/locale + phạm vi vai), `total` không phụ thuộc cursor. RLS `tenant_isolation` áp cho cả câu đếm vì chạy trên cùng `tx`. Integration test phủ đủ: nhiều trang, nhiều ngôn ngữ, kết hợp status, 422. Tệp sinh (meta/schemas/api-client) khớp spec. Thay BE review `website-requests.service.ts`/`controller.ts`: ĐẠT, có 1 Suggestion. Phía Desk (ngôn ngữ khi mở lại báo giá): thứ tự "yêu cầu liên kết → hồ sơ → vi, lựa chọn của nhân viên luôn thắng" đúng ý US-175 AC4 (3). ARC chốt đây là **cách lưu** cho BUG-R3-050: hồ sơ giữ `preferredLocale` = ngôn ngữ gửi tin, báo giá tự suy ra, chưa thêm cột. **Nhưng hồ sơ tạo nhanh KHÔNG để trống quốc tịch như mô tả** (FB-…-05, Major): server gán `VN` khi trường bị bỏ.

**(4) Nguồn chữ – ĐẠT.** `gen_strings.py` là nguồn duy nhất tại `0a25716a`, JSON là bản sinh (K8). FE4 đã đồng bộ lại 3 bộ khóa mà `73a80804` sửa thẳng trong JSON. Đây là lần thứ hai JSON bị sửa tay (`c9372e52`, `73a80804`) mà CI không bắt được → FB-…-07.

## 3. Thẻ feedback

### FB-R4-ARC-FE-LPV2-05
- Mức độ: **Major**
- Vị trí: `apps/admin-web/src/pages/GuestFormDialog.tsx` `buildBody()` (dòng "Empty only for a profile made from a website request…"); `webreq/ContactMatches.tsx` `guestPrefillOf` (`nationalityCode: ''`); test `r4-lp-v2-fea4.test.tsx:157` (`expect(guest.nationalityCode).toBeUndefined()`); server `services/api/src/modules/guests/internal/guests.service.ts:149` (bản ghi mới mặc định `nationality_code: 'VN'`) và `:225` (chỉ ghi đè khi `input.nationalityCode !== undefined`).
- Vấn đề: hồ sơ tạo nhanh từ yêu cầu website **bỏ** `nationalityCode` khỏi body để "để trống". Với API thật, bỏ trường lúc tạo nghĩa là server gán `VN`, nên khách Hàn/Trung/Nga được lưu quốc tịch Việt Nam và `is_foreigner = false`. Test chỉ chạy trên MSW (mock không gán mặc định), nên xanh mà không chứng minh được AC. Mô tả commit ("empty nationality") và US-175 AC4 (3) / PO B5 ("quốc tịch để trống") không đúng với hệ thống thật.
- Vì sao quan trọng: dữ liệu khách sai ngay từ hồ sơ đầu tiên của nhóm khách ko/zh/ru mà LP-v2 nhắm tới. Quốc tịch hiện trên hồ sơ và CRM, và DATA dùng để thống kê quốc tịch. Khai báo lưu trú vẫn quyết theo giấy tờ (`registration/internal/rules.ts`) nên chưa sai về pháp lý, nhưng lễ tân đọc hồ sơ sẽ thấy "Việt Nam". PO đã chốt LP-v2 không phát hành khi chưa có B5.
- Đề xuất sửa:
  1. Hợp đồng (ARC duyệt trước tại đây, FE-A ghi theo lệnh ORC như bổ sung 4, hoặc ARC ghi ở bước Phản hồi & sửa): **0.3.10 bổ sung 5**: `GuestInput.nationalityCode` thêm `nullable: true`, mô tả "`null` = chưa biết (hồ sơ tạo từ yêu cầu website); bỏ trường khi tạo = `VN` như cũ". Chỉ nới, không làm gãy client. Server đã nhận `null` sẵn (controller `text(8).nullable().optional()`, service `null → NULL`, CHECK cho phép NULL), nên không phải sửa api. Sinh lại meta/schemas/api-client.
  2. FE: `buildBody` gửi `nationalityCode: form.nationalityCode || null` **chỉ khi tạo mới**. Khi sửa hồ sơ cũ thì vẫn bỏ trường nếu rỗng, để PATCH không xóa dữ liệu có sẵn.
  3. Test: sửa dòng 157 thành `toBeNull()`. BE thêm một ca integration: `createGuest` với `nationalityCode: null` → `Guest.nationalityCode === null`, `preferredLocale` giữ đúng giá trị gửi.
- Trạng thái: Open

### FB-R4-ARC-OPS-LPV2-02
- Mức độ: Minor
- Vị trí: `product/turbo.json` (`dev` không có `dependsOn`); `apps/admin-web/package.json` (`"@ottimo/contracts": "workspace:*"`); `packages/contracts/package.json` (`exports` chỉ trỏ `./dist`).
- Vấn đề: admin-web lần đầu phụ thuộc một gói workspace dạng `dist`. `api-client`, `i18n`, `ui` đều chỉ có nguồn. `turbo run dev --filter=@ottimo/admin-web --dry` chỉ có `admin-web#dev` (K5). Trên bản clone mới, `pnpm dev:web` hoặc `pnpm --filter @ottimo/admin-web dev|test` sẽ báo không giải được `@ottimo/contracts` cho tới khi ai đó chạy `pnpm build`. CI và Docker không bị ảnh hưởng vì `build`/`test`/`typecheck` có `^build`.
- Vì sao quan trọng: dev mới hoặc agent mới mất thời gian tìm lỗi môi trường. QA chạy Desk ở chế độ mock (`VITE_API_MODE=mock`) cũng vấp lỗi này.
- Đề xuất sửa: thêm `"dependsOn": ["^build"]` cho task `dev` trong `turbo.json` (contracts dựng mất khoảng 1 giây). Không chọn cách đổi `exports` sang nguồn TS, vì api CommonJS cần `dist`.
- Trạng thái: Open

### FB-R4-ARC-ARC-LPV2-01 (việc của ARC)
- Mức độ: Minor
- Vị trí: `docs/architecture.md` dòng 421 ("`packages/contracts` rỗng build được"); `packages/contracts/package.json` `description` ("Shared API types").
- Vấn đề: contracts nay chứa mã chạy, dùng chung giữa api (Node, CommonJS `require`) và Desk (bundle trình duyệt). Tài liệu chưa nói, và chưa có luật nào cho thứ được đặt vào đây.
- Vì sao quan trọng: nếu ai đó thêm `node:crypto` hay I/O vào contracts thì bundle Desk vỡ. Nếu thêm luật nghiệp vụ có trạng thái thì ranh giới module bị xóa.
- Đề xuất sửa: ARC ghi vào `architecture.md` mục 17 và `decision-log.md`: "`@ottimo/contracts` = kiểu + **hàm thuần** dùng chung api↔client (không I/O, không API riêng Node, không phụ thuộc runtime), mỗi hàm có test trong gói. Hàm đầu tiên: `publicRoomTypeSlug` (BR-012)". Cập nhật `description`. ARC làm ở bước Phản hồi & sửa.
- Trạng thái: Open

### FB-R4-ARC-UXD-LPV2-01
- Mức độ: Minor
- Vị trí: `.github/workflows/ci.yml` (không có bước nào chạy `gen_strings.py`); lịch sử `c9372e52`, `73a80804` (sửa thẳng `strings-{vi,en}.json`).
- Vấn đề: đã hai lần chữ bị thêm hoặc sửa thẳng trong JSON sinh, và lần nào cũng phải có commit dọn sau (`2f7b55f7`, phần "3 stale tuples" của `0a25716a`). CI không phát hiện. `gen-quote-copy` và `gen-openapi-meta` đều có `--check`, còn `gen_strings.py` thì không.
- Vì sao quan trọng: lần sinh lại sau sẽ âm thầm xóa hoặc hoàn tác chữ đã duyệt (CPY/UXD) trên giao diện khách và Desk.
- Đề xuất sửa: thêm bước CI (job lint): `python3 product/design/tools/gen_strings.py && git diff --exit-code -- product/design/copy product/design/wireframes/assets/strings.js product/design/tools/strings-tables.md`. Có thể thêm cờ `--check` vào `gen_strings.py` nếu muốn khỏi ghi tệp. Chủ trì: OPS, UXD xác nhận.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-06
- Mức độ: Minor
- Vị trí: `apps/admin-web/src/pages/GuestFormDialog.tsx` dòng 138–146 (`if (!isCreate || prefillName) return initial;` rồi đọc bản nháp).
- Vấn đề: khi tạo mới mà `prefillName` rỗng, bản nháp cũ trong `localStorage` sẽ thay toàn bộ `initial`, kể cả `prefill` từ yêu cầu website (ngôn ngữ gửi tin, liên hệ, quốc tịch trống). Cần FE kiểm `GuestPicker` có mở hộp tạo mới với ô tìm rỗng không. Nếu có thì đây là đường làm mất BUG-R3-050.
- Vì sao quan trọng: hồ sơ quay lại `vi`/`VN`, mở lại báo giá thì về tiếng Việt, đúng lỗi vừa sửa.
- Đề xuất sửa: `if (!isCreate || prefillName || prefill) return initial;` (có `prefill` thì bỏ bản nháp). Thêm 1 ca test có bản nháp sẵn.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-08
- Mức độ: Suggestion
- Vị trí: `website-requests.service.ts` `list()`: câu đếm `… WHERE ${where} AND $3::date IS NOT NULL`, tham số `[statuses, actor.userId, c.today, ref, locales]`.
- Vấn đề: `$3` không có trong `where`, nên phải gắn mệnh đề giả để Postgres suy ra kiểu tham số. Chạy đúng, nhưng người sau dễ xóa mệnh đề "vô nghĩa" này rồi gặp lỗi `could not determine data type of parameter $3`.
- Đề xuất sửa: dựng `where` theo chỉ số tham số truyền vào (như `scopeSql(actor, n)`) và gọi câu đếm với mảng riêng `[statuses, actor.userId, ref, locales]`, hoặc ít nhất ghi chú một dòng giải thích. Lần nâng hợp đồng sau, cân nhắc đưa `total` vào `required` vì server luôn trả.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-09
- Mức độ: Suggestion
- Vị trí: `docs/api/openapi.yaml` changelog "0.3.10 bổ sung 4 (… chờ ARC xác nhận …)".
- Vấn đề: ARC đã xác nhận ở review này, nhưng changelog vẫn ghi "chờ".
- Đề xuất sửa: khi ghi bổ sung 5 (FE-LPV2-05), đổi thành "ARC xác nhận 01/11 (`reviews/ARC-on-LP-v2-fixes.md`)". Không cần commit riêng.
- Trạng thái: Open

### FB-R4-ARC-BE-LPV2-10
- Mức độ: Suggestion
- Vị trí: `packages/i18n/src/translate.ts` `pluralForm` và `services/api/src/modules/sales/internal/quotes.service.ts` `pluralForm`.
- Vấn đề: hai bản giống hệt nhau. Lý do có thể chấp nhận: i18n là gói chỉ có nguồn TS, api CommonJS không đọc được.
- Đề xuất sửa: giữ như hiện tại. Thêm vào test api đúng bảng số của `translate.test.ts` (1/2/5/21/22/25/11 × vi/en/ru) để hai bản không lệch nhau. Nếu sau này có thêm hàm i18n dùng chung api↔client thì gom vào `@ottimo/contracts` theo luật ở ARC-LPV2-01.
- Trạng thái: Open

### FB-R4-ARC-FE-LPV2-07
- Mức độ: Suggestion
- Vị trí: `QuoteDialog.tsx` effect "reopened" (gọi `getWebsiteBookingRequest`, rồi `getGuest`).
- Vấn đề: ngôn ngữ của báo giá được **suy ra** mỗi lần mở lại, phải gọi thêm 1–2 API, và chữ có thể nháy từ `vi` sang `en`. Với v1.0.1/LP-v2 thì chấp nhận được (ARC chọn cách này ở mục 2 (3), không thêm migration).
- Đề xuất sửa: v1.1 cân nhắc lưu `Quote.textLocale` lúc `saveQuote` (thêm cột, chỉ thêm), để mở lại đọc thẳng, không phụ thuộc phạm vi SAL của yêu cầu.
- Trạng thái: Open

## 4. Thứ tự đưa `ee375e6d` (BUG-R4-009) sang v1.0.1

BE nói cherry-pick được. ARC xác nhận bằng mô phỏng (K9, K10), với các điều kiện sau:

1. Gộp **`be-a-v1.0.1`** rồi **`fe-a-v1.0.1`** vào `main` theo đúng thứ tự đã chốt ở `ARC-on-LP-v2-code.md` mục 5. BUG-R4-009 không thay đổi thứ tự này.
2. Trên `main` (hoặc nhánh phát hành v1.0.1), chạy `git cherry-pick -x ee375e6d`. **Chỉ commit này.** **Không** cherry-pick `2f7b55f7`: commit đó mang 14 khóa chữ của LP-v2 (`webreq.estimate_*`, `rooms.public_type*`…) vào v1.0.1, và `ee375e6d` áp được mà không cần nó (K9: `gen_strings.py` tự gộp).
3. Xung đột chỉ nằm ở tệp sinh (`strings.js`; nếu `fe-a-v1.0.1` đã vào `main` thì có thêm `strings-{vi,en}.json`). Giải bằng cách **chạy lại `python3 product/design/tools/gen_strings.py`**, không sửa tay. Sau đó chạy `node services/api/scripts/gen-quote-copy.mjs --check`.
4. Kiểm trước khi đẩy: `pnpm --filter @ottimo/i18n test`, `pnpm --filter @ottimo/guest-web test` (guard BUG-R4-009), api `bug-r4-009-plurals` + `be-b-s2-units` + integration `sales.test.ts` (cần DB). Cuối cùng chạy lại `gen_strings.py` và `git diff --exit-code` để chắc JSON vẫn là bản sinh.
5. Khi gộp `main` vào `lp-v2` về sau, hai phía có cùng thay đổi nên git sẽ tự gộp phần trùng (dự kiến, chưa mô phỏng). Nếu xung đột ở tệp sinh, lại sinh lại như bước 3. QA lượt 3 của LP-v2 chỉ kiểm hồi quy ko/zh/ru cho B6 (PO mục 9).

## 5. Kết luận

- **Blocker: 0. Major: 1** (FB-R4-ARC-FE-LPV2-05: quốc tịch hồ sơ tạo nhanh bị server gán `VN`; cần hợp đồng 0.3.10 bổ sung 5 `nullable` + FE gửi `null`). Minor: 4. Suggestion: 4.
- (1) `@ottimo/contracts` thành dependency lúc chạy của api: **ĐẠT** cho build, `pnpm deploy --prod` và `Dockerfile.api`/`Dockerfile.web`. Còn hở ở môi trường dev (OPS-LPV2-02) và tài liệu (ARC-LPV2-01).
- (2) Số ít/nhiều: **ĐẠT**. Cherry-pick `ee375e6d` sang v1.0.1 theo mục 4.
- (3) Hợp đồng **0.3.10 bổ sung 4: ARC xác nhận**. Mã BE trong commit FE4: ĐẠT. BUG-R3-050: ĐẠT phần ngôn ngữ, **chưa đạt phần quốc tịch** (Major).
- (4) Nguồn chữ: ĐẠT, không còn khóa thêm tay. Cần chốt CI (UXD-LPV2-01) để không tái diễn.
- Điều kiện để LP-v2 sang QA lượt 3: đóng FE-LPV2-05. Các thẻ Minor có thể đóng cùng lượt hoặc dời, PO quyết.

## 6. Điểm làm tốt nên giữ

- Luật slug chuyển **nguyên văn** sang một chỗ duy nhất, có test 4 nhãn e-brochure thật, và ghi chú trong `slugOf` "do not copy it back here". Đúng cách xử lý gốc của BUG-R4-001 (hai luật lệch nhau).
- `total` dùng chung một mệnh đề `where` với trang dữ liệu, kèm integration test so với `count(*)` trực tiếp trong DB qua nhiều trang và nhiều bộ lọc. Đây là cách chứng minh "đếm khớp bộ lọc" chắc nhất.
- Bản tiếng Anh mang đủ 4 dạng số để làm lưới cho mọi ngôn ngữ còn thiếu bản dịch. `gen-quote-copy` ném lỗi khi thiếu, và có `--check` chạy trong test.
