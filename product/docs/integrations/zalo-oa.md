# Zalo OA + ZBS Template Message (ZNS) – Chăm sóc khách OTTIMO

- Người lập: INT | Round 2 (sau Sprint 3, trước Sprint 4) | Ngày tra cứu: 17/10/2026 | Trạng thái: **v0.1 – chờ review** ARC, SEC (bắt buộc), DOM, BE (khuyến nghị)
- Đầu vào: tin nhắn INV 17/10/2026 (muốn dùng Zalo OA để chăm sóc khách); ESC-010 (INV chọn B ngày 16/10: ZNS để sau MVP); ESC-020 (landing page, nút "Chat Zalo OA"); PRD M13, M15, A6; backlog US-034, US-040, US-108, US-116, US-126, US-138, US-131/132; `integrations.md` I7 + mục 3.4; ADR-006, ADR-011; `hosting-plan.md` mục 5.1; content-guide mục 7 (mẫu tin VI/EN/RU).
- Liên quan: `02-escalations/ESC-021.md` (mở lại phần Zalo của ESC-010).
- Quy ước nguồn:
  - **[Nguồn Sx]** = trang chính thức của Zalo, đọc ngày 17/10/2026, danh sách URL ở mục 10.
  - **[Bên thứ ba]** = bài viết ngoài Zalo.
  - **[Chưa xác minh]** = chưa thấy trên tài liệu chính thức, phải hỏi Zalo hoặc thử trên tài khoản thật.
  - **[Ước tính của đội]** = con số đội tự tính.
- Ghi chú đọc tài liệu: trang `developers.zalo.me` tải nội dung bằng JavaScript (khung từ `stc-developers.zdn.vn/docs/v2/...`). INT đọc bằng trình duyệt. Trang bảng giá ZBS hiển thị 2 bộ số khác nhau tùy cách tải (xem mục 2.4). Đội dùng bộ số **cao hơn** để ước tính.
- **Tên gọi**: Zalo đã đổi "ZNS (Zalo Notification Service)" thành **"ZBS Template Message"** (Zalo Business Solutions). `zalo.cloud` chuyển hướng sang `zalo.solutions` [Nguồn S2]. Trong tài liệu này, "ZNS" = "ZBS Template Message". Tên kênh trong code giữ `zalo_zns`.

## 0. Tóm tắt cho chủ đầu tư

1. Zalo có **hai công cụ** chăm sóc khách:
   - **Chat OA** (2 chiều): khách nhắn OA trước, OTTIMO trả lời. Miễn phí trong 48 giờ kể từ tin cuối của khách; trả lời được tới 7 ngày [Nguồn S17, S18].
   - **Tin mẫu ZNS**: gửi chủ động **theo số điện thoại**, kể cả khách chưa quan tâm OA. Mẫu phải được Zalo duyệt trước. Chỉ gửi cho khách **đã giao dịch** với OTTIMO [Nguồn S4].
2. **Chat thủ công qua OA Manager** (web + mini app trong Zalo): **0 đ** với gói Cơ bản, tối đa 3 nhân viên. Dùng được ngay khi OA được xác thực. **Không cần đội lập trình gì.**
3. **Gửi tự động từ app OTTIMO** (xác nhận, nhắc ngày đến, nhắc trả phòng, bill, cảm ơn): bắt buộc gói OA **Tăng trưởng 2.500.000 đ/năm** (~208.000 đ/tháng, đã gồm VAT) [Nguồn S1] + tiền tin khoảng **300–400 đ/tin** (chưa VAT) [Nguồn S2].
4. Ước tính cho 10 căn: **khoảng 230.000–300.000 đ/tháng** (gói + tin) [Ước tính của đội, mục 5]. Khoản này **ngoài** ngân sách hạ tầng ≤ 1 triệu đ/tháng.
5. Khách nước ngoài phần lớn **không dùng Zalo** → vẫn dùng email + hộp thư OTA. Zalo chủ yếu phục vụ khách Việt.
6. INV phải tự làm (mục 6): xác thực OA bằng giấy đăng ký kinh doanh → mở tài khoản ZBS → nạp tiền → mua gói Tăng trưởng khi bắt đầu tích hợp → đăng ký mẫu tin **trước ít nhất 2 tuần**.
7. **Sửa số liệu**: ESC-020 (câu L2) ghi "gói nâng cao ~99.000 đ/tháng" theo bài bên thứ ba. Bảng giá chính thức áp dụng từ **01/06/2026** đã khác (mục 1.5). PO nên sửa dòng chi phí trong ESC-020.

## 1. Zalo Official Account (OA)

### 1.1 Loại OA và xác thực
| Điểm | Nội dung | Nguồn |
|---|---|---|
| Loại tài khoản | (a) **Hồ sơ quảng cáo**: cho người chưa có giấy đăng ký kinh doanh, **không** nhắn tin, broadcast, chatbot. (b) **OA xác thực (OA doanh nghiệp)**: cho **doanh nghiệp hoặc hộ kinh doanh** có giấy đăng ký kinh doanh; có tick xác thực, nhiều quản trị viên | [Nguồn S12] |
| Ai tạo được | Chỉ số điện thoại **+84 đã có Zalo cá nhân** mới tạo và quản lý OA | [Nguồn S12] |
| Hạn nộp hồ sơ | Trong **14 ngày** kể từ khi tạo OA | [Nguồn S12, S13] |
| Thời gian duyệt | **2–3 ngày làm việc**, có thể lâu hơn; Zalo có thể đòi bổ sung giấy tờ | [Nguồn S13] |
| Hồ sơ | Công văn xác thực (CVXT) theo mẫu, hoặc người đại diện pháp luật **bấm xác nhận qua Zalo trong 48 giờ** (bộ 1A/2A/3A); giấy đăng ký kinh doanh đủ trang, có dấu và chữ ký cơ quan cấp; tên, SĐT Zalo, số CCCD/hộ chiếu của người đại diện | [Nguồn S13] |
| Hộ kinh doanh | Giấy đăng ký hộ kinh doanh chỉ xác thực **1 OA**, không dùng CVXT | [Nguồn S14 – Cách 1] |
| Đặt tên OA | Cách 1: tên doanh nghiệp/hộ kinh doanh hoặc tên cửa hàng/địa điểm kinh doanh (nên có tiền tố loại hình). Cách 2: nhãn hiệu đã được Cục SHTT cấp văn bằng. Cách 3: tên khác hoặc ngành nghề kinh doanh có điều kiện – cần thêm "yếu tố kinh doanh" (giấy phép ngành nghề) | [Nguồn S13, S14] |
| Áp dụng cho OTTIMO | Tên "OTTIMO Boutique Stay" khác tên trên giấy phép (nếu có) → nhiều khả năng **Cách 1** (tên địa điểm kinh doanh) hoặc **Cách 3**. Lưu trú có thuộc danh sách "ngành có điều kiện" của Zalo hay không, và có cần **Giấy chứng nhận đủ điều kiện ANTT** làm yếu tố kinh doanh không | **[Chưa xác minh]** – danh sách ngành nằm trong ảnh trên trang Zalo; hỏi `oa@zalo.me` |
| Phí xác thực | Trang hướng dẫn **không nêu phí** xác thực | [Nguồn S13]; có phí hay không **[Chưa xác minh]** |

**Hệ quả:** loại hình doanh nghiệp hay hộ kinh doanh (còn chờ INV ở ESC-008) quyết định bộ hồ sơ. Không có giấy đăng ký kinh doanh → **không** có OA nhắn tin.

### 1.2 OA gửi được gì cho ai
| Người nhận | Chat tư vấn | Tin mẫu ZNS (theo SĐT) | Tin mẫu qua UID | Tin truyền thông / broadcast |
|---|---|---|---|---|
| Khách **đang quan tâm** (follow) OA | Có, nếu khách tương tác trong 7 ngày | Có | Có | Có (tối đa 1 tin/ngày/người, theo hạn mức gói) |
| Khách **chưa quan tâm**, đã nhắn OA trong 7 ngày | Có | Có | Có [Chưa xác minh điều kiện tương tác cho UID] | Không |
| Khách **chưa từng tương tác**, có SĐT dùng Zalo | Không | **Có** – nếu khách đã giao dịch với OTTIMO | Không (chưa có UID) | Không |
| Khách không dùng Zalo | Không | Không (lỗi `-118`) | Không | Không |

- "Tương tác" gồm: nhắn OA, gọi OA, bình luận bài viết, bấm menu/nút, quan tâm OA, bấm nút "Nhắn tin" trên trang OA, bấm widget OA [Nguồn S17]. **Nhận tin ZNS không được liệt kê là tương tác.**
- Tin mẫu Tag 3 (khuyến mãi) tới người **không** follow OA nằm ở **Business Box**, khó thấy hơn [Nguồn S5].

