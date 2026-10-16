# INT – Round 2, Sprint 3: VietQR, khóa cửa (TTLock – manual/mock), khai báo lưu trú (manual), MISA (giữ interface)

- Vai: INT | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Vùng: `product/integrations/**` (gói `@ottimo/integrations`)
- Căn cứ: plan R2 mục 4 (Sprint 3) + P-R2-6; ARC `outputs/ARC/s3-contract.md` (A-29, A-41, dòng INT); SEC `outputs/SEC/s3-checklist.md` (D2, D3, E3, F1, F2, F3, F10); BR-403, BR-511, BR-602…606; specs `EP06-registration.md` v0.2 mục 2.2, 5.1; OpenAPI 0.3.6 (`DoorCredentialInput`, `PortalData`); `product/docs/integrations/smart-lock.md`

## Interface (công bố ngày 1 – BE-A, BE-B, BE-C, FE dùng)

> **Cập nhật 17/10/2026 sau review chéo S3** (chi tiết: `rounds/round-02/responses/s3-INT.md`):
> - I-1: `new VietQrPaymentAdapter({ receivingAccount, now })` – **cả hai bắt buộc**; bỏ `credentials` và nhánh `PAYMENT_VIETQR_*`; `VietQrPrepared` bỏ `accountNoMasked`, `accountSource`; bỏ `maskAccountNo` (mẫu che duy nhất = BE-B `maskedAccountNo` `9704••••1234`).
> - I-2: `computeDoorValidity` thêm `actualCheckInAt`, `lateGraceUntil`, `sameDayArrival`; thêm `isWeakDoorCode`, `matchesBirthdayWithoutRandom`; `createDoorLockAdapter(provider, { now })` và `ManualDoorLockAdapter({ now })` bắt buộc `now`.
> - I-3: INT **không dựng trường** nữa – nguồn duy nhất là BE-C `rules.ts`. Adapter: `new ManualGuestRegistrationAdapter(source: RegistrationPortalSource)`; còn `validatePortalReference`, `PORTAL_REFERENCE_PATTERN`, `assertPortalUrl`. Khối mã I-3 bên dưới là bản 16/10, **đã thay**.

Tất cả là mã chạy trong `@ottimo/integrations`, không gọi mạng, không SDK, không đọc `process.env`. Lỗi luôn là `IntegrationError` (README 1.6).

### I-1 VietQR (cho BE-B: `createVietQr`, `confirmDeposit`; FE: vẽ QR)

```ts
import {
  VietQrPaymentAdapter, buildVietQrPayload, normalizeTransferContent, maskAccountNo,
  renderQrPng, type VietQrReceivingAccount, type VietQrPrepared,
} from '@ottimo/integrations/payment';
import { renderQrSvg, encodeQr } from '@ottimo/integrations/qr'; // thuần TS, chạy được trong trình duyệt

interface VietQrReceivingAccount { bankBin: string; accountNo: string; accountName: string }
// BE-B cung cấp: đọc tham số `payment_receiving_account` của cơ sở; null = chưa cấu hình → dùng .env
type ReceivingAccountSource = (ctx: IntegrationContext) => Promise<VietQrReceivingAccount | null>;

new VietQrPaymentAdapter({ credentials: CredentialProvider, receivingAccount?: ReceivingAccountSource })
  .prepare(ctx, { amountVnd: number, transferContent: string }): Promise<VietQrPrepared>
  // + đủ PaymentAdapter: createPayment (dùng req.description làm nội dung), verifyCallback (luôn ok:false),
  //   callbackAck (404), queryStatus ('pending'), healthCheck

interface VietQrPrepared {
  qrPayload: string;          // chuỗi EMVCo/NAPAS có CRC16 – lưu được, không chứa tên khách
  qrSvg: string;              // ảnh SVG vẽ tại chỗ (F2)
  amountVnd: number;
  transferContent: string;    // đã chuẩn hóa, vd 'OTM-00171' → 'OTM00171' (F1)
  bankBin: string;
  accountNoMasked: string;    // '••••5678' – dùng cho `receivingAccountMasked`
  accountName: string;        // không dấu, chữ hoa
  accountSource: 'parameter' | 'env';
}
```

