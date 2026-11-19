# FB-INV-012 – Quy tắc phiếu thanh toán hằng tháng khách dài hạn (DOM)

- Tác giả: DOM | Round 5 – Sản xuất 17/11; **cập nhật 18/11** (Phản hồi & sửa: INV 17/11 và 18/11, contract ARC §11, thêm BR-LS-17) | Đầu vào: FB-INV-012, FB-INV-010 (+ phụ lục CPY 16/11), `business-rules.md`, decision-log 16–18/11, `contract.md` §11, `DOM-late-entry-proposal.md`.
- **Đã gộp vào `product/docs/business-rules.md` v0.5.18 mục 3A** (18/11). Từ nay `business-rules.md` là nguồn chính; file này giữ để tra lịch sử FB-INV-012.
- Mọi số tiền dưới đây là **ví dụ** (căn, khách, chỉ số đều giả), không phải dữ liệu thật.
- Nhãn: **INV** = INV đã chốt · **NGÀNH** = cách làm phổ biến, DOM tự quyết · **ĐỀ XUẤT** = DOM đề xuất, đội làm theo tới khi INV/kế toán nói khác · **CẦN XÁC NHẬN** = pháp lý/thuế.
- Các quy tắc này **thay** BR-501 (5.000/kWh, nước theo người, gồm VAT), BR-502 (nước nay theo đồng hồ), BR-504 (hạn 5 ngày → hết ngày 05), giá dọn thuê tháng ở BR-204/BR-506, phí dịch vụ 200.000/tháng ở BR-204/BR-207/BR-208 (bỏ – INV 17/11), và cọc 24 tháng = 2 tháng ở BR-206 (nay cọc 1 tháng mọi kỳ hạn – FB-INV-010).

