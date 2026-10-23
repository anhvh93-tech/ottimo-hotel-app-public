# INT – Round 3, Sản xuất: email thật cho v1.0 (Google Workspace SMTP)

- Người làm: INT · Ngày: 23/10/2026 · Nhánh: `int-r3-smtp` (rebase lên `origin/main` 3e9be89)
- **Cập nhật Phản hồi & sửa (23/10):** theo SEC FB-R3-SEC-INT-EMAIL-01 phương án A, chế độ mặc định là **SMTP relay của Google Workspace, xác thực theo IP VPS, không mật khẩu** (mục 1.7). Mật khẩu ứng dụng chỉ còn là dự phòng có cảnh báo. Đã sửa ARC-03/SEC-02 (thời hạn thuê) và SEC S-1. Bảng trả lời: `responses/s1-INT-email.md`.
- Căn cứ: quyết định INV 23/10 (gửi qua Google Workspace từ `info@ottimo.vn`, thay ESC-010 B Amazon SES cho v1.0); ARC `s1-contracts.md` R2 (adapter email qua outbox `staff.email`); SEC `s1-security-requirements.md` 06.15, 06.33, Q51-6; OPS `v1-production.md` (R3-OPS-01), `init-secrets.sh`.
- Người review bắt buộc: ARC, SEC (khuyến nghị: OPS cho phần compose/init-secrets, BE-B cho Q51-6).

## 1. Đã làm gì

### 1.1 Adapter SMTP – `product/integrations/notification/smtp.ts`
- Thư viện: **nodemailer 10.0.16**, ghim chính xác.
  - Thư viện email phổ biến nhất của Node, không có phụ thuộc con.
  - Bản 10.0.16 ra 07/10/2026, đã ≥ 2 tuần. Không lấy 10.1.x/10.2.x vì mới vài ngày.
  - Repo chưa có thư viện SMTP nào trước đó.
- Cấu hình lấy từ `CredentialProvider` (`env:EMAIL_SMTP`), adapter không đọc `process.env`:
  - `EMAIL_SMTP_HOST` (mặc định `smtp.gmail.com`), `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`;
  - mật khẩu từ `EMAIL_SMTP_PASSWORD_FILE`, bỏ dấu cách mà Google hiện theo nhóm 4 chữ.
- Bảo mật kết nối:
  - **chỉ cổng 465** (TLS ngay từ đầu) **hoặc 587** (STARTTLS bắt buộc, `requireTLS`). Cổng khác bị từ chối;
  - kiểm chứng chỉ (`rejectUnauthorized: true`, `servername`), TLS ≥ 1.2;
  - timeout kết nối 15 giây, chào 10 giây, im lặng 30 giây;
  - `logger:false`, `debug:false`, `disableFileAccess`, `disableUrlAccess`.
- Lỗi chuyển thành `IntegrationError`, chỉ mang mã nodemailer + số trạng thái SMTP (vd. `EAUTH:535`). **Bỏ phần chữ máy chủ trả về** vì Gmail hay nhắc lại địa chỉ người nhận.

  | Lỗi | Mã | Thử lại? |
  |---|---|---|
  | Sai mật khẩu ứng dụng | `AUTH` | Adapter: không. Worker vẫn thử lại cả hàng, vì INV có thể sửa mật khẩu |
  | 421/45x | `RATE_LIMITED` | Có |
  | 55x / `EENVELOPE` | `INVALID_REQUEST` | Không – bỏ qua người nhận đó |
  | TLS/cấu hình | `CONFIG` | – |
  | Còn lại | `UNAVAILABLE` / `TIMEOUT` | Có |

- `Message-ID` cố định theo khóa idempotency (`<sha256…@ottimo.vn>`). Lần gửi lại sau sự cố mang cùng ID, ứng dụng email nhận ra là một thư.
- Header `Auto-Submitted: auto-generated` để hệ thống trả lời tự động không phản hồi.
- Từ chối: kênh khác `email`, người nhận sai dạng (kể cả chèn xuống dòng), tệp đính kèm, mẫu không có trong danh sách.
- Đồng hồ được tiêm vào (ADR-008, không `new Date()` trong integrations).
- Export mới: `@ottimo/integrations/notification`, tách khỏi gói gốc để không kéo nodemailer vào nơi khác.

