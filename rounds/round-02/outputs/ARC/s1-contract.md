# ARC – Round 2, Sprint 1: gom đề nghị hợp đồng E03–E06 → OpenAPI 0.3.3-draft (chuẩn bị Sprint 3)

- Vai: ARC | Ngày: 16/10/2026 | **Không commit** | **Không sửa mã** `product/services/api` (chỉ sinh lại tệp `src/generated/*` bằng công cụ)
- Đầu vào: `specs/EP03-05-stay.md` mục 7 (E03-01…E05-08), `specs/EP06-registration.md` mục 9 (E06-01…E06-11), `outputs/SEC/w1-review.md` mục 4 (P-R2-4 ĐK-1…6), `state-machines.md` (SM-01 B9/B9a, SM-05, SM-12), `rbac-matrix.md` (A11, A12, A16, A33, A37, A46, A70, S33)
- Kết quả: OpenAPI **0.3.2-draft → 0.3.3-draft** (chỉ thêm và sửa; không đổi/xóa đường dẫn hay trường cũ), erd **0.3.3**, architecture mục 9 thêm J24
- Phiên bị ngắt giữa chừng (ORC báo): trước khi sửa đã kiểm lại `openapi.yaml` vẫn là 0.3.2-draft, hợp lệ, chưa có sửa dở.

## 1. Bảng đề nghị → xử lý

Ưu tiên ORC: **E05-02, E05-03, E06-01** – xong đủ.

