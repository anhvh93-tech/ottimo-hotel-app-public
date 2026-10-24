# SOW – Vai CPY (Copywriter hospitality) cho OTTIMO

- Người viết: CPY | Round 3 – bước Sản xuất | Ngày: 24/10/2026
- Căn cứ: INV 24/10 (dòng cuối `01-decisions/decision-log.md`), `.claude/skills/hotel-copywriter/SKILL.md`, `00-brief/context/brand/brand-guidelines.md`, FB-INV-002, FB-INV-003.
- Đi kèm: `landing-copy-review.md` (rà câu chữ ottimo.vn), `concept.md` (concept bán hàng + phễu).

## 1. Vì sao có vai này
INV 24/10: câu chữ landing "lủng củng", có từ làm **loãng định vị** (ví dụ "small hotel"), chỗ thì **quá thẳng** như "phụ thu". Landing phải **gợi cảm, sang, gợi tò mò** và **đưa khách vào phễu** (để lại yêu cầu / nhắn Zalo) để sale chăm và tư vấn sâu về giá. Câu chữ hiện do UXD (kiêm UX writer) và DOM viết với mục tiêu đúng – đủ – an toàn; CPY thêm lớp **bán hàng**: chọn chữ để khách *muốn đến*, nhưng vẫn trong giọng thương hiệu (Calm · Warm · Refined – sang mà không ồn).

## 2. Phạm vi – CPY làm

| # | Kênh | Việc cụ thể | Ghi chú |
|---|---|---|---|
| 1 | **Landing ottimo.vn (EN dẫn, VI hỗ trợ)** | Mọi chữ khách đọc ở thân trang: meta title/description, hero, tiêu đề – nhãn – đoạn dẫn từng mục, thẻ hạng phòng, tiện nghi, vị trí, khối đặt phòng, FAQ, liên hệ, trang 404; nhãn nút kêu gọi (CTA) | Alt ảnh, nhãn trợ năng (carousel, gallery): CPY chỉ soát giọng; UXD giữ quyền về a11y |
| 2 | **Phần "để lại yêu cầu"** (form US-155, trang cảm ơn, khối Zalo khi form tắt) | Giọng văn nhãn, gợi ý, lời cảm ơn; câu nói về khách thêm, cọc, quy trình – viết mềm, rõ | Câu pháp lý (đồng ý xử lý dữ liệu, hạn xóa 180 ngày, chống giả danh) **giữ nguyên ý SEC đã duyệt**, chỉ chỉnh giọng khi SEC đồng ý |
| 3 | **Fanpage Facebook** | Phần giới thiệu (intro), bài ghim, nhãn nút "Book now" trỏ về landing, 6–8 mẫu bài nền (phòng, Đà Lạt, kỳ ở dài, khách thật khi có đồng ý) | Không đăng bài; INV/đội marketing đăng |
| 4 | **E-brochure** | Bản sửa câu chữ cho lần xuất PDF/in kế tiếp theo định vị mới (bỏ "căn hộ", "Move in, not check in", "resort 5 sao"…) | UXD dàn trang; danh sách câu cần sửa ở `landing-copy-review.md` mục 12 |
| 5 | **Mẫu tin chào khách** (Zalo OA, email, WhatsApp) | Lời chào khi khách nhắn lần đầu, trả lời tự động ngoài giờ, tin nhận yêu cầu, phần mở – kết của tin báo giá, tin trước ngày đến, tin chào khi nhận phòng, tin cảm ơn sau khi trả phòng | INT cài; DOM soát số liệu; tin có tiền/cọc thì SEC soát câu chống giả danh |
| 6 | **Bộ từ và câu chuẩn** | Bảng từ dùng – từ tránh (bản bán hàng), câu định vị, các câu "chữ ký" dùng lại giữa kênh | Đặt tại `rounds/round-<n>/outputs/CPY/`; khi ổn định chuyển sang `product/design/` cùng UXD |

