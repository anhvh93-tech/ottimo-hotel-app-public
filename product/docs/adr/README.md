# Architecture Decision Records (ADR) – OTTIMO Desk

- Chủ sở hữu: ARC | Tạo: Round 1 – Bước 2 – Đợt 2 (Pha A), 15/10/2026
- Mỗi quyết định công nghệ/kiến trúc lớn có 1 ADR. Đổi quyết định = viết ADR mới "Thay thế ADR-xxx", không sửa nội dung ADR cũ (chỉ đổi dòng Trạng thái).
- Trạng thái: **Đề xuất** (chờ review BE, SEC bắt buộc; OPS, INT, MOB khuyến nghị) → **Chấp nhận** (sau bước 4) → **Thay thế bởi ADR-yyy**.

| ADR | Tiêu đề | Trạng thái | Phụ thuộc INV |
|---|---|---|---|
| [ADR-001](ADR-001-overall-architecture.md) | Kiến trúc tổng thể: modular monolith + worker, contract-first API | Đề xuất | – |
| [ADR-002](ADR-002-backend-stack.md) | Backend: Node.js 22 LTS + TypeScript + NestJS + Drizzle ORM + zod | Đề xuất | – |
| [ADR-003](ADR-003-database-queue-realtime.md) | PostgreSQL 17 là kho duy nhất; hàng đợi pg-boss (chưa dùng Redis); real-time SSE | Đề xuất | – |
| [ADR-004](ADR-004-web-frontend.md) | Web quản trị và web khách: React + Vite SPA (không SSR ở MVP) | Đề xuất | – |
| [ADR-005](ADR-005-staff-app-pwa.md) | App nhân viên là PWA (không native Flutter ở MVP), có hàng đợi offline | Đề xuất | – |
| [ADR-006](ADR-006-guest-app-link.md) | App khách là web mở bằng link/QR gắn theo đơn | Đề xuất | – |
| [ADR-007](ADR-007-multi-property.md) | Đa cơ sở: một database, cột `property_id` + Row Level Security | Đề xuất | – |
| [ADR-008](ADR-008-time-and-timezone.md) | Thời gian: UTC cho thời điểm, ngày nghiệp vụ theo múi giờ cơ sở, `Clock` tiêm được | Đề xuất | – |
| [ADR-009](ADR-009-double-booking-prevention.md) | Chống đặt trùng ở database (exclusion constraint) + idempotency | Đề xuất | – |
| [ADR-010](ADR-010-hosting-and-cost.md) | Hosting: 1 VPS tại Việt Nam, Docker Compose, Caddy; chi phí ≤ 1 tr/tháng | Đề xuất | **Có** – ESC-002 (nơi đặt dữ liệu) |
| [ADR-011](ADR-011-integration-adapters.md) | Lớp adapter tích hợp + outbox/inbox (xác nhận thiết kế INT, có bổ sung) | Đề xuất | ESC chọn channel manager (INT) |
| [ADR-012](ADR-012-monorepo-toolchain.md) | Monorepo pnpm + Turborepo; ESLint, Prettier, Vitest, Playwright, k6 | Đề xuất | – |
| [ADR-013](ADR-013-sensitive-file-storage.md) | Lưu ảnh giấy tờ: mã hóa phong bì (envelope), xóa bằng hủy khóa | Đề xuất | ESC-001 (thời hạn lưu) |
| [ADR-014](ADR-014-landing-site.md) | Website giới thiệu + đặt phòng trực tiếp ở tên miền gốc: `apps/landing-web` (Astro 6 tĩnh) trên Caddy cùng VPS; form tạo `booking_inquiry`; API công khai phòng trống/giá R3 | Đề xuất | Tên miền (ESC-010); cho tải ảnh Drive; chính sách hiện giá công khai (PO) |

Mẫu ADR: Bối cảnh · Quyết định · Phương án đã cân nhắc · Hệ quả (tốt / phải chấp nhận) · Điều kiện xem lại · Liên quan.