### 1.3 Các loại tin, khung thời gian, phí
| Loại tin | Mục đích | Điều kiện gửi | Giờ gửi / báo trên máy | Phí | Nguồn |
|---|---|---|---|---|---|
| **Tin tư vấn** (chat) | Trả lời, hỗ trợ khi khách hỏi | Khách tương tác trong **7 ngày**, không chặn OA | Gửi 24/24; báo 24/24 | **Miễn phí trong 48 giờ** từ tương tác cuối. Sau 48 giờ: **55 đ/tin** (có VAT) khi hết hạn mức miễn phí của gói (Cơ bản/Tiêu chuẩn: 0 tin; Tăng trưởng: 500 tin/tháng; Toàn diện: 2.000) | [Nguồn S17, S18, S1] |
| Tin vào nhóm chat GMF | Trao đổi trong nhóm do OA tạo | OA dùng nhóm GMF | – | Tin OA gửi vào nhóm miễn phí tới 31/12/2026; duy trì nhóm 25.000–300.000 đ/tháng | [Nguồn S1, S17] |
| Tin truyền thông / broadcast | Thông tin chung, khuyến mãi | Chỉ người **đang quan tâm** OA; 1 tin/ngày/người | 6:00–21:59 | Theo hạn mức gói | [Nguồn S20, S17] |
| **ZNS Tag 1 – Giao dịch** | Xác nhận đặt chỗ, trạng thái thanh toán, yêu cầu thanh toán, OTP | Khách đã giao dịch; có tên khách + ≥ 1 mã giao dịch (mẫu "xác nhận" cần **≥ 3 tham số** xác định giao dịch) | Xem lưu ý giờ đêm dưới bảng | Theo mẫu (mục 2.4) | [Nguồn S4, S28] |
| **ZNS Tag 2 – Chăm sóc khách hàng** | Nhắc lịch, cập nhật dịch vụ, khảo sát, đánh giá | Như Tag 1; **không** upsell/cross-sell | Như trên | Theo mẫu | [Nguồn S4, S28] |
| **ZNS Tag 3 – Hậu mãi** | Voucher, ưu đãi, mời quay lại | Khách đã giao dịch; **tối đa 1 tin/ngày, 30 tin/tháng mỗi khách mỗi OA** | Như trên | Theo mẫu (voucher 400 đ) | [Nguồn S4, S5] |

- **Giờ đêm**: lỗi `-133` = "loại tin này không được gửi từ 22:00 đến 7:00" [Nguồn S29]. Tin giao dịch OA chỉ **báo ra ngoài app** 6:00–21:59 [Nguồn S19]. → Đội đặt **khung gửi tự động 08:00–21:00** cho mọi tin (DOM xác nhận).
- Gửi tin mẫu **qua UID** rẻ hơn gửi qua SĐT (máy tính giá: mẫu tùy chỉnh 300 đ qua SĐT, 210 đ qua UID) [Nguồn S2]. UID chỉ có khi khách đã tương tác với OA.

### 1.4 Chat 2 chiều và OA Manager cho nhân viên
- **OA Manager** chạy trên máy tính tại `oa.zalo.me/manager` và trên điện thoại bằng **mini app OA Manager** trong Zalo [Nguồn S15].
- Có: phân quyền quản trị viên nhiều vai trò, **chỉ định người xử lý hội thoại**, lưu thông tin khách, báo cáo lượng dùng [Nguồn S15].
- Số tài khoản nhân viên: Cơ bản **3**, Tiêu chuẩn 5, Tăng trưởng 15, Toàn diện 100. Chat trên điện thoại ở gói Cơ bản **"có giới hạn"** [Nguồn S1]. Giới hạn cụ thể **[Chưa xác minh]**.
- Đủ cho OTTIMO giai đoạn 1: chủ đầu tư + 2 lễ tân/sale.

### 1.5 Gói dịch vụ OA – bảng giá áp dụng từ 01/06/2026 (giá **đã gồm VAT 10%**) [Nguồn S1]
| Gói | Giá | Nhân viên | Tích hợp API | Tin tư vấn ngoài 48 giờ miễn phí/tháng | Ghi chú |
|---|---|---|---|---|---|
| Cơ bản | 0 đ (mặc định) | 3 | Không | 0 | Chat cơ bản |
| Tiêu chuẩn | 1.000.000 đ/năm (~83.000 đ/tháng) | 5 | **Không** | 0 | Chat nâng cao, công cụ chat trên điện thoại. ZNS chỉ gửi qua công cụ chiến dịch "sắp ra mắt", **không qua API** |
| **Tăng trưởng** | 2.500.000 đ/năm (~208.000 đ/tháng); 1.400.000 đ/6 tháng | 15 | **Có** – 100 request/phút, tối đa 3 ứng dụng | 500 | Chatbot 10 kịch bản |
| Toàn diện | 6.000.000 đ/năm; 3.400.000 đ/6 tháng | 100 | Có – 2.000 request/phút | 2.000 | Hỗ trợ ưu tiên |

- **Điểm quyết định:** Zalo ghi rõ: gửi ZNS qua tài khoản ZBS bằng API, và liên kết **bất kỳ phần mềm nội bộ hay bên thứ ba** với OA qua API, chỉ dành cho **OA doanh nghiệp đã xác thực** dùng gói **Tăng trưởng** hoặc **Toàn diện** [Nguồn S1 – mục Câu hỏi thường gặp]. Tức là mọi việc **tự động** (gửi ZNS từ app, hộp thư Zalo trong Desk) đều cần gói Tăng trưởng.
- Gói **không hoàn tiền**, không chuyển sang OA khác; hết hạn không gia hạn thì về Cơ bản [Nguồn S1].
- Mua gói bằng **số dư tài khoản ZBS** [Nguồn S1].

### 1.6 API: xác thực, token, webhook, giới hạn tốc độ
| Điểm | Nội dung | Nguồn |
|---|---|---|
| Ủy quyền | OA cấp quyền cho ứng dụng (Zalo App) bằng **OAuth v4 có PKCE** (code_verifier 43 ký tự, code_challenge = Base64URL(SHA-256)), hoặc lấy tay qua công cụ API Explorer | [Nguồn S16] |
| Authorization code | Dùng **1 lần**, hiệu lực **10 phút** | [Nguồn S16] |
| Access token | Hiệu lực **25 giờ** (`expires_in` = 90000) | [Nguồn S16] |
| Refresh token | Hiệu lực **3 tháng**; **chỉ dùng 1 lần** – đổi xong thì refresh token cũ và access token cũ mất hiệu lực, Zalo trả cặp mới | [Nguồn S16] |
| Endpoint token | `POST https://oauth.zaloapp.com/v4/oa/access_token`, header `secret_key` (khóa bí mật của App) | [Nguồn S16] |
| Nhóm quyền | Gửi tin và thông báo qua OA; quản lý tin nhắn người dùng; quản lý thông tin OA; nhận sự kiện quản lý tin nhắn; nhận sự kiện quản lý người dùng; … | [Nguồn S16] |
| Webhook vào | Zalo `POST` tới webhook URL của App. URL phải là **tên miền + HTTPS**. Phải trả **HTTP 200 trong tối đa 2 giây** | [Nguồn S22] |
| Gửi lại webhook | Sau 30 giây, 5 phút, 15 phút, 30 phút, 1 giờ (header `num_retry`). Vẫn lỗi → **Zalo hủy đăng ký webhook**, phải xin lại quyền trong cài đặt App | [Nguồn S22] |
| Chữ ký webhook | Header `X-ZEvent-Signature` = `sha256(appId + data + timeStamp + OAsecretKey)` | [Nguồn S23] |
| Sự kiện tin nhắn | `user_send_text`, `user_send_image`, `user_send_link`, `user_send_audio`, `user_send_video`, `user_send_sticker`, `user_send_location`, `user_send_business_card`, `user_send_file`; có cả sự kiện **OA gửi tin cho người dùng**, người dùng **đã nhận**, **đã xem** tin của OA, người dùng **đồng ý chia sẻ thông tin** | [Nguồn S23, S22 – danh mục] |
| Giới hạn tốc độ (theo App) | Official Account API **4.000 request/phút**; vượt → lỗi `-32`; header `X-RateLimit-Limit`, `X-RateLimit-Remain` | [Nguồn S21] |
| Giới hạn theo gói OA | Tăng trưởng 100 request/phút; Toàn diện 2.000 request/phút. **Không tính** API gửi ZNS | [Nguồn S1, S21] |

## 2. ZBS Template Message (ZNS)

