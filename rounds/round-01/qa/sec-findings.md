# Phát hiện bảo mật – SEC · Round 1 · Bước 5 (Kiểm thử)

- Người soát: SEC | Ngày: 16/10/2026 | QA gộp vào `qa/bug-list.md`
- Phạm vi: `product/docs/api/openapi.yaml` (0.2.0-draft), `openapi.test.yaml`, `erd.md` v0.2, `architecture.md` v0.2, ADR-006/007/010/011/013, `product/infra/**`, `.github/workflows/ci.yml`, `product/.env.example`, `product/services/api/src/**`
- Căn cứ: `product/docs/security/security-requirements.md` v0.2; SEC-R1-01…33; thẻ Blocker/Major trong `reviews/SEC-on-{ARC,INT,OPS,BA}.md`
- Trạng thái: Hoàn tất soát 16/10 – 25/25 thẻ Blocker/Major cũ Đạt; 33 mục SEC-R1 (32 Đạt, 1 Đạt có điều kiện); 9 lỗi mới (P0: 1, P1: 1, P2: 1, P3: 6)

## Phần A – Đối chiếu SEC-R1-01…33 (soát lại sau bước 4)

Đạt = đã sửa đúng ý SEC trong sản phẩm (không chỉ trong file phản hồi). Dòng = số dòng `openapi.yaml` tại thời điểm soát (16/10).

