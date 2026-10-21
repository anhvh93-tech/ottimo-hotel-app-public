# R-3 – Lượt chạy tay A1 có ghi hình (QA, Round 2 – Bước 4 sau cổng QC Round 2)

- Căn cứ: `rounds/round-02/qc/round-qc-gate.md` mục 5, dòng R-3. Lượt này **làm lại trên staging** ở R-6 khi có VPS.
- Ngày chạy: 21/10/2026, 10:45–10:47 (giờ VN), lượt sạch cuối cùng. Trước đó QA đi thử 5 lượt trên cùng stack để dò màn hình (mục 4).
- Người chạy: QA.
- Kết luận: **A1 đi trọn 12 chặng, Đạt.** Tiền khớp oracle. Có 3 lỗi mới, đều P3 (BUG-R2-214, 215, 216), không chặn luồng.

## 1. Môi trường (stack ngang CI)

| Mục | Giá trị |
|---|---|
| Mã nguồn | `git archive 72895de product` (main, `72895de2b068`), không sửa |
| Stack | Compose project riêng `ottimo-qa-r2a1`, ảnh riêng `ottimo-api:qa-r2a1` / `ottimo-web:qa-r2a1` (`INCLUDE_TEST_SUPPORT=1`, như CI). Cổng: api 47000, desk 47081, PWA 47082, guest-web 47083, PostgreSQL 47432. Không đụng demo (8181–8183), dev (3000/8081) hay stack của vai khác |
| CSDL | **Mới**: `down -v` rồi `up`, migration đầy đủ, nạp seed DS-E (dữ liệu giả). Lượt chính là lượt đầu tiên trên CSDL này (đơn `OTM-00001`) |
| Bí mật | `infra/ci/make-ci-env.sh` sinh ngẫu nhiên (như CI), lưu ở scratchpad, quyền 0600, không in, không vào repo. Origin bật như CI (`API_*_BASE_URL` = localhost:4708x) |
| Đồng hồ | MutableClock của stack (như project `desk-clock` trên CI). Dùng ngày thật: đặt 21/10, đến thứ Hai 26/10, đi 02/11/2026 |
| Trình duyệt | Playwright 1.63, Chromium headless. Desk 1366×768, guest-web và PWA 390×844 (cảm ứng). Mỗi người dùng một ngữ cảnh riêng, ghi video riêng |

**Cách chạy.** QA đi từng bước trên giao diện thật, bấm thật, tới API thật. Mỗi bước có ảnh chụp toàn trang; mỗi người dùng có một video. Bước đi được ghi lại thành script để lượt staging (R-6) lặp lại y hệt. Chỉ phần dựng nền (tạo hồ sơ khách giả, tài khoản nhận VietQR, buồng sạch ban đầu, tua đồng hồ giữa các ngày) làm bằng API test-support, giống ca CI TC-X-070.

**Khác ca tự động TC-X-070:** lượt này có thêm chặng **check-in online** (Desk tạo link, khách gửi ảnh CCCD trên guest-web) và chặng **lưu trú** (ngày thứ 3). Nhận phòng đúng giờ chuẩn 14:00, không xin FOC. Nhờ vậy lượt này đi được đường "giấy tờ khách gửi qua app → lễ tân nhập thông tin", đường mà TC-X-070 không đi.

## 2. Kết quả theo chặng

