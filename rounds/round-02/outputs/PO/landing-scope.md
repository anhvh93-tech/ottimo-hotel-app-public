# Phạm vi Landing page ottimo.vn (EP19) – PO

- Người viết: PO | Round 2 (sau Sprint 3, trước Sprint 4) | Ngày: 17/10/2026 (cập nhật Sprint 4 – FB-INV-002) | Trạng thái: **ORC đã xếp lịch P1 (17/10); INV quyết ESC-020 L1–L6 = A hết; FB-INV-002 (17/10) thêm đặt phòng trên website → US-155 vào LP-v1; **INV chọn ESC-020 L7 = A (17/10)** – xem mục 0 và 0.10**
- Đầu vào: `04-investor-feedback/FB-INV-001.md`; tin nhắn INV 17/10 (landing + Zalo OA); `00-brief/investor-brief.md`; `product/docs/PRD.md` (M13, M15, A6); `03-backlog/backlog.md` (EP18, US-034/040/108/116/126/138); `product/docs/integrations.md` (I7, NotificationAdapter); `product/docs/hosting-plan.md` 5.1; `02-escalations/ESC-010.md`; `product/design/design-system.md`, `content-guide.md`; `00-brief/context/landing/README.md`; `rounds/round-02/plan.md` mục 4; `rounds/round-02/s4-carryover.md`.
- Đầu ra: backlog **EP19** (US-146…US-160, có AC) · `02-escalations/ESC-020.md` · dòng ESC-020 trong `escalations-index.md` · file này.
- Đầu vào thêm ở lần cập nhật Sprint 4: `04-investor-feedback/FB-INV-002.md`; `rounds/round-02/sprint-4-plan.md` (mục 4.2, 9.1, 11.3, 12); `product/docs/adr/ADR-014-landing-site.md` (4.3–4.6); `rounds/round-02/reviews/landing-zalo-SEC.md` (C-2, C-3, ARC-02…ARC-12, SR-RL-11); `product/docs/business-rules.md` BR-112, BR-811; `02-escalations/ESC-001.md` (LZ-2, LZ-8).

> **Cập nhật 17/10 tối (PO gộp UXD, ARC, INT, DOM, SEC) – thay các điểm cũ bên dưới khi lệch:**
> - **Brand Guidelines v1.0** (INV 17/10) thắng design system cũ và e-brochure: landing **không dùng terracotta**; giọng văn tiếng Anh dẫn dắt; khách thấy tên phòng (The Pine … The Ember), không số căn. RL6 và giả định nhận diện ở mục 5, 12 hết hiệu lực.
> - **Ảnh đã nhận:** 45 ảnh (mặt tiền + sảnh 6; Phòng 1–5: 7/6/10/9/7) ở `00-brief/context/landing/raw/` (ngoài git). **E-brochure đã đọc** (`ebrochure-text.md`): 4 hạng phòng (Studio thành phố, Studio vườn, Premium 1PN+1, Signature 2PN), tiện nghi, địa chỉ, khoảng cách, hotline/Zalo, WhatsApp/Telegram/Viber. US-147 nay hiện 4 hạng phòng; còn chờ INV bảng ghép tên phòng ↔ số căn ↔ hạng ↔ thư mục ảnh.
> - **ESC-020** nay có 6 câu phụ L1–L6 (L6 = ảnh); L2-A thêm WhatsApp/Telegram/Viber; điều kiện SEC C-1 là điều kiện cổng LP-v1.
> - **ARC (ADR-014):** app riêng `product/apps/landing-web` (Astro, tĩnh), chạy trên VPS production, 0 đ thêm – trả lời câu hỏi nội bộ mục 6.
> - **Zalo OA (mục 9):** trình ở **ESC-021**; khoảng trống "nhắc trước ngày đến" đã thành **US-162** (Must R3), danh sách gửi tay **US-161** (Must R3).
> - **Lịch (mục 7.2) – ORC đã chọn P1 (17/10, `decision-log.md` dòng ORC "ORC chọn lịch landing P1"):** chạy song song Sprint 4 – tuần 1 UXD làm lại concept/mock theo Brand Guidelines + 45 ảnh thật + nội dung e-brochure; tuần 2 một luồng FE riêng dựng v1. Cổng riêng **LP-v1**, không tính vào cổng QC Round 2. ORC được tạm dừng luồng FE landing nếu Sprint 4 trễ việc sửa lỗi sai tiền (BUG-R2-055…061). Lên mạng khi có tên miền + VPS, bảng ghép phòng và INV duyệt nội dung.
> - **Pháp lý:** câu banner đồng ý (LZ-1), form yêu cầu đặt phòng v2 (LZ-2) và thông báo website TMĐT với Bộ Công Thương (LZ-8) đã vào ESC-001. Trang quyền riêng tư cho v1: SEC trả lời "nên có", không chặn LP-v1 (`reviews/landing-zalo-SEC.md` mục 6). Form v2 (US-155) chưa bật khi chưa có trả lời LZ-2, LZ-8.

