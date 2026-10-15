# Review BA → QA – Round 1, Bước 3

- Người review: BA | Ngày: 15/10/2026
- Phạm vi: `product/docs/qa/test-strategy.md`, `product/tests/test-cases/r1-main-flows.md` (313 TC), `product/docs/qa/traceability.md`
- Đối chiếu với: `state-machines.md` (SM-01…15, mã chuyển), `rbac-matrix.md` (S-xx, A-xx, Dxx), `use-cases.md`, `business-rules.md`, backlog đợt 3, plan R1 mục 7 (A13, B1–B3, C1), QA report mục 4
- Đã kiểm lại oracle số của khoảng 60 TC có con số (L2-012, L2-053, L3-012, L3-015, L4-002/003/011/047/050/080/081, L5-001/002/004/010/011/022/029/033, NT-018/020/029, L8-006…). Đa số khớp BR. Các chỗ lệch nằm ở thẻ 01 và 06.

---

### FB-R1-BA-QA-01
- Mức độ: Major
- Vị trí: `r1-main-flows.md` TC-L3-070 (US-049/AC1, ưu tiên Cao)
- Vấn đề: Tiền điều kiện là đơn trả phòng **14/10**. Kết quả mong đợi ghi "13/11 (**29 ngày**): ảnh còn; 14/11 (30 ngày): ảnh bị xóa". Tính lại: từ 14/10 đến 13/11 là 17 ngày còn lại của tháng 10 cộng 13 ngày tháng 11, tức **30 ngày**. Vậy 13/11 đã là ngày thứ 30 và 14/11 là ngày 31. Bộ ba mốc trước/đúng/sau (test-strategy 5.1) bị lệch một ngày.
- Vì sao quan trọng: Đây là test thời hạn lưu dữ liệu C3 (BR-610, Nghị định 13/2023). Oracle sai một ngày sẽ làm test **xanh** cả khi job xóa muộn một ngày, tức giữ dữ liệu quá hạn mà không ai biết. Hoặc ngược lại, dev cài đúng nhưng test fail.
- Đề xuất sửa: Ghi rõ quy ước "30 ngày sau trả phòng" (đề nghị: xóa ở lần chạy J16 đầu tiên **sau** 00:00 của ngày trả + 30, tức 13/11 03:00). Viết lại ba mốc: 12/11 03:00 còn; 13/11 03:00 xóa; một ca với `checked_out` lúc 23:59 để kiểm cách đếm ngày theo giờ VN. Nếu DOM chốt cách đếm khác thì ghi theo BR mới (BA đã đề nghị DOM thêm quy ước đếm ngày, xem FB-R1-BA-DOM-07).
- Trạng thái: Open

### FB-R1-BA-QA-02
- Mức độ: Major
- Vị trí: `r1-main-flows.md` (toàn bộ); `traceability.md` mục 6 (operationId chưa dùng); `state-machines.md`
- Vấn đề: Ma trận chỉ truy vết **AC → TC**. Nhiều chuyển trạng thái của SM không có TC nào, dù ba story Must R2 nhắc tới chúng. Danh sách operationId chưa dùng ở traceability mục 6 xác nhận điều này:
  - SM-10 A5 `rejected`: không TC nào (`rejectRequest` chưa dùng). Đây là nhánh tiền, vì bị từ chối thì phụ thu phải **còn nguyên** trên folio và trả phòng được tiếp.
  - SM-10 A6 người gửi rút yêu cầu (`cancelRequest`).
  - SM-02 O4 MGR+ mở khóa OOO không qua phiếu (A87), O5 hủy khối `planned` (`transitionRoomBlock`).
  - SM-08 `withdrawn` (`withdrawQuote`).
  - SM-05 `review → partial` khi bỏ một người (`removePartyMember`).
  - SM-14 HK hủy việc khi khách từ chối dọn (rbac ghi chú 33).
  - SM-03 R9 trường hợp khách trả phòng khi buồng đang `CL`.
  - SM-13 `settled → closed`.
