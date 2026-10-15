# Review DOM → PO – Round 1, Bước 3

- Người review: DOM | Ngày: 15/10/2026
- Phạm vi: `product/docs/PRD.md`, `03-backlog/backlog.md` (đợt 3), `02-escalations/ESC-004…008, 010, 011`, `product/docs/open-questions-resolution.md`
- Góc nhìn: AC có khớp BR không, có mâu thuẫn nghiệp vụ không, phương án ESC có đúng thực tế vận hành boutique stay ở Đà Lạt không.
- Cuối file có thêm 2 phần theo yêu cầu của ORC: **A. Xác nhận các câu hỏi đội đã nhờ DOM** và **B. Tự nhận lỗi để sửa ở bước 4** (lỗi trong `business-rules.md` của chính DOM – chưa sửa ở bước này).

---

### FB-R1-DOM-PO-01
- Mức độ: Major
- Vị trí: `backlog.md` US-007 AC1, AC4; `ESC-007` phương án A; `rbac-matrix.md` A35 ghi chú 24
- Vấn đề: US-007 AC4 ghi "người duyệt là người gửi và không phải `manager`/`owner` → bị từ chối", và AC1 buộc mọi FOC của `front_desk` vào `pending`. Nhưng BR-433/BR-704 cho lễ tân FOC minibar ≤ hạn mức, và BA (SM-10 A2) đã đặt trường hợp "FD tự áp FOC minibar trong hạn mức". Theo AC hiện tại, lễ tân không bao giờ tự áp được, nên phần hạn mức lễ tân trong ESC-007 không có tác dụng. ESC-007 A cũng chỉ viết "lễ tân chỉ miễn minibar ≤ 100.000 đ/lần" mà không nói rõ là **không cần người thứ hai duyệt**, nên INV không biết mình đang chọn gì.
- Vì sao quan trọng: Lúc 11:30 khách tranh cãi 1 lon bia 35.000 đ, nếu phải chờ lễ tân trưởng/quản lý duyệt bằng PIN thì khách đứng chờ ở quầy. Thực tế khách sạn nào cũng có một "hạn mức xử lý tại chỗ" (guest recovery allowance) cho nhân viên tuyến đầu, đi kèm hạn mức tháng và báo cáo. Nếu AC và ESC lệch nhau, QA sẽ test sai và INV chốt chính sách mà không biết.
- Đề xuất sửa: (1) Thêm US-007 AC6: "Given `front_desk` gửi FOC loại minibar có giá trị ≤ hạn mức tự áp lần **và** còn trong hạn mức tháng của chính người đó (BR-433), When xác nhận bằng PIN của chính mình, Then `approved` ngay (SM-10 A2), dòng FOC ghi 'tự áp trong hạn mức', được cộng vào hạn mức tháng và cảnh báo BR-435". (2) Sửa AC4 thành "… trừ `manager`/`owner` và trường hợp tự áp trong hạn mức của vai (AC6)". (3) Viết lại ESC-007 A cho rõ: "lễ tân **tự miễn** minibar ≤ 100.000 đ/lần, tối đa [hạn mức tháng – DOM sẽ thêm vào BR-433] /người/tháng, không cần người thứ hai duyệt, có báo cáo cuối ngày cho lễ tân trưởng".
- Trạng thái: Open

### FB-R1-DOM-PO-02
- Mức độ: Major
- Vị trí: `PRD.md` M2, M8; `backlog.md` EP02, EP11 (không có story)
- Vấn đề: Không story nào cho **đặt nhiều căn cho một khách/đoàn** (gia đình 2–3 căn, nhóm bạn, công ty đi offsite). US-017, US-084 chỉ tạo đơn một căn. Không có cọc chung, hạn danh sách khách của đoàn, hủy một phần (bớt 1 căn), bill gộp hay tách, một người thanh toán cho cả đoàn.
- Vì sao quan trọng: Ở Đà Lạt, nhóm 6–12 khách thuê cả tầng vào cuối tuần, lễ, Tết là rất phổ biến. Với 10 căn, một đoàn 3 căn đã là 30% công suất đêm đó. Nếu tạo 3 đơn rời: cọc 1 lần chuyển khoản không gắn được vào 3 đơn, hủy đoàn phải hủy 3 lần, bill trả phòng phải cộng tay, và hoa hồng CTV bị tách thành 3 dòng. Đúng loại việc gây sai tiền lúc đông khách. (Phần quy tắc đoàn còn thiếu trong BR là lỗi của DOM – xem B.16.)
- Đề xuất sửa: Thêm story "Đơn nhóm" (đề xuất **Should R2, Must R3**): một mã nhóm liên kết nhiều đơn căn; một người đặt/người trả; cọc chung phân bổ theo căn; hủy từng căn hoặc cả nhóm theo BR-309; bill gộp (mặc định) hoặc tách theo căn; danh sách khách từng căn trước hạn khai báo. AC tham chiếu nhóm BR mới về đoàn mà DOM bổ sung ở bước 4.
- Trạng thái: Open

