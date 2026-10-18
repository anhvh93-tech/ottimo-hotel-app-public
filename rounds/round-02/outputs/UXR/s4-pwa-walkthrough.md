# Đi thử PWA "OTTIMO Staff" trên điện thoại và đi lại KB5, KB10, J6 – Round 2, tuần Ổn định

- Người làm: UXR | Ngày: 18/10/2026, 09:02–09:30 | Bước: **Kiểm thử (đánh giá khả dụng)** – việc NÊN-ÔĐ, nguồn plan R2 mục 4 (dòng UXR), `sprint-4-plan.md` dòng UXR, `qc/s4-gate-readiness.md` dòng b8.
- **Đây là đánh giá mô phỏng của đội AI.** UXR đóng vai Chú Bảy (P3 – buồng phòng), anh Tùng (kỹ thuật), Trưởng ca, Lễ tân (P2) và Anh Quân (P1 – chủ đầu tư) theo `product/docs/research/personas.md`. Kết quả **chưa kiểm chứng với nhân viên thật**. Chủ đầu tư cần cho 1–2 nhân viên buồng phòng thật thử theo `product/docs/research/real-user-check-guide.md` (ESC-003) trước khi tin các kết luận ở mục 3 về P3.
- Không sửa mã, không commit. Ảnh chụp để trong scratchpad của phiên (không đưa vào git), giống cách làm các lượt UXR trước: `scratchpad/uxr-s4/shots/01…35-*.jpg`.

## 0. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| PWA buồng phòng 360 px và 390 px – đăng nhập, việc hôm nay, dọn, hoàn tác 10 giây, khách không muốn dọn, minibar, báo hỏng, kiểm phòng, phiếu sửa (MT), làm offline rồi đồng bộ | **Đi được hết luồng khi có mạng.** Chữ ≥ 16 px, vùng bấm ≥ 48 px, không cuộn ngang ở cả hai khổ. Hoàn tác 10 giây chạy đúng. **Offline có lỗi chặn:** "Bắt đầu dọn" + "Dọn xong" làm khi mất mạng → "Dọn xong" bị máy chủ từ chối khi đồng bộ; căn kẹt "Đang dọn" (P-01). |
| KB5 – khách OTA đã trả trước (Desk, 1366×768) | **Đạt.** "Còn phải thu 0 đ"; điều kiện "Đã thu đủ hoặc OTA đã trả/đảm bảo" = Đã đủ ngay; app không đòi thu lại. Câu mong đợi trong hướng dẫn demo đã cũ (P-17). |
| KB10 – việc của chủ đầu tư | **Đạt trên laptop.** Duyệt FOC → folio "Miễn phí", còn phải thu 0; nhật ký tiền; đối soát; tham số chặn 150 %, lưu 35 % hiệu lực ngày mai, có lịch sử. **Trên điện thoại không làm trọn được** vì không có menu (P-02). |
| J6 – chủ đầu tư 5 phút đầu ngày, H24 trên điện thoại 390 px | **Đạt một nửa.** Mở app là thấy ngay Cần duyệt → Cần chú ý → Đêm nay trong 1 màn (đích ≤ 30 giây đạt). Duyệt FOC được trong 3 chạm + mật khẩu. Nhưng bấm sâu thì ngõ cụt: không menu, "Khai báo quá hạn – làm ngay" dẫn tới màn "Máy này chưa được cấp quyền" (P-02, P-06). |
| Thương hiệu OTTIMO | Màu, font đúng; chỉ màu chức năng ngoài bảng (đã có ngoại lệ UXD). Giọng văn ngắn, lịch sự, không emoji. Vài chỗ còn chữ kỹ thuật/tiếng Anh nội bộ (mục 4). |

**Số vấn đề theo mức (thang 1–4 của UXR):** mức 4: **1** · mức 3: **5** · mức 2: **19** · mức 1: **9** · tổng **34**.
Thang: 4 = chặn luồng hoặc làm sai trạng thái mà người dùng không tự gỡ được; 3 = làm được nhưng dễ sai/phải hỏi người khác; 2 = gây bối rối, chậm, có cách vòng; 1 = thẩm mỹ, chữ.

## 1. Môi trường và cách làm

- **Stack riêng của UXR**, không đụng stack demo (8181–8183, 3100), stack QA (`ottimo-qa-s3/s4`) hay FE (`ottimo-fe07`):
  - project `ottimo-uxr`, dựng từ `git archive HEAD` = **`7ac11a4`**, image riêng `ottimo-api:uxr-s4`, `ottimo-api:uxr-s4-seed`, `ottimo-web:uxr-s4`;
  - cổng: Desk `localhost:28181`, PWA `localhost:28182`, khách `28183`, api `127.0.0.1:23100`;
  - dữ liệu: cùng cách dựng của demo (`tests/fixtures/seed/ds-e.json` bản sao + `infra/demo/seed-demo.mjs past/now`), tài khoản thử sinh trong phiên, lưu ở `scratchpad/uxr-s4/out/demo-accounts.md` (0600). **Không đọc `product/.env`** → chưa cài tài khoản nhận VietQR (KB10 không có khoản VietQR của KB7 để đối soát; dùng 2 khoản mẫu).
  - Script và overlay compose: `scratchpad/uxr-s4/up.sh`, `compose.uxr.yml`. Stack vẫn chạy để QA/MOB tái hiện; tắt bằng `docker compose -p ottimo-uxr down -v` (cần `--env-file` và 2 tệp `-f` như trong `up.sh`).
