# Review chéo – UXD đánh giá sản phẩm UXR · Round 1 · Bước 3

- Người review: UXD · Tác giả: UXR · Ngày: 15/10/2026
- Phạm vi: `product/docs/research/personas.md` (v0.1), `product/docs/research/journeys.md` (v0.1), `product/docs/research/heuristic-review-r0.md` (v0.1), `02-escalations/ESC-003.md`
- Đối chiếu với: `00-brief/investor-brief.md`, `01-decisions/decision-log.md`, `product/docs/business-rules.md` (BR), `product/docs/rbac-matrix.md`, các ESC-005/007/010/012, `product/docs/adr/ADR-005-staff-app-pwa.md`, wireframe UXD `product/design/wireframes/`
- Góc nhìn: persona/hành trình có đủ cụ thể để ra quyết định thiết kế không; mâu thuẫn với brief/BR; mức nghiêm trọng HR; khả năng kiểm chứng H-01…H-20; tính khả thi của ESC-003 phương án A.
- Đã tự kiểm lại số đo tương phản trong `heuristic-review-r0.md` mục 3 bằng công thức WCAG: `--faint`/`--bg` 2,65:1, `--faint`/`--surface` 2,86:1, `--oak`/`--surface` 2,94:1, `--oak-ink`/`--oak-soft` 4,18:1, focus `--oak`/`--bg` 2,72:1, `--ok` vs `--bad` 1,12:1 – **khớp hoàn toàn**.

Tổng: **0 Blocker · 5 Major · 6 Minor · 3 Suggestion**

---

### FB-R1-UXD-UXR-01
- Mức độ: Major
- Vị trí: `02-escalations/ESC-003.md` dòng "Phương án A" và "Đội đề xuất"; `personas.md` mục 9 (dòng 176–199)
- Vấn đề: ESC nói "chỉ 9 câu hỏi ưu tiên Cao (danh sách ở personas.md mục 9)", nhưng phương án A thực tế liệt kê **12** giả thuyết: H-01, H-08, H-19, H-02, H-03, H-04, H-05, H-06, H-07, H-12, H-13, H-14. Trong đó **H-07, H-13, H-14, H-19 là mức TB** theo bảng mục 9, còn **H-10 (Cao)** lại **không có** trong phương án A. Ngoài ra ESC dùng mã "H-01, H-08…" mà không giải thích – chủ đầu tư phải mở `personas.md` mới hiểu mình được hỏi gì, trái với yêu cầu "ngôn ngữ kinh doanh, không thuật ngữ khó" của protocol mục 8.
- Vì sao quan trọng: Chủ đầu tư đọc ESC để quyết trong vài phút; danh sách không khớp làm mất niềm tin vào con số "2–3 giờ" và khiến H-10 (quyết định luồng check-in online cho khách OTA) rơi khỏi kế hoạch kiểm chứng mà không ai nhận.
- Đề xuất sửa: (1) Chốt lại một danh sách duy nhất và ghi đúng số lượng; nếu cố ý thêm TB vì "tiện hỏi luôn" thì ghi rõ "9 Cao + 3 TB hỏi kèm". (2) Ghi rõ H-10 đi đường khác (INT xác minh với channel manager trong R2, xem FB-02). (3) Trong ESC thay mã bằng câu hỏi đời thường, ví dụ: "Anh/chị xem số liệu chủ yếu trên điện thoại hay laptop?" (H-01); giữ mã trong ngoặc để đội tra.
- Trạng thái: Open

