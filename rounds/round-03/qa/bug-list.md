# Danh sách lỗi – Round 3

- Tác giả: QA | Mở: 23/10/2026 – Sprint 1, bước Kiểm thử (phân loại CI 39976959706 trên `origin/main` 8368fac, job "docker images build · E2E smoke")
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn từ R2: `rounds/round-02/qa/bug-list.md` (không chép lại; BUG-R2-218 vẫn Open – ca `TC-L7-053` là `test.fail` đúng dự kiến).
- Mã: `BUG-R3-xxx`. Nếu luồng QA khác (fuzz R3-Q30) cũng mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge; ca E2E tham chiếu mã qua `e2e/support/known-bugs.ts`.

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 1 | 1 | 0 | 0 |
| P2 | 0 | 0 | 0 | 0 |
| P3 | 0 | 0 | 0 | 0 |
| **Tổng** | **1** | **1** | **0** | **0** |

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R3-001 | P1 | Desk "Xóa công nợ" không xin xác thực lại người xin (R3-Q25) → mọi lần xóa nợ trên Desk bị 422 `secret` REQUIRED | FE-A (+ UXD chữ) | Open |

## 3. Chi tiết

### BUG-R3-001 – Desk "Xóa công nợ" không gửi xác thực lại theo R3-Q25
- **Mức:** P1. Lỗi chạm tiền nên QA xét P0 trước. Hạ xuống P1 vì đã chứng minh lỗi chặn an toàn (fail-closed):
  - server từ chối trước khi ghi (`foc.service.ts` kiểm `requesterReauthenticated` trước mọi bước ghi);
  - test tích hợp `r3-be83-esc026.test.ts` "R3-Q25" khẳng định không có yêu cầu xóa nợ nào được ghi;
  - không sai số tiền, không mất dữ liệu; công nợ giữ nguyên, lễ tân vẫn thu nợ bình thường.
  - Còn lại là mất một chức năng tiền: quản lý và chủ đầu tư không xóa được công nợ trên Desk. Vì vậy không thấp hơn P1.
- **Môi trường:** stack dùng một lần `ottimo-qa2ci` (compose dev, cổng riêng 53000/58081–58083, không đụng dev/demo/staging), ảnh dựng từ `8368fac`, DS-E. Project `desk-clock`, ngày ảo.
- **Các bước tái hiện:**
  1. Có đơn 1 đêm. Lúc trả phòng (B18), MGR ghi công nợ 100.000.
  2. Hôm sau, đăng nhập `qa.mgr`, mở đơn, bấm "Xóa công nợ".
  3. Chọn khoản 100.000, ghi chú "Khach khong lien lac duoc", bấm xóa.
- **Kết quả thực tế:**
  - `POST /folios/{id}/lines/{lineId}/foc` trả `422 VALIDATION_FAILED` với `errors: [{field: "secret", code: "REQUIRED"}]`.
  - Hộp thoại không có ô mật khẩu. `DebtCollectDialog.tsx` (`DebtWriteOffDialog`, khoảng dòng 250) chỉ gửi `{kind, amountVnd, reasonCode: 'debt_write_off', note}`.
- **Kết quả mong đợi:** theo R3-Q25 (FB-R2-SEC-BE-82 (b), BE-B lượt kiểm tiền bước 4), người xin `debt_write_off` xác thực lại như người duyệt (S1). Hộp thoại phải xin mật khẩu (cùng mẫu các hộp duyệt), gửi `authMethod: 'password'` + `secret`, rồi 201 (`approved` khi ≤ cơ sở, `pending` chờ OWN khi vượt).
- **Bằng chứng:**
  - Ca `TC-X-082` (`e2e/ui-clock/debt-collect.s5.spec.ts`), lượt 23/10 ~23:05: "requestFoc debt_write_off: mong đợi 201, thực tế: 422 … secret REQUIRED".
  - Trên CI 39976959706 ca này nằm trong 54 ca "did not run", vì project `desk-clock` phụ thuộc `clock` đang đỏ. Khi `clock` xanh, ca sẽ đỏ.
- **Nguyên nhân:**
  - Server R3-Q25 đã gộp cùng BE-83 (BE-B bước 4).
  - Phía Desk không được giao trong `sprint-1-plan.md`: R3-Q25 chỉ ghi cho BE-B, không có việc FE.
- **Vai chịu trách nhiệm:** FE-A (hộp thoại + MSW + test). UXD duyệt chữ (brand OTTIMO, Việt/Anh).
- **Ca chống tái phát:**
  - `TC-X-082` đánh `knownBug('BUG-R3-001')` ở dòng đầu (`support/known-bugs.ts`), nên CI không đỏ vì lỗi đã ghi.
  - Khi sửa, PR của FE-A thêm bước nhập mật khẩu vào `TC-X-082` và xóa dòng `BUG-R3-001` khỏi `OPEN`. QA review PR đó.
- **Hạn:** trước cổng QC Sprint 1 (lượt kiểm tiền G1). Không chặn các ca API.
- **Trạng thái:** Open
