# Báo cáo PO – Round 2, Tuần 1 (Đợt 0) – việc W12

- Người làm: PO | Ngày: 16/10/2026 | Đầu vào: plan R2 mục 2, 3.2, 8; `02-escalations/*` (13 ESC đã quyết 16/10); decision-log (dòng INV + ORC 16/10).

## 1. Đã làm gì
1. **Áp phương án R-C vào backlog** (INV quyết ESC-012 16/10):
   - 5 story dời hẳn sang đầu R3: **US-081, US-111, US-125, US-128, US-141** – cột Round = "R3 (dời đầu R3 – INV quyết ESC-012 16/10 – R-C)", trạng thái **Dời**; AC giữ nguyên, có ghi chú **[Dời R3 – R-C]** ở đầu phần AC.
   - 4 story làm một phần ở R2: **US-012** (AC2 + job J12 → R3), **US-086** (AC3 → R3), **US-108** (phần mã cửa của AC2 → R3; R2 chỉ hiện Wi-Fi theo khung hiệu lực – P-R2-5), **US-119** (AC5 → R3). Cột Round ghi "R2 (một phần; …)", AC dời gắn nhãn **[Dời R3 – R-C]**.
   - Thêm **US-017 AC5a tạm cho R2** (P-R2-3): FD+ tạo đơn dài hạn nhập tay (căn, ngày vào/ra, số tiền/tháng), cờ "HĐ ngoài hệ thống – chuyển vào app ở R3", chiếm tồn phòng và chịu chống trùng, không sinh kỳ thu, thu bằng US-119 AC1; sale/CTV không tạo được; giữ nguyên mã đơn khi chuyển sang HĐ ở R3.
   - Bảng epic: Must R2 **77 → 72** (EP11 8→7, EP14 8→6, EP16 1→0, EP17 1→0); Must R3 19 → 24. Quy ước mục 4: AC [Dời R3 – R-C] không thuộc nghiệm thu R2.
2. **Bỏ nhãn giả định ở chỗ INV đã quyết qua ESC**, ghi "INV quyết ESC-xxx 16/10":
   - Backlog: 17 chỗ "chờ ESC-001/004/005/006/007/010/011" (gồm hạn mức tháng tự miễn FOC 500.000 đ – ESC-007); mục 5.4 thêm trạng thái 13 ESC và dòng ESC-013.
   - PRD (v0.3 → **v0.4**): trạng thái phạm vi MVP, quy ước số liệu, G3, G4, chỉ số S1–S12, X3, N10, D1–D7, A2, A3, A5, A7, A8, A14, mục 10 (trạng thái 13 ESC + dòng ESC-013); thêm **mục 5.4** "Điều chỉnh phạm vi R2 theo R-C".
   - **Giữ nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`** cho thông tin INV còn phải gửi: sức chứa thật từng căn (ESC-004 – US-017 AC3, PRD D1), loại hình kinh doanh (ESC-008 – backlog 5.4, PRD D1), tài khoản ngân hàng + tên miền (ESC-010 – US-120 AC2, PRD N10/D3/A8), thông tin khóa (ESC-011 – US-128 AC3, PRD D4/A7).
3. **Cập nhật plan R2**: dòng phương án phạm vi (R-C là quyết định INV), P-R2-1, ghi chú mục 2.4 "tham khảo – không áp dụng", nhóm A mục 7, W12 (PO xong 16/10), **mục 8** viết lại thành bảng "Quyết định INV 16/10 · Ảnh hưởng R2 · Còn chờ INV gửi" cho 13 ESC, mục 9.2 bỏ nhãn chờ ESC-012/002, giữ nhãn cho tài khoản ngân hàng, sức chứa, loại hình kinh doanh.

## 2. File tạo/sửa
- `03-backlog/backlog.md` (sửa)
- `product/docs/PRD.md` (sửa – v0.4)
- `rounds/round-02/plan.md` (sửa – mục đầu, 2.3, 2.4, 3.2 W12, 7, 8, 9.2)
- `rounds/round-02/outputs/PO/w1-report.md` (mới)

## 3. Giả định
- `[GIẢ ĐỊNH – PO]` ESC-001 phương án A là "thuê luật sư rà soát": các giá trị pháp lý (hạn lưu ảnh, ngưỡng tuổi trẻ em, hạn trả lời yêu cầu dữ liệu, hộ chiếu/thị thực không đạt) ghi "INV quyết ESC-001 16/10 – luật sư rà soát trước khi có dữ liệu thật", vẫn dùng mặc định BR/SEC tới khi có kết quả luật sư.
- Giữ nhãn ở các giả định **không thuộc ESC**: PRD dòng 75 (thiết bị chính theo nhóm – chờ kết quả phiếu ESC-003), dòng 84 / A4 (không có vai F&B, kế toán riêng), N3 (tốc độ); backlog US-086 AC4 (CTV "Báo đã chuyển cọc" – chờ INV ở decision-log BA); US-017 AC8 (Traveloka chỉ hiện khi INV xác nhận có dùng). Không tự coi các mục này đã được quyết.
- Sức chứa từng căn: AC kiểm theo số trong BL cho tới khi INV gửi số thật.

## 4. Rủi ro / vướng mắc
- Quy ước mới "[Dời R3 – R-C]" cần QA sinh lại traceability và bỏ TC của AC dời khỏi bộ TC Cao R2; thêm TC cho US-017 AC5a (đã có trong việc QA ở plan 3.1).
- ARC cần hợp đồng API cho AC5a (plan 3.1 ARC (3)); UXD màn "đơn dài hạn nhập tay" (UXD (4)).
- Điều kiện P-R2-4 (dời US-141) vẫn chờ SEC xác nhận tuần 1; SEC không đồng ý thì US-141 quay lại R2 và PO sửa backlog.
- ESC-007 hàng 1 ghi "Round 2 tạm B tới khi INV chọn": nay INV chọn A (ân hạn 12:30) – DOM cần đổi BR-412 và `br-examples.json` (ghi ở plan mục 8; không sửa file DOM).

## 5. Việc chưa xong
- Không có trong phạm vi W12. Việc PO tiếp theo trong R2: Q&A hằng ngày (`qa-log.md`), nghiệm thu theo story (`acceptance.md`), review UXR/UXD/QA/DATA.
- ORC ghi vào decision-log khi commit: "PO áp R-C vào backlog (W12): 72 Must R2, US-017 AC5a tạm; PRD v0.4".
