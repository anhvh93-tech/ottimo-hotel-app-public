# Đặc tả PO – Chấm công nhân viên qua Wi-Fi OTTIMO (v1.1)

- Tác giả: PO | Round 3 – bước **Sản xuất** (đặc tả cho v1.1) | Ngày: 26/10/2026
- Nguồn: `04-investor-feedback/FB-INV-006.md` (thiết kế 7 điểm INV chốt 26/10); `01-decisions/decision-log.md` dòng INV 26/10 "chốt tính năng chấm công qua Wi-Fi OTTIMO"; PRD 5.3 X3 (trước đây ngoài phạm vi – ESC-012); US-008, US-135, US-142, US-143, US-164; `architecture.md` mục 5 (app nhân viên là PWA ở `staff.<tên miền>`), ADR-005; `security/data-risk-assessment.md` (D27, L1).
- Đích phát hành: **v1.1** – làm **sau ngày chạy 02/11/2026**. Bản này **không làm mã**.
- Backlog: **EP20 – Chấm công qua Wi-Fi OTTIMO**, **US-165 … US-173** (`03-backlog/backlog.md` mục 3 và mục 4). Khi đặc tả này và backlog lệch nhau, **backlog thắng**: AC ở mục 4 dưới đây là bản chép ngày 26/10.
- Câu hỏi cho INV: **ESC-037** (4 câu, có phương án và đề xuất). Không câu nào chặn v1.0.
- Review cần có: BA, DOM (bắt buộc với PO); **SEC cần review** mục 7 (bắt buộc trước khi làm mã); ARC, UXD (khuyến nghị).
- Thương hiệu: màn hình trong app nhân viên và Desk theo brand guideline OTTIMO (Ivory/Cream/Stone Grey/Ink, Light Oak/Earth Brown, Sage; Lora cho tiêu đề, Be Vietnam Pro cho nội dung). Chữ cho nhân viên là tiếng Việt, câu ngắn, không emoji.

---

## 1. Tóm tắt

Nhân viên chấm **Vào ca / Ra ca trên điện thoại riêng** trong app nhân viên. Máy chủ chỉ nhận lệnh chấm khi:
1. lệnh đến từ **đúng điện thoại đã đăng ký** của người đó (passkey + khóa riêng của máy), có xác nhận Face ID, vân tay hoặc mã khóa màn hình ngay lúc chấm; và
2. IP công cộng của điện thoại **trùng IP của Wi-Fi OTTIMO** mà laptop quầy (điểm neo) vừa báo lên trong vài phút gần nhất.

Máy chỉ có mã khóa màn hình thì **bắt buộc chụp selfie**. Quên hoặc hỏng máy thì quản lý **chấm tay có lý do**. Desk có **lịch ca tối giản**, **bảng công ngày/tháng** và báo quản lý khi có người chấm ngoài lịch ca.

**Mục tiêu đo được** (DATA xác nhận cách đo sau 2 tuần chạy v1.1):

| Chỉ số | Mục tiêu |
|---|---|
| Lần chấm qua điện thoại / tổng lần chấm (không tính chấm tay) | ≥ 90 % |
| Lần bị từ chối vì "khác IP" khi nhân viên thật sự ở OTTIMO (nhân viên báo, quản lý xác nhận) | ≤ 5 % số lần chấm |
| Thời gian một lần chấm (bấm nút → thấy kết quả, Wi-Fi bình thường) | ≤ 15 giây, kể cả selfie |
| Bảng công tháng khớp tổng các ngày | Lệch 0 |

## 2. Phạm vi

**Trong v1.1**
- Đăng ký máy (passkey/WebAuthn, quản lý xác nhận tại chỗ, loại xác thực của máy), Vào ca/Ra ca, selfie bắt buộc khi máy không có sinh trắc.
- Điểm neo IP từ thiết bị được cấp (laptop quầy), nhịp khoảng 5 phút, cửa sổ hợp lệ, cảnh báo neo mất kết nối và IP lạ.
- Chấm tay của quản lý, đăng ký lại máy, gỡ máy, thu hồi khi khóa tài khoản.
- **Lịch ca tối giản** (ca mẫu + gán theo tuần) – cần để đối chiếu, vì Desk **chưa có lịch ca** (PRD X3 trước đây ngoài phạm vi).
- Bảng công ngày/tháng, báo ngoài lịch ca, "Bảng công của tôi".
- Thông báo dữ liệu cho nhân viên, quyền xem ảnh/IP/số điện thoại, nhật ký xem ảnh, tự xóa ảnh và IP theo hạn.
- Xuất bảng công ra Excel: **chờ INV** (ESC-037 câu 4).

**Ngoài phạm vi (giữ nguyên PRD X2, X3 phần còn lại)**
- Tính lương, tăng ca, phép năm, trừ tiền khi đi muộn. App chỉ ghi nhận và đếm.
- Nhận diện khuôn mặt hay so ảnh tự động. Ảnh selfie chỉ để quản lý xem bằng mắt.
- Định vị GPS, mã QR, máy chấm công vân tay, chấm công trên laptop quầy.
- Xác minh bằng số điện thoại hoặc SIM (INV chốt điểm 4).
- Nhân viên tự gửi "đề nghị chấm bổ sung" trong app (v1.1 nhân viên báo quản lý qua kênh nội bộ; xét lại ở v1.2 nếu chấm tay nhiều).
- Nhiều ca một người một ngày, đổi ca giữa nhân viên với nhau (v1.2 nếu cần).
- CTV (`collaborator`) không chấm công (không thuộc biên chế).

## 3. Luồng chính

### 3.1 Đăng ký máy (một lần, tại OTTIMO, có quản lý)
1. Nhân viên đăng nhập app nhân viên trên điện thoại của mình, mở **Chấm công**, đọc thông báo dữ liệu, bấm "Tôi đã đọc".
2. App kiểm máy có khóa màn hình và hỗ trợ passkey. Không có → hướng dẫn đặt khóa màn hình, dừng.
3. Quản lý (MGR+, không phải chính người đó) nhìn tận mắt điện thoại, chọn loại xác thực của máy: **"Có Face ID/vân tay đang bật"** hoặc **"Chỉ mã khóa màn hình"**, lấy **mã đăng ký** dùng một lần.
4. Nhân viên nhập mã, xác thực bằng Face ID/vân tay/mã khóa. Máy tạo passkey và một khóa riêng của máy. Máy chủ chỉ lưu khóa công khai.

> Vì sao quản lý phải chọn loại xác thực: chuẩn passkey **không cho máy chủ biết** người dùng đã mở bằng sinh trắc hay bằng mã khóa – máy chủ chỉ biết "đã xác minh người dùng". Muốn bắt buộc selfie cho máy chỉ có mã khóa thì loại máy phải do quản lý xác nhận lúc đăng ký.

### 3.2 Vào ca / Ra ca (mỗi ngày)
1. Nhân viên nối Wi-Fi OTTIMO, mở app, bấm **Vào ca** (hoặc **Ra ca**).
2. Face ID / vân tay / mã khóa → (máy chỉ có mã khóa: chụp selfie bằng camera trước).
3. Máy chủ kiểm: đúng máy đã đăng ký, thử thách dùng một lần còn hạn, IP trùng IP neo trong cửa sổ hợp lệ → ghi **giờ máy chủ**.
4. App hiện kết quả: "Đã vào ca 06:58 · Ca sáng 07:00–15:00 · Đúng giờ".

