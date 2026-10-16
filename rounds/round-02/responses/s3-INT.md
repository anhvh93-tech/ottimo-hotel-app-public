# INT – phản hồi thẻ Round 2, Sprint 3 (bước Phản hồi & sửa)

- Vai: INT | Ngày: 17/10/2026 | Không commit (ORC commit)
- Nguồn: chỉ đạo ORC 17/10 (một nguồn dữ liệu cổng khai báo = BE-C); `rounds/round-02/reviews/s3-ARC.md` (thẻ có "Vị trí: INT": BE-S3-20 phần INT, BE-S3-29), `s3-SEC.md` (FB-R2-SEC-INT-06), `s3-DOM.md` (FB-R2-DOM-INT-01, S3-16).
- Vùng sửa: `product/integrations/**` (+ `01-decisions/decision-log.md`, báo cáo INT). Không sửa mã của BE/OPS: phần cần vai khác làm nằm ở mục "Yêu cầu vai khác".

## ARC-on-INT

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-ARC-BE-S3-20 (phần INT) | Major | Done | `guest-registration/manual.ts` **không còn dựng trường**: đã xóa `portalFields`, `clipboardTextFor`, `toPortalDate`, `foreignerFields`/`citizenFields`, phần cắt ngày theo BR-605, kiểu `RegistrationPersonSource`/`RegistrationStaySource`/`RegistrationDataPort`/`PortalDataBlock` và cấu hình `portalUrls`. Nguồn duy nhất là BE-C `registration/internal/rules.ts` (ngày theo `portal_date_format`, quốc tịch theo `portal_nationality_format`, BR-605). Còn lại: (1) `ManualGuestRegistrationAdapter(source: RegistrationPortalSource)` – `prepare` chỉ chuyển tiếp `GuestRegistrationPrepared` do lõi dựng (contract 3.6 không đổi) và từ chối URL cổng không phải https (`CONFIG`); (2) `recordSubmission` kiểm mã hồ sơ; (3) `PORTAL_REFERENCE_PATTERN` + `validatePortalReference`, `assertPortalUrl`. URL cổng do BE-C đọc (`portal-config.ts`, `GUEST_REGISTRATION_PORTAL_URL_*`) – INT không đọc lần hai. Test: `prepare` trả đúng đối tượng của lõi; URL http → `CONFIG`; module không còn export hàm dựng trường; mã hồ sơ hợp lệ/không hợp lệ |
| FB-R2-ARC-BE-S3-29 | Minor | Done | (1) `now` **bắt buộc** ở `VietQrPaymentAdapter` (và ở `ManualDoorLockAdapter`, `createDoorLockAdapter` – adapter dùng ở production, cùng quy tắc ADR-008). Mock vẫn có giờ cố định mặc định cho test xác định. (2) Bỏ nhánh `PAYMENT_VIETQR_*`: nguồn duy nhất là `receivingAccount` (tham số `payment_receiving_account`, bắt buộc) – xem SEC-INT-06. (3) Xóa `maskAccountNo` và trường `accountNoMasked`/`accountSource` khỏi `VietQrPrepared`: mẫu che duy nhất là BE-B `maskedAccountNo` (`9704••••1234`). Mã chết `maskAccount` phía api: BE-B đã xử lý (`payments/internal/vietqr.ts` chỉ còn bọc `buildVietQrPayload`/`normalizeTransferContent`/`crc16Ccitt` của INT). Test: không còn export `maskAccountNo`; `healthCheck` trả đúng giờ của Clock tiêm vào |

## SEC-on-INT

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-SEC-INT-06 | Suggestion | Done (xóa hẳn) | Chọn phương án mạnh hơn: **xóa hẳn** đường rơi về `.env` ở mọi môi trường (không giữ cho dev/test – để không có hai đường mã khác nhau giữa dev và production). `VietQrAdapterOptions` không còn `credentials`; tham số trống → `CONFIG` ("not configured", không số TK) → BE-B 409 `PAYMENT_NOT_CONFIGURED`; `healthCheck` → `down / not_configured`. **Thêm lớp chặn cấu hình**: `common/safe-config.ts` từ chối khởi động (mọi `APP_ENV`) khi `PAYMENT_VIETQR_BANK_BIN`/`_ACCOUNT_NO`/`_ACCOUNT_NAME` có giá trị – tránh người vận hành tưởng đã đổi tài khoản qua env mà không có audit; thông báo chỉ nêu tên biến (test: 4 môi trường, không lộ giá trị). `.env.example` hiện để trống 3 biến này nên api vẫn khởi động (`config.test.ts` 27/27 xanh) |

## DOM-on-INT