---

## 0. Cập nhật 17/10 (Sprint 4) theo góp ý INV trên bản mẫu v1.1 – `04-investor-feedback/FB-INV-002.md`
> Mục 0 **thắng** các mục bên dưới khi lệch. Backlog EP19 và ESC-020 (câu L7, mục "Góp ý 17/10 đội tự làm") đã cập nhật cùng lúc.

### 0.1 Thay đổi phạm vi
| Ý INV | Thay đổi | Story / AC | Vai |
|---|---|---|---|
| 1. Không nhắc số phòng | Bỏ mọi số lượng phòng (chữ, tiêu đề tìm kiếm, ảnh chia sẻ link, dữ liệu có cấu trúc, e-brochure đăng kèm); không liệt kê đủ bộ tên phòng trong một khối; không hiện số phòng còn trống | US-147 AC6, US-146 AC1 | UXD (v1.2), FE-LP, QA quét chuỗi |
| 2. Boutique stay, không "căn hộ dịch vụ"; hai nhóm khách đều hài lòng | Định vị boutique stay + danh sách chuỗi cấm; trang bị kiểu căn hộ viết thành điểm cộng cho khách ngắn ngày; lối "Ở dài ngày" viết riêng cho khách dài ngày; UXR kiểm 5 giây | US-146 AC5, AC6; US-147 AC3 (chữ) | UXD viết, DOM soát, UXR kiểm, INV duyệt (L5) |
| 3. Đặt phòng trực tiếp: fanpage → website → Desk, nguồn website | **US-155 Should R3 → Must "R2 – LP-v1"**, AC theo **ESC-020 L7-A**; mức A/B/C chờ INV (L7) | US-155 AC1–AC11; US-151 AC3, AC5; US-149 AC5 | ARC, BA, DOM, SEC, BE-D, FE-LP, FE-B, UXD, QA |
| 4. Zalo OA là kênh chính; kênh khác để chỗ phụ; link Facebook | Thanh cố định chỉ "Đặt phòng" + "Chat Zalo"; WhatsApp/Telegram/Viber trong "Kênh khác"; Zalo đứng đầu cả bản EN; link fanpage, không plugin | US-146 AC2; US-151 AC1, AC7, AC8; US-153 AC8 | UXD, FE-LP |
| 5. Bố cục rối, chưa mượt | Bản mẫu v1.2: ít phần hơn, một mạch đọc, nhiều khoảng trắng; INV duyệt bố cục **trước** khi FE-LP dựng | US-146 AC7 | UXD, UXR, PO |

- Phạm vi luồng LP-v1 nay: **10 story – 8 Must, 2 Should** (9 story cũ + US-155). Tổng backlog vẫn 163, Must R2 vẫn 71.
- Vẫn **không** có ở LP-v1: phòng trống, giá theo ngày (US-131 – L7-B); thanh toán online (US-132 – L7-C); widget chat, pixel, plugin Facebook; link sang OTA; ô nhận ưu đãi; tiếng Nga.
- Gợi ý thứ tự nội dung cho v1.2 (PO gợi ý theo hành trình khách; UXD quyết bố cục): Màn đầu (boutique stay, "Đặt phòng") → Vì sao OTTIMO (dịch vụ kiểu khách sạn + không gian như ở nhà) → Hạng phòng → Ở dài ngày → Tiện nghi và vị trí → Chính sách + câu hỏi (gộp một phần) → Liên hệ (Zalo, kênh khác, Facebook) → chân trang.

