# SEC – Phân loại cảnh báo Dependabot (Round 5, Sản xuất, Gói 0)

- Người làm: SEC | 06/11/2026 | Round 5, Gói 0.
- Nguồn đã đọc:
  - `gh api repos/anhvh93-tech/ottimo-hotel-app-public/dependabot/alerts --paginate` (18 cảnh báo; 8 mở, 10 đã đóng); `.../alerts/18` trả HTTP 410 "withdrawn";
  - `product/pnpm-lock.yaml` tại `64025107` (mục `importers`), `pnpm why -r` (có `--prod`), `Dockerfile.api|web|landing`;
  - npm registry (`npm view`, chỉ đọc): `typescript-eslint`, `@typescript-eslint/typescript-estree`, `minimatch`, `nodemailer`;
  - log hai lượt Dependabot `minimatch` lỗi (run 41573607059 ngày 03/11, run 42216172237 ngày 06/11);
  - mã `apps/admin-web/src` (grep các chỗ điều hướng, bỏ thư mục test);
  - lần phân loại trước: `rounds/round-04/reviews/SEC-v104-dependabot-triage.md` (05/11).
- Giới hạn: chỉ đọc. Không dismiss cảnh báo nào trên GitHub, không sửa `package.json`/lockfile, không gọi staging/production.

## 0. Kết luận

- **8 cảnh báo mở, đều mức Medium, 5 advisory.** Không có High hay Critical. Không cần ESC.
- **`nodemailer` (6 cảnh báo): (a) v1.0.5, V5-41 đã có.** Phạm vi đúng như V5-41: một gói, một importer, vào image api/worker. Mục 2.3.
- **`react-router` #3: (b) B-BAOMAT, giữ mở.** Desk chỉ có một chỗ đưa đường dẫn từ ngoài vào `navigate`, và chỗ đó đã qua `safeInternalPath` từ 23/10, có test đúng các mẫu `\`. Không cần thêm việc vào Gói 4. Nâng 7.18+ làm cùng lần nâng toolchain FE.
- **`minimatch` #19: (b) B-KYTHUAT, chấp nhận có hạn, giữ mở, không ép bản.** Gói chỉ có ở công cụ dev. Nhánh mã lỗi không chạy trong OTTIMO, vì cấu hình lint không bật `projectService`, và hàm lỗi chỉ chạy khi `optimizationLevel` ≥ 2.
- **Câu của QC R4 về lockfile chỉ đúng một phần.** `minimatch` 3.1.5 và 5.1.9 nằm ngoài mọi dải. Bản 10.2.6 thì **nằm trong** dải của GHSA-g3hv-75wg-m249 ở cả hai lượt job. Mục 2.1.

## 1. Bảng xếp loại

