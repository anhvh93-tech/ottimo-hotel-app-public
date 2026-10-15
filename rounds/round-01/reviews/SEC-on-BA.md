# Review SEC → BA – Round 1 · Bước 3 (khuyến nghị mạnh)

- Người review: SEC | Tác giả: BA | Ngày: 15/10/2026
- Phạm vi: `product/docs/rbac-matrix.md` (v0.1) – trọng tâm dữ liệu giấy tờ, mã cửa, link khách, tiền
- Căn cứ: `data-risk-assessment.md` (D01–D28, R-REG, R-DSR), `security-requirements.md` (SR-xxx), `threat-model.md` (TM-xx; mục 10 quan điểm SEC về M4, M8), `rounds/round-01/outputs/SEC/report.md` mục 4–5 (SEC-R1-xx). SEC-R1-32, -33 là phát hiện mới.
- Các ghi chú "chờ SEC" trong rbac (mục 8.7, ghi chú 30, quy tắc vai 5) được SEC trả lời trong các thẻ dưới đây.

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 6 |
| Suggestion | 2 |
| **Tổng** | **12** |

---

### FB-R1-SEC-BA-01
- Mức độ: Major
- Vị trí: `rbac-matrix.md` mục 8.7; mục 4.4 (A70, A71, A73), A21; S09; S26
- Vấn đề: Quy tắc "C3 chỉ mở trên thiết bị quầy được cấp" còn ghi "BA đề xuất, chờ SEC/ARC" và chỉ áp cho phiên điện thoại của HK/MT/SAL/CTV. Ma trận chưa có hành động **cấp/thu hồi thiết bị**, và FD (thiết bị chính "Máy quầy + điện thoại") vẫn ✔ L cho A70–A73, A21 mà không ràng buộc thiết bị. [SEC-R1-03; M8; SR-DEV-01…06; TM-46]
- Vì sao quan trọng: Không ghi vào ma trận thì QA không có tiêu chí kiểm, BE/FE không biết phải chặn ở đâu; FD xem ảnh hộ chiếu trên điện thoại cá nhân là đường rò rỉ chính (TM-17).
- Đề xuất sửa: Đổi 8.7 thành quyết định SEC: "Mọi đọc/ghi C3 của **mọi vai nhân viên** (A21 xem mã cửa, A70, A71, A73, A74, xem `…/sensitive`) chỉ trên thiết bị được OWN cấp; PWA không bao giờ được cấp". Thêm ký hiệu (ví dụ **Q**) vào các ô liên quan. Thêm hành động mới "Cấp/thu hồi thiết bị quầy" – OWN ✔ L (MGR chỉ khi OWN ủy quyền), các vai khác ✖; danh sách thiết bị trên S26.
- Trạng thái: Open

### FB-R1-SEC-BA-02
- Mức độ: Major
- Vị trí: `rbac-matrix.md` mục 1 quy tắc vai 5; mục 8.6; mục 6 D22 (cột GST), D14, D17; A22
- Vấn đề: (1) "Link hết hạn khi trả phòng" mâu thuẫn ADR-006 (ân hạn 24 giờ) – M4 chưa giải quyết trong rbac. (2) Cột GST ghi "Đ" cho mã cửa (D22), bill (D14), hợp đồng (D17) mà không phân biệt **mức 1/mức 2**; "xác minh nhẹ" còn để ngỏ. (3) Chưa có hành động "Cấp mã xác minh cho khách" của lễ tân. [SEC-R1-01; M4; SR-GST-07, SR-GST-10, SR-GST-11; TM-21, TM-26]
- Vì sao quan trọng: Mã cửa chỉ an toàn khi có mức 2 thật; ma trận là nguồn để QA sinh test phân quyền khách.
- Đề xuất sửa: Quyết định SEC để BA ghi: GST tách 2 cột **GST1** (chỉ link) / **GST2** (link + OTP email hoặc mã lễ tân cấp). D22, D14, D17, D15 → chỉ GST2. Sau `checked_out`: chỉ còn xem bill + thanh toán phát sinh, bắt buộc GST2, tối đa 24 giờ; Wi-Fi, mã cửa, yêu cầu, upload → ✖. Thêm hành động "Cấp mã xác minh khách" – FD+ ✔ (ghi audit), SAL/CTV ✖.
- Trạng thái: Open

