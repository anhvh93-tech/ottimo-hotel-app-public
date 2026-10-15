# Review SEC → ARC – Round 1 · Bước 3

- Người review: SEC | Tác giả: ARC | Ngày: 15/10/2026
- Phạm vi: `product/docs/architecture.md`, `product/docs/adr/*.md`, `product/docs/erd.md`, `product/docs/api/openapi.yaml`
- Căn cứ: `product/docs/security/threat-model.md` (TM-xx), `product/docs/security/security-requirements.md` (SR-xxx), `rounds/round-01/outputs/SEC/report.md` mục 4–5 (SEC-R1-01…25). Mã SEC-R1-26 trở đi là phát hiện mới ở bước review này.
- Quy ước mức: lỗ hổng cho phép lấy mã cửa / dữ liệu C3 mà không cần quyền = **Blocker**; thiếu kiểm soát bắt buộc trước khi code R2 phần liên quan = **Major**.

| Mức | Số thẻ |
|---|---|
| Blocker | 1 |
| Major | 12 |
| Minor | 11 |
| Suggestion | 2 |
| **Tổng** | **26** |

---

### FB-R1-SEC-ARC-01
- Mức độ: Blocker
- Vị trí: `openapi.yaml` `/v1/guest/sessions/verify` (dòng ~3564–3590, trường `phoneLast4`, `bookingCode`); `adr/ADR-006-guest-app-link.md` Quyết định 3
- Vấn đề: Khách lên mức 2 (xem bill, hợp đồng, **mã cửa**) chỉ bằng `phoneLast4` **hoặc** `bookingCode`. Mã đặt phòng là mã tăng dần (`OTM-00171`) và nằm ngay trong tin nhắn chứa link (mẫu `renderMessage`). Ai có link bị chuyển tiếp (nhóm chat, email chuyển tiếp) là có luôn yếu tố "xác minh" → lên mức 2 và lấy được mã cửa. 4 số cuối SĐT chỉ có 10⁴ khả năng, thường in trên phiếu/OTA. [SEC-R1-01; SR-GST-07; TM-21]
- Vì sao quan trọng: Lộ mã cửa = người lạ vào phòng khi khách đang ngủ – sự cố an toàn thân thể và thương hiệu nặng nhất có thể xảy ra; đồng thời lộ bill (C2).
- Đề xuất sửa: Bỏ 2 trường cũ. Mức 2 = (a) OTP email 6 số, CSPRNG, 10 phút, gửi tới email trên đơn, hoặc (b) mã xác minh do lễ tân cấp (FD+) tại quầy/qua điện thoại. Thêm `POST /v1/guest/sessions/otp` (gửi OTP, mức 1, giới hạn SR-RL-04) và `POST /v1/properties/{propertyId}/reservations/{reservationId}/guest-verification-code` (x-roles FD+, ghi audit). Sửa câu chữ ADR-006 mục 3 theo SR-GST-07.
- Trạng thái: Open

### FB-R1-SEC-ARC-02
- Mức độ: Major
- Vị trí: `erd.md` mục 4.5 `guest_session.failed_verify_count`
- Vấn đề: Bộ đếm xác minh sai nằm trên **phiên**. Mở phiên mới từ cùng link (`POST /v1/guest/sessions`) là bộ đếm về 0 → dò mã không giới hạn. [SEC-R1-02; SR-GST-08; TM-21]
- Vì sao quan trọng: Vô hiệu hóa toàn bộ giới hạn thử sai của mức 2, kể cả khi đã chuyển sang OTP.
- Đề xuất sửa: Chuyển `failed_verify_count`, `verify_locked_until` sang `guest_access_token`; thêm `otp_sent_count`, `otp_window_started_at` (3 OTP/giờ/token). 5 lần sai/24 giờ → khóa xác minh của token, khách phải nhờ lễ tân cấp mã.
- Trạng thái: Open

