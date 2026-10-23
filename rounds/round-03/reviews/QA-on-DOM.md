# QA review oracle DOM – Round 3 Sprint 1 (fuzz R3-Q30)

- Người review: QA | Ngày: 23/10/2026 | Đối tượng: `rounds/round-03/outputs/DOM/s1-money-oracle.md` mục 1 và mục 8 (oracle trên `main` @ `5834c6a`, BR v0.4.1).
- Nguồn phát hiện: dựng `refLedger` độc lập cho fuzz (`product/services/api/test/fuzz/ref-ledger.ts`), chạy trên `main`.

### FB-R3-QA-DOM-01
- Mức độ: Major (định nghĩa tiền mơ hồ; critic và QA có thể kết luận ngược nhau)
- Vị trí:
  - oracle mục 1, dòng **D**: "Σ khoản thu sau lúc mở chu kỳ";
  - mục 8, bất biến **I5**.
- Vấn đề:
  1. **D:** câu "khoản thu" không nói khoản thu đã bị đảo sau đó có còn tính hay không.
     - Đọc là "khoản thu còn sống" thì đảo một khoản thu trong chu kỳ làm O tăng **gấp đôi**: D giảm 1.000, đồng thời việc đảo được ghi vào R +1.000 (G-4 "phần tăng").
     - Tái hiện: fuzz FZ-01 seed 1000 bước 31. Đảo khoản thu 1.000 khách vừa trả: mã ra O +1.000 (đúng thực tế), đọc chữ ra +2.000.
  2. **I5** ("Σ nhật ký của chu kỳ = `debt_recorded_vnd` = R") không đúng với chu kỳ mở từ nợ ghi trước 0076. Theo ARC 5.2, `debt_recorded_vnd` = X + phần ghi, trong đó X = nợ cũ còn lại, không phải tổng nhật ký cũ.
- Đề xuất:
  - D = Σ khoản thu **đã nhận** từ lúc mở chu kỳ, kể cả khoản về sau bị đảo, vì việc đảo đã nằm trong R. QA đang dùng cách này, ghi `[GIẢ ĐỊNH QA]` trong `ref-ledger.ts`.
  - I5 thêm câu: "chu kỳ mở từ nợ trước 0076: `debt_recorded_vnd` = X + Σ ghi sau đó".
  - DOM sửa câu chữ. Nếu DOM chọn cách khác, QA sửa `refLedger` theo.
- Trạng thái: Open

### FB-R3-QA-DOM-02
- Mức độ: Major (định nghĩa cơ sở hạn mức và công nợ chưa đủ cho hai tình huống fuzz gặp thật)
- Vị trí: oracle mục 5.4 (BR-433 (d)) và mục 1 (D).
- Vấn đề:
  1. **Đêm bị void sau B18:** BR-433 (d) định nghĩa "giá đêm bảo vệ = min(giá dòng `room` hiện hành, giá tham chiếu)". Câu này không nói đêm **không còn dòng sống** (void) thì tính thế nào.
     - Fuzz lượt 1 đọc là 0. Mã giữ số chụp B18 (ví dụ 911.000), nên ra 42 cảnh báo "cơ sở lưu > bảo vệ".
     - Lệch này không phải đường lách, vì cơ sở không bao giờ vượt số chụp.
  2. **Xóa nợ của chu kỳ trước bị hoàn tác trong chu kỳ này** (A32 void, hoặc A32 nâng/hạ dòng mang FOC xóa nợ làm FOC đăng lại): mã cộng phần đã xóa trở lại vào O. D theo chữ chỉ đếm FOC "đăng từ lúc mở chu kỳ", nên không có phần này.
     - Ví dụ: FZ-01 seed 10094 bước 30 – mã O +13.000, đọc chữ ra +1.000.
     - FZ-01 seed 10171 và FZ-08 seed 30005: FOC đăng lại do A32 → mã giữ O, đọc chữ ra O −1.000.
- Đề xuất:
  - (1) Đêm void giữ giá tham chiếu, số chụp B18 vẫn chặn trên. QA đang dùng cách này.
  - (2) D trừ đi FOC xóa nợ của chu kỳ trước bị đảo trong chu kỳ này (nợ đã xóa quay lại). QA đang dùng cách này.
  - Cả hai ghi `[GIẢ ĐỊNH QA]` trong `ref-ledger.ts`. DOM chọn khác thì QA sửa theo.
- Trạng thái: Open

> **Cập nhật 23/10 (sau critic `s1-money-critic.md` M-2):** QA **rút ý 1**. BR-433 (a) đã viết rõ "đêm `room` còn sống … không có đêm nào → chờ OWN". Đây là lệch của mã, ghi BUG-R3-004, không phải chỗ mơ hồ của oracle. `ref-ledger.ts` quay lại cách đọc "đêm không còn dòng sống → không bảo vệ". Ý 2 giữ nguyên; critic đồng ý.
