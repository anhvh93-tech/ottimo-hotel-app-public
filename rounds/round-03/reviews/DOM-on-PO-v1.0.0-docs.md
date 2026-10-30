# DOM review PO – Tài liệu vận hành theo `v1.0.0` (D-T1): giữ chỗ "0h00", one-pager, day-one mục 10

- Người review: DOM | Round 3 – bước **Review** (điều kiện D-T1 của cổng QC v1.0, `rounds/round-03/qc/v1-gate.md` mục 4.2) | Ngày: 30/10/2026 | Ngày D: thứ Hai 02/11
- Sửa 30/10 (khuya) theo QA mục 20 (`qa/qa3-rc1.md`): A.1, A.2, A.3, A.4, thẻ 07 sửa tại chỗ (ghi *Sửa 30/10 theo QA mục 20*). Thêm mục **D** (xác nhận D-QA-1…5). "Điểm làm tốt" chuyển thành mục **E**.
- Đối tượng: `rounds/round-03/outputs/PO/v1.0.0-docs-update.md` (mục 2.4, 4 – phần chờ DOM); `product/docs/staff-one-pager.md` (phần Lễ tân); `product/docs/day-one-guide.md` mục 10 (và mục 4.3 mà mục 10 trỏ tới); `product/docs/manual/user-manual-v1.0.md` mục 0.8, 2.1, 2.4. `release-notes.md` dòng 107–108 nêu ở các thẻ vì cùng câu chữ.
- Căn cứ: `business-rules.md` v0.4.8 (BR-301, 302, 303, 304, 305, 308, 309, 402, 522); `qa/bug-list.md` BUG-R3-039, BUG-R3-041; `reviews/ARC-on-BE-B-worker-audit-fix.md` thẻ WA-04; decision-log 29/10 (**1 tài khoản nhân viên giữ 6 vai**, INV chấp nhận tự ghi – tự duyệt, OWN rà mỗi ngày) và 30/10; ESC-039 (chờ INV).
- Cùng phát hiện với BA (`reviews/BA-on-PO-manual-1.3.md` M13-01 Blocker, M13-02), do ORC chuyển. DOM tự kiểm độc lập và kết quả khớp. Thẻ 01–02 dưới đây là phần nghiệp vụ của cùng lỗi; PO trả lời chung một lần.
- Đã đọc mã trên `8b3aec8` để kiểm từng lối ra (chỉ đọc, chưa thử trên staging):
  - `services/api/src/modules/payments/internal/deposits.service.ts` dòng ~107–111, ~174–179, ~228–233;
  - `apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` dòng ~570–600 (hộp Xác nhận cọc);
  - `services/api/src/modules/reservations/internal/allowed-actions.ts` (trạng thái `hold`);
  - `reservations.service.ts`: `extendHold` (~2816–2830), `USER_CANCEL_REASONS` (~108), `cancellationQuote` (~3081).
- Góc nhìn: OTTIMO 10 căn. Ở quầy chỉ có **một người** (tài khoản 6 vai: quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale). Chủ đầu tư (OWN) thường không ở cơ sở. CTV bên ngoài có thể giữ chỗ.

## Kết luận

Hướng của PO đúng: rà giữ chỗ "0h00" bằng tay tới v1.0.1, không tự hủy đơn có cọc, ghi sổ giao ca. Câu đồng ý lưu ảnh và việc tạm dừng check-in online (D-T4) đúng thực tế quầy.

Nhưng khi đối chiếu với mã `8b3aec8`, **hai trong ba lối ra của BR-303 không làm được trên Desk v1.0** cho giữ chỗ đã quá hạn:
- **Lối (1) "khách chuyển đủ → Xác nhận đã nhận cọc"**: Desk từ chối `HOLD_EXPIRED` vì tiền ghi sau hạn. Hộp Xác nhận cọc không gửi giờ nhận tiền, nên máy chủ lấy giờ bấm.
- **Lối (2) "quản lý chấp nhận cọc thiếu"**: API có (`acceptShortfallReason`, MGR+), nhưng Desk **không có ô hay nút nào** gọi tới.
- Chỉ còn **lối (3) "hủy, hoàn 100 %"** chạy đúng: hủy giữ chỗ giữ lại 0, sinh yêu cầu hoàn.

Hệ quả: một khách cọc thiếu mà đơn đã quá hạn thì **không nhận phòng được trên Desk** (nhận phòng cần đơn đã xác nhận). Cách làm phải đổi trước buổi đào tạo C3a (31/10), và lỗi phải vào v1.0.1.

Thêm vào đó, tài liệu viết theo một khách sạn có ca, có lễ tân trưởng và quản lý riêng. OTTIMO hiện chỉ có một người. "Báo quản lý quyết" nghĩa là tự báo cho chính mình. DOM chốt lại người làm và giờ làm ở mục A.

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 4 (01–04) |
| Minor | 5 (05–09) |
| Suggestion | 1 (10) |

---

## A. Quyết định nghiệp vụ DOM (PO chép vào one-pager, sổ tay 2.1/2.4, day-one mục 10, release notes)

Thuộc quyền DOM: cách áp BR-302/303 ở quầy, không đổi giá, cọc hay mức hoàn đã được INV quyết ở ESC-006. Không lập ESC. Áp **từ ngày D tới khi v1.0.1 có đủ sửa lỗi ở thẻ 01, 02, 09**; sau đó PO viết lại theo Desk mới.

### A.1 Ai rà, rà ở đâu, khi nào

**Rà ở đâu** (theo BA M13-02, đã đối chiếu):
- Lượt rà đủ: **Đơn đặt phòng** → lọc **Đang hiệu lực** → mọi dòng **Giữ chỗ · chờ cọc**, mở từng đơn. Với 10 căn, mất 1–2 phút.
- **Hôm nay** chỉ có giữ chỗ **đến hôm nay**. Khối "Giữ chỗ chưa cọc (n)" gồm cả đơn đã có một phần cọc.
- **Sơ đồ phòng** chỉ hiện 14 ngày. Hai màn này chỉ để nhìn nhanh.
- Trên màn, Desk không ghi "0h00" mà ghi "**còn 0 giờ 00 phút**" màu đỏ. Trong tài liệu, "0h00" chỉ là tên gọi tắt; giải thích một lần ở sổ tay 2.4.

**Xử lý theo thứ tự:**
1. Giữ chỗ **còn dưới 2 giờ**, xử lý **trước hạn** theo A.2. Đây là việc chính: trước hạn, Desk làm được cả ba việc (xác nhận cọc, gia hạn, hủy).
2. Giữ chỗ đã **còn 0 giờ 00 phút**, xử lý theo A.3, A.4.

| Ai | Việc | Khi nào |
|---|---|---|
| **Người trực quầy** (hiện là tài khoản 6 vai; khi có lễ tân riêng thì lễ tân ca) | Rà theo thứ tự trên | **3 mốc cố định mỗi ngày**: (1) lúc mở quầy, muộn nhất 09:00; (2) **11:00**, trước trần 12:00 ngày đến; (3) trước khi rời quầy buổi tối, muộn nhất 21:00. Thêm: mỗi lần hộp thư hoặc **Cần chú ý** hiện "Giữ chỗ sắp hết hạn" (J2 nhắc 2 giờ trước hạn, có chạy ở v1.0) |
| Người trực quầy, với quyền quản lý của tài khoản 6 vai | Quyết đơn có cọc thiếu; hủy đơn và **nhập nơi nhận hoàn**. **Không duyệt, không chi** khoản hoàn do mình tạo (*Sửa 30/10 theo QA mục 20* – xem D-QA-2) | Ngay khi gặp; ghi lý do trên Desk và một dòng sổ giao ca |
| **OWN** | Xem lại các dòng sổ giao ca có chữ "giữ chỗ"; **duyệt và chi** các yêu cầu hoàn mới (*Sửa 30/10 theo QA mục 20*) | Cùng lượt kiểm sáng B1–B6, trước 09:00; khách đang chờ ở quầy thì theo D-QA-3 |
| CTV chốt đơn | Nhận báo từ người trực, liên hệ khách của mình | Trong 1 giờ kể từ khi người trực nhắn. Quá 1 giờ, hoặc đã 11:00 ngày đến, người trực gọi thẳng số khách trên đơn |

Không gọi là "đầu mỗi ca" vì OTTIMO chưa chia ca. Mốc 11:00 là mốc quan trọng nhất: giữ chỗ của khách đến hôm nay hết hạn muộn nhất 12:00 (BR-302).

### A.2 Phòng trước (lối chính ở v1.0)

Từ thẻ 01–02: ở v1.0, cách duy nhất để một giữ chỗ có cọc thành **Đã xác nhận** là **đủ cọc trước hạn**. Vì vậy:
1. Khách chuyển thiếu: ghi số đã nhận (đơn vẫn **Giữ chỗ · chờ cọc**), **gọi hoặc nhắn khách ngay trong ngày** xin phần còn lại trước hạn.
2. Khách cần thêm thời gian: bấm **Gia hạn giữ chỗ (1 lần)** **trước** hạn (tối đa +24 giờ, không quá 12:00 ngày đến). Sau hạn, nút này không còn.
3. Tiền về trước hạn nhưng chưa kịp bấm: **bấm trước giờ hạn**. Ghi tay (chuyển khoản, tiền mặt) sau hạn thì Desk từ chối, kể cả khi tiền đã về lúc trước hạn: hộp Xác nhận cọc không có ô giờ nhận tiền (thẻ 01). Sau hạn, chỉ khoản **VietQR mà Desk đã ghi "đã về" trước hạn** mới xác nhận được.
4. Khách nói "trả phần còn lại khi đến": ở v1.0 **không giữ chỗ cọc thiếu tới ngày đến được**. Nói thật với khách và chọn một trong hai: (a) khách chuyển nốt trước hạn; (b) giữ đơn theo A.3 và báo khách rằng **khi nhận phòng sẽ thanh toán đủ, khoản đã chuyển được hoàn lại ~~ngay tại quầy hoặc trong ngày~~ bằng chuyển khoản trong 24 giờ, hoặc tiền mặt tại quầy nếu chủ đầu tư có mặt** (*Sửa 30/10 theo QA mục 20* – D-QA-3).

