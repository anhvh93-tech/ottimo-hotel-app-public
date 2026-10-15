# UXR review UXD – Round 1 · Bước 3 (Review chéo)

> **Mô phỏng – cần INV kiểm chứng.** Đây là đánh giá chuyên gia (UXR – agent AI), đi qua các luồng bằng cách đóng vai persona P1–P7 (`product/docs/research/personas.md`) trên wireframe. **Không phải** kết quả test với người dùng thật.

- Người review: UXR · Ngày: 15/10/2026 · Review bắt buộc theo plan R1 mục 5.
- Đối tượng: `product/design/design-system.md` (v0.2), `tokens.json`, `content-guide.md` (v0.2), `copy/strings-{vi,en,ru}.json`, `wireframes/index.html` + `01…09`, `wireframes/assets/wf.css`, `wf.js`, `tokens.css`; báo cáo `rounds/round-01/outputs/UXD/report.md` (đợt 2 + đợt 4).
- Cách làm: đọc mã HTML/CSS/JS; **tính lại** tương phản theo công thức WCAG cho các cặp màu thật sự xuất hiện trong CSS (không chỉ bảng token); đối chiếu từng mã HR trong `product/docs/research/heuristic-review-r0.md`; đối chiếu chéo với `security-requirements.md` (SR-GST, SR-DEV, SR-AUTH) và `business-rules.md` (BR-611, BR-811).
- Giới hạn: **chưa xem được bằng trình duyệt** – Browser pane từ chối mở tệp cục bộ (`file://…/06-housekeeping-mobile.html`). Kết luận về bố cục dựa trên CSS; UXD/QA nên mở `index.html` ở 360px và 1280px để xác nhận các thẻ 04, 05.

## Tóm tắt

| Mức | Số thẻ | Mã |
|---|:-:|---|
| Blocker | 1 | 01 |
| Major | 6 | 02, 03, 04, 05, 06, 07 |
| Minor | 7 | 08–14 |
| Suggestion | 2 | 15, 16 |
| **Tổng** | **16** | |

Kết luận ngắn: **4/4 Blocker và 12/12 Major của R0 đã được xử lý về hướng thiết kế** (bảng A). Phần còn lại là (1) các luồng bảo mật mới (OTP khách, thiết bị được cấp, 2FA) **chưa vẽ cho tình huống đến muộn / ca tối / mạng yếu** – đây là chỗ đứt của hành trình J1 và J3; (2) CSS của wireframe vi phạm vài chuẩn kích thước chính Design System tự đặt ra (vùng chạm, cỡ chữ ở giao diện buồng phòng).

---

## A. Đối chiếu 16 mã HR (4 Blocker + 12 Major)

