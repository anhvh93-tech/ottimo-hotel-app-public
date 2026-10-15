# Review BA → DOM – Round 1, Bước 3

- Người review: BA | Ngày: 15/10/2026
- Phạm vi: `product/docs/business-rules.md` (BR-001 … BR-955, mục 13–17), `product/docs/baseline-issues-triage.md`
- Đối chiếu với: `state-machines.md` (SM-01…15, câu hỏi SQ-1…SQ-5 mục 16), `rbac-matrix.md` (mục 5, 9), `business-processes.md`, `use-cases.md`, backlog đợt 3, plan R1 mục 7 (A5, B2, B3), QA report mục 4, ARC report M1, M2, M3, M6, M7
- Đã kiểm lại số học toàn bộ ví dụ số của BR-005, 101, 105, 107, 108, 110, 203–214, 302–314, 411–428, 433, 501, 511, 705, 901, 903: **không có lỗi cộng trừ nhân chia**. Các thẻ dưới đây là lỗi quy tắc, lỗi mâu thuẫn và chỗ chưa đủ để code/test.

---

### FB-R1-BA-DOM-01
- Mức độ: Major
- Vị trí: `business-rules.md` BR-603 (dòng 187), mục 14 S3 và S8, mục 13 khóa `registration_deadline_foreigner_hours`
- Vấn đề: Quy tắc và ví dụ của BR-603 trái nhau, và quy tắc có chỗ trống.
  (1) Quy tắc: hạn = **sớm hơn** giữa "giờ nhận + 12 giờ" và "23:00 ngày đến". Ví dụ thứ hai "nhận 21:30 → hạn **09:30 hôm sau**" là kết quả của chế độ chỉ +12 giờ; theo quy tắc phải là 23:00 cùng ngày (ARC M1, QA report #4, TC-L3-046 đang phải ghi "mâu thuẫn").
  (2) Không định nghĩa trường hợp khách NN đến **sau 23:00**. Khi đó "23:00 ngày đến" đã qua nên hạn rơi vào quá khứ. BR-602 có nhánh "sau 23:00 → 08:00 hôm sau" cho khách VN, BR-603 thì không.
  (3) "Ngày đến" chưa rõ là ngày đến của đơn hay ngày lịch lúc khách thực tế tới. S3 (khách đến 01:30, hạn 13:30) chỉ đúng nếu hiểu là ngày lịch thực tế; nếu là ngày đến của đơn (theo BR-003, đêm thuộc hôm trước) thì hạn đã quá từ 23:00 hôm trước.
  (4) S8 "nhắc trước 2 giờ" không có tham số.
- Vì sao quan trọng: Đây là hạn pháp lý (BR-603 có nhãn PHÁP LÝ). Ví dụ của BR là "test vàng" của QA (`br-examples.json`) và của BE (coding-standards). Theo ví dụ thì hạn bị tính **muộn hơn** mức an toàn mà đội đã chốt trong decision-log, nên OTTIMO có rủi ro bị phạt.
- Đề xuất sửa: Viết lại BR-603 thành bảng 3 dòng theo chế độ `registration_deadline_foreigner_mode` (ARC đã cài): `earlier_of` (mặc định), `hours_only`, và nhánh "đến sau mốc 23:00" (đề xuất: hạn = giờ đến + 12 giờ, không áp mốc 23:00). Định nghĩa "giờ đến" là thời điểm nhận phòng thực tế (B9), không dùng ngày đến của đơn. Sửa ví dụ 21:30 → 23:00 (chế độ `earlier_of`) và thêm ví dụ 23:40 → 11:40 hôm sau. Sửa S3 theo nhánh mới. Thêm khóa `registration_reminder_before_minutes` cho S8.
- Trạng thái: Open

### FB-R1-BA-DOM-02
- Mức độ: Major
- Vị trí: BR-432 (dòng 150, cột ví dụ), BR-433 (dòng 151), BR-704 (dòng 207); `state-machines.md` mục 16 SQ-3; `rbac-matrix.md` mục 5.2 và ghi chú 24
- Vấn đề: (1) Ví dụ của BR-432 viết "Lễ tân Hạnh **chọn 'người duyệt: anh Hoàng Anh'** → app gửi yêu cầu tới tài khoản anh Hoàng Anh". Đây chính là lỗi BL 8.2 #24 mà BR-432 muốn sửa. Nó trái US-007 AC1 ("form **không** có ô chọn tên người duyệt") và rbac 5.2 quy tắc 1. (2) BR-433 cho "Lễ tân: chỉ FOC minibar ≤ 100.000/lần", BR-704 cho "lễ tân FOC được ≤ 100.000/lần". Cả hai trái câu "người thao tác không tự duyệt cho mình, trừ quản lý và chủ đầu tư" ở BR-432. BA đã hỏi ở SQ-3 nhưng chưa có trả lời, nên SM-10 A2 và rbac ghi chú 24 vẫn ghi "chờ DOM".
- Vì sao quan trọng: Đây là cơ chế chống thất thoát (S10, BR-435). Dev đọc ví dụ BR-432 có thể làm lại ô chọn người duyệt. QA đang để TC-NT-032 ở mức Thấp với kết quả "ghi kết quả thực tế". ESC-007 cũng đang đưa câu chưa rõ này cho INV chọn.
- Đề xuất sửa: (1) Sửa ví dụ BR-432: "Lễ tân Hạnh gửi FOC kèm lý do → yêu cầu đến **mọi** tài khoản có quyền duyệt trong hạn mức (lễ tân trưởng, quản lý); anh Hoàng Anh mở và xác nhận bằng PIN của mình; folio để 'chờ duyệt' tới khi đó". (2) Trả lời SQ-3 bằng một câu trong BR-432, ví dụ: "Ngoại lệ hẹp: FOC **minibar** ≤ hạn mức vai lễ tân được tự áp, không cần người duyệt, vẫn ghi nhật ký và tính vào BR-435". Hoặc bỏ dòng "Lễ tân" khỏi BR-433/BR-704 nếu DOM muốn mọi FOC phải có người duyệt.
- Trạng thái: Open

### FB-R1-BA-DOM-03
- Mức độ: Major
- Vị trí: BR-804 (dòng 220, ví dụ "khóa 15–17/10 → 3 đêm không bán"); BR-002; mục 13 (không có khóa); QA report #1 (P1), TC-L2-032
- Vấn đề: BR-002 quy định khoảng ngày của đơn là nửa mở [đến, đi). Ví dụ của BR-804 lại coi khoảng khối OOO là **bao gồm** ngày cuối (15, 16, 17 = 3 đêm). BL 4.4 dùng nửa mở: 401 khóa đêm 15 và 16, và đơn OTM-0154 bán từ 17/10. BR-804 không nói khối OOO dùng quy ước nào, `endDatePlanned` trong ERD/OpenAPI cũng không.
- Vì sao quan trọng: Mỗi lần khóa phòng sẽ hoặc **trùng 1 đêm** với khách đến ngày cuối (đặt trùng, lỗi tệ nhất), hoặc **mất bán 1 đêm** và đêm khả dụng bị trừ thừa (BR-904, ví dụ 307 đêm). Quy ước này cũng quyết định cách tính chỉ số của DATA.
- Đề xuất sửa: Thêm vào BR-804: "Khối OOO dùng cùng quy ước với đơn: [ngày bắt đầu, ngày mở bán lại). Ngày mở bán lại là ngày đầu tiên được bán." Sửa ví dụ thành "khóa từ 15/10, mở bán lại 18/10 → 3 đêm 15, 16, 17" (hoặc "mở bán 17/10 → 2 đêm" cho khớp BL 4.4), và ghi rõ BL 4.4 đọc thế nào. Báo ARC đổi tên trường để không ai hiểu nhầm (`endDatePlanned` → `reopenDatePlanned`).
- Trạng thái: Open

### FB-R1-BA-DOM-04
- Mức độ: Major
- Vị trí: BR-803 (dòng 219) và BR-402 (dòng 125) mục (1); SM-01 B9, SM-03 R7; rbac A12
- Vấn đề: BR-803 nói căn VD/CL "**không nhận phòng được** đến khi VC/VI" (tuyệt đối). BR-402 (1) lại cho lễ tân trưởng trở lên nhận tiếp khi buồng không phải VI/VC, có ghi lý do. BA đã đặc tả theo BR-402 (SM-03 R7: VD → OD khi nhận phòng ngoại lệ; A12). Backlog US-025 AC2 và QA TC-L3-002 cũng theo BR-402. Ngược lại, TC-L2-068 lại chặn cứng đổi phòng sang căn VD theo BR-803.
- Vì sao quan trọng: Hai quy tắc của cùng một nguồn sự thật mâu thuẫn ở điểm nhận phòng, là thao tác có khách đứng chờ ở quầy. Hệ quả là dev sẽ cài một bên và QA sẽ fail bên còn lại.
- Đề xuất sửa: BR-803 thêm "… trừ ngoại lệ BR-402 (1) do lễ tân trưởng trở lên xác nhận có lý do; căn CL/VD khi đó chuyển OD và có việc dọn ưu tiên". Nói rõ đổi phòng (BR-424) có được dùng cùng ngoại lệ này không. BA đề xuất **không**, vì khách đang ở đã có phòng.
- Trạng thái: Open

### FB-R1-BA-DOM-05
- Mức độ: Major
- Vị trí: BR-427 (dòng 140); BR-426; BR-008; SM-13 (`settled` → `closed`); SM-01 B18 (GST); ARC M4
- Vấn đề: BR-427 (trả phòng không có người ở quầy) mới mô tả hành vi, chưa đủ điều kiện để code:
  (1) Không nói điều kiện bấm "Trả phòng". BA đã giả định "chỉ khi còn phải thu = 0" (B18, rbac ghi chú 22) nhưng BR không xác nhận.
  (2) "Minibar kiểm sau, phát sinh gửi link trong 24 giờ" nghĩa là ghi tiền **sau** khi folio đã khóa (`settled`, US-038). BR-008/BR-426 không nói khoản này là bút toán điều chỉnh, folio phụ hay mở lại folio, và ai được ghi. SM-13 đang tạm cho FD+ ghi trong thời hạn.
  (3) Không nói khách không trả khoản phát sinh thì xử lý thế nào: công nợ BR-525? FOC?
  (4) Số "24 giờ" không có khóa ở mục 13.
  (5) Không nói hóa đơn điện tử (BR-524) xuất lúc khách bấm hay sau khi đóng phần phát sinh.
- Vì sao quan trọng: Đây là luồng tiền **sau** khi bill đã khóa, nên dễ sai tiền và dễ lệch hóa đơn MISA. Nó cũng quyết định link app khách sống bao lâu (thẻ PO-05).
- Đề xuất sửa: Tách BR-427 thành các ý: điều kiện (còn phải thu = 0 tại thời điểm bấm); phát sinh sau trả phòng ghi thành **dòng phát sinh sau trả phòng** trên folio `settled` (không sửa dòng cũ) do FD+ ghi trong `post_checkout_charge_hours`; quá hạn mà chưa thu → tự chuyển công nợ (BR-525) báo quản lý; hóa đơn điện tử xuất khi folio `closed`. Thêm khóa `post_checkout_charge_hours` = 24.
- Trạng thái: Open

### FB-R1-BA-DOM-06
- Mức độ: Major
- Vị trí: BR-609 (dòng 193); BR-610; SEC T01 ("trong 24 giờ"); backlog US-045 AC2, US-049 AC2 ("xóa ngay"); ARC M3; QA report #5, TC-L3-039
- Vấn đề: BR-609 chỉ nói khách không đồng ý thì "dùng để khai báo rồi không lưu ảnh". BR không nói **khi nào** xóa, nên ba tài liệu ghi ba mốc khác nhau: ngay khi khai báo `confirmed` (PO), trong 24 giờ (SEC), job 03:00 (ARC, lưới an toàn). BR-609 cũng không có trường hợp ảnh của đơn bị hủy hoặc no-show **trước** khi khai (SM-05 K11 `void`). Hiện BA đang tạm dẫn "SEC mục 7".
- Vì sao quan trọng: BR là nguồn sự thật cho thời hạn lưu dữ liệu C3 (Nghị định 13/2023). QA đang phải chọn mốc 24 giờ, khác AC của PO.
- Đề xuất sửa: Bổ sung BR-609: "(a) Không đồng ý: xóa ảnh ngay khi khai báo chuyển `confirmed`, chậm nhất `id_image_purge_max_hours` (mặc định 24) – giá trị trên là giới hạn của SEC T01. (b) Đơn `cancelled`/`no_show` trước khi khai (K11): xóa ảnh trong cùng giới hạn. (c) Khách rút đồng ý (US-133): như (a)." Thêm khóa vào mục 13 và báo SEC xác nhận câu chữ.
- Trạng thái: Open

### FB-R1-BA-DOM-07
- Mức độ: Major
- Vị trí: BR-309 (dòng 111: "hủy ≥ 7 ngày trước ngày đến…"), BR-428 (dòng 141: "báo trước ≥ 24 giờ"), BR-313/314 ("báo trước ≥ 30 ngày"); QA TC-L2-053, TC-L4-025
- Vấn đề: Các mốc tính tiền hoàn không có điểm neo. (1) BR-309: "7 ngày trước ngày đến" là đếm ngày lịch (15/10 → 22/10 là 7 ngày?) hay 7 × 24 giờ trước 14:00 ngày đến? Biên 3 ngày và 6 ngày cũng vậy. (2) BR-428: "báo trước ≥ 24 giờ" tính tới thời điểm nào: 12:00 của ngày đi mới, 12:00 của ngày đi cũ, hay đêm đầu bị bỏ? Ví dụ "báo trước 1 ngày" không chỉ ra được. (3) BR-313/314: 30 ngày tính tới ngày trả phòng thực tế hay ngày kết thúc HĐ?
- Vì sao quan trọng: Mỗi biên sai một ngày là sai 50–100% số tiền hoàn. QA đang phải tự giả định (TC-L2-053 "cách hôm nay 3 ngày" → hoàn 50%). Khách tranh chấp thì OTTIMO không có quy tắc rõ để dẫn.
- Đề xuất sửa: Thêm vào BR-001 một quy ước chung: "Số ngày báo trước = số ngày lịch giữa ngày nghiệp vụ lúc báo (giờ VN) và ngày mốc; ngày mốc của hủy là ngày đến; của trả sớm là ngày khách rời đi mới; của chấm dứt HĐ là ngày trả phòng khách báo". Sửa BR-428 sang "≥ 1 ngày lịch" (hoặc giữ 24 giờ nhưng nêu mốc là 12:00 ngày rời đi mới). Mỗi BR thêm 1 ví dụ đúng biên.
- Trạng thái: Open

### FB-R1-BA-DOM-08
- Mức độ: Major
- Vị trí: `business-rules.md` mục 13 (bảng tham số); mục 0.2.1 ("mọi con số là tham số")
- Vấn đề: Nhiều con số trong BR chưa có khóa ở mục 13 (ARC M2 đã nêu một phần). Danh sách BA rà được:
  - BR-427: 24 giờ phát sinh.
  - BR-611: nhắc 22:00 và 07:00.
  - BR-423: hạn thu gia hạn 14:00.
  - BR-802: bật/tắt buồng phòng tự kiểm (QA đã đặt tên tạm `hk_self_inspection_enabled`).
  - BR-806: mốc đối chiếu 07:00.
  - BR-810: cảnh báo bảo trì 7 ngày.
  - BR-706: cảnh báo hạn sử dụng 7 ngày.
  - BR-807: khung dọn dài hạn 9:00–11:00.
  - BR-503: ngưỡng 300 kWh / 10 m³ khi chưa có lịch sử.
  - BR-309: "dời ngày 1 lần trong 3 tháng" và "ngày cao điểm không hoàn".
  - BR-513: báo khách trong 24 giờ.
  - BR-214: hạn kiểm phòng có ảnh.
  - S8: nhắc trước 2 giờ.
  - Ngưỡng tuổi bảo vệ dữ liệu trẻ em (rbac mục 9).
  Ngoài ra `late_grace_until` (BR-412) chỉ là một mốc giờ, trong khi phương án khuyến nghị Q7/ESC-007 A có **điều kiện** "chỉ khi căn không có khách đến cùng ngày". Tham số hiện tại không biểu diễn được điều kiện này.
- Vì sao quan trọng: ARC dựng bảng cấu hình **từ chính mục 13** và đã phải tự thêm 11 khóa hệ thống. Thiếu khóa thì dev sẽ viết cứng số, đi ngược quyết định "đổi chính sách không sửa code". Nếu INV chọn ESC-007 A thì không có cách cấu hình.
- Đề xuất sửa: Bổ sung các khóa trên vào mục 13 (đối chiếu erd 9.3 của ARC để dùng chung tên). Thêm `late_grace_requires_no_same_day_arrival` (true/false). Thêm một dòng ở mục 0.2: "Con số nào không có khóa ở mục 13 thì không được dùng trong code".
- Trạng thái: Open

### FB-R1-BA-DOM-09
- Mức độ: Major
- Vị trí: `state-machines.md` mục 16 (SQ-1, SQ-2, SQ-4); `rbac-matrix.md` mục 9; BR-311, BR-612, BR-001/BR-003
- Vấn đề: Các câu BA gửi DOM ở đợt 2 chưa được trả lời trong BR (DOM chỉ chạy đợt 1):
  - SQ-1: có cho "Khôi phục no-show" (SM-01 B12) không, và người trực đêm vai FD làm gì? BR-311 không nhắc. Trong khi đó US-136 AC4 (Must R2) và TC-L2-074 đã dựa vào B12.
  - SQ-2: hạn BR-809 có dừng khi phiếu `waiting_parts` không?
  - SQ-4: gộp chi hoa hồng theo tháng (SM-11 `payable`)?
  - rbac mục 9: đề nghị thêm tham số ngưỡng tuổi bảo vệ dữ liệu vào BR-612.
  Ngoài ra BR chưa định nghĩa **ngày nghiệp vụ** (business date), tức mốc cắt ngày. B12 ("trong ngày nghiệp vụ của đêm đến"), phạm vi "T" của rbac và BR-404 (danh sách hôm nay lúc 00:30) đều cần khái niệm này. QA đang tự giả định 01:30 vẫn thuộc ngày hôm trước (TC-L2-074), còn TC-L8-010 lại cắt ngày lúc 00:00.
- Vì sao quan trọng: Một chuyển trạng thái Must R2 (B12) đang không có căn cứ nghiệp vụ, vi phạm nguyên tắc "BA không tự đặt quy tắc". Hai TC của QA cắt ngày khác nhau sẽ dẫn tới dev cài một kiểu và QA fail kiểu còn lại.
- Đề xuất sửa: Thêm BR-311b "Khôi phục no-show" (ai, điều kiện, hạn). Thêm vào BR-809 câu trả lời SQ-2 và vào BR-212/BR-903 câu trả lời SQ-4. Thêm tham số `minor_data_age_threshold` vào BR-612. Thêm BR-010 "Ngày nghiệp vụ": ngày đổi lúc `business_day_cutoff` (đề xuất 06:00, khớp BR-003); áp cho danh sách hôm nay, B12, phạm vi T. Các mốc hạn pháp lý (BR-602/603) vẫn theo giờ đồng hồ.
- Trạng thái: Open

### FB-R1-BA-DOM-10
- Mức độ: Minor
- Vị trí: BR-607 (dòng 191)
- Vấn đề: BR-607 mô tả trạng thái khai báo như một chuỗi thẳng `none → partial → review → scanned → sent → confirmed` (+ `pre`, `needs_update → updated`). Nó thiếu `void` (đơn hủy hoặc no-show trước khi khai), các nhánh `sent → scanned` (cổng từ chối), `review → partial` (bỏ một người) và `pre → review`. SM-05 của BA và ERD đã có đủ (QA report #10).
- Vì sao quan trọng: BR-607 được ghi là nguồn tên trạng thái. Nếu thiếu `void` thì người đọc BR sẽ nghĩ đơn hủy vẫn còn trong danh sách cần khai, đúng lỗi BL 8.2 #7 theo hướng ngược lại.
- Đề xuất sửa: Thêm `void` vào danh sách tên, và một câu "luồng chuyển chi tiết theo `state-machines.md` SM-05 (K1–K11)" để không phải chép sơ đồ.
- Trạng thái: Open

### FB-R1-BA-DOM-11
- Mức độ: Minor
- Vị trí: BR-007 (dòng 52)
- Vấn đề: BR-007 nói mã "liên tục theo cơ sở", nhưng ví dụ bill `F-261015-0001` đánh lại số **mỗi ngày**, và mã khách `KH-0018` ARC đặt **theo tổ chức** (dùng chung các cơ sở). ARC M6 đang hỏi lại. QA đã viết TC-NT-022 theo cách hiểu đánh lại theo ngày.
- Vì sao quan trọng: Định dạng mã chứng từ ảnh hưởng đối soát kế toán và hóa đơn. Đổi sau khi có dữ liệu thật thì rất tốn công.
- Đề xuất sửa: Ghi rõ phạm vi và chu kỳ đánh số cho từng loại: đơn, báo giá, phiếu sửa, thu tiền (liên tục theo cơ sở); bill (liên tục trong ngày theo cơ sở); khách (liên tục theo tổ chức). Nhờ kế toán xác nhận yêu cầu số bill nếu MISA cần.
- Trạng thái: Open

### FB-R1-BA-DOM-12
- Mức độ: Minor
- Vị trí: BR-110 (dòng 71, "Lầu 1–2 tối đa 3, Căn N/N+ tối đa 4"), khóa `max_occupancy.<group>`; backlog US-004 AC3 ("mỗi căn có sức chứa"); ESC-004 (hỏi sức chứa **từng căn**); ARC M7
- Vấn đề: BR đặt sức chứa theo **nhóm căn**, còn story và ESC hỏi theo **từng căn**. ERD đang hỗ trợ cả hai (căn ghi đè nhóm), nhưng BR chưa nói thứ tự ưu tiên.
- Vì sao quan trọng: INV sẽ trả lời theo từng căn (ESC-004). Nếu BR không nói căn ghi đè nhóm thì dữ liệu INV gửi không khớp tham số nào.
- Đề xuất sửa: BR-110 thêm "Sức chứa từng căn (nếu có) ghi đè sức chứa nhóm". Thêm khóa `room.<no>.max_occupancy`.
- Trạng thái: Open

### FB-R1-BA-DOM-13
- Mức độ: Minor
- Vị trí: BR-805 (dòng 221), BR-811 (dòng 227)
- Vấn đề: (1) BR-805 viết "Căn **VC/VI** quá 3 ngày → tự về VC". VC về VC là vô nghĩa. Ý đúng có lẽ là "VI → VC; VC giữ nguyên nhưng đánh dấu cần kiểm lại" (SM-03 R5 đang chỉ có VI → VC). (2) "Quá 3 ngày" chưa rõ biên đúng 72 giờ có tính là quá không; QA chọn **có** (TC-L6-029). (3) BR-811 "giờ trực 07:00–22:00" chưa rõ 22:00 thuộc trong hay ngoài giờ trực; QA chọn **ngoài** (TC-L7-035).
- Vì sao quan trọng: Đây là các biên mà QA phải tự đoán. Đoán khác dev thì sẽ sinh bug giả.
- Đề xuất sửa: Sửa BR-805 thành "VI quá `vacant_reinspect_days` ngày → VC (cần kiểm lại); tính từ thời điểm kiểm đạt, đủ 72 giờ là quá". BR-811 ghi "[07:00, 22:00)".
- Trạng thái: Open

### FB-R1-BA-DOM-14
- Mức độ: Minor
- Vị trí: BR-303 (dòng 105), BR-411, BR-412, BR-416
- Vấn đề: (1) BR-303 cho gia hạn giữ chỗ "+24 giờ" nhưng không nói vẫn bị trần 12:00 ngày đến của BR-302. BA (SM-01 B3) và QA (TC-L5-029) đều giả định là có. (2) Bậc "trước 06:00 → 100%" (BR-411) và "sau 18:00 → 100%" (BR-412) thực tế **không bao giờ** được ghi thành phụ thu, vì BR-003 và BR-416 chuyển các trường hợp này thành đổi ngày đến hoặc gia hạn 1 đêm. BR vẫn để chúng như một bậc phụ thu.
- Vì sao quan trọng: Dev đọc bảng bậc ở mục 13 sẽ cài 100% thành dòng phụ thu. Khi đó đêm đó không bị khóa trên kênh và không tính công suất, đúng điều BR-416 muốn tránh.
- Đề xuất sửa: BR-303 thêm "không vượt trần BR-302". Ở BR-411/412 (và khóa `early_checkin_tiers`, `late_checkout_tiers`), đổi bậc 100% thành "→ xử lý như đổi ngày đến (BR-003) / gia hạn 1 đêm (BR-416), không ghi phụ thu".
- Trạng thái: Open

### FB-R1-BA-DOM-15
- Mức độ: Minor
- Vị trí: BR-107 (dòng 68, ví dụ "791.667 × 0,9")
- Vấn đề: Ví dụ BR-107 lấy giảm giá trên giá **chưa làm tròn** (9.500.000 ÷ 12 = 791.667). BR-101 lại quy định giá đêm niêm yết đã làm tròn 1.000, tức 792.000 (bảng DS-E của QA cũng dùng 792.000). Với căn 202 kết quả hai cách trùng nhau, nhưng với căn khác thì có thể lệch 1.000 đ/đêm.
- Vì sao quan trọng: Ví dụ của BR là oracle của test; phải chỉ đúng **cơ sở tính**.
- Đề xuất sửa: Sửa ví dụ thành "792.000 × 0,9 = 712.800 → 713.000" và ghi câu "giảm theo đêm áp trên giá đêm đã làm tròn theo BR-101".
- Trạng thái: Open

### FB-R1-BA-DOM-16
- Mức độ: Minor
- Vị trí: `baseline-issues-triage.md` cột "Round": #6 (R2), #14 (R2), #16 (R2–R3), #21 (R2); X-08
- Vấn đề: Cột Round trong triage lệch với backlog đã chốt ở đợt 3. #6 quyết toán dài hạn ghi R2, nhưng US-041 là Must **R3**. #21 công tơ ghi R2, nhưng US-064 là Must R3. #14 ghi R2, nhưng US-078 là Could R3. #16 gộp hồ sơ ghi R2–R3, nhưng US-074 là Should R3. X-08 (cảnh báo nợ dài hạn) ghi BE xử lý mà không ghi round, trong khi US-088 là R3.
- Vì sao quan trọng: QC dùng triage để chấm A5. Nếu đọc triage thì QC sẽ kỳ vọng các lỗi này được sửa ở R2.
- Đề xuất sửa: Cập nhật cột Round theo backlog đợt 3, hoặc thêm câu "Round theo backlog là chuẩn".
- Trạng thái: Open

### FB-R1-BA-DOM-17
- Mức độ: Suggestion
- Vị trí: `baseline-issues-triage.md` mục 2 (bảng phân loại)
- Vấn đề: Bảng có cột BR nhưng không có cột **story**. Muốn biết lỗi #2 được sửa bằng US-026 hay #7 bằng US-011 thì phải dò backlog hoặc ma trận của QA (traceability mục 4).
- Vì sao quan trọng: A5 yêu cầu "mọi lỗi Sửa có BR **hoặc story** liên kết". Thêm story sẽ giúp PO, BA, QC kiểm một chỗ.
- Đề xuất sửa: Thêm cột "Story (US-xxx)", lấy từ cột "Nguồn" của backlog. Script của QA có thể sinh tự động.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)
1. **Ví dụ số đầy đủ và đúng số học.** BA tính lại hơn 40 ví dụ (cọc, ký quỹ, thu khi chốt 56.339.000, hoa hồng Daniel 12.421.080, quyết toán 21.450.000, phụ thu dài hạn 111.000) và không thấy sai phép tính nào. Chính cột ví dụ này cho phép PO viết "khớp ví dụ BR-xxx" và QA dựng oracle.
2. **Nhãn NGÀNH / GIẢ ĐỊNH / PHÁP LÝ trên từng quy tắc.** Nhờ nhãn này mà biết ngay việc nào đội tự chốt và việc nào phải lên ESC. Phần đề xuất phương án (mục 16) có khuyến nghị rõ, đủ để PO gom thành ESC-004…008 mà không phải viết lại.
3. **Phát hiện nghiệp vụ có giá trị cao.** Hạn khai báo khách nước ngoài 12 giờ (X-01), ngưỡng chuyển dài hạn (khách 20 đêm trả 13,46 tr so với 9,8 tr/tháng), tách hai loại giá đêm (BR-102) để sửa lỗi phụ thu dài hạn 3,3 tr, và OOO là khối chặn tồn phòng chứ không phải đơn. Bốn điểm này BA đều đã dựng vào SM-01, SM-02 mà không phải đổi.