### 3.3 Điểm neo IP (tự động)
- OWN bật cờ **"Điểm neo Wi-Fi"** cho laptop quầy trong danh sách thiết bị được cấp (US-142).
- Laptop gửi nhịp khoảng mỗi 5 phút, kể cả khi không ai đăng nhập Desk. Máy chủ ghi IP **nó thấy từ kết nối** (không tin IP do máy gửi lên).
- IP neo hợp lệ trong 10 phút (đề xuất) kể từ nhịp cuối. Nhà mạng đổi IP thì nhịp kế tiếp mang IP mới.
- Không cần IP tĩnh, không in QR. Laptop quầy **không** dùng để chấm công.

### 3.4 Ngoại lệ

| Tình huống | Cách xử lý | Story |
|---|---|---|
| Quên, hỏng, hết pin điện thoại | Quản lý chấm tay, chọn lý do, nhân viên nhận thông báo | US-168 |
| Đổi hoặc mất điện thoại | Quản lý "Đăng ký lại máy": thu hồi máy cũ, đăng ký máy mới | US-169 |
| Nghỉ việc | Khóa tài khoản → thu hồi máy, gỡ khỏi lịch ca | US-169 |
| Laptop quầy tắt, ngủ, mất mạng | Chấm bị từ chối "điểm chấm công mất kết nối"; OWN/MGR nhận báo sau 30 phút; quản lý chấm tay | US-166, US-167, US-168 |
| Điện thoại đang dùng 4G, VPN, Chuyển tiếp bảo mật iCloud | Từ chối, hướng dẫn chuyển Wi-Fi OTTIMO/tắt VPN, thử lại | US-166 |
| Quên Ra ca | Sau giờ kết thúc ca + 2 giờ: ghi "Thiếu ra ca", quản lý sửa | US-166, US-168 |

## 4. User story và tiêu chí nghiệm thu

Quy ước như backlog mục 4: Given/When/Then; mỗi AC ít nhất một ca kiểm thử; "bị từ chối" = máy chủ từ chối và ghi nhật ký. Con số là **tham số đề xuất** (mục 6) – DOM gán mã BR, AC đổi theo tham số. Giờ tính theo Asia/Ho_Chi_Minh, kiểm mốc bằng đồng hồ giả (ADR-008).

**Vai chấm công:** tài khoản có cờ **"Chấm công"** do MGR+ bật. Mặc định bật cho `front_desk`, `front_desk_lead`, `housekeeping`, `maintenance`, `sales_staff`, `manager`; tắt cho `owner`; không có cho `collaborator`.

| ID | User story | MoSCoW (trong v1.1) |
|---|---|---|
| US-165 | Là **nhân viên OTTIMO** (tài khoản bật "Chấm công"), tôi muốn đăng ký đúng **một** điện thoại của mình (passkey: Face ID, vân tay hoặc mã khóa màn hình) có quản lý xác nhận tại chỗ, để chỉ tôi chấm công được cho tôi | Must |
| US-166 | Là **nhân viên OTTIMO**, tôi muốn bấm Vào ca / Ra ca trên điện thoại của mình khi đang ở Wi-Fi OTTIMO, để giờ làm được ghi đúng mà không cần máy chấm công hay mã QR | Must |
| US-167 | Là **chủ đầu tư** (`owner`), tôi muốn laptop quầy tự báo IP Wi-Fi OTTIMO lên máy chủ (điểm neo) và tôi được báo khi neo mất kết nối hoặc đổi sang IP lạ, để chấm công chỉ nhận ở OTTIMO mà không cần IP tĩnh | Must |
| US-168 | Là **quản lý** (`manager`, `owner`), tôi muốn chấm tay hoặc sửa giờ cho nhân viên quên/hỏng máy với lý do bắt buộc và dấu vết đầy đủ, để bảng công đủ mà không mở cửa cho chấm khống | Must |
| US-169 | Là **quản lý** (`manager`, `owner`), tôi muốn đăng ký lại máy khi nhân viên đổi điện thoại và thu hồi máy ngay khi khóa tài khoản người nghỉ việc, để không ai chấm được bằng máy cũ hay tài khoản cũ | Must |
| US-170 | Là **quản lý** (`manager`), tôi muốn tạo ca mẫu và gán ca theo tuần cho từng nhân viên, để máy so giờ chấm với lịch ca | Must |
| US-171 | Là **quản lý / chủ đầu tư** (`manager`, `owner`), tôi muốn xem bảng công ngày và tháng (vào, ra, muộn, sớm, vắng, ngoài lịch ca) và được báo khi có người chấm ngoài lịch ca; nhân viên xem được bảng công của chính mình, để quản lý giờ làm minh bạch | Must |
| US-172 | Là **nhân viên OTTIMO** và **chủ đầu tư**, tôi muốn dữ liệu chấm công (giờ, IP, ảnh selfie) được thông báo trước, chỉ đúng người được xem, có nhật ký xem ảnh và tự xóa theo hạn, để OTTIMO giữ đúng luật dữ liệu cá nhân với người lao động | Must |
| US-173 | Là **chủ đầu tư** (`owner`), tôi muốn xuất bảng công tháng ra Excel cho kế toán, để tính lương không phải chép tay | Should – chờ ESC-037 câu 4 |

<!-- AC-BEGIN: khối dưới đây được chép nguyên vào backlog mục 4 -->
### EP20 – Chấm công qua Wi-Fi OTTIMO (v1.1 – FB-INV-006)

> Chung cho EP20: MoSCoW xét **trong bản v1.1**, không phải bản RC v1.0. Con số trong AC là **tham số đề xuất** (`attendance_*`, đặc tả `rounds/round-03/outputs/PO/attendance-v1.1.md` mục 6) – DOM gán mã BR, QA kiểm theo giá trị mặc định. Câu chờ INV: ESC-037. SEC review bắt buộc trước khi làm mã.

