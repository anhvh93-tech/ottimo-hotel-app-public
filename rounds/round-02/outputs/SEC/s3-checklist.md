# Checklist bảo mật Sprint 3 (Round 2) – cho BE-A, BE-B, FE, MOB, INT, OPS

- Người viết: SEC | Ngày: 16/10/2026 | Áp cho: mọi PR Sprint 3 (EP03–EP05, EP15, EP06, guest-web check-in online)
- Nguồn: `product/docs/security/security-requirements.md` (SR-*), `outputs/SEC/w1-review.md` mục 4 (ĐK-1…6), `outputs/SEC/s1-decisions.md`, `reviews/s2-SEC.md` (mục Kiểm lại ĐK-S2-7), `outputs/ARC/s2-contract.md` mục 4, specs EP03-05 và EP06.
- Cách dùng: tác giả PR đánh dấu từng dòng liên quan trong mô tả PR (Đạt / Không áp dụng). SEC review chéo Sprint 3 kiểm theo đúng bảng này. Dòng có **[CHẶN]** mà sai thì là Blocker: SEC không cho merge.
- Mã trong ngoặc là yêu cầu gốc; bảng này chỉ nhắc điểm hay sai, không thay tài liệu gốc.

## A. Chung cho mọi endpoint mới (BE-A, BE-B)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| A1 **[CHẶN]** | Operation có `x-roles`, `x-scope`; phạm vi lọc **trong SQL**; ngoài phạm vi hoặc khác cơ sở → 404 (SR-AZ-02, -05). Mọi id con (`documentId`, `imageId`, `paymentId`, `lineId`, `attachmentId`) kiểm thuộc đúng đối tượng cha | Ca "id của đơn khác/cơ sở khác → 404" cho mỗi id trong đường dẫn và body |
| A2 **[CHẶN]** | Ghi tiền hoặc ghi C3: `Idempotency-Key` (+ `If-Match` nếu có version) và `recordMoney`/`c3_access_log` trong **cùng giao dịch** | Gửi lại cùng key → một bản ghi; mỗi bảng tiền có `audit_event money` cùng `request_id` |
| A3 **[CHẶN]** | Operation có cờ `dryRun` trong OpenAPI (Sprint 3: **`setLateCheckout`**): guard đã bỏ kiểm header cho `dryRun: true`, nên đường dryRun **phải** chạy qua `read()`/giao dịch `readOnly: true`, giống `cancelReservation`. Không bao giờ dùng `uow.run` cho đường dryRun | `setLateCheckout` `dryRun: true`, không có header → 200 và **không** có dòng mới trong `folio_line`/`reservation_change`/`audit_event` |
| A4 | Ô văn bản tự do (ghi chú, lý do, `note`, `posAuthCode`, `replyNote`): ≤ giới hạn spec, Luhn → `422 CARD_NUMBER_DETECTED`, bỏ ký tự điều khiển (SR-PAY-10, V-09) | Một ca Luhn cho mỗi ô |
| A5 | Không đưa C2/C3 vào URL/query, log, `outbox_message.payload`, SSE, push, `idempotency_key.response_body` (SR-C3-02, -05). Push chỉ gồm loại sự kiện, số căn, mã đơn | Test quét JSON các đường này theo danh mục `c3Columns` |
| A6 | Lỗi khóa/deadlock tự về 409 `CONCURRENT_UPDATE` nhờ bộ lọc chung. **Không** tự bắt `55P03`/`40P01` rồi trả 500, **không** đặt `lock_timeout = 0`. Truy vấn dài (báo cáo) tự `SET LOCAL statement_timeout` lớn hơn | Review |

