# Báo cáo UXD – Round 1 · Bước 2 (Sản xuất) · Đợt 2

- Người viết: UXD | Ngày: 15/10/2026
- Việc được giao: `rounds/round-01/plan.md` mục 3.1 (dòng UXD) và mục 3.3 (8 luồng wireframe).

> Ghi chú ORC: UXD không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nội dung UXD gửi, với sự đồng ý của INV. Các dòng decision-log đề xuất đã được ORC ghi vào `01-decisions/decision-log.md`.

## 1. Đã làm gì

1. **Design System OTTIMO v0.1** (`product/design/design-system.md` + `tokens.json`)
   - Giữ nhận diện kem – gỗ sồi, Lora + Be Vietnam Pro (tự host, SIL OFL – miễn phí, không cần ESC). Màu nền/bề mặt/thương hiệu `--oak` giữ nguyên.
   - Token màu **sáng + tối** đo tương phản WCAG 2.2 bằng script: **33 cặp chữ/UI × 2 chế độ (+2 cặp đo bổ sung), 0 cặp không đạt**. Sửa theo checklist `heuristic-review-r0.md` mục 3–4: `--faint` 2,65:1 → 5,15:1 (giá trị cũ đổi thành `--deco`, chỉ trang trí), `--oak-ink`/`--oak-soft` 4,18 → 5,04, `--warn`/`--warn-bg` 4,31 → 5,27, viền focus 2,72 → 5,44 (token `--focus` mới), `--muted` trên sidebar 4,49 → 5,07; thêm `--line-strong` (viền ô nhập ≥ 3:1), `--ink-inverse`.
   - Thang chữ (tối thiểu 12px máy tính, 16px điện thoại, 16–17px buồng phòng), lưới 4px, bo góc, vùng chạm (32/44/48px), chuyển động, breakpoint.
   - **30 component**, **10 mẫu tương tác bắt buộc**, bảng trạng thái tải/rỗng/lỗi/mất mạng, **15 quy tắc a11y** ánh xạ từng mục BL 8.3 + HR.
   - Màu/icon/hoa văn cho trạng thái đơn theo đúng tên DOM (`hold, confirmed, in_house, checked_out, cancelled, no_show`; OOO là khối chặn), 7 trạng thái buồng, 9 trạng thái khai báo (BR-607).
2. **Wireframe HTML tĩnh 8 luồng + index** (`product/design/wireframes/`), mở trực tiếp bằng trình duyệt. Có công tắc Trạng thái (Bình thường/Đang tải/Rỗng/Lỗi/Mất mạng), Sáng/Tối, Ngôn ngữ (L7). Mỗi trang có chú thích đánh số, mã US/BR/HR và ghi chú phân quyền.
   - Trạng thái tải/rỗng/lỗi/mất mạng: **có ở cả 8 luồng**.
   - Buồng phòng (L6) có giao diện mobile riêng: nút ≥ 48px (nút chính 56px), chữ ≥ 16px, câu thường thay mã VC/VD, hoàn tác 10 giây, thao tác được khi mất mạng.
   - **Khắc phục 4 Blocker của UXR**: HR-01 (app khách đổi VI/EN/RU thật), HR-04 (phụ thu = 0 tới khi lễ tân bật và xác nhận), HR-06 (xác nhận phá hủy có hậu quả cụ thể, lý do bắt buộc), HR-07 (kiểm tra 3 trạng thái Đạt / Không đạt / Chưa kiểm được).
   - Xử lý thêm 12/12 Major (HR-02, 03, 05, 08, 09, 10, 11, 12, 13, 14, 20, 21) và các Minor HR-16, 17, 18, 19, 22, 24.
   - Đã xem hiển thị trong trình duyệt; 9 file HTML kiểm cú pháp thẻ không lỗi.
3. **Nội dung chữ** (`product/design/content-guide.md` + `copy/strings-{vi,en,ru}.json`): giọng văn, chính tả, bảng thuật ngữ khớp tên trạng thái DOM, định dạng tiền–ngày–giờ VI/EN/RU, mẫu lỗi/xác nhận/rỗng/mất mạng, quy tắc i18n; **318 chuỗi VI/EN**; cột RU chừa chỗ (thiếu thì hiện EN); **7 mẫu tin nhắn VI/EN/RU** (bản RU là nháp, cần người bản ngữ duyệt).
4. Công cụ sinh lại (`product/design/tools/`): `gen_tokens.py` (tokens.json + tokens.css + kiểm tương phản), `gen_strings.py` (JSON chuỗi + strings.js).

