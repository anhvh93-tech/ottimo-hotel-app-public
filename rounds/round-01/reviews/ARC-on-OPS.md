# ARC review OPS – Round 1, Bước 3

- Người review: ARC | Ngày: 15/10/2026 | Loại: review bắt buộc (plan R1 mục 5)
- Phạm vi đã đọc: `product/package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.nvmrc`, `.dockerignore`, `.prettierrc.json`, `.prettierignore`, `eslint.config.js`, `.env.example`; `services/api/**` (src + test + config); `apps/{admin-web,mobile,guest-web}/**`; `packages/contracts/**`; `integrations/**` (khung OPS); `infra/docker-compose.yml`, `infra/docker/Dockerfile.{api,web}`, `infra/caddy/Caddyfile.dev`, `infra/postgres/init/01-extensions.sql`; `.github/workflows/ci.yml`, `.github/dependabot.yml`; `docs/dev-setup.md`, `docs/hosting-plan.md`; `rounds/round-01/outputs/OPS/report.md`.
- Cách soát: OPS chưa chạy được gì (máy không có Node/Docker), ARC cũng không có Node/Docker → soát tay từng file theo hành vi đã biết của pnpm 9, Turborepo 2, ESLint 9 flat config, TypeScript 5.7, Vitest 2, NestJS 11, Prettier 3, Docker/Compose v2. Các điểm "có thể làm CI đỏ" ghi rõ mức chắc chắn.
- Kết luận nhanh: khung **đúng kiến trúc** (ADR-001/002/003/008/012) và đã đủ chi tiết để R2 bắt tay. Không tìm thấy lỗi chắc chắn làm CI đỏ ngay ở khung rỗng; có **1 lỗi thiết kế sẽ gãy ở runtime ngay khi R2 import package dùng chung** (thẻ 01) mà tsc lẫn Vitest đều không bắt được, và **1 xung đột với yêu cầu bảo mật trong hosting-plan** (thẻ 09).

---

### FB-R1-ARC-OPS-01
- Mức độ: Major
- Vị trí: `packages/contracts/package.json` và `integrations/package.json` (`"type": "module"`, `exports: { ".": { "types", "import" } }`); `services/api/package.json` (`"type": "commonjs"`), `services/api/tsconfig.json` (`module: CommonJS`, `moduleResolution: Node10`)
- Vấn đề: `services/api` là CommonJS, còn hai package dùng chung là ESM và `exports` **chỉ có điều kiện `import`**. Hiện API chỉ `import type { HealthResponse }` (bị xóa khi biên dịch) nên chưa lộ lỗi. Nhưng R2 API sẽ import **giá trị chạy** từ hai package này (`MockNotificationAdapter`, `IntegrationRegistry`, zod schema, bảng chuyển trạng thái ở `packages/contracts/src/state-machines` – erd mục 5). Khi đó `require('@ottimo/integrations')` trong `dist/main.js` sẽ lỗi `ERR_PACKAGE_PATH_NOT_EXPORTED`: Node resolve với điều kiện `require`/`node`/`default`, không khớp `import`. Ba lớp kiểm tra hiện tại **đều không bắt được**: (1) `tsc` với `Node10` bỏ qua `exports`, đọc trường `types` nên vẫn qua; (2) Vitest chạy mọi thứ dạng ESM (swc `module.type: es6`) nên test vẫn xanh; (3) chỉ bước smoke test Docker hoặc chạy thật mới thấy.
- Vì sao quan trọng: lỗi xuất hiện đúng lúc BE/INT ghép module đầu tiên ở R2. CI unit xanh nhưng image không khởi động được, dễ mất 0,5–1 ngày dò tìm.
- Đề xuất sửa (chọn 1, ARC khuyến nghị a):
  a) Giữ API là CommonJS (NestJS ổn định nhất), ghim **Node ≥ 22.12** (từ bản này `require(esm)` bật sẵn) trong `.nvmrc` (`22.12`), `engines` (`>=22.12 <23`), tag Docker (`node:22.12-alpine` trở lên), và thêm điều kiện `"default": "./dist/index.js"` vào `exports` của hai package. Package dùng chung không được có top-level `await` (điều kiện để `require(esm)` hoạt động).
  b) Hoặc cho hai package build ra CommonJS (`module: CommonJS`), bỏ `"type": "module"`.
  Dù chọn cách nào: đổi `services/api/tsconfig.json` sang `module: Node16`, `moduleResolution: Node16` để tsc kiểm theo đúng luật resolve của Node (sẽ báo TS1479 nếu CJS import ESM-only), và thêm 1 test ở `services/api/test` chạy `require.resolve('@ottimo/integrations')` + `require('@ottimo/contracts')` bằng `createRequire` để chặn tái phát. ARC sẽ ghi lựa chọn vào ADR-012 ở bước 4.
