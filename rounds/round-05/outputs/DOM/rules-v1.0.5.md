# Luật nghiệp vụ cho v1.0.5 – V5-1A, V5-11, V5-16, V5-30, V5-31

- Tác giả: DOM | Round 5 – v1.0.5 | Bước: Sản xuất (Gói 0) | Ngày: 06/11/2026
- Người đọc: ARC (hợp đồng 0.3.13), BE, FE-A, BA, QA, SEC, DATA.
- Nguồn sự thật: `product/docs/business-rules.md` **v0.5.12** (BR-010, BR-101, BR-204, BR-212, BR-309, BR-311, BR-428, BR-438 mới, BR-506, BR-903, mục 13); `product/docs/tham-so-quy-tac.md` bản 1.1; oracle `product/tests/fixtures/br-examples.json`. Tệp này giải thích và gom ca kiểm, không thay BR.
- **Không có tỷ lệ, số tiền hoa hồng hay thưởng, hay ranh giới khoảng kỳ hạn của bảng nội bộ** trong tệp này. Ca kiểm hoa hồng dùng tham số thử `test_rate_*` (SEC G3).
- Tên khóa, mã lỗi, tên trường dưới đây là **đề xuất**; ARC chốt ở hợp đồng 0.3.13. ARC đổi tên thì DOM đồng bộ BR và từ điển.

## 0. Tóm tắt

| Mục | Luật chốt | INV quyết? |
|---|---|---|
| V5-1A | Giá đêm bắt buộc ở mọi đường ghi giá; thiếu → 422. Tới khi lên: khóa `night_from_month_divisor` **còn tác dụng** ở đường API, giữ 12, không sửa | Không (NGÀNH) |
| V5-11 | 00:00–05:59: đêm của ngày nghiệp vụ là đêm đã ở; Ngày rời mới của Trả sớm tối thiểu = ngày lịch, gửi ngày hôm trước → 409; dòng phí giữ lại mang ngày nghiệp vụ | Không (NGÀNH, luật DOM 04/11) |
| V5-16 | **Chọn đề xuất SEC (a), thêm báo cáo (b)** → BR-438 | Không (NGÀNH); hạn mức duyệt vẫn là ESC-007 |
| V5-30 | Chỉ chốt cấu trúc H2. 4 điểm bảng nội bộ chưa rõ → **ESC-051**, tới khi trả lời áp phương án A | **Có – ESC-051** |
| V5-31 | Giá lượt dọn khách thuê tháng theo căn, khóa mới, INV nhập; thiếu → phí dọn lẻ kèm báo | Không (giá đã có ở bảng 01/11) |

### Việc chủ đầu tư nhập trên Desk sau khi v1.0.5 lên (đội không đổi tham số trên production)

1. `long_stay_cleaning_fee_by_room` (H3): dán `{"101":100000,"201":100000,"102":120000,"103":120000,"202":120000,"203":120000,"302":130000,"402":130000,"301":150000,"401":150000}` (giá công khai, bảng 01/11 mục 4).
2. `long_stay_commission` (H2): các khoảng kỳ hạn, tỷ lệ khách VN, khách NN, tỷ lệ đợt 1 – theo bảng nội bộ. Không gửi số cho đội.
3. `manager_performance_bonus_pct` (H2): tỷ lệ thưởng quản lý – theo bảng nội bộ.
4. Kiểm `short_stay_commission_pct`: hai khóa con `staff`, `collaborator` cùng một số (bảng có một mức).
5. Kiểm `commission_payable_day`, `commission_pay_by_day` khớp ngày trả lương (bảng ghi "trả cùng kỳ lương").
6. **Không sửa** `night_from_month_divisor`. Căn nào tạo bằng API hoặc công cụ nhập danh mục trước khi v1.0.5 lên: mở Danh mục căn, kiểm giá đêm.

Mục 2–3 phải xong trước kỳ chốt 01/12. Thiếu tỷ lệ thì Desk báo "Chưa có tỷ lệ hoa hồng", không tính 0.

---

## 1. V5-1A – giá đêm bắt buộc (QC R4 ĐK-6, BUG-R4-057)

### 1.1 Hành vi hiện tại (HEAD, v1.0.4)

Mã đọc `night_from_month_divisor` (12) ở ba đường, tính giá đêm = giá tháng ÷ 12, làm tròn `rounding.night_rate`, không cảnh báo:

1. Đổi giá căn qua API mà không gửi giá đêm.
2. Tạo căn qua API: luôn tính theo khóa, không nhận giá đêm.
3. Công cụ nhập danh mục căn.

Desk (`RoomDrawer`) luôn gửi đủ hai giá nên không đi các đường này.

### 1.2 Luật đích (BR-101 (5) v0.5.12)

1. Đổi giá căn: thiếu giá đêm → **422** (lỗi trường giá đêm), giá căn giữ nguyên. Không được là 500.
2. `createRoom` và công cụ nhập danh mục căn **nhận giá đêm**, thiếu cũng 422.
3. Ràng buộc giữ nguyên: số nguyên VND, `money ≥ 1`, `CHECK > 0`, bội 1.000.
4. Máy chủ không còn tự tính giá đêm từ giá tháng. Khóa `night_from_month_divisor` hết được đọc; đội ẩn khỏi màn Tham số ở bản sau (không xóa dữ liệu lịch sử của khóa).
5. Ví dụ OpenAPI ghi đủ hai giá.

### 1.3 Tới khi v1.0.5 lên

- Từ điển `.md` và `.json`: khóa mang nhãn **[Giá]**, `in_use: true`, "Giữ 12, không sửa" (đã sửa).
- Script của ORC/OPS gọi API đổi giá luôn gửi đủ hai giá và đọc lại giá sau khi ghi.
- Ví dụ: lệnh API chỉ gửi giá tháng 9.000.000 cho căn 102 → máy chủ ghi giá đêm **750.000** (bảng 800.000); báo giá 2 đêm thành 1.500.000 thay vì 1.600.000.

