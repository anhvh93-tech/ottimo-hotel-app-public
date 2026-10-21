# Tổng kết Round 2 – Xây dựng lõi MVP

- Người soạn: PO (cùng ORC) | Ngày: 20/10/2026 | **BẢN NHÁP – chưa có kết quả QC cuối.** Cổng QC Sprint 4 chấm lần 3 sau lượt kiểm tra ban đêm 21/10; QC Round 2 chưa chạy. Mọi chỗ ghi **[CHỜ QC]** sẽ điền khi có kết quả.
- Nguồn: `01-decisions/decision-log.md` (17–20/10), `02-escalations/`, `rounds/round-02/qc/s4-qc-gate.md`, `qa/bug-list.md`, `reviews/s4-money-recheck8.md`, `03-backlog/backlog.md` mục 5.5, `pending-for-INV.md`, `outputs/OPS/s4-env-0076.md`.

---

## 1. Kết quả chính

- **Desk cho lễ tân chạy trọn một ngày làm việc:** sơ đồ phòng → đặt/giữ chỗ → thu cọc bằng mã QR → nhận phòng (giấy tờ, khai báo lưu trú) → gia hạn, đổi phòng, phát sinh, trả muộn → trả phòng, in bill, thu tiền, hoàn tiền, công nợ. Chống đặt trùng phòng ở máy chủ, kể cả khi hai người lưu cùng lúc.
- **Tiền đã được kiểm kỹ nhất:** 8 lượt kiểm tiền độc lập, số lỗi tiền nghiêm trọng giảm dần 11 → 6 → 5 → 3 → 5 → 3 → 1 → 1 → **0**; không còn lỗi tiền mức P0/P1 mở. Ba lỗi tiền nhỏ (đều tính thiếu, không tính thừa khách) làm đầu Round 3.
- **App buồng phòng trên điện thoại** (việc hôm nay, trạng thái buồng, kiểm phòng, báo sự cố) và **trang khách** (mở bằng link/QR, check-in online, xem thông tin lưu trú, gửi yêu cầu) bằng tiếng Việt và tiếng Anh.
- **Landing page ottimo.vn – bản mẫu v1.2.1** theo Brand Guidelines (tông kem – gỗ sồi, Lora + Be Vietnam Pro). Chưa lên mạng: chờ tên miền, máy chủ và anh/chị duyệt nội dung (mục 4.6).
- **Mã nguồn công khai, kiểm tra tự động miễn phí** (theo quyết định của anh/chị 18–19/10): mỗi lần gộp mã chạy gần 2.000 ca bấm thử trên trình duyệt và gần 3.000 ca kiểm phía máy chủ. Lượt kiểm tra ban đêm đã bắt được một lỗi thật: sau nửa đêm, app buồng phòng không tải được và Desk có chỗ tính thêm một đêm. Đã sửa ngày 20/10.
- **Chưa có:** máy chủ chạy thử (staging) vì còn chờ VPS + tên miền. Anh/chị hiện xem sản phẩm trên bản demo chạy tại máy Mac (mục 7).

## 2. Quyết định QC: [CHỜ QC]

- **Cổng QC Sprint 4:** lần 1 (19/10) và lần 2 (20/10) **KHÔNG ĐẠT**. Lần 2 trượt chỉ vì lượt kiểm tra ban đêm đỏ. Đó là lỗi thật của ca đêm (BUG-R2-211/212/213), đã sửa, và chờ một lượt chạy ban đêm xanh. Phần tiền đạt từ lần 1 và không mở lại. **Chấm lần 3: [CHỜ QC – sau lượt kiểm tra ban đêm 21/10]**.
- **QC Round 2: [CHỜ QC]** – quyết định ĐẠT / ĐẠT CÓ ĐIỀU KIỆN / KHÔNG ĐẠT và lý do 1 câu.
- Để anh/chị biết trước (chưa phải kết luận QC): phần "chạy trên môi trường thật" của Round 2 sẽ không đạt khi chưa có staging. Đội đề nghị QC chuyển mục này thành điều kiện bắt buộc đầu Round 3.

## 3. Chỉ số round

- **Thẻ feedback (review chéo):** tạo khoảng 380 | đã xử lý: [CHỜ QC – số chính thức] | dời sang Round 3: đều có vai và hạn trong backlog mục 5.5 (39 mục, gồm cả lỗi). Blocker/Major còn mở mà không có hạn: 0 [CHỜ QC xác nhận].
- **Lỗi (sổ lỗi 20/10):** tìm **213** | đã đóng 192 | đã sửa chờ kiểm tự động 3 (211, 212, 213) | hoãn 1 | còn mở 17.
  - P0: 11 (10 đóng, 1 đã sửa chờ CI) · P1: 68 (66 đóng, 2 đã sửa chờ CI) · P2: 79 (76 đóng, **2 mở** → R3, 1 hoãn) · P3: 55 (40 đóng, **15 mở** → R3).
  - Số cuối sau QC: [CHỜ QC].