### 2.1 Nguyên tắc
- Gửi **theo số điện thoại** dạng `84xxxxxxxxx` (số phải gắn tài khoản Zalo) hoặc theo UID [Nguồn S25, S17].
- Cần 3 tài khoản: **OA**, **Zalo App**, **tài khoản ZBS** (ví tiền, liên kết được nhiều App) [Nguồn S24].
- Chỉ gửi cho người **đã phát sinh giao dịch** với doanh nghiệp (trừ OTP tạo tài khoản mới) [Nguồn S4]. Khách đã đặt phòng OTTIMO thỏa điều kiện này.
- Gửi số điện thoại **nước ngoài** (ví dụ +82) được không: **[Chưa xác minh]**. MVP chỉ gửi cho số `84…`.

### 2.2 Mẫu tin, Tag và quy định nội dung [Nguồn S4, S9, S10, S28]
- Mỗi mẫu gắn **1 Tag**. Có mục đích khuyến mãi → Tag 3. Trộn Tag 1 + Tag 2 → Tag 1. Mẫu "đánh giá dịch vụ" → Tag 2.
- Nội dung:
  - **Một ngôn ngữ** duy nhất, không trộn Anh–Việt. Tiếng Việt phải có dấu. Không icon, không ký tự đặc biệt, hạn chế viết tắt.
  - **Không** chèn link hay số điện thoại trong thân tin. Link và số điện thoại chỉ nằm ở **nút (CTA)**.
  - Xưng "bạn" hoặc "quý khách", không dùng "anh/chị".
  - Tag 1, Tag 2: **bắt buộc** tên khách + ít nhất 1 mã định danh/giao dịch (ví dụ mã đặt phòng).
  - Tham số viết `<ten_tham_so>`, không dấu, nối bằng `_`, có chữ dẫn phía trước (ví dụ "mã đặt phòng <booking_code>").
- Giới hạn kỹ thuật mẫu tùy chỉnh: tiêu đề 9–65 ký tự, ≤ 4 tham số; 1–4 đoạn văn, mỗi đoạn ≤ 400 ký tự, tổng ≤ 10 tham số; tối đa 1 bảng 2–8 dòng; **tối đa 2 nút CTA**, chữ trên nút 5–30 ký tự, không tham số; logo PNG 400×96 bản sáng + bản tối.
- **Nút CTA được nhận tham số trong phần path của URL** (≤ 200 ký tự, mã hóa UTF-8; sai → lỗi `-132`) [Nguồn S10]. → Link khách dạng `https://g.<tên-miền>/g/<token>` (ADR-006) đặt được vào nút.
- **Tên miền trong nút** phải khớp thương hiệu với tên OA, hoặc có giấy ủy quyền dùng tên miền [Nguồn S4]. → Tên miền OTTIMO (ESC-020 câu L4) phải đứng tên doanh nghiệp/OA.
- **Nút gọi điện** cần số 1800/1900, hoặc chứng minh số đó là hotline công khai trên website [Nguồn S4]. → Landing page nên đăng số hotline.
- **Mẫu "yêu cầu chuyển khoản"**: số tài khoản ngân hàng phải là của **chính doanh nghiệp sở hữu OA** [Nguồn S4]. → Tài khoản nhận VietQR (`payment_receiving_account`) đứng tên cá nhân thì mẫu này bị từ chối.
- Mẫu đã duyệt **không sửa được**; muốn đổi phải tạo mẫu mới [Nguồn S8].
- Trạng thái mẫu: `PENDING_REVIEW`, `ENABLE`, `REJECT`, `DISABLE`, `DELETE`. Chất lượng: `HIGH`, `MEDIUM`, `LOW`, `UNDEFINED`. Mẫu bị khách báo xấu nhiều sẽ **tự bị khóa** [Nguồn S28, S5].

### 2.3 Duyệt mẫu – thời gian
- Trang hướng dẫn tạo mẫu: xử lý trong **1–2 ngày làm việc** [Nguồn S8]. Trang giới thiệu ZBS: **2–3 ngày làm việc** [Nguồn S3].
- Bị từ chối thì sửa và gửi lại. Gửi nhiều mẫu song song được [Nguồn S8].
- Có **chế độ phát triển**: mẫu thử chỉ gửi được cho quản trị viên (lỗi `-126`, `-127`) [Nguồn S29]. Chi tiết cách bật **[Chưa xác minh]**.
- **Đội lập kế hoạch 2 tuần** cho đăng ký mẫu (1–3 ngày mỗi lượt × 1–2 lượt sửa + chờ OA xác thực trước đó) [Ước tính của đội].

### 2.4 Bảng giá tin mẫu (đơn giá **chưa VAT**, tính khi gửi thành công) [Nguồn S2]
| Hạng mục | Giá trang hiển thị (đọc bằng trình duyệt 17/10/2026) | Ghi chú |
|---|---|---|
| Mẫu tùy chỉnh và "các loại còn lại" | **300 đ** | Máy tính giá: 300 đ qua SĐT, **210 đ qua UID** |
| Mẫu xác thực (OTP) | 400 đ | |
| Mẫu yêu cầu chuyển khoản | 300 đ | |
| Mẫu voucher | 400 đ | |
| Mẫu đánh giá dịch vụ | "từ 210 đ" (qua UID) | Giá qua SĐT trang không ghi riêng → coi như 300 đ |
| Hình ảnh trong mẫu | 300 đ | Mẫu có hình bắt buộc ≥ 1 nút |
| Nút "Sao chép", "Chuyển khoản", "Xem chi tiết" | 0 đ | |
| Nút tới trang OA, mini app, bài viết của doanh nghiệp | 100 đ (nút đầu tiên của hạng mục 0 đ) | |
| **Nút tới trang của doanh nghiệp** (website OTTIMO) | **100 đ** | Nút tra cứu hóa đơn điện tử: nút đầu 0 đ |
| Nút gọi điện | 200 đ | |
| Nút tới **trang web khác** (ví dụ Google Maps, trang OTA) | **500 đ** | → không dùng; đặt bản đồ trong trang khách |
| Nút phản hồi nhanh (Beta) | 100 đ | |

- **Hai bộ số khác nhau**: cùng trang, bản tải không chạy JavaScript ghi "các loại còn lại 200 đ, xác thực 300 đ, voucher 300 đ". Bản hiển thị đầy đủ ghi như bảng trên. Đội dùng **bộ cao hơn**. Trang **không ghi ngày hiệu lực**. INV xem lại giá trong tài khoản ZBS trước khi nạp.
- Thuế: đơn giá ZNS **chưa gồm VAT** [Nguồn S2]; giá gói OA **đã gồm VAT** [Nguồn S1].

### 2.5 Ví ZBS (trả trước) [Nguồn S6, S7]
- Tài khoản ZBS tạo bằng Zalo cá nhân. Khai tên công ty, **mã số thuế**, địa chỉ, người đại diện. Tên tài khoản **không đổi được** sau khi tạo.
- Nạp tối thiểu **50.000 đ/lần**. Cách nạp: thẻ quốc tế, thẻ ATM nội địa, ví ZaloPay (tối đa 50 triệu/lần), chuyển khoản nhanh (vào ví trong ~30 phút).
- **Tiền nạp không hoàn lại.** Có thể yêu cầu hóa đơn VAT khi nạp (gửi email ngày làm việc kế tiếp).
- Hết tiền: gửi tin lỗi `-115` / `-137` [Nguồn S29].

### 2.6 Hạn mức và chất lượng [Nguồn S5]
- OA mới mặc định **20.000 tin/ngày** – thừa xa so với OTTIMO (< 20 tin/ngày).
- Chất lượng dựa trên **tỉ lệ khách báo xấu**. Mức an toàn đề xuất < 0,1%/ngày. Báo xấu > 2% hạn mức ngày → hạ 1 mức. Chất lượng kém kéo dài → Zalo có thể **tạm ngừng** dịch vụ.
- Đánh giá đầu tiên vào ngày D+8 sau lần gửi đầu.
- → Gửi đúng mục đích, đúng giờ, không gửi trùng là điều kiện sống còn của kênh.

### 2.7 Báo cáo gửi tin
- Gọi API gửi: `POST https://business.openapi.zalo.me/message/template`, header `access_token` (OA access token), body `phone`, `template_id`, `template_data`, `tracking_id` (do OTTIMO đặt, ≤ 48 ký tự). Trả về `msg_id`, `sent_time`, hạn mức còn lại [Nguồn S25].
- Webhook **`user_received_message`**: báo tin đã tới máy khách, có `msg_id`, `tracking_id`, `delivery_time` [Nguồn S11].
- API trạng thái: `GET https://business.openapi.zalo.me/message/status?message_id=…` → `status` −1 không tồn tại / 0 đã lên máy chủ Zalo, chưa tới máy / 1 đã tới máy [Nguồn S26].
- Có hỗ trợ mã hóa AES/CBC cho API gửi, trao đổi khi tích hợp [Nguồn S25].

