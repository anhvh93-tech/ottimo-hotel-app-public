# FE – Round 2 · Sprint 3 – Báo cáo (EP03–EP06, EP15: nhận phòng, lưu trú, trả phòng, thu tiền, hoàn, khai báo)

- Vai: FE | Ngày: 16/10/2026 | Bước: Sản xuất (Sprint 3) | **Không commit** (ORC commit)
- Đầu vào: hi-fi H13–H17 (bản UXD sửa 17/10), DS 6.21, `specs/EP03-05-stay.md` v0.2, `specs/EP06-registration.md` v0.2, OpenAPI **0.3.6-draft** (api-client đã sinh lại – không sửa tay), `outputs/UXD/s3-report.md` (79 khóa), `outputs/ARC/s3-contract.md`, `qc/s2-qc-gate.md` (ĐK-S2-3), `qa/bug-list.md` (BUG-R2-026/028/029 – ORC giao thêm giữa chừng)
- Vùng sửa: `product/apps/admin-web/**`, `product/packages/{ui,api-client}/**` (i18n không đổi: chỉ dùng chuỗi UXD, khóa còn thiếu ghi ở mục 5)
- BE-A/B/C đang code song song → FE chạy trên MSW mock theo spec (`mocks/stay.ts`); cờ server thật như cũ: `pnpm --filter @ottimo/admin-web dev:server`

## 1. Màn / trạng thái

