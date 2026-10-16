# UXD review FE – Round 2, Sprint 1 (admin-web H01–H07)

- Người review: UXD | Tác giả: FE | Ngày: 16/10/2026 | Review bắt buộc UXD → FE
- Phạm vi: `product/apps/admin-web/src/**`, `product/packages/ui/**`, `product/packages/i18n/**` so với hi-fi H01–H07 (`product/design/hifi/01…07`), Design System v0.3.2, `content-guide.md`.
- Cách kiểm: đọc mã toàn bộ trang/thành phần; chạy `pnpm --filter @ottimo/admin-web dev` (mock MSW) và mở trong Browser pane của Claude Desktop – **service worker MSW không đăng ký được trong pane** (console: `[MSW] Failed to register the Service Worker … An unknown error occurred when fetching the script`; `curl /mockServiceWorker.js` vẫn 200) nên trang trắng, không xem được trực quan. Máy không có Chrome/Playwright browser. Vì vậy **chưa đo** tương phản thực tế, zoom 200%, VoiceOver – dựa vào token đã đo (`gen_tokens.py` fails: 0) và class lấy nguyên từ `hifi.css`. Chạy `pnpm --filter @ottimo/admin-web test` sau khi UXD đổi chuỗi: 62/64 xanh, 2 đỏ do nhãn đăng nhập đổi (thẻ 01).
- Tổng: **0 Blocker · 4 Major · 9 Minor · 3 Suggestion**.

### FB-R2-UXD-FE-01
- Mức độ: Major
- Vị trí: `product/packages/i18n/src/pending.{vi,en}.json`; `product/apps/admin-web/src/__tests__/auth.test.tsx` dòng 9
- Vấn đề: UXD đã chuyển đủ 71 khóa pending vào nguồn chuẩn (`design/tools/gen_strings.py` → `design/copy/strings-*.json`, nhóm "R2 Sprint 1 – admin-web EP00"), có chỉnh câu chữ (xem dưới). Từ giờ `packages/i18n` test `pending keys … are not yet in the UXD files` **đỏ** (71 khóa trùng) cho tới khi FE xóa pending. Đồng thời `auth.login.username` đổi thành "Tên đăng nhập / Username" nên 2 test `auth.test.tsx` (deep link AC2, logout) đỏ vì `usernameField` còn regex `/Số điện thoại hoặc email/` (`test/render.tsx` đã chấp nhận cả 2 nhãn – chỉ `auth.test.tsx` sót).
- Vì sao quan trọng: CI đỏ chặn mọi PR; chuỗi tồn ở 2 nơi sẽ lệch nhau.
- Đề xuất sửa: (1) Xóa `pending.vi.json`, `pending.en.json` và nhánh pending trong `translate.ts` (`DICTS`, `pendingKeys`, test tương ứng) – hoặc để file rỗng `{ "_meta": … }` nếu muốn giữ cơ chế cho sprint sau. (2) `auth.test.tsx:9` đổi thành `/Tên đăng nhập/` (nhãn mới). Đã kiểm: mọi khóa literal admin-web đang dùng (272) đều có trong `strings-vi/en.json` khi bỏ pending. Thay đổi chữ FE nên biết: `auth.current_password` = "Mật khẩu hiện tại" (bỏ "(mật khẩu tạm)" vì dùng cả ở menu); `field_error.duplicate` = "{value} đã có trong danh sách."; EN của `field_error.email_invalid`, `field_error.current_password_wrong`, `device.error_title`, `users.temp_pw_once`, `shell.coming_body` viết lại theo giọng văn; `error.REAUTH_FAILED` bỏ `{left}` (API không trả số lần, SR-AUTH-04); `error.REAUTH_REQUIRED` và `device.grant_confirm` bỏ "PIN"/"mã xác thực" (R2 chỉ mật khẩu).
- Trạng thái: Open