| ID | Mức cũ | Kết quả | Bằng chứng |
|---|---|:-:|---|
| SEC-R1-01 | High | Đạt | `verifyGuestSession` (d.4449) chỉ nhận `method: email_otp\|desk_code` + `code` 6 số `writeOnly`; `sendGuestOtp` (d.4418), `issueGuestVerificationCode` (d.2155); ADR-006 điểm 3 |
| SEC-R1-02 | High | Đạt | erd `guest_access_token` (d.693): `failed_verify_count`, `verify_locked_until`, `otp_sent_count`…; "mở phiên mới không reset"; lỗi `GUEST_VERIFICATION_LOCKED` |
| SEC-R1-03 | High | Đạt | 8/8 operation C3 nhân viên có `x-requires-trusted-device: true` (getDoorCredential, setDoorCredential, addGuestDocument, updateGuestDocument, getGuestDocumentSensitive, getDocumentImage, purgeRegistrationImages, getPortalData); erd `trusted_device` (d.472); `403 DEVICE_NOT_TRUSTED`; `trustCurrentDevice` (d.704) chỉ owner, chỉ origin admin-web. **Ngoại lệ mới**: BUG-R1-SEC-01 |
| SEC-R1-04 | High | Đạt | ADR-013 điểm 3 đúng câu SR-KEY-09; ADR-010 điểm 3 "vòng đời cứng ≤ 35 ngày", snapshot tắt/≤ 7 ngày; hosting-plan d.117–119 |
| SEC-R1-05 | High | Đạt | `setUserRoles` (d.649) "đặt `revoked_at` cho mọi `user_session`… trong cùng giao dịch"; `updateUser` (d.616) khóa/đặt lại mật khẩu thu hồi phiên; info mục Bảo mật |
| SEC-R1-06 | Medium | Đạt | `renderMessage` (d.4346): mẫu có link → kiểm A22, CTV 403; không cấp token mới |
| SEC-R1-07 | Medium | Đạt | `/v1/webhooks/{provider}/{propertySlug}` (d.4800), GET + POST, `mock` chỉ ngoài production, `off` không đăng ký, body ≤ 64 KB, lỗi không lộ lý do |
| SEC-R1-08 | High | Đạt | erd `inbox_message`: `filtered_payload` allowlist, `card_fields_dropped`, không cột body thô, xóa 90 ngày; INT README "không có trường `raw`" |
| SEC-R1-09 | Medium | Đạt | `Guest.tags` [OWN,MGR,FDL,FD,SAL], `serviceNotes` [+HK], `warnings` [FD+] (D29), `freeNote` [FD+] (D12c); `Party.members` FD+ (D10) |
| SEC-R1-10 | Low | Đạt | `QuoteCalculation.commission` [OWN,MGR,SAL,CTV]; `Folio.totals` ngoài `roomVnd`/`depositHeldVnd` không có CTV |
| SEC-R1-11 | Medium | Đạt | `lookupGuestByContact` (d.4189): 30/giờ SAL/CTV, audit mỗi lần, ngoài phạm vi chỉ `possible_duplicate` |
| SEC-R1-12 | Low | Đạt | `GuestDocumentInput` 12 trường C3 đều `writeOnly`; `PartyMemberCreate.childName/childBirthYear` `writeOnly` |
| SEC-R1-13 | Medium | Đạt | `DoorCredentialInput.code` `^[0-9]{6,10}$`, mặc định CSPRNG, ddmm + ≥ 3 số; bỏ `codeHint` |
| SEC-R1-14 | Medium | Đạt | `AuditEvent.before/after` (d.6150) ghi serializer allowlist, không `_enc`/C3 |
| SEC-R1-15 | Medium | Đạt | erd `c3_access_log` (d.507) có `actor_type`, `session_id`, `trusted_device_id`, `ip_hmac`; khách xem mã cửa ghi `actor_type=guest`; `getGuestStay` (d.4486) nêu ghi log + `no-store` |
| SEC-R1-16 | Medium | Đạt | info "Tệp tải lên" (d.64): JPEG/PNG/WebP magic bytes, không PDF/HEIC, ≤ 10 MB, ≤ 40 MP, mã hóa lại, bỏ EXIF, header CSP sandbox/nosniff/no-store |
| SEC-R1-17 | Medium | Đạt | `withdrawGuestConsent` (d.4723) mức 2, P02b → xóa ảnh + `purge_journal` |
| SEC-R1-18 | Low | Đạt | `changeMyPassword` (d.299), `setMyApprovalPin`, `loginMfa`, `stepUp`; erd `must_change_password`, `mfa_*` |
| SEC-R1-19 | Low | Đạt | erd `child_data_key_id` (d.654), `visa_kind_enc` (d.811) |
| SEC-R1-20 | Low | Đạt | erd không còn `ip_hash`; `ip_hmac` + `LOG_IP_HMAC_KEY` (.env.example, config.ts bắt buộc ≥ 32 ký tự ở staging/production) |
| SEC-R1-21 | Low | Đạt | erd `purge_journal` (d.825), sao lưu riêng ≥ 36 ngày, runbook áp lại |
| SEC-R1-22 | Low | Đạt | `setDoorCredential`, `purgeRegistrationImages` có `IdempotencyKey` + `IfMatch` |
| SEC-R1-23 | Low | Đạt | `product/.dockerignore` loại `**/.data`, `*.pem`, `*.key`, `*.age`, `*.dump`… |
| SEC-R1-24 | Low | Đạt có điều kiện | ci.yml: action ghim SHA, image ghim digest, `pnpm audit --audit-level=high`; **còn** nhánh `--no-frozen-lockfile` khi chưa commit lockfile – chấp nhận tới đầu R2 (đã ghi trong ci.yml) |
| SEC-R1-25 | Info | Đạt | erd `visa_alert_on` (d.815) ghi đủ điều kiện M9 |
| SEC-R1-26 | Major | Đạt | ADR-006 điểm 4; `resendGuestLinkFromUnit` (d.4775) không cấp phiên, phản hồi giống nhau, 5/giờ/IP + 3/ngày/đơn. Lưu ý mới: BUG-R1-SEC-03 (P3) |
| SEC-R1-27 | Minor | Đạt | securitySchemes `__Host-ottimo_sid`/`__Host-ottimo_gsid` (d.4851); dev bỏ tiền tố qua `COOKIE_SECURE_PREFIX` |
| SEC-R1-28 | Major | Đạt | INT README: `parseWebhookSignal` chỉ lấy `externalId`, worker kéo lại qua API; webhookPost mô tả "dữ liệu webhook không được tin" |
| SEC-R1-29 | Major | Đạt | INT README: `verifyCallback` trả union `{ok:true,event}\|{ok:false,reason}`, `timingSafeEqual`, khớp merchant/số tiền/`pending`, chống phát lại |
| SEC-R1-30 | Minor | Đạt | INT README "không chỉ bằng API key tĩnh": ưu tiên HMAC body; chỉ có API key → bắt buộc IP allowlist + kéo lại giao dịch; `.env.example` `BANKFEED_SOURCE_IP_ALLOWLIST` |
| SEC-R1-31 | Major | Đạt | `infra/postgres/init/02-roles.sh`: `ottimo_app` NOSUPERUSER NOBYPASSRLS, không sở hữu bảng; compose/.env/CI dùng `ottimo_app`; test `db-role.test.ts` kiểm `rolsuper=false, rolbypassrls=false`. Lệch tên vai với erd 2.1: BUG-R1-SEC-06 (P3) |
| SEC-R1-32 | Major | Đạt | rbac A108 chỉ OWN, xác nhận lại mật khẩu, audit, thông báo; A101 loại trừ thông tin nhận tiền; R2 chưa có API sửa tài khoản nhận (lấy từ `.env`) |
| SEC-R1-33 | Major | Đạt | rbac D12 tách a/b/c; D12b (sức khỏe) C3, HK chỉ nhãn chung. OpenAPI chưa có trường D12b – khi thêm phải theo ô rbac (ghi chú, không phải lỗi) |

