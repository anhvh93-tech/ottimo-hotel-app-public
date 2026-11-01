# UXD review FE-B – gói LP-v2 (landing ko/zh/ru, nút ngôn ngữ, giá ước tính)

- Round 4 · Bước: Review chéo · Người review: UXD · Tác giả: FE (FE-B) · Ngày: 01/11/2026
- Đối chiếu: `rounds/round-04/outputs/UXD/lp-v2-design.md` (thiết kế UXD), ESC-043 (INV 01/11: tháng không có số), decision-log 01/11 (mốc 30 đêm), brand guideline (`00-brief/context/brand/brand-guidelines.md`).
- Bản được review: nhánh `origin/lp-v2-fe` @ `5db7df80` (so với `origin/lp-v2`), báo cáo `rounds/round-04/outputs/FE/lp-v2-fe.md`, 20 ảnh chụp FE (390/1280 × 5 ngôn ngữ).
- Cách kiểm thêm: UXD dựng `build:booking-live-test` trong worktree tạm (scratchpad, không sửa repo), chạy server `tests/e2e/landing/serve.mjs`, giả API giá bằng `page.route` (số giả 733.667 đ/đêm như FE, không dữ liệu khách), chụp ô giá đủ 8 trạng thái ở 360 px × 5 ngôn ngữ, đầu trang ở 768/960–1280 px, thanh đáy ở 320/360/375/390 px; đọc kiểu chữ, khoảng cách chữ, màu bằng `getComputedStyle`.

## Kết luận

**CHẤP NHẬN CÓ ĐIỀU KIỆN.** 0 Blocker · 4 Major · 6 Minor · 2 Suggestion.

Nhận diện giữ tốt: màu chỉ trong bảng 80/15/5 (diff không có mã màu thô; màu đo được trên ô giá là Ivory, Earth Brown, Ink, Stone, Cream). Ngăn xếp font, khoảng cách chữ và chữ hoa của nhãn đúng mục 1.4–1.5. Nút ngôn ngữ đúng mục 2.2. Ô giá chạy đủ trạng thái. Trạng thái tháng không có số và ẩn nhãn "Estimated rate" (ESC-043). Cách viết tiền "2,363,000 VND" được chấp nhận.

Phải sửa trong round, trước khi QA chạy hồi quy LP-v2:
1. Khách chọn "By the month" ngay từ đầu thì không bao giờ thấy lời mời ưu đãi tháng (FB-01).
2. Trang Nga bị tràn chữ ở thanh đáy điện thoại 320–375 px (FB-02).
3. Đầu trang tiếng Nga bị tràn ở 1024–1159 px (FB-03).
4. Dòng số tiền ở trạng thái S3 bị ngắt giữa "3 / nights" trên điện thoại (FB-04).

## Quyết định về các điểm lệch FE (báo cáo FE mục 4)

| # | Điểm lệch | UXD | Ghi chú |
|---|---|---|---|
| D1 | Tên 한국어 / 简体中文 / Русский dùng font hệ thống, không có bộ "UI" nhỏ | **Chấp nhận** | Đây là phương án dự phòng đã ghi trong thiết kế 1.3.7. Tốn 0 byte. Ảnh 390/1280 cho thấy tên vẫn gọn, cùng cỡ và độ đậm với các dòng Latin. UXD sẽ ghi vào design system. |
| D2 | Tiền viết "2,363,000 VND" (nhóm số theo ngôn ngữ, "VND" đứng sau, không dùng ₫) | **Chấp nhận** | Thay mục 3.5 của UXD. Đo được: en/ko/zh "2,201,001 VND", vi "2.201.001 VND", ru "2 201 001 VND" (khoảng trắng không ngắt). Dòng cảm ơn "Estimated rate: … VND for 3 nights" khớp. UXD sửa thiết kế 3.5 và design system ở bước Phản hồi. Xem thêm Suggestion FB-11. |
| D3 | Không hiện giá trung bình mỗi đêm, không bảng từng đêm | **Chấp nhận** | Theo lệnh của BE/DOM/SEC. Ô giá gọn hơn, không mất thông tin bắt buộc. |
| D4 | Theo tháng / ở dài: lời mời không có số | **Chấp nhận** | Đúng ESC-043. Nhãn "Estimated rate" đã ẩn, thay bằng tiêu đề lời mời. Không có chữ số. Dòng "This estimate is sent…" cũng ẩn. Đã kiểm cả 5 ngôn ngữ. Còn lỗ hổng khi khách chọn tháng trước: xem FB-01. |
| D5 | S7 không có nút "Try again", chờ 3 giây | **Chấp nhận** | Khách đổi bất kỳ ô nào là hệ thống tính lại. Câu S7 trung tính, chữ Ink, không dùng màu lỗi. Đúng tinh thần thiết kế. |
| D6 | Ô giá ẩn cho tới lần đầu API trả 200 | **Chấp nhận có điều kiện** | Hợp lý khi `public_show_prices` đang tắt. Điều kiện: sửa hệ quả ở FB-01. |
| D7 | Không đọc "Estimate cleared." | **Chấp nhận tạm** | Chờ CPY viết chuỗi. Riêng việc vùng status còn giữ giá cũ thì phải sửa: xem FB-09. |
| D8 | Ô tối thiểu số đêm tạm dùng câu S6 | **Chấp nhận tạm** | Chờ CPY viết `estimate.minStay`. |
| D9 | `party_exceeds_room` dùng câu sức chứa `e.cap` | **Chấp nhận** | |
| D10 | Chưa có Lighthouse CI | Không thuộc UXD | OPS/ARC. Ngân sách byte đo bằng Playwright đã đạt. |
| D11 | Tagline nghiêng giữ tiếng Anh | **Chấp nhận** | Đúng giả định UXD U3. |
| D12 | Có cả meta lẫn `data-notice-version` | Không thuộc UXD | ARC/OPS chọn. |

