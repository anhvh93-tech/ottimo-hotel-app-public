# Báo cáo PO – Round 1 · Bước 2 (Sản xuất) · Đợt 1
- Ngày: 15/10/2026 | Vai: PO

> Ghi chú ORC: PO không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung PO gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Viết PRD MVP nháp `product/docs/PRD.md`:
  - Bối cảnh rút từ BL mục 7–8; tầm nhìn và 6 nguyên tắc sản phẩm.
  - 5 mục tiêu kinh doanh: công suất ≥ 80%, 4–6 căn dài hạn, kênh trực tiếp ≥ 35%, GOP ≥ 60%, khai báo đúng hạn.
  - 12 chỉ số thành công có số đích.
  - 5 nhóm người dùng, kèm định hướng "không được thấy" để BA làm RBAC.
  - 16 phân hệ M0–M15, bảng MVP R2/R3/sau MVP, 11 hạng mục ngoài phạm vi.
  - Luồng khách và luồng nhân viên, yêu cầu phi chức năng, 12 giả định.
- Viết backlog `03-backlog/backlog.md`: 19 epic, 132 story (71 Must R2, 14 Must R3, 33 Should, 11 Could, 3 R4+). Có MoSCoW, round, nguồn BL.
- Viết tiêu chí Given/When/Then cho 71/71 story Must R2, mỗi story ít nhất 2 tiêu chí.
- Gắn các lỗi BL 8.2 vào story:
  - #1 → US-027; #2 → US-026; #3 → US-044; #5 → US-019/061; #7 → US-011
  - #8/#29 → US-010; #9 → US-047; #18 → US-023; #19 → US-083/085
  - #24 → US-007; #27 → US-003/048/087; #30 → US-018

## 2. File tạo/sửa
- `product/docs/PRD.md` (tạo mới)
- `03-backlog/backlog.md` (sửa)
- `rounds/round-01/outputs/PO/report.md` (tạo mới)

