# BE-C – Round 2, Sprint 3: crypto, files, registration, guest-portal

- Vai: BE (luồng BE-C, mới) | Ngày: 16/10/2026 | Bước: Sản xuất | **Không commit** (ORC commit) | DB test riêng `ottimo_test_bec`
- Đầu vào: `outputs/ARC/s3-contract.md` (vùng, cổng public, mục 4.2 migration), `outputs/SEC/s3-checklist.md` (B, C, E, G, I), `specs/EP06-registration.md` v0.2, `specs/EP03-05-stay.md`, OpenAPI 0.3.6-draft, ADR-013, `security/security-requirements.md`, BR v0.3.3.

> Mục "Interface" viết sớm (ngày 1) để BE-B dùng ngay cho số tài khoản hoàn (D15, SEC F8); đã cập nhật theo bản cài cuối. Các mục 1–7 ở cuối file.

## Interface (ngày 1 – cổng public cho BE-A/BE-B)

### 1. `CryptoService` – `services/api/src/modules/crypto/public/crypto.service.ts`

Lớp trừu tượng (token DI là chính lớp `CryptoService`, module `CryptoModule` là `@Global`; bản thật `EnvelopeCryptoService implements CryptoService`). Mọi hàm chạy trong **giao dịch của người gọi** (`tx`), rollback thì không còn khóa nào.

```ts
interface FieldAad { table: string; column: string; recordId: string }      // vào AAD
interface DataKeyRequest { purpose: DataKeyPurpose; subjectId: string; expiresAt?: Date }
// DataKeyPurpose: 'guest_document' | 'document_image' | 'door_credential' | 'payee' | 'child_data'
//               | 'mfa_secret' | 'refund_account' | 'push_keys' | 'attachment'
interface DestroyJournal { subjectType: string; subjectId: string; policyKey: string } // purge_journal

abstract class CryptoService {
  createDataKey(tx, req: DataKeyRequest): Promise<string>;                       // id DEK mới
  seal(tx, req: DataKeyRequest & { aad: FieldAad }, plaintext: string | Buffer)
    : Promise<{ dataKeyId: string; ciphertext: Buffer }>;                        // tạo DEK + mã hóa
  encrypt(tx, dataKeyId, aad: FieldAad, plaintext): Promise<Buffer>;             // cột khác cùng bản ghi
  decrypt(tx, dataKeyId, aad, ciphertext): Promise<Buffer>;
  decryptText(tx, dataKeyId, aad, ciphertext): Promise<string>;
  destroy(tx, dataKeyId, journal: DestroyJournal): Promise<boolean>;             // hủy DEK + purge_journal
  isDestroyed(tx, dataKeyId): Promise<boolean>;
  blindIndex(value: string): string;                                             // HMAC-SHA256(ID_HASH_KEY), hex
  keyedHash(purpose: 'child_name', value: string): string;                       // HKDF(ID_HASH_KEY) theo mục đích
  rewrap(tx, limit?): Promise<number>;                                           // xoay KEK (SR-KEY-05)
}
class DataKeyDestroyedError  // DEK đã hủy / không thấy ở cơ sở này → trả 404, không 500
class DecryptionError        // sai AAD / bị sửa
```

Cách dùng cho BE-B (`approval_request.refund_account_enc`, SEC F8 / T09):

```ts
// setRefundDestination – trong uow.run(tx):
const { dataKeyId, ciphertext } = await this.crypto.seal(tx, {
  purpose: 'refund_account', subjectId: approvalId,
  aad: { table: 'approval_request', column: 'refund_account_enc', recordId: approvalId },
}, accountNumber);
// lưu refund_account_enc = ciphertext, refund_account_data_key_id = dataKeyId, last4 riêng (C2)
// getRefundDestination: await this.crypto.decryptText(tx, dataKeyId, sameAad, ciphertext)
// hoàn xong (T09): await this.crypto.destroy(tx, dataKeyId,
//   { subjectType: 'approval_request', subjectId: approvalId, policyKey: 'T09' })
// đổi tài khoản sau khi duyệt: destroy DEK cũ rồi seal mới (một DEK/bản ghi tại một thời điểm)
```

Quy tắc: không module nào khác đọc bảng `data_key` hay biến `DATA_KEK_*`/`ID_HASH_KEY` (test `test/crypto-boundary.test.ts` quét `src/`); cột chứa bản mã đặt hậu tố `_enc`; không đưa bản rõ/bản mã vào log, audit, outbox, SSE, `idempotency_key.response_body` (dùng `uow.run(..., { storeBody: false })`).

Bản giả cho unit test: `services/api/src/modules/crypto/public/crypto.fake.ts` – `new FakeCryptoService()` (cùng hợp đồng, khóa trong RAM, `journal[]` để kiểm hủy). Không dùng trong api/worker.

**Đã nối sẵn vào cổng BE-A/BE-B khai báo trong lúc chờ** (`crypto/public/port-adapters.ts`, `CryptoModule` export toàn cục):
- `REFUND_ACCOUNT_CIPHER` (BE-B `payments/public/refund-account-cipher.ts`) → `RefundAccountCipherAdapter` (DEK `refund_account`; AAD chuỗi của BE-B `approval_request|refund_account_enc|<id>|<v>` được đổi sang AAD trường; `destroy` ghi `purge_journal` policy `T09`). `EphemeralRefundCipher` không còn dùng khi chạy api.
- `FD_CHILD_DATA_PORT` (BE-A `frontdesk/public/ports.ts`) → `ChildDataCipher` (DEK `child_data` mỗi dòng `reservation_guest`, AAD `reservation_guest|child_name_enc|<member id>`, `nameHmac` = `keyedHash('child_name', TÊN|năm sinh)`).

### 2. `C3AccessGate` – `modules/crypto/public/c3-access-gate.ts` (cho `getRefundDestination` của BE-B, mã cửa của BE-A sau này)

