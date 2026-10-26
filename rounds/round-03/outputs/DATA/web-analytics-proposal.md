# Đề xuất đo truy cập và thu dữ liệu khách từ ottimo.vn (FB-INV-004 ý 3)

- Vai: DATA | Round 3 – Sản xuất (đề xuất) | Ngày: 26/10/2026 | Trạng thái: **Đề xuất – SEC cần review, INV quyết ở ESC-034**
- Nguồn đã đọc: `04-investor-feedback/FB-INV-004.md`; `product/apps/landing-web` (README, `src/lib/security-headers.json`, `src/scripts/booking-logic.ts` – `utmOf`/`refHostOf`, `src/content/site.json`); `product/infra/caddy/Caddyfile.landing`; `product/docs/adr/ADR-014-landing-site.md` mục 2.6, 6; `rounds/round-02/outputs/DOM/landing-positioning.md` mục 6; `03-backlog/backlog.md` US-151 AC6, US-155, US-158, US-077; `product/docs/metrics-definitions.md` K-11; `02-escalations/ESC-001.md` (LZ-1…LZ-9), `ESC-002.md`, `ESC-030.md`; `04-investor-feedback/lawyer-questions-2026-10-26.md`; `rounds/round-03/release-v1-plan.md` mục 6–7.
- Căn cứ pháp lý: anh/chị và ORC nhắc NĐ 13/2023. Theo ESC-001 LZ-1, từ 01/01/2026 văn bản hiện hành là **Luật 91/2025/QH15 + NĐ 356/2025/NĐ-CP** (thay NĐ 13/2023). Tài liệu này dùng căn cứ mới. Mọi nhận định pháp lý dưới đây là **cách đội hiểu, chờ luật sư xác nhận**.

## 0. Tóm tắt

- Hiện trạng: ottimo.vn chạy từ 25/10, **không đo gì**. CSP chặt (`connect-src 'self'`, không tải gì từ tên miền khác – SEC C-1). Log Caddy đã bỏ query (mất UTM), bỏ header, che IP /24. Form "Yêu cầu đặt phòng" tắt tới khi luật sư trả lời (ESC-030 A).
- **Đề xuất: phương án C+** (mục 2.3). Gồm Google Search Console xác minh bằng DNS, cộng một bộ đếm **ẩn danh, tổng hợp theo ngày** chạy trên chính máy chủ của OTTIMO: trang gửi một tín hiệu nhỏ cùng tên miền khi có lượt xem hoặc lượt bấm, Caddy ghi lại **không kèm IP**, mỗi đêm một script cộng thành số theo ngày.
  - 0 đ/tháng, không cookie, không banner, không bên thứ ba, không sửa CSP, không thêm container.
  - Phát hành ở **bản landing kế tiếp** (`landing-v*`, độc lập với app), sau ngày chạy Desk.
  - Giai đoạn 2 (v1.2, cùng báo cáo US-100): đưa số đếm vào Desk (US-158) để có phễu "lượt xem → yêu cầu → đơn → doanh thu".
- **"Collect data khách hàng"**: dữ liệu đo ở trên là ẩn danh, **không phải** danh sách khách. Tên, số điện thoại, email chỉ thu qua kênh khách tự gửi và có đồng ý riêng:
  - form yêu cầu đặt phòng, khi luật sư duyệt;
  - Zalo OA, khách tự bấm Quan tâm;
  - đồng ý nhận ưu đãi khi khách đã ở (US-077).
- Đội **không** đề xuất ô "đăng ký nhận ưu đãi" trên web lúc này. Lý do: trái US-151 AC6 (SEC DOM-05) và còn chờ luật sư (LZ-3, LZ-5, LZ-6).
- ESC-034 có 2 câu cho INV: chọn công cụ đo, và có thêm ô nhận ưu đãi trên web không.

## 1. Đo gì cho một boutique stay 10 căn

