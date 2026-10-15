
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
| `error.REAUTH_FAILED` | Mã PIN chưa đúng. Còn {left} lần thử. | Incorrect PIN. {left} attempts left. | ⟨chừa chỗ⟩ | 401 |
| `error.DUPLICATE_GUEST` | SĐT/email này đã thuộc hồ sơ {guest}. Dùng hồ sơ đó? | This phone/email belongs to {guest}. Use that profile? | ⟨chừa chỗ⟩ | 409 + `existingGuestId` – BR-951 |
| `error.CARD_NUMBER_DETECTED` | Ô ghi chú có dãy số giống số thẻ thanh toán. Xóa dãy số đó – OTTIMO không lưu số thẻ. | The note contains what looks like a card number. Remove it – OTTIMO doesn't store card numbers. | ⟨chừa chỗ⟩ | 422 – R-PAY-07 |
| `error.PAYMENT_NOT_CONFIGURED` | Chưa cài tài khoản nhận chuyển khoản nên chưa tạo được VietQR. Chọn cách thanh toán khác và báo chủ đầu tư cài đặt. | No receiving account is set up, so VietQR can't be created. Choose another method and ask the owner to set it up. | ⟨chừa chỗ⟩ | 409 – US-120 |
| `error.REGISTRATION_INCOMPLETE` | Khai báo chưa đủ: còn thiếu giấy tờ hoặc cảnh báo chưa ghi cách xử lý. | Registration incomplete: IDs missing or warnings without a note. | ⟨chừa chỗ⟩ | 409 – K5 |
| `error.GUEST_LINK_INVALID` | Liên kết đã hết hạn hoặc không còn dùng được. Nhắn OTTIMO để nhận liên kết mới. | This link has expired or is no longer valid. Message OTTIMO for a new one. | ⟨chừa chỗ⟩ | 401 – app khách; màn đầy đủ dùng `guest.link_expired_*` |
| `error.GUEST_VERIFICATION_REQUIRED` | Để xem mục này, xác minh bằng mã gửi qua email hoặc mã do lễ tân cấp. | To see this, verify with the code sent by email or given by reception. | ⟨chừa chỗ⟩ | 403 – mức 2 (SR-GST-07) |
| `error.DEVICE_NOT_TRUSTED` | Máy này chưa được cấp quyền xem giấy tờ và mã cửa. Dùng máy quầy đã cấp, hoặc nhờ chủ đầu tư cấp quyền cho máy này. | This device isn't approved for IDs and door codes. Use an approved desk computer, or ask the owner to approve this one. | ⟨chừa chỗ⟩ | 403 – SR-DEV-03; mã mới do SEC thêm, ARC cần bổ sung vào bảng mã openapi |
| `error.FILE_REJECTED` | Tệp này chưa dùng được. Chỉ nhận ảnh JPG, PNG, HEIC hoặc PDF dung lượng vừa phải – chụp lại hoặc chọn tệp khác. | This file can't be used. Only JPG, PNG, HEIC or PDF of reasonable size – retake or choose another file. | ⟨chừa chỗ⟩ | 422 – giới hạn dung lượng OPS/SEC chốt |
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
| `approval.pin_title` | Duyệt bằng PIN của bạn | Approve with your PIN | ⟨chừa chỗ⟩ | BR-432 – tài khoản của chính người duyệt |
| `approval.pin_label` | Mã PIN | PIN | ⟨chừa chỗ⟩ |  |
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
| `auth.code_label.recovery` | Mã khôi phục (10 ký tự) | Recovery code (10 characters) | ⟨chừa chỗ⟩ |  |
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
