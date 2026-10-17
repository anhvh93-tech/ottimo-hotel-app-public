# admin-web (OTTIMO Desk)

React 18 + Vite SPA (ADR-004) cho máy quầy: lễ tân, quản lý, chủ đầu tư.

## Chạy

```bash
pnpm --filter @ottimo/admin-web dev          # API giả (MSW) – không cần server
pnpm --filter @ottimo/admin-web dev:server   # /v1 proxy tới api :3000 (docker compose)
pnpm --filter @ottimo/admin-web test         # Vitest + Testing Library + MSW (node)
```

Tài khoản giả (chỉ chế độ mock): `qa.owner`, `qa.mgr`, `qa.fdl`, `qa.fd`, `qa.hk`, `qa.mt`, `qa.sal`, `qa.ctv1`,
`qa.temp` (mật khẩu tạm), `qa.locked`; mật khẩu ở `src/mocks/seed.ts` (`MOCK_PASSWORD`, giá trị thử, không dùng ở môi trường thật).
Console trình duyệt: `__ottimoMock.reset()`.

## Cấu trúc

- `src/app` – client API, router, xử lý problem+json, theme, toast, kiểm hợp lệ V-01…V-04
- `src/session` – phiên (cookie HttpOnly, CSRF trong bộ nhớ), mô hình menu theo `screens`
- `src/pages` – H01 đăng nhập/đổi mật khẩu/chọn cơ sở, H03 Hôm nay, H04 căn, H05 tham số, H06 khách, H07 người dùng & thiết bị
- Sprint 2 (EP02, tải theo route – `React.lazy`): `pages/rack` H08 (lưới ARIA `RackGrid`, mô hình `rackModel.ts`, bảng thay thế
  "Danh sách", danh sách che tên cho buồng phòng/bảo trì), `pages/booking` H09 `BookingDialog` + H10 `LongStayDialog`,
  `pages/reservations` H11 `ReservationDrawer` + hộp thao tác (`ReservationDialogs.tsx`) + danh sách đơn `/reservations/:id`,
  `pages/quotes` H12 (căn trống → báo giá → gửi → giữ chỗ, lưới căn trống theo vai)
- Cập nhật rack: `app/live.ts` – SSE `streamEvents` khi chạy server thật (`pnpm dev:server`), mất SSE → hiện "Dữ liệu lúc …" + hỏi lại
  mỗi 30 s; chế độ mock/test: hỏi lại 30 s + khi quay lại tab; mọi thao tác ghi gọi `notifyChanged()` → rack tải lại ngay
- Sprint 3 (EP03–EP06, EP15): `pages/stay` – H13 `CheckInPage` (`/reservations/:id/check-in`), H16 `CheckOutPage`
  (`/reservations/:id/check-out`, bill `BillDialog`), H15 hộp lưu trú (`StayDialogs.tsx`: gia hạn, trả muộn, đổi phòng,
  phát sinh, xác nhận giờ trả, giao mã/thẻ, hoàn tác, người đi cùng, đề nghị hoàn), `PaymentPanel` (VietQR vẽ tại chỗ bằng
  `@ottimo/ui` `QrCode` – SEC F2, tiền mặt, chuyển khoản, POS); `pages/registration` H14 (C3, thiết bị được cấp);
  `pages/approvals` H17 17.2; `pages/money` H17 17.3 + đối soát/tiền mặt nộp quầy (A46/A46a) + chi hoàn (A47/A47a)
- Sprint 4 (FE-B – vận hành, thương hiệu): H03 `pages/TodayPage.tsx` + H24 `pages/OverviewPage.tsx` (khối đọc độc lập,
  `pages/dashboard/useDashboard.ts` – SSE theo loại sự kiện `app/live.ts` `useLiveEvents`, "Cần chú ý" mỗi 60 s;
  câu cho mọi `AttentionItem.kind` ở `app/attention.ts`; đóng mục `event` bằng `resolveAttentionEvent`); mock EP01 ở
  `mocks/dashboard.ts` (KPI/khách đến-đi/"Cần chú ý" TÍNH từ mock đơn – tới khi BE-D giao API). Nhãn căn nhân viên
  "401 · The Pine" (`app/rooms.ts` → `roomLabel()` của `@ottimo/i18n`, BR-012); mã đơn/số phiếu/mã hồ sơ JetBrains Mono
  (`app/mono.tsx` `monoArgs`/`Code`, font tự host trong `@ottimo/ui`). H16 "Ghi công nợ" (MGR/OWN, S4-26), drawer
  "Xem Phiếu thanh toán" cho đơn đã trả (S4-29), ảnh biên nhận khi CTV báo chuyển cọc (S4-30)
- Sprint 4 đợt 2 (FE-B): `pages/ops` – S10 `HousekeepingPage` (việc hôm nay + bộ đếm, 10 căn), S11 `MaintenancePage`
  (phiếu sửa + `WorkOrderDrawer` theo `allowedActions`, `WorkOrderForms` tạo phiếu/khóa phòng có xử lý 409, tab Khóa phòng),
  `GuestRequests` (hàng yêu cầu khách trên H03), nhãn dùng chung `opsLabels.ts`; S13 `pages/MinibarPage.tsx`. Mock ở
  `mocks/ops.ts` (dùng chung khối OOO của mock EP02 và danh mục minibar của mock stay)
- Lưu đồng thời / hệ thống bận (DS 6.21): `app/useWrite.tsx` – `409 CONCURRENT_UPDATE` / `503 SERVICE_UNAVAILABLE` giữ form,
  tự gửi lại cùng `Idempotency-Key` + `If-Match` theo `Retry-After`; GET 503 tự tải lại 1 lần (`hooks/useResource.ts`)
- `src/components` – khung app, menu người dùng, trạng thái chung, `GuestPicker` (bộ chọn khách dùng chung)
- `src/mocks` – MSW handlers theo `docs/api/openapi.yaml`; EP02 ở `mocks/reservations.ts` (ngày tương đối "hôm nay",
  chống trùng 409 + `conflicts[]`/`suggestions[]`, If-Match 412, Idempotency-Key, `allowedActions` theo trạng thái × vai);
  Sprint 3 ở `mocks/stay.ts` (folio, thanh toán, VietQR, duyệt, hoàn, khai báo – thứ tự kiểm theo spec EP03-05/EP06)

## Phím tắt (Desk)

`R` sơ đồ phòng · trong sơ đồ: `T` về hôm nay, `N` đặt phòng mới, mũi tên đi giữa ô, `Home`/`End` đầu/cuối dòng,
`Enter`/`Space` mở đơn hoặc đặt phòng ở ô trống, `Esc` đóng drawer (focus quay về ô cũ)

- Gói dùng chung: `packages/api-client` (sinh kiểu: `pnpm --filter @ottimo/api-client gen`), `packages/i18n`, `packages/ui` (`pnpm --filter @ottimo/ui sync` khi UXD đổi icon)