| Màn | Trạng thái | Nội dung chính | Test |
|---|---|---|---|
| H13 Nhận phòng (`/reservations/:id/check-in`) | Xong | Điều kiện từ `previewCheckIn` luôn ở đầu (Đã đủ/Còn thiếu bằng chữ + chip): gán căn, **sức chứa – chặn cứng** (nút "Sửa số người" ngay tại màn → `updateReservation` If-Match, "Đổi sang căn đủ chỗ"), buồng (FD: lý do → 202 "Đang chờ lễ tân trưởng"; FDL+: lý do tự xác nhận; OOO không ngoại lệ), còn phải thu (nút thu tiền, không có "bỏ qua"), giấy tờ người đứng tên, BR-613 c (FDL+ ghi lý do `documentBlockOverride`, FD thấy hướng dẫn); `warnings[]` (bộ đồ dùng thêm, đã gửi qua app, thị thực). 4 bước: Giấy tờ (C3) → Kiểm tra (3 kết quả, ghi cách xử lý; thiếu người không chặn) → Khai báo (hạn VN/NN, "Khai báo sau"/"Khai báo ngay") → Giao mã & hoàn tất: giờ nhận (mặc định giờ chuẩn, bật "Khách nhận sớm"), phụ thu đề xuất `aria-live`, **chỉ ghi khi tick "đã báo khách"** (`expectedSurchargeVnd`), xin FOC (không chọn người duyệt), B9a "thêm đêm" trước 06:00, thu tiền (`PaymentPanel`), số thẻ 0–2, **nội quy bắt buộc**, **"Đã giao mã/thẻ" không bắt buộc**, hậu quả; nút khóa (`aria-disabled` + câu `ci.submit_needs_rules`) → hộp xác nhận → `checkIn` → toast `checkin.done` + về drawer. `CHECKIN_CONDITIONS_NOT_MET` (nêu từng điều kiện), `SURCHARGE_CHANGED` (đọc lại preview, bỏ tick, xác nhận lại). Máy chưa cấp quyền: chỉ điều kiện + câu `ci.untrusted_note`, không có nút | checkin.test (3) |
| H14 Giấy tờ & khai báo (`/registration`, `/registration/:id`) | Xong | Danh sách 3 tab (Cần xử lý / Cần cập nhật ngày đi / Tất cả), hạn theo `deadlineLabel` (quá hạn = chip đỏ **có chữ**), SSE/polling. Chi tiết: (1) giấy tờ từng người (chỉ 4 số cuối; "Xem đủ số" → step-up → tự ẩn 60 s / khi ẩn tab, không nút tải), nhập tay (multipart, ảnh chỉ trong bộ nhớ), kiểm tay Đạt/Không đạt + ghi chú (`recordDocumentCheck`), đồng ý lưu ảnh **không chọn sẵn** (Có/Không ngang hàng, `recordImageConsent` kênh desk), "Đối chiếu xong" (`REGISTRATION_INCOMPLETE` → câu riêng); (2) "Hiện dữ liệu khai báo" → step-up → bảng sao chép từng trường đúng thứ tự, mở cổng, "Xóa bộ nhớ tạm", tự ẩn sau 2 phút; (3) mã hồ sơ → Đã gửi / Cổng đã xác nhận / Cổng từ chối (lý do). OWN/MGR: "Xóa ảnh" (hộp xác nhận); FD không thấy | checkin.test, s3-fix (GET 503) |
| H15 Lưu trú (drawer đơn Đang ở) | Xong | Nút theo `allowedActions[]`: **Gia hạn** (đêm trống liên tiếp, đêm kín khóa, đơn con OTA + tiết kiệm phí kênh, `repricing[]` → `extend.los_reprice`, `VISA_EXPIRES_BEFORE_DEPARTURE` → ô lý do), **Trả muộn** (`dryRun` mỗi lần đổi giờ – không khóa/If-Match, ân hạn, khách đến cùng ngày, FD bị xung đột → "Gửi quản lý duyệt" 202 `late.request_sent`, sau 18:00 → gia hạn), **Đổi phòng** (nguyên nhân 2 lựa chọn, lý do bắt buộc, căn từ `searchAvailability?reservationId`, xem trước giá `dryRun`, hậu quả + nhắc thu thẻ cũ; `ROOM_NOT_READY` nêu trạng thái, `CAPACITY_EXCEEDED` chặn), **Thêm phát sinh** (giá bảng không sửa được, phạt/hư hỏng cần ảnh `penalty_evidence` hoặc ghi chú, cảnh báo chưa gửi nội quy), **Xác nhận giờ trả**, **"Đã giao mã/thẻ"** tick bổ sung (chip "Chưa ghi giao mã/thẻ", hộp xác nhận, `updateReservation.doorAccessHandedOver`), **Hoàn tác nhận phòng** (MGR+, lý do), **Người đi cùng** (`listParty`/`addPartyMember` người lớn qua `GuestPicker`, trẻ em chỉ tên + năm sinh/`removePartyMember` If-Match theo `Party.version`), folio phát sinh + FOC chờ duyệt, **đề nghị hoàn khi trả dư** (`createRefundRequest`) | s3-fix (gia hạn), checkin.test (chip giao mã) |
| H16 Trả phòng 3 bước + bill + VietQR (`/reservations/:id/check-out`) | Xong | B1 minibar: bước số 0…chuẩn, đã dùng/tiền tính ngay, món miễn phí, "Không dùng gì – tủ đủ", lưu `recordMinibarCheck`. B2: giờ trả thực tế (mặc định giờ đã hẹn), phụ thu theo bậc + tick "đã báo khách", `lateSurchargeRecalc`, phát sinh nhanh (giặt ủi, đồ ăn, hư hỏng, khử mùi, thiếu thẻ), FOC chờ duyệt có link "Xem yêu cầu". B3: **VietQR vẽ tại chỗ** (SVG trong bundle từ `qrPayload` của server, nội dung CK = mã đơn, tài khoản che, cảnh báo "tài khoản nhận vừa đổi") → "Ghi nhận đã thu" (`confirmPaymentReceived`, "chờ đối soát"); tiền mặt (thối lại), chuyển khoản tay, POS (chỉ mã chuẩn chi); hóa đơn công ty; **trả dư** → chọn cách xử lý (đề nghị hoàn / MGR+ để lại) + lý do; "Hoàn tất" → hộp hậu quả (focus nút an toàn) → `checkOut` → số phiếu + việc đã tạo. Bill VI / VI–EN (+ USD tham khảo, VAT), in bằng trình duyệt. Lỗi tại chỗ: `BALANCE_DUE`, `PENDING_APPROVALS`, `MINIBAR_NOT_CHECKED`, `PAYMENT_NOT_CONFIGURED` (không vẽ QR giả) | checkout.test (3) |
| H17 Cần duyệt (`/approvals`) | Xong | Yêu cầu chờ / đã chuyển cấp: đơn, loại, số tiền, lý do, người gửi, nơi hoàn (che); Duyệt / Từ chối bằng **mật khẩu đăng nhập** (R2), sai mật khẩu = lỗi tại ô, `SELF_APPROVAL_FORBIDDEN`, người khác vừa xử lý → `approval.already_done` | refund.test (duyệt FOC) |
| H17 Nhật ký tiền + đối soát + hoàn (`/audit`) | Xong | Tab **Nhật ký** (chỉ đọc, lọc khoảng ngày; FD chỉ của mình – server lọc), tab **Chờ đối soát** (MGR+: "Đã khớp sao kê"/"Không thấy tiền" + ghi chú; **tiền mặt sale/CTV nộp quầy: FD+ "Đã nhận tiền mặt" – A46a**, chip "Do Sale ghi – chờ đối soát", quá 2 ngày; tự xác nhận khoản mình ghi → `SELF_RECONCILE_FORBIDDEN`), tab **Hoàn lại khách**: nhập nơi nhận (tiền mặt / chuyển khoản – C3 chỉ máy được cấp – / cùng cách cũ), **chi tiền mặt FD+ (A47a, ảnh biên nhận bắt buộc, người chi ≠ người tạo → 403)**, **chi chuyển khoản chỉ MGR/OWN (A47)**: xem đủ số TK sau step-up, mã giao dịch + chứng từ; FD thấy "chờ quản lý" | refund.test (6) |
| H04 Danh mục căn – QC còn mở | Xong | `updateRoom` 200 `warnings[FUTURE_RESERVATIONS_KEEP_ROOM]` → cảnh báo sau khi lưu (không chặn) kèm số đơn + link Đơn đặt phòng; 409 `CAPACITY_BELOW_BOOKINGS` vẫn liệt kê `conflicts[]` (mã đơn, ngày, số khách) | s3-fix, rooms.test |

