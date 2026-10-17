# SEC review – Sprint 3 (Round 2) – HEAD `a297273`

- Người review: SEC | Ngày: 17/10/2026 | Bước: Review chéo Sprint 3 (plan R2 mục 5 – bắt buộc với PR chạm quyền, tiền, C2/C3)
- Mã được review: HEAD `a297273` = code Sprint 3 `789ac90` + `8ca2a47` (sharp 0.35.5) + `d71d7cf`/`a297273` (snapshot drizzle). **Không** review phần chưa commit trong cây làm việc (`infra/caddy/Caddyfile.prod`, `infra/docker-compose.prod.yml` chưa được git theo dõi; `docker-compose.yml`, `Dockerfile.api`, `02-roles.sh`, `openapi.yaml` đang sửa). Chỉ đọc để biết hướng, không tính là bằng chứng.
- Đối chiếu: `outputs/SEC/s3-checklist.md` (A–J), `product/docs/security/security-requirements.md` (SR-*), `outputs/SEC/w1-review.md` mục 4 (ĐK-1…6), `outputs/SEC/s1-decisions.md`, báo cáo `outputs/BE/s3-be-{a,b,c}.md`, `outputs/FE/s3-report.md`, `outputs/MOB/s3-report.md`, `outputs/INT/s3-report.md`.
- Cách làm: đọc mã (crypto, auth.guard, files, registration, guest-portal, payments/refunds/folio, frontdesk/events, admin-web H13–H17, guest-web, integrations VietQR/QR/doorlock), đối chiếu test. SEC **không chạy test** (không có DB trên máy SEC). Kiểm phụ thuộc mới với registry npm và trang advisory của sharp. Không tấn công hệ thống nào.
- Người sửa ghi trong "Vị trí": **BE (chung)** = `shared/http`, **BE-A** = frontdesk/events/reservations/approvals, **BE-B** = folio/payments/inventory/tham số, **BE-C** = crypto/files/registration/guest-portal. Đánh số tiếp theo `s2-SEC.md` (BE …31, FE …05, INT …05, OPS …02).

**Tổng: 2 Blocker · 8 Major · 13 Minor · 3 Suggestion (26 thẻ)**

Kết luận: **chưa cho qua cổng QC Sprint 3** tới khi 2 Blocker được sửa và SEC kiểm lại. 8 Major phải sửa hoặc có phản hồi trong round. Phần lõi (mã hóa phong bì, cổng C3, ĐK-1…6 phía API, tách nhiệm tiền) làm tốt. Hai lỗi chặn: (1) ảnh giấy tờ của khai báo không bao giờ `confirmed` bị giữ vô thời hạn; (2) ở HEAD chưa có cấu hình Caddy production, nên CSP, Referrer-Policy và che `/g/*` trong log (G4/G5) chưa tồn tại.

**Cập nhật 17/10/2026 – SEC kiểm lại trên `6af7173`: GỠ CHẶN cổng QC Sprint 3** (có điều kiện). SEC-BE-32 Verified; SEC-OPS-03 Verified phần cấu hình + CI, chờ smoke staging; Major b (A-38) của SEC-BE-32 tái hiện được trên PostgreSQL thật → mở thẻ **FB-R2-SEC-BE-53** (Major). Chi tiết và điều kiện: mục 9.

**Cập nhật 17/10/2026 (lần 2) – SEC kiểm lại vòng sửa 9b `ea29582` (FB-R2-SEC-BE-53 / BUG-R2-083):** phần BE (phương án dự phòng) **Verified**. SEC-G1 **chưa đạt** đầu–cuối: Desk chưa gắn được giấy tờ vào người, nên giấy tờ của người còn ở vẫn bị xóa sau 24 giờ → thẻ mới **FB-R2-SEC-FE-07** (Major), thêm BE-54…58 (Minor/Suggestion). SEC không chặn cổng Sprint 3. Chi tiết: mục 9.5.

---

## 1. Các dòng [CHẶN] của checklist

| # | Kết quả | Bằng chứng (file:dòng · test) |
|---|---|---|
| A1 phạm vi + id con | **Đạt** | `reservations/internal/reservation-store.ts:115-131` (own trong SQL → 404); `frontdesk/internal/party.service.ts:479-485` (memberId thuộc đơn); `registration/internal/registration.service.ts:711-716` (image↔document↔registration); `files/public/attachment.service.ts:283-306`; `payments/internal/payments.service.ts:105-120`. Test: `files-attachments.test.ts:82`, `registration-flow.test.ts:483-488`, `frontdesk.test.ts:620`. Thiếu ca "id con của đơn/cơ sở khác" cho `memberId`/`approvalRequestId` (ghi ở BE-33) |
| A2 Idempotency + tiền/C3 cùng giao dịch | **Đạt** (1 ngoại lệ Minor) | Mọi ghi tiền qua `uow.run` + `recordMoney` cùng tx; C3 `addGuestDocument` `storeBody:false` (`registration.controller.ts:199-206`). Test `payments-s3.test.ts:242` (1 bản ghi + audit `money` cùng `request_id`). Ngoại lệ: `setParameter` của `payment_receiving_account` không có `Idempotency-Key` → BE-43 |
| A3 dryRun readOnly | **Đạt** | `frontdesk.controller.ts:80-89` (`read()` = `withContext(…, {readOnly:true})`), dryRun ở `:200-206` (setLateCheckout), `:237-243` (changeRoom), `:366-368` (addPartyMember); guard chỉ miễn header khi operation có cờ `dryRun` (`auth.guard.ts:497-503`). Test `frontdesk.test.ts:371` (đếm `folio_line`/`reservation_change`/`audit_event`/`idempotency_key` trước–sau). **Nhưng** đường `read()` bỏ qua quyết định vai → Major BE-33 |
| B1 CryptoService | **Đạt** | `crypto/internal/envelope-crypto.service.ts:34-61` (AES-256-GCM, nonce 96 bit, tag 128), `:56-61` (AAD `table\|column\|record_id\|kek_version`), `:80-117` (DEK mới mỗi `seal`), `:63-65` (AAD bọc DEK có `dekId`); DEK riêng cho giấy tờ/ảnh/trẻ em/tài khoản hoàn (`crypto/public/port-adapters.ts:22-55, 78-89`). Test `crypto-units.test.ts:45` (đổi AAD → lỗi), `:65` (10⁵ nonce), `crypto-boundary.test.ts:30-49` (không module nào khác đọc `data_key`/KEK/internal) |
| B2 số giấy tờ | **Đạt** | `_enc` + `doc_number_hmac` + `last4`; DTO chỉ `docNumberLast4` (`registration.service.ts:1445`); số đầy đủ chỉ ở `sensitive()` (`:651-702`) và `portalData()`. HK/SAL 403 mọi route đăng ký (`registration-flow.test.ts:189`). Snapshot chưa kiểm khóa `docType`/`fullNameOnDoc` cho 4 vai (BE-50) |
| B3 thứ tự C3 nhân viên | **Đạt** | guard (phiên → thiết bị → vai) → `assertStepUp` (`registration.controller.ts:244-249`, `c3-access-gate.ts:45-60`) → 404 → lý do → `gate.record` (`c3-access-gate.ts:75-92`, lỗi ghi → 503) → dữ liệu; `noStore` = `no-store` + `Pragma` (`:30-33`). `getRefundDestination` cùng thứ tự (`payments/internal/refunds.controller.ts:153-167`). Test `registration-flow.test.ts:114, 226` (thiếu cookie → 403, hết cửa sổ → 401, giả lỗi log → 503), `payments-s3.test.ts:896`. Vai được kiểm trước step-up (403 trước 401) – chấp nhận, nhất quán BUG-R2-005 |
| C1 pipeline ảnh | **Đạt** (hardening Minor BE-47) | `files/public/image-pipeline.ts:31-47` (magic bytes), `:86` (bộ giải mã phải khớp magic), `:87-93` (40 MP từ header + `limitInputPixels`), `:90-101` (mã hóa lại, không `withMetadata` → mất EXIF/GPS), `:19,60-69` (đồng thời 2), trong bộ nhớ. Test `crypto-units.test.ts:176-219` (HTML trong `.jpg`, HEIC, PDF → `FILE_TYPE`; GPS bị bỏ; 50 MP → 422) |
| C2 blob mã hóa | **Đạt (mã)** · cấu hình OPS chưa có ở HEAD | `files/internal/blob-store.ts:27-57` (tên 128 bit ngẫu nhiên, khóa `^[0-9a-f]{32}$` – không path traversal, tệp `0600 wx`, thư mục `0700`); `files/public/encrypted-blob.service.ts:50-72` (DEK riêng mỗi tệp, AAD `<bảng>\|blob\|<id>`); không URL ký sẵn. Test `files-attachments.test.ts:131`. Ở HEAD compose chưa gắn volume blob chung cho api + worker và chưa có Caddy production → OPS-03 |
| C5 xóa ảnh | **Không đạt** | Cơ chế đúng: hủy DEK + xóa blob + `purge_journal` + `c3_access_log purge` (`encrypted-blob.service.ts:95-122`, `registration.service.ts:356-397`); xóa ngay khi `confirmed`/`void`/rút đồng ý/bỏ người; khôi phục no-show không khôi phục ảnh. **Thiếu hạn trên cho khai báo không bao giờ tới `confirmed`** → Blocker BE-32 |
| D1 thiết bị được cấp | **Một phần** | `checkIn`, mọi op C3 của đăng ký, `setRefundDestination`/`getRefundDestination` có `trustedDevice:true`; test `frontdesk.test.ts:227`, `registration-flow.test.ts:114`. Trên staging/production cookie `__Host-` tách theo host nên phiên PWA không mang được cookie thiết bị. Nhưng server **không** kiểm `session.clientOrigin` và không có test "cùng tài khoản FD từ origin PWA → 403" (SR-DEV-04) → Major BE-34 |
| D2 mã cửa | **Đạt** (R2 không sinh/lưu mã) | `frontdesk/internal/checkin.service.ts:5-8`; không có bảng `door_credential` trong API. Test quét JSON `checkIn` + audit: `frontdesk.test.ts:275`. INT: `integrations/doorlock/access.ts:67-78` (`crypto.randomInt`), mock băm có muối (`doorlock/mock.ts:112-119`). Chống trùng/90 ngày là việc lõi khi có `setDoorCredential` (R3) |
| E1 `getPortalData` | **Đạt** | `registration.controller.ts:485-502` (step-up + `no-store`), `registration.service.ts:1236-1272` (1 dòng `view` mỗi lần lấy, `mixed` cần `kind`), SR-RL-06 trong `c3-access-gate.ts:94-119` (cảnh báo 60, chặn 200 → 429 + `Retry-After`). Test `registration-flow.test.ts:295` |
| F1 số tiền + nội dung VietQR | **Một phần** | Trần do server tính, `overBalanceReason` chỉ FD+ (`payments.service.ts:642-680`); nội dung chỉ mã đơn/số bill chuẩn hóa `^[A-Z0-9]{1,25}$`, chặn dãy ≥ 13 số (`integrations/payment/vietqr/emvco.ts:54-69`); chưa cấu hình → 409 (`payments.service.ts:662-663`). Test `payments-s3.test.ts:417`. **Trần của đơn giữ chỗ sai sau khi đảo khoản cọc** → Major BE-36 |
| F2 QR sinh tại chỗ | **Đạt (mã)** · CSP chưa có ở HEAD | `packages/ui/src/QrCode.tsx:16-34`, `apps/admin-web/src/pages/stay/PaymentPanel.tsx:139-143`; grep toàn `product/` không có `img.vietqr.io`/`chart.googleapis`/`qrserver`/`quickchart` trong mã. Header CSP `img-src 'self' blob: data:` chưa có ở bản commit → OPS-03 |
| F3 tài khoản nhận | **Đạt** | Chỉ OWN, kiểm trước khi hỏi mật khẩu (`platform/internal/platform.controller.ts:250-258`), `reauth` qua `PasswordReauth`, audit `money` số che (`platform/public/parameter.service.ts:284-291`), push mọi OWN/MGR không có số (`platform.controller.ts:268-283`), list/history che (`parameters.service.ts:79`), cảnh báo 24 giờ (`platform/public/receiving-account.ts:13`, `payments.service.ts:743-744`, `PaymentPanel.tsx:152-155`), `accountNo` trong `SECRET_BODY_FIELDS`. Test `payments-s3.test.ts:360`. Minor BE-43 |
| F5 đối soát / tách nhiệm | **Đạt** (CHECK nên chặt hơn – Minor BE-42) | `payments.service.ts:386-391` (≠ người ghi, ≠ người xác nhận; OWN có cờ; MGR không ngoại lệ), `:449-461` (`FOR UPDATE`), `:429` + `0040_money_s3_be_b.sql:77-79` (tiền mặt nộp quầy không tự xác nhận, kể cả OWN), `:503-517` (`disputed` không tự đảo, báo OWN/MGR khác người ghi); CHECK `0040:73-75`. Test `payments-s3.test.ts:486` (UPDATE thẳng → 23514), `:567`. Thiếu ca "người xác nhận VietQR đi đối soát" |
| F8 hoàn tiền | **Đạt** các điểm của dòng [CHẶN] · Major BE-37 về người đặt nơi nhận | Không tự áp/không tự duyệt (`approvals/public/approval.service.ts:668-677`, CHECK `0040:118-119`); người chi ≠ người tạo (`refunds.service.ts:403`, CHECK + FK cặp `0040:67-69, 84-86`); số hoàn ≤ duyệt − đã chi và ≤ đã thu − đã hoàn, tính ở server (`:416-423`); số TK + tên chủ TK mã hóa DEK riêng, chỉ trả 4 số cuối, Luhn → `CARD_NUMBER_DETECTED` (`:206-231`, `approval.service.ts:838-851`); đổi sau duyệt → `pending` + hủy DEK cũ + log C3 (`:233-269`); chi đủ → hủy DEK + `purge` (`:494-512`). Test `payments-s3.test.ts:757, 896, 1056` |
| G1 ĐK-1 | **Đạt** | Chỉ 8 op khách ở `guest-portal/internal/guest.controller.ts:63`; phiên luôn `level:1`, `emailOtpAvailable:false`, `level2ExpiresAt:null` (`guest-portal.service.ts:224-233`). Test 5 route → 404: `guest-portal.test.ts:125` |
| G2 ĐK-2 | **Đạt** (test serializer – Minor BE-50) | Serializer bỏ trường `x-guest-level` > mức phiên (`shared/serialization/serializer.ts:67`, `serialize.interceptor.ts:25-35`); `guestFullName`/`doorCode` có `g:2` (`generated/openapi-schemas.ts:2642, 2650-2660`); `OnlineCheckin` đúng 9 khóa; `arrivalNote` chỉ ghi, audit chỉ `hasNote`. Test `guest-portal.test.ts:166` (không có khóa cấm, `no-store`), `:189` (danh sách khóa cho phép) |
| G3 ĐK-3 | **Đạt** | API: không route đọc lại ảnh/số (`guest-portal.service.ts:341-361`, test `guest-portal.test.ts:189`). guest-web: không `localStorage`/`sessionStorage`/IndexedDB/Cache/service worker trong `src` và `dist`; object URL thu hồi trong `finally` (`apps/guest-web/src/app/image.ts:45-56`); ảnh chờ chỉ trong bộ nhớ (`checkin/DocumentsStep.tsx:26,75`); MSW chỉ khi `DEV && mock` (`main.tsx:15`, `app/config.ts:5`); build xóa `mockServiceWorker.js` (`vite.config.ts:13-22`) |
| G4 ĐK-4 | **Một phần** | API đạt: token `randomBytes(32)`, DB chỉ SHA-256 (`guest-portal.service.ts:123,134`), không lưu trong idempotency (`guest-links.controller.ts:56`), token trong body; cookie `HttpOnly; Secure; SameSite=Strict; Path=/`, không Domain (`guest.controller.ts:119-123`), `__Host-` bắt buộc ở staging/production (`config.ts:273-279`); cấp lại thu hồi mọi token + phiên; 401 `GUEST_LINK_INVALID`, 403 `GUEST_STAY_ENDED`; hủy/no-show thu hồi cùng giao dịch (`frontdesk/frontdesk.module.ts:112-123`); hàm SECURITY DEFINER `search_path = pg_catalog, public, pg_temp`, chỉ `ottimo_app` EXECUTE (`0052_guest_portal_be_c.sql:93-123`). Test `guest-portal.test.ts:79, 359, 405`. **Chưa có ở HEAD**: header `Referrer-Policy: no-referrer` từ Caddy và che `/g/*` trong log (chỉ có `<meta name="referrer">` ở `apps/guest-web/index.html:7`) → OPS-03. E2E "location.href không còn token" mới có unit test, file E2E toàn `test.fixme` |
| G5 CSP + Origin | **Không đạt ở HEAD** | Origin ghi của khách: đúng (`auth.guard.ts:217-227`, `GUEST_BASE_URL` bắt buộc ở staging/production – `config.ts:45-68`) nhưng chưa có test (BE-50). Không script/font/analytics bên thứ ba trong bundle. **CSP guest-web chưa có trong bất kỳ tệp đã commit nào** → Blocker OPS-03 |