Nguyên tắc:
- Quy mô ước 100–400 lượt xem/ngày (ADR-014 mục 8, **chưa có số thật**). Đội cần ít chỉ số nhưng phải đúng, để trả lời 3 câu: (1) khách đến từ đâu, (2) họ xem gì, (3) họ có liên hệ/đặt không.
- **Không** đo số người duy nhất hay hành trình từng người. Đo những thứ đó cần định danh người xem (cookie hoặc mã băm IP), tức là kéo theo banner đồng ý (ADR-014 6.3). Mọi tỉ lệ dưới đây là **tỉ lệ trên lượt xem**, không phải trên số người.
- Không đặt mục tiêu (target) lúc này: chưa có số nền. Sau **4 tuần** dữ liệu, DATA đề xuất mục tiêu cho INV duyệt. Đội không lấy benchmark ngành không có nguồn.

| ID | Chỉ số | Công thức | Nguồn | Ví dụ (minh họa, không phải số thật) |
|---|---|---|---|---|
| W-01 | Lượt xem trang | Đếm sự kiện `pv` theo ngày × ngôn ngữ (en/vi) × thiết bị (di động/máy tính – suy từ bề rộng màn hình, không đọc User-Agent) | Bộ đếm (mục 2.3) | Tuần 1: 1.400 lượt, 62 % di động, 55 % EN |
| W-02 | Lượt xem theo nguồn | W-01 tách theo `src` ∈ {google, facebook, zalo, instagram, qr, other, direct}. Quy tắc suy nguồn **dùng lại DOM landing-positioning 6.2**: UTM thắng tên miền giới thiệu; không có cả hai → `direct` ("không biết từ đâu", không phải "khách tự gõ") | Bộ đếm | google 520 · facebook 310 · zalo 180 · direct 390 |
| W-03 | Mục được xem | Số lượt xem có cuộn tới mục X ÷ W-01; X ∈ {rooms, amenities, location, book, faq, contact}. Mỗi mục đếm tối đa 1 lần mỗi lượt tải trang | Bộ đếm | Tới "Rooms" 71 %, tới "Plan your stay" 38 % |
| W-04 | Mở ảnh hạng phòng | Số lần mở thư viện ảnh theo hạng (City Studio, Garden Studio, Premium One-Bedroom, Signature Two-Bedroom) | Bộ đếm | Signature 140, Garden 95 |
| W-05 | Tỉ lệ bấm "Plan your stay" | Lượt bấm nút chính (hero, header, thanh đáy, "Request this room") ÷ W-01, tách theo vị trí nút | Bộ đếm | 160 ÷ 1.400 = 11,4 lượt bấm/100 lượt xem |
| W-06 | Tỉ lệ bấm liên hệ | (Zalo + gọi + WhatsApp + Telegram + Viber + email) ÷ W-01, tách theo kênh và vị trí. Một người bấm 2 lần thì đếm 2 | Bộ đếm | Zalo 85 · gọi 30 · khác 12 → 9,1/100 |
| W-07 | Bấm chỉ đường, Facebook | Lượt bấm link Google Maps, fanpage | Bộ đếm | Maps 40 · Facebook 15 |
| W-08 | Phễu form (khi form bật – ESC-030) | Bắt đầu điền ÷ W-01; gửi thành công ÷ bắt đầu điền. Gửi thành công lấy từ **Desk**, không lấy từ trình duyệt | Bộ đếm (bắt đầu) + Desk `website_booking_request` | 40 bắt đầu → 22 gửi (55 %) |
| W-09 | Yêu cầu → đơn → doanh thu | Yêu cầu website đã chuyển (BR-913) ÷ yêu cầu nhận; đơn `directSource = website` theo `website_sub_source`; doanh thu phòng của các đơn đó (phần đóng góp vào K-11/G3) | Desk (đã có sẵn UTM, `ref_host` trên yêu cầu – DOM 6.4) | 22 yêu cầu → 9 đơn → 18,6 tr doanh thu phòng |
| W-10 | Tìm kiếm Google | Lượt hiển thị, lượt nhấp, CTR, vị trí trung bình, từ khóa hàng đầu | Google Search Console (Google tổng hợp, không có dữ liệu từng người) | "ottimo dalat" 300 hiển thị, 120 nhấp |
| W-11 | Google Maps / hồ sơ doanh nghiệp | Lượt gọi, chỉ đường, bấm website từ Google Business Profile | Google Business Profile – mục Hiệu suất (INV xem, 0 đ) | – |