### FB-R1-DOM-PO-03
- Mức độ: Major
- Vị trí: `backlog.md` US-026 AC3; liên quan US-024 AC1 (đơn OTA không đổi ngày), `state-machines.md` B7, B9
- Vấn đề: US-026 AC3 viết: nhận phòng trước mốc 06:00 thì "hệ thống yêu cầu đổi ngày đến sang hôm trước (BR-003)". Chỗ này sai ở 3 điểm. (a) Với đơn OTA, US-024 AC1 cấm đổi ngày, nên AC3 không làm được với chính nhóm khách hay đến sớm nhất là khách OTA đi xe đêm hoặc chuyến bay đêm. (b) Không có bước kiểm căn còn trống đêm hôm trước. Nếu đêm đó căn đã có khách trả hôm nay thì không thể "nhận lúc 05:00". (c) Không nói giá của đêm thêm lấy từ đâu.
- Vì sao quan trọng: Xe giường nằm từ TP.HCM thường đến Đà Lạt khoảng 04:00–05:30 nên tình huống này xảy ra hằng tuần. Lễ tân trực đêm sẽ bị kẹt (OTA không sửa được) hoặc thu sai tiền. Cách làm này cũng phải khớp đề xuất của DATA rằng trước 06:00 tính là đêm bán.
- Đề xuất sửa: AC3 mới: "Given giờ nhận trước mốc tính tròn 1 đêm (BR-411), Then hệ thống kiểm căn còn trống đêm hôm trước (BR-906); còn trống → đơn Trực tiếp/CTV được **thêm 1 đêm** vào đầu đơn, giá theo BR-411; đơn OTA → tạo **đơn con kênh Trực tiếp** cho đêm đó, liên kết đơn gốc, giá theo BR-421/BR-422; đêm này là đêm bán (BR-904). Căn không trống → không cho nhận sớm, gợi ý gửi hành lý/căn khác." DOM sẽ viết lại BR-411 cho khớp (B.6).
- Trạng thái: Open

### FB-R1-DOM-PO-04
- Mức độ: Major
- Vị trí: `backlog.md` US-010 AC1 ("đêm nay"), US-011 (BR-404 "hôm nay"), US-136 AC4 ("cùng ngày nghiệp vụ"), US-031; PRD N5
- Vấn đề: Backlog dùng "hôm nay", "đêm nay", "ngày nghiệp vụ" nhưng không định nghĩa ngày nghiệp vụ đổi lúc nào. Nếu hiểu là 00:00 lịch: khách có ngày đến 20/10 tới quầy lúc 01:30 sáng 21/10 sẽ **biến khỏi** "Khách đến hôm nay" (ngày đến 20 ≠ hôm nay 21). B9 cũng chặn nhận phòng (điều kiện "hôm nay = ngày đến"). KPI "đêm nay" lúc 02:00 sẽ tính đêm 21 thay vì đêm 20 đang diễn ra.
- Vì sao quan trọng: Lúc 2 giờ sáng là lúc người trực đêm cần app nhất và có ít người để hỏi nhất. Khách sạn thật dùng "ngày kinh doanh" (business date) chỉ chuyển sau khi chốt ngày, không chuyển lúc nửa đêm. BR-003 của DOM đã ngầm dùng mốc 06:00, nhưng chưa ghi thành quy tắc chung (lỗi của DOM – B.11).
- Đề xuất sửa: Thêm vào quy ước AC (mục 4): "'Hôm nay/đêm nay' = **ngày nghiệp vụ**, đổi lúc 06:00 giờ VN (BR-001, sẽ bổ sung)". Thêm ca test cho US-011 và US-025: "Given đơn đến 20/10, When 01:30 ngày 21/10 mở 'Khách đến', Then đơn vẫn hiện và nhận phòng được." US-136 AC4 tham chiếu cùng định nghĩa.
- Trạng thái: Open

