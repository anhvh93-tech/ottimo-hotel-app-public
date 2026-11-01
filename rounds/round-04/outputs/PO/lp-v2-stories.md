# Round 4 – Gói LP-v2: user story và tiêu chí nghiệm thu (PO)

- Tác giả: PO | Round 4 – Sản xuất, lượt A | Ngày: 01/11/2026 | Nguồn: `rounds/round-04/plan-lp-v2.md` (G1–G5 dùng như đã chốt), **FB-INV-008** (landing thêm `ko`, `zh`, `ru`), **FB-INV-009** (giá niêm yết ước tính trong form "Plan your stay"), FB-INV-002, decision-log 24/10 (thân trang không ghi giá), BR-101…BR-114.
- Kết quả: **4 story** – nâng **US-131** (chỉ phần giá), mới **US-174** (landing tiếng Hàn, Trung giản thể, Nga), **US-175** (form nhận ngôn ngữ mới, Desk hiện ngôn ngữ khách), **US-176** (phần "phòng trống" tách ra từ US-131, chưa làm). **US-156** (tiếng Nga) gộp vào US-174. Backlog đã cập nhật (`03-backlog/backlog.md` mục 3, 4, 7 và bảng epic). Tổng 173 → **176** story.
- Ràng buộc chung cho mọi AC: không đụng production trước và trong ngày D 02/11; phát hành khi QC đạt và INV duyệt Release. Brand Guidelines OTTIMO áp cho mọi chữ, màu, font (EN dẫn – VI hỗ trợ, không emoji); font cho chữ Hàn/Trung/Nga do UXD chọn và ghi lệch.

## 1. Phạm vi gói LP-v2

