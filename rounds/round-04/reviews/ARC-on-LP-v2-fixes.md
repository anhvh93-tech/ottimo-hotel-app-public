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

---

## Lượt 2 – c37a0a76

- Người review: ARC · Ngày: 01/11/2026 · Bước: Review (lượt sửa 5 của FE trên LP-v2, nhánh `origin/lp-v2-fe5` @ `c37a0a76`, cha `0a25716a`)
- Phạm vi: `git show c37a0a76` (31 tệp). Đọc mã ở commit bằng `git show`/`git grep`, không checkout. Không sửa mã, không commit.

### L2.1 Đã kiểm gì (bằng chứng)

| # | Kiểm | Kết quả |
|---|---|---|
| K11 | Ai đọc `guest.nationality_code` / `is_foreigner` của **hồ sơ** (`git grep` toàn bộ `services/api/src`, `apps/*/src`) | Chỉ `guests.service` (tính `is_foreigner`, mặc định `preferred_locale`, cảnh báo trùng BR-952), `party.service` (bỏ trường khi NULL), `bill.service` (chọn `vi_en`). Khai báo lưu trú (`registration.service`) đọc `guest_document.nationality_code` (alpha-3) và `guest_document.is_foreigner`. Phụ thu NN dài hạn (`quote-pricing.ts`) lấy `guestCategory` từ lệnh báo giá, không đọc hồ sơ. |
| K12 | Module registration có ghi ngược quốc tịch giấy tờ vào hồ sơ đã có không | Không. Không có `UPDATE guest SET nationality_code` nào. Alpha-3 → alpha-2 chỉ chạy khi **tạo** hồ sơ từ giấy tờ (`document-profile.service`). Hồ sơ tạo nhanh để NULL sẽ vẫn NULL sau khi nhận phòng bằng hộ chiếu. |
| K13 | Sinh lại chữ: `git archive c37a0a76 product/design`, chạy `python3 -I design/tools/gen_strings.py` trong bản giải nén (scratchpad) | rc 0, `git status` sạch. Bước CI mới sẽ xanh trên commit này. Job `build-test` có `defaults.run.working-directory: product`, nên đường dẫn `design/tools/...` đúng. |
| K14 | `whereAt` (`website-requests.service.ts`) | Trang: `$1 status, $2 user, $4 ref, $5 locale` (`$3 today` dùng trong `DATES`/`rank`, `$6 limit`, `$7–9` cursor). Đếm: `$1–$4` với mảng `[statuses, userId, ref, locales]`. `scopeSql(actor, n)` chỉ dùng `$n`. Đúng, không còn mệnh đề giả. Test so `total` với `count(*)` (`lp-v2-price-estimate.test.ts`) xanh theo báo cáo FE 11.2. |
| K15 | Bảng ca số ít/nhiều dùng chung | `translate.test.ts` import JSON (i18n có `resolveJsonModule` từ `tsconfig.base.json`). Test api đọc `__dirname/../../../packages/i18n/src/plural-forms.cases.json` = `product/packages/i18n/src/...`, đúng. **Hở:** `services/api/turbo.json` `test.inputs` không có tệp này, và api không phụ thuộc `@ottimo/i18n`. Vì CI giữ `product/.turbo` qua `actions/cache`, sửa bảng có thể không làm api test chạy lại. Lỗ này có từ trước với `design/copy/strings-*.json` (`gen-quote-copy --check` trong `be-b-s2-units.test.ts`). |
| K16 | `turbo.json` `dev.dependsOn: ["^build"]` | Đúng đề xuất OPS-LPV2-02. Task `dev` persistent phụ thuộc task build không persistent, turbo cho phép. Giới hạn: contracts không tự build lại khi sửa trong lúc `dev` đang chạy (không có watch). Chấp nhận, ghi trong `dev-setup.md` khi ARC làm ARC-LPV2-01. |
| K17 | Quy ước SĐT trong hợp đồng (`openapi.yaml` dòng 18–19) và `guests.service` dòng 193–208 | Quy ước: "response luôn là E.164 có dấu `+`", DB lưu không `+`, "thêm/bỏ `+` chỉ ở tầng API". `phone` đi qua `phoneForApi`. Riêng `messagingHandles.zalo/whatsapp` dạng SĐT được chuẩn hóa thành `84…` rồi trả nguyên. Người đọc duy nhất là `GuestFormDialog` (so theo chữ số). `webreq/labels.ts` (`wa.me`) đọc SĐT của yêu cầu, không đọc handle. |
| K18 | Ví dụ request `createGuest` trong hợp đồng (dòng ~7880) | `preferredContact: zalo` mà không có `messagingHandles.zalo`. Theo luật vừa ghi rõ trong mô tả `preferredContact`, ví dụ này sẽ bị 422. |