- Vì sao quan trọng: Plan mục 7 C1 cần truy vết "không ô trống", và checklist BA đòi "story → đặc tả → test". AC không liệt kê từng chuyển, nên phủ 100% AC vẫn để lọt các nhánh ngoại lệ, đúng nơi prototype từng sai (FOC, OOO).
- Đề xuất sửa: (1) Thêm TC tối thiểu cho các chuyển trên, trong đó A5 `rejected` ưu tiên Cao: kiểm "dòng FOC bị bỏ, phát sinh còn phải thu, trả phòng không còn bị chặn". (2) Mở rộng `gen_traceability.py` để đọc bảng chuyển trong `state-machines.md` (cột "#": B1…, O1…, K1…, A1…) và sinh mục mới "Chuyển trạng thái → TC", có ô TRỐNG như cột wireframe. Mỗi TC đã ghi mã chuyển ở cột "Quy tắc" nên script làm được ngay.
- Trạng thái: Open

### FB-R1-BA-QA-03
- Mức độ: Major
- Vị trí: `test-strategy.md` mục 2 tầng **R** và tầng **C**; `r1-main-flows.md` TC-RB-018
- Vấn đề: Ma trận quyền tự sinh lấy **`x-roles`/`x-scope`/`x-visible-to` của OpenAPI** làm kỳ vọng. Contract test cũng coi `x-visible-to` là chuẩn. Như vậy, nếu OpenAPI ghi sai quyền so với `rbac-matrix.md` (ví dụ quên bỏ `collaborator` khỏi `confirmDeposit`, A04), server cài đúng theo OpenAPI và test **vẫn xanh**. Nguồn sự thật về quyền theo plan R1 là ma trận của BA (A7, B2).
- Vì sao quan trọng: Rò quyền là lỗi P0 theo chính bảng mức lỗi của QA (C3, CTV thấy số hộ chiếu). Kiểm "server khớp OpenAPI" thì không phát hiện được "OpenAPI lệch RBAC".
- Đề xuất sửa: Thêm một bước kiểm tĩnh trong CI. Đọc `x-rbac` (mã A-xx/S-xx) của từng operation, tra bảng mục 4 của `rbac-matrix.md`, rồi so tập vai ✔/M/D với `x-roles`, và so mục 6 (Dxx) với `x-visible-to`. Lệch thì lỗi P1 tài liệu. BA sẵn sàng xuất bảng RBAC sang CSV/JSON để script đọc dễ (BA nhận việc này ở R2 nếu QA đồng ý).
- Trạng thái: Open

### FB-R1-BA-QA-04
- Mức độ: Major
- Vị trí: `traceability.md` mục 1 ("AC có ≥ 1 TC: 244/244 (100.0%)", "Không còn AC nào… thiếu test case"); mục 5.3
- Vấn đề: Con số 244/244 có tính cả các AC mà TC đã ghi rõ là **không chạy được ở R2**: US-023/AC2 (TC-NT-023 "chưa chạy được ở R2"), US-003/AC3 (TC-RB-004, báo cáo R3, không có endpoint), US-087/AC2 (TC-RB-011, chưa có endpoint hoa hồng). Còn hai TC chưa có kỳ vọng xác định vì tài liệu mâu thuẫn: TC-L2-024 (US-018/US-139) và TC-L2-032 (US-019, khoảng ngày OOO).
- Vì sao quan trọng: QC chấm A13 và C1 dựa trên con số này. "100%" làm che mất 5 điểm đang cần PO, ARC, DOM quyết, mà 2 trong số đó QA tự xếp P1.
- Đề xuất sửa: Trong script, tách hai chỉ số: "AC có TC" và "AC có TC **chạy được ở R2 với kỳ vọng xác định**". Đánh dấu TC bị chặn bằng cột/nhãn (ví dụ `[BLOCKED: PO-03]`, `[UNDECIDED: DOM-03]`) để ma trận tự liệt kê. Sau khi PO, DOM, ARC sửa (thẻ BA-PO-01, PO-03, DOM-03) thì chạy lại.
- Trạng thái: Open

