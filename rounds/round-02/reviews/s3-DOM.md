# DOM review nghiệp vụ – Round 2, Sprint 3 (bước Review chéo, code HEAD `789ac90`)

- Người review: DOM | Ngày: 17/10/2026 | Chuẩn so: `product/docs/business-rules.md` **v0.3.3**, `specs/EP03-05-stay.md` v0.2, `specs/EP06-registration.md` v0.2, `state-machines.md` (SM-01 B9…B18, SM-11), backlog US-025…039, US-022, US-137.
- Đối tượng: `outputs/BE/s3-be-a.md`, `s3-be-b.md`, `s3-be-c.md`, `outputs/INT/s3-report.md`; code `frontdesk/{public/stay-rules.ts, internal/{checkin,stay,checkout,party,stay-support}.service.ts}`, `folio/{public/folio.service.ts, internal/bill.service.ts}`, `payments/internal/{payments,refunds}.service.ts`, `inventory/internal/minibar.service.ts`, `reservations/internal/reservations.service.ts` (`confirmedStay`, `update`), `registration/internal/{rules,registration.service}.ts`, `integrations/doorlock/access.ts`; FE `CheckOutPage.tsx`, `RegistrationPage.tsx`, `mocks/stay.ts` (đối chiếu hành vi mock ↔ API thật).
- Cách review: đi từng luồng lễ tân thật (nhận phòng 04:40 / 10:00 / 01:30 → lưu trú: thêm người, gia hạn, trả muộn, đổi phòng, trả sớm → trả phòng 3 bước → bill → thu/hoàn) và **tính tay** theo ví dụ BR (mục B). Không chạy test (máy DOM không có Node).
- Kết quả: **22 thẻ – Blocker 2 · Major 8 · Minor 11 · Suggestion 1**. Quyết định nghiệp vụ trong quyền DOM: mục A (đã ghi `01-decisions/decision-log.md`). **ESC mới: ESC-018** (mẫu biểu thật của cổng khai báo – chỉ OTTIMO có tài khoản).

---

## A. Trả lời các điểm đang chờ DOM (quyết định – nhãn NGÀNH, DOM tự chốt)

| # | Câu hỏi | Quyết định DOM | Thẻ liên quan |
|---|---|---|---|
| S3-1 | B16 trả sớm: có tính lại bậc giảm BR-107 cho các đêm đã ở không? (BE-A giả định 7: không) | **Đồng ý – không tính lại.** Chế tài của trả sớm là BR-428 (giữ 50 % tiền các đêm bỏ hoặc 100 % khi báo 0 ngày); tính lại bậc nữa là phạt hai lần. Nhất quán với cách INV chọn cho dài hạn (BR-313, ESC-006 A: "không truy thu phần giảm giá kỳ hạn"). "Rút ngắn" trong BR-107 v0.3.2 chỉ áp cho **đổi ngày trước khi nhận phòng** (B7/B8); thêm đêm (B13, B9a) vẫn tính lại bậc. Kẽ hở nhỏ đã biết: đặt 7 đêm, báo trước 1 ngày rời sau đêm thứ 6 → trả 5,85 đêm giá gốc thay vì 6 đêm (lợi ≤ 0,15 đêm) – chấp nhận, vì phải báo trước và khách sạn có cơ hội bán lại đêm đó. BR-107 sẽ sửa câu chữ ở v0.3.4 | BE-23 |
| S3-2 | B16: phí giữ lại `early_departure_fee`, yêu cầu hoàn = min(BR-428, tiền dư) (BE-A giả định 7) | **Đồng ý cách làm, sửa 4 điểm**: (a) cơ sở BR-428 = **giá trị ròng khách trả cho các đêm bỏ** (`room_revenue_vnd` = giá sau bậc BR-107 − FOC/giảm giá đặc biệt đã duyệt của đêm đó), không phải `room_revenue_gross_vnd`; (b) **phụ thu người** (BR-110) của các đêm bỏ **hoàn 100 %** (dịch vụ không dùng) và gộp vào cùng yêu cầu hoàn; (c) yêu cầu hoàn = min(phần hoàn BR-428 + phụ thu người đêm bỏ, `creditVnd` − các yêu cầu hoàn đang mở); làm tròn phần hoàn lên theo BR-005 (lợi khách – như test 852.000) là đúng; (d) `early_departure_fee` là **doanh thu khác** (BR-904), không tính hoa hồng (BR-903 chỉ tiền phòng). Đơn **OTA**: app không tự tính phí/hoàn (BR-428 "theo OTA") nhưng lễ tân **nhập số OTA giữ lại** (lấy từ extranet) → ghi `early_departure_fee`; tiền OTA thu hộ **không bao giờ** vào luồng hoàn của OTTIMO | BE-23, BE-14 |
| S3-3 | Hoa hồng `earned` khi khoản do SAL/CTV ghi đã đối soát (BE-B S3-B6) – có khớp BR-903 không? | **Không khớp – hai điều kiện là "VÀ", không phải "HOẶC".** Hoa hồng ngắn ngày chuyển `projected → earned` khi **đủ cả**: (1) BR-903 / SM-11: đơn `checked_out` **và** đã thu đủ (folio không còn phải thu; công nợ BR-525 → khi trả xong nợ); (2) BR-527: mọi khoản thu do **chính người nhận hoa hồng** ghi trên folio đã `reconciled` (không còn `pending`/`disputed`). Chuyển trạng thái chạy ở **sự kiện xảy ra sau cùng**: B18, đối soát/xác nhận tiền mặt nộp quầy, hoặc thu nợ sau trả phòng. Dài hạn: điều kiện đợt BR-212 **và** BR-527. Oracle **BR-527-05 của DOM ghi sai** ("hoa hồng của sale thành đạt" ngay sau xác nhận tiền mặt ngày 20/10 cho đơn chưa ở) – DOM sửa ở bước Phản hồi & sửa thành "điều kiện đối soát đạt; hoa hồng vẫn `projected` tới khi trả phòng và thu đủ" + thêm ca kết hợp | BE-15 |
| S3-4 | `retain_with_guest_consent` → dòng `deposit_forfeit` (BE-A giả định 8, ARC A-34) | **Đồng ý dùng có điều kiện**: chỉ khi khách **tự nguyện từ bỏ** khoản thừa (ví dụ "khỏi thối", khoản nhỏ khách không muốn nhận lại), có xác nhận của khách (chữ ký/tin nhắn – ghi trong `reason`); ghi là **doanh thu khác**, bill in "Khách để lại tiền thừa (không hoàn)" – **không** in chữ "mất cọc". **Không** dùng cho "để lại cho lần sau": ghi doanh thu bây giờ rồi lần sau "giảm giá thủ công" là ghi nhận doanh thu sai kỳ và mở đường giảm giá không truy vết. R2: khách muốn để lại cho lần sau → **yêu cầu hoàn** (`refund_request`); R3 làm ví tín dụng khách (số dư gắn hồ sơ khách, trừ vào đơn sau có liên kết) | BE-24, BA-02 |
| S3-5 | Dữ liệu cổng khai báo: ngày `YYYY-MM-DD`, quốc tịch mã ISO alpha-3 trong clipboard – cổng thật cần gì? (BE-C giả định 7; INT yêu cầu DOM đối chiếu thứ tự/nhãn) | DOM **không có** tài khoản cổng của OTTIMO nên không xác nhận được biểu mẫu thật → **ESC-018** (nhờ lễ tân OTTIMO chụp biểu mẫu trống). Trong khi chờ, mặc định **[GIẢ ĐỊNH – chờ INV xác nhận, ESC-018]**: (a) **ngày `dd/mm/yyyy`** (cách viết ngày trên văn bản và biểu mẫu nhà nước VN; adapter của INT cũng đang dùng dạng này – hai bản cài hiện **lệch nhau**); (b) **quốc tịch** hiển thị và sao chép "**tên nước tiếng Việt (mã 3 chữ)**", ví dụ "Hàn Quốc (KOR)" – ô quốc tịch trên cổng thường là danh sách chọn, lễ tân gõ tên để tìm; (c) định dạng ngày và cách ghi quốc tịch là **tham số** (đổi không sửa code); (d) **"Ngày đến" = ngày lịch của giờ nhận phòng thực tế** (`actualCheckinAt`, BR-602, BR-417 (4)), không phải ngày đến của đơn. Lưu trữ vẫn mã alpha-3 (khớp vùng MRZ, E06-05) | BE-22, ESC-018 |
| S3-6 | Giá mặc định đêm gia hạn = lịch giá Trực tiếp của đêm đó (BE-A giả định 4) | **Đồng ý** – đúng tinh thần BR-421 "giữ giá đêm của đơn": đơn theo lịch giá thì đêm thêm theo lịch giá (ngày thường/cuối tuần/ngày đặc biệt), không "bê" giá thứ Bảy sang Chủ nhật. Bổ sung: đơn có **giá thỏa thuận** (đêm nguồn `manual`/báo giá) → màn gia hạn gợi ý "giá đơn hiện tại" để lễ tân nhập lại (trong sàn–trần); ngày đặc biệt luôn giá ngày đó. BR-421 sửa câu chữ ở v0.3.4 | BE-31 |
| S3-7 | Trẻ em chỉ có năm sinh: tuổi = năm đến − năm sinh (BE-A giả định 11) | **Sửa**: khi chỉ có năm sinh, lấy **tuổi nhỏ nhất có thể** = năm đến − năm sinh − 1 (coi như chưa tới sinh nhật). Lý do: có lợi cho khách ở phụ thu/sức chứa (BR-110) và an toàn hơn ở ngưỡng dữ liệu trẻ em (BR-612). Ví dụ đến 20/10/2026, sinh năm 2020 → coi 5 tuổi → miễn phụ thu, không tính sức chứa. Lễ tân thấy giấy tờ có ngày sinh đầy đủ thì theo ngày sinh | BE-16 |
| S3-8 | Các giả định khác của BE-A (1, 2, 3, 5, 6, 9, 10) và BE-C (4, 5, 8) | **Đồng ý**: người đứng tên không có dòng `reservation_guest`; thêm người cho đơn chưa nhận phòng → sửa số khách trước; đơn con B9a/gia hạn OTA cùng căn, cùng folio, trả phòng trên đơn chính; sau trả phòng căn `VD` (đúng BR-402/803); K11 `void` gồm `scanned` (chưa khai trên cổng); `mixed` bị từ chối → khai lại mọi khối; `guestFirstName` theo kiểu tên | – |
| S3-9 | Trả phòng sau mốc cuối BR-412 (> 18:00 và sau nửa đêm – G-16 của DOM) | **DOM tự nhận G-16 thiếu**: "gia hạn 1 đêm rồi quay lại trả phòng" làm ngày đi = ngày nghiệp vụ + 1 nên B18 bị chặn tới 06:00 hôm sau. Chốt: trả phòng sau mốc cuối = **một thao tác** "Trả phòng – tính thêm 1 đêm": server thêm đêm D (giá BR-421, đêm bán – BR-416) và hoàn tất B18 **ngay** trong cùng giao dịch; giờ trả thực tế được ghi, **không** thêm phụ thu trả muộn (đã tính tròn đêm). Tương tự B9a, B18/B16 nhận "cửa sổ sau nửa đêm": ngày nghiệp vụ = ngày đi − 1 **và** ngày lịch = ngày đi (00:00–05:59) → trả phòng được, giờ đó trước giờ chuẩn nên phụ thu 0 | BE-19 |
| S3-10 | Yêu cầu nào được chặn hoàn tất trả phòng (`pending_approvals`) | Chỉ **yêu cầu tiền**: FOC, giảm giá đặc biệt, định giá hư hỏng (`damage_pricing`) – đúng EP03-05 5.5 / US-038 AC4. Yêu cầu **vận hành** (`checkin_room_not_ready`, `late_checkout_conflict`) không chặn B18 và **tự hủy** khi bị thay thế (đã nhận phòng bằng đường khác; đã trả phòng) – ghi lý do "superseded" | BE-20 |
| S3-11 | Phụ thu tính lại khi giờ thực tế khác giờ đã hẹn mà dòng cũ đã có FOC được duyệt (G-10) | FOC đã duyệt **đi theo** dòng mới: FOC mới = min(FOC đã duyệt, phụ thu mới), cùng người duyệt, không phải duyệt lại (không vượt số đã duyệt). Khách được miễn trả muộn 17:00 rồi trả lúc 13:00 → vẫn 0 đ | BE-17 |
| S3-12 | Lễ tân bỏ tích "Ghi phụ thu" khi phụ thu theo giờ đã nhập > 0 | Không có đường "bỏ qua im lặng": phụ thu > 0 thì **ghi**, hoặc **ghi + FOC** (theo hạn mức BR-433, tự áp minibar BR-436 không áp cho phụ thu). BR-414 "lễ tân xác nhận" là xác nhận **đúng giờ và đúng số**, không phải quyền miễn (US-026 AC4: miễn → luồng duyệt US-007). Giờ nhận/trả nhập tay khác giờ thao tác quá `manual_time_tolerance_minutes` (đề xuất 30 phút) → bắt buộc ghi chú, vào danh sách đóng ca (BR-526) | BE-18 |
| S3-13 | Phụ thu người khi số người đổi giữa kỳ hoặc đổi căn | Phụ thu người tính **theo từng đêm**: số người có mặt đêm đó so với định mức của **căn đêm đó**. Thêm/bớt người giữa kỳ áp **từ đêm `effectiveFrom`**, không đụng các đêm đã qua. Đổi phòng `guest_request` → theo định mức căn mới; `property_fault` → phụ thu người các đêm còn lại = **min**(mức căn cũ, mức căn mới) (lỗi của OTTIMO không làm khách trả thêm). Người vượt tính theo **mức thấp hơn** xét toàn bộ người có mặt (BR-110), không theo người vừa thêm | BE-16 |
| S3-14 | Khách đến cùng ngày (ân hạn BR-412, giới hạn BR-416, thứ tự BR-425) gồm những đơn nào | Đơn `confirmed` **và** `hold` gán căn đó có ngày đến = ngày trả phòng (đúng chữ BR-412). Thực tế chỉ còn `hold` có **cọc một phần** sau 12:00 (D-9 không tự hủy) – vẫn là khách đã trả tiền giữ căn | BE-28 |
| S3-15 | Đổi phòng đơn OTA theo yêu cầu khách: chênh lệch tính thế nào | Chênh lệch mỗi đêm = max(0, giá Trực tiếp hiện hành căn mới − giá Trực tiếp hiện hành căn cũ) – **cùng cơ sở** với phụ thu OTA (BR-415); không so với giá OTA (đã gồm phí kênh). Dòng `room_change_difference` là **doanh thu phòng** (BR-904), phân bổ vào các đêm | BE-26 |
| S3-16 | Mã cửa (R3 – INT đã có tiện ích) | Hiệu lực tới **giờ trả đã hẹn**, không hẹn thì tới mốc ân hạn `late_grace_until` (khách đang thu dọn lúc 12:15 không bị khóa ngoài); **luôn thu hồi ngay khi B18**. B9a: hiệu lực từ lúc nhận phòng thực tế | INT-01 |