## 2. Các dòng khác của checklist (tóm tắt)

| # | Kết quả | Ghi chú |
|---|---|---|
| A4 Luhn ô tự do | Một phần | Thiếu ở `addFolioLine.description`, `bankReference`, tên chủ TK hoàn, `accountName` → BE-44 |
| A5 C2/C3 ra ngoài | Đạt với C3 · Minor với C2 | SSE chỉ `{id}` (`events/internal/events.controller.ts:75`, `events.service.ts:192-208`), push chỉ loại/id/mã (`platform/public/staff-notify.ts:45-52`). C2 (tên người đứng tên, ghi chú nội bộ) nằm trong `idempotency_key.response_body` của `checkIn`/`extendStay`/party **và không có job xóa theo `idempotency_ttl_hours`** → BE-39 (SEC làm rõ A5 – xem decision-log) |
| A6 khóa/deadlock | Đạt | Không bắt `55P03`/`40P01` thành 500, không `lock_timeout = 0` |
| B4 lý do xem | Một phần | `reason=registration` vẫn qua khi luồng đã đóng (`registration.service.ts:639-649`) → BE-48 |
| B5 FE số đầy đủ | Đạt | `DocsPanel.tsx:30,105-121` (60 s, `visibilitychange`, unmount; không qua `useResource`) |
| C3 giới hạn số ảnh | Đạt | ≤ 4/người, ≤ 30/đơn, thay ảnh = hủy DEK cùng tx (`registration.service.ts:524-529, 1717`) |
| C4 header ảnh | Đạt | `registration.controller.ts:271-276`; FE chưa có trình xem ảnh (N/A) |
| C6 tham số hạn lưu | Một phần | `id_image_purge_max_hours` có biên 1–72 trong khi T01 là 24 giờ (`0003_parameter_bounds.sql:79`) → BE-49 |
| C7 xóa sớm A74 | Đạt | `registration.controller.ts:283-305`, test `registration-flow.test.ts:572` |
| D3 thu hồi mã | N/A R2 | Chưa có `door_credential`; việc "Xóa mã căn X" sẽ cần khi có `setDoorCredential` |
| D4 FE không lưu C3 | Đạt | storage chỉ có propertyId/theme/ngôn ngữ |
| E2 FE clipboard | **Không đạt** | → Major FE-06 |
| E3 không xuất nhiều người | Đạt | INT adapter chỉ 1 đơn, không tệp; không endpoint danh sách giấy tờ |
| E4 `visa_alert_on` | Đạt | NULL khi trả phòng/void (`registration.service.ts:1532, 1638`) |
| F4 tiền do SAL/CTV ghi | Đạt (Minor) | `payment.service.ts:264-282, 318`; `confirmPaymentReceived` không có biên `receivedAt` → BE-44 |
| F6 hoa hồng `earned` | Đạt | Chỉ sau đối soát (`payments.service.ts:533-564`), test `payments-s3.test.ts:567` |
| F7 đảo giao dịch | Đạt | MGR+, lý do, dòng đảo trỏ gốc, GRANT không có `amount_vnd`/DELETE |
| F9 `finalPayment` | Đạt | Cùng tx B18 (`checkout.service.ts:291-304`); `posAuthCode` `^[A-Za-z0-9]{1,12}$` (không chứa được số thẻ) |
| F10 mock cổng | N/A R2 | API chưa có route webhook/mock; VNPay/MoMo + `scrubCardData` R3 |
| G6–G9 | Đạt / Một phần | G6 đạt (client canvas + server mã hóa lại); G7 đạt phần đồng ý, `notice_locale` ghi sai → BE-50/MOB-02; G8 test quét `dist` không bao giờ chạy trong CI → Major MOB-01; G9 đạt 20 ghi/ngày + 30 tệp, chưa test 30 tệp/100 ngày; `recordGuestConsent` không giới hạn → BE-49 |
| H1 SR-RL-09 | **Không đạt** | → Major BE-35 |
| H2 sales-port actor | Đạt | `reservations/internal/sales-port.adapter.ts:32-39`; mặc định `SYSTEM_ACTOR` trong `registration/internal/stay-reader.ts:70,79` → Suggestion BE-52 |
| H3 vai DB | Chưa kiểm | Thuộc bước dựng staging (OPS đang sửa `02-roles.sh`, chưa commit) |
| H4 | Đạt | A3 + F6 |
| I1–I4 đính kèm | Đạt | `attachment.service.ts:45-72, 297-319`; header `attachments.controller.ts:116-121`; `purpose` enum đóng có CHECK DB (`0050:63`) |
| I5 hạn lưu đính kèm | **Không đạt** | → Major BE-38 |
| I7 giới hạn | Một phần | 50/người/ngày có; 20/phiếu chưa có → BE-49 |
| J B-21 `params` | Đạt | Allowlist theo kind, khóa lạ → lỗi (`events/public/events.service.ts:102-138`) |
| J E14-08 `mapUrl` | Đạt phần đọc | Server + client chỉ https + 5 host chính xác (`guest-portal.service.ts:45-62`, `apps/guest-web/src/app/link.ts:28-47`), `noopener noreferrer`. Chưa có đường OWN ghi `map_url` (kiểm 422 khi có) |

## 3. Các điểm ORC yêu cầu xem riêng

**Crypto (BE-C nhờ review) – ĐẠT.**
- Phong bì: DEK 256 bit ngẫu nhiên mỗi bản ghi, bọc bằng KEK với AAD `data_key|<id>|<version>` (không tráo được DEK giữa các dòng). Bản mã ghi `kek_version` lúc niêm phong trong header và đưa vào AAD, nên xoay KEK (`rewrap`) chỉ bọc lại DEK, không phải mã hóa lại dữ liệu. Sửa header thì đổi AAD, nên thẻ GCM hỏng. Thiết kế đúng, SEC **đồng ý** quyết định decision-log 16/10 của BE-C.
- Hủy (`destroy`): `wrapped_key = NULL` + CHECK `data_key_destroyed_check` + `purge_journal`. `ottimo_app` không DELETE được `data_key`/`purge_journal` (test `crypto-envelope.test.ts:149`). Không khôi phục được vì khóa bọc đã mất. Bản sao lưu cũ vẫn còn khóa tối đa 35 ngày (SR-KEY-09, đã biết).
- Khóa: staging/production thiếu `DATA_KEK_CURRENT`/`ID_HASH_KEY` → dừng khởi động (`keyring.ts:42-49`); lỗi không chứa giá trị khóa. Dev chạy khóa tạm theo tiến trình, có cờ `ephemeral`.
- **HKDF cho tên trẻ em – DUYỆT.** `keyedHash('child_name')` = HMAC-SHA256 với khóa con `HKDF-SHA256(ID_HASH_KEY, salt rỗng, info "ottimo:child_name:v1", 32)` (`envelope-crypto.service.ts:194-199`). `ID_HASH_KEY` đã là khóa 256 bit đồng đều nên salt rỗng là chấp nhận được (RFC 5869). Khóa con tách miền khỏi chỉ mục số giấy tờ (dùng `ID_HASH_KEY` trực tiếp): hai giá trị không bao giờ so khớp chéo được, và không cần thêm bí mật mới. Đầu vào entropy thấp (TÊN|năm) nên bắt buộc phải có khóa như đã làm. Điều kiện: giá trị `child_name_hmac` là C3 (SR-KEY-07). Không trả qua API, và phải xóa khi bỏ người: hiện chưa xóa → BE-41. Gợi ý cho bản sau ở BE-51.
- **stepUp – Đạt.** `POST /v1/me/step-up` chỉ nhận mật khẩu (PIN R3 → 422). Bộ đếm sai dùng chung `PasswordReauth` (5 lần → 429). `password` nằm trong `SECRET_BODY_FIELDS`. Cửa sổ trượt `user_session.stepup_until` gia hạn sau mỗi lần đọc C3 thành công. Audit `security c3.step_up` (`step-up.controller.ts:26-67`). Không cần thiết bị để mở cửa sổ, nhưng mọi đọc C3 đều cần thiết bị nên chấp nhận được.
- **C3 access log – Đạt.** Ghi trước khi trả dữ liệu; lỗi ghi → 503 và giao dịch rollback; SR-RL-06 đếm trong DB (bền qua khởi động lại, nhất quán khi nhiều replica). Ghi chú: hai request song song có thể vượt ngưỡng 200 thêm vài dòng (không khóa), chấp nhận.
- **Thiết bị tin cậy – Một phần** (BE-34).

**Phụ thuộc mới – DUYỆT.**
- `sharp`: HEAD dùng **0.35.5** (commit `8ca2a47`), **không phải** 0.34.5 như `outputs/BE/s3-be-c.md` và yêu cầu ORC ghi. Integrity trong lockfile khớp registry npm (`sha512-Ywn4…C7g==`), phát hành qua GitHub Actions, không có script `install`/`postinstall`. Bản 0.34.5 **dính** 3 advisory 2026 của sharp: libvips (GHSA-f88m-g3jw-g9cj, sửa ở ≥ 0.35.0), libheif (GHSA-rgj7-g3m4-5g8c, ≥ 0.35.4), librsvg (GHSA-wq5f-xc86-pv6w, ≥ 0.35.5). 0.35.5 đã vá cả ba. Pipeline của ta chặn trước bằng magic bytes nên loader SVG/HEIF/GIF/TIFF vốn không với tới được, nhưng vẫn nên khóa thêm (BE-47). Việc nâng lên 0.35.5 là **đúng và bắt buộc giữ**. BE-C sửa lại số phiên bản trong báo cáo.
- `@axe-core/playwright` **4.13.0**: chỉ là `devDependencies` của `tests/` (không vào image api/web). Integrity khớp registry (`sha512-6YLx…VAVg==`), phát hành qua GitHub Actions, không có script cài đặt, phụ thuộc `axe-core ~4.13.0`. Giấy phép MPL-2.0 dùng cho công cụ test là chấp nhận được.

## 4. Quyết định SEC theo yêu cầu ORC

**(a) MOB giữ 7 chuỗi pháp lý bằng EN trên trang RU – ĐỒNG Ý CÓ ĐIỀU KIỆN.** Không được dùng bản RU chưa duyệt làm bằng chứng đồng ý (content-guide HR-01, EP06 8.5). Hiện EN là bản duy nhất đã duyệt, và đồng ý P02b là tự nguyện (khách luôn có nút "Không" ngang hàng). Điều kiện:
1. Bằng chứng ghi đúng ngôn ngữ thực sự hiển thị. Đồng ý: đã đúng (`CheckinFlow.tsx:292` gửi `shownLocale(…)` = `en`). Thông báo xử lý dữ liệu: **đang sai**, vì server ghi `notice_locale = g.locale` (`guest-portal.service.ts:422`), tức `ru`, trong khi `gw.notice_body` hiện bằng EN. Phải sửa trước khi bật RU cho khách thật (BE-50 + MOB-02).
2. Đưa thêm `gw.notice_read` vào `RU_UNREVIEWED_LEGAL`, để nút xác nhận cùng ngôn ngữ với văn bản được xác nhận. Ngay trên khối pháp lý hiện câu `guest.lang.ru_soon` (đã có).
3. Chỉ bỏ một khóa khỏi `RU_UNREVIEWED_LEGAL` khi có bản RU do người dịch duyệt và UXD + SEC ký trong content-guide. Bỏ khóa cũng là đổi văn bản thông báo, nên phải tăng `privacy_notice_version`.
4. Thêm test: ở locale `ru`, 8 khóa trên hiện EN, `recordGuestConsent.locale = 'en'` và `notice_locale = 'en'`.
5. Câu hỏi pháp lý "văn bản EN có đủ cho khách nói tiếng Nga không, có bắt buộc bản RU không" không cần ESC mới. Đề nghị ORC thêm vào danh sách câu phụ gửi luật sư của ESC-001 (INV đã quyết A).

**(b) ĐK-2 – đề nghị MOB thêm trường cho app khách mức 1 – DUYỆT CÓ ĐIỀU KIỆN.**
- `OnlineCheckin.currentNoticeVersion` (string) và `OnlineCheckin.imageRetentionDays` (integer): đây là cấu hình của cơ sở, không phải dữ liệu cá nhân, nên mức 1 được xem. Điều kiện:
  1. Server đọc từ `privacy_notice_version` và `id_image_retention_days_after_checkout` theo ngày nghiệp vụ của cơ sở. ARC ghi `x-guest-level: 1`, `x-sec-review: approved-DK2 (SEC 17/10/2026)`. Danh sách khóa cho phép trong test ĐK-2 tăng từ 9 lên 11 và áp cho **mọi** phản hồi `OnlineCheckin` (get/update/upload/consent/complete).
  2. Bằng chứng phải khớp câu chữ đã hiện. `recordGuestConsent` nhận `retentionDays` (số khách đã đọc trong câu đồng ý); khác tham số hiện hành → 422 `NOT_IN_LIST`, giống `noticeVersion`. `consent_record` lưu số ngày này. J16 T02 dùng `min(số ngày lúc đồng ý, tham số hiện hành)`, để OWN tăng tham số cũng không giữ ảnh lâu hơn điều khách đã đồng ý.
  3. guest-web bỏ hằng `NOTICE_VERSION`/`RETENTION_DAYS_DEFAULT`. Thiếu trường thì **không** hiện câu đồng ý (fail closed), không rơi về 30.
- `guestFirstName` mức 1 khi tải lại trang: **duyệt theo cách thêm `GET /v1/guest/sessions/current`** (trả lại đúng `GuestSession` đã cấp ở `openGuestSession`, theo cookie). **Không** thêm `guestFirstName` vào `GuestStay`, vì cách này không mở rộng thêm dữ liệu cá nhân ở mức 1 (tên gọi đã có trong `GuestSession` mức 1 từ 0.3.3). Điều kiện: chỉ tên gọi (không họ, không tên đầy đủ), `no-store`, cùng serializer `x-guest-level`, `verification` theo ĐK-1. Sau trả phòng (`stayEnded`) không trả `guestFirstName`/`roomNo`. Tính vào giới hạn theo phiên/IP như `getGuestStay`.

---

## 5. Thẻ feedback