**Tổng SEC-R1-01…33: 32 Đạt, 1 Đạt có điều kiện (SEC-R1-24), 0 Chưa.**

### A2. Thẻ Blocker/Major của SEC (bước 3)

| Thẻ | Mức | Kết quả | Bằng chứng |
|---|---|:-:|---|
| FB-R1-SEC-ARC-01 | Blocker | Đạt | = SEC-R1-01 |
| FB-R1-SEC-ARC-02 | Major | Đạt | = SEC-R1-02 |
| FB-R1-SEC-ARC-03 | Major | Đạt | = SEC-R1-26 |
| FB-R1-SEC-ARC-04 | Major | Đạt | = SEC-R1-03 (+ `x-step-up` cho sensitive/ảnh/portal-data, `Me.properties[].deviceTrusted`) |
| FB-R1-SEC-ARC-05 | Major | Đạt | = SEC-R1-04 |
| FB-R1-SEC-ARC-06 | Major | Đạt | = SEC-R1-05 |
| FB-R1-SEC-ARC-07 | Major | Đạt | = SEC-R1-06 (phần link). Phần biến `door_code` của cùng endpoint: BUG-R1-SEC-01 |
| FB-R1-SEC-ARC-08 | Major | Đạt | = SEC-R1-07 |
| FB-R1-SEC-ARC-09 | Major | Đạt | = SEC-R1-08 |
| FB-R1-SEC-ARC-10 | Major | Đạt | = SEC-R1-09 |
| FB-R1-SEC-ARC-11 | Major | Đạt | = SEC-R1-13 |
| FB-R1-SEC-ARC-12 | Major | Đạt | = SEC-R1-15 |
| FB-R1-SEC-ARC-13 | Major | Đạt | = SEC-R1-16 |
| FB-R1-SEC-INT-01 | Blocker | Đạt | = SEC-R1-08 (INT README: không `raw`, allowlist từng trường) |
| FB-R1-SEC-INT-02 | Major | Đạt | = SEC-R1-28 |
| FB-R1-SEC-INT-03 | Major | Đạt | = SEC-R1-29 |
| FB-R1-SEC-INT-04 | Major | Đạt | INT README 1.3 + **đã có mã**: `config.ts` từ chối khởi động khi `APP_ENV=production` và bất kỳ `*_PROVIDER/*_MODE` = mock/sandbox (test `config.test.ts` d.38–44); http.ts log route mẫu, không query |
| FB-R1-SEC-INT-05 | Major | Đạt | INT README d.234 + `DoorCredentialInput`: ddmm + ≥ 3 số |
| FB-R1-SEC-OPS-01 | Major | Đạt | = SEC-R1-31 |
| FB-R1-SEC-OPS-02 | Major | Đạt | `services/api/src/http.ts`: serializer `req` chỉ method + route mẫu, `redact` 10 khóa nhạy cảm; test `http.test.ts` d.58 với `?phone=…&token=…`; Caddyfile.dev không ghi access log |
| FB-R1-SEC-OPS-03 | Major | Đạt | hosting-plan d.117 (đích backup chỉ ghi thêm), d.119 (snapshot tắt/≤ 7 ngày), `purge_journal` áp lại; ADR-010 điểm 3 |
| FB-R1-SEC-BA-01 | Major | Đạt | rbac ký hiệu Q (d.42), A110 cấp/thu hồi thiết bị |
| FB-R1-SEC-BA-02 | Major | Đạt | rbac mục 6 cột GST1/GST2/GSTp; A113 cấp mã xác minh FD+ |
| FB-R1-SEC-BA-03 | Major | Đạt | = SEC-R1-32 |
| FB-R1-SEC-BA-04 | Major | Đạt | = SEC-R1-33 |

