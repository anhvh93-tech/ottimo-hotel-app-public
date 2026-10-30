# DOM review PO – Tài liệu vận hành theo `v1.0.0` (D-T1): giữ chỗ "0h00", one-pager, day-one mục 10

- Người review: DOM | Round 3 – bước **Review** (điều kiện D-T1 của cổng QC v1.0, `rounds/round-03/qc/v1-gate.md` mục 4.2) | Ngày: 30/10/2026 | Ngày D: thứ Hai 02/11
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
| Người trực quầy, với quyền quản lý của tài khoản 6 vai | Quyết đơn có cọc thiếu, duyệt hoàn | Ngay khi gặp; ghi lý do trên Desk và một dòng sổ giao ca |
| **OWN** | Xem lại các dòng sổ giao ca có chữ "giữ chỗ" và các yêu cầu hoàn mới | Cùng lượt kiểm sáng B1–B6, trước 09:00 |
| CTV chốt đơn | Nhận báo từ người trực, liên hệ khách của mình | Trong 1 giờ kể từ khi người trực nhắn. Quá 1 giờ, hoặc đã 11:00 ngày đến, người trực gọi thẳng số khách trên đơn |

Không gọi là "đầu mỗi ca" vì OTTIMO chưa chia ca. Mốc 11:00 là mốc quan trọng nhất: giữ chỗ của khách đến hôm nay hết hạn muộn nhất 12:00 (BR-302).

### A.2 Phòng trước (lối chính ở v1.0)

Từ thẻ 01–02: ở v1.0, cách duy nhất để một giữ chỗ có cọc thành **Đã xác nhận** là **đủ cọc trước hạn**. Vì vậy:
1. Khách chuyển thiếu: ghi số đã nhận (đơn vẫn **Giữ chỗ · chờ cọc**), **gọi hoặc nhắn khách ngay trong ngày** xin phần còn lại trước hạn.
2. Khách cần thêm thời gian: bấm **Gia hạn giữ chỗ (1 lần)** **trước** hạn (tối đa +24 giờ, không quá 12:00 ngày đến). Sau hạn, nút này không còn.
3. Tiền về trước hạn nhưng chưa kịp bấm: **bấm trước giờ hạn**. Ghi tay (chuyển khoản, tiền mặt) sau hạn thì Desk từ chối, kể cả khi tiền đã về lúc trước hạn: hộp Xác nhận cọc không có ô giờ nhận tiền (thẻ 01). Sau hạn, chỉ khoản **VietQR mà Desk đã ghi "đã về" trước hạn** mới xác nhận được.
4. Khách nói "trả phần còn lại khi đến": ở v1.0 **không giữ chỗ cọc thiếu tới ngày đến được**. Nói thật với khách và chọn một trong hai: (a) khách chuyển nốt trước hạn; (b) giữ đơn theo A.3 và báo khách rằng **khi nhận phòng sẽ thanh toán đủ, khoản đã chuyển được hoàn lại ngay tại quầy hoặc trong ngày**.

### A.3 Giữ chỗ **đã có cọc** hiện 0h00 đỏ – ba lối ra BR-303 ở v1.0

Đơn ví dụ: căn 202, 3 đêm 05–08/11 = 2.376.000 đ, cọc yêu cầu 700.000 đ, khách đã chuyển 300.000 đ, hạn 10:00 03/11.

| Khách nói | Làm gì ở v1.0 | Ai | Hạn |
|---|---|---|---|
| "Không đi nữa", hoặc không liên lạc được tới **11:00 ngày đến** | **Hủy giữ chỗ**, lý do **Khác**, ghi chú "Hết hạn giữ chỗ – có cọc". Desk giữ lại 0 đ, sinh yêu cầu hoàn **300.000 đ**. Duyệt hoàn, hoàn theo cách khách đã trả (BR-303 (3), BR-522) | Người trực hủy và duyệt; tiền mặt thì OWN chi (Desk không cho người tạo yêu cầu tự chi) | Muộn nhất 12:00 ngày đến |
| "Vẫn đi, trả nốt" (chuyển nốt, hoặc trả khi đến) | **Không** nhận thêm chuyển khoản vào đơn cũ: Desk không ghi được sau hạn. **Để nguyên đơn** (Desk không tự hủy đơn có cọc, căn vẫn giữ). Ghi **Ghi chú nội bộ**: "Giữ – cọc thiếu 400.000, thu khi đến – [tên] dd/mm". Báo khách: "Phần còn lại anh/chị thanh toán khi nhận phòng" | Người trực (quyền quản lý), có lý do | Quyết trước 12:00 ngày đến |
| Khách đó tới quầy (đơn vẫn **Giữ chỗ**) | **Nếu v1.0.1 đã lên**: **Xác nhận đã nhận cọc** phần còn lại → **Nhận phòng**. **Nếu chưa**: (a) **Hủy giữ chỗ** (lý do **Khác**, ghi chú "Tạo lại khi khách đến – cọc thiếu") → Desk sinh yêu cầu hoàn 300.000. (b) **Đặt phòng mới** cùng căn, cùng giá đã chốt, ghi chú "Thay OTM-…". (c) Thu **đủ 2.376.000** → **Nhận phòng**. (d) Duyệt hoàn 300.000: OWN chi tiền mặt tại quầy (khách thực trả 2.076.000), hoặc OWN chuyển khoản lại trong ngày | Người trực (a–c); OWN chi hoàn (d) | Khi khách đến |
| Khách đã lỡ chuyển nốt **sau** hạn | Tiền đã ở tài khoản OTTIMO nhưng Desk không ghi được vào đơn cũ. Ghi sổ giao ca: số tiền, giờ về, mã đơn. Khi khách đến, làm như dòng trên, ghi phần đã chuyển ở bước (c) với ghi chú "chuyển dd/mm hh:mm" | Người trực; OWN đối chiếu sao kê sáng hôm sau | Khi khách đến |