### 1.2 Mẫu thư – `product/integrations/notification/email-templates.ts`
- 4 mẫu:

  | Mẫu | Căn cứ | Gửi cho |
  |---|---|---|
  | `mfa_recovery_code_used` | SEC 06.15 | Người dùng + mọi owner |
  | `mfa_reset` | SEC 06.25/06.32 | Người dùng + owner |
  | `mfa_reset_by_operator` | SEC 06.33 | Chỉ người dùng |
  | `receiving_account_changed` | Q51-6 | Mọi owner; chỉ "đã đổi" + ngày hiệu lực, không số tài khoản |

  Mỗi mẫu có 2 giọng: `self` (chính người đó) và `owner` (bản báo cho chủ).
- Theo brand guideline:
  - tiêu đề `OTTIMO – <tiếng Anh> / <tiếng Việt>`; thân thư khối tiếng Anh trước, khối tiếng Việt sau (nền Cream);
  - câu ngắn, điềm tĩnh, không emoji, không IN HOA;
  - màu chỉ trong bảng 80/15/5: nền Ivory, thẻ trắng, chữ Ink, chú thích Stone Grey, đường kẻ Light Oak, tiêu đề tiếng Việt Earth Brown;
  - chữ: `Lora, Georgia` cho tiêu đề, `'Be Vietnam Pro', Arial` cho nội dung (phần lớn ứng dụng email không tải web font, nên dùng fallback trong guideline);
  - tagline cuối thư.
- An toàn:
  - **không link** (thư cảnh báo bảo mật mà có nút bấm thì giống thư lừa đảo), không mã, không tên đăng nhập, không số tài khoản;
  - câu "OTTIMO không bao giờ hỏi mật khẩu hay mã qua email";
  - mọi tham số được escape HTML và bỏ ký tự điều khiển (chặn chèn header).
- Bản text thuần đi kèm bản HTML (multipart/alternative).

### 1.3 Worker gửi từ outbox – `product/services/api/src/jobs/email-dispatch.ts`, `email-adapter.ts`, `worker.ts`
- Mỗi tick (60 giây), với từng cơ sở, worker chạy 3 bước:
  1. **Giao dịch 1** – nhận ≤ 10 hàng `staff.email` đến hạn, `FOR UPDATE SKIP LOCKED`:
     - đặt `in_flight`, `attempts + 1`, hạn thuê 10 phút;
     - tra địa chỉ lúc gửi: người trong `userIds` (`active`/`locked` – người bị khóa vẫn phải biết), cộng các owner `active` của cơ sở khi `owners=true`. Ai trong `userIds` thì nhận giọng `self`.
  2. **Gửi ngoài giao dịch**, không giữ khóa DB trong lúc chờ SMTP.
  3. **Giao dịch 2** – chốt `done` / `failed` / `dead`:
     - lưu `sentUserIds` / `skippedUserIds` vào payload (chỉ id), nên lần thử lại **không gửi trùng** người đã nhận;
     - giãn cách thử lại 1 → 5 → 15 → 60 → 180 phút (tổng khoảng 4,4 giờ); lần 6 vẫn lỗi thì `dead` và log `error`.
- Trường hợp đặc biệt:
  - Worker chết giữa bước 1 và 3: hết hạn thuê thì hàng được nhận lại (ít nhất một lần).
  - Không ai có địa chỉ → `dead` với `NO_RECIPIENT`. Mẫu lạ → `dead` với `BAD_TEMPLATE`.
  - Topic khác (`staff.push`…) không bị đụng tới.
- Log chỉ có: id outbox, tên mẫu, lần thử, mã lỗi. **Không có địa chỉ, tên hay nội dung.** Cột `last_error` cũng chỉ mã.
- Khởi động worker:
  - `EMAIL_PROVIDER=smtp` mà thiếu hoặc rỗng tệp mật khẩu, hoặc thiếu `EMAIL_SMTP_USER` → lỗi `CONFIG`, **worker không chạy**;
  - có cấu hình thì thử đăng nhập SMTP (không gửi thư), log `email smtp check` ok/lỗi kèm mã;
  - production: `createEmailAdapter` từ chối mọi giá trị khác `smtp` (lớp chặn thứ 2 sau config).

