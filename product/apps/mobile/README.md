# OTTIMO Staff – PWA buồng phòng / bảo trì (ADR-005)

React + Vite, cài lên màn hình chính từ Chrome Android / Safari iOS. Một app cho hai vai:
`housekeeping` (Việc của tôi · Các căn · Báo sự cố · Tôi) và `maintenance` (Phiếu sửa · Các căn · Báo sự cố · Tôi).
Lễ tân trở lên đăng nhập được và thấy màn buồng phòng (họ là người kiểm phòng). Sale/CTV: không có màn nào.

**Không bao giờ có dữ liệu C3 hay tiền** (ADR-005 mục 6, SR-DEV-09): không giấy tờ, không mã cửa, không folio –
`src/__tests__/guard.test.ts` quét mã nguồn mỗi lần test.

## Chạy

```bash
# từ product/
pnpm --filter @ottimo/mobile dev          # API giả MSW theo OpenAPI 0.3.7 – http://localhost:5174
pnpm --filter @ottimo/mobile dev:server   # API thật qua proxy /v1 → :3000 (khi BE-C giao module buồng phòng)
pnpm --filter @ottimo/mobile test         # đơn vị + luồng (RTL, MSW) + quét bundle production
pnpm --filter @ottimo/mobile build
```

Tài khoản giả (chỉ có trong mock, `src/mocks/handlers.ts` → `MOCK_USERS`, mật khẩu `MOCK_PASSWORD`):
`hk.lan` (buồng phòng), `mt.tung` (bảo trì), `fdl.hanh` (lễ tân trưởng), `sale.minh` (không có quyền).
v1.0.4 (P4-50): `own.mfa`, `mgr.mfa`, `fdl.mfa`, `fd.mfa`, `hk.mfa`, `mt.mfa`, `sale.mfa`, `ctv.mfa` – có xác thực 2 bước
(bước 2 nhập `MOCK_TOTP` hoặc `MOCK_RECOVERY_CODE`); `hk.temp` (mật khẩu tạm), `mt.temp.mfa` (mật khẩu tạm + 2 bước),
`mgr.enroll` (quản lý chưa bật 2 bước, `MFA_ENFORCED`). Kịch bản mạng yếu bước 2: `dropNext = 'loginMfa'` (không tới máy chủ),
`dropAnswerOf = 'loginMfa'` (máy chủ đã nhận, mất câu trả lời).
Kịch bản: `window.__ottimoStaffMock.control` (`failNext`, `dropNext`, `latencyMs`, `setRoom`).
Biến build `VITE_DESK_PHONE` – số lễ tân cho nút "Gọi lễ tân" (cùng biến với guest-web). **Bắt buộc** khi build
profile `demo` và `production` (OPS, `Dockerfile.web` `WEB_BUILD_PROFILE`, `infra/docker/check-web-build-config.sh`):
thiếu biến, sai dạng hoặc còn số mẫu `0000 000 000` thì build dừng. Chỉ chữ số, dấu cách và một dấu `+` ở đầu
(`^\+?[0-9 ]{6,20}$`), ví dụ `08 4444 0909`; viết có dấu chấm hoặc gạch ngang thì app ẩn nút gọi. `pnpm dev` (profile
dev) không bắt buộc: thiếu số thì không hiện nút. Số thật đặt trong `product/.env` (không vào repo); mẫu ở `.env.example`.

## Cách làm chính

| Việc | Ở đâu | Ghi chú |
|---|---|---|
| Hoàn tác 10 giây = gửi trễ 10 giây | `src/queue/queue.ts`, `QueueProvider.tsx` | Mọi lệnh ghi được phép xếp hàng (đổi trạng thái buồng, xong/hủy việc, kiểm phòng, ảnh + phiếu sự cố) nằm 10 giây trên máy; Hoàn tác = xóa khỏi hàng, không gọi API. `Idempotency-Key` + `performedAt` cố định lúc bấm. Focus vào nút Hoàn tác thì dừng đếm (WCAG 2.2.1) |
| Hàng đợi offline (US-058) | `src/queue/queue.ts` | FIFO, lưu IndexedDB; lỗi mạng/5xx/429/bận → thử lại 5 s → 15 s → 1 ph → 5 ph giữ thứ tự; 409 `INVALID_TRANSITION` đúng trạng thái muốn đạt = "đã áp dụng"; 409/422/403/404 khác → "Cần xem lại" có lý do, không bỏ im lặng; 401 → dừng, đăng nhập lại rồi gửi tiếp. Gửi lại khi `online`, khi mở app, Background Sync (Chrome) |
| Đọc offline | `src/data/cache.ts` | Bản sao theo **danh sách cho phép** SR-PWA-01: việc hôm nay (không ghi chú tự do của khách), 10 căn (tên gọi khách chỉ với căn có việc hôm nay), checklist, danh sách phiếu (không mô tả/ảnh). Dòng "Dữ liệu lúc hh:mm" |
| Đăng xuất / đổi người | `App.tsx` | Cảnh báo nếu còn thao tác chưa gửi; xóa IndexedDB + Cache Storage (SR-PWA-04) |
| Service worker | `public/sw.js` | Chỉ cache vỏ app tĩnh; `/v1/*` không bao giờ vào cache (SR-PWA-02); tên cache gắn mã build |
| Tên phòng | `roomLabel()` của `@ottimo/i18n` | Nhân viên thấy "401 · The Pine" (BR-012, DS 11.3); `src/app/rooms.ts` chỉ đổi `roomName` → `name` |
| Chuỗi | `scripts/used-keys.ts` | Bundle chỉ mang khóa mã nguồn gọi (VI/EN) – lần tải đầu ≈ 108 KB gzip (ngân sách 180 KB) |
| Font | `@ottimo/ui/styles.css` | Lora, Be Vietnam Pro, JetBrains Mono tự host (B0 + B1 cùng bản build, S4-49) |