| HR | Mức R0 | Kết quả | Bằng chứng | Phần còn thiếu |
|---|---|---|---|---|
| HR-01 App khách chỉ tiếng Việt | Blocker | **Đã khắc phục (VI/EN)**; RU một phần | L7: mọi chuỗi chính qua `data-i18n`; `strings-en.json` 534 khóa = VI; công tắc VI/EN/RU đổi `<html lang>` (`wf.js` `setLang`) | Còn chuỗi cứng + chữ tự do của nhân viên (thẻ 06); RU 7/79 khóa `guest.*` – đúng quyết định "RU ở R3" (decision-log dòng 49) |
| HR-04 Phụ thu nhận sớm tính sẵn | Blocker | **Đã khắc phục** | L3 3.4: giờ mặc định 14:00, chữ "không phụ thu", công tắc + ô tích "Tôi đã báo khách"; L4 4.2 làm tương tự cho trả muộn | – |
| HR-06 Hủy giữ chỗ một chạm | Blocker | **Đã khắc phục** | L2 2.3 + L9 9.6: 6 hộp `role="alertdialog"`, tiêu đề là câu hỏi có đối tượng, hậu quả cụ thể ("mở bán lại 16/10–18/10 trên 7 kênh"), lý do bắt buộc, nút an toàn có `autofocus` | – |
| HR-07 Đối chiếu giấy tờ báo "Khớp" giả | Blocker | **Đã khắc phục** | L3 3.2: `CheckRow` Đạt / Không đạt / Chưa kiểm được, khác nhau cả icon, chữ, kiểu viền (liền đỏ / đứt cam); "Chưa kiểm được" có nút "Tôi đã kiểm" ghi tên | – |
| HR-02 Buồng phòng dùng giao diện desktop thu nhỏ | Major | **Đã khắc phục về bố cục**; CSS còn lỗi | L6 riêng: 1 cột, `.hk .btn` 48px, `.xl` 56px, stepper 56px, checkbox 28px | Nút Hoàn tác 28px, thanh dưới chữ 12px, seg 40px (thẻ 04) |
| HR-03 Không điều hướng theo vai | Major | **Đã khắc phục** | L1 1.2: bảng 9 mã vai, trang chủ theo vai, bỏ bộ chọn "Xem với vai trò"; DS 6.9 nút = `allowedActions` | – |
| HR-05 Esc/bấm nền làm mất dữ liệu | Major | **Đã khắc phục** | DS C15 + 6.2; L2 2.2 chip "Nháp tự lưu 10:41", hộp "Bỏ các thay đổi chưa lưu?"; L3/L4 có "Lưu nháp & đóng" | – |
| HR-08 Focus và bàn phím | Major | **Đã khắc phục ở quy tắc** | DS A1, A2, A7, A13; mỗi trang có `lang`, `<title>`, link "Bỏ qua tới nội dung"; rack dùng `button` trong ô, `role="grid"` | Wireframe tĩnh – chỉ kiểm được ở bản build R2 (QA) |
| HR-09 Thông tin quan trọng chỉ là toast 2,8 giây | Major | **Đã khắc phục** | DS C18 (≥ 6 giây, nút đóng), C20 việc bền vững; L3 3.4 "Đã thêm vào việc cần làm trên Tổng quan"; L3 3.3 "Khai báo sau" nhắc 22:00/07:00 | – |
| HR-10 Tương phản và cỡ chữ | Major | **Đã khắc phục ở token** (tôi tính lại 8 cặp, khớp bảng DS 2.2) | `--faint` 5,15:1, `--focus` 5,44:1, cỡ tối thiểu 12px | Hai cặp **thực tế trong CSS** không đạt: viền focus trên đầu trang app khách 2,22:1; thanh rack "Đã kín" 4,49:1 (thẻ 05, 13) |
| HR-11 Trạng thái chỉ bằng màu | Major | **Đã khắc phục** | DS 2.3: mọi trạng thái có icon + chữ; rack có viền đứt, sọc chéo, tiền tố "HĐ", chú giải luôn hiện | Chip đầu dòng rack chỉ ghi mã "VC" (thẻ 11) |
| HR-12 Biểu đồ không có dữ liệu thay thế | Major | **Đã khắc phục trên máy tính** | L8: cột là `button` có `aria-label`, nút "Xem dạng bảng" | Chưa có khung điện thoại – thiết bị chính của P1 (thẻ 03) |
| HR-13 Thuật ngữ VC/VD/FOC | Major | **Đã khắc phục** | Chuỗi `hk.status.*` là câu thường; bill L4 ghi "Đồ miễn phí", không "FOC" | 10 chuỗi giao diện còn mã "BR-xxx" (thẻ 08) |
| HR-14 Hóa đơn dài hạn thiếu minh bạch | Major | **Đã khắc phục** | L7: kỳ chốt, chỉ số đầu/cuối, nút "Xem ảnh công tơ"; L4 bảng khấu trừ ký quỹ có nguồn (BR-214) | – |
| HR-20 Khóa phòng cho cảm giác đã khóa | Major | **Đã khắc phục** | DS 6.6; L6 "Đang gửi yêu cầu khóa…" → chỉ "Đã khóa – ngừng bán trên mọi kênh" khi server xác nhận | – |
| HR-21 Lễ tân phải nhớ/chép khai báo | Major | **Đã khắc phục** | L3 3.3: sao chép từng trường theo thứ tự cổng, nút đổi "Đã chép", trạng thái "Đã mở cổng – chưa có mã hồ sơ", "Khai báo sau" có nhắc giờ | Không làm được trên điện thoại ca tối (thẻ 01) |

Minor R0 đã xử lý thêm: HR-16 (bộ đếm giữ chỗ), HR-17 (hoàn tác 10 giây), HR-18 (nguồn giá), HR-19 (bảng thuật ngữ), HR-22 (bấm ô trống điền sẵn, tìm toàn cục), HR-24 (lỗi có cách sửa, `role="alert"`).

---

## B. Thẻ feedback

### FB-R1-UXR-UXD-01
- Mức độ: Blocker
- Vị trí: `wireframes/07-guest-app.html` 7.1 khung 2–3 (xác minh mức 2, mã cửa) và chú thích 4; `03-checkin-docs-registration.html` 3.5 (`DEVICE_NOT_TRUSTED`, chú thích 2 "PWA … không bao giờ hiện C3"); `01-login-role-nav.html` 1.2 dòng `front_desk` ("Máy quầy (+ điện thoại ca tối)", menu điện thoại có mục "Khai báo"); `design-system.md` 6.9 và mục 7 (khách mất mạng: chỉ xem dữ liệu đã tải)
- Vấn đề: Đóng vai **P7 Ji-woo đến lúc 23:00** (hành trình J1 bước 4, giả thuyết H-04, H-18) và **P2 trực tối bằng điện thoại** (J3, BR-611), các luồng bảo mật mới tạo ra 3 chỗ không đi tiếp được, và chưa có màn nào cho tình huống này:
  1. Mã cửa chỉ hiện khi phiên mức 2 còn hiệu lực; phiên hết sau **30 phút không dùng** (`guest.verify.expired_session`, SR-GST-09); mã cửa trả về `no-store` (SR-GST-10) nên **không xem lại được khi mất mạng**. Khách roaming/eSIM yếu sóng (persona P7) đứng trước cửa phải xin OTP email mới; email OTA là địa chỉ ủy quyền có thể đến chậm hoặc vào thư rác (H-10).
  2. Lối thoát duy nhất là "mã lễ tân" – nhưng sau 22:00 có thể không có ai ở quầy (BR-611). Màn bị khóa (`guest.verify.locked`) chỉ ghi "liên hệ lễ tân", **không có nút gọi / WhatsApp**; trang lưu trú cũng không có liên hệ khẩn, chỉ đường, hướng dẫn mở khóa (nhu cầu đã ghi ở persona P7).
  3. BR-611 yêu cầu người trực đêm **khai báo trên điện thoại** trước 23:00, nhưng L3 3.5 + SR-DEV-04 quy định PWA điện thoại **không bao giờ** mở dữ liệu C3 (`portal-data`, `door-credential`). Lễ tân trực tối trên điện thoại vì vậy không khai báo được, không xem/đặt được mã cửa. L1 vẫn vẽ mục "Khai báo" trên thanh điều hướng điện thoại của lễ tân – bấm vào sẽ gặp toàn màn "Trên điện thoại không xem được giấy tờ".
