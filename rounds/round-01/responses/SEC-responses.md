# SEC – Phản hồi thẻ review Round 1 (Bước 4)

- Người trả lời: SEC | Ngày: 15/10/2026
- Thẻ nhận được: `reviews/ARC-on-SEC.md` (FB-R1-ARC-SEC-01…10). Không có thẻ gửi SEC ở file review khác.
- Căn cứ thêm: PHÂN XỬ ORC trong `01-decisions/decision-log.md` (nhận phòng khuya; khách không có email), dòng DOM + SEC về mã sinh nhật, dòng DOM/BA về lưu ý sức khỏe D12.
- Tài liệu đã sửa: `product/docs/security/security-requirements.md` (v0.2), `threat-model.md` (v0.2), `data-risk-assessment.md` (v0.2).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-ARC-SEC-01 (Major) | Done | Chuyển chuẩn hóa ảnh lên client: guest-web/admin-web vẽ vào `canvas`, xuất JPEG ~0,85, cạnh dài ≤ 2.500 px. Server chỉ nhận JPEG/PNG/WebP (magic bytes), HEIC gửi thẳng → `422 FILE_REJECTED` kèm hướng dẫn "chụp bằng nút Chụp trong app"; server **vẫn** mã hóa lại bằng `sharp` bản dựng sẵn (không cần HEVC), `limitInputPixels` 40 MP, xử lý 1–2 ảnh đồng thời cho vừa RAM. SR-FILE-01, SR-FILE-03, TM-16. Giả định chưa xác minh: Safari iPhone giải mã HEIC vào `canvas` – MOB/QA thử trên máy thật R2 (ghi ở threat-model mục 11) |
| FB-R1-ARC-SEC-02 (Minor) | Done | MVP không nhận PDF giấy tờ (máy scan xuất JPEG); SR-FILE-05 (ClamAV, kết xuất PDF) bỏ khỏi MVP, ghi "xem lại nếu bắt buộc nhận PDF, khi đó đánh giá lại RAM/gói VPS"; SR-C3-10 và SR-C3-03 chỉ còn ảnh |
| FB-R1-ARC-SEC-03 (Major) | Done | Theo PHÂN XỬ ORC: giữ nguyên nguyên tắc (không dùng mã đơn/4 số SĐT). Thêm **SR-GST-13**: mã xác minh lễ tân gửi qua hộp thư OTA (Airbnb/Booking/Agoda) hoặc Zalo của SĐT trên đơn – tham số `guest_verify_code_channels` **mặc định rỗng (tắt)**, chỉ OWN bật theo từng kênh; mã 6 số một lần, gắn token link đang hiệu lực, hết hạn 15 phút, lưu băm, tin riêng không chứa link, chỉ gửi vào hội thoại của đơn bằng Zalo của cơ sở, tối đa 3 lần/24 giờ/token, audit mỗi lần cấp. SR-GST-08: đếm sai chung theo token cho mọi loại mã. **SR-GST-14**: ô email không bắt buộc ở form Đặt phòng mới + nhãn "đơn chưa có email"; đổi email sau khi cấp link → không gửi OTP tới email mới trong 24 giờ. **SR-GST-15**: luồng khách đến khuya (check-in online trước, mức 2 trong giờ trực, mã cửa qua app/mẫu `door_code` – tức phương án (b) của thẻ, người trực đêm dùng thiết bị của cơ sở). Threat model: TM-21 cập nhật rủi ro còn lại; thêm **TM-61** (lừa lễ tân gửi mã, kênh bị chiếm/dùng chung – High → Medium); mục 9 thêm dòng cho INV; mục 6.4 sơ đồ luồng. Đề nghị UXR kiểm tỉ lệ khách có email ở dữ liệu thật vẫn giữ (UXR) |
| FB-R1-ARC-SEC-04 (Minor) | Done | SR-SECR-05(c) viết lại: adapter tiền **đang bật** (`PAYMENT_METHODS_ENABLED` / `BANKFEED_PROVIDER` ≠ `none`) mà ở `mock` → dừng khởi động; cổng không dùng đặt `off`, route không đăng ký; thêm ca test "VNPay production + MoMo off khởi động được". Phụ thuộc INT thêm giá trị `off` (FB-R1-ARC-INT-12) |
| FB-R1-ARC-SEC-05 (Minor) | Done | Chấp nhận, khớp PHÂN XỬ ORC. Thêm **SR-DEV-08**: thiết bị di động **của cơ sở** (tài khoản Apple/Google của cơ sở) mở admin-web được cấp với checklist di động (khóa ≤ 1 phút + PIN/sinh trắc, mã hóa, không app chat/tài khoản cá nhân, tắt đồng bộ ảnh/clipboard, "Tìm thiết bị" xóa từ xa, ở lại cơ sở), hạn ≤ 30 ngày (`device_kind`); **SR-DEV-09**: không bao giờ cấp cho máy cá nhân/PWA. SR-DEV-01 thêm `device_kind`. TM-46 cập nhật, thêm **TM-62** (mất/lạm dụng máy tính bảng của cơ sở – High → Medium). BA chọn phương án (a) cho FB-R1-ARC-BA-01 |
| FB-R1-ARC-SEC-06 (Minor) | Done | SR-LOG-06 đổi "giờ ca cấu hình" thành "ngoài khung `front_desk_hours` của cơ sở" (BR-811, erd 9.2 đã có tham số) |
| FB-R1-ARC-SEC-07 (Suggestion) | Done | Thêm **SR-KEY-10** (N, R3): KEK + `ID_HASH_KEY` ở tệp riêng `0400` ngoài thư mục dự án, nạp qua `secrets:` của Compose, loại khỏi sao lưu tệp. Kiểm khả thi chỉnh 2 điểm so với đề xuất: (1) chủ tệp phải là **UID chạy container** – container chạy user không root nên tệp `root:0400` không đọc được; (2) Compose không-swarm gắn secrets bằng bind mount chỉ đọc, **không** phải tmpfs. Ghi rõ không chống root trên máy đang chạy (TM-13 vẫn High); không làm mở khóa tay |
| FB-R1-ARC-SEC-08 (Suggestion) | Done | SR-BAK-04 ghi 2 cơ chế miễn phí: (a) PA2 máy phụ tự kéo qua SSH khóa chỉ đọc giới hạn `command=`, hoặc `restic rest-server --append-only`; (b) PA1 chỉ dùng object storage nếu xác nhận Object Lock/versioning + khóa không có quyền xóa (BizFly chưa xác minh). OPS chọn khi lấy báo giá |
| FB-R1-ARC-SEC-09 (Suggestion) | Done | SR-AZ-09 tách 2 lớp: lớp hành động tự sinh từ `x-roles` (seed chung 2 cơ sở, mọi operation); lớp phạm vi viết tay cho 10 tài nguyên chính ARC liệt kê |
| FB-R1-ARC-SEC-10 (Suggestion) | Done | SR-C3-09: step-up là **cửa sổ trượt 15 phút** tính theo thao tác C3/xác nhận lại gần nhất, không vượt hạn phiên, đổi ca xóa cửa sổ; đưa tổ hợp SR-SES-03 + SR-C3-09/10/11 vào kịch bản test khả dụng UXR R2 (đo số lần nhập PIN/ca), SEC chỉnh tham số sau khi có số liệu |

