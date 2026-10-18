
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
| `cancel.consequence` | Căn {room} sẽ mở bán lại từ {from} đến {to} trên mọi kênh. Khách tiềm năng {lead} trở về "Đã báo giá". | Room {room} will be back on sale from {from} to {to} on all channels. Lead {lead} returns to "Quoted". | ⟨chừa chỗ⟩ | R2 S2: bỏ {channels} (FE không có số kênh – FB-R2-UXD-FE-S2-02). Không có lead → cancel.consequence_no_lead |
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
| `guest.hello` | Xin chào, {name} | Hello, {name} | Здравствуйте, {name} |  |
| `guest.stay.dates` | {from} → {to} · {nights} đêm | {from} → {to} · {nights} nights | {from} → {to} · ночей: {nights} |  |
| `guest.stay.room` | Căn {room} · {room_name} | Room {room} · {room_name} | ⟨chừa chỗ⟩ |  |
| `guest.stay.checkin_time` | Nhận phòng từ {time} | Check-in from {time} | Заезд с {time} |  |
| `guest.stay.checkout_time` | Trả phòng trước {time} | Check-out by {time} | Выезд до {time} |  |
| `guest.cta.checkin` | Làm thủ tục trước (check-in online) | Online check-in | Онлайн-регистрация | FB-R1-UXR-UXD-16 – lần đầu kèm 'check-in online'; chỗ sau dùng guest.cta.checkin_short |
| `guest.cta.checkin_help` | Gửi giấy tờ trước, nhận phòng tại quầy chỉ vài phút. | Send your IDs in advance – check-in at the desk takes just minutes. | Отправьте документы заранее – заселение на стойке займёт всего несколько минут. |  |
| `guest.tab.home` | Lưu trú | My stay | Моё проживание |  |
| `guest.tab.requests` | Yêu cầu | Requests | ⟨chừa chỗ⟩ |  |
| `guest.tab.bill` | Hóa đơn | Bill | ⟨chừa chỗ⟩ |  |
| `guest.tab.info` | Thông tin | Info | Информация |  |
| `guest.wifi` | Wi-Fi | Wi-Fi | Wi-Fi |  |
| `guest.door_code` | Mã cửa | Door code | ⟨chừa chỗ⟩ |  |
| `guest.door_code_later` | Mã cửa hiện ở đây vào ngày nhận phòng ({date}). | Your door code will appear here on arrival day ({date}). | ⟨chừa chỗ⟩ |  |
| `guest.oci.step1` | Giấy tờ | IDs | Документы |  |
| `guest.oci.step2` | Giờ đến | Arrival time | Время прибытия |  |
| `guest.oci.step3` | Xác nhận | Confirm | Подтверждение |  |
| `guest.oci.people` | Giấy tờ của {n} khách trong đơn | IDs for the {n} guests on this booking | ⟨chừa chỗ⟩ |  |
| `guest.oci.add_doc` | Chụp trang thông tin hộ chiếu / CCCD | Photograph your passport info page / ID card | Сфотографируйте страницу паспорта с данными / удостоверение личности |  |
| `guest.oci.why` | Vì sao cần? Luật Việt Nam yêu cầu khách sạn khai báo lưu trú cho mọi khách. | Why? Vietnamese law requires hotels to register every guest's stay. | Зачем? По закону Вьетнама гостиница обязана регистрировать проживание каждого гостя. |  |
| `guest.oci.consent` | Tôi đồng ý OTTIMO lưu ảnh giấy tờ của tôi đến {days} ngày sau khi trả phòng, sau đó tự xóa. | I agree OTTIMO may keep photos of my ID until {days} days after check-out, then delete them automatically. | Я согласен(на), чтобы OTTIMO хранил фото моего документа до {days} дн. после выезда, а затем автоматически удалил их. | Văn bản pháp lý – cần người dịch duyệt (HR-01) |
| `guest.oci.consent_optional` | Không bắt buộc. Nếu không đồng ý, chúng tôi chỉ dùng thông tin để khai báo và không lưu ảnh. | Optional. If you don't agree, we only use the details for registration and don't keep the photos. | Необязательно. Если вы не согласны, мы используем данные только для регистрации и не храним фото. |  |
| `guest.oci.consent_q` | Lưu ảnh giấy tờ sau khi khai báo? | Keep your ID photos after registration? | Хранить фото вашего документа после регистрации? | Phải chọn Có/Không – không chọn sẵn (`/v1/guest/consents`) |
| `guest.oci.consent_no` | Không, chỉ dùng để khai báo rồi xóa ảnh | No – use them for registration only, then delete | Нет – использовать только для регистрации, затем удалить |  |
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
| `guest.after_checkout.title` | Cảm ơn bạn đã lưu trú | Thank you for staying with us | Спасибо, что остановились у нас | SR-GST-11: ân hạn 24 giờ sau trả phòng |
| `guest.after_checkout.body` | Liên kết này còn dùng đến {time} để xem phiếu thanh toán và thanh toán khoản phát sinh. | This link works until {time} to view your folio and pay any extra charges. | ⟨chừa chỗ⟩ |  |
| `guest.oci.arrival` | Bạn dự kiến đến lúc nào? | When do you expect to arrive? | Когда вы планируете приехать? |  |
| `guest.oci.arrival_late` | Sau 22:00 | After 22:00 | После 22:00 |  |
| `guest.oci.note` | Ghi chú cho lễ tân | Note for reception | Заметка для администратора |  |
| `guest.cta.checkin_short` | Làm thủ tục trước | Online check-in | Онлайн-регистрация |  |
| `guest.oci.submit` | Gửi thủ tục | Submit check-in | Отправить регистрацию |  |
| `guest.oci.done_title` | Thủ tục đã xong. Hẹn gặp bạn ngày {date}. | You're all set. See you on {date}. | Всё готово. До встречи {date}. | DS 11.2.2 G4 (v0.4.1) – bỏ "!" theo Brand Guidelines; MOB đưa vào nhóm guest-web S4, UXD gộp về đây 17/10 (một khóa một dòng). RU nháp |
| `guest.oci.done_body` | Phòng sẵn sàng từ {time}. Lễ tân sẽ giao mã cửa khi bạn đến. | Your room is ready from {time}. Reception will give you your door code when you arrive. | Апартаменты будут готовы с {time}. Код от двери администратор выдаст при заезде. | R2 – SEC P-R2-4 ĐK-6, BA E06-10; bản hiện mã cửa trên trang quay lại ở R3 (US-128, US-141) |
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
| `guest.req.fee_notice` | Dịch vụ này có phí {amount}. Phí sẽ vào hóa đơn của bạn. | This service costs {amount}. It will be added to your bill. | ⟨chừa chỗ⟩ | KHÔNG dùng ở guest-web R2 (chữ "hóa đơn/bill" – SEC ĐK-6); R2 dùng gw.req.fee_notice |
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
| `error.REAUTH_FAILED` | Mật khẩu chưa đúng. Nhập lại mật khẩu đăng nhập của bạn. | That password isn't right. Re-enter your sign-in password. | ⟨chừa chỗ⟩ | 401 – R2 chỉ mật khẩu (BA E05-07). Bỏ {left}: API không trả số lần còn lại, và không nêu số lần (SR-AUTH-04). R3 thêm biến thể PIN |
| `error.DUPLICATE_GUEST` | SĐT/email này đã thuộc hồ sơ {guest}. Dùng hồ sơ đó? | This phone/email belongs to {guest}. Use that profile? | ⟨chừa chỗ⟩ | 409 + `existingGuestId` – BR-951 |
| `error.CARD_NUMBER_DETECTED` | Ô ghi chú có dãy số giống số thẻ thanh toán. Xóa dãy số đó – OTTIMO không lưu số thẻ. | The note contains what looks like a card number. Remove it – OTTIMO doesn't store card numbers. | В заметке есть цифры, похожие на номер карты. Удалите их – OTTIMO не хранит номера карт. | 422 – R-PAY-07 |
| `error.PAYMENT_NOT_CONFIGURED` | Chưa cài tài khoản nhận chuyển khoản nên chưa tạo được VietQR. Chọn cách thanh toán khác và báo chủ đầu tư cài đặt. | No receiving account is set up, so VietQR can't be created. Choose another method and ask the owner to set it up. | ⟨chừa chỗ⟩ | 409 – US-120 |
| `error.REGISTRATION_INCOMPLETE` | Khai báo chưa đủ: còn thiếu giấy tờ hoặc cảnh báo chưa ghi cách xử lý. | Registration incomplete: IDs missing or warnings without a note. | ⟨chừa chỗ⟩ | 409 – K5 |
| `error.GUEST_LINK_INVALID` | Liên kết đã hết hạn hoặc không còn dùng được. Nhắn OTTIMO để nhận liên kết mới. | This link has expired or is no longer valid. Message OTTIMO for a new one. | Срок действия ссылки истёк или она больше недействительна. Напишите OTTIMO, чтобы получить новую. | 401 – app khách; màn đầy đủ dùng `guest.link_expired_*` |
| `error.GUEST_VERIFICATION_REQUIRED` | Để xem mục này, xác minh bằng mã gửi qua email hoặc mã do lễ tân cấp. | To see this, verify with the code sent by email or given by reception. | ⟨chừa chỗ⟩ | 403 – mức 2 (SR-GST-07) |
| `error.DEVICE_NOT_TRUSTED` | Máy này chưa được cấp quyền xem giấy tờ và mã cửa. Dùng máy quầy đã cấp, hoặc nhờ chủ đầu tư cấp quyền cho máy này. | This device isn't approved for IDs and door codes. Use an approved desk computer, or ask the owner to approve this one. | ⟨chừa chỗ⟩ | 403 – SR-DEV-03; mã mới do SEC thêm, ARC cần bổ sung vào bảng mã openapi |
| `error.FILE_REJECTED` | Tệp này chưa dùng được. Chỉ nhận ảnh JPG, PNG hoặc WebP, tối đa 10 MB – chụp lại hoặc chọn ảnh khác. | This file can't be used. Only JPG, PNG or WebP photos up to 10 MB – retake or choose another photo. | Этот файл не подходит. Принимаются только фото JPG, PNG или WebP до 10 МБ – переснимите или выберите другое фото. | 422 – khớp OpenAPI 0.3 (không nhận PDF, HEIC; R2 sửa) |
| `error.RATE_LIMITED` | Bạn đã thử quá nhiều lần. Chờ {minutes} phút rồi thử lại. | Too many attempts. Wait {minutes} minutes and try again. | Слишком много попыток. Подождите {minutes} мин. и попробуйте снова. | 429 |
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
| `device.grant_confirm` | Nhập lại mật khẩu đăng nhập để cấp quyền | Re-enter your sign-in password to approve | ⟨chừa chỗ⟩ | R2 chỉ mật khẩu; R3 thêm mã xác thực (TOTP) |
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
| `guest.oci.uploading` | Đang gửi ảnh {n}/{total} – {pct}% | Sending photo {n}/{total} – {pct}% | Отправка фото {n}/{total} – {pct}% | Ảnh nén phía máy khách ≤ 1,5 MB trước khi gửi |
| `guest.oci.upload_weak` | Mạng yếu – ảnh đã được thu nhỏ và sẽ tự thử lại. | Weak connection – the photo was compressed and will retry automatically. | Слабое соединение – фото сжато, отправка повторится автоматически. |  |
| `guest.oci.upload_retry` | Gửi lại ảnh | Resend photo | Отправить фото снова |  |
| `guest.bill.line.room` | Tiền phòng {nights} đêm × {rate} | Room {nights} nights × {rate} | ⟨chừa chỗ⟩ |  |
| `guest.bill.line.minibar` | Minibar | Minibar | Мини-бар |  |
| `guest.bill.usd` | ≈ {usd} USD (tỷ giá ngày {date}, chỉ tham khảo) | ≈ {usd} USD (rate of {date}, for reference only) | ⟨chừa chỗ⟩ | BR-004 |
| `guest.req.decline.fully_booked` | Đã hết chỗ vào thời gian bạn chọn | Fully booked for the time you chose | ⟨chừa chỗ⟩ | CŨ – mã nháp EP14, không có trong enum declinedReasonCode 0.3.7; không dùng, xóa ở v0.5 (UXD s4) |
| `guest.req.decline.out_of_hours` | Ngoài giờ phục vụ | Outside service hours | ⟨chừa chỗ⟩ | CŨ – tên lệch mã hợp đồng (outside_service_hours). Lý do từ chối dùng guest.req.decline.outside_service_hours; khóa này chỉ còn cho unavailableReason tới khi FE/MOB đổi (FB-R2-UXD-FE-S4-16, MOB-S4-01); xóa ở v0.5 |
| `guest.req.decline.not_offered` | OTTIMO chưa có dịch vụ này | OTTIMO doesn't offer this yet | ⟨chừa chỗ⟩ | Không phải mã từ chối 0.3.7 – chỉ dùng cho GuestRequestOption.unavailableReason = not_offered |
| `guest.req.decline.other` | Lý do khác – xem lời nhắn của lễ tân | Other reason – see the front desk's message | Другая причина – см. сообщение администратора | declinedReasonCode = other (0.3.7) – replyNote bắt buộc khi other nên câu chỉ tới lời nhắn (UXD s4 sửa: bỏ 'lễ tân sẽ nhắn bạn', EN 'front desk' theo thuật ngữ) · RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt |
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
| `guest.contact.call` | Gọi người trực | Call night staff | Позвонить дежурному |  |
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
| `auth.login.username` | Tên đăng nhập | Username | ⟨chừa chỗ⟩ | Hợp đồng login dùng `username` (vd hanh.fd) – không phải SĐT/email (FE S1) |
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
| `error.REAUTH_REQUIRED` | Để tiếp tục, nhập lại mật khẩu đăng nhập của bạn. | To continue, re-enter your sign-in password. | ⟨chừa chỗ⟩ | 401 – step-up C3. R2 chỉ mật khẩu; R3 thêm PIN duyệt |
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
| `hk.task.extra_kit_items` | Mỗi bộ: 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân (không gối) | Each kit: 1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries (no pillow) | ⟨chừa chỗ⟩ | INV xác nhận 16/10 – BR-812; HkTaskType extra_guest_kit_prepare/collect/transfer (OpenAPI 0.3.1) |

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
| `lsm.flag` | HĐ ngoài hệ thống – sẽ chuyển vào app | Lease outside the app – to be moved into the app | ⟨chừa chỗ⟩ | 10-long-stay-manual.html; R2 S2: bỏ 'R3' (mã giai đoạn nội bộ) |
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
| `occ.adults_short` | Người lớn | Adults | Взрослые | 12-sales-quote.html |
| `occ.children` | Trẻ 6–11 tuổi | Children 6–11 | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.children_short` | Trẻ 6–11 | Kids 6–11 | Дети 6–11 | 12-sales-quote.html |
| `occ.fee_line` | Phụ thu {n} người vượt định mức × {nights} đêm (BR-110) | Extra-guest charge: {n} over standard × {nights} nights (BR-110) | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.kit_chip` | Vượt định mức {n} · chuẩn bị bộ đồ dùng thêm | {n} over standard · prepare extra amenity kit | ⟨chừa chỗ⟩ | 03-today.html |
| `occ.kit_reminder` | Vượt định mức {n} người – khách ngủ sofa. Nhớ chuẩn bị bộ đồ dùng thêm (1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – không gối); buồng phòng tự nhận việc khi lưu đơn. | {n} guest(s) over the standard occupancy – sleeping on the sofa. Remember to prepare an extra amenity kit (1 blanket, 1 bath towel, 1 face towel, toothbrush, toiletries – no pillow); housekeeping gets the task automatically when the booking is saved. | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6` | Trẻ dưới 6 tuổi | Children under 6 | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6_note` | Trẻ dưới 6 tuổi ngủ chung giường bố mẹ, không tính vào số này. | Children under 6 share their parents' bed and don't count towards this number. | ⟨chừa chỗ⟩ | 09-booking.html |
| `occ.under6_short` | Dưới 6 | Under 6 | До 6 лет | 12-sales-quote.html |
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
| `rack.conflict_title` | Đơn {channel} {code} ({guest}) chưa có căn | {channel} booking {code} ({guest}) has no room | ⟨chừa chỗ⟩ | 08-rack.html; R2 S2: {channel} = tên kênh từ listChannels (bỏ chữ Agoda cứng) |
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
| `rack.manual_legend` | = HĐ ngoài hệ thống | = lease outside the app | ⟨chừa chỗ⟩ | 08-rack.html; R2 S2: bỏ '(R2)' |
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
| `rsv.assign_lead` | {channel} gửi đơn nhóm {group}, {from} → {to} khi căn {room} đã kín. Chọn căn trống – gợi ý xếp theo ít tạo đêm lẻ nhất. | {channel} sent a {group} booking for {from} → {to} when room {room} was already booked. Pick a free room – suggestions are sorted by fewest orphan nights. | ⟨chừa chỗ⟩ | 11-reservation.html; R2 S2: {channel} thay chữ Agoda cứng |
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
This quote is valid until {expires}. | OTTIMO Boutique Stay – предложение {code}
Апартаменты {room} {room_name}, {from} → {to} (ночей: {nights}), {guests}.
Стоимость проживания: {room_total}{discount_note}.
Депозит для бронирования: {deposit}. Остальное оплачивается при заселении.
Предложение действительно до {expires}. | US-083 AC2 – getQuoteText; RU ở R3 (US-115) |
| `sale.quote_text_extra_guest` | Gồm phụ thu {n} người ngủ sofa: {amount}. | Includes extra-guest charge for {n} guest(s) on the sofa: {amount}. | Включена доплата за {n} гост. на диване: {amount}. | Dòng thêm khi vượt định mức (BR-110) |

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
| `ci.cond_balance` | Còn phải thu {amount} – thu ở bước 4, trước khi giao mã cửa. | {amount} still due – collect in step 4, before handing over the door code. | ⟨chừa chỗ⟩ | 13-check-in.html; {amount} kèm đơn vị (common.currency_vnd) – s3-UXD |
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
| `ci.effect_fee` | Phụ thu nhận sớm {amount} ghi vào folio (đã báo khách). | Early check-in surcharge of {amount} goes on the folio (guest informed). | ⟨chừa chỗ⟩ | 13-check-in.html; {amount} kèm đơn vị – s3-UXD |
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
| `ci.time_default_help` | Giờ nhận thực tế ghi theo lúc bấm "Nhận phòng". Khách nhận sớm thì bật "Khách nhận sớm" ở trên. | The actual check-in time is recorded when you tap "Check in". If the guest arrives early, turn on "Guest checks in early" above. | ⟨chừa chỗ⟩ | 13-check-in.html |
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
| `co.change_due` | Thối lại {amount} | Change due: {amount} | ⟨chừa chỗ⟩ | 16-check-out.html; {amount} kèm đơn vị – s3-UXD |
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
| `co.late_switch_hint` | Khách trả sau 12:00 mà chưa hẹn: dùng "Trả muộn" ở khung chi tiết đơn để tính và báo khách trước. | Guest leaving after 12:00 without an agreed time: use "Late check-out" in the booking details to calculate and tell them first. | ⟨chừa chỗ⟩ | 16-check-out.html. CŨ – giờ viết cứng; FE đổi sang co.late_switch_hint_time (S4-48) rồi UXD xóa key này |
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
| `guest.oci.closed_desk` | Lễ tân đã nhận giấy tờ của bạn | Reception already has your IDs | Администратор уже получил ваши документы | 18-guest-checkin.html |
| `guest.oci.companions_at_desk` | Người đi cùng tự trả lời câu này tại quầy. | Other guests answer this question themselves at reception. | Остальные гости ответят на этот вопрос сами на стойке. | 18-guest-checkin.html |
| `guest.oci.withdraw_hint` | Muốn rút đồng ý lưu ảnh? Báo lễ tân – ảnh sẽ được xóa. | Want to withdraw consent to keep photos? Tell reception – the photos will be deleted. | Хотите отозвать согласие на хранение фото? Сообщите администратору – фото будут удалены. | 18-guest-checkin.html |
| `gw.back_home` | Về trang lưu trú | Back to my stay | Вернуться к проживанию | 18-guest-checkin.html |
| `gw.cap_consent` | 3 · Đồng ý Có/Không – nút Gửi mở khi đã chọn | 3 · Consent Yes/No – Send unlocks once chosen | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_docs` | 1 · Giấy tờ từng người (đổi trạng thái để xem gửi / lỗi / mất mạng) | 1 · IDs per guest (switch state to see uploading / error / offline) | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_done` | Hoàn tất – bản R2 không hứa mã cửa trên trang | Done – the R2 version doesn't promise a door code on the page | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_eta` | 2 · Giờ đến dự kiến | 2 · Expected arrival time | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_home` | Trang lưu trú – 3 tab, không có Hóa đơn ở R2. | Stay page – 3 tabs, no Bill tab in R2. | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.cap_notice` | 0 · Thông báo xử lý dữ liệu | 0 · Data processing notice | ⟨chừa chỗ⟩ | 18-guest-checkin.html |
| `gw.checkin` | Nhận phòng | Check-in | Заезд | 18-guest-checkin.html |
| `gw.checkout` | Trả phòng | Check-out | Выезд | 18-guest-checkin.html |
| `gw.closed_body` | Bạn không cần gửi gì thêm. Cần hỗ trợ, nhắn hoặc gọi lễ tân. | You don't need to send anything else. Need help? Message or call reception. | Больше ничего отправлять не нужно. Нужна помощь? Напишите или позвоните администратору. | 18-guest-checkin.html |
| `gw.directions` | Chỉ đường | Directions | Как добраться | 18-guest-checkin.html |
| `gw.docs_have` | Đã có giấy tờ của {n}/{m} khách | IDs received for {n}/{m} guests | Документы получены: {n}/{m} гостей | 18-guest-checkin.html |
| `gw.docs_none` | Chưa có giấy tờ nào – bắt đầu với Khách 1 ({m} khách trong đơn). | No IDs yet – start with Guest 1 ({m} guests on the booking). | Документов пока нет – начните с гостя 1 (гостей в бронировании: {m}). | 18-guest-checkin.html |
| `gw.done_desk_check` | Tại quầy, lễ tân xem giấy tờ gốc vài phút để đối chiếu. | At reception, staff will take a few minutes to check your original documents. | На стойке администратор за несколько минут сверит оригиналы документов. | 18-guest-checkin.html |
| `gw.door_at_desk` | Lễ tân giao mã cửa khi bạn đến. Đến sau 22:00? Gọi người trực khi tới nơi. | Reception gives you your door code when you arrive. Arriving after 22:00? Call the night staff when you get here. | Код от двери выдаст администратор при заезде. Приезжаете после 22:00? Позвоните дежурному по прибытии. | 18-guest-checkin.html |
| `gw.door_at_desk_title` | Mã cửa | Door code | Код от двери | 18-guest-checkin.html |
| `gw.ended_body` | Kỳ lưu trú đã kết thúc. Cần phiếu thanh toán hay hỗ trợ? Nhắn OTTIMO qua Zalo/WhatsApp. | Your stay has ended. Need your folio or help? Message OTTIMO on Zalo/WhatsApp. | Ваше проживание завершено. Нужен итоговый расчёт или помощь? Напишите OTTIMO в Zalo/WhatsApp. | 18-guest-checkin.html |
| `gw.house_rules` | Nội quy và phí phạt | House rules and fees | Правила проживания и штрафы | 18-guest-checkin.html |
| `gw.late_r2` | Đến sau 22:00: người trực đêm sẽ làm thủ tục và giao mã cửa khi bạn tới – gọi số trên trang này khi đến nơi. | Arriving after 22:00: the night staff will check you in and give you the door code when you arrive – call the number on this page when you get here. | Приезд после 22:00: дежурный оформит заезд и выдаст код от двери на месте – позвоните по номеру на этой странице, когда приедете. | 18-guest-checkin.html |
| `gw.link_reissue_title` | Cấp link mới cho đơn {code}? Link cũ ngừng hoạt động ngay. | Issue a new link for booking {code}? The old link stops working immediately. | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.link_revoke_title` | Thu hồi link của đơn {code}? Khách mở link sẽ thấy "Liên kết đã hết hạn". | Revoke the link for booking {code}? Guests opening it will see "Link expired". | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.notice_body` | OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Bạn sẽ được hỏi riêng có muốn cho lưu ảnh sau khi khai báo hay không. | OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. You'll be asked separately whether we may keep the photos after registration. | OTTIMO использует данные ваших документов, чтобы зарегистрировать проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их видят только администраторы и управляющие. Отдельно мы спросим, можно ли хранить фото после регистрации. | 18-guest-checkin.html |
| `gw.notice_read` | Tôi đã đọc | I've read this | Я прочитал(а) | 18-guest-checkin.html |
| `gw.notice_title` | Trước khi bắt đầu | Before you start | Перед началом | 18-guest-checkin.html |
| `gw.notice_version` | Phiên bản thông báo: {v} | Notice version: {v} | Версия уведомления: {v} | 18-guest-checkin.html |
| `gw.offline_upload` | Mất kết nối – ảnh chưa gửi sẽ không được giữ lại trên máy. Khi có mạng, chụp lại để gửi. | You're offline – unsent photos aren't kept on this device. When you're back online, take them again to send. | Нет подключения – неотправленные фото не сохраняются на устройстве. Когда связь появится, сфотографируйте их снова. | 18-guest-checkin.html |
| `gw.photo_tips` | Đặt giấy tờ trên nền tối, đủ sáng, thấy đủ 4 góc, không lóa. | Place the ID on a dark surface in good light, all 4 corners visible, no glare. | Положите документ на тёмную поверхность при хорошем освещении: видны все 4 угла, без бликов. | 18-guest-checkin.html |
| `gw.prechecked_notice` | Khách {code} đã làm thủ tục trước – đến lúc {eta} | Guest {code} checked in online – arriving at {eta} | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `gw.resend` | Gửi lại | Send again | Отправить снова | 18-guest-checkin.html |
| `gw.room` | Căn | Room | Апартаменты | 18-guest-checkin.html |
| `gw.saved_progress` | Tiến trình đã lưu – mở lại link để làm tiếp. | Progress saved – open the link again to continue. | Прогресс сохранён – откройте ссылку снова, чтобы продолжить. | 18-guest-checkin.html |
| `gw.sent_hidden` | Đã gửi – vì an toàn, ảnh không hiện lại ở đây. | Sent – for your safety, the photo isn't shown again here. | Отправлено – в целях безопасности фото здесь больше не показывается. | 18-guest-checkin.html |
| `gw.take_photo` | Chụp | Take photo | Сфотографировать | 18-guest-checkin.html |
| `gw.take_photo_again` | Chụp lại bằng nút Chụp | Retake with the Take photo button | Переснимите кнопкой «Сфотографировать» | 18-guest-checkin.html |
| `gw.wifi_later` | Hiện ở đây vào ngày nhận phòng ({date}). | Shown here on your arrival day ({date}). | Появится здесь в день заезда ({date}). | 18-guest-checkin.html |
| `late.grace_off` | Căn có khách đến hôm nay – không áp ân hạn 12:30. | A guest is arriving in this room today – the 12:30 grace period doesn't apply. | ⟨chừa chỗ⟩ | 15-stay.html |
| `late.std_zero` | Trả trước 12:00 – không phụ thu | Leaving by 12:00 – no surcharge | ⟨chừa chỗ⟩ | BA spec / hifi.js |
| `mlog.a_adjusted` | Điều chỉnh dòng folio (đảo + dòng mới) | Folio line adjusted (reversal + new line) | ⟨chừa chỗ⟩ | folio_line.adjusted – 17-approvals-moneylog.html (s3-UXD: bỏ ví dụ 'giặt ủi' khỏi chuỗi) |
| `mlog.a_foc_approved` | Duyệt miễn phí | Waiver approved | ⟨chừa chỗ⟩ | 17-approvals-moneylog.html |
| `mlog.a_line_added` | Thêm dòng folio | Folio line added | ⟨chừa chỗ⟩ | folio.line_posted – 17-approvals-moneylog.html (s3-UXD: bỏ ví dụ khỏi chuỗi; mô tả dòng là dữ liệu) |
| `mlog.a_payment` | Ghi nhận thu tiền | Payment recorded | ⟨chừa chỗ⟩ | payment.recorded – cách thu là dữ liệu (pay.*), chip 'Chờ đối soát' riêng – s3-UXD |
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
| `reg2.consent_q` | Khách có đồng ý lưu ảnh giấy tờ {days} ngày sau trả phòng không? | Does the guest agree to OTTIMO keeping ID photos for {days} days after check-out? | ⟨chừa chỗ⟩ | 14-registration.html; {days} ← Registration.consentNotice.imageRetentionDays (17/10 – bỏ số 30 viết cứng) |
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
| `reg2.retention_value` | Tự xóa {days} ngày sau trả phòng ({date}) | Auto-deleted {days} days after check-out ({date}) | ⟨chừa chỗ⟩ | 14-registration.html; {days} ← Registration.consentNotice.imageRetentionDays (17/10 – bỏ số 30 viết cứng) |
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

#### R2 Sprint 1 – admin-web EP00 (chuyển từ packages/i18n pending, FE S1)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `field_error.too_long` | Tối đa {max} ký tự. | Up to {max} characters. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.name_invalid` | Họ tên chỉ gồm chữ cái, dấu cách, dấu gạch ngang. | Names may contain letters, spaces and hyphens only. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.phone_country` | Số nước ngoài cần bắt đầu bằng + và mã nước, ví dụ +7 912 345 6789. | Foreign numbers start with + and the country code, e.g. +7 912 345 6789. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.email_invalid` | Email chưa đúng dạng, ví dụ ten@gmail.com. | Check the email format, e.g. name@gmail.com. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.reason_required` | Ghi lý do (ít nhất 3 ký tự). | Add a reason (at least 3 characters). | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.password_short` | Mật khẩu cần ít nhất {min} ký tự. | Password needs at least {min} characters. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.password_reused` | Mật khẩu mới phải khác mật khẩu cũ và tên đăng nhập. | New password must differ from the old one and the username. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.current_password_wrong` | Mật khẩu hiện tại chưa đúng. | That's not your current password. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.not_in_list` | Chọn một giá trị trong danh sách. | Choose a value from the list. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.contact_required` | Cần ít nhất SĐT hoặc email. | Add at least a phone number or an email. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.contact_channel_empty` | Nhập {channel} trước khi chọn làm liên hệ ưu tiên. | Enter {channel} before choosing it as preferred contact. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.duplicate` | {value} đã có trong danh sách. | {value} is already in the list. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.checklist_required` | Kiểm đủ checklist trước khi cấp quyền. | Complete the checklist before granting access. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.possible_duplicate_other` | SĐT/email này đã có hồ sơ. Nhờ lễ tân kiểm tra trước khi tạo. | This phone/email already has a profile. Ask the front desk to check before creating one. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.value_out_of_range` | Giá trị phải từ {min} đến {max}. | Value must be between {min} and {max}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `field_error.amount_not_positive` | Nhập số tiền lớn hơn 0. | Enter an amount greater than 0. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `error.PARAM_OUT_OF_RANGE_MINMAX` | Giá trị phải từ {min} đến {max}. | Value must be between {min} and {max}. | ⟨chừa chỗ⟩ | Biến thể có min/max của PARAM_OUT_OF_RANGE (H05) |
| `auth.current_password` | Mật khẩu hiện tại | Current password | ⟨chừa chỗ⟩ | Dùng cả khi đổi MK tạm và đổi MK từ menu – không ghi '(mật khẩu tạm)' |
| `auth.mfa_later` | Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập. | Two-step sign-in comes in a later release. Ask the owner for help signing in. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.coming_title` | Màn này đang được làm | This screen is being built | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.coming_body` | Màn {screen} có ở đợt sau của bản thử. Các màn khác vẫn dùng được. | {screen} comes in a later trial build. Other screens work as usual. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.theme` | Giao diện | Appearance | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.theme_auto` | Theo máy | System | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.theme_light` | Sáng | Light | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.theme_dark` | Tối | Dark | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `shell.skip` | Bỏ qua tới nội dung | Skip to content | Перейти к содержимому | FE S1 pending → UXD duyệt |
| `shell.user_menu` | Tài khoản | Account | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.grp_security` | Bảo mật | Security | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.grp_other` | Khác | Other | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.saved` | Đã lưu {name}, hiệu lực từ {date}. | Saved {name}, effective {date}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `rooms.saved` | Đã lưu căn {room}. | Saved unit {room}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `rooms.view_only` | Bạn đang xem danh mục căn. Chỉ chủ đầu tư và quản lý sửa được. | You are viewing the unit list. Only the owner and managers can edit. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `rooms.below_item` | {code} · {from} → {to} · {n} khách | {code} · {from} → {to} · {n} guests | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.prompt_title` | Tìm khách để bắt đầu | Search for a guest to start | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.prompt_body` | Gõ ít nhất 2 ký tự của tên, mã KH hoặc SĐT/email. | Type at least 2 characters of the name, guest code or phone/email. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.saved` | Đã lưu hồ sơ {code}. | Saved profile {code}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.edit_title` | Hồ sơ {code} | Profile {code} | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.gender` | Giới tính | Gender | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.gender_male` | Nam | Male | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.gender_female` | Nữ | Female | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.gender_other` | Khác | Other | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.zalo` | Zalo | Zalo | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `crm.note_hint` | Không ghi số giấy tờ, số thẻ, thông tin sức khỏe. | Do not write ID numbers, card numbers or health information. | ⟨chừa chỗ⟩ | SEC – không ghi dữ liệu nhạy cảm vào ghi chú |
| `users.status_locked` | Tạm khóa do sai mật khẩu | Locked after wrong passwords | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.roles_confirm_title` | Đổi vai của {name}? | Change roles of {name}? | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.roles_confirm_body` | Người này sẽ bị đăng xuất ngay trên mọi máy. | They will be signed out on every device right away. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.roles_min` | Chọn ít nhất 1 vai | Choose at least 1 role | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.reset_pw` | Đặt lại mật khẩu | Reset password | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.reset_pw_title` | Đặt lại mật khẩu cho {name}? | Reset password for {name}? | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.reset_pw_body` | Người này bị đăng xuất trên mọi máy và phải đổi mật khẩu tạm ở lần đăng nhập tới. | They are signed out everywhere and must change the temporary password at next sign-in. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.temp_pw_title` | Mật khẩu tạm của {name} | Temporary password for {name} | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.temp_pw_once` | Chỉ hiện một lần. Đưa trực tiếp cho người dùng, không gửi qua chat. | Shown only once. Hand it over in person; don't send it by chat. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.lock` | Khóa tài khoản | Lock account | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.lock_title` | Khóa tài khoản của {name}? | Lock the account of {name}? | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.lock_body` | Người này bị đăng xuất ngay trên mọi máy và không đăng nhập được tới khi mở khóa. | They are signed out on every device and cannot sign in until unlocked. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.saved` | Đã lưu thay đổi cho {name}. | Saved changes for {name}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `users.never` | Chưa đăng nhập | Never signed in | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.status_active` | Còn hạn | Active | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.status_expired` | Hết hạn | Expired | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.status_revoked` | Đã thu hồi | Revoked | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.revoke_reason` | Lý do (không bắt buộc) | Reason (optional) | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.granted` | Đã cấp quyền cho {device}. | Access granted to {device}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.revoked` | Đã thu hồi {device}. | Revoked {device}. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.empty` | Chưa có thiết bị nào được cấp quyền. | No device has been granted access yet. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.this_trusted` | Máy này đã được cấp quyền. | This device has access. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `device.error_title` | Chưa tải được danh sách thiết bị | Couldn't load devices | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.unit_days` | ngày | days | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.unit_minutes` | phút | minutes | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.unit_age` | tuổi | years | ⟨chừa chỗ⟩ | Đơn vị tham số tuổi trẻ em |
| `params.value_json` | Giá trị (JSON) | Value (JSON) | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |
| `params.history_empty` | Chưa có thay đổi nào. | No changes yet. | ⟨chừa chỗ⟩ | FE S1 pending → UXD duyệt |

#### R2 Sprint 1 – review FE: nhãn tham số H05 + lỗi mạng

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `params.k.hold_hours_options` | Các mức giữ chỗ cho chọn | Hold duration options | ⟨chừa chỗ⟩ | Khóa API hold_hours_options |
| `params.k.hold_expiry_reminder_hours` | Nhắc trước khi hết hạn giữ chỗ | Reminder before a hold expires | ⟨chừa chỗ⟩ | Khóa API hold_expiry_reminder_hours |
| `params.k.hold_extension_max_hours` | Gia hạn giữ chỗ tối đa | Maximum hold extension | ⟨chừa chỗ⟩ | Khóa API hold_extension_max_hours |
| `params.k.adult_from_age` | Tính là người lớn từ | Counted as an adult from | ⟨chừa chỗ⟩ | Khóa API adult_from_age |
| `params.k.checkin_time` | Giờ nhận phòng chuẩn | Standard check-in time | ⟨chừa chỗ⟩ | Khóa API checkin_time |
| `params.k.checkout_time` | Giờ trả phòng chuẩn | Standard check-out time | ⟨chừa chỗ⟩ | Khóa API checkout_time |
| `params.k.late_grace_until` | Ân hạn trả muộn tới | Late check-out grace until | ⟨chừa chỗ⟩ | Khóa API late_grace_until |
| `params.k.no_show_call_time` | Giờ gọi khách chưa đến | Time to call guests not yet arrived | ⟨chừa chỗ⟩ | Khóa API no_show_call_time |
| `params.k.no_show_mark_time` | Giờ được đánh dấu không đến | Time a no-show can be marked | ⟨chừa chỗ⟩ | Khóa API no_show_mark_time |
| `params.k.foc_self_apply_front_desk_per_time` | Lễ tân tự áp miễn phí (FOC) – mỗi lần | Front desk complimentary limit – per time | ⟨chừa chỗ⟩ | Khóa API foc_self_apply_front_desk_per_time – FE map trong paramCatalog; Desk viết 'miễn phí (FOC)' theo thuật ngữ mục 3 |
| `params.k.foc_self_apply_front_desk_per_month` | Lễ tân tự áp miễn phí (FOC) – mỗi tháng | Front desk complimentary limit – per month | ⟨chừa chỗ⟩ | Khóa API foc_self_apply_front_desk_per_month – FE map trong paramCatalog; Desk viết 'miễn phí (FOC)' theo thuật ngữ mục 3 |
| `params.k.foc_limits` | Hạn mức duyệt miễn phí (FOC) theo vai | Complimentary approval limits by role | ⟨chừa chỗ⟩ | Khóa API foc_limits – FE map trong paramCatalog; Desk viết 'miễn phí (FOC)' theo thuật ngữ mục 3 |
| `params.k.foc_alert_pct_of_room_revenue` | Cảnh báo khi miễn phí (FOC) vượt % doanh thu phòng | Alert when complimentary exceeds (% of room revenue) | ⟨chừa chỗ⟩ | Khóa API foc_alert_pct_of_room_revenue – FE map trong paramCatalog; Desk viết 'miễn phí (FOC)' theo thuật ngữ mục 3 |
| `params.k.short_stay_commission_pct` | Hoa hồng sale/CTV – khách ngắn ngày | Sales/agent commission – short stays | ⟨chừa chỗ⟩ | Khóa API short_stay_commission_pct |
| `params.k.vat_rate` | Thuế suất VAT | VAT rate | ⟨chừa chỗ⟩ | Khóa API vat_rate |
| `params.k.trusted_device_days` | Hạn cấp quyền máy quầy/laptop | Approval period – desk computer/laptop | ⟨chừa chỗ⟩ | Khóa API trusted_device_days |
| `params.k.trusted_device_mobile_days` | Hạn cấp quyền máy tính bảng | Approval period – tablet | ⟨chừa chỗ⟩ | Khóa API trusted_device_mobile_days |
| `params.k.c3_stepup_minutes` | Thời gian xem giấy tờ sau khi nhập lại mật khẩu | ID viewing time after re-entering password | ⟨chừa chỗ⟩ | Khóa API c3_stepup_minutes |
| `params.k.guest_verify_max_attempts` | Số lần khách nhập sai mã tối đa | Maximum wrong code attempts by a guest | ⟨chừa chỗ⟩ | Khóa API guest_verify_max_attempts |
| `params.k.guest_level2_idle_minutes` | Khách tự thoát sau thời gian không dùng | Guest signed out after inactivity | ⟨chừa chỗ⟩ | Khóa API guest_level2_idle_minutes |
| `params.k.guest_link_grace_hours` | Link khách còn mở được sau khi trả phòng | Guest link stays open after check-out | ⟨chừa chỗ⟩ | Khóa API guest_link_grace_hours |
| `params.k.guest_verify_code_channel_minutes` | Hạn mã gửi qua kênh nhắn tin | Validity of codes sent by message | ⟨chừa chỗ⟩ | Khóa API guest_verify_code_channel_minutes |
| `params.k.guest_verify_code_channels` | Kênh được gửi mã cho khách | Channels allowed to send guest codes | ⟨chừa chỗ⟩ | Khóa API guest_verify_code_channels |
| `params.k.channel_commission_pct` | Phí kênh {channel} | {channel} channel fee | ⟨chừa chỗ⟩ | Khóa API channel_commission_pct.<kênh> |
| `shell.main_nav` | Menu chính | Main menu | ⟨chừa chỗ⟩ | aria-label của thanh menu trái (H02) |
| `login.hide_password` | Ẩn | Hide | ⟨chừa chỗ⟩ | Nút hiện/ẩn mật khẩu đổi chữ theo trạng thái (H01) |
| `common.vnd_unit` | đ | VND | ⟨chừa chỗ⟩ | Hậu tố ô nhập tiền (input-affix) – H04, H05 |
| `common.error_network_body` | Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Thử lại. Dữ liệu của bạn không bị mất. | Couldn't reach the server. Check the connection, then tap Try again. Nothing has been lost. | ⟨chừa chỗ⟩ | Dùng khi lỗi mạng (không có requestId) – thay common.error_generic_body với '—' |

#### R2 hi-fi Sprint 4 – PWA buồng phòng (H19–H21)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.updated_at` | Hôm nay {date} · cập nhật {time} | Today {date} · updated {time} | ⟨chừa chỗ⟩ |  |
| `hk.progress` | {done}/{total} xong | {done}/{total} done | ⟨chừa chỗ⟩ |  |
| `hk.offline_bar` | Mất mạng. Bấm vẫn được – thao tác sẽ tự gửi khi có mạng. | You're offline. You can keep tapping – changes send by themselves when you're back online. | ⟨chừa chỗ⟩ |  |
| `hk.queue_pill` | {n} thao tác đang chờ gửi | {n} changes waiting to send | ⟨chừa chỗ⟩ |  |
| `hk.need_network` | Cần có mạng | Needs a connection | ⟨chừa chỗ⟩ | Nút khóa cho thao tác không xếp hàng offline (ADR-005) |
| `hk.grp.first` | Làm trước – có khách đến hôm nay | Do first – guests arriving today | ⟨chừa chỗ⟩ |  |
| `hk.grp.stay` | Khách đang ở | Guests staying | ⟨chừa chỗ⟩ |  |
| `hk.grp.later` | Sau khi khách trả phòng | After check-out | ⟨chừa chỗ⟩ |  |
| `hk.grp.done` | Đã xong ({n}) | Done ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.type.checkout_clean` | Dọn trả phòng | Check-out clean | ⟨chừa chỗ⟩ | HkTaskType checkout_clean |
| `hk.type.stayover_clean` | Dọn phòng khách đang ở | Stay-over clean | ⟨chừa chỗ⟩ | stayover_clean |
| `hk.type.long_stay_clean` | Dọn theo gói dài hạn | Long-stay scheduled clean | ⟨chừa chỗ⟩ | long_stay_clean |
| `hk.type.after_repair_clean` | Dọn sau sửa chữa | Clean after repair | ⟨chừa chỗ⟩ | after_repair_clean |
| `hk.type.adhoc_clean` | Dọn phòng thêm (khách yêu cầu) | Extra clean (guest request) | ⟨chừa chỗ⟩ | adhoc_clean – BR-506 |
| `hk.type.priority_clean` | Dọn gấp – khách vào khi đang dọn | Priority clean – guest checking in | ⟨chừa chỗ⟩ | priority_clean – BR-803 ngoại lệ |
| `hk.type.minibar_refill` | Bổ sung minibar | Minibar refill | ⟨chừa chỗ⟩ |  |
| `hk.type.guest_request` | Yêu cầu của khách | Guest request | ⟨chừa chỗ⟩ |  |
| `hk.source.guest_app` | App khách | Guest app | ⟨chừa chỗ⟩ |  |
| `hk.arriving_tomorrow` | Có khách đến ngày mai | Guest arriving tomorrow | ⟨chừa chỗ⟩ |  |
| `hk.departing_today` | Khách đi hôm nay – trả phòng trước {time} | Guest leaves today – check-out by {time} | ⟨chừa chỗ⟩ |  |
| `hk.next_arrival` | Khách đến tiếp: {when} | Next arrival: {when} | ⟨chừa chỗ⟩ |  |
| `hk.no_task_today` | Không có việc hôm nay | No tasks today | ⟨chừa chỗ⟩ |  |
| `hk.reopen` | Mở bán lại {date} | Back on sale {date} | ⟨chừa chỗ⟩ |  |
| `hk.window` | Khung giờ hẹn {from}–{to} | Agreed time {from}–{to} | ⟨chừa chỗ⟩ |  |
| `hk.linen_change` | Thay ga gối | Change bed linen | ⟨chừa chỗ⟩ |  |
| `hk.req_note` | Khách nhắn: "{note}" | Guest wrote: "{note}" | ⟨chừa chỗ⟩ | Ghi chú khách hiện nguyên văn (D23) |
| `hk.refill` | Bổ sung minibar: {items} | Restock minibar: {items} | ⟨chừa chỗ⟩ |  |
| `hk.wait_checkout` | Chờ khách trả phòng | Waiting for check-out | ⟨chừa chỗ⟩ |  |
| `hk.done_at` | Xong lúc {time} | Done at {time} | ⟨chừa chỗ⟩ |  |
| `hk.action.start_cleaning` | Bắt đầu dọn | Start cleaning | ⟨chừa chỗ⟩ | event start_cleaning (R1) |
| `hk.action.finish_cleaning` | Dọn xong | Finished cleaning | ⟨chừa chỗ⟩ | event finish_cleaning (R2/R3) |
| `hk.empty_title` | Hết việc rồi! | All done! | ⟨chừa chỗ⟩ |  |
| `hk.empty_body` | Không còn việc nào hôm nay. Có việc mới sẽ hiện ở đây. | No more tasks today. New ones will appear here. | ⟨chừa chỗ⟩ |  |
| `hk.error_title` | Chưa tải được việc hôm nay | Couldn't load today's tasks | ⟨chừa chỗ⟩ |  |
| `hk.error_body` | Có thể do mạng yếu. Việc bạn đã bấm không bị mất. Bấm Thử lại; vẫn lỗi thì gọi lễ tân. | The connection may be weak. Nothing you tapped is lost. Tap Try again; if it still fails, call the front desk. | ⟨chừa chỗ⟩ |  |
| `hk.call_desk` | Gọi lễ tân | Call the front desk | ⟨chừa chỗ⟩ |  |
| `hk.ref` | Mã tham chiếu: {id} | Reference: {id} | ⟨chừa chỗ⟩ |  |
| `hk.filter_label` | Lọc căn | Filter rooms | ⟨chừa chỗ⟩ |  |
| `hk.filter.all` | Tất cả ({n}) | All ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.filter.dirty` | Cần dọn ({n}) | To clean ({n}) | ⟨chừa chỗ⟩ | VD, OD, CL – US-052 AC2 |
| `hk.filter.occupied` | Có khách ({n}) | Occupied ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.filter.ready` | Sạch ({n}) | Clean ({n}) | ⟨chừa chỗ⟩ | VC, VI, OC |
| `hk.filter.ooo` | Đang sửa ({n}) | Under repair ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.filter.show_all` | Xem tất cả | Show all | ⟨chừa chỗ⟩ |  |
| `hk.filter_empty_title` | Không có căn nào ở nhóm này | No rooms in this group | ⟨chừa chỗ⟩ |  |
| `hk.filter_empty_body` | Chọn "Tất cả" để xem lại {n} căn. | Choose "All" to see all {n} rooms. | ⟨chừa chỗ⟩ |  |
| `hk.rooms_error_title` | Chưa tải được trạng thái các căn | Couldn't load room status | ⟨chừa chỗ⟩ |  |
| `hk.kit.prepared` | Đã chuẩn bị | Prepared | ⟨chừa chỗ⟩ | BR-812 – transitionHkTask done |
| `hk.kit.prepared_toast` | Căn {room}: đã chuẩn bị bộ đồ dùng thêm | Room {room}: extra-guest kit prepared | ⟨chừa chỗ⟩ |  |
| `hk.kit.collect` | Thu hồi {n} bộ đồ dùng thêm – căn {room} | Collect {n} extra-guest kit(s) – room {room} | ⟨chừa chỗ⟩ | extra_guest_kit_collect |
| `hk.kit.collect_how` | Mền và khăn đưa đi giặt; bàn chải, đồ vệ sinh đã mở thì bỏ. | Send the blanket and towels to the laundry; throw away opened toothbrush and toiletries. | ⟨chừa chỗ⟩ |  |
| `hk.kit.collect_reason` | Đơn đã giảm số người | The booking now has fewer guests | ⟨chừa chỗ⟩ |  |
| `hk.kit.collect_in_checkout` | Thu hồi bộ đồ dùng thêm | Collect the extra-guest kit | ⟨chừa chỗ⟩ | Dòng trong thẻ dọn trả phòng – BR-812 (6) |
| `hk.kit.collected` | Đã thu hồi | Collected | ⟨chừa chỗ⟩ |  |
| `hk.kit.transfer` | Chuyển {n} bộ đồ dùng thêm từ căn {from} sang căn {to} | Move {n} extra-guest kit(s) from room {from} to room {to} | ⟨chừa chỗ⟩ | extra_guest_kit_transfer (đổi phòng B14) |
| `hk.kit.transfer_due` | Trước {time} | By {time} | ⟨chừa chỗ⟩ |  |
| `hk.kit.transferred` | Đã chuyển | Moved | ⟨chừa chỗ⟩ |  |
| `hk.kit.due_in` | Còn {m} phút | {m} min left | ⟨chừa chỗ⟩ |  |
| `hk.kit.not_ready_title` | Bộ đồ dùng thêm chưa chuẩn bị | Extra-guest kit not ready yet | ⟨chừa chỗ⟩ |  |
| `hk.kit.not_ready_body` | Lễ tân vẫn nhận phòng được nhưng sẽ thấy cảnh báo. Việc này đã lên đầu danh sách. | The front desk can still check the guest in but will see a warning. This task is now at the top of your list. | ⟨chừa chỗ⟩ |  |
| `hk.room_title` | Căn {room} | Room {room} | ⟨chừa chỗ⟩ |  |
| `hk.step.bath` | Vệ sinh nhà tắm, thay khăn | Clean the bathroom, change towels | ⟨chừa chỗ⟩ |  |
| `hk.step.kitchen` | Lau bếp, đổ rác, kiểm tủ lạnh | Wipe the kitchen, empty bins, check the fridge | ⟨chừa chỗ⟩ |  |
| `hk.step.amenity` | Bổ sung đồ dùng, nước suối | Restock amenities and bottled water | ⟨chừa chỗ⟩ |  |
| `hk.started_at` | Bắt đầu lúc {time} | Started at {time} | ⟨chừa chỗ⟩ |  |
| `hk.finish_help_vacant` | Bấm Dọn xong khi đã làm hết. Căn sẽ chuyển "Đã dọn – chờ kiểm" và lễ tân trưởng được báo đi kiểm. | Tap Finished cleaning when everything is done. The room becomes "Cleaned – awaiting inspection" and the front desk lead is asked to inspect. | ⟨chừa chỗ⟩ |  |
| `hk.finish_help_occupied` | Bấm Dọn xong khi đã làm hết. Căn chuyển "Khách đang ở – đã dọn". | Tap Finished cleaning when everything is done. The room becomes "Guest staying – cleaned". | ⟨chừa chỗ⟩ |  |
| `hk.report_this_room` | Báo sự cố căn này | Report a problem in this room | ⟨chừa chỗ⟩ |  |
| `hk.room_no_task_title` | Căn này không có việc hôm nay | No tasks for this room today | ⟨chừa chỗ⟩ |  |
| `hk.room_no_task_body` | Lễ tân giao việc mới thì sẽ hiện ở đây. | New tasks from the front desk will appear here. | ⟨chừa chỗ⟩ |  |
| `hk.err.transition_title` | Căn {room} vừa được đổi ở chỗ khác | Room {room} was just changed by someone else | ⟨chừa chỗ⟩ |  |
| `hk.err.invalid_transition` | Căn {room} hiện là "{status}", nên chưa bấm Dọn xong được. Không cần làm lại – xem lại danh sách việc. | Room {room} is now "{status}", so it can't be marked Finished cleaning. No need to redo anything – check your task list. | ⟨chừa chỗ⟩ | 409 INVALID_TRANSITION ở PWA (status = hk.status.* hiện tại) |
| `hk.back_to_tasks` | Về danh sách việc | Back to my tasks | ⟨chừa chỗ⟩ |  |
| `hk.toast.room_status` | Căn {room}: {status} | Room {room}: {status} | ⟨chừa chỗ⟩ |  |
| `hk.undo_btn` | Hoàn tác ({s}) | Undo ({s}) | ⟨chừa chỗ⟩ | Đếm lùi 10 giây – lệnh gửi trễ (DS 6.18) |
| `hk.undone` | Đã hoàn tác | Undone | ⟨chừa chỗ⟩ |  |
| `hk.undone_room` | Đã hoàn tác – căn {room} vẫn là "{status}" | Undone – room {room} is still "{status}" | ⟨chừa chỗ⟩ |  |
| `hk.sent_after_undo` | Đã gửi thao tác | Change sent | ⟨chừa chỗ⟩ |  |
| `hk.queued_toast` | Đã lưu trên máy – sẽ tự gửi khi có mạng | Saved on this phone – it will send when you're back online | ⟨chừa chỗ⟩ |  |
| `hk.done_wait_inspect_note` | Dọn xong lúc {time} · đã báo lễ tân trưởng kiểm phòng | Cleaned at {time} · front desk lead asked to inspect | ⟨chừa chỗ⟩ |  |
| `hk.insp.title` | Kiểm phòng {room} | Inspect room {room} | ⟨chừa chỗ⟩ |  |
| `hk.insp.progress` | Đã kiểm {n}/{total} mục | {n}/{total} items checked | ⟨chừa chỗ⟩ |  |
| `hk.insp.legend` | Đánh dấu khi đạt chuẩn OTTIMO | Tick each item that meets the OTTIMO standard | ⟨chừa chỗ⟩ |  |
| `hk.insp.i01` | Ga gối phẳng, sạch | Bed linen smooth and clean | ⟨chừa chỗ⟩ | BR-808 – nhãn mặc định khi checklist chưa có EN |
| `hk.insp.i02` | Phòng tắm khô, không tóc | Bathroom dry, no hair | ⟨chừa chỗ⟩ |  |
| `hk.insp.i03` | Khăn: 2 tắm, 2 mặt, 1 chân | Towels: 2 bath, 2 face, 1 bath mat | ⟨chừa chỗ⟩ |  |
| `hk.insp.i04` | Đồ dùng đủ, quay nhãn ra | Amenities complete, labels facing out | ⟨chừa chỗ⟩ |  |
| `hk.insp.i05` | Bếp sạch, tủ lạnh có nước suối | Kitchen clean, bottled water in the fridge | ⟨chừa chỗ⟩ |  |
| `hk.insp.i06` | Bàn làm việc, đèn, ổ cắm | Desk, lamp and sockets work | ⟨chừa chỗ⟩ |  |
| `hk.insp.i07` | Wi-Fi từ 50 Mbps | Wi-Fi at least 50 Mbps | ⟨chừa chỗ⟩ |  |
| `hk.insp.i08` | Rèm, cửa sổ kín | Curtains and windows close properly | ⟨chừa chỗ⟩ |  |
| `hk.insp.i09` | Không mùi, đã thông gió | No odours, room aired | ⟨chừa chỗ⟩ |  |
| `hk.insp.i10` | Remote, điều hòa / sưởi chạy | Remote, air-con / heater working | ⟨chừa chỗ⟩ |  |
| `hk.insp.i11` | Thẻ chào + thông tin Wi-Fi | Welcome card + Wi-Fi details | ⟨chừa chỗ⟩ |  |
| `hk.insp.i12` | Ảnh phòng | Room photos | ⟨chừa chỗ⟩ |  |
| `hk.insp.kit` | Có đủ {n} bộ đồ dùng thêm (sofa) | {n} extra-guest kit(s) in place (sofa) | ⟨chừa chỗ⟩ | BR-812 (5) |
| `hk.insp.photo_done` | Đã chụp đủ ảnh phòng | Room photos taken | ⟨chừa chỗ⟩ |  |
| `hk.insp.note` | Ghi chú (không bắt buộc) | Note (optional) | ⟨chừa chỗ⟩ |  |
| `hk.insp.pass` | Kiểm đạt – sẵn sàng | Passed – ready | ⟨chừa chỗ⟩ | recordInspection → VI |
| `hk.insp.fail` | Chưa đạt | Not passed | ⟨chừa chỗ⟩ |  |
| `hk.insp.fail_note` | Chưa đạt ở đâu? Ghi để người dọn sửa | What didn't pass? Write it down so it can be fixed | ⟨chừa chỗ⟩ |  |
| `hk.insp.fail_effect` | Căn quay về "Cần dọn (khách đã đi)" và có việc dọn lại. | The room goes back to "Needs cleaning (guest left)" with a re-clean task. | ⟨chừa chỗ⟩ | [GIẢ ĐỊNH UXD – chờ BA chốt SM-03] |
| `hk.insp.fail_save` | Ghi chưa đạt | Save as not passed | ⟨chừa chỗ⟩ |  |
| `hk.insp.empty_title` | Chưa có danh mục kiểm phòng | No inspection checklist yet | ⟨chừa chỗ⟩ |  |
| `hk.insp.empty_body` | Quản lý cần thiết lập danh mục kiểm phòng trước. Báo lễ tân trưởng. | A manager needs to set up the checklist first. Let the front desk lead know. | ⟨chừa chỗ⟩ |  |
| `hk.insp.self_off_title` | Bạn chưa tự kiểm được căn này | You can't self-inspect this room yet | ⟨chừa chỗ⟩ |  |
| `hk.insp.self_off_body` | Cơ sở chưa bật chế độ buồng phòng tự kiểm. Lễ tân trưởng sẽ kiểm – bạn không cần làm gì thêm. | Self-inspection isn't switched on for this property. The front desk lead will inspect – nothing more for you to do. | ⟨chừa chỗ⟩ |  |
| `hk.self_inspect_left` | Dọn xong & tự kiểm đạt (còn {n} mục) | Finished & self-inspected ({n} items left) | ⟨chừa chỗ⟩ |  |
| `hk.photo_add` | Chụp | Take photo | ⟨chừa chỗ⟩ |  |
| `hk.photo_n` | Ảnh {n} | Photo {n} | ⟨chừa chỗ⟩ |  |
| `hk.minibar_title` | Minibar – còn lại trong tủ | Minibar – items left | ⟨chừa chỗ⟩ |  |
| `hk.minibar_less` | Bớt | Fewer | ⟨chừa chỗ⟩ |  |
| `hk.minibar_more` | Thêm | More | ⟨chừa chỗ⟩ |  |
| `hk.minibar_help` | Đếm số còn trong tủ. Hệ thống tự tính phần khách đã dùng và báo bổ sung. | Count what's left. The system works out what was used and what to restock. | ⟨chừa chỗ⟩ |  |
| `hk.refuse_title` | Khách không muốn dọn hôm nay? | Guest doesn't want cleaning today? | ⟨chừa chỗ⟩ |  |
| `hk.refuse.dnd` | Treo biển "Không làm phiền" | "Do not disturb" sign is up | ⟨chừa chỗ⟩ |  |
| `hk.refuse.said_no` | Khách nói không cần dọn | Guest said no cleaning needed | ⟨chừa chỗ⟩ |  |
| `hk.refuse.other` | Lý do khác | Other reason | ⟨chừa chỗ⟩ |  |
| `hk.refuse_effect` | Việc dọn hôm nay của căn này được bỏ. Lễ tân thấy lý do. Ngày mai vẫn có việc dọn như thường. | Today's cleaning for this room is skipped. The front desk sees the reason. Cleaning resumes tomorrow as usual. | ⟨chừa chỗ⟩ |  |
| `hk.refuse_save` | Bỏ việc dọn hôm nay | Skip today's cleaning | ⟨chừa chỗ⟩ |  |
| `hk.wo.offline` | Mất mạng – vẫn gửi được. Phiếu và ảnh lưu trên máy, tự gửi khi có mạng; mã phiếu có sau khi gửi. | You're offline – you can still send. The report and photos stay on this phone and send when you're back online; the work-order number comes after. | ⟨chừa chỗ⟩ |  |
| `hk.wo.room` | Căn | Room | ⟨chừa chỗ⟩ |  |
| `hk.wo.what` | Chuyện gì xảy ra? | What happened? | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.hot_water` | Mất nước nóng | No hot water | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.power` | Điện / đèn | Power / lights | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.leak` | Rò nước | Water leak | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.lock` | Khóa cửa | Door lock | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.broken` | Đồ hỏng | Something broken | ⟨chừa chỗ⟩ |  |
| `hk.wo.k.other` | Khác | Other | ⟨chừa chỗ⟩ |  |
| `hk.wo.desc` | Mô tả | Description | ⟨chừa chỗ⟩ |  |
| `hk.wo.desc_required` | Ghi vài chữ để kỹ thuật biết cần mang gì. | Add a few words so maintenance knows what to bring. | ⟨chừa chỗ⟩ |  |
| `hk.wo.photos` | Ảnh (nên có) | Photos (recommended) | ⟨chừa chỗ⟩ |  |
| `hk.wo.severity` | Mức độ | Priority | ⟨chừa chỗ⟩ |  |
| `hk.wo.block_request` | Đề nghị khóa căn – không bán đến khi sửa xong | Suggest blocking the room – no sales until fixed | ⟨chừa chỗ⟩ | WorkOrderCreate.blockRequested (đề nghị ARC) |
| `hk.wo.send` | Gửi báo sự cố | Send report | ⟨chừa chỗ⟩ |  |
| `hk.wo.pick_room_title` | Chọn căn trước | Pick a room first | ⟨chừa chỗ⟩ |  |
| `hk.wo.pick_room_body` | Mở từ thẻ việc hoặc chọn căn ở ô trên để báo sự cố. | Open this from a task card or pick a room above to report a problem. | ⟨chừa chỗ⟩ |  |
| `hk.wo.sent_title` | Đã tạo phiếu {code} | Work order {code} created | ⟨chừa chỗ⟩ |  |
| `hk.wo.sent_body_high` | Bảo trì, lễ tân và quản lý đã được báo. Bảo trì nhận việc trong 15 phút. | Maintenance, front desk and the manager have been notified. Maintenance will pick it up within 15 minutes. | ⟨chừa chỗ⟩ |  |
| `hk.wo.sent_body` | Bảo trì đã thấy phiếu. Bạn không cần làm gì thêm. | Maintenance can see it now. Nothing more for you to do. | ⟨chừa chỗ⟩ |  |
| `hk.wo.queued_title` | Đã lưu trên máy – chưa gửi | Saved on this phone – not sent yet | ⟨chừa chỗ⟩ |  |
| `hk.wo.queued_body` | Sẽ tự gửi khi có mạng. Sự cố gấp? Gọi lễ tân ngay, đừng chờ. | It will send when you're back online. Urgent? Call the front desk now – don't wait. | ⟨chừa chỗ⟩ |  |
| `hk.queue_title` | Thao tác trên máy | Changes on this phone | ⟨chừa chỗ⟩ |  |
| `hk.queue.pending` | Đang chờ gửi ({n}) | Waiting to send ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.queue.tapped_at` | Bấm lúc {time} | Tapped at {time} | ⟨chừa chỗ⟩ |  |
| `hk.queue.waiting` | Chờ mạng | Waiting for connection | ⟨chừa chỗ⟩ |  |
| `hk.queue.wo_with_photo` | Báo sự cố + {n} ảnh | Problem report + {n} photo(s) | ⟨chừa chỗ⟩ |  |
| `hk.queue.review` | Cần xem lại ({n}) | Needs review ({n}) | ⟨chừa chỗ⟩ |  |
| `hk.queue.rejected_title` | Căn {room} – "{action}" không áp dụng được | Room {room} – "{action}" couldn't be applied | ⟨chừa chỗ⟩ |  |
| `hk.queue.rejected_body` | Lúc bạn bấm ({time}), căn đã là "{status}". Không cần làm lại. | When you tapped ({time}), the room was already "{status}". No need to redo it. | ⟨chừa chỗ⟩ |  |
| `hk.queue.ack` | Đã hiểu | Got it | ⟨chừa chỗ⟩ |  |
| `hk.queue.keep_note` | Đừng xóa dữ liệu trình duyệt hay gỡ app khi còn thao tác chờ gửi. | Don't clear browser data or remove the app while changes are waiting to send. | ⟨chừa chỗ⟩ |  |
| `hk.queue.empty_title` | Đã gửi hết | Everything sent | ⟨chừa chỗ⟩ |  |
| `hk.queue.empty_body` | Không còn thao tác nào chờ gửi trên máy này. | No changes waiting on this phone. | ⟨chừa chỗ⟩ |  |
| `hk.queue.retry_title` | Gửi chưa được – sẽ thử lại | Not sent yet – will try again | ⟨chừa chỗ⟩ |  |
| `hk.queue.retry_body` | Máy chủ chưa nhận. Thao tác vẫn nằm trên máy, tự thử lại lúc {time}. | The server didn't receive it. Your changes are still on this phone; next try at {time}. | ⟨chừa chỗ⟩ |  |
| `hk.queue.send_now` | Gửi ngay | Send now | ⟨chừa chỗ⟩ |  |
| `hk.queue.sending` | Đang gửi {n}/{total}… | Sending {n}/{total}… | ⟨chừa chỗ⟩ |  |
| `hk.queue.sent_all` | Đã gửi {n} thao tác | {n} changes sent | ⟨chừa chỗ⟩ |  |
| `hk.queue.relogin_title` | Đăng nhập lại để gửi tiếp | Sign in again to keep sending | ⟨chừa chỗ⟩ |  |
| `hk.queue.relogin_body` | {n} thao tác vẫn còn trên máy và sẽ gửi sau khi bạn đăng nhập. | {n} changes are still on this phone and will send after you sign in. | ⟨chừa chỗ⟩ |  |
| `hk.queue.task_cancelled` | Căn {room} – việc này đã được hủy vì đơn thay đổi | Room {room} – this task was cancelled because the booking changed | ⟨chừa chỗ⟩ |  |
| `hk.queue.task_cancelled_body` | Không cần làm. Xem danh sách việc mới. | Nothing to do. Check your updated task list. | ⟨chừa chỗ⟩ |  |

#### R2 hi-fi Sprint 4 – Bảo trì / phiếu sửa (H22)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `wo.sev.high` | Gấp | Urgent | ⟨chừa chỗ⟩ | Severity high – BR-809 (nhận 15 phút, phương án 2 giờ) |
| `wo.sev.medium` | Trong ngày | Today | ⟨chừa chỗ⟩ | medium – xong trong 24 giờ |
| `wo.sev.low` | Không gấp | Not urgent | ⟨chừa chỗ⟩ | low – xong trong 72 giờ |
| `wo.sev.high_help` | An toàn hoặc khách đang ở bị ảnh hưởng: mất nước nóng, mất điện, khóa hỏng, rò nước | Safety, or a staying guest is affected: no hot water, no power, broken lock, leak | ⟨chừa chỗ⟩ |  |
| `wo.sev.medium_help` | Cần sửa xong trong 24 giờ | Fix within 24 hours | ⟨chừa chỗ⟩ |  |
| `wo.sev.low_help` | Sửa trong 3 ngày | Fix within 3 days | ⟨chừa chỗ⟩ |  |
| `wo.status.new` | Mới | New | ⟨chừa chỗ⟩ | SM-04 |
| `wo.status.in_progress` | Đang sửa | In progress | ⟨chừa chỗ⟩ |  |
| `wo.status.waiting_parts` | Chờ vật tư | Waiting for parts | ⟨chừa chỗ⟩ |  |
| `wo.status.done` | Đã xong | Done | ⟨chừa chỗ⟩ |  |
| `wo.status.cancelled` | Đã hủy | Cancelled | ⟨chừa chỗ⟩ |  |
| `wo.filter_label` | Lọc phiếu | Filter work orders | ⟨chừa chỗ⟩ |  |
| `wo.filter.open` | Đang mở ({n}) | Open ({n}) | ⟨chừa chỗ⟩ |  |
| `wo.filter.high` | Gấp ({n}) | Urgent ({n}) | ⟨chừa chỗ⟩ |  |
| `wo.filter.parts` | Chờ vật tư ({n}) | Waiting for parts ({n}) | ⟨chừa chỗ⟩ |  |
| `wo.due.ack` | Nhận việc trước {time} – còn {m} phút | Pick up by {time} – {m} min left | ⟨chừa chỗ⟩ |  |
| `wo.due.plan` | Có phương án trước {time} (sửa xong hoặc đổi phòng cho khách). | Have a solution by {time} (fixed, or the guest moved to another room). | ⟨chừa chỗ⟩ |  |
| `wo.due.resolve` | Xong trước {when} | Fix by {when} | ⟨chừa chỗ⟩ |  |
| `wo.due.paused` | Hạn tạm dừng – vật tư dự kiến {date} | Deadline paused – parts expected {date} | ⟨chừa chỗ⟩ |  |
| `wo.due.overdue` | Quá hạn {m} phút | {m} min overdue | ⟨chừa chỗ⟩ |  |
| `wo.source.guest_app` | Khách báo qua app | Reported by guest in the app | ⟨chừa chỗ⟩ |  |
| `wo.occupied` | Căn có khách đang ở | Room is occupied | ⟨chừa chỗ⟩ | MT không thấy tên khách (rbac D18) |
| `wo.locked_until` | Đang khóa – mở bán lại {date} | Blocked – back on sale {date} | ⟨chừa chỗ⟩ |  |
| `wo.assignee` | Người xử lý: {name} | Assigned to: {name} | ⟨chừa chỗ⟩ |  |
| `wo.empty_title` | Không có phiếu nào đang mở | No open work orders | ⟨chừa chỗ⟩ |  |
| `wo.empty_body` | Phiếu mới từ buồng phòng, lễ tân hoặc khách sẽ hiện ở đây kèm thông báo. | New work orders from housekeeping, the front desk or guests will show here with a notification. | ⟨chừa chỗ⟩ |  |
| `wo.error_title` | Chưa tải được phiếu sửa | Couldn't load work orders | ⟨chừa chỗ⟩ |  |
| `wo.photos_reported` | Ảnh lúc báo | Photos when reported | ⟨chừa chỗ⟩ |  |
| `wo.log` | Nhật ký phiếu | Work order history | ⟨chừa chỗ⟩ |  |
| `wo.log.raised_high` | Lễ tân {who} nâng mức lên Gấp | Front desk {who} raised it to Urgent | ⟨chừa chỗ⟩ |  |
| `wo.log.created_guest` | Tạo từ yêu cầu "Báo hỏng" của khách | Created from a guest's "Report a problem" request | ⟨chừa chỗ⟩ |  |
| `wo.log.created_hk` | Tạo từ báo sự cố của buồng phòng | Created from a housekeeping report | ⟨chừa chỗ⟩ |  |
| `wo.log.started` | {who} nhận việc | {who} picked it up | ⟨chừa chỗ⟩ |  |
| `wo.log.blocked` | Lễ tân {who} khóa căn | Front desk {who} blocked the room | ⟨chừa chỗ⟩ |  |
| `wo.action.start` | Nhận việc | Pick up | ⟨chừa chỗ⟩ | transitionWorkOrder start |
| `wo.action.wait_parts` | Chờ vật tư | Waiting for parts | ⟨chừa chỗ⟩ | wait-parts |
| `wo.action.resume` | Sửa tiếp | Resume work | ⟨chừa chỗ⟩ | resume |
| `wo.action.done` | Sửa xong | Fixed | ⟨chừa chỗ⟩ | done |
| `wo.action.cancel` | Hủy phiếu | Cancel work order | ⟨chừa chỗ⟩ | cancel – FD+, lý do bắt buộc |
| `wo.block_info` | Căn khóa đêm {from} – {to}, mở bán lại từ {reopen}. | Room blocked for the nights of {from} – {to}, back on sale from {reopen}. | ⟨chừa chỗ⟩ |  |
| `wo.done_title` | Sửa xong {code} | Fixed – {code} | ⟨chừa chỗ⟩ |  |
| `wo.done_offline` | Mất mạng – chưa mở bán lại được. Đóng phiếu có khóa phòng cần có mạng để lễ tân thấy ngay. | You're offline – the room can't go back on sale yet. Closing a work order with a room block needs a connection so the front desk sees it right away. | ⟨chừa chỗ⟩ |  |
| `wo.result` | Đã làm gì? | What did you do? | ⟨chừa chỗ⟩ |  |
| `wo.photos_after` | Ảnh sau khi sửa | Photos after the fix | ⟨chừa chỗ⟩ |  |
| `wo.photo_required` | Chụp ít nhất 1 ảnh sau khi sửa làm bằng chứng. | Take at least 1 photo after the fix as evidence. | ⟨chừa chỗ⟩ | [GIẢ ĐỊNH UXD – chờ PO/DOM]; server: EVIDENCE_REQUIRED |
| `wo.done_effects_title` | Khi bấm Xác nhận: | When you confirm: | ⟨chừa chỗ⟩ |  |
| `wo.done_effect_unblock` | Căn {room} mở khóa và mở bán lại trên mọi kênh | Room {room} is unblocked and back on sale on every channel | ⟨chừa chỗ⟩ |  |
| `wo.done_effect_vd` | Căn chuyển "Cần dọn (khách đã đi)" | The room becomes "Needs cleaning (guest left)" | ⟨chừa chỗ⟩ |  |
| `wo.done_effect_task` | Buồng phòng nhận việc "Dọn sau sửa chữa" | Housekeeping gets a "Clean after repair" task | ⟨chừa chỗ⟩ |  |
| `wo.reopening` | Đang mở bán lại… chỉ khi hiện "Đã mở bán lại" thì căn mới bán được. | Putting it back on sale… the room is only bookable once "Back on sale" appears. | ⟨chừa chỗ⟩ |  |
| `wo.reopened` | Đã mở bán lại căn {room}. Đã giao việc dọn sau sửa chữa. | Room {room} is back on sale. A clean-after-repair task has been assigned. | ⟨chừa chỗ⟩ |  |
| `wo.done_confirm` | Xác nhận sửa xong | Confirm fixed | ⟨chừa chỗ⟩ |  |
| `wo.wait_title` | Chờ vật tư – {code} | Waiting for parts – {code} | ⟨chừa chỗ⟩ |  |
| `wo.parts_note` | Cần vật tư gì? | What parts are needed? | ⟨chừa chỗ⟩ |  |
| `wo.parts_date` | Ngày dự kiến có vật tư | Expected parts date | ⟨chừa chỗ⟩ | partsExpectedDate (đề nghị ARC) |
| `wo.parts_date_help` | Hạn của phiếu tạm dừng đến ngày này. Quá ngày mà chưa có, phiếu vào "Cần chú ý". | The deadline pauses until this date. If the parts haven't arrived by then, it shows under "Needs attention". | ⟨chừa chỗ⟩ |  |
| `wo.parts_high_note` | Phiếu Gấp không dừng hạn khi chờ vật tư – vẫn cần phương án trong 2 giờ (đổi phòng hoặc bù cho khách). | Urgent work orders don't pause while waiting for parts – a solution is still needed within 2 hours (move the guest or compensate). | ⟨chừa chỗ⟩ |  |
| `wo.action.wait_parts_save` | Lưu – chờ vật tư | Save – waiting for parts | ⟨chừa chỗ⟩ |  |
| `wo.new_title` | Phiếu sửa mới | New work order | ⟨chừa chỗ⟩ |  |
| `wo.block_from` | Khóa từ | Block from | ⟨chừa chỗ⟩ |  |
| `wo.block_done_planned` | Dự kiến xong | Expected fixed by | ⟨chừa chỗ⟩ |  |
| `wo.block_summary` | Khóa {nights} đêm ({from} – {to}). Mở bán lại từ {reopen}. | Blocked for {nights} nights ({from} – {to}). Back on sale from {reopen}. | ⟨chừa chỗ⟩ | BR-804 nửa mở – mở bán lại = xong + ooo_reopen_buffer_days |
| `wo.block_conflict_title` | Khoảng khóa trùng {n} đơn đã đặt | The block overlaps {n} existing booking(s) | ⟨chừa chỗ⟩ |  |
| `wo.block_conflict_body` | Dời đơn sang căn khác trước khi khóa, hoặc quản lý xác nhận đã có phương án. | Move these bookings to another room first, or a manager confirms there's a plan. | ⟨chừa chỗ⟩ |  |
| `wo.open_booking` | Mở đơn để đổi căn | Open booking to change room | ⟨chừa chỗ⟩ |  |
| `wo.block_ack` | Tôi là quản lý – đã có phương án cho các đơn này | I'm a manager – there's a plan for these bookings | ⟨chừa chỗ⟩ |  |
| `wo.block_occupied_title` | Căn đang có khách – chưa khóa được | Room is occupied – can't block it yet | ⟨chừa chỗ⟩ |  |
| `wo.block_occupied_body` | Lễ tân đổi phòng cho khách trước, rồi mới khóa căn. | The front desk needs to move the guest first, then block the room. | ⟨chừa chỗ⟩ |  |
| `wo.create_and_block` | Tạo phiếu và khóa căn | Create and block room | ⟨chừa chỗ⟩ |  |

#### R2 hi-fi Sprint 4 – guest-web yêu cầu & thông tin (H23)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `gw.req.new` | Gửi yêu cầu mới | New request | ⟨chừa chỗ⟩ |  |
| `gw.req.need_network` | Cần có mạng để gửi yêu cầu | You need a connection to send a request | ⟨chừa chỗ⟩ |  |
| `gw.req.sent_at` | Gửi lúc {time} | Sent at {time} | ⟨chừa chỗ⟩ |  |
| `gw.req.fee_line` | Phí {amount} – thanh toán khi trả phòng. | Fee {amount} – paid at check-out. | ⟨chừa chỗ⟩ |  |
| `gw.req.fee_tile` | {amount}/lần | {amount} each time | ⟨chừa chỗ⟩ |  |
| `gw.req.free` | Miễn phí | Free | ⟨chừa chỗ⟩ |  |
| `gw.req.fee_notice` | Dịch vụ này có phí {amount}/lần, thanh toán khi trả phòng. | This service costs {amount} each time, paid at check-out. | ⟨chừa chỗ⟩ | Thay guest.req.fee_notice ở R2 (không chữ hóa đơn/bill – SEC ĐK-6) |
| `gw.req.clean_what` | Gồm lau dọn, thay ga gối, vệ sinh nhà tắm và bếp. Dọn hằng ngày vẫn miễn phí. | Includes cleaning, fresh bed linen, bathroom and kitchen. Daily cleaning stays free. | ⟨chừa chỗ⟩ |  |
| `gw.req.fee_accept` | Tôi đồng ý phí {amount} cho lần dọn này | I agree to the {amount} fee for this clean | ⟨chừa chỗ⟩ |  |
| `gw.req.note_ph` | Ví dụ: dọn lúc 15:00 khi tôi đi ra ngoài | e.g. clean at 15:00 while I'm out | ⟨chừa chỗ⟩ |  |
| `gw.req.note_help` | Tối đa 500 ký tự. Không ghi số giấy tờ, số thẻ thanh toán hay thông tin sức khỏe. | Up to 500 characters. Please don't include ID numbers, payment card numbers or health information. | ⟨chừa chỗ⟩ | S3: theo EP14 3.2 guest.req.note_hint (SR-INP-05) |
| `gw.req.reason` | Lý do: | Reason: | ⟨chừa chỗ⟩ |  |
| `gw.req.empty_body` | Cần khăn, dọn phòng hay báo hỏng? Gửi ở đây – lễ tân thấy ngay. | Need towels, cleaning or something fixed? Send it here – the front desk sees it right away. | ⟨chừa chỗ⟩ |  |
| `gw.req.error_title` | Chưa tải được yêu cầu của bạn | Couldn't load your requests | ⟨chừa chỗ⟩ |  |
| `gw.req.after_hours_title` | Lễ tân trả lời từ 07:00 | The front desk replies from 07:00 | ⟨chừa chỗ⟩ |  |
| `gw.req.after_hours_body` | Bạn vẫn gửi được, chúng tôi xử lý vào buổi sáng. Việc gấp (mất điện, nước, khóa cửa) – gọi người trực. | You can still send it and we'll handle it in the morning. Urgent (power, water, lock)? Call the night staff. | ⟨chừa chỗ⟩ |  |
| `gw.req.repair_help` | Mô tả chỗ hỏng (ví dụ: không có nước nóng). Kỹ thuật sẽ liên hệ trước khi vào phòng. | Describe the problem (e.g. no hot water). Maintenance will contact you before entering the room. | ⟨chừa chỗ⟩ |  |
| `gw.req.late_help` | Ghi giờ bạn muốn trả. Lễ tân sẽ báo phí (nếu có) và xác nhận trước khi bạn ở thêm. | Tell us what time you'd like to leave. The front desk will confirm and tell you any fee before you stay longer. | ⟨chừa chỗ⟩ |  |
| `gw.req.auto_reply` | Trả lời tự động: Chúng tôi đã nhận và sẽ xử lý từ {time}. | Automatic reply: We've received your request and will handle it from {time}. | ⟨chừa chỗ⟩ | CŨ – BR-811 ngoài giờ trực. App hiện autoReply do server dựng từ guest.req.auto_reply (EP14 4.3); hi-fi H23 đã đổi sang khóa đó (UXD s4). Xóa ở v0.5 |
| `gw.wifi_name` | Tên mạng | Network name | Имя сети |  |
| `gw.wifi_pass` | Mật khẩu | Password | Пароль |  |
| `gw.wifi_copy` | Sao chép mật khẩu | Copy password | Скопировать пароль |  |
| `gw.wifi_copied` | Đã sao chép mật khẩu Wi-Fi | Wi-Fi password copied | Пароль Wi-Fi скопирован |  |
| `gw.rules_source` | Nội dung theo nội quy OTTIMO đang áp dụng. | Based on OTTIMO's current house rules. | По действующим правилам проживания OTTIMO. |  |
| `gw.info_error_title` | Chưa tải được thông tin lưu trú | Couldn't load your stay details | ⟨chừa chỗ⟩ |  |

#### R2 hi-fi Sprint 4 – Tổng quan + Cần chú ý + SSE (H24)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `ov.subtitle` | Đêm nay {date} | Tonight {date} | ⟨chừa chỗ⟩ | date = businessDate (BR-010) |
| `ov.live` | Trực tiếp | Live | ⟨chừa chỗ⟩ |  |
| `ov.reconnecting` | Đang kết nối lại | Reconnecting | ⟨chừa chỗ⟩ |  |
| `ov.offline_short` | Ngoại tuyến | Offline | ⟨chừa chỗ⟩ |  |
| `ov.poll_note` | tự tải lại mỗi 30 giây | refreshing every 30 seconds | ⟨chừa chỗ⟩ |  |
| `ov.offline` | Mất kết nối – số liệu lúc {time}, chưa duyệt được. | You're offline – figures from {time}; approvals unavailable. | ⟨chừa chỗ⟩ |  |
| `ov.approvals_n` | Cần duyệt ({n}) | To approve ({n}) | ⟨chừa chỗ⟩ |  |
| `ov.approval_item` | {what} · {amount} | {what} · {amount} | ⟨chừa chỗ⟩ |  |
| `ov.attention_n` | Cần chú ý ({n}) | Needs attention ({n}) | ⟨chừa chỗ⟩ |  |
| `ov.new` | Mới | New | ⟨chừa chỗ⟩ |  |
| `ov.sse_new_announce` | Có 1 mục mới cần chú ý | 1 new item needs attention | ⟨chừa chỗ⟩ | aria-live polite – đọc một lần |
| `ov.owner_only` | Chỉ chủ đầu tư thấy | Visible to the owner only | ⟨chừa chỗ⟩ |  |
| `ov.attn_empty_title` | Không có gì cần chú ý | Nothing needs attention | ⟨chừa chỗ⟩ |  |
| `ov.attn_empty_body` | Khai báo, giữ chỗ và phiếu sửa đều ổn. Có việc mới sẽ hiện ngay ở đây. | Registrations, holds and work orders are all fine. Anything new will show up here. | ⟨chừa chỗ⟩ |  |
| `ov.attn_error_title` | Chưa tải được mục Cần chú ý | Couldn't load Needs attention | ⟨chừa chỗ⟩ |  |
| `ov.tonight` | Đêm nay | Tonight | ⟨chừa chỗ⟩ |  |
| `ov.kpi_arr_dep` | Khách đến / đi | Arrivals / departures | ⟨chừa chỗ⟩ |  |
| `ov.kpi_note` | Giữ chỗ chưa cọc và đơn OTA chưa gán căn không tính vào công suất. | Unpaid holds and unassigned OTA bookings don't count towards occupancy. | ⟨chừa chỗ⟩ | BR-904, metrics K-03, S1b |
| `ov.role.manager` | Như chủ đầu tư, trừ cảnh báo miễn phí vượt ngưỡng. | Same as the owner, except the complimentary-limit alert. | ⟨chừa chỗ⟩ |  |
| `ov.role.fdl` | Cần duyệt: chỉ yêu cầu trong hạn mức của bạn. Không có số tiền tháng, không có cảnh báo miễn phí. | To approve: only requests within your limit. No monthly revenue, no complimentary-limit alert. | ⟨chừa chỗ⟩ |  |
| `ov.role.fd` | Thấy KPI đêm nay và Cần chú ý vận hành. Cần duyệt chỉ hiện trạng thái yêu cầu bạn đã gửi. | Sees tonight's KPIs and operational alerts. To approve only shows the status of requests you sent. | ⟨chừa chỗ⟩ |  |
| `attn.vip_arrival` | Khách quen đến hôm nay: {n} đơn | Returning guests arriving today: {n} | ⟨chừa chỗ⟩ | AttentionItem.kind – BR-907 |
| `attn.room_ooo` | Căn {room} đang khóa sửa chữa – mở bán lại {date} | Room {room} is blocked for repair – back on sale {date} | ⟨chừa chỗ⟩ |  |
| `attn.rent_due_soon` | Kỳ thu dài hạn trong 7 ngày: {n} hợp đồng | Long-stay payments due within 7 days: {n} contract(s) | ⟨chừa chỗ⟩ | R3 |
| `attn.lease_expiring` | Hợp đồng hết hạn trong 30 ngày: {n} | Contracts ending within 30 days: {n} | ⟨chừa chỗ⟩ | R3 |
| `attn.registration_due` | Khai báo lưu trú hôm nay: {n} đơn – hạn sớm nhất {time} | Guest registrations due today: {n} – earliest deadline {time} | ⟨chừa chỗ⟩ |  |
| `attn.registration_overdue` | Khai báo quá hạn: {n} đơn – làm ngay | Overdue guest registrations: {n} – do now | ⟨chừa chỗ⟩ |  |
| `attn.visa_expiring` | Thị thực của khách hết trước ngày đi – đơn {code} | A guest's visa ends before departure – booking {code} | ⟨chừa chỗ⟩ | Chỉ mã đơn, không ngày (SR-RET-06) |
| `attn.work_order_high_open` | Phiếu sửa Gấp đang mở: {n} (căn {rooms}) | Urgent work orders open: {n} (room {rooms}) | ⟨chừa chỗ⟩ |  |
| `attn.work_order_high_sub` | Căn {room} có khách – cần nhận việc trước {time} | Room {room} is occupied – must be picked up by {time} | ⟨chừa chỗ⟩ |  |
| `attn.hold_expiring` | Giữ chỗ {code} hết hạn lúc {time} | Hold {code} expires at {time} | ⟨chừa chỗ⟩ |  |
| `attn.meter_not_read` | Chưa chốt công tơ: {n} căn | Meters not read: {n} room(s) | ⟨chừa chỗ⟩ | R3 |
| `attn.channel_sync_error` | Đồng bộ kênh lỗi – {n} thay đổi chưa đẩy lên kênh | Channel sync failed – {n} change(s) not pushed to channels | ⟨chừa chỗ⟩ |  |
| `attn.foc_threshold` | Miễn phí tháng này vượt ngưỡng cảnh báo | This month's complimentary items are over the alert limit | ⟨chừa chỗ⟩ | Chỉ owner (BR-435) |
| `attn.overbooking` | Hai đơn trùng căn {room} – xử lý ngay | Two bookings overlap in room {room} – act now | ⟨chừa chỗ⟩ |  |
| `attn.unassigned_with_free_room` | Đơn OTA chưa gán căn trong khi còn căn trống: {n} | Unassigned OTA bookings while rooms are free: {n} | ⟨chừa chỗ⟩ |  |
| `attn.data_quality` | Dữ liệu cần kiểm lại: {n} mục | Data to double-check: {n} item(s) | ⟨chừa chỗ⟩ |  |
| `attn.no_show_call` | Gọi khách chưa đến {code} (từ {time}) | Call guest who hasn't arrived – {code} (from {time}) | ⟨chừa chỗ⟩ |  |
| `attn.no_show_mark` | Có thể ghi "Không đến" cho {code} | {code} can now be marked "No-show" | ⟨chừa chỗ⟩ |  |
| `attn.security_alert` | Cảnh báo bảo mật tài khoản: {n} | Account security alerts: {n} | ⟨chừa chỗ⟩ |  |

#### R2 hi-fi Sprint 2 – Danh mục căn: số giường, diện tích (H04, OpenAPI 0.3.4 Q6)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `rooms.col_bed_count` | Số giường | Beds | ⟨chừa chỗ⟩ | Room.bedCount 1–10 |
| `rooms.col_area` | Diện tích | Area | ⟨chừa chỗ⟩ | Room.areaM2 |
| `rooms.area_value` | {m2} m² | {m2} m² | ⟨chừa chỗ⟩ |  |
| `rooms.area` | Diện tích (không bắt buộc) | Area (optional) | ⟨chừa chỗ⟩ |  |
| `rooms.area_help` | Số nguyên. Để trống nếu chưa đo. | Whole number. Leave blank if not measured. | ⟨chừa chỗ⟩ |  |
| `rooms.bed_count_help` | Giường lớn và giường đơn, không tính sofa (1–10). | Double and single beds, not the sofa (1–10). | ⟨chừa chỗ⟩ |  |

#### R2 Sprint 2 – review FE: rack, đặt phòng, chi tiết đơn, sale (H08–H12)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `common.reload` | Tải lại | Reload | ⟨chừa chỗ⟩ | Nút khi 412 VERSION_CONFLICT / 428 – khác 'Thử lại' (gửi lại) |
| `booking.field.arrival` | Ngày đến | Arrival | ⟨chừa chỗ⟩ | Thay việc tách chuỗi booking.field.dates |
| `booking.field.departure` | Ngày đi | Departure | ⟨chừa chỗ⟩ |  |
| `rack.view_label` | Kiểu xem | View | ⟨chừa chỗ⟩ | Nhãn nhóm Seg Lưới / Danh sách |
| `drawer.progress.label` | Tiến trình đơn | Booking progress | ⟨chừa chỗ⟩ | aria-label thanh tiến trình H11 |
| `rack.long_prefix` | HĐ | Lease | ⟨chừa chỗ⟩ | Tiền tố tên trên thanh dài hạn (H08) – thay chữ 'HĐ' viết cứng |
| `rack.col_status` | Tình trạng buồng | Room status | ⟨chừa chỗ⟩ | Cột bảng Danh sách H08 |
| `rack.col_bookings` | Đơn trong khoảng ngày | Bookings in this range | ⟨chừa chỗ⟩ | Cột bảng Danh sách H08 |
| `rack.off_sale` | Ngừng bán | Off sale | ⟨chừa chỗ⟩ | Chip đầu dòng căn ngừng bán – khớp rack.hidden_note (EN 'Off sale') |
| `rack.cell_free` | Căn {room}, {date}: trống | Room {room}, {date}: free | ⟨chừa chỗ⟩ | aria-label ô trống không đặt được (đã qua / mất mạng) |
| `rack.cell_past` | Căn {room}, {date}: đã qua | Room {room}, {date}: past | ⟨chừa chỗ⟩ |  |
| `rack.cell_off_sale` | Căn {room}, {date}: ngừng bán | Room {room}, {date}: off sale | ⟨chừa chỗ⟩ |  |
| `rsv.upgrade_needs_lead` | Nâng hạng – cần lễ tân trưởng xác nhận | Upgrade – needs a senior receptionist | ⟨chừa chỗ⟩ | Lý do nút căn nâng hạng bị khóa với FD (EP02 E02-08) |
| `rsv.assign_options` | Căn trống phù hợp | Suitable free rooms | ⟨chừa chỗ⟩ | legend danh sách căn ở hộp Gán căn (gồm cả nâng hạng) |
| `rsv.toast.hold_extended` | Đã gia hạn giữ chỗ {code} đến {time} | Hold {code} extended to {time} | ⟨chừa chỗ⟩ |  |
| `rsv.toast.moved` | Đã đổi {code}: căn {room}, {from} → {to} | {code} changed: room {room}, {from} → {to} | ⟨chừa chỗ⟩ |  |
| `rsv.toast.assigned` | Đã gán căn {room} cho {code} | Room {room} assigned to {code} | ⟨chừa chỗ⟩ |  |
| `rsv.toast.cancelled` | Đã hủy đơn {code} | Booking {code} cancelled | ⟨chừa chỗ⟩ |  |
| `rsv.toast.confirmed` | Đơn {code} đã xác nhận | Booking {code} confirmed | ⟨chừa chỗ⟩ |  |
| `rsv.toast.no_show` | Đã đánh dấu {code} không đến | {code} marked as no-show | ⟨chừa chỗ⟩ |  |
| `rsv.toast.restored` | Đã khôi phục đơn {code} | Booking {code} restored | ⟨chừa chỗ⟩ |  |
| `rsv.filter_active` | Đang hiệu lực | Active | ⟨chừa chỗ⟩ | Bộ lọc màn Đơn đặt phòng (giữ chỗ + đã xác nhận + đang ở) |
| `rsv.search_placeholder` | Mã đơn, mã OTA, mã khách hoặc tên | Booking code, OTA reference, guest code or name | ⟨chừa chỗ⟩ |  |
| `rsv.list_empty_title` | Chưa có đơn nào | No bookings yet | ⟨chừa chỗ⟩ |  |
| `rsv.list_empty_body` | Đơn mới sẽ hiện ở đây. Bấm Đặt phòng mới để tạo đơn. | New bookings will show here. Click New booking to create one. | ⟨chừa chỗ⟩ |  |
| `rsv.search_empty` | Không có đơn nào khớp "{q}" | No bookings match "{q}" | ⟨chừa chỗ⟩ |  |
| `sale.quotes_empty_title` | Bạn chưa có báo giá nào | You have no quotes yet | ⟨chừa chỗ⟩ |  |
| `sale.quotes_empty_body` | Tìm căn ở tab Căn trống rồi lập báo giá để gửi khách. | Find a room in the Availability tab, then make a quote to send. | ⟨chừa chỗ⟩ |  |
| `sale.quote_converted` | Đã tạo giữ chỗ | Hold created | ⟨chừa chỗ⟩ | Trạng thái báo giá đã chuyển thành giữ chỗ (không dùng nhãn trạng thái đơn) |
| `sale.quote_expired` | Hết hiệu lực | Expired | ⟨chừa chỗ⟩ |  |
| `cancel.consequence_no_lead` | Căn {room} sẽ mở bán lại từ {from} đến {to} trên mọi kênh. | Room {room} will be back on sale from {from} to {to} on all channels. | ⟨chừa chỗ⟩ | Hủy giữ chỗ không gắn khách tiềm năng |
| `confirm.cancel_booking.body_no_refund` | Căn {room} mở bán lại {from} → {to} trên mọi kênh. Giữ lại {retained} (phí hủy), không hoàn tiền. | Room {room} goes back on sale {from} → {to} on all channels. {retained} is kept (cancellation fee); nothing is refunded. | ⟨chừa chỗ⟩ | refundableVnd = 0 |
| `confirm.cancel_booking.body_no_money` | Căn {room} mở bán lại {from} → {to} trên mọi kênh. Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn. | Room {room} goes back on sale {from} → {to} on all channels. No money was taken, so there's no fee or refund. | ⟨chừa chỗ⟩ | retainedVnd = 0 và refundableVnd = 0 |
| `cancel.preview_loading` | Đang tính phí hủy… | Working out the cancellation fee… | ⟨chừa chỗ⟩ | Nút Hủy đơn khóa trong lúc này |
| `cancel.preview_failed` | Chưa tính được phí hủy nên chưa hủy được. Bấm Thử lại. | Couldn't work out the cancellation fee, so the booking can't be cancelled yet. Tap Try again. | ⟨chừa chỗ⟩ | Lỗi dryRun – nút Hủy đơn khóa |
| `cancel.reason.ota_cancelled` | OTA báo hủy | Cancelled by the OTA | ⟨chừa chỗ⟩ | Chỉ hiện với đơn kênh ota (EP02 B6) |
| `cancel.ota_penalty` | Tiền phạt theo kênh | Channel penalty | ⟨chừa chỗ⟩ | BR-310 – đơn OTA, nhập tay |
| `cancel.ota_penalty_help` | Nhập đúng số kênh báo; ghi 0 nếu kênh miễn phạt. | Enter the amount the channel reports; 0 if the channel waives it. | ⟨chừa chỗ⟩ |  |
| `bk.unassigned_confirm_title` | Lưu đơn OTA chưa gán căn? | Save the OTA booking without a room? | ⟨chừa chỗ⟩ | EP02 6.2 |
| `bk.unassigned_confirm_body` | Đơn {ota_ref} sẽ vào làn "Chưa gán căn" và chưa nhận phòng được. Quản lý nhận cảnh báo ngay. | Booking {ota_ref} will go to the "Unassigned" lane and can't be checked in yet. Managers are alerted straight away. | ⟨chừa chỗ⟩ | EP02 6.2 – hạn có phương án hiện trong drawer khi server trả |
| `bk.unassigned_back` | Quay lại chọn căn | Back to choose a room | ⟨chừa chỗ⟩ |  |
| `rsv.transition_changed` | Đơn vừa chuyển sang "{status}" nên thao tác này không còn dùng được. Các nút đã cập nhật theo trạng thái mới. | This booking just changed to "{status}", so this action no longer applies. The buttons now match the new status. | ⟨chừa chỗ⟩ | 409 INVALID_TRANSITION sau khi FE đã tự tải lại – hiện trong drawer, đóng hộp thoại |
| `rsv.transition_changed_unknown` | Đơn vừa thay đổi nên thao tác này không còn dùng được. Bấm Tải lại để xem trạng thái mới. | This booking just changed, so this action no longer applies. Click Reload to see its new status. | ⟨chừa chỗ⟩ | 409 INVALID_TRANSITION khi tải lại thất bại / không biết trạng thái |
| `error.HOLD_EXPIRED_notime` | Giữ chỗ đã hết hạn và căn đã mở bán lại. Tạo giữ chỗ mới nếu căn còn trống. | The hold has expired and the room is back on sale. Create a new hold if it's still free. | ⟨chừa chỗ⟩ | Khi Problem không có expiredAt |
| `field_error.hold_extended_once` | Giữ chỗ chỉ gia hạn được 1 lần. | A hold can only be extended once. | ⟨chừa chỗ⟩ | EP02 B3 |
| `field.OTA_AMOUNT_MISMATCH` | Tổng giá các đêm khác tổng tiền OTA. Kiểm tra lại giá từng đêm. | The nightly rates don't add up to the OTA total. Check each night's rate. | ⟨chừa chỗ⟩ | Không dùng tham số – FieldError không mang số tiền |
| `field.ALLOW_UNASSIGNED_OTA_ONLY` | Chỉ đơn kênh OTA mới lưu chưa gán căn được. | Only OTA bookings can be saved without a room. | ⟨chừa chỗ⟩ |  |
| `field.DATE_ORDER` | Ngày đi phải sau ngày đến. | Departure must be after arrival. | ⟨chừa chỗ⟩ |  |
| `field.MANUAL_LONG_STAY_BELOW_THRESHOLD` | Đơn dài hạn nhập tay cần từ {n} đêm. | A manual long-stay booking needs {n} nights or more. | ⟨chừa chỗ⟩ | FE truyền {n} = long_stay_required_from_nights (mặc định 28) |
| `field.OTA_PENALTY_OTA_ONLY` | Tiền phạt theo kênh chỉ ghi cho đơn OTA. | A channel penalty applies to OTA bookings only. | ⟨chừa chỗ⟩ |  |

#### R2 Sprint 2 – phản hồi FE (s2-FE): lý do đổi căn, nguồn khách, sức chứa OTA, giữ chỗ

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `move.reason.guest_request` | Khách yêu cầu | Guest request | ⟨chừa chỗ⟩ | MoveReasonCode – BR-429; cũng dùng cho dời ngày thay vì hủy |
| `move.reason.property_fault` | Căn hỏng / sự cố | Room fault | ⟨chừa chỗ⟩ | Gắn khóa phòng BR-804 |
| `move.reason.overbooking` | Xử lý trùng phòng / xung đột OTA | Overbooking / OTA conflict | ⟨chừa chỗ⟩ | Chỉ hiện khi conflictState=open hoặc capacityConflict |
| `move.reason.upgrade` | Nâng hạng chủ động | Upgrade | ⟨chừa chỗ⟩ | Chỉ FDL+ |
| `move.reason.inventory_optimize` | Sắp căn để tránh đêm lẻ | Rearrange to avoid orphan nights | ⟨chừa chỗ⟩ | Chỉ khi chưa báo số căn cho khách |
| `move.reason.force_majeure` | Bất khả kháng (ghi bằng chứng) | Force majeure (add evidence) | ⟨chừa chỗ⟩ | Chỉ dời ngày thay vì hủy, MGR+, ghi chú bắt buộc |
| `move.reason.other` | Khác (ghi rõ) | Other (please specify) | ⟨chừa chỗ⟩ | Ghi chú bắt buộc |
| `bk.source_help` | Khách đã từng ở OTTIMO thì chọn Khách quay lại. CTV/môi giới chọn ở Kênh, không chọn ở đây. | If the guest has stayed at OTTIMO before, choose Returning guest. Agents are a channel, not a source. | ⟨chừa chỗ⟩ | DOM D-6, FB-R2-DOM-FE-02 – dòng gợi ý dưới ô directSource |
| `bk.source_auto_returning` | Đã chọn sẵn Khách quay lại (lần ở gần nhất {date}). Đổi được nếu không đúng. | Returning guest pre-selected (last stay {date}). Change it if that's not right. | ⟨chừa chỗ⟩ | Khi hồ sơ khách có lastStayDate |
| `bk.use_room_orphan` | Dùng căn {room} (đêm lẻ) | Use room {room} (orphan night) | ⟨chừa chỗ⟩ | Nút gợi ý khi MIN_STAY_NOT_MET – căn còn đúng khoảng đêm lẻ (A-05) |
| `bk.closer_sales` | Người chốt | Closed by | ⟨chừa chỗ⟩ | Ô chọn sale nội bộ chốt đơn (A-06); CTV vẫn dùng bk.closer |
| `sale.extend_requested` | Đã gửi quản lý gia hạn báo giá {code} | Request to extend quote {code} sent to a manager | ⟨chừa chỗ⟩ | Toast 202 extendQuote (A-18) |
| `rsv.capacity_chip` | Vượt sức chứa (OTA) | Over capacity (OTA) | ⟨chừa chỗ⟩ | Chip drawer/rack khi Reservation.capacityConflict (DOM D-1) |
| `rsv.capacity_conflict_body` | Đơn có {n} người, căn {room} tối đa {max}. Chưa nhận phòng được cho tới khi đổi căn, thêm căn hoặc sửa số người sau khi hỏi khách. | This booking has {n} guests; room {room} takes {max}. It can't be checked in until you move rooms, add a room, or correct the guest count with the guest. | ⟨chừa chỗ⟩ | Alert trong drawer – thay error.CAPACITY_EXCEEDED |
| `rack.capacity_conflict` | vượt sức chứa | over capacity | ⟨chừa chỗ⟩ | Ghi chú trên thanh + aria-label rack |
| `booking.capacity_warning` | Căn {room} tối đa {max} người, đơn OTA có {n}. Vẫn lưu đơn? Ghi lý do và liên hệ khách. | Room {room} takes up to {max} guests; this OTA booking has {n}. Save it anyway? Add a reason and contact the guest. | ⟨chừa chỗ⟩ | EP02 – 422 CAPACITY_EXCEEDED_WARNING (H09, Đổi căn) |
| `booking.capacity_reason` | Lý do vẫn lưu | Reason for saving anyway | ⟨chừa chỗ⟩ | capacityWarningAckReason, ≥ 3 ký tự |
| `booking.capacity_reason_help` | Ví dụ: đã gọi khách, sẽ đổi sang căn lớn hơn khi có. | e.g. Called the guest; will move to a bigger room when one frees up. | ⟨chừa chỗ⟩ |  |
| `field.CAPACITY_EXCEEDED_WARNING` | Số khách vượt tối đa của căn. Ghi lý do để vẫn lưu đơn OTA. | More guests than the room allows. Add a reason to save the OTA booking anyway. | ⟨chừa chỗ⟩ | Mã trường – khi FE không dựng được booking.capacity_warning |
| `rack.legend_hold_urgent` | Giữ chỗ còn dưới {hours} giờ | Hold with under {hours} h left | ⟨chừa chỗ⟩ | Mẫu chú giải .bar.hold.urgent – {hours} = hold_expiry_reminder_hours |
| `field.HOLD_LIMIT_REACHED` | Bạn đang có {max} giữ chỗ chưa cọc – mức tối đa. Chốt cọc hoặc hủy bớt rồi giữ thêm. | You already have {max} unpaid holds – the limit. Confirm a deposit or cancel one before adding more. | ⟨chừa chỗ⟩ | SEC-BE-28 – field holdHours; {max} = Problem.max (FE truyền args) |
| `error.ROOM_OCCUPIED` | Căn {room} đang có khách ở trong khoảng khóa. Đổi phòng cho khách trước rồi mới khóa căn. | Room {room} has a guest in house during this block. Move the guest first, then block the room. | ⟨chừa chỗ⟩ | 409 – createRoomBlock / updateRoomBlock / createWorkOrder.block |

#### R2 Sprint 3 – lưu đồng thời / hệ thống bận, tự thử lại theo Retry-After (ĐK-S2-3, QC-S2-02; DS 6.21)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `error.CONCURRENT_UPDATE` | Người khác đang lưu cùng lúc. Dữ liệu bạn nhập vẫn còn nguyên – thử lại sau vài giây. | Someone else is saving at the same moment. What you entered is still here – try again in a few seconds. | Кто-то сохраняет данные одновременно с вами. Введённые данные на месте – попробуйте через несколько секунд. | 409 + Retry-After – server không ghi gì; FE tự thử lại (DS 6.21), giữ form; không dùng error.server |
| `error.SERVICE_UNAVAILABLE` | Hệ thống đang bận nên chưa lưu. Dữ liệu bạn nhập vẫn còn nguyên – thử lại sau vài giây. | The system is busy, so this wasn't saved. What you entered is still here – try again in a few seconds. | Система сейчас занята, поэтому данные не сохранены. Введённые данные на месте – попробуйте через несколько секунд. | 503 + Retry-After – không ghi gì; với GET: khung lỗi màn tự tải lại (DS 6.21) |
| `retry.countdown` | Tự thử lại sau {seconds} giây… | Trying again in {seconds} s… | Повторная попытка через {seconds} с… | {seconds} = Retry-After còn lại; aria-live chỉ đọc lần đầu |
| `retry.trying` | Đang thử lại… | Trying again… | Пробуем снова… |  |
| `retry.now` | Thử lại ngay | Try now | Повторить сейчас |  |
| `retry.stop` | Dừng thử lại | Stop retrying | Остановить повтор | Giữ nguyên dữ liệu form |
| `retry.done` | Đã lưu sau khi thử lại. | Saved after retrying. | Сохранено после повторной попытки. |  |
| `retry.gave_up_concurrent` | Vẫn có người đang lưu cùng chỗ này. Dữ liệu của bạn còn nguyên – bấm Thử lại, hoặc tải lại để xem thay đổi mới nhất. | Someone is still saving the same item. Your data is still here – tap Try again, or reload to see the latest changes. | Кто-то всё ещё сохраняет те же данные. Ваши данные на месте – нажмите «Повторить» или обновите страницу. | Sau 2 lần tự thử lại vẫn 409 CONCURRENT_UPDATE |
| `retry.gave_up_unavailable` | Hệ thống vẫn bận. Dữ liệu của bạn còn nguyên – thử lại sau ít phút; nếu vẫn lỗi, báo quản lý mã tham chiếu {request_id}. | The system is still busy. Your data is still here – try again in a few minutes; if it keeps failing, give your manager the reference {request_id}. | ⟨chừa chỗ⟩ | Sau 1 lần tự thử lại vẫn 503; chỉ dùng khi có Problem.requestId |
| `retry.load_countdown` | Đang tải lại sau {seconds} giây… | Reloading in {seconds} s… | ⟨chừa chỗ⟩ | GET nhận 503 – khung lỗi màn |
| `hk.queue.busy_retry` | Hệ thống bận – sẽ tự gửi lại | System busy – will resend automatically | ⟨chừa chỗ⟩ | PWA: 409 CONCURRENT_UPDATE / 503 giữ ở 'Đang chờ gửi', KHÔNG vào 'Cần xem lại' |

#### R2 Sprint 3 – rà hi-fi H13–H18 theo OpenAPI 0.3.5, BR v0.3.2, quyết định Sprint 2

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `checkin.cond.capacity` | Số khách không vượt sức chứa căn | Guest count within the room's maximum | ⟨chừa chỗ⟩ | capacity_within_max (0.3.5, DOM D-1) – không ai bỏ qua được |
| `ci.cond_capacity_ok` | {n} khách · căn {room} tối đa {max} | {n} guests · room {room} sleeps up to {max} | ⟨chừa chỗ⟩ |  |
| `ci.capacity_block_title` | Chưa nhận phòng được – vượt sức chứa | Can't check in yet – over room capacity | ⟨chừa chỗ⟩ |  |
| `ci.capacity_fix_move` | Đổi sang căn đủ chỗ | Move to a larger room | ⟨chừa chỗ⟩ |  |
| `ci.capacity_fix_guests` | Sửa số người | Edit guest count | ⟨chừa chỗ⟩ |  |
| `checkin.time` | Giờ nhận thực tế | Actual check-in time | ⟨chừa chỗ⟩ | EP03-05 1.4 checkinTime – mặc định giờ chuẩn |
| `ci.house_rules_sent` | Đã gửi/giao nội quy (VI/EN) cho khách | House rules given to the guest (VI/EN) | ⟨chừa chỗ⟩ | checkIn.houseRulesSent – bắt buộc true (0.3.3) |
| `ci.house_rules_help` | Cần tick để hoàn tất – nội quy là căn cứ khi phải thu phí phạt. | Required to finish – the house rules are the basis for any fines. | ⟨chừa chỗ⟩ |  |
| `checkin.door_handed_over` | Đã giao mã cửa/thẻ cho khách | Door code/key card handed to the guest | ⟨chừa chỗ⟩ | checkIn.doorAccessHandedOver – KHÔNG bắt buộc (PO 16/10, US-025 AC7); thay ci.door_done |
| `ci.door_optional` | Không bắt buộc. Khách đến khuya hoặc giao thẻ sau: tick ở chi tiết đơn khi đã giao. | Optional. Late arrival or handing over later: tick it on the booking once done. | ⟨chừa chỗ⟩ |  |
| `ci.submit_needs_rules` | Tick "Đã gửi/giao nội quy" để bật nút Nhận phòng. | Tick "House rules given" to enable Check in. | ⟨chừa chỗ⟩ |  |
| `checkin.done` | Đã nhận phòng căn {room}. Hạn khai báo: {deadline}. | Checked in to room {room}. Registration due: {deadline}. | ⟨chừa chỗ⟩ |  |
| `ci.shortfall_accepted` | Quản lý đã chấp nhận cọc thiếu ({who}). Phần còn lại {amount} vẫn phải thu đủ trước khi nhận phòng. | A manager accepted the short deposit ({who}). The remaining {amount} must still be paid before check-in. | ⟨chừa chỗ⟩ | DOM D-9 / BR-303 v0.3.2; balance_paid không đổi |
| `error.SURCHARGE_CHANGED` | Phụ thu vừa đổi thành {amount} (giờ hoặc giá vừa cập nhật). Xem số mới, báo khách rồi xác nhận lại. | The surcharge has just changed to {amount} (time or rate updated). Check the new amount, tell the guest, then confirm again. | ⟨chừa chỗ⟩ | 409 – Problem.surchargeVnd → {amount}; tải lại preview, bỏ tick 'đã báo khách' |
| `drawer.action.door_handed_over` | Đã giao mã/thẻ | Code/key handed over | ⟨chừa chỗ⟩ | Đơn in_house chưa có doorAccessHandedOverAt – E03-06 (0.3.6 nhóm B) |
| `ci.door_late_title` | Ghi đã giao mã/thẻ cho khách căn {room}? | Record that the code/key for room {room} was handed over? | ⟨chừa chỗ⟩ |  |
| `ci.door_late_body` | Ghi thời điểm và người giao. Ghi rồi không bỏ được. OTTIMO không lưu mã cửa. | This records the time and who handed it over. It can't be undone. OTTIMO doesn't store door codes. | ⟨chừa chỗ⟩ |  |
| `ci.door_late_done` | Đã ghi giao mã/thẻ lúc {time} · {user} | Code/key handover recorded at {time} · {user} | ⟨chừa chỗ⟩ |  |
| `rsv.door_not_handed` | Chưa ghi giao mã/thẻ | Code/key handover not recorded | ⟨chừa chỗ⟩ |  |
| `field.DOC_NUMBER_INVALID` | Số giấy tờ chưa đúng dạng: CCCD/định danh 12 chữ số; hộ chiếu 6–12 chữ hoặc số. | ID number format isn't right: citizen/personal ID 12 digits; passport 6–12 letters or digits. | ⟨chừa chỗ⟩ |  |
| `field.MAIN_GUEST_DUPLICATE` | Đơn đã có người đứng tên. Bỏ chọn ở người kia trước. | This booking already has a main guest. Unselect the other person first. | ⟨chừa chỗ⟩ |  |
| `field.ENTRY_DATE_FUTURE` | Ngày nhập cảnh không thể sau hôm nay. | Entry date can't be after today. | ⟨chừa chỗ⟩ |  |
| `field.CHECK_NOTE_REQUIRED` | Ghi cách xử lý (3–500 ký tự) cho mục Không đạt hoặc Chưa kiểm được. | Add how it was handled (3–500 characters) for any Failed or Couldn't check item. | ⟨chừa chỗ⟩ |  |
| `field.PORTAL_REFERENCE_REQUIRED` | Nhập mã hồ sơ trên cổng (3–64 ký tự: chữ, số, - / . _). | Enter the portal reference (3–64 characters: letters, digits, - / . _). | ⟨chừa chỗ⟩ |  |
| `field.DOB_FUTURE` | Ngày sinh không thể sau hôm nay. | Date of birth can't be in the future. | ⟨chừa chỗ⟩ |  |
| `field.DOB_INVALID` | Ngày sinh chưa đúng (dd/mm/yyyy). | Date of birth isn't valid (dd/mm/yyyy). | ⟨chừa chỗ⟩ |  |
| `field.DOB_MINOR` | Khách dưới {age} tuổi không tạo hồ sơ riêng. Thêm vào đơn dạng trẻ em. | Guests under {age} don't get their own profile. Add them to the booking as a child. | ⟨chừa chỗ⟩ | EP00 V-06 |
| `field.DATE_INVALID` | Ngày hoặc giờ chưa đúng dạng. | Date or time isn't valid. | ⟨chừa chỗ⟩ |  |
| `error.CONSENT_CHANGE_NOT_ALLOWED` | Ảnh giấy tờ đã được xóa nên không đổi sang "Đồng ý lưu ảnh" được nữa. | The ID photos have already been deleted, so this can't be changed to "Agree to keep photos". | ⟨chừa chỗ⟩ |  |
| `field_error.generic` | Giá trị này chưa hợp lệ – kiểm tra lại. | This value isn't valid – please check it. | ⟨chừa chỗ⟩ | Mã FieldError client chưa biết (OpenAPI: tập mã mở) |
| `field.EXTENSION_LIMIT_EXCEEDED` | Số đêm vượt số đêm trống liên tiếp. Chọn ít đêm hơn hoặc lập báo giá dài hạn. | More nights than are free in a row. Choose fewer nights or create a long-stay quote. | ⟨chừa chỗ⟩ |  |
| `field.NIGHTLY_RATES_NOT_ALLOWED` | Đơn dài hạn nhập tay không sửa giá từng đêm – tiền thuê theo hợp đồng. | Manual long-stay bookings don't take nightly rates – rent follows the contract. | ⟨chừa chỗ⟩ |  |
| `field.VISA_EXPIRES_BEFORE_DEPARTURE` | Thị thực của khách hết trước ngày đi mới. Ghi lý do để vẫn lưu và nhắc khách gia hạn. | The guest's visa ends before the new departure date. Add a reason to save anyway and remind the guest to extend it. | ⟨chừa chỗ⟩ | Cảnh báo → ô visaWarningAckReason (0.3.3) |
| `field.LATE_CHECKOUT_AFTER_LIMIT` | Giờ này quá mốc trả muộn nên tính thêm 1 đêm. Khi trả phòng: nhập giá đêm thêm. Khi khách muốn ở lại: dùng Gia hạn. | This time is past the late check-out limit, so it counts as one more night. At check-out: enter the extra night rate. If the guest is staying on: use Extend stay. | ⟨chừa chỗ⟩ | 0.3.6 bổ sung 2 (BR-416 v0.3.4, DOM S3-9): checkOut field = extraNight; setLateCheckout giữ nghĩa Gia hạn – sửa 17/10 (s3-UXD đợt 2) |
| `extend.los_reprice` | Tổng {n} đêm – giảm {pct}% theo thời gian ở, áp lại cho mọi đêm còn lại. Cọc đã thu không đổi. | {n} nights in total – the {pct}% length-of-stay discount now applies to every remaining night. Deposit paid stays the same. | ⟨chừa chỗ⟩ | DOM D-8 / BR-107 v0.3.2 – đơn Trực tiếp/CTV |
| `late.request_sent` | Đã gửi quản lý duyệt giờ trả {time}. Giờ trả chưa đổi cho tới khi được duyệt. | Sent to a manager to approve check-out at {time}. The time won't change until it's approved. | ⟨chừa chỗ⟩ | setLateCheckout 202 (requestApproval) |
| `error.MINIBAR_NOT_CHECKED` | Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất. | Minibar not checked yet. Do step 1 before finishing. | ⟨chừa chỗ⟩ |  |
| `field.MINIBAR_QTY_OVER_STANDARD` | Không quá {max} (mức chuẩn của tủ). | No more than {max} (the minibar's standard stock). | ⟨chừa chỗ⟩ |  |
| `field.MINIBAR_ITEMS_INCOMPLETE` | Nhập số còn lại cho mọi món trong tủ. | Enter what's left for every minibar item. | ⟨chừa chỗ⟩ |  |
| `field.AMOUNT_EXCEEDS_BALANCE` | Số tiền lớn hơn số còn phải thu. Giảm về đúng số còn phải thu. | The amount is more than the balance due. Lower it to the balance due. | ⟨chừa chỗ⟩ |  |
| `field.AMOUNT_EXCEEDS_LINE` | Không lớn hơn giá trị dòng. | Can't be more than the line amount. | ⟨chừa chỗ⟩ |  |
| `field.AMOUNT_INVALID` | Số tiền phải là số nguyên đồng, không âm. | Amount must be a whole number of dong, not negative. | ⟨chừa chỗ⟩ |  |
| `field.PRICE_NOT_EDITABLE` | Khoản này theo bảng phí – không sửa giá. | This item uses the fee table – the price can't be changed. | ⟨chừa chỗ⟩ |  |
| `field.DATE_RANGE_TOO_LONG` | Chọn khoảng tối đa 92 ngày. | Choose a range of 92 days or less. | ⟨chừa chỗ⟩ |  |
| `pay.recorded_by_staff` | Do {role} ghi – chờ đối soát | Recorded by {role} – awaiting reconciliation | ⟨chừa chỗ⟩ | BR-527 v0.3.2: khoản sale/CTV ghi luôn chờ đối soát, mọi cách thu |
| `pay.cash_hand_in` | Tiền mặt sale nhận phải nộp quầy – lễ tân tick khi đã nhận. | Cash taken by sales must be handed in at the desk – front desk ticks it when received. | ⟨chừa chỗ⟩ |  |
| `pay.confirm_received` | Đã thấy tiền về | Money received | ⟨chừa chỗ⟩ | confirmPaymentReceived – VietQR pending → succeeded (0.3.3) |
| `recon.filter_role` | Người ghi | Recorded by | ⟨chừa chỗ⟩ |  |
| `recon.commission_note` | Hoa hồng của người ghi chỉ thành "đạt" sau khi khoản này được đối soát. | The recorder's commission only counts once this payment is reconciled. | ⟨chừa chỗ⟩ | ESC-017 A / BR-527 |
| `mlog.a_shortfall_accepted` | Chấp nhận cọc thiếu · còn thiếu {amount} | Short deposit accepted · {amount} short | ⟨chừa chỗ⟩ | confirmDeposit.acceptShortfallReason MGR+ (0.3.6 nhóm B, DOM D-9) |
| `mlog.a_closer_changed` | Đổi người chốt: {from} → {to} | Closer changed: {from} → {to} | ⟨chừa chỗ⟩ | reservation.closer_changed (SEC-BE-26) |
| `mlog.a_staff_payment` | Sale/CTV ghi nhận thu · chờ đối soát | Sales/agent recorded a payment · awaiting reconciliation | ⟨chừa chỗ⟩ | payment.recorded khi recordedByRole = sales_staff/collaborator (BR-527) – s3-UXD bỏ 'cọc · tiền mặt' cứng |
| `error.ONLINE_CHECKIN_CLOSED` | Thủ tục online đã đóng – lễ tân đã nhận giấy tờ hoặc bạn đã nhận phòng. Cần hỗ trợ, gọi lễ tân. | Online check-in is closed – the front desk already has your documents or you've checked in. Need help? Call the front desk. | Онлайн-регистрация закрыта – администратор уже получил ваши документы или вы уже заселились. Нужна помощь? Позвоните администратору. | 409 (0.3.3 E06-06) – hiện trạng thái 18.5 |
| `field.FILE_TYPE` | Chỉ nhận ảnh JPG, PNG hoặc WebP. | Only JPG, PNG or WebP photos. | Принимаются только фото JPG, PNG или WebP. |  |
| `field.FILE_TOO_LARGE` | Ảnh lớn hơn 10 MB – chụp lại hoặc chọn ảnh nhỏ hơn. | The photo is over 10 MB – retake it or choose a smaller one. | Фото больше 10 МБ – переснимите или выберите фото поменьше. |  |
| `field.TOO_MANY_FILES` | Đã đủ số ảnh tối đa cho người này. | You've reached the photo limit for this person. | Для этого гостя загружено максимальное число фото. |  |

#### R2 Sprint 3 – ESC-016 A: phí dọn thêm trên guest-web (H23)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `gw.req.clean_makeup_free` | Hôm nay căn chưa được dọn – lần dọn này miễn phí. | Your room hasn't been cleaned today – this clean is free. | Сегодня у вас ещё не убирали – эта уборка бесплатна. | Khách ngắn ngày, chưa có lần dọn đầy đủ trong ngày (dọn bù) – feeVnd = 0 |
| `gw.req.clean_second_fee` | Căn đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}. | Your room had a full clean at {time} today. Another full clean costs {amount}. | Сегодня в {time} у вас уже была полная уборка. Ещё одна полная уборка стоит {amount}. | Khách ngắn ngày, lần dọn đầy đủ thứ hai trong ngày (ESC-016 A) |
| `gw.req.clean_long_fee` | Gói thuê dài hạn của bạn chưa gồm dọn phòng. Mỗi lần dọn có phí {amount}. | Your long-stay rent doesn't include cleaning. Each clean costs {amount}. | Долгосрочная аренда не включает уборку. Каждая уборка стоит {amount}. | Khách dài hạn – dọn lẻ BR-506/BR-204 |
| `gw.req.clean_what_long` | Gồm lau dọn, thay ga gối, vệ sinh nhà tắm và bếp. | Includes cleaning, fresh bed linen, bathroom and kitchen. | Уборка, смена постельного белья, ванная и кухня. | Bản cho khách dài hạn (không có câu 'dọn hằng ngày miễn phí') |
| `gw.req.clean_fee_rule` | Hôm nay chưa dọn: miễn phí. Đã dọn đầy đủ rồi mà muốn dọn lần nữa: {amount}. Thuê dài hạn: {amount}/lần. | Not cleaned yet today: free. Already had a full clean and want another: {amount}. Long stays: {amount} each time. | Сегодня ещё не убирали: бесплатно. Полная уборка уже была и нужна ещё одна: {amount}. Долгосрочное проживание: {amount} за раз. | Dự phòng khi chưa có listGuestRequestOptions (không biết phí của chính khách) – nêu đủ quy tắc ESC-016 A |
| `gw.req.towels_free` | Thay khăn, bổ sung đồ dùng luôn miễn phí. | Fresh towels and supplies are always free. | Смена полотенец и пополнение принадлежностей – всегда бесплатно. |  |
| `gw.req.not_available` | Yêu cầu này dùng được khi bạn đã nhận phòng. | You can use this once you've checked in. | Этим можно воспользоваться после заезда. | EP14 3.1 guest.req.not_available → tên R2 gw.req.* |
| `field.REQUEST_TYPE_NOT_AVAILABLE` | Yêu cầu này dùng được khi bạn đã nhận phòng. | You can use this once you've checked in. | Этим можно воспользоваться после заезда. | 422 mã trường (ARC B-14) |
| `field.FEE_NOT_ACCEPTED` | Tick đồng ý phí để gửi yêu cầu này. | Tick to agree to the fee before sending. | Отметьте согласие с оплатой, чтобы отправить запрос. | 422 mã trường (ARC B-16, 0.3.6) |
| `gw.req.note_required` | Mô tả ngắn giúp chúng tôi xử lý nhanh hơn. | A short description helps us sort it out faster. | Короткое описание поможет нам справиться быстрее. | EP14 3.2 guest.req.note_required |
| `gw.req.card_detected` | Vui lòng không ghi số thẻ thanh toán. | Please don't include a payment card number. | Пожалуйста, не указывайте номер платёжной карты. | EP14 3.2 guest.req.card_detected |
| `gw.req.too_many` | Bạn đã gửi nhiều yêu cầu hôm nay. Vui lòng gọi lễ tân {phone}. | You've sent a lot of requests today. Please call the front desk on {phone}. | Сегодня вы отправили много запросов. Пожалуйста, позвоните администратору: {phone}. | 429 – EP14 guest.req.too_many |

#### R2 Sprint 3 – bổ sung FE: hoàn tiền, trả thừa, tiền mặt sale nộp quầy, người đi cùng (EP03-05 v0.2)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `refund.title` | Hoàn tiền | Refunds | ⟨chừa chỗ⟩ | Tab màn Tiền – thay lt.settlement.refund (chuỗi đó là dòng quyết toán dài hạn) |
| `refund.method` | Cách hoàn | Refund method | ⟨chừa chỗ⟩ | EP03-05 2.6.1 |
| `refund.method.original_method` | Cùng cách khách đã trả | Same way the guest paid | ⟨chừa chỗ⟩ | Thẻ POS → hoàn qua máy POS |
| `refund.bank_bin` | Ngân hàng nhận | Receiving bank | ⟨chừa chỗ⟩ |  |
| `refund.account_no` | Số tài khoản | Account number | ⟨chừa chỗ⟩ | C3 – chỉ ghi, sau khi lưu chỉ hiện dạng che |
| `refund.account_holder` | Tên chủ tài khoản | Account holder name | ⟨chừa chỗ⟩ |  |
| `refund.holder_differs` | Tên chủ tài khoản khác tên khách – xác nhận với khách. | The account holder's name differs from the guest's – confirm with the guest. | ⟨chừa chỗ⟩ | Cảnh báo, không chặn |
| `refund.set_destination` | Nhập nơi nhận hoàn | Enter refund destination | ⟨chừa chỗ⟩ | setRefundDestination |
| `refund.execute_cash` | Chi hoàn tiền mặt | Pay cash refund | ⟨chừa chỗ⟩ | executeCashRefund – FD+ (A47a) |
| `refund.execute_transfer` | Ghi đã hoàn chuyển khoản / qua máy POS | Record transfer / card terminal refund | ⟨chừa chỗ⟩ | executeRefund – MGR/OWN (A47) |
| `refund.proof` | Ảnh chứng từ (ủy nhiệm chi hoặc biên nhận có chữ ký khách) | Proof photo (transfer slip or receipt signed by the guest) | ⟨chừa chỗ⟩ |  |
| `refund.bank_reference` | Mã giao dịch ngân hàng / mã hoàn POS | Bank transaction ref / card refund code | ⟨chừa chỗ⟩ |  |
| `refund.transfer_waits_manager` | Hoàn chuyển khoản do quản lý thực hiện – báo khách thời hạn. | Transfer refunds are made by a manager – tell the guest when to expect it. | ⟨chừa chỗ⟩ |  |
| `refund.request_overpayment` | Đề nghị hoàn {amount} | Request a refund of {amount} | ⟨chừa chỗ⟩ | Spec ghi {creditVnd} – FE truyền {amount} |
| `refund.requested` | Đã gửi đề nghị hoàn – chờ quản lý duyệt. | Refund request sent – waiting for a manager to approve. | ⟨chừa chỗ⟩ |  |
| `refund.paid` | Đã ghi hoàn {amount}. | Refund of {amount} recorded. | ⟨chừa chỗ⟩ |  |
| `refund.show_account` | Xem đủ số tài khoản | Show full account number | ⟨chừa chỗ⟩ | getRefundDestination – xác nhận lại mật khẩu, ghi nhật ký C3 |
| `refund.self_execute_forbidden` | Khoản hoàn do bạn tạo cần người khác chi. | A refund you requested must be paid out by someone else. | ⟨chừa chỗ⟩ | 403 SELF_APPROVAL_FORBIDDEN ở executeRefund/executeCashRefund – thay error.SELF_APPROVAL_FORBIDDEN trong ngữ cảnh chi hoàn |
| `error.REFUND_DESTINATION_REQUIRED` | Chưa có nơi nhận hoàn (hoặc vừa đổi) – nhập hoặc duyệt lại. | No refund destination yet (or it just changed) – enter it or approve it again. | ⟨chừa chỗ⟩ |  |
| `error.REFUND_EXCEEDS_APPROVED` | Còn được hoàn tối đa {max}. | You can refund at most {max}. | ⟨chừa chỗ⟩ | 422 – Problem.max → {max} |
| `error.OVERPAYMENT_HANDLING_REQUIRED` | Khách đã trả thừa – chọn cách xử lý trước khi hoàn tất. | The guest has overpaid – choose how to handle it before finishing. | ⟨chừa chỗ⟩ |  |
| `checkout.blocked_credit` | Khách đã trả thừa {amount}. Chọn cách xử lý. | The guest has overpaid {amount}. Choose how to handle it. | ⟨chừa chỗ⟩ | Spec ghi {x} – FE truyền {amount} |
| `checkout.overpay.refund_request` | Hoàn lại khách {amount} (tạo đề nghị hoàn) | Refund {amount} to the guest (creates a refund request) | ⟨chừa chỗ⟩ |  |
| `checkout.overpay.retain` | Khách đồng ý để lại khoản thừa – chỉ quản lý trở lên | Guest agrees to leave the overpayment – managers only | ⟨chừa chỗ⟩ | retain_with_guest_consent; FD/FDL → 403 |
| `checkout.late_recalc` | Phụ thu trả muộn đã ghi {old} → theo giờ trả thực tế {new}. | Late check-out charge recorded {old} → {new} at the actual check-out time. | ⟨chừa chỗ⟩ |  |
| `pay.confirm_cash_handover` | Đã nhận tiền mặt | Cash received | ⟨chừa chỗ⟩ | confirmCashHandover – FD+ (A46a) |
| `pay.cash_handover_title` | Tiền mặt sale/CTV nộp quầy | Cash handed in by sales/agents | ⟨chừa chỗ⟩ |  |
| `pay.cash_handover_mismatch` | Số tiền nhận khác số sale/CTV đã ghi ({amount}). Báo quản lý. | The amount received differs from what sales/agent recorded ({amount}). Tell a manager. | ⟨chừa chỗ⟩ | 422 AMOUNT_INVALID của confirmCashHandover |
| `pay.receiving_account_changed` | Tài khoản nhận vừa đổi trong 24 giờ qua – đọc lại tên và số tài khoản với khách trước khi khách chuyển. | The receiving account changed in the last 24 hours – read the name and account number back to the guest before they pay. | ⟨chừa chỗ⟩ | SEC F3 – receivingAccountRecentlyChanged |
| `party.missing` | Thiếu {n} người | {n} guest(s) missing | ⟨chừa chỗ⟩ |  |
| `party.remove` | Bỏ khỏi đơn | Remove from booking | ⟨chừa chỗ⟩ |  |
| `party.remove_confirm` | Bỏ {name} khỏi đơn? Giấy tờ và ảnh của người này sẽ bị xóa ngay. | Remove {name} from the booking? Their ID details and photos will be deleted immediately. | ⟨chừa chỗ⟩ |  |
| `party.remove_registered` | Người này đã khai trên cổng – cập nhật trên cổng. | This person is already registered on the portal – update it there. | ⟨chừa chỗ⟩ |  |
| `party.reduce_count` | Giảm số khách của đơn xuống {n}? | Lower the booking's guest count to {n}? | ⟨chừa chỗ⟩ |  |
| `room_change.door_reminder` | Thu thẻ cũ, giao thẻ/mã căn {room}. | Collect the old key card; hand over the card/code for room {room}. | ⟨chừa chỗ⟩ |  |
| `checkin.fix_guest_count` | Sửa số khách thực tế | Fix actual guest count | ⟨chừa chỗ⟩ | DOM G-6 – nút trong dòng điều kiện sức chứa |
| `checkin.time_hint` | Giờ khách vào căn – gửi hành lý không tính phụ thu. | Time the guest goes into the room – leaving luggage early isn't charged. | ⟨chừa chỗ⟩ |  |
| `checkin.verify.visa_at_arrival` | Thị thực còn hạn tại ngày nhận phòng | Visa valid on the check-in date | ⟨chừa chỗ⟩ | visa_valid_at_arrival (E06-01) – Không đạt thì chặn |
| `checkin.verify.stay_within_visa` | Ngày đi khai báo không vượt hạn tạm trú | Registered departure within the permitted stay | ⟨chừa chỗ⟩ | stay_within_visa – không chặn |
| `mlog.date_from` | Từ ngày | From | ⟨chừa chỗ⟩ |  |
| `mlog.date_to` | Đến ngày | To | ⟨chừa chỗ⟩ |  |
| `rooms.future_keep` | Căn còn {n} đơn tương lai – các đơn này giữ nguyên, đổi căn nếu cần. | This room has {n} future booking(s) – they stay as they are; move them if needed. | ⟨chừa chỗ⟩ |  |
| `bill.ota_prepaid` | Tiền phòng {n} đêm – đã thanh toán qua {channel} | Room charge, {n} nights – paid via {channel} | ⟨chừa chỗ⟩ | Đơn ota_prepaid (G-13) |
| `bill.refund` | Đã hoàn {amount} ({method}) | Refunded {amount} ({method}) | ⟨chừa chỗ⟩ |  |
| `bill.refund_due` | Hoàn lại khách {amount} | Refund due to guest {amount} | ⟨chừa chỗ⟩ | Còn phải thu âm |
| `folio.post_checkout_tag` | Phát sinh sau trả phòng | Added after check-out | ⟨chừa chỗ⟩ | BR-427 c |
| `charge.room_change_difference` | Chênh lệch đổi phòng | Room change difference | ⟨chừa chỗ⟩ | Đơn OTA đổi phòng theo yêu cầu khách |
| `invoice.address` | Địa chỉ công ty | Company address | ⟨chừa chỗ⟩ |  |

#### R2 Sprint 3 – bổ sung MOB guest-web: điều hướng, loại giấy tờ, bổ sung tại quầy, trạng thái đã làm thủ tục (H18)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `gw.nav_label` | Điều hướng chính | Main navigation | Основная навигация |  |
| `gw.steps_label` | Các bước làm thủ tục | Check-in steps | Шаги регистрации |  |
| `gw.doc_type` | Loại giấy tờ | Document type | Тип документа | Thay checkin.docs.field.doc_type (chuỗi Desk) |
| `gw.doc.passport` | Hộ chiếu | Passport | Паспорт | Đặt trước khi ngôn ngữ ≠ vi |
| `gw.doc.cccd` | CCCD (người Việt Nam) | Vietnamese ID card (CCCD) | Вьетнамское удостоверение (CCCD) | Thay ci.doc.cccd – khách nước ngoài không biết chữ CCCD |
| `gw.doc_type_first` | Chọn loại giấy tờ để bật nút Chụp. | Choose the document type to enable Take photo. | Выберите тип документа, чтобы включить кнопку «Сфотографировать». |  |
| `gw.doc_hint.passport` | Chụp trang có ảnh; thêm trang thị thực / dấu nhập cảnh nếu có. | Photograph the photo page; add the visa / entry stamp page if you have one. | Сфотографируйте страницу с фото; добавьте страницу с визой / штампом о въезде, если есть. |  |
| `gw.doc_hint.cccd` | Chụp mặt trước và mặt sau. | Photograph the front and the back. | Сфотографируйте лицевую и оборотную стороны. |  |
| `gw.defer_at_desk` | Bổ sung tại quầy | Add at reception | Предъявить на стойке | deferredPeople[] (E06-06) |
| `gw.defer_help` | Chưa có giấy tờ của người này? Mang bản gốc khi đến – lễ tân chụp tại quầy. | Don't have this person's ID now? Bring the original – reception will scan it when you arrive. | Нет документа этого гостя под рукой? Возьмите оригинал – администратор отсканирует его при заезде. |  |
| `gw.deferred` | Sẽ bổ sung tại quầy | Will be added at reception | Будет предъявлен на стойке |  |
| `gw.defer_undo` | Chụp ngay | Take photo now | Сфотографировать сейчас |  |
| `gw.docs_have_deferred` | Đã có giấy tờ của {n}/{m} khách · {k} khách bổ sung tại quầy | IDs received for {n}/{m} guests · {k} will show ID at reception | Документы получены: {n}/{m} гостей · {k} предъявят на стойке |  |
| `gw.oci_done_card_title` | Đã làm thủ tục trước | Online check-in done | Онлайн-регистрация пройдена |  |
| `gw.oci_done_card_body` | Đã gửi giấy tờ của {n}/{m} khách · dự kiến đến {eta}. Khi đến, lễ tân chỉ cần đối chiếu bản gốc. | IDs sent for {n}/{m} guests · arriving around {eta}. At reception, staff just check the originals. | Документы отправлены: {n}/{m} гостей · прибытие около {eta}. На стойке администратор только сверит оригиналы. |  |
| `gw.oci_done_card_deferred` | {k} khách bổ sung giấy tờ tại quầy. | {k} guest(s) will show ID at reception. | Гостей, которые предъявят документы на стойке: {k}. |  |
| `gw.oci_done_card_view` | Xem lại | View | Посмотреть |  |
| `gw.error_server` | Hệ thống đang gặp sự cố. Thử lại sau ít phút; nếu vẫn lỗi, nhắn OTTIMO kèm mã {request_id}. | Something went wrong on our side. Try again in a few minutes; if it keeps happening, message OTTIMO with the code {request_id}. | У нас произошла ошибка. Попробуйте через несколько минут; если не получится, напишите OTTIMO и укажите код {request_id}. | Thay error.INTERNAL_ERROR ở guest-web (câu đó bảo 'báo quản lý' – dành cho nhân viên) |

#### R2 Sprint 3 – nhãn dữ liệu khai báo trên cổng (getPortalData, BE-C) + ô giấy tờ EP06 2.3

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `reg.field.full_name` | Họ và tên | Full name | ⟨chừa chỗ⟩ | PortalData.people[].fields[].label – thứ tự do server (BE-C), chữ theo biểu mẫu cổng |
| `reg.field.date_of_birth` | Ngày, tháng, năm sinh | Date of birth | ⟨chừa chỗ⟩ |  |
| `reg.field.gender` | Giới tính | Sex | ⟨chừa chỗ⟩ | Giá trị: reg.value.gender.* |
| `reg.field.nationality` | Quốc tịch | Nationality | ⟨chừa chỗ⟩ |  |
| `reg.field.passport_number` | Số hộ chiếu | Passport number | ⟨chừa chỗ⟩ |  |
| `reg.field.passport_expiry` | Ngày hết hạn hộ chiếu | Passport expiry date | ⟨chừa chỗ⟩ |  |
| `reg.field.visa_kind` | Diện nhập cảnh | Entry status | ⟨chừa chỗ⟩ | Giá trị: reg.value.visa_kind.* |
| `reg.field.visa_number` | Số thị thực / thẻ tạm trú | Visa / residence card number | ⟨chừa chỗ⟩ |  |
| `reg.field.visa_valid_until` | Thị thực / tạm trú có giá trị đến | Visa / permitted stay valid until | ⟨chừa chỗ⟩ |  |
| `reg.field.entry_date` | Ngày nhập cảnh | Entry date | ⟨chừa chỗ⟩ |  |
| `reg.field.entry_port` | Cửa khẩu nhập cảnh | Port of entry | ⟨chừa chỗ⟩ |  |
| `reg.field.entry_purpose` | Mục đích nhập cảnh | Purpose of entry | ⟨chừa chỗ⟩ |  |
| `reg.field.arrival_date` | Ngày đến | Arrival date | ⟨chừa chỗ⟩ |  |
| `reg.field.departure_date` | Ngày đi (dự kiến) | Departure date (expected) | ⟨chừa chỗ⟩ | NN: không vượt hạn thị thực (BR-605) – server đã tính |
| `reg.field.room_no` | Số phòng | Room number | ⟨chừa chỗ⟩ | Giữ chữ 'phòng' theo biểu mẫu cổng (giao diện OTTIMO dùng 'căn') |
| `reg.field.id_number` | Số định danh cá nhân / CCCD | Personal ID / citizen ID number | ⟨chừa chỗ⟩ |  |
| `reg.field.address` | Địa chỉ thường trú | Permanent address | ⟨chừa chỗ⟩ |  |
| `reg.value.gender.male` | Nam | Male | ⟨chừa chỗ⟩ | Giá trị enum gender – client đổi sang chữ trước khi sao chép |
| `reg.value.gender.female` | Nữ | Female | ⟨chừa chỗ⟩ |  |
| `reg.value.gender.other` | Khác | Other | ⟨chừa chỗ⟩ |  |
| `reg.value.visa_kind.visa` | Thị thực | Visa | ⟨chừa chỗ⟩ |  |
| `reg.value.visa_kind.visa_exempt` | Miễn thị thực | Visa exemption | ⟨chừa chỗ⟩ |  |
| `reg.value.visa_kind.temp_residence_card` | Thẻ tạm trú | Temporary residence card | ⟨chừa chỗ⟩ |  |
| `reg.value.empty` | Không có – để trống trên cổng | None – leave blank on the portal | ⟨chừa chỗ⟩ | Trường không có giá trị: không có nút Sao chép |
| `checkin.docs.field.gender` | Giới tính | Sex | ⟨chừa chỗ⟩ | EP06 2.3 (mới) – chỉ hiện khi biểu mẫu cổng cần |
| `checkin.docs.field.passport_issue_date` | Ngày cấp | Date of issue | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.issuing_place` | Nơi cấp | Place of issue | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.visa_kind` | Diện nhập cảnh | Entry status | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.visa_number` | Số thị thực / thẻ tạm trú | Visa / residence card number | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.entry_port` | Cửa khẩu nhập cảnh | Port of entry | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.entry_purpose` | Mục đích nhập cảnh | Purpose of entry | ⟨chừa chỗ⟩ |  |
| `checkin.docs.field.address` | Địa chỉ thường trú | Permanent address | ⟨chừa chỗ⟩ | Chỉ hiện khi cổng yêu cầu (R-REG-04) |

#### R2 Sprint 3 – review FE H13–H17 + MOB guest-web (rounds/round-02/reviews/s3-UXD.md)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `checkin.steps_label` | Các bước nhận phòng | Check-in steps | ⟨chừa chỗ⟩ | aria-label của ol.progress-steps (thay checkin.cond.title) – FB-R2-UXD-FE-S3-14 |
| `checkout.steps_label` | Các bước trả phòng | Check-out steps | ⟨chừa chỗ⟩ | aria-label của ol.progress-steps H16 |
| `ci.submit_needs_told` | Tick "Tôi đã báo khách khoản phụ thu này" để bật nút Nhận phòng. | Tick "I've told the guest about this surcharge" to enable Check in. | ⟨chừa chỗ⟩ | Lý do nút khóa (aria-describedby) – FE-S3-04 |
| `ci.submit_needs_conditions` | Còn {n} điều kiện chưa đủ ở danh sách Điều kiện nhận phòng – xử lý xong mới nhận phòng được. | {n} check-in condition(s) still unmet – resolve them in the conditions list first. | ⟨chừa chỗ⟩ | Lý do nút khóa – FE-S3-04 |
| `ci.request_title` | Gửi lễ tân trưởng xác nhận nhận phòng căn {room}? | Send check-in for room {room} to a senior receptionist? | ⟨chừa chỗ⟩ | FD + buồng chưa sẵn sàng (202) – FE-S3-05 |
| `ci.request_effect` | Yêu cầu được gửi lễ tân trưởng. Đơn vẫn "Đã xác nhận" cho tới khi có người xác nhận; quản lý nhận thông báo. | The request goes to a senior receptionist. The booking stays "Confirmed" until someone approves; managers are notified. | ⟨chừa chỗ⟩ | Thân hộp xác nhận khi FD gửi yêu cầu – FE-S3-05 |
| `ci.cond_doc_check_pending` | Chưa có giấy tờ để kiểm – hệ thống kiểm ngay khi nhập giấy tờ khách nước ngoài. | No ID to check yet – it's checked as soon as a foreign guest's ID is entered. | ⟨chừa chỗ⟩ | document_check_block khi đơn chưa có giấy tờ (không hiện 'Đã đủ' – DS 6.4) – FE-S3-18 |
| `checkin.verify.empty` | Chưa có giấy tờ để kiểm. Nhập giấy tờ ở bước 1 – hạn hộ chiếu, thị thực được kiểm ngay khi có dữ liệu. | No IDs to check yet. Add them in step 1 – passport and visa dates are checked as soon as they're in. | ⟨chừa chỗ⟩ | Trạng thái rỗng bước Kiểm tra – FE-S3-12 |
| `checkin.warn.visa_expires_before_departure` | Thị thực của khách hết hạn trước ngày trả phòng – khai báo đến hạn thị thực và nhắc khách gia hạn. | A guest's visa expires before check-out – register up to the visa expiry date and remind the guest to extend it. | ⟨chừa chỗ⟩ | previewCheckIn.warnings[] – thay w.detail thô – FE-S3-13 |
| `checkin.warn.passport_expires_during_stay` | Hộ chiếu của khách hết hạn trong thời gian ở – vẫn nhận phòng được, ghi cách xử lý ở bước Kiểm tra. | A guest's passport expires during the stay – check-in can go ahead; record the handling in the Check step. | ⟨chừa chỗ⟩ | previewCheckIn.warnings[] – FE-S3-13 |
| `ci.view_hide` | Ẩn số | Hide number | ⟨chừa chỗ⟩ | Nút Xem đủ số khi đang hiện – FE-S3-14 |
| `ci.full_autohide` | Tự ẩn sau {seconds} giây hoặc khi rời tab. | Hides after {seconds} s or when you leave the tab. | ⟨chừa chỗ⟩ | Cạnh số giấy tờ đầy đủ (EP06 0) – FE-S3-22 |
| `reg2.portal_autohide` | Dữ liệu tự ẩn sau {minutes} phút hoặc khi rời tab. Dán xong, bấm "Xóa bộ nhớ tạm". | The data hides after {minutes} min or when you leave the tab. When you've finished pasting, tap "Clear clipboard". | ⟨chừa chỗ⟩ | Bảng dữ liệu cổng – FE-S3-22 |
| `reg2.retention_pending` | Ngày tự xóa hiện sau khi khách trả phòng. | The deletion date appears after check-out. | ⟨chừa chỗ⟩ | imageRetentionUntil chưa có – FE-S3-12 |
| `reg2.deadline_pending` | Chưa tính hạn | Deadline not set yet | ⟨chừa chỗ⟩ | deadlineAt chưa có – FE-S3-12 |
| `common.duration_hm` | {h} giờ {m} phút | {h} h {m} min | ⟨chừa chỗ⟩ | Thời lượng (content-guide 4) – dùng cho reg.deadline_left/overdue thay 'h:mm' |
| `common.duration_m` | {m} phút | {m} min | ⟨chừa chỗ⟩ | Thời lượng < 1 giờ |
| `party.kind.adult` | Người lớn đi cùng | Adult companion | ⟨chừa chỗ⟩ | Seg loại người (thay rsv.add_person) – FE-S3-14 |
| `party.child_birth_year` | Năm sinh | Year of birth | ⟨chừa chỗ⟩ | Ô năm sinh trẻ em (thay checkin.docs.field.dob) |
| `party.reduce_count_body` | Số khách dùng để tính phụ thu người và sức chứa căn. Chỉ giảm khi người này thật sự không ở nữa. | The guest count drives the extra-person charge and room capacity. Only lower it if this person is really no longer staying. | ⟨chừa chỗ⟩ | Thân hộp party.reduce_count (thay booking.field.guests) |
| `party.reduce_submit` | Giảm còn {n} người | Lower to {n} | ⟨chừa chỗ⟩ | Nút xác nhận (thay common.save) |
| `stay.charge_choose` | Chọn khoản phát sinh | Choose a charge | ⟨chừa chỗ⟩ | Placeholder ô khoản phát sinh (thay rsv.choose_reason) |
| `room_change.price_same` | Giữ giá cũ – không phát sinh chênh lệch. | Old rate kept – nothing extra to pay. | ⟨chừa chỗ⟩ | Xem trước đổi phòng (dryRun) – thay ghép chuỗi |
| `room_change.price_delta` | Chênh lệch theo giá căn mới: {amount} – ghi vào folio khi đổi. | Difference at the new room's rate: {amount} – posted to the folio on the move. | ⟨chừa chỗ⟩ | {amount} kèm dấu +/− và đơn vị |
| `room_change.no_rooms` | Không còn căn sẵn sàng đủ chỗ từ {from} đến {to}. Hỏi quản lý, hoặc giữ khách ở căn hiện tại. | No ready room with enough space from {from} to {to}. Ask a manager, or keep the guest in the current room. | ⟨chừa chỗ⟩ | Trạng thái rỗng danh sách căn – FE-S3-12 |
| `stay.toast.extended` | Đã gia hạn {n} đêm – trả phòng {date}. | Extended by {n} night(s) – check-out {date}. | ⟨chừa chỗ⟩ | Thay common.saved |
| `stay.toast.late_set` | Đã hẹn trả muộn lúc {time}. | Late check-out set for {time}. | ⟨chừa chỗ⟩ | Thay common.saved |
| `stay.toast.moved` | Đã đổi sang căn {room}. Thu thẻ cũ và giao mã/thẻ mới. | Moved to room {room}. Collect the old card and hand over the new code/card. | ⟨chừa chỗ⟩ | Thay common.saved |
| `stay.toast.charge_added` | Đã thêm "{item}" vào folio. | Added "{item}" to the folio. | ⟨chừa chỗ⟩ | Thay common.saved |
| `stay.toast.undo_checkin` | Đã hoàn tác nhận phòng căn {room}. | Check-in for room {room} undone. | ⟨chừa chỗ⟩ | Thay common.saved |
| `late.arrival_warning_alt` | Căn {room} có khách đến lúc {eta}. Còn căn cùng nhóm để xếp cho khách đến. | Room {room} has a guest arriving at {eta}. There's still a same-group room for the arriving guest. | ⟨chừa chỗ⟩ | Thay late.arrival_warning khi API không trả danh sách căn ({rooms} = '–') |
| `pay.vietqr_create` | Tạo VietQR · {amount} | Create VietQR · {amount} | ⟨chừa chỗ⟩ | Thay ghép pay.vietqr + số tiền – FE-S3-14 |
| `pay.qr_label` | Mã VietQR: chuyển {amount}, nội dung {ref} | VietQR code: transfer {amount}, reference {ref} | ⟨chừa chỗ⟩ | aria-label QR (DS C25) |
| `pay.qr_account` | Tài khoản nhận: {account} | Receiving account: {account} | ⟨chừa chỗ⟩ | Dòng riêng, không dính nội dung CK – FE-S3-07 |
| `pay.copy_ref` | Sao chép nội dung | Copy reference | ⟨chừa chỗ⟩ | Thay rsv.copy_qr (chép chung nội dung + số tiền) |
| `pay.copy_amount` | Sao chép số tiền | Copy amount | ⟨chừa chỗ⟩ |  |
| `pay.cash_short` | Khách đưa thiếu {amount}. | {amount} short. | ⟨chừa chỗ⟩ | Tiền mặt nhận < số cần thu |
| `checkout.overpay.needs_reason` | Ghi lý do xử lý tiền khách trả thừa để bật nút Hoàn tất. | Enter a reason for handling the overpayment to enable Complete. | ⟨chừa chỗ⟩ | Lý do nút khóa – FE-S3-04 |
| `bill.col_desc` | Nội dung | Description | ⟨chừa chỗ⟩ | Tiêu đề cột Phiếu thanh toán – song ngữ dùng .en |
| `bill.col_amount` | Số tiền (đ) | Amount (VND) | ⟨chừa chỗ⟩ | Đơn vị nằm ở tiêu đề cột; ô số giữ số trần |
| `bill.paid` | Đã thu | Paid | ⟨chừa chỗ⟩ | Dòng tổng đã thu trên phiếu (thay bill.deposit 'Đã cọc / đã thu') |
| `bill.issued_at` | Lập lúc {time} | Issued {time} | ⟨chừa chỗ⟩ |  |
| `bill.tax_code` | MST {code} | Tax ID {code} | ⟨chừa chỗ⟩ |  |
| `bill.preview_note` | Bản xem trước – số phiếu được cấp khi hoàn tất trả phòng. | Preview – the folio number is issued at check-out. | ⟨chừa chỗ⟩ | billNo chưa có |
| `bill.lang_label` | Ngôn ngữ phiếu | Folio language | ⟨chừa chỗ⟩ | Nhãn Seg co.bill_vi / co.bill_vien |
| `recon.empty_title` | Không có khoản nào chờ đối soát | Nothing awaiting reconciliation | ⟨chừa chỗ⟩ | Thay mlog.empty_title ở tab Chờ đối soát – FE-S3-12 |
| `recon.empty_body` | Chuyển khoản, VietQR lễ tân ghi và tiền sale/CTV ghi sẽ hiện ở đây tới khi được đối soát. | Transfers and VietQR payments recorded at the desk, and money recorded by sales/agents, appear here until reconciled. | ⟨chừa chỗ⟩ |  |
| `recon.cash_received_toast` | Đã nhận tiền mặt {amount} của {code}. | Cash {amount} for {code} received. | ⟨chừa chỗ⟩ | Thay co.recon_ok cho tiền mặt nộp quầy |
| `refund.empty_title` | Không có khoản hoàn nào cần xử lý | No refunds to handle | ⟨chừa chỗ⟩ | Thay approval.empty_* ở tab Hoàn tiền – FE-S3-12 |
| `refund.empty_body` | Đề nghị hoàn từ trả thừa, hủy đơn hoặc trả sớm sẽ hiện ở đây. | Refund requests from overpayments, cancellations or early check-outs appear here. | ⟨chừa chỗ⟩ |  |
| `refund.method_label` | Cách hoàn: {method} | Refund method: {method} | ⟨chừa chỗ⟩ | Thay ghép refund.method + ':' |
| `refund.execute_effect_cash` | Ghi đã chi {amount} tiền mặt cho khách. Không sửa được sau khi ghi; ảnh biên nhận có chữ ký của khách lưu cùng giao dịch. | Records {amount} paid to the guest in cash. It can't be edited afterwards; the receipt photo signed by the guest is kept with the transaction. | ⟨chừa chỗ⟩ | Hậu quả trong hộp chi hoàn (DS 6.1) – FE-S3-11 |
| `refund.execute_effect_transfer` | Ghi đã chuyển {amount} cho khách. Chỉ ghi sau khi ngân hàng báo chuyển thành công. | Records {amount} transferred to the guest. Only record it once the bank confirms the transfer. | ⟨chừa chỗ⟩ | FE-S3-11 |
| `approval.type.room_not_ready` | Nhận phòng khi buồng chưa sẵn sàng | Check-in before the room is ready | ⟨chừa chỗ⟩ | Thay checkin.cond.room_ready (tên điều kiện) – FE-S3-10 |
| `approval.type.late_checkout` | Trả muộn khi có khách đến cùng ngày | Late check-out with a same-day arrival | ⟨chừa chỗ⟩ |  |
| `approval.type.no_show_restore` | Khôi phục đơn không đến | Restore a no-show booking | ⟨chừa chỗ⟩ |  |
| `approval.approve_title.refund` | Duyệt hoàn {amount} cho {code}? | Approve a refund of {amount} for {code}? | ⟨chừa chỗ⟩ | Thay approval.approve_title ('Duyệt miễn') cho type=refund |
| `approval.approve_title.room_not_ready` | Cho {code} nhận phòng khi buồng chưa sẵn sàng? | Let {code} check in before the room is ready? | ⟨chừa chỗ⟩ |  |
| `approval.approve_title.late_checkout` | Duyệt trả muộn cho {code} dù có khách đến cùng ngày? | Approve late check-out for {code} despite a same-day arrival? | ⟨chừa chỗ⟩ |  |
| `approval.approve_title.no_show_restore` | Khôi phục đơn không đến {code}? | Restore no-show booking {code}? | ⟨chừa chỗ⟩ |  |
| `approval.approve_body.refund` | Sau khi duyệt: lễ tân nhập nơi nhận; tiền mặt do lễ tân chi, chuyển khoản do quản lý ghi. Mọi lần chi được ghi nhật ký tiền. | Once approved, reception enters where the money goes; cash is paid at the desk, transfers are recorded by a manager. Every payout is logged. | ⟨chừa chỗ⟩ | Thay approval.approve_body (nói về dòng miễn phí) |
| `approval.approve_body.room_not_ready` | Lễ tân nhận phòng được ngay; buồng chuyển "Có khách, cần dọn" và có việc dọn gấp. | Reception can check the guest in now; the room becomes "Occupied dirty" with an urgent cleaning task. | ⟨chừa chỗ⟩ |  |
| `approval.approve_body.late_checkout` | Khách được trả muộn theo giờ đã hẹn; lễ tân xếp căn khác cho khách đến hoặc gợi ý gửi hành lý. | The guest keeps the agreed late check-out; reception moves the arriving guest or offers luggage storage. | ⟨chừa chỗ⟩ |  |
| `approval.approve_body.no_show_restore` | Đơn trở lại trạng thái trước khi đánh dấu không đến. Kiểm tra lại căn và tiền cọc trong chi tiết đơn. | The booking returns to its status before the no-show. Re-check the room and the deposit in the booking details. | ⟨chừa chỗ⟩ |  |
| `approval.reject_title_generic` | Từ chối yêu cầu của {code}? | Reject the request for {code}? | ⟨chừa chỗ⟩ | Dùng cho mọi loại trừ foc/discount |
| `mlog.a_payment_confirmed` | Xác nhận đã nhận chuyển khoản VietQR | VietQR transfer confirmed received | ⟨chừa chỗ⟩ | payment.confirmed_received |
| `mlog.a_qr_created` | Tạo mã VietQR | VietQR code created | ⟨chừa chỗ⟩ | payment.qr_created |
| `mlog.a_payment_expired` | Mã VietQR hết hạn – chưa thu | VietQR code expired – not paid | ⟨chừa chỗ⟩ | payment.expired |
| `mlog.a_reconciled` | Đối soát chuyển khoản | Transfer reconciled | ⟨chừa chỗ⟩ | payment.reconciled (kết quả khớp/không thấy tiền ở cột Trước → sau) |
| `mlog.a_reversed` | Đảo giao dịch thu | Payment reversed | ⟨chừa chỗ⟩ | payment.reversed |
| `mlog.a_cash_handover` | Nhận tiền mặt sale/CTV nộp quầy | Cash handed in by sales/agent received | ⟨chừa chỗ⟩ | payment.cash_handover_confirmed |
| `mlog.a_line_reversed` | Đảo dòng folio | Folio line reversed | ⟨chừa chỗ⟩ | folio.line_reversed |
| `mlog.a_folio_settled` | Chốt folio khi trả phòng | Folio settled at check-out | ⟨chừa chỗ⟩ | folio.settled |
| `mlog.a_stay_reversed` | Đảo tiền phòng (hủy / không đến) | Room charges reversed (cancellation / no-show) | ⟨chừa chỗ⟩ | folio.stay_reversed |
| `mlog.a_foc_requested` | Gửi yêu cầu miễn phí / giảm giá | Waiver / discount requested | ⟨chừa chỗ⟩ | folio.foc_requested |
| `mlog.a_approval_rejected` | Từ chối yêu cầu | Request rejected | ⟨chừa chỗ⟩ | approval.rejected |
| `mlog.a_approval_escalated` | Chuyển cấp duyệt | Request escalated | ⟨chừa chỗ⟩ | approval.escalated |
| `mlog.a_approval_cancelled` | Rút yêu cầu | Request withdrawn | ⟨chừa chỗ⟩ | approval.cancelled |
| `mlog.a_refund_destination` | Nhập nơi nhận hoàn | Refund destination entered | ⟨chừa chỗ⟩ | refund.destination_set |
| `mlog.a_refund_cash_paid` | Chi hoàn tiền mặt | Cash refund paid | ⟨chừa chỗ⟩ | refund.cash_paid |
| `mlog.a_refund_paid` | Ghi đã hoàn chuyển khoản | Transfer refund recorded | ⟨chừa chỗ⟩ | refund.paid |
| `mlog.a_deposit_confirmed` | Xác nhận cọc | Deposit confirmed | ⟨chừa chỗ⟩ | reservation.deposit_confirmed |
| `mlog.a_noshow_retained` | Giữ cọc – khách không đến | Deposit kept – no-show | ⟨chừa chỗ⟩ | reservation.no_show_deposit_retained |
| `mlog.a_other` | Thao tác tiền khác | Other money action | ⟨chừa chỗ⟩ | Mã lạ: hiện câu này + mã ở chữ nhỏ (.mono .caption), không hiện mã một mình |
| `gw.legal_en_notice` | Phần pháp lý bên dưới tạm hiện bằng tiếng Anh cho tới khi bản tiếng Nga được duyệt. | The legal text below is shown in English until the Russian translation is approved. | Юридический текст ниже пока на английском – русский перевод проходит проверку. | Chỉ hiện ở trang RU, ngay trên khối pháp lý EN (lang="en") – thay banner guest.lang.ru_soon toàn cục – FB-R2-UXD-MOB-S3-01 |
| `gw.oci_done_card_body_late` | Đã gửi giấy tờ của {n}/{m} khách · dự kiến đến sau {time}. Khi tới nơi, gọi người trực. | IDs sent for {n}/{m} guests · arriving after {time}. Call the night staff when you arrive. | Документы отправлены: {n}/{m} гостей · прибытие после {time}. По приезде позвоните дежурному. | lateArrival=true (thay eta '22:00+') – MOB-S3-03 |
| `gw.upload_progress` | Đang gửi {count} ảnh – {pct}% | Sending {count} photo(s) – {pct}% | Отправка фото ({count}) – {pct}% | Thay guest.oci.uploading {n}/{total} – MOB-S3-04 |
| `gw.upload_done` | Đã gửi ảnh của {person}. | Photos for {person} sent. | Фото ({person}) отправлены. | Câu aria-live khi xong (không đọc từng %) |
| `gw.next_needs_docs` | Chụp giấy tờ hoặc chọn "Bổ sung tại quầy" cho từng khách để tiếp tục. | Take a photo or choose "Add at reception" for each guest to continue. | Сфотографируйте документ или выберите «Предъявить на стойке» для каждого гостя, чтобы продолжить. | Lý do nút Tiếp tục khóa – MOB-S3-05 |
| `gw.eta_first` | Chọn giờ đến để tiếp tục. | Choose your arrival time to continue. | Выберите время прибытия, чтобы продолжить. |  |
| `gw.consent_first` | Chọn một trong hai lựa chọn ở trên để gửi. | Choose one of the two options above to submit. | Выберите один из двух вариантов выше, чтобы отправить. |  |

#### R2 Sprint 3 – phản hồi & sửa: chuỗi còn thiếu FE/MOB (OpenAPI 0.3.6 bổ sung 2; responses/s3-FE.md, s3-MOB.md)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `field.TIME_AFTER_ACTION` | Giờ này muộn hơn hiện tại. Ghi đúng giờ đã diễn ra – không ghi giờ chưa tới. | This time is later than now. Enter the time it actually happened – times that haven't happened yet can't be recorded. | ⟨chừa chỗ⟩ | 422 checkIn/checkOut – giờ nhập tay muộn hơn giờ server quá manual_time_tolerance_minutes |
| `field.TIME_NOTE_REQUIRED` | Giờ này sớm hơn lúc bấm khá lâu – ghi chú vì sao ghi bù (ví dụ: mất mạng lúc khách đi). | This time is well before now – add a note on why it's being recorded late (e.g. no connection when the guest left). | ⟨chừa chỗ⟩ | 422 – thiếu checkinTimeNote/checkoutTimeNote; gắn vào ô ghi chú giờ |
| `field.SURCHARGE_DECISION_REQUIRED` | Giờ này có phụ thu – tick "Tôi đã báo khách khoản phụ thu này" hoặc xin miễn. | This time carries a surcharge – tick "I've told the guest about this surcharge" or request a waiver. | ⟨chừa chỗ⟩ | 422 checkIn/setLateCheckout/checkOut (DOM S3-12 – không bỏ qua im lặng) |
| `error.REFUND_SOURCE_NOT_RECONCILED` | Chưa chi được: {amount} trong khoản hoàn đến từ chuyển khoản chưa đối soát. Chờ quản lý khớp sao kê rồi chi. | Can't pay this out yet: {amount} of the refund comes from transfers that aren't reconciled. Wait for a manager to match the bank statement, then pay. | ⟨chừa chỗ⟩ | 409 executeRefund/executeCashRefund – {amount} ← unreconciledVnd (kèm đơn vị) |
| `checkin.time_note` | Ghi chú giờ nhận (vì sao ghi bù) | Check-in time note (why it's recorded late) | ⟨chừa chỗ⟩ | checkinTimeNote 3–300 ký tự – thay stay.note |
| `checkout.time_note` | Ghi chú giờ trả (vì sao ghi bù) | Check-out time note (why it's recorded late) | ⟨chừa chỗ⟩ | checkoutTimeNote 3–300 ký tự – thay stay.note |
| `stay.time_note_help` | Bắt buộc khi giờ ghi sớm hơn lúc bấm. Ghi chú lưu vào nhật ký thay đổi. | Required when the time is earlier than now. The note is kept in the change log. | ⟨chừa chỗ⟩ |  |
| `checkout.extra_night_title` | Trả sau mốc trả muộn – tính thêm 1 đêm | Check-out after the late check-out limit – one extra night | ⟨chừa chỗ⟩ | CheckoutSummary.extraNightRequired |
| `checkout.extra_night_body` | Giờ trả này quá mốc trả muộn nên tính thêm 1 đêm ({amount}) thay cho phụ thu trả muộn. Báo khách trước khi hoàn tất. | This check-out time is past the late check-out limit, so one extra night ({amount}) is charged instead of a late check-out fee. Tell the guest before completing. | ⟨chừa chỗ⟩ | {amount} = giá đêm thêm đang nhập (kèm đơn vị) |
| `checkout.extra_night_rate_label` | Giá đêm thêm | Extra night rate | ⟨chừa chỗ⟩ | Ô extraNight.rateVnd |
| `checkout.extra_night_rate_help` | Mặc định giá Trực tiếp đêm nay; sửa được trong khoảng sàn – trần. | Defaults to tonight's Direct rate; can be changed within the floor–ceiling range. | ⟨chừa chỗ⟩ | Ngoài sàn–trần → field.RATE_OUT_OF_RANGE |
| `checkout.extra_night_unavailable` | Căn đã có khách đêm nay nên chưa tính thêm đêm được. Đổi căn cho khách đến hoặc thỏa thuận lại giờ trả. | The room is booked tonight, so an extra night can't be added. Move the arriving guest or agree a different check-out time. | ⟨chừa chỗ⟩ | extraNightAvailable=false |
| `checkout.post_midnight` | Đang sau nửa đêm của ngày đi – trả phòng bây giờ không phụ thu, không tính thêm đêm. | It's after midnight on the departure day – checking out now has no late fee and no extra night. | ⟨chừa chỗ⟩ | CheckoutSummary.postMidnightWindow (tùy chọn) |
| `extend.keep_rate` | Giữ giá đơn · {amount}/đêm | Keep booking rate · {amount}/night | ⟨chừa chỗ⟩ | CŨ – nút "Giữ giá đơn" đã bỏ ở H15 (ARC 16.18, FE-A đợt 16). Không dùng; xóa ở v0.5 cùng ca phủ định ở s3-review.test.tsx. Trước đây: ExtensionOptions.currentBookingRateVnd ≠ null |
| `extend.keep_rate_help` | Đơn đang có giá thỏa thuận khác lịch giá. Bấm để dùng lại giá này cho các đêm thêm – vẫn trong sàn – trần; ngày đặc biệt theo giá ngày đó. | This booking has an agreed rate that differs from the rate calendar. Tap to reuse it for the extra nights – still within floor–ceiling; special dates keep their own rate. | ⟨chừa chỗ⟩ | CŨ – nút "Giữ giá đơn" đã bỏ ở H15 (ARC 16.18, FE-A đợt 16: giá gợi ý của máy chủ đã theo giá thỏa thuận – AN-45). Không dùng; xóa ở v0.5 cùng ca phủ định ở s3-review.test.tsx |
| `bill.line.room_night` | Tiền phòng đêm {date} | Room, night of {date} | ⟨chừa chỗ⟩ | {date} dd/MM; có {room} → bill.line.room_night_room |
| `bill.line.room_night_room` | Tiền phòng căn {room} · đêm {date} | Room {room}, night of {date} | ⟨chừa chỗ⟩ |  |
| `bill.line.extra_night` | Đêm thêm {date} – trả phòng sau mốc trả muộn | Extra night of {date} – check-out after the late check-out limit | ⟨chừa chỗ⟩ | E05-11; có {room} → bill.line.extra_night_room |
| `bill.line.extra_night_room` | Đêm thêm {date} · căn {room} – trả phòng sau mốc trả muộn | Extra night of {date} · room {room} – check-out after the late check-out limit | ⟨chừa chỗ⟩ |  |
| `bill.line.extra_person` | Phụ thu người vượt định mức · đêm {date} | Extra guest charge, night of {date} | ⟨chừa chỗ⟩ | có {count} → bill.line.extra_person_count |
| `bill.line.extra_person_count` | Phụ thu {count} người vượt định mức · đêm {date} | Extra guest charge ×{count}, night of {date} | ⟨chừa chỗ⟩ |  |
| `bill.line.early_checkin` | Phụ thu nhận sớm (nhận lúc {time}) | Early check-in fee (arrived {time}) | ⟨chừa chỗ⟩ | {pct} có trong labelParams nhưng không in lên phiếu khách |
| `bill.line.late_checkout` | Phụ thu trả muộn ({time}) | Late check-out fee ({time}) | ⟨chừa chỗ⟩ | Cùng chữ co.line_late |
| `bill.line.early_departure_fee` | Phí trả phòng sớm | Early departure fee | ⟨chừa chỗ⟩ | có {noticeDays} → bill.line.early_departure_fee_notice |
| `bill.line.early_departure_fee_notice` | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} days' notice) | ⟨chừa chỗ⟩ |  |
| `bill.line.overpayment_retained` | Khoản trả thừa khách tự nguyện để lại | Overpayment the guest chose to leave | ⟨chừa chỗ⟩ | deposit_forfeit + charge_code overpayment_retained (DOM S3-4) |
| `bill.line.room_change` | Chênh lệch đổi phòng căn {from} → {to} | Room change difference, {from} → {to} | ⟨chừa chỗ⟩ |  |
| `bill.line.minibar` | Minibar – {item} × {qty} | Minibar – {item} × {qty} | ⟨chừa chỗ⟩ | {item} là tên món do server (tiếng Việt) |
| `bill.line.cancellation_fee` | Phí hủy đặt phòng | Cancellation fee | ⟨chừa chỗ⟩ |  |
| `bill.line.no_show_fee` | Phí không đến | No-show fee | ⟨chừa chỗ⟩ |  |
| `bill.line.foc` | Miễn phí | Complimentary | ⟨chừa chỗ⟩ | có {reason} → bill.line.foc_reason ({reason} = foc.r_* đã dịch) |
| `bill.line.foc_reason` | Miễn phí · {reason} | Complimentary · {reason} | ⟨chừa chỗ⟩ |  |
| `bill.line.discount` | Giảm giá | Discount | ⟨chừa chỗ⟩ | có {reason} → bill.line.discount_reason |
| `bill.line.discount_reason` | Giảm giá · {reason} | Discount · {reason} | ⟨chừa chỗ⟩ |  |
| `bill.line.laundry` | Giặt ủi · {qty} kg | Laundry · {qty} kg | ⟨chừa chỗ⟩ | Mã LAUNDRY_KG |
| `bill.line.adhoc_cleaning` | Dọn phòng thêm × {qty} | Extra cleaning × {qty} | ⟨chừa chỗ⟩ |  |
| `bill.line.smoking_fee` | Phí khử mùi thuốc lá | Smoke odour treatment fee | ⟨chừa chỗ⟩ |  |
| `bill.line.key_card_fee` | Phí thẻ phòng không trả × {qty} | Unreturned key card × {qty} | ⟨chừa chỗ⟩ |  |
| `bill.line.damage` | Hư hỏng, mất đồ – {item} × {qty} | Damage / missing item – {item} × {qty} | ⟨chừa chỗ⟩ |  |
| `bill.line.fnb` | Đồ ăn, uống – {text} × {qty} | Food & drink – {text} × {qty} | ⟨chừa chỗ⟩ |  |
| `bill.line.service_fee` | Dịch vụ – {text} × {qty} | Service – {text} × {qty} | ⟨chừa chỗ⟩ |  |
| `bill.line.utilities` | Điện nước | Utilities | ⟨chừa chỗ⟩ |  |
| `bill.line.adjustment` | Điều chỉnh | Adjustment | ⟨chừa chỗ⟩ | Mặc định cho dòng không có khóa riêng |
| `mlog.a_ota_collected` | Ghi nhận tiền phòng OTA thu hộ | OTA-collected room payment recorded | ⟨chừa chỗ⟩ | payment.ota_collected |
| `mlog.a_ota_collect_adjusted` | Điều chỉnh khoản OTA thu hộ (đêm thay đổi) | OTA-collected amount adjusted (nights changed) | ⟨chừa chỗ⟩ | payment.ota_collect_adjusted |
| `mlog.a_foc_posted` | Ghi dòng miễn phí / giảm giá vào folio | Waiver / discount line posted | ⟨chừa chỗ⟩ | folio.foc_posted |
| `mlog.a_foc_rejected` | Từ chối miễn phí / giảm giá | Waiver / discount rejected | ⟨chừa chỗ⟩ | folio.foc_rejected |
| `mlog.a_damage_posted` | Ghi phí hư hỏng ngoài bảng (đã duyệt) | Off-list damage charge posted (approved) | ⟨chừa chỗ⟩ | folio.damage_posted |
| `mlog.a_damage_rejected` | Từ chối giá hư hỏng ngoài bảng | Off-list damage price rejected | ⟨chừa chỗ⟩ | folio.damage_rejected |
| `mlog.a_cancellation_fee` | Ghi phí hủy đặt phòng | Cancellation fee recorded | ⟨chừa chỗ⟩ | reservation.cancellation_fee |
| `mlog.a_debt_on_checkout` | Ghi công nợ khi trả phòng | Balance recorded as receivable at check-out | ⟨chừa chỗ⟩ | reservation.debt_on_checkout |
| `mlog.a_early_departure` | Trả phòng sớm – tính phí và tiền hoàn | Early departure – fee and refund calculated | ⟨chừa chỗ⟩ | reservation.early_departure |
| `mlog.a_extended` | Gia hạn lưu trú | Stay extended | ⟨chừa chỗ⟩ | reservation.extended |
| `mlog.a_prior_night_added` | Thêm đêm trước (nhận phòng rất sớm) | Prior night added (very early check-in) | ⟨chừa chỗ⟩ | reservation.prior_night_added (BR-417) |
| `mlog.a_extra_night_on_checkout` | Tính thêm 1 đêm khi trả phòng (quá mốc trả muộn) | Extra night charged at check-out (past the late check-out limit) | ⟨chừa chỗ⟩ | reservation.extra_night_on_checkout |
| `mlog.a_priced` | Tính giá đơn | Booking priced | ⟨chừa chỗ⟩ | reservation.priced |
| `mlog.a_repriced` | Tính lại giá đơn | Booking repriced | ⟨chừa chỗ⟩ | reservation.repriced |
| `mlog.a_room_change_repriced` | Tính lại giá khi đổi phòng | Repriced after room change | ⟨chừa chỗ⟩ | reservation.room_change_repriced |
| `mlog.a_commission_projected` | Ghi hoa hồng dự kiến | Commission projected | ⟨chừa chỗ⟩ | commission.projected |
| `mlog.a_commission_earned` | Hoa hồng đạt (sau đối soát) | Commission earned (after reconciliation) | ⟨chừa chỗ⟩ | commission.earned |
| `mlog.a_commission_voided` | Hủy hoa hồng | Commission voided | ⟨chừa chỗ⟩ | commission.voided |
| `mlog.a_channel_fee_recorded` | Ghi phí kênh OTA | OTA channel fee recorded | ⟨chừa chỗ⟩ | channel_fee.recorded |
| `mlog.a_channel_fee_updated` | Cập nhật phí kênh OTA | OTA channel fee updated | ⟨chừa chỗ⟩ | channel_fee.updated |
| `mlog.a_relocation_cost` | Chi phí chuyển khách sang nơi khác (xung đột OTA) | Cost of moving a guest elsewhere (OTA conflict) | ⟨chừa chỗ⟩ | overbooking.relocation_cost – không dùng chữ 'overbook/trùng phòng' (content-guide 3.1) |
| `mlog.a_approval_requested` | Gửi yêu cầu duyệt | Approval requested | ⟨chừa chỗ⟩ | approval.requested (mọi loại; thay mlog.a_foc_requested) |
| `mlog.a_approval_self_applied` | Tự áp miễn phí trong hạn mức (xác nhận lại mật khẩu) | Waiver self-applied within limit (password re-confirmed) | ⟨chừa chỗ⟩ | approval.self_applied |
| `mlog.a_approval_approved` | Duyệt yêu cầu | Request approved | ⟨chừa chỗ⟩ | approval.approved khi loại ≠ foc/special_discount (FOC giữ mlog.a_foc_approved); loại hiện bằng approval.type.* / refund.title cạnh câu |
| `mlog.a_approval_reopened` | Mở lại yêu cầu duyệt | Approval request reopened | ⟨chừa chỗ⟩ | approval.reopened |
| `mlog.a_receiving_account_changed` | Đổi tài khoản nhận chuyển khoản | Receiving bank account changed | ⟨chừa chỗ⟩ | config.changed (chỉ khóa payment_receiving_account) |
| `gw.oci_unavailable_title` | Làm thủ tục tại quầy | Check in at reception | Регистрация на стойке | Màn fail closed (MOB s3 – thay guest.cta.checkin + guest.late.not_ready) |
| `gw.oci_unavailable_body` | Lúc này chưa làm thủ tục trước qua trang này được. Bạn vẫn nhận phòng bình thường: mang giấy tờ gốc, lễ tân làm thủ tục cho bạn trong vài phút. | Online check-in isn't available on this page right now. You can still check in as usual: bring your original IDs and reception will check you in within a few minutes. | Сейчас онлайн-регистрация на этой странице недоступна. Заселиться можно как обычно: возьмите оригиналы документов – администратор оформит всё за несколько минут. | Không nói lý do kỹ thuật (phiên bản thông báo) với khách |
| `gw.oci_unavailable_late` | Đến sau {time}? Gọi người trực khi tới nơi. | Arriving after {time}? Call the night staff when you get here. | Приезжаете после {time}? Позвоните дежурному по прибытии. | {time} = mốc đến khuya của khung giờ đến (bước Giờ đến) |

#### R2 Sprint 3 – đợt 3: sửa lỗi QA (BUG-R2-032, BUG-R2-052 – responses/s3-FE.md)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `ci.go_handover` | Tiếp tục: Giao mã & hoàn tất | Continue: Hand over & finish | ⟨chừa chỗ⟩ | H13 nút bước 3 → 4 (cùng mẫu ci.go_*; tên bước = checkin.step.handover) – BUG-R2-032 |
| `error.field_named` | Mục "{label}": {message} | "{label}": {message} | ⟨chừa chỗ⟩ | Lỗi ở trường không có ô trên màn (vd addPriorNight, cardsIssued, houseRulesSent): {label} = nhãn nút/ô tích tương ứng, {message} = câu field.* / common.required. Mã có câu riêng đủ nghĩa thì không ghép – BUG-R2-052 |

#### R2 Sprint 3 – đợt 5: Cần chú ý đơn chưa đóng (BE-C) + OpenAPI 0.3.6 bổ sung 4 (luật OTA, link check-in online)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `attn.dq_stay_not_closed` | {n} đơn đã qua giờ trả phòng nhưng chưa trả phòng hoặc đánh dấu không đến | {n} booking(s) past check-out time but not checked out or marked no-show | ⟨chừa chỗ⟩ | AttentionItem kind=data_quality, params.check=registration_stay_not_closed, count>1 |
| `attn.dq_stay_not_closed_one` | Đơn {code} đã qua giờ trả phòng nhưng chưa trả phòng hoặc đánh dấu không đến | Booking {code} is past check-out time but not checked out or marked no-show | ⟨chừa chỗ⟩ | count=1 (có refCode) |
| `attn.dq_stay_not_closed_body` | Ảnh giấy tờ của khách sẽ tự xóa {days} ngày sau ngày đi dự kiến. Trả phòng hoặc đánh dấu không đến trước khi ảnh bị xóa. | The guests' ID photos will be deleted automatically {days} days after the planned departure. Check out or mark no-show before then. | ⟨chừa chỗ⟩ | {days} ← tham số id_image_unconfirmed_max_days; không đọc được → _body_short |
| `attn.dq_stay_not_closed_body_short` | Ảnh giấy tờ của khách sẽ tự xóa nếu đơn tiếp tục chưa đóng. Trả phòng hoặc đánh dấu không đến ngay. | The guests' ID photos will be deleted automatically if the booking stays open. Check out or mark no-show now. | ⟨chừa chỗ⟩ |  |
| `rsv.party_source.legend` | Thay đổi số khách này đến từ đâu? | Where does this guest-count change come from? | ⟨chừa chỗ⟩ | Bắt buộc khi đổi số khách đơn kênh OTA ở hold/confirmed; FE chọn sẵn guest_direct (ARC 7.8) |
| `rsv.party_source.guest_direct` | Khách báo trực tiếp với OTTIMO | The guest told OTTIMO directly | ⟨chừa chỗ⟩ | guest_direct |
| `rsv.party_source.guest_direct_help` | Giữ số khách đã đặt qua {channel}; người vượt phần đó (và vượt định mức căn) phụ thu, thu tại quầy. | Keeps the guest count booked via {channel}; guests above that (and above the room's standard occupancy) are charged at the desk. | ⟨chừa chỗ⟩ | Phụ thu người vượt max(định mức, otaGuestCount) |
| `rsv.party_source.ota_modification` | Khách đã sửa đơn trên {channel} | The guest modified the booking on {channel} | ⟨chừa chỗ⟩ | ota_modification – bắt buộc otaModificationRef |
| `rsv.party_source.ota_modification_help` | Cập nhật số khách theo kênh; không phụ thu tại quầy vì kênh đã tính. | Updates the guest count to match the channel; no desk surcharge because the channel has charged for it. | ⟨chừa chỗ⟩ |  |
| `rsv.ota_mod_ref` | Mã sửa đơn trên extranet | Extranet modification reference | ⟨chừa chỗ⟩ | otaModificationRef 3–64 ký tự |
| `rsv.ota_mod_ref_help` | Chép đúng mã sửa đơn trên extranet của kênh (3–64 ký tự). | Copy the modification reference exactly as shown on the channel's extranet (3–64 characters). | ⟨chừa chỗ⟩ |  |
| `rsv.ota_guest_count` | Số khách đã tính qua kênh: {n} | Guests paid through the channel: {n} | ⟨chừa chỗ⟩ | Reservation.otaGuestCount (FD+, SAL) |
| `field.NOT_ALLOWED` | Không áp dụng được cho đơn này. | This doesn't apply to this booking. | ⟨chừa chỗ⟩ | 422 mã trường NOT_ALLOWED (vd partyChangeSource ở đơn không phải OTA, otaPenaltyChannelFeeVnd thiếu otaPenaltyVnd) |
| `field.FOC_NOT_ALLOWED_OTA_PREPAID` | Đêm này khách đã trả qua OTA nên không miễn/giảm tại quầy được. Muốn bù cho khách: miễn khoản phát sinh khác hoặc báo quản lý. | This night was prepaid through the OTA, so it can't be waived or discounted at the desk. To make it up to the guest, waive another charge or ask a manager. | ⟨chừa chỗ⟩ | 422 field=kind (requestFoc trên dòng room đơn ota_prepaid) |
| `folio.foc_ota_prepaid_note` | Đã thu qua OTA – không miễn/giảm dòng này. | Prepaid via OTA – this line can't be waived or discounted. | ⟨chừa chỗ⟩ | Thay nút FOC đã ẩn trên dòng phòng ota_prepaid |
| `cancel.ota_penalty_channel_fee` | Phí kênh trên tiền phạt (tùy chọn) | Channel fee on the penalty (optional) | ⟨chừa chỗ⟩ | cancelReservation.otaPenaltyChannelFeeVnd |
| `cancel.ota_penalty_channel_fee_help` | Bỏ trống: tính theo tỷ lệ hoa hồng của kênh. Chỉ nhập khi có tiền phạt. | Leave empty to use the channel's commission rate. Only fill in when there's a penalty. | ⟨chừa chỗ⟩ |  |
| `rsv.guest_link.create` | Tạo link check-in online | Create online check-in link | ⟨chừa chỗ⟩ | issueGuestLink (FD+) |
| `rsv.guest_link.reissue` | Tạo link mới | Create a new link | ⟨chừa chỗ⟩ | Đơn đã có link: xác nhận bằng gw.link_reissue_title |
| `rsv.guest_link.revoke` | Thu hồi link | Revoke link | ⟨chừa chỗ⟩ | revokeGuestLink – xác nhận bằng gw.link_revoke_title |
| `rsv.guest_link.title` | Link check-in online · đơn {code} | Online check-in link · booking {code} | ⟨chừa chỗ⟩ |  |
| `rsv.guest_link.once_warning` | Link chỉ hiện một lần. Sao chép và gửi khách ngay – đóng hộp này là không xem lại được; cần thì tạo link mới (link cũ ngừng hoạt động). | This link is shown only once. Copy it and send it to the guest now – once you close this box you can't see it again; if needed, create a new link (the old one stops working). | ⟨chừa chỗ⟩ | Cảnh báo bắt buộc trong hộp hiện link (token chỉ trả một lần – D25) |
| `rsv.guest_link.send_note` | Gửi link trong tin nhắn riêng với khách của đơn này; không kèm mã cửa hay số căn. | Send the link in a private message to this booking's guest; don't include the door code or room number. | ⟨chừa chỗ⟩ |  |
| `rsv.guest_link.send_private` | Gửi riêng 1–1 cho khách của đơn này, không gửi vào nhóm chat. | Send it one-to-one to this booking's guest – never to a group chat. | ⟨chừa chỗ⟩ | SEC: nhắc trên khung link check-in online, đặt cạnh nút Sao chép |
| `rsv.guest_link.copy` | Sao chép link | Copy link | ⟨chừa chỗ⟩ |  |
| `rsv.guest_link.copied` | Đã sao chép link | Link copied | ⟨chừa chỗ⟩ | aria-live |
| `rsv.guest_link.expires` | Hết hạn {time} | Expires {time} | ⟨chừa chỗ⟩ | {time} ← expiresAt (giờ cơ sở) |
| `rsv.guest_link.revoked_toast` | Đã thu hồi link của đơn {code}. | Link for booking {code} revoked. | ⟨chừa chỗ⟩ |  |

#### R2 Sprint 3 – vòng sửa 9: lỗi Desk UXR #5, #7, #8 (FE viết theo content guide; UXD duyệt 17/10 – S4-41)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `confirm.cancel_booking.body_full_refund` | Căn {room} mở bán lại {from} → {to} trên mọi kênh. Không giữ phí hủy; hoàn đủ {refund} cho khách – cần quản lý duyệt. | Room {room} goes back on sale {from} → {to} on all channels. No cancellation fee; the full {refund} is refunded – needs manager approval. | ⟨chừa chỗ⟩ | UXR #5: refundableVnd > 0, retainedVnd = 0. {refund} cùng cách ghi số với confirm.cancel_booking.body |
| `party.surcharge_title` | Phụ thu người vượt định mức | Extra-guest surcharge | ⟨chừa chỗ⟩ | Tiêu đề khối trong hộp Người ở (chỉ đơn Đang ở) |
| `party.surcharge_loading` | Đang tính phụ thu… | Working out the surcharge… | ⟨chừa chỗ⟩ | addPartyMember dryRun đang chạy – nút Thêm vào đơn khóa |
| `party.surcharge_line` | Thêm người này vượt định mức căn: phụ thu {amount} cho {nights} đêm còn lại, tính từ đêm nay. | Adding this person goes over the room's standard occupancy: a {amount} surcharge for the {nights} remaining night(s), from tonight. | ⟨chừa chỗ⟩ | BR-110. {amount} ← occupancyChange.surchargeVnd (kèm đơn vị); {nights} ← occupancyChange.nights. UXD S4-41: bỏ mã BR khỏi câu (FB-R1-UXR-UXD-08) |
| `party.surcharge_zero` | Thêm người này không có phụ thu (vẫn trong định mức căn). | No surcharge for this person (still within the room's standard occupancy). | ⟨chừa chỗ⟩ | dryRun: không có occupancyChange hoặc surchargeVnd = 0 |
| `party.surcharge_confirm` | Ghi phụ thu {amount} vào folio – tôi đã báo khách | Add the {amount} surcharge to the folio – I've told the guest | ⟨chừa chỗ⟩ | Ô tick bắt buộc → applyExtraPersonSurcharge = true + expectedSurchargeVnd. Không có "bỏ qua" (DOM S3-12) |
| `party.surcharge_needs_confirm` | Tick ô phụ thu để bật nút Thêm vào đơn. | Tick the surcharge box to enable Add to booking. | ⟨chừa chỗ⟩ | Lý do nút Thêm vào đơn đang khóa (aria-describedby). UXD S4-41: cùng mẫu "Tick … để bật nút …" với ci.submit_needs_told |
| `party.surcharge_waiver_note` | Khách xin miễn? Vẫn ghi phụ thu rồi báo quản lý – Desk chưa có nút xin miễn cho phụ thu người. | Guest asking for a waiver? Add the surcharge anyway and tell a manager – the desk can't request a waiver for this surcharge yet. | ⟨chừa chỗ⟩ | CŨ – nay có nút xin miễn phụ thu người (FE-A S4-25, BUG-R2-093); không dùng, xóa ở v0.5 (UXD s4-strings-2) |
| `party.surcharge_required` | Thêm người này có phụ thu {amount}. Báo khách, tick ô phụ thu rồi bấm Thêm vào đơn. | Adding this person carries a {amount} surcharge. Tell the guest, tick the surcharge box, then select Add to booking. | ⟨chừa chỗ⟩ | 422 applyExtraPersonSurcharge SURCHARGE_DECISION_REQUIRED (thay câu nhận sớm/trả muộn – UXR #7) |
| `party.surcharge_changed` | Phụ thu vừa đổi thành {amount}. Xem số mới, báo khách rồi tick lại. | The surcharge has just changed to {amount}. Check the new amount, tell the guest, then tick again. | ⟨chừa chỗ⟩ | 409 SURCHARGE_CHANGED khi thêm người |
| `party.surcharge_preview_failed` | Chưa tính được phụ thu nên chưa thêm được người này. Bấm Thử lại. | Couldn't work out the surcharge, so this person can't be added yet. Select Try again. | ⟨chừa chỗ⟩ | dryRun lỗi mạng/5xx. EN Desk dùng "Select" (không "Tap") – S4-41 |
| `error.SELF_REFUND_FORBIDDEN` | Người đã tạo, duyệt hoặc nhập tài khoản nhận của khoản hoàn này không tự chi được. Nhờ một người khác có quyền chi hoàn. | Whoever requested, approved or entered the account for this refund can't also pay it out. Ask another colleague who can pay refunds. | ⟨chừa chỗ⟩ | 403 – câu chung; màn chi hoàn dùng câu riêng theo cách hoàn |
| `refund.self_execute_forbidden_transfer` | Bạn đã tạo, duyệt hoặc nhập tài khoản nhận cho khoản hoàn này nên không tự chi được. Nhờ quản lý khác hoặc chủ đầu tư ghi khoản chi này. | You requested, approved or entered the account for this refund, so you can't also pay it out. Ask another manager or the owner to record this payout. | ⟨chừa chỗ⟩ | 403 SELF_REFUND_FORBIDDEN ở executeRefund (chuyển khoản). Tiền mặt: refund.self_execute_forbidden (chỉ người tạo bị chặn) |

#### R2 Sprint 3 – vòng sửa 9c: Desk gắn giấy tờ chờ (FB-R2-SEC-FE-07), xem ảnh giấy tờ, khai báo thiếu người (FE viết theo content guide; UXD duyệt 17/10 – S4-48)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `reg.link.pending_chip` | Chờ gắn người – tự xóa lúc {time} | Not linked to a guest – deleted at {time} | ⟨chừa chỗ⟩ | Thay chip guest.chip.doc_ok trên giấy tờ chờ gắn. {time} ← documents[].imagePurgeAt (ngày giờ) |
| `reg.link.pending_chip_soon` | Chờ gắn người – sắp tự xóa | Not linked to a guest – will be deleted soon | ⟨chừa chỗ⟩ | Như trên khi không có imagePurgeAt (ảnh đã xóa, giấy tờ vẫn chờ) |
| `reg.link.action` | Gắn người | Link to guest | ⟨chừa chỗ⟩ | Nút trên dòng giấy tờ chờ: step-up → hộp nhập tay có ô Người trong đoàn |
| `reg.link.banner` | {n} giấy tờ khách gửi qua link chưa gắn người – tự xóa lúc {time}. Gắn vào người còn ở để giữ lại. | {n} ID(s) sent via the link aren't linked to a guest – deleted at {time}. Link them to a guest who is staying to keep them. | ⟨chừa chỗ⟩ | Dải cảnh báo đầu khối Giấy tờ (H13 bước Giấy tờ, H14). {time} = hạn sớm nhất |
| `reg.link.banner_soon` | {n} giấy tờ khách gửi qua link chưa gắn người và sắp tự xóa. Gắn vào người còn ở để giữ lại. | {n} ID(s) sent via the link aren't linked to a guest and will be deleted soon. Link them to a guest who is staying to keep them. | ⟨chừa chỗ⟩ | Như trên khi không có hạn |
| `reg.link.go` | Tới giấy tờ | Go to the ID | ⟨chừa chỗ⟩ | Nút của dải cảnh báo – cuộn và đặt tiêu điểm vào giấy tờ chờ đầu tiên |
| `reg.link.member` | Người trong đoàn | Guest in the party | ⟨chừa chỗ⟩ | Ô chọn trong hộp sửa giấy tờ khách gửi qua link – partyMemberId (không chọn sẵn) |
| `reg.link.member_placeholder` | Chọn người | Choose a guest | ⟨chừa chỗ⟩ | Lựa chọn trống đầu danh sách |
| `reg.link.member_help` | Người có giấy tờ này. Giấy tờ đi theo người đó khi đoàn thay đổi. | Whose ID this is. The ID follows that guest if the party changes. | ⟨chừa chỗ⟩ | Giấy tờ khách gửi qua link chưa gắn, không chờ xóa – không bắt buộc |
| `reg.link.member_help_pending` | Chọn người có giấy tờ này để giữ lại. Không gắn thì giấy tờ tự xóa lúc {time}. | Choose whose ID this is to keep it. If it isn't linked, it's deleted at {time}. | ⟨chừa chỗ⟩ | Giấy tờ chờ gắn – bắt buộc |
| `reg.link.member_help_pending_soon` | Chọn người có giấy tờ này để giữ lại. Không gắn thì giấy tờ sắp tự xóa. | Choose whose ID this is to keep it. If it isn't linked, it will be deleted soon. | ⟨chừa chỗ⟩ |  |
| `reg.link.has_doc` | {name} – đã có giấy tờ | {name} – already has an ID | ⟨chừa chỗ⟩ | Lựa chọn bị khóa: người đã gắn với giấy tờ khác (409 PARTY_DUPLICATE) |
| `reg.link.no_member` | Trong đoàn chưa có ai để gắn giấy tờ này. Thêm người ở mục Người ở của đơn rồi gắn lại; không thì giấy tờ tự xóa lúc {time}. | There's no one in the party to link this ID to. Add the guest under Guests staying on the booking, then link it; otherwise it's deleted at {time}. | ⟨chừa chỗ⟩ | Mọi người còn ở đã có giấy tờ – không chặn nút Lưu |
| `reg.link.no_member_soon` | Trong đoàn chưa có ai để gắn giấy tờ này. Thêm người ở mục Người ở của đơn rồi gắn lại; không thì giấy tờ sắp tự xóa. | There's no one in the party to link this ID to. Add the guest under Guests staying on the booking, then link it; otherwise it will be deleted soon. | ⟨chừa chỗ⟩ |  |
| `reg.link.party_error` | Chưa tải được danh sách người trong đoàn. | Couldn't load the guests in the party. | ⟨chừa chỗ⟩ | listParty lỗi – kèm nút common.retry |
| `reg.link.linked_toast` | Đã gắn giấy tờ vào {name} | ID linked to {name} | ⟨chừa chỗ⟩ | Toast sau khi gắn (updateGuestDocument + partyMemberId) |
| `reg.link.no_fields` | Chưa nhập thông tin giấy tờ | ID details not entered yet | ⟨chừa chỗ⟩ | Tên dòng giấy tờ khách gửi qua link khi lễ tân chưa nhập trường |
| `reg.link.dup_pending` | Số giấy tờ này có thể thuộc giấy tờ khách đã gửi qua link đang chờ gắn người. Mở giấy tờ đó, bấm Gắn người và chọn người – không cần nhập mới. | This ID number may belong to an ID the guest sent via the link that is waiting to be linked. Open that ID, select Link to guest and choose the guest – no need to add it again. | ⟨chừa chỗ⟩ | Nhập tay trùng số khi đơn có giấy tờ chờ gắn: 409 PARTY_DUPLICATE (0.3.7 sẽ có DOCUMENT_UNCLAIMED_EXISTS kèm id) |
| `reg.link.open_pending` | Mở giấy tờ chờ gắn người | Open the ID waiting to be linked | ⟨chừa chỗ⟩ | Đóng hộp nhập tay, tới giấy tờ chờ |
| `attn.dq_party_docs_unlinked` | {n} đơn có giấy tờ khách gửi qua link chưa gắn người – sớm nhất tự xóa lúc {time} | {n} booking(s) have IDs sent via the link that aren't linked to a guest – the first is deleted at {time} | ⟨chừa chỗ⟩ | AttentionItem kind=data_quality, params.check=registration_party_docs_unlinked, count>1; {time} ← dueAt |
| `attn.dq_party_docs_unlinked_one` | Đơn {code} có giấy tờ khách gửi qua link chưa gắn người – tự xóa lúc {time} | Booking {code} has IDs sent via the link that aren't linked to a guest – deleted at {time} | ⟨chừa chỗ⟩ | count=1 (có refCode) |
| `attn.dq_party_docs_unlinked_body` | Có người vừa rời đoàn. Mở đơn, gắn giấy tờ của người còn ở vào đúng người để giữ lại. | Someone has left the party. Open the booking and link each staying guest's ID to that guest to keep it. | ⟨chừa chỗ⟩ |  |
| `reg.link.open_booking` | Mở đơn {code} | Open booking {code} | ⟨chừa chỗ⟩ | Nút trong dải Cần chú ý của H14 (tối đa 5 đơn, đọc Reservation.registrationId) – mở khai báo, tới giấy tờ chờ |
| `reg.link.row_chip` | Giấy tờ chờ gắn người | IDs waiting to be linked | ⟨chừa chỗ⟩ | Chip trên dòng H14 của đơn có mục Cần chú ý |
| `ci.photo_alt` | Ảnh giấy tờ {n}/{total} – {name} | ID photo {n} of {total} – {name} | ⟨chừa chỗ⟩ | alt của ảnh giấy tờ; {name} = tên trên giấy tờ hoặc reg.link.no_fields |
| `ci.photo_deleted` | Ảnh này đã bị xóa theo hạn lưu. | This photo has been deleted (retention period ended). | ⟨chừa chỗ⟩ | getDocumentImage 404 (E06-04) |
| `ci.photo_error` | Chưa mở được ảnh giấy tờ. Bấm Xem đủ số / ảnh để thử lại. | Couldn't open the ID photo. Select View full number / photo to try again. | ⟨chừa chỗ⟩ | Lỗi khác khi tải ảnh – số đầy đủ vẫn hiện nếu đọc được |
| `reg2.mark_sent_incomplete` | Còn thiếu giấy tờ của {n} người. Gắn giấy tờ đang chờ hoặc nhập giấy tờ còn thiếu trước khi đánh dấu đã gửi. | IDs are missing for {n} guest(s). Link the waiting IDs or add the missing ones before marking as sent. | ⟨chừa chỗ⟩ | {n} = requiredCount − submittedCount; cũng hiện trước khi bấm khi số đã biết |
| `reg2.mark_sent_incomplete_short` | Còn thiếu giấy tờ của người trong đoàn. Gắn giấy tờ đang chờ hoặc nhập giấy tờ còn thiếu trước khi đánh dấu đã gửi. | Some guests' IDs are missing. Link the waiting IDs or add the missing ones before marking as sent. | ⟨chừa chỗ⟩ | Như trên khi chưa tính được {n} |

#### R2 Sprint 4 – UXD duyệt KB7 trả phòng sau giờ ân hạn (S4-48, FE vòng 9 tiếp)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `co.go_bill_needs_told` | Tick "Tôi đã báo khách khoản phụ thu này" để bật nút Tiếp tục. | Tick "I've told the guest about this surcharge" to enable Continue. | ⟨chừa chỗ⟩ | H16 bước 2 (KB7): lý do nút "Tiếp tục: Bill & thu tiền" khóa, đặt cạnh nút + aria-describedby. Thay ci.told_guest (nhãn ô tick) đang dùng làm lý do |
| `checkout.complete_needs_told` | Quay lại bước Phụ phí và tick "Tôi đã báo khách khoản phụ thu này" để bật nút Hoàn tất. | Go back to Extras and tick "I've told the guest about this surcharge" to enable Complete. | ⟨chừa chỗ⟩ | H16 bước 3: phụ thu trả muộn vừa tăng (tính lại) mà chưa tick – thay ci.told_guest trong whyLocked |
| `co.late_switch_hint_time` | Khách muốn trả sau {time}? Dùng "Trả muộn" ở khung chi tiết đơn để tính và báo khách trước. | Guest wants to leave after {time}? Use "Late check-out" in the booking details to work it out and tell them first. | ⟨chừa chỗ⟩ | {time} ← BookingRules giờ trả phòng chuẩn (BR-401). Thay co.late_switch_hint (12:00 viết cứng). Chỉ hiện khi chưa có phụ thu trả muộn và chưa hẹn giờ (FE KB7 – UXD duyệt S4-48) |

#### R2 Sprint 4 – FE-A tiền: VietQR cọc, tính thử đổi căn, thu khi nhận phòng, dòng dịch vụ khi hủy/no-show (FE viết theo content guide; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `dep.qr_creating` | Đang tạo mã VietQR… | Creating the VietQR code… | ⟨chừa chỗ⟩ | H12 ngay sau giữ chỗ / H11 sau khi bấm pay.vietqr_create |
| `dep.qr_failed` | Chưa tạo được mã VietQR – đơn không bị ảnh hưởng. Bấm Thử lại. | Couldn't create the VietQR code – the booking isn't affected. Select Try again. | ⟨chừa chỗ⟩ | Lỗi khác PAYMENT_NOT_CONFIGURED (dùng error.PAYMENT_NOT_CONFIGURED); kèm nút common.retry. UXD s4: bỏ 'theo số tiền và nội dung ở trên' – khi lỗi, màn không có khối VietQR nên câu chỉ tới chỗ không có |
| `dep.qr_pending` | Đã có mã VietQR cọc {amount} chờ khách chuyển (hiệu lực đến {time}). Khi tiền về tài khoản OTTIMO, bấm Xác nhận đã nhận cọc. | A deposit VietQR for {amount} is waiting for the guest's transfer (valid until {time}). When the money reaches OTTIMO's account, select Confirm deposit received. | ⟨chừa chỗ⟩ | H11: folio có giao dịch VietQR cọc đang chờ (tạo ở H12) – Desk không vẽ lại được mã cũ; {time} ← Payment.expiresAt |
| `dep.qr_recreate` | Tạo mã VietQR mới | Create a new VietQR code | ⟨chừa chỗ⟩ | H11 – thay mã đang chờ |
| `dep.qr_recreate_help` | Mã mới thay mã cũ – mã đã gửi khách sẽ hết hiệu lực. | A new code replaces the old one – the code already sent to the guest stops working. | ⟨chừa chỗ⟩ | createVietQr: QR mới làm QR chờ cũ của folio → expired |
| `dep.qr_expired` | Mã VietQR này đã hết hạn nên không xác nhận theo mã được. Bấm Xác nhận đã nhận cọc lần nữa để ghi như chuyển khoản tay (chờ đối soát). | This VietQR code has expired, so it can't be confirmed against the code. Select Confirm deposit received again to record it as a manual transfer (awaiting reconciliation). | ⟨chừa chỗ⟩ | H11: confirmPaymentReceived 409 INVALID_TRANSITION currentState=expired |
| `dep.qr_amount_differs` | Số đã nhận khác số trên mã VietQR ({amount}) – khoản này được ghi như chuyển khoản tay, chờ đối soát. | The amount received differs from the VietQR amount ({amount}) – it is recorded as a manual transfer, awaiting reconciliation. | ⟨chừa chỗ⟩ | H11: không xác nhận giao dịch QR, ghi confirmDeposit.payment |
| `sale.qr_after_ctv` | Sau khi giữ chỗ, nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách – nội dung chuyển khoản là mã đơn. | After the hold, ask the front desk or sales staff to send the guest the deposit VietQR – the transfer reference is the booking ID. | ⟨chừa chỗ⟩ | H12 CTV: createVietQr không có vai collaborator (thay sale.qr_after – BUG-R2-062) |
| `sale.hold_next_ctv` | Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách. Bạn sẽ được nhắc {hours} giờ trước khi giữ chỗ hết hạn. | Ask the front desk or sales staff to send the guest the deposit VietQR. You'll get a reminder {hours} hours before the hold expires. | ⟨chừa chỗ⟩ | H12 CTV sau giữ chỗ (thay sale.hold_next) |
| `move.group_guest` | Khách xin đổi – tính giá căn mới | Guest asked – new room's rate | ⟨chừa chỗ⟩ | optgroup lý do: guest_request |
| `move.group_ottimo` | OTTIMO đổi – giữ giá đã đặt | OTTIMO's decision – booked rate kept | ⟨chừa chỗ⟩ | optgroup: property_fault, overbooking, upgrade, inventory_optimize, force_majeure |
| `move.group_other` | Khác – giữ giá đã đặt | Other – booked rate kept | ⟨chừa chỗ⟩ | optgroup: other (sang căn đắt hơn chỉ FDL+) |
| `move.preview_title` | Tính thử trước khi lưu | Price check before saving | ⟨chừa chỗ⟩ | Tiêu đề hộp MovePreview |
| `move.preview_loading` | Đang tính thử… | Checking the price… | ⟨chừa chỗ⟩ |  |
| `move.preview_failed` | Chưa tính thử được nên chưa lưu được thay đổi. Bấm Thử lại. | Couldn't check the price, so the change can't be saved yet. Select Try again. | ⟨chừa chỗ⟩ | kèm nút common.retry |
| `move.basis.new_room_rate` | Khách tự xin đổi căn: mọi đêm tính theo giá hiện hành của căn mới – căn đắt hơn thì trả thêm, rẻ hơn thì được giảm (BR-429). | The guest asked to move: every night uses the new room's current rate – a more expensive room costs more, a cheaper one costs less (BR-429). | ⟨chừa chỗ⟩ | MovePreview.pricingBasis |
| `move.basis.keep_booked_rate` | Giá mỗi đêm giữ như lúc đặt (BR-429). | Each night keeps its booked rate (BR-429). | ⟨chừa chỗ⟩ | MovePreview.pricingBasis – dùng cho cả nhóm "OTTIMO đổi" và "Khác" (UXD s4: bỏ 'khi OTTIMO đổi căn' và 'khách không trả thêm' – sai khi lý do Khác hoặc khi dời ngày có đêm thêm) |
| `move.basis.external_contract` | Giá theo hợp đồng giấy – đổi căn không đổi tiền. | Priced by the paper contract – moving doesn't change the amount. | ⟨chừa chỗ⟩ | MovePreview.pricingBasis (BR-429 (h)) |
| `move.basis.ota` | Đơn OTA: giá OTA giữ nguyên; khách trả tại quầy phần chênh lệch so với căn đã đặt (BR-424). | OTA booking: the OTA price stays; the guest pays the difference against the booked room at the desk (BR-424). | ⟨chừa chỗ⟩ | đơn OTA + guest_request |
| `move.col_night` | Đêm | Night | ⟨chừa chỗ⟩ |  |
| `move.col_old` | Giá cũ (đ) | Old rate (VND) | ⟨chừa chỗ⟩ | Ô trong cột là số trần (`vnd()`), đơn vị ở tiêu đề – content-guide 4 (FB-R2-UXD-FE-S4-02) |
| `move.col_new` | Giá mới (đ) | New rate (VND) | ⟨chừa chỗ⟩ | Như move.col_old |
| `move.night_added` | Đêm thêm | Added night | ⟨chừa chỗ⟩ | oldRateVnd = null |
| `move.room_total` | Tiền phòng | Room charges | ⟨chừa chỗ⟩ |  |
| `move.extra_person` | Phụ thu người vượt định mức | Extra-guest charge | ⟨chừa chỗ⟩ | Thuật ngữ mục 3.1 / occ.fee_line |
| `move.ota_difference` | Chênh lệch đổi căn (thu tại quầy) | Room change difference (paid at the desk) | ⟨chừa chỗ⟩ |  |
| `move.foc_follow` | Miễn phí (FOC) / giảm giá đã duyệt – vẫn áp | Approved complimentary (FOC) / discount – still applied | ⟨chừa chỗ⟩ | Thuật ngữ mục 3.1: Desk viết "Miễn phí (FOC)" |
| `move.pending_foc` | Miễn phí (FOC) chờ duyệt: nếu được duyệt sẽ trừ thêm {amount} (chưa tính ở trên) | Complimentary (FOC) awaiting approval: if approved, a further {amount} comes off (not included above) | ⟨chừa chỗ⟩ | Σ nights[].pendingFocVnd – không vào chênh lệch |
| `move.removed_nights` | Bỏ {n} đêm: {dates} | {n} night(s) removed: {dates} | ⟨chừa chỗ⟩ |  |
| `move.discount_los` | Đã áp lại giảm theo số đêm {pct}% (BR-107) | Length-of-stay discount of {pct}% re-applied (BR-107) | ⟨chừa chỗ⟩ |  |
| `move.discount_returning` | Đã áp lại giảm khách quay lại {pct}% (BR-111) | Returning-guest discount of {pct}% re-applied (BR-111) | ⟨chừa chỗ⟩ |  |
| `move.delta_up` | Khách trả thêm | Guest pays more | ⟨chừa chỗ⟩ | folioDeltaVnd > 0 |
| `move.delta_down` | Khách được giảm | Guest pays less | ⟨chừa chỗ⟩ | folioDeltaVnd < 0 |
| `move.delta_zero` | Không đổi tiền | No change in amount | ⟨chừa chỗ⟩ | folioDeltaVnd = 0 |
| `move.deposit_paid` | Cọc đã thu (giữ nguyên, không thu thêm cọc) | Deposit paid (kept as is, no top-up) | ⟨chừa chỗ⟩ | BR-429 (e) |
| `move.balance_after` | Còn phải thu khi nhận phòng | Balance due at check-in | ⟨chừa chỗ⟩ |  |
| `move.told_guest` | Đã báo khách số tiền mới | I've told the guest the new amount | ⟨chừa chỗ⟩ | Bắt buộc khi khách xin đổi căn (applyDifference, BR-414) – US-024 AC5 |
| `move.save_needs_told` | Tick "Đã báo khách số tiền mới" để bật nút Lưu thay đổi. Khách không đồng ý thì đóng hộp, không lưu. | Tick "I've told the guest the new amount" to enable Save change. If the guest doesn't agree, close without saving. | ⟨chừa chỗ⟩ | Lý do nút Lưu khóa (aria-describedby) |
| `move.save_needs_preview` | Chờ tính thử xong để bật nút Lưu thay đổi. | Wait for the price check to enable Save change. | ⟨chừa chỗ⟩ | Lý do nút Lưu khóa |
| `move.delta_changed` | Số tiền vừa đổi thành {amount} (giá hoặc đơn vừa cập nhật). Xem bản tính thử mới, báo lại khách rồi tick lại. | The amount just changed to {amount} (rates or the booking were updated). Check the new figures, tell the guest again and tick again. | ⟨chừa chỗ⟩ | 409 SURCHARGE_CHANGED của moveReservation |
| `move.warn.MANUAL_RATE_REPRICED` | Có đêm đang là giá sửa tay hoặc giá thỏa thuận – nay tính theo giá căn mới. Muốn giữ ưu đãi thì sửa giá đêm sau khi lưu. | Some nights had a manual or agreed rate – they now use the new room's rate. To keep the deal, edit the night rate after saving. | ⟨chừa chỗ⟩ | MovePreview.warnings (BR-429 (g)) |
| `move.suggested` | Gợi ý {amount} | Suggested {amount} | ⟨chừa chỗ⟩ | nights[].suggestedRateVnd |
| `ci.due_title` | Cần thu để nhận phòng | To collect before check-in | ⟨chừa chỗ⟩ |  |
| `ci.due_balance` | Còn phải thu hiện tại | Current balance | ⟨chừa chỗ⟩ |  |
| `ci.due_early` | Phụ thu nhận sớm (ghi khi nhận phòng) | Early check-in charge (posted at check-in) | ⟨chừa chỗ⟩ |  |
| `ci.due_prior_night` | Tiền phòng đêm thêm (ghi khi nhận phòng) | Added night – room charge (posted at check-in) | ⟨chừa chỗ⟩ | B9a – tiền phòng, không phải phụ thu (checkin.prior_night) |
| `ci.due_foc` | Đang xin miễn phí (FOC) – chưa thu lúc này | Complimentary (FOC) requested – not collected now | ⟨chừa chỗ⟩ | BR-402 v0.3.6: FOC chờ duyệt trên khoản phát sinh |
| `ci.pay_inline` | Khoản thu {amount} được ghi cùng lúc với nhận phòng – nhận phòng không thành thì không ghi tiền. | The {amount} payment is recorded together with the check-in – if the check-in fails, nothing is recorded. | ⟨chừa chỗ⟩ | checkIn.payment (tiền mặt, chuyển khoản, thẻ POS) |
| `ci.pay_qr_first` | VietQR: tạo mã, chờ tiền về rồi bấm Ghi nhận đã thu trước khi nhận phòng. | VietQR: create the code, wait for the money, then select Record payment before checking in. | ⟨chừa chỗ⟩ | createVietQr purpose=check_in + confirmPaymentReceived |
| `ci.submit_needs_pay` | Thu {amount} ở mục Thu tiền trước khi nhận phòng. | Collect {amount} under Payment before checking in. | ⟨chừa chỗ⟩ | Lý do nút Nhận phòng khóa |
| `ci.effect_pay` | Ghi khoản thu {amount} – {method} | Record a payment of {amount} – {method} | ⟨chừa chỗ⟩ | Hộp xác nhận nhận phòng |
| `svc.title` | Dịch vụ trong đơn | Services on the booking | ⟨chừa chỗ⟩ |  |
| `svc.help` | Mặc định các dòng dịch vụ được đảo (không thu). Chỉ giữ (vẫn thu) dòng khách đã dùng hoặc OTTIMO đã tốn chi phí – kèm lý do. | By default, service lines are reversed (not charged). Keep (still charge) only a line the guest used or that already cost OTTIMO money – with a reason. | ⟨chừa chỗ⟩ | CancellationQuote.serviceLines / folio khi no-show |
| `svc.keep` | Giữ {label} · {amount} | Keep {label} · {amount} | ⟨chừa chỗ⟩ | Ô tick mỗi dòng |
| `svc.performed` | Đã thực hiện | Already provided | ⟨chừa chỗ⟩ | Chip gợi ý (serviceLines[].performed) |
| `svc.reason` | Lý do giữ | Reason for keeping | ⟨chừa chỗ⟩ |  |
| `svc.summary` | Đảo {reversed} · giữ {retained} | Reversed {reversed} · kept {retained} | ⟨chừa chỗ⟩ |  |
| `svc.reason_needed` | Ghi lý do cho mỗi dòng giữ (ít nhất 3 ký tự). | Give a reason for each kept line (at least 3 characters). | ⟨chừa chỗ⟩ | Lý do nút Hủy đơn / No-show khóa |
| `svc.load_failed` | Chưa tải được dòng dịch vụ của đơn nên chưa đánh dấu không đến được. Bấm Thử lại. | Couldn't load the booking's service lines, so the no-show can't be marked yet. Select Try again. | ⟨chừa chỗ⟩ | No-show: getFolio lỗi – kèm common.retry; đặt id để nút No-show trỏ aria-describedby (FB-R2-UXD-FE-S4-13) |
| `cancel.refund_request` | Sẽ tạo yêu cầu hoàn {amount} – cần quản lý duyệt. | A refund request of {amount} will be created – it needs manager approval. | ⟨chừa chỗ⟩ | CancellationQuote.refundRequestVnd khi khác refundableVnd (S4-06) |

#### R2 Sprint 4 – FE-B vận hành: ghi công nợ, ảnh biên nhận cọc, Hôm nay, Tổng quan, Cần chú ý (FE viết theo content guide; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `co.debt_toggle` | Ghi công nợ – khách trả sau | Record as debt – guest pays later | ⟨chừa chỗ⟩ | H16 bước 3, chỉ MGR/OWN (A19) khi còn phải thu > 0 – US-038 AC3 (S4-26) |
| `co.debt_help` | Khách đi khi còn {amount} chưa thu. Hạn thanh toán và lý do lưu vào nhật ký tiền. | The guest leaves with {amount} unpaid. The due date and reason go into the money log. | ⟨chừa chỗ⟩ | {amount} kèm đơn vị |
| `co.debt_due` | Hạn thanh toán | Payment due | ⟨chừa chỗ⟩ | checkOut.debt.dueDate |
| `co.debt_reason` | Lý do ghi công nợ | Reason for the debt | ⟨chừa chỗ⟩ | checkOut.debt.reason (ít nhất 3 ký tự) |
| `co.debt_due_past` | Chọn hạn thanh toán từ hôm nay trở đi. | Choose a due date from today onwards. | ⟨chừa chỗ⟩ | Kiểm ở client; server kiểm lại |
| `co.debt_needs` | Nhập hạn thanh toán và lý do (ít nhất 3 ký tự) để bật nút Ghi công nợ. | Enter a due date and a reason (at least 3 characters) to enable Record as debt. | ⟨chừa chỗ⟩ | Lý do nút Hoàn tất khóa (aria-describedby) |
| `co.debt_effect` | Ghi công nợ {amount}, hạn {date} – lý do lưu vào nhật ký tiền. | Records a debt of {amount}, due {date} – the reason goes into the money log. | ⟨chừa chỗ⟩ | Hộp xác nhận Hoàn tất (US-135) |
| `co.complete_debt` | Ghi công nợ {amount} – hoàn tất | Record {amount} as debt and complete | ⟨chừa chỗ⟩ | Nút chính bước 3 khi bật ghi công nợ |
| `rsv.receipt_help` | Ảnh chụp màn hình chuyển khoản hoặc biên nhận (JPG, PNG, WebP, tối đa 10 MB). Không bắt buộc nhưng nên gửi – lễ tân dùng ảnh để đối chiếu sao kê. | A screenshot of the transfer or the receipt (JPG, PNG, WebP, up to 10 MB). Optional but recommended – the front desk uses it to check the bank statement. | ⟨chừa chỗ⟩ | Dưới ô rsv.attach_receipt (S4-30). [GIẢ ĐỊNH FE-B – PO xác nhận] ảnh không bắt buộc; PO chọn bắt buộc thì bỏ vế 'Không bắt buộc nhưng nên gửi' |
| `rsv.receipt_upload_failed` | Chưa gửi được ảnh biên nhận nên chưa báo chuyển cọc. Số tiền và ảnh vẫn còn – bấm Báo đã chuyển cọc để thử lại. | Couldn't upload the receipt, so the deposit hasn't been reported yet. The amount and photo are still here – select Report deposit sent to try again. | ⟨chừa chỗ⟩ | uploadAttachment lỗi mạng/5xx – FE-B chưa dùng (FB-R2-UXD-FE-S4-15) |
| `today.attention_empty` | Không có việc cần chú ý. | Nothing needs attention. | ⟨chừa chỗ⟩ | EP01 3.2 (US-012 AC5) – H03; Tổng quan dùng ov.attn_empty_* |
| `today.arrivals_empty` | Không có khách đến hôm nay. | No arrivals today. | ⟨chừa chỗ⟩ | EP01 mục 6 – khối rỗng |
| `today.departures_empty` | Không có khách đi hôm nay. | No departures today. | ⟨chừa chỗ⟩ | EP01 mục 6 – khối rỗng |
| `today.kpi_arrivals_note` | {done} đã nhận phòng | {done} checked in | ⟨chừa chỗ⟩ | TonightKpi.arrivalsCheckedIn (0.3.7 B-19) |
| `today.kpi_departures_note` | {done} đã trả phòng | {done} checked out | ⟨chừa chỗ⟩ | TonightKpi.departuresCheckedOut (0.3.7 B-19) |
| `today.kpi_holds` | + {n} căn đang giữ chỗ (chưa tính) | + {n} room(s) on hold (not counted) | ⟨chừa chỗ⟩ | TonightKpi.holdOnlyRooms > 0 (BR-904); 0 → ẩn |
| `today.kpi_unassigned` | + {n} đơn OTA chưa gán căn (chưa tính) | + {n} OTA booking(s) without a room (not counted) | ⟨chừa chỗ⟩ | TonightKpi.unassignedConflictReservations > 0 (S1c) – bấm mở sơ đồ phòng |
| `today.same_room_arrival` | Có khách đến cùng căn hôm nay | Arrival in this room today | ⟨chừa chỗ⟩ | departures[].hasArrivalSameRoomToday – xếp đầu (US-031 AC2) |
| `today.assign_first` | Gán căn trước khi nhận phòng | Assign a room before check-in | ⟨chừa chỗ⟩ | Đơn chưa gán căn – nút Nhận phòng khóa (US-139 AC3) |
| `today.balance_due` | Còn phải thu {amount} | {amount} to collect | ⟨chừa chỗ⟩ | ReservationSummary.balanceDueVnd > 0 (FD+) |
| `today.dep_replied` | Đã trả lời | Replied | ⟨chừa chỗ⟩ | reminderState = replied khi danh sách không có giờ hẹn (ReservationSummary không có agreedCheckoutTime) – stay.card_answered cần {time} |
| `attn.capacity_conflict` | Đơn {code}: số khách vượt sức chứa căn – đổi căn hoặc xác nhận lại số khách | Booking {code}: more guests than the room takes – move rooms or confirm the guest count | ⟨chừa chỗ⟩ | kind capacity_conflict (DOM D-1); refCode = mã đơn |
| `attn.work_order_overdue` | Phiếu sửa {code} quá hạn xử lý | Work order {code} is overdue | ⟨chừa chỗ⟩ | kind work_order_overdue; refCode = mã WO |
| `attn.extra_guest_kit_overdue` | Bộ đồ dùng thêm căn {room} chưa chuẩn bị xong | The extra amenity kit for room {room} isn't ready | ⟨chừa chỗ⟩ | kind extra_guest_kit_overdue (BR-812); {room} = 401 · The Pine |
| `attn.room_status_mismatch` | Căn {room}: trạng thái buồng không khớp với đơn – kiểm tra lại | Room {room}: housekeeping status doesn't match the booking – check it | ⟨chừa chỗ⟩ | kind room_status_mismatch (BR-806) |
| `attn.reconcile_overdue` | Chờ đối soát quá hạn: {n} giao dịch, cũ nhất {days} ngày | Overdue reconciliation: {n} payment(s), oldest {days} days | ⟨chừa chỗ⟩ | kind reconcile_overdue – params.count, params.oldestDays = tuổi giao dịch cũ nhất (không phải ngưỡng – UXD s4 sửa nghĩa câu); FD không nhận |
| `attn.ooo_ending_work_open` | Căn {room} mở bán lại {date} nhưng phiếu {code} chưa xong | Room {room} goes back on sale {date} but work order {code} isn't done | ⟨chừa chỗ⟩ | kind ooo_ending_work_open – params.roomNo, params.endDate; refCode = mã WO |
| `attn.guest_request_overdue` | Yêu cầu của khách chưa có người nhận: {n} | Guest requests nobody has picked up: {n} | ⟨chừa chỗ⟩ | kind guest_request_overdue (BR-811, US-110 AC2) |
| `attn.ota_no_show_report` | Báo khách không đến cho {channel} – đơn {code} | Report the no-show to {channel} – booking {code} | ⟨chừa chỗ⟩ | kind ota_no_show_report, params.action = report (US-136 AC2); đóng bằng attn.reported_channel. Thuật ngữ 3.1: no_show = "Không đến" |
| `attn.ota_no_show_revoke` | Báo {channel} hủy đánh dấu không đến – đơn {code} | Ask {channel} to cancel the no-show – booking {code} | ⟨chừa chỗ⟩ | kind ota_no_show_report, params.action = revoke (US-136 AC5) |
| `attn.closed_reservation_credit` | Đơn đã đóng {code} còn tiền dư – hoàn cho khách hoặc ghi khách để lại | Closed booking {code} still has a credit – refund the guest or record that they leave it | ⟨chừa chỗ⟩ | kind closed_reservation_credit (S4-06, BR-522) – không số tiền; tự đóng |
| `attn.other` | Mục cần kiểm tra: {n} | Item(s) to check: {n} | ⟨chừa chỗ⟩ | kind client chưa biết – không bỏ mục |
| `attn.resolve` | Đã xử lý | Mark as handled | ⟨chừa chỗ⟩ | Mục nguồn event – resolveAttentionEvent |
| `attn.reported_channel` | Đã báo kênh | Reported to the channel | ⟨chừa chỗ⟩ | Nút đóng ota_no_show_report sau khi lễ tân làm trên extranet |
| `attn.resolve_title` | Đóng mục: {what} | Close item: {what} | ⟨chừa chỗ⟩ | Hộp đóng mục event |
| `attn.resolve_note` | Ghi chú xử lý | What was done | ⟨chừa chỗ⟩ | resolveAttentionEvent.note (≤ 500) |
| `attn.resolve_note_help` | Bắt buộc với mục khẩn – ít nhất 3 ký tự. Không ghi số thẻ. | Required for urgent items – at least 3 characters. Don't enter card numbers. | ⟨chừa chỗ⟩ | EP01 3.2 – critical bắt buộc |
| `attn.resolved` | Đã đóng mục cần chú ý. | Item closed. | ⟨chừa chỗ⟩ | Toast |
| `ov.approvals_empty` | Không có yêu cầu chờ duyệt. | Nothing waiting for approval. | ⟨chừa chỗ⟩ |  |
| `ov.approvals_error` | Chưa tải được mục Cần duyệt | Couldn't load approvals | ⟨chừa chỗ⟩ |  |
| `ov.kpi_error` | Chưa tải được số liệu đêm nay | Couldn't load tonight's figures | ⟨chừa chỗ⟩ | KPI lỗi không làm mất Cần chú ý (H24 24.1) |

#### R2 Sprint 4 – MOB: PWA OTTIMO Staff (H19–H22) – chuỗi còn thiếu (EP07-08 8.1–8.3 "(mới)"; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `staff.login_sub` | Buồng phòng và bảo trì | Housekeeping and maintenance | ⟨chừa chỗ⟩ | Dòng phụ màn đăng nhập PWA, dưới chữ OTTIMO Staff |
| `staff.lang.vi` | Tiếng Việt | Tiếng Việt | ⟨chừa chỗ⟩ | Tên ngôn ngữ viết bằng chính ngôn ngữ đó (nút chọn ở màn Tôi) |
| `staff.lang.en` | English | English | ⟨chừa chỗ⟩ | Như trên |
| `hk.data_as_of` | Dữ liệu lúc {time} | Data as of {time} | ⟨chừa chỗ⟩ | EP07-08 8.1 (mới): dòng phụ đầu màn khi đang xem bản lưu trên máy (mất mạng) |
| `hk.chip.queued` | Chờ gửi | Waiting to send | ⟨chừa chỗ⟩ | EP07-08 8.3 (mới): chip trên thẻ căn/việc có thao tác còn trên máy |
| `hk.queue_full` | Có quá nhiều thao tác đang chờ gửi. Kết nối mạng để gửi rồi làm tiếp – các thao tác vẫn còn trên máy. | Too many changes are waiting to send. Get online to send them, then carry on – they're still on this phone. | ⟨chừa chỗ⟩ | EP07-08 8.2 (mới): ≤ 200 mục, ≤ 20 ảnh chờ gửi [GIẢ ĐỊNH BA] |
| `hk.queue_logout_warn` | Còn {n} thao tác chưa gửi. Đăng xuất bây giờ sẽ mất các thao tác này. | {n} changes haven't been sent yet. Signing out now will lose them. | ⟨chừa chỗ⟩ | EP07-08 8.1 (mới), SR-PWA-04: hộp xác nhận trước khi đăng xuất |
| `hk.queue.logout_anyway` | Vẫn đăng xuất | Sign out anyway | ⟨chừa chỗ⟩ | Nút xác nhận của hộp trên |
| `hk.queue.too_old` | Lúc bạn bấm ({time}) đã quá lâu nên máy chủ không nhận. Báo lễ tân nếu căn vẫn cần cập nhật. | Tapped too long ago ({time}), so the server didn't accept it. Tell the front desk if the room still needs updating. | ⟨chừa chỗ⟩ | 422 PERFORMED_AT_OUT_OF_RANGE → Cần xem lại (SR-PWA-05) |
| `hk.queue.checklist_outdated` | Danh mục kiểm phòng vừa thay đổi. Mở lại căn {room} và kiểm lại. | The inspection checklist has just changed. Open room {room} again and inspect it again. | ⟨chừa chỗ⟩ | 409 CHECKLIST_OUTDATED → Cần xem lại |
| `hk.queue.rejected_other` | Máy chủ không nhận thao tác này (mã {code}). Báo lễ tân nếu căn vẫn cần cập nhật. | The server didn't accept this change (code {code}). Tell the front desk if the room still needs updating. | ⟨chừa chỗ⟩ | Mã từ chối khác (403, 404, 422 khác) – không bỏ im lặng (ADR-005) |
| `hk.task.complete` | Làm xong | Mark done | ⟨chừa chỗ⟩ | Nút một chạm của việc không phải dọn (yêu cầu khách, bổ sung minibar) – động từ như "Dọn xong" (C1) |
| `hk.toast.task_done` | Căn {room}: đã xong việc | Room {room}: task done | ⟨chừa chỗ⟩ | Toast hoàn tác sau Đã làm xong; {room} = "401 · The Pine" |
| `hk.toast.insp_failed` | Căn {room}: đã ghi chưa đạt | Room {room}: marked as not passed | ⟨chừa chỗ⟩ | Toast hoàn tác sau Ghi chưa đạt (H20.3) |
| `hk.kit.transfer_to` | Chuyển {n} bộ đồ dùng thêm sang căn {room} | Move {n} extra-guest kit(s) to room {room} | ⟨chừa chỗ⟩ | HkTask chỉ có căn đích (không có căn cũ) – thay hk.kit.transfer khi thiếu {from} |
| `hk.photo_remove` | Bỏ ảnh {n} | Remove photo {n} | ⟨chừa chỗ⟩ | aria-label nút x trên ô ảnh |
| `hk.photo_processing` | Đang chuẩn bị ảnh… | Preparing photo… | ⟨chừa chỗ⟩ | Nút Chụp khi đang nén ảnh ≤ 300 KB – HK dùng câu thường (không "nén") |
| `hk.photo_error` | Chưa dùng được ảnh này – chụp lại. | This photo can't be used – take it again. | ⟨chừa chỗ⟩ | Ảnh không đọc được trên máy (HEIC lỗi, tệp hỏng) |
| `wo.log.created` | {who} tạo phiếu | {who} created the work order | ⟨chừa chỗ⟩ | WorkOrder.history change=created (nguồn khác buồng phòng/khách) |
| `wo.log.status` | {who}: {from} → {to} | {who}: {from} → {to} | ⟨chừa chỗ⟩ | history change=status – {from}/{to} = wo.status.* |
| `wo.log.severity` | {who} đổi mức: {from} → {to} | {who} changed the priority: {from} → {to} | ⟨chừa chỗ⟩ | history change=severity – wo.sev.* |
| `wo.log.assignee` | Người xử lý: {to} ({who} giao) | Assigned to {to} (by {who}) | ⟨chừa chỗ⟩ | history change=assignee |
| `wo.log.block_requested` | {who} đề nghị khóa căn | {who} suggested blocking the room | ⟨chừa chỗ⟩ | history change=block_requested |
| `wo.log.block` | {who} khóa căn | {who} blocked the room | ⟨chừa chỗ⟩ | history change=block (không giả định người khóa là lễ tân – thay wo.log.blocked) |
| `wo.log.parts_date` | {who}: vật tư dự kiến {date} | {who}: parts expected {date} | ⟨chừa chỗ⟩ | history change=parts_expected_date |
| `wo.log.note` | {who}: {note} | {who}: {note} | ⟨chừa chỗ⟩ | history change=note |

#### R2 Sprint 4 – MOB: guest-web giọng thương hiệu + H23 (DS 11.2.2 của UXD; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `gw.welcome_title` | Welcome to OTTIMO, {name}. | Welcome to OTTIMO, {name}. | Welcome to OTTIMO, {name}. | DS 11.2.2 G2 – H1 trang lưu trú, luôn bản EN (lang="en") ở mọi ngôn ngữ |
| `gw.welcome_title_plain` | Welcome to OTTIMO. | Welcome to OTTIMO. | Welcome to OTTIMO. | Như trên khi phiên không có tên gọi (mở lại trang) [GIẢ ĐỊNH MOB – UXD duyệt] |
| `gw.welcome_sub` | Chúc bạn có một kỳ nghỉ an yên. | We hope you enjoy your stay. | Желаем вам спокойного отдыха. | DS 11.2.2 – dòng hỗ trợ: trang VI/RU hiện bản ngôn ngữ trang, trang EN hiện bản VI (lang="vi"). RU nháp, cần người bản ngữ duyệt |
| `gw.room_label` | Phòng | Room | Номер | DS 11.2.2 G3 – nhãn dòng tên phòng (thay gw.room "Căn"); BR-012 khách chỉ thấy tên phòng. RU nháp |
| `gw.req.decline.not_available_now` | Hiện chưa thực hiện được | Not available right now | ⟨chừa chỗ⟩ | CŨ – thay bằng guest.req.decline.not_available_now (khóa = mã hợp đồng, UXD s4); giữ tới khi MOB/FE đổi, xóa ở v0.5 |
| `gw.req.decline.needs_front_desk` | Lễ tân sẽ liên hệ bạn để xử lý trực tiếp | The front desk will contact you about this | ⟨chừa chỗ⟩ | CŨ – thay bằng guest.req.decline.needs_front_desk; xóa ở v0.5 |
| `gw.req.decline.duplicate` | Trùng với một yêu cầu bạn đã gửi | Same as a request you've already sent | ⟨chừa chỗ⟩ | CŨ – thay bằng guest.req.decline.duplicate; xóa ở v0.5 |
| `gw.req.paid_limit` | Bạn đang có số yêu cầu có phí tối đa chưa hoàn tất. Bạn có thể gửi thêm khi các yêu cầu đó xong. | You have the maximum number of paid requests in progress. You can send more once they're complete. | ⟨chừa chỗ⟩ | unavailableReason=paid_limit_reached (B-16). UXD s4: bỏ số 3 viết cứng (content-guide 2) – API không trả tham số |
| `gw.req.note_label` | Mô tả | Details | ⟨chừa chỗ⟩ | Nhãn ô ghi chú khi loại yêu cầu bắt buộc ghi (noteRequired) – thay guest.req.note "không bắt buộc" |

#### R2 Sprint 4 – UXD bổ sung giữa sprint: tên phòng dự phòng (khách), trả lời tự động và lý do từ chối theo mã, thu tiền khi nhận phòng, tính thử đổi căn, dịch vụ khi no-show (s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `gw.room_fallback` | phòng {no} | room {no} | номер {no} | DS 11.2.2 / 11.3 – khách thấy khi căn chưa có tên (OWN chưa nhập H04); viết thường vì thường đứng giữa câu. Khi đứng riêng sau nhãn gw.room_label vẫn dùng câu này; gắn lang theo ngôn ngữ trang (không lang="en" như tên phòng). RU nháp |
| `ci.submit_cash_short` | Khách đưa thiếu {amount}. Nhận đủ tiền hoặc chọn cách thu khác để nhận phòng. | The guest is {amount} short. Collect the full amount or choose another method to check in. | ⟨chừa chỗ⟩ | H13 – tiền mặt: ô "Khách đưa" có số và nhỏ hơn số cần thu → nút Nhận phòng khóa, câu cạnh nút (aria-describedby). Ô để trống = khách đưa đủ (giữ hành vi cũ) |
| `ci.pay_after_lead` | Đang gửi yêu cầu lễ tân trưởng duyệt nên chưa ghi khoản thu. Thu {amount} khi nhận phòng sau khi được duyệt, hoặc thu trước bằng VietQR. | This goes to the senior receptionist for approval, so no payment is recorded now. Collect {amount} at check-in once approved, or take it now by VietQR. | ⟨chừa chỗ⟩ | H13 mục Thu tiền khi requestOnly (FD + buồng chưa sẵn sàng + có lý do) – thay ci.pay_inline; chỉ còn lựa chọn VietQR. Không khóa nút gửi yêu cầu vì balance_paid |
| `move.night_ota_diff` | +{amount} chênh lệch đổi căn | +{amount} room change difference | ⟨chừa chỗ⟩ | nights[].roomChangeDifferenceVnd – dòng phụ .li-s dưới giá mới (thay " + 300.000 đ" ghép trong ô) |
| `move.nights_toggle` | Xem giá từng đêm ({n} đêm) | Show nightly rates ({n} nights) | ⟨chừa chỗ⟩ | <details> khi > 7 đêm; ≤ 7 đêm hiện thẳng bảng |
| `svc.loading` | Đang tải dịch vụ trong đơn… | Loading the booking's services… | ⟨chừa chỗ⟩ | Hộp No-show khi getFolio chưa về (nút No-show khóa) – role=status, thay khoảng trống |
| `guest.req.auto_reply` | OTTIMO đã nhận yêu cầu của bạn lúc {time}. Lễ tân sẽ xử lý từ {open_time}. Nếu cần gấp, bạn vui lòng gọi {phone}. | We received your request at {time}. Our front desk will take care of it from {open_time}. If it is urgent, please call {phone}. | Мы получили ваш запрос в {time}. Администратор займётся им с {open_time}. Если дело срочное, позвоните, пожалуйста, по номеру {phone}. | Server dựng (GuestRequestForGuest.autoReply) theo ngôn ngữ phiên: {time} = giờ nhận (HH:mm), {open_time} = giờ mở trực (front_desk_hours), {phone} = property.phone_public. Giọng thương hiệu: không "!", không "Quý khách". RU nháp – cần người bản ngữ duyệt |
| `guest.req.decline.not_available_now` | Hiện chưa thực hiện được | Not available right now | Сейчас это недоступно | declinedReasonCode = not_available_now (0.3.6 B-15) – thay gw.req.decline.not_available_now · RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt |
| `guest.req.decline.outside_service_hours` | Ngoài giờ phục vụ | Outside service hours | Вне часов обслуживания | declinedReasonCode = outside_service_hours – thay guest.req.decline.out_of_hours (tên lệch mã) · RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt |
| `guest.req.decline.needs_front_desk` | Lễ tân sẽ liên hệ bạn để xử lý trực tiếp | The front desk will contact you about this | Администратор свяжется с вами по этому вопросу | declinedReasonCode = needs_front_desk – thay gw.req.decline.needs_front_desk · RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt |
| `guest.req.decline.duplicate` | Trùng với một yêu cầu bạn đã gửi | Same as a request you've already sent | Вы уже отправляли такой запрос | declinedReasonCode = duplicate – thay gw.req.decline.duplicate · RU nháp (UXD s4-strings-2) – cần người bản ngữ duyệt |

#### R2 Sprint 4 – FE-A đợt 2: duyệt hoàn theo phiên bản, bỏ người khỏi đoàn, giá căn gợi ý, báo giá RU, điều chỉnh folio (FE viết theo content guide; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `party.slot_question` | Ảnh giấy tờ khách gửi qua link nào là của {name}? | Which ID sent through the link belongs to {name}? | ⟨chừa chỗ⟩ | Hộp "Bỏ khỏi đơn" khi người bị bỏ chưa có giấy tờ gắn và còn ô chưa gắn (SEC-BE-53, BUG-R2-085/090); không chọn sẵn |
| `party.slot_none` | Không có – người này không gửi giấy tờ qua link | None – this guest didn't send an ID through the link | ⟨chừa chỗ⟩ | guestUploadPersonIndex=none |
| `party.slot_help` | Giấy tờ ở ô đã chọn bị xóa ngay cùng người này; các ô khác giữ nguyên, ô phía sau dồn số lên. Chưa chắc thì mở giấy tờ để đối chiếu ảnh. | The ID in the chosen slot is deleted now with this guest; the other IDs stay and later slots move up. Not sure? Open the IDs to compare the photos. | ⟨chừa chỗ⟩ | Ô phía sau dồn số (0.3.7) |
| `party.slot_compare` | Mở giấy tờ để đối chiếu ảnh (tab mới) | Open the IDs to compare the photos (new tab) | ⟨chừa chỗ⟩ | H14 – xem ảnh qua đường C3 có sẵn (step-up, tự ẩn) |
| `party.slot_required` | Chọn ô giấy tờ của người này hoặc "Không có" để bật nút Bỏ khỏi đơn. | Choose this guest's ID slot or "None" to enable Remove from booking. | ⟨chừa chỗ⟩ | Lý do nút Bỏ khỏi đơn khóa |
| `reg.link.dup_unclaimed` | Số giấy tờ này trùng giấy tờ khách đã gửi qua link ở ô Khách {n}, đang chờ gắn người. Mở giấy tờ đó và gắn người – không cần nhập mới. | This ID number matches the ID the guest sent through the link in slot Guest {n}, which is waiting to be linked. Open that ID and link it to the guest – no need to add it again. | ⟨chừa chỗ⟩ | addGuestDocument 409 DOCUMENT_UNCLAIMED_EXISTS (documentId, personIndex) – kèm reg.link.open_pending |
| `reg.link.dialog_help` | Chỉ gắn giấy tờ vào người trong đoàn – không cần mở số giấy tờ hay nhập lại. | This only links the ID to a guest in the party – no need to open the ID number or type it again. | ⟨chừa chỗ⟩ | Hộp Gắn người (GuestDocumentLink – không đọc C3) |
| `bk.use_room_check` | Đổi sang căn {room} – xem giá trước khi tạo đơn | Switching to room {room} – check the price before creating the booking | ⟨chừa chỗ⟩ | H09: sau khi bấm bk.use_room / bk.use_room_orphan – không tạo đơn ngay |
| `bk.use_room_confirm` | Tạo đơn ở căn {room} | Create the booking in room {room} | ⟨chừa chỗ⟩ | Nút xác nhận một bấm |
| `bk.use_room_pricing` | Đang tính giá căn {room}… | Pricing room {room}… | ⟨chừa chỗ⟩ | calculateQuote của căn gợi ý đang chạy – nút xác nhận khóa |
| `folio.open` | Folio & điều chỉnh | Folio & adjustments | ⟨chừa chỗ⟩ | Nút trong drawer đơn (FD+) |
| `folio.dialog_title` | Folio · {code} | Folio · {code} | ⟨chừa chỗ⟩ |  |
| `folio.col_line` | Dòng | Line | ⟨chừa chỗ⟩ |  |
| `folio.col_amount` | Thành tiền (đ) | Amount (VND) | ⟨chừa chỗ⟩ | Ô trong cột là số trần (vnd()), đơn vị ở tiêu đề – content-guide 4 (FB-R2-UXD-FE-S4-02) |
| `folio.adjust` | Điều chỉnh | Adjust | ⟨chừa chỗ⟩ |  |
| `folio.adjust_title` | Điều chỉnh: {label} | Adjust: {label} | ⟨chừa chỗ⟩ |  |
| `folio.adjust_qty` | Số lượng mới | New quantity | ⟨chừa chỗ⟩ |  |
| `folio.adjust_price` | Đơn giá mới | New unit price | ⟨chừa chỗ⟩ |  |
| `folio.adjust_night_price` | Giá đêm mới (trước giảm theo số đêm) | New night rate (before the length-of-stay discount) | ⟨chừa chỗ⟩ | Dòng room/extra_person – S4-35 |
| `folio.adjust_night_help` | Giá lịch của đêm; giảm theo số đêm (BR-107) áp trên giá này. Ngoài sàn–trần của nhóm căn thì không lưu được – thấp hơn sàn thì xin giảm giá đặc biệt. | The night's calendar rate; the length-of-stay discount (BR-107) applies on top. Outside the room group's floor–ceiling it can't be saved – below the floor, request a special discount. | ⟨chừa chỗ⟩ | BR-105, BR-429 (g) |
| `folio.adjust_void` | Bỏ cả dòng (ghi bút toán đảo, không xóa) | Cancel the whole line (a reversal entry – nothing is deleted) | ⟨chừa chỗ⟩ |  |
| `folio.adjust_reason` | Lý do điều chỉnh | Reason for the adjustment | ⟨chừa chỗ⟩ |  |
| `folio.adjust_effect` | Ghi bút toán đảo {old} và dòng mới {new} – dòng cũ vẫn còn trong nhật ký (BR-008). | Records a reversal of {old} and a new line of {new} – the old line stays in the log (BR-008). | ⟨chừa chỗ⟩ |  |
| `folio.adjust_submit` | Ghi điều chỉnh | Record adjustment | ⟨chừa chỗ⟩ |  |
| `folio.adjusted_toast` | Đã ghi điều chỉnh | Adjustment recorded | ⟨chừa chỗ⟩ |  |
| `folio.settled_mgr` | Folio đã chốt – chỉ quản lý hoặc chủ đầu tư ghi bút toán sau chốt, có lý do. | The folio is settled – only a manager or the owner can record a post-settlement adjustment, with a reason. | ⟨chừa chỗ⟩ | A32, US-038 AC2 |
| `folio.settled_fd` | Folio đã chốt – cần điều chỉnh thì nhờ quản lý ghi bút toán. | The folio is settled – ask a manager to record any adjustment. | ⟨chừa chỗ⟩ | FD xem, không có nút |
| `folio.reversal_chip` | Bút toán đảo | Reversal | ⟨chừa chỗ⟩ |  |
| `folio.reversed_chip` | Đã điều chỉnh | Adjusted | ⟨chừa chỗ⟩ |  |
| `folio.payments` | Giao dịch thu | Payments | ⟨chừa chỗ⟩ |  |
| `folio.payments_empty` | Chưa có giao dịch thu. | No payments yet. | ⟨chừa chỗ⟩ |  |
| `pay.reverse` | Đảo giao dịch | Reverse payment | ⟨chừa chỗ⟩ | MGR/OWN (A34, US-119 AC3) |
| `pay.reverse_title` | Đảo giao dịch {amount} – {method}? | Reverse the {amount} payment – {method}? | ⟨chừa chỗ⟩ |  |
| `pay.reverse_body` | Không xóa giao dịch: ghi một giao dịch đảo cùng số tiền, kèm lý do và tên bạn. Còn phải thu tăng lại {amount}. | Nothing is deleted: a reversal of the same amount is recorded with your reason and name. The balance due goes back up by {amount}. | ⟨chừa chỗ⟩ |  |
| `pay.reverse_reason` | Lý do đảo | Reason for the reversal | ⟨chừa chỗ⟩ |  |
| `pay.reverse_done` | Đã đảo giao dịch {amount} | {amount} payment reversed | ⟨chừa chỗ⟩ |  |
| `pay.reverse_invalid` | Giao dịch này đã được đảo hoặc không còn ở trạng thái đã thu. Đóng hộp để xem danh sách mới. | This payment was already reversed or is no longer recorded as received. Close this box to see the latest list. | ⟨chừa chỗ⟩ | reversePayment 409 INVALID_TRANSITION (B-10) |
| `pay.reversed_chip` | Đã đảo | Reversed | ⟨chừa chỗ⟩ |  |
| `approval.changed_since_open` | Yêu cầu này vừa được sửa sau khi bạn mở (số tiền hoặc nơi nhận). Tải lại để xem bản mới rồi quyết định. | This request was changed after you opened it (amount or payout details). Reload to see the latest version, then decide. | ⟨chừa chỗ⟩ | approveRequest/rejectRequest 412 VERSION_CONFLICT – kèm nút common.reload |

#### R2 Sprint 4 – FE-B Desk: buồng phòng, phiếu sửa, khóa phòng, yêu cầu khách, minibar (FE viết theo content guide; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.desk.tasks` | Việc buồng phòng hôm nay | Housekeeping tasks today | ⟨chừa chỗ⟩ | S10 Desk – tiêu đề khối việc |
| `hk.desk.rooms` | Trạng thái buồng | Room status | ⟨chừa chỗ⟩ | S10 Desk – khối 10 căn (listRoomStatuses) |
| `hk.desk.new_task` | Việc mới | New task | ⟨chừa chỗ⟩ | createHkTask (FD+, A83-create) |
| `hk.desk.new_task_title` | Tạo việc buồng phòng | New housekeeping task | ⟨chừa chỗ⟩ |  |
| `hk.desk.task_type` | Loại việc | Task type | ⟨chừa chỗ⟩ |  |
| `hk.desk.due_date` | Ngày làm | Date | ⟨chừa chỗ⟩ |  |
| `hk.desk.note` | Ghi chú cho buồng phòng | Note for housekeeping | ⟨chừa chỗ⟩ | ≤ 300, V-09 – không số thẻ |
| `hk.desk.created` | Đã tạo việc "{type}" – căn {room}. | Task "{type}" created – room {room}. | ⟨chừa chỗ⟩ |  |
| `hk.desk.status.open` | Chưa làm | To do | ⟨chừa chỗ⟩ | HkTaskStatus open |
| `hk.desk.status.in_progress` | Đang làm | In progress | ⟨chừa chỗ⟩ |  |
| `hk.desk.status.cancelled` | Đã hủy | Cancelled | ⟨chừa chỗ⟩ |  |
| `hk.desk.done_toast` | Đã ghi xong "{type}" – căn {room}. | "{type}" marked done – room {room}. | ⟨chừa chỗ⟩ | transitionHkTask complete từ Desk |
| `hk.desk.cancel` | Hủy việc | Cancel task | ⟨chừa chỗ⟩ |  |
| `hk.desk.cancel_title` | Hủy việc "{type}" – căn {room}? | Cancel "{type}" – room {room}? | ⟨chừa chỗ⟩ |  |
| `hk.desk.cancel_effect` | Việc bỏ khỏi danh sách của buồng phòng. Cần làm lại thì tạo việc mới. | The task leaves the housekeeping list. If it's needed later, create a new task. | ⟨chừa chỗ⟩ |  |
| `hk.desk.cancelled_toast` | Đã hủy việc – căn {room}. | Task cancelled – room {room}. | ⟨chừa chỗ⟩ |  |
| `hk.desk.cancel_by.day_ended` | Hết ngày – hệ thống bỏ | Day ended – removed automatically | ⟨chừa chỗ⟩ | cancelReasonCode do hệ thống đặt |
| `hk.desk.cancel_by.reservation_changed` | Đơn thay đổi – hệ thống bỏ | Booking changed – removed automatically | ⟨chừa chỗ⟩ |  |
| `hk.desk.cancel_by.room_blocked` | Căn bị khóa – hệ thống bỏ | Room blocked – removed automatically | ⟨chừa chỗ⟩ |  |
| `hk.task.carried_over` | Từ hôm trước | From yesterday | ⟨chừa chỗ⟩ | HkTask.carriedOver (DOM D-12 c) |
| `hk.desk.due_before` | trước {time} | by {time} | ⟨chừa chỗ⟩ |  |
| `hk.desk.since` | từ {time} | since {time} | ⟨chừa chỗ⟩ | RoomStatusEntry.since |
| `hk.desk.insp_failed` | Kiểm chưa đạt | Inspection failed | ⟨chừa chỗ⟩ | RoomStatusEntry.inspectionFailed |
| `hk.desk.open_tasks` | {n} việc đang mở | {n} open task(s) | ⟨chừa chỗ⟩ |  |
| `hk.desk.tasks_empty` | Hôm nay chưa có việc buồng phòng. | No housekeeping tasks today. | ⟨chừa chỗ⟩ |  |
| `hk.desk.type.extra_guest_kit_transfer` | Chuyển bộ đồ dùng thêm sang căn này | Move the extra amenity kit to this room | ⟨chừa chỗ⟩ | HkTask không có căn cũ – câu ngắn thay hk.kit.transfer |
| `wo.tab.blocks` | Khóa phòng | Room blocks | ⟨chừa chỗ⟩ | Tab S11 Desk – khối OOO (listRoomBlocks) |
| `wo.filter.done` | Đã xong ({n}) | Done ({n}) | ⟨chừa chỗ⟩ |  |
| `wo.col.code` | Mã phiếu | Work order | ⟨chừa chỗ⟩ |  |
| `wo.col.title` | Sự cố | Issue | ⟨chừa chỗ⟩ | Cột tiêu đề phiếu – khớp EN "Issue" (UXD s4: thay "Việc" dễ lẫn với việc buồng phòng) |
| `wo.col.status` | Trạng thái | Status | ⟨chừa chỗ⟩ |  |
| `wo.col.due` | Hạn | Due | ⟨chừa chỗ⟩ |  |
| `wo.col.assignee` | Người xử lý | Assignee | ⟨chừa chỗ⟩ |  |
| `wo.title_label` | Tiêu đề | Title | ⟨chừa chỗ⟩ | WorkOrderCreate.title ≤ 120 |
| `wo.cat.wifi` | Wi-Fi | Wi-Fi | ⟨chừa chỗ⟩ | WorkOrderCategory wifi |
| `wo.cat.drain` | Tắc thoát nước | Blocked drain | ⟨chừa chỗ⟩ | WorkOrderCategory drain (DOM D-12 f) |
| `wo.sev_suggested` | Gợi ý theo loại sự cố và căn đang {state}: {sev}. Bạn đổi được. | Suggested from the issue type and the room being {state}: {sev}. You can change it. | ⟨chừa chỗ⟩ | BR-809 – {state} = wo.state.occupied/vacant |
| `wo.state.occupied` | có khách | occupied | ⟨chừa chỗ⟩ |  |
| `wo.state.vacant` | trống | vacant | ⟨chừa chỗ⟩ |  |
| `wo.block_reason` | Lý do khóa | Reason for the block | ⟨chừa chỗ⟩ | block.reason – điền sẵn bằng tiêu đề |
| `wo.block_reopen_note` | Ngày mở bán lại do hệ thống tính (cộng thời gian dọn và kiểm sau sửa) – hiện ngay khi lưu. | The back-on-sale date is worked out by the system (adds time to clean and inspect after the repair) – shown as soon as you save. | ⟨chừa chỗ⟩ | FD/MT không đọc tham số ooo_reopen_buffer_days – ARC: đề nghị BookingRules.oooReopenBufferDays |
| `wo.create` | Tạo phiếu | Create work order | ⟨chừa chỗ⟩ |  |
| `wo.create_without_block` | Tạo phiếu không khóa | Create without blocking | ⟨chừa chỗ⟩ |  |
| `wo.created` | Đã tạo phiếu {code}. | Work order {code} created. | ⟨chừa chỗ⟩ |  |
| `wo.block_conflict_dates` | Dời các đơn này sang căn khác trước (lý do "Căn hỏng / sự cố"), rồi khóa lại. | Move these bookings to another room first (reason "Room fault"), then block again. | ⟨chừa chỗ⟩ | 409 ROOM_UNAVAILABLE – không có đường quản lý xác nhận rồi lưu (ARC A-03) |
| `wo.block_blocked_title` | Căn {room} đã có khóa trong khoảng này | Room {room} is already blocked in this period | ⟨chừa chỗ⟩ | 409 ROOM_BLOCKED |
| `wo.block_blocked_body` | Mở tab Khóa phòng để đổi ngày khóa đang có nếu cần. | Open the Room blocks tab to change the existing block if needed. | ⟨chừa chỗ⟩ |  |
| `wo.block_by_request` | Khóa phòng theo đề nghị | Block the room as requested | ⟨chừa chỗ⟩ | blockRequested – createRoomBlock + workOrderId |
| `wo.chip.block_requested` | Đề nghị khóa | Block requested | ⟨chừa chỗ⟩ |  |
| `wo.severity_label` | Mức độ | Severity | ⟨chừa chỗ⟩ |  |
| `wo.severity_saved` | Đã đổi mức phiếu {code}. | Severity of {code} changed. | ⟨chừa chỗ⟩ |  |
| `wo.reported_by` | Người báo: {name} | Reported by: {name} | ⟨chừa chỗ⟩ |  |
| `wo.parts_info` | Vật tư: {note} | Parts: {note} | ⟨chừa chỗ⟩ |  |
| `wo.result_info` | Kết quả: {note} | Result: {note} | ⟨chừa chỗ⟩ |  |
| `wo.remedy_desk` | Phiếu Gấp của căn {room} có khách đã quá hạn phương án. Đổi phòng cho khách hoặc đề nghị bù sự cố. | The urgent work order for occupied room {room} is past its remedy time. Move the guest or request compensation. | ⟨chừa chỗ⟩ | WorkOrder.remedySuggested (US-062 AC3) |
| `wo.action.reopen` | Mở lại phiếu | Reopen | ⟨chừa chỗ⟩ |  |
| `wo.reopen_title` | Mở lại phiếu {code} | Reopen {code} | ⟨chừa chỗ⟩ |  |
| `wo.reopen_note` | Vì sao mở lại? | Why reopen? | ⟨chừa chỗ⟩ |  |
| `wo.cancel_title` | Hủy phiếu {code}? | Cancel {code}? | ⟨chừa chỗ⟩ |  |
| `wo.cancel_reason` | Lý do hủy | Reason for cancelling | ⟨chừa chỗ⟩ |  |
| `wo.cancel_effect_block` | Khóa của căn {room} cũng được gỡ – căn mở bán lại trên mọi kênh. | The block on room {room} is removed too – the room goes back on sale on all channels. | ⟨chừa chỗ⟩ |  |
| `wo.closed_toast` | Đã đóng phiếu {code}. | {code} closed. | ⟨chừa chỗ⟩ |  |
| `wo.updated_toast` | Đã cập nhật phiếu {code}. | {code} updated. | ⟨chừa chỗ⟩ |  |
| `wo.no_photo_desk` | Ảnh sau sửa: chụp bằng app kỹ thuật hoặc chọn ảnh ở đây. | Photo after the repair: take it in the maintenance app or choose one here. | ⟨chừa chỗ⟩ |  |
| `ooo.new` | Khóa phòng có kế hoạch | Planned room block | ⟨chừa chỗ⟩ | createRoomBlock (A86) |
| `ooo.status.planned` | Sắp khóa | Planned | ⟨chừa chỗ⟩ |  |
| `ooo.status.active` | Đang khóa | Blocked | ⟨chừa chỗ⟩ |  |
| `ooo.status.released` | Đã mở khóa | Released | ⟨chừa chỗ⟩ |  |
| `ooo.status.cancelled` | Đã hủy | Cancelled | ⟨chừa chỗ⟩ |  |
| `ooo.col.nights` | Đêm khóa | Blocked nights | ⟨chừa chỗ⟩ |  |
| `ooo.col.reopen` | Mở bán lại từ | Back on sale | ⟨chừa chỗ⟩ |  |
| `ooo.col.wo` | Phiếu | Work order | ⟨chừa chỗ⟩ |  |
| `ooo.nights` | {from} – {to} | {from} – {to} | ⟨chừa chỗ⟩ |  |
| `ooo.change_end` | Đổi ngày mở bán | Change reopening date | ⟨chừa chỗ⟩ |  |
| `ooo.change_end_title` | Đổi ngày mở bán lại – căn {room} | Change reopening date – room {room} | ⟨chừa chỗ⟩ |  |
| `ooo.reopen_date` | Mở bán lại từ ngày | Back on sale from | ⟨chừa chỗ⟩ |  |
| `ooo.reopen_help` | Khóa chiếm các đêm trước ngày này. Kéo dài thì hệ thống kiểm trùng đơn như lúc tạo. | The block covers the nights before this date. Extending it checks for clashing bookings as at creation. | ⟨chừa chỗ⟩ |  |
| `ooo.release` | Mở khóa sớm | Release early | ⟨chừa chỗ⟩ | O4 – không qua phiếu chỉ MGR+ (A87) |
| `ooo.release_title` | Mở khóa căn {room} từ hôm nay? | Release room {room} from today? | ⟨chừa chỗ⟩ |  |
| `ooo.release_effect` | Căn mở bán lại từ đêm nay trên mọi kênh. Báo buồng phòng dọn và kiểm trước khi nhận khách. | The room goes back on sale from tonight on all channels. Ask housekeeping to clean and inspect before any check-in. | ⟨chừa chỗ⟩ |  |
| `ooo.release_needs_wo` | Khóa gắn phiếu {code} – đóng phiếu để mở khóa. | This block belongs to {code} – close the work order to release it. | ⟨chừa chỗ⟩ |  |
| `ooo.cancel` | Hủy khóa | Cancel block | ⟨chừa chỗ⟩ | O5 – khối planned |
| `ooo.cancel_title` | Hủy khóa căn {room}? | Cancel the block on room {room}? | ⟨chừa chỗ⟩ |  |
| `ooo.cancel_effect` | Căn không bị khóa các đêm {from} – {to} nữa và vẫn bán được. | The room is no longer blocked for {from} – {to} and stays on sale. | ⟨chừa chỗ⟩ |  |
| `ooo.saved` | Đã lưu khóa căn {room}: mở bán lại từ {date}. | Block saved for room {room}: back on sale from {date}. | ⟨chừa chỗ⟩ |  |
| `ooo.released_toast` | Đã mở khóa căn {room}. | Room {room} released. | ⟨chừa chỗ⟩ |  |
| `ooo.cancelled_toast` | Đã hủy khóa căn {room}. | Block on room {room} cancelled. | ⟨chừa chỗ⟩ |  |
| `ooo.empty` | Không có khóa phòng nào trong 30 ngày qua và 4 tháng tới. | No room blocks in the last 30 days or the next 4 months. | ⟨chừa chỗ⟩ |  |
| `ooo.error` | Chưa tải được danh sách khóa phòng | Couldn't load room blocks | ⟨chừa chỗ⟩ |  |
| `ooo.mgr_only` | Mở khóa không qua phiếu chỉ quản lý làm được. | Only a manager can release a block that has no work order. | ⟨chừa chỗ⟩ |  |
| `req.desk.empty` | Không có yêu cầu nào đang chờ. | No requests waiting. | ⟨chừa chỗ⟩ |  |
| `req.desk.error` | Chưa tải được yêu cầu của khách | Couldn't load guest requests | ⟨chừa chỗ⟩ |  |
| `req.desk.complete` | Làm xong | Mark done | ⟨chừa chỗ⟩ | transitionGuestRequest complete – yêu cầu chuyển lễ tân; cùng nhãn hk.task.complete (C1 động từ) |
| `req.desk.decline_title` | Không thực hiện được – {type}, căn {room} | Can't do it – {type}, room {room} | ⟨chừa chỗ⟩ |  |
| `req.desk.decline_reason` | Lý do (khách thấy) | Reason (shown to the guest) | ⟨chừa chỗ⟩ |  |
| `req.desk.reply` | Lời nhắn cho khách | Message to the guest | ⟨chừa chỗ⟩ | replyNote ≤ 300 – bắt buộc khi lý do Khác |
| `req.desk.reply_help` | Khách đọc được lời nhắn này. Không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ. Giá ghi số rồi đến đ hoặc VND, ví dụ 350.000 đ. Nhiều căn: dấu phẩy rồi khoảng trắng, ví dụ 202, 203. | The guest can read this message. Don't include door codes, ID, phone or card numbers. Write prices as the number then đ or VND, e.g. 350,000 VND. Several rooms: a comma then a space, e.g. 202, 203. | ⟨chừa chỗ⟩ | SEC P-R2-4 ĐK-2. UXD 18/10 (E14-13, EP14 v0.3 luật B-15): đủ 3 ý – không số nhạy cảm (gồm số thẻ – V-09), giá có đơn vị ngay sau số, danh sách căn ", ". Câu nhắc dưới ô replyNote (FE-B); ví dụ viết thẳng trong câu, không tham số |
| `field.SENSITIVE_DATA_DETECTED` | Lời nhắn có dãy số dài giống mã cửa, số giấy tờ hoặc số điện thoại nên chưa gửi được. Bỏ dãy số đó; giá ghi kèm đ hoặc VND (350.000 đ), nhiều căn cách bằng dấu phẩy và khoảng trắng (202, 203). | The message has a long number that looks like a door code, ID or phone number, so it wasn't sent. Remove it; write prices with đ or VND (350,000 VND) and separate rooms with a comma and a space (202, 203). | ⟨chừa chỗ⟩ | UXD 18/10 (E14-13): 422 lỗi trường replyNote theo luật B-15 – trước đây không có câu nên rơi về field_error.generic. Desk tra tự động field.<CODE>; hiện dưới ô, giữ nguyên nội dung đã gõ |
| `req.desk.overdue` | Quá hạn nhận | Not picked up in time | ⟨chừa chỗ⟩ | GuestRequest.isAckOverdue (BR-811) |
| `req.desk.routed` | Chuyển: {dept} | Routed to: {dept} | ⟨chừa chỗ⟩ |  |
| `req.desk.fee` | Phí {amount} – ghi vào folio khi xong | {amount} fee – posted to the folio when done | ⟨chừa chỗ⟩ | GuestRequest.feeVnd (BR-506) |
| `req.desk.open_task` | Xem việc buồng phòng | Open housekeeping task | ⟨chừa chỗ⟩ |  |
| `req.desk.open_wo` | Xem phiếu sửa | Open work order | ⟨chừa chỗ⟩ |  |
| `req.desk.updated` | Đã cập nhật yêu cầu – khách thấy trạng thái mới. | Request updated – the guest sees the new status. | ⟨chừa chỗ⟩ |  |
| `nav.minibar` | Minibar | Minibar | ⟨chừa chỗ⟩ | Menu S13 |
| `mb.add` | Thêm mặt hàng | Add item | ⟨chừa chỗ⟩ | createItem – chỉ OWN/MGR (A91) |
| `mb.add_title` | Thêm mặt hàng minibar | Add minibar item | ⟨chừa chỗ⟩ |  |
| `mb.edit_title` | Sửa mặt hàng {name} | Edit {name} | ⟨chừa chỗ⟩ |  |
| `mb.col.code` | Mã | Code | ⟨chừa chỗ⟩ |  |
| `mb.col.name` | Tên | Name | ⟨chừa chỗ⟩ |  |
| `mb.col.unit` | Đơn vị | Unit | ⟨chừa chỗ⟩ |  |
| `mb.col.std` | Mức chuẩn mỗi tủ | Standard per minibar | ⟨chừa chỗ⟩ |  |
| `mb.col.sale` | Giá bán | Sale price | ⟨chừa chỗ⟩ |  |
| `mb.col.cost` | Giá vốn | Cost price | ⟨chừa chỗ⟩ | Chỉ OWN/MGR thấy (x-visible-to) |
| `mb.col.min` | Tồn tối thiểu | Minimum stock | ⟨chừa chỗ⟩ |  |
| `mb.col.status` | Trạng thái | Status | ⟨chừa chỗ⟩ |  |
| `mb.name_vi` | Tên tiếng Việt | Vietnamese name | ⟨chừa chỗ⟩ |  |
| `mb.name_en` | Tên tiếng Anh | English name | ⟨chừa chỗ⟩ |  |
| `mb.code_help` | Chữ thường không dấu, ví dụ nuoc-suoi. | Lower case without accents, e.g. nuoc-suoi. | ⟨chừa chỗ⟩ |  |
| `mb.free_toggle` | Miễn phí – không tính tiền, vẫn ghi tiêu hao | Complimentary – not charged, still counted as used | ⟨chừa chỗ⟩ | BR-701 – salePriceVnd = null |
| `mb.active` | Đang dùng | In use | ⟨chừa chỗ⟩ |  |
| `mb.inactive` | Ngừng dùng | Not in use | ⟨chừa chỗ⟩ |  |
| `mb.price_note` | Giá mới áp cho các lần kiểm minibar sau. Dòng đã ghi vào folio giữ nguyên giá cũ. | The new price applies to later minibar checks. Lines already on a folio keep their price. | ⟨chừa chỗ⟩ | US-066 AC2, BR-006 |
| `mb.readonly` | Chỉ quản lý và chủ đầu tư sửa danh mục, giá bán, giá vốn. | Only managers and the owner can edit items and prices. | ⟨chừa chỗ⟩ | US-066 AC3 (A91) |
| `mb.saved` | Đã lưu {name}. | {name} saved. | ⟨chừa chỗ⟩ |  |
| `mb.empty_title` | Chưa có mặt hàng nào | No items yet | ⟨chừa chỗ⟩ |  |
| `mb.empty_body` | Thêm mặt hàng để kiểm minibar khi trả phòng. | Add items to check the minibar at check-out. | ⟨chừa chỗ⟩ |  |
| `mb.error_title` | Chưa tải được danh mục minibar | Couldn't load the minibar list | ⟨chừa chỗ⟩ |  |
| `attn.room_ooo_rooms` | Căn đang khóa sửa chữa: {rooms} | Rooms blocked for repair: {rooms} | ⟨chừa chỗ⟩ | kind room_ooo – chỉ count + roomNos (không có ngày); {rooms} = 401 · The Pine |
| `attn.foc_pct` | Miễn phí tháng này bằng {pct}% doanh thu phòng – vượt ngưỡng {threshold}% | Complimentary items this month equal {pct}% of room revenue – over the {threshold}% limit | ⟨chừa chỗ⟩ | foc_threshold, params.check = foc_pct_of_room_revenue: {pct} = params.pct (1 chữ số thập phân theo locale), {threshold} = params.threshold; vắng pct (doanh thu phòng tháng = 0 – EP01 Q-15) → attn.foc_threshold. Khóa thay today.foc_alert_pct của nháp EP01 3.3 (UXD s4 chọn attn.* – BA sửa spec); BE-D không trả số tiền/tháng nên câu không có {foc}/{month} |
| `attn.foc_count` | Một người đã duyệt hoặc tự áp {count} lần miễn phí tháng này – vượt ngưỡng {max} | One person has approved or self-applied {count} complimentary items this month – over the limit of {max} | ⟨chừa chỗ⟩ | foc_threshold, params.check = foc_count_per_approver – mỗi người một dòng, không tên (link lọc approverId); gồm lần tự áp minibar (DOM D-14 a). Thay today.foc_alert_count của nháp EP01 3.3 |
| `req.desk.no_room` | Chưa gán căn | No room yet | ⟨chừa chỗ⟩ | GuestRequest.roomNo = null (đơn chưa có căn) |
| `rsv.notice.heading` | CTV/sale đã báo chuyển cọc | Deposit transfer reported | ⟨chừa chỗ⟩ | H11 Xác nhận cọc – Reservation.depositNotices[] bản open (BUG-R2-081) |
| `rsv.notice.line` | {who} báo đã chuyển {amount} lúc {time} | {who} reported a {amount} transfer at {time} | ⟨chừa chỗ⟩ | {time} = updatedAt (lần báo gần nhất) |
| `rsv.notice.line_noname` | Đã báo chuyển {amount} lúc {time} | {amount} transfer reported at {time} | ⟨chừa chỗ⟩ |  |
| `rsv.notice.note` | Ghi chú: {note} | Note: {note} | ⟨chừa chỗ⟩ |  |
| `rsv.notice.photo` | Xem ảnh biên nhận | View receipt photo | ⟨chừa chỗ⟩ |  |
| `rsv.notice.photo_hide` | Ẩn ảnh | Hide photo | ⟨chừa chỗ⟩ |  |
| `rsv.notice.photo_alt` | Ảnh biên nhận chuyển cọc của đơn {code} | Deposit receipt for booking {code} | ⟨chừa chỗ⟩ |  |
| `rsv.notice.photo_error` | Chưa mở được ảnh biên nhận. Bấm Xem ảnh biên nhận để thử lại. | Couldn't open the receipt photo. Select View receipt photo to try again. | ⟨chừa chỗ⟩ |  |
| `rsv.notice.no_photo` | Không kèm ảnh biên nhận. | No receipt photo attached. | ⟨chừa chỗ⟩ |  |
| `ov.my_requests_n` | Yêu cầu bạn đã gửi ({n}) | Requests you sent ({n}) | ⟨chừa chỗ⟩ | H24 24.2 bản lễ tân – thay khối Cần duyệt |
| `ov.my_requests_empty` | Bạn chưa gửi yêu cầu duyệt nào. | You haven't sent any approval requests. | ⟨chừa chỗ⟩ |  |
| `rsv.notice.check` | Đối chiếu số tiền và nội dung chuyển khoản với sao kê trước khi xác nhận. | Check the amount and transfer reference against the bank statement before confirming. | ⟨chừa chỗ⟩ |  |

#### R2 Sprint 4 – MOB đợt 2: hộp thông báo PWA, ảnh phiếu, khóa phòng H22.5, ngôn ngữ phiên khách (0.3.7 bổ sung 1; UXD duyệt 17/10 – s4-UXD)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `staff.notif.k.work_order_new` | Phiếu sửa mới | New work order | ⟨chừa chỗ⟩ | kind=work_order_new (MT) |
| `staff.notif.k.work_order_high_new` | Phiếu sửa Gấp – nhận việc trong 15 phút | Urgent work order – pick up within 15 minutes | ⟨chừa chỗ⟩ | kind=work_order_high_new (MT, FD, MGR) – BR-809 |
| `staff.notif.k.work_order_block_requested` | Buồng phòng đề nghị khóa căn | Housekeeping suggests blocking the room | ⟨chừa chỗ⟩ | kind=work_order_block_requested (FD, MT) |
| `staff.notif.k.work_order_overdue` | Phiếu sửa quá hạn | Work order overdue | ⟨chừa chỗ⟩ | kind=work_order_overdue |
| `staff.notif.k.hk_task_urgent` | Việc gấp đã lên đầu danh sách | An urgent task is now at the top of your list | ⟨chừa chỗ⟩ | kind=hk_task_urgent (HK của ca) |
| `staff.notif.k.room_awaiting_inspection` | Căn đã dọn – chờ kiểm | Room cleaned – awaiting inspection | ⟨chừa chỗ⟩ | kind=room_awaiting_inspection (FDL+) |
| `staff.notif.k.hk_task_cancelled` | Việc đã được hủy vì đơn thay đổi | A task was cancelled because the booking changed | ⟨chừa chỗ⟩ | kind=hk_task_cancelled (HK được giao) |
| `staff.notif.k.guest_request_new` | Yêu cầu mới của khách | New guest request | ⟨chừa chỗ⟩ | kind=guest_request_new |
| `staff.notif.k.guest_request_overdue` | Yêu cầu của khách chưa được nhận | Guest request not picked up yet | ⟨chừa chỗ⟩ | kind=guest_request_overdue |
| `staff.notif.k.other` | Thông báo mới – xem chi tiết trên OTTIMO Desk | New notification – see OTTIMO Desk for details | ⟨chừa chỗ⟩ | Loại thông báo của Desk (FD+ mở PWA) – PWA không có màn đó |
| `staff.notif.empty_title` | Chưa có thông báo | No notifications yet | ⟨chừa chỗ⟩ |  |
| `staff.notif.empty_body` | Phiếu sửa mới, việc gấp và yêu cầu của khách sẽ hiện ở đây. | New work orders, urgent tasks and guest requests will show here. | ⟨chừa chỗ⟩ |  |
| `staff.notif.error_title` | Chưa tải được thông báo | Couldn't load notifications | ⟨chừa chỗ⟩ |  |
| `staff.notif.unread` | {n} chưa đọc | {n} unread | ⟨chừa chỗ⟩ |  |
| `staff.notif.bell` | Thông báo, {n} chưa đọc | Notifications, {n} unread | ⟨chừa chỗ⟩ | aria-label nút chuông |
| `staff.notif.new_announce` | Có thông báo mới | New notification | ⟨chừa chỗ⟩ | aria-live khi SSE notification.created – không cướp focus |
| `staff.photo_load_error` | Chưa mở được ảnh | Couldn't open photo | ⟨chừa chỗ⟩ | getAttachment lỗi / 404 (đã xóa theo hạn lưu) – ô ảnh phiếu sửa |
| `staff.block_blocked_body` | Báo lễ tân đổi ngày của khóa đang có nếu cần. | Ask the front desk to change the existing block if needed. | ⟨chừa chỗ⟩ | 409 ROOM_BLOCKED ở PWA – thay wo.block_blocked_body (nhắc tab Desk) |
| `gw.lang_auto` | Ngôn ngữ theo trình duyệt của bạn – bạn có thể đổi ở đầu trang. | Language set from your browser – you can change it at the top. | Язык выбран по настройкам браузера – его можно сменить вверху. | localeChosenByGuest = false: dòng nhỏ dưới lời chào + mô tả ô chọn ngôn ngữ. RU nháp |
| `gw.lang_chosen` | Ngôn ngữ bạn đã chọn | Language you chose | Выбранный вами язык | localeChosenByGuest = true: mô tả ô chọn ngôn ngữ (chỉ trình đọc màn hình). RU nháp |

#### R2 Sprint 4 – FE-A sửa theo review UXD: số tiền thu thật ở H13 (UXD duyệt 17/10 – s4-UXD-strings-2)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `ci.pay_received` | Số tiền đã nhận | Amount received | ⟨chừa chỗ⟩ | H13 chuyển khoản / thẻ POS: lễ tân nhập số thật đã nhận – ghi đúng số này (FE-S4-01) |
| `ci.submit_pay_amount_needed` | Nhập số tiền đã nhận để nhận phòng. | Enter the amount received to check in. | ⟨chừa chỗ⟩ | Lý do nút Nhận phòng khóa – ô Tiền khách đưa / Số tiền đã nhận còn trống. FE-A khóa nút khi ô trống (khác đề xuất FE-S4-01 "trống = đủ") – UXD chấp nhận: chặt hơn, không ghi khoản thu chưa ai nhập |
| `ci.submit_pay_short` | Số tiền đã nhận còn thiếu {amount}. Thu đủ hoặc chọn cách thu khác để nhận phòng. | The amount received is {amount} short. Collect the rest or choose another method to check in. | ⟨chừa chỗ⟩ | Chuyển khoản / POS nhập ít hơn số cần thu |
| `ci.submit_pay_over` | Số tiền đã nhận lớn hơn số cần thu {amount}. Ghi đúng {amount}; phần khách trả dư ghi riêng ở folio sau khi nhận phòng. | The amount received is more than the {amount} due. Record exactly {amount}; record any overpayment separately on the folio after check-in. | ⟨chừa chỗ⟩ | Chuyển khoản / POS nhập nhiều hơn số cần thu – không ghi thừa im lặng |
| `ci.submit_pos_code` | Nhập mã chuẩn chi trên phiếu POS để nhận phòng. | Enter the approval code from the POS slip to check in. | ⟨chừa chỗ⟩ | Thẻ POS thiếu mã chuẩn chi |
| `ci.room_approved` | {name} đã duyệt nhận phòng khi buồng chưa sẵn sàng. Thu tiền và nhận phòng như thường. | {name} approved check-in while the room isn't ready. Collect payment and check in as usual. | ⟨chừa chỗ⟩ | FE-S4-02: lễ tân mở lại H13 sau khi lễ tân trưởng duyệt yêu cầu 202 trong ngày – B9 gửi approvalRequestId + payment (OpenAPI 0.3.7 checkIn bổ sung 1 (a)). Chip ok ở điều kiện "Buồng sẵn sàng" |

#### R2 Sprint 4 – FE-A S4-25: xin miễn phí ngoài bước nhận phòng (UXD duyệt 17/10 – s4-UXD-strings-2)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `foc.max` | Tối đa {amount} – phần còn lại của dòng sau các khoản miễn/giảm đã có. | Up to {amount} – what is left on this line after existing waivers and discounts. | ⟨chừa chỗ⟩ | Gợi ý ô Số tiền miễn (S4-23 (6) – trần theo khóa) |
| `foc.over_max` | Nhập tối đa {amount} – số còn được miễn trên dòng này. | Enter {amount} or less – the amount still available to waive on this line. | ⟨chừa chỗ⟩ | Lỗi ô Số tiền miễn; cũng dùng khi server trả 422 kèm max |
| `foc.needs_reason` | Chọn lý do miễn phí. | Choose a reason for the waiver. | ⟨chừa chỗ⟩ | Thiếu lý do (BR-432) – lỗi ở nhóm lý do / câu cạnh nút khóa |
| `foc.state_applied` | Đã áp | Applied | ⟨chừa chỗ⟩ | Chip dòng FOC/giảm giá đang trừ (BR-434 applied) |
| `foc.state_cancelled` | Không còn áp | No longer applied | ⟨chừa chỗ⟩ | Chip dòng FOC/giảm giá đã đảo (ngủ / hủy theo quy tắc BR-434) |
| `foc.self_apply_short` | Minibar {amount} nằm trong mức tự miễn {limit} mỗi lần của bạn. Nhập lại mật khẩu để áp ngay. Nếu hạn mức tháng đã hết, yêu cầu tự chuyển lễ tân trưởng duyệt. | Minibar {amount} is within your self-waiver limit of {limit} per waiver. Re-enter your password to apply it now. If this month's limit is used up, the request goes to a senior receptionist. | ⟨chừa chỗ⟩ | Thay foc.self_apply khi Desk không biết số đã dùng trong tháng (BR-436; server quyết) |
| `foc.sent` | Đã gửi duyệt miễn {amount}. | Waiver of {amount} sent for approval. | ⟨chừa chỗ⟩ | Thông báo sau requestFoc / requestFocForSurcharge |
| `foc.applied` | Đã áp miễn {amount}. | Waiver of {amount} applied. | ⟨chừa chỗ⟩ | Thông báo khi lễ tân tự áp FOC minibar trong hạn mức (BR-436) |
| `party.foc_sent` | Đã gửi duyệt miễn phụ thu người – mỗi đêm một yêu cầu, tổng {n}. | Extra-guest fee waiver sent for approval – one request per night, {n} in total. | ⟨chừa chỗ⟩ | BUG-R2-093: thêm người đang ở kèm xin FOC phụ thu người (requestFoc từng đêm) |
| `party.foc_failed` | Đã thêm người và ghi phụ thu, nhưng {n} đêm chưa gửi được yêu cầu miễn. Mở folio để gửi lại. | The guest was added and the fee recorded, but the waiver request could not be sent for {n} of the nights. Open the folio to send it again. | ⟨chừa chỗ⟩ | BUG-R2-093: một số requestFoc từng đêm lỗi |

#### R2 Sprint 4 – FE-A: giá lịch trước giảm theo số đêm, số cần thu của hệ thống (UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `rate.pre_tier` | Giá lịch/đêm (trước giảm theo số đêm) | Calendar rate/night (before length-of-stay discount) | ⟨chừa chỗ⟩ | Tiêu đề cột/ô giá đêm lễ tân gõ – H09 đặt phòng (BR-107 v0.3.8: giảm áp trên giá này). UXD: một khái niệm – một tên = "giảm theo số đêm" (như move.discount_los, folio.adjust_night_*); "dài ngày" dễ lẫn với "dài hạn" |
| `rate.pre_tier_short` | giá lịch, trước giảm theo số đêm | calendar rate, before length-of-stay discount | ⟨chừa chỗ⟩ | Đuôi nhãn: đêm thêm B18, danh sách đêm gia hạn B13, tổng giá lịch khi đã sửa giá |
| `rate.after_tier` | Sau giảm {pct}%: {amount} | After {pct}% off: {amount} | ⟨chừa chỗ⟩ | Giá đêm sau bậc BR-107 do máy chủ tính (calculateQuote) – cạnh ô giá chưa sửa |
| `rate.tier_note` | Lượt ở {n} đêm được giảm {pct}% theo số đêm (BR-107) trên giá lịch từng đêm. Tiền phòng bên dưới đã giảm. | A {n}-night stay gets a {pct}% length-of-stay discount (BR-107) on each night's calendar rate. The room total below is after the discount. | ⟨chừa chỗ⟩ | H09: giá chưa sửa – tổng của máy chủ |
| `rate.tier_on_save` | Đã sửa giá: lượt ở {n} đêm vẫn được giảm {pct}% (BR-107) trên giá đã nhập, hệ thống tính khi lưu. Tiền phòng bên dưới là tổng giá lịch. | Rates changed: the {n}-night stay still gets {pct}% off (BR-107) on the rates entered, worked out on save. The room total below is the calendar total. | ⟨chừa chỗ⟩ | H09: đã sửa giá – không tự tính ở máy quầy |
| `rate.tier_locked` | Lượt ở {n} đêm được giảm {pct}% theo số đêm. Chưa có giá lịch từng đêm nên tạm chưa sửa giá ở đây, để không giảm hai lần. | This {n}-night stay gets a {pct}% length-of-stay discount. Each night's calendar rate isn't available yet, so rates can't be changed here for now – this avoids discounting twice. | ⟨chừa chỗ⟩ | H09: máy chủ cũ thiếu calendarRateVnd – ô giá chỉ đọc (DOM S4-38) |
| `rate.prior_night_tier` | Đây là giá lịch, trước giảm theo số đêm. Số cần thu ở mục Thu tiền do hệ thống tính, đã gồm giảm nếu có. | This is the calendar rate, before any length-of-stay discount. The amount due under Payment is worked out by the system and includes the discount if any. | ⟨chừa chỗ⟩ | H13 đêm B9a (BR-417-04…06) |
| `rate.night_now` | Đêm này hiện tính {amount} sau giảm theo số đêm (giá lịch {calendar}). | This night is now {amount} after the length-of-stay discount (calendar rate {calendar}). | ⟨chừa chỗ⟩ | S4-35 sửa giá đêm ở Folio – gợi ý ô giá |
| `rate.adjust_night_effect` | Ghi bút toán đảo {old} và dòng mới theo giá lịch {new} – giảm theo số đêm áp lại khi lưu. Dòng cũ vẫn còn trong nhật ký (BR-008). | Posts a reversal of {old} and a new line at the calendar rate {new} – the length-of-stay discount is applied again on save. The old line stays in the log (BR-008). | ⟨chừa chỗ⟩ | S4-35: đêm có bậc giảm – không tự tính số sau giảm |
| `checkout.extra_night_rate_help_tier` | Giá lịch của đêm, trước giảm theo số đêm. Mặc định là giá gợi ý của hệ thống cho đêm này. Số cần thu do hệ thống tính, đã gồm giảm nếu có. | The night's calendar rate, before any length-of-stay discount. Defaults to the system's suggested rate for this night. The amount due is worked out by the system and includes the discount if any. | ⟨chừa chỗ⟩ | H16 bước 2 đêm thêm (BR-416-04/05) – thay checkout.extra_night_rate_help. UXD 18/10: giá mặc định theo bảng BR-417 phụ lục 5A (có thể là giá thỏa thuận hoặc min sau đổi căn) – bỏ "giá Trực tiếp đêm nay"; khoảng sàn–trần nằm ở checkout.extra_night_range nối ngay sau |
| `checkout.due_computing` | Đang tính số cần thu theo giá đêm thêm… | Working out the amount due at this night rate… | ⟨chừa chỗ⟩ | H16: đang hỏi máy chủ số cần thu theo giá gõ (ARC 0.3.7 bổ sung 4) |
| `checkout.typed_due_failed` | Chưa tính được số cần thu theo giá này. Số bên dưới theo giá gợi ý; hệ thống tính lại khi hoàn tất. | Couldn't work out the amount due at this rate. The figure below uses the suggested rate; the system works it out again when you complete. | ⟨chừa chỗ⟩ | H16: không đọc được trần của máy chủ |
| `checkin.prior_night_taken` | Đêm {date} căn này đã có khách nên không thêm được đêm trước. Trước 06:00 chưa nhận phòng được – nhận từ 06:00, hoặc đổi sang căn còn trống. | The night of {date} is already booked in this room, so no extra night before can be added. Check-in isn't possible before 06:00 – check in from 06:00, or move to a free room. | ⟨chừa chỗ⟩ | BUG-R2-127 (P1): priorNight.available = false – không gửi addPriorNight, không thu đêm đó; nút Nhận phòng khóa (BR-417, BR-906) |
| `checkout.due_without_extra_night` | Còn phải thu chưa gồm đêm thêm: đêm nay căn đã có khách nên không bán thêm đêm được. | Balance due excludes the extra night: the room is booked tonight, so no extra night can be sold. | ⟨chừa chỗ⟩ | BUG-R2-139 (P2): H16 extraNightAvailable = false – không cộng đêm thêm, không gửi vào QR check_out; cách tính thay thế chờ DOM |
| `drawer.deposit_fee_base` | Cơ sở phí hủy (cọc theo tiền phòng hiện tại) | Cancellation fee base (deposit on the current room total) | ⟨chừa chỗ⟩ | Drawer, đơn từ confirmed: depositRequiredVnd là cơ sở phí hủy, không đòi cọc thêm (ARC 0.3.7 bổ sung 4 #2, BR-309-11) |

#### R2 Sprint 4 – FE-A: phụ thu trả muộn bằng giá 1 đêm (BR-416-06), tủ minibar theo căn, QR vượt số còn phải thu (UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `co.minibar_cabinet` | Tủ minibar cần đếm | Minibar to count | ⟨chừa chỗ⟩ | H16 bước 1: chọn tủ khi lượt ở có căn cũ chưa đếm (BR-703-01, minibar M-1) |
| `co.minibar_cabinet_room` | Căn {room} (đang ở) | Room {room} (current) | ⟨chừa chỗ⟩ | Lựa chọn tủ của căn đang gán |
| `co.minibar_cabinet_old` | Căn {room} (đã chuyển đi) | Room {room} (moved out) | ⟨chừa chỗ⟩ | Lựa chọn tủ của căn cũ trước B14 |
| `co.minibar_folio_adjusted` | Folio đã sửa sau lần đếm trước | Folio corrected after the last count | ⟨chừa chỗ⟩ | DOM (e): adjustedAfterLastCheck – số điền sẵn theo folio |
| `co.minibar_folio_vs_count` | {item}: folio ghi {folio}, lần đếm trước {count}. Số bên dưới theo folio. | {item}: folio shows {folio}, last count {count}. The figure below follows the folio. | ⟨chừa chỗ⟩ | Một dòng mỗi món đã sửa – số = đã dùng |
| `co.late_fee_as_night_body` | Đêm nay căn đã có khách nên không bán thêm đêm được. Thay vào đó thu phụ thu trả muộn bằng giá 1 đêm: {amount}. Quản lý xác nhận ở bước Bill & thu tiền. | The room is booked tonight, so no extra night can be sold. A late check-out fee of one night applies instead: {amount}. A manager confirms it at the Bill & payment step. | ⟨chừa chỗ⟩ | H16 bước 2: lateFeeAsNightVnd (BR-416-06, BUG-R2-139). UXD: tên bước theo checkout.step.bill ("Hóa đơn" chỉ dùng cho hóa đơn GTGT – content-guide 3.1) |
| `co.late_fee_as_night_line` | Gồm phụ thu trả muộn bằng giá 1 đêm {amount}, không gồm đêm thêm. | Includes a one-night late check-out fee of {amount}; no extra night. | ⟨chừa chỗ⟩ | Dòng phụ dưới Còn phải thu – thay checkout.due_without_extra_night khi máy chủ có lateFeeAsNightVnd |
| `co.late_fee_confirm_title` | Quản lý xác nhận phụ thu trả muộn {amount} | Manager confirms the late check-out fee of {amount} | ⟨chừa chỗ⟩ | H16 bước 3: hộp xác nhận tại quầy (ARC 16.6 (d), D5) |
| `co.late_fee_confirm_help` | Quản lý nhập tên đăng nhập và mật khẩu của mình tại quầy. Mật khẩu chỉ dùng cho lần xác nhận này, không được lưu. | The manager enters their own username and password here. The password is used for this confirmation only and is not saved. | ⟨chừa chỗ⟩ | SEC FE-08: mật khẩu xóa sau mỗi lần gửi/khi đóng hộp |
| `co.late_fee_reason` | Lý do | Reason | ⟨chừa chỗ⟩ | lateFeeInsteadOfNight.reason (≥ 3 ký tự) |
| `co.late_fee_approver` | Tên đăng nhập của quản lý | Manager's username | ⟨chừa chỗ⟩ | approverUsername – bắt buộc khi người gọi là FD/FDL |
| `co.late_fee_approver_self` | Bỏ trống nếu bạn tự xác nhận. | Leave empty to confirm yourself. | ⟨chừa chỗ⟩ | OWN/MGR gọi: chỉ nhập lại mật khẩu của mình |
| `co.late_fee_secret` | Mật khẩu của quản lý | Manager's password | ⟨chừa chỗ⟩ | secret – ô che, không tự điền (autocomplete new-password) |
| `co.late_fee_needs_confirm` | Điền lý do và xác nhận của quản lý để hoàn tất trả phòng. | Add the reason and the manager's confirmation to complete check-out. | ⟨chừa chỗ⟩ | Lý do nút Hoàn tất bị khóa – mẫu "… để <việc nút làm>" như co.go_bill_needs_told |
| `co.late_fee_foc` | Miễn/giảm khoản phụ thu này (quản lý xác nhận áp ngay) | Waive or reduce this fee (applied when the manager confirms) | ⟨chừa chỗ⟩ | requestFoc của lateFeeInsteadOfNight – không gửi duyệt riêng (DOM 18/10) |
| `co.late_fee_sum_title` | Quản lý cho phép | What the manager allows | ⟨chừa chỗ⟩ | aria-label bảng 3 số trong hộp xác nhận (SEC FE-08) |
| `co.late_fee_sum_fee` | Phụ thu trả muộn (giá 1 đêm) | Late check-out fee (one night) | ⟨chừa chỗ⟩ | Bảng 3 số – dòng 1 |
| `co.late_fee_sum_foc` | Miễn/giảm | Waived or reduced | ⟨chừa chỗ⟩ | Bảng 3 số – dòng 2 (requestFoc) |
| `co.late_fee_sum_guest` | Khách trả cho khoản này | Guest pays for this fee | ⟨chừa chỗ⟩ | Bảng 3 số – dòng 3 = phụ thu − miễn/giảm |
| `co.late_fee_auth_failed` | Không xác nhận được. Kiểm tra tên đăng nhập và mật khẩu của quản lý rồi thử lại. | Couldn't confirm. Check the manager's username and password, then try again. | ⟨chừa chỗ⟩ | 401 REAUTH_FAILED ở lateFeeInsteadOfNight.secret – một câu chung, không nói sai tên hay sai mật khẩu (SR-AUTH-04, SEC FE-08) |
| `co.late_fee_locked` | Xác nhận tạm khóa vì nhập sai nhiều lần. Thử lại sau {minutes} phút. | Confirmation is locked for now after several failed attempts. Try again in {minutes} minutes. | ⟨chừa chỗ⟩ | 429 RATE_LIMITED (SR-RL-02) – {minutes} từ Retry-After |
| `pay.qr_over_note` | Khách chuyển {amount}, nhiều hơn số còn phải thu {max}. Ghi lý do thu vượt trước khi xác nhận; phần dư thành tiền thừa của khách. | The guest sent {amount}, more than the {max} still due. Note why before confirming; the extra becomes guest credit. | ⟨chừa chỗ⟩ | DOM (f): amountVnd > Payment.amountDueNowVnd hoặc 422 REASON_REQUIRED ở note (max) |
| `pay.qr_pending_earlier` | Có mã VietQR tạo trước đang chờ: {amount}, hết hạn {time}. Kiểm tra app ngân hàng rồi xác nhận đã nhận. | A VietQR made earlier is still waiting: {amount}, expires {time}. Check the bank app, then confirm receipt. | ⟨chừa chỗ⟩ | H13: QR check_in còn pending từ lần mở trước |

#### R2 Sprint 4 – FE-B H11 xác nhận QR cọc vượt (DOM (f); dùng cùng pay.qr_over_note của FE-A; UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `dep.qr_over_reason` | Lý do thu vượt | Reason for the extra amount | ⟨chừa chỗ⟩ | H11 DepositDialog: confirmPaymentReceived.note – bắt buộc (≥ 3 ký tự) khi QR cọc > Payment.amountDueNowVnd hoặc 422 REASON_REQUIRED (max); lỗi dùng field_error.reason_required |

#### R2 Sprint 4 – FE-A: đếm lại tủ minibar (BUG-R2-144, BR-703-02), cảnh báo hủy dòng minibar có miễn/giảm (N-1); câu theo reason gồm not_today (K11-09) (UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `co.minibar_recount_title` | Tủ căn {room} cần đếm lại | Room {room} minibar needs a recount | ⟨chừa chỗ⟩ | H16 bước 1: tủ trong minibarUncheckedRooms có reason khác never_counted (stay_continued, new_fill, not_today, giá trị lạ) |
| `co.minibar_recount_body` | Lần đếm trước không còn dùng cho lần trả phòng này. Đếm số còn lại trong tủ bây giờ; món đã tính trước đó không bị tính trùng. | The last count no longer applies to this check-out. Count what is left in the minibar now; items already charged are not charged twice. | ⟨chừa chỗ⟩ | Câu chung – mọi reason khác never_counted khi Desk chưa chọn câu theo reason, và reason lạ (UXD 18/10: bỏ "Khách đã vào lại căn…" vì sai với new_fill/not_today; bỏ "Số điền sẵn theo lần đếm trước" vì kỳ mới điền tủ đủ). BR-703-02 |
| `co.minibar_recount_body_stay_continued` | Khách đã vào lại căn hoặc gia hạn sau lần đếm trước. Đếm số còn lại trong tủ bây giờ; món đã tính lần trước không bị tính trùng. | The guest came back to this room or extended after the last count. Count what is left in the minibar now; items charged last time are not charged twice. | ⟨chừa chỗ⟩ | reason = stay_continued (BR-703-02) |
| `co.minibar_recount_body_new_fill` | Tủ đã được bổ sung sau lần đếm trước. Đếm số còn lại trong tủ bây giờ; món đã tính trước lần bổ sung không bị tính trùng. | The minibar was refilled after the last count. Count what is left now; items charged before the refill are not charged twice. | ⟨chừa chỗ⟩ | reason = new_fill (kỳ mới sau bổ sung giữa kỳ – R3) |
| `co.minibar_recount_body_not_today` | Lần đếm trước không phải trong hôm nay. Đếm lại tủ trong ngày trả phòng để tính cả món khách dùng sau lần đếm đó. | The last count was not made today. Count the minibar again on the check-out day so items used since then are included. | ⟨chừa chỗ⟩ | reason = not_today (K11-09, DOM BR-703 ghi chú 7): tủ căn đang ở đã đếm sau mốc nhưng khác ngày nghiệp vụ của B18 |
| `folio.void_minibar_foc` | Món này đang được miễn/giảm {amount}. Hủy hoặc giảm dòng thì phần miễn/giảm vượt số còn lại tạm ngưng. Khi chốt folio, phần đó bị hủy nếu chưa ghi lại dòng hoặc đếm lại minibar. | This item has a waiver of {amount}. Voiding or reducing the line pauses the part of the waiver above what is left. At settlement that part is cancelled unless the line is posted again or the minibar is recounted. | ⟨chừa chỗ⟩ | N-1 (BR-702 v0.3.8, NÊN): sửa/hủy dòng minibar có FOC theo món (BR-434-15) |

#### R2 Sprint 4 – FE-A đợt 15: tủ minibar đổi kỳ trong lúc đếm (ARC 16.16 (ab), 409 MINIBAR_PERIOD_CHANGED) (UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `co.minibar_period_changed_title` | Số đếm chưa được lưu | Count not saved | ⟨chừa chỗ⟩ | H16 bước 1: 409 MINIBAR_PERIOD_CHANGED – không ghi gì, đã tải lại mốc tủ. UXD 18/10: tiêu đề nói kết quả; 409 còn xảy ra khi lượt ở mở kỳ mới hoặc lần nạp không thuộc tủ, nên không khẳng định "vừa được bổ sung" |
| `error.MINIBAR_PERIOD_CHANGED` | Tủ minibar vừa được bổ sung hoặc lượt ở vừa thay đổi, nên số đếm chưa được lưu. Tải lại rồi đếm lại tủ. | The minibar was refilled or the stay changed, so the count was not saved. Reload, then count the minibar again. | ⟨chừa chỗ⟩ | UXD 18/10 (s4-UXD-brand): câu dự phòng cho problemView khi 409 MINIBAR_PERIOD_CHANGED tới màn khác H16 – không rơi về error.server "Máy chủ đang gặp sự cố". H16 vẫn dùng co.minibar_period_changed_* |
| `co.minibar_period_changed_body` | Tủ vừa được bổ sung hoặc lượt ở vừa thay đổi trong lúc đếm, nên số vừa nhập chưa được lưu. Đếm lại tủ rồi lưu. | The minibar was refilled or the stay changed during the count, so the figures entered were not saved. Count the minibar again, then save. | ⟨chừa chỗ⟩ | Giữ lễ tân ở bước đếm; số điền sẵn theo kỳ mới. Thuật ngữ "bổ sung minibar" (hk.type.minibar_refill) thay "lượt nạp"; giọng nhân viên không "Vui lòng" (content-guide 1) |

#### R2 Sprint 4 – FE-A đợt 16: khoảng nhập giá đêm thêm B18 (ARC 16.18, vòng sửa 5) (UXD duyệt 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `checkout.extra_night_range` | Sửa được trong khoảng {min} – {max}. | Can be changed within {min} – {max}. | ⟨chừa chỗ⟩ | H16 bước 2: CheckoutSummary.extraNightFloorVnd–extraNightCeilingVnd; nối sau checkout.extra_night_rate_help_tier (câu đủ chủ – vị, không còn mảnh "Trong khoảng…") |

#### R2 Sprint 4 – FE-A đợt 18: năm sinh trẻ em bắt buộc (S4-45), khung tiền drawer và H16 (BUG-R2-087, 101, 102, 103), giấy tờ chưa nhập (BUG-R2-089) (UXD duyệt 18/10 – s4-UXD-brand: 8 chuỗi, giữ nguyên; chuỗi thêm sau ghi nhóm mới)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `party.child_birth_year_required` | Nhập năm sinh của trẻ để tính đúng phụ thu và sức chứa. | Enter the child's year of birth so the surcharge and capacity are right. | ⟨chừa chỗ⟩ | S4-45 – câu VI theo BA EP02 mục 8; lý do khóa nút Thêm và lỗi REQUIRED của childBirthYear |
| `drawer.folio.refunded` | Đã hoàn | Refunded | ⟨chừa chỗ⟩ | BUG-R2-102 – dòng tiền đã hoàn cho khách (Σ payment refund đã chi), đứng sau Đã thu |
| `drawer.folio.nothing_posted` | Chưa có khoản nào trên folio. | Nothing on the folio yet. | ⟨chừa chỗ⟩ | BUG-R2-101 – thay dòng "Còn phải thu 0 đ" khi chưa có dòng và chưa thu (đơn giữ chỗ chưa cọc) |
| `co.late_row_new` | Phụ thu trả muộn {time} · {pct}% (dự tính) | Late check-out fee {time} · {pct}% (estimate) | ⟨chừa chỗ⟩ | BUG-R2-087 – H16 khung Folio: phụ thu theo giờ trả đang xem, chưa có dòng folio |
| `co.late_row_change` | Phụ thu trả muộn tính lại {time} · {pct}% – phần chênh (dự tính) | Late check-out fee recalculated {time} · {pct}% – difference (estimate) | ⟨chừa chỗ⟩ | BUG-R2-087 – đã có dòng phụ thu, số mới khác |
| `co.late_row_reversed` | Đảo phụ thu trả muộn đã ghi (dự tính) | Reversal of the late check-out fee posted (estimate) | ⟨chừa chỗ⟩ | BUG-R2-087 – sau mốc cuối/đêm thêm, phụ thu cũ bị đảo khi hoàn tất |
| `co.late_fee_row` | Phụ thu trả muộn bằng giá 1 đêm (dự tính) | Late check-out fee of one night (estimate) | ⟨chừa chỗ⟩ | BUG-R2-087 cùng gốc – BR-416-06, ghi khi hoàn tất |
| `reg.chip.needs_details` | Cần nhập thông tin | Details needed | ⟨chừa chỗ⟩ | BUG-R2-089 – giấy tờ mới có ảnh, chưa nhập trường; thay chip "Đã có" |

#### R2 Sprint 4 – FE-A đợt 19: giấy tờ luôn chọn người, không mặc định người đặt (SEC BE-73, ARC 16.22) (UXD duyệt 18/10 – s4-UXD-brand, sửa 3)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `reg.person_required` | Chọn người có tên trên giấy tờ này. | Choose the person named on this ID. | ⟨chừa chỗ⟩ | H14 nhập tay: chưa chọn người (bắt buộc – không mặc định người đặt). UXD 18/10: nói rõ "người có tên trên giấy tờ" |
| `reg.person_help` | Chọn đúng người có tên trên giấy tờ – đơn đặt hộ thì người ở có thể không phải người đặt. Người ở chưa có trong đơn: hệ thống tạo hồ sơ từ giấy tờ. | Choose the person named on the ID – when someone books for others, the guest staying may not be the booker. Not in the booking yet: a profile is created from the ID. | ⟨chừa chỗ⟩ | Gợi ý ô chọn người (ARC 16.22). UXD 18/10: khớp reg.person_required |
| `reg.person_not_in_party` | Người ở chưa có trong đơn | A guest not in the booking yet | ⟨chừa chỗ⟩ | Lựa chọn cuối danh sách – không gửi partyMemberId, server tạo hồ sơ "từ giấy tờ" |
| `reg.doc_is_main` | Người đứng tên khai báo lưu trú | Lead guest on the residence registration | ⟨chừa chỗ⟩ | isMain – chỉ là người đứng tên trên cổng khai báo, không quyết định giấy tờ của ai. UXD 18/10: tránh "Khách chính" lẫn với Khách đứng tên của đơn; EN theo thuật ngữ content-guide 3.1 (Residence registration) |
| `reg2.consent_needs_person` | Gắn người cho giấy tờ này trước khi ghi đồng ý. | Link this ID to a guest before recording consent. | ⟨chừa chỗ⟩ | H14 đồng ý giữ ảnh: giấy tờ chưa gắn người – ConsentInput.partyMemberId bắt buộc |

#### R2 Sprint 4 – FE-A đợt 20: UXR P-17/18/19/23/26/32/34, S4-13 hướng B (UXD duyệt 18/10 – s4-UXD-brand, sửa 4; duyệt cả sửa chữ ci.time_default_help (P-26), co.late_switch_hint, co.late_switch_hint_time (P-34 – bỏ "drawer"))

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `mlog.reason.foc_current_line` | Miễn/giảm chuyển sang dòng mới của khoản | Waiver moved to the charge's current line | ⟨chừa chỗ⟩ | P-19 – thay câu máy chủ "FOC on the current line of its key (BR-434)" |
| `mlog.reason.foc_follows` | Miễn/giảm đi theo khoản đã ghi lại | Waiver follows the re-posted charge | ⟨chừa chỗ⟩ | P-19 – "FOC follows its key (BR-434)" |
| `mlog.reason.foc_recomputed` | Miễn/giảm tính lại theo khoản | Waiver recalculated on the charge | ⟨chừa chỗ⟩ | P-19 – "FOC recomputed on its key (BR-434)" |
| `mlog.reason.night_resold` | Đêm đã bán lại cho khách khác | Night sold again to another guest | ⟨chừa chỗ⟩ | P-19 – B12, BR-429 (c) |
| `mlog.reason.checked_out` | Trả phòng | Checked out | ⟨chừa chỗ⟩ | P-19 – B18 |
| `mlog.reason.extended` | Gia hạn | Stay extended | ⟨chừa chỗ⟩ | P-19 – B13 |
| `mlog.reason.superseded_early_departure` | Thay bằng trả phòng sớm | Replaced by early departure | ⟨chừa chỗ⟩ | P-19 – B16 |
| `mlog.reason.superseded_extension` | Thay bằng gia hạn | Replaced by an extension | ⟨chừa chỗ⟩ | P-19 – B13 |
| `mlog.reason.hold_expired` | Giữ chỗ hết hạn | Hold expired | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100 – mã hệ thống |
| `mlog.reason.no_show` | Không đến | No-show | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100. UXD 18/10: đúng nhãn trạng thái no_show (BR-301) |
| `mlog.reason.early_departure` | Trả phòng sớm | Early departure | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100 |
| `mlog.reason.overbooking_relocated` | Chuyển khách sang nơi khác (xung đột OTA) | Guest moved elsewhere (OTA conflict) | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100. UXD 18/10: khớp mlog.a_relocation_cost – không dùng "quá tải phòng/overbooking" (content-guide 3.1) |
| `mlog.reason.refund_destination_changed` | Đổi nơi nhận hoàn tiền | Refund destination changed | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100 |
| `mlog.reason.room_return` | Khách chuyển về căn cũ | Guest moved back to the earlier room | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100 – S4-09 |
| `mlog.reason.minibar_recount` | Đếm lại minibar | Minibar recounted | ⟨chừa chỗ⟩ | P-19 / BUG-R2-100 |
| `mlog.reason.night_removed` | Đêm bị bỏ khỏi đơn | Night removed from the booking | ⟨chừa chỗ⟩ | P-19 – focCancelReason |
| `mlog.reason.reservation_cancelled` | Đơn đã hủy | Booking cancelled | ⟨chừa chỗ⟩ | P-19 – focCancelReason |
| `mlog.reason.settled_while_dormant` | Chốt folio khi miễn/giảm đang tạm ngưng | Folio settled while the waiver was paused | ⟨chừa chỗ⟩ | P-19 – focCancelReason |
| `recon.intro` | Đối chiếu từng khoản chuyển khoản, VietQR với sao kê ngân hàng. Tiền mặt sale/CTV thu: lễ tân xác nhận khi đã nộp quầy. | Match each transfer or VietQR payment with the bank statement. Cash collected by sales or agents: the front desk confirms it once handed in. | ⟨chừa chỗ⟩ | P-23 – thay pay.cash_hand_in ở đầu trang Chờ đối soát. UXD 18/10: "sale/CTV" như recon.empty_body |
| `recon.confirm_title` | Đã thấy {amount} của {code} trong sao kê? | Is {amount} for {code} on the statement? | ⟨chừa chỗ⟩ | P-23 – hộp xác nhận trước "Đã khớp sao kê" |
| `recon.confirm_body` | Khoản này rời danh sách chờ đối soát và không hoàn tác được. | This payment leaves the reconciliation list and cannot be undone. | ⟨chừa chỗ⟩ | P-23 – không có lệnh bỏ đối soát |
| `checkout.minibar.left_of_std` | Còn lại / chuẩn | Left / standard | ⟨chừa chỗ⟩ | P-18 – gộp cột Chuẩn vào Còn lại (1366×768) |
| `ci.effect_foc_pending` | Gửi kèm yêu cầu miễn {amount} để chờ duyệt. Phụ thu vẫn ghi vào folio; được duyệt thì mới trừ khoản miễn. | A waiver request of {amount} is sent for approval. The fee is still posted to the folio; the waiver applies only once approved. | ⟨chừa chỗ⟩ | P-26 – hộp xác nhận nhận phòng. UXD 18/10: tách 2 câu, nói rõ khi nào trừ |
| `bk.txn_ref_help` | Chuyển khoản hoặc VietQR: ghi mã giao dịch ngân hàng để đối soát. | Transfer or VietQR: note the bank transaction reference for reconciliation. | ⟨chừa chỗ⟩ | S4-13 (ARC 16.23) – initialPayment.note |
| `bk.receipt_later_fd` | Cần lưu ảnh biên nhận? Bấm "Giữ chỗ đến …", rồi xác nhận cọc kèm ảnh trong đơn. | Need to keep a receipt photo? Use "Hold until …", then confirm the deposit with the photo in the booking. | ⟨chừa chỗ⟩ | S4-13 – FD+: tạo đơn không nhận ảnh |
| `bk.receipt_later_sales` | Cần gửi ảnh biên nhận? Tạo đơn rồi dùng "Báo đã chuyển cọc" trong đơn. | Need to send a receipt photo? Create the booking, then use "Report deposit sent" in it. | ⟨chừa chỗ⟩ | S4-13 – SAL/CTV |

#### R2 Sprint 4 – FE-B tuần Ổn định: sửa theo UXR S4 (P-06 khai báo trên máy chưa cấp, P-21 Cần chú ý, P-22 tham số chờ hiệu lực) (FE viết theo content guide; UXD duyệt 18/10 – s4-UXD-brand, sửa 2)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `reg.untrusted_body` | Danh sách đơn cần khai báo, không kèm giấy tờ. Giấy tờ chỉ mở trên máy quầy đã cấp – nhắc lễ tân xử lý các đơn quá hạn. | Bookings to register, without IDs. IDs open only on an approved desk computer – remind the front desk about overdue ones. | ⟨chừa chỗ⟩ | UXR S4 P-06: H14 trên máy chưa cấp (điện thoại chủ đầu tư, từ H24 "Khai báo quá hạn") – dưới tiêu đề device.blocked_title, trên danh sách căn · khách · mã đơn · hạn (listRegistrations, không C3). UXD 18/10: bỏ "Đây là" – câu ngắn hơn, động từ ở câu sau |
| `reg.untrusted_ids` | Giấy tờ {n}/{total} | IDs {n}/{total} | ⟨chừa chỗ⟩ | UXR S4 P-06: số giấy tờ đã có / cần có trên dòng danh sách máy chưa cấp (submittedCount/requiredCount) |
| `attn.registration_due_no_time` | Khai báo lưu trú hôm nay: {n} đơn | Guest registrations due today: {n} | ⟨chừa chỗ⟩ | UXR S4 P-21: registration_due chưa có dueAt (chưa khách nào nhận phòng) – bỏ vế "hạn sớm nhất" thay vì để lửng |
| `params.pending` | {value} từ {date} | {value} from {date} | ⟨chừa chỗ⟩ | UXR S4 P-22: H05 – chip dưới giá trị đang áp khi đã lưu giá trị mới cho ngày sau, ví dụ "35% từ 19/10" (listParameters asOf xa) |
| `params.not_yet` | Chưa hiệu lực | Not yet effective | ⟨chừa chỗ⟩ | UXR S4 P-22: H05 lịch sử – dòng có Hiệu lực từ sau hôm nay. UXD 18/10: EN khớp "Effective from" của H05 |

#### R2 Sprint 4 – FE-A đợt 21: H06 4 số cuối giấy tờ (BUG-R2-179) (UXD duyệt 18/10 – s4-UXD-brand, sửa 1)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `crm.f_id_doc` | Giấy tờ (4 số cuối) | ID (last 4 digits) | ⟨chừa chỗ⟩ | H06 hồ sơ khách – idDocLast4 chỉ khi khách đồng ý ghi nhớ (P05), US-048 AC3, BR-610 |
| `crm.f_id_doc_help` | Chỉ hiện khi khách đồng ý để OTTIMO ghi nhớ. Số đầy đủ chỉ xem ở màn Giấy tờ & khai báo, trên máy quầy đã cấp. | Shown only if the guest agreed to be remembered. The full number is only on the IDs & registration screen, on an approved desk computer. | ⟨chừa chỗ⟩ | Gợi ý dưới dòng 4 số cuối. UXD 18/10: tên màn theo nav.registration, thêm điều kiện máy quầy đã cấp (US-142) |

#### R2 Sprint 4 – UXD: công nợ sau trả phòng (ARC 16.25, BR-525 G-4; UXD viết 18/10 – s4-UXD-brand)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `attn.checkout_debt` | Công nợ sau trả phòng chưa thu: {n} đơn | Unpaid debt after check-out: {n} booking(s) | ⟨chừa chỗ⟩ | AttentionItem.kind checkout_debt – MGR+; {n} ← count (Desk tra attn.<kind> với {n}). Không số tiền. warning; critical khi quá hạn (mức hiện bằng viền + icon, không đổi câu). Mở đơn khi count = 1 |
| `staff.notif.k.debt_recorded` | Khoản thu sau trả phòng vừa bị đảo – đơn còn công nợ | A payment was reversed after check-out – the booking now has a debt | ⟨chừa chỗ⟩ | StaffNotification.kind debt_recorded – gửi OWN + MGR (trừ người đảo); refType reservation, refCode hiện riêng như các thông báo khác. Không số tiền, không tên khách (ARC 16.25) |

#### R2 Sprint 4 – FE-A đợt 22: thu công nợ sau trả phòng (ARC 16.26, BR-525 G-4) (UXD duyệt 18/10 – s4-UXD-brand, sửa 1)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `debt.collect` | Thu công nợ | Collect debt | ⟨chừa chỗ⟩ | Nút ở drawer đơn đã trả phòng còn nợ và ở mục Cần chú ý checkout_debt (FD+) |
| `debt.collect_title` | Thu công nợ · {code} | Collect debt · {code} | ⟨chừa chỗ⟩ | Tiêu đề hộp |
| `debt.collect_help` | Còn phải thu {amount}. Thu đủ hoặc một phần; phiếu thanh toán đã cấp giữ nguyên. | {amount} still due. Collect all or part of it; the guest folio already issued stays as it is. | ⟨chừa chỗ⟩ | Đầu hộp – recordPayment type=charge trên folio đã khóa. UXD 18/10: "Hóa đơn" chỉ dùng cho hóa đơn GTGT – bill đưa khách là "Phiếu thanh toán" / "Guest folio" (content-guide 3.1) |
| `debt.collect_max` | Tối đa {amount} | Up to {amount} | ⟨chừa chỗ⟩ | Gợi ý ô số tiền – trần = còn phải thu |
| `debt.collect_submit` | Ghi nhận đã thu {amount} | Record {amount} received | ⟨chừa chỗ⟩ | Nút chính của hộp |
| `debt.collected_toast` | Đã thu {amount} công nợ của {code}. | {amount} of debt collected for {code}. | ⟨chừa chỗ⟩ | Sau khi thu |

#### R2 Sprint 4 – FE-A đợt 23: xóa công nợ – DebtWriteOffDialog (ARC 16.27, BR-433) (UXD duyệt 18/10 – s4-UXD-brand: thống nhất "công nợ", "phiếu thanh toán", "chủ đầu tư" = OWN; sửa 9)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `debt.write_off` | Xóa công nợ | Write off debt | ⟨chừa chỗ⟩ | ARC 16.27 – nút OWN/MGR cạnh Thu công nợ (drawer, Cần chú ý) |
| `debt.write_off_title` | Xóa công nợ · {code} | Write off debt · {code} | ⟨chừa chỗ⟩ | Tiêu đề hộp |
| `debt.write_off_help` | Còn phải thu {amount}. Chọn khoản để xóa công nợ; khoản này ghi là miễn phí sau khi chốt folio, phiếu thanh toán đã cấp giữ nguyên. | {amount} still due. Choose the charge to write off; it is posted as a waiver after settlement, and the guest folio already issued stays as it is. | ⟨chừa chỗ⟩ | requestFoc reasonCode=debt_write_off |
| `debt.write_off_limit` | Quản lý xóa công nợ tới giá 1 đêm; vượt mức này cần chủ đầu tư duyệt. | A manager can write off up to one night's rate; above that, the owner approves. | ⟨chừa chỗ⟩ | BR-433 – chỉ hiện với MGR |
| `debt.write_off_line` | Khoản xóa công nợ | Charge to write off | ⟨chừa chỗ⟩ | Nhóm chọn dòng folio (dòng tiền phòng ảnh hưởng hoa hồng – BR-903) |
| `debt.write_off_note` | Lý do xóa công nợ | Reason for the write-off | ⟨chừa chỗ⟩ | Ghi chú bắt buộc (≥ 3 ký tự) |
| `debt.write_off_submit` | Xóa công nợ {amount} | Write off {amount} | ⟨chừa chỗ⟩ | Nút chính |
| `debt.write_off_done` | Đã xóa công nợ {amount} của {code}. | {amount} written off for {code}. | ⟨chừa chỗ⟩ | Sau khi áp |
| `debt.write_off_pending` | Đã gửi yêu cầu xóa công nợ {amount} của {code} – chờ chủ đầu tư duyệt. | Write-off request of {amount} for {code} sent – awaiting the owner's approval. | ⟨chừa chỗ⟩ | MGR vượt giá 1 đêm (BR-433) |
| `foc.r_debt_write_off` | Xóa công nợ | Debt written off | ⟨chừa chỗ⟩ | Lý do FOC debt_write_off – dòng folio, nhật ký tiền |

#### R2 Sprint 4 – MOB sửa theo UXR đi thử PWA (s4-pwa-walkthrough P-01/04/07/08/09/10/11/12/13/16/28) (UXD duyệt 18/10 – s4-UXD-brand, sửa 8)

| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |
|---|---|---|---|---|
| `hk.queue.in_line` | Chờ lượt | Waiting in line | ⟨chừa chỗ⟩ | P-07: dòng thứ 2 trở đi khi có mạng (dòng đầu = hk.queue.sending); thay câu "Bấm lúc…" lặp lại. UXD 18/10: EN tự nhiên hơn |
| `hk.queue.r.time` | Chưa ghi được vì giờ bấm ({time}) lệch quá xa giờ hiện tại. Nếu việc đã xong, bấm "Gửi lại" để ghi theo giờ bây giờ. | Not recorded: the time you tapped ({time}) is too far from the current time. If the work is done, tap "Send again" to record it now. | ⟨chừa chỗ⟩ | P-01/P-08: 422 PERFORMED_AT_OUT_OF_RANGE của trạng thái buồng / việc – có nút hk.queue.resend. UXD 18/10: HK dùng câu thường (HR-13) – bỏ "máy chủ"; đúng cả hai trường hợp quá lâu và lệch đồng hồ máy |
| `hk.queue.r.photo` | Ảnh này không gửi được. Phiếu vẫn được gửi, không kèm ảnh này. | This photo couldn't be sent. The report was sent without it. | ⟨chừa chỗ⟩ | P-08: ảnh bị từ chối (EP07-08 8.3) |
| `hk.queue.r.forbidden` | Tài khoản của bạn không còn được làm việc này. Báo lễ tân. | Your account can no longer do this. Tell the front desk. | ⟨chừa chỗ⟩ | P-08: 403 |
| `hk.queue.r.not_found` | Căn hoặc việc này không còn trong danh sách của bạn. Không cần làm lại. | This room or task is no longer on your list. No need to do it again. | ⟨chừa chỗ⟩ | P-08: 404 |
| `hk.queue.r.other` | Hệ thống không nhận thao tác này. Báo lễ tân nếu căn vẫn cần cập nhật. | The system didn't accept this action. Tell the front desk if the room still needs updating. | ⟨chừa chỗ⟩ | P-08: mã khác – thay hk.queue.rejected_other (câu cũ có mã trong câu). UXD 18/10: "hệ thống" thay "máy chủ" (HR-13) |
| `hk.queue.ref_code` | Mã tham chiếu: {code} | Reference: {code} | ⟨chừa chỗ⟩ | P-08: chữ nhỏ dưới câu, để lễ tân/kỹ thuật tra |
| `hk.queue.resend` | Gửi lại "{action}" | Send "{action}" again | ⟨chừa chỗ⟩ | P-08: nút – tạo thao tác mới với giờ hiện tại, có Hoàn tác 10 giây |
| `hk.queue.resent_toast` | Căn {room}: đã gửi lại "{action}" | Room {room}: "{action}" sent again | ⟨chừa chỗ⟩ | P-08: toast sau nút Gửi lại. UXD 18/10: toast nói kết quả – thêm "đã" |
| `login.error_network` | Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Đăng nhập lần nữa. | Couldn't reach the server. Check the connection, then tap Sign in again. | ⟨chừa chỗ⟩ | P-28: nút ở màn này là "Đăng nhập", không phải "Thử lại" (common.error_network_body) |
| `hk.wo.sent_to_mt` | Đã gửi tới bảo trì. Không cần làm gì thêm. | Sent to maintenance. Nothing more to do. | ⟨chừa chỗ⟩ | P-16: thay hk.wo.sent_body ("Bảo trì đã thấy phiếu" – lúc đó chưa ai mở). UXD 18/10: giọng nhân viên không xưng hô (content-guide 1) |
| `wo.photos_report_and_after` | Ảnh lúc báo và sau khi sửa | Photos when reported and after repair | ⟨chừa chỗ⟩ | P-11: tiêu đề khối ảnh khi phiếu có doneAt – đến khi API tách trường ảnh sau sửa (BE-C/ARC) |
| `hk.grp.do_first` | Làm trước | Do first | ⟨chừa chỗ⟩ | P-12: thay hk.grp.first – nhóm gồm cả bộ đồ dùng thêm, dọn gấp, việc có hạn giờ; lý do nằm trên thẻ |
| `hk.grp.cancelled` | Đã bỏ ({n}) | Cancelled ({n}) | ⟨chừa chỗ⟩ | P-13: việc đã bỏ hôm nay, mỗi thẻ có lý do. UXD 18/10: EN khớp VI (cả "hết ngày – chưa làm" nên không ghi "not needed") |
| `hk.task_done_at` | {task} – xong {time} | {task} – done {time} | ⟨chừa chỗ⟩ | P-13: thẻ "Đã xong" ghi tên việc, không ghi trạng thái căn |
| `hk.toast.refused` | Căn {room}: đã bỏ việc dọn hôm nay | Room {room}: no cleaning today | ⟨chừa chỗ⟩ | P-13: toast "Khách không muốn dọn" có số căn. UXD 18/10: EN tự nhiên hơn |
| `hk.cancel.reservation_changed` | Đơn thay đổi – không cần làm | Booking changed – not needed | ⟨chừa chỗ⟩ | P-13: cancelReasonCode reservation_changed |
| `hk.cancel.room_blocked` | Căn đang khóa để sửa | Room blocked for repair | ⟨chừa chỗ⟩ | P-13: cancelReasonCode room_blocked |
| `hk.cancel.day_ended` | Hết ngày – chưa làm | Day ended – not done | ⟨chừa chỗ⟩ | P-13: cancelReasonCode day_ended |
| `hk.refill_unnamed` | Bổ sung minibar: {n} món – xem tủ hoặc hỏi lễ tân tên món | Restock minibar: {n} items – check the minibar or ask the front desk which ones | ⟨chừa chỗ⟩ | P-04: khi refillItems chưa có itemName (BE chưa trả) – thay câu "1, 1". UXD 18/10: EN "minibar" như hk.refill |

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