### FB-R1-SEC-BA-03
- Mức độ: Major
- Vị trí: `rbac-matrix.md` A101 ("Sửa tham số vận hành – giờ, hạn, phụ thu, giá…" – OWN, MGR); mục 6 D15
- Vấn đề: Ma trận không nói ai được đổi **tài khoản ngân hàng nhận tiền** (VietQR, thông tin chuyển khoản trên bill) và **tài khoản nhận hoàn của khách** (D15). Nếu các thông tin này rơi vào nhóm "tham số vận hành" A101 thì MGR (hoặc ai chiếm được phiên MGR) đổi được số tài khoản nhận tiền của mọi bill. [SEC-R1-32 mới; TM-29, TM-33]
- Vì sao quan trọng: Gian lận "đổi tài khoản nhận tiền" là sai tiền trực tiếp, khó phát hiện (khách vẫn thấy QR hợp lệ).
- Đề xuất sửa: Thêm hành động riêng "Đổi tài khoản nhận tiền / thông tin thanh toán của cơ sở": chỉ OWN, xác nhận lại mật khẩu (+2FA khi có), ghi audit, gửi thông báo cho OWN, có hiệu lực sau 1 bước xác nhận. Hoàn tiền vào tài khoản khách (D15): FD nhập, MGR+ duyệt trước khi chuyển; đổi số tài khoản sau khi đã duyệt → duyệt lại.
- Trạng thái: Open

### FB-R1-SEC-BA-04
- Mức độ: Major
- Vị trí: `rbac-matrix.md` mục 6 D12 ("Sở thích, tag, ghi chú tự do – C2/C3"; HK thấy "Lưu ý phục vụ")
- Vấn đề: Mức "C2/C3" không cho biết khi nào là C3. Thực tế "Lưu ý phục vụ" hay chứa **thông tin sức khỏe** (dị ứng, bệnh, mang thai, khuyết tật) – loại dữ liệu cá nhân nhạy cảm theo NĐ 13/2023 (cần luật sư xác nhận theo Luật 91/2025 – ESC-001) – và đang được hiển thị cho HK trên điện thoại. [SEC-R1-33 mới; SEC-R1-09; TM-08, TM-42]
- Vì sao quan trọng: Dữ liệu sức khỏe cần đồng ý riêng và kiểm soát chặt hơn; ghi chú tự do không lọc được ở serializer.
- Đề xuất sửa: Tách D12 thành: (a) **Tag/lưu ý từ danh mục** không liên quan sức khỏe – C2, như hiện tại; (b) **Lưu ý sức khỏe** từ danh mục cố định (ví dụ "dị ứng thực phẩm – hỏi lễ tân") – chỉ ghi khi khách đồng ý, HK chỉ thấy nhãn chung, chi tiết chỉ FD+; (c) **Ghi chú tự do** – C2, giao diện cảnh báo "không ghi thông tin sức khỏe, giấy tờ", SAL/CTV/HK ✖. Đưa câu hỏi "lưu ý sức khỏe có cần đồng ý riêng không" vào ESC-001.
- Trạng thái: Open