### FB-R1-SEC-ARC-03
- Mức độ: Major
- Vị trí: `adr/ADR-006-guest-app-link.md` Quyết định 4 ("QR trong phòng … + ô nhập mã đặt phòng")
- Vấn đề: Trang công khai của căn có ô nhập mã đặt phòng nhưng ADR không nói nhập xong thì được gì; OpenAPI không có endpoint tương ứng. Nếu nhập mã đặt phòng (tăng dần, đoán được) mà mở được phiên khách (dù mức 1) thì ai đứng trong phòng/nhìn thấy QR đều liệt kê được đơn của khách khác và tải giấy tờ giả vào đơn. [SEC-R1-26 mới; TM-24, TM-21, TM-25]
- Vì sao quan trọng: Đây là đường vòng quanh token 128 bit của ADR-006 – mất toàn bộ giá trị của link riêng theo đơn.
- Đề xuất sửa: Ghi rõ: ô mã đặt phòng **không** cấp phiên; chỉ gửi lại link tới email/SĐT đã có trên đơn (trả cùng một thông báo "Nếu mã đúng, link đã được gửi" để không lộ đơn tồn tại), giới hạn 5 lần/giờ/IP và 3 lần/ngày/đơn. Thêm endpoint `POST /v1/public/units/{unitSlug}/resend-link` với mô tả đó, hoặc bỏ ô nhập khỏi ADR.
- Trạng thái: Open

### FB-R1-SEC-ARC-04
- Mức độ: Major
- Vị trí: `openapi.yaml` các operation có `x-classification: C3`; `erd.md` `user_session.device_trusted`; `architecture.md` mục 10
- Vấn đề: Quy tắc "C3 chỉ trên máy quầy được cấp" (rbac 8.7, M8) chưa có cơ chế: chỉ là cờ trên phiên, không gắn thiết bị; chỉ `portal-data` nhắc tới trong mô tả; không có mã lỗi, không có endpoint cấp/thu hồi. [SEC-R1-03; SR-DEV-01…06; TM-46]
- Vì sao quan trọng: Không có cơ chế thì nhân viên đăng nhập trên điện thoại cá nhân vẫn mở được ảnh hộ chiếu/CCCD – đúng loại rò rỉ (chụp màn hình, nhóm chat) mà BL lo ngại.
- Đề xuất sửa: Bảng `trusted_device` (SR-DEV-01) + cookie `__Host-ottimo_did`; extension `x-requires-trusted-device: true` cho documents POST/PATCH, `…/sensitive`, `…/images/{id}`, `portal-data`, `door-credential` GET/PUT, xóa ảnh; response `403 DEVICE_NOT_TRUSTED`; endpoint cấp/thu hồi/liệt kê thiết bị (x-roles: owner). Thêm `Me.properties[].deviceTrusted`.
- Trạng thái: Open

### FB-R1-SEC-ARC-05
- Mức độ: Major
- Vị trí: `adr/ADR-013-sensitive-file-storage.md` Quyết định 3; `adr/ADR-010-hosting-and-cost.md` Quyết định 3 ("giữ 7 ngày + 4 tuần + 3 tháng")
- Vấn đề: ADR-013 khẳng định hủy DEK làm bản sao lưu cũ "không giải mã được" – **sai**: `data_key.wrapped_key` nằm trong chính DB được sao lưu và KEK không đổi, nên khôi phục backup là khôi phục luôn DEK đã "hủy". ADR-010 vẫn giữ 3 tháng (OPS đã đề xuất ≤ 35 ngày, ADR chưa sửa). [SEC-R1-04; SR-KEY-09, SR-BAK-03, SR-BAK-06, SR-BAK-07; TM-15, TM-56]
- Vì sao quan trọng: Đây là cam kết "xóa cả trong backup" với khách và cơ quan quản lý; viết sai thì thông báo xử lý dữ liệu sai sự thật, và dữ liệu C3 tồn tại 3 tháng thay vì ≤ 35 ngày.
- Đề xuất sửa: Sửa ADR-013 mục 3 theo câu SR-KEY-09 (dữ liệu chỉ hết khôi phục được khi backup chứa DEK hết hạn, ≤ 35 ngày). Sửa ADR-010 vòng đời cứng ≤ 35 ngày, snapshot nhà cung cấp tắt hoặc ≤ 7 ngày. Thêm `purge_journal` (xem ARC-17). Tùy chọn tăng cường: SR-KEY-06 (xoay KEK theo tháng).
- Trạng thái: Open

