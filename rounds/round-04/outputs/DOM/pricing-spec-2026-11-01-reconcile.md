# Đối chiếu bảng giá mới 01/11/2026 với luật và cấu hình Desk – kế hoạch chuyển

- Tác giả: DOM | Round 4 – Phản hồi & sửa | Ngày: 01/11/2026 (tối, trước ngày D 02/11)
- Nguồn: bảng giá INV `00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md` (gọi tắt **Bảng**, chưa commit – chỉ dùng mục 1–4 và 7–8; **mục 5–6 hoa hồng/thưởng không chép vào đây**); INV chốt 01/11 (decision-log dòng "INV chốt câu hỏi bảng giá mới"); `product/docs/business-rules.md` v0.4.9 → **v0.5.0**; mã: `production-defaults.ts`, `reservations/public/pricing.ts`, `pricing.service.ts`, `sales/internal/quote-pricing.ts`, `frontdesk/public/stay-rules.ts`, `platform/internal/parameter-rules.ts`, `admin-web/src/pages/RoomDrawer.tsx`, `ParamDialog.tsx`; nhánh `lp-v2-be` `reservations/public/public-rate.ts` (giá ước tính web).
- ESC mới: **ESC-045** (6 câu; câu 1 Gấp – trước ngày chuyển).

## 0. Kết luận nhanh

1. **Ngày D 02/11 Desk tính theo cấu hình cũ** (INV chốt). Không có cách tạm nào cho lễ tân; số Desk ra là số thu.
2. **Phần ngắn ngày chuyển sang Bảng được hoàn toàn bằng thao tác của OWN** trên Desk (Danh mục căn + Tham số quy tắc), **không cần sửa mã**. Đội đề xuất **ngày chuyển S = 03/11, OWN làm từ 06:00 tới trước 07:00** (trước giờ quầy mở) – mục 2.
3. **Phần thuê tháng**: Desk v1.0 không tự tính HĐ dài hạn (đơn dài hạn nhập tay, HĐ làm ngoài app), nên lễ tân/sale dùng **bảng tra mục 4** từ nay. Phần Desk cần sửa mã là P1/P2 (mục 3), không có P0.
4. **Một rủi ro tiền phải biết** khi chuyển: đơn ≥ 7 đêm tạo trước S rồi được gia hạn/đổi ngày sau S sẽ **mất giảm 10–15 %** trên cả các đêm đã chốt (Desk tính lại bậc theo tham số hiện hành). Hotfix H1 (P1) + cách xử lý tạm ở mục 3.

## 1. Chênh lệch tiền khi Desk còn cấu hình cũ (ngày D tới ngày chuyển)

Giả định (OWN kiểm trên màn Danh mục căn): giá đang có trên Desk = bảng khởi tạo BR-101 OWN nhập ở B2 (giá đêm 101: 667.000 · 102, 103: 750.000 · 201: 708.000 · 202, 203: 792.000 · 301: 958.000 · 302: 917.000 · 401: 1.042.000 · 402: 1.000.000); tham số = `production-defaults.ts` (cuối tuần +15 %, ngày lễ +30 %, ≥ 7 đêm −10 %, ≥ 14 đêm −15 %, từ 28 đêm bắt buộc dài hạn, trẻ 6–11 tuổi 100.000). Lịch: 02/11/2026 là thứ Hai; 06–07/11 và 13–14/11 là thứ Sáu – thứ Bảy.

Bảng mới tính theo INV chốt + đề xuất ESC-045 (câu 1 A: không tăng cuối tuần/lễ; câu 3 A: trẻ 6–11 tuổi 100.000).

