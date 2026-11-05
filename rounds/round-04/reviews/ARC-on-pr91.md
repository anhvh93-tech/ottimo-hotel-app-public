# ARC – Review PR #91 (BUG-R4-053, bản sửa cho lần cắt lại v1.0.4, đường A)

- Round 4 (v1.0.4), bước **Review**, 05/11/2026, đọc lúc 15:30–15:40 ICT.
- PR #91 `v104/fix-ru-notice-locale` → `main`, head **`19c9a2e7`**, cắt từ `7b2d79ec`, 1 commit, `MERGEABLE`.
- ARC đã đọc:
  - `gh pr view 91`, `gh pr diff 91`, `gh pr checks 91`, log job `format · lint · audit · test · build` (chỉ đọc);
  - báo cáo BE `rounds/round-04/outputs/BE/v1.0.4-fix-ru-notice-locale.md` (trên đĩa, chưa commit);
  - SEC `SEC-on-ru-notice-locale-drill.md` mục 4–5; OPS `v1.0.4-ci-turbo-inputs.md` (BUG-R4-029);
  - `guest-web` `config.ts`, `i18n.tsx`, `units.test.ts`, `turbo.json`; `api` `turbo.json`, `vitest.config.mts`, `tsconfig.build.json`; `Dockerfile.api`.
- ARC chạy A1' bằng git, và chạy `turbo run test --dry=json` trên worktree riêng ở scratchpad (`wt-arc-pr91`, đã trả mọi tệp về như cũ).
- ARC không push, không gộp, không duyệt deploy, không bình luận trên PR.

## 0. Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

- **Mã và phạm vi: đạt.** Đúng quy tắc SEC mục 4.1–4.5. Không migration, không `registration`, không `docs/api`, hợp đồng API giữ nguyên.
- **A1' trên head: đạt** (mục 2). Chạy lại trên bản gộp thử với `origin/main` `1b8f1a14` cũng ra đúng kết quả đó.
- **CI lúc đọc:**
  - 8/9 job xanh, trong đó có `format · lint · audit · test · build` (9 phút 16 giây). `api:test` chạy thật, không lấy từ cache;
  - còn `docker images build · E2E smoke` đang chạy (mục 3).
- **Điều kiện (1 thẻ Major):** FB-R4-ARC-BE-PR91-01.
  - Test G-RU đọc `apps/guest-web/src/app/i18n.tsx`, nhưng tệp này chưa được khai trong `tasks.test.inputs` của `product/services/api/turbo.json`.
  - Hậu quả: khi chỉ `i18n.tsx` đổi, turbo vẫn lấy kết quả `api:test` từ cache. G-RU xanh giả, đúng trong ca nó được viết ra để bắt.
  - Cách sửa: thêm **1 dòng**. ARC đề xuất làm trong PR này, trước khi gộp.
- Gộp khi đủ ba ý:
  - (a) thẻ 01 đã đóng theo một trong hai cách ở mục 4;
  - (b) CI của head cuối xanh hết, gồm cả `docker images build · E2E smoke`;
  - (c) SEC và QA đã review xong.

## 1. Mã

| Ý | Kết quả |
|---|---|
| Quy tắc | `noticeLocaleShown(current, g.locale)`. Bảng `NOTICE_LOCALES_BY_VERSION` đã đóng băng: v1 = vi, en; v2 = vi, en, ru; phiên bản lạ = vi, en. Khớp đúng SEC 4.2 |
| Chỉ khóa riêng | `Object.hasOwn` chặn `constructor`, `__proto__`. Test U-d có ca cho việc này |
| `current` | Là phiên bản hiện hành, và đã bắt buộc bằng `body.noticeVersion` (`NOT_IN_LIST` nếu khác), nên bằng chứng ghi cùng phiên bản với văn bản đang hiện |
| Nơi ghi và đọc cột | `git grep` ở head: `notice_locale` chỉ được ghi ở `update`, và không API nào trả cột này. Vì vậy ghi `ru` không làm vỡ serializer, enum hay Desk |
| Kiểu | `LOCALES = ['vi','en','ru']` trùng `GUEST_LOCALES`. Hàm trả `Locale`. CI typecheck xanh |
| Ranh giới module | Hằng xuất ra từ `internal/`, chỉ test dùng. CI chạy `module-boundaries` và `guest-portal-boundaries` đều xanh |
| Image | `tsconfig.build.json` chỉ gồm `src`, nên các test mới không vào `dist`. Image chỉ đổi do `guest-portal.service.ts` |
| Quay lui v1.0.3 | Vẫn đúng như ARC S16 mục 1 ý 3. Không migration, cột kiểu `text` không có CHECK, và v1.0.3 không đọc cột này |
| Test | Có đủ (a)–(d) trên PostgreSQL thật qua HTTP. Ca (a) kiểm thêm cặp `consent_record` `ru\|guest_app`, tức là cặp S16. `guest-portal.test.ts:563` giữ nguyên khẳng định `en`, chỉ đổi tên thành ca (c) |