- Trạng thái: Open

### FB-R1-ARC-OPS-02
- Mức độ: Major
- Vị trí: `.github/workflows/ci.yml`; `rounds/round-01/outputs/OPS/report.md` mục 1 "Kết quả kiểm chứng thật", mục 4 R1/R2
- Vấn đề: Chưa có bằng chứng CI xanh (QC tiêu chí C2 cần "khung repo + CI xanh"). Không có lockfile nên lần chạy đầu sẽ lấy phiên bản mới nhất trong khoảng `^`. Các điểm ARC đánh giá **có khả năng** làm đỏ lần chạy đầu (chưa chắc chắn, cần chạy thật để xác nhận):
  1. `eslint` chỉ khai ở `devDependencies` gốc, còn script `lint` chạy trong từng package (`eslint .`). Việc tìm thấy binary dựa vào pnpm thêm `node_modules/.bin` của gốc workspace vào PATH – cần xác nhận với pnpm 9.15 (xem thẻ 03).
  2. `prettier --check .` chưa từng chạy trên các tệp TS/JSON/YAML/HTML do OPS viết tay; chỉ cần một khác biệt định dạng (ví dụ cách Prettier ngắt dòng một biểu thức dài, thứ tự khóa không đổi nhưng dấu phẩy cuối) là bước Format check đỏ.
  3. `gitleaks detect` quét **toàn bộ lịch sử repo**, gồm `product/legacy/round-0-prototype/ottimo-desk.html` (217 KB), `docs/security/*`, `.env.example` (`POSTGRES_PASSWORD=change_me_dev_only`) – quy tắc `generic-api-key` dựa trên entropy có thể báo nhầm; OPS đã nêu rủi ro R6 nhưng chưa có `.gitleaks.toml`.
  4. `turbo` + `pnpm install --no-frozen-lockfile` trong CI tạo lockfile mới mỗi lần → hash cache Turbo khác nhau giữa các lần, kết quả không lặp lại được.
- Vì sao quan trọng: R2 bắt đầu bằng code thật; nếu CI chưa từng xanh thì lỗi khung trộn lẫn với lỗi code mới, khó quy trách nhiệm. QC sẽ không cho ĐẠT tiêu chí C2.
- Đề xuất sửa: Ở bước 4, không cần máy có Node: đề nghị ORC cho đẩy nhánh `r1-skeleton` lên GitHub để chạy workflow thật (CI đã có `workflow_dispatch`) – lấy lockfile từ artifact của lần chạy đó (thêm bước `actions/upload-artifact` cho `product/pnpm-lock.yaml` khi lockfile chưa tồn tại), commit lockfile, chạy lại với `--frozen-lockfile`. Thêm `.gitleaks.toml` với allowlist có lý do cho `product/legacy/**` và chuỗi placeholder `change_me_dev_only`, `ci_only`. Ghi kết quả 4 job vào report OPS. Nếu ORC/INV không cho đẩy lên GitHub ở R1 → ghi rủi ro rõ trong report và để QA chạy ở bước 5 trên máy có Node.
- Trạng thái: Open

### FB-R1-ARC-OPS-03
- Mức độ: Minor
- Vị trí: `services/api/package.json`, `apps/*/package.json`, `packages/contracts/package.json`, `integrations/package.json` – script `lint: "eslint . && tsc …"`; `product/package.json` devDependencies
- Vấn đề: Mỗi package gọi `eslint` nhưng không khai `eslint` (và plugin) trong devDependencies của chính nó. Cách này chỉ chạy được nếu pnpm đưa `.bin` của gốc workspace vào PATH khi chạy script trong package con; với `pnpm --filter <pkg> lint` chạy từ thư mục khác hoặc khi chuyển sang pnpm 10 hành vi có thể khác. Turborepo cũng khuyến nghị mỗi package tự khai công cụ nó gọi.
- Vì sao quan trọng: lỗi "eslint: command not found" chỉ xuất hiện ở một số cách chạy → khó tái hiện; Dependabot nâng pnpm/turbo có thể làm gãy.
- Đề xuất sửa: Chọn 1 trong 2: (a) thêm `"eslint": "^9.17.0"` vào devDependencies của 6 package; hoặc (b) gọn hơn – bỏ `eslint .` khỏi script từng package, thêm task gốc `"lint:eslint": "eslint ."` chạy một lần ở `product/` và giữ `tsc --noEmit` theo package qua Turbo. ARC nghiêng về (b) vì một cấu hình ESLint chung cho cả workspace (ADR-012).
- Trạng thái: Open

