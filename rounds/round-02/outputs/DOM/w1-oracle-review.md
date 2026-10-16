# DOM rà oracle `br-examples.json` – Round 2, Tuần 1 (W7)

- Tác giả: DOM | Ngày: 16/10/2026 | Đối tượng: `product/tests/fixtures/br-examples.json` (196 dòng, nguồn BR v0.2) đối chiếu `product/docs/business-rules.md` **v0.3**
- DOM **không sửa** file JSON và seed của QA. Tài liệu này liệt kê dòng QA cần sửa/thêm, kèm lý do.
- Kết quả tổng: 28/28 dòng `[GIẢ ĐỊNH QA]` đã rà – **27 Đúng, 1 Sửa** (BR-605-02); 1 dòng Đúng nhưng nên thêm trường (BR-432-01). Ngoài nhóm này, **22 dòng phải sửa (ngoài BR-605-02) và 17 dòng nên thêm** do BR v0.3 đổi mặc định / sửa BUG-R2-001…003 / INV gửi định mức từng căn; 91 dòng chỉ đổi nhãn.

## 1. Trả lời 2 câu QA hỏi

| # | Câu hỏi | Trả lời DOM | Ghi ở |
|---|---|---|---|
| Q1 | Cọc tính trên tiền phòng, không gồm phụ thu người? | **Đúng.** Cọc ngắn ngày = 30% **tiền phòng** (tổng giá các đêm sau lịch giá BR-104 và giảm giá BR-107), **không gồm** phụ thu người (BR-110), phụ thu nhận sớm/trả muộn, dịch vụ; làm tròn 100.000. Phụ thu người thu cùng phần còn lại khi nhận phòng. Cọc nhóm (BR-322) cũng tính trên tiền phòng. Lý do: khớp chữ "tiền phòng" INV đã duyệt ở ESC-006 A và cách tính hoa hồng (BR-903) | BR-305 v0.3; mục 13 `deposit_base` |
| Q2 | Định tuyến duyệt FOC có gồm owner? | **Có.** Mọi tài khoản có quyền duyệt giá trị đó (BR-433) – gồm chủ đầu tư (không giới hạn) – thấy yêu cầu trong hàng chờ "Chờ duyệt" và duyệt được; ai xác nhận trước thì đóng. **Thông báo đẩy** chỉ gửi vai thấp nhất đủ hạn mức + quản lý; chủ đầu tư nhận thông báo đẩy khi giá trị vượt hạn mức quản lý hoặc cơ sở không có tài khoản quản lý đang hoạt động. Với BR-432-01 (210.000): `routedToRoles` = [front_desk_lead, manager, owner] là **đúng**; nên thêm `pushNotifyRoles` = [front_desk_lead, manager] | BR-432 v0.3; mục 13 `foc_approval_push_roles` |

## 2. Kết quả rà 28 dòng `[GIẢ ĐỊNH QA]`