### FB-R1-DOM-PO-05
- Mức độ: Major
- Vị trí: `backlog.md` US-017, US-080, US-022 (AC); `ESC-004` mục (5)
- Vấn đề: ESC-004 đề xuất phụ thu thêm người (BR-110) và đây là câu hỏi mở số 5. Nhưng ngoài kiểm sức chứa (US-004 AC3) và bậc tuổi (US-022 AC2), **không AC nào kiểm tiền phụ thu người**: tạo đơn 3 người lớn, báo giá 2 người lớn + 1 trẻ 8 tuổi, thêm người giữa chừng (US-022) đều không sinh dòng phụ thu.
- Vì sao quan trọng: Đây là khoản doanh thu INV được hỏi để chốt. Có quy tắc mà không có AC thì R2 sẽ không code, và đến khi vận hành sẽ thu thiếu tiền (đúng lỗi "sai tiền" mà PRD nguyên tắc 1 muốn tránh).
- Đề xuất sửa: Thêm US-080 AC5 và US-017 AC7: "Given căn 302, 3 người lớn, 3 đêm, Then phụ thu người khớp ví dụ BR-110". Thêm US-022 AC4: "Given thêm 1 người lớn giữa kỳ ở, Then sinh dòng phụ thu từ đêm thêm người theo BR-110 (lễ tân xác nhận trước khi ghi – như BR-414)". Đơn OTA: ghi chú phụ thu người theo giá OTA (OTA đã tính theo số khách), không cộng thêm.
- Trạng thái: Open

### FB-R1-DOM-PO-06
- Mức độ: Major
- Vị trí: `backlog.md` US-124 (Should R3); US-119; `PRD.md` X3; `integrations.md` I2b (tự xác nhận tiền về chỉ có ở R3)
- Vấn đề: PRD gộp "bàn giao ca" vào X3 (ca, chấm công – ngoài MVP) và US-124 chỉ là Should R3. Trong khi đó R2–R3 lễ tân **tự bấm** "đã nhận chuyển khoản" (US-119, SM-12 `[*] → succeeded`) và thu tiền mặt, mà không có bước đối soát cuối ca/cuối ngày.
- Vì sao quan trọng: Bàn giao ca (tiền mặt trong két, các khoản chuyển khoản lễ tân đã xác nhận, khách chưa đến, khai báo còn thiếu) là **kiểm soát tiền**, không phải chấm công. Đây là nơi thất thoát nhỏ hay xảy ra nhất ở khách sạn nhỏ. Thiếu nó, chỉ số S10 "0 lỗi tiền" không đo được và INV không có căn cứ đối chiếu sao kê.
- Đề xuất sửa: Tách khỏi X3: "chấm công" vẫn ngoài MVP, còn "đóng ca/bàn giao ca" là story riêng **Must R3** (trước bản RC). Nội dung: tổng thu theo cách thanh toán của ca, tiền mặt đếm thực tế so với hệ thống (chênh phải có lý do), danh sách chuyển khoản ghi tay "chờ đối soát" để MGR tick sau khi xem sao kê, việc tồn (khai báo, khách chưa đến). US-124 nâng thành Must R3 và mở rộng AC như trên. DOM sẽ thêm BR cho phần này (B.16).
- Trạng thái: Open