| # | Đề nghị BA | Xử lý | Vị trí |
|---|---|---|---|
| E03-01 | Điều kiện `document_check_block`, `warnings[]`, `documentBlockOverride` | **Xong.** `CheckInPreview.conditions[].code` thêm `document_check_block` (= `Registration.blocksDoorCode`, `overridableBy` FDL+); `CheckInPreview.warnings[]` 4 mã (tập mở); `checkIn.documentBlockOverride{reason}` – chỉ FDL+, FD → 403; `blocksDoorCode` ghi rõ R2 dùng để chặn B9. Câu hỏi DOM Q-D1 | `previewCheckIn`, `checkIn`, `CheckInPreview`, `Registration` |
| E03-02 | `expectedSurchargeVnd` | **Xong**, dùng **mã riêng** `409 SURCHARGE_CHANGED` (+ `surchargeVnd` mới) thay vì `INVALID_TRANSITION` (trạng thái đơn không sai, chỉ số tiền đổi). Bắt buộc khi `apply*Surcharge=true` | `checkIn`, `setLateCheckout`, `checkOut`; bảng mã lỗi |
| E03-03 | 202 + `checkin_room_not_ready` | **Xong.** `checkIn` 202 → `ApprovalRequest`; gọi lại với `roomNotReadyOverride.approvalRequestId` (yêu cầu `approved`, cùng đơn, cùng ngày nghiệp vụ) | `checkIn` |
| E03-04 | `cardsIssued`, `houseRulesSent` | **Xong.** Body: `cardsIssued` 0–2 (giả định BA – DOM Q-D2), `houseRulesSent` `const: true`; cả hai `required` (chặt hơn – chưa có client/BE cài `checkIn`). `Reservation.cardsIssued`, `houseRulesSentAt` (FD+) | `checkIn`, `Reservation`; erd 4.5 |
| E03-05 | B9a thêm đêm trước | **Xong.** `addPriorNight`, `priorNightRateVnd`; `x-transition: [B9, B9a]` (event `check_in_add_prior_night` đã có ở state-machines); `CheckInPreview.priorNight{date, available, defaultRateVnd, floor, ceiling, createsChildReservation}`; 409 `ROOM_UNAVAILABLE` + `suggestions[]` có ví dụ; sửa mô tả `addsPreviousNight` (B9a, không phải B7) | `checkIn`, `CheckInPreview` |
| E04-01 | Gia hạn: giới hạn, cảnh báo thị thực, đơn HĐ ngoài | **Xong.** Mã trường `EXTENSION_LIMIT_EXCEEDED`; `visaWarningAckReason` + cảnh báo `VISA_EXPIRES_BEFORE_DEPARTURE` ở `extendStay`, `updateReservation` (`ReservationPatch`), `moveReservation` (thêm 422). **Chốt** đơn `externalContract=true`: không giới hạn BR-421, không sinh dòng `room`, gửi `nightlyRates` → 422 `NIGHTLY_RATES_NOT_ALLOWED` (từ chối rõ ràng thay vì lặng lẽ bỏ qua) | `extendStay`, `ReservationPatch`, `moveReservation` |
| E04-02 | Trả muộn | **Xong.** Mã trường `LATE_CHECKOUT_AFTER_LIMIT`; `requestApproval` → 202 `late_checkout_conflict`; **mặc định `applySurcharge` đổi `true → false`** (BR-414); thêm 412/422 | `setLateCheckout` |
| E04-03 | Giá sửa được, hư hỏng ngoài bảng, bằng chứng | **Xong.** `ChargeCatalogItem.priceEditable`; `FolioLineCreate.proposedUnitPriceVnd` → dòng `pending_approval` + `damage_pricing`; mã trường `PRICE_NOT_EDITABLE`, `EVIDENCE_REQUIRED` | `addFolioLine`, schema |
| E05-01 | Ảnh biên nhận | **Xong.** `PaymentCreate.attachmentId` (attachment `deposit_receipt` cùng cơ sở) + `Payment.attachmentId`, `note` | schema; erd 4.6 |
| **E05-02** | VietQR `pending → succeeded` + quy tắc hết hạn | **Xong.** Operation mới **`confirmPaymentReceived`** `POST /v1/properties/{propertyId}/payments/{paymentId}/actions/confirm-received` (FD+; SAL chỉ cọc đơn mình như A33 M): chỉ `vietqr` + `pending` + chưa quá `expiresAt`, khóa hàng + `Idempotency-Key`, ra `succeeded` với `reconciliation=pending`, ghi `confirmedAt/By`. **ARC chốt vòng đời**: một QR chờ/folio (QR mới làm QR cũ `expired` trong cùng giao dịch, UK một phần ở erd); `expiresAt` = mốc đổi ngày nghiệp vụ kế tiếp; job **J24 `payment.expire`**; tiền về sau hạn → `recordPayment`. `createVietQr` trả thêm `expiredPaymentIds`, 422 `AMOUNT_EXCEEDS_BALANCE` (giả định BA – DOM Q-D4) | đường dẫn mới; `createVietQr`; erd 4.6; architecture J24 |
| **E05-03** | `listPayments`, `SELF_RECONCILE_FORBIDDEN`, ghi chú khi `disputed` | **Xong.** Operation mới **`listPayments`** `GET /v1/properties/{propertyId}/payments` (lọc `reconciliation` mặc định `pending`, `receivedFrom/To` ngày nghiệp vụ ≤ 92 ngày → `DATE_RANGE_TOO_LONG`, `recordedBy`, `method`, `status`; con trỏ; sắp xếp chờ lâu nhất trước); dòng `PaymentListItem` (+ `hasAttachment`, `pendingDays`, `reconcileOverdue` theo `bank_reconcile_alert_days`). FD/FDL/SAL `x-scope: own`. `reconcilePayment`: `x-rbac: [A46]`, 403 `SELF_RECONCILE_FORBIDDEN` (người đã ghi **hoặc** đã xác nhận thấy tiền, trừ OWN), `note` bắt buộc khi `disputed` (`REASON_REQUIRED`), thêm 401/412/422; `Payment.version` để `If-Match` | đường dẫn mới; `reconcilePayment`; `Payment` |
| E05-04 | Minibar | **Xong.** Mã trường `MINIBAR_ITEMS_INCOMPLETE`, `MINIBAR_QTY_OVER_STANDARD`; operation mới **`getMinibarStandard`** (tủ chuẩn + bản kiểm gần nhất trong ngày; giá vắng với HK); `409 MINIBAR_NOT_CHECKED` cho `checkOut`; **chốt** kiểm lần hai = thay bản cũ, đảo dòng cũ bằng bút toán, `MinibarCheck.replacesCheckId` | `recordMinibarCheck`, `checkOut`, đường dẫn mới; erd 4.6 |
| E05-05 | Bill | **Xác nhận và ghi rõ**: `locale` do server quyết (BR-009/ngôn ngữ hồ sơ; `Accept-Language` không đổi ngôn ngữ bill); `usdReference.totalUsd` `multipleOf: 0.1`; dòng FOC đã duyệt ngay dưới dòng gốc (`relatedLineId`), dòng chờ/bị từ chối không in | `getBill`, `Bill` |
| E05-06 | DOM | Không thuộc ARC – chuyển DOM (xem mục 3) | – |
| E05-07 | UXD | Không thuộc ARC. **Chuỗi mới cho mã ARC thêm**: `error.SURCHARGE_CHANGED`, `error.MINIBAR_NOT_CHECKED`, `error.SELF_RECONCILE_FORBIDDEN`, `error.CONSENT_CHANGE_NOT_ALLOWED`, `error.ONLINE_CHECKIN_CLOSED`, `field_error.*` cho các mã trường mới | – |
| E05-08 | QA | Không thuộc ARC. Gợi ý thêm ca: một QR chờ/folio (tạo QR thứ hai song song), `confirm-received` sau `expiresAt`, tự đối soát của người xác nhận | – |
| **E06-01** | Kết quả đối chiếu 3 trạng thái | **Xong.** Schema mới `DocumentCheckResult` = `pass · fail · unverified · not_applicable` (`ok`, `warning` giữ trong enum nhưng **deprecated** – server 0.3.3 không trả, để không phá trình đọc cũ); `checks[]` thêm `blocking`, `manualResult`, `handledByName`, `handledAt`; `DocumentCheckCode` thêm `passport_valid_at_arrival`, `visa_valid_at_arrival`, `entry_record_present`; `GuestDocumentInput.noEntryRecord` (C3, D05; cũng ở `GuestDocumentSensitive`); `completeRegistrationReview.warningNotes[].manualResult`. **Thêm operation `recordDocumentCheck`** `PUT …/documents/{documentId}/checks/{checkCode}` để kết quả kiểm tay có hiệu lực **trước B9** (B9 chỉ cần khai báo ≥ `partial`, chưa cần K5) – tính lại `blocksDoorCode` cùng giao dịch. Giả định ARC: `unverified` ở 3 mục (c) cũng `blocking` (DOM/SEC Q-D3) | schema; `completeRegistrationReview`; đường dẫn mới; erd 4.7 |
| E06-02 | Rút đồng ý tại quầy (ĐK-5) | **Xong.** `recordImageConsent` mô tả append-only; `granted → refused` luôn được (đã `confirmed` → xóa ngay cùng giao dịch); `refused → granted` khi ảnh đã xóa → `409 CONSENT_CHANGE_NOT_ALLOWED`; `Registration.imagesPurgeScheduledAt`, `documents[].imagePurgeAt`; thêm 409/422 | `recordImageConsent`, `Registration` |
| E06-03 | Khai báo `mixed`, nhật ký sao chép | **Xong.** `getPortalData?kind=` (bắt buộc khi `mixed`); `mark-sent` nhận `kind`; `Registration.portalReferences[]`; `sent` khi đủ mọi khối (giả định ARC – BA Q-B2). **Chốt nhật ký**: mỗi lần lấy dữ liệu = 1 dòng `view`, không có endpoint báo từng lần sao chép (SEC Q-S3) | `getPortalData`, `transitionRegistration`; erd 4.7 |
| E06-04 | Sau khi xóa ảnh | **Xong.** `Registration.imagesPurgedAt`, `imagesPurgeReason`; `getDocumentImage` sau xóa → 404 (DEK đã hủy ánh xạ thành 404, không 500); `imageIds` rỗng | `getDocumentImage`, `Registration`, `GuestDocumentMasked` |
| E06-05 | Mã trường, alpha-3 | **Xong.** `DOC_NUMBER_INVALID`, `MAIN_GUEST_DUPLICATE`, `ENTRY_DATE_FUTURE`, `CHECK_NOTE_REQUIRED`, `PORTAL_REFERENCE_REQUIRED`; `GuestDocumentInput.nationalityCode` pattern `^[A-Z]{3}$` (chặt hơn – chưa có client) | bảng mã trường; schema |
| E06-06 | Guest-web mức 1 – **cần SEC duyệt (ĐK-2)** | **Đã viết vào hợp đồng, gắn cờ `x-sec-review: pending-DK2`**: BE **không cài** phần này trước khi SEC duyệt. Chi tiết mục 2 | `updateOnlineCheckin`, `completeOnlineCheckin`, `OnlineCheckin`, `Registration.onlineCheckin` |
| E06-07 | Tải lại = thay thế; mã lỗi tệp | **Xong.** Mô tả `uploadGuestDocument`: cùng `personIndex` → ảnh cũ xóa (hủy DEK + `purge_journal`) cùng giao dịch; `errors[].code` `FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES` (cũng cho `addGuestDocument`, `uploadAttachment`) | guest-portal, bảng mã trường |
| E06-08…11 | DOM, SEC, UXD, QA | Không thuộc ARC – E06-09 (SEC) gộp vào câu hỏi mục 3; QA E06-11 nên thêm vào test ĐK-2 các khóa mới của `OnlineCheckin` | – |