### 0.2 Đặt phòng trên website theo L7-A *(INV chọn A 17/10 – nhãn giả định đã gỡ)*
- Luồng: nút "Đặt ngay" trên fanpage (link gắn nhãn `facebook`) hoặc nút "Đặt phòng" trên web → form → hàng chờ "Yêu cầu từ website" trong Desk ("Website · Facebook") → sale/lễ tân nhận → nhắn Zalo → báo giá (US-080) → giữ chỗ (US-084) → cọc QR → đơn `direct`, nguồn `website` (BR-112).
- Không: phòng trống, giá, tự giữ phòng, thanh toán online, tự gửi tin tới liên hệ khách nhập.
- Đường lên: L7-B = US-155 AC9 + US-131 (R3); L7-C = US-132 (R4+). Cùng hàng chờ Desk, cùng nguồn.
- Công tắc cấu hình: form **tắt trên mạng** tới khi đủ điều kiện ở 0.4; khi tắt, "Đặt phòng" mở chat Zalo như trước.
- Cách hiểu "đặt phòng trên fanpage" `[GIẢ ĐỊNH – INV xác nhận cùng bản mẫu v1.2.1, landing-inv-questions Q1]`: nút của fanpage trỏ về mục `#book` của website (link có UTM – DOM 6.3); **không** dùng tính năng đặt lịch của Facebook (dữ liệu nằm ở Meta, không về Desk, trái ESC-002).

### 0.3 Ước lượng (ngày-người, ước tính của PO – các vai xác nhận khi nhận việc)
**US-155 (đặt phòng trên website):**

| Vai | Việc | Ngày-người |
|---|---|--:|
| ARC | Thêm operation công khai + Desk (hàng chờ, chuyển đơn) vào `openapi.yaml` theo kiểu bổ sung; bảng vào `erd.md`; sửa ADR-014 (nấc L1 vào LP-v1; trả lời thẻ SEC ARC-02…ARC-12); sửa ghi chú landing trong `openapi-0.3.7.md` | 0,75–1 |
| BA | Máy trạng thái của yêu cầu website; màn + hành động trong `rbac-matrix` (**cùng commit** với ARC, nếu không `--strict` đỏ ở kiểm RBAC); đặc tả trường | 0,5 |
| DOM | Mặc định tham số (ngưỡng "Cần chú ý", thời gian hứa phản hồi, hạn tự đóng trong biên SEC); soát chữ định vị | 0,25–0,5 |
| SEC | Khung thông báo xử lý dữ liệu VI/EN (luật sư duyệt – ESC-001); review PR; kiểm C-2, C-3, ARC-02…ARC-12 | 1–1,5 |
| **BE-D** | Bảng + migration; endpoint công khai (mã form, gửi yêu cầu, kiểm đầu vào, ô bẫy, giới hạn trong DB, trần cơ sở trả "bận"); job hạn xóa (C-2); endpoint Desk (danh sách theo phạm vi vai, nhận/đóng/spam/mở lại, chuyển thành lead/báo giá); thông báo + SSE + "Cần chú ý"; test (hợp đồng, RLS, đồng hồ giả, phản hồi giống hệt cho liên hệ cũ/mới) | 3,25–4 |
| **FE-LP** | Form VI/EN trong landing (đang gửi, bận, lỗi, thành công; giữ dữ liệu; bàn phím), trang cảm ơn, công tắc bật/tắt, phần form trong trang quyền riêng tư, nhãn nguồn lấy từ link | 1,5–2 |
| **FE-B** | Hàng chờ "Yêu cầu từ website" trong Desk: danh sách + chi tiết, nhận/đóng/spam/mở lại, "Chuyển thành báo giá" mở hộp báo giá điền sẵn, huy hiệu + "Cần chú ý" + SSE | 1,5–2 |
| UXD | Màn form, trang cảm ơn, hàng chờ Desk; chữ VI/EN | 1–1,5 |
| QA | TC cho 11 AC của US-155 (viết sớm, gắn `[BLOCKED …]` khi chưa có mã); chạy: E2E website → Desk → báo giá, chống spam, không dò liên hệ, hạn xóa bằng đồng hồ giả, phân quyền, trạng thái lỗi | 1,75–2,25 |
| PO + QC | Nghiệm thu AC, chấm mốc "form" của cổng LP-v1 | 0,5 |
| **Tổng US-155** | | **≈ 12–16** (phần dựng BE-D + FE-LP + FE-B ≈ 6,25–8) |

Cao hơn mức cũ ở mục 7.1 (5,5–8) vì nay gồm điều kiện SEC đặt ngày 17/10 (chống spam theo tầng, hạn xóa mọi trạng thái, thông báo có phiên bản, bộ đếm trong DB, không dò liên hệ) và màn hàng chờ trong Desk.

