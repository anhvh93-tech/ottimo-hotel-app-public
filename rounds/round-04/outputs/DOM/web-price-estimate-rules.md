# Luật giá niêm yết ước tính trên web – form "Plan your stay" (ottimo.vn)

- Tác giả: DOM | Round 4 – gói LP-v2 – bước Sản xuất (lượt A) | Ngày: 01/11/2026
- Nguồn việc: FB-INV-009; `rounds/round-04/plan-lp-v2.md` (G1–G3)
- Quy tắc chính thức: **BR-115** (giá ước tính trên web) và **BR-116** (ngang giá OTA cho mọi giá công khai) trong `product/docs/business-rules.md` v0.4.9. File này giải thích, đưa ví dụ cho QA và nêu yêu cầu cho các vai. Mâu thuẫn giữa file này và BR → **BR thắng**.
- ESC mới: **ESC-043** (câu 1: web hiện giá trực tiếp hay giá ngang OTA; câu 2: giá tháng có hiện mức cho khách hộ chiếu nước ngoài).

---

## 1. "Giá niêm yết ước tính" là gì

Là **tổng tiền phòng** một khách sẽ trả nếu đặt **trực tiếp** cho đúng hạng căn, ngày (hoặc số tháng) và số người đã chọn, tính **cùng một động cơ giá** với Desk (BR-101, 104, 107, 110, 203, 204), **đã gồm VAT**, chưa trừ ưu đãi riêng (mã khách quay lại, giá thỏa thuận), chưa gồm dịch vụ tùy chọn.

Ba nguyên tắc:
1. **Một nguồn** (G3): web không có bảng giá riêng. Số ra từ API đọc tham số Desk tại thời điểm khách xem. OWN đổi giá trên Desk → lần xem sau đổi theo.
2. **Không hứa phòng trống**: ước tính không xét đơn đã có (FB-INV-009 chưa gồm phòng trống; FB-INV-002 không nói số căn). Chữ đi kèm luôn nói giá cuối và phòng trống nằm trong báo giá.
3. **Ước tính không được thấp hơn giá thật một cách có hệ thống**: chữ "từ" chỉ dùng cho mức thấp nhất **có thật** trong hạng; các nguồn lệch còn lại phải nêu được lý do khi báo giá (mục 9).

## 2. Hạng căn trên web ↔ căn trên Desk

Web chỉ bán theo **4 hạng công khai** (`room.<no>.public_room_type`, BR-012); không bao giờ hiện số căn, tên phòng hay số lượng căn trong hạng.

| Hạng trên web (slug) | Căn trên Desk | Nhóm OTA (BR-103) | Định mức / tối đa (BR-110) | Giá đêm niêm yết hiện hành (BR-101) | Giá tháng (BR-101) |
|---|---|---|---|---|---|
| City Studio (`standard-studio-city-view`) | 101, 201 | Lầu 1–2 (760.000) | 2 / 3 | 667.000 · 708.000 | 8.000.000 · 8.500.000 |
| Garden Studio (`standard-studio-garden-view`) | 102, 103, 202, 203 | Lầu 1–2 (760.000) | 2 / 3 | 750.000 · 750.000 · 792.000 · 792.000 | 9.000.000 · 9.000.000 · 9.500.000 · 9.500.000 |
| Premium One-Bedroom (`premium-one-bedroom-1`) | 302, 402 | Căn N+ (980.000) | 3 / 4 | 917.000 · 1.000.000 | 11.000.000 · 12.000.000 |
| Signature Two-Bedroom (`signature-two-bedrooms`) | 301, 401 | Căn N (1.050.000) | 4 / 5 | 958.000 · 1.042.000 | 11.500.000 · 12.500.000 |

Ghi chú: giá là bảng khởi tạo BR-101; OWN có thể đã nhập lại ở B2 → QA lấy giá từ Desk staging trước khi so (mục 11 dùng bảng trên). Ánh xạ hạng ↔ căn theo `production-defaults.ts` (INV 26/10).

