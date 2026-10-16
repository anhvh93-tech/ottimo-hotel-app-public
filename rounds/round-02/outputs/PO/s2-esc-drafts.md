# Bản nháp ESC cuối Round 2 – PO gom (Sprint 2, bước Phản hồi & sửa)

- Người gom: PO | Ngày: 16/10/2026 | Trạng thái: **bản nháp – chưa đánh số** (ORC đánh số ESC-0xx, chép vào `02-escalations/` và `escalations-index.md` khi tổng kết round).
- Nguồn: `rounds/round-02/reviews/s2-DOM.md` (D-13 b, D-15, mục C gợi ý `special_dates`), `product/docs/business-rules.md` v0.3.2 (BR-302, BR-506, BR-527, mục 16 Q-D6…Q-D8), `rounds/round-02/reviews/s2-SEC.md` (FB-R2-SEC-BE-22, BE-28), quyết định PO 16/10 về US-056 (decision-log).
- Không bản nháp nào **chặn** Sprint 3–4: mọi điểm đã có giá trị mặc định chỉnh được trong bảng tham số (US-005), không phải sửa code nếu INV chọn khác.
- Đã rà và **không** đưa lên INV: cách làm của SEC BE-22 (khoản thu do sale/CTV ghi luôn chờ đối soát) – DOM đã chốt là quy trình ngành, không đổi chính sách cọc BR-305; chỉ **báo để INV biết** trong ESC nháp 3 vì có ảnh hưởng tới thời điểm hoa hồng của CTV.

---

# ESC-[ORC đánh số] – Thêm Giỗ Tổ Hùng Vương và đêm 1/9 vào danh sách ngày lễ tăng giá
- Người tạo: PO (DOM) | Round: 2 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: Anh/chị đã chốt danh sách ngày đặc biệt tăng giá +30% (ESC-004): Tết, 30/4–1/5, 2/9, 24/12–1/1. Chuyên gia nghiệp vụ thấy còn thiếu hai dịp khách lên Đà Lạt đông: **Giỗ Tổ Hùng Vương** (10/3 âm lịch – ngày nghỉ lễ quốc gia, thường rơi giữa tháng 4 dương lịch, đổi theo năm) và **đêm 1/9** (khách lên trước Quốc khánh 2/9). Đội không tự thêm vì danh sách là chính sách giá anh/chị đã quyết. Lưu ý: ngày đặc biệt kéo theo 3 hệ quả, không chỉ giá – (1) giá +30% mọi kênh (BR-104); (2) ở tối thiểu 2 đêm khi ngày đến rơi vào dịp đó (BR-113); (3) đơn có đêm rơi vào dịp đó **không hoàn cọc khi hủy** (BR-309).
- Câu hỏi cần quyết định: Có thêm Giỗ Tổ Hùng Vương và đêm 1/9 vào danh sách ngày đặc biệt không?
- Phương án:
  - A: Thêm cả hai, áp đủ 3 hệ quả như ngày đặc biệt khác – Ưu: thu đúng giá dịp đông; nhất quán, lễ tân không phải nhớ ngoại lệ – Nhược: khách hủy dịp này không được hoàn cọc, có thể bị phàn nàn nếu khách chưa biết – Chi phí/thời gian: 0 (chỉ thêm dòng tham số, chủ đầu tư tự chỉnh được hằng năm).
  - B: Chỉ thêm Giỗ Tổ (ngày nghỉ chính thức), không thêm đêm 1/9 (đêm 1/9 đã gần 2/9; nếu 1/9 là thứ Sáu/thứ Bảy vẫn có +15% cuối tuần) – Ưu: ít thay đổi so với điều đã chốt – Nhược: có thể bán đêm 1/9 thấp hơn thị trường – Chi phí: 0.
  - C: Giữ nguyên danh sách hiện tại – Ưu: không đổi gì – Nhược: hai dịp đông bán giá thường, khách được hoàn cọc khi hủy sát ngày – Chi phí: 0.
