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

## 7. Đi lại T6, T7 trên `72895de` – cổng QC Round 2 R-4, điều kiện C8 cổng S4 (21/10/2026, 10:24–10:38)

- Người làm: UXR | Bước: **Round 2 – Bước 4 (Phản hồi & sửa), việc R-4** (`qc/round-qc-gate.md` mục 5; `qc/s4-qc-gate.md` dòng C8).
- **Vẫn là đánh giá mô phỏng của đội AI** (UXR đóng vai Chú Bảy – P3 buồng phòng). Mất mạng là giả lập, không phải điện thoại thật mất sóng. Kết luận dưới đây **cần kiểm lại với 1–2 nhân viên buồng phòng thật trên điện thoại thật** theo `product/docs/research/real-user-check-guide.md` (ESC-003) trước khi cho dùng offline hằng ngày.
- Không sửa mã, không commit mã. Ảnh để ngoài git: `scratchpad/uxr-r2/shots/01…08-*.jpg` (scratchpad của phiên UXR 21/10).

### 7.1 Môi trường

- **Stack riêng `ottimo-uxr` dựng lại từ `72895de`** (gồm `e3b0efb` – ngày kinh doanh sau nửa đêm BUG-R2-211/212/213, PWA tải "Việc" và "Các căn" riêng từng phần). Bản `7ac11a4` cũ của UXR đã hỏng sau khi Docker khởi động lại (api lặp khởi động lại, postgres dừng) – UXR xóa container và volume của **riêng** `ottimo-uxr`.
  - Cách dựng: bản sao `infra/demo/demo-up.sh`, `lib.sh`, `docker-compose.demo.yml`, `seed-demo.mjs` trong scratchpad, đổi tên project `ottimo-uxr`, image `ottimo-api:uxr-r2`, `ottimo-api:uxr-r2-seed`, `ottimo-web:uxr-r2`, thư mục làm việc `~/.ottimo-uxr-r2`, cổng Desk 28181 / PWA 28182 / khách 28183 / api 127.0.0.1:23100. Dữ liệu dựng giống demo (DS-E + `seed-demo.mjs past/now`).
  - **Không đọc `product/.env`**: `VITE_DESK_PHONE` là số giả để build (chỉ để nút "Gọi lễ tân" hiện ra), `DEMO_ENV_FILE=/dev/null` (không có tài khoản nhận VietQR – không ảnh hưởng T6, T7). Tài khoản thử sinh trong phiên, lưu trong scratchpad (0600).
  - **Không đụng stack demo** (8181–8183, 3100) hay stack QA/FE/dev.
- Trình duyệt: Browser pane, khổ 390×844, vai HK `buongphong.hoa`.
- Giả lập mất mạng như lượt 18/10: `navigator.onLine = false` + sự kiện `offline`, cộng **dừng container api** (gateway trả 502). Mở lại app khi máy chủ lỗi = tải lại trang khi api đang dừng. Service worker vẫn không chạy trong pane (giới hạn mục 1 còn nguyên).
- Kiểm kết quả phía máy chủ bằng truy vấn đọc trên postgres của stack UXR (`room_status`, `hk_task`, `work_order`).

### 7.2 Kết quả