| ID | Kết quả | Lý do / việc QA làm |
|---|---|---|
| BR-001-01 | Đúng | Ngày đến 18/10 không bị trần 12:00 (BR-302) cắt; hạn 10:00 16/10 |
| BR-002-02 | Đúng | Nửa mở [đến, đi) |
| BR-011-01 | Đúng | 09:00 15/10 → ngày nghiệp vụ 15/10 → 7 ngày |
| BR-011-02 | Đúng | 23:30 15/10 vẫn ngày nghiệp vụ 15/10 → 7 ngày |
| BR-112-01 | Đúng | Cửa sổ 365 ngày gồm hôm nay → ngày đến muộn nhất 14/10/2027 |
| BR-207-01 | Đúng | Nhắc 7 ngày trước + đúng ngày hạn; "quá 3 ngày" đủ 3 là quá (BR 0.2.5) → 4/2. Nhãn: chu kỳ thu INV-005, mốc nhắc vẫn GĐ |
| BR-209-02 | Đúng | 2027 không nhuận → 28/2 |
| BR-304-01 | Đúng | Hết ngày 18/10 giờ VN |
| BR-309-02 | Đúng | 22 − 17 = 5 ngày → 50% |
| BR-311-01 | Đúng | Ngày đến 20/10 không đổi kết quả; `autoMark` false đúng (app không tự đánh dấu) |
| BR-312-01 | Đúng | Ngày ghi nhận chỉ để so thứ tự |
| BR-317-01 | Đúng | Đến hôm nay ≤ 24 giờ → đỏ, +60 phút |
| BR-427-01 | Đúng | Công nợ lúc 04:00 hôm sau (24 giờ) – nay là INV-007 (F-A) |
| BR-428-01 | Đúng | Giờ báo không đổi kết quả (đếm theo ngày nghiệp vụ) |
| BR-432-01 | Đúng (thêm trường) | Xem Q2: giữ `routedToRoles`, thêm `pushNotifyRoles: ["front_desk_lead","manager"]`; bỏ `qaAssumption` vì DOM đã xác nhận |
| BR-524-01 | Đúng | Một hóa đơn GTGT ngày trả phòng cho toàn bộ tiền phòng; cọc không xuất hóa đơn. Có thể thêm `invoiceType: "vat"` (loại hình doanh nghiệp, INV 16/10) |
| BR-527-01 | Đúng | "Quá 2 ngày" = đủ 48 giờ → 15:00 17/10 |
| BR-603-01 | Đúng | 08:00 + 12 giờ = 20:00 |
| BR-605-02 | **Sửa** | Ngày đi 18/11 **trước** hạn thị thực 20/11 thì không có gì phải nhắc gia hạn – nhắc chỉ có nghĩa khi kỳ ở vượt hạn thị thực (BR-605 "nếu đơn/HĐ dài hơn → cảnh báo đỏ … nhắc khách gia hạn"). Đổi `departureDate` = `2026-11-25` → kỳ vọng `declareUntil` = `2026-11-20`, `redAlert` = true, `remindFrom` = `2026-11-06`. (Nếu muốn giữ ngày đi 18/11 thì `remindFrom` = null, `redAlert` = false) |
| BR-609-01 | Đúng | Xóa ngay lúc `confirmed`, hạn trên +24 giờ |
| BR-611-01 | Đúng | Đổi nhãn sang INV quyết ESC-010 (ca tối T-A) |
| BR-705-01 | Đúng | Làm tròn đơn giá bình quân tới 1 đồng để hiển thị; giá trị tồn (432.000) giữ làm gốc khi tính tiếp, tránh lệch dồn |
| BR-803-01 | Đúng | Ngày 15/10 không đổi kết quả |
| BR-809-01 | Đúng | Nhận trong 15 phút, phương án trong 2 giờ |
| BR-951-01 | Đúng | Lưu `84905123456`, hiển thị `+84…` |
| BR-952-01 | Đúng | Đảo thứ tự tên + cùng ngày sinh → nghi trùng |
| BR-952-02 | Đúng | Khác ngày sinh → không báo |
| BR-962-01 | Đúng | Không nhận đơn điện thoại khi chưa xem tồn; giao phòng khách có trong bảng dự phòng |

## 3. Dòng phải SỬA do BR v0.3 (mặc định mới, BUG-R2-001…003, định mức từng căn)