### 1.4 Cấu hình – chặn production
`integrations/common/safe-config.ts` (dùng chung api + worker lúc khởi động):
- `EMAIL_PROVIDER` ∈ `off|mock|smtp`. Bỏ `ses`, `resend` vì chưa có adapter.
- **production bắt buộc `smtp`**: mock, off hay để trống đều không khởi động. Mock vốn đã bị chặn theo luật (a).
- `EMAIL_SMTP_URL`, `EMAIL_SES_REGION` đã bỏ; còn giá trị → không khởi động (URL dạng `smtps://user:pass@host` làm lộ mật khẩu).
- staging/production: có `EMAIL_SMTP_PASSWORD` mà không có `EMAIL_SMTP_PASSWORD_FILE` (tức đến từ biến môi trường thô) → không khởi động.
- Thông báo lỗi chỉ nêu tên biến.

### 1.5 Hạ tầng
- `infra/docker-compose.prod.yml`:
  - thêm `EMAIL_SMTP_HOST/PORT/USER` (không bí mật);
  - secret `email_smtp_password` **chỉ mount vào worker** (`EMAIL_SMTP_PASSWORD_FILE`). Api không cầm mật khẩu.
- `infra/server/bin/init-secrets.sh`:
  - hỏi mật khẩu ứng dụng bằng `read -s`: không hiện chữ, không vào lịch sử shell, không thành tham số dòng lệnh, có `set +x`;
  - bỏ dấu cách, yêu cầu đúng 16 chữ cái, nhập 2 lần để đối chiếu;
  - production bắt buộc nhập; staging Enter để bỏ qua (ghi tệp rỗng, `EMAIL_PROVIDER=mock`);
  - chạy không có terminal: production báo lỗi, staging tạo tệp rỗng;
  - tham số mới `--reset-email-password` để thay mật khẩu;
  - tệp `0400`, uid 1000.
- `infra/ci/check-compose.sh`: thêm `EMAIL_SMTP_PASSWORD` vào danh sách "không được là biến thô", `EMAIL_SMTP_URL` vào danh sách biến đã bỏ.
- `.env.example`, `infra/server/env.example`, `infra/server/env.production.example`: chỉ có giá trị mẫu.
  - production mẫu: `EMAIL_PROVIDER=smtp`, `EMAIL_FROM` và `EMAIL_SMTP_USER` = `info@ottimo.vn` (địa chỉ công khai, không phải bí mật).

### 1.6 Hướng dẫn INV
`rounds/round-03/outputs/OPS/inv-production-steps.md` Phần 8 (đã gộp với bản OPS):
- **8a** – bật "SMTP relay service" trong Admin console:
  - chỉ IP VPS (đội gửi IP qua chat, repo không ghi IP);
  - chỉ địa chỉ trong miền của tôi;
  - bắt buộc TLS;
  - không bật xác thực SMTP.
- **8b** – gửi thử khi dựng production.
- **Cách dự phòng** (mật khẩu ứng dụng): chỉ khi 8a không làm được và ORC/INV đồng ý.
- Không phải sửa DNS: OPS đã kiểm SPF/DKIM của Google có sẵn.

### 1.7 Chế độ relay theo IP (SEC FB-R3-SEC-INT-EMAIL-01, phương án A)
- `EMAIL_SMTP_MODE`:
  - `relay` (**mặc định**, mọi môi trường): `smtp-relay.gmail.com:587`, bắt buộc STARTTLS, kiểm chứng chỉ, **không AUTH**, EHLO = tên miền của `EMAIL_FROM` (tùy chỉnh bằng `EMAIL_SMTP_HELO`);
  - `app_password`: như bản trước (`smtp.gmail.com:465` + tệp mật khẩu).
- Các chốt chặn:
  - relay mà tệp `email_smtp_password` có nội dung → worker **không khởi động**, để không sót mật khẩu hộp thư trên máy chủ;
  - relay thiếu `EMAIL_FROM` → không khởi động;
  - `app_password` → mỗi lần khởi động log `warn` có mã thẻ SEC.
- Lỗi:
  - relay từ chối (`550 5.7.x`, ví dụ IP chưa được khai hoặc From ngoài miền) → `AUTH`: hàng thư thử lại, không bị coi là người nhận hỏng;
  - từ chữ máy chủ trả về chỉ lấy mã mở rộng (vd. `5.7.0`), không lấy chữ.
