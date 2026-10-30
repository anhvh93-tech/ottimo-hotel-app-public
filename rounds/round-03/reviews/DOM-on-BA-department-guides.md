# DOM review BA – Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Người review: DOM | Round 3, bước Review | Ngày: 30/10/2026 | Hạn: trước buổi đào tạo C3a tối 31/10
- Đối tượng: `product/docs/manual/guides/00-index.md` … `05-sale-ctv.md`; `rounds/round-03/outputs/BA/department-guides.md` (mục 3 A1–A13, mục 4 "DOM" D1–D4)
- Căn cứ: sổ tay `user-manual-v1.0.md` bản 1.5 (0.5, 0.7, 2.1, 2.8, 2.19, 2.20, 3.1, 3.3, 3.6, 4.1, 4.2, 5.1–5.3); `decision-log.md` 29/10 (1 tài khoản giữ 6 vai), 30/10 (DOM giữ chỗ quá hạn – 3 mốc; DOM xác nhận sau QA thử luồng; ORC C1; C1/D-INV-2 Đạt; INV 4 điểm; INV ESC-030 bật form; INV Google Chat); `strings-vi.json` (`hk.desk.*`); `HousekeepingPage.tsx` (nút **Làm xong** gọi cùng thao tác `complete` như app).
- Góc nhìn: OTTIMO 10 căn, chủ đầu tư thường không ở cơ sở, **một người trực giữ 6 vai** vừa đứng quầy, vừa dọn hoặc trông người dọn, vừa nhận sự cố, trực điện thoại buổi tối.

## Kết luận

Bộ tách tốt: mỗi tệp đọc độc lập, chương Đăng nhập viết đúng cho từng vai, quy tắc tiền và câu nói với khách giữ đúng sổ tay 1.5. **Dùng được cho C3a sau khi BA chép 7 thẻ Major** (đều là thêm hoặc sửa vài dòng, chữ đề xuất có sẵn bên dưới). Không có Blocker.

Chỗ yếu nhất nằm đúng ở thực tế "một người giữ 6 vai":
- Không ai bấm kiểm phòng được, nhưng tài liệu chỉ nói "nhận khách vào `VC` như thường". Không có dòng nào bắt ai đi kiểm căn bằng mắt.
- Bảng việc mỗi ngày của lễ tân để "rời quầy muộn nhất 21:00" **sau** các việc 22:00 và 23:00.
- Giữ chỗ hết hạn trong đêm (sau 21:00, trước 09:00) không ai xử lý được.
- Khách đến sau 22:00 chỉ còn "đối chiếu giấy tờ gốc, giao mã", mất bước nhận giấy tờ và khai báo.

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 7 (G01–G07) |
| Minor | 8 (G08–G15) |
| Suggestion | 1 (G16) |

## Quyết định DOM cho 3 điểm BA hỏi

**D1 – Không ai kiểm phòng (A2): ĐỒNG Ý cách làm trên Desk, kèm điều kiện (thẻ G01).**
- Đúng sổ tay 3.1 và 3.6: tài khoản có 2 bước bị app nhân viên chặn, Desk không có thao tác kiểm, nên `VC` → `VI` không làm được. Điều kiện nhận phòng chấp nhận `VC`. Giả định A2 của BA không cần thử thêm để dùng cho đào tạo.
- **Kiểm bằng mắt vẫn bắt buộc.** Người trực chỉ bấm **Làm xong** sau khi tự đi kiểm căn theo 12 mục của màn Kiểm phòng. Căn có khách đến phải rà xong trước 11:00. Căn trống quá 3 ngày phải rà lại trong ngày khách đến.
- **Không tạo tài khoản thứ hai** (Lễ tân trưởng + Buồng phòng + Bảo trì) cho cùng người. Cùng một người thì bấm kiểm trên app không thêm kiểm soát nào so với tự đi kiểm rồi bấm **Làm xong**. Đổi lại phải phá nguyên tắc "mỗi người một tài khoản". Không lập ESC.
- Khi tuyển buồng phòng hay lễ tân: mỗi người một tài khoản, đúng vai. Muốn có bước kiểm thật thì gán vai **Lễ tân trưởng** (không kèm Quản lý) cho một lễ tân (sổ tay 3.6).
- Nhờ QA xác nhận trên Desk tập trước C3a, một thao tác: bấm **Làm xong** việc **Dọn trả phòng** trên Desk thì căn từ `VD` sang `VC`. Mã Desk gọi cùng thao tác `complete` như app, nên DOM kỳ vọng Đạt.

**D2 – Sale/CTV không tự hủy giữ chỗ đã có cọc (A7): ĐỒNG Ý, mở rộng (thẻ G02).**
- Sale/CTV chỉ tự hủy giữ chỗ của mình khi **Đã nhận = 0 đ** và đơn **không** có dòng **CTV/sale đã báo chuyển cọc**. Mọi đơn khác của mình thì nhắn lễ tân. "Mọi đơn khác" gồm: giữ chỗ có tiền, khách nói đã chuyển, đơn **Đã xác nhận** (sale nội bộ có quyền "M (hủy)").
- Lý do:
  - Hủy đơn có tiền sinh yêu cầu hoàn. Nơi nhận hoàn chỉ nhập được trên máy quầy, và chủ đầu tư duyệt, chi.
  - Quan trọng hơn: Desk tính bậc hoàn theo **ngày bấm hủy**, không theo giờ khách báo (02 mục 6.2). Sale/CTV phải chuyển cho lễ tân **giờ khách báo**, và lễ tân hủy **trong ngày Desk khách báo**. Không kịp thì ghi sổ giao ca để chủ đầu tư bù phần chênh.
- Đề xuất PO (sau v1.0.1, không gấp): Desk chặn nút hủy của SAL/CTV khi đơn đã có tiền.

**D3 – Thứ tự và mốc giờ "Việc mỗi ngày": SỬA theo thẻ G03 (02), G04 (mốc 3), G05 (03), G09 (04), G11 (05), G12 (bảng giờ 01, 02).**
- Mốc giờ của sổ tay 1.5 giữ nguyên.
- Đổi thứ tự cho đúng trình tự thật trong ngày:
  - Mở quầy: muộn nhất 09:00.
  - Đóng quầy: muộn nhất 21:00. Mốc 3 rà giữ chỗ, đối chiếu tiền và ghi sổ giao ca làm lúc đóng quầy.
  - Sau đóng quầy, người trực **vẫn trực điện thoại cơ sở**: 22:00 chép danh sách, 23:00 đánh dấu không đến, rồi mới đăng xuất máy quầy.