#### US-165 – Đăng ký điện thoại chấm công – *Must v1.1*
- AC1 *(thông báo trước)*: Given nhân viên có tài khoản bật "Chấm công" mở mục Chấm công lần đầu trên app nhân viên, Then app hiện thông báo dữ liệu chấm công (US-172 AC1) và chỉ cho đăng ký máy sau khi bấm "Tôi đã đọc"; máy chủ lưu phiên bản thông báo và thời điểm đọc; gọi API đăng ký khi chưa đọc → 409 `ATTENDANCE_NOTICE_REQUIRED`.
- AC2 *(máy chưa đặt khóa màn hình)*: Given điện thoại không đặt khóa màn hình, When nhân viên bấm "Đăng ký máy này", Then app không tạo passkey, hiện hướng dẫn "Đặt mã khóa màn hình cho điện thoại rồi thử lại" kèm cách làm cho iPhone và Android; máy chủ không lưu gì. Kiểm trên một máy Android không đặt khóa.
- AC3 *(quản lý xác nhận tại chỗ)*: Given nhân viên chưa có máy đang hoạt động, When MGR+ mở "Đăng ký máy chấm công" cho nhân viên đó trên phiên của mình, chọn loại xác thực của máy sau khi xem tận mắt ("Có Face ID/vân tay đang bật" hoặc "Chỉ mã khóa màn hình") và lấy mã đăng ký, Then mã dùng một lần, chỉ cho đúng nhân viên đó, hết hạn sau `attendance_registration_code_minutes` (10 phút); mã hết hạn hoặc dùng lần hai bị từ chối; MGR lấy mã cho chính mình → 403 (OWN hoặc MGR khác làm).
- AC4 *(tạo passkey và khóa máy)*: Given mã hợp lệ và điện thoại đang ở Wi-Fi OTTIMO (cùng phép kiểm IP của US-166 AC3), When nhân viên nhập mã và xác thực bằng Face ID, vân tay hoặc mã khóa, Then máy chủ lưu khóa công khai của passkey có cờ "đã xác minh người dùng" và khóa công khai của một **khóa riêng của máy không đồng bộ** qua iCloud/Google (ARC chọn cách làm), tên máy app đọc được, loại xác thực quản lý đã chọn, người xác nhận, thời điểm; audit `security` `attendance.device_registered`. Máy chủ không nhận, không lưu vân tay, khuôn mặt hay mã khóa màn hình.
- AC5 *(một người – một máy)*: Given nhân viên A đã có máy đang hoạt động, When đăng ký thêm máy khác, Then 409 `ATTENDANCE_DEVICE_EXISTS` (phải qua US-169 "Đăng ký lại máy"); Given passkey hoặc khóa máy đang gắn với A, When dùng để đăng ký hoặc chấm cho tài khoản B, Then bị từ chối, audit `security`.
- AC6 *(passkey đồng bộ sang máy khác không chấm được)*: Given passkey của A đã đồng bộ hoặc được chia sẻ sang máy thứ hai (iCloud Keychain, Trình quản lý mật khẩu Google, chia sẻ mật khẩu nhóm), When chấm từ máy thứ hai, Then bị từ chối `ATTENDANCE_DEVICE_UNKNOWN` vì thiếu khóa riêng của máy đã đăng ký, audit `security`, MGR nhận thông báo. QA kiểm bằng hai iPhone cùng Apple ID.
- AC7 *(máy không hỗ trợ passkey)*: Given trình duyệt hoặc hệ điều hành không hỗ trợ passkey, Then app báo "Điện thoại này chưa dùng được để chấm công – báo quản lý"; nhân viên được chấm tay (US-168) tới khi đổi máy. Danh sách máy tối thiểu do ARC + QA chốt (đề xuất iOS 16 trở lên, Android 9 trở lên với Chrome bản mới).

#### US-166 – Vào ca / Ra ca trên điện thoại riêng – *Must v1.1*
- AC1 *(màn chấm công)*: Given nhân viên có máy đang hoạt động mở app nhân viên, Then màn Chấm công hiện ca hôm nay theo lịch (US-170) hoặc "Hôm nay không có ca", trạng thái hiện tại và đúng một nút chính: "Vào ca" khi chưa vào hoặc đã ra, "Ra ca" khi đang trong ca.
- AC2 *(xác thực mỗi lần)*: When bấm "Vào ca" hoặc "Ra ca", Then app yêu cầu passkey cho một thử thách máy chủ cấp, dùng một lần, hết hạn sau `attendance_challenge_seconds` (120 giây), kèm chữ ký của khóa riêng của máy; thiếu hoặc sai một trong hai, cờ "đã xác minh người dùng" không bật, hoặc thử thách đã dùng/hết hạn → bị từ chối, không ghi giờ.
- AC3 *(Wi-Fi OTTIMO)*: Given IP công cộng máy chủ thấy ở lệnh chấm – lấy từ kết nối qua proxy tin cậy, không lấy từ dữ liệu app gửi – trùng một IP neo nhận trong `attendance_anchor_valid_minutes` (10 phút) gần nhất (US-167), Then ghi lệnh chấm với **giờ máy chủ**. Kiểm cả trường hợp điện thoại đi IPv6 còn laptop neo đi IPv4 trên cùng Wi-Fi: vẫn được nhận (ARC chọn cách khớp).
- AC4 *(từ chối khi khác IP)*: Given IP không trùng IP neo nào trong cửa sổ (4G, Wi-Fi nhà, VPN, Chuyển tiếp bảo mật iCloud), Then không ghi giờ, trả `ATTENDANCE_NOT_ON_OTTIMO_WIFI`, app hiện "Chưa nhận ra Wi-Fi OTTIMO. Kết nối Wi-Fi OTTIMO, tắt VPN hoặc Chuyển tiếp bảo mật iCloud rồi thử lại." và nút "Thử lại"; lần bị từ chối ghi audit `security` (người, máy, IP, giờ) và hiện ở bảng công ngày cho MGR+ (US-171 AC1). Kiểm: máy đi 4G bị từ chối; cùng máy chuyển sang Wi-Fi OTTIMO được nhận.
- AC5 *(điểm neo mất kết nối)*: Given không có IP neo nào trong cửa sổ (laptop quầy tắt, ngủ, mất mạng), Then bị từ chối `ATTENDANCE_ANCHOR_OFFLINE`, app hiện "Điểm chấm công đang mất kết nối – báo quản lý chấm tay"; không ghi giờ; quản lý được báo theo US-167 AC4.
- AC6 *(selfie bắt buộc)*: Given máy đăng ký loại "Chỉ mã khóa màn hình", hoặc OWN bật `attendance_selfie_for_biometric` (mặc định tắt – chờ ESC-037 câu 3), When chấm, Then app mở camera trước để chụp trực tiếp (không chọn ảnh có sẵn) và gửi ảnh cùng lệnh chấm; thiếu ảnh hoặc tải ảnh lỗi → cả lệnh thất bại, không ghi giờ, thử lại được. Máy loại "Có Face ID/vân tay" khi công tắc tắt → không hỏi selfie.
- AC7 *(kết quả)*: Given chấm thành công, Then app hiện giờ máy chủ, ca và nhãn "Đúng giờ" / "Muộn x phút" / "Về sớm y phút" / "Ngoài lịch ca – đã báo quản lý" theo định nghĩa US-171 AC2; giờ trên điện thoại không ảnh hưởng giờ ghi.
- AC8 *(không ghi trùng)*: Given đã "Vào ca" và chưa "Ra ca", When lệnh "Vào ca" gửi lại (bấm hai lần, mạng chập chờn), Then máy chủ trả kết quả của lần đầu, không tạo bản ghi thứ hai.
- AC9 *(quên ra ca)*: Given đã vào ca, quá giờ kết thúc ca + `attendance_missing_out_after_minutes` (120 phút) chưa ra ca, Then ca đó ghi "Thiếu ra ca" (chỉ quản lý sửa – US-168); lần bấm kế tiếp của nhân viên là "Vào ca" cho ca mới. Kiểm bằng đồng hồ giả ngay trước/ngay sau mốc.
- AC10 *(cần mạng)*: Given điện thoại mất mạng, Then app báo "Cần kết nối Wi-Fi OTTIMO để chấm công" và không xếp lệnh chờ gửi sau (khác thao tác buồng phòng offline – ADR-005).

