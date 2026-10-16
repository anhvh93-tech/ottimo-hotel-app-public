# FE – Round 2 · Sprint 1 – Báo cáo

- Vai: FE | Ngày: 16/10/2026 | Phạm vi: admin-web theo hi-fi H01–H07 + DS v0.3, đặc tả EP00 (US-001…007 phần UI, 135, 142, 071–073)
- Kết quả lệnh toàn repo (product/): `pnpm format:check` ✔ · `pnpm lint` ✔ (0 lỗi; 1 cảnh báo ở file sinh `mockServiceWorker.js`) · `pnpm test` ✔ · `pnpm build` ✔
- Test FE mới: admin-web 64 · ui 7 · i18n 4 · api-client 5 (= 80 test, đều xanh). Hợp đồng: openapi 0.3.3-draft (kiểu đã sinh lại).

## 1. Đã làm gì

| Màn | Trạng thái | Nội dung chính | Test |
|---|---|---|---|
| H01 Đăng nhập | Xong | Câu lỗi chung (SR-AUTH-04), 429 + khóa nút theo `Retry-After`, `MFA_REQUIRED` (chỗ cho TOTP R3), `PASSWORD_CHANGE_REQUIRED`, `DEVICE_NOT_TRUSTED`, 5xx → `error.server` + requestId, mất mạng, phiên hết hạn → quay lại đúng trang | auth.test (11) |
| H01 Đổi mật khẩu tạm | Xong | Quy tắc tích dần, kiểm "nhập lại" khi rời ô, 401 → lỗi tại ô mật khẩu hiện tại; dùng cả từ menu người dùng | auth.test |
| H01 Chọn cơ sở | Xong | Tự bỏ qua khi 1 cơ sở; rỗng → "chưa gán cơ sở" + Đăng xuất | (chưa có test riêng) |
| H02 Khung + menu 8 vai | Xong | Menu từ `screens`, màn mặc định theo vai (OWN/MGR Tổng quan, FDL/FD Hôm nay, SAL/CTV Báo giá, HK Buồng phòng, MT Bảo trì), chip thiết bị, menu người dùng (đổi MK, VI/EN, sáng/tối, đăng xuất), skip link, phím R | nav.test (19) – cùng kỳ vọng với smoke QA TC-NT-006 |
| H02 Không có quyền / máy chưa cấp | Xong | Route ngoài `screens` → trang "không có quyền"; C3 khi chưa cấp máy → `device.blocked_*` | nav.test |
| H03 Hôm nay | Khung | Trạng thái rỗng đúng thiết kế; dữ liệu ở sprint sau | nav.test |
| H04 Danh mục căn | Xong | Bảng 10 căn, drawer sửa: stepper định mức/tối đa (tối đa ∈ {định mức, +1}), `CAPACITY_BELOW_BOOKINGS` liệt kê đơn, `MAX_OCCUPANCY_RANGE`, giá tháng → giá đêm tự tính, ngày hiệu lực + lý do, ngừng bán, 412, hỏi bỏ thay đổi; FD/SAL chỉ xem | rooms.test (8) |
| H05 Tham số | Xong | Tab theo nhóm (APG), sửa theo `editableBy`, seg cho hạn giữ chỗ, biên bảo mật kiểm trước, `PARAM_OUT_OF_RANGE` (min–max / allowed), lịch sử, MGR thấy "Chỉ xem – chủ đầu tư sửa", FDL chỉ xem | params.test (7) |
| H06 Khách hàng | Xong | Tìm không dấu (≥2 ký tự, 300 ms), SĐT/email → POST lookup (không vào URL), form theo vai (x-visible-to), chặn trùng khi rời ô + 409 `DUPLICATE_GUEST`, SAL/CTV "có thể trùng" không lộ tên, V-01…V-04, nháp tự lưu, không có ô giấy tờ | guests.test (12) |
| H06 Bộ chọn khách dùng chung | Xong (chưa gắn vào màn nào – dùng từ Sprint 2) | Combobox APG, tối đa 5, dòng "Tạo nhanh khách" | guests.test |
| H07 Người dùng & vai | Xong | Sửa vai (không có vai owner), hộp xác nhận hậu quả, đặt lại MK (MK tạm hiện 1 lần), khóa/mở | users.test (4) |
| H07 Thiết bị được cấp | Xong | Cấp máy này (checklist khóa nút + đếm mục còn thiếu, nhập lại MK), danh sách + trạng thái, thu hồi có xác nhận | users.test (2) |

