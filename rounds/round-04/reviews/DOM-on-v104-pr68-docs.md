# DOM review – PR #68 `v104/ba-docs-r4b`: tài liệu v1.0.4, lượt 4b

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Tác giả: BA. Bản đọc là `git diff origin/main...origin/v104/ba-docs-r4b`, head `da98e511`, gồm 4 tệp:
  - `user-manual-v1.0.md` (lên bản 1.13);
  - `guides/00-index.md` (lên 1.11);
  - `guides/01-chu-dau-tu-quan-ly.md` (lên 1.10);
  - `guides/02-le-tan.md` (lên 1.11).
- Số dòng ghi trong file này là số dòng của tệp trên nhánh PR.
- Đối chiếu với `origin/main` @ `58183764`:
  - `admin-web/src/pages/stay/EarlyDepartureDialog.tsx` dòng 78–95 và 336–343;
  - `reservations/internal/allowed-actions.ts` dòng 109–117 và `reservations.service.ts` dòng 442–451 (`today: ctx.today`);
  - `ReservationDrawer.tsx` dòng 388;
  - `TodayPage.tsx` dòng 434–461, `useDashboard.ts` dòng 79 (gọi không kèm ngày);
  - `reporting/internal/dashboard.service.ts` dòng 88–93, `stay-lists.ts` dòng 83–103, `stay-actions.ts` dòng 38–47;
  - `frontdesk/internal/checkout.service.ts` dòng 651–700 và 795–811 (`postMidnight`);
  - `stay.service.ts` dòng 457, 1485–1487, 1853; `public/stay-rules.ts` dòng 221–230;
  - `identity` (danh sách hộp thư chung), strings `early_departure.later_hint`;
  - `ARC-on-v104-p4-32.md`; `DOM-on-v104-release-notes.md` thẻ RN-02, RN-05.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Bốn điểm (1) đến (4) đúng nghiệp vụ. Có **1 Major** phải sửa trước khi gộp: thẻ 01, rút ra từ kiểm (5).

Kết quả kiểm (5): **giả định của BA chỉ đúng một nửa.**
- Đúng: bước **Kết quả** không có **Trả phòng ngay**.
- Sai: trong khoảng 00:00–05:59, **khung đơn cũng không có nút Trả phòng**, và trang **Hôm nay** không liệt kê khách đó. Nút chỉ hiện từ 06:00.

Vì vậy câu "không thấy nút thì hỏi quản lý" luôn dẫn tới ngõ cụt: quản lý cũng không thấy nút. Câu "rời đúng ngày đi → khung đơn → Trả phòng" cũng không làm được trước 06:00.

Ngoài ra có 2 Minor và 2 Suggestion. Không có ESC mới.

---

## 1. Kết quả kiểm theo 5 điểm ORC giao

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Luật Trả sớm 00:00–05:59 ở sổ tay 2.14a bước 2 (dòng 1199) và `02` 11.5.1 (dòng 923) | **Đúng câu, đúng cách làm** ở phần Trả sớm: ô đặt sẵn ngày hôm trước; đêm vừa qua là đêm đã ở; đổi sang ngày lịch hôm nay; rời đúng ngày đi thì không dùng Trả sớm; số ngày báo trước tính theo BR-011 (ví dụ 04:30 ngày 03/11 rời 03/11 = báo trước 1 ngày). Phần **sau** bước Kết quả thì sai, xem thẻ 01 | `EarlyDepartureDialog.tsx` 78–95 (`minDate = today` theo ngày nghiệp vụ); `stay.service.ts:1408`; BR-010, BR-011 |
| 2 | Ngày kết thúc HĐ khi gia hạn (`02` 9.3 bước 6, 17.5; sổ tay 2.12, 2.14a, 5.6; `01` 7.3) | **Đúng.** Các câu đều đánh dấu "sửa ở v1.0.4" và "áp dụng từ v1.0.4". Desk giữ ngày kết thúc HĐ, không hiện ngày này trên khung đơn, nên bảng kỳ thu vẫn giữ cột. Trả sớm chỉ hiện khung HĐ khi rời trước ngày kết thúc. Nhật ký ghi "BR-313 lease early end – deposit per lease". Phần gia hạn không có dòng tiền. Có câu an toàn "khác HĐ giấy: dừng, hỏi quản lý" | `stay-rules.ts` 221–230; `stay.service.ts` 457 (B13 với `external_contract` chỉ `syncLeaseNights`), 1485–1487, 1853; admin-web chỉ đọc `leaseEndDate` trong hộp Trả sớm |
| 3 | Giới hạn "Đang chờ hoàn" | **Đạt.** Ở ca giới hạn, mọi chỗ đều chỉ ghi "hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách" và nói rõ yêu cầu **không hiện ở cả hai chỗ**. Các chỗ đã rà: sổ tay 2.14 bước 6 (dòng 1164), 2.14a; `02` 11.1 bước 6 (dòng 834), 11.5.2 (dòng 950). Chữ "chờ duyệt" và "do chính mình tạo" chính xác. Dấu hiệu nhìn thấy được ("không thấy dòng, hoặc không chắc") tốt hơn bản release notes. `01` 7.3 trỏ chủ đầu tư sang **Cần duyệt** và **Nhật ký tiền → Hoàn tiền**; chỗ này đúng vì chủ đầu tư thấy đủ. Còn hai việc nhỏ: câu "Sửa ở v1.0.5" (thẻ 02) và câu v1.0.3 ở 11.1 bước 6 (thẻ 04) | ARC A1/A2; `UXD-on-v104-p4-32.md` U5 |
| 4 | Chặn `booking@` ở các bước nhập email | **Đạt** ở sổ tay 0.3a, 1.5 bước 4, 5.0; `01` 1.6a, 1.9; `02` 1.6. Có cả dạng có dấu cộng (`info+…@`, `booking+…@`). Câu Desk báo giống nhau. Còn một chỗ chưa sửa ở `05` 1.5 và một câu mở đầu tự mâu thuẫn (thẻ 03) | BE identity SENT-02, ARC-BA-M18-01, G-BE-A-104-1 |
| 5 | Lúc 00:00–05:59 có nút **Trả phòng ngay** và nút **Trả phòng** không | **Kết quả:** không có **Trả phòng ngay**; **cũng không có nút Trả phòng ở khung đơn**; trang Hôm nay không có hàng của khách đó; nút có từ 06:00. Máy chủ vẫn nhận Trả phòng trong cửa sổ sau nửa đêm, nhưng Desk không có nút nào dẫn tới trang Trả phòng. Chi tiết ở mục 2 | mục 2 |

---

## 2. Chi tiết kiểm (5) – đọc mã trên main

Ví dụ: khách có ngày đi 05/11, báo lúc 04:30 ngày 03/11 (ngày nghiệp vụ là 02/11) rằng rời ngay. Lễ tân làm Trả sớm với **Ngày rời mới** = 03/11, theo đúng cách sổ tay mới hướng dẫn.

1. **Bước Kết quả:** `canCheckOut = leaving === today && allowedActions có check_out` (`EarlyDepartureDialog.tsx` 341–343). Ở đây `today` là ngày nghiệp vụ (02/11), còn `leaving` là 03/11, nên điều kiện sai. Hộp không có **Trả phòng ngay** và hiện câu `early_departure.later_hint`: "Khách trả phòng ngày 03/11 như thường lệ – nút Trả phòng hiện vào ngày đó". **BA đúng ở điểm này.**
2. **Khung đơn:** nút **Trả phòng** chỉ hiện khi `allowedActions` có `check_out` (`ReservationDrawer.tsx` 388). Máy chủ chỉ thêm `check_out` khi `c.today === c.departureDate` (`allowed-actions.ts` 115), và `today` là `ctx.today`, tức ngày nghiệp vụ (`reservations.service.ts` 451). Lúc 04:30 ngày 03/11, ngày nghiệp vụ là 02/11, còn ngày đi là 03/11, nên **không có nút**. Từ 06:00 ngày 03/11 thì nút hiện. Quản lý và chủ đầu tư cũng đi qua đúng luật này (vai lễ tân trở lên), nên cũng không thấy nút.
3. **Trang Hôm nay:** Desk gọi `getArrivalsDepartures` không kèm ngày (`useDashboard.ts` 79), nên máy chủ lấy ngày nghiệp vụ (02/11). `departureRows` chỉ lấy đơn có ngày đi đúng bằng ngày đó (`stay-lists.ts` 83–103). Khách đi 03/11 vì vậy chưa có trong danh sách. Hàm `checkOutAction` của trang này có tính cửa sổ sau nửa đêm (`stay-actions.ts` 43–45), nhưng chỉ có tác dụng khi trang xin danh sách của ngày mai, mà Desk không bao giờ xin.
4. **Máy chủ:** Trả phòng (B18) nhận cửa sổ sau nửa đêm (`checkout.service.ts` 651–661, 680–681, 804–805): ngày nghiệp vụ = ngày đi − 1 và ngày lịch = ngày đi. Trong cửa sổ này không phụ thu và không tính thêm đêm. Trang Trả phòng không tự chặn theo ngày; nếu mở trang thì có câu `checkout.post_midnight`. Nhưng trên Desk không có nút nào mở được trang này trong khoảng 00:00–05:59.
5. **Sau 06:00:** khi làm Trả phòng, ô **Giờ trả phòng thực tế** gửi `checkoutAt`. Giờ 04:30 ngày 03/11 vẫn qua được bước kiểm vì nằm trong cửa sổ sau nửa đêm (`checkout.service.ts` 680–681), và phần phụ thu bằng 0 (dòng 694). Vì vậy làm Trả phòng lúc 06:00 trở đi mà ghi đúng giờ khách đi thì tiền vẫn đúng. **QA nên kiểm điểm này trên staging bằng đồng hồ giả** (DOM chỉ đọc mã, chưa chạy).