### FB-R2-SEC-BE-32
- Mức độ: Blocker
- Vị trí: BE-C – `registration/internal/registration.service.ts:1536` (`onCheckedOut` chỉ hẹn xóa khi `AFTER_CONFIRMED.includes(reg.status)`), `:873-876` (`scheduleRetention`: `if (!checkout) return`), `:1641` (`onReservationVoided` bỏ qua trạng thái không `VOIDABLE`); `registration/internal/retention.service.ts:63-104` (J16 T02 chỉ lấy ảnh có `delete_after`, T01 chỉ lấy `void` hoặc `confirmed/needs_update/updated`)
- Vấn đề: Một khai báo không bao giờ tới `confirmed` thì ảnh giấy tờ của **mọi người** (cả người không đồng ý lưu, cả trẻ em) không có `delete_after` và không lọt vào T01, nên J16 không bao giờ xóa. Các trạng thái bị kẹt: `pre`/`partial`/`review`/`scanned`/`sent`. Kịch bản thật: lễ tân đã khai trên cổng Bộ Công an nhưng quên bấm "Cổng đã xác nhận", khách trả phòng, ảnh hộ chiếu nằm vô thời hạn. Hoặc đơn bị hủy khi khai báo đang `sent`: `onReservationVoided` không void, ảnh cũng ở lại.
- Vì sao quan trọng: SR-RET-02 ghi rõ "chưa `confirmed` → tối đa 7 ngày sau trả phòng". Câu đồng ý cam kết với khách "nếu không đồng ý, chúng tôi không lưu ảnh". Giữ ảnh hộ chiếu/CCCD (C3) quá thời hạn là rủi ro pháp lý trực tiếp theo NĐ 13/2023, và vi phạm dòng C5 [CHẶN] ("J16 bắt ca sót").
- Đề xuất sửa: (1) `onCheckedOut` luôn đặt `delete_after` cho mọi ảnh còn sống, bất kể trạng thái: người đồng ý → trả phòng + `id_image_retention_days_after_checkout`; còn lại → trả phòng + 7 ngày (tham số mới có biên ≤ 7, hoặc hằng số SR-RET-02). Khi khai báo `confirmed` sau đó, K7 xóa ngay như hiện tại. (2) J16 thêm nhánh: đơn đã `checked_out`/`cancelled`/`no_show` quá 7 ngày mà khai báo chưa `confirmed`/`void` → xóa ảnh (`delete_reason = 'unconfirmed'`) + mục "Cần chú ý" `registration_overdue` cho FD/MGR. (3) Test với `Clock` giả: trả phòng khi khai báo `sent` → ngày 8 ảnh mất, có `purge_journal`, có `c3_access_log purge`; hủy đơn khi `sent` → như trên; `legal_hold` → giữ.
- Trạng thái: Open
- **Verified 17/10/2026** (SEC, code `6af7173`, PostgreSQL thật): đề xuất (1)–(3) và Major a (đơn kẹt quá ngày đi) đạt. Major b (A-38 bỏ người) **không đạt** → tách sang FB-R2-SEC-BE-53. Xem mục 9.1.

### FB-R2-SEC-OPS-03
- Mức độ: Blocker (chặn việc đưa guest-web/admin-web lên staging và gửi link cho khách; không chặn sửa mã)
- Vị trí: OPS – HEAD `a297273`: không có `infra/caddy/Caddyfile.prod` và `infra/docker-compose.prod.yml` (hai tệp mới ở cây làm việc, **chưa commit**); `infra/caddy/Caddyfile.dev` chỉ có `nosniff`; `infra/docker-compose.yml` ở HEAD chưa gắn volume blob cho api + worker và chưa đặt `BLOBSTORE_LOCAL_PATH`
- Vấn đề: Các dòng [CHẶN] G4 (`Referrer-Policy: no-referrer`, Caddy che `/g/*` trong log), G5 (CSP guest-web), F2 (CSP admin-web `img-src 'self' blob: data:`) và C2 (volume blob không qua Caddy, dùng chung api + worker để J16 xóa được tệp) phụ thuộc cấu hình hạ tầng. Ở HEAD các cấu hình này chưa tồn tại. Bản đang soạn ở cây làm việc có nội dung đúng hướng (CSP không `unsafe-*`, che `/g/*` và query, xóa header khỏi log, `max_size 25MB`, khóa `/var|/blobs…` → 404), nhưng chưa được review, commit hay kiểm trên staging.
- Vì sao quan trọng: Thiếu CSP thì một lỗi XSS ở guest-web (trang khách nhập ảnh giấy tờ) không có lớp chặn thứ hai. Thiếu che `/g/*` thì token link khách (tương đương mật khẩu, 256 bit) nằm trong log truy cập. Thiếu volume chung thì worker không xóa được tệp blob mà api đã ghi.
- Đề xuất sửa: (1) Commit `Caddyfile.prod` + `docker-compose.prod.yml`; SEC review trước khi deploy staging. (2) Host guest dùng `worker-src 'none'` (guest-web không có service worker – ĐK-3) và `Referrer-Policy: no-referrer`; giữ `Cache-Control: no-store` cho `index.html` guest. (3) Volume `blobdata` gắn vào **cả** api và worker, **không** gắn vào `web`; `BLOBSTORE_LOCAL_PATH` tuyệt đối. (4) Smoke staging tự động: `curl -I` kiểm CSP/Referrer-Policy/HSTS cho 3 host; `GET /var/lib/ottimo/blobs/…` và `/blobs/x` → 404; mở `/g/<token giả>` rồi grep log Caddy không thấy token.
- Trạng thái: Open
- **Verified 17/10/2026 phần cấu hình + CI** (SEC, `6af7173`; ảnh web `ottimo-web:demo` dựng từ `adc0a47`): đề xuất (1)–(4) có trong HEAD, guard CI chạy được và xanh. **Chưa đóng**: chờ SEC smoke trên staging thật (ĐK-S3-8). Không còn chặn cổng QC Sprint 3 và việc deploy staging; vẫn chặn gửi link cho khách thật và nhập dữ liệu khách thật. Xem mục 9.2.

### FB-R2-SEC-BE-33
- Mức độ: Major
- Vị trí: BE (chung) – `src/shared/http/auth.guard.ts:263-268` (vai bị cấm nhưng `hasCompletedKey` → **hoãn** quyết định; op có `idempotencyKey` → không `enforce`), `:272-289` (`hasCompletedKey` chỉ so `principal_id` + `key`, không so method/path/op); BE-A – `frontdesk/internal/frontdesk.controller.ts:80-89` (`read()` không gọi `guard.enforce`), dryRun `:200-206`, `:237-243`, `:366-368`; `reservations/internal/reservations.controller.ts:275-284` (`cancelReservation` dryRun, cùng mẫu)
- Vấn đề: Guard chỉ hoãn quyết định vai cho UnitOfWork (để trả lại phản hồi đã lưu – ADR-009). Đường dryRun chạy `read()` nên không bao giờ qua `uow.run` → không bao giờ `enforce()`. Kịch bản: SAL gửi `POST …/actions/late-checkout {"checkoutTime":"17:00","dryRun":true}` cho một đơn `in_house` do chính SAL tạo, kèm `Idempotency-Key` = **bất kỳ** khóa SAL đã hoàn thành trước đó (ví dụ khóa của một lần `createHold`) → 200 thay vì 403. Phản hồi có `arrivalSameDay.guestDisplayName` + `etaTime` của **khách đơn khác** (`frontdesk/internal/stay.service.ts:489-496`; D01 không bị serializer chặn cho SAL), phụ thu, bậc giá. `changeRoom`/`addPartyMember` dryRun cũng chạy được với vai không có quyền. Test RBAC dùng khóa ngẫu nhiên nên không bắt được (`rbac-sprint3-bea.test.ts:233`). HK/MT bị phạm vi `own` chặn (404) nên phạm vi ảnh hưởng thực tế là SAL/CTV.
- Vì sao quan trọng: OWASP A01 – kiểm quyền "mở khi lỗi" (fail-open), đi ngược nguyên tắc "cổng vai trước tiên" (BUG-R2-005); lộ C2 ngoài phạm vi (giống SEC-BE-25). Mọi handler sau này có `Idempotency-Key` mà không đi qua `uow.run` sẽ mắc cùng lỗi.
- Đề xuất sửa: (1) Guard: khi `operation.dryRun && body.dryRun === true` thì `enforce()` ngay (dryRun không ghi khóa nên không có gì để phát lại). (2) `hasCompletedKey` khớp thêm `method` + `path` của request. (3) Lưới an toàn: interceptor toàn cục sau handler, nếu `ottimoAuth.enforced === false && !allowed` thì ném 403 + log lỗi lập trình. Hoặc cho `read()` của mọi controller gọi `guard.enforce(req)`. (4) Test trong `role-gate-first.test.ts`: vai bị cấm + khóa đã `completed` của operation khác + `dryRun:true` → 403 + `access.denied`, cho cả 4 operation có cờ dryRun. Thêm ca `memberId`/`approvalRequestId` của đơn khác → 404 (A1).
- Trạng thái: Open

### FB-R2-SEC-BE-34
- Mức độ: Major
- Vị trí: BE (chung) – `src/shared/http/auth.guard.ts:430-468` (`checkTrustedDevice` chỉ kiểm cookie thiết bị, bỏ qua `principal.session.clientOrigin` đã có ở `:353`)
- Vấn đề: SR-DEV-04 / D1 [CHẶN] yêu cầu "phiên PWA không bao giờ `device_trusted`" và test "cùng tài khoản FD từ origin PWA → 403". Hiện điều này chỉ đạt nhờ cookie `__Host-` tách theo host ở staging/production. Ở dev (admin-web và PWA cùng `localhost`, khác cổng, nên chung cookie), một phiên `staff_pwa` mang cookie thiết bị vẫn qua. Không có test nào cho ca này. Khi R3 có PWA nhân viên và nếu có ai cấu hình chung host/đường dẫn, lớp bảo vệ duy nhất sẽ mất.
- Vì sao quan trọng: Thiết bị được cấp là lớp chính bảo vệ C3 (TM-42/46). Điện thoại cá nhân chạy PWA không được thấy giấy tờ, mã cửa, tài khoản hoàn.
- Đề xuất sửa: Trong `checkTrustedDevice`: `if (p.session.clientOrigin !== 'admin') → DEVICE_NOT_TRUSTED` + audit; nếu có header `Origin` thì phải thuộc `allowedOrigins.admin`. Test: đăng nhập FD từ origin PWA (phiên `staff_pwa`) + cookie thiết bị hợp lệ → `checkIn`, `getGuestDocumentSensitive`, `getRefundDestination` đều 403 `DEVICE_NOT_TRUSTED`.
- Trạng thái: Open

### FB-R2-SEC-BE-35
- Mức độ: Major
- Vị trí: BE (chung) – không có cài đặt SR-RL-09; `modules/identity/public/rate-limiter.ts:19-22` chỉ có `loginPerIp`, `guestLookupPerUser`; không có hook/guard toàn cục
- Vấn đề: s3-checklist H1 (chuyển từ Sprint 2, hạn "trước cổng QC Sprint 3"): 600 request/phút/người, 429 + `Retry-After`, tính cả SSE. Chưa làm. Sprint 3 thêm nhiều endpoint nặng (bill, preview, SSE mỗi tab 1 kết nối LISTEN dùng chung nhưng không giới hạn số luồng mỗi người).
- Vì sao quan trọng: TM-50 (DoS trên 1 VPS); một tài khoản CTV bị lộ hoặc một script lỗi có thể làm quầy đứng.
- Đề xuất sửa: Hook Fastify `onRequest` sau khi xác thực (hoặc trong guard sau `authenticate`): đếm `RateLimiter` theo `userId`, cửa sổ 60 s, 600 lần → 429 `RATE_LIMITED` + `Retry-After`, audit `security rate_limited` lần đầu mỗi cửa sổ. SSE: tối đa 5 luồng mở/người. Test: 601 request → 429; người khác không bị ảnh hưởng.
- Trạng thái: Open

### FB-R2-SEC-BE-36
- Mức độ: Major
- Vị trí: BE-B – `folio/public/folio.service.ts:353-361` (`depositPaid`: `SUM(amount_vnd) WHERE type='deposit' AND status='succeeded'`); `payments/internal/payments.service.ts:582-590` (dòng đảo chép `type`, `-amount_vnd`, `status='succeeded'`; dòng gốc thành `reversed`)
- Vấn đề: Sau khi đảo một khoản cọc X, `depositPaid` không tính dòng gốc (`reversed`) nhưng vẫn cộng dòng đảo (−X), nên kết quả là −X thay vì 0. Hệ quả: trần VietQR của đơn giữ chỗ thành `cọc yêu cầu + X` (`payments.service.ts:669-673`, F1 [CHẶN]); trần `AMOUNT_TOO_HIGH` của SAL trong `confirmDeposit` bị nới (`deposits.service.ts:148-151`); cơ sở hoàn cọc BR-309 khi hủy và các kiểm `> 0` ở `reservations.service.ts:243, 921, 1975, 2647, 2910` nhận số âm.
- Vì sao quan trọng: Sai tiền (mức Blocker theo protocol nếu xảy ra trên dữ liệu thật). Xếp Major vì chỉ xảy ra sau thao tác đảo cọc (MGR+) và chưa có dữ liệu thật. Nó làm hỏng điều kiện F1 "≤ còn phải thu".
- Đề xuất sửa: Thêm `AND reversal_of_id IS NULL` (giống `computeTotals`), hoặc tính qua `computeTotals` cho một nguồn sự thật. Test: cọc 1.600.000 → đảo → `depositPaid = 0`; `createVietQr` trên đơn giữ chỗ trần = cọc yêu cầu; hủy đơn sau đảo → cơ sở hoàn 0. DOM/QA thêm oracle.
- Trạng thái: Open

### FB-R2-SEC-BE-37
- Mức độ: Major
- Vị trí: BE-B – `payments/internal/refunds.service.ts:233-246` (`setRefundDestination` khi yêu cầu còn `pending`: không báo ai, không ràng buộc người đặt), `:403` (chỉ kiểm người chi ≠ người tạo); BE-A – `approvals/public/approval.service.ts:668-677` (`assertNotSelf` chỉ so `requested_by`); `approveRequest` không có `If-Match` (`generated/openapi-meta.ts`)
- Vấn đề: Cột `refund_destination_set_by` được lưu nhưng không kiểm ở đâu. Kịch bản: FD tạo yêu cầu hoàn thật cho khách. MGR (cũng là FD+) đổi nơi nhận sang tài khoản của mình khi yêu cầu còn `pending` (không bị duyệt lại, vì chỉ đổi **sau** khi duyệt mới về `pending`), tự duyệt (MGR không phải người tạo), rồi tự chi chuyển khoản (`executeRefund` chỉ cấm người tạo). Một người hoàn tất việc chuyển tiền khách vào tài khoản riêng. Người duyệt cũng không chắc đã thấy nơi nhận mới nhất, vì không có kiểm phiên bản.
- Vì sao quan trọng: TM-06/TM-32 (gian lận nội bộ về tiền). F3/F8 coi "tráo số tài khoản" là điểm gian lận số một. Đối soát sau đó chỉ phát hiện được, không ngăn được.
- Đề xuất sửa: (1) Người duyệt ≠ `refund_destination_set_by` (mã + CHECK DB như `approval_request_refund_no_self_approval`). (2) Chuyển khoản: người chi (`executeRefund`) ≠ người duyệt **và** ≠ người đặt nơi nhận. Ở cơ sở chỉ có 1 MGR thì OWN chi hoặc OWN duyệt (ghi rõ trong BR-522, cần DOM/PO xác nhận vì đổi quy trình; nếu PO thấy vượt quyền thì báo SEC để cân nhắc phương án "OWN nhận push và phải bấm xác nhận"). (3) `approveRequest` của loại `refund` nhận `If-Match` (version của yêu cầu); đổi nơi nhận làm tăng version. (4) Mọi lần đặt/đổi nơi nhận → push `refund_destination_changed` tới người tạo yêu cầu + mọi OWN (chỉ mã đơn, không số). Test: MGR đặt nơi nhận rồi duyệt → 403; người duyệt chi chuyển khoản → 403; đổi nơi nhận khi `pending` → version tăng, approve với version cũ → 412.
- Trạng thái: Open