**Căn tham gia tính giá của một hạng** = căn có `public_room_type` đó, đang bán (không ngừng bán), và **không** có khối OOO chồng lên bất kỳ đêm nào của chuyến. Không xét đơn đặt (không lộ công suất).

**Một hạng có nhiều mức giá** (các căn trong hạng giá khác nhau): API tính tổng cho **từng căn tham gia**, trả `fromTotal` = nhỏ nhất, `toTotal` = lớn nhất. Web hiện **"Từ <fromTotal>"** (cùng logic BR-114). `toTotal` không hiện cho khách, chỉ lưu vào yêu cầu để lễ tân biết khoảng (mục 9). Không trả về số căn, không trả giá từng căn.

## 3. Công thức – ngắn ngày (1–27 đêm)

Cho mỗi căn tham gia, mỗi đêm d của chuyến ([ngày đến, ngày đi), BR-002):

1. **Giá nền đêm** = giá đêm niêm yết của căn **có hiệu lực tại đêm d** (BR-101; lịch đổi giá đã hẹn trước được tính theo đêm).
2. **Lịch giá** (BR-104, kênh Trực tiếp): ngày đặc biệt +30 % > thứ Sáu/thứ Bảy +15 % > 0 %, không cộng dồn; làm tròn **1.000** (BR-005).
3. **Giảm theo thời gian ở** (BR-107): tổng đêm ≥ 7 → −10 %, ≥ 14 → −15 %, áp trên giá từng đêm sau bước 2, làm tròn 1.000.
4. **Sàn ngang giá** (BR-116 – chỉ khi `web_estimate.parity_mode = ota_floor`): giá đêm công khai = max(giá bước 3, giá OTA của nhóm căn đêm d = `ota_base_rate` × cùng mức tăng, làm tròn 10.000).
5. **Phụ thu người** (BR-110, mục 5): cộng theo đêm, **không** giảm theo BR-107, **không** qua sàn ngang giá.
6. **Tổng căn** = Σ đêm (bước 4) + Σ phụ thu. Không làm tròn thêm (mọi số hạng đã là bội 1.000).

`fromTotal`/`toTotal` = min/max của tổng căn trên các căn tham gia.

Điều kiện phải đạt mới hiện số (thiếu một → mục 8): số đêm 1–27 (BR-112); ngày đến trong cửa sổ 365 ngày (BR-112); ở tối thiểu (BR-113); số người ≤ sức chứa tối đa của hạng (BR-110); mọi đêm ≤ `web_estimate.open_until` (mục 8); có ít nhất một căn tham gia; mọi căn tham gia có giá > 0.

**Ở tối thiểu và đêm lẻ**: web **không** áp ngoại lệ đêm lẻ BR-113 (a) cho ước tính – ngoại lệ cần biết căn trống, ước tính không xét phòng trống. Web hiện câu ở tối thiểu, **vẫn cho gửi yêu cầu**; lễ tân kiểm đêm lẻ khi báo giá.

**Từ 15 đêm** (BR-108): hiện thêm một dòng không có số "Ở từ 15 đêm có thể rẻ hơn khi thuê theo tháng – chúng tôi gửi cả hai phương án trong báo giá". Không tự đổi sang giá tháng.

## 4. Công thức – theo tháng

Form gửi số tháng n (đã có trường `months`). Cho mỗi căn tham gia:

- **Tiền thuê/tháng** = làm tròn 10.000 của giá tháng × (1 − giảm kỳ hạn) (BR-203). Kỳ hạn n không trùng mốc → mốc thấp hơn gần nhất (BR-202): 1 → 0 %, 3–5 → 5 %, 6–11 → 8 %, 12–23 → 12 %, ≥ 24 → 15 % (BR-201).
- **Phụ thu khách hộ chiếu nước ngoài +10 %** (BR-109): form không hỏi giấy tờ, và loại khách tính theo giấy tờ (BR-009), không theo ngôn ngữ trang. Cách hiện → **ESC-043 câu 2**. Đề xuất (A): hiện số khách giấy tờ Việt Nam làm số chính, kèm một dòng "Khách lưu trú bằng hộ chiếu nước ngoài: từ <số +10 %>/tháng".
- **Phí dịch vụ/tháng** theo nhóm (BR-204): Lầu 1–2 300.000 · Căn N+ 350.000 · Căn N 400.000 – hiện là dòng riêng "+ phí dịch vụ".
- **Không có số** trên web: điện nước (theo công tơ, BR-501–504), ký quỹ (theo kỳ hạn và giấy tờ, BR-206), gói dọn tùy chọn (BR-204). Web chỉ ghi tên các khoản này.
- **Không** áp phụ thu người/đêm cho thuê tháng (người thêm chỉ làm tăng điện nước – BR-205).
- **Không** áp lịch giá cuối tuần/lễ, không áp sàn ngang giá (OTA không bán theo tháng – nếu INV có bán theo tháng trên Airbnb thì báo lại, ESC-043).

Hiện: **"Từ <tiền thuê nhỏ nhất>/tháng + phí dịch vụ <phí>/tháng"**, kèm kỳ hạn đã áp ("giá cho hợp đồng 6 tháng").

## 5. Khách thêm, giường phụ

- Định mức và sức chứa theo **hạng** (mọi căn trong một hạng có cùng định mức/tối đa – bảng mục 2). Nếu sau này một căn khác định mức trong cùng hạng, API tính theo định mức từng căn.
- Người tính: người lớn (≥ 12 tuổi) và trẻ 6–11 tuổi; trẻ < 6 tuổi miễn phí, không tính sức chứa (BR-110). Form có sẵn 3 ô adults, children (6–11), infants (< 6).
- Người vượt định mức: người lớn **150.000/đêm**, trẻ 6–11 **100.000/đêm**; xếp người lớn vào định mức trước (người vượt tính mức thấp hơn).
- OTTIMO **không bán giường phụ riêng**: người vượt ngủ sofa có sẵn, phụ thu đã gồm bộ đồ dùng (BR-812). Giường 1m4 của Premium **đã nằm trong định mức 3**. Chữ khách thấy nói "khách thêm", không nói "giường phụ có phụ thu" (tránh khách hỏi giá giường).
- Vượt sức chứa tối đa → không hiện số (mục 8).

## 6. Thuế, phí – gồm gì, không gồm gì

| Khoản | Trong ước tính? | Ghi chú |
|---|---|---|
| VAT | **Đã gồm** | Giá niêm yết gồm VAT (BR-523). Thuế suất 8 % có thể thành 10 % từ 01/01/2027 (ESC-033): nếu INV chọn tăng giá, OWN hẹn giá mới có hiệu lực 01/01/2027 → ước tính tự đổi cho các đêm từ ngày đó. Web không tách VAT, không hiện thuế suất |
| Phí dịch vụ ngắn ngày, phí đặt phòng, phí thành phố | Không có | OTTIMO không thu → chữ "đã gồm thuế, không phí ẩn" được dùng |
| Phụ thu khách thêm | Có (theo số người khách chọn) | Mục 5 |
| Giảm 7/14 đêm | Có | BR-107 |
| Mã khách quay lại, giá thỏa thuận, FOC | Không | Chỉ trong báo giá (kênh kín) |
| Nhận sớm trước 12:00, trả muộn, minibar, dọn thêm, giặt ủi, đưa đón | Không | Tùy chọn, phát sinh khi ở |
| Cọc 30 % | Không cộng vào tổng | Chỉ nhắc chữ (đã có trong `site.json` `depositPercent`) |
| Thuê tháng: điện nước, ký quỹ, gói dọn | Không có số | Mục 4 |

## 7. Làm tròn và hiển thị

