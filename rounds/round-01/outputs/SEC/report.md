# Báo cáo SEC – Round 1 · Bước 2 Sản xuất · Đợt 1 (Phần 1)

> Ghi chú ORC: SEC không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung SEC gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Kiểm kê 28 nhóm dữ liệu cá nhân (D01–D28): khách, người đi cùng, trẻ em, CTV, nhân viên, lead. Mỗi nhóm có nguồn, vị trí trong BL, mục đích, loại pháp lý, mức nội bộ và ai được xem (đề xuất cho RBAC của BA).
- Thang phân loại C0 Công khai, C1 Nội bộ, C2 Nhạy cảm, C3 Rất nhạy cảm, kèm kiểm soát tối thiểu cho từng mức.
- 11 mục đích xử lý (P01–P11) kèm cơ sở pháp lý theo NĐ 13/2023. Yêu cầu về đồng ý (R-CON), thông báo xử lý dữ liệu, quyền của khách (R-DSR), hồ sơ đánh giá tác động và chuyển dữ liệu ra nước ngoài.
- 18 thời hạn lưu/xóa (T01–T18), cần luật sư xác nhận, cấu hình được.
- 12 yêu cầu khai báo lưu trú (R-REG) và 10 yêu cầu thanh toán/PCI DSS (R-PAY).
- 14 phát hiện từ baseline (F01–F14), nổi bật là F02, F05, F06, F07, F08, F09.
- Bảng đầu vào cho BA, DOM, ARC, INT, OPS, UXD, PO, QA (mục 11) và 10 câu hỏi pháp lý (mục 12).
- Tạo ESC-001 và ESC-002.

## 2. File đã tạo/sửa
- `product/docs/security/data-risk-assessment.md` (tạo mới)
- `02-escalations/ESC-001.md`, `02-escalations/ESC-002.md` (tạo mới)
- `rounds/round-01/outputs/SEC/report.md` (file này)
- Không sửa escalations-index và decision-log; ORC cập nhật theo mục 13 của tài liệu.

## 3. Giả định
- `[GIẢ ĐỊNH – chờ INV xác nhận]` Thời hạn lưu/xóa ở mục 7 là giá trị mặc định cấu hình được, chờ ESC-001.
- `[GIẢ ĐỊNH]` Điều khoản dẫn chiếu là hiểu biết của đội, chưa tra văn bản gốc, có thể đã bị Luật 91/2025/QH15 và văn bản hướng dẫn thay đổi.
- `[GIẢ ĐỊNH]` Cổng Bộ Công an không có API, khai báo bán tự động.
- `[GIẢ ĐỊNH]` Thẻ online qua trang của cổng; thẻ tại quầy dùng POS ngân hàng.
- Ngưỡng trẻ em để bảo vệ dữ liệu là dưới 16 tuổi, khác ngưỡng dưới 14 tuổi của BL 3.17. DOM và BA thống nhất.

## 4. Rủi ro / vướng mắc
- Pháp lý chưa chắc chắn: đội không phải luật sư và Luật 91/2025 đã thay khung NĐ 13. Giảm thiểu bằng ESC-001 và để mọi con số cấu hình được.
- Nếu hạn khai báo khách nước ngoài đúng là 12 giờ thì phải đổi BR khai báo của DOM và job nhắc hạn của ARC.
- Mã cửa theo ngày sinh là mong muốn INV đã nêu nhưng rủi ro an toàn cao. PO/INT đưa vào ESC khóa cửa.
- Ảnh giấy tờ trong nhóm chat Zalo là rủi ro ngoài app, cần INV ban hành quy định nội bộ.
- Số ESC 001/002 có thể trùng với PO/DOM; ORC đánh lại nếu cần.

## 5. Việc chưa xong
- **Phần 2 (Đợt 4, chờ ARC Pha B có ERD và OpenAPI):**
  - `product/docs/security/threat-model.md` (STRIDE).
  - `product/docs/security/security-requirements.md`: xác thực, phân quyền, mã hóa và quản lý khóa, nhật ký truy cập ảnh giấy tờ, callback thanh toán, lưu trữ trên thiết bị.
