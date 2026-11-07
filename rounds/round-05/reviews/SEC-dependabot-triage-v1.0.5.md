# SEC – Phân loại phụ thuộc trước tag v1.0.5 (Dependabot: 8 cảnh báo mở, 9 PR cũ, phạm vi PR `r5-deps`)

Round 5 · bước **Review** · SEC · 07/11/2026 · mốc cắt mã 13/11

## Nguồn đã đọc và cách kiểm

- `gh api repos/anhvh93-tech/ottimo-hotel-app-public/dependabot/alerts --paginate`: 18 cảnh báo, **8 mở** (#3, #4, #5, #6, #15, #16, #17, #19), 10 đã dismiss (#1, #2, #7–#14), #18 GitHub đã rút. Đọc mô tả từng advisory.
- `gh api /advisories?affects=<gói>` cho `nodemailer`, `react-router`, `minimatch`: kiểm có advisory mới nào sau lần phân loại 06/11 hay không.
- `gh pr view` và `gh pr diff --name-only` cho PR #1, #2, #5, #6, #9, #10, #11, #27, #36. Với mỗi job CI đỏ, đọc log lượt chạy gần nhất để biết đỏ vì thay đổi của PR hay vì base cũ.
- `product/pnpm-lock.yaml`, `pnpm why -r` (có `--prod`), `pnpm audit --json` (chỉ đọc) tại `origin/main` `036a7c3d`.
- Mã: `apps/admin-web/src` (mọi chỗ `navigate(`, `<Navigate`, `<Link`, `<NavLink`, `window.location`), `integrations/notification/smtp.ts`, `email-address.ts`, `eslint.config.js`, mã `@typescript-eslint/typescript-estree` 8.71.2 trong `node_modules`, `infra/docker/Dockerfile.*`, `infra/caddy/Caddyfile.*`, `.github/workflows/ci.yml`, `release.yml`, `.github/dependabot.yml`.
- npm registry (`npm view`, chỉ đọc), Docker Hub registry API (chỉ đọc manifest và config của `node:22-alpine`, `caddy:2-alpine`), `nodejs.org/dist/index.json`, release notes `nodejs/node` v22.23.4, `nodemailer` 10.1.5–10.3.1, `caddyserver/caddy` v2.11.8–v2.11.9 và advisory của Caddy.
- Đối chiếu lần trước: `rounds/round-05/outputs/SEC/dependabot-triage.md` (06/11, `1543be77`), plan R5 V5-41, quyết định 6 và 7, backlog R5-B-01, R5-B-02.
- Giới hạn: chỉ đọc. Không dismiss cảnh báo, không đóng hay gộp PR, không sửa `package.json`/lockfile/Dockerfile, không đổi cài đặt repo, không gọi staging hay production.

Tệp này không có bí mật, địa chỉ IP, địa chỉ email thật hay dữ liệu khách.

---

## 0. Kết luận

1. **8 cảnh báo mở, đều Medium, 5 advisory.** Không có High hay Critical. Không có advisory mới chạm bản đang dùng kể từ 06/11. **Không cần ESC.**
2. **Sửa trước tag: 6 cảnh báo `nodemailer`** (#4–#6, #15–#17), qua một PR OPS `r5-deps`, là việc V5-41. Mã lỗi nằm trên đường gửi thư của image api/worker, nhưng không khai thác được (mục 2.1). Vẫn sửa vì bản vá rẻ, là gói runtime trên repo công khai, và V5-41 đã có trong v1.0.5.
3. **`react-router` #3 → v1.0.6** (R5-B-01, nâng cùng toolchain FE). Giữ mở, không dismiss. Đã rà lại Desk trên `main` mới nhất và 8 PR FE đang mở. Không có nguồn đường dẫn từ ngoài nào chưa qua `safeInternalPath` (mục 2.2).
4. **`minimatch` #19 → giữ chấp nhận có hạn tới 30/11** (R5-B-02). Gói chỉ có ở công cụ dev. Vẫn chưa có bản cài được (`typescript-estree` 8.72.1 và canary vẫn khai báo `^10.2.2`). Không override, không dismiss.
5. **Ngoài cảnh báo Dependabot, SEC thấy một bản vá runtime nên vào trước tag.** Mọi image đang chạy **Node 22.23.3**. Node 22.23.4 (20/10) là bản bảo mật, sửa 6 CVE (http, dns, tls, permission, crypto, brotli; OpenSSL 3.5.9). PR Dependabot #27 đã có đúng thay đổi này, và CI xanh trên base 01/11. SEC đề nghị đưa vào `r5-deps`. Lưu ý: Dependabot không tạo cảnh báo cho image Docker, nên không ai thấy việc này qua tab Security.
6. **PR cũ:** #9, #10, #11 đóng (có bản thay). #27 vào `r5-deps`. #36 không gộp trước tag. #1, #2, #5, #6 để v1.0.6, vì là bản lớn có rủi ro phá, CI đỏ vì chính thay đổi, hoặc PR CI không kiểm được (mục 3).

---

## 1. Bảng cảnh báo mở

Mức "Medium" là `medium` của API, giao diện GitHub ghi "moderate".

| # | Gói (bản đang dùng) | Manifest | Advisory | Mức | Bản vá | Phạm vi, dịch vụ | Mã lỗi chạm được trong OTTIMO? | Quyết định |
|---|---|---|---|---|---|---|---|---|
| 4 | `nodemailer` 10.0.16 (trực tiếp, ghim) | `product/integrations/package.json` | GHSA-85x2-q946-cp5h (`>` trong local part có ngoặc kép) | Medium | 10.1.4 | **Runtime.** `@ottimo/integrations` → `@ottimo/api` (`deploy --prod`) → image **api/worker** (worker gửi `staff.email`), cùng script `infra/server/mail-test.mjs` | Code có chạy: `addressparser` đọc `to`. Không khai thác được, vì `isEmailAddress` chỉ cho `[a-z0-9._%+-]@nhãn.nhãn`, chặn `"` `(` `)` `;` `<` `>` và khoảng trắng trước khi tới envelope. `from` là object `{name, address}` lấy từ cấu hình máy chủ. Không dùng `mailparser`. Rủi ro thực tế: **Low** | **Sửa trước tag** (`r5-deps`, V5-41) |
| 5 | như trên | `product/integrations/package.json` | GHSA-m943-m63m-w62w (`;` trong chuỗi ngoặc kép hoặc comment) | Medium | 10.1.4 | như trên | như trên | **Sửa trước tag** |
| 6 | như trên | `product/integrations/package.json` | GHSA-8c8m-p3m8-cjg8 (comment lồng nhau) | Medium | 10.1.4 | như trên | như trên | **Sửa trước tag** |
| 15 | `nodemailer` 10.0.16 | `product/pnpm-lock.yaml` | GHSA-85x2-q946-cp5h | Medium | 10.1.4 | Cùng gói, báo lần hai theo lockfile (`relationship: inconclusive`) | như #4 | **Sửa trước tag**. Tự đóng khi lockfile trên `main` có bản mới |
| 16 | như trên | `product/pnpm-lock.yaml` | GHSA-m943-m63m-w62w | Medium | 10.1.4 | như trên | như #5 | **Sửa trước tag** |
| 17 | như trên | `product/pnpm-lock.yaml` | GHSA-8c8m-p3m8-cjg8 | Medium | 10.1.4 | như trên | như #6 | **Sửa trước tag** |
| 3 | `react-router` 6.30.6 (gián tiếp qua `react-router-dom` ^6.30.1) | `product/pnpm-lock.yaml` | GHSA-wrjc-x8rr-h8h6 / CVE-2026-53669 (chuyển hướng ra ngoài bằng `\` trong `<Link>`, `useNavigate`) | Medium | 7.18.0. Nhánh 6.x không có bản vá; 6.30.6 đã là bản 6 cuối | **Runtime, chỉ admin-web (Desk):** bundle tĩnh trong image web, chạy trên trình duyệt nhân viên. guest-web, mobile, landing không dùng | **Không khai thác được.** Nguồn đường dẫn từ ngoài duy nhất là `location.state.from`, luôn qua `safeInternalPath` và danh sách mục menu. Đích mới từ 07/11 có tiền tố cố định (mục 2.2). Rủi ro thực tế: **Low** | **v1.0.6** (R5-B-01, cùng toolchain FE). Giữ mở, không dismiss |
| 19 | `minimatch` 10.2.6 (gián tiếp) | `product/pnpm-lock.yaml` | GHSA-g3hv-75wg-m249 / CVE-2026-118764 (treo CPU qua mẫu glob) | Medium | 11.0.1 (bản lớn) | **Chỉ dev:** root `typescript-eslint` 8.71.2 → `@typescript-eslint/typescript-estree`. Không vào image nào (`pnpm why -r --prod minimatch` rỗng). 3.1.5 và 5.1.9 nằm ngoài dải | **Không.** `typescript-estree` chỉ gọi `minimatch` ở `allowDefaultProject` của `projectService` (`useProgramFromProjectService.js` dòng 244). `eslint.config.js` dùng `tseslint.configs.recommended` và không bật `projectService`. Mẫu glob lấy từ repo. Rủi ro thực tế: **Low** | **v1.0.6 / xem lại 30/11** (R5-B-02). Chưa có bản cài được. Không override, không dismiss, giữ mở để tự đóng khi bản vá về |

**Không dismiss cảnh báo nào.** #3 và #19 để mở làm việc theo dõi. Cả hai đều có bản vá ở bản lớn kế tiếp, nên dismiss sẽ che mất lúc cần nâng.

---

## 2. Chi tiết chạm được

### 2.1 `nodemailer`

- Chỉ một importer: `product/integrations`, `dependencies`, ghim `10.0.16`. `pnpm audit` khớp với Dependabot: 3 advisory, `< 10.1.4`.
- CSDL advisory toàn cầu (07/11): mọi advisory `nodemailer` khác chỉ chạm ≤ 10.0.12. Không advisory nào chạm ≥ 10.1.4.
- `SmtpAdapter.send` kiểm `isEmailAddress(msg.to)` trước `sendMail`. Luật này là luật email chung của OTTIMO (`email-address.ts`), cũng là luật API dùng khi lưu địa chỉ. Ba mẫu tấn công đều cần `"`, `(`, `)`, `;` hoặc `<`/`>` trong địa chỉ, nên bị chặn trước parser.
- Mục 4 của V5-41 (không log `err.permanent`, `info.serverMessageId` từ 10.2.0) **đã đạt theo thiết kế**. `mapSmtpError` chỉ lấy `code`, `responseCode` và mã trạng thái mở rộng `x.y.z` bằng regex, không đọc trường nào khác. `send` chỉ xem `info.rejected.length`. Vẫn giữ test.
- Thay đổi từ 10.0.16 tới 10.3.1 (release notes):
  - 10.1.x sửa `addressparser`, gồm 3 advisory. 10.1.5–10.1.6 làm lại tokenizer, 10.1.7 sửa `mime-funcs`. Từ 10.1.x cách chạy phiên SMTP cũng đổi, nên phải thử qua relay staging.
  - 10.2.0 thêm `err.permanent`, `info.serverMessageId`, `pendingCount()`. 10.2.1 sửa comment ở `Content-Type`.
  - 10.3.0–10.3.1 thêm tùy chọn `otp` (header `OTP-Token`) và sửa mã hóa `Content-ID`. OTTIMO không dùng hai thứ này, thư không có ảnh nhúng.
- Bản mới nhất là **10.3.1**, phát hành 29/10 lúc 12:31Z. Theo quy ước "bản ≥ 2 tuần tuổi", bản này dùng được từ **12/11 lúc 19:31 giờ Việt Nam**. **10.2.1** (22/10) đã đủ tuổi từ 05/11.

### 2.2 `react-router` ở Desk: rà lại trên `main` 07/11

- So với lần rà 06/11 (`64025107`), Desk có thêm **một** đích điều hướng: `app/attention.ts` dòng 261–266 (`dcb14f11`, 07/11, US-177 AC7).
  - Đích này dùng `item.link` do máy chủ trả, và chỉ khi chuỗi bắt đầu bằng `/audit?`. Nếu không, Desk dùng chuỗi cố định.
  - Máy chủ dựng link từ tháng nghiệp vụ và `actorUserId`, là UUID lấy từ CSDL (`attention-sources.ts` dòng 221).
  - Đầu chuỗi cố định, nên không tạo được `//` hay `/\`. Không đổi kết luận.
- Các đích khác giữ như bảng mục 2.2 của lần 06/11: hằng số, tiền tố cố định cộng ID, `navigate(-1)`, và `location.state.from` qua `safeInternalPath` (`session/safePath.ts`, có từ `b7a19585` 23/10, test mẫu `\` ở `r3-s1-fea.test.tsx`).
- 8 PR FE đang mở (#98, #134, #136, #137, #138, #141, #156, #159): diff không thêm `navigate(`, `<Navigate`, `<Link`, `<NavLink`, `window.location`, `window.open` hay `useSearchParams` nào (grep dòng `+`).
- Advisory `react-router` khác: GHSA-337j-9hxr-rhxg (`deserializeErrors`, ≥ 6.4.0) đã dismiss `inaccurate` 26/10. Lý do vẫn đúng, vì Desk dùng `BrowserRouter` khai báo, không SSR, không có hydration data. GHSA-jjmj-jmhj-qwj2 đã vá ở 6.30.6.
- **Khi nâng ở v1.0.6:** đích tối thiểu **7.18.2**, không phải 7.18.0, để ra khỏi dải GHSA-chx6-hx7r-mcp5 (High, DoS khi khớp route, ≥ 7.0.0 < 7.18.0) và GHSA-qwww-vcr4-c8h2 (RSC, < 7.18.2). Bản v7 mới nhất là 7.18.5. Nhánh 8.x (8.5.1) do ARC quyết.

### 2.3 `minimatch`

- Không đổi so với 06/11: `typescript-eslint` latest 8.72.1, canary 8.72.2-alpha.11, `typescript-estree` vẫn khai báo `minimatch ^10.2.2`. `minimatch` 10.x không có bản vá; bản 11 mới nhất là 11.0.5.
- PR #36 nâng `typescript-eslint` lên 8.72.1 nhưng **không** sửa #19.
- Giữ nguyên R5-B-02: xem lại 30/11. Khi đó vẫn chưa có bản thì gia hạn và ghi lý do.

---

## 3. PR Dependabot cũ

"CI gần nhất" là lượt chạy cuối trên head của PR. PR nào cũ hơn 04/11 thì CI đã cũ so với `main` hiện tại.

| PR | Nội dung (tệp) | Sửa cảnh báo nào? | Bản lớn, rủi ro phá | CI gần nhất, vì sao đỏ | Quyết định |
|---|---|---|---|---|---|
| #1 | `actions/upload-artifact` 4.6.2 → 7.0.2, ghim SHA (3 chỗ trong `.github/workflows/ci.yml`) | Không. Không có cảnh báo. CI hiện có cảnh báo "Node.js 20 is deprecated", và action này đang bị ép chạy trên Node 24 | **Có**, ba bản lớn (v7 chuyển ESM, thêm `archive`). Artifact `image-digests` là đầu vào của `release.yml` (`gh run download -n image-digests`). Artifact này chỉ upload ở job `publish images (GHCR)` khi push `main`, nên **CI của PR không kiểm được** đường này | 23/10, đỏ vì base cũ: gitleaks báo nhầm ở tệp test cũ, test oracle BR-610. Không phải do thay đổi | **Để sau tag (v1.0.6).** Đổi action upload ngay trước tag là đặt rủi ro lên chính đường phát hành v1.0.5, mà không được gì về bảo mật. v1.0.6: OPS rebase, gộp, xem job `publish images` trên `main` xanh, rồi chạy thử `release.yml` với một tag staging |
| #2 | nhóm `react`: `react`, `react-dom` 18.3.1 → 19.3.1, `@types/react`, `@types/react-dom` 19 (admin-web, guest-web, mobile, ui, i18n, lockfile) | Không | **Có**, bản lớn runtime ở cả ba app | 04/11, đỏ vì chính thay đổi: typecheck mobile `TS2503: Cannot find namespace 'JSX'` (`App.tsx`, `TasksPage.tsx`, `RoomPage.tsx`) | **Để sau (v1.0.6+), toolchain FE có ADR ARC**, cùng R5-B-01. Không gộp trước tag |
| #5 | `@vitejs/plugin-react` 5.2.0 → 6.1.2 (3 app, lockfile) | Không | **Có.** 6.x khai báo peer `vite ^8.0.0`, trong khi app đang dùng `vite` 7.3.7. Không nâng riêng được | 23/10, đỏ vì base cũ | **Để sau**, cùng Vite 8 trong toolchain FE. Đóng (có bản thay) khi PR toolchain mở |
| #6 | `jsdom` 26.1.0 → 30.1.3 (dev/test; admin-web, guest-web, landing-web, mobile, ui) | Không. Chỉ dùng trong test, không vào image | **Có**, bốn bản lớn. Bản mới nhất đã là 31.0.0, nên PR này cũ | 04/11, đỏ vì chính thay đổi: test mobile H20, H21, H22, P-05 hỏng (không tìm thấy chữ, đếm 0 thay vì 1) | **Để sau (v1.0.6)**, cùng toolchain FE, kèm sửa test. Đóng khi Dependabot mở bản 31 hoặc khi gộp vào toolchain |
| #9 | `nodemailer` 10.0.16 → 10.1.4 (`integrations/package.json`, lockfile) | Có, cả 6 cảnh báo | Không (minor) | 24/10, job docker E2E đỏ vì môi trường (UI cases skipped), base cũ | **Đóng: có bản thay là `r5-deps`.** Đích V5-41 là ≥ 10.1.7, 10.1.4 thiếu các sửa `addressparser` 10.1.5–10.1.7 (V5-41 tiêu chí 6) |
| #10 | bản team của #9 (`ops/nodemailer-10.1.4`), cùng 2 tệp | như #9 | Không | 26/10, job API contract đỏ vì base cũ. Docker E2E xanh | **Đóng: có bản thay là `r5-deps`** |
| #11 | `nodemailer` 10.1.4, **chỉ** `integrations/package.json` (Dependabot security update theo manifest con) | Có thể sửa, nhưng không cài được | Không | 26/10, đỏ: `ERR_PNPM_OUTDATED_LOCKFILE`. Lockfile của workspace nằm ở `/product`, PR này không sửa | **Đóng: có bản thay là `r5-deps`** |
| #27 | digest `node:22-alpine` `0a7108b…` → `fe4f6d7…` (5 dòng `FROM` trong `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.landing`) | Không phải cảnh báo Dependabot. Đây là **bản vá bảo mật runtime**: Node 22.23.3 → **22.23.4** (`security: true`, 20/10, 6 CVE), Alpine 3.24.2 → 3.24.3. Image tạo 21/10, đã đủ 2 tuần | Không (bản vá trong cùng dòng 22) | 01/11, **xanh cả 8 job PR có lúc đó**, kể cả `docker images build · E2E smoke`. Job `confidential paths` thêm sau (04/11, `488a3044`), nên phải chạy lại trong `r5-deps`. `mergeStateStatus: CLEAN` | **Đưa vào `r5-deps`** (lấy nguyên commit `56c7a0f1`). Dependabot tự đóng #27 khi digest trên `main` đã đổi |
| #36 | nhóm `minor-and-patch`, 13 gói: `nodemailer` 10.3.1, `astro` 7.4.4, `@astrojs/check`, `typescript-eslint` 8.72.1, `@playwright/test` 1.64.1, `@axe-core/playwright`, 4 gói `@fontsource/*` 5.3.x, `turbo`, `@swc/core`, `fake-indexeddb` | Có cho 6 cảnh báo `nodemailer`. **Không** sửa `minimatch` #19 | Không có bản lớn, nhưng có hai lỗi: `astro` 7.4.4 đòi `node >= 22.23.4`, nên build web image (Node 22.23.3) đỏ; landing E2E đỏ ở TC-LP-009 "hero fetched once" (tải 2 lần thay vì 1). Font thương hiệu đổi bản | 04/11, đỏ 2 job: `landing LP-v1 · Playwright` và `docker images build · E2E smoke` | **Không gộp trước tag.** Chỉ lấy `nodemailer` vào `r5-deps`. Phần còn lại để v1.0.6: sau khi `r5-deps` gộp, Dependabot tự rebase và bỏ `nodemailer`. Ràng buộc Node của `astro` khi đó đã đạt. Còn phải sửa test hero preload, và UXD/QA kiểm font thương hiệu cùng ngân sách landing |

---

## 4. Phạm vi PR OPS `r5-deps` (trước tag v1.0.5)

**Mục đích:** một PR, hai thay đổi, sửa 6 cảnh báo `nodemailer` và đưa image lên bản vá bảo mật Node. Không có gì khác. Theo ma trận review, PR qua ARC + SEC; INT xem phần SMTP (chủ V5-41).

### 4.1 Đúng 5 tệp được đổi

| Gói / image | Từ | Đến | Tệp |
|---|---|---|---|
| `nodemailer` | 10.0.16 | **10.3.1** nếu gộp từ **12/11 lúc 19:31 giờ Việt Nam** trở đi. Gộp sớm hơn thì dùng **10.2.1**. Luật: bản 10.x mới nhất đã đủ 14 ngày tuổi lúc gộp. Cả hai bản đều đạt V5-41 (≥ 10.1.7) | `product/integrations/package.json` (ghim chính xác, không `^`), `product/pnpm-lock.yaml` |
| `node:22-alpine` | `sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402` (Node 22.23.3) | `sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914` (Node 22.23.4, Alpine 3.24.3). Không lấy digest mới hơn `0e17547…` (05/11, chưa đủ 2 tuần) | `product/infra/docker/Dockerfile.api` (2 dòng `FROM`), `Dockerfile.web` (2), `Dockerfile.landing` (1) |

Điều kiện về diff:
- `git diff --stat origin/main...r5-deps` ra **đúng 5 tệp** trên.
- Lockfile chỉ đổi 4 chỗ của `nodemailer`: `importers.integrations` (specifier, version), mục `packages` (`resolution.integrity`), mục `snapshots`. Mẫu giống diff của PR #10.
  - Integrity phải khớp npm: 10.3.1 `sha512-uF0AFsJC07Y1vdW7p580DKAnh7rAO+4UPSSB3mDCPNDufoiaOebV6JmrzpxB14OjEEEiBsNdYoM2Y+fN8M7BBA==` (trùng với lockfile của PR #36); 10.2.1 `sha512-ZrDNsPFoDMwefNs7sJwrYiEJ/CG4ClJWDZv05iNJsEBWa8GRDry1QJHTJxsuTAY9eDDKjX4k+q3SxslXJOao7w==`.
- Không thêm `pnpm.overrides`, không đổi `.nvmrc`, `engines`, `packageManager`.

**Không đưa vào `r5-deps`:** `typescript-eslint`, `astro`, `@astrojs/check`, `@playwright/test`, `@axe-core/playwright`, `@fontsource/*`, `turbo`, `@swc/core`, `fake-indexeddb`, `react`/`react-dom` 19, `jsdom`, `@vitejs/plugin-react`, `vite`, `react-router`, `actions/upload-artifact`, `caddy:2-alpine`, `fast-uri`, override `minimatch`.

### 4.2 Phải xanh trước khi gộp (trên đúng SHA head, sau khi đã merge `origin/main` mới nhất vào nhánh)

1. **Đủ 9 job CI của PR**, không chỉ 4 job bắt buộc của branch protection:
   - `format · lint · audit · test · build`: gồm `pnpm install --frozen-lockfile`, `pnpm audit --audit-level=high`, Vitest có `integrations/notification/smtp.test.ts` và `email-address.test.ts`;
   - `landing LP-v1 · Playwright (axe, CSP, budgets)`;
   - `infra scripts (shellcheck)`: gồm `mail-test.sh` (`mail-test-send.test.sh`);
   - `confidential paths (internal pricing tables)`;
   - `no test endpoints in production contract`;
   - `OpenAPI lint (Redocly)`;
   - `API contract (spec validator · RBAC --strict)`;
   - `gitleaks`;
   - **`docker images build · E2E smoke`**: build image api (production, `INCLUDE_TEST_SUPPORT=0`) và web trên Node 22.23.4, smoke `/health`, E2E.
2. **Một lượt T9 bằng tay** trên nhánh (`workflow_dispatch`, `t9 = true`) xanh, để có tín hiệu E2E thật, có retry guard.
3. **Build `Dockerfile.landing` tại chỗ một lần**, vì CI của PR không build image landing (chỉ job publish trên `main` build). Lệnh `docker build -f product/infra/docker/Dockerfile.landing product`, tham số mặc định. Ghi vào mô tả PR: build xong, và `node --version` ở stage build là `v22.23.4`.
4. Ghi vào mô tả PR `docker run --rm --entrypoint node <image api vừa build> --version` → `v22.23.4`, và `pnpm why nodemailer -r` chỉ còn một bản (10.3.1 hoặc 10.2.1).

### 4.3 Sau khi gộp, trước khi cắt tag

1. Lượt CI `push` trên `main` xanh, gồm `publish images (GHCR)` (lần này build cả image landing) và `deploy staging`.
2. **`mail-test` qua relay staging** (V5-41 tiêu chí 5; INT chạy, OPS hỗ trợ). Địa chỉ nhận chỉ đưa qua stdin. Biên bản chỉ ghi OK hoặc mã lỗi, không ghi địa chỉ.
3. `gh api …/dependabot/alerts --paginate -q '.[] | select(.state=="open") | .number'` chỉ còn **#3 và #19**. Cảnh báo #4–#6, #15–#17 chuyển `fixed`.
4. OPS đóng PR #9, #10, #11, mỗi PR một dòng "superseded by r5-deps (#…)". Kiểm #27 đã tự đóng; chưa thì đóng cùng lý do. Không đóng #36 (Dependabot tự rebase).
5. PO thêm một dòng **Ghi chú kỹ thuật** ở release notes v1.0.5: "Thư viện gửi thư `nodemailer` 10.3.1 (hoặc 10.2.1), Node.js 22.23.4 trong image". Không cần câu nào cho người dùng.

Không kịp gộp trước mốc cắt mã 13/11: tag v1.0.5 vẫn cắt được. Mức rủi ro thực tế của cả hai việc là Low (mục 2.1; Node không có CVE nào SEC chứng minh được là chạm tới OTTIMO). Khi đó `r5-deps` thành việc đầu tiên của v1.0.6, ORC báo SEC. Không cần ESC.

---

## 5. Thấy thêm ngoài cảnh báo Dependabot

| Việc | Hiện trạng | Có chạm OTTIMO? | Quyết định |
|---|---|---|---|
| Node trong image | 22.23.3. Bản 22.23.4 (20/10) là bản bảo mật: CVE-2026-105481 (http agent), -105482 (dns), -106069 (tls, IP không chuẩn), -106073 (permission model), -106074 (crypto), -111497 (brotli), cùng OpenSSL 3.5.9, c-ares 1.34.9, undici 6.29.1 | api/worker gọi TLS ra ngoài (SMTP relay) và chạy HTTP server. SEC không chấm từng CVE. Đây là runtime production, bản vá cùng dòng 22, CI #27 xanh | **Trước tag**, trong `r5-deps` (mục 4) |
| `caddy:2-alpine` trong image web, landing | v2.11.7 (Alpine 3.23.6). Caddy 2.11.8 (04/11) sửa 5 advisory: GHSA-r766-rf9f-588h (High, root dựa trên `{host}`), GHSA-25cw-38mq-q7m6 (`try_files` đọc `/x/./` thành tệp, vượt luật đuôi), GHSA-69hv-5jfc-mvmv (`rewrite` với `{http.matchers.file.remainder}`), GHSA-jf74-f69g-hcj9 (thư mục data rơi về `./caddy`), GHSA-f278-mgc7-46j3 (`php_fastcgi`). 2.11.9 (05/11) sửa hồi quy | **Không**, xét theo `Caddyfile.prod` và `Caddyfile.landing`: root là `/srv/{args[0]}` và `/srv/landing`, không dùng `{host}`; không có `php_fastcgi`, không dùng `matchers.file.remainder`; image đặt `XDG_DATA_HOME=/home/caddy/data`. Luật `(^|/)\.` vẫn chặn tệp chấm. Luật đuôi `\.map$` vượt được qua `/x.map/./`, nhưng image không có tệp `.map`: Vite chỉ sinh map khi `SOURCEMAP=1`, mà không Dockerfile hay CI nào đặt biến này | **v1.0.6.** 2.11.8 có thay đổi phá (từ chối cấu hình hoặc request mơ hồ) và chưa đủ 2 tuần trước 13/11. Phải đổi **cả 6 chỗ ghim** trong một PR: `Dockerfile.web`, `Dockerfile.landing`, `infra/ci/check-caddy-prod.sh`, `check-caddy-landing.sh`, `test-edge.sh`, `infra/server/bin/init-secrets.sh`. Dependabot chỉ đổi 2 Dockerfile. Nếu chỉ đổi đó, CI kiểm một bản Caddy khác bản chạy thật. Điều kiện giữ kết luận "không chạm": không ai bật `SOURCEMAP=1` cho image |
| `fast-uri` (cảnh báo #7–#14 đã dismiss `not_used` 26/10) | 4.2.2 (api, qua `fastify`) và 3.1.8 (dev, `@astrojs/check`). Bản vá 4.2.3 và 3.1.9 (19/10) **nằm trong dải** gói cha cho phép (`^4.0.0`, `^3.0.1`) | Lý do dismiss vẫn đúng | **v1.0.6**, làm mới lockfile trong dải (`pnpm update fast-uri -r`, không đổi `package.json`). Không mở lại cảnh báo |

---

## 6. Việc cho v1.0.6 (đề nghị PO ghi backlog)

- **R5-B-01 (giữ, bổ sung):** toolchain FE trong một ADR ARC:
  - React 19 (#2, sửa namespace `JSX`);
  - Vite 8 + `@vitejs/plugin-react` 6 (#5);
  - `jsdom` 31 (#6, sửa test mobile H20–H22, P-05);
  - `react-router` **≥ 7.18.2** (sửa #3, ra khỏi dải hai advisory High của 7.x; 7.18.5 là bản v7 mới nhất).
  
  SEC grep lại các chỗ điều hướng Desk khi PR mở.
- **R5-B-02 (giữ):** `minimatch` #19, xem lại 30/11.
- **Mới, B-BAOMAT:** Caddy ≥ 2.11.9, đổi 6 chỗ ghim cùng lúc (mục 5).
- **Mới, B-KYTHUAT:**
  - `actions/upload-artifact` v7 (#1), thử `release.yml` với tag staging;
  - phần còn lại của nhóm `minor-and-patch` (#36 sau rebase): `astro` 7.4.x, sửa TC-LP-009 hero preload, UXD xem font `@fontsource` 5.3 so với brand guideline;
  - làm mới `fast-uri` trong dải.

---

## 7. Thẻ feedback

### FB-R5-SEC-OPS-DEPS-01
- Mức độ: Major
- Vị trí: PR mới `r5-deps`. `product/integrations/package.json`, `product/pnpm-lock.yaml`, `product/infra/docker/Dockerfile.api`, `Dockerfile.web`, `Dockerfile.landing`
- Vấn đề:
  - 6 cảnh báo `nodemailer` (#4–#6, #15–#17) vẫn mở trên `main`. V5-41 chưa có PR.
  - Cả ba image đang chạy Node 22.23.3, trong khi 22.23.4 là bản bảo mật từ 20/10.
  - Ba PR `nodemailer` cũ (#9, #10, #11) ghim 10.1.4, thấp hơn đích V5-41. #11 còn không cài được (thiếu lockfile).
- Vì sao quan trọng: gói gửi thư và runtime Node nằm trong image api/worker production, trên repo công khai. Cảnh báo mở lúc cắt tag làm cổng QC và release notes phải giải thích thêm.
- Đề xuất sửa: mở `r5-deps` đúng phạm vi mục 4.1. Đạt đủ mục 4.2 trước khi gộp, mục 4.3 sau khi gộp. Gộp trước mốc cắt mã 13/11. Mời ARC, SEC review; INT xem phần SMTP.
- Trạng thái: Open

### FB-R5-SEC-OPS-DEPS-02
- Mức độ: Minor
- Vị trí: `product/infra/docker/Dockerfile.web` dòng 36, `Dockerfile.landing` dòng 32, `infra/ci/check-caddy-prod.sh` dòng 28, `check-caddy-landing.sh` dòng 29, `test-edge.sh` dòng 18, `infra/server/bin/init-secrets.sh` dòng 54
- Vấn đề: Caddy ghim v2.11.7. Bản 2.11.8–2.11.9 sửa 5 advisory (1 High). Cấu hình OTTIMO hiện không chạm advisory nào (mục 5). Dependabot docker chỉ đổi 2 Dockerfile, không đổi 4 script CI và `init-secrets.sh`.
- Vì sao quan trọng: nếu chỉ gộp PR Dependabot, CI kiểm luật header, 413 và che log trên một bản Caddy khác bản chạy production. Ngược lại, giữ 2.11.7 lâu thì mất các lớp chặn đường dẫn mới.
- Đề xuất sửa: ở v1.0.6, một PR OPS đổi cả 6 chỗ sang một digest ≥ 2.11.9 đã đủ 2 tuần. Đọc phần "breaking changes" của 2.11.8 với `Caddyfile.prod`/`Caddyfile.landing`, chạy đủ `infra scripts`. Thêm một kiểm trong `check-caddy-prod.sh`: mọi chỗ ghim Caddy trong repo phải cùng một digest.
- Trạng thái: Open

### FB-R5-SEC-OPS-DEPS-03
- Mức độ: Suggestion
- Vị trí: `.github/dependabot.yml`
- Vấn đề:
  - `jsdom` và `@vitejs/plugin-react` ra PR riêng (#5, #6), dù chỉ nâng được cùng Vite và React.
  - Dependabot security update theo manifest con `/product/integrations` (#11) không sửa lockfile của workspace, nên luôn đỏ.
- Vì sao quan trọng: PR đỏ nằm lâu làm khó thấy PR nào thật sự cần gộp.
- Đề xuất sửa:
  - ở v1.0.6, thêm `jsdom` và `@testing-library/*` vào nhóm `vite` (hoặc một nhóm `fe-toolchain`);
  - ghi trong README OPS: PR security update thiếu lockfile thì đóng và làm lại qua nhánh team;
  - giữ nguyên chính sách `audit --audit-level=high`.
- Trạng thái: Open

---

## 8. Giả định

- Quy ước "bản ≥ 2 tuần tuổi" (decision-log 23/10, INT) áp cho cả digest image Docker, tính từ ngày tạo image, và tính tại lúc gộp vào `main`.
- Giờ trong tệp là giờ Việt Nam (UTC+7), trừ khi ghi `Z`.
- Mốc cắt mã 13/11 là hạn gộp vào `main`. Staging tự deploy khi push `main`, nên `mail-test` staging làm được sau khi gộp.
- Danh sách job CI của PR lấy từ `ci.yml` và lượt chạy xanh gần nhất trên `main` (run 42288028732). Job publish/deploy chỉ chạy khi push `main`.

## 9. Điểm làm tốt

- Mọi image và action đều ghim theo digest/SHA, nên đọc được chính xác bản Node, Alpine, Caddy đang chạy. Nhờ đó mới thấy được khoảng trống Node 22.23.3.
- `isEmailAddress` là một luật chung, dùng cho cả API, adapter và script, nên 3 advisory `addressparser` không có đường khai thác.
- `safeInternalPath` cùng quy ước "đích có tiền tố cố định" vẫn giữ ở mã mới (`attention.ts` 07/11).

| 2026-11-07 | 5 | **SEC – phân loại phụ thuộc trước tag v1.0.5** (`rounds/round-05/reviews/SEC-dependabot-triage-v1.0.5.md`): 8 cảnh báo Dependabot mở, đều Medium, 5 advisory, không High/Critical, không ESC. **`nodemailer` #4–#6, #15–#17 → sửa trước tag** trong một PR OPS `r5-deps` (V5-41): ghim 10.3.1 nếu gộp từ 19:31 ngày 12/11 (giờ VN), gộp sớm hơn thì 10.2.1; code chạy nhưng không khai thác được vì `isEmailAddress`. **`react-router` #3 → v1.0.6** (R5-B-01, đích ≥ 7.18.2), giữ mở; Desk không có nguồn đường dẫn ngoài nào chưa qua `safeInternalPath`, đích mới `attention.ts` (07/11) có tiền tố cố định, 8 PR FE mở không thêm chỗ điều hướng. **`minimatch` #19 → giữ chấp nhận có hạn tới 30/11** (R5-B-02), chỉ dev, chưa có bản cài được, không override, không dismiss. **`r5-deps` đúng 5 tệp**: `nodemailer` + digest `node:22-alpine` fe4f6d7 (Node 22.23.4, bản bảo mật 20/10; lấy commit của PR #27), không gói nào khác; phải xanh đủ 9 job CI trên đúng SHA, một lượt T9 tay, build `Dockerfile.landing` tại chỗ; sau gộp: publish images + deploy staging xanh, `mail-test` staging, chỉ còn cảnh báo #3 và #19 mở. PR #9, #10, #11 đóng (có bản thay); #27 vào `r5-deps`; #36 không gộp trước tag (`astro` 7.4.4 cần Node ≥ 22.23.4, landing TC-LP-009 đỏ); #1, #2, #5, #6 để v1.0.6 (bản lớn; CI đỏ vì chính thay đổi hoặc PR CI không kiểm được `image-digests`). Caddy 2.11.7 → ≥ 2.11.9 ở v1.0.6, đổi cả 6 chỗ ghim (5 advisory 04/11 không chạm cấu hình OTTIMO) | SEC | Review – quyền SEC về mức rủi ro và yêu cầu bảo mật kỹ thuật (protocol mục 1); `r5-deps` không gộp kịp 13/11 thì thành việc đầu v1.0.6, không chặn tag |