| # | Ca | Desk hiện (cấu hình cũ) | Bảng mới | Chênh (Desk − Bảng) |
|---|---|---|---|---|
| C1 | Garden Studio **102**, 2 người lớn, 02/11 → 04/11 (2 đêm thường) | 2 × 750.000 = **1.500.000** (căn 202/203: 2 × 792.000 = 1.584.000) | 2 × 800.000 = **1.600.000** | −100.000 (202/203: −16.000) |
| C2 | City Studio **101**, 2 người lớn, thứ Sáu 06/11 → Chủ nhật 08/11 | 667.000 × 1,15 = 767.050 → 767.000; × 2 = **1.534.000** | 2 × 800.000 = **1.600.000** | −66.000 |
| C2b | Như C2 nếu OWN **chỉ** nhập giá mới mà **chưa** tắt tăng cuối tuần | 800.000 × 1,15 = 920.000; × 2 = **1.840.000** | **1.600.000** | **+240.000** – lý do phải đổi giá và tham số cùng lúc |
| C3 | Signature **401**, 5 người lớn, 02/11 → 09/11 (7 đêm, có thứ Sáu 06 và thứ Bảy 07) | Đêm thường 1.042.000 × 0,9 = 937.800 → 938.000 (× 5 = 4.690.000); cuối tuần 1.042.000 × 1,15 = 1.198.300 → 1.198.000, × 0,9 = 1.078.200 → 1.078.000 (× 2 = 2.156.000); phụ thu 1 người 150.000 × 7 = 1.050.000 → **7.896.000**; cọc 30 % tiền phòng 6.846.000 → **2.100.000** | 7 × 1.300.000 + 7 × 150.000 = **10.150.000**; cọc 30 % × 9.100.000 → **2.700.000** | **−2.254.000** |
| C4 | Garden Studio **202**, 2 người lớn, 14 đêm 02/11 → 16/11 (4 đêm thứ Sáu/thứ Bảy) | 792.000 × 0,85 = 673.200 → 673.000 (× 10); 911.000 × 0,85 = 774.350 → 774.000 (× 4) → **9.826.000** | 14 × 800.000 = **11.200.000** | **−1.374.000** |
| C5 | City Studio **201**, 2 người lớn, **28 đêm** 02/11 → 30/11 | Desk **chặn** đơn ngắn ngày ("từ 28 đêm là thuê dài hạn") → lễ tân làm đơn dài hạn nhập tay ~1 tháng: 8.500.000 + phí dịch vụ 300.000 (+ điện nước) | Dưới 30 đêm = ngắn ngày: 28 × 800.000 = **22.400.000** (gồm dọn phòng, điện nước) | **≈ −13.600.000** (khác cả loại sản phẩm) |
| C6 | Premium **302**, 3 người lớn + 1 trẻ 8 tuổi, 31/12 → 02/01 (2 đêm lễ) | 917.000 × 1,3 = 1.192.100 → 1.192.000; × 2 = 2.384.000 + trẻ 100.000 × 2 → **2.584.000** | 2 × 1.100.000 + 2 × 100.000 = **2.400.000** (nếu ESC-045 câu 1 = B giữ +30 % lễ: 2 × 1.430.000 + 200.000 = 3.060.000) | +184.000 |
| C7 | Nhận sớm **11:00**, Garden 102 (giá đêm Desk 750.000) | Bậc 30 % [10:00, 12:00) → **225.000** | Miễn phí từ 11:00 khi căn trống (lễ tân xác nhận) → **0** | +225.000 |

Đọc nhanh: với khách ngắn ngày, Desk cũ thường **thấp hơn** Bảng (giá niêm yết cũ thấp, giảm dài ngày); riêng ngày lễ, nhận sớm 11:00–11:59 Desk **cao hơn**. Lớn nhất là khách 28–29 đêm (C5). INV đã chấp nhận chênh lệch này tới ngày chuyển; đơn đã xác nhận giữ giá lúc tạo (BR-006).

Ghi chú: báo giá thuê 1 tháng mà Desk hiện song song từ 15 đêm (BR-108) đang dùng giá tháng cũ (101: 8.000.000; 202: 9.500.000…), phí dịch vụ nhóm chưa nhập trên production (Desk cảnh báo "chưa có phí dịch vụ").

## 2. Kế hoạch chuyển – việc OWN tự làm trên Desk (không cần mã)

### 2.1 Vì sao phải làm tất cả trong một lần, vào buổi sáng ngày chuyển
- Desk lấy **giá niêm yết theo ngày của từng đêm**, nhưng lấy **tham số (tăng cuối tuần, giảm dài ngày, ngưỡng 30 đêm) theo ngày nghiệp vụ lúc tính**. Nếu nhập giá mới hiệu lực trước mà tham số chưa đổi (hoặc ngược lại) thì báo giá ra số lai, ví dụ C2b (+240.000).
- Ngày nghiệp vụ đổi lúc **06:00**. Làm sau 06:00 ngày S, để **Hiệu lực từ = hôm nay (S)** cho cả giá lẫn tham số, xong trước khi quầy nhận báo giá đầu tiên (07:00). Không lên lịch giá cho ngày tương lai: v1.0 chưa xóa được giá đã lên lịch (BUG-R3-018, chỉ ghi đè cùng ngày).
- Đề xuất **S = thứ Ba 03/11** (sau một ngày D chạy ổn). Cần ESC-045 câu 1 trước đó; chưa có thì bỏ qua bước B1–B2, làm phần còn lại.

### 2.2 Bước A – Giá niêm yết 10 căn
Menu **Quản trị → Danh mục căn** → dòng căn → **Sửa** → khối **Giá niêm yết**:
- **Giá tháng**, **Giá đêm niêm yết** theo bảng dưới; **Hiệu lực từ** = hôm nay (S); **Lý do đổi giá**: "Bảng giá INV 01/11/2026" → **Lưu thay đổi**.
- Giá tháng nhập là **giá khách Việt Nam**; khách hộ chiếu nước ngoài +10 % do tham số `foreigner_surcharge_pct` (đã = 10, giữ nguyên).

