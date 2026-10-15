# Khóa cửa thông minh – Khả năng tích hợp và tiêu chí chọn

- Người lập: INT | Round 1 – Bước 2 (Sản xuất, Đợt 1) | Ngày tra cứu: 15/10/2026
- Đầu vào: decision-log 15/10/2026 ("khóa thông minh có app – mật mã / vân tay / thẻ từ, đặt mã cửa [đã ẩn – INV 19/10: đổi sang mã ngẫu nhiên 8 số]; hãng chưa rõ"); brief mục 5 (mất/nhầm thẻ phòng, phí làm lại thẻ 200k); BL câu 23; plan rủi ro R2
- Quy ước nguồn: **[Nguồn]** đã thấy trên tài liệu chính thức; **[Bên thứ ba]**; **[Chưa xác minh]**.

## 1. Tóm tắt cho chủ đầu tư
1. Chưa biết hãng khóa OTTIMO đang dùng → **bước đầu tiên là INV chụp ảnh khóa + tên app đang dùng để mở/quản lý khóa** (rất nhiều khóa bán ở VN thực chất chạy nền tảng **TTLock** hoặc **Tuya** dưới tên thương hiệu khác).
2. Nếu khóa chạy **TTLock** hoặc **Tuya** và có **gateway (bộ phát Wi-Fi)**: app OTTIMO có thể **tự tạo mã cửa có hạn** (từ giờ nhận phòng đến giờ trả phòng) và **tự đặt mã theo ý** (ví dụ theo ngày sinh nhật khách) – đã thấy trong tài liệu API chính thức.
3. Nếu khóa không có API: MVP vẫn chạy bằng **nhập mã thủ công** – lễ tân đặt mã trên app của hãng, rồi ghi mã vào app OTTIMO để gửi khách. Không chặn Round 2.
4. **Vân tay không phù hợp cho khách ngắn ngày** (khách phải đứng tại khóa để quét) – chỉ dùng cho khách thuê tháng và nhân viên.
5. **Mã theo ngày sinh nhật có rủi ro an ninh** (ngày sinh có trên giấy tờ, dễ đoán) – đề xuất chỉ dùng khi khách chủ động chọn, và ghép thêm 2 số ngẫu nhiên (xem mục 5).

## 2. Các hãng / nền tảng phổ biến tại Việt Nam

> Danh sách tham khảo thị trường, **không phải** khuyến nghị mua. Thông tin API chỉ ghi khi tìm được tài liệu.

| Hãng / nền tảng | Kiểu | API cho hệ thống riêng | Mã có hạn | Đặt mã tùy ý (vd. sinh nhật) | Thẻ từ | Vân tay | Ghi chú |
|---|---|---|---|---|---|---|---|
| **TTLock** (Sciener, Hangzhou) – nền tảng cho nhiều nhãn khóa | Nền tảng cloud + app; khóa Bluetooth, cần **gateway** để điều khiển từ xa | **Có – Open Platform API** [Nguồn: euopen.ttlock.com/doc/api/v3] | Có: `keyboardPwd/add` có `startDate`/`endDate` [Nguồn] | **Có** – tham số `keyboardPwd` do mình đặt; chỉ khóa hỗ trợ "passcode V4"; qua gateway gọi API trực tiếp (`addType=2`) [Nguồn] | Có: `identityCard/addForReversedCardNumber` có hạn dùng; qua gateway gọi trực tiếp [Nguồn] | Có `fingerprint/add`, nhưng chỉ **sau khi** vân tay đã được quét tại khóa [Nguồn] | Đã có tích hợp sẵn với Cloudbeds, Zeevou [Bên thứ ba]. Phí nền tảng/gateway: [Chưa xác minh] |
| **Tuya Smart / Smart Life** – nền tảng cho nhiều nhãn khóa Trung Quốc | Cloud + app; khóa Wi-Fi hoặc Zigbee/Bluetooth + hub | Có – Cloud API + mini-app SDK [Nguồn: developer.tuya.com] | Có: mật khẩu tạm có giờ bắt đầu/kết thúc (`createTempLimit`) [Nguồn – SDK mini-app] | Có: `createTempCustom` (mật khẩu số tự đặt) [Nguồn – SDK mini-app]; endpoint Cloud tương ứng [Chưa xác minh] | Tùy model [Chưa xác minh] | Tùy model, đăng ký tại khóa [Chưa xác minh] | Cần tài khoản Tuya IoT Platform (gói dev có giới hạn) [Chưa xác minh] |
| **igloohome** (Singapore) | Khóa Bluetooth, tạo mã **ngoại tuyến** (algoPIN), có bridge | Có (trực tiếp hoặc qua Seam) [Nguồn: docs.seam.co] | Có: theo giờ (1–672 giờ) hoặc theo ngày [Nguồn: docs.seam.co] | **Không** với mã ngoại tuyến algoPIN (không đặt mã tùy ý) [Nguồn: docs.seam.co]; mã tùy ý cần bridge online [Chưa xác minh] | Tùy model | Tùy model | Ưu điểm: không cần Wi-Fi tại khóa. Nhược: không đặt được mã sinh nhật |
| **Kaadas** (phân phối độc quyền Ssehome) | App Kaadas riêng; dòng có Wi-Fi | **Chưa tìm thấy API công khai** | Có trong app (mã dùng 30 phút, mã 1 lần – tùy dòng) [Bên thứ ba: hacom.vn, meta.vn] | Chưa rõ | Có (tùy dòng) | Có | Phổ biến dân dụng. Hỏi nhà phân phối về API |
| **Samsung SHP / Philips / Yale / Häfele / Dessmann** | Khóa dân dụng, app riêng hoặc không app | **Chưa tìm thấy API công khai cho hệ thống riêng** [Chưa xác minh] | Tùy dòng | Tùy dòng | Có | Có | Thương hiệu mạnh, độ bền tốt; tích hợp khó |
| **Hune, Viro, Hexa…** (thương hiệu bán tại VN) | Khóa vân tay/mã/thẻ | **Không tìm thấy thông tin API** | ? | ? | Có | Có | Nhiều nhãn có thể dùng app TTLock/Tuya bên trong – **cần INV kiểm tra tên app** |
| Khóa khách sạn thẻ từ truyền thống (Adel, Orbita, VingCard…) | Máy mã hóa thẻ tại quầy, phần mềm riêng | Thường qua **SDK/DLL của hãng**, phải xin hãng [Chưa xác minh] | Có (hạn trên thẻ) | Không (thẻ, không mã) | Có | Không | Không khớp mô tả của INV (khóa mở bằng app + mã) – chỉ để đối chiếu |

