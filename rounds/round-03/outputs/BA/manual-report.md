# BA – Báo cáo: Sổ tay sử dụng OTTIMO Desk v1.0

- Round 3 · Bước: Sản xuất (tài liệu phát hành v1.0) · 27/10/2026 · Yêu cầu INV 27/10: "nhớ phải có manual cho product này để tui guide cho tất cả bộ phận liên quan"
- Bản áp dụng: `v1.0.0-rc.3` (`70fe734`). Chuỗi chữ đối chiếu: `product/design/copy/strings-vi.json` (sinh từ `gen_strings.py`, không đổi giữa `70fe734` và `HEAD`) và mã nguồn `product/apps/admin-web/src`, `product/apps/mobile/src` (chỉ các khóa thực sự dùng trong mã).

## 1. Đã làm gì

- Viết sổ tay 6 chương (0 mở đầu, 1 chủ đầu tư/quản lý, 2 lễ tân, 3 buồng phòng, 4 bảo trì/sale/kế toán, 5 phụ lục), mỗi chương đọc riêng được. Thao tác viết thành bước đánh số, tên nút và màn hình lấy đúng chuỗi trên giao diện.
- Chỉ viết những gì rc.3 làm được. Chỗ chưa làm được ghi khung **Tạm ở v1.0** với cách làm thay lấy từ release notes "Giới hạn đã biết", `staff-one-pager.md`, `day-one-guide.md`. Lỗi P3 còn mở được ghi tại đúng thao tác bị ảnh hưởng.
- Danh sách 88 ảnh cần chụp, mỗi ảnh có vai đăng nhập, dữ liệu mẫu, chỗ phải che.
- Tạo ESC-038 (kế toán dùng Desk thế nào).

## 2. File tạo/sửa

| File | Việc |
|---|---|
| `product/docs/manual/user-manual-v1.0.md` | Mới – nội dung sổ tay |
| `product/docs/manual/screenshot-list.md` | Mới – 88 ảnh (C0 10 · C1 21 · C2 40 · C3 9 · C4 8) |
| `02-escalations/ESC-038.md` | Mới |
| `02-escalations/escalations-index.md` | Thêm dòng ESC-038 |
| `rounds/round-03/outputs/BA/manual-report.md` | Báo cáo này |

## 3. Chỗ chưa chắc giao diện thật – QA kiểm trên staging trước khi chụp

Các điểm này cũng được đánh dấu bằng chú thích `<!-- QA: … -->` trong tệp sổ tay (không hiện khi dựng HTML).

| # | Mục sổ tay | Điều cần kiểm | Nếu khác |
|---|---|---|---|
| Q1 | 1.4 | Công tắc form website (`public_booking_requests_enabled`) và Wi-Fi (`wifi.ssid`, `wifi.password`) hiện ở nhóm nào của **Tham số quy tắc**, tên hiển thị là gì | BA sửa câu chỉ đường |
| Q2 | 1.9 | Chủ đầu tư tự sửa dòng phụ thu trả muộn thì ai duyệt khoản hoàn tự sinh (quản lý, hay Desk chặn) | BA sửa bước 5 |
| Q3 | 1.15 | rc.3 có màn xem nhật ký truy cập giấy tờ (S28) cho OWN/MGR không – menu không có | Giữ hoặc bỏ khung "Tạm ở v1.0" |
| Q4 | 2.7 | Đơn dài hạn nhập tay: ghi thu tiền thuê bằng nút nào, folio có dòng tiền thuê không, trả phòng Desk đòi thu bao nhiêu (trùng câu Q3 của `day-one-guide.md` mục 8) | BA sửa khung "Tạm ở v1.0" |
| Q5 | 2.14 | Nút **In phiếu** (gọi `window.print()`) in đúng phiếu, đúng ngôn ngữ, không lẫn khung Desk trên Chrome máy quầy | Nếu không dùng được: sửa thành "đưa khách xem trên màn hình" |
| Q6 | 3.7 | App nhân viên rc.3 không có màn nhập số minibar (chỉ việc **Bổ sung minibar**); `checkout.minibar.from_hk` gợi ý có đường ghi từ buồng phòng | Nếu có màn: viết lại 3.7 |
| Q7 | 3.6 | Lễ tân trưởng đăng nhập `staff.ottimo.vn` được và thấy nút **Kiểm phòng**; buồng phòng không thấy nút này khi `hk_self_inspection_enabled` tắt | Sửa 3.6 và bảng quyền 5.3 |
| Q8 | 3.1 | Chủ đầu tư/quản lý đăng nhập app nhân viên bị chặn với câu "Đăng nhập 2 bước sẽ có ở bản sau" | Bỏ câu nếu không đúng |
| Q9 | 1.8 | Hộp **Duyệt** chỉ hỏi **Mật khẩu đăng nhập**, hay hỏi thêm mã 6 số với người có 2 bước | Sửa bước 3 |
| Q10 | 1.6 | Danh sách mục **Kiểm máy trước khi cấp** trên màn **Thiết bị được cấp** (chuỗi chỉ thấy `device.check.ops`) | Ghi rõ các mục |
| Q11 | 2.4, 2.12 | Lễ tân ghi thu giữa kỳ ở (ngoài nhận/trả phòng) có nút nào trên khung đơn đang ở | Bổ sung nếu có |
| Q12 | 1.3 | Quản lý sửa được **Giá đêm niêm yết** (rbac S25 MGR ✔; FB-INV-005 nói "INV tự nhập") | Ghi "chỉ chủ đầu tư" nếu Desk chặn |
| Q13 | 2.10 | Hộp xác nhận cuối khi bấm **Nhận phòng căn …** có nút tên gì | Sửa bước 7 |