### FB-R2-SEC-BE-38
- Mức độ: Major
- Vị trí: BE-C – `files/public/attachment.service.ts:249-282` (`purgeDue` chỉ xét `retention_anchor_at IS NOT NULL`); mốc chỉ được đặt cho khoản thu/hoàn (`payments/public/attachment-usage.ts:28-52`) và `penalty_evidence` lúc trả phòng (`registration.service.ts:1548`)
- Vấn đề: SEC I5 yêu cầu mọi đính kèm có hạn lưu. Tệp tải lên nhưng không bao giờ gắn vào bản ghi (lễ tân/SAL chụp biên nhận rồi đóng hộp thoại, hoặc tải lại ảnh khác) thì không có mốc, nên giữ mãi. Biên nhận chuyển khoản là C2 (tên + số tài khoản người chuyển). `work_order`, `inspection`, `meter` đã nhận tải lên từ Sprint 3 nhưng module dùng chúng là Sprint 4, nên cũng không có mốc.
- Vì sao quan trọng: Hạn lưu là nghĩa vụ (SR-RET, NĐ 13): dữ liệu không còn mục đích phải xóa.
- Đề xuất sửa: (1) J16: tệp chưa gắn (`bound_ref_id IS NULL`) quá 7 ngày từ `uploaded_at` → xóa (`purge_reason='unbound'`, thêm vào CHECK). (2) Tới khi module Sprint 4 có mặt: hoặc từ chối `work_order`/`inspection`/`meter` ở `uploadAttachment` (422 `NOT_IN_LIST`), hoặc đặt mốc mặc định = `uploaded_at`. (3) `refund_proof` đang dùng chung `deposit_receipt_retention_days`: giữ như giả định I5, chờ câu trả lời kế toán/luật sư về T08 (ESC-001). Test: tải biên nhận, không dùng, ngày 8 → `purged_at`, DEK hủy.
- Trạng thái: Open

### FB-R2-SEC-FE-06
- Mức độ: Major
- Vị trí: FE – `apps/admin-web/src/pages/registration/RegistrationPage.tsx:26` (`PORTAL_HIDE_MS = 120_000`), `:280-287` (`copy()` ghi clipboard, không hẹn giờ xóa, không xóa khi `visibilitychange`/rời màn/đăng xuất); `pages/money/MoneyPage.tsx:640-657, 712-724` (số tài khoản hoàn đầy đủ hiện tới khi đóng hộp, không tự ẩn)
- Vấn đề: SR-C3-11(4) yêu cầu: số đầy đủ tự ẩn sau 60 giây; clipboard tự ghi đè rỗng sau 60 giây; ẩn/xóa **ngay** khi rời màn, đóng hộp, đăng xuất, hết phiên hoặc tab bị ẩn. Hiện dữ liệu cổng ẩn sau 120 giây, clipboard giữ số hộ chiếu/CCCD tới khi người khác dán, và số tài khoản hoàn (C3) không tự ẩn. `DocsPanel` làm đúng (60 giây + `visibilitychange`), nên chỉ cần dùng lại cách đó.
- Vì sao quan trọng: Máy quầy dùng chung; clipboard là đường rò C3 phổ biến nhất (TM-18) – dán nhầm vào Zalo/tìm kiếm.
- Đề xuất sửa: Một hook `useC3Reveal({ ttlMs: 60_000 })` dùng chung cho DocsPanel, dữ liệu cổng, tài khoản hoàn: hẹn giờ 60 giây; xóa khi `visibilitychange` (hidden), unmount, đăng xuất (`onClientDataClear`). Clipboard: sau mỗi lần sao chép hẹn 60 giây ghi `''` và cũng ghi `''` khi ẩn tab/rời màn (best-effort, giữ nút "Xóa bộ nhớ tạm"). Test E2E/RTL: ẩn tab → số biến mất + `clipboard.writeText('')` được gọi; 60 giây → ẩn.
- Trạng thái: Open

### FB-R2-SEC-MOB-01
- Mức độ: Major
- Vị trí: MOB + OPS – `apps/guest-web/src/__tests__/guard.test.ts:76` (`it.skipIf(!existsSync(DIST))`); `.github/workflows/ci.yml` (`pnpm test` chạy trước `pnpm build`); `turbo.json` `test.dependsOn: ["^build"]` (không build chính guest-web)
- Vấn đề: Test quét bundle (G8/ĐK-6: không có khóa cấm, không đường dẫn OTP/folio, không `mockServiceWorker.js`) **luôn bị bỏ qua trong CI**, vì lúc chạy test chưa có `dist`. Bộ lọc chuỗi ở `vite.config.ts:29-48` hỏng thì chuỗi cấm vẫn lọt ra bản phát hành mà CI vẫn xanh. Ngoài ra, tiền tố lọc `'error.'`, `'gw.'` quá rộng nên bundle còn chứa chuỗi không dùng tới (ví dụ `error.GUEST_STAY_ENDED` "…only shows your bill", `guest.req.fee_notice`, mọi `error.*` của nhân viên).
- Vì sao quan trọng: Một kiểm soát [ĐK-6] không thể đỏ thì không phải kiểm soát. Chuỗi hứa hẹn tính năng mức 2 (bill, mã cửa) xuất hiện trên app khách đi ngược s1-decisions.
- Đề xuất sửa: (1) CI build guest-web trước khi chạy test này (bước riêng `pnpm --filter @ottimo/guest-web build && vitest run guard.test.ts`), và khi `process.env.CI` thì test **fail** (không skip) nếu thiếu `dist`. (2) Lọc chuỗi theo danh sách khóa thực sự dùng (thu từ mã nguồn, như `units.test.ts` đang làm) thay cho tiền tố.
- Trạng thái: Open

### FB-R2-SEC-BE-39
- Mức độ: Minor
- Vị trí: BE (chung) – không có job xóa `idempotency_key` theo `idempotency_ttl_hours` (tham số có ở `0002_parameter_catalogue.sql:144`, erd 4.12 "xóa sau `idempotency_ttl_hours`"); `shared/http/unit-of-work.ts:186-195` (mặc định lưu toàn bộ body)
- Vấn đề: Phản hồi `checkIn`/`extendStay`/`addPartyMember`… chứa C2 (tên người đứng tên, `phoneMasked`, ghi chú nội bộ) được lưu vào `idempotency_key.response_body` (đúng erd: chỉ cấm C3) nhưng **không bao giờ bị xóa**. Bảng này trở thành bản sao C2 không có hạn lưu và không theo phân quyền đọc.
- Vì sao quan trọng: SR-RET (dữ liệu hết mục đích phải xóa). A5 của checklist liệt kê `response_body` với cả C2.
- Đề xuất sửa: Job (J-số mới hoặc trong J16) xóa `idempotency_key` có `created_at < now − idempotency_ttl_hours`, theo lô. SEC làm rõ A5: **C2 được phép** trong `response_body` khi có job TTL này; **C3 không bao giờ** (giữ `storeBody:false`). Test: khóa 49 giờ → bị xóa; replay sau đó → xử lý như request mới.
- Trạng thái: Open

### FB-R2-SEC-BE-40
- Mức độ: Minor
- Vị trí: BE-A – `events/internal/events.controller.ts:97-101` (vai/phiên chốt lúc mở luồng, đóng sau 15 phút); `events/public/events.service.ts:199` (`reservation.changed` không có audience)
- Vấn đề: Phiên bị thu hồi/đăng xuất/mất vai vẫn nhận sự kiện tới 15 phút. Không giới hạn số luồng mỗi người. `reservation.changed` phát id mọi đơn cho mọi vai (cả HK/SAL/CTV). Payload chỉ là id nên tác động thấp.
- Vì sao quan trọng: SR-SES (thu hồi phiên phải có hiệu lực ngay), SR-RL-09.
- Đề xuất sửa: Kiểm lại phiên ở mỗi nhịp 25 giây (`auth_resolve_session`), hoặc đóng luồng theo `sessionId` khi đăng xuất/thu hồi (NOTIFY `session.revoked`). Tối đa 5 luồng/người. `reservation.changed` chỉ gửi FD+ và người tạo/chốt đơn.
- Trạng thái: Open

### FB-R2-SEC-BE-41
- Mức độ: Minor
- Vị trí: BE-A – `frontdesk/internal/party.service.ts:490-496` (bỏ người: `removed_at` + hủy DEK nhưng giữ `child_name_hmac`)
- Vấn đề: HMAC của "TÊN|năm sinh" trẻ em vẫn nằm lại sau khi người bị bỏ khỏi đơn. Đây là băm có khóa của đầu vào entropy thấp. Ai có cả DB và `ID_HASH_KEY` có thể dò lại được.
- Vì sao quan trọng: SR-KEY-07 coi giá trị HMAC là C3; crypto-shredding phải xóa hết dấu vết của người đã bị bỏ (A-38).
- Đề xuất sửa: `UPDATE reservation_guest SET child_name_hmac = NULL` cùng giao dịch hủy DEK (nới CHECK nếu cần: `removed_at IS NOT NULL OR …`). Test: bỏ trẻ em → `child_name_hmac IS NULL`.
- Trạng thái: Open

### FB-R2-SEC-BE-42
- Mức độ: Minor
- Vị trí: BE-B – `db/migrations/0040_money_s3_be_b.sql:73-75` (`reconciled_by IS NULL OR self_reconciled OR (…)`); GRANT UPDATE cột `self_reconciled` cho `ottimo_app`
- Vấn đề: CHECK tách nhiệm (F5) bị vượt nếu đặt `self_reconciled = true`. Cột này app role ghi được, và không có ràng buộc nào chỉ cho OWN. Ngoài ra, trạng thái `reconciled`/`disputed` với `reconciled_by IS NULL` cũng qua CHECK. Hiện chỉ mã ứng dụng giữ "chỉ OWN được tự đối soát".
- Vì sao quan trọng: F5 yêu cầu lớp DB độc lập với mã (phòng lỗi mã/SQL injection).
- Đề xuất sửa: Thêm `reconciled_by_role` (snapshot) + CHECK `NOT self_reconciled OR reconciled_by_role = 'owner'`; CHECK `reconciliation NOT IN ('reconciled','disputed') OR reconciled_by IS NOT NULL`. Test: UPDATE `self_reconciled = true` cho MGR → 23514; thêm ca "người xác nhận VietQR đi đối soát → 403".
- Trạng thái: Open

### FB-R2-SEC-BE-43
- Mức độ: Minor
- Vị trí: BE-B – `payments/internal/payments.controller.ts:291-311` (`createVietQr` dùng `uow.run` mặc định → `qrPayload` có số tài khoản đầy đủ ở tag 38 nằm trong `idempotency_key.response_body`); `setParameter` (`generated/openapi-meta.ts:385` `idempotencyKey:false`)
- Vấn đề: (1) Số tài khoản nhận nằm trong bảng idempotency, và một lần phát lại sau khi OWN đổi tài khoản sẽ trả QR **cũ** kèm `receivingAccountRecentlyChanged` cũ – đúng loại sai lệch F3 muốn tránh. (2) Đổi tài khoản nhận không có `Idempotency-Key`, nên bấm lại sẽ ghi audit và push hai lần. Kiểm "không có trong idempotency_key" ở `payments-s3.test.ts:402-405` đang rỗng nghĩa (setParameter không ghi khóa).
- Vì sao quan trọng: F3 (tài khoản nhận là điểm gian lận số một – QR phải phản ánh tài khoản hiện hành).
- Đề xuất sửa: `createVietQr` → `storeBody:false` (phát lại chỉ trả id; FE đọc lại QR theo id); hoặc phát lại thì dựng lại payload từ tham số hiện hành. ARC thêm `Idempotency-Key` cho `setParameter` khi khóa thuộc `x-reauth-parameters`. Test sửa lại cho có nghĩa.
- Trạng thái: Open

### FB-R2-SEC-BE-44
- Mức độ: Minor
- Vị trí: BE-B – `folio/internal/folio-lines.service.ts:200-203` (`description` của `addFolioLine` – in lên bill, vào audit); `payments/internal/refunds.service.ts:201-203` (`accountHolder`), `:386` (`bankReference` – regex nhận 16 chữ số); `platform/public/receiving-account.ts:49` (`accountName`); `payments/internal/payments.service.ts:322-327` (`confirmPaymentReceived.receivedAt` chỉ chặn tương lai)
- Vấn đề: A4/SR-PAY-10: các ô văn bản tự do trên chưa qua Luhn → `CARD_NUMBER_DETECTED` và chưa bỏ ký tự điều khiển. `confirmPaymentReceived` cho SAL lùi `receivedAt` không giới hạn và FD+ nhập bù > 24 giờ không cần ghi chú (khác `recordPayment` – F4); không có cận dưới là lúc tạo QR.
- Vì sao quan trọng: Số thẻ không được nằm trên server (PCI, SR-PAY); giờ nhận tiền là cơ sở của giữ chỗ/đối soát (SEC-BE-22).
- Đề xuất sửa: Dùng chung `optionalText`/`requireReason` (đã có Luhn + bỏ ký tự điều khiển) cho các ô trên; `bankReference` từ chối dãy 13–19 số hợp Luhn. `confirmPaymentReceived`: `receivedAt ≥ payment.created_at`, áp quy tắc F4 như `recordPayment`. Test mỗi ô một ca Luhn.
- Trạng thái: Open

### FB-R2-SEC-BE-45
- Mức độ: Minor
- Vị trí: BE-B – `payments/internal/refunds.service.ts:426-443` (`original_method` → phương thức khoản thu gần nhất, không có thì `cash`), `:96-97` (`onDecided` chỉ xử lý `approved`)
- Vấn đề: (1) `executeRefund` với `original_method` mà phân giải ra `cash` thì không cần biên nhận, không cần `bankReference` và `reconciliation = not_required`, tức đi vòng qua yêu cầu bằng chứng của A47a. (2) Yêu cầu hoàn bị `rejected`/`cancelled` vẫn giữ `refund_account_enc` + DEK vô thời hạn, dù không còn mục đích (T09).
- Vì sao quan trọng: Bằng chứng chi tiền (BR-522, PO 16/10); hạn lưu C3.
- Đề xuất sửa: `original_method` phân giải ra `cash` → 409 `INVALID_TRANSITION` (phải chi qua `executeCashRefund` có biên nhận). Yêu cầu `rejected`/`cancelled`/`expired` → hủy DEK + NULL bản mã + `c3_access_log purge` trong hook quyết định. Test hai ca.
- Trạng thái: Open

### FB-R2-SEC-BE-46
- Mức độ: Minor
- Vị trí: BE-C – `files/public/encrypted-blob.service.ts:100-105` (`store.delete` chạy **trước** COMMIT), `:64` (`store.put` trước COMMIT); `registration/internal/retention.service.ts:61-104` (cả J16 một giao dịch, `LIMIT 500`, không ghi `failed`)
- Vấn đề: (1) Nếu giao dịch rollback sau khi đã xóa tệp (ví dụ tải lại ảnh khách ở `registration.service.ts:1717` rồi lỗi ở bước sau), DEK còn nhưng tệp mất: DB báo ảnh "còn sống" mà đọc thì 404. Ngược lại, `put` rồi rollback để lại bản mã mồ côi không ai dọn. Về bảo mật thì an toàn (không có bản rõ trên đĩa), nhưng mất tính toàn vẹn. (2) Một mục J16 luôn lỗi (EACCES, dữ liệu lạ) làm rollback cả lượt mỗi giờ ("poison pill" như SEC-BE-24); `retention_run.status='failed'` không bao giờ được ghi.
- Vì sao quan trọng: SR-RET-03 (J16 phải chạy được và báo lỗi được); tránh mất ảnh cần cho khai báo.
- Đề xuất sửa: Xóa tệp **sau** COMMIT (hàng đợi sau commit, hoặc J16 quét `purge_journal destroy_dek` chưa có `delete_blob` rồi xóa tệp); quét tệp mồ côi > 24 giờ không có dòng DB. J16: `SAVEPOINT` mỗi mục, đếm lỗi, ghi `retention_run` `failed` bằng giao dịch riêng.
- Trạng thái: Open