### FB-R1-SEC-ARC-06
- Mức độ: Major
- Vị trí: `openapi.yaml` `PUT /v1/users/{userId}/roles` ("có hiệu lực ở lần đăng nhập kế tiếp"), `PATCH /v1/users/{userId}`
- Vấn đề: Đổi vai, khóa tài khoản, đặt lại mật khẩu không thu hồi phiên đang chạy → nhân viên vừa nghỉ việc/bị hạ quyền vẫn dùng phiên cũ tới khi hết hạn. [SEC-R1-05; SR-SES-06, SR-AZ-08; TM-03]
- Vì sao quan trọng: Rủi ro nội gián phổ biến nhất ở khách sạn nhỏ (lễ tân nghỉ việc vẫn xem được đơn, mã cửa).
- Đề xuất sửa: Mô tả: "đổi vai/khóa/đặt lại mật khẩu → thu hồi mọi phiên của người đó ngay"; quyền đọc theo `user_property_role` mỗi request hoặc cache ≤ 60 giây có `roles_version` (SR-AZ-08).
- Trạng thái: Open

### FB-R1-SEC-ARC-07
- Mức độ: Major
- Vị trí: `openapi.yaml` `messages/render` (x-roles có `collaborator`), mẫu `checkin_link`
- Vấn đề: Render mẫu `checkin_link` trả link app khách → CTV lấy được link dù rbac A22 cấm CTV. Không rõ render dùng link đang hiệu lực hay cấp token mới (thu hồi link cũ của khách). [SEC-R1-06; SR-MSG-03; TM-21, TM-60]
- Vì sao quan trọng: Lách phân quyền qua đường phụ; nếu render cấp token mới thì còn làm hỏng link khách đang dùng.
- Đề xuất sửa: Mẫu có biến link đi qua cùng kiểm quyền với A22 (CTV → 403); ghi rõ "render không cấp token mới, chỉ endpoint cấp link mới được thu hồi/cấp lại".
- Trạng thái: Open

### FB-R1-SEC-ARC-08
- Mức độ: Major
- Vị trí: `openapi.yaml` `/v1/webhooks/payments/{provider}`, `/v1/webhooks/channel/{provider}`; security scheme `providerSignature`
- Vấn đề: Đường dẫn thiếu định danh cơ sở (ADR-011 ghi `/{provider}/{propertySlug}`) → không chọn được bí mật theo cơ sở; chỉ có POST (VNPay IPN là GET – theo integrations.md I3); enum `provider` có `mock` mà không ghi "không đăng ký ở production"; chưa có giới hạn body. [SEC-R1-07; SR-PAY-05, SR-RL-08; TM-28, TM-33, TM-34]
- Vì sao quan trọng: Route `mock` lọt lên production = ai cũng gửi "đã thanh toán" được; sai bí mật theo cơ sở = chữ ký vô nghĩa khi có cơ sở 2.
- Đề xuất sửa: Sửa đường dẫn theo ADR-011; thêm GET cho provider yêu cầu; mô tả "mock chỉ bật khi APP_ENV ∈ {dev, staging}, production không đăng ký route"; body ≤ 64 KB; ghi rõ mọi webhook trả mã lỗi chung, không lộ lý do sai chữ ký.
- Trạng thái: Open

