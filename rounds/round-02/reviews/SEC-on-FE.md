# SEC review – FE (Round 2, Sprint 1) – `product/apps/admin-web` @ d7d42e4

- Người review: SEC | Ngày: 16/10/2026 | Phạm vi: lưu token/CSRF, xử lý 401/403/429, lưu trữ trình duyệt, log/console, bản build `dist/`, `packages/api-client/src/client.ts`
- Đối chiếu: `security-requirements.md` v0.2 (SR-SES-01/03/04/08, SR-PWA-03/04/07, SR-INP-04, SR-HDR-01), `threat-model.md` (TM-02, TM-05, TM-42, TM-44)
- Cách kiểm: đọc mã + grep `localStorage|sessionStorage|indexedDB|caches|console.|innerHTML|dangerouslySetInnerHTML|clipboard` trên `src/` (trừ `mocks/`, `__tests__/`) + xem `dist/`. Không chạy được test trên máy SEC (không có `pnpm`).

Tổng: **0 Blocker · 1 Major · 2 Minor · 1 Suggestion**

---

### FB-R2-SEC-FE-01
- Mức độ: Major
- Vị trí: `src/pages/GuestFormDialog.tsx` dòng 117–150 (bản nháp `ottimo.draft.guest.<userId>` ghi `JSON.stringify(form)` vào `sessionStorage` mỗi lần gõ); `src/session/SessionProvider.tsx` dòng 113–122 (`logout` chỉ xóa `ottimo.activePropertyId`); chú thích `src/app/storage.ts` dòng 1 ("form drafts")
- Vấn đề: Bản nháp form tạo khách chứa **dữ liệu C2** (họ tên, SĐT, email, Zalo/WhatsApp, ngày sinh, mã số thuế, `freeNote`) được ghi rõ vào `sessionStorage`, **không bị xóa khi đăng xuất/"Đổi ca"** hay khi phiên hết hạn (cố ý "survives an expired session"). Trên máy quầy dùng chung, tab mở xuyên ca → người ca sau hoặc tiện ích/mã độc trình duyệt đọc được bằng DevTools/`sessionStorage`; bất kỳ XSS nào trên origin admin cũng đọc được.
- Vì sao quan trọng: SR-PWA-07 (B, R2) cấm dùng `localStorage`/`sessionStorage` cho dữ liệu C2/C3; SR-PWA-04 (B) yêu cầu đăng xuất/hết phiên/đổi người dùng xóa dữ liệu phía trình duyệt (TM-42, TM-02).
- Đề xuất sửa: Giữ bản nháp **trong bộ nhớ** (state/context ở `SessionProvider`, sống qua lần đăng nhập lại do hết phiên **của cùng người dùng** trong cùng tab) thay vì Web Storage; nếu UXD bắt buộc giữ qua tải lại trang thì chỉ lưu các trường **không phải C2** (`preferredLocale`, `preferredContact`, `gender` rỗng…) – không lưu tên/SĐT/email/ngày sinh/ghi chú. Đồng thời `logout()` và nhánh `UNAUTHENTICATED` của người dùng **khác** gọi `clearClientData()` xóa mọi khóa `ottimo.*` trong `sessionStorage` (giữ theme/ngôn ngữ ở `localStorage`). Sửa chú thích `storage.ts`. Test: điền form → đăng xuất → `sessionStorage` không còn khóa `ottimo.draft.*`; grep CI chặn `writeSession(` với dữ liệu form.
- Trạng thái: Open

### FB-R2-SEC-FE-02
- Mức độ: Minor
- Vị trí: `vite.config.ts` (`build: { sourcemap: true }`); `dist/assets/index-*.js` có `//# sourceMappingURL=index-*.js.map`, tệp `.map` nằm trong `dist/`
- Vấn đề: Bản build production phát hành kèm source map công khai → lộ toàn bộ mã nguồn TypeScript, chú thích nội bộ, tên endpoint test/mock cho bất kỳ ai mở origin admin.
- Vì sao quan trọng: Không phải lỗ hổng trực tiếp nhưng giảm chi phí trinh sát (TM-05) và lộ thông tin cấu hình; SR-SECR-02 tinh thần "image/bản phát hành không chứa thứ không cần".
- Đề xuất sửa: `sourcemap: mode === 'production' ? 'hidden' : true` (hoặc `false`), không copy `.map` vào image/Caddy; nếu cần map để đọc lỗi thì lưu ngoài web root. OPS thêm bước CI kiểm `dist/` không có `sourceMappingURL`.
- Trạng thái: Open