| # | Nhiệm vụ (HK, 390 px) | Kết quả | Mức | Ghi chú |
|---|---|---|---|---|
| **T6** | Mất mạng: "Bắt đầu dọn" (10:27:25) rồi "Dọn xong" (10:28:02) căn 401, có mạng lại lúc 10:28:29 | **Đạt.** Trên máy: chip "Đang dọn · Chờ gửi", rồi "Khách đang ở – đã dọn · Chờ gửi", hoàn tác 10 giây (ảnh 01, 02). Khi có mạng: 2 lệnh `status-transitions` đều **200**. Máy chủ: căn 401 `OC` (đã dọn), việc `stayover_clean` = done, `started_at` 10:27:25, `done_at` 10:28:02 – **đúng giờ bấm trên máy**. Danh sách việc: "1/3 xong", "Đã xong (1) – 401 … xong 10:28". | – | **P-01 đóng phía người dùng.** P-07 cũng đạt: nút tròn "1 thao tác" khi lệnh 2 còn trong 10 giây hoàn tác, sau đó "2" = tiêu đề danh sách "Đang chờ gửi (2)"; mỗi dòng 1 lần "Bấm lúc" + "Chờ mạng" |
| **T7** | Mất mạng: báo sự cố "Mất nước nóng" căn 401, 1 dòng mô tả, 1 ảnh, Gửi; tải lại app khi máy chủ còn lỗi; máy chủ lên lại | **Đạt về dữ liệu.** Form chỉ còn 1 banner (P-31 đạt), mức tự chọn "Gấp", sau Gửi: "Đã lưu trên máy – chưa gửi … Sự cố gấp? Gọi lễ tân ngay" và **có nút "Gọi lễ tân"** (P-15 đạt khi build có số). Tải lại khi api 502: **mở thẳng danh sách việc từ bản lưu**, ghi "Dữ liệu lúc 10:28" và "1 thao tác đang chờ gửi" (P-09 đạt, ảnh 05). Sau đồng bộ: **WO-00001 có 1 ảnh** (`attachments` 201 → `work-orders` 201). | – | **P-05 đóng phía người dùng.** Lặp lại lần 2 (T7b, căn 202, "Rò nước"): **WO-00002 có 1 ảnh**. Nhưng cả 2 lần, phiếu chỉ được gửi khi app được mở lại/đưa lên trước – xem **P-35** |
| T6/T7 phụ – BUG-R2-211 | Đặt giờ điện thoại giả 02:40 ngày 22/10 (máy chủ vẫn ngày kinh doanh 21/10), mở "Việc" và "Các căn" | **Đạt.** PWA gọi `hk-tasks` **không kèm ngày** (máy chủ tự lấy ngày kinh doanh). Tiêu đề "Hôm nay 21/10", danh sách việc và căn không đổi, không lỗi | – | Ghi nhận nhỏ, không mở mục: lúc 02:40 ngày 22 mà ghi "Hôm nay 21/10" có thể làm người trực đêm khựng lại; UXD cân nhắc chữ "Ngày làm việc 21/10" nếu có phản hồi từ nhân viên thật |
| "Các căn" tải riêng từng phần | Cho riêng `hk-tasks` lỗi 500 (chặn trong trình duyệt), rồi riêng `room-statuses` lỗi 500 | **Đạt về hành vi:** phần lỗi lấy bản lưu, phần kia vẫn hiện, không còn cả màn lỗi. **Vướng về báo hiệu** – P-36, P-37 | 2, 1 | Ảnh 08 |

### 7.3 Vấn đề mới