## B. Giấy tờ C3 mã hóa (BE-B; FE màn S09/K3–K10)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| B1 **[CHẶN]** | Mã hóa qua `CryptoService` duy nhất: AES-256-GCM, nonce 96 bit ngẫu nhiên, AAD = `table\|column\|record_id\|kek_version`, **một DEK cho mỗi** `guest_document`, mỗi ảnh, mỗi `door_credential`, mỗi `reservation_guest` có dữ liệu trẻ em (SR-KEY-01, -02). Module khác không import bảng `data_key` hay biến KEK (lint) | Đổi AAD → giải mã lỗi; lint import |
| B2 **[CHẶN]** | Số giấy tờ: lưu `_enc` + `_hmac` (`ID_HASH_KEY`, HMAC-SHA256) + `last4`. Danh sách/DTO thường chỉ có `docNumberLast4`. Số đầy đủ chỉ có ở `getGuestDocumentSensitive` (SR-AZ-04, SR-KEY-07) | Snapshot JSON 8 vai: HK/MT/SAL/CTV không có **bất kỳ** trường giấy tờ nào, kể cả `docType` |
| B3 **[CHẶN]** | Endpoint C3 của nhân viên: thứ tự kiểm **thiết bị → step-up → quyền → lý do → ghi `c3_access_log` → trả dữ liệu**. Lỗi ghi log → 503, không trả dữ liệu (SR-C3-07, -09, SR-DEV-03). Phản hồi `Cache-Control: no-store` + `Pragma: no-cache` (SR-C3-03) | Không cookie thiết bị → 403 `DEVICE_NOT_TRUSTED` + audit; hết cửa sổ 15 phút → 401 `REAUTH_REQUIRED`; giả lỗi ghi log → không có dữ liệu |
| B4 | Lý do xem (`recheck`/`guest_request`/`authority_request`) bắt buộc ngoài luồng đang mở của chính đơn (EP06 mục 0); `reason_code` ghi vào `c3_access_log` | Ca thiếu lý do → 422 |
| B5 | FE: số đầy đủ tự ẩn sau 60 giây và **ngay** khi `visibilitychange`, rời màn hoặc đăng xuất; không giữ trong store toàn cục; không refetch ngầm (SR-C3-11) | E2E: ẩn tab → số biến mất; không có request khi focus lại |