| ID | Sửa gì | Lý do (BR v0.3) |
|---|---|---|
| (gốc file) | `source.version` = `0.3`, `date` = `2026-10-16` | BR v0.3 |
| BR-107-01 | Input thành giá từng đêm: căn 202, đến `2026-11-09`, 7 đêm, `nightlyRatesVnd` = [792000×4 (T2–T5), 911000 (T6 13/11), 911000 (T7 14/11), 792000 (CN 15/11)]; kỳ vọng giá sau giảm 713.000 (thường) / 820.000 (cuối tuần), `roomTotalVnd` = **5.205.000** (thay 4.991.000) | Lịch giá +15% T6–T7 áp cả kênh Trực tiếp (ESC-004 A, BR-104); 7 đêm liên tiếp luôn có 1 đêm T6 + 1 đêm T7 |
| BR-107-02 | 14 đêm `2026-11-09`→`2026-11-23` (4 đêm T6/T7): 673.000 / 774.000 → **9.826.000** (thay 9.422.000) | Như trên |
| BR-108-01 | 20 đêm `2026-11-09`→`2026-11-29` (6 đêm T6/T7): `shortStayTotalVnd` = **14.066.000** (thay 13.460.000); 9.800.000 và ký quỹ 4.800.000 giữ nguyên | Như trên |
| BR-305-01 | `roomTotalVnd` 5.205.000 → `depositVnd` **1.600.000**, `remainingAtCheckinVnd` **3.605.000** | Ví dụ BR-305 tính lại theo BR-107 mới |
| BR-903-01 | `roomTotalVnd` 5.205.000 → `commissionVnd` **416.400** | Như trên |
| BR-110-01 | `roomNo` 302 → **202** (Studio); params thay `base_occupancy: 2` bằng `room.202.base_occupancy: 2`, `room.202.max_occupancy: 3`; kỳ vọng giữ **450.000** | Định mức từng căn INV gửi 16/10: 302 nay định mức 3 nên "302, 3 người lớn" = 0 đ |
| BR-110-02 | Đổi thành căn **301** (định mức 4, tối đa 5), 4 người lớn + 1 trẻ 8 tuổi, 3 đêm → **300.000** (người vượt là trẻ, 100.000/đêm). Bản cũ (302, 2 NL + 1 trẻ 8) nay = 0 đ – chuyển thành dòng mới BR-110-03 | Như trên; người lớn xếp vào định mức trước |
| BR-113-01 | Bỏ `escNote`; params thêm `specialDates` (cùng seed) và `orphanNightException: true`; kỳ vọng giữ chặn (24/10 không phải đêm lẻ) | Ở tối thiểu bật mặc định (ESC-004 M-A) – BUG-R2-001 |
| BR-204-01 | Bỏ `issue`; `case` ghi "HĐ mới" | Q-D1 đã quyết (ESC-005 A dòng 3) |
| BR-321-01 | Bỏ `issue`; thêm `expected.groupCodePattern` = `^NH-\d{5}$`, `suggestedRooms` gồm căn trống cùng nhóm Lầu 1–2 (ví dụ `101` nếu trống); khi cả nhóm hết → `suggestUpgrade: "301"` cần `front_desk_lead` | BUG-R2-002; mã theo erd `NH-{n:05}` (BR-007, BR-321) |
| BR-403-01 | Note → "ESC-011 A: luôn 3 số ngẫu nhiên, kể cả khi khóa có giới hạn thử sai; khóa TTLock" | BR-403 v0.3 bỏ lựa chọn 2 số |
| BR-412-01…07 | Params `late_grace_until` `12:00` → **`12:30`**, thêm `late_grace_requires_no_same_day_arrival: true`. Kết quả 01, 02, 03, 05, 06, 07 giữ nguyên | ESC-007 A – BUG-R2-001 |
| BR-412-04 | Trả 12:01 với `sameDayArrival: false` nay = **0 đ** (trong ân hạn). Để giữ ca biên bậc 30%: đổi `sameDayArrival` → **true**, kỳ vọng giữ 210.000 | Ân hạn chỉ khi căn không có khách đến; ân hạn không dời mốc bậc |
| BR-412-08, -09 | Bỏ `escNote`; kết quả giữ nguyên | Mặc định nay là 12:30 |
| BR-433-02 | Thay ca: "Trả muộn 17:00 căn 401 (đêm cuối thứ Tư 1.042.000): 50% = 521.000" → `amountVnd` **521000**, `approverRole` front_desk_lead → `withinLimit: false`, `escalateTo: "manager"`; bỏ `issue` | BUG-R2-003: nhận trước 06:00 là đêm bán (BR-411/417), không phải phụ thu |
| BR-605-02 | Xem mục 2 | – |
| BR-803-02 | Thêm `targetRoom: "202"`; bỏ `issue` | BUG-R2-002 (ví dụ BR nay dùng 202) |
| `notCovered` | Xóa dòng BR-104 (BR v0.3 đã có ví dụ số) | BR-104 v0.3 |