| # | Chặng | Ai | Kết quả | Ảnh |
|---|---|---|---|---|
| 1 | Báo giá: tìm căn trống 26/10, 7 đêm, 1 người lớn → báo giá căn 202 | qa.sal | Đạt – tổng 5.205.000 (BR-107-01), cọc 1.600.000 (BR-305-01) | 01–03 |
| 2 | Giữ chỗ + VietQR cọc | qa.sal | Đạt – đơn `OTM-00001` `hold`, QR 1.600.000, nội dung `OTM00001` (BR-521). Số tiền và nội dung in 2 lần → **BUG-R2-216** | 04–05 |
| 3 | Xác nhận cọc = chính giao dịch QR | qa.fd | Đạt – `confirmed`, đã cọc 1.600.000 | 06–08 |
| 4 | Tạo link check-in online trên Desk | qa.fd | Đạt – link guest-web, hết hạn 03/11 12:00. Token đã che trên ảnh | 09 |
| 5 | Khách check-in online (tối 25/10) | khách (điện thoại) | Đạt – trang lưu trú, thông báo dữ liệu, gửi ảnh CCCD (ảnh giả 16×16), chọn giờ đến, đồng ý lưu ảnh (không chọn sẵn), hoàn tất | 10–15 |
| 6 | Nhận phòng 14:00 ngày 26/10 (H13 4 bước) | qa.fd | Đạt. Giấy tờ khách gửi hiện "Khách đã gửi trước qua app", 0/1 (đúng: chưa có số). Chip "Cần nhập thông tin" đè nút "Xem đủ số / ảnh" → **BUG-R2-214**. Bấm "Sửa" → hộp nhập lại mật khẩu (step-up) → chọn người đứng tên, nhập số/họ tên/ngày sinh (giả) → `PATCH …/documents/:id` 200 → 1/1. Kiểm tra → Khai báo sau → thu tiền mặt 3.605.000 cùng lệnh nhận phòng → `in_house` | 16–25 |
| 7 | Lưu trú (28/10): mở đơn Đang ở, xem Sơ đồ phòng | qa.fd | Đạt – folio còn phải thu 0; căn 202 OC trên sơ đồ | 26–27 |
| 8 | Trả phòng bước 1 Minibar (11:00 ngày 02/11): 2 bia, 1 snack, 2 nước | qa.fd | Đạt | 28 |
| 9 | Trả phòng bước 2 Phụ phí / giờ trả | qa.fd | Đạt – không phụ thu (trả trước 12:00) | 29 |
| 10 | Bước 3 Bill → VietQR 100.000 → ghi nhận đã nhận → Hoàn tất | qa.fd | Đạt – bill 5.305.000 = 5.205.000 + minibar 100.000 (BR-702-01); `checked_out`, folio `settled`, số bill `F26-000001`, còn phải thu 0, đã thu 5.305.000 = cọc + tiền mặt + QR | 30–35 |
| 11 | PWA buồng phòng: Bắt đầu dọn → Dọn xong | qa.hk | Đạt – VD → CL → VC (qua 10 giây hoàn tác). Việc "Bổ sung minibar" nằm dưới "Khách đang ở" dù khách đã đi → **BUG-R2-215** | 36–39 |
| 12 | PWA lễ tân trưởng: kiểm phòng theo checklist + ảnh → Kiểm đạt | qa.fdl | Đạt – VC → **VI**; Desk sơ đồ phòng ghi 202 "VI · Đã kiểm, sẵn sàng" | 40–43 |

**Tiền (đối chiếu `br-examples.json`):** tiền phòng 5.205.000 · cọc 1.600.000 · thu khi nhận 3.605.000 · minibar 100.000 · tổng đã thu 5.305.000 · còn phải thu 0. Không lệch.

## 3. Bằng chứng (ngoài repo)