#### US-167 – Điểm neo IP từ laptop quầy – *Must v1.1*
- AC1 *(chọn thiết bị neo)*: Given OWN mở danh sách thiết bị được cấp (US-142), When bật "Điểm neo Wi-Fi" cho một thiết bị, tối đa `attendance_anchor_max_devices` (2) thiết bị, Then chỉ thiết bị có cờ này gửi được nhịp neo; nhịp từ thiết bị khác, thiết bị đã thu hồi hoặc không có khóa thiết bị → 403 và audit `security`. MGR và các vai khác không bật/tắt được cờ.
- AC2 *(nhịp neo)*: Given laptop neo bật và trang Desk mở, Then nhịp neo gửi khoảng mỗi `attendance_anchor_heartbeat_minutes` (5 phút), kể cả khi không ai đăng nhập hoặc lễ tân đăng xuất, đổi người; máy chủ lưu IP thấy từ kết nối (IPv4, và IPv6 nếu có) cùng giờ nhận. Kiểm: đăng xuất Desk 15 phút vẫn nhận ít nhất 2 nhịp.
- AC3 *(cửa sổ hợp lệ)*: Given nhịp cuối của một IP nhận lúc T, Then IP đó hợp lệ cho chấm công tới T + `attendance_anchor_valid_minutes` (10 phút); kiểm bằng đồng hồ giả ngay trước/ngay sau mốc. Nhà mạng đổi IP: IP mới hợp lệ từ nhịp đầu tiên mang IP đó; IP cũ hết hạn theo cửa sổ.
- AC4 *(neo mất kết nối)*: Given không nhận nhịp nào trong `attendance_anchor_silent_alert_minutes` (30 phút), Then OWN và MGR nhận một thông báo trong app "Điểm chấm công mất kết nối" cho mỗi lần mất, và một thông báo khi có lại.
- AC5 *(IP lạ)*: Given nhịp neo mang IP chưa thấy trong `attendance_anchor_known_ip_days` (30 ngày), Then OWN nhận thông báo "IP Wi-Fi OTTIMO đổi" kèm giờ và thiết bị; chấm công vẫn chạy. OWN tắt cờ neo nếu laptop bị mang ra khỏi OTTIMO.
- AC6 *(laptop không chấm công)*: Given thiết bị là điểm neo hoặc thiết bị được cấp, Then trên đó không có nút Vào ca/Ra ca và máy chủ từ chối lệnh chấm không đến từ máy đã đăng ký theo US-165.

#### US-168 – Quản lý chấm tay có lý do – *Must v1.1*
- AC1 *(chấm tay)*: Given MGR+ mở bảng công ngày, When chọn nhân viên và ca rồi nhập giờ vào và/hoặc giờ ra, Then bắt buộc chọn lý do (Quên/không mang điện thoại · Điện thoại hỏng, hết pin · Điểm chấm công mất kết nối · Quên bấm · Khác) và ghi chú (bắt buộc khi chọn "Khác"); giờ nhập không được sau giờ hiện tại; bản ghi gắn nhãn "Chấm tay" kèm người chấm và thời điểm thao tác.
- AC2 *(không tự chấm cho mình)*: Given MGR chấm tay hoặc sửa giờ của chính mình, Then 403; OWN hoặc MGR khác làm. OWN là vai duy nhất tự chấm cho mình được, nhật ký ghi rõ "OWN tự chấm".
- AC3 *(sửa có dấu vết)*: Given sửa giờ của một bản ghi đã có (chấm trên điện thoại hoặc chấm tay), Then giá trị cũ giữ trong audit `attendance` (cũ/mới, người sửa, lý do, thời điểm); bảng công hiện giờ mới kèm nhãn "Đã sửa"; không xóa cứng bản ghi nào.
- AC4 *(hạn sửa)*: Given ngày ca cũ hơn `attendance_manual_max_days_back` (7 ngày), Then MGR bị từ chối, chỉ OWN chấm tay hoặc sửa được.
- AC5 *(báo nhân viên)*: Given chấm tay hoặc sửa, Then nhân viên nhận thông báo trong app "Quản lý đã ghi giờ vào/ra ca ngày … cho bạn – lý do …" và thấy dòng đó trong "Bảng công của tôi".
- AC6 *(kiểm soát)*: Given OWN mở bảng công tháng, Then thấy số lần chấm tay theo từng nhân viên và theo từng người chấm; bấm vào số ra danh sách chi tiết.

#### US-169 – Đăng ký lại máy, gỡ máy, khóa khi nghỉ việc – *Must v1.1*
- AC1 *(đổi máy)*: Given nhân viên đổi hoặc mất điện thoại, When MGR+ bấm "Đăng ký lại máy" cho nhân viên đó và xác nhận (US-135), Then máy cũ bị thu hồi ngay – mọi lệnh chấm từ máy cũ → `ATTENDANCE_DEVICE_REVOKED` – rồi đăng ký máy mới theo US-165 AC3–AC4; audit `security` ghi người làm và lý do.
- AC2 *(nhân viên tự gỡ)*: Given nhân viên muốn gỡ máy của mình (bán, cho máy), When bấm "Gỡ máy này" và xác thực passkey, Then máy bị thu hồi; đăng ký máy mới vẫn cần quản lý (US-165 AC3).
- AC3 *(nghỉ việc)*: Given OWN/MGR khóa tài khoản nhân viên (US-008), Then trong cùng thao tác: máy và passkey bị thu hồi, cờ "Chấm công" tắt, các ca đã gán từ ngày khóa trở đi bị gỡ khỏi lịch và MGR được báo; mọi lệnh chấm sau đó bị từ chối. Bảng công cũ giữ theo hạn lưu (US-172 AC5). Mở lại tài khoản → phải đăng ký máy mới.
- AC4 *(xem máy)*: Given MGR+ mở hồ sơ nhân viên, Then thấy máy đang hoạt động (tên máy, loại xác thực, ngày đăng ký, người xác nhận, lần chấm gần nhất) và lịch sử máy đã thu hồi.

#### US-170 – Lịch ca tối giản – *Must v1.1*
- AC1 *(ca mẫu)*: Given MGR+ mở "Ca mẫu", Then tạo hoặc sửa ca gồm tên, giờ bắt đầu, giờ kết thúc (ca qua nửa đêm được khi giờ kết thúc nhỏ hơn giờ bắt đầu); giá trị khởi tạo theo ESC-037 câu 1. Sửa giờ ca mẫu chỉ áp cho ngày chưa tới; ngày đã qua giữ giờ ca lúc gán.
- AC2 *(gán theo tuần)*: Given lưới nhân viên bật "Chấm công" × 7 ngày, When MGR+ chọn ca mẫu hoặc "Nghỉ" cho từng ô, Then lưu; nút "Chép tuần trước" chép lịch tuần trước sang tuần đang xem, không ghi đè ô đã có trừ khi người dùng xác nhận; v1.1 tối đa một ca mỗi người mỗi ngày.
- AC3 *(ngày của ca qua đêm)*: Given ca 22:00–07:00 gán ngày 20/10, When nhân viên vào 21:55 ngày 20/10 và ra 07:02 ngày 21/10, Then đây là một ca của ngày 20/10 (ngày ca = ngày bắt đầu ca theo lịch; chấm công không dùng mốc đổi ngày nghiệp vụ 06:00 của BR-010).
- AC4 *(nhân viên xem)*: Given nhân viên mở app nhân viên, Then thấy lịch ca của mình tuần này và tuần sau; lịch của một ngày trong 48 giờ tới bị đổi → nhân viên nhận thông báo trong app.
- AC5 *(quyền)*: Given FD, HK, MT, SAL, Then chỉ xem lịch của mình; FDL xem lịch mọi người nhưng không sửa; MGR+ sửa; mọi thay đổi lịch ghi audit; vai không được phép gọi API sửa → 403 và ghi nhật ký.