- Vì sao quan trọng: khách đã trả tiền nhưng không vào được phòng lúc nửa đêm là sự cố nặng nhất của boutique không có quầy 24/24 (đánh giá xấu trên OTA, gọi chủ đầu tư lúc nửa đêm). Khai báo lưu trú quá 23:00 là rủi ro pháp lý (BR-603). Đây là mâu thuẫn giữa SEC (SR-DEV-04, SR-GST-09/10) và DOM (BR-611); wireframe hiện chọn phía bảo mật mà không vẽ đường đi thay thế.
- Đề xuất sửa (UXD chủ trì, cần SEC + DOM thống nhất – ORC phân xử nếu cần):
  1. Vẽ thêm khung **"Đến muộn / tự nhận phòng"** ở L7: mã cửa hiện ngay trên màn hoàn tất check-in online (lúc đó khách đã xác minh) và **ghi nhớ trên máy khách** trong khoảng hiệu lực (ví dụ bộ nhớ tạm của trình duyệt có hạn – SEC chốt cách lưu); phiên mức 2 không hết khi khách đang ở trong khoảng ngày đến; có nút **"Gọi / WhatsApp người trực"** ở trang lưu trú và ở màn bị khóa; có hình hướng dẫn mở khóa.
  2. Vẽ **ca tối trên điện thoại** cho người trực: hoặc một luồng khai báo rút gọn trên điện thoại được SEC chấp thuận (ví dụ máy điện thoại công ty được cấp như "thiết bị được cấp", chỉ cho vai trực tối), hoặc ghi rõ BR-611 đổi thành "khai báo trên máy quầy, người trực phải có mặt". Bỏ mục "Khai báo" khỏi thanh dưới điện thoại nếu không làm được.
  3. ORC đưa câu "ai trực tối, ở đâu, bằng thiết bị gì" vào **ESC-010** đã có (mục "người khai ca tối") – không cần ESC mới.
- Trạng thái: Open

### FB-R1-UXR-UXD-02
- Mức độ: Major
- Vị trí: `07-guest-app.html` 7.1 khung 2 (`guest.verify.sent_to`, `guest.verify.desk_code`); `02-fo-rack-booking.html` 2.2 ô "Khách đứng tên" (`booker`) và chú thích "SĐT bắt buộc với kênh Trực tiếp và CTV"
- Vấn đề: Mức 2 của app khách dựa vào **email trên đơn**, nhưng form Đặt phòng mới chỉ có tên + SĐT, không có ô email và không báo khi đơn thiếu email. Khách nội địa P5 đặt qua Zalo (H-09, ≥ 70% giả định) thường không để lại email → **mọi** khách này phải nhờ lễ tân đọc mã. Mẹ anh Hưng (68 tuổi) hoặc khách lớn tuổi khó chuyển giữa app email và trình duyệt để chép mã 6 số trong 10 phút. Với khách OTA, email ủy quyền có thể chuyển chậm (H-10).
- Vì sao quan trọng: mã cửa và hóa đơn là hai lý do chính khách mở app; nếu đa số khách phải gọi quầy để lấy mã thì app khách không giảm tải cho lễ tân (mục tiêu US-107) mà còn thêm một bước.
- Đề xuất sửa: (a) L2 thêm ô Email (không bắt buộc) + gợi ý "Thêm email để khách tự xem mã cửa"; drawer đơn hiện cảnh báo "Đơn chưa có email – khách cần mã lễ tân"; (b) màn xác minh hiện **cả hai cách ngang nhau** khi đơn không có email (không gửi OTP tới hư không), câu "Gọi lễ tân +84…" là nút bấm được; (c) đề xuất SEC/PO cân nhắc kênh OTP thứ 2 cho khách (Zalo ZNS đã nằm trong SR-GST-07c/ESC-010) – ghi vào wireframe là biến thể R3; (d) cho phép dán mã từ thông báo email (đã có `autocomplete="one-time-code"` – giữ).
- Trạng thái: Open

### FB-R1-UXR-UXD-03
- Mức độ: Major
- Vị trí: `08-owner-overview.html` 8.1 ("máy tính; điện thoại xếp 1 cột") và 8.2 (duyệt bằng PIN); biểu đồ `.chart` trong `wf.css` dòng 268–271
- Vấn đề: L8 chỉ có 2 khung `frame-desk`, **không có khung điện thoại**, trong khi P1 xem app chủ yếu trên điện thoại (H-01) và duyệt FOC theo thời gian thực (H-19). Hệ quả đo được trên mã: biểu đồ 44 cột `flex:1` với khe 3px → trên màn 360px mỗi cột rộng khoảng 5px, không chạm trúng được (vẫn qua WCAG 2.5.8 nhờ có "Xem dạng bảng", nhưng P1 sẽ không dùng được thao tác "chạm cột để xem số" mà HR-12 yêu cầu); màu cột `--oak` trên `--surface` chỉ **2,94:1** (cần 3:1 cho đồ họa – WCAG 1.4.11); nhãn ngày của cột sai: `aria-label` "10/9 … 15/9" rồi nhảy "16/10".
- Vì sao quan trọng: P1 là người ra quyết định và người duyệt; nếu màn duyệt trên điện thoại khó dùng, yêu cầu FOC/hoàn tiền sẽ treo và lễ tân phải gọi điện (mục tiêu HR-03/HR-12 không đạt cho đúng người dùng chính).
- Đề xuất sửa: vẽ khung điện thoại cho 8.1 (thứ tự: Cần duyệt → Cần chú ý → 3 KPI → biểu đồ 14 ngày, không phải 44 ngày) và 8.2 (duyệt bằng PIN trên điện thoại, nút ≥ 44px); cột biểu đồ dùng `--oak-ink` hoặc thêm viền `--line-strong`; sửa nhãn ngày.
- Trạng thái: Open