Vì sao chọn "để nguyên đơn rồi làm lại khi khách đến" thay vì làm lại ngay:
- Căn vẫn được giữ, không ai bán mất.
- Tiền chỉ đi một vòng (hoàn rồi thu lại) vào lúc khách có mặt.
- Mỗi đồng tiền đều nằm trên Desk.
- Trường hợp này hiếm: phải cọc thiếu, quá hạn, và khách đến trước khi v1.0.1 lên.

Không dùng "sửa giá đêm cho cọc yêu cầu thấp xuống để xác nhận". Cách đó làm sai giá và doanh thu.

Ba điều tài liệu phải nói rõ (từ BA M13-01):
- **Hủy đơn cũ trước, đặt đơn mới sau.** Thông báo lỗi `HOLD_EXPIRED` nói "căn đã mở bán lại", nhưng với đơn có cọc thì **sai**: đơn cũ vẫn giữ căn và giữ tiền. Đặt đơn mới trước sẽ bị chặn trùng, hoặc ghi cọc hai lần.
- Hộp hủy của đơn có cọc vẫn ghi "Không thu phí (giữ chỗ chưa cọc)" và không hiện dòng hoàn. **Desk vẫn tạo yêu cầu hoàn đủ số đã nhận**. Sau khi hủy, mở **Nhật ký tiền → Hoàn tiền** để thấy và duyệt.
- **Duyệt hoàn ≠ chi hoàn.** Tài khoản 6 vai tự duyệt được. Nhưng Desk không cho người tạo yêu cầu tự chi tiền mặt, nên chi tiền mặt tại quầy cần OWN. OWN không ở cơ sở thì OWN chuyển khoản lại cho khách trong ngày, và báo khách trước.

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

1. **Hủy ngay** khi thấy, không chờ gọi khách: **Hủy giữ chỗ**, lý do **Khác**, ghi chú "Hết hạn giữ chỗ" (Desk không cho chọn lý do "Hết hạn giữ chỗ", xem thẻ 07). Không phí (BR-308). Căn mở lại.
2. Nhắn hoặc gọi khách (đơn CTV thì báo CTV trước, theo A.1). Khách còn muốn:
   - **Ngày đến từ ngày mai:** tạo **giữ chỗ mới**.
     - Báo giá cũ còn hiệu lực (3 ngày, BR-304): bấm lại **Khách đồng ý – Giữ chỗ** từ báo giá đó. Hết hiệu lực: **Lập báo giá mới** theo giá hiện hành.
     - Chọn **12 h** (ngắn nhất).
     - Giảm giá hoặc FOC của đơn cũ phải xin lại. Tài khoản 6 vai tự duyệt, có lý do; OWN rà sáng hôm sau.
     - Ghi chú nội bộ: "Tạo lại từ OTM-… (hết hạn dd/mm)".
   - **Ngày đến hôm nay:** không giữ chỗ được (BR-302). Gửi VietQR, tạo đơn khi tiền về. Khách đang trên đường: căn còn thì nhận khi tới, như khách vãng lai.
3. **Chỉ tạo lại một lần** cho cùng khách và cùng kỳ ở. Giữ chỗ tạo lại mà lại quá hạn: hủy, không giữ nữa. Chỉ đặt khi tiền cọc đã về.
4. **Không cần báo quản lý.** Lễ tân được hủy giữ chỗ chưa cọc và không bị giới hạn số giữ chỗ (BR-302). Báo OWN chỉ khi khách đòi **giữ giá cũ** mà báo giá đã hết hiệu lực và giá hiện hành cao hơn.

Ví dụ: giữ chỗ căn 301 có giảm giá đặc biệt 10 %, đến 08/11, hạn 20:00 04/11. Lúc 08:30 05/11 vẫn 0h00 đỏ:
- 08:30 hủy (Khác – "Hết hạn giữ chỗ").
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

## D. Điểm làm tốt

1. PO **không cho lễ tân tự hủy đơn có cọc** và giữ trần 12:00 ngày đến. Đây đúng là điều cốt lõi của BR-303 / D-9.
2. Mỗi biện pháp tạm (rà 0h00, tạm dừng link, B1–B6) gắn với **bản sửa** chứ không gắn với ngày. Cách viết này nên giữ cho mọi known issue.
3. Câu đồng ý EN/VI ngắn và đọc được tại quầy. "Đọc đúng số Desk hiện" tránh hứa sai hạn lưu với khách.
