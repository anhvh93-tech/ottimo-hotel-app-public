# OTTIMO Desk v1.0 – Việc anh/chị làm trước ngày chạy

- Dành cho: Chủ đầu tư | Lập: PO, 23/10/2026 | **Cập nhật: PO, 26/10/2026** (theo bảng kiểm QC `rounds/round-03/qc/v1-gate-checklist.md` mục 5; tối 26/10 thêm A12 – giờ nhận phòng 12:00 trên OTA, Google Maps, FB-INV-004)
- Đi kèm: `rounds/round-03/release-v1-plan.md` · `product/docs/uat-script.md` · `product/docs/day-one-guide.md` · `product/docs/staff-one-pager.md` · hướng dẫn kỹ thuật của OPS `rounds/round-03/outputs/OPS/inv-production-steps.md`
- Ngày chạy dự kiến: **02–05/11/2026**. Anh/chị chọn ngày sau khi QC báo "Cổng v1.0 ĐẠT". Đội đề xuất **thứ Hai hoặc thứ Ba**, ngày có ít khách đang ở nhất (lý do ở `day-one-guide.md` mục 1).
- **Quy tắc chung:** mật khẩu, mã 2 bước, mã khôi phục, số tài khoản, khóa sao lưu, KEK và mật khẩu Wi-Fi **chỉ nhập trên app hoặc máy của anh/chị**. Không gửi qua chat, email hay Zalo cho đội. Đội không bao giờ hỏi những thứ này.

## Tóm tắt thời gian của anh/chị

| Phần | Khi nào | Thời gian |
|---|---|---|
| A. Việc lẻ, tự làm lúc tiện | Trước buổi B1 (A12: trước ngày chạy) | khoảng 2 giờ 20 phút, chia nhỏ |
| **Buổi B1 – trên staging** | Sớm nhất 27–28/10, khi đội báo "B1 sẵn sàng" | **khoảng 3 giờ** (2 giờ 40 phút nếu đã trả lời trước mục A3, A4, A6, A11) |
| **Buổi B2 – trên bản thật** | 30/10–01/11, ít nhất 1 ngày trước ngày chạy | **khoảng 1 giờ 40 phút** |
| C. Sau B2 | Hôm sau B2 và ngày chạy | 5 phút + buổi chuyển đổi (theo `day-one-guide.md`) |

Đội đã chuyển ra khỏi hai buổi mọi việc không cần anh/chị có mặt. Phần "Đội làm trước" ở mỗi buổi là điều kiện để buổi bắt đầu.

## Đã xong

| # | Việc | Xong ngày |
|---|---|---|
| A6 (cũ) | Tên miền: bản ghi `desk`, `staff`, `g` của ottimo.vn trỏ về máy chủ | 26/10 |
| A7 (cũ) | GitHub: môi trường `production`, anh/chị là người duyệt; khóa deploy và 3 secret `PRODUCTION_SSH_*` (phần 9.1–9.2) | 23/10 và 26/10 |
| A9 (cũ) | Email gửi thông báo: Google Workspace SMTP relay theo IP máy chủ, không mật khẩu. Còn thư thử ở buổi B2 | 26/10 |
| – | Duyệt deploy staging `v1.0.0-rc.1` và lượt Release production đầu tiên | 26/10 |
| – | Landing concept B lên ottimo.vn | 25/10 |

## A. Việc lẻ – tự làm, không cần buổi

