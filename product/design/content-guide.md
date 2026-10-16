# Hướng dẫn nội dung chữ OTTIMO (Content guide) – v0.3

- Người viết: UXD (kiêm UX Writer) | Round 1 – Bước 2, đợt 2; cập nhật đợt 4 (khớp `rbac-matrix.md`, `state-machines.md`, `erd.md`, `openapi.yaml`) | Ngày: 15/10/2026
- Trạng thái: bản nháp chờ review (UXR, PO; khuyến nghị DOM cho thuật ngữ nghiệp vụ).
- File chuỗi máy đọc: `product/design/copy/strings-vi.json`, `strings-en.json`, `strings-ru.json` (cùng key với bảng mục 8). Nguồn duy nhất: `product/design/tools/gen_strings.py` (sinh JSON + `wireframes/assets/strings.js`); sửa chuỗi ở đó rồi chạy lại.
- Khắc phục: HR-01 (app khách chỉ tiếng Việt), HR-13 (thuật ngữ khó), HR-19 (đặt tên không thống nhất), HR-24 (lỗi không chỉ cách sửa), HR-25 (bill song ngữ).

---

## 1. Giọng văn

| | Nhân viên (Desk, HK) | Khách (app khách, tin nhắn, bill) |
|---|---|---|
| Tính cách | Đồng nghiệp chu đáo: ngắn, rõ, nói việc cần làm | Chủ nhà boutique: ấm, lịch sự, không khách sáo |
| Xưng hô | Không xưng hô; câu mệnh lệnh nhẹ ("Chọn căn khác để lưu") | VI: "bạn" (khách trẻ/quốc tế), "anh/chị" chỉ trong tin nhắn cá nhân lễ tân tự sửa; EN: "you"; RU: «Вы» (trang trọng) |
| Câu | ≤ 20 từ; động từ đầu câu; một ý một câu | ≤ 20 từ; nói lợi ích trước ("nhận phòng chỉ vài phút") |
| Thuật ngữ | Desk dùng thuật ngữ ngành có nhãn (VC · Đã dọn, chờ kiểm); **HK dùng câu thường**, không mã | Không thuật ngữ nội bộ: không "FOC", "OOO", "folio" (trừ EN "folio" trên bill), "VC/VD" |
| Lỗi | Nêu vấn đề + cách sửa + dữ liệu không mất; **không đổ lỗi** | Như trên, nhẹ nhàng hơn; luôn có kênh liên hệ |

Không dùng: "Lỗi hệ thống", "Thao tác không hợp lệ", "OK", "Có/Không" trên hộp xác nhận, dấu "!" trong thông báo lỗi, chữ in hoa toàn câu (trừ "ĐÃ THU ĐỦ" và tên trên giấy tờ).

## 2. Chính tả và quy ước viết

- **Dấu thanh kiểu mới, thống nhất**: hủy, khóa, hóa đơn, thủy, tùy, quý (không "huỷ", "khoá", "hoá"). Khớp decision-log và BR. (HR-19)
- Viết hoa chữ đầu câu và tên riêng; nhãn nút/menu viết hoa chữ đầu ("Đặt phòng mới", không "Đặt Phòng Mới").
- Số căn viết số: "căn 203"; tên căn giữ tiếng Anh ("The Sage").
- Trạng thái đơn: dùng **đúng nhãn ở mục 3.1**, khớp mã kỹ thuật `hold, confirmed, in_house, checked_out, cancelled, no_show` (BR-301). Không tạo trạng thái mới trong giao diện.
- Con số nghiệp vụ (giá, %, giờ, phí) **không viết cứng trong chuỗi**: dùng biến `{amount}`, `{pct}`, `{time}` lấy từ tham số; chú thích nguồn bằng mã BR khi cần ("BR-411").
- Ngắt dòng: không ngắt giữa số và đơn vị ("1.591.000 đ" dùng khoảng trắng không ngắt).

## 3. Bảng thuật ngữ (một khái niệm – một tên)

### 3.1 Trạng thái và thực thể
| Khái niệm | Dùng (VI) | EN | Không dùng | Ghi chú |
|---|---|---|---|---|
| `hold` | Giữ chỗ · chờ cọc | On hold · awaiting deposit | Tạm giữ, Booking tạm | BR-301 |
| `confirmed` | Đã xác nhận | Confirmed | Đã đặt, OK | |
| `in_house` | Đang ở | In house | Đã check-in, Đang lưu trú | |
| `checked_out` | Đã trả phòng | Checked out | Đã check-out, Out | |
| `cancelled` | Đã hủy | Cancelled | Huỷ, Cx | |
| Định mức căn (`base_occupancy`) | Định mức | Standard occupancy | Sức chứa chuẩn, tiêu chuẩn | Số người đã gồm trong giá (BR-110) |
| Sức chứa tối đa (`max_occupancy`) | Tối đa | Maximum | Sức chứa | = định mức + 1 (ESC-014) |
| Chỗ ngủ của người vượt định mức | Sofa | Sofa | Nệm phụ, giường phụ (giường phụ chỉ dùng cho giường 1m4 của 302/402) | INV 16/10 |
| Bộ đồ cho người vượt định mức | Bộ đồ dùng thêm | Extra amenity kit | Bộ đồ phụ, set phụ | 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – không gối (INV 16/10) |
| Đơn dài hạn ở R2 (`externalContract`) | Đơn dài hạn nhập tay · HĐ ngoài hệ thống | Manual long-stay booking · lease outside the app | HĐ tạm, đơn HĐ | US-017 AC5a |
| `no_show` | Không đến | No-show | Bỏ phòng | |
| Khối OOO | Khóa phòng | Out of order | Phòng hỏng (trên rack), Khoá | không phải trạng thái đơn (BR-804) |
| Folio (nội bộ) | Folio | Folio | Sổ phòng | chỉ trong Desk |
| Bill đưa khách | Phiếu thanh toán | Guest folio | Bill, Hoá đơn | "Hóa đơn" chỉ dùng cho hóa đơn GTGT/điện tử (HR-19) |
| Hóa đơn điện tử | Hóa đơn điện tử | E-invoice | HĐĐT (trên giao diện) | |
| Hợp đồng dài hạn | Hợp đồng dài hạn · viết tắt "HĐ" trên rack | Long-term lease | Contract dài hạn | |
| Ký quỹ | Ký quỹ | Security deposit | Cọc (với dài hạn) | "Cọc" chỉ cho ngắn ngày (BR-305 vs 206) |
| Cọc | Cọc | Deposit | Đặt cọc trước | |
| FOC | Miễn phí (FOC) trong Desk; **"Miễn phí"** với khách | Complimentary / waiver | FOC trên bill khách | HR-13 |
| Người bán | Sale (nội bộ), CTV | Sales, Agent | Người chốt, Môi giới (trên UI) | Vai theo PRD U4 (HR-19) |
| Lễ tân trưởng | Lễ tân trưởng | Senior receptionist | Trưởng ca | PRD A5 |
| Khai báo lưu trú | Khai báo lưu trú (chung); "Khai báo tạm trú" (NN), "Thông báo lưu trú" (VN) | Residence registration | Đăng ký tạm trú | BR-602/603 |
| Giấy tờ | Giấy tờ | ID / ID document | Chứng từ tùy thân | |
| Kênh | Kênh | Channel | Nguồn | Trực tiếp, CTV / môi giới, Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka |
| `conflict_state = open` | Chưa gán căn – xung đột OTA | Unassigned – OTA conflict | Overbook, Trùng phòng (trên UI) | Làn riêng trên rack (erd mục 7) |
| `no_show` (hành động) | Đánh dấu không đến | Mark as no-show | Bỏ phòng, Hủy no-show | Không bao giờ tự động (BR-311) |
| Đổi căn (đơn chưa nhận) / Đổi phòng (khách đang ở) | Đổi căn / đổi ngày · Đổi phòng | Change room / dates · Move room | Chuyển phòng | B7 vs B14 – hai nút khác nhau |
| Báo đã chuyển cọc | Báo đã chuyển cọc | Report deposit sent | Xác nhận cọc (với CTV) | CTV chỉ báo, không xác nhận (A53 vs A04) |
| Mã tham chiếu lỗi | Mã tham chiếu | Reference | Mã lỗi RK-xxx | `Problem.requestId` – chỉ cho lỗi máy chủ |

### 3.1b Tên vai (mã vai `rbac-matrix.md` mục 1)
| Mã vai (code) | VI | EN | Ghi chú |
|---|---|---|---|
| `owner` | Chủ đầu tư | Owner | |
| `manager` | Quản lý | Manager | |
| `front_desk_lead` | Lễ tân trưởng | Senior receptionist | |
| `front_desk` | Lễ tân | Receptionist | gồm người trực đêm |
| `housekeeping` | Buồng phòng | Housekeeping | |
| `maintenance` | Bảo trì | Maintenance | |
| `sales_staff` | Sale nội bộ | Sales staff | thay "Sale" chung chung khi cần phân biệt với CTV |
| `collaborator` | CTV / môi giới | Agent | |
| khách (link) | Khách | Guest | không phải tài khoản |

### 3.2 Trạng thái buồng – hai cách nói (HR-13)
| Mã | Desk (mã · nhãn) | Buồng phòng (câu thường) | EN (Desk) | EN (HK) |
|---|---|---|---|---|
| VC | VC · Đã dọn, chờ kiểm | Đã dọn – chờ kiểm | VC · Cleaned, awaiting inspection | Cleaned – awaiting inspection |
| VI | VI · Đã kiểm, sẵn sàng | Sẵn sàng đón khách | VI · Inspected, ready | Ready for guests |
| VD | VD · Trống, cần dọn | Cần dọn (khách đã đi) | VD · Vacant dirty | Needs cleaning (guest left) |
| CL | CL · Đang dọn | Đang dọn | CL · Cleaning | Cleaning |
| OC | OC · Có khách, sạch | Khách đang ở – đã dọn | OC · Occupied clean | Guest staying – cleaned |
| OD | OD · Có khách, cần dọn | Khách đang ở – cần dọn | OD · Occupied dirty | Guest staying – needs cleaning |
| OOO | OOO · Khóa phòng, đang sửa | Đang sửa – không bán | OOO · Out of order | Under repair – not for sale |

Mức độ phiếu sửa (BR-809) – Desk: Cao / Trung bình / Thấp; buồng phòng: **Gấp / Trong ngày / Không gấp**.

## 4. Định dạng

| Loại | VI | EN | RU |
|---|---|---|---|
| Tiền | `1.591.000 đ` (dấu chấm nghìn, " đ" sau); rút gọn KPI: `36,0 tr`, `891k` chỉ ở Desk | `1,591,000 VND` | `1 591 000 ₫` (khoảng trắng nghìn) |
| USD tham khảo | `≈ 61 USD (tỷ giá 26.200, cập nhật 15/10)` – BR-004 | `≈ USD 61` | `≈ 61 USD` |
| Ngày | `15/10/2026`, có thứ: `T5 15/10` (Desk), `Thứ Năm 15/10` | `Thu 15 Oct 2026` | `чт, 15 окт. 2026` |
| Giờ | 24 giờ `14:00` (mọi ngôn ngữ) | `14:00` | `14:00` |
| Khoảng ngày | `19/10 → 22/10 · 3 đêm` | `19 Oct → 22 Oct · 3 nights` | `19 → 22 окт. · 3 ночи` (dùng ICU plural) |
| Thời lượng còn lại | `còn 5 giờ 20 phút`, `Đã quá hạn 15 phút` | `5 h 20 min left` | `осталось 5 ч 20 мин` |
| SĐT | `0912 345 678`; khách NN: `+84 912 345 678` | | |
| Số giấy tờ | che giữa `M12••••78`; hồ sơ chỉ 4 số cuối (BR-610) | | |

Số nhiều EN/RU dùng ICU MessageFormat (`{n, plural, one {# night} other {# nights}}`); RU cần dạng one/few/many.

## 5. Mẫu câu theo tình huống

### 5.1 Thông báo lỗi (HR-24)
Công thức: **[Chuyện gì xảy ra] + [Vì sao, nếu giúp ích] + [Làm gì tiếp] + [Dữ liệu vẫn còn]**.
- Lỗi trường: "Số điện thoại cần ít nhất 9 chữ số. Ví dụ: 0912 345 678."
- Lỗi nghiệp vụ: "Căn 203 đã có đơn của Ji-woo Park từ 19/10 đến 22/10. Chọn ngày khác hoặc một căn trống bên dưới."
- Lỗi tải: "Chưa tải được sơ đồ phòng. Có thể do mạng chập chờn. Dữ liệu của bạn không bị mất. Bấm Thử lại; nếu vẫn lỗi, báo quản lý mã tham chiếu 01JB-7Q4K." (mã tham chiếu = `Problem.requestId`; đợt 2 dùng mã minh họa RK-503 – đã bỏ)
- Cấm: "Lỗi!", "Dữ liệu không hợp lệ", "Bạn đã nhập sai".

### 5.2 Hộp xác nhận (HR-06, US-135)
Tiêu đề: câu hỏi có đối tượng ("Hủy giữ chỗ căn 103?"). Thân: hậu quả cụ thể. Nút: "Giữ lại đơn" (an toàn) / "Hủy giữ chỗ" (lặp động từ). Không "OK/Có/Không".
Áp dụng đủ 7 hành động US-135 AC1: hủy giữ chỗ/hủy đơn, đánh dấu không đến, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ khách, đóng phiếu sửa (mở khóa phòng), xóa sớm ảnh giấy tờ – chuỗi `confirm.*`, `cancel.*`, `noshow.*`, `checkout.complete_confirm_*`. Số tiền/khoảng ngày trong hộp lấy từ API `dryRun=true` (hủy, trả muộn) hoặc `checkout-summary`, không tự tính ở client.

### 5.2b Thông báo lỗi từ API (`Problem.code`)
- Client hiển thị theo `code` + chuỗi `error.<CODE>` (bảng mục 8, 37 mã khớp `openapi.yaml` + `DEVICE_NOT_TRUSTED` mới của SEC – SR-DEV-03, ARC cần thêm vào bảng mã), **không** hiện `title`/`detail` thô của server.
- Lỗi theo trường (`VALIDATION_FAILED`): mỗi `errors[]` gắn vào đúng ô (`aria-describedby`), tiêu đề form chỉ tóm tắt số ô cần sửa.
- Lỗi máy chủ (5xx, không có `code`): `error.server` + mã tham chiếu `requestId`. Mất mạng (không có phản hồi): banner mất mạng, không hiện mã.
- Lỗi nêu tên khách (trùng phòng, trả muộn) chỉ hiện tên khi vai được xem D01 đầy đủ (lễ tân trở lên); vai khác dùng bản không tên (`booking.error.conflict_noname`).
- Mã "lỗi lập trình" (`PRECONDITION_REQUIRED`, `IDEMPOTENCY_KEY_REUSED`) vẫn có câu thân thiện nhưng FE phải ghi log để sửa.

### 5.3 Trạng thái rỗng
Nói sự thật tích cực + bước tiếp: "Hết việc rồi! Không còn việc nào hôm nay. Có việc mới sẽ hiện ở đây."

### 5.4 Mất mạng
Desk: "Mất kết nối. Dữ liệu lúc 10:42 – đang kết nối lại. Chưa tạo/sửa đơn được để tránh đặt trùng." HK: "Mất mạng. Bấm vẫn được – sẽ tự gửi khi có mạng (2 thao tác đang chờ)."

### 5.5 Phụ thu / tiền
Luôn nêu số tiền + cơ sở + mã BR: "Phụ thu nhận sớm: 238.000 đ (30% giá đêm đầu, BR-411)". Mặc định: "Nhận đúng giờ chuẩn – không phụ thu".

### 5.6 Nội dung pháp lý (đồng ý lưu giấy tờ, chính sách hủy, nội quy)
- Câu ngắn, nêu thời hạn và quyền từ chối: "Không bắt buộc. Nếu không đồng ý, chúng tôi chỉ dùng thông tin để khai báo và không lưu ảnh."
- **Bản EN/RU phải do người dịch duyệt**, không dùng dịch máy (HR-01). Văn bản cuối cùng chờ SEC/luật sư (ESC-001).

## 6. Đa ngôn ngữ (i18n)

- Ngôn ngữ: **VI + EN bắt buộc** (DoD); **RU thứ 3** – app khách R3 (US-115), mẫu tin nhắn từ R2 (decision-log PO). Giao diện nhân viên: VI (có sẵn EN).
- Key dạng `khu.vực.mục` (ví dụ `checkin.verify.passport`); không ghép câu từ nhiều mảnh; biến đặt tên rõ (`{room}`, `{guest}`).
- Thiếu bản dịch → dùng EN (fallback), không hiện key. Wireframe tô viền cam chuỗi RU đang fallback.
- Chừa chỗ chữ dài +40% (RU, DE); không đặt chữ trong ảnh.
- Ngôn ngữ khách: mặc định theo trình duyệt → theo hồ sơ khách → VI; đổi tay ở đầu trang, ghi nhớ theo đơn.
- **Chữ tự do của nhân viên gửi khách** (lý do từ chối yêu cầu, phản hồi): chọn từ danh sách lý do đã dịch (`guest.req.decline.*`); ghi chú tự do là tùy chọn, hiện dưới nhãn `guest.req.staff_note` "Ghi chú của lễ tân (tiếng Việt)" và bọc `lang="vi"` (Bước 4, FB-R1-UXR-UXD-06).
- Màn chưa đủ RU: không trộn RU/EN mà không báo – hiện `guest.lang.ru_soon`; mọi chuỗi dự phòng gắn `lang` của ngôn ngữ thật.
- Bill song ngữ VI/EN cho khách NN; mở rộng RU theo ngôn ngữ hồ sơ khách (HR-25, R3).

## 7. Mẫu tin nhắn (US-125 – lễ tân/sale sao chép gửi qua nhóm chat/Zalo)

Biến lấy từ đơn; giờ chuẩn 14:00/12:00 lấy từ tham số BR-401 (ghi trong mẫu để dễ đọc – FE thay bằng biến `{checkin_time}`/`{checkout_time}`). Bản RU là **nháp do UXD soạn – cần người bản ngữ duyệt trước khi dùng**.

| Key | Tình huống | Tiếng Việt | English | Русский (nháp – cần người bản ngữ duyệt) |
|---|---|---|---|---|
| `msg.booking_confirmed` | Xác nhận đặt phòng | Chào {name}, OTTIMO xác nhận đặt phòng {code}: căn {room}, {from} → {to} ({nights} đêm). Nhận phòng từ 14:00, trả phòng trước 12:00. Đã cọc {deposit}, còn {balance} khi nhận phòng. Hủy: {cancel_policy_short}. Làm thủ tục trước để nhận phòng nhanh: {link} | Hi {name}, OTTIMO confirms booking {code}: room {room}, {from} → {to} ({nights} nights). Check-in from 14:00, check-out by 12:00. Deposit paid {deposit}, {balance} due at check-in. Cancellation: {cancel_policy_short}. Check in online for a faster arrival: {link} | Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: апартаменты {room}, {from} → {to} ({nights} ноч.). Заезд с 14:00, выезд до 12:00. Предоплата {deposit}, остаток {balance} при заселении. Отмена: {cancel_policy_short}. Онлайн-регистрация для быстрого заселения: {link} |
| `msg.deposit_received` | Đã nhận cọc (khách trực tiếp) | Chào {name}, OTTIMO đã nhận cọc {deposit} cho đơn {code} (căn {room}, {from} → {to}). Còn {balance} thanh toán khi nhận phòng. Chính sách hủy: {cancel_policy_short} | Hi {name}, OTTIMO has received your deposit of {deposit} for booking {code} (room {room}, {from} → {to}). {balance} is due at check-in. Cancellation: {cancel_policy_short} | Здравствуйте, {name}! OTTIMO получил предоплату {deposit} по бронированию {code} (апартаменты {room}, {from} → {to}). Остаток {balance} оплачивается при заселении. Отмена: {cancel_policy_short} |
| `msg.checkin_link` | Link check-in online | Chào {name}, để nhận phòng nhanh, vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút). | Hi {name}, to speed up your check-in, please send your IDs and arrival time here: {link} (about 2 minutes). | Здравствуйте, {name}! Чтобы заселение прошло быстрее, отправьте, пожалуйста, документы и время прибытия по ссылке: {link} (около 2 минут). |
| `msg.checkout_reminder` | Nhắc trả phòng (20:00 hôm trước – BR-425) | Chào {name}, ngày mai {date} là ngày trả phòng (trước 12:00). Bạn muốn ở thêm hoặc trả muộn? Trả lời tại: {link} | Hi {name}, tomorrow {date} is your check-out day (by 12:00). Would you like to stay longer or check out late? Reply here: {link} | Здравствуйте, {name}! Завтра, {date}, день выезда (до 12:00). Хотите продлить проживание или выехать позже? Ответьте здесь: {link} |
| `msg.bill` | Gửi bill | Cảm ơn {name} đã lưu trú tại OTTIMO. Bill {bill_no}: {amount}. Xem chi tiết: {link} | Thank you for staying at OTTIMO, {name}. Folio {bill_no}: {amount}. Details: {link} | Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link} |
| `msg.utility_bill` | Hóa đơn điện nước tháng (dài hạn) | Chào {name}, hóa đơn điện nước kỳ {period}: điện {kwh} kWh, nước {m3} m³, tổng {amount}, hạn thanh toán {due}. Ảnh công tơ và chi tiết: {link} | Hi {name}, your utilities bill for {period}: electricity {kwh} kWh, water {m3} m³, total {amount}, due {due}. Meter photos and details: {link} | Здравствуйте, {name}! Счёт за коммунальные услуги за {period}: электричество {kwh} кВт·ч, вода {m3} м³, итого {amount}, оплатить до {due}. Фото счётчиков и детали: {link} |
| `msg.house_rules_smoking` | Nhắc nội quy hút thuốc | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn! | Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you! | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо! |
| `msg.hot_water_issue` | Báo đang xử lý sự cố nước nóng | Chào {name}, OTTIMO đã nhận báo mất nước nóng căn {room}. Kỹ thuật sẽ có mặt trước {time}. Xin lỗi vì bất tiện! | Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. Sorry for the inconvenience! | Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства! |

Biến `{deposit}`, `{balance}` lấy từ folio; `{cancel_policy_short}` lấy từ tham số `cancel_policy_direct` – **chờ ESC-006**, thiếu thì mẫu hiện ⟨…⟩ và cảnh báo (L10 10.2). Không bao giờ đưa mã cửa/mã xác minh vào mẫu.

## 8. Bảng chuỗi VI / EN (luồng 1–10, hi-fi R2 + dùng chung, vai, mã lỗi API, bảo mật), cột RU chừa chỗ

Nguồn: `copy/strings-*.json` (sinh từ `tools/gen_strings.py`). Cột RU "⟨chừa chỗ⟩" = chưa dịch, hiện EN (gắn `lang="en"`). Tổng 1486 chuỗi + 8 mẫu tin nhắn (R2 Sprint 1: thêm 363 chuỗi cho hi-fi H13–H18 – nhóm "R2 hi-fi Sprint 3"; R2 Đợt 0: thêm 502 chuỗi cho hi-fi `hifi/` – nhóm "R2 hi-fi – …"; Bước 4 R1: thêm 100, sửa 14 – xem mục 9).

#### Chung

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `common.save` | Lưu | Save | ⟨chừa chỗ⟩ |  |
| `common.cancel` | Hủy | Cancel | ⟨chừa chỗ⟩ | Chỉ dùng cho nút đóng form không lưu. Hủy đơn dùng 'Hủy đơn' |
| `common.close` | Đóng | Close | Закрыть |  |
| `common.back` | Quay lại | Back | Назад |  |
| `common.next` | Tiếp tục | Continue | Далее |  |
| `common.edit_back` | ← Sửa lại | ← Go back and edit | ⟨chừa chỗ⟩ |  |
| `common.retry` | Thử lại | Try again | Повторить |  |
| `common.undo` | Hoàn tác | Undo | ⟨chừa chỗ⟩ |  |
| `common.search_placeholder` | Tìm tên khách, SĐT, mã đơn, số căn… | Search guest name, phone, booking code, room… | ⟨chừa chỗ⟩ |  |
| `common.required` | Bắt buộc | Required | ⟨chừa chỗ⟩ |  |
| `common.optional` | Không bắt buộc | Optional | ⟨chừa chỗ⟩ |  |
| `common.loading` | Đang tải… | Loading… | Загрузка… |  |
| `common.saving` | Đang lưu… | Saving… | ⟨chừa chỗ⟩ |  |
| `common.saved` | Đã lưu | Saved | ⟨chừa chỗ⟩ |  |
| `common.offline_banner` | Mất kết nối. Thao tác của bạn được giữ lại và sẽ tự gửi khi có mạng. | You're offline. Your changes are kept and will be sent when you're back online. | Нет подключения. Изменения сохранены и будут отправлены, когда связь восстановится. |  |
| `common.offline_queued` | {count} thao tác đang chờ gửi | {count} changes waiting to send | ⟨chừa chỗ⟩ |  |
| `common.unsaved_title` | Bỏ các thay đổi chưa lưu? | Discard unsaved changes? | ⟨chừa chỗ⟩ |  |
| `common.unsaved_body` | Bạn đã nhập thông tin trong form này. Nếu đóng, thông tin sẽ mất. | You've entered information in this form. If you close it, it will be lost. | ⟨chừa chỗ⟩ |  |
| `common.unsaved_keep` | Tiếp tục nhập | Keep editing | ⟨chừa chỗ⟩ |  |
| `common.unsaved_discard` | Bỏ thay đổi | Discard | ⟨chừa chỗ⟩ |  |
| `common.error_generic_title` | Chưa tải được dữ liệu | Couldn't load data | Не удалось загрузить данные |  |
| `common.error_generic_body` | Có thể do mạng chập chờn. Dữ liệu của bạn không bị mất. Bấm Thử lại; nếu vẫn lỗi, báo quản lý mã tham chiếu {request_id}. | This may be a network problem. Nothing has been lost. Tap Try again; if it keeps failing, give your manager the reference {request_id}. | ⟨chừa chỗ⟩ | Đợt 4: thay mã minh họa (RK-503…) bằng `Problem.requestId` của ARC |
| `common.currency_vnd` | {amount} đ | {amount} VND | {amount} VND |  |
| `common.approx_usd` | ≈ {usd} USD (tỷ giá {rate}, cập nhật {date}) | ≈ {usd} USD (rate {rate}, updated {date}) | ⟨chừa chỗ⟩ |  |

#### Trạng thái đơn (BR-301)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `status.booking.hold` | Giữ chỗ · chờ cọc | On hold · awaiting deposit | ⟨chừa chỗ⟩ | hold |
| `status.booking.confirmed` | Đã xác nhận | Confirmed | Подтверждено | confirmed |
| `status.booking.in_house` | Đang ở | In house | Проживает | in_house |
| `status.booking.checked_out` | Đã trả phòng | Checked out | Выезд оформлен | checked_out |
| `status.booking.cancelled` | Đã hủy | Cancelled | Отменено | cancelled |
| `status.booking.no_show` | Không đến | No-show | ⟨chừa chỗ⟩ | no_show |
| `status.block.ooo` | Khóa phòng | Out of order | ⟨chừa chỗ⟩ | Khối OOO – không phải trạng thái đơn (BR-804) |
| `status.booking.long_term` | Hợp đồng dài hạn | Long-term lease | ⟨chừa chỗ⟩ | Loại đơn, không phải trạng thái |

#### Trạng thái buồng (BR-801) – giao diện quản lý

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `status.room.VC` | VC · Đã dọn, chờ kiểm | VC · Cleaned, awaiting inspection | ⟨chừa chỗ⟩ | Bước 4 – thống nhất với hk.status.VC |
| `status.room.VI` | VI · Đã kiểm, sẵn sàng | VI · Inspected, ready | ⟨chừa chỗ⟩ |  |
| `status.room.VD` | VD · Trống, cần dọn | VD · Vacant dirty | ⟨chừa chỗ⟩ |  |
| `status.room.CL` | CL · Đang dọn | CL · Cleaning | ⟨chừa chỗ⟩ |  |
| `status.room.OC` | OC · Có khách, sạch | OC · Occupied clean | ⟨chừa chỗ⟩ |  |
| `status.room.OD` | OD · Có khách, cần dọn | OD · Occupied dirty | ⟨chừa chỗ⟩ |  |
| `status.room.OOO` | OOO · Khóa phòng, đang sửa | OOO · Out of order | ⟨chừa chỗ⟩ |  |

#### Trạng thái buồng – giao diện buồng phòng (HR-13, không dùng mã)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.status.VC` | Đã dọn – chờ kiểm | Cleaned – awaiting inspection | ⟨chừa chỗ⟩ | Một tên duy nhất cho VC (FB-R1-UXR-UXD-09); tông oak, không dùng tông ok |
| `hk.status.VI` | Sẵn sàng đón khách | Ready for guests | ⟨chừa chỗ⟩ |  |
| `hk.status.VD` | Cần dọn (khách đã đi) | Needs cleaning (guest left) | ⟨chừa chỗ⟩ |  |
| `hk.status.CL` | Đang dọn | Cleaning | ⟨chừa chỗ⟩ |  |
| `hk.status.OC` | Khách đang ở – đã dọn | Guest staying – cleaned | ⟨chừa chỗ⟩ |  |
| `hk.status.OD` | Khách đang ở – cần dọn | Guest staying – needs cleaning | ⟨chừa chỗ⟩ |  |
| `hk.status.OOO` | Đang sửa – không bán | Under repair – not for sale | ⟨chừa chỗ⟩ |  |

#### Trạng thái khai báo (BR-607) và kết quả kiểm tra (HR-07)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `status.reg.none` | Chưa có giấy tờ | No documents yet | ⟨chừa chỗ⟩ |  |
| `status.reg.partial` | Thiếu người | Missing guests | ⟨chừa chỗ⟩ |  |
| `status.reg.review` | Cần kiểm tra | Needs review | ⟨chừa chỗ⟩ |  |
| `status.reg.scanned` | Đủ giấy tờ · chờ khai báo | Documents complete · not yet registered | ⟨chừa chỗ⟩ |  |
| `status.reg.sent` | Đã gửi khai báo | Registration submitted | ⟨chừa chỗ⟩ |  |
| `status.reg.confirmed` | Công an đã xác nhận | Confirmed by police | ⟨chừa chỗ⟩ |  |
| `status.reg.pre` | Khách đã gửi trước qua app | Sent in advance by guest | ⟨chừa chỗ⟩ |  |
| `status.reg.needs_update` | Cần cập nhật ngày đi | Departure date needs updating | ⟨chừa chỗ⟩ |  |
| `status.reg.updated` | Đã cập nhật ngày đi | Departure date updated | ⟨chừa chỗ⟩ |  |
| `status.reg.void` | Không cần khai (đơn đã hủy) | Not required (booking cancelled) | ⟨chừa chỗ⟩ | `void` – SM-05 K11 |
| `check.pass` | Đạt | Pass | ⟨chừa chỗ⟩ |  |
| `check.fail` | Không đạt | Fail | ⟨chừa chỗ⟩ |  |
| `check.unknown` | Chưa kiểm được – cần kiểm tay | Not verified – check manually | ⟨chừa chỗ⟩ |  |

