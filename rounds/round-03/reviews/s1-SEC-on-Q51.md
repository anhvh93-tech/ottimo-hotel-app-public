# SEC review – R3-Q51 "Tài khoản nhận chuyển khoản (VietQR)" (BE-B server + FE-A màn)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review
- Nhánh: `be-b/r3-q51-receiving-account`, **head `d99f6e2`** (nằm trên `main` `8e0b08c`). Các commit:
  - `1119632`: server;
  - `0c65de9`: gộp màn FE-A `0ca52a8`;
  - `d99f6e2`: rebase, migration 0084, payload email.
- Căn cứ: `outputs/SEC/s1-security-requirements.md` mục C (Q51-1…Q51-9, ca bắt buộc); A.5 (S2, 06.23); OpenAPI 0.3.8 (`getParameterHistory`, `setParameter`, `cancelScheduledParameter`).
- Đã đọc:
  - diff `8e0b08c..d99f6e2`: `parameters.service.ts`, `platform.controller.ts`, `receiving-account.ts`, migration 0084, `ReceivingAccount.tsx`, `ParamsPage.tsx`, api-client;
  - test `r3-q51-receiving-account.test.ts`, `r3-q51-fea.test.tsx`.
- Dữ liệu dùng để kiểm: toàn bộ là số tài khoản giả. Tệp này không ghi số tài khoản thật, không ghi bí mật.

## Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **Gộp** | **Gộp được** ở `d99f6e2`. Không có Blocker, không có Major. |
| Q51-1 Chỉ OWN | Đạt. GET lịch sử, PUT và hủy lịch: vai khác OWN → 403 có ghi `access.denied`; `listParameters` bỏ hẳn khóa này với vai khác; FE chỉ gắn khối khi vai là `owner`. SEC dò thêm FDL và CTV: đều 403. Thiếu ca HK (FB-Q51-03). |
| Q51-2 Che số | Đạt cho mọi đường đọc, audit, thông báo, outbox, `idempotency_key`, và cả log khi chạy test (SEC quét: không thấy số đầy đủ). Định dạng `•••• 1234` + `bankName` từ bảng BIN, đúng đề xuất Suggestion. **Còn một đường rò do người dùng gõ:** số tài khoản viết trong `reason` (FB-Q51-01). |
| Q51-3 Màn nhập | Đạt. Không điền sẵn; `autocomplete="off"`, `spellCheck=false`; giá trị chỉ nằm trong state của hộp thoại, không vào Web Storage, đóng hộp thoại là mất. Ô xác nhận chặn dán. Màn xem lại hiện tên ngân hàng · `•••• 4 số cuối` · chủ tài khoản · ngày. Không có nút "xem đầy đủ" (Q51-8). |
| Q51-4 S2 | Đạt. Gọi `StrongReauthService` **trước** unit of work: mật khẩu, thêm TOTP hoặc mã khôi phục khi đã bật 2FA. Sai → 401, không ghi gì. Thiếu → 422 `REQUIRED`. OWN được kiểm vai (403) trước khi kiểm mật khẩu. FE có ca 2FA sai mã / đúng mã. |
| Q51-5 Từ ngày mai, hủy lịch | Đạt. `effectiveFrom ≤ ngày kinh doanh` → 422 `EFFECTIVE_FROM_TOMORROW`, kể cả lần đặt đầu. Hủy: 404 khi không có dòng; 409 khi dòng đã có hiệu lực (khóa `FOR UPDATE`, so ngày trong cùng giao dịch). |
| Q51-6 Audit + báo | Đạt. Audit `money` che số (gồm cả lần hủy, có `cancelledEffectiveFrom`). Thông báo OWN/MGR chỉ mang ngày làm mã. Email qua outbox `staff.email` chỉ chứa template, cờ owners và ngày, không có số. |
| Q51-7 Kiểm đầu vào | Đạt (SEC dò thêm): tên sai định dạng, trường thừa (`NOT_IN_LIST`), số quá dài → 422. Lỗi 422 không nhắc lại giá trị. Không có số trong URL. |
| Q51-9 Staging | Không thuộc mã. INV tự nhập trên màn khi lên staging. Giữ quy tắc không quét QR staging bằng app ngân hàng thật cho tới lúc đó. |

## Kiểm đã chạy
Chạy trên worktree tách riêng ở `d99f6e2`, Postgres 17 mới, migrate từ đầu tới 0084 (đã gỡ sau khi chạy).
1. `tsc --noEmit` của api: đạt.
2. `r3-q51-receiving-account.test.ts`: **6/6 đạt**. Admin-web `r3-q51-fea.test.tsx`: **9/9 đạt**.
3. Test dò tạm của SEC (không commit, đã xóa):
   - tên sai định dạng, trường thừa, số quá dài → 422, không nhắc lại số;
   - mật khẩu sai → 401;
   - FDL, CTV đọc lịch sử → 403;
   - cùng `Idempotency-Key` gửi lại → trả bản đã che; MGR dùng lại key đó → 403;
   - quét `idempotency_key.response_body`: 0 lần có số; quét toàn bộ log của lượt chạy: 0 lần có số;
   - **ghi số đầy đủ vào `reason` → 200**, và số nằm trong `config_parameter.reason`, `audit_event.reason` và phản hồi (FB-Q51-01).

## Thẻ feedback

