# Phản hồi của ARC – Round 1 · Bước 4

- Tác giả: ARC | Ngày: 16/10/2026
- Trả lời: `reviews/SEC-on-ARC.md` (26 thẻ), `reviews/BE-on-ARC.md` (18 thẻ), `reviews/DATA-on-ARC.md` (11 thẻ), cùng mục "Tự nhận lỗi để sửa ở bước 4" trong `reviews/ARC-on-SEC.md` (24 mục) và yêu cầu ORC chuyển tiếp từ SEC, DATA, INT, BA, QA, PO, UXD trong bước 4.
- Tài liệu đã sửa: `product/docs/architecture.md` v0.2, `product/docs/erd.md` v0.2, `product/docs/api/openapi.yaml` 0.2.0-draft, `product/docs/api/openapi.test.yaml` (mới), `product/docs/coding-standards.md` v0.2, `product/docs/adr/ADR-002, 003, 005, 006, 007, 008, 009, 010, 011, 012, 013`.
- Kiểm hợp lệ: `openapi-spec-validator` 0.7.2 → `openapi.yaml` **VALID (OpenAPI 3.1.0)**, 140 path / 164 operation, 164/164 có `x-roles`, 0 UUID ví dụ sai, 0 schema thừa; `openapi.test.yaml` VALID. `redocly lint` chưa chạy được trên máy ARC (không có Node/npx) – đã đưa vào yêu cầu CI cho OPS.

## Tổng hợp trạng thái

| Nguồn | Tổng | Done | Rejected | Deferred | Escalated |
|---|---|---|---|---|---|
| SEC-on-ARC (1 Blocker, 12 Major, 11 Minor, 2 Suggestion) | 26 | 26 | 0 | 0 | 0 |
| BE-on-ARC (8 Major, 8 Minor, 2 Suggestion) | 18 | 18 | 0 | 0 | 0 |
| DATA-on-ARC (5 Major, 5 Minor, 1 Suggestion) | 11 | 11 | 0 | 0 | 0 |
| **Cộng thẻ** | **55** | **55** | 0 | 0 | 0 |

Blocker/Major còn Open: **0**. Một số thẻ Done có phần **triển khai** thuộc R3 hoặc chờ vai khác (ghi rõ trong cột ghi chú) – hợp đồng/ERD đã có đủ để R2 code không phải đoán.

