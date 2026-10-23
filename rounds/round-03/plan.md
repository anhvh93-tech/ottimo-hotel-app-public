# Kế hoạch Round 3 – Hoàn thiện, Ổn định & Bản phát hành ứng viên (RC)

> **Cập nhật 23/10/2026 – INV duyệt "đường nhanh v1.0"** (decision-log 23/10). Đích Round 3 đổi từ "RC trên staging với đủ 30 Must R3 + 28 Must hàng chờ" thành **phát hành v1.0 vận hành thật** (lõi R2 + phần bắt buộc của Sprint 1, 5 điều kiện phát hành), dự kiến 02–05/11.
> - Kế hoạch đích, bảng giao việc tới v1.0, danh sách dời v1.1/v1.2/v1.3 và quy trình sau v1.0: **`rounds/round-03/release-v1-plan.md`**. File đó **thay** mục 1, 3, 4.3, 6, 7 dưới đây.
> - Việc INV làm trước ngày chạy: `rounds/round-03/inv-golive-checklist.md`. Kịch bản dùng thử: `product/docs/uat-script.md`. Release notes: `product/docs/release-notes.md`.
> - Còn hiệu lực trong file này: ràng buộc repo công khai và staging (đầu file), mục 2.1a (R-6, chấm lại cổng R2), 4.1 (thứ tự lượt tiền), 4.2 (việc trước dữ liệu thật), mục 8 (rủi ro).

- Người lập: PO (cùng ORC) | Ngày lập: 20/10/2026 | **Trạng thái: CHỐT – 22/10/2026** (PO chốt theo ESC-028 A và trả lời của INV ngày 22/10; ORC duyệt và ghi decision-log khi commit). Đổi kế hoạch sau khi chốt: PO đề xuất, ORC duyệt, ghi decision-log trong ngày.
- Kế hoạch chi tiết Sprint 1: `rounds/round-03/sprint-1-plan.md`.
- Đầu vào:
  - `03-backlog/backlog.md`: 164 story, **30 Must R3**; mục 5.5 hàng chờ R3 có **53 mục: 28 Must, 25 Should** (R3-Q52, Q53 thêm 22/10).
  - `rounds/round-02/qc/s4-qc-gate.md` (mục 6, 7, 10.5 – điều kiện C1–C14) và `rounds/round-02/qc/round-qc-gate.md` (mục 5 R-1…R-6, mục 6 D1–D9).
  - `rounds/round-02/qa/staging-run.md` (R-6), `rounds/round-02/reviews/s4-money-recheck8.md`, `rounds/round-02/reviews/s4-SEC.md` (E.1–E.13), `rounds/round-02/outputs/OPS/s4-env-0076.md`.
  - `01-decisions/decision-log.md` tới 22/10, gồm dòng "INV – trả lời tổng kết Round 2".
  - `02-escalations/ESC-022`…`ESC-028` (đã quyết 22/10), `escalations-index.md`, protocol mục 4 (Round 3).
- **Thương hiệu:** mọi đầu ra R3 cho khách hoặc INV áp Brand Guidelines (`00-brief/context/brand/brand-guidelines.md`). Phạm vi gồm Desk, PWA, trang khách, landing, mẫu tin Zalo/email, bill/phiếu in, release notes, hướng dẫn dùng thử và trang HTML trình INV.
  - Màu: bảng 80/15/5.
  - Chữ: Lora / Be Vietnam Pro / JetBrains Mono.
  - Giọng văn với khách: tiếng Anh dẫn, tiếng Việt hỗ trợ, không emoji.
  - ORC nêu yêu cầu này khi giao việc cho UXD, FE, MOB, INT.
- **Repo công khai.** Không ghi vào `rounds/` hay tài liệu:
  - dữ liệu cá nhân, bí mật, số tài khoản, mật khẩu Wi-Fi;
  - chi tiết an ninh vật lý: cách đặt mã cửa, vị trí thiết bị, thủ tục khôi phục chi tiết.
  - Lỗ hổng Critical/High chưa vá ghi bằng GitHub Security Advisory nháp (SEC E.1, E.6 mục 7).
- **Staging** (desk/staff/g.staging.ottimo.vn) chỉ chứa dữ liệu giả.
  - Không đụng đơn `OTM-00239` (căn 202, 23–25/10) tới khi QA chạy xong A1 phần 3.
  - Không quét VietQR để chuyển tiền thật.

---

## 1. Mục tiêu Round 3

Giao INV **bản phát hành ứng viên (RC)** chạy trên **staging**, đủ an toàn để nhập dữ liệu khách thật, và INV dùng thử được theo kịch bản 10–15 việc. Theo ESC-028 A: **chưa có bản dùng thử khi cổng QC Round 2 chưa đạt**. R3 Sprint 1 chạy phần không phụ thuộc kết quả chấm lại đó.

