# SEC review – FE-A PR #176 (V5-5B 5B-1 "Ghi tiền về sau khi hủy" + V5-51 Mã giao dịch)

- Người review: SEC | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #176 @ **`6c733b49`** (`6c733b49b22d9a0190cd508475ce6e729cdaf447`), draft cho tới khi #163 gộp. 32 tệp admin-web + copy.
- SEC đọc kỹ: `AfterCancelDialog.tsx`, `app/afterCancel.ts`, `app/problem.ts` (409 `DUPLICATE_BANK_REFERENCE`), `components/BankReferenceField.tsx`, `ReservationDrawer.tsx` (ai thấy nút), `ReservationDialogs.tsx` (hộp cọc, `DepositNoticeDialog`), `attention.ts` ("Không thấy tiền"), `MoneyPage.tsx` (Đối soát, Hoàn tiền, Cần duyệt), các chỗ thêm ô mã giao dịch (`BookingDialog`, `CheckInPayment`, `DebtCollectDialog`, `PaymentPanel`). Đối chiếu `openapi.yaml` (`PaymentCreate.posAuthCode` maxLength 12, `bankReference` pattern), `assertNoCardNumber` phía API.
- Không chạy test (FE báo 101 file / 1133 test đạt). Không có dữ liệu khách.

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN** về bảo mật. Gộp được khi #163 gộp và CI xanh. 0 Blocker, 0 Major, 1 Minor, 1 Suggestion. Không ESC.

Thẻ 01 (Minor) là lỗi có sẵn trong mọi ô mã chuẩn chi POS của Desk, không do PR này tạo ra, nhưng hộp mới chép lại đúng kiểu đó. Sửa trong v1.0.5 nếu kịp (nhỏ, một hàm dùng chung), không thì v1.0.6.

## 1. Các điểm ORC hỏi

| Điểm | Mã | Kết quả |
|---|---|---|
| Hộp thẻ chỉ có mã chuẩn chi, không ảnh, không số thẻ | `card ? <ô posAuthCode> : <FilePicker + BankReferenceField>`: khi chọn thẻ, ô ảnh và ô mã giao dịch không được vẽ. Lúc gửi: `attachmentId` chỉ khi `!card && proof`, `bankReference: card ? undefined : …`. Đổi từ chuyển khoản sang thẻ thì ảnh và mã giao dịch còn trong state nhưng **không** được tải lên hay gửi đi. Ô mã chuẩn chi: chữ và số, `maxLength 12`, `autoComplete="off"`, help `co.pos_no_card` | Đạt. Không có chỗ nào nhận số thẻ. Xem thẻ 01 về việc cắt bớt khi dán |
| Quyền FD+ | Nút "Ghi tiền về sau khi hủy" chỉ khi `fd && isClosedBooking(status) && folioId`. "Không thấy tiền" (`deposit_after_cancel`): chỉ FD+ thấy nút đóng, ghi chú bắt buộc ≥ 3 ký tự. Sale/CTV trên đơn đã đóng chỉ có "Báo đã nhận cọc" (202, mở mục Cần chú ý, không tạo phiếu thu). Server vẫn là chỗ chặn (x-roles của `recordPayment` (B), `resolveAttentionEvent`) | Đạt. FE ẩn đúng; không có đường nào để sale ghi phiếu thu |
| 409 trùng mã giao dịch: FD+ thấy mã đơn, sale không | `problemView`: chỉ dùng `duplicateReservationCode` khi server gửi (server chỉ gửi cho FD+, SEC ARC-21); thiếu thì câu `error.DUPLICATE_BANK_REFERENCE_no_code`, không nêu đơn nào. FE không tự tìm hay suy ra mã đơn từ chỗ khác | Đạt |
| Hộp thẻ không gửi `bankReference` | Như dòng 1. `DepositDialog`, `PaymentPanel`, `BookingDialog` cũng chỉ gửi khi phương thức là chuyển khoản / VietQR (`PaymentPanel` chỉ chuyển khoản) | Đạt |
| V5-51 không ở bước xác nhận VietQR | `DepositDialog`: ô mã giao dịch ẩn khi `viaQr` (xác nhận mã QR đang chờ) và khi `acceptOnExisting`. `confirmPaymentReceived` không nhận trường này; FE không gửi | Đạt. Đúng hợp đồng |
| Ô mã giao dịch | Lọc `[^A-Za-z0-9./_-]` khi gõ, `maxLength 64`, đúng pattern hợp đồng; `autoComplete="off"`, `spellCheck={false}`. 422 `CARD_NUMBER_DETECTED` → câu `pay.bank_reference_card_like` dưới ô, không lặp lại giá trị | Đạt. Ô 64 ký tự để lọt chuỗi 13–19 số tới server, nên luật SR-PAY-10 của server vẫn bắt được |
| Hoàn tiền `payment_after_cancel` | Đích cố định "về tài khoản khách đã trả": ẩn đổi đích, ẩn chi tiền mặt, ẩn dòng phương thức và `••last4`; không hỏi số tài khoản (SEC S3). Không còn giao dịch chuyển khoản → câu `error.refund_no_transfer_left`, không có lối sang tiền mặt | Đạt |
| Đối soát | Cột hiện `bankReference`, thiếu thì hiện `note` như trước PR (cột cũ đã hiện `note`). Nhãn **Có thể trùng** chỉ là mã đơn server gửi trên trang của FD+/quản lý | Đạt. Không mở thêm dữ liệu |
| Ảnh báo có | Tải lên với mục đích `deposit_receipt`, gắn đơn; ảnh của sale/CTV → server 422 `NOT_IN_LIST`; đổi ảnh thì đổi khóa idempotency (không dùng lại khóa của ảnh bị từ chối) | Đạt |
| Toast, câu lỗi | Chỉ mã đơn và số tiền, trên màn của nhân viên. Không đưa vào URL, log hay analytics | Đạt |

