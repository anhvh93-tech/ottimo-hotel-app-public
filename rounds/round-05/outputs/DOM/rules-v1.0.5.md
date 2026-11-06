# Luật nghiệp vụ cho v1.0.5 – V5-1A, V5-11, V5-16, V5-30, V5-31, V5-25 (`min_stay`); trả lời ARC, UXD, CPY

- Tác giả: DOM | Round 5 – v1.0.5 | Bước: Sản xuất (Gói 0) | Ngày: 06/11/2026
- Sửa: DOM | Bước: Phản hồi & sửa | 06/11/2026 khuya – theo QA `rounds/round-05/qa/bug-list.md` (BUG-R5-002, BUG-R5-003, commit `233b9b5d`): mục 11.2 bỏ câu "J1 đứng thì Xác nhận đã nhận cọc", thêm chữ thay cho Tờ 2a dòng 86; mục 11.3 tách "dòng tay" với "khoản thu"; mục 11.4 viết lại theo V5-5B (dùng lại `recordPayment`); **mục 12 mới**: luật kiểm khi lưu `min_stay` cho V5-25. Bổ sung 06/11 (thẻ SEC `FB-R5-SEC-DOM-B002-04`): mục 11.4 – 2(c) ảnh thông báo tiền vào tài khoản OTTIMO, 3 hoàn về đúng tài khoản đã chuyển, 3a mã giao dịch và S4, 3b lỡ ghi hai lần. Bổ sung 06/11 (ARC hợp đồng 0.3.13, PR #94): mục 1.2 ý 6 biên trên cảnh báo giá đêm ÷ 5 (G9); mục 2.1 ý 3 không có nút Trả sớm trong W cho lượt đi hôm nay; mục 7.1 ngày nghiệp vụ lúc bấm và ngày đi hiệu lực của lượt gia hạn. Review PR #96 (06/11): **mục 13 mới** – biên khi lưu 11 khóa có cấu trúc khác và `damage_catalog`, giá trị hỏng trong DB bỏ qua hay chặn, `short_stay_max_nights` 27 hay 29; mục 3.4, 3.6 xác nhận cách Desk của UXD 9.5 cho V5-16.
- Người đọc: ARC (hợp đồng 0.3.13), BE, FE-A, BA, QA, SEC, DATA.
- Nguồn sự thật: `product/docs/business-rules.md` **v0.5.13** (BR-010, BR-101, BR-204, BR-212, BR-303, BR-309, BR-311, BR-428, BR-438 mới, BR-506, BR-903, mục 13); `product/docs/tham-so-quy-tac.md` bản 1.3; oracle `product/tests/fixtures/br-examples.json`. Tệp này giải thích và gom ca kiểm, không thay BR.
- **Không có tỷ lệ, số tiền hoa hồng hay thưởng, hay ranh giới khoảng kỳ hạn của bảng nội bộ** trong tệp này. Ca kiểm hoa hồng dùng tham số thử `test_rate_*` (SEC G3).
- Tên khóa, mã lỗi, tên trường dưới đây là **đề xuất**; ARC chốt ở hợp đồng 0.3.13. ARC đổi tên thì DOM đồng bộ BR và từ điển.

## 0. Tóm tắt

| Mục | Luật chốt | INV quyết? |
|---|---|---|
| V5-1A | Giá đêm bắt buộc ở mọi đường ghi giá; thiếu → 422. Tới khi lên: khóa `night_from_month_divisor` **còn tác dụng** ở đường API, giữ 12, không sửa. Cảnh báo giá đêm khác thường: < giá tháng ÷ 30 hoặc > ÷ 5, không chặn (mục 1.2 ý 6, G9) | Không (NGÀNH) |
| V5-11 | 00:00–05:59: đêm của ngày nghiệp vụ là đêm đã ở; Ngày rời mới của Trả sớm tối thiểu = ngày lịch, gửi ngày hôm trước → 409; dòng phí giữ lại mang ngày nghiệp vụ | Không (NGÀNH, luật DOM 04/11) |
| V5-16 | **Chọn đề xuất SEC (a), thêm báo cáo (b)** → BR-438 | Không (NGÀNH); hạn mức duyệt vẫn là ESC-007 |
| V5-30 | Chỉ chốt cấu trúc H2. 4 điểm bảng nội bộ chưa rõ → **ESC-051**, tới khi trả lời áp phương án A | **Có – ESC-051** |
| V5-31 | Giá lượt dọn khách thuê tháng theo căn, khóa mới, INV nhập; thiếu → phí dọn lẻ kèm báo | Không (giá đã có ở bảng 01/11) |
| V5-15 (SEC ARC-03) | Quản lý tự trả phòng đơn quá ngày đi khi bỏ ≤ 1 đêm; từ 2 đêm chỉ chủ đầu tư; audit `nightsNotBilled`, lọc `overdueOnly` (mục 7.1) | Không (theo hạn mức ESC-007 A) |
| UXD bảng chữ | G6 dùng chung câu cho `penalty` và `damage`; `hold_expiry_reminder_hours` = 0 là không nhắc; 29 tên tham số đúng; `weekend_nights` dạng mã thứ; thẻ FB-R5-DOM-UXD-01 (mục 8) | Không |
| Tin tự hủy giữ chỗ | Gửi thêm lễ tân, lễ tân trưởng (mục 9) | Không (NGÀNH) |
| CPY thẻ 04 | Nhãn `late_fee_after_limit` khi số tiền khác `limit_ref_vnd` (mục 10) | Không |
| Tiền về mà giữ chỗ đã tự hủy | Kiểm tiền theo mã đơn trước khi hủy hoặc báo khách; đặt lại nếu còn căn, không thì chủ đầu tư hoàn đủ; lỗi phần mềm cho QA, việc BE (mục 11). **Sửa 06/11 khuya:** giữ chỗ quá hạn mà Desk chưa tự hủy thì chỉ còn Hủy giữ chỗ, không mở nút xác nhận cọc; V5-5B dùng lại `recordPayment` cho mọi đơn đã đóng, chỉ chuyển khoản/VietQR, ảnh bắt buộc | Không (NGÀNH) |
| V5-25 `min_stay` (BUG-R5-003) | Chỉ nhận danh sách luật; mỗi luật: `nights` nguyên 1–7 và ≤ `short_stay_max_nights`, `channels` = `"all"` hoặc tập con của `direct`, `agent`, `ota`, áp vào ít nhất một ngày; `[]` = không có ở tối thiểu, cho lưu; giá trị production hiện tại hợp lệ (mục 12) | Không (NGÀNH; mức 2 đêm vẫn là INV-004) |
| V5-25 khóa khác, `damage_catalog` (PR #96) | Chốt biên của BE, sửa 3 chỗ: phần trăm tối đa 2 chữ số thập phân; `max_open_holds_per_user` đủ hai vai; `cancel_policy_direct` không rỗng. `damage_catalog`: ≤ 100 món, giá 1.000–20.000.000. Hỏng trong DB: bỏ qua ở bán, Hôm nay, bảng đền bù; chặn rõ ở tính hoàn, phụ thu, giới hạn giữ chỗ. `short_stay_max_nights` đúng là 29 (mục 13) | Không (NGÀNH) |

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
6. **Cảnh báo giá đêm khác thường** (G9 hợp đồng 0.3.13, DOM chốt 06/11): máy chủ trả `NIGHTLY_PRICE_UNUSUAL`, **không chặn**, khi giá đêm < giá tháng **÷ 30** (biên dưới, BR-101 (4) như Desk đang kiểm) hoặc > giá tháng **÷ 5** (biên trên; ARC giả định ÷ 3, DOM chọn ÷ 5).
   - So bằng số nguyên: giá đêm × 30 < giá tháng, hoặc giá đêm × 5 > giá tháng. Đúng bằng biên thì không cảnh báo.
   - Giá tháng là giá tháng của cùng căn, cùng ngày hiệu lực với giá đêm đang lưu. Hai biên là hằng số, không thêm tham số (thêm khóa phải có migration).
   - Vì sao ÷ 5, không ÷ 3: cảnh báo để bắt lỗi gõ (thừa số 0, gõ giá tháng vào ô giá đêm, sai một chữ số). Giá hiện hành bằng giá tháng ÷ 10,4–11,3. Biên ÷ 5 còn cách hơn gấp đôi, nên không kêu khi chủ đầu tư đổi giá bình thường. Biên ÷ 3 bỏ sót lỗi như gõ 2.800.000 thay 800.000 cho căn giá tháng 8.500.000. Với một cơ sở bán cả dài hạn, 5 đêm đắt hơn một tháng thuê đã là bất thường.
   - Chữ cảnh báo: UXD viết, ví dụ "Giá đêm khác thường so với giá tháng. Kiểm lại trước khi lưu."

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
| T-1A-8 | Căn giá tháng 8.500.000: lưu giá đêm 283.000; 284.000; 1.700.000; 1.701.000; 8.000.000 | Cảnh báo; không; không; cảnh báo; cảnh báo. Cả năm ca đều lưu được (200), đọc lại đúng số đã gửi | BR-101 (4) |

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
   - Trong W, lượt có ngày đi hiệu lực = ngày lịch D+1 **không có nút Trả sớm**: Desk chỉ hiện Trả phòng. Lệnh trả sớm gửi thẳng → 409 `INVALID_TRANSITION` kèm `useCheckout: true`, đơn và folio không đổi (hợp đồng 0.3.13 mục 1.21; câu này đã thêm vào BR-428).
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
- FE-A: theo UXD copy 1.5 mục 9.5 (DOM xác nhận ở 3.6): hộp Điều chỉnh giữ lối sửa, có câu phụ báo luật; máy chủ từ chối thì hiện chỉ dẫn và nút "Gửi miễn có duyệt" (form miễn phí điền sẵn); đóng ca và bộ lọc. Gợi ý cũ "đổi nút Sửa trên dòng ngoài phạm vi" bỏ, vì Desk chưa biết trước dòng nào ngoài phạm vi.
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
| T-16-11 | FD bấm Điều chỉnh giảm dòng FD khác ghi → 403 → bấm Gửi miễn có duyệt | Form miễn phí mở cho đúng dòng, Số tiền = số cũ − số mới; folio không đổi tới khi FOC được áp | – |

### 3.6 Cách Desk báo luật – xác nhận UXD copy 1.5 mục 9.5 (06/11)

**Có, đủ cho v1.0.5.** Chốt kiểm soát nằm ở máy chủ (403 `requiredFlow = foc_request`, folio không đổi), nên Desk không cần biết trước. Lễ tân tốn thêm một lần bấm ở ca hiếm (sửa giảm dòng không phải của mình hôm nay), và form miễn phí điền sẵn số nên không gõ lại.

Điều kiện: 403 không ghi gì nửa chừng; form điền sẵn không quá `foc.max`; câu chỉ dẫn không lộ mã kỹ thuật (UXD đã ghi).

Desk biết trước (ẩn hay đổi nút trên đúng dòng) là việc cho **hợp đồng 0.3.14**, mức nên có (B-QUAY): `FolioLine` thêm nguồn nhập tay, ngày nghiệp vụ ghi và dòng gốc, hoặc một cờ `allowedActions` cho sửa giảm. Không chặn v1.0.5.

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
3. Phụ thu trả muộn tính theo `checkoutAt`, như ARC ghi. Khách ở thêm đêm thì gia hạn B13 trước. Cả hai đúng BR-412 (phụ thu trả muộn), BR-421 (gia hạn).
4. Xem lại hướng hậu kiểm ở v1.0.6 chỉ khi một tháng có trên 2 ca phải chờ quản lý quá 2 giờ (QA/DATA đếm trên audit `after.overdue`).

**Bổ sung theo SEC FB-R5-SEC-ARC-03 (06/11 tối) – kiểm soát với chính quản lý:**

**Chốt:** chọn **(a)**. Quản lý tự trả phòng đơn quá ngày đi khi `nightsNotBilled` ≤ 1. Từ 2 đêm trở lên thì **chỉ chủ đầu tư**. Không thêm bước nhập lại mật khẩu. Đồng ý SEC mục 1, 2, 4: audit ghi `nightsNotBilled`; bộ lọc `overdueOnly` "Trả phòng quá ngày đi – tuần này" (OWN thấy mọi bản ghi, MGR thấy bản ghi của MGR khác); `overdueReason` qua cùng hàm đọc chữ với `checkoutTimeNote`. Không migration.

Lý do chọn (a), không chọn (b):
- Chủ đầu tư đã chốt hạn mức quản lý: miễn tối đa **giá 1 đêm mỗi lần** (ESC-007 A, BR-433). Ở đường cũ (gia hạn rồi FOC 100 %), quản lý tự miễn được 1 đêm; từ 2 đêm thì phải lên chủ đầu tư. (a) giữ đúng mức kiểm soát đó ở đường mới.
- Rủi ro SEC nêu là chính quản lý giấu đêm khách ở thêm. Nhập lại mật khẩu chỉ chứng minh đúng người bấm, không thêm người thứ hai.
- Ca thật ở 10 căn: khách đi sáng ngày đi, quầy quên bấm, buồng phòng vào căn và phát hiện trong ngày, tức 1 đêm. Quá từ 2 đêm là hiếm và đáng ngờ, đúng chỗ cần chủ đầu tư xem.
- Trong lúc chờ chủ đầu tư, không ai mất tiền (như trên). Chủ đầu tư làm được trên điện thoại.

Cách đếm và mã:
- `nightsNotBilled` = số đêm từ ngày đi của lượt tới ngày nghiệp vụ lúc ghi (BR-010).
  - Ví dụ: căn 202, ngày đi 10/11. Quản lý phát hiện lúc 09:00 ngày 11/11 → 1 đêm (đêm 10/11), quản lý ghi được. Phát hiện lúc 06:30 ngày 12/11 → 2 đêm → quản lý bị chặn, gọi chủ đầu tư. Phát hiện lúc 05:00 ngày 12/11: ngày nghiệp vụ còn là 11/11 → 1 đêm.
- **Ngày nghiệp vụ để đếm là của lúc bấm** (giờ máy chủ khi ghi, kể cả `dryRun`), không phải ngày của `checkoutAt`. Hợp đồng 0.3.13 đã viết đúng như vậy.
  - Lý do: `checkoutAt` là giờ người ghi tự khai, chính là số cần kiểm. Đếm theo nó thì người ghi tự chọn được mức trần. Đếm theo lúc bấm là số đêm căn đứng "Đang ở" mà chưa ai thu, đúng thứ chủ đầu tư cần xem.
  - `checkoutAt` vẫn dùng cho khai báo tạm trú, phụ thu trả muộn và mốc giữ chứng cứ (mục trên, hợp đồng 1.18).
- **Lượt có gia hạn:** "ngày đi" là **ngày đi hiệu lực của cả lượt** (`stayDepartureDate`), gồm phần gia hạn B13 và đơn con gia hạn của đơn OTA (BR-421, BR-422). Đơn gốc đã qua ngày đi mà phần gia hạn còn đêm thì lượt chưa quá ngày đi.
  - Ví dụ: căn 302, đơn Agoda đi 10/11, gia hạn 2 đêm bằng đơn con Trực tiếp 10–12/11. Ghi lúc 09:00 ngày 13/11 → 1 đêm, quản lý ghi được. Ghi lúc 09:00 ngày 11/11 → lượt chưa quá ngày đi, dùng Trả sớm hoặc Trả phòng như thường.
- Ngưỡng 1 là hằng số theo BR-433, không thêm tham số (thêm khóa phải có migration).
- Quản lý vượt ngưỡng: 403 `FORBIDDEN_ACTION`, folio và đơn không đổi. ARC chốt `extras`; DOM đề nghị `requiredRole: owner` và `nightsNotBilled`, để Desk viết "Quá 1 đêm: cần chủ đầu tư trả phòng." `dryRun` trả cùng kết quả.
- Gợi ý FE/UXD ở SEC mục 5 (hiện dấu hiệu sau ngày đi: yêu cầu từ trang khách, lần đếm minibar, kiểm phòng): DOM đồng ý, để v1.0.6.
- QA: T15-x quản lý, quá 1 đêm → ghi được, audit `nightsNotBilled = 1`; quản lý, quá 2 đêm → 403, không đổi gì; chủ đầu tư, quá 2 đêm → ghi được, audit `nightsNotBilled = 2`; lọc `overdueOnly` ra đúng hai bản ghi.

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

---

## 8. Trả lời UXD – bảng chữ v1.0.5 (`rounds/round-05/outputs/UXD/copy-v1.0.5.md`)

### 8.1 G6 – câu "không tính vào doanh thu phòng" (mục 4.3)

**Chốt:** hiện cho cả `penalty` và `damage`, dùng **chung một câu**. FE đổi điều kiện thành `item.category === 'penalty' || item.category === 'damage'`.

Lý do:
- Hai nhóm cùng là "Phạt & bồi thường" trong Doanh thu khác (K-07, `product/docs/metrics-definitions.md`), không vào doanh thu phòng (K-06).
- Khoản đền hư hỏng thường lớn, nên lễ tân dễ tưởng nó bù vào tiền phòng hơn cả phí phạt.
- Các nhóm khác (minibar, giặt, dọn lẻ, phí dịch vụ) cũng không phải doanh thu phòng, nhưng không cần câu này.

Chữ: bản UXD chỉ nói "phí phạt". DOM đề xuất, UXD và CPY chốt chữ:
- VI: "Phí phạt và tiền bồi thường hư hỏng không tính vào doanh thu phòng."
- EN: "Fines and damage charges don't count as room revenue."

### 8.2 `hold_expiry_reminder_hours = 0` (mục 4, `sale.hold_next_*`)

**Chốt:** 0 = **không nhắc**. Đã ghi vào từ điển bản 1.2.
- Mã: J2 tìm giữ chỗ hết hạn trong khoảng (bây giờ, bây giờ + 0 giờ], nên không có tin. Dòng "Giữ chỗ sắp hết hạn" ở Cần chú ý cũng không hiện (`hold-reminder-job.ts`; `attention-sources.ts`, `holdsExpiring`).
- Hết hạn vẫn như cũ: chưa cọc thì J1 tự hủy; có cọc một phần thì báo đỏ (`hold_overdue`, không đọc khóa này).
- Không nên đặt 0. Dòng "Giữ chỗ sắp hết hạn" là cách duy nhất quầy thấy trước giữ chỗ do sale, CTV tạo.

**FB-R5-DOM-UXD-01 (Major, gửi UXD, PO):** vế "Bạn sẽ được nhắc {hours} giờ trước khi hết hạn" ở `sale.hold_next_*`, `sale.hold_next_ctv_*`, `sale.hold_next_no_qr_*` **sai với v1.0.x, kể cả khi giá trị > 0**.
- Tin nhắc J2 chỉ gửi người tạo, người chốt, vào hộp thông báo của app nhân viên.
- Sale, CTV không dùng được app đó (`product/apps/mobile/src/app/session.ts`: vai sale, CTV không có màn nào).
- Desk không có hộp thông báo. Trang Hôm nay (nơi có Cần chú ý) chỉ mở cho OWN, MGR, FDL, FD (`product/apps/admin-web/src/session/nav.ts`).
- Kết quả: sale, CTV không nhận được nhắc nào. Câu hứa nhắc làm họ yên tâm chờ, rồi giữ chỗ tự hủy mà không ai báo khách.
- Đề xuất: bỏ vế nhắc ở cả ba biến thể, thay bằng giờ hạn. Ví dụ VI "Giữ chỗ hết hạn lúc {time}. Chưa nhận cọc thì Desk tự hủy." (UXD, CPY chốt chữ). Khi bỏ vế nhắc thì không cần câu riêng cho giá trị 0.
- Dòng thời gian của giữ chỗ (`hold_expires_at`) đã có trên đơn, nên câu không cần dữ liệu mới.

### 8.3 Tên 29 khóa `params.k.*` (V5-21, mục 2.1) và `c3_stepup_minutes` (mục 4.4)

**Chốt:** cả 29 tên đúng nghĩa, không có thẻ. DOM đã đưa vào từ điển bản 1.2, ghi "hiện từ v1.0.5; v1.0.4 hiện mã khóa".

Các điểm DOM kiểm kỹ:

| Khóa | Tên UXD | DOM |
|---|---|---|
| `rounding.deposit` | Làm tròn tiền cọc | Đúng. Chỉ cọc ngắn ngày (BR-305). Desk gọi tiền đảm bảo HĐ thuê tháng là "ký quỹ", nên không lẫn |
| `rounding.night_rate` | Làm tròn giá đêm | Đúng mã: giá đêm từ giá tháng, giá sau tăng hoặc giảm, giá một ngày khi tính lẻ thuê tháng. Phụ thu theo `rounding.fee`. Từ điển bản 1.1 ghi "giá đêm, phụ thu" là sai; đã sửa |
| `rate_floor_pct`, `rate_ceiling_pct` | Giá sàn / Giá trần (% giá gốc) | Đúng BR-105: theo giá đêm niêm yết, đơn OTA theo `ota_base_rate` nếu có |
| `long_stay_required_from_nights` | Bắt buộc thuê dài hạn từ | Đúng. Desk báo "thuê dài hạn" khi tới ngưỡng |
| `weekend_uplift_pct` | Tăng giá đêm cuối tuần | Đúng. UXD bỏ "thứ Sáu, thứ Bảy" là đúng, vì đêm nào là cuối tuần do `weekend_nights` quyết |
| `c3_stepup_minutes` | Thời gian xem giấy tờ, số tài khoản sau khi nhập lại mật khẩu | Đúng. Cửa C3 gồm cả xem đủ số tài khoản nhận hoàn (`c3-access-gate.ts`, `getRefundDestination`). Từ điển đổi tên, nghĩa và ảnh hưởng |

### 8.4 `weekend_nights` – dạng giá trị đúng (BUG-R5-001)

**Chốt nghiệp vụ:** dạng đúng là **mã thứ**: `["FRI","SAT"]` (đêm thứ Sáu, đêm thứ Bảy). Không dùng số 1–7.
- Đây là dạng bộ tính giá đọc (`pricing.ts`, kiểu `Weekday`), cũng là giá trị đang chạy trên production (`production-defaults.ts`) và trong DS-E.
- `min_stay.arrivalWeekdays` cũng dùng mã thứ.

Hiện trạng:
- Bộ kiểm khi lưu (`parameter-rules.ts` 180–187) chỉ nhận số 1–7. Lưu dạng đúng bị từ chối.
- Lưu dạng số thì qua kiểm, nhưng không đêm nào khớp: mức tăng cuối tuần mất mà không ai được báo.

DOM đề nghị ARC, BE sửa **bộ kiểm** cho nhận mã thứ, không đổi bộ tính giá sang số. Lý do: chỉ một chỗ sửa, không đổi giá trị đang chạy, không migration. Đổi sang số thì phải đổi giá trị production, DS-E và cả `min_stay`. ARC chốt và sửa `erd.md` 9.1a.

Từ điển bản 1.1 sai ở ba chỗ, bản 1.2 đã sửa:
- `weekend_nights` **chỉ** chọn đêm được cộng `weekend_uplift_pct`;
- luật ở tối thiểu 2 đêm khi đến thứ Sáu, thứ Bảy nằm trong `min_stay.arrivalWeekdays`, không đọc `weekend_nights` (QA đúng ở BUG-R5-001);
- ba chỗ sửa là mục `weekend_nights`, mục `min_stay` (bỏ khỏi "Đi kèm"), và đoạn "Các cặp phải đổi cùng nhau".

Tới khi BE sửa: chủ đầu tư, quản lý **không sửa** khóa này. Mức tăng đang 0 % (ESC-045 câu 1), nên hiện không sai tiền.

---

## 9. Tin "giữ chỗ tự hủy" gửi thêm lễ tân (DOM sửa luật A.5 của chính mình)

Nguồn: DOM đọc lại Tờ 2a lượt 2 (`rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md`, thẻ FB-R5-DOM-PO-07).

**Chốt:** tin `hold_expired` gửi người tạo, người chốt **và** mọi lễ tân, lễ tân trưởng đang hoạt động, như tin `hold_overdue_with_deposit`. Bỏ nhánh "chỉ gửi lễ tân khi không có người tạo, người chốt".

Lý do:
- Ở v1.0.x, sale và CTV không có chỗ nào nhận tin: không dùng app nhân viên, Desk không có hộp thông báo.
- Giữ chỗ do sale, CTV tạo mà tự hủy thì hiện không ai được báo, nên không ai báo khách. Khách vẫn chuyển cọc vào đơn đã hủy, hoặc đến quầy khi căn đã bán.
- Lễ tân là người báo khách theo Tờ 2a, nên lễ tân phải có tin.

Việc:
- BE: `product/services/api/src/modules/reservations/internal/hold-notices.ts`, đặt `HOLD_NOTICE_ROLES.hold_expired` = `front_desk`, `front_desk_lead`. Giữ khóa chống trùng theo đơn. Không migration, không đổi hợp đồng (kind đã có).
- PO xếp bản: v1.0.5 nếu kịp, không thì v1.0.6. Tới khi lên, Tờ 2a dùng cách rà theo mã đơn (thẻ 07).
- Khi lên: BA sửa sổ tay 2.4 (V5-71). PO có thể đổi Tờ 2a sang dựa hộp Thông báo.
- J2 "Giữ chỗ sắp hết hạn" không cần đổi. Quầy đã thấy dòng này ở Cần chú ý cho mọi giữ chỗ.
- QA: giữ chỗ do sale tạo, chưa cọc, tới hạn → mỗi lễ tân, lễ tân trưởng đang hoạt động có đúng một tin; nhịp sau không có tin thứ hai; giữ chỗ có cọc một phần vẫn đi tin `hold_overdue_with_deposit` như cũ.
- BR-303 giữ chữ "báo sale". DOM thêm "và lễ tân" ở lần sửa BR kế tiếp.

---

## 10. Trả lời CPY thẻ FB-R5-CPY-UXD-V105-04 – nhãn `bill.line.late_fee_as_night`

**Chốt:** ca này **xảy ra được**. Dùng khóa CPY đề xuất: BE-B trả `bill.line.late_fee_as_night` khi số tiền dòng **bằng** `limit_ref_vnd`, trả `bill.line.late_fee_after_limit` khi **khác**.

Ca xảy ra thế nào:
- Quản lý, chủ đầu tư sửa thẳng đơn giá hoặc số lượng dòng phụ thu thay đêm. Mã cho phép:
  - `folio-lines.service.ts` chỉ chặn `PRICE_NOT_EDITABLE` với lễ tân, lễ tân trưởng;
  - dòng thay thế giữ `charge_code`, `label_params`, và `limit_ref_vnd` chép từ dòng gốc.
- Vì B18 chốt folio ngay, ca thường gặp là trên folio `settled` trong cửa sổ sau trả phòng (A32, BR-433 (e)). Hiếm hơn là trên folio còn mở (BR-438 (3)).

Nghiệp vụ không đổi:
- Giảm, miễn khoản này đi **FOC** (BR-416, hạn mức BR-433). Dòng giữ đúng giá một đêm, FOC là dòng riêng, nên nhãn "bằng giá 1 đêm" vẫn đúng.
- Sửa thẳng chỉ để sửa ghi nhầm. v1.0.5 không chặn thêm.

Chữ CPY đề xuất ("Phụ thu trả muộn (rời sau mốc trả muộn)", "Late check-out fee (after the late check-out limit)") đúng nghĩa BR-416 (khách rời sau mốc cuối, đêm ngày đi không bán được). QA: quản lý giảm đơn giá dòng `late_fee_as_night` 800.000 → 400.000 → phiếu ra nhãn `after_limit`; dòng 800.000 kèm FOC 400.000 → phiếu vẫn ra nhãn `as_night`.

---

## 11. Tiền về nhưng giữ chỗ đã tự hủy (SEC `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3a lượt 3; PO ca 2)

**Chốt:** chọn **(a)**: trước mỗi lần tự bấm hủy và khi thấy một giữ chỗ đã tự hủy, lễ tân kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư) rồi mới báo khách; tiền đã về thì căn còn trống đặt lại cùng căn, cùng giá, căn đã bán thì chủ đầu tư hoàn đủ theo sao kê. v1.0.4 không có đường ghi tiền cho đơn đã tự hủy: **lỗi phần mềm**, ORC giao QA ghi bug, PO xếp việc BE.

### 11.1 Ca có xảy ra không

Có, cả hai ca.
- **Ca 1** – tiền về trước hạn, chưa ai bấm xác nhận, J1 tự hủy:
  - hay gặp nhất là ban đêm: giữ chỗ hết hạn sau khi quầy rời lúc 21:00, khách chuyển buổi tối;
  - lúc quầy đông, tiền về sát giờ hạn.
- **Ca 2** – khách chuyển theo mã QR cũ sau khi đơn đã tự hủy: thường vì khách chưa được báo. Cách rà theo mã đơn (thẻ FB-R5-DOM-PO-07) làm ca này ít đi, nhưng không hết.

### 11.2 Luật

| Ca | Căn còn trống | Căn đã bán |
|---|---|---|
| Ca 1 (khách chuyển đúng hạn; lỗi chậm ghi là của OTTIMO) | Đặt lại cùng căn, cùng giá đã báo, ghi cọc vào đơn mới. Không phí | Mời căn khác cùng hạng hoặc tốt hơn, cùng giá (tinh thần BR-312). Khách không nhận → hoàn đủ, không phí |
| Ca 2 (khách chuyển sau hạn) | Khách còn muốn → đặt lại cùng căn, cùng giá đã báo, ghi cọc vào đơn mới (sửa 06/11 khuya, khớp Tờ 2a; bản trước ghi "giá hiện hành") | Hoàn đủ, không phí (đơn chưa xác nhận, BR-308) |

- Vì sao Ca 2 cũng giữ giá đã báo: OTTIMO có một bảng giá cho mọi kênh, giá căn ít khi đổi trong vài ngày giữ chỗ, và Tờ 2a đã in một cách cho cả hai ca. Khôi phục đơn ở 11.4 (5B-2) cũng giữ giá đã giữ. Nếu chủ đầu tư đã đổi giá căn giữa lúc báo giá và lúc khách chuyển, lễ tân vẫn giữ giá đã báo và ghi sổ giao ca để chủ đầu tư biết.

- Ai hoàn: ở v1.0.4, **chủ đầu tư** hoàn bằng chuyển khoản ngoài Desk, theo sao kê. Lễ tân ghi sổ giao ca "OTM-… tiền về sau tự hủy – chờ chủ đầu tư hoàn", không hứa ngày.
- Giữ chỗ quá hạn mà J1 chưa tự hủy (job đứng, đơn còn **Giữ chỗ · chờ cọc**, chưa nhận đồng nào): **chỉ còn Hủy giữ chỗ.** Tiền đã về thì hủy rồi đặt lại ngay, như ca giữ chỗ đã tự hủy. Chưa về thì hủy và báo khách. Cả hai: ghi sổ giao ca, báo chủ đầu tư (Desk chưa tự hủy là lỗi, OPS xem worker).
  - Sửa 06/11 khuya (BUG-R5-002, "Ghi chú cho DOM, PO"): bản trước viết lễ tân "Xác nhận đã nhận cọc được". Sai trên Desk v1.0.4: sau hạn, máy chủ chỉ đưa `confirm_deposit` khi đơn đã nhận > 0 đ (`allowed-actions.ts` 72–74), Desk cũng ẩn nút (`ReservationDrawer.tsx` 243, `canConfirmDeposit`). API vẫn nhận nếu Giờ nhận tiền trước hạn (`overdueHoldAccepts`), nhưng không có nút.
  - **DOM quyết: bỏ câu cũ, không mở nút** cho giữ chỗ quá hạn chưa nhận đồng nào. Lý do:
    - khoảng hở thường chỉ một nhịp J1 (khoảng 1 phút); chỉ dài khi worker đứng, mà worker đứng là sự cố phải báo;
    - lễ tân chỉ học **một** cách cho mọi ca "tiền về mà giữ chỗ đã hết hạn": hủy rồi đặt lại, giờ tiền về ghi ở Ghi chú;
    - mở nút là đưa lên Desk chỗ ghi Giờ nhận tiền **lùi về trước hạn** để cứu một giữ chỗ đã hết hạn. Chỗ đó chỉ nên mở khi có ảnh chứng từ bắt buộc và đối soát (đường V5-5B ở 11.4), không mở riêng;
    - không phải sửa mã ở v1.0.5. `overdueHoldAccepts` giữ nguyên ở máy chủ (US-085 AC4, test `v104-holds.test.ts`).
  - Sổ tay 2.4 (`user-manual-v1.0.md` dòng 805) và `product/docs/manual/guides/02-le-tan.md` dòng 311 đã ghi đúng "sau hạn chỉ còn hủy" cho giữ chỗ chưa cọc (ORC đối chiếu). Chỉ Tờ 2a dòng 86 phải sửa, chữ ở khối dưới.

**Chữ thay cho Tờ 2a dòng 86** (`product/docs/staff-one-pager.md`, khối **Hết hạn, chưa cọc**; PO dán nguyên văn thay cho ba câu từ "Quá hạn vài phút…" tới "…báo chủ đầu tư."):

> Quá hạn vài phút mà đơn vẫn **Giữ chỗ · chờ cọc**: Desk chỉ còn nút **Hủy giữ chỗ**, kể cả khi tiền về trước hạn. Kiểm tiền về theo mã đơn, rồi **Hủy giữ chỗ**, lý do **Khác (ghi rõ)**: "Quá hạn, Desk chưa tự hủy". Tiền đã về → đặt lại ngay theo dòng **Tiền đã về mà đơn đã tự hủy**. Chưa về → báo khách như trên. Cả hai: ghi sổ giao ca, báo chủ đầu tư.

Ghi chú cho PO: câu mới dài hơn câu cũ khoảng một dòng in. Nếu Tờ 2a tràn khổ in (A4 dọc 11 pt, plan R5 quyết định 21), bỏ cụm "kể cả khi tiền về trước hạn" trước, giữ các câu còn lại. Dòng **Tiền đã về mà đơn đã tự hủy** ngay dưới không cần sửa: căn vừa nhả lúc hủy nên vẫn trống, lễ tân giữ chỗ mới cùng căn, cùng giá, Giờ nhận tiền để bây giờ.

- Đối soát (BR-527): dòng sao kê mang mã đơn cũ. Khoản thu trên đơn mới có Ghi chú "Tiền về hh:mm dd/mm theo mã OTM-cũ", nên quản lý đối soát theo ghi chú.

Cách làm trên Desk v1.0.4 khi đặt lại:
1. Tạo giữ chỗ mới cùng căn, cùng ngày.
2. **Xác nhận đã nhận cọc**: Giờ nhận tiền để **bây giờ**, vì Desk không nhận giờ trước lúc tạo giữ chỗ mới (`deposits.service.ts`: `receivedAt` ≥ lúc tạo giữ chỗ, không thì `DATE_INVALID`).
3. Ghi chú: giờ tiền về thật và mã đơn cũ.
4. Sổ giao ca: mã đơn cũ → mã đơn mới.

Phòng ngừa (PO đưa vào sổ tay 2.4; lên Tờ 2a nếu còn chỗ): lượt rà trước khi rời quầy, giữ chỗ chưa cọc hết hạn trước giờ mở quầy hôm sau mà khách còn muốn → gia hạn 1 lần tới 10:00 sáng hôm sau, vẫn dưới trần 12:00 ngày đến (BR-302, BR-303). Như vậy tiền về ban đêm không rơi vào đơn đã hủy.

### 11.3 Lỗi phần mềm – cho QA ghi bug (đề xuất P2)

Tên đề xuất: "Tiền cọc về cho giữ chỗ đã tự hủy: Desk không ghi được khoản thu, không tạo được yêu cầu hoàn."
- QA đã ghi: **BUG-R5-002** (P2).
- Bằng chứng trong mã:
  - xác nhận cọc và báo đã chuyển chỉ nhận đơn `hold` (`product/services/api/src/modules/payments/internal/deposits.service.ts` dòng 138 và 425: 409 `INVALID_TRANSITION`);
  - đơn mới không nhận Giờ nhận tiền trước lúc tạo giữ chỗ (`deposits.service.ts` 157–165);
  - Desk không có nút ghi thu hay tạo yêu cầu hoàn trên đơn đã hủy (`PaymentPanel.tsx` chỉ ở màn trả phòng, `DebtCollectDialog.tsx` chỉ thu nợ sau trả phòng).
- **Sửa 06/11 khuya – "dòng tay" khác "khoản thu".** Bản trước viết "đơn `cancelled` không nhận dòng tay, mọi vai (BR-522)", như thể đơn đã hủy không nhận gì. Sai một nửa. Trong mã có hai việc khác nhau:

| | Dòng tay (dòng phí) | Khoản thu (phiếu thu) |
|---|---|---|
| Là gì | Một khoản **khách nợ** trên folio: phụ thu, dịch vụ, F&B, phí dọn… | Một khoản **khách đã trả**: chuyển khoản, VietQR, tiền mặt, POS… |
| Thao tác | `addFolioLine` (A30), `folio-lines.service.ts` | `recordPayment`, `payments.service.ts` `record` → `payment.service.ts` `recordInTx` |
| Đơn `cancelled`, `no_show` | **Chặn mọi vai**, 409 `INVALID_TRANSITION` (dòng 213–216). Đúng BR-522 ghi chú 18/10 K11-06: khách không ở, không có phát sinh để ghi | **Không chặn theo trạng thái đơn.** Folio đơn hủy vẫn `open` nên ghi được |
| Ai ghi được trên đơn đã hủy | Không ai | Chỉ FD+, vì số còn phải thu = 0 đ nên mọi khoản là "thu dư": cần Ghi chú ≥ 3 ký tự (thiếu → 422 `REASON_REQUIRED`). Sale, CTV → 422 `AMOUNT_EXCEEDS_BALANCE` |
| Ảnh chứng từ | – | **Không bắt buộc** |
| Đối soát (BR-527) | – | Theo phương thức: chuyển khoản, VietQR → chờ đối soát; tiền mặt, POS → không cần đối soát |
| Sau đó | – | `createRefundRequest` → 201, yêu cầu hoàn `pending` (lý do `overpayment`), MGR/OWN duyệt, người tạo không tự duyệt (BR-522) |

  - Kết luận: BR-522 ghi chú 18/10 vẫn đúng và chỉ nói về **dòng phí**. Câu "đơn đã hủy không nhận gì" không có trong BR, DOM viết sai ở bản trước. Máy chủ đã có đường ghi **khoản thu** và đề nghị hoàn cho đơn đã hủy (QA chạy: 201, 201). Chỉ thiếu nút trên Desk, và thiếu các luật ở 11.4 (chỉ tiền vào tài khoản, ảnh bắt buộc, "Cần chú ý", khôi phục).
  - Hiện trạng có một kẽ hở kiểm soát: qua API, lễ tân ghi được **tiền mặt** lên đơn đã hủy, không ảnh, không đối soát, rồi đề nghị hoàn. Chốt chặn còn lại là MGR/OWN duyệt hoàn (BR-522) và kiểm quỹ đóng ca. Phần bảo mật SEC đang xem riêng. Luật nghiệp vụ ở 11.4 bịt kẽ này: đơn đã đóng chỉ nhận chuyển khoản, VietQR, có ảnh.
- Hậu quả trên Desk v1.0.4:
  - tiền thật của khách nằm ngoài Desk, hoàn ngoài Desk, không qua duyệt BR-522;
  - đối soát BR-527 có dòng sao kê không khớp đơn nào;
  - giờ tiền về trên đơn mới ghi sai.
- Không sai số tiền khách trả. Không chặn v1.0.5.

### 11.4 Việc mới cho BE – V5-5B (PO xếp: 5B-1 ghi tiền và hoàn, 5B-2 khôi phục; v1.0.5 nếu kịp, không thì v1.0.6)

Viết lại 06/11 khuya theo BUG-R5-002 ("Phát hiện thêm khi chạy"). Bản trước chỉ cho lý do `hold_expired` và chưa nói dùng đường nào. Bổ sung 06/11 theo thẻ SEC `FB-R5-SEC-DOM-B002-04` (`rounds/round-05/reviews/SEC-on-bug-r5-002.md`): 2(c) ảnh của ai; mục 3 nơi nhận hoàn; **3a** mã giao dịch và cảnh báo trùng (S4); **3b** lỡ ghi hai lần; ca QA (h), (i).

**DOM quyết (nghiệp vụ): dùng lại `recordPayment`, không làm đường ghi tiền riêng.** Một khoản tiền khách đã trả đi một đường duy nhất: cùng số phiếu thu PT-, cùng audit tiền, cùng đối soát BR-527, cùng đường hoàn BR-522. Đường riêng sẽ có luật riêng, báo cáo tiền và đóng ca phải đọc thêm một nguồn. ARC chốt cách làm (thêm nhánh trong `record` khi đơn đã đóng, hay một thao tác bọc gọi cùng hàm), mã lỗi, có cần đổi hợp đồng không.

**5B-1 – ghi tiền về sau khi hủy, và hoàn**

1. **Phạm vi:** mọi đơn đã đóng (`cancelled`, `no_show`), **mọi lý do hủy**, không chỉ `hold_expired`. Lý do:
   - ca 2 (khách chuyển theo mã QR cũ) xảy ra cả với giữ chỗ do lễ tân, sale bấm hủy, ví dụ hủy vì không liên lạc được rồi khách chuyển;
   - ca J1 đứng ở 11.2: lễ tân bấm Hủy giữ chỗ, lý do **Khác**, không phải `hold_expired`;
   - tiền đã vào tài khoản OTTIMO thì phải có chỗ ghi để đối soát và hoàn, dù đơn hủy vì lý do gì.
   - Thay ca (a) của QA ở BUG-R5-002: "đơn hủy vì lý do khác `hold_expired` → 409" đổi thành **nhận**.
2. **Luật thêm cho khoản thu trên đơn đã đóng** (đơn đang mở giữ luật hiện hành):
   - (a) chỉ FD+ (đã có; sale, CTV vẫn bị chặn);
   - (b) **chỉ `bank_transfer`, `vietqr`**, tức tiền đã vào tài khoản. Tiền mặt, POS, `ota_collect` → 422. Khách đứng ở quầy thì tạo đơn mới và thu trên đơn mới; tiền OTA thu không đi đường này. Luật này bịt kẽ hở ở 11.3 (ghi tiền mặt lên đơn đã hủy không ảnh, không đối soát);
   - (c) **ảnh chứng từ bắt buộc** (`attachmentId`, loại `deposit_receipt`); thiếu → 422. Ảnh là **thông báo tiền vào tài khoản OTTIMO**:
     - nguồn: chủ đầu tư hoặc quản lý gửi qua số đã lưu sẵn trong danh bạ cơ sở (ảnh từ app ngân hàng trên máy của họ, như sổ tay lễ tân 10.3). Nếu chủ đầu tư chọn ESC-039 A: ảnh thông báo trên thiết bị báo tiền của cơ sở ở quầy;
     - không dùng ảnh chụp màn hình hay SMS khách gửi, cũng không dùng ảnh sale, CTV chuyển tiếp từ khách (S7). Máy ở quầy không đăng nhập app ngân hàng (điều kiện SEC ở ESC-039);
     - ảnh nên thấy số tiền, giờ, nội dung chuyển khoản (mã đơn). Ghi chú không chép số tài khoản hay tên người chuyển;
     - ảnh không thay đối soát: khoản vẫn chờ MGR+ khớp với sao kê (d);
   - (d) luôn **chờ đối soát** (đúng sẵn với hai phương thức trên). MGR+ đối soát theo sao kê, không phải người ghi (BR-527);
   - (e) Giờ nhận tiền từ lúc tạo đơn tới bây giờ (đã có). Ghi chú bắt buộc (đã có, vì số còn phải thu = 0 đ);
   - (f) loại khoản thu `deposit` khi đơn bị hủy lúc còn là giữ chỗ, để 5B-2 xác nhận cọc bằng chính khoản này (`existingPaymentId`). Đơn khác: ARC chốt;
   - (g) không đổi trạng thái đơn, không sinh dòng phí (BR-522 ghi chú 18/10 giữ nguyên).
3. **Lối ra bắt buộc, trong cùng giao dịch:** tạo yêu cầu hoàn **100 % số vừa ghi**, không phí (BR-308). Đơn đã xác nhận rồi hủy: yêu cầu hoàn theo BR-309 đang có giữ nguyên, khoản mới hoàn đủ riêng.
   - Người ghi là người tạo yêu cầu, nên không tự duyệt. MGR/OWN duyệt; chỉ chi khi khoản thu đã đối soát (BR-522). Hai chốt này cùng với (b), (c) đủ để một khoản ghi khống không thành tiền chi ra.
   - Lý do hoàn: "Tiền về sau khi hủy". ARC chốt dùng lại `overpayment` hay thêm mã.
   - **Một khoản tiền chỉ ghi một lần.** Khách muốn đặt lại mà 5B-2 chưa lên: **không** ghi ở đơn cũ, làm như 11.2 (giữ chỗ mới, xác nhận cọc trên đơn mới, Giờ nhận tiền để bây giờ, Ghi chú giờ tiền về và mã đơn cũ). Hộp ghi trên Desk phải nói rõ điều này, ví dụ: "Ghi khoản này sẽ tạo yêu cầu hoàn đủ số. Khách muốn đặt lại: không ghi ở đây, tạo giữ chỗ mới." UXD viết chữ.
   - **Nơi nhận hoàn:** chuyển khoản **về đúng tài khoản đã chuyển** (`original_method`, máy chủ đặt sẵn khi tự tạo yêu cầu). **Không chi tiền mặt**, kể cả khi khách đứng ở quầy. Máy chủ chặn chi tiền mặt và chặn đổi nơi nhận trên yêu cầu này (SEC S3).
     - Lý do: tiền đã vào tài khoản. Chi tiền mặt cho một người tự xưng là khách thì khách thật vẫn chờ hoàn. Đây cũng là đường "chuyển khoản rồi xin lại tiền mặt" mà BR-522 đã chặn.
     - MGR/OWN chi theo dòng sao kê đã khớp, ghi mã giao dịch hoàn như mọi khoản hoàn chuyển khoản. Tách người theo BR-522 (b) giữ nguyên.
     - Lễ tân không hỏi, không ghi số tài khoản của khách. Câu cho khách (CPY, UXD sửa chữ): "The refund will be sent back to the account you paid from." / "Tiền hoàn sẽ về đúng tài khoản anh/chị đã chuyển."
     - Khách xin hoàn về tài khoản khác: không đổi, giải thích như câu trên. Tài khoản cũ không nhận được (tiền chuyển đi bị trả lại): yêu cầu hoàn để mở, quản lý báo chủ đầu tư. Đội làm luật riêng khi có ca thật.
   - **3a. Mã giao dịch ngân hàng và cảnh báo trùng (S4):**
     - Lễ tân **không chắc đọc được** mã giao dịch. Quầy không có app ngân hàng; lễ tân chỉ thấy ảnh chủ đầu tư, quản lý gửi. Mã có trên màn chi tiết giao dịch và trên sao kê. Thông báo đẩy, loa báo tiền thường chỉ có số tiền, giờ, nội dung [CHƯA XÁC MINH – tùy ngân hàng của OTTIMO].
     - Vì vậy **S4 bản tối thiểu là bắt buộc** khi 5B-1 lên: "Có thể trùng" ở màn duyệt hoàn và màn đối soát, theo điều kiện SEC (khoản chuyển khoản, VietQR khác, chưa đảo, cùng số tiền, Giờ nhận tiền cách ≤ 24 giờ, ở đơn khác; chỉ hiện mã đơn kia).
     - Cảnh báo không chặn: khách có thể chuyển thật hai lần cùng số. Người đối soát xem sao kê có một hay hai dòng.
     - Ô mã giao dịch lúc ghi (nếu ARC thêm `bankReference` vào `recordPayment`): **không bắt buộc**. Lễ tân gõ khi ảnh có mã. Có mã thì máy chủ trả 409 nếu mã đó đã ở một khoản thu chưa đảo của cơ sở. Không có mã thì chỉ còn cảnh báo.
     - Luật đối soát, áp ngay bằng tay: **một dòng sao kê chỉ khớp một khoản thu.** Dòng đã khớp khoản khác thì khoản này ghi `disputed`, không `reconciled`. MGR+ chép mã giao dịch của dòng sao kê vào Ghi chú đối soát.
     - DOM đề xuất (nên có; ARC, SEC xếp, v1.0.6 nếu không kịp): ô mã giao dịch ở bước đối soát `reconciled` cho chuyển khoản, VietQR; máy chủ trả 409 nếu mã đã khớp một khoản khác chưa đảo. Người đối soát luôn có sao kê, nên chặn ở bước này chắc hơn chặn lúc ghi.
   - **3b. Lỡ ghi một khoản hai lần.** Ai thấy trước (cảnh báo S4, người đối soát, lễ tân) thì báo quản lý và ghi sổ giao ca. Lễ tân không tự đảo, không chi.
     - MGR+ kiểm sao kê trước. Hai dòng: hai lần chuyển thật, giữ cả hai, ghi chú "đã kiểm sao kê: hai giao dịch". Một dòng: ghi trùng, xử lý như dưới.
     - **Đơn cũ (đã đóng) và đơn mới:** giữ khoản ở đơn mới, vì khách đã dùng tiền làm cọc. Khoản ở đơn cũ: MGR+ đối soát `disputed`, ghi chú "trùng khoản ở đơn {mã mới}", rồi MGR/OWN đảo (`reversePayment`). Yêu cầu hoàn đi kèm **tự hủy** khi đảo (refundPlan, `superseded`, kể cả yêu cầu đã duyệt chưa chi). Không ai phải bấm hủy.
     - **Cùng một đơn ghi hai lần:** giữ khoản ghi trước, đảo khoản sau, cùng cách trên.
     - **Đã chi hoàn từ khoản ở đơn cũ** rồi mới thấy trùng: không đảo khoản hoàn. Đảo khoản cọc ở đơn mới (`disputed` rồi đảo). Đơn mới giữ trạng thái, thành còn thiếu cọc. Quản lý liên hệ khách xin chuyển lại cọc. Khách không chuyển lại: chủ đầu tư quyết giữ hay hủy đơn. Báo chủ đầu tư ngay khi thấy.
     - Phòng trước: hộp ghi 5B-1 nhắc lễ tân tìm đơn mới của khách (theo tên hoặc số điện thoại) trước khi ghi. Đã có đơn mới xác nhận cọc bằng khoản này thì không ghi ở đơn cũ.
4. **Desk (FE):** trên khung đơn `cancelled`, `no_show`, FD+ có nút ghi tiền về sau khi hủy, mở hộp ghi thu có ô ảnh bắt buộc, chỉ hai phương thức. Không có nút cho sale, CTV.
5. **"Cần chú ý" `deposit_after_cancel`** (US-085 AC4; kind đã khai báo, chưa nơi nào tạo):
   - Desk v1.0.x không tự biết tiền về (chưa có báo từ ngân hàng). Nguồn tạo mục là **sale, CTV báo "khách đã chuyển"** (`createDepositNotice`) trên đơn đã đóng: thay 409 bằng tạo mục cho FD, FDL, MGR, OWN, chữ `today.money_after_cancel` ("Tiền về cho đơn đã hủy {code}"). Sau này có báo từ ngân hàng thì thêm nguồn đó.
   - Mục tự đóng khi đơn có khoản thu ghi sau lúc báo (5B-1 hoặc 5B-2), hoặc khi FD+ bấm "Không thấy tiền" kèm ghi chú.
   - ARC chốt mã trả về cho sale (QA ca (f)).

**5B-2 – khôi phục đơn (có thể lên sau 5B-1)**

6. Hộp ghi ở mục 4 có thêm lựa chọn **Khôi phục giữ chỗ và xác nhận cọc**, thay cho lối hoàn ở mục 3, khi đủ cả ba điều:
   - đơn bị hủy lúc còn là giữ chỗ (J1 `hold_expired`, hoặc người bấm Hủy giữ chỗ B5);
   - căn cũ còn trống đủ các đêm của đơn;
   - ngày nghiệp vụ chưa qua ngày đến.
7. Kết quả khôi phục:
   - cùng mã đơn, cùng căn, cùng giá đã giữ; cọc = khoản vừa ghi; Giờ nhận tiền đúng giờ tiền về; không có yêu cầu hoàn;
   - đủ cọc (BR-305) → `confirmed` như xác nhận cọc thường (tin xác nhận BR-975 đi như thường);
   - thiếu cọc → đơn thành giữ chỗ có cọc một phần đã quá hạn, xử lý theo BR-303 (1)–(3): không tự hủy, xử lý trước trần 12:00 ngày đến.
   - DOM giữ nghiêng cũ: khôi phục, không tạo đơn mới liên kết. Mã đơn khớp nội dung chuyển khoản nên đối soát theo mã, giờ tiền về đúng.
8. Căn đã bán hoặc đã qua ngày đến: trả lỗi rõ, không 500, khoản thu không được ghi nửa chừng. ARC chốt mã; DOM gợi ý dùng lại mã của khôi phục B12. Lễ tân chọn lối hoàn (mục 3), hoặc mời căn khác như 11.2.
9. ARC chốt:
   - có cần migration không: máy trạng thái chưa có `cancelled → hold` hay `cancelled → confirmed`. Cần thì theo QC R4 ĐK-2 (chờ diễn tập khôi phục), và 5B-1 vẫn lên trước;
   - tồn phòng khi khôi phục chạy song song với một giữ chỗ khác trên cùng căn (QA ca (b)).
10. SEC xem ai được khôi phục. DOM đề xuất FD+, vì luôn có chứng từ (mục 2c) và đối soát (2d). Audit ghi khoản thu và người khôi phục; quản lý thấy trong bộ lọc tuần.

**Ca kiểm QA bổ sung cho BUG-R5-002** (thêm vào ca (a)–(g) của QA, chi tiết theo cách ARC chốt):
- (a') giữ chỗ do lễ tân bấm hủy, lý do **Không liên lạc được**; khách chuyển theo QR cũ; lễ tân ghi khoản thu chuyển khoản kèm ảnh → 201, chờ đối soát, có yêu cầu hoàn 400.000 `pending` (số thử của fixture);
- (a'') đơn đã hủy: tiền mặt → 422; POS → 422; chuyển khoản không ảnh → 422; sale → bị chặn như hiện nay;
- (d') người ghi không tự duyệt yêu cầu hoàn; MGR duyệt được; chi trước khi đối soát → bị chặn (BR-522);
- (e') sale báo "khách đã chuyển" trên đơn tự hủy → mục `deposit_after_cancel` cho FD+; lễ tân ghi khoản thu → mục đóng; ca khác: FD bấm "Không thấy tiền" → mục đóng, có ghi chú trong audit;
- (b') 5B-2 với giữ chỗ do người bấm hủy (B5), căn còn trống → khôi phục được như giữ chỗ tự hủy; đơn `confirmed` rồi hủy → không có lựa chọn khôi phục.
- (h) yêu cầu hoàn tự tạo từ khoản thu trên đơn đã đóng: nơi nhận `original_method`; chi tiền mặt → bị chặn; đổi nơi nhận sang tiền mặt hoặc tài khoản khác → bị chặn; MGR chi chuyển khoản sau đối soát → được;
- (i) cùng 400.000 ghi ở đơn cũ (5B-1) và cọc ở giữ chỗ mới, Giờ nhận tiền cách 2 giờ → "Có thể trùng" ở màn duyệt hoàn và màn đối soát, chỉ hiện mã đơn; MGR đối soát khoản ở đơn cũ `disputed`, OWN đảo → yêu cầu hoàn đi kèm `superseded`, mục tiền dư đơn đã đóng tự đóng; khoản ở đơn mới giữ nguyên.

11. Khi lên: PO sửa Tờ 2a, BA sửa sổ tay 2.4 (V5-71) bỏ các bước làm tay ở 11.2. Khi có 5B-2: câu J1 đứng ở 11.2 vẫn đúng (hủy rồi khôi phục, hoặc hủy rồi đặt lại); không cần mở nút xác nhận cọc sau hạn.

---

## 12. V5-25 – luật kiểm khi lưu `min_stay` (BUG-R5-003, thẻ BE FB-R5-BE-ARC-C0313-06)

Nguồn: QA `rounds/round-05/qa/bug-list.md` BUG-R5-003 (P1); `parameter-rules.ts` 243–254; `pricing.ts` 295–317 (`MinStayRule`, `minStayNights`); BR-113, BR-112.

**Chốt (NGÀNH, DOM):** `min_stay` chỉ nhận **danh sách luật** đúng dạng bộ tính giá đọc (`MinStayRule[]`). Sai dạng → 422 `PARAM_OUT_OF_RANGE`, giá trị đang hiệu lực không đổi. Bộ tính giá đọc phòng thủ, không bao giờ 500 vì khóa này. Giá trị production hiện tại hợp lệ. Mức "2 đêm khi đến thứ Sáu, thứ Bảy, ngày đặc biệt" vẫn là quyết định của chủ đầu tư (ESC-004, INV-004); mục này chỉ chốt **dạng** lưu.

### 12.1 Dạng bắt buộc

Giá trị là mảng JSON, **0 tới 20** phần tử. Mỗi phần tử là một đối tượng, chỉ có các khóa sau:

| Khóa | Bắt buộc | Giá trị hợp lệ | Sai thì 422, `extras` gợi ý |
|---|---|---|---|
| `nights` | Có | Số nguyên, **1 ≤ `nights` ≤ 7** và **≤ `short_stay_max_nights`** đang hiệu lực ngày lưu | `min: 1`, `max: min(7, short_stay_max_nights)` |
| `channels` | Có | `"all"`, hoặc mảng không rỗng, không trùng, mỗi phần tử thuộc `direct`, `agent`, `ota` | `allowed: ["all","direct","agent","ota"]` |
| `arrivalWeekdays` | Không | Mảng mã thứ `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`, không trùng (cùng dạng `weekend_nights`, mục 8.4). Không nhận số 1–7 | `allowed`: 7 mã thứ |
| `arrivalOnSpecialDates` | Không | `true` hoặc `false` (kiểu boolean, không phải chữ `"true"`) | – |

Thêm hai điều cho mỗi phần tử:
- **Phải áp vào ít nhất một ngày:** `arrivalWeekdays` không rỗng, hoặc `arrivalOnSpecialDates` = `true`. Không thì 422.
- **Khóa lạ → 422.** Ví dụ gõ `arrivalWeekday` (thiếu "s"): không chặn thì luật lưu được nhưng không áp vào ngày nào, và không ai biết.

Thứ tự khóa trong đối tượng, thứ tự luật trong mảng không quan trọng. `extras` báo theo điểm sai đầu tiên; tên `extras` ARC chốt. ARC ghi một dòng ở `setParameter`.

### 12.2 Nghĩa và lý do từng điểm

- **`[]` (mảng rỗng): cho lưu, nghĩa là không có ở tối thiểu ngày nào, mọi kênh.**
  - Tắt ở tối thiểu là cách bán phòng hợp lệ, ví dụ mùa thấp điểm muốn lấp đêm thứ Sáu trống. Bộ tính giá hiểu sẵn (số tối thiểu = 0).
  - Không bắt người sửa gõ một luật giả để tắt.
  - Đổi mức của chủ đầu tư (ESC-004) là việc của người được sửa tham số, như mọi tham số giá khác. Lý do bắt buộc khi lưu, và có audit.
- **`nights`:**
  - 0, số âm, số lẻ (2,5), chữ `"2"` → 422. QA thấy `[{"nights":0}]` lọt ở v1.0.4.
  - **1 cho lưu:** luật 1 đêm nghĩa là những ngày đó không có tối thiểu. Vô hại, đúng ý người gõ.
  - **Trần 7:** ở tối thiểu trên 7 đêm không phải cách bán ngắn ngày của cơ sở 10 căn. Cao điểm như Tết thường đặt 2–3 đêm. Muốn trên 7 thì báo đội đổi hằng số.
  - **Trần `short_stay_max_nights`:** tối thiểu lớn hơn đơn ngắn ngày dài nhất thì ngày đến đó không bán ngắn ngày được nữa. Đích là 29 (BR-112, bảng giá 01/11); production còn thấp hơn 29 tới khi chủ đầu tư làm B5 (mục 13.3). Cả hai trường hợp, trần thực tế là 7.
  - **Chiều ngược:** lưu `short_stay_max_nights` nhỏ hơn `nights` lớn nhất trong `min_stay` đang hiệu lực → 422, `min` = số đó. Làm như các cặp giờ (`TIME_ORDER`).
  - Đơn từ `long_stay_required_from_nights` đêm (thuê tháng) luôn đủ đêm nên không vướng.
- **`channels`:**
  - Bắt buộc. Thiếu thì bộ tính giá v1.0.4 ném lỗi khi đọc (`inScope` gọi `.includes` trên giá trị rỗng) → 500, cùng hậu quả BUG-R5-003.
  - Chỉ `"all"` hoặc danh sách. Chuỗi lẻ như `"direct"` → 422: bộ tính giá hiện đọc nhầm như so chuỗi con.
  - **Không nhận `internal`:** BR-113 không áp cho kênh Nội bộ, mã cũng bỏ qua kênh này (`reservations.service.ts` 686). Ghi vào chỉ gây hiểu nhầm.
  - Nhận `ota`, nhưng ở v1.0.x Desk không kiểm ở tối thiểu cho đơn OTA (đơn OTA nhập tay theo xác nhận của kênh). Ở tối thiểu trên OTA, chủ đầu tư cài bằng tay trên extranet (từ điển đã ghi). Giữ `ota` cho lúc có channel manager.
- **`arrivalWeekdays`:** mã thứ, cùng dạng `weekend_nights`. Không nhận số 1–7 (cùng lý do BUG-R5-001). Trùng → 422.
  - Mảng rỗng chỉ được nhận khi cùng luật có `arrivalOnSpecialDates: true`. Không thì luật không áp vào ngày nào → 422.
- **`arrivalOnSpecialDates: true` khi `special_dates` đang rỗng:** cho lưu. Danh sách ngày đặc biệt đổi theo năm, luật vẫn đúng.
- **Hai luật chồng nhau** (cùng thứ, khác số đêm): cho lưu. Áp số đêm **lớn nhất**, như bộ tính giá hiện nay. Không chặn trùng giữa các luật.
- **Tối đa 20 luật:** hiện có 2, cách cài thật nào cũng dưới 20. Chặn dán nhầm cả khối lớn vào ô.

### 12.3 Đọc phòng thủ ở bộ tính giá (giá trị hỏng đã nằm trong DB)

- **Không bao giờ 500 vì `min_stay`.** Giá trị không phải mảng → coi như không có luật. Phần tử hỏng theo 12.1 → bỏ phần tử đó, các phần tử đúng vẫn áp. Ghi log cảnh báo (một lần cho mỗi giá trị) để OPS thấy.
- Áp ở cả ba chỗ đang gọi `minStayNights`: báo giá (`quote-pricing.ts` 201–202), tạo đơn (`reservations.service.ts` 688), giá ước tính web (`public-rate.ts` 212).
- Vì sao chọn "vẫn bán, bỏ luật hỏng" chứ không chặn: mất ở tối thiểu trong vài giờ chỉ là vài đơn 1 đêm thứ Sáu, lễ tân vẫn thấy. Báo giá và tạo đơn lỗi thì quầy và web dừng bán cả ngày (BUG-R5-003).
- Không thay bằng số mặc định trong mã (như nguyên tắc mục 0: mã không có số mặc định cho tham số giá).

### 12.4 Giá trị production hiện tại

`[{"nights":2,"channels":"all","arrivalWeekdays":["FRI","SAT"]},{"nights":2,"channels":"all","arrivalOnSpecialDates":true}]` (ORC đọc chỉ đọc 06/11) → **hợp lệ**. `production-defaults.ts` và DS-E cùng giá trị, cũng hợp lệ. Không cần migration, không đổi giá trị đang chạy.

Oracle cũ BR-113-01/02/03/05 thiếu `channels` trong `params.min_stay`: DOM thêm `"channels": "all"` cho đúng dạng bắt buộc. Không đổi kết quả của dòng nào (test BE đọc DS-E, validator không đọc kênh).

### 12.5 Tới khi V5-25 lên

Không bấm **Lưu thay đổi** ở ô **Ở tối thiểu** (`min_stay`) và **Đêm tính là cuối tuần** (`weekend_nights`). Câu chuẩn đã có ở sổ tay 1.4, 5.6, hướng dẫn `01` 9.2, 15.6, sổ vận hành 4.1 (BA, `a9927c78`); từ điển tham số bản 1.3 dùng cùng câu: buộc phải đổi thì nhắn đội trước, chọn **Hiệu lực từ** là ngày mai để còn **Hủy lịch**; lỡ lưu thì báo đội ngay, coi là P0. Lỡ lưu sai cho hôm nay thì lỗi kéo dài tới mốc đổi ngày nghiệp vụ 06:00 hôm sau, với điều kiện đã lưu lại giá trị đúng có Hiệu lực từ = ngày mai (BUG-R5-003 bước 5–6). Sửa sớm hơn chỉ có cách sửa thẳng DB production, phải có chủ đầu tư duyệt.

Đường sửa trong ngày (cho hủy dòng hiệu lực hôm nay vừa lưu trong ngày) PO đã để backlog R5-B-06, không làm ở V5-25. DOM đồng ý: bộ kiểm 12.1 và đọc phòng thủ 12.3 đủ để lỗi này không dừng bán. Ô danh sách khác (`los_discount`, `early_checkin_tiers`…) dùng lời dặn ORC 06/11 (Hiệu lực từ ngày mai, nhắn đội kiểm trong ngày, sai thì Hủy lịch); từ điển bản 1.3 ghi ở Quy tắc chung bước 10.

### 12.6 Ca kiểm QA – oracle `BR-113-06` … `BR-113-30`

Đã thêm vào `product/tests/fixtures/br-examples.json` (`origin: rule-boundary`, nhãn INV-004 + NGÀNH, `calc: null`, `pendingFix: BUG-R5-003`). `input.operation` = `setParameter` (lưu) hoặc `calculateQuote` (đọc phòng thủ). Validator `tools/validate-fixtures.mjs`: 0 lỗi.

| Id | Giá trị lưu (rút gọn) | Kết quả |
|---|---|---|
| 06 | giá trị production (12.4) | nhận |
| 07 | `2` | 422 |
| 08 | `{"nights":2}` | 422 |
| 09 | `null` | 422 |
| 10 | `[]` | nhận; đến thứ Sáu 13/11 1 đêm không bị chặn |
| 11 | `nights` 0 | 422, min 1 |
| 12 | `nights` 8 | 422, max 7 |
| 13 | `nights` 7 | nhận |
| 14 | `nights` 1 | nhận |
| 15 | `nights` 5, `short_stay_max_nights` thử = 4 | 422, max 4 |
| 16 | `nights` `"2"` (chữ) | 422 |
| 17 | `arrivalWeekdays` `["FRX"]` | 422, allowed 7 mã |
| 18 | `["FRI","FRI"]` | 422 |
| 19 | `[5,6]` | 422 |
| 20 | `arrivalWeekdays` `[]`, không ngày đặc biệt | 422 |
| 21 | `arrivalWeekdays` `[]` + `arrivalOnSpecialDates: true` | nhận |
| 22 | `arrivalOnSpecialDates` `"true"` (chữ) | 422 |
| 23 | thiếu `channels` | 422 |
| 24 | `channels` `["internal"]` | 422 |
| 25 | `channels` `"direct"` | 422 |
| 26 | `channels` `["direct","agent"]` | nhận |
| 27 | khóa lạ `arrivalWeekday` | 422 |
| 28 | lưu `short_stay_max_nights` = 1 khi có luật 2 đêm | 422, min 2 |
| 29 | DB có sẵn `2` → báo giá Trực tiếp thứ Sáu 13/11, 1 đêm | 200, tối thiểu 0, có log |
| 30 | DB có luật đúng + luật hỏng thiếu `channels` (3 đêm) | 422 `MIN_STAY_NOT_MET`, tối thiểu 2 (luật hỏng bị bỏ), có log |

Ca (a)–(f) QA đề xuất ở BUG-R5-003 vẫn giữ. Ca (a) thêm: phần tử thiếu `channels`, `channels` có `internal` → 422.

### 12.7 Việc theo vai

- **BE (V5-25, cùng PR với `weekend_nights`):** viết lại `case 'min_stay'` theo 12.1; thêm chiều ngược ở `short_stay_max_nights`; đọc phòng thủ 12.3 ở ba chỗ; unit theo các dòng oracle trên (đọc theo id, bỏ `pendingFix` khi đóng BUG-R5-003).
- **ARC:** một dòng mô tả ở `setParameter` (dạng `min_stay`, mã lỗi, `extras`); chốt tên `extras`. Không đổi schema API.
- **UXD:** câu lỗi Desk khi 422 không có `allowed` (lỗi dạng, khóa lạ, luật không áp ngày nào): đề xuất "Giá trị chưa đúng dạng danh sách luật. Xem từ điển tham số, mục Ở tối thiểu." Không chặn V5-25.
- **QA:** chạy ca 12.6 và ca (a)–(f) của BUG-R5-003 khi V5-25 lên staging.
- **DOM/BA:** khi V5-25 lên production, gỡ cảnh báo ở từ điển (`min_stay`, `weekend_nights`, mục "Sắp có ở v1.0.5") và ở sổ tay.

---

## 13. V5-25 mở rộng – biên khi lưu các khóa có cấu trúc khác (PR #96) và `damage_catalog`

Nguồn: PR #96 (nhánh `r5-v5-25`, `parameter-shapes.ts`; mô tả mục 2, 5, 6); ORC 06/11 kéo `damage_catalog` (BR-512) vào V5-25, BE-C mở PR xếp chồng. Biên ở đây là biên kỹ thuật để bắt lỗi gõ, không phải số chính sách. Không đổi giá trị nào đang chạy.

### 13.1 Biên khi lưu – DOM chốt

| Khóa | Biên PR #96 | DOM | Giá trị đang dùng |
|---|---|---|---|
| `special_dates` | ≤ 100 khoảng; mỗi khoảng 1–31 đêm, ngày có thật, `to` sau `from`; `name` ≤ 100 ký tự | **Chốt.** `to` là ngày sau đêm cuối (nửa mở, như từ điển). Mùa dài hơn 31 đêm thì chia nhiều khoảng. Khoảng chồng nhau vẫn nhận | 6 khoảng, dài nhất 9 đêm → qua |
| Danh sách bậc (`los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`) | ≤ 10 phần tử | **Chốt, thêm một điều:** `cancel_policy_direct` **không rỗng** (`[]` → 422 `REQUIRED`). Bộ tính hiểu `[]` là không hoàn mọi trường hợp, nên lỡ xóa trắng ô là đổi chính sách lặng lẽ. Muốn không hoàn hẳn: `[{"minDays":0,"refundPct":0}]` | qua; `los_discount` `[]` (hướng dẫn B3) vẫn nhận |
| `los_discount.minNights` | 1–89, không trùng | **Chốt.** 89 là trần của `short_stay_max_nights`; bậc lớn hơn đơn ngắn ngày dài nhất chỉ không bao giờ áp | qua |
| Mọi phần trăm | 0–100, nhận số lẻ | **Sửa:** tối đa **2 chữ số thập phân**, chữ số thứ ba → 422. Bộ tính đổi ra phần vạn (`pctToBp` làm tròn), nên 12,345 bị tính thành 12,35 mà không ai biết | số nguyên → qua |
| `cancel_policy_direct.minDays`, `early_departure_refund.minNoticeDays` | 0–365 | **Chốt** | qua |
| `checkout_reminders.before` | ≤ 6 mốc | **Chốt** | 3 mốc → qua |
| `max_open_holds_per_user` | 0–50 mỗi vai; thiếu vai thì bỏ qua | **Sửa:** **bắt buộc đủ hai vai** `collaborator`, `sales_staff` (thiếu → 422 `REQUIRED` ở `value.<vai>`). Bộ tính hiểu vai thiếu là không giới hạn (`reservations.service.ts` `assertOpenHoldLimit`), tức mất chốt SEC-BE-28 lặng lẽ. 0 = vai đó không được giữ chỗ: nhận | đủ hai vai → qua |
| `lease_terms` | 1–12 kỳ; `months` 1–60, không trùng; `discountPct` 0–100 | **Chốt** cho v1.0.5. H7 (đổi cấu trúc theo ESC-045 câu 2) xét lại số kỳ | 5 kỳ → qua |
| `weekend_uplift_channels`, `special_uplift_channels` | một trong `all`, `direct`, `agent`, `ota` | **Chốt.** Một mức giá mọi kênh (BR-103), mức tăng đang 0 (ESC-045 câu 1). Cần "mọi kênh trừ OTA" thì đổi kiểu khóa sau | `all` → qua |

**Có biên nào chặn giá trị đang dùng không: không.** Đối chiếu với `production-defaults.ts`, DS-E, đối chiếu chỉ đọc 06/11 (từ điển, mục "Tham số trên production lệch sổ tay": các khóa lệch vẫn mang giá trị cũ, đúng dạng) và hướng dẫn chuyển giá 01/11 (B3 `los_discount` `[]`, B5 `short_stay_max_nights` 29, B7 `early_checkin_tiers` bậc mới). Ba chỗ DOM sửa cũng không chặn: giá trị đang chạy là số nguyên, có đủ hai vai, chính sách hủy có ba bậc.

**Chốt cuối là câu SQL chỉ đọc của PR:** ORC chạy trên production trước khi lên v1.0.5. Dòng `ok = false` thì chủ đầu tư sửa trên Desk trước khi lên. BE cập nhật câu SQL theo ba chỗ sửa và thêm hai dòng chỉ in số ở 13.2.

### 13.2 Giá trị hỏng đã nằm trong DB – bỏ qua hay chặn

Nguyên tắc (mở rộng 12.3): (1) không bao giờ 500; (2) không tính sai tiền mà không ai biết; (3) không dừng bán, không giữ khách ở quầy vì một tham số phụ khi đã có đường làm tay.

| Khóa | Đường đọc | Khi hỏng | Lý do |
|---|---|---|---|
| `min_stay` | bán | bỏ luật hỏng (12.3, đã có trong PR) | – |
| `weekend_nights` | bán | **bỏ qua**: coi như không có đêm cuối tuần | Mức tăng đang 0. Dừng bán thiệt hơn |
| `special_dates` | bán, ở tối thiểu, không hoàn ngày cao điểm | **bỏ khoảng hỏng**, giữ khoảng đúng | Bỏ một khoảng chỉ làm luật dễ hơn cho khách |
| `*_uplift_channels` | bán | **bỏ qua**: không áp mức tăng | Như trên |
| `los_discount` | bán | **bỏ bậc hỏng**, giữ bậc đúng | Báo giá hiện dòng giảm nên người bán thấy. Đang `[]` |
| `lease_terms` | khối "So sánh: thuê 1 tháng" | **bỏ qua**: không hiện khối, báo giá ngắn ngày vẫn ra | Khối chỉ là thông tin phụ |
| `checkout_reminders` | Hôm nay, trạng thái khách đi | **bỏ qua**: không nhắc, màn vẫn mở | Không phải tiền. Màn Hôm nay không được lỗi |
| `damage_catalog` | bill, ghi phí hư hỏng | **bỏ dòng hỏng** khỏi danh sách chọn. Cả bảng hỏng: không có bảng, lễ tân dùng "món ngoài bảng" (quản lý định giá, có ảnh – BR-512) | Có sẵn đường làm tay. Không giữ khách lúc trả phòng |
| `max_open_holds_per_user` | giữ chỗ của SAL, CTV | **chặn** giữ chỗ mới của SAL, CTV, lỗi rõ. FD+ không ảnh hưởng | Chốt của SEC. Bỏ qua tức là không giới hạn |
| `cancel_policy_direct` | tạo đơn trực tiếp (chép vào `pricing_snapshot`), hủy | **chặn** tạo đơn trực tiếp, lỗi rõ. Không đoán tỷ lệ hoàn. Hủy: bản chép trong đơn hỏng thì dùng chính sách đang hiệu lực, như mã đang làm khi đơn không có bản chép; cả hai hỏng thì chặn | Không nhận đơn khi chưa có chính sách hủy đúng. Hoàn sai là tiền thật |
| `early_departure_refund` | Trả sớm | **chặn** Trả sớm, lỗi rõ (như `PAYMENT_NOT_CONFIGURED` đang có khi giá trị null) | Như trên |
| `early_checkin_tiers`, `late_checkout_tiers` | nhận phòng, trả phòng | **chặn chỉ khi cần bảng**: nhận trước giờ nhận chuẩn (`checkin_time`), trả sau giờ ân hạn (`late_grace_until`). Đúng giờ thì làm như thường | Không đoán phụ thu. Khách đúng giờ không phải chờ |

- **Lỗi rõ** = mã lỗi nghiệp vụ, không 500. ARC chốt mã (DOM đề xuất một mã chung "tham số sai dạng", kèm tên khóa, không kèm giá trị). Desk: "Tham số {tên} đang sai dạng. Báo quản lý sửa ở Tham số quy tắc rồi làm lại." (UXD viết chữ.)
- Quản lý sửa được ngay, chọn **Hiệu lực từ** là hôm nay: dòng hỏng chỉ có thể có từ trước v1.0.5, vì từ V5-25 Desk không cho lưu sai dạng.
- Mọi chỗ bỏ qua đều ghi log như 12.3: khóa, cơ sở, số phần tử bị bỏ; không có giá trị, không có dữ liệu khách.
- **Mức cần có:**
  - **bắt buộc ở v1.0.5:** bộ kiểm khi lưu (PR #96 và PR `damage_catalog`), và câu SQL đạt trên production trước khi lên. Hai việc này làm ca "giá trị hỏng nằm sẵn trong DB" gần như không còn;
  - **nên có ở v1.0.5**, nếu BE kịp với cùng hàm `parameter-shapes.ts`: đọc phòng thủ nhóm bán (`weekend_nights`, `special_dates`, hai khóa `*_uplift_channels`, `los_discount`). Nay các khóa này hỏng thì báo giá 500, cùng mức với BUG-R5-003;
    - (07/11, Lượt 2 review #96) BE chuyển việc này sang R5-B-05, DOM đồng ý. Điều kiện: câu SQL ra `ok = false` ở `special_dates`, `los_discount` hay hai khóa `*_uplift_channels` thì dừng lên bản và sửa trên Desk trước, như `min_stay` và `weekend_nights`;
  - còn lại: R5-B-05 (PO).
- **Hai dòng đếm thêm vào câu SQL** (chỉ in số, ORC chạy cùng lúc): (a) số đơn còn mở có `pricing_snapshot.cancelPolicy` sai dạng, vì câu SQL hiện chỉ xem bảng tham số; (b) số dòng `damage_catalog` sai dạng. Kỳ vọng cả hai là 0, vì chủ đầu tư chưa sửa hai khóa này. Khác 0 thì DOM viết cách xử lý.

### 13.3 `short_stay_max_nights`: 27 hay 29

- **Số đúng là 29.** Nguồn: BR-108, BR-112, BR mục 13 (đổi ở v0.5.0, trước là 27), bảng giá chủ đầu tư 01/11, chủ đầu tư nhắc lại 06/11. Từ điển ghi 29 là đúng.
- **27 ở `production-defaults.ts`** là số khởi tạo lần đầu theo BR v0.4.4 (Round 3), có trước bảng giá 01/11. Tệp chỉ chạy một lần khi dựng production, nên sửa tệp không đổi production.
- **Production hiện còn thấp hơn 29**, theo đối chiếu chỉ đọc 06/11 (từ điển, mục "Tham số trên production lệch sổ tay"): chủ đầu tư chưa làm B5 của hướng dẫn chuyển giá. Đây là việc của chủ đầu tư (B4 rồi B5), đội không đổi tham số giá trên production (plan R5 mục G).
- **Ảnh hưởng tới V5-25: không có.** Trần `nights` của `min_stay` = min(7, `short_stay_max_nights`) = 7, dù là 27 hay 29. Chiều ngược (12.2) chỉ chặn khi xuống dưới 2.
- **Tệp phải sửa:**
  - `product/services/api/src/admin/production-defaults.ts`: 27 → 29. Việc của BE, nhóm B-KYTHUAT (R5-B-05), không cần trong PR #96. Nên làm trong cùng một lượt đồng bộ tệp này với BR mục 13 v0.5.x (các khóa đã đổi ở hướng dẫn chuyển giá 01/11, trừ hoa hồng), để lần dựng lại sau, ví dụ diễn tập VPS mới, không nạp số cũ;
  - DOM đã sửa "Production đang 29" ở mục 12.2 và "đang 29" ở từ điển (bản 1.4).
- **Không cần câu SQL in giá trị.** ORC đã có số từ lần đối chiếu 06/11, hoặc xem trên Desk (tab Khác).

### 13.4 `damage_catalog` (BR-512) – biên khi lưu

| Điểm | Đề xuất ORC/BE | DOM chốt | Lý do |
|---|---|---|---|
| Dạng | danh sách {code, name, priceVnd} | **Chốt**; khóa lạ → 422 `NOT_ALLOWED` | – |
| `code` | `^[a-z0-9_]{1,40}$`, không trùng | **Chốt.** Không cần nới: mã đang có đều qua | – |
| `name` | không rỗng | Không rỗng sau khi bỏ khoảng trắng hai đầu, **≤ 100 ký tự**, **không trùng** (không phân biệt hoa thường) | Lễ tân chọn món theo tên, tên in trên bill. Hai dòng cùng tên khác giá dễ chọn nhầm |
| `priceVnd` | nguyên ≥ 0, trần 100.000.000 | Số nguyên **1.000–20.000.000** | 0 đồng không phải giá đền bù, thường là ô để trống. Bảng chỉ dành cho món nhỏ hay gặp (khăn, ga, ly, remote, thẻ cửa). Món lớn (TV, máy lạnh, nệm, khóa cửa) giá theo đời máy và mức hư, nên đi đường "món ngoài bảng": quản lý định giá, có ảnh, có duyệt (BR-512, BR-426). Trần thấp bắt được lỗi gõ thừa hai số 0 ở món giá vài trăm nghìn |
| Số dòng | – | **≤ 100** | Cơ sở 10 căn cần khoảng 20–50 món. Trần chặn dán nhầm khối lớn và giữ danh sách chọn ở quầy dùng được |
| `[]` | – | **Nhận**: chưa có bảng, mọi món là "ngoài bảng" | Bảng giá chủ đầu tư chưa gửi (ESC-008) |

- Bảng chủ đầu tư gửi (ESC-008) có món trên 20.000.000 thì đội nới trần, không cần ESC.
- Tên món in trên bill khách: theo brand, nên ghi tiếng Anh trước, ví dụ "Bath towel / Khăn tắm". CPY, UXD chốt cách ghi khi có bảng thật; 100 ký tự đủ cho cả hai thứ tiếng.
- Giá trị tạm hiện có là [GIẢ ĐỊNH] (BR-512), không đổi.
- Từ điển: dòng **Giới hạn** của `damage_catalog` ghi "v1.0.4 chưa kiểm, từ v1.0.5 chỉ nhận …", như `min_stay` (bản 1.4).

### 13.5 Ca kiểm QA

| Mã | Ca | Mong đợi |
|---|---|---|
| T-13-1 | `special_dates`: khoảng 31 đêm; 32 đêm; `from` = `to`; ngày 2027-02-30 | nhận; 422; 422; 422 |
| T-13-2 | `cancel_policy_direct` `[]`; `[{"minDays":0,"refundPct":0}]` | 422 `REQUIRED`; nhận |
| T-13-3 | Phần trăm 12,5; 12,345 (ở `los_discount.pct`) | nhận; 422 |
| T-13-4 | `max_open_holds_per_user` `{"collaborator":3}`; `{"collaborator":0,"sales_staff":5}` rồi CTV tạo giữ chỗ | 422 `REQUIRED` ở `value.sales_staff`; nhận, CTV bị chặn `HOLD_LIMIT_REACHED` |
| T-13-5 | `damage_catalog`: `priceVnd` 0; 20.000.000; 20.001.000; 101 dòng; trùng `code`; tên "Ly" và "ly"; `[]` | 422; nhận; 422; 422; 422; 422; nhận |
| T-13-6 | Giá trị đang dùng (`production-defaults.ts`, DS-E, hướng dẫn chuyển giá B3, B5, B7) | nhận hết |
| T-13-7 | DB có sẵn `weekend_nights` = `5` (nếu BE làm đọc phòng thủ nhóm bán) | báo giá 200, không mức tăng, có log |
| T-13-8 | DB có sẵn `early_departure_refund` = `50` → Trả sớm | lỗi rõ, không 500, folio không đổi |

### 13.6 Việc theo vai

- **BE-C (PR #96):** ba chỗ sửa ở 13.1; cập nhật câu SQL và thêm hai dòng đếm ở 13.2; đọc phòng thủ nhóm bán nếu kịp.
- **BE-C (PR `damage_catalog`):** theo 13.4; đọc khi hỏng theo 13.2.
- **BE:** `production-defaults.ts` 27 → 29 trong lượt đồng bộ với BR mục 13 (B-KYTHUAT).
- **ARC:** mã lỗi chung "tham số sai dạng" cho các chỗ chặn ở 13.2. Phần nào không kịp hợp đồng 0.3.13 thì để 0.3.14.
- **UXD:** câu lỗi "tham số sai dạng"; câu cho 422 `REQUIRED` của `cancel_policy_direct`, `max_open_holds_per_user`.
- **PO:** đưa phần "còn lại" của 13.2 vào R5-B-05.
- **QA:** ca 13.5 khi PR lên staging.
- **ORC:** chạy câu SQL (có hai dòng đếm) trên production trước khi lên v1.0.5.
