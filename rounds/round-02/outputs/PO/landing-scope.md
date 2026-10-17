# Phạm vi Landing page ottimo.vn (EP19) – PO

- Người viết: PO | Round 2 (sau Sprint 3, trước Sprint 4) | Ngày: 17/10/2026 | Trạng thái: **ORC đã xếp lịch P1 (17/10) – chờ INV trả lời ESC-020 (L1–L6)**
- Đầu vào: `04-investor-feedback/FB-INV-001.md`; tin nhắn INV 17/10 (landing + Zalo OA); `00-brief/investor-brief.md`; `product/docs/PRD.md` (M13, M15, A6); `03-backlog/backlog.md` (EP18, US-034/040/108/116/126/138); `product/docs/integrations.md` (I7, NotificationAdapter); `product/docs/hosting-plan.md` 5.1; `02-escalations/ESC-010.md`; `product/design/design-system.md`, `content-guide.md`; `00-brief/context/landing/README.md`; `rounds/round-02/plan.md` mục 4; `rounds/round-02/s4-carryover.md`.
- Đầu ra: backlog **EP19** (US-146…US-160, có AC) · `02-escalations/ESC-020.md` · dòng ESC-020 trong `escalations-index.md` · file này.

> **Cập nhật 17/10 tối (PO gộp UXD, ARC, INT, DOM, SEC) – thay các điểm cũ bên dưới khi lệch:**
> - **Brand Guidelines v1.0** (INV 17/10) thắng design system cũ và e-brochure: landing **không dùng terracotta**; giọng văn tiếng Anh dẫn dắt; khách thấy tên phòng (The Pine … The Ember), không số căn. RL6 và giả định nhận diện ở mục 5, 12 hết hiệu lực.
> - **Ảnh đã nhận:** 45 ảnh (mặt tiền + sảnh 6; Phòng 1–5: 7/6/10/9/7) ở `00-brief/context/landing/raw/` (ngoài git). **E-brochure đã đọc** (`ebrochure-text.md`): 4 hạng phòng (Studio thành phố, Studio vườn, Premium 1PN+1, Signature 2PN), tiện nghi, địa chỉ, khoảng cách, hotline/Zalo, WhatsApp/Telegram/Viber. US-147 nay hiện 4 hạng phòng; còn chờ INV bảng ghép tên phòng ↔ số căn ↔ hạng ↔ thư mục ảnh.
> - **ESC-020** nay có 6 câu phụ L1–L6 (L6 = ảnh); L2-A thêm WhatsApp/Telegram/Viber; điều kiện SEC C-1 là điều kiện cổng LP-v1.
> - **ARC (ADR-014):** app riêng `product/apps/landing-web` (Astro, tĩnh), chạy trên VPS production, 0 đ thêm – trả lời câu hỏi nội bộ mục 6.
> - **Zalo OA (mục 9):** trình ở **ESC-021**; khoảng trống "nhắc trước ngày đến" đã thành **US-162** (Must R3), danh sách gửi tay **US-161** (Must R3).
> - **Lịch (mục 7.2) – ORC đã chọn P1 (17/10, `decision-log.md` dòng ORC "ORC chọn lịch landing P1"):** chạy song song Sprint 4 – tuần 1 UXD làm lại concept/mock theo Brand Guidelines + 45 ảnh thật + nội dung e-brochure; tuần 2 một luồng FE riêng dựng v1. Cổng riêng **LP-v1**, không tính vào cổng QC Round 2. ORC được tạm dừng luồng FE landing nếu Sprint 4 trễ việc sửa lỗi sai tiền (BUG-R2-055…061). Lên mạng khi có tên miền + VPS, bảng ghép phòng và INV duyệt nội dung.
> - **Pháp lý:** câu banner đồng ý (LZ-1), form yêu cầu đặt phòng v2 (LZ-2) và thông báo website TMĐT với Bộ Công Thương (LZ-8) đã vào ESC-001. Trang quyền riêng tư cho v1: SEC trả lời "nên có", không chặn LP-v1 (`reviews/landing-zalo-SEC.md` mục 6). Form v2 (US-155) chưa bật khi chưa có trả lời LZ-2, LZ-8.