### FB-R1-BA-QA-05
- Mức độ: Minor
- Vị trí: TC-L2-053 (BR-309 "cách hôm nay 3 ngày"), TC-L4-025 (BR-428 "báo trước 1 ngày"), TC-L2-074 ("16/10 01:30 cùng ngày nghiệp vụ"), TC-L6-029 (BR-805, đủ đúng 72 giờ → `VC`), TC-L7-035 (BR-811, 22:00 = ngoài giờ trực), TC-L5-015 vs test-strategy 5.3 ("23:59 ngày thứ 3")
- Vấn đề: Ở 6 chỗ, QA tự chọn cách hiểu biên mà BR không định nghĩa. Các TC này không ghi đó là giả định của QA (khác với TC-L2-024/032/L3-046 đã ghi rất rõ). Riêng test-strategy 5.3 viết "23:59 ngày thứ 3", trong khi BR-304 và TC-L5-015 lại là 18/10, tức ngày tạo + 3 (nếu tính ngày tạo là ngày 1 thì "ngày thứ 3" là 17/10).
- Vì sao quan trọng: Đây là các biên tiền và giờ. Nếu dev hiểu khác thì sẽ sinh bug giả, hoặc tệ hơn là cả hai cùng sai mà không ai biết.
- Đề xuất sửa: Gắn nhãn "giả định QA – chờ DOM" vào cột Quy tắc của 6 TC trên và đưa chúng vào `qa/bug-list.md` (lỗi tài liệu P2, vai DOM). BA đã gửi DOM các thẻ tương ứng (BA-DOM-07, 09, 13). Sửa câu ở test-strategy 5.3 thành "23:59 của ngày (ngày lập + `quote_validity_days`)".
- Trạng thái: Open

### FB-R1-BA-QA-06
- Mức độ: Minor
- Vị trí: TC-L8-005 ("NN theo giờ nhận + 12 giờ") vs TC-L3-046/TC-L3-047 (chế độ `earlier_of`); TC-L5-001 ("791.667 × 0,9") vs test-strategy 4.2 (202 = 792.000)
- Vấn đề: Trong chính bộ tài liệu QA có hai kỳ vọng khác nhau cho cùng một quy tắc. TC-L8-005 tính hạn NN là "+12 giờ" thuần, còn TC-L3-046 áp `earlier_of` (mặc định đã chốt). TC-L5-001 tính giảm giá trên 791.667, còn bảng dữ liệu chuẩn dùng giá niêm yết 792.000.
- Vì sao quan trọng: Khi dựng `br-examples.json`, hai cách hiểu sẽ cho hai dòng oracle mâu thuẫn.
- Đề xuất sửa: TC-L8-005 ghi "hạn theo BR-603 (chế độ `earlier_of`)" và dẫn TC-L3-044. TC-L5-001 đổi cơ sở thành 792.000 (cùng kết quả 713.000). BA cũng đã đề nghị DOM sửa ví dụ BR-107 (BA-DOM-15).
- Trạng thái: Open

### FB-R1-BA-QA-07
- Mức độ: Minor
- Vị trí: `test-strategy.md` mục 4.2 (đơn mẫu DS-0), dòng OTM-0151 "202 Trực tiếp 16→20/10, cọc 900.000"
- Vấn đề: Theo BR-305, cọc của đơn này là 30% × 4 đêm × 792.000 = 950.400, làm tròn 100.000 thành **1.000.000**. DS-0 ghi 900.000 mà đơn vẫn `confirmed`. Nếu seed đi qua B4 (điều kiện đủ cọc BR-305) thì sẽ bị từ chối. Nếu seed ghi thẳng vào DB thì DS-0 chứa một đơn vi phạm quy tắc hiện hành.
- Vì sao quan trọng: E2E và demo chạy trên DS-0. Một đơn "đã xác nhận mà thiếu cọc" sẽ làm báo cáo "còn phải thu", "Cần chú ý" và TC dùng OTM-0151 (TC-RB-012) cho kết quả khó giải thích.
- Đề xuất sửa: Hoặc sửa cọc DS-0 thành 1.000.000, hoặc ghi rõ "đơn mẫu nhập theo snapshot cũ (BR-006), không đi qua B4" và thêm cột "nạp bằng" (API/seed trực tiếp) cho từng đơn mẫu.
- Trạng thái: Open