**Tổng: 10 thẻ – 10 Done, 0 Rejected, 0 Deferred, 0 Escalated. Major còn Open: 0 (01, 03 đều Done).**

## Việc khác theo chỉ đạo ORC (không có thẻ)
- Mã cửa sinh nhật: SR-LOCK-02, TM-38, DRA F05 thống nhất **`ddmm` + ≥ 3 số ngẫu nhiên**, bỏ ngoại lệ "+ 2 số khi khóa có khóa bàn phím". Lưu ý PO: ESC-011 phương án A vẫn ghi "+ 2 số ngẫu nhiên (ví dụ 1503**47**)" – cần sửa thành ≥ 3 số (ví dụ 1503**472**). SEC không sửa `02-escalations/`.
- Lưu ý sức khỏe (D12): thêm **Q11** vào DRA mục 12 (nhạy cảm? đồng ý riêng dạng nào? thời hạn? ai được thấy?) – **PO gom vào ESC-001**.
- Câu chữ "xóa bằng hủy khóa": sửa DRA mục 7 (đoạn yêu cầu kỹ thuật) và mục 13 – "hết đọc được trong hệ thống ngay; hết khỏi bản sao lưu sau ≤ 35 ngày; áp lại `purge_journal` sau khôi phục". Threat model và SR đã đúng từ trước.
- Kiểm khả thi các ý ARC (1 VPS, ≤ 1 tr/tháng, không KMS): mọi thay đổi bước 4 **không thêm chi phí** – `canvas` ở trình duyệt, `sharp` bản dựng sẵn, bỏ ClamAV (giảm RAM), Compose secrets, `restic rest-server`/SSH pull (cần VPS thứ hai đã nằm trong PA2 của OPS), mã xác minh qua kênh gửi tay (không ZNS). Máy tính bảng của cơ sở là chi phí thiết bị của INV (nếu chọn), không phải hạ tầng – nêu trong câu hỏi ESC-010.