## 2. A1' trên head `19c9a2e7` (ARC chạy, chỉ dùng git)

| Ý | Lệnh | Kết quả |
|---|---|---|
| Mã ngoài tài liệu | `git diff --name-only 0d11db20 19c9a2e7 -- product ':!product/docs' .github` | Đúng 4 tệp: `guest-portal.service.ts`, `test/bug-r4-053-notice-locale.test.ts`, `test/integration/bug-r4-053-ru-notice-locale.test.ts`, `test/integration/guest-portal.test.ts` |
| Bản thân commit PR | `git diff --name-only 7b2d79ec 19c9a2e7` | Đúng 4 tệp trên |
| Ngoài `rounds`, `product/docs` | `git diff --name-only 0d11db20 19c9a2e7 -- . ':!rounds' ':!product/docs'` | 4 tệp trên, cộng `01-decisions/decision-log.md`. Tệp này là tài liệu gốc, có từ các commit tài liệu `0d11db20..7b2d79ec`, không thuộc PR |
| Hợp đồng | `git diff --name-only 0d11db20 19c9a2e7 -- product/docs/api` | Rỗng |
| Cây `infra` | `git rev-parse 19c9a2e7:product/infra` | `afce70adc393129b391d92afbef1a5553e3b4175`, giống `0d11db20` |
| Journal | `_journal.json` ở cả `0d11db20` và `19c9a2e7` | 72 mục, đúng 1 mục `0095`, mục cuối `0095_privacy_notice_append_only_whole_row`. Thư mục `src/db` không đổi |
| Phụ thuộc | `package.json`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig*`, `*.config.*` | Không đổi |
| Gộp thử | `git merge-tree --write-tree origin/main 19c9a2e7` cho cây `bd7371a1`, rồi chạy lại 3 ý đầu | Vẫn đúng 4 tệp, `docs/api` rỗng, `infra` = `afce70ad…`. `main` `1b8f1a14` so với `0d11db20` không có thay đổi ngoài tài liệu |

**A1' đạt.** Nếu thẻ 01 sửa trong PR, dùng tiêu chí **A1''** ở mục 4 thay cho A1'.

## 3. CI của PR (đọc lúc 15:32–15:33 ICT)

- Run `41993899061`, sự kiện `pull_request`, head `19c9a2e7`.

| Job | Trạng thái |
|---|---|
| gitleaks; confidential paths; no test endpoints; OpenAPI lint; API contract; shellcheck | xanh |
| landing LP-v1 · Playwright | xanh (5 phút 48 giây) |
| format · lint · audit · test · build | **xanh** (08:22:05Z → 08:31:21Z, 9 phút 16 giây) |
| docker images build · E2E smoke | **đang chạy** (bắt đầu 08:31:25Z) |

Log bước test:
- `@ottimo/api:test`: `cache miss, executing 1e7223baa807ae32`.
  - 171 tệp đạt, 2 bỏ qua (173). 4165 ca đạt, 19 bỏ qua, 1 todo. Khớp số BE chạy trên máy;
  - `bug-r4-053-ru-notice-locale.test.ts`: 4 ca. `bug-r4-053-notice-locale.test.ts`: 9 ca. `production-bootstrap.test.ts`: 11 ca, không có ca nào bỏ qua.
- 13 task `test` còn lại lấy từ cache (`Cached: 13 cached, 14 total`). Đúng như mong đợi, vì đầu vào của các gói đó không đổi. Không thay được P0 "unit không cache" trên `SHA_V104b`: OPS vẫn chạy `--force` như ARC S16 mục 3.2.
- `api:typecheck` và `api:build`: cache miss, xanh.

## 4. Câu hỏi riêng: G-RU đọc `RU_UNREVIEWED_LEGAL` của guest-web

### 4.1 Phụ thuộc chéo gói: chấp nhận được, tạm thời

- Test chỉ đọc mã nguồn guest-web dạng văn bản (`readFileSync` theo `__dirname`). Không `import`, không thêm phụ thuộc workspace, không đổi `tsconfig`. Vì vậy không tạo vòng phụ thuộc và không đổi thứ tự `^build`.
- Không ảnh hưởng image: `Dockerfile.api` dùng `turbo prune @ottimo/api` và chỉ build `src`, không chạy test.
- Đã có tiền lệ: test G1 của P4-16 đọc `apps/guest-web/src/app/config.ts`, và tệp đó **đã khai** trong `api/turbo.json`.
- Phụ thuộc này hết khi làm danh sách dùng chung ở v1.0.5 (FB-R4-ARC-BE-S16-03).

### 4.2 Đầu vào turbo: **lệch, đúng loại lỗi BUG-R4-029**

- `product/services/api/turbo.json` `tasks.test.inputs` có `config.ts`, nhưng **không có `i18n.tsx`**.
- Luật OPS (decision-log 04/11, BUG-R4-029): test đọc tệp ngoài gói thì phải khai tệp đó.
- ARC thử bằng `turbo run test --dry=json --filter=@ottimo/api` trên worktree riêng, mỗi lần sửa xong đều trả tệp về như cũ:

| Thử | Băm `@ottimo/api#test` |
|---|---|
| Head `19c9a2e7` nguyên trạng | `14d27695f5602cd9` |
| Đặt lại `'gw.notice_body'` vào `RU_UNREVIEWED_LEGAL`. Đây đúng là phép đột biến BE dùng để chứng minh G-RU | `14d27695f5602cd9`, **không đổi** |
| Đối chứng: thêm một dòng trống vào `config.ts` | `21a36ace32719e06`, đổi |
| Thêm dòng `i18n.tsx` vào `inputs` | `bec081c473d41cde` |
| Thêm dòng đó, rồi làm lại phép đột biến trên | `1205681d3074de2a`, đổi |