- Review bắt buộc ARC, INT, OPS ở bước 3; khuyến nghị mạnh review RBAC của BA; soát OpenAPI/ERD ở bước 5.
- Bản nháp hồ sơ đánh giá tác động: Round 3.

---

# Báo cáo SEC – Round 1 · Bước 2 Sản xuất · Đợt 4 (Phần 2)

## 1. Đã làm gì
- **Threat model STRIDE** trên kiến trúc thật (ARC Pha A + B): 16 tài sản, 10 tác nhân, 11 biên tin cậy, 10 luồng dữ liệu (ảnh giấy tờ, upload của khách, link app khách, IPN/bank feed, channel manager, khóa cửa, PWA offline, máy quầy, sao lưu, đăng nhập), **60 mối đe dọa** có mức rủi ro trước/sau biện pháp. Trước biện pháp: 3 Critical, 23 High, 27 Medium, 7 Low. Sau biện pháp: 0 Critical, 2 High còn lại (TM-13 chiếm VPS = có KEK + DB; TM-17 ảnh giấy tờ qua điện thoại/nhóm chat). **26/26 rủi ro Critical/High có ≥ 1 biện pháp cụ thể** có mã SR (QC A14).
- **Yêu cầu bảo mật** ~165 mục mã SR-xxx, mỗi mục có cách kiểm chứng, round phải đạt, vai chịu trách nhiệm, truy về TM: xác thực (2FA TOTP bắt buộc OWN/MGR trước khi chạy thật), phiên, **thiết bị được cấp (máy quầy)**, phân quyền 3 lớp theo rbac-matrix + test sinh từ OpenAPI, C3 + nhật ký truy cập, mã hóa và quản lý khóa (siết ADR-013), tệp tải lên, thời hạn lưu, **xác minh mức 2 app khách**, callback thanh toán, khóa cửa, tin nhắn, PWA/thiết bị, rate limit, bí mật/.env, sao lưu T18, log che dữ liệu, header/origin, chuỗi cung ứng, quyền chủ thể, sự cố. Có bảng DoD bảo mật cho story R2.
- **Soát nhanh OpenAPI/ERD/infra** theo security-requirements: 25 phát hiện (mục 4) – bước 5 đưa vào bug-list.
- **Quan điểm SEC về M1, M3, M4, M8, M9** (threat-model mục 10, tóm tắt ở mục 5 dưới).

## 2. File đã tạo/sửa
- `product/docs/security/threat-model.md` (tạo mới)
- `product/docs/security/security-requirements.md` (tạo mới)
- `rounds/round-01/outputs/SEC/report.md` (thêm Phần 2, giữ Phần 1)
- Không sửa file của vai khác, `decision-log.md`, `02-escalations/`.

## 3. Giả định
- `[GIẢ ĐỊNH]` Máy quầy là 1–2 máy tính Windows/macOS cố định tại quầy; nhân viên buồng phòng/sale dùng điện thoại cá nhân (không có MDM) → PWA không giữ C3.
- `[GIẢ ĐỊNH]` VNPay gửi IPN dạng GET có tham số trên query – INT xác minh ở R3 (ảnh hưởng SR-PAY-05, SR-LOG-02).
- `[GIẢ ĐỊNH]` Beds24 cho tắt chuyển thẻ ảo qua API/webhook – INT xác minh trước R3.
- `[GIẢ ĐỊNH]` Ngân sách MVP không có KMS/HSM, WAF trả phí, SIEM; email giao dịch có từ R2 (dùng cho OTP khách).
- Mọi con số kỹ thuật (thời hạn phiên 30 phút/12 giờ, 72 giờ/30 ngày; khóa sau 5 lần sai; OTP 10 phút; thiết bị 180 ngày; step-up C3 15 phút; giới hạn tệp 10 MB…) là **tham số SEC đặt**, cấu hình được, không phải chính sách kinh doanh.

