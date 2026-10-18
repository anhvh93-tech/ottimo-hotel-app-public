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

Chưa có: minibar khi dọn phòng có khách (H20.4 – chờ BE-D giao US-066), icon PWA (chờ logo SVG – B6), Web Push (R3).