## 2. Điều kiện QC / lỗi QA đã đóng phía FE

| Mục | Đã làm | Bằng chứng |
|---|---|---|
| **ĐK-S2-3 / BUG-R2-026** (P2) | `problem.ts`: `CONCURRENT_UPDATE` và `SERVICE_UNAVAILABLE` (503) có câu riêng, không còn `error.server`, không mã tham chiếu ở lần đầu; tham số `{seconds}` (thiếu `Retry-After` → 2 s, trần 10 s). Mẫu **DS 6.21** = `app/useWrite.tsx`: giữ form/hộp/bước, cảnh báo vàng `role=status` (không đọc từng giây), nút chính thành "Tự thử lại sau {seconds} giây…", "Thử lại ngay"/"Dừng thử lại", tự gửi lại **cùng Idempotency-Key + If-Match** (CONCURRENT_UPDATE 2 lần, 503 1 lần), hết lượt → `retry.gave_up_*` (+ `{request_id}`) và nút "Thử lại"; rời màn → hủy hẹn giờ. Áp cho **mọi** nút ghi Sprint 3 + các hộp thao tác Sprint 2 trong drawer (`ReservationDialogs` – đổi căn, hủy, cọc, gia hạn giữ chỗ, gán căn, không đến, khôi phục, báo cọc CTV) + tạo đơn H09. **Chưa áp**: H10 đơn dài hạn, H12 báo giá/giữ chỗ (vẫn hiện đúng câu nhờ `problem.ts`, chỉ chưa tự gửi lại) – làm đầu Sprint 4. GET 503 → `retry.load_countdown` + tự tải lại 1 lần (`useResource`) | s3-fix.test: 409 tự gửi lại cùng khóa/If-Match (đếm request), đếm ngược + "Thử lại ngay", 503 hai lần → bỏ cuộc có mã tham chiếu, GET 503 tự tải lại; problemView 503 |
| Lỗi trường mã lạ | `fieldErrorText` rơi về `field_error.generic` (không còn `not_in_list`); `NOT_IN_LIST` vẫn đúng câu riêng | s3-fix.test |
| H04 `warnings[]` + `conflicts[]` | Mục 1 dòng H04 | s3-fix.test, rooms.test |
| **BUG-R2-028** (P3) | `GuestPicker` chuyển cả `phoneMasked` của khách vừa tạo nhanh → form Đặt phòng không hỏi lại SĐT, không PATCH lần hai | s3-fix.test |
| **BUG-R2-029** (P3) | `live.ts`: SSE trả 404 / chưa từng mở (EventSource `CLOSED`) → đóng luồng, **im lặng** chuyển sang hỏi lại 30 s, không hiện "Đang kết nối lại…"; chỉ luồng đã mở rồi rớt mới hiện `fo.rack.stale` | live.test (2) |

## 3. Kết quả lệnh – lần 1 (thư mục `product/`, 16/10/2026 ~22:30; lần chạy lại sau đợt 2 ở mục 8.3)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/admin-web test` | **130/130 xanh** (18 file; mới: checkin 3, checkout 3, refund 6, s3-fix 8, live 2) |
| `@ottimo/api-client` test | **14/14** (mới 4: dryRun không khóa, check-in If-Match+khóa, multipart giấy tờ, tách 2 operation hoàn) · `@ottimo/ui` **10/10** (mới `qr.test` 3 – so khớp từng module với bộ mã hóa độc lập) · `@ottimo/i18n` 3/3 |
| `tsc --noEmit` admin-web, api-client, ui, i18n | 0 lỗi |
| axe-core 4.13 (chạy tạm trong jsdom, không tính tương phản màu) trên H13 bước 1 + bước 4, drawer Đang ở, H16 minibar + QR, 3 tab Nhật ký tiền, H14 danh sách, H17 Cần duyệt, H04 cảnh báo | **0 critical/serious** (tệp chạy tạm đã xóa; CI `a11y.axe.spec.ts` vẫn là nguồn chính thức – chưa có H13–H17) |
| `pnpm format:check` | **Phần FE xanh** (`prettier --check apps/admin-web packages` ✔). Toàn repo **đỏ**: 30 file `services/api/**` (BE-A/B/C đang code) |
| `pnpm lint` | ESLint phần FE **0 lỗi** (1 cảnh báo cũ `mockServiceWorker.js` sinh tự động). Toàn repo **đỏ**: 8 lỗi `no-unused-vars` ở `services/api` (`crypto.fake.ts`, `frontdesk/internal/default-ports.ts`, `registration/public/registration.port.ts`) |
| `turbo run typecheck --continue` | 11/12 ✔; **`@ottimo/api` đỏ** (`guest.controller.ts:184`, `registration.controller.ts:174` – `images` any[], BE-C) |
| `turbo run test --continue` | 11/12 ✔ (admin-web 130, api-client 14, ui 10, i18n 3, guest-web 35, mobile 1, integrations 114…); **`@ottimo/api` đỏ 1 ca** (`contract.test.ts` "no `__test__`/TestSupportModule outside src/test-support" – BE) |
| `turbo run build --continue` | admin-web ✔ (chính 539 KB / gzip 168 KB; màn S3 tải theo route: Reservations 43 KB, Drawer 58 KB, Money 13 KB, Registration 11 KB, Approvals 4 KB), guest-web, mobile ✔; **`@ottimo/api` đỏ** (cùng lỗi TS trên) |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0** (58 s, ảnh `ottimo-web:fe-s3`) |