## Thẻ feedback

### FB-R4-UXD-FE-01
- Mức độ: Major
- Vị trí: `product/apps/landing-web/src/scripts/price-estimate.ts` → `run()`, nhánh `q === 'monthly'` khi `pricesOn = false`; form "Plan your stay", tab "By the month".
- Vấn đề: Khi khách chọn tab "By the month" (hoặc "월 단위", "按月", "Месяц и дольше"), trang không gọi API. Nếu trước đó chưa có lần 200 nào thì ô giá giữ trạng thái ẩn. Kết quả: khách vào thẳng tab tháng, chọn ngày đến và hạng phòng, **không bao giờ thấy lời mời ưu đãi tháng**. UXD kiểm cả 5 ngôn ngữ, đợi 1,2 giây: `#bk-est` vẫn ẩn. Lời mời chỉ hiện nếu khách đã xem một giá theo đêm rồi mới chuyển sang tab tháng. Test TC-LP-054 không bắt được vì test chọn theo đêm trước.
- Vì sao quan trọng: ESC-043 câu 2, INV quyết ngày 01/11: "khi khách chọn theo tháng, form chỉ hiện lời mời ưu đãi". Khách thuê dài hạn (mô hình kinh doanh chính của OTTIMO) thường vào thẳng tab tháng, nên đây là đường đi chính của họ. Hiện tại họ không thấy lời mời.
- Đề xuất sửa: Khi `stayType = long` và chưa biết giá đang bật hay tắt (`!pricesOn`), gọi API một lần với `stayType=long` và các tham số như hiện nay (hạng, ngày đến, số khách; không có dữ liệu cá nhân). API trả 200 `monthly_offer` thì `reveal()` rồi `showOffer()`. API trả 404 thì tắt ô như D6. Khi `pricesOn` đã đúng, giữ cách hiện lời mời ngay, không gọi API. Thêm vào TC-LP-054 một ca "chọn tháng trước, chưa có giá nào → lời mời hiện". Nếu ARC/SEC không muốn gọi API ở tab tháng, phương án B là có cờ lúc build hoặc lúc tải trang cho biết giá đang bật, rồi hiện lời mời mà không gọi.
- Trạng thái: Open

### FB-R4-UXD-FE-02
- Mức độ: Major
- Vị trí: `StickyBar.astro` + `landing.css` (thanh đáy điện thoại), trang `/ru/`; chữ `ru.ts` `actions.requestToBook`, `actions.chatOnZalo`.
- Vấn đề: Đo `scrollWidth − clientWidth` của nút trên thanh đáy (cuộn 1500 px):
  - 320 px: "Запланировать поездку" tràn **6 px**, chữ "З" và "у" ra ngoài viền nút (ảnh UXD `ru-320-sticky`).
  - 360 px: "Написать в Zalo" tràn **5 px**, biểu tượng chat đè lên viền trái, chữ chạm viền phải.
  - 375 px: "Написать в Zalo" tràn **2 px**.
  - 390 px: vừa. Vì vậy ảnh 390 của FE không thấy lỗi.
  - en/ko/zh không tràn. vi 360 tràn 1 px ("Nhắn qua Zalo"), mắt thường gần như không thấy, nhưng nên xử lý cùng lúc.
  Thiết kế 1.5 yêu cầu nút thanh đáy ở 320 px không vỡ. Nếu tràn thì CPY đưa bản ngắn, không thu nhỏ cỡ chữ.