```ts
gate.assertStepUp(principal)          // TRƯỚC uow.run: 401 REAUTH_REQUIRED nếu hết cửa sổ c3_stepup_minutes
gate.record(tx, principal, { subjectType, subjectId, action, reservationId?, reasonCode?, requestId },
            { stepUp: true })        // TRONG giao dịch, TRƯỚC khi trả dữ liệu: SR-RL-06 (60/giờ cảnh báo,
                                      // 200/giờ → 429) + c3_access_log; lỗi ghi log → 503; gia hạn cửa sổ
noStore(reply)                        // Cache-Control: no-store + Pragma: no-cache (SR-C3-03)
```
Cửa sổ step-up mở bằng `POST /v1/me/step-up` (`stepUp`, đã cài trong module `crypto` – trước đây chưa có ai cài). `c3_access_log.subject_type` của BE-B: `refund_account` (BE-B thêm vào CHECK ở 0040).

### 3. `files` – `modules/files/public/*`
- `attachment.service.ts`: `AttachmentService.assertUsable(tx, actor, attachmentId, purpose, { reservationId? })` → 422 `VALIDATION_FAILED` `errors[{field:'attachmentId', code:'NOT_IN_LIST'}]` khi không tồn tại / khác cơ sở / khác `purpose` / khác đơn / đã xóa / người gọi không thấy; `bindTo(tx, attachmentId, { type, id, retentionAnchorAt? })` gắn tệp vào bản ghi (`payment`, `approval_request`…) và đặt mốc hạn lưu (SEC I5: `deposit_receipt` → thời điểm `reconciled`).
- `image-pipeline.ts`: `normalizeImage(buffer)` (magic bytes JPEG/PNG/WebP, HEIC → `FILE_TYPE`, ≤ 10 MB, ≤ 40 MP, mã hóa lại bằng sharp, bỏ EXIF/GPS, tối đa 2 ảnh xử lý song song).

### 4. `registration/public/registration.port.ts` (bind `FD_REGISTRATION_PORT` – cài đúng interface `FrontdeskRegistrationPort` của BE-A)
- `checkinDocumentStatus(tx, reservationId)` → `{ mainGuestDocument, documentCheckBlock, pendingOnlineCheckin, visaExpiresBeforeDeparture, passportExpiresDuringStay }`
- `deadlinePreview(tx, id, at)`, `onCheckedIn(tx, id, actualCheckinAt)` → hạn BR-602/603, `onCheckInUndone`, `onDepartureChanged` (NN đã khai → `needs_update`), `onRoomChanged` (không đổi khai báo – BR-424), `onPartyChanged` (requiredCount, K9/K13), `onPartyMemberRemoved(tx, id, memberId)` (hủy DEK giấy tờ + ảnh người bị bỏ cùng giao dịch, `confirmed → needs_update`), `onCheckedOut(tx, id, at)` (B18 **và** B16 – G-17: hạn ảnh T02 = `at` + `id_image_retention_days_after_checkout`, NN → `needs_update`, `visa_alert_on` = NULL, mốc lưu `penalty_evidence`), `onReservationVoided` (K11 + xóa ảnh ngay).
- Module còn tự nghe `ReservationHooks` (`created` → bản ghi `none`; `transitioned` sang `cancelled`/`no_show` → `void`; khôi phục no-show → K12; `stay_changed` → `requiredCount`) – gọi trùng với cổng là vô hại (idempotent).

### 5. `guest-portal/public/guest-access.port.ts`
- `GuestAccessPort.revokeAllForReservation(tx, reservationId, reason = 'revoked')` → số token thu hồi – mọi token + phiên khách trong cùng giao dịch (B-13); bind `FD_GUEST_ACCESS_PORT` thay `NoGuestAccessPort`.


---

## 1. Đã làm gì

