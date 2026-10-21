# Tổng kết Round 2 – Xây dựng lõi MVP

- Người soạn: PO (cùng ORC) | Ngày: 21/10/2026 (cập nhật chiều: R-1…R-4 xong) | **BẢN NHÁP – đã có kết quả QC** (cổng Sprint 4 lần 3 và cổng Round 2, 21/10). ORC hoàn thiện và trình.
- Nguồn: `rounds/round-02/qc/round-qc-gate.md` (cổng Round 2), `qc/s4-qc-gate.md` (cổng Sprint 4), `qa/bug-list.md`, `outputs/PO/s4-acceptance.md` mục R-1, `03-backlog/backlog.md` mục 5.5, `01-decisions/decision-log.md` (17–21/10), `02-escalations/`, `outputs/PO/landing-inv-questions.md`.

---

## 1. Kết quả chính

- **Desk cho lễ tân chạy trọn một ngày làm việc:** sơ đồ phòng → đặt/giữ chỗ → thu cọc bằng mã QR → nhận phòng (giấy tờ, khai báo lưu trú) → gia hạn, đổi phòng, phát sinh, trả muộn → trả phòng, in bill, thu tiền, hoàn tiền, công nợ. Chống đặt trùng phòng ở máy chủ, kể cả khi hai người lưu cùng lúc.
- **Tiền đã được kiểm kỹ nhất:** 8 lượt kiểm tiền độc lập, số lỗi tiền nghiêm trọng giảm dần 11 → 6 → 5 → 3 → 5 → 3 → 1 → 1 → **0**; không còn lỗi tiền mức P0/P1 mở. Ba lỗi tiền nhỏ (đều tính thiếu, không tính thừa khách) làm đầu Round 3.
- **App buồng phòng trên điện thoại** (việc hôm nay, trạng thái buồng, kiểm phòng, báo sự cố) và **trang khách** (mở bằng link/QR, check-in online, xem thông tin lưu trú, gửi yêu cầu) bằng tiếng Việt và tiếng Anh.
- **Landing page ottimo.vn – bản mẫu v1.2.1** theo Brand Guidelines (tông kem – gỗ sồi, Lora + Be Vietnam Pro). Chưa lên mạng: chờ tên miền, máy chủ và anh/chị duyệt nội dung (mục 4.6).
- **Mã nguồn công khai, kiểm tra tự động miễn phí** (theo quyết định của anh/chị 18–19/10): mỗi lần gộp mã chạy gần 2.000 ca bấm thử trên trình duyệt và gần 3.000 ca kiểm phía máy chủ. Lượt kiểm tra ban đêm đã bắt được một lỗi thật: sau nửa đêm, app buồng phòng không tải được và Desk có chỗ tính thêm một đêm. Đã sửa ngày 20/10; lượt chạy đêm 02:41 ngày 21/10 xanh, không ca nào phải chạy lại.
- **Chưa có:** máy chủ chạy thử (staging) vì còn chờ VPS + tên miền. Đây là lý do duy nhất khiến Round 2 chưa qua cổng QC (mục 2). Anh/chị hiện xem sản phẩm trên bản demo chạy tại máy Mac (mục 7).

## 2. Quyết định QC

- **Cổng QC Sprint 4: ĐẠT CÓ ĐIỀU KIỆN** (lần 3, 21/10, chấm trên mã `21bb797`). Lần 1 (19/10) và lần 2 (20/10) không đạt; lần 2 trượt chỉ vì lượt kiểm tra ban đêm đỏ do lỗi ca đêm thật, đã sửa. Phần tiền đạt từ lần 1, không mở lại. Các điều kiện còn lại có hạn rõ (trước tổng kết Round 2 hoặc đầu Round 3).
- **Cổng QC Round 2: KHÔNG ĐẠT** – lý do 1 câu: kế hoạch Round 2 đòi luồng chính chạy **trên máy chủ chạy thử (staging)** và có triển khai tự động lên đó, mà Round 2 chưa có staging vì chưa có VPS + tên miền.
- Anh/chị nên đọc kết luận này như sau:
  - **Phần mềm chạy được luồng chính.** Cả 7 luồng A1–A7 (đặt phòng → nhận phòng → lưu trú → trả phòng → bill → buồng phòng; đơn OTA; chống trùng; sự cố khóa phòng; hủy, no-show; phân quyền và giấy tờ; số liệu tổng quan) đều xanh trong môi trường kiểm tra tự động: cùng bản cài như máy chủ thật, cơ sở dữ liệu thật, giả lập đồng hồ. Lượt chạy đêm cũng xanh.
  - **Không còn lỗi P0/P1. Không có lỗi bảo mật nghiêm trọng (Critical/High). Không có lỗi tiền nặng nào mở.**
  - Cổng trượt **vì môi trường**, không phải vì tiền, bảo mật hay chất lượng mã. Việc này đội không tự gỡ được.