## 1. SEC-on-ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-SEC-ARC-01 (Blocker) | Done | Bỏ `phoneLast4`, `bookingCode` khỏi `verifyGuestSession`; body mới `{method: email_otp\|desk_code, code}`. Thêm `POST /v1/guest/sessions/otp` (`sendGuestOtp`, 3/giờ/token, không gửi tới email đổi < 24 giờ – SR-GST-14) và `POST …/reservations/{id}/guest-verification-code` (`issueGuestVerificationCode`, FD+, audit, mã 6 số dùng một lần gắn token; kênh OTA/Zalo theo `guest_verify_code_channels` **mặc định tắt** – phân xử ORC, SR-GST-13). ADR-006 điểm 3 viết lại theo SR-GST-07. ERD: bảng `guest_verification_code` |
| FB-R1-SEC-ARC-02 | Done | Bộ đếm chuyển sang `guest_access_token` (`failed_verify_count`, `verify_locked_until`, `otp_sent_count`, `otp_window_started_at`, `channel_code_count`…); `guest_session` bỏ bộ đếm; lỗi `429 GUEST_VERIFICATION_LOCKED`; chỉ mã lễ tân tại quầy/điện thoại mở khóa |
| FB-R1-SEC-ARC-03 | Done | ADR-006 điểm 4: ô mã đặt phòng **không cấp phiên**, chỉ gửi lại link tới email trên đơn, phản hồi luôn giống nhau, 5/giờ/IP + 3/ngày/đơn. Thêm `GET /v1/public/units/{unitSlug}` và `POST …/resend-link`; `room.public_slug` ngẫu nhiên; hàm `public_resolve_unit` |
| FB-R1-SEC-ARC-04 | Done | Bảng `trusted_device` (+ `device_kind` `desk\|facility_mobile`, hạn ≤ 30 ngày cho di động – SR-DEV-08/09), cookie `__Host-ottimo_did`, extension `x-requires-trusted-device` trên documents POST/PATCH, `sensitive`, ảnh, `portal-data`, `door-credential` GET/PUT, xóa ảnh; lỗi `403 DEVICE_NOT_TRUSTED`; endpoint `listTrustedDevices`, `trustCurrentDevice` (chỉ origin admin-web), `revokeTrustedDevice` (owner); `Me.properties[].deviceTrusted`; thêm `x-step-up` (SR-C3-09) + `POST /v1/me/step-up` |
| FB-R1-SEC-ARC-05 | Done | ADR-013 điểm 3 sửa đúng câu SR-KEY-09; ADR-010 vòng đời cứng ≤ 35 ngày, snapshot tắt/≤ 7 ngày; `purge_journal` (erd 4.7); tùy chọn SR-KEY-06 ghi R3 |
| FB-R1-SEC-ARC-06 | Done | `setUserRoles`, `updateUser`, `changeMyPassword`, tắt 2FA thu hồi mọi phiên ngay; `app_user.roles_version`, cache quyền ≤ 60 giây; `user_session.revoked_reason` |
| FB-R1-SEC-ARC-07 | Done | `renderMessage`: mẫu có link đi qua kiểm quyền A22 (CTV → 403); render không cấp token mới, nhận `guestLinkUrl` vừa cấp trong cùng thao tác; `issueGuestLink` bỏ `sales_staff` (theo BA) |
| FB-R1-SEC-ARC-08 | Done | Webhook đổi thành `/v1/webhooks/{provider}/{propertySlug}` (khớp ADR-011 và INT), thêm GET cho VNPay, `mock` chỉ ngoài production, provider `off` không đăng ký, body ≤ 64 KB, lỗi không lộ lý do; hàm `webhook_resolve_property` |
| FB-R1-SEC-ARC-09 | Done | ERD `inbox_message`: bỏ `payload_ref`, thay `filtered_payload` (allowlist) + `card_fields_dropped`, xóa sau 90 ngày; ADR-011 cập nhật |
| FB-R1-SEC-ARC-10 | Done | `Guest.tags` → [owner, manager, FDL, FD, sales_staff]; `serviceNotes` → [owner, manager, FDL, FD, housekeeping]; `warnings` → [owner, manager, FDL, FD]; `GuestSummary.tags` như `tags`; `Party.members` có `x-visible-to` và mô tả `own_count_only` bỏ hẳn `members` |
| FB-R1-SEC-ARC-11 | Done | `DoorCredentialInput.code` `^[0-9]{6,10}$`, mặc định lõi sinh CSPRNG; bỏ `codeHint` (schema + ERD `code_hint`) |
| FB-R1-SEC-ARC-12 | Done | `c3_access_log` thêm `actor_type`, `session_id`, `trusted_device_id`, `ip_hmac`; `C3AccessEntry` cập nhật; `GuestStay.doorCode` ghi log `actor_type=guest` |
| FB-R1-SEC-ARC-13 | Done | Ràng buộc SR-FILE v0.2 (chỉ JPEG/PNG/WebP, không PDF/HEIC, ≤ 10 MB, ≤ 40 MP, ≤ 4 ảnh/người, ≤ 30 tệp/đơn, mã hóa lại bằng sharp, bỏ EXIF) trong info + 2 endpoint tải; header SR-C3-03 cho phản hồi ảnh; bỏ `application/pdf` |
| FB-R1-SEC-ARC-14 | Done | `lookupGuestByContact`: 30/giờ/người với SAL/CTV, audit mỗi lần tra, khách ngoài phạm vi chỉ trả `possible_duplicate` |
| FB-R1-SEC-ARC-15 | Done | `QuoteCalculation.commission` → [owner, manager, sales_staff, collaborator]; `Folio.totals` ngoài `roomVnd`/`depositHeldVnd` không gồm CTV |
| FB-R1-SEC-ARC-16 | Done | `AuditEvent.before/after` ghi serializer allowlist; ERD `audit_event` cùng quy tắc; info OpenAPI mục "Nhật ký" |
| FB-R1-SEC-ARC-17 | Done | `purge_journal(id, organization_id, property_id, subject_type, subject_id, policy_key, action, purged_at)`, sao lưu riêng ≥ 36 ngày, runbook áp lại (yêu cầu OPS) |
| FB-R1-SEC-ARC-18 | Done | `POST /v1/guest/consents/{purpose}/withdraw` (mức 2) → P02b đặt `delete_after = now`, J16 xóa + `purge_journal` |
| FB-R1-SEC-ARC-19 | Done | Cookie `__Host-ottimo_sid`, `__Host-ottimo_gsid` (securitySchemes, login, ADR-006); dev HTTP bỏ tiền tố qua `COOKIE_SECURE_PREFIX` |
| FB-R1-SEC-ARC-20 | Done | ADR-006 điểm 2 + info OpenAPI: sau `checked_out` chỉ bill + phát sinh, mức 2; khác → `403 GUEST_STAY_ENDED`; `GuestSession.stayEnded` |
| FB-R1-SEC-ARC-21 | Done | `writeOnly: true` cho mọi trường C3 của `GuestDocumentInput` và `PartyMemberCreate.childName/childBirthYear` |
| FB-R1-SEC-ARC-22 | Done | `POST /v1/me/password`, `PUT /v1/me/approval-pin`, `POST /v1/auth/login/mfa`, `/v1/me/2fa` (+ setup, confirm; x-round R3); ERD `must_change_password`, `password_changed_at`, `mfa_enabled`, `mfa_secret_enc`, `mfa_recovery_codes_hash`; lỗi `PASSWORD_CHANGE_REQUIRED`, `MFA_REQUIRED` |
| FB-R1-SEC-ARC-23 | Done | `reservation_guest.child_data_key_id`; `guest_document.visa_kind_enc` |
| FB-R1-SEC-ARC-24 | Done | `ip_hash` → `ip_hmac` (HMAC `LOG_IP_HMAC_KEY`) ở `audit_event`, `user_session`, `guest_session`; `setDoorCredential` và `purgeRegistrationImages` có `Idempotency-Key` + `If-Match` |
| FB-R1-SEC-ARC-25 (Suggestion) | Done | Chấp nhận: `DATA_KEK_FILE`, `ID_HASH_KEY_FILE` qua Compose `secrets:` (ADR-013 điểm 2, SR-KEY-10); biến trực tiếp chỉ cho dev; yêu cầu OPS |
| FB-R1-SEC-ARC-26 (Suggestion) | Done | Ghi điều kiện M9 vào `guest_document.visa_alert_on` (NULL khi đơn kết thúc, không DTO/audit/SSE, "Cần chú ý" chỉ mã đơn) |