## 4. Dòng nên THÊM (ví dụ mới trong BR v0.3)

| ID đề nghị | Ca | Kỳ vọng |
|---|---|---|
| BR-104-01 | 202, kênh Trực tiếp, đêm thứ Ba 10/11/2026 | 792.000 |
| BR-104-02 | 202, Trực tiếp, đêm thứ Bảy 14/11/2026 | 911.000 |
| BR-104-03 | 202, Trực tiếp, đêm 31/12/2026 (thứ Năm, ngày đặc biệt) | 1.030.000 |
| BR-104-05 | 202, Trực tiếp, đêm 1/1/2027 (thứ Sáu và ngày đặc biệt – không cộng dồn, lấy +30%) | 1.030.000 (không phải 792.000 × 1,3 × 1,15) |
| BR-104-04 | OTA nhóm Lầu 1–2, đêm 31/12/2026 | 990.000 (làm tròn 10.000) |
| BR-110-03 | 302 (định mức 3), 3 người lớn, 3 đêm | 0 đ |
| BR-110-04 | 202, 2 người lớn + 1 trẻ 4 tuổi | 0 đ, không tính vào sức chứa |
| BR-110-05 | 202, 4 người lớn | Chặn (vượt tối đa 3 – GĐ ESC-014) |
| BR-113-02 | Căn 202 có đơn đi 24/10 và đơn đến 25/10; khách web đến T7 24/10 ở 1 đêm | Nhận, gán 202 (đêm lẻ) |
| BR-113-03 | Đêm 24/10 nhóm Lầu 1–2 còn 202 (lẻ) và 101 (không lẻ) | OTA vẫn tối thiểu 2 đêm |
| BR-204-02 | HĐ đang chạy 10.000.000/tháng, 3 lần dọn lẻ | Phí dịch vụ 0; dọn lẻ 300.000 |
| BR-305-02 | Như BR-305-01 + 1 người lớn thêm ở Studio, 7 đêm | Cọc vẫn 1.600.000; phụ thu 1.050.000 thu khi nhận phòng |
| BR-309-07 | Đến 22/10, cọc 700.000, đèo đóng 21/10 có thông báo (bất khả kháng) | Hoàn 0; được dời, ngày đến mới muộn nhất 22/1/2027; giữ cọc 700.000 |
| BR-412-10 | Giá 700.000, trả 12:30, căn không có khách đến | 0 đ |
| BR-412-11 | Giá 700.000, trả 12:31, căn không có khách đến | 210.000 |
| BR-421-03 | Booking 401 ở thêm 1 đêm thứ Bảy | 1.198.000 (1.042.000 × 1,15) |
| BR-527-02 | Khách không cọc online được, đặt ngày 15/10 cho ngày đến 18/10 (3 ngày) | Không nhận đơn không cọc (> 2 ngày); ngày đến 17/10 → nhận, quản lý duyệt, giữ đến 18:00 17/10 |

## 5. Chỉ đổi nhãn (91 dòng): `GIẢ ĐỊNH` → nhãn quyết định INV

Đề nghị QA thêm nhãn `INV` (ví dụ `"labels": ["INV-004"]`) theo BR mục 0.1 v0.3. Dòng có ô nhãn ghép trong BR (ví dụ BR-207, BR-110) giữ thêm `GIẢ ĐỊNH` cho phần chưa quyết.

| Nhãn mới | Dòng |
|---|---|
| INV-004 (24) | BR-005-01…03, BR-009-01, BR-101-01…10, BR-103-01…03, BR-107-01, -02, BR-108-01, BR-109-01, BR-110-01, -02 (kèm GĐ cho sức chứa tối đa), BR-113-01 |
| INV-005 (17) | BR-201-01, BR-202-01, -02, BR-203-01, -02 (INV-004 + 005), BR-204-01, BR-206-01, BR-207-01 (kèm GĐ mốc nhắc), BR-208-01…03, BR-212-01, -02, BR-326-01, -02, BR-506-01, BR-903-01 |
| INV-006 (23) | BR-214-01, BR-302-01, -02, BR-303-01…03, BR-304-01, BR-305-01, BR-309-01…06, BR-311-01, BR-313-01, BR-314-01, BR-322-01, BR-323-01, BR-324-01, BR-428-01…03 |
| INV-007 (24) | BR-411-01…07, BR-412-01…09, BR-413-01, BR-415-01, BR-427-01, BR-433-01, -02, BR-435-01, BR-436-01, -02 |
| INV-008 (1) | BR-501-01 (giữ thêm `PHÁP LÝ`) |
| INV-010 (1) | BR-611-01 |
| INV-011 (1) | BR-403-01 |