---

## 1. Quyết định và bối cảnh
- **INV quyết 17/10/2026:** đội làm landing page ở tên miền gốc (kiểu ottimo.vn) để khách tìm hiểu OTTIMO và đặt phòng.
- Kế hoạch máy chủ đã chừa tên miền gốc cho website giới thiệu; app ở `desk.`, `staff.`, `g.` (`hosting-plan.md` 5.1, 10.1).
- Trước 17/10, backlog chỉ có EP18 (US-131 Should R3: phòng trống + giá + gửi yêu cầu; US-132 Could R4+: đặt và trả tiền ngay). Phần **trang giới thiệu** chưa có story → nay là EP19.
- Ảnh: Google Drive "OTTIMO BOUTIQUE STAY" – "Mặt tiền + Sảnh" (6 PNG), "Phòng 1"…"Phòng 5" (~7 PNG/thư mục), 4–60 MB/ảnh, ~0,9–1 GB. **Chưa tải** – ORC xin phép INV. Thiết kế dùng khe ảnh có tên + khung giữ chỗ (mục 5).
- E-brochure `OTTIMO_Ebrochure_16x9_Terracotta_C1_SlowLiving.pdf`: **chưa đọc được**. Tên gợi ý tông "Terracotta – Slow Living" [Chưa xác minh].

## 2. Mục tiêu sản phẩm của landing
| Mục tiêu | Liên hệ PRD | Landing đóng góp |
|---|---|---|
| Kéo khách về kênh trực tiếp | G3: trực tiếp ≥ 35% doanh thu phòng (hiện ~28%) | Nút "Đặt phòng" dẫn về Zalo/điện thoại/email của OTTIMO, không dẫn sang OTA |
| Lấp 4–6 căn dài hạn | G2 | Phần "Thuê tháng" có giá "từ" (L3-A); v2 có trang thuê tháng (US-157) |
| Công suất ≥ 80% | G1 | Kênh tìm kiếm + chia sẻ link (US-154) |
| Ấn tượng boutique | Nguyên tắc 5 (giữ nhận diện) | Design System OTTIMO, ảnh thật |

Đo ở v1: lễ tân/sale ghi nguồn đơn trực tiếp theo BR-112 (US-151 AC4). Đo tự động ở v2 (US-158).

## 3. Phạm vi v1 – lên mạng ngay khi có tên miền + máy chủ
**Trong v1** (9 story – 7 Must, 2 Should):

| Story | Phần trang | MoSCoW |
|---|---|---|
| US-146 | Màn đầu: ảnh, câu giới thiệu, hai lối "Ở ngắn ngày" / "Thuê tháng", menu, nút "Đặt phòng" luôn hiện | Must |
| US-147 | 10 căn theo 3 nhóm (Lầu 1–2 · Căn N · Căn N+): ảnh, sức chứa (BR-110), tiện nghi, giá theo L3 | Must |
| US-148 | Tiện nghi chung; vị trí: địa chỉ, bản đồ, chỉ đường, khoảng cách (cùng nguồn với US-108) | Must |
| US-149 | Tóm tắt chính sách: giờ nhận/trả, cọc, hủy, nội quy + phí phạt, thuê tháng gồm gì (theo BR) | Must |
| US-150 | Câu hỏi thường gặp | Should |
| US-151 | Liên hệ + "Đặt phòng": chat Zalo OA, gọi, email (L2-A) | Must |
| US-152 | Việt + Anh (RU theo L1) | Must |
| US-153 | Nhận diện OTTIMO, ảnh tối ưu, tốc độ, truy cập, khung giữ chỗ | Must |
| US-154 | Tìm kiếm Google + xem trước khi gửi link Zalo/Facebook | Should |

