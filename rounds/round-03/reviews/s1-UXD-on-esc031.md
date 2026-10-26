# UXD review – FE-A ESC-031 (chữ + màn H16 bước 3 + "Cần chú ý")

- Round 3 · Bước: Review · Ngày 26/10/2026 · Người review: UXD · Tác giả: FE-A
- Đối tượng: commit `6f72a9c` (nhánh `worktree-agent-a67639f06f6add4d9`), báo cáo `rounds/round-03/outputs/FE/esc031-fe-a.md`, 11 ảnh `rounds/round-03/outputs/FE/esc031-shots/`.
- Căn cứ: `product/docs/staff-one-pager.md` bước 3 (tên nút "Ghi phụ thu – quản lý xem lại", DOM E31-02), `product/design/content-guide.md`, brand guideline OTTIMO (`00-brief/context/brand/brand-guidelines.md`).
- **Kết luận: ĐẠT CÓ ĐIỀU KIỆN.** 16 chuỗi + câu `co.late_fee_as_night_body` duyệt. UXD đã sửa thẳng 6 chuỗi và 1 tiêu đề dùng chung trong worktree FE-A, commit **`c7ba6b5`** (`round-3: Review – UXD on FE-A ESC-031 strings`). Điều kiện: FE-A gộp `c7ba6b5` cùng `6f72a9c`; thẻ 02 (ảnh 409 và hộp xác nhận) cho QA kiểm trên stack thật. Không có Blocker, không có ESC.

## 1. Kết quả theo hạng mục

| Hạng mục | Kết quả |
|---|---|
| Giọng (ngắn, điềm tĩnh, không emoji, không đổ lỗi) | Đạt sau khi sửa. Không emoji; không câu nào trách lễ tân. |
| Tên nút theo tờ hướng dẫn | Đạt. `co.late_fee_mode_review` = "Ghi phụ thu – quản lý xem lại", khớp từng chữ `staff-one-pager.md` dòng 39. |
| Brand 80/15/5, Lora / Be Vietnam Pro | Đạt. Không màu mới. Hộp phụ thu dùng `card` nền Ivory; Seg, Alert `warn`, viền mục "Cần chú ý" lấy token sẵn có (Oak/Earth Brown). Tiêu đề trang Lora, nội dung Be Vietnam Pro, mã đơn JetBrains Mono. |
| Bố cục H16 bước 3 | Đạt. Hộp phụ thu đứng đầu cột trái, trước "Cách thanh toán" (quyết số trước khi thu). Số chỉ đọc nằm ngay trên ô Lý do. Nút Hoàn tất khóa, có câu giải thích ở thanh dưới. |
| "Cần chú ý" `late_fee_post_review` | Đạt. Một dòng chính + dòng hạn, hai nút "Mở folio" / "Đã xem" cùng cỡ `btn sm`, vùng chạm đủ. Mức `warning` đúng (không phải `critical`, không bắt ghi chú khi đóng). |
| Giả định FE (b): một nút chọn sẵn khi 2FA bắt buộc | **Giữ như FE làm** (Seg một lựa chọn, đã chọn sẵn). Lý do ở mục 3. |

## 2. Chuỗi đã sửa trong `c7ba6b5`

