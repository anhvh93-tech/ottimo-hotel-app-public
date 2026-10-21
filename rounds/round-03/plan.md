# Kế hoạch Round 3 – Hoàn thiện, Ổn định & Bản phát hành ứng viên (RC)

- Người lập: PO (cùng ORC) | Ngày: 20/10/2026 | **Trạng thái: NHÁP** – chờ (1) kết quả cổng QC Sprint 4 lần 3 và QC Round 2 **[CHỜ QC]**, (2) INV trả lời ESC-022, 023, 024, 026, 027 và câu landing Q1–Q4 (`rounds/round-02/round-summary.md` mục 4). ORC duyệt và ghi decision-log khi chốt.
- Đầu vào: `03-backlog/backlog.md` (164 story; **30 Must R3**; mục 5.5 hàng chờ R3 – **39 mục: 20 Must, 19 Should**), `rounds/round-02/qc/s4-qc-gate.md` (mục 6, 7, 10.5 – điều kiện C1–C13), `rounds/round-02/reviews/s4-money-recheck8.md`, `rounds/round-02/reviews/s4-SEC.md` (E.1–E.7), `rounds/round-02/outputs/OPS/s4-env-0076.md`, `01-decisions/decision-log.md` 17–20/10, `02-escalations/escalations-index.md`, protocol mục 4 (Round 3).
- Thương hiệu: mọi đầu ra của R3 cho khách hoặc INV (Desk, PWA, trang khách, landing, mẫu tin Zalo/email, bill/phiếu in, release notes, hướng dẫn dùng thử, trang HTML trình INV) áp Brand Guidelines (`00-brief/context/brand/brand-guidelines.md`): bảng màu 80/15/5, Lora / Be Vietnam Pro / JetBrains Mono, giọng văn với khách tiếng Anh dẫn – tiếng Việt hỗ trợ, không emoji. ORC nêu yêu cầu này khi giao việc cho UXD, FE, MOB, INT.
- Repo công khai: không ghi dữ liệu cá nhân, bí mật, số tài khoản, chi tiết an ninh vật lý (cách đặt mã cửa, vị trí thiết bị, thủ tục khôi phục chi tiết) vào `rounds/` hay tài liệu. Lỗ hổng Critical/High chưa vá ghi bằng GitHub Security Advisory nháp (SEC E.1, E.6 mục 7).

---

## 1. Mục tiêu Round 3

Giao INV **bản phát hành ứng viên (RC)** chạy trên **staging**, đủ an toàn để nhập dữ liệu khách thật, và INV dùng thử được theo kịch bản 10–15 việc.