→ "Toàn repo xanh" **chưa đạt** chỉ do `services/api` (vùng BE-A/BE-B/BE-C đang code song song). Phần FE xanh hết.

## 4. File tạo/sửa
- Mới: `apps/admin-web/src/app/useWrite.tsx`; `pages/stay/{common.tsx,PaymentPanel.tsx,CheckInPage.tsx,CheckOutPage.tsx,StayDialogs.tsx}`; `pages/registration/{DocsPanel.tsx,RegistrationPage.tsx}`; `pages/approvals/ApprovalsPage.tsx`; `pages/money/MoneyPage.tsx`; `mocks/stay.ts`; `__tests__/{checkin,checkout,refund,s3-fix,live}.test.tsx`; `packages/ui/src/{qr.ts,qr.test.ts,QrCode.tsx}`
- Sửa: `apps/admin-web/src/app/{problem.ts,reservations.ts,live.ts,routes.tsx}`, `hooks/useResource.ts`, `components/{states.tsx,GuestPicker.tsx}`, `pages/{RoomsPage.tsx,RoomDrawer.tsx}`, `pages/booking/BookingDialog.tsx`, `pages/reservations/{ReservationDialogs.tsx,ReservationDrawer.tsx,ReservationsPage.tsx}`, `session/nav.ts` (Cần duyệt, Giấy tờ & khai báo, Nhật ký tiền → `ready`; Giấy tờ chỉ vai Desk), `mocks/{handlers.ts,reservations.ts}` (hành động Đang ở theo vai; `updateRoom.warnings`), `test/setup.ts`, `README.md`; `packages/api-client/src/{client.ts (multipart + blob),endpoints.ts (thêm hàm cho mọi operation S3 FE dùng),types.ts,endpoints.test.ts}`; `packages/ui/src/{Modal.tsx (busyLabel),index.ts}`
- Báo cáo: `rounds/round-02/outputs/FE/s3-report.md`