| Cảnh báo | Gói: bản đang dùng → bản vá | Advisory | Ở đâu (phạm vi, app, image) | Nhánh lỗi chạy được trong OTTIMO? | Nâng có phá gì? | Xếp | Đích, lý do |
|---|---|---|---|---|---|---|---|
| #19 | `minimatch` 10.2.6 → 11.0.1 | GHSA-g3hv-75wg-m249 (CVE-2026-118764): treo CPU qua mẫu glob | Dev. Gián tiếp qua `typescript-eslint` 8.71.2 → `@typescript-eslint/typescript-estree`. Không có trong image nào: api dùng `deploy --prod`; web và landing chỉ chép `dist` tĩnh | **Không.** Gói chỉ gọi `minimatch` ở `allowDefaultProject` của `projectService`. `eslint.config.js` dùng `tseslint.configs.recommended`, không bật `projectService`. Lệnh gọi không đặt `optimizationLevel` nên giữ mặc định 1, mà hàm lỗi chỉ chạy khi mức này ≥ 2. Mẫu glob lấy từ cấu hình trong repo | Chưa có bản cài được. `typescript-estree` 8.72.1 (latest) và 8.72.2-alpha.11 (canary) vẫn khai báo `^10.2.2`, còn 10.x không có bản vá. Ép override lên 11.x là đổi bản lớn ngoài dải nhà phát triển đã thử, có thể làm hỏng lint | **(b) B-KYTHUAT** | Chấp nhận có hạn tới **30/11/2026**, hoặc sớm hơn nếu `typescript-eslint` ra bản dùng `minimatch` ≥ 11.0.1 (PR nhóm `minor-and-patch` sẽ kéo về). Giữ cảnh báo mở |
| #3 | `react-router` 6.30.6 (qua `react-router-dom` ^6.30.1) → 7.18.0 | GHSA-wrjc-x8rr-h8h6 (CVE-2026-53669): chuyển hướng ra ngoài bằng `\` trong `<Link>`/`useNavigate` (vòng qua CVE-2025-68470) | Runtime, chỉ `apps/admin-web` (Desk): bundle tĩnh trong image web, chạy trên trình duyệt nhân viên. guest-web, mobile, landing không dùng | **Không.** Nguồn đường dẫn duy nhất từ ngoài là `location.state.from`, qua `safeInternalPath` + danh sách mục menu (mục 2.2) | Đổi bản lớn 6 → 7. Desk ở chế độ khai báo (`BrowserRouter`), chưa bật cờ `future`. Việc cần làm: `v7_startTransition` (test `MemoryRouter` có thể phải `await`) và `v7_relativeSplatPath` (chỉ một route `*`, dẫn đường tuyệt đối). Cả bộ test Desk phải chạy lại | **(b) B-BAOMAT** | Không thêm việc vào Gói 4 (điều kiện của plan R5 quyết định 7 không xảy ra). Nâng cùng toolchain FE (PR Dependabot #2 React 19, #5 plugin-react). Giữ cảnh báo mở |
| #4, #5, #6 | `nodemailer` 10.0.16 → 10.1.4 | GHSA-85x2-q946-cp5h, GHSA-m943-m63m-w62w, GHSA-8c8m-p3m8-cjg8 (`addressparser`) | Runtime, `product/integrations/package.json` (trực tiếp, ghim 10.0.16) → `@ottimo/api` → image **api/worker** | Mã lỗi nằm trên đường gửi thư thật. Không khai thác được, vì `isEmailAddress` chặn `"` `(` `)` `;` `<` `>` ở `to`, còn `from` lấy từ cấu hình máy chủ (phân tích R4 mục 2.1, chưa đổi) | 10.1.x đổi cách chạy phiên SMTP, nên phải thử qua relay thật | **(a) v1.0.5 Gói 4** | **V5-41** (đã có). Phạm vi ở mục 2.3 |
| #15, #16, #17 | như trên | cùng 3 advisory, báo lần hai theo `pnpm-lock.yaml` | như trên | như trên | như trên | **(a) v1.0.5 Gói 4** | V5-41. Tự đóng khi lockfile trên `main` có bản mới |
| #1, #2, #7–#14 | `esbuild` 0.18.20, `react-router` (SSR), `fast-uri` 3.1.8/4.2.2 | 6 advisory | Đã dismiss 23/10 và 26/10 (`not_used`, `inaccurate`) | Lý do đóng còn đúng: bản và cách dùng không đổi, không có mã nào import `fast-uri`/`ajv` trực tiếp, Desk vẫn không SSR | – | **(c) giữ đóng** | Không mở lại |
| #18 | – | – | GitHub đã rút (HTTP 410) | – | – | không cần làm | Suy luận: đây là cảnh báo cũ của GHSA-g3hv, từ trước khi dải được thu hẹp (mục 2.1) |

## 2. Chi tiết

### 2.1 `minimatch` #19 và câu của QC R4

**Diễn biến** (lấy từ advisory và định nghĩa job trong log Dependabot):
- 30/10: GHSA-g3hv-75wg-m249 công bố với dải `< 11.0.1`. Job 03/11 (run 41573607059) ghi đúng dải này.
- 04/11 16:50Z: advisory thu hẹp dải thành `>= 7.0.0, < 11.0.1`.
- 06/11 12:14Z: cảnh báo #19 mở, job 42216172237 chạy, ghi dải mới. #18 đã bị rút.
- 06/11 12:46Z: QC commit cổng đóng R4. Lúc này #19 đã mở.
- Cả hai job đều lỗi `security_update_not_possible`, `lowest-non-vulnerable-version: 11.0.1`. Lý do: bản gói cha cho phép không lên được 11.x.

**Đối chiếu câu QC.** Cổng đóng R4 mục 5, điểm 2 viết: "đều nằm ngoài các dải bị ảnh hưởng ghi trong job".

| Bản trong lockfile | Đến từ | 5 advisory cũ (vá ở 3.1.4 / 5.1.8 / 10.2.3 hoặc sớm hơn) | GHSA-g3hv, job 03/11 (`< 11.0.1`) | GHSA-g3hv, job 06/11 (`>= 7.0.0, < 11.0.1`) |
|---|---|---|---|---|
| 3.1.5 | `eslint`, `eslint-plugin-jsx-a11y` (dev) | ngoài | trong | ngoài |
| 5.1.9 | `openapi-typescript` → `@redocly/openapi-core` (dev, `api-client`) | ngoài | trong | ngoài |
| 10.2.6 | `typescript-eslint` → `typescript-estree` (dev) | ngoài | trong | **trong** |