### 1.4 Ca kiểm QA

| Mã | Ca | Mong đợi | Oracle |
|---|---|---|---|
| T-1A-1 | Đổi giá căn 102 chỉ gửi giá tháng 9.000.000 | 422, lỗi trường giá đêm; đọc lại 9.000.000 · 800.000 | BR-101-17 |
| T-1A-2 | Đổi giá gửi đủ 9.000.000 · 800.000 | 200, đọc lại đúng hai số | – |
| T-1A-3 | `createRoom` thiếu giá đêm; có giá đêm 800.000 | 422; 201 với giá đêm 800.000 (không phải 750.000) | – |
| T-1A-4 | Công cụ nhập danh mục: dòng thiếu giá đêm | Dòng đó lỗi rõ ràng, không ghi; các dòng đủ vẫn nhập (hoặc cả lô dừng – ARC chọn, ghi trong hợp đồng) | – |
| T-1A-5 | Giá đêm 0, âm, 750.500 | 422 (giữ ràng buộc cũ) | – |
| T-1A-6 | Sửa `night_from_month_divisor` rồi đổi giá thiếu giá đêm | Vẫn 422; giá không đổi theo khóa | – |
| T-1A-7 | Dòng BR-101-16 (đường cũ) | BE chuyển vào `retiredIds` cùng commit gỡ `nightlyFromMonthly` | BR-101-16 |

---

## 2. V5-11 – trả sớm và phí giữ lại trong 00:00–05:59

Gọi **W** là khoảng 00:00–05:59 ngày lịch D+1, khi ngày nghiệp vụ vẫn là D (BR-010).

### 2.1 Luật

1. **Đêm D là đêm khách đã ở.** Thao tác trong W không được hoàn hay đảo đêm D.
2. **Trả sớm (B16) trong W**: Ngày rời mới tối thiểu = **ngày lịch D+1**.
   - Desk đặt sẵn Ngày rời mới = ngày lịch (không phải ngày nghiệp vụ).
   - Lệnh (cả xem trước `dryRun` lẫn ghi) có Ngày rời mới ≤ D → **409** kèm chỉ dẫn (đề xuất trường gợi ý `minNewDepartureDate` = D+1). Đơn và folio không đổi.
   - Trong W, điều kiện này xét **trước** các kiểm tra ngày khác (kể cả "Ngày rời mới ≤ ngày đến"), để lễ tân luôn nhận đúng chỉ dẫn.
   - Ngoài W (06:00–23:59) giữ như hiện nay: Ngày rời mới tối thiểu = ngày nghiệp vụ.
3. **Khách rời đúng ngày đi trên đơn** (ngày đi = D+1): không phải trả sớm. B16 từ chối kèm chỉ dẫn sang **Trả phòng** (B18, phụ thu 0). Nút Trả phòng có từ 00:00 thuộc V5-10.
4. **Số ngày báo trước** không đổi: BR-011, ngày mốc (Ngày rời mới) − ngày nghiệp vụ lúc báo. Khách báo trong W rời ngay hôm đó (ngày lịch) = báo trước 1 ngày (như BR-428-12 đã có).
5. **Dòng phí giữ lại** `cancellation_fee`, `no_show_fee`, `early_departure_fee`, `deposit_forfeit`: ngày dịch vụ = **ngày nghiệp vụ lúc thao tác** (hủy, đánh dấu không đến, trả sớm), không phải ngày lịch (BUG-R3-036). Báo cáo doanh thu khác theo ngày (K-22e) đếm theo ngày này.
6. **Khai báo tạm trú**: ngày khách rời thật là ngày lịch lúc khách đi (BR-010 không áp cho hạn pháp lý).

### 2.2 Ví dụ số

- Đơn trực tiếp 4 đêm 20–24/10 × 700.000. Khách đi lúc 03:00 ngày 21/10 (ngày nghiệp vụ 20/10).
  - Ngày rời mới **21/10** → giữ đêm 20/10 (700.000), bỏ 21, 22, 23 = 2.100.000.
  - Báo trước 21/10 − 20/10 = 1 ngày → hoàn 50 % = **1.050.000**; phí trả phòng sớm **1.050.000**, ngày dịch vụ **20/10**.
  - Có phụ thu người 150.000/đêm đã thu: hoàn thêm 3 × 150.000 = **450.000** (100 %, BR-428).
- Đơn 19–24/10, cùng giờ, lễ tân gửi Ngày rời mới 20/10 → **409**. Mã HEAD hiện nhận lệnh này và bỏ cả đêm 20/10 khách đã ở.
- Đơn 20–21/10, khách đi 03:00 ngày 21/10 → Trả phòng, không phải Trả sớm.
- Hủy lúc 01:30 ngày 22/10 (ngày nghiệp vụ 21/10), đơn đến 25/10, cọc 700.000 → báo trước 4 ngày → hoàn **350.000**, dòng phí hủy **350.000** ngày **21/10** (HEAD ghi 22/10).
- Đánh dấu không đến 00:40 ngày 21/10 cho đơn đến 20/10, cọc 500.000 → giữ **500.000**, dòng phí không đến ngày **20/10**.

### 2.3 Việc theo vai

- ARC: mã 409 và trường gợi ý trong hợp đồng 0.3.13 (B16 `earlyDeparture`); ghi một chỗ hàm "ngày lịch tối thiểu" dùng chung `businessDay` + `rollover` (plan mục rủi ro V5-10, V5-11).
- BE: `stay.service.ts` `earlyDeparture` – thêm điều kiện W trước kiểm tra ngày; `folio.service.ts` dòng phí giữ lại – `serviceDate` = ngày nghiệp vụ (cùng chỗ dùng `business_day_rollover`). Đóng BUG-R3-036, FB-R4-ARC-DOM-B16-01, RN-05.
- FE-A: ô Ngày rời mới trong W mặc định ngày lịch; hiện chỉ dẫn 409; trong W, đơn có ngày đi = ngày lịch hiện nút Trả phòng (V5-10), không hiện Trả sớm như lối chính.
- DATA: xác nhận K-22e đếm phí theo ngày dịch vụ mới.

