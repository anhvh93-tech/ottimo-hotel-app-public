# FE-A – C0313-25: mã giao dịch bị chặn vì giống số thẻ (Desk, hộp chi hoàn)

- Round 5, bước Phản hồi & sửa · FE-A · 07/11/2026
- Nguồn:
  - UXD `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 1.8, mục 9.8 (`pay.bank_reference_card_like`);
  - SEC `rounds/round-05/responses/SEC-responses.md` mục 4 (chọn (a), 4.1 luật, 4.2 lối ra, 4.3 chỉ dùng số thẻ thử công khai);
  - BE PR #119 `r5-v09-reference` (`assertNotCardNumberReference`).
- Nhánh `r5-fe-bankref` cắt từ `origin/main` `260dcf56`. **Lên cùng bản với BE PR #119.**

## 1. Việc đã làm
- **Chữ**: thêm `pay.bank_reference_card_like` vào `design/tools/gen_strings.py`, đúng nguyên văn VI và EN của UXD 9.8, rồi sinh lại các tệp chữ. Không tự viết chữ.
- **`app/problem.ts`, `fieldErrorText`**:
  - thêm bảng cặp (ô, mã) `FIELD_PAIR`, xét **trước** danh sách theo mã;
  - ô khớp `/(^|\.)bankReference$/` (nhận cả `bankReference`, `body.bankReference`, `payment.bankReference` của các đường `PaymentCreate`) cùng mã `CARD_NUMBER_DETECTED` → `pay.bank_reference_card_like`;
  - hàm `fieldPairKey` dùng chung cho `useSubmit`.
- **`pages/stay/common.tsx`, `useSubmit().text`**:
  - 422 `CARD_NUMBER_DETECTED` mà **mọi** `errors[]` đều là ô có câu theo cặp → đi nhánh `VALIDATION_FAILED`;
  - hộp không có `map` (hộp chi hoàn): khung lỗi lặp lại câu dưới ô;
  - hộp có `map` và ô đang hiện: "Còn {n} ô cần sửa";
  - ô không có trên màn: câu của ô không bị gắn thêm nhãn, vì câu đã nói "mã giao dịch".
- **Không đổi**: ô ghi chú, lý do và mọi ô chữ tự do vẫn hiện `error.CARD_NUMBER_DETECTED`. Một 422 trỏ cả ô mã và ô ghi chú cũng giữ câu cũ ở khung lỗi; câu riêng vẫn hiện dưới ô mã.
- **Hộp áp dụng**: hộp "Ghi đã hoàn chuyển khoản / qua máy POS" (`MoneyPage.tsx`, đang chạy trên production).
  - Hộp ghi khoản thu chưa có ô `bankReference` trên main (ô `pay.bank_reference_optional` lên cùng PR-B3, UXD 9.1).
  - Khi ô đó được thêm, nó tự nhận câu mới qua `fieldErrors` / `fieldErrorText`, kể cả khi ô có tiền tố `payment.`. Không cần sửa thêm.
- Không tự xóa ô. Giá trị đã gõ không lặp lại trong câu, toast hay log.

## 2. Mock (`mocks/stay.ts`, `executeRefund`) theo SEC 4.1 và #119
- Bỏ `.` `/` `_` `-`. Nếu phần còn lại là trọn 13–19 chữ số và qua Luhn → 422 `CARD_NUMBER_DETECTED`, `errors: [{ field: 'bankReference', code: 'CARD_NUMBER_DETECTED' }]`.
- Không ghi gì, không lặp lại giá trị.
- Mã có chữ, dãy số ngắn hơn hoặc dài hơn, dãy không qua Luhn → nhận.

## 3. Test
- **Vitest** `src/__tests__/c0313-25-bankref-fea.test.tsx`, 8 ca:
  - `fieldErrorText`:
    - cặp có hoặc không tiền tố → câu mới;
    - `note`, `freeNote`, `replyNote`, `payment.note` → câu cũ;
    - `bankReference` + `REQUIRED` → "Bắt buộc";
    - EN đúng câu UXD.
  - `useSubmit().text`:
    - chỉ ô mã → câu mới;
    - có `map` → "Còn 1 ô cần sửa";
    - ô ghi chú, hoặc ô ghi chú cùng ô mã → câu cũ.
  - Hộp chi hoàn (qa.mgr, mock):
    - gõ `4111-1111-1111-1111` rồi `4111111111111111` → câu mới dưới ô (`aria-describedby`, `aria-invalid`) và trong khung lỗi;
    - không có "Ô ghi chú", "Xóa dãy số";
    - giá trị còn trong ô, không có lệnh chi;
    - gõ `11111111` → lưu được;
    - mã 16 số không qua Luhn → lưu được.
- **E2E** (`tests/e2e/ui/desk-writes.s3.spec.ts`, project desk-chromium, ca mới "C0313-25 (E)"):
  - FD tạo khoản hoàn, nhập nơi nhận; MGR duyệt (API);
  - chủ đầu tư gõ số thẻ thử công khai `4111-1111-1111-1111` → 422 `CARD_NUMBER_DETECTED` ở `bankReference`, thân trả lời không có giá trị đã gõ;
  - câu mới dưới ô và trong khung lỗi, không có câu ô ghi chú, giá trị còn trong ô;
  - axe (WCAG 2.2 AA, không có vi phạm critical/serious) ở trạng thái lỗi;
  - gõ 8 chữ số → 201, `bankReference` gửi đúng 8 số, khoản hoàn đã chi đủ.
  - Ca này chạy được cả với máy chủ trên main: luật cũ `containsCardNumber` cũng chặn `4111-1111-1111-1111`. Ca mã ngân hàng toàn số bị luật cũ chặn nhầm thuộc test của BE #119.
- Admin-web: toàn bộ vitest; `tsc` (admin-web, tests), `eslint`, `prettier`.

## 4. Ảnh cho UXD (dữ liệu mẫu của mock, không có dữ liệu khách thật)
Thư mục `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/fe-bankref-shots/`:
- `refund-card-like-390-vi.png`, `refund-card-like-390-en.png` (cả trang);
- `refund-card-like-1440-vi.png`, `refund-card-like-1440-en.png`.

Ảnh không đưa vào repo, chờ QA kiểm che dữ liệu. Nhận xét để UXD xem (UXD 9.8 có hẹn đo xuống dòng):
- hộp cỡ `sm`, câu dưới ô xuống 3 dòng ở 390 px VI và 2 dòng ở 1440 px. Không tràn, không che nút;
- ở 390 px, danh sách khoản hoàn phía sau hộp đang bị bóp hẹp. Lỗi này có sẵn và không thuộc PR này. FE ghi lại để UXD xem có cần thẻ riêng.

## 5. Việc cần vai khác (không ESC)
- **ORC/OPS**: PR này và BE #119 lên cùng bản. Nếu chỉ có PR này thì Desk vẫn đúng với luật cũ, vì luật cũ cũng trả cặp `bankReference` + `CARD_NUMBER_DETECTED`.
- **UXD**: xem ảnh mục 4.
- **QA**: chạy ca SEC 4.3 / UXD 9.8 trên staging sau khi tag có #119 và PR này. Ca của hộp ghi khoản thu chờ PR-B3.

## 6. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - máy chủ có thể trả ô có tiền tố (`payment.bankReference`), nên FE khớp theo đuôi tên ô;
  - một 422 trỏ cả ô mã và ô chữ tự do giữ câu cũ ở khung lỗi (UXD 9.8 chỉ nói ca "mọi `errors[]` đều là `bankReference`").