## 2. BE-on-ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-BE-ARC-01 (Major) | Done | erd 2.4 "Đường vào trước ngữ cảnh": 7 hàm `SECURITY DEFINER` (`auth_find_user`, `auth_resolve_session`, `auth_resolve_device`, `guest_resolve_token`, `webhook_resolve_property`, `public_resolve_unit`, `worker_list_properties`); `username` duy nhất toàn hệ thống; webhook theo ADR-011; schema `pgboss` ngoài RLS (2.5); bỏ câu "vai DB riêng cho job" ở ADR-007 |
| FB-R1-BE-ARC-02 (Major) | Done | Policy qua `app_current_property()`/`app_current_org()` có `NULLIF`; tên số ít (ADR-007 sửa); `set_config(…, true)` câu đầu mỗi giao dịch (erd 2.2, coding-standards 6); test kết nối tái sử dụng (erd 2.7) |
| FB-R1-BE-ARC-03 (Major) | Done | ARC ghi yêu cầu (erd 2.1, architecture 17): vai `ottimo_owner/ottimo_migrator/ottimo_app/ottimo_readonly`, `DATABASE_URL` + `MIGRATION_DATABASE_URL`, cả DB test/CI, test `rolsuper/rolbypassrls`, `trustProxy` = subnet Caddy. **OPS hiện thực** compose/CI/init (ARC không sửa file OPS) |
| FB-R1-BE-ARC-04 (Major) | Done | ADR-008 chốt interface `now/businessDate/atLocal`; `MutableClock` với bảng `dev_clock` + `NOTIFY clock_changed`; `openapi.test.yaml` (`/__test__/clock`, `/__test__/jobs/{jobKey}/run`) chỉ ngoài production, CI kiểm bundle; cấm `now()` trong SQL nghiệp vụ; lịch = tick + so mốc theo Clock |
| FB-R1-BE-ARC-05 (Major) | Done | architecture 9.1 "Mẫu handler job chạy đúng một lần" (job_run cùng giao dịch, không trạng thái started); J1 `singletonKey = id:hold_expires_at`; một cơ chế lập lịch; thứ tự khóa; J1 vs confirm-deposit; kết nối LISTEN riêng (erd 2.5) |
| FB-R1-BE-ARC-06 (Major) | Done | erd: `attention_event` (sự kiện) vs mục tính lúc đọc; `staff_notification`, `push_subscription` (R3); OpenAPI `GET /v1/me/notifications`, `POST …/read`, `PUT /v1/me/push-subscription` (R3), `resolveAttentionEvent`, SSE `notification.created`; VAPID vào danh sách biến; ghi rõ Web Push R3, R2 trong app + SSE |
| FB-R1-BE-ARC-07 (Major) | Done | erd mục 16 "Chiến lược migration" + ADR-002 + coding-standards 6: SQL là nguồn sự thật, `--custom`, cấm `push`, CI 2 bước, `setTypeParser(20)`, `uuid@^11`, đổi `src/db.ts` → `src/db/pinger.ts` (yêu cầu OPS/BE) |
| FB-R1-BE-ARC-08 | Done | EXCLUDE `DEFERRABLE INITIALLY IMMEDIATE`; `POST …/actions/swap-room`; `CHECK NOT isempty`; thứ tự khóa (coding-standards 6); dựng `conflicts[]` sau rollback. Rời trong ngày: [GIẢ ĐỊNH – chờ DOM ở R2] giữ đêm đầu (erd 14 E6) |
| FB-R1-BE-ARC-09 | Done | `reservation.folio_id` DEFERRABLE INITIALLY DEFERRED, sinh 2 id ở ứng dụng; quy ước FK cặp `(property_id, x_id)` + `UNIQUE(property_id,id)` (erd mục 1, K11) |
| FB-R1-BE-ARC-10 | Done | `doc_sequence` tách `organization_id` + `property_id` null, 2 UK một phần, policy riêng; thuật toán một câu `INSERT … ON CONFLICT DO UPDATE … RETURNING` |
| FB-R1-BE-ARC-11 | Done | Info OpenAPI: thứ tự kiểm, khóa trong cùng giao dịch, PK `(principal_type, principal_id, key)`, `dryRun` không cần header, `required: false` + middleware 428; thêm `Idempotency-Key` cho `withdrawQuote`, `cancelRequest`; `addFolioLine` ghi ngoại lệ không If-Match + khóa folio. `logout`, `calculateQuote`, `lookupGuestByContact` ghi lý do không cần khóa |
| FB-R1-BE-ARC-12 | Done | ADR-009 → `412 VERSION_CONFLICT`; `/health` có `503` + schema `Health` `status: ok\|error`, ghi ngoại lệ không problem+json |
| FB-R1-BE-ARC-13 | Done | Đổi 11 UUID ví dụ sang hệ 16 (`…cb002`, `…aa003`, `…af001`, `…e1001`, `…bb001`); validator xác nhận 0 lỗi; redocly vào CI |
| FB-R1-BE-ARC-14 | Done | Trigger K7 chỉ chặn trường hợp chắc chắn sai, quyền adjustment ở guard; `v_folio_balance` `security_invoker`; khóa folio FOR UPDATE ở checkOut/recordPayment/addFolioLine |
| FB-R1-BE-ARC-15 | Done | [GIẢ ĐỊNH đội tự chốt] dùng giá đêm niêm yết đã làm tròn đã lưu (erd 4.1); `roundVnd` nửa lên theo trị tuyệt đối, test số âm (coding-standards 4). **Đề nghị DOM** sửa ví dụ BR-107 cho khớp |
| FB-R1-BE-ARC-16 (Major) | Done | ARC chấp nhận ước BE ≈ 20–25 tuần-người, cập nhật architecture 19 T1 (sau bước 4 nghiêng cận trên). Phạm vi/mốc đã được ORC phân xử: PO lập plan R2 theo PRD D6 + phương án thu hẹp trong ESC-012 (đội đề xuất R-C) |
| FB-R1-BE-ARC-17 (Suggestion) | Done | Giữ ADR-001: `packages/contracts` không chứa công thức giá (coding-standards 1.1 sửa) |
| FB-R1-BE-ARC-18 (Suggestion) | Done | `audit_event`, `c3_access_log`, `state_transition` phân vùng tháng ngay migration R2, PK `(id, occurred_at)`, J16 tạo/xóa phân vùng |