### FB-R1-ARC-OPS-04
- Mức độ: Minor
- Vị trí: `services/api/src/main.ts` dòng 23 `trustProxy: true`
- Vấn đề: `trustProxy: true` tin **mọi** `X-Forwarded-For`. Ở dev, CI smoke test và bất kỳ lúc nào API bị gọi thẳng cổng 3000 (không qua Caddy), người gọi tự đặt IP giả → `request.ip` sai.
- Vì sao quan trọng: SEC dùng IP làm khóa đếm giới hạn tần suất (SR-RL-01 đăng nhập 20 lần/IP, SR-RL-03 mở phiên khách) và ghi `ip_hmac` vào nhật ký C3 (SR-C3-08). Tin mọi proxy = vượt rate limit bằng cách đổi header, nhật ký ghi IP giả.
- Đề xuất sửa: Đọc từ biến môi trường `TRUST_PROXY` (mặc định `false`; production đặt số hop `1` hoặc dải IP mạng Docker của Caddy), thêm vào `.env.example` mục Core. Thêm 1 test: gửi `X-Forwarded-For: 1.2.3.4` khi `TRUST_PROXY` không đặt → `request.ip` không phải `1.2.3.4`.
- Trạng thái: Open

### FB-R1-ARC-OPS-05
- Mức độ: Minor
- Vị trí: `services/api/src/main.ts` dòng 18–22 (cấu hình logger Fastify)
- Vấn đề: Mới che `authorization`, `cookie`, `set-cookie`. Bộ serializer mặc định của Fastify ghi `req.url` **đầy đủ query string** và `hostname`, `remoteAddress` rõ. R3 IPN VNPay dạng GET có toàn bộ tham số (gồm chữ ký, số tiền) trên query; mọi request khác có thể có `cursor` chứa dữ liệu.
- Vì sao quan trọng: SR-LOG-01/02/03 yêu cầu log route **mẫu**, bỏ query, che `/g/*`, IP băm HMAC. Nếu khung R1 để mặc định, mọi module R2 sẽ kế thừa log sai và phải sửa lại sau.
- Đề xuất sửa: Thêm serializer `req` tự viết ngay trong khung: `{ id, method, route: request.routeOptions.url (mẫu), statusCode, responseTime }`, bỏ `url`, `remoteAddress`; thêm `X-CSRF-Token` vào danh sách che. Test: gọi `/health?foo=secret` → log không chứa `secret`.
- Trạng thái: Open

### FB-R1-ARC-OPS-06
- Mức độ: Minor
- Vị trí: `product/.dockerignore` (dòng `docs`, `tests`); `Dockerfile.api` dòng 9–14
- Vấn đề: (1) ADR-012 + architecture mục 17: R2 sinh `packages/contracts` từ `docs/api/openapi.yaml` (openapi-typescript). Nếu bước sinh chạy trong `build` của package, build trong Docker sẽ đỏ vì `docs/` bị loại khỏi build context. (2) Architecture mục 17 đưa `tests/e2e` vào workspace; khi đó lockfile có importer `tests/e2e` nhưng Docker context không có thư mục → `pnpm install --frozen-lockfile` trong Docker có thể báo lockfile không khớp. (3) Docker build cài phụ thuộc của **toàn bộ** workspace (Vite, React…) chỉ để build API – chậm, image build to.
- Vì sao quan trọng: lỗi chỉ lộ ở job `docker-build`, sau khi job `build-test` đã xanh → mất thời gian R2.
- Đề xuất sửa: (1) Sinh kiểu từ OpenAPI vào `packages/contracts/src/generated/` và **commit** tệp sinh ra (CI có bước kiểm "sinh lại không đổi"), không sinh trong Docker; hoặc bỏ loại `docs/api/` khỏi `.dockerignore`. (2)+(3) Dùng `turbo prune @ottimo/api --docker` trong stage build (cắt workspace + lockfile chỉ còn phần API cần), sau đó `pnpm install --frozen-lockfile`. Cập nhật `dev-setup.md` mục 7.
- Trạng thái: Open

