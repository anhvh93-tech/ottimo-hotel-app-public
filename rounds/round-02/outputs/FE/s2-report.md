# FE – Round 2 · Sprint 2 – Báo cáo (EP02: rack, đặt phòng, chi tiết đơn, sale)

- Vai: FE | Ngày: 16/10/2026 | Phạm vi: hi-fi H08–H12, đặc tả `specs/EP02-reservations.md` v0.1, OpenAPI 0.3.4-draft
- Vùng sửa: `product/apps/admin-web/**`, `product/packages/{ui,api-client}/**` (i18n không đổi – chỉ dùng chuỗi UXD hiện có)
- BE-A/BE-B đang code song song → FE chạy trên MSW mock theo spec (`pnpm dev`); cờ server thật: `pnpm --filter @ottimo/admin-web dev:server` (`VITE_API_MODE=server`, SSE bật ở chế độ này)

## 1. Màn / trạng thái

| Màn | Trạng thái | Nội dung chính | Test |
|---|---|---|---|
| H08 Sơ đồ phòng 14 ngày | Xong | Lưới ARIA `role=grid` (roving tabindex, ←/→ theo ô/thanh, ↑/↓ giữ đêm, Home/End, Enter/Space mở đơn hoặc đặt phòng; `T` hôm nay, `N` đặt phòng mới, `R` toàn cục); cột hôm nay theo `Rack.today` của server; làn đỏ "Chưa gán căn – xung đột OTA ({n})" luôn trên cùng (xếp nhiều làn nếu trùng ngày) + cảnh báo đỏ + nút Gán căn; 6 loại thanh + xung đột phân biệt bằng màu + icon + chữ + hoa văn, mỗi ô có `aria-label` đủ (căn, khách, trạng thái, ngày, kênh, mã đơn, "Nhập tay", "Vượt định mức n", "còn h giờ m phút"); nhãn **"Nhập tay"** (đơn dài hạn HĐ ngoài hệ thống), **icon sofa** khi vượt định mức, giữ chỗ < 2 giờ đổi viền + chữ đỏ; căn ngừng bán: chip "Ngừng bán", ô trống không bấm được; ô trống từ hôm nay → Đặt phòng mới điền sẵn căn + ngày; **bảng thay thế "Danh sách"** (`<table>` có caption, th scope) – cũng là bố cục điện thoại (< 768 px tự chuyển); lọc nhóm căn; lùi/tới 7 ngày; chú giải; trạng thái tải/lỗi + Thử lại/rỗng; mất mạng: ô trống khóa, nút đặt phòng khóa (BR-906). **Theo vai**: FD+ đầy đủ; HK/MT danh sách che tên (trạng thái buồng, có khách đến hôm nay/mai, "Chuẩn bị n bộ đồ dùng thêm", mở bán lại); SAL/CTV lưới căn trống trong màn H12 (đơn người khác "Đã kín", đơn của mình có tên, không làn xung đột) | rack.test (9) |
| H09 Đặt phòng mới | Xong | Căn (định mức/tối đa) + kiểm phòng trống ngay khi đổi (`searchAvailability`: chip Trùng lịch/Khóa phòng/Ngừng bán + căn thay thế); ngày đến–đi + số đêm; kênh Trực tiếp/CTV/OTA/Nội bộ; **directSource** (Zalo/điện thoại, Website, Vãng lai, Quay lại, Sale nội bộ); OTA: kênh, mã OTA, kiểu thanh toán; Nội bộ: ghi chú bắt buộc; **số khách 3 bậc tuổi** (trẻ < 6 không tính), vượt tối đa chặn ngay ở ô (nút + khóa), vượt định mức → **nhắc bộ đồ dùng thêm**; **khách qua `GuestPicker` dùng chung** (+ ô SĐT khi hồ sơ chưa có, lưu vào hồ sơ trước khi tạo đơn); email, giờ đến; **giá theo đêm** từ `calculateQuote` (nguồn giá niêm yết/cuối tuần, sửa được), giảm số đêm, phụ thu người, tổng, cọc 30 %, ô "Số tiền đã nhận" + cách thanh toán (B2 kênh trực tiếp/CTV); **ở tối thiểu** (`MIN_STAY_NOT_MET` → lỗi tại ô ngày; FDL+ thêm ô lý do bỏ qua); giá OTA ngoài sàn–trần → cảnh báo + lý do (`RATE_OUT_OF_RANGE_WARNING`); ≥ 28 đêm → hộp "{n} đêm là thuê dài hạn" + chuyển H10; nút "Giữ chỗ đến {giờ}" (saveQuote → createHoldFromQuote, ẩn khi đến hôm nay); nháp tự lưu trong bộ nhớ; Idempotency-Key giữ nguyên khi gửi lại cùng nội dung | booking.test (7) |
| H09 – 409/422 | Xong | **409 ROOM_UNAVAILABLE**: giữ nguyên dữ liệu, câu có tên khách chiếm căn + khoảng ngày (`conflicts[]`), nút "Dùng căn X" từ `suggestions[]` (căn nâng hạng chỉ FDL+), nếu trước đó căn còn trống → câu "vừa được người khác đặt" (AC2); OTA → "Căn X đã kín…" + **Lưu chưa gán căn** (hộp xác nhận, focus nút an toàn) → `allowUnassigned=true`; ROOM_BLOCKED/NOT_SELLABLE, CAPACITY_EXCEEDED, PHONE_REQUIRED, DEPOSIT_INSUFFICIENT, LONG_STAY_REQUIRES_CONTRACT, lỗi trường `errors[]` gắn đúng ô | booking.test |
| H10 Đơn dài hạn nhập tay | Xong | Cờ "HĐ ngoài hệ thống – chuyển vào app ở R3"; căn, ngày vào/ra (+ "n tháng · n đêm"), khách + SĐT, số khách (ghi chú phụ thu theo HĐ giấy), tiền thuê/tháng (bắt buộc), ký quỹ ngoài app, số HĐ, ghi chú; không kênh, không giá đêm, không thu tiền (`manualLongStay`, kênh trực tiếp tự chọn); dưới ngưỡng → câu `lsm.below_threshold` + nút chuyển ngắn ngày; danh sách lọc "HĐ ngoài hệ thống" ở màn Đơn đặt phòng; drawer hiện tiền thuê/ký quỹ/số HĐ + "App chưa nhắc thu theo kỳ" | booking.test, reservation.test |
| H11 Chi tiết đơn | Xong | Drawer (focus bẫy, Esc, trả focus về ô rack): chip trạng thái/dài hạn/HĐ ngoài hệ thống/xung đột OTA; **giữ chỗ + đồng hồ đếm ngược** (làm mới 30 s, < 2 giờ chuyển đỏ, hết hạn → `drawer.hold.expired`); tiến trình (ngắn ngày 5 bước, dài hạn 2 bước); căn/ngày/giờ đến/số khách/kênh + mã OTA; khối "Vượt định mức n · chuẩn bị bộ đồ dùng thêm"; folio theo vai (CTV chỉ tổng + cọc); "Thiếu n người"; nút **chỉ theo `allowedActions[]`**: **xác nhận cọc** (thiếu → ghi nhận, giữ hold, báo còn thiếu; đủ → confirmed; ghi chú "chờ đối soát"; POS chỉ mã chuẩn chi), gia hạn giữ chỗ 1 lần (hạn mới ≤ 12:00 ngày đến), **đổi căn/ngày** (OTA khóa ngày, 409 có nút "Dùng căn X"), **hủy có hộp xác nhận hậu quả US-135** (gọi `dryRun=true` lấy phí giữ lại/hoàn, lý do bắt buộc, nút an toàn có focus; MGR+ "Dời ngày thay vì hủy"), **không đến** (khóa tới `no_show_mark_time` + kết quả liên lạc, hậu quả trực tiếp/OTA) **+ khôi phục** (200 hoặc 202 "Đã gửi quản lý duyệt"), **gán căn OTA** (gợi ý cùng nhóm trước, nâng hạng chỉ FDL+, 409 → gợi ý mới), CTV "Báo đã chuyển cọc"; Nhận phòng hiện nhưng khóa (luồng H13 – Sprint 3). **412 VERSION_CONFLICT**: giữ dữ liệu đã nhập + nút tải lại phiên bản; **409 INVALID_TRANSITION**: tải lại, câu nêu trạng thái mới; CTV mở đơn người khác → câu `error.NOT_FOUND` | reservation.test (9) |
| H12 Sale/CTV | Xong | Tab Căn trống: ngày đến/số đêm/số người → danh sách căn trống (định mức/tối đa), hết phòng → "Xem ngày gợi ý"; lưới căn trống theo vai; ô trống → báo giá điền sẵn. Báo giá: tính lại tự động mỗi lần đổi (300 ms), đêm thường/cuối tuần, giảm số đêm, phụ thu người + nhắc sofa, tổng, cọc; **hoa hồng chỉ của mình** ("Sale nhận 3 %" + "OTTIMO còn lại" / CTV "Bạn nhận 8 %", không có "OTTIMO còn lại"); ≥ 15 đêm so sánh thuê tháng, ≥ 28 đêm hướng lễ tân; căn đã kín → chặn lưu + gợi ý. Gửi: mã BG, hạn hiệu lực, văn bản VI/EN từ `getQuoteText` (không chứa hoa hồng/SĐT), Sao chép gửi Zalo. Giữ chỗ: chọn 12/24/48 giờ, hạn dự kiến, số cọc, đến hôm nay → `HOLD_NOT_ALLOWED_TODAY` + "nhắn lễ tân" (nút khóa); QUOTE_EXPIRED → "Lập báo giá mới"; tạo xong → mã đơn + nội dung CK = mã đơn + "Mở đơn" (drawer có hoa hồng dự kiến của mình). Tab Báo giá: danh sách của mình | quotes.test (5) |
| Đơn đặt phòng (S04) | Xong (mức cơ bản) | Bảng lọc Đang hiệu lực / Tất cả / HĐ ngoài hệ thống, tìm mã đơn/OTA/KH, `/reservations/:id` mở drawer; SAL/CTV thấy "Đơn của tôi" (server lọc) | reservation.test |
| Cập nhật rack khi có thay đổi | Xong | `app/live.ts`: mỗi thao tác ghi gọi `notifyChanged()` → rack/danh sách tải lại ngay; server thật: SSE `streamEvents` (`reservation.changed`, `room.status_changed`, `attention.changed`) → tải lại; SSE rớt → "Dữ liệu lúc {giờ}. Đang kết nối lại…" (`fo.rack.stale`) + hỏi lại 30 s; mock/test: hỏi lại 30 s + khi quay lại tab | rack.test (gán căn → làn biến mất) |