### FB-R2-UXD-FE-02
- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/TodayPage.tsx`; hi-fi H03 `03-today.html`
- Vấn đề: Màn Hôm nay (màn mặc định của FDL/FD) luôn hiện trạng thái rỗng thật "Hôm nay không có việc theo giờ – Không có khách đến/đi, khai báo hay giữ chỗ cần xử lý" dù chưa gọi API nào (dữ liệu ở Sprint 3/4). Đây là câu khẳng định sai sự thật, không phải trạng thái "đang làm".
- Vì sao quan trọng: Trên staging/demo, lễ tân hoặc chủ đầu tư sẽ hiểu là hôm nay không có khách đến/đi – dễ bỏ sót khách, mất niềm tin vào số liệu (UXR test kịch bản lễ tân R2 sẽ ghi nhận sai).
- Đề xuất sửa: Tới khi có `getArrivalsDepartures`/`listAttentionItems`, dùng trạng thái `ComingSoonPage` (`shell.coming_title` / `shell.coming_body` với `{screen}` = `today.title`) giữ nguyên nút "Mở sơ đồ phòng" nếu vai có quyền. Chỉ dùng `today.empty_*` khi API trả rỗng thật.
- Trạng thái: Open

### FB-R2-UXD-FE-03
- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/paramCatalog.ts` (`KNOWN`, `paramLabel`); màn H05 Tham số
- Vấn đề: Chỉ 7 khóa có nhãn; ~24 khóa còn lại (`checkin_time`, `checkout_time`, `late_grace_until`, `no_show_*`, `foc_*`, `vat_rate`, `trusted_device_days`, `c3_stepup_minutes`, `guest_verify_*`, `channel_commission_pct.*`…) hiện **tên khóa kỹ thuật** làm nhãn cho chủ đầu tư/quản lý. Một phần lỗi do hi-fi H05 chỉ vẽ mẫu vài dòng – UXD đã bổ sung chuỗi.
- Vì sao quan trọng: Chủ đầu tư sửa tham số tiền, giờ nhận/trả, bảo mật mà không đọc được tên – dễ sửa nhầm khóa (ảnh hưởng tiền và bảo mật).
- Đề xuất sửa: UXD đã thêm 24 chuỗi `params.k.<khóa>` (dấu `.` trong khóa đổi thành `_`, vd `params.k.foc_self_apply_front_desk_per_time`) và `params.k.channel_commission_pct` có tham số `{channel}` cho mọi khóa `channel_commission_pct.<kênh>`. FE: `paramLabel` tra `meta.label ?? 'params.k.' + key.replace(/\./g,'_')`, dùng khóa kỹ thuật chỉ khi không có chuỗi; giữ dòng `<code>` khóa phụ dưới nhãn như hi-fi. Desk viết "miễn phí (FOC)" theo thuật ngữ mục 3.
- Trạng thái: Open

### FB-R2-UXD-FE-04
- Mức độ: Major
- Vị trí: `apps/admin-web/src/app/problem.ts` `problemView` (nhánh `isNetwork` và nhánh không phải ApiError); `components/states.tsx` `ErrorBlock`
- Vấn đề: Lỗi mạng trả `common.error_generic_body` với `request_id: '—'` → người dùng đọc "…nếu vẫn lỗi, báo quản lý mã tham chiếu —." Lỗi không phải ApiError cũng ra `error.server` với "—". Đây là trạng thái lỗi xuất hiện thường nhất (Wi-Fi quầy chập chờn) trên mọi danh sách (ErrorBlock dùng ở H04–H07).
- Vì sao quan trọng: Câu lỗi vô nghĩa ở trạng thái bắt buộc (DoD: tải/rỗng/lỗi/mất mạng), nhân viên báo "mã —" cho quản lý.
- Đề xuất sửa: Lỗi mạng → chuỗi mới `common.error_network_body` ("Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Thử lại. Dữ liệu của bạn không bị mất."). Khi không có `requestId` thật thì không dùng chuỗi có `{request_id}`. Khi có, có thể truyền `view.reference` vào `StateView.reference` để mã hiện ở ô riêng (C29) thay vì nằm giữa câu.
- Trạng thái: Open

### FB-R2-UXD-FE-05
- Mức độ: Minor
- Vị trí: `pages/LoginPage.tsx` nhánh `RATE_LIMITED`; hi-fi H01 biến thể 429
- Vấn đề: Nút Đăng nhập bị khóa nhưng không hiện đếm ngược; câu `error.RATE_LIMITED` giữ số phút lúc nhận lỗi, không giảm. Hi-fi ghi "Nút Đăng nhập khóa và hiện đếm ngược".
- Vì sao quan trọng: Người dùng không biết khi nào thử lại được, bấm liên tục vào nút khóa.
- Đề xuất sửa: Tính `minutes` từ `lockedUntil - Date.now()` mỗi lần `tick` (đã có interval) để câu giảm dần; mở khóa xong thì ẩn banner.
- Trạng thái: Open