## 1. Kỳ và nội dung phiếu

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-01 | **Kỳ = tháng lịch**, chốt ngày cuối tháng (BR-207, ESC-045 câu 5). Một HĐ có **một phiếu mỗi tháng**, phát hành từ ngày 01, **hạn hết ngày 05**. **ĐỀ XUẤT (đã khớp BR-207)**: phiếu tháng M gồm **tiền thuê tháng M trả trước** + **điện, nước tháng M−1 trả sau** (theo chỉ số thực) + **dịch vụ phòng dùng trong tháng M−1** chưa thu. Đây là cách phổ biến khi cho thuê dài hạn ở VN: chủ nhà luôn thu trước tiền nhà, cọc chỉ để bù hư hỏng và khoản cuối. *Phương án khác*: trả sau toàn bộ (phiếu tháng M−1 gồm cả tiền thuê M−1) – một kỳ gọn hơn nhưng khách ở trước trả sau, cọc phải gánh cả tiền thuê lẫn điện nước nếu khách bỏ đi; không đề xuất. | Phiếu 12/2026 phát hành 01/12, hạn 05/12: tiền thuê 01–31/12 + điện nước 01–30/11 + dọn thêm tháng 11 |
| BR-LS-02 | **Nhắc và quá hạn** (INV): ngày 05 Desk nhắc "đến hạn hôm nay"; từ 06 phiếu chưa thu đủ → **Quá hạn**, hiện ở "Cần chú ý"; quá hạn 3 ngày (08) cảnh báo đỏ cho quản lý, 10 ngày quản lý xử lý theo HĐ (BR-207). Desk **không tự khóa cửa** khách vì nợ. | Phiếu 12/2026 chưa thu → 06/12 Quá hạn, 08/12 đỏ |
| BR-LS-03 | **Kỳ đầu – vào giữa tháng** (NGÀNH + BR-210): phần lẻ tính ngày = tiền thuê tháng ÷ 30 × số ngày (từ ngày vào tới hết tháng, gồm hai đầu), làm tròn 1.000. Chỉ số điện nước đầu tiên ghi **lúc nhận phòng**. Điện nước của phần lẻ vào phiếu ngày 01 kế tiếp. **Phần lẻ thu ngay lúc nhận phòng** (INV 17/11, phương án B của câu hỏi 1, thay ESC-047): lúc xác nhận thu cọc 1 tháng, lúc nhận phòng thu phần lẻ, từ ngày 01 kế tiếp mỗi tháng một phiếu. Khách đã ở trước khi có Desk và đã trả tháng đang ở ngoài Desk: **không** phát hành phiếu tháng nhận phòng (INV 18/11, xem `go-live-guide.md`). | Thuê 8.500.000, vào 20/11: 283.000 × 11 = **3.113.000** |
| BR-LS-04 | **Kỳ cuối – trả phòng giữa tháng**: phiếu ngày 01 của tháng trả phòng chỉ thu tiền thuê **tới ngày trước ngày trả phòng**; số tiền = tiền thuê × số tháng HĐ − tổng đã thu các kỳ trước (khử lệch làm tròn, BR-210). Ngày trả phòng ghi chỉ số cuối → **bill quyết toán** (BR-214) = điện nước từ 01 tới ngày trả + dịch vụ chưa thu + phạt/bồi thường (BR-511) − **cọc**; dương thu thêm, âm hoàn trong 7 ngày làm việc (BR-522). Trả **trước hạn HĐ**: cọc mất theo BR-313, các khoản trên thu riêng, không trừ vào cọc (ESC-048 còn mở). | Vào 20/11, 3 tháng, trả 20/02: phiếu 02/2027 tiền thuê = 25.500.000 − 20.113.000 = **5.387.000** (01–19/02) |
| BR-LS-05 | **Cọc = 1 tháng tiền thuê của HĐ** (INV), mọi kỳ hạn. Cọc **không** dùng để trừ phiếu hằng tháng khi khách còn ở; chỉ trừ ở bill quyết toán. Cọc không xuất hóa đơn cho tới khi bị khấu trừ (BR-523). | Cọc 8.500.000; quyết toán: điện nước 01–20/02 412.000 + mất 1 thẻ 200.000 → hoàn **7.888.000** |
| BR-LS-06 | **Không giảm giá theo thời hạn** (INV): tiền thuê trên phiếu = tiền thuê tháng **ghi trên HĐ**; phiếu không tự tính lại giá. Đổi giá giữa HĐ chỉ qua phụ lục HĐ (MGR+). | – |