**Tổng thẻ Blocker/Major: 25/25 Đạt (2 Blocker, 23 Major).**

### A3. Bốn câu hỏi soát theo yêu cầu
1. **C3 chỉ qua endpoint có nhật ký và `x-requires-trusted-device`?** – Đạt cho 8 operation C3 của nhân viên (mục A, SEC-R1-03). Kênh khách (`uploadGuestDocument` chỉ ghi; `getGuestStay.doorCode` mức 2 có `c3_access_log actor_type=guest`) không áp thiết bị tin cậy – đúng thiết kế. **Không đạt 1 chỗ**: `renderMessage` mẫu `door_code` (BUG-R1-SEC-01).
2. **`x-visible-to` khớp rbac D-xx?** – Đạt: D01 (`dateOfBirth` FD+), D02 (SAL/CTV phạm vi M), D03 (`idDocLast4` FD+), D10, D12a/c, D14 (`payerName` FD+), D16, D19 (`otaRef`), D22, D29, giá vốn/`costVnd`/`payeeName` OWN/MGR. Một số ô hẹp hơn rbac (ví dụ `RackBar.guestDisplayName` không cho HK) – an toàn, không phải lỗi bảo mật.
3. **`/__test__` không lọt spec production?** – Đạt: `openapi.yaml` không có path `/__test__` (chỉ nhắc ở info d.70); tách `openapi.test.yaml`, đăng ký khi `APP_ENV ≠ production`; `clock.ts` chỉ nhận `CLOCK_OVERRIDE` ở dev/test/staging, `config.ts` chặn ở production. Còn thiếu bước CI kiểm bundle (BUG-R1-SEC-08, P3 – R2).
4. **Webhook đúng đường dẫn, không fail-open?** – Đạt: `/v1/webhooks/{provider}/{propertySlug}` khớp ADR-011 + INT; `off` không đăng ký, `mock` cấm ở production (có mã + test); union `ok:false` không đọc thêm; kênh kéo lại qua API. Chi tiết mô tả scheme chữ ký: BUG-R1-SEC-05 (P3).
5. **Bí mật thật trong repo?** – Không phát hiện. Dò lại (regex khóa AWS/Google/Stripe/GitHub/Slack/JWT/PEM, gán `*_SECRET/_KEY/_TOKEN/_PASSWORD`) trên toàn repo trừ `node_modules`/`.git`: chỉ có placeholder `change_me_*_dev_only`, `ci_*_only` và chuỗi test `tooShortSecretValue`. Không có `.env`, `*.pem`, `*.key` nào ngoài `.env.example`. `product/legacy/` (được allowlist trong gitleaks) đã dò tay: không khóa, email mẫu đều `@example.com`, không SĐT/CCCD thật.

## Phần B – Lỗi mới (mẫu QA, test-strategy mục 9)

Đánh số `BUG-R1-SEC-xx` để QA gộp và đánh lại số `BUG-R1-xxx` trong `bug-list.md`. Mức theo test-strategy mục 8 (lỗi tài liệu R1: "sẽ dẫn tới lộ C3 nếu code theo" = P0). Môi trường chung: tài liệu `openapi.yaml` 0.2.0-draft / `erd.md` v0.2 / mã `product/` ngày 16/10/2026, không chạy trên staging.

