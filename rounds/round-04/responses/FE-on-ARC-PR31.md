# FE-A trả lời review ARC – PR-1 v1.0.3 (email nhận thông báo bảo mật, phần Desk)

- Round 4 – đợt v1.0.3 – bước **Phản hồi & sửa**.
- Review: `rounds/round-04/reviews/ARC-on-PR31-v1.0.3-email.md`. Thẻ cho FE-A: FB-R4-ARC-FE-31-03. Các thẻ BE-31-xx thuộc BE-A.
- Nhánh `fe-a/v1.0.3-email`. Commit chung lượt sửa với UXD lượt 2 (EM-07, 13, 14, 15).

## FB-R4-ARC-FE-31-03 (Minor) – Gửi lại khi server báo `409 IDEMPOTENCY_IN_PROGRESS`

**Trạng thái: Done**

Lỗi cũ: `sendWithOneKey` chỉ gửi lại một lần, và gửi ngay. Nếu yêu cầu đầu đã tới server nhưng server chưa xử lý xong, lần gửi lại nhận `409 IDEMPOTENCY_IN_PROGRESS`. Khi đó Desk báo lỗi, dù email có thể đã lưu.

Sửa ở `apps/admin-web/src/app/email.ts`:

| Ca | Desk làm gì |
|---|---|
| Mất kết nối (`isNetwork`) | Gửi lại ngay một lần, cùng khóa, cùng thân (giữ như cũ) |
| 409 `IDEMPOTENCY_IN_PROGRESS` | Chờ rồi gửi lại, cùng khóa, cùng thân, tối đa **2 lần**. Thời gian chờ lấy theo `Retry-After` nếu server gửi (giới hạn 0–10 s), không có thì 1,5 s |
| Lỗi khác | Dừng. Lần Lưu sau dùng khóa mới |

- Các giới hạn nằm trong `RESEND = { networkRetries: 1, inProgressRetries: 2, inProgressDelayMs: 1500 }`. Test chỉ rút ngắn thời gian chờ.
- Mã TOTP chỉ dùng được một lần. Vì vậy Desk không bao giờ đổi thân khi gửi lại: thân mang cùng `reauth`, nên server trả lại kết quả đã lưu (`Idempotent-Replayed: true`), không trả `401` vì mã đã dùng.
- Không thêm kiểu mạng mới. Hằng số và vòng lặp chỉ nằm trong `email.ts`. `api-client` giữ nguyên.

Sửa ở `apps/admin-web/src/components/SecurityEmailCard.tsx`, phần `save`. Nếu vẫn lỗi sau các lần gửi lại (409, mất mạng, 5xx…), Desk gọi `session.refresh()` để đọc `Me`:

- **Nếu `Me.email` đã là địa chỉ vừa lưu:** Desk báo thành công như bình thường (`saved` / `saved_first` / `removed`, chọn theo địa chỉ trước đó). Không gọi `session.refresh()` lần hai.
- **Nếu chưa phải, hoặc không đọc được `Me`:** Desk giữ cách cũ. Câu lỗi hiện trong hộp S2 (`error.IDEMPOTENCY_IN_PROGRESS` hoặc câu chung) và không báo đã lưu.
- **Không đổi:** lỗi S2 (`REAUTH_FAILED`, `STRONG_REAUTH_REQUIRED`) và lỗi ô email (`EMAIL_INVALID`, `EMAIL_SHARED_MAILBOX`) không đi qua nhánh `session.refresh()`.

Hộp của chủ đầu tư sửa email người khác (`UserEmailDialog`, `updateUser` có `If-Match`) không dùng `sendWithOneKey` và không tự gửi lại. Khi lỗi, hộp đóng và trang hiện câu lỗi. Nếu lần lưu đầu thực ra đã thành công, `version` đã đổi. Lần thử sau sẽ nhận 412 `VERSION_CONFLICT`, và trang tự tải lại danh sách (`reload()`), nên bảng hiện đúng trạng thái thật. Phần này giữ nguyên.

### Test mới (`v103-email-fea.test.tsx`, nhóm "resend while the first request is still running")

1. **Mất kết nối, rồi 409, rồi trả lại kết quả.**
   - Yêu cầu 1 được lưu ở server nhưng mất câu trả lời. Yêu cầu 2 nhận 409. Yêu cầu 3 nhận 200 kèm `Idempotent-Replayed: true` từ mock thật.
   - Desk hiện `secmail.saved_first` và địa chỉ đã lưu, rồi đóng hộp.
   - Cả 3 lần gửi dùng cùng một `Idempotency-Key` và cùng một thân.
2. **Vẫn 409 sau 2 lần gửi lại, nhưng yêu cầu đầu đã lưu.**
   - Có đúng 3 lần gửi (1 + 2), cùng một khóa.
   - Desk tải lại `Me`, rồi hiện `secmail.saved_first` và địa chỉ đã lưu.
3. **Vẫn 409, và chưa lưu gì.**
   - Câu `error.IDEMPOTENCY_IN_PROGRESS` hiện trong hộp S2.
   - Desk không báo đã lưu. Mock không có email.

## Kiểm thử

- admin-web `vitest run`: **67 tệp, 742/742 xanh**. Trước đó 737: thêm 3 ca ARC-03, 1 ca mất mạng (UXD EM-13), và 1 khóa `secmail.status_set` trong test chuỗi (EM-15).
  - Lượt chạy đầu có ca hết thời gian ở các tệp không liên quan. Lúc đó máy có load khoảng 27 vì nhiều agent chạy song song.
  - Chạy lại với `--maxWorkers=3`: tất cả xanh.
- `tsc --noEmit`: 0 lỗi. `prettier --check`: sạch. `eslint` trên các tệp sửa: 0 lỗi.
