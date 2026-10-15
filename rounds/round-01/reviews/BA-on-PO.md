# Review BA → PO – Round 1, Bước 3

- Người review: BA | Ngày: 15/10/2026
- Phạm vi: `product/docs/PRD.md`, `03-backlog/backlog.md` (đợt 3), `02-escalations/ESC-004` … `ESC-012`, `product/docs/open-questions-resolution.md`
- Đối chiếu với: `business-processes.md`, `use-cases.md`, `state-machines.md` (SM-xx), `rbac-matrix.md` (A-xx, S-xx), `business-rules.md` (BR-xxx), plan R1 mục 7 (A3, A4, A6, B1–B3), QA report mục 4, ARC report mục 4 (M1–M11)
- Kiểm tự động đã chạy: 74/74 story Must R2 có ≥ 2 AC (A3 đạt); mọi mã vai, tên trạng thái trong AC khớp `rbac-matrix.md` mục 1 và `state-machines.md` mục 0.3 (B1 đạt ở phần PO).

---

### FB-R1-BA-PO-01
- Mức độ: Major
- Vị trí: `03-backlog/backlog.md` mục 4, US-018 AC1 (dòng ~357); liên quan US-017 AC1, US-139 (Must **R3**), PRD 5.2 M9
- Vấn đề: US-018 AC1 nói mọi đơn tạo vào căn – đêm đã có đơn đều "bị chặn". Trong R2 đơn OTA được **lễ tân nhập tay** (US-017 AC1, PRD M9 R2). Đơn OTA đã tồn tại thật ở kênh; nếu chặn thì app mất dấu một cam kết với khách. `state-machines.md` mục 1.3 và BR-312 quy định ngược lại: đơn OTA trùng vẫn tạo `confirmed` và gắn cờ xung đột. OpenAPI/ERD 7 (ARC) cũng đã cài theo hướng này từ R2, có tự gán căn khác hoặc `conflictState=open`. Story xử lý xung đột (US-139) lại xếp R3. QA đang phải test theo hai hướng (TC-L2-024, QA report mục 4 #2 – P1).
- Vì sao quan trọng: Với đơn OTA, chặn là sai nghiệp vụ. Khách vẫn đến với xác nhận của Booking/Agoda, còn Desk không có đơn nên không kích hoạt được quy trình dời khách (BR-312). Trong R2, khả năng trùng còn **cao hơn** R3 vì đồng bộ chỉ là giả lập và lễ tân nhập tay chậm.
- Đề xuất sửa: (1) Viết lại US-018 AC1: chỉ áp cho kênh Trực tiếp/CTV/HĐ. Thêm AC cho kênh OTA: "Given căn – đêm đã kín, When nhập đơn kênh OTA, Then đơn `confirmed` có cờ xung đột (không gán căn), cảnh báo đỏ FD + MGR, không chiếm `room_occupancy`" (khớp SM-01 1.3). (2) Tách US-139: phần "nhận đơn trùng + gắn cờ + báo đỏ + gán căn bằng B7/B14" đưa lên Must R2; phần "đơn về tự động từ channel manager" giữ R3. (3) Hỏi ARC về hành vi tự gán căn khác. BA đề xuất **không** tự đổi căn im lặng: hệ thống chỉ gợi ý, lễ tân xác nhận, để giữ khớp với US-024 (lý do bắt buộc).
- Trạng thái: Open

### FB-R1-BA-PO-02
- Mức độ: Major
- Vị trí: `PRD.md` mục 5.2 dòng M0 (cột MVP – R3: "xác nhận phê duyệt bằng PIN"); backlog US-007 AC2, AC4 (Must R2); US-008 (Should R3)
- Vấn đề: US-007 AC2/AC4 (Must R2) bắt buộc người duyệt "xác nhận bằng PIN của chính mình", PIN sai thì không duyệt được (QA đã viết TC-NT-030 với `401 REAUTH_FAILED`). PRD lại xếp "xác nhận phê duyệt bằng PIN" vào **R3**. Không story nào cho người dùng đặt/đổi PIN. Ngoài ra US-008 (thêm, khóa tài khoản, đặt lại mật khẩu) là Should R3, trong khi R2 đã cần tài khoản thật cho 8 vai (US-001, US-002).
- Vì sao quan trọng: Duyệt FOC bằng tài khoản của chính người duyệt là cách sửa BL 8.2 #24 (mức Cao). Nếu R2 không có PIN hoặc cách xác thực lại tương đương, AC2/AC4 không làm được. Khi đó dev sẽ tự chọn cách làm và vai trò của rbac 5.2 quy tắc 1 bị mất.
- Đề xuất sửa: Chọn một trong hai và ghi thống nhất ở cả PRD lẫn backlog: (a) đưa "đặt/đổi PIN duyệt" lên Must R2, thêm story con hoặc AC vào US-001 (rbac S01 đã có "PIN duyệt"); hoặc (b) ở R2 cho xác thực lại bằng **mật khẩu đăng nhập** (BR-432 cho phép "mật khẩu/PIN"), sửa US-007 AC2/AC4 thành "PIN hoặc mật khẩu" và để PIN sang R3. Với tài khoản ở R2, ghi rõ nguồn: seed/CLI do OPS tạo, hoặc nâng phần "tạo tài khoản" của US-008 lên R2.
- Trạng thái: Open

### FB-R1-BA-PO-03
- Mức độ: Major
- Vị trí: backlog US-023 AC2 (Must R2, dòng ~386); US-074 (Should R3); PRD 5.2 M7 (gộp hồ sơ ở R3)
- Vấn đề: US-023 AC2 yêu cầu "hồ sơ khách bị gộp → mã cũ vẫn tra được" (BR-953). Chức năng gộp (US-074, rbac A107) lại xếp R3, ERD để R3, OpenAPI R2 chưa có endpoint. QA ghi TC-NT-023 là "chưa chạy được ở R2" nhưng vẫn tính vào 244/244 AC đã phủ (QA report mục 4 #6).
- Vì sao quan trọng: Story Must R2 có một AC không làm và không test được trong R2. QC sẽ chấm A3 và C1 sai. Dev R2 cũng không biết có phải thiết kế bảng chuyển hướng mã hay không.
- Đề xuất sửa: Chuyển AC2 sang US-074 (R3). Thay bằng một AC kiểm được ở R2 cho US-023, ví dụ "mã khách `KH-` do server cấp, không đổi khi sửa hồ sơ". Nếu PO muốn giữ, phải nâng US-074 lên R2 và báo ARC thêm endpoint.
- Trạng thái: Open

### FB-R1-BA-PO-04
- Mức độ: Major
- Vị trí: backlog US-086 (Must R2 – sinh HĐ + lịch kỳ thu), US-012 AC2 (Must R2 – nhắc kỳ thu, chào gia hạn), US-088 (Must **R3** – ghi nhận đã thu từng kỳ), US-041 (R3), US-064/065 (R3); PRD 5.2 M8
- Vấn đề: Ranh giới R2/R3 của khách dài hạn bị cắt ngang **giữa một vòng đời**. R2 tạo HĐ `signed` và kỳ thu `scheduled` (SM-06, SM-07), "Cần chú ý" nhắc kỳ thu từ 7 ngày trước. Nhưng hành động ghi nhận đã thu kỳ (rbac A58, UC-08, SM-07 T2) chỉ có ở R3. Hệ quả trong R2: nhắc kỳ thu không bao giờ tắt được; kỳ thu sẽ tự chuyển `overdue` → `escalated` (BR-207) dù khách đã trả. Trả phòng dài hạn (US-041) và điện nước (US-064/065) cũng ở R3, nên một HĐ tạo ở R2 không đi tới cuối được.
- Vì sao quan trọng: QA test US-012 AC2 sẽ ra cảnh báo đỏ giả. Nếu INV dùng thử R2 với Daniel/Emma (dữ liệu DS-0 có 2 HĐ đang chạy), số "quá hạn" sẽ sai ngay. Đây là sai tiền về mặt hiển thị.
- Đề xuất sửa: Chọn một hướng và ghi vào PRD D6: (a) nâng phần "ghi nhận thu kỳ" của US-088 (A58, `recordPayment` gắn kỳ) lên Must R2, giữ danh sách/nhắc ở R3; hoặc (b) giữ R3 và bỏ vế kỳ thu khỏi US-012 AC2 ở R2, đồng thời ghi rõ "job J12/J13 tắt ở R2". BA đề xuất (a) vì công sức nhỏ: dùng lại giao dịch SM-12.
- Trạng thái: Open

### FB-R1-BA-PO-05
- Mức độ: Major
- Vị trí: backlog US-106 AC2 ("link hết hiệu lực khi đơn `checked_out`"); US-133 AC3; US-138 (R3); BR-427; ADR-006 (ân hạn 24 giờ); ARC report M4; rbac 8.6
- Vấn đề: Bốn tài liệu cho bốn thời điểm hết hạn khác nhau. US-106 AC2 và rbac 8.6 cho hết hạn **ngay** khi `checked_out`. BR-427 cần khách nhận link thanh toán phát sinh **trong 24 giờ** sau trả phòng nhanh. ADR-006 thêm `guest_link_grace_hours` = 24. QA đã chọn theo ADR (TC-L7-002 có "+ ân hạn nếu có"), tức là lệch AC của PO.
- Vì sao quan trọng: Nếu theo AC, khách trả phòng sớm (US-138, BR-427) sẽ không xem được bill và không trả được tiền minibar kiểm sau, nên mất tiền. Nếu theo ADR mà không giới hạn phạm vi, khách đã đi vẫn thấy mã cửa/Wi-Fi trong 24 giờ (rủi ro C3, D22).
- Đề xuất sửa: PO chốt giá trị mặc định và sửa US-106 AC2 thành: "Sau `checked_out`, link còn hiệu lực trong `guest_link_grace_hours` (BR mới, nhờ DOM thêm vào mục 13), **chỉ** xem bill và thanh toán phát sinh; mã cửa, Wi-Fi, gửi yêu cầu bị khóa ngay." BA sẽ cập nhật rbac 8.6 theo kết luận này. US-133 AC3 sửa thành "sau khi hết ân hạn".
- Trạng thái: Open

### FB-R1-BA-PO-06
- Mức độ: Minor
- Vị trí: `PRD.md` mục 6.2, dòng "CTV/Sale: … → giữ chỗ → **xác nhận cọc** → …"
- Vấn đề: Câu này trái rbac A04 (CTV ✖, chỉ "Báo đã chuyển cọc" A53) và trái US-086 AC4, US-020 AC1 của chính PO (QA report #11).
- Vì sao quan trọng: PRD là tài liệu INV đọc. Nếu ghi CTV xác nhận cọc, INV sẽ hiểu CTV được ghi nhận tiền, đi ngược nguyên tắc tách nhiệm vụ ở rbac 5.3.
- Đề xuất sửa: Sửa thành "… → giữ chỗ → báo đã chuyển cọc (CTV) / xác nhận cọc (sale nội bộ, lễ tân) → …".
- Trạng thái: Open

### FB-R1-BA-PO-07
- Mức độ: Minor
- Vị trí: `PRD.md` mục 4, dòng U1 (cột "Không được thấy": "– (toàn quyền…)"); mục 9 A4
- Vấn đề: PRD ghi nhóm U1 (`owner`, `manager`) có toàn quyền. rbac 5.3 và chính AC của PO lại giới hạn `manager`: không gán vai (US-002 AC4), không sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh (US-005 AC2), không mở khóa tài khoản. PRD A4 vẫn ghi "BA chốt trong RBAC" như chưa xong.
- Vì sao quan trọng: Hai mức quyền khác nhau trong cùng một nhóm U1 cần được INV thấy rõ, vì anh Hoàng Anh là người thật.
- Đề xuất sửa: Tách U1 thành 2 dòng `owner` và `manager`. Cột "Không được làm" của `manager` dẫn rbac 5.3. Cập nhật A4 thành "đã chốt ở rbac mục 5.3, chờ INV xác nhận".
- Trạng thái: Open

### FB-R1-BA-PO-08
- Mức độ: Minor
- Vị trí: backlog US-020 AC2 ("… trừ 'Khôi phục no-show' cho `manager`/`owner`"); US-136 AC4; rbac A10 (FD/FDL = D)
- Vấn đề: US-020 AC2 chỉ cho MGR+ thấy nút khôi phục no-show. Theo A10 và US-136 AC4, `front_desk`/`front_desk_lead` vẫn có nút "Gửi yêu cầu khôi phục" (SM-10). Hai AC cùng của PO đang lệch nhau. QA đã tự test theo A10 (TC-L2-041).
- Vì sao quan trọng: Người trực đêm (vai FD) là người gặp khách đến muộn sau 23:00 (BR-311). Nếu theo US-020 AC2 thì họ không có nút nào để xử lý.
- Đề xuất sửa: US-020 AC2 thêm vế: "`front_desk`/`front_desk_lead` thấy 'Gửi yêu cầu khôi phục' (A10 = D)".
- Trạng thái: Open

### FB-R1-BA-PO-09
- Mức độ: Minor
- Vị trí: backlog US-071 AC2 (SĐT "dưới 9 chữ số"), US-039 AC1 (MST 10/13 số), US-016 AC1 ("2 ngày trước tới 11 ngày sau"), US-073 AC1 ("tối đa 5 kết quả, từ 2 ký tự"), US-082 AC1 ("tối đa 6 căn"), US-054 AC1 ("trong vòng 1 phút"), US-085 AC1 ("trong vòng 5 phút"); câu story US-010 ("trong 5 giây"), US-056 ("1/2/3 lần mỗi tuần")
- Vấn đề: Backlog mục 4 quy ước "không chép con số quy tắc". Các con số trên lại không phải dữ liệu thử, cũng không có mã BR hay tham số ở BR mục 13. Riêng "1/2/3 lần mỗi tuần" trái BR-204 (0–3 lần/tuần).
- Vì sao quan trọng: Tiêu chí B3 yêu cầu một nguồn sự thật. Khi các số này đổi (ví dụ khung rack), không ai biết sửa ở đâu. QA cũng phải ghi chúng cứng vào TC.
- Đề xuất sửa: Phân hai loại. (a) Ràng buộc nhập liệu, ví dụ độ dài SĐT, MST: chuyển sang đặc tả trường của BA (BA nhận ghi vào spec R2) và AC chỉ dẫn "theo spec trường". (b) Mục tiêu vận hành, ví dụ 1 phút hay 5 phút: ghi rõ là ngân sách hiệu năng, dẫn `architecture.md` mục 16. Câu story US-056 sửa thành "theo gói BR-204/BR-807".
- Trạng thái: Open

### FB-R1-BA-PO-10
- Mức độ: Minor
- Vị trí: backlog US-012 AC1–AC6; BR-907 (danh sách nguồn "Cần chú ý"); test case TC-X-010 (`channel_sync_error`)
- Vấn đề: BR-907 liệt kê 11 nguồn "Cần chú ý", nhưng AC của US-012 chỉ phủ 7. Thiếu: khách VIP/khách quen đến hôm nay, đồng bộ kênh lỗi (BR-905, có ở R2 dù Mock), công tơ chưa chốt (R3). QA đã viết TC cho `channel_sync_error` mà không có AC nào làm căn cứ.
- Vì sao quan trọng: Đồng bộ lỗi là tín hiệu sớm nhất của đặt trùng (nguyên tắc 2 của PRD). Không có AC thì không ai bảo đảm nó hiện ra.
- Đề xuất sửa: Thêm AC7 cho "đồng bộ kênh lỗi" và "khách quen/VIP đến hôm nay" (R2). Ghi rõ "công tơ chưa chốt" thuộc R3 (US-064).
- Trạng thái: Open

### FB-R1-BA-PO-11
- Mức độ: Minor
- Vị trí: `ESC-007` phương án A và mục "Nếu chưa quyết thì"; `ESC-006` phương án A, vế "Trả phòng sớm"
- Vấn đề: (1) ESC-007 A đưa cho INV chọn "lễ tân chỉ miễn minibar ≤ 100.000 đ/lần". Đội lại chưa thống nhất câu này là lễ tân **tự áp** hay **gửi duyệt**: BR-432 nói không tự duyệt, BR-433/BR-704 lại cho lễ tân FOC; BA đã hỏi DOM ở SQ-3 (`state-machines.md` mục 16) mà chưa có trả lời. (2) Đội đề xuất A (ân hạn 12:30) nhưng mục "nếu chưa quyết" lại chạy "không ân hạn", và không nói vì sao. (3) ESC-006 A ghi "báo trước ≥ 24 giờ" nhưng không nói tính từ mốc nào (12:00 ngày đi mới hay thời điểm báo).
- Vì sao quan trọng: INV chọn A mà đội chưa hiểu A giống nhau thì quyết định không áp được, phải hỏi lại. Cả ba điểm đều chạm tiền.
- Đề xuất sửa: Chờ DOM chốt SQ-3 rồi ghi rõ "tự áp" hoặc "cần lễ tân trưởng duyệt" trong ESC-007 A. Thêm một câu giải thích mặc định "không ân hạn" (giữ đúng hành vi prototype cho tới khi INV chọn). ESC-006 A ghi mốc tính "≥ 24 giờ trước 12:00 của ngày khách rời đi mới" (hoặc mốc DOM chốt, xem FB-R1-BA-DOM-07).
- Trạng thái: Open

### FB-R1-BA-PO-12
- Mức độ: Minor
- Vị trí: `open-questions-resolution.md` đoạn mở đầu ("Tổng ESC = 12 (giới hạn ≤ 12)"); plan R1 mục 8 ("Mục tiêu ≤ 9 ESC")
- Vấn đề: Plan đặt mục tiêu ≤ 9 ESC, còn tài liệu ghi "giới hạn ≤ 12" như thể đó là mức plan cho phép. Thực tế là 12 ESC (gồm 001–003 có từ trước).
- Vì sao quan trọng: QC chấm A6 dựa trên plan. Vượt mục tiêu là chấp nhận được nếu có lý do, nhưng không được ghi sai giới hạn.
- Đề xuất sửa: Sửa thành "Mục tiêu plan ≤ 9 ESC mới; thực tế 9 ESC mới (004–012) + 3 ESC có từ trước", hoặc nêu lý do vượt.
- Trạng thái: Open

### FB-R1-BA-PO-13
- Mức độ: Minor
- Vị trí: `PRD.md` mục 3.1 G5 ("**100%** khách được khai báo đúng hạn") và mục 3.2 S2 ("≥ 98%")
- Vấn đề: Cùng một chỉ số tuân thủ khai báo, PRD ghi hai đích khác nhau.
- Vì sao quan trọng: Đây là nghĩa vụ pháp lý. INV và QC cần một đích duy nhất để nghiệm thu, còn DATA cần một ngưỡng để cài cảnh báo.
- Đề xuất sửa: Giữ G5 = 100% là mục tiêu kinh doanh. Ghi S2 là "đích đo của sản phẩm, phần thiếu do khách đến ngoài giờ không check-in online", hoặc nâng S2 lên 100% có điều kiện như ghi chú hiện có.
- Trạng thái: Open

### FB-R1-BA-PO-14
- Mức độ: Suggestion
- Vị trí: `ESC-004`, `ESC-005`, `ESC-006` (cấu trúc "chọn một bộ A/B/C")
- Vấn đề: Mỗi ESC gói 4–8 chính sách độc lập vào một bộ. Ví dụ ESC-006 A gộp cả hủy ngắn ngày, no-show, chấm dứt HĐ, hoàn ký quỹ và giữ chỗ. INV có thể muốn A cho ngắn ngày nhưng B cho dài hạn.
- Vì sao quan trọng: Nếu trả lời "A trừ phần X" bằng chữ tự do thì dễ hiểu sai. Mỗi chính sách lại ánh xạ vào một tham số riêng ở BR mục 13.
- Đề xuất sửa: Thêm cuối mỗi ESC một bảng "chọn từng dòng": chính sách | A | B | C | mã BR/tham số. INV đánh dấu từng dòng, mặc định đã chọn sẵn theo đề xuất của đội.
- Trạng thái: Open

### FB-R1-BA-PO-15
- Mức độ: Suggestion
- Vị trí: backlog mục 3, cột "Nguồn"
- Vấn đề: Backlog dẫn 22/30 use case. Không story nào dẫn UC-08 (thu kỳ), UC-09 (gia hạn/chấm dứt HĐ), UC-20 (trả phòng dài hạn), UC-21 (công tơ), UC-22 (dọn phòng), UC-23 (kiểm phòng), UC-25 (bảo trì định kỳ), UC-26 (hoa hồng).
- Vì sao quan trọng: Checklist của BA đòi truy vết story → đặc tả → test. Hai UC-22/23 thuộc story Must R2 (US-053, US-055) nhưng hiện không dẫn được sang đặc tả.
- Đề xuất sửa: Thêm mã UC vào cột Nguồn: US-053 → UC-22; US-055 → UC-23; US-088 → UC-08; US-093 → UC-09; US-041 → UC-20; US-064 → UC-21; US-063 → UC-25; US-089 → UC-26.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)
1. **AC đợt 3 rất sát đặc tả.** AC dùng đúng mã chuyển SM (B1…B18, K1…K11, R1…R11) và mã hành động A-xx. Mọi AC "bị từ chối" đều quy ước là server từ chối kèm nhật ký. Cách viết "khớp ví dụ BR-xxx" giúp QA dựng được bộ oracle mà không phải chép số. Kiểm tự động: 74/74 story Must R2 có ≥ 2 AC.
2. **Story mới lấp đúng chỗ hổng của quy trình BA.** Đó là US-135 (xác nhận hành động không đảo ngược), US-136 (no-show không tự động + khôi phục), US-137 (trả sớm), US-024 nâng Must R2 kèm lý do rõ (đổi phòng khi có sự cố theo BR-809). Bảng truy vết UC → story ở mục 5.2 rất dễ kiểm.
3. **`open-questions-resolution.md` truy vết đủ 26/26 câu BL 9.** Mỗi câu có kết cục, mặc định đang dùng và mã BR. Các câu đội tự chốt vẫn được nêu lại trong ESC-012 để INV biết. ESC viết bằng ngôn ngữ kinh doanh, có ưu/nhược, chi phí và "nếu chưa quyết thì".
