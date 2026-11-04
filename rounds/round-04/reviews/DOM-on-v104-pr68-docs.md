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
- Trạng thái: Open

### FB-R4-DOM-BA-PR68-02
- Mức độ: Minor
- Vị trí: câu "Sửa ở v1.0.5" trong giới hạn "Đang chờ hoàn": sổ tay 2.14a (đoạn "Áp dụng từ v1.0.4" sau Nhánh ngắn ngày), `02` 11.5.2 (dòng 950), `01` 7.3 (dòng 478), và các dòng lịch sử bản 1.13 / 1.11.
- Vấn đề: câu "Sửa ở v1.0.5" đứng ngay sau "cả ở dòng này lẫn ở **Nhật ký tiền → Hoàn tiền**". Người đọc sẽ hiểu là v1.0.5 cho lễ tân thấy yêu cầu chờ duyệt của người khác ở cả hai chỗ. ARC A1/A2 chốt khác, và release notes đã sửa theo thẻ RN-02:
  - v1.0.5 chỉ hiện **tổng số đang chờ hoàn** ở trang Trả phòng và trên folio;
  - tab **Hoàn tiền** giữ phạm vi như hiện nay. Đây là tách nhiệm có chủ ý (BR-522).
- Đề xuất: "v1.0.5: dòng **Đang chờ hoàn** hiện cả số của yêu cầu do người khác tạo (chỉ số tiền). Tab **Hoàn tiền** giữ phạm vi như hiện nay." Sửa cùng câu ở 3 chỗ và ở dòng lịch sử bản.
- Trạng thái: Open

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
- Trạng thái: Open

### FB-R4-DOM-BA-PR68-04
- Mức độ: Suggestion
- Vị trí: sổ tay 2.14 bước 6 (dòng 1164), `02` 11.1 bước 6 (dòng 834). Câu "…ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền**, dòng của mã đơn."
- Vấn đề: câu đúng sự thật, và ca giới hạn ở câu sau đã chỉ "hỏi quản lý", nên DOM coi điểm (3) là đạt. Nhưng lễ tân không phải người bấm Trả sớm vẫn có thể mở tab này trước rồi mới đọc câu sau.
- Đề xuất: "…ở v1.0.3 ở **Nhật ký tiền → Hoàn tiền** (chỉ yêu cầu do chính anh/chị tạo hoặc đã được duyệt)." Hoặc đưa câu "người khác bấm Trả sớm… hỏi quản lý" lên trước.
- Trạng thái: Open

### FB-R4-DOM-BA-PR68-05
- Mức độ: Suggestion
- Vị trí: sổ tay 2.14a đoạn "Áp dụng từ v1.0.4" của đơn HĐ; `02` 17.5. Câu "Desk hiện (hoặc không hiện) khung HĐ khác với HĐ giấy: dừng, hỏi quản lý."
- Vấn đề: Desk giữ ngày kết thúc HĐ theo HĐ lúc nhận phòng; **Gia hạn** không dời ngày này. Có một ca hay gặp mà câu an toàn này bắt được nhưng chưa nêu tên: khách **ký lại hoặc gia hạn HĐ bằng HĐ giấy mới**, có ngày kết thúc mới. Khách rời sau ngày kết thúc cũ mà trước ngày kết thúc mới: Desk coi là ở phần gia hạn và không hiện khung HĐ, trong khi theo HĐ giấy mới thì khách đang trả trước hạn.
- Đề xuất: thêm ví dụ vào câu an toàn: "(ví dụ HĐ đã ký lại với ngày kết thúc mới: Desk vẫn giữ ngày kết thúc cũ)".
- Trạng thái: Open

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