- **Trình duyệt:** Browser pane của app, giả lập khổ 360×800 và 390×844 (PWA, H24), 1366×768 (Desk), thêm 768 và 1024 để tìm điểm gãy menu.
- **Giới hạn đã biết:**
  - Browser pane **không đăng ký được service worker** (cả MSW lẫn `sw.js`). Vì vậy không thử được chế độ mock MSW (`pnpm --filter @ottimo/mobile dev`) và **không thử được "mở app khi đang mất mạng"** (vỏ app từ cache). Phần offline chỉ thử "đang dùng thì mất mạng".
  - Mất mạng giả lập bằng 2 cách cùng lúc: ghi đè `navigator.onLine = false` + phát sự kiện `offline` (để hiện banner), và **dừng container api của stack UXR** (máy chủ trả 502). Đây không hoàn toàn giống mất sóng thật (lỗi mạng thay vì 502).
  - Ảnh chụp/ảnh sự cố là ảnh vẽ bằng canvas, đưa vào ô chọn tệp bằng script (pane không có hộp chọn tệp).
- **Bản đã thử = commit `7ac11a4`**, không gồm thay đổi chưa commit trong cây làm việc. Lúc 09:35 cây làm việc đang có thay đổi của vai khác ở đúng vùng liên quan: BE-C `housekeeping/public/room-status.service.ts` (so theo `performed_at` – hướng sửa P-01), `housekeeping.service.ts`, `work-orders.service.ts`; MOB `RoomPage.tsx`, `PhotoPicker.tsx`, `parts.tsx`, `styles.css`. Khi các thay đổi này được gộp, QA/UXR cần đi lại T6, T7, T13, T14 trước khi đóng P-01, P-05, P-10, P-11, P-29.
- **Phát hiện phụ khi dựng:** image do `demo-up.sh` dựng có `manifest.webmanifest` và `sw.js` quyền `0600` (do `umask 077` trước `git archive | tar -x`) → Caddy (uid 10001) không đọc được, trả `index.html` thay cho manifest. UXR chỉ kiểm image `ottimo-web:demo` bằng `docker run --rm … ls`, **không chạm container demo đang chạy**. Image CI (`ottimo-web:qa-r9`) quyền `0644` – bình thường. Ghi ở P-24. Stack UXR đã dựng lại web với quyền đúng trước khi thử.

## 2. Nhiệm vụ và kết quả

### 2.1 PWA "OTTIMO Staff" (H19–H22) – vai HK, MT, Trưởng ca

