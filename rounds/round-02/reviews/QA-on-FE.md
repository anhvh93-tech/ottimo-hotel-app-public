# QA review FE – Round 2, Sprint 1 (bước Kiểm thử)

- Người review: QA | Ngày: 16/10/2026 | Đối tượng: `product/apps/admin-web`, `product/packages/{ui,i18n,api-client}` tại commit `d7d42e4` (H01–H07) và `outputs/FE/s1-report.md`
- Cách review: build `vite build` (chế độ production = API thật, không MSW) phục vụ bằng Caddy trên stack dùng một lần `ottimo-qa-r2s1` (`127.0.0.1:18081` → api `:13000`, DS-E); chạy tay bộ smoke UI (TC-NT-001/002/006/010) + luồng H05/H06 qua trình duyệt; chạy `vitest` của admin-web; build ảnh `Dockerfile.web`. Playwright UI tự động chưa chạy được (máy chưa có trình duyệt Playwright).
- Lỗi: `qa/bug-list.md` BUG-R2-006, 009, 010.

### FB-R2-QA-FE-01
- Mức độ: Blocker
- Vị trí: `packages/ui/src/styles/index.css` dòng `@import '../../../../design/wireframes/assets/tokens.css'` ↔ `product/.dockerignore` (loại `design`) ↔ `infra/docker/Dockerfile.web`
- Vấn đề: `docker build -f infra/docker/Dockerfile.web .` hỏng: `[vite:css] [postcss] ENOENT … design/wireframes/assets/tokens.css` (BUG-R2-006). Báo cáo FE ghi `pnpm build` xanh – đúng trên máy, nhưng ảnh web (job CI `docker-build`, deploy staging) không build được.
- Vì sao quan trọng: chặn mục "đủ dùng" Sprint 1 (staging + deploy tự động, đăng nhập 8 vai trên staging) và QC B1/B5. QA phải tự build ngoài Docker để kiểm UI.
- Đề xuất sửa: để `tokens.css` nằm trong gói (`pnpm --filter @ottimo/ui sync` chép từ `design/` như icon, file sinh có commit) và import nội bộ; hoặc phối hợp OPS mở `design/wireframes/assets/` trong `.dockerignore`. Thêm bước `docker build -f infra/docker/Dockerfile.web` vào checklist trước khi báo xong.
- Trạng thái: Open

### FB-R2-QA-FE-02
- Mức độ: Major
- Vị trí: `apps/admin-web/src/__tests__/auth.test.tsx` – 2 ca "deep link while signed out…", "logout from the user menu…"
- Vấn đề: `npx vitest run` → **2 failed / 62 passed (64)**: `Unable to find a label with the text of: /Số điện thoại hoặc email/`; màn thật và `strings-vi.json` (`auth.login.username`) là "Tên đăng nhập" (BUG-R2-009). Báo cáo FE ghi 64 xanh.
- Vì sao quan trọng: `pnpm test` toàn repo đỏ → CI đỏ (QC B1); ca đỏ thường trực làm đội quen bỏ qua đỏ.
- Đề xuất sửa: test lấy nhãn qua i18n (`t('auth.login.username')`) thay vì chữ cứng; chạy lại toàn bộ `vitest` sau khi UXD đổi chuỗi.
- Trạng thái: Open

