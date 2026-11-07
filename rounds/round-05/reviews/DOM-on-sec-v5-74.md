# DOM review – SEC V5-74: runbook sự cố dữ liệu khách (SR-INC-01), góc quầy

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.0, commit **`2f732f58`**. DOM xét:
  - mục 1 (ai làm gì);
  - mục 4 (nhánh A – gửi nhầm link check-in online);
  - mục 6 (mẫu dòng ghi);
  - mục 3 ở phần dấu hiệu của nhánh A.
  Nhánh B (sao lưu thoát mã 3) là việc của OPS, SEC; DOM không xét.
- Đối chiếu:
  - `guides/02-le-tan.md` bản 1.16: mục 17.3 bước 3 và bước 5, dòng 18 (một người trực giữ cả 6 vai), mục 8 (giấy tờ, khai báo);
  - `rbac-matrix.md`: A22a (cấp link), A114 (thu hồi link), A74 (xóa sớm ảnh: chỉ OWN, MGR), D06 (ảnh giấy tờ: trang khách chỉ tải lên);
  - mẫu chữ `msg.checkin_link` ("Chào {name}, …").
- Không dữ liệu khách, không số liệu production.

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN.** Nhánh A khớp `guides/02` 17.3 bước 5 ở mọi ý:
- thu hồi ngay, rồi tạo link mới gửi đúng liên hệ trên đơn;
- sổ giao ca chỉ có mã đơn, giờ và kênh;
- báo chủ đầu tư trong ngày, và ngay trong ca khi đơn có ghi lạ;
- không dùng giấy tờ lạ để khai báo, không Gắn người, Xóa ảnh;
- không báo người nhận nhầm.

Phần ai làm gì khớp cách OTTIMO đang trực: một người giữ cả 6 vai. Mẫu dòng ghi đúng phạm vi: mã đơn, giờ, kênh, việc đã làm.

**Điều kiện (thẻ 01, Major):** nhánh A chỉ đếm số lần mở link. Nhưng ở quầy, tin gửi link thường có tên khách, vì OTTIMO chào khách bằng tên (`msg.checkin_link`). Vậy mức "Thấp – không dữ liệu khách nào tới người ngoài" có thể dựa trên một điều sai, và chủ đầu tư sẽ quyết "không báo" trên điều đó. Sửa chữ trước khi runbook được dùng thật.

Ba thẻ còn lại (02 Minor, 03 và 04 Suggestion) không chặn. Không ESC.

## 1. Đối chiếu nhánh A với quầy

| Bước runbook | `guides/02` 17.3 bước 5 | Quầy làm được không | Kết quả |
|---|---|---|---|
| 1. Thu hồi link, tạo link mới, gửi đúng liên hệ trên đơn | Như nhau | Có: A114 thu hồi, A22a cấp, cho FD+. Desk hỏi lại trước khi thu hồi | Khớp |
| 1. Ghi sổ giao ca, báo OWN trong ngày | Mã đơn, giờ gửi nhầm, giờ thu hồi, kênh; không tên khách, không tên hay số người nhận nhầm | Có | Khớp. Thiếu cách báo (thẻ 03) |
| 2. Đơn có ghi lạ trước giờ thu hồi → không dùng giấy tờ để khai báo, đối chiếu bản gốc, không Gắn người, quản lý Xóa ảnh, báo OWN ngay trong ca | Như nhau | Có. Xóa ảnh cần vai quản lý (A74), mà người trực hôm nay giữ vai này | Khớp. Thiếu hai việc ở quầy (thẻ 02) |
| 3. OWN gõ `/feedback`, thêm "ghi lạ có/không" | Guide `01` 14.1 cùng ý | – | Khớp |
| 4. Đội đếm số lần mở link, SEC xếp mức | – | – | Thiếu dữ kiện nội dung tin (thẻ 01) |
| Mục 2 bước 5: không báo người nhận nhầm, trừ khi SEC đề nghị | Như nhau | Vướng khi người nhận nhầm là khách của đơn khác (thẻ 02) | Khớp chữ |

Điều runbook nói người nhận nhầm thấy được là đúng với quyền hiện có:
- người đó thấy trang khách mức 1, và ghi được vào đơn: tải ảnh, đổi giờ đến, gửi yêu cầu;
- người đó không xem được ảnh giấy tờ đã tải (D06: trang khách chỉ tải lên).

