# FB-INV-012 – Quy tắc phiếu thanh toán hằng tháng khách dài hạn (DOM)

- Tác giả: DOM | Round 5 – Sản xuất | Ngày: 17/11/2026 | Đầu vào: FB-INV-012, FB-INV-010 (+ phụ lục CPY 16/11), `business-rules.md` v0.5.17 (chỉ đọc), decision-log 16–17/11.
- Mọi số tiền dưới đây là **ví dụ** (căn, khách, chỉ số đều giả), không phải dữ liệu thật.
- Nhãn: **INV** = INV đã chốt · **NGÀNH** = cách làm phổ biến, DOM tự quyết · **ĐỀ XUẤT** = DOM đề xuất, đội làm theo tới khi INV/kế toán nói khác · **CẦN XÁC NHẬN** = pháp lý/thuế.
- Khi gộp vào `business-rules.md` (DOM làm sau khi phần sửa đang dở của người khác đã commit), các quy tắc này **thay** BR-501 (5.000/kWh, nước theo người, gồm VAT), BR-502 (nước nay theo đồng hồ), BR-504 (hạn 5 ngày → hết ngày 05), giá dọn ở BR-204/BR-506, và cọc 24 tháng = 2 tháng ở BR-206 (nay cọc 1 tháng mọi kỳ hạn – FB-INV-010).

## 1. Kỳ và nội dung phiếu

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-01 | **Kỳ = tháng lịch**, chốt ngày cuối tháng (BR-207, ESC-045 câu 5). Một HĐ có **một phiếu mỗi tháng**, phát hành từ ngày 01, **hạn hết ngày 05**. **ĐỀ XUẤT (đã khớp BR-207)**: phiếu tháng M gồm **tiền thuê tháng M trả trước** + **điện, nước tháng M−1 trả sau** (theo chỉ số thực) + **dịch vụ phòng dùng trong tháng M−1** chưa thu. Đây là cách phổ biến khi cho thuê dài hạn ở VN: chủ nhà luôn thu trước tiền nhà, cọc chỉ để bù hư hỏng và khoản cuối. *Phương án khác*: trả sau toàn bộ (phiếu tháng M−1 gồm cả tiền thuê M−1) – một kỳ gọn hơn nhưng khách ở trước trả sau, cọc phải gánh cả tiền thuê lẫn điện nước nếu khách bỏ đi; không đề xuất. | Phiếu 12/2026 phát hành 01/12, hạn 05/12: tiền thuê 01–31/12 + điện nước 01–30/11 + dọn thêm tháng 11 |
| BR-LS-02 | **Nhắc và quá hạn** (INV): ngày 05 Desk nhắc "đến hạn hôm nay"; từ 06 phiếu chưa thu đủ → **Quá hạn**, hiện ở "Cần chú ý"; quá hạn 3 ngày (08) cảnh báo đỏ cho quản lý, 10 ngày quản lý xử lý theo HĐ (BR-207). Desk **không tự khóa cửa** khách vì nợ. | Phiếu 12/2026 chưa thu → 06/12 Quá hạn, 08/12 đỏ |
| BR-LS-03 | **Kỳ đầu – vào giữa tháng** (NGÀNH + BR-210): phần lẻ tính ngày = tiền thuê tháng ÷ 30 × số ngày (từ ngày vào tới hết tháng, gồm hai đầu), làm tròn 1.000. Chỉ số điện nước đầu tiên ghi **lúc nhận phòng**. Điện nước của phần lẻ vào phiếu ngày 01 kế tiếp. Phần lẻ thu khi nào: xem **câu hỏi 1** (ESC-047 còn mở). | Thuê 8.500.000, vào 20/11: 283.000 × 11 = **3.113.000** |
| BR-LS-04 | **Kỳ cuối – trả phòng giữa tháng**: phiếu ngày 01 của tháng trả phòng chỉ thu tiền thuê **tới ngày trước ngày trả phòng**; số tiền = tiền thuê × số tháng HĐ − tổng đã thu các kỳ trước (khử lệch làm tròn, BR-210). Ngày trả phòng ghi chỉ số cuối → **bill quyết toán** (BR-214) = điện nước từ 01 tới ngày trả + dịch vụ chưa thu + phạt/bồi thường (BR-511) − **cọc**; dương thu thêm, âm hoàn trong 7 ngày làm việc (BR-522). Trả **trước hạn HĐ**: cọc mất theo BR-313, các khoản trên thu riêng, không trừ vào cọc (ESC-048 còn mở). | Vào 20/11, 3 tháng, trả 20/02: phiếu 02/2027 tiền thuê = 25.500.000 − 20.113.000 = **5.387.000** (01–19/02) |
| BR-LS-05 | **Cọc = 1 tháng tiền thuê của HĐ** (INV), mọi kỳ hạn. Cọc **không** dùng để trừ phiếu hằng tháng khi khách còn ở; chỉ trừ ở bill quyết toán. Cọc không xuất hóa đơn cho tới khi bị khấu trừ (BR-523). | Cọc 8.500.000; quyết toán: điện nước 01–20/02 412.000 + mất 1 thẻ 200.000 → hoàn **7.888.000** |
| BR-LS-06 | **Không giảm giá theo thời hạn** (INV): tiền thuê trên phiếu = tiền thuê tháng **ghi trên HĐ**; phiếu không tự tính lại giá. Đổi giá giữa HĐ chỉ qua phụ lục HĐ (MGR+). | – |

