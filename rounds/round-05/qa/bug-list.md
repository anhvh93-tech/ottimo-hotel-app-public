# Danh sách lỗi – Round 5

- Tác giả: QA | Mở: 06/11/2026 – Round 5 (bảo trì v1.0.5), bước Kiểm thử.
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8; mẫu ghi theo mục 9.
- Mã: `BUG-R5-xxx`. Lỗi tồn các round trước nằm ở tệp của round đó, không chép lại:
  - `rounds/round-04/qa/bug-list.md`, `rounds/round-04/qa/bug-list-v1.0.4.md`;
  - `rounds/round-03/qa/bug-list.md`, `rounds/round-02/qa/bug-list.md`, `rounds/round-01/qa/bug-list.md`.
- Dữ liệu: chỉ DS-E (tài khoản `qa.*`, khách giả). Không bí mật, không dữ liệu khách thật.
- Bản production đang chạy: v1.0.4 = `6414be25` (Release 06/11 14:10).

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed (chờ QA) | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 1 | 1 (BUG-R5-003) | 0 | 0 |
| P2 | 2 | 2 (BUG-R5-001, BUG-R5-002) | 0 | 0 |
| P3 | 0 | 0 | 0 | 0 |
| **Tổng** | **3** | **3** | **0** | **0** |

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R5-001 | P2 | Tham số `weekend_nights`: bộ kiểm khi lưu chỉ nhận số 1–7, còn giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]`. Lưu lại đúng giá trị đang có thì 422; lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần | BE (+ ARC chốt dạng, sửa erd) | Mới |
| BUG-R5-002 | P2 | Tiền cọc về cho giữ chỗ đã tự hủy (`hold_expired`): Desk không ghi được khoản thu, không tạo được yêu cầu hoàn, không có mục "Cần chú ý" `deposit_after_cancel` (US-085 AC4). Tiền nằm ngoài Desk | BE (+ FE nút, ARC chốt khôi phục hay đơn mới, SEC xem quyền) | Mới |
| BUG-R5-003 | P1 | Tham số `min_stay`: bộ kiểm khi lưu cho qua `2` hay `{"nights":2}`, bộ tính giá lại cần danh sách luật. Lưu một giá trị như vậy thì mọi báo giá và đơn trực tiếp mới bị 500 tới hết ngày nghiệp vụ, không sửa lại được trong ngày | BE (+ ARC ghi `setParameter`) | Mới |

## 3. Chi tiết

### BUG-R5-001 – `weekend_nights`: bộ kiểm khi lưu và bộ tính giá dùng hai dạng khác nhau

- **Mức:** P2. Trạng thái: **Mới**.
  - Hiện chưa sai tiền. `weekend_uplift_pct` = 0 từ ngày chuyển S (INV quyết ESC-045 câu 1 = A, decision-log 01/11; BR mục 13 v0.5.1). Tham số này chỉ dùng cho mức tăng cuối tuần (`calendarRate`). Luật ở tối thiểu 2 đêm dùng `min_stay.arrivalWeekdays`, không đọc `weekend_nights`.
  - Vì vậy hiện tại lỗi là: OWN/MGR không lưu lại được tham số. Cách vòng: không sửa tham số này.
  - **Nâng P0** nếu có hai điều cùng lúc: `weekend_uplift_pct` > 0, và `weekend_nights` đã bị lưu dạng số. Khi đó đêm Thứ Sáu, Thứ Bảy không được cộng mức tăng: báo giá, đơn và giá ước tính web đều thấp hơn quy định, không có cảnh báo. Câu lỗi của Desk ở bước 2 dẫn người dùng tới đúng dạng số đó.
- **Vai chịu trách nhiệm:** BE (`parameter-rules.ts`). ARC chốt một dạng và sửa `erd.md` 9.1a nếu cần. DOM/BA đối chiếu từ điển tham số.
- **Môi trường:**
  - mã `main` @ `3717c257`, giống `6414be25` (production v1.0.4) ở các dòng nêu dưới;
  - có từ R2 Sprint 1 (`c312b797`, 16/10), nên có trong mọi bản v1.0.0–v1.0.4.
  - QA chạy cục bộ bằng `tsx` trên mã repo, không stack, không DB. Không ghi tham số trên staging hay production.
- **Liên quan:**
  - BR-103;
  - `erd.md` dòng 1281 (`weekend_nights`: int[] ISO weekday) và 1429 (tập con {1…7});
  - `product/docs/tham-so-quy-tac.json` mục `weekend_nights` (dạng "FRI = thứ Sáu…", ví dụ và khuyến nghị `["FRI","SAT"]`);
  - operationId `setParameter`; Desk `ParamDialog.tsx`;
  - nguồn phát hiện: UXD R5 `rounds/round-05/outputs/UXD/report.md` mục 4 R5; ORC đã kiểm mã.
- **Chỗ lệch trong mã:**
  - Bộ kiểm khi lưu, `product/services/api/src/modules/platform/internal/parameter-rules.ts` 180–187: `case 'weekend_nights'` đòi mảng số nguyên 1–7, không rỗng, không trùng. Sai thì `outOfRange({ allowed: [1, 2, 3, 4, 5, 6, 7] })` → 422 `PARAM_OUT_OF_RANGE`.
  - Giá trị đang chạy:
    - `product/services/api/src/admin/production-defaults.ts` dòng 200: `value: ['FRI', 'SAT']`, giá trị đầu của production;
    - `product/tests/fixtures/seed/ds-e.json` dòng 282: `["FRI", "SAT"]`.
  - Bộ tính giá:
    - `reservations/public/pricing.service.ts` 165 và `sales/internal/quote-pricing.ts` 305 đọc `g<Weekday[]>('weekend_nights')`;
    - `reservations/public/pricing.ts` 91 so `rules.weekendNights.includes(weekdayOf(date))`, với `weekdayOf` trả `'MON'…'SUN'`.
  - Test hiện có giữ cả hai dạng, nên không ca nào bắt được chỗ lệch:
    - `test/be-b-units.test.ts` 192–198 khẳng định bộ kiểm nhận `[5, 6]`;
    - `test/reservations-pricing.test.ts` 108 và `test/lp-v2-be-units.test.ts` 58 tính giá bằng giá trị seed dạng chữ.
  - Desk `ParamDialog.tsx` 75–89: tham số dạng mảng mở ô JSON, điền sẵn `JSON.stringify(param.value)` = `["FRI","SAT"]`. `app/problem.ts` 39 đưa `allowed` vào câu `error.PARAM_OUT_OF_RANGE`: "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: {allowed}."
- **Tiền điều kiện / dữ liệu:** DS-E (`weekend_nights` = `["FRI","SAT"]`). Tài khoản `qa.owner` hoặc `qa.mgr`; `edit_roles` của tham số = `{owner,manager}` (migration `0002`).
- **Các bước tái hiện** (stack local DS-E; QA chưa chạy trên stack, xem "Bằng chứng"):
  1. `qa.owner` mở Desk, màn Tham số, chọn `weekend_nights`, bấm Sửa. Ô JSON điền sẵn `["FRI","SAT"]`. Giữ nguyên giá trị, Hiệu lực từ = hôm nay, bấm Lưu.
  2. Kết quả: `setParameter` trả 422 `PARAM_OUT_OF_RANGE`, `allowed` = 1…7. Desk hiện "Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: 1, 2, 3, 4, 5, 6, 7."
  3. Theo câu đó, nhập `[5,6]` (Thứ Sáu, Thứ Bảy theo ISO) rồi Lưu: 200, giá trị mới có hiệu lực.
  4. Chỉ làm trên stack local: đặt `weekend_uplift_pct` = 15. Báo giá một căn cho đêm Thứ Sáu 13/11/2026 (kênh Trực tiếp). Kết quả: giá đêm Thứ Sáu bằng giá ngày thường, không cộng 15 %.
- **Kết quả thực tế:** không lưu lại được giá trị đang chạy. Dạng mà bộ kiểm nhận (số) thì bộ tính giá không hiểu, và không có cảnh báo.
- **Kết quả mong đợi:**
  - Một dạng duy nhất cho `weekend_nights` ở mọi chỗ: bộ kiểm khi lưu, giá trị đầu của production, seed, bộ tính giá, `erd.md` 9.1a, từ điển tham số. Đề xuất dạng chữ `MON…SUN`, vì giá trị trên production, seed, bộ tính giá và từ điển đều đang dùng dạng này. ARC chốt.
  - Lưu lại đúng giá trị đang có (`["FRI","SAT"]`) thì được nhận.
  - Giá trị không phải tập con không rỗng, không trùng của `MON…SUN` thì 422, `allowed` liệt kê đúng 7 mã chữ.
  - Nếu ARC chọn dạng số: bộ tính giá phải đọc được dạng số, và cần một migration đổi giá trị đang lưu. Không được để hai dạng cùng tồn tại.
- **Ca hồi quy đề xuất** (BE viết, QA duyệt):
  - (a) unit `checkStructuredParameter('weekend_nights', ['FRI','SAT'])` → nhận; `[]`, `['FRI','FRI']`, `['FRX']` → 422;
  - (b) bỏ hoặc sửa ca `[5, 6]` ở `be-b-units.test.ts` 194 theo dạng ARC chốt;
  - (c) integration: `setParameter` lưu lại giá trị seed → 200, rồi `calculateQuote` cho đêm Thứ Sáu với `weekend_uplift_pct` = 15 trên DB thử → có mức tăng;
  - (d) nếu giữ dạng số: dạng số → bộ tính giá vẫn cộng mức tăng.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lệch trong mã", cùng ở `3717c257` và `6414be25`.
  - Chạy cục bộ 06/11 (QA): một script `tsx` trong scratchpad, ngoài repo, gọi thẳng hai hàm của repo `checkStructuredParameter` và `calendarRate`, dữ liệu giả, không DB. Kết quả:
    - `["FRI","SAT"]` → `rejected 422 PARAM_OUT_OF_RANGE`;
    - `[5,6]` → `accepted`;
    - mức tăng 15 % với `["FRI","SAT"]`: 13/11 (FRI) và 14/11 (SAT) = `weekend`, 16/11 (MON) = `none`;
    - mức tăng 15 % với `[5,6]`: cả ba đêm = `none`.
  - Bước 1–3 trên Desk suy ra từ mã `ParamDialog.tsx` và `problem.ts`. QA chưa chạy trên stack có Desk.
- **Việc cho ORC (chỉ đọc, không chặn):** kiểm giá trị đang hiệu lực trên production còn dạng chữ. Cách đơn giản: INV hoặc MGR mở màn Tham số trên Desk, xem `weekend_nights` (chỉ xem, không bấm Lưu). Nếu ra dạng số thì báo QA: lỗi chuyển sang tình huống nâng P0 ở trên khi `weekend_uplift_pct` > 0.
- **Ghi chú 06/11 (khi ghi BUG-R5-003):** giá trị lưu với Hiệu lực từ = hôm nay thì **không sửa lại và không hủy được trong ngày**. Ghi đè trả 422, Hủy lịch trả 409; QA đã chạy cục bộ, xem BUG-R5-003. Nếu lỡ lưu dạng số, sớm nhất phải sang ngày nghiệp vụ sau mới sửa được.
- **Ghi chú test lại:** chưa có.

### BUG-R5-002 – Tiền cọc về cho giữ chỗ đã tự hủy: Desk không ghi được khoản thu, không tạo được yêu cầu hoàn

- **Mức:** P2. Trạng thái: **Mới**.
  - Lỗi về tiền nên mặc định P0 (test-strategy mục 8). QA hạ xuống P2 vì cả ba điều sau đều đúng:
    - không sai số tiền: không ai bị tính thừa hay thiếu;
    - tiền không mất: tiền nằm trong tài khoản OTTIMO và có dòng trên sao kê;
    - có cách vòng DOM đã chốt (dưới đây); ca hiếm ở cơ sở 10 căn.
  - Hậu quả thật, theo DOM `rules-v1.0.5.md` 11.3:
    - tiền thật của khách nằm ngoài Desk, được hoàn ngoài Desk, không qua duyệt BR-522;
    - đối soát BR-527 có dòng sao kê không khớp đơn nào;
    - nếu đặt lại, giờ tiền về trên đơn mới bị ghi sai.
  - **Nâng P1** khi có một trong hai điều sau:
    - sổ giao ca ghi từ 2 ca "tiền về sau tự hủy" trong một tuần;
    - Desk có báo tiền về tự động, khi đó tiền vào đơn đã hủy sẽ thường hơn.
- **Vai chịu trách nhiệm:**
  - BE: đường ghi tiền, và khôi phục đơn hoặc yêu cầu hoàn;
  - FE: nút trên Desk;
  - ARC chốt: khôi phục đơn hay tạo đơn mới liên kết, mã lỗi khi căn đã bán, migration (DOM 11.4 mục 3);
  - SEC xem ai được khôi phục; PO xếp bản (DOM đề xuất v1.0.6, v1.0.5 nếu kịp).
- **Môi trường:**
  - mã `main` @ `e9e826e2`. Phần mã sản phẩm (`product/services/api/src`, `product/apps/admin-web/src`) không đổi so với `6414be25` (production v1.0.4): `git diff` rỗng.
  - QA chạy cục bộ 06/11:
    - một tệp integration tạm, đã xóa, không commit;
    - PostgreSQL 17 dùng một lần trong Docker trên máy, tài khoản thử của CI;
    - đồng hồ giả, dữ liệu giả của fixture `s438-r8`;
    - không gọi staging hay production.
  - Workspace thiếu gói `nodemailer`, nên lần chạy dùng một stub chỉ cho gói này. Các đường thử ở đây không gửi email.
- **Liên quan:**
  - US-085 AC4: `product/docs/specs/EP02-reservations.md` dòng 436, "tiền về sau khi đã hủy → 'Cần chú ý' `deposit_after_cancel` cho FD/SAL";
  - BR-303, BR-308, BR-522 (ghi chú 18/10: đơn hủy không nhận dòng tay), BR-527;
  - operationId `confirmDeposit`, `createDepositNotice`, `recordPayment`, `createRefundRequest`;
  - nguồn: DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 11 (11.3); SEC `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3a lượt 3; ORC giao 06/11.