### FB-R1-UXD-UXR-02
- Mức độ: Major
- Vị trí: `ESC-003.md` phương án A, "Chi phí/thời gian: 0 đ; 2–3 giờ"; `personas.md` mục 9 dòng 174, H-03 (dòng 180), H-04 (dòng 181), H-10 (dòng 187); `rounds/round-01/outputs/UXR/report.md` dòng 38
- Vấn đề: Ước lượng 2–3 giờ chưa tính các phần không làm được trong thời lượng đó:
  - H-03 cách kiểm chứng ở mục 9 là "xem lại 1 tuần lịch sử chat, đếm tin theo ngôn ngữ" – không làm được trong "hỏi lễ tân 10 phút" như ESC ghi; việc lục chat của khách còn đụng dữ liệu cá nhân (cần lưu ý SEC).
  - H-04 cần "đếm giờ đến thực tế tháng 9–10" – là việc lục dữ liệu OTA/sổ sách, không phải câu hỏi 10 phút.
  - H-10 cần "INV thử với 3–5 khách OTA thật" – không thể làm trước Round 2 vì hệ thống gửi link chưa tồn tại.
  - Hỏi 3 khách thuê tháng "qua chat" là việc **chờ trả lời không đồng bộ** (có thể vài ngày), không tính bằng giờ.
  - Phiếu "1 trang câu hỏi + phiếu ghi" mà ESC hứa **chưa có**: personas.md dòng 174 và báo cáo UXR dời `real-user-test-guide.md` sang Round 2, trong khi hạn trả lời ESC là "trước Sản xuất Round 2" – tức chủ đầu tư cần phiếu ngay khi nhận round-summary R1.
  - ESC không nói kết quả ghi vào đâu, gửi lại cho ai.
- Vì sao quan trọng: Nếu chủ đầu tư đồng ý A rồi phát hiện tốn gấp đôi thời gian hoặc không có phiếu để dùng, khả năng cao bỏ dở → đội mất đúng những kiểm chứng rủi ro nhất (H-05, H-12) trước khi code.
- Đề xuất sửa: (1) Tách bảng thời gian theo người: INV tự trả lời ~10 phút; lễ tân ~15 phút (chỉ hỏi, không lục chat – H-03 đổi thành "ước lượng tỷ lệ tin tiếng Nga trong tuần qua"); buồng phòng ~20 phút; khách thuê tháng: INV gửi 3 câu soạn sẵn (~10 phút), chờ trả lời tối đa 3 ngày. Tổng thời gian **chủ động** của INV ≈ 1–1,5 giờ – nói rõ thay vì "2–3 giờ". (2) H-04 chuyển một phần sang ESC-010 (người trực ca tối) và DATA lấy giờ đến từ dữ liệu có sẵn khi có. (3) H-10 rút khỏi A, giao INT xác minh tài liệu channel manager. (4) Đưa bản 1 trang `real-user-quick-check.md` vào **Round 1 (bước 4)** và đính kèm ESC; ghi rõ nơi nộp kết quả (ví dụ `04-investor-feedback/` hoặc trả lời trực tiếp cho ORC).
- Trạng thái: Open

### FB-R1-UXD-UXR-03
- Mức độ: Major
- Vị trí: `personas.md` H-05 (dòng 182); `ESC-003.md` phương án A "cho nhân viên buồng phòng xem 3 màn mẫu 15 phút (H-05, H-06, H-07)"
- Vấn đề: Cách kiểm chứng H-05 chưa đủ để ra quyết định thiết kế:
  - Tiêu chí "tự bấm được 'dọn xong' không cần trợ giúp" không đo được bằng **màn mẫu trên giấy** (mục 9 cho phép "giấy hoặc wireframe").
  - Không nói **3 màn nào**, ai chuẩn bị, mở trên máy nào. Wireframe UXD `product/design/wireframes/06-housekeeping-mobile.html` đã có "Việc của tôi", "Căn 202 · Đang dọn" (checklist + minibar), "Báo sự cố" – nhưng cần mở **trên chính điện thoại của nhân viên** mới kiểm được H-07 (đời máy) và cỡ chữ/nút.
  - Người hỏi là chủ đầu tư = **người trả lương** → nhân viên dễ trả lời "dùng được ạ" cho vừa lòng; hỏi ý kiến ("có muốn dùng không") ít giá trị hơn quan sát làm thử.
  - Thiếu luật quyết định khi kết quả **không đạt**: thiết kế chuyển sang hướng nào (ESC chỉ nói "giữ đường lui lễ tân cập nhật hộ").