### A.3 Giữ chỗ **đã có cọc** hiện 0h00 đỏ – ba lối ra BR-303 ở v1.0

Đơn ví dụ: căn 202, 3 đêm 05–08/11 = 2.376.000 đ, cọc yêu cầu 700.000 đ, khách đã chuyển 300.000 đ, hạn 10:00 03/11.

| Khách nói | Làm gì ở v1.0 | Ai | Hạn |
|---|---|---|---|
| "Không đi nữa", hoặc không liên lạc được tới **11:00 ngày đến** | **Hủy giữ chỗ**, lý do ~~**Khác**, ghi chú "Hết hạn giữ chỗ – có cọc"~~ **Khách đổi ý** (khách báo không đi) hoặc **Không liên lạc được**; điều cần giải thích ghi sổ giao ca. Desk giữ lại 0 đ, sinh yêu cầu hoàn **300.000 đ**. Người trực **nhập nơi nhận hoàn**; OWN duyệt, hoàn theo cách khách đã trả (BR-303 (3), BR-522) | ~~Người trực hủy và duyệt; tiền mặt thì OWN chi~~ Người trực hủy và nhập nơi nhận; **OWN duyệt và chi** (Desk không cho người tạo yêu cầu hoàn tự duyệt hay tự chi, kể cả quản lý) | Muộn nhất 12:00 ngày đến |
| "Vẫn đi, trả nốt" (chuyển nốt, hoặc trả khi đến) | **Không** nhận thêm chuyển khoản vào đơn cũ: Desk không ghi được sau hạn. **Để nguyên đơn** (Desk không tự hủy đơn có cọc, căn vẫn giữ). Ghi ~~**Ghi chú nội bộ**~~ **sổ giao ca** (khung đơn không có ô ghi chú – QA G1): "OTM-… Giữ – cọc thiếu 400.000, thu khi đến – [người quyết] dd/mm". Báo khách: "Phần còn lại anh/chị thanh toán khi nhận phòng" | Người trực (quyền quản lý), có lý do | Quyết trước 12:00 ngày đến |
| Khách đó tới quầy (đơn vẫn **Giữ chỗ**) | **Nếu v1.0.1 đã lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**. **Nếu chưa**: (a) **Hủy giữ chỗ** (lý do ~~**Khác**~~ **Khách đổi ý**; sổ giao ca "Tạo lại khi khách đến – thay bằng OTM-…") → Desk sinh yêu cầu hoàn 300.000; nhập nơi nhận hoàn. (b) **Đặt phòng mới** cùng căn, cùng giá đã chốt, **cùng kênh và CTV/nguồn** như đơn cũ; **thu đủ cọc ngay** (≥ 700.000 – Desk không lưu đơn thiếu cọc, `DEPOSIT_INSUFFICIENT`). (c) Ở bước nhận phòng thu ~~**đủ 2.376.000**~~ **phần còn lại 1.676.000** → **Nhận phòng**. (d) **OWN duyệt và chi** 300.000: tiền mặt tại quầy (khách thực trả 2.076.000), hoặc chuyển khoản lại **trong 24 giờ** (D-QA-3) | Người trực (a–c); **OWN duyệt và chi** (d) | Khi khách đến |
| Khách đã lỡ chuyển nốt **sau** hạn | Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Ghi sổ giao ca: số tiền, giờ về, mã đơn. Khi khách đến, làm như dòng trên, ghi phần đã chuyển ở bước ~~(c)~~ **(b)** với ghi chú "chuyển dd/mm hh:mm" (chưa đủ cọc: xem D-QA-5) | Người trực; OWN đối chiếu sao kê sáng hôm sau | Khi khách đến |

*Sửa 30/10 theo QA mục 20* (`qa/qa3-rc1.md` 20.1 G1, G2, G4, G7): bảng trên đã sửa lý do hủy (BUG-R3-046), người duyệt hoàn (`SELF_APPROVAL_FORBIDDEN`), bước thu cọc (`DEPOSIT_INSUFFICIENT`) và chỗ ghi chú. Chi tiết ở mục D.

Vì sao chọn "để nguyên đơn rồi làm lại khi khách đến" thay vì làm lại ngay:
- Căn vẫn được giữ, không ai bán mất.
- Tiền chỉ đi một vòng (hoàn rồi thu lại) vào lúc khách có mặt.
- Mỗi đồng tiền đều nằm trên Desk.
- Trường hợp này hiếm: phải cọc thiếu, quá hạn, và khách đến trước khi v1.0.1 lên.

Không dùng "sửa giá đêm cho cọc yêu cầu thấp xuống để xác nhận". Cách đó làm sai giá và doanh thu.

Ba điều tài liệu phải nói rõ (từ BA M13-01):
- **Hủy đơn cũ trước, đặt đơn mới sau.** Thông báo lỗi `HOLD_EXPIRED` nói "căn đã mở bán lại", nhưng với đơn có cọc thì **sai**: đơn cũ vẫn giữ căn và giữ tiền. Đặt đơn mới trước sẽ bị chặn trùng, hoặc ghi cọc hai lần.
- Hộp hủy của đơn có cọc vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn. **Desk vẫn tạo yêu cầu hoàn đủ số đã nhận**. Sau khi hủy, mở **Nhật ký tiền → Hoàn tiền** để thấy và duyệt.
- **Duyệt hoàn ≠ chi hoàn.** ~~Tài khoản 6 vai tự duyệt được. Nhưng Desk không cho người tạo yêu cầu tự chi tiền mặt, nên chi tiền mặt tại quầy cần OWN. OWN không ở cơ sở thì OWN chuyển khoản lại cho khách trong ngày, và báo khách trước.~~ **Sửa 30/10 theo QA mục 20:** người tạo yêu cầu hoàn (người hủy đơn) **không tự duyệt và không tự chi** được, kể cả có quyền quản lý hay là OWN (SEC F8; QA 20.2 dòng 16, 18: 403 `SELF_APPROVAL_FORBIDDEN`, `SELF_REFUND_FORBIDDEN`). Ở OTTIMO hiện nay: người trực hủy và **nhập nơi nhận trước**; **OWN duyệt và chi**. OWN vắng thì khách chưa nhận lại cọc tại quầy được; người trực hẹn khách theo D-QA-3.

### A.3a Có cần ARC/BE vá ở v1.0.1 không – **Có, bắt buộc**

Cách tạm ở A.3 buộc **hoàn rồi thu lại** của khách đã đặt cọc. Đây là trải nghiệm khách kém và tốn thêm một bước tiền cho mỗi đơn. Chỉ chấp nhận được trong vài ngày từ D tới v1.0.1 (dự kiến 04/11). Đề nghị PO đưa vào phạm vi v1.0.1, ARC duyệt hợp đồng:

| # | Vá | Vai | Mức DOM đề xuất |
|---|---|---|---|
| V1 | `confirmDeposit`: giữ chỗ đã nhận **> 0 đ** thì FD+ ghi thêm và xác nhận được dù đã quá hạn, tới khi nhận phòng. Giữ chỗ chưa cọc giữ nguyên quy tắc "tiền về trước hạn" (US-085 AC4, SEC-BE-22) | BE-B, ARC; SEC xem lại SEC-BE-22 | **Bắt buộc v1.0.1** |
| V2 | Hộp Xác nhận cọc có ô **"Chấp nhận cọc thiếu – lý do"** cho OWN/MGR (API đã có `acceptShortfallReason`) | FE-A, UXD | **Bắt buộc v1.0.1** |
| V3 | Hộp hủy của giữ chỗ có cọc hiện đúng số hoàn. Chữ `HOLD_EXPIRED` không nói "căn đã mở bán" khi đơn có cọc | FE-A, UXD | Nên có v1.0.1 |
| V4 | BUG-R3-041 (người nhận theo A.5) + WA-04 | BE-B, ARC | Đã có trong v1.0.1 |
| V5 | **Cần chú ý** liệt kê mọi giữ chỗ quá hạn, mọi ngày đến (không chỉ đến hôm nay) | BE-B | Nên có v1.0.1 (gộp với V4) |

Nếu V1 hoặc V2 **không kịp** v1.0.1: ORC nêu với INV trong tóm tắt (chạm tới khách: hoàn rồi thu lại). Trong lúc chờ, dùng thêm câu ở A.2 bước 4: nói rõ với khách cọc thiếu ngay từ lúc khách chuyển.

### A.4 Giữ chỗ **chưa cọc** đã quá hạn (WA-04) mà khách vẫn muốn giữ – thay câu "báo quản lý quyết"