| # | Nhiệm vụ (vai, khổ) | Số thao tác | Kết quả | Vấn đề |
|---|---|---|---|---|
| T1 | Đăng nhập, sai mật khẩu 1 lần rồi đúng (HK, 360) | 2 ô + 1 nút | Đạt. Câu lỗi "Tên đăng nhập hoặc mật khẩu không đúng. Quên mật khẩu? Nhờ chủ đầu tư đặt lại." rõ (ảnh 01) | P-28 |
| T2 | Xem việc hôm nay (HK, 360/390) | 0 | Đạt. Thẻ theo căn, "401 · The Pine", trạng thái bằng câu thường, "0/3 xong" (ảnh 02) | P-12, P-13, P-27, P-33 |
| T3 | Dọn phòng khách đang ở: Bắt đầu dọn → Dọn xong (HK, 360) | **2 chạm** (đích P3 ≤ 2) | Đạt khi có mạng (ảnh 03) | – |
| T4 | Hoàn tác trong 10 giây (HK, 360) | 1 chạm | Đạt: "Đã hoàn tác – căn 202 · The Valley vẫn là 'Khách đang ở – cần dọn'", không gọi máy chủ (ảnh 04) | – |
| T5 | Khách không muốn dọn (HK, 360) | 3 chạm | Đạt; lý do 3 lựa chọn, có hoàn tác (ảnh 05) | P-13 |
| T6 | Mất mạng: Bắt đầu dọn + Dọn xong căn 401 (HK, 390) | 2 chạm | Trên máy: "Đã lưu trên máy – sẽ tự gửi khi có mạng" (ảnh 06, 07). **Khi có mạng lại: "Dọn xong" bị từ chối**, căn 401 ở máy chủ vẫn "Đang dọn" (ảnh 13, 14) | **P-01**, P-07, P-08 |
| T7 | Mất mạng: báo sự cố Gấp có ảnh, căn 401 (HK, 390) | chọn căn, 1 chip, gõ 1 dòng, 1 ảnh, Gửi | Trên máy đạt: "Đã lưu trên máy – chưa gửi. Sự cố gấp? Gọi lễ tân ngay" (ảnh 11). Mức độ tự gợi ý "Gấp" khi chọn "Mất nước nóng". **Sau đồng bộ, phiếu WO-00001 không có ảnh** | **P-05**, P-14, P-15, P-31 |
| T8 | Tải lại app khi máy chủ lỗi (HK, 390) | – | Về màn đăng nhập, không nhắc 3 thao tác đang chờ (ảnh 12). Dữ liệu chờ gửi **không mất**: đăng nhập lại là tự gửi tiếp | P-09 |
| T9 | Xem "Thao tác trên máy", "Cần xem lại" (HK, 390) | 1 chạm | Có trang riêng, nút "Gửi ngay". Bộ đếm lệch, câu lỗi có mã kỹ thuật (ảnh 08, 13) | P-07, P-08 |
| T10 | Bổ sung minibar sau khi lễ tân trả phòng 103 có dùng 1 bia + 1 Coca (HK, 360) | 1 chạm "Làm xong" | Làm được, có hoàn tác. **Thẻ ghi "Bổ sung minibar: 1, 1" – không có tên món** (ảnh 27, 35) | **P-04**, P-13 |
| T11 | Đếm minibar trên PWA khi dọn phòng có khách | – | **Chưa có** trên PWA (README MOB: H20.4 chờ US-066). Đếm minibar hiện chỉ làm ở Desk lúc trả phòng | Ghi nhận, không tính lỗi |
| T12 | Báo sự cố khi có mạng, có ảnh (Trưởng ca, 390) | như T7 | Đạt: WO-00002 có 1 ảnh. Câu "Bảo trì đã thấy phiếu" chưa đúng sự thật | P-16 |
| T13 | Kiểm phòng 102 có checklist 12 mục (Trưởng ca, 390) | 12 tick + 1 | Đạt sau khi tick cả mục không bắt buộc "Ảnh phòng" – nút "Kiểm đạt" không mở với 11/11 mục bắt buộc (ảnh 18–20) | P-10, P-30 |
| T14 | Kỹ thuật nhận việc, sửa xong có ảnh (MT, 390) | Nhận việc 1 chạm; Sửa xong 1 + gõ + ảnh + xác nhận | Đạt; có đếm ngược hạn nhận việc "còn 13 phút" (ảnh 15). Ảnh sau sửa lại hiện dưới nhãn "Ảnh lúc báo", ghi chú "Đã làm gì" không hiện (ảnh 16, 17) | P-11 |
| T15 | Đổi ngôn ngữ VI/EN (HK) | 1 chạm | Đạt; chuỗi EN đủ ở các màn đã xem | – |
| T16 | Đăng xuất / đổi người | 2 chạm | Đạt | – |

### 2.2 KB5 – khách OTA đã trả trước (Lễ tân, Desk 1366×768)

- Bước: Sơ đồ phòng → thanh D2 (302 · Anna Petrova, Agoda) → xem Folio → Nhận phòng → xem khung Điều kiện.
- Kết quả: **Đạt.**
  - Folio: "Tiền phòng (3 đêm) 4.440.000 · Cơ sở phí hủy (cọc theo tiền phòng hiện tại) 0 · Đã thu −4.440.000 · **Còn phải thu 0 đ**" (ảnh 24).
  - Màn Nhận phòng: "Đã thu đủ hoặc OTA đã trả/đảm bảo – **Đã đủ**" ngay; chỉ còn thiếu giấy tờ (ảnh 25). Không có chỗ nào đòi thu lại tiền phòng.
- Vấn đề: P-17 (dòng "Cơ sở phí hủy", câu "Mở được từ 23:00…" ở đầu khung; hướng dẫn demo còn ghi "Cọc cần thu 0").

### 2.3 KB10 – việc của chủ đầu tư

Chuẩn bị: lễ tân làm KB4 rút gọn cho D1 (102) – nhập tay CCCD giả, khai báo sau, **khách nhận sớm 09:15, xin miễn phụ thu 375.000 (Khách quen / VIP)**, thu tiền mặt 1.000.000, nhận phòng. Lễ tân trả phòng D3 (103) có minibar để tạo việc cho buồng phòng.

