# Đánh giá rủi ro dữ liệu cá nhân – OTTIMO (Phần 1)

- Người lập: SEC | Round 1 – Bước 2 Sản xuất – Đợt 1 | Ngày: 15/10/2026 | Phiên bản: 0.2 (Bước 4 – sửa câu chữ xóa bằng hủy khóa, mã sinh nhật, câu hỏi luật sư Q11)
- Đầu vào: `00-brief/investor-brief.md` (mục 3, 5, 7), `01-decisions/decision-log.md`, `rounds/round-01/plan.md` (mục 3.1), `product/docs/round-0-baseline.md` (gọi tắt **BL**: mục 2, 3.11, 3.16–3.17, 3.21, 4.2–4.4, 4.12, 5.12, 5.13, 5.16, 5.20, 7, 8.2 #3, #16, #24, #27).
- Phạm vi Phần 1: kiểm kê và phân loại dữ liệu cá nhân, cơ sở pháp lý, đồng ý – thông báo – hồ sơ đánh giá tác động, thời hạn lưu/xóa đề xuất, yêu cầu với khai báo lưu trú, ghi chú PCI DSS.
- **Ngoài phạm vi Phần 1** (làm ở Đợt 4, sau ARC Pha B): threat model STRIDE (`threat-model.md`), yêu cầu kỹ thuật chi tiết về xác thực, phân quyền, mã hóa, nhật ký (`security-requirements.md`).

> **Tuyên bố giới hạn.** Tài liệu này KHÔNG khẳng định sản phẩm "tuân thủ pháp luật". Nó liệt kê các biện pháp đội đề xuất cài đặt và các nghĩa vụ đội *hiểu* là có thể áp dụng. Mọi trích dẫn văn bản pháp luật, số điều, thời hạn dưới đây là **hiểu biết của đội, chưa được luật sư xác nhận**. Từ 01/01/2026, **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** có hiệu lực (BL 5.13); văn bản hướng dẫn kèm theo có thể đã thay thế hoặc sửa đổi Nghị định 13/2023/NĐ-CP. Đội dùng ND 13/2023 làm khung theo đúng việc được giao, nhưng **luật sư phải ánh xạ lại sang Luật 91/2025 và nghị định hướng dẫn đang hiệu lực** trước khi vận hành thật (xem ESC-001).

---

## 1. Tóm tắt cho người bận

1. OTTIMO xử lý **28 nhóm dữ liệu cá nhân** (D01–D28); 12 nhóm ở mức **Rất nhạy cảm** (số và ảnh giấy tờ, thị thực/dấu nhập cảnh, địa chỉ thường trú, dữ liệu trẻ em, dữ liệu thẻ, tài khoản ngân hàng, vân tay, mã cửa đang hiệu lực, dữ liệu CTV…), cộng bí mật hệ thống (khóa API, tài khoản cổng Bộ Công an).
2. Pháp luật Việt Nam (theo ND 13/2023) **không có cơ sở "lợi ích hợp pháp"** như GDPR: ngoài các việc luật bắt buộc (khai báo lưu trú, kế toán – thuế) và thực hiện hợp đồng, mọi việc khác (CRM, sở thích, marketing, xin đánh giá, lưu ảnh giấy tờ để dùng lại) **cần đồng ý riêng theo từng mục đích**.
3. Phát hiện quan trọng nhất từ prototype: (a) **đồng ý lưu ảnh giấy tờ đang bị dùng làm điều kiện để khai báo** – sai logic pháp lý; (b) **mã cửa theo ngày sinh nhật** dễ đoán; (c) **gửi ảnh hộ chiếu qua nhóm chat Zalo**; (d) **QR app khách đặt cố định trong phòng** có thể lộ dữ liệu khách trước; (e) **hạn khai báo tạm trú người nước ngoài có thể là 12 giờ** kể từ khi đến, chặt hơn mốc 23:00 trong BL 5.12; (f) rò rỉ quyền BL 8.2 #27.
4. Thanh toán thẻ: **OTTIMO không bao giờ nhận, lưu, truyền số thẻ** – chỉ dùng trang thanh toán của cổng; thẻ ảo OTA (VCC) không được kéo về hệ thống OTTIMO.
5. Cần chủ đầu tư quyết 2 việc (ESC-001 luật sư rà soát + thời hạn lưu; ESC-002 nơi đặt dữ liệu). Các việc kỹ thuật SEC tự quyết, đề xuất ghi decision-log (mục 13).

---

## 2. Khung pháp lý tham chiếu (cần luật sư xác nhận)

| # | Văn bản | Nội dung liên quan OTTIMO (theo hiểu biết của đội) | Độ chắc chắn |
|---|---|---|---|
| L1 | Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026) + nghị định hướng dẫn | Khung chính hiện hành: đồng ý, quyền chủ thể, dữ liệu nhạy cảm, đánh giá tác động, chuyển dữ liệu ra nước ngoài, thông báo vi phạm, chế tài. Có thể có miễn trừ/thời gian chuyển tiếp cho doanh nghiệp nhỏ – **chưa xác minh** | Văn bản có hiệu lực: chắc. Chi tiết điều khoản: **chưa xác minh** |
| L2 | Nghị định 13/2023/NĐ-CP | Đ.2 định nghĩa dữ liệu cơ bản/nhạy cảm; Đ.9 quyền chủ thể; Đ.11 đồng ý; Đ.13 thông báo xử lý; Đ.16 xóa dữ liệu; Đ.17 xử lý không cần đồng ý; Đ.20 dữ liệu trẻ em; Đ.23 thông báo vi phạm 72 giờ; Đ.24 hồ sơ đánh giá tác động; Đ.25 chuyển dữ liệu ra nước ngoài | Khung được giao; **có thể đã bị thay thế một phần** bởi L1 |
| L3 | Luật Cư trú 2020 + Thông tư 55/2021/TT-BCA | Cơ sở lưu trú thông báo lưu trú công dân VN; mốc trước 23:00, khách đến sau 23:00 thì trước 08:00 hôm sau | **Cần xác minh văn bản hiện hành** |
| L4 | Luật Nhập cảnh, xuất cảnh, quá cảnh, cư trú của người nước ngoài tại VN (47/2014/QH13, sửa đổi 2019, 2023) | Cơ sở lưu trú khai báo tạm trú người nước ngoài qua trang thông tin điện tử; thời hạn **12 giờ** kể từ khi người nước ngoài đến (24 giờ ở vùng sâu vùng xa) | **Cần xác minh** – nếu đúng thì chặt hơn BL 5.12 |
| L5 | Luật Kế toán 2015 + Nghị định 174/2016/NĐ-CP | Chứng từ kế toán dùng ghi sổ, hóa đơn: lưu tối thiểu **10 năm** | Khá chắc, cần kế toán xác nhận |
| L6 | Quy định hóa đơn điện tử (ND 123/2020 và văn bản sửa đổi) | Thông tin người mua trên hóa đơn (tên, MST, địa chỉ; có thể cả số định danh cá nhân với người mua là cá nhân theo quy định mới) | **Chưa xác minh** – INT/kế toán kiểm tra với MISA |
| L7 | Luật An ninh mạng 2018 + Nghị định 53/2022/NĐ-CP | Yêu cầu lưu trữ dữ liệu tại Việt Nam với một số loại doanh nghiệp; thời hạn lưu nhật ký hệ thống | **Chưa xác minh** phạm vi áp dụng cho OTTIMO |
| L8 | Bộ luật Dân sự 2015 | Thời hiệu khởi kiện tranh chấp hợp đồng 3 năm – dùng làm căn cứ giữ bằng chứng đồng ý, hợp đồng | Khá chắc |
| L9 | PCI DSS v4.x (tiêu chuẩn ngành thẻ, không phải luật VN) | Áp qua hợp đồng với ngân hàng/cổng thanh toán; mục tiêu giữ phạm vi ở mức tối thiểu (trang thanh toán của cổng) | Chắc về nguyên tắc; mức tự đánh giá cụ thể do cổng/ngân hàng quy định |