### 2.4 Ca kiểm QA (chạy giờ thật trên staging, trong W và lúc 06:00)

| Mã | Ca | Mong đợi | Oracle |
|---|---|---|---|
| T-11-1 | 03:00 ngày 21/10, đơn 20–24/10, Ngày rời mới 21/10 | Báo trước 1, bỏ 3 đêm, hoàn 1.050.000 | BR-428-14 |
| T-11-2 | Như T-11-1, Ngày rời mới 20/10, đơn 19–24/10; cả `dryRun` | 409, đơn và folio không đổi | BR-428-15 |
| T-11-3 | Dòng phí của T-11-1 | Ngày dịch vụ 20/10 | BR-428-16 |
| T-11-4 | Đơn 20–21/10, 03:00 ngày 21/10, mở Trả sớm | Từ chối kèm chỉ dẫn Trả phòng; Trả phòng được, phụ thu 0 | BR-428-17 |
| T-11-5 | 05:59 và 06:00 ngày 21/10 cùng đơn 20–24/10 | 05:59: tối thiểu 21/10; 06:00: tối thiểu 21/10 (ngày nghiệp vụ), báo trước 0, không hoàn | BR-428-12, BR-428-13 |
| T-11-6 | Desk mở Trả sớm lúc 02:00 | Ô Ngày rời mới đặt sẵn ngày lịch | – |
| T-11-7 | Hủy 01:30 ngày 22/10 | Phí hủy ngày 21/10 | BR-309-27 |
| T-11-8 | Đánh dấu không đến 00:40 ngày 21/10 | Phí không đến ngày 20/10 | BR-311-04 |
| T-11-9 | Báo cáo doanh thu khác ngày 20/10 và 21/10 sau T-11-7, T-11-8 | Phí nằm ở ngày nghiệp vụ | – |

---

## 3. V5-16 – lễ tân sửa giảm dòng phát sinh (FB-R4-SEC-BE-A31-01, Major)

### 3.1 Luật đã chọn: đề xuất SEC (a), thêm phần báo cáo của (b) → BR-438

**Sửa giảm** = bỏ dòng (`voidLine`), giảm số lượng (`newQuantity`, kể cả về 0) hoặc giảm đơn giá (`newUnitPriceVnd`): mọi thay đổi làm số tiền của một dòng nhỏ đi. Áp cho dòng không phải dòng đêm (khác `room`, `extra_person`, `room_change_difference`) trên folio chưa `settled`. Tăng không thuộc luật này.

1. Lễ tân (FD) và lễ tân trưởng (FDL) sửa giảm **trực tiếp**, lý do bắt buộc, khi đủ:
   - (a) dòng do chính người đó **nhập tay** (A30, nguồn `manual`);
   - (b) dòng ghi trong **ngày nghiệp vụ hiện tại**;
   - (c) folio chưa `settled`.
   Xét theo **dòng gốc** của chuỗi sửa (`relatedLineId` lần ngược tới dòng đầu): dòng thay thế mang người ghi và ngày ghi của dòng gốc.
2. Ngoài (1): FD/FDL **không** sửa giảm được. Máy chủ từ chối (đề xuất 403 `FORBIDDEN_ACTION` kèm gợi ý `focRequest`), folio không đổi. Desk chỉ sang **Gửi miễn có duyệt** (A35, BR-431…434, định tuyến BR-432, hạn mức BR-433). FOC minibar tự áp vẫn theo BR-436. Ghi nhầm dòng của người khác: lý do "Khác" + ghi chú "ghi nhầm". NÊN: ARC thêm mã lý do riêng "Ghi nhầm" để báo cáo FOC tách.
3. Quản lý, chủ đầu tư: như hiện nay. Folio `settled`: A32, BR-433 (e).
4. Báo cáo:
   - danh sách đóng ca BR-526 (d): mọi lần FD/FDL sửa giảm trong ca (người, đơn, dòng, số trước → sau, lý do);
   - bộ lọc "Sửa giảm dòng – 7 ngày" cho quản lý (theo người, theo loại dòng) – plan V5-16 "bộ lọc tuần";
   - cảnh báo chủ đầu tư khi một người sửa giảm quá `foc_alert_count_per_approver` lần trong tháng (theo ngày nghiệp vụ). Dùng chung ngưỡng, không thêm khóa.
   Số tiền sửa giảm theo (1) không cộng FOC tháng, không tính hạn mức BR-433. Mọi lần có audit.

### 3.2 Vì sao chọn cách này

- **Đúng nghĩa "sửa ghi nhầm" ở quầy.** Lễ tân bấm nhầm số lượng thường phát hiện ngay, khi khách còn đứng ở quầy hoặc trong ca. Người ghi dòng tự sửa trong ngày là đủ cho gần hết ca thật. Không bắt lễ tân xin duyệt cho lỗi gõ phím của chính mình.
- **Chặn đúng hai đường thất thoát SEC nêu.** Thu tiền mặt rồi bỏ dòng của ca khác, hay miễn cho người quen trên dòng hệ thống (trả muộn, nhận sớm), đều phải qua FOC có người duyệt khác. Hạn mức ESC-007 (INV đã quyết) giữ nguyên tác dụng.
- **Không thêm cơ chế duyệt mới.** Đi đường FOC sẵn có (A35, BR-432/433/436): ít mã, ít việc kiểm, hợp bản bảo trì. Phương án "yêu cầu sửa có duyệt" riêng tốt hơn cho báo cáo nhưng tốn hợp đồng mới; để sau nếu báo cáo FOC lẫn nhiều "ghi nhầm".
- **Phần (b) cho người xem lại.** Sửa giảm hợp lệ vẫn vào đóng ca và bộ lọc 7 ngày, và vào cảnh báo khi một người sửa quá nhiều. Quản lý thấy được mà không phải rà audit.
- **Xét theo dòng gốc** để không lách bằng "sửa tăng dòng người khác rồi bỏ dòng thay thế".
- Đánh đổi chấp nhận được: dòng ghi nhầm vào sai căn mà ca sau mới thấy thì bill khách có dòng và dòng FOC âm (BR-434). Ca này hiếm; người ghi tự sửa trong ngày thì không xảy ra.

