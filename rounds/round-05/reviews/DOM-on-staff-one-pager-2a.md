# DOM review – Tờ dán quầy, Tờ 2a "Giữ chỗ quá hạn (tạm)"

- Người review: DOM | Round 5 – Review | Ngày: 06/11/2026
- Đối tượng: `product/docs/staff-one-pager.md` Tờ 2a. PO viết ở commit `8d607f98`, đọc lại trên `main` sau `106722d7`; nội dung Tờ 2a giữa hai commit không đổi.
- Đối chiếu:
  - release notes v1.0.4, bảng "Giữ chỗ và cọc" (production từ 06/11/2026 14:10);
  - BR-302, BR-303, BR-308 (`business-rules.md` v0.5.12);
  - Tờ 1 dòng "Cọc";
  - mã: job J1 `hold.expire` chạy mỗi nhịp worker (`product/services/api/src/jobs/reservation-jobs.ts`).
- Góc nhìn: người trực quầy một mình, giữ cả 6 vai (Tờ 1). Câu nào làm họ thu sai, hoàn sai, hay bỏ sót khách?
- Phạm vi: chỉ Tờ 2a. Tờ 1 khối check-in online đã có SEC đọc (`SEC-on-ba-dk4-dk5.md`).

## 1. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN – in lại sau khi PO sửa thẻ Major 01.** Các thẻ Minor nên sửa cùng lượt, vì tờ in một lần.

Bốn câu PO bỏ đều đúng là đã sai với v1.0.4:
1. "Desk chưa báo ở Cần chú ý";
2. "Khác" khóa nút hủy;
3. sau hạn chỉ còn Hủy với giữ chỗ có cọc;
4. hủy đơn cũ rồi đặt mới.

Câu thay thế cũng đúng về tiền:
- giữ chỗ có cọc không tự hủy;
- hủy thì không phí, hoàn đủ, chủ đầu tư duyệt;
- thu nốt cọc sau hạn được;
- chấp nhận cọc thiếu do quản lý tích, có lý do;
- không hủy để đặt lại.

Không câu nào làm lễ tân thu hay hoàn sai số. Còn một câu tả sai hành vi v1.0.4 với giữ chỗ chưa cọc (thẻ 01) và vài chỗ thiếu bước.

| Câu trên Tờ 2a | Đúng v1.0.4? | Rủi ro tiền | Thẻ |
|---|---|---|---|
| Desk báo ở Cần chú ý và khối Giữ chỗ chờ cọc; vẫn rà 3 mốc | Đúng (release notes, việc sau khi lên mục 5) | – | – |
| 0h00 đỏ: giữ chỗ chưa cọc "chỉ còn Hủy giữ chỗ"; "Chưa cọc: hủy ngay, rồi báo khách" | **Sai**: v1.0.4 tự hủy giữ chỗ chưa cọc trong vòng một nhịp worker và nhả căn | Không sai tiền; dễ bỏ sót báo khách | **01 Major** |
| Giữ chỗ có cọc không tự hủy, căn vẫn giữ, câu khung đơn | Đúng | – | – |
| Lý do "Khác (ghi rõ)" dùng được | Đúng (BUG-R3-046) | – | – |
| Có cọc, hủy: "Không thu phí. Sẽ tạo yêu cầu hoàn …"; chủ đầu tư duyệt và chi | Đúng về tiền (BR-303 (3), BR-308). Hộp Desk ghi "cần quản lý duyệt" | Người trực giữ vai quản lý có thể tưởng tự duyệt được | 03 Minor |
| Khách chuyển nốt: Xác nhận đã nhận cọc, ô Giờ nhận tiền | Đúng (BUG-R3-042) | Tờ 1 dặn "bấm trước giờ hạn": hai tờ lệch nhau | 02 Minor |
| Khách trả phần còn lại khi đến: quản lý tích Chấp nhận cọc thiếu | Đúng (BUG-R3-043, BR-303 (2)) | – | – |
| Không hủy đơn cũ để đặt lại | Đúng | – | – |
| Khách đến mà đơn vẫn Giữ chỗ · chờ cọc | **Thiếu bước** | Dễ quay về thói quen cũ "hủy rồi đặt lại" | 04 Minor |

