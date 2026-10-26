# DOM review BE-B – bản vá ESC-031 (phụ thu trả muộn bằng giá 1 đêm không cần mật khẩu quản lý tại quầy)

- Người review: DOM | Round 3, bước Review (cổng INV trước khi gộp: DOM + ARC + SEC, QA kiểm tiền) | Ngày: 26/10/2026
- Đối tượng: nhánh `worktree-agent-ae045319d05dda682`, commit `35a477c`; thiết kế `rounds/round-03/outputs/BE/esc031-be-b.md` (trong worktree đó).
- Căn cứ: ESC-024 (INV B, 22/10), ESC-031 (INV "vá trước ngày chạy", 26/10), BR-416 v0.4.4 → **v0.4.5**, BR-427, BR-433 (b)(e), BR-434, BR-522; oracle `outputs/DOM/s1-money-oracle.md` mục 10 → **thêm 10.1**.
- Cách review: đọc thiết kế và mã (`checkout.service.ts`, `frontdesk.controller.ts`, `attention.service.ts`, `late-fee-review-job.ts`, `folio.service.ts` `settle`), đối chiếu tiền với oracle. DOM không chạy test.

## Kết luận
**Đạt về nghiệp vụ.** Bản vá đúng tinh thần ESC-024 B và đúng phương án INV đã duyệt ở ESC-031: lễ tân ghi đúng số máy tính, không giảm được, không cần mật khẩu của ai, quản lý được báo và xem lại trong 24 giờ, miễn sau bằng đường có sẵn. Không có thẻ Blocker/Major. Ba giả định nghiệp vụ của BE-B: **xác nhận cả ba**, có làm rõ (bên dưới). BR-416 đã sửa thành v0.4.5 (i)–(viii).

## Ba giả định BE-B mục 5

| # | Giả định | DOM | Làm rõ |
|---|---|---|---|
| (a) | v1.0 không có thời gian chờ 15 phút (chưa có US-164); lễ tân gọi quản lý theo `staff-one-pager.md` rồi ghi | **Xác nhận** | 15 phút của ESC-024 B là thời hạn trả lời một yêu cầu từ xa. v1.0 không có kênh đó, và quản lý có 2FA cũng không xác nhận được tại quầy. Chờ không đem lại gì ngoài giữ khách buổi tối. Phương án INV duyệt ở ESC-031 cũng không nhắc thời gian chờ. Gọi điện là quy trình, máy không ép. Hệ quả: quản lý nghe máy và muốn miễn ngay thì khách vẫn trả đủ rồi được hoàn (giới hạn đã biết v1.0, BR-416 (vii); PO ghi vào release notes). v1.1: DOM đề xuất bỏ cách ghi tự do, chỉ giữ làm trạng thái "hết hạn – lễ tân tự ghi" của US-164 (BR-416 (viii)) |
| (b) | FOC trả muộn đã duyệt từ trước vẫn đi theo dòng mới | **Xác nhận** | Đúng BR-434: nhận sớm/trả muộn một khóa cho cả lượt; áp = min(số đã duyệt, phụ thu), không tự tăng, không xét lại hạn mức (BR-433 (b)). Đó là quyết định đã có của người duyệt bằng tài khoản của chính họ, không phải lễ tân miễn trong lệnh. Thực tế: khách được miễn trả muộn tới 17:00 rồi ở quá 18:00 thì giữ phần đã miễn, trả phần còn lại. Yêu cầu FOC còn chờ duyệt vẫn chặn trả phòng (US-038 AC4). Ca kiểm E31-8, E31-9 |
| (c) | Hạn hậu kiểm = `post_checkout_charge_hours` (24 giờ) | **Xác nhận** | Đúng BR-416 (4) đã ghi "trùng cửa sổ BR-427". Miễn sau chỉ làm được bằng A32 khi folio còn `settled`, nên hạn xem lại phải bằng cửa sổ. Mốc tính từ **lúc bấm trả phòng** (mã: `ctx.now` = `folio.settle` `now`, cùng giao dịch), không phải giờ rời nhập tay. `late_fee_fallback_review_hours` không tạo thành khóa riêng (BR mục 13 đã sửa). Câu oracle cũ "quá 19/04 20:30" đọc là "quá lúc bấm + 24 giờ" (oracle 10.1) |

Hai giả định còn lại (4) người bấm là MGR/OWN không tự nhận thông báo, mục vẫn mở cho MGR+; (5) quá hạn báo OWN một lần, mục giữ `warning`: **đồng ý**. MGR tự bấm rồi tự "Đã xem" không gây mất tiền, vì đường này chỉ thu đủ số chính sách; miễn sau vẫn qua A32 + hoàn mà người sửa không tự duyệt.