## 2. Ai làm gì (mục 1)

- **Người trực quầy (FD, FDL, MGR) chặn và ghi; OWN báo đội và quyết.** Đúng với quầy hôm nay. `guides/02` dòng 18: một người trực giữ cả 6 vai. Vì vậy người trực tự Xóa ảnh được bằng vai quản lý, có ghi lý do.
- **Khi có người chỉ có vai lễ tân** (thêm nhân viên sau này): FD và FDL không Xóa ảnh được (A74). Runbook nên ghi rõ: người đó để ảnh, không Gắn người, ghi sổ, báo OWN; OWN hoặc quản lý xóa. Thẻ 04.
- **OWN quyết tắt máy chủ, có báo cơ quan chức năng không, có báo khách không.** Đúng. Quầy không quyết gì ngoài việc chặn.
- **Không hỏi khách thật "có phải bạn gửi không"** khi chưa cần. Runbook chỉ hỏi khi đơn có ghi lạ, và hỏi lúc gửi link mới. Đúng: không làm khách lo khi chưa có gì.

## 3. Mẫu dòng ghi (mục 6)

- Đúng phạm vi:
  - dòng chỉ có mã đơn, giờ, kênh, việc đã làm, giờ báo OWN;
  - không tên khách, không tên hay số người nhận nhầm, không tên nhân viên;
  - cột "kênh" ghi loại kênh (Zalo, email, hội thoại OTA), không ghi số hay địa chỉ.
- Ba chỗ nên thêm vào mẫu nhánh A (thẻ 01, 02):
  - **ngày** gửi nhầm: đồng hồ 72 giờ tính từ giờ gửi, mà `/feedback` và decision-log không có ngày của sổ giao ca;
  - **tin kèm gì**: chỉ link, hay có tên khách, ngày ở hoặc căn;
  - **ghi lạ có/không** và **ảnh đã xóa có/không**. Bước 3 của OWN cần dữ kiện này, và chỉ quầy biết.
- Đề xuất mẫu:
  `SR-INC · nhánh A · đơn OTM-… · gửi nhầm 07/11 10:12 · tin: chỉ link / có tên khách · thu hồi 10:20 · kênh Zalo · đã tạo link mới · ghi lạ: không · ảnh đã xóa: không · báo OWN 10:25`

## 4. Thẻ

### FB-R5-DOM-SEC-V574-01
- Mức độ: **Major** – SEC (runbook mục 3, 4, 6), BA (`guides/02` 17.3 bước 3), CPY (câu gửi link). Sửa trước khi runbook được dùng thật. Không đổi mã.
- Vị trí:
  - runbook mục 3, dòng "Thấp" ("link chưa được mở trước khi thu hồi");
  - mục 4 bước 4 (chỉ đếm số lần mở);
  - mẫu dòng ở mục 6;
  - `guides/02` 17.3 bước 3 (không nói tin gửi link viết gì).
- Vấn đề:
  - Lễ tân gửi link bằng một tin tự gõ trên Zalo, email hay hội thoại OTA. Tin của OTTIMO chào khách bằng tên: mẫu `msg.checkin_link` là "Chào {name}, … {link}". Lễ tân cũng hay ghi thêm ngày ở hoặc căn.
  - Gửi nhầm người thì người nhận đã thấy tên khách, và có khi cả ngày ở, ngay trong tin, dù chưa mở link.
  - Runbook lại xếp "link chưa mở" là "không dữ liệu khách nào tới người ngoài" và đề xuất không báo.
- Vì sao quan trọng: OWN và luật sư quyết có báo cơ quan chức năng không dựa trên mức SEC xếp. Nếu tin có tên khách, quyết định "không báo" dựa trên một điều sai, mà lý do của nó còn nằm trong decision-log.
- Đề xuất sửa (SEC chọn, có thể làm cả hai):
  1. **Biết tin kèm gì:** mẫu dòng nhánh A thêm "tin: chỉ link / có tên khách / có ngày ở hoặc căn". Mức "Thấp" đổi thành "link chưa mở **và** tin không có tên, ngày ở, căn của khách". Tin có tên mà link chưa mở thì SEC xếp mức riêng, hoặc hỏi luật sư như mức Vừa.
  2. **Chặn từ gốc (rẻ hơn):** `guides/02` 17.3 bước 3 thêm: "Tin gửi link chỉ có câu chào chung và link. Không ghi tên khách, ngày ở, số căn." CPY viết câu, theo giọng OTTIMO (ngắn, lịch sự, tiếng Anh dẫn dắt, tiếng Việt hỗ trợ). Câu này chỉ dùng cho tin gửi link check-in online. Trang khách vẫn chào bằng tên sau khi mở link, nên khách thật không mất gì. Sau đó gửi nhầm mà link chưa mở thì thật sự không có dữ liệu nào ra ngoài.