### 3.3 Ví dụ số

- Hạnh 10:15 ngày 12/11 ghi minibar căn 202: 3 × 35.000 = 105.000; 10:20 sửa còn 2 → **70.000**, được.
- Cùng dòng, Lan (ca sau) 15:00 sửa → **bị chặn**; Lan gửi FOC 35.000, tự áp trong hạn mức BR-436 → bill minibar **105.000**, FOC **−35.000**.
- Hạnh ghi 23:50 ngày 12/11: bỏ lúc 00:20 ngày 13/11 → được; lúc 06:10 → bị chặn.
- Phụ thu trả muộn Desk tự ghi khi Hạnh bấm Trả phòng: Hạnh bỏ → bị chặn; muốn miễn → FOC theo BR-433 (vượt 300.000 → quản lý).
- Lan ghi 1 × 35.000; Hạnh sửa lên 2 (70.000) → được (tăng); Hạnh bỏ dòng thay thế → bị chặn; Lan giảm về 1 cùng ngày → được.
- Hạnh sửa giảm lần thứ 11 trong tháng → cảnh báo chủ đầu tư.

### 3.4 Việc theo vai

- ARC: mã từ chối và gợi ý trong hợp đồng 0.3.13 (`adjust`); trường "người ghi dòng gốc", "ngày nghiệp vụ ghi dòng gốc" (lưu trên dòng thay thế hoặc lần theo `relatedLineId`); mục mới trong dữ liệu đóng ca; truy vấn bộ lọc 7 ngày; mã lý do "Ghi nhầm" (NÊN).
- BE: `folio-lines.service.ts` `adjust` – nhánh FD/FDL; đếm cho cảnh báo BR-435.
- FE-A: nút Sửa trên dòng ngoài phạm vi (1) đổi thành "Gửi miễn có duyệt"; hiện chỉ dẫn khi máy chủ từ chối; đóng ca và bộ lọc.
- BA: cập nhật `rbac-matrix.md` A30/A31 (chú thích mới: sửa giảm theo BR-438), sổ tay mục sửa dòng.
- SEC: duyệt (plan mục SEC).

### 3.5 Ca kiểm QA

| Mã | Ca | Mong đợi | Oracle |
|---|---|---|---|
| T-16-1 | FD sửa giảm dòng mình nhập tay cùng ngày | Được; audit; có trong đóng ca; FOC tháng không đổi | BR-438-01 |
| T-16-2 | FD sửa giảm dòng FD khác ghi | 403 + gợi ý FOC; folio không đổi | BR-438-02 |
| T-16-3 | FD bỏ dòng mình ghi 23:50, lúc 00:20 và 06:10 | Được; bị chặn | BR-438-03 |
| T-16-4 | FD, FDL, MGR bỏ dòng hệ thống (trả muộn) | Chặn, chặn, được | BR-438-04 |
| T-16-5 | Chuỗi sửa tăng rồi bỏ | Theo dòng gốc | BR-438-05 |
| T-16-6 | Lần sửa giảm thứ 11 trong tháng | Cảnh báo chủ đầu tư | BR-438-06 |
| T-16-7 | FD giảm đơn giá F&B dòng của người khác | Chặn (giảm giá cũng là sửa giảm) | – |
| T-16-8 | FD tăng số lượng dòng người khác | Được (không thuộc BR-438) | – |
| T-16-9 | Folio `settled`, FD sửa dòng mình vừa ghi | Chặn như hiện nay (A32) | – |
| T-16-10 | Bộ lọc "Sửa giảm dòng – 7 ngày": quản lý thấy, FD không thấy | Đúng vai | – |

---

## 4. V5-30 – H2 hoa hồng theo bảng nội bộ: cấu trúc

Chỉ cấu trúc. Số thật chỉ có trên Desk do chủ đầu tư nhập. Mã, seed, migration, fixtures, test, ví dụ API, mô tả PR, commit, ảnh chụp: không số thật, chỉ `test_rate_*` (SEC G3, G4; FB-R4-SEC-BE-01).

### 4.1 Các trường (tham số; tên đề xuất)

| Khóa | Dạng | Ai nhập | Hiệu lực | Áp cho |
|---|---|---|---|---|
| `short_stay_commission_pct` (có sẵn) | `{"staff": %, "collaborator": %}` – nhập cùng một số | Chủ đầu tư | Theo ngày (BR-006); đơn chụp tỷ lệ lúc tạo | Đơn ngắn ngày |
| `long_stay_commission` (mới) | `{"bands":[{"fromMonths","toMonths" hoặc null,"vnPct","foreignPct"}],"firstInstalmentPct"}` | Chủ đầu tư | Theo ngày; HĐ chụp lúc ký | HĐ thuê tháng |
| `manager_performance_bonus_pct` (mới) | % | Chủ đầu tư | Tỷ lệ hiệu lực ngày 1 áp cả tháng | Thưởng quản lý |
| `commission_payable_day`, `commission_pay_by_day` (có sẵn) | ngày trong tháng | Chủ đầu tư | Theo ngày | Lịch chi gộp |