- Nguồn tài khoản: `receivingAccount(ctx)` (tham số `payment_receiving_account`, BE-B quản lý, F3) → nếu `null`: `credentials.get(ctx.credentialsRef)` với `ctx.credentialsRef = 'env:PAYMENT_VIETQR'` (`BANK_BIN`, `ACCOUNT_NO`, `ACCOUNT_NAME`). Không có cả hai → `IntegrationError('CONFIG')` → BE-B trả 409 `PAYMENT_NOT_CONFIGURED`, **không** vẽ QR giả.
- Kiểm: `amountVnd` nguyên dương ≤ 13 chữ số (số tiền do server tính – F1); nội dung sau chuẩn hóa chỉ `A-Z0-9`, 1–25 ký tự (bỏ `- _ . / khoảng trắng`); ký tự khác (dấu, tên, SĐT có `+`…) → `INVALID_REQUEST`. Nội dung ≥ 13 chữ số liền nhau → `INVALID_REQUEST` (không cho số thẻ/số TK lọt vào nội dung).
- Lỗi và thông báo **không bao giờ** chứa số tài khoản; adapter không log.
- `renderQrPng(payload, opts?) → Uint8Array` chỉ chạy ở Node (dùng `node:zlib`). FE dùng `renderQrSvg` (subpath `./qr` không phụ thuộc Node) hoặc `qrSvg` do API trả.

### I-2 Khóa cửa (cho BE-A: nhận phòng / trả phòng / đổi phòng – `setDoorCredential`)

```ts
import {
  createDoorLockAdapter, ManualDoorLockAdapter, MockDoorLockAdapter,
  computeDoorValidity, generateDoorCode, generateBirthdayDoorCode, MAX_KEY_CARDS_PER_ROOM,
} from '@ottimo/integrations/doorlock';

createDoorLockAdapter(provider: 'off' | 'manual' | 'mock' | 'ttlock', opts?): DoorLockAdapter | null
  // 'off' → null; 'ttlock' ở R2 → IntegrationError('CONFIG') (adapter thật R3); mặc định .env = 'manual'

computeDoorValidity({ arrivalDate: LocalDate, departureDate: LocalDate, utcOffset?: '+07:00',
  checkInTime?: '14:00', checkOutTime?: '12:00', earlyCheckInTime?: string, lateCheckOutTime?: string })
  : { validFrom: IsoInstant; validTo: IsoInstant }      // BR-403: giờ nhận → giờ trả (gồm trả muộn đã duyệt)
generateDoorCode(digits = 6): string                     // CSPRNG (node:crypto randomInt) – SR-LOCK-01
generateBirthdayDoorCode(ddmm: string): string          // ddmm + 3 số ngẫu nhiên (BR-403, ESC-011 A)
MAX_KEY_CARDS_PER_ROOM = 2                               // BR-403/511, `cardsIssued` 0–2
```

- Dùng `DoorLockAdapter` (contracts 3.4, không đổi): `createCode` → `{ credentialId, installed }`. **Manual**: `installed=false` → BE-A tạo việc "Cài mã trên app khóa"; `revoke`/`updateValidity` thành công nhưng không làm gì ở khóa → BE-A tạo việc "Xóa mã căn X"/"Sửa hạn mã" (SEC D3). **Mock**: `installed=true`, giữ mã dạng băm, từ chối mã trùng đang hiệu lực trên cùng khóa (`CONFLICT`), thẻ > 2/khóa (`CONFLICT`), nhận `MockScenario` lỗi mạng.
- Kiểm chung (cả manual và mock): mã 6–10 chữ số, `validFrom < validTo`, `label` chỉ dạng mã tham chiếu `^[A-Za-z0-9_-]{1,32}$` (không tên/SĐT – SEC-08). Adapter không trả lại mã.
- Không trùng mã đang hiệu lực / không tái dùng 90 ngày: lõi (BE-A) kiểm trong DB (D2) – adapter thật không thấy lịch sử.

### I-3 Khai báo lưu trú (cho BE-C: `getPortalData`, `transitionRegistration mark-sent`)

