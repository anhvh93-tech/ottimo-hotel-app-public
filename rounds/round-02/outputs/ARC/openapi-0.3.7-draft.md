# OpenAPI 0.3.7 – bản nháp (ARC, 17/10/2026) – áp đầu Sprint 4

- Trạng thái: **NHÁP**. **Không** áp vào `product/docs/api/openapi.yaml` hay `erd.md` lúc này, vì BE đang sửa mã theo 0.3.6 (bổ sung 1–3). ARC áp toàn bộ ở bước khởi động Sprint 4, rồi sinh lại meta/api-client và chạy `--check`/`--strict`.
- Nguồn:
  - SEC `reviews/s3-SEC.md` mục 7 (BUG-R2-033 b – duyệt có điều kiện), PO 17/10 (BUG-R2-033 b chọn A).
  - `outputs/ARC/s3-contract.md` mục 7.5, 7.7 (danh sách 0.3.7 đã xác nhận).
  - FE `s3-report.md` 9.4, MOB `s3-report.md` mục 5, UXD `s3-UXD.md`, BE-A `s3-be-a.md` mục 11 (BUG-R2-038).
- Nhãn trong file: **[SEC]** = điều kiện SEC bắt buộc (không được bỏ khi cài); **[ARC]** = quyết định thiết kế của ARC.

---

## A. Hồ sơ khách "từ giấy tờ" (BUG-R2-033 b) – điều kiện SEC mục 7

### A.1 Mục đích, giới hạn
- **Mục đích**:
  - Gắn người đi cùng chưa có hồ sơ vào đơn khi lễ tân nhập giấy tờ.
  - Phục vụ P01 (thực hiện lưu trú) và P02 (khai báo).
  - Hồ sơ này **không phải hồ sơ CRM**.
- **Số giấy tờ không làm khóa định danh lâu dài** khi người đó chưa đồng ý P05 [SEC F03]. Điểm này SEC đã sửa so với câu gốc của PO.
- **Trường được lưu trên `guest`** khi `source = 'document'` [SEC 7.1]:
  - `code`;
  - `full_name` (tên trên giấy tờ) và `name_search`;
  - `nationality_code` (alpha-3 → alpha-2) và `is_foreigner`;
  - `source`, `crm_consent = 'not_asked'`, `created_by` / `created_at`, `last_stay_checkout_at`.
- **Không bao giờ lưu trên hồ sơ `document` chưa có P05**:
  - ngày sinh, giới tính;
  - số giấy tờ, `id_doc_last4`, `id_doc_hmac`;
  - địa chỉ, thị thực, ảnh;
  - `tags`, `free_note`, `service_notes`, phân khúc.