Kiểm khi lưu: tỷ lệ 0–100, tối đa 2 chữ số thập phân; các khoảng kỳ hạn liền nhau từ 1 tháng, không chồng, khoảng cuối `toMonths` = null; Desk không cho lưu nếu còn kỳ hạn không thuộc khoảng nào. **Mã không có số mặc định** cho mọi khóa trên. Thiếu giá trị → Desk báo "Chưa có tỷ lệ hoa hồng" trên đơn/HĐ và màn Hoa hồng; không tạo bản ghi 0, không dùng số cũ.

Bản ghi `commission` (đã có `rate_pct_snapshot`, `base_amount_vnd`, `amount_vnd`, `status`, `payee_type`): ARC thêm loại bản ghi (ngắn ngày / thuê tháng đợt 1 / thuê tháng đợt 2 / thưởng quản lý) và kỳ (tháng) cho thưởng. `payee_type` thêm `manager` hoặc bảng riêng cho thưởng – ARC chọn.

### 4.2 Cơ sở tính và mốc "đạt"

**Ngắn ngày (BR-903):**

1. Cơ sở = Σ dòng sống `room` + `extra_person` của đơn, sau FOC/giảm giá đặc biệt. Không gồm phụ thu nhận sớm/trả muộn, minibar, F&B, dịch vụ, phạt.
2. Hủy hoặc không đến mà OTTIMO giữ tiền: cơ sở = số giữ lại (dòng `cancellation_fee`, `no_show_fee`). Phí trả phòng sớm không tính; trả sớm thì cơ sở là các đêm đã ở. [GIẢ ĐỊNH – chờ INV xác nhận, ESC-051 câu 1 A]
3. Người hưởng = người chốt có vai sale (`staff`) hoặc CTV (`agent`), ghi trên đơn **trước lúc nhận phòng**. Ghi hoặc đổi sau → không có hoa hồng. Chỉ chủ đầu tư sửa nhầm được, có lý do, có audit.
4. "Đạt" như hiện nay: sự kiện sau cùng của trả phòng, đối soát tiền người hưởng ghi (BR-527), thu xong công nợ (BR-525). Hủy/không đến: khi tiền giữ lại đã đối soát.

**Thuê tháng (BR-212):**

1. Tỷ lệ = khoảng chứa kỳ hạn HĐ × khách VN/NN (BR-009). Kỳ hạn không có dòng riêng: dòng ngắn hơn liền kề, dài hơn dòng cuối thì dòng cuối. [GIẢ ĐỊNH – chờ INV xác nhận, ESC-051 câu 2 A]
2. Cơ sở = tiền thuê tháng sau giảm kỳ hạn (BR-203) × số tháng HĐ. Không gồm ký quỹ, phí dịch vụ, dọn, điện nước.
3. Đợt 1 = `firstInstalmentPct` × hoa hồng HĐ; "đạt" khi khách đã nhận căn **và** đã trả đủ ký quỹ cùng kỳ thu đầu (đã đối soát). [GIẢ ĐỊNH – chờ INV xác nhận, ESC-051 câu 4 A]
4. Đợt 2 = phần còn lại; "đạt" khi khách trả tiền thuê tháng thứ 2. HĐ chấm dứt trước đó → đợt 2 `void`, lý do "chấm dứt trước hạn".
5. Người hưởng = sale hoặc CTV ghi trên HĐ lúc ký.

**Thưởng quản lý:**

1. Thưởng tháng M = `manager_performance_bonus_pct` × doanh thu phòng tháng M đã thu. Định nghĩa theo ESC-051 câu 3 A [GIẢ ĐỊNH – chờ INV xác nhận]: K-06 của các đêm trong tháng (mọi nguồn, sau miễn, giảm), chỉ phần đã thu tới ngày chốt; phần thu sau cộng vào tháng thu được.
2. Người hưởng = tài khoản có vai quản lý trong tháng. Tháng có hơn một quản lý: Desk không tự chia, hiện số chung để chủ đầu tư chia.

### 4.3 Làm tròn

- Từng bản ghi: đúng đồng (làm tròn tới 1 đồng, nửa lên), để tổng khớp phân bổ theo đêm (BR-903 v0.3.2).
- Tổng chi kỳ của mỗi người nhận (hoa hồng và thưởng): làm tròn **1.000 gần nhất** ở kỳ chi.
- Điều chỉnh sau khi đã chi (khách được hoàn tiền): trừ vào kỳ sau, không sửa bản ghi đã chi (BR-008, BR-212).

### 4.4 Ai xem được

| Dữ liệu | Chủ đầu tư | Quản lý | Sale, CTV | Vai khác |
|---|---|---|---|---|
| Tỷ lệ cấu hình (các khóa ở 4.1) | Xem, sửa (A102) | Không sửa | Không | Không |
| Hoa hồng từng đơn/HĐ, tổng | Mọi người | Mọi người (A60) | Của mình | Không |
| Thưởng quản lý | Có | Của mình | Không | Không |

Ảnh chụp, báo cáo QA trên môi trường đã nhập bảng thật: che số (G4).

### 4.5 Ví dụ (không có số hoa hồng)

- Đơn sale căn 202, 3 đêm × 800.000, 3 người lớn (định mức 2), phụ thu người 3 × 150.000, có phụ thu trả muộn → cơ sở **2.850.000** (không tính trả muộn). Hoa hồng = tỷ lệ chủ đầu tư nhập × 2.850.000.
- Cùng đơn, hủy trước 5 ngày, cọc 700.000, giữ 350.000 → cơ sở **350.000** (giả định câu 1 A).
- HĐ căn 203, khách VN, kỳ hạn 6 tháng, tiền thuê sau giảm theo BR-203 → cơ sở = tiền thuê × 6; tỷ lệ = `vnPct` của khoảng chứa 6 tháng.