**Quy tắc:** giữ chỗ quá hạn thì **không cứu**, chỉ **tạo lại một lần**. Desk đã chặn gia hạn và ghi cọc sau hạn (BR-303, US-085 AC4, SEC-BE-22). Desk lẽ ra đã tự hủy đơn này; chỉ lỗi WA-04 làm nó còn.

1. **Hủy ngay** khi thấy, không chờ gọi khách: **Hủy giữ chỗ**, lý do ~~**Khác**, ghi chú "Hết hạn giữ chỗ"~~ **Không liên lạc được**, sổ giao ca "OTM-… hủy – hết hạn giữ chỗ, chưa cọc" (Desk không cho chọn lý do "Hết hạn giữ chỗ", xem thẻ 07; "Khác" bị khóa – BUG-R3-046; *Sửa 30/10 theo QA mục 20*). Không phí (BR-308). Căn mở lại.
2. Nhắn hoặc gọi khách (đơn CTV thì báo CTV trước, theo A.1). Khách còn muốn:
   - **Ngày đến từ ngày mai:** tạo **giữ chỗ mới**.
     - Báo giá cũ còn hiệu lực (3 ngày, BR-304): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó. Hết hiệu lực: **Lập báo giá mới** theo giá hiện hành.
     - Chọn **12 h** (ngắn nhất).
     - Giảm giá hoặc FOC của đơn cũ phải xin lại. Tài khoản 6 vai tự ~~duyệt~~ áp **trong hạn mức quản lý** (tổng giảm trên một dòng ≤ giá 1 đêm của dòng đó), có lý do; vượt mức thì OWN duyệt; OWN rà sáng hôm sau (*Sửa 30/10 theo QA mục 20* – D-QA-4).
     - Ghi chú nội bộ: "Tạo lại từ OTM-… (hết hạn dd/mm)".
   - **Ngày đến hôm nay:** không giữ chỗ được (BR-302). Gửi VietQR, tạo đơn khi tiền về. Khách đang trên đường: căn còn thì nhận khi tới, như khách vãng lai.
3. **Chỉ tạo lại một lần** cho cùng khách và cùng kỳ ở. Giữ chỗ tạo lại mà lại quá hạn: hủy, không giữ nữa. Chỉ đặt khi tiền cọc đã về.
4. **Không cần báo quản lý.** Lễ tân được hủy giữ chỗ chưa cọc và không bị giới hạn số giữ chỗ (BR-302). Báo OWN chỉ khi khách đòi **giữ giá cũ** mà báo giá đã hết hiệu lực và giá hiện hành cao hơn.

Ví dụ: giữ chỗ căn 301 có giảm giá đặc biệt 10 %, đến 08/11, hạn 20:00 04/11. Lúc 08:30 05/11 vẫn 0h00 đỏ:
- 08:30 hủy (~~Khác – "Hết hạn giữ chỗ"~~ **Không liên lạc được**; sổ giao ca "hết hạn giữ chỗ, chưa cọc").
- 08:35 nhắn khách. 09:10 khách xin giữ: báo giá lập 03/11 còn hiệu lực tới 23:59 06/11 → tạo giữ chỗ 12 h, hạn 21:10 05/11, xin lại giảm 10 %.
- 21:10 chưa cọc: lần này không tạo lại.

### A.5 Ai nhận thông báo ở v1.0.1 (trả lời câu "DOM xác nhận ai nhận" của BUG-R3-041)

| Thông báo | Người nhận | Kèm |
|---|---|---|
| `hold_overdue_with_deposit` (tới hạn, có cọc) | Người tạo, người chốt (sale/CTV), mọi tài khoản FD/FDL/MGR đang hoạt động | Một mục **Cần chú ý** màu đỏ, giữ tới khi đơn rời trạng thái `hold`. **Người nhận không được bấm "Đã xử lý" để tắt** |
| `hold_overdue_cap` (12:00 ngày đến, còn `hold`) | MGR, OWN | Mục **Cần chú ý** riêng |
| `hold_expired` (chưa cọc, Desk tự hủy) | Người tạo, người chốt (CTV báo khách) | Chỉ hộp thư, không cần Cần chú ý |

### A.6 Dòng decision-log đề xuất (ORC ghi khi commit, nhãn DOM)

> 2026-10-30 | 3 | **DOM – giữ chỗ quá hạn ở v1.0 (BUG-R3-041, WA-04, thẻ DOM-on-PO-v1.0.0-docs 01–04)**:
> - Rà 3 mốc mỗi ngày (mở quầy ≤ 09:00, 11:00, trước khi rời quầy ≤ 21:00); OWN xem lại trong lượt B1–B6.
> - Có cọc mà quá hạn: Desk v1.0 chỉ làm được hủy + hoàn. Khách vẫn đi thì để nguyên đơn; khi khách đến thì hủy, đặt lại, thu đủ, hoàn phần cọc cũ.
> - Chưa cọc mà quá hạn: hủy ngay, tạo lại 1 lần (12 h), không cần quản lý.
> - BR-303 làm rõ: giữ chỗ **đã nhận > 0 đ** thì FD+ được ghi thêm tiền và xác nhận sau hạn, tới khi nhận phòng; chỉ giữ chỗ **chưa cọc** mới áp "tiền phải về trước hạn" (US-085 AC4).
> | DOM | Quyền DOM (tính đúng nghiệp vụ); không đổi chính sách ESC-006

---

## B. Thẻ feedback

### FB-R3-DOM-PO-DOC-01
- Mức độ: Major
- Vị trí:
  - `staff-one-pager.md` dòng 33 ("Khách chuyển đủ → kiểm tiền về rồi Xác nhận đã nhận cọc");
  - sổ tay 2.4, khung "Lỗi đang sửa", ý 1 gạch 1 (dòng 623);
  - `release-notes.md` dòng 107 ("thu đủ rồi xác nhận").
- Vấn đề:
  - Lối ra (1) của BR-303 không làm được sau hạn. `deposits.service.ts` ~174–179: khi `hold_expires_at ≤ now`, máy chủ chỉ cho xác nhận nếu giờ nhận tiền **trước** hạn, ngược lại trả `HOLD_EXPIRED`.
  - Hộp **Xác nhận cọc** (`ReservationDialogs.tsx` ~585–597) không gửi `receivedAt`, nên giờ nhận tiền là giờ bấm, luôn sau hạn. Lối qua VietQR cũng vậy: tiền về sau hạn thì `received_at` sau hạn.
  - Hệ quả: giữ chỗ có cọc mà quá hạn thì không thành **Đã xác nhận** được. Nhận phòng cần đơn đã xác nhận (`allowed-actions.ts`, `confirmed` → `check_in`), nên khách tới quầy **không nhận phòng được** trên đơn đó.
  - Cùng lỗi: tiền về **trước** hạn nhưng lễ tân bấm **sau** hạn (ví dụ tiền về 09:50, hạn 10:00, bấm 10:30) cũng bị từ chối.
  - Đây là mâu thuẫn giữa mã và BR-303. BR-303 (v0.3.2) cho xử lý tới trần 12:00 ngày đến, kể cả "thu đủ → xác nhận". US-085 AC4 / SEC-BE-22 viết cho giữ chỗ chưa cọc, nhưng mã áp cho mọi giữ chỗ.
  - DOM mới đọc mã, chưa thử. QA thử được ngay trên staging với **OTM-00368** (căn 102, có 200.000, đã quá hạn từ 07:03 30/10): ghi thêm cọc, kỳ vọng thấy `HOLD_EXPIRED`.
- Vì sao quan trọng: ngày D, nếu làm theo tài liệu, nhân viên sẽ bấm, bị từ chối và không biết làm gì, ngay lúc khách đứng ở quầy. Nhận phòng không được là lỗi "P0" theo chính one-pager.
- Đề xuất sửa:
  - (1) Tài liệu: thay khối xử lý có cọc bằng mục A.2 + A.3 (phòng trước; để nguyên đơn; khi khách đến thì hủy – đặt lại – thu đủ – hoàn cọc cũ). One-pager chỉ cần 4 dòng; bảng đầy đủ để ở sổ tay 2.4.
  - (2) QA ghi lỗi mới: đề xuất P1 vì có cách tạm nhưng khách không nhận phòng được trên đơn gốc; QA quyết mức. Giao BE-B, đưa vào **v1.0.1** (vá V1, A.3a): giữ chỗ có `depositPaid > 0` thì FD+ ghi thêm và xác nhận được bất kể hạn, tới khi nhận phòng (theo A.6).
  - (3) Release notes "Giới hạn đã biết" thêm một dòng cho lỗi này.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-02
- Mức độ: Major
- Vị trí: one-pager dòng 33 ("quản lý chấp nhận cọc thiếu (ghi lý do)"); sổ tay 2.4 khung, ý 1 gạch 2 (dòng 624); `release-notes.md` dòng 107.
- Vấn đề:
  - Lối ra (2) của BR-303 có ở API: `confirmDeposit` nhận `acceptShortfallReason`, chỉ OWN/MGR (`deposits.service.ts` ~107–111, ~230).
  - Desk không gửi trường này ở bất kỳ đâu (`grep acceptShortfallReason product/apps` = 0 kết quả). Hộp Xác nhận cọc chỉ có số tiền và cách trả. Desk chỉ **hiển thị** "đã chấp nhận cọc thiếu" (CheckInPage, Nhật ký tiền).
  - Quản lý làm theo tài liệu sẽ không tìm thấy nút. Trước hạn cũng không có, nên ở v1.0 **không có đơn nào được xác nhận khi cọc thiếu**.