### A.2 ERD (áp vào `erd.md` mục 4.4 `guest` ở 0.3.7)
| Cột / ràng buộc | Định nghĩa | Nguồn |
|---|---|---|
| `source` | `text NOT NULL DEFAULT 'desk'`, CHECK `source IN ('desk','ota','document','guest_app','import')`. Nguồn tạo hồ sơ: form quầy/sale; nhập OTA; từ giấy tờ khai báo; app khách (R3); nhập dữ liệu cũ (R3) | [SEC] 7.4 BE-B, [ARC] tập giá trị |
| `last_stay_checkout_at` | `timestamptz NULL`. **Lưu cột**, không tính từ đơn, để module `guests` không đọc bảng `reservation` (s3-contract 4.3). Ghi qua cổng `guests/public` `touchLastStay(tx, guestIds[], at)`. BE-A gọi cổng này trong giao dịch B18/B16 cho người đứng tên và mọi người đi cùng có `guest_id` | [SEC] 7.2, [ARC] cách lưu |
| **CHECK 1** `guest_contact_source_check` | `source <> 'desk' OR phone_e164 IS NOT NULL OR email_norm IS NOT NULL OR anonymized_at IS NOT NULL OR merged_into_id IS NOT NULL`. Hồ sơ `document` (và `ota`) được thiếu SĐT/email; `desk` thì không (US-071 AC1, `CONTACT_REQUIRED`) | [SEC] 7.4 |
| **CHECK 2** `guest_id_doc_hmac_consent_check` | `id_doc_hmac IS NULL OR crm_consent = 'granted'` – SEC F03 giữ ở tầng DB. Rút P05 → cùng giao dịch đặt `id_doc_hmac = NULL` | [SEC] 7.4 |
| CHECK 3 (khuyến nghị) `guest_document_minimal_check` | `source <> 'document' OR crm_consent = 'granted' OR (date_of_birth IS NULL AND gender IS NULL AND id_doc_last4 IS NULL AND id_doc_hmac IS NULL AND free_note IS NULL AND coalesce(cardinality(tags),0) = 0 AND coalesce(cardinality(service_notes),0) = 0)`. Hiện thực 7.1 ở DB – lưới cuối nếu cổng tạo hồ sơ có lỗi | [ARC] |
| `id_doc_hmac` (định nghĩa mới, **v1**) | Định dạng `v1:<64 hex>` (CHECK `id_doc_hmac IS NULL OR id_doc_hmac ~ '^v1:[0-9a-f]{64}$'`). Giá trị = `keyedHash('guest_doc', '<loại>|<quốc gia cấp alpha-3>|<số chuẩn hóa>')` = HMAC-SHA256 với khóa con **HKDF-SHA256(`ID_HASH_KEY`, salt rỗng, info `ottimo:guest_doc:v1`)**, cùng cơ chế `child_name` SEC đã duyệt 17/10.<br>• `<loại>` ∈ `passport\|vn_id\|other`; `cccd` và `child_personal_id` → `vn_id`.<br>• `<số chuẩn hóa>` = in hoa, bỏ `[\s.\-/]` (cùng sửa `normalizeDocNumber`, SEC BE-48).<br>• Tiền tố `v1:` để xoay khóa sau này (v2 → tính song song khi đọc).<br>• C3 (SR-KEY-07): không trả qua API, không vào audit/log/outbox.<br>• **Chỉ ghi khi người đó có P05 `granted`**. Không có P05: tính trong bộ nhớ lúc `addGuestDocument` để **so** với hồ sơ đã có P05, rồi bỏ | [SEC] 7.3 |
| `guest_document.doc_number_hmac` | Giữ nguyên (khớp **trong** đơn / khai báo, chống nhập trùng). Khác miền với `id_doc_hmac` nên bảng khai báo lộ ra cũng không nối thẳng được sang CRM. Khi T03 xóa trường khai báo thì xóa luôn cột này | [SEC] 7.3, 7.4 BE-C |
| `crypto` – kiểu `KeyedHashPurpose` | Thêm `'guest_doc'` (cạnh `'child_name'`), info `ottimo:guest_doc:v1` | [SEC] 7.4 ARC |
| Chỉ mục | `guest_id_doc_hmac_uk` UNIQUE (`organization_id`, `id_doc_hmac`) WHERE `id_doc_hmac IS NOT NULL AND merged_into_id IS NULL AND anonymized_at IS NULL`; `guest_document_profile_retention_idx` (`organization_id`, `last_stay_checkout_at`) WHERE `source = 'document' AND crm_consent <> 'granted' AND anonymized_at IS NULL` | [ARC] |

**Migration (BE-B)**: số tiếp theo trong dải BE-B, theo quy tắc 4.2a (sửa snapshot đầu trong cùng PR).
1. Thêm cột `source` với `DEFAULT 'desk'`.
2. Backfill với `NO FORCE` + `DISABLE ROW LEVEL SECURITY` quanh lệnh, theo mẫu 0016 (bài học thẻ FB-R2-ARC-BE-S3-10). Hồ sơ cũ không có SĐT lẫn email → `source = 'ota'`, vì form quầy đã bắt `CONTACT_REQUIRED` từ 0.3.4. Kiểm đếm vi phạm = 0 trước khi bật lại.
3. Thêm CHECK 1–3 dạng `NOT VALID` → `VALIDATE CONSTRAINT`.
4. Thêm khóa danh mục `document_profile_retention_months`.