Câu QC đúng với 5 advisory cũ. Câu đó sai với GHSA-g3hv đối với bản 10.2.6, ở cả hai job. Câu đúng nên là: *"3.1.5 và 5.1.9 nằm ngoài mọi dải hiện hành. 10.2.6 đã qua các bản vá cũ nhưng nằm trong dải GHSA-g3hv-75wg-m249 (≥ 7.0.0, < 11.0.1). Chưa có bản cài được, vì `typescript-estree` khai báo `^10.2.2`."* Plan R5 quyết định 6 đã ghi đúng ý này. SEC chỉ xác nhận, không cần QC sửa tệp cổng đã đóng.

**Vì sao chấp nhận được:**
- Gói không có trong image nào (`pnpm why -r --prod minimatch` rỗng).
- Nhánh lỗi không chạy, như bảng mục 1 đã nêu.
- Mẫu glob lấy từ tệp trong repo. CI chạy PR theo `pull_request`, không dùng `pull_request_target`. Ai sửa được cấu hình lint thì vốn đã chạy được mã tùy ý trong `eslint.config.js`, nên lỗi này không mở thêm đường tấn công nào.
- Mức rủi ro thực tế: **Low**.
- Không ép override. Lợi ích bằng 0, mà có thể làm hỏng lint.
- Không dismiss. Để cảnh báo mở, nó tự đóng khi bản vá về.
- Job `audit` vẫn xanh (`--audit-level=high`). Đây là chính sách đã chọn, không phải lỗi.

### 2.2 `react-router` #3: Desk có đưa địa chỉ do người dùng nhập vào `<Link>`/`navigate` không?

Advisory chỉ có hại khi **chuỗi đường dẫn do kẻ tấn công kiểm soát** được truyền vào `<Link to>`, `<Navigate to>` hay `navigate()`. Lỗi không cần SSR hay loader. SEC grep `apps/admin-web/src` tại `64025107`, so lại với lần R4 (`a92f55a6`). Kể từ R4 chỉ thêm một đích là `/reservations/${reservationId}`.

| Loại đích | Ví dụ | Kẻ tấn công kiểm soát được? |
|---|---|---|
| Chuỗi cố định, `NAV`, `homePath()` | `/login`, `/security`, `rack.path`; `l.to` của `attention.ts` khi là hằng số | Không |
| Tiền tố cố định + ID (route param hoặc ID máy chủ trả) | `/reservations/${id}`, `/registration/${id}`, `/website-requests/${id}` | Không đổi được đầu chuỗi, nên không tạo được `//` hay `/\` ở đầu |
| Tiền tố cố định + query đã `encodeURIComponent` | `/reservations?q=${encodeURIComponent(code)}` | Không |
| Giá trị query đọc vào (`q`, `view`, `focus`, `open`, `tab`) | `ReservationsPage`, `RegistrationPage`, `MoneyPage`, `ReservationDrawer` | Chỉ dùng làm ô tìm hoặc so với hằng số. Không đưa vào điều hướng |
| **`location.state.from`** (đặt từ `pathname + search` ở `app/routes.tsx` dòng 84, 94) | `LoginPage.afterLoginPath` | **Có**, qua liên kết dài. Nhưng luôn qua `safeInternalPath` (`session/safePath.ts`): bỏ `\` thô và `%5C`, ký tự điều khiển, `//`, dạng giải mã ra `//`, khác origin. Sau đó chỉ cho đi tới mục menu vai đó mở được |
| `navigate(-1)` | `AppShell`, `ChangePasswordPage`, `Enroll2faPage` | Lịch sử trình duyệt, không phải chuỗi |

- Test `__tests__/r3-s1-fea.test.tsx` (bộ `SEC_VECTORS`/`MORE`) có đúng các mẫu của advisory, cả kiểm qua hàm lẫn qua luồng đăng nhập thật.
- Lớp chặn có ở các bản phát hành từ `v1.0.0-rc.1` (`b7a19585`, 23/10). v1.0.4 cũng có.
- Mức rủi ro thực tế: **Low**.
- Biện pháp này dựa vào một quy ước: không đưa chuỗi từ query, hash hay state vào điều hướng mà không qua `safeInternalPath`. Vì vậy, tới khi lên 7.18+, SEC grep lại các chỗ điều hướng ở mỗi bản có PR FE chạm điều hướng.

### 2.3 `nodemailer`: xác nhận phạm vi V5-41