- **Kiểm tiền:** 8 lượt; lượt 8: 0 lệch giá đêm qua hơn 37.000 phép so ngẫu nhiên, 0 kẹt khóa dữ liệu.

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH

Không câu nào chặn Round 2. Chưa quyết thì đội làm theo dòng "Nếu chưa quyết". Anh/chị chỉ cần trả lời "đồng ý đề xuất" hoặc chọn chữ cái khác. **Không gửi mật khẩu qua chat.**

| # | Việc | Phương án | Đội đề xuất | Nếu chưa quyết |
|---|---|---|---|---|
| 4.1 | **ESC-022 – Tên mạng Wi-Fi.** Khách chỉ được thấy tên phòng (The Pine…), không thấy số căn | A: mỗi căn một mạng, đặt theo tên phòng · B: một mạng chung · C: giữ tên theo số căn | **A** nếu mỗi căn đã có bộ phát (0 đ, đổi tên 1–2 giờ); **B** nếu đã là mạng chung. Không chọn C. Anh/chị gửi tên mạng hiện tại, không gửi mật khẩu | App giữ một mạng chung, tên mẫu "OTTIMO-Guest" |
| 4.2 | **ESC-023 – Khách rút ngắn đơn khi còn dưới 7 ngày mà vẫn đến ở.** Hiện không mất phí, trong khi hủy cả đơn mất 50–100% cọc | A: không thu · B: thu theo đúng bậc phí hủy cho phần cọc của các đêm bỏ · C: giữ hết phần cọc đêm bỏ | **B** – ví dụ đơn 7 đêm rút còn 2 đêm, báo trước 5 ngày: phí 550.000; báo trước 2 ngày: phí 1.100.000; báo trước ≥ 7 ngày: 0. Không bao giờ phạt nặng hơn hủy cả đơn. Không áp cho đơn OTA và khách dài hạn | Giữ A (không thu) |
| 4.3 | **ESC-024 – Khách rời quá muộn, phải thu phụ thu bằng giá 1 đêm, mà quản lý không trả lời** | A: khách chờ quản lý · B: sau 15 phút lễ tân tự thu đúng số máy tính, không được giảm, quản lý xem lại trong 24 giờ · C: không thu | **B** – ví dụ căn 202 ngày thường thu 792.000; quản lý vẫn miễn được sau khi xem lại. Không ai phải đọc mật khẩu qua điện thoại | Giữ A |
| 4.4 | **ESC-026 (mới) – Quản lý miễn nhiều khoản khác loại trên cùng một lượt ở.** Mỗi khoản dưới giá 1 đêm nên tự miễn được, nhưng tổng có thể lớn mà anh/chị không biết | A: vẫn cho miễn, tổng vượt hạn mức một lần thì báo anh/chị ngay · B: phần vượt chờ anh/chị duyệt · C: giữ như hiện nay | **A** – ví dụ 300.000 + 250.000 + 600.000 = 1.150.000 > 911.000 (giá đêm cao nhất): khách không phải chờ, anh/chị nhận thông báo và xem lại trong 24 giờ | Giữ C khi chạy dữ liệu thử; trước dữ liệu thật làm tối thiểu cảnh báo kiểu A |
| 4.5 | **ESC-027 (mới) – Khôi phục đăng nhập hai bước khi OTTIMO chỉ có một tài khoản chủ đầu tư** | A: bắt buộc thêm một tài khoản chủ thứ hai · B: một tài khoản chủ, 10 mã khôi phục cất riêng + thủ tục kỹ thuật có nhật ký · C: không bắt buộc hai bước | **B** – không thêm người toàn quyền; mất cả điện thoại lẫn mã thì chậm vài giờ tới một ngày. Thêm người thứ hai lúc nào cũng được | Làm theo B |
| 4.6 | **Nội dung landing v1.2.1** (`outputs/PO/landing-inv-questions.md`, không phải ESC mới) | Q1 nút "Đặt ngay" trên fanpage · Q2 câu hứa thời gian trả lời · Q3 nói công khai cọc 30% · Q4 duyệt từng câu (4a–4f) | Q1 **A**: link về website, dữ liệu ở Việt Nam · Q2 **A**: "trong 1 giờ, 07:00–22:00; ngoài giờ trước 09:00 sáng hôm sau" · Q3 **A**: nói rõ 30% · Q4: duyệt theo đề xuất từng dòng. **Riêng 4c:** hạng Premium (302, 402) anh/chị báo ngày 16/10 có giường phụ 1m4, nhưng ESC-014 ghi người thêm ngủ sofa. Nhờ anh/chị xác nhận để trang ghi đúng | Đội làm theo đề xuất; trang **không** lên mạng khi anh/chị chưa duyệt nội dung |
| 4.7 | **Cài đặt GitHub cho repo công khai** (SEC đề xuất, 0 đ, `reviews/s4-SEC.md` E.6) | (1) môi trường staging chỉ deploy khi anh/chị bấm duyệt; (2) chỉ gộp mã vào nhánh chính khi kiểm tra tự động xanh; (3) bật Dependabot security updates (tự đề nghị bản vá lỗ hổng) | **Đồng ý cả ba.** Anh/chị là chủ repo nên cần anh/chị đồng ý; OPS hướng dẫn từng bước, anh/chị tự bấm. (1) bắt buộc trước khi đặt khóa máy chủ staging | Đội không đổi cài đặt; staging không bật deploy tự động |
| 4.8 | **Để anh/chị biết (không cần trả lời) – K9:** hai phần nhỏ dời sang Round 3, trước bản dùng thử | US-012 AC7 dòng "Đồng bộ kênh lỗi" (làm cùng kết nối channel manager Beds24); US-031 AC1 thông báo chủ động "quá giờ trả phòng" | Round 2 chưa có kênh OTA thật và thông báo đẩy mới là bản giả lập, nên chưa kiểm thật được. Tạm thời: thẻ "Quá giờ trả phòng" màu đỏ, xếp đầu trên Desk | – |