### FB-R2-QA-FE-03
- Mức độ: Major
- Vị trí: `apps/admin-web/src/mocks/handlers.ts` (`/guests/lookup` ~dòng 465, `POST /guests` 409 ~dòng 484), `pages/GuestFormDialog.tsx:217, 292`
- Vấn đề: mock MSW khác API thật ở đúng chỗ nhạy cảm: (a) SAL/CTV tra khách người khác → mock trả `matches: [{ id: <id thật>, code: '', displayName: '' }]` – **lộ id**, trái OpenAPI (`exists_only_or_own`: không trả mã/tên/id) – API thật trả `{"matches": []}` (+ `match` khi BUG-R2-008 sửa); (b) mock `409 DUPLICATE_GUEST` luôn kèm `existingGuestId/Code` kể cả với SAL/CTV, API thật không kèm; (c) mock không xoay cookie khi đổi mật khẩu, không có `version` tăng. Dialog dựa vào `matches` có phần tử để hiện "có thể trùng" → với API thật, SAL/CTV **không bao giờ** thấy cảnh báo này trước khi Lưu. 12 test guests xanh nhưng đang kiểm hình dạng sai.
- Vì sao quan trọng: test FE xanh không chứng minh được hành vi thật (testability); dạng mock lộ id dễ bị "sửa cho khớp" sang server (rủi ro SEC-ARC-14).
- Đề xuất sửa: mock theo hợp đồng: `{ matches: [], match: 'possible_duplicate' }` cho người ngoài phạm vi, 409 không có id với SAL/CTV, đổi mật khẩu cấp cookie mới; dialog hiện `field_error.possible_duplicate_other` khi `match === 'possible_duplicate'`; thêm 1 test hợp đồng (so ví dụ OpenAPI với phản hồi mock).
- Trạng thái: Open

### FB-R2-QA-FE-04
- Mức độ: Minor
- Vị trí: `apps/admin-web/src/app/routes.tsx` `Screen` (dùng `canOpen` = chỉ `screens`) ↔ `session/nav.ts` `isVisible` (thêm `item.roles`)
- Vấn đề: chạy với API thật, `qa.mgr` mở thẳng `/settings/users` thấy trang "Người dùng & vai" + "Chưa tải được danh sách người dùng · … Nếu cần, nhờ quản lý. · Thử lại" (BUG-R2-010). Menu ẩn đúng nhưng route guard không dùng cùng luật với menu; server trả S26 cho MGR (rbac 20a: ◐ đổi mật khẩu của mình).
- Vì sao quan trọng: TC-NT-010 (E) mong trang "không có quyền"; nút "Thử lại" vô ích và câu "nhờ quản lý" nói với chính quản lý.
- Đề xuất sửa: `Screen` dùng `isVisible` (screens ∩ roles ∩ thiết bị) hoặc tách quyền theo thao tác (A100 chỉ OWN) → `NoAccessPage`; thêm 1 ca vào `nav.test.tsx` với `screens` có S26 nhưng vai manager.
- Trạng thái: Open

### FB-R2-QA-FE-05
- Mức độ: Suggestion
- Vị trí: `apps/admin-web` – khả năng tự động hóa UI (E2E `product/tests/e2e/ui/`)
- Vấn đề: selector E2E đang dựa vào chữ tiếng Việt (nhãn, tiêu đề, mục menu); một lần UXD đổi chuỗi ("Số điện thoại hoặc email" → "Tên đăng nhập") đã làm đỏ test FE và phải sửa test QA. Mục menu không có định danh ổn định theo mã màn (S02, S26…).
- Vì sao quan trọng: smoke UI chạy ở mọi PR (S) – đỏ giả do đổi chữ sẽ làm chậm cả đội; bản EN (C2) cũng cần chạy cùng spec.
- Đề xuất sửa: thêm `data-screen="S26"` cho mục menu/tiêu đề trang và `name="username"`/`name="password"` cho ô đăng nhập (hiện chỉ có `autoComplete`) để E2E chọn theo mã, chữ chỉ dùng để kiểm nội dung.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Chạy với API thật ngay lần đầu: đăng nhập 8 vai, màn mặc định và menu theo vai **khớp 8/8** kỳ vọng TC-NT-006; deep link khi chưa đăng nhập về `/login` rồi quay lại đúng trang; không token trong `localStorage/sessionStorage`, cookie phiên không đọc được từ JS.
- H06 chạy thật tốt: tìm không dấu ("nguyen thu …" ra "Nguyễn Thử …"), chặn trùng ngay khi rời ô SĐT dạng `+84…` với link "Mở hồ sơ đã có" và khóa nút Lưu; H05 chỉ cho chọn 12/24/48 giờ (chặn được BUG-R2-007 ở phía giao diện) và hiện lịch sử thay đổi.
- H04 hiện giá đêm đúng BR-101 từ server (101 → 667.000, 202 → 792.000) và H07 hiện đúng trạng thái/đăng nhập gần nhất của DS-E.