### FB-R2-SEC-BE-47
- Mức độ: Minor
- Vị trí: BE-C – `files/public/image-pipeline.ts:77-101` (không `.timeout()`, `sharp.cache` mặc định bật, `withSlot` có khe để lọt ảnh thứ 3); `guest-portal/internal/guest.controller.ts:196` (giải mã ảnh **trước** khi kiểm luồng đang mở / thông báo / 30 tệp); `src/http.ts:53, 90-95` (multipart 42 MB được đệm trước guard)
- Vấn đề: SR-FILE-03 yêu cầu giới hạn thời gian xử lý ảnh. Bộ nhớ đệm libvips có thể giữ điểm ảnh giấy tờ đã giải mã trong RAM sau khi xử lý xong. Người có link khách gửi liên tục ảnh 10 MB sau khi đã đủ 30 tệp vẫn đốt CPU sharp. Request không có phiên vẫn được đệm tới 42 MB (Caddy chặn 25 MB, nhưng api vẫn nên tự bảo vệ).
- Vì sao quan trọng: TM-50 (DoS VPS 1 replica); C3 lưu trong RAM lâu hơn cần thiết.
- Đề xuất sửa: `sharp.cache(false)` lúc khởi động; `.timeout({ seconds: 10 })`; trao khe trực tiếp cho người chờ. Phòng thủ chiều sâu theo advisory 2026: `sharp.block({ operation: ['VipsForeignLoad'] })` rồi chỉ `unblock` loader JPEG/PNG/WebP. guest-portal: kiểm luồng + số tệp (truy vấn nhẹ) trước `normalizeImage`, tính upload vào bộ đếm theo phiên/IP. Hook `onRequest` từ chối multipart không có cookie phiên (nhân viên/khách) trước khi đọc body.
- Trạng thái: Open

### FB-R2-SEC-BE-48
- Mức độ: Minor
- Vị trí: BE-C – `registration/internal/rules.ts:525-527` (`note.toUpperCase().match(/[A-Z0-9]{6,30}/g)`), `registration.service.ts:980-983` (chỉ so với giấy tờ đang kiểm), `rules.ts:94-96, 160` (`normalizeDocNumber` giữ `-`); `registration.service.ts:639-649` (`assertReason`: `if (reason) return;`)
- Vấn đề: (1) Chặn ghi lại số giấy tờ vào ghi chú bị vượt dễ dàng: "079 123 456 789", "079.123.456.789", "CCCD079123456789" (dính tiền tố quá 30 ký tự), số của **người khác** trong đoàn; `rejectedReason` chỉ có Luhn. (2) `reason=registration` vẫn được chấp nhận khi luồng đã đóng, nên B4 bị vượt.
- Vì sao quan trọng: Ghi chú là C2, hiển thị rộng hơn và không mã hóa; số giấy tờ lọt vào đó là C3 ra ngoài vùng bảo vệ. Lý do xem là căn cứ kiểm tra truy cập (SR-C3-07).
- Đề xuất sửa: Chuẩn hóa bỏ `[\s.\-/]`, cửa sổ trượt độ dài số giấy tờ trên chuỗi đã chuẩn hóa, so với HMAC của **mọi** giấy tờ trong khai báo; áp thêm quy tắc "≥ 6 chữ số liền nhau → `SENSITIVE_DATA_DETECTED`" của B-15 cho ghi chú kiểm tay và `rejectedReason`. `assertReason`: luồng đã đóng chỉ nhận `recheck`/`guest_request`/`authority_request`. Test các biến thể.
- Trạng thái: Open

### FB-R2-SEC-BE-49
- Mức độ: Minor
- Vị trí: BE-C – `0003_parameter_bounds.sql:79` (`id_image_purge_max_hours` biên 1–72); `files/public/attachment.service.ts:135-141` (50/ngày đếm rồi mới chèn, không khóa); chưa có giới hạn 20 tệp/phiếu-lần kiểm (I7, `openapi.yaml` `x-rate-limit` đã khai); `guest-portal/internal/guest.controller.ts:215-228` (`recordGuestConsent` không tính vào 20 lần ghi/ngày, không idempotent – mỗi lần chèn `consent_record` + tăng `registration.version`)
- Vấn đề: OWN có thể đặt hạn T01 tới 72 giờ, vượt trần 24 giờ của SR-RET-02/BR-609. Giới hạn I7/G9 có lỗ.
- Vì sao quan trọng: Trần hạn lưu là cam kết pháp lý, không phải cấu hình tự do; spam đồng ý gây `CONCURRENT_UPDATE` cho lễ tân và làm phình hồ sơ đồng ý.
- Đề xuất sửa: Biên `id_image_purge_max_hours` 1–24 (migration sửa `bounds`). Đếm 50/ngày trong `SELECT … FOR UPDATE` trên dòng đếm hoặc advisory lock theo người; thêm 20/phiếu khi Sprint 4 có phiếu. `recordGuestConsent` tính vào bộ đếm 20 ghi/ngày và bỏ qua nếu quyết định trùng bản ghi mới nhất.
- Trạng thái: Open

### FB-R2-SEC-BE-50
- Mức độ: Minor
- Vị trí: BE-C – `guest-portal/internal/guest-portal.service.ts:417-422` (`notice_locale = g.locale`); test thiếu: Origin của nhánh khách (`test/helpers/feature-app.ts:59` đặt `guest: []` → `originAllowed` luôn true – `shared/http/csrf.ts:55`), bộ lọc `x-guest-level` của serializer (grep `guestLevel` trong `test/` không có), danh sách khóa `OnlineCheckin` chỉ áp cho GET đầu (`guest-portal.test.ts:189`); snapshot 4 vai chưa kiểm `docType`/`fullNameOnDoc` (B2)
- Vấn đề: (1) Bằng chứng đọc thông báo ghi ngôn ngữ phiên (`ru`) trong khi văn bản hiện bằng EN – xem quyết định (a). (2) Ba kiểm soát G2/G5/B2 [CHẶN] đúng ở mã nhưng không có test chạy được, nên một lần sửa sai sau này sẽ không bị phát hiện.
- Vì sao quan trọng: R-CON-02 (bằng chứng đồng ý/đọc thông báo phải đúng); ĐK-2 yêu cầu test chạy mỗi PR.
- Đề xuất sửa: `updateOnlineCheckin` nhận `noticeLocale` (ngôn ngữ thực hiển thị). Server chỉ chấp nhận ngôn ngữ thuộc danh sách bản thông báo đã duyệt (hiện `vi`, `en`); `ru` → ghi `en`. Test: (a) PUT/POST khách không có Origin và có Origin lạ → 403 (feature-app đặt `guest: ['https://g.test']`); (b) unit `serializeResponse('getGuestStay', …{guestFullName, doorCode}, {roles:['guest'], guestLevel:1})` → hai khóa vắng mặt; (c) `ALLOWED_OCI_KEYS` cho mọi phản hồi update/upload/consent/complete; (d) snapshot HK/MT/SAL/CTV không có `docType`, `fullNameOnDoc` ở mọi DTO có liên quan.
- Trạng thái: Open

### FB-R2-SEC-MOB-02
- Mức độ: Minor
- Vị trí: MOB – `apps/guest-web/src/checkin/CheckinFlow.tsx:219-222` (gửi `noticeVersion` nhưng không gửi ngôn ngữ đã hiển thị), `apps/guest-web/src/App.tsx:26` (tải lại trang lấy `browserLocale()` thay vì ngôn ngữ phiên), `app/config.ts:20,26` (`NOTICE_VERSION`, `RETENTION_DAYS_DEFAULT = 30` cố định), `app/i18n.tsx:27-35`
- Vấn đề: Làm theo quyết định (a)/(b): ngôn ngữ ghi vào bằng chứng có thể lệch theo mọi chiều sau khi tải lại trang; số ngày trong câu đồng ý cố định 30 ngày, nên sai ngay khi OWN đổi tham số.
- Vì sao quan trọng: Bằng chứng đồng ý phải khớp đúng câu chữ khách đã đọc (R-CON-02).
- Đề xuất sửa: Gửi `noticeLocale: shownLocale(locale, 'gw.notice_body')`. Thêm `gw.notice_read` vào `RU_UNREVIEWED_LEGAL`. Khi có `currentNoticeVersion`/`imageRetentionDays` (quyết định b) thì dùng giá trị server, thiếu thì không hiện bước đồng ý. Khi có `GET /v1/guest/sessions/current` thì khôi phục ngôn ngữ phiên lúc tải lại. Test RU: 8 khóa hiện EN, locale gửi đi = `en`.
- Trạng thái: Open

### FB-R2-SEC-BE-51
- Mức độ: Suggestion
- Vị trí: BE-C – `crypto/internal/envelope-crypto.service.ts:190-229`; `0050_crypto_files_be_c.sql:100`, `0051_registration_be_c.sql:183-184`; `guest-portal/internal/guest-portal.service.ts:229-230`, `guest.controller.ts:123`
- Vấn đề / gợi ý: (1) `blindIndex` dùng thẳng `ID_HASH_KEY`. Lần sau nên chuyển sang khóa con HKDF có `info` + phiên bản (`ottimo:doc_number:v2`), để xoay `ID_HASH_KEY` có đường làm lại chỉ mục, và ghi runbook. (2) `rewrap` lỗi cả lô nếu một DEK có `kek_version` chưa nạp: nên bỏ qua + đếm. (3) `decrypt` có thể kiểm `data_key.purpose` khớp mục đích mong đợi (phòng thủ chiều sâu, AAD đã chặn tráo). (4) Trigger chặn `data_key.destroyed_at` từ có giá trị về NULL. GRANT `guest_document`/`document_image` theo cột (hiện UPDATE cả bảng), kèm trigger chặn đặt lại `deleted_at`/`purged_at`/`blob_key`/`data_key_id`. (5) T03 (xóa trường khai báo 12 tháng sau trả phòng) chưa có job: cần trước GL. (6) Sau trả phòng (`stayEnded`) không trả `guestFirstName`/`roomNo`. Cookie phiên khách nên là cookie phiên (không `Expires`) hoặc có hạn nhàn rỗi cho mức 1.
- Trạng thái: Open

### FB-R2-SEC-BE-52
- Mức độ: Suggestion
- Vị trí: BE-A – `events/public/events.service.ts:113-116, 133-135` (B-21: giá trị `params` chỉ giới hạn ≤ 40 ký tự); `registration/internal/stay-reader.ts:70,79` (mặc định `SYSTEM_ACTOR`); `frontdesk/frontdesk.module.ts:81,87` (`FD_GUEST_ACCESS_PORT` tùy chọn, rơi về `NoGuestAccessPort`)
- Vấn đề / gợi ý: (1) Kiểm định dạng theo khóa (`code` = mã đơn/WO, `roomNo`, ngày, số), để tên/SĐT ngắn không lọt vào mục "Cần chú ý". Một dòng `attention_event` hỏng không nên làm cả danh sách trả 500. (2) Bỏ giá trị mặc định `SYSTEM_ACTOR`: bắt buộc truyền actor, job/khách truyền tường minh (chống fail-open khi thêm lời gọi mới). (3) Khi chạy api, thiếu `FD_GUEST_ACCESS_PORT` thì dừng khởi động thay vì lặng lẽ không thu hồi link khi hủy đơn.
- Trạng thái: Open

### FB-R2-SEC-INT-06
- Mức độ: Suggestion
- Vị trí: INT – `integrations/payment/vietqr/adapter.ts:80-105` (tham số `payment_receiving_account` trống → rơi về `PAYMENT_VIETQR_*` của `.env`)
- Vấn đề / gợi ý: Đường rơi về `.env` đi vòng qua mọi kiểm soát F3 (chỉ OWN, xác nhận mật khẩu, audit `money`, push, cảnh báo 24 giờ). Hiện API không dùng adapter này (BE-B dựng payload trực tiếp và trả 409 khi chưa cấu hình), nên rủi ro mới chỉ tiềm ẩn. Đề nghị bỏ đường rơi về `.env` ở `APP_ENV=staging|production` (chỉ giữ cho dev/test), hoặc xóa hẳn và để `healthCheck` báo `not_configured`.
- Trạng thái: Open

---

## 6. Điểm làm tốt (nên giữ)
- **Mã hóa phong bì của BE-C** đúng sách: AAD gắn bản ghi + phiên bản KEK lúc niêm phong, DEK bọc có AAD riêng, hủy DEK không đảo ngược được, test ranh giới `crypto-boundary.test.ts` chặn module khác đụng `data_key`/KEK. Quyết định HKDF tách miền gọn và không cần thêm bí mật.
- **Cổng C3 dùng chung** (`C3AccessGate`): thứ tự kiểm, ghi log trước dữ liệu, 503 khi không ghi được log, SR-RL-06 đếm trong DB, `no-store` – BE-B dùng lại cho tài khoản hoàn thay vì tự làm.
- **ĐK-1…6 phía API và guest-web làm chặt**: không đăng ký 5 route mức 2, token 256 bit chỉ lưu băm và không vào bảng idempotency, client lọc trắng khóa mức 1, không lưu gì trên máy khách, MSW không thể lọt vào bản production. **Tách nhiệm tiền bằng CHECK DB** (đối soát, tiền mặt nộp quầy, hoàn tiền, FK cặp người tạo) – lớp phòng thủ thứ hai mà ít đội làm.

---

## 7. Ký phần dữ liệu cá nhân – BUG-R2-033 (b): hồ sơ khách "từ giấy tờ" (SEC, 17/10/2026)

Yêu cầu: ORC 17/10 theo quyết định PO 17/10 (decision-log: BUG-R2-033 (b) chọn A – có điều kiện SEC ký). Căn cứ: `security/data-risk-assessment.md` P05 (CRM cần đồng ý), **F03** ("không dùng số giấy tờ làm khóa CRM; nếu nhận diện khách quen bằng giấy tờ thì chỉ băm có khóa **và chỉ khi khách đồng ý P05**"), T03, T05; erd `guest.id_doc_hmac` ("chỉ khi có đồng ý P05"); BR-951, BR-952, BR-955 (người đi cùng tự đồng ý). Đã đọc mã đang làm `frontdesk/internal/document-party.port.ts`, `registration/public/party-port.ts`, `registration/internal/rules.ts:95-97`.

**Kết luận: DUYỆT CÓ ĐIỀU KIỆN.** Được tạo hồ sơ "từ giấy tờ" để gắn người đi cùng vào đơn (mục đích P01 thực hiện lưu trú + P02 khai báo). Hồ sơ này **không phải hồ sơ CRM**. Số giấy tờ **không** thành khóa định danh lâu dài của hồ sơ khi chính người đó chưa đồng ý P05. Đây là điểm SEC sửa so với câu "khóa định danh = số giấy tờ" trong quyết định PO, để giữ F03.

### 7.1 Trường tối thiểu (điểm 1)
| Được lưu trên `guest` nguồn `document` | Không được lưu (vẫn chỉ nằm trong `guest_document` mã hóa, theo T03) |
|---|---|
| `code`; `full_name` (tên trên giấy tờ) + `name_search`; `nationality_code` (đổi alpha-3 → alpha-2) + `is_foreigner`; `source = 'document'` (mới); `crm_consent = 'not_asked'`; `created_by`/`created_at`; `last_stay_checkout_at` (mốc hạn lưu – có thể tính từ đơn) | Ngày sinh, giới tính, số giấy tờ, 4 số cuối (`id_doc_last4`), HMAC số giấy tờ (khi chưa có P05), địa chỉ, thị thực, ảnh; SĐT/email (không có); `tags`, `free_note`, `service_notes`, phân khúc (đều là mục đích P05) |

Ngày sinh **không** chép sang hồ sơ: chép ra là đưa C3 (D03) ra khỏi kho mã hóa và kéo dài quá T03. Hệ quả cố ý: hồ sơ "từ giấy tờ" không khớp được theo tên + ngày sinh ở lần ở sau.

### 7.2 Hạn lưu hồ sơ không có liên hệ (điểm 2)
- Áp **T05**: **ẩn danh hóa 12 tháng sau lần trả phòng cuối** (`full_name`, `name_search` → NULL/mã; giữ `code`, `nationality_code` cho thống kê; đặt `anonymized_at`). Gắn với T03 (dữ liệu khai báo cũng hết 12 tháng sau trả phòng). Tham số `document_profile_retention_months` (mặc định 12, biên 1–12, chỉ OWN sửa, audit `config`).
- Hồ sơ ra khỏi chế độ này chỉ khi: chính người đó đồng ý P05 tại quầy (`consent_record` `subject_type = guest`, R-CON-04, BR-955 – không dùng đồng ý của người đặt) → áp T06; hoặc hồ sơ được thêm liên hệ/thành người đứng tên → áp quy tắc CRM như hồ sơ thường (T05/T06).
- Có cần lưu ngắn hơn hay dài hơn là câu hỏi pháp lý: **đã thêm câu phụ vào ESC-001** (không ESC mới). Trong lúc chờ: 12 tháng, `[GIẢ ĐỊNH SEC – chờ luật sư]`. Job ẩn danh bắt buộc có **trước khi đưa dữ liệu khách thật vào** (cổng ESC-001), không bắt buộc để merge Sprint 3.