- CI khôi phục cache theo tiền tố `turbo-${runner.os}-` (`ci.yml:110–111`).
- Vì vậy một PR sau chỉ sửa guest-web sẽ được phát lại kết quả `api:test`. Đây chính là kiểu lệch đã gây BUG-R4-053: P4-42 chỉ đổi guest-web, còn server bị quên.
- Bản phát hành này **không** bị ảnh hưởng: CI của PR đã chạy thật `api:test`, và P0 chạy `--force` trên `SHA_V104b`.

## 5. Thẻ feedback

### FB-R4-ARC-BE-PR91-01
- Mức độ: Major
- Vị trí: `product/services/api/turbo.json` `tasks.test.inputs`. Liên quan G-RU ở `product/services/api/test/bug-r4-053-notice-locale.test.ts:90–131`
- Vấn đề: G-RU đọc `apps/guest-web/src/app/i18n.tsx`, nhưng tệp này không phải đầu vào của `api#test`. Phép thử ở mục 4.2: đổi `RU_UNREVIEWED_LEGAL` mà băm task không đổi.
- Vì sao quan trọng:
  - G-RU là chốt chặn tái phát duy nhất phía server cho BUG-R4-053, và sẽ xanh giả trong CI khi chỉ guest-web đổi;
  - chiều lệch nguy hơn: guest-web khóa lại RU, server vẫn ghi `ru`. Đó là "ghi khống" ngôn ngữ, điều quyết định (a) 17/10 cấm;
  - đồng thời vi phạm luật BUG-R4-029 ngay trên SHA phát hành.