- Vì sao quan trọng: "khách chuyển trước một ít, phần còn lại trả khi đến" là chuyện thường ngày ở homestay/boutique Đà Lạt, nhất là khách quen và khách Zalo. Tài liệu hứa một thao tác không có, và tình huống này sẽ dồn vào thẻ 01.
- Đề xuất sửa:
  - (1) Tài liệu v1.0: bỏ "chấp nhận cọc thiếu". Thay bằng "giữ – thu khi đến" của A.3: để nguyên đơn, ghi chú nội bộ người quyết.
  - (2) PO đưa vào backlog **v1.0.1**, giao FE-A: hộp Xác nhận cọc có ô **"Chấp nhận cọc thiếu – lý do"**, chỉ hiện với OWN/MGR, khi số nhận > 0 và < cọc yêu cầu. API đã sẵn sàng, chỉ cần sửa giao diện. UXD đặt chữ.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-03
- Mức độ: Major
- Vị trí: sổ tay 2.4 khung, ý 2 ("Khách còn muốn giữ: báo quản lý quyết", dòng 626) và chú thích dòng 628; one-pager dòng 34; `release-notes.md` dòng 108; `v1.0.0-docs-update.md` mục 4 dòng DOM (2).
- Vấn đề:
  - "Báo quản lý quyết" không cho người trực biết phải làm gì. Ở OTTIMO, người trực **chính là** tài khoản có quyền quản lý.
  - Không có gì để quyết: sau hạn Desk chặn cả gia hạn (`extendHold` → `HOLD_EXPIRED`) lẫn ghi cọc. Đơn đó chỉ còn sống vì lỗi WA-04.
  - Thứ tự "gọi khách trước, khách không giữ thì hủy" còn giữ căn thêm trong lúc chờ khách trả lời. BR-303 đã nói đơn này phải bị hủy lúc tới hạn.
- Vì sao quan trọng: căn bị khóa trên Desk (các kênh OTA không đóng theo vì v1.0 chưa đồng bộ). Đơn OTA về căn này sẽ vào làn xung đột. Nhân viên chờ một quyết định không ai đưa ra.
- Đề xuất sửa: thay bằng mục A.4. Hủy ngay → báo khách → tạo lại **một lần** (12 h, từ báo giá còn hiệu lực hoặc báo giá mới) nếu ngày đến từ ngày mai; ngày đến hôm nay thì thu tiền ngay, không giữ. Không cần quản lý.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-04
- Mức độ: Major
- Vị trí:
  - one-pager dòng 30–35 ("Đầu ca", "Đầu mỗi ca", "báo quản lý") và 69 ("Cuối ca");
  - sổ tay 2.1 bước 4 và cuối ca ý 1;
  - day-one mục 10 dòng 2 ("Lễ tân, lễ tân trưởng; quản lý quyết đơn có cọc thiếu" · "Đầu mỗi ca");
  - `v1.0.0-docs-update.md` mục 6 ý 2 (đề xuất lễ tân trưởng ký sổ giao ca).
- Vấn đề:
  - Theo decision-log 29/10, OTTIMO có **một** tài khoản nhân viên giữ 6 vai cùng OWN. Không có ca, không có lễ tân trưởng hay quản lý khác.
  - "Đầu mỗi ca" không có mốc giờ thật. "Báo quản lý" và "lễ tân trưởng ký sổ" là báo và ký cho chính mình.
  - Giữ chỗ hết hạn vào bất kỳ giờ nào (tạo 20:00, 12 h → 08:00). Mốc cứng duy nhất là **12:00 ngày đến**, và tài liệu chưa đặt mốc rà nào trước 12:00.
- Vì sao quan trọng: một kiểm soát không gắn giờ cụ thể sẽ bị bỏ qua đúng hôm đông khách. PO cũng đã nêu rủi ro này ở mục 6. Người kiểm thật là OWN, nên phải đặt việc kiểm vào lượt OWN đã làm mỗi sáng.
- Đề xuất sửa:
  - Dùng bảng A.1: 3 mốc cố định (≤ 09:00, **11:00**, ≤ 21:00) + mỗi lần có "Giữ chỗ sắp hết hạn".
  - "Quản lý quyết" đổi thành "người trực quyết bằng quyền quản lý, ghi lý do; OWN xem lại sáng hôm sau trong lượt B1–B6".
  - Bỏ ý lễ tân trưởng ký sổ giao ca.
  - Thêm một câu chung: "Khi OTTIMO có thêm lễ tân, việc rà làm ở đầu mỗi ca và việc quyết đơn có cọc thiếu chuyển về quản lý."
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-05
- Mức độ: Minor
- Vị trí: one-pager dòng 39 ("Cọc"); sổ tay 2.4 "Lưu ý" dòng 609, 612.
- Vấn đề: tài liệu chỉ dạy xử lý **sau** khi 0h00 đỏ. Ở v1.0, cách làm được là xử lý **trước** hạn (A.2). Nhắc 2 giờ trước hạn **có chạy** (J2 dùng `events.notify`, QA thấy `hold_expiring` trong hộp thư; Cần chú ý có "Giữ chỗ sắp hết hạn"), nhưng one-pager không nói phải làm gì khi thấy nhắc.
- Vì sao quan trọng: giữ chỗ không bao giờ quá hạn thì không cần dùng cách hủy – đặt lại – hoàn ở thẻ 01–02.
- Đề xuất sửa: one-pager dòng "Cọc" thêm: "Khách chuyển thiếu: gọi ngay xin phần còn lại. Thấy 'Giữ chỗ sắp hết hạn': gọi khách; cần thêm giờ thì **Gia hạn (1 lần)** ngay – sau hạn không gia hạn được. Tiền đã về thì bấm xác nhận **trước giờ hạn**."
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-06
- Mức độ: Minor
- Vị trí: one-pager dòng 69 ("không còn giữ chỗ 0h00 đỏ chưa bàn giao"); sổ tay 2.1 cuối ca ý 1.
- Vấn đề: theo A.3, đơn có cọc mà khách vẫn đi sẽ **cố ý** để nguyên và đỏ tới ngày đến, có khi 2–3 ngày. Điều kiện "không còn 0h00 đỏ" không bao giờ đạt. Mỗi lượt rà, người trực lại phải đọc từng đơn đã quyết xong.
- Vì sao quan trọng: kiểm soát luôn "không đạt" sẽ bị bỏ qua, kể cả khi có đơn đỏ mới.
- Đề xuất sửa: điều kiện cuối ngày là "mọi giữ chỗ 0h00 đỏ đều có **Ghi chú nội bộ** dạng 'Giữ – … – [tên] dd/mm' hoặc đã hủy". Lượt rà chỉ cần xử lý đơn đỏ **chưa có ghi chú đó**.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-07
- Mức độ: Minor
- Vị trí: sổ tay 2.4 khung, ý 2 (lý do "Hết hạn giữ chỗ", dòng 626).
- Vấn đề: lễ tân không chọn được lý do "Hết hạn giữ chỗ". `USER_CANCEL_REASONS` (`reservations.service.ts` ~108) chỉ có: khách đổi ý, tìm được chỗ khác, giá, đổi ngày, không liên lạc được, khác, OTA báo hủy. Mã `hold_expired` dành cho hệ thống.
- Vì sao quan trọng: nhân viên tìm một mục không có. Báo cáo hủy (BR-308) cũng sẽ lẫn đơn hủy tay vì quá hạn với lý do "Khác".
- Đề xuất sửa: tài liệu ghi "lý do **Khác**, ghi chú 'Hết hạn giữ chỗ'". Không liên lạc được thì chọn **Không liên lạc được**. Không cần sửa mã: khi WA-04 sửa ở v1.0.1, Desk tự hủy với đúng mã.
  - *Sửa 30/10 theo QA mục 20:* "Khác (ghi rõ)" bị Desk khóa (BUG-R3-046, P2). Đề xuất "lý do Khác" ở trên **bỏ**; dùng cách chọn ở D-QA-1.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-08
- Mức độ: Minor
- Vị trí: `day-one-guide.md` mục 4.3 ("thời hạn bằng phần còn lại của hạn cũ") và mục 10 dòng 2 ("Lần rà đầu tiên: ngay sau khi nhập xong nhóm G").
- Vấn đề:
  - (1) Hộp Giữ chỗ chỉ cho 12/24/48 giờ (BR-302). Không đặt được "phần còn lại", ví dụ 5 giờ.
  - (2) Nhóm G vừa tạo lúc D−1 15:00–17:00 thì chưa đơn nào quá hạn. Lượt rà "ngay sau khi nhập" không bắt được gì. Lượt có ý nghĩa là tối D−1 và **sáng D trước 09:00**, **11:00 ngày D**.