### A.3 Tham số
| Khóa | Kiểu / biên | Mặc định | Ai sửa | Ghi |
|---|---|---|---|---|
| `document_profile_retention_months` | integer **1–12** | 12 | **Chỉ OWN** – thêm vào `setParameter.x-security-parameters` (biên cứng; test kiến trúc so catalogue ↔ OpenAPI) | Audit `config`. `[GIẢ ĐỊNH SEC – chờ luật sư, câu phụ ESC-001]`. Áp T05 cho hồ sơ `document` chưa P05 |

```yaml
# setParameter.x-security-parameters (0.3.7)
document_profile_retention_months: { type: integer, minimum: 1, maximum: 12, default: 12, ref: 'SEC s3 mục 7.2 / T05' }
```

### A.4 Job ẩn danh (BE-B) – **J25 `guest.document_profile_anonymize`**
- Chạy hằng ngày, theo lô, idempotent theo điều kiện dòng.
- Chọn hồ sơ: `source = 'document'`, `crm_consent <> 'granted'`, `anonymized_at IS NULL`, `last_stay_checkout_at + document_profile_retention_months ≤ now`.
- Xử lý: `full_name`, `name_search` → giá trị ẩn danh (mã); giữ `code`, `nationality_code`, `is_foreigner`; đặt `anonymized_at`; ghi `purge_journal` (`anonymize`, policy `T05`).
- **Bắt buộc có trước khi đưa dữ liệu khách thật vào (cổng ESC-001).** Không bắt buộc để merge Sprint 3. [SEC 7.2]

### A.5 Hồ sơ ra khỏi chế độ "từ giấy tờ"
- Chính người đó đồng ý P05 tại quầy (`consent_record.subject_type = guest`, BR-955; không dùng đồng ý của người đặt):
  - `crm_consent = 'granted'`.
  - Lúc này mới được ghi `id_doc_hmac` (từ giấy tờ của đơn hiện tại) và các trường CRM.
  - Áp T06.
- Hồ sơ được thêm liên hệ hoặc thành người đứng tên → `source` giữ nguyên lịch sử, áp quy tắc CRM như hồ sơ thường (CHECK 3 không chặn vì cần P05 khi có trường CRM).

### A.6 OpenAPI (0.3.7)
```yaml
# components.schemas.Guest + GuestSummary
source:
  type: string
  enum: [desk, ota, document, guest_app, import]
  x-visible-to: [owner, manager, front_desk_lead, front_desk]   # [SEC] FD+ only
  description: 'Nguồn tạo hồ sơ. `document` = hồ sơ tối thiểu từ giấy tờ khai báo (SEC s3 mục 7) – không phải hồ sơ CRM, không có liên hệ, không có trường giấy tờ'
# Guest KHÔNG có trường giấy tờ nào (không idDocLast4, không idDocHmac) – [SEC] 7.4 ARC
```
| Operation | Thay đổi 0.3.7 |
|---|---|
| `searchGuests`, `lookupGuestByContact` | `x-scope` SAL/CTV: loại hồ sơ `source = document` chưa P05 (rbac D10). HK chỉ tên + căn trong ngày, như hiện tại |
| `updateGuest` | Hồ sơ `document` chưa P05: gửi `tags` / `freeNote` / `serviceNotes` / `dateOfBirth` / `gender` → 422 `NOT_ALLOWED`. Thêm liên hệ được phép (ra khỏi chế độ theo A.5) |
| `createGuest` | **Không** tạo được `source = document` qua API (chỉ qua cổng nội bộ A.7). Body không có `source`; server đặt `desk` |
| Xuất / danh sách tiếp thị (R3) | Loại `document` chưa P05 |
| `addGuestDocument` (BE-C) | Không đổi hợp đồng. Phản hồi `GuestDocumentMasked.partyMemberId` như cũ. Cờ "có thể là khách quen" để lễ tân xác nhận: thêm `GuestDocumentMasked.possibleReturningGuest: boolean` (FD+). Khớp tên + ngày sinh với hồ sơ ngoài đơn **không** tự gắn [SEC 7.4 BE-A] |