| Bước | Khổ | Kết quả |
|---|---|---|
| 1. Cần duyệt → Duyệt FOC 375.000 → mật khẩu | 390 (từ H24) | Đạt: hộp "Duyệt miễn 375.000 đ cho OTM-00007?" rõ số tiền (ảnh 30). D1 sau đó: "Miễn phí −375.000", **Còn phải thu 0 đ** |
| 2a. Nhật ký thao tác tiền | 1366 | Đạt: có người, giờ, không có nút xóa. Cột Lý do còn câu tiếng Anh của lập trình (ảnh 31) – P-19 |
| 2b. Chờ đối soát → Đã khớp sao kê | 1366 | Đạt: khoản rời danh sách, có thông báo. Không có xác nhận/hoàn tác – P-23 |
| 3. Tham số "Cọc ngắn ngày": 150 → bị chặn; 35, hiệu lực 19/10 → lưu; xem lịch sử | 1366 | Đạt: "Giá trị phải từ 0 đến 100." (ảnh 32); "Đã lưu Cọc ngắn ngày, hiệu lực từ 19/10/2026."; lịch sử có dòng mới tên chủ nhà + lý do (ảnh 33). Bảng không cho thấy thay đổi đang chờ hiệu lực – P-22 |
| Làm KB10 hoàn toàn trên điện thoại | 390 | **Không làm được**: Desk dưới 1024 px không có menu; không vào được Nhật ký tiền, Tham số – P-02 |

### 2.4 J6 – Chủ đầu tư 5 phút đầu ngày (H24, điện thoại 390 px)

Định nghĩa dùng (UXR soạn từ thẻ FB-R1-UXD-UXR-13 và persona P1, vì `journeys.md` chưa có J6): Anh Quân mở điện thoại lúc đầu ngày → (1) biết trong ≤ 30 giây đêm nay thế nào và có gì "sắp cháy" → (2) duyệt việc đang chờ mình → (3) bấm vào một mục "Cần chú ý" để biết là đơn nào, giao ai xử lý → (4) xem tiền chờ đối soát.

| Bước | Kết quả |
|---|---|
| 1. Đăng nhập → vào thẳng Tổng quan | Đạt. Một màn thấy đủ: Cần duyệt (0/1) → Cần chú ý (3) → Đêm nay 70 % · 7/10 · đến/đi 4/1 · đang ở 5 (ảnh 21, 28). Thứ tự đúng H24 |
| 2. Duyệt FOC | Đạt: 3 chạm + mật khẩu. Thẻ trên Tổng quan chỉ ghi "Miễn khoản phát sinh (FOC) · 375.000 đ · OTM-00007 · Lễ tân Linh" – không biết là phụ thu gì, căn nào, lý do gì; trang Cần duyệt ở 390 px bóp chữ, số tiền bị che (ảnh 29) – P-03 |
| 3. Bấm "Khai báo quá hạn: 5 đơn – làm ngay" | **Ngõ cụt**: "Máy này chưa được cấp quyền", không có danh sách đơn, không có nút quay lại (ảnh 23) – P-06 |
| 3'. Bấm "Đơn OTA chưa gán căn (1)" | Đạt: sơ đồ phòng chuyển sang kiểu Danh sách, có nút Gán căn |
| 4. Xem tiền chờ đối soát | **Không có đường đi** trên điện thoại (không menu) – P-02 |
| Truy nguồn KPI (bấm số công suất → danh sách đơn) | KPI không bấm được. Persona P1 cần điều này; đề xuất R3 (không tính lỗi) |

## 3. Danh sách vấn đề

Cột "Vai sửa" là đề xuất của UXR; ORC/PO phân việc cuối cùng. "Đã có thẻ" = vấn đề đã được vai khác ghi, UXR xác nhận từ phía người dùng.

### Mức 4

| ID | Vai sửa | Vấn đề và bằng chứng | Đề xuất |
|---|---|---|---|
| **P-01** | **BE-C** (+ MOB phần câu chữ) | **Làm "Bắt đầu dọn" rồi "Dọn xong" khi mất mạng → khi có mạng lại, "Dọn xong" bị từ chối.** Máy chủ trả 422 `PERFORMED_AT_OUT_OF_RANGE` vì `room_status.since` lấy giờ máy chủ lúc nhận lệnh 1 (09:13), còn lệnh 2 mang giờ bấm trên máy (09:11). Hậu quả người dùng: Chú Bảy đã thấy "Khách đang ở – đã dọn" và "2/2 xong"; vài phút sau mới hiện "Cần xem lại" kèm mã kỹ thuật; ở máy chủ và Desk căn 401 vẫn "Đang dọn". Với dọn trả phòng, căn kẹt `CL` sẽ không qua được điều kiện "Buồng sẵn sàng" khi nhận phòng → khách đứng chờ. Ảnh 06–08, 13, 14; network: `status-transitions` 200 rồi 422. **Đã có thẻ FB-R2-ARC-BE-S4-01 (Major, Open)** – UXR nâng mức theo P3 vì đây đúng tình huống J4 "bấm Dọn xong khi mất mạng" và mất sóng trong phòng là chuyện hằng ngày | BE-C sửa theo ARC (so `performedAt` với mốc cùng hệ giờ máy). Thêm ca E2E: mất mạng → start + done → có mạng → căn `VC`/`OC-sạch`. MOB: xem P-08 |

### Mức 3

