# FE-B – Round 3 Sprint 1 – Sản xuất (22–23/10/2026)

Phạm vi giao: (1) S35 "Yêu cầu từ website" trên Desk (US-155 phần Desk, R3-Q06) bằng MSW theo hợp đồng; (2) US-008 S26 "Thêm người dùng". Không chạm màn tiền.
Đổi ưu tiên giữa chừng (ORC 23/10, INV duyệt "đường nhanh v1.0"): **US-008 vào v1.0**, **S35 dời v1.1**. Vì vậy hai việc nằm trên hai nhánh:

| Việc | Nhánh | Gốc | Trạng thái |
|---|---|---|---|
| US-008 S26 thêm người dùng (v1.0) | `worktree-agent-ac7a2b424ba496086` | `r3-2fa-int` (c20421b – BE-C US-143 + FE-A 2FA/S2) | Xong trên MSW, test xanh |
| S35 yêu cầu từ website (v1.1) | `fe-b-s35-v1.1` (ae72d7d) | `main` 4863c5c | Xong trên MSW, test xanh – chờ gộp v1.1 |

Thương hiệu OTTIMO: chỉ dùng token màu của `tokens.css` (bảng 80/15/5), Lora/Be Vietnam Pro/JetBrains Mono (mã yêu cầu, tên đăng nhập, mật khẩu tạm), không emoji; câu gửi khách giọng điềm tĩnh, VI/EN.

## 1. Đã làm

### 1.1 US-008 – S26 "Thêm người dùng" (nhánh worktree, v1.0)
- Nút "Thêm người dùng" trên H07 – **chỉ OWN** (AC3; route S26 vốn chỉ OWN, server 403 A100).
- Hộp `AddUserDialog`: tên hiển thị, tên đăng nhập (chuẩn hóa chữ thường, `^[a-z0-9._-]{3,64}$` như `createSchema` của server), mật khẩu tạm (điền sẵn mật khẩu ngẫu nhiên 14 ký tự, sửa được, nút "Tạo mật khẩu khác"), chọn ≥ 1 vai tại cơ sở (không có vai owner – như sửa vai).
- Kiểm tại chỗ giống chính sách server (≥ 10 ký tự, không chứa tên đăng nhập, không chứa "ottimo") **trước** khi mở S2 – không phí một lần nhập mã.
- S2: dùng `StrongReauthDialog` của FE-A; `api.createUser` gửi `reauth` trong cùng request, Idempotency-Key mới mỗi lần thử. Sai yếu tố → ở lại hộp S2 (câu của FE-A). Sau S2 server vẫn có thể trả lỗi trường (422 chính sách mật khẩu, **409 `USERNAME_TAKEN`** – AC2) → hộp S2 đóng, lỗi hiện tại ô.
- Thành công: toast "Đã thêm {name}.", danh sách cập nhật, hộp "Mật khẩu tạm của {name}" hiện **một lần** (dùng lại H07). Server đặt `must_change_password` (AC1).
- Mock `POST /v1/users` sửa theo đúng thứ tự server (`users.controller`/`users.service`): schema (tên đăng nhập, vai ≥ 1) → S2 → chính sách mật khẩu → 409 `USERNAME_TAKEN` (trước là 422 `DUPLICATE` – lệch hợp đồng).
- Chuỗi mới (chờ UXD duyệt): `users.add_title`, `users.f_username(_help|_invalid)`, `users.f_temp_pw(_help)`, `users.gen_pw`, `users.add_s2_title`, `users.add_s2_body`, `users.added`, `field.USERNAME_TAKEN`, `field.PASSWORD_SAME_AS_USERNAME`, `field.PASSWORD_TOO_COMMON`.