| # | Việc | Thời gian | Ghi chú | Xong |
|---|---|---|---|---|
| A1 | Cài ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự) | 5 phút | Dùng ở B1 và B2. Quản lý (nếu có) cũng cài | ☐ |
| A2 | Lập danh sách nhân viên và vai (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale) | 10 phút | Giữ ở OTTIMO, không gửi đội. Dùng ở B2 phần 4 | ☐ |
| A3 | **Trả lời 8 câu của DOM** (giá trị khởi tạo – `rounds/round-03/outputs/DOM/v1-production-defaults.md` mục 3): hạng 6 căn Studio, tên phòng trên Desk, phí từng kênh OTA, VAT 8 %, giá điện nước, Tết 2027, hạn lưu giấy tờ, các mục chờ luật sư/kế toán | 15 phút | Trả lời trong chat bằng số câu, ví dụ "câu 1 đồng ý". Không có số tài khoản hay bí mật trong các câu này. Chưa kịp thì trả lời ở B1 phần 4 | ☐ |
| A4 | **Hạn lưu giấy tờ ngắn nhất** (câu 7 của A3): ảnh 1 ngày sau trả phòng; khai báo chưa xong giữ tối đa 2 ngày; hồ sơ điền sẵn 3 tháng | – | Anh/chị đã chấp nhận rủi ro pháp lý (23/10). Luật sư trả lời sau thì chỉ đổi số, không sửa phần mềm | ☐ |
| A5 | Hỏi Nhân Hòa về bản sao lưu tự động của hãng: giữ bao lâu, ở đâu. Đề nghị tắt, hoặc giữ tối đa 7 ngày | 10 phút | Bản chụp của hãng có cả dữ liệu khách | ☐ |
| A6 | **Quyết ESC-030** – form "Yêu cầu đặt phòng" trên ottimo.vn có bật ngày chạy khi luật sư chưa trả lời không (`02-escalations/ESC-030.md`) | 5 phút | Đội đề xuất **A**: Desk chạy trước, form bật khi luật sư trả lời. Chưa quyết thì form giữ tắt, Desk vẫn chạy | ☐ |
| A7 | **Báo động miễn phí** (phần 6 của hướng dẫn OPS): tạo Healthchecks.io, UptimeRobot, phòng Google Chat; gửi địa chỉ ping/webhook theo kênh riêng OPS chỉ | 20 phút | Không chặn deploy, nhưng là điều kiện cho **ngày chạy**: không có báo động thì đội không biết khi hệ thống sập | ☐ |
| A8 | **Cất khóa sao lưu production** (phần 9.3): trình quản lý mật khẩu + một bản ngoại tuyến (USB mã hóa hoặc giấy, cất két) | 10 phút | Tệp đã có trên Mac của anh/chị. Mất khóa thì không mở được bản sao lưu | ☐ |
| A9 | Duyệt lại lượt Release production khi OPS báo (phần 5, phần 10 nếu OPS còn cần) | 2–5 phút mỗi lần | Email "Review deployments" từ GitHub | ☐ |
| A10 | Chuẩn bị **danh sách chuyển đổi**: đơn từ ngày chạy trở đi, cọc đã thu, khách đang ở, khách dài hạn, công nợ cũ – theo mẫu cột ở `day-one-guide.md` mục 3 | 30–45 phút, cùng lễ tân trưởng | Giữ trong sổ của OTTIMO, không gửi đội. Xong **trước ngày D−1** | ☐ |
| A11 | **Quyết ESC-031** – khách rời sau 18:00 khi đêm đó căn đã có khách đến: bản thật bật 2 bước nên quản lý không xác nhận bằng mật khẩu tại quầy được; vá theo ESC-024 B ở v1.0.1, trước ngày chạy, hay chờ v1.1 (`02-escalations/ESC-031.md`) | 5 phút | Đội đề xuất **A**: chạy đúng lịch, vá ở v1.0.1 tuần đầu. Chưa quyết thì đội không chạm mã tiền, lễ tân dùng cách tạm trong `staff-one-pager.md` | ☐ |
| A12 | **Đổi giờ nhận phòng sang 12:00 ngoài Desk** (F10 – theo quyết định của anh/chị 26/10, FB-INV-004): (1) extranet **Booking.com, Agoda, Airbnb**: giờ nhận phòng "từ 12:00", giờ trả 12:00, và câu trong nội quy/house rules: "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00"; (2) **Google Maps** (hồ sơ doanh nghiệp Google), fanpage, thẻ trong căn, biển quầy, e-brochure: cùng câu, bản tiếng Việt "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00". **Không** ghi "phòng sẵn sàng từ 12:00". (3) **Trước khi đăng giá "Chỉ từ 667.000 đ/đêm"** trên ottimo.vn: đọc điều khoản ngang giá (rate parity) trong hợp đồng Booking.com và Agoda – giá công khai trên website có được thấp hơn giá trên kênh không (ESC-035) | 30–40 phút | **Phần (1) xong trước ngày chạy D (02/11)**: kênh OTA chưa đổi thì Desk vẫn đề xuất phụ thu nhận sớm trước 12:00 nhưng chưa có căn cứ thu với khách đặt qua kênh đó (BR-415). Phần (3) không chặn ngày chạy – giá "chỉ từ" lên ở bản landing sau ngày D. Nếu đã đăng ký mẫu ZNS với Zalo có chữ "Giờ nhận phòng", báo đội để INT soạn lại theo câu trên | ☐ |