- Buồng phòng dọn theo thứ tự ưu tiên chuẩn ngành:
  1. Căn trống có khách đến.
  2. Căn khách trả có khách đến cùng ngày.
  3. Phòng khách đang ở, **không gõ cửa trước 09:00**.
  4. Căn khách trả không có khách đến.

**D4 – A10, A11:** A10 đồng ý nhưng phải ghi đủ bước nhận phòng ban đêm (thẻ G06). A11 đồng ý, thêm ngoại lệ sự cố an toàn (thẻ G08).

---

## Thẻ feedback

### FB-R3-DOM-BA-G01
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 13.2 (thêm 13.2a), mục 14.2 gạch cuối, mục 2 dòng "Trước 12:00"; `00-index.md` mục 2.1 gạch "Không ai kiểm phòng được"; `01-chu-dau-tu-quan-ly.md` mục 1.8 đoạn "Hệ quả"; `03-buong-phong.md` "Cách đọc" gạch cuối, mục 12 dòng cuối
- Vấn đề: Mọi tệp chỉ ghi "Không ai kiểm phòng được … lễ tân nhận khách vào `VC` như thường". Không có dòng nào nói ai, khi nào, kiểm căn bằng mắt. Với một người giữ 6 vai, **Làm xong** trên Desk là dấu duy nhất "căn đã sẵn sàng". Nếu bấm ngay khi dọn xong mà không đi kiểm, căn có thể thiếu khăn, mất nước nóng, hay sưởi hỏng (sự cố hay gặp theo brief) mà vẫn giao khách. Tài liệu cũng không nói căn khách trả mà chưa bấm **Làm xong** thì vẫn là `VD`, Desk coi chưa sẵn sàng. Việc khách đang ở không muốn dọn cũng không có hướng dẫn trên Desk (Desk không có nút "Khách không muốn dọn", chỉ có **Hủy việc** → **Lý do**).
- Vì sao quan trọng: Khách nhận căn chưa đạt chuẩn ở ngày D là lỗi trải nghiệm nặng nhất với boutique 10 căn. Lễ tân sẽ không có ai đỡ vì trên giấy "không ai kiểm" là đúng quy trình.
- Đề xuất sửa: BA chép nguyên văn.

  Thêm mục mới trong `02`, ngay sau 13.2:

  > ### 13.2a Khi chưa ai kiểm phòng được (người trực hiện nay)
  >
  > Tài khoản giữ 6 vai chưa vào được app nhân viên, nên không ai bấm **Kiểm phòng** (`VC` → `VI`). Desk vẫn cho nhận khách vào căn `VC`. Việc kiểm bằng mắt **vẫn phải làm**, chỉ là không ghi trên app:
  > 1. **Chỉ bấm Làm xong khi căn đã đạt.** Dọn xong căn trống (tự dọn, hoặc người dọn báo xong): đi một vòng căn theo 12 mục kiểm (ga gối, phòng tắm, khăn, đồ dùng, bếp, bàn làm việc, Wi-Fi, rèm/cửa sổ, mùi, remote/điều hòa/sưởi, thẻ chào…). Mở thử nước nóng và sưởi. Đạt hết mới bấm **Làm xong** ở dòng việc. Chưa đạt: dọn lại, chưa bấm.
  > 2. **Căn trống từ đêm qua, có khách đến hôm nay:** rà xong **trước 11:00**, còn 1 giờ để xử lý trước giờ nhận phòng 12:00. **Căn khách trả mà có khách mới đến cùng ngày:** dọn ngay khi khách trả, bấm **Làm xong** **trước 14:00**.
  > 3. **Căn trống quá 3 ngày:** rà lại trong ngày khách đến dù Desk đang hiện `VC`. Mở cửa sổ cho thoáng, xả nước nóng 1–2 phút, xem côn trùng, ẩm mốc, mùi. Ghi sổ giao ca: "Rà lại căn … – hh:mm".
  > 4. **Căn khách trả mà chưa bấm Làm xong** vẫn là `VD`, Desk coi căn chưa sẵn sàng. Dọn và kiểm xong thì bấm ngay, đừng để cuối ngày.
  > 5. **Khách đang ở không muốn dọn** (treo biển, khách nói không cần): **Hủy việc** → **Lý do**: "Khách không muốn dọn – treo biển" hoặc "Khách không muốn dọn – khách nói". Ngày mai vẫn có việc dọn như thường.
  > 6. Người dọn thuê theo giờ, không có tài khoản: người trực bấm **Làm xong** thay, sau khi tự đi kiểm theo bước 1.
  > 7. Thứ tự dọn khi nhiều việc: như tệp 03 mục 2.
  >
  > Khi OTTIMO có lễ tân trưởng không giữ vai quản lý: người đó kiểm trên app nhân viên (mục 14.2), bỏ mục này.

  `02` mục 14.2, thay gạch cuối bằng:
  > - Ngày lễ tân trưởng nghỉ, hoặc tài khoản có vai quản lý (người trực hiện nay), thì **không ai bấm kiểm được**. Lễ tân vẫn nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`), sau khi căn đã được kiểm bằng mắt theo mục 13.2a.

  `02` mục 2, thay dòng "Trước 12:00": xem thẻ G03.

  `00` mục 2.1 và `01` mục 1.8, thay câu "Không ai kiểm phòng được (`VC` → `VI`). Lễ tân nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`) như thường." bằng:
  > **Không ai bấm kiểm phòng được** (`VC` → `VI`). Người trực tự đi kiểm căn theo 12 mục rồi mới bấm **Làm xong** (`02` mục 13.2a). Lễ tân nhận khách vào căn `VC` như thường.

  `03` "Cách đọc" gạch cuối và mục 12 dòng cuối: thêm "…, sau khi tự đi kiểm căn (tệp 02 mục 13.2a)".
- Trạng thái: Open