| Mức | Số lỗi |
|---|:-:|
| P0 | 1 |
| P1 | 1 |
| P2 | 1 |
| P3 | 6 |
| **Tổng** | **9** |

### BUG-R1-SEC-01 – `renderMessage` mẫu `door_code` trả mã cửa (C3) cho SAL/CTV, không qua thiết bị tin cậy và không ghi nhật ký C3
- Mức: **P0** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC (sửa contract), BE (cài đặt)
- Môi trường: tài liệu – `openapi.yaml` 0.2.0-draft d.4346 (`renderMessage`); `erd.md` d.888 (`message_template`); SR-LOCK-03
- Liên quan: US-125, US-128 · rbac D22 · SR-LOCK-03, SR-C3-08, SR-DEV-03 · TM-38, TM-39
- Tiền điều kiện / dữ liệu: đơn của CTV (phạm vi `own`) đã có `door_credential`, đúng ngày đến
- Các bước tái hiện (theo contract): 1. Đăng nhập vai `collaborator` trên điện thoại cá nhân (PWA). 2. `POST …/reservations/{id}/messages/render` với `templateCode=door_code`. 3. Đọc `body` trả về.
- Kết quả thực tế (theo tài liệu): `renderMessage` có `x-roles` gồm `sales_staff`, `collaborator`; mô tả chỉ chặn CTV với mẫu chứa **link** (A22), còn mẫu `door_code` được phép ("Mẫu cấm biến C3 trừ `door_code`"). Operation **không** có `x-requires-trusted-device`, `x-step-up`, `x-classification: C3`, không nêu ghi `c3_access_log`. Nhân viên (cả FD) có thể lấy mã cửa trên thiết bị chưa cấp, không để lại dấu vết – vòng qua toàn bộ kiểm soát của `getDoorCredential`.
- Kết quả mong đợi: rbac D22 – SAL/CTV = K, OWN/MGR/FD = "Đầy L Q"; SR-LOCK-03 "nhân viên xem mã ghi `c3_access_log`". Đề xuất sửa: (a) `templateCode=door_code` (và mọi mẫu có biến C3) chỉ cho owner/manager/FDL/FD → vai khác `403 FORBIDDEN_ACTION`; (b) với mẫu C3: yêu cầu thiết bị tin cậy (`403 DEVICE_NOT_TRUSTED`) + step-up, ghi `c3_access_log` (`subject_type=door_credential`, `action=copy`) **trước** khi trả, phản hồi `Cache-Control: no-store`; (c) cách gọn nhất: tách thành operation riêng `renderDoorCodeMessage` có `x-classification: C3`, `x-requires-trusted-device: true`, `x-step-up: true`, `x-rbac: [A21]` để test sinh tự động bắt được; `message_log` không lưu nội dung (giữ nguyên).
- Bằng chứng: `openapi.yaml` d.4346–4352 (mô tả + `x-roles`); kết quả soát tự động: 8 operation C3 có `x-requires-trusted-device`, `renderMessage` không có.
- Ghi chú test lại: SEC soát lại contract sau khi ARC sửa; QA thêm ca TC-RB: CTV render `door_code` → 403; FD trên thiết bị chưa cấp → 403 `DEVICE_NOT_TRUSTED`; FD trên máy quầy → 200 + 1 dòng `c3_access_log`.