### 1.2 S35 – "Yêu cầu từ website" (nhánh `fe-b-s35-v1.1`, v1.1)
- api-client: `listWebsiteBookingRequests` (status nối dấu phẩy, chỉ `refCode` vào URL), `getWebsiteBookingRequest`, `transitionWebsiteBookingRequest` (If-Match + Idempotency-Key); kiểu `WebsiteBookingRequest*`.
- Menu "Yêu cầu từ website" (S35; OWN, MGR, FDL, FD, SAL), route `/website-requests[/:requestId]`.
- Hàng chờ: chip trạng thái (mặc định Mới + Đang xử lý), "Chỉ yêu cầu tôi đang xử lý" (lọc client – giả định BA), tìm theo **mã 8 ký tự** (bỏ `-`/khoảng trắng; sai → câu nhắc, không gọi API), "Xem thêm" theo `nextCursor`, đếm "n yêu cầu mới" ở tiêu đề. Cột theo EP19 3.3, **không** tên/SĐT. Quá hạn bằng chữ ("Quá hạn n phút"), cờ "Đến hôm nay", cờ nghi vấn (tối đa 2 + "+n"), nguồn "Website · Facebook" (AC6). SSE `website_request.changed` (gộp 1 giây) + poll/focus.
- Ngăn chi tiết: lưu trú khách hỏi, khối liên hệ (chỉ khi còn C2; SAL với yêu cầu chưa nhận thấy câu "Nhận xử lý để xem…" – SEC ARC-19), link chỉ dựng từ SĐT E.164 của server (`tel:`, `wa.me` khi khách chọn WhatsApp), **không** deep link Zalo, nhắc dùng tài khoản OTTIMO, nhắc khung giờ gọi; lời nhắn hiện dạng chữ thuần `pre-wrap` có giới hạn chiều cao, không tự tạo link (ARC-21); chi tiết nguồn thu gọn.
- Hành động **chỉ** theo `allowedActions`: Nhận xử lý, Trả lại hàng chờ (hỏi xác nhận khi trả yêu cầu người khác), Đóng – không thành đơn (7 lý do; "Lý do khác" bắt buộc ghi chú; câu gợi ý gửi khách theo ngôn ngữ của yêu cầu, nút sao chép, nhắc "hệ thống không tự gửi"), Đánh dấu spam (hộp xác nhận), Mở lại. 409/412 → "Yêu cầu vừa được người khác xử lý. Đã tải lại." 404 → "Không tìm thấy… hoặc đã giao cho người khác".
- Chuyển thành báo giá (AC2): nút "Báo giá" mở H12 `QuoteDialog` điền sẵn ngày, số đêm, người lớn, trẻ 6–11, dưới 6, ngôn ngữ văn bản báo giá; gợi ý hồ sơ cùng liên hệ qua `lookupGuestByContact` (POST, không vào URL), nhân viên tự chọn – không tự gộp (BR-951); `saveQuote.websiteBookingRequestId` → yêu cầu `in_progress` + `quoteId`; giữ chỗ từ báo giá → `converted`, xóa C2 (mock).
- Công tắc tắt (US-155 AC4): OWN/MGR/FDL đọc `public_booking_requests_enabled` (`getParameterHistory`); `false` → khung "Form đặt phòng trên website đang tắt…" (+ câu riêng cho OWN), hàng chờ rỗng nói lý do. FD/SAL không gọi (không có quyền đọc tham số) nên không khẳng định gì.
- Mock `mocks/webreq.ts` theo hợp đồng (phạm vi SAL lọc trong truy vấn, ẩn C2, SM-18, If-Match, Idempotency-Key, lý do `decline`); seed S35 cho 5 vai.

## 2. File tạo/sửa
**Nhánh worktree (US-008):** `product/apps/admin-web/src/pages/AddUserDialog.tsx` (mới), `product/apps/admin-web/src/pages/UsersPage.tsx`, `product/apps/admin-web/src/mocks/handlers.ts` (mock createUser), `product/apps/admin-web/src/__tests__/r3-s1-feb-us008.test.tsx` (mới), `product/apps/admin-web/src/__tests__/r3-s1-fea.test.tsx` (thân createUser có 1 vai cho đúng `minItems: 1`), `product/design/tools/gen_strings.py` + `product/design/copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js` (sinh lại), báo cáo này.