- Số trên web là **VND số nguyên**, đúng số động cơ giá trả – không làm tròn thành số "đẹp", không đổi USD (BR-004: USD chỉ tham khảo, tỷ giá nhập tay → dễ thành con số khách bám vào). Dấu phân cách theo ngôn ngữ trang (UXD/CPY chốt, ví dụ EN "2,280,000 VND", VI "2.280.000 đ").
- Ngắn ngày: tổng chuyến + dòng chi tiết **theo nhóm giá đêm** của căn rẻ nhất (ví dụ "3 đêm × 760.000"), không dùng giá trung bình (số trung bình lẻ, không khớp báo giá). Có giảm 7/14 đêm thì ghi dòng giảm. Có phụ thu người thì ghi dòng riêng.
- Theo tháng: tiền thuê/tháng và phí dịch vụ/tháng; không nhân thành tổng hợp đồng (tổng hợp đồng phụ thuộc giấy tờ và điện nước).
- Câu điều kiện bắt buộc đi liền con số (như BR-114 (2)): ước tính · đã gồm thuế · cho số khách đã chọn · giá cuối và phòng trống trong báo giá OTTIMO gửi. CPY viết, giọng ngắn – lịch sự – điềm tĩnh, EN dẫn.
- Tính lại mỗi khi đổi hạng, ngày, số tháng, số người. Ngày "hôm nay" tính theo giờ Việt Nam (BR-001).

## 8. Khi nào không hiện số – hiện gì thay thế

Nguyên tắc: **không bao giờ hiện 0, số rỗng, hay số đoán**. Luôn cho gửi yêu cầu (trừ khi form đã chặn vì lý do khác).

| Tình huống | Hiện gì (ý chính – CPY viết chữ) | Gửi yêu cầu? |
|---|---|---|
| Chưa chọn đủ hạng + ngày/số tháng | Không có khối giá | – |
| Ngày đến thứ Sáu, thứ Bảy, ngày đặc biệt mà < 2 đêm (BR-113) | "Tối thiểu 2 đêm cho ngày đến này. Gửi yêu cầu – chúng tôi kiểm đêm lẻ cho anh/chị" | Có |
| Có đêm **sau** `web_estimate.open_until` | "Giá cho những ngày này chưa mở. Chúng tôi gửi trong báo giá" | Có |
| Số người > sức chứa tối đa của hạng | "Hạng phòng này nhận tối đa N khách. Chọn hạng lớn hơn hoặc gửi yêu cầu để chúng tôi gợi ý hai phòng" | Có |
| Không còn căn tham gia (mọi căn của hạng ngừng bán hoặc OOO chồng ngày) | "Hãy gửi yêu cầu, chúng tôi báo giá cho ngày của anh/chị" (không nói lý do) | Có |
| Một căn tham gia thiếu giá / giá 0 | Bỏ căn đó khỏi tính (không bao giờ lấy 0 làm "từ"); nếu không còn căn → như dòng trên. Server ghi cảnh báo cho OWN | Có |
| ≥ 28 đêm | Form đã chuyển sang theo tháng (BR-108, BR-112) | – |
| API lỗi / quá giới hạn tần suất | Ẩn khối giá, form vẫn gửi được | Có |

**`web_estimate.open_until`** – đêm cuối cùng OWN đã xác nhận lịch giá (ngày đặc biệt, mùa cao điểm, giá đã hẹn đổi). Vì sao cần: ESC-032 (mùa cao điểm 2027) và ESC-033 (VAT 2027) còn chờ INV; nếu web hiện giá ngày thường cho một đêm sẽ thành +30 % thì ước tính thấp hơn báo giá tới 30 %. Mặc định đề xuất: **01/01/2027** (lịch Giáng sinh – Tết Dương lịch đã có tới đêm 01/01; đêm 02/01 chờ ESC-032 dòng 1). OWN gia hạn mỗi khi chốt thêm lịch; Desk nhắc OWN khi `open_until` còn < 60 ngày. Ngoài `open_until` mà khách chọn theo tháng → vẫn hiện giá tháng (giá tháng không theo lịch đêm).