### FB-R3-DOM-BA-G02
- Mức độ: Major
- Vị trí: `05-sale-ctv.md` mục 4.2 gạch 3 và chú thích `BA-GUIDES D2`, mục 7.2 gạch "Không tự hủy giữ chỗ đã có cọc"; `02-le-tan.md` mục 6.2 (thêm bước cho đơn sale/CTV báo hủy)
- Vấn đề: Quy tắc của BA đúng hướng nhưng hẹp và thiếu dữ kiện.
  - (a) "Khách đã chuyển một phần hoặc đủ" khiến sale/CTV tự đoán. Đúng ra phải căn cứ trên Desk (**Đã nhận**, dòng **CTV/sale đã báo chuyển cọc**). CTV đã **Báo đã chuyển cọc** mà lễ tân chưa xác nhận thì Desk vẫn ghi Đã nhận 0 đ. Theo chữ hiện nay, CTV được hủy giữ chỗ đó và tiền khách thành tiền không có đơn.
  - (b) Sale nội bộ có quyền "M (hủy)" cả **đơn Đã xác nhận** của mình (sổ tay 5.3). Đơn này luôn có tiền, nhưng tệp không nói gì.
  - (c) Thiếu dữ kiện quan trọng nhất: Desk tính bậc hoàn (≥ 7 ngày 100 %, 3–6 ngày 50 %, < 3 ngày 0) theo **ngày bấm hủy trên Desk** (`02` mục 6.2), không theo giờ khách báo. Khách nhắn CTV lúc 22:00 ngày thứ 7 trước ngày đến, lễ tân hủy lúc 09:00 sáng hôm sau, thì Desk tính 6 ngày, hoàn 50 % thay vì 100 %.
- Vì sao quan trọng: Sai tiền với khách (hoàn thiếu) và tiền không có đơn. Đây là khiếu nại dễ xảy ra nhất ở kênh CTV.
- Đề xuất sửa: BA chép nguyên văn.

  `05` mục 4.2, thay gạch 3 (và bỏ chú thích `BA-GUIDES D2`) bằng:
  > - **Chỉ tự hủy** giữ chỗ của mình khi trên đơn **Đã nhận** là **0 đ** **và không có** dòng **CTV/sale đã báo chuyển cọc**.
  > - Mọi trường hợp khác **không tự hủy**: khách đã chuyển một phần hay đủ, anh/chị đã **Báo đã chuyển cọc**, khách nói "đã chuyển" mà Desk chưa thấy, hoặc đơn đã **Đã xác nhận**. Nhắn lễ tân ngay:
  >   - **mã đơn**;
  >   - khách báo hủy **ngày nào, mấy giờ, qua kênh nào** (Zalo, điện thoại);
  >   - lý do khách nói.
  >
  >   Không ghi tên khách.
  > - Không hứa số tiền hoàn. Nói với khách: lễ tân OTTIMO sẽ báo số hoàn theo chính sách hủy.
  > - Vì sao: hủy đơn có tiền tạo yêu cầu hoàn. Nơi nhận hoàn chỉ nhập được trên máy quầy đã cấp quyền, chủ đầu tư duyệt và chi. Mức hoàn tính theo ngày khách báo, nên giờ khách báo phải tới lễ tân sớm nhất.

  `05` mục 7.2, thay gạch tương ứng bằng: "Không tự hủy đơn của mình khi đơn đã có tiền hoặc đã báo chuyển cọc (mục 4.2)."

  `02` mục 6.2, thêm sau bước 4:
  > 4a. **Sale/CTV nhắn khách báo hủy:** hủy **trong ngày khách báo** (ngày trên Desk, đổi lúc 06:00). Tin tới sau giờ quầy thì hủy ngay ở lượt mở quầy sáng hôm sau. Nếu bậc hoàn Desk tính thấp hơn bậc theo ngày khách báo, ghi sổ giao ca: "OTM-… khách báo hủy dd/mm hh:mm qua CTV/sale, Desk tính theo ngày hủy dd/mm". Chủ đầu tư xem trong lượt kiểm sáng và quyết phần chênh. Không hứa với khách trước khi chủ đầu tư quyết.
- Trạng thái: Open

### FB-R3-DOM-BA-G03
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 2 (bảng "Việc mỗi ngày")
- Vấn đề:
  - (a) Thứ tự sai. Dòng "**Trước khi rời quầy (muộn nhất 21:00)**", đúng ra phải gồm mốc 3, đối chiếu tiền và đăng xuất, lại nằm **sau** các dòng 22:00 và 23:00. Người đọc hiểu là đăng xuất lúc 21:00 rồi thì việc 22:00 (chép danh sách, đối chiếu sổ giấy 3 ngày đầu) và 23:00 (**Đánh dấu không đến**, nút chỉ mở từ 23:00) không ai làm.
  - (b) Thiếu dòng 07:00, dù bảng giờ mục 18 và sổ tay 5.1 có. Thiếu cả quyết định INV 30/10: khi form website bật, Desk mở trên điện thoại người trực 07:00–22:00.
  - (c) Dòng "Trước 12:00 – lễ tân trưởng kiểm" không đúng với OTTIMO hiện nay (thẻ G01).
  - (d) "Bàn giao với ca trước" không có nghĩa khi chỉ có một người. Việc thật là đọc sổ giao ca tối qua và dòng chủ đầu tư ghi trong lượt kiểm sáng.
  - (e) Không nói người trực vẫn trực sau khi đóng quầy, trong khi khách đến muộn "gọi người trực" (mục 13.3).