- Trạng thái: Open

### FB-R5-DOM-SEC-V574-02
- Mức độ: Minor – SEC (runbook mục 4 bước 2), BA (`guides/02` 17.3 bước 5).
- Vị trí: runbook mục 4 bước 2 và mục 2 bước 5 ("Không báo người nhận nhầm").
- Vấn đề: ba việc ở quầy chưa có chữ.
  1. **Người nhận nhầm là khách của đơn khác của OTTIMO.** Đây là ca hay gặp nhất ở quầy một người: hai khách cùng đến hôm nay, lễ tân dán link của đơn này vào hội thoại của khách kia. Khách đó có thể đã làm thủ tục trên đơn sai, bằng giấy tờ của chính họ. Lễ tân vẫn phải gửi cho khách đó link của **đơn của họ**, nên họ sẽ biết đã có nhầm. Câu "không báo người nhận nhầm" làm lễ tân ngại gửi.
  2. **Giờ đến, yêu cầu do người nhận nhầm ghi:** runbook chỉ nói về giấy tờ. Giờ đến sai làm quầy chờ sai giờ. Yêu cầu lạ (dọn thêm có phí, đón sân bay…) có thể thành việc buồng phòng hoặc phí trên folio.
  3. **Đơn hiện "Đã làm thủ tục trước" mà giấy tờ không phải của khách:** guide cho đơn này "chỉ đối chiếu bản gốc", nhưng ở ca này đối chiếu sẽ không khớp.
- Vì sao quan trọng: thiếu chữ thì lễ tân đoán. Họ có thể không gửi link đúng cho khách kia, thu phí một yêu cầu khách thật không gửi, hoặc nhận phòng với giấy tờ của người khác.
- Đề xuất sửa: thêm vào bước 2:
  - "Người nhận nhầm là khách của đơn khác: gửi cho họ link của chính đơn họ, một câu xin lỗi ngắn, không nói gì về đơn kia. Ảnh họ đã tải lên đơn sai: không Gắn người, quản lý Xóa ảnh. Đơn của họ làm thủ tục bằng link đúng hoặc tại quầy."
  - "Hỏi lại khách thật giờ đến và các yêu cầu. Sửa giờ đến. Yêu cầu khách không gửi thì hủy hoặc từ chối trên Desk, không tính phí."
  - "Khách đến: làm giấy tờ tại quầy như khách không check-in online (mục 7.2, 8)."
  - SEC xác nhận rằng gửi link đúng cho khách kia không phải là "báo người nhận nhầm".
- Trạng thái: Open

### FB-R5-DOM-SEC-V574-03
- Mức độ: Suggestion – SEC (runbook mục 4 bước 1), BA (`guides/02` 17.3 bước 5).
- Vị trí: "Báo OWN trong ngày", "báo OWN ngay trong ca".
- Vấn đề:
  - Ở quầy OTTIMO, "báo quản lý" nghĩa là ghi sổ giao ca để chủ đầu tư xem sáng hôm sau (`guides/02` dòng 18). Runbook không nói "báo OWN" là nhắn thẳng, không chỉ ghi sổ.
  - Runbook cũng không nói gửi gì. Lễ tân dễ chụp màn hình hội thoại gửi nhầm để báo, mà ảnh đó có số hoặc tên của người nhận nhầm.