## 2. Đơn giá, thuế, làm tròn

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-07 | **Tham số OWN** (có ngày hiệu lực, không gõ cứng): điện **4.000 đ/kWh**, nước **25.000 đ/m³** – **chưa VAT** (INV); dọn phòng thêm **Studio (Studio City và Studio Garden – căn 101, 102, 103, 201, 202, 203) 150.000**, **Premium (302, 402) và Signature (301, 401) 200.000**/lần – **INV xác nhận 18/11, rõ cách chia 19/11**, thay bảng 100/120/130/150 của bảng giá 01/11; **đã gồm VAT** như mọi giá niêm yết (BR-523; ĐỀ XUẤT). Không còn phí dịch vụ 200.000/tháng (INV 17/11). *Cài đặt* (contract §12.4, làm cho v1.0.7): giá lấy từ `long_stay_cleaning_fee_by_room` theo số căn – `{"101":150000,"102":150000,"103":150000,"201":150000,"202":150000,"203":150000,"301":200000,"302":200000,"401":200000,"402":200000}` – OWN nhập sau deploy; mặc định `{}`. Căn chưa có trong bảng → `adhoc_cleaning_fee` 100.000 (giá khách ngắn ngày, không đổi). Tới khi OWN nhập xong, lễ tân giữ dòng 100.000 và ghi thêm dòng phần chênh +50.000 / +100.000 cùng ngày (`go-live-guide.md` mục 7). Phiếu dùng đơn giá hiệu lực tại **ngày cuối kỳ** của dòng đó; đổi đơn giá không đụng phiếu đã phát hành. | Đổi điện lên 4.200 từ 01/01/2027 → điện tháng 12 (chốt 31/12) vẫn 4.000 |
| BR-LS-08 | **VAT theo loại dòng** (tham số `utility_vat_rate` có ngày hiệu lực, OWN chỉnh; **INV 17/11 dùng mức dưới, chờ kế toán xác nhận**). **Mặc định**: tiền thuê và dọn phòng **đã gồm VAT** (không cộng thêm; bill ghi "đã gồm VAT"); **điện cộng 8 %** (10 % từ 01/01/2027 nếu mức giảm 2 % theo NQ 204/2025/QH15 hết hạn 31/12/2026); **nước cộng 5 %** (mức thường áp cho nước sạch). Thuế suất lấy theo **ngày phát hành phiếu** (trùng ngày xuất hóa đơn, BR-523). **CẦN XÁC NHẬN – kế toán**: (a) điện nước thu lại của khách lưu trú xuất hóa đơn theo thuế suất của hàng hóa (điện, nước) hay gộp vào dịch vụ lưu trú (8/10 %); (b) điện có thuộc diện giảm 2 % không; (c) giá điện bán lại cho người thuê dài hạn có bị giới hạn theo giá bán lẻ sinh hoạt không (DOM đã ghi ở BR-501; 4.000 chưa VAT theo DOM hiểu cao hơn bậc cao nhất). | Điện 142 kWh × 4.000 = 568.000, VAT 8 % 45.440 · Nước 3,4 m³ × 25.000 = 85.000, VAT 5 % 4.250 |
| BR-LS-09 | **Làm tròn** (ĐỀ XUẤT): mỗi dòng tính đến **đồng** (VND số nguyên, BR-004), VAT tính theo dòng và làm tròn đến đồng – khớp hóa đơn điện tử. **Tổng phải thu làm tròn xuống 1.000**, phần lẻ in thành dòng "Làm tròn" (luôn có lợi cho khách, không thu quá hóa đơn). Cách thể hiện phần làm tròn trên hóa đơn: kế toán xác nhận. | Tổng 9.502.690 → thu **9.502.000**, dòng "Làm tròn −690" |