| ID | Vai sửa | Vấn đề và bằng chứng | Đề xuất |
|---|---|---|---|
| **P-02** | **FE-B** (+ UXD) | **Desk dưới 1024 px không có menu.** Thanh bên ẩn ở 390 và 768 px, không có nút menu, không có thanh dưới (hi-fi H24 có thanh dưới "Tổng quan · Cần duyệt · Hôm nay · Phòng · Thêm"). Trên điện thoại, chủ đầu tư chỉ đi được qua các mục "Cần chú ý"/"Cần duyệt"; trang con không có nút quay lại. KB10 bước 2–3 không làm được trên điện thoại. Ảnh 21, 23 | Làm thanh dưới theo hi-fi H24 cho khổ < 1024 (tối thiểu: Tổng quan, Cần duyệt, Hôm nay, Nhật ký tiền, Thêm); trang con có nút quay lại |
| **P-03** | **FE-B** | **Trang Cần duyệt ở 390 px vỡ bố cục.** Cột chữ còn ~60 px, mỗi dòng 1 từ; số "375.000" bị chip "Chờ duyệt" che (ảnh 29). Thẻ "Cần duyệt" trên Tổng quan và trang Cần duyệt không nói khoản gì (phụ thu nhận sớm), căn nào; lý do chỉ có ở trang Cần duyệt. Hộp xác nhận có đủ số tiền nên chưa sai tiền | Thẻ xếp dọc ở khổ hẹp (tiêu đề – số tiền – lý do – nút); ghi rõ "Miễn phụ thu nhận sớm · 375.000 đ · 102 · The Fern · Khách quen / VIP" như hi-fi H24 |
| **P-04** | **BE-C** (hoặc MOB) | **Việc "Bổ sung minibar" không có tên món**: thẻ ghi "Bổ sung minibar: 1, 1" (ảnh 27). API `hk-tasks` trả `refillItems: [{itemId, quantity}]`, không có tên. Buồng phòng không biết mang món gì, phải mở tủ hoặc gọi lễ tân | Trả kèm tên món (VI/EN) trong `refillItems`, hoặc PWA tra danh mục; hiện "1 Bia Larue lon, 1 Coca-Cola lon" như EP07-08 mục 3.2 |
| **P-05** | **MOB** | **Báo sự cố có ảnh khi mất mạng → phiếu tạo ra không có ảnh.** Trình tự đã thử: mất mạng → gửi báo sự cố kèm 1 ảnh → tải lại app (máy chủ còn lỗi) → máy chủ lên lại → hàng đợi gửi ảnh (`attachments` 201) rồi gửi phiếu (`work-orders` 201) với `photoAttachmentIds: []`. WO-00001 không có ảnh; kỹ thuật không thấy ảnh. Báo sự cố khi có mạng thì ảnh vào đủ (WO-00002 có 1 ảnh). UXR mới thử 1 lần, có tải lại app giữa chừng | MOB kiểm việc gắn mã ảnh vào phiếu sau khi hàng đợi nạp lại từ IndexedDB (`dependsOn`/`ATT_REF` trong `queue.ts`); thêm ca test "offline + reload + có ảnh" |
| **P-06** | **FE-B** (+ UXD) | **"Khai báo quá hạn: 5 đơn – làm ngay" trên điện thoại chủ đầu tư là ngõ cụt**: mở `/registration` → "Máy này chưa được cấp quyền", không có danh sách đơn (ảnh 23). Mục đỏ quan trọng nhất của J6 không cho biết là đơn nào để nhắc lễ tân | Trên máy chưa cấp quyền vẫn hiện danh sách không có dữ liệu giấy tờ: căn, mã đơn, tên gọi, hạn, người đang xử lý; dòng "Mở giấy tờ trên máy quầy" |

### Mức 2