- **Chỗ trong mã:**
  - `product/services/api/src/modules/payments/internal/deposits.service.ts`:
    - 138–139 (`confirm`) và 425–426 (`notice`): đơn khác `hold` → 409 `INVALID_TRANSITION`;
    - 157–165: Giờ nhận tiền phải ≥ lúc tạo giữ chỗ (`holdCreatedAt`) → đơn mới không nhận giờ tiền về thật.
  - J1 `reservations.service.ts` `expireOne` 4670–4782: tiền đã ghi = 0 → `cancelled`, `cancel_reason_code = 'hold_expired'`. Folio vẫn `open`, không có dòng nào.
  - `allowed-actions.ts`: đơn `cancelled` không có hành động nào. Riêng `no_show` có B12 khôi phục; chưa có chuyển `cancelled → hold`.
  - Desk chỉ gọi `recordPayment` ở hai chỗ:
    - `PaymentPanel.tsx`, chỉ dùng ở màn trả phòng;
    - `DebtCollectDialog.tsx`, chỉ thu nợ sau trả phòng.
    - Đơn đã hủy không có nút ghi thu.
  - "Cần chú ý" `deposit_after_cancel`:
    - đã khai báo ở `events.service.ts` 110 và 159, ở hợp đồng, và ở chữ Desk `today.money_after_cancel` ("Tiền về cho đơn đã hủy {code}");
    - **không có chỗ nào trong mã tạo mục này**.
  - `folio-lines.service.ts` 213–216: đơn `cancelled`/`no_show` không nhận dòng tay (đúng BR-522 ghi chú 18/10).
