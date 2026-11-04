# BE-A – P4-06 `v104/be-identity` (Round 4 – v1.0.4 – Bước: Sản xuất)

- Người làm: BE-A | 04/11/2026 | Nhánh `v104/be-identity`, cắt từ `origin/main` @ `c6cd32a8` (giai đoạn A – chưa rebase `main@L`).
- Căn cứ: `rounds/round-04/plan-v1.0.4.md` dòng P4-06 mục 3, mục 4.1, mục 6.6–6.7, brief "BE-A – P4-06" mục 8; backlog 5.6; `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` (SEC quyết M18-08 và hạ SENT-02 xuống Minor, ORC báo 04/11); các review SEC/ARC/INT nêu ở brief.
- Chỉ sửa tệp của BE-A (mục 4.1) + test liên quan. Không chạm `openapi.yaml`, tệp sinh ra, `integrations/notification/**` (INT), `.env.example`/`infra/**` (OPS, danh sách 4.2).
- Dữ liệu thử: chỉ địa chỉ `@example.test` / `.test`.

## 1. AC theo thẻ

| Thẻ | Trạng thái | Cách làm | Test |
|---|---|---|---|
| **FB-R4-SEC-ARC-EM-09** (bắt buộc) | **Xong (phần mã)**. Phần meta 429 chờ P4-00 (e) | `EMAIL_CHANGE_LIMIT = {max 5, 24 h}`. Đếm `user_email_change` theo `user_id` (người **được** đổi, mọi `via`), cửa sổ trượt theo `changed_at`. Lần thứ 6 → `429 RATE_LIMITED` + `Retry-After` = giây tới khi lần đổi gần thứ 5 rời cửa sổ. Thứ tự: RBAC/403 → dạng địa chỉ/hộp chung 422 → **429** → S2 (không tiêu S2, không đếm sai). Kiểm lại trong giao dịch ghi, sau khóa dòng `app_user` (2 yêu cầu song song không cùng lọt ở mức 4). Cùng địa chỉ (no-op) không bị giới hạn. Không migration | `v104-be-identity.test.ts`: 5 ca EM-09 (6th → 429, Retry-After 86400, không thử mật khẩu sai; no-op 200; cửa sổ trượt + Retry-After 4 h; đếm chung `self`+`owner`, chủ không bị tính khi đổi cho người khác, PATCH chỉ tên không bị chặn; thứ tự 403/422 trước 429); unit hằng số |
| **SEC-SENT-02 + ARC-BA-M18-01** (phần mã; SEC hạ Minor) | **Xong** | `identity/public/shared-mailboxes.ts`: danh sách = `EMAIL_SHARED_MAILBOXES` (cấu hình, độc lập `EMAIL_FROM`) ∪ `info@`/`booking@` tại các miền thư (miền của danh sách + miền `EMAIL_FROM`) ∪ **luôn** địa chỉ `EMAIL_FROM`. So sau chuẩn hóa (`normalizeSecurityEmail`) và bỏ `+…`. Mục sai trong biến → API không khởi động (thông báo chỉ nêu vị trí, không nêu giá trị). Staging/production có `EMAIL_FROM` mà thiếu biến → 1 dòng log `warn` (không địa chỉ) | Unit 6 ca (gồm "đổi `EMAIL_FROM` vẫn chặn `info@`" với 3 giá trị From); tích hợp: From = `noreply@`, 9 biến thể bị 422 trước S2, `updateUser` cùng luật, địa chỉ riêng và `info@` miền khác qua |
| **M18-08** (SEC: không đổi dispatcher) | **Xong** | Không đổi luật. Thêm chú thích cạnh câu SQL: "`locked` = khóa tự động do sai mật khẩu, không phải nút Khóa tài khoản (SEC M18-08)" | 2 test dispatcher: `disabled` → không bản `self`, OWN `active` vẫn có bản `owner`; `locked` (`locked_until` NULL) → vẫn có bản `self` |
| **G-BE-4 / INT-BE-31-05** (phần dispatcher) | **Xong** | `paramsFor()`: `staffName` chỉ ở bản `owner`; bản `self`/`previous` bỏ | Unit + tích hợp (3 bản, chỉ `owner` có `staffName`) |
| **ARC-OPS-PR32-06** (phần BE) | **Xong** | Lệnh mới `node dist/admin/known-email-templates-cli.js <mẫu>` (0 biết / 1 không / 2 sai cú pháp) và `--list` (một dòng JSON). Đọc `STAFF_EMAIL_TEMPLATES` của chính image; không DB, không env | Unit 2 ca. **OPS (P4-03)** đổi `probe` trong `requeue-email-changed.sh` sang lệnh này |
| **ARC-BE-31-05** | Đã có từ v1.0.3 | `EMAIL_CHANGED_TEMPLATE … satisfies StaffEmailTemplate` (một chỗ khai, đổi tên bên INT thì `tsc` đỏ). Không sửa thêm | Ca có sẵn `be-a-v103-email-units` |
| **SEC-BE-018-01** | **Xong** | (a) mảng hằng `PINNED_SELF_DATA_FIELDS` trong test, chú thích "thêm khóa phải có SEC review"; (b) test liệt kê mọi trường mã D trực tiếp của `Me` và của các op `/v1/me*`, mỗi trường phải nằm trong `SELF_DATA_FIELDS` hoặc `DELIBERATELY_HIDDEN` (hiện rỗng), và không có khóa thừa; (c) CODEOWNERS là việc OPS P4-03 | `serializer.test.ts` 3 ca mới |
| **SEC-BE-018-02 + ARC-BE-018-04** | **Xong** | Khóa có tiền tố `schema:` / `op:` (`schema:Me.email`, `op:setMyEmail.email`…). Kiểu `SelfOwner` | Ca "khóa mang loại chủ" |
| **ARC-BE-018-03** | **Xong** | `propertyAllowed(p, ctx, owner, key)`: chỉ ghép chuỗi `<owner>.<key>` khi mã D đã từ chối | Toàn bộ `serializer.test.ts` + `be-c-s3-units` xanh |
| **SEC-ARC-018-03** (phần mã) | **Chờ P4-00** | Đọc `x-self-data` từ meta sinh ra, giữ `SELF_DATA_FIELDS` làm kiểm chéo (test so hai nguồn) – làm sau khi rebase lên hợp đồng 0.3.12 | – |
| **SEC-BE-018-04** | **Xong** | `noStore(reply)` (Cache-Control + Pragma) cho `startMy2faSetup`, `confirmMy2fa`, `regenerateMyRecoveryCodes` | Unit đọc mã + tích hợp `Pragma: no-cache` |
| **INT-BE-31-04** (phần API) | **Xong** (sau khi gộp `origin/v104/int-email` @ `51991057`, ORC: P4-05 + P4-06 một PR) | `shared/email.ts`: `normalizeSecurityEmail` gọi `normalizeEmailAddress` của INT; `SECURITY_EMAIL_MAX = EMAIL_ADDRESS_MAX`; xóa bản sao regex. Luật hộp thư chung (BE-A) chạy sau hàm chung | `be-a-v103-email-units`: 2 hàm cho cùng kết quả trên VALID ∪ INVALID; hằng số bằng nhau; `shared/email.ts` không còn regex riêng |
| **ARC-BE-31-04** (nếu kịp) | **Xong** | `ProblemError.options.auditReason` (chỉ phía máy chủ, không vào thân/header/log). Bỏ `WeakSet` `TARGET_OWNER_DENIALS` | Unit (không lộ ra thân) + tích hợp nhánh kiểm lại **trong giao dịch** (TOCTOU) → audit `TARGET_OWNER` |
| **V3-04** (nếu kịp) | **Xong (mã)**. README OPS chưa | `production-bootstrap --owner-email`: cờ **không nhận giá trị** (có giá trị → từ chối), hỏi bằng dấu nhắc ẩn (raw mode, không echo); Enter = bỏ trống. Cùng luật `normalizeSecurityEmail` + hộp thư chung; lỗi không nhắc lại địa chỉ. Màn hình cuối chỉ in "set/not set" | Unit cờ. Chưa chạy thử dấu nhắc trên stack thử (cần TTY thật) – để QA/OPS |