### FB-R2-UXD-FE-06
- Mức độ: Minor
- Vị trí: `pages/LoginPage.tsx` nút hiện mật khẩu
- Vấn đề: Chữ trên nút luôn là "Hiện" kể cả khi mật khẩu đang hiện (chỉ đổi `aria-pressed`).
- Vì sao quan trọng: Người nhìn không biết trạng thái; mật khẩu có thể để hiện trên máy quầy.
- Đề xuất sửa: Dùng chuỗi mới `login.hide_password` ("Ẩn" / "Hide") khi `showPw`.
- Trạng thái: Open

### FB-R2-UXD-FE-07
- Mức độ: Minor
- Vị trí: `pages/RoomDrawer.tsx` dòng 293, 306; `pages/ParamDialog.tsx` dòng 21 (`'đ'`)
- Vấn đề: Hậu tố tiền "đ" viết cứng, giao diện EN vẫn hiện "đ" (content-guide mục 4: EN dùng "VND").
- Vì sao quan trọng: Sai quy ước định dạng khi đổi ngôn ngữ.
- Đề xuất sửa: Dùng chuỗi mới `common.vnd_unit` ("đ" / "VND").
- Trạng thái: Open

### FB-R2-UXD-FE-08
- Mức độ: Minor
- Vị trí: `components/AppShell.tsx` `<nav className="side" aria-label={t('nav.sec.ops')}>`
- Vấn đề: Toàn bộ menu trái được đọc là "Vận hành" (tên một nhóm con), trong khi trong menu còn nhóm Điều hành, Khách & bán, Quản trị.
- Vì sao quan trọng: Người dùng trình đọc màn hình nhầm vùng điều hướng.
- Đề xuất sửa: `aria-label={t('shell.main_nav')}` (chuỗi mới "Menu chính" / "Main menu").
- Trạng thái: Open

### FB-R2-UXD-FE-09
- Mức độ: Minor
- Vị trí: `components/states.tsx` `LoadingBlock`
- Vấn đề: Khung xương chỉ có `aria-busy`, các ô `aria-hidden`; trình đọc màn hình không được báo đang tải. Trong 300 ms đầu (useDelayed) khu vực rỗng hoàn toàn – đúng thiết kế, nhưng sau đó vẫn không có chữ.
- Vì sao quan trọng: WCAG 4.1.3 (status message).
- Đề xuất sửa: Thêm `<span className="sr-only" role="status">{t('common.loading')}</span>` trong khối xương.
- Trạng thái: Open

### FB-R2-UXD-FE-10
- Mức độ: Minor
- Vị trí: `packages/ui/src/styles/index.css` (nạp `hifi.css` dùng `local()` cho Lora / Be Vietnam Pro); FE report mục 3
- Vấn đề: Font của DS chưa tự host nên máy quầy không cài font sẽ rơi về system-ui – tiêu đề không còn Lora, chữ Việt dùng font hệ thống; khác hi-fi.
- Vì sao quan trọng: Nhận diện "boutique" của DS mất ở bản thật; độ cao chữ khác làm lệch bảng/khung đã đo.
- Đề xuất sửa: Hai font là OFL (miễn phí, không cần ESC). Tự host bản subset latin + vietnamese (vd gói `@fontsource/lora`, `@fontsource/be-vietnam-pro` – ARC duyệt phụ thuộc) với `font-display: swap`; chỉ nạp các độ đậm DS dùng (400/500/600).
- Trạng thái: Open

### FB-R2-UXD-FE-11
- Mức độ: Minor
- Vị trí: `pages/ChangePasswordPage.tsx`
- Vấn đề: Là form ghi duy nhất không dùng `useOnline` – khi mất mạng nút Lưu vẫn bấm được (các form khác đều khóa nút ghi theo thanh "chỉ xem").
- Vì sao quan trọng: Không nhất quán với quy ước mất mạng của Desk; người dùng nhận lỗi muộn.
- Đề xuất sửa: Khóa nút Lưu khi `!online`; trên trang đổi MK tạm (ngoài khung app, không có Topbar) hiện `Alert` `login.offline` như màn đăng nhập.
- Trạng thái: Open

### FB-R2-UXD-FE-12
- Mức độ: Minor
- Vị trí: `pages/GuestsPage.tsx` `openError`
- Vấn đề: Lỗi mở hồ sơ khách hiện `StateView` lỗi phía trên kết quả, không có nút Thử lại/Đóng và không tự mất khi tìm lại; có thể hiện cùng lúc với trạng thái rỗng/kết quả.
- Vì sao quan trọng: Hai trạng thái chồng nhau, không có hành động tiếp (C29 yêu cầu 1 câu + 1 hành động).
- Đề xuất sửa: Dùng `Alert tone="bad"` có nút Thử lại (mở lại hồ sơ) và xóa `openError` khi `q` đổi.
- Trạng thái: Open