#### US-171 – Bảng công ngày/tháng và báo ngoài lịch ca – *Must v1.1*
- AC1 *(bảng ngày)*: Given MGR+ chọn một ngày, Then mỗi nhân viên có ca hoặc có lần chấm trong ngày có một dòng: ca (giờ), giờ vào, giờ ra, trạng thái (Đúng giờ · Muộn · Về sớm · Thiếu ra ca · Vắng · Ngoài lịch ca · Chưa tới ca), phút muộn, phút về sớm, cách ghi (Điện thoại · Chấm tay · Đã sửa), có ảnh hay không (chỉ MGR+ mở ảnh), số lần bị từ chối.
- AC2 *(định nghĩa trạng thái)*: Then **Muộn** = giờ vào sau giờ bắt đầu ca + `attendance_late_grace_minutes` (chờ ESC-037 câu 2, đề xuất 5 phút), số phút muộn tính từ giờ bắt đầu ca; **Về sớm** = giờ ra trước giờ kết thúc ca − `attendance_early_leave_grace_minutes` (5 phút), số phút tính tới giờ kết thúc ca; **Vắng** = có ca, tới giờ kết thúc ca chưa có giờ vào; **Ngoài lịch ca** = chấm vào ngày không có ca, hoặc vào sớm hơn giờ bắt đầu ca quá `attendance_offshift_window_minutes` (60 phút), hoặc ra muộn hơn giờ kết thúc ca quá cùng mức. Ví dụ ca 07:00–15:00, ngưỡng 5: vào 07:05 → Đúng giờ; vào 07:06 → Muộn 6 phút; ra 14:55 → Đúng giờ; ra 14:54 → Về sớm 6 phút; vào 05:59 → Ngoài lịch ca; vào 06:00 → Đúng giờ. DOM ghi BR và bảng ví dụ; QA kiểm ngay trước/ngay sau từng mốc.
- AC3 *(bảng tháng)*: Given MGR+ chọn tháng, Then mỗi nhân viên một dòng: số ca theo lịch, số ca có mặt, vắng, số lần muộn và tổng phút muộn, số lần về sớm và tổng phút, thiếu ra ca, chấm tay, ngoài lịch ca, tổng giờ có mặt (ra − vào, chỉ ca có đủ giờ vào và giờ ra); bấm vào số ra danh sách ngày. Tổng tháng bằng tổng các dòng bảng ngày cùng kỳ (QA đối chiếu, lệch 0).
- AC4 *(báo ngoài lịch ca)*: Given một lệnh chấm thành công mang trạng thái "Ngoài lịch ca", Then MGR (và OWN nếu bật nhận) nhận thông báo trong app trong vòng 1 phút: tên nhân viên, giờ, Vào hay Ra – không ảnh, không IP.
- AC5 *(bảng công của tôi)*: Given nhân viên mở "Bảng công của tôi", Then thấy các cột của AC1 và AC3 cho chính mình, kể cả ảnh của mình; không thấy người khác; API hỏi dữ liệu nhân viên khác → 403 và ghi nhật ký.
- AC6 *(lễ tân trưởng)*: Given FDL mở "Hôm nay" trên Desk, Then thấy ai đang trong ca (tên, ca, đã vào hay chưa) – không có bảng tháng, ảnh, IP hay số điện thoại.

#### US-172 – Bảo vệ dữ liệu chấm công của nhân viên – *Must v1.1*
- AC1 *(thông báo cho nhân viên)*: Given tài khoản vừa bật "Chấm công", Then nhân viên nhận thông báo dữ liệu chấm công (chữ ở đặc tả PO mục 7.4, SEC duyệt, có phiên bản) và xem lại được mọi lúc trong app; thông báo đổi phiên bản → nhân viên phải đọc lại trước lần chấm kế tiếp.
- AC2 *(quyền xem)*: Then máy chủ áp đúng ma trận quyền của đặc tả PO mục 5: ảnh selfie – chính nhân viên, MGR, OWN; IP gốc – chỉ OWN (MGR thấy "Wi-Fi OTTIMO: khớp/không khớp"); số điện thoại nhân viên – chỉ OWN, MGR; FDL, FD, HK, MT, SAL, CTV gọi API dữ liệu chấm công của người khác → 403 và ghi nhật ký lần bị từ chối.
- AC3 *(nhật ký xem ảnh)*: Given MGR hoặc OWN mở ảnh selfie của người khác, Then ghi audit `privacy` (người xem, ảnh của ai, ngày ca, thời điểm); ảnh mở qua đường dẫn hết hạn sau tối đa 5 phút, không có nút tải, không có trong bản xuất; OWN xem được nhật ký này.
- AC4 *(tự xóa ảnh)*: Given ảnh selfie đã lưu đủ `attendance_selfie_retention_days` (30 ngày kể từ lúc chụp), Then job hằng ngày xóa hẳn tệp ảnh (kể cả bản sao trong kho tệp và bản sao lưu theo chu kỳ của OPS), bản ghi chấm công giữ dòng "Ảnh đã xóa theo hạn"; kiểm bằng đồng hồ giả ở ngày thứ 30 và 31.
- AC5 *(hạn lưu khác)*: Then IP gốc của lần chấm và lần bị từ chối bị xóa sau `attendance_ip_retention_days` (90 ngày), chỉ giữ kết quả khớp/không khớp; khóa công khai của máy đã thu hồi bị xóa sau 30 ngày kể từ khi thu hồi; giờ vào/ra và bảng công giữ theo hạn chứng từ lao động – tiền lương `[GIẢ ĐỊNH – chờ kế toán/luật sư xác nhận]`, chưa tự xóa ở v1.1.
- AC6 *(không sinh trắc)*: Then máy chủ không nhận, không lưu mẫu vân tay, khuôn mặt hay mã khóa màn hình; v1.1 không chạy nhận diện khuôn mặt hay so ảnh tự động; SEC kiểm hợp đồng API và mã khi review.

#### US-173 – Xuất bảng công ra Excel – *Should v1.1, chờ ESC-037 câu 4*
- AC1 *(tệp xuất)*: Given OWN chọn tháng và bấm "Xuất bảng công", Then tải về tệp .xlsx gồm trang "Tổng tháng" (cột của US-171 AC3) và trang "Chi tiết ngày" (cột của US-171 AC1, bỏ ảnh và số lần bị từ chối); số khớp màn hình (lệch 0); không có ảnh, IP hay số điện thoại.
- AC2 *(quyền, nhật ký)*: Then chỉ OWN xuất được (như A105); mỗi lần xuất ghi audit `export` (người, tháng, thời điểm) như US-104; vai khác gọi API → 403 và ghi nhật ký.
<!-- AC-END -->

## 5. Phân quyền (đề xuất – BA đưa vào `rbac-matrix.md`, SEC duyệt)

| Dữ liệu / hành động | Nhân viên (của mình) | FDL | FD, HK, MT, SAL | MGR | OWN |
|---|---|---|---|---|---|
| Chấm Vào ca / Ra ca | ✔ (trên máy đã đăng ký) | ✔ của mình | ✔ của mình | ✔ của mình | – (cờ tắt mặc định) |
| Lịch ca của mình | ✔ xem | ✔ | ✔ | ✔ | ✔ |
| Lịch ca mọi người | – | xem | ✖ | xem, sửa | xem, sửa |
| Ai đang trong ca hôm nay | – | ✔ | ✖ | ✔ | ✔ |
| Bảng công ngày/tháng mọi người | – | ✖ | ✖ | ✔ | ✔ |
| Ảnh selfie | ✔ ảnh của mình | ✖ | ✖ | ✔ (ghi nhật ký) | ✔ (ghi nhật ký) |
| IP gốc | ✖ (chỉ thấy "khớp") | ✖ | ✖ | ✖ (thấy khớp/không khớp) | ✔ (ghi nhật ký) |
| Số điện thoại nhân viên | ✔ của mình | ✖ | ✖ | ✔ | ✔ |
| Thiết bị đã đăng ký | ✔ của mình, gỡ được | ✖ | ✖ | ✔, đăng ký lại | ✔, đăng ký lại |
| Lấy mã đăng ký máy | ✖ | ✖ | ✖ | ✔ cho người khác | ✔ |
| Chấm tay / sửa giờ | ✖ | ✖ | ✖ | ✔ người khác, ≤ 7 ngày | ✔ |
| Bật cờ "Điểm neo Wi-Fi" | ✖ | ✖ | ✖ | ✖ | ✔ |
| Bật selfie cho máy có sinh trắc | ✖ | ✖ | ✖ | ✖ | ✔ |
| Xuất Excel (nếu INV chọn) | ✖ | ✖ | ✖ | ✖ | ✔ |