| Căn | Hạng (nội bộ theo Bảng) | Giá tháng | Giá đêm niêm yết |
|---|---|---|---|
| 101 | Studio City | 8.500.000 | 800.000 |
| 201 | Studio City | 8.500.000 | 800.000 |
| 102 | Studio Garden | 9.000.000 | 800.000 |
| 103 | Studio Garden | 9.000.000 | 800.000 |
| 202 | Studio Garden | 9.000.000 | 800.000 |
| 203 | Studio Garden | 9.000.000 | 800.000 |
| 302 | Premium | 11.500.000 | 1.100.000 |
| 402 | Premium | 11.500.000 | 1.100.000 |
| 301 | Signature | 13.500.000 | 1.300.000 |
| 401 | Signature | 13.500.000 | 1.300.000 |

Định mức và tối đa của 10 căn **đã khớp Bảng** (Studio 2/3, Premium 3/4, Signature 4/5) – không đổi.

### 2.3 Bước B – Tham số quy tắc
Menu **Quản trị → Tham số quy tắc** → tìm theo mã khóa (phần lớn nằm ở nhóm **Khác**, dưới tên có dòng mã) → **Sửa** → **Giá trị mới** (khóa dạng danh sách thì ô **Giá trị (JSON)**, gõ đúng chuỗi dưới) → **Hiệu lực từ** = hôm nay (S) → **Lý do**: "Bảng giá INV 01/11/2026" → **Lưu thay đổi**.

| # | Mã khóa | Đang là | Nhập | Vì sao |
|---|---|---|---|---|
| B1 | `weekend_uplift_pct` | 15 | `0` | Bảng không tăng cuối tuần – **chỉ khi ESC-045 câu 1 = A hoặc B** |
| B2 | `special_uplift_pct` | 30 | `0` | Bảng không tăng ngày lễ – **chỉ khi ESC-045 câu 1 = A** |
| B3 | `los_discount` | `[{"minNights":7,"pct":10},{"minNights":14,"pct":15}]` | `[]` | Bảng: không giảm theo số đêm |
| B4 | `long_stay_required_from_nights` | 28 | `30` | Từ 30 đêm chuyển giá tháng (INV chốt) |
| B5 | `short_stay_max_nights` | 27 | `29` | Ngắn ngày tới 29 đêm |
| B6 | `ota_base_rate` | (L12 760.000, N 1.050.000, NPLUS 980.000 – hoặc chưa nhập) | `{"L12":800000,"N":1300000,"NPLUS":1100000}` | Một mức giá mọi kênh; khóa này vẫn là cơ sở sàn–trần sửa giá (BR-105) và giá đơn OTA khi không nhập tiền OTA, nên phải **bằng giá đêm** của nhóm |
| B7 | `early_checkin_tiers` | `[{"from":"10:00","to":"12:00","pct":30},{"from":"06:00","to":"10:00","pct":50}]` | `[{"from":"10:00","to":"11:00","pct":30},{"from":"06:00","to":"10:00","pct":50}]` | Nhận sớm miễn phí từ 11:00 (INV chốt). Có thể làm ngay tối 01/11 nếu ORC/INV muốn áp từ ngày D – chỉ một tham số, chỉ giảm tiền khách |
| B8 | `short_stay_commission_pct` (nhóm **FOC, hoa hồng, phí kênh**, tên "Hoa hồng sale/CTV – khách ngắn ngày") | 2 tỷ lệ cũ | `{"collaborator": X, "staff": X}` với X = tỷ lệ "Sale theo đêm" mục 5.1 bảng nội bộ | Bảng có một mức Sale cho cả nhân viên và CTV. **Không ghi X vào kho mã/tài liệu.** Cách tính cơ sở vẫn theo Desk cũ tới hotfix H2 |
| B9 | `long_stay_compare_from_nights` | 15 | `30` **nếu ESC-045 câu 6 = A**; không thì giữ | Không tự hiện phương án thuê tháng cho khách dưới 30 đêm |
| B10 | `child_fee_6_11` | 100.000 | giữ (ESC-045 câu 3 A); `150000` nếu INV chọn B | |
| B11 | `rounding.monthly_rent` | 10.000 | `1000` (nếu màn hình từ chối thì bỏ qua) | Bảng làm tròn 1.000 cho tiền tháng; khóa chỉ dùng cho phương án thuê 1 tháng hiện song song |