## 4. Phát hiện khi soát OpenAPI / ERD / infra (đưa vào `qa/bug-list.md` ở bước 5)

Mức rủi ro theo threat model; cột P là mức lỗi đề xuất cho bug-list (P1 = phải sửa trong round, trước khi code R2 phần liên quan).

| ID | Mức | P | Vị trí | Vấn đề | Đề xuất sửa | Vai | SR / TM |
|---|---|:-:|---|---|---|---|---|
| SEC-R1-01 | High | P1 | openapi `/v1/guest/sessions/verify` | Lên mức 2 bằng `phoneLast4` **hoặc** `bookingCode`. Mã đặt phòng tăng dần (`OTM-00171`) và nằm ngay trong tin nhắn chứa link (ví dụ `renderMessage`) → ai có link cũng lên mức 2, xem bill và **mã cửa** | Thay bằng OTP email (6 số, 10 phút) **hoặc** mã xác minh do lễ tân cấp; thêm endpoint gửi OTP và endpoint cấp mã cho FD+; bỏ 2 trường cũ | ARC, BE, MOB, UXD | SR-GST-07; TM-21 |
| SEC-R1-02 | High | P1 | erd 4.5 `guest_session.failed_verify_count` | Đếm lần xác minh sai theo **phiên** → mở phiên mới từ link là xóa bộ đếm, dò được vô hạn | Chuyển bộ đếm + `verify_locked_until` sang `guest_access_token`; thêm bộ đếm OTP đã gửi | ARC | SR-GST-08; TM-21 |
| SEC-R1-03 | High | P1 | openapi các endpoint `x-classification: C3`; erd `user_session.device_trusted` | "C3 chỉ trên máy quầy" (rbac 8.7) chưa có cơ chế: cờ theo phiên không gắn thiết bị, chỉ `portal-data` nhắc tới trong mô tả; thiếu mã lỗi | Bảng `trusted_device` + cookie `__Host-ottimo_did`; `x-requires-trusted-device: true` cho documents POST/PATCH, `sensitive`, `images/{id}`, `portal-data`, `door-credential` GET/PUT, xóa ảnh; mã lỗi `403 DEVICE_NOT_TRUSTED`; endpoint cấp/thu hồi thiết bị (OWN) | ARC, BE, FE | SR-DEV-01…06; TM-46 |
| SEC-R1-04 | High | P1 | ADR-013 mục 3; ADR-010 "giữ 7 ngày + 4 tuần + 3 tháng" | ADR-013 nói hủy DEK làm backup cũ "không giải mã được" – **sai**: `data_key.wrapped_key` nằm trong chính DB được sao lưu và KEK không đổi → dữ liệu "đã xóa" khôi phục được tới khi backup hết hạn; ADR-010 giữ 3 tháng (OPS đã đổi ≤ 35 ngày trong decision-log nhưng ADR chưa sửa) | Sửa câu chữ ADR-013; vòng đời backup cứng ≤ 35 ngày, snapshot nhà cung cấp tắt hoặc ≤ 7 ngày; thêm `purge_journal` áp lại sau khôi phục; thông báo xử lý dữ liệu nêu "≤ 35 ngày trong backup" | ARC, OPS, PO | SR-KEY-09, SR-BAK-03, -06, -07; TM-15, TM-56 |
| SEC-R1-05 | High | P1 | openapi `PUT /v1/users/{userId}/roles` ("có hiệu lực ở lần đăng nhập kế tiếp"), `PATCH /v1/users/{userId}` | Đổi vai/khóa tài khoản không thu hồi phiên → nhân viên nghỉ việc còn phiên dùng tiếp | Thu hồi mọi phiên khi đổi vai, khóa, đặt lại mật khẩu; sửa mô tả | ARC, BE | SR-SES-06, SR-AZ-08; TM-03 |
| SEC-R1-06 | Medium | P2 | openapi `POST …/messages/render` (x-roles có `collaborator`) | Render mẫu `checkin_link` trả link app khách → CTV lấy được link dù rbac A22 cấm CTV; không rõ render có cấp token mới (thu hồi link cũ) hay không | Mẫu chứa link đi qua luồng cấp link với quyền A22; quy định rõ dùng link đang hiệu lực hay cấp lại | ARC, BE | SR-MSG-03; TM-21, TM-60 |
| SEC-R1-07 | Medium | P2 | openapi `/v1/webhooks/payments/{provider}`, `/v1/webhooks/channel/{provider}` | Thiếu định danh cơ sở trong đường dẫn (ADR-011 ghi `/{provider}/{propertySlug}`) để chọn bí mật theo cơ sở; chỉ có POST (VNPay IPN có thể là GET – INT xác minh); enum có `mock` – phải không đăng ký ở production; chưa nêu giới hạn body | Sửa đường dẫn, thêm GET khi cổng yêu cầu, ghi chú "mock chỉ dev/staging", body ≤ 64 KB | ARC, INT | SR-PAY-05; TM-28, TM-33 |
| SEC-R1-08 | High | P1 | INT README `ChannelBookingEvent.raw: unknown`; erd `inbox_message.payload_ref` | Payload thô từ channel manager có thể chứa thẻ ảo/thẻ khách (VCC) → lưu nguyên là đưa dữ liệu thẻ vào OTTIMO (vi phạm R-PAY-01/06, mở phạm vi PCI DSS) | Lọc theo danh sách trường cho phép trước khi lưu/log; không lưu `raw` nguyên; `payload_ref` chỉ bản đã lọc, xóa sau 90 ngày; INT tắt chuyển thẻ trên Beds24 | INT, ARC | SR-PAY-09; TM-30 |
| SEC-R1-09 | Medium | P2 | openapi `Guest.tags`, `Guest.serviceNotes`, `Guest.warnings`, `GuestSummary.tags`; `Party.members[]` với `own_count_only` | Lệch rbac mục 6 D12: CTV = K (không thấy tag) nhưng `tags` không có `x-visible-to`; SAL chỉ thấy tag nhưng `serviceNotes` không giới hạn; `warnings` lộ mã khách khác ngoài phạm vi của SAL/CTV; `Party` cho SAL/CTV phải chỉ còn số người (rbac D10) – schema chưa thể hiện | `tags`: `x-visible-to` [owner, manager, fdl, fd, sales_staff]; `serviceNotes`: [owner, manager, fdl, fd, housekeeping]; `warnings`: [owner, manager, fdl, fd]; ghi rõ serializer `own_count_only` bỏ `members` | ARC | SR-AZ-04; TM-08 |
| SEC-R1-10 | Low | P3 | openapi `QuoteCalculation.commission`; `Folio.totals` | `commission` không giới hạn → FD/FDL thấy hoa hồng người khác (rbac: K); CTV nhận đủ `totals` (`otherVnd`, `focVnd`, `paidViaOtaVnd`) trong khi rbac chỉ cho tổng tiền phòng + cọc | `commission`: `x-visible-to` [owner, manager, sales_staff, collaborator] (+ phạm vi M); các trường `totals` ngoài `roomVnd`/`depositHeldVnd` thêm `x-visible-to` không gồm CTV | ARC | SR-AZ-04; TM-08 |
| SEC-R1-11 | Medium | P2 | openapi `POST /guests/lookup` (`exists_only_or_own` cho SAL/CTV) | Thành "máy dò": CTV tra bất kỳ SĐT nào để biết người đó có phải khách OTTIMO | Giới hạn 30 lần/giờ/người, ghi audit mỗi lần tra; câu trả lời cho SAL/CTV chỉ "có thể trùng – liên hệ lễ tân" khi tạo mới, không trả mã khách ngoài phạm vi | ARC, BE | SR-RL-07; TM-07 |
| SEC-R1-12 | Low | P3 | openapi `GuestDocumentInput` (trừ `docNumber`), `PartyMemberCreate.childName/childBirthYear` | Thuộc tính C3 đầu vào thiếu `writeOnly: true` | Thêm `writeOnly` | ARC | SR-INP-03 |
| SEC-R1-13 | Medium | P2 | openapi `DoorCredentialInput.code` `^[0-9]{4,10}$` | Cho mã 4 số (10⁴, cộng `codeHint` 2 số cuối → còn 100 khả năng) | `^[0-9]{6,10}$`; mã do lõi sinh từ CSPRNG | ARC, BE | SR-LOCK-01; TM-38 |
| SEC-R1-14 | Medium | P2 | openapi `AuditEvent.before/after` (`additionalProperties: true`) | Không có ràng buộc → dễ lọt C2/C3 vào nhật ký (FD xem nhật ký của mình) | Serializer audit theo danh sách cho phép từng thực thể; ghi chú trong schema | ARC, BE | SR-AUD-03; TM-08 |
| SEC-R1-15 | Medium | P2 | erd `c3_access_log`; openapi `C3AccessEntry`; `GuestStay.doorCode` | Thiếu `actor_type` (khách tải giấy tờ/xem mã cửa), `session_id`, `trusted_device_id`, `ip_hmac`; erd chỉ ghi log khi **nhân viên** xem mã cửa – khách xem mã cửa (C3) không có nhật ký | Thêm cột; ghi log cả lượt khách xem mã cửa | ARC, BE | SR-C3-08, SR-GST-10; TM-19 |
| SEC-R1-16 | Medium | P2 | openapi `…/documents` POST, `/guest/online-checkin/documents`, `/attachments` | Chưa có giới hạn kích thước/số tệp, chưa nêu kiểm magic bytes, mã hóa lại ảnh, bỏ EXIF; PDF phục vụ `inline` không có CSP sandbox; khách được gửi PDF | Ghi ràng buộc SR-FILE vào mô tả; khách chỉ ảnh; header SR-C3-03 | ARC, BE | SR-FILE-01…06; TM-16 |
| SEC-R1-17 | Medium | P2 | openapi guest-portal | Không có endpoint khách **rút đồng ý** (R-CON-03) | Thêm `POST /v1/guest/consents/{purpose}/withdraw` (mức 2) | ARC | SR-DSR-02 |
| SEC-R1-18 | Low | P3 | openapi auth; erd `app_user` | Thiếu `POST /v1/me/password`, đặt PIN duyệt (S01 có "đổi mật khẩu, PIN duyệt"); thiếu cột `must_change_password`, `password_changed_at`, (R3) `mfa_secret_enc`, `mfa_enabled`, mã khôi phục | Thêm endpoint + cột | ARC | SR-AUTH-05, -06, -09 |
| SEC-R1-19 | Low | P3 | erd `reservation_guest.child_*_enc`; `guest_document.visa_kind` | `child_*_enc` không có `data_key_id` (không rõ DEK nào, không hủy riêng được); `visa_kind` ghi "C3 → lưu `_enc`" nhưng tên cột không có `_enc` | Thêm `data_key_id`; đổi tên `visa_kind_enc` (hoặc hạ xuống C2 có lý do) | ARC | SR-KEY-01, SR-C3-01 |
| SEC-R1-20 | Low | P3 | erd `audit_event.ip_hash`, `user_session.ip_hash` | SHA-256 trần của IPv4 dò ngược được | HMAC với khóa riêng `LOG_IP_HMAC_KEY` (thêm vào `.env.example`) | ARC, OPS | SR-KEY-08 |
| SEC-R1-21 | Low | P3 | erd mục 12 | Thiếu `purge_journal` (chỉ ID) để áp lại việc xóa sau khi khôi phục backup | Thêm bảng | ARC | SR-RET-03, SR-BAK-06; TM-56 |
| SEC-R1-22 | Low | P3 | openapi `door-credential` PUT, `DELETE …/registrations/{id}/images` | Thiếu `Idempotency-Key`/`If-Match` với thao tác C3 | Thêm | ARC | – |
| SEC-R1-23 | Low | P3 | `product/.dockerignore` | Không loại `.data/` (thư mục blob/dữ liệu dev) → có thể vào build context | Thêm `.data/`, `*.pem`, `*.key`, `*.age`, `*.dump` | OPS | SR-SECR-02; TM-47 |
| SEC-R1-24 | Low | P3 | `.github/workflows/ci.yml`, `Dockerfile.api` | Nhánh fallback `--no-frozen-lockfile`; chưa quét lỗ hổng phụ thuộc; action ghim theo tag | Bỏ fallback khi commit lockfile (đầu R2); thêm `pnpm audit`/OSV; ghim SHA | OPS | SR-SUP-01…04; TM-48 |
| SEC-R1-25 | Info | – | erd `guest_document.visa_alert_on` (M9, E1) | SEC **chấp nhận có điều kiện** (xem mục 5) | Ghi chú cột theo SR-RET-06 | ARC | SR-RET-06 |