### FB-R1-SEC-ARC-09
- Mức độ: Major
- Vị trí: `erd.md` `inbox_message.payload_ref`; `architecture.md` mục 13 (khớp `ChannelBookingEvent.raw`)
- Vấn đề: Payload thô từ channel manager có thể chứa thẻ ảo/thẻ khách (VCC của OTA). ERD lưu tham chiếu tới payload nguyên văn → đưa dữ liệu thẻ vào DB/backup của OTTIMO. [SEC-R1-08; SR-PAY-09, SR-INT-01; TM-30; R-PAY-01/06]
- Vì sao quan trọng: Lưu PAN dù vô tình là mở toàn bộ phạm vi PCI DSS cho hệ thống 1 VPS – không gánh được; vi phạm nguyên tắc "không lưu số thẻ" đã chốt.
- Đề xuất sửa: Ghi rõ trong ERD: `payload_ref` chỉ trỏ tới bản **đã lọc theo danh sách trường cho phép** (allowlist, không phải blocklist); trường nghi thẻ bị loại và tăng bộ đếm cảnh báo; xóa sau 90 ngày. (Phần adapter: thẻ FB-R1-SEC-INT-01.)
- Trạng thái: Open

### FB-R1-SEC-ARC-10
- Mức độ: Major
- Vị trí: `openapi.yaml` `Guest.tags`, `Guest.serviceNotes`, `Guest.warnings`, `GuestSummary.tags`; `Party.members[]` với `own_count_only`
- Vấn đề: Lệch rbac mục 6: CTV = K với D12 nhưng `tags` không có `x-visible-to`; SAL chỉ thấy tag nhưng `serviceNotes` không giới hạn; `warnings` lộ mã khách khác ngoài phạm vi SAL/CTV; `Party` cho SAL/CTV phải chỉ còn số người (D10) nhưng schema chưa thể hiện. [SEC-R1-09; SR-AZ-04; TM-08]
- Vì sao quan trọng: Serializer sinh từ contract sẽ trả thừa trường; ghi chú tự do có thể chứa thông tin sức khỏe (xem FB-R1-SEC-BA-04).
- Đề xuất sửa: `tags`: x-visible-to [owner, manager, front_desk_lead, front_desk, sales_staff]; `serviceNotes`: [owner, manager, front_desk_lead, front_desk, housekeeping]; `warnings`: [owner, manager, front_desk_lead, front_desk]; ghi rõ serializer `own_count_only` bỏ hẳn `members`.
- Trạng thái: Open

### FB-R1-SEC-ARC-11
- Mức độ: Major
- Vị trí: `openapi.yaml` `DoorCredentialInput.code` (`^[0-9]{4,10}$`), `codeHint`
- Vấn đề: Cho phép mã cửa 4 số (10⁴); `codeHint` lộ 2 số cuối → còn 100 khả năng. [SEC-R1-13; SR-LOCK-01; TM-38]
- Vì sao quan trọng: Mã đoán được trong vài phút tại khóa không giới hạn thử sai.
- Đề xuất sửa: `^[0-9]{6,10}$`; mã mặc định do lõi sinh từ CSPRNG; bỏ `codeHint` hoặc chỉ cho FD+ trên thiết bị được cấp.
- Trạng thái: Open

### FB-R1-SEC-ARC-12
- Mức độ: Major
- Vị trí: `erd.md` `c3_access_log`; `openapi.yaml` `C3AccessEntry`, `GuestStay.doorCode`
- Vấn đề: Thiếu `actor_type` (user/guest/system), `session_id`, `trusted_device_id`, `ip_hmac`; ERD chỉ ghi log khi **nhân viên** xem mã cửa – khách xem mã cửa (C3) qua `/v1/guest/stay` không có nhật ký. [SEC-R1-15; SR-C3-08, SR-GST-10; TM-19]
- Vì sao quan trọng: Khi có sự cố vào nhầm phòng, không chứng minh được mã đã lộ qua đâu; nhật ký C3 là bằng chứng tuân thủ.
- Đề xuất sửa: Thêm 4 cột; mỗi lần `GuestStay` trả `doorCode` ghi 1 dòng `actor_type=guest`.
- Trạng thái: Open