| Việc | Nội dung | Mục SEC |
|---|---|---|
| **crypto** (ngày 1) | `CryptoService` (AES-256-GCM, nonce 96 bit ngẫu nhiên, AAD `table\|column\|record_id\|kek_version`, DEK/bản ghi trong `data_key`, bọc bằng KEK `DATA_KEK_CURRENT`; xoay khóa `rewrap` với `DATA_KEK_<n>`; `destroy` = crypto-shredding + `purge_journal`; `blindIndex` HMAC `ID_HASH_KEY`); `FakeCryptoService`; `C3AccessGate` (cửa sổ step-up trượt, SR-RL-06 200/giờ → 429, ghi `c3_access_log` trước dữ liệu, lỗi ghi → 503); route `stepUp`; test ranh giới (không module nào khác đọc `data_key`/KEK/crypto internal) | B1 [CHẶN], B3 [CHẶN] |
| **files** | Một pipeline ảnh (`normalizeImage`: magic bytes JPEG/PNG/WebP, HEIC/PDF/HTML → `FILE_TYPE`, ≤ 10 MB, ≤ 40 MP đọc từ header trước khi giải mã, mã hóa lại bằng sharp, bỏ EXIF/GPS, tối đa 2 ảnh song song, không tệp tạm); `EncryptedBlobService` (DEK riêng mỗi tệp, AAD `<bảng>\|blob\|<id>`, tên ngẫu nhiên, tệp 0600 / thư mục 0700); parser multipart trong bộ nhớ; `uploadAttachment`/`getAttachment` (purpose đóng, vai theo purpose → 403, phạm vi đọc → 404, header I3, 50 tệp/người/ngày → 429); `AttachmentService.assertUsable/bindTo/setRetentionAnchor/purgeDue` (bind sẵn `ATTACHMENT_USAGE` của BE-B) | C1 [CHẶN], C2 [CHẶN], I1–I7 |
| **registration** | 13 operation (12 của EP06 + `listC3AccessLog`): giấy tờ C3 mã hóa từng cột `_enc` + `doc_number_hmac` + `last4`, ảnh, đối chiếu tự động BR-605/613 (pass/fail/unverified/not_applicable + `blocking`), kiểm tay + ghi chú (chặn ghi lại số giấy tờ bằng blind index), K1–K13, đồng ý P02b (append-only, rút → xóa ngay nếu đã khai), dữ liệu cổng (mỗi lần lấy = 1 dòng `portal_data view`), K6 theo khối (`mixed`), K7 xóa ngay ảnh người không đồng ý/trẻ em, K8, K10, A74 xóa sớm (OWN/MGR), nhật ký C3 (S28) che số; nghe `ReservationHooks` (K1, K11 void + xóa ảnh, K12, `requiredCount`); `RegistrationPortService` bind `FD_REGISTRATION_PORT` của BE-A; J16 `retention.purge` (api + worker) | B2 [CHẶN], B3, B4, C3, C5 [CHẶN], C6, C7, E1 [CHẶN], E3, E4 |
| **guest-portal** | `issueGuestLink`/`revokeGuestLink`, `openGuestSession` (cookie `ottimo_gsid` HttpOnly/Secure/SameSite=Strict, luôn mức 1), `getGuestStay`, `setGuestLocale`, `get/updateOnlineCheckin`, `uploadGuestDocument` (thay ảnh cũ = hủy DEK cùng giao dịch), `recordGuestConsent` (chỉ Khách 1, `guest_app`, bản thông báo hiện hành), `completeOnlineCheckin` (điều kiện bước + thông báo FD `online_checkin_completed`); guard phiên khách (`GUEST_SESSION_RESOLVER`), unit-of-work idempotency `guest_session`; serializer cắt trường theo `x-guest-level`; **không đăng ký** 5 route ĐK-1; `GuestAccessPort` bind `FD_GUEST_ACCESS_PORT` + nghe hủy/no-show → thu hồi mọi link/phiên | G1, G2, G4 [CHẶN], G5 (Origin), G7, G9 |
| Migration | `0050_crypto_files_be_c` (data_key, purge_journal, retention_run, attachment, RLS, grant tối thiểu, 3 tham số), `0051_registration_be_c`, `0052_guest_portal_be_c` (+ `guest_resolve_token`, `guest_resolve_session` SECURITY DEFINER, `search_path … pg_temp`); SQL viết tay từ bản nháp drizzle (không thêm snapshot), journal nối cuối, `when` tăng dần | A1, C2 |

### Bảng operation / trạng thái

| Operation | Trạng thái | Ghi chú kiểm |
|---|---|---|
| `stepUp` | Xong | mật khẩu (PIN R3 → 422), 401 `REAUTH_FAILED`, 5 sai → 429 (bộ đếm chung PasswordReauth) |
| `uploadAttachment` | Xong | 6 purpose, vai/purpose → 403 + access.denied, `reservationId` bắt buộc 2 purpose, SAL/CTV chỉ đơn của mình, 50/ngày → 429, idempotency hash theo SHA-256 tệp |
| `getAttachment` | Xong | header I3, phạm vi theo purpose → 404, đã xóa → 404 |
| `listRegistrations` | Xong | `view`, con trỏ; tự tạo bản ghi K1 cho đơn cũ (backfill) |
| `getRegistration` | Xong | JSON che (last4), ETag, `onlineCheckin.arrivalNote` chỉ FD+ (D23) |
| `addGuestDocument` | Xong | multipart `data` + 0–4 `image`, trusted device, `DOC_NUMBER_INVALID`/`MAIN_GUEST_DUPLICATE`/`ENTRY_DATE_FUTURE`, trùng số → 409 `PARTY_DUPLICATE`, `c3_access_log create`, `confirmed → needs_update` |
| `updateGuestDocument` | Xong | If-Match (version khai báo), mã hóa lại bằng DEK của giấy tờ, log `update` |
| `getGuestDocumentSensitive` | Xong | step-up → lý do → log `view` → dữ liệu, `no-store`, 503 khi không ghi được log, 429 SR-RL-06 |
| `getDocumentImage` | Xong | như trên + header ảnh; ảnh đã xóa → 404 và không có dòng `view` |
| `purgeRegistrationImages` | Xong | OWN/MGR, If-Match, `reason`, lần 2 → 409 |
| `recordImageConsent` | Xong | append-only; `refused→granted` sau khai/đã xóa → 409 `CONSENT_CHANGE_NOT_ALLOWED`; trẻ em/không có ảnh → 422 |
| `completeRegistrationReview` | Xong | thiếu ghi chú → 422 `CHECK_NOTE_REQUIRED`; thiếu người/đồng ý → 409 `REGISTRATION_INCOMPLETE` |
| `recordDocumentCheck` | Xong | `unverified` cần `manualResult`; `fail` cấm `manualResult`; `pass` → 409; tính lại `blocksDoorCode` |
| `getPortalData` | Xong | `scanned`/`needs_update`; `mixed` cần `kind`; `label` = khóa `reg.field.*`; `value` + `clipboardText` **tiếng Việt** (enum "Nữ", "Miễn thị thực"), `valueKey` `reg.value.*` cho enum và trường rỗng (đủ 15/8 trường, rỗng = `''`) – ORC 17/10 |
| `transitionRegistration` | Xong | `mark-sent` (3–64 ký tự, theo khối), `mark-confirmed` (xóa ảnh ngay), `mark-rejected` (V-08/V-09), `mark-updated` |
| `listC3AccessLog` | Xong | OWN/MGR, lọc ngày/đơn, `subjectLabel` = loại ••last4, `sessionRef` 8 ký tự |
| `issueGuestLink` | Xong | token 256 bit, DB chỉ SHA-256, không lưu trong idempotency, `no-store` |
| `revokeGuestLink` | Xong | thu hồi mọi token + phiên |
| `openGuestSession` | Xong | 10/phút + 100/ngày theo IP, mức 1, `emailOtpAvailable:false`, `level2ExpiresAt:null`, `Referrer-Policy: no-referrer` |
| `getGuestStay` | Xong | không `guestFullName`/`doorCode`, Wi-Fi từ ngày đến, `mapUrl` chỉ 5 host https, sau trả phòng → 403 `GUEST_STAY_ENDED` |
| `setGuestLocale` | Xong | cho phép sau trả phòng |
| `getOnlineCheckin` | Xong | đúng 9 khóa cho phép (ĐK-2) |
| `updateOnlineCheckin` | Xong | cổng thông báo, `noticeVersion` hiện hành, `lateArrival → 22:00`, `arrivalNote` ≤ 300 + V-09 + bỏ ký tự điều khiển, không vào audit/JSON khách, 20 ghi/ngày → 429, đóng → 409 `ONLINE_CHECKIN_CLOSED` |
| `uploadGuestDocument` | Xong | HEIC → 422 `FILE_TYPE`, ≤ 4/người, ≤ 30/đơn, thay ảnh cũ (hủy DEK), K2 `none → pre`, log `create` actor `guest` |
| `recordGuestConsent` | Xong | chỉ `personIndex = 1`, `channel guest_app` |
| `completeOnlineCheckin` | Xong | thiếu bước → 409 `INVALID_TRANSITION` + `currentState`; `deferredPeople` 1…n không trùng |
| `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode` | **Không đăng ký** (ĐK-1) | test: cả 5 → 404 |
| Job J16 `retention.purge` | Xong | tick + chặn 55 phút; T02/T01/attachment SEC I5/phiên khách hết hạn; `retention_run` (`J16`, `T01`, `T02`, `SEC-I5`); bỏ qua `legal_hold` |