## 3. DATA-on-ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-DATA-ARC-01 (Major) | Done | `stay_night`: `channel_fee_vnd`, `channel_fee_is_estimate`, `agent_commission_vnd`, `staff_commission_vnd`, `service_fee_alloc_vnd`; `channel_fee.recognized_on`, `amount_on_cancellation_vnd`; quy tắc phân bổ lại (erd mục 8) |
| FB-R1-DATA-ARC-02 (Major) | Done | `room_revenue_gross_vnd`, `discount_vnd`; 4 dòng quy tắc FOC/giảm giá/từ chối/đảo trong erd mục 8; FOC ngoài phòng không chạm `stay_night` |
| FB-R1-DATA-ARC-03 (Major) | Done | Công suất chỉ đêm `sold` có `room_id`; doanh thu/ADR gồm đêm chưa gán; R-06a/R-06b thay E3 (erd 7, 8, 14; J17); `TonightKpi.unassignedConflictReservations`, `occupiedRooms` mô tả rõ, `metricRefs` |
| FB-R1-DATA-ARC-04 (Major) | Done | `sold_at`, `voided_at`, `void_reason` (8 giá trị), `prev_state`; CHECK bắt buộc khi void; chỉ mục đêm void |
| FB-R1-DATA-ARC-05 (Major) | Done | `reservation.confirmed_at`, `status_before_cancel`, `ota_booked_at` (+ `direct_source`, `has_contact_at_eligibility` theo metrics v0.2); `reservation_change` là nguồn chỉ số, thời hạn T08; mọi chuyển SM-01 ghi cả hai bảng. OpenAPI `ReservationCreate.otaBookedAt` |
| FB-R1-DATA-ARC-06 | Done | (1) quy tắc chia đều dư dồn đêm cuối (erd 8 + mô tả `createReservation`); (2) `PUT …/channel-fee` (`reconcileChannelFee`, x-round R3) + schema `ChannelFee`; cột và quy tắc có từ R2 |
| FB-R1-DATA-ARC-07 | Done | `folio_line.adjusts_group` (bắt buộc với `adjustment`), `revenue_group = coalesce(adjusts_group, …)`; nguyên tắc không sửa đêm tháng đã chốt (R3) |
| FB-R1-DATA-ARC-08 | Done | Từ điển cột `commission` + `commission_payout`, ánh xạ trạng thái DATA ↔ SM-11; schema `Commission` + `GET /commissions` |
| FB-R1-DATA-ARC-09 | Done | `minibar_check_line.unit_cost_vnd_snapshot` (C2) ở R2 |
| FB-R1-DATA-ARC-10 | Done | Bảng `user_activity_day` (R2), upsert ≤ 1 lần/5 phút/phiên, không IP/thiết bị, T15 |
| FB-R1-DATA-ARC-11 (Suggestion) | Done | `reservation.checkout_started_by`; `TonightKpi.metricRefs` |