## 2. Thẻ feedback

### FB-R5-DOM-PO-01
- Mức độ: **Major** (chặn in lại)
- Vị trí: Tờ 2a, gạch "Đã 'còn 0 giờ 00 phút' đỏ" (câu "giữ chỗ **chưa cọc** chỉ còn **Hủy giữ chỗ**") và gạch con "**Chưa cọc:** hủy ngay, rồi báo khách".
- Vấn đề: v1.0.4 chạy job J1 `hold.expire` mỗi nhịp worker. Giữ chỗ chưa cọc tới hạn thì **tự hủy** (lý do "Hết hạn giữ chỗ", BR-303) và nhả căn. App nhân viên báo "Giữ chỗ chưa cọc đã hết hạn và tự hủy" cho người tạo, người chốt; không còn ai thì báo lễ tân và lễ tân trưởng (release notes, dòng "Báo giữ chỗ quá hạn").
  - Lúc người trực rà, đơn đã ở trạng thái Đã hủy. Đơn không còn trong lọc **Đang hiệu lực** mà tờ chỉ dẫn mở.
  - Tờ lại gắn việc "báo khách" vào việc "hủy ngay". Người trực không thấy đơn nào để hủy thì cũng không báo khách.
  - Khách tưởng còn giữ phòng, đến quầy, mà căn có thể đã bán.
- Vì sao quan trọng: khách đến không có phòng là lỗi nặng nhất với khách (BR-312). Chữ trên tờ tả một hành vi Desk không còn có.
- Đề xuất sửa: thay gạch "0h00 đỏ" và gạch "Chưa cọc" bằng hai câu ngắn (vừa A5):
  - "**Chưa cọc:** Desk **tự hủy** khi hết hạn và nhả căn; app báo 'Giữ chỗ chưa cọc đã hết hạn và tự hủy'. Báo khách ngay (đơn CTV: báo CTV trước). Khách còn muốn: đến từ ngày mai → giữ chỗ mới **12 h**, một lần; đến hôm nay → gửi VietQR, tạo đơn khi tiền về. Quá hạn vài phút mà đơn vẫn **Giữ chỗ · chờ cọc**: **Hủy giữ chỗ** và báo quản lý."
  - "**Có cọc:** không tự hủy, căn vẫn giữ (khung đơn ghi 'Quá hạn giữ chỗ lúc … nên đơn chưa hủy, căn vẫn giữ'). Không tạo đơn mới chồng lên."
  - Lượt rà mốc 11:00 và trước khi rời quầy: thêm "mở **Đơn đặt phòng** → lọc **Đã hủy** hôm nay, lý do **Hết hạn giữ chỗ**: khách nào chưa được báo thì báo". PO kiểm Desk có lọc **Đã hủy**; nếu không có, dùng hộp **Thông báo** của app nhân viên.
- Trạng thái: **Fixed** – PO 06/11 tối (commit "round-5: Phản hồi & sửa – PO Tờ 2a DOM cards…"). Thay bằng hai gạch "Hết hạn, chưa cọc" (tự hủy, nhả căn, báo khách ngay) và "Hết hạn, có cọc" theo chữ DOM. Mốc 11:00 và cuối ca thêm rà đơn **Đã hủy** lý do **Hết hạn giữ chỗ**. PO kiểm Desk: trang **Đơn đặt phòng** không có lọc "Đã hủy", chỉ có **Đang hiệu lực**, **Tất cả** và chip đơn dài hạn nhập tay (`ReservationsPage.tsx`). Vì vậy tờ ghi "bấm **Tất cả**", kèm tin trong hộp **Thông báo** của app nhân viên. Lệch một chỗ với đề xuất: "báo quản lý" đổi thành "ghi sổ giao ca, báo chủ đầu tư", vì người trực đang giữ vai quản lý. Chờ DOM đọc lại
  - **DOM lượt 2 (06/11 tối): Closed một phần.** Hai gạch "Hết hạn, chưa cọc" / "Hết hạn, có cọc" đúng v1.0.4, đóng. Chỗ PO lệch đề xuất ("ghi sổ giao ca, báo chủ đầu tư"): DOM đồng ý, đóng (lý do ở mục 4). Phần rà bằng **Tất cả** và hộp **Thông báo** chưa đủ: mở lại thành thẻ **FB-R5-DOM-PO-07** (Major).