| ID | Vai sửa | Vấn đề và bằng chứng | Đề xuất |
|---|---|---|---|
| P-07 | MOB | Bộ đếm hàng đợi lệch: nút tròn ghi "1 thao tác đang chờ gửi", danh sách ghi "Đang chờ gửi (2)"; dòng thứ 2 hiện "Bấm lúc 09:11 Bấm lúc 09:11" (lặp, thiếu trạng thái) – ảnh 08 | Một nguồn đếm; dòng thứ 2 ghi "Chờ lượt" |
| P-08 | MOB + UXD | "Cần xem lại" hiện mã kỹ thuật: "Máy chủ không nhận thao tác này (mã VALIDATION_FAILED). Báo lễ tân nếu căn vẫn cần cập nhật." – ảnh 13. Không có nút làm lại | Câu thường theo từng mã; với trạng thái buồng thêm nút "Gửi lại 'Dọn xong'" (lấy giờ hiện tại) |
| P-09 | MOB | Mở lại app khi máy chủ trả 5xx (bảo trì, api tắt) → màn đăng nhập, không dùng hồ sơ đã lưu, không nhắc thao tác đang chờ (ảnh 12). Chỉ lỗi mạng thật mới vào chế độ đọc offline | Coi 502/503/504 lúc khởi động như mất mạng; màn đăng nhập ghi "Còn n thao tác chờ gửi trên máy" |
| P-10 | MOB | Kiểm phòng: tick đủ 11/11 mục bắt buộc mà "Kiểm đạt – sẵn sàng" vẫn khóa; phải tick thêm "Ảnh phòng" (không bắt buộc, và tick không chụp ảnh) – ghi nhận sai. `InspectionPage.tsx` đếm mọi mục không phải ảnh, bỏ qua `required` – ảnh 19 | Chỉ đếm mục `required`; mục "Ảnh phòng" với người kiểm FDL+ là nút chụp tùy chọn, không phải ô tick |
| P-11 | BE-C + MOB | Phiếu đã sửa xong: ảnh **sau khi sửa** hiện dưới nhãn "Ảnh lúc báo"; ghi chú "Đã làm gì" không hiện. API `getWorkOrder` trả ảnh sau sửa trong `photoAttachmentIds`, không có trường riêng; DB tách đúng (`done_photo_attachment_ids`) – ảnh 17 | API trả 2 trường; PWA có 2 khối "Ảnh lúc báo" và "Ảnh sau khi sửa" + "Đã làm: …" |
| P-12 | MOB (+ BE-C) | Nhóm "Làm trước – có khách đến hôm nay" chứa thẻ 103 ghi "Có khách đến ngày mai" – tự mâu thuẫn (ảnh 27) | Tên nhóm theo đúng bậc ưu tiên (ví dụ "Làm trước"), hoặc chỉ đưa vào nhóm khi có khách đến hôm nay |
| P-13 | MOB | Việc đã bỏ ("Khách không muốn dọn") biến mất khỏi "Việc của tôi", toast không ghi căn; thẻ "Đã xong" của việc bổ sung minibar lại hiện trạng thái căn "Cần dọn (khách đã đi)" (ảnh 35) – dễ hiểu nhầm căn đã dọn | Nhóm "Đã bỏ (n)" có lý do; thẻ "Đã xong" ghi tên việc ("Bổ sung minibar – xong 09:26") |
| P-14 | MOB + UXD + SEC | Ảnh chụp chỉ hiện ô "Ảnh 1", không xem trước (cố ý vì an toàn) – buồng phòng không biết ảnh mờ hay chụp nhầm căn (ảnh 10) | SEC/UXD xem lại: xem trước trong bộ nhớ, thu hồi ngay khi gửi xong |
| P-15 | MOB + OPS | "Sự cố gấp? Gọi lễ tân ngay, đừng chờ." nhưng không có nút gọi (bản dựng không có `VITE_DESK_PHONE`) – ảnh 11 | Bắt buộc cấu hình số lễ tân khi triển khai; thiếu thì ghi rõ số ở màn Tôi |
| P-16 | MOB + UXD | Báo sự cố xong: "Bảo trì đã thấy phiếu. Bạn không cần làm gì thêm." – lúc đó kỹ thuật chưa xem | "Đã gửi tới bảo trì (WO-00002). Bạn không cần làm gì thêm." |
| P-17 | FE-A + UXR | Khung đơn (Desk): dòng "Cơ sở phí hủy (cọc theo tiền phòng hiện tại)" hiện cả với đơn OTA đã trả và khách đang ở; "Còn phải thu" xuất hiện 2 lần (tạm tính và cuối); câu "Mở được từ 23:00 và sau khi ghi kết quả liên lạc." đứng đầu khung, không nói là của nút "Đánh dấu không đến" – ảnh 24. Hướng dẫn KB5 còn ghi "Cọc cần thu 0" | FE-A: ẩn dòng cơ sở phí hủy khi không áp dụng, một dòng "Còn phải thu"; đặt câu 23:00 cạnh nút. UXR: sửa câu mong đợi KB5 trong `demo-1-guide.md` khi có lượt sửa hướng dẫn |
| P-18 | FE-A | Trả phòng bước Minibar ở 1366×768: bảng rộng 633 px trong khung 588 px, cột "Tiền" bị cắt ("Mi…") – ảnh 26. 1366 px là màn quầy giả định H-02 | Thu cột "Chuẩn", rút chữ tên món, hoặc cho cột Tiền xuống dòng |
| P-19 | FE + UXD | Nhật ký thao tác tiền: cột Lý do hiện câu tiếng Anh của lập trình "FOC on the current line of its key (BR-434)"; dòng "Gửi yêu cầu duyệt" không hiện lý do lễ tân chọn ("Khách quen / VIP") – ảnh 31. Cùng họ BUG-R2-100 | Gộp vào S4-50/BUG-R2-100: câu VI/EN cho mọi lý do hệ thống; hiện lý do người dùng chọn |
| P-20 | FE-B | H24 ở 390 px: tiêu đề "Tổng quan / Đêm nay 18/10" bị bóp mỗi dòng 1 từ vì tên người dùng chiếm chỗ; menu người dùng: ô Giao diện (Theo máy/Sáng/Tối) đè lên nhãn – ảnh 21, 22 | Khổ hẹp chỉ hiện chữ cái đầu (avatar); ô chọn giao diện xuống dòng dưới nhãn |
| P-22 | FE-B | Tham số: lưu 35 % hiệu lực 19/10 xong, bảng vẫn chỉ "30 %", "Sửa gần nhất 08:38"; lịch sử không có cột "Hiệu lực từ" – chủ đầu tư không thấy có thay đổi đang chờ | Thêm nhãn "35 % từ 19/10" ở dòng tham số; thêm cột Hiệu lực vào lịch sử |
| P-23 | FE + UXD | Chờ đối soát: "Đã khớp sao kê" 1 chạm, không xác nhận, không hoàn tác; câu đầu trang nói về "tiền mặt sale nhận" trong khi danh sách là chuyển khoản | Toast có Hoàn tác 10 giây (như PWA); câu đầu trang theo loại khoản |
| P-24 | OPS | `demo-up.sh` (`umask 077` + `git archive | tar -x`) làm `manifest.webmanifest`, `sw.js` trong image `ottimo-web:demo` có quyền 0600 → Caddy trả `index.html` → PWA trên stack demo không cài được, không có service worker. Image CI bình thường | `chmod -R go+rX` thư mục nguồn trước `docker build`, hoặc `COPY --chmod` trong Dockerfile.web |
| P-25 | UXD + MOB (chờ INV) | `manifest.webmanifest` chưa có icon → Chrome Android không gợi ý "Cài ứng dụng"; nhân viên thật sẽ phải dùng như trang web. Phụ thuộc logo SVG INV chưa gửi (S4-49/B6) | Giữ nhắc INV gửi SVG (đã có trong việc chờ INV); trước buổi thử với nhân viên thật cần có icon |
| P-29 | MOB | "Các căn" ở 360 và 390 px (chế độ sáng): chữ trạng thái tràn khỏi viền chip ở 8/10 thẻ ("Khách đang ở – đã dọn") – ảnh 14, 34. **Đã có thẻ FB-R2-UXD-MOB-S4-03** (UXD đo ở chế độ tối) | Sửa theo thẻ UXD; UXR xác nhận cả chế độ sáng, cả 360 px |