#### Luồng 2 – Room rack, đặt phòng mới, chi tiết đơn

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `fo.rack.title` | Sơ đồ phòng | Room rack | ⟨chừa chỗ⟩ |  |
| `fo.rack.range` | 14 ngày từ {from} | 14 days from {from} | ⟨chừa chỗ⟩ |  |
| `fo.rack.today` | Hôm nay | Today | ⟨chừa chỗ⟩ |  |
| `fo.rack.legend` | Chú giải | Legend | ⟨chừa chỗ⟩ |  |
| `fo.rack.new_booking` | + Đặt phòng mới | + New booking | ⟨chừa chỗ⟩ |  |
| `fo.rack.empty_cell_hint` | Bấm ô trống để đặt căn {room} từ {date} | Click an empty cell to book room {room} from {date} | ⟨chừa chỗ⟩ |  |
| `fo.rack.view_list` | Xem dạng danh sách | List view | ⟨chừa chỗ⟩ |  |
| `fo.rack.view_grid` | Xem dạng lưới | Grid view | ⟨chừa chỗ⟩ |  |
| `fo.rack.empty_title` | Chưa có đơn nào trong 14 ngày này | No bookings in these 14 days | ⟨chừa chỗ⟩ |  |
| `fo.rack.empty_body` | Cả 10 căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu. | All 10 rooms are free. Click an empty cell or New booking to start. | ⟨chừa chỗ⟩ |  |
| `fo.rack.error_title` | Chưa tải được sơ đồ phòng | Couldn't load the room rack | ⟨chừa chỗ⟩ |  |
| `fo.rack.stale` | Dữ liệu lúc {time}. Đang kết nối lại… | Data as of {time}. Reconnecting… | ⟨chừa chỗ⟩ |  |
| `fo.rack.mismatch` | Căn {room}: buồng ghi "có khách" nhưng không có đơn đang ở. Kiểm tra lại. | Room {room}: marked occupied but no in-house booking. Please check. | ⟨chừa chỗ⟩ | BR-806 |
| `fo.tabs.arrivals` | Khách đến ({n}) | Arrivals ({n}) | ⟨chừa chỗ⟩ |  |
| `fo.tabs.departures` | Khách đi ({n}) | Departures ({n}) | ⟨chừa chỗ⟩ |  |
| `fo.tabs.in_house` | Đang ở ({n}) | In house ({n}) | ⟨chừa chỗ⟩ |  |
| `fo.tabs.holds` | Giữ chỗ chưa cọc ({n}) | Holds awaiting deposit ({n}) | ⟨chừa chỗ⟩ | BR-404 |
| `booking.new.title` | Đặt phòng mới | New booking | ⟨chừa chỗ⟩ |  |
| `booking.field.room` | Căn | Room | ⟨chừa chỗ⟩ |  |
| `booking.field.channel` | Kênh | Channel | ⟨chừa chỗ⟩ |  |
| `booking.field.dates` | Ngày đến – ngày đi | Arrival – departure | ⟨chừa chỗ⟩ |  |
| `booking.field.nights` | {n} đêm | {n} nights | ⟨chừa chỗ⟩ |  |
| `booking.field.guests` | Số khách | Guests | ⟨chừa chỗ⟩ |  |
| `booking.field.guests_help` | Người lớn và trẻ em. Mỗi người cần giấy tờ để khai báo lưu trú. | Adults and children. Each person needs an ID for residence registration. | ⟨chừa chỗ⟩ |  |
| `booking.field.rate` | Giá mỗi đêm | Rate per night | ⟨chừa chỗ⟩ |  |
| `booking.field.rate_source` | Nguồn giá: {source} | Rate source: {source} | ⟨chừa chỗ⟩ | HR-18: luôn hiện nguồn giá |
| `booking.field.ota_code` | Mã đặt phòng OTA | OTA booking reference | ⟨chừa chỗ⟩ |  |
| `booking.field.ota_paid` | OTA đã thu tiền phòng | Room paid to OTA | ⟨chừa chỗ⟩ |  |
| `booking.field.guest` | Khách đứng tên | Main guest | ⟨chừa chỗ⟩ |  |
| `booking.field.phone` | Số điện thoại / Zalo | Phone / Zalo | ⟨chừa chỗ⟩ |  |
| `booking.field.phone_help` | Bắt buộc với kênh Trực tiếp và CTV | Required for Direct and Agent bookings | ⟨chừa chỗ⟩ |  |
| `booking.summary.total` | Tổng tiền phòng | Room total | ⟨chừa chỗ⟩ |  |
| `booking.summary.deposit` | Cọc cần thu | Deposit due | ⟨chừa chỗ⟩ | Căn cứ BR-305 – chỉ ghi ở ghi chú (FB-R1-UXR-UXD-08) |
| `booking.create` | Tạo đơn | Create booking | ⟨chừa chỗ⟩ |  |
| `booking.create_hold` | Giữ chỗ đến {time} | Hold until {time} | ⟨chừa chỗ⟩ | Hạn theo BR-302 do server tính (`hold.expiresAt`) – không ghi cứng số giờ |
| `booking.error.conflict_noname` | Căn {room} đã kín từ {from} đến {to}. Chọn ngày khác hoặc một căn trống bên dưới. | Room {room} is taken from {from} to {to}. Choose other dates or a free room below. | ⟨chừa chỗ⟩ | Dùng cho sales_staff/collaborator – không lộ tên khách (rbac ghi chú 3) |
| `booking.error.conflict` | Căn {room} đã có đơn của {guest} từ {from} đến {to}. Chọn ngày khác hoặc một căn trống bên dưới. | Room {room} is already booked by {guest} from {from} to {to}. Choose other dates or a free room below. | ⟨chừa chỗ⟩ |  |
| `booking.error.conflict_alt` | Căn trống cùng nhóm: {rooms} | Free rooms in the same group: {rooms} | ⟨chừa chỗ⟩ |  |
| `booking.error.ooo` | Căn {room} đang khóa sửa chữa từ {from} đến {to}. | Room {room} is out of order from {from} to {to}. | ⟨chừa chỗ⟩ |  |
| `booking.error.past_date` | Ngày đến không được trước hôm nay. | Arrival can't be before today. | ⟨chừa chỗ⟩ |  |
| `booking.error.phone` | Số điện thoại cần ít nhất 9 chữ số. Ví dụ: 0912 345 678. | Phone number needs at least 9 digits. Example: +84 912 345 678. | ⟨chừa chỗ⟩ |  |
| `booking.error.dup_guest` | SĐT này đã thuộc hồ sơ {guest}. Dùng hồ sơ đó? | This phone number belongs to {guest}. Use that profile? | ⟨chừa chỗ⟩ |  |
| `booking.error.rate_empty` | Nhập giá mỗi đêm (lớn hơn 0). | Enter a rate per night (above 0). | ⟨chừa chỗ⟩ |  |
| `booking.error.rate_range` | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Rate must be between {min} and {max} (floor – ceiling for {group}). | ⟨chừa chỗ⟩ | BR-105 |
| `booking.error.server_conflict` | Căn vừa được người khác đặt trong lúc bạn nhập. Thông tin của bạn vẫn còn – chọn căn khác để lưu. | Someone else just booked this room while you were typing. Your details are kept – choose another room to save. | ⟨chừa chỗ⟩ | BR-906 |
| `booking.toast.created` | Đã tạo đơn {code} | Booking {code} created | ⟨chừa chỗ⟩ |  |
| `drawer.progress.short` | Đặt · Giữ chỗ · Đã cọc · Nhận phòng · Trả phòng | Booked · Hold · Deposit paid · Check-in · Check-out | ⟨chừa chỗ⟩ |  |
| `drawer.progress.long` | Báo giá · Giữ chỗ · Ký HĐ & ký quỹ · Nhận phòng · Thu theo kỳ | Quote · Hold · Lease & deposit · Move-in · Periodic billing | ⟨chừa chỗ⟩ |  |
| `drawer.hold.expires` | Hết hạn giữ chỗ sau {time} | Hold expires in {time} | ⟨chừa chỗ⟩ | HR-16 |
| `drawer.hold.expired` | Giữ chỗ đã hết hạn lúc {time} – đơn đã tự hủy | Hold expired at {time} – booking auto-cancelled | ⟨chừa chỗ⟩ |  |
| `drawer.folio.title` | Folio | Folio | ⟨chừa chỗ⟩ |  |
| `drawer.folio.room` | Tiền phòng ({n} đêm) | Room charges ({n} nights) | ⟨chừa chỗ⟩ |  |
| `drawer.folio.paid` | Đã thu | Paid | ⟨chừa chỗ⟩ |  |
| `drawer.folio.balance` | Còn phải thu | Balance due | ⟨chừa chỗ⟩ |  |
| `drawer.folio.settled` | Đã thanh toán đủ | Paid in full | ⟨chừa chỗ⟩ |  |
| `drawer.action.confirm_deposit` | Xác nhận đã nhận cọc | Confirm deposit received | ⟨chừa chỗ⟩ |  |
| `drawer.action.cancel_hold` | Hủy giữ chỗ | Cancel hold | ⟨chừa chỗ⟩ |  |
| `drawer.action.cancel_booking` | Hủy đơn | Cancel booking | ⟨chừa chỗ⟩ |  |
| `drawer.action.check_in` | Nhận phòng | Check in | ⟨chừa chỗ⟩ |  |
| `drawer.action.check_out` | Trả phòng | Check out | ⟨chừa chỗ⟩ |  |
| `drawer.action.send_checkin_link` | Gửi link check-in online | Send online check-in link | ⟨chừa chỗ⟩ |  |
| `drawer.action.extend` | Gia hạn | Extend stay | ⟨chừa chỗ⟩ |  |
| `drawer.action.late_checkout` | Trả muộn | Late check-out | ⟨chừa chỗ⟩ |  |
| `drawer.action.docs` | Giấy tờ & khai báo | IDs & registration | ⟨chừa chỗ⟩ |  |
| `drawer.action.extend_hold` | Gia hạn giữ chỗ (1 lần) | Extend hold (once) | ⟨chừa chỗ⟩ | B3, A03 |
| `drawer.action.deposit_notice` | Báo đã chuyển cọc | Report deposit sent | ⟨chừa chỗ⟩ | A53 – chỉ sales_staff/collaborator |
| `drawer.deposit_notice.help` | Gửi ảnh biên nhận. Lễ tân hoặc sale nội bộ kiểm tiền vào tài khoản OTTIMO rồi xác nhận. | Attach the receipt. Reception or in-house sales will check OTTIMO's account and confirm. | ⟨chừa chỗ⟩ |  |
| `drawer.deposit_notice.sent` | Đã báo chuyển cọc lúc {time} – chờ xác nhận | Deposit reported at {time} – awaiting confirmation | ⟨chừa chỗ⟩ |  |
| `drawer.action.move` | Đổi căn / đổi ngày | Change room / dates | ⟨chừa chỗ⟩ | B7, A07 |
| `drawer.action.postpone` | Dời ngày thay vì hủy | Postpone instead of cancelling | ⟨chừa chỗ⟩ | B8, A08 – chỉ manager/owner |
| `drawer.action.change_room` | Đổi phòng | Move room | ⟨chừa chỗ⟩ | B14, A15 |
| `drawer.action.early_departure` | Trả sớm | Early departure | ⟨chừa chỗ⟩ | B16, A17 |
| `drawer.action.no_show` | Đánh dấu không đến | Mark as no-show | ⟨chừa chỗ⟩ | B11, A09 |
| `drawer.action.restore_no_show` | Khôi phục đơn không đến | Restore no-show | ⟨chừa chỗ⟩ | B12 – manager/owner |
| `drawer.action.request_restore` | Gửi yêu cầu khôi phục | Request restore | ⟨chừa chỗ⟩ | A10 = D – front_desk/front_desk_lead |
| `drawer.action.undo_checkin` | Hoàn tác nhận phòng | Undo check-in | ⟨chừa chỗ⟩ | B17 – manager/owner |
| `fo.rack.unassigned_lane` | Chưa gán căn – xung đột OTA ({n}) | Unassigned – OTA conflict ({n}) | ⟨chừa chỗ⟩ | erd mục 7, `Rack.unassigned` |
| `fo.rack.unassigned_help` | Đơn OTA về khi căn đã kín. Gán căn trống cùng nhóm hoặc cao hơn, hoặc đổi phòng cho khách khác. Chưa gán căn thì chưa nhận phòng được. | This OTA booking arrived after the room was taken. Assign a free room in the same or a higher group, or move another guest. It can't be checked in until a room is assigned. | ⟨chừa chỗ⟩ | BR-312 |
| `fo.rack.assign_room` | Gán căn | Assign room | ⟨chừa chỗ⟩ |  |
| `fo.rack.arriving_today` | Có khách đến hôm nay | Arrival today | ⟨chừa chỗ⟩ | Rack dạng xem của housekeeping/maintenance – không tên khách |
| `fo.rack.arriving_tomorrow` | Có khách đến ngày mai | Arrival tomorrow | ⟨chừa chỗ⟩ |  |
| `fo.rack.sold_out` | Đã kín | Taken | ⟨chừa chỗ⟩ | Rack dạng xem của sales_staff/collaborator (`RackBar.kind = unavailable`) |
| `cancel.title` | Hủy giữ chỗ căn {room}? | Cancel the hold on room {room}? | ⟨chừa chỗ⟩ |  |
| `cancel.consequence` | Căn {room} sẽ mở bán lại từ {from} đến {to} trên {channels} kênh. Khách tiềm năng {lead} trở về "Đã báo giá". | Room {room} will be back on sale from {from} to {to} on {channels} channels. Lead {lead} returns to "Quoted". | ⟨chừa chỗ⟩ |  |
| `cancel.reason` | Lý do hủy | Cancellation reason | ⟨chừa chỗ⟩ |  |
| `cancel.reason.changed_mind` | Khách đổi ý | Guest changed their mind | ⟨chừa chỗ⟩ |  |
| `cancel.reason.found_other` | Khách tìm được chỗ khác | Guest found another place | ⟨chừa chỗ⟩ |  |
| `cancel.reason.price` | Giá chưa phù hợp | Price not suitable | ⟨chừa chỗ⟩ |  |
| `cancel.reason.dates` | Đổi ngày | Change of dates | ⟨chừa chỗ⟩ |  |
| `cancel.reason.unreachable` | Không liên lạc được | Guest unreachable | ⟨chừa chỗ⟩ |  |
| `cancel.reason.other` | Khác (ghi rõ) | Other (please specify) | ⟨chừa chỗ⟩ |  |
| `cancel.fee_none` | Không thu phí (giữ chỗ chưa cọc) | No fee (hold without deposit) | ⟨chừa chỗ⟩ | BR-308 |
| `cancel.confirm` | Hủy giữ chỗ | Cancel hold | ⟨chừa chỗ⟩ |  |
| `cancel.keep` | Giữ lại đơn | Keep booking | ⟨chừa chỗ⟩ |  |

#### Luồng 3 – Nhận phòng, giấy tờ, khai báo, mã cửa

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `checkin.title` | Nhận phòng · Căn {room} · {guest} | Check-in · Room {room} · {guest} | ⟨chừa chỗ⟩ |  |
| `checkin.step.docs` | Giấy tờ | IDs | ⟨chừa chỗ⟩ |  |
| `checkin.step.verify` | Kiểm tra | Verify | ⟨chừa chỗ⟩ |  |
| `checkin.step.register` | Khai báo | Register | ⟨chừa chỗ⟩ |  |
| `checkin.step.handover` | Giao mã & hoàn tất | Hand over & finish | ⟨chừa chỗ⟩ |  |
| `checkin.room_not_ready` | Căn {room} đang "{status}" – chưa sẵn sàng. Gửi lễ tân trưởng xác nhận kèm lý do để nhận phòng. | Room {room} is "{status}" – not ready. Send it to a senior receptionist with a reason to approve. | ⟨chừa chỗ⟩ | BR-402; A12 = D cho front_desk |
| `checkin.room_not_ready_lead` | Căn {room} đang "{status}" – chưa sẵn sàng. Bạn xác nhận ngoại lệ được: ghi lý do; buồng sẽ chuyển "Có khách, cần dọn" và có việc dọn gấp. | Room {room} is "{status}" – not ready. You can approve the exception: add a reason; the room becomes "Occupied, dirty" with an urgent cleaning task. | ⟨chừa chỗ⟩ | front_desk_lead trở lên (R7) |
| `checkin.cond.title` | Điều kiện nhận phòng | Check-in conditions | ⟨chừa chỗ⟩ | BR-402 |
| `checkin.cond.room_ready` | Buồng sẵn sàng (VI hoặc VC) | Room ready (VI or VC) | ⟨chừa chỗ⟩ | `room_ready` |
| `checkin.cond.balance_paid` | Đã thu đủ hoặc OTA đã trả/đảm bảo | Paid in full, or prepaid/guaranteed by OTA | ⟨chừa chỗ⟩ | `balance_paid` |
| `checkin.cond.main_guest_document` | Có giấy tờ người đứng tên | Main guest's ID on file | ⟨chừa chỗ⟩ | `main_guest_document` |
| `checkin.cond.not_unassigned` | Đơn đã được gán căn | Room assigned | ⟨chừa chỗ⟩ | `not_unassigned` – đơn OTA xung đột |
| `checkin.docs.progress` | Đã có giấy tờ {have}/{need} người | IDs collected for {have} of {need} guests | ⟨chừa chỗ⟩ |  |
| `checkin.docs.scan` | Chụp hoặc tải ảnh giấy tờ | Take or upload a photo of the ID | ⟨chừa chỗ⟩ |  |
| `checkin.docs.manual` | Nhập tay | Enter manually | ⟨chừa chỗ⟩ |  |
| `checkin.docs.from_app` | Khách đã gửi trước qua app | Sent in advance by the guest | ⟨chừa chỗ⟩ |  |
| `checkin.docs.reading` | Đang đọc giấy tờ… | Reading the ID… | ⟨chừa chỗ⟩ |  |
| `checkin.docs.read_failed` | Không đọc được ảnh (mờ hoặc lóa). Chụp lại ở chỗ sáng hơn, hoặc nhập tay. | Couldn't read the photo (blurry or glare). Retake it in better light, or enter it manually. | ⟨chừa chỗ⟩ |  |
| `checkin.docs.empty` | Chưa có giấy tờ nào. Bắt đầu với người đứng tên. | No IDs yet. Start with the main guest. | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.full_name` | Họ tên (như trên giấy tờ) | Full name (as on ID) | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.doc_type` | Loại giấy tờ | ID type | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.doc_no` | Số giấy tờ | ID number | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.dob` | Ngày sinh | Date of birth | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.nationality` | Quốc tịch | Nationality | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.passport_expiry` | Hạn hộ chiếu | Passport expiry | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.visa` | Thị thực / miễn thị thực đến ngày | Visa / visa exemption valid until | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.entry_date` | Ngày nhập cảnh | Date of entry | ⟨chừa chỗ⟩ |  |
| `checkin.consent.label` | Khách đồng ý cho OTTIMO lưu ảnh giấy tờ trong {days} ngày sau trả phòng | Guest agrees OTTIMO may keep ID photos for {days} days after check-out | ⟨chừa chỗ⟩ | BR-609/610 – số ngày lấy từ tham số |
| `checkin.consent.help` | Không đồng ý vẫn khai báo được: chỉ lưu các trường cần thiết, không lưu ảnh. | If the guest declines, registration still works: only the required fields are kept, no photos. | ⟨chừa chỗ⟩ |  |
| `checkin.consent.yes` | Đồng ý lưu ảnh | Agrees to keep photos | ⟨chừa chỗ⟩ | `decision = granted` – phải chọn 1 trong 2, không chọn sẵn |
| `checkin.consent.no` | Không đồng ý – xóa ảnh sau khi khai báo | Declines – delete photos after registration | ⟨chừa chỗ⟩ | `decision = refused` |
| `checkin.verify.name` | Tên khớp với đơn | Name matches booking | ⟨chừa chỗ⟩ |  |
| `checkin.verify.passport` | Hộ chiếu còn hạn sau ngày trả phòng ({date}) | Passport valid beyond check-out ({date}) | ⟨chừa chỗ⟩ |  |
| `checkin.verify.visa` | Thị thực còn hạn đến ngày trả phòng | Visa valid until check-out | ⟨chừa chỗ⟩ |  |
| `checkin.verify.headcount` | Đủ giấy tờ cho {need} khách | IDs for all {need} guests | ⟨chừa chỗ⟩ |  |
| `checkin.verify.fail_passport` | Hộ chiếu hết hạn {date}, trước ngày trả phòng {checkout}. Ghi cách xử lý trước khi sang bước khai báo. | Passport expires {date}, before check-out {checkout}. Record how you handled it before moving on to registration. | ⟨chừa chỗ⟩ | K5: cảnh báo không chặn nhận phòng (SEC R-REG-03) nhưng bắt buộc ghi xử lý |
| `checkin.verify.note_label` | Cách xử lý | How it was handled | ⟨chừa chỗ⟩ | `warningNotes[].note` – front_desk trở lên ghi, lưu tên người ghi |
| `checkin.verify.note_placeholder` | Ví dụ: khách xuất trình hộ chiếu mới số …; đã báo khách gia hạn thị thực | E.g. guest showed new passport no. …; guest told to extend visa | ⟨chừa chỗ⟩ |  |
| `checkin.verify.note_required` | Ghi cách xử lý cho mọi mục Không đạt hoặc Chưa kiểm được để tiếp tục. | Record how each Fail or Not verified item was handled to continue. | ⟨chừa chỗ⟩ |  |
| `checkin.verify.visa_short` | Thị thực hết hạn {date}, trước ngày trả phòng. Khai báo đến {date} và nhắc khách gia hạn trước {remind}. | Visa expires {date}, before check-out. Register until {date} and remind the guest to extend before {remind}. | ⟨chừa chỗ⟩ | BR-605 |
| `checkin.verify.unknown_help` | Hệ thống chưa đủ dữ liệu để kiểm. Hãy xem giấy tờ gốc và đánh dấu kết quả. | The system doesn't have enough data to check. Look at the original ID and mark the result. | ⟨chừa chỗ⟩ |  |
| `checkin.verify.mark_pass` | Tôi đã kiểm – Đạt | I checked – Pass | ⟨chừa chỗ⟩ |  |
| `checkin.verify.mark_fail` | Tôi đã kiểm – Không đạt | I checked – Fail | ⟨chừa chỗ⟩ |  |
| `reg.deadline` | Hạn khai báo: {time} | Registration deadline: {time} | ⟨chừa chỗ⟩ | BR-602/603 – hạn sớm hơn |
| `reg.deadline_left` | còn {duration} | {duration} left | ⟨chừa chỗ⟩ |  |
| `reg.deadline_overdue` | Đã quá hạn {duration} | Overdue by {duration} | ⟨chừa chỗ⟩ |  |
| `reg.type.foreigner` | Khai báo tạm trú người nước ngoài | Temporary residence declaration (foreign nationals) | ⟨chừa chỗ⟩ |  |
| `reg.type.citizen` | Thông báo lưu trú công dân Việt Nam | Residence notification (Vietnamese citizens) | ⟨chừa chỗ⟩ |  |
| `reg.step.copy` | 1. Sao chép từng trường theo đúng thứ tự trên cổng | 1. Copy each field in the portal's order | ⟨chừa chỗ⟩ |  |
| `reg.step.open` | 2. Mở cổng khai báo Bộ Công an | 2. Open the Ministry of Public Security portal | ⟨chừa chỗ⟩ |  |
| `reg.step.code` | 3. Dán mã hồ sơ cổng trả về | 3. Paste the file code returned by the portal | ⟨chừa chỗ⟩ |  |
| `reg.copy_field` | Sao chép | Copy | ⟨chừa chỗ⟩ |  |
| `reg.copied` | Đã chép | Copied | ⟨chừa chỗ⟩ |  |
| `reg.portal_opened` | Đã mở cổng – chưa có mã hồ sơ | Portal opened – no file code yet | ⟨chừa chỗ⟩ |  |
| `reg.code_label` | Mã hồ sơ | File code | ⟨chừa chỗ⟩ |  |
| `reg.code_error` | Nhập mã hồ sơ cổng trả về để đánh dấu đã khai báo. | Enter the file code returned by the portal to mark this as registered. | ⟨chừa chỗ⟩ | `portalReference` ≤ 64 ký tự, không có định dạng cố định (erd 4.7) |
| `reg.later` | Khai báo sau (thêm vào việc cần làm) | Register later (add to to-do list) | ⟨chừa chỗ⟩ |  |
| `reg.later_note` | Việc này sẽ nằm trên Tổng quan và nhắc lúc {times} cho đến khi xong. | This stays on the Overview and reminds you at {times} until done. | ⟨chừa chỗ⟩ |  |
| `handover.door_code` | Mã cửa | Door code | ⟨chừa chỗ⟩ |  |
| `handover.door_code_help` | Hiệu lực từ {from} đến {to}. Khách thấy mã trong app từ ngày nhận phòng. | Valid from {from} to {to}. The guest sees it in their app from arrival day. | ⟨chừa chỗ⟩ | BR-403 |
| `handover.cards` | Số thẻ phòng đã giao | Key cards issued | ⟨chừa chỗ⟩ |  |
| `handover.cards_help` | Tối đa 2 thẻ (1 chính + 1 dự phòng). Trả thiếu khi đi: tính phí theo bảng phí. | Up to 2 cards (1 main + 1 spare). Missing at check-out: fee per the fee list. | ⟨chừa chỗ⟩ | BR-511 |
| `handover.arrival_time` | Giờ nhận phòng thực tế | Actual check-in time | ⟨chừa chỗ⟩ |  |
| `handover.early_toggle` | Khách nhận sớm trước {std} | Guest checks in early, before {std} | ⟨chừa chỗ⟩ |  |
| `handover.early_none` | Nhận đúng giờ chuẩn – không phụ thu | Standard check-in time – no surcharge | ⟨chừa chỗ⟩ | HR-04 mặc định |
| `handover.early_fee` | Phụ thu nhận sớm: {amount} ({pct}% giá đêm đầu) | Early check-in surcharge: {amount} ({pct}% of first night) | ⟨chừa chỗ⟩ | BR-411 |
| `handover.early_confirm` | Tôi đã báo khách khoản phụ thu này | I've told the guest about this surcharge | ⟨chừa chỗ⟩ |  |
| `handover.foc` | Đề nghị miễn phí (FOC) | Request a waiver (FOC) | ⟨chừa chỗ⟩ |  |
| `handover.foc_reason` | Lý do miễn phí | Waiver reason | ⟨chừa chỗ⟩ |  |
| `handover.foc_over_limit` | Vượt hạn mức của bạn ({limit}). Yêu cầu sẽ gửi {approver} duyệt. | Above your limit ({limit}). The request goes to {approver} for approval. | ⟨chừa chỗ⟩ | BR-433 |
| `handover.finish` | Hoàn tất nhận phòng | Complete check-in | ⟨chừa chỗ⟩ |  |
| `handover.done` | Đã nhận phòng căn {room}. Buồng chuyển "Có khách". | Checked in to room {room}. Room set to "Occupied". | ⟨chừa chỗ⟩ |  |
| `handover.reg_pending_banner` | Còn {n} khách chưa khai báo – hạn {time}. Đã thêm vào việc cần làm. | {n} guests not yet registered – due {time}. Added to the to-do list. | ⟨chừa chỗ⟩ |  |