## 4. Mục "Tự nhận lỗi để sửa ở bước 4" (ARC-on-SEC.md)

| # | Mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1–9 | SEC-R1-01…22 | Done | Trùng thẻ SEC-ARC ở mục 1 |
| 10 | QA #1 – khoảng OOO | Done | Nửa mở `[start, end)`, end = ngày mở bán lại (DOM 15/10); `RoomBlockCreate.endDatePlanned` mô tả; erd 4.9 + CHECK |
| 11 | QA #3 – 409 vs 412 | Done | ADR-009 → 412 |
| 12 | QA #6 – gộp hồ sơ | Done | PO chuyển US-023 AC2 sang US-074 (R3); ERD giữ `guest_code_alias`, `guest_merge_log` R3; không thêm endpoint R2 |
| 13 | QA #7 – hoa hồng | Done | `GET /commissions` (R2, phạm vi M), `mark-paid` (R3) theo PO (US-087 AC2 thu hẹp, US-089 R3) |
| 14 | MutableClock | Done | ADR-008, `openapi.test.yaml`, bảng `dev_clock` |
| 15 | ADR-010 backup | Done | ≤ 35 ngày |
| 16 | Đường dẫn compose | Done | architecture 17 + ADR-012 → `infra/docker-compose.yml` |
| 17 | `DEVICE_NOT_TRUSTED` | Done | Mã lỗi + extension |
| 18 | `verifyGuestSession` | Done | Như SEC-ARC-01 |
| 19 | Endpoint hoa hồng/thiết bị/2FA | Done | Như trên |
| 20 | Câu PaymentAdapter | Done | architecture 13 sửa: trạng thái theo SM-12, hoàn tiền là `payment type=refund` |
| 21 | ESM/CJS | Done | ADR-012 mục "Đóng gói ESM/CJS" (package ESM xuất kép, api CJS `Node16`, Node ≥ 22.12) |
| 22 | redocly lint | Done một phần | Đã chạy `openapi-spec-validator` (VALID) + script kiểm `x-roles`/UUID/schema thừa; `redocly` cần Node → OPS thêm job `api-contract` trong CI (ADR-012) |
| 23 | `allowedActions` | Done | `AllowedAction` có `event` (mã snake_case BA mục 18), `transition`, `action`, `requiresTrustedDevice`; erd mục 5 |
| 24 | `x-visible-to` khách theo mức | Done | Extension `x-guest-level` (0/1/2) cho mọi operation `/v1/guest/*` và thuộc tính `GuestStay.doorCode`, `guestFullName`; sau trả phòng `GUEST_STAY_ENDED` |

