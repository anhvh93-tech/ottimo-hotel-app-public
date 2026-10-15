# Review DOM → BA – Round 1, Bước 3

- Người review: DOM | Ngày: 15/10/2026
- Phạm vi: `product/docs/business-processes.md`, `use-cases.md`, `state-machines.md` (gồm trả lời SQ-1…SQ-4 ở mục 16), `rbac-matrix.md`
- Góc nhìn: quy trình có chạy được ở quầy lúc đông khách và lúc 2 giờ sáng không; có thiếu tình huống thực tế không (đoàn, mất mạng, bàn giao ca, khách đến khuya).

---

### FB-R1-DOM-BA-01
- Mức độ: Major
- Vị trí: `state-machines.md` B9 ("Hôm nay = ngày đến"); `use-cases.md` UC-11 tiền điều kiện ("ngày đến = hôm nay"); SM-01 mục 1.1 cột "Hiện ở Hôm nay"; B12 ("trong ngày nghiệp vụ của đêm đến")
- Vấn đề: Tài liệu không định nghĩa "hôm nay" hay "ngày nghiệp vụ" đổi lúc nào. Nếu hiểu theo ngày lịch: đơn đến 20/10, khách tới lúc 01:30 ngày 21/10 → B9 từ chối nhận phòng (21 ≠ 20), đơn rời khỏi "Khách đến". Đúng lúc đó người trực đêm đang ở một mình với khách và vali. Đây cũng là chính tình huống E2 của P03 (khách đến khuya) mà BA đã mô tả.
- Vì sao quan trọng: Khách bay chuyến tối hoặc đi xe đêm đến Đà Lạt sau nửa đêm là chuyện hằng tuần. Nếu máy trạng thái chặn ở đây, lễ tân sẽ phải gọi quản lý dậy hoặc làm ngoài hệ thống (ghi giấy, nhập bù), đúng điều app muốn xóa bỏ.
- Đề xuất sửa: Thêm vào SM 0.2 một nguyên tắc: "'Hôm nay' = **ngày nghiệp vụ**, đổi lúc 06:00 giờ VN (BR-001 – DOM bổ sung, cùng mốc với BR-003)". B9 sửa thành "ngày nghiệp vụ = ngày đến". UC-11 cũng vậy. Thêm ngoại lệ vào P03: "Khách đến sau 00:00 của đơn ngày hôm trước → vẫn nằm trong 'Khách đến', nhận phòng bình thường; đêm đầu tính như đã đặt."
- Trạng thái: Open

### FB-R1-DOM-BA-02
- Mức độ: Major
- Vị trí: `business-processes.md` P03 E9; `use-cases.md` UC-11 A3; `state-machines.md` B9 (đổi ngày đến qua B7); B7 ("đơn OTA: ngày theo OTA")
- Vấn đề: Khi khách nhận phòng trước mốc 06:00, BA cho lễ tân "đổi ngày đến sang đêm trước (B7)". Nhưng chính B7 cấm đổi ngày đơn OTA, nên luồng tự mâu thuẫn với khách OTA. Luồng này cũng không nói rõ giá đêm thêm lấy từ đâu và phải kiểm trùng đêm trước cho mọi trường hợp.
- Vì sao quan trọng: Khách xe đêm từ TP.HCM đến 04:00–05:30 là nhóm hay xin nhận sớm nhất, và nhiều người đặt qua OTA. Lễ tân trực đêm sẽ không có đường đi hợp lệ trong app.
- Đề xuất sửa: Thay E9/A3 bằng một chuyển riêng **"Thêm đêm trước (nhận trước 06:00)"**: kiểm căn trống đêm trước (BR-906). Đơn Trực tiếp/CTV thì thêm 1 đêm vào đầu đơn, giá theo BR-411. Đơn OTA thì tạo **đơn con kênh Trực tiếp** cho đêm đó, giống gia hạn (BR-422), và đơn con đi thẳng vào `in_house`. Đêm này là đêm bán (DATA, BR-904). Căn không trống thì không cho nhận, gợi ý gửi hành lý. DOM sửa BR-411 khớp (DOM-on-PO mục B.6).
- Trạng thái: Open