### 7.3 Khóa số giấy tờ để khớp sau khi ảnh/giấy tờ bị xóa (điểm 3)
- BR-609 chỉ xóa **ảnh**; trường giấy tờ (gồm `guest_document.doc_number_hmac`) sống tới T03. Việc khớp **trong cùng đơn/khai báo** dùng `doc_number_hmac` như hiện tại (chống nhập trùng), không phụ thuộc ảnh.
- Khớp **qua các lần ở** (nhận ra người quay lại) chỉ được dùng khóa trên hồ sơ `guest.id_doc_hmac`, và cột này **chỉ được ghi khi người đó đã đồng ý P05** (F03, erd). Khi có P05, khóa sống độc lập với ảnh (BR-609) và với trường khai báo (T03), không bao giờ có bản rõ. Khóa bị xóa khi rút P05 hoặc hết T06.
- Cách tính khóa hồ sơ (mới, khác chỉ mục trong khai báo): `keyedHash('guest_doc', "<loại: passport|vn_id|other>|<quốc gia cấp alpha-3>|<số chuẩn hóa>")` = HMAC-SHA256 với khóa con HKDF(`ID_HASH_KEY`, info `ottimo:guest_doc:v1`) – cùng cơ chế đã duyệt cho `child_name`. Lý do: (a) đưa loại + quốc gia vào khóa để hộ chiếu trùng số của hai nước không bị gắn nhầm người; (b) tách miền với `doc_number_hmac` của khai báo, nên bảng khai báo lộ ra không nối thẳng được sang CRM; (c) có `v1` để xoay sau này. Chuẩn hóa số: in hoa, bỏ `[\s.\-/]` (cùng sửa BE-48 – `normalizeDocNumber` hiện chỉ bỏ khoảng trắng). Giá trị là C3 (SR-KEY-07), không trả API, không vào audit/log/outbox.
- Không có P05: HMAC tính trong bộ nhớ lúc `addGuestDocument` chỉ để **so** với hồ sơ đã có P05 (người đó chính là khách đã đồng ý), rồi bỏ. Không ghi lên hồ sơ "từ giấy tờ".

### 7.4 Điều kiện theo vai
| Vai | Điều kiện |
|---|---|
| **BE-B** (guests) | Cột `source` (`desk\|ota\|document\|…`) + CHECK: `source = 'document'` được thiếu SĐT/email; CHECK `id_doc_hmac IS NULL OR crm_consent = 'granted'` (F03 ở tầng DB) – kèm việc xóa `id_doc_hmac` khi rút P05. Hàm tạo hồ sơ "từ giấy tờ" là cổng public riêng (không qua form CRM), chỉ nhận đúng trường ở 7.1. API từ chối `tags`/`free_note`/`service_notes` cho hồ sơ `document` chưa có P05. Loại khỏi danh sách/xuất tiếp thị, khỏi `searchGuests`/`lookupGuestByContact` của SAL/CTV (rbac D10). Job ẩn danh T05 (7.2) trước khi có dữ liệu thật. Audit `guest.created` ghi `source` + mã đơn, không tên/giấy tờ |
| **BE-C** (registration) | Tính khóa 7.3 trong bộ nhớ, chuyển cho cổng party; **không** truyền ngày sinh để lưu (chỉ để so trong đơn). Sửa chuẩn hóa số giấy tờ (BE-48). Khi T03 xóa trường khai báo, xóa luôn `doc_number_hmac`. Test: hồ sơ "từ giấy tờ" không có ngày sinh/số/4 số cuối/HMAC; xóa ảnh theo BR-609 rồi nhập lại cùng số trong cùng đơn → 409 `PARTY_DUPLICATE` như cũ |
| **BE-A** (party, `document-party.port.ts`) | Bước 2 (khớp hồ sơ ngoài đơn): **chỉ** tự gắn khi khớp `id_doc_hmac` (tức hồ sơ có P05). Khớp **tên + ngày sinh** với hồ sơ ngoài đơn **không** được tự gắn (BR-952 coi là "nghi trùng"; gắn nhầm người làm lộ lịch sử/ghi chú của khách khác cho đơn này) → trả null + cờ "có thể là khách quen" để lễ tân xác nhận. Không khớp → tạo hồ sơ 7.1 qua cổng BE-B, gắn `role = companion`, quan hệ `unknown`; vượt số khách thì vẫn gắn + cảnh báo (theo PO). Trẻ em: không hồ sơ |
| **BA** | EP06 2.2 + EP00 (bảng `phone`/`email`): ngoại lệ liên hệ chỉ cho `source = document`; ghi 7.1–7.3; rbac D10/D01: SAL/CTV không thấy hồ sơ `document`, HK chỉ tên + căn trong ngày; luồng tại quầy "hỏi người đi cùng đồng ý P05" (tùy chọn, hai nút ngang hàng, không chọn sẵn) – đồng ý thì mới ghi khóa giấy tờ lên hồ sơ |
| **ARC** | ERD: `guest.source`, `guest.last_stay_checkout_at` (hoặc tính từ đơn), 2 CHECK ở trên, định nghĩa `id_doc_hmac` = `keyedHash('guest_doc', …)` v1; thêm `'guest_doc'` vào kiểu `keyedHash`; OpenAPI: `Guest.source` (FD+), không có trường giấy tờ nào trên `Guest`; tham số `document_profile_retention_months` |

Không có thẻ Blocker/Major mới: đây là điều kiện để merge sửa BUG-R2-033. SEC kiểm ở bước kiểm lại Sprint 3 (CHECK DB, test hồ sơ tối thiểu, test "tên + ngày sinh không tự gắn").

---

## 8. Ngoại lệ FE-06 cho link check-in online (SEC, 17/10/2026)

Yêu cầu: ORC 17/10. Đã đọc `apps/admin-web/src/app/c3.ts:7-89` và `pages/reservations/GuestLinkPanel.tsx:11-140` (cây làm việc, chưa commit).

**Kết luận: DUYỆT CÓ ĐIỀU KIỆN.** Link khách là token mức 1 (thấy mã đơn, tên gọi, số căn, Wi-Fi; chỉ **gửi** được ảnh giấy tờ, không đọc lại). Nó không phải dữ liệu C3, có thể thu hồi, và cấp lại sẽ hủy link cũ. Lễ tân cần chuyển sang Zalo để dán, nên chấp nhận không xóa clipboard và không ẩn link khi đổi tab. Các giới hạn còn lại vẫn giữ: clipboard 60 giây, xóa khi rời màn/đóng drawer, thu hồi, đăng xuất; link hiện tối đa 5 phút, chỉ nằm trong bộ nhớ của màn.

Điều kiện (FE):
1. `onTabHidden: false` **chỉ** được dùng ở `GuestLinkPanel` (cả `useC3Reveal` lẫn `useC3Clipboard`). Thêm test quét `src`: ngoài tệp này mà có `onTabHidden: false` thì đỏ. Muốn dùng ở chỗ khác phải qua SEC. Không bao giờ dùng cho số giấy tờ, dữ liệu cổng, tài khoản hoàn.
2. **Xóa bù khi quay lại.** Khi trang không có focus, trình duyệt từ chối `clipboard.writeText` (lễ tân đang ở Zalo đúng lúc hết 60 giây), nên lần ghi đè rỗng sẽ thất bại im lặng. Hết hạn mà ghi không được thì giữ cờ "chờ xóa" và ghi đè ngay khi trang có lại focus/hiện lại (`focus` / `visibilitychange` → `visible`). Test: hết 60 giây khi tab ẩn → khi hiện lại thì `writeText('')` được gọi.
3. Link và QR: QR vẽ bằng `QrCode` trong bundle (không dịch vụ ngoài – F2). Không ghi URL/token vào log, toast, lỗi, `console`, storage hay thanh địa chỉ. Đóng hộp thì ẩn ngay (đã có).
4. UXD: câu cạnh nút Sao chép nhắc "gửi riêng cho khách (tin nhắn 1–1), không gửi vào nhóm"; nếu gửi nhầm thì dùng "Thu hồi link".

---

## 9. Kiểm lại trước cổng QC Sprint 3 – SEC-BE-32, SEC-OPS-03 (SEC, 17/10/2026)

- Yêu cầu: ORC 17/10 (decision-log: dòng SEC "chưa cho qua cổng QC Sprint 3…" và dòng ORC "ngoại lệ cổng sprint"); ĐK-S3-5 của `qc/s3-qc-gate.md`.
- Mã kiểm: `6af7173`. HEAD `adc0a47` chỉ thêm tài liệu: `git diff 6af7173 HEAD -- product` rỗng, `product/` không có thay đổi chưa commit. CI 38998735861 xanh.
- Cách làm: đọc mã; chạy test trên **PostgreSQL thật**, DB riêng `ottimo_verify_sec_gate` (tạo mới theo `recreate-db.sh`, chạy đủ migration, app Nest thật qua Fastify inject, gọi endpoint thật `DELETE …/party/{memberId}`); chạy `infra/ci/check-caddy-prod.sh` trên ảnh `ottimo-web:demo` (dựng từ `adc0a47`). Test tái hiện của SEC nằm **ngoài repo** (scratchpad `gate/sec/a38.test.ts`, kết quả `report.json`). Dữ liệu giả.
- Phạm vi lượt này: SEC-BE-32, SEC-OPS-03 và hai Major tách từ SEC-BE-32. **Chưa** kiểm lại 8 Major còn lại của mục 5 (BE-33…38, FE-06, MOB-01) – vẫn thuộc ĐK-S3-5 (hạn: trước lần deploy staging đầu tiên và trước cổng QC Sprint 4).

### 9.1 FB-R2-SEC-BE-32 (Blocker) – Verified 17/10/2026

| Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|
| (1) Trả phòng luôn hẹn xóa mọi ảnh còn sống, bất kể trạng thái khai báo | Đạt | `registration.service.ts` `onCheckedOut` → `scheduleAfterStay` (:1860–1874, :1136–1171): chưa `confirmed` → hết lưu trú + `id_image_unconfirmed_max_days` (≤ 7); đã `confirmed` → T02 cho người đồng ý, ngay cho người không đồng ý |
| (2) J16 độc lập với hook | Đạt | `scheduleEndedStays` (:1036–1102) đọc trạng thái đơn qua stay view, không dựa `stay_ended_at`; savepoint mỗi khai báo, có con trỏ |
| (3) Test `Clock` giả: 7 ngày −/+, `purge_journal`, `c3_access_log purge`, `legal_hold` giữ | Đạt | `registration-flow.test.ts` **22/22 xanh trên DB thật**, gồm các ca "SEC BE-32…", "SEC BE-32 reopened" ×2, "Re-verification Major a", "Fix round 4" (đơn OTA gia hạn), K12 |
| Major a – đơn kẹt `confirmed`/`in_house` quá ngày đi, ảnh không bị xóa | **Đạt** | Ca repo (ảnh lễ tân nhập, `confirmed` + `in_house`, có mục "Cần chú ý" `registration_stay_not_closed`). SEC thêm biến thể **ảnh khách tải qua link** (đơn `confirmed` 15→16/10, không ai đóng): ngày đi + 6 ngày → 2/2 ảnh còn, chưa có hạn; + 7 ngày → 2/2 ảnh xóa, `delete_reason = unconfirmed`, DEK hủy, tệp mất |
| Major b – A-38 bỏ người phải xóa ảnh khách tự tải | **Không đạt** | Tái hiện được, xem 9.3 → thẻ mới **FB-R2-SEC-BE-53** |

Các Minor của SEC-BE-32 trong `s3-blocker-reverification.md` không chặn; SEC không kiểm lại từng mục ở lượt này.

### 9.2 FB-R2-SEC-OPS-03 (Blocker) – Verified 17/10/2026 phần cấu hình + CI; chờ smoke staging

- `infra/caddy/Caddyfile.prod` và `infra/docker-compose.prod.yml` đã commit (`229db99`). Nội dung đủ 4 điểm đề xuất:
  - CSP cho 3 host, không có `unsafe-*`. Guest: `worker-src 'none'`, `Referrer-Policy: no-referrer`, `no-store`.
  - Log truy cập và log lỗi bỏ query, che `/g/*` thành `/g/[redacted]`, xóa header request/response.
  - `blobdata` chỉ gắn vào api + worker, không gắn vào `web`; `BLOBSTORE_LOCAL_PATH=/var/lib/ottimo/blobs` (tuyệt đối).
  - Các đường `/var|/data|/blobs|…`, `.map`, dot-file → 404.
- SEC tự chạy `check-caddy-prod.sh ottimo-web:demo`: **33/33 `ok`, 0 FAIL**. Các ca đã kiểm:
  - header 3 host khớp đúng `expected-headers.sh`;
  - probe 404 trên tệp thật, đối chứng 200;
  - body khai 1,1 MB → 413;
  - cổng 80 `/g/<token>` → 308;
  - log có dòng `/g/[redacted]`; không dòng log nào chứa token, giá trị query hay giá trị header.
- CI chạy cùng script mỗi PR (`.github/workflows/ci.yml:141` bản stub, `:246` ảnh thật).
- Phần chưa kiểm được trên máy: HSTS với chứng chỉ thật, cookie `__Host-` và Origin theo tên miền thật, log Caddy trên VPS → SEC smoke trên staging (ĐK-S3-8). Thẻ đóng sau smoke này.
- Hệ quả:
  - không còn chặn cổng QC Sprint 3, không chặn deploy staging (`deploy.sh` có smoke riêng);
  - **vẫn chặn** gửi link check-in cho khách thật và nhập giấy tờ của khách thật trên staging/production cho tới khi SEC smoke staging đạt.

### 9.3 Tái hiện nghi vấn A-38 của critic trên PostgreSQL thật – lỗi THẬT

Nghi vấn: `onPartyMemberRemoved` (`registration.service.ts:1921–1955`) hủy giấy tờ khách tải qua link theo điều kiện `!party_member_id && person_index > personsTotal` (:1931). guest-web chỉ đánh số ô "Khách {n}", không gắn tên (`DocumentsStep.tsx:246`, chuỗi `guest.oci.person_n`). Vì vậy **không có mối nối nào** giữa ô n và thành viên trong đoàn: điều kiện này luôn hủy ô cuối, bất kể ai bị bỏ.

Mỗi ca: đơn seed, thành viên chèn vào `reservation_guest`, khách tải 1 ảnh hộ chiếu cho mỗi ô qua `guestUpload`, lễ tân bỏ người qua endpoint thật (HTTP 204), rồi `sweepAfterCommit`.

| Ca | Thiết lập | Kết quả đo được |
|---|---|---|
| R1 – ca critic | `in_house`, 3 người lớn; thành viên A (thứ 1), B (thứ 2); khách tải Khách 1/2/3; **bỏ A (giữa)** | **Khách 3 bị hủy** (`removed_at`, DEK hủy, tệp mất). **Khách 2 giữ nguyên** (DEK sống, tệp còn). Đơn 3→2 người lớn nhưng `required_count` **vẫn 3**; `uploadedPeople = [1,2]` |
| R2 – đối chứng | Như R1, **bỏ B (cuối)** | Giống hệt R1: Khách 3 bị hủy. Việc hủy không phụ thuộc người bị bỏ |
| R3 – trước ngày đến | `confirmed`, 2 người lớn, 1 người đi cùng, khách tải Khách 1/2; bỏ người đi cùng | **Không hủy giấy tờ nào**: Khách 2 (của người đã bỏ) còn ảnh, DEK sống, `delete_after` NULL. Số người của đơn không đổi nên link báo đủ 2/2 bằng hộ chiếu của người đã bỏ. Đây là lúc link được dùng nhiều nhất |
| R4 | `in_house`, khai 3 người lớn, chỉ ghi 1 người đi cùng; bỏ người đó | **Khách 3 bị hủy**: người thứ ba chưa được ghi tên, vẫn đang ở. Khách 2 giữ |
| R5 – đối chứng | Như R1 nhưng giấy tờ Khách 2/3 đã gắn thành viên (lễ tân hoàn tất, cổng party gắn) | Đúng: Khách 2 hủy, Khách 3 giữ → lỗi chỉ ở giấy tờ khách tải **chưa gắn người** |
| R6 – hạn giữ sau R1 | Như R1, đơn đi 17/10, không ai đóng | Ngày đi + 6 ngày: ảnh Khách 1/2 chưa có hạn. + 7 ngày: J16 xóa hết. Lưới C5 vẫn chặn được việc giữ vô hạn |