Không đổi: `checkin_time` 12:00, `checkout_time` 12:00, `late_checkout_tiers` (12:00–15:00 30 %, 15:00–18:00 50 %, sau 18:00 = 1 đêm – **khớp Bảng**), `late_grace_until` 12:30 (Bảng không nói, giữ), `extra_adult_fee` 150.000 (khớp), `foreigner_surcharge_pct` 10 (khớp), `min_stay` (2 đêm khi đến thứ Sáu/thứ Bảy/ngày lễ – Bảng không nói, giữ), `short_stay_deposit_pct` 30 %, `vat_rate` 8 % (giá Bảng hiểu là **đã gồm VAT** như ESC-008 – [GIẢ ĐỊNH – chờ INV xác nhận]), `electricity_price` 5.000, `water_price` 100.000 (khớp), `lease_terms` (Desk v1.0 chỉ đọc mức 1 tháng = 0 %, khớp).

### 2.4 Bước C – Kiểm sau khi nhập (10 phút, chỉ xem số, **không** bấm lưu/gửi báo giá)
Menu **Báo giá** → tạo báo giá kênh Trực tiếp, xem số:
1. Garden Studio, 2 người lớn, thứ Sáu → Chủ nhật tuần đó → **1.600.000** (nếu B1 chưa làm: 1.840.000).
2. Signature 401, 5 người lớn, 7 đêm → **10.150.000**, cọc **2.700.000**.
3. City Studio, 2 người lớn, **29 đêm** → nhận như ngắn ngày, **23.200.000**; **30 đêm** → Desk báo "thuê dài hạn".
4. Premium, 3 người lớn + 1 trẻ 8 tuổi, 2 đêm thường → **2.400.000**.
Sai số nào → chụp màn hình, gửi `/feedback P0 …` trước 07:00; đội trả lời ngay.

### 2.5 Ngoài Desk (cùng ngày S)
- INV tự sửa giá Booking/Agoda/Airbnb: Studio 800.000, Premium 1.100.000, Signature 1.300.000/đêm, không tăng cuối tuần (theo ESC-045 câu 1), không giảm dài ngày (INV chốt mục 3).
- Landing: không đổi tới LP-v2 (giá "từ" BR-114 nay là **800.000**, chưa đăng).
- Sổ tay/tờ dán quầy (PO + UXD sửa, DOM duyệt số): `user-manual-v1.0.md` dòng 242 (tăng cuối tuần/lễ), 244 (giảm ≥ 7/14 đêm), 694 và 740 (28 đêm → 30 đêm), 1419, 1429 (28 → 30), 1545, 1547 (bảng tóm tắt giá); Desk chữ gợi ý ô giá đêm "Cuối tuần, ngày đặc biệt do lịch giá cộng thêm" (`rooms.night_auto`, UXD – nếu câu 1 = A).

## 3. Việc cần sửa mã (hotfix) – xếp ưu tiên

Không có P0: mọi chỗ sai tiền với khách ngắn ngày sửa được bằng bước A–B. Số người-ngày là ước tính DOM, ARC/BE chốt.