**Không có trong v1:** form và mọi việc thu dữ liệu cá nhân; số giá đêm; phòng trống, giá theo ngày, thanh toán; tiếng Nga (nếu L1-A); widget chat nhúng, cookie quảng cáo, pixel mạng xã hội; link sang OTA; blog; đánh giá khách.

Vì sao v1 không có form: máy chạy thử R2 chỉ chứa dữ liệu giả, chưa được nhận dữ liệu khách thật (ESC-001, SEC-G1). Form gửi qua dịch vụ ngoài thì dữ liệu khách nằm ở bên thứ ba (trái tinh thần ESC-002). Zalo/gọi/email đủ để nhận khách và không cần app chạy thật.

## 4. Phạm vi v2 – Round 3, nối EP18
| Story | Nội dung | MoSCoW · Round |
|---|---|---|
| US-155 | Form yêu cầu đặt phòng → hàng chờ "Yêu cầu từ website" trong Desk → báo giá/giữ chỗ (US-080/084), nguồn `website` | Should · R3 (trước hoặc cùng US-131) |
| US-131 *(EP18, có sẵn)* | Phòng trống + giá thật từ Desk, gửi yêu cầu giữ chỗ – thành đích của nút "Đặt phòng" | Should · R3 |
| US-156 | Tiếng Nga có người bản ngữ duyệt (lên v1 nếu L1-B) | Should · R3 |
| US-157 | Trang "Thuê tháng" + ước tính theo kỳ hạn (khớp US-081) | Could · R3 |
| US-158 | Đếm lượt bấm theo kênh (không cookie quảng cáo) + đơn nguồn `website` trong báo cáo kênh | Should · R3 |
| US-132 *(EP18, có sẵn)* | Đặt và trả tiền ngay trên website | Could · R4+ |
| US-159 | Chủ đầu tư tự sửa giá "từ", ảnh, câu hỏi | Could · R4+ |
| US-160 | Đánh giá khách + gợi ý Đà Lạt (chung nguồn US-117) | Could · R4+ |

Lộ trình nút "Đặt phòng": v1 Zalo/gọi/email → v2a form vào Desk (US-155) → v2b phòng trống + giá thật (US-131) → R4+ đặt và trả tiền ngay (US-132).

## 5. Sơ đồ trang và khe ảnh
**Thứ tự phần (một trang dài, mỗi phần có neo):** Màn đầu → Giới thiệu ngắn (ngắn ngày / thuê tháng) → Căn theo nhóm → Tiện nghi → Vị trí → Chính sách → Câu hỏi → Liên hệ → Chân trang (địa chỉ, liên hệ, ngôn ngữ, e-brochure nếu INV cho đăng). Bản EN cùng cấu trúc.

| Khe ảnh | Dùng ở | Tỉ lệ | Số ảnh | Lấy từ thư mục Drive | Ghi chú |
|---|---|---|--:|---|---|
| `hero` | Màn đầu | 16:9 máy tính; cắt riêng 4:5 cho điện thoại | 1 | Mặt tiền + Sảnh | Ảnh sáng, rõ mặt tiền; **bắt buộc có ảnh thật trước khi lên mạng** |
| `about-1`, `about-2` | Giới thiệu | 3:2 | 2 | Mặt tiền + Sảnh | |
| `common-1` … `common-3` | Tiện nghi chung | 3:2 | 3 | Mặt tiền + Sảnh | |
| `group-l12-cover`, `group-n-cover`, `group-nplus-cover` | Thẻ nhóm căn | 4:3 | 3 | Phòng 1…5 (sau khi INV ghép, ESC-020 L5 mục 2) | **Bắt buộc ảnh thật trước khi lên mạng** |
| `room-<n>-01` … `room-<n>-07` (n = 1…5) | Thư viện ảnh từng nhóm | Giữ tỉ lệ gốc khi xem lớn; ô nhỏ 4:3 | ~35 | Phòng n | Thư viện được phép thiếu ảnh (khung giữ chỗ) |
| `location` | Vị trí | 16:9 | 1 | Chưa có ảnh | Ảnh khu phố hoặc ảnh tĩnh bản đồ – UXD đề xuất |
| `og-share-vi`, `og-share-en` | Xem trước khi gửi link | 1,91:1 | 2 | Cắt từ `hero` + chữ | US-154 |
| `logo` | Đầu/chân trang, ảnh chia sẻ | Vector | 1 | INV gửi (L5 mục 5) | Chưa có: chữ "OTTIMO" font Lora (ESC-012 L-A) |