### 2.8 Mã lỗi quan trọng và cách app xử lý [Nguồn S29]
| Mã | Ý nghĩa | App xử lý |
|---|---|---|
| `-108` | SĐT sai định dạng | Không thử lại; chuyển kênh dự phòng; báo lễ tân sửa SĐT |
| `-118` | Số không có Zalo / tài khoản bị vô hiệu | Không thử lại; đánh dấu "không có Zalo" cho SĐT đó 90 ngày; chuyển kênh dự phòng |
| `-139`, `-141` | Khách **từ chối nhận** loại tin này / tin SĐT của OA | Đánh dấu **opt-out Zalo** cho khách; ngừng gửi ZNS; chuyển kênh dự phòng |
| `-140` | Khách không đủ điều kiện nhận theo chính sách | Không thử lại; kênh dự phòng |
| `-133` | Gửi trong giờ cấm 22:00–7:00 | Dời tới 08:00 sáng hôm sau |
| `-115`, `-137` | Ví ZBS hết tiền | Dừng kênh Zalo; báo đỏ OWN "nạp tiền"; mọi tin chuyển kênh dự phòng |
| `-124` | Access token sai/hết hạn | Làm mới token 1 lần rồi gửi lại; vẫn lỗi → "Cần chú ý" OWN kết nối lại |
| `-120`, `-135` | OA chưa mua gói / chưa xác thực | Dừng kênh; báo OWN |
| `-131`, `-117`, `-109` | Mẫu chưa duyệt / không thuộc OA / sai ID | Dừng mẫu đó; báo OWN; kênh dự phòng |
| `-144`, `-147` | Vượt hạn mức ngày | Thử lại sau 1 giờ |
| `-1441`, `-1471`, `-1472` | Vượt hạn mức tin khuyến mãi | Bỏ tin khuyến mãi đó |
| `-100` | Lỗi không xác định | Thử lại theo outbox (mục 4.4) |

## 3. Hành trình khách → chọn kênh

Hành trình gốc dùng bản tạm (DOM đang soạn bản chính thức song song). **Thứ tự chọn kênh** cho mọi bước (lõi quyết, adapter không tự quyết):
1. Khách có UID và đang trong cửa sổ chat OA (≤ 48 giờ: miễn phí; ≤ 7 ngày: 55 đ) → **tin tư vấn OA** (`zalo_oa`).
2. Khách có SĐT Việt Nam, chưa opt-out, không bị đánh dấu "không có Zalo" → **ZNS** (`zalo_zns`).
3. Đơn OTA → **hộp thư OTA** (`ota_message`: R2 sao chép tay; R3 qua Beds24).
4. Có email → **email** (`email`).
5. Không còn kênh → việc "Gửi tay" cho lễ tân (`manual_copy`) trong "Cần chú ý".

| # | Bước | Thời điểm | Khách Việt dùng Zalo | Khách nước ngoài / không Zalo | Loại mẫu ZNS | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Xác nhận đặt phòng + link check-in online | Khi đơn `confirmed` (trong 08:00–21:00, ngoài giờ thì dời) | **ZNS Tag 1** "Xác nhận đặt chỗ": tên, mã đặt phòng, căn/nhóm, ngày đến–đi. Nút 1 "Làm thủ tục trước" → `g.<tên-miền>/g/<token>` | Email (US-126) + hộp thư OTA với đơn OTA | Tùy chỉnh, Tag 1 | Đơn OTA của khách Việt có SĐT: gửi được ZNS (khách đã giao dịch). Điều khoản OTA về liên hệ khách ngoài nền tảng **[Chưa xác minh]** – DOM rà |
| 2 | Nhắc trước 1 ngày: giờ nhận phòng, địa chỉ, chỉ đường, chỗ đỗ xe | D-1, 09:00–18:00 | **ZNS Tag 2** "Nhắc lịch": giờ nhận 14:00 (BR-401), địa chỉ dạng chữ, chỗ đỗ xe (chữ). Nút "Xem chỉ đường" → trang khách (US-108 có bản đồ) | Email; hộp thư OTA | Tùy chỉnh, Tag 2 | **Không** gắn nút Google Maps (500 đ, dễ bị soi) – bản đồ nằm trong trang khách. **Không** gửi mã cửa (SEC-07) |
| 3 | Hướng dẫn ngày đến | Ngày đến, 10:00 | Chỉ gửi nếu khách **đang trong cửa sổ chat OA** (tin tư vấn, miễn phí). Không thì **bỏ** – nội dung đã có ở bước 2 + trang khách | Không gửi riêng | – | Giảm số tin, giảm nguy cơ báo xấu |
| 4 | Chat và yêu cầu trong kỳ ở | Bất kỳ | **Chat OA 2 chiều** (OA Manager, giai đoạn 1). Yêu cầu dịch vụ vẫn ghi qua app khách (US-109) | Hộp thư OTA, WhatsApp/điện thoại như hiện nay | – | Nhân viên **không** xin ảnh giấy tờ qua Zalo; chuyển khách sang check-in online (mục 4.7) |
| 5 | Nhắc trả phòng (US-034, BR-425) | 20:00 hôm trước; 09:00 ngày trả nếu chưa trả lời | Trong cửa sổ chat → tin tư vấn. Ngoài cửa sổ → **ZNS Tag 2**, nút "Chọn giờ trả phòng" → trang khách (ở thêm / trả muộn / đúng giờ) | Email; hộp thư OTA | Tùy chỉnh, Tag 2 | Lần 09:00 chỉ gửi khi khách chưa chọn. 11:00 chưa trả lời → lễ tân gọi (BR-425, không gửi thêm tin) |
| 6 | Bill | Khi trả phòng (US-040, US-138) | **ZNS Tag 1** "Xác nhận thanh toán": mã bill, tổng tiền, đã trả. Nút "Xem chi tiết" → trang bill (mức 2, ADR-006). Khi đã phát hành hóa đơn điện tử: nút tra cứu (nút đầu 0 đ) | Email kèm PDF | Tùy chỉnh, Tag 1 | Còn nợ → mẫu **yêu cầu chuyển khoản** chỉ khi tài khoản nhận đứng tên doanh nghiệp (mục 2.2) |
| 7 | Cảm ơn + mời đánh giá + mã đặt trực tiếp (US-116) | Trả phòng + mốc cấu hình (vd. 2 giờ) | Tách 2 tin: (a) **ZNS Tag 2** cảm ơn + mời đánh giá (mẫu đánh giá dịch vụ 1–5 sao, hoặc nút về trang khách → chuyển tới trang đánh giá kênh khách đã đặt); (b) mã đặt trực tiếp chỉ gửi **khách đặt trực tiếp hoặc đang quan tâm OA**, bằng **mẫu voucher Tag 3** (400 đ) hoặc broadcast OA | Email | Tag 2 (+ Tag 3 tùy chọn) | Gộp mã giảm giá vào tin đánh giá → bị xếp Tag 3, vào Business Box. **Không** gắn mã giảm giá với việc để lại đánh giá (OTA và Google cấm đánh giá có thưởng – **[Chưa xác minh]** cho từng OTA, DOM rà) |
| 8 | Nhắc tiền thuê dài hạn + hóa đơn điện nước | 7 ngày và 1 ngày trước hạn kỳ (BR-425); điện nước mỗi tháng | **ZNS Tag 1** "Yêu cầu thanh toán" (mã HĐ, kỳ, số tiền, hạn) hoặc Tag 2 "nhắc lịch"; điện nước: Tag 1 (`msg.utility_bill`) | Email (khách dài hạn phần lớn nước ngoài) | Tag 1 | Khách dài hạn chat OA thường xuyên → nhiều tin đi bằng tin tư vấn miễn phí |