Một người nhiều vai: quyền là hợp các vai (rbac mục 1). Mọi lần bị từ chối do máy chủ ghi nhật ký (rbac mục 8). BA đánh mã hành động mới A120 trở đi.

## 6. Tham số đề xuất (DOM gán mã BR, đưa vào `business-rules.md` mục 13)

| Khóa | Mặc định đề xuất | Ai sửa | Ghi chú |
|---|---|---|---|
| `attendance_anchor_heartbeat_minutes` | 5 | OWN (biên SEC) | Nhịp neo |
| `attendance_anchor_valid_minutes` | 10 | OWN (biên SEC, tối đa 15) | Cửa sổ hợp lệ = 2 nhịp; rộng hơn thì dễ lọt khi IP vừa đổi |
| `attendance_anchor_silent_alert_minutes` | 30 | OWN | Báo neo mất kết nối |
| `attendance_anchor_known_ip_days` | 30 | OWN | Báo IP lạ |
| `attendance_anchor_max_devices` | 2 | – (cố định) | Laptop quầy + 1 dự phòng |
| `attendance_registration_code_minutes` | 10 | – (biên SEC) | Mã đăng ký máy |
| `attendance_challenge_seconds` | 120 | – (biên SEC) | Thử thách passkey |
| `attendance_selfie_for_biometric` | tắt | OWN | **ESC-037 câu 3** |
| `attendance_late_grace_minutes` | 5 | OWN | **ESC-037 câu 2** |
| `attendance_early_leave_grace_minutes` | 5 | OWN | Đối xứng với đi muộn |
| `attendance_offshift_window_minutes` | 60 | OWN | Ngoài lịch ca |
| `attendance_missing_out_after_minutes` | 120 | OWN | Thiếu ra ca |
| `attendance_manual_max_days_back` | 7 | OWN | MGR chấm tay ngày cũ |
| `attendance_selfie_retention_days` | 30 | OWN (biên SEC, tối đa 90) | FB-INV-006 điểm 7 |
| `attendance_ip_retention_days` | 90 | OWN (biên SEC) | SEC xác nhận |
| Ca mẫu khởi tạo | Xem ESC-037 câu 1 | MGR+ | Dữ liệu, không phải tham số |

## 7. Góc nhìn bảo mật và dữ liệu cá nhân – **SEC cần review**

> PO tự nêu để SEC có điểm xuất phát; SEC viết threat model chính thức và có quyền chặn. Trích dẫn pháp luật dưới đây là **hiểu biết của đội, chưa được luật sư xác nhận** (như `data-risk-assessment.md` tuyên bố giới hạn).

### 7.1 Rủi ro chấm hộ còn lại

| # | Kịch bản | Mức (PO ước) | Cách thiết kế chặn | Còn lại |
|---|---|---|---|---|
| R1 | Nhân viên A đưa điện thoại **và mã khóa màn hình** cho B chấm hộ. Máy có Face ID vẫn cho mở passkey bằng mã khóa sau khi Face ID thất bại. | **Trung bình** | Máy chỉ có mã khóa: selfie bắt buộc. Máy có sinh trắc: selfie tùy OWN (mặc định tắt). Nội quy cấm, ký cam kết khi đăng ký máy. Quản lý đối chiếu lịch ca, camera an ninh (nếu có). | **Còn** với máy có sinh trắc khi selfie tắt. Đây là đánh đổi INV đã chọn (ESC-037 câu 3 hỏi lại kèm phương án). |
| R2 | Passkey đồng bộ hoặc được chia sẻ sang máy khác (iCloud Keychain, Google, chia sẻ mật khẩu nhóm iOS 17+). | Cao nếu chỉ dùng passkey | Thêm khóa riêng của máy **không đồng bộ** (US-165 AC4, AC6); thiếu khóa này → từ chối. | Thấp. Xóa dữ liệu trình duyệt → mất khóa máy → phải đăng ký lại (chấp nhận). |
| R3 | Một điện thoại, hai trình duyệt (Safari và Chrome) đăng ký cho hai người. | Thấp | Đăng ký phải có quản lý tại chỗ (US-165 AC3). | Thấp – máy chủ không nhận ra cùng một máy vật lý. |
| R4 | Selfie giả (chụp ảnh của một tấm ảnh). | Thấp | Chỉ chụp trực tiếp trong app, quản lý xem bằng mắt. Không có kiểm "người thật" (liveness). | Chấp nhận. |
| R5 | Quản lý chấm tay khống cho người quen. | Trung bình | Lý do bắt buộc, nhân viên được báo, MGR không tự chấm cho mình, OWN xem số lần chấm tay theo người chấm (US-168). | Thấp – phát hiện được sau. |
| R6 | Lấy được mã đăng ký máy của người khác. | Thấp | Mã dùng một lần, hết hạn 10 phút, gắn đúng người, phải ở Wi-Fi OTTIMO. | Thấp. |

### 7.2 IP, VPN, CGNAT – chỗ yếu của "chấm theo Wi-Fi"

| # | Tình huống | Hậu quả | Cách xử lý |
|---|---|---|---|
| N1 | **Nhân viên ở ngoài nhưng IP trùng** nhờ một proxy/VPN dựng trong mạng OTTIMO (máy tính hoặc thiết bị nhỏ cắm vào router). | Chấm từ xa được. | Cần kỹ thuật, có chủ đích. Laptop quầy không cài phần mềm điều khiển từ xa; mật khẩu quản trị router do OWN giữ; OPS rà danh sách thiết bị trong mạng mỗi tháng (SEC xem có cần). |
| N2 | **CGNAT**: nhà mạng dùng chung một IP công cộng cho nhiều thuê bao. | Người ở nơi khác cùng nhà mạng có thể trùng IP đúng lúc đó. | Xác suất nhỏ, không chủ động khai thác được. Chấp nhận. Gặp trường hợp lạ thì OWN xem IP gốc. |
| N3 | **Laptop neo bị mang ra khỏi OTTIMO** (về nhà). | IP nhà thành IP hợp lệ. | Báo OWN khi neo mang IP lạ (US-167 AC5). Nội quy: laptop quầy không rời cơ sở. |
| N4 | **Giả nhịp neo** từ thiết bị khác. | Đưa IP bất kỳ vào danh sách hợp lệ. | Nhịp neo chỉ nhận từ thiết bị được cấp có cờ neo, xác thực bằng khóa thiết bị (US-167 AC1); IP lấy từ kết nối. |
| N5 | **Giả IP trong header** (`X-Forwarded-For`). | Vượt kiểm IP. | Chỉ tin header do proxy của OTTIMO thêm (ARC/OPS cấu hình Caddy). SEC kiểm. |
| N6 | **Từ chối nhầm**: điện thoại bật VPN, Chuyển tiếp bảo mật iCloud, "Giới hạn theo dõi địa chỉ IP" của iOS, Wi-Fi yếu tự chuyển 4G; điện thoại IPv6 còn laptop IPv4; IP vừa đổi giữa hai nhịp. | Nhân viên ở OTTIMO vẫn bị từ chối. | Câu báo lỗi chỉ cách sửa và nút Thử lại (US-166 AC4); ARC xử lý IPv4/IPv6 (US-166 AC3); cửa sổ 10 phút; quản lý chấm tay. QA kiểm trên iPhone có bật Chuyển tiếp bảo mật iCloud. |
| N7 | **Sóng Wi-Fi OTTIMO lan ra ngoài** (vỉa hè, bãi xe, quán bên cạnh). Mật khẩu Wi-Fi là mạng chung có cả khách (ESC-022 B). | Chấm khi đứng ngay ngoài cơ sở. | Chấp nhận – vẫn ở OTTIMO. Không cần đổi mật khẩu Wi-Fi khi nhân viên nghỉ, vì chấm còn cần máy đã đăng ký. |
| N8 | **Laptop quầy ngủ hoặc tắt** (ngoài ý muốn). | Không ai chấm được. | Hướng dẫn vận hành: tắt chế độ ngủ, cắm sạc; báo sau 30 phút (US-167 AC4); có thể thêm neo thứ hai (máy tính bảng của cơ sở). |