- Vì sao quan trọng: Đây là bảng người trực dán cạnh quầy và học ở C3a. Sai trình tự thì sẽ bỏ sót đánh dấu không đến (căn bị giữ, mất bán) hoặc khai báo lưu trú.
- Đề xuất sửa: Thay toàn bộ bảng mục 2 bằng bảng sau. Mốc giờ giữ nguyên sổ tay 1.5, chỉ đổi thứ tự và thêm cột người.

  > | Khi nào | Việc | Ở đâu |
  > |---|---|---|
  > | **07:00** | Bắt đầu trả lời tin, yêu cầu của khách. Desk chuyển căn có khách sang "cần dọn". Khi chủ đầu tư đã bật form website: Desk mở trên máy quầy và điện thoại người trực 07:00–22:00 | Điện thoại cơ sở, **Hôm nay** |
  > | Trước giờ mở quầy | Khách nhận phòng sớm đã hẹn (từ 06:00, có phụ thu): ra quầy đúng giờ hẹn, làm trên máy quầy | Mục 7.1 |
  > | Từ 08:00 | Nhắn khách đi hôm nay xác nhận giờ trả; ghi **Xác nhận giờ trả** | Mục 9.6 |
  > | **Mở quầy (muộn nhất 09:00)** | Đăng nhập, kiểm chip **Máy quầy đã cấp quyền**. Tờ **Your ID details** đúng chỗ, mặt quay ra khách | Mục 1.4, 7.2 |
  > | Mở quầy | Đọc **Cần chú ý** trước, xử lý từ dòng đỏ trở xuống. Xem **Khách đến (n)**, **Khách đi (n)**, **Giữ chỗ chưa cọc (n)**, **Yêu cầu của khách** | **Hôm nay** (mục 3.1) |
  > | Mở quầy | **Rà giữ chỗ – mốc 1** (tới v1.0.1) | Mục 17.1 |
  > | Mở quầy | Đọc sổ giao ca tối qua và dòng chủ đầu tư ghi trong lượt kiểm sáng. Đếm tiền mặt trong két. Khi có nhiều người: bàn giao với ca trước | Sổ giao ca |
  > | Mở quầy, 12:00, 18:00, đóng quầy | Kiểm extranet mọi kênh OTA; đơn mới thì nhập Desk ngay | Mục 5.3 |
  > | **Trước 11:00** | Căn trống từ đêm qua có khách đến hôm nay đã rà xong. Người trực hiện nay: tự kiểm rồi bấm **Làm xong** (mục 13.2a). Khi có lễ tân trưởng: kiểm trên app xong trước 12:00 (mục 14.2) | **Buồng phòng** |
  > | **11:00** | **Rà giữ chỗ – mốc 2** (trước trần 12:00 ngày đến) | Mục 17.1 |
  > | **12:00** | Giờ trả phòng. Nhận phòng từ 12:00 nếu căn `VC`/`VI`. Khách đi chưa trả mà căn có khách đến tối nay: chốt giờ đi | Mục 7, 11, 11.4 |
  > | Ngay khi khách trả | Căn có khách đến cùng ngày: dọn, kiểm, bấm **Làm xong** | Mục 13.2a |
  > | **14:00** | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** | **Buồng phòng** |
  > | **18:00** | Khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách | Mục 6.3 |
  > | **Đóng quầy (muộn nhất 21:00)** | Nhắn khách đi ngày mai xác nhận giờ trả (sau 21:00 không nhắn khách). **Rà giữ chỗ – mốc 3**, gồm cả giữ chỗ hết hạn trước 09:00 sáng mai (mục 17.1). **Cần chú ý** không còn dòng đỏ chưa xử lý (hoặc đã ghi sổ giao ca). Ghi sổ giao ca các phiếu thanh toán đã cấp (mục 11.7). Đối chiếu tiền mặt (mục 12.4) | Mục 17.1, 11.7, 12.4 |
  > | Sau đóng quầy | **Người trực vẫn trực** điện thoại cơ sở, bật chuông. Chỉ trả lời khách nhắn tới. Khách đến muộn gọi: ra quầy, làm trên máy quầy (mục 13.3) | Điện thoại cơ sở |
  > | **22:00** | Trên máy quầy: chép tay danh sách khách đến/đi ngày mai (mục 15). Ba ngày đầu (02, 03, 04/11): so sổ giấy với Desk, báo chủ đầu tư qua điện thoại. Từ 22:00 không xác nhận chuyển khoản qua điện thoại | Sổ giấy |
  > | **23:00** | Khách chưa đến, vẫn không liên lạc được: **Đánh dấu không đến** (đơn OTA kiểm extranet trước; khách đã báo đến muộn thì không đánh dấu). Hạn khai báo khách Việt Nam | Mục 6.3, 8.3 |
  > | Xong việc 23:00 | **Đăng xuất** máy quầy | Mục 1.6 |
  > | Mỗi lần thấy **Giữ chỗ sắp hết hạn** | Gọi khách ngay, xử lý trước hạn | Mục 4.5 |
- Trạng thái: Open

### FB-R3-DOM-BA-G04
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 17.1 "Khi nào rà" và bước (1); `05-sale-ctv.md` mục 8.1
- Vấn đề: Cách rà 3 mốc (DOM 30/10) để trống khoảng **21:00 → 09:00 sáng hôm sau**.
  - Giữ chỗ hết hạn trong khoảng này mà đã có cọc: Desk chỉ còn **Hủy**. Lượt sáng buộc phải đi đường hủy – đặt lại – hoàn, và chủ đầu tư phải chi.
  - Giữ chỗ chưa cọc mà khách chuyển lúc 22:30: từ 22:00 không ai xác nhận được tiền về, Desk tự hủy lúc hết hạn, tiền khách thành tiền không có đơn.
  - Ở mốc 3 người trực **vẫn còn** xác nhận cọc và gia hạn được, nhưng chữ hiện nay chỉ bảo xử lý giữ chỗ "còn dưới 2 giờ".
- Vì sao quan trọng: Đây là cách rẻ nhất để không phải dùng đường tạm BUG-R3-042 (P1) trong 2 ngày đầu, khi người trực mới quen Desk.
- Đề xuất sửa: BA chép nguyên văn.

  `02` mục 17.1, thêm sau đoạn "**Khi nào rà:** …":
  > **Ở mốc 3 (đóng quầy):** mọi giữ chỗ có hạn **trước 09:00 sáng mai** coi như "còn dưới 2 giờ" và xử lý ngay theo (1):
  > - tiền đã về thì xác nhận;
  > - khách cần thêm thời gian thì **Gia hạn giữ chỗ (1 lần)** để hạn mới rơi sau 09:00 (không quá 12:00 ngày đến);
  > - khách không đi nữa thì hủy.
  >
  > Lý do: sau 22:00 không ai xác nhận được tiền về, và sau hạn Desk chỉ còn **Hủy giữ chỗ**.

  `05` mục 8.1, thêm gạch đầu:
  > - Giữ chỗ của anh/chị hết hạn trong đêm (21:00–09:00): xử lý **trước 21:00**. Xác nhận cọc nếu tiền đã về, hoặc **Gia hạn giữ chỗ (1 lần)** sang sau 09:00. Không để khách chuyển cọc sau 21:00 cho giữ chỗ hết hạn trong đêm.
