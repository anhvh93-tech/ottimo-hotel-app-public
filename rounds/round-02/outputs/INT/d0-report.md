# INT – Round 2, Đợt 0 – Báo cáo

- Người làm: INT | Ngày: 16/10/2026 | Đầu vào: `rounds/round-02/outputs/SEC/w1-review.md` (FB-R2-SEC-INT-01…05), decision-log 16/10 (SEC: lọc thẻ 2 tầng; INV: khóa TTLock – ESC-011)

## 1. Bảng trạng thái

| Thẻ / việc | Mức | Trạng thái | Cách xử lý |
|---|---|---|---|
| FB-R2-SEC-INT-01 – nhận nhầm ~10% mã số dài | Major | **Đã sửa** | Tầng B: adapter khai `fieldKinds` (`numericId`, `timestamp14`, `epochMs`, `text`); giá trị chỉ chữ số ở khóa đã khai chỉ bị xóa khi Luhn + IIN + độ dài (`CARD_IIN_TABLE`); `timestamp14`/`epochMs` hợp lệ trong ±2 năm → giữ. `requiredKeys` bị xóa → `attention[]` (`card_suspect`, chỉ tên khóa); `droppedByRule{name,value_text,value_id}` cho metric nhãn `rule` |
| FB-R2-SEC-INT-02 – bỏ sót thẻ dính CVV/hạn | Major | **Đã sửa** | Tầng A quét mọi cửa sổ 13–19 chữ số liên tiếp (≤ 7 phép Luhn/chữ số); 3 chuỗi đỏ của SEC + dính liền không dấu cách đều bắt được |
| FB-R2-SEC-INT-03 – số nguyên > MAX_SAFE_INTEGER | Minor | **Đã sửa** | Bị xóa ở cả hai tầng; `bigint` (bộ đọc JSON lossless) được kiểm theo chữ số thật |
| FB-R2-SEC-INT-04 – `env:PAYMENT` lấy hết khóa nhóm | Minor | **Đã sửa** | Bắt buộc `env:<NHÓM>_<NCC>`; nhóm trơn → `CONFIG` (7 nhóm) |
| FB-R2-SEC-INT-05 – hoa thường; cổng thật ở môi trường thử | Suggestion | **Đã làm** | (a) `mock/sandbox` so không phân biệt hoa thường; (b) ngoài production cấm `PAYMENT_VNPAY_MODE`/`PAYMENT_MOMO_MODE=production`, VietQR giữ (P-R2-6) |
| TTLock (ESC-011) | – | **Đã cập nhật tài liệu** | `smart-lock.md` mục 0: gateway là điều kiện cho mã tự đặt có hạn từ máy chủ (`addType=2`); R2 giữ thủ công, adapter TTLock ở R3; 5 câu hỏi cho INV (mục 5 dưới) |
| lint / test / build | – | **Xanh phần INT + toàn bộ build/typecheck**; `pnpm test`, `pnpm lint`, `format:check` toàn repo **đỏ do file của QA** | xem mục 3 |