## 3. Giả định
1. Đích kênh trực tiếp ≥ 35% doanh thu phòng; GOP ≥ 60%; đích S1–S12 là do đội đề xuất.
2. Không có vai F&B/kế toán riêng. Quản lý thuộc nhóm chủ đầu tư (U1). Lễ tân trưởng là lễ tân có thêm quyền duyệt FOC trong hạn mức (hạn mức chờ ESC).
3. Booking engine công khai chỉ là Should R3 (US-131). Khách tìm phòng qua OTA và Zalo/CTV.
4. Khóa cửa: trong MVP lễ tân nhập mã tay (US-128); tích hợp API để R4+.
5. R2 chỉ ghi nhận thanh toán + VietQR. VNPay/MoMo, MISA, Zalo ZNS, channel manager thật làm ở R3.
6. App khách: VI/EN ở R2, tiếng Nga ở R3. Mẫu tin nhắn và văn bản báo giá có tiếng Nga ngay từ R2.
7. Lễ tân dùng máy tính, buồng phòng/sale dùng điện thoại; không yêu cầu chạy offline hoàn toàn.
8. P&L ở R3: nhập chi phí trong app, chưa tính thuê nhà/khấu hao.
9. Quyết định phạm vi thuộc quyền PO: ranh giới MVP theo PRD mục 5.2–5.3; ca/chấm công và ký số hợp đồng nằm ngoài MVP (BL 9 #13, #17); cảnh báo lệch mục tiêu là Could R4+ (BL 9 #25).

## 4. Rủi ro / vướng mắc
- **R2 nặng:** 71 story Must R2. Đã ghi thứ tự ưu tiên khi thiếu thời gian (PRD D6, backlog mục 1). Cần ARC/ORC ước lượng năng lực; có thể dời một phần EP07/EP14 sang R3.
- **Con số trong tiêu chí chưa phải mã BR:** nếu DOM đổi công thức thì phải sửa tiêu chí (ví dụ US-081 AC1, US-027). Nếu không thay kịp sẽ có rủi ro trượt tiêu chí QC B3.
- **Phụ thuộc BA:** US-002/003/020/048/080/087 cần `rbac-matrix.md`; US-020/053/061 cần `state-machines.md`.
- **Chính sách chưa chốt:** US-021 (hủy/hoàn cọc), US-085 (giữ chỗ hết hạn), US-028 (giá gia hạn), US-007 (hạn mức FOC), US-049 (thời hạn lưu ảnh) đều đã gắn "chờ ESC".
- **Story mới không có trong BL:** US-024, US-124, US-127, US-132. Nhờ DOM xác nhận khi review.

## 5. Việc chưa xong
- Đợt 3: thay con số bằng mã BR-xxx; bổ sung tiêu chí theo `use-cases.md` của BA; viết tiêu chí cho Must R3 nếu kịp.
- Cùng DOM gom 26 câu hỏi BL mục 9 thành ESC (dự kiến ≤ 9) hoặc ghi decision-log.
- Bước 3: review UXR, UXD, QA, DATA.
- Cùng ORC lập `plan.md` Round 2.

---

# Báo cáo PO – Round 1 · Bước 2 (Sản xuất) · Đợt 3
- Ngày: 15/10/2026 | Vai: PO

## 1. Đã làm gì
- **Backlog (việc A)** – `03-backlog/backlog.md`:
  - Viết lại toàn bộ tiêu chí nghiệm thu: không còn con số quy tắc, chỉ tham chiếu mã BR ("khớp ví dụ BR-xxx" để QA kiểm được). Dùng tên trạng thái của `state-machines.md` (SM-01…SM-15, mã chuyển B/K/R/O/W) và mã vai của `rbac-matrix.md` (owner … guest, hành động A-xx, trường Dxx).
  - Gắn mã vai vào cả 132 câu story cũ; thêm 7 story mới: US-133, US-134 (UC-30 – yêu cầu của chủ thể dữ liệu, Must R3), US-135 (xác nhận hành động không đảo ngược – HR-06, Must R2), US-136 (no-show + khôi phục – Must R2), US-137 (trả sớm – Should R2), US-138 (trả phòng nhanh qua app – Should R3), US-139 (xung đột đơn OTA – Must R3). Nâng US-024 lên Must R2. Tổng: **139 story, 74 Must R2** (mỗi story có ≥ 2 AC), 17 Must R3.
  - Sửa 2 AC mâu thuẫn quyết định SEC/BA: US-045, US-107 – đồng ý lưu ảnh **không** còn là điều kiện khai báo/hoàn tất check-in.
  - Blocker UXR: HR-01 → US-112, US-107 AC5; HR-04 → US-026; HR-06 → US-135, US-021; HR-07 → US-044 (3 trạng thái Đạt / Không đạt / Chưa kiểm được).
  - Rà 4 story "Mới" với BR: US-024, US-124, US-127, US-132 đều không mâu thuẫn BR (bảng ở backlog mục 5.3).
  - Thêm truy vết HR → story, UC → story, ESC → story (backlog mục 5).
- **PRD** – thêm mã vai, bỏ con số quy tắc (hạn khai báo, giờ chuẩn → mã BR), bổ sung phân hệ (no-show, trả sớm, xác nhận hành động, yêu cầu chủ thể dữ liệu, xung đột OTA, trả phòng nhanh), gắn ESC-001…012 vào mục 8 và mục 10.
- **Câu hỏi mở (việc B)** – 26/26 câu BL mục 9 + 15 câu mới có kết cục (`product/docs/open-questions-resolution.md`):
  - Tạo 9 ESC mới (004–012), đúng định dạng protocol, đều mức Bình thường.
  - Bổ sung ESC-001 (4 câu cho luật sư: hạn khai báo khách nước ngoài, ngưỡng tuổi trẻ em, lưu thông tin khai báo dạng chữ, hạn trả lời yêu cầu dữ liệu).
  - Bổ sung ESC-002: câu phụ duyệt chi phí hosting theo số của OPS (H-A ~350–390k, H-B ~425–535k – đề xuất, H-C ~720–940k đ/tháng) + tên miền, kèm đối chiếu ADR-010 (0,45–0,9 tr). Theo chỉ đạo ORC, dùng số OPS thay cho số ADR-010.
  - Gộp câu logo của UXD vào ESC-012. Cập nhật `escalations-index.md` (12 ESC).

## 2. File tạo/sửa
- `03-backlog/backlog.md` (sửa lớn: mục 1–3, viết lại mục 4–7)
- `product/docs/PRD.md` (sửa)
- `product/docs/open-questions-resolution.md` (tạo mới)
- `02-escalations/ESC-004.md` … `ESC-012.md` (tạo mới, 9 file)
- `02-escalations/ESC-001.md` (bổ sung câu luật sư), `ESC-002.md` (bổ sung hosting + tên miền)
- `02-escalations/escalations-index.md` (sửa)
- `rounds/round-01/outputs/PO/report.md` (thêm phần Đợt 3)

## 3. Giả định
1. "Khớp ví dụ BR-xxx" trong AC dựa vào cột ví dụ của `business-rules.md` v0.1; DOM sửa ví dụ thì QA theo số mới.
2. Các mốc kỹ thuật không phải quy tắc kinh doanh vẫn ghi số trong AC (job hết hạn giữ chỗ chạy trong 5 phút, việc dọn xuất hiện trong 1 phút, màn 360px, 10 căn × 14 ngày).
3. Vai trong câu story là người hưởng lợi chính; quyền chi tiết luôn theo `rbac-matrix.md`.
4. Giả định của BA (CTV không xác nhận cọc, chỉ `owner` đặt hạn mức FOC) dùng nguyên trong AC, nhãn chờ INV giữ ở decision-log.
5. Chi phí trong ESC lấy từ INT/ARC/OPS, đều là ước tính hoặc giá niêm yết – đã ghi rõ "chưa xác minh" khi nguồn chưa chắc.

## 4. Rủi ro / vướng mắc
- **R2 nặng hơn**: 74 Must R2 (tăng 3). Đã đưa vào ESC-012 phương án B (thu hẹp) để INV chọn nếu muốn an toàn; ORC cần ước lượng năng lực khi lập plan R2.
- ESC-012 câu chính và câu phụ logo dùng chung một file – protocol yêu cầu 1 câu hỏi/ESC; đã tách rõ "câu phụ" để giữ tổng ≤ 12. ESC-002 tương tự (câu phụ hosting).
- AC phụ thuộc review DOM/BA bước 3: nếu DOM đổi tên/mã BR, cần dò lại mục 4 backlog.
- Một số AC dựa trên đề xuất BA "chờ SEC/DOM" (rbac ghi chú 30 – lý do xem ảnh sau khi khai báo; SQ-3 FOC minibar tự áp) – nếu bị bác, sửa US-048, US-007.

## 5. Việc chưa xong
- AC chi tiết cho story Must R3 cũ (US-041, 064, 065, 088, 089, 095, 096, 099, 100–102, 114, 115, 122) – làm ở R2 trước khi đưa vào plan R3.
- Bước 3: review UXR, UXD, QA, DATA. Bước 4: trả lời thẻ review của BA, DOM.
- Cùng ORC lập `plan.md` Round 2 (sau khi INV trả lời ESC-012 hoặc theo mặc định A).
- ORC ghi decision-log 7 dòng D-1…D-7 ở `open-questions-resolution.md` mục 3.

---

# Báo cáo PO – Round 1 · Bước 4 (Phản hồi & sửa)
- Ngày: 15/10/2026 | Vai: PO

## 1. Đã làm gì
- Trả lời 28/28 thẻ (BA 15, DOM 13) – tất cả **Done**; 11/11 lỗi tự nhận T1–T11 Done; xử lý yêu cầu chuyển tiếp của SEC, INT, UXR. Blocker/Major còn Open: **0**. Chi tiết: `rounds/round-01/responses/PO-responses.md`.
- Backlog: ngày nghiệp vụ 06:00 vào quy ước AC; sửa AC US-001, 007, 010, 011, 012, 016, 017, 018, 020, 022, 023, 024, 025, 026, 054, 061, 071, 073, 080, 082, 085, 086, 087, 106, 119, 133, 136, 139; thêm US-140 (đơn nhóm), US-141 (xác minh app khách), US-142 (thiết bị được cấp), US-143 (2FA), US-144 (chốt tháng), US-145 (vận hành dự phòng mất mạng/mất điện, Should R3); US-119 AC6 cờ chờ đối soát (R2); US-136 theo BR-315; US-139 lên Must R2, US-124 lên Must R3; gắn 13 BR và 8 UC còn thiếu. Tổng **145 story, 77 Must R2, 19 Must R3**.
- PRD v0.3: S1/S2 khớp DATA và G5; tách `owner`/`manager`; M0 xác thực lại bằng mật khẩu (R2), PIN + 2FA (R3); đóng ca vào MVP R3; không nhận tiền mã hóa; N11 theo RPO của OPS; D6 nêu ước lượng lệch.
- ESC: không tạo ESC mới (vẫn 12). Bổ sung câu phụ có phương án + đề xuất vào ESC-001, 004, 006, 007, 008, 009, 010, 011, 012; bảng chọn từng dòng cho ESC-004…007; cập nhật index.

## 2. File tạo/sửa
- `03-backlog/backlog.md`, `product/docs/PRD.md`, `product/docs/open-questions-resolution.md`
- `02-escalations/ESC-001, 004, 005, 006, 007, 008, 009, 010, 011, 012.md`, `escalations-index.md`
- `rounds/round-01/responses/PO-responses.md` (tạo mới), báo cáo này

## 3. Giả định
- Hạn mức tháng lễ tân tự miễn minibar 500.000 đ/người/tháng; phụ thu đơn OTA tính trên giá trực tiếp hiện hành; thuế suất có ngày hiệu lực, loại hóa đơn tạm GTGT; R2 duyệt FOC bằng mật khẩu; nếu INV chưa trả lời ESC-012 thì plan R2 theo R-C.

## 4. Rủi ro / vướng mắc
- Must R2 tăng 74 → 77 trong khi BE ước 20–25 tuần-người – phụ thuộc INV chọn R-A/R-B/R-C (ESC-012).
- Mã BR trong AC đã đối chiếu với business-rules v0.2 (BR-010, 113, 315–317, 321–326, 417, 427, 436, 526, 527, 613, 961–964); nếu DOM đổi số tiếp thì phải đối chiếu lại.
- ARC cần chỉnh OpenAPI theo US-018 AC5/US-139, US-119 AC5, US-106 AC2; BA sửa rbac mục 1 và 8.6.

## 5. Việc chưa xong
- Cùng ORC lập plan Round 2 theo quyết định ESC-012.
- Viết AC chi tiết cho US-145 và US-144 đầu R3.