## B1. Buổi trên staging – khoảng 3 giờ

**Đội làm trước (anh/chị không phải làm):**
- Đổi tên tài khoản nhận thử trên staging thành "STAGING KHONG CHUYEN TIEN" (SEC E.13).
- Tạo **tài khoản chủ dùng thử** riêng cho anh/chị trên staging (không dùng `qa.owner`). Mật khẩu tạm đưa tận tay hoặc qua kênh riêng; anh/chị đổi ngay ở phần 1.
- SEC đọc trước bản thủ tục 06.33 (ngoài repo).
- QA và DOM dựng sẵn **dữ liệu mẫu cho UAT** trên staging: một đơn chờ nhận phòng, một đơn đang ở chờ trả phòng, một căn cần dọn, một khoản công nợ. Anh/chị không phải tạo từ đầu.
- QA-3 (hồi quy trên `v1.0.0-rc.1`) đã chạy, không còn lỗi P0/P1 mở.

**Ai có mặt:** anh/chị; quản lý thật (nếu OTTIMO có); **một người chứng kiến thật** cho phần 2 (ví dụ lễ tân trưởng hoặc kế toán); ORC, OPS, SEC (chứng kiến, không giữ mã). Lễ tân trưởng nên có mặt ở phần 3.

| Phần | Thời lượng | Anh/chị làm gì | Gỡ dòng QC |
|---|---|---|---|
| 1 | 15 phút | Đăng nhập `desk.staging.ottimo.vn` bằng tài khoản dùng thử, đổi mật khẩu tạm, **đăng ký 2 bước**, cất 10 mã khôi phục (bản thử, không dùng cho bản thật). Quản lý thật làm như vậy. SEC chứng kiến qua màn hình, không xem mã. Đây cũng là UAT việc 1 | G2-4 |
| 2 | 30 phút | **Diễn tập thủ tục 06.33** (khôi phục khi mất cả điện thoại lẫn mã khôi phục) cùng người chứng kiến. OPS ghi biên bản chỉ có kết quả | G2-5 |
| 3 | 1 giờ 45 phút | **UAT việc 2–9** (`product/docs/uat-script.md`). Lễ tân trưởng làm song song việc 7 và 9 trên điện thoại. Gặp lỗi gõ `/feedback` | A10 cũ, G6-1, G6-2 |
| 4 | 10–30 phút | Chốt **8 câu DOM**, **ESC-030** và **ESC-031**: nếu đã trả lời ở A3, A6, A11 thì chỉ đọc lại bảng đội tổng hợp (10 phút); chưa thì trả lời tại đây (30 phút) | G6-7, G7-2 |
| 5 | 0–20 phút | Nếu chưa làm A7, A8: làm tại đây cùng OPS | G4-10, G4-6 |

Không bắt buộc, làm riêng: UAT việc 10 sau 00:00 (20 phút, anh/chị hoặc lễ tân trưởng). CI đã có ca kiểm giờ đêm.

**Sau B1, đội làm (không cần anh/chị):** sửa lỗi P0/P1 nếu UAT phát hiện; DOM và QA **diễn tập chuyển đổi** trên staging bằng dữ liệu giả theo `day-one-guide.md`, sửa hướng dẫn nếu Desk chặn chỗ nào; OPS chuẩn bị `production-bootstrap`, chạy sẵn bản sao lưu đầu tiên và kéo về Mac cho phần 5 của B2.

## B2. Buổi trên bản thật – khoảng 1 giờ 40 phút

**Khi nào:** sau khi app production chạy và smoke đạt, SEC xác nhận các bản sửa OPS-01, QA-3 xong. **Ít nhất 1 ngày trước ngày chạy**, vì tài khoản nhận tiền có hiệu lực từ hôm sau. Dự kiến 30/10–01/11.

**Ai có mặt:** anh/chị; quản lý thật (nếu có); ORC, OPS, SEC, QA.

**Bắt buộc 2 bước đã bật từ đầu** trên bản thật (khác bản 23/10): cơ sở dữ liệu trống, nên chủ và quản lý **phải đăng ký 2 bước ngay lần đăng nhập đầu**, không ai bị khóa ngoài. Không còn bước "bật 2 bước sau cùng".