## 9. Ước tính và báo giá thật

**Lưu lại (snapshot)**: yêu cầu gửi từ form lưu `fromTotal`, `toTotal`, chi tiết đêm của mức "từ", phụ thu, chế độ ngang giá, thời điểm tính và phiên bản tham số (BR-006). Desk hiện "Khách đã thấy: từ X" cạnh công cụ báo giá (FB-INV-009 – để lễ tân báo giá không lệch).

**Các nguồn lệch hợp lệ** (lễ tân chọn một mã lý do khi báo giá **cao hơn** `fromTotal`):
| Mã | Lý do | Mức lệch điển hình |
|---|---|---|
| `room_at_from_price_taken` | Căn có giá "từ" đã có khách những ngày đó, báo căn khác cùng hạng | City +6 %, Garden +5,6 %, Premium +9 %, Signature +8,8 % (theo bảng mục 2) |
| `guest_details_changed` | Khách đổi ngày, số người, hạng sau khi gửi | Theo thay đổi |
| `price_changed` | OWN đổi giá/lịch sau khi khách xem | Theo thay đổi – xem cam kết dưới |
| `orphan_or_min_stay` | Đêm lẻ / ở tối thiểu xử lý khác | – |

**Cam kết giữ số đã thấy** [GIẢ ĐỊNH – chờ INV xác nhận]: nếu lý do duy nhất là `price_changed` và yêu cầu gửi trong vòng `web_estimate.honor_hours` = **48 giờ**, báo giá giữ đúng con số khách đã thấy cho căn đó. Lý do: một khách sạn 10 căn sống bằng lòng tin; chênh lệch do chính OTTIMO đổi giá trong 2 ngày là rất hiếm và rẻ để giữ.

**Báo giá thấp hơn ước tính** (mã khách quay lại, giá thỏa thuận, hoặc chế độ `ota_floor` – mục 10) → không cần lý do.

DATA theo dõi: tỉ lệ báo giá > `fromTotal` theo mã lý do (gợi ý cho DATA – không bắt buộc ở gói này).

## 10. Ngang giá OTA (rate parity)

### 10.1 Thực tế giá OTTIMO
Giá trực tiếp ngày thường so với giá OTA nền OTTIMO đẩy lên kênh (BR-103):

| Hạng | Trực tiếp thấp nhất – cao nhất | OTA nền nhóm | Trực tiếp thấp hơn OTA? |
|---|---|---|---|
| City Studio | 667.000 – 708.000 | 760.000 | Cả hai căn |
| Garden Studio | 750.000 – 792.000 | 760.000 | 102, 103 thấp hơn; 202, 203 cao hơn |
| Premium One-Bedroom | 917.000 – 1.000.000 | 980.000 | 302 thấp hơn; 402 cao hơn |
| Signature Two-Bedroom | 958.000 – 1.042.000 | 1.050.000 | Cả hai căn |

Thêm giảm 7/14 đêm (BR-107, chỉ Trực tiếp) thì khoảng cách lớn hơn. Ngược lại, khuyến mãi do kênh tự chạy (ví dụ chương trình thành viên của Booking.com, giá ưu đãi của Agoda) có thể kéo giá OTA khách thấy **xuống dưới** giá trực tiếp.