- **6 cảnh báo = 3 advisory × 2 manifest** (`integrations/package.json` và `pnpm-lock.yaml`).
- Chỉ một importer: `product/integrations`, `dependencies`, ghim `10.0.16`. Gói vào image api/worker qua `@ottimo/api` → `@ottimo/integrations`. Không có trong web.
- CSDL advisory toàn cầu (`gh api /advisories?affects=nodemailer`): ngoài 3 advisory trên, không advisory nào khác chạm 10.0.16, và không advisory nào chạm ≥ 10.1.4.
- Đích ≥ 10.1.7 của V5-41 giữ nguyên, vì 10.1.5–10.1.6 sửa thêm `addressparser` (SEC R4). Bản mới nhất hiện là **10.3.1** (29/10), tới 12/11 là đủ 2 tuần tuổi theo quy ước ARC.
- **Phạm vi V5-41 nên ghi đủ** (lấy từ SEC R4 mục 3, chưa đổi):
  1. ghim đúng bản 10.x mới nhất (≥ 10.1.7) ở `integrations/package.json`, không thêm `pnpm.overrides`;
  2. sinh lại lockfile chỉ cho gói này;
  3. chạy `smtp.test.ts` và `infra/server/test/mail-test-send.test.sh`;
  4. `mapSmtpError` không log `err.permanent` hay `info.serverMessageId` (thêm từ 10.2.0) nếu chúng chứa địa chỉ;
  5. chạy `mail-test` qua relay staging trước khi phát hành, vì 10.1.x đổi cách chạy phiên SMTP;
  6. đóng PR Dependabot #9 và #11 (ghim 10.1.4);
  7. sau khi gộp, kiểm 6 cảnh báo chuyển `fixed`.
- Hạn: nếu v1.0.5 trễ quá **20/11**, ORC báo SEC xem lại (giữ như R4).

## 3. Đề xuất

- **Thêm vào v1.0.5: không có việc mới.** V5-41 đã đủ. Chỉ đề nghị PO ghi 7 điểm ở mục 2.3 vào tiêu chí nghiệm thu của V5-41.
- **Backlog:**
  - B-BAOMAT: "Nâng `react-router-dom` 6 → `react-router` 7.18+ cho Desk, làm cùng toolchain FE (React 19, plugin-react 6). Trước đó bật thử cờ `v7_startTransition` và `v7_relativeSplatPath` trên 6.30.x để thấy test nào hỏng."
  - B-KYTHUAT: "Đóng `minimatch` #19 khi `typescript-eslint` dùng `minimatch` ≥ 11.0.1. SEC xem lại ngày 30/11. Nếu khi đó vẫn chưa có bản, gia hạn chấp nhận và ghi lý do. Không override."
- **Không dismiss trên GitHub.** #3, #19 và 6 cảnh báo `nodemailer` để mở, để còn theo dõi việc nâng.

## 4. Dòng decision-log đề xuất (ORC ghi)

```
| 2026-11-06 | 5 | **SEC – phân loại Dependabot, Gói 0** (`rounds/round-05/outputs/SEC/dependabot-triage.md`): 8 cảnh báo mở, đều Medium, 5 advisory; không ESC. **`nodemailer` #4–#6, #15–#17 → (a) v1.0.5 V5-41**: 3 advisory `addressparser`, một importer (`integrations`), image api/worker; ngoài 3 advisory này không advisory nào chạm 10.0.16; ghim 10.x mới nhất (≥ 10.1.7, hiện 10.3.1), smtp test + `mail-test` staging, đóng PR #9/#11. **`react-router` #3 → (b) B-BAOMAT, giữ mở**: nguồn đường dẫn ngoài duy nhất là `location.state.from` qua `safeInternalPath` (có từ v1.0.0-rc.1, test mẫu `\`); không thêm việc vào Gói 4; nâng 7.18+ cùng toolchain FE. **`minimatch` #19 → (b) B-KYTHUAT, chấp nhận có hạn tới 30/11, giữ mở, không override**: chỉ dev (`typescript-eslint`), không vào image; nhánh lỗi không chạy (không bật `projectService`, `optimizationLevel` mặc định 1); chưa có bản cài được (`typescript-estree` ^10.2.2). Câu QC R4 mục 5 "đều nằm ngoài các dải" đúng cho 3.1.5/5.1.9, sai cho 10.2.6 (trong dải GHSA-g3hv ≥ 7.0.0 < 11.0.1); plan R5 quyết định 6 đã ghi đúng. #1, #2, #7–#14 giữ đóng; #18 GitHub đã rút | SEC | Sản xuất |
```
