# UXD review – FE PR #130 (C0313-25: mã giao dịch bị chặn vì giống số thẻ)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng (chỉ đọc, không đẩy lên nhánh PR, không gộp): **#130** `r5-fe-bankref` @ **`b788e18e`**.
  - Nội dung nằm ở hai commit `6c428a6d` (chữ, `problem.ts`, `useSubmit`, mock, vitest) và `58bdd23b` (E2E, báo cáo FE).
  - `508be7ac`, `b8db8aeb`, `b788e18e` đều là commit gộp `main`. UXD đã so 6 tệp nội dung giữa `58bdd23b` và `b788e18e`: không đổi dòng nào. Ba commit gộp chỉ sinh lại `strings.js`.
  - Nhánh đã gồm `main` @ `74189d2c`. `git diff origin/main b788e18e` đúng 11 tệp của PR.
- Cách kiểm:
  - đọc `gh pr view 130`, `gh pr diff 130` và báo cáo FE `rounds/round-05/outputs/FE/c0313-25-bankref-fea.md`;
  - so từng byte chữ VI/EN trong `gen_strings.py` của nhánh với bảng `copy-v1.0.5.md` mục 9.8. Dấu nháy EN là `'` thẳng, giống 256 chuỗi EN khác;
  - chạy lại `gen_strings.py` trên bản `git archive` của `b788e18e` trong scratchpad: `strings-vi/en/ru.json`, `strings.js`, `strings-tables.md` không đổi (đồng bộ);
  - đọc `MoneyPage.tsx` (hộp `ExecuteRefundDialog`) và `useSubmit` ở `b788e18e` để biết câu hiện ở đâu;
  - xem 4 ảnh FE chụp (390 và 1440 px, VI và EN, dữ liệu mock) ở scratchpad phiên, thư mục `fe-bankref-shots/`. Ảnh không đưa vào repo;
  - quét phần thêm của PR: không có mã màu, `font-family`, `rgb()`, `style=`, emoji;
  - đối chiếu luật máy chủ ở BE PR #119 @ `bd958588` (`isCardNumberReference`).
