# FB-INV-013 – Quy tắc nhắc visa, nhắc hết hợp đồng, checklist tạm trú (DOM)

- Tác giả: DOM | Round 5 – Sản xuất | 18/11/2026 | Đầu vào: FB-INV-013 (INV chốt 18/11), `fb-inv-012/DOM-rules.md`, `business-rules.md` v0.5.17 BR-211, BR-424, BR-603…613, BR-907 (chỉ đọc).
- Nhãn: **INV** đã chốt · **NGÀNH** DOM tự quyết · **ĐỀ XUẤT** đội làm theo tới khi INV nói khác · **CẦN XÁC NHẬN** pháp lý (hỏi công an phường, mục 4). Ví dụ đều giả.
- Kênh chung (INV): nhắc ở "Cần chú ý" (BR-907) **và** email 8h sáng. **Không** gửi gì cho khách; lễ tân tự liên hệ và ghi kết quả. Chỉ lưu ngày, không lưu ảnh visa mới.

## 1. Visa / hạn tạm trú

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-20 | **Mốc = "được tạm trú đến ngày"** (ngày cuối được ở, tính cả ngày đó) ghi trên giấy tờ có hiệu lực **muộn nhất**: thẻ tạm trú > thị thực (gồm e-visa) > dấu kiểm chứng nhập cảnh (khách miễn thị thực). Lễ tân nhập **ngày trên giấy tờ**, không tự cộng. NGÀNH | E-visa đến 10/01/2027 → mốc 10/01 |
| BR-LS-21 | **Khách miễn thị thực** (ví dụ khách Nga 45 ngày): lễ tân nhập **ngày nhập cảnh** + chọn diện miễn; Desk **gợi ý** ngày = nhập cảnh + số ngày − 1, lễ tân đối chiếu dấu nhập cảnh rồi lưu (dấu khác gợi ý thì theo dấu). Số ngày theo quốc tịch là bảng tham số, CẦN XÁC NHẬN khi chính sách đổi. ĐỀ XUẤT | Nhập cảnh 01/12/2026, 45 ngày → gợi ý **14/01/2027** |
| BR-LS-22 | **Ai cần**: chỉ khách NN theo BR-009 (giấy tờ khai báo là hộ chiếu NN, kể cả Việt kiều). Khách CCCD VN không có ô này. Mỗi **người** NN trong HĐ (BR-601) một mốc riêng. NGÀNH | Cặp vợ chồng NN → 2 mốc |
| BR-LS-23 | **Nhắc**: từ **D−5** đến D (`visa_expiry_reminder_days` = 5, INV), mỗi ngày, cho tới khi lễ tân **sửa ngày mới** hoặc khách **trả phòng**. Sửa ngày → Desk giữ lịch sử (ngày cũ, ngày mới, người sửa, lúc sửa) và sinh việc "cập nhật tạm trú" (BR-LS-28). Lễ tân có thể ghi "đang làm thủ tục, hẹn [ngày]" – vẫn nhắc hằng ngày. Nhắc sớm 30 ngày của BR-605: xem câu hỏi Q1. INV | Hết hạn 20/12 → nhắc 15/12 … 20/12 |
| BR-LS-24 | **Quá hạn** (D+1 trở đi, khách còn ở, chưa có ngày mới): dòng **đỏ** "Visa quá hạn – khách còn ở" ở đầu "Cần chú ý" và đầu email, quản lý nhận; **không** tự chặn mã cửa (khớp BR-613 a). Lễ tân trưởng ghi cách xử lý. Cơ sở lưu trú cho người quá hạn tạm trú ở có thể bị xử phạt – CẦN XÁC NHẬN mức phạt hiện hành. ĐỀ XUẤT | 21/12 chưa cập nhật → đỏ |

## 2. Hợp đồng sắp hết

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-25 | **Nhắc hỏi gia hạn** từ **D−10** trước ngày kết thúc HĐ (`contract_end_reminder_days` = 10, INV). Mỗi lần hỏi ghi: ngày, người, kết quả. INV | HĐ hết 31/12 → nhắc từ 21/12 |
| BR-LS-26 | **Ba kết quả**: (1) **Gia hạn đến [ngày]** → nhắc đổi thành "lập phụ lục/HĐ gia hạn" (BR-211) tới khi lập xong; khách NN mà mốc visa < ngày mới → cảnh báo ngay (BR-605). (2) **Không gia hạn – trả phòng [ngày]** (≤ ngày kết thúc; sớm hơn thì báo quản lý xét điều khoản trả sớm/cọc) → dừng nhắc, căn mở bán từ đêm sau ngày trả, sinh việc "cập nhật ngày đi" (BR-604). (3) **Chưa trả lời** → nhắc lại **mỗi ngày**. NGÀNH + INV | Khách báo trả 28/12 → căn bán từ đêm 28/12 |
| BR-LS-27 | **Tới D vẫn "Chưa trả lời"** → đỏ cho quản lý; **qua D khách còn ở** mà không có kết quả → đỏ "HĐ đã hết – khách còn ở". Mốc 30 ngày BR-211: xem Q1. ĐỀ XUẤT | 31/12 chưa trả lời → đỏ |