Quy tắc khung giữ chỗ (US-147 AC5, US-153 AC5): đúng tỉ lệ khe; nền và chữ theo token Design System; nhãn "Ảnh đang cập nhật" / "Photo coming soon"; **không** dùng ảnh mẫu hay ảnh không phải của OTTIMO.

Quy tắc ảnh: chỉ bản đã tối ưu, nhiều cỡ, vào git; ảnh gốc ở `00-brief/context/landing/raw/` (ngoài git). UXD loại ảnh có mặt người nhận ra được (khách, nhân viên) nếu chưa có đồng ý của họ.

Nhận diện: giữ Design System OTTIMO (kem – gỗ sồi, Lora + Be Vietnam Pro) `[GIẢ ĐỊNH]`. Đọc được e-brochure mà tông terracotta là màu chính → UXD đề xuất dùng làm màu nhấn phụ, đo lại tương phản. Đổi nhận diện chính là việc INV quyết (protocol mục 8) → khi đó mới mở ESC.

## 6. Phụ thuộc
**Từ INV** (ESC-020 + việc ORC xin riêng):
- Quyền tải ảnh (~0,9–1 GB) và e-brochure từ Drive – **ORC hỏi**.
- L2: Zalo OA đã xác thực chưa, tên OA; điện thoại, email (WhatsApp) công khai.
- L4: tên miền đã mua (INV đang mua – `pending-for-INV.md` 17/10).
- L5: duyệt nội dung VI/EN; địa chỉ + ghim bản đồ; ghép "Phòng 1…5" với nhóm căn; tiện nghi từng nhóm; dùng tên căn hay không; logo vector; có đăng e-brochure không.
- L1, L3: ngôn ngữ, cách hiện giá.

**Trong đội** (ARC/OPS/SEC/DOM – không hỏi INV):
- ARC: một app công khai dùng chung cho landing + booking (`apps/booking-web`, ADR-004 mục 3) hay tách `landing-web` (README tư liệu đang ghi `product/apps/landing-web/`); công nghệ trang tĩnh (ADR-004 hoãn tới R3 – nay cần sớm); nơi chạy trong ngân sách hiện có; một nguồn cho địa chỉ (US-108/US-148) và giá "từ" (US-147 AC4).
- OPS: bản ghi DNS tên miền gốc, deploy, TLS, header, `noindex` cho bản xem thử.
- SEC: danh sách bên thứ ba được phép (Zalo, bản đồ); v1 có cần trang chính sách quyền riêng tư khi không thu dữ liệu không [Chưa xác minh – có thể gộp câu hỏi luật sư ESC-001].
- DOM: khách xem website rồi nhắn Zalo tính nguồn `website` hay `zalo_phone` (BR-112).

## 7. Xếp lịch và ước lượng
### 7.1 Ước lượng (ngày-người, ước tính của PO – các vai xác nhận khi nhận việc)
**v1 (9 story):**

