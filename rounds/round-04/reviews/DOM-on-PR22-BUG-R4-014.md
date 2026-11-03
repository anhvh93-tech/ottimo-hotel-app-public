# DOM review – PR #22 (`v1.0.2-ed` @ `ff16c1dd`): bản sửa BUG-R4-014 (hộp "Trả sớm" B16 với HĐ thuê tháng)

- Người review: DOM | Round 4 – Review (đợt v1.0.2) | Ngày: 03/11/2026
- Phạm vi: commit `d91cffae` (đã nằm trong `ff16c1dd`, không đổi sau đó): `EarlyDepartureDialog.tsx`, 5 khóa `early_departure.lease_*` / `told_guest_lease` trong `gen_strings.py` (+ `strings-vi/en.json`), mock `allowedActions`, test `r4-bug014-early-departure-lease`. Đọc bằng `git show` / `git grep`, không checkout nhánh.
- Đối chiếu: `business-rules.md` v0.5.1 – BR-108, 201, 206, 207, 209, 210, 214, 313, 428; decision-log 01/11 (ESC-045 câu 4–6, INV "chưa vận hành"); BUG-R4-014 trong `rounds/round-04/qa/bug-list.md`; sổ tay `product/docs/manual/guides/02-le-tan.md` (mục 6 khung "Tạm ở" đơn dài hạn, 11.5, 17.5).

## Kết luận: **Duyệt có điều kiện**