- Vì sao quan trọng: H-05 là giả thuyết rủi ro cao nhất (UXR tự đánh giá) và quyết định toàn bộ phân hệ buồng phòng mobile (L6, ADR-005 PWA offline). Kiểm chứng sai cách thì đội vẫn code trên giả định.
- Đề xuất sửa: (1) Viết kịch bản dạng **nhiệm vụ**, không dạng ý kiến: "Mở link này trên điện thoại của chú/anh. Hãy tìm phòng cần dọn trước. Bấm báo dọn xong phòng 202. Báo hỏng vòi sen phòng 402 kèm ảnh." Người quan sát chỉ ghi: làm được / làm được có hỗ trợ / không làm được, và thời gian. (2) Ghi rõ dùng 3 màn của `06-housekeeping-mobile.html` – UXD sẽ cung cấp đường link mở được trên điện thoại (bản tĩnh, có dữ liệu mẫu). (3) Thêm luật quyết định: ≥ 2/3 nhiệm vụ tự làm được → giữ L6 như thiết kế; 1/3 → đơn giản hóa (chỉ "Việc của tôi" + "Dọn xong"), lễ tân nhập minibar/sự cố hộ; 0/3 hoặc từ chối dùng → L6 chuyển thành màn cho lễ tân cập nhật hộ + bảng in, ghi ESC/decision-log. (4) Gợi ý người hỏi nói trước "đang thử phần mềm, không phải kiểm tra anh/chị".
- Trạng thái: Open

### FB-R1-UXD-UXR-04
- Mức độ: Major
- Vị trí: `personas.md` P1 "Thước đo thành công" (dòng 57), P2 mục tiêu + thước đo (dòng 69, 74), biến thể P2 (dòng 76), H-04 (dòng 181); `journeys.md` J3 07:30 và 14:00–15:00 (dòng 58, 67: "nhắc lại 18:00, 21:00, 22:30"), J1-4 (dòng 24); `heuristic-review-r0.md` HR-09, HR-21
- Vấn đề: Toàn bộ tài liệu UXR coi **23:00** là hạn khai báo lưu trú cho mọi khách. Nhưng `business-rules.md` BR-603 và decision-log (dòng 32) đã chốt giả định: **khách nước ngoài phải khai trong 12 giờ kể từ khi đến**, app hiển thị hạn **sớm hơn** giữa "giờ đến + 12 giờ" và "23:00". Ví dụ BR-603: nhận phòng 08:00 → hạn 20:00, nhận 21:30 → hạn 09:30 hôm sau. Mốc nhắc cố định 18:00/21:00/22:30 trong J3 sẽ **trễ** với khách nước ngoài nhận sáng.
- Vì sao quan trọng: Đây là rủi ro pháp lý; UXD đang thiết kế "Cần chú ý", đồng hồ đếm hạn và nhắc việc trên dashboard lễ tân (L1, L3) dựa trên persona/hành trình. Nếu tài liệu nghiên cứu ghi 23:00, QA và FE sẽ lấy sai mốc.
- Đề xuất sửa: Thay "trước 23:00" bằng "trước **hạn khai báo** (23:00 với khách VN; sớm hơn giữa giờ đến + 12 giờ và 23:00 với khách nước ngoài – BR-603)"; đổi mốc nhắc J3 thành **tương đối theo hạn** (ví dụ còn 3 giờ, còn 1 giờ, còn 15 phút) thay cho giờ cố định; cập nhật H-04 để hỏi cả khách nước ngoài đến buổi sáng/khuya.
- Trạng thái: Open