- Đội đề xuất: **A** – cả hai dịp đều là cao điểm thật ở Đà Lạt; quy tắc giống hệt các ngày lễ khác nên lễ tân, CTV và khách dễ hiểu. Ngày cụ thể của Giỗ Tổ mỗi năm anh/chị (hoặc quản lý) nhập trong bảng tham số giống cách nhập Tết.
- Nếu chưa quyết thì: hệ thống giữ danh sách hiện tại (phương án C). Không chặn việc nào; chỉ cần quyết trước khi mở bán dịp Giỗ Tổ 2027 (tháng 4/2027).
- Hạn cần trả lời: cuối Round 3 (trước khi mở bán tháng 4/2027).
- Trạng thái: Chờ INV

---

# ESC-[ORC đánh số] – Phí dọn phòng thêm cho khách ngắn ngày
- Người tạo: PO (DOM) | Round: 2 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: Anh/chị đã chốt (ESC-005, ESC-008): khách ngắn ngày được dọn hằng ngày miễn phí; dọn lẻ theo yêu cầu **100.000 đ/lần** (BR-506). Quy tắc chưa nói rõ khách **ngắn ngày** gọi dọn thêm thì có tính 100.000 đ không. Ở R2 khách gửi yêu cầu dọn qua app khách; nếu có phí, khách phải bấm đồng ý phí trước khi gửi và tiền tự vào bill khi buồng phòng làm xong. Kèm một câu xác nhận nhỏ về khách dài hạn (cuối mục).
- Câu hỏi cần quyết định: Khách ngắn ngày yêu cầu dọn thêm thì tính phí thế nào?
- Phương án:
  - A (cách hiểu của chuyên gia nghiệp vụ): dọn **bù** khi khách đã từ chối dọn buổi sáng rồi chiều gọi = **miễn phí**; **lần dọn đầy đủ thứ hai trong cùng ngày** = 100.000 đ; thay khăn, bổ sung đồ dùng = miễn phí. Ví dụ: căn 202 từ chối dọn sáng, 15:00 gọi dọn → 0 đ; đã dọn 10:00, 20:00 gọi dọn lại toàn bộ → 100.000 đ – Ưu: công bằng với khách (không trả tiền cho dịch vụ đã có trong giá), vẫn thu khi khách làm phát sinh thêm công – Nhược: lễ tân phải phân biệt "dọn bù" và "dọn lần hai" (app tự gợi ý theo việc dọn trong ngày) – Chi phí: 0.
  - B: Mọi lần dọn khách gọi ngoài lần dọn hằng ngày đều 100.000 đ (kể cả dọn bù) – Ưu: đơn giản, thu nhiều hơn – Nhược: khách từ chối dọn sáng rồi gọi chiều bị tính tiền cho việc vốn miễn phí → dễ bị đánh giá xấu trên OTA.
  - C: Khách ngắn ngày không bao giờ tính phí dọn thêm; 100.000 đ chỉ áp cho khách dài hạn – Ưu: trải nghiệm tốt nhất – Nhược: không bù được công buồng phòng khi khách đòi dọn nhiều lần/ngày.
- Đội đề xuất: **A** – giữ đúng tinh thần "giá đêm đã gồm dọn hằng ngày", chỉ thu khi thực sự thêm một lần dọn đầy đủ; tránh phàn nàn trên OTA.
- Câu xác nhận kèm (không cần chọn phương án): hiện **có HĐ dài hạn nào đang chạy được hẹn dọn cố định hằng tuần** không (ví dụ "thứ Hai, thứ Năm, 9–11 giờ")? Đội đã quyết: R2 coi các HĐ đang chạy là "chỉ tiền thuê, dọn lẻ 100.000 đ/lần" (BR-204, anh/chị chọn ở ESC-005) và **lịch dọn tự động cho khách dài hạn làm ở đầu Round 3** cùng hợp đồng. Nếu có HĐ hẹn dọn cố định, lễ tân sẽ tạo việc dọn bằng tay hằng tuần tới R3 – anh/chị chỉ cần cho biết căn nào, ngày nào.
- Nếu chưa quyết thì: hệ thống chạy theo **A** (đang gắn nhãn giả định, đổi được bằng tham số). Không chặn việc nào.
- Hạn cần trả lời: trước khi giao bản dùng thử (cuối Round 3).
- Trạng thái: Chờ INV