## 2. File tạo/sửa
Chỉ tạo mới, không sửa file của vai khác:
- `product/design/design-system.md`, `tokens.json`, `content-guide.md`
- `product/design/copy/strings-vi.json`, `strings-en.json`, `strings-ru.json`
- `product/design/wireframes/index.html`, `01-login-role-nav.html` … `08-owner-overview.html`
- `product/design/wireframes/assets/tokens.css`, `wf.css`, `wf.js`, `icons.js`, `strings.js`
- `product/design/tools/gen_tokens.py`, `gen_strings.py`
- `rounds/round-01/outputs/UXD/report.md` (file này)

## 3. Giả định
Quyết định thuộc quyền UXD (đã ghi decision-log): Design System v0.1 + chuẩn tương phản; ba mật độ giao diện Desk/Touch/HK; giao diện buồng phòng dùng câu thường; các mẫu tương tác bắt buộc; chính tả và cách gọi "Phiếu thanh toán"/"Hóa đơn", không in "FOC" trên giấy tờ khách; font tự host, chữ Nga dùng font hệ thống; app khách xưng "bạn"/"Вы".

Giả định làm việc (chờ xác nhận ở đợt 4 hoặc bởi vai khác):
- **Phân quyền** vẽ theo cột "Không được thấy" ở PRD mục 4 vì `rbac-matrix.md` chưa có lúc vẽ. Điểm cần đối chiếu: CTV xem "Căn trống" có ẩn tên khách; buồng phòng có thấy tên khách đang ở; ai xác nhận cọc/ký quỹ; quản lý có bị ẩn P&L; ai ghi ngoại lệ khi kiểm giấy tờ "Không đạt".
- Số tiền trên wireframe là ví dụ tính đúng từ BR; số dài hạn và ADR/RevPAR để "… đ".
- Mã lỗi minh họa và dạng mã hồ sơ khai báo là ví dụ – ARC/INT chốt định dạng thật.
- Mất mạng: máy quầy chỉ xem, buồng phòng thao tác offline (khớp ADR-005 của ARC).
- Khai báo lưu trú bán tự động, thứ tự trường thật cần INT/lễ tân kiểm chứng trên cổng.
- Mẫu tin nhắn ghi "14:00 / 12:00" để dễ đọc; FE thay bằng biến từ tham số BR-401.

## 4. Rủi ro / vướng mắc
| # | Rủi ro | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R1 | RBAC chưa có khi vẽ | Có thể phải ẩn/hiện lại nút, trường (QC B2) | Đợt 4 đối chiếu `rbac-matrix.md`; chỗ phụ thuộc đã đánh dấu "Theo vai" |
| R2 | Bản dịch EN/RU văn bản pháp lý là bản của AI | Sai nghĩa pháp lý | Người dịch/luật sư duyệt trước R2 (gắn ESC-001) |
| R3 | Be Vietnam Pro không có Cyrillic | Chữ Nga khác font | Kiểm ở R3; dự phòng font OFL có Cyrillic |
| R4 | Persona buồng phòng tin cậy thấp | L6 có thể không được dùng | INV cho 1 người buồng phòng thử L6 trước R2 (H-05, ESC-003) |
| R5 | Wireframe chưa test với người thật | Ưu tiên có thể sai | UXR test kịch bản ở R2 |
| R6 | Chưa có logo chính thức | Nhận diện có thể không khớp | Đề xuất ESC logo (đã chuyển PO gom) |

**Đề xuất ESC – Logo chính thức OTTIMO** (Bình thường): A dùng chữ "OTTIMO" Lora giãn chữ (đề xuất, 0 đồng); B INV gửi file logo gốc; C thuê thiết kế. Chưa trả lời thì dùng A, không chặn R2.

## 5. Việc chưa xong
- Review bắt buộc UXD → UXR (bước 3).
- Đợt 4: chỉnh wireframe theo `rbac-matrix.md` và `openapi.yaml`; cập nhật tên trường/định dạng mã theo ERD.
- Chưa vẽ: modal Gia hạn, Trả muộn; Đổi phòng; màn Kênh OTA, CRM, kho F&B; chốt điện nước.
- Tiếng Nga đầy đủ cho app khách (R3, US-115).
- `screens/<luồng>.md` sẽ tách ở R2 nếu FE/MOB cần.
- Kiểm a11y bằng trình đọc màn hình thật và mô phỏng mù màu: cùng QA ở bước 5.