Giới hạn cần nói rõ với INV:
- **Nguồn OTA**: OTA không dẫn khách sang website (thường cấm link ra ngoài trong tin đăng và tin nhắn – **chưa xác minh từng OTA**). Hiệu quả OTA đo bằng **đơn trong Desk** (K-11 cơ cấu kênh), không bằng đo truy cập web.
- **Zalo/gọi → đơn**: không nối được từng người. Khách bấm Zalo rồi đặt qua chat thì Desk ghi nguồn `zalo_phone` (DOM 6.1). Đội chỉ so được theo tháng: số lượt bấm Zalo trên web với số đơn `zalo_phone`. Chỉ form (W-08, W-09) nối được nguồn tới đơn. Đây là lý do nên bật form ngay khi luật sư cho phép.
- Trình duyệt trong Zalo/Facebook có thể không gửi tên miền giới thiệu (**chưa xác minh**) → dễ rơi vào `direct`. Cách khắc phục: mọi link OTTIMO tự đặt **dẫn về** ottimo.vn đều gắn UTM theo bảng DOM 6.3 (nút "Book now" fanpage, bài đăng, menu Zalo OA, Google Business Profile, mã QR). Việc này INV làm được ngay, 0 đ.
- Gắn UTM vào link **đi ra** Zalo (`zalo.me/...`) không giúp gì: Zalo không báo UTM cho OTTIMO (**chưa xác minh**). Lượt bấm Zalo được đo bằng bộ đếm (W-06).

## 2. Ba phương án công cụ

Cả ba phương án đều gồm **Google Search Console** xác minh bằng bản ghi DNS TXT. Cách này không gắn script, không cookie, 0 đ, INV làm khoảng 15 phút. Search Console chỉ cho số từ phía Google. Ba phương án khác nhau ở phần đo **trên trang**.

### 2.1 A – Tự host Umami (hoặc Plausible CE) trên VPS, không cookie

- Cách làm:
  - Thêm container Umami (MIT, dùng PostgreSQL riêng) trên VPS production.
  - Caddy landing proxy **cùng origin** cho script và đường gửi sự kiện (ví dụ `/a/script.js`, `/a/api/send`) → giữ `script-src 'self'`, `connect-src 'self'`.
  - Có màn hình báo cáo sẵn: trang, nguồn, UTM, thiết bị, sự kiện tùy chỉnh.
- Plausible CE cần ClickHouse, nặng cho VPS 4 GB đang chạy Desk production (ADR-014 6.2) → loại.
- Chi phí:
  - Phần mềm 0 đ.
  - RAM thêm khoảng 200–300 MB (ADR-014, **chưa xác minh**), cùng VPS với Desk production → có thể phải nâng gói (OPS báo giá).
  - Thêm một hệ thống phải vá, sao lưu, giám sát.
- Pháp lý/bảo mật (**SEC cần review**):
  - Umami không cookie, nhưng tính **mã phiên** từ băm IP + User-Agent + muối đổi theo tháng (theo hiểu biết của DATA về mã nguồn v2, **chưa xác minh – SEC đọc mã đúng phiên bản**). Như vậy có định danh từng người xem trong 1 tháng (bút danh hóa). Điều này trái **điều kiện 5 của ADR-014 6.3** (SEC ARC-11). Có thể phải coi là dữ liệu cá nhân → cần thông báo, có thể cần đồng ý (luật sư).
  - Thêm một trang đăng nhập quản trị trên Internet: phải chặn theo IP/basic auth, vá kịp thời. Hỗ trợ 2 lớp của Umami **chưa xác minh**.
- Công: OPS 1,5–2 ngày, FE-LP 0,5 ngày, SEC 0,5–1 ngày, QA 0,5 ngày.

### 2.2 B – Google Analytics 4 + Search Console