| Vai | Việc | Ngày-người |
|---|---|--:|
| UXD | Sơ đồ trang + wireframe; hi-fi điện thoại + máy tính; nội dung nháp VI/EN; chọn, cắt, tối ưu ảnh theo khe | 3–5 |
| FE (luồng riêng) | Trang tĩnh 8 phần, VI/EN, 3 cỡ màn, thư viện ảnh, khung giữ chỗ, ảnh nhiều cỡ, SEO/xem trước link, truy cập | 4–6 |
| ARC | ADR ngắn (mục 6) | 0,5 |
| OPS | DNS gốc, deploy, TLS, header, bản xem thử | 0,5–1 |
| SEC | Rà bên thứ ba, header, xác nhận không thu dữ liệu | 0,5 |
| UXR + PO | Review hi-fi; PO nghiệm thu AC và nội dung | 1–1,5 |
| QA | Ca kiểm (3 cỡ màn × 2 ngôn ngữ, link Zalo/gọi/email, truy cập, tốc độ) + chạy | 1–1,5 |
| QC | Cổng rút gọn "LP-v1" | 0,25–0,5 |
| **Tổng v1** | | **≈ 11–16 ngày-người · ≈ 2 tuần lịch** (chưa tính thời gian chờ INV gửi ảnh, nội dung) |

**v2 (R3, không gồm US-131 – US-131 đã có trong kế hoạch R3):** US-155 ≈ 5,5–8 (BE 2–3, FE 2–3, SEC 0,5–1, QA 1); US-156 ≈ 1–1,5 + người bản ngữ duyệt; US-157 ≈ 2–3; US-158 ≈ 1,25–1,75 → **≈ 10–14 ngày-người**.

### 7.2 Phương án xếp lịch
| | P1 – Song song Sprint 4 (**PO đề xuất – ORC đã chọn 17/10**) | P2 – Dời hết sang đầu R3 |
|---|---|---|
| Cách làm | Tuần 1 Sprint 4: UXD thiết kế + nội dung (hi-fi Sprint 4 H19–H24 đã giao). Tuần 2: một **luồng FE riêng** (FE-LP) dựng trang. Review/QA/QC rút gọn riêng. Lên mạng khi đủ cổng mục 8 | Làm cùng US-131 ở đầu R3, một lần ra website v1 + v2 |
| Ưu | INV có website sớm, đúng lúc đang mua tên miền; trang tĩnh, không đụng code Desk, không BE, rủi ro kỹ thuật thấp | Sprint 4 dồn hết sức cho lỗi sai tiền (S4-01…S4-08, S4-25…S4-35) |
| Nhược | Thêm tải review/QA/ORC trong Sprint 4; cần thêm một agent FE; vẫn phụ thuộc INV gửi ảnh/nội dung | INV chờ thêm khoảng một tháng [ước tính]; tên miền gốc bỏ trống |

Rào chắn cho P1 (ORC chốt 17/10; rào 3 áp cho việc sửa lỗi sai tiền BUG-R2-055…061):
1. Không rút người của FE Desk, BE, MOB; FE-LP chỉ làm trong thư mục app công khai do ARC chọn.
2. Landing **không tính vào cổng QC Sprint 4 / Round 2**; có cổng "LP-v1" riêng.
3. Sprint 4 trễ việc sai tiền → ORC tạm dừng FE-LP, giữ phần UXD (tự rơi về P3: UXD xong ở Sprint 4, FE dựng ở tuần ổn định R2 hoặc đầu R3).
4. Không đổi contract API, không thêm BE cho v1.

## 8. Cổng lên mạng v1 (Definition of Done rút gọn)
1. Tên miền + nơi chạy + TLS + header bảo mật xong (OPS); bản xem thử gắn `noindex`.
2. INV đã duyệt nội dung VI/EN (L5) và gửi thông tin liên hệ (L2).
3. Có ảnh thật cho `hero` và 3 ảnh đại diện nhóm căn; thư viện được thiếu ảnh.
4. Review bắt buộc: UXR + PO (hi-fi UXD); UXD + QA (bản dựng FE); ARC (ADR); SEC (bên thứ ba). Không còn thẻ Blocker/Major mở.
5. QA: mọi AC Must v1 đạt; không lỗi P0/P1; VI + EN đủ (DoD).
6. QC "LP-v1": ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN.
7. INV xem bản xem thử và đồng ý cho đăng công khai.