#### Luồng 4 – Trả phòng 3 bước, bill, thanh toán, ký quỹ

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `checkout.title` | Trả phòng · Căn {room} · {guest} | Check-out · Room {room} · {guest} | ⟨chừa chỗ⟩ |  |
| `checkout.step.minibar` | Minibar | Minibar | ⟨chừa chỗ⟩ |  |
| `checkout.step.extras` | Phụ phí | Extras | ⟨chừa chỗ⟩ |  |
| `checkout.step.bill` | Bill & thu tiền | Bill & payment | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.left` | Còn lại | Remaining | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.used` | Đã dùng | Used | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.free` | Miễn phí | Complimentary | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.from_hk` | Buồng phòng đã kiểm lúc {time} ({who}) | Checked by housekeeping at {time} ({who}) | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.empty` | Căn này không có minibar tính tiền. | This room has no chargeable minibar. | ⟨chừa chỗ⟩ |  |
| `checkout.minibar.all_full` | Không dùng gì – tủ đủ | Nothing used – fully stocked | ⟨chừa chỗ⟩ |  |
| `checkout.extras.laundry` | Giặt ủi | Laundry | ⟨chừa chỗ⟩ |  |
| `checkout.extras.food` | Đồ ăn gọi thêm | Extra food | ⟨chừa chỗ⟩ |  |
| `checkout.extras.damage` | Hư hỏng, mất đồ | Damage or missing items | ⟨chừa chỗ⟩ |  |
| `checkout.extras.smoking` | Khử mùi thuốc lá | Smoke odour treatment | ⟨chừa chỗ⟩ | BR-511 – tên dòng folio, khách thấy |
| `checkout.extras.card` | Thiếu thẻ phòng | Missing key card | ⟨chừa chỗ⟩ | BR-511 – tên dòng folio, khách thấy |
| `checkout.departure_time` | Giờ trả phòng thực tế | Actual check-out time | ⟨chừa chỗ⟩ |  |
| `checkout.late_toggle` | Khách trả muộn sau {std} | Guest checks out late, after {std} | ⟨chừa chỗ⟩ |  |
| `checkout.late_none` | Trả đúng giờ – không phụ thu | On time – no surcharge | ⟨chừa chỗ⟩ |  |
| `checkout.late_fee` | Phụ thu trả muộn: {amount} ({pct}% giá đêm cuối) | Late check-out surcharge: {amount} ({pct}% of last night) | ⟨chừa chỗ⟩ | BR-412 |
| `checkout.summary.balance` | Còn phải thu | Balance due | ⟨chừa chỗ⟩ |  |
| `bill.title` | Phiếu thanh toán | Guest folio | ⟨chừa chỗ⟩ |  |
| `bill.no` | Số phiếu | Folio no. | ⟨chừa chỗ⟩ |  |
| `bill.night_line` | Tiền phòng đêm {date} | Room, night of {date} | ⟨chừa chỗ⟩ |  |
| `bill.foc_line` | Miễn phí · {reason} | Complimentary · {reason} | ⟨chừa chỗ⟩ | HR-13: không in chữ FOC cho khách |
| `bill.total` | Tổng cộng | Total | ⟨chừa chỗ⟩ |  |
| `bill.deposit` | Đã cọc / đã thu | Deposit / paid | ⟨chừa chỗ⟩ |  |
| `bill.balance` | Còn phải thu | Balance due | ⟨chừa chỗ⟩ |  |
| `bill.vat_note` | Giá đã gồm thuế GTGT | Prices include VAT | ⟨chừa chỗ⟩ |  |
| `bill.paid_stamp` | ĐÃ THU ĐỦ | PAID IN FULL | ⟨chừa chỗ⟩ |  |
| `pay.method` | Cách thanh toán | Payment method | ⟨chừa chỗ⟩ |  |
| `pay.vietqr` | Chuyển khoản VietQR | Bank transfer (VietQR) | ⟨chừa chỗ⟩ |  |
| `pay.card` | Thẻ (máy POS tại quầy) | Card (desk POS terminal) | ⟨chừa chỗ⟩ | R2 card_pos – BA E05-07; cổng thẻ online ở R3 |
| `pay.cash` | Tiền mặt | Cash | ⟨chừa chỗ⟩ |  |
| `pay.ota` | Đã thu qua OTA | Collected by OTA | ⟨chừa chỗ⟩ |  |
| `pay.split` | + Thêm cách thanh toán khác | + Add another payment method | ⟨chừa chỗ⟩ |  |
| `pay.qr_note` | Nội dung chuyển khoản: {ref} | Transfer reference: {ref} | ⟨chừa chỗ⟩ |  |
| `pay.qr_waiting` | Chờ khách chuyển khoản… Kiểm tra app ngân hàng của OTTIMO rồi bấm xác nhận. | Waiting for the transfer… Check OTTIMO's bank app, then confirm. | ⟨chừa chỗ⟩ | R2: chưa tự đối soát (PRD A8) |
| `pay.record` | Ghi nhận đã thu {amount} | Record {amount} received | ⟨chừa chỗ⟩ |  |
| `pay.remaining` | Còn thiếu {amount} | {amount} still due | ⟨chừa chỗ⟩ |  |
| `pay.error_not_received` | Chưa thấy tiền về? Đừng hoàn tất. Hỏi khách ảnh chụp giao dịch, hoặc chọn cách khác. | Transfer not received? Don't complete yet. Ask the guest for a screenshot, or choose another method. | ⟨chừa chỗ⟩ |  |
| `invoice.toggle` | Khách lấy hóa đơn GTGT ghi tên công ty | Guest needs a VAT invoice in a company name | ⟨chừa chỗ⟩ |  |
| `invoice.company` | Tên công ty | Company name | ⟨chừa chỗ⟩ |  |
| `invoice.tax_id` | Mã số thuế | Tax ID | ⟨chừa chỗ⟩ |  |
| `invoice.tax_id_error` | Mã số thuế gồm 10 hoặc 13 chữ số. | Tax ID must be 10 or 13 digits. | ⟨chừa chỗ⟩ |  |
| `invoice.email` | Email nhận hóa đơn | Invoice email | ⟨chừa chỗ⟩ |  |
| `invoice.pending` | Hóa đơn điện tử: chờ phát hành | E-invoice: pending issue | ⟨chừa chỗ⟩ |  |
| `checkout.complete` | Hoàn tất trả phòng | Complete check-out | ⟨chừa chỗ⟩ |  |
| `checkout.complete_confirm_title` | Hoàn tất trả phòng căn {room}? | Complete check-out for room {room}? | ⟨chừa chỗ⟩ |  |
| `checkout.complete_confirm_body` | Đơn chuyển "Đã trả phòng", buồng chuyển "Cần dọn", tạo việc dọn, bổ sung minibar và xóa mã trên app khóa; đơn có khách ngủ sofa thêm việc thu hồi bộ đồ dùng thêm. Không sửa folio sau bước này (chỉ ghi điều chỉnh). | The booking becomes "Checked out" and the room "Needs cleaning". Cleaning, minibar refill and "delete code in the lock app" tasks are created; bookings with a sofa guest also get an extra-kit pickup task. The folio can't be edited after this (adjustments only). | ⟨chừa chỗ⟩ | R2 – mã cửa chưa ở trong app (BA E05-07) |
| `checkout.blocked_balance` | Còn {amount} chưa ghi nhận thanh toán. Ghi nhận đủ trước khi hoàn tất (hoặc quản lý ghi công nợ). | {amount} not yet recorded as paid. Record full payment before completing (or a manager records it as receivable). | ⟨chừa chỗ⟩ | BR-426 |
| `checkout.done` | Đã trả phòng. Bill đã lưu. | Checked out. Folio saved. | ⟨chừa chỗ⟩ |  |
| `checkout.send_bill` | Gửi bill cho khách | Send folio to guest | ⟨chừa chỗ⟩ |  |
| `lt.settlement.title` | Quyết toán ký quỹ | Deposit settlement | ⟨chừa chỗ⟩ |  |
| `lt.settlement.deposit` | Ký quỹ đang giữ | Security deposit held | ⟨chừa chỗ⟩ |  |
| `lt.settlement.utilities` | Điện nước kỳ cuối ({from} – {to}) | Final utilities ({from} – {to}) | ⟨chừa chỗ⟩ |  |
| `lt.settlement.deductions` | Khấu trừ | Deductions | ⟨chừa chỗ⟩ |  |
| `lt.settlement.evidence` | Biên bản kiểm phòng có ảnh | Room inspection report with photos | ⟨chừa chỗ⟩ |  |
| `lt.settlement.evidence_missing` | Chưa có biên bản kiểm phòng có ảnh – chưa được khấu trừ. | No inspection report with photos – deductions not allowed yet. | ⟨chừa chỗ⟩ | BR-214 |
| `lt.settlement.refund` | Hoàn lại khách | Refund to guest | ⟨chừa chỗ⟩ |  |
| `lt.settlement.collect` | Khách cần trả thêm | Guest owes | ⟨chừa chỗ⟩ |  |
| `lt.settlement.refund_due` | Hoàn trong {days} ngày làm việc · cần quản lý duyệt | Refund within {days} working days · manager approval needed | ⟨chừa chỗ⟩ |  |

#### Luồng 7 – App khách (link/QR)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `guest.lang` | Ngôn ngữ | Language | Язык |  |
| `guest.lang.vi` | Tiếng Việt | Tiếng Việt | Tiếng Việt |  |
| `guest.lang.en` | English | English | English |  |
| `guest.lang.ru` | Русский | Русский | Русский |  |
| `guest.hello` | Xin chào, {name} | Hello, {name} | ⟨chừa chỗ⟩ |  |
| `guest.stay.dates` | {from} → {to} · {nights} đêm | {from} → {to} · {nights} nights | ⟨chừa chỗ⟩ |  |
| `guest.stay.room` | Căn {room} · {room_name} | Room {room} · {room_name} | ⟨chừa chỗ⟩ |  |
| `guest.stay.checkin_time` | Nhận phòng từ {time} | Check-in from {time} | ⟨chừa chỗ⟩ |  |
| `guest.stay.checkout_time` | Trả phòng trước {time} | Check-out by {time} | ⟨chừa chỗ⟩ |  |
| `guest.cta.checkin` | Làm thủ tục trước (check-in online) | Online check-in | Онлайн-регистрация | FB-R1-UXR-UXD-16 – lần đầu kèm 'check-in online'; chỗ sau dùng guest.cta.checkin_short |
| `guest.cta.checkin_help` | Gửi giấy tờ trước, nhận phòng tại quầy chỉ vài phút. | Send your IDs in advance – check-in at the desk takes just minutes. | ⟨chừa chỗ⟩ |  |
| `guest.tab.home` | Lưu trú | My stay | ⟨chừa chỗ⟩ |  |
| `guest.tab.requests` | Yêu cầu | Requests | ⟨chừa chỗ⟩ |  |
| `guest.tab.bill` | Hóa đơn | Bill | ⟨chừa chỗ⟩ |  |
| `guest.tab.info` | Thông tin | Info | ⟨chừa chỗ⟩ |  |
| `guest.wifi` | Wi-Fi | Wi-Fi | ⟨chừa chỗ⟩ |  |
| `guest.door_code` | Mã cửa | Door code | ⟨chừa chỗ⟩ |  |
| `guest.door_code_later` | Mã cửa hiện ở đây vào ngày nhận phòng ({date}). | Your door code will appear here on arrival day ({date}). | ⟨chừa chỗ⟩ |  |
| `guest.oci.step1` | Giấy tờ | IDs | ⟨chừa chỗ⟩ |  |
| `guest.oci.step2` | Giờ đến | Arrival time | ⟨chừa chỗ⟩ |  |
| `guest.oci.step3` | Xác nhận | Confirm | ⟨chừa chỗ⟩ |  |
| `guest.oci.people` | Giấy tờ của {n} khách trong đơn | IDs for the {n} guests on this booking | ⟨chừa chỗ⟩ |  |
| `guest.oci.add_doc` | Chụp trang thông tin hộ chiếu / CCCD | Photograph your passport info page / ID card | ⟨chừa chỗ⟩ |  |
| `guest.oci.why` | Vì sao cần? Luật Việt Nam yêu cầu khách sạn khai báo lưu trú cho mọi khách. | Why? Vietnamese law requires hotels to register every guest's stay. | ⟨chừa chỗ⟩ |  |
| `guest.oci.consent` | Tôi đồng ý OTTIMO lưu ảnh giấy tờ của tôi đến {days} ngày sau khi trả phòng, sau đó tự xóa. | I agree OTTIMO may keep photos of my ID until {days} days after check-out, then delete them automatically. | ⟨chừa chỗ⟩ | Văn bản pháp lý – cần người dịch duyệt (HR-01) |
| `guest.oci.consent_optional` | Không bắt buộc. Nếu không đồng ý, chúng tôi chỉ dùng thông tin để khai báo và không lưu ảnh. | Optional. If you don't agree, we only use the details for registration and don't keep the photos. | ⟨chừa chỗ⟩ |  |
| `guest.oci.consent_q` | Lưu ảnh giấy tờ sau khi khai báo? | Keep your ID photos after registration? | ⟨chừa chỗ⟩ | Phải chọn Có/Không – không chọn sẵn (`/v1/guest/consents`) |
| `guest.oci.consent_no` | Không, chỉ dùng để khai báo rồi xóa ảnh | No – use them for registration only, then delete | ⟨chừa chỗ⟩ |  |
| `guest.verify.title` | Xác minh để xem mã cửa và hóa đơn | Verify to see your door code and bill | ⟨chừa chỗ⟩ | Mức 2 – SR-GST-07 (OTP email hoặc mã lễ tân); không dùng 4 số cuối SĐT/mã đặt phòng |
| `guest.verify.sent_to` | Chúng tôi đã gửi mã 6 số tới {email}. Mã dùng trong 10 phút. | We've sent a 6-digit code to {email}. It's valid for 10 minutes. | ⟨chừa chỗ⟩ | Email che dạng d***@g***.com |
| `guest.verify.send` | Gửi mã qua email | Email me a code | ⟨chừa chỗ⟩ |  |
| `guest.verify.label` | Mã xác minh 6 số | 6-digit verification code | ⟨chừa chỗ⟩ |  |
| `guest.verify.submit` | Xác minh | Verify | ⟨chừa chỗ⟩ |  |
| `guest.verify.resend` | Gửi lại mã | Resend code | ⟨chừa chỗ⟩ |  |
| `guest.verify.resend_wait` | Gửi lại sau {seconds} giây | Resend in {seconds} s | ⟨chừa chỗ⟩ |  |
| `guest.verify.resend_limit` | Đã gửi 3 lần trong 1 giờ. Thử lại sau hoặc lấy mã tại quầy lễ tân. | Sent 3 times this hour. Try later or get a code from reception. | ⟨chừa chỗ⟩ | SR-GST-08 |
| `guest.verify.desk_code` | Không nhận được email? Lễ tân có thể đọc mã cho bạn – nhập mã đó vào ô trên. | No email? Reception can give you a code – enter it above. | ⟨chừa chỗ⟩ | Mã xác minh lễ tân (SR-GST-07b) |
| `guest.verify.error` | Mã chưa đúng hoặc đã hết hạn. Còn {left} lần thử. | The code is wrong or has expired. {left} attempts left. | ⟨chừa chỗ⟩ | 401 |
| `guest.verify.locked` | Bạn đã nhập sai quá nhiều lần. Vui lòng liên hệ lễ tân để nhận mã xác minh. | Too many wrong attempts. Please contact reception for a verification code. | ⟨chừa chỗ⟩ | 5 lần sai/24 giờ/token – SR-GST-08 |
| `guest.verify.expired_session` | Phiên xác minh đã hết sau 30 phút không dùng. Xác minh lại để xem tiếp. | Your verification timed out after 30 minutes. Verify again to continue. | ⟨chừa chỗ⟩ | SR-GST-09 |
| `guest.after_checkout.title` | Cảm ơn bạn đã lưu trú | Thank you for staying with us | ⟨chừa chỗ⟩ | SR-GST-11: ân hạn 24 giờ sau trả phòng |
| `guest.after_checkout.body` | Liên kết này còn dùng đến {time} để xem phiếu thanh toán và thanh toán khoản phát sinh. | This link works until {time} to view your folio and pay any extra charges. | ⟨chừa chỗ⟩ |  |
| `guest.oci.arrival` | Bạn dự kiến đến lúc nào? | When do you expect to arrive? | ⟨chừa chỗ⟩ |  |
| `guest.oci.arrival_late` | Sau 22:00 | After 22:00 | ⟨chừa chỗ⟩ |  |
| `guest.oci.note` | Ghi chú cho lễ tân | Note for reception | ⟨chừa chỗ⟩ |  |
| `guest.cta.checkin_short` | Làm thủ tục trước | Online check-in | Онлайн-регистрация |  |
| `guest.oci.submit` | Gửi thủ tục | Submit check-in | ⟨chừa chỗ⟩ |  |
| `guest.oci.done_title` | Xong! Hẹn gặp bạn ngày {date} | All set! See you on {date} | ⟨chừa chỗ⟩ |  |
| `guest.oci.done_body` | Phòng sẵn sàng từ {time}. Lễ tân sẽ giao mã cửa khi bạn đến. | Your room is ready from {time}. Reception will give you your door code when you arrive. | ⟨chừa chỗ⟩ | R2 – SEC P-R2-4 ĐK-6, BA E06-10; bản hiện mã cửa trên trang quay lại ở R3 (US-128, US-141) |
| `guest.oci.upload_error` | Ảnh chưa rõ. Chụp lại nơi đủ sáng, không lóa, thấy đủ 4 góc. | The photo isn't clear. Retake it in good light, without glare, showing all 4 corners. | ⟨chừa chỗ⟩ |  |
| `guest.req.title` | Bạn cần gì? | What do you need? | ⟨chừa chỗ⟩ |  |
| `guest.req.clean` | Dọn phòng thêm | Extra cleaning | ⟨chừa chỗ⟩ |  |
| `guest.req.towels` | Khăn, đồ dùng | Towels & amenities | ⟨chừa chỗ⟩ |  |
| `guest.req.repair` | Báo hỏng | Report a problem | ⟨chừa chỗ⟩ |  |
| `guest.req.transport` | Đặt xe / tour | Book a ride / tour | ⟨chừa chỗ⟩ |  |
| `guest.req.late` | Trả phòng muộn | Late check-out | ⟨chừa chỗ⟩ |  |
| `guest.req.other` | Khác | Something else | ⟨chừa chỗ⟩ |  |
| `guest.req.note` | Mô tả thêm (không bắt buộc) | Add details (optional) | ⟨chừa chỗ⟩ |  |
| `guest.req.send` | Gửi yêu cầu | Send request | ⟨chừa chỗ⟩ |  |
| `guest.req.fee_notice` | Dịch vụ này có phí {amount}. Phí sẽ vào hóa đơn của bạn. | This service costs {amount}. It will be added to your bill. | ⟨chừa chỗ⟩ |  |
| `guest.req.status.new` | Đã gửi | Sent | ⟨chừa chỗ⟩ | SM-15 `new` |
| `guest.req.status.acknowledged` | Đã nhận | Received | ⟨chừa chỗ⟩ | `acknowledged` |
| `guest.req.status.in_progress` | Đang xử lý | In progress | ⟨chừa chỗ⟩ | `in_progress` |
| `guest.req.status.done` | Hoàn thành | Done | ⟨chừa chỗ⟩ | `done` – nhãn theo state-machines mục 15 |
| `guest.req.status.declined` | Không thực hiện được | Can't be done | ⟨chừa chỗ⟩ | `declined` – kèm lý do lễ tân ghi |
| `guest.req.reply_time` | Lễ tân phản hồi trong khoảng {minutes} phút (07:00–22:00). | Reception replies within about {minutes} minutes (07:00–22:00). | ⟨chừa chỗ⟩ | BR-811 |
| `guest.req.empty` | Bạn chưa gửi yêu cầu nào. | You haven't sent any requests yet. | ⟨chừa chỗ⟩ |  |
| `guest.req.sent` | Đã gửi. Chúng tôi sẽ cập nhật trạng thái tại đây. | Sent. We'll update the status here. | ⟨chừa chỗ⟩ |  |
| `guest.bill.title` | Hóa đơn tạm tính | Current bill | ⟨chừa chỗ⟩ |  |
| `guest.bill.paid` | Đã thanh toán | Paid | ⟨chừa chỗ⟩ |  |
| `guest.bill.due` | Còn phải trả | Amount due | ⟨chừa chỗ⟩ |  |
| `guest.bill.empty` | Chưa có khoản phát sinh nào. | No extra charges yet. | ⟨chừa chỗ⟩ |  |
| `guest.bill.updated` | Cập nhật lúc {time} | Updated at {time} | ⟨chừa chỗ⟩ |  |
| `guest.bill.utility_period` | Kỳ chốt {from} – {to} | Billing period {from} – {to} | ⟨chừa chỗ⟩ |  |
| `guest.bill.meter` | Chỉ số {old} → {new} = {used} {unit} | Meter {old} → {new} = {used} {unit} | ⟨chừa chỗ⟩ |  |
| `guest.bill.meter_photo` | Xem ảnh công tơ | View meter photo | ⟨chừa chỗ⟩ |  |
| `guest.link_expired_title` | Liên kết đã hết hạn | This link has expired | Срок действия ссылки истёк |  |
| `guest.link_expired_body` | Liên kết này chỉ dùng trong thời gian lưu trú. Cần hóa đơn hay hỗ trợ? Nhắn OTTIMO qua Zalo/WhatsApp {phone}. | This link only works during your stay. Need your bill or help? Message OTTIMO on Zalo/WhatsApp {phone}. | ⟨chừa chỗ⟩ | SEC: link hết hạn khi trả phòng |
| `guest.error_title` | Không tải được trang | Couldn't load this page | Не удалось загрузить страницу |  |
| `guest.error_body` | Kiểm tra kết nối mạng rồi thử lại. | Check your connection and try again. | Проверьте подключение и попробуйте снова. |  |

#### Vai (mã vai theo rbac-matrix mục 1)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `role.owner` | Chủ đầu tư | Owner | ⟨chừa chỗ⟩ | `owner` |
| `role.manager` | Quản lý | Manager | ⟨chừa chỗ⟩ | `manager` |
| `role.front_desk_lead` | Lễ tân trưởng | Senior receptionist | ⟨chừa chỗ⟩ | `front_desk_lead` |
| `role.front_desk` | Lễ tân | Receptionist | ⟨chừa chỗ⟩ | `front_desk` (gồm người trực đêm) |
| `role.housekeeping` | Buồng phòng | Housekeeping | ⟨chừa chỗ⟩ | `housekeeping` |
| `role.maintenance` | Bảo trì | Maintenance | ⟨chừa chỗ⟩ | `maintenance` |
| `role.sales_staff` | Sale nội bộ | Sales staff | ⟨chừa chỗ⟩ | `sales_staff` |
| `role.collaborator` | CTV / môi giới | Agent | ⟨chừa chỗ⟩ | `collaborator` – ngoài biên chế |
| `role.guest` | Khách | Guest | Гость | Không phải tài khoản – link theo đơn |

#### Mã lỗi API → câu hiển thị (RFC 9457 `Problem.code`, openapi info)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `error.VALIDATION_FAILED` | Còn {n} ô cần sửa – xem dòng đỏ dưới từng ô. | {n} fields need fixing – see the red note under each field. | ⟨chừa chỗ⟩ | 422; lỗi từng ô lấy từ `errors[]` |
| `error.UNAUTHENTICATED` | Phiên đăng nhập đã hết. Đăng nhập lại – thông tin đang nhập vẫn được giữ trên máy này. | Your session has ended. Sign in again – what you typed is kept on this device. | ⟨chừa chỗ⟩ | 401 |
| `error.FORBIDDEN_ACTION` | Tài khoản của bạn không làm được thao tác này. Nếu cần, nhờ quản lý. | Your account can't do this. Ask a manager if needed. | ⟨chừa chỗ⟩ | 403 – bình thường không gặp vì nút đã ẩn theo vai; gặp khi quyền vừa bị đổi |
| `error.NOT_FOUND` | Không tìm thấy mục này hoặc bạn không có quyền xem. Tải lại danh sách. | This item wasn't found or you can't view it. Reload the list. | ⟨chừa chỗ⟩ | 404 – không lộ sự tồn tại |
| `error.ROOM_UNAVAILABLE` | Căn {room} đã kín từ {from} đến {to}. Chọn ngày khác hoặc một căn trống bên dưới. | Room {room} is taken from {from} to {to}. Choose other dates or a free room below. | ⟨chừa chỗ⟩ | 409 + `conflicts[]`; lễ tân/quản lý thấy thêm tên khách: dùng `booking.error.conflict` |
| `error.ROOM_BLOCKED` | Căn {room} đang khóa sửa chữa từ {from} đến {to}. Chọn căn khác. | Room {room} is out of order from {from} to {to}. Choose another room. | ⟨chừa chỗ⟩ | 409 – US-019 |
| `error.ROOM_NOT_SELLABLE` | Căn {room} đang ngừng bán. Chọn căn khác. | Room {room} isn't for sale right now. Choose another room. | ⟨chừa chỗ⟩ | 409 – US-004 |
| `error.INVALID_TRANSITION` | Đơn vừa chuyển sang "{status}" nên thao tác này không còn dùng được. Tải lại để xem các nút hiện có. | This booking just changed to "{status}", so this action no longer applies. Reload to see what you can do now. | ⟨chừa chỗ⟩ | 409 |
| `error.VERSION_CONFLICT` | Dữ liệu vừa được người khác thay đổi. Tải lại để xem bản mới – thông tin bạn nhập vẫn còn. | Someone else just changed this. Reload to see the latest – what you typed is kept. | ⟨chừa chỗ⟩ | 412 – state-machines 0.2.6 |
| `error.PRECONDITION_REQUIRED` | Cần tải lại trang trước khi lưu. Bấm Tải lại – thông tin bạn nhập vẫn còn. | Please reload before saving. Tap Reload – what you typed is kept. | ⟨chừa chỗ⟩ | 428 – lỗi lập trình, ghi log cho FE |
| `error.IDEMPOTENCY_KEY_REUSED` | Thao tác này đã được gửi với nội dung khác. Tải lại rồi làm lại. | This action was already sent with different details. Reload and try again. | ⟨chừa chỗ⟩ | 422 – lỗi lập trình |
| `error.IDEMPOTENCY_IN_PROGRESS` | Thao tác trước đang được xử lý. Chờ vài giây – không cần bấm lại. | Your previous action is still being processed. Wait a few seconds – no need to tap again. | ⟨chừa chỗ⟩ | 409 |
| `error.HOLD_EXPIRED` | Giữ chỗ đã hết hạn lúc {time} và căn đã mở bán lại. Tạo giữ chỗ mới nếu căn còn trống. | The hold expired at {time} and the room is back on sale. Create a new hold if it's still free. | ⟨chừa chỗ⟩ | 409 |
| `error.HOLD_NOT_ALLOWED_TODAY` | Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay. | You can't hold a room for a same-day arrival. Take payment and create the booking now. | ⟨chừa chỗ⟩ | 422 – BR-302 |
| `error.QUOTE_EXPIRED` | Báo giá đã hết hiệu lực. Gửi quản lý gia hạn, hoặc lập báo giá mới theo giá hiện hành. | This quote has expired. Ask a manager to extend it, or make a new quote at current rates. | ⟨chừa chỗ⟩ | 409 – BR-304 |
| `error.CAPACITY_EXCEEDED` | Căn {room} ở tối đa {max} khách. Giảm số khách hoặc chọn căn lớn hơn. | Room {room} sleeps up to {max}. Reduce guests or choose a larger room. | ⟨chừa chỗ⟩ | 422 – BR-110 |
| `error.OUTSIDE_BOOKING_WINDOW` | Ngày đến hoặc số đêm nằm ngoài khoảng được bán. Chọn lại ngày, hoặc lập báo giá dài hạn nếu khách ở lâu. | The arrival date or number of nights is outside the bookable range. Pick other dates, or make a long-stay quote. | ⟨chừa chỗ⟩ | 422 – BR-112 |
| `error.RATE_OUT_OF_RANGE` | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Rate must be between {min} and {max} (floor – ceiling for {group}). | ⟨chừa chỗ⟩ | 422 – BR-105; trùng `booking.error.rate_range` |
| `error.PHONE_REQUIRED` | Kênh Trực tiếp và CTV cần số điện thoại của khách. | Direct and agent bookings need the guest's phone number. | ⟨chừa chỗ⟩ | 422 |
| `error.DEPOSIT_INSUFFICIENT` | Chưa đủ cọc: cần {required}, đã ghi nhận {paid}. Ghi nhận thêm rồi xác nhận. | Deposit not enough: {required} needed, {paid} recorded. Record the rest, then confirm. | ⟨chừa chỗ⟩ | 422 – B4 |
| `error.CHECKIN_CONDITIONS_NOT_MET` | Chưa nhận phòng được: {unmet}. Xử lý các mục còn thiếu ở danh sách điều kiện. | Can't check in yet: {unmet}. Resolve the missing items in the conditions list. | ⟨chừa chỗ⟩ | 409 + `unmet[]` (mã `checkin.cond.*`) |
| `error.RESERVATION_UNASSIGNED` | Đơn chưa được gán căn (xung đột OTA). Gán căn trước khi nhận phòng. | This booking has no room yet (OTA conflict). Assign a room before check-in. | ⟨chừa chỗ⟩ | 409 – erd mục 7 |
| `error.LATE_CHECKOUT_CONFLICT` | Căn {room} có khách {guest} đến lúc {eta} và không còn căn thay thế. Chỉ quản lý duyệt được; có thể gợi ý khách gửi hành lý. | Room {room} has {guest} arriving at {eta} and there's no other room. Only a manager can approve; you can offer luggage storage. | ⟨chừa chỗ⟩ | 409 – BR-416; ẩn tên khách nếu vai không được xem |
| `error.BALANCE_DUE` | Còn {amount} chưa ghi nhận thanh toán. Ghi nhận đủ trước khi hoàn tất (hoặc quản lý ghi công nợ). | {amount} not yet recorded as paid. Record full payment before completing (or a manager records it as receivable). | ⟨chừa chỗ⟩ | 409 – BR-426, BR-525 |
| `error.PENDING_APPROVALS` | Còn {n} yêu cầu miễn phí/giảm giá đang chờ duyệt. Chờ duyệt xong hoặc rút yêu cầu rồi hoàn tất. | {n} waiver/discount requests are still awaiting approval. Wait for approval or withdraw them, then complete. | ⟨chừa chỗ⟩ | 409 – SM-10 |
| `error.FOLIO_LOCKED` | Phiếu thanh toán đã khóa sau khi trả phòng. Chỉ quản lý ghi được bút toán điều chỉnh. | The folio is locked after check-out. Only a manager can post an adjustment. | ⟨chừa chỗ⟩ | 409 – US-038 |
| `error.SELF_APPROVAL_FORBIDDEN` | Bạn không tự duyệt yêu cầu của chính mình được. Yêu cầu vẫn chờ người duyệt khác. | You can't approve your own request. It's still waiting for another approver. | ⟨chừa chỗ⟩ | 403 – BR-432 |
| `error.APPROVAL_LIMIT_EXCEEDED` | Số tiền vượt hạn mức duyệt của bạn. Yêu cầu đã chuyển lên {approver}. | The amount is above your approval limit. The request has gone to {approver}. | ⟨chừa chỗ⟩ | 403 – BR-433 |
| `error.REAUTH_FAILED` | Mật khẩu chưa đúng. Còn {left} lần thử. | Incorrect password. {left} attempts left. | ⟨chừa chỗ⟩ | 401 – R2 xác nhận lại bằng mật khẩu (BA E05-07); R3 thêm PIN duyệt |
| `error.DUPLICATE_GUEST` | SĐT/email này đã thuộc hồ sơ {guest}. Dùng hồ sơ đó? | This phone/email belongs to {guest}. Use that profile? | ⟨chừa chỗ⟩ | 409 + `existingGuestId` – BR-951 |
| `error.CARD_NUMBER_DETECTED` | Ô ghi chú có dãy số giống số thẻ thanh toán. Xóa dãy số đó – OTTIMO không lưu số thẻ. | The note contains what looks like a card number. Remove it – OTTIMO doesn't store card numbers. | ⟨chừa chỗ⟩ | 422 – R-PAY-07 |
| `error.PAYMENT_NOT_CONFIGURED` | Chưa cài tài khoản nhận chuyển khoản nên chưa tạo được VietQR. Chọn cách thanh toán khác và báo chủ đầu tư cài đặt. | No receiving account is set up, so VietQR can't be created. Choose another method and ask the owner to set it up. | ⟨chừa chỗ⟩ | 409 – US-120 |
| `error.REGISTRATION_INCOMPLETE` | Khai báo chưa đủ: còn thiếu giấy tờ hoặc cảnh báo chưa ghi cách xử lý. | Registration incomplete: IDs missing or warnings without a note. | ⟨chừa chỗ⟩ | 409 – K5 |
| `error.GUEST_LINK_INVALID` | Liên kết đã hết hạn hoặc không còn dùng được. Nhắn OTTIMO để nhận liên kết mới. | This link has expired or is no longer valid. Message OTTIMO for a new one. | ⟨chừa chỗ⟩ | 401 – app khách; màn đầy đủ dùng `guest.link_expired_*` |
| `error.GUEST_VERIFICATION_REQUIRED` | Để xem mục này, xác minh bằng mã gửi qua email hoặc mã do lễ tân cấp. | To see this, verify with the code sent by email or given by reception. | ⟨chừa chỗ⟩ | 403 – mức 2 (SR-GST-07) |
| `error.DEVICE_NOT_TRUSTED` | Máy này chưa được cấp quyền xem giấy tờ và mã cửa. Dùng máy quầy đã cấp, hoặc nhờ chủ đầu tư cấp quyền cho máy này. | This device isn't approved for IDs and door codes. Use an approved desk computer, or ask the owner to approve this one. | ⟨chừa chỗ⟩ | 403 – SR-DEV-03; mã mới do SEC thêm, ARC cần bổ sung vào bảng mã openapi |
| `error.FILE_REJECTED` | Tệp này chưa dùng được. Chỉ nhận ảnh JPG, PNG hoặc WebP, tối đa 10 MB – chụp lại hoặc chọn ảnh khác. | This file can't be used. Only JPG, PNG or WebP photos up to 10 MB – retake or choose another photo. | ⟨chừa chỗ⟩ | 422 – khớp OpenAPI 0.3 (không nhận PDF, HEIC; R2 sửa) |
| `error.RATE_LIMITED` | Bạn đã thử quá nhiều lần. Chờ {minutes} phút rồi thử lại. | Too many attempts. Wait {minutes} minutes and try again. | ⟨chừa chỗ⟩ | 429 |
| `error.server` | Máy chủ đang gặp sự cố. Dữ liệu của bạn không bị mất. Thử lại sau ít phút; nếu vẫn lỗi, báo quản lý mã tham chiếu {request_id}. | The server is having a problem. Nothing has been lost. Try again in a few minutes; if it keeps failing, give your manager the reference {request_id}. | ⟨chừa chỗ⟩ | 5xx không có `code` – hiện `requestId` |

#### Lưu trú – gia hạn, trả muộn, đổi căn/đổi phòng, không đến (L9)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `extend.title` | Gia hạn · Căn {room} · {guest} | Extend stay · Room {room} · {guest} | ⟨chừa chỗ⟩ | B13, US-028 |
| `extend.nights` | Ở thêm | Extra nights | ⟨chừa chỗ⟩ |  |
| `extend.night_free` | Trống | Free | ⟨chừa chỗ⟩ |  |
| `extend.night_taken` | Đã kín | Taken | ⟨chừa chỗ⟩ |  |
| `extend.max_hint` | Tối đa {max} đêm liên tiếp còn trống. Ở lâu hơn → lập báo giá dài hạn. | Up to {max} consecutive free nights. Longer → make a long-stay quote. | ⟨chừa chỗ⟩ | `extension_max_nights` – BR-421, BR-108 |
| `extend.rate_source` | Nguồn giá: {source} | Rate source: {source} | ⟨chừa chỗ⟩ | HR-18 |
| `extend.ota_child` | Đơn {channel}: phần gia hạn thành đơn con kênh Trực tiếp, chung phiếu thanh toán. Tiết kiệm phí kênh ≈ {amount}. | {channel} booking: the extra nights become a linked Direct booking on the same folio. Saves about {amount} in channel fees. | ⟨chừa chỗ⟩ | BR-422; tỷ lệ từ cấu hình kênh |
| `extend.pay_by` | Thu tiền gia hạn muộn nhất {time}. | Collect payment for the extension by {time}. | ⟨chừa chỗ⟩ | BR-423 |
| `extend.effects` | Ngày đi đổi thành {date}; buồng chuyển "Có khách, cần dọn"; khách nước ngoài cần cập nhật khai báo trong ngày. | Departure becomes {date}; room set to "Occupied, dirty"; foreign guests' registration must be updated today. | ⟨chừa chỗ⟩ | BR-802, BR-604 |
| `extend.submit` | Gia hạn {n} đêm · {amount} | Extend {n} nights · {amount} | ⟨chừa chỗ⟩ |  |
| `extend.to_long` | Lập báo giá dài hạn | Make long-stay quote | ⟨chừa chỗ⟩ |  |
| `late.title` | Trả muộn · Căn {room} · {guest} | Late check-out · Room {room} · {guest} | ⟨chừa chỗ⟩ | B15, US-029 |
| `late.time` | Giờ trả đã hẹn | Agreed check-out time | ⟨chừa chỗ⟩ |  |
| `late.fee` | Phụ thu đề xuất: {amount} ({pct}% giá đêm cuối) | Suggested surcharge: {amount} ({pct}% of last night) | ⟨chừa chỗ⟩ | BR-412 |
| `late.fee_zero` | Trong giờ ân hạn – không phụ thu | Within grace period – no surcharge | ⟨chừa chỗ⟩ |  |
| `late.arrival_warning` | Căn {room} có khách đến lúc {eta}. Còn căn thay thế cùng nhóm: {rooms}. | Room {room} has a guest arriving at {eta}. Same-group alternatives: {rooms}. | ⟨chừa chỗ⟩ | US-029 AC2 – tên khách đến chỉ hiện với front_desk trở lên |
| `late.conflict_block` | Có khách đến lúc {eta} và không còn căn thay thế. Gửi quản lý duyệt, hoặc gợi ý khách gửi hành lý. | A guest arrives at {eta} and there's no other room. Send to a manager to approve, or offer luggage storage. | ⟨chừa chỗ⟩ | BR-416; `LATE_CHECKOUT_CONFLICT` |
| `late.request_approval` | Gửi quản lý duyệt | Send to manager | ⟨chừa chỗ⟩ |  |
| `late.treat_as_extension` | Sau {time} tính thêm 1 đêm – chuyển sang Gia hạn. | After {time} it counts as an extra night – switch to Extend stay. | ⟨chừa chỗ⟩ | BR-416, `treatAsExtension` |
| `late.effects` | Việc dọn ghi "dọn sau {time}"; mã cửa kéo dài tới {time}. | Cleaning task set to "after {time}"; door code extended to {time}. | ⟨chừa chỗ⟩ | BR-403 |
| `late.submit` | Lưu giờ trả {time} | Save check-out at {time} | ⟨chừa chỗ⟩ |  |
| `move.title` | Đổi căn / đổi ngày · {code} | Change room / dates · {code} | ⟨chừa chỗ⟩ | B7, US-024 |
| `move.ota_dates_locked` | Đơn OTA: chỉ đổi căn nội bộ, ngày theo kênh. | OTA booking: room can change, dates follow the channel. | ⟨chừa chỗ⟩ |  |
| `move.reason` | Lý do đổi | Reason for change | ⟨chừa chỗ⟩ |  |
| `move.unassigned` | Đơn chưa gán căn – chọn cách xử lý | No room assigned – choose how to resolve | ⟨chừa chỗ⟩ |  |
| `move.resolution.same_group` | Gán căn trống cùng nhóm | Assign a free room in the same group | ⟨chừa chỗ⟩ | `reassigned_same_group` |
| `move.resolution.upgrade` | Nâng hạng (OTTIMO chịu chênh lệch) | Upgrade (OTTIMO absorbs the difference) | ⟨chừa chỗ⟩ | `upgraded` – BR-312 bước 2 |
| `room_change.title` | Đổi phòng · {guest} · Căn {from_room} | Move room · {guest} · Room {from_room} | ⟨chừa chỗ⟩ | B14, US-024 |
| `room_change.cause` | Vì sao đổi? | Why the move? | ⟨chừa chỗ⟩ |  |
| `room_change.cause.property_fault` | Sự cố của OTTIMO – giữ giá cũ | OTTIMO issue – keep current rate | ⟨chừa chỗ⟩ | `property_fault` – BR-424 |
| `room_change.cause.guest_request` | Khách yêu cầu – tính giá căn mới từ đêm đổi | Guest request – new room's rate from the move night | ⟨chừa chỗ⟩ | `guest_request` |
| `room_change.effective` | Đổi từ đêm | Move from night of | ⟨chừa chỗ⟩ |  |
| `room_change.ready_only` | Chỉ hiện căn "Sẵn sàng" hoặc "Trống, sạch" và không bị khóa. | Only rooms that are "Ready" or "Vacant clean" and not blocked are shown. | ⟨chừa chỗ⟩ |  |
| `room_change.effects` | Căn {from_room} chuyển "Cần dọn"; mã cửa cũ bị hủy – nhập mã mới cho căn {to_room}. Không phải khai báo lại. | Room {from_room} becomes "Needs cleaning"; the old door code is revoked – enter a new code for room {to_room}. No re-registration needed. | ⟨chừa chỗ⟩ | BR-424, BR-403 |
| `room_change.submit` | Đổi sang căn {room} | Move to room {room} | ⟨chừa chỗ⟩ |  |
| `noshow.reminder` | Khách {guest} chưa đến căn {room}. Gọi hoặc nhắn khách rồi ghi kết quả. | {guest} hasn't arrived for room {room}. Call or message, then record the result. | ⟨chừa chỗ⟩ | BR-311 `no_show_call_time` |
| `noshow.contact_note` | Kết quả liên lạc | Contact result | ⟨chừa chỗ⟩ | `contactAttemptNote` – bắt buộc |
| `noshow.locked` | Mở được từ {time} và sau khi ghi kết quả liên lạc. | Available from {time} once a contact result is recorded. | ⟨chừa chỗ⟩ | US-136 AC3; `no_show_mark_time` |
| `noshow.title` | Đánh dấu {guest} không đến? | Mark {guest} as no-show? | ⟨chừa chỗ⟩ |  |
| `noshow.consequence_direct` | Giữ cọc {amount} theo chính sách. Căn {room} mở bán lại {from} → {to} trên mọi kênh. Khai báo và hoa hồng của đơn bị hủy. | The {amount} deposit is kept per policy. Room {room} goes back on sale {from} → {to} on all channels. The booking's registration and commission are voided. | ⟨chừa chỗ⟩ | B11, BR-311 |
| `noshow.consequence_ota` | Căn {room} mở bán lại {from} → {to}. Tạo việc "Báo không đến trên {channel}" để kênh không tính hoa hồng. | Room {room} goes back on sale {from} → {to}. A task "Report no-show on {channel}" is created so the channel doesn't charge commission. | ⟨chừa chỗ⟩ |  |
| `noshow.confirm` | Đánh dấu không đến | Mark as no-show | ⟨chừa chỗ⟩ |  |
| `noshow.keep` | Chờ thêm | Keep waiting | ⟨chừa chỗ⟩ |  |
| `noshow.restore_title` | Khôi phục đơn {code}? | Restore booking {code}? | ⟨chừa chỗ⟩ | B12 |
| `noshow.restore_body` | Khách đã đến. Căn {room} đóng bán lại từ {from}. Chỉ làm được trong ngày nghiệp vụ của đêm đến. | The guest has arrived. Room {room} is taken off sale again from {from}. Only possible within the arrival night's business day. | ⟨chừa chỗ⟩ |  |
| `noshow.restore_request_sent` | Đã gửi quản lý duyệt khôi phục. | Restore request sent to a manager. | ⟨chừa chỗ⟩ | A10 = D |

#### Hộp xác nhận hành động không đảo ngược (US-135)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `confirm.keep` | Không, quay lại | No, go back | ⟨chừa chỗ⟩ | Nút an toàn mặc định (focus) khi không có tên riêng |
| `confirm.cancel_booking.title` | Hủy đơn {code} của {guest}? | Cancel booking {code} for {guest}? | ⟨chừa chỗ⟩ | B10 – dùng `dryRun=true` để lấy số tiền |
| `confirm.cancel_booking.body` | Căn {room} mở bán lại {from} → {to} trên mọi kênh. Giữ lại {retained} (phí hủy); hoàn {refund} – cần quản lý duyệt. | Room {room} goes back on sale {from} → {to} on all channels. {retained} kept (cancellation fee); {refund} refunded – needs manager approval. | ⟨chừa chỗ⟩ | BR-309, BR-522 |
| `confirm.channel_close.title` | Đóng bán căn {room} trên {channel}? | Close room {room} on {channel}? | ⟨chừa chỗ⟩ | US-098 |
| `confirm.channel_close.body` | Khách sẽ không đặt được căn {room} trên {channel} từ {from} đến {to}. Đơn đã có giữ nguyên. | Guests won't be able to book room {room} on {channel} from {from} to {to}. Existing bookings stay. | ⟨chừa chỗ⟩ |  |
| `confirm.channel_open.title` | Mở bán căn {room} trên {channel}? | Open room {room} on {channel}? | ⟨chừa chỗ⟩ |  |
| `confirm.channel_open.body` | Căn {room} sẽ nhận đặt phòng trên {channel} từ {from} đến {to} theo lịch giá hiện tại. | Room {room} will accept bookings on {channel} from {from} to {to} at current rates. | ⟨chừa chỗ⟩ |  |
| `confirm.merge_guest.title` | Gộp hồ sơ {a} vào {b}? | Merge profile {a} into {b}? | ⟨chừa chỗ⟩ | BR-953 |
| `confirm.merge_guest.body` | Lịch sử lưu trú, tag và đơn của {a} chuyển sang {b}. Mã cũ {old_code} vẫn tra được. Không tách lại được. | {a}'s stays, tags and bookings move to {b}. The old code {old_code} still resolves. This can't be undone. | ⟨chừa chỗ⟩ |  |
| `confirm.wo_done.title` | Đóng phiếu {wo} và mở khóa căn {room}? | Close {wo} and unblock room {room}? | ⟨chừa chỗ⟩ | W4 → O4 |
| `confirm.wo_done.body` | Căn {room} chuyển "Trống, cần dọn" và mở bán lại từ hôm nay trên mọi kênh. | Room {room} becomes "Vacant dirty" and goes back on sale from today on all channels. | ⟨chừa chỗ⟩ |  |
| `confirm.purge_images.title` | Xóa sớm ảnh giấy tờ của {guest}? | Delete {guest}'s ID photos now? | ⟨chừa chỗ⟩ | A74 – owner/manager |
| `confirm.purge_images.body` | Ảnh bị xóa vĩnh viễn, không khôi phục được. Thông tin đã khai báo vẫn giữ theo luật. | The photos are permanently deleted and can't be recovered. Registration details are kept as required by law. | ⟨chừa chỗ⟩ |  |

#### Buồng phòng – bổ sung đợt 4

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.task.guest_refused` | Khách không muốn dọn | Guest declined cleaning | ⟨chừa chỗ⟩ | A83 ◐ – lý do bắt buộc |
| `hk.task.refused_reason` | Lý do | Reason | ⟨chừa chỗ⟩ |  |
| `hk.done_wait_inspect` | Đã dọn – chờ kiểm | Cleaned – awaiting inspection | ⟨chừa chỗ⟩ | CL → VC (R3) |
| `hk.self_inspect` | Dọn xong & tự kiểm đạt | Cleaned & self-inspected | ⟨chừa chỗ⟩ | R4 – chỉ khi cơ sở bật chế độ ca 1 người |
| `hk.self_inspect_help` | Cần đủ checklist và ảnh phòng. | Needs the full checklist and room photos. | ⟨chừa chỗ⟩ |  |
| `hk.arriving_today` | Có khách đến hôm nay {time} | Guest arriving today {time} | ⟨chừa chỗ⟩ | Không tên khách |
| `hk.guest_first_name` | Khách: {name} | Guest: {name} | ⟨chừa chỗ⟩ | Chỉ tên gọi, chỉ căn trong việc hôm nay (rbac D01 Tên+căn T) |
| `hk.lock_by_others` | Lễ tân hoặc bảo trì sẽ quyết định khóa phòng sau khi xem báo cáo. | Reception or maintenance will decide whether to block the room. | ⟨chừa chỗ⟩ | housekeeping không có A86 |
| `hk.lock_request` | Khóa căn – không bán đến khi sửa xong | Block room – no sales until fixed | ⟨chừa chỗ⟩ | maintenance, front_desk trở lên (A86) |
| `hk.lock_pending` | Đang gửi yêu cầu khóa… | Sending block request… | ⟨chừa chỗ⟩ |  |
| `hk.lock_done` | Đã khóa – ngừng bán trên mọi kênh | Blocked – off sale on all channels | ⟨chừa chỗ⟩ | Chỉ sau khi server xác nhận (HR-20) |