- Vì sao quan trọng: đồng hồ 72 giờ đã chạy từ giờ gửi nhầm. Nếu chủ đầu tư chỉ biết khi đọc sổ sáng hôm sau, đội mất gần nửa ngày. Còn ảnh chụp hội thoại thì đưa thêm dữ liệu người ngoài vào máy của chủ đầu tư.
- Đề xuất sửa: "Báo OWN = nhắn qua số đã lưu sẵn trong danh bạ điện thoại cơ sở, gửi đúng dòng mẫu ở mục 6. Không gửi ảnh chụp hội thoại gửi nhầm. Có ghi lạ thì gọi ngay. Sau 22:00 mà không có ghi lạ: nhắn ngay, chủ đầu tư đọc lúc thức dậy."
- Trạng thái: Open

### FB-R5-DOM-SEC-V574-04
- Mức độ: Suggestion – SEC (runbook mục 1).
- Vị trí: mục 1, dòng "Người trực quầy (lễ tân, lễ tân trưởng, quản lý)".
- Vấn đề: dòng gộp ba vai, mà Xóa ảnh chỉ có ở vai quản lý trở lên (A74). Hôm nay không vướng, vì một người giữ cả 6 vai. Nhưng khi có người chỉ có vai lễ tân, họ sẽ tìm nút Xóa ảnh không có.
- Vì sao quan trọng: ảnh giấy tờ của người lạ nằm trên đơn lâu hơn mức cần.
- Đề xuất sửa: thêm một câu dưới bảng: "Xóa ảnh: chỉ quản lý, chủ đầu tư. Người trực chỉ có vai lễ tân: không Gắn người, ghi sổ, báo OWN ngay; OWN hoặc quản lý xóa."
- Trạng thái: Open

## 5. Điểm làm tốt

- Nhánh A chép đúng cách quầy đã tập ở `guides/02` 17.3. Lễ tân không phải học hai cách.
- Mục 2 bước 2 ghi "Chặn trước, hỏi sau" và "không xóa sổ giao ca, nhật ký". Đúng cách giữ chứng cứ ở quầy.
- Đồng hồ 72 giờ tính từ giờ gửi nhầm, giờ mà quầy biết được từ hội thoại. Đây là cách tính chặt nhất, có lý do rõ.
- Mẫu dòng ghi dùng chung cho sổ giao ca, `/feedback` và decision-log, có danh sách "không bao giờ ghi".

## 6. Giả định

- Lễ tân gửi link bằng tin tự gõ. Desk hiện chỉ có **Sao chép link**, chưa gửi tin bằng mẫu (mẫu tin dự kiến v1.2). Câu chào bằng tên theo `msg.checkin_link` và theo giọng OTTIMO.
- Người trực quầy hôm nay giữ cả 6 vai (`guides/02` dòng 18).
- Mức sự cố và việc có phải báo cơ quan chức năng là của SEC, OWN và luật sư. DOM chỉ nêu dữ kiện ở quầy.

## 7. Dòng decision log (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review SEC V5-74 runbook sự cố dữ liệu khách @ 2f732f58: DUYỆT CÓ ĐIỀU KIỆN (góc quầy).** Nhánh A khớp guides/02 17.3 bước 5 (thu hồi, tạo link mới gửi liên hệ trên đơn, sổ giao ca chỉ mã đơn – giờ – kênh, báo OWN trong ngày / ngay trong ca khi có ghi lạ, không khai báo bằng giấy tờ lạ, không Gắn người, Xóa ảnh, không báo người nhận nhầm); ai làm gì khớp quầy một người giữ 6 vai; mẫu dòng đúng phạm vi. **Điều kiện – thẻ V574-01 Major:** tin gửi link thường có tên khách ("Chào {name}"), nên "link chưa mở = không dữ liệu ra ngoài" có thể sai; thêm "tin kèm gì" vào mẫu và điều kiện mức Thấp, và/hoặc guides/02 17.3 bước 3 dùng câu chào chung không tên, ngày ở, căn (CPY viết). V574-02 Minor: người nhận nhầm là khách đơn khác (gửi link đơn của họ), sửa giờ đến và hủy yêu cầu lạ, làm giấy tờ tại quầy. V574-03 Suggestion: báo OWN là nhắn thẳng bằng dòng mẫu, không gửi ảnh chụp hội thoại. V574-04 Suggestion: Xóa ảnh chỉ MGR/OWN (A74). Mẫu dòng thêm ngày, tin kèm gì, ghi lạ, ảnh đã xóa. Không ESC | DOM | rounds/round-05/reviews/DOM-on-sec-v5-74.md |`
