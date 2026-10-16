# DOM review nghiệp vụ – Round 2, Sprint 2 (bước Review chéo)

- Người review: DOM | Ngày: 16/10/2026 | Chuẩn so: `product/docs/business-rules.md` **v0.3.1**
- Đối tượng: `outputs/BE/s2-be-a.md`, `s2-be-b.md` (mục giả định); code `services/api/src/modules/reservations/public/{pricing,pricing.service}.ts`, `reservations/internal/{reservations.service,room-blocks.service,extra-guest-kit}.ts`, `sales/internal/{quote-pricing,quotes.service}.ts`, `folio/public/folio.service.ts`; `outputs/FE/s2-report.md` mục 4; `outputs/QA/s2-report.md` mục 4; specs BA EP02 (E02-07), EP07-08 (E07-15), EP14 (E14-07), EP01 (E01-08); `outputs/ARC/s2-contract.md` mục DOM.
- Cách review: đọc code theo từng luồng lễ tân thật (đặt – giữ chỗ – cọc – hủy – no-show – khôi phục – đổi ngày – khóa phòng – đơn OTA nhập tay), tính lại bằng tay theo ví dụ BR. Không chạy test.
- Kết quả: **15 thẻ – Blocker 1 · Major 7 · Minor 5 · Suggestion 2**. Quyết định nghiệp vụ trong quyền DOM: mục A (đã ghi `01-decisions/decision-log.md`).

---

## A. Trả lời các điểm đang chờ DOM (quyết định – nhãn NGÀNH, DOM tự chốt)