### 4.6 Ca kiểm QA (dùng `test_rate_short`, `test_rate_long_vn`, `test_rate_long_foreign`, `test_rate_first`, `test_rate_bonus` – số do QA tự đặt, ghi rõ là số thử)

| Mã | Ca | Mong đợi |
|---|---|---|
| T-30-1 | Chưa nhập khóa | Đơn/HĐ hiện "Chưa có tỷ lệ hoa hồng", không có bản ghi 0 |
| T-30-2 | Đơn sale như 4.5 | Cơ sở 2.850.000; số = `test_rate_short` × 2.850.000, đúng đồng |
| T-30-3 | Người chốt thêm sau nhận phòng | Không có hoa hồng; chủ đầu tư sửa nhầm có lý do → có |
| T-30-4 | Hủy giữ 350.000; trả sớm | Cơ sở 350.000; trả sớm chỉ các đêm đã ở |
| T-30-5 | HĐ khách VN và khách NN cùng kỳ hạn | Lấy `vnPct`/`foreignPct` đúng khoảng |
| T-30-6 | Kỳ hạn rơi vào chỗ bảng không có dòng | Desk không cho lưu bảng có chỗ hở; với bảng liền nhau, lấy đúng khoảng |
| T-30-7 | Đợt 1 khi nhận căn chưa trả kỳ đầu; trả xong | Chưa đạt; đạt ngày đối soát |
| T-30-8 | HĐ chấm dứt trước tháng 2 | Đợt 2 `void` có lý do |
| T-30-9 | Đổi tỷ lệ giữa tháng | Đơn/HĐ cũ giữ tỷ lệ chụp; thưởng dùng tỷ lệ ngày 1 |
| T-30-10 | Tổng kỳ của một người lẻ đồng | Làm tròn 1.000 khi chi |
| T-30-11 | Vai FD, HK, MT gọi API hoa hồng; sale xem của người khác | 403 / chỉ của mình |
| T-30-12 | Quét repo, PR, ảnh | Không số thật (job `confidential-paths`, mẫu PR G4) |

---

## 5. V5-31 – H3 phí dọn theo lượt cho khách thuê tháng

### 5.1 Luật (BR-204, BR-506 v0.5.12)

1. Khóa mới `long_stay_cleaning_fee_by_room`: `{"số căn": VND mỗi lượt}`, chủ đầu tư/quản lý nhập, có ngày hiệu lực. Mã không có số mặc định.
   - Theo **số căn**, không theo tên hạng: `public_room_type` là chữ tự do và Desk gộp City với Garden ở một nhóm, nên không dùng làm khóa.
2. Khách **thuê tháng** (lượt lưu trú của HĐ thuê tháng, `stayType` dài hạn): một lượt dọn = số của căn trong khóa.
3. Giá chụp lúc khách gửi "Dọn thêm" hoặc lúc lễ tân tạo việc dọn có phí (BR-006). Đổi khóa sau đó không đổi yêu cầu đã gửi.
4. Căn chưa có trong khóa (hoặc khóa trống): tạm dùng `adhoc_cleaning_fee`, Desk báo "Chưa có phí dọn thuê tháng cho căn này" để lễ tân thêm dòng phần chênh như hiện nay.
5. HĐ nhập tay chạy trước khi dùng app (US-017 AC5a) giữ `adhoc_cleaning_fee` (Q-D1).
6. Lịch dọn cố định (US-056): phí/tháng = lượt/tuần × 52/12 × giá lượt của căn, làm tròn 1.000.
7. Khách ngắn ngày không đổi: BR-506 (dọn bù miễn phí, lần dọn đầy đủ thứ hai trong ngày theo `adhoc_cleaning_fee`).
8. Thời điểm ghi folio giữ (s1)/(s2) của BR-506.

Giá trong khóa là **giá dịch vụ công khai** của bảng 01/11 mục 4, đã có ở BR-204: Studio City 100.000 · Studio Garden 120.000 · Premium 130.000 · Signature 150.000. Phần chia cho người dọn là nội bộ, không thuộc khóa này.

### 5.2 Ví dụ số

- Căn 101 (Studio City) gọi dọn 3 lần trong tháng → **300.000**.
- Căn 203 (Studio Garden) 3 lần → **360.000** (v1.0.4 ghi 300.000, lễ tân thêm 60.000).
- Căn 401 (Signature) 1 lần → **150.000**.
- Lịch cố định căn 202, 2 lượt/tuần → 2 × 52/12 × 120.000 = **1.040.000**/tháng (BR-204).
- Căn chưa có trong khóa → **100.000** kèm báo.

### 5.3 Việc theo vai

- ARC: khóa mới trong danh mục tham số (kiểu bản đồ số căn → VND, kiểm số căn có trong Danh mục căn, bội 1.000, 0–5.000.000).
- BE: `guest-requests.service.ts` `cleaningFee` – nhánh dài hạn đọc khóa theo số căn; danh mục phát sinh Desk dùng cùng giá; cờ báo khi thiếu.
- FE-A: màn Tham số nhập khóa; câu báo thiếu; giá trên trang khách thuê tháng.
- UXD/CPY: câu báo và giá hiện cho khách (theo brand guideline).

### 5.4 Ca kiểm QA

| Mã | Ca | Mong đợi | Oracle |
|---|---|---|---|
| T-31-1 | Khách thuê tháng 101, 203, 401 | 100.000; 120.000; 150.000 mỗi lượt | BR-506-04 |
| T-31-2 | Căn chưa có trong khóa | 100.000 + câu báo | BR-506-04 |
| T-31-3 | HĐ nhập tay cũ | 100.000, không câu báo | BR-506-04 |
| T-31-4 | Khách ngắn ngày 203, lần dọn đầy đủ thứ hai | 100.000 | BR-506-04 |
| T-31-5 | Gửi yêu cầu, sau đó đổi khóa, rồi dọn xong | Ghi giá lúc gửi | – |
| T-31-6 | Trang khách thuê tháng căn 203 | Hiện 120.000 trước khi gửi | – |
| T-31-7 | Lịch dọn cố định 2 lượt/tuần căn 202 | 1.040.000/tháng | – |

