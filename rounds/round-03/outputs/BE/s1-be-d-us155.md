# BE-D – Round 3, Sản xuất (v1.0): US-155 "Yêu cầu đặt phòng từ website" đưa lên `main`

- Vai: BE (luồng BE-D) | Ngày: 24/10/2026 | Bước: Sản xuất | Nhánh `be-d/r3-us155-v1` (từ `origin/main` 91de0e7 – đã có BE-B 0085), **chưa push**.
- Căn cứ: decision-log 24/10 "INV – US-155 vào v1.0" (dòng cuối); báo cáo cũ `git show a01c774:rounds/round-03/outputs/BE/s1-be-d.md` (nhánh `worktree-agent-adbe3fc764beff1f5`, 3 commit f474538, 1feb0c1, a01c774). Phần nghiệp vụ, hợp đồng, giả định của US-155 giữ nguyên như báo cáo cũ mục 1.2 – 1.3 và 3; tệp này chỉ ghi phần **đã đổi** khi đưa lên `main`.

## 1. Đã làm

### 1.1 Đưa US-155 sang `main`, bỏ T13
- Cherry-pick f474538 + 1feb0c1 (không lấy a01c774 – chỉ là báo cáo). Mọi phần **T13 (R3-Q15)** bỏ, lấy bản của `main` (đã gộp ở 0083 – 8e0b08c): `schema/guest-requests.ts`, `guest-portal/public/guest-request-jobs.ts`, `guest-requests.service.ts`, `housekeeping/public/guest-request-text-purge.ts`, `test/integration/guest-request-t13-r3-bed.test.ts`, `guest-portal-boundaries.test.ts`, đăng ký job T13 trong `worker.ts`, khóa `retention.guest_request_months`, cột `note_purged_at`, chỉ mục và CHECK `guest_request_declined_other_check`.
- Xung đột đã gộp tay (giữ cả hai phía): `frontdesk.ts` (kind 0082 `foc_stay_total_exceeded` + 5 kind US-155), `events.service.ts` (nguồn "Cần chú ý" `foc_stay_total_exceeded` + `website_request_new`), `worker.ts` (bộ gửi e-mail INT + job public-site), `platform.controller.ts` (`StrongReauthService` S2 của R3-Q51 + `ParameterHooks`; `receivingAccountChanged()` của main + `hook.after`).
- **Thêm nhỏ**: `cancelScheduledParameter` cũng gọi `hook.after` của khóa có hook (hủy lịch bật/tắt form → `public_booking_toggled` cho OWN + MGR, xóa cache). Trước đây chỉ `setParameter` gọi; route hủy lịch (0084) chưa có lúc viết nhánh cũ.

### 1.2 Migration `0086_public_site_us155`
- Thay `0079_public_site_t13` của nhánh cũ. Số 0086 theo ORC; **BE-B 0085 đã gộp `main` (5b282db) trong lúc làm** → nhánh đã rebase lên 91de0e7: journal `idx 62`, `when` = 0085 + 2 s (1792782161681), snapshot `0086_snapshot.json` `prevId` = id của 0085 (`b310990a…`). **ORC không cần đổi số/chuỗi.**
- Cách tạo: `drizzle-kit generate` từ schema `.ts` (phần DDL – đã so khớp từng ký tự giữa bản sinh trên 0084 và bản sinh lại trên 0085), phần viết tay giữ từ nhánh cũ: FK chéo module, RLS + GRANT, hàm `public_resolve_property`, catalogue (9 khóa bảo mật + 7 khóa `web_request_*`; **bỏ** `retention.guest_request_months` vì đã ở 0083).
- CHECK viết lại = tập trên `main` + giá trị mới (chỉ thêm – ARC S1-09):
  - `staff_notification_kind_check`: 29 kind của 0082 + `website_request_new`, `website_request_cap_reached`, `website_request_overdue`, `website_request_linked_hold`, `public_booking_toggled`;
  - `staff_notification_ref_type_check` + `website_booking_request`; `purge_journal_action_check` + `delete_row`; `idempotency_key_principal_type_check` + `public_site`.
  - Test mới `test/be-d-r3-s1-units.test.ts` "0086 CHECK lists = previous list + US-155 values only": với mỗi CHECK, tập của 0086 = tập của migration gần nhất trước đó viết CHECK đó ∪ đúng các giá trị US-155 (không mất, không thêm lạ). Test chung `money-limit-basis-architecture.test.ts` (CHECK mới nhất = `STAFF_NOTIFICATION_KINDS`, chỉ thêm) vẫn xanh.