| ID | Mức | Việc | Vì sao | Ước công | Hạn đề xuất |
|---|---|---|---|---|---|
| H1 | **P1** | Đơn tạo trước ngày chuyển, khi gia hạn/đổi ngày/thêm đêm (B7/B8, B13, B9a, B18) phải tính lại bậc giảm theo **bảng bậc lưu trên đơn** (snapshot), không theo `los_discount` hiện hành. Hiện `reservations.service` và `move-planner` đọc `ctx.params.losTiers` | Đơn 7 đêm tạo 02/11 ở 202 (đêm thường 713.000 sau giảm) gia hạn sau S → Desk bỏ giảm 10 % cả 7 đêm cũ: khách bị tính thêm ~79.000/đêm đã chốt. Sai BR-006/BR-106 | BE 0,5 ngày + QA 0,5 | v1.0.1 (04/11) nếu kịp; **tạm**: lễ tân báo quản lý, quản lý ghi giảm giá bằng đúng phần chênh (BR-432) và ghi chú "giữ giảm dài ngày theo đơn cũ" |
| H2 | **P1** | Hoa hồng theo bảng nội bộ 01/11: cơ sở tính, trường hợp hủy/không đến đã thu tiền, hoa hồng thuê tháng và lịch chi, thưởng hiệu suất quản lý. Chi tiết khác biệt DOM gửi ORC **ngoài kho mã** | Desk vẫn tính theo cấu trúc cũ; tỷ lệ OWN đã đặt ở B8 | ARC 0,25 + BE 1–1,5 ngày + QA 0,5 | Trước kỳ chốt hoa hồng đầu tiên **01/12** (`commission_payable_day`) |
| H3 | **P1** | Phí dọn theo lượt cho khách thuê tháng **theo hạng**: City 100.000 · Garden 120.000 · Premium 130.000 · Signature 150.000 (hiện một khóa `adhoc_cleaning_fee` 100.000 cho mọi căn). Khách ngắn ngày giữ BR-506 | Thu thiếu 20.000–50.000/lượt với khách tháng không phải City | BE 0,5 ngày + QA 0,25 | Trước khách tháng đầu tiên nhận phòng; **tạm**: lễ tân thêm dòng phí dịch vụ phần chênh |
| H4 | **P1** | Ngưỡng đơn dài hạn nhập tay tách khỏi 30 đêm: HĐ đủ **1 tháng lịch** phải tạo được dù tháng chỉ có 28–29 đêm (tháng 2). Hiện `MANUAL_LONG_STAY_BELOW_THRESHOLD` dùng chung `long_stay_required_from_nights` | Sau B4, HĐ 1 tháng vào 01/02/2027 (28 đêm) bị chặn | BE 0,25 ngày + QA 0,25 | Trước 15/01/2027 |
| H5 | P1 (gói LP-v2) | Giá ước tính web (nhánh `lp-v2-be`): ngưỡng 30 đêm đã theo tham số – chỉ sửa chú thích/test "28"; `web_estimate.parity_mode` đặt **`direct`** khi phát hành (một mức giá, sàn OTA thừa); dựng lại ví dụ test theo BR-115 v0.5.0 | Đúng INV chốt (4), (2) | BE 0,25 + QA 0,25 | Cùng LP-v2 |
| H6 | P2 | Bỏ "giá OTA nền" khỏi mã: lịch giá OTA và sàn–trần BR-105 lấy từ giá đêm niêm yết của căn; gỡ `ota_base_rate`, `web_estimate.parity_mode` | Tới khi gỡ, OWN giữ `ota_base_rate` = giá đêm (B6) là đủ đúng | ARC 0,25 + BE 1 + QA 0,5 | v1.1 |
| H7 | P2 | Báo giá thuê tháng trên Desk (US-081) theo Bảng: mức giảm theo **khoảng** kỳ hạn (1–3/4–6/7–9/10–12[–23]/24), +10 % trước giảm, làm tròn 1.000, ký quỹ 1 tháng (24 tháng: 2), thu từng tháng, hạn ngày 5, thu khi ký = ký quỹ + tháng đầu. Đổi cấu trúc `lease_terms` (5 mốc → khoảng) | Hiện làm ngoài app với bảng tra mục 4 | ARC 0,5 + BE 2–3 + FE 1–2 + QA 1 | Theo backlog (R4+) |
| H8 | P2 | Nhắc hạn tiền thuê theo ngày 5 (BR-207, ESC-045 câu 5) | Cùng phân hệ thu tiền thuê v1.3 | trong H7/US-064 | v1.3 |
| H9 | P2 | Cập nhật `production-defaults.ts` + seed DS-E + `br-examples.json` theo v0.5.0 (chỉ cho lần dựng mới/test; production đã có giá trị do OWN nhập) | Nhất quán tài liệu – mã | BE 0,25 + QA 0,5 | v1.0.2 |

### 3a. Cập nhật 01/11 khuya (BR v0.5.1 – INV quyết ESC-045 câu 1–6, chưa vận hành → OWN chuyển ngay)

Ngày chuyển S = ngày OWN làm theo `inv-price-switch-guide.md` (không chờ 03/11 06:00). Mục 2 trên vẫn đúng, cộng thêm: B1, B2 = 0 (câu 1 A); B8 `child_fee_6_11` = 150.000 (câu 3); B9 `long_stay_compare_from_nights` = 30 (câu 6 A). Mục 4: HĐ 13–23 tháng dùng 7 %, trên 24 tháng 10 % (câu 2); thu ngày 05 theo tháng lịch, tháng đầu tính lẻ ÷ 30 gộp kỳ sau (câu 5, BR-210); thu khi ký chờ **ESC-047**; trả phòng trước hạn mất ký quỹ, không truy thu (câu 4). Bảng ưu tiên hotfix thay bảng mục 3:

| ID | Mức mới | Thay đổi so với mục 3 | Hạn đề xuất |
|---|---|---|---|
| H1 | **P3** (từ P1) | Không có đơn nào tạo trước ngày chuyển (INV chưa vận hành, không có dữ liệu cũ) → không còn khách bị tính sai. Còn là lỗi tiềm ẩn: nếu sau này INV bật lại giảm theo số đêm rồi đổi bậc, đơn cũ gia hạn sẽ bị tính theo bậc mới. Điều kiện: OWN chuyển trước khi tạo đơn thật đầu tiên ≥ 7 đêm | Backlog (khi INV muốn bật lại `los_discount`) |
| H2 | **P1** (giữ) | Hoa hồng theo bảng nội bộ: cơ sở tính, hủy/không đến đã thu, hoa hồng thuê tháng, lịch chi, thưởng quản lý. Tỷ lệ ngắn ngày OWN tự nhập (B10) – cấu trúc vẫn cần mã | Trước kỳ chốt hoa hồng đầu tiên 01/12 |
| H3 | **P1** (giữ) | Phí dọn theo lượt cho khách thuê tháng theo hạng (100.000 / 120.000 / 130.000 / 150.000); `adhoc_cleaning_fee` dùng chung cho khách ngắn ngày nên không đổi tham số được. Tạm: lễ tân thêm dòng phí phần chênh | Trước khi khách thuê tháng đầu tiên gọi dọn |
| H4 | **P2** (từ P1) | Chỉ vướng HĐ đúng 1 tháng có ít hơn 30 đêm (vào 01/02 → 01/03/2027 = 28 đêm; vào 31/01 → 28/02). HĐ ≥ 2 tháng và 1 tháng ở các tháng khác không vướng | Trước 15/01/2027 |
| H5 | **P1** (gói LP-v2, giữ) | Thêm: dựng lại ví dụ/test giá ước tính có trẻ 6–11 tuổi theo 150.000 (BR-115 v0.5.1: Signature 4 người lớn + trẻ 8 tuổi + trẻ 3 tuổi, 7 đêm = **10.150.000**); `parity_mode` = `direct` | Cùng LP-v2 |
| H6 | P2 (giữ) | Gỡ `ota_base_rate` / giá OTA nền khỏi mã | v1.1 |
| H7 | P2 (giữ, phạm vi đổi) | Báo giá thuê tháng trên Desk theo v0.5.1: giảm theo khoảng 1–3/4–6/7–9/**10–23**/**từ 24**; ký quỹ 1 tháng (24 tháng: 2); **thu theo tháng lịch, hạn ngày 05**; **tính lẻ tháng vào ở ÷ 30 gộp kỳ sau, kỳ cuối khử lệch** (BR-210); thu khi ký theo ESC-047; **trả trước hạn mất ký quỹ, không truy thu** (BR-313) | Theo backlog (R4+) |
| H8 | P2 (giữ) | Nhắc hạn tiền thuê nay đơn giản hơn: **một ngày hạn 05** cho mọi khách (nhắc trước 7 ngày, cảnh báo đỏ ngày 08, quản lý xử lý ngày 15) | v1.3 cùng US-064 |
| H9 | P2 (giữ, thêm khóa) | `production-defaults.ts` + seed DS-E + `br-examples.json` theo v0.5.1: thêm `weekend_uplift_pct` 0, `special_uplift_pct` 0, `los_discount` [], `long_stay_compare_from_nights` 30, `child_fee_6_11` 150.000, `early_termination` `[{"minDays":0,"forfeitPct":100}]`, `early_checkin_tiers` [10:00, 11:00) | v1.0.2 |
| **H10** | **P2 (mới)** | Chữ Desk còn số "28" viết cứng: `field.LONG_STAY_REQUIRES_CONTRACT` ("Từ 28 đêm là thuê dài hạn…"), `bk.long_body` ("Từ 28 đêm phải làm hợp đồng"), `stay.long_hint` ("tổng từ 28 đêm") → đọc ngưỡng từ tham số hoặc ghi 30; `rooms.night_auto` bỏ câu "Cuối tuần, ngày đặc biệt do lịch giá cộng thêm". Chỉ chữ, không đổi tiền; lễ tân có thể hiểu sai ngưỡng 28/30 | v1.0.1 nếu kịp, không thì v1.0.2 (UXD/CPY chữ → FE) |
| **H11** | **P2 (mới, tài liệu)** | Sổ tay `product/docs/manual/user-manual-v1.0.md` dòng 242–244, 595, 694, 740, 1434, 1444, 1560, 1562, 1567 (+15 %/+30 %, giảm 7/14 đêm, 28 đêm, trẻ 6–11 tuổi 100.000) và tờ dán quầy | PO + UXD sửa, DOM duyệt số; ngay sau khi OWN báo "Desk đã chuyển" |

Không có P0.

## 4. Ngày D và tới ngày chuyển – ghi chú cho sổ tay lễ tân

INV chốt: **ngày D lễ tân dùng đúng số Desk tính, không sửa tay giá theo Bảng.** Chỉ chèn 3 dòng sau vào tờ dán quầy (mục giá):

> **Bảng giá mới 01/11/2026.** Từ ngày chủ đầu tư báo "Desk đã chuyển" (dự kiến 03/11), Desk tự tính giá mới: Studio 800.000, Premium 1.100.000, Signature 1.300.000/đêm, khách thêm 150.000/đêm, không giảm theo số đêm, **từ 30 đêm là thuê tháng**. Trước ngày đó, báo giá theo số Desk.
> **Khách hỏi ở 28–29 đêm trước ngày chuyển:** không tự làm HĐ tháng, báo quản lý.
> **Thuê tháng (làm ngoài app):** báo giá theo bảng tra dưới đây từ 01/11. Khách hộ chiếu nước ngoài dùng cột NN.