### BUG-R1-SEC-02 – `setParameter` cho MGR sửa các tham số bảo mật và không có giới hạn trên/dưới do SEC đặt
- Mức: **P1** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC (contract + erd 9.3), BE
- Môi trường: tài liệu – `openapi.yaml` d.948 (`setParameter`, `x-roles: [owner, manager]`); `erd.md` mục 9.3 (d.1100–1107)
- Liên quan: US-005 · rbac A101/A102, A118 · SR-GST-08/09/11/13, SR-DEV-01/08, SR-C3-09
- Tiền điều kiện / dữ liệu: phiên `manager`
- Các bước tái hiện (theo contract): `PUT …/parameters/guest_verify_max_attempts` value 1000; `…/trusted_device_mobile_days` value 365; `…/c3_stepup_minutes` value 1440; `…/guest_link_grace_hours` value 720; `…/guest_verify_code_channels` value `["zalo"]`.
- Kết quả thực tế: tóm tắt `setParameter` chỉ liệt kê `foc_limits`, hoa hồng, phí kênh, `vat_rate`, `retention.*` là "chỉ OWN"; các khóa bảo mật ở erd 9.3 (`guest_verify_max_attempts`, `guest_level2_idle_minutes`, `guest_link_grace_hours`, `guest_verify_code_channel_minutes`, `trusted_device_days`, `trusted_device_mobile_days`, `c3_stepup_minutes`) không ghi ai được sửa và không có biên; riêng `guest_verify_code_channels` ghi "chỉ OWN" ở erd nhưng không có trong danh sách của OpenAPI. MGR (hoặc ai chiếm phiên MGR) nới được giới hạn dò mã khách → dò OTP/mã lễ tân để lấy mã cửa, kéo dài thiết bị di động quá 30 ngày (SR-DEV-08), tắt hầu như step-up C3.
- Kết quả mong đợi: các khóa trên **chỉ OWN** sửa (rbac A118 + quyết định SEC), ghi `audit_event` category `security` (không chỉ `config`), và schema giá trị có biên cứng do SEC đặt: `guest_verify_max_attempts` 3–5; `guest_level2_idle_minutes` 5–30; `guest_link_grace_hours` 0–24; `guest_verify_code_channel_minutes` 5–30; `trusted_device_days` 1–180; `trusted_device_mobile_days` 1–30; `c3_stepup_minutes` 1–15. Ngoài biên → `422 VALIDATION_FAILED`. Thêm cột "Người sửa / Biên" vào erd 9.3 và liệt kê các khóa trong mô tả `setParameter`.
- Bằng chứng: `openapi.yaml` d.948–951; `erd.md` d.1104–1107.
- Ghi chú test lại: QA sinh ca MGR → 403 cho từng khóa; OWN với giá trị ngoài biên → 422.

### BUG-R1-SEC-03 – Ô "nhập mã đặt phòng" trên trang QR căn thu hồi link đang dùng của khách (từ chối dịch vụ)
- Mức: **P2** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC
- Môi trường: tài liệu – `openapi.yaml` d.4775 (`resendGuestLinkFromUnit`); ADR-006 điểm 4
- Liên quan: US-106 · SR-GST-04, SR-GST-12 · TM-24, TM-25
- Tiền điều kiện / dữ liệu: người đứng trong căn / thấy QR, biết mã đặt phòng (mã tăng dần, có trên tin nhắn, bill, phiếu)
- Các bước tái hiện (theo contract): gọi `resendGuestLinkFromUnit` với mã đơn của khách đang ở 3 lần/ngày.
- Kết quả thực tế: mô tả ghi "cấp link mới (thu hồi link cũ) và gửi qua email trên đơn" → mỗi lần gọi làm link khách đang dùng mất hiệu lực, mọi mã xác minh gắn token cũ vô hiệu; khách không có email trên đơn thì mất link hoàn toàn tới khi gặp lễ tân. Không lộ dữ liệu (đã đạt SEC-R1-26) nhưng người lạ phá được trải nghiệm khách (mất Wi-Fi/mã cửa trên app giữa đêm).
- Kết quả mong đợi: link mới **không** thu hồi link cũ cho tới khi link mới được mở lần đầu (tối đa 2 token hiệu lực/đơn), hoặc chỉ gửi khi đơn có email và không thu hồi gì; ghi `audit_event security` mỗi lần; nếu không có email → không đổi trạng thái token. Ghi rõ vào ADR-006 điểm 4.
- Bằng chứng: `openapi.yaml` d.4775–4790.
- Ghi chú test lại: ca E2E – gọi resend → link cũ vẫn mở được cho tới khi link mới được dùng.

