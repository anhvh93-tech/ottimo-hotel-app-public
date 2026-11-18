# Hướng dẫn lên phiếu thanh toán tháng – khách dài hạn đang ở (v1.0.7)

- Tác giả: DOM | Round 5 – Phản hồi & sửa (QC điều kiện 5) | 18/11/2026
- Dành cho: lễ tân (FD), lễ tân trưởng (FDL), quản lý (MGR), chủ cơ sở (OWN).
- Căn cứ: INV trả lời 18/11 (decision-log); OPS kiểm chỉ đọc production 18/11 (`rounds/round-05/outputs/OPS/report.md` §20); `DOM-rules.md` BR-LS-01..17; `contract.md` §11; QC `fb-inv-012-qc-gate.md` điều kiện 3–6.
- Tài liệu này không chứa tên khách, mã đơn, số tài khoản. Chỉ dùng giá trong BR.

## 1. Tình hình và việc chính

- Tháng 11 khách đã trả **ngoài Desk**, nên không thu lại tháng 11 trên Desk. Phiếu đầu tiên trên Desk là **phiếu 12/2026** (tiền thuê tháng 12 + điện nước tháng 11).
- Production 18/11: **chưa có đơn dài hạn nào "đang ở"** trên Desk. Có **6 đơn dài hạn còn "đã xác nhận"**, ngày đến trong tháng 11 đã qua. Không đơn nào có ngày đến trước 01/11. 10 căn đang ở dài hạn, nên **có khách đang ở mà chưa có đơn trên Desk**.
- Desk chỉ làm phiếu cho đơn **đang ở**. Vì vậy trước 30/11 phải: đối chiếu từng căn, nhận phòng trên Desk cho khách đang ở, ghi chỉ số đầu.

**Giới hạn của Desk v1.0.7 (đội đã kiểm mã):**
- Chỉ nhận phòng được **đúng ngày đến** của đơn. Không tạo được đơn có ngày đến trong quá khứ.
- Lần đọc "nhận phòng" phải có ngày đọc **từ ngày đến trên Desk** trở đi. Số giấy đầu tháng 11 không nhập được vào lần đọc này nếu ngày đến trên Desk là hôm nay.
- Thu tiền trên phiếu chỉ có **tiền mặt** và **VietQR**. Chưa có cách ghi "đã thu ngoài Desk".

Vì vậy chưa có đường sạch. ORC sẽ báo chọn **cách A** (có bản sửa nhỏ) hay **cách B** (không sửa mã) **trước 27/11**. Trong lúc chờ: làm bước 2.1, **không** đánh no-show, không hủy, không đổi ngày các đơn này.

## 2. Từng căn dài hạn

### 2.1 Đối chiếu (FDL + MGR, làm ngay, xong trước 26/11)

Với mỗi căn trong 10 căn, so HĐ giấy với Desk và ghi vào sổ quầy (không gửi qua chat):
- Căn có khách đang ở? Đơn trên Desk là đơn nào (trong 6 đơn "đã xác nhận"), hay **chưa có đơn**?
- Ngày đến thật, ngày hết HĐ, tiền thuê tháng trên HĐ.
- Số điện, nước đầu tháng 11 (hoặc lúc khách vào) trên sổ giấy, và **ngày đọc** ghi trên sổ.
- Đơn trên Desk sai ngày hết HĐ hoặc sai tiền thuê: báo MGR sửa trước khi nhận phòng.
- Căn có đơn trên Desk nhưng không có khách thật: báo MGR, không nhận phòng.

### 2.2 Cách A – nếu ORC báo có bản sửa nhỏ