| Khóa | Trước | Sau (vi / en) | Vì sao |
|---|---|---|---|
| `co.late_fee_pr_help` | 4 câu, 3 dòng ở 1366 px; "xem lại sau khi khách đi" | "Gọi quản lý trước khi ghi. Số do hệ thống tính theo giá đêm nay, không sửa ở đây. Ghi lý do; quản lý được báo để xem lại. Miễn hoặc giảm (nếu có) do quản lý làm sau, trên folio." / "… Add a reason; the manager is notified to review it. Any waiver or reduction is made later by the manager, on the folio." | Gọn hơn, giữ đủ 4 ý: gọi quản lý, số không sửa, lý do, miễn/giảm là việc của quản lý (lễ tân không hứa giảm – one-pager bước 4). |
| `co.late_fee_pr_changed` | "… Số mới đã hiện ở trên – báo khách rồi bấm Hoàn tất lại." | "Phụ thu vừa được tính lại: {amount}. Chưa ghi gì. Báo khách số mới, thu phần còn thiếu nếu có, rồi hoàn tất lại." / "… Nothing was recorded. Tell the guest the new amount, collect any difference, then complete again." | Câu cũ hứa "số mới đã hiện ở trên"; ảnh 05 cho thấy phía trên vẫn 708.000 đ (thẻ 02). Câu mới không phụ thuộc lần tải lại. Thêm "thu phần còn thiếu" vì số tăng thì Còn phải thu tăng. |
| `co.late_fee_auth_try_review` | "đăng nhập 2 bước" / "two-step sign-in" | "xác thực 2 bước" / "2-step verification" | Thống nhất thuật ngữ với `auth.enroll.title`, `shell.security`, `mfa.*`. |
| `attn.late_fee_post_review` | "… cần quản lý xem lại: {n} đơn" | "Phụ thu trả muộn bằng giá 1 đêm chờ xem lại: {n} đơn" / "One-night late check-out fees to review: {n}" | Người đọc chính là OWN/MGR; "cần quản lý xem lại" nói với quản lý ở ngôi thứ ba. Ngắn hơn, dòng ở ảnh 09 bớt xuống hàng. |
| `attn.late_fee_post_review_one` | "… cần quản lý xem lại" | "Đơn {code}: phụ thu trả muộn bằng giá 1 đêm chờ xem lại" / "Booking {code}: one-night late check-out fee to review" | Như trên. |
| `attn.reviewed` (chỉ en) | "Reviewed" | "Mark as reviewed" | Nhãn nút là động từ, cùng mẫu `attn.resolve` "Mark as handled". Tiếng Việt "Đã xem" giữ (cùng mẫu "Đã xử lý"). |
| `checkout.extra_night_title` (tiêu đề dùng chung, ngoài 16 khóa) | "Trả sau mốc trả muộn – tính thêm 1 đêm" | "Trả sau mốc trả muộn" / "Check-out after the late check-out limit" | Ảnh 01: tiêu đề nói "tính thêm 1 đêm", thân câu ngay dưới nói "không bán thêm đêm được". Tiêu đề dùng cho 3 ca (thêm đêm / không thêm được / phụ thu bằng giá 1 đêm); thân câu mỗi ca đã nói rõ. Chỉ đổi chữ, không đổi mã. |

Không đổi: `co.late_fee_mode`, `co.late_fee_mode_review`, `co.late_fee_mode_desk`, `co.late_fee_pr_title`, `co.late_fee_pr_sum`, `co.late_fee_pr_needs`, `co.late_fee_pr_effect`, `co.late_fee_pr_not_allowed`, `attn.late_fee_post_review_sub`, `attn.late_fee_open_folio`, `attn.reviewed` (vi), và `co.late_fee_as_night_body` bản FE ("Ghi khoản này ở bước Bill & thu tiền." / "Record it at the Bill & payment step." – đúng tên bước `checkout.step.bill`).

Đã chạy: `python3 product/design/tools/gen_strings.py` (3179 chuỗi, diff chỉ 7 khóa trên), cập nhật bảng trong `product/design/content-guide.md`; `packages/i18n` vitest 19/19; `apps/admin-web` vitest 59 tệp / 619 ca xanh (test dùng `tv(key)` nên tự khớp chữ mới). E2E TC-X-086 dùng `t('checkout.extra_night_title')` nên tự khớp.

## 3. Giả định FE (b) – quyết định UXD

Khi 2FA bắt buộc (staging/production), **giữ Seg một lựa chọn "Ghi phụ thu – quản lý xem lại" đã chọn sẵn**, không đổi thành nhãn tĩnh:
- Tờ hướng dẫn nói "Trên Desk **chọn** …". Lễ tân thấy đúng chữ, ở dạng đã chọn, nên không phải tìm.
- Bố cục giống hệt bản dev/CI có 2 lựa chọn (ảnh 02 và 07). Không có cảnh màn nhảy khi cấu hình đổi.
- Bấm vào không làm gì sai, a11y là radiogroup 1/1 – chấp nhận được.
Ghi vào decision-log trong cùng commit `c7ba6b5` (quyền UXD), để gộp cùng dòng của FE-A, tránh xung đột cuối file.

## 4. Thẻ feedback