### 3.1 Danh sách mẫu ZNS cần đăng ký (bản tiếng Việt; UXD viết lại từ content-guide mục 7 theo quy định 2.2)
| Mã nội bộ (`templateKey`) | Tag | Loại mẫu | Tham số chính | Nút | Giá ước/tin (chưa VAT) |
|---|---|---|---|---|---|
| `zns.booking_confirmed` | 1 | Tùy chỉnh | `customer_name`, `booking_code`, `room_name`, `checkin_date`, `checkout_date`, `nights` | "Làm thủ tục trước" → `g.<tên-miền>/g/<token>` | 300 + 100 = 400 đ |
| `zns.arrival_reminder` | 2 | Tùy chỉnh | `customer_name`, `booking_code`, `checkin_date`, `checkin_time`, `address`, `parking_note` | "Xem chỉ đường" → trang khách | 400 đ |
| `zns.checkout_reminder` | 2 | Tùy chỉnh | `customer_name`, `booking_code`, `checkout_date`, `checkout_time` | "Chọn giờ trả phòng" → trang khách | 400 đ |
| `zns.payment_confirmed` | 1 | Tùy chỉnh (bảng) | `customer_name`, `bill_no`, `amount`, `paid`, `balance` | "Xem chi tiết" → trang bill | 400 đ |
| `zns.payment_request` | 1 | Yêu cầu chuyển khoản | `customer_name`, `contract_code`, `period`, `amount`, `due_date` | Chuyển khoản (0 đ) | 300 đ – **cần tài khoản nhận đứng tên doanh nghiệp** |
| `zns.utility_bill` | 1 | Tùy chỉnh (bảng) | `customer_name`, `contract_code`, `period`, `kwh`, `m3`, `amount`, `due_date` | "Xem chi tiết" | 400 đ |
| `zns.stay_feedback` | 2 | Đánh giá dịch vụ | `customer_name`, `booking_code`, `checkout_date` | (theo mẫu) | ~300 đ |
| `zns.direct_voucher` (tùy chọn) | 3 | Voucher | `customer_name`, `voucher_code`, `discount`, `expiry_date` | theo mẫu | 400 đ |

- Bản tiếng Anh: không cần ở MVP (khách nước ngoài ít dùng Zalo). Zalo cho phép mẫu một ngôn ngữ; mẫu thuần tiếng Anh có được duyệt không **[Chưa xác minh]**.
- Không bao giờ đưa **mã cửa, mã xác minh, số giấy tờ** vào ZNS (giữ quy tắc `integrations.md` 3.4).

## 4. Thiết kế tích hợp (trong khuôn ADR-011)

### 4.1 Hai kênh trong `NotificationAdapter`
| Kênh | Gửi bằng | `msg.to` | `templateId` | Ghi chú |
|---|---|---|---|---|
| `zalo_zns` | `POST /message/template` (SĐT) hoặc API gửi qua UID | SĐT chuẩn hóa `84…` (hoặc `uid:<id>`) | `templateKey` nội bộ → `template_id` Zalo qua **bảng ánh xạ** theo cơ sở (OWN cấu hình trong Desk, không đặt trong `.env`) | Chỉ mẫu `ENABLE` |
| `zalo_oa` | API gửi **tin tư vấn** (`openapi.zalo.me/v3.0/oa/message/cs` [Bên thứ ba – SDK; xác nhận lại trên tài liệu Zalo khi cài]) | UID | Nội dung tự do dựng từ content-guide (đa ngôn ngữ được) | Lõi chỉ gọi khi khách còn trong cửa sổ 7 ngày |

- Adapter `zalo/` cài cả hai kênh, dùng chung token. Chọn bằng `ZALO_PROVIDER = off | manual_copy | mock | zalo`. Production chặn `mock` (README 1.3).
- **Chọn kênh** (mục 3) nằm ở lõi (`NotificationService`), không ở adapter – giống quy tắc "adapter không tự quyết chính sách" của README 3.5.

### 4.2 Đề nghị đổi contract (gửi ARC – đổi chữ ký interface phải qua ARC)
| # | Đề nghị | Lý do |
|---|---|---|
| C1 | `NotificationResult.status` thêm `'rejected'` + `reason: 'no_account' \| 'opted_out' \| 'invalid_recipient' \| 'template_unavailable' \| 'quiet_hours' \| 'insufficient_balance'` | Lõi biết chuyển kênh dự phòng ngay, không retry vô ích |
| C2 | Thêm `verifyDeliveryEvent(ctx, req: InboundHttp): Promise<{ ok: true; events: { providerMsgId: string; trackingId?: string; state: 'delivered'\|'seen'; at: IsoInstant }[] } \| { ok: false; reason: 'invalid_signature'\|'malformed' }>` | Nhận webhook `user_received_message` / đã xem |
| C3 | Thêm `queryStatus(ctx, providerMsgId): Promise<'unknown'\|'accepted'\|'delivered'>` | Đối soát khi webhook không về |
| C4 | `NotificationResult.costUnits?: number` (đồng, chưa VAT) | Ghi `integration_log.cost_units` để báo chi phí tháng |
| C5 | **Giai đoạn 2** (không làm ở R3 nếu chưa duyệt): interface mới `ConversationAdapter { verifyInbound(ctx, req); sendReply(ctx, uid, text\|image); fetchProfile(ctx, uid) }` | Hộp thư Zalo trong Desk (mục 4.9) |

### 4.3 Khóa và token – bí mật do INV sở hữu
- **Bí mật tĩnh** (INV tự điền vào `.env`/Docker secret, không bao giờ gửi qua chat): `ZALO_APP_ID`, `ZALO_APP_SECRET` (header `secret_key`), `ZALO_OA_ID`, `ZALO_OA_SECRET_KEY` (khóa bí mật OA để kiểm `X-ZEvent-Signature` – tên trên giao diện Zalo **[Chưa xác minh]**).
- **Token xoay vòng** (access 25 giờ, refresh 3 tháng, dùng 1 lần) **không thể** để trong `.env` vì đổi mỗi ngày. Đề xuất (ARC + SEC duyệt):
  1. Lưu ở bảng `integration_credential` (ADR-011 B8 – làm sớm cho riêng Zalo), cột token **mã hóa** bằng khóa riêng cho mục đích này (`INTEGRATION_TOKEN_KEK`; không dùng chung `DATA_KEK_CURRENT` – quy tắc "một khóa một mục đích" của `.env.example`).
  2. **Một** job làm mới chạy trong worker, khóa bằng `pg_advisory_lock` (hai tiến trình cùng làm mới sẽ làm mất token của nhau). Làm mới khi còn < 2 giờ. Ghi token mới **trong cùng giao dịch** trước khi dùng.
  3. Làm mới thất bại 3 lần, hoặc refresh token còn < 7 ngày mà không làm mới được → `healthCheck` = `down`, báo đỏ OWN "Kết nối lại Zalo". Mọi tin chuyển kênh dự phòng.
  4. Kết nối lần đầu / kết nối lại: OWN bấm "Kết nối Zalo OA" trong Desk → OAuth v4 PKCE → callback `GET /v1/integrations/zalo/oauth/callback` (kiểm `state`, `code_verifier` lưu phía server 10 phút). **Không** có màn nhập token bằng tay.
  5. Không ghi token vào log, `integration_log`, thông báo lỗi. Audit `security` mỗi lần kết nối/kết nối lại.
- Thêm dòng vào bảng bí mật `integrations.md` 4.1 (OPS ghi sổ bí mật): App Secret, OA secret key – chủ sở hữu INV (OWN), xoay 12 tháng hoặc khi nghi lộ; refresh token – tự xoay, thu hồi bằng cách gỡ quyền App trong OA.

### 4.4 Outbox, thử lại, chống gửi trùng
- Lõi ghi `outbox_message(topic='notification.send')` cùng giao dịch nghiệp vụ. Payload **chỉ chứa tham chiếu** (mã đơn, `templateKey`, ngày gửi dự kiến) – nội dung và SĐT dựng lúc gửi (SEC-09).
- `dedupe_key = <bookingId>:<templateKey>:<ngày-mốc>` → một mốc nhắc chỉ có một tin dù job chạy lại.
- `tracking_id` gửi Zalo = id outbox (≤ 48 ký tự) → đối soát webhook.
- **Giờ gửi**: mọi tin tự động trong 08:00–21:00 giờ cơ sở (`ZALO_SEND_WINDOW`, tham số DOM chốt). Ngoài khung → `next_attempt_at` = 08:00 sáng hôm sau.
- **Thử lại** (theo ADR-011: 5 lần, lùi cấp số nhân): chỉ với lỗi mạng **trước khi** request tới Zalo, `-100`, `-144`/`-147`, `-124` (sau khi làm mới token).
- **Hết thời gian chờ sau khi đã gửi** (không biết Zalo nhận chưa): **không** gửi lại ngay. Đánh dấu `unconfirmed`; chờ webhook theo `tracking_id`; sau 30 phút gọi `queryStatus` nếu có `msg_id`; không có gì sau 24 giờ → coi là thất bại, **không** gửi lại tin đã quá mốc. Zalo không có khóa chống trùng → gửi trùng còn tệ hơn mất một tin nhắc (khách báo xấu → hạ chất lượng OA).
- Lỗi không thử lại (mục 2.8) → `rejected` → lõi chuyển kênh kế tiếp ngay.

