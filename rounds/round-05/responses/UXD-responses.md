# UXD – Phản hồi review Round 5

- Người trả lời: UXD · 06/11/2026 · Bước: Phản hồi & sửa.
- Tệp đã sửa: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` **bản 1.2**.
- Thẻ CPY về bảng chữ v1.0.5 được trả lời ngay trong `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`, ở mục 8 và mục 11. Tệp này ghi phần trả lời cho DOM.

## Trả lời DOM – `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8 và 10

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-UXD-01 (Major) | Fixed | Bảng chữ 4.14. Bỏ vế "Bạn sẽ được nhắc {hours} giờ…" ở cả ba câu `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr`. Thay bằng giờ hạn `{time}` (từ `held.holdExpiresAt`), "chưa cọc thì tự hủy", rồi việc người tạo làm: "Tự theo dõi giờ này; khách cần thêm giờ thì báo lễ tân trước hạn." Câu không hứa nhắc và không nói "Desk không nhắc", vì lễ tân, quản lý tạo giữ chỗ vẫn thấy "Giữ chỗ sắp hết hạn". Không còn `{hours}`, nên bỏ 6 khóa số nhiều của bản 1.1 và không cần câu riêng cho giá trị 0. Bản 1.3 (thẻ CPY FB-R5-CPY-UXD-V105-12): vế cuối đổi sang việc tự làm, "Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn.", vì sale, CTV tự gia hạn được (BR-303, A03). Chữ CPY nguyên văn |
| DOM 8.1 – G6 | Fixed | Bảng chữ 4.3. `stay.charge_penalty_note` dùng nguyên chữ DOM: VI "Phí phạt và tiền bồi thường hư hỏng không tính vào doanh thu phòng.", EN "Fines and damage charges don't count as room revenue.". FE hiện câu khi `item.category === 'penalty' \|\| item.category === 'damage'`. Giữ tên khóa |
| DOM 8.2 – `hold_expiry_reminder_hours = 0` | Done | 0 là không nhắc. Câu mới ở 4.14 không nói tới nhắc, nên đúng với mọi giá trị, kể cả 0 |
| DOM 8.3 – 29 tên `params.k.*`, `c3_stepup_minutes` | Done | DOM xác nhận đúng nghĩa. Bảng chữ 2.1 và 4.4 không đổi |
| DOM 8.4 – `weekend_nights` | Done | Cùng hướng UXD ghi ở bảng chữ mục 6: sửa bộ kiểm cho nhận mã thứ `["FRI","SAT"]`, không đổi bộ tính giá. ARC chốt, BE sửa (BUG-R5-001). Không có khóa chữ mới |
| DOM 10 – CPY thẻ 04 | Fixed | Bảng chữ 4.8. `bill.line.late_fee_after_limit` vào bảng chính. BE-B (mục 6): `amount_vnd` bằng `limit_ref_vnd` thì ra `late_fee_as_night`, khác thì ra `late_fee_after_limit`. Mục 8 có ca kiểm của DOM (800.000 → 400.000; 800.000 kèm FOC 400.000). Thẻ 04 trong tệp review CPY đã đổi sang Fixed |

Ghi chú:
- DOM mục 9 (tin `hold_expired` gửi thêm lễ tân) không cần chữ mới: kind đã có. Khi tin lên, câu ở 4.14 vẫn đúng.
- Không có ESC mới. Tệp này không có dữ liệu khách, không có số hoa hồng.

## Trả lời ARC – `rounds/round-05/reviews/ARC-on-mob-pr-117.md` (07/11/2026, bước Review)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-UXD-117-01 (Suggestion) | Accepted | ARC đúng: ghi chú `staff.notif.k.hold_expired` còn người nhận theo 0.3.12. Chữ ghi chú mới ở bảng chữ bản 2.0 mục 9.10: "người tạo + người chốt + mọi tài khoản đang hoạt động có vai FD, FDL tại cơ sở (0.3.13 bổ sung 1, DOM mục 9; v1.0.5 V5-1B)". Chữ hiển thị VI/EN không đổi (đã xem trên app, `UXD-on-prs-97-116-117-118-122.md` mục 5). MOB áp vào `gen_strings.py` ở lượt sinh lại khi gộp `main` vào #97; UXD sửa `content-guide.md` dòng 4150 ở lượt đồng bộ v0.4.7. Đóng khi cả hai xong |
| FB-R5-ARC-MOB-117-01 (phần UXD chọn biểu tượng) | Done | `hold_expired` → `x`; `hold_overdue_with_deposit`, `hold_overdue_cap` → `clock` (review mục 5.3). MOB thêm 3 dòng `ICON` ở #97 hoặc v1.0.6 |

## Trả lời DOM – `rounds/round-05/reviews/DOM-on-prs-112-121-122.md` (07/11/2026, bước Review)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-DOM-UXD-112-01 (Suggestion) | Done (phần UXD) | Bảng chữ bản 2.1 mục 9.12. Nhận đủ 6 nhóm và nghĩa `lockReason` của DOM mục 2.2. Chữ nhãn khác tên nhóm ở 3 chỗ, để một mã chỉ có một nhãn trên Desk: "Khách trả dư" giữ nhãn có sẵn "Hoàn tiền khách trả thừa"; "Trả phòng sớm" giữ "Hoàn khi trả sớm" (tách với lý do dòng folio); "Chuyển khách vì OTTIMO hết căn" viết "Hoàn khi chuyển khách sang nơi khác". Nhóm hủy viết "Hoàn khi hủy hoặc không đến", vì có `no_show`. `overbooking_relocated` cũng là `CancelReasonCode`, nên FE xét mã này trước nhóm hủy. Câu `debt_reduction_requires_write_off` dùng lại `folio.adjust_debt_locked` / `folio.debt_fd`, sửa cho đúng BR-525: DOM xác nhận cụm "phát sinh còn trong hạn sửa" (thẻ FB-R5-UXD-DOM-112-03). Phần ARC (mô tả `OpenRefund.reasonCode` ở 0.3.14) còn mở |

## Trả lời SEC – `rounds/round-05/reviews/SEC-on-prs-111-118-122.md` (07/11/2026, bước Review)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-ARC-24, ý 2 (phần UXD) | Done | Câu chuẩn giữ như bảng chữ 9.8: VI "…Nhập 8 chữ số cuối của mã giao dịch.", EN "…Enter the last 8 digits of the transaction reference.". Bản 2.1 ghi hai chỗ hợp đồng còn "8 ký tự cuối" (`openapi.yaml` `recordPayment` (B), `contract-0.3.13.md` dòng C0313-25). Đã báo ARC qua thẻ FB-R5-UXD-ARC-111-01 |