Hạ tầng: `api-client` thêm 23 hàm endpoint EP02 (kiểu sinh từ OpenAPI 0.3.4, không sửa tay) + `eventStreamPath`; mock EP02 (`mocks/reservations.ts`, dữ liệu theo DS-0 tương đối với "hôm nay"); `OccupancyField`, `useCatalog`, `useRules` (FD/SAL không có quyền `listParameters` → dùng mặc định BR §13), `useNow`; `GuestPicker` thêm `required/error/help/initialText`; 3 màn mới tải theo route (`React.lazy`) – bundle chính 503 KB (gzip 158 KB), rack 10 KB, drawer 35 KB.

## 2. Kết quả lệnh (thư mục `product/`, 16/10/2026)

| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/admin-web test` | **100/100 xanh** (12 file; mới: rack 9, booking 7, reservation 9, quotes 5) |
| `@ottimo/api-client` test | 10/10 (mới `endpoints.test.ts` 5) · `ui` 7/7 · `i18n` 3/3 (khóa `t()` VI/EN đủ) |
| `pnpm format:check` | Phần FE xanh (`prettier --check apps/admin-web packages/*` ✔). **Toàn repo đỏ** vì 32 file `services/api/**` của BE đang code |
| `pnpm lint` | ESLint: 0 lỗi phần FE (1 cảnh báo cũ ở `mockServiceWorker.js` sinh tự động); **1 lỗi `services/api`** (`nightDates` không dùng – BE) |
| `turbo run typecheck` | admin-web, api-client, ui, i18n ✔; **`@ottimo/api` đỏ** (`reservations.controller.ts` 269 – BE) |
| `pnpm build` | admin-web, mobile, guest-web ✔; **`@ottimo/api` đỏ** (cùng lỗi TS trên) |
| `pnpm test` toàn repo | Mọi gói xanh trừ `@ottimo/api` (1 test đỏ – BE đang làm) |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0** (48 s, ảnh `ottimo-web:fe-s2`) |

→ "Toàn repo xanh" **chưa đạt** chỉ vì `services/api` (vùng BE-A/BE-B, đang code song song). Phần FE xanh hết; ORC chạy lại sau khi BE xong.

## 3. File tạo/sửa
- Mới: `apps/admin-web/src/pages/rack/{RackPage,RackGrid}.tsx`, `rackModel.ts`; `pages/booking/{BookingDialog,LongStayDialog}.tsx`; `pages/reservations/{ReservationsPage,ReservationDrawer,ReservationDialogs}.tsx`; `pages/quotes/{QuotesPage,QuoteDialog}.tsx`; `components/OccupancyField.tsx`; `app/{live,rules,catalog,reservations}.ts`; `hooks/useNow.ts`; `mocks/reservations.ts`; `__tests__/{rack,booking,reservation,quotes}.test.tsx`; `packages/api-client/src/endpoints.test.ts`
- Sửa: `apps/admin-web/src/app/routes.tsx` (3 route lazy), `session/nav.ts` (rack/đơn/báo giá `ready`; "Đơn của tôi" cho SAL/CTV; HK/MT "Các căn"), `components/GuestPicker.tsx`, `mocks/handlers.ts` (ghép mock EP02), `__tests__/nav.test.tsx` (màn "đang làm" đổi sang Buồng phòng), `README.md`; `packages/api-client/src/{endpoints,types}.ts`; `packages/ui/src/styles/app.css` (focus ô lưới, bảng giá, danh sách gợi ý)
- Báo cáo: `rounds/round-02/outputs/FE/s2-report.md`

## 4. Giả định (FE tự quyết – đề nghị ORC ghi decision-log)
1. **RackBar thiếu trường** cho nhãn "Nhập tay", icon sofa, đếm ngược giữ chỗ, mã đơn (H08 đã ghi) → FE đọc **tùy chọn** `externalContract`, `extraGuestCount`, `holdExpiresAt`, `reservationCode` nếu server gửi (mock có gửi); thiếu thì thanh vẫn đúng, chỉ không có nhãn/icon/đếm ngược.
2. SAL/CTV xem rack dạng căn trống **trong màn Báo giá** (H08 8.4, H02 2.2 không có menu Sơ đồ phòng cho họ); HK/MT dạng danh sách che tên.
3. Lý do đổi căn/ngày (B7) = ô chữ tự do (`reasonCode=other` + `note`) như hi-fi H11 vì danh mục lý do DOM còn mở (E02-07).
4. Đơn trực tiếp/CTV tạo bằng B2 luôn gửi `initialPayment` (cọc, mặc định = cọc server tính); chưa đủ tiền → dùng "Giữ chỗ đến…" (báo giá + giữ chỗ). Kênh CTV chưa có ô "CTV chốt đơn" (không có API liệt kê CTV cho FD – `listUsers` chỉ OWN).
5. "Giữ chỗ" từ form đặt phòng dùng `hold_hours_default`; FD/SAL không đọc được tham số → mặc định BR §13 (28 đêm, 12/24/48 giờ, 12:00, 23:00).
6. Khóa nút "Không đến" theo giờ máy so với `no_show_mark_time` (server vẫn kiểm `INVALID_TRANSITION`).
7. Chuỗi thiếu dùng tạm khóa gần nghĩa (xem mục 5 – UXD): nhãn ô ngày đi = tách từ `booking.field.dates`; toast thao tác = "{mã} · {trạng thái}" / `common.saved`; nút tải lại khi 412 = `common.retry`; hộp "Lưu chưa gán căn" dùng `fo.rack.unassigned_help`.
8. Lý do hủy `ota_cancelled` và ô "Tiền phạt theo kênh" (`otaPenaltyVnd`) **chưa hiện** (chưa có chuỗi UXD); API đã sẵn.

## 5. Việc cần vai khác
| Gửi | Nội dung |
|---|---|
| ARC | Thêm vào `RackBar`: `externalContract`, `extraGuestCount`, `holdExpiresAt`, `reservationCode` (FB H08 – nếu không, rack không vẽ được "Nhập tay"/sofa/đếm ngược trên server thật). `Problem` của `DEPOSIT_INSUFFICIENT` nên có `required`, `paid`; `INVALID_TRANSITION` nên có `currentStatus`; `HOLD_EXPIRED` có `expiredAt` (FE đã đọc nếu có) |
| ARC/BE | API liệt kê CTV/sale để chọn "người chốt" (`closerUserId`) cho FD; `searchAvailability` khi không có `roomId` nên đánh dấu `upgrade` theo nhóm của đơn (gán căn OTA) |
| BE | Mock FE theo spec mục 3.4 (thứ tự kiểm), 3.5 (409 `conflicts[]` + `suggestions[]` – FD+ có `guestDisplayName`, vai khác không), 10.4, 11.3 (202) – đề nghị BE đối chiếu `apps/admin-web/src/mocks/reservations.ts` khi viết test hợp đồng |
| UXD | Chuỗi mới: nhãn riêng "Ngày đi", "Kiểu xem", "Tiến trình đơn", "Tải lại", "Đã gia hạn giữ chỗ", "Đã đổi căn/ngày", "Đã gán căn {room}", "Chưa có đơn nào", lý do hủy "OTA báo hủy", "Tiền phạt theo kênh", tiêu đề/thân hộp "Lưu chưa gán căn" (EP02 6.2), `field_error.hold_extended_once`, `OTA_AMOUNT_MISMATCH`, "Nâng hạng – cần lễ tân trưởng xác nhận"; `rack.conflict_title` đang cứng chữ "Agoda" → cần `{channel}` |
| QA | Test FE dựa trên ngày thật (đặt 2 đêm để không vướng ở tối thiểu thứ Sáu/Bảy); smoke `/reservations/:id` nay mở drawer (không còn "đang làm") |

## 6. Rủi ro / chưa xong
- Chưa chạy với API thật (BE đang code; `@ottimo/api` chưa build) – chưa kiểm SSE thật, 409/412 thật.
- Chưa kiểm trực quan trên trình duyệt / VoiceOver / zoom 200 % (MSW không chạy trong Browser pane – như UXD ghi ở S1); a11y kiểm bằng test (role, nhãn, focus).
- Chưa làm: người đi cùng (US-022 – thêm/xóa người), sửa số khách/giờ đến (`updateReservation`), đổi chéo căn (`swapRoom`), dời ra cơ sở khác, khóa phòng OOO (tạo khối – màn Bảo trì S4), lead, ảnh biên nhận CTV (`uploadAttachment`), ô "CTV chốt đơn".
- Bundle chính 503 KB (vượt ngưỡng cảnh báo 500 KB của Vite do chuỗi VI+EN tăng) – tách chuỗi theo ngôn ngữ ở R3 như đã nêu S1.

Không có ESC mới.