Bảng tra giá tháng (tiền thuê/tháng sau giảm, làm tròn 1.000; chưa gồm phí dịch vụ 200.000/tháng, dọn phòng theo lượt, điện 5.000 đ/kWh, nước 100.000 đ/người/tháng):

| Hạng | Khách | 1–3 tháng | 4–6 tháng (−3 %) | 7–9 tháng (−5 %) | 10–12 tháng (−7 %) | 24 tháng (−10 %) |
|---|---|---|---|---|---|---|
| Studio City (101, 201) | VN | 8.500.000 | 8.245.000 | 8.075.000 | 7.905.000 | 7.650.000 |
| | NN | 9.350.000 | 9.070.000 | 8.883.000 | 8.696.000 | 8.415.000 |
| Studio Garden (102, 103, 202, 203) | VN | 9.000.000 | 8.730.000 | 8.550.000 | 8.370.000 | 8.100.000 |
| | NN | 9.900.000 | 9.603.000 | 9.405.000 | 9.207.000 | 8.910.000 |
| Premium (302, 402) | VN | 11.500.000 | 11.155.000 | 10.925.000 | 10.695.000 | 10.350.000 |
| | NN | 12.650.000 | 12.271.000 | 12.018.000 | 11.765.000 | 11.385.000 |
| Signature (301, 401) | VN | 13.500.000 | 13.095.000 | 12.825.000 | 12.555.000 | 12.150.000 |
| | NN | 14.850.000 | 14.405.000 | 14.108.000 | 13.811.000 | 13.365.000 |

- NN = giá VN × 1,10 rồi giảm, làm tròn 1.000 gần nhất (số lẻ đúng 500 làm tròn lên – BR-005). Kỳ hạn 13–23 tháng: tạm mức −7 %, ghi "chờ chủ đầu tư duyệt" (ESC-045 câu 2).
- **Ký quỹ** = 1 tháng tiền thuê sau giảm (HĐ 24 tháng: 2 tháng), VN và NN như nhau. **Thu khi ký** = ký quỹ + tiền thuê tháng đầu + phí dịch vụ tháng đầu [GIẢ ĐỊNH – Bảng ghi "ký quỹ + tiền thuê tháng đầu"]. Ví dụ Garden, NN, 6 tháng: 9.603.000 + 9.603.000 + 200.000 = **19.406.000**. Sau đó thu **từng tháng**, hạn ngày 5 (ESC-045 câu 5).
- Thuê tháng **không gồm** khăn, đồ vệ sinh cá nhân, ly tách; giao nội thất + 2 bộ ga giường. Dọn theo lịch khách đặt, tính theo lượt: City 100.000 · Garden 120.000 · Premium 130.000 · Signature 150.000.

## 5. Mâu thuẫn và trạng thái quyết định