- Cách làm: gắn gtag GA4, đặt banner đồng ý cookie (từ chối ngang hàng đồng ý), chỉ tải GA4 sau khi khách đồng ý (Consent Mode).
- Chi phí: 0 đ phần mềm. Thêm phí luật sư cho hồ sơ chuyển dữ liệu ra nước ngoài (nếu luật sư xác nhận phải làm).
- Pháp lý/bảo mật (**SEC cần review**):
  - Cookie `_ga` và dữ liệu người xem (IP, thiết bị, hành vi) gửi về Google, máy chủ ở nước ngoài:
    - trái **ESC-002 A** (INV 16/10: toàn bộ dữ liệu khách ở Việt Nam);
    - có thể phải lập **hồ sơ đánh giá tác động chuyển dữ liệu cá nhân ra nước ngoài** theo Luật 91/2025 + NĐ 356/2025 (luật sư xác nhận);
    - phải có đồng ý trước khi đặt cookie.
  - Phải nới CSP: thêm tên miền Google vào `script-src`, `connect-src`, `img-src`.
    - Phá **SEC C-1** – điều kiện cổng LP-v1.
    - Phải sửa kiểm tự động `check-dist.mjs` và E2E "0 yêu cầu ra ngoài".
  - Thông báo xử lý dữ liệu đang gửi luật sư (Phụ lục A/B) ghi *"This website sets no cookies and loads nothing from other companies"*. Chọn B thì câu này sai → phải viết lại, tăng phiên bản, gửi luật sư lần nữa.
  - Banner làm trang chậm hơn và lệch cảm giác "calm" của brand. Khách từ chối thì không đếm được → số liệu thiếu một phần không đo được.
- Khi nào B đáng làm: khi INV chạy **quảng cáo trả phí** (Google Ads, Facebook Ads) và cần đo chuyển đổi cho nền tảng quảng cáo. Đó là quyết định riêng, không cần cho mục tiêu hiện tại.
- Công: UXD + FE-LP 1,5–2 ngày (banner EN/VI, consent mode, CSP, test), SEC 1 ngày, CPY 0,25 ngày, luật sư thêm một lượt.

### 2.3 C – Search Console + bộ đếm phía máy chủ từ log Caddy (đề xuất – bản "C+")

Đọc log Caddy thô như hiện tại **không đủ** (ADR-014 6.2): log bỏ query nên mất UTM, bỏ header nên không biết nguồn, không thấy lượt bấm Zalo/gọi (link đi thẳng ra ngoài), và đếm lẫn bot. Vì vậy đội đề xuất bản **C+**, theo đúng tinh thần ADR-014 6.1 nhưng chưa cần API của Desk:

1. **Tín hiệu cùng origin, không dữ liệu tự do (FE-LP).** `main.ts` gửi `navigator.sendBeacon` (POST, thân rỗng) tới đường dẫn dạng
   `/e/1/<sự kiện>/<vị trí>/<ngôn ngữ>/<nguồn>/<thiết bị>`, ví dụ `/e/1/zalo/sticky/vi/facebook/m`.
   - Mọi đoạn lấy từ **danh sách cho phép** (mục 2.4). Giá trị ngoài danh sách → `other`. **Không** có ngày ở, số khách, nội dung ô nhập, URL đầy đủ, `fbclid`/`gclid`, User-Agent (đúng điều kiện 5 ADR-014 6.3).
   - Nguồn: tính tại trình duyệt bằng `utmOf`/`refHostOf` đã có trong `booking-logic.ts`, rồi rút về 7 nhóm của DOM 6.2. Chỉ gửi **tên nhóm**, không gửi tên miền giới thiệu.
   - Không gửi khi trình duyệt bật Global Privacy Control (`navigator.globalPrivacyControl`).
   - Không cookie, không `localStorage`/`sessionStorage` cho đo lường. Lượt xem chỉ đếm ở trình duyệt chạy JS, nên phần lớn bot đơn giản bị loại.
2. **Caddy trả 204 và ghi log riêng không IP (OPS).**
   - Route `POST /e/1/...`: khớp biểu thức chính quy theo danh sách cho phép → `respond 204`. Không khớp → 404 và không ghi.
   - Các yêu cầu `/e/*` **không** ghi vào log truy cập chung (`log_skip`). Chúng ghi vào một logger riêng đã **xóa hẳn** `remote_ip`, `client_ip`, header, query.
   - `robots.txt` thêm `Disallow: /e/`.
   - CSP **giữ nguyên** (`connect-src 'self'` đã cho phép).