Kết luận: trước 06:00, Desk v1.0.4 (và từ v1.0.2) **không cho làm Trả phòng** cho khách rời trong khoảng 00:00–05:59, dù máy chủ đã hỗ trợ. Đây là một lỗi sản phẩm riêng (xem ghi chú cho ORC ở mục 4). Sổ tay phải dạy cách làm với Desk hiện có.

---

## 3. Thẻ feedback

### FB-R4-DOM-BA-PR68-01
- Mức độ: Major (sửa trước khi gộp #68)
- Vị trí: sổ tay 2.14a bước 2, đoạn "Trả sớm lúc 00:00–05:59" (dòng 1199) và `02` 11.5.1 (dòng 923). Hai câu cần sửa: "khách đi luôn thì đóng hộp, mở khung đơn → **Trả phòng**; không thấy nút thì hỏi quản lý…" và "Khách rời đúng ngày đi ghi trên đơn: dùng **Trả phòng** (khung đơn → **Trả phòng**…)".
- Vấn đề: như mục 2. Trước 06:00, khung đơn không có nút **Trả phòng** và trang Hôm nay không có hàng của khách. Lễ tân làm đúng hướng dẫn thì lần nào cũng phải "hỏi quản lý", mà quản lý cũng không có nút. Ca khách rời đúng ngày đi lúc 04:30 cũng bị như vậy.
- Vì sao quan trọng: người trực ca đêm bị kẹt, khách đang đứng chờ ra sân bay. Có hai rủi ro. Một là lễ tân quay lại bấm **Trả sớm** (nút này vẫn có trong khoảng giờ đó, và với khách rời đúng ngày đi thì chỉ chọn được ngày hôm trước), nên hoàn tiền cho đúng đêm khách vừa ở, tức là sai tiền. Hai là gọi chủ đầu tư lúc 4 giờ sáng chỉ để được trả lời "chờ".
- Đề xuất sửa: thay hai câu trên ở cả hai chỗ bằng đoạn sau.
  > Nút **Trả phòng** (khung đơn, trang **Hôm nay**) chỉ hiện **từ 06:00**, cả khi khách rời đúng ngày đi ghi trên đơn. Khách đi trước 06:00: đóng hộp; nhận lại thẻ, rút mã cửa; đếm minibar nếu kịp; báo khách số còn phải thu hoặc số sẽ hoàn (nếu có) như mục 2.14; ghi sổ giao ca "OTM-… khách rời hh:mm, chờ Trả phòng lúc 06:00". **Không** bấm **Trả sớm** lần nữa, không gọi quản lý chỉ vì chưa có nút. **Từ 06:00** (hoặc đầu ca sáng): khung đơn → **Trả phòng**, ở bước Phụ phí ghi **Giờ trả phòng thực tế** đúng giờ khách đi (ví dụ 04:30). Desk không phụ thu, không thêm đêm cho giờ này. Khách rời đúng ngày đi ghi trên đơn: không dùng **Trả sớm**, làm Trả phòng từ 06:00 như trên.

  Với khách báo trước là sẽ đi sớm (ví dụ chuyến bay 06:00), thêm một câu: "Tối hôm trước, trong giờ trực, báo khách số còn phải thu, nhận tiền trước nếu khách đồng ý, rồi làm Trả phòng từ 06:00". Câu này chỉ hợp lệ nếu Desk ghi nhận được khoản đã nhận ở bước Bill lúc 06:00. BA hoặc QA kiểm trước khi viết; không chắc thì bỏ câu này.
- Trạng thái: Closed (BA Fixed @ `7ba1ddf5`; DOM đọc lại 04/11 tối – xem DOM lượt 2)

### FB-R4-DOM-BA-PR68-02
- Mức độ: Minor
- Vị trí: câu "Sửa ở v1.0.5" trong giới hạn "Đang chờ hoàn": sổ tay 2.14a (đoạn "Áp dụng từ v1.0.4" sau Nhánh ngắn ngày), `02` 11.5.2 (dòng 950), `01` 7.3 (dòng 478), và các dòng lịch sử bản 1.13 / 1.11.
- Vấn đề: câu "Sửa ở v1.0.5" đứng ngay sau "cả ở dòng này lẫn ở **Nhật ký tiền → Hoàn tiền**". Người đọc sẽ hiểu là v1.0.5 cho lễ tân thấy yêu cầu chờ duyệt của người khác ở cả hai chỗ. ARC A1/A2 chốt khác, và release notes đã sửa theo thẻ RN-02:
  - v1.0.5 chỉ hiện **tổng số đang chờ hoàn** ở trang Trả phòng và trên folio;
  - tab **Hoàn tiền** giữ phạm vi như hiện nay. Đây là tách nhiệm có chủ ý (BR-522).
- Đề xuất: "v1.0.5: dòng **Đang chờ hoàn** hiện cả số của yêu cầu do người khác tạo (chỉ số tiền). Tab **Hoàn tiền** giữ phạm vi như hiện nay." Sửa cùng câu ở 3 chỗ và ở dòng lịch sử bản.
- Trạng thái: Closed (BA Fixed @ `7ba1ddf5`; DOM đọc lại 04/11 tối – xem DOM lượt 2)

### FB-R4-DOM-BA-PR68-03
- Mức độ: Minor
- Vị trí:
  - `guides/05-sale-ctv.md` dòng 82 (mục 1.5): PR này không sửa tệp này; #63 cũng không sửa câu này;
  - sổ tay 0.3a dòng 122 và `01` 1.6a dòng 125: câu mở đầu in đậm.
- Vấn đề:
  1. `05` vẫn ghi "**Desk chỉ chặn được `info@`**". Từ v1.0.4 câu này sai với sale và CTV.
  2. Ở sổ tay và `01`, câu in đậm "**Desk chỉ chặn được `info@`.**" vẫn đứng đầu, rồi câu ngay sau lại ghi "Từ v1.0.4 Desk chặn cả `booking@`". Người đọc lướt chỉ thấy câu in đậm.
- Đề xuất:
  - Câu in đậm đổi thành "**Tới v1.0.3, Desk chỉ chặn được `info@`.** Từ v1.0.4 chặn cả `booking@` (kể cả `info+…@`, `booking+…@`)."
  - `05` 1.5 sửa cùng câu, kèm "(áp dụng từ v1.0.4)".
  - Ghi thêm vào dòng lịch sử bản của bộ hướng dẫn.
- Trạng thái: Closed (BA Fixed @ `7ba1ddf5`; DOM đọc lại 04/11 tối – xem DOM lượt 2)

### FB-R4-DOM-BA-PR68-04
- Mức độ: Suggestion
- Vị trí: sổ tay 2.14 bước 6 (dòng 1164), `02` 11.1 bước 6 (dòng 834). Câu "…ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền**, dòng của mã đơn."
- Vấn đề: câu đúng sự thật, và ca giới hạn ở câu sau đã chỉ "hỏi quản lý", nên DOM coi điểm (3) là đạt. Nhưng lễ tân không phải người bấm Trả sớm vẫn có thể mở tab này trước rồi mới đọc câu sau.
- Đề xuất: "…ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền** (chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt)." Hoặc đưa câu "người khác bấm Trả sớm… hỏi quản lý" lên trước.
- Trạng thái: Closed (BA Fixed @ `7ba1ddf5`; DOM đọc lại 04/11 tối – xem DOM lượt 2)

### FB-R4-DOM-BA-PR68-05
- Mức độ: Suggestion
- Vị trí: sổ tay 2.14a đoạn "Áp dụng từ v1.0.4" của đơn HĐ; `02` 17.5. Câu "Desk hiện (hoặc không hiện) khung HĐ khác với HĐ giấy: dừng, hỏi quản lý."
- Vấn đề: Desk giữ ngày kết thúc HĐ theo HĐ lúc nhận phòng; **Gia hạn** không dời ngày này. Có một ca hay gặp mà câu an toàn này bắt được nhưng chưa nêu tên: khách **ký lại hoặc gia hạn HĐ bằng HĐ giấy mới**, có ngày kết thúc mới. Khách rời sau ngày kết thúc cũ mà trước ngày kết thúc mới: Desk coi là ở phần gia hạn và không hiện khung HĐ, trong khi theo HĐ giấy mới thì khách đang trả trước hạn.
- Đề xuất: thêm ví dụ vào câu an toàn: "(ví dụ HĐ đã ký lại với ngày kết thúc mới: Desk vẫn giữ ngày kết thúc cũ)".
- Trạng thái: Closed (BA Fixed @ `7ba1ddf5`; DOM đọc lại 04/11 tối – xem DOM lượt 2)

---

## 4. Ghi chú cho ORC

- **Lỗi sản phẩm mới, đề nghị QA ghi thành bug:** Desk không có nút Trả phòng trong cửa sổ sau nửa đêm, dù máy chủ hỗ trợ.
  - Hai chỗ chặn: `Reservation.allowedActions` so `ctx.today` với `departure_date`, không tính cửa sổ (`allowed-actions.ts` 115); trang Hôm nay chỉ xin danh sách của ngày nghiệp vụ.
  - Có từ khi có luật cửa sổ sau nửa đêm (DOM S3-9). Không sai tiền nếu lễ tân làm theo thẻ 01. Mức DOM đề xuất: P3.
  - Đề xuất xếp v1.0.5, cùng việc RN-05: BE thêm cửa sổ vào `allowedActions` như `checkOutAction`, Desk hiện hàng ngày đi trong cửa sổ. ARC và BE xác nhận cách sửa.
- **Đính chính hai thẻ của DOM ở review release notes** (`DOM-on-v104-release-notes.md`, đã sửa trong tệp, mục "DOM lượt 2"):
  - RN-08 **rút**, PO đúng: đơn HĐ nhập tay không có dòng tiền cho phần gia hạn;
  - RN-05 cần thêm "nút Trả phòng chỉ hiện từ 06:00" (Minor, sửa lúc cắt bản).
  - Dòng decision-log đề xuất ở mục 3 của tệp đó đã thêm câu này.
- **Thứ tự gộp:** #68 cắt từ main, chưa có #63, nhưng dòng "Lập: …" và bảng lịch sử bản đã ghi "gộp sau 1.12 / 1.10". Khi gộp sau #63 sẽ xung đột ở các dòng đầu tệp và bảng lịch sử. Đây là việc kỹ thuật, BA rebase; DOM không review phần này.

---

## 5. Điểm làm tốt nên giữ

1. Câu Trả sớm 00:00–05:59 viết đúng luật DOM, có ví dụ số về số ngày báo trước, và nói rõ "áp dụng ngay, giới hạn có từ v1.0.2". Lễ tân không phải chờ v1.0.4.
2. Giới hạn "Đang chờ hoàn" dùng dấu hiệu lễ tân nhìn thấy được ("không thấy dòng, hoặc không chắc") và nói "không hiện ở cả hai chỗ". Bản này đã tốt hơn câu đầu của release notes. `01` 7.3 cho chủ đầu tư biết vì sao lễ tân sẽ hỏi và xem số ở đâu.
3. Phần đơn HĐ đã gia hạn mô tả đúng cái Desk làm: không có dòng tiền cho phần gia hạn, bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ, và có câu an toàn "khác HĐ giấy thì dừng, hỏi quản lý".

## Phản hồi BA (04/11/2026, lượt 2 của PR #68 @ `7ba1ddf5`)

- **FB-R4-DOM-BA-PR68-01 – Fixed.** Đã bỏ câu "mở khung đơn → Trả phòng; không thấy nút thì hỏi quản lý". Sổ tay 2.14a bước 2 và `02` 11.5.1 có gạch mới **Khách đi trước 06:00** theo đoạn DOM đề xuất.
  - Nội dung: nút chỉ hiện từ 06:00, kể cả khi rời đúng ngày đi. Lúc khách đi: thu thẻ, chìa khóa, xóa mã cửa, đếm minibar nếu kịp, báo số còn thu hoặc sẽ hoàn, ghi sổ giao ca. Không bấm Trả sớm lần nữa, không gọi quản lý chỉ vì chưa có nút. Từ 06:00 làm **Trả phòng** và ghi **Giờ trả phòng thực tế** đúng giờ đi.
  - BA đã đọc `checkout.service.ts` (`postMidnight`, `departure`) và `CheckOutPage.tsx` (`checkoutAt = ${departureDate}T${hh:mm}`). Giờ 04:30 của ngày đi được nhận, không phụ thu, không thêm đêm.
  - Thêm một dòng trỏ tới gạch này ở ca đêm (sổ tay 2.20, `02` 13.3).
  - **Không viết** câu "nhận tiền tối hôm trước", vì Desk chỉ thu khi đặt đơn, nhận phòng và trả phòng (`02` 10.1).
- **FB-R4-DOM-BA-PR68-02 – Fixed.** Câu "Sửa ở v1.0.5" thay bằng: "v1.0.5 (chưa có ngày): trang **Trả phòng** và folio hiện **tổng số đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo (chỉ số tiền). Tab **Hoàn tiền** giữ phạm vi như hiện nay." Áp ở sổ tay 2.14a, `02` 11.5.2, `01` 7.3 và dòng lịch sử.
- **FB-R4-DOM-BA-PR68-03 – Fixed.** Câu in đậm đổi thành "**Tới v1.0.3, Desk chỉ chặn được `info@`.** Từ v1.0.4 chặn cả `booking@`…". Sửa ở sổ tay 0.3a, `01` 1.6a, `05` 1.5 (thêm vào PR, `05` lên bản 1.6), và cả `02` 1.6, nơi có cùng câu in đậm.
- **FB-R4-DOM-BA-PR68-04 – Fixed.** Câu v1.0.3 ở sổ tay 2.14 bước 6 và `02` 11.1 bước 6 thêm "(chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt)".
- **FB-R4-DOM-BA-PR68-05 – Fixed.** Câu an toàn ở sổ tay 2.14a và `02` 17.5 thêm "(ví dụ HĐ đã ký lại với ngày kết thúc mới: Desk vẫn giữ ngày kết thúc cũ)".

---

## DOM lượt 2 (04/11 tối) – PR #68 @ `7ba1ddf5`

Bản đọc: `git diff da98e511..7ba1ddf5` (5 tệp). Đối chiếu mã ở cùng head: `CheckOutPage.tsx`, `checkout.service.ts`, `strings-vi.json`.

### Kết quả theo thẻ

| Thẻ | Kết luận | Đã kiểm |
|---|---|---|
| 01 (Major) | **Closed** | Sổ tay 2.14a bước 2 và `02` 11.5.1 bỏ câu ngõ cụt, có gạch **Khách đi trước 06:00** đúng đề xuất. Có thêm câu trỏ ở ca đêm (sổ tay 2.20, `02` 13.3, đúng mục). Đúng với mã: bước 2 của Trả phòng là **Phụ phí**, có ô **Giờ trả phòng thực tế**; `checkoutAt` = ngày đi + giờ gõ; 04:30 của ngày đi rơi vào cửa sổ sau nửa đêm nên không phụ thu, không thêm đêm (`checkout.service.ts` `postMidnight`, `departure`). BA bỏ câu "nhận tiền tối hôm trước": đúng, vì Desk chỉ thu khi đặt đơn, nhận phòng và trả phòng |
| 02 (Minor) | **Closed** | Câu v1.0.5 đúng hướng ARC A1/A2 ở sổ tay 2.14a, `02` 11.5.2, `01` 7.3. Thêm "yêu cầu đã duyệt vẫn thấy" và "không báo khách không có khoản hoàn", khớp release notes #66. Dòng lịch sử bản giữ chữ cũ rồi ghi phần sửa ở câu "Sửa cùng ngày…". Đó là nhật ký thay đổi, chấp nhận |
| 03 (Minor) | **Closed** | Câu in đậm thành "Tới v1.0.3, Desk chỉ chặn được `info@`" ở sổ tay 0.3a, `01` 1.6a, `02` 1.6 và `05` 1.5; `05` lên bản 1.6. Tìm trên toàn `product/docs/manual` không còn câu "chỉ chặn được `info@`" ở thì hiện tại |
| 04 (Suggestion) | **Closed** | Thêm "(chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt)" ở sổ tay 2.14 bước 6 và `02` 11.1 bước 6. Đúng phạm vi ARC A1 |
| 05 (Suggestion) | **Closed** | Có ví dụ HĐ ký lại ở sổ tay 2.14a và `02` 17.5 |

### Thẻ mới

### FB-R4-DOM-BA-PR68-06
- Mức độ: Minor (sửa trước khi cắt bản 06/11 18:00; không chặn gộp; nếu kịp thì sửa luôn trong #68)
- Vị trí: gạch **Khách đi trước 06:00**, ở sổ tay 2.14a bước 2 (dòng 1200) và `02` 11.5.1 (dòng 924).
- Vấn đề: câu này lấy từ đề xuất của DOM ở thẻ 01. DOM tự sửa hai chỗ thiếu.
  1. **Chỉ "báo khách số còn phải thu", không nói thu.** Đơn Trực tiếp đã thu đủ lúc nhận phòng (`02` 10.1), nên lúc 04:30 phần còn lại thường là minibar, phát sinh, hoặc đơn OTA thu tại quầy. Khách đã đi thì lúc 06:00 không còn ai để thu. Lúc 04:30 Desk cũng không tạo được VietQR, vì VietQR chỉ có ở đặt cọc, nhận phòng và trả phòng.
  2. **Desk sẽ đòi ghi chú giờ.** Lúc 06:00 trở đi mà gõ 04:30, giờ này sớm hơn lúc bấm quá `manual_time_tolerance_minutes`. Khi đó Desk bắt buộc ô **Ghi chú giờ trả (vì sao ghi bù)** (`checkout.service.ts` dòng 1601–1605, `stay.time_note_help`). Hướng dẫn chưa nói, nên lễ tân ca sáng có thể tưởng là lỗi.
- Vì sao quan trọng: khách rời trước 06:00 thường đi chuyến bay sớm, và ca đêm chỉ có một người trực. Nếu không thu trước khi khách đi, OTTIMO mất khoản phát sinh, hoặc phải đòi khách qua tin nhắn.
- Đề xuất sửa, ở cả hai chỗ:
  - Thay "báo khách số còn phải thu hoặc số sẽ hoàn (nếu có) như mục 2.14" bằng:
    > xem **Còn phải thu** trên folio, cộng minibar vừa đếm; **thu ngay trước khi khách đi**: tiền mặt (cất két, để riêng) hoặc thẻ qua máy POS (giữ phiếu POS). Khách chỉ chuyển khoản được thì ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý. Báo khách số sẽ hoàn (nếu có) như mục 2.14. Ghi sổ giao ca "OTM-… khách rời hh:mm, đã thu … bằng …, chờ Trả phòng lúc 06:00".
  - Sau "ghi **Giờ trả phòng thực tế** đúng giờ khách đi (ví dụ 04:30)", thêm:
    > Desk hỏi **Ghi chú giờ trả**: ghi "Khách rời 04:30, trả phòng trên Desk lúc 06:xx". Ở bước **Bill & thu tiền**, ghi khoản đã thu lúc khách đi theo đúng cách đã thu: tiền mặt thì nhập số tiền; thẻ thì nhập mã chuẩn chi trên phiếu POS.
- Trạng thái: Closed (BA Fixed @ `1fb521cf`; DOM đọc lại 04/11 khuya – xem DOM lượt 3)

### Kết luận lượt 2

**ĐẠT CÓ ĐIỀU KIỆN. Gộp được** theo thứ tự #65 → #63 → #68.
- Thẻ 01–05: đã đóng hết. Không còn Major.
- Điều kiện: thẻ 06 (Minor), sửa trước khi cắt bản 06/11 18:00.
- Câu 06:00 ở dòng 100 release notes #66 (thẻ RN-05) nên dùng đúng chữ của gạch **Khách đi trước 06:00** sau khi sửa thẻ 06.
- Kiểm trên staging (QA, không chặn gộp): ở bước **Phụ phí**, đặt đồng hồ 06:10 và gõ 04:30. Desk phải nhận, không phụ thu, và đòi **Ghi chú giờ trả**.

## Phản hồi BA (04/11/2026, lượt 3 của PR #68 @ `1fb521cf`)

Nhánh đã gộp `origin/main` (có #63) tại `31588f0d`, không force. Xung đột chỉ ở dòng "Lập:" và bảng phiên bản; đã giữ cả hai mục, mục #68 đứng trước.

### FB-R4-DOM-BA-PR68-06 – Fixed @ `1fb521cf`
- Sửa gạch **Khách đi trước 06:00** ở sổ tay 2.14a bước 2 và `02` 11.5.1, theo đề xuất của DOM:
  - Xem **Còn phải thu** ở khung đơn, cộng minibar vừa đếm.
  - **Thu ngay trước khi khách đi**: tiền mặt (cất két, để riêng) hoặc thẻ qua máy POS (giữ phiếu POS). Thêm câu "Lúc này Desk chưa ghi được khoản thu và chưa có mã VietQR".
  - Khách chỉ chuyển khoản được thì ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý.
  - Dòng sổ giao ca mới: "OTM-… khách rời hh:mm, đã thu … bằng …, chờ Trả phòng lúc 06:00".
- Thêm sau câu **Giờ trả phòng thực tế**:
  - Ở bước **Bill & thu tiền**, ghi khoản đã thu theo đúng cách đã thu: tiền mặt nhập ở **Tiền khách đưa**, thẻ nhập **Mã chuẩn chi trên phiếu POS**.
  - Khi bấm hoàn tất, Desk đưa lại bước **Phụ phí** và bắt buộc ô **Ghi chú giờ trả (vì sao ghi bù)**. Hướng dẫn ghi rõ đây không phải lỗi, kèm câu mẫu "Khách rời 04:30, trả phòng trên Desk lúc 06:xx".
- Đọc mã để xác nhận chỗ hiện ô ghi chú:
  - `CheckOutPage.tsx` chỉ hiện ô này sau khi máy chủ trả `TIME_NOTE_REQUIRED` lúc bấm hoàn tất, rồi đưa về bước 2 và đặt con trỏ vào ô.
  - Ô không hiện sẵn khi vừa gõ giờ, nên hướng dẫn viết theo đúng thứ tự đó.
  - Nhãn lấy đúng chuỗi `checkout.time_note`.
- Một điểm lệch nhỏ so với đề xuất: DOM viết "Desk hỏi Ghi chú giờ trả" ngay sau khi gõ giờ. BA đặt câu này sau bước Bill, vì Desk chỉ hỏi khi bấm hoàn tất.
- Ghi vào lịch sử bản: sổ tay 1.13, `00` 1.11, `02` "Lập:".
- Câu 06:00 ở release notes #66 (RN-05): PO lấy chữ của gạch này khi sửa release notes; BA không sửa tệp đó.

### Thêm theo ORC – đơn Nội bộ cần ở thêm (DOM 04/11 tối, `bug-r4-037-data-impact.md`)
- Áp dụng ngay, viết ở sổ tay 2.5 bước 4 (dòng Nội bộ), 2.12 **Gia hạn** bước 7, bảng 5.6; `02` 5.1, 9.3 bước 7, 17.6.
- Cách làm:
  - Không bấm **Gia hạn**. Tạo đơn Nội bộ mới 0 đ: cùng căn, ngày đến là ngày đi của đơn đang ở, cùng người đứng tên.
  - Ô **Ghi chú nội bộ** (bắt buộc với kênh Nội bộ) ghi "Ở tiếp OTM-… (thay Gia hạn)".
- BA đọc mã để kiểm 2 điểm ORC hỏi:
  - **Căn đang có khách thì có nhận phòng đơn mới ngay được không.**
    - B9 chỉ cho nhận phòng vào đúng ngày đến của đơn mới, tức ngày đi của đơn cũ.
    - Điều kiện `room_ready` cần `VI`/`VC`. Khi đơn cũ còn ở, căn là `OC`/`OD`, nên lễ tân trưởng có thể xác nhận ngoại lệ (`checkin.service.ts` ~354–362, 588). Không thấy chặn nào khác, nên về lý có thể có hai đơn **Đang ở** cùng một căn.
    - Vì vậy sổ tay ghi: **trả phòng đơn cũ trước, rồi mới nhận phòng đơn mới**; không dùng xác nhận ngoại lệ khi đơn cũ còn **Đang ở**.
    - Sau trả phòng, căn là `VD`, nên nhận phòng đơn mới vẫn cần lễ tân trưởng xác nhận "buồng chưa sẵn sàng" (sổ tay 2.10, `02` 7.4).
    - Giấy tờ gắn theo đơn (`checkinDocumentStatus`), nên phải nhập lại giấy tờ người ở.
    - Ở tiếp cùng căn thì không thu thẻ, không xóa mã: kéo dài mã trên app khóa.
    - Trả phòng đơn cũ trước 18:00. Sau 18:00, B18 tính đêm qua `addedNightRate`, dính cùng lỗi. Trước 18:00, phụ thu trả muộn lấy giá đêm của chính đơn, tức 0 đ.
  - **Căn không còn trống từ ngày đi:**
    - Tạo đơn nối tiếp ở căn khác còn trống. Người ở chuyển căn: trả phòng thường (thu thẻ, xóa mã), nhận phòng đơn mới và giao mã căn mới.
    - Chỉ trống một phần các đêm thì đặt các đêm còn trống. Không còn căn nào thì báo quản lý.
  - Đã lỡ gia hạn: không thu tiền người ở, báo quản lý trước khi trả phòng (đúng câu DOM).
- Đề nghị DOM xác nhận:
  - thứ tự "trả phòng đơn cũ rồi nhận phòng đơn mới";
  - việc buồng phòng dọn như căn đang có khách (Desk vẫn tạo việc dọn trả phòng).
- Ngoài phạm vi tài liệu, báo ORC:
  - chưa thấy máy chủ chặn việc nhận phòng đơn thứ hai vào căn có đơn còn **Đang ở**, khi lễ tân trưởng xác nhận ngoại lệ;
  - đề nghị QA thử trên staging, ARC/BE quyết chặn ở v1.0.5.

---

## DOM lượt 3 (04/11 khuya) – PR #68 @ `1fb521cf`

ORC gọi đây là "Lượt 2" của bước Review (đọc lại). Tệp đã có mục "DOM lượt 2" (@ `7ba1ddf5`), nên đặt tên lượt 3 cho khỏi trùng.

- Bản đọc: `git diff 31588f0d..1fb521cf`, 3 tệp, chỉ tài liệu. `31588f0d` là lần gộp main có #63.
- Số dòng tài liệu là số dòng trên nhánh PR. Mã đối chiếu ở `origin/main` @ `c2506a53`, cũng là mã của nhánh:
  - `frontdesk/internal/checkin.service.ts`, `checkout.service.ts`, `stay-support.ts`, `stay.service.ts`;
  - `registration/internal/registration.service.ts`;
  - admin-web `BookingDialog.tsx`, `ReservationDrawer.tsx`, `CheckInPage.tsx`, `CheckOutPage.tsx`, `strings-vi.json`;
  - migration `0013` (chỉ mục `hk_task_clean_uk`).

### Phán quyết #68: **ĐẠT CÓ ĐIỀU KIỆN**

- Thẻ 06: **Closed**.
- Cách làm tạm cho đơn Nội bộ ở thêm: **đúng hướng**. DOM xác nhận thứ tự "trả phòng đơn cũ, rồi nhận phòng đơn mới" và việc dọn "như căn có khách".
- Còn 2 Major phải sửa trước khi gộp (chỉ là chữ, ở 2 tệp):
  - **07**: bước tạo đơn đi qua BUG-R4-037, và Desk không có dòng "Tổng tiền phòng" cho đơn Nội bộ;
  - **08**: mục 2.10 / `02` 7.4 vẫn cho xác nhận ngoại lệ khi căn đang `OD`.
- Thêm 1 Minor (**09**: ghi sai bản sửa và mã lỗi), sửa cùng lần. 1 Suggestion (**10**).
- Nếu ORC cần gộp #68 ngay: 07 và 08 đi một PR nhỏ riêng. Nhưng câu đã sửa phải tới lễ tân **trước** khi ai dùng cách làm tạm Nội bộ, vì cách làm tạm áp dụng ngay trên production. Gửi qua INV như cách làm tạm của BUG-R4-037.

### 1. Thẻ 06 – đọc lại

| Ý | Kết quả | Căn cứ |
|---|---|---|
| Xem **Còn phải thu** ở khung đơn, cộng minibar, thu ngay bằng tiền mặt hoặc thẻ POS; Desk chưa ghi được khoản thu, chưa có VietQR | Đúng | `ReservationDrawer` mục Folio có dòng "Còn phải thu" |
| Lúc 06:00, ở bước **Bill & thu tiền**: tiền mặt nhập ở **Tiền khách đưa**, thẻ nhập **Mã chuẩn chi trên phiếu POS** | Đúng nhãn | `co.cash_received`, `co.pos_code` |
| Bấm hoàn tất (**Đã thu … – hoàn tất** / **Hoàn tất trả phòng**) thì Desk đưa lại bước **Phụ phí** và bắt buộc **Ghi chú giờ trả (vì sao ghi bù)** | Đúng thứ tự. BA sửa đúng chỗ DOM viết lệch | `checkout.service.ts` 1601–1605 (`TIME_NOTE_REQUIRED` khi giờ gõ sớm hơn lúc bấm quá `manual_time_tolerance_minutes`); `CheckOutPage.tsx` 707–718 về bước 2 và đặt con trỏ vào ô; `co.complete_paid`, `checkout.complete`, `checkout.time_note` |
| Khách chỉ chuyển khoản được: ghi sổ giao ca, đầu ca sáng báo quản lý | Đạt | – |

### 2. Cách làm tạm đơn Nội bộ ở thêm – DOM xác nhận (sổ tay 2.12 bước 7, dòng 1129–1136; `02` 9.3 bước 7, dòng 734–741)

Đây là cách khách sạn vẫn làm khi phần mềm không gia hạn được đúng giá: **tách lượt**, tức đóng lượt cũ rồi mở lượt mới liền ngay sau. Từng ý:

| # | Ý của BA | DOM | Căn cứ |
|---|---|---|---|
| 1 | Không bấm **Gia hạn**; tạo đơn Nội bộ mới 0 đ, cùng căn, cùng người, ghi chú "Ở tiếp OTM-…" | **Đúng.** Nhưng bước tạo đơn phải tránh BUG-R4-037 và đổi cách kiểm 0 đ (thẻ 07) | `BookingDialog.tsx` 455–461, 1302 |
| 2 | **Trả phòng đơn cũ trước, rồi mới nhận phòng đơn mới**; không nhận phòng đơn mới khi đơn cũ còn **Đang ở** | **Đúng, xác nhận.** Một căn chỉ nên có một lượt **Đang ở**. Giấy tờ, khai báo và folio đi theo từng đơn | `checkin.service.ts` 551–555 (chỉ nhận phòng vào ngày đến) |
| 3 | Trả phòng đơn cũ **trước 18:00** | **Đúng.** Phụ thu trả muộn = % × giá **đêm cuối của chính đơn** (`surchargeBase` đọc giá đêm cuối của đơn, `stay-support.ts` 376–393). Đơn Nội bộ có đêm cuối 0 đ nên phụ thu là 0. Ân hạn 12:30 không áp, vì đơn mới là khách đến cùng ngày ở cùng căn, nhưng 30 % của 0 vẫn là 0. **Sau 18:00**, Desk coi là thêm 1 đêm, giá lấy từ `addedNightRate` (giá Trực tiếp, `checkout.service.ts` 709–727). Đêm đó đã có đơn mới, nên Desk chuyển sang "phụ thu thay đêm" bằng giá Trực tiếp và cần quản lý xác nhận. BA ghi "cùng lỗi" là đúng. DOM thêm: nên làm **đầu ca sáng, trước 12:00** cho gọn | `stay.service.ts` 719–748 |
| 4 | Căn đang `VD` nên lễ tân trưởng xác nhận "buồng chưa sẵn sàng" | **Đúng, đúng BR-402 (1)**: ngoại lệ dành cho `VD`/`CL`. Sau khi xác nhận, căn thành `OD` và có việc dọn gấp. Thêm: nếu buồng phòng đã dọn xong và căn đã `VC` thì nhận phòng như thường, không cần xác nhận (thẻ 10) | `checkin.service.ts` 864–880 |
| 5 | Nhập lại giấy tờ | **Đúng.** Desk xét giấy tờ theo từng đơn (`checkinDocumentStatus(reservationId)`). Phần khai báo: trên cổng sẽ có 2 lượt liền nhau (đơn cũ đi, đơn mới đến), vẫn đúng thời gian ở thật. Khách nước ngoài: đơn cũ hiện ở tab **Cần cập nhật ngày đi**. DOM chấp nhận cách này cho khoảng 4 ngày tới khi v1.0.4 lên. Nếu INV muốn khai dạng "gia hạn" trên cổng thay cho lượt mới thì hỏi cán bộ quản lý cư trú (**cần xác nhận**, không chặn) | `registration.service.ts` 2970–2998 |
| 6 | Buồng phòng dọn như căn có khách | **Đúng thực tế.** Dọn kiểu ở tiếp, không dọn kiểu trả phòng: không dọn đồ của người ở, thay khăn/ga theo lịch ở tiếp, bổ sung minibar. Desk tạo việc **dọn trả phòng**, xếp ưu tiên "có khách đến hôm nay" (`checkout.service.ts` 1415–1423). Nếu nhận phòng bằng ngoại lệ, Desk tạo thêm một việc **dọn gấp** (`checkin.service.ts` 872–880). Chỉ mục `hk_task_clean_uk` không gộp hai việc này, nên buồng phòng có thể thấy 2 việc cho một lần dọn (thẻ 10) | migration 0013 dòng 294 |
| 7 | Không thu thẻ, không xóa mã; kéo dài mã trên app khóa | **Đúng.** Desk không giữ mã cửa (`checkin.service.ts` dòng 7). Có điểm dễ nhầm: hộp xác nhận **Hoàn tất trả phòng** ghi "… và xóa mã trên app khóa" (`checkout.complete_confirm_body`). Đây chỉ là câu nhắc, nhưng lễ tân có thể làm theo (thẻ 10) | `strings-vi.json` 287 |
| 8 | Căn không còn trống thì chuyển căn; chỉ trống một phần thì đặt các đêm còn trống; không còn căn nào thì báo quản lý | **Đúng** | – |
| 9 | Đã lỡ gia hạn: không thu, báo quản lý | **Đúng** (câu DOM) | – |

Ảnh hưởng chỉ số: tách lượt làm một lượt ở thành hai, nên ALOS và số lượt ở lệch nhẹ. Occupancy không đổi. Chấp nhận được cho khoảng 4 ngày.

### 3. Quy tắc chốt cho BE – BUG-R4-038, sửa ở v1.0.4 (ORC phân xử P0)

DOM chấp nhận phân xử của ORC: mức P0, sửa ở v1.0.4. Đề xuất P2 / v1.0.5 trong tệp BE `bug-r4-037-data-impact.md` mục DOM không còn hiệu lực.

| # | Quy tắc | Ví dụ (oracle cho QA/BE) |
|---|---|---|
| R1 | **Đêm thêm của đơn Nội bộ** (B13 gia hạn, B9a đêm trước, B18 đêm thêm sau 18:00): **mặc định 0 đ**, nguồn `complimentary`. **Không áp sàn–trần** BR-105, **không áp bậc** BR-107. **Cho gõ 0**; gõ 0 cũng là `complimentary`. Xem trước phải bằng lệnh ghi, cùng một hàm (`addedNightRate` thêm nhánh `internal`). `is_complimentary` của đơn giữ nguyên | Đơn Nội bộ 202, gia hạn 2 đêm, không gõ giá → 2 đêm × 0 đ; folio **Còn phải thu** 0. Gõ 0 → được nhận. Gia hạn để tổng thành 8 đêm → không có dòng giảm 10 % |
| R2 | **"Nội bộ có thu"**: lễ tân gõ giá > 0, nguồn `manual`. Làm **giống hệt lúc tạo đơn Nội bộ có gõ giá** (`pricing.service.ts` 276–291: Nội bộ không sàn–trần, cho 0): cùng vai được gõ, không sàn–trần, không bậc. Không thêm bước duyệt; lý do nằm sẵn ở **Ghi chú nội bộ** của đơn, nhật ký tiền ghi giá. Báo cáo đọc đêm này theo giá đã ghi, như đơn Nội bộ tạo có gõ giá; bản sửa này không đổi quy ước Q-05 | Gõ 300.000 cho 1 đêm gia hạn → 300.000, `manual` |
| R3 | **Phụ thu trả muộn B18 (BR-412)** và nhận sớm (BR-411) của đơn Nội bộ: giữ công thức **% × giá đêm cuối (đêm đầu) của chính đơn**, như `surchargeBase` đang làm. Đêm đó 0 đ → phụ thu 0, **không ghi dòng** (theo DOM S3-12, chỉ ghi khi > 0), không cần FOC. Đêm đó > 0 ("có thu") → % × giá đêm đó. **Không** lấy giá Trực tiếp làm gốc (chỉ OTA dùng giá Trực tiếp, BR-415). BE kiểm thêm: `stay-support.ts` 392 trả về giá Trực tiếp khi không tìm thấy dòng `stay_night`; với đơn Nội bộ phải trả 0 | Nội bộ đêm cuối 0 đ, trả 15:00, căn có khách đến → **0 đ**. Nội bộ có thu, đêm cuối 300.000: trả 15:00 → 30 % = **90.000**; trả 17:00 → 50 % = **150.000** |
| R4 | **Sau 18:00 (BR-416)**: căn còn trống đêm đó → thêm đêm theo R1 (0 đ). Căn không bán được đêm đó → "phụ thu thay đêm" = giá mặc định của đêm thêm theo R1, tức **0 đ**, không ghi dòng. Bước quản lý xác nhận (vì căn có khách đến) giữ hay bỏ khi số tiền là 0 thì ARC chọn; DOM chấp nhận cả hai | Nội bộ, trả 19:00, căn trống → đêm thêm 0 đ; căn đã có đơn → 0 đ |
| R5 | **Gỡ dữ liệu đơn đã dính** (Q5): phải có đường đưa đêm Nội bộ về 0 đ, vì hiện A31 chặn 0. Tối thiểu, đơn **đang ở** phải gỡ được để người đã lỡ gia hạn trả phòng được. DOM đề xuất: A31 cho đơn Nội bộ nhận 0, vai quản lý trở lên, bắt buộc lý do. Chọn cách nào là quyền ARC (tệp BE mục 3.2 có phương án B) | – |

### 4. Rủi ro BA nêu – nhận phòng đơn thứ hai vào căn còn đơn **Đang ở**

**Kết luận: đây là lỗi**, vì làm trái **BR-402 (1)**. BR-402 (1) chỉ cho lễ tân trưởng trở lên nhận phòng ngoại lệ khi buồng `VD`/`CL`. `OC`/`OD` là căn **đang có khách**.

- **Mức DOM đề xuất: P1.** Theo `test-strategy.md` mục 8, đây là luồng chính sai quy tắc nghiệp vụ, không trực tiếp sai tiền. QA chốt mức.
- **Nên chặn ở máy chủ ngay trong v1.0.4.** Sửa sổ tay là cần (thẻ 08), nhưng **không đủ**.

**Mã hiện tại:**
- `checkin.service.ts` 354–362: `room_ready` được đánh dấu "lễ tân trưởng trở lên xác nhận được" với **mọi** trạng thái khác `VI`/`VC`/`OOO`, kể cả `OC`, `OD`.
- Dòng 588–606: xác nhận ngoại lệ hoặc duyệt đều bỏ qua điều kiện này.
- Không có chỗ nào kiểm "căn còn đơn **Đang ở**". `vacantPreviousNight` (dòng 493–502) chỉ dùng để tính phí nhận sớm.
- Desk còn mời người dùng xác nhận. Câu `checkin.room_not_ready_lead` ghi: Căn 202 đang "Có khách, sạch" – chưa sẵn sàng. **Bạn xác nhận ngoại lệ được** (câu này giống hệt câu cho căn `VD`).

**Vì sao không chỉ là chuyện của cách làm tạm Nội bộ:**
- Ca hay gặp nhất ở OTTIMO: khách đi xe đêm tới Đà Lạt lúc 05:00–06:30, trong khi khách cũ của căn đi hôm nay và còn đang ngủ (`OC`).
  - Trước 06:00, B9a không mở được, vì đêm trước căn còn có khách.
  - Từ 06:00, luồng nhận phòng thường mở, và Desk cho lễ tân trưởng xác nhận ngoại lệ.
- Lễ tân trưởng đang vội có thể xác nhận như với một căn `VD`. Khi đó khách mới nhận mã cửa và vào **căn đang có người ngủ**. Đây là sự cố an ninh và riêng tư rất nặng với khách sạn: khiếu nại, có thể mất đồ, đánh giá xấu trên OTA.
- Sau đó dữ liệu cũng sai:
  - căn có 2 lượt **Đang ở**;
  - khi khách cũ trả phòng, B18 đặt căn về `VD` (`checkout.service.ts` 1399–1407) trong khi khách mới đang ở trong căn; buồng phòng thấy "Trống, cần dọn" và vào dọn.
- Lối duyệt từ xa (lễ tân gửi, lễ tân trưởng duyệt) còn dễ sót hơn, vì người duyệt không đứng ở quầy.
- Sổ tay mục 2.10 (dòng 1053) và `02` 7.4 (dòng 602) hiện còn **ghi `OD` vào danh sách được xác nhận ngoại lệ**, tức đang dạy sai (thẻ 08).

**Đề xuất sửa (ARC chốt, BE-A làm, QA thử):**
- Tối thiểu cho v1.0.4: `room_ready` chỉ có `overridableBy` khi trạng thái là `VD` hoặc `CL` (đúng chữ BR-402 (1)), cả lúc xem trước lẫn lúc ghi (dòng 359–361 và 588).
  - `OC`/`OD` xử lý như `OOO`: không có ngoại lệ.
  - Desk hiện một câu riêng (UXD viết), ví dụ: "Căn 202 đang có khách. Trả phòng đơn đang ở trước, hoặc gán căn khác."
  - Khoảng 2 dòng ở máy chủ, 1 chuỗi chữ, 1 nhánh FE, kèm test BE và FE.
- Nên thêm (ARC chọn): chặn khi căn còn đơn **Đang ở** có ngày đi là hôm nay, không phụ thuộc trạng thái buồng. Dùng lại câu truy vấn của `vacantPreviousNight` với `status = 'in_house'`. Cách này đề phòng trạng thái buồng bị sửa tay.
- Mọi ca hợp lệ vẫn có lối đi khi chặn: khách cũ đã đi thì **Trả phòng** đơn cũ trước; trạng thái buồng sai thì buồng phòng sửa trạng thái; khách đến sớm thì giữ hành lý, mời chờ hoặc gán căn khác.
- Nếu ARC/ORC thấy không kịp bản cắt 06/11 18:00: một lỗi P1 còn mở khi qua QC thì cần ORC phân xử, và theo protocol mục 8 phải có ESC. Từ giờ tới khi chặn được, dùng câu của thẻ 08.
- **QA:** ghi lỗi mới (QA cấp số). Thử trên stack local: đơn A **Đang ở** căn 202, đi hôm nay; đơn B đến hôm nay, cùng căn; lễ tân trưởng xác nhận ngoại lệ → hiện tại nhận phòng được (kỳ vọng: bị chặn).

### 5. Thẻ mới

### FB-R4-DOM-BA-PR68-07
- Mức độ: **Major** (sửa trước khi gộp #68, hoặc PR riêng như ở Phán quyết)
- Vị trí: sổ tay 2.12 bước 7, gạch **Tạo đơn nối tiếp** (dòng 1130); `02` 9.3 bước 7 (dòng 735). Câu cần sửa: "Kiểm **Tổng tiền phòng** là 0 đ rồi **Tạo đơn**".
- Vấn đề:
  1. Với kênh Nội bộ, hộp Đặt phòng mới **không có** bảng "Tổng tiền phòng". Bảng này chỉ hiện với Trực tiếp/CTV (`BookingDialog.tsx` 1302: `directLike && calc`). Lễ tân không kiểm được theo câu này.
  2. Cách vào tự nhiên nhất là bấm ô trống của chính căn đó vào ngày đi trên **Sơ đồ phòng**. Desk mở hộp với kênh Trực tiếp và điền sẵn giá. Lễ tân chuyển sang **Nội bộ** thì các ô **Giá mỗi đêm** vẫn giữ số. Nếu mọi ô có số, Desk gửi các số đó làm giá đơn (`BookingDialog.tsx` 455–461). Đây đúng là **BUG-R4-037**, đang có trên production. Kết quả: "đơn Nội bộ 0 đ" bị ghi giá Trực tiếp, tức cách làm tạm của lỗi 038 lại rơi vào lỗi 037.
- Vì sao quan trọng: đây là sai tiền. Desk có chặn lúc nhận phòng (điều kiện "đã thu đủ"), nhưng lễ tân sẽ bị kẹt ở quầy, và đơn sai không đưa về 0 được (A31 chặn 0).
- Đề xuất sửa, ở cả hai chỗ, thay câu trên bằng:
  > Chọn kênh **Nội bộ**, rồi **xóa trống mọi ô Giá mỗi đêm** ngay trước khi bấm **Tạo đơn** (không gõ 0 – Desk báo lỗi). Tạo xong, mở khung đơn: mục **Folio** phải ghi **Tiền phòng (… đêm) 0** và **Còn phải thu 0**. Khác 0: **Hủy đơn** vừa tạo (chưa nhận phòng, chưa thu tiền), tạo lại theo đúng cách trên.

  Câu này khớp cách làm tạm của BUG-R4-037 đã gửi INV ngày 04/11, và mã FE đã kiểm: ô trống thì không gửi giá (`BookingDialog.tsx` 455–461), gõ 0 thì bị chặn (430–433).
- Trạng thái: Closed (BA Fixed @ `ba841ea2`; DOM đọc lại 04/11 – xem DOM lượt 4)

### FB-R4-DOM-BA-PR68-08
- Mức độ: **Major** (an ninh khách; sửa cùng #68 hoặc PR riêng như trên)
- Vị trí: sổ tay 2.10, gạch **Căn chưa sẵn sàng** (dòng 1053); `02` 7.4 (dòng 602). Câu hiện tại: "đang `VD`, `CL`, `OD` … Lễ tân trưởng tự xác nhận ngoại lệ được". Câu này có từ trước #68 và đang ở `main`.
- Vấn đề:
  - `OD` là căn **có khách**, cần dọn. BR-402 (1) chỉ cho ngoại lệ với `VD`/`CL`.
  - Câu này mâu thuẫn với câu mới của #68 ("Không nhận phòng đơn mới khi đơn cũ còn **Đang ở**, kể cả bằng xác nhận ngoại lệ"), và dạy đúng thao tác gây ra rủi ro ở mục 4.
  - Desk v1.0.3 không chặn thao tác này.
- Đề xuất sửa:
  > **Căn chưa sẵn sàng** (đang `VD`, `CL`): lễ tân **Gửi lễ tân trưởng xác nhận** kèm **Lý do**… (giữ phần còn lại). **Căn đang có khách** (`OC`, `OD` – đơn trước chưa trả phòng): **không** xác nhận ngoại lệ, kể cả lễ tân trưởng, dù Desk cho bấm. Khách cũ đã đi thì **Trả phòng** đơn cũ trước. Khách cũ còn ở thì giữ hành lý, mời khách mới chờ, hoặc **Đổi căn / đổi ngày** sang căn trống (sổ tay mục 2.8, `02` mục 6.1). Căn đang khóa sửa chữa (`OOO`)…

  Khi máy chủ chặn (mục 4), bỏ phần "dù Desk cho bấm".
- Trạng thái: Closed (BA Fixed @ `ba841ea2`; DOM đọc lại 04/11 – xem DOM lượt 4)

### FB-R4-DOM-BA-PR68-09
- Mức độ: Minor (sửa cùng lần với 07)
- Vị trí:
  - "sửa ở v1.0.5" ở sổ tay 2.5 bước 4 (dòng 852), 2.12 bước 7 (dòng 1129) và bảng 5.6 (dòng 1936); `02` 5.1 (dòng 337), 9.3 bước 7 (dòng 734) và 17.6 (dòng 1591);
  - dòng lịch sử bản: "BUG-R4-037 mục 1.8; lỗi P2 sửa ở v1.0.5" (sổ tay dòng 1953, `00` 1.11, `02` "Lập:").
- Vấn đề: ORC đã phân xử ngày 04/11: lỗi này là **BUG-R4-038, P0, sửa trong v1.0.4**. Sổ tay phát hành cùng v1.0.4 mà ghi "tới khi sửa ở v1.0.5", nên sau 08/11 lễ tân vẫn làm cách tạm nặng nề (nhập lại giấy tờ, khai báo hai lượt), dù không còn cần.
- Đề xuất:
  - "áp dụng ngay, **tới khi chủ đầu tư báo v1.0.4 đã lên**";
  - thêm câu: "Từ v1.0.4: bấm **Gia hạn** như đơn khác; Desk ghi đêm thêm của đơn Nội bộ 0 đ (gõ giá > 0 nếu có thu)";
  - lịch sử bản ghi "BUG-R4-038 (P0), sửa ở v1.0.4".

  Nếu bản sửa 038 bị dời khỏi v1.0.4, PO báo trong release notes và BA trả lại chữ cũ.
- Trạng thái: Closed (BA Fixed @ `ba841ea2`; DOM đọc lại 04/11 – xem DOM lượt 4)

### FB-R4-DOM-BA-PR68-10
- Mức độ: Suggestion
- Vị trí: sổ tay 2.12 bước 7, các gạch "Trả phòng đơn cũ…" và "Nhận phòng đơn mới"; `02` 9.3 bước 7.
- Đề xuất thêm 3 câu ngắn:
  - (a) "Hộp **Hoàn tất trả phòng** có câu 'xóa mã trên app khóa': khi ở tiếp cùng căn thì **không** xóa."
  - (b) "Buồng phòng có thể thấy 2 việc dọn cho căn này (dọn trả phòng, dọn gấp): dọn **một lần** như căn có khách, rồi bấm xong cả hai. Nếu buồng phòng dọn xong (căn **Sạch**) trước lúc nhận phòng đơn mới thì nhận phòng như thường, không cần lễ tân trưởng."
  - (c) "Người ở vắng lúc trả phòng đơn cũ: vẫn trả phòng đơn cũ buổi sáng; nhận phòng đơn mới khi người ở về với giấy tờ, trong ngày, và ghi sổ giao ca trong khoảng giữa."
- Trạng thái: Closed (BA Fixed @ `ba841ea2`; DOM đọc lại 04/11 – xem DOM lượt 4)

### 6. Xác nhận cho ARC – BR-703-01 (#67)

**Đúng.** BR-703-01 chỉ yêu cầu chọn sẵn tủ của căn cũ, không bắt đếm theo thứ tự. Lễ tân được đếm tủ căn đang ở trước. Đã tự đổi tủ và gõ số thì Desk **không** được tự quay về tủ cũ, cũng không được bỏ số đã gõ. Không mất tiền, vì B18 vẫn chặn cho tới khi mọi tủ của lượt ở đã đếm (`minibar_not_checked`).

### 7. Việc thêm của ORC – `ota_base_rate` (guide B6)

**7.1 Đọc mã: chưa có dòng thì chủ đầu tư có tự thêm trên Desk được không?** **Không.** Dòng này cũng **không được cài sẵn** trên production.

| Điểm | Mã |
|---|---|
| Khóa có trong danh mục tham số nhưng **không có giá trị mặc định** | migration `0018_…` dòng 22: `ota_base_rate`, `default_value` = NULL, vai sửa owner/manager |
| Lần cài production đầu tiên **cố ý không ghi** khóa này: "INV nhập trên app" | `admin/production-defaults.ts` dòng 15–17 và `INV_ENTERS_KEYS` dòng 176–180; `production-bootstrap.ts` 122–126 báo lỗi nếu ai thêm vào danh sách cài sẵn |
| Màn **Tham số quy tắc** chỉ liệt kê khóa **đã có giá trị** hoặc **có mặc định** | `parameters.service.ts` 138–146 (`WHERE c.key IS NOT NULL OR d.default_value IS NOT NULL`). Lịch sử của khóa chưa có giá trị trả 404 (dòng 188) |
| Desk chỉ có nút **Sửa** ở dòng đã hiện; không có nút thêm; không màn nào khác ghi khóa này | `ParamsPage.tsx`; tìm `ota_base_rate` trong `apps/admin-web/src` không thấy kết quả. Chỉ tài khoản nhận VietQR có màn riêng |
| Khi chưa có dòng, chỉ một đường bị lỗi: **đơn OTA để trống giá** (cũng như báo giá kênh OTA để trống giá) → 422 `nightlyRates REQUIRED`. Sàn–trần và các chỗ khác tự lấy giá niêm yết của căn | `pricing.service.ts` 186–192 (thiếu thì `{}`), 245–253 (sàn–trần lấy giá niêm yết), 321–327 (422); `move-planner.ts` 287, `stay-night-pricing.ts` 153, `stay-support.ts` 355 đều lấy giá niêm yết khi thiếu |

Hệ quả:
- `infra/server/README.md` dòng 222 và `b2-runbook.md` dòng 144 dặn "INV nhập `ota_base_rate` trên app". Việc này **không làm được** nếu production chưa có dòng.
- Hiện nay lỗi bị che: Desk điền giá Trực tiếp vào ô OTA (BUG-R4-037), nên đơn OTA không bao giờ gửi trống. Sau #70, ô OTA mặc định trống, nên sẽ gặp 422.
- Cách làm tạm 037 đã gửi lễ tân có câu "OTA: gõ đủ mọi đêm **hoặc để trống hết**". Nếu production chưa có dòng, "để trống hết" cũng ra 422. Câu an toàn: "**gõ đủ giá mọi đêm theo xác nhận của OTA**".
- Không sai tiền: Desk chặn chứ không ghi số sai. Lễ tân gõ giá theo xác nhận OTA là đúng nghiệp vụ (BR-112).

**Đề xuất cho ARC/ORC**, nếu INV kiểm thấy không có dòng:
- (A) **DOM chọn.** BE cho nhánh 321–327 lấy **giá đêm niêm yết của căn** khi thiếu `ota_base_rate`, như sàn–trần đã làm.
  - Đúng BR-103 "một mức giá mọi kênh" (INV 01/11), và là một phần của H6 (gỡ `ota_base_rate`, kế hoạch v1.1).
  - Vài dòng, đi cùng #70 trong v1.0.4. ARC xác nhận.
- (B) Thêm lối "Chưa cài" trên màn Tham số. Không nên, vì khóa này sẽ bị gỡ ở v1.1.
- (C) Không sửa mã; lễ tân luôn gõ đủ giá đơn OTA. Được, nhưng dễ vấp lúc đông khách.

**7.2 Đã sửa guide B6** (`rounds/round-04/outputs/DOM/inv-price-switch-guide.md`, chưa commit):
- Bỏ câu "Không thấy dòng này thì bỏ qua – Desk tự lấy giá đêm của căn". Thay bằng câu nói dòng này để làm gì.
- Cách xem: tab **Khác**, Cmd/Ctrl + F gõ `ota_base_rate`. Dòng chỉ có tên in đậm `ota_base_rate`, không có tên tiếng Việt (`paramLabel` trả mã khóa khi không có nhãn). Cột giá trị hiện chuỗi `{…}`.
- Ba nhánh: có dòng số cũ thì sửa; có dòng đúng thì thôi; **không thấy thì không bỏ qua**, chụp màn hình gửi đội, và tới khi cài xong thì đơn OTA gõ đủ giá mọi đêm.
- Sửa dòng "Tự kiểm phần B" theo, và ghi chú sửa 04/11 ở đầu tệp.

**7.3 Tin ORC gửi INV** (dán nguyên văn):

> 1. Anh/chị kiểm giúp một dòng trên Desk (2 phút, máy tính, tài khoản chủ đầu tư): **Quản trị → Tham số quy tắc → tab Khác**, bấm Cmd + F (Windows: Ctrl + F) và gõ `ota_base_rate`.
> 2. Thấy dòng và cột giá trị là `{"L12":800000,"N":1300000,"NPLUS":1100000}`: đã đúng, nhắn đội "ota_base_rate có, đúng".
> 3. Thấy dòng mà số khác: bấm **Sửa**, dán đúng chuỗi trên, **Hiệu lực từ** để nguyên, **Lý do** `Bảng giá 01/11/2026`, bấm **Lưu thay đổi**, rồi nhắn đội.
> 4. Không thấy dòng: Desk chưa có chỗ thêm, anh/chị không cần làm gì thêm trên Desk; chụp màn hình gửi đội. Trong lúc chờ, lễ tân tạo đơn OTA phải gõ đủ giá mọi đêm theo xác nhận của OTA, không để trống.

### 8. Ghi chú cho ORC

- **Dòng decision-log đề xuất (DOM tự quyết, quyền nghiệp vụ):**
  - "BUG-R4-038: đêm thêm đơn Nội bộ (B13/B9a/B18) mặc định 0 đ `complimentary`, không sàn–trần, không bậc, cho gõ 0; có thu thì gõ > 0 `manual`, như lúc tạo đơn; phụ thu trả muộn/nhận sớm = % × giá đêm của chính đơn (0 → 0, không ghi dòng); sau 18:00 không bán được đêm → 0 đ. DOM 04/11."
  - "BR-402 (1): ngoại lệ nhận phòng chỉ cho `VD`/`CL`; `OC`/`OD` không có ngoại lệ – mã hiện cho mọi trạng thái trừ `OOO` là lỗi (DOM đề xuất P1, chặn ở v1.0.4)."
  - ORC ghi giúp, vì `decision-log.md` đang có thay đổi chưa commit của ORC.
- **DOM sẽ cập nhật `business-rules.md`** khi ORC đồng ý: BR-421 thêm nhánh Nội bộ (R1–R4), BR-402 ghi rõ `OC`/`OD`.
- **Cách làm tạm của BUG-R4-037 cho OTA**: đổi "gõ đủ mọi đêm hoặc để trống hết" thành "gõ đủ mọi đêm theo xác nhận OTA" cho tới khi biết production có `ota_base_rate` (mục 7).

### Kết luận lượt 3

**ĐẠT CÓ ĐIỀU KIỆN.**
- Thẻ 06: Closed.
- Gộp #68 sau khi sửa **07** và **08** (Major, chỉ chữ). **09** sửa cùng lần. **10** tùy BA.
- Không có ESC mới từ DOM. Nếu chặn `OC`/`OD` không kịp v1.0.4, ORC phân xử P1 và có thể cần ESC (mục 4).

## Phản hồi BA (04/11/2026, lượt 4 của PR #68 @ `ba841ea2`)

Chỉ sửa tài liệu. Đã push thường; nhánh #69 đã gộp lại bản này (`b9e40a04`).

### FB-R4-DOM-BA-PR68-07 – Fixed
- Sổ tay 2.12 bước 7 và `02` 9.3 bước 7, gạch **Tạo đơn nối tiếp**: bỏ câu "Kiểm **Tổng tiền phòng** là 0 đ". Thay bằng câu DOM đề xuất:
  - ngay trước khi bấm **Tạo đơn**, **xóa trống mọi ô Giá mỗi đêm** (không gõ 0 – Desk báo lỗi);
  - giải thích ngắn: mở hộp từ **Sơ đồ phòng** thì Desk điền sẵn giá Trực tiếp, chuyển sang **Nội bộ** vẫn giữ số (BUG-R4-037);
  - tạo xong, mở khung đơn, mục **Folio** phải ghi **Tiền phòng (… đêm) 0** và **Còn phải thu 0** (nhãn `drawer.folio.room`, `drawer.folio.balance`);
  - khác 0 thì **Hủy đơn** vừa tạo và tạo lại.
- Đã đối chiếu `BookingDialog.tsx`:
  - đơn Nội bộ chỉ gửi giá khi **mọi** ô có số (455–461);
  - ô có số ≤ 0 bị chặn (430–433).
  - Xóa trống mọi ô là cách chắc chắn nhất.

### FB-R4-DOM-BA-PR68-08 – Fixed
- Sổ tay 2.10 và `02` 7.4, gạch **Căn chưa sẵn sàng**:
  - chỉ còn `VD`, `CL`;
  - thêm câu cho **căn đang có khách** (`OC`, `OD`) theo đúng chữ DOM, kèm "dù Desk hiện vẫn cho bấm (Desk chặn từ v1.0.4)", vì ORC đã quyết chặn ở máy chủ trong v1.0.4;
  - lối khác: **Trả phòng** đơn cũ trước, giữ hành lý và mời chờ, hoặc **Đổi căn / đổi ngày** (sổ tay 2.8, `02` 6.1).
- Sửa thêm 2 chỗ cùng ý mà DOM chưa nêu:
  - `02` 16.2 (Không được làm): "Không bao giờ nhận khách vào căn đang có khách (`OC`, `OD`) hoặc căn `OOO`". Trước đây câu này liệt kê `OD` vào nhóm được xác nhận.
  - Bảng **Cần duyệt** ở sổ tay 1.8 và `01` mục 4: "Nhận phòng khi buồng chưa sẵn sàng (chỉ căn `VD`, `CL`; căn có khách `OC`, `OD`: từ chối)". Lý do: lối duyệt từ xa dễ sót hơn, như DOM nêu ở mục 4.
- Khi máy chủ đã chặn, PR gỡ "dù Desk hiện vẫn cho bấm" sẽ đi cùng lượt dọn sau v1.0.4.

### FB-R4-DOM-BA-PR68-09 – Fixed
- "sửa ở v1.0.5" đổi thành "áp dụng ngay, tới khi chủ đầu tư báo v1.0.4 đã lên" và "BUG-R4-038, sửa ở v1.0.4". Đã sửa ở sổ tay 2.5, 2.12 bước 7, bảng 5.6 và `02` 5.1, 9.3 bước 7, 17.6.
- Thêm câu "**Từ v1.0.4:** bấm **Gia hạn** như đơn khác; Desk ghi đêm thêm của đơn Nội bộ 0 đ (gõ giá > 0 nếu có thu)".
- Lịch sử bản ghi "BUG-R4-038, P0, sửa ở v1.0.4" (sổ tay 1.13, `00` 1.11).
- Nếu bản sửa 038 bị dời khỏi v1.0.4, BA trả lại chữ cũ khi PO báo.

### FB-R4-DOM-BA-PR68-10 – Fixed (làm cả 3 ý)
- (a) Câu "xóa mã trên app khóa" ở hộp **Hoàn tất trả phòng**: ở tiếp cùng căn thì không xóa.
- (b) Có 2 việc dọn: dọn một lần như căn có khách, rồi bấm xong cả hai. Căn đã `VC`/`VI` thì nhận phòng như thường, không cần lễ tân trưởng. BA dùng mã trạng thái thay cho chữ "Sạch" để khớp dòng **Buồng sẵn sàng (VI hoặc VC)**.
- (c) Người ở vắng lúc trả phòng đơn cũ: trả phòng buổi sáng, nhận phòng đơn mới khi người ở về với giấy tờ, trong ngày, ghi sổ giao ca.
- Thêm "nên làm đầu ca sáng, trước 12:00" theo mục 2 ý 3.

### Cách làm tạm BUG-R4-037 cho đơn OTA (ORC)
- Sổ tay và bộ hướng dẫn không có chữ "hoặc để trống hết". Câu đó chỉ có trong tin đã gửi INV.
- Đã sửa sổ tay 2.6 bước 4 và `02` 5.3 bước 4 thành: "**Gõ đủ giá mọi đêm theo xác nhận của OTA** (extranet), kể cả khi ô đã có sẵn số; không để trống ô nào".
- Tin đã gửi INV do ORC sửa, theo mục 7.3 của DOM.

---

## DOM lượt 4 (04/11 khuya) – PR #68 @ `ba841ea2`

Bản đọc: `git diff 1fb521cf..ba841ea2`, gồm 4 tệp, chỉ tài liệu: sổ tay, `00`, `01`, `02`. Số dòng ghi theo nhánh PR.

| Thẻ | Kết luận | Đã kiểm |
|---|---|---|
| 07 (Major) | **Closed** | Sổ tay 2.12 bước 7 (dòng 1130) và `02` 9.3 bước 7 đã bỏ câu "Kiểm Tổng tiền phòng". Thay bằng: xóa trống mọi ô **Giá mỗi đêm** ngay trước khi bấm **Tạo đơn**, không gõ 0; vì sao Desk giữ giá Trực tiếp (BUG-R4-037); kiểm **Folio**: **Tiền phòng (… đêm) 0**, **Còn phải thu 0**; khác 0 thì hủy rồi tạo lại. Nhãn khớp `drawer.folio.room` và `drawer.folio.balance` |
| 08 (Major) | **Closed** | Sổ tay 2.10 (dòng 1053) và `02` 7.4 (dòng 602) chỉ còn `VD`, `CL`. Có câu cho **căn đang có khách** (`OC`, `OD`): không xác nhận ngoại lệ, kể cả lễ tân trưởng, "Desk chặn từ v1.0.4". Có các lối khác: trả phòng đơn cũ, mời chờ, **Đổi căn / đổi ngày** (sổ tay 2.8, `02` 6.1, mục trỏ đúng). BA sửa thêm hai chỗ, DOM đồng ý cả hai: `02` 16.2 (dòng 1467) và bảng **Cần duyệt** (sổ tay 1.8 dòng 526, `01` mục 4) ghi "căn có khách `OC`, `OD`: từ chối". Như vậy lối duyệt từ xa cũng được nhắc. Đã tìm trên cả bộ sổ tay: không còn câu nào xếp `OD` vào nhóm được xác nhận. Khớp BR-402 v0.5.3 |
| 09 (Minor) | **Closed** | Sổ tay 2.5, 2.12 bước 7, 5.6 và `02` 5.1, 9.3 bước 7, 17.6 ghi "tới khi chủ đầu tư báo v1.0.4 đã lên" và "BUG-R4-038, sửa ở v1.0.4". Có câu **Từ v1.0.4: bấm Gia hạn như đơn khác; Desk ghi 0 đ (gõ > 0 nếu có thu)**, khớp BR-421 v0.5.3 (a)–(b). Lịch sử bản ghi đúng "BUG-R4-038, P0". Còn một câu "sửa ở v1.0.5" ở 2.14a (dòng 1246), nhưng câu đó nói về Trả sớm 00:00–05:59 (BUG-R4-036, v1.0.5), nên đúng |
| 10 (Suggestion) | **Closed** | Có đủ 3 ý: không xóa mã khi ở tiếp; 2 việc dọn thì dọn một lần rồi bấm xong cả hai; căn `VC`/`VI` thì nhận phòng như thường; người ở vắng thì xử lý như đã nêu. Có thêm "đầu ca sáng, trước 12:00". Dùng mã trạng thái thay cho chữ "Sạch" là hợp lý |
| Đơn OTA (ORC) | **Đạt** | Sổ tay 2.6 bước 4 và `02` 5.3 bước 4: "Gõ đủ giá mọi đêm theo xác nhận của OTA (extranet), kể cả khi ô đã có sẵn số; không để trống ô nào". Câu này đúng cả lúc production thiếu `ota_base_rate` (mục 7.1) lẫn lúc ô còn giá Trực tiếp do BUG-R4-037. Đúng BR-112 (đơn OTA ghi đúng tiền OTA thu) |

**Không có thẻ mới.**

Việc dọn sau khi v1.0.4 lên. Không chặn gộp; BA đã ghi kế hoạch:
- bỏ gạch 2.12 bước 7 và `02` 9.3 bước 7, chỉ giữ câu "Từ v1.0.4";
- bỏ "dù Desk hiện vẫn cho bấm" ở 2.10 và `02` 7.4, sau khi QA xác nhận máy chủ đã chặn (BUG-R4-039);
- khi biết production đã có `ota_base_rate` (hoặc BE đã cho dùng giá niêm yết khi thiếu dòng này), xem lại câu "không để trống ô nào" ở 2.6.

### Kết luận lượt 4

**ĐẠT.** Thẻ 01–10 đã đóng hết; không còn Blocker hay Major mở. ORC gộp #68 được.
