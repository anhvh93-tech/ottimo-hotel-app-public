# Hướng dẫn nội dung chữ OTTIMO (Content guide) – v0.1

- Người viết: UXD (kiêm UX Writer) | Round 1 – Bước 2, đợt 2 | Ngày: 15/10/2026
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
| Thuật ngữ | Desk dùng thuật ngữ ngành có nhãn (VC · Trống, sạch); **HK dùng câu thường**, không mã | Không thuật ngữ nội bộ: không "FOC", "OOO", "folio" (trừ EN "folio" trên bill), "VC/VD" |
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

### 3.2 Trạng thái buồng – hai cách nói (HR-13)
| Mã | Desk (mã · nhãn) | Buồng phòng (câu thường) | EN (Desk) | EN (HK) |
|---|---|---|---|---|
| VC | VC · Trống, sạch | Sạch – chờ kiểm | VC · Vacant clean | Clean – needs inspection |
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
- Lỗi tải: "Chưa tải được sơ đồ phòng. Có thể do mạng chập chờn. Dữ liệu của bạn không bị mất. Bấm Thử lại; nếu vẫn lỗi, báo quản lý kèm mã RK-503."
- Cấm: "Lỗi!", "Dữ liệu không hợp lệ", "Bạn đã nhập sai".

### 5.2 Hộp xác nhận (HR-06)
Tiêu đề: câu hỏi có đối tượng ("Hủy giữ chỗ căn 103?"). Thân: hậu quả cụ thể. Nút: "Giữ lại đơn" (an toàn) / "Hủy giữ chỗ" (lặp động từ). Không "OK/Có/Không".

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
- Bill song ngữ VI/EN cho khách NN; mở rộng RU theo ngôn ngữ hồ sơ khách (HR-25, R3).

## 7. Mẫu tin nhắn (US-125 – lễ tân/sale sao chép gửi qua nhóm chat/Zalo)

Biến lấy từ đơn; giờ chuẩn 14:00/12:00 lấy từ tham số BR-401 (ghi trong mẫu để dễ đọc – FE thay bằng biến `{checkin_time}`/`{checkout_time}`). Bản RU là **nháp do UXD soạn – cần người bản ngữ duyệt trước khi dùng**.

| Key | Tình huống | Tiếng Việt | English | Русский (nháp – cần người bản ngữ duyệt) |
|---|---|---|---|---|
| `msg.booking_confirmed` | Xác nhận đặt phòng | Chào {name}, OTTIMO xác nhận đặt phòng {code}: căn {room}, {from} → {to} ({nights} đêm). Nhận phòng từ 14:00, trả phòng trước 12:00. Check-in online để nhận phòng nhanh: {link} | Hi {name}, OTTIMO confirms booking {code}: room {room}, {from} → {to} ({nights} nights). Check-in from 14:00, check-out by 12:00. Check in online for a faster arrival: {link} | Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: апартаменты {room}, {from} → {to} ({nights} ноч.). Заезд с 14:00, выезд до 12:00. Онлайн-регистрация для быстрого заселения: {link} |
| `msg.checkin_link` | Link check-in online | Chào {name}, để nhận phòng nhanh, vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút). | Hi {name}, to speed up your check-in, please send your IDs and arrival time here: {link} (about 2 minutes). | Здравствуйте, {name}! Чтобы заселение прошло быстрее, отправьте, пожалуйста, документы и время прибытия по ссылке: {link} (около 2 минут). |
| `msg.checkout_reminder` | Nhắc trả phòng (20:00 hôm trước – BR-425) | Chào {name}, ngày mai {date} là ngày trả phòng (trước 12:00). Bạn muốn ở thêm hoặc trả muộn? Trả lời tại: {link} | Hi {name}, tomorrow {date} is your check-out day (by 12:00). Would you like to stay longer or check out late? Reply here: {link} | Здравствуйте, {name}! Завтра, {date}, день выезда (до 12:00). Хотите продлить проживание или выехать позже? Ответьте здесь: {link} |
| `msg.bill` | Gửi bill | Cảm ơn {name} đã lưu trú tại OTTIMO. Bill {bill_no}: {amount}. Xem chi tiết: {link} | Thank you for staying at OTTIMO, {name}. Folio {bill_no}: {amount}. Details: {link} | Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link} |
| `msg.utility_bill` | Hóa đơn điện nước tháng (dài hạn) | Chào {name}, hóa đơn điện nước kỳ {period}: điện {kwh} kWh, nước {m3} m³, tổng {amount}, hạn thanh toán {due}. Ảnh công tơ và chi tiết: {link} | Hi {name}, your utilities bill for {period}: electricity {kwh} kWh, water {m3} m³, total {amount}, due {due}. Meter photos and details: {link} | Здравствуйте, {name}! Счёт за коммунальные услуги за {period}: электричество {kwh} кВт·ч, вода {m3} м³, итого {amount}, оплатить до {due}. Фото счётчиков и детали: {link} |
| `msg.house_rules_smoking` | Nhắc nội quy hút thuốc | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn! | Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you! | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо! |
| `msg.hot_water_issue` | Báo đang xử lý sự cố nước nóng | Chào {name}, OTTIMO đã nhận báo mất nước nóng căn {room}. Kỹ thuật sẽ có mặt trước {time}. Xin lỗi vì bất tiện! | Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. Sorry for the inconvenience! | Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства! |