### BUG-R1-SEC-04 – Operation app khách thiếu mã lỗi `GUEST_STAY_ENDED`/`GUEST_VERIFICATION_REQUIRED` và `getGuestStay` không đánh dấu trả C3
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC
- Môi trường: tài liệu – `openapi.yaml` nhóm `guest-portal` (d.4400–4740)
- Liên quan: SR-GST-10, SR-GST-11 · `getGuestStay`, `listMyRequests`, `createGuestRequest`, `uploadGuestDocument`, `getOnlineCheckin`, `recordGuestConsent`…
- Các bước tái hiện: đọc `responses` của các operation `/v1/guest/*`.
- Kết quả thực tế: info nói mọi operation khác bill trả `403 GUEST_STAY_ENDED` sau trả phòng, nhưng `responses` của `getGuestStay` chỉ có `200, 401`; `createGuestRequest`, `uploadGuestDocument`, `getOnlineCheckin`… không khai 403. `getGuestStay` trả `doorCode` (C3) nhưng operation không có `x-classification: C3`/dấu hiệu ghi `c3_access_log` → bộ sinh test từ contract (test-strategy tầng R) sẽ không sinh ca "mỗi lần trả mã cửa có 1 dòng log".
- Kết quả mong đợi: thêm `403` (Problem `GUEST_STAY_ENDED`, `GUEST_VERIFICATION_REQUIRED`) vào các operation khách; thêm `x-classification: C3` (hoặc `x-c3-log: true`) cho `getGuestStay`.
- Bằng chứng: kết quả soát tự động `responses` của 16 operation khách.

### BUG-R1-SEC-05 – Security scheme `providerSignature` mô tả chữ ký ở header, không khớp IPN VNPay (query) / MoMo (body)
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC (contract), INT (xác nhận)
- Môi trường: tài liệu – `openapi.yaml` d.4858 (`providerSignature: apiKey, in: header, X-Provider-Signature`); `webhookGet` d.4812
- Liên quan: SR-PAY-01…05 · TM-28 · INT README 3.2
- Kết quả thực tế: scheme khai báo như một API key ở header. Nếu BE dựng middleware dùng chung theo contract ("có header là qua") thì có rủi ro kiểm sai chỗ; `webhookGet` không có mô tả riêng (chỉ "cùng xử lý với POST").
- Kết quả mong đợi: mô tả scheme ghi rõ "không phải API key; không có middleware chung; chữ ký do adapter kiểm theo đặc tả từng cổng (query `vnp_SecureHash`, trường `signature` trong body…), lỗi → từ chối, không đọc dữ liệu" (fail-closed); thêm mô tả cho `webhookGet` (giới hạn độ dài query, cùng quy tắc trả lỗi không lộ lý do).
- Bằng chứng: `openapi.yaml` d.4858–4862.

### BUG-R1-SEC-06 – Vai PostgreSQL ở hạ tầng lệch erd 2.1 (thiếu `ottimo_migrator`, `ottimo_owner` có LOGIN)
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: OPS (hoặc ARC sửa erd nếu chọn mô hình của OPS)
- Môi trường: `product/infra/postgres/init/02-roles.sh`; `product/.env.example` (`MIGRATION_DATABASE_URL=postgres://ottimo_owner:…`); `erd.md` d.36–41; `architecture.md` d.416
- Liên quan: SR-AZ-06, SR-OPS-04 · FB-R1-SEC-OPS-01
- Kết quả thực tế: erd 2.1: `ottimo_owner` NOLOGIN (chủ schema + hàm `SECURITY DEFINER`), `ottimo_migrator` LOGIN `IN ROLE ottimo_owner`. Script tạo `ottimo_owner` **LOGIN** có mật khẩu, không tạo `ottimo_migrator`; `.env.example` và CI migrate bằng `ottimo_owner`. Hệ quả nhỏ: lộ `MIGRATION_DATABASE_URL` = đăng nhập thẳng bằng chủ các hàm `SECURITY DEFINER` (không có lớp `SET ROLE` để audit); hai đội sẽ viết migration/grant theo hai mô hình khác nhau.
- Kết quả mong đợi: thống nhất một mô hình (khuyến nghị theo erd: owner NOLOGIN + migrator LOGIN); `MIGRATION_DATABASE_URL` dùng `ottimo_migrator`; test vai bổ sung kiểm `ottimo_owner` không đăng nhập được.
- Bằng chứng: `02-roles.sh` dòng `CREATE ROLE ottimo_owner LOGIN …`.