Kết quả soát theo 2 câu hỏi được giao:
- **Trường C3 trả ra endpoint không có nhật ký?** Các schema C3 (`GuestDocumentSensitive`, `DoorCredential`, `PortalData`, ảnh) đều đi qua endpoint ghi `c3_access_log` – đạt. Ngoại lệ: `GuestStay.doorCode` (khách xem mã cửa) chưa ghi nhật ký (SEC-R1-15). Phản hồi sau POST/PATCH giấy tờ trả `Registration` ở dạng che – đạt. `Party.childDisplayName` là tên trẻ em đã che, chỉ FD+ – chấp nhận.
- **`x-visible-to` khớp rbac?** Phần lớn khớp (giá vốn chỉ OWN/MGR, `costVnd` sự cố, `payerName`, `otaRef`, `internalNote`, `relationship`, `idDocLast4`, `nightlyRates` không cho CTV, minibar không thành tiền cho HK). Lệch: SEC-R1-09, SEC-R1-10.

Điểm làm tốt nên giữ: contract có `x-roles`/`x-scope`/`x-visible-to`/`x-classification` ngay từ bản nháp; endpoint C3 tách riêng có `no-store` và lý do bắt buộc; ERD có RLS `FORCE`, REVOKE bảng append-only, `outbox` không chứa C3, `message_log` không lưu nội dung; compose dev chỉ bind 127.0.0.1, image chạy user `node`, gitleaks quét toàn lịch sử.