## 2. Đơn giá, thuế, làm tròn

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-07 | **Tham số OWN** (có ngày hiệu lực, không gõ cứng): điện **4.000 đ/kWh**, nước **25.000 đ/m³** – **chưa VAT** (INV); dọn phòng thêm Studio City/Garden **150.000**, Premium/Signature **200.000**/lần – **đã gồm VAT** như mọi giá niêm yết (BR-523; ĐỀ XUẤT). Phiếu dùng đơn giá hiệu lực tại **ngày cuối kỳ** của dòng đó; đổi đơn giá không đụng phiếu đã phát hành. | Đổi điện lên 4.200 từ 01/01/2027 → điện tháng 12 (chốt 31/12) vẫn 4.000 |
| BR-LS-08 | **VAT theo loại dòng** (tham số `vat_rate` có ngày hiệu lực, OWN chỉnh). **ĐỀ XUẤT mặc định**: tiền thuê và dọn phòng **đã gồm VAT** (không cộng thêm; bill ghi "đã gồm VAT"); **điện cộng 8 %** (10 % từ 01/01/2027 nếu mức giảm 2 % theo NQ 204/2025/QH15 hết hạn 31/12/2026); **nước cộng 5 %** (mức thường áp cho nước sạch). Thuế suất lấy theo **ngày phát hành phiếu** (trùng ngày xuất hóa đơn, BR-523). **CẦN XÁC NHẬN – kế toán**: (a) điện nước thu lại của khách lưu trú xuất hóa đơn theo thuế suất của hàng hóa (điện, nước) hay gộp vào dịch vụ lưu trú (8/10 %); (b) điện có thuộc diện giảm 2 % không; (c) giá điện bán lại cho người thuê dài hạn có bị giới hạn theo giá bán lẻ sinh hoạt không (DOM đã ghi ở BR-501; 4.000 chưa VAT theo DOM hiểu cao hơn bậc cao nhất). | Điện 142 kWh × 4.000 = 568.000, VAT 8 % 45.440 · Nước 3,4 m³ × 25.000 = 85.000, VAT 5 % 4.250 |
| BR-LS-09 | **Làm tròn** (ĐỀ XUẤT): mỗi dòng tính đến **đồng** (VND số nguyên, BR-004), VAT tính theo dòng và làm tròn đến đồng – khớp hóa đơn điện tử. **Tổng phải thu làm tròn xuống 1.000**, phần lẻ in thành dòng "Làm tròn" (luôn có lợi cho khách, không thu quá hóa đơn). Cách thể hiện phần làm tròn trên hóa đơn: kế toán xác nhận. | Tổng 9.502.690 → thu **9.502.000**, dòng "Làm tròn −690" |