### Mức 1

| ID | Vai sửa | Vấn đề | Đề xuất |
|---|---|---|---|
| P-21 | FE-B | "Khai báo lưu trú hôm nay: 4 đơn – hạn sớm nhất" kết thúc lửng khi chưa khách nào nhận phòng (sau khi có khách thì hiện "23:00") – ảnh 21 | Bỏ vế "hạn sớm nhất" khi chưa có hạn |
| P-26 | FE-A + UXD | Nhận phòng bước 4: câu "…bật 'Khách nhận sớm' ở bước 4" hiện ngay ở bước 4; hộp xác nhận không nhắc yêu cầu miễn phụ thu đang chờ duyệt | Sửa câu; thêm dòng "Đã gửi xin miễn 375.000 – chờ duyệt" vào hộp xác nhận |
| P-27 | MOB | Thanh dưới: "Việc của tôi" xuống 2 dòng và sát mép trái ở 360 px; vào căn từ "Việc của tôi" thì thanh dưới lại sáng mục "Các căn" | Thêm lề trái, nhãn ngắn "Việc"; giữ mục đang đi |
| P-28 | MOB + UXD | Lỗi mạng ở màn đăng nhập: "…rồi bấm Thử lại" nhưng nút ghi "Đăng nhập" | "…rồi bấm Đăng nhập lần nữa" |
| P-30 | UXD | Checklist kiểm phòng có chữ tiếng Anh "Amenity"; P3 không đọc tiếng Anh. Tiêu đề rỗng việc "Hết việc rồi!" dùng dấu cảm thán (màn nội bộ – không trái guideline nhưng lệch giọng điềm tĩnh) | "Đồ dùng phòng tắm (amenity)"; "Đã xong việc hôm nay." |
| P-31 | MOB | Báo sự cố khi mất mạng: 2 banner chồng nhau (banner chung + banner riêng của form) chiếm ~230/844 px trước ô đầu tiên – ảnh 09 | Bỏ banner chung trên màn này, giữ banner riêng |
| P-32 | FE | Folio: "Miễn phí -375.000" dùng gạch nối, dòng khác dùng dấu trừ "−1.500.000" | Dùng một ký tự dấu trừ |
| P-33 | MOB + DOM/SEC | Thẻ việc ghi "Khách: Phạm Gia Huy · 101" – lặp số căn; hiện họ tên đầy đủ trong khi EP07-08/rbac D01 nói "tên gọi" | Bỏ "· 101"; DOM/SEC xác nhận buồng phòng thấy tên gọi hay họ tên |
| P-34 | FE-A + UXD | Chữ nội bộ lập trình trên màn lễ tân: "Dùng 'Trả muộn' ở drawer đơn" | "…ở khung chi tiết đơn" |

## 4. Kiểm tra theo brand OTTIMO