## 2. Thẻ

### FB-R5-SEC-FE-176-01
- Mức độ: Minor
- Vị trí: `AfterCancelDialog.tsx`, ô `posAuthCode` (`maxLength={12}`); cùng kiểu có sẵn ở `ReservationDialogs.tsx` `DepositDialog` (ô `posCode`, `maxLength={12}`) và các ô mã chuẩn chi khác của Desk.
- Vấn đề: thuộc tính `maxLength` của trình duyệt **cắt** chữ dán vào xuống 12 ký tự trước khi `onChange` chạy. Lễ tân dán nhầm số thẻ 16 chữ số vào ô mã chuẩn chi: ô giữ 12 số đầu, và Desk gửi đi. Phía API có `assertNoCardNumber` cho `posAuthCode`, nhưng luật này cần 13–19 chữ số, nên 12 số không bị bắt. Kết quả: 12 số đầu của một số thẻ được lưu thành "mã chuẩn chi".
- Vì sao quan trọng: PCI DSS chỉ coi số thẻ đã cắt là ngoài phạm vi khi giữ tối đa 6 số đầu và 4 số cuối. 12 số đầu vượt mức đó. Ô này lại nằm trên phiếu thu, đi vào Đối soát và sao lưu. SR-PAY: "không bao giờ nhận số thẻ".
- Đề xuất sửa (FE-A, một hàm dùng chung cho mọi ô mã chuẩn chi):
  - bỏ `maxLength` khỏi `<input>` (hoặc đặt 32), để giá trị dán vào tới được `onChange` nguyên vẹn;
  - trong `onChange`: nếu chuỗi (sau khi bỏ khoảng trắng, dấu gạch) có từ 13 chữ số liền trở lên thì **xóa ô**, không giữ phần nào, và hiện câu dưới ô (UXD viết, cùng ý `co.pos_no_card`: "Đây giống số thẻ. Chỉ nhập mã chuẩn chi trên phiếu POS");
  - còn lại: lọc chữ và số, chặn ở 12 bằng kiểm tra độ dài (lỗi `TOO_LONG` dưới ô), không cắt lặng lẽ;
  - một ca test: dán `4111 1111 1111 1111` → ô rỗng, có câu cảnh báo, không gọi API.
  Không cần sửa API trong v1.0.5. Ghi cho ARC/BE (v1.0.6): `posAuthCode` có thể thêm `pattern: '^[A-Za-z0-9]{1,12}$'` để server từ chối chuỗi khác chữ, số.
- Trạng thái: Open