---

## B. Tính tay theo ví dụ BR (so với code HEAD)

| # | Ca (nguồn) | Tính tay | Code hiện tại | Kết quả |
|---|---|---|---|---|
| 1 | BR-411-01: đêm đầu 700.000, nhận 11:00 | 30 % × 700.000 = **210.000** | `earlyCheckinSurcharge` bậc [10:00, 14:00) 30 %, làm tròn 1.000 nửa lên | Khớp |
| 2 | BR-415: Booking căn 203, đêm đầu thứ Ba, giá Trực tiếp 792.000, nhận 11:00 | 30 % × 792.000 = 237.600 → **238.000** | `surchargeBase` OTA = `directRate` | Khớp |
| 3 | BR-413 / G-2: HĐ 11.130.000 → 371.000/đêm; nhận 08:00 căn trống đêm trước / có khách trả cùng ngày | **0** / 50 % × 371.000 = 185.500 → **186.000** | `vacantPreviousNight` + bậc BR-411 trên giá quy đổi | Khớp |
| 4 | BR-412-08…11: 700.000; 12:20 / 12:30 / 12:31 không khách đến; 12:20 có khách đến | 0 / 0 / **210.000** / **210.000** | ân hạn `≤ 12:30` khi không có khách đến; bậc (12:00, 15:00] | Khớp (trừ ca `hold` cọc một phần – BE-28) |
| 5 | BR-412-07: trả 19:00 → gia hạn 1 đêm 700.000 | +700.000, khách rời 19:00, bill ngay | `LATE_CHECKOUT_AFTER_LIMIT`; gia hạn xong B18 đòi ngày nghiệp vụ = ngày đi mới → **kẹt tới 06:00** | **Sai** – BE-19 |
| 6 | G-10: hẹn 17:00 (50 % × 708.000 = 354.000), trả 13:00 | 30 % × 708.000 = 212.400 → **212.000**, tự đảo 354.000 | đảo dòng cũ + ghi 212.000 | Khớp |
| 7 | G-10 + FOC: như trên nhưng 354.000 đã FOC (khách quen) | Ròng **0** (FOC theo dòng mới: min(354.000, 212.000) = 212.000) | đảo dòng + FOC, ghi 212.000 **không FOC** → khách nợ 212.000 | **Sai** – BE-17 |
| 8 | BR-107-04 (D-8): 5 đêm 9/11–14/11 = 4.079.000, gia hạn tới 16/11 | 5 × 713.000 + 2 × 820.000 = **5.205.000** | `retier` áp lại 10 % mọi đêm | Khớp |
| 9 | BR-428-01: 4 × 700.000, báo 21/10 rời 22/10 | bỏ 2 đêm 1.400.000 → hoàn **700.000**, phí **700.000** | khớp (test BE-A 1.703.000 → hoàn 852.000, phí 851.000 – làm tròn lợi khách, đúng) | Khớp |
| 10 | B16 rồi B18 khi khoản hoàn chưa chi (ca 9) | 1 yêu cầu hoàn 700.000 | B16 tạo 700.000; B18 thấy `creditVnd` 700.000 → bắt chọn → tạo **thêm** 700.000; chi hoàn không chặn theo số dư thừa | **Sai tiền** – BE-14 |
| 11 | B16 đơn 7 đêm có giảm 10 % (9/11–16/11), báo ≥ 1 ngày, rời 14/11 | đêm bỏ 14/11 (820.000) + 15/11 (713.000) = 1.533.000 → hoàn 766.500 → **767.000**; phí **766.000**; đêm đã ở **3.672.000** (không tính lại bậc – S3-1) | dùng `room_revenue_gross_vnd` (sau bậc) → khớp khi đêm bỏ không có FOC | Khớp (lệch khi đêm bỏ có FOC – BE-23) |
| 12 | BR-110 + giữa kỳ: căn 202, 2 NL, 20–24/10; 22/10 thêm 1 NL | +150.000 × 2 đêm = **300.000** | qua `addPartyMember`: 300.000 – khớp; qua `updateReservation`: snapshot áp **mọi đêm** = 600.000 | **Sai** – BE-16 |
| 13 | Ca 12 rồi gia hạn 1 đêm (B13) | 300.000 + 150.000 = **450.000** | `resyncStay` đảo dòng 300.000 (không khớp snapshot 0), đêm mới không phụ thu → **0** | **Sai** – BE-16 |
| 14 | BR-110-03 + B14: 3 NL căn 202 (định mức 2) đổi theo yêu cầu sang 302 (định mức 3), 2 đêm thường | phụ thu người 2 đêm còn lại = **0** (giá phòng 917.000/đêm) | phụ thu snapshot 150.000/đêm giữ nguyên → thừa **300.000** | **Sai** – BE-16 |
| 15 | BR-110: căn 202 có 1 NL + 1 trẻ 8 tuổi (tính 2 = định mức), thêm 1 NL giữa kỳ | người vượt là trẻ → **100.000**/đêm | tính theo người vừa thêm (NL) → 150.000/đêm | **Sai** – BE-16 |
| 16 | BR-903-01: CTV, 7 đêm 5.205.000 | **416.400** `earned` khi `checked_out` + thu đủ | `earned` ngay khi lễ tân xác nhận tiền mặt cọc sale nộp (trước kỳ ở); đơn do lễ tân thu hết tiền → **không bao giờ** `earned` | **Sai** – BE-15 |
| 17 | BR-307 / US-036 AC3: Agoda trả trước căn 302, 2 đêm 1.800.000, minibar 70.000 | còn phải thu **70.000** | còn phải thu **1.870.000** → B18 `BALANCE_DUE`; bill in "Đã thu qua Agoda" và "Còn phải thu 1.870.000" (mock FE tự trừ nên FE không lộ lỗi) | **Sai tiền** – BE-13 |
| 18 | BR-602 + BR-417 (4): đơn Trực tiếp 201 đến 20/10, nhận 04:40 ngày 20/10 (B9a) | hạn khai báo VN 23:00 20/10 ✓; dữ liệu cổng "Ngày đến" = **20/10/2026** | hạn đúng; "Ngày đến" trên dữ liệu cổng = `2026-10-19` (ngày đến của đơn sau khi thêm đêm trước) | **Sai** – BE-22 |
| 19 | BR-511-02: mùi thuốc + mất 1 thẻ | **700.000** | khớp; nhưng số thẻ phạt không bị giới hạn bởi số thẻ đã phát | Khớp (BE-27) |
| 20 | BR-702-01: 2 bia + 1 snack + 2 nước miễn phí | **100.000** | khớp | Khớp |