### 4.5 Trạng thái gửi và chi phí
- Bảng đề xuất (ARC chốt tên): `notification_delivery(id, outbox_id, property_id, booking_id, channel, template_key, provider_msg_id, status: queued|sent|unconfirmed|delivered|seen|rejected|failed|fallback, reject_reason, cost_units, sent_at, delivered_at)`.
- Desk hiện trên chi tiết đơn: "Đã gửi Zalo 09:02 · đã tới máy 09:02" hoặc "Không gửi được Zalo – đã gửi email".
- Báo cáo tháng: số tin theo kênh, tổng `cost_units` (DATA dùng cho chi phí kênh).
- Cảnh báo OWN khi số dư ZBS thấp: API số dư **[Chưa xác minh]** → tạm dùng ước tính từ `cost_units` cộng dồn so với số tiền OWN khai báo đã nạp.

### 4.6 Webhook vào
- Đường dẫn chung ADR-011: `POST /v1/webhooks/zalo/{propertySlug}` (thêm `zalo` vào enum `provider` của OpenAPI – ARC).
- Kiểm `X-ZEvent-Signature` (so sánh thời gian hằng số), ghi `inbox_message` với khóa duy nhất (`msg_id` + `event_name`), **trả 200 trong < 2 giây** (Zalo yêu cầu), worker xử lý sau.
- Webhook của ZNS có cùng cơ chế chữ ký không: **[Chưa xác minh]**. Nếu không ký → coi là tín hiệu và xác nhận lại bằng `queryStatus` (đúng nguyên tắc B4 của ADR-011).
- Zalo tự hủy webhook sau ~1 giờ lỗi liên tục → OPS thêm theo dõi: không nhận sự kiện nào trong 24 giờ trong khi có tin đã gửi → cảnh báo.

### 4.7 Opt-out và dữ liệu cá nhân
- Hồ sơ khách thêm `contact_prefs`: `zalo_transactional` (mặc định bật – thực hiện hợp đồng lưu trú), `zalo_marketing` (mặc định **tắt** – chỉ bật khi khách đồng ý rõ, ví dụ ô chọn ở check-in online hoặc khách follow OA), `zalo_unreachable_until`.
- Zalo trả `-139`/`-141` → tự tắt `zalo_transactional` + ghi lý do. Khách nhắn "không nhận tin" trong chat → lễ tân tắt trong Desk.
- Tin Tag 3 (voucher) chỉ khi `zalo_marketing` bật. Cơ sở pháp lý cho tin quảng cáo (Luật BVDLCN 91/2025; quy định chống tin nhắn rác) → **SEC xác nhận** [Chưa xác minh].
- Zalo/VNG là **bên xử lý dữ liệu** mới (tên, SĐT, mã đơn, ngày lưu trú) → SEC thêm vào danh sách bên xử lý (RI9). Dữ liệu đi tới doanh nghiệp Việt Nam, hợp hướng ESC-002 A; vị trí máy chủ **[Chưa xác minh]**.
- **Chat OA trên điện thoại cá nhân** của nhân viên: nội dung chat là C1/C2, **không** được thành C3. Quy tắc vận hành (DOM + SEC chốt): không xin và không nhận ảnh giấy tờ qua Zalo; khách gửi tới → trả lời bằng link check-in online, không tải ảnh về máy; đã gửi thì nhắc khách thu hồi tin.

### 4.8 Link khách trong tin tự động – cần ARC/SEC quyết
- ADR-006: DB chỉ lưu **băm** của `guest_access_token`; link chỉ hiện một lần cho lễ tân sao chép. Worker gửi tin tự động **không có** token gốc để gắn vào nút.
- Phương án INT đề xuất (ARC/SEC chọn):
  - **L-1 (INT đề xuất):** tin **đầu tiên** (bước 1) do worker **cấp** token ngay lúc gửi: sinh token, lưu băm, đưa token gốc vào tham số nút, không ghi token gốc ở đâu khác. Các tin sau (bước 2, 5, 6) cấp **link ngắn hạn riêng cho tin** (`purpose=notify`, mức 1, hết hạn 7 ngày, không tính vào giới hạn 2 token/đơn) trỏ về cùng đơn.
  - **L-2:** các tin sau dẫn về trang chung `g.<tên-miền>` kèm hướng dẫn "mở lại link trong tin xác nhận" – đơn giản hơn nhưng khách hay mất tin cũ.
  - **L-3:** lưu token gốc mã hóa – SEC từng không chọn cách này (ADR-006), INT không đề xuất.
- Zalo nhận URL có token trong nút (dữ liệu đi qua máy chủ Zalo). Token mức 1, thu hồi được – rủi ro như gửi link qua Zalo cá nhân hiện nay. SEC xác nhận.

### 4.9 Nhân viên xem chat OA
- **Giai đoạn 1 – OA Manager (không lập trình, làm ngay khi OA xác thực):**
  - Lễ tân/sale trả lời trên `oa.zalo.me/manager` (máy quầy) và mini app OA Manager (điện thoại). Gói Cơ bản: 3 tài khoản.
  - Gắn chat với đơn bằng tay: nhân viên hỏi mã đặt phòng, ghi chú vào đơn trong Desk. Yêu cầu dịch vụ (dọn phòng, sửa chữa) vẫn tạo trong Desk/app khách để vào luồng định tuyến (US-110).
  - Landing page (ESC-020 L2-A) và trang khách (`guest.contact.message`) dẫn tới **cùng OA** → khách nhắn OA = mở cửa sổ chat 7 ngày, các tin sau đi được bằng tin tư vấn miễn phí.
- **Giai đoạn 2 – Hộp thư Zalo trong Desk (đề xuất R4+, sau 1 tháng dùng giai đoạn 1):**
  - Cần gói Tăng trưởng (đã có nếu chọn ZNS tự động) + quyền "quản lý tin nhắn người dùng", "nhận sự kiện quản lý tin nhắn".
  - Webhook `user_send_*` + sự kiện "OA gửi tin cho người dùng" (để thấy cả tin nhân viên trả lời từ OA Manager) → `ConversationAdapter` → bảng hội thoại; gửi trả lời bằng tin tư vấn.
  - Gắn UID ↔ khách: (a) nhân viên chọn đơn cho hội thoại; (b) sự kiện "người dùng đồng ý chia sẻ thông tin" (có SĐT) khớp SĐT trên đơn – cách xin chia sẻ **[Chưa xác minh]**.
  - Ảnh khách gửi: **không tự tải về**; chỉ hiện link Zalo (tránh lưu C3 ngoài ý muốn). Phân quyền theo rbac (FD, SALE chỉ đơn của mình). SEC review bắt buộc.
  - Công sức ước 10–15 ngày-người (BE, FE, INT, QA) [Ước tính của đội].

### 4.10 Mock và test
- `MockZaloAdapter` có kịch bản cấu hình được (ADR-011 B10): `ok`, `no_account` (-118), `opted_out` (-141), `quiet_hours` (-133), `out_of_balance` (-115), `token_expired` (-124 rồi ok), `timeout_after_send`, `webhook_duplicate`, `webhook_bad_signature`.
- Test bắt buộc: không gửi trùng khi job chạy 2 lần; chuyển kênh dự phòng đúng thứ tự; dời tin ngoài khung giờ; token không xuất hiện trong log; hai worker cùng làm mới token chỉ một thắng.
- Thử thật: chế độ phát triển của ZBS (mẫu thử chỉ gửi quản trị viên) [Nguồn S29].

### 4.11 Biến môi trường đề xuất (chỉ tên – OPS đưa vào `product/.env.example`)
```
ZALO_PROVIDER=manual_copy        # off | manual_copy | mock | zalo   (thay giá trị 'zns' cũ)
ZALO_APP_ID=
ZALO_APP_SECRET=                 # header secret_key – INV giữ
ZALO_OA_ID=
ZALO_OA_SECRET_KEY=              # kiểm X-ZEvent-Signature – INV giữ
ZALO_OAUTH_REDIRECT_URL=         # https://desk.<tên-miền>/v1/integrations/zalo/oauth/callback
ZALO_SEND_WINDOW=08:00-21:00     # giờ cơ sở; DOM chốt
ZALO_MOCK_SCENARIO=ok
INTEGRATION_TOKEN_KEK=           # mã hóa token xoay vòng trong integration_credential; khóa riêng mục đích
```
Bảng ánh xạ `templateKey → template_id` lưu trong DB theo cơ sở (OWN cấu hình), không đặt trong `.env`.

## 5. Chi phí hằng tháng cho 10 căn

