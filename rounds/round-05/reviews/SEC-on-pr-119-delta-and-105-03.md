# SEC – Phần chênh PR #119 (`4cc06646` → `9a7a8243`) và câu hỏi ARC FB-R5-ARC-BE-105-03 ý 4

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- **PR #119** (`r5-v09-reference`, BE-B), HEAD **`9a7a8243`**, không DRAFT. Phần chênh so với bản SEC đã duyệt (`4cc06646`, `SEC-on-prs-105-119-125-128.md` mục 2) là một commit, ba tệp: `shared/validation.ts` (`isCardNumberReference`), `test/v09-reference-card-units.test.ts`, `test/integration/approvals-refund-payout.test.ts`. CI của `9a7a8243` đang chạy lúc đọc.
- **FB-R5-ARC-BE-105-03 ý 4** (`ARC-on-prs-105-119-125-128.md`): `card_pos` trên đơn đã đóng (chỉ khi còn nợ N > 0, `posAuthCode` bắt buộc) có phải bắt ảnh phiếu POS không. ARC đề nghị không.

Cách kiểm: đọc `git diff 4cc06646 9a7a8243`; chạy hai tệp test của PR trong worktree riêng ở scratchpad, với PostgreSQL tạm; thêm một script dò ngẫu nhiên (chỉ số thẻ thử, sinh theo Luhn, không lưu). Không chạm nhánh PR, không gọi staging hay production. Tệp này không có bí mật, mã đơn hay dữ liệu khách.

---

## 1. PR #119 @ `9a7a8243`: **DUYỆT**

Kết luận: **DUYỆT @ `9a7a8243`**, gộp khi CI xanh trên đúng SHA này. **FB-R5-SEC-BE-119-01 → Done.** FB-R5-SEC-BE-119-02 → ý 3 (regex test kiến trúc) Done; ý 1–2 vẫn Open cho PR-B3 như thẻ đã ghi.

| Kiểm | Kết quả |
|---|---|
| Đúng luật SEC 119-01 | Đúng. Chỉ áp cho giá trị không có chữ cái (`^[0-9./_-]+$`). Tách theo `.` `/` `_` `-`, ghép dần từ nhóm đầu; tại một ranh giới nhóm có 13–19 chữ số qua Luhn → thẻ; vượt 19 chữ số thì dừng, trả "mã". Giá trị có chữ giữ luật cũ, nên rủi ro `REF4111…` vẫn là rủi ro đã chấp nhận |
| 4 dạng SEC đã thử (`…/1228`, `….12.28`, `…-123`, `5555…-123`) | 422. Có trong test đơn vị và test tích hợp `executeRefund` (tích hợp: 7/7 qua trên PostgreSQL tạm) |
| Script dò: 20.000 chuỗi "số thẻ thử 15/16/19 chữ số, viết liền hoặc chia nhóm 4, nối hạn hoặc CVV bằng dấu ngẫu nhiên" | **20.000/20.000 bị chặn** (bản `4cc06646`: khoảng 10 %) |
| Chặn nhầm mã toàn số | 12 chữ số liền: 0 %. 20 chữ số liền: 0 %. `FT` + 14 chữ số: 0 %. Mã có dấu, mỗi ranh giới rơi vào 13–19 chữ số (`8-6`, `8-8`, `6.6.4`), và 16 chữ số liền: khoảng 10 %, đúng mức SEC đã nhận ở 119-01. Lối ra 8 ký tự cuối giữ nguyên |
| Ca biên | `4111111111111111--123` (nhóm rỗng) và `-4111…` → chặn. Chuỗi rỗng → không phải thẻ (mẫu ô đã bắt trước) |
| Không lưu, không lặp giá trị | Không đổi so với `4cc06646`. 422 chỉ có `field` + `code` |
| 119-02 ý 3 | Regex test kiến trúc thành `looksLikeCard\w*`, nay bắt được đúng hàm `looksLikeCard` |

Rủi ro còn lại mới thấy, SEC chấp nhận mức **Low**, không mở thẻ: số thẻ **có nhóm số đứng trước** (`2026-4111…`, `1228/4111…`) phần lớn lọt (script: 192/5.000 bị chặn). Đây cùng loại với "số thẻ có chữ đứng trước" đã nhận ở C0313-25: phải gõ cố ý, dán nhầm từ ô thẻ không ra dạng này. SEC ghi vào SR-PAY-10.

SEC đã sửa **SR-PAY-10** theo luật mới (lời hứa của thẻ 119-01): luật ghép nhóm, danh sách test, và rủi ro còn lại "nhóm số đứng trước".

---

## 2. FB-R5-ARC-BE-105-03 ý 4: SEC chốt **không bắt ảnh phiếu POS**

SEC **đồng ý với ARC**: `card_pos` trên đơn đã đóng không bắt `attachmentId`. Không đưa `card_pos` vào tập "bắt ảnh" của `recordAfterClosure`.