## 3. Checklist đăng ký tạm trú

| Mã | Quy tắc |
|---|---|
| BR-LS-28 | **Một dòng mỗi người** (VN và NN), dùng lại trạng thái SM-05 (BR-607), Desk chỉ gom thành 3 nhãn: **Chưa khai** (`none`…`scanned`), **Đã khai** (`sent`/`confirmed`/`updated`), **Cần khai lại** (`needs_update`). Ô tối thiểu: trạng thái · ngày giờ khai · người khai (tự lấy tài khoản) · mã hồ sơ cổng (không bắt buộc) · "tạm trú đến ngày" đã khai · ghi chú. **Khách đã ở trước khi có Desk** (10 căn dài hạn hiện nay): cho tick "đã khai ngoài app" + ngày + người, không bắt chạy lại cả luồng. Chưa khai → "Cần chú ý" (hạn theo BR-602/603). |
| BR-LS-29 | **Khi nào "Cần khai lại"** (ĐỀ XUẤT, CẦN XÁC NHẬN từng ý): gia hạn HĐ hoặc đổi ngày trả (BR-604); gia hạn visa/đổi thẻ tạm trú; đổi hộ chiếu mới; **khách xuất cảnh rồi nhập cảnh lại** (đi "visa run") = lần nhập cảnh mới → khai mới trong 12 giờ sau khi về. **Đổi phòng cùng cơ sở**: không khai lại (BR-424). |

**Thực tế pháp lý theo DOM hiểu (CẦN XÁC NHẬN)**: Luật 47/2014/QH13 (sửa 2019, 2023) Điều 33 – cơ sở lưu trú khai báo tạm trú cho người NN **trong 12 giờ** kể từ khi đến (24 giờ chỉ vùng sâu vùng xa; Đà Lạt áp 12 giờ, BR-603). Kênh: khai trực tuyến trên trang khai báo tạm trú của công an (BR-606). Khách VN: thông báo lưu trú theo Luật Cư trú (BR-602). Sau sắp xếp tỉnh và bỏ công an cấp huyện (07/2025), địa chỉ cổng và tài khoản của cơ sở có thể đã đổi.

## 4. Email tóm tắt 08:00

- **Người nhận** (ĐỀ XUẤT): tài khoản vai lễ tân, lễ tân trưởng, quản lý đang hoạt động + email chủ (INV) – danh sách trong cài đặt, không gửi khách. Giờ Asia/Ho_Chi_Minh; **ngày không có việc vẫn gửi** một dòng "Không có việc cần chú ý" để biết hệ thống chạy.
- **Nội dung tối thiểu**, theo thứ tự: (1) dòng đỏ quá hạn (visa, HĐ); (2) Visa D−5…D: căn · tên rút gọn · ngày hết hạn · còn N ngày · ghi chú gần nhất; (3) HĐ D−10…D: căn · tên · ngày kết thúc · kết quả lần hỏi gần nhất; (4) Tạm trú Chưa khai / Cần khai lại: căn · tên · hạn khai; (5) nút mở Desk.
- **Không ghi**: số hộ chiếu, số thị thực/thẻ tạm trú, ngày sinh, quốc tịch, SĐT, ảnh. Tên dạng rút gọn (ví dụ "Ivan P. – The Pine"). Trình bày theo brand OTTIMO (UXD).

## 5. Câu hỏi INV (≤ 2)

- **Q1 – Mốc nhắc sớm cũ.** Desk đang có (BR-605, BR-211, chưa INV xác nhận) nhắc visa khách dài hạn **trước 30 ngày** và chào gia hạn HĐ **trước 30 ngày**. Gia hạn visa qua dịch vụ mất 5–10 ngày làm việc, nên D−5 có thể đã muộn. **Đề xuất A**: giữ mốc 30 ngày ở mức nhẹ (một dòng trong email, **một lần**, không vào "Cần chú ý"), còn 5/10 ngày là nhắc hằng ngày như INV chốt. B: bỏ hẳn 30 ngày, chỉ dùng 5/10.
- **Q2 – Hỏi công an phường (ĐỀ XUẤT INV hỏi một lần, đội cập nhật tham số):** (a) gia hạn visa / đổi hộ chiếu / đổi phòng cùng cơ sở có phải khai lại không; (b) địa chỉ cổng khai báo và tài khoản cơ sở sau sắp xếp 07/2025 còn đúng không; (c) khách nhập cảnh lại sau visa run khai mới hay cập nhật. Cho tới khi có trả lời, Desk làm theo BR-LS-29.