### FB-R1-UXD-UXR-05
- Mức độ: Major
- Vị trí: `heuristic-review-r0.md` HR-20 (dòng 167–171), HR-02 (dòng 107), HR-13 (dòng 155–159), HR-12 (dòng 149–153), thang mức mục 1 (dòng 20–25)
- Vấn đề: Mức nghiêm trọng áp chưa nhất quán với chính thang của UXR:
  - **HR-20** (tick "khóa phòng" không chặn bán → rack và OTA vẫn bán phòng hỏng) đúng định nghĩa Blocker của UXR ("sai tiền, vi phạm…") và của protocol ("sai nghiệp vụ nghiêm trọng") – khách nhận phòng hỏng, phải đổi/hoàn tiền – nhưng chỉ xếp **Major**, trong khi HR-06 (hủy giữ chỗ không xác nhận) lại là Blocker.
  - **HR-02**: thang ghi Blocker khi "một nhóm người dùng chính không dùng được"; HR-01 áp đúng cho khách nước ngoài, nhưng HR-02 (buồng phòng không dùng được giao diện desktop thu nhỏ, nút 26px, ô số 64px, tay ướt) lại Major. Nếu UXR giữ Major vì "26px vẫn đạt tối thiểu 24px WCAG" thì nên ghi lý do đó.
  - **HR-13** có hai mức trong một mã ("Major cho buồng phòng; Minor cho chủ đầu tư") nhưng được đếm là Major – khó theo dõi trạng thái.
  - **HR-12** (biểu đồ không có bảng thay thế) xếp Major dựa trên H-01 chưa kiểm chứng; nếu H-01 sai thì chỉ Minor.
- Vì sao quan trọng: decision-log dòng 21 đã ghi danh sách Blocker của UXR; PO dựa vào đó để viết AC (heuristic mục 6). HR-20 không thành Blocker → có thể không có AC "khóa phòng thật sự chặn tồn trên mọi kênh" ở mức Must.
- Đề xuất sửa: Nâng HR-20 lên **Blocker** (hoặc ghi lý do không nâng) và cập nhật dòng decision-log tương ứng; tách HR-13 thành HR-13a (buồng phòng, Major) và HR-13b (chủ đầu tư/bill khách, Minor); ghi rõ lý do xếp HR-02 Major; ghi chú HR-12 "Major nếu H-01 đúng". (Thông tin: phần thiết kế cho HR-20 – trạng thái "Đã khóa – ngừng bán trên mọi kênh" chỉ hiện khi server xác nhận – UXD đã đưa vào L6/L2, không phụ thuộc mức.)
- Trạng thái: Open

### FB-R1-UXD-UXR-06
- Mức độ: Minor
- Vị trí: `personas.md` H-04, H-06, H-08, H-19 (dòng 181, 183, 185, 196); `ESC-003.md` phương án A
- Vấn đề: Một số câu ESC-003 hỏi trùng với ESC khác hoặc với quyết định đã có, khiến chủ đầu tư bị hỏi hai lần:
  - H-19 (duyệt FOC trên điện thoại, hạn mức) trùng **ESC-007** (hạn mức FOC theo cấp, đã giả định duyệt bằng tài khoản/PIN).
  - H-04 (ai trực tối để khai báo) trùng **ESC-010** phần "người khai báo ca tối".
  - H-08 (CTV có tài khoản riêng) – RBAC đã có vai `collaborator` và decision-log dòng 75, 77, 92 đã giả định phạm vi thấy dữ liệu của CTV.
  - H-06 (buồng phòng hiểu mã VC/VD không) – UXD đã quyết dùng câu thường trên giao diện buồng phòng, mã chỉ ở giao diện quản lý (decision-log dòng 83, theo HR-13). Kết quả H-06 không còn làm đổi thiết kế.
- Vì sao quan trọng: Mỗi câu thừa làm tăng thời gian của chủ đầu tư và làm loãng các câu thật sự quyết định (H-05, H-12).
- Đề xuất sửa: Trong ESC-003 thay H-19, H-04 bằng "xem ESC-007 / ESC-010"; đổi H-08 thành "xác nhận giả định RBAC" (1 câu có/không); bỏ H-06 khỏi phương án A (ghi trong personas: "đã xử lý bằng thiết kế, kiểm lại khi test L6").
- Trạng thái: Open