Thư mục gốc: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/qa-r2a1/evidence/`. Thư mục scratchpad của phiên, không đưa vào git. Dữ liệu đều giả: khách "Nguyen Thi Qlogsb", CCCD ngẫu nhiên, ảnh giấy tờ 16×16. Không có mật khẩu hay khóa trong ảnh/video.

- `run-log.md`: nhật ký lượt chạy (ngày, mã đơn, request ghi chính, trạng thái sau từng chặng).
- `screens/` – 43 ảnh toàn trang:

| Ảnh | Ảnh | Ảnh |
|---|---|---|
| 01-sale-tim-can-trong | 16-nhan-phong-b1-giay-to | 31-tra-phong-vietqr |
| 02-bao-gia | 17-nhan-phong-step-up | 32-tra-phong-da-thu |
| 03-bao-gia-da-luu | 18-nhan-phong-sua-giay-to-app | 33-tra-phong-xac-nhan |
| 04-giu-cho-hop | 19-nhan-phong-nhap-thong-tin | 34-tra-phong-xong |
| 05-giu-cho-vietqr-coc | 20-nhan-phong-giay-to-du | 35-don-da-tra-phong |
| 06-don-giu-cho-chi-tiet | 21-nhan-phong-b2-kiem-tra | 36-pwa-buong-phong-viec |
| 07-xac-nhan-coc-hop | 22-nhan-phong-b3-khai-bao | 37-pwa-bat-dau-don |
| 08-don-da-xac-nhan | 23-nhan-phong-b4-thu-tien | 38-pwa-dang-don |
| 09-link-check-in-online | 24-nhan-phong-xac-nhan | 39-pwa-don-xong |
| 10-khach-trang-luu-tru | 25-nhan-phong-xong | 40-pwa-kiem-phong-checklist |
| 11-khach-thong-bao-du-lieu | 26-luu-tru-don-dang-o | 41-pwa-kiem-phong-du |
| 12-khach-giay-to-da-gui | 27-luu-tru-so-do-phong | 42-pwa-kiem-dat-VI |
| 13-khach-gio-den | 28-tra-phong-b1-minibar | 43-desk-so-do-phong-cuoi |
| 14-khach-dong-y | 29-tra-phong-b2-phu-phi | |
| 15-khach-check-in-online-xong | 30-tra-phong-b3-bill | |

- `video/` – 9 video WebM, mỗi người dùng một video, tổng khoảng 4 MB: `01-sale-bao-gia-giu-cho`, `02-le-tan-xac-nhan-coc-link`, `03-khach-check-in-online` (390×844), `04-le-tan-nhan-phong`, `05-luu-tru`, `06-le-tan-tra-phong`, `07-pwa-buong-phong-don` (390×844), `08-pwa-le-tan-truong-kiem` (390×844), `09-desk-so-do-cuoi`.
- `qa-a1-manual.spec.ts`, `run.sh`: script đi lại đúng các bước, để lặp lại trên staging (R-6): đổi `E2E_*_URL`, bỏ phần tua đồng hồ nếu staging không có test-support.

Ghi chú che dữ liệu: ảnh 09 đã che token của link khách và mã QR. Video `02-…` có thể còn khung hình link trong chưa tới 1 giây trước khi che. Link đó thuộc stack dùng một lần, CSDL sẽ xóa, đơn là đơn giả. Nếu chuyển video ra ngoài máy này thì cắt đoạn đó trước.

## 4. Những gì chưa kiểm hoặc làm khác

- **Không phải staging.** Stack chạy trên localhost của máy QA, HTTP, Caddyfile.dev. Cookie `__Host-`, HTTPS, Caddy production chưa đi qua. Phần này làm ở R-6.
- **Đồng hồ được tua** giữa các ngày (đặt → đêm trước khi đến → ngày đến → ngày 3 → ngày đi), giống CI. Chưa đi qua job tự chạy theo thời gian thật (nhắc giữ chỗ, J8 lúc 06:00).
- Khai báo lưu trú chọn "Khai báo sau". Không đi cổng Bộ Công an (R2 làm tay ngoài hệ thống).
- Thanh toán VietQR là đối soát tay ("ghi nhận đã nhận"), không có ngân hàng thật (đúng phạm vi R2).
- 5 lượt dò trước lượt sạch đi trên cùng stack, CSDL cũ (đơn `OTM-00001…00006`, ngày ảo 2027). Các lượt đó chỉ để tìm đúng nút và đúng hộp, không tính kết quả. Lượt chính chạy trên CSDL dựng lại từ đầu.
- Chặng đầu dừng ở hộp step-up vì script ban đầu chưa xử lý hộp này. Đây là hành vi đúng (SEC: xem/sửa giấy tờ C3 phải nhập lại mật khẩu), không phải lỗi.

## 5. Lỗi mới

| Mã | Mức | Tóm tắt | Vai |
|---|---|---|---|
| BUG-R2-214 | P3 | H13: chip "Cần nhập thông tin" đè nút "Xem đủ số / ảnh" ở giấy tờ khách gửi qua app (1366×768) | FE (+ UXD) |
| BUG-R2-215 | P3 | PWA: việc "Bổ sung minibar" vẫn nằm dưới "Khách đang ở" sau khi khách trả phòng (`apps/mobile/src/app/tasks.ts:60`) | MOB (+ UXD) |
| BUG-R2-216 | P3 | H12 hộp Giữ chỗ: số cọc và nội dung chuyển khoản in 2 lần (`QuoteDialog.tsx:662–674` + `DepositQr`) | FE (+ UXD) |

Chi tiết trong `bug-list.md` (bảng mục 1, mục 11.42). Không có lỗi P0/P1/P2 mới, không có lệch tiền.