### FB-R1-DOM-PO-07
- Mức độ: Major
- Vị trí: `backlog.md` US-061 AC1, US-019 AC1; QA report #1
- Vấn đề: US-061 AC1 viết "ngày dự kiến xong 17/10 → khối OOO 15–17/10", nhưng không nói đêm 17/10 có bị khóa không. BR-002 dùng khoảng nửa mở [đến, đi) còn ví dụ BR-804 đếm 3 đêm (15, 16, 17). Hai người đọc sẽ code khác nhau: hoặc khóa thiếu 1 đêm (bán phòng hỏng đêm 17), hoặc khóa thừa.
- Vì sao quan trọng: Lệch 1 đêm ở khối OOO nghĩa là có thể bán nhầm phòng chưa sửa xong (khách đến gặp phòng hỏng) hoặc mất 1 đêm bán. QA đã xếp mức P1.
- Đề xuất sửa: Theo quyết định của DOM (mục A, câu QA #1): AC1 ghi "khóa đêm 15, 16, 17 – mở bán lại từ 18/10; lưu [15/10, 18/10)". Form hỏi "ngày dự kiến xong", còn hệ thống tự đặt "mở bán từ" = ngày xong + 1 và hiển thị rõ cả hai ngày cho người tạo.
- Trạng thái: Open

### FB-R1-DOM-PO-08
- Mức độ: Major
- Vị trí: `02-escalations/ESC-011` phương án A ("1503**47**"); decision-log SEC (mã sinh nhật cần ≥ 3 số ngẫu nhiên hoặc khóa có giới hạn thử sai)
- Vấn đề: ESC-011 đề xuất cho INV dạng "ngày-tháng + **2** số ngẫu nhiên". Dạng này trái với dòng decision-log SEC đã chốt ("biến thể sinh nhật cần ≥ 3 số ngẫu nhiên hoặc khóa có giới hạn thử sai"). Ngày sinh lộ trên giấy tờ, nên chỉ còn 100 tổ hợp để thử.
- Vì sao quan trọng: INV có thể chọn A vì tin đó là phương án an toàn đội đã kiểm. Đây là an ninh của khách (mất đồ trong phòng). BR-403 của DOM cũng ghi 2 số (lỗi của DOM – B.10).
- Đề xuất sửa: Sửa ESC-011 A thành "ddmm + 3 số ngẫu nhiên (7 số, ví dụ 1503**472**)" hoặc "+ 2 số nếu khóa tự khóa sau 5 lần nhập sai – INT xác nhận khi biết hãng". Ghi một câu cho INV: "Mã đúng ngày sinh (phương án B) không được SEC chấp nhận".
- Trạng thái: Open

### FB-R1-DOM-PO-09
- Mức độ: Major
- Vị trí: `02-escalations/ESC-008` (VAT, hóa đơn); BR-523, BR-524
- Vấn đề: ESC-008 hỏi thuế suất 8%/10% nhưng thiếu câu hỏi gốc: **OTTIMO đang kinh doanh dưới hình thức doanh nghiệp hay hộ kinh doanh?** Câu trả lời quyết định loại hóa đơn (hóa đơn GTGT hay hóa đơn bán hàng), cách tính thuế, và cấu hình MISA. Ngoài ra, theo hiểu biết của DOM (**cần kế toán xác nhận**), mức 8% là chính sách giảm thuế có thời hạn, có thể hết hiệu lực sau 31/12/2026. Thuế suất vì vậy phải là tham số có ngày hiệu lực, không phải một con số cố định.
- Vì sao quan trọng: MISA ở R3 sẽ phát hành sai loại hóa đơn nếu đội giả định nhầm. Hóa đơn sai phải hủy và điều chỉnh, gây rủi ro thuế. Nếu thuế suất đổi đúng mùa Tết 2027 mà app không có ngày hiệu lực thì bill tách VAT sai.
- Đề xuất sửa: Thêm vào phần "Thông tin cần chủ đầu tư/kế toán cung cấp" của ESC-008: (1) loại hình kinh doanh + mã số thuế; (2) thuế suất áp dụng **và thời hạn** của mức giảm (nếu có); (3) dài hạn (cho thuê theo tháng) có cùng thuế suất với lưu trú ngắn ngày không. Ở phần "Nếu chưa quyết": thuế suất lưu theo ngày hiệu lực.
- Trạng thái: Open

### FB-R1-DOM-PO-10
- Mức độ: Minor
- Vị trí: `ESC-010` mục "Lưu ý" (H-12); `ESC-006` (cọc); `research/personas.md` P6
- Vấn đề: ESC-010 xem việc khách Nga không trả được bằng thẻ quốc tế là "giả thuyết H-12 đang chờ kiểm chứng". Thực tế từ 3/2022, thẻ Visa/Mastercard do ngân hàng Nga phát hành hầu như không dùng được ở nước ngoài (thông tin công khai, rộng rãi – vẫn nên hỏi 2–3 khách để biết họ trả cách nào). Ngoài ra persona P6 ghi khách có thể trả bằng USDT. Ở Việt Nam tiền mã hóa không phải phương tiện thanh toán hợp pháp, nên OTTIMO **không được** nhận.
- Vì sao quan trọng: Chính sách cọc (ESC-006 A: cọc 30% qua chuyển khoản/VNPay) gần như không áp được với nhóm khách Nga đặt trực tiếp. Sale sẽ hoặc mất khách, hoặc tự "linh động" ngoài hệ thống.
- Đề xuất sửa: ESC-010: đổi câu thành "gần như chắc chắn; cần biết khách hiện trả bằng cách nào". ESC-006: thêm một dòng "khách không cọc online được → cho giữ chỗ ngắn + thu đủ bằng tiền mặt/chuyển khoản nội địa khi đến; quản lý duyệt". Thêm ghi chú "không nhận tiền mã hóa" vào PRD M12.
- Trạng thái: Open

### FB-R1-DOM-PO-11
- Mức độ: Minor
- Vị trí: `backlog.md` US-017 AC3 (giá ngoài sàn–trần → lỗi tại ô); US-024 AC4
- Vấn đề: (a) US-017 AC3 áp sàn–trần BR-105 cho **mọi** đơn, kể cả đơn OTA nhập tay ở R2. Giá thực của đơn OTA do OTA quyết (Genius, khuyến mãi di động, flash sale cộng dồn có thể xuống dưới 70% giá nền), nên lễ tân sẽ không ghi được một đơn có thật. (b) US-024 AC4 "căn mới không ở VI/VC → bị chặn" đứng chung cho cả đổi căn đơn **tương lai** (B7) và đổi phòng **đang ở** (B14). Đổi căn cho đơn tuần sau không cần căn đang sạch.
- Vì sao quan trọng: (a) Nếu đơn OTA không ghi được thì tồn phòng không bị khóa, dẫn đến đặt trùng. (b) Nếu chặn sai thì lễ tân không xếp lại phòng được khi xử lý xung đột (BR-312).
- Đề xuất sửa: (a) Đơn kênh OTA: giá ngoài sàn–trần chỉ **cảnh báo** và ghi lý do, không chặn. Sàn–trần chặn khi sửa lịch giá và khi tạo đơn Trực tiếp/CTV. (b) Tách AC4: điều kiện `VI`/`VC` chỉ áp cho B14 (đơn `in_house`). B7 chỉ kiểm trùng và khối OOO.
- Trạng thái: Open

### FB-R1-DOM-PO-12
- Mức độ: Minor
- Vị trí: `backlog.md` US-086 AC3; `PRD.md` N11; `open-questions-resolution.md` Q-D3; US-042 AC1
- Vấn đề: (a) US-086 AC3 dùng "đơn dài hạn 1 năm… khớp ví dụ BR-208", nhưng ví dụ BR-208 là căn 302, 6 tháng, NN. QA không có số đối chiếu cho HĐ 1 năm. (b) PRD N11 "không mất dữ liệu quá 24 giờ" lệch với decision-log OPS (RPO ≤ 15 phút). (c) Q-D3 và US-042 AC1 ghi "hạn sớm hơn mốc BR-602". DOM sẽ đổi BR-603 sang "giờ đến + 12 giờ" (mục A, ARC M1), nên câu chữ này sẽ sai.
- Vì sao quan trọng: Đây là các điểm không nhất quán sẽ bị QC B tìm ra. Riêng (c) sẽ làm QA viết ca test theo quy tắc cũ.
- Đề xuất sửa: (a) Đổi dữ liệu AC3 sang "căn 302, NN, 6 tháng" hoặc tham chiếu ví dụ Daniel (BR-203/206/212). (b) N11 tham chiếu RPO của OPS. (c) Sau khi DOM sửa BR-603, Q-D3 ghi "mặc định = giờ đến thực tế + số giờ BR-603". US-042 AC1 bỏ cụm "(sớm hơn mốc BR-602)", giữ "khớp ví dụ BR-603".
- Trạng thái: Open

### FB-R1-DOM-PO-13
- Mức độ: Suggestion
- Vị trí: `ESC-004` (lịch giá, ngày đặc biệt); `ESC-006` (hủy)
- Vấn đề: (a) Danh sách ngày cao điểm chỉ có lễ quốc gia. Cầu ở Đà Lạt còn tăng mạnh vào hè (6–8), các dịp Festival Hoa Đà Lạt (tháng 12 các năm có tổ chức), mùa hoa (dã quỳ, mai anh đào) và các kỳ nghỉ lễ dài ngày. Đội cũng chưa đề xuất **ở tối thiểu** (min 2 đêm cuối tuần/lễ), là công cụ phổ biến để tránh "đêm lẻ" chen giữa hai đơn. Nên lưu ý INV về điều khoản "bằng giá" (rate parity) của OTA khi đặt giá trực tiếp thấp hơn công khai. (b) ESC-006 không có điều khoản bất khả kháng (đèo vào Đà Lạt sạt lở/đóng, sân bay Liên Khương hủy chuyến do thời tiết).
- Vì sao quan trọng: (a) Đây là đòn bẩy doanh thu lớn nhất của khách sạn Đà Lạt và gắn với mục tiêu G1 80%. (b) Tình huống bất khả kháng xảy ra hằng năm vào mùa mưa. Không có quy tắc thì lễ tân tự quyết từng ca, dễ tranh chấp.
- Đề xuất sửa: (a) ESC-004 thêm một dòng hỏi INV các mùa/sự kiện muốn tăng giá và ý kiến về "ở tối thiểu 2 đêm vào T6–T7 và ngày lễ". Đội đã có tham số `special_dates[]`; DOM sẽ thêm `min_stay` vào BR. (b) ESC-006 A thêm: "bất khả kháng có bằng chứng → dời ngày miễn phí trong 3 tháng, không hoàn tiền mặt".
- Trạng thái: Open

---

## Xác nhận story "Mới" (PO report mục Rủi ro)
- **US-024** (Must R2): đúng. Đổi phòng là thao tác bắt buộc khi có sự cố mức Cao (BR-809) và khi xử lý xung đột OTA (BR-312).
- **US-124**: đúng về nghiệp vụ, nhưng phải nâng **Must R3** và mở rộng thành đóng ca (FB-R1-DOM-PO-06).
- **US-127**, **US-132**: khớp BR, không mâu thuẫn.

## Điểm làm tốt
1. AC tham chiếu mã BR ("khớp ví dụ BR-xxx") thay vì chép số. Nhờ vậy khi DOM sửa quy tắc, tiêu chí tự đúng theo, hướng đi đúng để giữ "một nguồn sự thật".
2. US-136 (no-show **không bao giờ tự động**, khóa nút khi chưa ghi kết quả liên lạc) và US-085 AC4 (tiền về sau khi giữ chỗ đã tự hủy) bám rất sát tình huống thật ở quầy.
3. Bộ 7 ESC nghiệp vụ viết bằng ngôn ngữ kinh doanh, mỗi ESC có "Nếu chưa quyết thì…" không chặn code. INV đọc là quyết được.

---

## A. Xác nhận các câu hỏi đội đã nhờ DOM (DOM quyết theo quyền "tính đúng đắn nghiệp vụ"; ORC ghi decision-log khi commit)

| # | Câu hỏi | Trả lời của DOM |
|---|---|---|
| A1 | **QA**: hoa hồng ví dụ BR-208 = 5.342.400? | **Đúng.** Căn 302, NN, 6 tháng, CTV chốt: (7% + 1% NN) × 11.130.000 × 6 = 8% × 66.780.000 = **5.342.400**. Đợt 1 (sau khi thu đủ kỳ đầu) = **2.671.200**, đợt 2 = 2.671.200. Đối chứng nếu NV chốt: (5% + 1%) × 66.780.000 = 4.006.800. DOM sẽ thêm số này vào cột ví dụ BR-208/212 (B.21). |
| A2 | **ARC E2**: tự gán căn cho đơn OTA (căn ánh xạ → căn trống cùng nhóm → nhóm cao hơn)? | **Đồng ý bước 1–2, sửa bước 3.** (1) Căn ánh xạ (Airbnb đăng từng căn – khách đã đặt đúng căn trong ảnh). (2) Căn trống cùng nhóm: ưu tiên căn `VI`/`VC`, rồi căn ít tạo "đêm lẻ" nhất (đêm trống kẹp giữa hai đơn). (3) **Không tự gán sang nhóm khác**: chỉ gợi ý, lễ tân/quản lý xác nhận (nâng hạng miễn phí theo BR-312 là quyết định có giá, vì có thể chặn một đơn giá cao đến sau). Thứ tự "cao hơn" lấy từ `room_group.sort_order` do INV cấu hình, **không** suy từ giá: giá OTA nền của Căn N+ (980.000) thấp hơn Căn N (1.050.000) nên suy từ giá sẽ ra sai. Không tìm được căn → đơn ở trạng thái xung đột chưa gán căn (khớp ARC/BA). Chi tiết thứ tự ưu tiên khi trùng: FB-R1-DOM-INT-01. |
| A3 | **DATA**: BR-411 trước 06:00 = đêm bán? | **Đồng ý.** Nhận phòng trước 06:00 là bán thêm đêm hôm trước (khớp BR-003). Ghi là đêm bán và doanh thu phòng, không phải phụ thu. Điều kiện: căn trống đêm đó. Đơn trực tiếp thêm đêm vào đơn, đơn OTA tạo đơn con Trực tiếp (FB-R1-DOM-PO-03). Bậc 30%/50% vẫn là phụ thu (doanh thu khác). |
| A4 | **DATA**: BR-215 "÷ số đêm của tháng hợp đồng"? | **Đồng ý.** Tháng hợp đồng = từ ngày bắt đầu kỳ tháng đến hết ngày trước kỳ tháng kế (BR-209), nên tổng đêm-phòng luôn bằng tổng tiền HĐ. Ví dụ HĐ bắt đầu 15/10: tháng HĐ 1 = 15/10–14/11 (31 đêm) → 11.130.000 ÷ 31 = 359.032/đêm. DOM sửa câu chữ BR-215 và thêm ví dụ giữa tháng (B.7). |
| A5 | **ARC M1** (= QA #4): ví dụ BR-603 sai | **DOM nhận lỗi.** Quy tắc đúng (theo hiểu biết DOM về Luật 47/2014 Điều 33 – **luật sư vẫn phải xác nhận**): hạn = giờ khách đến thực tế + **12 giờ**, **bỏ** "sớm hơn với 23:00". Ví dụ: đến 08:00 → 20:00; đến 21:30 → 09:30 hôm sau; S3 đến 01:30 → 13:30. Mục tiêu nội bộ (không phải hạn luật): khai trong ca nhận phòng. Tham số `registration_deadline_foreigner_mode` mặc định = `hours_only`. ORC cần sửa dòng decision-log DOM "áp hạn sớm hơn…" (B.1). |
| A6 | **ARC M6**: mã bill theo ngày vs BR-007 | **DOM nhận lỗi ví dụ.** Bỏ dạng `F-yymmdd-nnnn` (đánh lại số mỗi ngày, khó phát hiện lỗ hổng số). Dạng chốt: **`F26-000123`**, gồm 2 số năm + số liên tục theo cơ sở trong năm, bắt đầu lại từ 1 vào 1/1. Đây là cách sổ sách/hóa đơn quen dùng. Các mã khác (OTM-, BG-, WO-, KH-) liên tục, không đặt lại (B.2). |
| A7 | **ARC M7**: sức chứa theo nhóm hay căn | **Theo căn.** Sức chứa và số giường là thuộc tính **từng căn** (`room.max_occupancy`); nhóm chỉ cho giá trị mặc định khi tạo căn. Lý do: 302 và 402 cùng nhóm vẫn có thể khác bố trí giường. US-004 đúng; DOM sửa câu chữ BR-110 (B.3). |
| A8 | **QA #1**: khoảng ngày khối OOO | **Nửa mở như đơn**: lưu [ngày bắt đầu, ngày mở bán lại). Giao diện hỏi "ngày dự kiến xong"; mở bán lại mặc định = ngày xong + 1 (tham số `ooo_reopen_buffer_days` = 1, vì cần dọn + kiểm sau sửa). Ví dụ BR-804 "khóa 15–17/10" = [15/10, 18/10) = 3 đêm. Phiếu "Xong" sớm hơn dự kiến → mở bán từ đêm kế tiếp sau khi căn `VI` (B.4). |
| A9 | **QA #10**: BR-607 thiếu `void` | **Đúng, DOM nhận lỗi.** BR-607 sẽ dùng đúng danh sách SM-05 của BA: `none`, `pre`, `partial`, `review`, `scanned`, `sent`, `confirmed`, `needs_update`, `updated`, `void` (đơn hủy/no-show trước khi khai) (B.5). |

---

## B. Tự nhận lỗi để sửa ở bước 4 (trong `product/docs/business-rules.md` của DOM – chưa sửa bây giờ)

| # | Lỗi / thiếu | Nguồn phát hiện | Cách DOM sẽ sửa |
|---|---|---|---|
| B.1 | BR-603: quy tắc "sớm hơn giữa +12 giờ và 23:00" mâu thuẫn ví dụ của chính nó; S3 lệch; dòng decision-log DOM cùng lỗi | ARC M1, QA #4 | Hạn = giờ đến + 12 giờ (mục A5); sửa ví dụ, S3, S8; nhờ ORC sửa dòng decision-log; giữ nhãn PHÁP LÝ |
| B.2 | BR-007 ví dụ bill `F-261015-0001` trái "liên tục" | ARC M6 | `F26-000123` (mục A6) |
| B.3 | BR-110 "sức chứa từng căn" nhưng mặc định theo nhóm | ARC M7 | Thuộc tính căn, nhóm là mặc định (mục A7) |
| B.4 | BR-804 không nói khoảng ngày OOO nửa mở hay đóng | QA #1 | Mục A8; thêm tham số `ooo_reopen_buffer_days` |
| B.5 | BR-607 thiếu `void` (và lệch SM-05) | QA #10 | Mục A9 |
| B.6 | BR-411 bậc "trước 06:00 → 100%" ghi như phụ thu | DATA | Đêm bán; cách làm với đơn trực tiếp/OTA; kiểm trùng đêm trước (mục A3, FB-PO-03) |
| B.7 | BR-215 "÷ số đêm của tháng lịch" | DATA | "÷ số đêm của tháng hợp đồng" + ví dụ giữa tháng (mục A4) |
| B.8 | BR-432 ví dụ "lễ tân chọn người duyệt: anh Hoàng Anh" trái US-007 AC1 và rbac 5.2 (người gửi không chọn tên người duyệt) | Review PO/BA | Ví dụ mới: hệ thống tự định tuyến theo hạn mức; thêm ngoại lệ "tự áp trong hạn mức của vai" (SQ-3) |
| B.9 | BR-433 lễ tân chỉ có hạn mức lần, không có hạn mức tháng | SQ-3 | Thêm hạn mức tháng tự áp của lễ tân (đề xuất 500.000 đ/người/tháng – [GIẢ ĐỊNH]) + khóa `foc_self_apply_monthly.front_desk` |
| B.10 | BR-403 mã sinh nhật "+ 2 số" trái decision-log SEC (≥ 3 số) | FB-PO-08 | ddmm + 3 số, hoặc + 2 số nếu khóa giới hạn thử sai |
| B.11 | Chưa định nghĩa **ngày nghiệp vụ**; BR-404 "hôm nay" dùng ngày lịch | FB-PO-04, FB-BA-01 | BR-001 thêm: ngày nghiệp vụ đổi lúc 06:00 (khóa `business_day_rollover` = 06:00); BR-404, BR-311 tham chiếu |
| B.12 | BR-311 chưa có quy tắc khôi phục no-show | SQ-1 | Thêm quy tắc (xem DOM-on-BA, phần trả lời SQ-1) |
| B.13 | BR-809 "TB 24 giờ / Thấp 72 giờ" không rõ là hạn gì; chưa nói khi chờ vật tư | SQ-2 | Cao: 15 phút nhận + 2 giờ có phương án, **không dừng**; TB/Thấp: hạn "xong", được dừng khi `waiting_parts` nếu ghi ngày dự kiến có vật tư, quá ngày → cảnh báo |
| B.14 | BR-212/903 chưa có lịch chi gộp | SQ-4 | Gộp chi theo tháng lịch, chi trước ngày 10 tháng sau (sau ngày chốt số liệu 5 của DATA) – [GIẢ ĐỊNH] |
| B.15 | BR-312 thứ tự ưu tiên khi trùng còn sơ lược; chưa có quy tắc tự gán căn OTA | INT, ARC E2 | Viết đầy đủ theo FB-R1-DOM-INT-01 và mục A2 |
| B.16 | **Thiếu nhóm quy tắc đoàn/nhiều căn** (việc R1 của DOM theo skill); thiếu quy tắc đóng ca/đối soát tiền; S7 mất mạng còn sơ sài | FB-PO-02, FB-PO-06, FB-BA-03, FB-BA-04 | Thêm BR-315… (đơn nhóm: cọc chung, hạn danh sách khách, hủy từng căn, bill gộp/tách); BR-526 (đóng ca, chuyển khoản ghi tay "chờ đối soát"); BR-14 S7 mở rộng thành quy trình mất mạng/mất điện; thêm `min_stay` (FB-PO-13) |
| B.17 | BR-609 "xóa ngay" lệch SEC T01 "trong 24 giờ" | QA #5, ARC M3 | "Xóa ngay khi khai báo `confirmed`; hạn trên 24 giờ (SEC T01)" |
| B.18 | BR mục 13 thiếu khóa tham số (BR-427 24 giờ, mốc nhắc BR-611, "nhắc trước 2 giờ" S8, bật HK tự kiểm, ngưỡng tuổi bảo vệ dữ liệu) | ARC M2, BA report | Thêm khóa theo erd 9.3; thêm tham số ngưỡng trẻ em vào BR-612 (chờ ESC-001) |
| B.19 | BR-605 nhắc gia hạn thị thực 14 ngày, quá sát với khách dài hạn (gia hạn qua dịch vụ mất 5–10 ngày làm việc) | DOM-on-UXR (J2-7) | Dài hạn 30 ngày, ngắn ngày 14 ngày |
| B.20 | BR-523/524 chưa nêu loại hình kinh doanh và thuế suất có ngày hiệu lực | FB-PO-09 | Thêm ghi chú PHÁP LÝ + tham số theo ngày hiệu lực |
| B.21 | BR-208/212 chưa có số hoa hồng trong ví dụ (QA phải tự tính) | QA | Thêm 5.342.400 / đợt 1 2.671.200 (mục A1) |
