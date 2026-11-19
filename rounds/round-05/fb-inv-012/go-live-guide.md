# Hướng dẫn lên phiếu thanh toán tháng – khách dài hạn đang ở (v1.0.7)

- Tác giả: DOM | Round 5 – Phản hồi & sửa (QC điều kiện 5) | 19/11/2026, theo bản sửa đã kiểm trên staging (main `4d47af0d`; `contract.md` §12, §12.14; QA L3/L4).
- Dành cho: lễ tân (FD), lễ tân trưởng (FDL), quản lý (MGR), chủ cơ sở (OWN).
- Không chứa tên khách, mã đơn, số tài khoản.

## 1. Việc chính

**Phiếu tháng nhận phòng (tiền thuê tháng 11) BẮT BUỘC phải phát hành trên Desk, rồi ghi "Khách đã trả ngoài app" (mục 5). KHÔNG gửi phiếu này cho khách, KHÔNG thu tiền. KHÔNG được bỏ qua: bỏ qua thì phiếu cuối HĐ sẽ thu lại tháng 11.**

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
5. Không in, không gửi phiếu này cho khách. Phiếu cuối HĐ tự trừ khoản này, nên tháng 11 không bị thu hai lần.

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
| 3 | **Giá dọn thêm khách dài hạn** – nhập ngay sau deploy (bảng dưới mục này). |
| 4 | **Đơn giá**: điện 4.000, nước 25.000 (chưa VAT); VAT điện 8, nước 5 (chờ kế toán). |
| 5 | **In thử A5** từ staging trên máy in quầy: chữ đọc được, không mất lề, quét được QR. Báo ORC. |

### 7.1 Giá dọn thêm theo căn (OWN)

Studio (City và Garden) **150.000**, Premium và Signature **200.000** mỗi lượt (BR-LS-07). OWN mở Tham số → `long_stay_cleaning_fee_by_room`, nhập **đủ cả 10 căn**, hiệu lực từ hôm nay. Làm xong **trước khi khách dài hạn dùng trang yêu cầu dọn**. Khách gửi yêu cầu đúng lúc OWN đang sửa có thể bị chụp giá chưa đúng.

| Căn | Hạng | Giá / lượt |
|---|---|---|
| 101, 201 | Studio City | 150.000 |
| 102, 103, 202, 203 | Studio Garden | 150.000 |
| 302, 402 | Premium | 200.000 |
| 301, 401 | Signature | 200.000 |

Ví dụ (số giả): khách dài hạn căn 302 gọi dọn 2 lần trong tháng 12 → phiếu 01/2027 có 2 × 200.000 = 400.000.

- Gõ nhầm thì **sửa lại trong ngày** được, áp dụng ngay, không phải chờ ngày mai. Mỗi lần lưu đều được ghi nhật ký (ai, lúc nào, trước/sau). Dòng đã ghi trước lúc sửa giữ giá cũ.
- Không đổi `adhoc_cleaning_fee` (100.000, giá khách ngắn ngày).
- **Dòng phần chênh:** tới khi kiểm xong giá, Desk vẫn có thể ghi 100.000, kể cả lượt khách gửi yêu cầu dọn trong app. Lễ tân giữ dòng 100.000 và ghi thêm dòng "Dọn phòng thêm – phần chênh dài hạn" **+50.000** (Studio) hoặc **+100.000** (Premium, Signature) trong cùng ngày.
- **Bỏ dòng phần chênh chỉ sau một lần thử đúng giá.** FDL mở **Thêm dòng phát sinh** trên folio một khách dài hạn hạng Studio và một khách hạng Premium hoặc Signature, chọn "Dọn phòng lẻ", xem giá hiện 150.000 / 200.000, rồi đóng không lưu. Lỡ lưu thì đảo dòng có lý do. Chưa đúng thì báo OWN sửa bảng và thử lại.
- Yêu cầu khách gửi trước lúc bảng đúng giữ giá đã chụp (100.000), nên vẫn cần dòng phần chênh.
- Trước khi phát hành phiếu, FDL kiểm mỗi lượt dọn = 150.000 / 200.000.

## 8. Đơn ngắn ngày "đã xác nhận" đã qua ngày đến (production có 1 đơn)

Làm theo luồng sẵn có, xong trước ngày deploy:
- **Khách không đến** (gọi, nhắn không được): lễ tân đánh dấu **No-show** theo BR-311. Desk giữ cọc theo chính sách và mở bán lại căn. Không khôi phục được nữa vì đã qua ngày nghiệp vụ của đêm đến (BR-315).
- **Khách có đến và đang ở** (quên nhận phòng trên Desk): "Nhận phòng bù" chỉ dùng cho đơn dài hạn. Không đánh no-show; báo MGR + ORC để xử lý riêng.
- **Khách đã đến và đi rồi**: báo MGR. Không đánh no-show khi khách đã trả tiền.

## 9. Khi bị chặn

| Vướng | Gọi |
|---|---|
| Số, căn, ngày trên HĐ | FDL → MGR |
| "Thiết bị chưa tin cậy", tham số, tài khoản nhận | OWN |
| Desk báo lỗi lạ, số trên nháp không khớp tính tay | ORC, gửi ảnh màn hình **đã che tên khách** |
| Tới 30/11 còn căn chưa "đang ở" trên Desk | MGR + ORC; phiếu tháng 12 của căn đó làm ngoài app |