### FB-R1-UXD-UXR-07
- Mức độ: Minor
- Vị trí: `personas.md` H-03, H-12, H-13, H-14 (dòng 180, 189–191); `ESC-003.md` "hỏi 3 khách thuê tháng"
- Vấn đề: Tiêu chí xác nhận không khớp cỡ mẫu hoặc thiếu luật quyết định:
  - H-13 tiêu chí "≥ 3/5 muốn" nhưng ESC chỉ hỏi **3** khách → tiêu chí không áp được.
  - H-12 tiêu chí chỉ ghi "Phương thức thực tế" – không nói kết quả nào thì đổi gì (ví dụ thêm tiền mặt có biên nhận, chuyển khoản qua ngân hàng VN, bỏ thẻ quốc tế khỏi ưu tiên).
  - H-03 tiêu chí "≥ 30% tin nhắn khách NN là tiếng Nga hoặc cần dịch" không rõ mẫu số và gộp hai thứ khác nhau; thêm nữa decision-log dòng 91 đã chốt mẫu tin VI/EN/RU cho MVP.
- Vì sao quan trọng: Không có luật quyết định thì kết quả kiểm chứng không chuyển được thành thay đổi thiết kế/ưu tiên cụ thể.
- Đề xuất sửa: Đổi tiêu chí theo cỡ mẫu thật (ví dụ H-13 "≥ 2/3"); thêm cột "Nếu xác nhận → làm gì / Nếu bác bỏ → làm gì" cho các giả thuyết Cao; H-03 hạ xuống TB hoặc chuyển sang đo bằng dữ liệu mẫu tin được dùng trong R2 (DATA).
- Trạng thái: Open

### FB-R1-UXD-UXR-08
- Mức độ: Minor
- Vị trí: `journeys.md` J4 08:30–09:00 (dòng 81: "gói 1–3 lần/tuần"), J1-6 cơ hội "trả chìa trên bàn" (dòng 26), P7 nhiệm vụ "để chìa trên bàn" (personas dòng 150); `personas.md` P6 (dòng 133, "USDT")
- Vấn đề: Một số chi tiết lệch brief:
  - Brief mục 5: khách thuê tháng **dọn không bắt buộc 100k/lần**; J4 lại giả định "gói dọn 1–3 lần/tuần" (đúng là điểm vênh ESC-005 đang hỏi, nhưng hành trình không ghi chú).
  - Brief mục 5: phải **trả đủ 2 thẻ phòng**, thiếu thẻ phạt 200k; express check-out "để chìa trên bàn" bỏ qua bước xác nhận trả thẻ.
  - P6 ghi khách Nga trả bằng "USDT" – tiền mã hóa không phải phương tiện thanh toán hợp pháp tại VN; ghi trong persona dễ khiến PO/INT cân nhắc nhầm.
- Vì sao quan trọng: UXD vẽ màn lịch dọn (app khách L7, L6) và express check-out theo hành trình; sai mô hình dọn hoặc thiếu bước trả thẻ sẽ sinh màn hình sai và tranh chấp phí 200k.
- Đề xuất sửa: J4 ghi "dọn theo yêu cầu 100k/lần (brief) – gói định kỳ chờ ESC-005"; express check-out thêm bước "xác nhận số thẻ trả/để lại (áp dụng khi căn dùng thẻ)"; P6 bỏ "USDT" hoặc ghi rõ "không hỗ trợ – ngoài phạm vi pháp lý".
- Trạng thái: Open