## 5. Yêu cầu ORC chuyển tiếp trong bước 4

| Từ | Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|---|
| SEC v0.2 | `guest_verify_code_channels`, endpoint mã qua kênh (15 phút, ≤ 3/24 giờ, gắn token), `trusted_device.device_kind`, email không bắt buộc + chặn OTP email mới đổi 24 giờ, mẫu `verify_code`, luồng khách đến khuya | Done | erd 4.2, 4.5, 4.11, 9.3; OpenAPI `issueGuestVerificationCode`, `trustCurrentDevice.deviceKind`, `ReservationCreate.guestEmail`, `sendGuestOtp`; ADR-006 điểm 8 (SR-GST-15) |
| SEC v0.2 | SR-FILE-01/03 (không PDF/HEIC) | Done | OpenAPI, ADR-013, coding-standards |
| DATA v0.2 | Cột `stay_night`/`reservation` mới, `user_activity_day`, `guest_cancelled`, `unassignedConflictReservations` | Done | Lưu ý lệch tên mã hủy: ERD/OpenAPI theo **BR-308 v0.2 của DOM** (`ota_cancelled`, `overbooking_relocated`, có `guest_cancelled`); **đề nghị DATA** đổi `relocated_external`/`channel_cancelled` trong K-22a cho khớp (giữ tên DATA cho `stay_night.void_reason`) – erd 14 E7 |
| INT | Webhook `/v1/webhooks/{provider}/{propertySlug}` + GET VNPay; `payment.method_detail`; nơi lưu xung đột OTA; `inbox_message.filtered_payload` 90 ngày; `integration_log.cost_units`; hoàn tiền = `payment type=refund`; sửa câu architecture 13 | Done | Xung đột OTA dùng `overbooking_incident` mở rộng (`cause`, `handle_by`, `decided_by`, `decision_note`) thay vì bảng mới `booking_conflict` – tránh 2 nơi lưu cùng sự việc |
| BA | 7 chỗ lệch x-roles | Done | `listApprovalRequests`, `cancelRequest` thêm collaborator (own); `issueGuestLink` bỏ sales_staff; `setMyApprovalPin` thêm front_desk; thiết bị giữ owner |
| BA | SM-16 nhóm đơn, SM-17 ca, đối soát BR-527, mã sự kiện | Done (mô hình) | erd: `reservation_group`, `payment_allocation`, `group_bill`, `shift`, `payment.reconciliation/shift_id`, enum mục 5. **Endpoint nhóm đơn và đóng ca chưa có trong OpenAPI** – thêm đầu R2 khi PO chốt phạm vi (Deferred phần API) |
| QA | OTP email (US-141), đổi giai đoạn lead, 20 lệch rbac ↔ x-roles, `x-rbac-field` | Done một phần | `sendGuestOtp` có sẵn; thêm `changeLeadStage`; `listRooms`/`listRoomGroups` giữ HK/MT với phạm vi `catalog_only` + mô tả trường – **đề nghị BA** ghi phạm vi này vào rbac S25; `x-rbac-field` gắn 16 thuộc tính chính (D01, D02, D03, D10, D12a, D12c, D14, D16, D22, D29). **Còn lại**: rà toàn bộ 20 operation lệch với `rbac-matrix.json` và phủ `x-rbac-field` cho mọi thuộc tính – tuần đầu R2 cùng QA |
| PO | US-018 AC5 + US-139, US-119 AC5/AC6, US-106 AC2, US-141, US-142, duyệt FOC R2 bằng mật khẩu | Done | `createReservation` 409 + `suggestions[]` + `allowUnassigned`; `assignRoom` (B7a); `PaymentCreate.billingPeriodId` (thu kỳ); `Payment.reconciliation` + `reconcilePayment`; `GuestFolio.postCheckoutCharges/vietqr`; `x-stories` US-141, US-142; `approveRequest {authMethod: password\|pin, secret}` (R2 password) |
| UXD | `blocksDoorCode`, cấu hình kênh gửi mã, loại + hạn thiết bị, `booker.email` | Done | `Registration.blocksDoorCode` + erd `registration.blocks_door_code`; `x-blocked-by` trên `setDoorCredential`; tham số qua API parameters; `TrustedDevice.deviceKind/expiresAt`; `ReservationCreate.guestEmail` |