## 2. Tệp tạo/sửa
- Mới: `product/services/api/src/modules/identity/public/shared-mailboxes.ts`, `product/services/api/src/admin/known-email-templates-cli.ts`, `product/services/api/test/be-a-v104-identity-units.test.ts`, `product/services/api/test/integration/v104-be-identity.test.ts`.
- Sửa: `identity/internal/{security-email.service,security-email.controller,users.controller,users.service,mfa.controller}.ts`, `identity/public/identity-options.ts`, `jobs/email-dispatch.ts`, `shared/problem.ts`, `shared/serialization/{field-policy,serializer}.ts`, `main.ts`, `admin/{production-bootstrap,production-bootstrap-cli}.ts`, `test/serializer.test.ts`, `test/helpers/feature-app.ts` (thêm tùy chọn `sharedMailboxes`, chỉ thêm).
- Ghi chú chủ tệp: `shared/problem.ts` là tệp plan gọi là "`shared/http/problem*.ts`" (repo không có `shared/http/problem*`). `admin/known-email-templates-cli.ts` là tệp mới cạnh `production-bootstrap*` trong `admin/`.

## 3. Kiểm thử
- Typecheck `@ottimo/api` sạch; ESLint các tệp đã sửa sạch; Prettier đã chạy.
- Unit mới 14/14; `serializer.test.ts` + `be-c-s3-units` 27/27; tích hợp mới 11/11 (PostgreSQL 17 riêng, RLS bật, `ottimo_app`).
- Toàn bộ unit `services/api` (không DB): 44 tệp, 889 đạt, 28 bỏ qua, 0 lỗi.
- Tích hợp liên quan, chạy tuần tự (`v103-security-email`, `identity`, `mfa-us143`, `production-bootstrap`, `email-dispatch`, `v104-be-identity`, `http-foundation`, `rbac-sprint1`): 8 tệp, 372 đạt, 5 bỏ qua, 0 lỗi (sau khi sửa 1 ca cũ `email-dispatch` 06.15 đang ghim `staffName` ở bản `self` – đổi đúng theo G-BE-4).
- Sau gộp INT: unit API 892 đạt / 28 bỏ qua; `@ottimo/integrations` 289 đạt; tích hợp `v103-security-email`, `v104-be-identity`, `email-dispatch`, `production-bootstrap` 68 đạt / 5 bỏ qua.
- Bộ tích hợp **đầy đủ** chưa chạy được trên máy: tải máy ~45 (nhiều làn chạy DB cùng lúc), các tệp không liên quan (`approvals-audit`, `reversal-debt-g4`, `payments-s3`…) hết giờ chờ hook sau 100–1000 s. Không phải lỗi do gói này; để CI chạy trọn.
- Không log/Problem/audit nào chứa địa chỉ đầy đủ: các ca 429 và 422 kiểm `res.body` không có `@`; dòng `warn` khởi động không có địa chỉ.