### 7.3 Dữ liệu cá nhân của nhân viên

**Hiểu biết của đội, chưa được luật sư xác nhận:**
- Từ 01/01/2026, Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 có hiệu lực. Nghị định 356/2025/NĐ-CP hướng dẫn luật này. Đội hiểu luật có quy định riêng về dữ liệu cá nhân trong tuyển dụng và quản lý người lao động: chỉ thu dữ liệu cần thiết, phải thông báo cho người lao động, có thời hạn lưu, xóa khi chấm dứt hợp đồng trừ khi luật khác buộc giữ. Theo đội hiểu, giám sát bằng biện pháp kỹ thuật phải được thông báo cho người lao động biết.
- **Luật sư cần xác nhận** số điều khoản và bốn ý: (a) chấm công dựa trên hợp đồng lao động thì chỉ cần **thông báo**, hay cần **đồng ý** riêng; (b) ảnh selfie chỉ để người xem bằng mắt, không xử lý nhận diện, có phải là "dữ liệu sinh trắc học" (dữ liệu nhạy cảm) không – đội hiểu là **không**, vì không trích xuất đặc điểm khuôn mặt; (c) hạn lưu bảng công; (d) OTTIMO có phải bổ sung hồ sơ đánh giá tác động cho dữ liệu nhân viên không. PO đề nghị SEC gộp bốn ý này vào thư hỏi luật sư đang soạn (ESC-030/ESC-001), **không mở ESC mới**.

**Phân loại và hạn lưu** (BA/SEC thêm D29–D33 vào `data-risk-assessment.md` mục 4):

| Mã đề xuất | Dữ liệu | Mức | Hạn lưu đề xuất | Ai xem |
|---|---|---|---|---|
| D29 | Giờ vào/ra, trạng thái, lịch ca, bảng công | C2 | Theo hạn chứng từ lao động – tiền lương (kế toán xác nhận); chưa tự xóa ở v1.1 | Nhân viên (của mình), MGR, OWN; FDL chỉ "ai đang trong ca" |
| D30 | Ảnh selfie | C2 (C3 nếu luật sư coi là sinh trắc) | **30 ngày**, tự xóa | Nhân viên (của mình), MGR, OWN – ghi nhật ký mỗi lần xem |
| D31 | IP của lần chấm và lần bị từ chối, IP neo | C2 | **90 ngày**, sau đó chỉ giữ "khớp/không khớp" | Chỉ OWN (và OPS/SEC khi điều tra sự cố) |
| D32 | Khóa công khai passkey, khóa máy, tên máy, loại xác thực | C1 | Khi còn hoạt động + 30 ngày sau thu hồi | MGR, OWN, nhân viên (của mình) |
| D33 | Nhật ký chấm tay, nhật ký xem ảnh | C2 | Như nhật ký `audit` hiện hành | OWN; MGR xem nhật ký chấm tay |

**Không thu:** vân tay, khuôn mặt (Face ID xử lý trên máy, OTTIMO không nhận), mã khóa màn hình, vị trí GPS, số SIM/IMEI. Số điện thoại nhân viên đã có trong hồ sơ để liên lạc, không dùng để chấm công.

**Quyền của nhân viên:** xem bảng công và ảnh của mình trong app (US-171 AC5); thấy mỗi lần quản lý chấm tay hay sửa giờ của mình (US-168 AC5); đề nghị sửa qua quản lý.

### 7.4 Câu thông báo cho nhân viên (tiếng Việt – bản nháp, SEC và luật sư duyệt)

> **Thông báo về chấm công**
>
> OTTIMO dùng app nhân viên để ghi giờ vào ca, ra ca của bạn.
>
> Mỗi lần chấm, app ghi: giờ chấm, điện thoại bạn đã đăng ký, địa chỉ IP để biết bạn đang ở Wi-Fi OTTIMO, và ảnh selfie nếu máy của bạn cần chụp.
>
> Face ID, vân tay và mã khóa chỉ dùng trên điện thoại của bạn. OTTIMO không nhận và không lưu.
>
> Ảnh selfie tự xóa sau 30 ngày. Địa chỉ IP giữ 90 ngày. Bảng công giữ theo quy định kế toán và lao động.
>
> Chỉ quản lý và chủ đầu tư xem được bảng công và ảnh của mọi người. Mỗi lần xem ảnh đều được ghi lại. Bạn xem được dữ liệu của mình trong app.
>
> Không đưa điện thoại hay mã khóa cho người khác chấm hộ. Có thắc mắc, hỏi quản lý.
>
> [Tôi đã đọc]

## 8. Phụ thuộc

| # | Phụ thuộc | Trạng thái | Ảnh hưởng |
|---|---|---|---|
| P1 | **Lịch ca** – Desk chưa có (PRD X3) | Thêm **US-170** (lịch ca tối giản) vào chính gói v1.1 | Không có US-170 thì bảng công chỉ có giờ vào/ra, không tính được muộn, sớm, vắng, ngoài ca |
| P2 | Danh sách thiết bị được cấp + khóa thiết bị (US-142) | Có ở v1.0 | Điểm neo dựa vào đây |
| P3 | Tài khoản riêng cho mọi nhân viên chấm công (US-001, US-008) | Có ở v1.0 | Buồng phòng, bảo trì phải có tài khoản riêng |
| P4 | App nhân viên PWA ở `staff.<tên miền>`, HTTPS | Có ở v1.0 | Passkey cần HTTPS; ARC chọn RP ID (tên miền gắn passkey) – đổi về sau thì mọi passkey phải đăng ký lại |
| P5 | Thông báo trong app cho MGR/OWN (chuông, SSE) | Có ở v1.0; đẩy lên điện thoại theo US-164 (v1.1) | Báo ngoài ca, neo mất kết nối |
| P6 | Laptop quầy luôn bật, không ngủ, mở Desk | Việc vận hành của INV/MGR | Không có neo thì không ai chấm được |
| P7 | Máy thật để QA kiểm: iPhone có Face ID, iPhone chỉ mã khóa, Android vân tay, Android không đặt khóa, hai iPhone cùng Apple ID | Cần nhân viên/INV cho mượn hoặc đội tự có | Không kiểm được AC2, AC6 của US-165 trên máy giả lập |
| P8 | Thư luật sư (mục 7.3) | SEC gộp vào thư đang soạn | Chỉ ảnh hưởng chữ thông báo và hạn lưu bảng công; không chặn làm mã |

