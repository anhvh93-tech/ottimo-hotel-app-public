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
- **AC4 – Chữ "ước tính" và điều kiện đi liền con số.** Given khối giá có con số, ở **mọi locale đã phát hành**, Then trong cùng khối, cùng cỡ chữ không nhỏ hơn chữ nội dung của form, luôn có đủ 4 ý (chữ cuối do CPY viết, EN dẫn): (1) nhãn **"ước tính"** (EN "Estimated" hoặc tương đương CPY chọn) ngay trên/cạnh con số; (2) "giá cuối cùng nằm trong báo giá OTTIMO gửi bạn"; (3) "đã gồm thuế" (giá niêm yết gồm VAT – BR-101 (2)); (4) "chưa giữ phòng". Theo tháng thêm: chưa gồm phí dịch vụ (BR-204), điện nước theo công tơ (BR-501), giảm theo kỳ hạn (BR-201) và khách nước ngoài +10 % (BR-109) – form không hỏi quốc tịch nên không tự cộng. Kiểm: QA đối chiếu 4 ý trên ảnh chụp của từng locale × ca W1, W4, M1; thiếu một ý ở một locale = không đạt. **Không** dùng "giá sốc", "rẻ nhất", đồng hồ đếm ngược, "chỉ còn x phòng" (BR-114 (4), US-147 AC6).
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

Nguồn: FB-INV-008 ("Desk hiện ngôn ngữ khách đã dùng"), G4; US-155 AC1, AC2, AC8; BUG-R3-055 (ngôn ngữ/liên hệ không sang hồ sơ khi báo giá – P3, đích v1.0.1).

- **AC1 – Nhận đủ.** Given khách gửi form hợp lệ từ `/ko/`, `/zh/` hoặc `/ru/`, Then yêu cầu vào hàng chờ "Yêu cầu từ website" như yêu cầu EN/VI (cùng trạng thái, nguồn `website` + nguồn phụ, thông báo cho nhân viên – US-155 AC6, AC8); **0** yêu cầu bị từ chối chỉ vì ngôn ngữ (kiểm: mỗi locale một ca đầu-cuối + test API với mỗi giá trị ngôn ngữ).
- **AC2 – Chữ không Latinh giữ nguyên.** Given tên và lời nhắn viết bằng chữ Hàn, chữ Hán, chữ Kirin (kể cả trộn với tiếng Anh, emoji khách tự gõ), Then Desk hiện đúng từng ký tự (không lỗi mã hóa, không cắt giữa ký tự), giới hạn độ dài tính theo ký tự như hiện hành; kiểm tra "lời nhắn có số giấy tờ/số thẻ" (US-155 AC5) vẫn chạy.
- **AC3 – Desk hiện ngôn ngữ khách.** Given một yêu cầu, Then danh sách và chi tiết yêu cầu hiện nhãn ngôn ngữ bằng tiếng Việt cho nhân viên (Tiếng Anh · Tiếng Việt · **Tiếng Hàn** · **Tiếng Trung (giản thể)** · **Tiếng Nga**); thông báo trong app vẫn **không** chứa tên, SĐT, email (US-155 AC8). Giao diện Desk **không** dịch sang ko/zh/ru (G4).
- **AC4 – Chuyển thành báo giá không lỗi, không mất ngôn ngữ.** Given yêu cầu `ko`/`zh`, When nhân viên "Chuyển thành báo giá" hoặc "Giữ chỗ" (US-155 AC2), Then thao tác thành công (không lỗi do hồ sơ khách chỉ nhận vi/en/ru); hồ sơ/đơn ghi lại ngôn ngữ khách đã dùng; mẫu tin, bill, trang khách dùng **tiếng Anh** cho `ko`/`zh` (vì G4 chưa làm mẫu tin các ngôn ngữ này) và Desk ghi rõ "Khách dùng tiếng Hàn – tin gửi bằng tiếng Anh"; yêu cầu `ru` dùng tiếng Nga ở nơi Desk đã có bản tiếng Nga. Cách lưu do ARC chọn. Phần "ngôn ngữ sang hồ sơ" gộp sửa cùng BUG-R3-055.
- **AC5 – Đếm được.** Given báo cáo/xuất dữ liệu yêu cầu website hiện có, Then cột ngôn ngữ có đủ 5 giá trị để INV đếm khách theo ngôn ngữ (không thêm báo cáo mới ở gói này).
- **AC6 – Hướng dẫn trả lời.** Given sổ tay Desk (`product/docs/manual/`), Then có 3–5 dòng cho lễ tân/sale: trả lời khách ko/zh/ru bằng tiếng Anh hoặc công cụ dịch; khi dán lời nhắn vào công cụ dịch thì bỏ tên, SĐT, email (SEC xác nhận công cụ dịch được phép); cùng câu hứa thời gian trả lời BR-912. (BA viết, SEC duyệt câu về dữ liệu.)

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