### FB-R5-DOM-PO-02
- Mức độ: Minor
- Vị trí: Tờ 2a, "Khách chuyển nốt: **Xác nhận đã nhận cọc**, ô **Giờ nhận tiền** ghi giờ tiền về" và Tờ 1 dòng "Cọc": "Chỉ bấm Xác nhận đã nhận cọc khi thấy tiền về tài khoản của OTTIMO, và bấm **trước giờ hạn** giữ chỗ".
- Vấn đề: Tờ 1 dặn bấm trước giờ hạn. Tờ 2a cho bấm sau hạn với giữ chỗ đã có cọc. Đúng là v1.0.4 cho bấm sau hạn khi đã có cọc, tới lúc nhận phòng. Người trực đọc hai tờ dán cạnh nhau sẽ ngần ngừ. Câu ở Tờ 2a cũng không nhắc "khi thấy tiền về", vốn là điều kiện chống ghi tiền chưa có.
- Vì sao quan trọng: xác nhận cọc khi tiền chưa về thì giữ căn cho khoản không có thật. Ngần ngừ thì để giữ chỗ treo tới mốc 12:00.
- Đề xuất sửa: Tờ 2a: "Khách chuyển nốt: thấy tiền về tài khoản OTTIMO thì **Xác nhận đã nhận cọc** (sau hạn vẫn bấm được với giữ chỗ đã có cọc); ô **Giờ nhận tiền** ghi giờ tiền về, không ghi giờ sau bây giờ." Tờ 1 giữ nguyên, thêm 4 chữ: "bấm trước giờ hạn giữ chỗ **(có cọc: xem Tờ 2a)**".
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit. Tờ 2a theo đúng chữ DOM ("thấy tiền về tài khoản OTTIMO…, không ghi giờ sau bây giờ"). Tờ 1 dòng **Cọc** thêm "(có cọc: xem Tờ 2a)" sau "trước giờ hạn giữ chỗ". Dòng Tờ 1 này đổi, ORC nhờ SEC đọc lại

### FB-R5-DOM-PO-03
- Mức độ: Minor
- Vị trí: Tờ 2a, "hộp hủy ghi trước 'Không thu phí. Sẽ tạo yêu cầu hoàn …'. Bạn nhập nơi nhận; **chủ đầu tư duyệt và chi**".
- Vấn đề:
  - Trên Desk, hộp ghi đủ câu "… – **cần quản lý duyệt**" (release notes). Người trực đang giữ vai quản lý (Tờ 1) đọc câu đó có thể bấm duyệt, rồi gặp lỗi tự duyệt (SELF_APPROVAL_FORBIDDEN / SELF_REFUND_FORBIDDEN) mà không hiểu vì sao.
  - Tờ không nói nơi nhận khi khách "không liên lạc được", tức lý do hủy chính của nhánh này.
- Vì sao quan trọng: yêu cầu hoàn treo vì nhập sai nơi nhận, hoặc người trực tìm cách khác để "tự hoàn".
- Đề xuất sửa: "… hộp ghi 'cần quản lý duyệt': bạn là người tạo nên không tự duyệt được, **chủ đầu tư duyệt và chi**. Nơi nhận: tài khoản khách đã chuyển cọc (không liên lạc được thì ghi đúng câu này)."
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit. Chữ DOM: "cần quản lý duyệt": bạn là người tạo nên không tự duyệt được, chủ đầu tư duyệt và chi; nơi nhận là tài khoản khách đã chuyển cọc