### FB-R1-BA-QA-08
- Mức độ: Minor
- Vị trí: `test-strategy.md` mục 1.1 mục tiêu 2 ("mỗi lỗi BL 8.2 loại 'Sửa' có test chống tái phát"); `traceability.md` mục 4 (#11, #14, #22 "chưa có")
- Vấn đề: Mục tiêu viết như đã áp cho R1, nhưng 3 lỗi loại "Sửa" chưa có TC (#11, #14, #22; #25 thuộc "Cần INV"). Mục 11 của file test case giải thích đúng lý do (phân hệ R3), nhưng mục tiêu ở strategy không nói phạm vi round.
- Vì sao quan trọng: QC đọc strategy sẽ chấm là chưa đạt chính mục tiêu QA đề ra.
- Đề xuất sửa: Sửa mục tiêu thành "… có test chống tái phát **trước khi story liên quan vào round**", và dẫn sang traceability mục 4 để biết round dự kiến của từng lỗi.
- Trạng thái: Open

### FB-R1-BA-QA-09
- Mức độ: Minor
- Vị trí: `r1-main-flows.md` mục 4.1 (TC-L3-003); BR-307; SM-01 B9 điều kiện (2)
- Vấn đề: BR-307 có hai kiểu thanh toán OTA: "OTA thu hộ" và "khách trả tại chỗ". TC-L3-003 (c) chỉ test kiểu thu hộ, nhận phòng khi còn phải thu = 0. Kiểu "trả tại chỗ" (Booking không qua Payments by Booking, khá phổ biến) phải **thu đủ** trước khi nhận phòng và giao mã cửa, nhưng chưa có TC. Tương tự, B18 chưa có TC trả phòng cho đơn OTA trả tại chỗ.
- Vì sao quan trọng: Đơn OTA trả tại chỗ dễ bị cho nhận phòng như đơn đã thanh toán. Khi đó khách đi mà chưa trả tiền phòng, tức sai tiền (P0).
- Đề xuất sửa: Thêm TC-L3-00x: đơn Booking "trả tại chỗ", còn phải thu = tiền phòng, nhận phòng → `409 CHECKIN_CONDITIONS_NOT_MET` (`unmet=[balance_paid]`); ghi thu đủ thì nhận được. Thêm một TC tương ứng ở bước 2 trả phòng.
- Trạng thái: Open

### FB-R1-BA-QA-10
- Mức độ: Suggestion
- Vị trí: `test-strategy.md` mục 4.3 (tài khoản test)
- Vấn đề: Có tài khoản ghép `qa.fdsal` (FD ∪ SAL), nhưng chưa có tổ hợp **HK ∪ MT**. rbac mục 1 quy tắc 2 nêu tổ hợp này cho persona P3 (anh Tùng kiêm, đội 2 buồng phòng + 1 kỹ thuật). Cũng chưa có ca "FD trực đêm trên điện thoại" để kiểm rbac 8.7 (C3 chỉ mở trên máy quầy) cùng với BR-611 (khai báo ca tối). TC-RB-022 đang để mức Thấp.
- Vì sao quan trọng: Hợp quyền HK ∪ MT dễ lộ tên khách cho vai MT (D01 = K với MT nhưng Tên+căn với HK) hoặc cho tạo khối OOO sai phạm vi. Trực đêm trên điện thoại là kịch bản thật của OTTIMO (ESC-010).
- Đề xuất sửa: Thêm `qa.hkmt`, kèm 2–3 ca: phạm vi T của HK có áp sang màn bảo trì không, D01 hiển thị theo màn đang mở. Nâng TC-RB-022 lên TB khi SEC chốt rbac 8.7.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)
1. **Ghi thẳng mâu thuẫn tài liệu vào TC thay vì tự chọn lặng lẽ.** TC-L2-024 (đơn OTA trùng), TC-L2-032 (khoảng ngày OOO), TC-L3-039 (thời điểm xóa ảnh) và TC-L3-046 (hạn khai báo NN) đều nêu rõ đang test theo bên nào và vì sao. Cách làm này đã giúp BA tìm ra lỗi tương ứng ở BR và backlog. Danh sách lệch ở report mục 4 rất chính xác.
2. **Thiết kế kiểm thử bám đúng điểm yếu của prototype.** Có đồng hồ giả với quy tắc 3 điểm quanh mỗi mốc, ca đồng thời 50 yêu cầu cùng căn – đêm, ca 8 luồng chiếm phòng cùng một mã lỗi (TC-L2-023), ca dò rò C3 ở log, outbox, SSE, idempotency (TC-RB-020) và ca chặn số thẻ theo Luhn (TC-RB-021). Đây đúng là các ca chống tái phát BL 8.2 #27, #30.
3. **Oracle từ ví dụ BR (`br-examples.json`) và ma trận sinh bằng script.** Đổi chính sách chỉ phải sửa một chỗ. Script bắt được 0 operationId lạ, 0 tham chiếu AC sai, 0 mã TC trùng, và chỉ ra 10 story chưa có wireframe. Đề nghị giữ hướng này và mở rộng như thẻ QA-02, QA-03.