- `init-secrets.sh`:
  - đọc `EMAIL_SMTP_MODE` trong `.env`;
  - relay (mặc định): không hỏi, tạo tệp rỗng (compose vẫn cần tệp);
  - `app_password`: hỏi ẩn như cũ;
  - `--reset-email-password` ở relay = xóa sạch mật khẩu cũ.
- `env.production.example`: `EMAIL_SMTP_MODE=relay`, `EMAIL_SMTP_HOST=smtp-relay.gmail.com`, `EMAIL_SMTP_PORT=587`, `EMAIL_SMTP_USER=` trống.
- **Gói Workspace có SMTP relay không?** Tra tài liệu chính thức Google ngày 23/10/2026:
  - **Có ở gói Business (Starter, Standard, Plus), Enterprise, Education.** Bảng so sánh Gmail theo gói ghi dòng "Outbound relay server (for alternative From: addresses)" cho cả ba gói Business, cần đã xác minh tên miền [Nguồn: knowledge.workspace.google.com/admin/gmail/compare-gmail-features-across-google-workspace-editions].
  - Trang hướng dẫn relay xác nhận các thông số đội dùng [Nguồn: knowledge.workspace.google.com/admin/gmail/advanced/route-outgoing-smtp-relay-messages-through-google]:
    - `smtp-relay.gmail.com`, cổng 587 có TLS;
    - xác thực bằng IP;
    - chọn "chỉ địa chỉ trong miền của tôi" và "yêu cầu TLS";
    - đường dẫn Admin console: Apps → Google Workspace → Gmail → Routing → SMTP relay service;
    - giới hạn 10.000 người nhận/người gửi/24 giờ; tài khoản dùng thử thấp hơn.
  - Trang "Send email from a printer, scanner, or app" ghi relay là cách được khuyến nghị (xác thực theo IP); cách `smtp.gmail.com` + mật khẩu ứng dụng giới hạn 2.000 thư/ngày.
  - Lưu ý: hai trang không ghi tên gói ngay trên trang relay. Kết luận gói Business có relay dựa trên bảng so sánh. Nếu Admin console của OTTIMO không có mục "SMTP relay service" (ví dụ gói Essentials hoặc đang dùng thử), INV chụp màn hình, INT báo ORC, ORC lập ESC giữa (B) tài khoản gửi riêng và (C) giữ mật khẩu ứng dụng, đúng như thẻ SEC.

## 2. Kiểm thử