## 9. Zalo OA chăm sóc khách – liên quan nhưng **không** thuộc landing
INV hỏi thêm: gửi link check-in online, nhắc ngày nhận phòng, gửi vị trí, kênh tương tác qua Zalo OA. Việc này thay đổi **ESC-010** (INV chọn B 16/10: Zalo ZNS để sau MVP, R2–R3 gửi tay) → ORC/INT trình riêng. Đối chiếu nhanh với backlog:

| Ý INV | R2 hiện nay | Story đã có | Ghi chú PO |
|---|---|---|---|
| Gửi link check-in online | Lễ tân sao chép link (GuestLinkPanel), dán vào Zalo/OTA | US-106; US-125 (mẫu tin, Must R3); US-126 (tự gửi Zalo OA/ZNS/email, Should R3) | Tự gửi qua Zalo cần đổi ESC-010 |
| Nhắc ngày nhận phòng | Chưa có | **Chưa có story** | Khoảng trống: "nhắc trước ngày đến" (kèm link check-in + vị trí). PO viết story khi ORC giao |
| Gửi vị trí | Trang khách `g.` có địa chỉ + chỉ đường (US-108) | US-108; US-148 (landing, cùng nguồn) | – |
| Nhắc trả phòng, gửi bill, cảm ơn/đánh giá, trả phòng nhanh | Gửi tay | US-034, US-040, US-116, US-138 (Should R3) | Cùng kênh gửi với US-126 |
| Kênh tương tác 2 chiều | Zalo cá nhân/nhóm chat | I7 Zalo OA (R3) | Landing chỉ cần **link mở chat OA** (US-151); không cần ZNS |

Gợi ý cho ORC: khách bấm "Zalo" trên landing thường sẽ "quan tâm" OA → về sau OTTIMO nhắn được qua OA. Quy định nhắn chủ động của Zalo OA [Chưa xác minh – INT kiểm khi làm lại ESC-010].

## 10. Rủi ro
| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| RL1 | INV chậm gửi ảnh, nội dung, liên hệ | Chưa lên mạng | Khung giữ chỗ, bản xem thử, L5-A (đội viết nháp) |
| RL2 | Thêm tải review/QA giữa lúc Sprint 4 sửa lỗi tiền | Ảnh hưởng cổng QC R2 | Luồng FE riêng; ORC được tạm dừng (mục 7.2) |
| RL3 | Giá/chính sách trên trang lệch Desk | Khách khiếu nại, sai tiền | Một nguồn, checklist phát hành (US-147 AC4, US-149 AC2); không ghi số giá đêm (L3-A) |
| RL4 | Điều khoản ngang giá trong hợp đồng OTA [Chưa xác minh] | Bị OTA phạt/hạ hạng | L3-A; INV xem hợp đồng nếu chọn L3-B |
| RL5 | Ảnh gốc ~1 GB | Trang chậm, repo phình | Chỉ bản tối ưu vào git; mục tiêu LCP ≤ 2,5 giây (US-153 AC2) |
| RL6 | Tông "Terracotta" của e-brochure khác Design System [Chưa xác minh] | Nhận diện không thống nhất | Giữ DS; terracotta làm màu nhấn phụ; đổi nhận diện chính → ESC |
| RL7 | Bên thứ ba (bản đồ, Zalo) theo dõi khách khi mở trang | Dữ liệu cá nhân | US-148 AC4; SEC duyệt danh sách |
| RL8 | Hai trang công khai (landing + booking) chồng nhau | Làm hai lần | ARC chốt một app công khai (mục 6) |
| RL9 | Ảnh có mặt khách/nhân viên | Pháp lý hình ảnh cá nhân | UXD loại ảnh chưa có đồng ý |