## 5. Việc cần vai khác
| Gửi | Nội dung |
|---|---|
| UXD | **Chuỗi còn thiếu** (spec BA ghi "(mới)" nhưng chưa có trong `strings-*.json`; FE gọi đúng tên khóa – UI hiện tên khóa cho tới khi có, danh sách ở `pages/stay/common.tsx` `PENDING`): `refund.method`, `refund.method.original_method`, `refund.bank_bin`, `refund.account_no`, `refund.account_holder`, `refund.holder_differs`, `refund.set_destination`, `refund.execute_cash`, `refund.execute_transfer`, `refund.proof`, `refund.bank_reference`, `refund.transfer_waits_manager`, `refund.request_overpayment` {amount}, `refund.requested`, `refund.paid` {amount}, `refund.show_account`, `checkout.blocked_credit` {amount}, `checkout.overpay.refund_request` {amount}, `checkout.overpay.retain`, `checkout.late_recalc` {old,new}, `pay.confirm_cash_handover`, `pay.receiving_account_changed`, `party.remove`, `party.remove_confirm` {name}, `room_change.door_reminder` {room}, `checkin.time_hint`. Thêm: nhãn "Từ ngày/Đến ngày" cho bộ lọc nhật ký (đang tạm "Khoảng ngày (1)/(2)"), `rooms.future_keep` {n} (đang ghép `rooms.stop_help` + "Đơn đặt phòng: n"), câu "Khoản hoàn do bạn tạo cần người khác chi" (đang dùng `error.SELF_APPROVAL_FORBIDDEN`), nhãn `stay_within_visa`/`visa_valid_at_arrival` (đang dùng `checkin.verify.visa`), `refund.*` cho màn chi hoàn (chưa có hi-fi riêng – FE dựng theo spec 2.6) |
| QA | Ca UI mới cho E2E/axe: H13–H17 (`/reservations/:id/check-in`, `/check-out`, `/registration`, `/approvals`, `/audit`), chạy với `qa.fd` (máy được cấp) và `qa.owner` (chưa cấp). Kiểm lại BUG-R2-026/028/029 trên build có API thật. Thêm axe H13–H17 vào `a11y.axe.spec.ts` |
| BE-A/B/C | Mock FE theo thứ tự kiểm của spec (EP03-05 1.6, 2.6.3, 5.5; EP06 2–5) – đề nghị đối chiếu `apps/admin-web/src/mocks/stay.ts` khi viết test hợp đồng. FE đọc thêm (nếu có): `Problem.unmet[]` của `CHECKIN_CONDITIONS_NOT_MET`, `surchargeVnd` của `SURCHARGE_CHANGED`, `balanceDueVnd` của `BALANCE_DUE`, `pendingApprovals` của `PENDING_APPROVALS`, `roomStatus` của `ROOM_NOT_READY`, `guest`/`eta` của `LATE_CHECKOUT_CONFLICT`, `approverName`/`decidedAt` của `INVALID_TRANSITION` khi duyệt |
| ARC | (a) `AllowedAction` chưa có sự kiện cho "Đã giao mã/thẻ" và "Thêm phát sinh" – FE hiện theo vai FD+ và trạng thái `in_house` (server vẫn kiểm 409/403); (b) `PartyMemberCreate` cho người lớn chỉ nhận `guestId` – người đi cùng chưa có hồ sơ phải tạo nhanh khách trước (đã làm qua `GuestPicker`); (c) `Reservation` chưa có trường "MGR đã chấp nhận cọc thiếu" (`deposit_shortfall_*`) nên câu `ci.shortfall_accepted` chưa hiện |
| SEC | Xem nhanh: QR vẽ bằng bộ mã hóa trong `packages/ui/src/qr.ts` (không thư viện/không dịch vụ ngoài, inline SVG); số giấy tờ/số tài khoản đầy đủ chỉ giữ trong state, tự ẩn 60 s/khi ẩn tab, không ghi storage; mật khẩu step-up/duyệt xóa khỏi state ngay sau khi gửi |

## 6. Giả định (FE tự quyết – đề nghị ORC ghi decision-log)
1. **QR VietQR**: tự viết bộ mã hóa QR (byte mode, mức M, phiên bản 1–20) trong `@ottimo/ui` thay vì thêm thư viện – không thêm phụ thuộc/không đổi lockfile khi 3 BE đang sửa song song; đã so khớp **từng module** với bộ mã hóa độc lập (segno 1.6.6) cho payload VietQR mẫu (test cố định).
2. Nhận phòng trên máy **chưa được cấp quyền**: chỉ xem điều kiện, không có nút nhận phòng (B9 cần thiết bị được cấp – rbac 8.7); drawer hiện "Máy này chưa được cấp quyền" dưới nút khóa.
3. Bước "Kiểm tra" của luồng nhận phòng không chặn vì **thiếu người đi cùng** (`party_count`) – BR-402 (3); các mục Không đạt/Chưa kiểm được khác phải có ghi chú mới đi tiếp. "Đối chiếu xong" ở H14 vẫn đòi đủ.
4. Nút "Đã giao mã/thẻ", "Thêm phát sinh", "Xác nhận giờ trả", "Người đi cùng" hiện theo **vai FD+ × trạng thái** (không có trong `allowedActions[]` – xem mục 5 ARC (a)).
5. Bước minibar: căn không có món tính tiền → tự đạt; FD bấm "Tiếp tục" là ghi kiểm `checkout`. Bước 2 không bắt tick "đã báo khách" để sang bước 3 – chỉ phụ thu có tick mới được ghi.
6. Tạo VietQR là thao tác riêng (nút "Chuyển khoản VietQR · {số tiền}") thay vì tự tạo khi chọn cách thanh toán – tránh sinh giao dịch `pending` thừa mỗi lần đổi tab.
7. Nơi nhận hoàn "Cùng cách khách đã trả" (`original_method`) cho chọn ở FD; chi hoàn loại này đi đường **chuyển khoản/MGR** (A47) như spec 2.6.3.
8. Màn chi hoàn đặt trong **Nhật ký tiền › Hoàn lại khách** (S27 – Desk có quyền) vì FD không có menu "Cần duyệt"; duyệt hoàn vẫn ở "Cần duyệt" (MGR/OWN).
9. Mẫu 6.21 áp cho nút ghi dùng `useWrite`; nút chính bị `disabled` trong lúc đếm ngược (Button dùng chung) nên focus không giữ trên nút đó – nếu UXD yêu cầu giữ focus, cần đổi `Button` sang `aria-disabled` khi `busy` (đụng mọi màn – đề nghị làm ở R3).

