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
- `src/components` – khung app, menu người dùng, trạng thái chung, `GuestPicker` (bộ chọn khách dùng chung)
- `src/mocks` – MSW handlers theo `docs/api/openapi.yaml`
- Gói dùng chung: `packages/api-client` (sinh kiểu: `pnpm --filter @ottimo/api-client gen`), `packages/i18n`, `packages/ui` (`pnpm --filter @ottimo/ui sync` khi UXD đổi icon)