**Lớp trung gian đa hãng:** Seam (seam.co) là API gom nhiều hãng khóa (có igloohome, TTLock…) – giúp không phụ thuộc 1 hãng, nhưng thêm phí và thêm một bên xử lý dữ liệu [Nguồn: docs.seam.co; giá: Chưa xác minh]. Để sau MVP.

## 3. Tiêu chí chọn khóa (dùng cho ESC hãng khóa)

| # | Tiêu chí | Bắt buộc / Nên có | Cách kiểm tra |
|---|---|---|---|
| T1 | Có **Cloud API công khai** (tạo/xóa mã, thẻ; xem nhật ký mở cửa) | Bắt buộc nếu muốn tự động | Có trang tài liệu cho nhà phát triển |
| T2 | Có **gateway Wi-Fi** để thao tác từ xa (không cần đứng gần khóa) | Bắt buộc | Hỏi nhà phân phối; 1 gateway phủ được mấy căn |
| T3 | Tạo **mã có hạn** theo giờ nhận/trả phòng; tự hết hạn | Bắt buộc | API có `startDate`/`endDate` |
| T4 | **Đặt mã tùy ý** (để làm mã sinh nhật), 6–8 số | Theo yêu cầu INV | API cho truyền số mã |
| T5 | Thẻ từ có hạn, **hủy thẻ từ xa** khi khách mất thẻ (brief mục 5) | Nên có | API thêm/xóa thẻ |
| T6 | Nhật ký mở cửa (ai, lúc nào, bằng gì) | Nên có | API lịch sử |
| T7 | Mở được khi **mất mạng/mất điện** (mã đã nạp sẵn trong khóa, pin dự phòng, chìa cơ) | Bắt buộc (an toàn khách) | Hỏi hãng |
| T8 | Bảo hành, linh kiện, kỹ thuật viên tại **Đà Lạt** | Bắt buộc | Hỏi đại lý |
| T9 | Chi phí: khóa + gateway + phí nền tảng/tháng | Theo ngân sách | Báo giá |
| T10 | Dữ liệu (vân tay, nhật ký) lưu ở đâu – liên quan Luật BVDLCN 91/2025 | Cần SEC xem | Điều khoản của hãng |

## 4. Luồng đề xuất trong app OTTIMO