---

## 3. Thang phân loại dữ liệu

Phân loại **nội bộ** (dùng để thiết kế kiểm soát) độc lập với phân loại **pháp lý** (cơ bản / nhạy cảm theo L1, L2). Một dữ liệu có thể là "cơ bản" theo luật nhưng vẫn "Rất nhạy cảm" trong nội bộ vì hậu quả khi lộ (ví dụ số hộ chiếu – ND 13 xếp vào dữ liệu cơ bản, nhưng lộ thì dẫn tới giả mạo danh tính).

| Mức | Định nghĩa | Ví dụ | Kiểm soát tối thiểu (chi tiết ở Phần 2) |
|---|---|---|---|
| **C0 – Công khai** | Đã/được phép công bố | Giá niêm yết, mô tả phòng, đánh giá công khai trên OTA | Không yêu cầu đặc biệt; kiểm soát toàn vẹn (ai được sửa) |
| **C1 – Nội bộ** | Dùng trong vận hành, lộ gây phiền nhưng ít hại | Trạng thái buồng, lịch dọn, phiếu sửa chữa (không có ảnh người), tồn kho | Đăng nhập; phân quyền theo vai và theo cơ sở |
| **C2 – Nhạy cảm** | Dữ liệu cá nhân thông thường hoặc dữ liệu kinh doanh mật | Họ tên, SĐT, email, lịch sử lưu trú, ghi chú khách, giá vốn, P&L, hoa hồng, hợp đồng | C1 + phân quyền theo trường; che bớt khi hiển thị; không đưa vào log/URL/thông báo đẩy; xuất file phải có quyền riêng và ghi nhật ký |
| **C3 – Rất nhạy cảm** | Lộ gây hại nghiêm trọng (giả mạo danh tính, tài chính, an toàn thân thể, trẻ em) hoặc dữ liệu nhạy cảm theo luật | Số/ảnh giấy tờ, thị thực, dấu nhập cảnh, dữ liệu trẻ em, vân tay, mã cửa đang hiệu lực, dữ liệu thẻ, mật khẩu/khóa API, tài khoản cổng BCA | C2 + mã hóa mức trường/tệp với khóa tách riêng; lưu tách khỏi hồ sơ khách; **mỗi lần xem đều ghi nhật ký**; tự xóa theo hạn; chỉ vai được liệt kê mới xem; cấm xuất hàng loạt; không bao giờ gửi qua kênh chat |

---

## 4. Kiểm kê dữ liệu cá nhân

Chủ thể: **K** khách đứng tên · **Đ** người đi cùng (người lớn) · **TE** trẻ em · **CTV** cộng tác viên/sale · **NV** nhân viên · **L** khách tiềm năng.
Loại pháp lý theo ND 13/2023: **CB** cơ bản · **NC** nhạy cảm. Mã mục đích (P-xx) xem mục 5. Thời hạn lưu xem mục 7.