Hướng (b) đúng nghiệp vụ: HĐ tháng không áp BR-428, hộp bỏ hoàn/phí/báo trước và thay bằng BR-313. Nhận diện "HĐ tháng" bằng `stayType = 'long'` là đúng (mục 1). Còn **2 thẻ Major** cần sửa trước khi phát hành v1.0.2 (sửa trong PR #22 hoặc PR nối tiếp, cùng đợt): FB-01 nhận diện sai khi khách đã ở hết HĐ và đang ở phần gia hạn; FB-02 câu chữ khẳng định "mất toàn bộ ký quỹ" cho cả HĐ ký trước khi có BR-313 v0.5.1. Thêm 3 thẻ Minor và 1 ESC mới (ESC-048, không chặn).

## 1. Điều kiện nhận diện "HĐ tháng" – kiểm thực tế mã

| Đường tạo đơn | `stay_type` | Nguồn |
|---|---|---|
| Đơn dài hạn nhập tay (`manualLongStay`, HĐ giấy) | `long` | `reservations.service.ts:783` `manual ? 'long' : 'short'`; ràng buộc `NOT external_contract OR stay_type = 'long'` (`db/schema/reservations.ts:244`) |
| Đơn ngắn ngày Desk / CTV / OTA, mọi số đêm | `short` | `reservations.service.ts:873`, `1120` |
| Đơn con gia hạn (B13, BR-422) – kể cả gia hạn của đơn dài hạn | `short` | `reservations.service.ts:2208` |

- **Không bắt nhầm đơn ngắn ngày 30+ đêm.** Đơn Trực tiếp/CTV từ 30 đêm bị chặn bởi `long_stay_required_from_nights` (BR-108). Đơn OTA 30+ đêm (ví dụ Airbnb tháng) vẫn là `short` và đi BR-428 "đơn OTA theo OTA". Đúng: không có HĐ thì không có ký quỹ để mất. Ở v1.0 "HĐ tháng" chỉ có một dạng là đơn nhập tay. Khi HĐ vào app (H9 / v1.1) phải giữ đúng nghĩa: `long` = có HĐ.
- **Bắt nhầm một ca: khách đã ở hết HĐ, đang ở phần gia hạn.** Xem FB-01.

## 2. Câu chữ – đối chiếu BR-313 v0.5.1

| Khóa | Đúng BR? | Ghi chú |
|---|---|---|
| `lease_title` "Trả trước hạn hợp đồng thuê tháng" | Đúng | – |
| `lease_rule` / `_no_amount` "Vi phạm HĐ: khách mất toàn bộ ký quỹ {amount} (giữ ngoài app). Không truy thu chênh lệch giảm giá kỳ hạn." | Đúng với HĐ ký theo BR-313 v0.5.1. **Sai** với HĐ ký trước đó | FB-02 |
| `lease_still_due` "Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ – không trừ vào ký quỹ. Tiền thuê đã thu cho tháng lịch chưa bắt đầu thì hoàn (làm ngoài app)." | Đúng (BR-313 + BR-214). Thiếu "tháng đang ở không hoàn" và phí dịch vụ | FB-03 |
| `told_guest_lease` "Đã báo khách: mất toàn bộ ký quỹ, không truy thu" | Như `lease_rule`, chịu cùng lỗi | FB-02 |
| Ẩn "Không có khoản hoàn", "Phí trả phòng sớm", "Báo trước N ngày" khi HĐ không có tiền | Đúng – không hứa hoàn, không hứa phí 0 | – |
| Server có đưa tiền vào HĐ thì vẫn hiện số bên cạnh BR-313 | Đúng – không xác nhận khoản tiền chưa xem | – |

**Không hứa hoàn tiền sai.** Không câu nào hứa hoàn ký quỹ hay hoàn tiền thuê tháng đang ở. Phần hoàn duy nhất (tiền thuê tháng lịch chưa bắt đầu) đúng BR-313 và ghi rõ "làm ngoài app", khớp sổ tay ("tiền thuê và ký quỹ ghi ngoài app").

## 3. Thẻ feedback

### FB-R4-DOM-FE-A-01
- Mức độ: Major
- Vị trí: `product/apps/admin-web/src/pages/stay/EarlyDepartureDialog.tsx:75` (`const lease = r.stayType === 'long'`), các chỗ dùng ở dòng 327, 405, 524–532, 608; test `r4-bug014-early-departure-lease.test.tsx`
- Vấn đề: `lease` chỉ xét loại đơn, không xét **ngày rời mới so với ngày kết thúc HĐ**. Đơn dài hạn gia hạn được bằng B13 (`allowed-actions.ts` mở `extend_stay` cho mọi đơn đang ở). Đơn con gia hạn là `short` (`reservations.service.ts:2208`). B16 cho chọn tới `stayDepartureDate − 1`, tức là vào phần gia hạn. Ví dụ HĐ 3 tháng căn 101, vào 20/11/2026, kết thúc 20/02/2027 (BR-209). Khách gia hạn 20/02 → 27/02 theo BR-210 (283.000/ngày), rồi báo rời 24/02. Hộp sẽ hiện "Vi phạm HĐ: khách mất toàn bộ ký quỹ 8.500.000". Thực tế khách đã ở **đủ** HĐ, không vi phạm gì, chỉ bỏ 3 đêm gia hạn. Nếu server tính tiền cho các đêm gia hạn (đơn con có giá) thì hộp hiện **cả** BR-313 lẫn bảng BR-428, tự mâu thuẫn.
- Vì sao quan trọng: lễ tân báo nhầm khách mất 8,5 triệu ký quỹ, đúng loại tranh chấp tiền mà BR-313 muốn tránh. Khách dài hạn hay ở thêm vài ngày cuối HĐ (chờ chuyến bay, Tết).
- Đề xuất sửa: tính `lease = r.stayType === 'long' && newDate < r.departureDate`. `r.departureDate` của đơn chính là "Ngày ra (theo HĐ)" (`lsm.move_out`). Bước kết quả dùng `leaving < r.departureDate`. Nếu `newDate ≥ r.departureDate` thì hộp đi đường thường của các đêm gia hạn (BR-428 trên đơn con), không có câu BR-313. Thêm 2 ca test: (a) HĐ có gia hạn, rời trong phần gia hạn → không có `lease_rule`; (b) HĐ có gia hạn, rời trước ngày kết thúc HĐ → có `lease_rule`, đơn con bị hủy theo `effect_child_cancelled`.
- Trạng thái: Open

### FB-R4-DOM-FE-A-02
- Mức độ: Major
- Vị trí: `product/design/tools/gen_strings.py` nhóm "R4 BUG-R4-014" – khóa `early_departure.lease_rule`, `lease_rule_no_amount`, `told_guest_lease` (VI + EN)
- Vấn đề: câu khẳng định mọi HĐ đều "mất toàn bộ ký quỹ". Đơn `manualLongStay` lại chính là **HĐ giấy đang chạy trước khi dùng app** (US-017 AC5a, `lsm.flag_body` "Hợp đồng, lịch thu theo kỳ và ký quỹ vẫn làm như hiện nay"). Các HĐ này ký theo điều khoản cũ: ESC-006 (báo trước ≥ 30 ngày mất 50 %) hoặc điều khoản riêng của HĐ (BR-006 snapshot). BR-313 v0.5.1 ghi rõ "HĐ mới ghi đúng điều khoản này". BR-201 ghi "HĐ trước đó giữ snapshot". Chính sách mới không áp ngược vào HĐ đã ký.
- Vì sao quan trọng: với HĐ cũ, lễ tân sẽ báo khách mức phạt nặng hơn HĐ đã ký. Đó là sai tiền theo hợp đồng, dễ thành khiếu nại. Ô tích "Đã báo khách: mất toàn bộ ký quỹ" còn lưu bằng chứng là lễ tân đã báo sai.
- Đề xuất sửa: câu phải dẫn về HĐ, không khẳng định một mức cho mọi đơn. Desk v1.0 không có ngày ký HĐ nên không tự phân loại được. Đề xuất chữ, chờ UXD/CPY biên tập:
  - `lease_rule`: VI "Trả trước ngày kết thúc HĐ là vi phạm HĐ. HĐ ký từ 01/11/2026: khách mất toàn bộ ký quỹ {amount} (giữ ngoài app), không truy thu giảm giá kỳ hạn. HĐ ký trước đó: làm theo điều khoản ký quỹ trong HĐ giấy – hỏi quản lý trước khi báo khách." · EN "Leaving before the lease end date breaks the lease. Leases signed from 1 Nov 2026: the guest forfeits the full deposit of {amount} (held outside the app), no clawback of the lease-term discount. Older leases: follow the deposit clause in the paper lease – check with the manager before telling the guest."
  - `lease_rule_no_amount`: như trên, bỏ {amount}.
  - `told_guest_lease`: VI "Đã báo khách cách xử lý ký quỹ theo HĐ và các khoản còn thu, còn hoàn" · EN "I've told the guest how the deposit is handled under the lease, and what is still due or refunded".
  - Nếu ngăn kéo có `externalContractRef` thì có thể chèn số HĐ giấy vào câu (không bắt buộc).
  - Mốc "01/11/2026" là giả định của DOM (ngày INV quyết ESC-045 câu 4, cũng là ngày bảng giá mới bắt đầu áp cho HĐ báo giá – BR-201). ORC ghi vào decision-log. Đây không phải chính sách mới nên không cần ESC: HĐ đã ký thì làm theo HĐ.
- Trạng thái: Open

### FB-R4-DOM-FE-A-03
- Mức độ: Minor
- Vị trí: khóa `early_departure.lease_still_due` (VI + EN)
- Vấn đề: (1) câu chưa nói **tháng lịch đang ở không hoàn** (BR-313, BR-207), nên lễ tân dễ hoàn theo ngày phần còn lại của tháng. (2) Phí dịch vụ 200.000/tháng cũng được thu trước theo tháng lịch, cùng hạn ngày 05 (BR-204, BR-207). Tháng chưa bắt đầu thì chưa dùng dịch vụ, nên hoàn cùng tiền thuê. DOM chốt theo NGÀNH: BR-313 chỉ ghi "tiền thuê" là do sót, và DOM sẽ bổ sung ở lần cập nhật BR kế tiếp.
- Vì sao quan trọng: hoàn thừa (theo ngày) hoặc hoàn thiếu (giữ phí dịch vụ tháng chưa ở) đều sai tiền nhỏ và dễ cãi.
- Đề xuất sửa: VI "Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ – không trừ vào ký quỹ. Tiền thuê và phí dịch vụ đã thu cho tháng lịch chưa bắt đầu thì hoàn; tháng đang ở không hoàn (làm ngoài app)." · EN "Unpaid utilities, extra cleaning and damage are still collected – not taken from the deposit. Rent and service fee already paid for calendar months not yet started are refunded; the current month is not (outside the app)."
- Trạng thái: Open

### FB-R4-DOM-BE-A-04
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/frontdesk/internal/stay.service.ts:1843` (`reason: BR-428 notice …d`)
- Vấn đề: B16 trên đơn `long` vẫn ghi nhật ký "BR-428 notice 30d" (QA đã thấy trên OTM-00008). Khi có tranh chấp ký quỹ, quản lý đọc nhật ký sẽ thấy quy tắc sai.
- Vì sao quan trọng: nhật ký là bằng chứng khi khách khiếu nại (BR-011). Không sai tiền.
- Đề xuất sửa: với `stay_type = 'long'` và ngày rời mới < ngày kết thúc HĐ, ghi "BR-313 lease early end – deposit per lease" (không ghi số ngày báo trước). Có thể dời sang v1.0.3.
- Trạng thái: Open

### FB-R4-DOM-BA-05
- Mức độ: Minor
- Vị trí: `product/docs/manual/guides/02-le-tan.md` mục 11.5, 17.5 (và bản HTML)
- Vấn đề: sổ tay vẫn ghi "Desk chưa trả phòng được trước ngày đi" và chỉ nêu BR-428. Từ v1.0.2 Desk có B16, kể cả cho HĐ tháng.
- Vì sao quan trọng: lễ tân làm theo sổ tay, không theo hộp.
- Đề xuất sửa: khi v1.0.2 phát hành, viết lại 11.5/17.5 thành hai nhánh: ngắn ngày theo BR-428; HĐ tháng theo BR-313. Nhánh HĐ tháng ghi theo FB-02: HĐ cũ làm theo HĐ giấy, hỏi quản lý. Thêm các bước: nhận lại căn, chốt công tơ ngày rời (BR-502), biên bản kiểm phòng có ảnh (BR-214), hoàn tháng chưa bắt đầu ngoài app, khai báo lưu trú (khách NN).
- Trạng thái: Open

## 4. ESC mới

- **ESC-048** (Bình thường, không chặn PR #22): khách thuê tháng **đã trả đủ tiền thuê tới hết HĐ** (kỳ cuối đã thu ngày 05) mà rời trước ngày kết thúc HĐ vài ngày thì có tính là vi phạm và mất toàn bộ ký quỹ không. Đề xuất B: không tính là vi phạm, ký quỹ quyết toán theo BR-214, không hoàn ngày không ở. Tới khi INV trả lời, Desk giữ đúng câu BR-313 INV đã quyết. Chi tiết: `02-escalations/ESC-048.md`.

## 5. Điểm làm tốt (nên giữ)
- Server có đưa tiền vào HĐ thì hộp vẫn hiện số bên cạnh BR-313 (`hasMoney`). Đúng nguyên tắc "không xác nhận khoản tiền chưa thấy".
- Bỏ hẳn "Không có khoản hoàn · Phí 0 đ" và "báo trước N ngày" với HĐ, đúng gốc lỗi QA nêu. Không đổi gì ở đường ngắn ngày (test ca 1 giữ nguyên bảng BR-428).
- Giữ B16 cho HĐ (phương án b) là đúng vận hành: căn được trả về để bán lại ngay. Phương án (a) chặn B16 sẽ bắt lễ tân "giữ căn ảo" tới ngày ra theo HĐ.