### FB-R1-SEC-ARC-13
- Mức độ: Major
- Vị trí: `openapi.yaml` `…/documents` POST, `/v1/guest/online-checkin/documents`, `/attachments`
- Vấn đề: Chưa có giới hạn kích thước/số tệp, kiểm magic bytes, mã hóa lại ảnh (bỏ EXIF/GPS), danh sách MIME; PDF phục vụ `inline` không có CSP sandbox; khách được gửi PDF. [SEC-R1-16; SR-FILE-01…06, SR-C3-03; TM-16]
- Vì sao quan trọng: Endpoint khách là cửa vào không cần đăng nhập (chỉ cần link); PDF/SVG độc chạy trong origin admin khi lễ tân mở.
- Đề xuất sửa: Ghi ràng buộc SR-FILE vào mô tả (≤ 10 MB, ≤ 30 tệp/đơn, JPEG/PNG/HEIC cho khách, mã hóa lại ảnh, bỏ EXIF); header SR-C3-03 cho mọi phản hồi tệp.
- Trạng thái: Open

### FB-R1-SEC-ARC-14
- Mức độ: Minor
- Vị trí: `openapi.yaml` `POST /guests/lookup` (`exists_only_or_own` cho SAL/CTV)
- Vấn đề: Thành "máy dò": CTV tra SĐT bất kỳ để biết người đó có phải khách OTTIMO. [SEC-R1-11; SR-RL-07; TM-07]
- Vì sao quan trọng: Lộ quan hệ khách – khách sạn cho người ngoài biên chế.
- Đề xuất sửa: 30 lần/giờ/người, audit mỗi lần tra; SAL/CTV chỉ nhận "có thể trùng – liên hệ lễ tân", không trả mã khách ngoài phạm vi. Phải xong trước khi code CRM R2.
- Trạng thái: Open

### FB-R1-SEC-ARC-15
- Mức độ: Minor
- Vị trí: `openapi.yaml` `QuoteCalculation.commission`; `Folio.totals`
- Vấn đề: `commission` không giới hạn → FD/FDL thấy hoa hồng người khác; CTV nhận đủ `totals` (`otherVnd`, `focVnd`, `paidViaOtaVnd`) trong khi rbac chỉ cho tổng tiền phòng + cọc. [SEC-R1-10; SR-AZ-04; TM-08]
- Vì sao quan trọng: Dữ liệu kinh doanh nhạy cảm BL 8.2 #27.
- Đề xuất sửa: `commission`: x-visible-to [owner, manager, sales_staff, collaborator] (+ phạm vi M); các trường `totals` ngoài `roomVnd`/`depositHeldVnd` không gồm CTV.
- Trạng thái: Open

### FB-R1-SEC-ARC-16
- Mức độ: Minor
- Vị trí: `openapi.yaml` `AuditEvent.before/after` (`additionalProperties: true`)
- Vấn đề: Không ràng buộc → dễ lọt C2/C3 vào nhật ký mà FD xem được (nhật ký của mình). [SEC-R1-14; SR-AUD-03, SR-C3-02; TM-08]
- Vì sao quan trọng: Nhật ký trở thành kênh rò rỉ vòng qua serializer.
- Đề xuất sửa: Ghi chú schema: serializer audit theo allowlist từng thực thể; cột `_enc` không bao giờ vào `before/after`.
- Trạng thái: Open

### FB-R1-SEC-ARC-17
- Mức độ: Minor
- Vị trí: `erd.md` mục 12 (vòng đời dữ liệu)
- Vấn đề: Thiếu bảng `purge_journal` (chỉ ID + thời điểm xóa) để áp lại việc xóa sau khi khôi phục backup. [SEC-R1-21; SR-RET-03, SR-BAK-06; TM-56]
- Vì sao quan trọng: Khôi phục backup sẽ "hồi sinh" dữ liệu khách đã xóa theo yêu cầu.
- Đề xuất sửa: Thêm `purge_journal(id, subject_type, subject_id, purged_at, reason)`, sao lưu riêng, giữ ≥ 36 ngày; runbook khôi phục chạy áp lại.
- Trạng thái: Open