## 3. Chỉ số đồng hồ

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-10 | **Mỗi căn một đồng hồ điện và một đồng hồ nước riêng** [GIẢ ĐỊNH – nếu có căn dùng chung đồng hồ thì báo DOM, cần quy tắc chia]. **Đầu kỳ lễ tân nhập bắt buộc mỗi kỳ** (INV 17/11, thay "đầu kỳ tự lấy cuối kỳ trước"): kỳ đầu = chỉ số **lúc nhận phòng**; các kỳ sau = lần đọc **đầu kỳ M+1** riêng (có ngày, ảnh, người nhập), Desk không điền sẵn; đổi căn = chỉ số vào căn mới. **Tiêu thụ tính tiền = cuối kỳ − đầu kỳ của cùng kỳ.** **Hao hụt** = đầu kỳ − cuối kỳ trước của **căn** (kể cả khách trước): không tính cho khách, ghi lại cho OWN xem. Đầu kỳ < cuối kỳ trước → cảnh báo hai bước (gửi lại kèm xác nhận, nháp phiếu có cảnh báo). **Cửa sổ chốt**: từ ngày cuối tháng tới hết ngày 01; cuối kỳ M và đầu kỳ M+1 ghi cùng lúc (hai lần đọc, hai ảnh); chỉ số ghi ngày 01 vẫn là cuối kỳ của tháng trước. Lần đọc nhận phòng / đổi căn: cửa sổ = ngày sự kiện tới hết ngày hôm sau. **Ghi trễ** (xét theo **ngày nhập**, không theo ngày đọc khai – BUG-R5-008): trong `lateMaxDays` (mặc định 10) sau cửa sổ → FDL+ kèm lý do, nháp có cảnh báo "đọc trễ"; đầu kỳ ghi trễ thì phần dùng từ ngày 01 tới ngày đọc nằm trong hao hụt, không tính khách. Quá hạn đó → BR-LS-17. Ghi người nhập và giờ nhập. | Kỳ 11: nhận phòng 20/11 đọc 1.250, cuối kỳ 30/11 đọc 1.392 → tính 142 kWh. Đầu kỳ 12 đọc 1.395 (30/11, sau dọn phòng) → hao hụt 3 kWh, OTTIMO chịu. Kỳ 12 tính từ 1.395 |
| BR-LS-11 | **Số lẻ** (NGÀNH): điện **kWh nguyên**; nước **m³ một chữ số thập phân**. Lễ tân ghi số đọc được, **bỏ phần lẻ** (không làm tròn lên) – phần lẻ tự sang kỳ sau nên không mất của ai. | Đồng hồ nước 38,67 → ghi 38,6 |
| BR-LS-12 | **Cuối < đầu → chặn lưu**. Lễ tân chọn một trong ba: *Nhập sai* (sửa lại số), *Thay đồng hồ*, *Đồng hồ quay vòng*. Hai lý do sau do **FDL+** ghi (contract §4: FD bị chặn, FDL+ lưu thẳng, ghi người duyệt). **Thay đồng hồ**: ghi chỉ số cuối đồng hồ cũ + chỉ số đầu đồng hồ mới + ngày thay; tiêu thụ = (cuối cũ − đầu kỳ) + (cuối kỳ − đầu mới). **Quay vòng**: tiêu thụ = (số tối đa + 1 − đầu) + cuối. **Tiêu thụ bất thường** (> 2 lần trung bình 3 kỳ trước, hoặc > 300 kWh / > 10 m³ khi chưa có lịch sử) → cảnh báo kiểm lại trước khi phát hành (BR-503). | Thay ngày 15/11: cũ 1.250→1.310, mới 0→82 → 60 + 82 = **142 kWh** |
| BR-LS-13 | **Ảnh đồng hồ** (ĐỀ XUẤT, giữ BR-502): **bắt buộc** cho chỉ số lúc nhận phòng, cuối kỳ, trả phòng và thay đồng hồ – là bằng chứng khi khách thắc mắc. Ảnh chỉ chụp mặt đồng hồ, không chụp người, giấy tờ. Lưu hết HĐ + 12 tháng [GIẢ ĐỊNH – SEC xem]. Không có ảnh vẫn lưu được nếu **FDL+** ghi với ghi chú (ví dụ số đọc từ sổ giấy). Lần đọc bù BR-LS-17 **luôn** bắt buộc ảnh. | – |

## 4. Dịch vụ phòng, phát hành, sửa phiếu

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-14 | **Dịch vụ phòng "dùng trong kỳ"** = dòng folio của HĐ có **ngày dịch vụ trong tháng M−1**, **chưa thu**, giá > 0: dọn phòng thêm, minibar (BR-703), giặt ủi nếu có, phí phạt/bồi thường đã ghi (BR-511: khử mùi, thẻ phòng). **Không lấy**: dòng đã thu ngay, dòng FOC/miễn, cọc, tiền thuê (lấy từ HĐ), dòng ngày dịch vụ từ ngày 01 tháng M (sang phiếu sau). Lễ tân xem danh sách và được bỏ một dòng sang kỳ sau, không sửa giá; miễn/giảm đi theo FOC (BR-432/433). | Dọn thêm 12/11 và 26/11, Studio → 2 × 150.000 = **300.000** |
| BR-LS-15 | **Trạng thái phiếu**: Nháp → Đã phát hành → Đã thu một phần → Đã thu đủ; hoặc Đã hủy. Phát hành = ghi vào folio, khóa số, cấp **mã phiếu** riêng (ví dụ `TT-2612-<số căn>`), in/gửi được (bill song ngữ EN dẫn – VI, brand OTTIMO, VietQR có mã phiếu trong nội dung chuyển khoản). Thu nhiều lần được; mỗi lần ghi phương thức (VietQR/tiền mặt), số tiền, người thu, giờ. Đánh dấu thu **khi đã thấy tiền** (Desk chưa đối soát ngân hàng tự động). | – |
| BR-LS-16 | **Sửa phiếu đã phát hành: không sửa đè.** Chưa thu đồng nào → **Hủy** (bắt buộc lý do) và tạo phiếu mới mã mới, ghi "thay phiếu X"; phiếu cũ giữ lại xem được. **Đã thu** (một phần hay đủ) → không hủy; chênh lệch vào phiếu kỳ sau thành dòng **"Điều chỉnh kỳ trước"** (âm hoặc dương, kèm lý do). Kỳ cuối (không còn phiếu sau) → điều chỉnh vào bill quyết toán. | Ghi nhầm 1.932 thay 1.392 → hủy, phiếu mới |