### 1b. Gộp thêm theo tin ORC (BE-A, UXD)

| Nguồn | Yêu cầu | Xử lý |
|---|---|---|
| BE-A | `FocRequestInput` thêm `authMethod`/`secret` cho FD tự áp FOC minibar (US-007 AC6) | **Xong** – không bắt buộc; gửi khi yêu cầu đủ điều kiện tự áp (BR-436), thiếu → đi luồng duyệt thường; sai → `401 REAUTH_FAILED`. Áp cho cả `requestFoc` và `requestFocForSurcharge` của `checkIn`/`setLateCheckout` (dùng chung schema). `ApprovalRequest` thêm `targetType`, `targetCode`, `selfApplied` (để serializer theo schema không lọc mất trường BE đang trả) |
| BE-A | erd `approval_request.target_code`, `limit_basis_vnd`, `self_applied`; `audit_event.entity_code` | **Xong** – erd 4.3, 4.6 khớp migration 0006 (cả 2 CHECK của `self_applied`) |
| BE-A | `DATE_RANGE_TOO_LONG` vào `FieldError.code` | **Đã có** (thêm cùng E05-03) |
| BE-A | `AuditEvent.entityId` cho phép text | **Xong** – nới `Uuid` → chuỗi (không phá: mọi UUID vẫn hợp lệ); mô tả `entityCode` |
| BE-A | If-Match lệch → `412 VERSION_CONFLICT` | Đã có – không đổi |
| UXD | Kết quả kiểm giấy tờ thêm fail/unknown (E06-01) | **Xong theo tên của BA**: `fail` + `unverified` (= "Chưa kiểm được"/"unknown" của UXD). Không thêm `unknown` để tránh hai tên cho cùng một nghĩa – UXD map nhãn `checkin.verify.*` vào `unverified` |
| UXD | Liệt kê giao dịch "chờ đối soát" toàn cơ sở (E05-03) | **Xong** – `listPayments`: OWN/MGR toàn cơ sở; FDL/FD/SAL chỉ của mình (Q-B1) |
| UXD | Chỗ lưu "đã giao mã/thẻ" ở R2 (ô tick, không lưu mã) | **Đề xuất trường** `checkIn.doorAccessHandedOver` (bool, không bắt buộc, mặc định false) → `Reservation.doorAccessHandedOverAt` (+ người, erd). Không lưu mã cửa. **Câu hỏi PO Q-P1**: có bắt buộc tick trước khi hoàn tất B9 không |

