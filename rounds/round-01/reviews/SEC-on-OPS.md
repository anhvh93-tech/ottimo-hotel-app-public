# Review SEC → OPS – Round 1 · Bước 3

- Người review: SEC | Tác giả: OPS | Ngày: 15/10/2026
- Phạm vi: `product/infra/**` (docker-compose.yml, docker/Dockerfile.api, docker/Dockerfile.web, caddy/Caddyfile.dev, postgres/init/01-extensions.sql), `product/.env.example`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitignore`, `product/.dockerignore`, `product/services/api/src/**`, `product/docs/dev-setup.md`, `product/docs/hosting-plan.md`
- Căn cứ: `security-requirements.md` (SR-xxx), `threat-model.md` (TM-xx), `rounds/round-01/outputs/SEC/report.md` mục 4 (SEC-R1-04 phần backup, -20, -23, -24); mã SEC-R1-31 trở đi là phát hiện mới.
- Ghi chú: thư mục làm việc hiện **chưa là git repo** nên SEC không chạy được gitleaks/`git log`; nhận xét CI dựa trên đọc file.

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 3 |
| Minor | 7 |
| Suggestion | 3 |
| **Tổng** | **13** |

---

### FB-R1-SEC-OPS-01
- Mức độ: Major
- Vị trí: `product/infra/docker-compose.yml` `x-api-env.DATABASE_URL` (dùng `POSTGRES_USER`); `product/.env.example` dòng `DATABASE_URL=postgres://ottimo:…`; `product/infra/postgres/init/01-extensions.sql`; `.github/workflows/ci.yml` `env.DATABASE_URL`
- Vấn đề: API và worker kết nối bằng chính `POSTGRES_USER` – vai do image Postgres tạo là **superuser**. Superuser (và vai có `BYPASSRLS`) **bỏ qua RLS kể cả khi bảng `FORCE ROW LEVEL SECURITY`**; vai chủ sở hữu bảng cũng là vai chạy migration. Init SQL chưa tạo vai riêng cho ứng dụng. [SEC-R1-31 mới; SR-AZ-06; TM-09]
- Vì sao quan trọng: Lớp RLS mà ERD thiết kế (cách ly theo cơ sở, chặn sửa bảng append-only bằng REVOKE) sẽ **không có tác dụng** từ ngày đầu R2, và test CI cũng chạy bằng superuser nên không bao giờ phát hiện. Ngoài ra lỗi SQL injection nếu có sẽ thành quyền superuser (đọc file, `COPY … PROGRAM`).
- Đề xuất sửa: Init SQL tạo 2 vai: `ottimo_migrator` (sở hữu schema, chạy migration) và `ottimo_app` (`NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`, không sở hữu bảng, chỉ được GRANT theo bảng); thêm `ottimo_readonly` cho tra cứu thủ công (SR-OPS-04). `DATABASE_URL` của api/worker dùng `ottimo_app`; thêm `MIGRATION_DATABASE_URL`. CI chạy test bằng `ottimo_app` và có 1 test kiểm `SELECT rolsuper, rolbypassrls` = false. Mật khẩu từng vai trong `.env`.
- Trạng thái: Open

### FB-R1-SEC-OPS-02
- Mức độ: Major
- Vị trí: `product/services/api/src/main.ts` dòng 18–22 (`logger.redact`); `product/docs/hosting-plan.md` mục 7 "Log kỹ thuật"; `product/infra/caddy/Caddyfile.dev`
- Vấn đề: Logger chỉ che `authorization`, `cookie`, `set-cookie`. Fastify mặc định ghi `req.url` **kèm query string** cho mọi request → IPN VNPay dạng GET (`vnp_SecureHash`, số tiền, mã giao dịch), tham số tìm kiếm SĐT/email sẽ vào log giữ 90 ngày. Chưa có redactor theo khóa (`password`, `pin`, `otp`, `token`, `code`, cột C3) cho `err`/body khi lỗi. Đường dẫn `/g/*` chưa được che ở Caddy (ghi là R2). [SR-LOG-01…04; TM-53, TM-23]
- Vì sao quan trọng: Khung logger là thứ mọi module R2 dùng lại; sửa sau khi đã có log thật thì dữ liệu đã nằm trong file log và backup.
- Đề xuất sửa: Dùng `serializers.req` tự viết: ghi `method`, route **mẫu** (`req.routeOptions.url`), `request_id`, bỏ query trừ allowlist (SR-LOG-02); thêm `redact.paths` cho `*.password`, `*.pin`, `*.otp`, `*.token`, `*.code`, `*.docNumber`… với `censor: '[redacted]'`; tắt log body. Caddyfile production (R2): `log` với filter che `/g/*` và query. Thêm test đơn vị: log của 1 request có `?phone=…` không chứa số điện thoại.
- Trạng thái: Open

### FB-R1-SEC-OPS-03
- Mức độ: Major
- Vị trí: `product/docs/hosting-plan.md` mục 7 (Sao lưu) và mục 4 PA2 (VPS staging kiêm nơi giữ backup); liên quan `adr/ADR-010` mục 3
- Vấn đề: Đã đúng vòng đời ≤ 35 ngày (tốt), nhưng còn thiếu 4 điểm: (1) **snapshot tự động của nhà cung cấp VPS** không được nhắc – snapshot là bản sao toàn ổ đĩa, có cả KEK trong `/opt/ottimo/.env` + DB, thường giữ theo chính sách của hãng; (2) thông tin đăng nhập từ production tới đích backup chưa giới hạn **chỉ ghi thêm** → kẻ chiếm VPS xóa luôn backup (ransomware); (3) PA2 đặt backup production trên **máy staging** – môi trường kém bảo vệ hơn, nhiều người truy cập hơn; (4) chưa có bước áp lại `purge_journal` sau khôi phục và chưa cấm khôi phục backup production vào dev/staging khi diễn tập. [SEC-R1-04 phần OPS; SR-BAK-03…06; TM-15, TM-51, TM-52, TM-56]
- Vì sao quan trọng: (1) phá vỡ cam kết "dữ liệu đã xóa hết khỏi backup sau ≤ 35 ngày" và đặt KEK cạnh dữ liệu; (2) mất cả máy chính lẫn backup trong một sự cố.
- Đề xuất sửa: Thêm vào mục 7: "snapshot nhà cung cấp **tắt** hoặc ≤ 7 ngày, chỉ chụp thủ công trước nâng cấp và xóa trong 24 giờ"; đích backup dùng tài khoản chỉ ghi (hoặc đích tự kéo về bằng SSH key chỉ đọc), xóa theo vòng đời do đích tự làm; ở PA2 backup nằm trong thư mục/tài khoản OS riêng trên máy staging, ứng dụng staging không đọc được; diễn tập khôi phục vào môi trường cách ly, áp `purge_journal`, xóa sau khi xong (SR-BAK-05/06).
- Trạng thái: Open

### FB-R1-SEC-OPS-04
- Mức độ: Minor
- Vị trí: `.github/workflows/ci.yml` (`actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/cache@v4`); `ghcr.io/gitleaks/gitleaks:v8.21.2`
- Vấn đề: Action ghim theo tag (tag có thể bị dời); image gitleaks ghim tag không digest; `actions/checkout` để mặc định `persist-credentials: true` → `GITHUB_TOKEN` nằm trong `.git/config` suốt job, mọi script `pnpm install` (postinstall của gói phụ thuộc) đọc được. [SEC-R1-24; SR-SUP-04; TM-48]
- Vì sao quan trọng: Chuỗi cung ứng CI là đường vào phổ biến (vụ tj-actions/changed-files 2025). Quyền token đang `contents: read` (tốt) nên ảnh hưởng hiện thấp, nhưng R2 thêm job push GHCR sẽ cần `packages: write`.
- Đề xuất sửa: Ghim theo SHA commit kèm chú thích tag (`actions/checkout@<sha> # v4.x.y`) – Dependabot `github-actions` đã bật sẽ tự cập nhật SHA; gitleaks theo digest; `persist-credentials: false` cho mọi checkout; khi thêm job deploy: `permissions` đặt ở **cấp job**, chỉ job đó có `packages: write`, chỉ chạy trên `push` nhánh main (không chạy trên `pull_request`).
- Trạng thái: Open

### FB-R1-SEC-OPS-05
- Mức độ: Minor
- Vị trí: `.github/workflows/ci.yml` bước "Install dependencies"; `product/infra/docker/Dockerfile.api` và `Dockerfile.web` (nhánh `--no-frozen-lockfile`)
- Vấn đề: Còn nhánh cài không khóa phiên bản; CI chưa có quét lỗ hổng phụ thuộc (`pnpm audit`/OSV-Scanner) và chưa quét image (trivy). [SEC-R1-24; SR-SUP-01, SR-SUP-02, SR-SUP-05; TM-48]
- Vì sao quan trọng: Không có lockfile thì mỗi lần build có thể kéo phiên bản khác (kể cả bản bị chiếm); không có quét thì lỗ hổng High lọt vào production không ai biết.
- Đề xuất sửa: Commit `pnpm-lock.yaml` và **xóa** nhánh fallback ở cả 3 nơi ngay đầu R2 (trước story code đầu tiên); thêm bước `pnpm audit --audit-level=high` (hoặc OSV-Scanner) làm CI đỏ khi có High/Critical có bản sửa, ngoại lệ ghi trong file có hạn; trivy image ở R3 (bản RC).
- Trạng thái: Open

### FB-R1-SEC-OPS-06
- Mức độ: Minor
- Vị trí: `product/.dockerignore`; `.gitignore`
- Vấn đề: `.dockerignore` không loại `.data/` (blob/dữ liệu dev – có thể chứa ảnh giấy tờ mẫu), `*.pem`, `*.key`, `*.age`, `*.dump`, `*.sql.gz`; vì Dockerfile dùng `COPY . .` nên những tệp này vào build context và layer của stage build. `.gitignore` thiếu `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`, `*.kdbx`. [SEC-R1-23; SR-SECR-02; TM-47]
- Vì sao quan trọng: Image/stage build bị đẩy lên GHCR hoặc cache CI mang theo khóa/dữ liệu dev.
- Đề xuất sửa: Bổ sung các mẫu trên vào `.dockerignore` (đồng bộ với `.gitignore`) và bổ sung `.gitignore`; thêm bước CI chạy gitleaks trên image (`docker save` hoặc `gitleaks dir`) ở R2.
- Trạng thái: Open

### FB-R1-SEC-OPS-07
- Mức độ: Minor
- Vị trí: `product/infra/docker/Dockerfile.web` (stage `runtime` `caddy:2-alpine`); các `FROM node:22-alpine`, `postgres:17-alpine`
- Vấn đề: (1) Container Caddy chạy **root** (image caddy mặc định), trong khi chỉ nghe cổng > 1024 nên không cần root; (2) base image ghim theo tag trôi (`caddy:2-alpine`, `node:22-alpine`) không digest. API đã chạy `USER node` (tốt). [SR-OPS-02, SR-SUP-04; TM-48, TM-49]
- Vì sao quan trọng: Caddy là thành phần duy nhất hướng Internet; lỗ hổng ở Caddy chạy root thoát container dễ hơn.
- Đề xuất sửa: Thêm `USER caddy` (hoặc uid không đặc quyền + quyền ghi `/data`, `/config`); ở production thêm `cap_drop: [ALL]`, `read_only: true` + tmpfs, `security_opt: [no-new-privileges:true]` cho api/worker/web. Ghim digest (Dependabot `docker` đã bật sẽ cập nhật).
- Trạng thái: Open

### FB-R1-SEC-OPS-08
- Mức độ: Minor
- Vị trí: `product/services/api/src/main.ts` dòng 23 `trustProxy: true`
- Vấn đề: Tin mọi `X-Forwarded-For` → IP dùng cho rate limit đăng nhập (SR-RL-01, -03) và `ip_hmac` trong audit có thể bị giả nếu request tới API không qua Caddy (dev: cổng 3000 mở trên 127.0.0.1; production: bất kỳ container nào trong mạng Docker). Caddy mặc định không tin XFF từ client nên rủi ro hiện thấp. [SR-RL-01; TM-01]
- Vì sao quan trọng: Giới hạn thử sai theo IP vô hiệu nếu kẻ tấn công tự đặt IP.
- Đề xuất sửa: `trustProxy` = địa chỉ/mạng của Caddy (biến `TRUSTED_PROXY_CIDR`, mặc định mạng compose) hoặc số hop = 1; production không publish cổng api.
- Trạng thái: Open

### FB-R1-SEC-OPS-09
- Mức độ: Minor
- Vị trí: `product/.env.example`; `product/services/api/src/main.ts`, `clock.ts` dòng 25–33; `docker-compose.yml` `x-api-env.NODE_ENV: development`
- Vấn đề: (1) `.env.example` thiếu `LOG_IP_HMAC_KEY` (SR-KEY-08), khóa ký mã xác minh/OTP khách, `APP_ENV`, `MIGRATION_DATABASE_URL`; (2) ứng dụng chưa kiểm cấu hình khi khởi động: `SESSION_SECRET`, `DATA_KEK_CURRENT`, `ID_HASH_KEY` để trống vẫn chạy; (3) chế độ dev được quyết bằng `NODE_ENV !== 'production'` – nếu compose dev (ghi cứng `NODE_ENV: development`) bị dùng lại trên máy chủ thì `CLOCK_OVERRIDE` và mọi nhánh dev được bật ở production. [SEC-R1-20; SR-KEY-03, SR-KEY-08, SR-SECR-01; TM-33]
- Vì sao quan trọng: Cấu hình sai phải làm ứng dụng **dừng**, không chạy lặng lẽ với khóa rỗng (mã hóa C3 bằng khóa rỗng) hoặc đồng hồ giả.
- Đề xuất sửa: Thêm biến còn thiếu (giá trị trống); module cấu hình (zod) kiểm khi khởi động – thiếu khóa/độ dài < 32 byte → thoát; `APP_ENV ∈ {dev, test, staging, production}` tách khỏi `NODE_ENV`; production cấm `CLOCK_OVERRIDE` và cấm adapter `mock` (xem FB-R1-SEC-INT-04). Compose production là file riêng, không kế thừa `x-api-env` dev.
- Trạng thái: Open

### FB-R1-SEC-OPS-10
- Mức độ: Minor
- Vị trí: `product/docs/hosting-plan.md` mục 5 "Bí mật"; `.env.example` (`DATA_KEK_CURRENT`)
- Vấn đề: KEK và bí mật cổng thanh toán nạp bằng biến môi trường → hiện trong `docker inspect`, `/proc/<pid>/environ`; chưa có sổ bí mật (tên, chủ sở hữu, nơi giữ, chu kỳ xoay) và quy trình xoay khi người có quyền nghỉ việc. [SR-SECR-04, SR-KEY-03; TM-13, TM-14]
- Vì sao quan trọng: TM-13 (KEK cùng VPS với DB) là 1 trong 2 rủi ro High còn lại – mọi lớp giảm thiểu nhỏ đều đáng làm.
- Đề xuất sửa: Hỗ trợ `*_FILE` qua Docker Compose secrets (file 0400) cho `DATA_KEK_*`, `ID_HASH_KEY`, `PAYMENT_*_SECRET*`; thêm bảng "Sổ bí mật" (không ghi giá trị) vào hosting-plan; runbook xoay KEK/bí mật ở R2.
- Trạng thái: Open

### FB-R1-SEC-OPS-11
- Mức độ: Suggestion
- Vị trí: `product/infra/caddy/Caddyfile.dev`; Caddyfile production (R2)
- Vấn đề: Bản dev chỉ có `X-Content-Type-Options` (chấp nhận được cho dev). Production cần bộ header SR-HDR và tách 3 origin.
- Vì sao quan trọng: guest-web có token trong đường dẫn – thiếu `Referrer-Policy: no-referrer` là lộ token qua Referer.
- Đề xuất sửa: Khi viết Caddyfile production R2: CSP theo SR-HDR-01, HSTS, `Referrer-Policy: no-referrer` (guest-web), `frame-ancestors 'none'`, 3 tên miền con (SR-HDR-04), chặn phục vụ trực tiếp volume tệp (404), log che `/g/*` và query. Thêm test `curl -I` vào smoke test CI.
- Trạng thái: Open

### FB-R1-SEC-OPS-12
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/health/health.controller.ts`; hosting-plan mục 8
- Vấn đề: `/health` công khai trả trạng thái DB và giờ máy chủ. Thông tin ít nhạy cảm nhưng giúp kẻ dò quét biết khi DB gặp sự cố.
- Vì sao quan trọng: Thu hẹp bề mặt thông tin với chi phí thấp.
- Đề xuất sửa: Production: Caddy chỉ cho `/health` từ mạng nội bộ/IP giám sát, hoặc bản công khai chỉ trả `{status}`; giữ bản đầy đủ cho healthcheck Docker.
- Trạng thái: Open

### FB-R1-SEC-OPS-13
- Mức độ: Suggestion
- Vị trí: Cấu hình repo GitHub (chưa có tệp); `.github/`
- Vấn đề: Chưa có quy tắc bảo vệ nhánh, review bắt buộc cho đường dẫn nhạy cảm, bật secret scanning push protection; GHCR mặc định có thể public theo repo.
- Vì sao quan trọng: Thay đổi ở auth, thanh toán, C3, infra phải có SEC xem (skill SEC: Round 4+ review mọi thay đổi chạm xác thực, tiền, dữ liệu cá nhân).
- Đề xuất sửa: Thêm `.github/CODEOWNERS` gán SEC cho `services/api/src/{auth,payment,crypto,c3}/**`, `infra/**`, `.github/**`; branch protection main: CI xanh + 1 review; bật push protection; đặt package GHCR private.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Compose dev chỉ bind `127.0.0.1`, mật khẩu Postgres bắt buộc qua `${POSTGRES_PASSWORD:?…}` (không có mặc định yếu), `.env` ngoài git, `.env.example` chỉ placeholder và mọi tích hợp mặc định `mock`/`manual`.
2. CI: `permissions: contents: read` ở cấp workflow, gitleaks quét **toàn bộ lịch sử** (`fetch-depth: 0`, `--redact`), DB CI là mật khẩu dùng một lần có ghi chú rõ; Dependabot đủ 3 hệ (npm, actions, docker).
3. Image api multi-stage, `pnpm deploy --prod`, chạy `USER node`, không bí mật trong image; hosting-plan đã tự phát hiện lệch ADR-010 (3 tháng) so với T18 và chốt ≤ 35 ngày, có mã hóa backup bằng `age` với khóa ngoài máy chủ.