## 3. Chỉ số đồng hồ

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-10 | **Mỗi căn một đồng hồ điện và một đồng hồ nước riêng** [GIẢ ĐỊNH – nếu có căn dùng chung đồng hồ thì báo DOM, cần quy tắc chia]. Chỉ số **đầu kỳ tự lấy chỉ số cuối kỳ trước**, không cho gõ; kỳ đầu lấy chỉ số ghi lúc nhận phòng. Chốt ngày cuối tháng, cho phép **từ ngày cuối tháng tới hết ngày 01** (khách vắng, lễ tân nghỉ); chỉ số ghi ngày 01 vẫn tính cho kỳ trước. Ghi người nhập và giờ nhập. | Kỳ 11: đầu 1.250 (lúc nhận 20/11), cuối 1.392 (30/11) |
| BR-LS-11 | **Số lẻ** (NGÀNH): điện **kWh nguyên**; nước **m³ một chữ số thập phân**. Lễ tân ghi số đọc được, **bỏ phần lẻ** (không làm tròn lên) – phần lẻ tự sang kỳ sau nên không mất của ai. | Đồng hồ nước 38,67 → ghi 38,6 |
| BR-LS-12 | **Cuối < đầu → chặn lưu**. Lễ tân chọn một trong ba: *Nhập sai* (sửa lại số), *Thay đồng hồ*, *Đồng hồ quay vòng*. Hai lý do sau cần **MGR+ duyệt**. **Thay đồng hồ**: ghi chỉ số cuối đồng hồ cũ + chỉ số đầu đồng hồ mới + ngày thay; tiêu thụ = (cuối cũ − đầu kỳ) + (cuối kỳ − đầu mới). **Quay vòng**: tiêu thụ = (số tối đa + 1 − đầu) + cuối. **Tiêu thụ bất thường** (> 2 lần trung bình 3 kỳ trước, hoặc > 300 kWh / > 10 m³ khi chưa có lịch sử) → cảnh báo kiểm lại trước khi phát hành (BR-503). | Thay ngày 15/11: cũ 1.250→1.310, mới 0→82 → 60 + 82 = **142 kWh** |
| BR-LS-13 | **Ảnh đồng hồ** (ĐỀ XUẤT, giữ BR-502): **bắt buộc** cho chỉ số lúc nhận phòng, cuối kỳ, trả phòng và thay đồng hồ – là bằng chứng khi khách thắc mắc. Ảnh chỉ chụp mặt đồng hồ, không chụp người, giấy tờ. Lưu hết HĐ + 12 tháng [GIẢ ĐỊNH – SEC xem]. Không có ảnh vẫn lưu được nếu MGR+ cho phép với ghi chú. | – |