Đánh giá:
- **Quyền riêng tư**: ảnh và giấy tờ của người đã rời đoàn được giữ tới hết lưu trú + 7 ngày (khai báo chưa `confirmed`). Theo mã, nếu khai báo đã `confirmed` và người đó đồng ý thì giữ tới T02 sau trả phòng. Với đơn dài hạn, thời gian giữ có thể nhiều tháng. Như vậy trái A-38 và nguyên tắc "hết mục đích phải xóa" (NĐ 13/2023 – cần xác nhận pháp lý).
- **Toàn vẹn**: hủy không hoàn tác giấy tờ của khách **còn ở** (R1, R4); khách phải gửi lại hoặc lễ tân nhập lại.
- **Khai báo lưu trú**: R3 – link báo đủ người bằng giấy tờ của người không ở → có nguy cơ khai nhầm người.
- **Không lộ dữ liệu**: không có truy cập trái quyền; dữ liệu vẫn mã hóa, chỉ xem qua cổng C3 có log.
- Kèm theo: bỏ người đang ở không cập nhật `required_count` (`party.service.ts:515–634` không gọi `onPartyChanged` và không phát `stay_changed`), nên khai báo vẫn đòi số người cũ.

### FB-R2-SEC-BE-53
- Mức độ: Major (rủi ro SEC: Trung bình)
- Vị trí: BE-C – `registration/internal/registration.service.ts:1921–1955` (`onPartyMemberRemoved`, điều kiện `person_index > persons` ở :1931); BE-A – `frontdesk/internal/party.service.ts:515–634` (`remove`: không cập nhật số người của khai báo); ARC – `removePartyMember` trong `openapi.yaml`
- Vấn đề: Bỏ người khỏi đoàn hủy giấy tờ khách tải qua link **theo vị trí ô**, không theo người. Đo trên PostgreSQL thật (9.3):
  - bỏ người giữa → hủy ảnh của người còn ở (R1, R4) và giữ ảnh của người đã bỏ;
  - bỏ người trước ngày đến → không hủy gì (R3);
  - `required_count` không giảm sau khi bỏ người đang ở.
  
  Thẻ này mở lại Major b tách từ SEC-BE-32. Phản hồi "Fixed" ở `responses/s3-BE-C.md` chỉ đúng với ca 2 người bỏ người cuối (`registration-flow.test.ts:1659`).
- Vì sao quan trọng: A-38/T03 (dữ liệu C3 của người bị bỏ phải hủy ngay); giữ hộ chiếu/CCCD quá mục đích; xóa nhầm dữ liệu không khôi phục được; nguy cơ khai báo lưu trú sai người. Xếp Major, không Blocker: không lộ cho người không có quyền, hạn giữ có trần nhờ C5/J16, ảnh xóa nhầm chụp lại được, chưa có dữ liệu thật. Không phạm dòng [CHẶN] nào: C5 vẫn đạt.
- Đề xuất sửa:
  1. **BE-C**: bỏ nhánh `person_index > persons`. Không bao giờ hủy giấy tờ bằng cách đoán theo vị trí ô.
  2. **ARC + BE-A**: `removePartyMember` nhận `guestUploadPersonIndex` (số nguyên ≥ 2, hoặc `null` = "người này không gửi ảnh qua link").
     - Trường này bắt buộc khi đơn còn giấy tờ khách tải chưa gắn người (`party_member_id IS NULL`, `person_index ≥ 2`, chưa `removed_at`).
     - Thiếu trường → 422 `REQUIRED`. `errors` chỉ kèm các số "Khách n" chưa gắn, không kèm ảnh hay tên.
     - BE-C hủy **đúng** giấy tờ được chọn, trong cùng giao dịch: DEK, ảnh, trường, `removed_at`, `c3_access_log delete`, `purge_journal`.
  3. **FE + UXD**: hộp xác nhận bỏ người hỏi "Ảnh giấy tờ khách đã gửi qua link nào là của <tên>?" với các nút Khách 2, Khách 3… và "Không có". Không chọn sẵn. Muốn xem ảnh để đối chiếu thì đi qua đường C3 hiện có: thiết bị được cấp, step-up, có log.
  4. Sau khi hủy:
     - dồn `person_index` của các giấy tờ chưa gắn phía sau xuống 1, để ô vẫn liền 1..n;
     - gọi `onPartyChanged` với số người mới, để `required_count` và số ô trên link khớp đơn.
  5. **Test** (PostgreSQL thật, endpoint thật):
     - 3 người, bỏ người giữa, chọn Khách 2 → Khách 2 hủy; Khách 3 giữ và thành Khách 2; `required_count = 2`;
     - đơn `confirmed`, bỏ người, chọn Khách 2 → hủy;
     - có giấy tờ chưa gắn nhưng không gửi lựa chọn → 422, không hủy gì;
     - chọn `null` → không hủy giấy tờ nào, audit có ghi;
     - giấy tờ đã gắn người → hủy theo `party_member_id`, như R5;
     - như R4 → người thứ ba không bị đụng tới.
  
  Phương án dự phòng nếu chưa đổi được API trong Sprint 4: khi bỏ người mà còn giấy tờ chưa gắn, không hủy giấy tờ nào ngay. Thay vào đó, đặt `delete_after = now + 24 giờ` cho các giấy tờ chưa gắn từ Khách 2 trở đi, kèm mục "Cần chú ý" cho FD. Lễ tân gắn giấy tờ của người còn ở vào thành viên (`updateDocument` + `partyMemberId`) để giữ lại. Cách này chấp nhận xóa ảnh chưa ai nhận, không bao giờ giữ ảnh vô chủ.
- Hạn:
  - trước cổng QC Sprint 4 (Major phải sửa trong round);
  - **và** trước khi có dữ liệu khách thật (gửi link check-in cho khách thật, hoặc nhập giấy tờ thật trên staging/production), mốc nào đến trước thì áp mốc đó.
  - **Không** cần sửa trước buổi INV bấm thử demo localhost (dữ liệu giả).
- **Kiểm lại 17/10 (`ea29582`, vòng 9b – phương án dự phòng):** phần BE **Verified 17/10 (ea29582)** – R1–R6 và Major a đo lại trên PostgreSQL thật, DB riêng mới `ottimo_verify_sec_9b`, kết quả đúng như BE-C mô tả (mục 9.5). **Còn thiếu** để đạt SEC-G1:
  - FE + UXD: Desk gắn giấy tờ khách tải qua link vào người còn ở, hiện hạn chờ trên từng giấy tờ và mục "Cần chú ý" → **FB-R2-SEC-FE-07** (Major). Chưa có phần này thì người còn ở vẫn mất giấy tờ sau 24 giờ;
  - phương án chính (đề xuất 2–5: `guestUploadPersonIndex` + hộp chọn ô + dồn số ô) – dời trước cổng QC Sprint 4 (S4-39).
- Trạng thái: Open – BE dự phòng Verified 17/10 (`ea29582`); chờ FB-R2-SEC-FE-07 và phương án chính

### 9.4 Kết luận của SEC (quyền chặn – protocol mục 1)

**Gỡ chặn cổng QC Sprint 3: CÓ.** Hai Blocker của SEC đã đạt ở phần sửa được bằng mã. Lỗi A-38 là Major, không phải Critical/Blocker, nên không thuộc diện chặn cổng. Điều kiện:

| # | Điều kiện | Ai | Hạn |
|---|---|---|---|
| SEC-G1 | Sửa FB-R2-SEC-BE-53 theo đề xuất của thẻ, có test PostgreSQL thật; SEC kiểm lại. **Cập nhật 17/10 (`ea29582`, mục 9.5):** phần BE dự phòng **Verified**. Còn lại: (a) **FB-R2-SEC-FE-07** + test E2E-UI bấm thật (bỏ người → gắn Khách n vào người còn ở trên Desk → J16 quá hạn → giấy tờ còn) – **trước dữ liệu khách thật** và để đóng BUG-R2-083; (b) phương án chính (`guestUploadPersonIndex`, hộp chọn ô, dồn số ô) – trước cổng QC Sprint 4 | BE-C, BE-A, ARC (hợp đồng API), FE/UXD (ô chọn người, hộp xác nhận) | (a) trước dữ liệu khách thật; (b) trước cổng QC Sprint 4 |
| SEC-G2 | SEC smoke Caddy/HSTS/cookie/Origin/log trên staging thật rồi đóng SEC-OPS-03 | OPS deploy, SEC kiểm | Theo ĐK-S3-8. Trước link khách thật và dữ liệu thật |
| SEC-G3 | SEC kiểm lại 8 Major còn lại (BE-33…38, FE-06, MOB-01) | SEC | ĐK-S3-5: trước deploy staging đầu tiên và trước cổng QC Sprint 4 |
| SEC-G4 | Bản demo localhost: thêm vào giới hạn đã biết một câu "Bỏ người khỏi đoàn khi khách đã gửi ảnh giấy tờ qua link: hệ thống có thể xóa nhầm ảnh của người còn ở – đang sửa ở Sprint 4". **Cập nhật 17/10 (mục 9.5), nếu demo dựng từ `ea29582` mà chưa có FE-07, dùng câu:** "Bỏ người khỏi đoàn khi khách đã gửi ảnh giấy tờ qua link: giấy tờ từ 'Khách 2' trở đi chờ 24 giờ rồi tự xóa. Desk chưa có chỗ gắn giấy tờ vào người, nên giấy tờ của người còn ở cũng bị xóa; lễ tân nhập lại nếu cần. Đang sửa." | ORC (`demo-1-limits.md` mục C) | Trước khi gửi demo cho INV |

Không có ESC mới: mức rủi ro và yêu cầu kỹ thuật thuộc quyền SEC. Câu hỏi pháp lý về thời hạn giữ vẫn nằm trong ESC-001.

### 9.5 Kiểm lại vòng sửa 9b – `ea29582` (SEC, 17/10/2026)

- Yêu cầu: ORC 17/10 (decision-log dòng QA/ORC "không cấp ngoại lệ cho P0 C3 – BE-C sửa ngay ở vòng 9b"); SEC-G1.
- Mã kiểm: `ea29582` (chưa push). `product/services/api` không có thay đổi chưa commit. Chưa có CI cho commit này.
- Cách làm:
  - đọc `git show ea29582 -- product/services/api` và test mới `registration-party-removal.test.ts`;
  - chạy trên **PostgreSQL thật**, DB riêng mới `ottimo_verify_sec_9b` (tạo theo `recreate-db.sh`, chạy đủ migration), app Nest thật qua Fastify inject, endpoint thật `DELETE …/party/{memberId}`, `PATCH/POST …/documents`, `POST …/consents`, `GET …/attention`;
  - test repo `registration-party-removal.test.ts` + `registration-flow.test.ts`: **30/30 xanh** (8 + 22);
  - repro SEC (ngoài repo, scratchpad `gate/sec-9b/a38-9b.test.ts`, kết quả `report.json`): cùng thiết lập R1–R6 và Major a của 9.3, thêm X1–X4 để kiểm các phát hiện của skeptic: **12/12 chạy xong**;
  - đọc mã admin-web (`DocsPanel.tsx`, `TodayPage.tsx`) để kiểm phần nối FE.
- Dữ liệu giả. Không tấn công hệ thống nào. Không chạm stack demo.

**a) R1–R6 đo lại trên mã đã sửa**

| Ca | Trước (9.3, `6af7173`) | Sau (`ea29582`) |
|---|---|---|
| R1 – bỏ A (giữa) | Khách 3 bị hủy ngay; Khách 2 giữ; `required_count` 3 | **Không hủy gì ngay** (0 log C3 `delete`). Khách 1 không đổi. Khách 2/3 chờ tới 16/10 09:00 (`fields_purge_after` và `delete_after`). `required_count` 3→2. Link chỉ tính Khách 1 (`uploadedPeople` [1]). "Cần chú ý" có đơn, `dueAt` 16/10 09:00. J16 hạn −1 phút: không xóa. Hạn +1 phút: xóa Khách 2/3 (`party_removed`, DEK hủy, tệp mất). Khách 1 còn |
| R2 – bỏ B (cuối) | Giống R1 | Giống hệt R1 → không còn phụ thuộc vị trí |
| R3 – `confirmed`, bỏ người đi cùng | Không hủy gì; link báo đủ 2/2 | Khách 2 chờ 24 giờ và **không tính đủ người** (`uploadedPeople` [1], cần 2). J16 quá hạn: xóa |
| R4 – chỉ 1 người đi cùng có tên | Khách 3 (người chưa ghi tên, còn ở) bị hủy | Không hủy gì ngay; Khách 2/3 chờ; `required_count` 3→2 |
| R5 – đã gắn người | Đúng | Vẫn đúng: Khách 2 (của A) hủy **ngay** (DEK giấy tờ + ảnh, tệp, trường; `purge_journal` 4 dòng `party_removed`). Khách 3 (của B) giữ. Không có mục "Cần chú ý" |
| R6 – đi 17/10, không ai đóng | Ngày đi +7 mới xóa | +24 giờ: Khách 2/3 xóa. Ngày đi +6: Khách 1 còn. +7: Khách 1 xóa (`unconfirmed`) |
| Major a (ảnh qua link) | Đạt | Vẫn đạt: ngày đi +6 còn 2/2, +7 xóa 2/2 (`unconfirmed`, DEK hủy, tệp mất) |

**b) Khẳng định của BE-C – đúng ở phía BE**

| Khẳng định | Kết quả | Bằng chứng |
|---|---|---|
| Giấy tờ đã gắn người bị bỏ thì hủy ngay | Đúng | R5 |
| Giấy tờ chưa gắn từ Khách 2 chờ 24 giờ, không tính "đủ người", có mục `data_quality/registration_party_docs_unlinked` | Đúng | R1–R4, R6; X1 (`submitted` 2→0) |
| Gắn vào người còn ở thì giữ; J16 xóa phần còn lại sau 24 giờ | Đúng | X1b: PATCH Khách 3 + `partyMemberId` = B → 200; J16 quá hạn: Khách 3 còn (đã gắn), Khách 2 xóa |
| `partyMemberId` phải là người còn ở của đơn này, nếu không 422 `NOT_IN_LIST` | Đúng | X1b: người đã bỏ (A), người của đơn khác, id ngẫu nhiên → 422 `partyMemberId`/`NOT_IN_LIST` |
| `required_count` theo đoàn | Đúng | R1, R2, R4 (3→2), R5 |

Không lộ dữ liệu mới: mục "Cần chú ý" chỉ có mã, số đếm, mã đơn, số phòng (SEC J); audit chỉ ghi số `unclaimedDocuments`; xóa đi qua đúng đường C5 (DEK, tệp sau COMMIT, `purge_journal`, `c3_access_log`).

**c) Kiểm lại phát hiện của skeptic**

