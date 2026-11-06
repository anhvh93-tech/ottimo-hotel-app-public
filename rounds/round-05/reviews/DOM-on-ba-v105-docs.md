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

## 4. Lượt 2 – câu BA thêm ở `792e510a` (07/11/2026)

ORC giao 07/11. Đối tượng: `rounds/round-05/outputs/BA/report.md` mục 8. Các đoạn đọc:

- ca đêm: `guides/02-le-tan.md` mục 2, 13.3, 17.6; sổ tay 2.20, 5.6;
- đóng ca: `02` 2, 12.4, 17.6; sổ tay 2.1, 5.6, 1.1, 1.15; `01` 2.1, 8.1;
- bổ sung minibar: `03` 7; sổ tay 3.7;
- giữ chỗ (PO-08): sổ tay 2.4, `02` 4.5.

Đối chiếu mã `main` @ `b121c77b`:

- `MoneyPage.tsx`, cột **Trước → sau** là `before.amountVnd` → `after.amountVnd`;
- `folio.service.ts`: `reverseLine` ghi `folio.line_reversed`, `postLines` ghi `folio.line_posted`;
- `minibar.service.ts`: lần đếm lại ghi R7 đảo dòng, lý do `minibar_recount`;
- `audit-log.controller.ts`: FD/FDL chỉ thấy dòng của mình; bộ lọc 7 ngày chỉ đọc `folio_line.adjusted`;
- `HousekeepingPage.tsx`: chỉ hiện việc hôm nay.

### 4.1 Kết luận