- Ngoài staging, QC giao 4 việc đội tự làm được (R-1…R-4, hạn 23/10). **Cả 4 xong ngày 21/10:**
  - R-1 – PO chấm lại nghiệm thu: **68/71** tính năng bắt buộc đạt trên môi trường kiểm tra tự động (mục 3);
  - R-2 – INT trả lời đủ 7 thẻ góp ý bảo mật về Zalo, SEC xác nhận: 3 thẻ đã làm và SEC đã kiểm (1 thẻ còn 1 điểm dời); phần cần tài khoản Zalo thật dời sang Round 3 có hạn. Các điều kiện chặn của SEC vẫn giữ tới khi cài xong, nên **chưa gửi tin Zalo tự động**;
  - R-3 – QA chạy tay trọn luồng A1 (12 chặng, đặt phòng → trả phòng → dọn, kiểm phòng), có ảnh và ghi hình: **đạt, tiền khớp từng đồng** (tiền phòng 5.205.000, cọc 1.600.000, thu khi nhận 3.605.000, minibar 100.000, tổng đã thu 5.305.000). Phát hiện 3 lỗi nhỏ P3 về hiển thị;
  - R-4 – DOM xác nhận số liệu công nợ BR-525-16; UXR đi lại 2 kịch bản app buồng phòng khi mất mạng (T6, T7): **đạt**. Hai vấn đề nặng nhất của đợt thử trước (mức 4 và mức 3) đã hết. Đây vẫn là thử mô phỏng, chưa có nhân viên thật.
- **Việc còn lại để chấm lại cổng chỉ là staging (R-5, R-6).**
- **Khi có VPS + tên miền:** OPS dựng staging, chạy lại luồng chính trên đó, PO nghiệm thu, SEC kiểm bảo mật. Mất khoảng **3 ngày làm việc**, rồi QC chấm lại cổng Round 2. Anh/chị đã báo sẽ gửi IP và tên miền trong tuần này (decision-log 21/10).

## 3. Chỉ số round

Số liệu QC đếm trong `qc/round-qc-gate.md` mục 8.

**Thẻ góp ý (review chéo):** 384 thẻ.

| Mức | Tạo | Đã xử lý | Dời sang R3 có quyết định | Chưa có trả lời lúc QC chấm |
|---|--:|--:|--:|--:|
| Blocker | 12 | 12 | 0 | 0 |
| Major | 135 | 123 | 5 | 7 lúc QC chấm (thẻ SEC → INT về Zalo). **Nay 0:** INT trả lời, SEC xác nhận 21/10 (R-2) – 3 thẻ xong (1 thẻ còn 1 điểm dời R3), 4 thẻ dời R3 có hạn |
| Minor | 190 | – | phần dời nằm trong hàng chờ R3 | – |
| Suggestion | 44 | tác giả tự cân nhắc | – | – |
| Không ghi mức | 3 | – | – | – |

**Lỗi (sổ lỗi 21/10, gồm 5 lỗi P3 mới tìm ở R-1 và R-3):**

| Mức | Tìm | Đã sửa/đóng | Hoãn | Còn mở |
|---|--:|--:|--:|--:|
| P0 | 11 | 11 | 0 | 0 |
| P1 | 68 | 68 | 0 | 0 |
| P2 | 79 | 76 | 1 | 2 (208, 209 → Round 3 Sprint 1) |
| P3 | 60 | 40 | 0 | 20 (gồm 210, 123; 214–218 mới → Round 3) |
| **Tổng** | **218** | **195** | **1** | **22** |

- Lúc QC chấm cổng: 213 lỗi, 17 còn mở. Năm lỗi mới 214–218 đều mức P3 (chữ đè nhau, nhóm việc sai tiêu đề, in lặp số cọc, thiếu mã đơn trên một dòng nhắc, câu ngôn ngữ sai nguồn). Không có lỗi P0/P1/P2 mới.