### 4.1 Chế độ tự động (khi khóa có API – `DoorLockAdapter` thật)
1. Khi đơn chuyển **confirmed** và đã đủ điều kiện nhận phòng (cọc/khai báo theo BR của DOM): app tạo mã có hạn `[giờ nhận phòng − 0, giờ trả phòng + ân hạn]` cho đúng căn.
2. Gửi mã cho khách qua kênh đã chọn (email/Zalo/app khách) **chỉ vào ngày đến** (giảm rủi ro lộ mã).
3. Gia hạn / trả muộn / đổi phòng → cập nhật hạn mã hoặc xóa mã cũ, tạo mã mới.
4. Trả phòng / hủy / no-show → **xóa mã ngay** (không chờ hết hạn).
5. Khách thuê tháng: mã dài hạn + thẻ từ có hạn đến ngày kết thúc hợp đồng; vân tay đăng ký tại chỗ (tùy chọn).
6. Mọi thao tác ghi nhật ký (ai tạo, lúc nào, cho đơn nào) – không ghi số mã rõ trong log.

### 4.2 Chế độ thủ công (dự phòng – `ManualDoorLockAdapter`, dùng cho MVP nếu chưa có API)
1. App gợi ý mã (ngẫu nhiên hoặc theo sinh nhật + 2 số).
2. Lễ tân mở app của hãng khóa, tạo mã/thẻ với hạn tương ứng.
3. Lễ tân nhập lại mã vào app OTTIMO và tick "Đã cài trên khóa" → app gửi mã cho khách.
4. Khi trả phòng, app tạo **việc nhắc** "Xóa mã căn 201 trên app khóa" cho lễ tân; chưa tick → hiện trong "Cần chú ý".
5. Thẻ từ: ghi số thẻ đã giao (tối đa 2, theo brief mục 5) để tính phí làm lại thẻ 200k khi thiếu.

Cả hai chế độ dùng **chung giao diện** (`DoorLockAdapter`), chuyển bằng cấu hình theo từng căn – xem `product/integrations/README.md`.

## 5. Mã theo ngày sinh nhật – phân tích và đề xuất
- **Yêu cầu INV:** [đã ẩn – INV 19/10: mã cửa đổi sang ngẫu nhiên 8 số].
- **Rủi ro:** ngày sinh nằm trên CCCD/hộ chiếu, hồ sơ OTA, mạng xã hội → người khác đoán được; chỉ 4–6 số (ddmm / ddmmyy) → dễ thử. Ngày sinh là dữ liệu cá nhân → SEC cần xem.
- **Đề xuất kỹ thuật (INT tự quyết, chờ SEC review):**
  - Mặc định: mã **ngẫu nhiên 6 số**.
  - Tùy chọn "mã sinh nhật": `ddmm` + **2 số ngẫu nhiên** (ví dụ `1503`+`47`), chỉ khi khách chọn hoặc lễ tân chọn với sự đồng ý của khách.
  - Không cho trùng mã đang có hiệu lực trên **cùng một khóa**; nếu trùng → đổi 2 số cuối.
  - Mã có hạn, xóa ngay khi trả phòng.
- Có cần cho phép mã **chỉ gồm** ngày sinh (không thêm số) hay không là **chính sách** → đưa vào dự thảo ESC khóa cửa.

## 6. INV cần cung cấp
1. Ảnh khóa (mặt trước, mặt trong, tem nhãn) + **tên app đang dùng** để quản lý khóa; có gateway chưa.
2. Số lượng khóa: 10 căn + cửa chính/cổng (nếu có).
3. Nếu có API: tài khoản nhà phát triển do **INV tự đăng ký** (đội không đăng ký hộ), khóa API do INV tự điền vào biến môi trường (`DOORLOCK_*` trong `.env`, không gửi qua chat).

## 7. Nguồn (tra ngày 15/10/2026)
- TTLock Open API – thêm mã tùy ý: https://euopen.ttlock.com/doc/api/v3/keyboardPwd/add
- TTLock – thêm thẻ IC: https://euopen.ttlock.com/doc/api/v3/identityCard/add
- TTLock – vân tay: https://euopen.ttlock.com/doc/api/v3/fingerprint/add
- TTLock tích hợp PMS (bên thứ ba): https://www.cloudbeds.com/integrations/ttlock/ ; https://zeevou.com/integrations/ttlock/ ; https://strspecialist.com/reviews/ttlock-smart-lock-review
- Tuya – mật khẩu tạm (SDK mini-app): https://developer.tuya.com/en/miniapp/develop/ray/api/doorlock/temporary/createTempCustom.md ; createTempLimit.md
- igloohome qua Seam: https://docs.seam.co/latest/device-and-system-integration-guides/igloohome-locks/creating-igloohome-offline-access-codes
- Kaadas (bên thứ ba): https://fptshop.com.vn/tin-tuc/dien-may/khoa-kaadas-cua-nuoc-nao-208782 ; https://hacom.vn/khoa-thong-minh-kaadas-s10-5w