- Vì sao quan trọng: Thanh đáy là lối đặt phòng chính trên điện thoại. Chữ tràn khỏi nút bấm là lỗi nhìn thấy ngay, trái với "Warm · Refined". 360 px là cỡ điện thoại Android phổ biến của khách Nga.
- Đề xuất sửa:
  - (1) CPY viết bản ngắn tiếng Nga cho thanh đáy, ví dụ nút Zalo chỉ ghi "Zalo" như ở 320 px (có thể áp ngay từ ≤ 389 px cho trang ru), nút chính ≤ 14 ký tự. CPY chọn chữ.
  - (2) FE cho chữ nút thanh đáy được xuống tối đa 2 dòng (`white-space: normal`, `text-wrap: balance`), giữ cao ≥ 48 px, làm lưới an toàn cho mọi ngôn ngữ.
  - (3) QA thêm vào `layout.landing.spec.ts` kiểm "không nút nào có `scrollWidth > clientWidth`" ở 320/360/375 × 5 ngôn ngữ.
- Trạng thái: Open

### FB-R4-UXD-FE-03
- Mức độ: Major
- Vị trí: `Header.astro` + `landing.css` (đầu trang máy tính), trang `/ru/`, rộng 1024–1159 px.
- Vấn đề: Từ 1024 px trở lên menu 4 mục hiện ra. Ở bản tiếng Nga:
  - 1024–1159 px: nút "Запланировать поездку" **xuống 2 dòng**.
  - Riêng 1024 px: đầu trang **tràn 8 px** (`scrollWidth` 1032 > 1024), nút bị cắt ở mép phải.
  - Wordmark "OTTIMO" dính sát mục "Номера", không còn khoảng thở (ảnh UXD `ru-1024-header`, `ru-1120-hdr`).
  - Từ 1160 px trở lên thì vừa. en/vi/ko/zh vừa ở mọi cỡ từ 1024 px.
  Thiết kế 1.5 yêu cầu đầu trang 1024 px tiếng Nga vừa một dòng.
- Vì sao quan trọng: 1024–1159 px là cỡ của iPad ngang và laptop nhỏ. Đầu trang dính luôn hiện, nên lỗi này nằm trên mọi màn hình khách xem. Logo dính chữ menu vi phạm vùng an toàn của logo trong guideline.
- Đề xuất sửa (chọn một, không thu nhỏ cỡ chữ):
  - (a) Dùng bản ngắn CPY cho nút đầu trang tiếng Nga, cùng chữ với FB-02.
  - (b) Riêng trang ru: menu 4 mục chỉ hiện từ ≥ 1160 px; dưới mốc đó dùng đầu trang kiểu 768 px (logo · nút ngôn ngữ · Zalo · nút chính · menu), vốn đang vừa.
  - UXD nghiêng về (a), vì một chữ dùng chung cho cả đầu trang lẫn thanh đáy.
  - Bổ sung test tràn đầu trang ở 1024 px × 5 ngôn ngữ.
- Trạng thái: Open

### FB-R4-UXD-FE-04
- Mức độ: Major
- Vị trí: `price-estimate.ts` → `showAnswer()` (`.est-main` = trước + `<data class="est-amt">` + sau); `landing.css` `.est-amt { display: inline-block }`; ô giá S3, trang en/vi/ru trên điện thoại.
- Vấn đề: Số tiền (Lora 28 px) và đuôi "for 3 nights" (15 px) nằm chung một dòng. Ở 360–390 px dòng bị ngắt giữa cụm từ:
  - "2,201,001 VND for 3 ↵ nights" (ảnh FE `en-390-form`);
  - "2.201.001 VND cho ↵ 3 đêm";
  - "2 201 001 VND за 3 ↵ ночи" (ảnh FE `ru-390-form`).
  Chữ số và danh từ bị tách ra hai dòng, đuôi 15 px treo cạnh số 28 px. ko/zh trông ổn chỉ vì cụm "3박 기준" / "3 晚，共" đứng trước số nên tự rơi lên dòng riêng. Ở 1280 px tiếng Hàn lại về một dòng, nên bố cục không nhất quán giữa các cỡ. Thiết kế 3.3/3.4 tách riêng: số tiền một dòng, dòng phụ "3 nights · …" bên dưới.