- **Tiền điều kiện / dữ liệu:** stack local, DS-E hoặc fixture.
  - Đồng hồ giả bắt đầu 01/11/2026 10:00.
  - Giữ chỗ Trực tiếp: căn 101 do `qa.fd` tạo, căn 102 do `qa.sale` tạo; đến 04/11, đi 06/11; giữ 24 giờ (hạn 02/11 10:00).
  - Tiền cọc phải có = 400.000 đ (số thử của fixture).
- **Các bước tái hiện:**
  1. **Ca 1, tiền về trước hạn.** Khách chuyển lúc 02/11 09:50, chưa ai bấm. Lúc 10:00:30 (quá hạn, J1 chưa chạy), Desk của lễ tân chỉ có **Hủy giữ chỗ** (`allowedActions` = `["cancel"]`).
  2. 10:01 J1 chạy: cả hai giữ chỗ thành `cancelled/hold_expired` (`expired: 2`).
  3. Lễ tân, rồi quản lý, gọi **Xác nhận đã nhận cọc** cho căn 101, Giờ nhận tiền 09:50: cả hai 409 `INVALID_TRANSITION`. Trên Desk, đơn đã hủy không có nút nào với FD, FDL, MGR, OWN.
  4. **Ca 2, khách chuyển theo mã QR cũ sau khi đơn đã hủy.** 20:00, sale báo "khách đã chuyển" cho căn 102 (`createDepositNotice`): 409 `INVALID_TRANSITION`.
  5. Xem "Cần chú ý" của FD và MGR: không có mục nào. Không có yêu cầu hoàn nào được tạo.
  6. Đặt lại theo cách vòng: 20:05 tạo giữ chỗ mới căn 101, xác nhận cọc với Giờ nhận tiền 09:50 (giờ tiền về thật): 422 `DATE_INVALID` ở `payment.receivedAt`.