### 10.2 Rủi ro
- **Điều khoản ngang giá hẹp** (giá công khai trên website riêng không được thấp hơn giá trên OTA) phổ biến trong hợp đồng Booking.com/Agoda ở nhiều thị trường. Ở EU đã bị cấm với Booking.com theo Đạo luật Thị trường Số (2024); ở Việt Nam **[chưa xác minh – INV đọc hợp đồng/điều khoản chung của từng kênh]**. Airbnb theo hiểu biết của DOM không áp điều khoản ngang giá với chủ nhà **[chưa xác minh]**.
- **Giá trong form là giá công khai**: ai cũng chọn được ngày và thấy số, không cần đăng nhập. Chữ "ước tính" không làm nó thành giá kín. Giá kín (thường được miễn điều khoản ngang giá) là báo giá gửi riêng qua Zalo/email, mã khách quay lại.
- Hậu quả khi vi phạm (tùy hợp đồng): kênh cảnh báo, hạ thứ hạng hiển thị, mất nhãn ưu đãi, nặng nhất chấm dứt hợp đồng. Với OTTIMO, OTA là kênh chính ngắn ngày → mất thứ hạng đáng giá hơn khoản chênh vài chục nghìn mỗi đêm.
- **Rủi ro ngược**: web cao hơn OTA (402, 202, 203 hoặc khi kênh chạy khuyến mãi) → khách sang OTA, OTTIMO trả hoa hồng 15–18 % (bảng kênh Desk).
- **Giá OTA thật đang chỉnh tay trên extranet** (v1.0 chưa có channel manager – ESC-032 bối cảnh). Sàn ngang giá dùng `ota_base_rate`; nếu INV chỉnh extranet khác `ota_base_rate` thì sàn sai. INV/OWN giữ hai số khớp.
- Cùng rủi ro này đã treo từ ESC-020 L3-B và ESC-035 (con số "chỉ từ 667.000" của BR-114 chưa đăng vì INV chưa kiểm hợp đồng). BR-116 gom hai chỗ về một quy tắc.

### 10.3 Chế độ hiện giá (tham số `web_estimate.parity_mode`, áp chung cho form và giá "từ" BR-114)
- **`direct`** – web hiện đúng giá trực tiếp (mục 3 bỏ bước 4). Ước tính = báo giá cho căn rẻ nhất. Dùng khi INV xác nhận hợp đồng không có điều khoản ngang giá áp cho website.
- **`ota_floor`** – mỗi đêm công khai không thấp hơn giá OTA cùng nhóm, cùng đêm (bước 4). Giảm 7/14 đêm vẫn tính nhưng không xuống dưới sàn. Báo giá gửi riêng (kênh kín) vẫn theo giá trực tiếp → thường **thấp hơn** ước tính, khách vui hơn là bất ngờ. Nhược: web không còn cho thấy lợi ích đặt trực tiếp; ở lâu thì ước tính cao hơn báo giá nhiều (ca 3 mục 11: +19,7 %).
- Biến thể đã cân nhắc và **không** đề xuất: nâng giá niêm yết trực tiếp lên bằng OTA (đổi chính sách giá của INV, mất lợi thế không hoa hồng); chỉ hiện giá sau khi khách để lại liên hệ (đi ngược FB-INV-009, vẫn có thể bị coi là công khai).
- **Mặc định khi phát hành: `ota_floor`** cho tới khi INV trả lời ESC-043 câu 1 – an toàn hợp đồng, đổi bằng tham số, không sửa mã.
- API công khai **chỉ trả con số cuối**; không trả riêng giá trực tiếp, giá OTA, sàn, hoa hồng (yêu cầu cho ARC/SEC). Giá OTA vốn đã công khai trên kênh nên con số cuối ở chế độ `ota_floor` không lộ gì thêm.

## 11. Ví dụ số cho QA

Giả định chung: hôm nay 01/11/2026; giá theo bảng mục 2; VAT 8 % đã gồm; lịch giá BR-104 hiện hành (ngày đặc biệt Giáng sinh – Tết Dương lịch: đêm 24/12/2026 … 01/01/2027); `web_estimate.open_until` = 01/01/2027; không có OOO.