#### Bảo mật nhân viên – 2FA, thiết bị được cấp, mã xác minh khách (SEC Phần 2)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `auth.totp.title` | Nhập mã xác thực | Enter authentication code | ⟨chừa chỗ⟩ | SR-AUTH-06 – owner, manager (bắt buộc) |
| `auth.totp.help` | Mở ứng dụng xác thực trên điện thoại và nhập mã 6 số đang hiện. | Open your authenticator app and enter the 6-digit code shown. | ⟨chừa chỗ⟩ |  |
| `auth.totp.submit` | Xác nhận | Confirm | ⟨chừa chỗ⟩ |  |
| `auth.totp.error` | Mã chưa đúng hoặc đã đổi. Nhập mã đang hiện trong ứng dụng. | The code is wrong or has changed. Enter the code currently shown in the app. | ⟨chừa chỗ⟩ |  |
| `auth.totp.recovery` | Mất điện thoại? Dùng mã khôi phục | Lost your phone? Use a recovery code | ⟨chừa chỗ⟩ |  |
| `device.title` | Thiết bị được cấp | Approved devices | ⟨chừa chỗ⟩ | S26 – SR-DEV-01, 06 |
| `device.this_untrusted` | Máy này chưa được cấp quyền xem dữ liệu giấy tờ và mã cửa. | This device isn't approved for ID data and door codes. | ⟨chừa chỗ⟩ |  |
| `device.grant` | Cấp quyền thiết bị này | Approve this device | ⟨chừa chỗ⟩ | Chỉ owner (manager nếu owner bật); trên chính máy đó |
| `device.grant_name` | Tên máy | Device name | ⟨chừa chỗ⟩ | Ví dụ: Máy quầy 1 |
| `device.grant_confirm` | Nhập lại mật khẩu (và mã xác thực) để cấp quyền | Re-enter your password (and authentication code) to approve | ⟨chừa chỗ⟩ |  |
| `device.grant_checklist` | Máy đã mã hóa ổ đĩa, khóa màn hình sau 5 phút, không cài tiện ích trình duyệt, tắt lịch sử/đồng bộ clipboard | Disk encrypted, screen locks after 5 minutes, no browser extensions, clipboard history/sync off | ⟨chừa chỗ⟩ | SR-DEV-07 |
| `device.expires` | Hết hạn {date} | Expires {date} | ⟨chừa chỗ⟩ | `trusted_device_days` |
| `device.last_seen` | Dùng gần nhất {time} | Last used {time} | ⟨chừa chỗ⟩ |  |
| `device.revoke` | Thu hồi | Revoke | ⟨chừa chỗ⟩ |  |
| `device.revoke_title` | Thu hồi quyền của {device}? | Revoke {device}? | ⟨chừa chỗ⟩ |  |
| `device.revoke_body` | Máy {device} không xem được giấy tờ, mã cửa ngay lập tức. Muốn dùng lại phải cấp quyền mới. | {device} immediately loses access to IDs and door codes. It must be approved again to use them. | ⟨chừa chỗ⟩ |  |
| `device.blocked_title` | Máy này chưa được cấp quyền | This device isn't approved | ⟨chừa chỗ⟩ | Trạng thái 403 DEVICE_NOT_TRUSTED |
| `device.blocked_body` | Giấy tờ và mã cửa chỉ mở trên máy quầy đã cấp. Các việc khác (đơn, trả phòng, buồng phòng) vẫn làm được trên máy này. | IDs and door codes only open on an approved desk computer. Everything else (bookings, check-out, housekeeping) still works here. | ⟨chừa chỗ⟩ |  |
| `device.pwa_note` | Trên điện thoại không xem được giấy tờ và mã cửa. Mở trên máy quầy. | IDs and door codes aren't available on phones. Use the desk computer. | ⟨chừa chỗ⟩ | SR-DEV-04 – PWA nhân viên |
| `desk_code.action` | Cấp mã xác minh cho khách | Give guest a verification code | ⟨chừa chỗ⟩ | SR-GST-07b – front_desk trở lên, ghi audit |
| `desk_code.body` | Đọc mã này cho khách tại quầy hoặc gọi tới SĐT trên đơn. Mã dùng một lần, hết hạn sau 10 phút. | Read this code to the guest at the desk or call the phone on the booking. Single use, expires in 10 minutes. | ⟨chừa chỗ⟩ |  |
| `desk_code.warning` | Không gửi mã qua tin nhắn chat cùng với link app khách. | Don't send the code by chat together with the guest link. | ⟨chừa chỗ⟩ |  |

#### Duyệt yêu cầu (SM-10)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `approval.pin_title` | Duyệt bằng mật khẩu của bạn | Approve with your password | ⟨chừa chỗ⟩ | BR-432 – R2 nhập lại mật khẩu đăng nhập (BA E05-07); key giữ tên cũ, R3 đổi sang PIN |
| `approval.pin_label` | Mật khẩu đăng nhập | Sign-in password | ⟨chừa chỗ⟩ | R2 – BA E05-07 |
| `approval.approve` | Duyệt | Approve | ⟨chừa chỗ⟩ |  |
| `approval.reject` | Từ chối | Reject | ⟨chừa chỗ⟩ |  |
| `approval.reject_reason` | Lý do từ chối | Reason for rejecting | ⟨chừa chỗ⟩ |  |
| `approval.status.pending` | Chờ duyệt | Pending | ⟨chừa chỗ⟩ |  |
| `approval.status.approved` | Đã duyệt | Approved | ⟨chừa chỗ⟩ |  |
| `approval.status.rejected` | Bị từ chối | Rejected | ⟨chừa chỗ⟩ |  |
| `approval.status.escalated` | Đã chuyển cấp trên | Escalated | ⟨chừa chỗ⟩ |  |
| `approval.status.cancelled` | Đã rút | Withdrawn | ⟨chừa chỗ⟩ |  |

#### Hoa hồng (SM-11)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `commission.status.projected` | Dự kiến | Projected | ⟨chừa chỗ⟩ | `projected` |
| `commission.status.earned` | Đủ điều kiện | Earned | ⟨chừa chỗ⟩ | `earned` |
| `commission.status.payable` | Chờ chi | Payable | ⟨chừa chỗ⟩ | `payable` |
| `commission.status.paid` | Đã chi | Paid | ⟨chừa chỗ⟩ | `paid` |
| `commission.status.void` | Không tính | Void | ⟨chừa chỗ⟩ | `void` – đơn hủy/không đến |