- Vì sao quan trọng: người nhập sẽ dừng lại tìm ô nhập giờ trong lúc OWN ngồi cạnh. Lượt rà sai giờ tạo cảm giác đã kiểm.
- Đề xuất sửa:
  - (1) "Chọn **12 h**. Hạn mới có thể dài hơn hạn cũ vài giờ, chấp nhận được. Khách đến ngày D thì Desk tự cắt hạn ở 12:00 ngày D."
  - (2) Mục 10: "Lượt rà đầu tiên: trước khi rời quầy tối D−1, rồi theo 3 mốc A.1 từ ngày D."
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-09
- Mức độ: Minor
- Vị trí: day-one mục 10 dòng 2 cột "Tới khi nào" ("Bản v1.0.1 (BUG-R3-041, WA-04)"); `release-notes.md` dòng 77 (bảng "Chưa có trong bản này"); `v1.0.0-docs-update.md` mục 4.
- Vấn đề: biện pháp tạm đang gắn với việc sửa BUG-R3-041 và WA-04. Nhưng muốn bỏ được nó, v1.0.1 còn phải có sửa lỗi của thẻ 01 (ghi cọc sau hạn cho đơn đã có cọc) và 02 (ô chấp nhận cọc thiếu). Thiếu hai sửa này, Desk báo quá hạn nhưng nhân viên vẫn không xác nhận được.
- Vì sao quan trọng: nếu v1.0.1 chỉ sửa thông báo, đội sẽ báo "đã sửa" và bỏ cách tạm, trong khi lối (1), (2) vẫn hỏng.
- Đề xuất sửa: điều kiện bỏ cách tạm = v1.0.1 có đủ V1, V2, V4 (bảng A.3a; V3, V5 nên có), và QA thử lại cả ba lối ra BR-303 trên staging, cả trước lẫn sau hạn. Bảng dòng 77 của release notes thêm hai dòng tương ứng.
- Trạng thái: Open

### FB-R3-DOM-PO-DOC-10
- Mức độ: Suggestion
- Vị trí: one-pager dòng 49–52 (câu hỏi đồng ý lưu ảnh); sổ tay 0.8 điểm 4; day-one mục 4.6.
- Vấn đề:
  - (1) Khách nhóm 3, 4 lúc chuyển đổi **không chụp lại ảnh** (day-one 4.6), nên không cần hỏi đồng ý lưu ảnh. Nhân viên có thể hỏi máy móc cho cả khách đang ở.
  - (2) Câu hỏi đang viết cho một khách. Ở quầy thường có 2–4 người lớn cùng đơn, mỗi người một giấy tờ.
  - (3) One-pager dòng 39 "gửi khách mã VietQR từ đơn" chưa nhắc chỉ gửi từ **điện thoại của cơ sở**. Sổ tay 2.4 dòng 573 nói máy quầy không mở Zalo. Quy tắc này thiếu trong tờ dán quầy.
- Vì sao quan trọng: thủ tục tại quầy nên ngắn. Hỏi thừa làm chậm, còn bỏ sót người đi cùng thì sai đồng ý theo NĐ 13/2023 (SEC xác nhận). Điểm (3) là thói quen dễ sai ngày đầu.
- Đề xuất sửa:
  - (1) Thêm "Chỉ hỏi khi chụp ảnh giấy tờ. Khách đang ở lúc chuyển đổi không chụp lại, không hỏi."
  - (2) Thêm "Hỏi từng người lớn được chụp ảnh giấy tờ."
  - (3) Dòng "Cọc" thêm "(gửi từ điện thoại của cơ sở, không mở Zalo trên máy quầy)".
  - Chữ hướng tới khách vẫn để UXD và SEC duyệt.
- Trạng thái: Open

---

## C. Đã rà, không có thẻ

- One-pager phần Lễ tân, các ý còn lại khớp BR v0.4.8 và thực tế quầy:
  - giờ (06:00, 12:00 nhận/trả, 14:00, 18:00, 23:00, +12 giờ);
  - câu nói giờ nhận phòng;
  - điều kiện nhận phòng và giao mã cửa;
  - VietQR "Tài khoản nhận vừa đổi";
  - Phiếu thanh toán A4 / Lưu PDF 1–1;
  - miễn giảm qua **Cần duyệt**;
  - khách ở quá 18:00 (ESC-031);
  - mất mạng; báo lỗi không kèm dữ liệu khách.
- Day-one mục 10 dòng 1 (tạm dừng check-in online, dán tờ thông báo trước 12:00 ngày D): đúng giờ. Khách mới đến ngày D nhận từ 12:00; nhóm 3, 4 nhận 14:00 và không chụp lại ảnh.
- Day-one mục 10 dòng 3 (B1–B6 mỗi sáng trước 09:00): thuộc SEC. DOM chỉ đề nghị gộp lượt rà giữ chỗ buổi sáng vào cùng lượt này (A.1).
- Sổ tay 0.8 điểm 4–5: đúng về nghiệp vụ, khớp câu ở one-pager. Hạn 30 ngày ở v1.0 và 3 tháng ở bản vá nói rõ "đọc số Desk hiện". Chữ để UXD, SEC.

## D. Xác nhận sau QA mục 20

- Người viết: DOM | Round 3 – bước **Review** (xác nhận nhanh trước buổi đào tạo C3a 31/10) | Ngày: 30/10/2026 (khuya).
- Đối tượng: `responses/PO-to-v1.0.0-docs-reviews.md` mục 10 (10.4 D-QA-1…5); `qa/qa3-rc1.md` mục 20 (commit `3482f82`). Đối chiếu sổ tay bản nội dung 1.4 (mục 1.8, 2.4, 2.8, 2.13), `staff-one-pager.md` Tờ 1, 2a, `day-one-guide.md` mục 10, `release-notes.md` dòng 121–122.
- Đọc thêm mã `v1.0.0` (chỉ đọc, chưa thử trên staging):
  - `approvals/public/approval.service.ts`: `selfApplication` (~593–650), `assertNotSelf` (~1352–1378);
  - `approvals/internal/limits.ts`: `approverRoleOf`, `requiredRoleFor`, `MONEY_LIMITED`;
  - `payments/internal/refunds.service.ts` (~515–533 `REFUND_SOURCE_NOT_RECONCILED`; đầu tệp: xem số tài khoản hoàn cần máy được cấp quyền);
  - `payments/internal/deposits.service.ts` ~174–179; `payments.service.ts` ~495–600 (xác nhận VietQR);
  - `reservations.service.ts` ~108 (`USER_CANCEL_REASONS`), ~830–841 (`DEPOSIT_INSUFFICIENT`); `BookingDialog.tsx` ~484 (`initialPayment`: một cách thanh toán); `CheckInPayment.tsx` (chuyển khoản/POS phải bằng đúng số phải thu).
- Căn cứ: BR-303, BR-308, BR-431–433, BR-436, BR-522, BR-527; `metrics-definitions.md` K-22a, K-22d, S7; decision-log 29/10 (tài khoản 6 vai).
- Mục A ở trên đã sửa theo QA mục 20 (các chỗ ghi *Sửa 30/10 theo QA mục 20*).

### D.0 Kết luận

| # | Việc | Kết luận DOM | Sổ tay | Bản in |
|---|---|---|---|---|
| D-QA-1 | Lý do hủy thay "Khác" (BUG-R3-046) | **Đồng ý** cách chọn của PO. Chỉ thêm (tùy chọn) một dòng cho đơn nhập nhầm. Sửa ghi chú cho DATA: **K-22a không lệch về tỉ lệ**, chỉ lệch phần chia theo lý do; S7 lệch | Tùy chọn 1 câu ở 2.8 | Không đổi |
| D-QA-2 | Câu "tài khoản 6 vai tự duyệt được" (DOM A.3) | **Đã sửa** trong tệp này (A.1, A.2, A.3, A.4, thẻ 07) | – | – |
| D-QA-3 | Câu hẹn khách khi OWN vắng | **Đổi "trong ngày" thành "trong 24 giờ"**. Chuyển khoản là cách hẹn mặc định; chỉ hẹn tiền mặt khi OWN đã hẹn giờ tới quầy. Thêm bước OWN đối soát khoản cọc cũ trước khi chi | 2.4 (2 chỗ) | Không đổi |
| D-QA-4 | Giảm giá/FOC đơn cũ "xin lại" | **Câu PO đúng hướng nhưng thiếu hạn mức.** Người trực **tự áp được** giảm giá/FOC do chính mình gửi **trong hạn mức quản lý** (mỗi lần ≤ giá 1 đêm của dòng). Với tiền phòng tính theo đêm thì gần như luôn trong mức. Vượt mức thì **OWN duyệt**, người trực không duyệt được | 2.4 (1 câu, thêm 1 câu ở bước (b)) | Không đổi |
| D-QA-5 | Khách đã chuyển sau hạn một phần cọc | **Đồng ý**, thêm 3 điều: (1) kiểm tiền về, và kiểm khoản đó **chưa nằm trên đơn cũ** (đường VietQR sau hạn vẫn ghi được tiền vào đơn cũ – tránh ghi hai lần); (2) ghi **Chuyển khoản** (tay), không VietQR; (3) khách không chuyển thêm được thì không gộp tiền mặt vào | 2.4 (1 ô bảng) | Không đổi |
| Thêm | Bước (b) "Đặt phòng mới" thiếu **kênh/CTV** | Đơn mới phải **cùng kênh và CTV/nguồn** như đơn cũ (hoa hồng CTV, báo cáo kênh) | 2.4 (b) | Tờ 2a: đổi chữ **ngắn hơn** (D.6), không bắt buộc |

Không có ESC mới. Một việc ORC nên nói với INV ở buổi C3a (D.7).

### D.1 D-QA-1 – Lý do hủy tới v1.0.1 (BUG-R3-046): **Đồng ý**