## 5. Quan điểm SEC về mâu thuẫn ARC (M1, M3, M4, M8, M9)
Chi tiết: `threat-model.md` mục 10.
- **M3 (xóa ảnh "24 giờ" vs "ngay")**: không mâu thuẫn nếu viết rõ – ảnh của người không đồng ý **xóa ngay khi khai báo `confirmed`** (outbox, ≤ 15 phút); 24 giờ là **hạn trên** để job J16 bắt ca sót; chưa `confirmed` thì tối đa 7 ngày sau trả phòng; trong backup hết sau ≤ 35 ngày. Đề nghị DOM sửa BR-609, PO sửa US-045 AC2 theo câu này (SR-RET-02).
- **M4 (link khách hết hạn / ân hạn 24 giờ)**: giữ ân hạn 24 giờ (cần cho BR-427) nhưng sau `checked_out` chỉ còn xem bill + thanh toán phát sinh, **bắt buộc mức 2**; tắt Wi-Fi, mã cửa, yêu cầu, upload (SR-GST-11). PO sửa US-106 AC2, BA sửa rbac 8.6.
- **M8 (C3 chỉ trên máy quầy)**: cơ chế **thiết bị được cấp** – OWN cấp trên chính máy, cookie thiết bị riêng, bảng `trusted_device`, mọi endpoint C3 kiểm, PWA không bao giờ được cấp (SR-DEV). Kèm checklist cứng hóa máy quầy (tắt lịch sử/đồng bộ clipboard, mã hóa ổ đĩa…).
- **M9 (`visa_alert_on` dạng rõ)**: chấp nhận ở mức C2 với điều kiện đặt NULL khi đơn kết thúc, không có trong DTO/audit/SSE, mục "Cần chú ý" chỉ chứa mã đơn (SR-RET-06).
- **M1 (hạn khai báo khách NN)**: thuộc luật sư (ESC-001); khuyến nghị giữ mặc định `earlier_of` vì an toàn hơn.