### A.7 Cổng nội bộ (không phải API)
| Cổng | Chủ | Người gọi | Hàm |
|---|---|---|---|
| `guests/public/document-profile.ts` | BE-B | BE-A (`document-party.port.ts`) | `createDocumentProfile(tx, {fullNameOnDoc, nationalityAlpha3, reservationCode}, actor)` → `guestId`. Chỉ nhận đúng trường A.1. Audit `guest.created` ghi `source` + mã đơn, **không** tên / giấy tờ |
| | BE-B | BE-C (sau khi P05 `granted`) | `setDocumentKey(tx, guestId, idDocHmac)` – ném lỗi nếu `crm_consent ≠ granted` (CHECK 2 là lưới cuối); `clearDocumentKey(tx, guestId)` khi rút P05 |
| | BE-B | BE-A (B18/B16) | `touchLastStay(tx, guestIds[], at)` |
| | BE-B | BE-C (khớp người quay lại) | `findByDocumentKey(tx, idDocHmac)` → `guestId \| null` (chỉ hồ sơ có P05) |
| `crypto/public/crypto.service.ts` | BE-C | BE-C, BE-B | `keyedHash('guest_doc', …)` + hàm tiện ích `guestDocKey({docType, issuingCountry, docNumber})` trả `v1:<hex>` |

**Thứ tự khớp ở BE-A** (`document-party.port.ts`) [SEC 7.4]:
1. Người trong đơn có `doc_number_hmac` khớp, hoặc tên + ngày sinh khớp **trong đơn**.
2. Hồ sơ ngoài đơn chỉ được tự gắn khi khớp `id_doc_hmac`, tức hồ sơ có P05.
3. Không khớp → tạo hồ sơ A.1, gắn `role = companion`, quan hệ `unknown`. Vượt số khách thì vẫn gắn và cảnh báo.
4. Trẻ em không có hồ sơ.

### A.8 Test bắt buộc (SEC kiểm lại)
- CHECK 1/2/3 vi phạm → 23514.
- Hồ sơ `document` không có ngày sinh / số / 4 số cuối / HMAC.
- Tên + ngày sinh khớp hồ sơ ngoài đơn → **không** tự gắn, trả cờ.
- P05 granted → có `id_doc_hmac` dạng `v1:`; rút P05 → NULL.
- SAL/CTV `searchGuests` không thấy hồ sơ `document`.
- J25 với Clock giả: tháng 13 bị ẩn danh, có `purge_journal`.
- Xóa ảnh theo BR-609 rồi nhập lại cùng số trong cùng đơn → 409 `PARTY_DUPLICATE`.

---

## B. Các mục 0.3.7 khác đã xác nhận (s3-contract 7.5, 7.7)