Thêm ngoài đề nghị (để khớp đặc tả/bảng trạng thái): `checkIn` khai `x-requires-trusted-device: true` (SM-01 B9 "thiết bị được cấp", rbac 8.7 A11 Q – BA EP03-05 1.1 đã ghi `403 DEVICE_NOT_TRUSTED`); `completeRegistrationReview` thêm `x-rbac: [A70]`, 412/422.

## 2. E06-06 và ĐK-1…6 của SEC – để SEC review

| ĐK | Ảnh hưởng của 0.3.3 |
|---|---|
| ĐK-1 | **Không đổi**: không đụng `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode`, `openGuestSession` |
| ĐK-2 | **Có thay đổi – chờ SEC**: (a) `OnlineCheckin` thêm 3 thuộc tính **mức 1** `noticeAccepted` (bool), `lateArrival` (bool), `deferredPeople` (mảng chỉ số người) và giá trị enum `currentStep=notice` – không chứa tên, số giấy tờ, ảnh, mã cửa; (b) request `updateOnlineCheckin` thêm `noticeVersion`, `lateArrival`, `arrivalNote` (**writeOnly** – không bao giờ trả lại app khách; chỉ Desk đọc qua `Registration.onlineCheckin`); (c) `completeOnlineCheckin` nhận body `deferredPeople`. `GuestStay`, `GuestRequest` **không đổi**; `guestFullName`, `doorCode` không đổi (vẫn `x-guest-level: 2`) |
| ĐK-3 | Không trả lại ảnh/loại/số giấy tờ: `uploadGuestDocument` vẫn chỉ trả chỉ số người; tải lại thay ảnh cũ ở server – client không cần giữ gì |
| ĐK-4 | Không đổi (token, hết hạn, sau trả phòng 403) – thêm `409 ONLINE_CHECKIN_CLOSED` cho 4 operation ghi của check-in online |
| ĐK-5 | Hỗ trợ đủ: `recordImageConsent` cho ghi đè `granted → refused` tại quầy, xóa ngay nếu đã `confirmed` |
| ĐK-6 | Không thêm gì mức 2 vào app khách |