| # | Phát hiện (mức skeptic) | SEC | Bằng chứng | Mức SEC → thẻ |
|---|---|---|---|---|
| 1 | Phương án dự phòng chưa dùng được đầu–cuối: Desk không gắn được giấy tờ vào người, không thấy mục "Cần chú ý" (Major) | **Xác nhận** | X1: lễ tân nhập trường Khách 2/3 như admin-web làm (PATCH không có `partyMemberId`) → 200 ×2, không giấy tờ nào được gắn. Bỏ A → Khách 2/3 chờ, `submitted` 2→0, `partial`→`pre`. Nhập lại không gắn → 200 nhưng vẫn chờ. "Nhập tay" cùng số → 409 `PARTY_DUPLICATE`. J16 quá hạn → xóa cả 2, gồm giấy tờ của B **còn ở** (DEK giấy tờ hủy). Mã FE: `DocsPanel.tsx:255-279` dựng `GuestDocumentInput` không có `partyMemberId`; `:155` hiện chip "doc_ok" cho mọi giấy tờ, kể cả giấy tờ sắp bị xóa; `TodayPage.tsx:10-13` mới là khung; admin-web không dùng `imagePurgeAt`, không gọi `/attention` | **Major** (rủi ro Trung bình) → **FB-R2-SEC-FE-07**. Hồi quy đầu–cuối: bản cũ hủy 1 giấy tờ (Khách 3) ngay; bản mới qua Desk mất Khách 2 **và** 3 sau 24 giờ |
| 2 | Khai báo `scanned` vẫn `scanned` khi giấy tờ thành "chờ nhận"; `mark-sent` vẫn cho qua (Minor) | **Xác nhận** (đọc mã; dùng số đo S5 của skeptic) | `rules.ts:492-499` `nextStatus` không rời `scanned`; `mark-sent` (`registration.service.ts:1432-1495`) không kiểm số người; `portalData` (`:1580`) lọc `countsForDeclaration` → người còn ở rơi khỏi dữ liệu cổng | **Minor** → FB-R2-SEC-BE-54. Một phần có từ trước 9b; 9b mở rộng |
| 3 | `legal_hold` + khách gửi lại ô đang chờ: ảnh cũ mất hạn 24 giờ (Minor) | **Xác nhận** | X2: sau khi gửi lại có 2 ảnh sống (02:00Z, 03:00Z), `delete_after` NULL, `fields_purge_after` NULL. Gỡ hold + J16 quá hạn: 0 xóa, 2 ảnh còn. Nguyên nhân: `claim` chạy (`:2298`) dù `purgeImages` trả 0 vì hold (`:422`). Sau gỡ hold, ảnh cũ chỉ còn hạn theo lưu trú | **Minor** → FB-R2-SEC-BE-55 |
| 4 | Đồng ý P02b cũ của ô áp sang ảnh mới khi khách gửi lại để nhận ô (Minor) | **Xác nhận** | X3: `POST consents` 201 (granted, 30 ngày). Bỏ C. Khách gửi lại Khách 2 → ảnh cũ `replaced`, ô được nhận. `consent_record` granted/30 vẫn áp: J16 bước 1 (`retention.service.ts:139-147`) và `latestConsent` đọc theo `guest_document_id` hoặc `person_index` | **Minor** → FB-R2-SEC-BE-56. Gốc có từ trước (đồng ý theo ô); 9b làm rõ hơn vì coi lần gửi lại là "người thật sự đến" |
| 5 | Cảnh báo visa vẫn bật từ giấy tờ đang chờ (Note) | Xác nhận (đọc mã) | `visaExpiringReservations` (`:2381-2390`) không loại giấy tờ chờ. Chỉ trả mã đơn, tối đa 24 giờ | Suggestion → FB-R2-SEC-BE-58 |
| 6 | Mục "Cần chú ý" vẫn hiện `dueAt` đã qua khi đơn `legal_hold` (Note) | **Xác nhận** | X4: hold, J16 quá hạn: `unclaimedDocuments` 0, giấy tờ còn; mục vẫn có `dueAt` 16/10 09:00. `unclaimedDocumentStays` (`:2122`) không lọc hold | Minor → FB-R2-SEC-BE-57 |
| 7 | Bỏ người có giấy tờ đã gắn khi đơn `legal_hold`: trường + DEK bị hủy, ảnh giữ (Note, có từ trước) | **Xác nhận** | X4: `removed`, `purged`, DEK giấy tờ hủy, 1 ảnh sống, tệp còn. `removeDocument` gọi `destroyDocumentFields` (`:2069`) không kiểm hold | Minor (trái nguyên tắc "đang giữ pháp lý thì không hủy gì") → FB-R2-SEC-BE-57 |
| 8 | Đã có giấy tờ gắn người bị bỏ mà vẫn đưa mọi giấy tờ chưa gắn vào chờ (Note) | Xác nhận (đọc mã) | `onPartyMemberRemoved` (`:1998-2009`) tính `unlinked` không phụ thuộc `own`. Đúng chữ phương án dự phòng | Suggestion → FB-R2-SEC-BE-58 |
| 9 | Giấy tờ lễ tân tự nhập không gắn được người thì không bị đụng khi bỏ người (Note) | Xác nhận (đọc mã) | `addDocument` không đặt `person_index`; bộ lọc `unlinked` cần `person_index ≥ 2` | Đã có trong S4-39. Không thẻ mới |

**d) Thẻ mới**

### FB-R2-SEC-FE-07
- Mức độ: Major (rủi ro SEC: Trung bình)
- Vị trí: FE – `apps/admin-web/src/pages/registration/DocsPanel.tsx:255-279` (`ManualDocDialog`, sửa giấy tờ khách tải qua link), `:155` (chip "doc_ok"), `pages/TodayPage.tsx:10-13`; UXD – chuỗi `attn.dq_party_docs_unlinked`, nhãn "chờ gắn người"
- Vấn đề: phương án dự phòng của SEC-BE-53 dựa vào việc lễ tân gắn giấy tờ của người còn ở vào thành viên trong 24 giờ. Desk không làm được việc này:
  - sửa giấy tờ không gửi `partyMemberId`, nên `updateGuestDocument` không bao giờ gắn người (X1);
  - Desk không hiện mục "Cần chú ý" `registration_party_docs_unlinked`, không hiện `imagePurgeAt`; giấy tờ sắp bị xóa vẫn mang chip "Giấy tờ OK";
  - "Nhập tay" lại cùng số giấy tờ → 409 `PARTY_DUPLICATE`.
  
  Kết quả đo: đoàn 3 người, lễ tân đã nhập trường Khách 2/3, bỏ A → sau 24 giờ J16 xóa cả giấy tờ của B (còn ở).
- Vì sao quan trọng: mất không hoàn tác dữ liệu C3 của khách còn ở (đúng lớp lỗi BUG-R2-083), chỉ lùi 24 giờ. Khai báo lưu trú mất người còn ở (`submitted` giảm, khai báo đã xác nhận chuyển `needs_update`).
- Đề xuất sửa:
  1. FE + UXD: khi sửa giấy tờ khách tải qua link (`captureMethod = guest_upload`, chưa gắn người), thêm ô chọn "Người trong đoàn" (danh sách người còn ở, không chọn sẵn) và gửi `partyMemberId`.
  2. Giấy tờ có `imagePurgeAt` do bỏ người: thay chip "doc_ok" bằng nhãn cảnh báo "Chờ gắn người – tự xóa lúc {giờ}".
  3. Đưa mục `data_quality/registration_party_docs_unlinked` lên Desk (trang Hôm nay hoặc khối Cần chú ý hiện có), bấm vào mở đơn.
  4. BE-C (khuyến nghị): cho phép gắn bằng PATCH chỉ có `partyMemberId`, không bắt nhập lại toàn bộ trường. `addDocument` trùng số với giấy tờ đang chờ thì trả mã riêng (vd. `DOCUMENT_UNCLAIMED_EXISTS`, kèm id giấy tờ) để Desk mở đúng giấy tờ đó.
  5. Test E2E-UI bấm thật: bỏ người → gắn Khách n vào người còn ở trên Desk → J16 quá hạn → giấy tờ còn, DEK sống.
- Hạn: **trước dữ liệu khách thật** (SEC-G1 a) và để đóng BUG-R2-083.
- Trạng thái: Open

### FB-R2-SEC-BE-54
- Mức độ: Minor
- Vị trí: BE-C – `rules.ts:492-499` (`nextStatus`), `registration.service.ts:1432-1495` (`mark-sent`), `onPartyMemberRemoved`, `purgeUnclaimedDocuments`
- Vấn đề: khai báo đã `scanned` không quay lại khi số giấy tờ được tính giảm (bỏ người, giấy tờ thành chờ, J16 xóa). `mark-sent` cho qua dù `submitted < required`; dữ liệu cổng thiếu người còn ở (skeptic S5).
- Vì sao quan trọng: khai báo lưu trú thiếu người (cần DOM xác nhận mức nghiệp vụ).
- Đề xuất sửa: khi số được tính giảm dưới `required` ở trạng thái `scanned` → về `partial` (sự kiện kiểu K13); hoặc `mark-sent` trả `REGISTRATION_INCOMPLETE` khi `submitted < required`. Test PostgreSQL.
- Hạn: trước cổng QC Sprint 4.
- Trạng thái: Open

### FB-R2-SEC-BE-55
- Mức độ: Minor
- Vị trí: BE-C – `registration.service.ts:2290-2298` (`guestUpload` → `claim`), `claim` (`:737`)
- Vấn đề: dưới `legal_hold`, khách gửi lại ô đang chờ: ảnh cũ không bị thay (đúng, đang giữ) nhưng ô vẫn được "nhận", `claim` đặt `delete_after = NULL` cho **mọi** ảnh sống, kể cả ảnh cũ (X2). Gỡ hold xong, ảnh cũ (có thể của người đã bỏ) không còn hạn 24 giờ.
- Vì sao quan trọng: trái nguyên tắc dự phòng "không bao giờ giữ ảnh vô chủ".
- Đề xuất sửa: chỉ `claim` khi mọi ảnh cũ đã thật sự bị xóa. Nếu không, `claim` chỉ bỏ hạn của ảnh mới; ảnh cũ giữ hạn chờ. Test PostgreSQL.
- Hạn: trước cổng QC Sprint 4.
- Trạng thái: Open

### FB-R2-SEC-BE-56
- Mức độ: Minor
- Vị trí: BE-C – `claim` khi khách gửi lại; `latestConsent` (`registration.repo.ts`); J16 bước 1/2 (`retention.service.ts:139-170`)
- Vấn đề: đồng ý P02b gắn theo giấy tờ hoặc theo số ô. Khi khách gửi lại ảnh để nhận ô đang chờ (có thể là người khác), đồng ý cũ vẫn áp cho ảnh mới (X3: granted, 30 ngày).
- Vì sao quan trọng: ảnh của người chưa đồng ý có thể bị giữ tới T02 thay vì xóa ở T01 (P02b, NĐ 13/2023 – cần xác nhận pháp lý).
- Đề xuất sửa: khi ô được nhận do khách gửi lại sau khi bỏ người, coi các đồng ý P02b trước đó của giấy tờ/ô là hết hiệu lực (lọc `recorded_at` trước lần tải mới, hoặc ghi một dòng `withdrawn` hệ thống). Người mới phải đồng ý lại. Test PostgreSQL.
- Hạn: trước cổng QC Sprint 4.
- Trạng thái: Open

### FB-R2-SEC-BE-57
- Mức độ: Minor
- Vị trí: BE-C – `removeDocument` (`registration.service.ts:2056-2075`), `unclaimedDocumentStays` (`:2122`)
- Vấn đề: `legal_hold` không nhất quán:
  - bỏ người có giấy tờ đã gắn khi đơn đang giữ → trường và DEK giấy tờ bị hủy, `removed_at` đặt, ảnh còn (X4; có từ trước 9b);
  - mục "Cần chú ý" vẫn hiện hạn đã qua cho đơn đang giữ, trong khi J16 bỏ qua (X4).
- Vì sao quan trọng: `legal_hold` là cam kết không hủy gì; lễ tân hiểu nhầm hạn.
- Đề xuất sửa: dưới hold, `onPartyMemberRemoved` không hủy trường/DEK, chỉ đặt hạn (giống J16), xử lý khi gỡ hold. Mục "Cần chú ý" lọc `NOT legal_hold` hoặc gắn cờ "đang giữ pháp lý".
- Hạn: trước cổng QC Sprint 4.
- Trạng thái: Open

### FB-R2-SEC-BE-58
- Mức độ: Suggestion
- Vị trí: BE-C – `visaExpiringReservations` (`:2381-2390`); `onPartyMemberRemoved` (`:1998-2009`)
- Vấn đề: (1) cảnh báo visa vẫn bật từ giấy tờ đang chờ (có thể của người đã rời đoàn), tối đa 24 giờ; (2) khi đã xác định được giấy tờ của người bị bỏ (đã gắn) mà số giấy tờ đó bằng số người bị bỏ, các giấy tờ chưa gắn khác vẫn bị đưa vào chờ.
- Vì sao quan trọng: cảnh báo sai; tăng phạm vi phải gắn lại trong 24 giờ.
- Đề xuất sửa: (1) thêm điều kiện loại giấy tờ chờ vào truy vấn visa; (2) cân nhắc cùng phương án chính (`guestUploadPersonIndex` sẽ thay cách đoán này).
- Hạn: cùng S4-39.
- Trạng thái: Open

**e) Kết luận của SEC**

1. **FB-R2-SEC-BE-53 – phần BE (phương án dự phòng): Verified 17/10 (`ea29582`).** Không còn hủy theo số ô. Không còn giữ hay tính đủ người bằng giấy tờ của người đã bỏ. `required_count` khớp đoàn. Đường xóa đi qua C5 đầy đủ.
2. **SEC-G1: chưa đạt** (Not verified đầu–cuối). Thiếu FB-R2-SEC-FE-07: trên Desk thật, giấy tờ của người còn ở vẫn bị xóa sau 24 giờ.
3. **BUG-R2-083 cho cổng Sprint 3:**
   - lỗi P0 như QA ghi (hủy **ngay**, theo số ô, không đường giữ lại) đã hết ở BE;
   - nhưng lớp lỗi "mất C3 của khách còn ở" **vẫn xảy ra đầu–cuối** qua Desk (sau 24 giờ, và nay gồm mọi giấy tờ chưa gắn từ Khách 2) → SEC **không** ghi Closed;
   - mức của phần còn lại do QA quyết (test-strategy mục 8). SEC xếp Major, rủi ro Trung bình: dữ liệu giả, có 24 giờ, API đã có đường giữ lại, mục "Cần chú ý" có ở API;
   - đề xuất cho ORC: làm FE-07 bước 1–3 ngay trong vòng sửa (một ô chọn, một nhãn, một mục danh sách; BE không phải đổi) rồi đóng BUG-R2-083. Nếu không chờ, ORC/QC ghi ngoại lệ rõ ràng và ORC dùng câu SEC-G4 mới cho bản demo.
   - SEC **không chặn** cổng QC Sprint 3: không có lỗi Critical/Blocker bảo mật; không lộ dữ liệu cho người không có quyền.
4. **Còn cho Sprint 4 (S4-39):**
   - phương án chính: `removePartyMember.guestUploadPersonIndex` + hộp chọn ô trên Desk + dồn số ô (đề xuất 2–5 của thẻ BE-53);
   - giấy tờ lễ tân tự nhập chưa gắn người khi bỏ người;
   - giao diện "Cần chú ý" và nhãn hạn chờ (nếu FE-07 chưa làm ở vòng sửa);
   - BE-54, BE-55, BE-56, BE-57, BE-58;
   - phần ARC đã ghi ở S4-39 (erd 4.7 `fields_purge_after`, audit, `retention_run.policy_key = party_removed`, `RegistrationPartyPort`).
5. **Chặn dữ liệu khách thật: vẫn giữ.** Cần đủ: SEC-G1 (a) – FE-07 có test E2E-UI và SEC kiểm lại; **và** SEC-G2 – smoke Caddy/HSTS/cookie/Origin/log trên staging thật (chưa làm). Phương án chính (SEC-G1 b) chỉ là điều kiện cổng QC Sprint 4, không còn là điều kiện dữ liệu thật nếu FE-07 đạt.

Không có ESC mới: mức rủi ro và yêu cầu kỹ thuật thuộc quyền SEC.