### FB-R5-DOM-PO-04
- Mức độ: Minor
- Vị trí: Tờ 2a, nhánh "Đã có cọc", sau câu "Không hủy đơn cũ để đặt lại".
- Vấn đề: tờ bỏ bước cũ "khách đến: hủy đơn cũ → đặt mới" nhưng chưa có bước thay khi khách đến quầy mà đơn **vẫn Giữ chỗ · chờ cọc** (không ai tích Chấp nhận cọc thiếu). Đơn giữ chỗ không nhận phòng được. Người trực dễ quay về thói quen cũ hủy rồi đặt lại. Làm vậy sẽ sinh một yêu cầu hoàn, một đơn mới, và lệch đối soát.
- Vì sao quan trọng: đây là lúc khách đứng ở quầy, áp lực nhất.
- Đề xuất sửa: thêm một câu: "**Khách đến mà đơn vẫn Giữ chỗ · chờ cọc:** thu phần cọc còn thiếu → **Xác nhận đã nhận cọc** (Giờ nhận tiền = giờ thu) → **Nhận phòng**, thu phần còn lại như mọi đơn. Khách chỉ trả được lúc trả phòng: quản lý tích **Chấp nhận cọc thiếu**, ghi lý do."
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit. Thêm gạch "Khách đến mà đơn vẫn Giữ chỗ · chờ cọc" theo chữ DOM. Giữ câu cũ "Khách hẹn trả phần còn lại khi đến: quản lý tích Chấp nhận cọc thiếu" ở nhánh "Vẫn đi", vì DOM đã xác nhận câu này đúng (bảng mục 1)

### FB-R5-DOM-PO-05
- Mức độ: Suggestion
- Vị trí: Tờ 2a, chú thích HTML đầu tờ: "Điều kiện bỏ khối giữ chỗ: v1.0.1 có đủ V1, V2, V4 …".
- Vấn đề: điều kiện gỡ tờ còn theo v1.0.1. Release notes v1.0.4 mục "Việc anh/chị làm sau khi lên" 5 đã đổi: bỏ lượt rà khi tin giữ chỗ quá hạn chạy đúng trên production, và sổ tay 2.4 viết lại (V5-71).
- Vì sao quan trọng: chủ đầu tư cần một điều kiện rõ để báo gỡ tờ.
- Đề xuất sửa: chú thích ghi "Gỡ khi: (1) sổ tay 2.4 viết lại theo v1.0.4 (V5-71); (2) đội báo tin giữ chỗ quá hạn đã chạy đúng trên production". Bản in không đổi.
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit. Chú thích đầu tờ ghi hai điều kiện gỡ theo đề xuất. Bản in không đổi

### FB-R5-DOM-PO-06
- Mức độ: Suggestion
- Vị trí: Tờ 2a, nhánh "Đã có cọc" → hủy.
- Vấn đề: release notes v1.0.4, mục Giới hạn đã biết: lễ tân và lễ tân trưởng **không thấy** yêu cầu hoàn đang chờ do người khác tạo. Khách hỏi "tiền hoàn của tôi đâu" thì người trực ca sau không tra được.
- Vì sao quan trọng: khách hỏi lại nhiều lần; người trực dễ hứa ngày.
- Đề xuất sửa: nếu còn chỗ, thêm vào dòng **Sổ giao ca**: "Đơn đã hủy có cọc: ghi 'chờ chủ đầu tư hoàn'. Khách hỏi: báo chủ đầu tư, không hứa ngày." Không có chỗ thì để ở sổ tay 2.4 (V5-71).
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit. Dòng **Sổ giao ca** thêm: đơn có cọc đã hủy ghi "chờ chủ đầu tư hoàn"; khách hỏi thì báo chủ đầu tư, không hứa ngày

## 3. Ghi chú cho ORC

- Thẻ 01 chỉ sửa chữ. Không cần ESC, không đổi quy tắc: BR-303 vốn ghi "đến hạn chưa cọc → hệ thống tự hủy".
- Sau khi PO sửa, DOM đọc lại riêng Tờ 2a, khoảng 10 phút, rồi chủ đầu tư in.

## 4. Lượt 2 – đọc lại commit `451d3230` (06/11/2026 tối)