**Đầu vào anh/chị đã hẹn, còn chờ** (không phải quyết định, nhưng chặn các mốc Round 3):

| Đầu vào | Chặn gì |
|---|---|
| VPS (Ubuntu LTS, đặt tại Việt Nam) + tên miền | Staging, landing lên mạng, QC "chạy trên môi trường thật" |
| Logo SVG gốc | Gắn logo vào Desk, landing, bill |
| Bảng ghép tên phòng (The Pine … The Ember) ↔ số căn ↔ hạng | Tên phòng trên trang khách, landing, Wi-Fi (ESC-022) |
| Zalo OA đã xác thực bằng ĐKKD + 2 quản trị viên | Chat OA; tin tự động Round 3 (ESC-021) |
| Tên công ty + mã số thuế | Chân trang landing, hóa đơn điện tử |
| Tên chủ tài khoản nhận cọc | Câu chống giả danh trên landing (4d); anh/chị tự nhập số tài khoản ở màn Tham số khi có staging |
| Trả lời của luật sư (ESC-001, câu LZ-2, LZ-8, LZ-9) | Bật form đặt phòng trên website; nhập dữ liệu khách thật |

## 5. Giả định đội đang dùng – nhờ xác nhận

| # | Giả định | Vì sao | Anh/chị chỉ cần |
|---|---|---|---|
| 5.1 | **Hạn trả công nợ mặc định = 3 ngày** kể từ lúc ghi nợ; quản lý sửa được hạn từng khoản | Khớp mốc cảnh báo quá hạn 3 ngày đã có; khách lẻ đã rời Đà Lạt, để lâu khó thu | "Đồng ý 3 ngày" hoặc số ngày khác |
| 5.2 | **Bảng giá đêm thêm** (nhận phòng trước 06:00, gia hạn, rời sau 18:00, đổi căn): giá gợi ý theo lịch giá Trực tiếp của căn và đêm đó; đơn có giá thỏa thuận thì giữ giá thỏa thuận. Ví dụ căn 202: 792.000 ngày thường, 911.000 thứ Sáu/thứ Bảy, 1.030.000 ngày lễ | Một bảng duy nhất cho mọi đêm thêm, đội đã kiểm 50 tình huống | Xác nhận cách lấy giá này, hoặc muốn giá đêm thêm khác (ví dụ giảm %) |
| 5.3 | **Đơn dài hạn OTM-0108** trong dữ liệu mẫu: hợp đồng 3 tháng từ 05/09, **ngày trả phòng 05/12** (dữ liệu cũ ghi 04/12) | Theo quy tắc kỳ hạn hợp đồng; tổng tiền đêm khớp đúng tiền hợp đồng 28.230.000 | Xác nhận ngày trả phòng thật của hợp đồng này |
| 5.4 | **Số điện thoại lễ tân cho nút "Gọi lễ tân"** (app buồng phòng, trang khách) đọc từ biến `VITE_DESK_PHONE` trong tệp `.env` trên máy anh/chị, không đưa lên repo | Số công khai nhưng không cần nằm trong mã nguồn | Kiểm số trong `.env` là số lễ tân đang dùng |
| 5.5 | **Mã cửa = 8 chữ số ngẫu nhiên**, sinh mới mỗi lượt ở, gửi khách ngày đến, xóa khi trả phòng/đổi phòng (anh/chị chọn 19/10) | Thay cách đặt mã cũ; đội đổi app và tài liệu ở Round 3 | Xác nhận khóa đang dùng nhận được mã 8 số |