| Phần | Thời lượng | Anh/chị làm gì | Gỡ dòng QC |
|---|---|---|---|
| 1 | 20 phút | OPS chạy `production-bootstrap`, anh/chị ngồi cạnh. Mật khẩu tạm chỉ hiện trên màn hình máy chủ. Đăng nhập `desk.ottimo.vn`, đổi mật khẩu, **đăng ký 2 bước**, cất **10 mã khôi phục thật** (chép ra giấy, cất 2 nơi tách khỏi điện thoại; không chụp ảnh, không lưu trên điện thoại) | G2-7 |
| 2 | 10 phút | Chép **KEK** production ra bản ngoại tuyến (phần 4b) – trước khi có dữ liệu thật. Không chụp ảnh, không gửi chat | G4-8 |
| 3 | 20 phút | **Tài khoản nhận VietQR thật** ở "Tài khoản nhận chuyển khoản" (gõ hai lần, xác thực lại bằng mã 2 bước; hiệu lực từ ngày mai). **Mật khẩu Wi-Fi** mạng "OTTIMO BOUTIQUE STAY". **Giá và tham số** theo câu trả lời A3, gồm hạn lưu A4 | G7-6, G6-7 |
| 4 | 20 phút | **Tạo tài khoản nhân viên** theo A2 (màn "Người dùng & vai"). Đưa mật khẩu tạm tận tay. Quản lý đăng ký 2 bước ngay | G2-7 |
| 5 | 15 phút | **Diễn tập khôi phục sao lưu**: OPS đã chạy sẵn bản sao lưu và kéo về Mac; anh/chị mở khóa sao lưu trên Mac. OPS chạy phần còn lại một mình và gửi biên bản khớp số | G4-7, G4-5 |
| 6 | 15 phút | Mở hộp thư, xác nhận có thư "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email" (thư thử 8b, hộp `info@ottimo.vn`, xem cả Spam). QA và SEC kiểm trên bản thật; anh/chị **đăng xuất rồi đăng nhập lại** để thấy app đòi mã 6 số | G4-9, G5-5, G7-5 |

Sau B2, QC chấm cổng v1.0. Nếu ĐẠT, anh/chị chọn ngày chạy.

## C. Sau B2 và ngày chạy

| # | Việc | Khi nào | Ghi chú | Xong |
|---|---|---|---|---|
| C1 | **Kiểm VietQR** bằng app ngân hàng: tạo một đơn thử ghi chú "TEST", quét QR, xem **tên chủ tài khoản đúng**, **không chuyển tiền**, rồi hủy đơn thử | Hôm sau B2 (tài khoản đã có hiệu lực), 5 phút | Tên sai thì báo ngay "P0" | ☐ |
| C2 | **Chuyển đổi dữ liệu** (đơn, cọc, khách đang ở) cùng lễ tân trưởng | Chiều D−1 và 14:00 ngày D | Theo `product/docs/day-one-guide.md` | ☐ |
| C3 | Phát **hướng dẫn 1 trang** cho lễ tân và buồng phòng, cho mỗi người đăng nhập thử một lần | D−1 | `product/docs/staff-one-pager.md` | ☐ |
| C4 | Ngày chạy: giữ **sổ giấy dự phòng 3 ngày đầu** (đơn, thu tiền), đối chiếu mỗi tối | D, D+1, D+2 | Phòng khi mất mạng/mất điện | ☐ |
| C5 | Form website: bật theo phương án ESC-030 anh/chị chọn | Theo ESC-030 | Bật trên Desk ở màn Tham số, 1 phút | ☐ |

## D. Khi có sự cố

- Gõ `/feedback <mô tả>` và nêu rõ: căn, mã đơn, giờ, đã bấm gì. Ảnh chụp màn hình nếu có, **che** số giấy tờ và số tài khoản.
- Không đặt, nhận, trả phòng hay thu tiền được, hoặc **số tiền sai**: ghi chữ **"P0"** ở đầu. Đội sửa trong ngày. Trong lúc chờ, ghi sổ giấy.
- Lỗi khác được gom vào bản vá hằng tuần (deploy thứ Tư, 09:30–10:30). Đội báo lại: đã sửa gì, ở phiên bản nào, cách kiểm tra.