| Mã | Dữ liệu | Chủ thể | Nguồn thu thập | Nơi xuất hiện (BL) | Mục đích | Pháp lý | Mức nội bộ | Ai được xem (đề xuất – BA chốt trong RBAC) |
|---|---|---|---|---|---|---|---|---|
| D01 | Họ tên, ngày sinh, giới tính, quốc tịch | K, Đ | Đặt phòng, OTA, quét giấy tờ | 4.2, 4.12 | P01, P02, P05 | CB | C2 | Lễ tân, Quản lý/Chủ; Sale/CTV: chỉ tên + quốc tịch của khách mình phụ trách; Buồng phòng: chỉ tên + số căn trong ngày |
| D02 | SĐT, Zalo/WhatsApp/KakaoTalk, email, kênh liên hệ ưu tiên | K, Đ, L | Đặt phòng, OTA, khách tự nhập | 3.16, 4.2 | P01, P04, P05, P06 | CB | C2 | Lễ tân, Quản lý; Sale/CTV: khách/lead của mình; Buồng phòng: không |
| D03 | Số CCCD / số định danh cá nhân (và số CMND cũ trong QR) | K, Đ | Quét QR CCCD | 3.11, 4.12 | P02 | CB | **C3** | Lễ tân, Quản lý. Hồ sơ CRM chỉ giữ 4 số cuối (BL 5.13) |
| D04 | Số hộ chiếu, ngày cấp, ngày hết hạn, nơi cấp, dữ liệu MRZ | K, Đ | Quét MRZ, app khách | 3.11, 3.21, 4.12 | P02 | CB | **C3** | Lễ tân, Quản lý |
| D05 | Thị thực / diện miễn thị thực, số thị thực, ngày hết hạn, ngày nhập cảnh, cửa khẩu, mục đích nhập cảnh | K, Đ | Ảnh visa + dấu nhập cảnh, khách cung cấp | 4.12, brief 5 | P02 | CB (có thể suy ra thông tin nhạy cảm, ví dụ mục đích) | **C3** | Lễ tân, Quản lý |
| D06 | **Ảnh giấy tờ**: CCCD 2 mặt, trang thông tin hộ chiếu, trang visa, dấu nhập cảnh, giấy khai sinh | K, Đ, TE | Chụp tại quầy, khách tải qua app | 3.11, 3.21, 5.13 | P02 (chỉ trong lúc đối chiếu/khai báo) | CB (ảnh chân dung + số giấy tờ) | **C3** | Lễ tân, Quản lý; mỗi lần xem ghi nhật ký (BL 5.13) |
| D07 | Địa chỉ thường trú, quê quán, ngày cấp CCCD (đọc từ QR/chip) | K, Đ | Quét QR CCCD | 4.12 (`addr`) | P02 – **chỉ khi biểu mẫu khai báo yêu cầu** | CB | C3 | Lễ tân, Quản lý |
| D08 | Ảnh chân dung trong chip CCCD (nếu sau này đọc NFC) | K, Đ | Đọc chip | Chưa có trong BL | **Không thu thập** (đề xuất) | Có thể bị coi là sinh trắc | C3 | – |
| D09 | **Dữ liệu trẻ em**: họ tên, năm/ngày sinh, số định danh, quan hệ với người lớn | TE | Người lớn cung cấp, giấy khai sinh | 3.17, 4.4 `guests[]`, 4.12 | P02, P01 (số khách) | CB, xử lý theo chế độ riêng cho trẻ em (ND 13 Đ.20) | **C3** | Lễ tân, Quản lý. **Không** đưa vào CRM/marketing/phân khúc |
| D10 | Người đi cùng: tên, quan hệ (vợ/chồng, người yêu…), liên hệ, mã nhóm hộ `NH-xxxx` | Đ | Người đặt khai, giấy tờ, link mời | 3.17, 4.2 `hh`, 5.18 | P01, P02; P05/P06 chỉ khi chính người đó đồng ý | CB (quan hệ "người yêu" có thể suy ra đời sống riêng tư) | C2 | Lễ tân, Quản lý; Sale: không xem quan hệ |
| D11 | Lịch sử lưu trú: ngày đến/đi, căn, kênh, số khách, giờ đến dự kiến, giờ nhận/trả thực tế | K, Đ | Hệ thống | 4.4 | P01, P03, P08 | CB (thông tin vị trí theo thời gian của cá nhân) | C2 | Lễ tân, Quản lý; Buồng phòng: chỉ hôm nay, không tên đầy đủ nếu không cần |
| D12 | Sở thích, tag (VIP, kỷ niệm, gia đình có trẻ em…), **ghi chú tự do** | K | Nhân viên nhập | 3.16, 4.2 `prefs`, `note`, `tags` | P05 | CB, **có nguy cơ chứa NC** (dị ứng = sức khỏe, tôn giáo, ăn chay tôn giáo…) | C2 (C3 nếu chứa sức khỏe) | Lễ tân, Quản lý; Buồng phòng: chỉ "lưu ý phục vụ" đã chọn từ danh mục |
| D13 | Dữ liệu thẻ thanh toán: số thẻ (PAN), CVV, ngày hết hạn, tên chủ thẻ | K | Cổng thanh toán, OTA (VCC) | 3.7, 5.20 | **OTTIMO KHÔNG lưu/nhận** – xem mục 9 | Thông tin tài chính | **C3 – cấm lưu** | Không ai trong hệ thống OTTIMO |
| D14 | Kết quả thanh toán: mã giao dịch cổng, số tiền, thời điểm, phương thức, 4 số cuối + loại thẻ (nếu cổng trả về), tên/số tài khoản người chuyển khoản (sao kê VietQR) | K | Cổng, ngân hàng | 5.20, 3.7 | P03 | CB/tài chính | C2 | Lễ tân (đơn của ca), Quản lý, Kế toán |
| D15 | Tài khoản ngân hàng nhận hoàn cọc/ký quỹ | K | Khách cung cấp | BL 8.2 #6 (chưa có) | P03 | Tài chính | C3 | Quản lý, Kế toán |
| D16 | Thông tin xuất hóa đơn: tên công ty, MST, địa chỉ, email nhận; với người mua cá nhân có thể cần số định danh (L6) | K | Khách cung cấp | 3.7, 5.20 | P03 | CB | C2 | Lễ tân, Quản lý, Kế toán |
| D17 | Hợp đồng dài hạn: các bên, số giấy tờ in trong HĐ, tiền thuê, ký quỹ, kỳ thu, gói dọn | K | Sale, Lễ tân | 3.18, 4.11 | P01, P03 | CB | C2 (số giấy tờ trong HĐ: C3) | Quản lý, Lễ tân; Sale/CTV: HĐ của mình, không thấy số giấy tờ |
| D18 | Chỉ số điện nước theo căn gắn với khách dài hạn | K | Nhân viên chốt số | 4.9, 3.21 | P03 | CB (thói quen sinh hoạt) | C2 | Lễ tân, Quản lý, Bảo trì (chỉ số, không tên) |
| D19 | Mã đặt phòng OTA, email ủy quyền OTA, dữ liệu đơn từ channel manager | K | Channel manager | 4.2 `otaRef`, 5.21 | P01 | CB | C2 | Lễ tân, Quản lý |
| D20 | Hồ sơ đồng ý (ai, mục đích, nội dung bản thông báo/phiên bản, ngôn ngữ, kênh, thời điểm, rút lại) | K, Đ, TE (qua cha mẹ) | Hệ thống | 4.3 `consent` | Bằng chứng tuân thủ | CB | C2 | Quản lý; Lễ tân xem trạng thái (có/không) |
| D21 | **Vân tay** (khóa cửa thông minh) | K, NV | Đăng ký trên khóa | brief 7 #3, decision-log | P04 – **đề xuất KHÔNG dùng cho khách** | **NC (sinh trắc học)** | **C3** | Không lưu trên hệ thống OTTIMO |
| D22 | Mã cửa (PIN), thẻ từ, thời hạn hiệu lực; nhật ký mở cửa (nếu khóa trả về) | K | Hệ thống khóa | brief 7 #3, 3.21 | P04 | CB (nhật ký mở cửa = vị trí theo thời gian) | **C3** khi còn hiệu lực; C2 sau đó | Lễ tân, Quản lý; khách chỉ thấy mã của mình |
| D23 | Yêu cầu từ app khách, tin nhắn, mẫu tin đa ngôn ngữ đã gửi | K | App khách, Zalo | 3.21, 4.19, 5.19 | P04 | CB, có thể chứa NC (ốm, cần thuốc) | C2 | Bộ phận được định tuyến (BL 5.19) |
| D24 | Đánh giá khách, phản hồi "Mọi thứ ổn chứ?" | K | OTA, app | 3.20, 5.18 | P07 | CB | C0 (đã công khai) / C2 (phản hồi nội bộ) | Quản lý, Lễ tân |
| D25 | Dữ liệu kỹ thuật app khách: IP, thiết bị, phiên, token link/QR | K | Hệ thống | 3.21 | Bảo mật, vận hành | CB | C2 (token: C3) | OPS, SEC (log) |
| D26 | CTV/Sale: họ tên, SĐT, số tài khoản ngân hàng, CCCD/MST (khấu trừ thuế TNCN – cần kế toán xác nhận), hoa hồng | CTV | Hợp đồng CTV | 3.18, 4.11 | P09 | CB/tài chính | C3 (số TK, CCCD); C2 (hoa hồng) | Quản lý, Kế toán; CTV xem dữ liệu của chính mình |
| D27 | Nhân viên: tài khoản đăng nhập, vai, nhật ký thao tác (audit log) | NV | Hệ thống | 7 (đăng nhập & phân quyền) | Bảo mật, kiểm soát | CB | C2 (mật khẩu/băm: C3) | Quản lý, SEC/OPS |
| D28 | Khách tiềm năng (lead): tên, liên hệ, nhu cầu, báo giá | L | Sale/CTV | 3.18, 4.10 | P01 (trước hợp đồng), P06 nếu đồng ý | CB | C2 | Sale/CTV phụ trách, Quản lý |