| ID | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R2-DOM-INT-01 (S3-16) | Minor | Done | Theo BR-403 v0.3.4. `computeDoorValidity` thêm: `actualCheckInAt` – sớm hơn giờ nhận chuẩn/nhận sớm thì `validFrom` = lúc nhận thực tế (B9a 04:40 → `2026-10-20T04:40:00+07:00`); `lateGraceUntil` + `sameDayArrival` – không hẹn trả muộn **và** lõi báo `sameDayArrival === false` → `validTo` = mốc ân hạn (12:30); có khách đến hoặc lõi không báo → giờ trả chuẩn (an toàn mặc định); giờ trả muộn đã hẹn luôn thắng. Lõi vẫn thu hồi ngay khi B18. **Mã yếu**: `isWeakDoorCode` (mọi chữ số giống nhau; dãy tăng/giảm liên tiếp, tính cả vòng 9→0 như `789012`) – mọi adapter (`assertCreateDoorCode`) từ chối `INVALID_REQUEST` không lộ mã; `generateDoorCode`/`generateBirthdayDoorCode` không bao giờ sinh mã yếu. **Mã chỉ là ngày sinh**: `matchesBirthdayWithoutRandom(code, dateOfBirth)` (ddmm, ddmmyy, ddmmyyyy, yymmdd, yyyymmdd, mmdd, mmddyy, mmddyyyy) cho lõi gọi – adapter không có ngày sinh (C3). Test: 7 ca hiệu lực (ân hạn, có khách đến, không rõ, trả muộn thắng, B9a, nhận muộn hơn chuẩn, dữ liệu sai), 7 mã yếu + 4 mã không yếu, 200 mã sinh không yếu, adapter từ chối mã yếu, 6 dạng ngày sinh |

## Kết quả chạy (17/10/2026, Node 22)

| Lệnh | Kết quả |
|---|---|
| `vitest run` (`integrations/`) | **8 tệp, 133/133 đạt** (doorlock 44, vietqr 27, qr 10, guest-registration 5, safe-config 9, scrub 24, env-credential 8, notification 6) |
| `turbo run typecheck build --filter=@ottimo/integrations --filter=@ottimo/api` | 5/5 xanh (api vẫn biên dịch với gói INT đã đổi) |
| api `test/config.test.ts`, `test/be-b-s3-units.test.ts` | 27/27, 14/14 xanh (luật safe-config mới không làm hỏng `.env.example`; bọc VietQR của BE-B không đổi kết quả) |
| `eslint integrations`, `prettier --check` (tệp mã INT) | Sạch |

## File đã sửa
- `product/integrations/guest-registration/manual.ts`, `manual.test.ts` (viết lại)
- `product/integrations/payment/vietqr/adapter.ts`, `emvco.ts` (bỏ `maskAccountNo`), `vietqr.test.ts`
- `product/integrations/doorlock/access.ts`, `manual.ts`, `factory.ts`, `doorlock.test.ts`
- `product/integrations/common/safe-config.ts`, `safe-config.test.ts`
- `product/integrations/README.md` (trạng thái mã, 3.2 VietQR, 3.6 một nguồn dữ liệu cổng, mục 4 bỏ 3 biến VietQR)
- `rounds/round-02/outputs/INT/s3-report.md` (ghi chú cập nhật interface 17/10), `01-decisions/decision-log.md` (+2 dòng)

## Yêu cầu vai khác (không sửa file của họ)
| Gửi | Yêu cầu |
|---|---|
| OPS | Xóa `PAYMENT_VIETQR_BANK_BIN/_ACCOUNT_NO/_ACCOUNT_NAME` khỏi `product/.env.example` (dòng 112–114) và `infra/docker-compose.prod.yml` (dòng 68–70). Giữ trống thì vẫn chạy; đặt giá trị thì api **từ chối khởi động** (cố ý – SEC-INT-06) |
| BE-C | (Gợi ý) `registration.service.ts` `mark-sent` đang tự viết lại regex mã hồ sơ `^[A-Za-z0-9\-/._]{3,64}$` – có thể dùng `validatePortalReference`/`PORTAL_REFERENCE_PATTERN` của `@ottimo/integrations/guest-registration` để chỉ còn một bản; hoặc giữ bản BE-C và INT bỏ hằng này – ARC chọn, INT làm theo |
| BE-A | R3 (`setDoorCredential`): truyền `actualCheckInAt`, `lateGraceUntil` (tham số `late_grace_until`) và `sameDayArrival` (BR-412: có đơn `confirmed`/`hold` gán căn, ngày đến = ngày trả) cho `computeDoorValidity`; gọi `matchesBirthdayWithoutRandom` với ngày sinh của khách trước khi nhận mã nhập tay; mã yếu → đề nghị ARC thêm mã trường `DOOR_CODE_WEAK` (422) khi hợp đồng R3 có |
| DOM | Xác nhận cách hiểu "dãy tăng/giảm liên tiếp" tính cả vòng 9→0 (`789012`, `210987`). Nếu DOM muốn chặn thêm mẫu lặp (`121212`, `123123`), ghi vào BR-403 – INT thêm vào `isWeakDoorCode` |