### L2.2 Kết luận theo 6 việc được giao

1. **Hợp đồng 0.3.10 bổ sung 5: ARC XÁC NHẬN.**
   - Chỉ nới, không gãy client: `type: [string, 'null']` hợp lệ với OAS 3.1.0. `pattern` chỉ áp cho chuỗi. Mặc định `VN` khi bỏ trường lúc tạo giữ nguyên. Server đã nhận `null` từ trước, integration test phủ đủ 4 nhánh (null, bỏ trường, sửa giữ NULL, `KR` rồi `null`). Client sinh lại đúng (`string | null`).
   - **Khai báo lưu trú: không ảnh hưởng** (K11). BR-009 phân loại VN/NN theo giấy tờ, và cổng khai báo lấy alpha-3 từ `guest_document`.
   - **Phụ thu NN: không ảnh hưởng.** Báo giá dùng `guestCategory` do sale nhập (BR-009 "lúc báo giá dùng thông tin sale nhập").
   - **Bill:** `bill.service` vẫn ra `vi_en` vì `preferredLocale` ≠ `vi`.
   - **Có ảnh hưởng tới báo cáo quốc tịch.** `metrics-definitions.md` dòng 442 lấy cơ cấu nội địa/nước ngoài từ `Guest.is_foreigner`. NULL → `false` nên khách chưa rõ quốc tịch bị đếm là nội địa. Đây là đếm sai theo hướng cũ (trước đây bị ghi hẳn `VN`) nhưng giờ có thể tách được. Giao **DATA** (thẻ DATA-LPV2-01).
   - Kèm K12: **DOM** quyết có điền quốc tịch hồ sơ từ giấy tờ khi hồ sơ đang NULL hay không (thẻ DOM-LPV2-01).
   - Nghĩa của `isForeigner = false` nay là "không biết là người nước ngoài", không phải "là người Việt". ARC ghi rõ câu này vào mô tả `Guest.isForeigner` khi sửa ví dụ (ARC-LPV2-02).
2. **BUG-R4-011 cách (a): ARC CHỌN (a).**
   - Luật 0.3.4 giữ nguyên nghĩa: kênh nhắn tin cần handle của chính kênh đó. Không thêm luật ngầm "Zalo = SĐT" ở server, vì luật ngầm đó sai khi tài khoản Zalo khác số điện thoại.
   - Dữ liệu tường minh, sau này adapter Zalo/ZNS của INT đọc thẳng `messagingHandles.zalo`.
   - Chỉ Desk ghi `preferred_contact` (K11: không module api hay app nào khác tạo hồ sơ có kênh nhắn tin), nên không có client khác bị kẹt.
   - `messagingHandlesOf` giữ handle Desk không hiển thị, và Zalo trùng SĐT cũ thì đi theo SĐT mới. Đúng ý.
   - Hai điểm nhỏ ghi ở thẻ FE-LPV2-08 (Suggestion).