#### Bước 4 R1 – đến muộn / tự nhận phòng, kênh gửi mã, đăng ký 2FA, Hôm nay (máy quầy)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `guest.offline_banner` | Mất kết nối. Bạn vẫn xem được thông tin đã tải; gửi yêu cầu khi có mạng lại. | You're offline. You can still see what's loaded; send requests when you're back online. | Нет подключения. Загруженная информация доступна; отправить запрос можно после восстановления связи. | FB-R1-UXR-UXD-10 – app khách không xếp hàng thao tác |
| `guest.chip.verified` | Đã xác minh | Verified | Подтверждено |  |
| `guest.chip.doc_ok` | Đã có | Done | Готово |  |
| `guest.oci.person_n` | Khách {n} | Guest {n} | Гость {n} |  |
| `guest.oci.uploading` | Đang gửi ảnh {n}/{total} – {pct}% | Sending photo {n}/{total} – {pct}% | ⟨chừa chỗ⟩ | Ảnh nén phía máy khách ≤ 1,5 MB trước khi gửi |
| `guest.oci.upload_weak` | Mạng yếu – ảnh đã được thu nhỏ và sẽ tự thử lại. | Weak connection – the photo was compressed and will retry automatically. | ⟨chừa chỗ⟩ |  |
| `guest.oci.upload_retry` | Gửi lại ảnh | Resend photo | ⟨chừa chỗ⟩ |  |
| `guest.bill.line.room` | Tiền phòng {nights} đêm × {rate} | Room {nights} nights × {rate} | ⟨chừa chỗ⟩ |  |
| `guest.bill.line.minibar` | Minibar | Minibar | Мини-бар |  |
| `guest.bill.usd` | ≈ {usd} USD (tỷ giá ngày {date}, chỉ tham khảo) | ≈ {usd} USD (rate of {date}, for reference only) | ⟨chừa chỗ⟩ | BR-004 |
| `guest.req.decline.fully_booked` | Đã hết chỗ vào thời gian bạn chọn | Fully booked for the time you chose | ⟨chừa chỗ⟩ |  |
| `guest.req.decline.out_of_hours` | Ngoài giờ phục vụ | Outside service hours | ⟨chừa chỗ⟩ |  |
| `guest.req.decline.not_offered` | OTTIMO chưa có dịch vụ này | OTTIMO doesn't offer this yet | ⟨chừa chỗ⟩ |  |
| `guest.req.decline.other` | Lý do khác – lễ tân sẽ nhắn bạn | Other reason – reception will message you | ⟨chừa chỗ⟩ |  |
| `guest.req.staff_note` | Ghi chú của lễ tân (tiếng Việt) | Note from reception (in Vietnamese) | ⟨chừa chỗ⟩ | Chữ tự do của nhân viên luôn có nhãn ngôn ngữ + lang="vi" (FB-R1-UXR-UXD-06) |
| `guest.lang.ru_soon` | Русская версия скоро – пока показываем английскую. | Russian version coming soon – showing English for now. | Русская версия скоро – пока показываем английскую. | Hiện thay vì trộn RU/EN trên một màn (FB-R1-UXR-UXD-06c) |
| `guest.late.title` | Đến muộn? Tự nhận phòng | Arriving late? Self check-in | ⟨chừa chỗ⟩ | Luồng 7.2 – PHÂN XỬ ORC 15/10 |
| `guest.late.prompt` | Bạn đến sau 22:00? Làm thủ tục trước ngay bây giờ để có mã cửa trước khi đến – không cần chờ lễ tân. | Arriving after 22:00? Complete online check-in now to get your door code before you arrive – no need to wait for reception. | ⟨chừa chỗ⟩ |  |
| `guest.late.arrival_hint` | Bạn chọn đến sau 22:00: làm xong thủ tục là có mã cửa, vào phòng ngay khi đến. | You'll arrive after 22:00: once check-in is done you'll get your door code and can go straight to your room. | ⟨chừa chỗ⟩ |  |
| `guest.late.done_title` | Xong! Mã cửa của bạn đã sẵn sàng | All set! Your door code is ready | ⟨chừa chỗ⟩ |  |
| `guest.late.code_valid` | Dùng từ {from} đến {to} | Valid from {from} to {to} | ⟨chừa chỗ⟩ |  |
| `guest.late.code_kept` | Mã được giữ trong phiên này: mở lại trang để xem, kể cả khi mạng yếu. Đóng trình duyệt thì cần xác minh lại. | The code stays available in this session: reopen this page to see it, even with a weak connection. If you close the browser you'll need to verify again. | ⟨chừa chỗ⟩ | Lưu trong sessionStorage của tab, hết khi đóng phiên hoặc hết khoảng hiệu lực – SEC chốt cách lưu (SR-GST-10) |
| `guest.late.no_share` | Không gửi ảnh chụp mã này cho người khác. | Please don't share a screenshot of this code. | ⟨chừa chỗ⟩ |  |
| `guest.late.how_title` | Cách vào phòng | How to get in | ⟨chừa chỗ⟩ |  |
| `guest.late.how_1` | Đến cửa căn {room}, chạm vào bàn phím của khóa để sáng đèn. | Go to room {room} and touch the lock keypad to wake it. | ⟨chừa chỗ⟩ |  |
| `guest.late.how_2` | Nhập {digits} số của mã cửa. | Enter the {digits}-digit door code. | ⟨chừa chỗ⟩ |  |
| `guest.late.how_3` | Đèn xanh: đẩy cửa vào. Đèn đỏ: chờ 5 giây rồi nhập lại. | Green light: push the door. Red light: wait 5 seconds and try again. | ⟨chừa chỗ⟩ | Mô tả khóa minh họa – chờ ESC-011 (nhà cung cấp khóa) |
| `guest.late.how_photos` | Xem ảnh hướng dẫn | See photo guide | ⟨chừa chỗ⟩ |  |
| `guest.contact.title` | Cần giúp? Người trực đêm | Need help? Night staff | ⟨chừa chỗ⟩ | Số điện thoại người trực lấy từ cấu hình ca – chờ ESC-010 |
| `guest.contact.call` | Gọi người trực | Call night staff | ⟨chừa chỗ⟩ |  |
| `guest.contact.message` | Nhắn Zalo / WhatsApp | Message on Zalo / WhatsApp | ⟨chừa chỗ⟩ |  |
| `guest.contact.hours` | Người trực nghe máy {from}–{to}. | Night staff answer {from}–{to}. | ⟨chừa chỗ⟩ |  |
| `guest.verify.locked_help` | Không vào được trang mã cửa? Gọi hoặc nhắn người trực – họ sẽ cấp mã xác minh cho bạn. | Can't open your door code? Call or message the night staff – they'll give you a verification code. | ⟨chừa chỗ⟩ |  |
| `guest.verify.channel_title` | Nhận mã xác minh qua | Get your verification code by | ⟨chừa chỗ⟩ |  |
| `guest.verify.via_email` | Email {email} | Email {email} | ⟨chừa chỗ⟩ |  |
| `guest.verify.via_channel` | Tin nhắn {channel} | {channel} message | ⟨chừa chỗ⟩ | Chỉ hiện khi owner bật kênh (mặc định tắt) – PHÂN XỬ ORC 15/10 |
| `guest.verify.no_email` | Đơn của bạn chưa có email. Gọi hoặc nhắn lễ tân để nhận mã. | Your booking has no email. Call or message reception to get a code. | ⟨chừa chỗ⟩ |  |
| `guest.verify.call_desk` | Gọi lễ tân | Call reception | ⟨chừa chỗ⟩ |  |
| `guest.late.not_ready` | Chưa làm thủ tục trước? Vẫn nhận phòng được: gọi người trực khi đến, họ làm thủ tục cho bạn trên máy của OTTIMO. | Haven't checked in online? You can still check in: call the night staff when you arrive and they'll do it for you on an OTTIMO device. | ⟨chừa chỗ⟩ |  |
| `booking.email` | Email | Email | ⟨chừa chỗ⟩ |  |
| `booking.email_help` | Không bắt buộc. Có email thì khách tự nhận mã xem mã cửa và hóa đơn. | Optional. With an email the guest can get their own code to see the door code and bill. | ⟨chừa chỗ⟩ | PHÂN XỬ ORC 15/10 – FB-R1-UXR-UXD-02 |
| `booking.no_email_warn` | Đơn chưa có email – khách cần mã xác minh do lễ tân cấp. | No email on this booking – the guest will need a code from reception. | ⟨chừa chỗ⟩ |  |
| `booking.close_draft` | Đóng (giữ nháp) | Close (keep draft) | ⟨chừa chỗ⟩ | Thay 'Hủy' ở chân form – FB-R1-UXR-UXD-12 |
| `desk_code.send_channel` | Gửi mã qua tin nhắn {channel} | Send code by {channel} message | ⟨chừa chỗ⟩ | Chỉ khi owner bật kênh đó trong Tham số › Kênh gửi mã (mặc định tắt) |
| `desk_code.channel_off` | Gửi qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã. | Sending by message is off. The owner can turn it on in Settings › Code channels. | ⟨chừa chỗ⟩ |  |
| `desk_code.separate` | Mã được gửi thành tin nhắn riêng, không kèm link app khách. | The code is sent as a separate message, without the guest link. | ⟨chừa chỗ⟩ |  |
| `night.device_note` | Ca đêm làm trên thiết bị của cơ sở đã được cấp quyền (máy quầy hoặc máy tính bảng của OTTIMO), mở trang quản trị – không dùng điện thoại cá nhân. | Night shift works on an approved OTTIMO device (desk computer or OTTIMO tablet) using the admin site – not on personal phones. | ⟨chừa chỗ⟩ | PHÂN XỬ ORC 15/10; SR-DEV-04 giữ nguyên |
| `night.tasks_title` | Ca đêm · {date} | Night shift · {date} | ⟨chừa chỗ⟩ |  |
| `night.late_arrivals` | Khách đến muộn ({n}) | Late arrivals ({n}) | ⟨chừa chỗ⟩ |  |
| `night.reg_due` | Khai báo cần xong trước {time} | Registration due by {time} | ⟨chừa chỗ⟩ |  |
| `auth.login.error_generic` | Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại. | Incorrect username or password. Forgot it? Ask the owner to reset it. | ⟨chừa chỗ⟩ | Luôn giống nhau, không nêu số lần còn lại (SR-AUTH-04, FB-R1-UXR-UXD-14) |
| `auth.login.username` | Số điện thoại hoặc email | Phone number or email | ⟨chừa chỗ⟩ |  |
| `auth.code_label.totp` | Mã trong ứng dụng xác thực (6 số) | Code from your authenticator app (6 digits) | ⟨chừa chỗ⟩ |  |
| `auth.code_label.recovery` | Mã khôi phục (8 ký tự) | Recovery code (8 characters) | ⟨chừa chỗ⟩ |  |
| `auth.code_label.pin` | PIN duyệt của bạn (4–6 số) | Your approval PIN (4–6 digits) | ⟨chừa chỗ⟩ |  |
| `auth.code_label.guest` | Mã cấp cho khách | Code for the guest | ⟨chừa chỗ⟩ |  |
| `auth.enroll.title` | Bật xác thực 2 bước | Turn on 2-step verification | ⟨chừa chỗ⟩ | SR-AUTH-06 – lần đăng nhập đầu của owner/manager |
| `auth.enroll.step1` | Cài ứng dụng | Install app | ⟨chừa chỗ⟩ |  |
| `auth.enroll.step2` | Quét mã | Scan code | ⟨chừa chỗ⟩ |  |
| `auth.enroll.step3` | Lưu mã khôi phục | Save recovery codes | ⟨chừa chỗ⟩ |  |
| `auth.enroll.step1_help` | Cài một ứng dụng xác thực miễn phí trên điện thoại của bạn, ví dụ Google Authenticator hoặc Microsoft Authenticator. | Install a free authenticator app on your phone, e.g. Google Authenticator or Microsoft Authenticator. | ⟨chừa chỗ⟩ |  |
| `auth.enroll.step2_help` | Trong ứng dụng, chọn Thêm tài khoản → Quét mã QR, rồi quét mã bên dưới. | In the app, choose Add account → Scan QR code, then scan the code below. | ⟨chừa chỗ⟩ |  |
| `auth.enroll.manual_key` | Không quét được? Nhập khóa này: {key} | Can't scan? Enter this key: {key} | ⟨chừa chỗ⟩ |  |
| `auth.enroll.confirm` | Nhập mã 6 số ứng dụng đang hiện để xác nhận | Enter the 6-digit code the app shows to confirm | ⟨chừa chỗ⟩ |  |
| `auth.enroll.step3_help` | Mỗi mã dùng một lần khi bạn mất điện thoại. Lưu ở nơi an toàn (in ra giấy hoặc trình quản lý mật khẩu), không gửi qua chat. | Each code works once if you lose your phone. Keep them somewhere safe (printed or in a password manager); don't send them by chat. | ⟨chừa chỗ⟩ |  |
| `auth.enroll.download` | Tải về (.txt) | Download (.txt) | ⟨chừa chỗ⟩ |  |
| `auth.enroll.print` | In | Print | ⟨chừa chỗ⟩ |  |
| `auth.enroll.ack` | Tôi đã lưu 10 mã khôi phục ở nơi an toàn | I've saved my 10 recovery codes somewhere safe | ⟨chừa chỗ⟩ |  |
| `auth.enroll.done` | Đã bật xác thực 2 bước | 2-step verification is on | ⟨chừa chỗ⟩ |  |
| `auth.enroll.single_owner` | Bạn đang là chủ đầu tư duy nhất. Nếu mất cả điện thoại lẫn mã khôi phục, cần đội kỹ thuật mở khóa (mất thời gian). Nên chỉ định thêm một người khôi phục. | You're the only owner. If you lose both your phone and recovery codes, the tech team must unlock your account (this takes time). Consider adding a recovery person. | ⟨chừa chỗ⟩ | Câu hỏi 'owner thứ 2' chuyển PO/SEC |
| `device.check.disk` | Ổ đĩa đã mã hóa | Disk is encrypted | ⟨chừa chỗ⟩ |  |
| `device.check.lock` | Tự khóa màn hình sau 5 phút | Screen locks after 5 minutes | ⟨chừa chỗ⟩ |  |
| `device.check.ext` | Trình duyệt không cài tiện ích | No browser extensions installed | ⟨chừa chỗ⟩ |  |
| `device.check.clip` | Tắt lịch sử/đồng bộ bộ nhớ tạm | Clipboard history/sync is off | ⟨chừa chỗ⟩ |  |
| `device.check.how` | Cách kiểm tra | How to check | ⟨chừa chỗ⟩ |  |
| `device.check.ops` | Đội kỹ thuật đã kiểm máy này | Tech team checked this device | ⟨chừa chỗ⟩ | Thay owner tự cam kết – FB-R1-UXR-UXD-07 |
| `today.title` | Hôm nay | Today | ⟨chừa chỗ⟩ | Màn mặc định front_desk, front_desk_lead (decision-log PO 15/10) |
| `today.arrivals` | Khách đến ({n}) | Arrivals ({n}) | ⟨chừa chỗ⟩ |  |
| `today.departures` | Khách đi ({n}) | Departures ({n}) | ⟨chừa chỗ⟩ |  |
| `today.registration` | Khai báo còn thiếu | Registrations to do | ⟨chừa chỗ⟩ |  |
| `today.holds` | Giữ chỗ sắp hết hạn | Holds expiring soon | ⟨chừa chỗ⟩ |  |
| `today.requests` | Yêu cầu của khách | Guest requests | ⟨chừa chỗ⟩ |  |
| `today.open_rack` | Mở sơ đồ phòng | Open room rack | ⟨chừa chỗ⟩ | Phím tắt R |
| `crm.title_new` | Hồ sơ khách mới | New guest profile | ⟨chừa chỗ⟩ | US-071 |
| `crm.duplicate_title` | Có thể trùng với hồ sơ đã có | This may match an existing profile | ⟨chừa chỗ⟩ | DUPLICATE_GUEST – US-072, BR-951/952 |
| `crm.duplicate_open` | Mở hồ sơ đã có | Open existing profile | ⟨chừa chỗ⟩ |  |
| `crm.duplicate_use` | Dùng hồ sơ này cho đơn | Use this profile for the booking | ⟨chừa chỗ⟩ |  |
| `crm.duplicate_new_anyway` | Vẫn tạo hồ sơ mới (ghi lý do) | Create a new profile anyway (add reason) | ⟨chừa chỗ⟩ |  |
| `msgtpl.title` | Mẫu tin nhắn | Message templates | ⟨chừa chỗ⟩ | US-125 |
| `msgtpl.copy` | Sao chép | Copy | ⟨chừa chỗ⟩ |  |
| `msgtpl.copied` | Đã chép | Copied | ⟨chừa chỗ⟩ |  |
| `msgtpl.missing_var` | Đơn chưa có {field} – điền trước khi gửi. | This booking has no {field} – fill it in before sending. | ⟨chừa chỗ⟩ |  |
| `config.rooms` | Danh mục căn | Rooms | ⟨chừa chỗ⟩ | US-004 |
| `config.params` | Tham số quy tắc | Rule settings | ⟨chừa chỗ⟩ | US-005 |
| `config.minibar` | Danh mục minibar | Minibar items | ⟨chừa chỗ⟩ | US-066 |
| `config.effective_from` | Hiệu lực từ | Effective from | ⟨chừa chỗ⟩ |  |
| `config.stop_sale` | Ngừng bán | Stop selling | ⟨chừa chỗ⟩ |  |
| `config.view_only` | Chỉ xem – chủ đầu tư sửa | View only – owner can edit | ⟨chừa chỗ⟩ | A102 |
| `moneylog.title` | Nhật ký thao tác tiền | Money activity log | ⟨chừa chỗ⟩ | US-006 |

#### R2 hi-fi – Đặt phòng mới (H09)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `bk.ch_agent` | CTV / môi giới | Agent / broker | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ch_direct` | Trực tiếp | Direct | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ch_internal` | Nội bộ | Internal | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ch_ota` | OTA | OTA | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.checking` | Đang kiểm phòng trống… | Checking availability… | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.closer` | CTV chốt đơn | Agent who closed the booking | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.create_offline` | Tạo đơn (cần có mạng) | Create booking (needs connection) | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.deposit_line` | Cọc cần thu ({pct}% tiền phòng, làm tròn – BR-305) | Deposit due ({pct}% of room charges, rounded – BR-305) | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.eta` | Giờ đến dự kiến | Expected arrival time | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.eta_help` | Đến sau {time} → lễ tân chuẩn bị nhận phòng muộn. | Arriving after {time} → front desk prepares a late check-in. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.free_ok` | Căn trống cả khoảng ngày | Room is free for all dates | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.guest_help` | Tìm theo tên, SĐT, email, mã KH – hoặc tạo nhanh | Search by name, phone, email, guest ID – or quick-create | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.internal_help` | Phòng dùng nội bộ (nhân viên, kiểm tra) – không tính doanh thu, vẫn chiếm phòng. | Internal use (staff, inspection) – no revenue, still blocks the room. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.long_body` | Từ 28 đêm phải làm hợp đồng (BR-108). Ở giai đoạn này, tạo "Đơn dài hạn nhập tay" để giữ phòng; hợp đồng vẫn làm ngoài hệ thống. | From 28 nights a lease is required (BR-108). For now, create a "Manual long-stay booking" to hold the room; the lease is still handled outside the app. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.long_title` | {n} đêm là thuê dài hạn | {n} nights is a long stay | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.los_none` | Giảm theo số đêm (BR-107): không áp dụng | Length-of-stay discount (BR-107): not applicable | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.new_cta` | Đặt phòng mới | New booking | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `bk.night` | Đêm | Night | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.offline` | Mất kết nối – chưa tạo đơn được. Nháp vẫn giữ trên máy này. | You're offline – the booking can't be created yet. Your draft is kept on this computer. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.open_booking` | Mở đơn | Open booking | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ota_conflict_body` | Đơn OTA vẫn được nhận (đã cam kết với kênh). Chọn một căn trống cùng nhóm, hoặc lưu chưa gán căn để xử lý sau. | The OTA booking is still accepted (we're committed to the channel). Pick a free room in the same group, or save it unassigned and resolve it later. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ota_conflict_title` | Căn {room} đã kín {from} → {to} | Room {room} is already booked {from} → {to} | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ota_name` | Kênh OTA | OTA channel | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.ota_rate_warn` | Giá OTA nằm ngoài khoảng sàn–trần. Vẫn lưu được – ghi lý do để quản lý xem lại. | The OTA rate is outside the floor–ceiling range. You can still save – add a reason for the manager to review. | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.other_groups` | Xem nhóm khác | See other room groups | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.pay_at_property` | Khách trả tại OTTIMO | Guest pays at OTTIMO | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.payment_model` | Thanh toán | Payment | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.rate` | Giá | Rate | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.rate_help` | Sửa được trong khoảng {min} – {max} (sàn–trần nhóm, BR-105). | Editable within {min} – {max} (group floor–ceiling, BR-105). | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.rate_source` | Nguồn giá | Rate source | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.reason_ph` | Lý do (bắt buộc) | Reason (required) | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.room_help` | (định mức/tối đa) – chỉ hiện căn đang bán và còn trống trong khoảng ngày | (standard/max guests) – only rooms on sale and free for these dates | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.save_unassigned` | Lưu chưa gán căn | Save without a room | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.source` | Nguồn | Source | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_list` | Giá niêm yết (BR-101) | List price (BR-101) | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_return` | Khách quay lại | Returning guest | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_sales` | Sale nội bộ | Sales staff | ⟨chừa chỗ⟩ | directSource=sales_staff (0.3.1) |
| `bk.src_walkin` | Khách vãng lai | Walk-in | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_web` | Website | Website | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_weekend` | Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104) | Rate calendar: Friday/Saturday +15% (BR-104) | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.src_zalo` | Zalo / điện thoại | Zalo / phone | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.to_manual_long` | Tạo đơn dài hạn nhập tay | Create manual long-stay booking | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.total` | Tổng tiền đơn | Booking total | ⟨chừa chỗ⟩ | 09-booking.html |
| `bk.use_room` | Dùng căn {room} | Use room {room} | ⟨chừa chỗ⟩ | 09-booking.html |

#### R2 hi-fi – Khách hàng (H06)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `crm.col_code` | Mã KH | Guest ID | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.col_contact` | Liên hệ | Contact | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.col_last` | Lưu trú gần nhất | Last stay | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.col_name` | Họ tên | Full name | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.col_nat` | Quốc tịch | Nationality | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.col_tags` | Nhóm khách | Guest group | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.contact_rule` | Cần ít nhất số điện thoại hoặc email. | At least a phone number or an email is needed. | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.draft_saved` | Nháp tự lưu {time} | Draft saved {time} | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.empty_body` | Thử tìm bằng số điện thoại hoặc email, hoặc tạo hồ sơ mới. | Try searching by phone or email, or create a new profile. | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.empty_title` | Chưa có khách nào khớp "{q}" | No guest matches "{q}" | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.error_title` | Chưa tải được danh sách khách | Couldn't load the guest list | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_company` | Công ty | Company | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_dob` | Ngày sinh | Date of birth | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_handles` | WhatsApp / KakaoTalk | WhatsApp / KakaoTalk | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_lang` | Ngôn ngữ giao tiếp | Preferred language | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_name` | Họ và tên | Full name | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_nat` | Quốc tịch | Nationality | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_note` | Ghi chú nội bộ | Internal note | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_pref` | Liên hệ ưu tiên | Preferred contact | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_service` | Lưu ý phục vụ | Service notes | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.f_tags` | Nhóm khách | Guest group | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.near_dup_body` | {guest} có cùng ngày sinh {dob}. Kiểm tra trước khi tạo hồ sơ mới. | {guest} has the same date of birth {dob}. Check before creating a new profile. | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.new_cta` | Thêm khách | Add guest | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.no_id_note` | Giấy tờ tùy thân không nhập ở đây – chỉ thêm ở bước nhận phòng trên máy được cấp. | ID documents aren't entered here – only at check-in on an approved device. | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.phone_taken` | Trùng với hồ sơ {code} (đã chuẩn hóa thành {phone}). | Matches profile {code} (normalised to {phone}). | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.pref_phone` | Gọi điện | Phone call | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.pref_zalo` | Zalo | Zalo | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.quick_create` | Tạo nhanh khách "{q}" | Quick-create guest "{q}" | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.results` | {n} kết quả | {n} results | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.save` | Lưu hồ sơ | Save profile | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.save_blocked` | Lưu hồ sơ (đang trùng SĐT) | Save profile (phone number already in use) | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.search_label` | Tìm khách | Search guests | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.search_ph` | Tên (có/không dấu), SĐT, email, mã KH | Name (with or without accents), phone, email, guest ID | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.suspect_dup` | Nghi trùng | Possible duplicate | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.svc_extra_pillow` | Thêm gối | Extra pillow | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.svc_help` | Chọn từ danh sách – không ghi thông tin sức khỏe. | Pick from the list – don't record health information. | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.svc_high_floor` | Thích tầng cao | Prefers a high floor | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.svc_quiet` | Cần yên tĩnh | Needs a quiet room | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.tag_corp` | Khách công ty | Corporate guest | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.tag_none` | Chưa phân nhóm | No group | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.tag_return` | Khách quay lại | Returning guest | ⟨chừa chỗ⟩ | 06-guests.html |
| `crm.use_this` | Dùng hồ sơ này | Use this profile | ⟨chừa chỗ⟩ | 06-guests.html |

#### R2 hi-fi – Thiết bị được cấp (H07)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `device.check_legend` | Kiểm máy trước khi cấp | Check the device before approving | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.col_by` | Cấp bởi | Approved by | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.col_device` | Thiết bị | Device | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.col_expires` | Hết hạn | Expires | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.col_last` | Dùng gần nhất | Last used | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.expires_soon` | Hết hạn sau {days} ngày | Expires in {days} days | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.grant_locked` | Cấp quyền thiết bị này (còn {n} mục kiểm) | Approve this device ({n} checks left) | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.kind` | Loại thiết bị | Device type | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.kind_desk` | Máy quầy / laptop | Front-desk computer / laptop | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.kind_help` | Máy quầy/laptop: hạn {desk_days} ngày. Máy tính bảng của cơ sở: hạn tối đa {mobile_days} ngày, cấp lại định kỳ. | Front-desk computer/laptop: valid {desk_days} days. Property tablet: valid up to {mobile_days} days, renew regularly. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.kind_mobile` | Máy tính bảng của cơ sở | Property tablet | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `device.this` | Máy này | This device | ⟨chừa chỗ⟩ | 07-users-devices.html |

#### R2 hi-fi – Mã lỗi API bổ sung (OpenAPI 0.3 / 0.3.1)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `error.INTERNAL_ERROR` | Máy chủ đang gặp sự cố. Dữ liệu của bạn không bị mất. Thử lại sau ít phút; nếu vẫn lỗi, báo quản lý mã tham chiếu {request_id}. | The server is having a problem. Nothing has been lost. Try again in a few minutes; if it keeps failing, give your manager the reference {request_id}. | ⟨chừa chỗ⟩ | 500 – cùng câu error.server + Problem.requestId (0.3.1) |
| `error.USERNAME_TAKEN` | Tên đăng nhập này đã có người dùng. Chọn số điện thoại hoặc email khác. | This username is already taken. Use a different phone number or email. | ⟨chừa chỗ⟩ | 409 – createUser (0.3.1) |
| `error.PARTY_DUPLICATE` | Người này đã có trong đơn. Chọn người khác. | This person is already on the booking. Choose someone else. | ⟨chừa chỗ⟩ | 409 – addPartyMember, US-022 AC3 (0.3.1) |
| `error.ROOM_NOT_READY` | Căn {room} chưa sẵn sàng ({status}). Chọn căn đã kiểm sẵn sàng hoặc đã dọn. | Room {room} isn't ready ({status}). Choose a room that is inspected or cleaned. | ⟨chừa chỗ⟩ | 409 – changeRoom B14, kèm roomStatus (0.3.1) |
| `field.MAX_OCCUPANCY_RANGE` | Tối đa chỉ được bằng định mức hoặc định mức + 1. | Maximum can only equal the standard occupancy or standard + 1. | ⟨chừa chỗ⟩ | errors[].code – ESC-014 (0.3.1) |
| `field.OTA_REF_DUPLICATE` | Mã đặt phòng OTA này đã có ở đơn khác. Kiểm tra để tránh nhập trùng. | This OTA booking reference is already on another booking. Check to avoid a duplicate. | ⟨chừa chỗ⟩ | errors[].code (0.3.1) |
| `field.DIRECT_SOURCE_NOT_ALLOWED` | Chỉ chọn nguồn cho đơn kênh Trực tiếp. | Source applies only to Direct bookings. | ⟨chừa chỗ⟩ | errors[].code (0.3.1) |
| `field.LONG_STAY_REQUIRES_CONTRACT` | Từ 28 đêm là thuê dài hạn – tạo đơn dài hạn nhập tay. | 28 nights or more is a long stay – create a manual long-stay booking. | ⟨chừa chỗ⟩ | errors[].code – BR-108 (0.3.1) |
| `field.MIN_STAY_NOT_MET` | Ngày này cần ở tối thiểu {n} đêm. | This date requires a minimum stay of {n} nights. | ⟨chừa chỗ⟩ | errors[].code – BR-113; FDL+ bỏ qua bằng lý do |
| `field.LAST_OWNER` | Không bỏ được vai chủ đầu tư cuối cùng của cơ sở. | You can't remove the last owner of this property. | ⟨chừa chỗ⟩ | errors[].code – rbac 5.3 (0.3.1) |
| `error.PARAM_OUT_OF_RANGE` | Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: {allowed}. | This value is outside the allowed range. Choose one of: {allowed}. | ⟨chừa chỗ⟩ | 05-params.html |
| `error.CAPACITY_BELOW_BOOKINGS` | Chưa giảm số người được: có đơn đã nhận nhiều khách hơn. Đổi số khách hoặc đổi căn cho các đơn trong danh sách trước. | Can't lower the occupancy: some bookings already have more guests. Change their guest count or move them first. | ⟨chừa chỗ⟩ | 409 – kèm conflicts[] (BUG-R1-007) |
| `error.MFA_REQUIRED` | Nhập mã trong ứng dụng xác thực để hoàn tất đăng nhập. | Enter the code from your authenticator app to finish signing in. | ⟨chừa chỗ⟩ | 401 – sang màn nhập mã |
| `error.PASSWORD_CHANGE_REQUIRED` | Bạn đang dùng mật khẩu tạm. Đặt mật khẩu riêng để tiếp tục. | You're using a temporary password. Set your own password to continue. | ⟨chừa chỗ⟩ | 403 – sang màn đổi mật khẩu |
| `error.REAUTH_REQUIRED` | Để tiếp tục, nhập lại mật khẩu (hoặc PIN duyệt) của bạn. | To continue, re-enter your password (or approval PIN). | ⟨chừa chỗ⟩ | 401 – step-up C3 |
| `error.GUEST_VERIFICATION_LOCKED` | Đã thử sai quá nhiều lần. Gọi hoặc nhắn lễ tân để nhận mã xác minh mới. | Too many wrong attempts. Call or message the front desk for a new verification code. | ⟨chừa chỗ⟩ | 429 – app khách (SR-GST-08) |
| `error.GUEST_STAY_ENDED` | Bạn đã trả phòng. Trang này chỉ còn xem phiếu thanh toán. | You've checked out. This page now only shows your bill. | ⟨chừa chỗ⟩ | 403 – app khách (SR-GST-11) |
| `error.DELIVERY_CHANNEL_DISABLED` | Gửi mã qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã, hoặc đọc mã cho khách. | Sending codes by message is off. The owner can turn it on in Settings › Code delivery, or read the code to the guest. | ⟨chừa chỗ⟩ | 409 |
| `error.PAYLOAD_TOO_LARGE` | Tệp quá lớn (tối đa 10 MB). Chụp lại hoặc chọn ảnh nhỏ hơn. | The file is too large (max 10 MB). Retake or choose a smaller photo. | ⟨chừa chỗ⟩ | 413 |
| `error.SHIFT_ALREADY_OPEN` | Bạn đang có một ca chưa đóng. Đóng ca đó trước khi mở ca mới. | You already have a shift open. Close it before opening a new one. | ⟨chừa chỗ⟩ | 409 – R3 (US-124) |
| `error.SHIFT_NOT_OPEN` | Chưa mở ca nên chưa ghi tiền mặt được. Mở ca rồi thử lại. | No shift is open, so cash can't be recorded. Open a shift and try again. | ⟨chừa chỗ⟩ | 409 – R3 (US-124) |
| `error.SHIFT_VARIANCE_REASON_REQUIRED` | Tiền mặt đang lệch so với sổ. Ghi lý do chênh lệch trước khi đóng ca. | Cash doesn't match the records. Add a reason for the difference before closing the shift. | ⟨chừa chỗ⟩ | 422 – R3 (US-124) |
| `error.GROUP_ALLOCATION_MISMATCH` | Tổng tiền chia cho các đơn chưa khớp số tiền đã nhận. Kiểm lại từng dòng. | The amounts split across bookings don't add up to the payment. Check each line. | ⟨chừa chỗ⟩ | 422 – R3 (US-140) |

#### R2 hi-fi – Buồng phòng – bộ đồ dùng thêm (INV 16/10)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.task.extra_kit` | Chuẩn bị {n} bộ đồ dùng thêm – căn {room}, trước {time} | Prepare {n} extra amenity kit(s) – room {room}, before {time} | ⟨chừa chỗ⟩ | Việc buồng phòng tự sinh khi đơn có người vượt định mức (INV 16/10) |
| `hk.task.extra_kit_items` | Mỗi bộ: 1 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối) | Each kit: 1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries (no pillow) | ⟨chừa chỗ⟩ | INV xác nhận 16/10 – BR-812; HkTaskType extra_guest_kit_prepare/collect/transfer (OpenAPI 0.3.1) |

#### R2 hi-fi – Đăng nhập (H01)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `login.no_signup` | Chưa có tài khoản? Nhờ chủ đầu tư tạo cho bạn. | No account yet? Ask the owner to create one for you. | ⟨chừa chỗ⟩ | 01-login.html |
| `login.offline` | Không có mạng. Cần kết nối để đăng nhập. | No connection. You need to be online to sign in. | ⟨chừa chỗ⟩ | 01-login.html |
| `login.password` | Mật khẩu | Password | ⟨chừa chỗ⟩ | 01-login.html |
| `login.remember` | Giữ đăng nhập trên máy này (máy của khách sạn) | Keep me signed in on this computer (hotel device) | ⟨chừa chỗ⟩ | 01-login.html |
| `login.show_password` | Hiện | Show | ⟨chừa chỗ⟩ | 01-login.html |
| `login.submit` | Đăng nhập | Sign in | ⟨chừa chỗ⟩ | 01-login.html |
| `login.submitting` | Đang đăng nhập… | Signing in… | ⟨chừa chỗ⟩ | 01-login.html |
| `login.title` | Đăng nhập | Sign in | ⟨chừa chỗ⟩ | 01-login.html |

#### R2 hi-fi – Đơn dài hạn nhập tay – US-017 AC5a (H10)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `lsm.below_threshold` | {n} đêm chưa tới ngưỡng dài hạn (từ {min} đêm). Tạo đơn ngắn ngày thay thế. | {n} nights is below the long-stay threshold (from {min} nights). Create a short-stay booking instead. | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.col_code` | Mã đơn | Booking ID | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.col_deposit` | Ký quỹ ngoài app | Security deposit (outside app) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.col_last_pay` | Lần thu gần nhất | Last payment | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.col_period` | Thời hạn | Term | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.col_rent` | Tiền thuê/tháng | Rent/month | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.contract_ref` | Số hợp đồng giấy | Paper lease number | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.create` | Tạo đơn dài hạn | Create long-stay booking | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.deposit` | Ký quỹ đang giữ (ngoài app) | Security deposit held (outside app) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.deposit_help` | Chỉ để ghi nhớ – không tạo giao dịch | For reference only – no transaction is created | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.duration` | {months} tháng · {nights} đêm | {months} months · {nights} nights | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.edit` | Sửa thông tin HĐ | Edit lease details | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.export` | Xuất danh sách (.csv) | Export list (.csv) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.extra_note` | Phụ thu người thêm của khách dài hạn ghi theo hợp đồng giấy – app không tự tính ở đơn này. | Extra-guest charges for long-stay guests follow the paper lease – the app doesn't calculate them for this booking. | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.filter_chip` | Lọc: HĐ ngoài hệ thống | Filter: lease outside the app | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.flag` | HĐ ngoài hệ thống – chuyển vào app ở R3 | Lease outside the app – moved into the app in R3 | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.flag_body` | Hợp đồng, lịch thu theo kỳ và ký quỹ vẫn làm như hiện nay. Đơn này giữ phòng trên sơ đồ; tiền thu được ghi từng lần trong folio. Khi app có hợp đồng, đơn được chuyển sang, giữ nguyên mã đơn. | The lease, payment schedule and security deposit are handled as today. This booking holds the room on the rack; payments are recorded one by one in the folio. When the app supports leases, the booking is moved over with the same booking ID. | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.list_title` | Đơn dài hạn nhập tay | Manual long-stay bookings | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.move_in` | Ngày vào | Move-in date | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.move_out` | Ngày ra (theo HĐ) | Move-out date (per lease) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.no_reminder` | App chưa nhắc thu theo kỳ cho đơn này. Theo dõi lịch thu như hiện nay. | The app doesn't send payment-period reminders for this booking yet. Keep tracking the schedule as you do today. | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.not_generated` | Đơn này không sinh: hợp đồng, lịch kỳ thu, nhắc thu, hoa hồng. | This booking does not create: a lease, a payment schedule, payment reminders, or commission. | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.note` | Ghi chú (gói dọn, chu kỳ thu…) | Notes (cleaning package, payment cycle…) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.pay_line` | Thu tiền thuê (ghi tay) | Rent received (recorded manually) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.pending_r3` | Chờ chuyển vào app | Waiting to move into the app | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.record_payment` | Ghi thu tiền | Record payment | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.rent` | Tiền thuê mỗi tháng (theo HĐ) | Monthly rent (per lease) | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.rent_help` | Nhập tay đúng số trên hợp đồng giấy | Type exactly the amount on the paper lease | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.title` | Đơn dài hạn nhập tay | Manual long-stay booking | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |
| `lsm.to_short` | Chuyển sang đặt phòng ngắn ngày | Switch to a short-stay booking | ⟨chừa chỗ⟩ | 10-long-stay-manual.html |

#### R2 hi-fi – Xác thực 2 bước nền (H01)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `mfa.finish_locked` | Hoàn tất (tích ô "đã lưu" trước) | Finish (tick "saved" first) | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.installed` | Tôi đã cài – Tiếp tục | I've installed it – Continue | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.nudge` | Tài khoản chủ đầu tư/quản lý nên bật xác thực 2 bước. Từ khi có dữ liệu khách thật, việc này là bắt buộc. | Owner and manager accounts should turn on 2-step verification. Once real guest data is in the app, it becomes mandatory. | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.nudge_cta` | Bật ngay | Turn on now | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.nudge_later` | Để sau | Later | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.recovery_after` | Sau khi vào, bạn cần đăng ký lại ứng dụng xác thực. Mã vừa dùng bị hủy. | After signing in, set up your authenticator app again. The code you used is cancelled. | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.recovery_help` | Nhập một trong 10 mã khôi phục bạn đã lưu khi bật xác thực 2 bước. | Enter one of the 10 recovery codes you saved when you turned on 2-step verification. | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.recovery_submit` | Đăng nhập bằng mã khôi phục | Sign in with recovery code | ⟨chừa chỗ⟩ | 01-login.html |
| `mfa.recovery_title` | Dùng mã khôi phục | Use a recovery code | ⟨chừa chỗ⟩ | 01-login.html |