Dòng `GIẢ ĐỊNH` **giữ nguyên** (BR chưa có quyết định hoặc chờ INV gửi thông tin): BR-004-01, BR-105-01, -02, BR-111-01, BR-112-01, BR-205-01, BR-210-01, BR-211-01, BR-421-01, -02, BR-503-01 (ngưỡng), BR-507-01, BR-511-01, -02, BR-512-01, BR-809-01, BR-811-01, -02, BR-901-01 (tỷ lệ).

## 6. Seed QA cần đổi theo BR v0.3 (`product/tests/fixtures/seed/ds-e.json`; kiểm thêm `ds-0.json` nếu có sức chứa)

| Tham số / trường | Giá trị mới |
|---|---|
| `late_grace_until` | `12:30`, status INV-007, bỏ `note` |
| `min_stay` | `[{"arrivalWeekdays":["FRI","SAT"],"nights":2},{"arrivalOnSpecialDates":true,"nights":2}]` mọi kênh; status INV-004 |
| `base_occupancy` | bỏ giá trị chung 2 → `room.<no>.base_occupancy`: 101–103, 201–203 = 2; 301, 401 = 4; 302, 402 = 3 |
| `rooms[].maxOccupancy` | 101–103, 201–203 = **3**; 301, 401 = **5**; 302, 402 = **4** (thay 3/4/4 theo nhóm) – GĐ ESC-014 |
| `weekend_uplift_pct`, `special_uplift_pct` | thêm phạm vi kênh = mọi kênh (gồm `direct`) |
| `business_entity_type` | `enterprise` |
| `birthday_code_random_digits` | 3 (status INV-011) |
| Mới | `force_majeure_reschedule_months` 3; `no_deposit_max_lead_days` 2; `no_deposit_hold_until` 18:00 |

Sau khi đổi: `pnpm test:fixtures` để `validate-fixtures.mjs` tính lại; hàm `nights`/`lateCheckout`/`extraPersonFee` cần nhận giá từng đêm, ân hạn có điều kiện và định mức theo căn – BE/QA kiểm `calc` tương ứng.

## 7. Phát hiện thêm cho vai khác (DOM không sửa)

- **Trùng tiền tố `NH-`** (ARC/BA): erd dùng `NH-{n:05}` cho nhóm đơn (`reservation_group`), nhưng BL 4.2 (`hh`), CRM và `security/data-risk-assessment.md` D10 dùng `NH-xxxx` cho **nhóm hộ** (người hay đi cùng). Hai khái niệm khác nhau dùng cùng tiền tố → lễ tân và báo cáo dễ nhầm. BR v0.3 đã theo erd như yêu cầu; DOM đề nghị ARC đổi một trong hai (ví dụ nhóm đơn `DOAN-`, hoặc nhóm hộ `HH-`) trước migration R2 – nếu đổi, DOM sửa BR-007, BR-321 theo.
- **ESC-008**: đã thêm câu hỏi kế toán K-9 về tài khoản nhận cá nhân (theo ORC).
- **ESC-014** (mới): sức chứa tối đa từng căn.
- **Bug list R2** (QA cập nhật trạng thái): BUG-R2-001, -002, -003 đã sửa trong BR v0.3 – đề nghị QA chuyển **Fixed** và kiểm lại.

## 8. Bổ sung BR v0.3.1 (Đợt 0 – INV quyết ESC-014, 16/10)

