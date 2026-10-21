# Báo cáo đánh giá khả dụng – Round 2

- Tác giả: UXR | Phiên bản: 1.0 | Ngày: 18/10/2026 | Round 2 (Xây dựng lõi MVP), tuần Ổn định
- Đầu ra theo `rounds/round-02/plan.md` mục 4 (dòng UXR) và tiêu chí C5. ORC đồng ý gộp các lượt đánh giá R2 vào tệp này (18/10).
- **Đây là đánh giá mô phỏng của đội AI.** UXR đóng vai các persona trong `personas.md` và tự bấm trên bản dựng. **Chưa có người dùng thật nào tham gia.**
  - ESC-003 đã quyết phương án A (16/10): chủ đầu tư kiểm chứng theo phiếu 1 trang `real-user-check-guide.md`.
  - Tới ngày lập báo cáo, đội **chưa nhận được kết quả phiếu**. Luật quyết định H-05 (decision-log 15/10) vì vậy chưa áp dụng.
  - Mọi kết luận về buồng phòng (P3) và chủ đầu tư (P1) cần chủ đầu tư kiểm chứng với nhân viên thật trước bản dùng thử.

## 1. Các lượt đánh giá trong Round 2

| Lượt | Ngày, bản dựng | Vai / persona | Kịch bản | Tài liệu chi tiết | Kết quả tóm tắt |
|---|---|---|---|---|---|
| L1 – Demo 1, đi đủ lần đầu | 17/10 trưa, stack demo `adc0a47` | Chủ đầu tư, Quản lý, Lễ tân trưởng, Lễ tân (P2), Buồng phòng (Desk), CTV (P4), Khách (P5/P7) | Bước 0, KB1–KB10 (`rounds/round-02/demo-1-guide.md` v1.1) | `demo-1-guide.md`, `demo-1-limits.md` mục C; `qc/s3-qc-gate.md` K12 | 7/10 KB đạt hoặc chỉ cần sửa hướng dẫn; KB4, KB6 đi vòng được; **KB8 không làm trọn**. 11 điểm (#1–#11) → BUG-R2-065…082, cùng BUG-R2-084 (KB7) |
| L2 – đi lại sau vòng sửa 9 | 17/10 chiều, `9a221ee` | Như L1 | KB1–KB4, KB6–KB8 (hướng dẫn v1.2) | `qa/bug-list.md` mục 10.4 | Đi được hết; 12 điểm mới → BUG-R2-092…103 |
| L3 – đi lại trên bản sửa 9b, 9c | 17/10 15:20–15:45, `fe4b166` | Như L1 | KB4, KB6, KB7 đầy đủ; KB1–KB3, KB8 lướt hồi quy; KB9 phần lễ tân xem ảnh khách gửi (hướng dẫn v1.3) | `qa/bug-list.md` mục 10.4 | Đi được hết; 6 điểm N1–N6 → BUG-R2-086…091 |
| **L4 – S4: PWA buồng phòng + KB5, KB10, J6** | 18/10 09:02–09:30, stack riêng `ottimo-uxr` từ `7ac11a4` | Buồng phòng (P3), Kỹ thuật, Lễ tân trưởng, Lễ tân (P2), Chủ đầu tư (P1) | PWA H19–H22 ở 360 và 390 px; KB5; KB10; J6 trên H24 | **`rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md`** | PWA đi được hết khi có mạng; **đồng bộ offline có lỗi chặn**. KB5 đạt; KB10 đạt trên laptop, không làm trọn trên điện thoại; J6 đạt bước xem. 34 vấn đề P-01…P-34 |

Thang mức nặng:
- L1–L3 dùng thang lỗi P0–P3 của QA (`product/docs/qa/test-strategy.md` mục 8), vì các điểm UXR đã được QA ghi thành BUG.
- L4 dùng thang khả dụng 1–4 của UXR:
  - 4 – chặn luồng hoặc làm sai trạng thái mà người dùng không tự gỡ được;
  - 3 – làm được nhưng dễ sai, phải hỏi người khác;
  - 2 – gây bối rối, chậm, có cách vòng;
  - 1 – thẩm mỹ, câu chữ.

## 2. Kết quả theo kịch bản (C5: ≥ 3 kịch bản)

| Kịch bản | Lượt | Kết quả | Vấn đề còn mở đáng chú ý |
|---|---|---|---|
| **Lễ tân** – sơ đồ phòng, đặt phòng và chống trùng, nhận phòng đủ giấy tờ, gia hạn và thêm người, trả phòng 3 bước + bill + VietQR, hoàn tiền tách quyền (KB1–KB8) | L1–L3; KB5 ở L4 | Sau vòng sửa 9, lễ tân làm trọn được KB1–KB8. Không còn lỗi chặn từ phía UXR. KB5 (OTA đã trả trước) đạt: "Còn phải thu 0 đ", điều kiện nhận phòng "Đã đủ" ngay | Khung tiền của đơn còn khó đọc: BUG-R2-101, 102, 103; P-17. Bảng minibar ở 1366 px bị cắt cột: P-18 |
| **Buồng phòng / kỹ thuật** – việc hôm nay, dọn, hoàn tác 10 giây, khách không muốn dọn, bổ sung minibar, báo sự cố có ảnh, kiểm phòng, phiếu sửa, offline | L4 | Có mạng: đạt. Dọn xong trong 2 chạm (đích P3 ≤ 2); hoàn tác chạy đúng; chữ ≥ 16 px, nút ≥ 48 px ở 360/390 px. **Offline: "Dọn xong" bị từ chối khi đồng bộ, căn kẹt "Đang dọn"** | P-01 (mức 4); P-04, P-05 (mức 3) |
| **Khách check-in online** (KB9, VI/EN/RU) | L1, L3 | Đạt: làm thủ tục, gửi ảnh, câu đồng ý không chọn sẵn, mở lại thấy "Đã làm thủ tục trước". Lễ tân xem được ảnh khách gửi (L3). Bản RU: thông báo dữ liệu còn tiếng Anh, chờ người bản ngữ duyệt (đúng kế hoạch) | Không có vấn đề mở từ UXR |
| **Chủ đầu tư** – duyệt FOC, nhật ký tiền, đối soát, tham số (KB10); 5 phút đầu ngày trên điện thoại (J6) | L1–L3 (KB10 laptop); L4 (KB10, J6) | KB10 đạt trên laptop. J6: mở app thấy ngay Cần duyệt → Cần chú ý → Đêm nay trong 1 màn (đích ≤ 30 giây đạt); duyệt FOC 3 chạm + mật khẩu. **Trên điện thoại không có menu**, bấm sâu là ngõ cụt | P-02, P-03, P-06 (mức 3); BUG-R2-100, P-19 |
| **CTV báo giá tại chỗ** (KB3, nền cho J5) | L1, L2 | CTV báo giá, đổi ngôn ngữ, giữ chỗ, báo đã chuyển cọc; lễ tân xác nhận cọc được | BUG-R2-080 (thiếu tiếng Nga khi gửi báo giá), BUG-R2-081 |

## 3. Bảng vấn đề

### 3.1 Lượt L1–L3 (đã ghi thành BUG, mức và trạng thái theo `qa/bug-list.md` lúc 18/10 sáng)

| Nhóm | Số | Đã đóng | Hoãn | Còn mở | Ghi chú |
|---|--:|--:|--:|--:|---|
| L1: UXR #1–#10 → BUG-R2-065…074 | 10 | 9 (065, 066 P0; 067–071 P1; 072, 073 P2) | 1 (074 → S4-45) | 0 | Toàn bộ P0/P1 đã đóng ở chấm lại cổng S3 (CI 39015560449) |
| L1: UXR #11 → BUG-R2-075…082 | 8 | 0 | 0 | 8 (076, 078, 080 P2; 075, 077, 079, 081, 082 P3) | 076, 080, 081 chờ PO/UXD |
| L1: KB7 → BUG-R2-084 | 1 | 1 (P1) | 0 | 0 | – |
| L2, L3: BUG-R2-086…103 | 18 | 1 (095) | 0 | 17 (087, 089, 090, 093, 101, 102 P2; còn lại P3) | Phần lớn nằm ở S4-50, S4-45, S4-48, S4-39, S4-25 |
| **Cộng** | **37** | **11** | **1** | **25** | Không còn P0/P1 mở từ UXR |

### 3.2 Lượt L4 – S4 PWA, KB5, KB10, J6

Tổng **34**: mức 4 là 1, mức 3 là 5, mức 2 là 19, mức 1 là 9. Lượt đi lại 21/10 thêm 3 (P-35, P-36 mức 2; P-37 mức 1) → **37**; P-01, P-05 đã đóng phía người dùng. Mô tả, bằng chứng và đề xuất đầy đủ ở `rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md` mục 3.

Trạng thái theo ORC 18/10: đã giao sửa cho **FE-B, MOB, FE-A, OPS (P-24, P-15)**; **BE-C nhận P-01**. Các mục chỉ cần UXD duyệt chữ hoặc chờ chủ đầu tư ghi riêng. Tất cả đang **Open**.

| ID | Mức | Vấn đề (tóm tắt) | Người sửa | Trạng thái |
|---|:-:|---|---|---|
| P-01 | **4** | Offline "Bắt đầu dọn" + "Dọn xong" → "Dọn xong" bị từ chối khi đồng bộ (422), căn kẹt "Đang dọn" (= FB-R2-ARC-BE-S4-01) | BE-C (MOB câu chữ ở P-08) | **Đóng phía người dùng 21/10** – T6 đạt trên `72895de` (walkthrough mục 7) |
| P-02 | 3 | Desk dưới 1024 px không có menu; chủ đầu tư trên điện thoại không vào được Nhật ký tiền, Tham số | FE-B (+ UXD) | Open – đã giao |
| P-03 | 3 | Trang Cần duyệt vỡ bố cục ở 390 px, số tiền bị che; thẻ duyệt không nói khoản gì, căn nào | FE-B | Open – đã giao |
| P-04 | 3 | Việc bổ sung minibar chỉ ghi "1, 1", không có tên món | MOB (BE-C nếu cần thêm trường API) | Open – đã giao |
| P-05 | 3 | Báo sự cố có ảnh khi mất mạng → phiếu tạo ra không có ảnh | MOB | **Đóng phía người dùng 21/10** – T7 đạt 2 lần (WO-00001, WO-00002 có ảnh) |
| P-06 | 3 | "Khai báo quá hạn – làm ngay" trên máy chưa cấp quyền là ngõ cụt, không có danh sách đơn | FE-B (+ UXD) | Open – đã giao |
| P-07 | 2 | Bộ đếm hàng đợi lệch (1 so với 2), dòng trạng thái lặp | MOB | Open – đã giao |
| P-08 | 2 | "Cần xem lại" hiện mã kỹ thuật VALIDATION_FAILED, không có nút gửi lại | MOB + UXD | Open – đã giao |
| P-09 | 2 | Mở app khi máy chủ trả 5xx → màn đăng nhập, không nhắc thao tác chờ gửi | MOB | Open – đã giao |
| P-10 | 2 | Kiểm phòng: nút "Kiểm đạt" khóa khi đủ 11/11 mục bắt buộc, phải tick cả "Ảnh phòng" | MOB | Open – đã giao |
| P-11 | 2 | Phiếu sửa xong: ảnh sau sửa hiện dưới nhãn "Ảnh lúc báo"; không hiện "Đã làm gì" | MOB (+ BE-C trường API) | Open – đã giao MOB |
| P-12 | 2 | Nhóm "Làm trước – có khách đến hôm nay" chứa thẻ "Có khách đến ngày mai" | MOB | Open – đã giao |
| P-13 | 2 | Việc đã bỏ biến mất không dấu vết; thẻ "Đã xong" hiện trạng thái căn thay vì tên việc | MOB | Open – đã giao |
| P-14 | 2 | Ảnh chụp không xem trước được (cố ý vì an toàn) | MOB + UXD + SEC | Open – chờ SEC/UXD quyết |
| P-15 | 2 | "Gọi lễ tân ngay" nhưng không có nút gọi (thiếu cấu hình số lễ tân) | OPS + MOB | Open – đã giao OPS |
| P-16 | 2 | "Bảo trì đã thấy phiếu" ngay khi vừa tạo – chưa đúng sự thật | MOB + UXD | Open – đã giao |
| P-17 | 2 | Khung đơn: dòng "Cơ sở phí hủy" thừa, "Còn phải thu" 2 lần, câu 23:00 đặt sai chỗ; hướng dẫn KB5 cũ | FE-A + UXR (hướng dẫn) | Open – đã giao FE-A |
| P-18 | 2 | Bảng minibar khi trả phòng bị cắt cột "Tiền" ở 1366×768 | FE-A | Open – đã giao |
| P-19 | 2 | Nhật ký tiền: Lý do là câu tiếng Anh của lập trình; thiếu lý do lễ tân chọn (cùng họ BUG-R2-100) | FE-A (`MoneyPage`) + UXD | Open – đã giao |
| P-20 | 2 | H24 ở 390 px: tiêu đề bị bóp; ô Giao diện đè nhãn | FE-B | Open – đã giao |
| P-22 | 2 | Tham số: thay đổi chờ hiệu lực không hiện ở bảng; lịch sử thiếu cột Hiệu lực | FE (ORC chọn FE-A/FE-B) | Open – đã giao |
| P-23 | 2 | Đối soát: "Đã khớp sao kê" không xác nhận/hoàn tác; câu đầu trang sai ngữ cảnh | FE-A (`MoneyPage`) + UXD | Open – đã giao |
| P-24 | 2 | Image `ottimo-web:demo`: manifest, `sw.js` quyền 0600 → PWA trên stack demo không cài được | OPS | Open – đã giao |
| P-25 | 2 | Manifest PWA chưa có icon → Android không gợi ý cài | UXD + MOB, **chờ INV gửi logo SVG** | Open – chờ INV |
| P-29 | 2 | "Các căn": chữ trạng thái tràn khỏi chip ở 360/390 px (= FB-R2-UXD-MOB-S4-03) | MOB | Open – đã giao |
| P-21 | 1 | "…hạn sớm nhất" bỏ lửng khi chưa có hạn | FE-B | Open – đã giao |
| P-26 | 1 | Nhận phòng bước 4: câu chỉ bước sai; hộp xác nhận không nhắc yêu cầu miễn đang chờ | FE-A + UXD | Open – đã giao |
| P-27 | 1 | Thanh dưới PWA: nhãn xuống dòng, sát mép ở 360 px; sáng sai mục | MOB | Open – đã giao |
| P-28 | 1 | Màn đăng nhập: câu "bấm Thử lại" nhưng nút là "Đăng nhập" | MOB + UXD | Open – đã giao |
| P-30 | 1 | Checklist có chữ "Amenity"; "Hết việc rồi!" lệch giọng điềm tĩnh | UXD | Open – chờ UXD duyệt chữ |
| P-31 | 1 | Báo sự cố khi mất mạng: 2 banner chồng nhau | MOB | Open – đã giao |
| P-32 | 1 | Folio dùng lẫn gạch nối và dấu trừ | FE-A | Open – đã giao |
| P-33 | 1 | Thẻ việc lặp số căn; buồng phòng thấy họ tên đầy đủ (spec ghi "tên gọi") | MOB + DOM/SEC xác nhận | Open – chờ DOM/SEC |
| P-34 | 1 | Chữ "drawer" trên màn lễ tân | FE-A + UXD | Open – đã giao |
| P-35 | 2 | Khởi động app lúc máy chủ trả 502, máy chủ lên lại: hàng đợi không tự gửi khi app vẫn mở; "tự thử lại lúc" hiện giờ đã qua, dòng ghi "Đang gửi 1/1…" dù không gửi (mới 21/10) | MOB | Open – mới, đề xuất R3 |
| P-36 | 2 | Một phần dữ liệu (việc hoặc căn) không tải được: chỉ đổi dòng chữ nhỏ "Dữ liệu lúc …", không có câu báo hay nút thử lại (mới 21/10) | MOB + UXD | Open – mới, đề xuất R3 |
| P-37 | 1 | Sau một lần tải việc lỗi, "Các căn" mất tên khách không giải thích (đúng SR-PWA-01) (mới 21/10) | UXD + SEC | Open – chờ UXD/SEC |

Ghi chú:
- Bản đã thử là commit `7ac11a4`. Cây làm việc đang có thay đổi chưa commit của BE-C và MOB ở vùng P-01, P-05, P-10, P-11, P-29. Sau khi gộp, QA/UXR đi lại trên stack `ottimo-uxr` (vẫn đang chạy) trước khi đóng.
- **21/10 – R-4 cổng QC Round 2 (C8 cổng S4):** UXR đi lại T6, T7 trên stack `ottimo-uxr` dựng lại từ `72895de` (mô phỏng, chưa kiểm với nhân viên thật). T6, T7 đạt → P-01, P-05 đóng phía người dùng; cùng lượt thấy P-07, P-09, P-15 (build có số lễ tân), P-31 đã đạt; BUG-R2-211 phía PWA đạt (giờ máy 02:40 vẫn hiện ngày kinh doanh). Mục mới P-35, P-36, P-37, không mục nào mức 3–4. Chi tiết: `rounds/round-02/outputs/UXR/s4-pwa-walkthrough.md` mục 7. Trạng thái các mục còn lại ở bảng trên giữ theo 18/10, UXR chưa đi lại.
- Có 2 mục đã được vai khác ghi trước: P-01 = FB-R2-ARC-BE-S4-01, P-29 = FB-R2-UXD-MOB-S4-03. UXR xác nhận từ phía người dùng, không tính trùng.

## 4. Phần dời từ Round 1 (plan R2 dòng UXR)

| Việc | Trạng thái |
|---|---|
| Tương phản token tối (UXD-UXR-10) | UXD đã đo AA sáng/tối trên bản chạy ở `rounds/round-02/reviews/s4-UXD-brand.md` (G8.2). UXR không đo lại; trong L4 không thấy chữ khó đọc ở chế độ sáng |
| Trạng thái tải / rỗng / lỗi / mất mạng (UXD-UXR-10) | Đánh giá trong L4. **Rỗng:** "Căn này không có việc hôm nay", "Không có yêu cầu chờ duyệt" – rõ. **Lỗi:** câu đăng nhập rõ; "Cần xem lại" còn mã kỹ thuật (P-08). **Mất mạng:** banner + "Đã lưu trên máy" rõ; đồng bộ lỗi (P-01, P-05); mở app khi máy chủ lỗi về màn đăng nhập (P-09) |
| J5 – CTV báo giá tại chỗ | Đã đi KB3 (L1, L2). Hành trình J5 **chưa viết** vào `journeys.md` → UXR làm ở R3 (thẻ FB-R1-UXD-UXR-13) |
| J6 – Chủ đầu tư 5 phút đầu ngày | Đã đi ở L4 (định nghĩa tạm trong `s4-pwa-walkthrough.md` mục 2.4). Chưa ghi vào `journeys.md` → R3 |
| Số lần nhập mật khẩu/xác thực lại mỗi ca (SEC-10) | **Chưa đo.** Dời R3 cùng kịch bản "quy tắc mật khẩu" (`qc/s4-gate-readiness.md` c8). Quan sát lẻ ở L4: duyệt FOC hỏi mật khẩu mỗi lần duyệt; "Xem đủ số" của lễ tân hỏi 1 lần cho 15 phút |
| Áp luật quyết định H-05 khi có kết quả phiếu ESC-003 | **Chưa áp** – chưa có kết quả phiếu |

## 5. Danh sách việc sửa đề xuất cho Round 3

Phần nào sửa xong trong tuần Ổn định thì PO bỏ khỏi danh sách khi lập plan R3.

1. **Offline của PWA (US-058, ADR-005):**
   - đóng P-01, P-05, P-09;
   - thêm ca E2E "mất mạng → bắt đầu dọn + dọn xong + báo sự cố có ảnh → có mạng → trạng thái đúng";
   - thử mở app khi mất mạng thật trên điện thoại (service worker), vì Browser pane không chạy được phần này.
2. **Desk trên điện thoại cho chủ đầu tư (L8, US-007, US-010–012):**
   - P-02, P-03, P-06, P-20;
   - KPI bấm được để ra danh sách đơn (nhu cầu "truy được nguồn" của P1 – mới, chưa có thẻ);
   - bản H24 rút gọn cho FDL/FD theo `reviews/s4-UXD.md` (PO quyết).
3. **Khung tiền của đơn và nhật ký tiền:** BUG-R2-101, 102, 103, 100, 097, 099; P-17, P-19, P-22, P-23, P-32.
4. **Buồng phòng:**
   - P-04 (tên món minibar), P-10, P-11, P-12, P-13, P-29;
   - đếm minibar trên PWA khi dọn phòng có khách (H20.4, US-066) – chưa có trong sản phẩm.
5. **Lễ tân:** BUG-R2-075, 076, 077, 078, 079, 082, 087, 089, 092, 093, 094, 096; P-18, P-26.
6. **CTV:** BUG-R2-080 (báo giá tiếng Nga – US-083 AC2), 081.
7. **Câu chữ và thương hiệu** (UXD duyệt): P-08, P-16, P-28, P-30, P-34, BUG-R2-088, 090, 091, 098; quyết P-14 cùng SEC; icon PWA khi có logo (P-25).
8. **Nghiên cứu (UXR):**
   - viết J5, J6 vào `journeys.md`;
   - đo SEC-10;
   - áp H-05 khi có kết quả ESC-003;
   - đánh giá khả dụng toàn diện bản RC và chấm SUS dự kiến theo luồng (việc R3 của UXR).

## 6. Cần chủ đầu tư kiểm chứng với người thật (ESC-003)

Phiếu 1 trang `real-user-check-guide.md` vẫn dùng được. Sau L4, UXR đề nghị hỏi thêm 4 điểm khi chủ đầu tư cho nhân viên thật thử:

1. Buồng phòng có dùng điện thoại trong phòng khi sóng yếu không, hay chờ ra hành lang mới bấm? Câu trả lời quyết định độ gấp của P-01, P-05.
2. Khi thấy "Bổ sung minibar", nhân viên cần biết tên món, hay chỉ cần biết "căn này phải bổ sung" rồi tự mở tủ kiểm? (P-04)
3. Chủ đầu tư có thật sự duyệt FOC và xem tiền bằng điện thoại hằng ngày không? Nếu có thì P-02, P-03 phải xong trước bản dùng thử.
4. Trưởng ca có chụp ảnh khi kiểm phòng không, hay chỉ tick? (P-10, P-14)

## 7. Lịch sử thay đổi

| Phiên bản | Ngày | Người sửa | Nội dung |
|---|---|---|---|
| 1.0 | 18/10/2026 | UXR | Bản đầu: gộp L1–L3 (Demo 1, 17/10) và L4 (S4 PWA + KB5, KB10, J6, 18/10) theo ORC; bảng vấn đề theo mức, người sửa, trạng thái; việc dời từ R1; danh sách sửa cho R3 |
| 1.1 | 21/10/2026 | UXR | R-4 cổng QC Round 2 / C8 cổng S4: đi lại T6, T7 trên `72895de`; P-01, P-05 đóng phía người dùng; thêm P-35, P-36, P-37 |