| Tình huống | Lý do chọn trên Desk | Sổ giao ca (không ghi tên khách) |
|---|---|---|
| Giữ chỗ **chưa cọc** đã "còn 0 giờ 00 phút" | **Không liên lạc được** (dùng cố định cho mọi đơn loại này, kể cả khi khách vẫn nghe máy) | "OTM-… hủy – hết hạn giữ chỗ, chưa cọc" |
| **Có cọc**, khách báo không đi | **Khách đổi ý** | "OTM-… hủy – hết hạn giữ chỗ, có cọc – chờ chủ đầu tư hoàn …" |
| **Có cọc**, gọi không được tới 11:00 ngày đến | **Không liên lạc được** | như trên |
| Làm lại khi khách đến (bước (a)) | **Khách đổi ý** | "OTM-cũ hủy – tạo lại khi khách đến – thay bằng OTM-mới" |

Vì sao đồng ý:
- Lý do hủy **không đổi tiền**. Giữ chỗ luôn hoàn 100 % số đã nhận (BR-308). Đơn đã xác nhận tính phí theo số ngày báo trước (BR-309), không theo lý do. Chỉ **OTA báo hủy** có xử lý riêng, và lý do này chỉ dùng cho đơn OTA.
- Mỗi tình huống chỉ dùng **một** lý do cố định, nên DATA tách lại được (dưới đây). Đổi "làm lại" sang **Đổi ngày** cũng không đúng hơn (ngày không đổi), lại phải sửa Tờ 2a. Giữ như PO.

Tùy chọn (PO quyết): sổ tay 2.8, khung "Lỗi đang sửa (v1.0.1) – lý do Khác (ghi rõ)", thêm vào cuối câu:
> Nhập nhầm hoặc trùng đơn: chọn **Khách đổi ý**, sổ giao ca ghi "OTM-… nhập nhầm".

Mục đích: tuần đầu sẽ có đơn nhập nhầm khi chuyển dữ liệu (nhóm G). Có câu này, DATA loại được các đơn đó khỏi tỉ lệ hủy.

**Ghi chú cho DATA** (sửa câu "K-22a lệch" ở PO 10.4):
1. **Tỉ lệ K-22a không lệch.** K-22a chỉ đếm đơn có `status_before_cancel = confirmed`, và `other`, `guest_changed_mind`, `unreachable` đều là mã **được tính**. Đổi "Khác" sang hai mã kia không làm đổi tử số. Lệch chỉ ở **phần chia theo lý do** từ 02/11 tới v1.0.1: `other` = 0, còn `guest_changed_mind` và `unreachable` bị cộng thêm. Phần chia theo lý do kỳ này phải đọc kèm sổ giao ca.
2. Đơn **nhập nhầm** (nếu PO thêm câu tùy chọn) cũng rơi vào `guest_changed_mind` và **làm tăng** K-22a. DATA loại các đơn này theo sổ giao ca ("nhập nhầm").
3. **S7 và phân tích giữ chỗ bị lệch.** Giữ chỗ quá hạn bị người trực hủy tay với mã `unreachable`/`guest_changed_mind`, `cancelled_by` = người, thay vì `hold_expired`/`system`. Quy tắc tách lại cho kỳ 02/11 → v1.0.1: `status_before_cancel = hold` **và** `cancelled_at ≥ hold_expires_at` → coi là **hết hạn giữ chỗ**, mã nào cũng vậy. S7 kỳ này không dùng để đánh giá job J1, vì lỗi BUG-R3-041/WA-04 đã làm lệch S7.
4. **Cặp "làm lại khi khách đến"** gồm giữ chỗ cũ (`hold` → hủy) và đơn mới cùng căn, cùng ngày, cùng khách đứng tên, tạo trong khoảng 60 phút sau khi hủy. Đây **không** phải nhu cầu mất và **không** phải khách vãng lai mới. K-22a, K-22d không bị ảnh hưởng (đơn cũ là `hold`, đêm `hold` chưa bán). Báo cáo kênh chỉ đúng khi bước (b) chọn đúng kênh (D.6).

### D.2 D-QA-2 – Câu "tài khoản 6 vai tự duyệt được": **Đã sửa**

Sửa ngay trong tệp này, mỗi chỗ có dòng *Sửa 30/10 theo QA mục 20*:
- A.1, bảng "Ai": người trực **hủy và nhập nơi nhận**, không duyệt, không chi; OWN **duyệt và chi**.
- A.2 bước 4: "hoàn ngay tại quầy hoặc trong ngày" → theo D-QA-3.
- A.3: bảng 4 dòng (lý do, người duyệt, bước (b)/(c), sổ giao ca thay "Ghi chú nội bộ"), và gạch đầu dòng "Duyệt hoàn ≠ chi hoàn".
- A.4 bước 1 và ví dụ: "Khác" → **Không liên lạc được**. Dòng giảm giá/FOC: thêm hạn mức (D-QA-4).
- Thẻ 07: bỏ đề xuất "lý do Khác".

Câu đúng, khớp sổ tay 1.8: **người tạo yêu cầu hoàn không tự duyệt và không tự chi, không có ngoại lệ** (kể cả quản lý, OWN). Khoản hoàn sinh ra khi người trực hủy đơn đều cần **OWN duyệt và chi**. Decision-log dòng DOM 30/10 không có câu sai này, không cần sửa.

### D.3 D-QA-3 – Câu hẹn khách khi OWN vắng: **"trong 24 giờ"**

Chọn "trong 24 giờ", không chọn "trong ngày". Lý do:
- **OWN làm được mỗi lần.** Khách đến quầy thường vào chiều hoặc tối (nhận phòng từ 12:00). Cam kết "trong ngày" với khách đến lúc 21:00 buộc OWN chuyển tiền trước 24:00. Cam kết 24 giờ khớp với **lượt kiểm sáng hôm sau trước 09:00** mà OWN đã làm mỗi ngày (sổ tay 1.1: "duyệt và chi các khoản hoàn người trực tạo").
- **Hoàn chuyển khoản cần máy được cấp quyền.** Xem đủ số tài khoản nhận hoàn cần OWN/MGR, máy được cấp quyền, xác thực lại (`refunds.service.ts`, đầu tệp: `getRefundDestination`). OWN ở ngoài cơ sở mà không có laptop được cấp quyền thì không chuyển được ngay.
- **Tiền gốc phải đối soát trước khi chi.** Desk chặn chi hoàn (tiền mặt hay chuyển khoản) khi khoản thu tạo ra số dư chưa đối soát: `REFUND_SOURCE_NOT_RECONCILED` (BR-522 "chỉ chi khi khoản thu đã đối soát", `refunds.service.ts` ~525). Cọc cũ khách chuyển khoản mà OWN chưa đối soát thì OWN phải đối soát trước. QA mục 20 dùng cọc **tiền mặt** nên chưa gặp lỗi này.
- Nói "24 giờ" rồi làm xong sáng hôm sau thì khách hài lòng. Nói "trong ngày" mà trễ thì khách sẽ khiếu nại. Chuẩn chung của ngành: hứa thời hạn chắc chắn làm được.
- Hẹn "tiền mặt khi OWN có mặt trong thời gian ở" không có mốc giờ: OWN không tới thì khách trả phòng mà chưa nhận tiền. Chỉ hẹn tiền mặt khi OWN đã hẹn giờ cụ thể.

**Chữ đề xuất cho PO** – sổ tay 2.4, bảng "Giữ chỗ quá hạn", dòng "Khách đó tới quầy":

(1) Bước (a), thay:
> **Nhập nơi nhận hoàn** ngay: **Tiền mặt** nếu chủ đầu tư có mặt hoặc sẽ tới quầy trong thời gian khách ở; **Chuyển khoản** nếu không.

bằng:
> **Nhập nơi nhận hoàn** ngay: **Chuyển khoản** (mặc định). **Tiền mặt** chỉ khi chủ đầu tư đang ở quầy, hoặc đã hẹn qua điện thoại một giờ cụ thể tới quầy trong thời gian khách ở.

(2) Bước (d), thay:
> Nói thật với khách và hẹn một trong hai cách: OTTIMO chuyển khoản lại trong ngày sau khi chủ đầu tư duyệt; hoặc khách nhận tiền mặt ở quầy khi chủ đầu tư có mặt trong thời gian ở. Ghi cách đã hẹn vào sổ giao ca, báo chủ đầu tư

bằng:
> Nói thật với khách: "We will transfer your 300,000 VND deposit back to you within 24 hours." / "OTTIMO sẽ chuyển khoản lại 300.000 đ tiền cọc cho anh/chị trong vòng 24 giờ." Chỉ hẹn tiền mặt khi chủ đầu tư đã hẹn giờ tới quầy. Ghi cách hẹn và giờ hẹn vào sổ giao ca, nhắn chủ đầu tư ngay mã đơn và số tiền (không ghi tên khách). Chủ đầu tư hoàn trong lượt kiểm sáng hôm sau, muộn nhất 24 giờ sau khi khách nhận phòng. Desk báo khoản thu chưa đối soát: chủ đầu tư đối soát khoản cọc cũ ở **Nhật ký tiền → Chờ đối soát** trước, rồi mới chi

(UXD được chỉnh câu nói với khách theo brand guideline, nhưng **giữ cam kết 24 giờ**.)