3. **Cộng theo ngày, xóa log thô (OPS + DATA).**
   - Script chạy 00:15 hằng ngày (giờ VN) đọc log `/e/` của ngày trước, ghi một dòng/tổ hợp vào `landing-daily.csv` (ngày, sự kiện, vị trí, ngôn ngữ, nguồn, thiết bị, số lượt).
   - Log thô `/e/` giữ **tối đa 7 ngày** rồi xóa. Docker đang xoay vòng log 20 MB × 5 tệp, nên script phải chạy trước khi tệp bị xoay mất.
   - CSV nằm trên VPS (Việt Nam), sao lưu cùng bản sao lưu hằng ngày.
4. **Báo cáo tuần cho INV (DATA đặc tả, OPS gửi).** Sáng thứ Hai, một email ngắn qua SMTP relay Google Workspace đã có, gửi hộp thư chung OTTIMO:
   - W-01…W-07 tuần này so tuần trước;
   - 5 dòng nhận xét;
   - link Search Console để INV xem W-10.
   Mẫu email theo Brand Guidelines (Ivory/Ink/Light Oak, Lora + Be Vietnam Pro, không emoji).
- Chi phí: **0 đ/tháng**. Không container mới. RAM, đĩa không đáng kể (CSV vài trăm KB/năm – ước của đội).
- Pháp lý/bảo mật (**SEC cần review**):
  - Thiết kế để **không xử lý dữ liệu cá nhân** cho đo lường: không cookie, không IP, không định danh, không bên thứ ba. Giữ đủ 5 điều kiện ADR-014 6.3 → không cần banner (**SEC xác nhận, luật sư ánh xạ theo Luật 91/2025**).
  - Thông báo xử lý dữ liệu (điều kiện 4) cần thêm một câu về việc đếm. Xem mục 3.4.
- Nhược điểm:
  - Không có giao diện báo cáo đẹp như Umami/GA4.
  - Không biết số người duy nhất.
  - Tín hiệu `/e/` có thể bị gửi giả để thổi số. Hậu quả chỉ là sai số đếm, không lộ dữ liệu. Script loại ngày có số bất thường (> 20 lần trung bình 7 ngày) và ghi cờ cho DATA xem.
- Công:
  - DATA 0,5 ngày: từ điển sự kiện, mẫu email, kiểm số.
  - FE-LP 1 ngày: `data-track` trên nút, module đếm, quan sát mục, test đơn vị + kiểm dist (đường dẫn chỉ trong danh sách cho phép, không query) + E2E (CSP sạch, chỉ gọi `/e/` cùng origin, không cookie).
  - OPS 1–1,5 ngày: route + logger + `check-caddy-landing.sh`, script cộng, cron, xóa log, email.
  - SEC 0,25–0,5 ngày. QA 0,5 ngày.
  - INV 15 phút: DNS TXT cho Search Console.

### 2.4 Danh sách cho phép (bản nháp, DATA tự quyết theo quyền định nghĩa sự kiện)

| Đoạn | Giá trị |
|---|---|
| sự kiện | `pv` (xem trang) · `sec` (cuộn tới mục – vị trí = tên mục) · `plan` ("Plan your stay") · `zalo` · `call` · `whatsapp` · `telegram` · `viber` · `email` · `map` · `facebook` · `gallery` (mở ảnh hạng – vị trí = slug hạng) · `lang` (đổi ngôn ngữ) · `form_start` (khi form bật) |
| vị trí | `hero` · `header` · `menu` · `sticky` · `rooms` · `book` · `contact` · `faq` · `footer` · tên mục (`rooms`, `amenities`, `location`, `book`, `faq`, `contact`) · slug 4 hạng phòng · `na` |
| ngôn ngữ | `en` · `vi` |
| nguồn | `google` · `facebook` · `zalo` · `instagram` · `qr` · `other` · `direct` |
| thiết bị | `m` (bề rộng < 768 px) · `d` |

`form_submit` **không** đếm ở trình duyệt. Số gửi thành công lấy từ Desk, tránh đếm lần bấm bị lỗi.