---

## C. Thẻ feedback

### FB-R2-DOM-BE-13
- Mức độ: **Blocker**
- Vị trí: `folio/public/folio.service.ts` `computeTotals` (dòng 198–243: `balanceDueVnd = total − paid` không trừ phần OTA thu hộ); `frontdesk/internal/checkout.service.ts` B18 (dòng 312–315 `BALANCE_DUE`); `folio/internal/bill.service.ts` (dòng 130–143, 193); không nơi nào tạo giao dịch `ota_collect` cho đơn `ota_prepaid`. FE `mocks/stay.ts` dòng 589 tự đặt `paidViaOtaVnd = roomVnd` nên FE chạy mock không thấy lỗi.
- Vấn đề: Đơn OTA **khách đã trả cho OTA** (Airbnb, Agoda trả trước, Booking "Payments by Booking") vẫn có dòng tiền phòng trên folio nhưng không có khoản "Đã thu qua OTA". Kết quả: (1) trả phòng bị chặn `BALANCE_DUE` = toàn bộ tiền phòng (ca 17: 1.870.000 thay vì 70.000); (2) bill in dòng "Đã thu qua Agoda 1.800.000" ngay trên dòng "Còn phải thu 1.870.000"; (3) spec 2.2 nói "không có nút ghi thu tiền phòng" cho đơn này nên lễ tân không có đường hợp lệ để qua; đường tắt duy nhất là ghi tay `ota_collect` hoặc… thu tiền khách lần nữa. Kèm theo: sau B16 của đơn OTA, nếu đã có `ota_collect` thì phần đêm bỏ thành `creditVnd` và B18 bắt "hoàn" khoản tiền OTTIMO không giữ.
- Vì sao quan trọng: Đơn OTA trả trước là phần lớn khách của căn hộ dịch vụ ở Đà Lạt. Luồng A1 (mục tiêu Sprint 3) không chạy được với khách OTA; tệ hơn, lễ tân lúc đông khách thấy màn hình đỏ "Còn phải thu 1.870.000" sẽ đòi khách trả lại tiền phòng đã trả cho OTA – khách khiếu nại, đánh giá xấu ngay trên chính OTA đó.
- Đề xuất sửa: (a) Đơn `ota_prepaid` khi xác nhận (B2 OTA / nhập tay) sinh **một giao dịch hệ thống `ota_collect`** = tiền phòng OTA của các đêm (BR-307 "folio ghi Đã thu qua OTA"), `reconciliation` theo đối soát kỳ trả tiền của OTA (R3); tự điều chỉnh khi đêm của đơn OTA đổi (B16, đổi ngày = hủy + tạo lại D-5); (b) phần dư sinh từ `ota_collect` **không** vào blocker `credit_balance` và không vào luồng hoàn của OTTIMO (OTA hoàn cho khách theo chính sách OTA); (c) bill `ota_prepaid`: tổng và "còn phải thu" chỉ tính khoản phát sinh tại quầy; (d) test: Agoda 302, 2 đêm 1.800.000 + minibar 70.000 → `balanceDueVnd` 70.000, B18 chỉ cần thu 70.000; (e) FE bỏ việc tự trừ trong mock để mock và API cùng một quy tắc (đề nghị ARC ghi vào contract `FolioTotals`).
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – khoản thu hệ thống `ota_collect` (`syncOtaCollect`/`resyncOtaCollect`, chỉ của chính đơn, theo mọi lần đảo/sửa dòng và duyệt FOC; 0043 bù dữ liệu); "Đã thu qua OTA" không vào `credit_balance`; test `ota-prepaid-flow` (B13 đơn con, B9a + E05-11, BR-307-03/04). Kiểm lại tiền S4-38 lượt 1–5 không còn lỗi vùng OTA trả trước