## 4A. Đọc bù sau hạn ghi trễ (mới 18/11)

| Mã | Quy tắc | Ví dụ |
|---|---|---|
| BR-LS-17 | **Bậc quyền theo độ trễ** (DOM + ARC; **INV 18/11 xác nhận MGR và OWN**): trong cửa sổ → FD+. Trễ ≤ `lateMaxDays` → FDL+ có lý do (BR-LS-10). Quá hạn ghi trễ → **chỉ MGR/OWN**, bằng **lần đọc bù**: ngày đọc = **ngày nghiệp vụ hôm nay** (không lùi, không tiến); **bắt buộc** lý do (3–300 ký tự) và **ảnh mặt đồng hồ chụp hôm đó** (không được miễn ảnh như BR-LS-13); đánh dấu đọc bù, audit riêng, lên báo cáo OWN. Nháp phiếu dùng lần đọc bù có cảnh báo, phát hành phải xác nhận. Áp cho chỉ số nhận phòng, cuối kỳ, đầu kỳ, vào căn mới, rời căn cũ. **Thay cho cái gì**: (a) thiếu chỉ số nhận phòng / vào căn mới / đầu kỳ → lần đọc bù là đầu kỳ; phần dùng từ ngày đến (hoặc ngày 01) tới ngày đọc bù vào hao hụt, **không tính khách**; (b) thiếu cuối kỳ M → lần đọc bù là cuối kỳ M, lễ tân ghi luôn đầu kỳ M+1 cùng số cùng ngày (hao hụt 0); kỳ M kéo dài tới ngày đọc bù, kỳ M+1 ngắn lại, không tính hai lần; **đơn giá vẫn theo ngày cuối tháng M** (BR-LS-07); phiếu in ngày đọc thật; (c) thiếu chỉ số rời căn cũ → nếu căn cũ đã có lần đọc sau ngày rời (của lượt sau) thì Desk gợi ý dùng số đó, bắt buộc dùng khi căn đã có khách mới; không có thì đọc bù hôm nay. **Không đổi**: cảnh báo hai bước đầu kỳ < cuối kỳ trước, chặn cuối < đầu, ngoại lệ thay đồng hồ / quay vòng (đồng hồ thay khi chưa ai chốt và không biết số cuối đồng hồ cũ → phần đó không tính khách, không ước tính), luật trễ theo ngày nhập (BUG-R5-008), tham số `lateMaxDays`. Đọc bù **không** thay số trên phiếu đã phát hành (đi BR-LS-16). Khách đã trả phòng: không đọc bù kỳ tháng, dùng chỉ số trả phòng (BR-LS-04). Chi tiết phương án và gợi ý API: `DOM-late-entry-proposal.md`. *Cài đặt*: chưa có trên Desk v1.0.7, làm như bản sửa nhỏ sau khi lên production, mục tiêu trước 11/12 (QC điều kiện 9); tới lúc đó dùng cách mở tạm `lateMaxDays` (`go-live-guide.md` mục 2). | Căn A đến 05/11, quên chỉ số nhận phòng; hạn ghi trễ 16/11. Ngày 18/11 MGR đọc 1.312, lý do "quên chốt lúc nhận phòng", chụp ảnh → lưu. Cuối kỳ của khách trước 1.250 → hao hụt 62 kWh, OTTIMO chịu. Căn B có đầu kỳ 11 = 1.250, quên chốt 30/11, hạn 11/12; 15/12 MGR đọc bù 1.470 → điện trên phiếu 12/2026 = 220 × 4.000 = 880.000 chưa VAT; đầu kỳ 12 = 1.470 cùng ngày |