```ts
import { ManualGuestRegistrationAdapter, validatePortalReference, portalFields, clipboardTextFor,
  type RegistrationDataPort, type RegistrationStaySource, type RegistrationPersonSource, type PortalDataBlock,
} from '@ottimo/integrations/guest-registration';

new ManualGuestRegistrationAdapter({ data: RegistrationDataPort,
  portalUrls: { foreigner_temp_residence: string; vn_citizen_stay: string } })   // https bắt buộc, không mặc định
  .prepare(ctx, stayId): Promise<GuestRegistrationPrepared>     // = contracts 3.6, mỗi người một mục, kind riêng
  .preparePortalData(ctx, stayId, kind?): Promise<PortalDataBlock[]>
      // khớp schema OpenAPI `PortalData` {kind, portalUrl, people[{fields}], clipboardText}; mixed → 2 khối
      // (NN trước); truyền kind → 1 khối (E06-03); kind không có người → NOT_FOUND
  .recordSubmission(ctx, stayId, portalReference)               // chỉ kiểm định dạng; lõi ghi người nộp + trạng thái K6

interface RegistrationDataPort {   // BE-C cài: đọc + giải mã C3 SAU khi đã ghi c3_access_log (B3, E1)
  loadStay(ctx, stayId): Promise<RegistrationStaySource>;
}
interface RegistrationStaySource { arrivalDate; departureDate; roomNo: string; people: RegistrationPersonSource[] }
interface RegistrationPersonSource {   // tên trường theo EP06 2.2
  personRef: string; kind: 'foreigner_temp_residence' | 'vn_citizen_stay';
  fullNameOnDoc; dateOfBirth; gender?; nationalityCode; docType: 'cccd'|'passport'|'child_personal_id'|'other'; docNumber;
  passportExpiryDate?; visaKind?: 'visa'|'visa_exempt'|'temp_residence_card'; visaNumber?; visaValidUntil?;
  entryDate?; entryPort?; entryPurpose?; phone?; address?;
}
```

- Chỉ ở bộ nhớ, cho **một** đơn (không xuất danh sách nhiều đơn – A75, SEC E3); không ghi tệp, không log. `clipboardText` = các dòng "Nhãn: giá trị" theo thứ tự trường, mỗi người một khối.
- Ngày đi khai = min(ngày đi đơn, `visaValidUntil`) với khách NN (BR-605).
- `portalReference`: 3–64 ký tự `[A-Za-z0-9-/._]` (EP06 5.2) → sai → `INVALID_REQUEST`.

### I-4 Hóa đơn điện tử MISA
`EInvoiceAdapter` (contracts 3.3) **giữ nguyên** cho R3. R2: BE-B chỉ lưu yêu cầu (`setInvoiceRequest`), không outbox MISA. INT không thêm mã.

---

## 1. Bảng trạng thái

| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | VietQR: chuỗi EMVCo/NAPAS (BIN, số TK, số tiền, nội dung = mã đơn/bill) + ảnh QR SVG/PNG **sinh tại chỗ**; tài khoản từ `payment_receiving_account` → mặc định `PAYMENT_VIETQR_*` | Xong | `payment/vietqr/*`, `qr/*`; 2 vector chuẩn CRC + vector VietQR + giải mã độc lập (mục 3) |
| 2 | Khóa cửa: `DoorLockAdapter` `manual` (mặc định) + `mock`; mã có hạn theo giờ nhận/trả, thu hồi, thẻ 0–2/căn; thiết kế sẵn TTLock R3 | Xong (TTLock: thiết kế, chưa mã) | `doorlock/*`; README 3.4 "Thiết kế adapter TTLock" |
| 3 | Khai báo lưu trú: adapter `manual` dựng biểu mẫu/văn bản sao chép theo EP06 v0.2 | Xong | `guest-registration/*` |
| 4 | MISA: xác nhận `EInvoiceAdapter` (contracts 3.3) sẵn cho R3, không làm thêm | Xong | `contracts/einvoice.ts` không đổi |
| 5 | Công bố interface ngày 1 | Xong | Mục "Interface" ở đầu file này |
| 6 | format:check / lint / typecheck / test / build toàn repo – phần INT xanh | Xanh phần INT | Mục 3 (phần đỏ thuộc vai khác) |

## 2. Đã làm gì