## 2. File tạo / sửa

**Tạo (vùng BE-C)**
- `product/services/api/src/db/migrations/0050_crypto_files_be_c.sql`, `0051_registration_be_c.sql`, `0052_guest_portal_be_c.sql`
- `product/services/api/src/db/schema/crypto.ts`, `files.ts`, `registration.ts`, `guest-portal.ts`
- `product/services/api/src/modules/crypto/**` (`crypto.module.ts`; `internal/keyring.ts`, `envelope-crypto.service.ts`, `step-up.controller.ts`; `public/crypto.service.ts`, `crypto.fake.ts`, `c3-access-gate.ts`, `port-adapters.ts`, `factory.ts`)
- `product/services/api/src/modules/files/**` (`files.module.ts`; `internal/blob-store.ts`, `attachments.controller.ts`; `public/image-pipeline.ts`, `multipart.ts`, `encrypted-blob.service.ts`, `attachment.service.ts`, `factory.ts`)
- `product/services/api/src/modules/registration/**` (`registration.module.ts`; `internal/rules.ts`, `stay-reader.ts`, `registration.repo.ts`, `registration.service.ts`, `registration.controller.ts`, `c3-log.service.ts`, `retention.service.ts`; `public/registration.port.ts`, `registration.service.ts`, `worker-jobs.ts`)
- `product/services/api/src/modules/guest-portal/**` (`guest-portal.module.ts`; `internal/guest-session.resolver.ts`, `guest-unit-of-work.ts`, `guest-portal.service.ts`, `guest.controller.ts`, `guest-links.controller.ts`; `public/guest-access.port.ts`)
- `product/services/api/src/shared/http/guest-session.ts`
- Test: `product/services/api/test/crypto-units.test.ts`, `crypto-boundary.test.ts`, `registration-rules.test.ts`, `helpers/registration-fixture.ts`, `integration/crypto-envelope.test.ts`, `integration/registration-flow.test.ts`, `integration/guest-portal.test.ts`, `integration/files-attachments.test.ts`, `integration/rbac-sprint3-bec.test.ts`

**Sửa file dùng chung (chỉ thêm, có chú thích)**
- `src/db/schema/index.ts` (4 dòng export), `src/db/migrations/meta/_journal.json` (3 entry cuối)
- `src/modules/feature-modules.ts` (tham số `runtimeEnv` + 4 module dưới "Sprint 3 (BE-C)"), `src/main.ts` (truyền `rt.env`), `src/worker.ts` (đăng ký J16)
- `src/shared/http/auth.guard.ts` (nhánh khách: resolver + Origin guest-web + header điều kiện; `RequestAuth.guest`), `src/shared/serialization/serialize.interceptor.ts` + `serializer.ts` + `src/shared/openapi-types.ts` (vai `guest`, cờ `g` = `x-guest-level`), `scripts/gen-openapi-meta.mjs` (phát cờ `g`) → `src/generated/openapi-schemas.ts` sinh lại
- `src/http.ts` (content-type parser `multipart/form-data` dạng Buffer, `MULTIPART_BODY_LIMIT` 42 MB)
- `services/api/package.json` + `product/pnpm-lock.yaml` (thêm `sharp@0.35.5` – SR-FILE-03, ADR-013 điểm 1)
- `test/helpers/feature-app.ts` (`rawPayload` trong kiểu phản hồi), `test/integration/role-gate-first.test.ts` (bỏ operation khách khỏi vòng "vai cấm → 403": khách không có vai nhân viên, nhân viên gọi → 401 – phủ ở `rbac-sprint3-bec`)
- `01-decisions/decision-log.md` (8 dòng BE-C S3), file báo cáo này

## 3. Kết quả lệnh (16/10/2026, DB `ottimo_test_bec` tạo mới từ đầu)

| Lệnh | Kết quả |
|---|---|
| `pnpm format:check` | All matched files use Prettier code style |
| `pnpm lint` (eslint . + typecheck 12 gói) | 0 lỗi (2 cảnh báo cũ ở `mockServiceWorker.js`), 12/12 task |
| `pnpm build` | 6/6 task |
| `turbo run test --force` toàn repo | 12/12 task; `@ottimo/api` **50 tệp / 2031 test xanh** (gồm BE-A, BE-B) |
| Test BE-C riêng | unit 47 (crypto + rules + ranh giới), crypto-envelope 6, registration-flow 7, guest-portal 7, files-attachments 5, rbac-sprint3-bec 277 (276 ca rbac-cases.json + ca phủ) |
| `node scripts/gen-openapi-meta.mjs --check` | up to date |
| drizzle lệch | `drizzle-kit generate` vào bản sao (journal ≤ 0019) → 44 câu lệnh của 12 bảng BE-C **trùng nguyên văn** với 0050–0052, lệch 0 (không thêm snapshot – quy tắc 4.2-2) |
| Migration | chạy sạch trên DB mới; `__drizzle_migrations` = số entry journal (test kiến trúc) |