---

## 6. Giả định dùng trong tệp này

1. [GIẢ ĐỊNH – chờ INV xác nhận] ESC-051 câu 1–4 theo phương án A.
2. Tên khóa `long_stay_cleaning_fee_by_room`, `long_stay_commission`, `manager_performance_bonus_pct`, mã lỗi 409/403/422 và tên trường gợi ý: đề xuất, ARC chốt.
3. Bảng nội bộ cộng tỷ lệ đợt 1 và đợt 2 bằng 100 % hoa hồng HĐ (đợt 2 = phần còn lại).
4. Ngưỡng cảnh báo sửa giảm dùng chung `foc_alert_count_per_approver` (10, INV-007); chủ đầu tư đổi được trên Desk.

---

## 7. Trả lời ARC – hợp đồng 0.3.13-draft (PR #94, `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 3)

Nguyên tắc: hai hướng ngang nhau thì chọn hướng không cần migration (QC R4 ĐK-2). Chỉ V5-30 và V5-31 cần migration, và cả hai gộp vào **một** migration chỉ thêm dòng danh mục, không giá trị.

### 7.1 V5-15 – trả phòng đơn đã quá ngày đi

**Chốt:** đồng ý **chỉ OWN/MGR** ở v1.0.5, không làm "lễ tân ghi, quản lý hậu kiểm". Không migration.

Lý do nghiệp vụ:
- Đây là đường làm giảm đêm bán so với gia hạn. Nếu lễ tân ghi được ngày rời lùi, đó là chỗ giấu tiền khách ở thêm.
- Ca hiếm ở 10 căn, và quản lý làm được trên điện thoại.
- Trong lúc chờ quản lý, không ai mất tiền: căn vẫn "Đang ở"; buồng phòng vẫn bấm **Cần dọn**; khách mới thì đổi căn.

Kèm theo (không đổi hợp đồng):
1. `overdueReason`: Desk gợi ý 3 lý do – "Khách đi không báo", "Lễ tân quên bấm Trả phòng", "Khác (ghi rõ)". Máy chủ vẫn nhận chữ tự do.
2. Khai báo tạm trú ghi **ngày khách rời thật** (`checkoutAt`), không ghi ngày Desk ghi nhận (BR-010, BR-602). BA thêm câu này vào sổ tay.
3. Phụ thu trả muộn tính theo `checkoutAt`, như ARC ghi. Khách ở thêm đêm thì gia hạn B13 trước. Cả hai đúng BR-421, BR-413.
4. Xem lại hướng hậu kiểm ở v1.0.6 chỉ khi một tháng có trên 2 ca phải chờ quản lý quá 2 giờ (QA/DATA đếm trên audit `after.overdue`).

### 7.2 V5-16 – phần chặn theo vai

**Chốt:** chọn **(a)** như SEC đề xuất, thêm phần báo cáo (b). Luật đầy đủ ở BR-438 và mục 3 trên. ARC làm bổ sung 1 với 403 `FORBIDDEN_ACTION` + `requiredFlow: foc_request`. Bốn điểm khác bản nháp ARC:

1. **Phạm vi là mọi lần sửa giảm**, không chỉ bỏ hoặc giảm về 0: giảm số lượng một phần và giảm đơn giá cũng tính. Lý do: thu tiền mặt 3 lon rồi sửa còn 1 thất thoát giống hệt bỏ dòng. Bộ lọc tuần của quản lý cần thêm tham số lọc mọi lần giảm (`after.amountVnd < before.amountVnd`, ví dụ `reductionsOnly`), bên cạnh `removalsOnly`. Không migration (lọc jsonb).
2. **"Của mình" và "cùng ngày" xét trên dòng gốc**, tức dòng đầu của chuỗi `relatedLineId`. `before.postedByActor` và `before.sameBusinessDay` tính theo người ghi và ngày nghiệp vụ ghi của dòng gốc, không theo dòng thay thế. Không làm vậy thì lách được bằng cách sửa tăng dòng người khác rồi bỏ dòng thay thế (BR-438-05).
3. **Chỉ dòng nhập tay** (`source = manual`) mới là "của mình". Dòng hệ thống tự ghi luôn đi FOC, dù người bấm thao tác sinh dòng là chính lễ tân đó: phụ thu nhận sớm/trả muộn, phí giữ lại, phí dọn từ yêu cầu khách (BR-438-04).
4. **Cảnh báo theo người làm** (BR-438 (4)(iii)): thêm một `check` vào nguồn "Cần chú ý" `foc_threshold`, vốn tính lúc đọc, không lưu kind (ví dụ `check: line_reduction_count`, `count`, `max` = `foc_alert_count_per_approver`). Không migration.
   - Danh sách đóng ca (4)(i): làm ở v1.0.5 nếu dữ liệu bàn giao ca được tính lúc đọc từ audit. Nếu phải lưu kind mới thì dời sang v1.0.6; tới đó bộ lọc tuần là đủ.

### 7.3 V5-30 – cấu trúc H2 và khi thiếu tỷ lệ

**Chốt cấu trúc** (mục 4; không số):