## 7. Rủi ro / chưa xong
- Chưa chạy với API thật S3 (BE đang code; `@ottimo/api` chưa build) – chưa kiểm multipart giấy tờ, step-up, SSE `registration.changed`/`payment.changed` thật.
- Chưa có E2E Playwright/axe chính thức cho H13–H17 (QA thêm – mục 5); axe tạm trong jsdom không kiểm tương phản màu.
- Chưa làm: quét QR CCCD/MRZ (US-051 – R3, nút không hiện), trả sớm B16 (Should), công nợ khi trả phòng cho MGR (`debt` – API sẵn, chưa có UI/hi-fi chi tiết), xin FOC từ từng dòng folio ngoài luồng nhận phòng (API `requestFoc` sẵn), cấp link check-in online (`issueGuestLink` – H18 thuộc MOB, nút Desk chưa làm), sửa giấy tờ đã lưu (`updateGuestDocument`), rút đồng ý sau khi đã khai báo xác nhận (hộp riêng `reg2.withdraw_*` – hiện đổi trực tiếp bằng radio).
- Bundle chính 539 KB (> ngưỡng cảnh báo 500 KB của Vite, do chuỗi UXD tăng) – tách chuỗi theo ngôn ngữ ở R3 như đã nêu S1.

## 8. Đợt 2 (ORC giao giữa chừng – sau `outputs/UXD/s3-report.md` mục 8)

### 8.1 Đã làm
| Việc | Kết quả |
|---|---|
| Bỏ hằng `PENDING` / `usePending`, gọi thẳng khóa UXD | Đã bỏ hết (`pages/stay/common.tsx`). Các màn S3 dùng 48 khóa mới: `refund.*`, `checkout.blocked_credit`, `checkout.overpay.*`, `checkout.late_recalc`, `pay.confirm_cash_handover`, `pay.receiving_account_changed`, `party.*`, `room_change.door_reminder`, `checkin.fix_guest_count`, `checkin.time_hint`, `mlog.date_from/to`, `rooms.future_keep` {n} (H04 không còn ghép chuỗi), `checkin.verify.visa_at_arrival` / `stay_within_visa`, `refund.self_execute_forbidden` (403 khi tự chi khoản mình tạo), `pay.cash_handover_mismatch`, `bill.refund`, `bill.ota_prepaid`, `invoice.address` (thêm ô Địa chỉ công ty) |
| Tab Hoàn tiền | `refund.title` ("Hoàn tiền"); loại `refund` ở "Cần duyệt" cũng dùng `refund.title` (bỏ `lt.settlement.refund`) |
| Mã lỗi mới | `REFUND_DESTINATION_REQUIRED` (409 → `error.*`), `REFUND_EXCEEDS_APPROVED` (mã trường → `error.REFUND_EXCEEDS_APPROVED` {max} định dạng tiền), `OVERPAYMENT_HANDLING_REQUIRED` (mã trường → câu riêng) – test s3-fix |
| Người đi cùng | Bỏ người đã khai trên cổng → câu `party.remove_registered`; bỏ một người lớn → hỏi `party.reduce_count` {n} rồi mới `updateReservation` (không tự giảm) |
| **DS 6.21 cho H10 + H12** | `LongStayDialog` (tạo đơn dài hạn) và `QuoteDialog` (lưu báo giá, giữ chỗ, gia hạn báo giá) dùng `useWrite` – tự gửi lại cùng khóa, đếm ngược trên nút, cảnh báo vàng. Test: lưu báo giá 409 → gửi lại 1 lần cùng `Idempotency-Key` (s3-fix) |
| **Bundle chính** | Chuỗi EN tách thành chunk tải khi chọn tiếng Anh (`@ottimo/i18n` `loadLocale`; trong lúc tải hiện VI, không trắng màn; bill song ngữ tự tải EN). Bundle chính **539 → 418 KB** (gzip 168 → 129 KB), hết cảnh báo > 500 KB; `strings-en` 131 KB (gzip 43 KB) chỉ tải khi cần. guest-web không bị ảnh hưởng (tự import chuỗi riêng) |

### 8.2 File sửa thêm
`apps/admin-web/src/pages/stay/{common,CheckInPage,CheckOutPage,StayDialogs,PaymentPanel}.tsx`, `pages/money/MoneyPage.tsx`, `pages/approvals/ApprovalsPage.tsx`, `pages/registration/DocsPanel.tsx`, `pages/reservations/ReservationDrawer.tsx`, `pages/RoomsPage.tsx`, `pages/booking/LongStayDialog.tsx`, `pages/quotes/QuoteDialog.tsx`, `app/problem.ts`, `test/setup.ts`, `__tests__/{refund,s3-fix}.test.tsx`; `packages/i18n/src/{translate.ts,I18nProvider.tsx,translate.test.ts}`.