## 9. Câu hỏi còn mở cho INV → **ESC-037**

| # | Câu hỏi | Đề xuất của đội | Nếu chưa trả lời |
|---|---|---|---|
| 1 | Giờ chuẩn từng ca | Lễ tân ca sáng 07:00–15:00; lễ tân ca chiều 14:00–22:00 (chồng 1 giờ để bàn giao lúc khách nhận phòng); trực đêm 22:00–07:00; buồng phòng, bảo trì 08:00–17:00 | Dùng giờ đề xuất, quản lý sửa ca mẫu sau |
| 2 | Ngưỡng đi muộn | **5 phút** (vào 07:05 vẫn đúng giờ, 07:06 là muộn 6 phút). App chỉ ghi nhận, không trừ lương | 5 phút |
| 3 | Selfie cho máy có Face ID/vân tay | **Tắt** như thiết kế 26/10; xem lại sau 1 tháng chạy | Tắt |
| 4 | Xuất bảng công ra Excel cho kế toán | **Có** – tệp .xlsx tháng, chỉ OWN xuất, không ảnh/IP/số điện thoại; thêm khoảng nửa ngày | Không làm ở v1.1, kế toán xem trên Desk |

Hạn trả lời: **06/11/2026** (trước khi bắt đầu v1.1). Không câu nào chặn v1.0 hay ngày chạy 02/11.

## 10. Ước công

Ước của PO, mỗi vai xác nhận khi nhận việc. Đơn vị **ngày-người**.

| Vai | Việc | Ngày-người |
|---|---|---|
| BA | Luồng đăng ký/chấm/ngoại lệ, sơ đồ trạng thái bản ghi chấm công và máy, A120+ trong `rbac-matrix`, D29–D33 cùng SEC, danh mục mã lỗi và câu báo | 1 |
| DOM | Mã BR cho tham số mục 6, định nghĩa muộn/sớm/vắng/ngoài ca, ca qua đêm, bảng ví dụ cho QA | 0,25 |
| ARC | ADR passkey + khóa máy không đồng bộ, RP ID; nhịp neo và xác thực thiết bị; khớp IPv4/IPv6; proxy tin cậy; ERD (5–6 bảng); OpenAPI | 1 |
| BE | Đăng ký và xác thực passkey, khóa máy, nhịp neo, kiểm IP, chấm, chấm tay, lịch ca, tính bảng công, job xóa ảnh/IP, thông báo, phân quyền, audit, test | 3–3,5 |
| FE (Desk) + MOB (app nhân viên PWA) | PWA: thông báo, đăng ký máy, Vào/Ra ca, selfie, lịch của tôi, bảng công của tôi (≈ 1,5). Desk: lịch ca tuần, bảng công ngày/tháng, chấm tay, đăng ký lại/gỡ máy, cờ neo, nhịp neo chạy nền (≈ 2) | 3–3,5 |
| UXD | Màn PWA và Desk theo brand, chữ báo lỗi, câu thông báo | 0,5 |
| SEC | Threat model, review ADR + mã, chốt thông báo, biên tham số, câu hỏi luật sư | 1 |
| QA | Test case cho 52 AC, ma trận máy thật (P7), đồng hồ giả, IPv6, kiểm tổng tháng | 1,5 |
| **Cộng** | | **≈ 11,25–12,25** (+ 0,5 nếu ESC-037 câu 4 = có) |

**Lịch: 4 ngày làm việc** khi chạy song song:
- **Ngày 1:** BA + DOM + ARC + SEC + UXD chốt đặc tả, hợp đồng API, threat model, màn hình.
- **Ngày 2–3:** BE, FE (Desk), MOB (PWA) làm song song theo hợp đồng; SEC review mã cuối ngày 3.
- **Ngày 4:** QA trên staging với máy thật, sửa lỗi, QC.

**Muốn còn 3 ngày:** (a) lịch ca rút gọn thành "ca cố định theo người theo thứ trong tuần" (bỏ lưới tuần và "Chép tuần trước" – bớt khoảng 1 ngày-người); (b) không làm US-173; (c) ngày 1 và đầu ngày 2 gộp. Rủi ro lịch: máy thật cho QA (P7) và lỗi passkey khác nhau giữa iOS/Android – PO **không khuyến nghị** ép 3 ngày.

## 11. Việc tiếp theo theo vai (sau ngày chạy 02/11)

- **ORC:** đưa EP20 vào plan v1.1; giao review bắt buộc BA, DOM; giao SEC review mục 7 trước khi ARC chốt hợp đồng.
- **BA:** đặc tả `specs/EP20-attendance.md`, `rbac-matrix` A120+, state machine.
- **DOM:** BR cho mục 6 + ví dụ US-171 AC2.
- **SEC:** threat model chấm công; biên tham số; duyệt thông báo 7.4; gộp 4 câu luật sư vào thư đang soạn.
- **ARC:** ADR passkey + khóa máy, neo IP, IPv6, proxy; ERD; OpenAPI có `x-stories` US-165…US-173.
- **UXD:** màn PWA và Desk theo brand OTTIMO; chữ báo lỗi (US-166 AC4, AC5) và thông báo (7.4).
- **QA:** test case gắn AC; chuẩn bị máy thật (P7).
- **OPS:** cấu hình proxy tin cậy, kho ảnh có xóa theo hạn (kể cả bản sao lưu), hướng dẫn laptop quầy không ngủ.

## 12. Giả định PO đã dùng

- `[GIẢ ĐỊNH PO]` Chấm công áp cho FD, FDL, HK, MT, SAL, MGR; không cho CTV; OWN tắt mặc định.
- `[GIẢ ĐỊNH PO]` Một ca mỗi người mỗi ngày ở v1.1; ngày của ca qua đêm là ngày bắt đầu ca.
- `[GIẢ ĐỊNH PO]` Đăng ký máy phải có quản lý tại chỗ và ở Wi-Fi OTTIMO (FB-INV-006 không nói rõ; cần để chặn R3, R6).
- `[GIẢ ĐỊNH PO]` Thêm khóa riêng của máy không đồng bộ bên cạnh passkey – để giữ đúng điểm 3 của INV "mỗi tài khoản gắn đúng một điện thoại" (ARC chọn cách làm, SEC duyệt).
- `[GIẢ ĐỊNH PO]` Không có hàng chờ chấm offline; không cho nhân viên tự gửi đề nghị chấm bổ sung ở v1.1.
- `[GIẢ ĐỊNH PO]` Hạn lưu: selfie 30 ngày (INV đề xuất trong FB-INV-006), IP 90 ngày; bảng công chưa tự xóa – chờ kế toán/luật sư.
- `[GIẢ ĐỊNH PO]` Cửa sổ hợp lệ của IP neo 10 phút ("vài phút gần nhất" trong FB-INV-006).
- Chính sách lao động (giờ ca, ngưỡng muộn, selfie máy sinh trắc, xuất Excel) không do PO tự đặt – đã đưa vào ESC-037 kèm mặc định.