- Hai lỗi P2 còn mở và lỗi 210 là lỗi tiền nhỏ, đều **tính thiếu, không tính thừa khách**. Chúng được sửa trong một lượt kiểm tiền riêng đầu Round 3.
- **Kiểm tiền:** 8 lượt kiểm độc lập. Lượt 8: 0 lỗi nặng, 0 lệch giá đêm qua 37.966 phép so ngẫu nhiên.
- **Kiểm tra tự động:** trên mã QC chấm (`21bb797`): gần 3.000 ca kiểm phía máy chủ (2.971 đạt) và 2.045 ca bấm thử trên trình duyệt (1.976 đạt, 69 bỏ qua có chủ đích), không ca nào phải chạy lại. Lượt mới nhất (`e3f98d1`, 21/10, có thêm ca nghiệm thu): 1.981 ca trình duyệt đạt, 0 hỏng, 0 chạy lại.
- **Nghiệm thu của PO (71 tính năng bắt buộc của Round 2):**
  - **68 đạt trên môi trường kiểm tra tự động;**
  - 3 còn thiếu một phần: 2 chờ sửa bảo mật về giấy tờ khách (làm ở Round 3, trước khi có dữ liệu thật), 1 cần kiểm bằng trình đọc màn hình trên staging;
  - **0 đạt trên staging**, vì chưa có staging. Khi có staging, PO nghiệm thu lại cả 71.
- **Cổng QC trong round:** Sprint 2 đạt có điều kiện · Sprint 3 đạt có điều kiện (bản 3, sau một lần không đạt) · Sprint 4 đạt có điều kiện (lần 3, sau hai lần không đạt) · **Round 2: KHÔNG ĐẠT** (chờ staging).
- **Hàng chờ Round 3:** 50 việc đã có vai và hạn (25 bắt buộc trước bản dùng thử). Ngày 21/10 thêm: 6 việc bảo mật cho kết nối Zalo OA, 3 góp ý trải nghiệm app buồng phòng khi mất mạng, 5 lỗi P3 mới, và một phần nhỏ của dòng nhắc thị thực.

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH

**Việc chặn chính: VPS + tên miền.** Chưa có hai thứ này thì Round 2 chưa qua cổng QC, và Round 3 **không có bản dùng thử**. Anh/chị chỉ cần gửi địa chỉ IP của VPS (Ubuntu LTS, đặt tại Việt Nam) và tên miền. **Không gửi mật khẩu hay khóa SSH qua chat**; OPS hướng dẫn cách cấp quyền an toàn.

Câu đầu tiên (4.0) cần trả lời trước khi mở Round 3. Các câu sau không chặn việc chấm lại cổng Round 2. Chưa quyết thì đội làm theo dòng "Nếu chưa quyết". Anh/chị chỉ cần trả lời "đồng ý đề xuất" hoặc chọn chữ cái khác.

| # | Việc | Phương án | Đội đề xuất | Nếu chưa quyết |
|---|---|---|---|---|
| 4.0 | **ESC-028 (mới) – Có bắt đầu Round 3 trong lúc chờ VPS không?** Round 2 chỉ trượt cổng QC vì chưa có staging | A: bắt đầu Round 3 phần không cần máy chủ (sửa 3 lỗi tiền nhỏ, việc bảo mật trước dữ liệu thật); cổng Round 2 chấm lại trong 3 ngày làm việc sau khi có VPS · B: dừng, chờ VPS rồi mới sang Round 3 · C: coi bản demo trên máy Mac là đủ | **A** – đội không đứng chờ, nhưng quy tắc vẫn giữ: Round 2 ghi "chưa đạt" tới khi chấm lại; **chưa có staging thì chưa có bản dùng thử**. Không chọn C: demo trên máy Mac không có tên miền, không HTTPS, nhân viên không dùng được điện thoại của mình, và bảo mật vẫn chặn dữ liệu khách thật | Đội làm nốt việc sửa Round 2 không cần máy chủ, chuẩn bị Round 3 Sprint 1, không phát hành gì cho nhân viên hay khách |
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
| **VPS (Ubuntu LTS, đặt tại Việt Nam) + tên miền** – anh/chị hẹn gửi trong tuần này | **Chặn chính:** cổng QC Round 2, staging, bản dùng thử Round 3, landing lên mạng |
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