### 5.1 Giả định
| # | Giả định | Giá trị | Căn cứ |
|---|---|---|---|
| G1 | Số đơn ngắn ngày/tháng | 30 / 45 / 60 (thấp / vừa / cao) | Tháng 9: 154 đêm ngắn ngày, thời gian ở TB 2,2–4,1 đêm → ~50 đơn; tháng 10 đã có 46 đơn (baseline 5.11, mục "Vận hành"). Công suất mục tiêu 80% với 4–6 căn dài hạn → 32–48 đơn |
| G2 | Tỉ lệ khách Việt có SĐT dùng Zalo | 40% / 50% / 60% | **[GIẢ ĐỊNH – chờ INV xác nhận]** – brief chỉ ghi "nội địa và nhiều khách nước ngoài" |
| G3 | Số tin ZNS mỗi đơn | 4 / 5 / 5 | Bước 1, 2, 5 (1–2 lần), 6, 7 – mục 3; bước 3, 4 đi bằng chat |
| G4 | Khách dài hạn người Việt | 1 / 2 / 3 người × 3 tin/tháng | Bước 8 |
| G5 | Đơn giá ZNS | 400 đ chưa VAT = **440 đ có VAT** (mẫu 300 + nút trang doanh nghiệp 100) | Mục 2.4 – lấy bộ giá cao |
| G6 | Tin tư vấn ngoài 48 giờ | ≤ 50 tin/tháng | Gói Tăng trưởng có 500 tin miễn phí → 0 đ |

### 5.2 Kết quả
| Khoản | Thấp | Vừa | Cao |
|---|---|---|---|
| Tin ZNS ngắn ngày | 30 × 40% × 4 = 48 tin | 45 × 50% × 5 ≈ 113 tin | 60 × 60% × 5 = 180 tin |
| Tin ZNS dài hạn | 3 tin | 6 tin | 9 tin |
| Tiền tin (440 đ/tin) | ~22.000 đ | ~52.000 đ | ~83.000 đ |
| Gói Tăng trưởng (2.500.000 đ/năm) | 208.000 đ | 208.000 đ | 208.000 đ |
| Chat OA | 0 đ | 0 đ | 0 đ |
| **Tổng/tháng** | **~230.000 đ** | **~260.000 đ** | **~291.000 đ** |
| Tổng/năm | ~2,8 tr | ~3,1 tr | ~3,5 tr |

- Chỉ dùng **giai đoạn 1** (chat qua OA Manager, không tự động): **0 đ/tháng** (gói Cơ bản). Nếu nhắn ngoài 48 giờ: 55 đ/tin, cần nạp ví ZBS tối thiểu 50.000 đ.
- **Tiền mặt ban đầu** khi bật tự động: nạp ví ZBS ~2.600.000–2.800.000 đ (2,5 tr mua gói 1 năm + ~100–300 nghìn tiền tin). Không hoàn lại.
- Nếu gửi qua UID được (khách đã tương tác OA): giá mẫu ~210 đ thay 300 đ → tiết kiệm ~25% tiền tin. Không đổi tổng đáng kể vì gói chiếm > 70%.
- Gói Tiêu chuẩn (1 tr/năm) **không** đủ cho tự động (không có API).

### 5.3 So sánh với cách làm hiện nay (ESC-010 B – sao chép tay)
- 45 đơn × 5 tin × ~1,5 phút ≈ **5–6 giờ công lễ tân/tháng**, tin nhắc dễ bị quên ngoài giờ trực [Ước tính của đội].
- Tự động: ~260.000 đ/tháng + một lần ~12–16 ngày-người để làm (ESC-021 phương án A) [Ước tính của đội: INT adapter + token + webhook 4–5; BE chọn kênh, lịch gửi, opt-out, ánh xạ mẫu 4–6; FE cài đặt + trạng thái gửi 2–3; UXD mẫu tin 1–2; QA].

## 6. Việc INV phải làm, theo thứ tự

| # | Việc | Ai | Thời gian chờ | Cần trước khi |
|---|---|---|---|---|
| 1 | Xác nhận **loại hình kinh doanh** (doanh nghiệp hay hộ kinh doanh) và chuẩn bị giấy đăng ký kinh doanh bản đủ trang có dấu (đã chờ ở ESC-008) | INV | – | Bước 2 |
| 2 | **Tạo OA** tại `oa.zalo.me/manage/register` bằng Zalo cá nhân của INV (số +84). Tên OA theo Cách 1 hoặc 3 (mục 1.1). Ảnh đại diện, ảnh bìa theo nhận diện OTTIMO (UXD cung cấp) | INV | Nộp hồ sơ trong 14 ngày | Landing page lên mạng (ESC-020 L2) |
| 3 | **Nộp xác thực OA**; người đại diện pháp luật bấm xác nhận trên Zalo trong 48 giờ | INV | **2–3 ngày làm việc**, có thể lâu hơn | Mọi việc sau |
| 4 | Cài đặt OA: địa chỉ, giờ làm việc, hotline, lời chào tự động, menu; thêm 2 nhân viên làm quản trị viên chat | INV (UXD soạn nội dung) | 1 giờ | **Giai đoạn 1 chạy được từ đây** |
| 5 | **Tạo tài khoản ZBS** (tên tài khoản không đổi được – đặt theo tên doanh nghiệp), khai mã số thuế, **liên kết OA** | INV | Ngay | Bước 6–8 |
| 6 | **Nạp tiền** ZBS (tối thiểu 50.000 đ; khi bật tự động ~2,6–2,8 tr), tick "Yêu cầu hóa đơn" | INV | ~30 phút nếu chuyển khoản | Bước 7, 9 |
| 7 | **Đăng ký mẫu tin** (8 mẫu mục 3.1): đội soạn sẵn nội dung + tham số ví dụ, INV bấm gửi duyệt trong tài khoản ZBS. Tải logo 400×96 bản sáng/tối | Đội soạn, INV gửi | **1–3 ngày làm việc/lượt; dự trù 2 tuần** | Bật gửi tự động |
| 8 | **Tên miền** đứng tên OTTIMO (ESC-020 L4) – để nút trong mẫu dẫn về `g.<tên-miền>` được duyệt; hotline công khai trên landing page | INV | – | Bước 7 |
| 9 | **Mua gói Tăng trưởng** (2,5 tr/năm) từ số dư ZBS – **chỉ khi** đội bắt đầu tích hợp (đầu R3), vì gói không hoàn tiền | INV | Ngay | Bước 10 |
| 10 | **Tạo Zalo App** trên developers.zalo.me (INV đứng tên), liên kết App vào ZBS, điền `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_ID`, `ZALO_OA_SECRET_KEY` vào cấu hình máy chủ; bấm "Kết nối Zalo OA" trong Desk để cấp quyền | INV (OPS hướng dẫn) | 30 phút | Chạy thật |
| 11 | (Nếu muốn mẫu "yêu cầu chuyển khoản") tài khoản nhận tiền **đứng tên doanh nghiệp sở hữu OA** | INV | – | Mẫu `zns.payment_request` |

**Lịch đề xuất:** bước 1–4 **ngay trong Sprint 4** (cũng phục vụ landing page). Bước 5–8 **cuối Sprint 4** (mẫu được duyệt trước khi R3 bắt đầu). Bước 9–10 **tuần đầu R3**. Đi đúng lịch thì tin tự động chạy thật từ **Sprint 1 của R3**.

## 7. Rủi ro
| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| Z1 | OA không xác thực được (thiếu giấy đăng ký kinh doanh, tên OA không hợp lệ) | Không có chat OA, không ZNS | Làm bước 1–3 sớm; hỏi `oa@zalo.me` về ngành lưu trú; dự phòng giữ Zalo cá nhân + sao chép tay |
| Z2 | Mẫu bị từ chối nhiều lần | Chậm bật tự động | Soạn đúng quy định 2.2 ngay từ đầu; dự trù 2 tuần |
| Z3 | Khách báo xấu → hạ chất lượng, khóa mẫu | Mất kênh | Khung giờ 08:00–21:00, không gửi trùng, gộp bước 3 vào bước 2, Tag 3 chỉ khi khách đồng ý |
| Z4 | Refresh token hỏng (2 tiến trình cùng làm mới, máy chủ tắt > 3 tháng) | Ngừng gửi | Khóa advisory; cảnh báo sớm; nút kết nối lại; kênh dự phòng |
| Z5 | Ví ZBS hết tiền | Ngừng gửi | Cảnh báo theo chi phí cộng dồn; kênh dự phòng email/OTA/gửi tay |
| Z6 | Giá Zalo thay đổi (trang ghi "thay đổi theo từng thời kỳ") | Lệch chi phí | Ghi `cost_units`; báo cáo tháng; xem lại giá mỗi quý |
| Z7 | Nhân viên chat trên điện thoại cá nhân, khách gửi ảnh giấy tờ | Lộ C3 ngoài thiết bị cơ sở | Quy tắc 4.7; SEC rà; giai đoạn 2 không tự tải ảnh |
| Z8 | Điều khoản OTA cấm liên hệ/tiếp thị khách OTA ngoài nền tảng | Bị OTA phạt | DOM rà từng OTA; voucher chỉ cho khách trực tiếp hoặc đã follow OA |
| Z9 | Zalo đổi API/tên dịch vụ (vừa đổi ZNS → ZBS; mẫu tạo trước 10/12/2025 không gửi qua UID được) | Phải sửa adapter | Adapter tách biệt (ADR-011); theo dõi thông báo trên developers.zalo.me |