- Đối tượng: Tờ 2a và dòng "Cọc" của Tờ 1 sau khi PO sửa 6 thẻ; trả lời của PO ở `rounds/round-05/responses/PO-responses.md`.
- Đối chiếu thêm: `product/apps/admin-web/src/pages/reservations/ReservationsPage.tsx` (lọc, số dòng); `product/services/api/src/modules/reservations/internal/rack.service.ts` (thứ tự danh sách); `product/services/api/src/modules/reservations/internal/hold-notices.ts` (ai nhận tin tự hủy); `product/apps/mobile/src/app/session.ts` (vai nào dùng app nhân viên); `product/services/api/src/modules/frontdesk/internal/attention-sources.ts` (dòng "Giữ chỗ sắp hết hạn").

### 4.1 Kết luận lượt 2

**Chưa in bản hiện tại.** Thẻ 02–06: đóng. Thẻ 01: đóng phần tách hai trường hợp và phần "báo chủ đầu tư"; phần rà mở lại thành thẻ 07 (Major).

**In được ngay khi PO áp đúng "bản gộp" ở thẻ 07** (chữ nguyên văn bên dưới, gồm cả câu tiền về mà đơn đã tự hủy ở mục 4.4), không cần DOM đọc lại lần 3. PO đổi ý chữ thì DOM đọc lại phần đó.

### 4.2 Ba điểm ORC hỏi

| Điểm | DOM | Lý do |
|---|---|---|
| Tách "chưa cọc: tự hủy, báo khách ngay" / "có cọc: không tự hủy" | **Đúng**, đóng | Khớp J1 `hold.expire` và BR-303. Câu khung đơn, nhánh "Không đi", "Vẫn đi", "Khách đến mà đơn vẫn Giữ chỗ · chờ cọc" đều đúng v1.0.4 |
| "Báo quản lý" đổi thành "ghi sổ giao ca, báo chủ đầu tư" | **Đồng ý**, đóng | (1) Người trực giữ vai quản lý: "báo quản lý" là báo chính mình. (2) Giữ chỗ chưa cọc quá hạn mà chưa tự hủy nghĩa là job J1 không chạy. Đó là lỗi hệ thống: chủ đầu tư báo đội (OPS), vì các tin nhắc khác có thể cũng đứng |
| Rà bằng **Tất cả** và hộp **Thông báo** | **Chưa đủ**, thẻ 07 | Xem dưới |

### FB-R5-DOM-PO-07
- Mức độ: **Major** (chặn in)
- Vị trí: Tờ 2a, gạch "Ở đâu", câu "Mốc 11:00 và trước khi rời quầy: bấm thêm **Tất cả**, xem đơn **Đã hủy** mới có lý do **Hết hạn giữ chỗ** (cùng tin trong hộp **Thông báo** của app nhân viên). Khách nào chưa được báo thì báo."
- Vấn đề:
  1. **Tất cả** chỉ lấy 100 đơn đầu, xếp theo **ngày đến từ cũ tới mới**, không có nút xem thêm (`ReservationsPage.tsx`: `limit: 100`; `rack.service.ts`: `ORDER BY r.arrival_date`). Đơn đã trả phòng, đã hủy từ ngày chạy đều nằm trong danh sách này. Khi tổng số đơn quá 100, giữ chỗ vừa tự hủy (ngày đến sắp tới) rơi ra ngoài trang. Người rà không thấy gì và tưởng không có. Với 10 căn, mốc 100 đơn tới trong vài tuần. Danh sách cũng không có cột lý do hủy, phải mở từng đơn.
  2. Tin "Giữ chỗ chưa cọc đã hết hạn và tự hủy" chỉ gửi người tạo và người chốt (`hold-notices.ts`, luật DOM A.5). Chỉ khi không có ai thì mới gửi lễ tân, lễ tân trưởng. Nhưng:
     - sale, CTV không dùng được app nhân viên (`session.ts`: vai sale, CTV không có màn nào), và Desk không có hộp thông báo. Giữ chỗ do sale, CTV tạo tự hủy thì **không ai được báo**;
     - giữ chỗ do lễ tân ca trước tạo: tin vào máy người đó, không vào máy người đang trực.
  3. Ghi chú của PO đúng. Câu "cùng tin trong hộp Thông báo" làm người trực tin rằng mọi giữ chỗ tự hủy đều có tin. Thật ra chỉ có tin cho giữ chỗ chính họ tạo.