### 2.1 QR tại chỗ (`qr/`)
- Bộ mã hóa QR tự viết (ISO/IEC 18004): chế độ byte (UTF-8), phiên bản 1–10, mức sửa lỗi L/M/Q/H (mặc định M), chọn mask theo điểm phạt chuẩn. TS thuần, không dùng API Node/DOM → admin-web có thể bundle (`@ottimo/integrations/qr`, CSP `img-src 'self' blob: data:` của SEC F2 vẫn đúng).
- `renderQrSvg`: SVG tự chứa, không `href`/`<image>`/script; màu chỉ nhận `#hex` (không chèn thuộc tính); `title` được escape. `renderQrPng`: PNG xám 8 bit, chỉ Node (`node:zlib`), không xuất từ `./qr`.
- Không thêm thư viện bên thứ ba (không đổi lockfile).

### 2.2 VietQR (`payment/vietqr/`)
- Chuỗi động: `00`=01, `01`=12, `38` {`00` A000000727, `01` {`00` BIN, `01` số TK}, `02` QRIBFTTA}, `53`=704, `54` số tiền, `58`=VN, `62` {`08` nội dung}, `63` CRC-16/CCITT-FALSE trên byte UTF-8. Không có tag 59 (tên chủ TK chỉ để hiển thị cạnh QR).
- `VietQrPaymentAdapter` đủ `PaymentAdapter`: `prepare` (cho BE-B), `createPayment` (`description` = nội dung), `verifyCallback` luôn `ok:false/source_not_allowed` (VietQR không có callback – không fail-open), `callbackAck` 404, `queryStatus` = `pending` (xác nhận bằng tay SM-12 hoặc báo tiền về R3), `healthCheck` `down/not_configured` khi thiếu tài khoản.
- An toàn: không log; thông báo lỗi chỉ nêu tên trường, không bao giờ số TK (có test); trả `accountNoMasked` `••••6789` cho `receivingAccountMasked` (A-29).

### 2.3 Khóa cửa (`doorlock/`)
- `computeDoorValidity`: ngày đến + giờ nhận chuẩn (hoặc nhận sớm đã xác nhận) → ngày đi + giờ trả chuẩn (hoặc trả muộn đã duyệt), offset `+07:00`; khớp ví dụ OpenAPI `2026-10-19T14:00:00+07:00 → 2026-10-22T12:00:00+07:00`.
- `generateDoorCode` (6–10 số, `crypto.randomInt`), `generateBirthdayDoorCode` (ddmm hợp lệ + 3 số ngẫu nhiên), `assertCardsIssued` (0–2), `MAX_KEY_CARDS_PER_ROOM = 2`.
- `ManualDoorLockAdapter`: không trạng thái, không lưu mã; `installed=false`; `label` chỉ dạng `[A-Za-z0-9_-]{1,32}` (chặn tên/SĐT – SEC-08).
- `MockDoorLockAdapter`: như khóa có gateway (`installed=true`), băm mã có muối, `CONFLICT` khi mã trùng đang hiệu lực (khoảng thời gian giao nhau) trên cùng khóa hoặc thẻ thứ 3; thu hồi idempotent; cô lập theo `propertyId`; `accessLog` + `simulateOpen`; `MockScenario` lỗi mạng; `inspect()` không lộ mã.
- `createDoorLockAdapter`: `off` → null, `manual`, `mock`, `ttlock` → `CONFIG` (R3).

### 2.4 Khai báo lưu trú (`guest-registration/`)
- NN: Họ tên (in hoa) · Giới tính · Ngày sinh · Quốc tịch · Số hộ chiếu · Hạn hộ chiếu · Diện nhập cảnh · Số thị thực/thẻ · Tạm trú đến · Ngày nhập cảnh · Cửa khẩu · Mục đích · SĐT · Ngày đến · Ngày đi dự kiến (cắt theo hạn tạm trú – BR-605) · Số phòng. VN: Họ tên · Ngày sinh · Giới tính · Số định danh/CCCD (hoặc hộ chiếu VN) · Quốc tịch · SĐT · Lưu trú từ/đến · Số phòng. Trường trống bị bỏ; ngày `dd/mm/yyyy`.
- Không có tệp xuất (Excel/PDF): chỉ văn bản trong bộ nhớ cho một đơn, đúng SEC E3/A75 và R-REG-07 (client xóa clipboard).

## 3. Kết quả chạy thật (16/10/2026, máy macOS, Node 22)