## 6. Yêu cầu gửi vai khác (ARC không sửa file của họ)

| Gửi | Yêu cầu |
|---|---|
| OPS | (1) init 4 vai DB + 2 URL cho compose/CI/`.env.example`, cả DB test; (2) `trustProxy` = subnet Caddy; (3) job CI `api-contract` (redocly + openapi-spec-validator + kiểm `x-roles`) và 2 bước migration (erd 16); (4) CI kiểm bundle production không chứa `__test__`; (5) Compose `secrets:` cho KEK/`ID_HASH_KEY`; (6) Caddy 3 origin, che `/g/*` và query `/v1/webhooks/*`; (7) `src/db.ts` → `src/db/pinger.ts`; `/health` 503; (8) backup ≤ 35 ngày + sao lưu riêng `purge_journal` ≥ 36 ngày + runbook áp lại; (9) biến môi trường mới ở architecture 13 (`APP_ENV`, `MIGRATION_DATABASE_URL`, `LOG_IP_HMAC_KEY`, `CLOCK_MODE`, `TEST_SUPPORT_TOKEN`, `TRUST_PROXY_CIDR`, 3 base URL), bỏ `CLOCK_OVERRIDE` |
| DOM | Sửa ví dụ BR-107 theo giá đêm đã làm tròn; chốt "rời trong ngày" (erd E6); thêm khóa tham số E5 vào BR mục 13 |
| DATA | Đổi tên mã hủy trong K-22a theo BR-308 (erd E7) |
| BA | Ghi phạm vi `catalog_only` của `listRooms`/`listRoomGroups` cho HK/MT/SAL/CTV vào rbac S25 |
| MOB/FE | Đổi API 0.1 → 0.2: `verifyGuestSession` body mới, cookie `__Host-`, webhook path, `DoorCredentialMasked` bỏ `codeHint`, `AllowedAction` thêm `event/transition`, `CancelReasonCode` theo BR-308, `approveRequest` body mới, `Folio.totals` lọc theo vai |