- **Kết quả thực tế:** tiền khách đã chuyển không ghi được vào đơn nào trên Desk, và không có yêu cầu hoàn. Desk cũng không báo cho ai là tiền đã về.
- **Phát hiện thêm khi chạy (API, không có nút Desk):**
  - Gọi thẳng API `recordPayment` lên folio của đơn đã hủy:
    - sale → 422 `AMOUNT_EXCEEDS_BALANCE`;
    - lễ tân không ghi chú → 422 `REASON_REQUIRED`;
    - lễ tân có ghi chú → **201**: phiếu thu `succeeded`, folio vẫn `open`.
  - Sau đó gọi `createRefundRequest` → **201**, yêu cầu hoàn `pending`.
  - Vậy máy chủ đã có đường ghi tiền và đề nghị hoàn, chỉ thiếu nút trên Desk. Đường này cũng chưa có các luật DOM 11.4 đòi:
    - ảnh chứng từ bắt buộc;
    - tự tạo yêu cầu hoàn 100 %;
    - mục "Cần chú ý";
    - chỉ áp cho lý do `hold_expired`.
  - ARC/BE cân nhắc dùng lại đường này thay vì làm đường mới. SEC xem: hiện lễ tân ghi được tiền lên đơn đã hủy qua API mà không cần ảnh.