Lý do:
- **Ảnh là đường dễ nhất để số thẻ đầy đủ vào kho.** Ở quầy, chụp nhầm mặt thẻ (hoặc mặt sau có CVV) thay cho phiếu là chuyện dễ xảy ra. Máy chủ quét được số thẻ trong chữ (V-09), nhưng **không quét được trong ảnh**. SR-PAY-08 cấm lưu PAN, nhất là CVV, ở bất kỳ đâu. Thông tin thẻ, tài khoản cũng là dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023, nên ít thu là đúng hướng (cần luật sư xác nhận cách hiểu này, như mọi điểm pháp lý khác).
- **Khoản thẻ đã có chứng từ đủ để đối soát mà không cần ảnh:**
  - `posAuthCode` bắt buộc, mẫu `^[A-Za-z0-9]{1,12}$` cộng V-09. Ô này không chứa nổi một số thẻ 13–19 chữ số;
  - khoản luôn `pending`, MGR+ đối chiếu với bảng kết toán của máy POS (số tiền + mã chuẩn chi);
  - audit `payment.recorded` có `afterClosure` + `reservationStatus`, OWN lọc được bằng `afterClosureOnly`.
- **Không có đường rút tiền qua `card_pos`.** Trần N (ý 3) và "`card_pos` không bao giờ sinh hoàn" (ý 6) chặn việc ghi khống để tạo yêu cầu hoàn. Ghi khống chỉ làm nợ tạm biến mất trên Desk, và lộ ra khi đối soát POS. Khác với chuyển khoản ở V5-48: chuyển khoản không có gì khác để đối chiếu, nên mới bắt ảnh.

Điều kiện đi kèm (PR-B3 và FE-A; SEC kiểm ở review PR-B3):
1. Giữ đúng ý 2, 3, 5, 6 của ARC: `card_pos` chỉ khi N > 0, `amountVnd ≤ N`, luôn `pending`, không sinh hoàn. Test t1–t7 của ARC là kiểm chứng.
2. Ảnh **vẫn được gửi kèm nếu muốn** (luật thường, `deposit_receipt`, S7). Nhưng nơi nào Desk cho đính ảnh cho khoản `card_pos` thì có câu nhắc ngay cạnh nút chụp: chỉ chụp phiếu POS, không chụp mặt trước hay mặt sau của thẻ. UXD/CPY viết câu, FE-A gắn vào.
3. Lỡ tải ảnh có số thẻ lên: hôm nay Desk **chưa có lệnh xóa tệp đính kèm** (`openapi.yaml` chỉ có `uploadAttachment`, `getAttachment`). Vì vậy ca này đi theo SR-INC-01: MGR+ báo OWN và SEC ngay, OPS gỡ tệp theo runbook sự cố, ghi sổ sự cố. Sổ tay BA thêm một dòng cho trường hợp này. Việc không gỡ được tệp từ app cũng là thêm một lý do để không bắt ảnh.

Nếu sau này đội muốn bắt ảnh (ví dụ khi POS không xuất được bảng kết toán), chỉ cần thêm `card_pos` vào tập bắt `attachmentId`, kèm câu nhắc ở điều kiện 2. SEC sẽ xem lại khi đó.

---

## 3. Thẻ

Không có thẻ mới.
- FB-R5-SEC-BE-119-01 → **Done** @ `9a7a8243`.
- FB-R5-SEC-BE-119-02 → ý 3 Done @ `9a7a8243`; ý 1–2 Open (PR-B3).
- FB-R5-ARC-BE-105-03 ý 4 → SEC chốt: **không bắt ảnh**, kèm 3 điều kiện ở mục 2.

---

## 4. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | SEC – PR #119 phần chênh 4cc06646 → 9a7a8243: DUYỆT, gộp khi CI xanh đúng SHA. isCardNumberReference cho giá trị không chữ cái ghép nhóm từ đầu, chặn khi một ranh giới nhóm đạt 13–19 chữ số qua Luhn: số thẻ kèm hạn/CVV nối bằng - . / _ bị chặn (script 20.000/20.000; 4cc06646 khoảng 10 %), chặn nhầm khoảng 10 % mỗi ranh giới trong 13–19 chữ số như SEC đã nhận, lối ra 8 ký tự cuối giữ. FB-R5-SEC-BE-119-01 Done; 119-02 ý 3 Done, ý 1–2 vẫn cho PR-B3. Rủi ro còn lại Low SEC chấp nhận: số thẻ có nhóm số đứng trước (cùng loại có chữ đứng trước), đã ghi SR-PAY-10. FB-R5-ARC-BE-105-03 ý 4: SEC chốt card_pos trên đơn đã đóng KHÔNG bắt ảnh phiếu POS (ảnh là chỗ PAN/CVV lọt mà máy chủ không quét được; posAuthCode 1–12 ký tự + V-09, luôn pending, đối soát POS, trần N, không sinh hoàn); ảnh vẫn nhận nếu gửi, Desk nhắc "chỉ chụp phiếu, không chụp thẻ" cạnh nút chụp, ảnh lỡ có số thẻ xử lý theo SR-INC-01. Không ESC | SEC | rounds/round-05/reviews/SEC-on-pr-119-delta-and-105-03.md |`

---

## 5. Phạm vi và giới hạn

- SEC chỉ đọc phần chênh của #119, không review lại phần đã duyệt ở `4cc06646`.
- Câu trả lời 105-03 chỉ cho ý 4 (chứng từ). Các ý khác của thẻ (N, thứ tự khóa, 5B-1) thuộc ARC/BE-D, SEC kiểm ở review PR-B3.
- Worktree và PostgreSQL tạm nằm trong scratchpad, xóa sau review.