| # | Câu hỏi | Quyết định DOM | Ảnh hưởng |
|---|---|---|---|
| D-1 | Đơn OTA (nhập tay R2, channel manager R3) vượt sức chứa: chặn hay gắn cờ? (BE-A giả định chặn; BA G-5/E02-07 đề xuất cờ) | **Không chặn – gắn cờ.** Theo BR-312 (1) không bao giờ từ chối đơn OTA đã về. Kênh `ota`: vượt `max_occupancy` của căn → trả **cảnh báo** (như `RATE_OUT_OF_RANGE_WARNING`), lễ tân ghi lý do xác nhận rồi lưu; đơn có cờ xung đột loại **"sức chứa"**, hiện "Cần chú ý"; **chặn nhận phòng (B9)** tới khi xử lý (đổi căn đủ chỗ, tách thêm căn, hoặc ghi số người thực tế ≤ sức chứa sau khi liên hệ khách). Kênh `direct`/`agent`/`internal` **giữ chặn** `CAPACITY_EXCEEDED`. BR-812 vẫn sinh tối đa theo số người vượt định mức thực tế | FB-R2-DOM-BE-04, FB-R2-DOM-ARC-01 |
| D-2 | Hạn báo giá: QA "23:59 ngày lập + 3" vs BE-B "00:00 ngày lập + validity + 1" | **Hai cách là một mốc – chốt cách lưu của BE-B.** `expiresAt` = **00:00:00 ngày (ngày lập + `quote_validity_days` + 1)**, giờ VN, **ngày lịch** (không dùng mốc 06:00 BR-010 – báo giá là cam kết với khách, khách hiểu theo ngày lịch). So sánh `now ≥ expiresAt` → hết hiệu lực. Hiển thị cho khách "Hiệu lực đến 23:59 dd/mm" (= ngày lập + 3). Biên test: BG lập 15/10 (kể cả 01:30 15/10) → **23:59:59 18/10 còn hiệu lực; 00:00:00 19/10 hết** (khớp ví dụ BR-304) | FB-R2-DOM-QA-01 |
| D-3 | Khôi phục no-show dùng lại `stay_night` đã void (BE-A) thay vì sinh dòng mới (erd 8) | **Đồng ý dùng lại** (một đêm-phòng = một dòng, giữ giá snapshot đúng BR-315 (3) "không đổi giá"; lịch sử nằm ở `state_transition`/audit). Bổ sung: (a) khôi phục **sau ngày nghiệp vụ** (MGR duyệt) → các đêm đã qua **vẫn tính tiền** theo giá snapshot (khách đã giữ phòng – như BR-311 "khách báo đến trễ, đêm vẫn tính"); muốn miễn thì đi FOC BR-434; (b) căn đã bán lại / phải đổi căn → MGR duyệt xong, đơn về `confirmed` ở **làn chưa gán căn** (cờ xung đột) rồi gán căn bằng B7a – không được trả 409 sau khi đã duyệt; (c) đơn OTA: R2 chưa lưu "đã báo no-show lên kênh" → khôi phục đơn OTA **luôn MGR+** (an toàn theo BR-315 câu cuối); (d) KPI: đơn đã khôi phục **không** tính là no-show (DATA đếm theo trạng thái cuối, sự kiện B11/B12 chỉ dùng cho nhật ký) | FB-R2-DOM-BE-05, FB-R2-DOM-BE-01 |
| D-4 | Mở khóa OOO trước hạn (O4): `end_date_actual` = hôm nay → mở bán từ đêm nay | **Đồng ý.** Ngày mở bán lại = **ngày nghiệp vụ hiện tại** khi quản lý mở khóa (căn bán được từ đêm nay). An toàn đã có ở BR-803: căn chưa `VC`/`VI` thì **không nhận phòng** được. Khi có `room_status` (Sprint 4): mở khóa → căn `VD` + việc `after_repair_clean` ưu tiên bậc 2 nếu có khách đến hôm nay. Câu BR-804 "mở bán từ đêm kế tiếp sau khi căn VI" sẽ sửa ở BR v0.3.2 thành "mở bán từ ngày mở khóa; nhận phòng chỉ khi căn VC/VI (BR-803)". Khối `planned` chưa bắt đầu → hủy (O5), không phải mở khóa | FB-R2-DOM-BE-10 |
| D-5 | Danh mục lý do đổi căn/đổi ngày (`reasonCode` B7/B8, E02-07) | `guest_request` (khách yêu cầu) · `property_fault` (căn hỏng/sự cố, gắn OOO) · `overbooking` (xử lý trùng/xung đột – **chỉ** khi đơn có cờ xung đột, BR-312) · `upgrade` (nâng hạng chủ động – FDL+, BR-316 (3)) · `inventory_optimize` (sắp căn để tránh đêm lẻ, khách không bị ảnh hưởng – chỉ khi chưa báo số căn cho khách) · `force_majeure` (**chỉ B8**, dời ngày miễn phí BR-309 bất khả kháng, ghi chú bằng chứng bắt buộc, MGR+) · `other` (ghi chú bắt buộc ≥ 3 ký tự). B8 thường (dời thay hủy) dùng `guest_request`. **Đơn OTA đổi ngày** ở R2 (OTA khóa ngày – `OTA_DATES_LOCKED` giữ nguyên): làm bằng **hủy `ota_cancelled` (tiền phạt 0) + tạo đơn mới cùng mã OTA**, ghi chú "OTA sửa đơn"; R3 channel manager xử lý sửa đơn tự động | FB-R2-DOM-FE-01, FB-R2-DOM-ARC-01 |
| D-6 | Kênh Trực tiếp: 5 kênh hay 1 kênh `direct` + `directSource` (cùng ARC) | **Đồng ý quyết định ARC 16/10**: 1 kênh `direct` + `directSource` 5 giá trị. Nghĩa từng nguồn (để lễ tân chọn nhất quán): `website` – khách tự đặt qua web OTTIMO; `zalo_phone` – khách **mới** liên hệ Zalo/điện thoại/mạng xã hội; `walk_in` – khách tới quầy không đặt trước; `returning` – khách **đã từng ở** OTTIMO tự liên hệ lại; `sales_staff` – sale nội bộ chủ động tìm/chốt khách. Thứ tự khi trùng: `sales_staff` > `returning` > còn lại. CTV/môi giới **không** là nguồn mà là kênh `agent`. Tỉ lệ khách quay lại (DATA) tính từ **hồ sơ khách**, không từ `directSource` | FB-R2-DOM-FE-02 |
| D-7 | Đêm kênh Nội bộ có tính đêm bán không (E02-07, BA G-4) | **Theo DATA Q-05 đã chốt**: đêm Nội bộ là đêm có khách **miễn phí** (`is_complimentary`) – vào Occupancy, **không** vào ADR, **không** trừ đêm khả dụng (khác OOO). **Ở tối thiểu BR-113 không áp** cho kênh Nội bộ (không phải bán). BR-904 thêm câu này ở v0.3.2 | FB-R2-DOM-BE-07 |
| D-8 | Đổi số đêm làm đổi bậc giảm BR-107 (phát hiện khi review) | Bậc giảm theo **tổng số đêm cuối cùng** của đơn (kênh Trực tiếp/CTV), áp lại cho **mọi đêm còn hiệu lực** trên **giá lịch từng đêm đã chốt** (BR-106 giữ giá lịch, không giữ bậc giảm). Cọc đã thu không đổi; không đòi cọc bổ sung khi kéo dài | FB-R2-DOM-BE-03 |
| D-9 | Giữ chỗ có cọc **một phần** tới hạn (phát hiện khi review) | **Không tự hủy** (có tiền khách) nhưng **không giữ vô hạn**: tới hạn → push đỏ cho sale phụ trách + FD/FDL; phải xử lý trước **trần 12:00 ngày đến** (BR-302) bằng một trong ba: thu đủ → B4; MGR+ chấp nhận cọc thiếu (ghi lý do) → xác nhận; hủy B5 **hoàn 100%** phần đã nhận (đơn chưa xác nhận – BR-308 không phí). Quá trần chưa xử lý → báo MGR, vẫn không tự hủy | FB-R2-DOM-BE-06 |
| D-10 | Hạn việc bộ đồ dùng thêm khi đơn xác nhận sau giờ nhận phòng ngày đến | `dueAt` = **max(giờ nhận phòng ngày đến, lúc xác nhận + `extra_guest_kit_midstay_due_minutes`)** – cùng mức 60 phút của BR-812 (2) "thêm người giữa kỳ" | FB-R2-DOM-BE-09 |
| D-11 | Hoa hồng ra số lẻ (156.150 – UXD d0 #5) | Từng đơn giữ **đúng đồng** (= % × tiền phòng, BR-903, không làm tròn để tổng khớp phân bổ đêm). Làm tròn **1.000 gần nhất ở kỳ chi** tháng (BR-212). Giao diện hiện đủ số | – |
| D-12 | E07-15 (BA, EP07-08) | (a) Phạm vi T của HK gồm việc **chưa giao**: đồng ý (10 căn, 2 HK dùng chung hàng việc). (b) `guest_request` bậc 3: đồng ý. (c) Việc ở lại không xong hủy cuối ngày, loại khác chuyển ngày + chip "Từ hôm trước": đồng ý. (d) Kiểm không đạt → giữ `VC` + việc "Dọn lại theo kiểm phòng": đồng ý, **thêm**: căn mang cờ "Kiểm chưa đạt" tới khi kiểm lại đạt; nhận phòng vào căn này → **cảnh báo** cho lễ tân (không chặn, đúng BR-803 VC nhận được). (e) Ảnh chỉ bắt buộc khi tự kiểm: đồng ý. (f) Mức mặc định theo `category`: đồng ý; nhóm Cao khi có khách nên gồm cả **tắc bồn cầu/thoát nước** nếu danh mục có loại này. (g) Mở lại phiếu: trong kỳ lưu trú hoặc 7 ngày khi căn trống: đồng ý. (h) Mốc 12:00 ngày cuối còn khóa: đồng ý (trước giờ nhận phòng 14:00, kịp kéo dài khóa và đóng bán OTA) | FB-R2-DOM-BA-01 |
| D-13 | E14-07 (BA, EP14) | (a) 3 loại yêu cầu tới lễ tân trước ngày đến (đón sân bay Liên Khương, hỏi nhận sớm/trả muộn, khác): đồng ý. (b) Phí dọn thêm cho khách ngắn ngày – cách hiểu BR-506 (INV đã quyết): ngắn ngày đã dọn hằng ngày, nên **dọn bù lần dọn hằng ngày bị bỏ** (khách từ chối buổi sáng, chiều gọi) = **miễn phí**; **lần dọn đầy đủ thứ hai trong cùng ngày** = phí BR-506; thay khăn/bổ sung đồ dùng = miễn phí (không phải dọn). `[GIẢ ĐỊNH – chờ INV xác nhận khi PO gom ESC cuối round]`. (c) Hạn trả lời yêu cầu ngoài giờ trực = mở giờ + `guest_request_response_minutes`: đồng ý, **trừ** `report_issue` (mất nước nóng, mất điện, khóa cửa) → push **ngay** cho người trực/FDL dù ngoài giờ; câu trả lời tự động luôn có số điện thoại. (d) Phí dọn lẻ ghi folio **tự động** khi việc `done`: đồng ý (khách đã đồng ý phí qua `feeAccepted`; sai thì lễ tân đảo dòng có lý do, BR-008) | FB-R2-DOM-BA-01 |
| D-14 | E01-08 (BA, EP01) | (a) Kỳ BR-435: **lũy kế từ đầu tháng tới hôm nay** (cảnh báo sớm); đếm lượt duyệt theo tháng lịch, tự áp minibar tính vào người tự áp: đồng ý. (b) Cách gộp dòng "Cần chú ý": đồng ý. (c) `overbooking` mức **critical** khi (14:00 ngày đến − bây giờ) ≤ 24 giờ hoặc khách đã tới ngày đến; xa hơn → `warning` (BR-317 (5)) | FB-R2-DOM-BA-01 |
| D-15 | Mục DOM trong `ARC/s2-contract.md` | A-05 BR-113 (a) ở quầy = **gợi ý** căn đêm lẻ để lễ tân chọn: đồng ý (web tự gán ở R3). B-10 `wo_done_photo_required_severities` = **`[high, medium]`** (căn có khách – chủ đầu tư cần thấy bằng chứng sửa; mức Thấp tùy chọn). B-12 mốc 12:00: đồng ý (D-12 h). B-16 loại yêu cầu có phí: `extra_cleaning` (theo D-13 b), `laundry` (giặt ủi BR-5xx); `transport_tour` giá theo báo riêng → `feeVnd = null`, lễ tân báo giá. B-06 lịch dọn mặc định đơn dài hạn nhập tay: **không có gói** (0 lần/tuần), dọn lẻ BR-506 – đúng BR-204 "HĐ nhập tay giữ chỉ tiền thuê" | – |

---

## B. Thẻ feedback

### FB-R2-DOM-BE-01
- Mức độ: Blocker
- Vị trí: `folio/public/folio.service.ts:332` `onReservationVoided` (chỉ void hoa hồng); `reservations/internal/reservations.service.ts` ~1374 (`cancel` – chỉ audit `reservation.cancellation_fee`), ~1974 (`markNoShow` – chỉ audit `no_show_deposit_retained`), ~2245 (dời khách ra ngoài); `folio.service.ts:268–276` (B12 bỏ qua đêm "đã ghi").
- Vấn đề: dòng tiền phòng và phụ thu người được ghi folio khi đơn `confirmed` (B2/B4), nhưng khi đơn **bị hủy (B10), no-show (B11), dời ra ngoài** thì **không có bút toán đảo** – folio vẫn giữ đủ tiền phòng các đêm đã `void`. Phần cọc giữ lại (phí hủy BR-309, giữ cọc no-show BR-311) chỉ nằm trong audit, **không** thành dòng folio. Ví dụ BR-309: đơn 3 đêm × 820.000, cọc 700.000, hủy trước 5 ngày → folio vẫn ghi 2.460.000 tiền phòng, đã thu 700.000 → "còn phải thu" **1.760.000** trên đơn đã hủy; đúng phải là: tiền phòng 0, phí hủy 350.000 (doanh thu khác), hoàn 350.000 chờ duyệt, còn phải thu 0. B12 hiện chạy đúng chỉ vì dựa vào việc không đảo (bỏ qua đêm "đã ghi").
- Vì sao quan trọng: sai tiền ở sổ của khách (protocol: Blocker). Lễ tân mở drawer đơn đã hủy thấy khách "còn nợ"; Sprint 3 bill/đóng ca và DATA (doanh thu phòng theo `folio_line`) sẽ đếm doanh thu phòng cho đêm hủy/no-show – trái BR-904 (phí hủy là doanh thu khác, đêm no-show không là đêm bán).
- Đề xuất sửa: (1) B10/B11/dời ra ngoài: trong cùng giao dịch, ghi **dòng đảo** (`reversal_of_id`) cho mọi dòng `room`/`extra_guest` của đêm vừa `void` (BR-008: không sửa số, chỉ đảo); ghi **một dòng** `cancellation_fee` / `no_show_fee` = `retainedVnd` (nhóm doanh thu khác) – khoản hoàn chờ duyệt giữ ở luồng `refund`. (2) B12: đảo dòng `no_show_fee` rồi ghi **dòng phòng mới** trỏ cùng `stay_night` (bỏ điều kiện "đã ghi thì bỏ qua" chỉ tính dòng chưa bị đảo). (3) Test: oracle BR-309-01 (hủy 5 ngày), BR-311 ví dụ (2 đêm, cọc 500.000), B11→B12 cùng ngày – `totals.balanceVnd` đúng ở từng bước. BE-B (FolioService) + BE-A (gọi đúng chỗ).
- Trạng thái: Open

### FB-R2-DOM-BE-02
- Mức độ: Major
- Vị trí: `reservations.service.ts` `move` (~1474–1690) và `updateReservation` (đổi số người) – không gọi `MoneyBridge`.
- Vấn đề: đổi ngày (B7/B8) void đêm bỏ và sinh đêm mới trong `stay_night`, đổi số người tính lại phụ thu – nhưng **folio không đồng bộ**: dòng của đêm bỏ vẫn còn, đêm mới không có dòng, dòng phụ thu người theo số người cũ, hoa hồng `projected` và phí kênh không phân bổ lại. Ví dụ: đơn 202 đổi 19–22/10 sang 20–23/10 → folio còn dòng đêm 19/10, thiếu dòng đêm 22/10.
- Vì sao quan trọng: `stay_night` (nguồn KPI) và folio (nguồn tiền) lệch nhau ngay sau một thao tác lễ tân làm hằng ngày; lúc trả phòng (Sprint 3) bill sẽ sai.
- Đề xuất sửa: một hàm `FolioService.resyncStay(tx, stay)` gọi sau B7/B8/PATCH người: đảo dòng của đêm `void`, ghi dòng đêm mới, đảo + ghi lại phụ thu người theo số người mới, tính lại hoa hồng `projected` theo snapshot % (BR-006). Test cùng oracle BR-107 (thẻ 03).
- Trạng thái: Open

### FB-R2-DOM-BE-03
- Mức độ: Major
- Vị trí: `reservations.service.ts` ~1577–1617 (`move`: "kept nights keep their price; new nights at today's prices").
- Vấn đề: bậc giảm BR-107 phụ thuộc **tổng số đêm**, nhưng đêm giữ nguyên giữ % cũ, đêm thêm lấy % theo tổng mới. Ví dụ căn 202 kênh Trực tiếp: đơn 5 đêm 9–14/11/2026 (4 × 792.000 + thứ Sáu 911.000) = **4.079.000**, kéo dài tới 16/11 (7 đêm): đúng BR-107 là **5.205.000** (ví dụ chính BR-107); code cho 4.079.000 + 820.000 (thứ Bảy −10 %) + 713.000 = **5.612.000** → thu thừa **407.000**. Chiều ngược (7 → 5 đêm) code giữ −10 % cho 5 đêm = 3.672.000 thay vì 4.079.000 → thu thiếu 407.000.
- Vì sao quan trọng: sai tiền ở thao tác gia hạn/rút ngắn trước ngày đến – rất hay gặp với khách Đà Lạt; khách so với báo giá 7 đêm sẽ khiếu nại ngay.
- Đề xuất sửa: theo D-8 – lưu **giá lịch trước giảm** của từng đêm (`calendarRateVnd` trong `stay_night` hoặc snapshot `nights[]`), khi số đêm đổi: tính `losDiscountPct(tổng mới)` rồi áp lại cho mọi đêm còn hiệu lực từ giá lịch đã chốt; chỉ kênh `direct`/`agent`, không áp OTA/Nội bộ. Thêm oracle "5→7 đêm = 5.205.000", "7→5 đêm = 4.079.000" vào test BE + nhờ QA thêm vào `br-examples.json`.
- Trạng thái: Open

### FB-R2-DOM-BE-04
- Mức độ: Major
- Vị trí: `reservations.service.ts:393` `assertCapacity` (mọi kênh); `s2-be-a.md` mục 6 giả định "OTA vượt sức chứa: chặn".
- Vấn đề: đơn OTA vượt sức chứa bị chặn `422 CAPACITY_EXCEEDED` – trái BR-312 (1) "không bao giờ từ chối đơn OTA đã về". Khi không căn nào đủ chỗ (ví dụ OTA bán "Studio" cho 4 người lớn do cấu hình loại phòng trên kênh sai), lễ tân **không ghi được đơn** → tồn trên kênh không bị trừ → nguy cơ bán trùng thật.
- Vì sao quan trọng: đơn OTA đã thu tiền khách/cam kết với kênh; không ghi được là mất dấu đơn, sai tồn, bị kênh phạt.
- Đề xuất sửa: theo D-1 – kênh `ota`: đổi thành cảnh báo cần xác nhận (ARC đặt tên, gợi ý `CAPACITY_EXCEEDED_WARNING` + `capacityWarningAckReason`), lưu đơn với cờ xung đột loại `capacity`, "Cần chú ý" cho FD/FDL, chặn B9 tới khi `occCount ≤ max` của căn được gán. Kênh khác giữ 422. Cập nhật giả định trong `s2-be-a.md` + test (1 ca OTA vượt → 201 + cờ; 1 ca B9 bị chặn).
- Trạng thái: Open

### FB-R2-DOM-BE-05
- Mức độ: Major
- Vị trí: `reservations.service.ts:2016–2110` `restoreNoShow`.
- Vấn đề: (1) Ngoài điều kiện (căn đã bán lại một phần/toàn bộ) → yêu cầu duyệt đúng, nhưng khi MGR **duyệt** (hoặc MGR tự làm) code vẫn gọi `occupancy.update` trên căn cũ cả khoảng → EXCLUDE trả 409, phê duyệt thất bại – BR-315 nêu rõ "phải đổi căn" là ca MGR xử lý được. (2) Đơn OTA được FD tự khôi phục nếu đủ 3 điều kiện, trong khi BR-315 yêu cầu MGR+ nếu đã báo no-show lên kênh (R2 không biết đã báo hay chưa). (3) Khôi phục sau ngày nghiệp vụ: chưa rõ đêm đã qua tính hay không.
- Vì sao quan trọng: ca thật lúc 07:00 – khách đến muộn, căn đã bán lại cho khách vãng lai – quản lý duyệt mà hệ thống báo lỗi, khách đứng ở quầy.
- Đề xuất sửa: theo D-3 – (1) căn không còn trống → khôi phục vào **làn chưa gán** (`conflict_state=open`, ghi `overbooking_incident` lý do `no_show_restore`), lễ tân gán căn bằng B7a; hoặc nhận `roomId` mới trong lệnh khôi phục (ARC chọn). (2) `channel_group = 'ota'` → luôn đường duyệt MGR+. (3) Đêm đã qua khôi phục `sold` theo giá snapshot (đúng như code đang làm) – ghi rõ vào chú thích + test.
- Trạng thái: Open

### FB-R2-DOM-BE-06
- Mức độ: Major
- Vị trí: `reservations.service.ts:2130` `expireHolds` (`depositPaid > 0` → `keptPaid`, bỏ qua mãi).
- Vấn đề: giữ chỗ đã nhận cọc **thiếu** (BE-B cho ghi giao dịch rồi đơn vẫn `hold`) **không bao giờ** hết hạn và không ai được báo – căn bị khóa vô thời hạn trên mọi kênh. BR-303 chỉ nói "chưa cọc → tự hủy", chưa nói cọc thiếu (DOM bổ sung D-9).
- Vì sao quan trọng: khách chuyển 500.000 thay vì 1.600.000 rồi im lặng → căn đẹp mùa cao điểm bị giam tới ngày đến, sale không biết.
- Đề xuất sửa: J1 gặp giữ chỗ quá hạn có cọc thiếu → không hủy, ghi cờ `hold_overdue_partial` (một lần) + `staff.push` đỏ tới sale phụ trách + FD/FDL; tới trần 12:00 ngày đến còn `hold` → push MGR. Ba lối ra theo D-9 (B4 đủ; MGR chấp nhận cọc thiếu; B5 hoàn 100 %). "Cần chú ý" đầy đủ ở Sprint 4 (dùng lại cờ).
- Trạng thái: Open

### FB-R2-DOM-BE-07
- Mức độ: Minor
- Vị trí: `reservations.service.ts:396–413` (BR-113 áp cho `!manual && group !== 'ota'`; bỏ qua chỉ khi `group === 'direct'`).
- Vấn đề: đơn kênh **Nội bộ** (chủ đầu tư/nhân viên ở, giá 0) đến thứ Sáu 1 đêm bị `MIN_STAY_NOT_MET` và **không ai bỏ qua được** (kể cả MGR/OWN, vì điều kiện chỉ cho `direct`).
- Vì sao quan trọng: ở tối thiểu là luật bán hàng; chủ đầu tư muốn cho người nhà ở 1 đêm cuối tuần bị app chặn.
- Đề xuất sửa: bỏ kiểm BR-113 cho `internal` (D-7). Test 1 ca.
- Trạng thái: Open

### FB-R2-DOM-BE-08
- Mức độ: Minor
- Vị trí: `reservations/internal/extra-guest-kit.ts` vòng lặp `t.status === 'done'` → luôn `insertTask(... 'extra_guest_kit_collect' ...)`.
- Vấn đề: việc chuẩn bị đã `done` không được đánh dấu là "đã sinh việc thu hồi", nên mỗi lần đồng bộ sau (ví dụ giảm người → rồi hủy đơn; hoặc đổi căn → rồi đổi người) lại sinh **thêm một** việc thu hồi cho cùng một bộ.
- Vì sao quan trọng: buồng phòng nhận 2–3 việc "Thu hồi bộ đồ dùng thêm" cho một bộ, đếm sai số bộ đang ở căn (BR-812 (7)).
- Đề xuất sửa: gắn việc thu hồi với việc chuẩn bị (`related_task_id`) và bỏ qua nếu đã có; hoặc chuyển việc chuẩn bị `done` sang trạng thái `collected_requested`. Test: chuẩn bị xong → giảm người → hủy đơn → đúng **1** việc thu hồi.
- Trạng thái: Open

### FB-R2-DOM-BE-09
- Mức độ: Minor
- Vị trí: `pricing.ts` `extraGuestKitDue` + chỗ gọi trong `syncKit`.
- Vấn đề: đơn vãng lai/đơn xác nhận lúc 16:00 cho chính ngày đến → hạn việc = 14:00 hôm nay → việc **quá hạn ngay khi sinh**, buồng phòng và "Cần chú ý" báo đỏ sai.
- Vì sao quan trọng: báo động giả làm buồng phòng mất tin vào cảnh báo.
- Đề xuất sửa: theo D-10 – `dueAt = max(atLocal(arrival, checkin_time), now + extra_guest_kit_midstay_due_minutes)`.
- Trạng thái: Open

### FB-R2-DOM-BE-10
- Mức độ: Suggestion
- Vị trí: `room-blocks.service.ts:252` (O4 mở khóa) + FE hộp xác nhận mở khóa.
- Vấn đề: hành vi "mở bán từ đêm nay" đúng (D-4), nhưng người mở khóa chưa được nhắc rằng căn phải dọn/kiểm trước khi nhận khách – R2 chưa có `room_status` nên BR-803 chưa tự chặn.
- Vì sao quan trọng: quản lý mở khóa 10:00, OTA bán ngay cho khách đến 14:00 khi thợ vừa rời căn còn bụi.
- Đề xuất sửa: hộp xác nhận ghi rõ "Mở bán từ đêm nay ({dd/mm}). Nhớ báo buồng phòng dọn và kiểm căn trước giờ nhận phòng." (UXD viết chữ); BE ghi `release_reason` bắt buộc như hiện có. Sprint 4 thay bằng việc `after_repair_clean` tự sinh.
- Trạng thái: Open

### FB-R2-DOM-FE-01
- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/booking/*` – hộp Đổi căn/ngày (H11), `outputs/FE/s2-report.md` mục 4 giả định 3 (`reasonCode=other` + ô chữ).
- Vấn đề: mọi lần đổi căn/ngày đều ghi `other`, nên không thống kê được lý do (đổi do hỏng phòng, do trùng OTA, do nâng hạng) và **không phân biệt được dời ngày bất khả kháng** (BR-309) với dời thường – hai luồng có quyền và tiền khác nhau.
- Vì sao quan trọng: quản lý cần biết bao nhiêu lần phải dời khách vì căn hỏng/vì trùng kênh (BR-317 (7) ghi nhận xung đột); bất khả kháng phải có bằng chứng.
- Đề xuất sửa: dùng danh mục D-5 (chọn từ danh sách; `other` bắt buộc ghi chú; `overbooking` chỉ hiện khi đơn có cờ xung đột; `upgrade` chỉ FDL+; `force_majeure` chỉ ở chế độ dời thay hủy, MGR+, ghi chú bằng chứng). Chờ ARC đặt enum (thẻ ARC-01) và UXD chuỗi.
- Trạng thái: Open

### FB-R2-DOM-FE-02
- Mức độ: Suggestion
- Vị trí: H09 Đặt phòng mới – ô `directSource`.
- Vấn đề: lễ tân dễ chọn lẫn "Zalo/điện thoại" và "Quay lại" khi khách cũ nhắn Zalo.
- Vì sao quan trọng: số liệu nguồn khách chỉ có ích khi chọn nhất quán.
- Đề xuất sửa: thêm dòng gợi ý dưới ô theo D-6 ("Khách đã từng ở → chọn Quay lại"); khi hồ sơ khách đã có lượt ở trước, **chọn sẵn** `returning` (lễ tân đổi được).
- Trạng thái: Open

### FB-R2-DOM-QA-01
- Mức độ: Minor
- Vị trí: `outputs/QA/s2-report.md` mục 4 – `[GIẢ ĐỊNH QA – chờ DOM]` TC-L5-015 (hạn báo giá 23:59).
- Vấn đề: giả định "hết hạn lúc 23:59" có thể bị hiểu là 23:59:00 đã hết, lệch BE-B (hết từ 00:00:00 hôm sau) một phút.
- Vì sao quan trọng: test biên đỏ/xanh ngẫu nhiên theo cách hiểu, không phải theo nghiệp vụ.
- Đề xuất sửa: theo D-2 – TC-L5-015 kiểm **23:59:59 ngày lập + 3 → `active`**, **00:00:00 ngày lập + 4 → `expired`**; thêm biên báo giá lập lúc 01:30 (ngày lịch, không theo 06:00). Bỏ nhãn giả định. Thêm oracle BR-107 đổi số đêm (thẻ BE-03), OTA vượt sức chứa (BE-04), giữ chỗ cọc thiếu quá hạn (BE-06), khôi phục no-show căn đã bán lại (BE-05), folio sau hủy/no-show (BE-01).
- Trạng thái: Open

### FB-R2-DOM-ARC-01
- Mức độ: Major
- Vị trí: `docs/api/openapi.yaml` – `moveReservation.reasonCode` (`type: string` tự do), `createReservation` (lỗi sức chứa), `restoreNoShow`, `stay_night`/snapshot đêm (erd 8).
- Vấn đề: bốn quyết định DOM cần hợp đồng: (1) enum lý do đổi căn/ngày D-5; (2) cảnh báo sức chứa cho kênh OTA + loại cờ xung đột `capacity` (D-1); (3) khôi phục no-show khi phải đổi căn (làn chưa gán hoặc `roomId` – D-3 b); (4) giá lịch trước giảm của từng đêm để tính lại BR-107 (D-8).
- Vì sao quan trọng: thiếu hợp đồng thì BE/FE sửa thẻ BE-03/04/05, FE-01 mỗi bên một kiểu.
- Đề xuất sửa: gộp vào 0.3.5-draft: `MoveReasonCode` enum `[guest_request, property_fault, overbooking, upgrade, inventory_optimize, force_majeure, other]` (+ ràng buộc vai/chế độ ghi ở mô tả); mã cảnh báo sức chứa + trường lý do xác nhận + `conflictKind: capacity`; tùy chọn khôi phục; cột `calendar_rate_vnd` (hoặc trong snapshot `nights[]`). Tên do ARC đặt.
- Trạng thái: Open

### FB-R2-DOM-BA-01
- Mức độ: Minor
- Vị trí: `specs/EP02-reservations.md` mục 0, 3.2, 9.1, E02-07; `EP07-08` E07-15; `EP14` E14-07; `EP01` E01-08.
- Vấn đề: các nhãn `[GIẢ ĐỊNH BA – DOM xác nhận]` nay đã có câu trả lời (mục A: D-1, D-5, D-7, D-12, D-13, D-14); ba điểm DOM **khác** đề xuất BA: (i) EP02 mục 0 – OTA vượt sức chứa thêm "chặn nhận phòng B9 tới khi xử lý"; (ii) EP07-08 4.4 – thêm cờ "Kiểm chưa đạt" + cảnh báo khi nhận phòng; (iii) EP14 – `report_issue` ngoài giờ vẫn push ngay, phí dọn thêm ngắn ngày theo D-13 (b).
- Vì sao quan trọng: specs là nguồn cho BE/FE/QA Sprint 3–4; giữ nhãn giả định sẽ làm QA viết test theo cách hiểu cũ.
- Đề xuất sửa: BA cập nhật specs theo mục A, bỏ nhãn giả định đã trả lời; giữ nhãn `[GIẢ ĐỊNH – chờ INV]` cho D-13 (b).
- Trạng thái: Open

---

## C. Việc DOM tự làm ở bước Phản hồi & sửa (không cần thẻ) – ĐÃ LÀM, xem mục E
- BR **v0.3.2**: BR-804 (mở bán từ ngày mở khóa – D-4), BR-107 (đổi số đêm – D-8), BR-303 (cọc thiếu – D-9), BR-312/110 (OTA vượt sức chứa – D-1), BR-315 (đêm đã qua, đổi căn, OTA – D-3), BR-904 (đêm Nội bộ – D-7), BR-812 (2) hạn khi xác nhận muộn (D-10), BR-903 (làm tròn ở kỳ chi – D-11), BR-506 cách hiểu ngắn ngày (D-13 b), BR-308 thêm danh mục lý do đổi căn/ngày (D-5). Chỉ làm rõ, không đổi con số INV đã quyết.
- Seed `special_dates` (QA): khoảng Tết 2027 [05/02, 11/02) = đêm 29/30 Tết → mùng 5 – **đúng**. Gợi ý INV ở ESC cuối round: cân nhắc thêm Giỗ Tổ Hùng Vương (10/3 âm lịch – lễ quốc gia) và đêm 1/9 (khách lên Đà Lạt trước Quốc khánh); hiện ESC-004 P-B chỉ lễ quốc gia theo danh sách BR-104 nên **không** tự thêm.

## D. Điểm làm tốt (giữ)
1. Chống trùng ở server bằng EXCLUDE + SAVEPOINT, 20 request cùng căn–đêm → đúng 1 thành công; hold/hết hạn J1 đúng-một-lần – đúng BR-906 ở mức lễ tân 2 giờ sáng cần.
2. `pricing.ts` thuần, mọi con số từ tham số, oracle `br-examples.json` chạy thật: lịch giá không cộng dồn, cọc trên tiền phòng (BR-305), người lớn lấp định mức trước (BR-110), trần 12:00 giữ chỗ và gia hạn (BR-302/303), đêm lẻ BR-113 – khớp ví dụ BR từng đồng.
3. BR-812 sinh/hủy việc bộ đồ dùng thêm **trong cùng giao dịch** với đơn (không job nền), cả đơn OTA – đúng tinh thần ESC-014; no-show bắt buộc ghi kết quả liên lạc và không tự động (BR-311).

---

## E. Bước Phản hồi & sửa (DOM, 16/10/2026)

### E.1 Đã làm mục C
- `product/docs/business-rules.md` lên **v0.3.2**: BR-107, 110, 112, 113, 302, 303, 304, 312, 315, 317, **429 (mới)**, 435, 506, 527, 804, 807, 808, 809, 811, 812, 903, 904; mục 13 thêm `max_open_holds_per_user`, `staff_payment_backdate_max_hours`, `wo_done_photo_required_severities`; mục 16 thêm Q-D6…Q-D8; mục 18 lịch sử v0.3.2. Không đổi con số INV đã quyết. Phần chờ INV mang nhãn **[CHỜ INV]**: BR-506 khách ngắn ngày (D-13 b), `special_dates` (Giỗ Tổ, đêm 1/9 – chưa thêm), số giữ chỗ tối đa mỗi người (nhãn GIẢ ĐỊNH).
- `product/tests/fixtures/br-examples.json` (`source.version` 0.3.2): **không sửa số** của dòng cũ; bỏ `qaAssumption` của BR-304-01 (BR nay ghi rõ mốc) và thêm `stillValidAt`; **thêm 21 dòng**: BR-107-03/04 (calc `losDiscount` – 4.079.000 / 5.205.000), BR-110-09, BR-113-04, BR-302-03, BR-303-04, BR-304-02, BR-315-03/04/05, BR-429-01/02, BR-506-02, BR-527-04, BR-804-03, BR-811-03, BR-812-10/11, BR-903-02 (calc `shortCommission` – 156.150), BR-903-03, BR-904-02. Dòng mới không có calc dùng `calc: null`. Đã tự kiểm bằng script Python mô phỏng validator (nhãn khớp bảng BR, tiền nguyên, ISO +07:00, tính lại BR-107/903): 247 dòng, 0 lỗi. Máy DOM không có Node, **chưa chạy** `pnpm --filter @ottimo/tests test`.
- Việc cho **QA**: chạy validator; thêm nhánh `max(giờ nhận phòng, confirmedAt + extra_guest_kit_midstay_due_minutes)` vào calc `extraGuestKitDue` rồi đổi BR-812-10 sang calc này (hiện để null để test BE không đỏ); thêm 3 tham số mới vào seed DS-E; sửa TC-L5-015 theo BR-304-02.
- Việc cho **BE**: `test/reservations-pricing.test.ts` tự chạy thêm BR-107-03/04 (xanh với code hiện tại vì là tính thuần theo số đêm). Phần đổi số đêm thật (FB-R2-DOM-BE-03) và BR-812-10 (FB-BE-09) dùng các dòng oracle mới làm tiêu chí.

### E.2 Trả lời SEC (FB-R2-SEC-BE-22, BE-28) – quyết định DOM, NGÀNH
| Điểm | Trả lời DOM |
|---|---|
| BE-22 – khoản thu do SAL ghi | **Đồng ý SEC phương án 1–4** (không cấm SAL nhận tiền mặt/POS, không đổi quyền SAL theo rbac ghi chú 20). Mọi khoản do người không có vai FD+ ghi → `chờ đối soát` + "Cần chú ý"; tiền mặt sale nhận phải nộp quầy, FD đối chiếu trong đóng ca (BR-526); hoa hồng của chính người ghi chỉ thành "đạt" khi đã đối soát. Đơn vẫn xác nhận ngay khi đủ cọc (khách cần xác nhận đặt phòng – thực tế quầy VN xác nhận theo ảnh chuyển khoản). Ghi vào BR-527 |
| BE-22 – lùi giờ nhận | **≤ 24 giờ** và không trước lúc tạo giữ chỗ (tham số `staff_payment_backdate_max_hours` = 24); giữ chỗ đã quá hạn chỉ FD+ xác nhận cọc (US-085 AC4) |
| BE-22 – trần số tiền | **Trần = số còn phải thu của đơn** tại lúc ghi = (tiền phòng + phụ thu người đã biết) − đã thu. **Không** dùng mức cọc tối thiểu (BR-305) làm trần vì khách hay trả trước 100%. Không đặt thêm trần tuyệt đối cho tiền mặt (đã có đối soát + đóng ca). Vượt → `422`, chỉ FD+ ghi được kèm lý do (phần dư là tiền khách gửi trước, hiện trên folio). Ví dụ: đơn còn phải thu 5.205.000, sale ghi 16.000.000 → chặn |
| BE-28 – giữ chỗ đang mở mỗi người | **Đồng ý CTV 3, SAL 5**, FD+ không giới hạn (tham số `max_open_holds_per_user`, nhãn GIẢ ĐỊNH – INV đổi được, không cần ESC riêng, đã ghi mục 16 Q-D8). Lý do: 10 căn – một CTV giữ 3 căn mùa cao điểm đã là 30% tồn; sale nội bộ cần nhiều hơn cho khách gia đình/đoàn nhỏ. Đếm đơn `hold` người đó tạo **hoặc** là người chốt; mỗi căn của đơn nhóm tính 1; đơn nhóm lớn hơn giới hạn → FD+ tạo hộ. Mã lỗi theo SEC đề xuất `409 HOLD_LIMIT_REACHED` (ARC chốt tên). Ghi vào BR-302 |
| Có đổi chính sách cọc không? | **Không** – BR-305 (30% tiền phòng), quyền xác nhận cọc của SAL và chính sách hủy giữ nguyên; các điểm trên là kiểm soát vận hành. **Không cần ESC.** |
