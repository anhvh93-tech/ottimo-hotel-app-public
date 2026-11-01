# FB-INV-008 – Website ottimo.vn thêm tiếng Hàn, tiếng Trung, tiếng Nga

- Ngày: 01/11/2026 | Người gửi: INV | Ghi: ORC | Loại: tính năng mới (landing ottimo.vn, đa ngôn ngữ) | Ưu tiên: P2 | Đích: Round 4 – sau ngày D 02/11, không đụng production trước ngày D | **Trạng thái: Chờ INV xác nhận phạm vi**

## Nguyên văn
> Tôi đề xuất bạn thêm 3 loại ngôn ngữ là tiếng Hàn Quốc, Tiếng Trung, và Tiếng Nga giúp tôi

## Bối cảnh
- Trước đó ORC đề xuất thêm tiếng Hàn, rồi tiếng Trung, và chọn theo tỉ lệ quốc tịch khách trên Booking.com/Agoda. INV chọn thêm cả 3, trong đó có **tiếng Nga**.
- Hiện landing có `en` (dẫn) và `vi`. Mã đã có sẵn khung đa ngôn ngữ: `product/apps/landing-web/astro.config.ts` (`LANGS`), chữ ở `src/content/en.ts`, `vi.ts`, `privacy.ts`.

## Hiểu của ORC (chờ INV xác nhận)
- Thêm `ko` (tiếng Hàn), `zh` (tiếng Trung **giản thể**), `ru` (tiếng Nga) cho **toàn bộ landing ottimo.vn**: trang chủ, form "Yêu cầu đặt phòng" (nhãn, lỗi, thư cảm ơn), trang thông báo xử lý dữ liệu, trang 404, nút chọn ngôn ngữ.
- **Chưa** làm: Desk, app nhân viên, trang khách `g.ottimo.vn`, mẫu tin Zalo/email. Các phần này làm sau nếu INV muốn.
- Tiếng Anh vẫn là ngôn ngữ dẫn, theo brand guideline.
- Khách viết lời nhắn bằng ngôn ngữ của họ. Form ghi một câu mời khách viết thêm tiếng Anh nếu được. Lễ tân dùng công cụ dịch. Desk hiện ngôn ngữ khách đã dùng.

## Việc và vai
| Vai | Việc |
|---|---|
| PO | User story, tiêu chí nghiệm thu, thứ tự (ko → zh → ru hoặc cùng lúc) |
| CPY + UXD | Viết chữ 3 ngôn ngữ theo giọng OTTIMO (ngắn, lịch sự, điềm tĩnh, không emoji). **Font:** Lora/Be Vietnam Pro không có chữ Hàn/Trung, Be Vietnam Pro không có chữ Nga → UXD chọn font thay thế gần nhận diện và ghi lệch brand. |
| FE-B | Thêm locale, `hreflang`, nút chọn ngôn ngữ, giữ ngân sách tải trang (font chữ Hàn/Trung nặng) |
| SEC | Bản dịch thông báo xử lý dữ liệu 3 ngôn ngữ, version mới, gửi luật sư; OPS ghi phiên bản bằng `publish-privacy-notice.sh` cho `ko`, `zh`, `ru` |
| BE | Form nhận `locale` mới; Desk hiện ngôn ngữ khách |
| QA | Kiểm form + trang privacy 3 ngôn ngữ, axe, ngân sách tải trang |
| INV | Nhờ **người bản xứ** đọc lại 3 bản dịch (đội AI dịch được nhưng không thay người bản xứ); gửi luật sư bản dịch thông báo |

## Rủi ro
- Dịch máy sai giọng làm giảm cảm giác cao cấp → cần người bản xứ đọc.
- Khách nhắn bằng tiếng Hàn/Trung/Nga mà trả lời chậm → mất khách. Giảm bằng công cụ dịch và câu mời viết thêm tiếng Anh.
- Thông báo xử lý dữ liệu bản dịch phải khớp nghĩa bản đã duyệt.
