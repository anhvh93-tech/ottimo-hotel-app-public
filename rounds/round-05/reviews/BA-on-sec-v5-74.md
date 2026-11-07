# BA review – SEC V5-74: runbook sự cố dữ liệu khách (SR-INC-01)

- Người review: BA | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Tác giả: SEC. Kết luận dưới đây là cho **bản 1.1 @ `3174ce65`** (ORC giao: review bản 1.1, không phải `2f732f58`). BA đọc bản 1.0 @ `2f732f58` trước, rồi đọc lại toàn bộ bản 1.1. Đối tượng:
  - `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.1 (sửa theo DOM V574-01…04, `rounds/round-05/responses/SEC-responses.md` mục 7);
  - chỗ trỏ ở tệp của BA: `product/docs/so-van-hanh.md` mục 1.1a, 3.4, 7.4 (`2f732f58`); `guides/01-chu-dau-tu-quan-ly.md` mục 14.1 và `guides/02-le-tan.md` 17.3 bước 5 (`3174ce65`, "chưa đánh số bản");
  - dòng SR-INC-01 (`security/security-requirements.md`), câu luật sư Q12 (`security/data-risk-assessment.md`): BA chỉ đọc để đối chiếu.
- Đối chiếu với:
  - `guides/02-le-tan.md` mục 17.3 bước 5 (gửi nhầm người) và Tờ 1 (`product/docs/staff-one-pager.md`, dòng "Gửi nhầm người", PO sửa ở `a38bfcdc`);
  - `rbac-matrix.md` 0.2.9: A22a, A70, A74, A100, A110, A112, A114, A115, S26, S30;
  - `so-van-hanh.md` 1.1a, 3.1–3.4; `guides/01` 14.1, 17;
  - plan R5 dòng V5-74; giao thức đội mục 8 (pháp lý thuộc quyền INV).
- Phạm vi: đọc dễ không (chủ đầu tư, nhân viên); khớp 17.3 và Tờ 1 không; vai có khớp ma trận phân quyền không; đánh số bản ở tệp của BA. BA không xét phần kỹ thuật của nhánh B (`pull-backups.sh`, KEK, `id_hash_key`): việc của OPS, ARC.
- Cùng bản đã có `DOM-on-sec-v5-74.md` (góc quầy, thẻ DOM-SEC-V574-01…04, SEC đã sửa cả bốn ở 1.1) và `OPS-on-sec-v5-74.md` (nhánh B). Thẻ của BA không lặp các thẻ đó.
- Không có dữ liệu khách, tên nhân viên hay số tiền hoa hồng trong tệp này.

## 0. Kết luận (bản 1.1)

**DUYỆT CÓ ĐIỀU KIỆN.** Runbook dùng được: năm bước rõ, mỗi bước có người làm và hạn, mức Thấp/Vừa/Cao dễ xếp, mẫu dòng ghi không có dữ liệu khách. Bản 1.1 tốt hơn 1.0 ở đúng chỗ quầy hay vấp: mức Thấp nay cần cả "link chưa mở" **và** "tin chỉ có link"; báo chủ đầu tư là nhắn thẳng, không chụp hội thoại; có ghi lạ thì gọi ngay; người nhận nhầm là khách đơn khác có cách làm riêng. Nhánh A khớp 17.3 bước 5 (SEC sửa cùng commit) ở mọi việc của quầy. Tờ 1 (PO `a38bfcdc`) khớp ở bản rút gọn.

Điều kiện: sửa **thẻ 01 (Major)** trước khi ORC ghi V5-74 xong. Bản 1.1 vẫn dặn ở nhánh A bước 1: "gửi đúng liên hệ trên đơn". Nếu gửi nhầm là do chính liên hệ trên đơn sai, quầy sẽ gửi link mới tới đúng người nhận nhầm lần nữa.

Còn lại không chặn:
- 4 Minor, bản 1.1 còn nguyên: vai khoanh vùng chưa khớp RBAC (02), ai quyết việc báo (03), ca luật sư hay OWN chưa trả lời trước giờ thứ 48 (04), nhân viên không có tệp này trong tay (05);
- 3 Suggestion (06–08). Thẻ 06 nay chỉ còn phần của BA, BA đã làm.

Bảy chỗ lệch nằm ở tệp của BA (mục 3). BA tự sửa và đánh số bản ở commit Phản hồi & sửa kế tiếp, không cần SEC làm gì.

Không ESC mới. Câu luật sư Q12 đã nằm trong ESC-001.

## 1. Đối chiếu

### 1.1 Nhánh A (bản 1.1) với `02` 17.3 bước 5 và Tờ 1

| Việc ở quầy | Runbook 1.1 mục 4 | `02` 17.3 bước 5 (`3174ce65`) | Tờ 1 (`a38bfcdc`) | Kết quả |
|---|---|---|---|---|
| Thu hồi ngay, rồi tạo link mới | Bước 1: **Thu hồi link**, **Tạo link mới**, "gửi đúng liên hệ trên đơn" | **Thu hồi link** ngay, **Tạo link mới**, "gửi đúng khách" | "tạo link mới cho đúng khách" | Khớp tên nút. Chỗ gửi lại lệch: thẻ 01 |
| Ghi sổ giao ca | Theo mẫu mục 6: đơn, ngày giờ gửi nhầm, tin kèm gì, thu hồi, kênh, đã tạo link mới, ghi lạ, ảnh đã xóa, báo OWN. Không chụp hội thoại | Đơn, ngày giờ, tin kèm gì, thu hồi, kênh. Không chụp hội thoại | Như 17.3 | 17.3 thiếu ba ô của mẫu (link mới, ghi lạ, ảnh đã xóa) và không có dòng mẫu: BA thêm (mục 3, S6) |
| Báo chủ đầu tư | Nhắn thẳng đúng dòng mẫu, ngay, muộn nhất trong ngày; sau 22:00 vẫn nhắn | Nhắn thẳng đúng dòng sổ giao ca, trong ngày | Nhắn thẳng, trong ngày | Khớp |
| Đơn có ghi lạ trước giờ thu hồi | Bước 2: không dùng giấy tờ đó; không **Gắn người**, quản lý **Xóa ảnh**; gọi OWN ngay; hỏi lại giờ đến và yêu cầu; hủy yêu cầu lạ không tính phí; khách đến làm giấy tờ tại quầy | Cùng các việc đó | Rút gọn: không dùng giấy tờ, gọi chủ đầu tư | Khớp. Tờ 1 rút gọn vì giới hạn chữ (plan R5 quyết định 21) |
| Người nhận nhầm là khách đơn khác | Gửi link đơn của họ, một câu xin lỗi, không phải "báo người nhận nhầm" | Như runbook | – | Khớp |
| Người nhận nhầm thấy gì | Trang khách mức 1, ghi được vào đơn; không xem ảnh giấy tờ đã tải | Tên gọi, mã đơn, ngày ở, căn, giờ đến; ghi được vào đơn | – | Khớp, cùng danh sách với mức Vừa ở mục 3 |
| Báo khách, báo người nhận nhầm | Mục 2 bước 5: OWN báo khách khi mức Cao, khi luật sư hay cơ quan yêu cầu, hoặc khi khách cần tự làm gì; người nhận nhầm chỉ khi SEC đề nghị | "Không báo khách hay người nhận nhầm, trừ khi đội bảo mật đề nghị" | – | Đúng với quầy: quầy không tự báo. `01` 14.1 cần nêu đủ điều kiện của OWN: BA sửa (S3) |
| Ai quyết báo cơ quan chức năng | Bước 4: "SEC đề xuất, OWN quyết"; mục 1, 3, 6: "cùng SEC", "OWN + SEC" | "Chủ đầu tư cùng đội bảo mật quyết" | – | Hai cách nói: thẻ 03; BA sửa 17.3 theo bước 4 (S2) |

### 1.2 Vai với ma trận phân quyền

| Việc trong runbook | Ai làm (runbook) | RBAC 0.2.9 | Kết quả |
|---|---|---|---|
| **Thu hồi link**, **Tạo link mới** | Quầy (lễ tân, lễ tân trưởng, quản lý) | A114, A22a: OWN, MGR, FDL, FD | Khớp |
| Không **Gắn người** ảnh lạ | Quầy | A70: FD+ | Khớp |
| **Xóa ảnh** không phải người trên đơn | Quản lý; bản 1.1 thêm câu dưới bảng mục 1: chỉ quản lý, chủ đầu tư | A74: OWN, MGR (L Q); FDL, FD ✖ | Khớp |
| Hủy hoặc từ chối yêu cầu khách không gửi (bản 1.1) | Quầy | S30: OWN, MGR, FDL, FD | Khớp |
| Khóa tài khoản, đặt lại mật khẩu người khác | Mục 2 bước 2, gộp "Quầy, OWN, OPS" | A100: **chỉ OWN** | Lệch cách viết: thẻ 02 |
| Thu hồi phiên, thu hồi thiết bị được cấp | Không nêu; SR-INC-01 có "thu hồi phiên, thiết bị" | A115, A110: **chỉ OWN**. MGR ở S26 chỉ có việc của tài khoản mình (◐, ghi chú 20a) | Thiếu: thẻ 02 |
| Đổi mật khẩu của chính mình | Không nêu | A112: mọi vai | Thêm được vào thẻ 02 |
| Tắt máy chủ, không duyệt phát hành | OWN quyết | Ngoài RBAC của app; sổ vận hành 1.1a | Khớp |
| Kết nối máy chủ chỉ đọc | ORC, OPS khi OWN đồng ý trong chat | Ngoài RBAC; giao thức đội | Khớp |

Phần việc của quầy đúng quyền. Một người trực giữ nhiều vai thì làm phần của mọi vai mình giữ (sổ vận hành mục 1), nên câu "quản lý **Xóa ảnh**" vẫn đúng khi người trực có vai quản lý.

### 1.3 Chỗ SEC sửa ở tệp BA (`2f732f58`, `3174ce65`)

| Chỗ | Chữ SEC thêm | Kết quả |
|---|---|---|
| Sổ vận hành 1.1a, gạch mã 3 | "Các bước đầy đủ và ai quyết: runbook … mục 5" | Đúng chỗ. Gạch ngay trên vẫn ghi "**Nếu xác nhận** dữ liệu khách bị lộ…", trong khi runbook mục 5 bước 3 coi như đã bị xâm nhập (mức Cao) và tính 72 giờ từ giờ lượt kéo. BA sửa (S1) |
| Sổ vận hành 3.4, câu đầu | Mọi sự cố dữ liệu khách theo runbook; "anh/chị cùng đội bảo mật quyết" | Câu nằm trong mục "Đội xử lý **P0**" và kể cả gửi nhầm link, mà runbook bước 3 và `01` 14.1 ghi "không cần P0". "Cùng đội bảo mật quyết" khác 1.1a ("anh/chị quyết"). BA sửa (S2), xem thẻ 03 |
| Sổ vận hành 7.4 | Dòng tài liệu mới | Đúng |
| `01` 14.1 | Trỏ runbook mục 4; bản 1.1 thêm ngày gửi và tin gửi nhầm kèm gì | Đúng. Câu hỏi gửi đội vẫn chỉ có dấu hiệu **Đã làm thủ tục trước**, trong khi dòng mẫu mục 6 có "ghi lạ" (cả ba dấu hiệu) và "ảnh đã xóa"; chưa nói ai quyết, khi nào báo khách. BA sửa (S3) |
| `02` 17.3 bước 5 | Bản 1.1: tin kèm gì, nhắn thẳng, gọi ngay khi ghi lạ, khách đơn khác, giấy tờ tại quầy, trỏ runbook | Khớp runbook ở mọi việc. Còn thiếu ba ô của mẫu (link mới, ghi lạ, ảnh đã xóa) và dòng mẫu; "Vì sao" vẫn ghi "chủ đầu tư cùng đội bảo mật quyết". BA sửa (S2, S6) |
| Sổ tay 2.9 bước 6 | SEC chưa chép | ORC giao BA chép cùng ý (S6) |
| Lịch sử | Sổ vận hành: dòng "sau 1.7, chưa đánh số"; `01`, `02`: "Sửa 07/11/2026, chưa đánh số bản" | Đúng cách SEC báo. Sổ vận hành có bản 1.7 ở dòng **Lập:** nhưng thiếu dòng 1.7 ở bảng Lịch sử (sót của BA). BA đánh số (S5) |

### 1.4 Đọc có dễ không

- **Chủ đầu tư:** đọc mục 1 (ai quyết), mục 2 (năm bước) và mục 3 (mức) là đủ để biết mình phải quyết gì và trước giờ nào. Câu "đồng hồ 72 giờ" và "chậm nhất giờ thứ 48" rõ. Chỗ khó: dòng 8 dồn bốn ý vào một đoạn; mục 5 bước 4 không ghi ai làm (thẻ 07).
- **Nhân viên:** bước 1–2 của nhánh A ngắn, đúng tên nút, giống hệt 17.3. Nhưng nhân viên không có tệp này: bộ hướng dẫn và Tờ 1 mới là thứ họ cầm (thẻ 05).
- Không còn chữ mơ hồ kiểu "v.v.", "tùy", "phù hợp". Mọi liên hệ ghi theo vai. Mẫu dòng ghi đúng giới hạn: mã đơn, giờ, kênh, việc đã làm.

## 2. Thẻ

### FB-R5-BA-SEC-V574-01
- Mức độ: **Major** – SEC (runbook), DOM xác nhận câu ở quầy, BA (`02` 17.3, Tờ 1, sổ tay) sau khi DOM xác nhận.
- Vị trí: `runbook-su-co-du-lieu-khach.md` mục 4 bước 1: "**Tạo link mới**, gửi đúng liên hệ trên đơn". Bản 1.1: còn nguyên.
- Vấn đề: runbook chỉ có một luồng: người gửi chọn nhầm hội thoại hoặc gõ nhầm số. Còn một ca hay gặp: **liên hệ trên đơn sai** (gõ sai số khi tạo đơn, khách dùng số khác, sale đưa số người đặt hộ). Khi đó "gửi đúng liên hệ trên đơn" là gửi link mới cho đúng người nhận nhầm lần thứ hai. Người đó lại ghi được vào đơn tới lúc thu hồi lần nữa. `02` 17.3 ghi "gửi đúng khách", nên không lặp lỗi này, nhưng cũng không nói phải làm gì khi không chắc liên hệ nào đúng.
- Vì sao quan trọng: lộ lần hai cùng dữ liệu của cùng khách, trên một sự cố đang chạy đồng hồ 72 giờ. Quầy làm đúng chữ runbook mà vẫn làm lộ thêm.
- Đề xuất sửa: thêm vào bước 1, sau "**Tạo link mới**":
  > Trước khi gửi, kiểm liên hệ trên đơn. Nhầm là do liên hệ trên đơn sai, hoặc không chắc liên hệ nào là của khách: **không** gửi link mới. Mời khách làm thủ tục tại quầy khi đến. Ghi vào dòng sổ giao ca "liên hệ trên đơn sai: có/không".

  Cách này dùng lại luật đã có ở 17.3 bước 3 ("gửi tới liên hệ trên đơn, hoặc mời làm thủ tục tại quầy"), không thêm luật mới. Sửa liên hệ trên đơn là việc khác, theo luồng hồ sơ khách thường; runbook không cần nói. DOM xác nhận câu, rồi BA chép sang 17.3 bước 5, Tờ 1 và sổ tay ở bản kế tiếp.
- Trạng thái: Open

### FB-R5-BA-SEC-V574-02
- Mức độ: Minor – SEC.
- Vị trí: runbook mục 1 dòng "Người trực quầy" ("Chặn ngay ở quầy"); mục 2 bước 2 ("thu hồi link, khóa tài khoản hoặc đặt lại mật khẩu, … | Quầy, OWN, OPS"). Bản 1.1: câu "Xóa ảnh" (DOM 04) đã đúng; phần khóa tài khoản còn nguyên.
- Vấn đề: bước 2 gộp việc của ba bên vào một ô. Đọc thẳng thì quầy, kể cả quản lý, được khóa tài khoản và đặt lại mật khẩu người khác. Theo RBAC, A100 (khóa, đặt lại mật khẩu), A115 (thu hồi phiên của người khác), A110 (thu hồi thiết bị được cấp) là **chỉ OWN**. Quản lý ở S26 chỉ làm việc của tài khoản mình. Dòng SR-INC-01 có "thu hồi phiên, thiết bị", nhưng runbook không ghi ai làm.
- Vì sao quan trọng: lúc sự cố, quản lý đi tìm nút khóa tài khoản mà không có, trong khi chủ đầu tư tưởng quầy đã chặn. Việc khoanh vùng trễ.
- Đề xuất sửa: tách bước 2 theo người làm:
  - Quầy (lễ tân trở lên): **Thu hồi link** (A114); tự đổi mật khẩu của mình nếu nghi lộ (A112); báo OWN.
  - OWN: khóa tài khoản, đặt lại mật khẩu người khác (A100); thu hồi phiên (A115) và thiết bị được cấp (A110); quyết tạm tắt máy chủ. Hướng dẫn `01` mục 1.9.
  - OPS: khoanh vùng trên máy chủ khi OWN đồng ý.

  Dòng "Người trực quầy" ở mục 1 ghi "Thu hồi link khách" thay cho "Chặn ngay ở quầy".
- Trạng thái: Open

### FB-R5-BA-SEC-V574-03
- Mức độ: Minor – SEC (runbook); BA sửa câu ở sổ vận hành 3.4 (mục 3, S2).
- Vị trí: runbook mục 1 cột "Quyết" của OWN ("Có báo cơ quan chức năng không (cùng SEC)"); mục 3 dòng Vừa ("OWN quyết cùng SEC"); mục 6 mẫu decision-log ("| OWN + SEC |"). Mục 2 bước 4 thì ghi "SEC đề xuất, OWN quyết, luật sư xác nhận". Bản 1.1: còn nguyên; `02` 17.3 bước 5 (bản 1.1) cũng ghi "chủ đầu tư cùng đội bảo mật quyết".
- Vấn đề: cùng một quyết định mà có hai cách nói. "Cùng SEC" và "OWN + SEC" đọc như hai người cùng chịu trách nhiệm quyết. Theo giao thức mục 8, pháp lý là quyền của chủ đầu tư; đội đề xuất. Plan R5 dòng V5-74 cũng viết "(INV cùng SEC)".
- Vì sao quan trọng: decision-log ghi người quyết. Ghi "OWN + SEC" thì sau này khó biết ai đã chọn không báo, nhất là ở mức Vừa.
- Đề xuất sửa: dùng một câu ở mọi chỗ: "OWN quyết; SEC đề xuất; luật sư xác nhận". Mẫu decision-log: cột người quyết là `OWN`; câu quyết ghi "SEC đề xuất <báo/không báo>". BA đã sửa sổ vận hành 3.4, `02` 17.3, sổ tay 2.9 theo câu ở mục 2 bước 4 của chính runbook (S2).
- Trạng thái: Open

### FB-R5-BA-SEC-V574-04
- Mức độ: Minor – SEC (đề xuất mặc định), ORC (ghi giả định).
- Vị trí: runbook mục 2 bước 4 và mục 3 dòng Vừa ("hỏi luật sư mỗi ca, trước giờ thứ 48"). Bản 1.1: còn nguyên; mức Vừa nay gồm cả ca tin có tên khách mà link chưa mở, nên gặp nhiều hơn.
- Vấn đề: thiếu luồng ngoại lệ cho hai ca:
  - mức Vừa mà luật sư chưa trả lời tới giờ thứ 48. Mức Cao có mặc định ("chỉ không báo khi luật sư trả lời rõ là không cần"), mức Vừa thì không;
  - OWN chưa trả lời tới giờ thứ 48. Chỉ OWN gửi được bản báo, và đội không có số trực.
- Vì sao quan trọng: đây là hai ca dễ xảy ra nhất với một cơ sở 10 căn, một người quyết. Không có mặc định thì giờ thứ 72 trôi qua mà không ai quyết.
- Đề xuất sửa: SEC đề xuất một mặc định cho mức Vừa khi luật sư im lặng (ví dụ theo cách chặt nhất của chính runbook: chuẩn bị báo như mức Cao, OWN quyết gửi hay không). Với OWN: ORC nhắc lại trong chat ở giờ thứ 24 và 48, ghi decision-log "chưa có quyết định, lý do"; đội không gửi thay. ORC ghi mặc định đó là `[GIẢ ĐỊNH – chờ INV xác nhận]`, gắn với Q12.
- Trạng thái: Open

### FB-R5-BA-SEC-V574-05
- Mức độ: Minor – SEC.
- Vị trí: runbook dòng 3: "Người trực quầy đọc mục 4 bước 1–2". Bản 1.1: còn nguyên.
- Vấn đề: nhân viên không nhận tệp này. Họ cầm `02` (bản HTML hoặc in) và Tờ 1 dán quầy. Hai tài liệu đó đã có đúng việc của bước 1–2. Runbook còn có mục 5 về cách đội phát hiện máy chủ bị đổi tệp: không cần cho quầy.
- Vì sao quan trọng: người đọc runbook tưởng quầy có một tài liệu nữa phải học. Nếu chủ đầu tư in runbook phát cho quầy, cách phát hiện của đội ra ngoài nhóm cần biết.
- Đề xuất sửa: "Quầy làm theo hướng dẫn `02` mục 17.3 bước 5 và Tờ 1 (cùng nội dung mục 4 bước 1–2). Runbook không phát cho quầy."
- Trạng thái: Open

### FB-R5-BA-SEC-V574-06
- Mức độ: Suggestion – SEC; BA theo.
- Vị trí: runbook mục 6 dòng mẫu nhánh A; `02` 17.3 bước 5 gạch "Ghi sổ giao ca".
- Vấn đề (bản 1.0): hai tài liệu cùng trường nhưng khác cách viết. Quầy ghi theo 17.3, không có "SR-INC · nhánh A", "đã tạo link mới", "báo OWN …".
- Bản 1.1: SEC nhận DOM 03, dòng mẫu mục 6 dùng cho cả tin báo chủ đầu tư, và chép ô "tin kèm gì" sang 17.3. Ba ô còn lại (đã tạo link mới, ghi lạ, ảnh đã xóa) và dòng mẫu chưa có trong 17.3. Vậy cách thứ hai hợp: quầy cần dòng đó ngay trong 17.3.
- Đề xuất sửa: BA thêm ba ô và chép dòng mẫu mục 6 vào 17.3 bước 5 và sổ tay 2.9 bước 6 (S6). SEC không cần sửa gì; khi đổi mẫu mục 6 thì báo BA chép lại.
- Trạng thái: Open – phần BA làm ở S6 (commit Phản hồi & sửa); đóng khi SEC xác nhận dòng mẫu chép đúng.

### FB-R5-BA-SEC-V574-07
- Mức độ: Suggestion – SEC.
- Vị trí: runbook dòng 8; mục 5 bước 1 ("Mã 3 che mã 1"), bước 4. Bản 1.1: còn nguyên.
- Vấn đề: dòng 8 dồn bốn ý vào một đoạn (khi nào dùng, hai ca viết sẵn, ca khác, ca số thẻ hay ảnh qua chat). Mục 5 bước 4 không ghi ai làm, trong khi mọi bước khác có. "Mã 3 che mã 1" khó hiểu với chủ đầu tư.
- Đề xuất sửa: dòng 8 thành bốn gạch. Bước 4 thêm "SEC + OPS, khi OWN đồng ý trong chat". "Mã 3 che mã 1" thành "Mã 3 được báo thay cho mã 1, nên có thể có cả dòng `checksum mismatch`".
- Trạng thái: Open

### FB-R5-BA-SEC-V574-08
- Mức độ: Suggestion – ORC.
- Vị trí: runbook mục 2 "Đồng hồ 72 giờ" (tính từ giờ xảy ra), mục 3 (Vừa hỏi luật sư mỗi ca, Cao mặc định báo). Bản 1.1: còn nguyên.
- Vấn đề: đây là mặc định pháp lý tạm, dùng tới khi luật sư trả lời Q12. Runbook ghi rõ là cách tính chặt nhất. Nhưng decision-log chưa có dòng giả định cho nó.
- Đề xuất sửa: ORC ghi một dòng `[GIẢ ĐỊNH – chờ INV xác nhận]` (gắn ESC-001 Q12) và nêu trong round-summary, cùng mặc định của thẻ 04.
- Trạng thái: Open

## 3. Chỗ lệch ở tệp của BA – BA tự sửa

BA sửa ở commit Phản hồi & sửa ngay sau review này, cùng lượt đánh số bản. Không cần SEC làm gì.

| Mã | Tệp, mục | Sửa |
|---|---|---|
| S1 | Sổ vận hành 1.1a, gạch mã 3 | Thay "Nếu xác nhận dữ liệu khách bị lộ…" bằng câu theo runbook mục 5 bước 3: bản trên Mac đúng mà bản máy chủ khác thì coi như bị xâm nhập (mức Cao); 72 giờ tính từ giờ lượt kéo; anh/chị quyết chậm nhất giờ thứ 48 |
| S2 | Sổ vận hành 3.4, câu đầu; `02` 17.3 bước 5 gạch "Vì sao"; sổ tay 2.9 bước 6 | Sổ vận hành: gửi nhầm link check-in online không phải P0 (theo runbook bước 3, `01` 14.1). Cả ba chỗ: "chủ đầu tư quyết, đội bảo mật đề xuất, luật sư xác nhận" (thẻ 03, runbook mục 2 bước 4) |
| S3 | `01` 14.1 dòng gửi nhầm link | Báo đội theo dòng mẫu runbook mục 6 (để khi SEC thêm trường theo DOM 01, `01` không phải sửa lại), thêm đủ ba dấu hiệu ghi lạ; ai quyết báo cơ quan chức năng, đồng hồ từ giờ gửi nhầm; khi nào anh/chị báo khách (runbook mục 2 bước 5) |
| S4 | `01` 17 "ai gọi ai" | Thêm dòng "Dữ liệu khách có thể đã tới người ngoài" trỏ về runbook |
| S6 | `02` 17.3 bước 5; sổ tay 2.9 bước 6 | 17.3: thêm ba ô sổ giao ca (đã tạo link mới, ghi lạ, ảnh đã xóa) và dòng mẫu runbook mục 6 (thẻ 06). Sổ tay 2.9 bước 6: chép cùng ý 17.3 bước 5 (bản 1.1 của SEC và hai chỗ trên), số mục theo sổ tay (2.10, 2.11) |
| S7 | Sổ tay 5.5 "liên hệ ai" | Thêm dòng "Dữ liệu khách có thể đã tới người ngoài", cùng ý `01` 17 (S4) |
| S5 | Đánh số | Sổ vận hành: ghi bù dòng 1.7, phần SEC vào bản 1.8. `01`, `02`: phần SEC ghi "có trong bản 1.17". Bộ hướng dẫn 1.18. Sổ tay bản nội dung 1.20. Lý do lấy số mới thay vì "bổ sung cùng ngày": bộ 1.17 đã chuyển UXD dựng HTML, thêm vào 1.17 thì HTML và bản md cùng số mà khác chữ |

## 4. Điểm làm tốt

- Hai nhánh viết sẵn đúng hai ca có thật ở OTTIMO, và nhánh A chép đúng từng tên nút của 17.3. Quầy không phải học cách nói mới.
- Mức Thấp/Vừa/Cao gắn với dấu hiệu quan sát được (link đã mở chưa, một hay nhiều đơn, bản Mac khớp `.sha256` hay không). Chủ đầu tư xếp theo được mà không cần hiểu kỹ thuật.
- Mẫu dòng ghi và câu "không bao giờ ghi" giữ đúng ranh giới kho mã công khai: chỉ mã đơn, giờ, kênh, vai.

## 5. Giả định

- Kết luận cho bản 1.1 @ `3174ce65`. BA đọc bản 1.0 @ `2f732f58` trước (commit review đầu `b55971ac`); mọi thẻ được đọc lại trên bản 1.1, ghi "Bản 1.1: …" ở từng thẻ.
- Tờ 1 (PO `a38bfcdc`) rút gọn: BA giữ, vì plan R5 quyết định 21 không cho thêm chữ vào Tờ 1. Tờ 1 là tệp của PO.
- Câu đề xuất ở thẻ 01 dùng luật đã có ở 17.3 bước 3. Chưa có xác nhận của DOM, nên BA chưa chép vào 17.3.
- Câu tin gửi link không tên khách, không ngày, không phòng (DOM V574-01 phương án (b), SEC đề nghị): CPY viết, ORC gửi BA. BA không tự viết; 17.3 bước 3 và sổ tay 2.9 bước 3 chưa đổi.

## 6. Dòng decision log (ORC ghi)

| 2026-11-07 | 5 | **BA – review SEC V5-74 (runbook sự cố dữ liệu khách SR-INC-01) bản 1.1 @ 3174ce65: DUYỆT CÓ ĐIỀU KIỆN** (bản 1.0 @ 2f732f58 đọc trước, thẻ đọc lại trên 1.1). Nhánh A khớp 02 17.3 bước 5 (SEC sửa cùng commit) và Tờ 1 (PO a38bfcdc) ở mọi việc của quầy: thu hồi, tạo link mới, sổ giao ca chỉ ghi loại tin kèm gì, không chụp hội thoại, nhắn thẳng chủ đầu tư, ghi lạ thì gọi ngay, khách đơn khác nhận link đơn của họ, giấy tờ tại quầy; vai ở quầy khớp RBAC (A114, A22a, A70, A74, S30). Điều kiện: FB-R5-BA-SEC-V574-01 Major – nhánh A bước 1 "gửi đúng liên hệ trên đơn" gửi lại cho người nhận nhầm khi chính liên hệ trên đơn sai; thêm "không chắc thì không gửi link mới, mời làm thủ tục tại quầy" (DOM xác nhận, BA chép sang 17.3, sổ tay; PO Tờ 1). Minor, còn nguyên ở 1.1: 02 khoanh vùng tách theo người làm (A100, A110, A115 chỉ OWN); 03 một câu "OWN quyết, SEC đề xuất, luật sư xác nhận"; 04 mặc định khi luật sư hay OWN chưa trả lời tới giờ 48; 05 quầy dùng 02 17.3 và Tờ 1, runbook không phát cho quầy. Suggestion 06 (BA chép dòng mẫu mục 6 vào 17.3, sổ tay 2.9), 07 (cách viết), 08 (ORC ghi giả định pháp lý tạm theo Q12). BA tự sửa tệp của mình (sổ vận hành 1.1a, 3.4; 01 14.1, 17; 02 17.3; sổ tay 2.9 bước 6, 5.5) và đánh số: sổ vận hành 1.8 (ghi bù dòng 1.7), 01 và 02 bản 1.17, bộ hướng dẫn 1.18, sổ tay 1.20 – số mới vì bộ 1.17 đã giao UXD dựng HTML. Không ESC (Q12 đã ở ESC-001) | BA | rounds/round-05/reviews/BA-on-sec-v5-74.md |
