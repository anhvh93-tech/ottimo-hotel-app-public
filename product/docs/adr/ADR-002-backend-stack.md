# ADR-002 – Backend: Node.js 22 LTS + TypeScript + NestJS + Drizzle ORM + zod

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: ADR-001, ADR-003, ADR-009, ADR-012

## Bối cảnh
- Cần một ngôn ngữ chung cho backend, web và PWA để đội nhỏ chia sẻ kiểu dữ liệu (hợp đồng API, enum trạng thái, chuỗi i18n).
- Logic chống đặt trùng dựa vào tính năng riêng của PostgreSQL (exclusion constraint, `daterange`, `SELECT … FOR UPDATE`, RLS) – ORM phải cho viết SQL gần như thuần.

## Quyết định
| Thành phần | Chọn | Lý do |
|---|---|---|
| Runtime | **Node.js 22 LTS** | LTS đến 2027; image `node:22-alpine` nhỏ |
| Ngôn ngữ | **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`) | Chung với FE/PWA; giảm lỗi kiểu ở logic tiền |
| Framework | **NestJS** (adapter Fastify) | Module rõ ràng hợp modular monolith; DI giúp thay `Clock`, adapter tích hợp khi test; Fastify nhanh, ít RAM hơn Express |
| ORM / truy vấn | **Drizzle ORM** cho kiểu + truy vấn; **migration SQL là nguồn sự thật của schema**: `drizzle-kit generate` sinh nháp được sửa tay, đối tượng drizzle-kit không biết nằm trong file `--custom`; cấm `drizzle-kit push`; CI kiểm schema.ts khớp migration (erd mục 16, BE-ARC-07) | Gần SQL, hỗ trợ `for('update')`, transaction có isolation level; không giấu SQL |
| Số lớn | `pg` `setTypeParser(20, parseSafeBigint)`; Drizzle `bigint({ mode: 'number' })` | Tiền an toàn ≤ 2^53 |
| UUIDv7 | `uuid@^11` (`v7()`) | Node 22/PG 17 chưa có sẵn |
| Kiểm dữ liệu vào | **zod** (qua `nestjs-zod`) | Một schema dùng cho validate request và sinh kiểu |
| Tiền | `bigint`/`integer` VND trong DB, `number` nguyên trong TS (≤ 2^53), helper làm tròn theo BR-005 | VND không có số lẻ; cấm `float` cho tiền (lint rule) |
| Ngày giờ | `date-fns` + `@date-fns/tz` sau lớp `Clock` (ADR-008) | Nhẹ, có múi giờ |
| Băm mật khẩu | argon2id | Khuyến nghị OWASP |
| Log | `pino` có danh sách trường che (redact) | JSON, nhanh; không ghi dữ liệu C2/C3 (SEC) |

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Prisma | Không biểu diễn được exclusion constraint/RLS trong schema; khóa hàng (`FOR UPDATE`) phải dùng raw query; engine nặng hơn |
| TypeORM | Lịch sử lỗi migration, kiểu yếu hơn |
| Express thuần | Thiếu cấu trúc module/DI cho đội nhiều người |
| Go / Java Spring / .NET | Mạnh nhưng không chia sẻ kiểu với web; đội phải dùng 2 ngôn ngữ |
| Python (FastAPI/Django) | Tương tự – 2 ngôn ngữ; Django admin hấp dẫn nhưng không hợp UI OTTIMO |

## Hệ quả
- Tốt: một ngôn ngữ cho toàn bộ trừ SQL; BE/FE đọc được code của nhau khi review chéo.
- Phải chấp nhận: NestJS có nhiều decorator, dev mới cần làm quen; Drizzle trẻ hơn Prisma – khóa phiên bản chính xác trong `package.json` (không dùng `^` cho ORM).

## Điều kiện xem lại
- Drizzle gặp lỗi chặn với transaction/RLS → chuyển sang Kysely (cùng triết lý query builder, đổi ở tầng repository).
