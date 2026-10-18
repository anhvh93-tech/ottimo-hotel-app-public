# guest-web – trang khách theo link/QR (ADR-006)

React + Vite, mobile-first, **EN mặc định** (P-S4-10: trình duyệt `vi*` → VI, `ru*` → RU, còn lại → EN; ngôn ngữ của phiên thắng), VI / EN / RU (RU nháp, thiếu key → EN; 8 chuỗi pháp lý luôn EN trong khối `lang="en"` tới khi RU được duyệt – decision-log 17/10). R2 chỉ có **phiên mức 1** (SEC P-R2-4 ĐK-1…6):
không OTP, không bill, không mã cửa, không họ tên đầy đủ, không lưu gì trên máy khách.

## Chạy

```bash
# từ product/
pnpm --filter @ottimo/guest-web dev          # API giả MSW (mặc định) – http://localhost:5175/g/<token>
pnpm --filter @ottimo/guest-web dev:server   # API thật qua proxy /v1 → :3000 (khi BE-C xong guest-portal)
pnpm --filter @ottimo/guest-web test
pnpm --filter @ottimo/guest-web build
```

Token giả (xem `src/mocks/handlers.ts` → `MOCK_TOKENS`):

| Token | Tình huống |
|---|---|
| `demo-guest-link-0123456789abcdef` | Đơn `confirmed`, 2 khách, check-in online mở |
| `demo-expired-link-0123456789abcd` | 401 `GUEST_LINK_INVALID` |
| `demo-ended-stay-link-0123456789ab` | 403 `GUEST_STAY_ENDED` |
| `demo-closed-checkin-0123456789ab` | `onlineCheckinAvailable=false` |
| `demo-in-house-link-0123456789abc` | `in_house` – có Wi-Fi |

Trạng thái giả nằm trong bộ nhớ: tải lại trang = mất phiên giả ("Liên kết đã hết hạn"); API thật giữ phiên bằng cookie.
Trình duyệt nhúng không chạy được service worker của MSW → mở bằng Chrome/Safari.

Biến build `VITE_DESK_PHONE` – số công khai hiện ở trang "Liên kết đã hết hạn" (khi chưa có phiên thì không biết SĐT
cơ sở; cùng biến với nút "Gọi lễ tân" của PWA). **Bắt buộc** khi build profile `demo` và `production` (OPS,
`Dockerfile.web` `WEB_BUILD_PROFILE`, `infra/docker/check-web-build-config.sh`): thiếu biến, sai dạng hoặc còn số mẫu
`0000 000 000` thì build dừng. Chỉ chữ số, dấu cách và một dấu `+` ở đầu (`^\+?[0-9 ]{6,20}$`), ví dụ `08 4444 0909`.
`pnpm dev` không bắt buộc. Số thật đặt trong `product/.env` (không vào repo); mẫu ở `.env.example`.

## Cấu trúc

- `src/main.tsx` – đọc `/g/{token}`, xóa khỏi URL trước khi render (SR-GST-02).
- `src/app/api.ts` – 11 operation mức 1 (thêm `listMyRequests`, `listGuestRequestOptions`, `createGuestRequest` – 0.3.7) (`openGuestSession`, `getGuestStay`, `setGuestLocale`, `getOnlineCheckin`, `updateOnlineCheckin`, `uploadGuestDocument` (XHR để có tiến trình), `recordGuestConsent`, `completeOnlineCheckin`) + bộ lọc trắng khóa mức 1.
- `src/app/image.ts` – chuẩn hóa ảnh: canvas → JPEG, ≤ 2.500 px, mất EXIF, chỉ trong bộ nhớ.
- `src/checkin/*` – H18: thông báo → giấy tờ → giờ đến → xác nhận → xong.
- `src/pages/*` – Lưu trú (lời chào thương hiệu tiếng Anh + dòng hỗ trợ, tên phòng BR-012 qua `roomLabel()` của `@ottimo/i18n`, mã đặt phòng và Wi-Fi JetBrains Mono 16 px), **Yêu cầu** (H23 – US-109: danh sách SM-15 làm mới 30 giây, gửi yêu cầu với phí server tính theo ESC-016 A, tick đồng ý phí; mất mạng không xếp hàng), **Thông tin** (H23.3 – US-108: Wi-Fi, giờ, chỉ đường theo ghim INV, nội quy, gọi người trực), các trang trạng thái (hết hạn, đã trả phòng, đã đóng, 429, lỗi).
- Chỉ chế độ sáng (`<html data-theme="light">`, DS 11.5). Khách không bao giờ thấy số căn: `roomNo` bị bỏ ở bộ lọc mức 1.
- `build/used-keys.ts` – danh sách khóa chuỗi được đóng gói = khóa mã nguồn thực sự gọi (trừ khóa ĐK-6).
- `src/__tests__/guard.test.ts` – quét mã nguồn theo s3-checklist G1/G3/G8; `bundle.test.ts` tự build bản production vào thư mục tạm và quét bundle (chạy trong mọi `pnpm test`, cả CI).

Bản build không có `mockServiceWorker.js` và không đăng ký service worker nào.