## 3. Ngoài phạm vi – CPY không làm
- **Không sửa mã**, không sửa test, không commit, không đăng gì lên mạng. FE-LP áp chữ sau khi duyệt.
- Không quyết **bố cục, ảnh, màu** (UXD; ảnh do INV chọn – FB-INV-003). CPY chỉ gợi ý ảnh đi cùng câu.
- Không quyết **giá, cọc, phụ thu, điều khoản hủy, điều khoản tháng** (DOM/INV). CPY chỉ viết *cách nói*.
- Không viết **văn bản pháp lý** (thông báo xử lý dữ liệu, điều khoản – SEC/luật sư).
- Không trả lời khách thật, không chạy quảng cáo, không làm SEO kỹ thuật (thẻ, schema – FE-LP/DATA). CPY viết meta và từ khóa trong câu.
- Không hứa thứ sản phẩm chưa có: bữa sáng, quầy cà phê, đưa đón sân bay, đỗ xe, thú cưng, hạng sao (DOM landing-positioning mục "Không viết").
- Ngôn ngữ thứ ba (Nga, Hàn…): ngoài phạm vi lần này; đề xuất sau v1.0.

## 4. Đầu ra mỗi lần giao việc
1. **Bảng rà** câu cũ → vấn đề → câu mới EN + VI, kèm khóa (`hero.lead`…) để FE-LP áp đúng chỗ.
2. **Concept / định hướng** (khi đổi lớn): một ý xuyên suốt, thứ tự mục, CTA.
3. **Ghi chú ảnh hưởng**: test nào phải đổi, khung nào UXD cần kiểm độ dài, câu nào cần DOM/SEC xác nhận.
4. **Câu hỏi cho INV** kèm phương án đề xuất (qua ORC).

## 5. Quy trình duyệt

| Bước | Ai | Làm gì | Ra |
|---|---|---|---|
| 1 | **CPY** | Viết / rà, tự kiểm theo mục 6 | Bảng câu mới trong `rounds/round-<n>/outputs/CPY/` |
| 2 | **UXD** | Kiểm khung (độ dài, xuống dòng điện thoại 360 px, thứ bậc tiêu đề), brand (giọng, không IN HOA, không emoji) | Đồng ý / góp ý theo dòng |
| 2b | **DOM** (khi câu đụng sự thật vận hành, giá, dọn phòng, giờ) · **SEC** (khi đụng dữ liệu khách, cọc, chống giả danh) | Xác nhận đúng sự thật, đúng cam kết đã duyệt | Đồng ý / sửa |
| 3 | **PO** | Phạm vi, khớp AC (US-146, US-152, US-155), quyết những gì không cần INV | Bản đề xuất trình INV |
| 4 | **INV** (qua ORC) | Duyệt câu chữ cuối (US-146 AC4) và các câu hỏi CPY nêu | Duyệt / sửa |
| 5 | **FE-LP** | Áp vào `en.ts`, `vi.ts` (và `booking-strings.ts` nếu có), cập nhật test theo ghi chú ảnh hưởng | Commit `round-<n>: …`, phát hành bằng tag `landing-v*` |
| 6 | **QA** + **CPY** | QA chạy test chữ, dist-checks; CPY đọc lại bản đã lên (EN + VI, điện thoại + máy tính) | Biên bản xem lại, lỗi chữ ghi P2/P3 |

- Sửa nhỏ (một chữ, lỗi chính tả, không đổi ý): CPY → UXD → FE-LP, PO ghi nhận; không cần chờ INV.
- Mâu thuẫn brand guideline ↔ yêu cầu "hào nhoáng": **guideline thắng**; "hào nhoáng" hiểu là gợi cảm, giàu hình ảnh, có tầng cảm xúc – không phải ồn, không phải từ to ("đẳng cấp", "sang trọng bậc nhất", "5 sao").

## 6. Tiêu chí "đạt"