- Đối chiếu: `00-brief/context/brand/brand-guidelines.md`; `product/design/design-system.md` v0.4.1 (`--bad`, `--bad-bg`, ngoại lệ 2.4); `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.2, mục 9.8 (chữ bản 1.8, câu chuẩn xác nhận ở bản 2.1) và mục 8; `rounds/round-05/responses/SEC-responses.md` mục 4.

## 0. Kết luận

| PR | Kết luận | Thẻ |
|---|---|---|
| **#130** C0313-25 @ `b788e18e` | **DUYỆT** | Chữ đúng nguyên văn 9.8. Câu hiện đúng hai chỗ (dưới ô và khung lỗi của hộp). Ô chữ tự do giữ `error.CARD_NUMBER_DETECTED`. Ảnh 390/1440 không tràn, không che nút. 4 thẻ đều ở **ngoài phần PR đổi**: 1 Minor, 3 Suggestion. Không thẻ nào là điều kiện gộp |

- Không có Blocker, không có Major.
- **Không có ESC.** Chữ và chỗ hiện thuộc quyền UXD.
- **Thương hiệu:**
  - Màu: PR không thêm màu. Câu dưới ô dùng `Field error` sẵn có (chữ `--bad` trên `--surface`, 5,76:1 sáng / 6,27:1 tối). Khung lỗi dùng `Alert tone="bad"` (`--bad-bg`). Cả hai là màu chức năng theo ngoại lệ 2.4 của design system.
  - Font: ảnh hiện đúng Lora ở tiêu đề hộp, Be Vietnam Pro ở nhãn và câu lỗi, JetBrains Mono ở ô mã (`input mono`).
  - Chữ ngắn, điềm tĩnh, không đổ lỗi, không emoji. Chữ Desk nội bộ, không cần CPY.
- **Thứ tự lên bản:** PR này gộp riêng trước #119 cũng an toàn. Trên `main`, `executeRefund` đã trả đúng cặp `bankReference` + `CARD_NUMBER_DETECTED` (dòng #119 xóa đi). Vậy Desk production đổi ngay từ câu "Ô ghi chú có dãy số…" sang câu đúng.
- **CI lúc review:** cả 8 job ở `b788e18e` còn `QUEUED`. ORC chỉ gộp khi CI xanh trên đúng SHA này.

---

## 1. Đối chiếu với `copy-v1.0.5.md` mục 9.8

### 1.1 Đạt
- **Chữ đúng nguyên văn**, khóa `pay.bank_reference_card_like`:
  - VI: "Mã này trông giống số thẻ thanh toán nên Desk không lưu. Nhập 8 chữ số cuối của mã giao dịch." (93 ký tự);
  - EN: "This looks like a card number, so Desk can't save it. Enter the last 8 digits of the transaction reference." (107 ký tự);
  - câu không có biến, không chèn giá trị đã gõ;
  - nguồn là `gen_strings.py`, ghi chú khóa trỏ về 9.8. Tệp sinh đồng bộ (mục "Cách kiểm").
- **Dưới ô** (`refund.bank_reference`, hộp "Ghi đã hoàn chuyển khoản / qua máy POS"):
  - `fieldErrorText` xét cặp (ô, mã) **trước** danh sách theo mã, như 9.8 ghi;
  - ô khớp theo đuôi `/(^|\.)bankReference$/`: nhận `bankReference`, `body.`, `payment.`, không nhận `bankReferenceNote` (vitest có ca này);
  - ảnh: icon ✕ cùng chữ `--bad`, viền ô đỏ; E2E kiểm `aria-invalid` và `aria-describedby` trỏ đúng câu.
- **Khung lỗi của hộp** đi đúng nhánh 9.8:
  - hộp chi hoàn không có `map` → khung lặp lại câu dưới ô (ảnh 390 và 1440, VI và EN);
  - hộp có `map`, ô đang hiện → "Còn {n} ô cần sửa…" (vitest);
  - ô không có trên màn → câu của ô không bị gắn thêm nhãn, vì câu đã nói "mã giao dịch". UXD đồng ý.
- **Không hiện `error.CARD_NUMBER_DETECTED`** ở ca này. E2E và vitest đều kiểm hộp không có "Ô ghi chú", "Xóa dãy số".
- **Ô chữ tự do giữ câu cũ**: `note`, `freeNote`, `replyNote`, `payment.note` vẫn ra `error.CARD_NUMBER_DETECTED`. Mã khác trên ô mã giữ câu riêng (`REQUIRED` → "Bắt buộc").
- **Không tự xóa ô**: giá trị đã gõ còn trong ô sau 422 (vitest, E2E, ảnh).
- **Lối ra của câu chạy được**: gõ 8 chữ số → lưu được (vitest `11111111`, E2E 8 số ngẫu nhiên → 201).
- **Ca SEC 4.3**: chỉ dùng số thẻ thử công khai `4111…`. E2E kiểm thân 422 không lặp lại giá trị. Có quét axe ở trạng thái lỗi.

### 1.2 Giả định của FE – UXD chốt
- **Một 422 trỏ cả ô mã và ô chữ tự do** (báo cáo FE mục 6): khung lỗi giữ `error.CARD_NUMBER_DETECTED`, dưới ô mã vẫn là câu riêng. **UXD đồng ý.**
  - Lý do: ô ghi chú mới là chỗ phải xóa dãy số, nên khung nói về ô đó là đúng. Ô mã đã có câu riêng ngay dưới ô.
  - UXD ghi ca này vào 9.8 ở bản sau của `copy-v1.0.5.md` (mục 4).
- **Hộp ghi khoản thu** chưa có ô `bankReference` trên `main`. Ô đó lên cùng PR-B3 và tự nhận câu mới qua `fieldErrors`. UXD kiểm lại khi review PR-B3, theo ca ở mục 8 của bảng chữ.

## 2. Ảnh 390 và 1440 px (dữ liệu mock)

| Ảnh | Dưới ô | Khung lỗi | Ghi chú |
|---|---|---|---|
| 390 VI | 3 dòng, dòng 3 chỉ có "dịch." | 3 dòng | Không tràn. Nút chính và Hủy vẫn thấy ở chân hộp. Tiêu đề Lora xuống 2 dòng, không đè nút đóng |
| 390 EN | 3 dòng | 3 dòng | Như VI |
| 1440 VI | 2 dòng | 2 dòng | Hộp cỡ `sm` cao vừa khung 900 px, không phải cuộn |
| 1440 EN | 2 dòng | 2 dòng | Như VI |

- Câu xuất hiện hai lần trong hộp (dưới ô và trong khung), đúng 9.8 cho hộp không có `map`. Ở 390 px hai lần này chiếm khoảng 6 dòng, chấp nhận được vì chỉ hiện sau khi bấm lưu bị từ chối.
- **Lỗi có sẵn FE nêu** (danh sách khoản hoàn phía sau hộp bị bóp hẹp ở 390 px): có thật, rõ nhất ở EN (mỗi dòng 1–2 từ). Không do PR này. UXD mở thẻ riêng 130-01.

## 3. Thẻ feedback

### FB-R5-UXD-FE-130-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/money/MoneyPage.tsx`, tab Hoàn tiền, mỗi dòng `<li className="card"><div className="row wrap"><div className="grow">…` (khoảng dòng 585–640 ở `b788e18e`). Ảnh `refund-card-like-390-en.png` và `-390-vi.png` của FE.
- Vấn đề: ở 390 px, cột chữ `.grow` bị chip và hai nút ép còn khoảng 80–100 px. Mã đơn, số tiền, lý do và "Gửi bởi…" xuống dòng từng từ một (EN: "OTM-", "0141", "·", "500,000", …). Dòng hoàn đầu tiên cao gần 500 px. Lỗi có sẵn, **không do PR #130**.
- Vì sao quan trọng: quản lý dùng điện thoại xem và chi hoàn sẽ khó đọc mã đơn và số tiền, dễ bấm nhầm dòng khi chi tiền.
- Đề xuất sửa: dùng lại mẫu `.req-row` / `.req-acts` đã có (`product/packages/ui/src/styles/app.css` dòng 373–398, trang Yêu cầu từ website). Dưới 520 px: phần chữ chiếm trọn hàng, chip và nút xuống hàng dưới, căn phải. Không thêm màu, không đổi chữ. Làm ở một PR nhỏ riêng của FE, không ghép vào #130. Kịp thì v1.0.5, không thì v1.0.6.
- Trạng thái: Open