## 6. Đề xuất dòng decision-log (ORC ghi khi commit – SEC không sửa decision-log)
| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | App khách mức 2 = OTP email của đơn hoặc mã xác minh lễ tân cấp; 4 số cuối SĐT và mã đặt phòng không dùng làm yếu tố xác minh; đếm sai theo token | SEC | TM-21 (mã đơn tăng dần, nằm trong tin chứa link) |
| 2026-10-15 | 1 | C3 chỉ đọc/ghi trên thiết bị được OWN cấp (bảng `trusted_device`, cookie thiết bị); PWA không bao giờ được cấp | SEC | M8, TM-46 |
| 2026-10-15 | 1 | 2FA TOTP bắt buộc cho owner, manager trước khi đưa dữ liệu thật (R3) | SEC | TM-01 |
| 2026-10-15 | 1 | Thu hồi mọi phiên khi đổi vai/khóa/đặt lại mật khẩu; phiên admin 30 phút không hoạt động – tối đa 12 giờ; PWA 72 giờ – tối đa 30 ngày | SEC | TM-02, TM-03 |
| 2026-10-15 | 1 | Backup và snapshot ≤ 35 ngày là ràng buộc cứng; "xóa bằng hủy khóa" chỉ có hiệu lực trong backup sau ≤ 35 ngày; thêm `purge_journal` áp lại sau khôi phục | SEC | TM-15, TM-56 |
| 2026-10-15 | 1 | Ảnh của người không đồng ý: xóa ngay khi khai báo `confirmed`, 24 giờ là hạn trên (M3); link khách ân hạn 24 giờ với phạm vi thu hẹp (M4); `visa_alert_on` C2 có điều kiện (M9) | SEC | Mâu thuẫn ARC M3, M4, M9 |
| 2026-10-15 | 1 | Mã cửa ≥ 6 chữ số ngẫu nhiên; biến thể sinh nhật cần ≥ 3 số ngẫu nhiên hoặc khóa có giới hạn thử sai (chờ ESC-011) | SEC | TM-38 |
| 2026-10-15 | 1 | admin-web, PWA nhân viên, guest-web ở 3 tên miền con riêng, cookie `__Host-`, không CORS | SEC | TM-05, TM-27 |
| 2026-10-15 | 1 | Payload channel manager lọc theo danh sách trường cho phép trước khi lưu; không lưu payload thô có trường thẻ | SEC | TM-30, R-PAY-06 |