- Trạng thái: Open

### FB-R3-DOM-BA-G05
- Mức độ: Major
- Vị trí: `03-buong-phong.md` mục 2 (bảng "Việc mỗi ngày"), mục 13 (bảng giờ)
- Vấn đề:
  - (a) Dòng "**Từ 07:00** … Dọn phòng khách đang ở theo việc trong app" đứng trước các việc ưu tiên, nên đọc thành "07:00 bắt đầu gõ cửa phòng khách". 07:00 chỉ là giờ Desk **tạo** việc dọn phòng khách ở. Chuẩn ngành là không gõ cửa phòng khách trước khoảng 09:00, trừ khi khách yêu cầu.
  - (b) Bảng không có **thứ tự ưu tiên** khi nhiều việc cùng lúc (căn có khách đến → căn trả cùng ngày có khách đến → phòng khách ở → căn trả không có khách đến).
  - (c) "Đầu ca sáng" không có giờ chốt. Căn có khách đến cần xong trước 11:00 thì lễ tân trưởng mới kịp kiểm trước 12:00.
- Vì sao quan trọng: Gõ cửa khách 07:00 ở Đà Lạt (khách nghỉ dưỡng, dậy muộn) là khiếu nại chắc chắn. Sai thứ tự làm căn có khách đến không kịp 14:00.
- Đề xuất sửa: Thay bảng mục 2 bằng:

  > | Khi nào | Việc |
  > |---|---|
  > | Đầu ca sáng | Đăng nhập app. Mở **Việc**, xem tiến độ **… xong** |
  > | **Trước 11:00** | **(1)** Căn **trống từ đêm qua, có khách đến hôm nay**: rà lại căn, dọn nếu cần, bấm **Dọn xong**, để lễ tân trưởng kiểm xong **trước 12:00** |
  > | Trước **12:00** | Bộ đồ dùng thêm cho người ở thêm: chuẩn bị xong |
  > | Khi lễ tân báo khách sắp trả | Đếm minibar căn đó, **báo lễ tân số còn lại từng món** (mục 7) |
  > | Ngay khi khách trả | **(2)** Căn có khách mới đến cùng ngày: dọn ngay, trước mọi việc khác trừ (1). Bấm **Dọn xong** để căn **sẵn sàng trước 14:00** |
  > | **Từ 09:00**, khi khách ra ngoài hoặc khách mời dọn | **(3)** Phòng khách đang ở. Desk tạo việc lúc 07:00, nhưng **không gõ cửa trước 09:00** trừ khi khách yêu cầu. Treo biển "Không làm phiền": không vào (mục 5.2) |
  > | Sau đó | **(4)** Căn khách trả, không có khách đến hôm nay |
  > | Trong ngày | Việc **Bổ sung minibar**, **Yêu cầu của khách**, **Dọn sau sửa chữa** |
  > | Khi thấy hỏng hóc | **Báo sự cố** kèm ảnh (mục 9) |
  > | Thấy đồ khách để quên | Báo lễ tân ngay |
  > | Cuối ca | Mọi việc đã bấm đúng. **Tôi → Thao tác trên máy** không còn thao tác chờ gửi |
  > | Trả máy, đổi người dùng máy | **Tôi → Đăng xuất** |
  >
  > Nhiều việc cùng lúc: làm theo thứ tự **(1) → (2) → (3) → (4)**. Khách yêu cầu dọn ngay thì làm sau (1), (2).

  Mục 13, thêm dòng sau dòng 07:00:
  > | **09:00** | Bắt đầu dọn phòng khách đang ở (sớm hơn chỉ khi khách yêu cầu) |

  Ghi chú cho BA: mốc 09:00 là chuẩn ngành do DOM đặt (việc nội bộ, không phải chính sách với khách). Chủ đầu tư đổi được nếu muốn.
- Trạng thái: Open

### FB-R3-DOM-BA-G06
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 13.3 gạch 4 (A10)
- Vấn đề: BA thay câu sổ tay "đã làm thủ tục trước" (đúng, vì check-in online tạm dừng). Nhưng câu mới "người trực đối chiếu giấy tờ gốc, cho xem tờ Your ID details như mọi khách, giao mã" **không còn** bước nhận giấy tờ trên Desk, hỏi đồng ý lưu ảnh, thu tiền. Câu cũng không nói phải làm trên **máy quầy đã cấp quyền** (Nhận phòng và giấy tờ chỉ làm được ở đó, mục 1.5). Lúc 23:30, người trực một mình dễ hiểu là "nhìn giấy tờ rồi đưa mã". Thiếu luôn việc ghi khách báo đến muộn, để không bị **Đánh dấu không đến** lúc 23:00.
- Vì sao quan trọng: Khách không có giấy tờ trên Desk thì không khai báo lưu trú được, vi phạm nghĩa vụ khai báo. Đánh dấu không đến nhầm khách đã báo muộn thì mất căn của khách đang trên đường.
- Đề xuất sửa: Thay gạch 4 mục 13.3 bằng:
  > - Khách báo sẽ đến sau 22:00: hỏi giờ đến dự kiến và số điện thoại liên lạc lúc đến. Ghi sổ giao ca "OTM-… đến khoảng hh:mm". Đơn này **không** đánh dấu không đến lúc 23:00.
  > - Khách đến sau 22:00: người trực ra quầy, làm **đủ các bước nhận phòng như ban ngày** trên **máy quầy đã cấp quyền** (mục 7.3):
  >   1. Cho xem tờ **Your ID details** trước khi nhận giấy tờ.
  >   2. Nhận giấy tờ gốc.
  >   3. Hỏi đồng ý lưu ảnh (mục 8.2).
  >   4. Thu tiền: từ 22:00 mời tiền mặt hoặc thẻ (mục 18).
  >   5. **Nhận phòng**, rồi mới giao mã.
  >
  >   Không giao mã trước khi xong giấy tờ. Không làm nhận phòng trên điện thoại.
- Trạng thái: Open