- Ghi chú tham chiếu "0079" trong mã/test của US-155 đổi thành "0086"; OpenAPI chỉ đổi dòng chú thích `x-security-parameters` ("Bật 24/10 … migration 0086").

### 1.3 Công tắc form – giữ TẮT
- `public_booking_requests_enabled` mặc định `false` (catalogue 0086). OWN bật khi thiếu `privacy_notice_version` vi/en hoặc khóa ký → 422 `PUBLIC_FORM_NOT_READY` + `missing[]`; MGR → 403. Ca tích hợp "OFF by default" và "switch ON needs the published notices" vẫn xanh.

### 1.4 `createReservation.websiteBookingRequestId` (B2) – đã nối
- Hợp đồng 0.3.7 bổ sung 2 (đã có từ trước, không đổi): FD+ tạo đơn đảm bảo cho yêu cầu từ website.
- `reservations.service.ts` `create()`: đọc `websiteBookingRequestId`; kênh khác nhóm `direct` → 422 `NOT_ALLOWED` (`field` = `websiteBookingRequestId`); `directSource` khác `website` → 422 `NOT_ALLOWED` (`field` = `directSource`); vắng `directSource` → `website`. Sau kiểm tra bán được: yêu cầu không có → 404, đã đóng (`declined`/`spam`/`converted`) → 409 `INVALID_TRANSITION`. INSERT ghi `direct_source = website`, `direct_sub_source` = `subSource` của yêu cầu. Sau `state_transition` B2 gọi `WEBSITE_REQUEST_PORT.markConverted` (khóa yêu cầu sau đơn – thứ tự 16.19): yêu cầu → `converted` + xóa C2 cùng giao dịch; nếu yêu cầu vừa bị người khác đóng giữa chừng → 409, cả giao dịch hủy.
- `createReservation` chỉ FD+ (`x-roles`), nên mọi yêu cầu của cơ sở đều trong phạm vi; không cần nhánh SAL.
- Ca tích hợp mới trong `public-site-r3-bed.test.ts`: 422 hai trường hợp, 404, 201 với `website` · `facebook`, yêu cầu `converted` + `converted_by` + C2 (`guest_name`, `phone_e164`, `contact_hmac`) NULL, đơn thứ hai cho cùng yêu cầu → 409.
- "Trong `rooms[]` của đơn nhóm → 422": thao tác nhóm trên `main` không nhận trường này (schema đóng) – không cần mã thêm.

## 2. Kết quả kiểm tra (Postgres 17 riêng `bed2-pg`, cổng 127.0.0.1:56640, DB mới, sau rebase lên 91de0e7)
| Lệnh | Kết quả |
|---|---|
| `pnpm db:migrate` (ottimo_migrator → SET ROLE ottimo_owner), DB trống tới 0086 | OK |
| `vitest run` toàn bộ `services/api` | 125 tệp pass, 2 skip, **1 tệp đỏ có sẵn trên `main`** (dưới); 3.194 ca pass, 19 skip |
| `test/integration/public-site-r3-bed.test.ts` | 19/19 (18 ca cũ + ca B2 `createReservation` mới) |
| `test/be-d-r3-s1-units.test.ts` (gồm 4 ca CHECK mới) + `money-limit-basis-architecture.test.ts` | 36/36 |
| `tsc --noEmit` api · `eslint services/api` · `prettier --check services/api docs/api/openapi.yaml` | 0 lỗi |
| `drizzle-kit generate` (như CI) | "No schema changes" – không sinh tệp |
| `gen-openapi-meta --check` · api-client `gen.mjs --check` · `gen_rbac_cases.py --check` · `gen_traceability.py --strict` | up to date · up to date · OK (mismatch []) · exit 0 |

**Lỗi có sẵn trên `main`, không do nhánh này (báo ORC – giao chủ tệp sửa):** `test/integration/production-bootstrap.test.ts` > "fresh empty database" đỏ: `src/admin/production-defaults.ts:291` `door_code_min_digits` có `status: 'INV-19/10+SEC'` – dấu `/` vi phạm CHECK `config_parameter_status_label_check` (`^[A-Z0-9-]{1,16}(\+[A-Z0-9-]{1,16}){0,3}$`). Đưa vào ở 309822b (DOM production defaults). Hậu quả: **lệnh bootstrap production sẽ dừng** ở dòng tham số này. Sửa một chữ (ví dụ `INV-1910+SEC`); nhánh này không chạm `src/admin`.