- Vì sao quan trọng: S3 là trạng thái khách nhìn nhiều nhất và trên điện thoại (phần lớn khách). Dòng ngắt sai làm con số trông cẩu thả, đúng chỗ cần cảm giác chỉn chu nhất.
- Đề xuất sửa: Cho số tiền luôn đứng một dòng riêng (`.est-amt { display: block }`, hoặc tách ra phần tử riêng). Cụm số đêm ("for 3 nights", "cho 3 đêm", "за 3 ночи", "3박 기준", "3 晚，共") đi thành dòng phụ `.est-line` (14–15 px, Stone): ở dưới số với en/vi/ru, ở trên số với ko/zh như hiện nay. CPY tách chuỗi `estimate.total` thành `{nights}` + `{amount}` nếu cần. Ngoài ra, bọc cụm "số + đêm" bằng khoảng trắng không ngắt (U+00A0) để "3 nights" không bao giờ bị tách. Câu đọc cho trình đọc màn hình giữ nguyên.
- Trạng thái: Open

### FB-R4-UXD-FE-05
- Mức độ: Minor
- Vị trí: `landing.css` → `:root:lang(ru) p { hyphens: auto; }`
- Vấn đề: Luật này áp cho **mọi** `<p>`, kể cả nhãn và chữ nhỏ trong giao diện:
  - Tiêu đề lời mời (`.est-lbl`, chữ hoa) bị ngắt "ОСОБОЕ ПРЕДЛОЖЕНИЕ ДЛЯ ДОЛ-ГОГО ПРОЖИВАНИЯ".
  - Ghi chú ô giá ngắt "На-логи".
  - Lời dẫn hero ngắt "засыпа-ется" (1280 px).
  Thiết kế 1.5 quy định `hyphens: auto` chỉ ở đoạn văn, **không** ở tiêu đề, nút, nhãn.
- Vì sao quan trọng: Ngắt từ trong nhãn chữ hoa và trong câu ngắn 6 chữ trông như lỗi. Ở hero thì giảm cảm giác điềm tĩnh.
- Đề xuất sửa: Giới hạn `hyphens: auto` cho đoạn văn dài trong thân mục (ví dụ `.sec p`, FAQ, trang privacy). Đặt `hyphens: manual` cho `.est-*`, `.label`, `.f-title`, `.hint`, `.lead` của hero.
- Trạng thái: Open

### FB-R4-UXD-FE-06
- Mức độ: Minor
- Vị trí: `landing.css` → `:root:lang(ko) h1`, `:root:lang(zh-Hans) h1` (cách dòng 1,3, giãn 0,02em); hero `/ko/`, `/zh/`.
- Vấn đề: H1 của mọi trang là tagline tiếng Anh, có `lang="en"`. Bộ chọn `:root:lang(zh-Hans) h1` vẫn khớp, vì nó xét `lang` của `<html>` chứ không phải của H1. Vì vậy tagline Lora trên trang Hàn/Trung có cách dòng 1,3 thay vì 1,1 như en/vi/ru. Hero trông thưa và cao hơn hẳn (so ảnh FE `zh-1280-top` với `ru-1280-top`). Quy tắc 1,3 của UXD được viết cho tiêu đề chữ Hàn/Trung, không dành cho chữ Latin.
- Vì sao quan trọng: Tagline là điểm nhận diện số một. Nó nên giống hệt nhau trên cả 5 trang.
- Đề xuất sửa: Đổi bộ chọn sang `h1:lang(ko)`, `h1:lang(zh-Hans)` (và tương tự cho `.h2` nếu có chữ Latin mang `lang="en"`). Như vậy phần tử `lang="en"` giữ cách dòng và giãn chữ gốc.
- Trạng thái: Open