INV quyết ESC-014: mọi căn nhận vượt định mức tối đa 1 người, ngủ **sofa lớn có sẵn** (không nệm phụ); trẻ dưới 6 tuổi không tính; người ở thêm được cấp 1 bộ đồ dùng (BR-812 mới). Giá trị sức chứa **không đổi** so với mục 3/4/6 ở trên – chỉ đổi nhãn và thêm ca.

**Sửa**
| ID | Sửa gì | Lý do |
|---|---|---|
| (gốc file) | `source.version` = `0.3.1` | BR v0.3.1 |
| BR-110-01, -02 | Nhãn sức chứa tối đa: bỏ `GIẢ ĐỊNH` → `INV-014` (giữ `INV-004` cho định mức/phụ thu) | ESC-014 đã quyết |
| BR-110-05 (dòng đề nghị ở mục 4) | Kỳ vọng "Chặn – vượt tối đa 3", nhãn `INV-014` (bỏ "GĐ ESC-014") | Như trên |
| Seed `rooms[].maxOccupancy` (mục 6) | Giữ 3/5/4, status `INV-014`, bỏ ghi chú GĐ | Như trên |

**Thêm**
| ID đề nghị | Ca | Kỳ vọng |
|---|---|---|
| BR-110-06 | 302 (định mức 3, tối đa 4), 4 người lớn, 3 đêm | Nhận; phụ thu 150.000 × 3 = **450.000**; `extraGuestKits` = 1 |
| BR-110-07 | 302, 5 người lớn | **Chặn** (vượt tối đa 4) |
| BR-110-08 | 401 (định mức 4, tối đa 5), 5 người lớn + 1 trẻ 3 tuổi, 1 đêm | Nhận (trẻ 3 tuổi không tính); phụ thu **150.000**; `extraGuestKits` = 1 |
| BR-812-01 | Đơn 202, 3 người lớn, đến 9/11/2026 đi 12/11, xác nhận 20/10 | Sinh 1 việc `extra_guest_kit_prepare`, `dueAt` = `2026-11-09T14:00:00+07:00`; folio không có dòng tiền riêng; phụ thu 450.000 |
| BR-812-02 | Như 01, buồng phòng bấm "Đã chuẩn bị" 11:20 9/11; tồn bàn chải 40, bộ đồ vệ sinh 25 | Kho: bàn chải **39**, đồ vệ sinh **24** (loại xuất `other`, ghi chi phí phòng); mền/khăn **không** trừ kho |
| BR-812-03 | Như 01, trả phòng 12/11 | Việc dọn trả phòng có dòng "Thu hồi bộ đồ dùng thêm" (1 mền + 1 bộ khăn → giặt) |
| BR-812-04 | 202, 2 người lớn + 1 trẻ 4 tuổi | **Không** sinh việc |
| BR-812-05 | 302, 3 người lớn | Không sinh việc (người thứ 3 ngủ giường 1m4 trong định mức); 302, 4 người lớn → 1 việc |
| BR-812-06 | Đơn 202 sửa từ 3 xuống 2 người lớn ngày 5/11 (chưa chuẩn bị) | Việc **hủy**, kho không đổi |
| BR-812-07 | Đơn Booking 202, `otaGuestCount` = 3 (OTA đã tính giá 3 khách) | Phụ thu người = 0 (BR-110) nhưng **vẫn** sinh 1 việc bộ đồ dùng |
| BR-812-08 | Đơn có nhận sớm đã xác nhận 11:00 ngày đến | `dueAt` = 11:00 ngày đến (không phải 14:00) |
| BR-812-09 | Thêm 1 người lớn giữa kỳ, lễ tân xác nhận 19:10 | Sinh việc ngay, `dueAt` = 20:10 (60 phút, tham số GĐ) |

Tham số seed mới: `extra_guest_kit_items` (mền 1, khăn tắm 1, khăn mặt 1, bàn chải 1 – mã kho, đồ vệ sinh 1 – mã kho), `extra_guest_kit_due` = giờ nhận phòng của đơn, `extra_guest_kit_midstay_due_minutes` = 60.