### FB-R1-SEC-BA-05
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` ghi chú 30 (A71 – lý do khi xem ảnh sau `confirmed`)
- Vấn đề: SEC đồng ý hướng của BA nhưng cần mở rộng: chỉ yêu cầu lý do sau `confirmed` thì trước đó FD xem ảnh bao nhiêu lần cũng không lý do, kể cả đơn không phải ca mình. [SR-C3-07, SR-C3-09; TM-11]
- Vì sao quan trọng: Lý do + xác nhận lại là lớp chống tò mò/nội gián duy nhất trong ca làm việc.
- Đề xuất sửa: Ghi: (1) trong luồng nhận phòng đang mở của chính đơn đó – không cần lý do; (2) mọi lần xem khác (sau `confirmed`, đơn đã trả phòng, đơn không trong ca) – chọn lý do từ danh sách (đối chiếu lại, khách yêu cầu, cơ quan chức năng, khác + ghi chú); (3) xác nhận lại PIN/mật khẩu nếu lần xác thực gần nhất > 15 phút (SR-C3-09); (4) xem C3 của đơn đã trả phòng > 7 ngày → cảnh báo OWN (SR-LOG-06).
- Trạng thái: Open

### FB-R1-SEC-BA-06
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` A100 (Tạo/khóa tài khoản, gán vai, đặt lại mật khẩu – OWN)
- Vấn đề: Chưa ghi hệ quả "thu hồi mọi phiên" khi khóa/đổi vai/đặt lại mật khẩu; chưa có hành động quản lý 2FA (bắt buộc OWN/MGR trước khi chạy thật) và **khôi phục tài khoản OWN** (OWN là người duy nhất có A100 – OWN mất mật khẩu/2FA thì ai mở?). [SEC-R1-05, SEC-R1-18; SR-SES-06, SR-AUTH-05…09; TM-03]
- Vì sao quan trọng: Nhân viên nghỉ việc còn phiên; OWN bị khóa ngoài hệ thống thì không ai quản trị được.
- Đề xuất sửa: Ghi chú A100: "có hiệu lực ngay, thu hồi mọi phiên". Thêm: "Bật/đặt lại 2FA của người khác" – OWN ✔ L; "Khôi phục OWN" – bằng mã khôi phục in sẵn do INV giữ (không qua MGR), quy trình ghi ở runbook OPS.
- Trạng thái: Open

### FB-R1-SEC-BA-07
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` A22 (SAL = M); mục 6 D25
- Vấn đề: SAL được gửi link app khách (M) trong khi D25 ghi token là C3, chỉ FD+ tạo/thu hồi. Nếu "gửi" là sao chép link thì token nằm trên điện thoại cá nhân của SAL; render mẫu tin hiện cho cả CTV lấy link (SEC-R1-06). [SEC-R1-06; SR-MSG-03; TM-21, TM-60]
- Vì sao quan trọng: Link + mã đặt phòng (đang là yếu tố xác minh) = mã cửa.
- Đề xuất sửa: Ghi rõ: SAL chỉ bấm "Gửi qua kênh hệ thống" (email/ZNS) cho khách thuộc phạm vi M, **không** thấy/sao chép link; CTV ✖ cả khi render mẫu tin; chỉ FD+ có nút "Sao chép link" (ghi audit).
- Trạng thái: Open

### FB-R1-SEC-BA-08
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` A106 (Sửa mẫu tin nhắn – OWN, MGR)
- Vấn đề: Người sửa mẫu có thể chèn biến bất kỳ (ví dụ mã cửa, số giấy tờ) vào mẫu gửi hàng loạt, hoặc chèn link lừa đảo vào tin gửi khách. [SR-MSG-01…03; TM-60]
- Vì sao quan trọng: Mẫu tin là kênh đưa C3 ra ngoài hệ thống và kênh phishing mang thương hiệu OTTIMO.
- Đề xuất sửa: Ghi: mỗi loại mẫu có **danh sách biến cho phép** cố định trong code; biến C3 duy nhất là mã cửa, chỉ trong mẫu "mã cửa", chỉ hệ thống gửi vào ngày đến; không biến nào cho số giấy tờ; sửa mẫu ghi audit (nội dung trước/sau), URL trong mẫu chỉ thuộc tên miền OTTIMO.
- Trạng thái: Open