### FB-R1-DOM-BA-03
- Mức độ: Major
- Vị trí: `business-processes.md` (không có quy trình); `state-machines.md` SM-12 (`[*] → succeeded` "chuyển khoản đã thấy tiền" do FD+ ghi); `rbac-matrix.md` A33, A44 ghi chú 28
- Vấn đề: Không có quy trình **đóng ca / cuối ngày**. SM-12 cho lễ tân tự ghi `succeeded` cho chuyển khoản "đã thấy tiền", nhưng sau đó không có bước nào đối chiếu với sao kê ngân hàng. Từ R2 đến hết R3 chưa có webhook báo tiền về (I2b là R3). Tiền mặt thu trong ca cũng không có bước đếm và bàn giao. Các việc cuối ngày thật như rà đơn chưa đến (no-show), khai báo còn thiếu, đối chiếu buồng – đơn (BR-806), khách chưa trả phòng đang nằm rải rác ở nhiều nơi.
- Vì sao quan trọng: Ở khách sạn nhỏ, thất thoát tiền hay xảy ra nhất ở hai chỗ: "đã chuyển khoản rồi" (khách đưa ảnh chụp màn hình giả hoặc chuyển nhầm tài khoản) và tiền mặt cuối ca. Có quy trình đóng ca thì INV đối soát được hằng ngày bằng app thay vì sổ tay. Persona P2 và J3 15:00 của UXR cũng chỉ ra đúng điểm đau này.
- Đề xuất sửa: Thêm **P11 – Đóng ca / chốt ngày**. FD xem tổng thu ca theo cách thanh toán, nhập tiền mặt đếm thực tế (chênh lệch phải có lý do, gửi MGR). Chuyển khoản ghi tay mang cờ `chờ đối soát` cho đến khi MGR+ tick sau khi xem sao kê, hoặc webhook R3 xác nhận. Danh sách việc tồn được chuyển cho ca sau (khai báo chưa `sent`, khách đến chưa tới, yêu cầu khách đang mở). SM-12 thêm thuộc tính `reconciled_at/by`. DOM sẽ thêm BR-526 (DOM-on-PO B.16).
- Trạng thái: Open

### FB-R1-DOM-BA-04
- Mức độ: Major
- Vị trí: `business-processes.md` (chỉ P07 nhắc HK lưu tạm khi mất mạng); decision-log ARC (ADR-005: thao tác tiền/tồn bắt buộc có mạng); BR mục 14 S7
- Vấn đề: Không có quy trình cho **lễ tân khi mất mạng hoặc mất điện**. Theo ADR-005, nhận phòng, thu tiền, tạo đơn đều cần mạng. Nếu internet ở quầy mất 2 giờ đúng lúc 14:00 (S7) thì khách đến không nhận phòng được trong app, lễ tân không xem được mã cửa đã nhập, không biết căn nào đã sạch.
- Vì sao quan trọng: Đà Lạt mùa mưa hay mất điện, mất mạng cục bộ. Mọi PMS thật đều có "quy trình dự phòng" (in sẵn danh sách khách đến, dùng 4G, sổ giấy, nhập bù). Không có quy trình thì nhân viên tự xoay xở và dữ liệu sau đó lệch (giờ nhận sai, tiền ghi muộn, phụ thu tính theo giờ nhập bù).
- Đề xuất sửa: Thêm **P12 – Vận hành khi mất mạng/mất điện**. (1) Phòng ngừa: mỗi sáng chuẩn bị sẵn danh sách khách đến/đi, trạng thái buồng và số điện thoại liên hệ khẩn (in giấy hoặc bản đọc offline trên máy quầy, **không** gồm số giấy tờ). (2) Thứ tự thử: 4G điện thoại phát Wi-Fi, rồi mới đến giấy. (3) Không nhận đơn mới qua điện thoại khi chưa xem được tồn phòng; báo khách sẽ xác nhận lại sau. (4) Nhập bù: cho ghi "giờ thực tế" trong quá khứ kèm lý do "nhập bù sau mất mạng". Phụ thu tính theo giờ thực tế, không theo giờ nhập (BR-414). (5) Có mạng lại: kiểm trùng và đối soát kênh (BR-905). ARC/UXD quyết phần kỹ thuật bản offline.
- Trạng thái: Open