### FB-R1-SEC-ARC-18
- Mức độ: Minor
- Vị trí: `openapi.yaml` guest-portal
- Vấn đề: Không có endpoint khách **rút đồng ý** (R-CON-03), dù rbac S31 cho GST. [SEC-R1-17; SR-DSR-02]
- Vì sao quan trọng: Quyền chủ thể dữ liệu là nghĩa vụ pháp lý.
- Đề xuất sửa: `POST /v1/guest/consents/{purpose}/withdraw` (mức 2), kích hoạt xóa ảnh theo BR-609.
- Trạng thái: Open

### FB-R1-SEC-ARC-19
- Mức độ: Minor
- Vị trí: `openapi.yaml` `securitySchemes` (`ottimo_sid`, `ottimo_gsid`); `architecture.md` mục 10
- Vấn đề: Tên cookie không có tiền tố `__Host-` trong khi quyết định SEC (report mục 6) là 3 tên miền con riêng + cookie `__Host-`. Không có `__Host-` thì một tên miền con khác (hoặc trang bị XSS ở origin anh em) ghi đè được cookie phiên (session fixation). [SEC-R1-27 mới; TM-05, TM-27]
- Vì sao quan trọng: Chặn cả nhóm tấn công cookie tossing với chi phí bằng 0.
- Đề xuất sửa: Đổi thành `__Host-ottimo_sid`, `__Host-ottimo_gsid` (Secure, Path=/, không Domain); ở dev HTTP dùng tên không tiền tố qua cấu hình.
- Trạng thái: Open

### FB-R1-SEC-ARC-20
- Mức độ: Minor
- Vị trí: `adr/ADR-006-guest-app-link.md` Quyết định 2 (ân hạn 24 giờ sau trả phòng)
- Vấn đề: Ân hạn 24 giờ giữ nguyên mọi chức năng mức 1 (Wi-Fi, gửi yêu cầu, tải giấy tờ) sau khi khách đã đi. [M4; SR-GST-11; TM-26]
- Vì sao quan trọng: Link bị chuyển tiếp sau trả phòng vẫn tác động được lên đơn.
- Đề xuất sửa: Ghi rõ: sau `checked_out` chỉ còn xem bill + thanh toán phát sinh, bắt buộc mức 2; Wi-Fi, mã cửa, yêu cầu, upload, đồng ý mới → 403.
- Trạng thái: Open

### FB-R1-SEC-ARC-21
- Mức độ: Minor
- Vị trí: `openapi.yaml` `GuestDocumentInput` (trừ `docNumber`), `PartyMemberCreate.childName/childBirthYear`
- Vấn đề: Thuộc tính C3 đầu vào thiếu `writeOnly: true`. [SEC-R1-12; SR-INP-03]
- Vì sao quan trọng: Generator client/serializer có thể vô tình echo lại trong response.
- Đề xuất sửa: Thêm `writeOnly: true`.
- Trạng thái: Open

### FB-R1-SEC-ARC-22
- Mức độ: Minor
- Vị trí: `openapi.yaml` auth; `erd.md` `app_user`
- Vấn đề: Thiếu `POST /v1/me/password`, đặt PIN duyệt (S01 có); thiếu cột `must_change_password`, `password_changed_at`, (R3) `mfa_secret_enc`, `mfa_enabled`, mã khôi phục. [SEC-R1-18; SR-AUTH-05, -06, -09]
- Vì sao quan trọng: Tài khoản tạo bởi OWN dùng mật khẩu tạm mãi mãi; không có chỗ cho 2FA R3.
- Đề xuất sửa: Thêm endpoint + cột.
- Trạng thái: Open