| Đoạn | Kết luận | Thẻ |
|---|---|---|
| Ca đêm rà **Sơ đồ phòng** trước 06:00 | Đúng mã. Hai chỗ chưa đúng thực tế quầy, cả hai từ câu của chính DOM (review #101/#108/#110 mục 4): (1) "kiểm căn hoặc hỏi buồng phòng" lúc nửa đêm là gõ cửa căn có khách, và ban đêm không có buồng phòng; (2) OTTIMO đóng quầy muộn nhất 21:00, nên việc chính phải ở mốc đóng quầy, khi danh sách **Khách đi** vẫn còn đúng | **FB-R5-DOM-BA-02** Minor |
| Đóng ca – lễ tân ghi dòng tự sửa giảm từ **Nhật ký thao tác tiền** | Giả định BA **đúng** với sửa dòng (A31): hàng **Điều chỉnh dòng folio** có **Trước → sau** đúng số, bỏ dòng hiện "… → 0 đ". Giả định **sai** với đếm lại minibar: lần đếm lại không ghi **Điều chỉnh dòng folio** mà ghi hai hàng **Đảo dòng folio** (lý do **Đếm lại minibar**, "X → —") rồi **Thêm dòng folio** ("— → Y"). Câu bộ lọc 7 ngày ở sổ tay 1.15, `01` 8.1 cũng hứa có lần đếm lại minibar, mà bộ lọc chưa đọc hàng đó | **FB-R5-DOM-BA-03** Minor |
| Nạp đủ định mức minibar | Đúng nghiệp vụ và đúng lý do ("bấm Làm xong là Desk ghi tủ đã đủ"). Thiếu bước của lễ tân khi buồng phòng báo tủ thiếu hơn số đã tính | **FB-R5-DOM-BA-04** Suggestion |
| Sổ tay 2.4, `02` 4.5 theo PO-08 | Đúng ý thẻ. DOM sửa thẳng một vế nhỏ ở sổ tay 2.4: đơn còn **Giữ chỗ · chờ cọc** mà chưa nhận đồng nào thì theo Tờ 2a "Quá hạn vài phút…", không theo gạch **Đã nhận cọc**. `02` 4.5 đã tách đúng ý (2)/(3). **PO-08 Closed cả phần sổ tay** | – |

### FB-R5-DOM-BA-02
- Mức độ: Minor (v1.0.5 tới v1.0.6; không mất tiền, vì sau 06:00 quản lý vẫn trả phòng được theo V5-15)
- Vị trí:
  - `guides/02-le-tan.md` 13.3, các bước 1–4 "Từ v1.0.5, tới v1.0.6: rà Sơ đồ phòng trước 06:00";
  - cùng tệp, mục 2, dòng **Đóng quầy (muộn nhất 21:00)** và dòng **Trước 06:00**;
  - sổ tay 2.20, 5.6, cùng chữ.
- Vấn đề:
  1. Bước 2 "Kiểm căn hoặc hỏi buồng phòng khách còn ở không" là câu DOM đưa, và sai thực tế quầy. Lúc 01:30, kiểm căn nghĩa là gõ cửa hoặc mở cửa căn mà khách có thể đang ngủ, còn buồng phòng không làm ca đêm.
  2. OTTIMO hiện đóng quầy muộn nhất 21:00 (`02` mục 2, 17.1). Ca 00:00–05:59 chỉ có khi có người trực đêm. Việc của "kiểm toán đêm" phải làm ở mốc đóng quầy. Trước 00:00, danh sách **Khách đi** hôm nay vẫn hiện đúng các căn này.
- Vì sao quan trọng: gõ cửa khách lúc nửa đêm là lỗi phục vụ nặng ở khách sạn. Người trực đoán "khách đã đi" để bấm Trả phòng thì có thể giao căn đang có khách cho ca sau.
- Đề xuất sửa (chữ thay):
  - `02` mục 2, dòng **Đóng quầy**, thêm vào đầu cột việc: "**Khách đi** hôm nay không còn căn chưa trả phòng: khách đã đi thì **Trả phòng** (ghi giờ rời thật), khách ở thêm thì **Gia hạn**."
  - 13.3 (và sổ tay 2.20), bước 2 và 3 thay bằng:
    > 2. **Không gõ cửa, không vào căn ban đêm.** Xem dấu hiệu: thẻ, chìa đã trả ở quầy; sổ giao ca; căn đã dọn trong ngày; nhật ký mở cửa trên app khóa, nếu có.
    > 3. Chắc khách đã đi: **Trả phòng**, ghi giờ khách rời thật. Chắc khách còn ở: **Gia hạn**. Không chắc: để nguyên, ghi sổ giao ca mã đơn; từ 06:00 làm như đơn quá ngày đi.
  - Bước 1, bước 4 giữ nguyên. Bước 4 thêm: "Người trực hiện giữ vai quản lý nên làm được bằng quyền đó, ghi lý do."
- Trạng thái: **Closed** 07/11 (lượt 3, mục 5): BA áp ở `d467578b`, DOM đọc lại đạt.

### FB-R5-DOM-BA-03
- Mức độ: Minor
- Vị trí:
  - `02` 12.4, khối "Dòng tự sửa giảm trong ca", bước 2; sổ tay 2.1 (cuối ca, bước 3), cùng chữ;
  - sổ tay 1.15 và `01` 8.1, câu bộ lọc **Sửa giảm dòng – 7 ngày** "… đếm lại minibar thấp hơn";
  - sổ tay 1.1 và `01` 2.1, dòng **Mỗi tuần** "Chú ý dòng minibar đếm lại thấp hơn".
- Vấn đề:
  - Lần đếm lại minibar trên `main` không phải `folio_line.adjusted`:
    - nếu số mới khác số cũ, Desk đảo dòng cũ (`folio.line_reversed`, lý do `minibar_recount`) rồi ghi dòng mới (`folio.line_posted`);
    - trong **Nhật ký thao tác tiền**, việc đó hiện thành hai hàng. Ví dụ 2 bia (70.000) đếm lại còn 1: hàng **Đảo dòng folio**, cột Trước → sau "70.000 đ → —", lý do **Đếm lại minibar**; rồi hàng **Thêm dòng folio**, "— → 35.000 đ". Đếm lại về 0 thì không có hàng thứ hai.
  - Lễ tân chỉ tìm hàng **Điều chỉnh dòng folio** sẽ không thấy lần đếm lại.
  - Bộ lọc 7 ngày (#108) chỉ đọc `folio_line.adjusted`, nên cũng không có hàng này. Chỉ khi BE-A2 làm phần audit của BR-438 (2a) thì mới có.
- Vì sao quan trọng: đây là đúng loại sửa giảm mà luật muốn người nhận ca và chủ đầu tư thấy. Câu hiện nay hứa có mà Desk không có.
- Đề xuất sửa:
  - 12.4 bước 2, thêm sau câu hiện có:
    > Đếm lại minibar không hiện là **Điều chỉnh dòng folio**: tìm thêm hàng **Đảo dòng folio** có lý do **Đếm lại minibar**; số mới nằm ở hàng **Thêm dòng folio** ngay sau, cùng mã đơn (không có hàng đó thì số mới là 0).
  - Sổ tay 1.15, `01` 8.1: thay vế "đếm lại minibar thấp hơn" bằng:
    > Tới khi có bản sửa, lần đếm lại minibar chưa hiện ở bộ lọc này: xem thêm hàng **Đảo dòng folio**, lý do **Đếm lại minibar**, ở **Nhật ký thao tác tiền**.

    Dòng **Mỗi tuần** ở 1.1, `01` 2.1 trỏ về câu đó. Bỏ câu thay thế khi BE-A2 làm xong phần audit (ORC báo).
  - Xác nhận cho BA: cột **Trước → sau** hiện đúng số trước và sau với hàng **Điều chỉnh dòng folio**, kể cả bỏ dòng ("… → 0 đ"). Lễ tân, lễ tân trưởng chỉ thấy hàng của mình. Tài khoản 6 vai thấy mọi hàng.
- Trạng thái: **Closed** 07/11 (lượt 3, mục 5): BA áp ở `d467578b`, DOM đọc lại đạt. Nối với đề xuất minibar ở `rounds/round-05/responses/DOM-responses.md`.

### FB-R5-DOM-BA-04
- Mức độ: Suggestion
- Vị trí: `03` mục 7 và sổ tay 3.7, câu "Tủ thiếu nhiều hơn số trên việc: báo lễ tân **trước khi** bấm **Làm xong**". Phía lễ tân (`02` 11, sổ tay 2.14) chưa có bước tiếp theo.
- Vấn đề: lễ tân nghe báo nhưng chưa có câu dặn làm gì.
- Đề xuất sửa: thêm vào `02` (gần 11.1) và sổ tay 2.14:
  > Buồng phòng báo tủ thiếu nhiều hơn số đã tính:
  > - khách đã trả phòng: **Thêm phát sinh** sau trả phòng trong 24 giờ, kèm ảnh tủ, đúng số món chênh. Quá 24 giờ: ghi sổ giao ca, báo chủ đầu tư;
  > - khách còn ở: ghi sổ giao ca mã đơn và món, tính ở lần đếm sau.
  >
  > Buồng phòng vẫn nạp đủ định mức rồi mới bấm **Làm xong**.

  Đây đúng là luật phát sinh sau trả phòng đã có (sổ tay mục "Phát sinh sau trả phòng").
- Trạng thái: **Closed** 07/11 (lượt 3, mục 5): BA áp ở `d467578b`, DOM đọc lại đạt.

## 5. Lượt 3 – BA `d467578b`, `df271ee7`; CPY `12d71871` (07/11/2026)

ORC giao 07/11, hai việc gom một lượt:

1. Đọc góc quầy phần BA đã áp ở `rounds/round-05/outputs/BA/report.md` mục 8, "Bổ sung lượt 3" và "phần 2":
   - thẻ BA-02, 03, 04 (mục 4 tệp này);
   - K-MB: sổ tay 1.1, 1.16, 3.7; `01` 2.1, 13; `03` 7;
   - câu "đổi giá xong báo giá thử 1 đêm": sổ tay 1.3, `01` 9.1, `so-van-hanh.md` 4.1 bước 7;
   - khối [Chờ xác nhận – Wi-Fi trên Desk]: sổ tay 1.4, `01` 9.2;
   - 5 việc SEC 6.5.6 về khách lỡ gửi số thẻ: sổ tay 2.21, 2.4; `02` 16.1, 4.1.

   Bản đã đọc: sổ tay 1.19, bộ hướng dẫn 1.17, sổ vận hành 1.7.
2. Chốt 3 điểm CPY hỏi trong `rounds/round-05/outputs/CPY/guest-notice-wifi-change.md` (`12d71871`), mục 5 và 6.

Đối chiếu mã `main` @ `74001ded`:

- `quote-pricing.ts` `listPrices`, `pricing.service.ts`, `public-rate.ts`: báo giá ở quầy, form đặt phòng và web khách đều lấy giá niêm yết **của từng đêm**, tức dòng có `effective_from` gần nhất mà không sau đêm đó;
- `rooms.service.ts`: không sửa được dòng giá đã qua (`DATE_IN_PAST`). Lưu một giá có cùng ngày hiệu lực, hôm nay hay ngày sau, thì **thay** dòng đó;
- `0094_room_list_price_append_only.sql`: chỉ chặn **xóa** dòng đã áp, không chặn thay;
- `guest-messaging-journey.md` (Round 2): TP-06 hỏi thăm lúc 10:00, TP-07 nhắc trả phòng R-1 lúc 20:00 và R lúc 09:00; BR-973, BR-974, BR-204, BR-808.

### 5.1 Kết luận

| Đoạn | Kết luận | Thẻ |
|---|---|---|
| BA-02: ca đêm, đóng quầy | Đúng chữ DOM ở `02` mục 2, 13.3 và sổ tay 2.1, 2.20, 5.1: không gõ cửa; không chắc thì để từ 06:00. **Closed** | – |
| BA-03: đếm lại minibar thành hai hàng | Đúng ở `02` 12.4, sổ tay 2.1, 1.15, 1.1 và `01` 8.1, 2.1. #128 cũng hiện đúng hai hàng khi tắt công tắc (`DOM-on-prs-105-125-128.md`). **Closed** | – |
| BA-04: tủ thiếu nhiều hơn số đã tính | Đúng chữ DOM ở sổ tay 2.14, `02` 11.1. **Closed** | – |
| K-MB | Đúng ý đề xuất (A) 2: kho có khóa, sổ kho, phiếu nạp không ghi tên khách, so 3 dòng với **Folio**, lệch quá 2 món thì hỏi. Thiếu một loại dòng: hàng ra kho mà không vào tủ | **FB-R5-DOM-BA-07** Minor |
| Đổi giá xong, báo giá thử 1 đêm | Đúng ý, nhưng thiếu **đêm nào**: với giá hiệu lực từ ngày sau, báo giá cho đêm nay vẫn ra giá cũ, nên báo giá thử "đạt" trong khi giá sai đã lên lịch và web đã bán đêm đó. Câu cũ sát bên ("tạo trước ngày hiệu lực giữ giá cũ") cũng chưa đúng mã | **FB-R5-DOM-BA-06** Minor |
| Khối [Chờ xác nhận – Wi-Fi trên Desk] | Đúng DOM-on-be-pr-120 mục 3. Chốt 3 điểm CPY hỏi; bước 1, 4, 5 thay chữ; thêm bước in thẻ và việc của buồng phòng | **FB-R5-DOM-BA-05** Minor |
| SEC 6.5.6, năm việc | Góc quầy không có gì sai. Câu nào dùng cho kênh nào rõ; hướng dẫn xóa theo từng kênh làm được trên điện thoại cơ sở; kênh không xóa được là ca thường, không đánh dấu spam; ca phải gọi ngay hẹp lại đúng. Tắt tự lưu ảnh mở ra một ca quầy chưa có dòng: khách gửi ảnh giấy tờ qua chat | **FB-R5-DOM-BA-08** Suggestion |

### FB-R5-DOM-BA-05

- **Mức độ:** Minor. Khối này còn chờ phần Desk của V5-58. BA cần các quyết định dưới đây trước khi bật khối.
- **Vị trí:**
  - sổ tay 1.4 và `01` 9.2, khối [Chờ xác nhận – Wi-Fi trên Desk], mục **Đổi mật khẩu Wi-Fi**, bước 1, 4, 5;
  - `03` (buồng phòng) 11.2, 12, các chỗ đã ghi trong chú thích "Chờ ORC" của khối;
  - CPY `guest-notice-wifi-change.md` mục 1, gạch **Lúc gửi**.
- **Quyết định DOM cho 3 điểm CPY hỏi:**
  1. **Bước 5: đồng ý với CPY.**
     - Mọi căn đều được thay thẻ trong căn.
     - Căn có khách thì thay ở lần dọn tới. Khách hỏi trước lúc đó thì lễ tân đưa thẻ mới ở quầy, và thẻ trong căn vẫn thay ở lần dọn tới.
     - Vì vậy câu 4 của CPY ("We will also replace the Wi-Fi card in your room; until then, it shows the previous password.") giữ nguyên.
     - Thêm ca khách dài hạn. Lịch dọn của khách này đặt theo lượt (BR-204), nên có khi vài tuần không có lần dọn.
  2. **Giờ đổi: 13:00–17:00, không phải cả khung 08:00–21:00.** Nên làm đầu khung.
     - Nằm trong khung tin chủ động của BR-973.
     - Cách tin hỏi thăm 10:00 (TP-06) và tin nhắc trả phòng 20:00 (TP-07 R-1) ít nhất 3 giờ. Vì thế BR-974 không gộp tin Wi-Fi với tin lịch, và lễ tân đếm trần dễ.
     - Khách đi hôm nay đã trả phòng (12:00), nên căn trống nhiều nhất.
     - Buồng phòng đang dọn căn trống cho khách nhận lúc 14:00, nên thay thẻ ngay trong lần dọn đó. Khách nhận phòng sau giờ đổi vào căn đã có thẻ mới, trang khách cũng đã có mật khẩu mới.
     - Quầy còn người ít nhất 4 giờ (đóng quầy muộn nhất 21:00), đỡ được khách không vào được mạng.
     - Đổi ngoài khung chỉ khi chủ đầu tư quyết, vì mạng bị dùng sai hay lộ ra ngoài mà không chờ được tới hôm sau. Khi đó tin báo là tin sự cố (BR-973 (4)): gửi ngay mọi giờ, không tính trần.
  3. **Tin này tính vào trần 2 tin chủ động mỗi ngày mỗi đơn (BR-974): đồng ý với CPY.** Ở quầy:
     - Chỉ gửi cho đơn **đang ở và không đi hôm nay**.
     - Khách đi hôm nay (kể cả trả muộn): không gửi, vì ngày đi đã có 2 tin. Khách hỏi thì đọc mật khẩu ở quầy.
     - Khách nhận phòng sau giờ đổi: không gửi.
     - Đơn hôm nay đã có 2 tin chủ động (xem hội thoại với khách): không gửi tin thứ ba. Ghi sổ giao ca mã đơn, báo khi khách hỏi hoặc ghé quầy. Trong khung 13:00–17:00 ca này hiếm.
     - Một khách có nhiều căn (đoàn, gia đình): một tin cho người liên hệ của đơn.
- **Đề xuất sửa (chữ thay cho BA):**
  - Bước 1, thay "Chọn giờ vắng khách" bằng:
    > 1. Đổi trong **13:00–17:00**, nên đầu khung. Trước đó in sẵn **thẻ Wi-Fi mới** cho 10 căn và 2 thẻ dự phòng để ở quầy. Ngoài khung giờ này chỉ đổi khi chủ đầu tư quyết vì mạng bị dùng sai.
  - Bước 4: thay bằng dòng CPY mục 6 (bản đầy đủ và bản ngắn Zalo, nguyên văn), và thêm:
    > Không gửi cho khách đi hôm nay, khách nhận phòng sau giờ đổi, và đơn hôm nay đã có 2 tin chủ động: các khách này được báo ở quầy khi hỏi (ghi sổ giao ca mã đơn). Đổi gấp ngoài khung giờ: tin này là tin sự cố, gửi ngay.
  - Bước 5, thay bằng:
    > 5. Thay **thẻ Wi-Fi trong căn**, đủ 10 căn:
    > - căn trống: thay ngay, trước khách nhận phòng kế tiếp;
    > - căn có khách: buồng phòng thay ở lần dọn tới. Khách hỏi trước lúc đó: lễ tân đưa thẻ mới ở quầy; thẻ trong căn vẫn thay ở lần dọn tới;
    > - khách dài hạn không có lần dọn trong 3 ngày: hẹn khách một giờ để thay, chỉ vào căn khi khách đồng ý. Khách không muốn ai vào căn: đưa thẻ mới để khách tự thay, xin lại thẻ cũ;
    > - ghi sổ giao ca **số căn** chưa thay (không ghi mật khẩu), gạch khi xong. Thẻ cũ mang về quầy, cắt nhỏ rồi bỏ.
  - `03` 11.2 hoặc 12: thêm một dòng:
    > Sau khi chủ đầu tư đổi mật khẩu Wi-Fi: ở lần dọn đầu của mỗi căn, thay thẻ Wi-Fi bằng thẻ mới lễ tân đưa, mang thẻ cũ về quầy, báo lễ tân để gạch sổ.

    Đây là điểm "thẻ chào + Wi-Fi" trong lần kiểm 12 điểm (BR-808).
  - Cho UXD khi làm thẻ Wi-Fi (không chặn): in tháng in nhỏ ở góc thẻ, để buồng phòng nhận ra thẻ mới.
  - CPY mục 1, gạch **Lúc gửi**: "mọi khách đang ở" thêm vế loại trừ như bước 4 trên. ORC chuyển CPY, chỉ một dòng.
- **Việc của DOM:** ghi khung 13:00–17:00, việc thay thẻ và cách tính tin vào BR-012 (7) ở bản BR kế tiếp. Ghi thêm BR-973 (4) cho ca đổi gấp.
- **Trạng thái:** **Closed** phần BA 07/11 (mục 6): BA áp ở `da596507`, DOM đọc lại đạt. Còn một dòng của CPY (mục 1, gạch **Lúc gửi**), không đổi chữ sổ tay.

### FB-R5-DOM-BA-06

- **Mức độ:** Minor. Lời dặn đang **áp dụng ngay**, nên cần đúng từ bây giờ.
- **Vị trí:**
  - sổ tay 1.3, gạch **Desk chưa cảnh báo khi giá đêm cao bất thường** và gạch "Đơn, báo giá, hợp đồng tạo **trước** ngày hiệu lực **giữ giá cũ**";
  - `01` 9.1, hai gạch cùng chữ;
  - `so-van-hanh.md` 4.1 bước 7, vế "Giá căn: báo giá thử 1 đêm…";
  - hỏi đáp: sổ tay "Tôi đổi giá nhưng đơn cũ không đổi?" và `01` bảng tình huống, cùng dòng.
- **Vấn đề:**
  1. **Báo giá thử chưa nói đêm nào.** Báo giá và web lấy giá theo từng đêm. Lưu giá 8.000.000 hiệu lực từ ngày 20 rồi báo giá thử đêm nay, Desk ra giá cũ, đúng, nên chủ đầu tư yên tâm. Trong khi đó, từ lúc lưu, web đã bán đêm 20 trở đi với giá sai.
  2. **"Tạo trước ngày hiệu lực giữ giá cũ" chưa đúng mã.**
     - Đơn và báo giá giữ giá **lúc tạo** (BR-006). Vậy cái quyết là đơn tạo trước hay sau **lúc lưu** giá mới, không phải trước hay sau ngày hiệu lực.
     - Đơn tạo hôm nay, sau khi lưu giá hiệu lực từ ngày 20, cho đêm 21, lấy **giá mới**.
     - Chủ đầu tư đọc câu cũ sẽ nghĩ "tới ngày 20 mới bán giá mới", và lễ tân báo giá khách sai kỳ vọng.
  3. BA ghi giả định "sổ tay chỉ có cách sửa giá tương lai". Mã cho thay cả giá hiệu lực **hôm nay**: lưu lại với cùng **Hiệu lực từ** là hôm nay.
- **Vì sao quan trọng:** đây là lớp chặn duy nhất cho lỗi gõ thừa số 0, tới khi có V5-5C. Báo giá thử sai đêm thì lớp chặn không bắt được lỗi.
- **Đề xuất sửa (chữ thay):**
  - Sổ tay 1.3, `01` 9.1, thay câu in đậm và vế "Ra số lạ" bằng:
    > **Đổi giá xong, báo giá thử 1 đêm của căn đó, chọn một đêm từ ngày hiệu lực trở đi** (không lưu báo giá). Báo giá cho đêm trước ngày hiệu lực vẫn ra giá cũ, không kiểm được gì. Ra số lạ:
    > - giá đã hiện trên web: tắt `public_show_prices` trước (mục 1.4);
    > - mở **Sửa**, chọn **đúng ngày hiệu lực** của giá sai (hôm nay hay ngày sau đều được), nhập giá đúng, **Lưu**. Desk thay giá của ngày đó;
    > - xem các đơn và báo giá tạo từ lúc lưu giá sai tới lúc sửa: các đơn này giữ giá sai. Báo quản lý xem lại từng đơn, hoặc báo đội.
  - Thay gạch "Đơn, báo giá, hợp đồng tạo trước ngày hiệu lực giữ giá cũ" (sổ tay 1.3, `01` 9.1) và câu trả lời hỏi đáp bằng:
    > Đơn, báo giá, hợp đồng **đã tạo trước lúc lưu** giá mới giữ giá lúc tạo. Từ lúc lưu, đơn và báo giá mới cho các đêm từ ngày hiệu lực trở đi lấy giá mới, kể cả khi tạo trước ngày đó. Web cũng bán các đêm đó với giá mới ngay từ lúc lưu.
  - `so-van-hanh.md` 4.1 bước 7: "báo giá thử 1 đêm của căn đó **từ ngày hiệu lực trở đi**".
- **Trạng thái:** **Closed** 07/11 (mục 6): BA áp ở `da596507`, DOM đọc lại đạt.

### FB-R5-DOM-BA-07

- **Mức độ:** Minor
- **Vị trí:**
  - sổ tay 1.16 và `01` 13, gạch **Kho minibar (K-MB)**: "người nạp tủ ghi mỗi lần một dòng (ngày, căn, món, số lượng lấy ra)";
  - dòng **Mỗi tuần** ở sổ tay 1.1, `01` 2.1: "tồn đầu tuần + nhập − tồn cuối = số đã lấy ra; so với tổng phiếu nạp";
  - sổ tay 3.7, `03` 7.
- **Vấn đề:** hàng ra kho còn có đường không vào tủ:
  - hết hạn, vỡ, hỏng;
  - chủ đầu tư lấy dùng hay biếu khách;
  - đổi món cho khách theo yêu cầu.

  Phiếu nạp chỉ có dòng theo căn. Vì vậy mỗi tuần sổ kho lệch phiếu dù không ai sai, và ngưỡng "lệch quá 2 món" kêu nhầm. Hai, ba tuần kêu nhầm là người đếm thôi tin con số.
- **Đề xuất sửa:**
  - Phiếu nạp nhận cả dòng **không vào tủ**: ngày, món, số lượng, lý do (**hết hạn** / **vỡ, hỏng** / **dùng khác**: ghi ngắn), cột căn để "–".
  - Món hết hạn hay vỡ giữ lại vỏ hoặc chai tới lần đếm tuần, rồi bỏ.
  - Dòng **Mỗi tuần**: "so với tổng phiếu nạp, **gồm cả dòng không vào tủ**". Món nào tuần nào cũng có dòng "dùng khác": chủ đầu tư xem lại.
  - Lúc đếm kho thì xem hạn dùng, món còn dưới 1 tháng thì nạp trước.
- **Trạng thái:** **Closed** 07/11 (mục 6): BA áp ở `da596507`, DOM đọc lại đạt.

### FB-R5-DOM-BA-08

- **Mức độ:** Suggestion. Không chặn v1.0.5. SEC xác nhận vế xóa.
- **Vị trí:** sổ tay 2.21 và `02` 16.1, bảng tình huống, ngay dưới hai dòng "Khách lỡ gửi số thẻ"; luật ở sổ tay 2.4, `02` 4.1 (tắt tự lưu ảnh); `02` dòng "Không chụp giấy tờ khách, không gửi giấy tờ qua Zalo/Messenger".
- **Vấn đề:**
  - Khách Việt rất hay gửi ảnh CCCD, khách nước ngoài gửi ảnh hộ chiếu qua Zalo hay WhatsApp trước ngày đến, "để quầy làm sẵn".
  - Từ khi tắt tự lưu ảnh, muốn đưa ảnh đó lên Desk thì lễ tân phải tự lưu ảnh về máy rồi tải lên. Ảnh giấy tờ vì thế nằm trong thư viện ảnh của điện thoại cơ sở, đúng điều luật mới muốn tránh.
  - Sổ tay chưa có dòng cho ca này.
- **Đề xuất sửa:** thêm một dòng vào bảng:
  > **Khách gửi ảnh giấy tờ (CCCD, hộ chiếu) qua Zalo, WhatsApp, Telegram, Viber, email**
  > - Không lưu ảnh về máy, không chuyển tiếp, không tải từ chat lên Desk.
  > - Trả lời khách: đơn đã xác nhận thì gửi link check-in online (mục 17.3); chưa thì mời khách mang bản gốc khi nhận phòng.
  > - Xóa tin có ảnh theo cách xóa của kênh, như dòng số thẻ. Kênh không xóa được: để nguyên, không chuyển tiếp.

  CPY viết câu trả lời khách. SEC xác nhận vế xóa và vế "không tải từ chat lên Desk".
- **Trạng thái:** Open (BA, CPY, SEC; lượt sau).

### 5.2 UXD dựng HTML được chưa

**UXD dựng HTML được** sổ tay 1.19 và bộ hướng dẫn 1.17 (`00`, `01` 1.16, `02` 1.16, `03` 1.8), với một điều kiện: **BA áp xong FB-R5-DOM-BA-06** trước, vài câu ở sổ tay 1.3, `01` 9.1 và hỏi đáp.

- Các câu đó đang áp dụng ngay. Dựng HTML với chữ cũ thì phải dựng lại.
- Khối [Chờ xác nhận – Wi-Fi trên Desk] vẫn **không dựng** cho tới khi ORC báo, như chú thích của BA. BA-05 chỉ đổi chữ trong khối này.
- BA-07 và BA-08 không chặn HTML; vào bản kế tiếp.
- Khối câu trả lời số thẻ ở 2.21 và 16.1: góc quầy đạt, giữ nguyên văn như BA dặn.

### 5.3 Giả định

1. Lịch tin TP-05, TP-06, TP-07 như `guest-messaging-journey.md` Round 2 và BR-425: hỏi thăm 10:00, nhắc trả phòng 20:00 và 09:00. Nếu INT hay PO đổi giờ các tin này, khung 13:00–17:00 xem lại cho giữ cách 3 giờ.
2. Buồng phòng làm ca chiều tới khoảng 17:00, đủ để thay thẻ căn trống trong ngày đổi.
3. Thẻ Wi-Fi in rời, chủ đầu tư hay quầy in được. Chưa có mẫu in trong `product/docs/print`.
4. Hai thẻ dự phòng ở quầy là thẻ khách, không trái bước 6 (không ghi mật khẩu vào sổ, tin nội bộ). Thẻ cất trong ngăn quầy, không để trên mặt quầy.
5. Không ESC mới. Các điểm trên đều là luật vận hành trong phạm vi DOM, không đổi tiền, không đổi quyền.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | DOM – lượt 3 tài liệu BA (d467578b, df271ee7) và câu Wi-Fi CPY (12d71871): BA-02, 03, 04 Closed; Wi-Fi (BA-05): đổi mật khẩu trong 13:00–17:00 (trong BR-973, cách TP-06 10:00 và R-1 20:00 ≥ 3 giờ nên BR-974 không gộp), in sẵn thẻ 10 căn + 2 dự phòng, căn có khách thay thẻ ở lần dọn tới, khách hỏi trước thì đưa thẻ ở quầy, khách dài hạn không dọn trong 3 ngày thì hẹn giờ hoặc đưa thẻ tự thay; tin tính vào trần BR-974, không gửi khách đi hôm nay, khách nhận phòng sau giờ đổi, đơn đã có 2 tin; đổi gấp do chủ đầu tư quyết là tin sự cố; câu 4 CPY giữ nguyên; BA-06: báo giá thử 1 đêm từ ngày hiệu lực trở đi, "tạo trước ngày hiệu lực giữ giá cũ" sửa thành "tạo trước lúc lưu", sửa giá sai hôm nay hay ngày sau bằng lưu lại cùng ngày hiệu lực; BA-07 phiếu nạp K-MB có dòng không vào tủ; BA-08 khách gửi ảnh giấy tờ qua chat (Suggestion, SEC xác nhận); UXD dựng HTML sổ tay 1.19 và bộ hướng dẫn 1.17 sau khi BA áp BA-06, khối Wi-Fi chờ ORC | DOM | Không ESC; DOM-on-ba-v105-docs mục 5 |`

## 6. Lượt 4 – BA `da596507` (07/11/2026)

ORC giao 07/11: xác nhận BA đã đóng BA-06, BA-07 và áp BA-05 (bước 1, 4, 5 cùng câu CPY `12d71871`). UXD đang dựng HTML sổ tay 1.19 từ commit này.

Đã đọc diff `da596507`:

- sổ tay: 1.1, 1.3, 1.4, 1.15, 1.16, 2.1 (cuối ca bước 3), 2.14, 3.4, 3.7, 5.4, dòng lịch sử 1.19;
- `01`: 2.1, 9.1, 9.2, 13, bảng tình huống;
- `02`: 11.1, 12.4;
- `03`: 7, 11.2;
- `so-van-hanh.md`: 1.2, 4.1 bước 7.

### 6.1 Kết luận

| Thẻ | Kết luận |
|---|---|
| **BA-05** (Wi-Fi) | **Closed** phần BA. Có đủ các phần sau:<br>- bước 1: khung 13:00–17:00, in sẵn thẻ 10 căn và 2 thẻ dự phòng trong ngăn quầy;<br>- bước 4: câu CPY dán nguyên văn (bản đầy đủ và bản Zalo, EN và VI), ba nhóm không gửi, một tin cho người liên hệ, đổi gấp là tin sự cố;<br>- bước 5: thay đủ 10 căn, có ca khách dài hạn, ghi sổ số căn chưa thay, thẻ cũ cắt nhỏ;<br>- buồng phòng (sổ tay 3.4, `03` 11.2) thay thẻ ở lần dọn đầu, thêm "không chụp, không nhắn mật khẩu".<br>Bước 2, 3, 6 giữ nguyên, đúng. Câu 4 của CPY khớp bước 5.<br>Chỉ còn dòng **Lúc gửi** ở CPY mục 1 ("mọi khách đang ở"). Dòng đó chưa thêm ba nhóm không gửi, nhưng không phải chữ của sổ tay; ORC chuyển CPY khi tiện |
| **BA-06** (báo giá thử, giá theo lúc lưu) | **Closed.** Đúng chữ DOM ở sổ tay 1.3, `01` 9.1, `so-van-hanh.md` 4.1 bước 7. Câu "tạo trước ngày hiệu lực giữ giá cũ" đã thay ở cả 1.3, 5.4 (hỏi đáp) và bảng tình huống của `01`. Không còn chỗ nào giữ câu cũ |
| **BA-07** (phiếu nạp có dòng không vào tủ) | **Closed.** Đúng chữ DOM ở sổ tay 1.1, 1.16, 3.7, `01` 2.1, 13, `03` 7 và `so-van-hanh.md` 1.2. Có cả việc xem hạn dùng lúc đếm |
| BA-08 (ảnh giấy tờ qua chat) | Vẫn Open. Lượt sau, chờ CPY và SEC. Không chặn HTML |

Ngoài ba thẻ, BA còn đổi phần đếm lại minibar theo ORC (BE-A2 `0b2ebb45`): lần đếm thấp hơn hiện là **Điều chỉnh dòng folio** và có trong bộ lọc 7 ngày; khối "có chốt chặn" đã bỏ. Góc quầy:

- Đọc đúng. Lễ tân chỉ ghi hàng **Điều chỉnh dòng folio**, không ghi riêng hàng **Đảo dòng folio** và **Thêm dòng folio** của cùng lần đếm. Như vậy mỗi lần đếm chỉ một dòng sổ giao ca.
- Câu nằm trong khối "(từ v1.0.5, tới v1.0.6)" và có chú thích trả lại câu BA-03 cũ nếu #110 trượt tag. ORC giữ nhắc việc này lúc cắt bản.
- Không thẻ.

### 6.2 UXD

**Không có thẻ nào đổi chữ sổ tay.** UXD dựng HTML sổ tay 1.19 và bộ hướng dẫn 1.17 từ `da596507` được ngay. Điều kiện ở mục 5.2 (BA áp BA-06) đã xong.

Khối [Chờ xác nhận – Wi-Fi trên Desk] vẫn theo chú thích của BA: không dựng tới khi ORC báo bản của phần Desk V5-58.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | DOM – lượt 4 tài liệu BA (da596507): BA-05 Closed phần BA (Wi-Fi 13:00–17:00, in sẵn thẻ, câu CPY nguyên văn, ba nhóm không gửi, thay đủ 10 căn, buồng phòng thay ở lần dọn đầu; còn một dòng Lúc gửi ở CPY mục 1, không đổi sổ tay), BA-06 Closed (báo giá thử từ ngày hiệu lực, giá theo lúc lưu ở 1.3, 5.4, 01 9.1, sổ vận hành 4.1), BA-07 Closed (phiếu nạp có dòng không vào tủ), BA-08 còn Open; đọc đúng phần đếm lại minibar theo 0b2ebb45 (điều kiện #110 trong tag); không thẻ đổi chữ, UXD dựng HTML sổ tay 1.19 từ da596507 được, khối Wi-Fi chờ ORC | DOM | Không ESC; DOM-on-ba-v105-docs mục 6 |`

## 7. Lượt 5 – câu CPY về ảnh giấy tờ (`1f5fb23e`) và đổi Wi-Fi gấp (07/11/2026)

ORC giao 07/11, hai việc:

1. Đọc `rounds/round-05/outputs/CPY/guest-reply-id-photos.md` (`1f5fb23e`, theo BA-08 và SEC 6.6) ở góc vận hành quầy.
2. Trả lời câu CPY hỏi ở `guest-notice-wifi-change.md`, Lượt 2.

Đối chiếu:

- SEC `SEC-responses.md` 6.5, 6.6;
- `guides/02-le-tan.md` 17.3 (link check-in online);
- BR-972, BR-973, BR-974, BR-976;
- INT `message-deletion-by-channel.md`.

Ở `main` hiện tại, sổ tay và `02` chưa có dòng BA-08. BA đang chờ câu CPY này.

### 7.1 Câu trả lời khi khách gửi ảnh giấy tờ: luồng ở quầy chạy được

| Bước | Kết luận |
|---|---|
| Trả lời trước, xóa sau, bằng **tin mới** | Làm được trên điện thoại cơ sở. Cùng thứ tự và cùng cách xóa với câu số thẻ, nên lễ tân chỉ phải nhớ một luồng. Câu nói "sẽ xóa", nên đúng cả khi bấm xóa sau câu trả lời |
| Ba bản theo kênh | Khớp bảng kênh của INT. Email và SMS bỏ câu thu hồi. Zalo OA, hộp thư OTA và Messenger dùng bản không có vế xóa. Đúng |
| 5a: đơn đã xác nhận → link riêng tới liên hệ trên đơn | Đúng `02` 17.3 bước 3, kể cả đơn OTA (gửi trong hội thoại OTA của đơn) và đơn CTV (gửi khách, không gửi CTV). Người nhắn không phải liên hệ trên đơn vẫn nhận câu 5a. Câu đã nói rõ link đi tới "contact details in your booking", nên người đó biết chờ ở đâu |
| 5b: chưa xác nhận hoặc chưa có đơn → mang bản gốc | Đúng. Quầy vẫn đối chiếu bản gốc lúc nhận phòng với mọi khách |
| Mức báo: ca thường không ghi sổ | Đồng ý ở góc quầy (SEC 6.6 (c)) |

Có hai khe nhỏ. Cả hai sửa ở dòng BA sắp viết, **không đổi chữ gửi khách** của CPY: thẻ BA-09.

Thêm một gợi ý cho CPY, không chặn: thẻ CPY-03.

### 7.2 Đổi Wi-Fi gấp ngoài 13:00–17:00: DOM đồng ý với CPY, kèm giới hạn

**Quyết định:** khi chủ đầu tư quyết đổi gấp (mạng bị dùng sai, không chờ được), tin báo là **tin sự cố** (BR-973 (4)): gửi ngay, không tính trần, không gộp (BR-974).

- **Gửi cho mọi khách đang ở**, tức đơn đã nhận phòng và chưa trả phòng. Gồm cả khách đi hôm nay chưa trả phòng và đơn hôm nay đã có 2 tin.
  - Lý do: ba nhóm loại trừ ở bước 4 chỉ có vì trần BR-974 và vì trong 13:00–17:00 khách đi hôm nay đã rời căn.
  - Đổi gấp thì không còn hai lý do đó. Khách còn trong căn đang mất Wi-Fi ngay lúc này.
- **Vẫn không gửi** cho:
  - khách đã trả phòng;
  - khách chưa nhận phòng. Căn trống thay thẻ trước khi khách tới, trang khách đã có mật khẩu mới.
- Một khách nhiều căn: vẫn một tin cho người liên hệ của đơn.
- **Giờ:**
  - Gửi ngay, kể cả ban đêm. Tin chat không có chuông riêng, và khách mất mạng sẽ mở tin tìm lý do.
  - Tin mẫu Zalo bị chặn [22:00, 07:00), nên đi kênh kế tiếp theo BR-973 (5). Lễ tân nhắn tay từ chat OA hay số cơ sở thì không vướng.
  - Chủ đầu tư nên tránh đổi trong 22:00–07:00 nếu việc dùng sai chờ được vài giờ.
- **Người trả lời khách:**
  - Đổi sau giờ đóng quầy (21:00) thì phải có người trực, hoặc chủ đầu tư, nghe số cơ sở ít nhất 2 giờ sau lúc đổi.
  - Trước khi Wi-Fi trên Desk lên bản, câu báo là "ask reception". Không ai nghe máy thì không đổi ngoài giờ quầy.
- **Thẻ trong căn:** làm như bước 5, từ ca sáng hôm sau.
- Ghi sổ giao ca giờ đổi gấp, không ghi mật khẩu, để ca sau biết vì sao khách hỏi.

Việc theo đó: thẻ BA-10 cho BA và CPY. Chữ thay nằm trong khối [Chờ xác nhận – Wi-Fi trên Desk]. Khối này UXD chưa dựng, nên không ảnh hưởng bản HTML 1.19 đang dựng.

### FB-R5-DOM-BA-09

- **Mức độ:** Minor
- **Vị trí:** dòng BA-08 sắp viết ở sổ tay 2.21 và `02` 16.1. Chỗ cụ thể là gạch "Trả lời khách: …" theo CPY `guest-reply-id-photos.md` mục 5.
- **Vấn đề:**
  1. **5a hứa gửi link, nhưng chưa có câu dặn gửi ngay.**
     - Ca thường không ghi sổ (SEC 6.6 (c)). Nếu lễ tân trả lời rồi để gửi link sau, ca sau không biết có lời hứa.
     - Khách không nhận link, tới quầy rồi nói "tôi đã gửi giấy tờ rồi".
  2. **5a chưa xét lúc nào link còn dùng được.** Link chỉ có ích trước khi khách tới và còn trong hạn (BR-976). Không dùng được khi:
     - khách đến hôm nay đã quá hạn mềm 12:00 (khách đến sau 22:00 thì hạn 20:00);
     - khách đang ở gửi ảnh người mới thêm vào đoàn;
     - chủ đầu tư đang cho "dừng check-in online" (`02` 17.3).

     Trong các ca này, câu 5a hứa một việc lễ tân không nên làm.
- **Đề xuất sửa (chữ cho BA, không đổi chữ khách):**
  > - Chọn câu cuối: **5a** khi đơn đã xác nhận, khách chưa nhận phòng, còn trước hạn check-in online (12:00 ngày đến; khách đến sau 22:00: 20:00 ngày đến) và check-in online không đang dừng. Còn lại dùng **5b**.
  > - Chọn 5a thì gửi link ngay sau khi xóa tin, theo mục 17.3, trong cùng lượt. Không gửi được ngay (ví dụ liên hệ trên đơn là email, máy quầy đang bận): ghi sổ giao ca "mã đơn – chờ gửi link check-in online". Không ghi gì về ảnh.
- **Trạng thái:** Open (BA, khi viết dòng BA-08).

### FB-R5-DOM-CPY-03

- **Mức độ:** Suggestion (không chặn; v1.0.6 hoặc khi làm mẫu tin v1.2)
- **Vị trí:** `guest-reply-id-photos.md`, câu 5b ("…when you check in").
- **Vấn đề:** khách **đang ở** gửi ảnh giấy tờ của người mới tới ở cùng. Người này phải khai báo trong ngày, vì khai báo theo người ở thật. Câu "when you check in" không đúng với khách đã nhận phòng. Lễ tân lại được dặn "sao chép, không gõ lại".
- **Đề xuất sửa:** thêm một câu cuối **5c** cho khách đang ở, cùng giọng. Ý: mời mang bản gốc của người mới tới quầy hôm nay, lễ tân làm ngay. Ví dụ ý (CPY viết chữ): "Please bring the original documents to reception today, and we will complete this for you." Tới khi có 5c, lễ tân nói trực tiếp hoặc gọi điện, không dùng 5b.
- **Trạng thái:** Open (CPY).

### FB-R5-DOM-BA-10

- **Mức độ:** Minor. Nằm trong khối chờ xác nhận, chưa áp dụng.
- **Vị trí:**
  - sổ tay 1.4 và `01` 9.2, khối [Chờ xác nhận – Wi-Fi trên Desk], bước 4, gạch "Đổi gấp ngoài khung giờ: tin này là tin sự cố, gửi ngay";
  - CPY `guest-notice-wifi-change.md` mục 1, gạch **Lúc gửi**, câu cuối.
- **Đề xuất sửa (chữ thay cho gạch đó):**
  > - Chủ đầu tư quyết đổi gấp ngoài 13:00–17:00 (mạng bị dùng sai): tin này là tin sự cố, gửi ngay, mọi giờ, không tính trần 2 tin.
  >   - Gửi **mọi khách đang ở** (đã nhận phòng, chưa trả phòng), kể cả khách đi hôm nay và đơn đã có 2 tin. Không gửi khách đã trả phòng hay chưa nhận phòng.
  >   - Đổi sau 21:00: người trực hoặc chủ đầu tư nghe số cơ sở ít nhất 2 giờ sau lúc đổi. Ghi sổ giao ca giờ đổi, không ghi mật khẩu. Thẻ trong căn thay từ ca sáng hôm sau, như bước 5.
- **Việc của DOM:** ghi ca đổi gấp vào BR-012 (7) và BR-973 (4) ở bản BR kế tiếp, cùng việc đã ghi ở BA-05.
- **Trạng thái:** Open (BA, CPY).

### 7.3 Giả định

1. Lễ tân nhắn tin Wi-Fi bằng tay từ chat OA hoặc số cơ sở, không qua tin mẫu ZBS. Nếu sau này tin này thành mẫu tự động, giờ cấm của Zalo chuyển kênh theo BR-973 (5).
2. Khai báo lưu trú người mới tới ở cùng phải làm trong ngày. Đây là thực hành chung, theo luật khai báo của BR-010 và BR-602. Câu 5c chỉ là cách nói với khách.
3. Không ESC mới.

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | DOM – lượt 5 (CPY 1f5fb23e): câu trả lời khách gửi ảnh giấy tờ chạy được ở quầy (trả lời trước bằng tin mới, xóa sau; ba bản theo kênh; 5a link riêng tới liên hệ trên đơn theo 02 17.3, 5b mang bản gốc). BA-09 Minor (dòng BA-08): 5a chỉ khi đơn đã xác nhận, chưa nhận phòng, còn trước hạn BR-976 và check-in online không dừng; chọn 5a thì gửi link ngay trong cùng lượt, không được thì sổ giao ca "chờ gửi link" không ghi về ảnh. CPY-03 Suggestion: câu 5c cho khách đang ở. Đổi Wi-Fi gấp (chủ đầu tư quyết): tin sự cố, gửi ngay mọi giờ, không tính trần, gửi mọi khách đang ở kể cả khách đi hôm nay và đơn đã có 2 tin; không gửi khách đã trả hoặc chưa nhận phòng; sau 21:00 phải có người nghe số cơ sở ≥ 2 giờ; thẻ thay từ sáng hôm sau (BA-10, BA và CPY áp; khối Wi-Fi chưa dựng HTML) | DOM | Không ESC; DOM-on-ba-v105-docs mục 7 |`
