# FE-3 – V5-18: phần cọc chưa đối soát khi quản lý chấp nhận cọc thiếu

- Round 5, bước Sản xuất · FE-3 · 07/11/2026
- Nhánh `r5-fe3-v5-18`, cắt từ `origin/main`. Không rebase.
- Gộp sau #112 (`r5-b1`). Máy chủ trả `Reservation.depositUnverifiedVnd` (`deposit-unverified.ts`, `reservation-dto.ts`) ở PR đó. Hợp đồng 0.3.13 mục 1.6 đã có trên main.
- Thẻ: FB-R4-SEC-FE-HOLDS-03 (Info). Plan ghi người làm FE-B; ORC giao cho FE-3.

## 1. Việc đã làm
- Hộp Xác nhận cọc, khi OWN/MGR tích "Chấp nhận cọc thiếu" và `depositUnverifiedVnd` > 0: một dòng cảnh báo `deposit.accept_shortfall_unverified` với số tiền có đơn vị.
  - Số 0 hoặc trường vắng (vai dưới FD+, máy chủ cũ) → không hiện gì.
  - Bỏ tích thì dòng cũng mất.
- Số lấy từ lần đọc đơn mới nhất. Sau khi ghi một phần cọc (A-13), drawer đọc lại đơn, nên khoản chuyển khoản vừa ghi cũng được tính.
- Mock theo máy chủ:
  - `depositUnverifiedVnd` = min(cọc đang giữ, Σ khoản cọc `succeeded` còn `reconciliation = pending`);
  - chỉ FD+ nhận trường này;
  - khoản B4 nhập tay chờ đối soát khi là chuyển khoản, VietQR, hoặc do sale ghi (giống `recordPayment` của mock).

## 2. Chữ – NHÁP, chờ UXD chốt
`copy-v1.0.5.md` bản 2.1 chưa có câu cho V5-18 (ARC 1.6: "Câu chữ do UXD làm"). FE-3 thêm một khóa nháp vào `gen_strings.py`. Cột ghi chú đánh dấu "NHÁP FE-3 – chờ UXD chốt", để Desk không hiện khóa trần:

| Khóa | VI | EN |
|---|---|---|
| `deposit.accept_shortfall_unverified` | Trong số cọc đã nhận, {amount} chưa đối soát với sao kê. Xem tiền đã vào tài khoản OTTIMO trước khi chấp nhận. | Of the deposit received, {amount} isn't matched to the bank statement yet. Check the money is in OTTIMO's account before you accept. |

UXD sửa chữ thì chỉ sửa dòng này trong `gen_strings.py`. Mã không đổi.

## 3. Kiểm
- vitest file mới `v5-18-deposit-unverified-fe3.test.tsx`, 4 ca:
  - một chuyển khoản chờ sao kê và một khoản tiền mặt: chỉ nêu chuyển khoản, chỉ khi đã tích;
  - đã đối soát hết (0): không nói gì;
  - ghi một phần bằng chuyển khoản ngay trong hộp, rồi tích: số mới được tính;
  - phạm vi: FD nhận trường, sale không nhận.
- admin-web toàn bộ 999/999. `tsc`, `eslint`, `prettier --check` xanh.
- E2E: không thêm. Cần #112 trên stack, và cần đối soát một khoản. QA có thể dẫn T18-1…3 của ARC ở tầng API.

## 4. Giả định
- Dòng này hiện mỗi khi quản lý tích "Chấp nhận cọc thiếu", trước hoặc sau hạn giữ chỗ. Plan ghi "sau hạn", nhưng rủi ro chấp nhận tiền chưa thấy trên sao kê là như nhau ở hai lúc. Hộp cũng hiện ô này ở cả hai lúc (BUG-R3-043).
- Số không gồm khoản đang gõ trong hộp mà chưa ghi. Khoản đó được tính sau khi ghi (A-13).