## C. Ảnh giấy tờ, tải tệp, thời hạn xóa (BE-B, BE-A job J16, OPS)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| C1 **[CHẶN]** | Một pipeline tải tệp dùng chung (giấy tờ, guest-web, đính kèm B-01): nhận JPEG/PNG/WebP theo **magic bytes**; HEIC → 422 `FILE_REJECTED`; ≤ 10 MB, ≤ 40 MP (`sharp` `limitInputPixels`), đồng thời 1–2 ảnh; **mã hóa lại** (decode → encode) và bỏ toàn bộ EXIF/GPS; xử lý trong bộ nhớ, không ghi tệp tạm dạng rõ (SR-FILE-01…04) | Tệp `.jpg` chứa HTML → 422; ảnh có GPS gửi thẳng API → bản lưu không có EXIF; 50 MP → 422 |
| C2 **[CHẶN]** | Lưu blob đã mã hóa (DEK riêng mỗi ảnh), tên ngẫu nhiên, quyền tệp 600, thư mục 700; volume **không** được Caddy phục vụ; không URL công khai, không URL ký sẵn (SR-C3-04, SR-FILE-04) | Truy cập trực tiếp đường dẫn volume qua Caddy → 404 |
| C3 | Giới hạn số lượng: ≤ 4 ảnh/người/giấy tờ, ≤ 30 tệp/đơn từ app khách; body Caddy 25 MB (SR-FILE-02). "Tải lại" ảnh của một người: hủy DEK ảnh cũ **ngay** trong cùng giao dịch, không giữ bản cũ | Ảnh thứ 5 → 422; tải lại → DEK cũ có `destroyed_at` |
| C4 | Xem ảnh: `Content-Disposition: inline; filename="document"`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox; default-src 'none'`, `no-store` (SR-FILE-06, SR-C3-03). FE hiển thị có watermark (người xem + thời điểm + "Chỉ dùng khai báo lưu trú"), không nút tải, không `<a download>`, thu hồi object URL khi đóng (SR-C3-10) | Test header; E2E không có nút tải |
| C5 **[CHẶN]** | Xóa = hủy DEK + xóa blob + `c3_access_log purge` (actor `system`) + `purge_journal`; không khôi phục được. Người **không** đồng ý, trẻ em dưới ngưỡng, khai báo `void`, rút đồng ý: xóa ngay khi `confirmed`/`void`/rút, qua outbox, mục tiêu ≤ 15 phút. J16 chạy hằng giờ làm lưới an toàn: hạn trên 24 giờ (T01); người đồng ý: trả phòng + `id_image_retention_days_after_checkout` (T02) (SR-RET-02, -03) | `Clock` giả: `confirmed` → ảnh mất sau một lượt outbox; J16 bắt ca sót; khôi phục no-show **không** khôi phục ảnh |
| C6 | Thời hạn đọc từ `config_parameter`, chỉ OWN sửa, có biên, audit `config` (SR-RET-01). J16 ghi `retention_run` (không dữ liệu cá nhân); OPS cảnh báo khi J16 lỗi hoặc không chạy trong 26 giờ (SR-RET-03) | Test quyền; cấu hình cảnh báo |
| C7 | `purgeRegistrationImages` chỉ OWN/MGR, có `If-Match`, `reason` enum; FD/FDL → 403 (A74) | Test vai |

## D. Thiết bị được cấp và mã cửa khi nhận phòng (BE-A/BE-B, FE)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| D1 **[CHẶN]** | Mọi bước C3 trong nhận phòng (nhập/xem giấy tờ, xem/đặt mã cửa, render tin `door_code`) chỉ chạy trên thiết bị được cấp mở admin-web. PWA `mobile` không bao giờ `device_trusted` (SR-DEV-03, -04) | Cùng tài khoản FD từ origin PWA → 403 |
| D2 **[CHẶN]** | Mã cửa: 6 chữ số từ CSPRNG, không trùng mã đang hiệu lực, không tái dùng cho căn trong 90 ngày (SR-LOCK-01). `setDoorCredential` trả bản che. Mã cửa không có trong `Reservation`, `checkIn` response, SSE, push, audit (SR-C3-02) | Unit test sinh mã; quét JSON `checkIn` |
| D3 | `checkOut`/hủy/no-show: `door_credential.revoked_at` đặt ngay trong cùng giao dịch; chế độ thủ công tạo việc "Xóa mã căn X" (SR-LOCK-04) | Test B18 |
| D4 | FE: `Me.properties[].deviceTrusted` chỉ để ẩn nút; server vẫn kiểm (SR-DEV-05). Không lưu mã cửa hay số giấy tờ vào `localStorage`/`sessionStorage` (SR-PWA-07) | Grep + E2E |

## E. Khai báo lưu trú bán tự động (BE-B, FE)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| E1 **[CHẶN]** | `getPortalData`: thiết bị + step-up + `no-store`; **mỗi lần lấy = 1 dòng `c3_access_log view`, ghi trước khi trả**; mỗi `kind` của khai báo `mixed` là một lần lấy riêng; giới hạn SR-RL-06 (cảnh báo 60/giờ, chặn 200/giờ) | N lần lấy → N dòng `view`, 0 dòng `copy`; lỗi ghi log → 503 |
| E2 | FE: không gọi lại ngầm; nút "Sao chép" từng trường; "Sao chép tất cả" chỉ theo **từng người**, không là nút mặc định; clipboard ghi đè rỗng sau 60 giây và khi rời màn/ẩn tab; luôn có nút "Xóa bộ nhớ tạm" (SR-C3-11) | E2E |
| E3 | Không endpoint nào xuất danh sách giấy tờ nhiều người (A75). Không gửi dữ liệu giấy tờ ra bên thứ ba (Cổng khai báo nhập tay ở R2) (SR-AZ-10, SR-INT-03) | Lint OpenAPI |
| E4 | `visa_alert_on` đặt NULL khi đơn kết thúc hoặc khai báo `void`; mục "Cần chú ý" `visa_expiring` chỉ chứa mã đơn (SR-RET-06) | Test |

## F. Thu tiền, VietQR, đối soát, đảo, hoàn tiền (BE-B, INT, FE)

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| F1 **[CHẶN]** | Số tiền VietQR do **server** tính (còn phải thu hoặc cọc còn thiếu), ≤ còn phải thu; nội dung chuyển khoản **chỉ** mã đơn/số bill bỏ gạch (`OTM00171`), không tên, không SĐT (SR-PAY-06). Chưa cấu hình tài khoản nhận → 409 `PAYMENT_NOT_CONFIGURED`, không vẽ QR giả | Ca vượt số phải thu → 422; snapshot nội dung |
| F2 **[CHẶN]** | Ảnh QR **sinh tại chỗ** (thư viện trong bundle hoặc server). **Không** gọi dịch vụ ảnh QR bên ngoài (img.vietqr.io, Google Chart…): lộ số tiền + mã đơn cho bên thứ ba và mở đường tráo ảnh. INT: nếu muốn dùng API VietQR của bên thứ ba → hỏi SEC trước | Review; CSP admin-web `img-src 'self' blob: data:` |
| F3 **[CHẶN]** | Tài khoản nhận tiền (`payment_receiving_account`) là điểm gian lận số một (tráo số tài khoản): chỉ OWN sửa, xác nhận lại mật khẩu (step-up), audit `money` (cũ/mới che giữa), push tới **mọi** OWN/MGR khi đổi; QR tạo trong 24 giờ sau khi đổi hiện cảnh báo "Tài khoản nhận vừa đổi" cho lễ tân | Test quyền + audit + push |
| F4 | Thu tiền do người không có vai FD+ ghi → `reconciliation = pending` với **mọi** phương thức (đã có ở `confirmDeposit`, áp cả `recordPayment` của SAL); `receivedAt` của SAL lùi ≤ `staff_payment_backdate_max_hours`; FD+ nhập bù > 24 giờ bắt buộc `note` (EP03-05 2.2) | Test như `folio-payments.test.ts:544–570` cho `recordPayment` |
| F5 **[CHẶN]** | Đối soát (`reconcilePayment`): người đối soát khác **cả** người ghi **và** người xác nhận thấy tiền, so theo `user_id`, kiểm dưới `FOR UPDATE` **và** bằng CHECK ở DB; OWN được tự đối soát nhưng ghi `selfReconciled=true` vào audit `money` và báo cáo; MGR không có ngoại lệ; `disputed` không tự đảo, cảnh báo OWN + MGR khác người ghi (s1-decisions Q-S5) | Người ghi đối soát → 403 `SELF_RECONCILE_FORBIDDEN`; UPDATE thẳng DB vi phạm CHECK → lỗi |
| F6 | ESC-017 A (SEC-BE-22 điểm 4): hoa hồng của đơn mà khoản cọc do sale/CTV ghi chỉ chuyển `earned` khi khoản cọc đã `reconciled`. Nếu Sprint 3 chưa có `earned` thì để TODO có mã thẻ trong code + test đỏ bị skip có lý do | Test khi có `earned` |
| F7 | Đảo giao dịch: MGR+, `reason` bắt buộc, tạo bản ghi đảo trỏ gốc, không xóa, không UPDATE số tiền (DB đã chặn) (SR-AUD-01, BR-008) | Test |
| F8 **[CHẶN]** | Hoàn tiền (khi làm – US-123 là R3, cọc hủy BR-309 nếu có trong Sprint 3): luôn qua `approval_request` (người tạo ≠ người duyệt, CHECK DB); số hoàn ≤ đã thu − đã hoàn, tính ở server; số tài khoản nhận hoàn là C3: `refund_account_enc` với DEK riêng, chỉ trả 4 số cuối, Luhn → từ chối (không nhận số thẻ); hủy DEK khi giao dịch hoàn `succeeded` (T09); đổi tài khoản sau khi duyệt → phải duyệt lại; tiền qua cổng hoàn về đúng phương thức gốc, không sang tài khoản khác | Test tự duyệt → 403; đổi tài khoản → về `pending` |
| F9 | `checkOut.finalPayment` ghi trong cùng giao dịch B18; không có thẻ: chỉ `card_brand`/`card_last4` nếu cổng trả; `posAuthCode` 1–12 ký tự + Luhn (SR-PAY-08) | Test |
| F10 | INT (VNPay/MoMo vẫn mock ở R2): route `mock` không đăng ký khi `APP_ENV=production`; mọi payload qua `scrubCardData` 2 tầng trước khi lưu/log (SR-PAY-05, -09) | Kiểm bảng route production |

## G. Guest-web check-in online mức 1 (MOB, BE) – ĐK-1…6 + s1-decisions

| # | Việc phải có | Test tối thiểu |
|---|---|---|
| G1 **[CHẶN] ĐK-1** | Không đăng ký route `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode` (hoặc trả cố định 403 `GUEST_VERIFICATION_REQUIRED`). `openGuestSession` luôn `level: 1`, `emailOtpAvailable: false`, `level2ExpiresAt: null` | Test API mỗi PR |
| G2 **[CHẶN] ĐK-2** | Serializer theo `x-guest-level`: JSON mức 1 **không bao giờ** có khóa `guestFullName`, `doorCode` (kể cả `null`). Khóa được phép của `OnlineCheckin` = `currentStep, requiredPeople, uploadedPeople, etaTime, consentRecorded, completedAt, noticeAccepted, lateArrival, deferredPeople`; khóa khác → test đỏ. `arrivalNote` chỉ ghi (`writeOnly`), C2, D23, không vào push/outbox/audit/log | Test "JSON mức 1 không có trường cấm" chạy mỗi PR |
| G3 **[CHẶN] ĐK-3** | Không hiện lại ảnh/số/loại giấy tờ khi mở lại link (chỉ "đã có n/m"); **không lưu** ảnh hay số giấy tờ trong `localStorage`/`sessionStorage`/IndexedDB/Cache Storage/service worker, kể cả để gửi lại khi mất mạng; thu hồi object URL ngay sau khi gửi hoặc rời bước; không có màn OTP, folio, mã cửa | SEC review PR guest-web; DevTools trên staging; test CI dump storage sau luồng |
| G4 **[CHẶN] ĐK-4** | Token 256 bit CSPRNG, DB lưu SHA-256, trả một lần (SR-GST-01); `/g/{token}` → `POST /v1/guest/sessions` (token trong body) → cookie `__Host-ottimo_gsid` (`HttpOnly; Secure; SameSite=Strict`) → `history.replaceState` về `/`; `Referrer-Policy: no-referrer` (SR-GST-02); Caddy + API che `/g/*` trong log (SR-GST-03); cấp lại link thu hồi mọi token và phiên cũ (SR-GST-04); quá hạn → 401 `GUEST_LINK_INVALID`; sau trả phòng → 403 `GUEST_STAY_ENDED` (SR-GST-11); đơn hủy/no-show thu hồi token trong cùng giao dịch (B-13) | E2E: sau mở link `location.href` không chứa token; log Caddy không có token |
| G5 **[CHẶN]** | CSP guest-web: `default-src 'self'; script-src 'self'; img-src 'self' blob: data:; connect-src 'self' <origin API>; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`. Không script/font/analytics bên thứ ba (SR-GST-03). Endpoint ghi của khách kiểm `Origin` (như TC-SEC-024) | Kiểm header staging |
| G6 | Chuẩn hóa ảnh ở client (canvas → JPEG ~0,85, cạnh dài ≤ 2.500 px, mất EXIF); server vẫn mã hóa lại (C1). Ảnh khách tải **chỉ ghi**, không có endpoint khách đọc lại (SR-C3-06) | Thử iPhone Safari + Android thật |
| G7 **ĐK-5** | Đồng ý lưu ảnh: chỉ Khách 1 qua `channel=guest_app`; `personIndex ≠ 1` → server từ chối; người đi cùng chưa trả lời khi khai báo `confirmed` = **không** đồng ý; hai nút ngang hàng, không chọn sẵn; `noticeAccepted` chỉ `true` với `noticeVersion` hiện hành, lưu phiên bản + ngôn ngữ + thời điểm. Rút đồng ý qua lễ tân (`granted → refused` ở Desk xóa ảnh – C5); câu `guest.oci.withdraw_hint` đã duyệt | Test API |
| G8 **ĐK-6** | Không dùng chuỗi `guest.verify.*`, `guest.door_code*`, `guest.late.done_title`, `guest.late.code_*`, `guest.late.how_*`, `guest.late.prompt`, `guest.late.arrival_hint`, `guest.tab.bill`, `guest.bill.*`, `guest.after_checkout.body`; `guest.oci.done_body` bản R2 | Test CI quét bundle `dist` guest-web |
| G9 | Giới hạn: `updateOnlineCheckin` + `completeOnlineCheckin` ≤ 20 lần ghi/ngày/đơn; upload ≤ 30 tệp/đơn (SR-RL-05); `openGuestSession` theo IP (SR-RL) | Test 429 |

## H. Việc chuyển từ Sprint 2 – bắt buộc xong trong Sprint 3

| # | Việc | Vai | Hạn |
|---|---|---|---|
| H1 | SR-RL-09: 600 request/phút/người (bộ đếm RAM, 1 replica), 429 + `Retry-After`; trước khi guest-web lên staging | BE (chung) | Trước cổng QC Sprint 3 |
| H2 | SEC-BE-31: cổng sales-port nhận `actor` của phiên (`loadReservation(tx, id, actor)` → 404 ngoài phạm vi); chỉ job dùng `SYSTEM_ACTOR` | BE-A | **Trước** khi thêm đường gọi port mới của Sprint 3 |
| H3 | Vai DB: `02-roles.sh` chỉ chạy khi khởi tạo volume mới. Thêm bước idempotent ở deploy/khởi động (hoặc migration chạy bằng `ottimo_owner`) để áp `ALTER ROLE ottimo_app SET idle_in_transaction_session_timeout = '30s'` và `statement_timeout = '15s'` cho DB đã có (stack tạm, staging) + kiểm bằng `SELECT rolconfig FROM pg_roles WHERE rolname = 'ottimo_app'` trong smoke | OPS | Khi dựng staging |
| H4 | A3 (dryRun `setLateCheckout` chạy readOnly) và F6 (`earned` sau đối soát) | BE-A, BE-B | Theo story |
| H5 | Cảnh báo `job_run.stats.failures` khác rỗng lặp lại (giữ chỗ hỏng) – SR-LOG-06 | OPS, BE-A | R3 (ghi nhận) |

## I. Đính kèm vận hành – `getAttachment` (B-01), quyết định SEC 16/10

Áp cho `uploadAttachment` + `getAttachment` khi BE cài (Sprint 3 cần `deposit_receipt`, `penalty_evidence`).

| # | Quyết định |
|---|---|
| I1 | **Duyệt** thiết kế ARC B-01 (phạm vi theo `purpose`, ngoài phạm vi → 404). Bổ sung: `deposit_receipt` – FD+ và **người tải** (SAL/CTV, phạm vi own) **và** đơn vẫn trong phạm vi của họ; `penalty_evidence`, `meter` – FD+; `work_order` – ai thấy phiếu; `inspection` – FD+ và HK người chụp |
| I2 | Pipeline như C1–C2 (magic bytes, mã hóa lại, bỏ EXIF, giới hạn), lưu **mã hóa bằng DEK riêng mỗi tệp** qua `CryptoService` (dùng lại pipeline ảnh giấy tờ: một đường code, xóa = hủy DEK). Đính kèm là C2 (biên nhận chuyển khoản có tên + số tài khoản người chuyển), không phải C3: không cần thiết bị được cấp hay step-up, không ghi `c3_access_log` |
| I3 | Header: `Content-Disposition: inline; filename="attachment"` (không lộ tên gốc), `nosniff`, `Content-Security-Policy: sandbox; default-src 'none'`, `Cache-Control: private, no-store`, `Cross-Origin-Resource-Policy: same-origin`. Không URL ký sẵn; FE lấy bằng `fetch` có cookie → object URL → thu hồi khi đóng |
| I4 | **Không bao giờ** dùng `attachment` cho giấy tờ tùy thân: `purpose` là enum đóng (không có `id_document`); guest-web không gọi `uploadAttachment`; UI có dòng nhắc "Không chụp giấy tờ tùy thân ở đây" |
| I5 | Thời hạn lưu (trả lời E07-12 a) – tham số `config_parameter`, OWN sửa, có biên: `work_order`, `inspection`: 12 tháng sau khi phiếu/lần kiểm đóng (`attachment_ops_retention_months`, biên 3–24); `deposit_receipt`: 90 ngày sau khi khoản thu `reconciled` (`deposit_receipt_retention_days`, biên 30–365), `disputed` thì giữ tới khi xử lý xong + 90 ngày; `penalty_evidence`: 12 tháng sau trả phòng hoặc tới khi khiếu nại đóng, lấy mốc muộn hơn; `meter`: 12 tháng sau khi HĐ dài hạn kết thúc. J16 xóa (hủy DEK + xóa blob + `purge_journal`). [GIẢ ĐỊNH SEC – kế toán/luật sư xác nhận ảnh biên nhận có phải chứng từ T08 10 năm không; đề nghị ORC gom vào câu phụ ESC-001] |
| I6 | E07-12 (b): **cho phép** PWA giữ ảnh kiểm phòng chờ gửi trong IndexedDB như ảnh sự cố (≤ 20 ảnh × 300 KB, xóa khi server xác nhận, xóa khi đăng xuất/đổi người – SR-PWA-01, -04); ảnh không được chụp khách hay giấy tờ (nhắc trên màn). (c): **xác nhận** ghi chú khách (D23) **không** cache offline |
| I7 | Giới hạn: 20 tệp/phiếu hoặc lần kiểm; 50 tệp/người/ngày; tính vào SR-RL-09 |

## J. Mục ARC chờ SEC thuộc Sprint 4 – quyết sớm để ARC đưa vào 0.3.6

| Mục | Quyết định SEC 16/10 | Điều kiện |
|---|---|---|
| B-15 `declinedReasonCode` + `replyNote` cho khách | **Duyệt có điều kiện** (ĐK-2) | `replyNote` do nhân viên viết nhưng hiện ở **mức 1** (ai có link cũng đọc được) → ≤ 300 ký tự, Luhn → `CARD_NUMBER_DETECTED`, và **từ chối chuỗi ≥ 6 chữ số liền nhau** (sau khi bỏ dấu cách/chấm/gạch) trừ số hotline công khai của cơ sở → mã trường `SENSITIVE_DATA_DETECTED` (chặn mã cửa, số giấy tờ, SĐT khách); FE nhắc "Không ghi mã cửa, số giấy tờ, số điện thoại"; hiển thị văn bản thuần; không đưa vào push/outbox; xóa theo T13 cùng `guest_request.note`. ARC đổi `x-sec-review` thành `approved-DK2 (SEC 16/10/2026)` khi đã ghi các điều kiện này |
| B-16 `listGuestRequestOptions` + `feeAccepted` | **Duyệt có điều kiện** (ĐK-2) | Bảng giá dịch vụ không phải dữ liệu cá nhân nên mức 1 được xem. Nhưng mức 1 chưa xác minh người: (1) client **không** gửi số tiền, server lấy `feeVndSnapshot` từ danh mục tại thời điểm tạo; (2) loại có phí chỉ dùng được khi đơn `in_house`; (3) tối đa 3 yêu cầu có phí đang mở mỗi đơn; (4) phí chỉ ghi folio khi nhân viên bấm hoàn thành (nhân viên gặp khách tại phòng), dòng folio ghi nguồn `guest_app` để FD hủy được nếu khách nói không đặt; (5) tính vào SR-RL-05. DOM quyết loại nào có phí |
| B-21 `AttentionItem.params` | **Duyệt có điều kiện** | Mỗi `kind` có danh sách khóa `params` cho phép trong code (chỉ số, mã đơn/WO, số căn, ngày); khóa lạ → lỗi lúc sinh mục, không lọc im lặng; không tên, SĐT, ghi chú, số tiền chi tiết của khách |
| E14-08 `mapUrl` | **Quyết** | Chỉ `https`, host khớp **chính xác** một trong: `maps.google.com`, `www.google.com` (đường dẫn bắt đầu `/maps`), `maps.app.goo.gl`, `maps.apple.com`, `www.openstreetmap.org`; kiểm khi OWN lưu (422 `NOT_IN_LIST`); guest-web mở bằng `rel="noopener noreferrer"`. Xác nhận guest-web **không** cache `listMyRequests` (ĐK-3) |