| # | Đầu vào | `direct`: từ (căn) · đến (căn) | `ota_floor`: từ | Cách tính (mức "từ") |
|---|---|---|---|---|
| 1 | Garden Studio, 2 NL, đến thứ Ba 10/11/2026, đi thứ Sáu 13/11 (3 đêm thường) | **2.250.000** (102/103) · 2.376.000 (202/203) | **2.280.000** | 3 × 750.000. Sàn: 3 × max(750.000; 760.000) |
| 2 | City Studio, **3 NL**, đến thứ Sáu 13/11, đi Chủ nhật 15/11 (thứ Sáu + thứ Bảy) | **1.834.000** (101) · 1.928.000 (201) | **2.040.000** | 667.000 × 1,15 = 767.050 → 767.000; 2 × 767.000 = 1.534.000 + người thứ 3: 2 × 150.000 = 300.000. 201: 2 × 814.000 + 300.000. Sàn: OTA Lầu 1–2 cuối tuần 760.000 × 1,15 = 874.000 → 870.000; 2 × 870.000 + 300.000 |
| 3 | Signature Two-Bedroom, 4 NL + 1 trẻ 8 tuổi + 1 trẻ 3 tuổi, đến thứ Hai 16/11, đi thứ Hai 23/11 (7 đêm: 5 thường + thứ Sáu 20, thứ Bảy 21) | **6.994.000** (301) · 7.546.000 (401) | **8.370.000** | Giảm 10 %: thường 958.000 × 0,9 = 862.200 → 862.000; cuối tuần 958.000 × 1,15 = 1.101.700 → 1.102.000 × 0,9 = 991.800 → 992.000 → 5 × 862.000 + 2 × 992.000 = 6.294.000. Người tính: 5 (trẻ 3 tuổi không tính), định mức 4, tối đa 5 → người vượt là trẻ 8 tuổi: 7 × 100.000 = 700.000. 401: 5 × 938.000 + 2 × 1.078.000 + 700.000. Sàn: 5 × 1.050.000 + 2 × 1.210.000 (1.050.000 × 1,15 = 1.207.500 → 1.210.000) + 700.000 |
| 4 | Premium One-Bedroom, 2 NL, đến thứ Năm 31/12/2026, đi thứ Bảy 02/01/2027 (2 đêm đặc biệt) | **2.384.000** (302) · 2.600.000 (402) | **2.540.000** | 917.000 × 1,3 = 1.192.100 → 1.192.000 × 2. 402: 1.300.000 × 2. Sàn: OTA N+ 980.000 × 1,3 = 1.274.000 → 1.270.000 × 2 (402 = 1.300.000 > sàn, giữ) |
| 4b | Như 4 nhưng đi 01/01/2027 (1 đêm, ngày đến đặc biệt) | Không có số – câu "tối thiểu 2 đêm", gửi được | như trái | BR-113 |
| 4c | Như 4 nhưng đi 03/01/2027 (đêm 02/01 sau `open_until`) | Không có số – câu "giá chưa mở", gửi được | như trái | Mục 8 |
| 5 | Garden Studio, **theo tháng 6 tháng** từ 01/12/2026, 2 NL | **Từ 8.280.000/tháng** + phí dịch vụ 300.000/tháng; (ESC-043 câu 2 = A) dòng hộ chiếu nước ngoài **từ 9.110.000/tháng** | như trái (không áp sàn) | 9.000.000 × 0,92 = 8.280.000; NN 9.000.000 × 1,1 × 0,92 = 9.108.000 → 9.110.000. `toTotal` (202/203): 9.500.000 × 0,92 = 8.740.000 |
| 5b | Như 5 nhưng **4 tháng** | **Từ 8.550.000/tháng** + 300.000 | như trái | Mốc thấp hơn gần nhất = 3 tháng, −5 %: 9.000.000 × 0,95 |
| 6 | City Studio, 2 NL, 30/11 – 02/12/2026 (thứ Hai, thứ Ba); OWN đã hẹn giá 101 = 650.000 từ 01/12 | **1.317.000** (101) · 1.416.000 (201) | **1.520.000** | Giá theo đêm: 667.000 + 650.000. Sàn: 2 × 760.000 |
| 7 | Garden Studio, 4 NL, 10–13/11 | Không có số – "tối đa 3 khách", gửi được | như trái | BR-110 |
| 8 | City Studio, 2 NL, đến thứ Bảy 14/11, 1 đêm | Không có số – "tối thiểu 2 đêm" | như trái | BR-113 (không áp ngoại lệ đêm lẻ trên web) |
| 9 | Premium, 2 NL, 10–13/11; căn 302 OOO 09–12/11 | **3.000.000** (402 là căn duy nhất tham gia) | **3.000.000** | 3 × 1.000.000 (402 > sàn 980.000) |