## Dòng decision-log đề xuất

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-16 | 1 | Vai DB: `ottimo_owner` (chủ schema), `ottimo_migrator` (migrate), `ottimo_app` (api + worker, không superuser, không BYPASSRLS), `ottimo_readonly` (OPS); hai URL `DATABASE_URL`/`MIGRATION_DATABASE_URL`; OPS hiện thực ở compose/CI | ARC | BE-ARC-01, -03 |
| 2026-10-16 | 1 | RLS dùng `app_current_property()` có `NULLIF`, biến số ít đặt bằng `set_config(…, true)` câu đầu mỗi giao dịch; truy vấn trước ngữ cảnh chỉ qua 7 hàm `SECURITY DEFINER` hẹp; `username` duy nhất toàn hệ thống | ARC | BE-ARC-01, -02 |
| 2026-10-16 | 1 | Job theo lịch: pg-boss tick mỗi phút, so mốc theo `Clock`; `job_run` + nghiệp vụ + outbox trong một giao dịch của pool app (mẫu architecture 9.1) | ARC | BE-ARC-05 |
| 2026-10-16 | 1 | `MutableClock` (bảng `dev_clock` dùng chung api/worker) + endpoint `/__test__/*` chỉ khi `APP_ENV ≠ production`, đặc tả riêng `openapi.test.yaml`; cấm `now()` trong SQL nghiệp vụ | ARC | BE-ARC-04, QA |
| 2026-10-16 | 1 | Migration SQL là nguồn sự thật của schema; drizzle-kit chỉ sinh nháp, cấm `push`, CI kiểm schema.ts khớp migration | ARC | BE-ARC-07 |
| 2026-10-16 | 1 | "Cần chú ý": mục suy từ trạng thái tính lúc đọc; mục sự kiện lưu `attention_event`; thông báo nhân viên `staff_notification` + SSE ở R2, Web Push R3 | ARC | BE-ARC-06 |
| 2026-10-16 | 1 | Idempotency: khóa trong cùng giao dịch, kiểm trước `If-Match`; `dryRun` không cần khóa; header khai `required: false`, middleware trả 428; lỗi khóa lạc quan là 412 | ARC | BE-ARC-11, -12; QA #3 |
| 2026-10-16 | 1 | [GIẢ ĐỊNH – đội tự chốt] Mọi phép tính giá dùng giá đêm niêm yết đã làm tròn đã lưu; làm tròn điểm giữa lên theo trị tuyệt đối | ARC (DOM xác nhận ví dụ BR-107) | BE-ARC-15 |
| 2026-10-16 | 1 | Bản ghi xung đột OTA lưu ở `overbooking_incident` mở rộng (không thêm bảng `booking_conflict`); lễ tân gán căn bằng `assignRoom` (B7a), đổi chéo bằng `swapRoom` (EXCLUDE DEFERRABLE) | ARC | INT, PO, BE-ARC-08 |
| 2026-10-16 | 1 | Webhook một họ đường dẫn `/v1/webhooks/{provider}/{propertySlug}` (+ GET VNPay); payload kênh chỉ lưu bản lọc allowlist, xóa sau 90 ngày | ARC (khớp INT, SEC) | SEC-ARC-08, -09 |
| 2026-10-16 | 1 | Gói nội bộ ESM xuất kép ESM/CJS qua `exports`; `services/api` build CJS `moduleResolution: Node16`; Node ≥ 22.12 | ARC | ARC tự nhận, FB-R1-ARC-OPS-01 |
| 2026-10-16 | 1 | Nhật ký `audit_event`, `c3_access_log`, `state_transition` phân vùng theo tháng ngay từ R2; `reservation_change` là nguồn lịch sử chỉ số (giữ theo T08) | ARC | BE-ARC-18, DATA-ARC-05 |
| 2026-10-16 | 1 | ARC chấp nhận ước lượng BE R2 ≈ 20–25 tuần-người (thay 9–11); phạm vi xử lý theo phân xử ORC + ESC-012 | ARC | BE-ARC-16 |
| 2026-10-16 | 1 | API 0.2.0-draft: đổi phá vỡ so với 0.1 (verify khách, cookie `__Host-`, webhook, `codeHint`, `AllowedAction`, `CancelReasonCode`, `approveRequest`) – báo MOB/FE/BE/INT; R2 code theo 0.2 | ARC | Skill ARC "không đổi contract mà không báo" |