## 7. ESC mới (đề xuất – ORC/PO tạo file, SEC không sửa `02-escalations/`)

**Dự thảo ESC – Kiểm thử bảo mật độc lập trước khi đưa dữ liệu khách thật vào + chấp nhận rủi ro còn lại**
- Người tạo: SEC | Round: 1 | Mức khẩn: Bình thường (gom cuối round; cần quyết trước Round 3)
- Bối cảnh: App sẽ giữ ảnh hộ chiếu, CCCD và mã cửa của khách. Đội đã thiết kế bảo vệ nhiều lớp, nhưng đội tự kiểm tra sản phẩm của chính mình thì dễ bỏ sót. Thông lệ là thuê một bên độc lập thử tấn công trước khi chạy thật. Ngoài ra còn 2 rủi ro không xử lý hết bằng phần mềm: (1) ai chiếm được máy chủ thì đọc được giấy tờ đang lưu (vì ngân sách không có thiết bị giữ khóa riêng); (2) nhân viên chụp/gửi ảnh giấy tờ qua điện thoại cá nhân, nhóm chat.
- Câu hỏi cần quyết định: Có thuê kiểm thử bảo mật độc lập trước khi vận hành thật không, và anh/chị có chấp nhận 2 rủi ro còn lại với các biện pháp đã nêu không?
- Phương án:
  - A: Thuê đơn vị độc lập kiểm thử web + API + cấu hình máy chủ (phạm vi nhỏ, vài ngày công) ở cuối Round 3 – Ưu: phát hiện lỗi đội bỏ sót, có biên bản để chứng minh đã cẩn trọng – Nhược: tốn chi phí, cần 1–2 tuần lịch – Chi phí: **[Chưa xác minh]** – SEC/OPS lấy 2–3 báo giá ở Round 3.
  - B: Đội tự kiểm (quét tự động miễn phí như OWASP ZAP, trivy, checklist SEC) – Ưu: không tốn tiền – Nhược: độ tin cậy thấp hơn, không có bên thứ ba xác nhận – Chi phí: 0 đ, ~2–3 ngày công của đội.
  - C: Không kiểm thêm – Ưu: nhanh – Nhược: rủi ro lộ dữ liệu khách cao nhất – không khuyến nghị.
  - Kèm theo (mọi phương án): INV ban hành quy định nội bộ "không nhận/gửi giấy tờ khách qua Zalo, nhóm chat, điện thoại cá nhân"; INV giữ 2 bản sao khóa chủ và khóa giải mã sao lưu ngoại tuyến (OPS hướng dẫn).