- **Kết quả mong đợi** (DOM 11.4, US-085 AC4):
  - FD+ ghi được khoản thu trên đơn `cancelled` lý do `hold_expired`:
    - ảnh chứng từ bắt buộc;
    - khoản thu ở trạng thái chờ đối soát (BR-527);
    - Giờ nhận tiền trong khoảng từ lúc tạo giữ chỗ cũ tới bây giờ.
  - Ghi xong thì một trong hai:
    - (i) căn còn trống, chưa qua ngày đến: khôi phục đơn về giữ chỗ (DOM nghiêng về cách này), rồi xác nhận cọc như thường;
    - (ii) không đặt lại: hệ thống tự tạo yêu cầu hoàn 100 %, không phí (BR-308). MGR/OWN duyệt; người tạo yêu cầu không tự duyệt (BR-522).
  - Căn đã bán thì trả mã lỗi rõ (ARC chốt), không 500.
  - Tiền về sau khi hủy → mục "Cần chú ý" `deposit_after_cancel` cho FD+ (EP01 dòng 109), tự đóng khi đã khôi phục hoặc đã hoàn.
- **Cách làm tạm (DOM 11.2, đã chốt):**
  - Trước mỗi lần tự bấm hủy, và khi thấy một giữ chỗ đã tự hủy: lễ tân kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư) rồi mới báo khách.
  - Tiền đã về, căn còn trống:
    - tạo giữ chỗ mới cùng căn, cùng ngày, cùng giá;
    - Xác nhận đã nhận cọc với Giờ nhận tiền = **bây giờ** (Desk không nhận giờ sớm hơn lúc tạo giữ chỗ mới, bước 6);
    - Ghi chú: giờ tiền về thật và mã đơn cũ;
    - sổ giao ca: mã đơn cũ → mã đơn mới.
  - Tiền đã về, căn đã bán:
    - chủ đầu tư hoàn đủ theo sao kê, chuyển khoản ngoài Desk;
    - lễ tân ghi sổ giao ca "OTM-… tiền về sau tự hủy – chờ chủ đầu tư hoàn", không hứa ngày.
  - Phòng ngừa: trước khi rời quầy, giữ chỗ chưa cọc hết hạn trước giờ mở quầy hôm sau mà khách còn muốn thì gia hạn 1 lần tới 10:00 sáng hôm sau.
- **Ghi chú cho DOM, PO (cách vòng chưa đúng với Desk):**
  - DOM 11.2 gạch 3 viết: giữ chỗ quá hạn mà J1 chưa tự hủy (job đứng) thì lễ tân "Xác nhận đã nhận cọc được" khi tiền về trước hạn.
  - Trên Desk v1.0.4 việc này **không làm được** với giữ chỗ chưa nhận đồng nào (bước 1):
    - máy chủ không đưa nút: `allowed-actions.ts` 73, quá hạn chỉ cho B4 khi đã nhận > 0 đ;
    - Desk cũng ẩn nút: `ReservationDrawer.tsx` 243, `canConfirmDeposit`.
  - Trong khi đó API vẫn nhận nếu Giờ nhận tiền trước hạn (`overdueHoldAccepts`, test `v104-holds.test.ts` "money dated before the deadline confirms").
  - Thường J1 chạy mỗi nhịp nên khoảng hở chỉ khoảng một phút. Khoảng hở chỉ dài khi worker đứng.
  - Đề xuất: DOM bỏ câu này khỏi 11.2, và BA không đưa vào sổ tay 2.4 hay Tờ 2a. Nếu DOM giữ câu, FE/BE mở nút cho FD+ trong cùng việc 11.4. QA không mở mã lỗi riêng.