## 4. Dịch vụ phòng, phát hành, sửa phiếu

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-14 | **Dịch vụ phòng "dùng trong kỳ"** = dòng folio của HĐ có **ngày dịch vụ trong tháng M−1**, **chưa thu**, giá > 0: dọn phòng thêm, minibar (BR-703), giặt ủi nếu có, phí phạt/bồi thường đã ghi (BR-511: khử mùi, thẻ phòng). **Không lấy**: dòng đã thu ngay, dòng FOC/miễn, cọc, tiền thuê (lấy từ HĐ), dòng ngày dịch vụ từ ngày 01 tháng M (sang phiếu sau). Lễ tân xem danh sách và được bỏ một dòng sang kỳ sau, không sửa giá; miễn/giảm đi theo FOC (BR-432/433). | Dọn thêm 12/11 và 26/11, Studio → 2 × 150.000 = **300.000** |
| BR-LS-15 | **Trạng thái phiếu**: Nháp → Đã phát hành → Đã thu một phần → Đã thu đủ; hoặc Đã hủy. Phát hành = ghi vào folio, khóa số, cấp **mã phiếu** riêng (ví dụ `TT-2612-<số căn>`), in/gửi được (bill song ngữ EN dẫn – VI, brand OTTIMO, VietQR có mã phiếu trong nội dung chuyển khoản). Thu nhiều lần được; mỗi lần ghi phương thức (VietQR/tiền mặt), số tiền, người thu, giờ. Đánh dấu thu **khi đã thấy tiền** (Desk chưa đối soát ngân hàng tự động). | – |
| BR-LS-16 | **Sửa phiếu đã phát hành: không sửa đè.** Chưa thu đồng nào → **Hủy** (bắt buộc lý do) và tạo phiếu mới mã mới, ghi "thay phiếu X"; phiếu cũ giữ lại xem được. **Đã thu** (một phần hay đủ) → không hủy; chênh lệch vào phiếu kỳ sau thành dòng **"Điều chỉnh kỳ trước"** (âm hoặc dương, kèm lý do). Kỳ cuối (không còn phiếu sau) → điều chỉnh vào bill quyết toán. | Ghi nhầm 1.932 thay 1.392 → hủy, phiếu mới |

## 5. Ai được làm gì

| Việc | Lễ tân | Lễ tân trưởng / MGR | OWN |
|---|---|---|---|
| Nhập chỉ số, ảnh; tạo nháp; phát hành; in/gửi | Có | Có | Có |
| Đánh dấu đã thu (VietQR, tiền mặt) | Có | Có | Có |
| Duyệt thay đồng hồ / quay vòng / thiếu ảnh | – | Có | Có |
| Hủy phiếu chưa thu (có lý do) | – | Có | Có |
| Dòng "Điều chỉnh kỳ trước" | – | Có | Có |
| Đổi đơn giá điện, nước, dọn phòng, % VAT | – | – | Có (ghi nhật ký, có ngày hiệu lực) |

## 6. Câu hỏi cho INV (tối đa 3, gom cuối round)

1. **Khách vào giữa tháng: tiền phần lẻ thu lúc nào?** (thay cách hỏi ESC-047 cho khớp phiếu hằng tháng) – **Đề xuất B**: cọc 1 tháng lúc xác nhận phòng; ngày nhận phòng thu **phần lẻ** tới hết tháng; từ ngày 01 kế tiếp phiếu đều đặn. *A (đề xuất cũ)*: ngày nhận phòng thu phần lẻ + trọn tháng sau. *C*: chỉ cọc, phần lẻ gộp vào phiếu ngày 01. DOM đổi đề xuất sang B vì mỗi tháng có đúng một phiếu, dễ nhìn cho khách và lễ tân. Ví dụ vào 20/11 (8.500.000): B thu 3.113.000 ngày 20/11; A thu 11.613.000.
2. **Phí dịch vụ 200.000/tháng (BR-204, bảng giá 01/11) còn thu không?** INV liệt kê phiếu gồm thuê, điện, nước, dịch vụ phòng – không nhắc khoản này, landing ghi giá tháng "Taxes included". **Đề xuất: bỏ**, coi như đã gồm trong giá tháng (wifi, rác, an ninh), để giá khách thấy trên landing là giá họ trả, chỉ cộng điện nước và dịch vụ dùng thêm.
3. **Nhờ kế toán xác nhận VAT điện nước** trước khi phát hành phiếu đầu tiên: **đề xuất** điện 8 % (10 % từ 01/01/2027), nước 5 %, tiền thuê và dọn phòng đã gồm VAT; cùng lúc xác nhận giá điện 4.000 đ/kWh có bị giới hạn theo giá bán lẻ cho người thuê không. Tới khi có trả lời, Desk dùng mức đề xuất (tham số OWN đổi được, không cần sửa mã).
