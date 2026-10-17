# ADR-005 – App nhân viên là PWA (không native Flutter ở MVP), có hàng đợi offline

- Trạng thái: Đề xuất | Người quyết: ARC (cùng UXD về mức offline – BL 9 #22) | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: ADR-004, PRD N2, N4; US-052…US-058; decision-log 15/10 (giả định thiết bị Android tầm trung); BR-802; BR tình huống S7

## Bối cảnh
- Người dùng app nhân viên: buồng phòng/bảo trì (Android tầm trung, mạng Wi-Fi/4G chập chờn trong hành lang/cầu thang), sale/CTV (điện thoại, có thể iPhone), chủ đầu tư (điện thoại).
- Nhu cầu thiết bị: xem việc hôm nay, đổi trạng thái buồng, checklist, chụp ảnh sự cố, đếm minibar, báo giá/giữ chỗ (sale), nhận thông báo.
- Không có nhu cầu bắt buộc phần cứng đặc biệt ở MVP (khóa cửa nhập mã tay – PRD M14; không ghi thẻ từ NFC).
- Ngân sách: tài khoản Google Play (phí một lần) / Apple Developer (phí năm) và quy trình duyệt app là chi phí và độ trễ thêm.

## Quyết định
1. **App nhân viên = PWA** (`product/apps/mobile`, tên hiển thị "OTTIMO Staff"), cài lên màn hình chính từ Chrome Android/Safari iOS, mở toàn màn hình, cập nhật tức thì khi deploy (không chờ store duyệt).
2. Cùng stack ADR-004 (React + Vite), dùng chung `packages/ui`, `packages/contracts`, `packages/i18n`; bundle riêng, nhẹ (ngân sách ≤ 180 KB gzip cho lần tải đầu – mục 16 architecture).
3. **Mức offline (đội tự chốt BL 9 #22)**:
   - **Đọc offline**: danh sách việc hôm nay, trạng thái 10 căn, checklist, danh mục minibar – lưu IndexedDB, hiển thị "cập nhật lúc hh:mm".
   - **Ghi offline (xếp hàng)**: đổi trạng thái buồng, tick checklist, đếm minibar, tạo phiếu sự cố (ảnh nén ≤ 300 KB, xếp hàng). Mỗi thao tác có `Idempotency-Key` (UUID sinh trên máy) + thời điểm thao tác thật.
   - **Không offline**: mọi thao tác tiền và tồn phòng (đặt/giữ chỗ/gia hạn/thu tiền/FOC), xem giấy tờ (C3). Cần server kiểm trùng/kiểm quyền → nút bị khóa kèm thông báo "Cần có mạng".
   - **Gửi lại**: Background Sync (Chrome Android) + gửi lại khi sự kiện `online`/mở app (Safari không có Background Sync).
   - **Xung đột**: server kiểm chuyển trạng thái hợp lệ (BR-802) theo trạng thái hiện tại; nếu từ chối (vd. căn đã bị lễ tân khóa OOO) → mục trong hàng đợi chuyển "Không áp dụng được" + lý do, người dùng thấy rõ, không âm thầm ghi đè.
   - **Hoàn tác = gửi trễ 10 giây** (bổ sung 17/10/2026 theo OpenAPI 0.3.7, ARC B-24 / UXD #9): lệnh ghi PWA (đổi trạng thái buồng, xong/hủy việc, kiểm phòng, đếm minibar) nằm 10 giây trên máy trước khi gửi; "Hoàn tác" = xóa khỏi hàng đợi, **không** có API đảo; `performedAt` = giờ bấm. Lễ tân thấy chậm ≤ 10 giây + thời gian đồng bộ. Phạm vi xếp hàng được: `transitionRoomStatus`, `transitionHkTask`, `recordInspection`, `recordMinibarCheck`, `uploadAttachment` + `createWorkOrder` **không** có `block` (HK báo sự cố, kể cả `blockRequested`). **Chỉ online**: tạo/kéo dài/mở khối OOO, `createWorkOrder` có `block`, `transitionWorkOrder`, `updateWorkOrder`, `transitionGuestRequest`. Lệnh quá cũ → 422 `PERFORMED_AT_OUT_OF_RANGE` ([now − 24 giờ, now + 5 phút]); 409 luôn kèm `currentState` để phân loại "Đã áp dụng"/"Không áp dụng được".
4. Thông báo: **R2** hộp thông báo trong app (`staff_notification`, `GET /v1/me/notifications`) + SSE `notification.created`; **R3** Web Push (Android Chrome; iOS ≥ 16.4 khi đã cài lên màn hình chính; `PUT /v1/me/push-subscription`, khóa VAPID). Thông báo **không chứa dữ liệu C2/C3** (SEC).
6. PWA **không bao giờ** là thiết bị tin cậy cho C3 (SR-DEV-04/09); thao tác C3 (kể cả ca đêm) làm trên admin-web ở **thiết bị của cơ sở** đã được owner cấp (phân xử ORC 15/10).
5. Lễ tân dùng `admin-web` trên laptop; khi mất mạng tại quầy (tình huống S7) chỉ **xem** rack đã cache + banner "Mất kết nối", không ghi.

## Phương án đã cân nhắc
| Phương án | Ưu | Nhược → vì sao không chọn |
|---|---|---|
| Flutter native (Android + iOS) | Offline mạnh (SQLite), mượt, truy cập phần cứng | Thêm ngôn ngữ Dart + codebase thứ 2; phí/thời gian store; cập nhật chậm; với nhu cầu MVP (form, danh sách, ảnh) không có lợi thế quyết định |
| React Native / Expo | Chung TS | Vẫn cần store, build pipeline riêng; hai cách viết UI (web vs native) |
| Chỉ web responsive, không PWA | Đơn giản nhất | Không offline, không push, phải gõ URL → buồng phòng bỏ dùng (US-058) |

## Hệ quả
- Tốt: 1 stack TS cho mọi client; không phí store; sửa lỗi lên ngay; OPS deploy chung.
- Phải chấp nhận: iOS giới hạn (không Background Sync, push chỉ khi đã cài lên màn hình chính, IndexedDB có thể bị dọn sau thời gian dài không mở). Rủi ro thấp vì nhân viên buồng phòng dùng Android (giả định – chờ INV xác nhận, ESC-003 kiểm chứng người dùng).

## Điều kiện xem lại (→ ADR mới "app native")
- Chọn hãng khóa chỉ hỗ trợ **SDK Bluetooth/NFC trên điện thoại** (không có cloud API) mà INV muốn nhân viên cấp mã/thẻ từ app.
- Đo thực tế R2–R3: PWA trên máy buồng phòng mở > 2 giây hoặc mất thao tác offline.
- Cần quét MRZ/QR CCCD liên tục với chất lượng mà web camera không đạt (đánh giá ở R3, US quét giấy tờ).