## Thẻ feedback

### FB-R3-DOM-BE-B-E31-01
- Mức độ: Minor
- Vị trí: `test/integration/esc031-late-fee-post-review.test.ts` (6 ca); thiết kế mục 3
- Vấn đề: Không có ca cho giả định (b) (FOC đã duyệt trước trên khóa trả muộn, rồi `postReview`), cũng không có ca A32 giảm dòng xuống dưới FOC. Thiết kế nói "an approved late FOC follows as on every path" nhưng chưa có test chứng minh trên đường mới.
- Vì sao quan trọng: Đây là chỗ duy nhất trên đường mới mà số khách trả khác số phụ thu. Nếu FOC không đồng bộ sau A32, hoàn có thể vượt số khách đã trả.
- Đề xuất sửa: Thêm ca theo oracle 10.1 E31-8: FOC 200.000 → khách trả 592.000; A32 → 396.000 → hoàn 396.000; A32 → 150.000 → FOC 150.000, hoàn 592.000 (không phải 642.000). QA chạy cùng lượt kiểm tiền nếu BE-B chưa kịp.
- Trạng thái: Open

### FB-R3-DOM-BE-B-E31-02
- Mức độ: Minor
- Vị trí: FE `CheckOutPage.tsx` (việc FE ở thiết kế mục 6); `staff-one-pager.md` bước 3
- Vấn đề: Tài liệu nhân viên đã viết theo tên nút BE đề xuất "Ghi phụ thu – quản lý xem lại". FE/UXD chưa làm màn hình, nên tên thật có thể khác.
- Vì sao quan trọng: Lễ tân làm theo tờ dán ở quầy lúc tối muộn; chữ khác màn hình là dễ bấm nhầm hoặc gọi P0 vô ích.
- Đề xuất sửa: FE/UXD dùng đúng chữ này, hoặc báo PO/DOM sửa tờ hướng dẫn trước D−1. Diễn tập staging kiểm ở `day-one-guide.md` Q10. Màn phải hiện số chỉ đọc, ô lý do bắt buộc, không có ô FOC, kèm một câu nhắc "Gọi quản lý trước khi ghi".
- Trạng thái: Open

### FB-R3-DOM-BE-B-E31-03
- Mức độ: Suggestion
- Vị trí: `late-fee-review-job.ts` (đọc `post_checkout_charge_hours` ở ngày chạy job) và `attention.service.ts` `dueOf` (đọc lúc tạo mục)
- Vấn đề: Nếu OWN đổi `post_checkout_charge_hours` giữa chừng, hạn của mục "Cần chú ý", lúc job báo OWN và `folio.post_checkout_window_until` có thể lệch nhau.
- Vì sao quan trọng: Rất hiếm (tham số gần như không đổi). Hậu quả chỉ là báo sớm hoặc muộn, không sai tiền.
- Đề xuất sửa: v1.0.1: job so `now` với `folio.post_checkout_window_until` (hoặc `reviewDueAt` trong audit) thay vì `created_at + tham số hiện tại`. Không chặn gộp.
- Trạng thái: Open

### FB-R3-DOM-BE-B-E31-04
- Mức độ: Suggestion
- Vị trí: Đóng ca (BR-526), báo cáo FOC
- Vấn đề: Khoản ghi theo `post_review` mới chỉ hiện ở thông báo và "Cần chú ý" của MGR+. Lễ tân trưởng đối chiếu cuối ca không thấy danh sách riêng.
- Vì sao quan trọng: Ba ngày đầu có đối chiếu sổ giấy lúc 22:00. Khoản 792.000–1.355.000 thu không có quản lý tại chỗ nên đáng có trong danh sách đóng ca.
- Đề xuất sửa: v1.0.1/v1.1: thêm dòng "Phụ thu trả muộn – chờ quản lý xem lại" vào đóng ca, lọc theo audit `channel = post_review`. Không chặn gộp.
- Trạng thái: Open

## Điểm làm tốt
- Không nới fail-closed của 2FA. Đường mới không nhận bất kỳ mật khẩu hay mã nào và từ chối mọi thứ trước khi ghi: đúng ý "không ai đọc mật khẩu qua điện thoại".
- Số do server quyết, đường chỉ mở khi đêm không bán được, không có ô miễn. Lễ tân không có cách nào giảm tiền.
- Miễn sau dùng lại A32 + hoàn tự sinh (BR-433 (e), `SELF_REFUND_FORBIDDEN`), không thêm đường tiền mới. Hạn xem lại khớp đúng cửa sổ folio.