| Có trong gói | Không có trong gói (ghi rõ để không làm thừa) |
|---|---|
| Giá niêm yết **ước tính** trong form khi khách chọn hạng phòng + ngày (hoặc số tháng) – G1, G2 | Phòng trống, lịch còn/hết, giữ phòng, cờ "sắp hết phòng" (US-176, R4+) |
| Giá lấy từ bảng giá trên Desk, không gõ cứng – G3 | Đặt và trả tiền ngay (US-132), mã giảm giá BR-111 trên web |
| Yêu cầu gửi vào Desk kèm con số ước tính | Giá ở thân trang (decision-log 24/10); con số "chỉ từ" BR-114 (FB-INV-004, nhánh riêng – mục 6 R4) |
| Landing `ko`, `zh` (giản thể), `ru`: trang chủ, form, thư cảm ơn, thông báo xử lý dữ liệu, 404, nút chọn ngôn ngữ – G4 | Desk, app nhân viên, `g.ottimo.vn`, mẫu tin Zalo/email bằng `ko`/`zh`/`ru` (G4) |
| Form nhận ngôn ngữ mới; Desk hiện ngôn ngữ khách đã dùng | Dịch tự động lời nhắn trong Desk; đổi giá sang KRW/CNY/RUB (PRD Won't: đa tiền tệ) |
| Bản dịch do đội làm; cổng người bản xứ + luật sư trước phát hành – G5 | `zh` phồn thể (`zh-Hant`) |

## 2. Thứ tự ưu tiên (PO quyết – trong quyền PO)

| Thứ tự | Story | MoSCoW (trong LP-v2) | Vì sao |
|---|---|---|---|
| 1 | **US-175** – form nhận `ko`/`zh`/`ru`, Desk hiện ngôn ngữ | Must | Nhỏ, là điều kiện của US-174: nếu Desk từ chối hoặc làm mất ngôn ngữ, khách Hàn/Trung/Nga gửi form sẽ lỗi hoặc bị trả lời sai tiếng |
| 2 | **US-131** – giá ước tính trong form (EN/VI trước) | Must | INV gọi tên trực tiếp (FB-INV-009); tăng tỉ lệ gửi yêu cầu cho mọi khách, kể cả khách VI/EN hiện có |
| 3 | **US-174** – landing `ko` → `zh` → `ru` | Must | Đội làm cả ba cùng lúc (cùng một bộ máy đa ngôn ngữ). Thứ tự chỉ dùng khi một ngôn ngữ chậm ở cổng người bản xứ/luật sư: **ko** (khách Hàn đông nhất ở Đà Lạt) → **zh** → **ru** `[GIẢ ĐỊNH – PO xếp theo lượng khách quốc tế tới Đà Lạt; đổi nếu INV có số theo quốc tịch từ Booking.com/Agoda]` |
| – | **US-176** – phòng trống trên web | Should, R4+ | Ngoài gói; cần INV quyết riêng (lộ mức lấp đầy – ESC-020 L7-B) |

**Phát hành theo phần** (để một cổng chậm không giữ cả gói):
- Phần **(a)**: US-175 + US-131 ở EN/VI – phát hành khi QC đạt và đủ AC cổng của US-131 (AC12).
- Phần **(b)**: mỗi ngôn ngữ `ko`, `zh`, `ru` phát hành **riêng** khi ngôn ngữ đó qua cổng của US-174 (AC10, AC11). Ngôn ngữ chưa qua cổng thì **không** có đường dẫn, không có trong nút chọn ngôn ngữ, không có trong `hreflang` và sơ đồ trang.
- Hai phần có thể ra cùng một lần nếu cùng sẵn sàng.
- *(01/11 – thay bởi quyết định INV "Lên cùng một lần", decision-log 01/11: giá ước tính + `ko`/`zh`/`ru` phát hành **một lượt** khi đủ mọi cổng. Các cổng US-131 AC12 và US-174 AC10–AC11 giữ nguyên, chỉ không phát hành lẻ. Một ngôn ngữ chậm cổng thì ORC hỏi INV có tách ra không – đó là quyết định của INV, không phải của PO. Phân loại lỗi trước phát hành: mục 9.)*

## 3. User story và tiêu chí nghiệm thu

Quy ước chung cho các AC dưới đây:
- **"Locale đã phát hành"** = `en`, `vi` và mỗi `ko`/`zh`/`ru` đã qua cổng US-174 AC10–AC11. "Đủ 5 ngôn ngữ" là trạng thái cuối khi cả ba qua cổng.
- **"Desk tính"** = công cụ báo giá trên Desk (US-080) cho cùng căn/hạng, cùng ngày, cùng số người, kênh `direct`, nguồn `website`, ở cùng thời điểm. Đây là đáp án chuẩn để QA so giá web.
- **Bộ dữ liệu thử LP2-F1** (QA dựng trên stack thử/staging, **không** sửa giá production): mọi căn hạng **Standard Studio · Garden View** (102, 103, 202, 203) có giá đêm niêm yết **792.000 đ** và giá tháng **9.500.000 đ** (BR-101 – số của căn 202); lịch ngày đặc biệt mặc định BR-104; ở tối thiểu bật mặc định BR-113; định mức 2, tối đa 3 (BR-110). Cả hạng cùng giá để kết quả không phụ thuộc cách DOM chọn căn đại diện; các số kỳ vọng lấy từ ví dụ đã kiểm của BR-104, BR-107, BR-108, BR-110.
- Con số quy tắc ghi bằng mã BR. Luật giá ước tính trên web (căn đại diện của hạng, làm tròn, giường phụ, cuối tuần/lễ, theo tháng, ngang giá OTA) do **DOM** chốt ở BR mới (`rounds/round-04/outputs/DOM/web-price-estimate-rules.md`); ở đây gọi tắt là **BR-WEB**. DOM chốt khác giả định của PO thì QA đổi số kỳ vọng, dạng AC giữ nguyên.

---

### US-131 – Giá niêm yết ước tính trong form "Plan your stay" – *Must, R4 – LP-v2* (nâng từ Should R3; chỉ phần giá)

> **Là khách tiềm năng** trên ottimo.vn, tôi muốn thấy **giá niêm yết ước tính cho cả chuyến** ngay trong form "Plan your stay" khi chọn hạng phòng và ngày (hoặc số tháng), để biết khoảng chi phí trước khi gửi yêu cầu mà không phải chờ báo giá mới biết.

Nguồn: FB-INV-009 (INV 01/11), G1–G3; FB-INV-002 ý 3 (L7-B, phần giá); BR-101, BR-104, BR-107, BR-108, BR-110, BR-113, BR-114, BR-916 (2); SEC ARC-18; US-155 AC9. Phòng trống tách sang **US-176**.

- **AC1 – Khi nào hiện giá (G1).** Given khách đã chọn **hạng phòng cụ thể** và ngày hợp lệ (ngắn ngày: ngày đến + ngày đi, 1–27 đêm; theo tháng: ngày đến + số tháng hoặc "Chưa chắc"), Then trong vòng **1,5 giây** sau lần chọn cuối (đo trên 4G giả lập, Playwright – `[GIẢ ĐỊNH – mục tiêu của PO]`) khối "giá ước tính" hiện ngay trong form, phía trên các ô liên hệ. Chưa chọn hạng (giữ "Any room – suggest one"), chưa đủ ngày, hay ngày không hợp lệ → **không** có con số, chỉ có câu hướng dẫn (ví dụ "Chọn hạng phòng và ngày để xem giá ước tính"). Đổi hạng, ngày, số người, kiểu ở → con số tính lại, không còn số cũ hiện song song.
- **AC2 – Ngắn ngày: tổng cả chuyến + chi tiết (G2).** Given ngắn ngày, Then khối giá hiện: **tổng ước tính cả chuyến**, số đêm, giá theo từng mức đêm (ví dụ "5 đêm × 713.000 đ + 2 đêm × 820.000 đ") và dòng **giảm theo thời gian ở** (BR-107) khi có; các dòng chi tiết **cộng lại đúng bằng tổng** (lệch 0 đ). Phụ thu người vượt định mức (BR-110) hiện thành dòng riêng nếu BR-WEB đưa vào ước tính.
- **AC3 – Giá web = giá Desk (G3).** Given bộ dữ liệu LP2-F1, When khách nhập các ca dưới đây, Then con số web **bằng đúng** "Desk tính" (lệch **0 đ**) và bằng số kỳ vọng:

  | Ca | Đầu vào (hạng Standard Studio · Garden View, kênh Trực tiếp) | Kỳ vọng | Căn cứ |
  |---|---|---|---|
  | W1 ngày thường | 2 người lớn, 10/11/2026 → 11/11 (đêm thứ Ba) | **792.000 đ** | BR-101, BR-104 |
  | W2 cuối tuần | 2 người lớn, 13/11 → 15/11 (đêm thứ Sáu, thứ Bảy) | 2 × 911.000 = **1.822.000 đ** | BR-104 (+15 %) |
  | W3 lễ | 2 người lớn, 31/12/2026 → 02/01/2027 (đêm 31/12, 1/1 – ngày đặc biệt) | 2 × 1.030.000 = **2.060.000 đ** | BR-104 (+30 %, khoảng 24/12–1/1 gồm hai đầu) |
  | W4 giảm 7 đêm | 2 người lớn, 09/11 → 16/11 | **5.205.000 đ** (5 × 713.000 + 2 × 820.000) | BR-107 ví dụ |
  | W5 giảm 14 đêm | 2 người lớn, 09/11 → 23/11 | **9.826.000 đ** | BR-107 ví dụ |
  | W6 20 đêm | 2 người lớn, 09/11 → 29/11 | **14.066.000 đ** + gợi ý hỏi giá theo tháng (BR-108) | BR-108 ví dụ |
  | W7 người lớn vượt định mức | 3 người lớn, 10/11 → 11/11 | **942.000 đ** (792.000 + 150.000) `[nếu BR-WEB gồm phụ thu người]` | BR-110 |
  | W8 trẻ 6–11 vượt định mức | 2 người lớn + 1 trẻ 8 tuổi, 10/11 → 11/11 | **892.000 đ** `[như W7]` | BR-110 |
  | W9 trẻ dưới 6 | 2 người lớn + 1 trẻ 4 tuổi, 10/11 → 11/11 | **792.000 đ** | BR-110 (không tính) |
  | W10 vượt sức chứa | 4 người lớn | **không** có con số; báo vượt sức chứa như form hiện hành (US-155 AC1) | BR-110 |
  | W11 ở tối thiểu | 2 người lớn, đến thứ Bảy 14/11, 1 đêm | **không** có con số; câu "Cuối tuần và ngày lễ: tối thiểu 2 đêm"; khách **vẫn gửi được** yêu cầu `[GIẢ ĐỊNH – PO; DOM chốt ở BR-WEB vì đêm lẻ BR-113 cần phòng trống]` | BR-113 |
  | M1 theo tháng | 2 người lớn, đến 01/12/2026, 1 tháng | "Từ **9.500.000 đ**/tháng" + ghi chú AC4 | BR-101 (3), BR-203 |
  | M2 theo tháng, chưa chắc số tháng | như M1, "Not sure yet" | như M1 | G2 |

  Thêm một ca **giá lẫn trong hạng** trên dữ liệu khởi tạo thật của Desk (102, 103 = 750.000; 202, 203 = 792.000): con số web = "Desk tính" theo căn đại diện BR-WEB chọn, lệch 0 đ. QA lưu bảng so sánh (đầu vào · số web · số Desk) vào báo cáo kiểm thử.
- **AC4 – Chữ "ước tính" và điều kiện đi liền con số.** *(sửa 01/11 sau QA lượt 2 – mục 9: làm rõ mốc cỡ chữ, thêm ý BR-115 (5))* Given khối giá có con số, ở **mọi locale đã phát hành**, Then trong cùng khối luôn có đủ 4 ý (chữ cuối do CPY viết, EN dẫn): (1) nhãn **"ước tính"** (EN "Estimated" hoặc tương đương CPY chọn) ngay trên/cạnh con số; (2) "giá cuối cùng nằm trong báo giá OTTIMO gửi bạn"; (3) "đã gồm thuế" (giá niêm yết gồm VAT – BR-101 (2)); (4) "chưa giữ phòng"; kèm "cho {n} khách" và "phòng trống được xác nhận trong báo giá" (BR-115 (5)). **Cỡ chữ của cả 4 ý, kể cả nhãn ý (1), không nhỏ hơn nhãn ô của form** (15 px – UXD 01/11; ô nhập 16 px là cỡ chống iOS phóng to, không dùng làm mốc); kiểu chữ hoa/giãn do UXD chọn, miễn không tràn ở 360 px với nhãn tiếng Nga. Theo tháng thêm: chưa gồm phí dịch vụ (BR-204), điện nước theo công tơ (BR-501), giảm theo kỳ hạn (BR-201) và khách nước ngoài +10 % (BR-109) – form không hỏi quốc tịch nên không tự cộng. Kiểm: QA đối chiếu 4 ý trên ảnh chụp của từng locale × ca W1, W4, M1 và đo cỡ chữ tính toán của từng ý ở 360 và 1280 px; thiếu một ý hoặc một ý nhỏ hơn nhãn ô ở một locale = không đạt. **Không** dùng "giá sốc", "rẻ nhất", đồng hồ đếm ngược, "chỉ còn x phòng" (BR-114 (4), US-147 AC6).
- **AC5 – Thân trang không có giá (G1, decision-log 24/10).** Given bản dựng của **mọi trang × mọi locale đã phát hành** (trang chủ, privacy, 404) **trước khi** khách chọn gì trong form, Then số lần xuất hiện của mẫu tiền (chữ số kèm `đ`, `₫`, `VND`, `dong`, `원`, `元`, `руб`, `$`, `USD`, hoặc kèm "/night", "/đêm", "/month", "/tháng" và bản dịch ko/zh/ru) trong HTML, chữ hiển thị, mô tả ảnh, tiêu đề/mô tả trang, ảnh chia sẻ, JSON-LD (`price`, `priceRange`, `offers`) = **0**. Con số chỉ xuất hiện **bên trong khối giá của form** sau khi khách chọn (AC1) và không nằm sẵn trong HTML tĩnh. Kiểm: script quét `dist` + Playwright đọc DOM trước khi tương tác. *Ngoại lệ duy nhất:* con số "chỉ từ" BR-114 nếu INV cho phát hành riêng (FB-INV-004, nhánh `landing-f9-from-price` đang giữ) – không thuộc LP-v2; LP-v2 không thêm số nào ở thân trang.
- **AC6 – Một nguồn giá: đổi trên Desk, web đổi theo (G3).** Given `owner` đổi giá đêm niêm yết (BR-101) hoặc lịch ngày đặc biệt (BR-104) trên Desk, có hiệu lực từ một ngày, Then ước tính trên web cho các đêm từ ngày đó dùng giá mới trong vòng **10 phút** `[GIẢ ĐỊNH – PO; ARC đề xuất số khác nếu có lý do]`, không cần dựng lại hay phát hành lại landing; đêm trước ngày hiệu lực giữ giá cũ. Kiểm trên LP2-F1: đổi giá đêm hạng Garden View thành 800.000 từ 10/11 → ca W1 hiện **800.000 đ** trong 10 phút; không có giá nào gõ cứng trong mã landing (QA quét mã: 0 con số giá trong `src/content`).
- **AC7 – Không phụ thuộc phòng trống (chưa làm phòng trống).** Given cùng đầu vào, When một hay mọi căn của hạng đã có đơn trong khoảng ngày đó, Then con số web **không đổi** và trang không hiện còn/hết phòng; hạng đã kín vẫn cho gửi yêu cầu. (Lý do: phòng trống thuộc US-176; con số thay đổi theo đơn sẽ để lộ mức lấp đầy – SEC ARC-18, ESC-020 L7-B.)
- **AC8 – Không lộ dữ liệu kinh doanh.** Given mọi phản hồi mà trang công khai nhận được cho tính năng này, Then chỉ có các con số khách thấy ở AC2/AC4 (tổng, số đêm, giá từng mức đêm kênh Trực tiếp, dòng giảm, phụ thu người, giá tháng "từ") và mã phiên bản giá; **không** có giá OTA nền (BR-103), giá sàn/trần (BR-105), phí hoa hồng kênh, biên lợi nhuận, số căn, mã căn, tên căn, số đơn, mức lấp đầy. SEC xác nhận bằng review hợp đồng API và thử trực tiếp; có giới hạn tần suất theo SEC (gọi quá giới hạn → form vẫn dùng được, khối giá hiện câu AC9).
- **AC9 – Lỗi không chặn khách.** Given dịch vụ tính giá lỗi, chậm quá 5 giây, hoặc bị giới hạn tần suất, Then khối giá hiện câu thay thế ("Chúng tôi sẽ gửi giá trong báo giá" – CPY chốt), **không** hiện số cũ, số 0 hay chữ lỗi kỹ thuật; khách vẫn gửi được yêu cầu (US-155 giữ nguyên). Kiểm: chặn API giá trong Playwright → gửi form thành công 100 % ca thử.
- **AC10 – Desk nhận con số khách đã thấy.** Given khách gửi yêu cầu sau khi thấy ước tính, Then chi tiết yêu cầu trong hàng chờ "Yêu cầu từ website" (US-155 AC8) hiện **"Giá ước tính khách đã thấy: {số} – tính lúc {giờ}"**; con số này do **hệ thống OTTIMO** xác nhận cho đúng đầu vào (không nhận số do trình duyệt tự khai – SEC ARC-18, BR-916 (2)); khách không thấy giá (AC1 chưa đủ, AC9 lỗi) → "Khách chưa thấy giá". Khi nhân viên "Chuyển thành báo giá" (US-155 AC2) mà giá Desk tính lúc đó khác số khách đã thấy, Desk hiện chênh lệch ("Đã đổi: {cũ} → {mới}") để nhân viên giải thích với khách. Kiểm: ca W1 gửi → Desk hiện 792.000; đổi giá thành 800.000 rồi chuyển báo giá → Desk hiện "792.000 → 800.000".
- **AC11 – Định dạng tiền.** Given mọi locale, Then tiền luôn là **VND**, không quy đổi sang KRW/CNY/RUB/USD (PRD Won't: đa tiền tệ); giá trị số giống hệt nhau giữa các locale cho cùng đầu vào; cách viết dấu phân cách và ký hiệu theo quy ước từng ngôn ngữ do CPY/UXD chốt (ví dụ VI "792.000 đ", EN "792,000 VND").
- **AC12 – Cổng phát hành phần giá.** Given trước khi bật ước tính trên ottimo.vn, Then đã có: (1) BR-WEB của DOM đã review (BA, PO); (2) SEC đạt AC8; (3) INV đã kiểm điều khoản ngang giá (rate parity) trong hợp đồng Booking.com/Agoda/Airbnb với mức giá web có giảm theo thời gian ở (BR-104 lưu ý, BR-114 (5)) – theo đề xuất của DOM; (4) chữ AC4 EN/VI đã INV duyệt; (5) thông báo xử lý dữ liệu không cần đổi (tính năng không thu thêm dữ liệu cá nhân) – SEC xác nhận. Tính năng bật/tắt được bằng cấu hình, tắt thì form chạy như hiện hành.
- **AC13 – Truy cập và giao diện.** Given khối giá, Then đọc được bằng trình đọc màn hình (con số mới được thông báo một lần khi tính xong, không đọc lặp), không gây xô lệch bố cục (CLS ≤ 0,1), không cuộn ngang ở 360px kể cả với tiếng Nga và số dài nhất (ca W6), đúng Brand Guidelines (UXD ký duyệt).

---

### US-174 – Landing ottimo.vn bằng tiếng Hàn, tiếng Trung giản thể, tiếng Nga – *Must, R4 – LP-v2* (mới; gộp US-156)

> **Là khách tiềm năng nói tiếng Hàn, tiếng Trung hoặc tiếng Nga**, tôi muốn đọc toàn bộ ottimo.vn và gửi yêu cầu đặt phòng bằng ngôn ngữ của mình, để hiểu rõ OTTIMO và yên tâm đặt trực tiếp thay vì qua OTA.

Nguồn: FB-INV-008 (INV 01/11), G4, G5; US-152 (khung đa ngôn ngữ), US-153 (nhận diện, tốc độ), US-154 (SEO), US-155 AC10; ADR-014 mục 3, 9; Brand Guidelines.

- **AC1 – Đủ trang ở mọi ngôn ngữ.** Given bản dựng, Then **mỗi** trang của landing (trang chủ, form + thư cảm ơn + thông báo lỗi, thông báo xử lý dữ liệu, 404) có bản ở **mọi locale đã phát hành**, đường dẫn riêng (`/ko/`, `/zh/`, `/ru/` như `/vi/` hiện hành; tên miền gốc vẫn là EN); tập trang của mỗi locale **giống hệt** tập trang EN (QA so danh sách: thiếu 0, thừa 0).
- **AC2 – Không sót chữ.** Given mỗi locale `ko`/`zh`/`ru`, Then mọi khóa chữ của bản EN có bản dịch không rỗng (test so khóa = 0 khóa thiếu); trên trang không còn chuỗi EN/VI cố định ngoài danh sách được phép (tên OTTIMO, tên phòng, địa chỉ, tên pháp nhân, số điện thoại, tên kênh Zalo/WhatsApp/Telegram/Viber/Facebook); mô tả ảnh, tiêu đề và mô tả trang, ảnh chia sẻ link (US-154 AC1) cũng theo locale.
- **AC3 – `hreflang`, `lang`, sơ đồ trang.** Given mọi trang × mọi locale đã phát hành, Then: thẻ `html lang` đúng (`ko`, `zh-Hans`, `ru`); mỗi trang có `link rel="alternate" hreflang` tới **mọi** locale đã phát hành + `x-default` (EN), đường dẫn tuyệt đối, **hai chiều** (A trỏ B thì B trỏ A); mã ngôn ngữ đề xuất `ko`, `zh-Hans`, `ru` `[GIẢ ĐỊNH – PO; ARC đổi `zh-Hans` → `zh-CN` nếu có lý do, ghi ADR-014]`; sơ đồ trang có đủ các bản; locale chưa phát hành không xuất hiện ở đâu cả. Kiểm: script CI hiện có (kiểm hreflang) mở rộng cho 5 locale, 0 lỗi.
- **AC4 – Nút chọn ngôn ngữ.** Given mọi trang, Then nút chọn ngôn ngữ luôn thấy ở đầu trang (US-152 AC2), liệt kê các locale đã phát hành, **EN đứng đầu**, mỗi ngôn ngữ ghi bằng tên của chính nó (English · Tiếng Việt · 한국어 · 简体中文 · Русский), chọn xong mở **cùng trang** ở ngôn ngữ đó; đi được bằng bàn phím và trình đọc màn hình; không vỡ ở 360px.
- **AC5 – Gợi ý ngôn ngữ, không tự chuyển.** Given trình duyệt của khách đặt `ko*` / `zh-CN`, `zh-SG`, `zh-Hans*` / `ru*` và trang đó có bản ở ngôn ngữ ấy, Then hiện dải gợi ý theo US-152 AC2 (viết bằng ngôn ngữ đó, đóng được, giữ lựa chọn); **không** tự chuyển, **0** chuyển hướng khi mở trang chủ (ADR-014 mục 9). Trình duyệt `zh-TW`, `zh-HK`, `zh-Hant*` → **không** gợi ý bản giản thể `[GIẢ ĐỊNH – PO; gói này không làm phồn thể]`.
- **AC6 – Font và chữ hiển thị đúng.** Given mọi trang `ko`/`zh`/`ru`, Then không có ký tự hiện thành ô vuông/ký tự thay thế (QA chụp màn hình từng trang ở 360px và 1280px, kiểm bằng mắt + kiểm font phủ đủ ký tự đã dùng); font do UXD chọn gần nhận diện OTTIMO, ghi lệch Brand Guidelines trong `rounds/round-04/outputs/UXD/lp-v2-design.md`; font **tự host**, 0 yêu cầu tới tên miền ngoài (US-153 AC8, SEC C-1); tiếng Hàn không ngắt giữa từ, tiếng Nga dài hơn không làm tràn nút/nhãn (chừa thêm 40 % – US-152 AC4).
- **AC7 – Ngân sách tải trang giữ nguyên.** Given mỗi trang × mỗi locale đã phát hành, Then đạt các ngưỡng hiện hành của ADR-014 mục 9 và `dist-checks.mjs`: LCP ≤ 2,5 giây (4G, Android tầm trung), CLS ≤ 0,1, Lighthouse Performance ≥ 90 / Accessibility ≥ 95 / SEO ≥ 95; tổng tải lần đầu trang chủ ≤ 700 KB; JS ≤ 15 KB gzip/trang, CSS ≤ 15 KB gzip, HTML ≤ 25 KB gzip, mỗi tệp font ≤ 30 KB. **Trang EN/VI tải 0 byte font Hàn/Trung** (chỉ tải khi trang cần). Muốn nới ngưỡng nào thì ARC/UXD đề xuất có số đo, PO + ORC duyệt trước, ghi decision-log – không nới lặng lẽ trong CI.
- **AC8 – Form ở ngôn ngữ mới.** Given form ở `ko`/`zh`/`ru`, Then nhãn, gợi ý, lỗi theo từng ô, trạng thái đang gửi, thư cảm ơn (câu hứa BR-912 (4) đọc từ tham số), trang "đang bận" (US-155 AC5) và khối giá ước tính (US-131 AC4) đều bằng ngôn ngữ đó; ô lời nhắn có **một câu mời** khách viết thêm bằng tiếng Anh nếu được (không bắt buộc); ô chọn kênh vẫn xếp **Zalo đầu tiên và mặc định**, WhatsApp ngay sau (US-151 AC1); ngày tháng hiển thị theo quy ước ngôn ngữ đó, giá trị gửi đi không đổi.
- **AC9 – Thông báo xử lý dữ liệu theo ngôn ngữ (G5).** Given form ở locale X, Then link và ô đồng ý trỏ tới thông báo xử lý dữ liệu **bản X** có **phiên bản đã đăng** (OPS ghi bằng `publish-privacy-notice.sh` cho `ko`, `zh`, `ru`); yêu cầu gửi đi mang đúng phiên bản của bản X (sai/thiếu → từ chối như `NOTICE_VERSION_INVALID` hiện hành); nội dung khớp nghĩa bản VI/EN đã duyệt (SEC đối chiếu từng mục: mục đích, hạn lưu, quyền của khách, liên hệ).
- **AC10 – Cổng nội dung theo từng ngôn ngữ (G5).** Given một locale `ko`/`zh`/`ru`, Then locale đó **chỉ được phát hành** khi đủ: (1) người bản xứ do INV nhờ đã đọc lại toàn bộ chữ của locale (INV báo "đã duyệt" – ORC ghi decision-log; **không** ghi tên/liên hệ người đọc vào repo); (2) luật sư đồng ý bản dịch thông báo xử lý dữ liệu của locale đó; (3) CPY + UXD xác nhận giọng văn đúng Brand Guidelines (ngắn, lịch sự, điềm tĩnh, không emoji), chuỗi cấm của US-146 AC5 và US-147 AC6 (không "căn hộ dịch vụ", không số phòng, không hạng sao) quét bằng bản dịch tương ứng = 0. Thiếu một điều kiện → locale đó không lên mạng (mục 2, phần (b)), các locale khác không bị giữ.
- **AC11 – Kiểm chất lượng như EN/VI.** Given mỗi locale đã phát hành, Then các kiểm tự động hiện có của landing (axe không lỗi mức nghiêm trọng, header bảo mật, 0 yêu cầu ngoài, không ô đồng ý tích sẵn, không link OTA, màu đúng bảng Brand) chạy và xanh cho locale đó; QA chạy đầu-cuối form một lần cho mỗi locale (gửi được, Desk nhận – US-175).
- **AC12 – Khả năng đổi chữ về sau.** Given chữ của `ko`/`zh`/`ru` nằm cùng chỗ với chữ EN/VI hiện hành (mỗi ngôn ngữ một tệp nội dung), Then sửa một câu của một ngôn ngữ không cần sửa mã giao diện.

---

### US-175 – Form nhận ngôn ngữ mới; Desk hiện ngôn ngữ khách – *Must, R4 – LP-v2* (mới)

> **Là sale / lễ tân** (`sales_staff`, `front_desk`), tôi muốn yêu cầu đặt phòng gửi từ trang tiếng Hàn, tiếng Trung hay tiếng Nga vào Desk đầy đủ như yêu cầu EN/VI và ghi rõ khách dùng ngôn ngữ nào, để trả lời đúng ngôn ngữ (bằng công cụ dịch nếu cần) và không mất khách vì lỗi hệ thống.

Nguồn: FB-INV-008 ("Desk hiện ngôn ngữ khách đã dùng"), G4; US-155 AC1, AC2, AC8; BUG-R3-050 (ngôn ngữ/liên hệ không sang hồ sơ khi báo giá – P3, đích v1.0.1) *(01/11: trước đây dẫn nhầm "BUG-R3-055")*; ESC-044 (INV 01/11 – công cụ dịch bên ngoài được phép, không giới hạn). AC3–AC6 sửa 01/11 sau QA lượt 2 (mục 9).

- **AC1 – Nhận đủ.** Given khách gửi form hợp lệ từ `/ko/`, `/zh/` hoặc `/ru/`, Then yêu cầu vào hàng chờ "Yêu cầu từ website" như yêu cầu EN/VI (cùng trạng thái, nguồn `website` + nguồn phụ, thông báo cho nhân viên – US-155 AC6, AC8); **0** yêu cầu bị từ chối chỉ vì ngôn ngữ (kiểm: mỗi locale một ca đầu-cuối + test API với mỗi giá trị ngôn ngữ).
- **AC2 – Chữ không Latinh giữ nguyên.** Given tên và lời nhắn viết bằng chữ Hàn, chữ Hán, chữ Kirin (kể cả trộn với tiếng Anh, emoji khách tự gõ), Then Desk hiện đúng từng ký tự (không lỗi mã hóa, không cắt giữa ký tự), giới hạn độ dài tính theo ký tự như hiện hành; kiểm tra "lời nhắn có số giấy tờ/số thẻ" (US-155 AC5) vẫn chạy.
- **AC3 – Desk hiện ngôn ngữ khách.** *(sửa 01/11 sau QA lượt 2: nói rõ phần danh sách)* Given một yêu cầu, Then **danh sách S35 có cột "Ngôn ngữ"** và ngăn chi tiết có dòng ngôn ngữ, nhãn bằng tiếng Việt cho nhân viên (Tiếng Anh · Tiếng Việt · **Tiếng Hàn** · **Tiếng Trung (giản thể)** · **Tiếng Nga**; Desk tiếng Anh dùng bản EN của nhãn); danh sách **lọc được theo ngôn ngữ**, kết hợp với bộ lọc trạng thái hiện có; thông báo trong app vẫn **không** chứa tên, SĐT, email (US-155 AC8). Giao diện Desk **không** dịch sang ko/zh/ru (G4). Kiểm: mỗi ngôn ngữ một yêu cầu → đúng nhãn ở cột và ngăn chi tiết; lọc từng ngôn ngữ chỉ còn yêu cầu ngôn ngữ đó; ở 1366 px bảng không cuộn ngang thêm vì cột mới (UXD chọn bố cục cột).
- **AC4 – Chuyển thành báo giá không lỗi, không mất ngôn ngữ.** *(sửa 01/11 sau QA lượt 2: nói rõ "ghi lại ngôn ngữ" ở mức gói này, nơi hiện câu Desk)* Given yêu cầu `ko`/`zh`/`ru`, When nhân viên "Báo giá" hoặc "Giữ chỗ" (US-155 AC2), Then:
  1. Thao tác thành công (không lỗi do hồ sơ khách chỉ nhận vi/en/ru).
  2. Ô "Ngôn ngữ gửi khách" chọn sẵn **tiếng Anh** cho `ko`/`zh`, **tiếng Nga** cho `ru`; ngay cạnh ô, với `ko`/`zh`, Desk hiện câu kiểu "Khách viết bằng tiếng Hàn – tin gửi bằng tiếng Anh" (bản EN của Desk có câu tương ứng; CPY/UXD chốt chữ) ở **cả** hộp báo giá **và** hộp giữ chỗ.
  3. Hồ sơ khách tạo từ yêu cầu (tạo nhanh) lưu **ngôn ngữ gửi tin** = `en` cho `ko`/`zh`, `ru` cho `ru` (và `en`/`vi` như yêu cầu EN/VI); mở lại báo giá hay gửi tin sau đó **không** quay về tiếng Việt. Hồ sơ có sẵn mà nhân viên đã đặt ngôn ngữ khác thì không tự đổi.
  4. **Ngôn ngữ gốc** (`ko`/`zh`/`ru`) tra được từ yêu cầu website đã liên kết với báo giá/đơn; gói này **không** bắt buộc thêm giá trị `ko`/`zh` vào hồ sơ khách (Desk chưa có mẫu tin các ngôn ngữ này – G4).
  Cách lưu do ARC chọn. Phần 3 sửa cùng **BUG-R3-050** (cùng gốc cho yêu cầu EN; đích v1.0.1). Kiểm: mỗi ngôn ngữ ko/zh/ru: báo giá → giữ chỗ → mở lại báo giá → tin vẫn đúng tiếng Anh/tiếng Nga; một ca EN hồi quy BUG-R3-050.
- **AC5 – Đếm được trên S35.** *(sửa 01/11 sau QA lượt 2: bỏ "báo cáo/xuất", đếm bằng lọc S35)* Given `owner` mở S35, When chọn lọc một ngôn ngữ (kết hợp bộ lọc trạng thái, gồm cả yêu cầu đã thành đơn và đã đóng), Then Desk hiện **tổng số yêu cầu khớp bộ lọc**, không phụ thuộc số trang đã tải. Kiểm: 5 ngôn ngữ, số Desk hiện = số đếm từ API cho cùng bộ lọc, có ca hơn một trang. Số chỉ gồm yêu cầu còn trên Desk; báo cáo/xuất dữ liệu yêu cầu website theo ngôn ngữ **không** thuộc gói (dời v1.2 cùng US-104 – backlog mục 5.6).
- **AC6 – Hướng dẫn trả lời.** *(sửa 01/11 sau QA lượt 2 theo ESC-044 – INV cho phép công cụ dịch, không giới hạn)* Given sổ tay Desk (`product/docs/manual/user-manual-v1.0.md` mục 2.18, `guides/02-le-tan.md`, `guides/05-sale-ctv.md`), Then có một mục ngắn cho lễ tân/sale gồm đủ:
  1. Nhận ra khách ko/zh/ru: cột và lọc "Ngôn ngữ" (AC3).
  2. Mặc định trả lời bằng **tiếng Anh**; báo giá, tin gửi tiếng Anh cho ko/zh, tiếng Nga cho ru (AC4).
  3. Được dùng công cụ dịch bên ngoài (Google Dịch…) để đọc và soạn trả lời (ESC-044), **trên mọi màn hình Desk, kể cả giấy tờ và thanh toán** (INV 01/11 câu 9 = B, chấp nhận SEC RR-T2/RR-T3); sổ tay chỉ *khuyên* dịch trên ngăn một yêu cầu cho gọn, không cấm. *(ORC sửa 01/11 theo quyết định INV.)*
  4. **3 câu mẫu tiếng Anh** (CPY viết – ngắn, lịch sự, điềm tĩnh, không emoji): đã nhận yêu cầu và hẹn gửi báo giá; gửi báo giá; mời khách viết thêm bằng tiếng Anh khi bản dịch chưa rõ.
  5. Câu hứa thời gian trả lời đúng giá trị BR-912 hiện hành.
  6. Mục 2.18 tả đúng trạng thái form lúc LP-v2 phát hành (bỏ câu "form đang tắt" nếu form đã bật).
  BA viết, CPY câu mẫu, SEC duyệt ý 3. Bản HTML của sổ tay (nếu đang phát cho nhân viên) dựng lại cùng lượt. Kiểm: QA đối chiếu đủ 6 ý trên `lp-v2` trước QC.

---

### US-176 – Phòng trống theo hạng trên website (tách từ US-131) – *Should, R4+* (mới; chưa làm)

> **Là khách tiềm năng**, tôi muốn biết hạng phòng mình chọn còn trống cho ngày đó hay không trước khi gửi yêu cầu, để không mất công chờ báo giá cho phòng đã kín.

Nguồn: phần "phòng trống" của US-131 cũ; ESC-020 L7-B; SEC ARC-18 (lịch còn/hết theo hạng cho đối thủ thấy mức lấp đầy); US-147 AC6 (không "chỉ còn x phòng"). **Cần INV quyết riêng** trước khi làm – PO trình khi INV muốn (không phải ESC ở gói này). AC giữ ở mức khung: còn/hết theo hạng, không số phòng còn lại, không giữ phòng; US-131 AC7 đổi theo khi làm.

---

## 4. Story liên quan được sửa trong backlog (không đổi MoSCoW)

| Story | Sửa | Lý do |
|---|---|---|
| US-156 (tiếng Nga v2) | Trạng thái **Gộp vào US-174**; AC1 giữ làm tham chiếu | FB-INV-008 làm `ru` cùng `ko`, `zh` |
| US-152 AC3 ("v1 không có `/ru/`") | Ghi chú: hết hiệu lực khi locale `ru` qua cổng US-174 | Đúng ý cũ (v1), không mâu thuẫn |
| US-155 AC9 (đường lên L7-B) | Ghi chú: LP-v2 làm **phần giá** theo US-131; phòng trống chưa làm (US-176) | FB-INV-009 |
| US-147 AC3 ("Từ {giá}/tháng" ở lối "Ở dài ngày") | Ghi chú: thay bởi decision-log 24/10 + US-131 AC5 – giá tháng chỉ hiện trong form | Tránh AC cũ mâu thuẫn với "thân trang không ghi giá" |
| Won't | Bỏ "tiếng Hàn/Trung" | INV đổi phạm vi qua FB-INV-008 |

## 5. Phụ thuộc và câu hỏi nội bộ (không cần INV)

| # | Hỏi / phụ thuộc | Vai | Ảnh hưởng AC |
|---|---|---|---|
| D1 | Căn đại diện của một hạng có hai mức giá (thấp nhất đang bán như BR-114 (1)? hay khác), phụ thu người có vào ước tính không, đêm lẻ BR-113 trên web khi chưa có phòng trống, 15–27 đêm hiện song song giá tháng ra sao | DOM (BR-WEB) | US-131 AC2, AC3 (W6–W8, W11, ca giá lẫn) |
| D2 | Mức ngang giá OTA: giá web sau giảm 7/14 đêm (BR-107) thấp hơn giá OTA cùng đêm – đề xuất DOM cho INV kiểm hợp đồng | DOM → INV (qua cổng US-131 AC12 (3)) | US-131 AC12 |
| D3 | Hợp đồng API giá công khai (đã có bản phác `getPublicOffers` – phải bỏ phần "căn còn trống" để đúng AC7); giới hạn tần suất; cách Desk xác nhận số khách đã thấy; thời gian cập nhật sau khi đổi giá (AC6) | ARC, SEC | US-131 AC6–AC10 |
| D4 | Giá trị ngôn ngữ mới trong form và hồ sơ khách (hiện `Locale` chỉ `vi, en, ru`) | ARC, BE | US-175 AC1, AC4 |
| D5 | Font Hàn/Trung/Nga gần nhận diện, chia nhỏ theo ký tự để giữ ngân sách | UXD | US-174 AC6, AC7 |
| D6 | Chữ khối giá EN/VI trước, rồi ko/zh/ru; bản dịch toàn landing | CPY | US-131 AC4, US-174 AC2, AC8 |
| D7 | Bản dịch thông báo xử lý dữ liệu ko/zh/ru (phiên bản mới), công cụ dịch lễ tân được dùng | SEC | US-174 AC9, US-175 AC6 |

## 6. Giả định và rủi ro

**Giả định** (ngoài G1–G5 của ORC – đều trong quyền PO, đổi được không cần INV):
- P1: Ước tính chỉ hiện khi khách chọn **một hạng cụ thể**; "Any room – suggest one" không có số (US-131 AC1).
- P2: Ngưỡng 1,5 giây hiện giá, 10 phút cập nhật sau khi đổi giá (US-131 AC1, AC6).
- P3: Ca đến cuối tuần 1 đêm: không có số nhưng vẫn gửi được (US-131 W11) – DOM có quyền đổi.
- P4: `hreflang` `zh-Hans`; không gợi ý bản giản thể cho trình duyệt phồn thể (US-174 AC3, AC5).
- P5: Thứ tự ko → zh → ru chỉ dùng khi một ngôn ngữ chậm ở cổng; ngôn ngữ phát hành riêng lẻ (mục 2).
- P6: Khách `ko`/`zh` nhận tin, bill, trang khách bằng tiếng Anh (US-175 AC4) – hệ quả trực tiếp của G4.

**Rủi ro:**
- R1 – **"Chỉ từ" và "thân trang không có giá"**: FB-INV-004 (26/10) đồng ý "chỉ từ 667.000 đ" trên landing, nhánh vẫn giữ chờ INV kiểm giá OTA; G1 + decision-log 24/10 nói thân trang không ghi giá. AC5 của US-131 để "chỉ từ" là ngoại lệ do INV quyết riêng, LP-v2 không thêm số. ORC nên nhắc INV khi báo G1 (một câu, không cần ESC riêng).
- R2 – Ngang giá OTA: giá web 7+ đêm thấp hơn OTA có thể vi phạm hợp đồng kênh → cổng US-131 AC12 (3) phụ thuộc INV kiểm hợp đồng.
- R3 – Font CJK nặng làm vượt ngân sách tải trang → AC7 cấm nới lặng lẽ; UXD/ARC phải đo trước.
- R4 – Lễ tân dán lời nhắn (có thể chứa dữ liệu cá nhân) vào công cụ dịch bên ngoài → US-175 AC6 + SEC.
- R5 – Cổng người bản xứ + luật sư phụ thuộc INV về thời gian → phát hành theo phần (mục 2) để không giữ phần giá.
- R6 – Khách nhầm ước tính là giá chốt → AC4 bắt buộc 4 ý đi liền con số; Desk hiện chênh lệch khi giá đổi (AC10).

## 7. Đề xuất dòng decision-log (ORC ghi khi commit – PO không ghi file chung đang có nhiều vai sửa)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-01 | 4 | **PO – LP-v2 backlog**: US-131 nâng Should R3 → **Must R4 – LP-v2**, chỉ phần giá ước tính trong form; phần phòng trống tách thành **US-176** (Should R4+, cần INV quyết riêng); thêm **US-174** (landing `ko`/`zh`/`ru`, gộp US-156) và **US-175** (form nhận ngôn ngữ mới, Desk hiện ngôn ngữ khách); thứ tự US-175 → US-131 → US-174 (ko → zh → ru khi một ngôn ngữ chậm cổng); phát hành theo phần: (a) giá EN/VI, (b) từng ngôn ngữ khi qua cổng người bản xứ + luật sư; bỏ "tiếng Hàn/Trung" khỏi Won't. Tổng 176 story | PO | FB-INV-008, FB-INV-009, G1–G5; `rounds/round-04/outputs/PO/lp-v2-stories.md` |

## 8. Tự kiểm (checklist PO)

- [x] Mỗi AC kiểm chứng được: có số kỳ vọng (US-131 AC3), ngưỡng đo (AC1, AC6, US-174 AC7), cách kiểm (quét `dist`, Playwright, so với Desk).
- [x] Không mâu thuẫn BR: số kỳ vọng lấy từ ví dụ đã kiểm của BR-104, BR-107, BR-108, BR-110; chỗ chưa có BR ghi rõ chờ DOM (BR-WEB).
- [x] Không vượt phạm vi gói: Desk/app/mẫu tin/phồn thể/phòng trống ghi ở "Không có trong gói".
- [x] Không chỉ định giải pháp kỹ thuật: cách lưu ngôn ngữ, cơ chế xác nhận giá, cách cập nhật giá để ARC chọn; AC chỉ nêu kết quả đo được.
- [x] Không tự đặt chính sách: giá, ngang giá OTA, nội dung chính sách theo BR hiện hành và cổng INV (US-131 AC12, US-174 AC10).

## 9. Phân loại sau QA lượt 2 (PO – Round 4, bước Kiểm thử, 01/11/2026 tối)

Nguồn: `rounds/round-04/qa/lp-v2-test-report.md` mục 11 (`lp-v2` @ `20afedff`), `rounds/round-04/qa/bug-list.md`; decision-log 01/11 (INV "Lên cùng một lần"; UXD mốc AC4 = nhãn ô 15 px); ESC-044 (INV cho phép công cụ dịch, không giới hạn); SEC `lp-v2-privacy-and-api.md` L2.5 (RR-T2, RR-T3).

**Cách PO xếp.** INV phát hành LP-v2 **một lần**, còn chờ người bản xứ + luật sư, nên thời gian không phải ràng buộc chính. PO chọn: (1) mọi AC **Must** của gói phải đạt trước phát hành – AC nào không thật sự cần thì **sửa AC** cho đúng nhu cầu chứ không dời im lặng; (2) ưu tiên việc giúp **lễ tân xử lý khách ko/zh/ru từ ngày đầu**; (3) việc lớn không cần cho ngày đầu (báo cáo/xuất, giá trị ngôn ngữ mới trong hồ sơ khách) thì dời có đích. Mức lỗi P2/P3 giữ như QA chấm; PO chỉ quyết đích phát hành.

### 9.1 Bắt buộc trước phát hành LP-v2

| # | Lỗi | Việc phải xong | Vai | AC | Mức |
|---|---|---|---|---|---|
| B1 | **BUG-R4-001** | So hạng của căn với hạng khách đã thấy theo cùng một dạng (nhãn ↔ slug) để "Khớp…" / "Đã đổi: {cũ} → {mới}" hiện đúng trên dữ liệu nhãn như production; thêm test chống tái phát với hạng dạng nhãn (ba ca: đổi giá → "Đã đổi", cùng giá → "Khớp", khác hạng → "không so sánh") | FE-A (ARC chỉ khi chọn để server trả slug) | US-131 AC10 – không đổi | P2 – đang sửa |
| B2 | **BUG-R4-006** | Nhãn "Estimated rate / Giá ước tính / …" ≥ 15 px ở 5 ngôn ngữ; UXD chọn giữ hay bỏ chữ hoa/giãn để nhãn Nga không tràn ở 360 px; FE-B sửa CSS | UXD → FE-B | US-131 AC4 – **làm rõ** (mục 9.3) | P3 |
| B3 | **BUG-R4-007** (phần danh sách) | S35: cột "Ngôn ngữ" (nhãn VI, bản EN cho Desk tiếng Anh), lọc theo ngôn ngữ kết hợp lọc trạng thái, hiện **tổng số yêu cầu khớp lọc** | FE-A + UXD (bố cục cột ở 1366 px); ARC nếu cần thêm lọc/đếm ở API | US-175 AC3, AC5 – **sửa** | P3 |
| B4 | **BUG-R4-008** (câu Desk) | Câu "Khách viết bằng tiếng Hàn/Trung – tin gửi bằng tiếng Anh" cạnh ô "Ngôn ngữ gửi khách" ở **hộp báo giá và hộp giữ chỗ** (VI + EN của Desk) | CPY/UXD (chữ) → FE-A/FE-B | US-175 AC4 ý 2 | P3 |
| B5 | **BUG-R4-008** (hồ sơ) + **BUG-R3-050** | Hồ sơ khách tạo nhanh từ yêu cầu lưu ngôn ngữ gửi tin (`en` cho ko/zh, `ru` cho ru, như EN/VI cho en/vi); mở lại báo giá không quay về tiếng Việt. Đích chính **v1.0.1** (BUG-R3-050 đã xếp); v1.0.1 không kịp thì làm trong LP-v2 – LP-v2 **không** phát hành khi chưa có | FE-B (+ ARC xác nhận cách lưu) | US-175 AC4 ý 3 | P3 |
| B6 | **BUG-R4-009** | Câu báo giá gửi khách đúng số ít/nhiều: EN "1 night / 2 nights", "2 adults" (chữ thường); kiểm luôn bản Nga (1 ночь / 2 ночи / 5 ночей) và VI. Có từ v1.0 nên **đề nghị ORC đưa vào v1.0.1** nếu xếp được | CPY (câu) + BE/FE (nơi dựng câu) | Không có AC riêng – chữ hướng khách, giọng Brand; mọi khách ko/zh nhận câu này | P3 |
| B7 | **BUG-R4-010** | Mục hướng dẫn trả lời khách ko/zh/ru trong sổ tay theo AC6 mới (6 ý), 3 câu mẫu EN; dựng lại bản HTML của sổ tay nếu đang phát cho nhân viên | BA (viết) + CPY (câu mẫu) + SEC (duyệt ý dịch) | US-175 AC6 – **sửa** theo ESC-044 | P3 |

Sau B1–B7: QA kiểm lượt 3 (các AC đã sửa + hồi quy 13 ca giá), rồi QC LP-v2. B5 và B6 nếu đi v1.0.1 thì QA lượt 3 chỉ kiểm hồi quy trên ko/zh/ru.

Thứ tự đề nghị trong lượt sửa (cùng FE nên có thể gộp một nhánh): B1 → B5 → B4 → B3 → B2; song song CPY (B4, B6, câu mẫu B7) và BA (B7).

### 9.2 Dời (có đích)

| Việc | Đích | Lý do |
|---|---|---|
| Báo cáo / xuất dữ liệu yêu cầu website theo ngôn ngữ (BUG-R4-007 phần "báo cáo/xuất") | **v1.2**, cùng US-104 (xuất báo cáo và dữ liệu theo kỳ) – DATA, BE | INV cần **đếm** khách theo ngôn ngữ; lọc + tổng số trên S35 đáp ứng ở gói này. Làm báo cáo riêng cho một bảng là làm hai lần khi US-104 tới |
| Lưu giá trị `ko`/`zh` riêng trong hồ sơ khách | Chưa xếp – khi INV mở mẫu tin ko/zh cho Desk (hiện ngoài phạm vi, G4) – ARC, BE | Hồ sơ chỉ cần ngôn ngữ **gửi tin**; ngôn ngữ gốc tra được từ yêu cầu liên kết (AC4 ý 4). Đổi ràng buộc dữ liệu hồ sơ khách lúc này không thêm gì cho lễ tân |
| `translate="no"` cho vùng giấy tờ / thanh toán trên Desk | v1.1 – FE-A (đề xuất của SEC RR-T3) | Sổ tay (AC6 ý 3) giữ luật trước; không cản dịch lời nhắn |

### 9.3 AC đã sửa (cả ở đây và `03-backlog/backlog.md` mục 4)

| AC | Trước | Sau | Lý do |
|---|---|---|---|
| US-131 AC4 | "cùng cỡ chữ không nhỏ hơn chữ nội dung của form" | Cỡ chữ cả 4 ý, **kể cả nhãn ý (1)**, ≥ **nhãn ô form (15 px)**; thêm "cho {n} khách" + "phòng trống xác nhận trong báo giá" (BR-115 (5)); QA đo cỡ chữ ở 360/1280 px | Dùng mốc UXD đã chốt; không miễn cho nhãn vì "ước tính" là ý chống hiểu nhầm quan trọng nhất (R6). Ghi nhận BUG-R4-003 đã gộp BR-115 (5) |
| US-175 AC3 | "danh sách và chi tiết hiện nhãn ngôn ngữ" | Danh sách có **cột** "Ngôn ngữ" + **lọc theo ngôn ngữ**; kiểm 1366 px | Nói rõ phần danh sách; lọc là nền cho AC5 |
| US-175 AC4 | "hồ sơ/đơn ghi lại ngôn ngữ khách đã dùng"; câu Desk không nói ở đâu; gộp với "BUG-R3-055" | 4 ý: (1) thao tác thành công; (2) câu Desk ở hộp báo giá **và** giữ chỗ; (3) hồ sơ tạo nhanh lưu **ngôn ngữ gửi tin**, không quay về tiếng Việt; (4) ngôn ngữ gốc tra từ yêu cầu liên kết, không bắt buộc thêm `ko`/`zh` vào hồ sơ. Sửa cùng **BUG-R3-050** | Đúng nhu cầu thật (khách nhận đúng tiếng); sửa mã lỗi dẫn nhầm |
| US-175 AC5 | "báo cáo/xuất dữ liệu… cột ngôn ngữ có đủ 5 giá trị" | **Đếm bằng lọc S35**: lọc ngôn ngữ + trạng thái (gồm đã thành đơn/đã đóng) → Desk hiện tổng số khớp lọc, không phụ thuộc trang đã tải; báo cáo/xuất dời v1.2 | Desk chưa có báo cáo/xuất yêu cầu website nào – AC cũ giả định sai hiện trạng; INV chỉ cần đếm |
| US-175 AC6 | "bỏ tên, SĐT, email khi dán vào công cụ dịch (SEC xác nhận công cụ dịch được phép)" | 6 ý: nhận ra khách (cột/lọc), mặc định tiếng Anh, **được dùng công cụ dịch** (ESC-044) – dịch trên ngăn một yêu cầu, không dịch trang danh sách, không dịch màn giấy tờ/thanh toán (SEC RR-T2, RR-T3), 3 câu mẫu EN, câu hứa BR-912, mục 2.18 đúng trạng thái form | INV quyết ESC-044 "cho phép, không giới hạn" sau khi AC viết – AC cũ trái quyết định INV |
| US-175 Nguồn | "BUG-R3-055" | "BUG-R3-050" (+ ESC-044) | QA chỉ ra dẫn nhầm (BUG-R3-055 là chữ "xóa theo hạn lưu") |

Không thêm story, không đổi MoSCoW; tổng giữ **176**. Không ESC mới: đích phát hành và AC nằm trong quyền PO; chính sách dịch đã có quyết định INV (ESC-044). Một điểm ORC cần xác nhận với INV (đã có trong SEC RR-T3, không phải ESC mới): sổ tay ghi "không dịch màn giấy tờ/thanh toán" theo cách hiểu của SEC về ESC-044.

### 9.4 Giả định PO (đổi được không cần INV)

- P7: "Đếm được" = tổng số yêu cầu khớp lọc trên S35 trong phạm vi yêu cầu còn trên Desk; INV không cần số lũy kế dài hạn trước v1.2.
- P8: Hồ sơ khách **có sẵn** mà nhân viên đã đặt ngôn ngữ khác thì Desk không tự đổi khi báo giá từ yêu cầu (tránh ghi đè lựa chọn của nhân viên).
- P9: BUG-R4-009 bắt buộc dù không thuộc AC nào vì là chữ hướng khách mà mọi khách ko/zh nhận (Brand Guidelines: giọng văn với khách).

### 9.5 Đề xuất dòng decision-log (ORC ghi khi commit)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-01 | 4 | **PO – phân loại LP-v2 sau QA lượt 2**: bắt buộc trước phát hành (một lần) – BUG-R4-001 (P2, FE-A), BUG-R4-006 (UXD → FE-B), BUG-R4-007 phần cột + lọc + tổng số S35 (FE-A + UXD), BUG-R4-008 câu Desk (CPY/UXD → FE) + ngôn ngữ gửi tin vào hồ sơ cùng BUG-R3-050 (đích v1.0.1, không kịp thì trong LP-v2), BUG-R4-009 (CPY + BE/FE; đề nghị đi v1.0.1), BUG-R4-010 (BA + CPY + SEC). Dời: báo cáo/xuất theo ngôn ngữ → v1.2 cùng US-104; giá trị `ko`/`zh` trong hồ sơ khách → khi INV mở mẫu tin ko/zh. Sửa AC: US-131 AC4 (≥ nhãn ô 15 px gồm cả nhãn "ước tính", thêm BR-115 (5)), US-175 AC3 (cột + lọc), AC4 (ngôn ngữ gửi tin vào hồ sơ, ngôn ngữ gốc tra từ yêu cầu), AC5 (đếm bằng lọc S35, bỏ báo cáo/xuất), AC6 (theo ESC-044); sửa dẫn BUG-R3-055 → BUG-R3-050. Tổng 176 story | PO | Quyền PO (phạm vi trong gói, AC, đích phát hành); INV phát hành LP-v2 một lần và còn chờ người bản xứ + luật sư; ưu tiên lễ tân xử lý khách ko/zh/ru từ ngày đầu; `rounds/round-04/outputs/PO/lp-v2-stories.md` mục 9 |
