# Hướng dẫn lên phiếu thanh toán tháng – khách dài hạn đang ở (v1.0.7)

- Tác giả: DOM | Round 5 – Phản hồi & sửa (QC điều kiện 5) | 19/11/2026, theo bản sửa đã kiểm trên staging (main `4d47af0d`; `contract.md` §12, §12.14; QA L3/L4).
- Dành cho: lễ tân (FD), lễ tân trưởng (FDL), quản lý (MGR), chủ cơ sở (OWN).
- Không chứa tên khách, mã đơn, số tài khoản.

## 1. Việc chính

- Tháng 11 khách đã trả **ngoài Desk**. Phiếu thu thật đầu tiên trên Desk là **phiếu 12/2026**.
- Mỗi căn dài hạn đang có khách phải **đang ở trên Desk trước 30/11**, có **chỉ số nhận phòng** và phiếu tháng 11 ghi "Khách đã trả ngoài app".
- MGR/OWN làm trên **máy quầy tin cậy**. Máy khác Desk sẽ chặn.

## 2. Đối chiếu (FDL + MGR, xong trước 26/11)

Ghi vào sổ quầy cho từng căn (không gửi qua chat):
- căn có khách không; khách đã có đơn trên Desk chưa;
- ngày đến thật, ngày hết HĐ, tiền thuê tháng trên HĐ;
- số điện, nước trên sổ giấy và ngày đọc.

Đơn trên Desk sai ngày hết HĐ hoặc sai tiền thuê: MGR sửa trước. Không đánh no-show, không hủy các đơn này.

**Ngày đến dùng trên Desk:** ngày đến thật. Khách ở từ **trước 01/11** thì dùng **01/11** và ghi ngày bắt đầu HĐ thật vào ghi chú đơn.

## 3. Đưa khách vào "đang ở"

| Trường hợp | Ai | Làm |
|---|---|---|
| Khách đang ở, **chưa có đơn** | MGR/OWN | Tạo đơn dài hạn, chọn **"Khách đang ở từ trước"**, nhập ngày đến (xem mục 2), ngày hết HĐ, tiền thuê, lý do. Ngày đến chỉ lùi được tối đa 45 ngày. Sau đó làm như dòng dưới. |
| 6 đơn **"đã xác nhận"**, ngày đến đã qua | MGR/OWN | Mở đơn → **"Nhận phòng bù"**, nhập ngày đến thật, lý do, số thẻ phòng. Desk không thu tiền ở bước này. |

Làm xong trước **30/11**. Nếu để sang tháng 12, Desk chỉ nhận ngày đến trong tháng 11 tới hết 11/12.

## 4. Chỉ số nhận phòng từ sổ giấy (FDL)

- Mở căn → Chỉ số → **Nhận phòng**. Gõ số điện (kWh nguyên) và nước (m³, 1 số lẻ). Nhập **ngày đọc ghi trên sổ**: từ ngày trước ngày đến (ví dụ tối 31/10 cho ngày đến 01/11) tới hôm nay.
- Desk tính đây là "đọc trễ": phải ghi lý do, ví dụ `số đọc giấy dd/mm`. Không có ảnh thì chọn "thiếu ảnh", ghi chú `số đọc giấy, không có ảnh`. Không chụp tờ sổ có tên khách. Giữ tờ sổ gốc tại quầy.
- **Hạn:** 11 ngày sau ngày bấm "Nhận phòng bù". OWN **không** phải đổi `lateMaxDays`.
- Chỉ nhập số đọc thật, ngày đọc thật. Không có số giấy thì báo MGR, và sáng hôm sau đọc đồng hồ thật.

## 5. Tiền thuê tháng 11 – "Khách đã trả ngoài app"

1. Danh sách **"Ready to bill"** hiện phiếu tháng nhận phòng (tiền thuê phần lẻ tháng 11). FDL tạo nháp, kiểm tra, rồi phát hành.
2. MGR/OWN bấm **"Khách đã trả ngoài app"**. Số tiền đã điền sẵn. Nhập ngày khách trả, lý do `tiền thuê 11/2026 đã trả ngoài Desk`, rồi xác nhận.
   - MGR chỉ ghi được **phần tiền thuê**, và chỉ trên phiếu của đơn nhận phòng bù. Trường hợp khác cần OWN.
   - Khoản này không vào ca, đối soát hay tiền mặt bàn giao.
3. Số khách trả ngoài Desk khác số trên phiếu: vẫn ghi đúng số trên phiếu. Phần chênh lệch báo OWN xử lý ngoài Desk.
4. Ghi nhầm: MGR/OWN dùng **"Đảo giao dịch"** rồi ghi lại. Không hủy phiếu.
5. Phiếu cuối HĐ tự trừ khoản này, nên không thu tháng 11 hai lần.

## 6. Chốt tháng 11 (30/11 – 01/12)

- Làm bình thường. Trên **bảng cuối tháng**, mỗi căn ghi **Cuối kỳ 11** và **Đầu kỳ 12**, mỗi lần một ảnh đồng hồ. Ô đầu kỳ 12 bắt buộc.
- Lỡ cửa sổ: FDL ghi trễ kèm lý do, **hạn 11/12**. Desk v1.0.7 **chưa có "Đọc bù"** (BR-LS-17). Sắp quá hạn thì báo MGR + ORC ngay.
- **Không phát hành phiếu 12/2026 cho tới khi ORC báo "staging đạt"** (staging kiểm 30/11–02/12). Được tạo nháp và xem trước.
- Khi ORC báo đạt: phát hành, in hoặc gửi khách, hạn **hết 05/12**. Cảnh báo "đọc trễ" trên nháp là bình thường: kiểm số rồi xác nhận.

## 7. OWN làm trước phiếu đầu tiên

| # | Việc |
|---|---|
| 1 | **Địa chỉ và hotline**: Tham số (S24) → **Liên hệ cơ sở**, nhập địa chỉ và hotline công khai, kiểm ô "Xem trước chân phiếu". Hiện đang trống. |
| 2 | **Tài khoản nhận VietQR**: đã có một tài khoản. Kiểm đúng tài khoản và còn hiệu lực. Đổi thì OWN tự nhập; đội không nhận số tài khoản qua chat. |
| 3 | **Dọn thêm khách dài hạn**: 150.000 (Studio City, Studio Garden) / 200.000 (Premium, Signature) mỗi lượt. Desk vẫn ghi 100.000. Mỗi lượt, lễ tân ghi thêm dòng "Dọn phòng thêm – phần chênh dài hạn" **+50.000** hoặc **+100.000**. **Chưa đặt** khóa `long_stay_cleaning_fee_by_room` (giá dọn theo căn) dù Desk cho nhập, vì mã chưa dùng và chưa kiểm giá trị (ARC 197-03). Không nâng `adhoc_cleaning_fee`. |
| 4 | **Đơn giá**: điện 4.000, nước 25.000 (chưa VAT); VAT điện 8, nước 5 (chờ kế toán). |
| 5 | **In thử A5** từ staging trên máy in quầy: chữ đọc được, không mất lề, quét được QR. Báo ORC. |

## 8. Khi bị chặn

| Vướng | Gọi |
|---|---|
| Số, căn, ngày trên HĐ | FDL → MGR |
| "Thiết bị chưa tin cậy", tham số, tài khoản nhận | OWN |
| Desk báo lỗi lạ, số trên nháp không khớp tính tay | ORC, gửi ảnh màn hình **đã che tên khách** |
| Tới 30/11 còn căn chưa "đang ở" trên Desk | MGR + ORC; phiếu tháng 12 của căn đó làm ngoài app |