## 5. Ai được làm gì

| Việc | FD | FDL | MGR | OWN |
|---|:-:|:-:|:-:|:-:|
| Nhập chỉ số (trong cửa sổ), ảnh; tạo nháp; phát hành; in/gửi | Có | Có | Có | Có |
| Đánh dấu đã thu (VietQR, tiền mặt) | Có | Có | Có | Có |
| Ghi chỉ số trễ trong `lateMaxDays` (có lý do) | – | Có | Có | Có |
| Ngoại lệ thay đồng hồ / quay vòng / thiếu ảnh | – | Có | Có | Có |
| **Đọc bù sau hạn ghi trễ** (BR-LS-17) | – | – | Có | Có |
| Hủy phiếu đã phát hành chưa thu (có lý do) | – | Có | Có | Có |
| Dòng "Điều chỉnh kỳ trước" | – | Có | Có | Có |
| Đổi đơn giá điện, nước, % VAT, `monthly_statement_rules` (gồm `lateMaxDays`) | – | – | – | Có (ghi nhật ký, có ngày hiệu lực) |

Bảng khớp `contract.md` §4 và §11.4 (A121, A122, A123, A89 làm đơn giản: FDL+ lưu thẳng ngoại lệ). Đọc bù là hàng quyền mới, ARC thêm vào `rbac-matrix.md` và `.json` cùng commit.

## 6. Câu hỏi đã có trả lời

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Phần lẻ tháng đầu thu lúc nào | **B – thu lúc nhận phòng** (INV 17/11, thay ESC-047). Vào BR-LS-03 |
| 2 | Phí dịch vụ 200.000/tháng | **Bỏ**, đã gồm trong giá tháng (INV 17/11). Vào BR-LS-07 |
| 3 | VAT điện 8 % (10 % từ 01/01/2027), nước 5 %; trần giá điện bán lại | INV 17/11 dùng mức đề xuất làm tham số OWN, **còn chờ kế toán xác nhận** (QC điều kiện 8) |
| 4 | Giá dọn thêm khách dài hạn | **150.000 / 200.000 theo hạng** (INV 18/11). Vào BR-LS-07 |
| 5 | Khách ở từ trước 01/11 có số đọc đầu tháng 11 không; tháng 11 thu ở đâu | Có số trên giấy; tháng 11 đã thu ngoài Desk, phiếu đầu tiên là 12/2026 (INV 18/11). Xem `go-live-guide.md` |
| 6 | Đọc bù sau hạn ghi trễ: ai | **MGR và OWN** (INV 18/11). Vào BR-LS-17 |

## 7. Lịch sử

- 17/11: bản đầu BR-LS-01..16.
- 18/11: INV 17/11 (đầu kỳ nhập mỗi kỳ, hao hụt; phần lẻ lúc nhận phòng; bỏ phí dịch vụ; VAT tham số) và INV 18/11 (giá dọn 150.000/200.000; khách ở trước 01/11; BR-LS-17 cho MGR + OWN). Sửa BR-LS-03, 07, 08, 10, 12, 13; thêm BR-LS-17; bảng quyền mục 5 tách FDL/MGR theo contract §4. Gộp vào `business-rules.md` v0.5.18.
