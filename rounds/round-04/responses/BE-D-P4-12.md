# BE-D trả lời ARC-on-v104-p4-12 (P4-12 `v104/be-refund-dest`, PR-I)

- Round 4 (v1.0.4), bước **Phản hồi & sửa**, 04/11/2026.
- Nhánh đã rebase lên `origin/main` @ `4e94fbcc`. Kết quả test: xem mục "Kiểm" bên dưới.
- Test chỉ dùng số tài khoản giả (BIN 970436, 8899001122 / 7766554433). Tệp này không có số tài khoản hay tên chủ tài khoản.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-BE-D-P412-01 | Done | Thêm `parseRefundAccount(plain)` trong `payments/internal/refunds.service.ts`, dùng ở cả `peekCarryableDestination` và `getDestination`. Hàm `try/catch` quanh `JSON.parse`, kiểm `accountNo`/`accountHolder` là chuỗi. Lỗi thì ném `Error('refund account unreadable')`, không kèm nội dung, nên `describeError` của `ProblemFilter` không còn chuỗi nào để in. Ca mới (e2) trong `v104-refund-dest.test.ts`: bản niêm phong hợp lệ (DEK riêng, AAD đúng id) nhưng bản rõ không phải JSON → 500 cả thao tác, yêu cầu và folio như trước. stdout/stderr và thân 500 không có số TK giả, không có `is not valid JSON`. Ca này tự kiểm trước rằng `JSON.parse` thô có trích số TK giả, để ca không mất ý nghĩa. Thử ngược: dùng lại `JSON.parse` thô ở `peek` thì (e2) đỏ vì log Nest in số TK giả. Đóng luôn BED-03 ý 2 của SEC (trước đó dời v1.0.5). |
| FB-R4-ARC-BE-D-P412-02 | Done | `folio.service.ts` `closeStayCredit`: điều kiện thành `plan.createVnd > 0 && cancelReason === 'superseded'`, viết giống `refundsDownToCredit`. Không chuyển điều kiện vào `peekDestination`, để giữ chữ ký cổng `RefundDestinationCarrier` đúng như ARC đã duyệt. |
| FB-R4-ARC-BE-D-P412-03 | Done | `peekCarryableDestination` chia hai lượt. Lượt 1 so các trường không mã hóa trên mọi dòng: `target_type`/`target_id`, `refund_method`, `refund_bank_bin`, `refund_destination_set_by`, có đủ `refund_account_enc`/`key_id` (nếu `bank_transfer`). Lượt 2 chỉ giải mã khi lượt 1 qua và phương thức là `bank_transfer`, rồi so số TK + chủ TK chuẩn hóa. Nguồn không thể mang thì không giải mã, nên lỗi giải mã ở nguồn đó không làm 500 thao tác của quầy. Đóng luôn BED-03 ý 1 của SEC. 7 ca cũ vẫn đạt, không đổi kết quả. |

## Kiểm (trên PostgreSQL 17 riêng, container dùng một lần)
- `v104-refund-dest`: 8/8 (7 ca cũ + (e2)).
- Toàn bộ vitest `@ottimo/api`: 155 tệp đạt, 2 tệp bỏ qua; 3884 ca đạt, 24 bỏ qua (ca cần biến môi trường riêng như `db-role`, `health`), 0 lỗi. Log toàn bộ không có số TK giả.
- `pnpm typecheck` (api): đạt. `pnpm lint` (eslint toàn repo + turbo typecheck): đạt, 0 lỗi. Prettier các tệp sửa: đạt.

## Tệp sửa
- `product/services/api/src/modules/payments/internal/refunds.service.ts`
- `product/services/api/src/modules/folio/public/folio.service.ts`
- `product/services/api/test/integration/v104-refund-dest.test.ts`
- `rounds/round-04/outputs/BE/v1.0.4-be-d-refund-dest.md` (mục 8)