Lưu ý lần chạy giữa chừng trên DB cũ: `payments-s3` (2 ca) và `frontdesk*` lỗi do migration 0030/0040 của BE-A/BE-B đang sửa dở (DB cũ giữ bản cũ của 0030) – chạy lại trên DB tạo mới thì xanh hết.

## 4. Giả định (đã ghi decision-log khi thuộc quyền BE)
1. `stepUp` cài trong module `crypto` (chưa ai nhận); thứ tự B3 thực tế: thiết bị → **vai** → step-up → phạm vi → lý do → log → dữ liệu (vai sai 403 trước 401 – nhất quán BUG-R2-005).
2. "Người" của giấy tờ trước khi có bảng party = `guest_document.id`; `recordImageConsent.partyMemberId` nhận id người trong đơn **hoặc** id giấy tờ. FE dùng `documents[].partyMemberId ?? documents[].id`.
3. Xóa ảnh K7/K11/rút đồng ý/bỏ người làm **ngay trong giao dịch** (không qua outbox), J16 là lưới an toàn hằng giờ.
4. K11 `void` áp cho `none/pre/partial/review` **và `scanned`** (chưa khai trên cổng); `sent`/`confirmed` không void.
5. `mixed` bị cổng từ chối (K8): khai lại phải gửi mã **mọi** khối mới hơn lần gửi trước.
6. `issueGuestLink` gửi lại cùng `Idempotency-Key` → 201 không có link (token chỉ hiện một lần, không lưu vào `idempotency_key`).
7. Nhãn `PortalData.people[].fields[].label` là khóa i18n `reg.field.*`; giá trị enum đổi sang tiếng Việt lấy từ `design/copy/strings-vi.json` qua `scripts/gen-portal-copy.mjs` → `src/generated/portal-copy.ts` (không rơi về EN; thiếu khóa → generator lỗi; test `--check` + so với strings-vi.json). Ngày vẫn `YYYY-MM-DD`, quốc tịch vẫn mã ISO alpha-3 – INT/DOM xác nhận định dạng cổng thật. Địa chỉ cổng: NN `https://tbltkbtt.bocongan.gov.vn` (BR-606), VN `https://dichvucong.bocongan.gov.vn` – hằng số kỹ thuật.
8. `guestFirstName`: tên Việt (có chữ chỉ tiếng Việt dùng) lấy từ cuối, tên Latin lấy từ đầu.
9. Locale đồng ý tại quầy: `vi`/`en` (EP06 4); guest-web chấp nhận cả `ru` (bản thông báo RU là R3).

## 5. Rủi ro / vướng mắc – việc cần vai khác
| Ai | Việc |
|---|---|
| **BE-A** | (a) Cổng đọc đơn: `registration/internal/stay-reader.ts` đang SELECT trực tiếp `reservation`/`guest`/`reservation_segment`/`room` (và `listRegistrations`, `listC3AccessLog` JOIN `reservation`) – đề nghị expose `stayView(tx, id, actor)` trong `reservations/public`, BE-C chuyển sang ngay. (b) `completeOnlineCheckin` **chưa ghi `Reservation.etaTime`** (bảng của BE-A) – cần cổng `setEta(tx, reservationId, eta, late)`; lễ tân vẫn thấy giờ đến ở `Registration.onlineCheckin.etaTime`. (c) Ports của BE-A đã có bản cài thật: `FD_REGISTRATION_PORT`, `FD_GUEST_ACCESS_PORT`, `FD_CHILD_DATA_PORT`. (d) Khi 0030 lên main: BE-C thêm FK `guest_document.party_member_id → reservation_guest` (0053) và FK `reservation_guest.child_data_key_id → data_key` là việc của BE-A. (e) `worker.ts`: BE-C đã thêm đăng ký J16 (2 dòng) – BE-A giữ khi gộp. |
| **BE-B** | `REFUND_ACCOUNT_CIPHER`, `ATTACHMENT_USAGE` đã bind bản thật; gọi `attachments.setRetentionAnchor(tx, {id, purpose:'deposit_receipt'}, reconciledAt)` (hoặc `bindTo(..., {retentionAnchorAt})`) khi khoản thu `reconciled` để J16 tính 90 ngày (SEC I5). `AttachmentService` lấy `RESERVATION_SALES_PORT` qua `ModuleRef` (tránh vòng phụ thuộc folio ↔ attachment làm Nest treo lúc khởi động). |
| **ARC** | Xem 3 chỗ sửa file dùng chung: nhánh khách trong `AuthGuard`, cờ `g` (`x-guest-level`) trong generator + serializer, tham số `runtimeEnv` của `featureModules`. Bảng `consent_record` đặt trong migration registration (P05/P06 R3 dùng chung). |
| **SEC** | Review: HKDF từ `ID_HASH_KEY` cho `child_name`; SR-RL-06 đếm trong `c3_access_log`; thứ tự B3 (mục 4.1); phản hồi khách mức 1 có `guestFirstName`, `roomNo` (đúng ĐK-2). |
| **OPS** | `BLOBSTORE_LOCAL_PATH` tuyệt đối trên volume riêng (thư mục 0700, **không** mount vào Caddy) – staging/production thiếu sẽ không khởi động; cảnh báo khi không có `retention_run` policy `J16` trong 26 giờ (C6); che `/g/*` trong log Caddy (G4); body Caddy 25 MB (API nhận tối đa 42 MB multipart). `KEK`/`ID_HASH_KEY` qua `*_FILE`. |
| **FE/MOB** | Lỗi tệp `422 FILE_REJECTED` `errors[].code` ∈ `FILE_TYPE`/`FILE_TOO_LARGE`/`TOO_MANY_FILES`; `401 REAUTH_REQUIRED` → hộp mật khẩu → `POST /v1/me/step-up` → gửi lại; 409 `INVALID_TRANSITION` của guest-web có `currentState` = bước còn thiếu. UXD thêm chuỗi `reg.field.*` (vi/en). |
| **QA** | Ca E2E L7 có thể bật (endpoint đã có); dùng tham số `privacy_notice_version` (mặc định `privacy-2026-10-v1`). |