Các chỗ khác cùng câu "trong ngày" (đổi theo):
- Sổ tay 2.4 "Lưu ý", ý "Khách chuyển thiếu": "(tại quầy hoặc chuyển khoản trong ngày)" → "(tiền mặt tại quầy khi chủ đầu tư có mặt, hoặc chuyển khoản trong 24 giờ)".
- `release-notes.md` dòng 121: "(tiền mặt tại quầy hoặc chuyển khoản lại trong ngày)" → "(tiền mặt tại quầy hoặc chuyển khoản lại trong 24 giờ)".
- `release-notes.md` dòng 122: "hẹn chuyển khoản lại trong ngày sau khi anh/chị duyệt, hoặc nhận tiền mặt khi anh/chị có mặt" → "hẹn chuyển khoản lại trong 24 giờ (anh/chị làm trong lượt kiểm sáng), hoặc nhận tiền mặt khi anh/chị đã hẹn giờ tới quầy".
- `day-one-guide.md` mục 10 dòng "Rà giữ chỗ": "người trực hẹn chuyển khoản lại trong ngày sau khi OWN duyệt, hoặc nhận tiền mặt khi OWN có mặt" → "người trực hẹn chuyển khoản lại trong 24 giờ, hoặc nhận tiền mặt khi OWN đã hẹn giờ tới quầy".
- Tờ 2a chỉ ghi "chủ đầu tư hoàn cọc cũ, vắng thì hẹn khách (sổ tay 2.4)": **không đổi**.

Hoàn tiền mặt cho khoản cọc khách đã **chuyển khoản**: chấp nhận được trong cách tạm này. Lý do: cùng khách, cùng kỳ ở; thực chất là trừ vào tiền khách trả ở bước (c); Desk chỉ cho chi khi khoản chuyển khoản đã đối soát. Đây là cách DOM áp BR-522 "hoàn cùng phương thức", không phải ngoại lệ mới.

### D.4 D-QA-4 – Giảm giá/FOC của đơn cũ phải "xin lại": **Người trực tự áp được trong hạn mức quản lý; vượt mức thì OWN duyệt**

Quy tắc:
- BR-432: "Không ai duyệt yêu cầu của chính mình, **trừ khi giá trị nằm trong hạn mức tự áp của vai mình** (… quản lý, chủ đầu tư: theo BR-433)".
- BR-433: hạn mức quản lý = **giá 1 đêm/lần**, không giới hạn tháng. Với giảm giá đặc biệt hay FOC trên một dòng: tổng cộng dồn trên cùng khóa ≤ giá 1 đêm **của dòng đó** (BR-433 (b), cơ sở được bảo vệ BR-433 (d)).
- BR-436 (lễ tân tự miễn minibar) không liên quan ở đây.
- Decision-log 29/10: INV chấp nhận tài khoản 6 vai tự duyệt giảm giá.

Mã khớp quy tắc (`approval.service.ts`):
- `selfApplication` (a): người gửi có vai cao nhất là `manager` (tài khoản 6 vai: `approverRoleOf` lấy vai cao nhất). Khi tổng **≤ hạn mức lần của quản lý**, yêu cầu **tự áp ngay** (`approval.self_applied`), không vào **Cần duyệt**. Hạn mức tháng của quản lý không giới hạn.
- Vượt mức: yêu cầu được chuyển tới `owner`. Tài khoản 6 vai mở yêu cầu đó thì bị chặn (`APPROVAL_LIMIT_EXCEEDED`). Chỉ OWN duyệt được.
- `assertNotSelf`: quy tắc "không có ngoại lệ" chỉ áp cho **hoàn tiền** (`type === 'refund'`). Giảm giá/FOC thì quản lý và OWN được quyết yêu cầu của mình trong hạn mức.
- Tổng miễn/giảm trên lượt ở vượt ngưỡng: Desk báo OWN, không chặn (BR-433 (c)).
- **Chưa QA thử.** DOM đọc mã, khớp sổ tay 1.8 và Tờ 1 ("trong hạn mức của bạn thì Desk áp ngay").

Trong thực tế: giảm giá đặc biệt và FOC tiền phòng tính **theo từng đêm** (một dòng một đêm, `folio_line_id`; BR-434). Một đêm giảm tối đa bằng chính giá đêm đó, nên gần như luôn **nằm trong hạn mức quản lý**, và người trực tự áp được. Ví dụ: đơn cũ căn 301, 3 đêm 720.000 đ, giảm 10 % = 72.000 đ/đêm, hoặc tặng trọn 1 đêm 720.000 đ: Desk áp ngay. Chỉ chờ OWN khi:
- khoản giảm nằm trên dòng **lớn hơn giá 1 đêm** (khoản phát sinh như bồi thường; không có trên giữ chỗ);
- hoặc giá đêm đã nhập tay **cao hơn giá tham chiếu**: cơ sở hạn mức lấy số nhỏ hơn (BR-433 (d)), nên FOC trọn đêm đó có thể vượt mức.

**Chữ đề xuất cho PO** – sổ tay 2.4, khung "Giữ chỗ quá hạn", bước 2 (chưa cọc), ý "Đến từ ngày mai", thay:
> Giảm giá hoặc FOC của đơn cũ phải xin lại (người trực tự duyệt bằng quyền quản lý, có lý do).

bằng:
> Giảm giá hoặc FOC của đơn cũ không tự sang đơn mới: xin lại trên từng đêm của đơn mới, ghi lý do. Trong hạn mức quản lý (mỗi lần không quá giá 1 đêm), Desk áp ngay bằng quyền quản lý của người trực. Desk báo phải chờ chủ đầu tư duyệt: nhắn chủ đầu tư mã đơn và số tiền.

Và cùng dòng bảng "Khách đó tới quầy", bước (b), thêm câu:
> Đơn cũ có giảm giá hoặc FOC: xin lại trên đơn mới như trên, trước khi thu ở bước (c).

**Việc cho QA** (nếu kịp trước C3a): dùng `qa.mgr` gửi giảm giá đặc biệt trên một dòng tiền phòng của giữ chỗ. (1) giảm 10 % một đêm → kỳ vọng tự áp (`approval.self_applied`), không vào **Cần duyệt**. (2) Nếu dựng được ca vượt mức (đêm nhập tay cao hơn giá tham chiếu rồi FOC trọn đêm) → kỳ vọng `required_role = owner`, `qa.mgr` duyệt bị 403 `APPROVAL_LIMIT_EXCEEDED`. Không dựng được thì chỉ cần (1).

### D.5 D-QA-5 – Khách đã chuyển sau hạn một phần cọc: **Đồng ý**, thêm 3 điều

Cách của PO đúng với Desk:
- Ghi tay (chuyển khoản, tiền mặt) vào giữ chỗ quá hạn bị chặn (`deposits.service.ts` ~174: `HOLD_EXPIRED`), nên Desk không ghi khoản này vào đơn cũ.
- **Có một ngoại lệ.** Hộp **Xác nhận cọc** khi chọn VietQR chạy 2 lệnh (`ReservationDialogs.tsx` ~530–575): lệnh 1 `confirmPaymentReceived` **không xét hạn giữ chỗ**, nên ghi khoản VietQR thành "đã thu" trên folio đơn cũ; lệnh 2 `confirmDeposit` mới bị `HOLD_EXPIRED`. Mã VietQR của giữ chỗ còn hiệu lực tới 06:00 hôm sau ngày tạo, nên khách có thể quét **sau hạn giữ chỗ**. Nếu người trực lỡ bấm (trái với "Không bấm xác nhận cọc" ở Tờ 2a), tiền **đã nằm trên đơn cũ**. Ghi lại lần nữa ở (b) là **ghi hai lần**. Vì vậy phải mở đơn cũ kiểm **Đã thu** trước khi ghi (điều 1 dưới).
- Đặt đơn mới chỉ nhận **một** cách thanh toán (`initialPayment`), và phải ≥ **Cọc cần thu** (`DEPOSIT_INSUFFICIENT`). Bước nhận phòng nhận chuyển khoản/POS bằng **đúng** số phải thu.
- Ví dụ: cọc yêu cầu 700.000, đơn cũ đã ghi 300.000, khách lỡ chuyển nốt 400.000 sau hạn. Ở (b) khách chuyển thêm 300.000 → ghi một khoản chuyển khoản 700.000. Ở (c) thu 1.676.000. Ở (d) OWN hoàn 300.000. Tổng khách trả: 300.000 + 400.000 + 300.000 + 1.676.000 − 300.000 = **2.376.000**, đúng bằng tổng đơn.

Thêm 3 điều:
1. **Kiểm trước khi ghi.** (a) Kiểm tiền về theo mục 2.13 (gọi OWN/quản lý xác nhận mã giao dịch và số tiền; 22:00–07:00 ghi chuyển khoản tay, chờ đối soát). (b) Mở **đơn cũ**, xem **Đã thu**. Nếu khoản chuyển sau hạn **đã có** trên đơn cũ (ai đó đã bấm Xác nhận cọc qua VietQR), **không ghi lại** ở bước (b): hủy đơn cũ thì Desk hoàn cả khoản này, và đơn mới thu đủ cọc như khách mới.
2. Ghi bằng **Chuyển khoản** (tay), không chọn VietQR. **Mã giao dịch / ghi chú** ghi cả hai lần chuyển. OWN đối soát **một** dòng Desk với **tổng hai** dòng sao kê.
3. **Khách không chuyển thêm được** (ví dụ không có tài khoản ngân hàng Việt Nam): **không** gộp tiền mặt hay thẻ vào khoản chuyển khoản, vì sẽ làm lệch két và sổ ngân hàng. Thu đủ cọc ở (b) bằng tiền mặt hoặc thẻ. Khoản chuyển sau hạn để ngoài Desk: ghi sổ giao ca, báo OWN. OWN **chuyển trả về đúng tài khoản đã chuyển** trong 24 giờ, như một khoản chuyển nhầm, và ghi vào đối soát. Ca này rất hiếm: cọc thiếu, quá hạn, chuyển sau hạn, khách không chuyển thêm được, và khách đến trước v1.0.1.