### 8.3 Kết quả lệnh – chạy lại toàn repo (16/10/2026 ~22:50)
| Lệnh | Kết quả |
|---|---|
| `pnpm format:check` | **xanh toàn repo** |
| `eslint .` | **0 lỗi** (2 cảnh báo cũ ở `mockServiceWorker.js` sinh tự động của admin-web và guest-web) |
| `turbo run typecheck test build --continue` | **26/26 xanh** – admin-web **132/132**, api-client 14, ui 10, i18n **4** (mới: EN lazy), guest-web 39, api 285 (+1745 skipped cần DB) |
| axe-core (jsdom, không tính tương phản) – chạy lại trên bill + hóa đơn công ty, hộp bill, tab Hoàn tiền + hộp nơi nhận, hộp Người đi cùng | 0 critical/serious |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0** (`ottimo-web:fe-s3b`) |

→ BE đã sửa phần `services/api` trong lúc FE làm đợt 2 nên **toàn repo nay xanh**. Các mục trước đó đã được đợt này xử lý: mục 2 "Chưa áp H10/H12", mục 5 "Việc cần vai khác – UXD" và mục 7 "Bundle 539 KB". Giả định 9 (focus khi nút bị khóa lúc đếm ngược) vẫn giữ.

Không có ESC mới.

## 9. Bước Phản hồi & sửa (17/10/2026)

Phản hồi từng thẻ: `rounds/round-02/responses/s3-FE.md`. Phạm vi gồm:
- UXD FE-S3-01…22 (riêng FE-S3-20 mục 1 dời sang R3).
- SEC FE-06, DOM FE-03.
- ARC mục C và OpenAPI 0.3.6 bổ sung 1 + 2 (`outputs/ARC/s3-contract.md` mục 7).

### 9.1 Thay đổi chính
| Nhóm | Kết quả |
|---|---|
| C3 (SEC FE-06) | `app/c3.ts`: `useC3Reveal` (60 giây / tab ẩn / unmount / đăng xuất) và `useC3Clipboard` (ghi `''` sau 60 giây, khi tab ẩn, khi rời màn) dùng chung cho số giấy tờ, dữ liệu cổng, số TK hoàn |
| H14 dữ liệu cổng (FE-S3-01) | Nhãn khóa `reg.field.*`, `valueKey`, ô rỗng không có nút chép, chép giá trị server. Mock theo `portalFields()` |
| Nhập tay giấy tờ (FE-S3-02) | Đủ trường cổng cần, có `noEntryRecord`, sửa giấy tờ đã lưu (`updateGuestDocument`) |
| Trả phòng (bổ sung 2) | Hai trường hợp mới:<br>• Sau mốc cuối → `extraNight` (giá mặc định, sửa được). Số còn phải thu đã gồm đêm này.<br>• Cửa sổ sau nửa đêm → giờ mặc định là giờ hiện tại, phụ thu 0.<br>Thêm `unhandledCreditVnd` và `checkoutTimeNote`. Mock gộp thành một giao dịch và hoàn tác khi lỗi |
| Nhận phòng | `checkinTimeNote`, `depositShortfall`, gửi lễ tân trưởng (FD + buồng chưa sẵn sàng), lý do khóa nút, hiệu lực mã cửa |
| Bill / folio (DOM FE-03, FE-S3-06) | `labelKey`/`labelParams` (`lineLabel`), in qua `.print-root`, song ngữ `lang="en"`, `creditVnd`, OTA thu hộ đúng hình API |
| Nhật ký tiền / Cần duyệt / Hoàn tiền | Tập đóng `AuditEvent.action` → `mlog.a_*`, mã lạ → `mlog.a_other`.<br>Tiêu đề/thân duyệt theo loại. Cách hoàn đủ 3 loại, hậu quả chi hoàn trên nút |
| Chuỗi / DS | `money()` cho mọi `{amount}`, Chip có icon, `.chk3`, `.chip.recon`, `.list-none`, `dirty` cho mọi hộp nhập, bỏ style nội tuyến H04 |

### 9.2 Kết quả lệnh (thư mục `product/`)
| Lệnh | Kết quả |
|---|---|
| `prettier --check` + `eslint` (admin-web, ui, i18n, api-client) | Prettier xanh; ESLint 0 lỗi (1 cảnh báo cũ `mockServiceWorker.js`) |
| `turbo run typecheck test build` (4 gói FE) | 9/9 xanh – admin-web 19 tệp / 142 test (mới: `s3-review.test.tsx` 7; `checkout.test.tsx` +3 – thêm đêm, ghi chú giờ, sau nửa đêm), api-client 14, ui 10, i18n 4; bundle chính 427 KB |
| `turbo run typecheck build` toàn repo | 16/16 xanh |
| axe-core (jsdom, không tính tương phản) – H13, H16 bước 2 + 3, H14 dữ liệu cổng, H17 ba tab, Cần duyệt, hộp Gia hạn | 0 critical/serious |
| `docker build -f infra/docker/Dockerfile.web -t ottimo-web:fe-s3c .` | exit 0 |