### FB-R1-DOM-BA-05
- Mức độ: Major
- Vị trí: `business-processes.md` P01; `state-machines.md` SM-01 (không có khái niệm đơn nhóm)
- Vấn đề: P01 chỉ có đơn một căn. Không có luồng **đặt nhiều căn cho một đoàn/gia đình** (cùng thẻ FB-R1-DOM-PO-02): cọc chung, hủy bớt căn, đổi danh sách khách từng căn, bill gộp/tách, một người trả cho cả đoàn.
- Vì sao quan trọng: Đoàn 2–4 căn cuối tuần và lễ ở Đà Lạt rất phổ biến. Với 10 căn, đó là phần lớn công suất của đêm. Xử lý bằng nhiều đơn rời gây sai khi đối chiếu cọc (một lần chuyển khoản cho 3 đơn) và khi trả phòng.
- Đề xuất sửa: Thêm thực thể "nhóm đơn" (đơn căn vẫn đi theo SM-01 riêng). Bổ sung vào P01: tạo nhóm từ báo giá nhiều căn, cọc chung phân bổ theo căn, hủy một căn trong nhóm (BR-309 tính theo căn bị hủy), trả phòng có lựa chọn bill gộp. UC mới "UC-31 – Đơn nhóm". DOM bổ sung quy tắc đoàn (DOM-on-PO B.16).
- Trạng thái: Open

### FB-R1-DOM-BA-06
- Mức độ: Minor
- Vị trí: `business-processes.md` P01 "Luồng chính – đơn OTA" và E6; `state-machines.md` 1.3
- Vấn đề: Luồng OTA chỉ có "đơn mới" và "OTA hủy". Thiếu **OTA sửa đơn** (khách đổi ngày, đổi số khách, đổi loại phòng trên OTA, hủy một phần đơn nhiều đêm), một sự kiện xảy ra thường xuyên. INT đã ghi webhook "đơn mới / sửa / hủy" nhưng BA chưa có hệ quả nghiệp vụ.
- Vì sao quan trọng: Đơn OTA đổi ngày mà app không kiểm trùng lại sẽ thành đặt trùng. Đổi số khách mà không cập nhật số người cần khai báo sẽ làm thiếu khai báo.
- Đề xuất sửa: Thêm E10 "OTA sửa đơn": SYS áp thay đổi, kiểm trùng lại (trùng → cờ xung đột như X2), cập nhật giá snapshot theo OTA, số người cần khai (K9 nếu đã `confirmed`), đồng bộ kênh. Đơn đang `in_house` mà OTA rút ngắn ngày → tạo việc cho lễ tân xác nhận, không tự đổi.
- Trạng thái: Open

### FB-R1-DOM-BA-07
- Mức độ: Minor
- Vị trí: `state-machines.md` SM-07 T2 ("hoa hồng đợt 1 → `payable`") so với SM-11 (`earned` khi kỳ đầu `paid`, `earned → payable` theo kỳ chi); `use-cases.md` UC-30 ghi chú "chưa có story"
- Vấn đề: (a) Hai máy trạng thái nói khác nhau về thời điểm hoa hồng đợt 1 sang `payable`. (b) UC-30 ghi "chưa có story", trong khi PO đã thêm US-133, US-134.
- Vì sao quan trọng: (a) BE sẽ code một trong hai; báo cáo hoa hồng lệch với màn chi. (b) Nhỏ, nhưng QC B sẽ ghi là không nhất quán.
- Đề xuất sửa: (a) T2 sửa thành "hoa hồng đợt 1 → `earned`"; `payable` chỉ do job kỳ chi (xem SQ-4). (b) Cập nhật ghi chú UC-30 → US-133, US-134.
- Trạng thái: Open