| ID | Mức | Người sửa | Vấn đề | Bằng chứng | Đề xuất |
|---|:-:|---|---|---|---|
| **P-35** | **2** | **MOB** | **Mở app lúc máy chủ không trả lời, rồi máy chủ lên lại: hàng đợi không tự gửi khi app vẫn đang mở.** Thao tác chỉ đi khi app được mở lại hoặc đưa lên trước. Trong lúc chờ, "Thao tác trên máy" ghi "tự thử lại lúc **10:32**" (giờ đã qua) và dòng phiếu ghi "**Đang gửi 1/1…**" dù không có yêu cầu nào đang chạy. Với phiếu "Gấp", kỹ thuật nhận trễ vài phút trong khi Chú Bảy tin là app đang gửi | T7b: api lên 10:32:36; IndexedDB: mục ảnh `attempts 2`, `nextAttemptAt` 10:32:42; danh sách việc vẫn tải lại được mỗi 60 giây (`hk-tasks` 200 lúc 10:33:27, 10:34:27, 10:35:27), nhưng **không có** `attachments`/`work-orders` cho tới 10:35:32 – ngay sau khi pane được hiện lại. Lần T7 đầu: api lên 10:29:46, phiếu đi 10:31:26, cũng ngay sau thao tác trên pane. Ảnh 06, 07. Giới hạn: pane bị ẩn trong lúc chờ, nên UXR chưa loại trừ hết khả năng trình duyệt hãm đồng hồ; tuy vậy đồng hồ tải lại 60 giây vẫn chạy đúng | MOB tái hiện bằng test: khởi động với 502 (`enter(cached, true)` không gọi `flush`) → máy chủ lên → đồng hồ `wake` có gửi không. Khi một lần tải dữ liệu thành công thì gọi `flush` luôn. Dòng trạng thái: "Chờ thử lại lúc hh:mm" thay cho "Đang gửi" khi không có yêu cầu đang chạy; không hiện giờ đã qua. Không chặn C8, nhưng **nên sửa trước khi cho nhân viên thật thử offline** |
| **P-36** | 2 | MOB + UXD | **Một phần không tải được thì gần như không có báo hiệu.** Khi danh sách việc lỗi còn danh sách căn tải được, màn "Việc" chỉ đổi dòng chữ nhỏ thành "Dữ liệu lúc 10:35"; không có câu nói việc mới chưa tải được, không có nút thử lại. Đúng tình huống BUG-R2-211 (một danh sách lỗi kéo dài): lễ tân giao việc mới, buồng phòng không thấy và không biết | Ảnh 08; 10:36–10:37, `hk-tasks` 500 do UXR chặn | Khối nhắc ngắn trên đầu danh sách: "Chưa tải được việc mới – đang hiện bản lúc 10:35. Thử lại" (UXD viết câu). Áp dụng tương tự cho "Các căn" |
| P-37 | 1 | UXD + SEC | Sau một lần danh sách việc lỗi, "Các căn" lấy bản lưu **không còn tên khách** ("Khách: Huy" biến mất ở 101) mà không giải thích. Đúng thiết kế SR-PWA-01 (chỉ giữ tên khách khi có việc mới), nhưng người dùng thấy như dữ liệu mất | 10:37:59, chặn `room-statuses` sau lần lỗi `hk-tasks` | Giữ quy tắc an toàn; nếu cần, thêm chữ nhỏ "Tên khách hiện lại khi tải được việc" – UXD/SEC quyết |

### 7.4 Kết luận cho C8

- **T6 đạt, T7 đạt** trên `72895de` (mô phỏng). **P-01 (mức 4) và P-05 (mức 3) đóng được từ phía người dùng**; cùng lượt xác nhận P-07, P-09, P-15 (khi build có số lễ tân), P-31 đã đạt.
- Mục mới: **P-35 (mức 2, MOB)**, P-36 (mức 2, MOB + UXD), P-37 (mức 1). Không mục nào mức 3–4 → **không chặn C8**. Đề xuất đưa P-35, P-36 vào backlog R3 trước buổi cho nhân viên thật thử offline.
- Chưa thử: điện thoại thật mất sóng, mở app khi đang mất mạng (service worker), mất mạng lâu hơn 5 phút hoặc lệch giờ máy > 5 phút, dọn trả phòng (`CL` → `VC`) offline. QA nên thêm ca "khởi động 502 → máy chủ lên → hàng đợi tự gửi" cho P-35.

### 7.5 Ghi chú vận hành (cho ORC/OPS)

- Lúc 10:20 và kiểm lại 10:40, **các stack dựng trước đó đều không chạy được** (trừ stack QA mới `ottimo-qa-r2a1` dựng khoảng 10:25): `ottimo-demo`, `ottimo-qa-s3`, `ottimo-qa-s4`, `ottimo-fe07`, `ottimo-dev` có api/worker lặp khởi động lại (`getaddrinfo ENOTFOUND postgres`), postgres đã dừng từ khoảng 1 giờ trước (có vẻ do Docker khởi động lại). **Stack demo cho chủ đầu tư hiện không dùng được.** UXR không chạm các stack này.
- Stack `ottimo-uxr` (`72895de`) vẫn chạy để MOB/QA tái hiện P-35. Tắt: `docker compose -p ottimo-uxr down -v` (cần `--env-file ~/.ottimo-uxr-r2/demo.env` và hai tệp `-f` như trong bản sao `lib.sh` ở scratchpad), xóa `~/.ottimo-uxr-r2`.