### FB-R3-DOM-BA-G07
- Mức độ: Major
- Vị trí: `01-chu-dau-tu-quan-ly.md` mục 13 gạch 1 ("Trước ngày D – kiểm VietQR một lần"); báo cáo BA A8 (a)
- Vấn đề: Việc C1 **đã xong** ngày 30/10. Giữ chỗ thử OTM-00001 đã quét, tên chủ tài khoản và 4 số cuối đúng, đã hủy (decision-log 30/10 "C1 / D-INV-3 Đạt"). Tệp vẫn dặn chủ đầu tư tạo giữ chỗ "TEST OTTIMO" ngày 17/11. Đọc trong buổi đào tạo, chủ đầu tư có thể tạo thêm một đơn thử trên Desk thật: dữ liệu tiền chỉ ghi thêm, nhảy thêm số đơn, trái sổ tay 1.7.
- Vì sao quan trọng: Hướng dẫn cũ trên dữ liệu thật, không xóa được.
- Đề xuất sửa: Thay gạch 1 mục 13 bằng:
  > - **Kiểm VietQR trước ngày D: đã làm 30/10** (giữ chỗ thử OTM-00001, đã hủy, không chuyển tiền). **Không tạo thêm đơn thử.** Lần đổi tài khoản nhận sau: làm theo mục 10.1, kiểm ở đơn thật đầu tiên.
- Trạng thái: Open

### FB-R3-DOM-BA-G08
- Mức độ: Minor
- Vị trí: `04-bao-tri.md` mục 4.2 gạch 2, mục 8.2 gạch 1 (A11)
- Vấn đề: A11 đúng: bảo trì không vào căn treo "Không làm phiền"; báo lễ tân đổi phòng trước khi khóa căn có khách. Nhưng quy tắc tuyệt đối thì thiếu ngoại lệ chuẩn ngành cho **sự cố an toàn**: nước rò lan sang căn khác hoặc xuống tầng dưới, mùi khét, khói, chập điện, khách kẹt trong căn.
- Vì sao quan trọng: Không có ngoại lệ thì người trực sẽ đứng chờ ngoài cửa khi nước đang tràn. Có ngoại lệ mà không có cách làm thì dễ bị khách khiếu nại vào phòng trái phép.
- Đề xuất sửa: Thêm sau gạch 2 mục 4.2:
  > - **Ngoại lệ – sự cố an toàn** (nước rò lan ra ngoài căn, mùi khét, khói, chập điện, khách kẹt trong căn):
  >   1. Lễ tân gọi số khách trên đơn.
  >   2. Gõ cửa, xưng rõ là kỹ thuật OTTIMO.
  >   3. Khách không trả lời: **hai người cùng vào** (lễ tân và bảo trì; chỉ có một người thì gọi điện cho chủ đầu tư trong lúc vào).
  >   4. Chỉ làm việc khẩn, không động vào đồ của khách.
  >   5. Ghi sổ giao ca: mã đơn, giờ vào, giờ ra, ai vào, đã làm gì. Báo chủ đầu tư và báo khách ngay khi liên lạc được.

  Sửa mục 8.2 gạch 1: "…Không vào căn treo "Không làm phiền", trừ sự cố an toàn (mục 4.2)."
  Câu xưng với khách bằng tiếng Anh: UXD viết (EN dẫn, VI hỗ trợ).
- Trạng thái: Open

### FB-R3-DOM-BA-G09
- Mức độ: Minor
- Vị trí: `04-bao-tri.md` mục 2 (bảng "Việc mỗi ngày"), mục 10 (bảng giờ)
- Vấn đề: Bảng đúng thời hạn phiếu, nhưng thiếu hai mốc ăn khớp với lễ tân và buồng phòng. Một: căn có khách đến hôm nay mà còn phiếu mở thì phải báo sớm để lễ tân đổi căn. Hai: việc không gấp trong căn có khách làm vào giờ nào.
- Vì sao quan trọng: Phát hiện lúc 13:30 rằng căn có khách đến chưa sửa xong là quá muộn để đổi căn cho êm.
- Đề xuất sửa: Thêm vào bảng mục 2, sau dòng "Đầu ca":
  > | Đầu ca | Phiếu của căn **có khách đến hôm nay**: làm trước. Không xong được **trước 11:00** thì báo lễ tân ngay để đổi căn |
  > | Việc không gấp trong căn có khách | Hẹn qua lễ tân, làm trong **09:00–18:00** |

  Thêm vào bảng mục 10, dòng **11:00**: "Căn có khách đến chưa sửa xong: báo lễ tân".
- Trạng thái: Open

### FB-R3-DOM-BA-G10
- Mức độ: Minor
- Vị trí: `04-bao-tri.md` mục 6 gạch cuối
- Vấn đề: Gạch "Kỳ tháng 10/2026 chốt ngày 31/10 trong sổ cũ." đã cũ: chủ đầu tư xác nhận 30/10 không có khách dài hạn đang ở (decision-log, INV điểm 2). Mục này cũng thiếu bước chốt **chỉ số đầu kỳ ngày khách dài hạn nhận phòng** và chỉ số cuối ngày trả phòng. Không có số đầu kỳ thì không tính được tiền điện tháng đầu.
- Vì sao quan trọng: Tiền điện nước của khách dài hạn (1,2–2 triệu đ/tháng theo brief) dễ tranh chấp khi thiếu số đầu kỳ có ảnh.
- Đề xuất sửa: Thay gạch cuối bằng:
  > - Khách dài hạn **nhận phòng**: chốt chỉ số **đầu kỳ** ngay hôm đó, có ảnh. **Trả phòng**: chốt chỉ số cuối, có ảnh, trước khi lễ tân trả phòng.
  > - Hiện không có khách dài hạn đang ở (chủ đầu tư xác nhận 30/10): chưa có kỳ nào phải chốt. Khi có khách dài hạn đầu tiên, chủ đầu tư điền người chốt và ngày chốt ở trên.
- Trạng thái: Open