## 6. Việc chưa xong (không chặn)
- Cổng `stayView` / `setEta` chờ BE-A (mục 5).
- Nhắc hạn khai báo (`registration_reminder_before_minutes`, BR-611 digest) và mục "Cần chú ý" `registration_due/overdue`, `visa_expiring` (nguồn tính `registerAttentionSource` của BE-A) – làm ở đợt sau khi hub `events` ổn định.
- `rewrap` mới có hàm + test; runbook xoay KEK (SR-KEY-05) là R3 của OPS.

## 7. ESC mới
Không có.


## 8. Bổ sung 17/10 – dữ liệu cổng tiếng Việt (quyết định ORC theo UXD s3 mục 9)
- Hợp đồng (thêm, tùy chọn – ARC xem): `PortalData.people[].fields[].valueKey` (`^reg\.value\.[a-z_.]+$`) + mô tả `value`/`clipboardText` là chữ tiếng Việt; sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, `packages/api-client/src/generated/openapi.ts`; `openapi-spec-validator` OK, `gen_rbac_cases --check` OK, `gen_traceability --strict` exit 0.
- Server: `rules.ts` `portalFields()` / `portalClipboard()` (thuần, có test): đủ trường theo thứ tự cổng kể cả trường rỗng (`value: ''`, `valueKey: 'reg.value.empty'` – chữ "Không có – để trống trên cổng" chỉ để hiện, không bao giờ vào clipboard); giới tính/diện nhập cảnh = chữ tiếng Việt + `valueKey`.
- Nguồn chữ: `services/api/scripts/gen-portal-copy.mjs` → `src/generated/portal-copy.ts` (cùng kiểu `gen-quote-copy.mjs`).
- Không sửa `registration/internal/stay-reader.ts` (BE-A đang chuyển sang cổng `stayView`).
- Lệnh: format:check ✓, lint (eslint + typecheck 12 gói) ✓, build 6/6 ✓, `turbo run test --force` 12/12 – api 50 tệp / **2036** test ✓, `gen-openapi-meta --check`, `gen-portal-copy --check`, api-client `gen --check` ✓.

## 9. Bước Phản hồi & sửa (17/10) – trả lời thẻ SEC/ARC/DOM
Chi tiết từng thẻ: `rounds/round-02/responses/s3-BE-C.md`. Sửa phiên bản sharp ở mục 2: **0.35.5** (ORC đã nâng). Giả định 7 ở mục 4 (ngày `YYYY-MM-DD`, quốc tịch mã, URL hằng số) **được thay** bằng tham số `portal_date_format`/`portal_nationality_format` + biến môi trường URL cổng (DOM S3-5, ARC S3-20, chờ ESC-018). Giả định 3 (xóa blob trong giao dịch) **được thay** bằng xóa tệp sau COMMIT.

**Migration** `0053_retention_hardening_be_c.sql` + `meta/0053_snapshot.json` (4.2a): bảng `blob_pending_delete` (RLS property, SELECT/INSERT/DELETE); CHECK `purge_reason` + `unbound`, `delete_reason` + `unconfirmed`; FK cặp tenant tới `data_key`/`guest_access_token`; FK `guest_document.party_member_id/reservation_id`, `guest_session.reservation_id`; chỉ mục `attachment_retention_idx`, `attachment_unbound_idx`, `document_image_registration_idx` (bỏ `attachment_purge_idx`); cột `registration.stay_ended_at`, `consent_record.retention_days`; GRANT UPDATE theo cột cho `document_image`/`guest_document`; trigger `c3_no_resurrection`; tham số `id_image_unconfirmed_max_days`, `attachment_unbound_days`, `portal_date_format`, `portal_nationality_format`; biên `id_image_purge_max_hours` 1–24.

**File tạo**: `src/shared/savepoint.ts`, `src/modules/files/public/upload-gate.ts`, `src/modules/registration/internal/countries.ts`, `src/modules/registration/internal/portal-config.ts`, `src/modules/guest-portal/public/online-checkin.read.ts`, `test/be-c-s3-units.test.ts`, migration 0053 + snapshot, `rounds/round-02/responses/s3-BE-C.md`.
**File sửa**: `src/http.ts`, `src/shared/http/unit-of-work.ts`, `src/modules/feature-modules.ts` (`RegistrationModule.register({ env })`), `src/db/schema/{crypto,files,registration,guest-portal}.ts`, `meta/_journal.json` (idx 27), `modules/crypto/**` (`KeyedHashPurpose` + `idempotency`, `rewrap` bỏ qua phiên bản chưa nạp, `unknownVersionCount`), `modules/files/**` (pipeline sharp, blob service, attachment service + controller), `modules/registration/**` (service, repo, rules, controller, retention, c3-log, module, worker-jobs), `modules/guest-portal/internal/{guest-portal.service,guest.controller}.ts`, `product/.env.example` (2 biến URL cổng), test: `crypto-boundary`, `registration-rules`, `integration/{crypto-envelope,files-attachments,guest-portal,registration-flow}`, `helpers/feature-app.ts` (tùy chọn `guestOrigins`), `helpers/registration-fixture.ts` (Origin guest-web ở `guest()`), `01-decisions/decision-log.md` (5 dòng).