### 2.5 So sánh và đề xuất

| Tiêu chí | A – Umami tự host | B – GA4 | C+ – đếm phía máy chủ |
|---|---|---|---|
| Chi phí tháng | 0 đ phần mềm; có thể nâng VPS | 0 đ; phí luật sư hồ sơ ra nước ngoài | **0 đ** |
| Banner cookie | Có thể cần (mã phiên bút danh) – luật sư | **Bắt buộc** | Không (khi giữ 5 điều kiện) |
| Dữ liệu ra nước ngoài | Không | **Có** – trái ESC-002 A | Không |
| Sửa CSP / SEC C-1 | Không (proxy cùng origin) | **Phải nới, phá C-1** | Không |
| Hệ thống mới phải vận hành | 1 container + DB + trang quản trị | Tài khoản Google, banner | Không |
| Nguồn, UTM, mục xem, lượt bấm | Có | Có | Có |
| Số người duy nhất, hành trình | Có (trong tháng) | Có | **Không** (cố ý) |
| Giao diện báo cáo | Có sẵn | Có sẵn | Email tuần + CSV; v1.2 vào Desk |
| Công đội | ~3,5–4,5 ngày | ~3–4 ngày + luật sư | ~3–4 ngày |

**Đội đề xuất C+**:
- Trả lời được cả 3 câu hỏi kinh doanh ở mục 1, 0 đ.
- Giữ nguyên các cam kết đã có: ESC-002 A, SEC C-1, thông báo đang gửi luật sư.
- Không thêm hệ thống phải vá trên VPS đang chạy Desk.
- Khi cần phân tích sâu hơn (nhiều trang, chiến dịch), chuyển sang A mà không phải bỏ gì: danh sách sự kiện giữ nguyên.
- B chỉ xét khi INV quyết chạy quảng cáo trả phí.

## 3. "Collect data khách hàng": ẩn danh và dữ liệu cá nhân là hai việc khác nhau

### 3.1 Hai loại dữ liệu

| | Dữ liệu đo (ẩn danh, tổng hợp) | Dữ liệu cá nhân khách |
|---|---|---|
| Ví dụ | "Thứ Ba có 210 lượt xem, 18 lượt bấm Zalo, 40 % từ Google" | Tên, số điện thoại, email, Zalo, quốc tịch, ngày ở, nội dung nhắn |
| Biết ai là ai? | Không | Có |
| Cần đồng ý? | Không, khi giữ 5 điều kiện ADR-014 6.3 (SEC + luật sư xác nhận) | **Có** – đồng ý riêng cho từng mục đích, có thông báo xử lý dữ liệu (Luật 91/2025) |
| Dùng để | Biết website hiệu quả không, khách từ đâu tới | Trả lời yêu cầu, phục vụ lưu trú; gửi ưu đãi chỉ khi khách đồng ý riêng |
| Quyết định liên quan | ESC-034 câu 1 | ESC-001 (luật sư), ESC-030 (form), ESC-021 (Zalo OA), ESC-034 câu 2 |

**Không làm** dưới mọi phương án:
- ghi màn hình hoặc bản đồ nhiệt (Hotjar, Microsoft Clarity – ghi cả thao tác gõ phím);
- lấy dấu vân tay trình duyệt;
- đọc ô nhập trước khi khách bấm Gửi;
- pixel quảng cáo;
- hộp bật lên bắt nhập email;
- lấy số điện thoại của người bấm "Gọi" (không thể và không được);
- mua hoặc gom danh sách từ Facebook/Zalo.

### 3.2 Các cách thu dữ liệu cá nhân hợp pháp (theo thứ tự đề xuất)

1. **Form "Yêu cầu đặt phòng" (US-155) – bật khi luật sư trả lời** câu 1–3 thư 26/10 (ESC-030 A).
   - Mã đã xong, chỉ một mục đích: trả lời yêu cầu.
   - UTM và nhóm nguồn đi theo yêu cầu vào Desk (DOM 6.4). Đây là nguồn dữ liệu khách tốt nhất từ web.
   - Dữ liệu form **không** được dùng để gửi ưu đãi nếu khách không đồng ý riêng.