### FB-R3-DOM-BA-G11
- Mức độ: Minor
- Vị trí: `02-le-tan.md` mục 4.3 bước 2; `05-sale-ctv.md` mục 4.1 bước 2; `02` mục 17.1 (2) "Đến từ ngày mai … chọn **12 h**"
- Vấn đề: Tới v1.0.1, giữ chỗ hết hạn ngoài giờ quầy là nguồn rắc rối chính (thẻ G04). Ví dụ giữ chỗ tạo lúc 15:00 mà chọn 12 h thì hết hạn lúc 03:00. Chính quy tắc "tạo lại một lần, 12 h" của DOM 30/10 cũng cho hạn sau 21:00 nếu tạo sau 09:00.
- Vì sao quan trọng: Rẻ hơn mọi cách tạm sau hạn.
- Đề xuất sửa: Thêm vào `02` mục 4.3 bước 2 và `05` mục 4.1 bước 2:
  > Tới v1.0.1: chọn thời hạn để giờ hết hạn rơi vào **09:00–21:00**. Ví dụ tạo lúc 15:00: chọn **24 h** (hạn 15:00 hôm sau), không chọn 12 h (hạn 03:00 sáng).

  Sửa `02` mục 17.1 (2) và `05` mục 8.1: "tạo **giữ chỗ mới**, chọn **12 h** nếu hạn rơi trước 21:00; nếu không thì chọn **24 h**". DOM tự chỉnh quyết định 30/10 của mình, đã ghi `decision-log.md`.
- Trạng thái: Open

### FB-R3-DOM-BA-G12
- Mức độ: Minor
- Vị trí: `02-le-tan.md` mục 18 (bảng giờ); `01-chu-dau-tu-quan-ly.md` mục 16 (bảng giờ)
- Vấn đề:
  - `02` mục 18: dòng "Mở quầy, muộn nhất 09:00" nằm **trên** dòng "Sáng (từ 08:00)". Dòng "Trước 21:00" gộp mốc 3 mà không nói đó là đóng quầy. Thiếu mốc 11:00 rà căn có khách đến.
  - `01` mục 16: chủ đầu tư không thấy mốc mở quầy (09:00), đóng quầy (21:00), 23:00 của người trực. Đây là các mốc chủ đầu tư dựa vào khi gọi kiểm hoặc xem sổ giao ca.
- Vì sao quan trọng: Bảng giờ là phần in hoặc dán. Thứ tự sai làm người mới hiểu sai.
- Đề xuất sửa:
  - `02` mục 18:
    - Chuyển dòng "Mở quầy, muộn nhất **09:00** | Rà giữ chỗ mốc 1" xuống dưới dòng "Sáng (từ 08:00)".
    - Thêm dòng "**Trước 11:00** | Căn trống từ đêm qua có khách đến đã rà xong (mục 13.2a)".
    - Đổi "Trước **21:00**" thành "**Đóng quầy, muộn nhất 21:00** | Nhắn khách đi ngày mai xác nhận giờ trả. Rà giữ chỗ mốc 3, gồm giữ chỗ hết hạn trước 09:00 sáng mai. Sau 21:00 không nhắn khách; người trực vẫn trực điện thoại".
  - `01` mục 16:
    - Thêm "**09:00** | Người trực mở quầy muộn nhất, rà giữ chỗ mốc 1".
    - Thêm "**21:00** | Người trực đóng quầy muộn nhất, rà mốc 3".
    - Thêm "**23:00** | Người trực đánh dấu không đến; hạn khai báo khách Việt Nam".
- Trạng thái: Open

### FB-R3-DOM-BA-G13
- Mức độ: Minor
- Vị trí: `00-index.md` mục 5, gạch "Người trực 6 vai hiện nay"
- Vấn đề: Lộ trình hiện nay là học `02` (3 giờ) rồi `01` phần quản lý, `03`, `04`, `05`, mỗi phần làm bài tập, tổng hơn 7 giờ trong 31/10–01/11. Phần lớn `03`, `04` là đăng nhập app, mất mạng trên app, các nút trên app, mà người trực **không dùng được**. Người trực lại chưa tập phần làm thay trên Desk (**Làm xong**, phiếu sửa trên Desk, mục 13.2a mới).
- Vì sao quan trọng: Học quá tải trước ngày D thì quên đúng phần cần nhất (giữ chỗ, giấy tờ, hoàn tiền).
- Đề xuất sửa: Thay gạch đó bằng:
  > - **Người trực 6 vai hiện nay** (khoảng 5 giờ, chia 31/10 và 01/11):
  >   - `02` toàn bộ (3 giờ, bài tập mục 20.3).
  >   - `01` mục 1.3–1.7, 2, 4, 5, 6, 7, 8.3–8.5, 15 (1 giờ).
  >   - `03` mục 3, 4 (giờ cần xong), 7, 8, 11.2.
  >   - `04` mục 3, 4.2, 4.4, 5, 8.2.
  >   - `05` mục 3 (chính sách hủy), 4.2, 5.1, 8 (tổng 03–05 khoảng 1 giờ).
  >   - Bỏ phần đăng nhập và mất mạng của app nhân viên.
  >   - Bài tập thêm trên Desk tập: dọn và kiểm một căn rồi bấm **Làm xong** (mục 13.2a); hủy một việc dọn với lý do "Khách không muốn dọn"; tạo, nhận và đóng một phiếu sửa trên Desk.
- Trạng thái: Open

### FB-R3-DOM-BA-G14
- Mức độ: Minor
- Vị trí: `02-le-tan.md` mục 7.2 (hai cách cho khách xem); `00-index.md` mục 4; `01` mục 13 gạch "In tờ Your ID details"
- Vấn đề:
  - Chủ đầu tư đã quyết ngày 30/10: tờ **in khổ A4** đặt ở quầy. Tệp chưa ghi khổ A4. Cách "trên màn hình" đặt ngang hàng với bản in, trong khi máy tính bảng ở quầy dễ lẫn sang Desk. Phần bảo mật của cách này thuộc SEC (S1).
  - Về vận hành: "không có tờ thì không nhận giấy tờ" nghĩa là **không nhận phòng được ai**. Tờ rơi, ướt hay bị lấy mất lúc 23:00 thì người trực bị kẹt.