### FB-R1-SEC-BA-09
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` mục 1 (FD/FDL dùng "Máy quầy", nhiều người chung ca); mục 8
- Vấn đề: Chưa có quy tắc cấm **dùng chung tài khoản** trên máy quầy và đăng xuất/khóa khi đổi ca. Thực tế quầy lễ tân hay để một tài khoản đăng nhập cả ngày. [SR-AUTH-01, SR-SES-01…; TM-02]
- Vì sao quan trọng: Dùng chung tài khoản làm vô nghĩa nhật ký C3, hạn mức duyệt FOC theo người (BR-432) và trách nhiệm khi mất tiền.
- Đề xuất sửa: Thêm quy tắc 8.8: "Mỗi người một tài khoản, cấm dùng chung; đổi ca phải đăng xuất (nút đổi người nhanh); phiên quầy tự khóa sau 30 phút không hoạt động". UXD thiết kế nút đổi người nhanh.
- Trạng thái: Open

### FB-R1-SEC-BA-10
- Mức độ: Minor
- Vị trí: `rbac-matrix.md` mục 6 (thiếu dòng cho cảnh báo/blacklist khách); A105
- Vấn đề: OpenAPI có `Guest.warnings` (cảnh báo về khách, có thể kèm mã khách khác) nhưng rbac mục 6 không có dòng tương ứng → ARC không có căn cứ đặt `x-visible-to` (SEC-R1-09). A105 xuất báo cáo C2 chưa nói định dạng tệp có được chứa SĐT/email hay không. [SEC-R1-09; SR-AZ-04; TM-08, TM-59]
- Vì sao quan trọng: Danh sách đen là dữ liệu có thể gây tranh chấp/phân biệt đối xử; xuất tệp là cách rò rỉ hàng loạt dễ nhất.
- Đề xuất sửa: Thêm dòng "Cảnh báo/danh sách đen khách" – C2, OWN/MGR/FDL/FD đầy đủ, các vai khác K, GST K (nhưng GST xem được qua yêu cầu chủ thể S31). A105: tệp xuất mặc định không có SĐT/email/số giấy tờ; muốn có phải chọn rõ và ghi audit.
- Trạng thái: Open

### FB-R1-SEC-BA-11
- Mức độ: Suggestion
- Vị trí: `rbac-matrix.md` A75 (cấm xuất giấy tờ hàng loạt) và S31 (yêu cầu của chủ thể dữ liệu)
- Vấn đề: Khách có quyền yêu cầu bản sao dữ liệu của mình (gồm C3); A75 "cấm với mọi vai" có thể bị hiểu là cấm luôn việc này.
- Vì sao quan trọng: Tránh hai quy tắc mâu thuẫn khi QA viết test.
- Đề xuất sửa: Ghi chú: A75 là xuất **nhiều người**; bản sao dữ liệu của **một** chủ thể theo S31 do OWN/MGR tạo, ghi `c3_access_log`, giao cho khách qua app khách mức 2 (không đính kèm email).
- Trạng thái: Open

### FB-R1-SEC-BA-12
- Mức độ: Suggestion
- Vị trí: `rbac-matrix.md` A04, A33 (SAL = M xác nhận cọc / ghi nhận thu tiền)
- Vấn đề: SAL vừa là người nhận thông tin chuyển khoản từ khách vừa tự xác nhận tiền đã về – thiếu tách nhiệm vụ (khác CTV đã được tách ở ghi chú 20). [TM-32]
- Vì sao quan trọng: Rủi ro gian lận nội bộ ở khâu cọc (xác nhận cọc giả để giữ phòng cho người quen).
- Đề xuất sửa: DOM/PO cân nhắc: xác nhận của SAL ở trạng thái "chờ đối soát", FD/MGR đối soát với sao kê trong ngày; hoặc chỉ cho SAL xác nhận khi có giao dịch tự động (bank feed R3).
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Ma trận theo **trường** (mục 6) bám đúng D01–D28 của SEC, có cột GST và ký hiệu L cho nhật ký C3; SAL/CTV không thấy giấy tờ ở mọi dạng (M1) – đúng tinh thần tối thiểu.
2. A75 cấm xuất giấy tờ hàng loạt với **mọi vai**, kể cả OWN; mỗi lần bị từ chối quyền đều ghi nhật ký; kiểm ở server theo hành động, độc lập màn hình (M4).
3. Đã tự phát hiện mâu thuẫn ngưỡng trẻ em (14 vs 16 tuổi) và đẩy về DOM/ESC-001 thay vì tự chọn.