#### R2 hi-fi – Điều hướng theo vai (H02)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `nav.approvals` | Cần duyệt | Approvals | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.availability` | Căn trống | Availability | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.device_trusted` | Máy quầy đã cấp quyền | Approved front-desk computer | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.device_untrusted` | Máy chưa cấp quyền giấy tờ | Device not approved for IDs | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.devices` | Thiết bị được cấp | Approved devices | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.guests` | Khách hàng | Guests | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.housekeeping` | Buồng phòng | Housekeeping | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.maintenance` | Bảo trì | Maintenance | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.me` | Tôi | Me | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.moneylog` | Nhật ký tiền | Money log | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.more` | Thêm | More | ⟨chừa chỗ⟩ | 08-rack.html |
| `nav.my_bookings` | Đơn của tôi | My bookings | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.my_guests` | Khách của tôi | My guests | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.my_quotes` | Báo giá | Quotes | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.my_tasks` | Việc của tôi | My tasks | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.overview` | Tổng quan | Overview | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.params` | Tham số quy tắc | Rule settings | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.quotes` | Báo giá & giữ chỗ | Quotes & holds | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.rack` | Sơ đồ phòng | Room rack | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.registration` | Giấy tờ & khai báo | IDs & registration | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.report_issue` | Báo sự cố | Report an issue | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.reservations` | Đơn đặt phòng | Bookings | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.rooms` | Danh mục căn | Rooms | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.rooms_short` | Phòng | Rooms | ⟨chừa chỗ⟩ | 08-rack.html |
| `nav.rooms_status` | Các căn | Rooms | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.sec.admin` | Quản trị | Admin | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.sec.ops` | Vận hành | Operations | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.sec.sales` | Khách & bán | Guests & sales | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.sec.top` | Điều hành | Management | ⟨chừa chỗ⟩ | 04-rooms.html |
| `nav.tasks` | Việc | Tasks | ⟨chừa chỗ⟩ | 08-rack.html |
| `nav.today` | Hôm nay | Today | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.users` | Người dùng & vai | Users & roles | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `nav.work_orders` | Phiếu sửa | Work orders | ⟨chừa chỗ⟩ | 02-role-nav.html |

#### R2 hi-fi – Số khách – định mức/tối đa, ESC-014 (H09, H10, H12)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `occ.adults` | Người lớn (từ 12 tuổi) | Adults (12+) | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.adults_short` | Người lớn | Adults | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `occ.children` | Trẻ 6–11 tuổi | Children 6–11 | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.children_short` | Trẻ 6–11 | Kids 6–11 | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `occ.fee_line` | Phụ thu {n} người vượt định mức × {nights} đêm (BR-110) | Extra-guest charge: {n} over standard × {nights} nights (BR-110) | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.kit_chip` | Vượt định mức {n} · chuẩn bị bộ đồ dùng thêm | {n} over standard · prepare extra amenity kit | ⟨chừa chỗ⟩ | 03-today.html |
| `occ.kit_reminder` | Vượt định mức {n} người – khách ngủ sofa. Nhớ chuẩn bị bộ đồ dùng thêm (1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – không gối); buồng phòng tự nhận việc khi lưu đơn. | {n} guest(s) over the standard occupancy – sleeping on the sofa. Remember to prepare an extra amenity kit (1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries – no pillow); housekeeping gets the task automatically when the booking is saved. | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6` | Trẻ dưới 6 tuổi | Children under 6 | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6_note` | Trẻ dưới 6 tuổi ngủ chung giường bố mẹ, không tính vào số này. | Children under 6 share their parents' bed and don't count towards this number. | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6_short` | Dưới 6 | Under 6 | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `occ.summary` | Tính {counted}/{max} người (định mức {base}) · trẻ dưới 6 tuổi: {under6} | Counted {counted}/{max} guests (standard {base}) · children under 6: {under6} | ⟨chừa chỗ⟩ | JS hifi.js – trẻ dưới 6 tuổi không tính (BR-110) |
| `occ.fee_ota` | Đơn OTA: không cộng phụ thu người – OTA đã tính theo số khách | OTA booking: no extra-guest charge – the OTA already priced the guest count | ⟨chừa chỗ⟩ | US-017 AC7 |

#### R2 hi-fi – Tham số quy tắc (H05)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `params.allowed` | Cho phép: {values} | Allowed: {values} | ⟨chừa chỗ⟩ | 05-params.html |
| `params.apply_note` | Giữ chỗ đã tạo giữ hạn cũ. Mức mới áp cho giữ chỗ tạo từ ngày hiệu lực. | Existing holds keep their old expiry. The new value applies to holds created from the effective date. | ⟨chừa chỗ⟩ | 05-params.html |
| `params.child_free` | Trẻ miễn phí, không tính số người – dưới | Children free and not counted – under | ⟨chừa chỗ⟩ | 05-params.html |
| `params.col_changed` | Sửa gần nhất | Last changed | ⟨chừa chỗ⟩ | 05-params.html |
| `params.col_name` | Tham số | Setting | ⟨chừa chỗ⟩ | 05-params.html |
| `params.col_rule` | Quy tắc | Rule | ⟨chừa chỗ⟩ | 05-params.html |
| `params.col_value` | Giá trị | Value | ⟨chừa chỗ⟩ | 05-params.html |
| `params.deposit_pct` | Cọc ngắn ngày | Short-stay deposit | ⟨chừa chỗ⟩ | 05-params.html |
| `params.edit_title` | Sửa: {name} | Edit: {name} | ⟨chừa chỗ⟩ | 05-params.html |
| `params.error_title` | Chưa tải được tham số | Couldn't load settings | ⟨chừa chỗ⟩ | 05-params.html |
| `params.extra_adult` | Phụ thu người lớn vượt định mức (mỗi đêm) | Extra adult over standard (per night) | ⟨chừa chỗ⟩ | 05-params.html |
| `params.extra_child` | Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm) | Extra child 6–11 over standard (per night) | ⟨chừa chỗ⟩ | 05-params.html |
| `params.foc_limit_fdl` | Hạn mức FOC mỗi lần – lễ tân trưởng | Comp limit per request – front-desk lead | ⟨chừa chỗ⟩ | 05-params.html |
| `params.grp_booking` | Giữ chỗ, cọc, hủy | Holds, deposits, cancellations | ⟨chừa chỗ⟩ | 05-params.html |
| `params.grp_money` | FOC, hoa hồng, phí kênh | Comps, commission, channel fees | ⟨chừa chỗ⟩ | 05-params.html |
| `params.grp_occupancy` | Số người & phụ thu | Occupancy & surcharges | ⟨chừa chỗ⟩ | 05-params.html |
| `params.grp_time` | Giờ nhận/trả | Check-in/out times | ⟨chừa chỗ⟩ | 05-params.html |
| `params.h_new` | Mới | New | ⟨chừa chỗ⟩ | 05-params.html |
| `params.h_old` | Cũ | Old | ⟨chừa chỗ⟩ | 05-params.html |
| `params.h_when` | Thời điểm | When | ⟨chừa chỗ⟩ | 05-params.html |
| `params.h_who` | Người sửa | Changed by | ⟨chừa chỗ⟩ | 05-params.html |
| `params.history` | Lịch sử thay đổi | Change history | ⟨chừa chỗ⟩ | 05-params.html |
| `params.hold_hours` | Hạn giữ chỗ mặc định | Default hold time | ⟨chừa chỗ⟩ | 05-params.html |
| `params.new_value` | Giá trị mới | New value | ⟨chừa chỗ⟩ | 05-params.html |
| `params.open_rooms` | Mở danh mục căn | Open rooms | ⟨chừa chỗ⟩ | 05-params.html |
| `params.quote_valid` | Hiệu lực báo giá | Quote validity | ⟨chừa chỗ⟩ | 05-params.html |
| `params.reason` | Lý do | Reason | ⟨chừa chỗ⟩ | 05-params.html |
| `params.room_capacity` | Định mức và tối đa từng căn | Standard and maximum occupancy per room | ⟨chừa chỗ⟩ | 05-params.html |
| `params.room_capacity_value` | Sửa ở Danh mục căn | Edit in Rooms | ⟨chừa chỗ⟩ | 05-params.html |
| `params.save` | Lưu thay đổi | Save change | ⟨chừa chỗ⟩ | 05-params.html |
| `params.subtitle` | Thay đổi áp dụng cho đơn tạo sau ngày hiệu lực | Changes apply to bookings created after the effective date | ⟨chừa chỗ⟩ | 05-params.html |
| `params.unit_hours` | giờ | hours | ⟨chừa chỗ⟩ | 05-params.html |
| `params.view_only_banner` | Bạn đang xem tham số. Chỉ chủ đầu tư và quản lý sửa được. | You're viewing settings. Only the owner and manager can edit them. | ⟨chừa chỗ⟩ | 05-params.html |
| `params.status_gd` | Chờ chủ đầu tư xác nhận | Awaiting owner confirmation | ⟨chừa chỗ⟩ | Parameter.statusLabel = GD |
| `params.status_pl` | Chờ luật sư/kế toán xác nhận | Awaiting lawyer/accountant confirmation | ⟨chừa chỗ⟩ | Parameter.statusLabel = PL |

#### R2 hi-fi – Chọn cơ sở (H01)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `prop.lead` | Bạn có quyền ở {n} cơ sở. Chọn nơi làm việc hôm nay. | You have access to {n} properties. Choose where you're working today. | ⟨chừa chỗ⟩ | 01-login.html |
| `prop.meta` | {rooms} căn · vai của bạn: {roles} | {rooms} rooms · your role: {roles} | ⟨chừa chỗ⟩ | 01-login.html |
| `prop.none_body` | Nhờ chủ đầu tư gán vai cho bạn rồi đăng nhập lại. | Ask the owner to give you a role, then sign in again. | ⟨chừa chỗ⟩ | 01-login.html |
| `prop.none_title` | Tài khoản chưa được gán cơ sở nào | Your account isn't linked to any property yet | ⟨chừa chỗ⟩ | 01-login.html |
| `prop.title` | Chọn cơ sở | Choose property | ⟨chừa chỗ⟩ | 01-login.html |

#### R2 hi-fi – Đổi mật khẩu lần đầu (H01)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `pw.lead` | Bạn đang dùng mật khẩu tạm do chủ đầu tư cấp. Đặt mật khẩu riêng để tiếp tục. | You're using a temporary password from the owner. Set your own password to continue. | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.mismatch` | Hai mật khẩu chưa giống nhau. | The two passwords don't match. | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.new` | Mật khẩu mới | New password | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.repeat` | Nhập lại mật khẩu mới | Repeat new password | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.rule_common` | Không phải mật khẩu phổ biến | Not a common password | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.rule_len` | Ít nhất {n} ký tự | At least {n} characters | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.rule_name` | Không chứa tên hoặc số điện thoại của bạn | Doesn't contain your name or phone number | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.submit` | Lưu và vào ứng dụng | Save and continue | ⟨chừa chỗ⟩ | 01-login.html |
| `pw.title` | Đặt mật khẩu của bạn | Set your password | ⟨chừa chỗ⟩ | 01-login.html |

#### R2 hi-fi – Sơ đồ phòng (H08)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `rack.all_groups` | Tất cả nhóm | All groups | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.by_room` | Theo căn · 14 ngày | By room · 14 days | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.col_room` | Căn | Room | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.conflict_body` | Đơn về khi căn {room} đã kín {from} → {to}. Đơn vẫn được nhận và nằm ở làn "Chưa gán căn". Căn trống gợi ý: {rooms}. | It arrived when room {room} was already booked {from} → {to}. The booking is still accepted and sits in the "Unassigned" lane. Suggested free rooms: {rooms}. | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.conflict_title` | Đơn Agoda {code} ({guest}) chưa có căn | Agoda booking {code} ({guest}) has no room | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.dep_unconfirmed` | Căn {room}: khách {guest} trả phòng hôm nay, chưa xác nhận giờ trả (đã nhắc {time}). | Room {room}: guest {guest} checks out today, check-out time not confirmed (reminded at {time}). | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.filter_group` | Nhóm căn | Room group | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hidden_note` | Đơn đã hủy, không đến không hiện trên sơ đồ. Căn ngừng bán hiện nhãn "Ngừng bán" ở đầu dòng. | Cancelled and no-show bookings aren't shown. Rooms off sale show "Off sale" at the start of the row. | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hk.arrival_at` | Có khách đến hôm nay {time} | Guest arriving today {time} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hk.kit` | Chuẩn bị {n} bộ đồ dùng thêm | Prepare {n} extra amenity kit(s) | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hk.ooo` | Đang sửa – không bán | Under repair – not for sale | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hk.vc` | Đã dọn – chờ kiểm | Cleaned – awaiting inspection | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.hk.vd` | Cần dọn (khách đã đi) | Needs cleaning (guest left) | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.legend_kit` | Có khách vượt định mức – chuẩn bị bộ đồ dùng thêm | Guest over standard occupancy – prepare extra amenity kit | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.legend_unassigned` | Chưa gán căn (xung đột OTA) | Unassigned (OTA conflict) | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.manual_badge` | Nhập tay | Manual | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.manual_legend` | = HĐ ngoài hệ thống (R2) | = lease outside the app (R2) | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.next` | Tới 7 ngày | Forward 7 days | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.not_selling` | Không bán | Not for sale | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.arrives_today` | đến hôm nay | arrives today | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.checked_out` | đã trả | checked out | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.departs_today` | đi hôm nay | leaves today | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.hold_left` | còn {h} giờ {m} phút | {h} h {m} min left | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.long_until` | đến {date} | until {date} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.need_room` | cần gán căn | needs a room | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.note.ooo` | Khóa · {reason} | Blocked · {reason} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.offline` | Mất kết nối. Dữ liệu lúc {time} – đang kết nối lại. Chưa tạo hay sửa đơn được để tránh đặt trùng. | You're offline. Data as of {time} – reconnecting. Bookings can't be created or changed to avoid double booking. | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.offline_short` | Mất kết nối – chỉ xem | Offline – view only | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.ooo_until` | Khóa · mở bán lại {date} | Blocked · back on sale {date} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.prev` | Lùi 7 ngày | Back 7 days | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.range_label` | {from} – {to} | {from} – {to} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.reopen` | Mở bán lại {date} | Back on sale {date} | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.unassigned_short` | {n} đơn OTA chưa gán căn | {n} OTA booking(s) without a room | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.view_grid` | Lưới | Grid | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.view_list` | Danh sách | List | ⟨chừa chỗ⟩ | 08-rack.html |
| `rack.yours` | của bạn | yours | ⟨chừa chỗ⟩ | 08-rack.html |

#### R2 hi-fi – Danh mục căn (H04)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `rooms.bed_1br_plus` | 1 giường lớn + 1 giường 1m4 | 1 large bed + 1 140 cm bed | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.bed_2br` | 2 phòng ngủ · 2 giường lớn | 2 bedrooms · 2 large beds | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.bed_studio` | Studio · 1 giường | Studio · 1 bed | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.below_body` | Các đơn sau đã có nhiều khách hơn. Đổi số khách hoặc đổi căn cho các đơn này trước. | These bookings already have more guests. Change their guest count or move them to another room first. | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.below_title` | Chưa giảm tối đa xuống {max} được | Can't lower the maximum to {max} | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.capacity` | Số người | Occupancy | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.capacity_help` | Định mức: số người đã gồm trong giá. Tối đa: định mức + số người ngủ sofa. Không tính trẻ dưới 6 tuổi. | Standard: guests included in the price. Maximum: standard + guests sleeping on the sofa. Children under 6 don't count. | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_action` | Thao tác | Actions | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_base` | Định mức | Standard | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_beds` | Bố trí giường | Beds | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_group` | Nhóm | Group | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_max` | Tối đa | Maximum | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_month` | Giá tháng | Monthly price | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_night` | Giá đêm niêm yết | Nightly list price | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_room` | Căn | Room | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.col_sale` | Bán | On sale | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.dec` | Giảm | Decrease | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.edit` | Sửa | Edit | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.edit_title` | Sửa căn {room} · {name} | Edit room {room} · {name} | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.error_title` | Chưa tải được danh mục căn | Couldn't load rooms | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.footnote` | Giá đêm niêm yết = giá tháng ÷ 12, làm tròn 1.000 (BR-101) – do hệ thống tính. Đổi giá có ngày hiệu lực; đơn, báo giá đã có giữ giá cũ (BR-006). | Nightly list price = monthly price ÷ 12, rounded to 1,000 (BR-101) – calculated by the system. Price changes have an effective date; existing bookings and quotes keep the old price (BR-006). | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.inc` | Tăng | Increase | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.name` | Tên căn | Room name | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.night_auto` | Tự tính: giá tháng ÷ 12 (BR-101) | Auto: monthly price ÷ 12 (BR-101) | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.ooo_until` | Khóa sửa chữa đến {date} | Blocked for repair until {date} | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.price` | Giá niêm yết | List price | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.reason` | Lý do đổi giá | Reason for price change | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.rule_note` | Khách vượt định mức ngủ sofa, trả phụ thu người thêm (BR-110) và được chuẩn bị thêm 1 bộ đồ dùng: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối). | Guests over the standard occupancy sleep on the sofa, pay the extra-guest charge (BR-110) and get an extra amenity kit: 1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries (no pillow). | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.selling` | Đang bán | On sale | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.snapshot_note` | Đơn, báo giá, hợp đồng tạo trước ngày hiệu lực giữ giá cũ. | Bookings, quotes and leases created before the effective date keep the old price. | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.stop_help` | Tắt = ngừng bán: căn không có trong form đặt phòng, rack ghi "Ngừng bán". Đơn đã có giữ nguyên. | Off = stop selling: the room disappears from the booking form and the rack shows "Off sale". Existing bookings stay. | ⟨chừa chỗ⟩ | 04-rooms.html |
| `rooms.subtitle` | {rooms} căn · {groups} nhóm | {rooms} rooms · {groups} groups | ⟨chừa chỗ⟩ | 04-rooms.html |

#### R2 hi-fi – Chi tiết đơn (H11)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `rsv.add_person` | Thêm người đi cùng | Add a companion | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.add_submit` | Thêm vào đơn | Add to booking | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.amount_received` | Số tiền đã nhận | Amount received | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.amount_sent` | Số tiền khách chuyển | Amount the guest transferred | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.assign_effect` | Sau khi gán: đơn rời làn "Chưa gán căn", cảnh báo đỏ tắt, nhận phòng được như đơn thường. | After assigning: the booking leaves the "Unassigned" lane, the red alert clears, and check-in works as normal. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.assign_lead` | Agoda gửi đơn nhóm {group}, {from} → {to} khi căn {room} đã kín. Chọn căn trống – gợi ý xếp theo ít tạo đêm lẻ nhất. | Agoda sent a {group} booking for {from} → {to} when room {room} was already booked. Pick a free room – suggestions are sorted by fewest orphan nights. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.assign_submit` | Gán vào căn {room} | Assign to room {room} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.assign_title` | Gán căn cho {code} · {guest} | Assign a room to {code} · {guest} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.attach_receipt` | Đính kèm ảnh biên nhận | Attach receipt photo | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.best_fit` | Phù hợp nhất | Best fit | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.booker` | Người đứng tên | Booker | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.cancel_rule` | Hủy trước {days} ngày: hoàn {pct}% cọc (BR-309). | Cancelled {days} days ahead: {pct}% of the deposit is refunded (BR-309). | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.child` | Trẻ em | Child | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.child_note` | Trẻ em: chỉ cần năm sinh – không tạo hồ sơ khách, không lưu liên hệ. | Children: only the year of birth – no guest profile, no contact details stored. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.choose_reason` | Chọn lý do | Choose a reason | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.commission_mine` | Hoa hồng dự kiến của bạn | Your expected commission | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.conflict_chip` | Xung đột OTA | OTA conflict | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.contact_late` | Khách báo đến trễ | Guest says they'll be late | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.contact_noanswer` | Gọi không nghe máy | Called, no answer | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.contact_none` | Chưa liên lạc | Not contacted yet | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.copy_qr` | Sao chép thông tin chuyển khoản | Copy transfer details | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.current_expiry` | Hạn hiện tại | Current expiry | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.dates` | Ngày | Dates | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.deposit_partial` | Vẫn ghi được khoản đã nhận – đơn giữ "Giữ chỗ · chờ cọc" và hiện số còn thiếu. | You can still record the amount received – the booking stays "On hold · awaiting deposit" and shows what's missing. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.deposit_submit` | Xác nhận đã nhận cọc | Confirm deposit received | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.deposit_title` | Xác nhận cọc · {code} | Confirm deposit · {code} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.eta` | dự kiến đến {time} | expected {time} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.extend_rule` | Tối đa +{hours} giờ và không quá {time} ngày đến. Chỉ gia hạn được một lần. | Up to +{hours} hours and no later than {time} on the arrival day. Can be extended only once. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.extend_submit` | Gia hạn đến {time} | Extend to {time} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.extend_title` | Gia hạn giữ chỗ (1 lần) | Extend hold (once) | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.fit_after_hold` | Nối tiếp giữ chỗ {prev} (chưa cọc) | Follows {prev}'s hold (no deposit yet) | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.fit_contiguous` | Nối tiếp đơn {prev} – không tạo đêm lẻ | Follows {prev}'s booking – no orphan nights | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.fit_gap` | Để lại {n} đêm trống trước đơn | Leaves {n} empty night(s) before the stay | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.guests_line` | {adults} người lớn · định mức {base}, tối đa {max} | {adults} adults · standard {base}, max {max} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.hold_auto` | Quá hạn chưa cọc → hệ thống tự hủy và mở bán lại căn. | If no deposit by then, the system cancels the hold and puts the room back on sale. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.hold_expires` | Hết hạn giữ chỗ sau {h} giờ {m} phút ({at}) | Hold expires in {h} h {m} min ({at}) | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.kit_task` | Việc buồng phòng: 1 bộ (1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – không gối) trước {time} · Đã giao | Housekeeping task: 1 kit (1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries – no pillow) before {time} · Assigned | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.move_price_note` | Giá các đêm giữ như lúc đặt. | Night rates stay as booked. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.move_submit` | Lưu thay đổi | Save change | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.need_online` | Cần có mạng để thao tác | Connection needed for this action | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.new_expiry` | Hạn mới | New expiry | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.party` | Người ở | Guests staying | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.party_missing` | Thiếu {n} người – cần đủ người để khai báo lưu trú. | {n} guest(s) missing – everyone is needed for the residence registration. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.person_kind` | Loại | Type | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.reason_ota_conflict` | Đơn OTA về khi căn đã kín | OTA booking arrived when the room was full | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.reconcile_note` | Chuyển khoản ghi tay được đánh dấu "chờ đối soát" cho tới khi kế toán khớp sao kê. | Manually recorded transfers are flagged "awaiting reconciliation" until accounting matches the bank statement. | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.record_partial` | Ghi nhận {amount} | Record {amount} | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.step_booked` | Đặt | Booked | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.step_deposit` | Đã cọc | Deposit paid | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.step_hold` | Giữ chỗ | On hold | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.step_in` | Nhận phòng | Check-in | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.step_out` | Trả phòng | Check-out | ⟨chừa chỗ⟩ | 11-reservation.html |
| `rsv.upgrade_note` | Căn nhóm khác chỉ là gợi ý – lễ tân trưởng hoặc quản lý xác nhận. | Rooms in another group are suggestions only – the front-desk lead or manager confirms. | ⟨chừa chỗ⟩ | 11-reservation.html |

#### R2 hi-fi – Sale/CTV báo giá (H12)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `sale.arrival` | Ngày đến | Arrival | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.ask_extend` | Gửi quản lý gia hạn | Ask the manager to extend | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.avail_count` | {n} căn trống {from} → {to} | {n} rooms free {from} → {to} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.commission` | Sale nhận ({pct}% tiền phòng – BR-903) | Sales earns ({pct}% of room charges – BR-903) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.commission_ctv` | Bạn nhận ({pct}% tiền phòng – BR-903) | You earn ({pct}% of room charges – BR-903) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.conflict` | Trùng lịch | Dates taken | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.copy_zalo` | Sao chép gửi Zalo | Copy to send on Zalo | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.create_hold` | Tạo giữ chỗ | Create hold | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.deposit_due` | Cọc để giữ phòng ({pct}% tiền phòng – BR-305) | Deposit to hold the room ({pct}% of room charges – BR-305) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.deposit_due_short` | Cọc cần thu | Deposit due | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.error_title` | Chưa tải được căn trống | Couldn't load availability | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.free` | Trống | Free | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_created` | Đã giữ căn {room} – đơn {code} | Room {room} is on hold – booking {code} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_for` | Giữ trong | Hold for | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_locked_past` | Tạo giữ chỗ (ngày đã qua) | Create hold (date has passed) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_next` | Gửi mã QR cho khách. Bạn sẽ được nhắc {hours} giờ trước khi hết hạn. | Send the QR code to the guest. You'll get a reminder {hours} hours before it expires. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_title` | Giữ chỗ | Hold | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.hold_until` | Hết hạn {time} – chưa cọc thì tự hủy, mở bán lại. | Expires {time} – without a deposit it's cancelled and the room goes back on sale. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.los_applied` | Đã giảm {pct}% vì ở từ 7 đêm (BR-107) | {pct}% off applied for 7+ nights (BR-107) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.month_note` | Thuê tháng làm hợp đồng – hiện vẫn làm ngoài app; nhắn lễ tân giữ phòng bằng đơn dài hạn nhập tay. | Monthly stays need a lease – still done outside the app; ask the front desk to hold the room with a manual long-stay booking. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.month_option` | So sánh: thuê 1 tháng | Compare: 1-month rental | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.month_total` | Thuê 1 tháng (tiền thuê + phí dịch vụ) | 1-month rental (rent + service fee) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.nights` | Số đêm | Nights | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.nights_weekday` | {n} đêm thường × {rate} | {n} weekday nights × {rate} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.nights_weekend` | {n} đêm thứ Sáu, thứ Bảy × {rate} | {n} Friday/Saturday nights × {rate} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.none_body` | Thử dời 1 ngày: {dates} còn 2 căn. | Try shifting by 1 day: {dates} has 2 rooms. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.none_title` | Hết phòng trong khoảng ngày | No rooms for these dates | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.offline` | Mất kết nối – kết quả có thể đã cũ. Chưa báo giá được. | You're offline – results may be out of date. Quotes can't be made yet. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.ottimo_left` | OTTIMO còn lại | OTTIMO keeps | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.price_source` | Giá trực tiếp theo lịch giá hôm nay (BR-104). Báo giá giữ giá {days} ngày. | Direct rate from today's rate calendar (BR-104). The quote holds the price for {days} days. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.qr_after` | Mã QR có nội dung là mã đơn, tạo ngay sau khi giữ chỗ. | The QR code uses the booking ID as the transfer note and is created right after the hold. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.quote_active` | Còn hiệu lực | Valid | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.quote_expires` | Hết hiệu lực {time} | Expires {time} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.quote_title` | Báo giá | Quote | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.requote` | Lập báo giá mới | Make a new quote | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.return_code` | Mã khách quay lại (nếu có) | Returning-guest code (if any) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.room_meta` | Định mức {base} · tối đa {max} (khách thứ {max} ngủ sofa) | Standard {base} · max {max} (guest {max} sleeps on the sofa) | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.save_quote` | Lưu báo giá | Save quote | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.short_total` | Ngắn ngày {n} đêm | Short stay, {n} nights | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.taken_partly` | Kín {dates} | Booked {dates} | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.text_lang` | Ngôn ngữ gửi khách | Language for the guest | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.to_hold` | Khách đồng ý – Giữ chỗ | Guest agrees – Hold the room | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.today_handoff` | Sale/CTV: nhắn lễ tân tạo đơn đã thu cho khách này. | Sales/agents: ask the front desk to create a paid booking for this guest. | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.try_dates` | Xem ngày gợi ý | See suggested dates | ⟨chừa chỗ⟩ | 12-sales-quote.html |
| `sale.quote_text` | OTTIMO Boutique Stay – Báo giá {code}
Căn {room} {room_name}, {from} → {to} ({nights} đêm), {guests}.
Tiền phòng: {room_total}{discount_note}.
Cọc giữ phòng: {deposit}. Phần còn lại thanh toán khi nhận phòng.
Báo giá có hiệu lực đến {expires}. | OTTIMO Boutique Stay – Quote {code}
Room {room} {room_name}, {from} → {to} ({nights} nights), {guests}.
Room total: {room_total}{discount_note}.
Deposit to hold the room: {deposit}. The rest is paid at check-in.
This quote is valid until {expires}. | ⟨chừa chỗ⟩ | US-083 AC2 – getQuoteText; RU ở R3 (US-115) |
| `sale.quote_text_extra_guest` | Gồm phụ thu {n} người ngủ sofa: {amount}. | Includes extra-guest charge for {n} guest(s) on the sofa: {amount}. | ⟨chừa chỗ⟩ | Dòng thêm khi vượt định mức (BR-110) |