- **Ca hồi quy đề xuất** (BE/FE viết, QA duyệt; chi tiết theo cách ARC chốt):
  - (a) giữ chỗ chưa cọc, J1 tự hủy; lễ tân ghi khoản thu kèm ảnh, Giờ nhận tiền trước hạn cũ → 201, chờ đối soát. Thiếu ảnh → 422. Sale hoặc CTV → 403/404. Đơn hủy vì lý do khác `hold_expired` → 409;
  - (b) nhánh (i) căn còn trống: khôi phục về `hold`, xác nhận cọc, đơn `confirmed`. Mã đơn giữ nguyên; giờ tiền về đúng; không sinh yêu cầu hoàn; tồn phòng không trùng (chạy song song với một giữ chỗ khác trên cùng căn);
  - (c) nhánh (i) căn đã bán: mã lỗi ARC chốt, không 500, tiền vẫn ghi và chuyển sang (ii);
  - (d) nhánh (ii): yêu cầu hoàn 100 % tự tạo, `pending`; người tạo không tự duyệt được; MGR/OWN duyệt;
  - (e) "Cần chú ý" `deposit_after_cancel` xuất hiện cho FD+ khi có khoản thu trên đơn tự hủy, tự đóng sau (b) hoặc khi chi xong (d);
  - (f) `createDepositNotice` trên đơn tự hủy: theo luật ARC chốt (vẫn 409, hoặc tạo mục cho lễ tân);
  - (g) hồi quy: giữ chỗ còn hạn, xác nhận cọc như cũ; `v104-holds.test.ts` vẫn xanh.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ trong mã".
  - Chạy cục bộ 06/11 (QA): bước 1–6 và phần "Phát hiện thêm", kết quả đúng như ghi ở trên (mã HTTP và `Problem.code`). Log nằm ở scratchpad của QA, ngoài repo.
  - Không có dữ liệu khách thật, không số tài khoản.
- **Ghi chú test lại:** chưa có.

### BUG-R5-003 – `min_stay`: bộ kiểm khi lưu cho qua dạng số, bộ tính giá ném lỗi, mọi báo giá bị 500

- **Mức:** P1. Trạng thái: **Mới**.
  - Hiện chưa xảy ra. ORC kiểm chỉ đọc 06/11: production có `min_stay` = danh sách 2 luật (`arrivalWeekdays ["FRI","SAT"]`, `arrivalOnSpecialDates`, 2 đêm, mọi kênh) từ 28/10, đúng dạng.
  - Chỉ cần MGR hoặc OWN lưu một giá trị mà bộ kiểm cho qua, ví dụ `2`, là thành **sự cố P0**:
    - mọi báo giá (`calculateQuote`, lưu báo giá) trả 500, nên cũng không tạo được giữ chỗ từ báo giá;
    - mọi đơn trực tiếp mới qua `createReservation` (kênh không phải OTA, không phải nội bộ) trả 500;
    - theo mã, giá ước tính trên web khách (`public-rate.ts` 212) cũng gọi cùng hàm. QA chưa chạy đường này.
  - Sự cố kéo dài **tới hết ngày nghiệp vụ**: lưu lại giá trị đúng cho hôm nay → 422, hủy dòng hôm nay → 409. Không có cách vòng trên Desk; chỉ còn sửa thẳng DB production, việc này phải có quy trình và chủ đầu tư duyệt.
  - Không xếp P0 vì phải có người lưu sai mới xảy ra, và hiện có cách tránh (dưới đây). Không xếp thấp hơn P1 vì khi xảy ra thì luồng chính dừng cả ngày.