| Bộ | Kết quả | Ghi chú |
|---|---|---|
| `integrations` (vitest) | 180/180 đạt (sau sửa) | Có 3 tệp test mới, xem 3 dòng dưới |
| ↳ `smtp.test.ts` | 17 ca (sau sửa) | **Relay**: mặc định đúng (587, requireTLS, không auth, EHLO tên miền); gửi **không AUTH** trên máy chủ giả chế độ IP; `550 5.7.0` → AUTH, bỏ chữ/IP; relay STARTTLS hỏng → máy chủ không thấy MAIL; relay từ chối mật khẩu sót, thiếu From, EHLO `localhost`. **Mật khẩu ứng dụng**: Chạy với **máy chủ SMTP giả cục bộ** `fake-smtp.test-support.ts` (127.0.0.1, không ra Internet): gửi thật qua socket + AUTH, đúng From/envelope/multipart/Message-ID cố định; sai mật khẩu → AUTH, không lộ địa chỉ/mật khẩu; 550 → INVALID_REQUEST (bỏ chữ máy chủ); 421 → RATE_LIMITED; máy chủ tắt → lỗi thử lại được + health `down`; **STARTTLS bắt buộc: máy chủ không làm được TLS thì không bao giờ thấy AUTH hay thư**; từ chối kênh khác / người nhận chèn header / tệp đính kèm / mẫu lạ |
| ↳ `email-templates.test.ts` | 11 ca | 4 mẫu × 2 giọng: Anh trước Việt, không emoji, chỉ màu trong bảng, có font + fallback, không link; escape HTML; không ký tự điều khiển trong tiêu đề; không số tài khoản |
| ↳ `safe-config.test.ts` | 1 ca mới | production cần smtp; ses/resend bị từ chối; URL đã bỏ; mật khẩu thô bị từ chối ở staging/production, được phép ở dev |
| `services/api` `email-adapter.test.ts` | 6 ca (sau sửa) | relay mặc định chạy với tệp rỗng như compose; relay từ chối tệp có mật khẩu và thiếu `EMAIL_FROM`; off/mock/smtp; production từ chối mock/off/trống; mật khẩu đọc từ tệp qua `resolveFileSecrets`; tệp rỗng/thiếu user → CONFIG, lỗi không chứa mật khẩu |
| `services/api` `integration/email-dispatch.test.ts` | 12/12 đạt (sau sửa) | PostgreSQL 17 thật, vai `ottimo_app`, có RLS. Thêm: quá nửa thời hạn thuê thì dừng gửi, trả hàng lại không tính lần thử, không gửi trùng ở lượt sau; mất lease → log `email lease lost`, không ghi đè. Các ca cũ: 06.15 gửi người dùng + owner có địa chỉ, không gửi manager; 06.33 chỉ người dùng (kể cả bị khóa); thử lại giãn cách; không gửi trùng người đã nhận; bỏ qua địa chỉ bị từ chối; `dead` sau 6 lần, log không có `@`; NO_RECIPIENT/BAD_TEMPLATE; topic khác không bị đụng; nhận lại sau hạn thuê; Q51-6 chỉ owner + ngày hiệu lực; giờ theo múi cơ sở |
| `services/api` toàn bộ (có DB) | Sau sửa: **3104/3111 đạt, 7 bỏ qua, 0 lỗi**. Bản đầu: 3043/3048, 3 lỗi | 3 lỗi là ca hiệu năng/tranh chấp (`reservations` p95 < 200 ms, `reversal-debt-g4` hai ca race) khi máy chạy nhiều container cùng lúc; chạy riêng 2 tệp đó: 45/45 đạt. Không liên quan email |
| `init-secrets.sh` | Chạy thử trong thư mục tạm, lệnh root được giả lập, dùng pty thật | Sau sửa: relay production không hỏi, tệp rỗng, thoát 0; `app_password` vẫn hỏi ẩn và lưu đúng. Bản đầu: Production không có terminal → thoát 1; staging → tệp rỗng; prompt: rỗng → hỏi lại, sai độ dài → hỏi lại, 2 lần khác nhau → hỏi lại, đúng (có dấu cách) → lưu 16 chữ; **mật khẩu không hiện trên màn hình**; `--reset-email-password` thay được; tham số lạ → thoát 2 |
| `check-compose.sh` | OK | |
| `tsc` + `eslint` + `prettier` | Sạch | Trên các tệp đã đổi |

Chưa thử với Google thật: relay chỉ nhận IP VPS đã khai. Lần gửi thật đầu tiên là ở bước 8b, sau khi INV bật relay (8a); INV kiểm hộp thư.

## 3. Việc INV cần làm
1. **Ngay – 8a:** bật "SMTP relay service" trong https://admin.google.com, theo đường dẫn Apps → Google Workspace → Gmail → Routing:
   - chỉ IP VPS production (và IP VPS staging nếu muốn thử), đội gửi IP qua chat;
   - chỉ địa chỉ trong miền của tôi;
   - bắt buộc TLS.

   Không thấy mục này thì chụp màn hình gửi đội.
2. **Khi OPS dựng production – 8b:** kiểm hộp thư có thư "OTTIMO – Security notice…".
3. **Không cần** tạo mật khẩu ứng dụng hay bật xác minh 2 bước cho việc gửi thư. Chỉ làm khi ORC báo phải dùng cách dự phòng.

## 4. Giả định
- [GIẢ ĐỊNH – SEC xác nhận] Bản gửi owner (06.15, mfa_reset) có **tên hiển thị** của nhân viên liên quan, để owner biết ai. Không có tên đăng nhập, SĐT hay email.
- [GIẢ ĐỊNH – INT] Người dùng ở trạng thái `locked` vẫn nhận thư về chính mình. Owner nhận bản sao phải `active`.
- [GIẢ ĐỊNH – INT] From = `info@ottimo.vn`. Relay với "chỉ địa chỉ trong miền của tôi" cho phép đổi sang `no-reply@ottimo.vn` chỉ bằng `EMAIL_FROM`, không cần thêm tài khoản.
- [GIẢ ĐỊNH – INT] EHLO = `ottimo.vn` (tên miền của From), theo khuyến nghị của Google: không dùng `localhost`.
- [GIẢ ĐỊNH – INT] Hàng `dead` không tự gửi lại. OPS gửi lại bằng SQL (`UPDATE outbox_message SET status='pending', attempts=0, next_attempt_at=NULL WHERE topic='staff.email' AND status='dead'`) sau khi sửa cấu hình (IP relay hoặc mật khẩu).
- Không tạo ESC: INV đã quyết, không phát sinh phí (Workspace sẵn có), không cần hợp đồng mới.