## 8. Bảng chuỗi VI / EN (luồng 2, 3, 4, 7 + dùng chung), cột RU chừa chỗ

Nguồn: `copy/strings-*.json`. Cột RU "⟨chừa chỗ⟩" = chưa dịch, hiện EN. Tổng 318 chuỗi + 7 mẫu tin nhắn.

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
| `common.error_generic_body` | Có thể do mạng chập chờn. Dữ liệu của bạn không bị mất. Bấm Thử lại; nếu vẫn lỗi, báo quản lý kèm mã {code}. | This may be a network problem. Nothing has been lost. Tap Try again; if it keeps failing, tell your manager the code {code}. | ⟨chừa chỗ⟩ |  |
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
| `status.room.VC` | VC · Trống, sạch | VC · Vacant clean | ⟨chừa chỗ⟩ |  |
| `status.room.VI` | VI · Đã kiểm, sẵn sàng | VI · Inspected, ready | ⟨chừa chỗ⟩ |  |
| `status.room.VD` | VD · Trống, cần dọn | VD · Vacant dirty | ⟨chừa chỗ⟩ |  |
| `status.room.CL` | CL · Đang dọn | CL · Cleaning | ⟨chừa chỗ⟩ |  |
| `status.room.OC` | OC · Có khách, sạch | OC · Occupied clean | ⟨chừa chỗ⟩ |  |
| `status.room.OD` | OD · Có khách, cần dọn | OD · Occupied dirty | ⟨chừa chỗ⟩ |  |
| `status.room.OOO` | OOO · Khóa phòng, đang sửa | OOO · Out of order | ⟨chừa chỗ⟩ |  |