Bản sửa dự kiến cho MGR/OWN: **nhận phòng bù** với ngày đến thật; và cách ghi **"đã thu ngoài Desk"** cho phiếu.
1. Khách chưa có đơn: tạo đơn dài hạn như FB-INV-010 với ngày đến thật.
2. MGR nhận phòng bù với ngày đến thật. Không thu tiền lúc nhận phòng.
3. OWN mở tạm ghi trễ (mục 3). FDL ghi **chỉ số nhận phòng** từ sổ giấy, ngày đọc thật.
4. Desk hiện **phiếu tháng nhận phòng** (tiền thuê lẻ tháng 11). FDL tạo, phát hành, rồi ghi **"đã thu ngoài Desk"**. Làm vậy để phiếu cuối HĐ không thu lại phần này.

### 2.3 Cách B – nếu không có bản sửa (cách tạm, nhiều việc tay)

1. Khách chưa có đơn: tạo đơn dài hạn như FB-INV-010 với **ngày đến = hôm nay**, ngày hết HĐ và tiền thuê theo HĐ thật. Đơn "đã xác nhận" có ngày đến đã qua: MGR đổi ngày đến về hôm nay, **giữ ngày hết HĐ và tiền thuê tháng**. Desk tự đổi tiền thuê thì dừng, báo ORC.
2. Lễ tân nhận phòng hôm nay. Desk đòi thu khoản gì lúc nhận phòng thì dừng, báo MGR (tháng 11 đã thu).
3. **Đọc đồng hồ thật hôm nay**, chụp ảnh, ghi chỉ số nhận phòng (trong cửa sổ, không cần mở tạm).
4. **Không tạo** phiếu tháng nhận phòng (tháng 11). Nháp lỡ tạo thì hủy, lý do `tháng 11 đã thu ngoài Desk`.
5. Điện nước từ số giấy tới số hôm nay: FDL tính tay. Điện = kWh × 4.000 × 1,08; nước = m³ × 25.000 × 1,05; làm tròn đến đồng. Ghi vào phiếu 12/2026 bằng dòng **"Điều chỉnh kỳ trước"**, lý do `điện nước dd/mm–dd/mm theo số giấy`. MGR kiểm lại phép tính trước khi phát hành. Không có số giấy thì không tính phần này.
6. **Ghi chú trên đơn ngay hôm nay**: "Tiền thuê lẻ từ <ngày nhận phòng Desk> tới 30/11 đã thu ngoài Desk – phiếu cuối HĐ trừ lại bằng Điều chỉnh kỳ trước (âm)". Lý do: phiếu cuối tính "tổng tiền thuê HĐ trừ các phiếu đã phát hành", nên sẽ thu lại phần tháng 11 nếu không trừ.
7. Báo cáo ngày đêm-phòng tháng 11 của các căn này sẽ thiếu số ngày trước ngày nhận phòng trên Desk. OWN biết, không sửa.

## 3. Mở tạm ghi trễ (chỉ dùng ở cách A, hoặc khi lỡ cửa sổ)

| Bước | Ai | Việc |
|---|---|---|
| 1 | OWN | **Tham số** → `monthly_statement_rules` → `readingWindow.lateMaxDays` từ **10** lên **31**, hiệu lực hôm nay. Hạn ghi trễ của lần đọc nhận phòng = ngày đến + 32 ngày (ví dụ ngày đến 05/11 → hết 07/12). |
| 2 | FDL | Ghi chỉ số từ sổ giấy, **ngày đọc = ngày trên sổ**, lý do `số đọc giấy dd/mm`. Không có ảnh: chọn "thiếu ảnh", ghi chú `số đọc giấy, không có ảnh`. Không chụp tờ sổ nếu có tên khách. Giữ tờ gốc tại quầy. |
| 3 | OWN | Hạ `lateMaxDays` về **10** ngay khi FDL báo xong, **chậm nhất hết 29/11**. |

Chỉ nhập số đọc thật, ngày đọc thật. Desk chặn ngày đọc trước ngày đến thì không sửa ngày cho lọt, báo ORC.

## 4. Chốt tháng 11 (30/11 – 01/12)

