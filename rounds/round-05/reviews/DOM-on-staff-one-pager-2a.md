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
- Trạng thái: Open

### FB-R5-DOM-PO-02
- Mức độ: Minor
- Vị trí: Tờ 2a, "Khách chuyển nốt: **Xác nhận đã nhận cọc**, ô **Giờ nhận tiền** ghi giờ tiền về" và Tờ 1 dòng "Cọc": "Chỉ bấm Xác nhận đã nhận cọc khi thấy tiền về tài khoản của OTTIMO, và bấm **trước giờ hạn** giữ chỗ".
- Vấn đề: Tờ 1 dặn bấm trước giờ hạn. Tờ 2a cho bấm sau hạn với giữ chỗ đã có cọc. Đúng là v1.0.4 cho bấm sau hạn khi đã có cọc, tới lúc nhận phòng. Người trực đọc hai tờ dán cạnh nhau sẽ ngần ngừ. Câu ở Tờ 2a cũng không nhắc "khi thấy tiền về", vốn là điều kiện chống ghi tiền chưa có.
- Vì sao quan trọng: xác nhận cọc khi tiền chưa về thì giữ căn cho khoản không có thật. Ngần ngừ thì để giữ chỗ treo tới mốc 12:00.
- Đề xuất sửa: Tờ 2a: "Khách chuyển nốt: thấy tiền về tài khoản OTTIMO thì **Xác nhận đã nhận cọc** (sau hạn vẫn bấm được với giữ chỗ đã có cọc); ô **Giờ nhận tiền** ghi giờ tiền về, không ghi giờ sau bây giờ." Tờ 1 giữ nguyên, thêm 4 chữ: "bấm trước giờ hạn giữ chỗ **(có cọc: xem Tờ 2a)**".
- Trạng thái: Open

### FB-R5-DOM-PO-03
- Mức độ: Minor
- Vị trí: Tờ 2a, "hộp hủy ghi trước 'Không thu phí. Sẽ tạo yêu cầu hoàn …'. Bạn nhập nơi nhận; **chủ đầu tư duyệt và chi**".
- Vấn đề:
  - Trên Desk, hộp ghi đủ câu "… – **cần quản lý duyệt**" (release notes). Người trực đang giữ vai quản lý (Tờ 1) đọc câu đó có thể bấm duyệt, rồi gặp lỗi tự duyệt (SELF_APPROVAL_FORBIDDEN / SELF_REFUND_FORBIDDEN) mà không hiểu vì sao.
  - Tờ không nói nơi nhận khi khách "không liên lạc được", tức lý do hủy chính của nhánh này.
- Vì sao quan trọng: yêu cầu hoàn treo vì nhập sai nơi nhận, hoặc người trực tìm cách khác để "tự hoàn".
- Đề xuất sửa: "… hộp ghi 'cần quản lý duyệt': bạn là người tạo nên không tự duyệt được, **chủ đầu tư duyệt và chi**. Nơi nhận: tài khoản khách đã chuyển cọc (không liên lạc được thì ghi đúng câu này)."
- Trạng thái: Open

### FB-R5-DOM-PO-04
- Mức độ: Minor
- Vị trí: Tờ 2a, nhánh "Đã có cọc", sau câu "Không hủy đơn cũ để đặt lại".
- Vấn đề: tờ bỏ bước cũ "khách đến: hủy đơn cũ → đặt mới" nhưng chưa có bước thay khi khách đến quầy mà đơn **vẫn Giữ chỗ · chờ cọc** (không ai tích Chấp nhận cọc thiếu). Đơn giữ chỗ không nhận phòng được. Người trực dễ quay về thói quen cũ hủy rồi đặt lại. Làm vậy sẽ sinh một yêu cầu hoàn, một đơn mới, và lệch đối soát.
- Vì sao quan trọng: đây là lúc khách đứng ở quầy, áp lực nhất.
- Đề xuất sửa: thêm một câu: "**Khách đến mà đơn vẫn Giữ chỗ · chờ cọc:** thu phần cọc còn thiếu → **Xác nhận đã nhận cọc** (Giờ nhận tiền = giờ thu) → **Nhận phòng**, thu phần còn lại như mọi đơn. Khách chỉ trả được lúc trả phòng: quản lý tích **Chấp nhận cọc thiếu**, ghi lý do."
- Trạng thái: Open

### FB-R5-DOM-PO-05
- Mức độ: Suggestion
- Vị trí: Tờ 2a, chú thích HTML đầu tờ: "Điều kiện bỏ khối giữ chỗ: v1.0.1 có đủ V1, V2, V4 …".
- Vấn đề: điều kiện gỡ tờ còn theo v1.0.1. Release notes v1.0.4 mục "Việc anh/chị làm sau khi lên" 5 đã đổi: bỏ lượt rà khi tin giữ chỗ quá hạn chạy đúng trên production, và sổ tay 2.4 viết lại (V5-71).
- Vì sao quan trọng: chủ đầu tư cần một điều kiện rõ để báo gỡ tờ.
- Đề xuất sửa: chú thích ghi "Gỡ khi: (1) sổ tay 2.4 viết lại theo v1.0.4 (V5-71); (2) đội báo tin giữ chỗ quá hạn đã chạy đúng trên production". Bản in không đổi.
- Trạng thái: Open

### FB-R5-DOM-PO-06
- Mức độ: Suggestion
- Vị trí: Tờ 2a, nhánh "Đã có cọc" → hủy.
- Vấn đề: release notes v1.0.4, mục Giới hạn đã biết: lễ tân và lễ tân trưởng **không thấy** yêu cầu hoàn đang chờ do người khác tạo. Khách hỏi "tiền hoàn của tôi đâu" thì người trực ca sau không tra được.
- Vì sao quan trọng: khách hỏi lại nhiều lần; người trực dễ hứa ngày.
- Đề xuất sửa: nếu còn chỗ, thêm vào dòng **Sổ giao ca**: "Đơn đã hủy có cọc: ghi 'chờ chủ đầu tư hoàn'. Khách hỏi: báo chủ đầu tư, không hứa ngày." Không có chỗ thì để ở sổ tay 2.4 (V5-71).
- Trạng thái: Open

## 3. Ghi chú cho ORC

- Thẻ 01 chỉ sửa chữ. Không cần ESC, không đổi quy tắc: BR-303 vốn ghi "đến hạn chưa cọc → hệ thống tự hủy".
- Sau khi PO sửa, DOM đọc lại riêng Tờ 2a, khoảng 10 phút, rồi chủ đầu tư in.