| Lệnh | Kết quả |
|---|---|
| `vitest run` trong `integrations/` | **8 tệp, 114 test đạt** (cũ 46 + mới 68: qr 10, vietqr 28, doorlock 23, guest-registration 7) |
| Vector chuẩn CRC | `"123456789"` → `29B1` (giá trị kiểm chuẩn CRC-16/CCITT-FALSE); ví dụ phụ lục EMVCo QRCPS-MPM (có chữ Hán UTF-8) → `A13A` – cả hai cũng khớp `binascii.crc_hqx` của Python |
| Vector VietQR | `00020101021238540010A00000072701240006970436011001234567890208QRIBFTTA5303704540716000005802VN62120808OTM0017163046ABE` (TK thử 0123456789 @ 970436, 1.600.000 đ, `OTM00171`) – dựng tay, CRC tính độc lập bằng Python, adapter cho ra đúng từng byte |
| Giải mã QR độc lập | PNG từ bộ mã hóa → Apple CoreImage `CIDetector` (Swift, chạy cục bộ): **50/50** đọc đúng (vector VietQR; phiên bản 1–10 × L/M/Q/H ở đúng dung lượng tối đa; 8 mask; chuỗi UTF-8 có dấu). Không chạy trong CI (cần macOS) – CI giữ test vân tay SHA-256 của ma trận đã kiểm |
| `pnpm -s format:check` | Tệp INT sạch. 5 tệp **của vai khác** chưa format: `apps/admin-web/src/components/states.tsx`, `.../ReservationDialogs.tsx`, `services/api/src/db/schema/frontdesk.ts`, `.../registration.ts`, `.../folio.service.ts` |
| `pnpm -s lint` (ESLint) | `integrations/` 0 lỗi. Lỗi toàn repo đến từ `tests/e2e/playwright-report/**` (báo cáo Playwright sinh ra, chưa nằm trong `ignores`) |
| `turbo run typecheck` | 12/12 xanh |
| `turbo run test` | 10/12 xanh; **đỏ: `@ottimo/api`** – `Cannot find module './attachment-usage'` từ `payments/public/payment.service.ts` và `migrations-journal` (`when` không tăng) – mã Sprint 3 đang làm dở của BE, không liên quan INT |
| `turbo run build` | 6/6 xanh; `integrations/dist/{qr,payment,doorlock,guest-registration}` có đủ |

## 4. File tạo/sửa

Tạo (`product/integrations/`):
- `qr/encoder.ts`, `qr/svg.ts`, `qr/png.ts`, `qr/index.ts`, `qr/qr.test.ts`
- `payment/vietqr/emvco.ts`, `payment/vietqr/adapter.ts`, `payment/vietqr/vietqr.test.ts`, `payment/index.ts`
- `doorlock/access.ts`, `doorlock/manual.ts`, `doorlock/mock.ts`, `doorlock/factory.ts`, `doorlock/index.ts`, `doorlock/doorlock.test.ts`
- `guest-registration/manual.ts`, `guest-registration/index.ts`, `guest-registration/manual.test.ts`
- `rounds/round-02/outputs/INT/s3-report.md` (file này)

Sửa:
- `product/integrations/index.ts` (export 4 nhóm mới), `package.json` (subpath `./qr`, `./payment`, `./doorlock`, `./guest-registration`; mô tả), `tsconfig.json` (include), `README.md` (trạng thái mã; thiết kế TTLock R3 ở 3.4)
- `01-decisions/decision-log.md` (+4 dòng INT)
- Không sửa `contracts/*` (chữ ký interface không đổi → không cần ARC duyệt lại)