3. **Không gộp `pluralForm`, dùng bảng ca chung: ARC CHẤP NHẬN.** Đúng đề xuất BE-LPV2-10. Bảng 15 số × 3 ngôn ngữ phủ các nhánh `%10`/`%100` của tiếng Nga (1/21/101, 2–4/22, 11–14/111–112, 0/5/25). Còn hở cache turbo (K15), giao OPS ở thẻ OPS-LPV2-03. Đóng BE-LPV2-10.
4. **BE-08 `whereAt`: ĐẠT** (K14). Đóng BE-LPV2-08. Đề xuất đưa `total` vào `required` vẫn để lần nâng hợp đồng sau. BE-LPV2-09 đã đổi chữ trong changelog: đóng.
5. **CI "Copy is generated": ĐẠT** (K13). Bước này bắt cả tệp sinh mới chưa commit (`--untracked-files=all`) và in lệnh sửa. Đóng UXD-LPV2-01. **`turbo.json` dev: ĐẠT** (K16). Đóng OPS-LPV2-02.
6. **`messagingHandles` trả `849…` không có `+`.**
   - Xếp loại: **lệch hợp đồng có từ 0.3.4**, thuộc **BE**, mức **Minor**. Không chặn LP-v2 hay v1.0.1, vì người đọc duy nhất (Desk) đã so theo chữ số.
   - Không cần nâng hợp đồng: quy ước chung đã nói response SĐT có `+`, nên đây là sửa mã cho đúng hợp đồng.
   - Lo ngại "ảnh hưởng client khác" không có cơ sở hiện tại (K17). Sửa sớm thì rẻ hơn sửa sau khi INT dựng adapter Zalo.
   - Lịch: **v1.1** (hoặc lượt LP-v2 kế nếu BE còn chỗ). Ghi vào nợ kỹ thuật. Thẻ BE-LPV2-11.

Các thẻ lượt 1 đóng ở lượt này: **FE-LPV2-05 (Major) đóng**. Cũng đóng FE-LPV2-06, BE-LPV2-08/09/10, OPS-LPV2-02, UXD-LPV2-01. Còn mở: ARC-LPV2-01 (việc của ARC, chưa thấy trong `architecture.md` và `decision-log.md`) và FE-LPV2-07 (v1.1).

### L2.3 Thẻ feedback mới

#### FB-R4-ARC-BE-LPV2-11
- Mức độ: Minor
- Vị trí: `services/api/src/modules/guests/internal/guests.service.ts` dòng 203–206 (handle `zalo`/`whatsapp` dạng SĐT lưu `r.e164` = `84…`); `guest-mapper.ts` dòng 58 (`messagingHandles: row.messaging_handles` trả nguyên); `docs/api/openapi.yaml` "Quy ước chung – SĐT".
- Vấn đề: `phone` trả `+84…` nhưng `messagingHandles.zalo/whatsapp` trả `84…`. Hai trường cùng là SĐT mà mỗi trường một dạng, trái quy ước "response luôn E.164 có `+`".
- Vì sao quan trọng: client nào so hay hiển thị handle cũng phải tự đoán dạng (Desk đã phải so theo chữ số). Adapter INT theo hợp đồng nhận dạng có `+`.
- Đề xuất sửa: trong mapper, với khóa `zalo`/`whatsapp` có giá trị toàn chữ số (đúng thứ `normalizePhone` lưu), trả `phoneForApi(v)`. Giữ nguyên dạng lưu trong DB, không cần migration. Sửa MSW mock cho cùng dạng. Sửa kỳ vọng `84900000121` trong `bug-r4-012-guest-nationality-null.test.ts` thành `+84900000121`. ARC thêm một câu vào mô tả `messagingHandles` ("handle dạng SĐT trả E.164 có `+`"). `messagingHandlesOf` của FE vẫn đúng vì so theo chữ số. Lịch: v1.1.
- Trạng thái: Open