## Màn đã có (Sprint 4)
H19 (việc hôm nay, các căn + bộ lọc), H20 (màn căn, Bắt đầu dọn / Dọn xong, Khách không muốn dọn, kiểm phòng có checklist + ảnh),
H21 (báo sự cố có ảnh nén ≤ 300 KB, banner mất mạng, "Thao tác trên máy"), H22 (phiếu sửa: danh sách, nhận việc, chờ vật tư,
sửa xong có ảnh, ảnh lúc báo, **phiếu mới + khóa phòng** cho bảo trì / lễ tân trở lên – chỉ online), **hộp thông báo** (chuông + số chưa đọc,
SSE `notification.created`), SSE `room.status_changed` / `hk_task.changed` / `work_order.changed` / `guest_request.changed`
(server lọc theo vai; không có luồng – bản mock – thì hỏi lại mỗi 60 giây). Nhãn checklist theo nút VI/EN của app
(`acceptLanguage`, 0.3.7 bổ sung 1 #13).

**v1.0.4 (P4-50)** – đăng nhập 2 bước (ARC-RN103-02): `401 MFA_REQUIRED` → `MfaStepPage` (mã 6 số hoặc mã khôi phục → `loginMfa`;
một câu `MFA_INVALID`; về bước 1 sau 5 phút hoặc 5 lần sai; mạng yếu không xóa mã đã gõ, "Thử lại" hỏi `getMe` trước nếu lần trước mất câu trả lời).
Phiên hạn chế (BUG-R3-052): `Me.mustChangePassword` / `403 PASSWORD_CHANGE_REQUIRED` → `SetPasswordPage` (đổi mật khẩu tạm ngay trên điện thoại,
kèm mã 2 bước khi đã bật); `Me.mfaEnrollmentRequired` / `403 MFA_ENROLLMENT_REQUIRED` (quản lý chưa bật, hoặc vừa vào bằng mã khôi phục) →
`EnrollOnDeskPage` (bật trên OTTIMO Desk – nút mở `desk.<miền>` khi app chạy ở `staff.<miền>`, rồi đăng xuất / đăng nhập lại). Hàng đợi gặp 403 này thì
tạm dừng như 401 (không vào "Cần xem lại").

**v1.0.5 (V5-15)** – nút **Báo cần dọn** (UXD bản 1.7 mục 9.7; việc trong plan gọi là "nút Cần dọn") ở màn căn (H20) khi `allowedEvents` của máy chủ có `needs_cleaning` (căn "Khách đang ở – đã dọn",
R8 OC → OD, máy chủ thêm việc dọn phòng khách đang ở; hợp đồng 0.3.13 mục 1.4, không đổi API). Đi hàng đợi như các bước khác: Hoàn tác
10 giây, mất mạng thì lưu trên máy rồi tự gửi, một lần bấm = một lệnh (bấm lặp khi màn chưa kịp vẽ lại không tạo lệnh thứ hai,
`waitingRoomEvent`); 409 `currentState` = OD (lễ tân bấm trước) → "Đã áp dụng", trạng thái khác → "Cần xem lại". Trong lúc chờ gửi, bước kế
là "Bắt đầu dọn". Mock: R8 + phạm vi T của buồng phòng cho bước này, `dropAnswerOf = 'transitionRoomStatus'` (máy chủ đã làm, mất câu trả lời).

Chưa có: minibar khi dọn phòng có khách (H20.4 – chờ BE-D giao US-066), icon PWA (chờ logo SVG – B6), Web Push (R3).