### FB-R1-UXR-UXD-04
- Mức độ: Major
- Vị trí: `wireframes/assets/wf.css` dòng 73 (`.m-nav a{font-size:12px}`), 118 (`.touch .seg button{min-height:40px}`), 130 (`.chip{font-size:12px}`), 220–221 + 287 (`.toast{font-size:14px}`, `.toast .btn{min-height:28px}`, padding 4px 6px), 101 (`.hk .field label` 15px); dùng trong `06-housekeeping-mobile.html` (toast "Hoàn tác (8 giây)", seg "Mức độ", thanh dưới) và `07-guest-app.html` (chip, thanh dưới)
- Vấn đề: Design System tự đặt chuẩn **buồng phòng: mọi chữ ≥ 16px, vùng chạm ≥ 48px; điện thoại: chữ phụ ≥ 14px, vùng chạm ≥ 44px** (DS mục 3, 4, 9). CSS thực tế vi phạm ở đúng các điều khiển P3 cần nhất:
  - Nút **"Hoàn tác"** trong toast L6 cao **28px** – quy tắc `.toast .btn` (dòng 221) đứng sau `.hk .btn` (dòng 93) cùng độ ưu tiên nên thắng. Đây là nút giúp P3 sửa khi bấm nhầm (HR-17, persona: "sợ bấm nhầm hỏng máy"), lại chỉ sống 10 giây.
  - Nhãn thanh điều hướng dưới **12px** ở cả L6 và L7; chữ toast 14px; nhãn ô nhập 15px trong giao diện HK.
  - Nút chọn mức độ sự cố (Gấp / Trong ngày / Không gấp) cao **40px** trong giao diện HK.
  - Chip trạng thái 12px trong app khách (khách lớn tuổi P5).
- Vì sao quan trọng: P3 thao tác một tay, tay ướt, mắt kém trên Android tầm trung (H-05, H-07) – vùng chạm nhỏ dẫn tới bấm nhầm hoặc không bấm được Hoàn tác trong 10 giây. FE/MOB sẽ sao chép CSS wireframe làm mẫu, nên lỗi sẽ đi thẳng vào R2.
- Đề xuất sửa: thêm `.hk .toast .btn{min-height:48px;font-size:17px}`, `.hk .m-nav a{font-size:16px}`, `.touch .m-nav a{font-size:14px}`, `.touch .seg button{min-height:44px}`, `.hk .seg button{min-height:48px}`, `.touch .chip{font-size:14px}`, `.hk .field label{font-size:16px}`; thêm vào checklist DS mục 8 dòng "đo kích thước thật bằng DevTools ở 360px cho mọi điều khiển của HK".
- Trạng thái: Open