### FB-R3-SEC-Q51-01
- Mức độ: Minor
- Vị trí: `platform.controller.ts` `setParameter` / `cancelScheduledParameter` (chỉ có `assertNoCardNumber('reason')`); `parameters.service.ts` (lưu `reason`).
- Vấn đề:
  - `reason` chỉ chặn số thẻ (Luhn). Nếu OWN ghi kiểu "Đổi sang TK 5550001112223" thì số đầy đủ được lưu ở `config_parameter.reason` và `audit_event.reason`.
  - Nhật ký `money` được MGR đọc đầy đủ, vì trình xem audit cho owner/manager xem trọn. Như vậy MGR thấy được số mà Q51-1 không cho xem.
- Vì sao quan trọng: lời nhắn tự do đi vòng qua lớp che số. Ghi lý do theo kiểu này là thói quen rất dễ gặp.
- Đề xuất sửa:
  - với khóa `payment_receiving_account` (cả đặt lẫn hủy), từ chối `reason` có dãy ≥ 6 chữ số liền nhau, hoặc có chứa đúng `accountNo` vừa gửi: 422 `reason` `ACCOUNT_NUMBER_NOT_ALLOWED`. Ở FE, thêm gợi ý không ghi số tài khoản vào lý do;
  - thêm ca test vào bước quét JSON của Q51-2.
- Trạng thái: Open

### FB-R3-SEC-Q51-02
- Mức độ: Minor
- Vị trí: migration `0084_parameter_cancel_scheduled.sql` (`GRANT DELETE ON config_parameter TO ottimo_app`).
- Vấn đề:
  - Quyền DELETE được cấp cho cả bảng, mọi khóa, mọi dòng, kể cả dòng đang có hiệu lực hoặc đã qua. Lịch sử tham số trước đây không xóa được ở mức CSDL (0001).
  - Giới hạn "chỉ dòng tương lai" hiện chỉ nằm trong mã ứng dụng.
- Vì sao quan trọng: nếu có một lỗi khác, chẳng hạn SQL injection hay bug trong đường khác, thì xóa được lịch sử tham số (gồm tài khoản nhận và tham số bảo mật) mà không còn dấu ở bảng. Đây là phòng thủ nhiều lớp.
- Đề xuất sửa:
  - thêm trigger `BEFORE DELETE ON config_parameter`: chỉ cho xóa khi `effective_from` > ngày kinh doanh hiện tại của cơ sở (hoặc tối thiểu > `current_date` theo múi giờ cơ sở), còn lại thì RAISE;
  - hoặc thay quyền DELETE bằng một hàm `SECURITY DEFINER` chỉ xóa dòng tương lai;
  - kèm test: xóa thẳng bằng SQL một dòng đang hiệu lực, với role `ottimo_app` → lỗi.
- Trạng thái: Open

### FB-R3-SEC-Q51-03
- Mức độ: Minor
- Vị trí: `r3-q51-receiving-account.test.ts` (ca RBAC); `r3-q51-fea.test.tsx`.
- Vấn đề:
  - Ca bắt buộc ở mục C yêu cầu RBAC đủ 4 vai (OWN 200; MGR, FD, HK 403). Test có MGR, FD, SAL (SEC dò thêm FDL, CTV), nhưng **chưa có HK** vì fixture không có vai này.
  - Chưa chạy axe trên màn mới.
  - Chưa có ca E2E "rời màn rồi quay lại → form trống". Test component chỉ kiểm việc không lưu vào storage.
- Vì sao quan trọng: thiếu ca bắt buộc thì QA/QC không thể đánh dấu đủ mục C.
- Đề xuất sửa: thêm vai `housekeeping` vào fixture cùng ca 403; QA thêm ca axe và E2E (Playwright) ở bước Kiểm thử.
- Trạng thái: Open

### FB-R3-SEC-Q51-04
- Mức độ: Suggestion (ý kiến SEC cho câu ARC đang quyết: `current` vắng mặt ở lần đặt đầu)
- Vị trí: `parameters.service.ts` `set` (luật từ ngày mai áp cả lần đầu); OpenAPI `getParameterHistory` khi chưa có dòng.
- Ý kiến:
  - SEC **giữ luật "từ ngày mai" cho cả lần đặt đầu**. Khoảng chờ đó là lúc email cảnh báo tới mọi OWN; người chiếm phiên OWN không đặt được tài khoản có hiệu lực ngay.
  - Việc API trả `current` vắng mặt (hoặc 404 ở FE, như `ReceivingAccountSection` đang xử lý) trong ngày đầu không có hệ quả bảo mật, chỉ cần màn và QR báo "chưa có tài khoản nhận".
  - Nếu ARC chọn cho phép hiệu lực ngay ở lần đầu, SEC chỉ chấp nhận khi có đủ ba điều kiện: chưa từng có dòng nào cho cơ sở; vẫn qua S2; vẫn gửi email OWN. Khi đó báo SEC review lại phần đổi.
- Trạng thái: Open (chờ ARC)

## Điểm làm tốt
1. Một hàm che số dùng chung cho mọi đường đọc và audit, và có test quét JSON cả các bảng lưu (audit, outbox, thông báo, phản hồi idempotency), không chỉ quét phản hồi HTTP.
2. Kiểm vai đặt trước kiểm mật khẩu và chạy ngoài unit of work: người không có quyền không dùng được endpoint này để dò mật khẩu, và lần sai vẫn được đếm.
3. Màn nhập đúng tinh thần "số chỉ sống trong hộp thoại": không điền sẵn, gõ hai lần, chặn dán ở ô xác nhận, không có đường xem số đầy đủ.