**Kết quả lệnh** (17/10, DB `ottimo_test_bec` tạo mới, Node 22, pnpm 9):

| Lệnh | Kết quả |
|---|---|
| Test BE-C | 9 tệp / **376 test xanh**: be-c-s3-units 7, crypto-units 18, crypto-boundary 4, registration-rules 32, crypto-envelope 8, files-attachments 9, guest-portal 10, registration-flow 12, rbac-sprint3-bec 276 |
| `turbo run test --force` toàn repo | 11/12 task xanh; `@ottimo/api` 52 tệp / 2080 test: **2062 xanh, 18 đỏ – đều ở `frontdesk*.test.ts`, `payments-s3.test.ts`, `role-gate-first.test.ts`** (BE-A/BE-B đang sửa cùng bước: kỳ vọng cũ của B9a/SURCHARGE, `ciphertext-name` của bộ giả cũ, tổng folio, khớp `method/path` của SEC-BE-33). Không tệp nào của BE-C đỏ |
| `pnpm lint` | eslint: 3 lỗi ở `events/internal/events.controller.ts`, `frontdesk/internal/party.service.ts` (BE-A đang sửa); 0 lỗi ở file BE-C. `turbo run typecheck` 12/12 |
| `pnpm build` | 6/6 |
| `pnpm format:check` | 25 file của BE-A/BE-B/QA đang sửa; **0 file BE-C** |
| `drizzle-kit generate` (thư mục thật + bản sao) | "No schema changes" – không tạo file |
| `gen-openapi-meta --check`, `gen-portal-copy --check`, api-client `gen --check` | up to date |

**Việc cho vai khác (mới)**
- **ARC**: (1) bảng Problem không có 415 – multipart sai route trả 422 `VALIDATION_FAILED`; nếu muốn mã riêng thì thêm `UNSUPPORTED_MEDIA_TYPE`. (2) 0.3.7: `updateOnlineCheckin.noticeLocale` (SEC BE-50), `getGuestSession`, `Registration.imageRetentionDays` (để FE quầy đọc số ngày cho `retentionDays`). (3) Biên `id_image_retention_days_after_checkout` là 0–30 (0003) nhưng hợp đồng `imageRetentionDays`/`retentionDays` tối thiểu 1: tham số = 0 thì không ghi được đồng ý P02b (422 – an toàn); đề nghị chốt min 1 hoặc mô tả "0 = không lưu, không hỏi đồng ý".
- **BE-A**: bỏ mặc định `SYSTEM_ACTOR` ở `stay-reader.ts` khi sẵn sàng (SEC BE-52) – BE-C truyền tường minh; test `frontdesk.test.ts` còn kỳ vọng `ciphertext-name` của bộ giả cũ (cổng thật trả bản mã).
- **INT**: bỏ phần dựng trường trong `integrations/guest-registration/manual.ts` (ARC S3-20) – server là nơi duy nhất.
- **OPS**: Caddy `request_body max_size 42MB` chỉ cho 3 đường upload, 1 MB phần còn lại; truyền `GUEST_REGISTRATION_PORTAL_URL_*` vào compose nếu khác mặc định; volume blob dùng chung api + worker (J16 xóa tệp).
- **FE/MOB/QA**: xem "Thay đổi hành vi" trong file phản hồi (retentionDays bắt buộc, định dạng cổng, 422/401/503 của upload, K1 xuất hiện trong ≤ 1 phút).

**ESC mới**: không. DOM S3-5 dùng ESC-018 đã có.

## 10. Bước Kiểm thử – vòng sửa 2 (17/10, bug QA HEAD c8b83f3)
Chi tiết: `rounds/round-02/responses/s3-BE-C.md` mục "Bước Kiểm thử – vòng sửa 2".
- **BUG-R2-035 (P1)**: J5 `registration.deadline` mới (`registration/internal/deadline-job.ts`), đăng ký ở api (`RegistrationModule` → `JobRegistry`, chạy được qua test-support) và worker (`registrationWorkerJobs`). Nhắc trước hạn + tổng hợp BR-611 qua `events.notify` (kind `registration_due`), exactly-once bằng `job_run` (`registration.reminder`, `registration.digest`).
- **BUG-R2-036 (P2)**: J16 – bước ảnh/backfill/quét tệp chạy mỗi tick; phần theo giờ + heartbeat giữ 55 phút.
- **BUG-R2-048 (P2)**: `listC3AccessLog` đọc `from`/`to`.
- **BUG-R2-034 (P2, PO chốt Sprint 3)**: `registration/internal/attention-sources.ts` – `registration_due`, `registration_overdue`, `visa_expiring` (chỉ mã đơn + căn).
- **BUG-R2-033 (P2)**: cổng `RegistrationPartyPort` + `RegistrationPartyLink` (`registration/public/party-port.ts`); BE-A cài `DocumentPartyPort` và `provide()` lúc khởi động. Ca "không khớp ai, không còn người trống" vẫn để trống: cần BE-B cho phép hồ sơ chỉ có giấy tờ hoặc PO quyết.
- Không migration mới (dùng `job_run`, `staff_notification` sẵn có); drizzle generate không tạo file.
- Kết quả (DB `ottimo_test_bec` tạo mới): `turbo run test --force` **12/12**, `@ottimo/api` **55 tệp / 2130 test xanh**; `pnpm lint` 0 lỗi (2 cảnh báo cũ `mockServiceWorker.js`), typecheck 12/12; `pnpm build` 6/6; `pnpm format:check` sạch; `gen-openapi-meta --check`, `gen-portal-copy --check`, api-client `gen --check` up to date.
- Việc cho vai khác: **QA** đổi `test.fail` của TC-L3-004/032/037/039/044/046/048/054 thành ca thường và thêm ca tự động cho `from`/`to` (TC-RB-022); **ARC/UXD**: thông báo tổng hợp dùng `registration_due` + refType `property` không có `refCode` (app mở danh sách khai báo) – nếu cần hiện số hồ sơ thì thêm trường vào `StaffNotification` (0.3.7); **BE-B/PO**: hồ sơ khách chỉ từ giấy tờ (BR-951, BUG-033 ca b).