### FB-R1-UXR-UXD-05
- Mức độ: Major
- Vị trí: `07-guest-app.html` đầu trang mọi khung (`.m-top` nền `var(--bar-in)` + `.seg-inv` VI/EN/RU); `wf.css` dòng 19 (`:focus-visible` dùng `--focus`), 90 (`.btn[aria-disabled="true"]{opacity:.5}`); `design-system.md` 2.2
- Vấn đề: Bảng tương phản DS 2.2 chỉ đo viền focus trên `--bg`/`--surface`. Tôi tính cặp **thực tế** ở đầu trang app khách: viền focus `--focus` #7A5C2E trên nền `--bar-in` #2F2D2A = **2,22:1** (sáng); ở chế độ tối #D9B987 trên #E3DCCF = **1,37:1** – cả hai dưới 3:1 (WCAG 2.4.7 + 1.4.11). Đây là vị trí của công tắc ngôn ngữ – điều khiển quan trọng nhất với P6/P7. Ngoài ra nút bị khóa dùng `opacity:.5`, nhưng DS C1 lại bắt "nút bị khóa phải có chữ giải thích" ngay trên nút ("Dọn xong & tự kiểm đạt (còn 3 mục)", "Tiếp tục: Khai báo (còn 2 mục)", "Hoàn tất trả phòng (còn 1.591.000 đ)") – chữ giải thích bị làm mờ còn khoảng 2,9:1, người mắt kém khó đọc đúng phần thông tin quan trọng.
- Vì sao quan trọng: chuẩn đội đã chốt là WCAG 2.2 AA; người dùng bàn phím/bộ chuyển (switch) trên điện thoại không thấy mình đang ở đâu khi đổi ngôn ngữ. Lý do nút bị khóa là trợ giúp tự sửa lỗi (H9) – không được mờ.
- Đề xuất sửa: thêm token `--focus-on-dark` (ví dụ dùng `--bar-in-t` #F4F0E8 = 12,08:1) cho vùng nền tối; bổ sung vào bảng 2.2 các cặp "focus trên mọi nền có điều khiển" (bar-in, ink, bad); nút bị khóa đổi sang nền `--surface-2` + chữ `--muted` (≥ 4,5:1) thay cho `opacity`.
- Trạng thái: Open

### FB-R1-UXR-UXD-06
- Mức độ: Major
- Vị trí: `07-guest-app.html` 7.1 – chip "Đã xác minh", chip "OK", "#2", dòng bill "3 × 820.000", "Minibar", "≈ USD (BR-004)" (không có số), lý do từ chối "Tour đã kín chỗ ngày mai"; `wf.js` `setLang` (thuộc tính `data-fallback` không đổi `lang`); `content-guide.md` mục 6
- Vấn đề: HR-01 đã được xử lý ở phần lớn chuỗi, nhưng khi bấm EN/RU vẫn còn chữ tiếng Việt cứng trong khung khách (đếm được 6 chỗ ở trên). Nghiêm trọng hơn là **chữ tự do của nhân viên**: lý do "Không thực hiện được" của yêu cầu (SM-15 `declined`) do lễ tân gõ tiếng Việt và hiện nguyên cho khách nước ngoài; content-guide chưa có quy tắc cho chữ tự do. Ở chế độ RU, 7/79 chuỗi `guest.*` là tiếng Nga, phần còn lại là tiếng Anh – màn hình lẫn hai ngôn ngữ, và các đoạn tiếng Anh vẫn nằm dưới `lang="ru"` (trình đọc màn hình đọc tiếng Anh bằng giọng Nga – WCAG 3.1.2).
- Vì sao quan trọng: P6/P7 không đọc tiếng Việt; một câu từ chối không hiểu được dễ thành tranh chấp ("tour của tôi đâu?"). Màn lẫn Nga–Anh kém tin cậy hơn màn tiếng Anh thuần.
- Đề xuất sửa: (a) đưa 6 chuỗi cứng vào bảng chuỗi (bill dùng `guest.bill.line.*`, `≈ {usd} USD`); (b) lý do từ chối / phản hồi yêu cầu dùng **danh sách lý do có sẵn đã dịch** + ô ghi chú tùy chọn, ghi chú tự do hiện kèm nhãn "Ghi chú của lễ tân (tiếng Việt)"; (c) đến khi RU đủ cho một màn thì nút RU **ẩn** trên màn đó (hoặc hiện hẳn EN kèm câu "Русская версия скоро"), không trộn; (d) phần tử dùng chuỗi dự phòng gắn `lang="en"`.
- Trạng thái: Open

### FB-R1-UXR-UXD-07
- Mức độ: Major
- Vị trí: `01-login-role-nav.html` 1.1 khung 2 (TOTP) và 1.4 (cấp thiết bị); `08-owner-overview.html` 8.2 (PIN duyệt); `content-guide.md` `auth.totp.*`, `device.*`
- Vấn đề: Đóng vai P1 (chủ đầu tư, không chuyên kỹ thuật, dùng điện thoại) qua các luồng bảo mật mới: mật khẩu → TOTP → (duyệt) PIN → (cấp máy) nhập lại mật khẩu + TOTP + tích ô cam kết. Các chỗ gây khó:
  1. **Không có màn đăng ký TOTP** (quét QR, lưu 10 mã khôi phục) – chỉ có màn nhập mã. Người chưa từng dùng ứng dụng xác thực sẽ kẹt ngay lần đầu.
  2. "Mất điện thoại? Dùng mã khôi phục" – nhưng SR-AUTH-06 ghi khôi phục khi mất thiết bị là "OWN khác hoặc quy trình CLI". MVP chỉ có **một** owner → P1 mất điện thoại và mất mã khôi phục là khóa chính mình khỏi hệ thống, cần dev can thiệp. Wireframe không nói điều này.
  3. Ô tích bắt buộc khi cấp thiết bị gộp 4 cam kết kỹ thuật ("mã hóa ổ đĩa, khóa màn hình sau 5 phút, không cài tiện ích trình duyệt, tắt lịch sử/đồng bộ clipboard") – P1 không tự kiểm được, sẽ tích cho xong (cam kết không có thật).
  4. Dùng 3 loại mã khác nhau (TOTP, PIN duyệt, mã xác minh khách) với cùng hình thức 6 số – dễ nhập nhầm loại.
- Vì sao quan trọng: chủ đầu tư là người duy nhất mở khóa, cấp quyền, đặt lại mật khẩu (A100); nếu P1 bị chặn thì cả khách sạn bị chặn. Bước bảo mật mà người dùng tích bừa không còn tác dụng bảo mật.
- Đề xuất sửa: vẽ luồng đăng ký TOTP 3 bước (cài app → quét QR → tải/in mã khôi phục, bắt xác nhận đã lưu); thêm biến thể "owner thứ 2 / người khôi phục" (đề nghị PO/SEC cân nhắc bắt buộc 2 tài khoản owner); tách checklist cấp thiết bị thành từng dòng có link "Cách kiểm tra" hoặc chuyển việc kiểm máy cho OPS (nhãn "OPS đã kiểm máy này" thay vì owner tự cam kết); mỗi ô mã có nhãn khác nhau rõ ràng ("Mã trong ứng dụng xác thực", "PIN duyệt của bạn (4–6 số)", "Mã cấp cho khách").
- Trạng thái: Open

### FB-R1-UXR-UXD-08
- Mức độ: Minor
- Vị trí: `copy/strings-vi.json` / `strings-en.json` – 10 khóa: `booking.summary.deposit`, `cancel.fee_none`, `checkin.cond.title`, `handover.cards_help`, `handover.early_fee`, `checkout.extras.smoking`, `checkout.extras.card`, `checkout.late_fee`, `lt.settlement.evidence_missing`, `late.fee`
- Vấn đề: Chuỗi giao diện thật chứa mã nội bộ "(BR-305)", "(BR-511)"… Hai khóa `checkout.extras.*` là tên dòng phụ phí – nếu FE dùng lại cho dòng folio, khách sẽ thấy "Khử mùi thuốc lá (BR-511)" trên phiếu thanh toán.
- Vì sao quan trọng: mã BR là ngôn ngữ của đội, không phải của lễ tân hay khách (H2, HR-13); DS D6 chỉ cho phép mã BR trong **chú thích wireframe**.
- Đề xuất sửa: bỏ mã BR khỏi giá trị chuỗi, chuyển vào cột "Ghi chú" của content-guide mục 8; nếu muốn lễ tân xem căn cứ, dùng liên kết "Xem chính sách" mở trang tham số.
- Trạng thái: Open

### FB-R1-UXR-UXD-09
- Mức độ: Minor
- Vị trí: `06-housekeeping-mobile.html` khung 3 (chip "Sạch – chờ kiểm" màu `ok` + toast "Căn 202: Đã dọn – chờ kiểm"); `strings-vi.json` `hk.status.VC` vs `hk.done_wait_inspect`; khung 1 trạng thái Lỗi
- Vấn đề: (a) Một trạng thái có hai tên ("Sạch – chờ kiểm" và "Đã dọn – chờ kiểm"); (b) "chờ kiểm" dùng cùng tông xanh `ok` với "Sẵn sàng đón khách" – nhìn lướt danh sách, P2/P3 dễ hiểu là đã sẵn sàng; (c) màn lỗi yêu cầu P3 "báo quản lý mã tham chiếu 01JB-6H3D" – người không thích đọc chữ khó chép mã dài.
- Vì sao quan trọng: nhầm "chờ kiểm" với "sẵn sàng" làm hỏng mục đích của bước kiểm phòng (SM-03 R3/R4); mã tham chiếu không đến được người cần.
- Đề xuất sửa: thống nhất một tên (đề xuất "Đã dọn – chờ kiểm"); dùng tông `oak` hoặc `info` cho trạng thái chờ kiểm; ở giao diện HK thay câu báo mã bằng nút "Gửi lỗi cho lễ tân" (tự đính mã tham chiếu).
- Trạng thái: Open

### FB-R1-UXR-UXD-10
- Mức độ: Minor
- Vị trí: `07-guest-app.html` khung 1 và 6 (`common.offline_banner`); khung 4 (lỗi ảnh); `design-system.md` mục 7 dòng "Mất mạng"
- Vấn đề: Banner mất mạng của app khách hứa "Thao tác của bạn được giữ lại và sẽ tự gửi khi có mạng", trong khi DS mục 7 quy định khách chỉ **xem dữ liệu đã tải**. Bước tải ảnh hộ chiếu chỉ có lỗi "ảnh mờ", chưa có trạng thái **đang tải lên trên mạng yếu** (tiến độ, nén ảnh, thử lại tự động) – nhu cầu của P7 (eSIM/roaming).
- Vì sao quan trọng: hứa điều hệ thống không làm là vi phạm H1 (trạng thái trung thực – chính DS 6.6); khách tưởng đã gửi yêu cầu/giấy tờ nhưng thực tế không.
- Đề xuất sửa: tách chuỗi `guest.offline_banner` ("Mất kết nối. Bạn vẫn xem được thông tin đã tải; gửi yêu cầu khi có mạng lại."); thêm khung "Đang gửi ảnh 2/2 – 60%" + "Gửi lại" và ghi chú nén ảnh phía máy khách.
- Trạng thái: Open

### FB-R1-UXR-UXD-11
- Mức độ: Minor
- Vị trí: `02-fo-rack-booking.html` 2.1 – cột tên căn (`<span class="chip ok">VC</span>` và tương tự)
- Vấn đề: Chip trạng thái buồng ở đầu dòng rack chỉ có mã "VC"/"VD" (icon trang trí), trái với DS 2.3 "giao diện quản lý hiện mã + nhãn" và C7 "luôn có icon + chữ". Lễ tân mới hoặc chủ đầu tư phải nhớ mã.
- Vì sao quan trọng: H6 (nhận biết hơn nhớ lại); không nhất quán với chính quy tắc DS.
- Đề xuất sửa: hiện "VC · Sạch" (rút gọn) hoặc giữ mã nhưng thêm `title` + `aria-label` đủ nhãn và một dòng chú giải mã buồng dưới rack.
- Trạng thái: Open

### FB-R1-UXR-UXD-12
- Mức độ: Minor
- Vị trí: `02-fo-rack-booking.html` 2.2 chân modal Đặt phòng mới (nút "Hủy" cạnh "Giữ chỗ đến 18:00 16/10" và "Tạo đơn")
- Vấn đề: Trong cùng hệ thống, "Hủy" nghĩa là hủy đơn/hủy giữ chỗ (hành động phá hủy có hộp xác nhận). Ở modal này "Hủy" lại nghĩa là đóng form – trái quy tắc nhãn "động từ + đối tượng" (DS C1) và có thể khiến lễ tân tưởng sẽ hủy một đơn.
- Vì sao quan trọng: H4 nhất quán; giảm do dự khi đang có khách chờ.
- Đề xuất sửa: đổi thành "Đóng" (nháp vẫn lưu) hoặc "Bỏ nháp" (có hỏi lại).
- Trạng thái: Open

### FB-R1-UXR-UXD-13
- Mức độ: Minor
- Vị trí: `wf.css` dòng 297 (`.bar.unavailable`); `wf.css` dòng 115 (`.seg` viền `--line-strong`) khi đặt trên `--side`
- Vấn đề: Tôi tính lại: chữ `--muted` trên vạch sọc `--line` của thanh "Đã kín" (dạng xem sale/CTV) = **4,49:1** (dưới 4,5:1); viền `--line-strong` trên nền sidebar `--side` = **2,92:1** (dưới 3:1) nếu có ô nhập/seg đặt trong sidebar. Bảng DS 2.2 không có hai cặp này.
- Vì sao quan trọng: CTV P4 xem "Căn trống" ngoài trời trên iPhone; thiếu sát ngưỡng nhưng vẫn là không đạt AA.
- Đề xuất sửa: chữ thanh "Đã kín" dùng `--ink` hoặc nền đặc `--surface-2` (không sọc dưới chữ); thêm 2 cặp vào script `gen_tokens.py`.
- Trạng thái: Open

### FB-R1-UXR-UXD-14
- Mức độ: Minor
- Vị trí: `01-login-role-nav.html` 1.1 khung 1 (ô "Số điện thoại hoặc email" có `inputmode="email"`; lỗi "Còn 3 lần thử trước khi tài khoản tạm khóa")
- Vấn đề: (a) `inputmode="email"` bật bàn phím chữ khi nhân viên nhập số điện thoại (đa số nhân viên dùng SĐT); (b) câu lỗi nêu số lần còn lại, trong khi chú thích 2 và SR-AUTH-04 yêu cầu câu lỗi luôn chung, giống nhau cả khi tài khoản không tồn tại – nêu "còn 3 lần" cho tài khoản thật nhưng không cho tài khoản giả sẽ làm lộ tài khoản nào có thật.
- Vì sao quan trọng: thêm thao tác đổi bàn phím mỗi lần đăng nhập (P3, P4 trên điện thoại); mâu thuẫn giữa wireframe và yêu cầu bảo mật sẽ làm FE lúng túng.
- Đề xuất sửa: bỏ `inputmode` (để bàn phím mặc định) hoặc thêm seg "SĐT / Email"; thống nhất câu lỗi theo SEC (có thể giữ "Quên mật khẩu? Nhờ chủ đầu tư đặt lại").
- Trạng thái: Open

### FB-R1-UXR-UXD-15
- Mức độ: Suggestion
- Vị trí: `07-guest-app.html` công tắc ngôn ngữ (`VI / EN / RU`); `design-system.md` C28
- Vấn đề: C28 ghi "tên ngôn ngữ viết bằng chính ngôn ngữ đó", wireframe dùng mã 2 chữ; chuỗi `guest.lang.vi/en/ru` ("Tiếng Việt", "English", "Русский") đã có nhưng chưa dùng.
- Vì sao quan trọng: khách không quen mã ISO (đặc biệt khách lớn tuổi) nhận ra tên ngôn ngữ của mình nhanh hơn.
- Đề xuất sửa: nút hoặc menu "Tiếng Việt · English · Русский", giữ mã ngắn chỉ khi thiếu chỗ.
- Trạng thái: Open

### FB-R1-UXR-UXD-16
- Mức độ: Suggestion
- Vị trí: `strings-vi.json` `guest.cta.checkin` = "Check-in online", `guest.oci.submit` = "Gửi check-in"
- Vấn đề: Bản tiếng Việt dùng từ tiếng Anh "check-in". Khách trẻ hiểu, nhưng mẹ anh Hưng (P5, 68 tuổi) và khách ít đi khách sạn có thể không hiểu; content-guide mục 3 đã dùng "Nhận phòng" cho cùng khái niệm ở phía nhân viên.
- Vì sao quan trọng: H2 khớp ngôn ngữ người dùng; nhất quán thuật ngữ.
- Đề xuất sửa: "Làm thủ tục trước (check-in online)" ở lần xuất hiện đầu, các chỗ sau "Làm thủ tục trước"; đưa vào giả thuyết kiểm chứng của ESC-003 (hỏi 3–5 khách nội địa).
- Trạng thái: Open

---

## C. Đánh giá theo kịch bản (mô phỏng trên wireframe – cần INV kiểm chứng)

| # | Nhiệm vụ · persona · thiết bị | Đường đi trên wireframe | Số bước / chạm | Chỗ bối rối, lỗi | Dự đoán hoàn thành |
|---|---|---|---|---|---|
| K1 | **Đặt phòng mới** – P2 lễ tân, máy quầy (J3 09:00) | L2 2.1 bấm ô trống căn 203 đêm 19/10 → modal 2.2 điền sẵn căn + ngày → chọn Kênh → Số khách → chọn/tạo khách (tên + SĐT) → giá điền sẵn kèm nguồn → Tạo đơn (hoặc Giữ chỗ) | 6–7 thao tác, 1 màn + 1 modal | Trùng lịch: thông báo nêu tên khách + ngày + nút căn thay thế – tự sửa được (tốt). Nhãn "Hủy" ở chân modal mơ hồ (thẻ 12). Không có ô email → khách sau này không tự lấy mã cửa (thẻ 02). Mất mạng: khóa tạo đơn có giải thích – đúng | **Cao** – không cần hướng dẫn |
| K2 | **Nhận phòng khách nước ngoài** – P2 + P7 Ji-woo đã check-in online, đến 15:00, máy quầy | L2 "Nhận phòng" → L3 bước 1 giấy tờ đã có sẵn (chụp người thứ 2) → bước 2 kiểm tra 3 trạng thái, ghi "Cách xử lý" cho mục Không đạt/Chưa kiểm → bước 3 sao chép 5 trường, mở cổng, dán mã hồ sơ → bước 4 mã cửa, số thẻ, giờ nhận (phụ thu 0) → Hoàn tất | 4 bước, khoảng 12–16 chạm (trong đó 5 chạm sao chép) | Luồng rõ, có "← Sửa lại", nháp tự lưu. Nếu khách chưa check-in online, bước 1 thêm chụp/nhập tay cho từng người. Khách ở phía app phải qua OTP email để thấy mã cửa (thẻ 02). **Kịch bản biến thể 23:00, không ai ở quầy: không đi tiếp được** – khách kẹt cửa, người trực trên điện thoại không khai báo được (thẻ 01) | **Cao ban ngày tại quầy; Thấp khi đến muộn** |
| K3 | **Buồng phòng báo sạch** – P3 Chú Bảy, Android 6", một tay, Wi-Fi yếu (J4) | L6 Việc của tôi (căn ưu tiên có viền đỏ + "Có khách đến 14:00") → "Bắt đầu dọn" → cuộn qua 12 mục checklist + minibar → "Dọn xong" → toast Hoàn tác 10 giây | 2 chạm + cuộn (đạt mục tiêu "≤ 2 chạm" của persona) | Mất mạng vẫn bấm được, đếm thao tác chờ – tốt. Nút Hoàn tác chỉ 28px, chữ thanh dưới 12px (thẻ 04). "Dọn xong" đang bật dù checklist còn 3 mục chưa tích – chưa rõ checklist có bắt buộc không (cần DOM/BA xác nhận). Trạng thái sau dọn màu xanh giống "Sẵn sàng" (thẻ 09) | **Cao** nếu H-05 đúng (buồng phòng chịu dùng app) |

---

## D. Luồng bảo mật mới – đánh giá nhanh gánh nặng cho người dùng

| Luồng | Ai chịu | Gánh nặng | Nhận xét |
|---|---|---|---|
| OTP email 6 số cho app khách (SR-GST-07) | P5, P6, P7 | Chuyển app email ↔ trình duyệt; phụ thuộc có email | Hợp lý cho P6 (dài hạn, có email). Khó cho P5 (không email) và P7 lúc đến muộn → thẻ 01, 02 |
| Phiên mức 2 hết sau 30 phút, khóa sau 5 lần sai | Khách | Xác minh lại nhiều lần trong kỳ lưu trú | Chấp nhận được cho hóa đơn; **không chấp nhận** cho mã cửa khi đứng trước cửa → thẻ 01 |
| Thiết bị được cấp, PWA không có C3 | P2 (ca tối), P1 | Không xem giấy tờ/mã cửa trên điện thoại | Đúng cho ban ngày; đứt luồng ca tối → thẻ 01 |
| 2FA TOTP owner/manager + PIN duyệt | P1 | 3 loại mã, chưa có đăng ký/khôi phục | → thẻ 07 |
| Mã xác minh lễ tân cho khách | P2 | Thêm 1 thao tác ở quầy, đọc mã qua điện thoại | Tốt: có đếm ngược, cảnh báo không gửi kèm link; là lối thoát đúng – cần thêm cho người trực ngoài quầy |

---

## E. Điểm làm tốt – nên giữ

1. **Bốn Blocker R0 được xử lý tận gốc bằng mẫu dùng chung**, không vá từng màn: Phụ thu chủ động (DS 6.3), Kiểm tra 3 trạng thái (C22/6.4), Xác nhận phá hủy có hậu quả cụ thể + nút an toàn nhận focus (6.1, 6 hộp ở L2/L9), i18n qua bảng chuỗi. Bảng 7 hành động không đảo ngược ở L9 9.6 là tài liệu tốt cho FE và QA.
2. **Giao diện buồng phòng L6 đúng persona P3**: câu thường thay mã, việc xếp theo ưu tiên có lý do ("Có khách đến 14:00 – dọn trước tiên"), stepper minibar 56px, thao tác offline có hàng đợi và xử lý xung đột thành việc "Cần xem lại", không lộ tên khách ngoài phạm vi việc hôm nay.
3. **Trạng thái hệ thống trung thực và có công tắc Tải/Rỗng/Lỗi/Mất mạng ở cả 9 luồng**: "Đang gửi yêu cầu khóa…" trước "Đã khóa", lỗi máy chủ có mã tham chiếu thật (`requestId`), lỗi nghiệp vụ theo `Problem.code` kèm cách sửa; token màu có script đo tương phản tự động – nên đưa vào CI như UXD đề xuất.