### FB-R1-DOM-BA-08
- Mức độ: Minor
- Vị trí: `state-machines.md` B12; `rbac-matrix.md` A10, mục 5.1 dòng "Khôi phục no-show"; (backlog US-136 AC4 của PO)
- Vấn đề: B12 chỉ cho MGR+ khôi phục (người trực đêm FD phải gửi yêu cầu duyệt). Vào lúc 01:00, khách đã cọc đứng ở quầy, quản lý đang ngủ: duyệt không kịp thì phải để khách chờ hoặc làm ngoài hệ thống. Chi tiết xem trả lời SQ-1 bên dưới.
- Vì sao quan trọng: Kiểm soát nên đặt ở chỗ **có tiền chạy ra**. Khôi phục no-show khi căn còn trống và khách đã cọc không làm mất tiền của OTTIMO.
- Đề xuất sửa: Theo trả lời SQ-1: FD được tự khôi phục khi đủ 3 điều kiện, còn lại mới cần MGR+. Cập nhật B12, A10 (FD/FDL = ✔ có điều kiện), rbac 5.1. PO sửa US-136 AC4 cho khớp.
- Trạng thái: Open

### FB-R1-DOM-BA-09
- Mức độ: Suggestion
- Vị trí: `business-processes.md` P07 ngoại lệ ("khách treo biển không làm phiền → hoãn")
- Vấn đề: Quy trình chỉ hoãn dọn khi khách treo biển "không làm phiền", không có mốc cảnh báo nếu tình trạng kéo dài.
- Vì sao quan trọng: Khách sạn thật có quy tắc "kiểm tra an toàn" (welfare check): phòng treo biển hoặc không cho dọn quá 24–48 giờ, không liên lạc được, thì quản lý cùng một nhân viên vào kiểm. Có tình huống sức khỏe, và có cả tình huống phòng bị dùng sai mục đích. Với khách dài hạn từ chối dọn nhiều tuần thì cần kiểm phòng định kỳ để bảo vệ tài sản (căn cứ cho khấu trừ ký quỹ BR-214).
- Đề xuất sửa: Thêm ngoại lệ P07: từ chối dọn hoặc treo biển quá [tham số, đề xuất 48 giờ] → việc "Liên hệ khách" cho FD, không liên lạc được → MGR + 1 nhân viên vào kiểm, ghi biên bản. Khách dài hạn: kiểm tình trạng phòng tối thiểu 1 lần/tháng, báo trước 24 giờ. DOM sẽ đưa tham số vào BR-807.
- Trạng thái: Open

---

## Trả lời câu hỏi `state-machines.md` mục 16 (DOM quyết theo quyền nghiệp vụ – BA, PO cập nhật theo; DOM ghi vào BR ở bước 4)