- Đội đề xuất: **B ở Round 3 + A trước khi vận hành thật** nếu báo giá phù hợp; chấp nhận 2 rủi ro còn lại với điều kiện giữ ảnh giấy tờ ngắn hạn và ban hành quy định nội bộ.
- Nếu chưa quyết thì: đội làm B ở Round 3; SEC ghi rõ trong báo cáo rủi ro còn lại rằng chưa có kiểm thử độc lập.
- Hạn cần trả lời: trước khi bắt đầu Round 3.

Không có ESC "Gấp". Các quyết định khác ở mục 6 thuộc quyền kỹ thuật của SEC.

## 8. Rủi ro / vướng mắc
- **Ảnh hưởng chéo cần thông báo**: SEC-R1-01/02/03/05/08 là P1 – ARC và INT cần sửa OpenAPI/ERD/README ở bước 4 trước khi R2 code phần liên quan. UXD (đang chạy song song) cần thêm màn hình nhập OTP / mã xác minh lễ tân cho app khách và luồng "Cấp quyền thiết bị này" ở web quản trị – ORC chuyển thông tin này cho UXD, SEC không sửa file UXD.
- Xác minh mức 2 bằng OTP email phụ thuộc email của khách OTA (thường là email ủy quyền của OTA, vẫn chuyển tiếp tới khách) – nếu không nhận được, khách dùng mã lễ tân. Nếu INV muốn OTP qua Zalo thì có chi phí ZNS (gộp ESC-010).
- TM-13 (chiếm VPS) chỉ giảm được bằng cứng hóa + giữ C3 ngắn – cần INV chấp nhận (dự thảo ESC mục 7).
- Pháp lý vẫn chờ ESC-001 (Luật 91/2025), ESC-002 (dữ liệu ra nước ngoài qua channel manager, email).

## 9. Việc chưa xong
- Bước 3: review bắt buộc ARC (`SEC-on-ARC.md` – dùng mục 4 và 5 làm nguồn thẻ), INT (`SEC-on-INT.md` – SEC-R1-07, -08, SR-LOCK-02), OPS (`SEC-on-OPS.md` – SEC-R1-04 phần backup, -20, -23, -24); khuyến nghị review RBAC của BA (M4, M8, SEC-R1-09, -10).
- Bước 5: chuyển 25 phát hiện vào `qa/bug-list.md` cùng QA; soát lại OpenAPI/ERD sau khi ARC sửa.
- Round 2: review code theo OWASP Top 10 / MASVS (PWA), kiểm các SR mức R2.
- Round 3: kiểm tra bảo mật tổng, báo cáo rủi ro còn lại, bản nháp hồ sơ đánh giá tác động.
