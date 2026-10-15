"""Single source for UI strings (VI/EN, RU slots). Generates:
- product/design/copy/strings-vi.json, strings-en.json, strings-ru.json
- product/design/wireframes/assets/strings.js
- scratch/strings-tables.md (pasted into content-guide.md)
Placeholders use ICU-like {name}. RU = None means "chừa chỗ – fallback EN".
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))

S = []  # (group, key, vi, en, ru, note)
def g(group, rows):
    for r in rows:
        key, vi, en = r[0], r[1], r[2]
        ru = r[3] if len(r) > 3 else None
        note = r[4] if len(r) > 4 else ""
        S.append((group, key, vi, en, ru, note))

# ---------- Chung ----------
g("Chung", [
    ("common.save", "Lưu", "Save"),
    ("common.cancel", "Hủy", "Cancel", None, "Chỉ dùng cho nút đóng form không lưu. Hủy đơn dùng 'Hủy đơn'"),
    ("common.close", "Đóng", "Close", "Закрыть"),
    ("common.back", "Quay lại", "Back", "Назад"),
    ("common.next", "Tiếp tục", "Continue", "Далее"),
    ("common.edit_back", "← Sửa lại", "← Go back and edit"),
    ("common.retry", "Thử lại", "Try again", "Повторить"),
    ("common.undo", "Hoàn tác", "Undo"),
    ("common.search_placeholder", "Tìm tên khách, SĐT, mã đơn, số căn…", "Search guest name, phone, booking code, room…"),
    ("common.required", "Bắt buộc", "Required"),
    ("common.optional", "Không bắt buộc", "Optional"),
    ("common.loading", "Đang tải…", "Loading…", "Загрузка…"),
    ("common.saving", "Đang lưu…", "Saving…"),
    ("common.saved", "Đã lưu", "Saved"),
    ("common.offline_banner", "Mất kết nối. Thao tác của bạn được giữ lại và sẽ tự gửi khi có mạng.", "You're offline. Your changes are kept and will be sent when you're back online.", "Нет подключения. Изменения сохранены и будут отправлены, когда связь восстановится."),
    ("common.offline_queued", "{count} thao tác đang chờ gửi", "{count} changes waiting to send"),
    ("common.unsaved_title", "Bỏ các thay đổi chưa lưu?", "Discard unsaved changes?"),
    ("common.unsaved_body", "Bạn đã nhập thông tin trong form này. Nếu đóng, thông tin sẽ mất.", "You've entered information in this form. If you close it, it will be lost."),
    ("common.unsaved_keep", "Tiếp tục nhập", "Keep editing"),
    ("common.unsaved_discard", "Bỏ thay đổi", "Discard"),
    ("common.error_generic_title", "Chưa tải được dữ liệu", "Couldn't load data", "Не удалось загрузить данные"),
    ("common.error_generic_body", "Có thể do mạng chập chờn. Dữ liệu của bạn không bị mất. Bấm Thử lại; nếu vẫn lỗi, báo quản lý kèm mã {code}.", "This may be a network problem. Nothing has been lost. Tap Try again; if it keeps failing, tell your manager the code {code}.", None),
    ("common.currency_vnd", "{amount} đ", "{amount} VND", "{amount} VND"),
    ("common.approx_usd", "≈ {usd} USD (tỷ giá {rate}, cập nhật {date})", "≈ {usd} USD (rate {rate}, updated {date})"),
])

# ---------- Trạng thái ----------
g("Trạng thái đơn (BR-301)", [
    ("status.booking.hold", "Giữ chỗ · chờ cọc", "On hold · awaiting deposit", None, "hold"),
    ("status.booking.confirmed", "Đã xác nhận", "Confirmed", "Подтверждено", "confirmed"),
    ("status.booking.in_house", "Đang ở", "In house", "Проживает", "in_house"),
    ("status.booking.checked_out", "Đã trả phòng", "Checked out", "Выезд оформлен", "checked_out"),
    ("status.booking.cancelled", "Đã hủy", "Cancelled", "Отменено", "cancelled"),
    ("status.booking.no_show", "Không đến", "No-show", None, "no_show"),
    ("status.block.ooo", "Khóa phòng", "Out of order", None, "Khối OOO – không phải trạng thái đơn (BR-804)"),
    ("status.booking.long_term", "Hợp đồng dài hạn", "Long-term lease", None, "Loại đơn, không phải trạng thái"),
])
g("Trạng thái buồng (BR-801) – giao diện quản lý", [
    ("status.room.VC", "VC · Trống, sạch", "VC · Vacant clean"),
    ("status.room.VI", "VI · Đã kiểm, sẵn sàng", "VI · Inspected, ready"),
    ("status.room.VD", "VD · Trống, cần dọn", "VD · Vacant dirty"),
    ("status.room.CL", "CL · Đang dọn", "CL · Cleaning"),
    ("status.room.OC", "OC · Có khách, sạch", "OC · Occupied clean"),
    ("status.room.OD", "OD · Có khách, cần dọn", "OD · Occupied dirty"),
    ("status.room.OOO", "OOO · Khóa phòng, đang sửa", "OOO · Out of order"),
])
g("Trạng thái buồng – giao diện buồng phòng (HR-13, không dùng mã)", [
    ("hk.status.VC", "Sạch – chờ kiểm", "Clean – needs inspection"),
    ("hk.status.VI", "Sẵn sàng đón khách", "Ready for guests"),
    ("hk.status.VD", "Cần dọn (khách đã đi)", "Needs cleaning (guest left)"),
    ("hk.status.CL", "Đang dọn", "Cleaning"),
    ("hk.status.OC", "Khách đang ở – đã dọn", "Guest staying – cleaned"),
    ("hk.status.OD", "Khách đang ở – cần dọn", "Guest staying – needs cleaning"),
    ("hk.status.OOO", "Đang sửa – không bán", "Under repair – not for sale"),
])
g("Trạng thái khai báo (BR-607) và kết quả kiểm tra (HR-07)", [
    ("status.reg.none", "Chưa có giấy tờ", "No documents yet"),
    ("status.reg.partial", "Thiếu người", "Missing guests"),
    ("status.reg.review", "Cần kiểm tra", "Needs review"),
    ("status.reg.scanned", "Đủ giấy tờ · chờ khai báo", "Documents complete · not yet registered"),
    ("status.reg.sent", "Đã gửi khai báo", "Registration submitted"),
    ("status.reg.confirmed", "Công an đã xác nhận", "Confirmed by police"),
    ("status.reg.pre", "Khách đã gửi trước qua app", "Sent in advance by guest"),
    ("status.reg.needs_update", "Cần cập nhật ngày đi", "Departure date needs updating"),
    ("status.reg.updated", "Đã cập nhật ngày đi", "Departure date updated"),
    ("check.pass", "Đạt", "Pass"),
    ("check.fail", "Không đạt", "Fail"),
    ("check.unknown", "Chưa kiểm được – cần kiểm tay", "Not verified – check manually"),
])

# ---------- Luồng 2 ----------
g("Luồng 2 – Room rack, đặt phòng mới, chi tiết đơn", [
    ("fo.rack.title", "Sơ đồ phòng", "Room rack"),
    ("fo.rack.range", "14 ngày từ {from}", "14 days from {from}"),
    ("fo.rack.today", "Hôm nay", "Today"),
    ("fo.rack.legend", "Chú giải", "Legend"),
    ("fo.rack.new_booking", "+ Đặt phòng mới", "+ New booking"),
    ("fo.rack.empty_cell_hint", "Bấm ô trống để đặt căn {room} từ {date}", "Click an empty cell to book room {room} from {date}"),
    ("fo.rack.view_list", "Xem dạng danh sách", "List view"),
    ("fo.rack.view_grid", "Xem dạng lưới", "Grid view"),
    ("fo.rack.empty_title", "Chưa có đơn nào trong 14 ngày này", "No bookings in these 14 days"),
    ("fo.rack.empty_body", "Cả 10 căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu.", "All 10 rooms are free. Click an empty cell or New booking to start."),
    ("fo.rack.error_title", "Chưa tải được sơ đồ phòng", "Couldn't load the room rack"),
    ("fo.rack.stale", "Dữ liệu lúc {time}. Đang kết nối lại…", "Data as of {time}. Reconnecting…"),
    ("fo.rack.mismatch", "Căn {room}: buồng ghi \"có khách\" nhưng không có đơn đang ở. Kiểm tra lại.", "Room {room}: marked occupied but no in-house booking. Please check.", None, "BR-806"),
    ("fo.tabs.arrivals", "Khách đến ({n})", "Arrivals ({n})"),
    ("fo.tabs.departures", "Khách đi ({n})", "Departures ({n})"),
    ("fo.tabs.in_house", "Đang ở ({n})", "In house ({n})"),
    ("fo.tabs.holds", "Giữ chỗ chưa cọc ({n})", "Holds awaiting deposit ({n})", None, "BR-404"),
    ("booking.new.title", "Đặt phòng mới", "New booking"),
    ("booking.field.room", "Căn", "Room"),
    ("booking.field.channel", "Kênh", "Channel"),
    ("booking.field.dates", "Ngày đến – ngày đi", "Arrival – departure"),
    ("booking.field.nights", "{n} đêm", "{n} nights"),
    ("booking.field.guests", "Số khách", "Guests"),
    ("booking.field.guests_help", "Người lớn và trẻ em. Mỗi người cần giấy tờ để khai báo lưu trú.", "Adults and children. Each person needs an ID for residence registration."),
    ("booking.field.rate", "Giá mỗi đêm", "Rate per night"),
    ("booking.field.rate_source", "Nguồn giá: {source}", "Rate source: {source}", None, "HR-18: luôn hiện nguồn giá"),
    ("booking.field.ota_code", "Mã đặt phòng OTA", "OTA booking reference"),
    ("booking.field.ota_paid", "OTA đã thu tiền phòng", "Room paid to OTA"),
    ("booking.field.guest", "Khách đứng tên", "Main guest"),
    ("booking.field.phone", "Số điện thoại / Zalo", "Phone / Zalo"),
    ("booking.field.phone_help", "Bắt buộc với kênh Trực tiếp và CTV", "Required for Direct and Agent bookings"),
    ("booking.summary.total", "Tổng tiền phòng", "Room total"),
    ("booking.summary.deposit", "Cọc cần thu (theo BR-305)", "Deposit due (per BR-305)"),
    ("booking.create", "Tạo đơn", "Create booking"),
    ("booking.create_hold", "Giữ chỗ {hours} giờ", "Hold for {hours} hours"),
    ("booking.error.conflict", "Căn {room} đã có đơn của {guest} từ {from} đến {to}. Chọn ngày khác hoặc một căn trống bên dưới.", "Room {room} is already booked by {guest} from {from} to {to}. Choose other dates or a free room below."),
    ("booking.error.conflict_alt", "Căn trống cùng nhóm: {rooms}", "Free rooms in the same group: {rooms}"),
    ("booking.error.ooo", "Căn {room} đang khóa sửa chữa từ {from} đến {to}.", "Room {room} is out of order from {from} to {to}."),
    ("booking.error.past_date", "Ngày đến không được trước hôm nay.", "Arrival can't be before today."),
    ("booking.error.phone", "Số điện thoại cần ít nhất 9 chữ số. Ví dụ: 0912 345 678.", "Phone number needs at least 9 digits. Example: +84 912 345 678."),
    ("booking.error.dup_guest", "SĐT này đã thuộc hồ sơ {guest}. Dùng hồ sơ đó?", "This phone number belongs to {guest}. Use that profile?"),
    ("booking.error.rate_empty", "Nhập giá mỗi đêm (lớn hơn 0).", "Enter a rate per night (above 0)."),
    ("booking.error.rate_range", "Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}).", "Rate must be between {min} and {max} (floor – ceiling for {group}).", None, "BR-105"),
    ("booking.error.server_conflict", "Căn vừa được người khác đặt trong lúc bạn nhập. Thông tin của bạn vẫn còn – chọn căn khác để lưu.", "Someone else just booked this room while you were typing. Your details are kept – choose another room to save.", None, "BR-906"),
    ("booking.toast.created", "Đã tạo đơn {code}", "Booking {code} created"),
    ("drawer.progress.short", "Đặt · Giữ chỗ · Đã cọc · Nhận phòng · Trả phòng", "Booked · Hold · Deposit paid · Check-in · Check-out"),
    ("drawer.progress.long", "Báo giá · Giữ chỗ · Ký HĐ & ký quỹ · Nhận phòng · Thu theo kỳ", "Quote · Hold · Lease & deposit · Move-in · Periodic billing"),
    ("drawer.hold.expires", "Hết hạn giữ chỗ sau {time}", "Hold expires in {time}", None, "HR-16"),
    ("drawer.hold.expired", "Giữ chỗ đã hết hạn lúc {time} – đơn đã tự hủy", "Hold expired at {time} – booking auto-cancelled"),
    ("drawer.folio.title", "Folio", "Folio"),
    ("drawer.folio.room", "Tiền phòng ({n} đêm)", "Room charges ({n} nights)"),
    ("drawer.folio.paid", "Đã thu", "Paid"),
    ("drawer.folio.balance", "Còn phải thu", "Balance due"),
    ("drawer.folio.settled", "Đã thanh toán đủ", "Paid in full"),
    ("drawer.action.confirm_deposit", "Xác nhận đã nhận cọc", "Confirm deposit received"),
    ("drawer.action.cancel_hold", "Hủy giữ chỗ", "Cancel hold"),
    ("drawer.action.cancel_booking", "Hủy đơn", "Cancel booking"),
    ("drawer.action.check_in", "Nhận phòng", "Check in"),
    ("drawer.action.check_out", "Trả phòng", "Check out"),
    ("drawer.action.send_checkin_link", "Gửi link check-in online", "Send online check-in link"),
    ("drawer.action.extend", "Gia hạn", "Extend stay"),
    ("drawer.action.late_checkout", "Trả muộn", "Late check-out"),
    ("drawer.action.docs", "Giấy tờ & khai báo", "IDs & registration"),
    ("cancel.title", "Hủy giữ chỗ căn {room}?", "Cancel the hold on room {room}?"),
    ("cancel.consequence", "Căn {room} sẽ mở bán lại từ {from} đến {to} trên {channels} kênh. Khách tiềm năng {lead} trở về \"Đã báo giá\".", "Room {room} will be back on sale from {from} to {to} on {channels} channels. Lead {lead} returns to \"Quoted\"."),
    ("cancel.reason", "Lý do hủy", "Cancellation reason"),
    ("cancel.reason.changed_mind", "Khách đổi ý", "Guest changed their mind"),
    ("cancel.reason.found_other", "Khách tìm được chỗ khác", "Guest found another place"),
    ("cancel.reason.price", "Giá chưa phù hợp", "Price not suitable"),
    ("cancel.reason.dates", "Đổi ngày", "Change of dates"),
    ("cancel.reason.unreachable", "Không liên lạc được", "Guest unreachable"),
    ("cancel.reason.other", "Khác (ghi rõ)", "Other (please specify)"),
    ("cancel.fee_none", "Không thu phí (giữ chỗ chưa cọc – BR-308)", "No fee (hold without deposit – BR-308)"),
    ("cancel.confirm", "Hủy giữ chỗ", "Cancel hold"),
    ("cancel.keep", "Giữ lại đơn", "Keep booking"),
])

# ---------- Luồng 3 ----------
g("Luồng 3 – Nhận phòng, giấy tờ, khai báo, mã cửa", [
    ("checkin.title", "Nhận phòng · Căn {room} · {guest}", "Check-in · Room {room} · {guest}"),
    ("checkin.step.docs", "Giấy tờ", "IDs"),
    ("checkin.step.verify", "Kiểm tra", "Verify"),
    ("checkin.step.register", "Khai báo", "Register"),
    ("checkin.step.handover", "Giao mã & hoàn tất", "Hand over & finish"),
    ("checkin.room_not_ready", "Căn {room} đang \"{status}\" – chưa sẵn sàng. Cần lễ tân trưởng xác nhận và ghi lý do để nhận phòng.", "Room {room} is \"{status}\" – not ready. A senior receptionist must approve with a reason.", None, "BR-402"),
    ("checkin.docs.progress", "Đã có giấy tờ {have}/{need} người", "IDs collected for {have} of {need} guests"),
    ("checkin.docs.scan", "Chụp hoặc tải ảnh giấy tờ", "Take or upload a photo of the ID"),
    ("checkin.docs.manual", "Nhập tay", "Enter manually"),
    ("checkin.docs.from_app", "Khách đã gửi trước qua app", "Sent in advance by the guest"),
    ("checkin.docs.reading", "Đang đọc giấy tờ…", "Reading the ID…"),
    ("checkin.docs.read_failed", "Không đọc được ảnh (mờ hoặc lóa). Chụp lại ở chỗ sáng hơn, hoặc nhập tay.", "Couldn't read the photo (blurry or glare). Retake it in better light, or enter it manually."),
    ("checkin.docs.empty", "Chưa có giấy tờ nào. Bắt đầu với người đứng tên.", "No IDs yet. Start with the main guest."),
    ("checkin.docs.field.full_name", "Họ tên (như trên giấy tờ)", "Full name (as on ID)"),
    ("checkin.docs.field.doc_type", "Loại giấy tờ", "ID type"),
    ("checkin.docs.field.doc_no", "Số giấy tờ", "ID number"),
    ("checkin.docs.field.dob", "Ngày sinh", "Date of birth"),
    ("checkin.docs.field.nationality", "Quốc tịch", "Nationality"),
    ("checkin.docs.field.passport_expiry", "Hạn hộ chiếu", "Passport expiry"),
    ("checkin.docs.field.visa", "Thị thực / miễn thị thực đến ngày", "Visa / visa exemption valid until"),
    ("checkin.docs.field.entry_date", "Ngày nhập cảnh", "Date of entry"),
    ("checkin.consent.label", "Khách đồng ý cho OTTIMO lưu ảnh giấy tờ trong {days} ngày sau trả phòng", "Guest agrees OTTIMO may keep ID photos for {days} days after check-out", None, "BR-609/610 – số ngày lấy từ tham số"),
    ("checkin.consent.help", "Không đồng ý vẫn khai báo được: chỉ lưu các trường cần thiết, không lưu ảnh.", "If the guest declines, registration still works: only the required fields are kept, no photos."),
    ("checkin.verify.name", "Tên khớp với đơn", "Name matches booking"),
    ("checkin.verify.passport", "Hộ chiếu còn hạn sau ngày trả phòng ({date})", "Passport valid beyond check-out ({date})"),
    ("checkin.verify.visa", "Thị thực còn hạn đến ngày trả phòng", "Visa valid until check-out"),
    ("checkin.verify.headcount", "Đủ giấy tờ cho {need} khách", "IDs for all {need} guests"),
    ("checkin.verify.fail_passport", "Hộ chiếu hết hạn {date}, trước ngày trả phòng {checkout}. Không nhận phòng với giấy tờ này – báo quản lý.", "Passport expires {date}, before check-out {checkout}. Don't check in with this ID – tell the manager."),
    ("checkin.verify.visa_short", "Thị thực hết hạn {date}, trước ngày trả phòng. Khai báo đến {date} và nhắc khách gia hạn trước {remind}.", "Visa expires {date}, before check-out. Register until {date} and remind the guest to extend before {remind}.", None, "BR-605"),
    ("checkin.verify.unknown_help", "Hệ thống chưa đủ dữ liệu để kiểm. Hãy xem giấy tờ gốc và đánh dấu kết quả.", "The system doesn't have enough data to check. Look at the original ID and mark the result."),
    ("checkin.verify.mark_pass", "Tôi đã kiểm – Đạt", "I checked – Pass"),
    ("checkin.verify.mark_fail", "Tôi đã kiểm – Không đạt", "I checked – Fail"),
    ("reg.deadline", "Hạn khai báo: {time}", "Registration deadline: {time}", None, "BR-602/603 – hạn sớm hơn"),
    ("reg.deadline_left", "còn {duration}", "{duration} left"),
    ("reg.deadline_overdue", "Đã quá hạn {duration}", "Overdue by {duration}"),
    ("reg.type.foreigner", "Khai báo tạm trú người nước ngoài", "Temporary residence declaration (foreign nationals)"),
    ("reg.type.citizen", "Thông báo lưu trú công dân Việt Nam", "Residence notification (Vietnamese citizens)"),
    ("reg.step.copy", "1. Sao chép từng trường theo đúng thứ tự trên cổng", "1. Copy each field in the portal's order"),
    ("reg.step.open", "2. Mở cổng khai báo Bộ Công an", "2. Open the Ministry of Public Security portal"),
    ("reg.step.code", "3. Dán mã hồ sơ cổng trả về", "3. Paste the file code returned by the portal"),
    ("reg.copy_field", "Sao chép", "Copy"),
    ("reg.copied", "Đã chép", "Copied"),
    ("reg.portal_opened", "Đã mở cổng – chưa có mã hồ sơ", "Portal opened – no file code yet"),
    ("reg.code_label", "Mã hồ sơ", "File code"),
    ("reg.code_error", "Mã hồ sơ chưa đúng dạng (ví dụ {example}).", "File code format looks wrong (e.g. {example})."),
    ("reg.later", "Khai báo sau (thêm vào việc cần làm)", "Register later (add to to-do list)"),
    ("reg.later_note", "Việc này sẽ nằm trên Tổng quan và nhắc lúc {times} cho đến khi xong.", "This stays on the Overview and reminds you at {times} until done."),
    ("handover.door_code", "Mã cửa", "Door code"),
    ("handover.door_code_help", "Hiệu lực từ {from} đến {to}. Khách thấy mã trong app từ ngày nhận phòng.", "Valid from {from} to {to}. The guest sees it in their app from arrival day.", None, "BR-403"),
    ("handover.cards", "Số thẻ phòng đã giao", "Key cards issued"),
    ("handover.cards_help", "Tối đa 2 thẻ (1 chính + 1 dự phòng). Trả thiếu khi đi: phí theo BR-511.", "Up to 2 cards (1 main + 1 spare). Missing at check-out: fee per BR-511."),
    ("handover.arrival_time", "Giờ nhận phòng thực tế", "Actual check-in time"),
    ("handover.early_toggle", "Khách nhận sớm trước {std}", "Guest checks in early, before {std}"),
    ("handover.early_none", "Nhận đúng giờ chuẩn – không phụ thu", "Standard check-in time – no surcharge", None, "HR-04 mặc định"),
    ("handover.early_fee", "Phụ thu nhận sớm: {amount} ({pct}% giá đêm đầu, BR-411)", "Early check-in surcharge: {amount} ({pct}% of first night, BR-411)"),
    ("handover.early_confirm", "Tôi đã báo khách khoản phụ thu này", "I've told the guest about this surcharge"),
    ("handover.foc", "Đề nghị miễn phí (FOC)", "Request a waiver (FOC)"),
    ("handover.foc_reason", "Lý do miễn phí", "Waiver reason"),
    ("handover.foc_approver", "Người duyệt", "Approver"),
    ("handover.foc_over_limit", "Vượt hạn mức của bạn ({limit}). Yêu cầu sẽ gửi {approver} duyệt.", "Above your limit ({limit}). The request goes to {approver} for approval.", None, "BR-433"),
    ("handover.finish", "Hoàn tất nhận phòng", "Complete check-in"),
    ("handover.done", "Đã nhận phòng căn {room}. Buồng chuyển \"Có khách\".", "Checked in to room {room}. Room set to \"Occupied\"."),
    ("handover.reg_pending_banner", "Còn {n} khách chưa khai báo – hạn {time}. Đã thêm vào việc cần làm.", "{n} guests not yet registered – due {time}. Added to the to-do list."),
])

# ---------- Luồng 4 ----------
g("Luồng 4 – Trả phòng 3 bước, bill, thanh toán, ký quỹ", [
    ("checkout.title", "Trả phòng · Căn {room} · {guest}", "Check-out · Room {room} · {guest}"),
    ("checkout.step.minibar", "Minibar", "Minibar"),
    ("checkout.step.extras", "Phụ phí", "Extras"),
    ("checkout.step.bill", "Bill & thu tiền", "Bill & payment"),
    ("checkout.minibar.left", "Còn lại", "Remaining"),
    ("checkout.minibar.used", "Đã dùng", "Used"),
    ("checkout.minibar.free", "Miễn phí", "Complimentary"),
    ("checkout.minibar.from_hk", "Buồng phòng đã kiểm lúc {time} ({who})", "Checked by housekeeping at {time} ({who})"),
    ("checkout.minibar.empty", "Căn này không có minibar tính tiền.", "This room has no chargeable minibar."),
    ("checkout.minibar.all_full", "Không dùng gì – tủ đủ", "Nothing used – fully stocked"),
    ("checkout.extras.laundry", "Giặt ủi", "Laundry"),
    ("checkout.extras.food", "Đồ ăn gọi thêm", "Extra food"),
    ("checkout.extras.damage", "Hư hỏng, mất đồ", "Damage or missing items"),
    ("checkout.extras.smoking", "Khử mùi thuốc lá (BR-511)", "Smoke odour treatment (BR-511)"),
    ("checkout.extras.card", "Thiếu thẻ phòng (BR-511)", "Missing key card (BR-511)"),
    ("checkout.departure_time", "Giờ trả phòng thực tế", "Actual check-out time"),
    ("checkout.late_toggle", "Khách trả muộn sau {std}", "Guest checks out late, after {std}"),
    ("checkout.late_none", "Trả đúng giờ – không phụ thu", "On time – no surcharge"),
    ("checkout.late_fee", "Phụ thu trả muộn: {amount} ({pct}% giá đêm cuối, BR-412)", "Late check-out surcharge: {amount} ({pct}% of last night, BR-412)"),
    ("checkout.summary.balance", "Còn phải thu", "Balance due"),
    ("bill.title", "Phiếu thanh toán", "Guest folio"),
    ("bill.no", "Số phiếu", "Folio no."),
    ("bill.night_line", "Tiền phòng đêm {date}", "Room, night of {date}"),
    ("bill.foc_line", "Miễn phí · {reason}", "Complimentary · {reason}", None, "HR-13: không in chữ FOC cho khách"),
    ("bill.total", "Tổng cộng", "Total"),
    ("bill.deposit", "Đã cọc / đã thu", "Deposit / paid"),
    ("bill.balance", "Còn phải thu", "Balance due"),
    ("bill.vat_note", "Giá đã gồm thuế GTGT", "Prices include VAT"),
    ("bill.paid_stamp", "ĐÃ THU ĐỦ", "PAID IN FULL"),
    ("pay.method", "Cách thanh toán", "Payment method"),
    ("pay.vietqr", "Chuyển khoản VietQR", "Bank transfer (VietQR)"),
    ("pay.card", "Thẻ (qua cổng thanh toán)", "Card (via payment gateway)"),
    ("pay.cash", "Tiền mặt", "Cash"),
    ("pay.ota", "Đã thu qua OTA", "Collected by OTA"),
    ("pay.split", "+ Thêm cách thanh toán khác", "+ Add another payment method"),
    ("pay.qr_note", "Nội dung chuyển khoản: {ref}", "Transfer reference: {ref}"),
    ("pay.qr_waiting", "Chờ khách chuyển khoản… Kiểm tra app ngân hàng của OTTIMO rồi bấm xác nhận.", "Waiting for the transfer… Check OTTIMO's bank app, then confirm.", None, "R2: chưa tự đối soát (PRD A8)"),
    ("pay.record", "Ghi nhận đã thu {amount}", "Record {amount} received"),
    ("pay.remaining", "Còn thiếu {amount}", "{amount} still due"),
    ("pay.error_not_received", "Chưa thấy tiền về? Đừng hoàn tất. Hỏi khách ảnh chụp giao dịch, hoặc chọn cách khác.", "Transfer not received? Don't complete yet. Ask the guest for a screenshot, or choose another method."),
    ("invoice.toggle", "Khách lấy hóa đơn GTGT ghi tên công ty", "Guest needs a VAT invoice in a company name"),
    ("invoice.company", "Tên công ty", "Company name"),
    ("invoice.tax_id", "Mã số thuế", "Tax ID"),
    ("invoice.tax_id_error", "Mã số thuế gồm 10 hoặc 13 chữ số.", "Tax ID must be 10 or 13 digits."),
    ("invoice.email", "Email nhận hóa đơn", "Invoice email"),
    ("invoice.pending", "Hóa đơn điện tử: chờ phát hành", "E-invoice: pending issue"),
    ("checkout.complete", "Hoàn tất trả phòng", "Complete check-out"),
    ("checkout.complete_confirm_title", "Hoàn tất trả phòng căn {room}?", "Complete check-out for room {room}?"),
    ("checkout.complete_confirm_body", "Đơn chuyển \"Đã trả phòng\", buồng chuyển \"Cần dọn\", mã cửa bị hủy, tạo việc dọn và bổ sung minibar. Không sửa folio sau bước này (chỉ ghi điều chỉnh).", "The booking becomes \"Checked out\", the room \"Needs cleaning\", the door code is revoked, and cleaning and minibar tasks are created. The folio can't be edited after this (adjustments only)."),
    ("checkout.blocked_balance", "Còn {amount} chưa ghi nhận thanh toán. Ghi nhận đủ trước khi hoàn tất (hoặc quản lý ghi công nợ).", "{amount} not yet recorded as paid. Record full payment before completing (or a manager records it as receivable).", None, "BR-426"),
    ("checkout.done", "Đã trả phòng. Bill đã lưu.", "Checked out. Folio saved."),
    ("checkout.send_bill", "Gửi bill cho khách", "Send folio to guest"),
    ("lt.settlement.title", "Quyết toán ký quỹ", "Deposit settlement"),
    ("lt.settlement.deposit", "Ký quỹ đang giữ", "Security deposit held"),
    ("lt.settlement.utilities", "Điện nước kỳ cuối ({from} – {to})", "Final utilities ({from} – {to})"),
    ("lt.settlement.deductions", "Khấu trừ", "Deductions"),
    ("lt.settlement.evidence", "Biên bản kiểm phòng có ảnh", "Room inspection report with photos"),
    ("lt.settlement.evidence_missing", "Chưa có biên bản kiểm phòng có ảnh – chưa được khấu trừ (BR-214).", "No inspection report with photos – deductions not allowed yet (BR-214)."),
    ("lt.settlement.refund", "Hoàn lại khách", "Refund to guest"),
    ("lt.settlement.collect", "Khách cần trả thêm", "Guest owes"),
    ("lt.settlement.refund_due", "Hoàn trong {days} ngày làm việc · cần quản lý duyệt", "Refund within {days} working days · manager approval needed"),
])

# ---------- Luồng 7 ----------
g("Luồng 7 – App khách (link/QR)", [
    ("guest.lang", "Ngôn ngữ", "Language", "Язык"),
    ("guest.lang.vi", "Tiếng Việt", "Tiếng Việt", "Tiếng Việt"),
    ("guest.lang.en", "English", "English", "English"),
    ("guest.lang.ru", "Русский", "Русский", "Русский"),
    ("guest.hello", "Xin chào, {name}", "Hello, {name}"),
    ("guest.stay.dates", "{from} → {to} · {nights} đêm", "{from} → {to} · {nights} nights"),
    ("guest.stay.room", "Căn {room} · {room_name}", "Room {room} · {room_name}"),
    ("guest.stay.checkin_time", "Nhận phòng từ {time}", "Check-in from {time}"),
    ("guest.stay.checkout_time", "Trả phòng trước {time}", "Check-out by {time}"),
    ("guest.cta.checkin", "Check-in online", "Online check-in"),
    ("guest.cta.checkin_help", "Gửi giấy tờ trước, nhận phòng tại quầy chỉ vài phút.", "Send your IDs in advance – check-in at the desk takes just minutes."),
    ("guest.tab.home", "Lưu trú", "My stay"),
    ("guest.tab.requests", "Yêu cầu", "Requests"),
    ("guest.tab.bill", "Hóa đơn", "Bill"),
    ("guest.tab.info", "Thông tin", "Info"),
    ("guest.wifi", "Wi-Fi", "Wi-Fi"),
    ("guest.door_code", "Mã cửa", "Door code"),
    ("guest.door_code_later", "Mã cửa hiện ở đây vào ngày nhận phòng ({date}).", "Your door code will appear here on arrival day ({date})."),
    ("guest.oci.step1", "Giấy tờ", "IDs"),
    ("guest.oci.step2", "Giờ đến", "Arrival time"),
    ("guest.oci.step3", "Xác nhận", "Confirm"),
    ("guest.oci.people", "Giấy tờ của {n} khách trong đơn", "IDs for the {n} guests on this booking"),
    ("guest.oci.add_doc", "Chụp trang thông tin hộ chiếu / CCCD", "Photograph your passport info page / ID card"),
    ("guest.oci.why", "Vì sao cần? Luật Việt Nam yêu cầu khách sạn khai báo lưu trú cho mọi khách.", "Why? Vietnamese law requires hotels to register every guest's stay."),
    ("guest.oci.consent", "Tôi đồng ý OTTIMO lưu ảnh giấy tờ của tôi đến {days} ngày sau khi trả phòng, sau đó tự xóa.", "I agree OTTIMO may keep photos of my ID until {days} days after check-out, then delete them automatically.", None, "Văn bản pháp lý – cần người dịch duyệt (HR-01)"),
    ("guest.oci.consent_optional", "Không bắt buộc. Nếu không đồng ý, chúng tôi chỉ dùng thông tin để khai báo và không lưu ảnh.", "Optional. If you don't agree, we only use the details for registration and don't keep the photos."),
    ("guest.oci.arrival", "Bạn dự kiến đến lúc nào?", "When do you expect to arrive?"),
    ("guest.oci.arrival_late", "Sau 22:00", "After 22:00"),
    ("guest.oci.note", "Ghi chú cho lễ tân", "Note for reception"),
    ("guest.oci.submit", "Gửi check-in", "Submit check-in"),
    ("guest.oci.done_title", "Xong! Hẹn gặp bạn ngày {date}", "All set! See you on {date}"),
    ("guest.oci.done_body", "Phòng sẵn sàng từ {time}. Mã cửa sẽ hiện trong trang này vào ngày bạn đến.", "Your room is ready from {time}. Your door code will appear on this page on arrival day."),
    ("guest.oci.upload_error", "Ảnh chưa rõ. Chụp lại nơi đủ sáng, không lóa, thấy đủ 4 góc.", "The photo isn't clear. Retake it in good light, without glare, showing all 4 corners."),
    ("guest.req.title", "Bạn cần gì?", "What do you need?"),
    ("guest.req.clean", "Dọn phòng thêm", "Extra cleaning"),
    ("guest.req.towels", "Khăn, đồ dùng", "Towels & amenities"),
    ("guest.req.repair", "Báo hỏng", "Report a problem"),
    ("guest.req.transport", "Đặt xe / tour", "Book a ride / tour"),
    ("guest.req.late", "Trả phòng muộn", "Late check-out"),
    ("guest.req.other", "Khác", "Something else"),
    ("guest.req.note", "Mô tả thêm (không bắt buộc)", "Add details (optional)"),
    ("guest.req.send", "Gửi yêu cầu", "Send request"),
    ("guest.req.fee_notice", "Dịch vụ này có phí {amount}. Phí sẽ vào hóa đơn của bạn.", "This service costs {amount}. It will be added to your bill."),
    ("guest.req.status.received", "Đã nhận", "Received"),
    ("guest.req.status.in_progress", "Đang xử lý", "In progress"),
    ("guest.req.status.done", "Đã xong", "Done"),
    ("guest.req.reply_time", "Lễ tân phản hồi trong khoảng {minutes} phút (07:00–22:00).", "Reception replies within about {minutes} minutes (07:00–22:00).", None, "BR-811"),
    ("guest.req.empty", "Bạn chưa gửi yêu cầu nào.", "You haven't sent any requests yet."),
    ("guest.req.sent", "Đã gửi. Chúng tôi sẽ cập nhật trạng thái tại đây.", "Sent. We'll update the status here."),
    ("guest.bill.title", "Hóa đơn tạm tính", "Current bill"),
    ("guest.bill.paid", "Đã thanh toán", "Paid"),
    ("guest.bill.due", "Còn phải trả", "Amount due"),
    ("guest.bill.empty", "Chưa có khoản phát sinh nào.", "No extra charges yet."),
    ("guest.bill.updated", "Cập nhật lúc {time}", "Updated at {time}"),
    ("guest.bill.utility_period", "Kỳ chốt {from} – {to}", "Billing period {from} – {to}"),
    ("guest.bill.meter", "Chỉ số {old} → {new} = {used} {unit}", "Meter {old} → {new} = {used} {unit}"),
    ("guest.bill.meter_photo", "Xem ảnh công tơ", "View meter photo"),
    ("guest.link_expired_title", "Liên kết đã hết hạn", "This link has expired", "Срок действия ссылки истёк"),
    ("guest.link_expired_body", "Liên kết này chỉ dùng trong thời gian lưu trú. Cần hóa đơn hay hỗ trợ? Nhắn OTTIMO qua Zalo/WhatsApp {phone}.", "This link only works during your stay. Need your bill or help? Message OTTIMO on Zalo/WhatsApp {phone}.", None, "SEC: link hết hạn khi trả phòng"),
    ("guest.error_title", "Không tải được trang", "Couldn't load this page", "Не удалось загрузить страницу"),
    ("guest.error_body", "Kiểm tra kết nối mạng rồi thử lại.", "Check your connection and try again.", "Проверьте подключение и попробуйте снова."),
])

# ---------- Mẫu tin nhắn (M13 – sao chép gửi) ----------
TEMPLATES = [
    ("msg.booking_confirmed", "Xác nhận đặt phòng",
     "Chào {name}, OTTIMO xác nhận đặt phòng {code}: căn {room}, {from} → {to} ({nights} đêm). Nhận phòng từ 14:00, trả phòng trước 12:00. Check-in online để nhận phòng nhanh: {link}",
     "Hi {name}, OTTIMO confirms booking {code}: room {room}, {from} → {to} ({nights} nights). Check-in from 14:00, check-out by 12:00. Check in online for a faster arrival: {link}",
     "Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: апартаменты {room}, {from} → {to} ({nights} ноч.). Заезд с 14:00, выезд до 12:00. Онлайн-регистрация для быстрого заселения: {link}"),
    ("msg.checkin_link", "Link check-in online",
     "Chào {name}, để nhận phòng nhanh, vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút).",
     "Hi {name}, to speed up your check-in, please send your IDs and arrival time here: {link} (about 2 minutes).",
     "Здравствуйте, {name}! Чтобы заселение прошло быстрее, отправьте, пожалуйста, документы и время прибытия по ссылке: {link} (около 2 минут)."),
    ("msg.checkout_reminder", "Nhắc trả phòng (20:00 hôm trước – BR-425)",
     "Chào {name}, ngày mai {date} là ngày trả phòng (trước 12:00). Bạn muốn ở thêm hoặc trả muộn? Trả lời tại: {link}",
     "Hi {name}, tomorrow {date} is your check-out day (by 12:00). Would you like to stay longer or check out late? Reply here: {link}",
     "Здравствуйте, {name}! Завтра, {date}, день выезда (до 12:00). Хотите продлить проживание или выехать позже? Ответьте здесь: {link}"),
    ("msg.bill", "Gửi bill",
     "Cảm ơn {name} đã lưu trú tại OTTIMO. Bill {bill_no}: {amount}. Xem chi tiết: {link}",
     "Thank you for staying at OTTIMO, {name}. Folio {bill_no}: {amount}. Details: {link}",
     "Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link}"),
    ("msg.utility_bill", "Hóa đơn điện nước tháng (dài hạn)",
     "Chào {name}, hóa đơn điện nước kỳ {period}: điện {kwh} kWh, nước {m3} m³, tổng {amount}, hạn thanh toán {due}. Ảnh công tơ và chi tiết: {link}",
     "Hi {name}, your utilities bill for {period}: electricity {kwh} kWh, water {m3} m³, total {amount}, due {due}. Meter photos and details: {link}",
     "Здравствуйте, {name}! Счёт за коммунальные услуги за {period}: электричество {kwh} кВт·ч, вода {m3} м³, итого {amount}, оплатить до {due}. Фото счётчиков и детали: {link}"),
    ("msg.house_rules_smoking", "Nhắc nội quy hút thuốc",
     "Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn!",
     "Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you!",
     "Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо!"),
    ("msg.hot_water_issue", "Báo đang xử lý sự cố nước nóng",
     "Chào {name}, OTTIMO đã nhận báo mất nước nóng căn {room}. Kỹ thuật sẽ có mặt trước {time}. Xin lỗi vì bất tiện!",
     "Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. Sorry for the inconvenience!",
     "Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства!"),
]

def build():
    vi, en, ru = {}, {}, {}
    for grp, k, a, b, c, n in S:
        vi[k] = a; en[k] = b
        if c: ru[k] = c
    for k, title, a, b, c in TEMPLATES:
        vi[k] = a; en[k] = b; ru[k] = c
    meta = {"_meta": {"source": "product/design/content-guide.md", "version": "0.1", "round": 1, "fallback": "en"}}
    for name, d in (("vi", vi), ("en", en), ("ru", ru)):
        with open(os.path.join(ROOT, f"copy/strings-{name}.json"), "w", encoding="utf-8") as f:
            out = dict(meta); out["_meta"] = dict(meta["_meta"], lang=name)
            if name == "ru":
                out["_meta"]["note"] = "Chỉ có chuỗi đã dịch (nháp, cần người bản ngữ duyệt). Thiếu key -> dùng EN. Đủ RU ở Round 3 (US-115)."
            out.update(d)
            json.dump(out, f, ensure_ascii=False, indent=2); f.write("\n")
    with open(os.path.join(ROOT, "wireframes/assets/strings.js"), "w", encoding="utf-8") as f:
        f.write("/* GENERATED from product/design/copy/strings-*.json – do not edit by hand */\n")
        f.write("window.OTTIMO_STRINGS=" + json.dumps({"vi": vi, "en": en, "ru": ru}, ensure_ascii=False) + ";\n")
    # markdown
    md = []
    cur = None
    for grp, k, a, b, c, n in S:
        if grp != cur:
            md.append(f"\n#### {grp}\n")
            md.append("| Key | Tiếng Việt | English | Русский (RU) | Ghi chú |")
            md.append("|---|---|---|---|---|")
            cur = grp
        esc = lambda s: (s or "").replace("|", "\\|")
        md.append(f"| `{k}` | {esc(a)} | {esc(b)} | {esc(c) if c else '⟨chừa chỗ⟩'} | {esc(n)} |")
    md.append("\n#### Mẫu tin nhắn (sao chép gửi – US-125, M13)\n")
    md.append("| Key | Tình huống | Tiếng Việt | English | Русский (nháp – cần người bản ngữ duyệt) |")
    md.append("|---|---|---|---|---|")
    for k, t, a, b, c in TEMPLATES:
        md.append(f"| `{k}` | {t} | {a} | {b} | {c} |")
    with open(os.path.join(HERE, "strings-tables.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print(len(S), "strings +", len(TEMPLATES), "templates")

if __name__ == "__main__":
    build()
