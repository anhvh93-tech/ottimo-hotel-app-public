# FE – Round 3 – Phản hồi & sửa – FB-INV-004 việc F3, F4 (nhận phòng từ 12:00)

Nguồn: `rounds/round-03/outputs/DOM/v1-production-defaults.md` mục 8.3 (#6, #7, #8) và 8.5 (F3, F4); BR-401 v0.4.6: nhận phòng từ 12:00 nếu căn sẵn sàng, chắc chắn sẵn sàng 14:00. Chữ khách thấy không hứa "sẵn sàng từ 12:00".

## Đã làm gì
**F3 – chuỗi khách thấy** (sửa trong nguồn duy nhất `design/tools/gen_strings.py`, chạy lại `gen_strings.py` → JSON, `strings.js`, `strings-tables.md`). FE viết theo câu chuẩn BR-401 (e); **chờ UXD/CPY duyệt**:

| Key | Cũ | Mới |
|---|---|---|
| `guest.oci.done_body` EN | Your room is ready from {time}. Reception will give you your door code when you arrive. | Check-in from {time}, once your room is ready – always ready by 14:00. Reception will give you your door code when you arrive. |
| `guest.oci.done_body` VI | Phòng sẵn sàng từ {time}. Lễ tân sẽ giao mã cửa khi bạn đến. | Nhận phòng từ {time} khi phòng đã sẵn sàng – phòng luôn sẵn sàng lúc 14:00. Lễ tân sẽ giao mã cửa khi bạn đến. |
| `guest.oci.done_body` RU | Апартаменты будут готовы с {time}. Код от двери администратор выдаст при заезде. | Заезд с {time}, если апартаменты уже готовы; к 14:00 они готовы всегда. Код от двери администратор выдаст при заезде. |
| `guest.stay.checkin_time` EN (HomePage, InfoPage) | Check-in from {time} | Check-in from {time} (your room is always ready by 14:00) |
| `guest.stay.checkin_time` VI | Nhận phòng từ {time} | Nhận phòng từ {time} (phòng luôn sẵn sàng lúc 14:00) |
| `guest.stay.checkin_time` RU | Заезд с {time} | Заезд с {time} (апартаменты всегда готовы к 14:00) |
| `msg.booking_confirmed` EN (mẫu tin) | … Check-in from 14:00, check-out by 12:00. … | … Check-in from 12:00 (your room is always ready by 14:00), check-out by 12:00. … |
| `msg.booking_confirmed` VI | … Nhận phòng từ 14:00, trả phòng trước 12:00. … | … Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00), trả phòng trước 12:00. … |
| `msg.booking_confirmed` RU | … Заезд с 14:00, выезд до 12:00. … | … Заезд с 12:00 (апартаменты всегда готовы к 14:00), выезд до 12:00. … |

14:00 viết trong chuỗi cho đến v1.0.1 (F8 – khóa `room_ready_guaranteed_time`). `msg.booking_confirmed` chỉ đổi chữ, chưa dùng biến `{checkin_time}`/`{checkout_time}` – phần biến là F6 (INT).

**F4 – mặc định và khung giờ đến**
- `apps/admin-web/src/app/rules.ts`: `RULE_DEFAULTS.checkinTime` '14:00' → '12:00' (dùng khi vai FD/SAL/CTV không đọc được tham số).
- `apps/guest-web/src/checkin/eta.ts`: khung 2 giờ từ giờ nhận chuẩn đến 18:00 (tối đa 4 khung), khung tối đến 22:00, rồi "Sau 22:00". Với 12:00: 12–14, 14–16, 16–18, 18–22, Sau 22:00. Với 14:00 giữ đúng bộ khung hi-fi H18 cũ (14–16, 16–18, 18–22).
- Mock guest-web `checkinTime` '12:00' để bản dev hiện đúng chữ mới.

## File tạo/sửa
- `product/design/tools/gen_strings.py`, `product/design/copy/strings-{en,vi,ru}.json`, `product/design/tools/strings-tables.md`, `product/design/wireframes/assets/strings.js`
- `product/apps/admin-web/src/app/rules.ts`
- `product/apps/guest-web/src/checkin/eta.ts`, `src/mocks/handlers.ts`, `src/__tests__/{flow.test.tsx,requests.test.tsx,units.test.ts}`

## Kiểm tra
vitest guest-web 67/67, admin-web 625/625 (1 lần chạy có 1 ca chập chờn về thời gian, 2 lần chạy lại đều xanh); tsc cả hai app; eslint các file sửa; `prettier --check .` sạch.

## Giả định
- Giữ câu thứ hai của `done_body` (mã cửa – SEC ĐK-6) nguyên văn.
- Thêm vế "(… always ready by 14:00)" cho `guest.stay.checkin_time` (DOM 8.3 #7 "nếu UXD đủ chỗ"): ô `dd` trên HomePage/InfoPage tự xuống dòng, không vỡ bố cục.

## Việc chưa làm / chuyển vai khác
- `content-guide.md` (bảng dán từ `strings-tables.md`, dòng `guest.stay.checkin_time`, `guest.oci.done_body`; dòng 180 ghi "giờ chuẩn 14:00/12:00") – UXD dán lại khi duyệt.
- Hi-fi `design/hifi/18-guest-checkin.html`, `23-guest-requests.html`, wireframe `07-guest-app.html` vẫn truyền `time: 14:00` → chữ mới sẽ hiện "from 14:00 … by 14:00" – UXD đổi tham số mẫu thành 12:00 (DOM 8.3 #15).
- Mock admin-web (`mocks/reservations.ts` tham số `checkin_time` '14:00', `mocks/stay.ts`) chưa đổi – kéo theo bậc phụ thu nhận sớm trong mock; đổi cùng F1 khi BE chốt bậc mới.
- Landing (`landing-web` site.json, en.ts, vi.ts – F5) thuộc FE-LP/CPY; app mobile (nếu có bản khung giờ đến riêng) thuộc MOB.
- Nhãn nhân viên `params.k.checkin_time` "Giờ nhận phòng chuẩn" / "Standard check-in time" – UXD cân nhắc "Giờ nhận phòng sớm nhất (nếu căn sẵn sàng)".