Kiểm thêm cho QA: (a) số trên web = số Desk tính cho cùng căn, cùng ngày, cùng số người ở kênh Trực tiếp (chế độ `direct`); (b) phản hồi API không có số căn, tên phòng, số lượng căn, giá OTA, sàn; (c) đổi giá căn trên Desk staging → lần xem kế tiếp đổi theo; (d) yêu cầu gửi vào Desk mang đúng `fromTotal`/`toTotal` khách đã thấy.

## 12. Yêu cầu chuyển cho các vai (DOM không ghi vào file của họ)

- **PO**: AC nâng US-131 theo mục 3–9; AC "không hiện 0/số đoán" (mục 8); AC snapshot (mục 9); AC ngang giá theo tham số (mục 10.3).
- **ARC/BE**: API công khai dùng **chung** động cơ `PricingService` (không viết công thức thứ hai); trả `fromTotal`, `toTotal`, dòng chi tiết của mức "từ", trạng thái `ok | min_stay | over_capacity | not_open | unavailable`; không trả số căn/giá căn/giá OTA; tham số mới ở mục 13 BR. Giới hạn tần suất (SEC).
- **CPY/UXD**: câu điều kiện (mục 7), các câu thay thế (mục 8), dòng BR-108, dòng giá tháng NN (theo ESC-043 câu 2), không emoji, EN dẫn; ko/zh/ru theo gói LP-v2.
- **SEC**: API giá không cho dò công suất (không xét đơn; trạng thái `unavailable` chỉ do ngừng bán/OOO); rate limit.
- **QA**: mục 11.
- **OWN (qua ORC)**: giữ `ota_base_rate` khớp extranet; gia hạn `web_estimate.open_until` khi chốt lịch.

## 13. Báo cáo DOM

- **Đã làm**: định nghĩa luật giá ước tính web (BR-115), quy tắc ngang giá cho mọi giá công khai (BR-116, BR-114 (5) trỏ về BR-116), 4 tham số mới, 12 ca số cho QA; mở ESC-043.
- **File tạo/sửa**: file này; `product/docs/business-rules.md` (v0.4.8 → v0.4.9); `02-escalations/ESC-043.md`; dòng ESC-043 trong `02-escalations/escalations-index.md`.
- **Giả định**: giá căn = bảng khởi tạo BR-101 (OWN có thể đã đổi ở B2 – QA lấy giá Desk staging); ánh xạ hạng ↔ căn theo `production-defaults.ts`; `web_estimate.honor_hours` 48 giờ [GIẢ ĐỊNH]; `open_until` 01/01/2027; mặc định `ota_floor` tới khi INV trả lời ESC-043; Airbnb không bán theo tháng.
- **Rủi ro**: điều khoản ngang giá chưa xác minh (ESC-043); giá OTA chỉnh tay có thể lệch `ota_base_rate`; ESC-032/033 chưa quyết làm `open_until` ngắn – khách đặt Tết 2027 chưa thấy số; hiện mức giá theo quốc tịch công khai cần luật sư xem (ESC-043 câu 2).
- **Chưa xong**: không có. Ví dụ số mục 11 cần QA đối chiếu lại với Desk staging khi BE xong API.
