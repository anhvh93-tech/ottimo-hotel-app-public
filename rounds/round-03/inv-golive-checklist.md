# OTTIMO Desk v1.0 – Việc anh/chị làm trước ngày chạy

- Dành cho: Chủ đầu tư | Lập: PO, 23/10/2026 | Đi kèm: `rounds/round-03/release-v1-plan.md`
- Ngày chạy dự kiến: **02–05/11/2026**. Anh/chị chọn ngày sau khi QC báo "Cổng v1.0 ĐẠT".
- **Quy tắc chung:** mật khẩu, mã 2 bước, mã khôi phục, số tài khoản và mật khẩu Wi-Fi **chỉ nhập trên app**. Không gửi qua chat, email hay Zalo cho đội. Đội không bao giờ hỏi những thứ này.

## A. Chuẩn bị – trước 31/10

| # | Việc | Ghi chú | Xong |
|---|---|---|---|
| A1 | Cài ứng dụng xác thực trên điện thoại (Google Authenticator, Microsoft Authenticator hoặc tương tự) | Dùng cho đăng nhập 2 bước | ☐ |
| A2 | Lập danh sách nhân viên và vai (quản lý, lễ tân, buồng phòng, bảo trì, sale) | Giữ ở OTTIMO, chỉ dùng để tạo tài khoản ở B5 | ☐ |
| A3 | Rà giá và chính sách trên staging: giá từng căn, cọc, phụ thu nhận sớm/trả muộn, giờ nhận/trả | Đội gửi bảng tham số đang dùng để anh/chị đánh dấu chỗ cần đổi | ☐ |
| A4 | Xác nhận **hạn lưu giấy tờ khách ở mức ngắn nhất** | DOM + SEC đưa bảng đề xuất. Anh/chị đã chấp nhận rủi ro pháp lý (23/10). Luật sư trả lời sau thì chỉ đổi số, không sửa phần mềm | ☐ |
| A5 | Hỏi Nhân Hòa về bản sao lưu tự động của hãng: giữ bao lâu, ở đâu. Đề nghị tắt, hoặc giữ tối đa 7 ngày | Bản chụp của hãng có cả dữ liệu khách | ☐ |
| A6 | **Tên miền:** thêm 3 bản ghi `desk`, `staff`, `g` của ottimo.vn trỏ về IP máy chủ đang dùng | Gửi đội ảnh chụp bảng bản ghi. Không gửi mật khẩu nhà đăng ký | ☐ |
| A7 | GitHub: bật môi trường `production`, anh/chị là người duyệt mỗi lần đưa bản mới lên | OPS gửi hướng dẫn từng bước | ☐ |
| A8 | Nhận **khóa giải mã sao lưu** từ OPS, cất 2 nơi ngoại tuyến (ví dụ USB ở két + bản giấy ở nơi khác). Có mặt buổi diễn tập khôi phục (khoảng 30 phút) | Mất khóa thì không mở được bản sao lưu | ☐ |
| A9 | **Email gửi thông báo:** làm theo phương án đội chốt trước 28/10 (mở tài khoản gửi email, hoặc đồng ý chỉ báo trong app) | ORC hỏi riêng nếu phát sinh chi phí | ☐ |
| A10 | Dùng thử trên staging theo `product/docs/uat-script.md` (ít nhất 8/10 việc). Gặp lỗi gõ `/feedback` | Staging chỉ có dữ liệu giả. Không quét QR để chuyển tiền thật | ☐ |
| A11 | Chuẩn bị danh sách **đơn đã nhận từ ngày chạy trở đi**, cọc đã thu, khách đang ở, công nợ cũ | Giữ trong sổ của OTTIMO. Nhập ở B7, theo hướng dẫn chuyển đổi của DOM | ☐ |

## B. Trên bản thật – sau khi đội báo "production sẵn sàng", trước giờ mở bán

Làm theo thứ tự. Nên xong B1–B6 **ít nhất 1 ngày trước ngày chạy**, vì tài khoản nhận tiền chỉ có hiệu lực từ ngày hôm sau.

| # | Việc | Ghi chú | Xong |
|---|---|---|---|
| B1 | Đăng nhập tài khoản chủ, đổi mật khẩu, **đăng ký 2 bước**, cất **10 mã khôi phục** | Chép ra giấy, cất 2 nơi tách khỏi điện thoại. Không chụp ảnh, không lưu trên điện thoại | ☐ |
| B2 | **Tài khoản nhận VietQR:** nhập ngân hàng, số tài khoản, tên chủ tài khoản ở màn "Tài khoản nhận chuyển khoản" | Gõ hai lần, xác thực lại bằng mã 2 bước. Hiệu lực từ ngày mai | ☐ |
| B3 | Kiểm VietQR bằng app ngân hàng của anh/chị: tạo một đơn thử ghi chú "TEST", quét QR, xem **tên chủ tài khoản đúng**, rồi hủy đơn thử | Làm sau khi tài khoản có hiệu lực | ☐ |
| B4 | Nhập **mật khẩu Wi-Fi** mạng chung "OTTIMO BOUTIQUE STAY" | Khách thấy trên trang của đơn | ☐ |
| B5 | Nhập/kiểm **giá và tham số** theo A3 | | ☐ |
| B6 | **Tạo tài khoản nhân viên** theo A2. Đưa mật khẩu tạm tận tay. Mỗi quản lý đăng ký 2 bước ngay lần đăng nhập đầu | | ☐ |
| B7 | Nhập đơn tương lai, cọc đã thu, khách đang ở, công nợ cũ theo A11 | Lễ tân trưởng làm cùng | ☐ |
| B8 | Báo đội "đã xong B1–B7" → OPS bật **bắt buộc 2 bước** → anh/chị và quản lý đăng nhập lại để kiểm | Bật sau cùng để không ai bị khóa ngoài | ☐ |
| B9 | Ngày chạy: giữ **sổ giấy dự phòng 3 ngày đầu** (đơn, thu tiền) | Phòng khi mất mạng/mất điện | ☐ |

## C. Khi có sự cố

- Gõ `/feedback <mô tả>` và nêu rõ: căn, mã đơn, giờ, đã bấm gì. Ảnh chụp màn hình nếu có, **che** số giấy tờ và số tài khoản.
- Không đặt, nhận, trả phòng hay thu tiền được, hoặc **số tiền sai**: ghi chữ **"P0"** ở đầu. Đội sửa trong ngày. Trong lúc chờ, ghi sổ giấy.
- Lỗi khác được gom vào bản vá hằng tuần. Đội báo lại: đã sửa gì, ở phiên bản nào, cách kiểm tra.