## 11. Việc tiếp theo
| Ai | Việc | Khi |
|---|---|---|
| ORC | ~~Chọn P1/P2~~ (đã chọn P1, 17/10); giao UXD + FE-LP; ~~xin INV quyền tải ảnh + e-brochure~~ (đã nhận); trình ESC-020; ghi decision-log (mục 12) | 17–18/10 |
| UXD | Sơ đồ trang, wireframe, hi-fi, nội dung nháp VI/EN, bảng khe ảnh | Tuần 1 Sprint 4 (P1) |
| ARC | ADR app công khai (mục 6) | Trước khi FE-LP bắt đầu |
| DOM | Trả lời câu nguồn `website`/`zalo_phone` | Trong Sprint 4 |
| SEC | Danh sách bên thứ ba; câu trang quyền riêng tư | Trước cổng LP-v1 |
| PO | Sửa AC theo trả lời ESC-020; cập nhật PRD (M15 thêm landing v1, A6, mục 6.1 bước "Tìm phòng", mục 10 thêm ESC-020) sau khi INV trả lời; viết story "nhắc trước ngày đến" nếu ORC giao | Khi có trả lời |

## 12. Giả định và quyết định cần ghi decision-log (ORC ghi khi commit)
| Loại | Nội dung |
|---|---|
| PO quyết (quyền ưu tiên backlog) | EP19 tách v1/v2; MoSCoW và round như backlog; v1 không có form, không dẫn sang OTA |
| ORC đã chốt 17/10 | Landing v1 làm song song Sprint 4 (P1), không tính vào cổng QC R2, có cổng LP-v1 riêng (đã ghi `decision-log.md`) |
| `[GIẢ ĐỊNH – chờ INV xác nhận]` | AC EP19 theo L1-A, L2-A, L3-A, L4-A, L5-A (ESC-020) |
| `[GIẢ ĐỊNH]` | Giữ nhận diện kem – gỗ sồi; logo chữ "OTTIMO" (ESC-012 L-A) tới khi có file gốc |
| `[GIẢ ĐỊNH]` | Mục tiêu tốc độ: LCP ≤ 2,5 giây trên 4G (ngưỡng "tốt" của web.dev) |
| `[GIẢ ĐỊNH]` | 5 thư mục "Phòng 1…5" là 5 kiểu phòng đại diện, chưa biết ứng với nhóm nào – chờ INV (L5 mục 2) |

## 13. Nguồn bên ngoài (tra 17/10/2026)
- Ngưỡng LCP "tốt" ≤ 2,5 giây: https://web.dev/articles/lcp
- Open Graph (xem trước link): https://ogp.me
- Dữ liệu có cấu trúc cơ sở lưu trú: https://schema.org/LodgingBusiness
- Phí Zalo OA – gói cơ bản 0 đ, nâng cao 99.000 đ/tháng, Premium 399.000 đ/tháng [Bên thứ ba, 18/11/2025]: https://viettelstore.vn/tin-tuc/zalo-oa-co-mat-phi-khong
- OA cần xác thực trước khi dùng dịch vụ Zalo [Bên thứ ba]: https://www.infobip.com/docs/zalo/get-started.md
- Widget chat Zalo (tài liệu chính thức, trang không đọc được nội dung khi tra – chi tiết [Chưa xác minh]): https://developers.zalo.me/docs/social/zalo-chat-widget
- Điều khoản ngang giá OTA (châu Âu, Hồng Kông; Việt Nam [Chưa xác minh]): https://skift.com/2025/06/05/hotels-escalate-long-running-battle-against-booking-coms-pricing-rules/ ; https://compcomm.hk/sc/enforcement/registers/commitments/files/Final_Commitments_Booking.pdf