## 5. Giả định
- `ctx.credentialsRef` của VietQR = `env:PAYMENT_VIETQR` (BE-B dựng ctx). `payment_receiving_account` trả `{ bankBin, accountNo, accountName }`; BE-B lo quyền OWN + reauth + audit + push (F3).
- VietQR `mock` và `production` dùng cùng một bộ sinh chuỗi (VietQR không có sandbox); R2 dùng **tài khoản thử** (ESC-010 – số TK thật INV chưa gửi).
- Không đưa tên chủ TK (tag 59) vào chuỗi: các app ngân hàng tự hiện tên theo số TK; giữ chuỗi ngắn và giống mẫu NAPAS thông dụng `[Chưa xác minh với tài liệu NAPAS bản đầy đủ – cần quét thử bằng 2–3 app ngân hàng thật trên staging]`.
- Nội dung CK tối đa 25 ký tự `[Chưa xác minh giới hạn từng ngân hàng]`; mã đơn `OTM00171` (8) và số bill `F26000123` (9) nằm xa giới hạn.
- Khóa TTLock: độ dài mã 6–10 theo OpenAPI; giới hạn thật của khóa `[Chưa xác minh]` – adapter đọc `capabilities().codeLength`.
- Khai báo: thứ tự và nhãn trường là đề xuất INT dựa trên BR-606 + EP06 2.2; **lễ tân/DOM đối chiếu với cổng thật** trước khi dùng; URL cổng là cấu hình của cơ sở (không mặc định trong mã).

## 6. Rủi ro / vướng mắc
- **Chưa quét QR bằng app ngân hàng thật** (chỉ giải mã CoreImage + đúng cấu trúc NAPAS). Đề nghị QA thêm ca thủ công trên staging: quét bằng 2–3 app ngân hàng, kiểm hiện đúng BIN/số TK thử/số tiền/nội dung – không chuyển tiền.
- `pnpm lint` toàn repo đỏ do `tests/e2e/playwright-report/**` (QA/OPS); `@ottimo/api` test đỏ do mã đang làm của BE-B; 5 tệp chưa format của BE/FE. Không thuộc vùng INT, không sửa.

## 7. Yêu cầu vai khác (không sửa file của họ)
| Gửi | Yêu cầu |
|---|---|
| BE-B | `createVietQr`: gọi `VietQrPaymentAdapter.prepare(ctx, { amountVnd: <server tính>, transferContent: <mã đơn/số bill> })`; `IntegrationError` `CONFIG` → 409 `PAYMENT_NOT_CONFIGURED`, `INVALID_REQUEST` → 422; trả `qrPayload`, `receivingAccountMasked = accountNoMasked`. Truyền `receivingAccount` đọc tham số `payment_receiving_account`. Không ghi `qrSvg`/số TK vào log |
| BE-A | `setDoorCredential`/`checkIn`: `computeDoorValidity` cho hiệu lực mặc định, `generateDoorCode()` khi `code` trống (vẫn kiểm trùng/90 ngày trong DB – D2), `assertCardsIssued`; adapter từ `createDoorLockAdapter(DOORLOCK_PROVIDER)`; `installed=false` → tạo việc "Cài mã trên app khóa"; `checkOut`/hủy/no-show/đổi phòng → `revoke` + việc "Xóa mã căn X" (D3) |
| BE-C | `getPortalData`: cài `RegistrationDataPort.loadStay` (giải mã sau khi ghi `c3_access_log`), gọi `preparePortalData(ctx, stayId, kind)`; `mark-sent` gọi `recordSubmission` để kiểm `portalReference` |
| FE | Vẽ QR bằng `renderQrSvg(qrPayload)` từ `@ottimo/integrations/qr` (trong bundle) hoặc dùng SVG API trả; không dùng `img.vietqr.io` (F2) |
| QA/OPS | Thêm `tests/e2e/playwright-report/**` vào `ignores` của `eslint.config.js` (hoặc xóa báo cáo khỏi cây mã) để `pnpm lint` xanh |
| ARC, SEC | Review chéo INT Sprint 3 (`ARC-on-INT.md`, `SEC-on-INT.md`): đặc biệt bộ mã hóa QR tự viết, quy tắc nội dung CK, mock khóa băm mã, khai báo không xuất tệp |
| DOM | Đối chiếu thứ tự/nhãn trường khai báo với cổng thật (BR-606) |

## 8. Việc chưa xong / R3
- Adapter TTLock thật (khi INV có tài khoản TTLock Open Platform + gateway), BankFeed (SePay/payOS) để tự đối soát VietQR, MISA `EInvoiceAdapter`, VNPay/MoMo sandbox (ESC-010).
- Mock PaymentAdapter VNPay/MoMo (`emitCallback`, `scrubCardData` 2 tầng – F10) chưa làm vì R2 chỉ bật VietQR (P-R2-6); làm cùng VNPay sandbox R3.