**Làm lại nội dung, bố cục theo ý 1, 2, 4, 5 (ngoài US-155):** UXD v1.2 1,5–2,5 · DOM soát chữ 0,25 · UXR kiểm 5 giây 0,5 · QA quét chuỗi cấm 0,25 → **≈ 2,5–3,5**. FE-LP không tốn thêm nếu dựng **sau** khi INV duyệt v1.2 (US-146 AC7); nếu đã dựng theo v1.1 thì phần làm lại ≈ 1–2 [ước tính của PO].

### 0.4 Phụ thuộc và điều kiện bật form trên mạng (US-155 AC4)
- **Pháp lý (ESC-001):**
  - **LZ-8** – website có chức năng đặt phòng có phải thông báo với Bộ Công Thương không. Form **chỉ bật trên production** khi luật sư xác nhận không phải thông báo, hoặc OTTIMO đã thông báo. Trang có thể cần hiện tên doanh nghiệp, mã số thuế ở chân trang (đang chừa chỗ, chờ ESC-008) [Chưa xác minh – luật sư].
  - **LZ-2** – yêu cầu đặt phòng có cần ô đồng ý riêng không. Tới khi có trả lời: giữ ô đồng ý không tích sẵn (SEC ARC-05).
  - ESC-001 đang ghi form là "v2, Round 3" → ORC/SEC sửa câu cho luật sư thành "form ở luồng LP-v1" và xếp hỏi sớm. *(Đã sửa 17/10: LZ-2 mốc LP-v1, LZ-8 theo Luật TMĐT 2025 + NĐ 248/2026, thêm LZ-9.)*
- **Bảo mật:** SEC-G1 (a) + SEC-G2 (Desk chạy thật, được nhận dữ liệu khách thật); **C-2**, **C-3** (điều kiện chặn); các thẻ Major ARC-02, ARC-05 và Minor ARC-04, ARC-06…ARC-12 đóng trước khi bật.
- **Hạ tầng:** VPS + tên miền (INV hẹn 19/10); bản thử có chặn truy cập (SEC ARC-10), không chỉ `noindex`.
- **Hợp đồng API:** operation mới thêm **sau** đóng băng D1 → ARC thêm dạng bổ sung (không sửa operation có sẵn), báo BE/FE/QA trong ngày; không tính là lệch hợp đồng ở cổng QC Sprint 4 (luồng riêng).
- **INV:** ~~chọn L7~~ (đã chọn A 17/10); xác nhận cách hiểu "fanpage" (cùng bản mẫu v1.2.1); tự đặt nút "Đặt ngay" trên fanpage trỏ tới link `#book` đội gửi **khi trang lên mạng** (không cần chờ form – ESC-020 mục "Việc anh/chị tự làm cho fanpage").

### 0.5 Ảnh hưởng năng lực Sprint 4 (so với `sprint-4-plan.md` mục 12.1) – việc sửa lỗi tiền luôn đi trước
| Luồng | Hiện tại (plan 12.1) | Thêm | Cách xếp (PO đề xuất, ORC chốt) |
|---|---|---|---|
| **BE-D** | ≈ 7,25 / 10 (gồm làm quen mã) → dư ≈ 2,75; là **luồng nhận việc** khi trễ mốc (4.2) | 3,25–4 | Chỉ bắt đầu **sau mốc D5** nếu không phải nhận việc chuyển. Trong Sprint 4 làm phần nhận yêu cầu (bảng, endpoint công khai, chống spam, hạn xóa ≈ 2–2,5). Phần Desk (≈ 1,25–1,5) sang **tuần Ổn định**. Trễ D3/D5 mà BE-D nhận việc chuyển → toàn bộ phần BE của US-155 sang tuần Ổn định |
| **FE-B** | ≈ 9,0 sau khi cắt Should (≈ 11 nếu làm cả Should) – đã sát | 1,5–2 | Chỉ làm **sau mọi việc CỔNG** của FE-B → thực tế ở **tuần Ổn định**; dựng trên MSW theo hợp đồng nếu BE-D chưa xong |
| **FE-LP** | v1 4–6 (tuần 2) | 1,5–2 | Làm sau phần trang; dựng bố cục mới chỉ sau khi INV duyệt v1.2. Vượt tuần 2 → tuần Ổn định |
| UXD | ≈ 9,5 (landing ≈ 3,0 ở mức NÊN) | v1.2 1,5–2,5 + form/hàng chờ 1–1,5 | Vượt ≈ 2–3,5: landing chỉ làm sau việc CỔNG của UXD; **v1.2 trước** (để INV duyệt bố cục), màn form/hàng chờ sau; phần dư sang tuần Ổn định |
| QA | ≈ 9,75 sau các bước cắt QA | 1,75–2,25 | Viết TC sớm (≈ 0,5, gắn `[BLOCKED …]`) để giữ truy vết; chạy ở tuần Ổn định cùng T11 LP-v1 |
| ARC · SEC · BA · DOM | đủ | 0,75–1 · 1–1,5 · 0,5 · 0,25–0,5 | Trong Sprint 4, sau việc CỔNG của từng vai |