### FB-R1-ARC-OPS-07
- Mức độ: Minor
- Vị trí: `infra/docker-compose.yml` service `api` và `worker` (cùng `image: ottimo-api:dev` + cùng khối `build`); service `web` (Dockerfile.web chép cứng `Caddyfile.dev` vào image)
- Vấn đề: (1) Hai service cùng khai `build` và cùng tag → `docker compose up --build` build image hai lần (song song), tốn thời gian, có thể ghi đè tag giữa chừng. (2) Image `web` đóng gói sẵn Caddyfile **dev** (không TLS, không CSP/HSTS, không che `/g/*`). Nếu R2 dùng lại image này cho staging thì cấu hình dev lên Internet.
- Vì sao quan trọng: thời gian khởi động môi trường dev (mục tiêu < 15 phút của dev-setup); rủi ro cấu hình dev ra staging (SR-HDR-01/02, SR-LOG-03).
- Đề xuất sửa: (1) Chỉ `api` có `build`; `worker` dùng `image: ottimo-api:dev`, `pull_policy: never`, `depends_on: api` (`condition: service_started`). (2) Không `COPY` Caddyfile trong `Dockerfile.web`; compose dev mount `./caddy/Caddyfile.dev:/etc/caddy/Caddyfile:ro`, compose prod (R2) mount Caddyfile production riêng.
- Trạng thái: Open

### FB-R1-ARC-OPS-08
- Mức độ: Minor
- Vị trí: `eslint.config.js`; `.github/workflows/ci.yml` – so với ADR-012 bảng "Quyết định"
- Vấn đề: Còn thiếu so với ADR-012: (1) `eslint-plugin-jsx-a11y` (BL 8.3 – lỗi a11y của prototype là lý do chọn); (2) bước `@redocly/cli lint` cho `docs/api/openapi.yaml` – hợp đồng 244 KB đã tồn tại nhưng **chưa từng được kiểm cú pháp/tham chiếu** bằng công cụ; (3) `pnpm audit` (OPS đã dời có lý do – chấp nhận).
- Vì sao quan trọng: (2) là rủi ro lớn nhất cho R2: FE/MOB/BE sinh kiểu từ OpenAPI; một `$ref` gãy hoặc schema sai làm hỏng sinh mã. SEC cũng cần lint `x-roles` bắt buộc (SR-AZ-01).
- Đề xuất sửa: Thêm job `contract-lint` chạy `npx --yes @redocly/cli@<phiên bản ghim> lint product/docs/api/openapi.yaml` (không cần lockfile); R1 để `continue-on-error: true` + ghi số lỗi vào report, R2 bật chặn. ARC sẽ sửa lỗi lint của chính mình ở bước 4. Thêm `jsx-a11y` (recommended) cho `apps/**/*.tsx`.
- Trạng thái: Open

### FB-R1-ARC-OPS-09
- Mức độ: Major
- Vị trí: `docs/hosting-plan.md` mục 4 (PA2: máy phụ vừa là **staging** vừa là **nơi giữ bản sao lưu**) và mục 7 dòng "Thử khôi phục: Mỗi round: khôi phục bản mới nhất vào máy staging"
- Vấn đề: Khi đã chạy thật, "khôi phục bản mới nhất vào máy staging" nghĩa là đưa **dữ liệu khách thật (gồm C3 đã mã hóa)** vào môi trường staging dùng chung với dữ liệu giả, tài khoản test và khóa sandbox. Muốn đọc được ảnh mẫu để kiểm khôi phục, máy staging còn phải có **KEK production**. Điều này trái SR-BAK-05 ("không khôi phục backup production vào dev/staging dùng chung") và SR-KEY-03 (mỗi môi trường một KEK, KEK production không ra ngoài).
- Vì sao quan trọng: vi phạm yêu cầu bảo mật mức B; tăng bề mặt lộ C3 (staging thường lỏng hơn: nhiều người truy cập, có `CLOCK_OVERRIDE`, adapter mock).
- Đề xuất sửa: Viết lại mục 7 "Thử khôi phục": diễn tập trong **môi trường dùng một lần** (compose project riêng `ottimo-restore-<ngày>`, mạng nội bộ không publish cổng, volume tạm) trên máy phụ; KEK production chỉ nạp vào môi trường đó trong lúc diễn tập (do OPS/INV mang vào, không lưu trên đĩa), chạy `/health` + đếm bản ghi + giải mã 1 ảnh mẫu, rồi `down -v` và xóa; ghi biên bản. Trước khi có dữ liệu thật (R2–R3) diễn tập bằng backup của staging. Ghi rõ staging và môi trường diễn tập không bao giờ chia sẻ volume.
- Trạng thái: Open