#### Trạng thái buồng – giao diện buồng phòng (HR-13, không dùng mã)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.status.VC` | Sạch – chờ kiểm | Clean – needs inspection | ⟨chừa chỗ⟩ |  |
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
| `booking.summary.deposit` | Cọc cần thu (theo BR-305) | Deposit due (per BR-305) | ⟨chừa chỗ⟩ |  |
| `booking.create` | Tạo đơn | Create booking | ⟨chừa chỗ⟩ |  |
| `booking.create_hold` | Giữ chỗ {hours} giờ | Hold for {hours} hours | ⟨chừa chỗ⟩ |  |
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
| `cancel.title` | Hủy giữ chỗ căn {room}? | Cancel the hold on room {room}? | ⟨chừa chỗ⟩ |  |
| `cancel.consequence` | Căn {room} sẽ mở bán lại từ {from} đến {to} trên {channels} kênh. Khách tiềm năng {lead} trở về "Đã báo giá". | Room {room} will be back on sale from {from} to {to} on {channels} channels. Lead {lead} returns to "Quoted". | ⟨chừa chỗ⟩ |  |
| `cancel.reason` | Lý do hủy | Cancellation reason | ⟨chừa chỗ⟩ |  |
| `cancel.reason.changed_mind` | Khách đổi ý | Guest changed their mind | ⟨chừa chỗ⟩ |  |
| `cancel.reason.found_other` | Khách tìm được chỗ khác | Guest found another place | ⟨chừa chỗ⟩ |  |
| `cancel.reason.price` | Giá chưa phù hợp | Price not suitable | ⟨chừa chỗ⟩ |  |
| `cancel.reason.dates` | Đổi ngày | Change of dates | ⟨chừa chỗ⟩ |  |
| `cancel.reason.unreachable` | Không liên lạc được | Guest unreachable | ⟨chừa chỗ⟩ |  |
| `cancel.reason.other` | Khác (ghi rõ) | Other (please specify) | ⟨chừa chỗ⟩ |  |
| `cancel.fee_none` | Không thu phí (giữ chỗ chưa cọc – BR-308) | No fee (hold without deposit – BR-308) | ⟨chừa chỗ⟩ |  |
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
| `checkin.room_not_ready` | Căn {room} đang "{status}" – chưa sẵn sàng. Cần lễ tân trưởng xác nhận và ghi lý do để nhận phòng. | Room {room} is "{status}" – not ready. A senior receptionist must approve with a reason. | ⟨chừa chỗ⟩ | BR-402 |
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
| `checkin.verify.name` | Tên khớp với đơn | Name matches booking | ⟨chừa chỗ⟩ |  |
| `checkin.verify.passport` | Hộ chiếu còn hạn sau ngày trả phòng ({date}) | Passport valid beyond check-out ({date}) | ⟨chừa chỗ⟩ |  |
| `checkin.verify.visa` | Thị thực còn hạn đến ngày trả phòng | Visa valid until check-out | ⟨chừa chỗ⟩ |  |
| `checkin.verify.headcount` | Đủ giấy tờ cho {need} khách | IDs for all {need} guests | ⟨chừa chỗ⟩ |  |
| `checkin.verify.fail_passport` | Hộ chiếu hết hạn {date}, trước ngày trả phòng {checkout}. Không nhận phòng với giấy tờ này – báo quản lý. | Passport expires {date}, before check-out {checkout}. Don't check in with this ID – tell the manager. | ⟨chừa chỗ⟩ |  |
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
| `reg.code_error` | Mã hồ sơ chưa đúng dạng (ví dụ {example}). | File code format looks wrong (e.g. {example}). | ⟨chừa chỗ⟩ |  |
| `reg.later` | Khai báo sau (thêm vào việc cần làm) | Register later (add to to-do list) | ⟨chừa chỗ⟩ |  |
| `reg.later_note` | Việc này sẽ nằm trên Tổng quan và nhắc lúc {times} cho đến khi xong. | This stays on the Overview and reminds you at {times} until done. | ⟨chừa chỗ⟩ |  |
| `handover.door_code` | Mã cửa | Door code | ⟨chừa chỗ⟩ |  |
| `handover.door_code_help` | Hiệu lực từ {from} đến {to}. Khách thấy mã trong app từ ngày nhận phòng. | Valid from {from} to {to}. The guest sees it in their app from arrival day. | ⟨chừa chỗ⟩ | BR-403 |
| `handover.cards` | Số thẻ phòng đã giao | Key cards issued | ⟨chừa chỗ⟩ |  |
| `handover.cards_help` | Tối đa 2 thẻ (1 chính + 1 dự phòng). Trả thiếu khi đi: phí theo BR-511. | Up to 2 cards (1 main + 1 spare). Missing at check-out: fee per BR-511. | ⟨chừa chỗ⟩ |  |
| `handover.arrival_time` | Giờ nhận phòng thực tế | Actual check-in time | ⟨chừa chỗ⟩ |  |
| `handover.early_toggle` | Khách nhận sớm trước {std} | Guest checks in early, before {std} | ⟨chừa chỗ⟩ |  |
| `handover.early_none` | Nhận đúng giờ chuẩn – không phụ thu | Standard check-in time – no surcharge | ⟨chừa chỗ⟩ | HR-04 mặc định |
| `handover.early_fee` | Phụ thu nhận sớm: {amount} ({pct}% giá đêm đầu, BR-411) | Early check-in surcharge: {amount} ({pct}% of first night, BR-411) | ⟨chừa chỗ⟩ |  |
| `handover.early_confirm` | Tôi đã báo khách khoản phụ thu này | I've told the guest about this surcharge | ⟨chừa chỗ⟩ |  |
| `handover.foc` | Đề nghị miễn phí (FOC) | Request a waiver (FOC) | ⟨chừa chỗ⟩ |  |
| `handover.foc_reason` | Lý do miễn phí | Waiver reason | ⟨chừa chỗ⟩ |  |
| `handover.foc_approver` | Người duyệt | Approver | ⟨chừa chỗ⟩ |  |
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
| `checkout.extras.smoking` | Khử mùi thuốc lá (BR-511) | Smoke odour treatment (BR-511) | ⟨chừa chỗ⟩ |  |
| `checkout.extras.card` | Thiếu thẻ phòng (BR-511) | Missing key card (BR-511) | ⟨chừa chỗ⟩ |  |
| `checkout.departure_time` | Giờ trả phòng thực tế | Actual check-out time | ⟨chừa chỗ⟩ |  |
| `checkout.late_toggle` | Khách trả muộn sau {std} | Guest checks out late, after {std} | ⟨chừa chỗ⟩ |  |
| `checkout.late_none` | Trả đúng giờ – không phụ thu | On time – no surcharge | ⟨chừa chỗ⟩ |  |
| `checkout.late_fee` | Phụ thu trả muộn: {amount} ({pct}% giá đêm cuối, BR-412) | Late check-out surcharge: {amount} ({pct}% of last night, BR-412) | ⟨chừa chỗ⟩ |  |
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
| `pay.card` | Thẻ (qua cổng thanh toán) | Card (via payment gateway) | ⟨chừa chỗ⟩ |  |
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
| `checkout.complete_confirm_body` | Đơn chuyển "Đã trả phòng", buồng chuyển "Cần dọn", mã cửa bị hủy, tạo việc dọn và bổ sung minibar. Không sửa folio sau bước này (chỉ ghi điều chỉnh). | The booking becomes "Checked out", the room "Needs cleaning", the door code is revoked, and cleaning and minibar tasks are created. The folio can't be edited after this (adjustments only). | ⟨chừa chỗ⟩ |  |
| `checkout.blocked_balance` | Còn {amount} chưa ghi nhận thanh toán. Ghi nhận đủ trước khi hoàn tất (hoặc quản lý ghi công nợ). | {amount} not yet recorded as paid. Record full payment before completing (or a manager records it as receivable). | ⟨chừa chỗ⟩ | BR-426 |
| `checkout.done` | Đã trả phòng. Bill đã lưu. | Checked out. Folio saved. | ⟨chừa chỗ⟩ |  |
| `checkout.send_bill` | Gửi bill cho khách | Send folio to guest | ⟨chừa chỗ⟩ |  |
| `lt.settlement.title` | Quyết toán ký quỹ | Deposit settlement | ⟨chừa chỗ⟩ |  |
| `lt.settlement.deposit` | Ký quỹ đang giữ | Security deposit held | ⟨chừa chỗ⟩ |  |
| `lt.settlement.utilities` | Điện nước kỳ cuối ({from} – {to}) | Final utilities ({from} – {to}) | ⟨chừa chỗ⟩ |  |
| `lt.settlement.deductions` | Khấu trừ | Deductions | ⟨chừa chỗ⟩ |  |
| `lt.settlement.evidence` | Biên bản kiểm phòng có ảnh | Room inspection report with photos | ⟨chừa chỗ⟩ |  |
| `lt.settlement.evidence_missing` | Chưa có biên bản kiểm phòng có ảnh – chưa được khấu trừ (BR-214). | No inspection report with photos – deductions not allowed yet (BR-214). | ⟨chừa chỗ⟩ |  |
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
| `guest.cta.checkin` | Check-in online | Online check-in | ⟨chừa chỗ⟩ |  |
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
| `guest.oci.arrival` | Bạn dự kiến đến lúc nào? | When do you expect to arrive? | ⟨chừa chỗ⟩ |  |
| `guest.oci.arrival_late` | Sau 22:00 | After 22:00 | ⟨chừa chỗ⟩ |  |
| `guest.oci.note` | Ghi chú cho lễ tân | Note for reception | ⟨chừa chỗ⟩ |  |
| `guest.oci.submit` | Gửi check-in | Submit check-in | ⟨chừa chỗ⟩ |  |
| `guest.oci.done_title` | Xong! Hẹn gặp bạn ngày {date} | All set! See you on {date} | ⟨chừa chỗ⟩ |  |
| `guest.oci.done_body` | Phòng sẵn sàng từ {time}. Mã cửa sẽ hiện trong trang này vào ngày bạn đến. | Your room is ready from {time}. Your door code will appear on this page on arrival day. | ⟨chừa chỗ⟩ |  |
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
| `guest.req.status.received` | Đã nhận | Received | ⟨chừa chỗ⟩ |  |
| `guest.req.status.in_progress` | Đang xử lý | In progress | ⟨chừa chỗ⟩ |  |
| `guest.req.status.done` | Đã xong | Done | ⟨chừa chỗ⟩ |  |
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

## 9. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXD | Bản đầu: giọng văn, chính tả, thuật ngữ, định dạng, mẫu câu, i18n, 7 mẫu tin nhắn VI/EN/RU, bảng chuỗi luồng 2–4, 7 |