**Dữ liệu không phải cá nhân nhưng xếp mức cao (phục vụ RBAC – BL 8.2 #27):** giá vốn kho, P&L, phí kênh thực tế, hoa hồng tổng → **C2**; tài khoản cổng Bộ Công an, khóa API cổng thanh toán/channel manager/MISA/Zalo, khóa mã hóa → **C3 (bí mật)**, chỉ nằm trong kho bí mật, không vào repo (`.env.example` chỉ placeholder).

**Dữ liệu chưa kiểm kê vì chưa có trong BL:** camera an ninh, ghi âm cuộc gọi, định vị. Nếu sau này thêm phải cập nhật bảng này trước khi code.

---

## 5. Mục đích xử lý và cơ sở pháp lý

Điểm then chốt: theo ND 13/2023, xử lý không cần đồng ý chỉ trong các trường hợp luật định (Đ.17) – gồm việc **luật khác bắt buộc** và (trong phạm vi hẹp) **thực hiện nghĩa vụ hợp đồng**. Không có "lợi ích hợp pháp". Luật 91/2025 có thể mở rộng/thu hẹp các trường hợp này – **luật sư xác nhận**.

| Mã | Mục đích | Dữ liệu | Cơ sở pháp lý đề xuất | Cần đồng ý? | Ghi chú thiết kế |
|---|---|---|---|---|---|
| P01 | Nhận đặt phòng, giữ chỗ, hợp đồng dài hạn, phục vụ lưu trú | D01, D02, D10, D11, D17, D19, D28 | Thực hiện hợp đồng với chủ thể | Đội đề xuất **thu xác nhận đã đọc thông báo** khi đặt; không cần ô đồng ý riêng nếu luật sư xác nhận ngoại lệ hợp đồng áp dụng | Khách OTA chưa thấy thông báo của OTTIMO → hiển thị khi check-in online/tại quầy |
| P02 | Khai báo lưu trú / tạm trú với Bộ Công an | D01, D03–D07, D09 | **Nghĩa vụ theo luật** (L3, L4) | **Không** cho việc thu thập và khai báo | **Lưu ảnh giấy tờ sau khi khai báo xong KHÔNG phải nghĩa vụ** → cần đồng ý riêng (P02b) |
| P02b | Lưu ảnh giấy tờ sau khai báo (đối chiếu khi bị kiểm tra, xử lý sai sót) | D06 | Đồng ý | **Có, riêng** | Từ chối ≠ không được ở: khách từ chối thì vẫn khai báo, ảnh xóa ngay sau khi khai báo được xác nhận (xem phát hiện F02) |
| P03 | Thanh toán, hóa đơn điện tử, kế toán, thuế, hoàn cọc | D14–D18 | Nghĩa vụ luật (L5, L6) + hợp đồng | Không | Dữ liệu thẻ đi qua cổng, không qua OTTIMO |
| P04 | Liên lạc vận hành: mã cửa, nhắc trả phòng, xử lý yêu cầu, sự cố | D02, D22, D23 | Thực hiện hợp đồng | Không (nhưng kênh liên lạc theo lựa chọn của khách) | Không dùng ngày sinh làm mã cửa (F05) |
| P05 | CRM: nhận diện khách quen, chống trùng, sở thích, phân khúc | D01, D02, D11, D12 | **Đồng ý** | **Có** | Không dùng số giấy tờ đầy đủ làm khóa CRM (F03); ghi chú tự do không ghi sức khỏe/tôn giáo nếu không có đồng ý cho dữ liệu nhạy cảm |
| P06 | Marketing: ưu đãi, mã giảm, tin khuyến mãi | D02, D10, D28 | **Đồng ý** | **Có, từng người** (BL 3.17, 5.18 đã đúng hướng) | Có link rút lại đồng ý trong mỗi tin; người đi cùng tự đồng ý |
| P07 | Xin đánh giá, khảo sát hài lòng | D02, D24 | Đồng ý (hoặc gộp P06 – luật sư xác nhận) | **Có** | Tin "Mọi thứ ổn chứ?" trong lưu trú là P04 (vận hành) – được |
| P08 | Báo cáo quản trị, chỉ số | D11 (tổng hợp) | Thực hiện hợp đồng / nội bộ | Không nếu chỉ dùng số tổng hợp | DATA dùng dữ liệu tổng hợp, không xuất danh sách cá nhân |
| P09 | Quản lý CTV/sale, chi hoa hồng | D26 | Hợp đồng CTV + nghĩa vụ thuế | Không | – |
| P10 | Bảo mật hệ thống, điều tra sự cố, nhật ký | D25, D27, nhật ký truy cập D06 | Nghĩa vụ bảo vệ dữ liệu của bên kiểm soát | Không | Log không chứa dữ liệu C3 (Phần 2) |
| P11 | Chia sẻ với bên xử lý dữ liệu: channel manager, cổng thanh toán, MISA meInvoice, Zalo OA/ZNS, dịch vụ email, nhà cung cấp khóa cửa (cloud), hosting | Tùy bên | Hợp đồng với khách + **hợp đồng xử lý dữ liệu với từng bên** | Thông báo rõ danh sách bên nhận | Bên ở nước ngoài → chuyển dữ liệu ra nước ngoài (mục 6.4, ESC-002) |

---

## 6. Đồng ý, thông báo, quyền chủ thể, hồ sơ đánh giá tác động

### 6.1 Yêu cầu về đồng ý (R-CON)
- **R-CON-01** Đồng ý tách theo từng mục đích (P02b, P05, P06, P07); không gộp vào "Điều khoản sử dụng"; không ô tích sẵn; im lặng/không phản hồi không phải đồng ý (ND 13 Đ.11).
- **R-CON-02** Lưu bằng chứng (D20): chủ thể, mục đích, **phiên bản và ngôn ngữ** văn bản đã hiển thị, kênh (app/quầy/giấy), thời điểm, người nhân viên ghi nhận (nếu tại quầy), trạng thái rút lại.
- **R-CON-03** Rút lại đồng ý dễ như khi đồng ý (app khách, link trong tin, tại quầy); hệ thống dừng xử lý mục đích đó và kích hoạt xóa theo mục 7.
- **R-CON-04** Đồng ý của **người đi cùng** do chính họ đưa ra (giữ cơ chế BL 3.17); người đặt không đồng ý thay.
- **R-CON-05** **Trẻ em**: xử lý cho P02 theo nghĩa vụ luật; mọi mục đích khác cần đồng ý của cha mẹ/người giám hộ (và của trẻ nếu từ đủ 7 tuổi theo ND 13 Đ.20). Đề xuất đơn giản: **không xử lý dữ liệu trẻ em cho bất kỳ mục đích nào ngoài P01, P02**. Ghi chú: BL dùng ngưỡng "dưới 14 tuổi" cho người đi cùng trẻ em; khái niệm trẻ em trong luật VN là dưới 16 tuổi – DOM/BA cần thống nhất hai ngưỡng (ngưỡng tính khách/giường và ngưỡng bảo vệ dữ liệu là hai chuyện khác nhau).
- **R-CON-06** Văn bản đồng ý tối thiểu VI + EN, RU theo quyết định P4; đồng ý tại quầy có thể ký trên máy tính bảng hoặc giấy rồi số hóa (bản giấy lưu theo cùng hạn).
- **R-CON-07** Đồng ý không phải điều kiện để được lưu trú, trừ dữ liệu bắt buộc cho P01–P03.

### 6.2 Thông báo xử lý dữ liệu (privacy notice)
Một văn bản "Thông báo xử lý dữ liệu cá nhân" của OTTIMO, nội dung theo ND 13 Đ.13: mục đích; loại dữ liệu; cách xử lý; tổ chức/cá nhân được xử lý (danh sách bên nhận ở P11); hậu quả không mong muốn có thể xảy ra; thời gian bắt đầu/kết thúc xử lý (bảng mục 7); quyền của khách và cách liên hệ. Hiển thị ở: web đặt phòng, app khách (trước check-in online), quầy lễ tân (QR + bản in), tin xác nhận đặt phòng trực tiếp, và **lần tiếp xúc đầu với khách OTA**. **Luật sư soạn/duyệt** – đội chỉ cung cấp khung (ESC-001).

### 6.3 Quyền của khách (R-DSR)
- **R-DSR-01** Kênh tiếp nhận: app khách + email/quầy; quản lý xử lý, ghi nhận vào nhật ký yêu cầu.
- **R-DSR-02** Hỗ trợ: xem dữ liệu của mình, sửa, xóa, rút đồng ý, hạn chế xử lý, nhận bản sao (xuất file). Thời hạn xử lý theo luật (ND 13 có mốc 72 giờ cho xóa – **luật sư xác nhận theo Luật 91**).
- **R-DSR-03** Xóa phải tôn trọng dữ liệu luật buộc lưu (hóa đơn, chứng từ, bằng chứng khai báo) – hệ thống trả lời khách rõ phần nào không xóa được và vì sao.
- **R-DSR-04** Xác minh danh tính người yêu cầu trước khi trả dữ liệu (không gửi dữ liệu cho người chỉ biết số điện thoại).

### 6.4 Hồ sơ đánh giá tác động
- **Hồ sơ đánh giá tác động xử lý dữ liệu cá nhân** (ND 13 Đ.24): OTTIMO là bên kiểm soát và xử lý dữ liệu → cần lập, lưu, và (theo ND 13) gửi cơ quan chuyên trách (A05 – Bộ Công an) trong 60 ngày kể từ khi bắt đầu xử lý. Luật 91/2025 có thể thay đổi nghĩa vụ/miễn trừ cho doanh nghiệp nhỏ – **luật sư xác nhận OTTIMO có thuộc diện phải nộp không**.
- **Hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài** (ND 13 Đ.25): cần nếu dữ liệu khách đi tới máy chủ ngoài VN – rất có khả năng xảy ra (channel manager nước ngoài, dịch vụ email, hosting cloud). Xem ESC-002.
- **Phân công:** SEC soạn bản nháp hồ sơ ở Round 3 (khi kiến trúc + danh sách bên xử lý đã chốt), luật sư duyệt, chủ đầu tư ký và nộp **trước khi đưa dữ liệu khách thật vào hệ thống**. Nội dung lấy từ chính tài liệu này (mục 4, 5, 7) + threat model (Phần 2).
- **Thông báo vi phạm:** quy trình báo cơ quan chức năng trong **72 giờ** (ND 13 Đ.23; BL 5.13) – OPS + SEC viết runbook sự cố ở Round 3.

---

## 7. Thời hạn lưu và xóa – ĐỀ XUẤT, CẦN LUẬT SƯ XÁC NHẬN

> Mọi con số trong bảng là **đề xuất của SEC** `[GIẢ ĐỊNH – chờ INV/luật sư xác nhận]`. Hệ thống phải thiết kế để **cấu hình được** (bảng tham số), không cố định trong code. Nguyên tắc: giữ ít nhất có thể; dữ liệu luật buộc lưu thì giữ đủ hạn nhưng tách khỏi dữ liệu liên lạc/marketing.

| Mã | Dữ liệu | Thời hạn đề xuất | Hành động khi hết hạn | Căn cứ / lý do |
|---|---|---|---|---|
| T01 | **Ảnh giấy tờ (D06)** – khách **không** đồng ý lưu | Xóa trong **24 giờ** sau khi khai báo chuyển "Đã xác nhận"; nếu chưa xác nhận thì tối đa 7 ngày sau trả phòng | Xóa vĩnh viễn tệp + khóa mã hóa của tệp | Tối thiểu hóa; ảnh chỉ cần để đối chiếu và khai báo |
| T02 | **Ảnh giấy tờ (D06)** – khách **đồng ý** lưu (P02b) | Tối đa **30 ngày sau trả phòng** (BL 5.13); khách dài hạn: 30 ngày sau ngày kết thúc lưu trú thực tế | Như T01 | Giữ số của BL; cần luật sư |
| T03 | Trường dữ liệu khai báo (D01, D03–D05, D07, D09) | Trong thời gian lưu trú + **12 tháng** sau trả phòng | Xóa số giấy tờ, thị thực, địa chỉ; giữ T04 | Đối chiếu khi cơ quan chức năng kiểm tra; **chưa tìm thấy quy định thời hạn cụ thể** – luật sư |
| T04 | Bằng chứng đã khai báo: mã đơn, mã hồ sơ BCA, thời điểm gửi/xác nhận, người gửi, số người (không định danh) | **5 năm** | Xóa | Chứng minh đã thực hiện nghĩa vụ – luật sư |
| T05 | Hồ sơ khách CRM (D01, D02, D12) – **không** có đồng ý P05 | Không tạo hồ sơ CRM; dữ liệu liên lạc trên đơn giữ **12 tháng** sau trả phòng (xử lý khiếu nại, đồ thất lạc) | Ẩn danh hóa đơn: thay tên/liên hệ bằng mã | Không có cơ sở lưu lâu hơn |
| T06 | Hồ sơ khách CRM – **có** đồng ý P05/P06 | Đến khi rút đồng ý, hoặc **24 tháng** không có lưu trú/tương tác | Xóa hoặc ẩn danh; gửi nhắc trước 30 ngày (tùy chọn) | Thông lệ; cấu hình được |
| T07 | Dữ liệu trẻ em (D09) | Theo T03 (chỉ phục vụ khai báo) | Xóa | Không đưa vào CRM |
| T08 | Đơn, folio, hóa đơn, chứng từ thanh toán, hợp đồng dài hạn (D14, D16, D17) | **10 năm** từ khi kết thúc năm tài chính/hợp đồng | Xóa | L5 – cần kế toán xác nhận. Sau T05/T06, các bản ghi này chỉ còn tên + số tiền, liên lạc bị ẩn danh |
| T09 | Tài khoản ngân hàng hoàn cọc (D15) | Xóa khỏi hồ sơ khách ngay khi hoàn tất hoàn tiền; bản trên chứng từ chi giữ theo T08 | Xóa | Tối thiểu hóa |
| T10 | Lead không chốt (D28) | **12 tháng** sau tương tác cuối (trừ khi có đồng ý P06) | Xóa | – |
| T11 | Mã cửa, thẻ (D22) | Vô hiệu **ngay khi trả phòng** (hoặc hết giờ trả muộn đã duyệt); xóa mã khỏi hệ thống sau 7 ngày | Vô hiệu trên khóa + xóa | An toàn thân thể khách sau |
| T12 | Nhật ký mở cửa (nếu khóa trả về) | **90 ngày** | Xóa | Điều tra sự cố an ninh; luật sư |
| T13 | Yêu cầu/tin nhắn app khách (D23) | **12 tháng** | Xóa nội dung, giữ thống kê | – |
| T14 | Hồ sơ đồng ý (D20) | Đến hết hạn lưu của dữ liệu liên quan + **3 năm** | Xóa | Thời hiệu khởi kiện (L8) |
| T15 | Nhật ký truy cập dữ liệu C3, audit log thao tác | **24 tháng** | Xóa | L7 có thể yêu cầu tối thiểu 12 tháng cho log hệ thống – luật sư |
| T16 | Log kỹ thuật ứng dụng (D25) | **90 ngày** (không chứa dữ liệu C3) | Xóa | – |
| T17 | CTV (D26) | Trong thời gian hợp tác; chứng từ chi hoa hồng theo T08; số tài khoản/CCCD xóa 12 tháng sau kết thúc hợp tác | Xóa | – |
| T18 | Bản sao lưu (backup) | Dữ liệu đã xóa sẽ biến mất khỏi backup sau tối đa **35 ngày** (chu kỳ xoay vòng backup) | Hết hạn backup | OPS thiết kế vòng đời backup khớp bảng này |

**Yêu cầu kỹ thuật kèm theo (giao ARC/BE, chi tiết ở Phần 2):** job xóa tự động chạy hằng ngày, có báo cáo "đã xóa gì" (không chứa dữ liệu đã xóa); "xóa" ảnh = xóa tệp + hủy khóa mã hóa riêng của tệp (crypto-shredding): dữ liệu **không đọc được trong hệ thống đang chạy ngay lập tức**, nhưng bản sao lưu cũ vẫn chứa khóa đã bọc nên dữ liệu **chỉ hết hẳn khi bản sao lưu đó hết hạn (≤ 35 ngày, T18)**; sau khi khôi phục từ backup phải áp lại nhật ký xóa `purge_journal` (chi tiết `security-requirements.md` SR-RET-03, SR-BAK-03, SR-BAK-06); khóa xóa (legal hold) cho trường hợp cơ quan chức năng yêu cầu giữ lại.

---

## 8. Yêu cầu với khai báo lưu trú (R-REG)

| Mã | Yêu cầu | Lý do / nguồn |
|---|---|---|
| R-REG-01 | **Hạn khai báo phải tính theo loại khách**: công dân VN – trước 23:00 ngày đến, khách đến sau 23:00 thì trước 08:00 hôm sau (L3); **người nước ngoài – trong 12 giờ kể từ khi đến** (L4), tức hạn = sớm hơn giữa "giờ nhận phòng thực tế + 12 giờ" và mốc 23:00 nếu đội muốn giữ mốc nội bộ. **Cần luật sư/DOM xác nhận** trước khi chốt BR | BL 5.12 chỉ có một mốc 23:00 – có thể thiếu với khách NN đến sớm (ví dụ nhận phòng 08:00 → hạn 20:00) |
| R-REG-02 | Khai báo/cập nhật khi khách **trả phòng, đổi phòng, gia hạn, rời sớm** (cập nhật ngày đi thực tế); ngày đi dự kiến không vượt hạn thị thực/tạm trú – cảnh báo trước | Brief mục 5 |
| R-REG-03 | Kiểm tra **hạn hộ chiếu thật** so với ngày trả phòng (sửa BL 8.2 #3) và hạn thị thực (`visaEnd ≥ ngày đi`) – cảnh báo, không chặn nhận phòng (quyết định nghiệp vụ thuộc DOM) | BL 8.2 #3 |
| R-REG-04 | Chỉ thu đúng các trường biểu mẫu cổng BCA yêu cầu (D01, D03–D05, D07 nếu cần, D09); không thu thêm "cho tiện" | Tối thiểu hóa |
| R-REG-05 | **Đồng ý lưu ảnh không phải điều kiện để khai báo** – sửa trình tự BL 5.12 (`review → [đồng ý bắt buộc] → scanned`): bước đồng ý chỉ quyết định áp T01 hay T02 | F02 |
| R-REG-06 | **Tài khoản cổng BCA của cơ sở** (C3): không lưu mật khẩu trong app OTTIMO; nhân viên tự đăng nhập cổng (luồng bán tự động); quản lý giữ trong trình quản lý mật khẩu; đổi mật khẩu khi nhân viên nghỉ việc | Bí mật; INT xác nhận cổng có cho tài khoản riêng từng nhân viên không |
| R-REG-07 | Bước "sao chép dữ liệu dạng text" (BL 3.11): chỉ trên máy lễ tân được cấp; không cho trên thiết bị cá nhân; khuyến nghị nút "Xóa clipboard" và không lưu bản text vào ghi chú | Clipboard của máy dùng chung |
| R-REG-08 | Khách tải giấy tờ trước qua app (check-in online): upload qua liên kết có thời hạn gắn với đơn, giới hạn loại/kích thước tệp, quét mã độc, lưu thẳng vào kho C3; **không nhận ảnh giấy tờ qua Zalo/email/nhóm chat** | F07 |
| R-REG-09 | Mỗi thao tác: quét, xem ảnh, xuất, gửi khai báo, nhập mã hồ sơ, xóa – ghi nhật ký (ai, lúc nào, đơn nào) | BL 5.13 |
| R-REG-10 | Nhắc hạn khai báo theo R-REG-01 cho người trực ca, kể cả ca tối; người chịu trách nhiệm ca tối do INV quyết (BL 9 câu 15 – nhóm ESC của PO/DOM) | BL 9 #15 |
| R-REG-11 | Trẻ em: khai báo theo yêu cầu cổng; không chụp/lưu giấy khai sinh quá T01 | D09 |
| R-REG-12 | Dữ liệu từ OTA/channel manager không đủ để khai báo – luôn đối chiếu với giấy tờ gốc tại check-in | Chống khai báo sai |

---

## 9. Thanh toán và PCI DSS (R-PAY)

| Mã | Yêu cầu |
|---|---|
| R-PAY-01 | **Không bao giờ** nhận, lưu, xử lý, truyền số thẻ (PAN), CVV, ngày hết hạn, dữ liệu dải từ trên hệ thống OTTIMO (server, app, log, ghi chú, tin nhắn, ảnh chụp màn hình). Quy tắc chặn (Critical – SEC có quyền chặn phát hành) |
| R-PAY-02 | Thanh toán thẻ online (giữ chỗ, cọc, thanh toán trước) dùng **trang thanh toán/redirect của cổng** (VNPay, MoMo, cổng thẻ quốc tế) – mục tiêu để phạm vi PCI DSS của OTTIMO ở mức tối thiểu (dạng tự đánh giá đơn giản nhất mà ngân hàng/cổng chấp nhận – INT xác nhận mức cụ thể với cổng) |
| R-PAY-03 | Chỉ lưu kết quả: mã giao dịch cổng, số tiền, trạng thái, thời điểm, phương thức, loại thẻ + 4 số cuối nếu cổng trả về (D14) |
| R-PAY-04 | Thẻ tại quầy: dùng máy POS của ngân hàng độc lập; nhân viên chỉ ghi "đã thu bằng thẻ" + mã chuẩn chi nếu cần, **không** nhập số thẻ vào app |
| R-PAY-05 | **Cấm nhận số thẻ qua điện thoại, Zalo, email**; mẫu tin nhắn và hướng dẫn nhân viên ghi rõ điều này |
| R-PAY-06 | **Thẻ ảo/thẻ khách từ OTA (VCC)**: không kéo dữ liệu thẻ từ channel manager về OTTIMO; nhân viên thu thẻ ảo trên extranet OTA hoặc trong channel manager (bên đó chịu PCI). INT tắt chức năng chuyển thẻ trong cấu hình kết nối |
| R-PAY-07 | Ô nhập văn bản tự do (ghi chú, tin nhắn, ghi chú bill) có kiểm tra mẫu số thẻ (chuỗi 13–19 chữ số đạt Luhn) → chặn lưu và cảnh báo |
| R-PAY-08 | Callback/IPN từ cổng phải xác thực chữ ký, đối soát số tiền với đơn, chống gọi lặp (chi tiết Phần 2, SEC review INT/BE ở Round 2) |
| R-PAY-09 | VietQR: dữ liệu người chuyển khoản trên sao kê là D14 (C2) – chỉ dùng để đối soát, không đưa vào CRM |
| R-PAY-10 | Khóa API/merchant secret của cổng chỉ ở kho bí mật của môi trường; `.env.example` chỉ placeholder |

---

## 10. Phát hiện từ baseline Round 0

Mức rủi ro: Critical / High / Medium / Low (đánh giá khi sản phẩm vận hành với dữ liệu thật nếu giữ nguyên thiết kế prototype).

| Mã | Phát hiện | Vị trí | Mức | Đề xuất | Vai xử lý |
|---|---|---|---|---|---|
| F01 | Rò rỉ quyền: Sale thấy số giấy tờ (đã che) trong CRM và P&L; Buồng phòng thấy giá vốn; mọi vai bấm được mọi hành động trong drawer/modal | BL 2, 8.2 #27 | High | RBAC theo trường dữ liệu dựa trên mức C0–C3 ở mục 3–4; Sale/CTV không thấy bất kỳ phần nào của số giấy tờ; kiểm quyền ở server | BA (RBAC), ARC, BE |
| F02 | Đồng ý lưu giấy tờ là điều kiện bắt buộc để chuyển sang khai báo → ép đồng ý (đồng ý không tự nguyện) và lẫn nghĩa vụ luật với việc cần đồng ý | BL 3.11, 5.12 | High (pháp lý) | R-REG-05, P02/P02b, T01/T02 | DOM, BA, UXD |
| F03 | Số giấy tờ là khóa định danh số 1 của CRM và dùng để gộp đơn OTA → dùng dữ liệu khai báo cho mục đích CRM (vượt mục đích) | BL 5.16, 5.21 | Medium | Khóa CRM dùng SĐT/email/mã OTA; nếu cần nhận diện khách quen bằng giấy tờ thì chỉ dùng giá trị băm có khóa bí mật (không đảo ngược) và chỉ khi khách đồng ý P05; hiển thị tối đa 4 số cuối | ARC, BA |
| F04 | Ghi chú tự do, sở thích, tag có thể chứa dữ liệu sức khỏe/tôn giáo (dị ứng, ăn kiêng tôn giáo) – dữ liệu nhạy cảm theo luật | BL 3.16, 4.2 | Medium | Danh mục "lưu ý phục vụ" chọn sẵn; cảnh báo không ghi sức khỏe vào ghi chú; nếu cần ghi dị ứng thì có đồng ý riêng và xóa theo T05 | UXD, BA |
| F05 | **Mã cửa đặt theo ngày sinh nhật khách** → đoán được (ngày sinh có trên giấy tờ, mạng xã hội, OTA), lặp lại giữa các lần lưu trú, lộ dữ liệu cá nhân qua mã | Brief 7 #3, decision-log | High (an toàn thân thể) | Mã ngẫu nhiên, hiệu lực từ giờ nhận đến giờ trả phòng. **Hiện hành (INV 19/10):** mã ngẫu nhiên 8 số mỗi lượt ở, bỏ biến thể ngày sinh (BR-403 v0.3.9; ESC-011 ghi chú 19/10). Biến thể "`ddmm` + ≥ 3 số" (decision-log 15/10, SR-LOCK-02) đã bỏ | INT, PO (ESC) |
| F06 | Khóa hỗ trợ **vân tay** – dữ liệu sinh trắc học (nhạy cảm) | Brief 7 #3 | High (pháp lý) | Không đăng ký vân tay cho khách; nếu dùng cho nhân viên thì mẫu vân tay chỉ nằm trên khóa, không đồng bộ về OTTIMO/cloud; tiêu chí chọn hãng khóa phải gồm điều này | INT |
| F07 | Thực tế vận hành: giao tiếp qua **nhóm chat**; khai báo NN cần ảnh hộ chiếu/visa/dấu nhập cảnh → ảnh giấy tờ đang (hoặc sẽ) đi qua Zalo/nhóm chat, nằm vĩnh viễn trên điện thoại cá nhân | Brief 5 | High | Kênh upload trong app (R-REG-08); quy định nội bộ: không nhận/gửi giấy tờ qua chat, xóa ảnh cũ đã có trong nhóm chat; mẫu tin nhắn hướng khách dùng link upload | PO, UXD, INV (quy định nội bộ) |
| F08 | Hạn khai báo khách NN có thể là 12 giờ, BL chỉ có mốc 23:00 | BL 5.12 | Medium (pháp lý) | R-REG-01 | DOM |
| F09 | **QR/link app khách "mở bằng QR trong phòng, không cần cài"** – nếu QR cố định theo phòng, khách sau (hoặc người chụp QR) xem được hóa đơn, hợp đồng, thông tin khách trước | BL 3.21 | High | Link/QR gắn với **đơn**, tạo mới mỗi lần lưu trú, hết hạn khi trả phòng; QR trong phòng chỉ mở trang công khai, muốn xem dữ liệu phải xác thực (mã đặt phòng + OTP) | ARC, UXD |
| F10 | Gộp hồ sơ xóa hồ sơ cũ, không có nhật ký gộp; tham chiếu treo tới REG, người đi cùng | BL 5.16, 8.2 #16 | Medium | Nhật ký gộp; khi gộp phải gộp cả đồng ý (lấy mức hẹp nhất, không "OR" như `reg`); không làm mất bằng chứng khai báo | BA, ARC |
| F11 | FOC tự duyệt, chọn tên người duyệt tự do | BL 8.2 #24 | Medium (gian lận nội bộ) | Phê duyệt bằng tài khoản người duyệt; xử lý trong Phần 2 | BA, ARC |
| F12 | Mã cửa gửi qua email sáng ngày đến | BL 3.21 | Medium | Chấp nhận được nếu mã có hạn (F05); ưu tiên hiển thị trong app khách sau xác thực; không đưa mã vào tiêu đề email/thông báo xem trước trên màn hình khóa | INT, UXD |
| F13 | Font tải từ Google Fonts → lộ IP khách/nhân viên cho bên thứ ba | BL 1, 8.4 | Low | Tự host font (đã có trong kế hoạch UXD) | UXD, FE |
| F14 | Khóa nhận diện "chuẩn hóa tên + ngày sinh" gây báo trùng sai/nhầm hồ sơ → có thể hiển thị dữ liệu của người khác | BL 5.16, 8.2 #15, #17 | Medium | Không tự động gộp; lead không nối bằng tên | BA |

---

## 11. Đầu vào giao cho các vai (để dùng ngay ở Đợt 2–3)

| Vai | Cần dùng từ tài liệu này |
|---|---|
| **BA** | Cột "Ai được xem" mục 4 + mức C0–C3 → ma trận RBAC theo trường; trình tự khai báo sửa theo R-REG-05; quyền chủ thể R-DSR thành use case |
| **DOM** | R-REG-01 (hạn theo loại khách), R-REG-02, R-REG-05; ngưỡng tuổi trẻ em (R-CON-05); F05 mã cửa |
| **ARC (Pha B)** | ERD: tách bảng/kho cho dữ liệu C3 (giấy tờ, ảnh) khỏi hồ sơ khách; bảng đồng ý (D20) theo mục đích; bảng tham số thời hạn lưu (mục 7); job xóa hằng ngày + crypto-shredding; nhật ký truy cập C3; liên kết app khách theo đơn (F09); khóa CRM không dùng số giấy tờ (F03); cờ legal hold |
| **INT** | R-PAY-02/06 (trang cổng, VCC), F05/F06 (khóa cửa), danh sách bên xử lý dữ liệu + quốc gia đặt máy chủ của từng nhà cung cấp (channel manager, email, Zalo, cổng, MISA, khóa cửa) để phục vụ ESC-002 và hồ sơ chuyển dữ liệu ra nước ngoài |
| **OPS** | T15, T16, T18 (vòng đời log và backup); bí mật trong kho bí mật; hosting theo kết quả ESC-002 |
| **UXD** | Màn hình đồng ý tách mục đích, không tích sẵn, VI/EN/RU; thông báo xử lý dữ liệu; luồng upload giấy tờ thay cho chat; hiển thị che số giấy tờ; cảnh báo không nhập số thẻ/sức khỏe vào ghi chú |
| **PO** | Story: thông báo xử lý dữ liệu, đồng ý theo mục đích, yêu cầu của chủ thể dữ liệu, tự xóa theo hạn, nhật ký truy cập giấy tờ, upload giấy tờ an toàn; gom F05 vào ESC khóa cửa; ESC-001/002 vào round-summary |
| **QA** | Test case cho R-REG-01/05, T01/T02, F01, F09, R-PAY-07 |

---

## 12. Nghĩa vụ pháp lý cần chủ đầu tư / luật sư xác nhận

| # | Câu hỏi | Liên quan |
|---|---|---|
| Q1 | Ánh xạ toàn bộ tài liệu này từ ND 13/2023 sang Luật 91/2025/QH15 và nghị định hướng dẫn hiện hành | Toàn bộ |
| Q2 | OTTIMO có thuộc diện phải lập/nộp hồ sơ đánh giá tác động không (miễn trừ doanh nghiệp nhỏ?), nộp ở đâu, hạn nào | 6.4 |
| Q3 | Ngoại lệ "thực hiện hợp đồng" có áp dụng cho P01, P04 không, hay vẫn phải xin đồng ý | 5 |
| Q4 | Thời hạn lưu: T01–T04 (giấy tờ, dữ liệu khai báo, bằng chứng khai báo), T08 (chứng từ), T12, T14, T15 | 7 |
| Q5 | Hạn khai báo khách NN (12 giờ?) và công dân VN đến sau 23:00 | R-REG-01 |
| Q6 | Lưu trữ tại Việt Nam có bắt buộc với OTTIMO không; chuyển dữ liệu khách cho channel manager/dịch vụ ở nước ngoài cần thủ tục gì | ESC-002, L7 |
| Q7 | Thông tin người mua cá nhân trên hóa đơn điện tử (có phải thu số định danh không) | D16, L6 |
| Q8 | Văn bản thông báo xử lý dữ liệu, mẫu đồng ý, điều khoản đặt phòng, hợp đồng xử lý dữ liệu với nhà cung cấp – luật sư soạn/duyệt | 6.1, 6.2, P11 |
| Q9 | Có cần chỉ định bộ phận/nhân sự bảo vệ dữ liệu cá nhân không | Luật 91 |
| Q10 | Quy định nội bộ về nhóm chat, điện thoại cá nhân của nhân viên chứa ảnh giấy tờ (F07) | INV ban hành |
| Q11 | **Lưu ý sức khỏe của khách** (dị ứng, bệnh cần lưu ý khi phục vụ, ăn kiêng vì lý do sức khỏe/tôn giáo) trong D12 – ghi chú/tag/"lưu ý phục vụ" (decision-log DOM/BA D12): (a) có phải dữ liệu cá nhân nhạy cảm theo Luật 91/2025 không; (b) cần **đồng ý riêng, rõ ràng** dạng nào (bằng văn bản/tích chọn trong app, tại quầy có được không); (c) thời hạn lưu (đề xuất theo T05/T06, xóa khi rút đồng ý); (d) nhân viên buồng phòng/F&B được thấy tới mức nào. **PO gom vào ESC-001.** Trong lúc chờ: chỉ cho chọn từ danh mục "lưu ý phục vụ" không nêu bệnh (ví dụ "không dùng đậu phộng"), cảnh báo không ghi bệnh vào ghi chú tự do (F04, SR-INP-05) | D12, F04, P05 |

---

## 13. Quyết định kỹ thuật SEC tự chốt (đề xuất ORC ghi decision-log)

| Quyết định | Lý do |
|---|---|
| Thang phân loại C0–C3 ở mục 3 là chuẩn chung cho RBAC, ERD, log | Một ngôn ngữ chung cho BA, ARC, QA |
| OTTIMO không lưu/nhận/truyền dữ liệu thẻ; chỉ trang thanh toán của cổng; không kéo VCC từ channel manager (R-PAY-01, 02, 06) | Giữ phạm vi PCI tối thiểu; vi phạm = Critical, SEC chặn phát hành |
| Dữ liệu C3 lưu tách, mã hóa mức trường/tệp, mỗi lần xem ghi nhật ký; ảnh giấy tờ xóa bằng xóa tệp + hủy khóa riêng (hết đọc được ngay trong hệ thống; hết khỏi bản sao lưu sau ≤ 35 ngày – T18) | BL 5.13 + yêu cầu tối thiểu |
| Đồng ý lưu ảnh không là điều kiện để khai báo (R-REG-05) | Tách nghĩa vụ luật với việc cần đồng ý |
| Không đăng ký vân tay khách; mẫu vân tay nhân viên không rời thiết bị khóa (F06) | Dữ liệu sinh trắc |
| Link app khách gắn với đơn, hết hạn khi trả phòng (F09) | Chống lộ dữ liệu khách trước |
| Thời hạn lưu mục 7 là giá trị mặc định cấu hình được `[GIẢ ĐỊNH – chờ INV/luật sư xác nhận]` | Chờ ESC-001 |

---

## 14. Việc còn lại (Phần 2 – Đợt 4)
- `product/docs/security/threat-model.md`: STRIDE trên kiến trúc + ERD + OpenAPI của ARC Pha B; ≥ 1 biện pháp cho mỗi rủi ro High trở lên (QC A14).
- `product/docs/security/security-requirements.md`: xác thực (nhân viên, khách qua link/OTP, CTV), phân quyền theo vai + cơ sở + trường, mã hóa và quản lý khóa, nhật ký truy cập ảnh giấy tờ, rate limit, callback thanh toán, lưu trữ trên thiết bị (app nhân viên), quản lý bí mật.
- Review bắt buộc ARC, INT, OPS ở bước 3; soát OpenAPI/ERD ở bước 5.
- Bản nháp hồ sơ đánh giá tác động: Round 3.

---

## 15. Lịch sử thay đổi

| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 – Bước 4 | Sửa câu chữ "xóa bằng hủy khóa" (mục 7, mục 13): hết đọc được trong hệ thống ngay, hết khỏi backup sau ≤ 35 ngày; F05 mã sinh nhật `ddmm` + ≥ 3 số; thêm Q11 (lưu ý sức khỏe D12) cho ESC-001 | SEC |
| 15/10/2026 | 1 – Đợt 1 | Bản đầu (Phần 1) | SEC |