### FB-R4-UXD-FE-07
- Mức độ: Minor
- Vị trí: `landing.css` `.est.is-busy .est-line { opacity: 0.45 }`; S2 khi chưa có giá cũ.
- Vấn đề: Khi tính lần đầu (chưa có số cũ), dòng "Checking rates…" / "Считаем цену…" / "正在计算价格…" cũng mang class `.est-line` nên bị mờ 45 %. Chữ Stone trên nền Ivory chỉ còn khoảng 1,9:1, dưới mức AA 4,5:1 (xem ảnh S2 của 5 ngôn ngữ). Thiết kế chỉ cho mờ **số cũ**. Dòng "đang tính" phải đọc được.
- Vì sao quan trọng: Đây là chữ hiển thị nên phải đạt WCAG 1.4.3. axe không bắt được vì trạng thái này chỉ kéo dài thoáng qua.
- Đề xuất sửa: Cho dòng chờ class riêng (ví dụ `.est-wait`) không bị mờ, hoặc chỉ làm mờ `.est-main` và các dòng thuộc số cũ.
- Trạng thái: Open

### FB-R4-UXD-FE-08
- Mức độ: Minor
- Vị trí: `price-estimate.ts` → `view.note.join(' ')`; `booking-logic.ts` → `monthlyOfferView()` (câu đọc ghép bằng `'. '`); trang `/zh/`.
- Vấn đề:
  - Ghi chú S3 tiếng Trung ghép các câu bằng dấu cách: "价格以越南盾（VND）计。 含税。 最终价格…". Sau dấu "。" có khoảng trắng, nhìn thấy rõ trong ảnh.
  - Câu đọc của lời mời tháng là "长住专属优惠. 入住…", dùng dấu chấm ASCII + dấu cách thay cho "。".
- Vì sao quan trọng: Lỗi dấu câu CJK làm bản Trung trông như máy dịch. Bản Trung chưa qua người bản xứ (cổng phát hành), nên sửa ngay ở mã thì đỡ một vòng.
- Đề xuất sửa: Ghép câu theo ngôn ngữ: zh dùng chuỗi rỗng, ko/en/vi/ru dùng dấu cách. Ghép tiêu đề + thân lời mời: zh dùng "。", còn lại dùng ". ". Hoặc để CPY cấp sẵn câu đọc `priceMonthlyOffer.live` cho từng ngôn ngữ.
- Trạng thái: Open

### FB-R4-UXD-FE-09
- Mức độ: Minor
- Vị trí: `price-estimate.ts` → `run()` nhánh `typeof q === 'string'` (S0/S1/tháng) và `showPrompt()`; vùng `#bk-est-live`.
- Vấn đề: Khi giá bị xóa (khách bỏ hạng hoặc xóa ngày), vùng `role="status"` ẩn vẫn giữ câu cũ, ví dụ "Estimated rate updated: 2,201,001 VND for 3 nights". Người dùng trình đọc màn hình duyệt bằng con trỏ ảo sẽ gặp một giá không còn đúng. D7 (thiếu chuỗi "Estimate cleared.") làm việc này lộ ra.
- Vì sao quan trọng: Giá sai đọc cho khách khiếm thị là lỗi đúng/sai về tiền, dù chỉ ở mức ước tính.
- Đề xuất sửa: Khi về S0/S1, đặt `d.live.textContent = ''` và `lastLive = ''` ngay (xóa câu không gây đọc). Khi CPY có `estimate.liveCleared` thì đọc câu đó theo thiết kế 3.6.
- Trạng thái: Open

### FB-R4-UXD-FE-10
- Mức độ: Minor
- Vị trí: `src/content/site.json` `booking.shortMaxNights: 27` → gợi ý dưới ô ngày `longHint` ("{n} nights. We will quote our long-stay rate."); decision-log 01/11 (INV: từ **30 đêm** mới chuyển sang giá tháng).
- Vấn đề: Mốc chuyển sang tháng nằm ở API (đúng thiết kế ARC). Nhưng gợi ý dưới ô ngày vẫn tự giữ một mốc riêng (28). Khi BE/Desk đổi sang 30 đêm, khách chọn 28–29 đêm sẽ thấy dưới ô ngày câu "we will quote our long-stay rate", còn ô giá ngay bên dưới lại hiện một tổng tiền theo đêm. Hai câu mâu thuẫn nhau.
- Vì sao quan trọng: Hai thông tin trái nhau về giá trên cùng một form làm khách mất tin tưởng và hỏi lại lễ tân.
- Đề xuất sửa:
  - Khi ô giá đang bật, lấy gợi ý ở dài theo câu trả lời API (`unavailableReason = monthly_offer`) thay vì `shortMaxNights`.
  - Khi giá tắt, giữ `shortMaxNights` nhưng ORC ghi việc cập nhật `site.json` (27 → 29) cùng lúc với hotfix Desk.
  - Phải khớp trước khi phát hành LP-v2.