### FB-R2-SEC-FE-03
- Mức độ: Minor
- Vị trí: `src/app/storage.ts` dòng 1–2 (chú thích chính sách) + toàn app: không có hàm xóa dữ liệu phía trình duyệt tập trung
- Vấn đề: SR-PWA-04 yêu cầu một điểm xóa duy nhất khi đăng xuất/hết phiên/đổi người dùng (Web Storage, Cache Storage, bộ nhớ dữ liệu màn hình). Hiện mỗi màn tự giữ dữ liệu trong `useResource` (an toàn vì unmount khi về `/login`), nhưng không có `clearClientData()`; khi thêm TanStack Query/màn C3 (Sprint 3: xem ảnh, `portal-data` có sao chép clipboard) sẽ dễ sót. Chú thích `storage.ts` đang cho phép "form drafts" – trái SR-PWA-07.
- Vì sao quan trọng: Chuẩn bị cho màn C3 Sprint 3 (SR-C3-11 xóa clipboard khi rời màn/đăng xuất).
- Đề xuất sửa: Thêm `clearClientData()` gọi ở `logout`, nhánh 401 và khi `me.id` đổi: xóa `ottimo.*` trong `sessionStorage`, `caches` (nếu có), cache truy vấn, ghi đè clipboard bằng chuỗi rỗng nếu màn C3 đã sao chép. Sửa chú thích `storage.ts`: "chỉ cờ giao diện (cơ sở đang chọn, theme, ngôn ngữ)".
- Trạng thái: Open

### FB-R2-SEC-FE-04
- Mức độ: Suggestion
- Vị trí: `public/mockServiceWorker.js` → `dist/mockServiceWorker.js`
- Vấn đề: Worker MSW (chỉ dùng dev) được copy vào bản build production. Không được đăng ký ở production (`main.ts` chỉ import khi `DEV && mock`) nên rủi ro thấp, nhưng là một script service worker nằm cùng origin admin – nếu một lỗi sau này đăng ký nó, toàn bộ `/v1` bị mock.
- Đề xuất sửa: Chuyển worker ra khỏi `public/` (đặt ở thư mục chỉ dev, `msw init` vào đường dẫn dev) hoặc plugin Vite xóa khỏi `dist/` khi build production; CSP `worker-src 'none'` cho admin-web (OPS, SR-HDR-01) vì R2 admin-web không dùng service worker (SR-PWA-03).
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)
1. CSRF token chỉ trong biến module (`app/api.ts`), lấy từ `Me.csrfToken`, gửi `X-CSRF-Token` cho mọi method ghi; `credentials: 'same-origin'`; không có token/mật khẩu nào trong `localStorage`/`sessionStorage`/IndexedDB; không có `console.*`, `innerHTML`, `dangerouslySetInnerHTML` ngoài thư mục mock/test.
2. Xử lý lỗi toàn cục đúng SR-SES-03/SR-AUTH-04: 401 `UNAUTHENTICATED` đưa về đăng nhập và xóa `me`; `PASSWORD_CHANGE_REQUIRED` buộc đổi mật khẩu; một câu lỗi chung cho sai tên/mật khẩu/khóa; 429 dùng `Retry-After`; `DEVICE_NOT_TRUSTED`/màn ngoài `screens` có trang riêng, server vẫn là nơi kiểm.
3. Ô mật khẩu có `autoComplete="current-password"`, nút "hiện mật khẩu" chủ động; MSW chỉ nạp ở dev (import động bị loại khỏi bundle production – đã kiểm `dist` không chứa `msw`).