### FB-R1-UXD-UXR-09
- Mức độ: Minor
- Vị trí: `journeys.md` J1 (dòng 19–27), J2 (35–45), J4 (78–90)
- Vấn đề: Hành trình chủ yếu là đường thuận lợi; các tình huống lỗi/ngoại lệ chỉ nhắc rải rác. Thiếu các ngoại lệ UXD cần để thiết kế trạng thái lỗi/rỗng/mất mạng (DoD): khách chuyển khoản **sai số tiền hoặc thiếu nội dung** mã đơn; ảnh giấy tờ tải **thất bại** nhiều lần; khách OTA **đến mà chưa check-in online**; khách đến sau giờ mà **không nhận được mã cửa**; buồng phòng bấm "Dọn xong" khi mất mạng và lễ tân đã đổi trạng thái khác (xung đột khi đồng bộ, ADR-005); khóa cửa thông minh hết pin/không nhận mã.
- Vì sao quan trọng: Khoảnh khắc quyết định UXR nêu (tiền đã đến chưa; đứng trước cửa có vào được không) chính là lúc ngoại lệ xảy ra; thiếu kịch bản thì thông báo lỗi và đường phục hồi sẽ do dev tự nghĩ.
- Đề xuất sửa: Thêm cột hoặc mục "Ngoại lệ thường gặp" cho J1-3, J1-4, J2-3, J4 12:30–14:00 (2–3 dòng mỗi giai đoạn: chuyện gì xảy ra · người dùng cảm thấy gì · hệ thống nên làm gì). UXD sẽ dùng để kiểm lại trạng thái lỗi trong wireframe.
- Trạng thái: Open

### FB-R1-UXD-UXR-10
- Mức độ: Minor
- Vị trí: `heuristic-review-r0.md` mục 1 "Giới hạn" (dòng 14), mục 3, mục 4
- Vấn đề: Đánh giá còn ba chỗ hổng ảnh hưởng tới Design System: (1) chỉ đo tương phản **chế độ sáng**, không đo token tối (BL 6.2 có cả cột tối; decision-log dòng 79 yêu cầu cả sáng và tối); (2) không đánh giá prototype có/không có trạng thái **tải, rỗng, lỗi, mất mạng**; (3) app khách chỉ được xét về ngôn ngữ (HR-01), chưa đi qua luồng check-in online (số bước, tải ảnh, ô nhập) dù đây là luồng L7 quan trọng. Ngoài ra chưa có ảnh chụp màn hình làm bằng chứng (UXR đã ghi rõ giới hạn – tốt).
- Vì sao quan trọng: UXD dùng bản đánh giá làm checklist (mục 6); thiếu dark mode và trạng thái thì checklist không bao phủ phần DoD bắt buộc.
- Đề xuất sửa: Bổ sung bảng tương phản token tối; thêm 1 phát hiện (hoặc ghi "không có") về trạng thái tải/rỗng/lỗi/mất mạng; đi qua luồng check-in online của app khách theo P7 và ghi phát hiện. Nếu vẫn không mở được tệp, có thể dùng `product/design/wireframes/index.html` của UXD (đã có công tắc sáng/tối) để so sánh khi review UXD.
- Trạng thái: Open

### FB-R1-UXD-UXR-11
- Mức độ: Minor
- Vị trí: `personas.md` mục 0 (dòng 12–40), P2 (dòng 68)
- Vấn đề: Persona chưa nói **persona nào là chính cho từng bề mặt giao diện** khi nhu cầu xung đột (ví dụ dashboard: P1 trên điện thoại vs P2 trên laptop; app khách: P5 lớn tuổi cần chữ to vs P7 cần gọn nhẹ trên 3G). P2 chỉ ghi "laptop tại quầy" mà không có cỡ màn hình tối thiểu – trong khi room rack 14 ngày phụ thuộc trực tiếp vào chiều ngang.
- Vì sao quan trọng: Khi phải đánh đổi mật độ thông tin, UXD cần biết ưu tiên ai; cỡ màn hình quầy quyết định rack hiển thị 14 ngày hay phải cuộn.
- Đề xuất sửa: Thêm bảng "Bề mặt → persona chính / phụ" (web quầy: P2 chính, P1 phụ; điện thoại nội bộ: P3 chính cho L6, P1/P4 cho L8/L5; app khách: P7 chính về tốc độ, P5 chính về khả năng đọc). Thêm vào H-02: "độ phân giải màn hình laptop quầy" (giả định tối thiểu 1366×768).
- Trạng thái: Open