### FB-R2-DOM-BE-14
- Mức độ: **Blocker**
- Vị trí: `checkout.service.ts` dòng 316–335 (B18 `refund_request` lấy `amountVnd = balance.creditVnd`, không trừ yêu cầu hoàn đang mở); `stay.service.ts` dòng 1194–1208 (B16 tạo yêu cầu hoàn); `payments/internal/refunds.service.ts` dòng 417 (trần chi = min(duyệt − đã chi, **đã thu − đã hoàn**) – không phải số dư thừa hiện tại); `folio.service.ts` `creditVnd` tính cả khoản `pending` đối soát.
- Vấn đề: (1) **Hoàn trùng**: ca 10 – khách báo trả sớm (B16 tạo yêu cầu hoàn 700.000), sáng hôm sau trả phòng khi quản lý chưa duyệt/chưa chi → `creditVnd` vẫn 700.000 → B18 bắt chọn cách xử lý → lễ tân chọn "Đề nghị hoàn" → **yêu cầu thứ hai 700.000** cho cùng khoản tiền. Chi lần hai vẫn qua trần (đã thu − đã hoàn = 2.100.000 ≥ 700.000) → hoàn 1.400.000, folio đã `settled` thành nợ 700.000. (2) Trần chi không theo số dư thừa: phát sinh sau trả phòng (minibar, BR-427 c) làm số dư thừa giảm nhưng yêu cầu hoàn đã duyệt vẫn chi đủ. (3) **Khoản thừa dựa trên tiền chưa đối soát**: khách đưa ảnh chuyển khoản 3.000.000 cho bill 2.000.000 → `creditVnd` 1.000.000 → xin hoàn tiền mặt → lễ tân ca khác chi → sao kê không có tiền: mất 3.000.000 (kiểu lừa "chuyển dư rồi xin lại tiền mặt" – rất hay gặp).
- Vì sao quan trọng: Tiền mặt đã ra khỏi quầy thì không lấy lại được; hai yêu cầu cùng số tiền, khác mã lý do (`early_departure` và `overpayment`) – quản lý duyệt từ điện thoại rất dễ duyệt cả hai.
- Đề xuất sửa: (a) Định nghĩa **"số dư thừa chưa xử lý"** = `creditVnd` − Σ(yêu cầu hoàn đang mở: `pending`/`escalated`/`approved` chưa chi đủ); blocker `credit_balance` và `overpaymentHandling` chỉ dùng số này (B16 rồi B18 → 0 → không bắt chọn); (b) mọi lần chi (`executeCashRefund`/`executeRefund`) chặn thêm **≤ `creditVnd` hiện tại** của folio; (c) khoản thừa chỉ được **chi** khi các khoản thu tạo ra nó đã `reconciled` hoặc là `cash`/`card_pos` (`not_required`); còn `pending` → yêu cầu hoàn vẫn tạo được nhưng nút chi khóa với chú thích "Chờ đối soát khoản thu {PT-…}"; (d) test: B16 → B18 khi chưa chi → đúng 1 yêu cầu; phát sinh 70.000 sau khi duyệt → chi tối đa 630.000; khoản thừa từ chuyển khoản `pending` → chi bị chặn.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – (a) `unhandledCreditVnd` = credit − yêu cầu hoàn đang mở, B16 → B18 đúng một yêu cầu (test `ota-prepaid-flow` "DOM BE-14 (d)", `frontdesk-s3-fixes`); (b) chi ≤ `rawCreditVnd` hiện tại (`REFUND_EXCEEDS_APPROVED`); (c) chi chỉ phần có tiền đã đối soát (`REFUND_SOURCE_NOT_RECONCILED`, test `payments-s3`). Đơn đã đóng không nhận dòng phí tay (K11-06, gộp #11) – không còn đường làm dư thừa < yêu cầu

### FB-R2-DOM-BE-15
- Mức độ: Major
- Vị trí: `payments/internal/payments.service.ts` `earnRecorderCommission` (dòng 528–564); `checkout.service.ts` B18 (không có bước hoa hồng); SM-11 (`state-machines.md` dòng 439), SM-01 B18 (dòng 119); oracle `br-examples.json` BR-527-05 (DOM viết).
- Vấn đề: (1) Hoa hồng của sale/CTV thành `earned` **ngay khi** khoản cọc họ ghi được đối soát – có thể trước kỳ ở hàng tháng (ca 16: xác nhận 20/10 cho đơn tháng 11); đơn bị hủy sau kỳ chi 1/11 → đã chi hoa hồng cho doanh thu không có. (2) Ngược lại, **B18 không chuyển** `projected → earned` (SM-11 "ngắn ngày: đơn checked_out và thu đủ") → mọi đơn mà lễ tân thu hết tiền thì hoa hồng **không bao giờ** đạt. (3) `listCommissions` cộng `earned` cho sale/CTV xem – họ thấy "đã đạt" số tiền của đơn chưa ở. Nguồn gây nhầm một phần là oracle BR-527-05 của DOM (ghi "thành đạt") – DOM nhận lỗi, sửa ở bước Phản hồi & sửa.
- Vì sao quan trọng: Hoa hồng là tiền chi ra hằng tháng (BR-212 ngày 10); sai trạng thái thì chi sớm, chi cho đơn hủy, hoặc nợ CTV – mất lòng CTV, nguồn khách trực tiếp quan trọng của OTTIMO.
- Đề xuất sửa: theo quyết định **S3-3**: một hàm `tryEarnCommission(reservationId)` gọi ở B18 (sau `settle`), ở đối soát/xác nhận tiền mặt nộp quầy, và khi thu nợ sau trả phòng; điều kiện = đơn `checked_out` ∧ folio còn phải thu = 0 ∧ không còn khoản thu `pending`/`disputed` do chính người nhận hoa hồng ghi. Test: (a) sale ghi cọc 1.600.000 tiền mặt, lễ tân xác nhận 20/10 → vẫn `projected`; B18 9/11 thu đủ → `earned` 156.150; (b) lễ tân thu hết → B18 → `earned`; (c) B18 trước khi đối soát khoản của sale → `projected`, đối soát xong → `earned`.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – `FolioService.tryEarnCommissions` (S3-3: `checked_out` ∧ còn phải thu 0 ∧ người nhận không còn khoản `pending`/`disputed`), gọi ở B18, đối soát/nộp quầy, thu nợ sau trả phòng; bỏ "earned khi đối soát cọc"; test `payments-s3` BR-527-05 / A46a. Ghi chú: phủ hoa hồng CTV của S4-03 là việc G5 riêng, không thuộc thẻ này

### FB-R2-DOM-BE-16
- Mức độ: Major
- Vị trí: `reservations/internal/reservations.service.ts` `confirmedStay` (dòng 963–991: một mức `extraPersonFeePerNightVnd` của snapshot cho **mọi** đêm) và `update` (dòng 1112–1159: đổi số người khi `in_house` → `repriceExtraPersons` cả kỳ); `folio.service.ts` `syncStay` (dòng 736–766: đảo mọi dòng `extra_person` không khớp mức snapshot); `frontdesk/internal/party.service.ts` (dòng 289–296, 403–421: dòng phụ thu giữa kỳ một khối, mức theo người vừa thêm); `stay.service.ts` B14 (dòng 799–800 chỉ dùng định mức căn mới cho bộ đồ dùng, không cho tiền).
- Vấn đề: phụ thu người (BR-110) là **một con số cho cả kỳ ở**, trong khi số người và căn có thể đổi giữa kỳ: (1) lễ tân sửa số khách đơn đang ở bằng `updateReservation` (đúng chỉ dẫn EP03-05 0.1 dòng 3) → tính phụ thu cho **cả các đêm đã qua** (ca 12: 600.000 thay vì 300.000); bớt người thì hoàn luôn các đêm đã ở; (2) thêm người qua `addPartyMember` ghi đúng 300.000, nhưng **bất kỳ** `resyncStay` sau đó (gia hạn B13, đổi phòng B14, trả sớm B16, B9a) đảo mất dòng này (ca 13: còn 0); (3) B14 `guest_request` sang căn định mức lớn hơn vẫn giữ phụ thu (ca 14: thừa 300.000), sang căn nhỏ hơn thì không thu; (4) mức phụ thu khi thêm giữa kỳ theo người vừa thêm, trái "người vượt tính mức thấp hơn" (ca 15); (5) tuổi trẻ chỉ có năm sinh (S3-7); (6) đơn OTA tăng số khách qua `updateReservation` → `repriceExtraPersons` đặt phụ thu = 0 (`charged` chỉ direct/agent) dù số người thực tế vượt số khách trên đơn OTA – BR-110 "chỉ thu khi số người thực tế vượt số khách trên đơn" (đường `addPartyMember` thì có thu – hai đường cho hai kết quả).
- Vì sao quan trọng: Sai tiền cả hai chiều trong tình huống rất thường gặp ở OTTIMO (gia đình, bạn đến sau, đổi sang căn rộng hơn); thu thừa là khiếu nại, thu thiếu là mất doanh thu không ai thấy (dòng bị đảo "tự động").
- Đề xuất sửa: theo **S3-13**: phụ thu người tính **theo từng `stay_night`** (người có mặt đêm đó × định mức căn đêm đó; lưu số người theo đêm hoặc theo khoảng `effectiveFrom`); `updateReservation` khi `in_house` nhận `effectiveFrom` (mặc định đêm nay) hoặc chuyển hẳn sang `addPartyMember`/`removePartyMember`; `syncStay` sinh dòng `extra_person` theo đêm từ dữ liệu này (không còn dòng khối giữa kỳ bị đảo); B14 `property_fault` lấy min(mức cũ, mức mới); tuổi khi chỉ có năm sinh = năm đến − năm sinh − 1. Test: ca 12, 13, 14, 15 ở mục B.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – phụ thu người theo từng đêm (`nights[].extraPersonVnd`, `effectiveFrom` khi `in_house`), `syncStay` không còn đảo dòng giữa kỳ; OTA thu phần vượt `bookedParty`; B14 khách xin theo định mức căn mới, OTTIMO lấy min; người vượt tính mức thấp hơn; tuổi theo S3-7; test `frontdesk-s3-fixes` ARC-01/DOM-16, `room-capacity`, oracle BR-110/BR-429 (b2)

### FB-R2-DOM-BE-17
- Mức độ: Major
- Vị trí: `checkout.service.ts` dòng 243–289 (G-10): so `oldVnd` theo giá trị gộp, `reverseLine` đảo cả FOC đã duyệt, dòng mới không mang FOC.
- Vấn đề: ca 7 – khách quen được FOC trả muộn 17:00 (354.000, quản lý duyệt), thực tế trả 13:00 → server "tự đảo vì có lợi cho khách" nhưng làm mất FOC → khách nợ 212.000 cho khoản đã được miễn. Nhánh "tăng" cũng vậy: FOC cũ mất khi ghi lại.
- Vì sao quan trọng: Khách VIP/khách quen bị đòi tiền đã được miễn, ngay lúc trả phòng – đúng loại trải nghiệm làm mất khách quen; lễ tân phải gọi quản lý duyệt lại lúc đông khách.
- Đề xuất sửa: theo **S3-11**: so sánh theo **giá trị ròng** (dòng − FOC/giảm giá đã duyệt); khi ghi lại dòng mới, nếu dòng cũ có FOC `approved` thì ghi FOC mới = min(FOC cũ, phụ thu mới), cùng `approvedBy`, nhãn "Chuyển từ FOC {mã yêu cầu}"; FOC `pending` → giữ blocker như hiện tại. Test: ca 7 → ròng 0; FOC một phần 200.000 trên 354.000, trả 13:00 → FOC 200.000 trên 212.000, ròng 12.000.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – so theo giá trị ròng; FOC đã duyệt đi theo dòng mới = min(FOC, phụ thu mới), không duyệt lại (BR-434 v0.3.4, S4-38 S438-FOC-02); test `frontdesk-s3-fixes` ARC-06/DOM-17/DOM-18. Vùng FOC sạch từ kiểm lại lượt 3 tới lượt 5

### FB-R2-DOM-BE-18
- Mức độ: Major
- Vị trí: `checkin.service.ts` dòng 259, 340–351 (`applyEarlySurcharge` mặc định false, không hỏi gì khi bỏ tích); `checkout.service.ts` dòng 247–264 (nhánh tăng không tích → giữ số cũ); `stay.service.ts` B15 dòng 550–561; không kiểm `checkinTime`/`checkoutTime` nhập tay so với giờ thao tác.
- Vấn đề: Khi phụ thu theo giờ đã nhập > 0, lễ tân chỉ cần **không tích** là khách được miễn, không lý do, không người duyệt, không vào báo cáo FOC/cảnh báo thất thoát (BR-435). Thêm: lúc 10:00 bấm nhận phòng nhưng nhập giờ vào căn 14:00 (tương lai) vẫn được; trả phòng 14:35 nhập 12:00 cũng được – mất phụ thu mà nhật ký chỉ thấy "12:00".
- Vì sao quan trọng: Trái US-026 AC4 ("muốn miễn phụ thu → luồng duyệt US-007") và BR-432/433. Chủ đầu tư ở xa, quản lý theo số liệu: đây là đường thất thoát tiền mặt kinh điển (thu tiền khách, nhập giờ chuẩn).
- Đề xuất sửa: theo **S3-12**: phụ thu > 0 → `applySurcharge` phải `true` (có thể kèm `requestFoc`), thiếu → 422 mã trường `SURCHARGE_DECISION_REQUIRED` (ARC đặt tên); `checkinTime` không được muộn hơn giờ thao tác quá `manual_time_tolerance_minutes`; `checkoutTime` sớm hơn giờ thao tác quá ngưỡng → bắt buộc `timeNote`, ghi cả giờ nhập và giờ hệ thống vào nhật ký, hiện trong danh sách đóng ca. DOM thêm tham số `manual_time_tolerance_minutes` (30) vào BR mục 13 ở v0.3.4.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – 422 `SURCHARGE_DECISION_REQUIRED` (checkIn, setLateCheckout, checkOut, addPartyMember); giờ nhập tay muộn hơn giờ server > `manual_time_tolerance_minutes` → 422 `TIME_AFTER_ACTION`, sớm hơn → bắt buộc ghi chú (`TIME_NOTE_REQUIRED`), nhật ký có cả hai giờ; test `frontdesk-s3-fixes`

### FB-R2-DOM-BE-19
- Mức độ: Major
- Vị trí: `checkout.service.ts` dòng 225–240 (`lastDeparture !== ctx.today` → 409; `treatAsExtension` → 422); `stay.service.ts` B16 dòng 1082 (`nd ≥ today`); spec EP03-05 5.1/5.3 (G-16 của DOM).
- Vấn đề: Khách trả **sau 18:00** (BR-412-07: 19:00) hoặc **sau nửa đêm** (01:00, G-16): B18 báo phải gia hạn; gia hạn xong ngày đi = ngày nghiệp vụ + 1 nên B18 bị chặn "chỉ trả phòng đúng ngày đi" tới 06:00 sáng hôm sau; dùng B16 rời "hôm nay" thì lại rơi về giờ > 18:00 → vòng lặp. Lễ tân không trả phòng, không in bill, không đổi buồng `VD` được khi khách đã đi. Lỗi gốc ở hướng dẫn G-16 của DOM (thiếu bước này).
- Vì sao quan trọng: Khách bay chuyến tối hoặc xe đêm về Sài Gòn là chuyện thường ở Đà Lạt; khách đứng chờ bill mà lễ tân không làm được, buồng phòng không nhận việc dọn, rack báo sai tới sáng.
- Đề xuất sửa: theo **S3-9**: (a) B18 nhận tùy chọn `addLateNight: true` (khi giờ trả > mốc cuối): trong cùng giao dịch thêm đêm D (giá BR-421, xác nhận số tiền như BR-414) rồi trả phòng, không ghi phụ thu trả muộn; (b) cửa sổ sau nửa đêm cho B18/B16 như B9a: ngày nghiệp vụ = ngày đi − 1 và ngày lịch = ngày đi trước 06:00 → hợp lệ, phụ thu 0; (c) `checkoutAt` (E05-09) là nguồn giờ chuẩn cho các ca này. Test: 19:00 ngày 23/10 → bill có đêm 23/10, đơn `checked_out` 19:00, buồng `VD`; 01:00 ngày 24/10 (đơn đã gia hạn tới 24/10) → trả phòng được, phụ thu 0.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – (a) `checkOut.extraNight` (thêm đêm ngày đi, không phụ thu trả muộn, cùng giao dịch; giá theo bảng BR-417 phụ lục 5A) và đường BR-416-06 khi đêm không bán được; (b) cửa sổ sau nửa đêm `postMidnightWindow` (ngày nghiệp vụ = ngày đi − 1, phụ thu 0); test `frontdesk-s3-fixes` "DOM-19 (b) / DOM-25" (01:00), E05-11; B16 không cần cửa sổ riêng (ngày đi mới = ngày lịch rời vẫn ≥ ngày nghiệp vụ)

### FB-R2-DOM-BE-20
- Mức độ: Major
- Vị trí: `checkout.service.ts` `pendingApprovals` (dòng 102–111: mọi yêu cầu `pending`/`escalated` trừ `refund`); `checkin.service.ts` (yêu cầu `checkin_room_not_ready` không tự hủy khi nhận phòng bằng đường khác); `stay.service.ts` B15 (yêu cầu `late_checkout_conflict` không tự hủy).
- Vấn đề: Lễ tân ca sáng xin "nhận khi buồng chưa sẵn sàng" lúc 13:30, 13:45 buồng phòng dọn xong → nhận phòng bình thường; yêu cầu cũ còn `pending`. Ba ngày sau lúc 12:00, B18 báo `PENDING_APPROVALS` – lễ tân ca trưa không phải người gửi nên không hủy được, phải gọi quản lý. Tương tự yêu cầu trả muộn khách đổi ý không dùng.
- Vì sao quan trọng: Kẹt đúng giờ cao điểm trả phòng (11:00–12:30) vì một yêu cầu không còn ý nghĩa; spec 5.5 / US-038 AC4 chỉ chặn bởi FOC/giảm giá.
- Đề xuất sửa: theo **S3-10**: blocker chỉ đếm `foc`, `special_discount`, `damage_pricing`; khi B9 thành công → hủy mọi `checkin_room_not_ready` mở của đơn (lý do `superseded`); khi B18/B13 → hủy `late_checkout_conflict` mở. Test: hai ca trên → B18 thành công, yêu cầu cũ `cancelled` có lý do.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – blocker B18 chỉ `foc`, `special_discount`, `damage_pricing` (`BLOCKING_APPROVALS`); B9/B9a hủy `checkin_room_not_ready`, B13/B18 hủy `late_checkout_conflict` với lý do `superseded` (`ApprovalService.cancelSuperseded`, báo người gửi); test `frontdesk-s3-fixes` DOM-20

### FB-R2-DOM-BE-21
- Mức độ: Major
- Vị trí: `folio/public/folio-view.ts` (DTO dòng chỉ có `description`); mô tả dòng do server ghi: `'room_night'`, `` `late_checkout ${time} ${pct}%` ``, `` `extra_guest x${n}` ``, `` `early_departure ${d}d` ``, `'retain_with_guest_consent'`, `` `room_change 203->401` `` (checkout/stay/party service); `bill.service.ts` không trả `creditVnd`; FE `CheckOutPage.tsx` dòng 248, 766 in thẳng `description` (mock FE dùng chữ Việt nên không thấy).
- Vấn đề: Bill đưa khách (US-037) và bảng tóm tắt ở quầy in **mã kỹ thuật tiếng Anh** ("room_night", "retain_with_guest_consent", "late_checkout 13:00 30%"), không có ngày đêm, không song ngữ; khi khách được hoàn (credit) bill không có dòng "Hoàn lại khách {x}" (spec 5.4).
- Vì sao quan trọng: Bill là giấy tờ khách mang về, gửi công ty thanh toán; in mã máy là không dùng được và làm khách nghi ngờ khoản tiền (nhất là "retain_with_guest_consent").
- Đề xuất sửa: server trả cho mỗi dòng `labelKey` + `labelParams` (ARC đặt tên) theo nội dung DOM chốt: `room` → "Tiền phòng đêm {dd/mm} – căn {room}" (`bill.night_line`); `early_checkin` → "Phụ thu nhận sớm {hh:mm} ({pct}%)"; `late_checkout` → "Phụ thu trả muộn {hh:mm} ({pct}%)"; `extra_person` → "Phụ thu thêm người · {n} người · đêm {dd/mm}"; `early_departure_fee` → "Phí trả phòng sớm – giữ {pct}% tiền {n} đêm không ở"; `deposit_forfeit` → "Khách để lại tiền thừa (không hoàn)"; `room_change_difference` → "Chênh lệch đổi phòng {old} → {new}"; `minibar` → "{tên món} × {sl}"; `cancellation_fee`/`no_show_fee` theo BR-309/311; bill thêm `creditVnd` để in "Hoàn lại khách". FE dịch theo `labelKey` (thẻ FE-03). `description` chỉ còn cho nhật ký.
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – mỗi dòng folio/bill có `labelKey` (`bill.line.*`) + `labelParams` (cột `folio_line.label_params`, 0042), bill có `creditVnd` ("Hoàn lại khách"); Desk `CheckOutPage` dịch theo `labelKey`, `description` chỉ còn dự phòng/nhật ký. Phần chữ FE theo dõi ở FB-R2-DOM-FE-03 (Minor)

### FB-R2-DOM-BE-22
- Mức độ: Major
- Vị trí: `registration/internal/registration.service.ts` dòng 1291 (`arrivalDate: stay.arrivalDate`); `registration/internal/rules.ts` `portalFields`/`portalClipboard` (dòng 573–625: ngày `YYYY-MM-DD`, quốc tịch mã); adapter INT `guest-registration/manual.ts` (ngày `dd/mm/yyyy`, "Nhãn: giá trị") – hai bản cài cho cùng một việc, lệch nhau.
- Vấn đề: (1) "Ngày đến" trên dữ liệu cổng = ngày đến **của đơn**: B9a đơn Trực tiếp (khách tới 04:40 ngày 20/10) ra **19/10** (ca 18); khách đến 01:30 ngày 21/10 cho đơn 20/10 ra **20/10** – trái BR-602 ("ngày lịch của giờ đến thực tế") và BR-417 (4). (2) Ngày dán vào cổng dạng `2026-10-20`, quốc tịch `KOR` – chưa chắc cổng nhận (S3-5). (3) Dữ liệu khách VN thiếu ô "lý do lưu trú"; khách NN thiếu SĐT (BR-606 liệt kê) – **PHÁP LÝ – cần xác nhận** (theo DOM hiểu, nội dung thông báo lưu trú gồm lý do và thời gian lưu trú – Thông tư 55/2021/TT-BCA Điều 15; chờ ESC-018 + luật sư ESC-001).
- Vì sao quan trọng: Khai sai ngày đến là sai dữ liệu nộp cơ quan công an; ca xe giường nằm tới 4–5 giờ sáng là ca phổ biến của OTTIMO. Dán sai định dạng làm lễ tân sửa tay từng ô, dễ trễ hạn 12 giờ với khách NN.
- Đề xuất sửa: (a) `arrivalDate` dữ liệu cổng = ngày lịch (giờ VN) của `actualCheckinAt` (chưa nhận phòng → ngày đến đơn); (b) **một** nơi dựng dữ liệu cổng (ARC chọn BE-C `rules.ts` hoặc adapter INT), định dạng ngày và cách ghi quốc tịch là tham số, mặc định `dd/MM/yyyy` và "Tên nước tiếng Việt (KOR)" (tên lấy từ CLDR – `Intl.DisplayNames('vi', {type: 'region'})` sau khi đổi alpha-3 → alpha-2); (c) thêm `stayReason` (mặc định "Du lịch", lễ tân đổi được) cho khối VN và SĐT cho khối NN – trường để trống được cho tới khi ESC-018 trả lời; (d) test: B9a 04:40 ngày 20/10 → "Ngày đến 20/10/2026".
- Trạng thái: Verified (DOM 18/10, HEAD `7ac11a4`) – (a) "Ngày đến" dữ liệu cổng = ngày lịch của `actual_checkin_at` (BE-A `actualArrivalDate`, BE-C); (b) một nơi dựng (`registration/internal/rules.ts`), định dạng là tham số, mặc định theo **ESC-018 INV đã quyết 17/10**: `dd/MM/yyyy`, quốc tịch mã 3 chữ in hoa (KOR); (d) test BE-C `frontdesk-s3-fixes`. Phần (c) (lý do lưu trú khách VN, SĐT khách NN) không chạm tiền, là câu hỏi pháp lý → **tách sang R3** cùng rà soát luật sư ESC-001; oracle BR-417-03 còn `pendingFix` cho ca đồng hồ hạn 23:00 (việc QA)

### FB-R2-DOM-BE-23
- Mức độ: Minor
- Vị trí: `stay.service.ts` B16 `earlyDeparture` (dòng 1089–1208).
- Vấn đề: (1) `droppedVnd` dùng `room_revenue_gross_vnd` – đêm bỏ đã được FOC/giảm giá đặc biệt (ví dụ đêm bù sự cố 100 %) vẫn bị tính phí giữ lại 50 %; (2) phụ thu người các đêm bỏ bị đảo (thành tiền thừa) nhưng không vào yêu cầu hoàn – khách chờ tới B18 mới được xử lý; (3) đơn OTA: không tính phí nhưng đêm bỏ bị hủy → doanh thu OTA vẫn trả cho OTTIMO biến mất khỏi báo cáo; (4) `noticeGivenAt` nhận bất kỳ thời điểm quá khứ, không cần bằng chứng – lùi giờ báo 1 ngày là biến "không hoàn" thành "hoàn 50 %" (BR-011: nhập bù phải kèm bằng chứng).
- Vì sao quan trọng: Sai tiền ở ca biên; (4) là đường thông đồng lễ tân – khách (quản lý duyệt hoàn thường không xem giờ báo).
- Đề xuất sửa: theo **S3-1, S3-2**: cơ sở = `room_revenue_vnd` (ròng); yêu cầu hoàn gồm phụ thu người đêm bỏ; OTA nhận `otaRetainedVnd` (0…tiền OTA các đêm bỏ, mặc định = toàn bộ) → `early_departure_fee`; `noticeGivenAt` sớm hơn lúc ghi > 30 phút hoặc khác ngày nghiệp vụ → bắt buộc `noticeEvidence` (ghi chú ≥ 3 ký tự + ảnh tùy chọn), hiện trong hộp duyệt hoàn. Test ca 11 và một đêm bỏ có FOC 100 % → phí 0 cho đêm đó.
- Trạng thái: Open

### FB-R2-DOM-BE-24
- Mức độ: Minor
- Vị trí: `checkout.service.ts` dòng 336–355 (`retain_with_guest_consent` → `deposit_forfeit`, mô tả `'retain_with_guest_consent'`).
- Vấn đề: Dòng ghi giống "mất cọc", không có bằng chứng khách đồng ý ngoài `reason`; spec 5.5 hướng dẫn "lần sau MGR giảm giá thủ công" – ghi doanh thu bây giờ, giảm giá lần sau không liên kết.
- Vì sao quan trọng: Báo cáo "phí hủy/mất cọc" bị lẫn tiền khách để lại; giảm giá thủ công "vì lần trước khách để lại" không truy vết được – đường thất thoát.
- Đề xuất sửa: theo **S3-4**: giữ quyền MGR+, bắt buộc `guestConsentEvidence` (chữ ký trên bill/ảnh tin nhắn – `attachmentId` hoặc ghi chú), nhãn bill "Khách để lại tiền thừa (không hoàn)", nhóm báo cáo riêng "Khách để lại" (DATA); không gắn với giảm giá lần sau. BA sửa spec (thẻ BA-02).
- Trạng thái: Open

### FB-R2-DOM-BE-25
- Mức độ: Minor
- Vị trí: `stay.service.ts` B13 `extend` (dòng 406–409 chỉ đổi `departure_date`).
- Vấn đề: Khách đã hẹn trả muộn 15:00 (dòng phụ thu 30 % ngày đi cũ) rồi xin ở thêm 2 đêm: `agreed_checkout_time` 15:00 và dòng phụ thu của ngày đi cũ **vẫn còn** – folio đòi tiền trả muộn của ngày khách ở lại qua đêm; khi thu tiền gia hạn ngay (BR-423) khách trả luôn khoản này; tới ngày đi mới, màn trả phòng lại mặc định giờ 15:00 (giờ hẹn cũ – `departureTime` lấy `agreed_checkout_time`) và đề xuất phụ thu.
- Vì sao quan trọng: Thu sai tiền giữa kỳ; G-10 chỉ tự sửa lúc trả phòng nếu lễ tân nhập đúng giờ.
- Đề xuất sửa: B13 (và đơn con OTA) → đảo dòng `late_checkout` sống của ngày đi cũ (lý do "superseded by extension"), xóa `agreed_checkout_time`, hủy yêu cầu `late_checkout_conflict` mở; việc dọn của ngày đi cũ đã đổi thành "dọn phòng khách đang ở" (đã có).
- Trạng thái: Open

### FB-R2-DOM-BE-26
- Mức độ: Minor
- Vị trí: `stay.service.ts` B14 `changeRoom` (dòng 735–1003).
- Vấn đề: (1) `effectiveDate` > hôm nay được chấp nhận nhưng trạng thái buồng đổi **ngay** (căn cũ `VD` khi khách còn ngủ đêm nay, căn mới `OC` khi chưa có ai), việc dọn căn cũ hạn hôm nay; (2) đơn OTA `guest_request`: chênh lệch = giá Trực tiếp căn mới − **giá OTA** căn cũ (khác cơ sở, BR-415) và dòng `room_change_difference` vào nhóm doanh thu "other" (`revenueGroupOf`) – ADR/RevPAR thiếu; (3) minibar căn cũ không được kiểm khi khách chuyển đi (tủ căn cũ sẽ bị tính cho khách sau hoặc bị bỏ qua).
- Vì sao quan trọng: Buồng phòng dọn căn còn khách; đối chiếu buồng – đơn (BR-806) báo sai; doanh thu phòng sai nhóm; mất tiền minibar.
- Đề xuất sửa: (1) R2 chỉ nhận `effectiveDate` = ngày nghiệp vụ hôm nay (đổi ngày mai → làm ngày mai) **hoặc** dời đổi trạng thái buồng/việc dọn tới đầu ngày hiệu lực; (2) theo **S3-15**: direct(new) − direct(old), `revenueGroup = room`, phân bổ vào `stay_night`; (3) B14 sinh việc HK "Kiểm minibar căn cũ" (dùng `recordMinibarCheck` chế độ trả phòng cho căn cũ) hoặc lễ tân nhập ngay trong hộp đổi phòng.
- Trạng thái: Open

### FB-R2-DOM-BE-27
- Mức độ: Minor
- Vị trí: `folio/internal/folio-lines.service.ts` (`addFolioLine` khoản `key_card_fee`, `smoking_fee`); `stay.service.ts` B14 (không cập nhật `cards_issued`).
- Vấn đề: (1) Số thẻ phạt không bị giới hạn bởi `cardsIssued` (BR-511: phí = (đã phát − đã trả) × 200.000 ≤ đã phát × 200.000); (2) G-19: cảnh báo "chưa ghi nhận đã gửi nội quy" khi `houseRulesSent` false/null chỉ ở FE, API không trả cờ; (3) đổi phòng cấp thẻ căn mới nhưng `cardsIssued` vẫn là số của căn cũ – phí thiếu thẻ lúc trả phòng tính sai.
- Vì sao quan trọng: 200.000/thẻ – khoản khách hay cãi; cần số liệu chắc để lễ tân nói với khách.
- Đề xuất sửa: `key_card_fee.quantity ≤ cardsIssued − đã phạt trước đó` (422 `VALUE_OUT_OF_RANGE`); `addFolioLine` phí phạt trả `warnings: [HOUSE_RULES_NOT_SENT]` khi chưa có `houseRulesSentAt`; B14 nhận `cardsReturnedOld` (0…đã phát) và `cardsIssuedNew` (0…2) → thiếu thẻ căn cũ ghi ngay hoặc cộng dồn.
- Trạng thái: Open

### FB-R2-DOM-BE-28
- Mức độ: Minor
- Vị trí: `frontdesk/internal/stay-support.ts` `sameDayArrival` (dòng 119–142: `r.status = 'confirmed'`).
- Vấn đề: Bỏ qua đơn `hold` đến cùng ngày. Sau 12:00 chỉ còn `hold` có cọc một phần (D-9 không tự hủy) – khách đã chuyển tiền giữ căn nhưng app cho ân hạn 12:30 và cho trả muộn không cần quản lý duyệt (BR-416).
- Vì sao quan trọng: Hai khách cùng căn lúc 14:00, đúng ca "ác mộng" lễ tân.
- Đề xuất sửa: theo **S3-14**: `status IN ('confirmed', 'hold')`. Test: `hold` cọc 500.000 đến 23/10 căn 202; khách 202 trả 12:20 ngày 23/10 → 210.000 (không ân hạn).
- Trạng thái: Open

### FB-R2-DOM-BE-29
- Mức độ: Minor
- Vị trí: `inventory/internal/minibar.service.ts` (dòng 231–259: chế độ `stayover` ghi folio như `checkout`, không sinh việc bổ sung, không trừ lần đã tính).
- Vấn đề: API đã nhận kiểm minibar giữa kỳ (US-033 dời R3, chưa có giao diện). Kiểm giữa kỳ tính 2 bia → không có việc bổ sung → lúc trả phòng tủ vẫn thiếu 2 bia → tính **lần nữa**.
- Vì sao quan trọng: Thu trùng minibar – khiếu nại chắc chắn; mở cửa từ API là ai đó (hoặc R3) sẽ dùng.
- Đề xuất sửa: R2 chặn `mode = stayover` (422 `NOT_IN_LIST`) tới khi làm US-033; khi làm: mỗi lần kiểm có tính tiền → việc `minibar_refill` ngay, lần kiểm sau so với **mức sau lần bổ sung gần nhất** (BR-702, BR-703).
- Trạng thái: Open

### FB-R2-DOM-BE-30
- Mức độ: Minor
- Vị trí: `checkin.service.ts` `addPriorNight` (không gọi tính lại bậc BR-107) và `evaluate` (dòng 178, 192–195: `balance_paid` xét trước khi ghi phụ thu nhận sớm).
- Vấn đề: (1) B9a thêm 1 đêm vào đơn Trực tiếp 6 đêm → thành 7 đêm nhưng không áp −10 % (D-8: thêm đêm tính lại bậc); (2) phụ thu nhận sớm được ghi **sau** điều kiện `balance_paid` → khách nhận phòng mà chưa trả phụ thu (spec 1.3: "tính trên tiền phòng + phụ thu người + phụ thu nhận sớm đã xác nhận"), tới lúc trả phòng mới thu.
- Vì sao quan trọng: Ca biên nhưng sai tiền; khách đi sớm/trả phòng nhanh (BR-427) dễ sót phụ thu.
- Đề xuất sửa: B9a gọi cùng hàm `retier` của B13 cho đơn Trực tiếp/CTV; điều kiện `balance_paid` cộng phụ thu nhận sớm (và đêm B9a) đang chuẩn bị ghi, thu ngay trong màn (G-7).
- Trạng thái: Open

### FB-R2-DOM-BE-31
- Mức độ: Suggestion
- Vị trí: `stay.service.ts` `options`/`defaultNight` (B13).
- Vấn đề: Đơn có giá thỏa thuận (sale chào giá riêng qua Zalo) gia hạn mặc định giá lịch – có thể cao hơn giá khách đang trả.
- Vì sao quan trọng: Khách hỏi "sao đêm thêm đắt hơn?" – lễ tân phải tự nhớ giá cũ.
- Đề xuất sửa: theo **S3-6**: `getExtensionOptions` trả thêm `currentBookingRateVnd` (giá ròng đêm cùng loại gần nhất, nguồn `manual`) để giao diện gợi ý "Giữ giá đơn {x}"; mặc định vẫn là giá lịch.
- Trạng thái: Open

### FB-R2-DOM-BA-02
- Mức độ: Minor
- Vị trí: `specs/EP03-05-stay.md` 0.1 (dòng 3 "sửa số người qua updateReservation"), 4.5 (B14 phụ thu người, `effectiveDate`), 4.6 (B16), 5.1/5.3 (G-16), 5.5 (`pending_approvals`, `retain_with_guest_consent` "lần sau giảm giá thủ công").
- Vấn đề: Spec đang dẫn tới các lỗi BE-16, BE-19, BE-20, BE-24 (phần lỗi do hướng dẫn của DOM ở G-16 – DOM nhận).
- Vì sao quan trọng: BE/QA/FE làm theo spec; sửa code mà không sửa spec thì Sprint 4 lặp lại.
- Đề xuất sửa: áp mục A: S3-9 (một thao tác "Trả phòng – tính thêm 1 đêm", cửa sổ sau nửa đêm), S3-10 (chỉ yêu cầu tiền chặn B18; yêu cầu vận hành tự hủy), S3-13 (phụ thu người theo đêm, `effectiveFrom` cho mọi thay đổi số người khi đang ở), S3-4 (retain chỉ khi khách từ bỏ; để lại cho lần sau → hoàn), S3-1/S3-2 (B16), S3-15 (chênh lệch OTA). Thêm ca QA vào E05-08: mục B ca 5, 7, 10, 12–15, 17, 18.
- Trạng thái: Open

### FB-R2-DOM-FE-03
- Mức độ: Minor
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx` dòng 248, 762–769; `pages/registration/RegistrationPage.tsx` dòng 429; `mocks/stay.ts` dòng 589 và các `description` tiếng Việt trong mock.
- Vấn đề: Bill và tóm tắt trả phòng in `description` thô từ API; mock tự viết mô tả tiếng Việt và tự trừ tiền OTA thu hộ → FE xanh trên mock nhưng sai trên API thật (BE-13, BE-21). Dữ liệu cổng hiện nguyên `2026-10-20`.
- Vì sao quan trọng: Lễ tân và khách đọc bill; mock lệch API che lỗi nghiệp vụ tới tận UAT.
- Đề xuất sửa: dịch dòng bill theo `labelKey`/`labelParams` (VI, và VI/EN khi `locale = vi_en`); in "Hoàn lại khách {x}" khi `creditVnd > 0`; mock trả **đúng** hình dạng API (mô tả kỹ thuật, không tự trừ OTA) để test bắt được lệch; dữ liệu cổng hiện theo định dạng server trả (BE-22).
- Trạng thái: Open

### FB-R2-DOM-INT-01
- Mức độ: Minor
- Vị trí: `product/integrations/doorlock/access.ts` `computeDoorValidity` (dòng 47–65), `assertCreateDoorCode` (dòng 111–114).
- Vấn đề: (1) Hết hiệu lực đúng 12:00 dù BR-412 cho ân hạn 12:30 khi không có khách đến – khách đang chuyển hành lý 12:15 bị khóa ngoài; (2) B9a (04:40) cần mã từ lúc nhận, mặc định lấy 14:00 ngày đến; (3) mã nhập tay 6 số trùng đúng ngày sinh `ddmmyy` hoặc dãy dễ đoán (000000, 123456) vẫn nhận – BR-403 "mã đúng ngày sinh không thêm số: không chấp nhận".
- Vì sao quan trọng: R3 bật mã cửa trong app (US-128); khóa ngoài khách là sự cố ban đêm điển hình.
- Đề xuất sửa: theo **S3-16**: `validTo` = giờ trả đã hẹn, không hẹn thì `late_grace_until` (lõi truyền vào; vẫn thu hồi khi B18); `validFrom` = min(giờ nhận chuẩn, lúc nhận phòng thực tế); thêm kiểm "mã yếu" (lặp, dãy tăng/giảm) và để lõi (có ngày sinh khách – C3) chặn mã trùng ngày sinh không thêm số.
- Trạng thái: Open

---

## D. Việc DOM tự làm ở bước Phản hồi & sửa (không cần thẻ)
1. **BR v0.3.4** (không đổi con số INV đã quyết): BR-107 (rút ngắn = đổi ngày trước nhận phòng; B16 không tính lại – S3-1), BR-110 (phụ thu theo đêm và theo căn đêm đó; năm sinh → tuổi nhỏ nhất – S3-7, S3-13), BR-412 (khách đến cùng ngày gồm `hold` – S3-14), BR-416/BR-426 (trả phòng sau mốc cuối = một thao tác – S3-9), BR-421 (giá đêm thêm – S3-6), BR-424 (chênh lệch OTA, phụ thu người khi đổi phòng – S3-13, S3-15), BR-428 (cơ sở ròng, phụ thu người hoàn 100 %, OTA nhập số OTA giữ – S3-2), BR-522 (số dư thừa chưa xử lý, chi chỉ khi khoản thu đã đối soát – BE-14), BR-527/BR-903 (hoa hồng = cả hai điều kiện – S3-3), BR-414 (không có "bỏ qua" phụ thu; `manual_time_tolerance_minutes` – S3-12), BR-606 (định dạng cổng theo tham số – S3-5); mục 13 thêm `manual_time_tolerance_minutes`, `portal_date_format`, `portal_nationality_format`.
2. **`br-examples.json`** (cùng QA): sửa BR-527-05 `expected.recorderCommission` → `projected` (+ ca B18 → `earned`); thêm ca mục B số 5, 7, 10, 12–15, 17, 18 và BR-428-04 (đêm bỏ có FOC).
3. Kiểm lại các thẻ Sprint 2 còn mở BE-11 (đã có `acceptShortfallReason` – sẽ Verified sau khi xem test), BE-12 (đã có yêu cầu hoàn khi dời ra ngoài – sẽ Verified).

### D.1 Đã làm mục 1–2 (17/10, theo yêu cầu ORC – không commit)
- **BR v0.3.4** (`product/docs/business-rules.md`): 35 chỗ sửa – các BR ở mục 1 ở trên + BR-307, BR-403, BR-426, BR-511, BR-703; mục 13 thêm `manual_time_tolerance_minutes` (30, NGÀNH), `portal_date_format` + `portal_nationality_format` (`dd/MM/yyyy`; "Hàn Quốc (KOR)" – GĐ, ESC-018); mục 18 thêm bảng v0.3.4. Không đổi con số INV đã quyết; mỗi dòng bảng BR vẫn đúng 5 cột.
- **Hướng dẫn G-16** thay bằng S3-9: BR-416 v0.3.4 (một thao tác "Trả phòng – tính thêm 1 đêm", cửa sổ sau nửa đêm) và dòng G-16 trong `reviews/s2-DOM.md` mục G gắn nhãn "Đã thay bằng S3-9". Spec EP03-05 5.1/5.3 là của BA – sửa theo thẻ FB-R2-DOM-BA-02.
- **`br-examples.json`** (source 0.3.4, 276 dòng): **sửa BR-527-05** – giữ đúng ý "xác nhận tiền mặt nộp quầy → hoa hồng đạt" nhưng đặt ở bối cảnh **đúng**: sale nộp tiền **sau khi** khách đã trả phòng và thu đủ (`expected.recorderCommission = earned`, thêm `recorderCommissionAtCheckout = projected`, `commissionVnd 156150`, `testNote` cho BE). Ca cũ (xác nhận 20/10 trước kỳ ở) chuyển thành **BR-527-06** với kết quả đúng `projected → earned lúc trả phòng`. **21 dòng mới**, tất cả `calc: null`; dòng nào code HEAD chưa đáp ứng có `pendingFix` = mã thẻ (quy ước mới trong `conventions.pendingFix`): BR-110-10…13 (BE-16), BR-307-02 (BE-13), BR-412-12, -13 (BE-17), BR-412-14 (BE-28), BR-414-02 (BE-18), BR-416-02, -03 (BE-19), BR-417-03, BR-602-05 (BE-22), BR-424-02 (BE-16), BR-424-03 (BE-26), BR-428-04 (BE-23), BR-428-05 (khớp code HEAD, không `pendingFix`), BR-522-02, -03 (BE-14), BR-527-06, BR-903-04 (BE-15).
- **Kiểm**: `node tools/validate-fixtures.mjs` (Node 22.23.3) → **OK – 0 lỗi** (276 dòng, 167 dòng tính lại, 117 BR có ví dụ được phủ); `prettier --check` file oracle xanh; `vitest` 4 tệp đọc oracle (frontdesk-rules, be-b-s2/s3-units, reservations-pricing) **132/132 xanh**. Chưa chạy được test tích hợp (máy không có PostgreSQL) – `payments-s3` "BR-527-05" chỉ đọc `input.amountVnd` (vẫn 1.600.000) và `expected.recorderCommission` (vẫn `earned`) nên không đổi kết quả.
- **Bổ sung 17/10 (PO – SEC-37, vẫn v0.3.4)**: BR-522 (b) thêm câu "Chuyển khoản: người duyệt, người đặt nơi nhận và người chi phải khác nhau; riêng chủ đầu tư (OWN) được vừa duyệt vừa chi. Quản lý không tự duyệt rồi tự chi." + ví dụ 1.200.000 (4 tình huống) + dòng lịch sử v0.3.4; oracle **BR-522-04** (`calc: null`, `pendingFix: FB-R2-SEC-BE-37`) → 277 dòng, validator 0 lỗi, unit test đọc oracle 136/136 xanh.

## E. Điểm làm tốt (giữ)
1. **Quy tắc thuần + trục ngày nghiệp vụ** (`stay-rules.ts`): bậc nhận sớm/trả muộn, ân hạn, khung miễn dài hạn, BR-417 – tách khỏi I/O, mọi số từ tham số; mọi ca đơn lẻ của BR-411/412/413/415/107/428/511/702 ở mục B khớp từng đồng (10/20 ca), kể cả làm tròn lợi khách ở BR-428 – các ca sai đều là ca **kết hợp** nhiều thao tác (đổi người + gia hạn, FOC + giờ thực tế, B16 + B18, OTA trả trước).
2. **Tách nhiệm tiền bằng CHECK ở DB** (BE-B 0040: người đối soát ≠ người ghi, người chi ≠ người tạo yêu cầu, không tự duyệt hoàn) và luồng hoàn 4 bước đúng BR-522 – đây là nền kiểm soát mà chủ đầu tư ở xa cần.
3. **G-10, G-12, G-13 làm đúng ý**: tự đảo khi giảm/bắt xác nhận khi tăng, bill bỏ cặp dòng đảo, VietQR nội dung = mã đơn/số bill, `dryRun` chỉ đọc – lễ tân xem trước số tiền trước khi ghi.

## E. Kiểm lại trước cổng QC Sprint 4 (18/10, HEAD `7ac11a4` – ĐK-S3-5 / M5)

- Cách làm: đối chiếu từng thẻ Blocker/Major với mã HEAD `7ac11a4`, test tích hợp đã có, BR v0.3.8 (gồm quy tắc FOC B12 và FOC chờ duyệt v0.3.5, phụ lục 5A BR-417) và kết quả kiểm lại tiền S4-38 lượt 1–5. DOM không chạy test (dựa vào CI và các lượt kiểm lại).
- Kết quả: **10/10 Verified** – Blocker FB-R2-DOM-BE-13, 14; Major FB-R2-DOM-BE-15…22. Mở lại 0. Dời R3 0 thẻ; riêng phần (c) của BE-22 (ô lý do lưu trú, SĐT – pháp lý, không chạm tiền) tách sang R3 cùng ESC-001.
- Các thẻ Minor/Suggestion (BE-23…31, BA-02, FE-03, INT-01) không thuộc điều kiện cổng; giữ Open để rà ở R3.