### FB-R1-ARC-OPS-10
- Mức độ: Minor
- Vị trí: `docs/hosting-plan.md` mục 5 "Bố trí trên máy chủ" và mục 9
- Vấn đề: Chưa phản ánh các yêu cầu hạ tầng mới của SEC ảnh hưởng tên miền/DNS và chi phí: SR-HDR-04 (3 origin riêng: admin, staff PWA, guest – 3 tên miền con, mỗi origin proxy `/v1`), email giao dịch **bắt buộc từ R2** vì OTP khách mức 2 (SR-GST-07) dùng email (SPF/DKIM/DMARC), snapshot nhà cung cấp tắt hoặc ≤ 7 ngày (SR-BAK-03).
- Vì sao quan trọng: INV duyệt ESC hosting/tên miền dựa trên tài liệu này; thiếu tên miền con và email thì R2 không dựng được staging đúng yêu cầu bảo mật.
- Đề xuất sửa: Thêm vào mục 5 sơ đồ 3 tên miền con (ví dụ `desk.`, `staff.`, `g.`) + 1 tên miền gửi mail; thêm vào mục 9 việc "chọn nhà cung cấp email (cùng INT) + DNS" trước staging R2; thêm dòng "tắt snapshot tự động hoặc ≤ 7 ngày" vào mục 7.
- Trạng thái: Open

### FB-R1-ARC-OPS-11
- Mức độ: Suggestion
- Vị trí: `infra/docker-compose.yml` (đường dẫn) so với `architecture.md` mục 17 (`infra/compose/docker-compose.yml`) và ADR-012 (lệnh `pnpm dev`)
- Vấn đề: OPS đặt compose ở `infra/docker-compose.yml` theo plan R1 và đã ghi lệch (dev-setup mục 7, giả định G2).
- Vì sao quan trọng: tài liệu kiến trúc và repo phải khớp để người mới không lạc.
- Đề xuất sửa: **ARC chấp nhận vị trí của OPS** (1 tệp compose dev, chưa cần thư mục con). ARC sửa architecture mục 17 và ADR-012 ở bước 4; R2 khi thêm compose production đặt cạnh: `infra/docker-compose.prod.yml`. OPS không cần sửa gì.
- Trạng thái: Open

### FB-R1-ARC-OPS-12
- Mức độ: Suggestion
- Vị trí: `eslint.config.js` dòng 29–51; `services/api/package.json` script `dev`
- Vấn đề: (1) Bỏ qua quy tắc Clock theo mẫu `**/clock.ts` → bất kỳ tệp nào tên `clock.ts` ở module khác đều được gọi `new Date()`. (2) Chỉ cấm `parseFloat` toàn cục; `Number.parseFloat(...)`, `Number(x)` trên chuỗi tiền vẫn lọt. (3) `dev` dùng `ts-node` (kiểm kiểu mỗi lần khởi động, chậm, ít được bảo trì).
- Vì sao quan trọng: quy tắc thời gian và tiền là hai nguồn lỗi lớn nhất của prototype (BL 8.2).
- Đề xuất sửa: (1) Bỏ qua đúng đường dẫn `services/api/src/clock.ts`. (2) Thêm selector `CallExpression[callee.object.name='Number'][callee.property.name='parseFloat']`. (3) Có thể đổi `dev` sang `node --watch -r @swc-node/register src/main.ts` (vẫn giữ decorator metadata, nhanh hơn) – tùy OPS/BE.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Khung bám sát kiến trúc và có "răng": quy tắc lint cấm `new Date()`/`Date.now()` ngoài `Clock` và cấm `parseFloat`, `FixedClock` + `CLOCK_OVERRIDE` bị bỏ qua ở production, `/health` trả giờ `+07:00` – đúng ADR-008, có test cả DB giả (200/503) lẫn PostgreSQL thật.
2. An toàn mặc định ở dev: cổng chỉ bind `127.0.0.1`, mật khẩu Postgres bắt buộc (`:?`), image chạy user `node`, không bí mật trong image, CI quyền `contents: read` + gitleaks quét toàn lịch sử + smoke test `/health` trên image thật.
3. Báo cáo trung thực: ghi rõ "chưa chạy được, không báo xanh", liệt kê rủi ro lockfile và lệch kiến trúc (compose, backup 3 tháng) thay vì im lặng – đúng tinh thần Definition of Done.