#### FB-R4-ARC-OPS-LPV2-03
- Mức độ: Minor
- Vị trí: `services/api/turbo.json` `tasks.test.inputs`.
- Vấn đề: api test đọc hai nguồn nằm ngoài gói api mà turbo không băm: `packages/i18n/src/plural-forms.cases.json` (mới, BE-LPV2-10) và `design/copy/strings-*.json` (`gen-quote-copy --check`, có từ trước). api không phụ thuộc `@ottimo/i18n`. Hash của api test không đổi khi hai nguồn này đổi, và CI phát lại kết quả xanh từ `product/.turbo` (cache qua `actions/cache`).
- Vì sao quan trọng: bảng ca chung sinh ra để chặn lệch giữa hai bản `pluralForm`. Nếu có người sửa bảng cùng `translate.ts` thì i18n test chạy lại, còn api test có thể không chạy, và lệch lọt qua. Với chữ báo giá cũng vậy: sửa chữ trong `gen_strings.py` mà quên chạy `gen-quote-copy` thì có thể không bị bắt.
- Đề xuất sửa: thêm `"$TURBO_ROOT$/packages/i18n/src/plural-forms.cases.json"` và `"$TURBO_ROOT$/design/copy/strings-*.json"` vào `inputs`. Kiểm bằng `turbo run test --filter=@ottimo/api --dry=json` sau khi sửa tệp JSON: hash phải đổi. Chủ trì: OPS (BE làm cũng được). Đóng được cùng lượt LP-v2 kế.
- Trạng thái: Open

#### FB-R4-ARC-DATA-LPV2-01
- Mức độ: Minor
- Vị trí: `docs/metrics-definitions.md` dòng 381 và 442 (cơ cấu khách nội địa/nước ngoài lấy từ `Guest.nationality`, `is_foreigner`).
- Vấn đề: từ 0.3.10 bổ sung 5, hồ sơ có thể có quốc tịch NULL (tạo nhanh từ yêu cầu website, phần lớn là khách nói tiếng nước ngoài). Khi đó `is_foreigner = false`, nên công thức hiện tại đếm họ là khách nội địa.
- Vì sao quan trọng: cơ cấu khách là số INV dùng để quyết kênh bán (landing đa ngôn ngữ). Lệch dồn về phía "nội địa" đúng ở nhóm khách mà LP-v2 nhắm tới.
- Đề xuất sửa: với lượt lưu trú có giấy tờ, lấy cơ cấu theo `guest_document.is_foreigner` của người đứng tên (đúng nguồn của BR-009). Chỉ dùng hồ sơ khi không có giấy tờ, và tách nhóm thứ ba "Chưa rõ" khi `nationality_code IS NULL`. Cập nhật định nghĩa và truy vấn mẫu. DATA làm, DOM xác nhận cách gọi tên nhóm.
- Trạng thái: Open

#### FB-R4-ARC-DOM-LPV2-01
- Mức độ: Suggestion
- Vị trí: `modules/registration` (không ghi ngược quốc tịch vào hồ sơ có sẵn, K12); `docs/specs/EP06-registration.md` mục hồ sơ "từ giấy tờ".
- Vấn đề: khách Hàn tạo nhanh từ yêu cầu website (quốc tịch NULL), nhận phòng bằng hộ chiếu KOR, mà hồ sơ vẫn "–" mãi nếu lễ tân không tự sửa.
- Vì sao quan trọng: CRM và báo cáo theo hồ sơ thiếu đúng phần dữ liệu đã có trong tay. Không ảnh hưởng khai báo lưu trú.
- Đề xuất sửa: DOM quyết luật. Đề xuất của ARC: khi giấy tờ **chính** được lưu đủ và hồ sơ người đứng tên đang NULL, server điền alpha-2 từ giấy tờ (chỉ điền khi NULL, không ghi đè giá trị lễ tân đã chọn, có audit). BA ghi vào EP06, BE-C làm ở v1.1. Nếu DOM không muốn tự điền thì Desk hiện nhắc "Cập nhật quốc tịch hồ sơ theo giấy tờ".
- Trạng thái: Open