**Nhánh `fe-b-s35-v1.1` (S35):** `product/apps/admin-web/src/pages/webreq/{WebRequestsPage,WebRequestDrawer,labels}.tsx|ts` (mới), `src/mocks/webreq.ts` (mới), `src/mocks/{handlers,reservations,seed}.ts`, `src/session/nav.ts`, `src/app/routes.tsx`, `src/pages/quotes/QuoteDialog.tsx` (prefill + `websiteBookingRequestId` + gợi ý hồ sơ), `src/__tests__/r3-s1-feb-webreq.test.tsx` (mới), `product/packages/api-client/src/{endpoints,types,endpoints.test}.ts`, `product/packages/ui/src/styles/app.css` (`.webreq-*`, chỉ token thương hiệu), chuỗi `webreq.*` + `nav.website_requests`.

## 3. Kiểm thử
- US-008 (nhánh worktree): admin-web vitest **52 file / 541 ca xanh** (US-008: 6 ca – thêm thành công + mật khẩu tạm một lần + `mustChangePassword`; mật khẩu sinh sẵn; lỗi tại ô không mở S2; trùng tên đăng nhập sau S2 → lỗi tại ô; sai S2 không tạo; không phải OWN → không nút + API 403). `tsc` admin-web 0 lỗi, eslint 0, prettier xanh. Một lần chạy cả bộ có 1 ca `booking.test.tsx` quá thời gian (8 s) – chạy riêng và chạy lại cả bộ đều xanh: ca chậm có sẵn, không liên quan.
- S35 (nhánh `fe-b-s35-v1.1`): admin-web vitest 51 file / 507 ca xanh (S35: 18 ca); api-client 31/31; ui 13/13; i18n 19/19; `turbo run typecheck` 13/13; eslint, prettier xanh.
- Chưa kiểm bằng trình duyệt (khung xem trước không chạy được dev server từ worktree) – QA/UXD kiểm hình ở bước Review.

## 4. Giả định
- [GIẢ ĐỊNH FE-B] US-008: mật khẩu tạm điền sẵn (sinh ngẫu nhiên) nhưng OWN sửa được – AC1 ghi "nhập mật khẩu tạm"; không có vai owner trong danh sách (như sửa vai, H07 7.1b).
- [GIẢ ĐỊNH FE-B] Thứ tự kiểm của mock = mã server hiện tại (schema → S2 → mật khẩu → 409). Nếu BE-C đổi thứ tự thì FE không đổi (lỗi trường sau S2 đã xử lý).
- [GIẢ ĐỊNH BA] S35: "Chỉ của tôi" lọc ở client; đếm "mới" trên trang đã tải (hợp đồng không có tổng).
- S35: chưa có hi-fi UXD cho S35 → bố cục theo H07/S11 (bảng + ngăn phải); chuỗi `webreq.*`, `users.*` mới **chờ UXD duyệt** (ghi trong `gen_strings.py`).
- S35: `erase` (WR8, OWN/MGR/FDL) có trong hợp đồng nhưng chưa có nút trên màn này (cần quy trình xác minh SEC ARC-16 – làm cùng v1.1).

## 5. Việc còn lại
- US-008 cần gộp **cùng hoặc sau** `r3-2fa-int` (phụ thuộc `StrongReauthDialog`, `api.createUser` kèm `reauth`).
- S35 (v1.1): rebase `fe-b-s35-v1.1` lên nhánh v1.1 (xung đột dự kiến chỉ ở `gen_strings.py`/JSON sinh – chạy lại `gen_strings.py`); số đếm trên mục menu (AppShell chưa có badge), dòng "Cần chú ý" `website_request_new`, nút "Tạo đơn" (FD+, `createReservation.websiteBookingRequestId`), `erase`, nối server thật khi BE-D xong.
- Các mục FE-B khác của Sprint 1 chưa làm trong lượt này: R3-Q13, US-161/162, US-128, dòng "Cần chú ý" mới, R3-Q46, R3-Q50.