## 5. Rủi ro / việc cho vai khác
- **BE-B (Q51-6)**: phần server nhánh tiền chưa ghi email. Khi lưu hoặc hủy dòng tài khoản nhận cọc, cần ghi outbox:
  - `topic = 'staff.email'`;
  - payload `{ template: 'receiving_account_changed', userIds: [], owners: true, effectiveDate: 'YYYY-MM-DD' }`;
  - cùng giao dịch, cùng dạng `MfaStore.email`. Worker và mẫu đã sẵn.
- **OPS**:
  - (a) `ops-check` nên báo khi có hàng `staff.email` ở `dead`, hoặc `failed` quá 1 giờ;
  - (b) staging đang chạy cần chạy lại `init-secrets.sh` trước lần deploy tới, vì compose có thêm secret `email_smtp_password` mà `deploy.sh` kiểm thiếu tệp;
  - (c) có thể thêm vào `deploy.sh` kiểm `EMAIL_PROVIDER=smtp` cho production. Config đã chặn, nên đây chỉ là báo sớm.
- **SEC**:
  - review adapter, mẫu thư, prompt `init-secrets.sh`;
  - xác nhận giả định tên hiển thị;
  - dữ liệu đi qua Google: địa chỉ email nhân viên/owner + tên hiển thị. Không có dữ liệu khách, vì đây là đối tác xử lý email sẵn có của OTTIMO.
- Đổi VPS hoặc IP thì phải sửa IP trong mục relay trước. Nếu không, thư thử lại khoảng 4,4 giờ rồi chuyển `dead`. OPS ghi vào runbook đổi máy chủ.
- **J18** (ARC-04): khi làm bộ gửi outbox chung, J18 không được nhận topic `staff.email`, hoặc phải dùng `StaffEmailDispatcher` làm handler cho topic đó.
- Sprint 2 (ARC-01 + SEC-03): cổng `identity` tra người nhận, cần BE đồng ý.
- Thay đổi hành vi: production thiếu `EMAIL_PROVIDER=smtp` / `EMAIL_FROM` thì **không khởi động**. Relay chưa bật thì worker vẫn chạy: thư thử lại và log `email smtp check` lỗi kèm mã. Vì vậy 8a phải xong trước khi deploy production.

## 6. File đã tạo/sửa
Tạo:
- `product/integrations/notification/smtp.ts`, `email-templates.ts`, `index.ts`
- `product/integrations/notification/fake-smtp.test-support.ts` (chỉ dùng cho test, không vào bản build)
- `product/integrations/notification/smtp.test.ts`, `email-templates.test.ts`
- `product/services/api/src/jobs/email-dispatch.ts`, `email-adapter.ts`
- `product/services/api/test/email-adapter.test.ts`, `test/integration/email-dispatch.test.ts`
- `rounds/round-03/outputs/INT/s1-email.md`
- `rounds/round-03/responses/s1-INT-email.md` (Phản hồi & sửa)

Sửa:
- `product/integrations/common/safe-config.ts` (+ test), `package.json` (nodemailer 10.0.16, export `./notification`), `tsconfig.build.json`, `README.md` mục 4
- `product/pnpm-lock.yaml`
- `product/services/api/src/worker.ts`, `test/config.test.ts`
- `product/infra/docker-compose.prod.yml`, `infra/server/bin/init-secrets.sh`, `infra/ci/check-compose.sh`, `infra/server/env.example`, `infra/server/env.production.example`
- `product/.env.example`
- `product/docs/integrations.md` (mục 3.4.1)
- `rounds/round-03/outputs/OPS/inv-production-steps.md` (Phần 8)
- `01-decisions/decision-log.md`