- Làm bình thường trên production, không chờ ai. Trên **bảng cuối tháng**, mỗi căn dài hạn đang ở ghi hai lần: **Cuối kỳ 11** và **Đầu kỳ 12**, mỗi lần một ảnh mặt đồng hồ. Ô đầu kỳ 12 bắt buộc, Desk không điền sẵn.
- Cửa sổ: 30/11 tới hết 01/12, lễ tân tự ghi. Lỡ cửa sổ: FDL ghi trễ kèm lý do, **hạn 11/12**. Quá hạn: báo MGR (đọc bù BR-LS-17 nếu đã có trên Desk) hoặc ORC.
- **Không phát hành phiếu 12/2026 trên production cho tới khi ORC báo "staging đạt"** (QC điều kiện 6: staging kiểm sáng 30/11 và 01/12). Được tạo nháp và xem trước.
- Khi ORC báo đạt: phát hành, in hoặc gửi khách. Hạn thanh toán **hết 05/12**. Cảnh báo "đọc trễ" trên nháp của căn đã ghi số giấy là bình thường: kiểm số rồi xác nhận.
- ORC báo staging trượt: không phát hành phiếu có điện nước. Thu tiền thuê tháng 12 theo cách thu hiện có, chờ bản sửa.

## 5. OWN làm trước phiếu đầu tiên

| # | Kiểm | Cách làm |
|---|---|---|
| 1 | **Địa chỉ và hotline ở chân phiếu** – hiện **đang trống** trên production | OWN gửi ORC địa chỉ và hotline công khai (như trên website) **trước 27/11**. Desk chưa có màn hình sửa, OPS đặt giúp sau khi INV duyệt. Kiểm lại trên bản xem trước phiếu nháp đầu tiên. |
| 2 | **Tài khoản nhận VietQR** – production **đã có** một tài khoản | OWN mở Tham số → tài khoản nhận tiền, kiểm đúng tài khoản và còn hiệu lực. Muốn đổi thì OWN tự nhập; đội không nhập, không nhận số tài khoản qua chat. Trên phiếu in thử: đúng ngân hàng, chủ tài khoản, 4 số cuối. |
| 3 | **Giá dọn thêm khách dài hạn**: Studio City / Studio Garden **150.000**, Premium / Signature **200.000** mỗi lượt (BR-LS-07, INV 18/11) | Desk v1.0.7 **chưa có giá dọn theo hạng**: mọi lượt "Dọn phòng lẻ" ghi 100.000 (`adhoc_cleaning_fee`, giá khách ngắn ngày). **Không nâng** khóa này, vì sẽ đổi giá khách ngắn ngày. Tới khi đội sửa xong, mỗi lượt dọn thêm của khách dài hạn lễ tân ghi thêm dòng "Dọn phòng thêm – phần chênh dài hạn": **+50.000** (Studio) hoặc **+100.000** (Premium, Signature). OWN xem nháp phiếu 12/2026: mỗi lượt cộng đúng 150.000 / 200.000. |
| 4 | **Đơn giá và thuế** | `utility_unit_price` = điện 4.000 / nước 25.000 (chưa VAT); `utility_vat_rate` = điện 8, nước 5 (chờ kế toán); `lateMaxDays` = 10. |
| 5 | **In thử A5 tại quầy** | In một phiếu mẫu từ staging (dữ liệu giả) trên máy in quầy: khổ A5, chữ đọc được, không mất lề, quét được mã QR. Báo ORC kết quả. |

## 6. Khi bị chặn – gọi ai

| Vướng | Gọi |
|---|---|
| Không rõ số, căn, ngày trên HĐ | FDL → MGR |
| Đổi tham số, tài khoản nhận, duyệt ngoại lệ | OWN |
| Desk báo lỗi lạ, chặn nhận phòng hoặc phát hành, số trên nháp không khớp tính tay | ORC (đội dự án), gửi ảnh màn hình **đã che tên khách** |
| Tới 27/11 chưa biết cách A hay B; tới 30/11 còn căn chưa nhận phòng trên Desk | MGR + ORC; phiếu tháng 12 của căn đó làm ngoài app |