### FB-R5-SEC-FE-176-02
- Mức độ: Suggestion
- Vị trí: `AfterCancelDialog.tsx`, ô ghi chú (`maxLength 500`, bắt buộc).
- Vấn đề: ghi chú bắt buộc ở mọi lần ghi, và với thẻ thì gợi ý `rsv.after_cancel.note_hint_card`. Người gõ có thể chép cả dòng phiếu POS vào ghi chú. Server đã chặn chuỗi giống số thẻ trong văn bản tự do (V-09, `CARD_NUMBER_DETECTED`), nên không có lỗ. Chỉ là câu lỗi khi đó sẽ hiện ở đâu.
- Đề xuất sửa: kiểm có một ca test: 422 `CARD_NUMBER_DETECTED` trên `note` hiện câu dưới ô ghi chú (không lặp lại giá trị) và không xóa các ô khác. Nếu đã có thì đóng thẻ.
- Trạng thái: Open

## 3. Dòng Tờ 1 mới (PO `dcb3ac50`) so với runbook 1.2

**Khớp.** Dòng "Gửi nhầm người" của `staff-one-pager.md` (và HTML đã dựng lại) dùng đúng câu ngắn DOM chốt (`DOM-on-ba-card-v574-01.md` mục 3), kể cả câu "Không sửa liên hệ theo lời người khác". Các ý khớp runbook 1.2 mục 4 bước 1: nhầm do mình gửi thì tạo link mới tới liên hệ trên đơn; đã gửi đúng liên hệ mà vẫn nhầm, hoặc không chắc, thì không gửi link mới, không nhắn thêm, khách làm thủ tục tại quầy. Phần sổ giao ca, không chụp hội thoại, nhắn thẳng chủ đầu tư, ghi lạ thì gọi ngay giữ nguyên như SEC đã đọc ở `a38bfcdc`.
- Tờ 1 không có ô "liên hệ trên đơn sai: có/không" của mẫu mục 6. SEC chấp nhận như ba ô kia (`SEC-responses.md` 8.4): `guides/02` 17.3 có đủ mẫu. Nếu lần dựng sau còn chỗ, PO thêm "liên hệ sai: có/không" vào dòng sổ giao ca: ô đó cho SEC biết có phải tính cả các tin trước đó (xác nhận, nhắc giờ) đã tới liên hệ sai. Suggestion, không chặn in.
- Chủ đầu tư in Tờ 1 bản này được.

## 4. Dòng decision-log (ORC chép)

`| 2026-11-07 | 5 | **SEC – review FE-A PR #176 (V5-5B 5B-1 ghi tiền về sau khi hủy + V5-51 mã giao dịch) @ 6c733b49: DUYỆT CÓ ĐIỀU KIỆN, gộp khi #163 gộp và CI xanh.** Hộp thẻ chỉ mã chuẩn chi (không ảnh, không mã giao dịch, không số thẻ; đổi phương thức không gửi ảnh, mã còn trong state); nút chỉ FD+, sale/CTV chỉ Báo đã nhận cọc (202); Không thấy tiền chỉ FD+, ghi chú bắt buộc; 409 DUPLICATE_BANK_REFERENCE chỉ nêu mã đơn khi server gửi (FD+); hộp thẻ không gửi bankReference; V5-51 không ở bước xác nhận VietQR; hoàn payment_after_cancel đích cố định, không tiền mặt, không hỏi số tài khoản. Minor 176-01: maxLength 12 của ô mã chuẩn chi (mọi ô POS của Desk, có sẵn) cắt số thẻ dán vào còn 12 số, lọt luật 13–19 số của server – xóa ô khi có ≥ 13 chữ số, không cắt lặng lẽ; v1.0.5 nếu kịp; ARC/BE v1.0.6 cân nhắc pattern cho posAuthCode. Suggestion 176-02 (ca test CARD_NUMBER_DETECTED trên note). Tờ 1 PO dcb3ac50 khớp runbook 1.2, in được. Không ESC | SEC | rounds/round-05/reviews/SEC-on-fe-pr-176.md |`

## 5. Điểm làm tốt

- Hộp thẻ bỏ hẳn ô ảnh và ô mã giao dịch, không chỉ ẩn bằng CSS, và lúc gửi kiểm lại phương thức: không có cách nào để ảnh hay mã đi kèm phiếu thẻ.
- Câu 409 tách hai bản theo việc server có gửi mã đơn hay không. FE không tự suy mã đơn, nên quyền vẫn nằm ở server.
- Đích hoàn của `payment_after_cancel` bị khóa ở mọi màn (Cần duyệt, Hoàn tiền, hộp chi), kể cả nút dự phòng khi server từ chối.