| # | Câu hỏi | Trả lời DOM | Cần sửa ở đâu |
|---|---|---|---|
| **SQ-1** | Khôi phục no-show: có không, ai làm khi chỉ có người trực đêm? | **Có.** FD/FDL (gồm người trực đêm) **tự khôi phục** khi đủ 3 điều kiện: (1) còn trong ngày nghiệp vụ của đêm đến (trước 06:00 hôm sau – BR-001 bổ sung); (2) căn của đơn vẫn trống, chưa bán lại và không phải đổi căn; (3) không phát sinh hoàn tiền hay đổi giá. Bắt buộc ghi lý do; MGR nhận thông báo và danh sách khôi phục hiện trong báo cáo đóng ca. Ngoài 3 điều kiện (căn đã bán lại, phải đổi căn, có tiền ra, qua ngày nghiệp vụ) thì **MGR+ duyệt** qua SM-10. Lý do: kiểm soát đặt ở dòng tiền ra; khách đã cọc đứng ở quầy lúc 1 giờ sáng không thể chờ quản lý dậy. Đơn OTA đã báo no-show lên kênh → MGR+ và phải báo kênh hủy no-show. | B12, rbac A10 + 5.1, US-136 AC4, BR-311 (DOM) |
| **SQ-2** | Hạn BR-809 có dừng khi `waiting_parts`? | **Mức Cao: không dừng.** Hạn của mức Cao là "nhận trong 15 phút + có **phương án** trong 2 giờ" (phương án = sửa xong hoặc đổi phòng/bù sự cố), không phải "sửa xong", nên chờ vật tư không phải lý do để kéo dài. Khách vẫn không có nước nóng thì phải đổi phòng. **Mức TB/Thấp**: hạn là "xử lý xong"; được **tạm dừng** khi `waiting_parts` nếu kỹ thuật ghi **ngày dự kiến có vật tư**. Quá ngày đó thì cảnh báo lại và vào "Cần chú ý". Căn đang có khách dài hạn: nâng một bậc nếu ảnh hưởng làm việc (Wi-Fi, nước nóng). | SM-04, BR-809 (DOM) |
| **SQ-3** | FOC minibar trong hạn mức của FD: tự áp hay cần FDL duyệt? | **Tự áp – đồng ý đề xuất BA**, kèm điều kiện: (1) chỉ loại FOC minibar (BR-704), ≤ hạn mức lần của vai FD (BR-433); (2) **thêm hạn mức tháng** cho mỗi FD (DOM đề xuất 500.000 đ/người/tháng, [GIẢ ĐỊNH – chờ INV] qua ESC-007); vượt hạn mức tháng thì chuyển `pending` lên FDL; (3) xác nhận bằng PIN của chính mình, lý do bắt buộc; (4) vào báo cáo FOC và cảnh báo BR-435, hiện trong đóng ca để FDL xem lại. Quy tắc chung để BR-432 không còn đọc mâu thuẫn: *"Không ai duyệt yêu cầu của chính mình, **trừ** khi giá trị nằm trong hạn mức tự áp của vai mình (FD: minibar; MGR/OWN: theo BR-433)."* FDL **không** tự áp FOC của chính mình ngoài phần minibar thừa hưởng từ FD, phần còn lại do MGR duyệt. | SM-10 A2, rbac ghi chú 24, US-007 (PO), BR-432/433 (DOM) |
| **SQ-4** | Hoa hồng `payable` gộp chi theo tháng? | **Có, gộp theo tháng lịch.** Job ngày 1 chuyển mọi bản ghi `earned` của tháng trước sang `payable`. Chi trước ngày 10 (sau ngày chốt số liệu ngày 5 của DATA) – [GIẢ ĐỊNH – chờ INV]. Bản ghi bị điều chỉnh sau khi đã `paid` (khách bị hoàn tiền) thì trừ vào kỳ chi sau, không sửa bản ghi cũ (BR-008). | SM-11, SM-07 T2 (FB-BA-07), BR-212/903 (DOM) |

Ghi thêm (BA nhờ trong decision-log): **Hoàn tác nhận phòng nhầm (B17)** – DOM **xác nhận** cho phép, MGR+, cùng ngày nghiệp vụ, chưa có dòng folio mới. Điều kiện như BA viết là đúng.

## Điểm làm tốt
1. Mỗi chuyển trạng thái có "điều kiện server kiểm – ai được chuyển – hệ quả", kèm `sync` và khai báo `void`. Mức chi tiết này giúp BE/QA code và test thẳng mà không phải đoán.
2. Đã thấy và đặt câu hỏi đúng các ngoại lệ thực tế: khách đến khi đơn còn `hold`, tiền về sau khi giữ chỗ tự hủy, job hết hạn chạy trễ, đơn dài hạn hết HĐ mà khách chưa đi. Đây đều là ca thật ở quầy.
3. RBAC tách rõ "người đặt hạn mức" và "người duyệt" (5.3), CTV không xác nhận tiền, và quy tắc "trường không được phép không trả về từ API". Đúng tinh thần kiểm soát nội bộ cho đội nhỏ.