#### FB-R4-ARC-ARC-LPV2-02 (việc của ARC)
- Mức độ: Minor
- Vị trí: `docs/api/openapi.yaml` ví dụ request `createGuest` (`preferredContact: zalo`, không có `messagingHandles`); mô tả `Guest.isForeigner`.
- Vấn đề: ví dụ chính thức nay trái luật mà chính bổ sung 5 vừa ghi rõ. Ai làm theo ví dụ sẽ nhận 422. `isForeigner = false` chưa nói rõ trường hợp quốc tịch NULL.
- Đề xuất sửa: thêm `messagingHandles: { zalo: '0901 234 567' }` vào ví dụ. Ghi "`false` khi quốc tịch là `VN` hoặc chưa biết – không dùng để phân loại VN/NN theo BR-009 (theo giấy tờ)". Thêm câu về dạng `+` của handle (BE-LPV2-11). Chỉ sửa mô tả và ví dụ, không đổi schema. ARC làm cùng ARC-LPV2-01 ở bước Phản hồi & sửa.
- Trạng thái: Open

#### FB-R4-ARC-FE-LPV2-08
- Mức độ: Suggestion
- Vị trí: `apps/admin-web/src/pages/GuestFormDialog.tsx` `messagingHandlesOf` và điều kiện gửi `messagingHandles` khi sửa.
- Vấn đề:
  - (a) Hồ sơ Zalo trùng SĐT: `h.zalo` luôn được thay bằng `form.phone` (dạng `+84…` hoặc dạng gõ), khác chuỗi `84…` gốc. Vì vậy mỗi lần sửa bất kỳ trường nào, `messagingHandles` cũng bị gửi, dù không đổi gì.
  - (b) Hồ sơ đang dùng KakaoTalk, lễ tân đổi kênh sang WhatsApp: giá trị trong ô (ID KakaoTalk) bị ghi vào `whatsapp`, còn `kakaotalk` cũ vẫn giữ.
- Vì sao quan trọng: (a) sinh bản ghi audit "đổi liên hệ" không có thật. (b) lưu một ID KakaoTalk như số WhatsApp. Cả hai ít gặp, không chặn.
- Đề xuất sửa: (a) chỉ thay `h.zalo` khi `digits(phone) !== digits(h.zalo)`. (b) khi `preferredContact` đổi giữa `whatsapp` và `kakaotalk` mà ô không đổi, chuyển giá trị sang khóa mới và xóa khóa cũ, hoặc để UXD tách hai ô ở v1.1. Thêm 2 ca test.
- Trạng thái: Open

### L2.4 Kết luận lượt 2

- **Blocker: 0. Major: 0.** Minor mới: 4 (BE-LPV2-11, OPS-LPV2-03, DATA-LPV2-01, ARC-LPV2-02). Suggestion mới: 2 (DOM-LPV2-01, FE-LPV2-08).
- Major duy nhất của lượt 1 (FE-LPV2-05, quốc tịch) **đã đóng**. Hợp đồng 0.3.10 bổ sung 5 **được xác nhận**, và BUG-R4-011 **chốt cách (a)**.
- **LP-v2 @ `c37a0a76` đủ điều kiện sang QA lượt 4** về mặt kỹ thuật. Không thẻ mới nào chặn. OPS-LPV2-03 nên đóng trước khi gộp `lp-v2` vào `main` để cache CI không che lệch bảng số ít/nhiều. Các thẻ còn lại vào v1.1, PO xếp.
- Không có ESC. Toàn bộ nằm trong quyền kỹ thuật của đội. DATA/DOM tự quyết cách nhóm "Chưa rõ" và luật điền quốc tịch, không cần INV.