## 4. Đề xuất hợp đồng cho ARC (P4-00, 0.3.12)
1. **(e) EM-09:** `setMyEmail` và `updateUser` thêm `429` (`RATE_LIMITED`, header `Retry-After`) và `x-rate-limit` mô tả "5 lần đổi **thành công** / người được đổi / 24 giờ trượt, mọi `via`; cùng địa chỉ không tính; kiểm sau RBAC + luật địa chỉ, trước S2". Mô tả thứ tự kiểm của `setMyEmail` (dòng ~846) và `updateUser` chèn bước 429 giữa 422 địa chỉ và S2.
2. **`EMAIL_SHARED_MAILBOX` (bảng mã lỗi, dòng ~232) và mô tả `setMyEmail`:** đổi "trùng `EMAIL_FROM`" thành "là hộp thư chung: danh sách cấu hình `EMAIL_SHARED_MAILBOXES` + `info@`/`booking@` tại miền thư + `EMAIL_FROM`; so sau khi bỏ `+…`, không phân biệt hoa thường. Máy chủ không cấu hình cả hai biến thì không kiểm."
3. **(f) `x-self-data`:** BE-A cần trong `openapi-meta.ts`/`openapi-schemas.ts` sinh ra một cờ trên `PropShape` (ví dụ `sd: true`) để serializer đọc thẳng. BE-A sẽ giữ `SELF_DATA_FIELDS` (khóa `schema:`/`op:`) làm kiểm chéo: test so hai nguồn phải khớp.
4. Không cần thay đổi hợp đồng cho G-BE-4, M18-08, 018-04, ARC-BE-31-04, V3-04.

## 5. Việc cho vai khác (không phải tệp của BE-A)
- **OPS (P4-03):** `requeue-email-changed.sh` đổi `probe` sang `node dist/admin/known-email-templates-cli.js email_changed` (mã 0/1; mã khác = từ chối như hiện nay). CODEOWNERS `field-policy.ts` → SEC.
- **OPS (sau `main@L`):** thêm `EMAIL_SHARED_MAILBOXES` vào `docker-compose.prod.yml` (`${EMAIL_SHARED_MAILBOXES:-}` trong `*api-env`), `infra/server/env.production.example` (giá trị thật do OPS điền trên máy, không ghi vào repo nếu SEC coi là nhạy cảm), `product/.env.example` (giá trị mẫu `info@example.test,booking@example.test` theo SEC mục 5). K5b/gate 2.7 đếm "`info@` có trong danh sách hộp thư chung". README 13.8 ghi điều kiện treo của SEC (đổi From → thẻ SENT-02 lại bắt buộc). README hướng dẫn `production-bootstrap --owner-email` (V3-04).
- **BA:** dòng sổ tay M18-08 theo SEC-on-plan-v1.0.4 mục 2.2.

## 6. Giả định
- **G-BE-A-104-1:** Mặc định khi chưa cấu hình danh sách: `info@`, `booking@` tại miền của `EMAIL_FROM`. Production hiện `EMAIL_FROM=info@ottimo.vn` nên chặn được `info@`, `info+x@`, `booking@` ngay cả trước khi OPS thêm biến. Đây là lưới an toàn, không thay cho danh sách cấu hình.
- **G-BE-A-104-2:** Không bỏ dấu chấm trong phần tên (Google Workspace không coi `i.nfo@` là `info@`; chỉ Gmail cá nhân làm vậy).
- **G-BE-A-104-3:** Lần bị chặn 429 không ghi audit (không có thay đổi; SEC muốn đếm thì thêm `ops-check` theo EM-09 phương án dự phòng).
- **G-BE-A-104-4:** Cửa sổ EM-09 đo bằng `changed_at` của `user_email_change` (dòng không bị xóa, job purge chỉ xóa `old_email`).

## 7. Rủi ro / chưa xong
- Phần B (sau `main@L` + P4-00): rebase; meta 429 + `x-self-data` (SEC-ARC-018-03).
- `feature-app.ts` là helper test dùng chung: thay đổi chỉ thêm một tùy chọn, rebase dễ.
- V3-04 chưa thử trên TTY thật.