**Chữ đề xuất cho PO** – sổ tay 2.4, bảng, ô "Làm gì" của dòng "Khách đã lỡ chuyển nốt **sau** hạn", thay toàn bộ bằng:
> Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Kiểm tiền về như mục 2.13, rồi ghi sổ giao ca: mã đơn, số tiền, giờ tiền về. Mở đơn cũ xem **Đã thu**: khoản này đã có trên đơn cũ (lỡ bấm xác nhận qua VietQR) thì không ghi lại ở bước (b) – Desk hoàn cả khoản này khi hủy đơn cũ. Khi khách đến, làm như dòng trên. Phần đã chuyển ghi ở **bước (b)**, vào **Số tiền đã nhận**, **Cách thanh toán** **Chuyển khoản** (không chọn VietQR), ghi chú "chuyển dd/mm hh:mm". Chưa đủ **Cọc cần thu** (ví dụ đã chuyển 400.000, cọc 700.000): khách chuyển thêm 300.000 ngay, ghi chung **một** khoản chuyển khoản 700.000, ghi chú cả hai lần chuyển. Khách không chuyển thêm được: không gộp tiền mặt hay thẻ vào khoản này. Thu đủ cọc bằng tiền mặt hoặc thẻ; khoản đã chuyển sau hạn ghi sổ giao ca, chủ đầu tư chuyển trả về đúng tài khoản đã chuyển trong 24 giờ. Bước (c) chỉ thu phần còn lại

Cột "Ai, hạn" giữ nguyên. OWN đối chiếu sao kê sáng hôm sau: một dòng Desk khớp tổng hai dòng sao kê.

**Việc cho QA** (đọc mã, chưa thử – QA quyết có ghi lỗi không và mức nào): sau hạn giữ chỗ, **Xác nhận cọc** chọn VietQR ghi khoản thành "đã thu" trên đơn cũ rồi mới báo `HOLD_EXPIRED`, tức là làm được một nửa. Hộp không nói tiền đã được ghi. DOM đề xuất: ghi tiền vẫn đúng (tiền đã về thật), nhưng hộp phải báo rõ "Đã ghi … vào đơn; đơn chưa xác nhận được". Nên gộp vào bản sửa BUG-R3-042/044 ở v1.0.1. Kiểm được khi có VietQR thật, hoặc trên stack có đồng hồ giả.

### D.6 Thêm – Bước (b) phải cùng kênh và CTV

QA đặt đơn thay bằng kênh **Khách vãng lai** (20.2 dòng 8). Sổ tay 2.4 (b) chỉ ghi "cùng căn, nhập đúng giá". Nếu đơn cũ do **CTV** chốt mà đơn mới chọn Trực tiếp/Khách vãng lai:
- CTV mất hoa hồng (ESC-017);
- báo cáo kênh ghi sai một khách vãng lai mới.

Tình huống này hay gặp vì CTV giữ chỗ hộ khách (A.1).

**Chữ đề xuất cho PO** – sổ tay 2.4, bước (b), thay:
> (b) **Đặt phòng mới** cùng căn, nhập đúng giá từng đêm đã chốt.

bằng:
> (b) **Đặt phòng mới** cùng căn, nhập đúng giá từng đêm đã chốt, **cùng Kênh và Nguồn / CTV chốt đơn** như đơn cũ (không chọn **Khách vãng lai**).

**Tờ 2a** (tùy PO, không bắt buộc). Đổi chữ cho **ngắn hơn** (31 → 28 ký tự), không thể tràn tờ 0 mm. Trong `staff-one-pager.md` và `print/to-2a-2b-a4-cat-doi.html`, thay "đặt đơn mới cùng căn, cùng giá," bằng "đặt mới cùng căn, giá, kênh,". Câu thành: "Khách đến: hủy đơn cũ → đặt mới cùng căn, giá, kênh, **thu đủ cọc ngay** → …". PO chạy lại bộ dựng để kiểm. Nếu PO không đổi: Tờ 2a đã trỏ sổ tay 2.4, chấp nhận được.

`release-notes.md` dòng 121 cũng có "đặt đơn mới cùng căn, cùng giá": đổi theo nếu PO đổi Tờ 2a.

### D.7 Việc ORC nói với INV ở buổi C3a (thông tin, không lập ESC)

- Decision-log 29/10 ghi INV chấp nhận người trực "tự ghi và tự duyệt giảm giá/**hoàn tiền**". Phần **hoàn tiền** không làm được ở v1.0: quy tắc tách nhiệm SEC F8 chặn, không có ngoại lệ (QA 20.2).
- Hệ quả cho INV:
  - **mọi** khoản hoàn (hủy đơn có cọc, trả sớm, khách trả thừa) chờ INV duyệt và chi;
  - INV cần đối soát chuyển khoản mỗi sáng thì mới chi được;
  - hoàn chuyển khoản cần máy được cấp quyền;
  - khách được hẹn hoàn trong 24 giờ.
- Phần **giảm giá/FOC** vẫn đúng như INV chấp nhận, trong hạn mức quản lý.
- Đồng ý với PO: chưa lập ESC. INV muốn người trực tự hoàn tại quầy thì đó là đổi F8 (SEC + INV), không vào v1.0.1.
- Đề nghị ORC thêm một dòng decision-log ghi rõ phần "hoàn tiền" của dòng 29/10 không áp được (D.9).

### D.8 Ảnh hưởng bản in

| Tờ | Đổi? | Ghi chú |
|---|---|---|
| 1 – Quầy lễ tân | **Không** | Dòng "Miễn, giảm…" và "Hoàn tiền…" đã đúng với D-QA-2, D-QA-4 |
| 2a – Tạm tới v1.0.1 | **Không bắt buộc** | D-QA-1, 3, 4, 5 chỉ sửa sổ tay. Tùy chọn D.6: đổi chữ ngắn hơn 3 ký tự; nếu đổi, chạy lại `build_print_sheets.py --pdf` |
| 2b, 3, 4 | Không | – |

OWN in lại Tờ 1, 2a/2b ngày 01/11 như PO 10.3. Nếu PO áp D.6 thì in từ PDF dựng lại sau khi sửa.

### D.9 Dòng decision-log đề xuất (ORC ghi khi commit, nhãn DOM)

`| 2026-10-30 | 3 | **DOM – xác nhận tài liệu ngày D sau QA thử luồng giữ chỗ quá hạn** (DOM-on-PO-v1.0.0-docs.md mục D): (1) lý do hủy tạm "Không liên lạc được"/"Khách đổi ý" – đồng ý; K-22a không lệch tỉ lệ, chỉ lệch phần chia theo lý do; S7 kỳ 02/11 → v1.0.1 tách lại bằng status_before_cancel = hold và cancelled_at ≥ hold_expires_at; (2) người tạo yêu cầu hoàn không tự duyệt, không tự chi – OWN duyệt và chi (sửa DOM A.3); (3) hẹn khách hoàn cọc khi OWN vắng: chuyển khoản **trong 24 giờ** (không "trong ngày"), tiền mặt chỉ khi OWN đã hẹn giờ; OWN đối soát cọc cũ trước khi chi (REFUND_SOURCE_NOT_RECONCILED); (4) giảm giá/FOC xin lại: tài khoản 6 vai tự áp trong hạn mức quản lý (≤ giá 1 đêm của dòng), vượt mức OWN duyệt; (5) cọc chuyển sau hạn ghi một khoản Chuyển khoản ở bước đặt đơn mới, không gộp tiền mặt; (6) đơn đặt lại cùng kênh/CTV như đơn cũ. Phần "tự duyệt hoàn tiền" của dòng INV 29/10 không áp được ở v1.0 (SEC F8) | DOM | Quyền DOM (tính đúng nghiệp vụ); không đổi chính sách ESC-006, không đổi SEC F8 |`

### D.10 Giả định

- [GIẢ ĐỊNH] D-QA-4 và phần `REFUND_SOURCE_NOT_RECONCILED` ở D-QA-3 dựa trên đọc mã `v1.0.0`, chưa thử trên staging.
- [GIẢ ĐỊNH] OWN chưa có laptop được cấp quyền dùng ngoài cơ sở. Nếu có, OWN hoàn được sớm hơn, nhưng vẫn giữ câu hẹn 24 giờ với khách.
- [GIẢ ĐỊNH] Trả lại một khoản chuyển khoản chưa ghi trên Desk về đúng tài khoản người chuyển là việc của OWN trên ứng dụng ngân hàng, ngoài Desk (D-QA-5 điều 3). Nhật ký nằm ở sổ giao ca và ghi chú đối soát.

## E. Điểm làm tốt

1. PO **không cho lễ tân tự hủy đơn có cọc** và giữ trần 12:00 ngày đến. Đây đúng là điều cốt lõi của BR-303 / D-9.
2. Mỗi biện pháp tạm (rà 0h00, tạm dừng link, B1–B6) gắn với **bản sửa** chứ không gắn với ngày. Cách viết này nên giữ cho mọi known issue.
3. Câu đồng ý EN/VI ngắn và đọc được tại quầy. "Đọc đúng số Desk hiện" tránh hứa sai hạn lưu với khách.