- Vì sao quan trọng: đúng rủi ro của thẻ 01. Khách không được báo thì vẫn chuyển cọc vào đơn đã hủy, hoặc đến quầy khi căn đã bán (BR-312).
- Đề xuất sửa: thay câu trên bằng đúng chữ sau. Câu dùng được với v1.0.4, không phụ thuộc số đơn, chỉ ghi mã đơn (không tên khách):
  - "Mỗi mốc và mỗi lần thấy **Giữ chỗ sắp hết hạn**: ghi vào sổ giao ca mã đơn và giờ hạn của mọi giữ chỗ chờ cọc, cả đơn sale, CTV tạo. Mốc sau: mã nào không còn trong **Đang hiệu lực** → gõ mã vào ô tìm, bấm **Tất cả**. Đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: báo khách (đơn sale, CTV: báo người đó trước). Hộp **Thông báo** của app chỉ có giữ chỗ do bạn tạo."
  - Cách này bắt được mọi giữ chỗ:
    - hạn giữ chỗ là 12, 24 hoặc 48 giờ (`hold_hours_options`); mốc rà cách nhau tối đa 12 giờ (21:00 → 09:00), nên mỗi giữ chỗ nằm trong **Đang hiệu lực** ở ít nhất một mốc;
    - giữ chỗ bị trần 12:00 ngày đến cắt ngắn thì lễ tân thấy dòng **Giữ chỗ sắp hết hạn** ở **Cần chú ý** trên **Hôm nay**. Dòng này tính cho mọi giữ chỗ, kể cả đơn sale, CTV tạo.
  - Dài thêm khoảng một dòng so với câu cũ. Không vừa A5 10 pt thì dùng 9 pt như Tờ 1, hoặc rút dòng "chờ chủ đầu tư hoàn" về sổ tay 2.4 như thẻ 06 cho phép.
  - **Bản gộp (sửa 06/11 tối, thay câu trên; gồm cả mục 4.4 tiền về mà đơn đã tự hủy).** PO áp bản này để chủ đầu tư in Tờ 2a một lần:
    - Gạch "Ở đâu", thay câu thứ hai: "Mỗi mốc và mỗi lần thấy **Giữ chỗ sắp hết hạn**: ghi vào sổ giao ca mã đơn và giờ hạn của mọi giữ chỗ chờ cọc, cả đơn sale, CTV tạo. Mốc sau: mã nào không còn trong **Đang hiệu lực** → gõ mã vào ô tìm, bấm **Tất cả**. Đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư), rồi báo khách (đơn sale, CTV: báo người đó trước). Hộp **Thông báo** của app chỉ có giữ chỗ do bạn tạo."
    - Gạch "Hết hạn, chưa cọc", thay câu cuối: "Quá hạn vài phút mà đơn vẫn **Giữ chỗ · chờ cọc**: kiểm tiền về trước. Tiền về trước hạn → **Xác nhận đã nhận cọc**, Giờ nhận tiền = giờ tiền về. Chưa về → **Hủy giữ chỗ**, ghi sổ giao ca, báo chủ đầu tư."
    - Gạch mới, ngay sau gạch "Hết hạn, chưa cọc": "**Tiền đã về mà đơn đã tự hủy** (cả khi khách chuyển theo mã QR cũ): căn còn trống → giữ chỗ mới cùng căn, cùng giá → **Xác nhận đã nhận cọc**, Giờ nhận tiền để bây giờ, Ghi chú 'Tiền về hh:mm dd/mm theo mã OTM-…'. Căn đã bán và khách không nhận căn khác cùng hạng → báo chủ đầu tư hoàn đủ; sổ giao ca ghi 'OTM-… tiền về sau tự hủy – chờ chủ đầu tư hoàn'. Không tự hứa ngày hoàn."
    - Không vừa A5: giữ ba câu này trên tờ, chuyển dòng "Sổ giao ca" phần đơn để nguyên sang sổ tay 2.4.