### FB-R1-UXD-UXR-12
- Mức độ: Suggestion
- Vị trí: `personas.md` P3 (dòng 80–84)
- Vấn đề: Brief ghi buồng phòng là "anh Long?" (gọi "anh" gợi ý không quá lớn tuổi), persona đặt "Chú Bảy" 45–58 tuổi, mắt kém. Thiết kế hướng người lớn tuổi (chữ ≥ 16px, nút ≥ 48px) đúng cho mọi trường hợp, nhưng một số giả định khác (không đọc tiếng Anh, sợ bấm nhầm, cần đọc giọng nói) có thể không đúng nếu người thật trẻ hơn.
- Vì sao quan trọng: Tránh đầu tư thêm (giọng nói, hướng dẫn dài) cho một nhu cầu có thể không có.
- Đề xuất sửa: Ghi một dòng "biến thể: nhân viên trẻ 25–35 dùng smartphone thành thạo – các yêu cầu nút lớn/offline vẫn giữ; giọng nói, hướng dẫn chi tiết hạ ưu tiên" và thêm câu hỏi tuổi/kinh nghiệm smartphone vào kịch bản H-05.
- Trạng thái: Open

### FB-R1-UXD-UXR-13
- Mức độ: Suggestion
- Vị trí: `journeys.md` (chỉ có J1–J4)
- Vấn đề: Plan chỉ yêu cầu 4 hành trình nên không thiếu so với giao việc, nhưng wireframe L5 (Sale/CTV báo giá → giữ chỗ → cọc → hợp đồng) và L8 (Tổng quan chủ đầu tư) chưa có hành trình làm nền; persona P1, P4 có nhiệm vụ nhưng không có thứ tự/bối cảnh từng bước.
- Vì sao quan trọng: L5 có bộ đếm giữ chỗ, chia sẻ báo giá EN/RU qua chat – nhiều điểm chạm ngoài app mà wireframe phải tính.
- Đề xuất sửa: Thêm 2 hành trình ngắn (5–6 dòng) "J5 – CTV báo giá cho khách tại chỗ xem nhà" và "J6 – Chủ đầu tư 5 phút đầu ngày" ở Round 2, để UXR dùng làm kịch bản test L5, L8.
- Trạng thái: Open

### FB-R1-UXD-UXR-14
- Mức độ: Suggestion
- Vị trí: `ESC-003.md` mục "Nếu chưa quyết thì"
- Vấn đề: ESC-012 phương án A cho phép dời app buồng phòng sang đầu Round 3 nếu Round 2 thiếu thời gian. Khi đó H-05 có thêm thời gian kiểm chứng, nhưng ESC-003 không liên hệ tới ESC-012.
- Vì sao quan trọng: Giúp chủ đầu tư thấy mối liên quan giữa hai quyết định, và đội không ép kiểm chứng gấp khi không cần.
- Đề xuất sửa: Thêm 1 câu: "Nếu ESC-012 dời app buồng phòng sang Round 3, H-05 có thể kiểm chứng trong Round 2 trên bản dùng thử".
- Trạng thái: Open

---

## Điểm làm tốt – nên giữ

1. **Persona cho ra yêu cầu thiết kế đo được** (nút ≥ 48px, chữ ≥ 16px, "Dọn xong" ≤ 2 chạm, nhận phòng đã check-in online ≤ 3 phút, mở app ≤ 30 giây) và mục 8 "yếu tố bao trùm" – UXD dùng trực tiếp làm ràng buộc cho Design System và L6. Ma trận persona × phân hệ ở mục 0.1 rất đáng giữ.
2. **Bằng chứng heuristic chính xác và truy được**: số dòng mã, mục BL, tiêu chí WCAG 2.2 cụ thể; UXD tự tính lại 6 tỷ lệ tương phản và tất cả khớp. Mục "Điểm làm tốt nên giữ" của prototype giúp tránh làm lại những thứ đã đúng.
3. **Trung thực về mức tin cậy**: mọi file ghi "Mô phỏng – cần INV kiểm chứng", có cột "mức tin cậy" cho từng persona và đánh dấu P3 là thấp nhất – đúng tinh thần protocol "không bịa dữ liệu".