| Khóa | Kiểu | Chiều | Ghi chú |
|---|---|---|---|
| `short_stay_commission_pct` (giữ) | `{"staff": %, "collaborator": %}` | Không chia theo kênh: chỉ đơn có người chốt sale/CTV mới có hoa hồng; đơn OTA, khách vãng lai → `not_applicable` | Bảng có một mức: chủ đầu tư nhập cùng số cho hai khóa con |
| `long_stay_commission` (mới) | `{"bands":[{"fromMonths","toMonths"\|null,"vnPct","foreignPct"}],"firstInstalmentPct"}` | Khoảng kỳ hạn × khách VN/NN; một mức cho sale và CTV | Thay `lease_terms[].commissionStaffPct/commissionCollaboratorPct`: bỏ khỏi mặc định, mã không còn đọc |
| `manager_performance_bonus_pct` (mới) | % | Theo tháng | Tỷ lệ hiệu lực ngày 1 áp cả tháng |

Mốc chi: ngắn ngày một lần (mốc "đạt" BR-903). Thuê tháng hai đợt (`firstInstalmentPct`, phần còn lại ở đợt 2).

**Chốt khi thiếu tỷ lệ lúc chốt đơn:** đồng ý đề xuất ARC.
- Không tạo dòng `commission`; `status = rate_missing`.
- "Cần chú ý" cho OWN dạng nguồn tính lúc đọc: "n đơn/HĐ chưa có tỷ lệ hoa hồng", có link. Không thông báo đẩy, nên không cần kind mới.
- Khi đã có tỷ lệ, lần đồng bộ hoa hồng kế tiếp tạo bản ghi. Tỷ lệ = tỷ lệ chụp lúc tạo đơn/ký HĐ nếu có, không có thì tỷ lệ hiệu lực ngày đồng bộ (như `syncCommission` hiện nay). Desk không cho đặt "Hiệu lực từ" lùi ngày, nên tra theo ngày đến sẽ không bao giờ tìm thấy tỷ lệ.

**Chốt thưởng quản lý:** **tính lúc đọc**, không lưu bản ghi ở v1.0.5. Màn Hoa hồng có dòng "Thưởng hiệu suất tháng M" (cơ sở, tỷ lệ, số), chủ đầu tư thấy, quản lý thấy của mình. Chi ngoài Desk theo kỳ lương. Lý do: bảng `commission` có CHECK `payee_type` (agent, staff) và CHECK "đúng một trong đơn/HĐ"; lưu thưởng ở đó phải đổi CHECK, tức migration lớn hơn. Lưu bản ghi thưởng để sau.

**Chốt migration:** một migration chỉ thêm dòng danh mục cho `long_stay_commission`, `manager_performance_bonus_pct` (và `long_stay_cleaning_fee_by_room` ở 7.4), không giá trị. Có thể ARC cần cột phân biệt đợt 1/đợt 2 trên `commission` cho HĐ; nếu cần thì gộp vào cùng migration.
- Hướng không migration (nhét tỷ lệ thuê tháng vào các dòng `lease_terms`) **không** ngang: nó buộc khoảng hoa hồng vào khoảng giảm giá. Chủ đầu tư sửa bảng giảm giá là hoa hồng đổi theo mà không ai báo. Và thưởng quản lý vẫn không có chỗ.
- Nếu diễn tập khôi phục (V5-61) chưa xong khi cắt v1.0.5: bản lên không có migration này. Phần làm ngay của ARC vẫn lên (bỏ số mặc định, `rate_missing`, `missing[]`, cơ sở ngắn ngày theo 4.2). Hai khóa mới và H3 đi bản sửa riêng trước 01/12, theo quy tắc 25/11 của plan. Tới đó: hoa hồng thuê tháng và thưởng chủ đầu tư tính ngoài Desk như hiện nay.

### 7.4 V5-31 – khóa phí dọn thuê tháng

**Chốt:** khóa mới `long_stay_cleaning_fee_by_room`, theo số căn (mục 5), gộp vào cùng migration danh mục ở 7.3.
- Không có hướng không migration ngang: `adhoc_cleaning_fee` là một số, đổi kiểu sẽ vỡ mọi chỗ đang đọc; danh mục phát sinh dựng từ khóa tham số.
- Tới khi lên: lễ tân thêm dòng phần chênh như hiện nay (BR-204).

### 7.5 V5-58 – FD đọc Wi-Fi trên Desk

**Chốt:** **FD đọc được** (chỉ `getPropertyWifi`), sửa vẫn chỉ OWN/MGR. Đổi nhỏ, không migration. BA sửa rbac S24/A101; SEC xác nhận.

Lý do nghiệp vụ:
- OTTIMO có **một mạng chung** cho khách (ESC-022 B). Mật khẩu đã ở trên thẻ trong căn, trên trang khách và trong tin chào: mọi khách đều có.
- Ca làm hằng ngày ở quầy cần đọc được mật khẩu:
  - khách nước ngoài không có dữ liệu di động cần Wi-Fi mới mở được link trang khách;
  - khách hỏi lại khi thẻ trong căn bị mất;
  - khách vãng lai, đơn OTA chưa có link.
- Ở OTTIMO lễ tân thường trực một mình. Nếu không đọc được, lễ tân phải gọi quản lý hoặc vào căn đọc thẻ, hoặc chép mật khẩu ra giấy dán quầy. Giấy dán quầy còn lộ hơn.
- Giữ `no-store`, không ghi mật khẩu vào audit. Đề nghị OPS/SEC: máy Desk và thiết bị văn phòng dùng mạng tách khỏi mạng khách, nếu chưa tách.

### 7.6 V5-11 – luật cho ARC review

**Chốt:** luật ở mục 2 và BR-428, BR-010, BR-309 (viii), BR-311 v0.5.12. Đồng ý dùng 409 `INVALID_TRANSITION` đã có, không thêm mã mới, thêm `extras`:
- `minNewDepartureDate` = ngày lịch (D+1);
- `useCheckout: true` khi ngày đi của đơn = ngày lịch.

Điều kiện 00:00–05:59 xét trước các kiểm tra ngày khác, áp cả `dryRun`. Dòng phí giữ lại lấy `serviceDate` = ngày nghiệp vụ, không đổi hợp đồng. Không migration.
