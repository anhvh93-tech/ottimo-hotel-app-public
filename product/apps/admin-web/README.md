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
- `src/components` – khung app, menu người dùng, trạng thái chung, `GuestPicker` (bộ chọn khách dùng chung)
- `src/mocks` – MSW handlers theo `docs/api/openapi.yaml`; EP02 ở `mocks/reservations.ts` (ngày tương đối "hôm nay",
  chống trùng 409 + `conflicts[]`/`suggestions[]`, If-Match 412, Idempotency-Key, `allowedActions` theo trạng thái × vai)

## Phím tắt (Desk)

`R` sơ đồ phòng · trong sơ đồ: `T` về hôm nay, `N` đặt phòng mới, mũi tên đi giữa ô, `Home`/`End` đầu/cuối dòng,
`Enter`/`Space` mở đơn hoặc đặt phòng ở ô trống, `Esc` đóng drawer (focus quay về ô cũ)
- Gói dùng chung: `packages/api-client` (sinh kiểu: `pnpm --filter @ottimo/api-client gen`), `packages/i18n`, `packages/ui` (`pnpm --filter @ottimo/ui sync` khi UXD đổi icon)