- Đề xuất sửa:
  - Thêm đúng một dòng ngay sau dòng `config.ts`:
    ```
    "$TURBO_ROOT$/apps/guest-web/src/app/i18n.tsx",
    ```
  - **Cách 1 (ARC đề xuất): sửa trong PR này, trước khi gộp.**
    - BE thêm 1 commit, không rebase, không force-push. Kiểm: trong kết quả `turbo run test --dry=json --filter=@ottimo/api`, mảng `inputs` có `../../apps/guest-web/src/app/i18n.tsx`.
    - Giá: thêm một lượt CI PR, khoảng 20 phút (lượt này: build-test 9 phút 16 giây, cộng docker/E2E). Vẫn xa mốc chuyển B lúc 06/11 10:15.
    - SEC và QA chỉ cần xác nhận head mới, vì phần thêm là 1 dòng cấu hình test, không có mã chạy.
    - **A1''** (ARC nới A1' cho đúng tệp này) thay A1' cho head mới và cho `SHA_V104b`:
      1. `git diff --name-only 0d11db20 <SHA> -- product ':!product/docs' .github` ra **đúng 5 tệp**: 4 tệp ở mục 2, cộng `product/services/api/turbo.json`;
      2. `git diff --numstat 0d11db20 <SHA> -- product/services/api/turbo.json` = `1	0`, và dòng thêm đúng là dòng trên;
      3. ba ý còn lại giữ nguyên: `docs/api` rỗng, `infra` = `afce70adc393…`, journal 72 mục và 1 mục `0095`.
    - Tệp này chỉ đổi khóa cache của turbo, không đổi `dist` hay `infra`. Vì vậy S1–S15 vẫn giữ theo ARC S16 mục 3.3.
    - OPS ghi A1'' vào bảng 0.1 r3 (FB-R4-ARC-OPS-S16-02).
  - **Cách 2 (chỉ khi ORC thấy đường găng không chịu thêm 20 phút):**
    - gộp `19c9a2e7`, giữ A1' 4 tệp;
    - BE mở PR tiếp theo chỉ gồm dòng trên, **ngay sau production v1.0.4**, ngoài lúc đóng băng, vẫn trong round 4;
    - tới khi PR đó gộp, không gộp PR nào đụng `apps/guest-web/src/app/i18n.tsx`. ORC ghi điều này vào decision-log.
- Trạng thái: Open

### FB-R4-ARC-BE-PR91-02
- Mức độ: Suggestion (v1.0.5, cùng FB-R4-ARC-BE-S16-03)
- Vị trí: G-RU, `bug-r4-053-notice-locale.test.ts:108–131`
- Vấn đề:
  - G-RU chỉ suy "trang hiện RU" từ việc `RU_UNREVIEWED_LEGAL` trống. Nhưng `legalLocale('ru')` của guest-web còn cần **mọi** `LEGAL_KEYS` có chuỗi RU (`legalReady`, `i18n.tsx:51–55`);
  - G-RU cũng áp một tập chung cho mọi phiên bản.
  - Hiện chưa hở: `units.test.ts:142` của guest-web khóa `legalLocale('ru') === 'ru'`, và guest-web chỉ mang một phiên bản.
- Đề xuất sửa: khi làm danh sách dùng chung (sinh từ `gen_strings.py`), sinh luôn "ngôn ngữ đủ chữ pháp lý theo phiên bản" cho cả hai phía. Bỏ việc đọc mã nguồn guest-web, và bỏ dòng `inputs` ở thẻ 01.
- Trạng thái: Open

## 6. Việc tiếp theo

1. **BE:** thẻ 01, theo cách 1. Báo SHA head mới cho ORC.
2. **ARC:** chạy A1'' trên head mới, ghi kết quả bổ sung vào tệp này. Chỉ cần khoảng 5 phút, không review lại mã.
3. **ORC:** gộp với `--match-head-commit <head mới>`, sau khi CI xanh hết và SEC + QA đã review. Đóng băng `main` từ lúc gộp tới khi `deploy staging` xong (ARC S16 mục 5 ý 3).
4. **OPS:** bảng 0.1 r3 ghi A1'' và số `api` làm mốc "số ca không giảm": 4165 đạt, 19 bỏ qua, 1 todo, 171 tệp đạt + 2 bỏ qua. Cách 1 không thêm ca nào.
5. Thẻ **FB-R4-ARC-BE-S16-01**: ARC đánh dấu **Done** khi gộp xong. Phạm vi đúng, và A1'/A1'' đạt.

## 7. Giả định

1. Lượt CI kế tiếp có thời gian tương tự lượt này. Job docker/E2E của lượt này sẽ xanh, nếu không thì ORC báo lại ARC.
2. Không có PR nào khác gộp vào `main` trước PR #91, nên kết quả gộp thử ở mục 2 vẫn đúng. Nếu có, ARC chạy lại A1'/A1''.

Điểm nên giữ:
- BE chứng minh test bắt được lỗi bằng cả mã chưa sửa (1 đỏ) và đột biến (4 đỏ, G-RU đỏ), không chỉ báo "xanh".
- BE dời bảng từ `platform` về `guest-portal` trước khi push, để giữ đúng phạm vi A1'. Nhờ vậy S1–S15 giữ được.
- Quy tắc theo từng phiên bản ghi đúng `en` cho ca tab v1.0.3 còn mở trong lúc H05 vẫn ở v1.