- Việc kèm, không chặn in (ORC chuyển PO xếp việc, BE làm): DOM sửa luật A.5 của chính mình. Tin `hold_expired` gửi **thêm** lễ tân và lễ tân trưởng, như tin `hold_overdue_with_deposit`, chứ không chỉ khi không có người tạo, người chốt. Lý do: ở v1.0.x sale, CTV không có chỗ nào nhận tin. Chỗ sửa: `HOLD_NOTICE_ROLES.hold_expired` = `front_desk`, `front_desk_lead`, kèm test. Bản đó lên production thì sổ tay 2.4 (V5-71) mới dựa được vào hộp Thông báo. Luật ghi ở `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 9.
- Trạng thái: **Fixed** – PO 06/11 khuya (commit "round-5: Phản hồi & sửa – PO Tờ 2a DOM card 07…"). Áp **bản gộp** đúng chữ: câu thứ hai gạch "Ở đâu", câu cuối gạch "Hết hạn, chưa cọc", gạch mới "Tiền đã về mà đơn đã tự hủy" ngay sau. Chỉ đổi dấu nháy đơn trong gạch mới thành nháy kép (trên tờ không còn lồng trong câu trích), chữ giữ nguyên. Luật mục 11 (kiểm tiền theo mã đơn trước khi hủy hoặc báo khách; còn căn thì đặt lại cùng căn cùng giá, không thì chủ đầu tư hoàn đủ) nằm trong ba câu này. Câu nơi nhận hoàn của SEC (gạch "Không đi") giữ nguyên. **Tờ 1 không đổi.** Việc kèm: plan R5 **V5-1B** (BE, `HOLD_NOTICE_ROLES.hold_expired`, bắt buộc, hạn 14/11); phần mềm ghi tiền cho giữ chỗ đã tự hủy: **V5-5B** (BUG-R5-002, ARC chốt hướng). Tờ 2a in được.

### 4.3 Dòng "Cọc" Tờ 1

"(có cọc: xem Tờ 2a)" đúng ý thẻ 02. SEC đọc lại theo ORC; DOM không có ý kiến thêm.

### 4.4 Tiền về nhưng giữ chỗ đã tự hủy (SEC `SEC-on-ba-dk4-dk5.md` mục 3a lượt 3; PO ca 2)

**Chốt:** chọn **(a)**: trước mỗi lần tự bấm hủy và khi thấy một giữ chỗ đã tự hủy, lễ tân kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư) rồi mới báo khách; tiền đã về thì căn còn trống đặt lại cùng căn, cùng giá, căn đã bán thì chủ đầu tư hoàn đủ theo sao kê.

- Chữ cho Tờ 2a: bản gộp ở thẻ 07.
- Vì sao không chọn (b) "hủy rồi báo chủ đầu tư":
  - (b) mặc định hoàn tiền. Khách đã chuyển đúng hạn mà mất căn, chỉ vì quầy chưa kịp bấm. Lỗi chậm ghi là của OTTIMO.
  - Chủ đầu tư không biết mã nào đã tự hủy nếu quầy không báo, nên khó dò ra trên sao kê.
- Lý do nghiệp vụ, phần mềm còn thiếu, việc cho QA và BE: `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 11.

## 5. Lượt 3 – đọc lại câu hộp Thông báo (BA `1217858a`, 07/11/2026)

- Chi tiết ở `rounds/round-05/reviews/DOM-on-ba-v105-docs.md` mục 1.
- Kết luận: chỗ đặt (app nhân viên), người nhận từ v1.0.5 và "vẫn rà theo mã đơn" đúng. Sai một ý: ở v1.0.4, câu chung kèm mã đơn còn là giữ chỗ có cọc quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến. Thẻ **FB-R5-DOM-PO-08** (Major, sửa trước khi in lại), có chữ thay nguyên văn.