Hạ tầng: react-router 6; phiên cookie HttpOnly, CSRF trong bộ nhớ (không token trong Web Storage – có test); lỗi problem+json chung (`error.<CODE>`, không hiện `detail`, requestId cho 5xx); i18n VI/EN; sáng/tối/theo máy; trạng thái tải (skeleton > 300 ms)/rỗng/lỗi + Thử lại/mất mạng (thanh chỉ xem, khóa nút ghi); a11y: nhãn–lỗi–gợi ý gắn `aria-describedby`, focus vào ô lỗi đầu, modal bẫy focus + Esc + trả focus, hộp xác nhận `alertdialog` focus nút an toàn, vùng chạm ≥ 32 px (mật độ Desk từ hifi.css).
MSW mock theo ví dụ OpenAPI (`VITE_API_MODE=mock` mặc định khi dev; `pnpm dev:server` dùng api thật). Mock không vào bản build.

## 2. File tạo/sửa
- `product/apps/admin-web/**` (src/app, session, pages, components, hooks, mocks, test, __tests__; package.json, vite.config.ts, tsconfig.json, README.md, public/mockServiceWorker.js)
- `product/packages/api-client/**` (mới), `product/packages/i18n/**` (mới), `product/packages/ui/**` (mới)
- `product/pnpm-lock.yaml`; `01-decisions/decision-log.md` (3 dòng FE)

## 3. Giả định
- Mật khẩu/tài khoản mock = DS-E `qa.*`, mật khẩu thử trong `mocks/seed.ts` (chỉ mock).
- Menu: `screens` ∩ thẻ vai H02 2.2 (Tổng quan chỉ OWN/MGR; SAL/CTV không có Sơ đồ phòng; Người dùng/Thiết bị chỉ OWN); MGR không có S26 (rbac 20a).
- FD/SAL xem Danh mục căn dạng tra cứu (rbac 25a) dù hi-fi ghi "FDL/FD không có màn này".
- Danh mục tag/lưu ý phục vụ khách theo khóa UXD hiện có (chờ DOM E00-06). "WhatsApp / KakaoTalk" ghi vào `messagingHandles.whatsapp`.
- 71 chuỗi FE cần nhưng chưa có trong `design/copy` để ở `packages/i18n/src/pending.{vi,en}.json` (câu VI lấy từ đặc tả BA); test báo khi UXD thêm khóa trùng.
- Font Lora/Be Vietnam Pro chưa tự host (hifi.css dùng `local()`), rơi về system-ui.

## 4. Việc cần vai khác
| Gửi | Nội dung |
|---|---|
| BE | `getMe.screens` của manager không được chứa S26 ở R2 (◐ chỉ là đổi MK của mình) – nếu có, menu vẫn ẩn nhưng route mở được tới khi API 403 |
| BE/ARC | 401 của `changeMyPassword` khi sai mật khẩu hiện tại nên có mã riêng (vd `REAUTH_FAILED`/`CURRENT_PASSWORD_WRONG`) để khỏi nhầm với phiên hết hạn; FE đang xử lý tại form |
| ARC | `Room` thiếu "bố trí giường" (cột hi-fi H04); `GuestSummary` thiếu "lưu trú gần nhất" và cờ nghi trùng (cột/chip H06) – FE ẩn cột |
| ARC | `lookupGuestByContact` với SAL/CTV (`exists_only_or_own`): FE hiểu là `matches` có phần tử rỗng tên – cần mô tả hình dạng phản hồi |
| UXD | Chuyển 71 khóa pending vào strings-vi/en; `auth.login.username` vẫn là "Số điện thoại hoặc email" trong khi hợp đồng là `username`; `error.REAUTH_FAILED` còn nói "PIN"; thêm chuỗi đơn vị (ngày/phút/tuổi), nhóm "Bảo mật"/"Khác" của tham số |
| QA | Smoke TC-NT-010 dùng regex `/không làm được thao tác này|Không có quyền/` (phân biệt hoa thường) – màn hiện "Bạn **không** có quyền mở trang này" → đề nghị thêm cờ `i`. Đường dẫn cấu hình đã theo smoke (`/settings/parameters`, `/settings/users`) |
| PO | Nút "Thêm người dùng" (createUser, US-008 Should R3) chưa làm ở S1 |

## 5. Rủi ro / chưa xong
- Chưa chạy E2E Playwright với api thật (chờ BE endpoints auth/platform); đã chạy được toàn bộ với mock.
- Chưa kiểm tương phản/zoom 200% bằng công cụ trên trình duyệt thật; dựa vào token DS đã đo.
- Bundle 455 KB (gzip 143 KB) do nạp cả chuỗi VI+EN – tách theo locale ở R3 nếu cần.