- **Kết luận:** US-155 **không** vừa Sprint 4 nếu giữ nguyên việc tiền. PO đề xuất: mã + kiểm thử trên bản thử xong ở **tuần Ổn định R2**; bật trên mạng khi đủ 0.4 (dự kiến **đầu Round 3**, vì cần Desk chạy thật và trả lời của luật sư). Trang giới thiệu (mốc "trang") lên mạng theo lịch cũ, chỉ lùi theo thời gian INV duyệt v1.2.
- **Không** lấy giờ của BE-A, BE-B, BE-C, FE-A; không làm chậm mốc D3, D5, D7, D8.
- **Thứ tự cắt** (đề nghị ORC thêm vào `sprint-4-plan.md` 12.3): US-155 và phần làm lại v1.2 đứng ở **bước 4** cùng FE-LP – trễ mốc D3/D5/D7 thì dừng cả US-155 (BE-D, FE-B, FE-LP, chạy TC), BE-D quay về nhận việc chuyển (4.2).

### 0.6 Cổng LP-v1 – hai mốc (thay mục 8 khi lệch)
- **Mốc "trang"** (đưa trang giới thiệu lên mạng): đủ 7 điều kiện ở mục 8 + AC mới US-146 AC5–AC7, US-147 AC6, US-151 AC7–AC8; form **tắt** trên mạng; `gen_traceability.py --strict --strict-track LP-v1` exit 0 – nghĩa là mọi AC Must của luồng, **gồm US-155**, đã có TC (TC của US-155 được gắn `[BLOCKED …]` khi chưa có mã).
- **Mốc "form"** (bật form trên mạng): US-155 AC1–AC11 đạt trên bản thử (QA, không lỗi P0/P1); review bắt buộc ARC + SEC cho phần BE, UXD + QA cho phần FE; SEC xác nhận C-2, C-3 và SEC-G1/G2; luật sư trả lời LZ-8, LZ-2; trang quyền riêng tư có phần form; INV đã chọn L7 (**A – 17/10**); SEC xác nhận C-1…C-13 (`reviews/landing-booking-SEC.md` mục 1); QC chấm mốc form ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN. ~~Sau khi bật, INV đặt nút "Đặt ngay" trên fanpage.~~ *(17/10: INV đặt nút khi trang lên mạng – link `#book` sống cả khi form tắt.)* Lịch đã ORC duyệt: `sprint-4-plan.md` mục 16.

### 0.7 Rủi ro mới
| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| RL10 | Zalo đứng đầu cả bản EN, khách nước ngoài chưa có Zalo | Mất khách nước ngoài | Lối phụ ngay dưới nút Zalo: "Gửi yêu cầu đặt phòng" (khi form bật) hoặc "Kênh khác" (US-151 AC7); đo theo kênh ở US-158 |
| RL11 | Form làm xong nhưng chưa bật được vì pháp lý (LZ-8) và Desk chưa chạy thật | INV thấy "làm rồi mà chưa dùng được" | Nói rõ trong ESC-020 L7; INV xem form trên bản thử; bật bằng công tắc, không chờ dựng lại |
| RL12 | US-155 kéo sức của Sprint 4 | Trễ việc tiền, lùi cổng D8 | BE-D chỉ sau D5, FE-B sau CỔNG, bước cắt 4 (0.5) |
| RL13 | Người lạ gửi yêu cầu bằng SĐT người khác, spam | Rác trong Desk, làm phiền người khác | Không tự gửi tin, không tự gộp hồ sơ, giới hạn + trần "bận" (SEC ARC-02, ARC-04; US-155 AC2, AC3, AC5) |
| RL14 | Thêm operation sau đóng băng mà thiếu hành động trong `rbac-matrix` | `--strict` đỏ, chặn CI | ARC + BA cùng commit; chạy `--strict` trước commit |
| RL15 | Chữ vẫn bị hiểu là căn hộ dịch vụ (có bếp, ở theo tháng) | Lệch định vị INV muốn | Chuỗi cấm + kiểm 5 giây (US-146 AC5, AC6); DOM soát; INV duyệt (L5) |