### FB-R3-UXD-FE-01
- Mức độ: Minor
- Vị trí: `co.late_fee_pr_help`, `co.late_fee_pr_changed`, `co.late_fee_auth_try_review`, `attn.late_fee_post_review(_one)`, `attn.reviewed` (en), `checkout.extra_night_title`
- Vấn đề: như bảng mục 2 (câu dài, hứa "số mới đã hiện ở trên", lệch thuật ngữ 2FA, ngôi thứ ba với người đọc, nhãn nút EN là tính từ, tiêu đề bước 2 trái với thân câu).
- Vì sao quan trọng: lễ tân đọc câu này lúc khách đang đứng ở quầy, buổi tối; câu sai hoặc trái nhau làm thu sai hoặc hứa sai.
- Đề xuất sửa: đã sửa trong `c7ba6b5`. FE-A chỉ cần gộp.
- Trạng thái: Fixed by UXD (`c7ba6b5`)

### FB-R3-UXD-FE-02
- Mức độ: Minor
- Vị trí: ảnh `esc031-shots/05-409-surcharge-changed.png`, `04-confirm-dialog.png`
- Vấn đề: (a) Ảnh 05: sau 409 với số mới 1.100.000 đ, tiêu đề hộp, folio và nút vẫn là 708.000 đ / "Đã thu 3.168.000 đ – hoàn tất". Do mock `failNext` chỉ chèn 409, bản tóm tắt vẫn trả số cũ, nên ảnh không chứng minh được "số tải lại". (b) Ảnh 04 đặt tên "confirm-dialog" nhưng không thấy hộp xác nhận, nên không xem được dòng `co.late_fee_pr_effect` trong hộp.
- Vì sao quan trọng: đây là bước tiền; số trên màn phải là số sẽ ghi.
- Đề xuất sửa: QA, khi chạy kiểm tiền ESC-031 trên stack `MFA_ENFORCED=true`, chụp lại 2 cảnh: 409 thật (đổi giá đêm giữa chừng) thấy tiêu đề hộp + folio + Còn phải thu đổi theo số mới; hộp xác nhận Hoàn tất có dòng `co.late_fee_pr_effect`. FE-A chụp lại ảnh 04 nếu tiện. Không chặn gộp.
- Trạng thái: Open

### FB-R3-UXD-FE-03
- Mức độ: Suggestion
- Vị trí: H16 bước 3, ô Lý do (`co.late_fee_reason`)
- Vấn đề: ô Lý do trống, không có gợi ý. Tờ hướng dẫn có sẵn ví dụ "Rời 20:30, căn có khách đến tối nay".
- Vì sao quan trọng: quản lý xem lại dựa vào lý do; lý do có giờ rời và lý do không bán được đêm thì xem nhanh hơn.
- Đề xuất sửa: sau ngày D (ngoài phạm vi ngoại lệ đóng băng), thêm help cho ô: "Ví dụ: Rời 20:30, căn có khách đến tối nay" / "e.g. Left at 20:30; room booked for tonight". UXD sẽ thêm khóa khi FE làm.
- Trạng thái: Open (dời sau ngày D)

### FB-R3-UXD-FE-04
- Mức độ: Suggestion
- Vị trí: tiêu đề hộp `label-h` có số tiền (`co.late_fee_pr_title`, `co.late_fee_confirm_title`)
- Vấn đề: `label-h` viết hoa nên "708.000 đ" thành "708.000 Đ". Có từ R2 (hộp quản lý xác nhận), không do bản vá này.
- Vì sao quan trọng: ký hiệu tiền viết hoa trông như chữ "Đ", lệch cách viết số tiền ở mọi chỗ khác.
- Đề xuất sửa: sau ngày D, bọc số tiền trong `<span class="num">` với `text-transform: none`, hoặc dùng tiêu đề thường (không `label-h`) cho hộp có số.
- Trạng thái: Open (dời sau ngày D)

## 5. Điểm làm tốt
- Giữ đúng chữ tờ hướng dẫn và ghi chú "đổi chữ thì báo PO/DOM sửa tờ hướng dẫn" ngay trong `gen_strings.py`.
- Câu lỗi tách theo từng tình huống (409, 422, 401) và nói việc cần làm tiếp, không chỉ báo lỗi.
- Không thêm màu hay component mới; mục "Cần chú ý" dùng lại `openLabel` thay vì làm dòng riêng.