## 11. Bổ sung 3 + mở lại sau kiểm chứng đối kháng (17/10, checkpoint e3959ec)
Chi tiết: `rounds/round-02/responses/s3-BE-C.md` (2 mục cuối).
- **`Registration.consentNotice`** (0.3.6 bổ sung 3): trả từ tham số cơ sở theo ngày nghiệp vụ; `recordImageConsent` bắt buộc đúng `noticeVersion` + `retentionDays`.
- **SEC-BE-32 (mở lại)**: J16 bước 1a đọc trạng thái đơn qua stay view (không dựa `stay_ended_at`), lên lịch ảnh chưa có hạn như hook; bỏ nhánh 2a sai; không cần migration 0054. Test trên 5 trạng thái + checkout/cancel/no-show không hook, endpoint hủy/trả phòng thật, `needs_update` sau trả phòng.
- **Upload (ARC-S3-03/18, SEC-BE-47 vector mới)**: `readMultipart` kiểm phiên thật (`UploadSessionCheck`) và giữ chỗ cổng 4 upload TRƯỚC khi đọc thân; trả chỗ ở `onResponse`/`onRequestAbort`; đọc thân một bản sao. Test cookie giả + thân không kết thúc → 401 ngay; upload thứ 5 → 503.
- File mới: `src/modules/files/internal/upload-session.check.ts`, `src/modules/guest-portal/public/session-cookie.ts`. Sửa: `src/http.ts`, `files/public/upload-gate.ts`, `files/files.module.ts`, 3 controller upload, `registration/internal/{registration.service,retention.service,registration.controller}.ts`, `registration/public/party-port.ts` (chú thích theo SEC s3 §7), `guest-portal/internal/guest-session.resolver.ts`, test `files-attachments`, `registration-flow`.
- Kết quả (DB `ottimo_test_bec` tạo mới): `turbo run test --force` 12/12, api **56 tệp / 2142 test xanh**; lint 0 lỗi; typecheck 12/12; build 6/6; format sạch; drizzle không tạo file; các `--check` up to date.

## 12. Vòng sửa 4 (kiểm chứng đối kháng lần 2, 17/10)
Chi tiết: `rounds/round-02/responses/s3-BE-C.md` mục "Vòng sửa 4".
- **Blocker rò chỗ upload**: không lấy chỗ khi client đã đi; `readBody` nghe `close`/`aborted`; trần 2/phiên, 3/IP (429), 4/tiến trình (503); phiên gắn route; bắt buộc `Content-Length` (một bộ đệm). `leak.ts` chạy lại sạch; test socket thật `test/upload-gate-socket.test.ts`.
- **Major a**: J16 coi đơn `hold/confirmed/in_house` quá 7 ngày sau ngày đi là đã kết thúc; "Cần chú ý" `data_quality/registration_stay_not_closed`.
- **Major b (A-38)**: bỏ người → xóa ảnh khách tải cho người vượt số người của đơn; test qua `DELETE …/party/{memberId}` thật.
- **Minor**: mốc `cancelledAt`/`noShowMarkedAt` (stay-reader, báo BE-A); K12 xóa mốc/hạn; con trỏ + savepoint từng registration; lý do `no_consent`.
- File mới: `test/upload-gate-socket.test.ts`. Sửa: `src/http.ts`, `files/public/upload-gate.ts`, `files/internal/upload-session.check.ts`, `registration/internal/{registration.service,retention.service,attention-sources,stay-reader}.ts`, test `files-attachments`, `registration-flow`.
- Kết quả (DB `ottimo_test_bec` tạo mới, `turbo run test --force --continue`): 11/12 task; **api 57 tệp / 2155 test xanh**, admin-web 155, guest-web 50, integrations 133…; task đỏ duy nhất `@ottimo/tests` (validate-fixtures của QA: `smoke-manifest.json` thiếu TC-L3-074 – QA đang sửa). typecheck 12/12; build 6/6; eslint/prettier sạch trừ `infra/demo/seed-demo.mjs`, `smoke-demo.mjs` (OPS đang viết: 1 biến thừa `GUEST`, định dạng). drizzle generate không tạo file.

## 13. Ngày đi hiệu lực cho "đơn không đóng" (ORC 17/10)
- `reservations/public/stay-view.ts`: thêm `StayViewRow.effectiveDepartureDate` = GREATEST(ngày đi của đơn, ngày đi muộn nhất của đơn con `confirmed`/`in_house`) – đã báo BE-A; `registration/internal/stay-reader.ts` mang theo. J16 bước 1a và mục `registration_stay_not_closed` dùng ngày này.
- Test `registration-flow`: đơn OTA 01–03 + đơn con 03–20 in-house → ngày 10/11 ảnh không bị xóa, không có hạn, không nằm trong "đơn không đóng"; 27/11 (20/11 + 7 ngày) → xóa `unconfirmed`. registration-flow 22/22.
- Kết quả toàn repo (DB mới, `turbo run test --force --continue`): api 2154/2156 – 2 ca đỏ không thuộc BE-C: `frontdesk-s3-fixes` (BE-A đang sửa party/stay, file chưa format) và `reservations.test` p95 < 200 ms (đo thời gian khi chạy song song toàn repo; chạy riêng tệp 2 lần đều 18/18 xanh; rack không đọc stay view). admin-web 156/157 (FE đang sửa `ota-rules`), `@ottimo/tests` (QA: smoke-manifest thiếu TC-L3-074). Lint 0 lỗi, typecheck 12/12, build 6/6; format chỉ lệch 3 tệp BE-A đang sửa (`party.service.ts`, `stay.service.ts`, `reservations.service.ts`); drizzle không tạo file.