### 0.8 Quyết định PO và giả định (ORC ghi decision-log khi commit)
| Loại | Nội dung |
|---|---|
| PO quyết (quyền ưu tiên backlog) | US-155 Should R3 → **Must "R2 – LP-v1"**; cổng LP-v1 hai mốc ("trang" / "form"); US-155 ở bước cắt 4 cùng FE-LP; BE-D làm US-155 chỉ sau D5; FE-B sau việc CỔNG; mục tiêu mã xong ở tuần Ổn định, bật trên mạng khi đủ 0.4 |
| ~~`[GIẢ ĐỊNH – chờ INV xác nhận ý 3]`~~ **INV quyết 17/10** | Mức L7-A: yêu cầu đặt phòng, không phòng trống/giá, không thanh toán online (US-155 AC7, AC9) – INV chọn A (FB-INV-002 "Xác nhận của INV") |
| `[GIẢ ĐỊNH – INV xác nhận cùng bản mẫu v1.2.1]` | "Đặt phòng trên fanpage" = nút "Đặt ngay" của fanpage trỏ về mục `#book` của website (link có UTM, DOM 6.3); không dùng tính năng đặt lịch của Facebook (SEC quyết 17/10 – `landing-booking-SEC.md` mục 6) |
| `[GIẢ ĐỊNH – INV duyệt ở L5]` | Thời gian hứa phản hồi "trong 1 giờ, 07:00–22:00; ngoài giờ trước **09:00** sáng hôm sau" (US-155 AC7) – DOM đã chốt tham số ở BR-912 (4) (8:00 → 09:00) |
| `[GIẢ ĐỊNH]` | Danh sách chuỗi cấm (US-146 AC5), ngưỡng kiểm 5 giây ≥ 4/5 (US-146 AC6), "không nhắc số phòng" gồm cả đếm gián tiếp (US-147 AC6) – INV xác nhận khi duyệt nội dung (L5) |
| ~~`[GIẢ ĐỊNH]`~~ **DOM xác nhận (BR-112, BR-911 v0.3.7)** | "Website · Facebook" là nhãn của nguồn phụ trên yêu cầu; nguồn đơn luôn `website`, BR-112 không thêm nguồn |

### 0.9 Việc tiếp theo
| Ai | Việc | Khi |
|---|---|---|
| ORC | ~~Trình ESC-020 L7 cho INV~~ (INV chọn A 17/10); cập nhật `sprint-4-plan.md` *(PO đã soạn mục 16 "Thay đổi sau đóng băng" 17/10 – ORC duyệt)* (1.4 bỏ dòng "US-155 – R3"; 9.1; 11.3 hai mốc; 12.1; 12.3 bước 4); ghi decision-log (0.8); giao việc theo 0.3 | 17–18/10 |
| ARC | Operation US-155 vào `openapi.yaml` (bổ sung sau đóng băng), `erd.md`; sửa ADR-014 (L1 vào LP-v1, trả lời thẻ SEC); sửa ghi chú landing trong `openapi-0.3.7.md` | Sprint 4, sau việc CỔNG |
| BA | Máy trạng thái yêu cầu website, `rbac-matrix` – cùng commit với ARC | Cùng ARC |
| SEC | Khung thông báo xử lý dữ liệu VI/EN; đề nghị ORC sửa LZ-2, LZ-8 trong ESC-001 thành "form ở luồng LP-v1" | Sprint 4 |
| DOM | Tham số mặc định (0.8); soát chữ định vị; xác nhận nhãn "Website · Facebook" với BR-112 | Sprint 4 |
| UXD | Bản mẫu v1.2 (ý 1, 2, 4, 5) → PO + UXR review → INV duyệt bố cục; rồi màn form, cảm ơn, hàng chờ Desk | Sau việc CỔNG của UXD |
| UXR | Kiểm 5 giây (US-146 AC6) trên v1.2 | Trước khi INV duyệt nội dung |
| QA | TC luồng LP-v1 gồm US-155 (gắn `[BLOCKED …]`) trước mốc "trang"; chạy TC US-155 ở tuần Ổn định | Theo 0.5 |
| PO | Review v1.2; sửa AC khi INV trả lời L7; cập nhật PRD M15 (landing + đặt phòng trên website) | Khi có trả lời |