### BUG-R1-SEC-07 – Mã xác minh khách băm bằng `ID_HASH_KEY` (dùng chung khóa với đối chiếu số giấy tờ); `GUEST_CODE_SIGNING_KEY` chưa vào kiểm khởi động
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: ARC (erd), BE (config.ts ở R2)
- Môi trường: `erd.md` d.697 (`guest_verification_code.code_hash` "HMAC với `ID_HASH_KEY`"); `product/.env.example` (`GUEST_CODE_SIGNING_KEY`); `services/api/src/config.ts` `REQUIRED_SECRETS`
- Liên quan: SR-KEY-01/08, SR-GST-07 · ADR-013 mục 5
- Kết quả thực tế: một khóa phục vụ hai mục đích (đối chiếu số CCCD/hộ chiếu – C3 – và mã OTP); xoay một khóa ảnh hưởng cả hai; `.env.example` đã có khóa riêng nhưng erd không dùng, `config.ts` không bắt buộc khóa này ở staging/production.
- Kết quả mong đợi: `code_hash` = HMAC với `GUEST_CODE_SIGNING_KEY`; thêm vào `REQUIRED_SECRETS` (≥ 32 ký tự) khi BE làm SR-GST ở R2; ghi vào sổ bí mật hosting-plan 8.1.

### BUG-R1-SEC-08 – Chưa có bước CI chặn `__test__` trong bản build production; `openapi.test.yaml` khai thiếu phiên owner
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: OPS (CI), ARC (`openapi.test.yaml`)
- Môi trường: `.github/workflows/ci.yml`; `product/docs/api/openapi.test.yaml` (`security: - testToken: []`); ADR-008 d.18, ADR-012 d.63
- Liên quan: SR-SECR-05 · architecture.md d.416 mục (5)
- Kết quả thực tế: ADR-008/012 và `openapi.test.yaml` yêu cầu "CI kiểm bundle production không chứa chuỗi `__test__`" – ci.yml chưa có bước này (R1 chưa có `TestSupportModule` nên chưa gây hại). `openapi.test.yaml` mô tả cần cả `X-Test-Token` **và** phiên owner nhưng `security` chỉ khai `testToken`.
- Kết quả mong đợi: thêm bước CI (grep `dist/` của image api, thất bại nếu có `__test__`/`TestSupportModule`) **trước khi** BE merge module kiểm thử ở R2; `security: [{ testToken: [], cookieAuth: [] }]` trong `openapi.test.yaml`.

### BUG-R1-SEC-09 – Ví dụ cấu hình trong INT README dùng `APP_ENV=development` (giá trị không hợp lệ)
- Mức: **P3** - Trạng thái: Mới
- Vai chịu trách nhiệm: INT
- Môi trường: `product/integrations/README.md` d.270; `services/api/src/config.ts` (`APP_ENVS = dev|test|staging|production`)
- Liên quan: SR-SECR-05, FB-R1-SEC-INT-04
- Kết quả thực tế: chép ví dụ → api từ chối khởi động (an toàn, fail-closed) nhưng dễ khiến người cấu hình "sửa nhanh" sai cách; lệch với `.env.example`.
- Kết quả mong đợi: đổi thành `APP_ENV=dev  # dev | test | staging | production`.

## Phần C – Ghi chú (không phải lỗi)
- OpenAPI chưa có trường D12b (lưu ý sức khỏe). Khi thêm ở R2/R3 phải: C3, chỉ ghi khi có đồng ý, HK chỉ nhận nhãn chung, chi tiết FD+.
- Nhánh `pnpm install --no-frozen-lockfile` trong ci.yml (SEC-R1-24) phải bỏ ngay khi commit `pnpm-lock.yaml` đầu R2 – SEC kiểm lại ở R2.
- Header bảo mật, rate limit, CSP production, Caddyfile production là việc R2 (SR-HDR, SR-RL) – chưa soát được vì chưa có mã.
- Kiểm tra này chỉ đọc tài liệu và mã; không chạy tấn công thử, không dùng dữ liệu thật.
