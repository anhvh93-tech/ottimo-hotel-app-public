# DOM review – tài liệu BA v1.0.5: Tờ 2a (hộp Thông báo), câu BUG-R5-005 cho lễ tân

- Người review: DOM | Round 5 – Review (mục 7 ORC giao, gom cùng lượt `DOM-on-be-prs-101-108-110.md`) | Ngày: 07/11/2026
- Đối tượng (BA `1217858a`, `rounds/round-05/outputs/BA/report.md` mục 7):
  - `product/docs/staff-one-pager.md` Tờ 2a, gạch **Ở đâu** (câu hộp Thông báo) và gạch **Hết hạn, chưa cọc**;
  - `product/docs/release-notes.md` v1.0.5, bảng "Lỗi đội tìm thấy trong Round 5", dòng **BUG-R5-005**, cột "Tới khi v1.0.5 lên".
- Đối chiếu:
  - mã `main` @ `dce1c0fd` và tag `v1.0.4`: `hold-notices.ts` (người nhận, `push: false`), `product/apps/mobile/src/app/notifications.tsx` (`NOTIF_KEYS`, `notifRef`, không có thông báo hệ điều hành, chỉ đếm tin chưa đọc), `strings-vi.json` (`staff.notif.k.other`, `staff.notif.k.hold_*`), PR #117 (mở, ba câu riêng);
  - `product/services/api/src/shared/validation.ts` `containsCardNumber` (V-09), `guest-requests.service.ts` `note()`;
  - sổ tay `user-manual-v1.0.md` 2.4 và mục hộp Thông báo, 9.7, 10; `guides/02-le-tan.md` 9.7, 10, bảng tình huống;
  - release notes v1.0.4 dòng "Báo giữ chỗ quá hạn" (ARC sửa 07/11); decision-log 29/10 (một tài khoản giữ 6 vai, có vai quản lý).

## 0. Kết luận

| Điểm | Kết luận | Thẻ |
|---|---|---|
| Tờ 2a – hộp Thông báo | Đúng chỗ: app nhân viên, Desk không có; đúng người nhận từ v1.0.5; đúng "vẫn rà theo mã đơn". **Sai một ý:** ở v1.0.4, câu chung "Thông báo mới…" kèm mã đơn không chỉ là giữ chỗ tự hủy. Cùng câu đó còn là giữ chỗ có cọc đã quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến. Tài khoản đang trực giữ 6 vai, có vai quản lý, nên nhận cả ba. Thiếu "tin không đổ chuông" | **FB-R5-DOM-PO-08** Major (sửa trước khi in lại Tờ 2a) |
| BUG-R5-005 – câu cho lễ tân | Đúng hướng: không hỏi, không ghi số thẻ. Chưa đúng thực tế quầy ở bốn chỗ: (1) lễ tân không biết khách đã gõ gì; (2) bắt khách gửi lại là thêm việc cho khách, trong khi quầy làm được ngay qua tin nhắn; (3) dãy bị chặn không chỉ là số thẻ; (4) thiếu hai ca: khách muốn trả thẻ, khách lỡ gửi số thẻ qua tin nhắn | **FB-R5-DOM-BA-01** Minor |
| Câu khách thấy từ v1.0.5 | "Please don't include a payment card number." làm khách khó hiểu khi dãy bị chặn là số tài khoản hoặc hai số điện thoại | **FB-R5-DOM-UXD-02** Suggestion (v1.0.6) |

DOM không sửa thẳng tệp nào. Hai lý do:

- Cả hai điểm đều đổi ý, không chỉ đổi chữ.
- BA và PO đang sửa đúng các tệp này trong cùng checkout.

Mỗi thẻ có chữ thay nguyên văn để dán.

## 1. Tờ 2a – hộp Thông báo trên app nhân viên

### 1.1 Đối chiếu từng ý với mã