---

# ESC-[ORC đánh số] – Giới hạn giữ chỗ và kiểm soát tiền cọc do sale/CTV tự ghi
- Người tạo: PO (SEC, DOM) | Round: 2 | Mức khẩn: Bình thường (gom cuối round)
- Bối cảnh: Kiểm tra bảo mật Sprint 2 phát hiện hai lỗ hổng gian lận nội bộ: (1) một CTV/sale có thể giữ chỗ **cùng lúc mọi căn** dịp cao điểm (cố ý hoặc bị lộ tài khoản) làm khách sạn không bán được; (2) sale có thể tự ghi "đã nhận tiền mặt" để xác nhận đơn mình chốt và được tính hoa hồng mà không ai kiểm. Đội đã thêm kiểm soát theo chuẩn ngành, **không đổi** chính sách cọc anh/chị đã chốt (ESC-006): mỗi CTV giữ tối đa **3** căn chờ cọc, mỗi sale tối đa **5**, lễ tân trở lên không giới hạn; mọi khoản tiền do sale/CTV ghi (kể cả tiền mặt) đều "chờ đối soát" – tiền mặt nộp quầy, lễ tân/quản lý tick khi thấy tiền; đơn vẫn được xác nhận ngay, nhưng **hoa hồng của chính người ghi** chỉ thành "đạt" sau khi đối soát; giờ nhận tiền khai lùi tối đa 24 giờ.
- Câu hỏi cần quyết định: Anh/chị có đồng ý con số 3/5 giữ chỗ và cách kiểm soát tiền do sale/CTV ghi như trên không?
- Phương án:
  - A: Đồng ý mặc định (CTV 3, sale 5; tiền do sale/CTV ghi luôn chờ đối soát, hoa hồng đạt sau đối soát) – Ưu: chặn được cả hai kiểu gian lận mà sale/CTV vẫn làm việc bình thường – Nhược: lễ tân/quản lý thêm thao tác tick đối soát; CTV nhận hoa hồng "đạt" chậm hơn vài giờ/ngày – Chi phí: 0 (đã làm trong R2).
  - B: Đồng ý cách kiểm soát nhưng đổi con số giữ chỗ (anh/chị cho số khác cho CTV/sale) – Ưu: hợp với cách làm việc thực tế của đội sale – Nhược: số lớn thì giảm tác dụng chặn – Chi phí: 0 (chỉnh trong bảng tham số).
  - C: Chặt hơn: sale/CTV **không được** ghi tiền mặt/quẹt thẻ, chỉ ghi chuyển khoản/VietQR; tiền mặt luôn do lễ tân nhận – Ưu: không còn khoản tiền mặt "trên giấy" – Nhược: khách đưa tiền mặt cho sale ngoài quầy phải chờ nộp quầy mới xác nhận được đơn; đổi quyền của sale so với hiện tại.
- Đội đề xuất: **A** – đủ an toàn, không làm chậm việc bán, và anh/chị chỉnh được con số bất cứ lúc nào trong bảng tham số.
- Nếu chưa quyết thì: hệ thống chạy theo **A**. Không chặn việc nào.
- Hạn cần trả lời: trước khi giao bản dùng thử (cuối Round 3) – khi CTV/sale thật bắt đầu dùng app.
- Trạng thái: Chờ INV