### FB-R5-UXD-FE-130-02
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/mocks/stay.ts`, `executeRefund`, đoạn C0313-25 (khoảng dòng 4861–4870).
- Vấn đề: mock chặn theo luật "toàn bộ giá trị là 13–19 chữ số và qua Luhn" của SEC 4.1. BE #119 đã đổi theo FB-R5-SEC-BE-119-01: với giá trị không có chữ cái, máy chủ ghép dần các nhóm từ đầu chuỗi (`isCardNumberReference`). Vậy số thẻ có hạn thẻ hoặc CVV nối sau (`4111111111111111/1228`) bị chặn trên máy chủ, nhưng mock vẫn nhận.
- Vì sao quan trọng: các bản demo và ảnh dựng bằng mock sẽ khác staging. Không ảnh hưởng chữ: câu 9.8 vẫn đúng cho dạng này, và 8 chữ số cuối vẫn dưới 13 nên không bị chặn lại.
- Đề xuất sửa: khi #119 có luật ghép nhóm trên `main`, FE cho mock dùng cùng cách (ghép nhóm, dừng khi quá 19 chữ số) và thêm một ca vitest `4111111111111111/1228` → câu `pay.bank_reference_card_like`. ARC quyết có cần không.
- Trạng thái: Open

### FB-R5-UXD-FE-130-03
- Mức độ: Suggestion
- Vị trí: `FilePicker` trong `product/apps/admin-web/src/pages/stay/common.tsx` (khoảng dòng 230–245); ảnh 390 và 1440 của FE, ô "Ảnh chứng từ".
- Vấn đề: nút chọn tệp là nút gốc của trình duyệt. Nhãn nút theo ngôn ngữ trình duyệt, không theo Desk ("Choose File" trên Desk tiếng Việt khi trình duyệt để tiếng Anh). Tên tệp hiện hai lần: một lần trong nút gốc, một lần ở dòng `.li-s` bên dưới (390) hoặc bên phải (1440). Có sẵn, không do PR này.
- Vì sao quan trọng: lặp chữ và lẫn hai thứ tiếng làm hộp chi tiền trông kém gọn. Ảnh hưởng nhỏ, không sai nghiệp vụ.
- Đề xuất sửa: để sau v1.0.5. Ẩn input gốc theo kiểu `.sr-only`, dùng `Button` của DS mở hộp chọn tệp, giữ một dòng tên tệp. UXD đưa chữ nút vào bảng chữ khi PO xếp việc này.
- Trạng thái: Open

### FB-R5-UXD-FE-130-04
- Mức độ: Suggestion
- Vị trí: CSS của `Field error` và thân `Alert` (gói `product/packages/ui`).
- Vấn đề: ở 390 px VI, dòng 3 của câu dưới ô chỉ còn một từ ("dịch."). Câu lỗi dài khác trên Desk cũng gặp cảnh này.
- Vì sao quan trọng: thẩm mỹ chữ, không ảnh hưởng đọc hiểu.
- Đề xuất sửa: thêm `text-wrap: pretty` cho chữ lỗi dưới ô và thân Alert. Trình duyệt không hỗ trợ thì bỏ qua, không hại gì. Làm cùng một PR CSS bất kỳ, không cần riêng.
- Trạng thái: Open

## 4. Việc UXD tự làm sau review này (không phải thẻ cho FE)
- `copy-v1.0.5.md` 9.8, bản tới:
  - sửa đoạn mô tả luật cho khớp #119 sau FB-R5-SEC-BE-119-01 (giá trị không chữ cái, bắt đầu bằng số thẻ, có thể kèm hạn hoặc CVV). Chữ câu không đổi;
  - ghi ca "ô mã cùng ô chữ tự do" như mục 1.2.
- Review PR-B3: kiểm ô `pay.bank_reference_optional` ở hộp ghi khoản thu nhận câu mới, theo ca 9.8 ở mục 8.

## 5. Dòng đề xuất cho `01-decisions/decision-log.md`

```
| 2026-11-07 | 5 | UXD – review FE PR #130 (C0313-25) @ b788e18e: DUYỆT. Nội dung ở 6c428a6d + 58bdd23b; 508be7ac, b8db8aeb, b788e18e chỉ gộp main. pay.bank_reference_card_like đúng nguyên văn copy-v1.0.5 9.8 (VI/EN), hiện dưới ô refund.bank_reference và trong khung lỗi hộp Ghi đã hoàn chuyển khoản / qua máy POS; ô chữ tự do giữ error.CARD_NUMBER_DETECTED; tệp sinh đồng bộ; ảnh 390/1440 VI/EN không tràn. UXD chốt giả định FE: 422 trỏ cả ô mã và ô ghi chú → khung lỗi giữ error.CARD_NUMBER_DETECTED, dưới ô mã vẫn câu riêng. Gộp riêng trước #119 an toàn vì main đã trả cặp bankReference + CARD_NUMBER_DETECTED. Thẻ ngoài phạm vi PR: 130-01 Minor (tab Hoàn tiền bóp hẹp ở 390 px, PR FE riêng), 130-02/03/04 Suggestion. Gộp khi CI xanh trên b788e18e. Không ESC | UXD | rounds/round-05/reviews/UXD-on-fe-pr-130.md |
```

## 6. Điểm làm tốt
- Sửa đúng gốc ở hai hàm dùng chung (`fieldErrorText`, `useSubmit`), không vá riêng trong hộp. Các hộp ghi khoản thu sau này tự nhận câu.
- Test bám sát ca kiểm của UXD và SEC: hai cách gõ số thẻ, câu cũ không lọt, giá trị còn trong ô, lối ra 8 chữ số, axe ở trạng thái lỗi.
- Báo cáo FE nêu rõ giả định và tự chỉ ra lỗi có sẵn ở 390 px thay vì bỏ qua.