### 0.10 Cập nhật 17/10 – sau khi INV chọn L7 = A (Phản hồi & sửa sau workflow landing)
- ESC-020 L7 = **A – Đã quyết 17/10**; thêm nhược điểm L7-B (SEC ARC-18) và mục "Việc anh/chị tự làm cho fanpage" (tên người dùng, 2 lớp, bài ghim, nút "Đặt ngay" về `#book` có UTM). `escalations-index.md` cập nhật.
- ESC-001: LZ-8 theo Luật TMĐT 122/2025/QH15 + NĐ 248/2026 (form thuộc LP-v1); LZ-2 mốc LP-v1; LZ-7 thêm Telegram, Viber, nhà cung cấp email; LZ-1 câu phụ trẻ em theo nhóm tuổi; **LZ-9** tự nhận "khách sạn"/hạng sao (Luật Du lịch 2017).
- Backlog: gỡ nhãn chờ INV (US-155 AC7, AC9…); US-155 AC2 (nguồn luôn `website`), AC7 (BR-912), AC8 (Q-W09); US-151 AC1; US-147 AC6 bỏ chữ "10 căn"; US-146 AC5 `LodgingBusiness`. Trả lời BA Q-W09, Q-W12–14: `outputs/PO/qa-log.md`.
- `sprint-4-plan.md` mục 16 (ORC duyệt): US-155 – BE-D phần nhận yêu cầu Sprint 4 (sau D5), phần Desk + FE-B tuần Ổn định; cổng LP-v1 hai mốc; form chỉ bật production sau SEC C-1…C-13 + luật sư LZ-2/LZ-8; DOM-S4-17 và DOM-S4-11 (2) → R3 Sprint 1; Q-W09 ở mốc "form".
- Câu cần INV xác nhận cùng bản mẫu v1.2.1: `outputs/PO/landing-inv-questions.md`.

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
| Kéo khách về kênh trực tiếp | G3: trực tiếp ≥ 35% doanh thu phòng (hiện ~28%) | Nút "Đặt phòng" dẫn về Zalo/điện thoại/email của OTTIMO, rồi form vào Desk (US-155, nguồn `website`, nhãn "Website · Facebook" khi đi từ fanpage); không dẫn sang OTA |
| Lấp 4–6 căn dài hạn | G2 | Phần "Ở dài ngày" (17/10: thay chữ "Thuê tháng" – FB-INV-002 ý 2) có giá "từ … /tháng" (L3-A); form yêu cầu đặt phòng nhận cả yêu cầu dài ngày (US-155); v2 có trang dài ngày (US-157) |
| Công suất ≥ 80% | G1 | Kênh tìm kiếm + chia sẻ link (US-154) |
| Ấn tượng boutique | Nguyên tắc 5 (giữ nhận diện) | Design System OTTIMO, ảnh thật |

Đo ở v1: lễ tân/sale ghi nguồn đơn trực tiếp theo BR-112 (US-151 AC4). Đo tự động ở v2 (US-158).

## 3. Phạm vi v1 – lên mạng ngay khi có tên miền + máy chủ
**Trong v1** (9 story – 7 Must, 2 Should; **từ 17/10: 10 story – 8 Must, 2 Should, thêm US-155 – mục 0**):

| Story | Phần trang | MoSCoW |
|---|---|---|
| US-146 | Màn đầu: ảnh, câu giới thiệu định vị **boutique stay**, hai lối "Ở ngắn ngày" / "Ở dài ngày", menu, nút "Đặt phòng" luôn hiện; bố cục v1.2 INV duyệt trước khi dựng (FB-INV-002 ý 2, 5) | Must |
| US-147 | Hạng phòng (4 hạng e-brochure ↔ 3 nhóm giá Lầu 1–2 · Căn N · Căn N+): ảnh, sức chứa (BR-110), tiện nghi, giá theo L3; **không nêu số phòng** (FB-INV-002 ý 1) | Must |
| US-148 | Tiện nghi chung; vị trí: địa chỉ, bản đồ, chỉ đường, khoảng cách (cùng nguồn với US-108) | Must |
| US-149 | Tóm tắt chính sách: giờ nhận/trả, cọc, hủy, nội quy + phí phạt, thuê tháng gồm gì (theo BR) | Must |
| US-150 | Câu hỏi thường gặp | Should |
| US-151 | Liên hệ: **Zalo OA trước** (mọi ngôn ngữ), "Kênh khác" (WhatsApp/Telegram/Viber), gọi, email, **fanpage Facebook** (FB-INV-002 ý 4) | Must |
| US-152 | Việt + Anh (RU theo L1) | Must |
| US-153 | Nhận diện OTTIMO, ảnh tối ưu, tốc độ, truy cập, khung giữ chỗ | Must |
| US-154 | Tìm kiếm Google + xem trước khi gửi link Zalo/Facebook | Should |
| US-155 *(từ 17/10)* | Yêu cầu đặt phòng từ website (và nút "Đặt ngay" trên fanpage) → hàng chờ trong Desk, nguồn `website`; theo ESC-020 L7-A (INV chọn A 17/10); form bật trên mạng khi đủ mục 0.4 | Must |