## 3. Câu hỏi cho DOM / SEC / BA (ARC không tự chốt chính sách)

| # | Gửi | Câu hỏi | Hợp đồng đang dùng |
|---|---|---|---|
| Q-D1 | DOM | (= E05-06 c) R2 chặn **nhận phòng** (B9) thay cho "chặn giao mã cửa" (BR-613 c, BR-402 (3)) – có đúng thực tế quầy không? | Chặn B9, FDL+ bỏ qua có lý do (giả định BA) |
| Q-D2 | DOM | (= E05-06 a) Tối đa thẻ phòng 2/đơn hay 2/người? | `cardsIssued` 0–2 (nới sau không phá) |
| Q-D3 | DOM + SEC | Mục BR-613 (c) **chưa kiểm được** (thiếu ngày hết hạn/dấu nhập cảnh) có chặn nhận phòng tới khi lễ tân kiểm tay "Đạt" không? | Giả định ARC: **có** (`blocking=true`) – an toàn mặc định; đổi chỉ là đổi giá trị cờ, không đổi hợp đồng |
| Q-D4 | DOM | (= E05-06 d) Chặn VietQR vượt số còn phải thu? | Mã `AMOUNT_EXCEEDS_BALANCE` có sẵn; server bật theo giả định BA |
| Q-D5 | DOM | QR VietQR chờ hết hạn ở mốc đổi ngày nghiệp vụ (06:00) – có xung đột với thói quen quầy (khách chuyển khoản muộn, hôm sau mới thấy)? | Chốt kỹ thuật ARC; tiền về sau hạn vẫn ghi được bằng `recordPayment` |
| Q-S1 | SEC | Duyệt E06-06 theo ĐK-2 (mục 2): 3 thuộc tính mức 1 mới của `OnlineCheckin`, `arrivalNote` chỉ ghi, giá trị `currentStep=notice` | Gắn `x-sec-review: pending-DK2`; BE chưa cài |
| Q-S2 | SEC | `arrivalNote` (văn bản tự do của khách, ≤ 300, lọc số thẻ) nên phân loại C2 và xóa theo T13 như `guest_request.note`? | erd ghi C2, T13 |
| Q-S3 | SEC | Nhật ký dữ liệu cổng: chấp nhận "mỗi lần lấy = 1 dòng `view`", không ghi từng lần bấm sao chép? | Như vậy |
| Q-S4 | SEC | (= E06-09) chỉ hỏi đồng ý cho Khách 1 trên guest-web; chuỗi cấm R2; tự xóa clipboard 60 giây | Hợp đồng không chặn cách nào |
| Q-S5 | SEC | Quy tắc tự đối soát: cấm cả người **xác nhận thấy tiền** (không chỉ người tạo QR) – đủ chặt? | Như vậy |
| Q-B1 | BA | rbac S33: FD ✖, FDL R toàn bộ – nhưng EP03-05 2.4 cho FD/FDL xem giao dịch **của mình**. Cập nhật S33 (và SM-12 dòng `pending → succeeded` thêm SAL cọc của mình như A33)? | `listPayments`: FDL/FD/SAL `own`; `confirmPaymentReceived`: SAL `own_deposit_only` |
| Q-P1 | PO | Ô "Đã giao mã/thẻ" ở R2 có **bắt buộc** khi nhận phòng không (hiện không bắt buộc, chỉ ghi thời điểm/người)? | `doorAccessHandedOver` tùy chọn |
| Q-B2 | BA | Khai báo `mixed`: K6 `sent` khi **đủ mọi khối** có mã? | Như vậy (erd E12) |

## 4. Kết quả kiểm tra (16/10/2026)

