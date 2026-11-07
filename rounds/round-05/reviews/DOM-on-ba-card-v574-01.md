# DOM – câu quầy chốt cho thẻ BA FB-R5-BA-SEC-V574-01 (gửi nhầm link check-in online khi chính liên hệ trên đơn sai)

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- Đọc: `BA-on-sec-v5-74.md` thẻ 01 (Major); `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.1 mục 4 nhánh A bước 1–2, mục 6 (dòng mẫu); `guides/02-le-tan.md` 17.3 bước 3 và 5; Tờ 1 dòng "Gửi nhầm người" (`product/docs/staff-one-pager.md`); `DOM-on-sec-v5-74.md`.
- Người dùng câu: SEC đưa vào runbook **1.2** mục 4 bước 1 và mục 6; BA chép sang `02` 17.3 bước 5; PO sửa Tờ 1.
- Không có dữ liệu khách thật.

## 0. Kết luận

**DOM đồng ý hướng của BA:** liên hệ trên đơn sai, hoặc không chắc liên hệ nào đúng, thì **không gửi link mới**; khách làm giấy tờ tại quầy khi đến. Không thêm luật mới: đây là lối "mời làm thủ tục tại quầy" đã có ở 17.3 bước 3 và là cách quầy làm với mọi khách không check-in online (mục 7.2, 8).

DOM thêm ba điểm BA chưa ghi, vì quầy sẽ vấp ngay:
1. **Cách biết liên hệ trên đơn sai** (lễ tân không tự đoán được): đã gửi đúng số/email/hội thoại ghi trên đơn mà người nhận vẫn không phải khách.
2. **Ngừng mọi tin khác** tới liên hệ đó, không riêng link: tin xác nhận, nhắc giờ đến, thông tin đường đi đều mang tên, ngày ở của khách.
3. **Không sửa liên hệ theo lời người khác**: chỉ sửa khi chính khách xác nhận, tại quầy (đối chiếu giấy tờ) hoặc trong hội thoại OTA của đơn. Người nhắn từ số lạ, dù xưng là khách, vẫn theo 17.3 bước 3.

Không ESC. Báo khách hay không vẫn do OWN quyết (runbook mục 2 bước 5).

## 1. Câu chốt – runbook 1.2, mục 4 nhánh A bước 1 (SEC dán nguyên văn, thay "gửi đúng liên hệ trên đơn")

> 1. **Quầy, ngay:** **Thu hồi link**. Rồi xem link vừa gửi đi tới đâu:
>    - **Gửi nhầm do người gửi** (chọn nhầm hội thoại, gõ nhầm số, gửi nhầm email), liên hệ trên đơn vẫn đúng: **Tạo link mới**, gửi riêng 1–1 tới liên hệ ghi trên đơn.
>    - **Đã gửi đúng liên hệ ghi trên đơn mà người nhận không phải khách** (người đó báo không đặt phòng, hoặc trả lời sai tên, sai ngày ở), hoặc **không chắc liên hệ nào là của khách**: liên hệ trên đơn sai. **Không tạo link mới** cho đơn này. Không gửi thêm tin nào về đơn tới liên hệ đó (xác nhận, nhắc giờ đến, đường đi). Khách làm giấy tờ tại quầy khi đến, như khách không check-in online (`guides/02` mục 7.2, 8).
>    - Đơn OTA còn hội thoại OTA của đơn: được nhắn khách **trong hội thoại đó**, một câu mời làm thủ tục tại quầy, không kèm link, không kể chuyện gửi nhầm.
>    - Không sửa liên hệ trên đơn theo lời người nhận nhầm, hay theo người nhắn từ số khác dù xưng là khách. Sửa khi chính khách xác nhận: tại quầy sau khi đối chiếu giấy tờ, hoặc trong hội thoại OTA của đơn. Đơn do sale hay CTV tạo: báo người tạo đơn số đã sai, không gửi số mới qua họ.
>
>    Ghi sổ giao ca theo mẫu ở mục 6, gồm **tin gửi nhầm kèm gì** và **liên hệ trên đơn sai: có/không** (không chắc thì ghi **có**). Không chụp màn hình hội thoại gửi nhầm.

Dòng mẫu mục 6 (thêm một ô, giữ nguyên các ô cũ; ô "đã tạo link mới" thành "link mới: đã tạo / không tạo"):

`SR-INC · nhánh A · đơn OTM-… · gửi nhầm 07/11 10:12 · tin: chỉ link / có tên / có ngày ở / có căn · thu hồi 10:20 · kênh Zalo · liên hệ trên đơn sai: có/không · link mới: đã tạo / không tạo · ghi lạ: có/không · ảnh đã xóa: có/không · báo OWN 10:25`

Nhánh A bước 2 gạch đầu ("Khi gửi link mới, hỏi lại khách giờ đến…") thêm cuối câu: "Không gửi link mới (liên hệ trên đơn sai): hỏi giờ đến và yêu cầu khi khách tới quầy; đơn OTA thì hỏi trong hội thoại OTA của đơn."

## 2. Bản cho sổ tay – `guides/02` 17.3 bước 5 (BA chép)

Gạch đầu "**Thu hồi link** ngay … Rồi **Tạo link mới**, gửi đúng khách." thay bằng:

> - **Thu hồi link** ngay (Desk hỏi lại; người mở link sẽ thấy "Liên kết đã hết hạn").
> - Nhầm do mình gửi (chọn nhầm hội thoại, gõ nhầm số): **Tạo link mới**, gửi 1–1 tới liên hệ ghi trên đơn.
> - Đã gửi đúng liên hệ ghi trên đơn mà người nhận không phải khách, hoặc không chắc liên hệ nào đúng: **không tạo link mới**, không nhắn thêm gì về đơn tới liên hệ đó. Khách làm giấy tờ tại quầy khi đến (mục 7.2, 8). Đơn OTA: được mời khách làm thủ tục tại quầy trong hội thoại OTA của đơn, không kèm link.
> - Không sửa liên hệ theo lời người nhận nhầm hay người nhắn từ số khác. Sửa khi khách xác nhận tại quầy (sau khi đối chiếu giấy tờ) hoặc trong hội thoại OTA của đơn.

Ô sổ giao ca: thêm "liên hệ trên đơn sai: có/không (không chắc thì ghi có)", "link mới: đã tạo / không tạo"; dòng mẫu theo mục 1.

## 3. Bản cho Tờ 1 – dòng "Gửi nhầm người" (PO, câu ngắn)

Thay vế "tạo link mới cho đúng khách" bằng:

> **Thu hồi link** ngay. Nhầm do mình gửi: tạo link mới, gửi tới liên hệ trên đơn. Đã gửi đúng liên hệ trên đơn mà vẫn nhầm, hoặc không chắc: **không gửi link mới**, không nhắn thêm; khách làm thủ tục tại quầy. Không sửa liên hệ theo lời người khác.

Phần còn lại của dòng (ghi sổ giao ca, tin kèm gì, nhắn thẳng chủ đầu tư, ghi lạ thì gọi ngay) giữ nguyên. Nếu không vừa 8,25 pt: bỏ câu cuối "Không sửa liên hệ…" ở Tờ 1, giữ ở sổ tay.

## 4. Ví dụ để QA và SEC kiểm câu

- Lễ tân gửi link đơn `OTM-…` qua Zalo điện thoại cơ sở, chọn nhầm hội thoại của nhà cung cấp. Số trên đơn đúng → thu hồi, tạo link mới, gửi số trên đơn. Sổ: "liên hệ trên đơn sai: không · link mới: đã tạo".
- Sale tạo đơn với số của người đặt hộ; lễ tân gửi link đúng số đó; người nhận trả lời "tôi không đi, bạn tôi ở". → Liên hệ trên đơn sai (người nhận không phải khách ở). Thu hồi, không tạo link mới, không nhắn thêm; báo sale. Khách đến 15:00: đối chiếu hộ chiếu, làm giấy tờ tại quầy, hỏi số của khách và sửa trên đơn. Sổ: "liên hệ trên đơn sai: có · link mới: không tạo".
- Đơn Booking.com, email trên đơn là email chuyển tiếp của kênh; người nhận báo nhầm. → Không gửi link mới qua email; nhắn khách trong hội thoại OTA của đơn: "Please complete check-in at reception when you arrive." / "Mời anh/chị làm thủ tục tại quầy khi đến."

## 5. Thẻ

DOM không mở thẻ mới. Thẻ **FB-R5-BA-SEC-V574-01**: DOM đã xác nhận câu (mục 1–3). Việc còn lại: SEC đưa mục 1 vào runbook 1.2; BA chép mục 2 sang `02` 17.3 bước 5; PO sửa Tờ 1 theo mục 3. Đóng thẻ khi cả ba xong.

## 6. Giả định

- Hội thoại OTA của đơn là kênh đã gắn với đơn (BR và 17.3 bước 3 đã coi là liên hệ trên đơn), nên mời khách qua đó không làm lộ thêm.
- Câu nói với khách cần CPY rà (giọng OTTIMO, tiếng Anh dẫn). DOM chỉ đưa ý.

`| 2026-11-07 | 5 | **DOM – câu quầy chốt cho thẻ BA FB-R5-BA-SEC-V574-01 (gửi nhầm link check-in online khi chính liên hệ trên đơn sai).** Đồng ý BA: liên hệ trên đơn sai hoặc không chắc → không tạo link mới, khách làm giấy tờ tại quầy (lối có sẵn ở 17.3 bước 3, mục 7.2, 8). DOM thêm: (1) cách nhận ra: đã gửi đúng liên hệ ghi trên đơn mà người nhận không phải khách; nhầm do người gửi (chọn nhầm hội thoại, gõ nhầm số) thì vẫn tạo link mới tới liên hệ trên đơn; (2) ngừng mọi tin khác về đơn tới liên hệ đó; đơn OTA được mời làm thủ tục tại quầy trong hội thoại OTA, không kèm link; (3) không sửa liên hệ theo lời người khác, chỉ khi khách xác nhận tại quầy hoặc trong hội thoại OTA; đơn sale/CTV báo người tạo đơn. Dòng mẫu mục 6 thêm "liên hệ trên đơn sai: có/không (không chắc ghi có)" và "link mới: đã tạo / không tạo". SEC dán vào runbook 1.2 mục 4 bước 1; BA chép 02 17.3 bước 5; PO sửa Tờ 1 (bản ngắn). Không ESC | DOM | rounds/round-05/reviews/DOM-on-ba-card-v574-01.md |`
