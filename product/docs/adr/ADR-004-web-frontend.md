# ADR-004 – Web quản trị và web khách: React + Vite SPA (không SSR ở MVP)

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: ADR-005, ADR-006, ADR-012; UXD Design System (`product/design/`)

## Bối cảnh
- Mặc định skill ARC gợi ý Next.js. Nhưng: web quản trị nằm sau đăng nhập (không cần SEO), web khách mở bằng link riêng (không cần SEO), và SSR cần một tiến trình Node thường trực tốn RAM trên VPS 4 GB.
- Cần: room rack 14 ngày tương tác nhiều, bảng, drawer, modal; Design System OTTIMO (Lora + Be Vietnam Pro tự host – SEC F13); VI/EN (RU cho app khách).

## Quyết định
1. **React 18 + Vite + TypeScript**, build ra **tệp tĩnh**, Caddy phục vụ trực tiếp (không có tiến trình Node cho frontend).
2. Thư viện dùng chung:
   - Định tuyến: **TanStack Router** (kiểu an toàn) – hoặc React Router nếu FE thấy quen hơn (FE chốt trong coding-standards, không ảnh hưởng kiến trúc).
   - Dữ liệu server: **TanStack Query** (cache, retry, đồng bộ lại khi focus/online).
   - Form: React Hook Form + zod (dùng lại schema của `packages/contracts`).
   - i18n: `i18next` với tệp chuỗi trong `packages/i18n` (vi, en, ru).
   - UI: component tự viết theo token UXD trong `packages/ui` (CSS variables sinh từ `product/design/tokens.json`), primitive truy cập được từ **Radix UI** (bẫy focus modal/drawer – khắc phục BL 8.3).
   - Ngày giờ hiển thị: luôn theo múi giờ cơ sở do API trả về (ADR-008), không theo múi giờ máy.
3. `booking-web` (trang đặt phòng công khai – Should R3) **cần SEO** → quyết công nghệ ở R3 bằng ADR riêng (ứng viên: Astro xuất tĩnh + đảo React; hoặc trang tĩnh do Vite prerender). Không làm ở R2.

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Next.js (App Router, SSR) | Lợi ích chính (SEO, SSR) không cần cho app sau đăng nhập; thêm tiến trình Node, cấu hình cache/route server phức tạp; xuất tĩnh của Next mất nhiều tính năng |
| Vue/Nuxt, Svelte | Tốt, nhưng hệ sinh thái component a11y và nguồn tuyển dụng React rộng hơn; thống nhất 1 framework cho cả PWA |
| Flutter Web | Bundle lớn, chậm trên Android tầm trung, a11y web kém |

## Hệ quả
- Tốt: hosting tĩnh rẻ; tải trang lần 2 gần như tức thì nhờ cache; cùng stack với PWA (ADR-005).
- Phải chấp nhận: lần tải đầu phụ thuộc kích thước bundle → **ngân sách bundle** (architecture.md mục 16) và chia code theo route bắt buộc.