- **Vai chịu trách nhiệm:** BE (`parameter-rules.ts`, hai bộ tính giá); cùng PR V5-25 với BUG-R5-001. ARC ghi một dòng ở `setParameter`. Nguồn: thẻ BE `FB-R5-BE-ARC-C0313-06` (Major).
- **Môi trường:**
  - như BUG-R5-002: `main` @ `e9e826e2`, mã sản phẩm giống `6414be25`;
  - chạy integration cục bộ, PostgreSQL dùng một lần, đồng hồ giả 06/11/2026 12:00.
  - Có từ R2: bộ kiểm có từ `c312b797` (16/10); bộ tính giá `for (const r of rules)` có từ `cf6c5575` (16/10). Giá ước tính web thêm từ `477552ca` (01/11).
- **Liên quan:**
  - BR-113;
  - `product/docs/tham-so-quy-tac.json` mục `min_stay` (danh sách luật);
  - operationId `setParameter`, `cancelScheduledParameter`, `calculateQuote`, `createReservation`;
  - nguồn: `rounds/round-05/reviews/BE-on-contract-0.3.13.md` thẻ 06.
- **Chỗ lệch trong mã:**
  - Bộ kiểm khi lưu, `product/services/api/src/modules/platform/internal/parameter-rules.ts` 243–254 (`case 'min_stay'`):
    - số nguyên thì đòi 1–7;
    - còn lại chỉ kiểm `value.nights` nếu có.
    - Hệ quả: `2`, `{"nights":2}` và mọi mảng đều lọt qua. Mảng không có `.nights`, nên `[{"nights":0}]` cũng lọt.
  - `config_parameter_def` của `min_stay`: `value_schema = 'json'`, không có `bounds` (migration `0002`). Vì vậy chỉ còn bộ kiểm trên. `edit_roles = {owner,manager}`.
  - Bộ tính giá `reservations/public/pricing.ts` 303–317 (`minStayNights`) chạy `for (const r of rules)`. Giá trị là số hay đối tượng thì ném `TypeError: rules is not iterable` → `ProblemFilter` trả 500 `INTERNAL_ERROR`. Hàm này được gọi ở:
    - `sales/internal/quote-pricing.ts` 201–202 (`?? []` chỉ đỡ được `null`);
    - `reservations.service.ts` 688 (`create`);
    - `public-rate.ts` 212.
  - `platform/public/parameter.service.ts` 267–296 (`set`): `ON CONFLICT … DO UPDATE … WHERE effective_from > today` → dòng đã có hiệu lực hôm nay không ghi đè được (422 "value already effective").
  - `platform/internal/parameters.service.ts` 301–303 (`cancelScheduled`): dòng `effective_from ≤ today` → 409 `INVALID_TRANSITION`.
  - Desk `ParamDialog.tsx`: `min_stay` mở ô JSON, điền sẵn danh sách; Hiệu lực từ mặc định = hôm nay. Người dùng có thể thay cả ô bằng `2`.
  - Không có test nào kiểm `checkStructuredParameter('min_stay', …)`.
- **Tiền điều kiện / dữ liệu:** stack local, DS-E hoặc fixture; `min_stay` = danh sách 2 luật như production. Tài khoản `qa.mgr` hoặc `qa.owner`. **Chỉ làm trên local**, không làm trên staging hay production.
- **Các bước tái hiện:**
  1. Mốc trước khi lưu:
     - báo giá Trực tiếp căn 202, đến Thứ Sáu 13/11, 1 đêm → 422 `MIN_STAY_NOT_MET` (đúng luật);
     - đến Thứ Ba 10/11, 2 đêm → 200;
     - `POST /reservations` trực tiếp 10–12/11 qua được bước tối thiểu đêm (dừng ở 422 `DEPOSIT_INSUFFICIENT` vì số cọc thử).
  2. Giá trị lọt qua bộ kiểm (lưu cho ngày tương lai, không ảnh hưởng hôm nay):
     - `{"nights":2}` → 200;
     - `[{"nights":0}]` → 200;
     - `9` → 422 `PARAM_OUT_OF_RANGE`.
  3. `qa.mgr` mở Desk, màn Tham số, `min_stay`, bấm Sửa. Thay ô JSON bằng `2`, Hiệu lực từ = hôm nay (mặc định), Lưu → 200.
  4. Báo giá Thứ Ba 10/11, 2 đêm (lễ tân, rồi sale) → **500** `INTERNAL_ERROR`. Log máy chủ: `TypeError: rules is not iterable`. `POST /reservations` trực tiếp → **500**.
  5. Sửa trong ngày:
     - lưu lại danh sách đúng cho hôm nay → 422 `VALIDATION_FAILED` ở `effectiveFrom`;
     - Hủy lịch dòng hôm nay → 409 `INVALID_TRANSITION`.
  6. Lưu danh sách đúng cho ngày mai → 200. Báo giá lúc 23:00 cùng ngày nghiệp vụ → vẫn 500. Sang ngày nghiệp vụ sau, 07:00 → 200.