- Vì sao quan trọng: Một tờ giấy không được làm dừng nhận phòng cả đêm.
- Đề xuất sửa:
  - `02` mục 7.2 gạch 1: "**Bản in khổ A4** trong khung mica trên quầy… (cách chính, theo quyết định của chủ đầu tư 30/10)".
  - Thêm sau hai gạch:
    > Giữ **một bản in dự phòng** trong ngăn quầy. Tờ trên quầy hỏng hay mất thì thay ngay. Bản trên màn hình chỉ dùng khi chưa thay được bản in.
  - `01` mục 13: "In **2 bản** tờ Your ID details khổ A4: một bản đặt trong khung mica, một bản dự phòng trong ngăn quầy…".
  - Cách màn hình: chờ SEC S1.
- Trạng thái: Open

### FB-R3-DOM-BA-G15
- Mức độ: Minor
- Vị trí: `00-index.md` mục 3 dòng `ottimo.vn`; `02-le-tan.md` mục 13.1; `05-sale-ctv.md` mục 6.3
- Vấn đề:
  - Các tệp ghi form website "đang tắt (… bật khi luật sư trả lời)". Ngày 30/10 luật sư đã đồng ý, chủ đầu tư yêu cầu bật, đội đang làm các bước bật (decision-log 30/10, ESC-030). Chủ đầu tư cũng quyết: tới khi có tin Google Chat, Desk mở trên máy quầy và điện thoại người trực 07:00–22:00.
  - Hạn trả lời 15 phút đụng với quy tắc "không nhắn khách ngoài 08:00–21:00". Tệp chưa nói yêu cầu tới lúc 23:00 thì làm gì.
- Vì sao quan trọng: Form có thể bật ngay tuần đầu. Người trực cần biết trước cách làm, kẻo nhắn khách lúc nửa đêm hoặc bỏ yêu cầu qua đêm không ghi chú.
- Đề xuất sửa: Thay câu mở đầu khung "Tạm ở v1.0" ở `02` mục 13.1 và `05` mục 6.3 bằng:
  > Form "Yêu cầu đặt phòng" trên ottimo.vn **đang tắt tới khi chủ đầu tư báo bật** (luật sư đã đồng ý 30/10, đội đang chuẩn bị).

  Thêm sau đoạn "Khi chủ đầu tư bật form":
  > Khi form bật:
  > - Desk mở trên máy quầy và điện thoại người trực **07:00–22:00**.
  > - Hạn trả lời 15 phút áp trong **08:00–21:00**.
  > - Yêu cầu tới ngoài giờ: bấm **Nhận xử lý** khi thấy, nhắn khách từ 08:00 sáng hôm sau.

  `00` mục 3 dòng `ottimo.vn`: "Form đặt phòng **đang tắt**, chủ đầu tư báo khi bật".
- Trạng thái: Open

### FB-R3-DOM-BA-G16
- Mức độ: Suggestion
- Vị trí: `05-sale-ctv.md` mục 5.1 bước 3 và chú thích `BA-GUIDES S3` (A6); mục 5.2
- Vấn đề:
  - Về nghiệp vụ, câu chống giả danh gửi khách là "OTTIMO only messages you from this account…". Mã cọc vì vậy **phải** đi từ tài khoản OTTIMO. Sale nội bộ gửi từ Zalo cá nhân là trái chính câu mình vừa gửi.
  - Hiện sale nội bộ chính là người trực, nên A6 chưa phát sinh. Khi có sale làm ngoài quầy: nhờ người trực gửi mã từ tài khoản OTTIMO, sale không tự gửi. SEC quyết thiết bị (S3).
  - Với CTV, khách nhắn với CTV qua Zalo của CTV, rồi nhận mã cọc từ một tài khoản khác. Khách nên được báo trước điều này, kẻo nghi ngờ hoặc chuyển nhầm cho CTV.
- Vì sao quan trọng: Giảm lừa đảo giả danh và tiền cọc chuyển vào tài khoản CTV.
- Đề xuất sửa:
  - `05` mục 5.1 bước 3, thêm: "Sale làm việc ngoài quầy: nhờ người trực gửi mã cọc từ tài khoản OTTIMO. Không gửi từ Zalo cá nhân."
  - `05` mục 5.2, thêm gạch: "Báo khách trước: mã cọc sẽ do OTTIMO gửi từ tài khoản OTTIMO, nội dung chuyển khoản là mã đơn. Không nhận tiền cọc vào tài khoản của CTV." Câu nói với khách: UXD viết EN/VI.
- Trạng thái: Open

---

## Ghi chú cho các vai khác (không phải thẻ cho BA)

- **QA:** trước C3a, trên Desk tập, thử một thao tác: **Làm xong** việc **Dọn trả phòng** trên Desk thì căn `VD` → `VC` (điều kiện của quyết định D1). Không đạt thì báo ORC ngay; lúc đó người trực nhận phòng căn đó qua "Nhận phòng khi buồng chưa sẵn sàng" (quyền lễ tân trưởng) và DOM sửa 13.2a.
- **PO (sau v1.0.1):** (1) Desk chặn nút hủy của SAL/CTV khi đơn có tiền hoặc có báo chuyển cọc (G02). (2) Hộp hủy có ô "Khách báo hủy lúc", để bậc hoàn tính theo giờ khách báo, không theo giờ bấm (G02 c). (3) Desk có nút "Khách không muốn dọn" như app (G01 bước 5).
- **UXD:** câu EN/VI cho G08 (kỹ thuật xưng khi gõ cửa) và G16 (CTV báo khách mã cọc do OTTIMO gửi), theo brand guideline.
- **SEC:** S1 xem thêm G14 (bản dự phòng, màn hình chỉ là dự phòng). S3 xem G16.

## Điểm làm tốt – nên giữ

1. Chương **Đăng nhập** riêng cho từng vai, kèm bảng câu báo lỗi đăng nhập. Đây là phần các tờ in cũ thiếu nhất và INV hỏi đích danh.
2. `02` mục 17.1 chép đúng và đủ quyết định DOM 30/10: rà 3 mốc, có cọc thì để nguyên, đường (a)–(d), chủ đầu tư duyệt và chi, câu hẹn 24 giờ. Có ví dụ số 2.376.000 / 700.000 / 300.000 đ.
3. Mỗi tệp tự nói rõ phần nào khác đi khi chỉ có một người trực ("Cách đọc", 00 mục 2.1). Đúng cách nghĩ cho khách sạn 10 căn.
