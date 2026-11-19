# UXD review – FE PR #198 (`r5-fb012-golive-copy` @ `dd60bfb7`): chữ go-live và hotline

- Người review: UXD | Round 5 – bước **Review** | 19/11/2026
- Cách kiểm:
  - đọc `gh pr diff 198`: `gen_strings.py`, `goLive.ts` (`formatHotline`), `PropertyContact.tsx`, `StatementPrintPage.tsx`;
  - đọc `FE-responses.md` Lượt 5b.
- Không chạy app.

## Kết luận

**DUYỆT (UXD), kèm 1 thẻ Minor về câu chữ.** Thẻ này không chặn gộp. Nên đổi trước tag v1.0.7.

| Mục | Kết luận |
|---|---|
| (1) `od.confirm_body` – bản FE nháp | **Thay** bằng câu ở thẻ 198-01. Ý thì đúng. Nhưng câu "It can't be refunded the way it was paid" phủ định vòng, đọc khó; bản VI "Không hoàn lại theo cách khách đã trả" cũng vậy |
| (2) Cách nhóm số hotline | **Duyệt.** Di động 9 chữ số theo 3-3-3 (`+84 900 000 222`, trong nước `0900 000 222`), cố định 10 chữ số theo 3-3-4 (`+84 263 312 3456`). Đây là cách người Việt quen đọc. Dạng khác giữ như đã lưu, chỉ đổi ở phần hiển thị. Hotline hiện ở chân phiếu, phần xem trước và S24 phải dùng JetBrains Mono như đã có |
| (3) VI `payment.method.outside_desk` = "Khách đã trả ngoài app" | **Duyệt.** Trùng chữ với `od.action`, và trong lịch sử thanh toán không thể đọc nhầm thành "Tiền mặt". EN giữ "Paid outside the app" |
| Chuỗi 196-09, 196-10, 196-11 | Đúng bảng UXD: `field_error.backdate_out_of_range_from`, `bd.arrival_fixed`, `od.reference_long_number`, `bd.need_device`, `od.owner_only`, `stmt.pay_amount` |
| 196-04 (ô bật/tắt) | **Đóng.** Ô này là `Checkbox` của `@ottimo/ui`, tức C6 của DS (input gốc, `accent-color: var(--ink)`). Ảnh lần 1 trông giống ô của trình duyệt chính vì C6 được làm như vậy. Vẽ lại C6 là việc DS riêng, không làm ở v1.0.7 |

### FB-R5-UXD-FE-198-01
- Mức độ: Minor
- Vị trí: `gen_strings.py`, khóa `od.confirm_body` (hộp xác nhận "Khách đã trả ngoài app", S16).
- Vấn đề: câu nháp nói điều không làm được ("không hoàn lại theo cách khách đã trả") trước điều làm được. Người đọc phải ghép hai vế mới hiểu.
- Vì sao quan trọng: đây là hộp xác nhận về tiền. Mỗi câu nên chỉ nói một ý, nói thẳng.
- Đề xuất sửa:

| Khóa | EN | VI |
|---|---|---|
| `od.confirm_body` | No money is taken now. This amount stays out of shifts, reconciliation and the cash handover. If the guest needs a refund, pay it in cash or by bank transfer. If it's wrong, a manager or the owner uses Reverse payment. | Lúc này không thu tiền. Khoản này không vào ca, đối soát hay tiền mặt bàn giao. Khách cần hoàn tiền thì hoàn bằng tiền mặt hoặc chuyển khoản. Ghi nhầm thì quản lý hoặc chủ đầu tư dùng Đảo giao dịch. |
- Trạng thái: Open