1. **Tiền đúng trên mọi đường đã có**, kể cả sau nửa đêm: đóng 3 lỗi tiền còn lại (BUG-R2-208, 209, 210) và các chỗ ngày tính tiền theo ngày lịch (#8–#12), qua một lượt kiểm tiền riêng; 0 lỗi tiền P0/P1 mở khi vào QC RC.
2. **Đủ điều kiện nhập dữ liệu thật** (cổng "dữ liệu thật" – cùng ESC-001): việc bảo mật bắt buộc SEC BE-65 (kiểm lại), BE-74, BE-75, BE-79, BE-83, BE-84 (a); đăng nhập hai bước (US-143, theo ESC-027); hạn lưu `note` yêu cầu khách (R3-Q15); luật sư trả lời ESC-001.
3. **Phân hệ còn lại của MVP**: kênh OTA qua Beds24 (US-095, 096, 099), báo cáo tháng/kênh/FOC + xuất dữ liệu (US-100, 101, 102, 104), dài hạn đủ vòng (US-081, 088, 041, 064, 065, 056, 089, 114), đơn nhóm (US-140), hóa đơn điện tử (US-122), đóng ca (US-124), quyền dữ liệu của khách (US-133, 134).
4. **Khách**: hóa đơn tạm tính trên trang khách (US-111), tiếng Nga (US-115), xác minh nhẹ (US-141), mã cửa 8 số (US-128, R3-Q32), mẫu tin + lịch nhắn khách (US-125, 161, 162).
5. **Website**: form "Yêu cầu đặt phòng" vào Desk (US-155, mốc "form" của LP-v1) – bật trên mạng chỉ khi đủ điều kiện US-155 AC4 (luật sư LZ-2, LZ-8; Desk chạy thật; SEC đạt).
6. **Vận hành được**: staging deploy có người duyệt, sao lưu + khôi phục diễn tập trên staging, giám sát cơ bản, hướng dẫn vận hành, release notes, kịch bản dùng thử (`product/docs/release-notes.md`, `product/docs/uat-script.md`).

**Không phải mục tiêu R3:** thanh toán online qua cổng (VNPay/MoMo – US-121 Should), xem phòng trống + giá trên website (US-131, L7-B), F&B/POS đầy đủ, khóa cửa qua API hãng (US-130 Could). Các mục này vào R4+ trừ khi dư năng lực (mục 3.4).

## 2. Điều kiện vào Round 3 và phụ thuộc đầu vào INV

### 2.1 Điều kiện vào (ORC kiểm trước bước Sản xuất)

| # | Điều kiện | Trạng thái 20/10 |
|---|---|---|
| V1 | Cổng QC Sprint 4 lần 3: ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN | [CHỜ QC – sau lượt T9 đêm 21/10] |
| V2 | QC Round 2 đã ra quyết định; mục KHÔNG ĐẠT (nếu có) có vai và hạn trong plan này | [CHỜ QC] |
| V3 | Điều kiện C1 (đóng băng mã tiền) **mở** đúng một lần cho lượt kiểm tiền R3 Sprint 1 (mục 4.1) – ORC ghi decision-log | Chờ V1 |
| V4 | Thủ tục OPS của BUG-R2-210 còn giữ tới khi R3-Q21 Closed: không nâng tại chỗ DB/stack cũ; không dựng staging từ dump demo/QA/dev; demo INV chỉ cập nhật bằng `demo-up.sh` (`outputs/OPS/s4-env-0076.md`) | Đang giữ |
| V5 | C11 (thủ tục trước QC Round 2): BE-B/BE-C ghi "Deferred" SEC-BE-74, 75, 79, 83 trỏ R3-Q17/R3-Q22; SEC ghi điều kiện review 208 trong `s4-SEC.md`; ORC điền 16.5 `sprint-4-plan.md`; UXD Verified MOB-S4-05 (a) | [CHỜ QC kiểm] |

### 2.2 Đầu vào INV – chặn gì, nếu chưa có thì làm gì

| Đầu vào | Chặn | Hạn cần | Nếu chưa có |
|---|---|---|---|
| **VPS (Ubuntu LTS, tại Việt Nam) + tên miền** | Staging → **không có RC**; landing lên mạng; QC "chạy trên môi trường thật" | Đầu Sprint 1 (muộn nhất giữa Sprint 2) | Chạy tiếp trên stack tạm/CI; QC RC **KHÔNG ĐẠT** phần môi trường; ORC tạo ESC dời mốc RC |
| Cài đặt GitHub SEC E.6 (staging có người duyệt, CI xanh mới gộp, Dependabot security updates) | E.6 (1) chặn đặt khóa staging | Trước khi đặt khóa staging | Không bật `STAGING_DEPLOY` |
| Logo SVG gốc | Logo trên Desk, landing, bill (S4-49) | Sprint 2 | Giữ chữ "OTTIMO" bằng Lora như hiện nay |
| Bảng tên phòng ↔ số căn ↔ hạng | BR-012 trên trang khách, landing, Wi-Fi (ESC-022) | Sprint 1 | Dữ liệu mẫu giữ tên tạm; không phát hành trang khách cho khách thật |
| Zalo OA đã xác thực + ZBS (nạp tiền, duyệt 8 mẫu tin) | US-126 tự gửi tin (Should); US-161/162 vẫn chạy kiểu "Tin cần gửi hôm nay" gửi tay | Sprint 2 (dự trù 2 tuần duyệt mẫu) | US-161/162 nghiệm thu ở chế độ gửi tay |
| Tên công ty + mã số thuế; tài khoản MISA meInvoice (ESC-010 B) | US-122 hóa đơn điện tử; chân trang landing | Sprint 3 | US-122 làm với sandbox MISA; nghiệm thu "đạt trên sandbox", chặn phát hành hóa đơn thật |
| Tài khoản Beds24 (ESC-009 A) | US-095, 096, 099, R3-Q12 | Đầu Sprint 2 | Làm với sandbox/mock Beds24; RC ghi rõ "chưa nối kênh thật" – ORC báo INV |
| Tên chủ tài khoản nhận cọc | Câu chống giả danh landing (4d); INV tự nhập số tài khoản ở màn Tham số trên staging | Trước landing lên mạng | Câu 4d để trống tên, landing không lên mạng |
| Luật sư trả lời ESC-001 (LZ-2, LZ-8, LZ-9 và hạn lưu giấy tờ) | Nhập dữ liệu khách thật; bật form website | Trước QC RC | RC chỉ chạy dữ liệu thử; form website tắt trên mạng |
| Trả lời ESC-022, 023, 024, 026, 027; landing Q1–Q4 | Xem cột "Nếu chưa quyết" ở `round-02/round-summary.md` mục 4 | Trước Sprint 1 (ESC-023, 024, 026, 027); trước landing lên mạng (Q1–Q4) | Làm theo phương án "nếu chưa quyết" |

## 3. Phạm vi

Quy ước: **Must** = phải xong trước QC RC; **Should** = làm nếu đủ năng lực, dời R4 được (PO quyết trong round, ghi decision-log). Thứ tự khi thiếu thời gian: tiền và an toàn dữ liệu thật → staging → kênh OTA → báo cáo → dài hạn → khách → phần còn lại.

### 3.1 Hàng chờ R3 (backlog 5.5) – 20 Must

| Nhóm | Mục | Sprint |
|---|---|---|
| **Tiền – lượt kiểm tiền riêng** | R3-Q21 (BUG-R2-210), R3-Q20 (209), R3-Q19 (208 + ARC 16.31), R3-Q22 (SEC-BE-83 + ESC-026), R3-Q30 (fuzz công nợ), R3-Q01 (OTTIMO hủy vì lỗi cơ sở), R3-Q02 (có điều kiện), R3-Q10 (minibar HK bắt buộc `periodId`/`roomId`) | 1 |
| **Bảo mật trước dữ liệu thật** | R3-Q17 (BE-65 kiểm lại trên RC, BE-74, BE-75, BE-79), R3-Q22 (BE-83), R3-Q33 (a) (BE-84), R3-Q15 (T13 xóa `note` yêu cầu khách) | 1 |
| **Quản lý xác nhận từ xa** | R3-Q03 (US-164, theo ESC-024) | 1–2 |
| **Thông báo / kênh** | R3-Q13 (J4 quá giờ trả phòng – US-031 AC1, K9), R3-Q12 (đồng bộ kênh lỗi – US-012 AC7, K9) | 1 / 2 |
| **Báo cáo, website** | R3-Q05 (US-104 xuất dữ liệu), R3-Q06 (US-155 phần Desk) | 2 / 1 |
| **Kiến trúc (Major dời)** | R3-Q26 (đọc chéo bảng + phần còn lại BUG-R2-186), R3-Q27 (`ModuleRef`), R3-Q28 (registration qua cổng đọc) | 1 |
| **Mã cửa 8 số** | R3-Q32 (theo INV 19/10) | 1 |

### 3.2 Hàng chờ R3 (backlog 5.5) – 19 Should

R3-Q04, 07, 08, 09, 11, 14, 16, 18, 23, 24, 25, 29, 31, 34, 35, 36, 37, 38, 39. Trong đó **bắt buộc đi cùng lượt kiểm tiền** (dù là Should) vì chạm tiền: R3-Q23 (phần 17/18), R3-Q24, R3-Q29 (BUG-R2-123, điều kiện C1), **R3-Q39 #8–#12** (rà ngày kinh doanh chạm tiền). Còn lại hạn "trước bản dùng thử cuối R3"; dời R4 thì PO ghi lý do.

### 3.3 Story Must R3 (30) – theo sprint

| Sprint | Story | Phụ thuộc chính |
|---|---|---|
| **1** | US-143 2FA owner/manager (+ AC khôi phục theo ESC-027) · US-164 xác nhận từ xa · US-008 thêm người dùng · US-128 mã cửa (8 số) · US-141 xác minh nhẹ app khách · US-161 lịch tin cần gửi · US-162 mời/nhắc check-in online | ESC-024, ESC-027; SEC SR-AUTH-06 |
| **2** | US-095 đơn OTA vào Desk (Beds24) · US-096 đẩy phòng trống · US-099 phí kênh thực tế · US-100 báo cáo vận hành tháng · US-101 báo cáo kênh · US-102 báo cáo FOC · US-104 xuất dữ liệu (R3-Q05) · US-111 folio/hóa đơn tạm tính trên trang khách | Tài khoản Beds24; DATA định nghĩa cột; SEC che dữ liệu |
| **3** | US-081 báo giá dài hạn · US-088 hợp đồng + kỳ thu · US-041 trả phòng dài hạn + ký quỹ · US-064 chốt điện nước · US-065 điện nước vào hóa đơn tháng · US-056 lịch dọn cố định (ESC-016) · US-089 hoa hồng CTV/sale (+ PO chốt trừ hoa hồng sau xóa nợ – DOM 18/10 (iii)) · US-114 khách dài hạn xem HĐ · US-140 đơn nhóm · US-122 hóa đơn điện tử MISA · US-115 tiếng Nga · US-125 mẫu tin theo tình huống | MST + MISA; người bản ngữ duyệt tiếng Nga [GIẢ ĐỊNH – đội dùng bản dịch, INV kiểm] |
| **4** | US-124 đóng ca / bàn giao ca · US-133 khách yêu cầu dữ liệu cá nhân · US-134 hộp yêu cầu dữ liệu của quản lý | Luật sư ESC-001 (hạn trả lời yêu cầu dữ liệu) |

Cùng **US-155** (Must, luồng LP-v1, mốc "form") – Sprint 1 phần Desk (R3-Q06), Sprint 2 form trên landing; bật trên mạng theo US-155 AC4.

**AC PO viết thêm khi chốt plan** (P-S4-20, việc của PO trước bước Sản xuất): R3-Q01 → US-021; R3-Q03 → US-164 AC (nhánh hết hạn theo ESC-024); R3-Q12 → US-012 AC7, US-096; R3-Q13 → US-031 AC1; R3-Q15 → US-109/110; ESC-023 (nếu B/C) → US-024 hoặc US-021; ESC-026 (nếu A/B) → US-007; ESC-027 → US-143 AC3 (khôi phục).

### 3.4 Should R3 PO chọn trước (nếu dư năng lực, theo thứ tự)

1. **US-145** bảng dự phòng in sẵn khi mất mạng/mất điện – rủi ro vận hành thật ngày đầu.
2. **US-040** in bill, PDF, gửi email/Zalo – khách cần chứng từ ngay.
3. **US-123** ghi nhận hoàn cọc/hoàn tiền (phần chưa có của BR-522) – khớp sổ.
4. **US-034** nhắc trả phòng tự động; **US-138** khách tự trả phòng sớm buổi sáng.
5. **US-126** tự gửi tin Zalo/email – chỉ khi INV có ZBS + mẫu tin đã duyệt.
6. **US-014** ADR/RevPAR + biểu đồ công suất cho INV.

Các Should R3 khác của backlog (US-051, 059, 063, 067–069, 074–077, 090–093, 097, 098, 103, 113, 116, 121, 127, 129, 131, 156, 158) **mặc định dời R4**; PO xếp lại khi có feedback dùng thử.

### 3.5 Ngoài phạm vi R3

Thanh toán online qua cổng (US-121), phòng trống + giá trên website (US-131, L7-B/C), khóa cửa qua API (US-130), POS F&B, ứng dụng native (chỉ PWA), chương trình thành viên. Toolchain FE lên bản mới (S4-16) chỉ làm khi SEC phân loại cảnh báo Dependabot (R3-Q31) yêu cầu.

## 4. Thứ tự và phụ thuộc

### 4.1 Sprint 1 – lượt kiểm tiền riêng (điều kiện C1 cổng S4)

Mở đóng băng mã tiền **một lần**, theo đúng thứ tự (decision-log 18/10 ORC "xếp lịch 208/209/210"; SEC: sửa 208 trước 207/210 thì MGR lách được BR-433):

1. **R3-Q21 – BUG-R2-210** (nợ ghi trước 0076) → gộp, CI xanh.
2. **R3-Q20 – BUG-R2-209** (J15 ghi phần chênh, ARC 16.31.2 phương án b).
3. **R3-Q19 – BUG-R2-208** (N-7 theo số, ARC 16.31; **SEC review trước khi gộp**). 209 có thể song song với 208 nếu không cùng tệp; 208 luôn sau 210.
4. **BE-83 (R3-Q22) + ESC-026** (cộng dồn xóa nợ / FOC; khác khóa theo lựa chọn INV).
5. **#8–#12 của "Rà ngày kinh doanh" (R3-Q39)**: giá niêm yết `effectiveFrom`, tham số `effectiveFrom`, chặng minibar lúc trả phòng, hạn công nợ, gợi ý "đã thực hiện".
6. Đi cùng lượt: R3-Q23 (17/18), R3-Q24, R3-Q29, R3-Q01, R3-Q10; ESC-023 nếu INV chọn B/C.
7. **QA chạy fuzz công nợ (R3-Q30)** trên bản đã có 1–6; critic độc lập đọc log gốc; mặc định lỗi tiền P0 tới khi chứng minh.
8. Lượt kiểm tiền đạt (0 lệch, 0 Major) → ORC đóng băng lại mã tiền tới QC RC; mọi thay đổi tiền sau đó cần ngoại lệ có dòng decision-log.

### 4.2 Sprint 1 – việc bắt buộc trước dữ liệu thật (song song 4.1, khác tệp)

- SEC: **BE-65** (kiểm lại trên RC), **BE-74**, **BE-75**, **BE-79**, **BE-83**, **BE-84 (a)** – mỗi thẻ SEC ghi Verified trên commit đã gộp.
- **US-143 2FA** owner/manager (theo ESC-027) → **US-164** xác nhận từ xa dùng chung cơ chế; R3-Q09 đi cùng.
- R3-Q15 hạn lưu `note`; R3-Q32 mã cửa 8 số (không ghi cách đặt mã vào repo).
- ARC trước: hợp đồng US-164, US-155 phần Desk, `Me.property.businessDate` (R3-Q38) nếu làm.

### 4.3 Sprint 2–4

- **Sprint 2:** ARC chốt hợp đồng Beds24 + outbox J18 trước khi INT/BE-D code → US-095/096/099 + R3-Q12; DATA chốt định nghĩa cột trước BE-D → US-100/101/102/104; FE-B màn S35 + landing form (US-155).
- **Sprint 3:** dài hạn (BE-A/BE-B theo BR-2xx; DOM rà ví dụ), US-140, US-122 (sandbox), US-115 (UXD chuỗi RU), US-125.
- **Sprint 4:** US-124, US-133/134; hiệu năng (QA), kiểm tra bảo mật tổng (SEC), UAT script + release notes (PO), hướng dẫn vận hành (OPS + DOM), diễn tập sao lưu/khôi phục trên staging (OPS).
- **Tuần Ổn định:** chỉ sửa lỗi; QC RC.

### 4.4 Ma trận phụ thuộc chính

| Việc | Cần trước |
|---|---|
| Staging (RC) | VPS + tên miền; SEC E.6 (1); OPS dựng DB trống (không dump) |
| US-164 | US-143; ESC-024 |
| R3-Q19 (208) | R3-Q21 (210), SEC review |
| US-095/096 | Tài khoản Beds24; ARC hợp đồng; J18 outbox |
| US-104 | DATA cột; SEC danh sách che; US-143 (xác thực lại khi xuất) |
| US-122 | MST + MISA |
| US-155 bật trên mạng | Luật sư LZ-2, LZ-8; staging; SEC đạt |
| Nhập dữ liệu khách thật | 4.2 xong; luật sư ESC-001; QC RC |

## 5. Vai nào làm gì (tóm tắt)

| Vai | Việc chính R3 |
|---|---|
| PO | Viết AC mục 3.3; nghiệm thu từng sprint; chốt chính sách trừ hoa hồng sau xóa nợ (hỏi INV nếu là chính sách CTV – ESC); release notes, UAT script |
| ARC | Hợp đồng US-164, Beds24/J18, US-155 Desk, 16.31 cho 208/209; review lượt kiểm tiền; R3-Q26–Q28, Q36–Q38 |
| BE-A/B/C/D | Lượt kiểm tiền (A, B); SEC Major (C); báo cáo, xuất, US-155, J4 (D) |
| FE-A/B, FE-LP | Desk theo story; form landing; `useBusinessDay` tính lại khi qua mốc (R3-Q36) |
| MOB | PWA minibar (R3-Q10), báo hủy việc (R3-Q11), ngày kinh doanh từ server (R3-Q37); trang khách US-111, 115, 141 |
| INT | Beds24, MISA sandbox, Zalo OA/ZBS, mã cửa 8 số |
| DOM | Oracle lượt kiểm tiền; BR theo ESC-023/024/026; ví dụ dài hạn; hướng dẫn vận hành |
| BA | Đặc tả theo AC mới; rbac cho US-164, US-104, US-155 |
| UXD | Màn mới theo brand; chuỗi RU; thẻ vai H02 (R3-Q14); logo khi INV gửi |
| SEC | Verified 6 thẻ trước dữ liệu thật; review 208; 2FA; kiểm tra bảo mật tổng; R3-Q31 |
| DATA | Định nghĩa cột xuất; dashboard chỉ số; đối chiếu A7 trên dữ liệu R3 |
| QA | Fuzz công nợ; ca giờ đêm; hồi quy; hiệu năng; sổ lỗi |
| OPS | Staging, deploy có người duyệt, sao lưu/khôi phục, giám sát; giữ thủ tục 0076 |
| UXR | Đi thử RC theo UAT script (mô phỏng – INV kiểm chứng với người dùng thật) |

## 6. Tiêu chí QC Round 3 (cổng RC)

QC giữ quyền quyết định; dưới đây là đề xuất của PO để QC dùng khi viết cổng.

**Nhóm cứng (phải đạt):**
1. **Tiền:** lượt kiểm tiền R3 đạt (0 lệch so với oracle, 0 Major); fuzz công nợ R3-Q30 0 vi phạm bất biến; 0 lỗi tiền P0/P1 mở.
2. **Dữ liệu thật:** SEC Verified BE-65, 74, 75, 79, 83, 84 (a) trên commit RC; 2FA bắt buộc owner/manager chạy trên staging; 0 Critical/High mở.
3. **Môi trường:** RC chạy trên **staging** (không phải stack tạm); deploy qua environment có người duyệt; sao lưu + khôi phục diễn tập trên staging có biên bản.
4. **Kiểm tra tự động:** CI push xanh trên commit RC (0 `retry #`); lượt T9 gần nhất xanh (C13: dẫn `gh run list --workflow CI -L 5`).
5. **Sổ lỗi:** 0 P0/P1 Open/Fixed; mọi P2 mở có quyết định dời của PO kèm lý do.
6. **Must:** mọi story Must R3 + 20 Must hàng chờ "Đạt" trên staging, hoặc dời có dòng ORC + báo INV (như K9).

**Nhóm mềm (thiếu ≤ 2 dòng thì ĐẠT CÓ ĐIỀU KIỆN):** review chéo Verified đủ; axe 0 lỗi nghiêm trọng trên màn mới; hiệu năng p95 trong ngưỡng ARC; release notes + UAT script + hướng dẫn vận hành có và INV đọc được; brand đúng trên mọi đầu ra cho khách.

**Đề xuất cho QC – ca đồng hồ giả thay điều kiện "T9 chạy thật ban đêm":**
- Vấn đề: ở Sprint 4, cổng đòi "lượt T9 hằng đêm gần nhất xanh", nên mỗi lần sửa phải chờ tới 02:17 đêm sau mới chấm được, và chỉ thử được đúng một giờ trong ngày.
- Đề xuất: từ R3, khung giờ đêm được chứng minh bằng **bộ ca đồng hồ giả** chạy trong **mọi** lượt CI push: TC-X-088 (PWA "Các căn" lúc 02:40), TC-L2-109, TC-L2-110, TC-L6-060 (Desk đổi phòng, đặt đơn đêm). Mỗi ca chạy ở 3 mốc 02:40 / 05:59 / 06:00 giờ Đà Lạt. QA bổ sung ca cho mọi màn mới có chọn ngày (quy tắc: màn có ô ngày hoặc gọi API theo ngày phải có ca đồng hồ giả).
- T9 hằng đêm **vẫn chạy** để giám sát. Lượt T9 đỏ thì QA ghi sổ lỗi trong 24 giờ, kèm phân loại lỗi sản phẩm hay lỗi ca kiểm (C13). Cổng chỉ đòi "không có lượt T9 đỏ chưa ghi/chưa phân loại", không đòi chờ một lượt đêm xanh mới chấm.
- Lý do: lỗi 211/212/213 nay đã có ca đồng hồ giả bắt được (kiểm ngược trên bản cũ đỏ đúng lỗi), và ca này phủ nhiều mốc hơn một lượt đêm. Ca đồng hồ giả lặp lại được và chạy trên mỗi commit. QC quyết có nhận đề xuất này không; nếu nhận, ghi vào cổng R3 và decision-log.

## 7. Đầu ra mong đợi cuối R3

- RC trên staging, mã gộp `main`, tag RC; `product/docs/release-notes.md`; `product/docs/uat-script.md` (10–15 việc, có kịch bản giờ đêm và dài hạn); hướng dẫn vận hành (lễ tân, buồng phòng, quản lý, chủ đầu tư).
- `rounds/round-03/outputs/<VAI>/report.md` cho mọi vai; reviews/responses theo ma trận; `qa/bug-list.md`; `qc/`.
- `round-summary.md` R3 trình INV: quyết định phát hành RC, danh sách việc dời R4, việc INV cần làm trước khi nhập dữ liệu thật.

## 8. Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Chưa có VPS + tên miền tới giữa Sprint 2 | Không có RC trên staging | ORC nhắc INV đầu Sprint 1; tới giữa Sprint 2 chưa có thì tạo ESC dời mốc RC |
| Lượt kiểm tiền R3 sinh lỗi cùng lớp (công nợ) | Trễ Sprint 1 | Thứ tự 210 → 209 → 208; fuzz R3-Q30; critic độc lập; tối đa 3 vòng rồi PO cắt Should |
| Phạm vi lớn (30 Must + 20 Must hàng chờ + LP-v1) | Không kịp RC | Thứ tự ưu tiên mục 3; Should mặc định dời R4; PO cắt sớm cuối Sprint 2 nếu năng lực < 80% kế hoạch |
| Tài khoản bên thứ ba (Beds24, MISA, ZBS) đến muộn | Story chỉ đạt trên sandbox | Nghiệm thu "đạt trên sandbox", RC ghi rõ giới hạn; không chặn RC |
| Repo công khai làm lộ cách lách kiểm soát nội bộ | Rủi ro người trong | SEC E.1: Major người trong sửa trước dữ liệu thật; Critical/High qua Security Advisory nháp |