| # | Mục | Hợp đồng nháp | Ai |
|---|---|---|---|
| B-1 | **BUG-R2-038** – thu tiền lúc nhận phòng | `checkIn.payment: PaymentCreate`, cùng quy tắc với `checkOut.finalPayment` (`fieldPrefix 'payment.'`).<br>Thứ tự trong giao dịch: ghi phụ thu nhận sớm / đêm B9a → ghi khoản thu → đánh giá `balance_paid`.<br>`CheckInPreview.amountDueAtCheckinVnd` = còn phải thu + phụ thu sẽ ghi + đêm B9a.<br>Trần `createVietQr` ngày đến = `amountDueAtCheckinVnd`.<br>`balance_paid` gồm phụ thu sắp ghi (BA v0.3 / DOM) | BE-A, BE-B (VietQR), FE (bước thu ở H13) |
| B-2 | `Reservation.availableOperations` | `type: array, items: { enum: [updateReservation.doorAccessHandedOver, addFolioLine, recordCheckoutConfirmation, addPartyMember, removePartyMember] }`. Server tính theo vai × trạng thái; không trộn vào `allowedActions` (chỉ dành cho chuyển trạng thái SM) | BE-A, FE |
| B-3 | `getGuestSession` | `GET /v1/guest/sessions/current`, `x-roles: [guest]`, `x-guest-level: 1`, trả `GuestSession`.<br>Chỉ tên gọi, `no-store`; sau `stayEnded` không có `guestFirstName` / `roomNo`.<br>Tính vào giới hạn phiên / IP như `getGuestStay` (SEC s3 4 b) | BE-C, MOB |
| B-4 | `updateOnlineCheckin.deferredPeople` | Thêm vào thân cập nhật (phản hồi đã có, SEC đã duyệt). Lưu từ bước giấy tờ; `completeOnlineCheckin.deferredPeople` vẫn nhận (ghi đè) | BE-C, MOB |
| B-5 | `ApprovalRequest.requestedById` | `requestedById: Uuid` (FD+ thấy). FE ẩn nút chi khi người xem là người tạo | BE-A, FE |
| B-6 | **`If-Match` cho `approveRequest` loại `refund`** | Thêm `ApprovalRequest.version` + header `ETag` ở `listApprovalRequests` (theo phần tử) và ở `getApprovalRequest` (nếu thêm). `approveRequest` / `rejectRequest` với `type = refund`: `If-Match` **bắt buộc** (thiếu → 428, lệch → 412). Loại khác: tùy chọn | BE-A, FE |
| B-7 | Mốc cuối trả muộn trong `BookingRules` | `BookingRules.lateCheckout: { tiers: [{until: LocalTime, pct}], lastTime: LocalTime, graceUntil: LocalTime }` từ `late_checkout_tiers`, `late_grace_until` (BR-412/416) | BE-A, FE |
| B-8 | `MinibarCheck.checkedByName` | `checkedByName: string` (tên hiển thị) | BE-B, FE |
| B-9 | Lọc đơn theo căn | `listReservations?roomId=Uuid` (đơn có segment trên căn trong khoảng ngày lọc) | BE-A, FE |
| B-10 | Mã còn thiếu | `recordPayment`: 403, 404, 409 `FOLIO_LOCKED`; `reversePayment`: 409, 422. Bỏ `destination` khỏi mô tả `createRefundRequest` | BE-B |
| B-11 | `Payment.receivedAmountVnd`, `Payment.selfReconciled` | Thêm (MGR+ thấy `selfReconciled`; FD+ thấy `receivedAmountVnd` của khoản nộp thiếu) | BE-B, FE |
| B-12 | `getBill?locale=vi_en` | Tham số tùy chọn `locale` (`vi\|vi_en`); mặc định theo BR-009 / ngôn ngữ hồ sơ | BE-B, FE |
| B-13 | Tách category `overpayment_retained` (nếu DATA cần) | Hiện là `deposit_forfeit` + `charge_code = overpayment_retained`. DATA quyết ở Sprint 4 | DATA → ARC |
| B-14 | `room_status` sang module `housekeeping` | Bảng giữ tên; chủ đổi sang housekeeping; frontdesk gọi `RoomStatusPort` | BE-A (Sprint 4) |

**Đã kéo vào 0.3.6 bổ sung 3 – không còn trong 0.3.7**: nguồn Desk cho `currentNoticeVersion` / `imageRetentionDays` (`Registration.consentNotice`); `repricing[].channelFeeSavingsVnd` (BUG-R2-045).

## C. Việc khi áp 0.3.7 (ARC, đầu Sprint 4)
1. Áp A.6 + B vào `openapi.yaml` (`info.version: 0.3.7-draft`, mục changelog), A.2 vào `erd.md` mục 4.4 + lịch sử.
2. Sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client. Chạy `--check`, `gen_rbac_cases` (op mới `getGuestSession` → sinh lại `rbac-cases`), `gen_traceability --strict` (BA điền `operationIds` / `x-rbac-field` cho `Guest.source` – D01 hoặc mã mới nếu BA tách).
3. Báo BE-A / BE-B / BE-C / FE / MOB bằng bảng việc như `s3-contract.md` mục 7.