Một bản câu chữ CPY được coi là **đạt** khi qua đủ:

**Định vị và nội dung**
1. Đúng sự thật trong `investor-brief.md`, `ebrochure-text.md`, `business-rules.md`; không hứa thứ chưa có (mục 3).
2. Gọi đúng loại hình **boutique stay**; **không** dùng: small hotel / khách sạn nhỏ, hotel tự nhận, apartment / căn hộ / căn / căn hộ dịch vụ, homestay, nhà nghỉ, giá rẻ, lease / thuê tháng, 5 sao, luxury / sang trọng.
3. **Không nhắc số phòng/căn** (FB-INV-002), không lộ tên nội bộ (Lầu 1–2, Căn N, 101…402).
4. **Thân trang không có** giá cụ thể, phụ thu, phí phát sinh, điện nước theo công tơ, điều khoản. Những chi tiết đó nằm ở phần để lại yêu cầu, báo giá và sale (xem `concept.md` mục 5).
5. Mỗi mục **một ý chủ đạo**, kết thúc bằng một đường dẫn về hành động (để lại yêu cầu hoặc nhắn Zalo) – trực tiếp hoặc qua nút dính.

**Giọng văn**
6. EN đọc như bản gốc của thương hiệu quốc tế; VI viết lại tự nhiên, không dịch từng chữ, không lặp "OTTIMO" làm chủ ngữ liên tục.
7. Không emoji, không dấu chấm than, không IN HOA để nhấn, không từ sáo ("tuyệt vời", "đẳng cấp", "hoàn hảo", "trải nghiệm khó quên").
8. Câu ngắn; câu dài nhất của một đoạn ≤ 25 từ EN.

**Kỹ thuật**
9. Qua `copy.test.ts` và `dist-checks` (danh sách cấm, đếm "hotel" ≤ 3, số liệu = `site.json`), hoặc ghi rõ test nào cần đổi và vì sao (PO duyệt).
10. Meta title ≤ 60, description ≤ 160 ký tự; độ dài câu trong ±15% khung UXD, quá thì UXD đồng ý bằng văn bản.

**Hiệu quả (đo sau khi lên)** – DATA theo dõi, không chặn duyệt:
11. Tỉ lệ khách bấm "để lại yêu cầu" hoặc "Zalo" trên số lượt xem trang; tỉ lệ yêu cầu → báo giá → cọc (Desk, nguồn `website`). CPY xem lại câu chữ sau 4 tuần có số liệu.

## 7. Nhịp làm việc
- Mỗi round: một lượt rà + viết cho kênh được giao trong `plan.md`; trả kết quả trong bước Sản xuất, sửa trong bước Phản hồi & sửa.
- Thứ tự đề xuất: (1) landing – round này; (2) phần để lại yêu cầu + trang cảm ơn + mẫu tin Zalo chào/nhận yêu cầu – khi US-155 bật; (3) fanpage; (4) e-brochure; (5) mẫu tin trước ngày đến / nhận phòng / sau trả phòng – cùng INT khi làm mẫu tin đa ngôn ngữ.

## 8. Phối hợp
| Vai | CPY cần gì | CPY đưa gì |
|---|---|---|
| UXD | Khung, độ dài, ảnh đi cùng | Câu chữ đúng khóa, gợi ý ảnh |
| PO | Phạm vi, AC, ưu tiên | Bản trình INV, ghi chú ảnh hưởng test |
| DOM | Sự thật vận hành, cái gì được hứa | Câu cần xác nhận |
| SEC | Câu dữ liệu khách, cọc, chống giả danh | Bản chỉnh giọng để SEC duyệt |
| FE-LP | Áp chữ, đổi test | Bảng khóa → câu |
| INT | Kênh gửi tin, giới hạn ký tự Zalo OA | Mẫu tin |
| DATA | Số đo phễu | Giả thuyết câu chữ để thử |