### 9.3 Đợt 2 – nối 72 chuỗi UXD (`reviews/s3-UXD.md` mục E)
- Đã nối:
  - Ghi chú giờ (`checkin/checkout.time_note`) và `field.TIME_*`, `SURCHARGE_DECISION_REQUIRED`.
  - `error.REFUND_SOURCE_NOT_RECONCILED` {amount}. `{amount}` của lỗi cấp yêu cầu nay có đơn vị.
  - `checkout.extra_night_*` (cả trường hợp không thêm được đêm: khóa "Hoàn tất") và `checkout.post_midnight`.
  - Nút "Giữ giá đơn" (`extend.keep_rate`, gửi `nightlyRates`).
  - 22 khóa `bill.line.*` + 6 biến thể. Bill VI–EN dịch dòng ở client.
  - Đủ 49 mã `mlog.a_*`, cả `a_approval_approved` theo loại.
- Mock tính nhãn dòng theo `folio/public/line-labels.ts` của BE. Không còn `bill.line.charge` / `room_change_difference` / `deposit_forfeit`.
- Kết quả lệnh:
  - admin-web 19 tệp / **148 test** xanh. Bundle chính 433 KB.
  - Toàn repo `typecheck build` 16/16 xanh.
  - axe 0 critical/serious trên các trạng thái mới.
  - `docker build` exit 0 (`ottimo-web:fe-s3d`).

### 9.4 Còn mở
- ARC 0.3.7: `requestedById`, mốc cuối trả muộn trong `BookingRules`, nguồn phiên bản thông báo / số ngày lưu ảnh cho Desk, `checkedByName`. `getBill?locale=vi_en` chỉ còn cần cho tham số chữ tự do.
- FE-S3-20 mục 1 (`aria-disabled` khi đếm ngược) – R3.

### 9.5 Đợt 3 – BUG-R2-032, BUG-R2-052 (phần FE)
- **BUG-R2-032**: nút bước 3 → 4 của H13 = `ci.go_handover` (trước là `ci.submit` thiếu `{room}`).
- **BUG-R2-052**: lỗi 422 ở trường không có ô trên màn không còn chỉ hiện "Bắt buộc". H13 dùng `error.field_named` {label}{message}; trường có ô hiện câu tại ô và Alert `error.VALIDATION_FAILED` {n}. Phần nguyên nhân thuộc BE-A.
- Kết quả: admin-web 149/149 xanh, axe H13 0 critical/serious, `docker build` exit 0 (`ottimo-web:fe-s3e`).

### 9.6 Đợt 4 – OpenAPI 0.3.6 bổ sung 3
- H14 đọc `Registration.consentNotice`: câu hỏi `reg2.consent_q` và dòng `reg2.retention_value` nhận `{days}` từ server; gửi lại đúng phiên bản thông báo + số ngày. Thiếu trường → không hỏi đồng ý (fail closed). Đã bỏ hai hằng viết cứng.
- Gia hạn đơn OTA: số tiết kiệm phí kênh theo số đêm chọn (`repricing[].channelFeeSavingsVnd`, BUG-R2-045).
- Mock theo bổ sung 3.
- Kết quả: admin-web 153/153 test, axe 0 critical/serious, `docker build` exit 0 (`ottimo-web:fe-s3f`).

### 9.7 Đợt 5 – bổ sung 4 + link check-in online
- `partyChangeSource` (H13 sửa số khách, bỏ người khi đơn chưa nhận phòng); phụ thu người hiện theo dòng folio server ghi.
- Phí kênh trên tiền phạt hủy OTA (tùy chọn). FOC đêm OTA trả trước: mã lỗi có câu; FE chưa có nút FOC theo dòng nên không cần ẩn.
- Link check-in online trong drawer (tạo / tạo lại / thu hồi; hiện một lần; không lưu token; xóa clipboard sau 60 giây).
- Kết quả: admin-web 158/158 test, axe 0 critical/serious, `docker build` exit 0 (`ottimo-web:fe-s3g`).

### 9.8 Đợt 6 – điều kiện SEC §8 + thanh OOO trên rack
- Link check-in online:
  - Ngoại lệ clipboard chỉ ở `GuestLinkPanel`; có test quét `src`.
  - Lần xóa clipboard bị trình duyệt từ chối (đang ở Zalo) được ghi bù khi trang hiện lại / có focus.
  - Token không vào log, toast, storage, URL.
  - Thêm câu nhắc `rsv.guest_link.send_private`.
- Rack H08: thanh OOO không còn hiện khóa thô `status.block.ooo`. Có test chặn mọi khóa thô `status.*` trên rack.
- Kết quả: admin-web 163/163 test, axe 0 critical/serious, `docker build` exit 0 (`ottimo-web:fe-s3h`).

