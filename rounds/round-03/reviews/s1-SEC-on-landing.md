# SEC review – Landing `ottimo.vn` LP-v1 (R3-Q52) đã gộp `main`

- Người review: SEC | Ngày: 24/10/2026 | Round 3 – Bước Review (review nhanh trước khi landing lên mạng).
- Đối tượng: `main` `794e6f1` (gộp landing LP-v1 R3-Q52):
  - `product/apps/landing-web/src/scripts/carousel.ts`, `lightbox.ts`;
  - `src/components/RoomGallery.astro`;
  - `src/content/site.json` (`legal`, email, `paymentReceivingAccountHolder`), `src/components/home/Faq.astro`, `src/content/{en,vi}.ts` (`faq.depositAccount`);
  - phần OPS: `infra/caddy/Caddyfile.landing` (đã review ở `s1-SEC-on-v1-prod.md` mục 4.3, không đổi từ `7c2e682`), khối `landing_access` của `infra/server/bin/init-secrets.sh`.
- Tệp này không chứa mật khẩu bản xem trước, IP hay bí mật nào.

## 1. Kết luận

**Lên mạng được.** Blocker: 0. Major: 0. Suggestion: 2.

Các điều kiện vận hành đã có ở các review trước, không phải điều kiện mới:
- edge có giới hạn kết nối theo IP: OPS-01, OPS đã sửa ở `a22cd4f`;
- INV xóa bản ghi `mail` trước khi bật HSTS `includeSubDomains` (INV đã quyết 23/10);
- bản production chỉ ra Internet qua tag `landing-v*` sau khi INV duyệt environment `production`.

| Hạng mục ORC hỏi | Kết quả |
|---|---|
| `carousel.ts`, `lightbox.ts` | **Đạt.** Chỉ dùng `textContent`, `setAttribute` cho thuộc tính ARIA, và `classList`. Không có `innerHTML`, `eval`, `fetch`, `postMessage` hay lưu trữ trình duyệt. Phần tử tìm qua `data-*` do chính trang render. Hộp xem ảnh là `<dialog>` gốc với `showModal()`: trang phía sau bị khóa, Tab không thoát ra ngoài được. |
| `RoomGallery.astro` | **Đạt.** Không có `set:html`, không có script inline, không có thuộc tính `style`, không có URL ngoài. |
| CSP / không tài nguyên ngoài | **Đạt.** Bản build sạch (`LANDING_INDEXABLE=true`):<br>- mọi `<script>` thực thi là module `/_astro/…` cùng nguồn;<br>- hai khối `application/ld+json` là dữ liệu, không chạy nên không vướng `script-src 'self'`;<br>- 0 thuộc tính `style`, 0 thẻ `<style>` inline;<br>- 0 `<form>`;<br>- JS không chứa URL ngoài.<br>Liên kết ngoài chỉ là `<a>` (Zalo, WhatsApp, Telegram, Viber, Facebook, Google Maps, `tel:`, `mailto:`). Cả 6 liên kết `target="_blank"` đều có `rel="noopener noreferrer"`. Ảnh, phông chữ và OG đều cùng nguồn. `check:dist` đạt 11/11 nhóm (`inlineCode`, `thirdParty`, `forms`, `seo`, `sitemapRobots`, `images`…). |
| Không email cá nhân | **Đạt.** Địa chỉ email duy nhất trong HTML và JS là `info@ottimo.vn`, hộp thư chung trên tên miền OTTIMO, đúng ghi chú của `site.json`. |
| Không dữ liệu nhạy cảm | **Đạt.** `legal` gồm tên công ty, mã số thuế và địa chỉ trụ sở. Đây là thông tin doanh nghiệp công khai, trang web thương mại phải công bố; không phải dữ liệu cá nhân. Không có tên người đại diện, số tài khoản, SĐT cá nhân hay số phòng. Ảnh trong `dist` (109 tệp) và ảnh nguồn trong repo công khai (108 tệp) **không có** EXIF, GPS hay XMP. |
| Câu 4d (chống giả danh nhận cọc) để trống tên | **Đạt.** `paymentReceivingAccountHolder` = `""`, nên câu trả lời FAQ chỉ còn "OTTIMO không bao giờ đổi số tài khoản qua tin nhắn". Không hiện chỗ trống hay `undefined` (test `copy.test.ts`). Xem S-2. |
| Bản xem trước `staging.ottimo.vn` (OPS) | **Đạt.** `init-secrets.sh` (staging) sinh mật khẩu ngẫu nhiên 12 byte. Chỉ root đọc được tệp mật khẩu; Caddy chỉ cầm bản băm bcrypt (`basic_auth`) kèm `X-Robots-Tag: noindex, nofollow`. Bản production chỉ có một dòng chú thích: không giới hạn, không noindex. OPS test: 401 khi chưa có mật khẩu, kèm noindex. |
| `Caddyfile.landing` | Không đổi từ lần SEC đạt ở `s1-SEC-on-v1-prod.md` 4.3: đủ header, chặn đường thăm dò, log che IP, chỉ nhận header PROXY từ edge. |

## 2. Kiểm đã chạy

Worktree tạm ở `794e6f1`, cài phụ thuộc offline. Worktree đã xóa.
- `LANDING_INDEXABLE=true pnpm build` → `check:dist` (chế độ indexable): **11/11 ok**.
- `pnpm build` (mặc định) → `check:dist`: đạt.
- `pnpm test` (gồm build `booking-preview`): **162/162**.
- Quét `dist`:
  - thẻ `<script>`, `<style>`, thuộc tính `style`, URL ngoài, địa chỉ email, `<form>`;
  - `rel` của liên kết `_blank`;
  - nội dung JSON-LD (tên cơ sở, SĐT và email chung, địa chỉ cơ sở, giờ nhận/trả phòng: không có dữ liệu cá nhân);
  - metadata ảnh.

## 3. Suggestion

### S-1 (OPS / FE)
`robots.txt` của bản indexable có `Disallow: /v1/`, tức là công khai cho mọi người biết có đường dẫn `/v1/` trên `ottimo.vn`. Đường này đã trả 404 ở `Caddyfile.landing`, nên dòng `Disallow` không bảo vệ gì thêm mà chỉ làm lộ cấu trúc. Nên bỏ dòng này. Mức thấp, làm ở lần phát hành landing kế tiếp.

### S-2 (PO / DOM)
Khi tài khoản nhận cọc VietQR chốt xong (R3-Q51, màn OWN), điền `paymentReceivingAccountHolder` để câu FAQ nêu đúng tên chủ tài khoản (SEC UXD-06: chống giả danh nhận cọc). Câu chung hiện tại vẫn an toàn, nhưng kém tác dụng chống lừa đảo hơn câu có tên.

## 4. Điểm làm tốt
1. `check:dist` biến các quy tắc bảo mật (không mã inline, không bên thứ ba, không form, robots theo chế độ build) thành cổng tự động, nên bản build sai không thể phát hành.
2. Ảnh đã được bỏ metadata ngay từ nguồn trong repo công khai, không chỉ ở bản build.
3. Hộp xem ảnh dùng `<dialog>` gốc, không cần thư viện ngoài, và không có đường chèn HTML nào.