2. **Zalo OA – nút "Quan tâm" khách tự bấm** (US-151 AC6, ESC-021 A).
   - Khách chủ động, quan hệ nằm trên Zalo của khách. OTTIMO nhắn theo luật của Zalo và LZ-4, LZ-5 (luật sư).
   - Trên web chỉ cần đổi `contact.zaloUrl` sang link OA khi OA xác thực xong. Lượt bấm đo bằng bộ đếm (W-06).
   - Menu OA và bài đăng dẫn về website gắn UTM `utm_source=zalo&utm_medium=oa` (DOM 6.3).
3. **Đồng ý nhận ưu đãi khi khách đã ở** (US-077 – ô đồng ý riêng từng người lúc nhận phòng hoặc trên trang khách).
   - Khách đã ở là nhóm có giá trị nhất cho đặt lại trực tiếp (G3).
   - Đang xếp R4+. Đội đề xuất PO xét kéo lên v1.2 cùng mẫu tin (US-161).
4. **Ô "Đăng ký nhận ưu đãi" trên website** (theo gợi ý trong giao việc) – **chưa nên làm**:
   - Trái US-151 AC6 (SEC DOM-05).
   - Cần luật sư trả lời LZ-3 (Điều 28 với ưu đãi tự gửi), LZ-5 (NĐ 91/2020 chống tin rác – email cần đồng ý, có hủy đăng ký), LZ-6 (đồng ý riêng).
   - Desk chưa có nơi lưu bằng chứng đồng ý tiếp thị (ai, lúc nào, phiên bản câu, kênh, rút lại).
   - Với 10 căn, danh sách thư từ người lạ có giá trị thấp hơn khách đã ở (điểm 3 ở trên).
   - Nếu INV muốn: làm sau khi luật sư trả lời, là story mới (BE + FE-LP + SEC + CPY, ước 2–3 ngày công), đích v1.2 trở đi.

### 3.3 Liên kết UTM INV/OWN đặt ngay (0 đ, không cần quyết)

Dùng nguyên bảng DOM `landing-positioning.md` 6.3 cho các link dẫn về ottimo.vn:
- nút "Book now" fanpage;
- bài đăng Facebook;
- ô Website của Google Business Profile;
- menu Zalo OA;
- bio Instagram;
- mã QR in.

Link tiếng Anh dùng gốc `/`, link tiếng Việt dùng `/vi/`. Bộ đếm và form đọc UTM trực tiếp từ đường dẫn trang.

### 3.4 Việc phải làm cùng đợt với C+ (điều kiện 4 ADR-014 6.3)

- Thêm vào thông báo xử lý dữ liệu, Phụ lục A/B thư luật sư (SEC/PO sửa, **nên gửi luật sư cùng đợt** để duyệt một lần).
  - EN: *"We count visits and button taps as daily totals only – no cookies, no IP address, nothing that identifies you."*
  - VI hỗ trợ (CPY biên tập theo giọng thương hiệu).
- Trang `/privacy/` hiện chỉ phát hành khi form bật. Cho tới lúc đó, chân trang thêm một dòng ngắn theo câu trên (UXD/CPY duyệt chữ, Brand Guidelines: EN dẫn – VI hỗ trợ, không emoji).

## 4. Ước công, vai, đích phát hành

Quy tắc phát hành (`release-v1-plan.md` 7.1): v1.0.x chỉ sửa lỗi, nên **không** dùng v1.0.x cho tính năng đo. Landing có kênh phát hành riêng (`landing-v*`, `deploy-landing.sh`), không chạm app Desk.