| Công cụ | Kết quả |
|---|---|
| `openapi-spec-validator` | OK (0.3.3-draft) |
| `npx @redocly/cli@1.34.21 lint docs/api/openapi.yaml` | **0 lỗi**, 4 cảnh báo (như 0.3.2 – có chủ đích). Lần đầu có 1 cảnh báo ví dụ (dấu phẩy trong chuỗi chưa đặt nháy) – đã sửa |
| Ruby Psych `YAML.load_file` (FB-R2-SEC-ARC-01) | OK |
| `pnpm --filter @ottimo/api gen:openapi` | Ghi lại `openapi-meta.ts`, `openapi-schemas.ts` |
| `pnpm --filter @ottimo/api test` | Lần cuối (sau khi gộp BE-A/UXD): **9 file / 81 ca passed**, 11 file / 428 ca skipped (nhóm cần PostgreSQL – không đặt `DATABASE_URL` để khỏi đụng DB `ottimo_test` BE-A/BE-B đang dùng). Không đỏ |
| `pnpm --filter @ottimo/api typecheck` | 5 lỗi, **đều ở `test/` của BE đang viết dở** (`fastify` types, `possibly undefined`), không có lỗi ở `src/` hay `src/generated/` |
| `python3 product/tests/tools/gen_traceability.py --strict` | **exit 0**: ops mismatched 0, fields mismatched 0, `x-rbac-field` gắn 121 (+4), untagged [] |
| `python3 product/tests/tools/gen_rbac_cases.py` → `--check` | Trước khi sinh: exit 1 (fixture cũ, đúng dự kiến) → sinh lại: **178 operation** (+4), 1.958 ca, rbac mismatch [] → `--check` **exit 0** |
| `pnpm --filter @ottimo/api-client gen` + `test` | Test drift đỏ khi chưa sinh lại (đúng dự kiến) → sinh lại `src/generated/openapi.ts` → 5/5 passed; `admin-web typecheck` OK |

## 5. Ảnh hưởng tới các vai (ARC không sửa mã)

- **BE (Sprint 3)**: 4 operation mới (`listPayments`, `confirmPaymentReceived`, `getMinibarStandard`, `recordDocumentCheck`); migration mới theo erd 0.3.3 (cột `reservation`, `payment`, `minibar_check`, `registration`, `online_checkin`, bảng `registration_portal_submission`, UK một QR chờ/folio); job J24; **chưa cài phần `x-sec-review: pending-DK2`**. Meta mới: `checkIn` có `trustedDevice: true`, `reconcilePayment` có `rbac: [A46]`, `completeRegistrationReview` có `rbac: [A70]`.
- **FE**: màn đối soát (S33), nút "Ghi nhận đã thu" trên QR chờ, xử lý `SURCHARGE_CHANGED` (tải lại preview), hộp B9a, ô số thẻ + nội quy ở bước giao mã, 3 kết quả đối chiếu + nút kiểm tay gọi `recordDocumentCheck`, `applySurcharge` gửi tường minh.
- **MOB (guest-web)**: bước 0 thông báo, `ONLINE_CHECKIN_CLOSED`, mã lỗi tệp – **sau khi SEC duyệt E06-06**.
- **QA**: `rbac-cases.json/.csv` đã sinh lại (+44 ca); test ĐK-2 (E06-11) cần thêm khóa mới của `OnlineCheckin` vào danh sách được phép mức 1 khi SEC duyệt.
- **UXD**: chuỗi cho 5 mã `Problem.code` mới và các mã trường mới (bảng ở info OpenAPI).

## 6. Giả định
- Các trường "bắt buộc mới"/đổi mặc định (`checkIn.cardsIssued/houseRulesSent`, `applySurcharge=false`, alpha-3) là chặt hơn có chủ đích: chưa có BE/FE nào cài các operation này (Sprint 3), đã ghi trong changelog 0.3.3.
- `ok`/`warning` để lại trong enum (deprecated) thay vì xóa – giữ đúng "không phá".
- Không chạy test DB để tránh tranh DB `ottimo_test` với BE đang chạy song song.

## 7. File đã tạo/sửa
- Sửa: `product/docs/api/openapi.yaml` (0.3.3-draft), `product/docs/erd.md` (0.3.3), `product/docs/architecture.md` (mục 9 J24), `01-decisions/decision-log.md` (7 dòng ARC)
- Sinh lại bằng công cụ: `product/services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts`; `product/packages/api-client/src/generated/openapi.ts`; `product/docs/qa/traceability.md`; `product/tests/fixtures/rbac-cases.json`, `.csv`
- Tạo: `rounds/round-02/outputs/ARC/s1-contract.md`
- Không có ESC mới.