- **Kết quả thực tế:** bộ kiểm cho lưu giá trị làm sập báo giá và đơn mới. Sửa lại cũng không được trong ngày.
- **Kết quả mong đợi** (thẻ BE 06, đề xuất 1–4):
  - `min_stay` chỉ nhận `MinStayRule[]`, mỗi phần tử:
    - `nights` nguyên 1–7;
    - `arrivalWeekdays` là `Weekday[]` không trùng (`MON…SUN`, cùng dạng BUG-R5-001);
    - `arrivalOnSpecialDates` boolean;
    - `channels` thuộc danh mục nhóm kênh;
    - có ít nhất một trong `arrivalWeekdays`, `arrivalOnSpecialDates` (luật không áp vào ngày nào thì báo lỗi; QA đề xuất, ARC chốt).
  - Dạng số, đối tượng, phần tử hỏng → 422 `PARAM_OUT_OF_RANGE`, giá trị đang hiệu lực không đổi.
  - Hai bộ tính giá và giá ước tính web đọc phòng thủ: giá trị không phải mảng thì coi như không có luật, ghi log cảnh báo một lần, không 500.
  - Mảng rỗng `[]`: DOM/ARC chốt nghĩa là "không có tối thiểu đêm" hay bị chặn.
- **Cách làm tạm (tới khi V5-25 lên):**
  - Không ai lưu ô `min_stay`.
  - Nếu buộc phải đổi trước khi V5-25 lên: báo ORC. Lưu với Hiệu lực từ **từ ngày mai trở đi**, không phải hôm nay, để còn Hủy lịch được nếu sai. Giá trị phải giữ dạng danh sách như hiện tại, chỉ đổi số `nights` hoặc thứ trong `arrivalWeekdays`.
  - Lỡ lưu sai cho hôm nay: báo ORC ngay. Lưu danh sách đúng cho ngày mai để sự cố dừng ở mốc đổi ngày nghiệp vụ. Muốn sửa sớm hơn phải sửa thẳng DB production, việc này cần chủ đầu tư duyệt.
- **Ca hồi quy đề xuất** (BE viết, QA duyệt):
  - (a) unit `checkStructuredParameter('min_stay', …)`:
    - `2`, `{"nights":2}`, `[{"nights":0,"channels":"all","arrivalWeekdays":["FRI"]}]`, `[{"nights":2,"channels":"all","arrivalWeekdays":["FRX"]}]`, `[{"nights":2,"channels":"all","arrivalWeekdays":["FRI","FRI"]}]`, kênh ngoài danh mục → 422;
    - giá trị production hiện tại → nhận.
  - (b) unit `minStayNights` với giá trị không phải mảng (số, đối tượng) → trả 0, không ném lỗi.
  - (c) integration `setParameter` `min_stay` = `2` → 422, giá trị đang hiệu lực không đổi. Báo giá Thứ Sáu 1 đêm vẫn 422 `MIN_STAY_NOT_MET`, Thứ Ba 2 đêm 200.
  - (d) integration: chèn thẳng giá trị hỏng vào DB thử (bỏ qua bộ kiểm). Kết quả mong đợi: `calculateQuote` 200, `createReservation` không 500, giá ước tính web không 500.
  - (e) integration: danh sách hợp lệ đổi `nights` 2 → 3 → báo giá Thứ Sáu 2 đêm → 422 `MIN_STAY_NOT_MET`, `minStayNights` = 3.
  - (f) rà các khóa dạng bậc khác (thẻ BE 06, đề xuất 5): `los_discount`, `cancel_policy_direct`, `special_dates`… Mỗi khóa có một ca "lưu dạng sai → 422". Khóa chưa kịp thì ghi backlog.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lệch trong mã".
  - Chạy cục bộ 06/11 (QA): bước 1–6 cho kết quả đúng như ghi ở trên. Log `ProblemFilter` có `TypeError: rules is not iterable` ở bước 4 và bước 6 (23:00).
  - Đường giá ước tính web và tạo giữ chỗ từ báo giá suy ra từ mã. QA chưa chạy hai đường này.
- **Ghi chú test lại:** chưa có.