| Giai đoạn | Việc | Vai | Công (ngày agent) | Đích |
|---|---|---|---|---|
| 0 – ngay, không cần quyết | Search Console (DNS TXT), nhận quyền Google Business Profile, đặt link UTM theo 3.3 | INV/OWN (PO nhắc) | 15–30 phút | Ngay |
| 1 – C+ | Từ điển sự kiện + mẫu email tuần + kiểm số 2 tuần đầu | DATA | 0,5 | Bản landing kế tiếp sau ngày chạy Desk (dự kiến tuần 09–13/11) |
| | `data-track` trên nút, module đếm, quan sát mục, GPC, test đơn vị/dist/E2E | FE-LP | 1 | |
| | Route `/e/1/…` 204 + logger không IP + `log_skip` + `check-caddy-landing.sh`; script cộng + cron + xóa log 7 ngày + email | OPS | 1–1,5 | |
| | Câu thông báo + dòng chân trang | SEC/PO (thông báo), CPY/UXD (chữ) | 0,25 | |
| | Review thiết kế đo (5 điều kiện ADR-014 6.3, logger, danh sách cho phép) | **SEC** | 0,25–0,5 | Trước khi FE-LP/OPS gộp |
| | Kiểm thử | QA | 0,5 | |
| 2 – US-158 | Bảng đếm theo ngày trong DB Desk (nhập từ CSV hoặc endpoint `site-events` của ADR-014 6.1); phễu W-08/W-09 trong báo cáo kênh US-100 | ARC, BE, FE, DATA | ~3 | v1.2 (cùng báo cáo) |
| Tùy chọn | Ô nhận ưu đãi trên web (chỉ khi ESC-034 câu 2 = B, sau luật sư) | PO, BE, FE-LP, SEC, CPY | 2–3 | ≥ v1.2 |

Review chéo theo protocol: DATA ← PO, BE. Thêm **SEC bắt buộc** vì đụng dữ liệu người xem, và ARC xác nhận C+ là cách làm tạm của ADR-014 6.1, chưa dùng API.

## 5. Rủi ro (DATA tự nêu – SEC cần review)

| # | Rủi ro | Phương án bị ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R1 | Đo lường bị coi là xử lý dữ liệu cá nhân → cần banner/đồng ý | A (mã phiên), B (chắc chắn) | C+ không có định danh; câu thông báo 3.4; luật sư ánh xạ Luật 91/2025 |
| R2 | Dữ liệu ra nước ngoài, trái ESC-002 A | B | Không chọn B nếu không có quảng cáo trả phí |
| R3 | Nới CSP, phá SEC C-1, mở đường cho script bên thứ ba | B | C+ và A giữ CSP |
| R4 | Ghép lại từng người từ log (thời điểm + IP /24 + đường dẫn) | C (log thô) | Logger `/e/` xóa hẳn IP; log thô ≤ 7 ngày; chỉ giữ tổng theo ngày |
| R5 | Lọt dữ liệu cá nhân vào sự kiện (ngày ở, tên, số điện thoại) | Mọi phương án | Danh sách cho phép đóng; kiểm dist chặn; `form_submit` lấy từ Desk |
| R6 | Thổi số bằng tín hiệu giả, làm đầy log | C+, A | Route chỉ nhận đúng mẫu; không ghi 404; cờ ngày bất thường; xoay vòng log có sẵn |
| R7 | Thêm trang quản trị phải bảo vệ và vá | A | Chặn IP/basic auth; OPS vá theo lịch |
| R8 | Thông báo xử lý dữ liệu không khớp thực tế | B (câu "no cookies" thành sai), C+ (thiếu câu đếm) | Sửa trước khi gửi luật sư (3.4) |
| R9 | Hiểu sai số: "lượt xem" bị đọc thành "số khách" | Mọi phương án | Email tuần ghi rõ "lượt", không "người"; `direct` = không rõ nguồn |

## 6. Giả định

- [GIẢ ĐỊNH] Lượng truy cập 100–400 lượt/ngày (ADR-014 mục 8) – chưa có số thật. C+ vẫn đủ nếu gấp 10 lần.
- [GIẢ ĐỊNH] Phiên bản Caddy trong ảnh `caddy:2-alpine` hỗ trợ `log_skip` và logger riêng theo đường dẫn – OPS kiểm. Nếu không hỗ trợ, cách thay: ghi `/e/` qua một site nội bộ riêng.
- [GIẢ ĐỊNH] Cách Umami tính mã phiên (mục 2.1) theo hiểu biết của DATA, chưa đọc mã đúng phiên bản – SEC kiểm nếu INV chọn A.
- [GIẢ ĐỊNH] Hộp thư nhận email tuần là hộp thư chung trên tên miền OTTIMO (không gửi hộp thư cá nhân).