| # | Điểm | Trạng thái | Phương án / việc của đội |
|---|---|---|---|
| M1 | Giờ nhận phòng 14:00 (Bảng) vs 12:00 (FB-INV-004) | **INV chốt 01/11: giữ 12:00**, trả 12:00 | Không đổi Desk/OTA/landing. Phụ thu nhận sớm đối chiếu theo mốc 12:00: [06:00, 10:00) 50 % · [10:00, 11:00) 30 % · từ 11:00 miễn phí khi căn sẵn sàng, lễ tân xác nhận (B7). Bậc "10:00–14:00: 30 %" của Bảng thành [10:00, 11:00). Trả muộn khớp Desk |
| M2 | Bảng mục 8 "web hiện giá tháng, bảng giảm kỳ hạn, phí" vs ESC-043 câu 2 và "thân trang không ghi giá" (24/10) | **INV chốt: không hiện giá tháng, bỏ mục 8 của Bảng** | Web chỉ hiện giá ước tính ngắn ngày trong form (BR-115) và giá "từ" (BR-114 = 800.000); thuê tháng hiện lời mời ưu đãi, không số |
| M3 | Tên hạng trong Bảng ("Studio — City View", "Premium — 1 PN + 1"…) vs tên khách thấy | **INV chốt: khách thấy theo website**; tên Bảng chỉ nội bộ | Giữ `public_room_type` hiện có (BR-012). Ánh xạ nội bộ: `studio_city` = 101, 201; `studio_garden` = 102, 103, 202, 203; `premium` = 302, 402; `signature` = 301, 401 – trùng nhóm Desk (L12 / NPLUS / N) |
| M4 | Chữ "căn hộ dịch vụ" (Bảng mục 3) vs định vị boutique stay | Không cần INV quyết | Chỉ dùng nội bộ, HĐ. Chữ khách thấy: "long stay / thuê theo tháng" (CPY) |
| M5 | Kỳ hạn 13–23 tháng | **Chưa chốt** – INV cần giải thích lại | ESC-045 câu 2 (đề xuất 7 %; trên 24 tháng áp 10 %) |
| M6 | Phụ thu nhận sớm/trả muộn | Trả muộn khớp; nhận sớm khác ở [11:00, 12:00) | B7 (tham số). Ân hạn 12:30 Desk có, Bảng không nói → giữ |
| M7 | Ký quỹ / thu tiền tháng | Bảng khác BR-201/206/207/208 cũ (ký quỹ 0,5–2 tháng theo kỳ hạn và VN/NN; thu 3 tháng/lần) | Áp Bảng (BR v0.5.0). Câu còn mở: hạn ngày 5 với HĐ vào giữa tháng (ESC-045 câu 5); phí dịch vụ tháng đầu có thu khi ký không (giả định có) |
| M8 | "Giá OTA nền" riêng (BR-103, BR-116) | **INV chốt: một mức giá**, bỏ giá OTA nền riêng | BR-103/116 viết lại; `ota_base_rate` giữ bằng giá đêm (B6) tới khi gỡ mã (H6); `parity_mode` → `direct` khi LP-v2 lên |
| M9 | Cuối tuần/lễ có tăng giá không | **Chưa chốt** – Bảng không nhắc | ESC-045 câu 1 (Gấp, đề xuất không tăng) |
| M10 | Trẻ em 6–11 tuổi | Chưa chốt | ESC-045 câu 3 (đề xuất giữ 100.000, dưới 6 tuổi miễn) |
| M11 | Kết thúc HĐ sớm: Bảng truy thu vs BR-313 không truy thu, phạt ký quỹ | Chưa chốt | ESC-045 câu 4 (đề xuất truy thu + ký quỹ hoàn đủ khi báo trước ≥ 30 ngày) |
| M12 | Khách 15–29 đêm và phương án thuê tháng | Chưa chốt | ESC-045 câu 6 (đề xuất chỉ hiện từ 30 đêm) |
| M13 | VAT | Bảng không nhắc | Giữ "giá đã gồm VAT" (ESC-008, INV 26/10) – [GIẢ ĐỊNH]; mức 10 % từ 2027 vẫn theo ESC-033 |
| M14 | Hoa hồng/thưởng (Bảng mục 5–6) | **INV chốt: không lên kho mã công khai**, Desk vẫn tính theo Bảng | BR-212, BR-903 chỉ ghi "xem bảng giá nội bộ INV 01/11"; tỷ lệ OWN nhập (B8); cấu trúc → H2 |

## 6. Cập nhật tài liệu đã làm
- `product/docs/business-rules.md` → **v0.5.0**: mục 2.0 mới (bảng giá hiệu lực 01/11, áp trên Desk từ ngày chuyển); viết lại BR-101, 103, 114, 115, 116, 201–204, 206–208; ghi chú v0.5.0 ở BR-005, 104, 107, 108, 110, 212, 313, 411, 506, 903; mục 13 các khóa liên quan; mục 18.
- `02-escalations/ESC-045.md` + dòng trong `escalations-index.md`.
- `rounds/round-04/outputs/DOM/web-price-estimate-rules.md`: thêm dòng đầu "ví dụ số đã thay bằng BR-115 v0.5.0".

## 7. Đề xuất dòng ghi decision-log (ORC ghi)
| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-01 | 4 | DOM – BR v0.5.0 theo bảng giá INV 01/11 (mục 1–4): giá đêm một mức mọi kênh 800.000/800.000/1.100.000/1.300.000, không giảm theo số đêm, từ 30 đêm giá tháng, bảng giá tháng + giảm theo khoảng kỳ hạn, ký quỹ 1 tháng (24 tháng: 2), thu từng tháng, phí dịch vụ 200.000, dọn theo lượt theo hạng; nhận sớm miễn phí từ 11:00 (mốc nhận 12:00); hoa hồng chỉ tham chiếu bảng nội bộ | DOM (áp INV) | Bảng giá INV 01/11; INV chốt 01/11 |
| 2026-11-01 | 4 | DOM – Chuyển Desk sang bảng mới bằng thao tác OWN (Danh mục căn + 11 tham số), làm một lần sau 06:00 ngày chuyển, hiệu lực = hôm nay; đề xuất S = 03/11; không có hotfix P0; P1: H1 giữ bậc giảm của đơn cũ, H2 hoa hồng, H3 phí dọn theo hạng, H4 ngưỡng HĐ tháng 2 | DOM | Giá niêm yết theo ngày đêm, tham số theo ngày nghiệp vụ → tránh số lai |