## 6. Kế hoạch Round 3 – Hoàn thiện, ổn định, bản dùng thử (RC)

Chi tiết: `rounds/round-03/plan.md` (nháp).

- **Mục tiêu:** giao anh/chị **bản phát hành ứng viên (RC)** chạy trên staging, đủ an toàn để nhập dữ liệu khách thật, kèm hướng dẫn và kịch bản dùng thử 10–15 việc.
- **Sprint 1 – tiền và an toàn trước dữ liệu thật:** một lượt kiểm tiền riêng cho 3 lỗi tiền nhỏ còn lại và phần rà ngày sau nửa đêm; các việc bảo mật bắt buộc (hạn lưu ảnh, ẩn danh hồ sơ cũ, chống chia nhỏ xóa nợ); đăng nhập hai bước (ESC-027); quản lý xác nhận từ xa (ESC-024); làm theo ESC-023, ESC-026 anh/chị chọn.
- **Sprint 2 – kênh và báo cáo:** kết nối Beds24 (đơn OTA tự vào, đẩy phòng trống), phí kênh, báo cáo tháng/kênh/FOC, xuất dữ liệu ra bảng tính, form đặt phòng từ website vào Desk.
- **Sprint 3 – khách dài hạn và khách:** báo giá + hợp đồng dài hạn, lịch thu, điện nước, hoa hồng CTV, đơn nhóm; trang khách xem hóa đơn tạm tính, tiếng Nga, xác minh nhẹ; mẫu tin và lịch nhắn khách; hóa đơn điện tử MISA.
- **Sprint 4 + tuần Ổn định:** đóng ca, quyền dữ liệu của khách, hiệu năng, kiểm tra bảo mật tổng, hướng dẫn vận hành, release notes, QC quyết định phát hành RC.
- **Phụ thuộc anh/chị:** VPS + tên miền (chặn staging – không có staging thì không có RC), tài khoản Beds24 và MISA, Zalo OA, luật sư trả lời ESC-001, và các đầu vào ở mục 4.

## 7. Cách xem/dùng thử sản phẩm hiện tại

- **Mã nguồn và tài liệu:** repo công khai `anhvh93-tech/ottimo-hotel-app-public` trên GitHub. Repo riêng tư cũ chỉ lưu trữ.
- **Bản demo trên máy Mac của anh/chị** (bản đang chạy là mã cũ ngày 17/10; nên dựng lại để thấy bản mới):
  1. Mở Terminal ở thư mục dự án, chạy: `bash product/infra/demo/demo-up.sh`
  2. Lệnh này **xóa dữ liệu demo cũ**, dựng lại từ mã mới nhất, tạo dữ liệu OTTIMO quanh ngày hôm nay. **Mật khẩu các tài khoản và link khách đổi mới mỗi lần dựng.** Mật khẩu không in ra màn hình; anh/chị xem trong tệp `product/infra/demo/.out/demo-accounts.md` trên máy (không đưa lên repo, không gửi qua chat).
  3. Mở Desk tại `http://localhost:8181` (mọi vai nhân viên đăng nhập ở đây), trang khách tại `http://localhost:8183`.
  4. Làm theo 10 kịch bản trong `rounds/round-02/demo-1-guide.md`; ghi góp ý vào `rounds/round-02/demo-1-feedback-form.md` hoặc gửi đội bằng `/feedback`.
  - Chỉ dựng lại bằng `demo-up.sh`, không bật lại dữ liệu demo cũ (thủ tục OPS để tránh dữ liệu công nợ cũ).
  - Lệnh cần số lễ tân `VITE_DESK_PHONE` trong `product/.env` (mục 5.4); thiếu thì lệnh dừng trước khi dựng và báo rõ.
- **Landing v1.2.1:** mở tệp `product/design/landing/mock/index.html` bằng trình duyệt.
