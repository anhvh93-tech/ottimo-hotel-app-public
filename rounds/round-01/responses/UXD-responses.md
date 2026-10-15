# UXD – Phản hồi review Round 1 (Bước 4)

- Người trả lời: UXD | Ngày: 16/10/2026
- Thẻ nhận: `reviews/UXR-on-UXD.md` (16 thẻ), `reviews/PO-on-UXD.md` (7 thẻ), `outputs/QA/report.md` mục 4 (#8, #9, #13), tin ORC chuyển giữa bước (SEC: ô email, kênh gửi mã, thiết bị được cấp; DOM v0.2: BR-613 (c), BR-010, BR-436, BR-527).
- Áp dụng PHÂN XỬ ORC 15/10 (decision-log): nhận phòng khuya / ca tối; khách không có email.
- Tổng: **26 mục – 26 Done** (0 Rejected, 0 Deferred, 0 Escalated). Blocker/Major còn Open: **0**.

## 1. Thẻ UXR (`UXR-on-UXD.md`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-UXR-UXD-01 (Blocker) | Done | Theo PHÂN XỬ ORC: (1) L7 mục **7.2 "Đến muộn / tự nhận phòng"** – 4 khung: thẻ "Đến muộn?" khuyến khích làm thủ tục trước; hoàn tất thủ tục (xác minh mức 2 trong luồng) → mã cửa hiện ngay + hướng dẫn mở khóa; mã **xem lại được trong phiên** khi mạng yếu (sessionStorage – SEC chốt cách lưu); màn bị khóa/hết phiên có **Gọi người trực / Nhắn Zalo-WhatsApp** + ô nhập mã người trực cấp. (2) L3 mục **3.6 ca đêm trên thiết bị của cơ sở** (máy quầy / máy tính bảng của cơ sở đã cấp, mở admin-web); L1 1.4 thêm loại thiết bị; bỏ mục "Khai báo" khỏi thanh dưới điện thoại (L1, L2 2.5); bảng vai L1 1.2 sửa dòng `front_desk`. (3) Câu "ai trực, bằng thiết bị gì" để ORC gom vào ESC-010 (không tạo ESC mới). DS mục 6.11. |
| FB-R1-UXR-UXD-02 (Major) | Done | L2 2.2 thêm ô **Email (không bắt buộc)** + chip "Đơn chưa có email" (drawer, Hôm nay L1 1.3); L7 màn xác minh: chọn kênh nhận mã (email / tin nhắn OTA nếu owner bật), biến thể đơn không email hiện ngay "Gọi lễ tân" + "Nhắn Zalo/WhatsApp" (nút bấm được); L3 3.5 gửi mã qua tin nhắn OTA/Zalo (chỉ khi owner bật, mã 15 phút, tin riêng không kèm link); L10 10.3 màn owner bật/tắt kênh gửi mã (mặc định tắt). Giữ `autocomplete="one-time-code"`. |
| FB-R1-UXR-UXD-03 (Major) | Done | L8 thêm khung điện thoại 8.1 (Cần duyệt → Cần chú ý → 2 KPI → biểu đồ 14 ngày, cột ≥ 18px) và 8.2 duyệt PIN (nút 44px); cột biểu đồ `--oak-ink` (5,87:1) thay `--oak` 2,94:1, cột tương lai sọc + viền; nhãn ngày sửa liên tục 16/9 → 29/10. |
| FB-R1-UXR-UXD-04 (Major) | Done | `wf.css` khối "R1 bước 4": `.hk .toast .btn` 48px/17px (Hoàn tác), `.touch .toast .btn` 44px, `.hk .seg button` 48px, `.touch .seg button` 44px, `.hk .m-nav a` 16px, `.touch .m-nav a` 14px, `.touch .chip` 14px, `.hk .chip`/`.hk .alert`/nhãn ô nhập HK 16px, `.btn.sm` 44/48px ở điện thoại; chữ 15px inline trong L6 → 16px. DS mục 4 thêm dòng "đo bằng DevTools ở 360px cho mọi điều khiển HK". |
| FB-R1-UXR-UXD-05 (Major) | Done | Token mới `--focus-on-dark` (#F4F0E8 / #1B1A18: 12,08:1 trên `--bar-in`, 12,46:1 trên `--ink`), lớp `.on-dark` cho đầu trang app khách và toast; bảng DS 2.2 thêm 12 cặp focus/viền trên mọi nền có điều khiển. Nút khóa bỏ `opacity:.5` → nền `--surface-2`, chữ `--muted` (5,20:1), viền đứt. Chạy lại `gen_tokens.py`: **0 cặp không đạt**. |
| FB-R1-UXR-UXD-06 (Major) | Done | 6 chuỗi cứng trong khung khách đưa vào bảng chuỗi (`guest.chip.verified`, `guest.chip.doc_ok`, `guest.oci.person_n`, `guest.bill.line.room/minibar`, `guest.bill.usd`); lý do từ chối chọn từ danh sách đã dịch `guest.req.decline.*`, ghi chú tự do hiện dưới nhãn "Ghi chú của lễ tân (tiếng Việt)" + `lang="vi"`; RU: banner "Русская версия скоро" (`data-only-lang`); `wf.js` gắn `lang="en"` cho chuỗi dự phòng (sửa `lang="ru"` sai trên chữ tiếng Anh). Content-guide mục 6 + DS 6.12. |
| FB-R1-UXR-UXD-07 (Major) | Done | L1 mục **1.5**: đăng ký TOTP 3 bước (cài app → quét QR/khóa nhập tay → lưu 10 mã khôi phục, bắt tích "đã lưu"), màn dùng mã khôi phục, cảnh báo "chủ đầu tư duy nhất"; checklist cấp thiết bị tách 4 dòng có "Cách kiểm tra" hoặc "Đội kỹ thuật đã kiểm máy này"; nhãn riêng cho 3 loại mã (`auth.code_label.*`: TOTP 6 số / PIN 4–6 số / mã khôi phục 8 ký tự / mã cấp cho khách). Câu hỏi "bắt buộc owner thứ 2 / người khôi phục" chuyển PO + SEC (đề xuất dòng decision-log ở cuối). |
| FB-R1-UXR-UXD-08 (Minor) | Done | Bỏ mã BR khỏi giá trị 10 chuỗi (chuyển vào cột ghi chú); L4 bỏ "(BR-511)" ở hai ô phí. |
| FB-R1-UXR-UXD-09 (Minor) | Done | Một tên "Đã dọn – chờ kiểm" (`hk.status.VC`, `status.room.VC`), tông `oak` (khác `ok` "Sẵn sàng"); L6 màn lỗi có nút "Gửi lỗi cho lễ tân" (tự đính mã tham chiếu). DS 2.3 sửa tông VC. |
| FB-R1-UXR-UXD-10 (Minor) | Done | Chuỗi riêng `guest.offline_banner` (không hứa tự gửi); L7 bước 1 thêm biến thể "Đang gửi ảnh 2/2 – 60%", mạng yếu, nén ảnh, "Gửi lại ảnh". |
| FB-R1-UXR-UXD-11 (Minor) | Done | Rack L2 sinh lại: chip đầu dòng hiện mã + nhãn ("VC · Đã dọn, chờ kiểm", "OD · Có khách, cần dọn"…) kèm `title`. |
| FB-R1-UXR-UXD-12 (Minor) | Done | Chân modal Đặt phòng mới: "Hủy" → "Đóng (giữ nháp)" (`booking.close_draft`); các modal L9 "Hủy" → "Đóng". |
| FB-R1-UXR-UXD-13 (Minor) | Done | `.bar.unavailable` nền đặc `--surface-2` + viền đứt, chữ `--ink`; `--line-strong` sáng #8C8578 → #857E71 (3,21:1 trên `--side`, 3,30:1 trên `--surface-2`); hai cặp đã thêm vào `gen_tokens.py`. |
| FB-R1-UXR-UXD-14 (Minor) | Done | Bỏ `inputmode="email"`; câu lỗi đăng nhập chung "Tên đăng nhập hoặc mật khẩu không đúng…" không nêu số lần còn lại (`auth.login.error_generic`, khớp SR-AUTH-04). |
| FB-R1-UXR-UXD-15 (Suggestion) | Done | Khung 1 L7 có công tắc "Tiếng Việt · English · Русский"; các khung khác giữ mã 2 chữ (thiếu chỗ) nhưng có `aria-label` tên đầy đủ + `lang`. |
| FB-R1-UXR-UXD-16 (Suggestion) | Done | VI: "Làm thủ tục trước (check-in online)" lần đầu, "Làm thủ tục trước" các chỗ sau; "Gửi thủ tục". Nhờ UXR đưa vào giả thuyết kiểm chứng ESC-003. |

## 2. Thẻ PO (`PO-on-UXD.md`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-PO-UXD-01 (Major) | Done | File mới `wireframes/10-config-crm-messages.html`: 10.1 hồ sơ khách + `DUPLICATE_GUEST` (US-071, US-072; dữ liệu g12/g14), 10.2 mẫu tin nhắn (US-125), 10.3 danh mục căn / tham số có ngày hiệu lực, owner sửa – manager chỉ xem A102 / kênh gửi mã / minibar (US-004, US-005, US-066), **10.4 nhật ký tiền (US-006) – vẽ kịp trong R1, không cần dời**. Chú thích mã US vào khung có sẵn: US-027 → L4 4.2 + L9 9.2; US-049 → L3 3.1; US-050 → L9 9.1 + L8. Mã US ghi ở `wf-meta` đầu trang để script truy vết đọc được. |
| FB-R1-PO-UXD-02 (Major) | Done | Toàn bộ dữ liệu mẫu theo **DS-0**: 302 = gia đình anh Hưng 4 khách (Căn N+, tối đa 4), 202 = Nguyễn Văn An 16–20/10 cọc 900.000; Emma ở **102**; gia hạn 402 Airbnb OTM-0146 giá 1.000.000/đêm, 2 đêm = **2.000.000**, đêm 20/10 đã kín (OTM-0159); bộ đếm giữ chỗ OTM-0160 tạo 09:12 15/10, 24 giờ → 09:12 16/10, còn 22 giờ 30 phút lúc T0; L5 giữ chỗ tạo 10:41 → 10:41 16/10, xem lúc 11:31 còn 23 giờ 10 phút; "Hoa hồng của tôi" chỉ mục của CTV Minh Anh (OTM-0155, OTM-0160); phụ thu nhận sớm Ji-woo tính trên 820.000 (246.000) kèm nhãn "chờ DOM chốt"; tên nhân viên theo BL (Hạnh, Chị Lan, Anh Tùng, anh Hoàng Anh, Minh Anh, "Chủ đầu tư"); `WO-031`; mã đơn DS-0 4 chữ số; bill 201 tính lại 3 đêm = 2.299.000. Đơn kịch bản ngoài DS-0 (OTM-0160…0163) liệt kê ở `index.html`. Nhờ QA chạy lại script truy vết. |
| FB-R1-PO-UXD-03 (Minor) | Done | L1 mục **1.3 "Hôm nay" bản máy quầy** (khai báo theo hạn, giữ chỗ sắp hết hạn, khách đến/đi, yêu cầu khách, khách đến muộn), Sơ đồ phòng 1 lần bấm (menu, nút đầu trang, phím R); bảng vai L1 1.2 ghi "Hôm nay" là màn mặc định `front_desk`, `front_desk_lead`. |
| FB-R1-PO-UXD-04 (Minor) | Done | Ghi mã SR + "chờ story PO – dự kiến R2/R3" ở khung 2FA (1.1, 1.5), thiết bị được cấp (1.4), mã xác minh khách (3.5), kênh nhận mã L7. |
| FB-R1-PO-UXD-05 (Minor) | Done | Ô Kênh ở L2 2.2 ghi "Danh sách lấy từ cấu hình kênh (BR-901)", không có Traveloka; content-guide không thêm kênh mới. |
| FB-R1-PO-UXD-06 (Minor) | Done | L3 3.2 và DS 6.4 gắn `[GIẢ ĐỊNH – chờ ESC-001]` + biến thể "Gửi lễ tân trưởng duyệt". |
| FB-R1-PO-UXD-07 (Suggestion) | Done | Thêm mẫu `msg.deposit_received`; `msg.booking_confirmed` thêm `{deposit}`, `{balance}`, `{cancel_policy_short}` (chờ ESC-006); L10 10.2 minh họa. |

## 3. Mục QA (`outputs/QA/report.md` mục 4) và tin ORC chuyển

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| QA #8 | Done | Như FB-R1-PO-UXD-03 (L1 1.3). PO sửa US-001 AC1, BA sửa rbac, QA sửa TC-NT-001/006. |
| QA #9 | Done | Như FB-R1-PO-UXD-01 – đủ 10 story, kể cả US-006. |
| QA #13 | Done | Như FB-R1-PO-UXD-02. |
| ORC/SEC – ô email, kênh gửi mã, thiết bị | Done | Ô email không bắt buộc + nhãn "Đơn chưa có email" (L2, L1 1.3, drawer); "Cấp mã xác minh" có lựa chọn gửi qua OTA/Zalo chỉ khi owner bật, mã 15 phút, tin riêng không kèm link (L3 3.5); màn owner bật/tắt kênh mặc định tắt (L10 10.3); thiết bị được cấp có loại máy quầy / máy tính bảng của cơ sở, hạn ≤ 30 ngày cho di động (L1 1.4). |
| ORC/DOM – BR-613 (c) | Done | L3 3.2: giấy tờ NN đã hết hạn tại ngày nhận phòng → dòng "Không đạt – chặn giao mã" (icon khóa), bước 4 khóa ô mã cửa; hết hạn trong thời gian ở → chỉ cảnh báo; DS 6.4 thêm ngoại lệ. Cũng áp BR-010 (ghi chú L3 3.6), BR-436 (nhật ký tiền L10), BR-527 "Chờ đối soát" (L4 4.3, L10). Đơn đoàn BR-321…326 chưa vẽ (không bắt buộc R1). |

## 4. Dòng decision-log đề xuất (ORC ghi – UXD không sửa decision-log)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-16 | 1 | Design System v0.3: thêm token `--focus-on-dark` (#F4F0E8 / #1B1A18) cho vùng nền tối; `--line-strong` sáng #8C8578 → #857E71; nút bị khóa không dùng opacity (nền `--surface-2`, chữ `--muted`, viền đứt); 0 cặp tương phản không đạt | UXD | FB-R1-UXR-UXD-05, 13 |
| 2026-10-16 | 1 | Cỡ chữ/vùng chạm tối thiểu áp cho mọi điều khiển theo mật độ (toast, seg, chip, thanh dưới, `.btn.sm`): Touch 14px/44px, HK 16px/48px; mọi nhãn ≥ 12px | UXD | FB-R1-UXR-UXD-04 |
| 2026-10-16 | 1 | Mẫu "Đến muộn / tự nhận phòng": xong thủ tục trước là có mã cửa; mã xem lại trong phiên (sessionStorage – SEC chốt thời gian giữ); luôn có nút gọi/nhắn người trực ở trang lưu trú, mã cửa, màn bị khóa | UXD (theo PHÂN XỬ ORC 15/10) | FB-R1-UXR-UXD-01 |
| 2026-10-16 | 1 | Trạng thái buồng VC một tên "Đã dọn – chờ kiểm", tông gỗ sồi (không dùng tông "ok" của Sẵn sàng) | UXD | FB-R1-UXR-UXD-09 |
| 2026-10-16 | 1 | Chữ tự do của nhân viên hiện cho khách: lý do chọn từ danh sách đã dịch, ghi chú tự do có nhãn "(tiếng Việt)" + `lang="vi"`; màn chưa đủ RU hiện "Русская версия скоро" | UXD | FB-R1-UXR-UXD-06 |
| 2026-10-16 | 1 | Wireframe dùng DS-0 của QA làm bộ dữ liệu mẫu duy nhất; đơn kịch bản ngoài DS-0 phải liệt kê ở `wireframes/index.html` | UXD (theo PO) | FB-R1-PO-UXD-02 |
| 2026-10-16 | 1 | VI dùng "Làm thủ tục trước (check-in online)" cho app khách; nút chân form "Đóng (giữ nháp)" thay "Hủy" | UXD | FB-R1-UXR-UXD-12, 16 |
| 2026-10-16 | 1 | [Đề nghị PO + SEC quyết] Có bắt buộc tài khoản owner thứ 2 / người khôi phục 2FA trước khi bật TOTP bắt buộc (R3) không – UXD đã vẽ cảnh báo "chủ đầu tư duy nhất" | PO + SEC | FB-R1-UXR-UXD-07 |