#### R2 hi-fi – Khung ứng dụng (H02)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `shell.change_password` | Đổi mật khẩu | Change password | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.go_home` | Về trang chủ của tôi | Go to my home page | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.language` | Ngôn ngữ giao diện | Interface language | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.logout` | Đăng xuất | Sign out | ⟨chừa chỗ⟩ | 01-login.html |
| `shell.no_access_body` | Trang này dành cho vai khác. Nếu bạn cần dùng, nhờ chủ đầu tư thêm vai cho tài khoản. | This page is for another role. If you need it, ask the owner to add the role to your account. | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.no_access_title` | Bạn không có quyền mở trang này | You don't have access to this page | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.notifications` | Thông báo | Notifications | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.offline_desk` | Mất kết nối. Dữ liệu lúc {time} – chỉ xem, chưa tạo hay sửa đơn được. | You're offline. Data as of {time} – view only; bookings can't be created or changed. | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.offline_readonly` | Mất kết nối. Dữ liệu lúc {time} – chỉ xem, chưa lưu thay đổi được. | You're offline. Data as of {time} – view only; changes can't be saved yet. | ⟨chừa chỗ⟩ | 04-rooms.html |
| `shell.search_label` | Tìm kiếm | Search | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.security` | Xác thực 2 bước | 2-step verification | ⟨chừa chỗ⟩ | 02-role-nav.html |
| `shell.subtitle` | {property} · {date} | {property} · {date} | ⟨chừa chỗ⟩ | 02-role-nav.html |

#### R2 hi-fi – Hôm nay (H03)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `today.attention` | Cần chú ý | Needs attention | ⟨chừa chỗ⟩ | 03-today.html |
| `today.confirm_time` | Xác nhận giờ trả | Confirm check-out time | ⟨chừa chỗ⟩ | 03-today.html |
| `today.dep_unconfirmed` | chưa xác nhận giờ trả · đã nhắc {time} | check-out time not confirmed · reminded at {time} | ⟨chừa chỗ⟩ | 03-today.html |
| `today.empty_body` | Không có khách đến/đi, khai báo hay giữ chỗ cần xử lý. Mở sơ đồ phòng để nhận đặt phòng mới. | No arrivals, departures, registrations or holds to handle. Open the room rack to take new bookings. | ⟨chừa chỗ⟩ | 03-today.html |
| `today.empty_title` | Hôm nay không có việc theo giờ | Nothing scheduled for today | ⟨chừa chỗ⟩ | 03-today.html |
| `today.error_title` | Chưa tải được việc hôm nay | Couldn't load today's tasks | ⟨chừa chỗ⟩ | 03-today.html |
| `today.hold_left` | còn {h} giờ {m} phút (hết hạn {at}) | {h} h {m} min left (expires {at}) | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kit_body` | {n} khách vượt định mức ngủ sofa: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải và đồ vệ sinh cá nhân (không gối). Đã giao việc cho buồng phòng. | {n} guest(s) over standard sleeping on the sofa: 1 blanket, 1 bath towel, 1 face towel, toothbrush and toiletries (no pillow). Task sent to housekeeping. | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kit_title` | Chuẩn bị bộ đồ dùng thêm – căn {room}, trước {time} | Prepare extra amenity kit – room {room}, before {time} | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kpi_arrivals` | Khách đến hôm nay | Arrivals today | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kpi_departures` | Khách đi hôm nay | Departures today | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kpi_in_house` | Đang ở | In house | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kpi_occupancy` | Công suất đêm nay | Occupancy tonight | ⟨chừa chỗ⟩ | 03-today.html |
| `today.kpi_occupancy_note` | {sold}/{sellable} căn bán được ({blocked} đang khóa) | {sold}/{sellable} sellable rooms ({blocked} blocked) | ⟨chừa chỗ⟩ | 03-today.html |
| `today.log_contact` | Ghi kết quả liên lạc | Log contact result | ⟨chừa chỗ⟩ | 03-today.html |
| `today.money_after_cancel` | Tiền về cho đơn đã hủy {code} | Money received for cancelled booking {code} | ⟨chừa chỗ⟩ | 03-today.html |
| `today.money_after_cancel_body` | Giữ chỗ đã tự hủy trước khi tiền về. Liên hệ khách: đặt lại nếu còn phòng, hoặc hoàn tiền (cần quản lý duyệt). | The hold was cancelled automatically before the money arrived. Contact the guest: rebook if a room is free, or refund (manager approval needed). | ⟨chừa chỗ⟩ | 03-today.html |
| `today.no_docs` | Chưa có giấy tờ | No IDs yet | ⟨chừa chỗ⟩ | 03-today.html |
| `today.no_email` | Đơn chưa có email | No email on booking | ⟨chừa chỗ⟩ | 03-today.html |
| `today.noshow_when` | Hiện từ mốc gọi khách {time} (BR-311) | Shown from the call-the-guest time {time} (BR-311) | ⟨chừa chỗ⟩ | 03-today.html |
| `today.open` | Mở | Open | ⟨chừa chỗ⟩ | 03-today.html |
| `today.open_booking` | Mở đơn | Open booking | ⟨chừa chỗ⟩ | 03-today.html |
| `today.prechecked` | Đã làm thủ tục trước | Checked in online | ⟨chừa chỗ⟩ | 03-today.html |
| `today.reg_due` | hạn khai báo {time} hôm nay | registration due {time} today | ⟨chừa chỗ⟩ | 03-today.html |
| `today.reg_due_foreign` | hạn = giờ nhận phòng + {hours} giờ | due = check-in time + {hours} hours | ⟨chừa chỗ⟩ | 03-today.html |
| `today.req_ack` | Đã nhận | Acknowledged | ⟨chừa chỗ⟩ | 03-today.html |
| `today.send_link` | Gửi link thủ tục | Send check-in link | ⟨chừa chỗ⟩ | 03-today.html |
| `today.unassigned_hint` | gợi ý căn trống: {rooms} | suggested free rooms: {rooms} | ⟨chừa chỗ⟩ | 03-today.html |
| `today.unassigned_title` | Đơn OTA chưa gán căn ({n}) | OTA bookings without a room ({n}) | ⟨chừa chỗ⟩ | 03-today.html |
| `today.update` | Cập nhật | Update | ⟨chừa chỗ⟩ | 03-today.html |

#### R2 hi-fi – Người dùng & vai (H07)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `users.active` | Đang dùng | Active | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.col_last` | Đăng nhập gần nhất | Last sign-in | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.col_name` | Người dùng | User | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.col_roles` | Vai | Roles | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.col_status` | Trạng thái | Status | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.create` | Tạo tài khoản | Create account | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.edit_roles` | Sửa vai | Edit roles | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.error_title` | Chưa tải được danh sách người dùng | Couldn't load users | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.f_display` | Tên hiển thị | Display name | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.locked` | Đã khóa | Locked | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.more` | Khác… | More… | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.more_help` | "Khác…": Đặt lại mật khẩu (tạo mật khẩu tạm), Khóa tài khoản, Đặt lại xác thực 2 bước. | "More…": Reset password (creates a temporary password), Lock account, Reset 2-step verification. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.new_cta` | Thêm người dùng | Add user | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.no_2fa` | Chưa bật 2FA | 2FA not on | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.collaborator` | Chỉ thấy báo giá, đơn, khách của chính mình; không xác nhận cọc. | Sees only their own quotes, bookings and guests; can't confirm deposits. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.front_desk` | Đặt phòng, nhận/trả phòng, thu tiền, khai báo trên máy được cấp. | Bookings, check-in/out, payments, registration on approved devices. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.front_desk_lead` | Như lễ tân + duyệt miễn phí trong hạn mức, kiểm phòng đạt. | Front desk + approves comps within limits, passes room inspections. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.housekeeping` | Việc dọn phòng, kiểm phòng, báo sự cố trên điện thoại. | Cleaning tasks, room inspection, issue reports on the phone. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.maintenance` | Phiếu sửa, khóa phòng khi sửa chữa. | Work orders, blocking rooms for repair. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.manager` | Duyệt hoàn tiền, công nợ, khôi phục không đến; xem báo cáo tài chính. | Approves refunds, credit, no-show restores; sees financial reports. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.role_desc.sales_staff` | Báo giá, giữ chỗ, xác nhận cọc đơn của mình. | Quotes, holds, confirming deposits on own bookings. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.roles_effect` | Thay đổi có hiệu lực khi người này đăng nhập lại. Phiên đang mở của họ sẽ bị đăng xuất. | Changes apply when this person signs in again. Their open sessions will be signed out. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.roles_legend` | Chọn một hoặc nhiều vai | Choose one or more roles | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.roles_title` | Vai của {name} | Roles for {name} | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.save_roles` | Lưu vai | Save roles | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.temp_password` | Chờ đổi mật khẩu tạm | Waiting to change temporary password | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.temp_pw_note` | Hệ thống tạo mật khẩu tạm, hiện một lần để bạn đưa trực tiếp cho người dùng. Họ phải đổi ở lần đăng nhập đầu. | The system creates a temporary password, shown once so you can hand it to the user in person. They must change it at first sign-in. | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.unlock` | Mở khóa | Unlock | ⟨chừa chỗ⟩ | 07-users-devices.html |
| `users.you` | Bạn | You | ⟨chừa chỗ⟩ | 07-users-devices.html |

#### R2 hi-fi Sprint 3 – nhận/trả phòng, khai báo, lưu trú, duyệt, nhật ký tiền, guest-web (H13–H18)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `approval.already_done` | Yêu cầu đã được {who} xử lý lúc {time}. Danh sách đã cập nhật. | This request was already handled by {who} at {time}. The list has been updated. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.approve_body` | Folio ghi dòng miễn phí âm cùng giá trị kèm tên bạn. Tính vào hạn mức tháng của bạn. | The folio gets a matching negative waiver line with your name. It counts toward your monthly limit. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.approve_title` | Duyệt miễn {amount} cho {code}? | Approve waiving {amount} for {code}? | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.empty_body` | Yêu cầu mới sẽ hiện ở đây và trong thông báo. | New requests appear here and in notifications. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.empty_title` | Không có yêu cầu chờ duyệt | No requests waiting for approval | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.error_title` | Chưa tải được danh sách cần duyệt | Couldn't load approval requests | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.limit_left` | Hạn mức tháng còn {left} / {limit} · mỗi lần tối đa 300.000 | Monthly limit left {left} / {limit} · up to 300,000 per request | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.offline` | Mất kết nối lúc {time}. Danh sách có thể đã cũ – duyệt cần có mạng. | Offline since {time}. The list may be out of date – approving needs a connection. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.over_your_limit` | Vượt mức {limit}/lần của bạn – quản lý duyệt. | Above your {limit} per-request limit – a manager approves. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.reject_effect` | Dòng miễn bị bỏ, khoản phát sinh giữ nguyên trên folio. | The waiver line is dropped; the charge stays on the folio. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.reject_title` | Từ chối yêu cầu miễn phí của {code}? | Reject the waiver request for {code}? | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `approval.sent_by` | {who} gửi lúc {time} | Sent by {who} at {time} | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `checkin.cond.document_ok` | Giấy tờ khách nước ngoài hợp lệ tại ngày nhận | Foreign guest documents valid on arrival date | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.kit_not_ready` | Bộ đồ dùng thêm cho căn {room} chưa chuẩn bị. Vẫn nhận phòng được – việc đã được đẩy lên đầu hàng đợi buồng phòng. | The extra amenity kit for room {room} isn't ready yet. You can still check in – the task has been moved to the top of the housekeeping queue. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.prior_night` | Khách nhận trước 06:00 – thêm đêm {date}: {amount}. Đây là tiền phòng, không phải phụ thu. | Guest arriving before 06:00 – add the night of {date}: {amount}. This is room revenue, not a surcharge. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.prior_night_submit` | Thêm đêm và nhận phòng | Add night and check in | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.prior_night_unavailable` | Căn {room} có khách đêm {date}. Gợi ý khách gửi hành lý hoặc đổi sang căn trống. | Room {room} is occupied on the night of {date}. Offer luggage storage or move to an available room. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.verify.entry_record` | Có dấu / chứng nhận nhập cảnh | Entry stamp / entry record present | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.verify.passport_at_arrival` | Hộ chiếu còn hạn tại ngày nhận phòng | Passport valid on arrival date | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.verify.result.fail` | Không đạt | Failed | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.verify.result.pass` | Đạt | Passed | ⟨chừa chỗ⟩ | 13-check-in.html |
| `checkin.verify.result.unknown` | Chưa kiểm được | Not checked yet | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.ask_foc` | Xin miễn phụ thu (gửi duyệt) | Request a waiver (needs approval) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.ask_foc_help` | Chọn lý do. Yêu cầu tự đến người có quyền duyệt – không chọn tên người duyệt. Folio ghi dòng phụ thu và dòng miễn "chờ duyệt". | Pick a reason. The request goes automatically to people allowed to approve – you don't choose an approver. The folio shows the surcharge and a "pending" waiver line. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.back_to_booking` | Về chi tiết đơn | Back to booking | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_body` | {doc} đã hết hạn {date}, trước ngày nhận phòng {arrival}. Chưa nhận phòng (và chưa giao mã/thẻ) cho tới khi lễ tân trưởng trở lên xác nhận nhận tiếp. | {doc} expired on {date}, before the arrival date {arrival}. No check-in (and no code or key card) until a senior receptionist or above approves. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_entry` | Chưa có dấu nhập cảnh / chứng nhận nhập cảnh. Chưa nhận phòng cho tới khi lễ tân trưởng trở lên xác nhận nhận tiếp. | No entry stamp / entry record. No check-in until a senior receptionist or above approves. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_fd` | Bạn (lễ tân): gửi lễ tân trưởng xác nhận. Quản lý nhận thông báo. | You (receptionist): send to a senior receptionist to confirm. The manager is notified. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_lead_body` | Chỉ lễ tân trưởng, quản lý hoặc chủ đầu tư. Ghi lý do và cách xử lý; quản lý nhận thông báo. Sau khi xác nhận, nút Nhận phòng mở lại. | Senior receptionist, manager or owner only. Enter the reason and how it was handled; the manager is notified. After confirming, the Check in button unlocks. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_lead_submit` | Xác nhận nhận tiếp | Confirm check-in anyway | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_lead_title` | Lễ tân trưởng xác nhận nhận tiếp | Senior receptionist confirms check-in | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_send` | Gửi lễ tân trưởng xác nhận | Send to senior receptionist | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.block_title` | Không đạt – chưa nhận phòng được | Failed – can't check in yet | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.capture_manual` | Nhập tay | Enter manually | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.capture_mrz` | Đọc MRZ hộ chiếu | Read passport MRZ | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.capture_qr` | Quét QR CCCD | Scan ID card QR | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.child_doc` | Trẻ em · số định danh cá nhân, số cuối {last4} · không cần ảnh | Child · personal ID number ending {last4} · no photo needed | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.cond_balance` | Còn phải thu {amount} đ – thu ở bước 4, trước khi giao mã cửa. | {amount} VND still due – collect in step 4, before handing over the door code. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.cond_doc` | Bắt đầu với người đứng tên ở bước 1. Người đi cùng bổ sung được trước hạn khai báo. | Start with the main guest in step 1. Other guests can be added before the registration deadline. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.cond_na_citizen` | Không áp dụng – cả đơn là công dân Việt Nam. | Not applicable – everyone on the booking is a Vietnamese citizen. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.cond_room` | Căn {room} · {status} | Room {room} · {status} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.confirm_title` | Nhận phòng căn {room} cho {guest}? | Check {guest} in to room {room}? | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.deadline_citizen` | Nhận {in} → hạn {deadline} | Checked in {in} → due {deadline} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.deadline_citizen_late` | Khách đến từ 23:00 → hạn 08:00 sáng hôm sau. | Guests arriving from 23:00 → due 08:00 the next morning. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.deadline_foreign` | Nhận {in} → hạn {deadline} (giờ nhận + 12 giờ) | Checked in {in} → due {deadline} (check-in time + 12 hours) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc.cccd` | CCCD | Citizen ID (CCCD) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc.child` | Số định danh trẻ em | Child personal ID number | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc.passport` | Hộ chiếu | Passport | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc_blocked_body` | Giấy tờ nước ngoài đã hết hạn tại ngày nhận phòng hoặc thiếu dấu nhập cảnh. Lễ tân trưởng trở lên xác nhận nhận tiếp (ghi lý do và cách xử lý); quản lý nhận thông báo. | A foreign guest's document had expired on the arrival date, or there's no entry stamp. A senior receptionist or above confirms check-in (with reason and handling); the manager is notified. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc_blocked_title` | Chưa nhận phòng được | Can't check in yet | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc_masked` | {type} · số cuối {last4} | {type} · ending {last4} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.doc_missing` | Chưa có giấy tờ | No ID yet | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.docs_have` | Giấy tờ | IDs | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_done` | Đã tạo mã trên app khóa và giao cho khách | Code created in the lock app and given to the guest | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_lock` | Khóa | Lock | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_not_stored` | OTTIMO không lưu mã cửa ở R2. Khi trả phòng hoặc đổi phòng, hệ thống tạo việc "Xóa mã trên app khóa". | OTTIMO doesn't store door codes in R2. On check-out or room change, the system creates a "Delete code in lock app" task. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_step1` | Mở app TTLock, tạo mã 6 số ngẫu nhiên cho căn {room} với đúng hiệu lực trên. | Open the TTLock app and create a random 6-digit code for room {room} with exactly the validity above. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_step2` | Đọc mã cho khách hoặc đưa thẻ (tối đa 2 thẻ). Không gửi mã qua tin nhắn kèm số căn, địa chỉ. | Read the code to the guest or hand over key cards (max 2). Don't message the code together with the room number or address. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_step3` | Khách muốn mã theo ngày sinh: ddmm + 3 số ngẫu nhiên (7 số), không dùng đúng ngày sinh. | Guest wants a birthday code: ddmm + 3 random digits (7 digits), never the plain birthday. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_title` | Mã cửa – nhập tay trên app khóa (R2) | Door code – entered manually in the lock app (R2) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_valid` | Hiệu lực | Valid | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.door_valid_value` | {from} → {to} | {from} → {to} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.early_time` | Giờ khách nhận phòng | Guest's check-in time | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.early_toggle` | Khách nhận sớm | Guest checks in early | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.effect_deadline` | Hạn khai báo bắt đầu tính: {deadline}. | Registration deadline starts: {deadline}. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.effect_fee` | Phụ thu nhận sớm {amount} đ ghi vào folio (đã báo khách). | Early check-in surcharge {amount} VND goes on the folio (guest informed). | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.effect_status` | Đơn chuyển "Đang ở", buồng {room} chuyển "Có khách, sạch". | Booking becomes "In house", room {room} becomes "Occupied, clean". | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.effects_title` | Khi bấm Nhận phòng | When you tap Check in | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.empty_body` | Các đơn đến hôm nay đã nhận phòng hoặc đã xử lý không đến. Khách vãng lai: tạo đơn mới rồi nhận phòng. | Today's arrivals are checked in or handled as no-shows. Walk-in guest: create a booking, then check in. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.empty_title` | Không còn khách đến hôm nay | No more arrivals today | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.entry_on` | Nhập cảnh {date}. | Entered Vietnam {date}. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.error_title` | Chưa mở được nhận phòng | Couldn't open check-in | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.extra_night_help` | Kiểm căn còn trống đêm hôm trước. Đơn OTA: tạo đơn con kênh Trực tiếp cho đêm đó; căn có khách đêm đó → gợi ý gửi hành lý hoặc căn khác. | Check the room is free the night before. OTA booking: create a linked Direct booking for that night; if the room is taken, offer luggage storage or another room. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.go_docs` | Tiếp tục: Giấy tờ | Continue: IDs | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.go_register` | Tiếp tục: Khai báo | Continue: Registration | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.go_verify` | Tiếp tục: Kiểm tra | Continue: Checks | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.manual_note` | Hộ chiếu: thêm hạn hộ chiếu, thị thực, ngày nhập cảnh để hệ thống tự kiểm. Bỏ trống thì kết quả là "Chưa kiểm được". | Passport: add passport expiry, visa and entry date so the system can check them. If left empty the result is "Not checked yet". | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.manual_save` | Lưu giấy tờ | Save ID | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.manual_title` | Nhập tay giấy tờ | Enter ID manually | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.met` | Đã đủ | Done | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.name_match_note` | Đơn "{booking}" · giấy tờ "{doc}" – khớp (bỏ dấu, đảo thứ tự). | Booking "{booking}" · document "{doc}" – match (accents ignored, order swapped). | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.no_block_note` | Hết hạn trong thời gian ở: không chặn nhận phòng, vẫn giao mã cửa. | Expires during the stay: check-in isn't blocked; the door code is still handed over. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.offline` | Mất kết nối lúc {time}. Nhận phòng, giấy tờ và thu tiền cần có mạng – không lưu tạm trên máy. Khách chờ: dùng bảng dự phòng, nhập bù khi có mạng. | Offline since {time}. Check-in, IDs and payments need a connection – nothing is stored on this device. If the guest is waiting, use the backup sheet and enter it later. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.offline_short` | Chờ có mạng để tiếp tục. | Waiting for a connection to continue. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.ooo_never` | Căn đang khóa sửa chữa (OOO) thì không bao giờ nhận phòng được. | A room that is out of order (OOO) can never be checked in to. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.party_later` | Còn {n} người chưa có giấy tờ. Nhận phòng được khi đã có giấy tờ người đứng tên; bổ sung người còn lại trước hạn khai báo {deadline}. | {n} guests still have no ID. You can check in once the main guest's ID is in; add the others before the registration deadline {deadline}. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.passport_masked` | Hộ chiếu · số cuối {last4} | Passport · ending {last4} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.pay_open` | Thu tiền (VietQR / tiền mặt) | Take payment (VietQR / cash) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.pay_ota_prepaid` | Booking.com đã thu tiền phòng – chỉ còn phụ thu nhận sớm. Đơn Trực tiếp/CTV (ví dụ 302: 3.344.000 đ) phải thu đủ ở đây. | Booking.com has collected the room charge – only the early check-in surcharge is due. Direct/agent bookings (e.g. 302: 3,344,000 VND) must be paid in full here. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.pay_title` | Thu tiền trước khi giao mã | Collect payment before handing over the code | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.photo_count` | {n} ảnh | {n} photos | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.reason` | Lý do | Reason | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.recon_ok` | Chuyển khoản ghi tay mang cờ "Chờ đối soát" nhưng vẫn tính là đã thu – nhận phòng được. | Manually recorded transfers are flagged "Awaiting reconciliation" but count as paid – check-in can go ahead. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.reg_kind` | Khai báo | Registration | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.reg_now` | Khai báo ngay | Register now | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.send_lead` | Gửi lễ tân trưởng xác nhận | Send to senior receptionist | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.stepup_body` | Xem đủ số và ảnh giấy tờ được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn – có hiệu lực 15 phút trên máy này. | Viewing full ID numbers and photos is recorded in the access log. Re-enter your password – valid for 15 minutes on this device. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.stepup_label` | Mật khẩu của bạn | Your password | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.stepup_submit` | Xác nhận | Confirm | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.stepup_title` | Xác nhận lại để xem giấy tờ | Confirm again to view IDs | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.submit` | Nhận phòng căn {room} | Check in room {room} | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.time_default` | Phụ thu tính theo giờ chuẩn {std} – hiện là 0 đ. | Surcharge is based on the standard time {std} – currently 0 VND. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.time_default_help` | Giờ nhận thực tế ghi theo lúc bấm "Nhận phòng". Chỉ khi khách nhận sớm, bật "Khách nhận sớm" ở bước 4. | The actual check-in time is recorded when you tap "Check in". Only if the guest arrives early, turn on "Guest checks in early" in step 4. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.time_title` | Giờ nhận & phụ thu | Check-in time & surcharge | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.told_guest` | Tôi đã báo khách khoản phụ thu này | I've told the guest about this surcharge | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.undo_body` | Đơn trở về "Đã xác nhận", buồng về trạng thái trước khi nhận. Hệ thống tạo việc "Xóa mã trên app khóa". Chỉ làm được trong ngày và khi folio chưa có dòng mới. | The booking returns to "Confirmed" and the room to its previous status. A "Delete code in lock app" task is created. Only possible on the same day and if no new folio lines exist. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.undo_title` | Hoàn tác nhận phòng căn {room} – {guest}? | Undo check-in for room {room} – {guest}? | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.unmet` | Còn thiếu | Missing | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.untrusted_note` | Bước giấy tờ, kiểm tra và khai báo bị ẩn. Vẫn xem được điều kiện và folio; nhận phòng cần làm trên máy quầy đã cấp. | The IDs, checks and registration steps are hidden. Conditions and folio stay visible; check-in must be done on an approved desk computer. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.valid_until` | Còn hạn đến {date}. | Valid until {date}. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.view_full` | Xem đủ số / ảnh | View full number / photo | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.visa_attention` | Đơn vào "Cần chú ý"; ngày đi khai báo đề xuất = ngày hết hạn thị thực. | The booking goes to "Needs attention"; the proposed registered departure date = visa expiry date. | ⟨chừa chỗ⟩ | 13-check-in.html |
| `ci.waiting_lead` | Đang chờ lễ tân trưởng xác nhận | Waiting for senior receptionist | ⟨chừa chỗ⟩ | 13-check-in.html |
| `co.amount` | Tiền | Amount | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.bill_vi` | Tiếng Việt | Vietnamese | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.bill_vien` | Việt – Anh | Vietnamese – English | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.cash_received` | Tiền khách đưa | Cash received | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.change_due` | Thối lại {amount} đ | Change due {amount} VND | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.company_name` | Tên công ty | Company name | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.complete_paid` | Đã thu {amount} – hoàn tất | Paid {amount} – complete | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.debt_mgr` | Quản lý/chủ đầu tư thấy thêm "Ghi công nợ" – bắt buộc hạn thanh toán và lý do. | Managers/owners also see "Record as debt" – due date and reason required. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.done_tasks` | Phiếu {bill}. Đã tạo việc: dọn căn, bổ sung minibar, xóa mã trên app khóa. | Folio {bill}. Tasks created: clean room, refill minibar, delete code in lock app. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.effect_bill` | Server cấp số Phiếu thanh toán; sau bước này không sửa folio (chỉ quản lý ghi điều chỉnh). | The server issues the folio number; after this the folio can't be edited (managers can post adjustments). | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.effect_door` | Tạo việc "Xóa mã trên app khóa" cho căn {room} (R2 nhập tay). | A "Delete code in lock app" task is created for room {room} (R2 manual). | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.effect_kit_note` | Đơn có khách ngủ sofa: thêm việc thu hồi bộ đồ dùng thêm. | Bookings with a guest on the sofa also get an extra-kit pickup task. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.effect_status` | Đơn chuyển "Đã trả phòng", buồng chuyển "Trống, cần dọn"; có việc dọn và bổ sung minibar. | Booking becomes "Checked out", room becomes "Vacant, dirty"; cleaning and minibar refill tasks are created. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.error_title` | Chưa tải được dữ liệu trả phòng | Couldn't load check-out data | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.extras_title` | Phát sinh khác | Other charges | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.foc_approved` | Miễn {amount} · {reason} · đã duyệt bởi {who} lúc {time} | Waived {amount} · {reason} · approved by {who} at {time} | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.foc_pending` | Miễn {amount} đang chờ duyệt. Chưa hoàn tất trả phòng được cho tới khi có kết quả – hoặc rút yêu cầu và thu đủ. | Waiver of {amount} is awaiting approval. Check-out can't be completed until it's decided – or withdraw it and collect in full. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.go_bill` | Tiếp tục: Bill & thu tiền | Continue: Folio & payment | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.go_extras` | Tiếp tục: Phụ phí | Continue: Charges | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.house_rules_not_sent` | Chưa ghi nhận đã gửi nội quy – cân nhắc trước khi thu phạt | House rules not recorded as sent – think twice before charging a fine | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `co.invoice_email` | Email nhận hóa đơn | Email for the invoice | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.invoice_r3` | Hóa đơn điện tử phát hành từ Round 3; R2 lưu thông tin để kế toán xuất. | E-invoices are issued from Round 3; R2 stores the details for accounting. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.invoice_toggle` | Khách lấy hóa đơn công ty | Guest needs a company invoice | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.item` | Món | Item | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.late_switch_hint` | Khách trả sau 12:00 mà chưa hẹn: dùng "Trả muộn" ở drawer đơn để tính và báo khách trước. | Guest leaving after 12:00 without an agreed time: use "Late check-out" in the booking drawer to calculate and tell them first. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.line_late` | Phụ thu trả muộn ({time}) | Late check-out fee ({time}) | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.minibar_not_checked` | Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất. | Minibar not checked. Do step 1 before completing. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.minibar_skip` | Bỏ qua bước này – sang Phụ phí. | Skip this step – go to Charges. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.minibar_total` | Tổng minibar | Minibar total | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.offline` | Mất kết nối lúc {time}. Không thu tiền và không hoàn tất trả phòng khi chưa có mạng – nhờ khách chờ hoặc ghi giấy và nhập bù. | Offline since {time}. Payments and check-out can't be completed without a connection – ask the guest to wait, or note it on paper and enter it later. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.partial_hint` | Ghi nhận phần đã nhận, rồi chọn cách thanh toán khác cho phần còn lại. | Record what was received, then choose another method for the rest. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.pos_code` | Mã chuẩn chi trên phiếu POS | Approval code on the POS slip | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.pos_no_card` | Không nhập số thẻ – chỉ mã chuẩn chi in trên phiếu máy POS. | Never enter the card number – only the approval code printed on the POS slip. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.post_checkout_line` | phát sinh sau trả phòng | post-check-out charge | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `co.preview_bill` | Xem Phiếu thanh toán | View folio | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.print` | In phiếu | Print folio | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.qr_account` | Tài khoản thử (R2) – Techcombank | Test account (R2) – Techcombank | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_all_staff` | Mọi người ghi | Everyone | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_booking` | Đơn | Booking | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_by` | Người ghi | Recorded by | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_date` | Ngày ghi | Date recorded | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_explain` | "Chờ đối soát" vẫn tính là đã thu. Nếu quản lý không thấy tiền về, folio trở lại còn phải thu và quản lý được báo. | "Awaiting reconciliation" still counts as paid. If the manager can't find the money, the folio goes back to balance due and the manager is notified. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_method` | Cách | Method | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_missing` | Không thấy tiền | Money not received | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_missing_effect` | "Không thấy tiền": giao dịch đánh dấu tranh chấp, folio trở lại còn phải thu, quản lý được báo. | "Money not received": the payment is marked disputed, the folio goes back to balance due, and the manager is notified. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_ok` | Đã khớp sao kê | Matches statement | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_overdue` | Quá {days} ngày | Over {days} days | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_time` | Ghi lúc | Recorded at | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.recon_title` | Chờ đối soát | Awaiting reconciliation | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.see_approval` | Xem yêu cầu | View request | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.std` | Chuẩn | Standard | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.tax_code` | Mã số thuế | Tax code | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.tax_code_err` | Mã số thuế gồm 10 hoặc 13 chữ số (có thể có dấu gạch ngang). | The tax code has 10 or 13 digits (hyphens allowed). | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.time_from_late` | Theo giờ trả muộn đã hẹn {time}. | From the agreed late check-out time {time}. | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.txn_ref` | Mã giao dịch / ghi chú (không ghi số thẻ) | Transaction ref / note (no card numbers) | ⟨chừa chỗ⟩ | 16-check-out.html |
| `co.txn_ref_short` | Mã giao dịch | Transaction ref | ⟨chừa chỗ⟩ | 16-check-out.html |
| `error.SELF_RECONCILE_FORBIDDEN` | Giao dịch do bạn ghi cần người khác đối soát. | A payment you recorded must be reconciled by someone else. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `field_error.doc_number` | Số giấy tờ chưa đúng dạng (CCCD/định danh: 12 chữ số). | ID number format isn't right (citizen/personal ID: 12 digits). | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `field_error.evidence_required` | Thêm ảnh hoặc ghi chú bằng chứng cho khoản phạt/hư hỏng. | Add a photo or a note as evidence for this fine/damage charge. | ⟨chừa chỗ⟩ | 15-stay.html |
| `field_error.minibar_over_standard` | Không quá {max} (mức chuẩn của tủ). | No more than {max} (the minibar's standard stock). | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `foc.amount` | Số tiền miễn | Amount to waive | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.kind` | Loại | Type | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.kind_discount` | Giảm giá đặc biệt (tiền phòng) | Special discount (room charge) | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.kind_foc` | Miễn khoản phát sinh (FOC) | Waive an extra charge (FOC) | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.open_form` | Mở form miễn phí / giảm giá | Open waiver / discount form | ⟨chừa chỗ⟩ | 13-check-in.html |
| `foc.over_self_limit` | Miễn {amount} sẽ vượt hạn mức tự miễn {limit}/tháng của bạn. Yêu cầu chuyển lễ tân trưởng duyệt. | Waiving {amount} would exceed your self-waiver limit of {limit}/month. The request goes to a senior receptionist. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.r_long` | Khách dài hạn | Long-stay guest | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.r_other` | Khác (ghi rõ) | Other (please specify) | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.r_recovery` | Bù sự cố | Service recovery | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.r_regular` | Khách quen / VIP | Returning guest / VIP | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.r_room_ready` | Phòng sẵn sàng, không ảnh hưởng khách sau | Room ready, no impact on next guest | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.route_note` | Không cần chọn người duyệt: yêu cầu đến mọi người có quyền duyệt khoản này ({roles}). Người duyệt đầu tiên quyết định. | No need to choose an approver: the request goes to everyone allowed to approve this amount ({roles}). The first to respond decides. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.self_apply` | Minibar {amount} nằm trong hạn mức tự miễn của bạn (đã dùng {used}/{limit} tháng này). Nhập lại mật khẩu để áp ngay. | Minibar {amount} is within your self-waiver limit ({used}/{limit} used this month). Re-enter your password to apply it now. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.self_apply_note` | Dòng ghi "tự áp trong hạn mức", vào báo cáo FOC và để lễ tân trưởng xem lại. | The line is marked "self-applied within limit", included in the FOC report and reviewed by the senior receptionist. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.self_apply_submit` | Tự áp miễn phí | Apply waiver | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.send` | Gửi duyệt | Send for approval | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `foc.title` | Miễn phí · {line} · {amount} | Waiver · {line} · {amount} | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `guest.oci.closed_desk` | Lễ tân đã nhận giấy tờ của bạn | Reception already has your IDs | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `guest.oci.companions_at_desk` | Người đi cùng tự trả lời câu này tại quầy. | Other guests answer this question themselves at reception. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `guest.oci.withdraw_hint` | Muốn rút đồng ý lưu ảnh? Báo lễ tân – ảnh sẽ được xóa. | Want to withdraw consent to keep photos? Tell reception – the photos will be deleted. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.back_home` | Về trang lưu trú | Back to my stay | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_consent` | 3 · Đồng ý Có/Không – nút Gửi mở khi đã chọn | 3 · Consent Yes/No – Send unlocks once chosen | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_docs` | 1 · Giấy tờ từng người (đổi trạng thái để xem gửi / lỗi / mất mạng) | 1 · IDs per guest (switch state to see uploading / error / offline) | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_done` | Hoàn tất – bản R2 không hứa mã cửa trên trang | Done – the R2 version doesn't promise a door code on the page | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_eta` | 2 · Giờ đến dự kiến | 2 · Expected arrival time | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_home` | Trang lưu trú – 3 tab, không có Hóa đơn ở R2. | Stay page – 3 tabs, no Bill tab in R2. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_notice` | 0 · Thông báo xử lý dữ liệu | 0 · Data processing notice | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.checkin` | Nhận phòng | Check-in | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.checkout` | Trả phòng | Check-out | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.closed_body` | Bạn không cần gửi gì thêm. Cần hỗ trợ, nhắn hoặc gọi lễ tân. | You don't need to send anything else. Need help? Message or call reception. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.directions` | Chỉ đường | Directions | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.docs_have` | Đã có giấy tờ của {n}/{m} khách | IDs received for {n}/{m} guests | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.docs_none` | Chưa có giấy tờ nào – bắt đầu với Khách 1 ({m} khách trong đơn). | No IDs yet – start with Guest 1 ({m} guests on the booking). | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.done_desk_check` | Tại quầy, lễ tân xem giấy tờ gốc vài phút để đối chiếu. | At reception, staff will take a few minutes to check your original documents. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.door_at_desk` | Lễ tân giao mã cửa khi bạn đến. Đến sau 22:00? Gọi người trực khi tới nơi. | Reception gives you your door code when you arrive. Arriving after 22:00? Call the night staff when you get here. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.door_at_desk_title` | Mã cửa | Door code | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.ended_body` | Kỳ lưu trú đã kết thúc. Cần phiếu thanh toán hay hỗ trợ? Nhắn OTTIMO qua Zalo/WhatsApp. | Your stay has ended. Need your folio or help? Message OTTIMO on Zalo/WhatsApp. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.house_rules` | Nội quy và phí phạt | House rules and fees | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.late_r2` | Đến sau 22:00: người trực đêm sẽ làm thủ tục và giao mã cửa khi bạn tới – gọi số trên trang này khi đến nơi. | Arriving after 22:00: the night staff will check you in and give you the door code when you arrive – call the number on this page when you get here. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.link_reissue_title` | Cấp link mới cho đơn {code}? Link cũ ngừng hoạt động ngay. | Issue a new link for booking {code}? The old link stops working immediately. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.link_revoke_title` | Thu hồi link của đơn {code}? Khách mở link sẽ thấy "Liên kết đã hết hạn". | Revoke the link for booking {code}? Guests opening it will see "Link expired". | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.notice_body` | OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Bạn sẽ được hỏi riêng có muốn cho lưu ảnh sau khi khai báo hay không. | OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. You'll be asked separately whether we may keep the photos after registration. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.notice_read` | Tôi đã đọc | I've read this | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.notice_title` | Trước khi bắt đầu | Before you start | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.notice_version` | Phiên bản thông báo: {v} | Notice version: {v} | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.offline_upload` | Mất kết nối – ảnh chưa gửi sẽ không được giữ lại trên máy. Khi có mạng, chụp lại để gửi. | You're offline – unsent photos aren't kept on this device. When you're back online, take them again to send. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.photo_tips` | Đặt giấy tờ trên nền tối, đủ sáng, thấy đủ 4 góc, không lóa. | Place the ID on a dark surface in good light, all 4 corners visible, no glare. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.prechecked_notice` | Khách {code} đã làm thủ tục trước – đến lúc {eta} | Guest {code} checked in online – arriving at {eta} | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.resend` | Gửi lại | Send again | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.room` | Căn | Room | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.saved_progress` | Tiến trình đã lưu – mở lại link để làm tiếp. | Progress saved – open the link again to continue. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.sent_hidden` | Đã gửi – vì an toàn, ảnh không hiện lại ở đây. | Sent – for your safety, the photo isn't shown again here. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.take_photo` | Chụp | Take photo | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.take_photo_again` | Chụp lại bằng nút Chụp | Retake with the Take photo button | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.wifi_later` | Hiện ở đây vào ngày nhận phòng ({date}). | Shown here on your arrival day ({date}). | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `late.grace_off` | Căn có khách đến hôm nay – không áp ân hạn 12:30. | A guest is arriving in this room today – the 12:30 grace period doesn't apply. | ⟨chừa chỗ⟩ | 15-stay.html |
| `late.std_zero` | Trả trước 12:00 – không phụ thu | Leaving by 12:00 – no surcharge | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `mlog.a_adjusted` | Điều chỉnh dòng (đảo + dòng mới) · giặt ủi | Line adjusted (reversal + new line) · laundry | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.a_foc_approved` | Duyệt miễn phí | Waiver approved | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.a_line_added` | Thêm dòng folio · phụ thu trả muộn | Folio line added · late check-out fee | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.a_payment` | Ghi nhận thu · VietQR · chờ đối soát | Payment recorded · VietQR · awaiting reconciliation | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.action` | Thao tác | Action | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.all_kinds` | Mọi thao tác tiền | All money actions | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.all_people` | Mọi người | Everyone | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.before_after` | Trước → sau | Before → after | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.date` | Khoảng ngày | Date range | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.empty_body` | Đổi khoảng ngày hoặc bỏ bộ lọc người làm. | Change the date range or clear the person filter. | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.empty_title` | Không có thao tác tiền trong khoảng này | No money actions in this period | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.error_title` | Chưa tải được nhật ký | Couldn't load the log | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.k_cancel` | Hủy đơn, phí hủy | Cancellations, cancellation fees | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.k_foc` | Miễn phí / giảm giá | Waivers / discounts | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.k_folio` | Dòng folio | Folio lines | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.k_payment` | Thu / hoàn / đảo | Payments / refunds / reversals | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.time` | Lúc | Time | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.who` | Người làm | By | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `pay.bank_transfer` | Chuyển khoản | Bank transfer | ⟨chừa chỗ⟩ | 16-check-out.html |
| `pay.pending_reconcile` | Chờ đối soát | Awaiting reconciliation | ⟨chừa chỗ⟩ | 16-check-out.html |
| `reg2.add_docs` | Nhập giấy tờ | Enter IDs | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.after_sent` | Bật sau khi đã gửi. | Available after sending. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.all_note` | Tất cả hồ sơ trong 30 ngày, lọc theo trạng thái. | All records from the last 30 days, filter by status. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.at_checkin` | Khi nhận phòng | At check-in | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.at_checkin_rule` | giờ nhận + 12 giờ | check-in time + 12 hours | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.before_23` | Trước 23:00 hôm nay | Before 23:00 today | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.block1` | 1 · Đối chiếu và đồng ý lưu ảnh | 1 · Checks and photo consent | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.block2` | 2 · Sao chép lên cổng khai báo | 2 · Copy to the registration portal | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.block3` | 3 · Ghi kết quả từ cổng | 3 · Record the portal result | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.checks_handled` | {n} mục đã ghi cách xử lý | {n} item(s) with handling noted | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.citizen_note` | Trường theo biểu mẫu thông báo lưu trú: họ tên, ngày sinh, số CCCD, ngày đến/đi. Địa chỉ chỉ nhập khi cổng yêu cầu. | Fields follow the residence notice form: full name, date of birth, ID number, arrival/departure dates. Address only if the portal asks. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.clear_clipboard` | Xóa bộ nhớ tạm | Clear clipboard | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.code_help` | Dán đúng mã cổng trả về sau khi gửi. | Paste the exact code the portal returns after submitting. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_action` | Thao tác | Action | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_deadline` | Hạn khai báo | Registration deadline | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_guest` | Khách | Guest | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_kind` | Loại | Type | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_people` | Giấy tờ | IDs | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.col_status` | Trạng thái | Status | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.consent_from_app` | Đã chọn qua app lúc {time}: {choice} | Chosen via app at {time}: {choice} | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `reg2.consent_granted_app` | Đồng ý lưu ảnh · qua app | Agreed to keep photos · via app | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.consent_not_recorded` | Chưa ghi quyết định | No decision recorded | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.consent_q` | Khách có đồng ý lưu ảnh giấy tờ 30 ngày sau trả phòng không? | Does the guest agree to OTTIMO keeping ID photos for 30 days after check-out? | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.copy_help` | Dữ liệu chỉ hiện sau khi xác nhận lại mật khẩu, mỗi lần mở được ghi nhật ký. Bấm "Sao chép" từng ô theo thứ tự rồi dán vào cổng. | Data appears only after re-entering your password, and every view is logged. Tap "Copy" for each field in order and paste into the portal. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.deadline_at` | {time} ({rule}) | {time} ({rule}) | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.declare` | Khai báo | Register | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.edit_after_sent` | Đã khai trên cổng – sửa ở đây không tự sửa trên cổng | Already registered on the portal – editing here doesn't change the portal. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `reg2.empty_body` | Mọi khách đang ở đã được khai báo. Hồ sơ mới xuất hiện khi khách nhận phòng hoặc gửi giấy tờ qua app. | Every in-house guest is registered. New records appear when guests check in or send IDs via the app. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.empty_title` | Không còn hồ sơ cần khai báo | Nothing left to register | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.error_title` | Chưa tải được danh sách khai báo | Couldn't load the registration list | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.eta` | dự kiến đến {time} | expected {time} | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.image_deleted` | Ảnh đã xóa lúc {time} ({reason}) | Photo deleted at {time} ({reason}) | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `reg2.kind_citizen` | Công dân VN | Vietnamese citizen | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.kind_foreign` | Người nước ngoài | Foreign guest | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.mark_sent` | Đã gửi khai báo | Registration sent | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.next_person` | Người tiếp theo: Lucas Martin | Next person: Lucas Martin | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.offline` | Mất kết nối. Danh sách lúc {time} – chỉ xem hạn. Không mở được giấy tờ, không sao chép dữ liệu khai báo khi chưa có mạng. | Offline. List as of {time} – deadlines only. IDs can't be opened and registration data can't be copied without a connection. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.overdue_chip` | Khai báo quá hạn | Registration overdue | ⟨chừa chỗ⟩ | 15-stay.html |
| `reg2.portal_confirmed` | Cổng đã xác nhận | Portal confirmed | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.portal_field` | Trường trên cổng | Portal field | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.portal_rejected` | Cổng từ chối | Portal rejected | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.portal_value` | Giá trị | Value | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.purge_fd_note` | Lễ tân không thấy nút này. | Receptionists don't see this button. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.purge_submit` | Xóa ảnh | Delete photos | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.reject_effect` | Hồ sơ trở về "Đủ giấy tờ · chờ khai báo" để sửa và khai lại. | The record returns to "IDs complete · awaiting registration" to fix and resubmit. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.reject_reason` | Lý do cổng từ chối | Reason the portal rejected it | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.retention` | Ảnh giấy tờ | ID photos | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.retention_refused` | Người không đồng ý | Guests who declined | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.retention_refused_value` | Xóa ngay khi cổng xác nhận | Deleted as soon as the portal confirms | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.retention_value` | Tự xóa 30 ngày sau trả phòng ({date}) | Auto-deleted 30 days after check-out ({date}) | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.review_done` | Đối chiếu xong | Checks complete | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.sent_note` | Mã hồ sơ {code} · gửi lúc {time}. Ảnh của người không đồng ý sẽ tự xóa khi cổng xác nhận. | Portal reference {code} · sent at {time}. Photos of guests who declined are deleted automatically when the portal confirms. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.show_data` | Hiện dữ liệu khai báo | Show registration data | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.stay_to` | Tạm trú đến ngày | Temporary residence until | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.tab_action` | Cần xử lý | Needs action | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.tab_all` | Tất cả | All | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.tab_update` | Cần cập nhật ngày đi | Departure date to update | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.upd_empty_body` | Khi khách nước ngoài gia hạn, trả sớm hoặc trả phòng, hồ sơ sẽ hiện ở đây để cập nhật ngày đi trên cổng trong ngày. | When a foreign guest extends, leaves early or checks out, their record appears here so the departure date can be updated on the portal the same day. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.upd_empty_title` | Không có ngày đi nào cần cập nhật | No departure dates to update | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.via_app` | gửi qua app 14/10 20:15 | sent via app 14/10 20:15 | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.withdraw_body` | Khách rút đồng ý tại quầy. Khai báo đã được cổng xác nhận nên ảnh giấy tờ bị xóa ngay; thông tin đã khai báo vẫn giữ theo luật. | The guest withdrew consent at reception. The portal has already confirmed the registration, so the ID photos are deleted now; the registered details are kept as required by law. | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.withdraw_submit` | Ghi không đồng ý | Record as declined | ⟨chừa chỗ⟩ | 14-registration.html |
| `reg2.withdraw_title` | Ghi {guest} không đồng ý lưu ảnh? | Record that {guest} doesn't agree to keep photos? | ⟨chừa chỗ⟩ | 14-registration.html |
| `stay.add_charge` | Thêm phát sinh | Add charge | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.add_charge_submit` | Thêm vào folio | Add to folio | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.add_photo` | Thêm ảnh từ buồng phòng | Add photo from housekeeping | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.after_noon_hint` | Giờ sau 12:00 là trả muộn – dùng nút Trả muộn để tính phụ thu. | Times after 12:00 are late check-outs – use Late check-out to calculate the fee. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.arrival_toggle` | Căn có khách đến hôm nay (minh họa) | Guest arriving in this room today (demo) | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.card_answered` | Đã trả lời – trả lúc {time} | Replied – leaving at {time} | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.card_call` | Chưa trả lời – gọi xác nhận | No reply – call to confirm | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.card_overdue` | Quá giờ trả phòng | Past check-out time | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.card_overdue_when` | Báo lúc {time} – căn không có khách đến nên tính sau ân hạn. | Flagged at {time} – no arrival in this room, so after the grace period. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.card_waiting` | Chờ khách trả lời | Waiting for guest's reply | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.cause_fault` | Sự cố của OTTIMO – giữ giá cũ | OTTIMO's fault – keep old rate | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.cause_guest` | Khách yêu cầu – giá căn mới | Guest request – new room's rate | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.ch_in_person` | Tại quầy | At reception | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.ch_phone` | Gọi điện | Phone call | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.ch_zalo` | Zalo | Zalo | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_cause` | Vì sao đổi? | Why the change? | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_effect_door` | Việc "Xóa mã trên app khóa" cho căn {old} và tạo mã mới cho căn {new}. | Task "Delete code in lock app" for room {old} and create a new code for room {new}. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_effect_old` | Căn {room} chuyển cần dọn và có việc dọn. | Room {room} needs cleaning and gets a cleaning task. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_effect_reg` | Khai báo lưu trú không phải làm lại – chỉ đổi số căn trong hồ sơ. | Registration doesn't need redoing – only the room number in the record changes. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_submit` | Đổi sang căn {room} | Move to room {room} | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.change_title` | Đổi phòng · Căn {room} · {guest} | Change room · Room {room} · {guest} | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.charge_default` | Giá mặc định {amount} theo {rule}. Phí phạt không tính vào doanh thu phòng. | Default price {amount} per {rule}. Fines don't count as room revenue. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.charge_item` | Khoản | Item | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.checkout_std` | {time} (giờ chuẩn, chưa xác nhận) | {time} (standard, not confirmed) | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.checkout_time` | Giờ trả | Check-out time | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.door` | Mã cửa | Door code | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.door_manual` | Giao tay trên app khóa – không lưu trong OTTIMO (R2) | Handed over via the lock app – not stored in OTTIMO (R2) | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.evidence` | Ảnh hoặc ghi chú bằng chứng | Photo or note as evidence | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.extend_door` | Nhớ kéo dài hiệu lực mã cửa trên app khóa tới giờ trả mới. | Remember to extend the door code's validity in the lock app to the new check-out time. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.free_until` | Trống tới {date} | Free until {date} | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.grace_rule` | Ân hạn tới 12:30 chỉ khi căn không có khách đến cùng ngày; mốc 15:00 và 18:00 không dời. | The grace period to 12:30 applies only when no guest arrives in the room the same day; the 15:00 and 18:00 cut-offs don't move. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.late_door_manual` | R2: kéo dài hiệu lực mã trên app khóa bằng tay. | R2: extend the code's validity in the lock app manually. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.late_help` | Dạng 24 giờ, ví dụ 12:30. | 24-hour format, e.g. 12:30. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.late_to_extend` | Trả sau 18:00 là ở thêm 1 đêm – dùng Gia hạn để khóa đêm trên các kênh. | Leaving after 18:00 means one more night – use Extend so the night is closed on all channels. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.long_hint` | Khách muốn ở thêm hơn 7 đêm hoặc tổng từ 28 đêm: lập báo giá dài hạn (R3). Ở R2 tạo "đơn dài hạn nhập tay". | Guest wants more than 7 extra nights or 28+ nights in total: long-stay quote (R3). In R2 create a "manual long-stay booking". | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.new_room` | Căn mới (đã dọn hoặc đã kiểm) | New room (cleaned or inspected) | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.no_charges_body` | Folio chỉ có tiền phòng. Thêm phát sinh khi khách dùng dịch vụ hoặc có phí phạt. | The folio only has room charges. Add charges when the guest uses services or incurs a fine. | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.no_charges_title` | Chưa có phát sinh | No extra charges yet | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.not_ready_hint` | Chưa dọn – không chọn được | Not cleaned – can't be selected | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.note` | Ghi chú | Note | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.ota_room_paid` | Tiền phòng – Airbnb đã thu | Room charge – collected by Airbnb | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.qty` | Số lượng | Quantity | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.reply_channel` | Khách trả lời qua | Guest replied via | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.see_full` | Xem bản đầy đủ ở mục bên dưới | See the full version in the section below | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.to_manual_long` | Tạo đơn dài hạn nhập tay | Create manual long-stay booking | ⟨chừa chỗ⟩ | 15-stay.html |
| `stay.visa_dialog` | Thị thực của {guest} hết hạn {date}, trước ngày đi {departure}. Khai báo chỉ đến {date}. Nhắc khách gia hạn trước {remind}. | {guest}'s visa expires on {date}, before departure {departure}. Registration only runs to {date}. Remind the guest to extend before {remind}. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `stay.visa_warn` | Thị thực của khách hết hạn {date}. Khai báo chỉ tới {date}; ghi lý do để tiếp tục và nhắc khách gia hạn thị thực. | The guest's visa expires on {date}. Registration only runs to {date}; enter a reason to continue and remind the guest to extend their visa. | ⟨chừa chỗ⟩ | 15-stay.html |
| `sur.early_extra_night` | Nhận trước 06:00 = bán thêm đêm {date} (không phải phụ thu). Hệ thống kiểm căn còn trống đêm đó. | Check-in before 06:00 = selling an extra night on {date} (not a surcharge). The system checks the room is free that night. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `sur.early_fee` | Phụ thu nhận sớm đề xuất: {amount} ({pct}% giá đêm đầu) | Suggested early check-in surcharge: {amount} ({pct}% of first night) | ⟨chừa chỗ⟩ | 13-check-in.html |
| `sur.early_zero` | Nhận từ {std} – không phụ thu | Checking in from {std} – no surcharge | ⟨chừa chỗ⟩ | BA spec / hifi.js |

#### Mẫu tin nhắn (sao chép gửi – US-125, M13)

| Key | Tình huống | Tiếng Việt | English | Русский (nháp – cần người bản ngữ duyệt) |
|---|---|---|---|---|
| `msg.booking_confirmed` | Xác nhận đặt phòng | Chào {name}, OTTIMO xác nhận đặt phòng {code}: căn {room}, {from} → {to} ({nights} đêm). Nhận phòng từ 14:00, trả phòng trước 12:00. Đã cọc {deposit}, còn {balance} khi nhận phòng. Hủy: {cancel_policy_short}. Làm thủ tục trước để nhận phòng nhanh: {link} | Hi {name}, OTTIMO confirms booking {code}: room {room}, {from} → {to} ({nights} nights). Check-in from 14:00, check-out by 12:00. Deposit paid {deposit}, {balance} due at check-in. Cancellation: {cancel_policy_short}. Check in online for a faster arrival: {link} | Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: апартаменты {room}, {from} → {to} ({nights} ноч.). Заезд с 14:00, выезд до 12:00. Предоплата {deposit}, остаток {balance} при заселении. Отмена: {cancel_policy_short}. Онлайн-регистрация для быстрого заселения: {link} |
| `msg.deposit_received` | Đã nhận cọc (khách trực tiếp) | Chào {name}, OTTIMO đã nhận cọc {deposit} cho đơn {code} (căn {room}, {from} → {to}). Còn {balance} thanh toán khi nhận phòng. Chính sách hủy: {cancel_policy_short} | Hi {name}, OTTIMO has received your deposit of {deposit} for booking {code} (room {room}, {from} → {to}). {balance} is due at check-in. Cancellation: {cancel_policy_short} | Здравствуйте, {name}! OTTIMO получил предоплату {deposit} по бронированию {code} (апартаменты {room}, {from} → {to}). Остаток {balance} оплачивается при заселении. Отмена: {cancel_policy_short} |
| `msg.checkin_link` | Link check-in online | Chào {name}, để nhận phòng nhanh, vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút). | Hi {name}, to speed up your check-in, please send your IDs and arrival time here: {link} (about 2 minutes). | Здравствуйте, {name}! Чтобы заселение прошло быстрее, отправьте, пожалуйста, документы и время прибытия по ссылке: {link} (около 2 минут). |
| `msg.checkout_reminder` | Nhắc trả phòng (20:00 hôm trước – BR-425) | Chào {name}, ngày mai {date} là ngày trả phòng (trước 12:00). Bạn muốn ở thêm hoặc trả muộn? Trả lời tại: {link} | Hi {name}, tomorrow {date} is your check-out day (by 12:00). Would you like to stay longer or check out late? Reply here: {link} | Здравствуйте, {name}! Завтра, {date}, день выезда (до 12:00). Хотите продлить проживание или выехать позже? Ответьте здесь: {link} |
| `msg.bill` | Gửi bill | Cảm ơn {name} đã lưu trú tại OTTIMO. Bill {bill_no}: {amount}. Xem chi tiết: {link} | Thank you for staying at OTTIMO, {name}. Folio {bill_no}: {amount}. Details: {link} | Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link} |
| `msg.utility_bill` | Hóa đơn điện nước tháng (dài hạn) | Chào {name}, hóa đơn điện nước kỳ {period}: điện {kwh} kWh, nước {m3} m³, tổng {amount}, hạn thanh toán {due}. Ảnh công tơ và chi tiết: {link} | Hi {name}, your utilities bill for {period}: electricity {kwh} kWh, water {m3} m³, total {amount}, due {due}. Meter photos and details: {link} | Здравствуйте, {name}! Счёт за коммунальные услуги за {period}: электричество {kwh} кВт·ч, вода {m3} м³, итого {amount}, оплатить до {due}. Фото счётчиков и детали: {link} |
| `msg.house_rules_smoking` | Nhắc nội quy hút thuốc | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn! | Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you! | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо! |
| `msg.hot_water_issue` | Báo đang xử lý sự cố nước nóng | Chào {name}, OTTIMO đã nhận báo mất nước nóng căn {room}. Kỹ thuật sẽ có mặt trước {time}. Xin lỗi vì bất tiện! | Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. Sorry for the inconvenience! | Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства! |

## 9. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXD | Bản đầu: giọng văn, chính tả, thuật ngữ, định dạng, mẫu câu, i18n, 7 mẫu tin nhắn VI/EN/RU, bảng chuỗi luồng 2–4, 7 |
| 0.2 | 15/10/2026 | UXD | Đợt 4: thêm bảng tên vai (3.1b) và 5 thuật ngữ; mục 5.2b hiển thị lỗi API; 37 chuỗi `error.<CODE>` + `error.server` thay mã minh họa RK-503/CO-MB-502/QT-500/CM-500/HK-500/OV-500; nhóm chuỗi L9 (gia hạn, trả muộn, đổi căn/đổi phòng, không đến), xác nhận US-135, buồng phòng, duyệt, hoa hồng; nhóm bảo mật SEC Phần 2 (`auth.totp.*`, `device.*`, `desk_code.*`, `guest.verify.*` OTP email/mã lễ tân, `guest.after_checkout.*`, `error.DEVICE_NOT_TRUSTED`). Sửa: `common.error_generic_body` ({code}→{request_id}), `booking.create_hold` (giờ → hạn), `checkin.room_not_ready` (lễ tân gửi duyệt, lễ tân trưởng tự xác nhận), `checkin.verify.fail_passport` (không chặn, bắt buộc ghi xử lý – K5), `reg.code_error` (bỏ định dạng giả), `guest.req.status.*` theo SM-15 (bỏ `received`, thêm `new`, `acknowledged`, `declined`; "Đã xong" → "Hoàn thành"), thêm `status.reg.void` |
| 0.3 | 16/10/2026 | UXD | Bước 4: nhóm chuỗi "đến muộn / tự nhận phòng" (`guest.late.*`, `guest.contact.*`), kênh nhận mã (`guest.verify.via_*`, `guest.verify.no_email`, `desk_code.send_channel/channel_off/separate`), `guest.offline_banner` (app khách không hứa tự gửi), tiến độ tải ảnh, dòng bill/USD, lý do từ chối đã dịch, `guest.req.staff_note`, `guest.lang.ru_soon`; `booking.email*`, `booking.no_email_warn`, `booking.close_draft`; `night.*`; `auth.login.error_generic`, `auth.code_label.*`, `auth.enroll.*`, `device.check.*`; `today.*`; `crm.*`, `msgtpl.*`, `config.*`, `moneylog.title`; mẫu `msg.deposit_received`; `msg.booking_confirmed` thêm `{deposit}`, `{balance}`, `{cancel_policy_short}`. Sửa: bỏ mã BR khỏi 10 chuỗi giao diện (chuyển vào ghi chú – FB-R1-UXR-UXD-08); `hk.status.VC`, `status.room.VC` một tên "Đã dọn – chờ kiểm"; `guest.cta.checkin` "Làm thủ tục trước (check-in online)", `guest.oci.submit` "Gửi thủ tục" (FB-16). |
| 0.3.2 | 16/10/2026 | UXD | R2 Sprint 1 – hi-fi Sprint 3: 363 chuỗi VI/EN mới (`ci.*`, `checkin.*` mới, `reg2.*`, `stay.*`, `co.*`, `pay.bank_transfer`, `pay.pending_reconcile`, `foc.*`, `approval.*` mới, `mlog.*`, `gw.*`, `guest.oci.*` mới, `sur.*`, `late.std_zero`, `late.grace_off`, `error.SELF_RECONCILE_FORBIDDEN`, `field_error.*` mới) theo specs BA EP03-05, EP06; sửa `guest.oci.done_body` (R2 không hứa mã cửa – SEC ĐK-6), `pay.card` (POS tại quầy), `approval.pin_title/label` và `error.REAUTH_FAILED` (mật khẩu ở R2), `checkout.complete_confirm_body` (bỏ mã cửa, thêm thu hồi bộ đồ dùng thêm); xóa `handover.foc_approver` (BR-432). |
| 0.3.1 | 16/10/2026 | UXD | R2 Đợt 0 hi-fi: 502 chuỗi VI/EN mới (gồm mã lỗi OpenAPI 0.3.1: USERNAME_TAKEN, PARTY_DUPLICATE, ROOM_NOT_READY, 6 mã trường `field.*`) (đăng nhập, đổi mật khẩu, 2FA nền, chọn cơ sở, điều hướng 8 vai, Hôm nay, danh mục căn định mức/tối đa, tham số, khách hàng, người dùng & thiết bị, rack, đặt phòng, đơn dài hạn nhập tay, chi tiết đơn, sale/CTV); 13 mã lỗi `error.*` còn thiếu so với OpenAPI 0.3; `error.FILE_REJECTED` sửa theo hợp đồng (JPG/PNG/WebP ≤ 10 MB); thuật ngữ "sofa" cho khách vượt định mức (không dùng "nệm phụ" – ESC-014); RU để R3 |