## Dòng decision-log đề xuất
(ORC ghi khi chốt – SEC không sửa decision-log)

| Ngày | Round | Quyết định | Người quyết | Lý do / tham chiếu |
|---|---|---|---|---|
| 2026-10-15 | 1 | Ảnh giấy tờ chuẩn hóa sang JPEG ở client (canvas); server chỉ nhận JPEG/PNG/WebP và vẫn mã hóa lại bằng `sharp`; HEIC gửi thẳng → 422; MVP không nhận PDF giấy tờ, bỏ ClamAV | SEC (theo ARC) | FB-R1-ARC-SEC-01, -02; SR-FILE-01/03/05 |
| 2026-10-15 | 1 | Mã xác minh lễ tân qua hộp thư OTA/Zalo: tham số `guest_verify_code_channels` mặc định tắt, OWN bật theo kênh; mã 6 số một lần, gắn token, 15 phút, tin riêng không chứa link, chỉ gửi vào hội thoại của đơn bằng Zalo của cơ sở; đếm sai chung theo token | SEC (thực thi phân xử ORC) | FB-R1-ARC-SEC-03; SR-GST-08/13; TM-61 |
| 2026-10-15 | 1 | Ô email không bắt buộc ở form đặt phòng; đổi email sau khi cấp link → không gửi OTP tới email mới trong 24 giờ | SEC | SR-GST-14 |
| 2026-10-15 | 1 | Thiết bị di động **của cơ sở** mở admin-web được cấp C3 theo checklist di động, hạn ≤ 30 ngày; máy cá nhân và PWA không bao giờ được cấp | SEC (thực thi phân xử ORC) | FB-R1-ARC-SEC-05; SR-DEV-08/09; TM-62 |
| 2026-10-15 | 1 | Step-up C3 là cửa sổ trượt 15 phút theo thao tác C3 gần nhất; đo khả dụng ở R2 rồi chỉnh | SEC | FB-R1-ARC-SEC-10; SR-C3-09 |
| 2026-10-15 | 1 | Cổng thanh toán không dùng đặt `off`; production chỉ chặn khởi động khi adapter đang bật ở `mock` | SEC | FB-R1-ARC-SEC-04; SR-SECR-05 |
| 2026-10-15 | 1 | Cảnh báo xem C3 "ngoài giờ" dùng `front_desk_hours` (không có phân hệ ca ở MVP) | SEC | FB-R1-ARC-SEC-06; SR-LOG-06 |
| 2026-10-15 | 1 | (R3, nên có) KEK tách khỏi `.env`, nạp qua Compose secrets, loại khỏi sao lưu tệp; TM-13 vẫn High | SEC | FB-R1-ARC-SEC-07; SR-KEY-10 |