| Mục | Kết quả |
|---|---|
| Màu | Đo trên H19, H20, H24 bằng màu tính được của trình duyệt: nền Ivory #F4F0E8, Cream #EDE6D8; chữ Ink #2B2B28, Stone Grey #6B6760; nhấn Earth Brown #7A5C44. Ngoài bảng chỉ có màu chức năng: cam cảnh báo #8A5214/#F5E8D3, xanh "Trực tiếp"/"Đã đủ" #356B49/#E2EEE5, đỏ nhạt #F7E5E2, nền thẻ #FBF9F4 (gần trắng – guideline cho phép White), viền #E0D8CA/#857E71 – khớp nhóm ngoại lệ chức năng UXD đã ghi. `theme-color` tối #1B1A18 (không có trong bảng; Ink là #2B2B28) – UXD xem có cần ghi ngoại lệ |
| Font | Lora cho tiêu đề và số căn; Be Vietnam Pro cho nội dung; JetBrains Mono cho mã đơn/mã phiếu (OTM-00007, WO-00001). Tự host, không gọi CDN. Đúng guideline |
| Tên phòng | Nhân viên thấy "401 · The Pine" (BR-012) ở PWA và Desk. Đúng |
| Logo | Wordmark "OTTIMO" dựng bằng chữ Lora giãn cách + "Staff"; chưa có SVG và icon PWA (P-25) |
| Giọng văn | PWA và Desk (nội bộ) viết tiếng Việt, câu ngắn, lịch sự, không emoji (quét `strings-vi/en.json`: 0 emoji). Lệch nhẹ: chữ kỹ thuật/tiếng Anh nội bộ lọt ra màn hình (P-08 mã lỗi, P-19 câu tiếng Anh, P-34 "drawer", P-30 "Amenity"); một câu cảm thán "Hết việc rồi!" |
| Chữ khách nhìn thấy | Lượt này không đi màn khách (KB9 không thuộc phạm vi) |

## 5. Đề xuất cho UXD và MOB (và vai liên quan)

Ưu tiên theo thứ tự, phần "trước cổng S4" là ý kiến UXR – PO/QC quyết.

**Nên xong trước cổng S4 hoặc trước buổi thử với nhân viên thật**
1. **BE-C + MOB – P-01, P-08**: sửa mốc so `performedAt`; câu "Cần xem lại" bằng lời thường và có nút gửi lại. Đây là điều kiện để đưa PWA cho buồng phòng thật thử offline.
2. **MOB – P-05**: ảnh của báo sự cố offline phải đi cùng phiếu.
3. **BE-C/MOB – P-04**: tên món cần bổ sung minibar.
4. **FE-B + UXD – P-02, P-03, P-06**: thanh dưới cho Desk khổ điện thoại theo hi-fi H24; thẻ Cần duyệt xếp dọc, ghi rõ khoản và căn; "Khai báo quá hạn" hiện danh sách không có giấy tờ trên máy chưa cấp quyền. Không có 3 việc này thì J6 chỉ dừng ở "xem", chưa "làm".

**Tuần Ổn định nếu kịp, không thì đầu R3**
5. MOB: P-07, P-09, P-10, P-12, P-13, P-29 (thẻ UXD đã có).
6. BE-C + MOB: P-11 (ảnh sau sửa, ghi chú kết quả).
7. FE-A: P-17, P-18 (folio và bảng minibar ở 1366).
8. FE/UXD: P-19, P-22, P-23 (nhật ký tiền, tham số, đối soát).
9. OPS: P-24 (quyền tệp trong image demo) – nhỏ nhưng nếu INV thử PWA trên stack demo sẽ gặp ngay.

**UXD (chữ, thiết kế)**
10. Duyệt câu cho P-08, P-16, P-28, P-30, P-34; quyết P-14 cùng SEC; ghi ngoại lệ màu `theme-color` tối.
11. Bổ sung vào hi-fi H22: khối "Ảnh sau khi sửa" + "Đã làm" tách khỏi "Ảnh lúc báo".

**UXR tự làm tiếp (không cần ai giao thêm)**
12. Khi P-01/P-05 sửa xong: đi lại T6, T7 trên stack `ottimo-uxr` (cùng cách giả lập).
13. Sửa câu mong đợi KB5 trong `demo-1-guide.md` ở lượt sửa hướng dẫn tiếp theo.
14. Thêm J5, J6 vào `product/docs/research/journeys.md` (đang thiếu, thẻ FB-R1-UXD-UXR-13).

## 6. Phần chưa làm trong lượt này

- Mở app khi đang mất mạng (vỏ app từ service worker), Background Sync, thông báo đẩy: Browser pane không chạy service worker – cần điện thoại thật hoặc Chromium có service worker (QA T5).
- Đếm minibar trên PWA (H20.4): chưa có trong sản phẩm.
- Đo số lần nhập mật khẩu/xác thực lại mỗi ca (SEC-10, plan R2 mục 4): không thuộc việc ORC giao lần này.
- `product/docs/research/usability-report-r2.md` (đầu ra plan R2) **chưa tồn tại**; tệp này là bản ghi của lượt đi thử S4. ORC quyết có cần gộp vào `usability-report-r2.md` không.