## 4. Lệch giữa tài liệu và giao diện phát hiện khi viết

| # | Lệch | Ai xử lý | Đề xuất |
|---|---|---|---|
| L1 | Màn nhận phòng (`ci.door_step1`) ghi "tạo mã **6 số** ngẫu nhiên"; `ci.door_step3` nói mã theo ngày sinh 7 số. BR-403 (INV 19/10): mã cửa **8 số**, bỏ mã ngày sinh | UXD + FE | Sửa chữ ở v1.0.1. Sổ tay cố ý không ghi số chữ số |
| L2 | `staff-one-pager.md` viết buồng phòng "kiểm theo checklist → sẵn sàng" và "đếm minibar, nhập số đã dùng" trên app. rc.3: kiểm phòng do lễ tân trưởng (tự kiểm tắt), app không có màn đếm minibar | PO + DOM | Sửa one-pager trước khi in phát ngày D−1 cho khớp sổ tay mục 3.6, 3.7 |
| L3 | Release notes ghi "In bill, xuất PDF… v1.2" nhưng rc.3 có nút **In phiếu** (in qua trình duyệt) | PO | Ghi rõ: v1.2 là mẫu in chính thức, PDF và gửi bill; v1.0 in qua trình duyệt (chờ Q5) |
| L4 | `escalations-index.md` dòng ESC-031 còn "Chờ INV"; decision-log 26/10 ghi INV đã quyết (vá trước ngày D) và bản vá có trong rc.3 | ORC | Cập nhật dòng index |
| L5 | `release-notes.md` v1.0.0 còn "NHÁP – rc.1"; production đang chạy rc.3 | PO | Cập nhật tag, ngày |
| L6 | Đề bài yêu cầu viết "đăng nhập 2 bước (passkey/TOTP)", "đóng ca", "điện nước dài hạn". rc.3 chỉ có TOTP + mã khôi phục; đóng ca ở v1.3; điện nước ở v1.3 | – | Sổ tay viết đúng rc.3, các phần còn lại ghi "Tạm ở v1.0" |

## 5. Giả định đã dùng (BA – thuộc quyền trình bày, đề xuất ORC ghi decision-log)

- `[GIẢ ĐỊNH BA]` Con số trong sổ tay lấy theo tham số 27/10 (BR v0.4.7, `production-defaults.ts`). Sổ tay ghi rõ "Desk đúng hơn sổ tay" để không phải phát lại khi chủ đầu tư đổi tham số.
- `[GIẢ ĐỊNH BA]` Cách làm tạm cho **đóng ca** (sổ giao ca giấy có hai chữ ký, đối chiếu tiền mặt bằng Nhật ký tiền) và cho **danh sách đơn cần xuất hóa đơn** (lễ tân ghi mã đơn vào sổ giao ca) – rút từ BR-526 và release notes; chờ DOM xác nhận khi diễn tập chuyển đổi.
- `[GIẢ ĐỊNH BA]` Minibar khi trả phòng: buồng phòng báo số còn lại cho lễ tân bằng lời hoặc tin nội bộ không có tên khách (chờ Q6).
- `[GIẢ ĐỊNH BA]` Nhắc khách giờ trả phòng ở v1.0 là việc nhắn tay của lễ tân (mẫu tin tự động ở v1.2), không viết "Desk tự nhắc".
- `[GIẢ ĐỊNH – chờ INV xác nhận]` Kế toán chưa có tài khoản Desk ở v1.0 (ESC-038 phương án A).
- Điện nước khách dài hạn: trẻ dưới 6 tuổi miễn tiền nước – giữ nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` của DOM (decision-log 26/10).

## 6. Rủi ro, vướng mắc

- Bản vá v1.0.1 (thứ Tư đầu tiên sau ngày D) sửa 10 lỗi P3 và vài chuỗi chữ. Sổ tay có ghi các lỗi này; sau v1.0.1 cần một lượt cập nhật nhỏ (BA, khoảng 1 giờ).
- Ảnh phải chụp trên staging có 2 bước bật; ảnh C0-03, C0-04 cần một tài khoản quản lý dùng một lần (QA tạo, xóa sau).
- ESC-035 (mức phụ thu nhận sớm) còn chờ INV: nếu INV đổi, cập nhật mục 2.10 và 5.2.

## 7. Việc chưa xong

- QA kiểm Q1–Q13 và chụp 88 ảnh trên staging; BA sửa sổ tay theo kết quả.
- UXD dựng bản HTML theo brand guideline OTTIMO (Lora / Be Vietnam Pro / JetBrains Mono, màu 80/15/5), giữ các khung "Tạm ở v1.0" và "Lỗi nhỏ đã biết" thành khối nổi bật, che ảnh theo `screenshot-list.md`.
- Review chéo theo protocol: DOM (đúng nghiệp vụ, số liệu), PO (phạm vi v1.0), QA (khớp giao diện).