### FB-R1-SEC-ARC-23
- Mức độ: Minor
- Vị trí: `erd.md` `reservation_guest.child_*_enc`; `guest_document.visa_kind`
- Vấn đề: `child_*_enc` không có `data_key_id` (không biết DEK nào, không hủy riêng được); `visa_kind` ghi "C3 → lưu `_enc`" nhưng tên cột không có `_enc` (SR-C3-01 dựa vào hậu tố). [SEC-R1-19; SR-KEY-01, SR-C3-01]
- Vì sao quan trọng: Lint/test tự động dựa vào hậu tố sẽ bỏ sót cột C3.
- Đề xuất sửa: Thêm `data_key_id`; đổi tên `visa_kind_enc` (hoặc hạ C2 có ghi lý do).
- Trạng thái: Open

### FB-R1-SEC-ARC-24
- Mức độ: Minor
- Vị trí: `erd.md` `audit_event.ip_hash`, `user_session.ip_hash`; `door-credential` PUT, `DELETE …/registrations/{id}/images`
- Vấn đề: (1) SHA-256 trần của IPv4 dò ngược được trong vài phút. (2) Thao tác C3 ghi/xóa thiếu `Idempotency-Key`/`If-Match`. [SEC-R1-20, SEC-R1-22; SR-KEY-08]
- Vì sao quan trọng: (1) "băm" không còn là ẩn danh; (2) gửi lại request có thể ghi đè mã cửa mới bằng mã cũ.
- Đề xuất sửa: Đổi tên cột `ip_hmac`, HMAC với `LOG_IP_HMAC_KEY`; thêm `Idempotency-Key` + `If-Match` (ETag) cho 2 operation.
- Trạng thái: Open

### FB-R1-SEC-ARC-25
- Mức độ: Suggestion
- Vị trí: `adr/ADR-013-sensitive-file-storage.md` Quyết định 2; `architecture.md` mục 10 (bí mật qua biến môi trường)
- Vấn đề: KEK nạp qua biến môi trường → hiện trong `docker inspect`, `/proc/<pid>/environ`, có thể lọt vào báo cáo lỗi. [SR-KEY-03; TM-13]
- Vì sao quan trọng: Giảm số chỗ KEK có thể lộ khi VPS bị xâm nhập một phần.
- Đề xuất sửa: Cho phép `DATA_KEK_FILE`/`ID_HASH_KEY_FILE` (Docker Compose secrets, mount file quyền 0400), đọc một lần khi khởi động; giữ biến môi trường làm phương án dev.
- Trạng thái: Open

### FB-R1-SEC-ARC-26
- Mức độ: Suggestion
- Vị trí: `erd.md` `guest_document.visa_alert_on` (M9)
- Vấn đề: SEC chấp nhận có điều kiện ở mức C2 nhưng ERD chưa ghi điều kiện. [SEC-R1-25; SR-RET-06]
- Vì sao quan trọng: Không ghi thì BE sẽ đưa vào DTO/SSE.
- Đề xuất sửa: Ghi chú cột: đặt NULL khi đơn kết thúc; không có trong DTO/audit/SSE; "Cần chú ý" chỉ chứa mã đơn.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Contract có `x-roles`/`x-scope`/`x-visible-to`/`x-classification` ngay từ bản nháp – cho phép sinh test phân quyền tự động (SR-AZ-09); phần lớn trường nhạy cảm (giá vốn, `payerName`, `otaRef`, `internalNote`, `idDocLast4`) đã khớp rbac.
2. Endpoint C3 tách riêng, có `no-store` và lý do bắt buộc; phản hồi sau POST/PATCH giấy tờ trả dạng che; token khách ≥ 128 bit chỉ lưu băm; webhook kênh kéo lại dữ liệu qua API.
3. ERD có RLS `FORCE`, REVOKE trên bảng append-only, `outbox` không chứa C3, `message_log` không lưu nội dung tin.