Ghi chú: `gen_traceability.py` chạy lại làm đổi `docs/qa/traceability.md` ở các dòng không thuộc US-155 (`cancelScheduledParameter`, `createManagerConfirmation`, AC dời R3 của US-007/021/031/109/110) – lệch sẵn có trên `main`, không do nhánh này; đã trả tệp về như `main`, QA/ORC sinh lại khi tiện.

## 3. Giả định
- Giữ nguyên 5 giả định của báo cáo cũ mục 3 (trừ giả định 1 về T13 – đã thuộc 0083).
- [GIẢ ĐỊNH – ARC] `cancelScheduledParameter` gọi `hook.after` như `setParameter` (thông báo `public_booking_toggled` khi hủy lịch).
- [GIẢ ĐỊNH – ARC] `createReservation` với yêu cầu đã đóng giữa lúc kiểm và lúc ghi → 409 cho cả request (không tạo đơn "mồ côi" nguồn `website` không gắn yêu cầu).

## 4. Việc còn lại / cho vai khác
- **ARC**: `notePurgedAt` **chưa có** trong `openapi.yaml` (`GuestRequest`, `GuestRequestForGuest`) – server (T13 trên `main`) đã trả, serializer đang bỏ. Không thêm vào hợp đồng ở nhánh này theo chỉ thị; ARC thêm rồi BE chỉ cần sinh lại meta. Các việc ARC khác của báo cáo cũ mục 4 (erd 4.6 `delete_row`, T19, mức `critical`, mã WR8, ADR-001 `ParameterHooks`) vẫn mở.
- **ARC + SEC**: review nhánh này (bắt buộc theo decision 24/10), trọng tâm: 0086 (RLS, hàm SECURITY DEFINER, CHECK hợp), `platform.controller.ts` (gộp S2 + hook), `createReservation` B2 + WR6.
- **QA**: E2E US-155 (form → Desk S35 → báo giá/giữ chỗ hoặc đơn đảm bảo) trên stack có `LANDING_BASE_URL` + `PUBLIC_FORM_SIGNING_KEY`; ca B2 mới.
- **BE-A**: migration US-164 (`manager_confirmation_*`) phải mang hợp hai danh sách kind (test CHECK của BE-D và test chung sẽ đỏ nếu thiếu).
- **OPS**: như báo cáo cũ – `LANDING_BASE_URL`, secret `PUBLIC_FORM_SIGNING_KEY_FILE`, bước phát hành landing ghi `privacy_notice_version` trước khi OWN bật form (bật cùng ngày Desk production – INV 24/10).
- **BE-C**: `online_checkin.arrival_note` đã xóa theo T13 ở 0083 (SEC BED-01/02) – mục cũ đã xong.
- Còn treo từ báo cáo cũ: bộ đếm RAM bước 0 theo tiến trình (đúng với 1 replica); US-164 thông báo/SSE chưa làm.

## 5. Tệp tạo / sửa (so với `main` 91de0e7)
Tạo: `product/services/api/src/modules/public-site/**`, `src/db/schema/public-site.ts`, `src/db/migrations/0086_public_site_us155.sql`, `src/db/migrations/meta/0086_snapshot.json`, `src/modules/platform/public/parameter-hooks.ts`, `test/be-d-r3-s1-units.test.ts`, `test/integration/public-site-r3-bed.test.ts`, tệp báo cáo này.
Sửa: `product/.env.example`, `product/docs/api/openapi.yaml` (9 khóa `x-security-parameters` bỏ dấu chú thích), `src/generated/openapi-meta.ts`, `src/config.ts`, `src/worker.ts`, `src/modules/feature-modules.ts`, `src/db/migrations/meta/_journal.json`, `src/db/schema/{crypto,frontdesk,index,infra,reservations,sales}.ts`, `src/modules/events/public/events.service.ts`, `src/modules/crypto/public/crypto.service.ts`, `src/modules/identity/public/staff-directory.ts`, `src/modules/platform/{platform.module.ts,internal/platform.controller.ts,public/parameter.service.ts}`, `src/modules/reservations/{public/sales-port.ts,internal/sales-port.adapter.ts,internal/reservations.service.ts,internal/reservation-store.ts,internal/reservation-dto.ts}`, `src/modules/sales/internal/{quotes.controller.ts,quotes.service.ts}`, `src/shared/http/{auth.guard.ts,csrf.ts}`, `src/shared/openapi-types.ts`, test `be-d-s4-units`, `config`, `integration/architecture`, `integration/schema-parity`.