1. **Tiền đúng trên mọi đường đã có**, kể cả sau nửa đêm.
   - Đóng 3 lỗi tiền còn lại (BUG-R2-208, 209, 210) và các chỗ ngày tính tiền theo ngày lịch (#8–#12), qua một lượt kiểm tiền riêng.
   - Cài cảnh báo cộng dồn miễn giảm theo ESC-026 A.
   - 0 lỗi tiền P0/P1 mở khi vào QC RC.
2. **Đủ điều kiện nhập dữ liệu thật** (cổng "dữ liệu thật", đi cùng ESC-001):
   - việc bảo mật bắt buộc của SEC: BE-65 (kiểm lại), BE-74, BE-75, BE-79, BE-83, BE-84 (a);
   - đăng nhập hai bước (US-143) theo ESC-027 B;
   - hạn lưu `note` yêu cầu khách (R3-Q15);
   - màn tài khoản nhận VietQR cho OWN (R3-Q51);
   - luật sư trả lời ESC-001.
3. **Phân hệ còn lại của MVP**:
   - kênh OTA qua Beds24 (US-095, 096, 099);
   - báo cáo tháng/kênh/FOC + xuất dữ liệu (US-100, 101, 102, 104);
   - dài hạn đủ vòng (US-081, 088, 041, 064, 065, 056, 089, 114);
   - đơn nhóm (US-140), hóa đơn điện tử (US-122), đóng ca (US-124), quyền dữ liệu của khách (US-133, 134).
4. **Khách**:
   - hóa đơn tạm tính trên trang khách (US-111), tiếng Nga (US-115);
   - xác minh nhẹ (US-141), mã cửa 8 số (US-128, R3-Q32);
   - mẫu tin + lịch nhắn khách (US-125, 161, 162);
   - cách gọi căn với khách theo INV 22/10 (R3-Q53).
5. **Website**:
   - form "Yêu cầu đặt phòng" vào Desk (US-155, mốc "form" của LP-v1). Chỉ bật trên mạng khi đủ điều kiện US-155 AC4: luật sư LZ-2, LZ-8; Desk chạy thật; SEC đạt.
   - ảnh đầu trang tự chạy + bộ ảnh theo hạng phòng (R3-Q52, INV 22/10).
6. **Vận hành được**:
   - staging deploy có người duyệt (**đã chạy từ 22/10**);
   - sao lưu + khôi phục diễn tập trên staging, giám sát cơ bản;
   - hướng dẫn vận hành, release notes, kịch bản dùng thử (`product/docs/release-notes.md`, `product/docs/uat-script.md`).

**Không phải mục tiêu R3:** các mục dưới đây vào R4+, trừ khi dư năng lực (mục 3.4).
- Thanh toán online qua cổng VNPay/MoMo (US-121, Should).
- Xem phòng trống + giá trên website (US-131, L7-B).
- F&B/POS đầy đủ.
- Khóa cửa qua API hãng (US-130, Could).

## 2. Điều kiện vào Round 3 và phụ thuộc đầu vào INV

### 2.1 Điều kiện vào (ORC kiểm trước bước Sản xuất)

| # | Điều kiện | Trạng thái 22/10 |
|---|---|---|
| V1 | Cổng QC Sprint 4 lần 3: ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN | **Đạt** – ĐẠT CÓ ĐIỀU KIỆN ngày 21/10 trên `21bb797` (`s4-qc-gate.md`). Điều kiện mang sang R3 = D1–D9 của `round-qc-gate.md` mục 6, đã xếp vào Sprint 1 (`sprint-1-plan.md` mục 7) |
| V2 | QC Round 2 đã ra quyết định; mục chưa đạt có vai và hạn | **Đã ra quyết định, đang chấm lại.** KHÔNG ĐẠT ngày 21/10 chỉ vì chưa có staging. INV chọn ESC-028 A: bắt đầu R3 phần không cần chờ. R-1…R-5 xong; R-6 gần xong. Phần còn lại xem bảng 2.1a |
| V3 | Điều kiện C1 (đóng băng mã tiền) **mở** đúng một lần cho lượt kiểm tiền R3 Sprint 1 (mục 4.1) | **ORC ghi** decision-log khi giao việc Sprint 1 |
| V4 | Giữ thủ tục OPS của BUG-R2-210 tới khi R3-Q21 Closed: không nâng tại chỗ DB/stack cũ; không dựng staging từ dump demo/QA/dev; demo INV chỉ cập nhật bằng `demo-up.sh` (`outputs/OPS/s4-env-0076.md`) | **Giữ.** Staging dựng DB trống, không dùng dump (D2 cổng R2) |
| V5 | C11 (thủ tục trước QC Round 2) | **Đạt.** QC kiểm 21/10: (a)(b)(c)(d)(e) Đạt (`round-qc-gate.md` mục 3) |
| V6 | D4 cổng R2 (C5 cổng S4): SEC đọc PWA snapshot 502/503/504, hạn "trước R3 Sprint 1" | Chưa thấy kết quả → SEC làm ngày đầu Sprint 1, trước khi MOB gộp PR PWA của Sprint 1 |

#### 2.1a Phần còn lại của cổng QC Round 2 (R-6 và chấm lại)

| Việc | Vai | Hạn | Ghi chú |
|---|---|---|---|
| A1 chạy tay phần 2: nhận phòng H13, lưu trú | QA | **23/10 sau 14:00** | Đơn `OTM-00239`. Không ai hủy hoặc sửa đơn này trước khi xong phần 3 |
| A1 chạy tay phần 3: trả phòng 3 bước, VietQR (không quét chuyển tiền thật), PWA dọn → kiểm | QA | **25/10 trước 12:00** | Cùng thư mục bằng chứng ngoài repo |
| Kiểm tên chủ tài khoản thử của VietQR trên staging (SEC E.13, hiệu lực từ 23/10) | SEC | 23/10 | Nhìn trên Desk/QR, không quét chuyển tiền |
| US-135 AC3: kiểm VoiceOver trên staging | QA (UXD hỗ trợ) | 25/10 | Nếu không kịp: PO giữ "Đang nghiệm thu" có lý do, QC xét theo nhóm C |
| PO nghiệm thu bổ sung trên staging sau phần 2 và phần 3 | PO | 23/10, 25/10 | `rounds/round-02/outputs/PO/s4-acceptance.md` R-6 |
| QC chấm lại rút gọn cổng Round 2 | QC | Sau 25/10, trong 3 ngày làm việc (**muộn nhất 28/10**) | Ca cần đồng hồ giả/test-support tính bằng stack CI (QA 22/10). QC quyết có nhận không |
| Tổng kết lại Round 2 và báo INV | ORC | Ngay sau QC | Round 2 đạt thì mở đường cho bản dùng thử cuối R3 |

### 2.2 Đầu vào INV – hiện trạng 22/10

| Đầu vào | Trạng thái | Chặn gì | Hạn cần | Khi chưa có |
|---|---|---|---|---|
| VPS + tên miền | **ĐÃ CÓ.** Nhân Hòa; tên miền ottimo.vn; staging chạy desk/staff/g.staging.ottimo.vn; CI tự deploy, INV bấm duyệt | – | – | – |
| Hỏi Nhân Hòa về 2 bản backup tự động (giữ bao lâu, lưu ở đâu, ai truy cập, xóa khi hủy dịch vụ) | INV đã hẹn hỏi | Dữ liệu thật trên máy này (bản chụp chứa `.env`, khóa, DB) | Trước dữ liệu thật | OPS/SEC đối chiếu `hosting-plan.md` mục 7; chưa có thì không nhập dữ liệu thật |
| Cài đặt GitHub SEC E.6 | **ĐÃ BẬT 22/10**: environment `staging` có người duyệt; CI bắt buộc khi gộp; Dependabot security updates | – | – | – |
| Logo SVG gốc | Chờ INV | Logo trên Desk, landing, bill (S4-49) | Sprint 2 | Giữ chữ "OTTIMO" bằng Lora |
| Wi-Fi (ESC-022) | **ĐÃ QUYẾT B**: một mạng chung "OTTIMO BOUTIQUE STAY"; OWN tự nhập mật khẩu trên app (không vào repo) | – | – | App đã lưu một mạng chung. UXD sửa ví dụ "OTTIMO_103" trong thiết kế |
| Tên phòng ↔ số căn | **INV 22/10: bỏ qua tên phòng, tập trung số phòng** | Cách gọi căn với khách: trang khách, landing, bill, mẫu tin (BR-012) | Sprint 1 (R3-Q53) | Xem giả định G3 ở `sprint-1-plan.md` |
| Zalo OA đã xác thực + ZBS (nạp tiền, duyệt 8 mẫu tin) | Chờ INV | US-126 tự gửi tin (Should); R3-Q40/41 kết nối thật | Sprint 2 (dự trù 2 tuần duyệt mẫu) | US-161/162 nghiệm thu ở chế độ "Tin cần gửi hôm nay" gửi tay |
| Tên công ty + mã số thuế | **ĐÃ CÓ**: CTCP UTMG LIVING, MST trong decision-log 22/10 (thông tin công khai) | – | – | Dùng cho chân trang landing, hóa đơn GTGT, US-122 |
| Tài khoản MISA meInvoice (ESC-010 B) | Chờ INV | US-122 phát hành hóa đơn thật | Sprint 3 | Làm với sandbox MISA; nghiệm thu "đạt trên sandbox" |
| Tài khoản Beds24 (ESC-009 A) | Chờ INV | US-095, 096, 099, R3-Q12 với kênh thật | Đầu Sprint 2 | Làm với sandbox/mock Beds24; RC ghi rõ "chưa nối kênh thật" – ORC báo INV |
| Tên chủ tài khoản nhận cọc | Chờ INV | Câu chống giả danh trên landing (4d) | Trước landing lên mạng | INV tự nhập ngân hàng, số tài khoản, tên chủ tài khoản trên màn R3-Q51 (Sprint 1), không gửi qua chat. Chưa có thì câu 4d để trống tên, landing không lên mạng |
| Luật sư trả lời ESC-001 (LZ-2, LZ-8, LZ-9, hạn lưu giấy tờ) | INV đã hẹn luật sư | Nhập dữ liệu khách thật; bật form website | Trước QC RC | RC chỉ chạy dữ liệu thử; form website tắt trên mạng |
| ESC-023 | **ĐÃ QUYẾT A**: không thu phí khi khách rút ngắn đơn mà vẫn đến ở (khác đề xuất B) | – | – | – |
| ESC-024 | **ĐÃ QUYẾT B**: quá 15 phút không có quản lý trả lời → lễ tân thu đúng số máy tính, không được giảm; quản lý xem lại trong 24 giờ | – | – | – |
| ESC-026 | **ĐÃ QUYẾT A**: vẫn cho miễn theo hạn mức từng khoản; tổng trên lượt vượt hạn mức một lần → báo OWN ngay, xem lại trong 24 giờ | – | – | – |
| ESC-027 | **ĐÃ QUYẾT B**: một tài khoản chủ; đăng nhập hai bước; 10 mã khôi phục cất riêng; thủ tục kỹ thuật có nhật ký | – | – | – |
| ESC-028 | **ĐÃ QUYẾT A**: bắt đầu R3 phần không cần máy chủ; R2 chấm lại sau staging | – | – | – |
| Landing Q1–Q4 (`round-02/round-summary.md` mục 4.6) | Chờ INV duyệt câu chữ | Landing lên mạng | Trước landing lên mạng | Làm theo cột đề xuất của tổng kết R2 |
| Giả định INV xác nhận 22/10 | **ĐÃ XÁC NHẬN**: hạn công nợ 3 ngày; giá đêm thêm theo lịch giá Trực tiếp / giữ giá thỏa thuận; mã cửa 8 số ngẫu nhiên đặt theo ngày lưu trú dự kiến; Premium 302/402 giường phụ 1m4 | – | – | DOM gỡ nhãn giả định trong BR liên quan (Sprint 1) |
| OTM-0108 | Chưa trả lời | – | – | Giữ 05/12 theo giả định |

## 3. Phạm vi

Quy ước:
- **Must** = phải xong trước QC RC.
- **Should** = làm nếu đủ năng lực, dời R4 được. PO quyết trong round, ghi decision-log.

Thứ tự ưu tiên khi thiếu thời gian: tiền và an toàn dữ liệu thật → staging → kênh OTA → báo cáo → dài hạn → khách → phần còn lại.

### 3.1 Hàng chờ R3 (backlog 5.5) – 28 Must

| Nhóm | Mục | Sprint |
|---|---|---|
| **Tiền – lượt kiểm tiền riêng** | R3-Q21 (BUG-R2-210), R3-Q20 (209), R3-Q19 (208 + ARC 16.31), R3-Q22 (SEC-BE-83 + ESC-026 A), R3-Q30 (fuzz công nợ), R3-Q01 (OTTIMO hủy vì lỗi cơ sở), R3-Q02 (có điều kiện), R3-Q10 (minibar HK bắt buộc `periodId`/`roomId`) | 1 |
| **Bảo mật trước dữ liệu thật** | R3-Q17 (BE-65 kiểm lại trên RC, BE-74, BE-75, BE-79), R3-Q22 (BE-83), R3-Q33 (a) (BE-84), R3-Q15 (T13 xóa `note` yêu cầu khách), **R3-Q51 (màn tài khoản nhận VietQR cho OWN, xác thực lại, cảnh báo đổi trong 24 giờ)** | 1 |
| **Quản lý xác nhận từ xa** | R3-Q03 (US-164, ESC-024 B) | 1 |
| **Thông báo / kênh** | R3-Q13 (J4 quá giờ trả phòng – US-031 AC1, K9) ở Sprint 1; R3-Q12 (đồng bộ kênh lỗi – US-012 AC7, US-096) ở Sprint 2 | 1 / 2 |
| **Zalo (điều kiện [CHẶN] của SEC)** | R3-Q42 (token thông báo – US-161 AC5) và R3-Q45 (thông tin bên nhận dữ liệu Zalo/VNG → DRA P11) ở Sprint 1; R3-Q40 (webhook) và R3-Q41 (kết nối OA, token mã hóa) ở Sprint 2; R3-Q43 (tin marketing) ở Sprint 2–3 | 1 / 2 / 2–3 |
| **Báo cáo, website** | R3-Q06 (US-155 phần Desk) ở Sprint 1; R3-Q05 (US-104 xuất dữ liệu) và **R3-Q52 (landing: ảnh đầu trang tự chạy 3 giây + bộ ảnh theo hạng phòng – INV 22/10)** ở Sprint 2 | 1 / 2 |
| **Kiến trúc (Major dời)** | R3-Q26 (đọc chéo bảng + phần còn lại BUG-R2-186), R3-Q27 (`ModuleRef`), R3-Q28 (registration qua cổng đọc) | 1 |
| **Mã cửa 8 số** | R3-Q32 (theo INV 19/10, xác nhận 22/10) | 1 |
| **Cách gọi căn với khách** | **R3-Q53** – PO/DOM/UXD rà BR-012 theo INV 22/10 (bỏ tên phòng, tập trung số phòng) | 1 |

### 3.2 Hàng chờ R3 (backlog 5.5) – 25 Should

R3-Q04, 07, 08, 09, 11, 14, 16, 18, 23, 24, 25, 29, 31, 34, 35, 36, 37, 38, 39, 44, 46, 47, 48, 49, 50.

**Bắt buộc đi cùng lượt kiểm tiền** (dù là Should) vì chạm tiền: R3-Q23 (phần 17/18), R3-Q24, R3-Q29 (BUG-R2-123, điều kiện C1), **R3-Q39 #8–#12** (rà ngày kinh doanh chạm tiền). Cũng đi cùng Sprint 1: R3-Q09 (cùng US-164), R3-Q25 (cùng R3-Q22), R3-Q31 (Dependabot – D5 cổng R2).

Còn lại hạn "trước bản dùng thử cuối R3"; dời R4 thì PO ghi lý do.

### 3.3 Story Must R3 (30) – theo sprint

| Sprint | Story | Phụ thuộc chính |
|---|---|---|
| **1** | US-143 2FA owner/manager (+ AC3 khôi phục theo ESC-027 B) · US-164 xác nhận từ xa (+ AC4 theo ESC-024 B) · US-008 thêm người dùng · US-128 mã cửa (8 số) · US-141 xác minh nhẹ app khách · US-161 lịch tin cần gửi · US-162 mời/nhắc check-in online | SEC SR-AUTH-06 (sửa theo ESC-027 B), SR-AUTH-09, SR-AUTH-11 mới; ARC hợp đồng |
| **2** | US-095 đơn OTA vào Desk (Beds24) · US-096 đẩy phòng trống · US-099 phí kênh thực tế · US-100 báo cáo vận hành tháng · US-101 báo cáo kênh · US-102 báo cáo FOC · US-104 xuất dữ liệu (R3-Q05) · US-111 folio/hóa đơn tạm tính trên trang khách | Tài khoản Beds24; DATA định nghĩa cột; SEC che dữ liệu |
| **3** | US-081 báo giá dài hạn · US-088 hợp đồng + kỳ thu · US-041 trả phòng dài hạn + ký quỹ · US-064 chốt điện nước · US-065 điện nước vào hóa đơn tháng · US-056 lịch dọn cố định (ESC-016) · US-089 hoa hồng CTV/sale (+ PO chốt trừ hoa hồng sau xóa nợ – DOM 18/10 (iii)) · US-114 khách dài hạn xem HĐ · US-140 đơn nhóm · US-122 hóa đơn điện tử MISA · US-115 tiếng Nga · US-125 mẫu tin theo tình huống | MST đã có + tài khoản MISA; người bản ngữ duyệt tiếng Nga [GIẢ ĐỊNH – đội dùng bản dịch, INV kiểm] |
| **4** | US-124 đóng ca / bàn giao ca · US-133 khách yêu cầu dữ liệu cá nhân · US-134 hộp yêu cầu dữ liệu của quản lý | Luật sư ESC-001 (hạn trả lời yêu cầu dữ liệu) |

**US-155** (Must, luồng LP-v1, mốc "form") chia hai phần:
- Sprint 1: phần Desk (R3-Q06).
- Sprint 2: form trên landing. Bật trên mạng theo US-155 AC4.

**AC PO viết thêm khi chốt plan – ĐÃ VIẾT 22/10** trong `03-backlog/backlog.md`, mục 4 (P-S4-20):

| Nguồn | Story nhận AC |
|---|---|
| R3-Q01 | US-021 AC7 (OTTIMO hủy vì lỗi cơ sở) |
| R3-Q03 + ESC-024 B | US-164 AC4 (viết lại), AC8 (xem lại trong 24 giờ) |
| R3-Q12 | US-012 AC7 (viết lại phần đồng bộ kênh) + US-096 AC1–AC3 (mới) |
| R3-Q13 | US-031 AC3 (thông báo chủ động J4 – phần dời của AC1) |
| R3-Q15 | US-109 AC3, US-110 AC4 |
| ESC-026 A | US-007 AC7 |
| ESC-027 B | US-143 AC3 (khôi phục 2 bước), AC4 |

**ESC-023 = A: không thêm AC thu phí.** Rút ngắn đơn trước ngày đến chỉ tính lại tiền phòng, cọc trừ vào các đêm còn lại. Ghi chú đã đặt ở US-024; QA giữ một ca hồi quy "rút ngắn < 7 ngày → phí 0".

### 3.4 Should R3 PO chọn trước (nếu dư năng lực, theo thứ tự)

1. **US-145** bảng dự phòng in sẵn khi mất mạng/mất điện – rủi ro vận hành thật ngày đầu.
2. **US-040** in bill, PDF, gửi email/Zalo – khách cần chứng từ ngay.
3. **US-123** ghi nhận hoàn cọc/hoàn tiền (phần chưa có của BR-522) – khớp sổ.
4. **US-034** nhắc trả phòng tự động; **US-138** khách tự trả phòng sớm buổi sáng.
5. **US-126** tự gửi tin Zalo/email – chỉ khi INV có ZBS + mẫu tin đã duyệt.
6. **US-014** ADR/RevPAR + biểu đồ công suất cho INV.

Các Should R3 khác của backlog (US-051, 059, 063, 067–069, 074–077, 090–093, 097, 098, 103, 113, 116, 121, 127, 129, 131, 156, 158) **mặc định dời R4**; PO xếp lại khi có feedback dùng thử.

### 3.5 Ngoài phạm vi R3

- Thanh toán online qua cổng (US-121).
- Phòng trống + giá trên website (US-131, L7-B/C).
- Khóa cửa qua API (US-130).
- POS F&B.
- Ứng dụng native (chỉ PWA).
- Chương trình thành viên.

Toolchain FE lên bản mới (S4-16) chỉ làm khi SEC phân loại cảnh báo Dependabot (R3-Q31) yêu cầu.

## 4. Thứ tự và phụ thuộc

### 4.1 Sprint 1 – lượt kiểm tiền riêng (điều kiện C1 cổng S4, D1 cổng R2)

Mở đóng băng mã tiền **một lần**, theo đúng thứ tự dưới đây. Nguồn: decision-log 18/10 ORC "xếp lịch 208/209/210". SEC lưu ý: sửa 208 trước 207/210 thì MGR lách được BR-433.

1. **R3-Q21 – BUG-R2-210** (nợ ghi trước 0076) → gộp, CI xanh.
2. **R3-Q20 – BUG-R2-209** (J15 ghi phần chênh, ARC 16.31.2 phương án b).
3. **R3-Q19 – BUG-R2-208** (N-7 theo số, ARC 16.31; **SEC review trước khi gộp**).
   - 209 có thể song song với 208 nếu không cùng tệp.
   - 208 luôn sau 210.
4. **BE-83 (R3-Q22) + ESC-026 A**:
   - xóa nợ và FOC cùng khóa: cộng dồn so hạn mức "mỗi lần";
   - khác khóa trên cùng lượt ở: vẫn cho miễn, tổng vượt hạn mức một lần → báo OWN ngay (US-007 AC7);
   - R3-Q25 đi cùng.
5. **#8–#12 của "Rà ngày kinh doanh" (R3-Q39)**:
   - giá niêm yết `effectiveFrom`, tham số `effectiveFrom`;
   - chặng minibar lúc trả phòng;
   - hạn công nợ (INV xác nhận 3 ngày);
   - gợi ý "đã thực hiện".
6. Đi cùng lượt: R3-Q23 (17/18), R3-Q24, R3-Q29, R3-Q01 (US-021 AC7), R3-Q10, R3-Q02 (nếu điều kiện xảy ra).
   - ESC-023 = A nên **không** có nhánh phí rút ngắn.
   - ESC-024 B (US-164 AC4) chạm số tiền thu, nên thuộc phạm vi kiểm của lượt này.
7. **QA chạy fuzz công nợ (R3-Q30)** trên bản đã có 1–6.
   - Critic độc lập đọc log gốc.
   - Mặc định coi là lỗi tiền P0 tới khi chứng minh được là không.
8. Lượt kiểm tiền đạt (0 lệch, 0 Major) → ORC đóng băng lại mã tiền tới QC RC. Mọi thay đổi tiền sau đó cần ngoại lệ có dòng decision-log.

### 4.2 Sprint 1 – việc bắt buộc trước dữ liệu thật (song song 4.1, khác tệp)

- SEC: **BE-65** (kiểm lại trên RC), **BE-74**, **BE-75**, **BE-79**, **BE-83**, **BE-84 (a)**. Mỗi thẻ SEC ghi Verified trên commit đã gộp.
- **US-143 2FA** owner/manager (ESC-027 B) → **US-164** xác nhận từ xa dùng chung cơ chế (ESC-024 B); R3-Q09 đi cùng.
- **R3-Q51** màn tài khoản nhận VietQR (OWN, xác thực lại, giữ cảnh báo `pay.receiving_account_changed`). Chỉ làm được sau US-143, vì xác thực lại dùng 2FA.
- R3-Q15 hạn lưu `note`.
- R3-Q32 mã cửa 8 số. Không ghi cách đặt mã vào repo.
- R3-Q42 token thông báo (trước US-161 AC5).
- R3-Q45 thông tin bên nhận dữ liệu Zalo/VNG.
- ARC làm trước:
  - hợp đồng US-164, US-143 (khôi phục), R3-Q51, US-155 phần Desk, J4 (R3-Q13), token `purpose=notify` (R3-Q42);
  - `Me.property.businessDate` (R3-Q38) nếu làm.

### 4.3 Sprint 2–4

- **Sprint 2:**
  - ARC chốt hợp đồng Beds24 + outbox J18 trước khi INT/BE-D code → US-095/096/099 + R3-Q12.
  - DATA chốt định nghĩa cột trước BE-D → US-100/101/102/104.
  - FE-B: màn S35 + landing form (US-155).
  - FE-LP: R3-Q52 (ảnh đầu trang, bộ ảnh hạng phòng).
  - INT: R3-Q40/41 khi INV có Zalo OA.
- **Sprint 3:**
  - dài hạn (BE-A/BE-B theo BR-2xx; DOM rà ví dụ);
  - US-140, US-122 (sandbox MISA, MST đã có), US-115 (UXD chuỗi RU), US-125.
- **Sprint 4:**
  - US-124, US-133/134;
  - hiệu năng (QA), kiểm tra bảo mật tổng (SEC);
  - UAT script + release notes (PO), hướng dẫn vận hành (OPS + DOM);
  - diễn tập sao lưu/khôi phục trên staging (OPS).
- **Tuần Ổn định:** chỉ sửa lỗi; QC RC.

### 4.4 Ma trận phụ thuộc chính

| Việc | Cần trước |
|---|---|
| Bản dùng thử cho INV | Cổng QC Round 2 ĐẠT (chấm lại sau R-6, ESC-028 A); QC RC |
| US-164 | US-143; ESC-024 B (đã quyết); BA danh sách đường cần OWN/MGR tại quầy |
| R3-Q51 | US-143 (xác thực lại); ARC hợp đồng; UXD màn theo brand |
| R3-Q19 (208) | R3-Q21 (210), SEC review |
| US-095/096 | Tài khoản Beds24; ARC hợp đồng; J18 outbox |
| US-104 | DATA cột; SEC danh sách che; US-143 (xác thực lại khi xuất) |
| US-122 | MST (đã có) + tài khoản MISA |
| US-155 bật trên mạng | Luật sư LZ-2, LZ-8; staging (đã có); SEC đạt |
| Nhập dữ liệu khách thật | 4.2 xong; luật sư ESC-001; INV có câu trả lời của Nhân Hòa về backup; QC RC |

## 5. Vai nào làm gì (tóm tắt R3 – chi tiết Sprint 1 ở `sprint-1-plan.md` mục 5)

| Vai | Việc chính R3 |
|---|---|
| PO | AC mục 3.3 (đã viết 22/10); nghiệm thu từng sprint; chốt chính sách trừ hoa hồng sau xóa nợ (hỏi INV nếu là chính sách CTV – ESC); release notes, UAT script; R3-Q53 cùng DOM/UXD |
| ARC | Hợp đồng US-143/164, R3-Q51, Beds24/J18, US-155 Desk, J4, 16.31 cho 208/209; review lượt kiểm tiền; R3-Q26–Q28, Q36–Q38 |
| BE-A/B/C/D | Lượt kiểm tiền (A, B); SEC Major (C); báo cáo, xuất, US-155, J4 (D); 2FA + US-164 (A theo Sprint 1) |
| FE-A/B, FE-LP | Desk theo story; R3-Q51; form landing; R3-Q52; `useBusinessDay` tính lại khi qua mốc (R3-Q36) |
| MOB | PWA minibar (R3-Q10), báo hủy việc (R3-Q11), ngày kinh doanh từ server (R3-Q37); trang khách US-111, 115, 141; màn duyệt của quản lý trên điện thoại (US-164) |
| INT | Beds24, MISA sandbox, Zalo OA/ZBS, mã cửa 8 số |
| DOM | Oracle lượt kiểm tiền; BR theo ESC-024 B, ESC-026 A, ESC-023 A; gỡ nhãn giả định INV xác nhận 22/10; BR-012 (R3-Q53); ví dụ dài hạn; hướng dẫn vận hành |
| BA | Đặc tả theo AC mới; rbac cho US-164, US-104, US-155, R3-Q51 |
| UXD | Màn mới theo brand; chuỗi RU; thẻ vai H02 (R3-Q14); logo khi INV gửi; R3-Q52, R3-Q53 |
| SEC | Verified 6 thẻ trước dữ liệu thật; review 208; 2FA + khôi phục (SR-AUTH-06 theo ESC-027 B); kiểm tra bảo mật tổng; R3-Q31 |
| DATA | Định nghĩa cột xuất; dashboard chỉ số; đối chiếu A7 trên dữ liệu R3 |
| QA | Fuzz công nợ; ca giờ đêm (đồng hồ giả); hồi quy; hiệu năng; sổ lỗi; R-6 A1 phần 2–3 |
| OPS | Staging (đã chạy), sao lưu/khôi phục, giám sát; giữ thủ tục 0076; thủ tục khôi phục 2FA bằng lệnh có nhật ký (ESC-027 B) |
| UXR | Đi thử RC theo UAT script (mô phỏng – INV kiểm chứng với người dùng thật; D7 cổng R2) |

## 6. Tiêu chí QC Round 3 (cổng RC)

QC giữ quyền quyết định. Dưới đây là đề xuất của PO để QC dùng khi viết cổng.

**Nhóm cứng (phải đạt):**
1. **Tiền:**
   - lượt kiểm tiền R3 đạt (0 lệch so với oracle, 0 Major);
   - fuzz công nợ R3-Q30: 0 vi phạm bất biến;
   - 0 lỗi tiền P0/P1 mở.
2. **Dữ liệu thật:**
   - SEC Verified BE-65, 74, 75, 79, 83, 84 (a) trên commit RC;
   - 2FA bắt buộc owner/manager chạy trên staging, khôi phục theo ESC-027 B có biên bản diễn tập;
   - R3-Q51 chạy trên staging;
   - 0 Critical/High mở.
3. **Môi trường:**
   - RC chạy trên **staging**;
   - deploy qua environment có người duyệt;
   - sao lưu + khôi phục diễn tập trên staging có biên bản;
   - cổng QC Round 2 đã ĐẠT.
4. **Kiểm tra tự động:**
   - CI push xanh trên commit RC (0 `retry #`);
   - không có lượt T9 đỏ chưa ghi sổ lỗi/chưa phân loại (xem đề xuất ca đồng hồ giả bên dưới);
   - C13: dẫn `gh run list --workflow CI -L 5`.
5. **Sổ lỗi:** 0 P0/P1 Open/Fixed; mọi P2 mở có quyết định dời của PO kèm lý do.
6. **Must:** mọi story Must R3 + 28 Must hàng chờ "Đạt" trên staging, hoặc dời có dòng ORC + báo INV (như K9).

**Nhóm mềm (thiếu ≤ 2 dòng thì ĐẠT CÓ ĐIỀU KIỆN):**
- review chéo Verified đủ;
- axe 0 lỗi nghiêm trọng trên màn mới;
- hiệu năng p95 trong ngưỡng ARC;
- release notes + UAT script + hướng dẫn vận hành có và INV đọc được;
- brand đúng trên mọi đầu ra cho khách.

**Đề xuất cho QC – ca đồng hồ giả thay điều kiện "T9 chạy thật ban đêm":**
- **Vấn đề:** ở Sprint 4, cổng đòi "lượt T9 hằng đêm gần nhất xanh". Mỗi lần sửa phải chờ tới 02:17 đêm sau mới chấm được, và chỉ thử được đúng một giờ trong ngày.
- **Đề xuất:** từ R3, khung giờ đêm được chứng minh bằng **bộ ca đồng hồ giả** chạy trong **mọi** lượt CI push:
  - TC-X-088 (PWA "Các căn" lúc 02:40);
  - TC-L2-109, TC-L2-110;
  - TC-L6-060 (Desk đổi phòng, đặt đơn đêm).
  - Mỗi ca chạy ở 3 mốc 02:40 / 05:59 / 06:00 giờ Đà Lạt.
  - QA bổ sung ca cho mọi màn mới có chọn ngày. Quy tắc: màn có ô ngày hoặc gọi API theo ngày phải có ca đồng hồ giả.
- **T9 hằng đêm vẫn chạy** để giám sát.
  - Lượt T9 đỏ thì QA ghi sổ lỗi trong 24 giờ, kèm phân loại: lỗi sản phẩm hay lỗi ca kiểm (C13).
  - Cổng chỉ đòi "không có lượt T9 đỏ chưa ghi/chưa phân loại", không đòi chờ một lượt đêm xanh mới chấm.
- **Lý do:**
  - lỗi 211/212/213 nay đã có ca đồng hồ giả bắt được (kiểm ngược trên bản cũ đỏ đúng lỗi);
  - ca này phủ nhiều mốc hơn một lượt đêm, lặp lại được và chạy trên mỗi commit.
- **Liên quan staging:** QA 22/10 đã ghi rằng ca đồng hồ giả/test-support không chạy được trên image production. Vì vậy, ở cổng RC, AC giờ đêm được chứng minh bằng ca đồng hồ giả trên stack CI cùng commit với image staging. Phần chạy tay trên staging theo giờ thật bổ sung cho ca đó.
- QC quyết có nhận đề xuất này không. Nếu nhận, ghi vào cổng R3 và decision-log.

## 7. Đầu ra mong đợi cuối R3

- RC trên staging, mã gộp `main`, tag RC.
- `product/docs/release-notes.md`.
- `product/docs/uat-script.md` (10–15 việc, có kịch bản giờ đêm và dài hạn).
- Hướng dẫn vận hành cho lễ tân, buồng phòng, quản lý, chủ đầu tư.
- `rounds/round-03/outputs/<VAI>/report.md` cho mọi vai; reviews/responses theo ma trận; `qa/bug-list.md`; `qc/`.
- `round-summary.md` R3 trình INV: quyết định phát hành RC, danh sách việc dời R4, việc INV cần làm trước khi nhập dữ liệu thật.

## 8. Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Cổng QC Round 2 chấm lại không đạt, hoặc A1 phần 2–3 trượt lịch (đơn `OTM-00239` bị đụng) | Không có bản dùng thử; R3 phải mở lại R2 | Không ai đụng `OTM-00239`; QA giữ lịch 23/10, 25/10. Trượt thì ORC tạo đơn thay theo lịch mới và báo QC |
| Lượt kiểm tiền R3 sinh lỗi cùng lớp (công nợ) | Trễ Sprint 1 | Thứ tự 210 → 209 → 208; fuzz R3-Q30; critic độc lập; tối đa 3 vòng, sau đó PO cắt Should |
| Phạm vi lớn (30 Must + 28 Must hàng chờ + LP-v1) | Không kịp RC | Thứ tự ưu tiên mục 3; Should mặc định dời R4; PO cắt sớm cuối Sprint 2 nếu năng lực < 80% kế hoạch |
| Tài khoản bên thứ ba (Beds24, MISA, ZBS) đến muộn | Story chỉ đạt trên sandbox | Nghiệm thu "đạt trên sandbox"; RC ghi rõ giới hạn; không chặn RC |
| Backup tự động của Nhân Hòa chưa rõ thời hạn/nơi lưu | Không được nhập dữ liệu thật | INV hỏi trước Sprint 3; OPS/SEC đối chiếu `hosting-plan.md` mục 7 |
| Một tài khoản chủ duy nhất mất cả điện thoại lẫn mã khôi phục (ESC-027 B) | Khóa quyền OWN | Thủ tục khôi phục bằng lệnh có nhật ký + email báo INV; OPS diễn tập trên staging; nội dung chi tiết không ghi vào repo công khai |
| Repo công khai làm lộ cách lách kiểm soát nội bộ | Rủi ro người trong | SEC E.1: Major người trong sửa trước dữ liệu thật; Critical/High qua Security Advisory nháp |