## 2. Đã làm gì
- `scrubCardData` 2 tầng (mục 1). Test bắt buộc của SEC đều có: 86.400 `vnp_PayDate` một ngày khai `timestamp14` → 0 bị xóa (đã xác nhận > 8.000 giá trị trong đó hợp Luhn, tức luật cũ sẽ xóa); 10.000 mẫu `epochMs` (cả number và string) → 0; 4.200 mã 13–19 số hợp Luhn đầu `1`/`7`/`8` ở `numericId` → giữ; số thử công khai Visa `4111111111111111`, Master `5555555555554444`, Amex `378282246310005`, JCB `3530111333300000`, NAPAS `9704198526191432198` (thẻ thử VNPay sandbox), Visa 19 số, Diners 14 số → bị xóa ở trường `numericId`/`timestamp14`/`epochMs` (kể cả có `allowKeys`) và trong ghi chú, cả khi dính CVV/hạn. Thêm test: không truyền `nowMs` vẫn giữ timestamp; `attention` liệt kê đúng khóa bắt buộc, không có giá trị.
- Bảng IIN: theo bảng SEC, **mở rộng** Diners `30` (300–309) và Mir `2200–2204` (16–19) theo Wikipedia "Payment card number" (https://en.wikipedia.org/wiki/Payment_card_number, tra 16/10/2026). Chưa thêm RuPay `81`, `82` (16 số) vì tăng nhận nhầm cho mã đầu 8 – để SEC quyết.
- `Date.now()` bị lint cấm (ADR-008) → cửa sổ ±2 năm chỉ chạy khi adapter truyền `nowMs` từ Clock; không có vẫn an toàn (timestamp 14 số / epoch 13 số không khớp IIN + độ dài nào trong bảng).
- README 1.3 (e)(f), 1.4 (ref có nhà cung cấp), 1.8 (2 tầng, `fieldKinds`, `requiredKeys`, `attention`, nhãn `rule`) cập nhật.
- `smart-lock.md`: mục 0 TTLock (tra lại `keyboardPwd/add` 16/10/2026: `addType` 1 = Bluetooth điện thoại – phải gọi SDK trước, 2 = qua gateway gọi API trực tiếp, 3 = NB-IoT; chỉ khóa passcode V4 đặt mã tùy ý).
- decision-log: 3 dòng INT (cách cài 2 tầng; credentialsRef + safe-config; kế hoạch TTLock).

## 3. Kết quả chạy
- `@ottimo/integrations`: 46/46 test xanh; `tsc --noEmit` xanh; `eslint integrations services` 0 lỗi; `prettier --check integrations services` sạch.
- `turbo run test --continue`: admin-web, guest-web, mobile, integrations, api (29 pass, 6 skip) xanh; **`@ottimo/tests` đỏ** (91 lỗi `validate-fixtures`: "nhãn GIẢ ĐỊNH nhưng BR ghi INV quyết ESC-…", BR-812 thiếu oracle) – do BR v0.3.1/BR-812 của DOM vừa đổi trong cùng đợt, không liên quan INT; QA cần cập nhật `tests/fixtures/br-examples.json`.
- `pnpm lint` đỏ ở `tests/tools/validate-fixtures.mjs` (2 biến không dùng `SEED_PARAMS`, `ageAt`) và `format:check` đỏ ở cùng file – file QA đang sửa. `turbo run typecheck` 9/9 xanh; `pnpm build` 6/6 xanh.
- Lưu ý: trong lúc làm INT đã chạy `pnpm format` (prettier --write) toàn repo một lần trước khi biết có file khác đang sửa; prettier chỉ đổi định dạng, không đổi nội dung. Không có git nên không liệt kê được file bị chạm ngoài `integrations/`; file QA ở trên hiện vẫn chưa định dạng (tức không bị ghi đè).

## 4. Giả định
- `fieldKinds`/`requiredKeys` theo **tên khóa chính xác ở mọi độ sâu**; kiểu chỉ áp cho giá trị nguyên thủy ngay dưới khóa (phần tử mảng/đối tượng con đi Tầng A).
- Tên khóa bắt buộc trong `attention` là hằng số của adapter, không phải dữ liệu khách → được trả về (SEC yêu cầu "không kèm giá trị").
- Ngưỡng ±2 năm tính 366 ngày/năm; `timestamp14` kiểm lịch thật (ngày 31/02 → không hợp lệ), không phụ thuộc múi giờ (lệch 7 giờ nằm trong cửa sổ).

## 5. Rủi ro / câu hỏi
- **Tầng A chặt hơn → xóa nhầm ghi chú nhiều hơn** (SEC đã chấp nhận "xóa nhầm ghi chú là rẻ"): đo 20.000 mẫu, ghi chú có **2 số điện thoại cách nhau một dấu cách** ("0901234567 0912345678") bị xóa **95%**; cách bằng dấu phẩy hoặc ngày + SĐT: 0%. Ảnh hưởng: ghi chú OTA/khách kiểu đó bị bỏ, sinh cảnh báo `value_text`. Đề xuất SEC xem có cần nới (vd. cửa sổ phải bắt đầu/kết thúc ở ranh giới nhóm số) không – INT giữ đúng yêu cầu hiện tại.
- Mỗi adapter thật (VietQR/bank feed R2, VNPay/MoMo R3) **phải** khai `fieldKinds` đủ, nếu không trường mã dài sẽ rơi vào Tầng A và bị xóa ~10% như trước. Đưa vào checklist review adapter.
- **Câu hỏi cho INV về TTLock** (không tạo ESC; ORC chuyển, ESC-011 còn mở phần thông tin khóa): (1) đã có **gateway** chưa – model (G2/G3/G4…), số lượng, vị trí, căn nào "online"; (2) **model khóa** và thương hiệu, có bàn phím/thẻ từ/vân tay; (3) app TTLock có tạo mật mã **"Tùy chỉnh"** với giờ bắt đầu/kết thúc không (dấu hiệu passcode V4); (4) tài khoản TTLock đang quản lý khóa là của cá nhân hay công ty; (5) khóa có tự khóa bàn phím khi nhập sai nhiều lần không.

## 6. Việc chưa xong
- Metric `integration_card_data_dropped_total{provider,rule}` và mục "Cần chú ý" `card_suspect` là việc của adapter/BE khi nối inbox (chưa có adapter thật).
- Trả lời từng thẻ: `rounds/round-02/responses/INT-responses.md`.