- Trạng thái: Open

### FB-R4-UXD-FE-11
- Mức độ: Suggestion
- Vị trí: `.est-amt` (S3), cả 5 ngôn ngữ.
- Vấn đề: "VND" dùng cùng cỡ Lora 28 px với con số, nên khối số trông nặng ("2,201,001 VND"), nhất là với ru vì có thêm khoảng trắng nhóm số.
- Vì sao quan trọng: Thiết kế 3.7 muốn số tiền điềm tĩnh, không phô trương.
- Đề xuất sửa: Đặt "VND" trong `<span class="est-cur">` dùng Be Vietnam Pro 15 px màu Stone (giống "/ month" trong thiết kế 3.4). Phần tử `<data value>` và chữ đọc giữ nguyên. FE tự cân nhắc. UXD sẽ ghi kiểu này vào design system khi cập nhật D2.
- Trạng thái: Open

### FB-R4-UXD-FE-12
- Mức độ: Suggestion
- Vị trí: `tests/e2e/landing/lp-v2.landing.spec.ts` TC-LP-061 (ảnh chụp); `rounds/round-04/outputs/FE/screenshots/*-390-form.png`
- Vấn đề:
  - Ảnh chụp form 390 px có đầu trang dính nằm đè giữa ảnh (en, ko, ru, zh), che mất ô tab "Several nights" và gợi ý số đêm.
  - Bộ ảnh chỉ có 390/1280 px, trong khi lỗi FB-02/03 chỉ lộ ở 320–375 và 1024–1159 px.
- Vì sao quan trọng: Ảnh là bằng chứng để UXD/QA/INV review. Ảnh sai cỡ hoặc bị che thì bỏ sót lỗi.
- Đề xuất sửa: Ẩn đầu trang dính khi chụp ảnh phần tử (thêm CSS `header { position: static }` chỉ trong test). Thêm ảnh 360 và 1024 px. Chụp thêm ô giá các trạng thái S1/S2/S4–S7 (UXD đã tự chụp để review lần này).
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
1. **Font tải rất gọn.** Cắt theo ký tự thật và tách phần A/B: KO tải 47 KB, ZH 101 KB, thấp hơn nhiều so với ước tính UXD (+105–160 / +160–235 KB). Trang Trung trên máy tính vẫn dưới trần 700 KB, không phải dùng đòn bẩy b/c (giữ được Noto cho thân chữ). Có test glyph và test "font cũ" chặn sai sót khi CPY đổi chữ.
2. **Kiểu chữ theo ngôn ngữ đúng từng con số.** Nhãn: en 0,1em chữ hoa, ru 0,06em, ko/zh 0,04em không chữ hoa. Cách dòng thân: ko 1,7, zh 1,75. Ô nhập ko/zh dùng font hệ thống. Lora chữ Kirin cho tiêu đề Nga và Onest cho thân Nga đúng nét nhận diện. Nút ngôn ngữ đúng thiết kế: quả địa cầu + mã, tấm ngang trên điện thoại, thả xuống 212 px viền Oak trên máy tính, không cờ, không bóng, chạy được khi không có JavaScript.
3. **Ô giá đúng tinh thần "không bán rẻ".** Không gạch giá, không huy hiệu %. Giảm ở dài chỉ là một câu chữ. Không bao giờ chặn nút gửi. Có `role="status"` riêng, đọc sau 700 ms và chỉ khi câu đổi. Trạng thái tháng (ESC-043) không có chữ số, có test chặn chữ số và chặn nhãn "Estimated rate". Chỉ dùng token màu thương hiệu.

## Việc UXD tự nhận (bước Phản hồi & sửa)
- Sửa thiết kế `lp-v2-design.md`: mục 3.5 (định dạng tiền theo D2), 3.3 (S4/S5 theo ESC-043, S7 không có "Try again"), 1.3.7 (D1 dùng font hệ thống).
- Cập nhật `product/design/landing/concept.md` và mục chữ trong design system: ngoại lệ font L1–L3, kiểu số tiền.