**Không có trong v1:** ~~form và mọi việc thu dữ liệu cá nhân~~ (*từ 17/10: có form US-155, chỉ bật trên mạng khi đủ mục 0.4*); số giá đêm; phòng trống, giá theo ngày, thanh toán; tiếng Nga (nếu L1-A); widget chat nhúng, cookie quảng cáo, pixel mạng xã hội; link sang OTA; blog; đánh giá khách.

*(Lý do dưới đây là của bản 17/10 chiều; INV đã yêu cầu đặt phòng trên website – FB-INV-002 ý 3. Các lo ngại vẫn đúng và nay thành điều kiện bật form – mục 0.4.)* Vì sao v1 không có form: máy chạy thử R2 chỉ chứa dữ liệu giả, chưa được nhận dữ liệu khách thật (ESC-001, SEC-G1). Form gửi qua dịch vụ ngoài thì dữ liệu khách nằm ở bên thứ ba (trái tinh thần ESC-002). Zalo/gọi/email đủ để nhận khách và không cần app chạy thật.

## 4. Phạm vi v2 – Round 3, nối EP18
| Story | Nội dung | MoSCoW · Round |
|---|---|---|
| ~~US-155~~ | ~~Form yêu cầu đặt phòng → hàng chờ trong Desk~~ – **chuyển lên LP-v1 (Must) ngày 17/10 theo FB-INV-002, xem mục 0** | ~~Should · R3~~ |
| US-131 *(EP18, có sẵn)* | Phòng trống + giá thật từ Desk, gửi yêu cầu giữ chỗ – thành đích của nút "Đặt phòng" | Should · R3 |
| US-156 | Tiếng Nga có người bản ngữ duyệt (lên v1 nếu L1-B) | Should · R3 |
| US-157 | Trang "Thuê tháng" + ước tính theo kỳ hạn (khớp US-081) | Could · R3 |
| US-158 | Đếm lượt bấm theo kênh (không cookie quảng cáo) + đơn nguồn `website` trong báo cáo kênh | Should · R3 |
| US-132 *(EP18, có sẵn)* | Đặt và trả tiền ngay trên website | Could · R4+ |
| US-159 | Chủ đầu tư tự sửa giá "từ", ảnh, câu hỏi | Could · R4+ |
| US-160 | Đánh giá khách + gợi ý Đà Lạt (chung nguồn US-117) | Could · R4+ |

Lộ trình nút "Đặt phòng" *(sửa 17/10)*: LP-v1 Zalo/gọi/email, rồi form vào Desk (US-155 – ESC-020 L7-A) khi đủ mục 0.4 → R3 phòng trống + giá thật (US-131 – L7-B) → R4+ đặt và trả tiền ngay (US-132 – L7-C).

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

**v2 (R3, không gồm US-131 – US-131 đã có trong kế hoạch R3):** ~~US-155 ≈ 5,5–8 (BE 2–3, FE 2–3, SEC 0,5–1, QA 1)~~ – *US-155 nay ở LP-v1, ước lượng mới ≈ 12–16 ở mục 0.3*; US-156 ≈ 1–1,5 + người bản ngữ duyệt; US-157 ≈ 2–3; US-158 ≈ 1,25–1,75 → **≈ 10–14 ngày-người**.

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
*(Từ 17/10 cổng LP-v1 có hai mốc "trang" và "form" – mục 0.6. Bảy điều kiện dưới đây là điều kiện của mốc "trang".)*
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
| `[GIẢ ĐỊNH – chờ INV xác nhận]` | AC EP19 theo L1-A, L2-A, L3-A, L4-A, L5-A (ESC-020) – *INV đã quyết A hết 17/10; L2 đổi theo FB-INV-002; giả định mới ở mục 0.8* |
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