| Ý trên Tờ 2a | Thực tế | Đánh giá |
|---|---|---|
| Hộp Thông báo ở app nhân viên, Desk không có | Đúng. Sổ tay 2.4 cũng ghi vậy | Giữ |
| Máy hoặc điện thoại ở quầy đăng nhập app trong ca | Cần thiết: tin vào tài khoản, không vào máy | Giữ |
| (không nói) | **Tin không đổ chuông.** Push vẫn là Mock: `hold-notices.ts` gửi với `push: false`. App nhân viên không có thông báo hệ điều hành, không âm thanh. Chỉ có số tin chưa đọc khi mở app | Thêm: mở hộp ở mỗi mốc |
| "tới v1.0.5 chỉ có giữ chỗ do bạn tạo, câu 'Thông báo mới…' kèm mã đơn" | Đúng với **tin tự hủy** (`hold_expired`): v1.0.4 gửi người tạo, người chốt; chỉ khi không có ai mới gửi lễ tân. Nhưng v1.0.4 còn hai tin giữ chỗ khác, **cùng câu chung, cùng kèm mã đơn** (`NOTIF_KEYS` ở `v1.0.4` thiếu cả ba loại, `notifRef` hiện mã đơn): `hold_overdue_with_deposit` tới người tạo, người chốt **và mọi lễ tân, lễ tân trưởng, quản lý**; `hold_overdue_cap` (12:00 ngày đến, còn giữ chỗ) tới quản lý, chủ đầu tư. Tài khoản đang trực giữ 6 vai, có vai quản lý, nên nhận đủ ba. Release notes v1.0.4 (ARC sửa 07/11) và sổ tay mục hộp Thông báo đã ghi đúng: "cả ba tin hiện câu chung" | **Sai ý**: thẻ 08 |
| "từ v1.0.5 mọi lễ tân, lễ tân trưởng có tin 'Giữ chỗ chưa cọc đã hết hạn và tự hủy'" | Đúng người nhận (PR #100, đã gộp). Câu riêng cần PR #117 (còn mở); ORC đã chốt bản cắt v1.0.5 cần #117 | Giữ, theo giả định 1 |
| "Có tin vẫn rà theo mã đơn" | Đúng. Rà theo mã ở sổ giao ca vẫn là cách duy nhất bắt được giữ chỗ do sale, CTV tạo (FB-R5-DOM-PO-07) | Giữ |

### 1.2 Vì sao quan trọng

Ở quầy, người trực thấy "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm `OTM-…`. Đọc Tờ 2a, họ hiểu đó là giữ chỗ chưa cọc đã tự hủy, rồi sang gạch **Hết hạn, chưa cọc** ("**Báo khách ngay**"). Nếu tin thật ra là giữ chỗ **có cọc** đã quá hạn, sẽ có hai rủi ro:

- **Báo nhầm cho khách đã chuyển tiền rằng đơn đã hủy.** Căn vẫn đang giữ. Khách có thể đặt nơi khác, đòi hoàn cọc, hoặc khiếu nại. Đây là khách đã trả tiền, nên mất lòng tin nặng nhất.
- **Bỏ sót giữ chỗ có cọc.** Người trực tưởng Desk đã tự lo, nên không gọi khách. Đơn treo tới mốc 12:00 ngày đến.

Gạch **Ở đâu** đã dặn "đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về rồi báo khách". Câu hộp Thông báo phải dẫn về đúng bước đó: **làm theo trạng thái đơn, không theo câu tin**.

### FB-R5-DOM-PO-08
- Mức độ: **Major** (sửa trước khi UXD dựng lại và chủ đầu tư in lại Tờ 2a; một câu thay một câu)
- Vị trí:
  - `product/docs/staff-one-pager.md` Tờ 2a, gạch **Ở đâu**, câu bắt đầu "**Hộp Thông báo trên app nhân viên**…";
  - cùng tờ, gạch **Hết hạn, chưa cọc**, vế "tin ở hộp Thông báo trên app nhân viên (dòng **Ở đâu**). **Báo khách ngay**".
- Vấn đề: tờ nói ở v1.0.4 hộp Thông báo "chỉ có giữ chỗ do bạn tạo", với câu chung kèm mã đơn. Thực tế, cùng câu chung kèm mã đơn còn là giữ chỗ có cọc đã quá hạn và giữ chỗ còn chờ cọc sau 12:00 ngày đến (mục 1.1). Tờ cũng không nói tin không đổ chuông.
- Vì sao quan trọng: mục 1.2. Người trực có thể báo khách đã cọc rằng đơn đã hủy, hoặc bỏ sót giữ chỗ có cọc.
- Đề xuất sửa (chữ thay nguyên văn):
  - Gạch **Ở đâu**, thay cả câu hộp Thông báo bằng:
    > **Hộp Thông báo trên app nhân viên** (Desk không có; máy hoặc điện thoại ở quầy đăng nhập app trong ca). Tin không đổ chuông: mở hộp ở mỗi mốc. Tin chỉ để nhắc: gõ mã đơn trong tin vào ô tìm, bấm **Tất cả**, làm theo trạng thái đơn. Tới v1.0.5 mọi tin giữ chỗ là câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm mã đơn. Tin đó có thể là giữ chỗ tự hủy (chỉ đơn bạn tạo), giữ chỗ có cọc đã quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến. Từ v1.0.5 mỗi loại có câu riêng; tin "Giữ chỗ chưa cọc đã hết hạn và tự hủy" tới mọi lễ tân, lễ tân trưởng. Có tin vẫn rà theo mã đơn.
  - Gạch **Hết hạn, chưa cọc**, thay vế đầu bằng:
    > Desk **tự hủy** và nhả căn: đơn **Đã hủy**, lý do **Hết hạn giữ chỗ** (tin ở hộp Thông báo: dòng **Ở đâu**). Kiểm tiền về theo mã đơn, rồi **báo khách ngay** (đơn CTV: báo CTV trước).

    Phần sau giữ nguyên, từ "Khách còn muốn:…".
  - Chỗ in:
    - câu mới dài hơn câu cũ khoảng 3 dòng ở cỡ 11 pt, một cột;
    - không vừa thì bỏ câu "Tới v1.0.5…" ngay khi v1.0.5 lên production. Câu này chỉ đúng tới ngày lên;
    - không cắt "Tin chỉ để nhắc…".
  - BA sửa cùng ý ở sổ tay `user-manual-v1.0.md` 2.4 (gạch "Có tin hay không…") và `guides/02-le-tan.md` (cùng chỗ). Thay "Thấy tin: mở đơn theo mã, kiểm tiền về theo mã đơn rồi báo khách" bằng: "Thấy tin: mở đơn theo mã. Đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về theo mã đơn rồi báo khách. Đơn còn **Giữ chỗ · chờ cọc**: làm theo mục giữ chỗ có cọc bên dưới."
- QA (khi thử v1.0.5 trên staging): mỗi giữ chỗ dưới đây vào hộp Thông báo của tài khoản 6 vai đúng một tin, đúng câu riêng, có mã đơn, không có tên khách:
  - một giữ chỗ chưa cọc tự hủy;
  - một giữ chỗ có cọc thiếu đã quá hạn;
  - một giữ chỗ còn chờ cọc lúc 12:00 ngày đến.
- Trạng thái: **PO-08 Closed** (phần Tờ 2a) – DOM đọc lại lần cuối 07/11/2026 trên `53bbde7c`:
  - hai câu ở gạch **Ở đâu** và **Hết hạn, chưa cọc** đúng nguyên văn; phần còn lại của Tờ 2a khớp với hai câu mới (ba mốc rà, có cọc, sổ giao ca, trước khi rời quầy);
  - DOM sửa thẳng một câu nhỏ ở bảng "Cách in": câu cũ vừa bảo in lại Tờ 2a bản 06/11, vừa bảo in bản 07/11. Nay tách ra: Tờ 1 in bản 06/11, Tờ 2a chỉ in bản 07/11. Không đổi ý.
  - UXD dựng PDF được.
  - Phần sổ tay 2.4 và `guides/02-le-tan.md` (BA):
    - DOM đã xem bản BA đang sửa trong checkout, chưa commit. Bản đó đúng ý thẻ: "Tin không đổ chuông", "Tin chỉ để nhắc", ba loại tin ở v1.0.4, và tách hai trạng thái **Đã hủy** / còn **Giữ chỗ · chờ cọc** kèm câu "**Không** báo khách đơn đã hủy";
    - phần này đóng khi BA commit; không chặn bản in.

## 2. BUG-R5-005 – câu cho lễ tân khi khách báo tab Yêu cầu lỗi

### 2.1 Thực tế quầy

1. **Lễ tân không thấy khách đã gõ gì.** Máy chủ chặn trước khi ghi, nên không có yêu cầu, không có dòng nào trên Desk. Khách chỉ thấy "Hệ thống đang gặp sự cố. Thử lại sau ít phút…". Khách sẽ nhắn hoặc gọi: "trang báo lỗi". Khách không nói "tôi có ghi số thẻ". Câu "nhờ khách bỏ dãy số thẻ" chỉ dùng được khi khách kể ra nội dung đã gõ.
2. **Bắt khách gửi lại là thêm việc cho khách đang bực.** Quầy làm được ngay qua kênh khách đang nhắn, như khách chưa có link (sổ tay 9.7: "Khách chưa có link vẫn nhắn Zalo hoặc gọi điện như trước"). Yêu cầu có phí thì ghi folio khi xong, như mọi yêu cầu. Việc chính của lễ tân là xong yêu cầu, không phải sửa trang.
3. **Dãy bị chặn không chỉ là số thẻ.** Luật V-09 (`containsCardNumber`) thử Luhn trên mọi đoạn 13–19 chữ số, cho một khoảng trắng hoặc gạch giữa các chữ số. Ví dụ bị chặn:
   - số tài khoản ngân hàng 13–14 chữ số: khoảng 1/10 tới 1/5 số bị chặn. Khách hay gõ số tài khoản khi xin hoàn cọc;
   - hai số điện thoại viết liền, cách nhau một khoảng trắng: gần như luôn bị chặn.

   Khách nghe "bỏ số thẻ" sẽ đáp "tôi không ghi số thẻ".
4. **Thiếu hai ca hay gặp:**
   - Khách gõ số thẻ thật thường vì muốn trả tiền: tour, xe, gia hạn. Quầy đã có luật: không nhận số thẻ qua tin nhắn, mời trả tại máy POS (sổ tay 10).
   - Khi báo lỗi, khách có thể dán nguyên lời nhắn có số thẻ vào Zalo. Hiện chưa có câu nào dặn quầy làm gì với tin đó.

### FB-R5-DOM-BA-01
- Mức độ: Minor (lỗi P3, chỉ tới khi v1.0.5 lên; không mất tiền, không lộ dữ liệu trên máy chủ)
- Vị trí: `product/docs/release-notes.md` v1.0.5, bảng "Lỗi đội tìm thấy trong Round 5, sửa ở v1.0.5", dòng **BUG-R5-005**, cột "Tới khi v1.0.5 lên". Đoạn đang sai bắt đầu từ "Khách nhắn OTTIMO vì lỗi này: …".
- Vấn đề: bốn điểm ở mục 2.1.
- Vì sao quan trọng:
  - Khách đang ở chờ một yêu cầu nhỏ, như khăn hay xe, mà phải gửi lại nhiều lần.
  - Khách bị hỏi về "số thẻ" mà họ không hề ghi.
  - Số thẻ khách lỡ gửi qua Zalo nằm lại trên điện thoại của cơ sở.
- Đề xuất sửa: thay đoạn từ "Khách nhắn OTTIMO vì lỗi này: …" tới hết ô bằng:
  > Khách báo tab **Yêu cầu** lỗi: nhận yêu cầu ngay trên kênh khách đang nhắn, làm như yêu cầu qua Zalo (sổ tay 9.7). Lời nhắn có dãy từ 13 chữ số trở lên (số thẻ, số tài khoản, hai số điện thoại viết liền) thì bị chặn. Khách muốn gửi lại trên trang thì nhờ khách bỏ dãy số đó. Không hỏi dãy số đó là gì; không hỏi, không ghi số thẻ. Khách muốn trả bằng thẻ: mời trả tại máy POS ở quầy. Khách lỡ gửi số thẻ trong tin nhắn: không chép, không chụp, không chuyển tiếp; xóa tin đó trên máy của cơ sở, nhờ khách thu hồi tin.
- Ghi chú:
  - **SEC đọc** câu "Khách lỡ gửi số thẻ trong tin nhắn…" (giả định 3). SEC quyết thêm hai điểm: có ghi sổ giao ca không ("`OTM-…` khách gửi số thẻ qua tin nhắn – đã xóa", không ghi số), có báo chủ đầu tư không.
  - Sau khi SEC chốt, BA đưa câu này vào sổ tay mục 10, bảng tình huống ("Khách đọc số thẻ qua điện thoại…"), thành luật chung. Lý do: ca này không chỉ xảy ra với lỗi BUG-R5-005.
- Trạng thái: Open (BA sửa release notes; SEC đọc câu xóa tin)

## 3. Câu khách thấy từ v1.0.5

### FB-R5-DOM-UXD-02
- Mức độ: Suggestion (v1.0.6; không chặn v1.0.5, PR #107 đã gộp)
- Vị trí: `strings-*.json` khóa `gw.req.card_detected` (VI "Vui lòng không ghi số thẻ thanh toán.", EN "Please don't include a payment card number.").
- Vấn đề: luật V-09 chặn cả số tài khoản và hai số điện thoại viết liền (mục 2.1 điểm 3). Khách không ghi số thẻ đọc câu này sẽ không biết phải bỏ gì, lại nhắn quầy.
- Đề xuất sửa: UXD cân nhắc một câu nói về "dãy số dài". Ví dụ:
  - EN: "Please remove long numbers, such as a card or bank account number, and send again.";
  - VI: "Vui lòng bỏ dãy số dài (như số thẻ, số tài khoản) rồi gửi lại.".

  Câu này cũng đúng luật OTTIMO: quầy không nhận số tài khoản qua trang khách; hoàn tiền đi "Cùng cách khách đã trả" (FB-R5-SEC-PO-04). Giọng văn theo brand guideline: ngắn, điềm tĩnh, tiếng Anh dẫn. SEC xác nhận có muốn giữ chữ "card" để khách hiểu vì sao bị chặn hay không.
- Trạng thái: Open (UXD + SEC, backlog v1.0.6 – PO)

## 4. Giả định

1. PR #117 vào bản cắt v1.0.5 (ORC `d2bcf8b1`: bản cắt cần #117). Nếu #117 trễ, câu "Từ v1.0.5 mỗi loại có câu riêng" ở thẻ 08 đổi thành "từ khi app nhân viên có bản sửa".
2. Push tới điện thoại vẫn là Mock ở v1.0.5. Nếu OPS bật push thật, bỏ vế "Tin không đổ chuông".
3. Xóa tin có số thẻ trên máy của cơ sở là thực hành chuẩn của ngành lưu trú: không giữ số thẻ nhận qua kênh không an toàn, xóa và báo khách là không nhận. Đây là [GIẢ ĐỊNH] DOM; SEC chốt theo PCI DSS và Nghị định 13/2023.
4. Tỷ lệ chặn nhầm ở mục 2.1 điểm 3 là ước lượng theo luật Luhn: mỗi đoạn có khoảng 1/10 khả năng qua. Không phải số đo trên dữ liệu khách.