## 8. Câu hỏi mở
| # | Câu hỏi | Ai trả lời |
|---|---|---|
| Q1 | OTTIMO là doanh nghiệp hay hộ kinh doanh; tên trên giấy phép là gì (chọn cách xác thực OA) | INV (ESC-008, ESC-021) |
| Q2 | OTTIMO đã có Zalo OA chưa; nếu có: đã xác thực chưa, tên gì, ai là quản trị viên | INV (ESC-020 L2, ESC-021) |
| Q3 | Tỉ lệ khách Việt / nước ngoài thực tế (để chốt chi phí) | INV hoặc DATA từ dữ liệu tháng 9–10 |
| Q4 | Lưu trú có cần giấy phép ngành (ANTT) khi xác thực OA theo Cách 3 | Hỏi `oa@zalo.me` (INV gửi) |
| Q5 | Cách link khách được đưa vào tin tự động (L-1/L-2) | ARC + SEC (mục 4.8) |
| Q6 | Chốt khung giờ gửi, mốc nhắc, có bỏ bước 3 không | DOM (đang soạn hành trình) |
| Q7 | Điều khoản từng OTA về liên hệ khách ngoài nền tảng và đánh giá có thưởng | DOM |
| Q8 | Cơ sở pháp lý gửi tin Tag 3 (voucher); thêm Zalo vào danh sách bên xử lý dữ liệu | SEC |
| Q9 | Có dùng **mẫu xác thực ZNS** (400 đ) để gửi mã xác minh app khách (US-141) thay cho dán mã vào hội thoại OTA/Zalo (ESC-010 Z-A) không | SEC – tin đi thẳng tới Zalo của SĐT trên đơn, có thể an toàn hơn |
| Q10 | Webhook ZNS có chữ ký như webhook OA không; API xem số dư ZBS; gửi được số nước ngoài không; endpoint chính xác của tin tư vấn v3 | INT kiểm khi có App thật (R3) |

## 9. Quyết định kỹ thuật INT (đề nghị ORC ghi `decision-log.md` khi commit)
| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 17/10/2026 | 2 | Kênh `zalo_zns` dùng ZBS Template Message (tên mới của ZNS); `zalo_oa` dùng tin tư vấn; chọn kênh ở lõi theo thứ tự chat OA → ZNS → OTA → email → gửi tay | INT | Rẻ nhất trước; adapter không tự quyết chính sách |
| 17/10/2026 | 2 | Token Zalo xoay vòng lưu mã hóa trong `integration_credential`, một job làm mới có khóa advisory; App Secret/OA secret ở `.env` do INV điền | INT (chờ ARC/SEC duyệt) | Refresh token dùng 1 lần, đổi mỗi ngày |
| 17/10/2026 | 2 | Không tự gửi lại tin khi hết thời gian chờ sau khi đã gửi; đối soát bằng webhook/`queryStatus` | INT | Zalo không có khóa chống trùng; tin trùng gây báo xấu |
| 17/10/2026 | 2 | Tin tự động chỉ gửi 08:00–21:00 giờ cơ sở (tham số) | INT (DOM chốt giờ) | Lỗi `-133` 22:00–7:00; báo ngoài app 6:00–21:59 |

## 10. Nguồn (đọc ngày 17/10/2026)
- S1 – Bảng giá dịch vụ OA (áp dụng từ 01/06/2026): https://zalo.solutions/oa/pricing
- S2 – Bảng giá ZBS Template Message: https://zalo.solutions/business-message/pricing (https://zalo.cloud/zns/pricing chuyển hướng 301 sang https://zalo.solutions/zns/pricing)
- S3 – Giới thiệu ZBS Template Message: https://zalo.solutions/business-message/guidelines/intro
- S4 – Quy định chung khi kiểm duyệt mẫu: https://zalo.solutions/business-message/guidelines/quy-dinh-chung-khi-kiem-duyet-mau-zbs-template-message
- S5 – Cơ chế đánh giá chất lượng và quyền lợi gửi tin: https://zalo.solutions/business-message/guidelines/co-che-danh-gia-chat-luong-va-quyen-loi-gui-zbs-template-message
- S6 – Thiết lập tài khoản ZBS: https://zalo.solutions/business-message/guidelines/huong-dan-thiet-lap-tai-khoan-zbs
- S7 – Nạp tiền tài khoản ZBS (bài ngày 18/03/2026): https://zalo.solutions/blog/huong-dan-nap-tien-vao-tai-khoan-zalo-cloud-account-zca-/bdbp8pip6gg0jg2bgq4ay6uh
- S8 – Tạo mẫu tùy chỉnh (thời gian duyệt 1–2 ngày làm việc): https://zalo.solutions/business-message/guidelines/huong-dan-tao-zbs-template-message
- S9 – Cài đặt kỹ thuật trong mẫu: https://zalo.solutions/business-message/guidelines/cai-dat-ki-thuat-trong-mau-tin-nhan-zbs
- S10 – Nút CTA (tham số trong URL): https://zalo.solutions/business-message/guidelines/nut-thao-tac-cta
- S11 – Gửi qua API + webhook `user_received_message`: https://zalo.solutions/business-message/guidelines/gui-api
- S12 – Khởi tạo OA, loại tài khoản: https://oa.zalo.me/home/documents/guides/khoi-tao-zalo-official-account_61
- S13 – Hướng dẫn xác thực OA: https://oa.zalo.me/home/documents/guides/huong-dan-xac-thuc_70
- S14 – Xác thực Cách 1 / Cách 3: https://oa.zalo.me/home/documents/guides/xac-thuc-cach-1 ; https://oa.zalo.me/home/documents/guides/xac-thuc-cach-3
- S15 – OA Manager (web + mini app): https://oa.zalo.me/home/function/management
- S16 – OAuth v4, access/refresh token: https://developers.zalo.me/docs/official-account/bat-dau/xac-thuc-va-uy-quyen-cho-ung-dung-new
- S17 – Tổng quan tin nhắn OA: https://developers.zalo.me/docs/official-account/tin-nhan/tong-quan
- S18 – Điều kiện gửi tin tư vấn: https://developers.zalo.me/docs/official-account/tin-nhan/tin-tu-van/dieu-kien-gui-tin-tu-van
- S19 – Điều kiện gửi tin giao dịch (OA): https://developers.zalo.me/docs/official-account/tin-nhan/tin-giao-dich/dieu-kien-gui-tin-giao-dich
- S20 – Điều kiện gửi tin truyền thông: https://developers.zalo.me/docs/official-account/tin-nhan/tin-truyen-thong/dieu-kien-gui-tin-truyen-thong
- S21 – Giới hạn tốc độ API: https://developers.zalo.me/docs/official-account/phu-luc/gioi-han-toc-do-api
- S22 – Webhook OA (yêu cầu 2 giây, gửi lại, danh mục sự kiện): https://developers.zalo.me/docs/official-account/webhook/tong-quan
- S23 – Sự kiện người dùng gửi tin + chữ ký: https://developers.zalo.me/docs/official-account/webhook/tin-nhan/su-kien-nguoi-dung-gui-tin-nhan
- S24 – Giới thiệu ZBS Template Message API: https://developers.zalo.me/docs/zbs-template-message/bat-dau/gioi-thieu-zbs-template-message
- S25 – API gửi tin qua SĐT: https://developers.zalo.me/docs/zbs-template-message/gui-tin-template-qua-sdt/api-gui-tin-qua-sdt/api-gui-tin
- S26 – API trạng thái gửi tin qua SĐT: https://developers.zalo.me/docs/zbs-template-message/gui-tin-template-qua-sdt/api-truy-xuat-thong-tin-gui-tin-qua-sdt/api-lay-thong-tin-trang-thai-gui-tin-qua-sdt
- S27 – Quy định gửi tin qua UID: https://developers.zalo.me/docs/zbs-template-message/gui-tin-template-qua-uid/quy-dinh-gui-tin-qua-uid
- S28 – Giới thiệu Template (Tag, trạng thái, chất lượng): https://developers.zalo.me/docs/zbs-template-message/quan-ly-template/bat-dau/gioi-thieu-chung-ve-template
- S29 – Bảng mã lỗi ZBS: https://developers.zalo.me/docs/zbs-template-message/bang-ma-loi/
- Bên thứ ba (chỉ để đối chiếu, không dùng làm số liệu): endpoint tin tư vấn `openapi.zalo.me/v3.0/oa/message/cs` theo tài liệu SDK https://unpkg.com/@warriorteam/redai-zalo-sdk@1.11.1/docs/CONSULTATION_SERVICE.md