### FB-R2-UXD-FE-13
- Mức độ: Minor
- Vị trí: `pages/RoomsPage.tsx` `<tr aria-selected=…>`
- Vấn đề: `aria-selected` không hợp lệ trên hàng của `table` thường (chỉ dùng trong grid/treegrid) – axe báo lỗi.
- Vì sao quan trọng: E2E có axe-core (plan R2 mục 6) sẽ đỏ.
- Đề xuất sửa: Dùng class (vd `is-editing`) để tô hàng đang sửa; trạng thái đã có nhờ drawer có tiêu đề căn.
- Trạng thái: Open

### FB-R2-UXD-FE-14
- Mức độ: Suggestion
- Vị trí: `apps/admin-web/src/main.tsx` → `startMockWorker()`
- Vấn đề: Nếu MSW không đăng ký được (gặp thật trong Browser pane của Claude Desktop) thì `start()` ném lỗi và trang trắng, không có chữ nào.
- Vì sao quan trọng: Ai chạy demo mock (PO, UXR, chủ đầu tư) chỉ thấy màn trắng.
- Đề xuất sửa: Bọc `try/catch`, vẫn render App kèm thanh cảnh báo dev "Không chạy được API giả – mở bằng Chrome/Safari hoặc dùng `dev:server`" (chuỗi dev-only, không cần dịch).
- Trạng thái: Open

### FB-R2-UXD-FE-15
- Mức độ: Suggestion
- Vị trí: `pages/*.tsx`, `components/UserMenu.tsx` – ~30 `style={{…}}` nội tuyến (6, 10, 14, 18 px; `fontSize: '.75rem'`…)
- Vấn đề: Phần lớn chép từ trang demo hi-fi, một số giá trị lệch lưới 4 px; khó đồng bộ khi UXD đổi DS.
- Vì sao quan trọng: Nhất quán khoảng cách/kiểu chữ theo token.
- Đề xuất sửa: Gom các mẫu lặp (chú thích nhỏ `.75rem` muted, `fieldset` không viền, khoảng cách đầu trang) thành class trong `app.css`; UXD sẽ đưa các class này vào `hifi.css` ở DS v0.3.3 để hai bên dùng chung.
- Trạng thái: Open

### FB-R2-UXD-FE-16
- Mức độ: Suggestion
- Vị trí: `app/toast.tsx`
- Vấn đề: Toast tự ẩn sau 5 s, không dừng khi rê chuột/focus, không có nút đóng.
- Vì sao quan trọng: Người đọc chậm/trình đọc màn hình có thể lỡ xác nhận "Đã lưu" (chỉ là xác nhận nên không chặn).
- Đề xuất sửa: Dừng đếm khi hover/focus; cân nhắc 6–8 s cho câu dài (`params.saved` có ngày hiệu lực).
- Trạng thái: Open

## Ghi chú cho vai khác (không phải thẻ FE)
- Hi-fi H01 đã bỏ ô "Giữ đăng nhập trên máy này" (hợp đồng `login` không có trường này – FE làm đúng khi không đưa vào) và đổi ví dụ tên đăng nhập thành `hanh.fd`. H07, H17 sửa chữ theo chuỗi mới.
- FE đúng khi ẩn cột "bố trí giường" (H04), "lưu trú gần nhất"/chip nghi trùng (H06) do API thiếu trường – chờ ARC (đã có trong FE report mục 4).

## Điểm làm tốt nên giữ
1. Dùng thẳng `tokens.css` + `hifi.css` của UXD và đọc chuỗi trực tiếp từ `design/copy` – không có màu cứng nào trong mã (đã quét), đổi DS/chuỗi là app đổi theo; test tự kiểm mọi khóa `t('…')` có đủ VI/EN.
2. A11y nền tốt: `Field` gắn nhãn–lỗi–gợi ý bằng `aria-describedby`, focus vào ô lỗi đầu, modal bẫy focus + Esc + trả focus, hộp xác nhận `alertdialog` focus nút an toàn, hỏi "Bỏ thay đổi chưa lưu?", skip link, phím tắt R không bắt khi đang gõ.
3. Lỗi đăng nhập theo đúng SR-AUTH-04 (một câu chung cho 401/403), không hiện `detail` của server, khóa nút ghi khi mất mạng ở hầu hết form, skeleton chỉ hiện sau 300 ms.
