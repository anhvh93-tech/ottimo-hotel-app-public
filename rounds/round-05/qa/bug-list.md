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
| P1 | 2 | 2 (BUG-R5-003, BUG-R5-004) | 0 | 0 |
| P2 | 3 | 3 (BUG-R5-001, BUG-R5-002, BUG-R5-006) | 0 | 0 |
| P3 | 1 | 0 | 1 (BUG-R5-005) | 0 |
| **Tổng** | **6** | **5** | **1** | **0** |

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R5-001 | P2 | Tham số `weekend_nights`: bộ kiểm khi lưu chỉ nhận số 1–7, còn giá trị đang chạy và bộ tính giá dùng `["FRI","SAT"]`. Lưu lại đúng giá trị đang có thì 422; lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần | BE (+ ARC chốt dạng, sửa erd) | Mới |
| BUG-R5-002 | P2 | Tiền cọc về cho giữ chỗ đã tự hủy (`hold_expired`): Desk không ghi được khoản thu, không tạo được yêu cầu hoàn, không có mục "Cần chú ý" `deposit_after_cancel` (US-085 AC4). Tiền nằm ngoài Desk | BE (+ FE nút, ARC chốt khôi phục hay đơn mới, SEC xem quyền) | Mới |
| BUG-R5-003 | P1 | Tham số `min_stay`: bộ kiểm khi lưu cho qua `2` hay `{"nights":2}`, bộ tính giá lại cần danh sách luật. Lưu một giá trị như vậy thì mọi báo giá và đơn trực tiếp mới bị 500 tới hết ngày nghiệp vụ, không sửa lại được trong ngày | BE (+ ARC ghi `setParameter`) | Mới |
| BUG-R5-004 | P1 | Tham số `damage_catalog` (bảng giá hư hỏng, BR-512): bộ kiểm khi lưu nhận mọi giá trị JSON. Lưu một bảng có phần tử `null` thì mở folio, in bill, danh mục phí và ghi dòng dịch vụ đều 500, với mọi đơn, tới hết ngày nghiệp vụ, không sửa lại được trong ngày | BE (V5-25, BE-C, PR xếp chồng trên PR #96) | Mới |
| BUG-R5-005 | P3 | Web khách, tab Yêu cầu: khách gõ một chuỗi giống số thẻ vào lời nhắn. Máy chủ chặn đúng (422, mã cấp trên `CARD_NUMBER_DETECTED`), nhưng trang hiện câu "Hệ thống đang gặp sự cố…" thay cho câu "Vui lòng không ghi số thẻ thanh toán." | FE (FE-B, đã sửa ở PR #107) | Đã sửa, chờ xác nhận trên staging v1.0.5 |
| BUG-R5-006 | P2 | `executeRefund` (chi hoàn chuyển khoản): luật số thẻ V-09 thử Luhn trên mọi cửa sổ 13–19 chữ số, nên chặn nhầm (422 `CARD_NUMBER_DETECTED`) mã chuyển khoản có phần số dài từ 13 chữ số. Ô này bắt buộc, nên MGR/OWN không ghi được lệnh chi. Mã toàn số 16 chữ số bị chặn khoảng 65 % | BE (BE-B; SEC đã chọn luật, UXD + FE-A câu báo) | Mở, giao BE (v1.0.5) |

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
  - **Giữ P2 sau review SEC** (06/11 khuya, `rounds/round-05/reviews/SEC-on-bug-r5-002.md`, thẻ FB-R5-SEC-QA-B002-06). SEC xếp **phần bảo mật** mức Trung bình (mục 0): không hotfix, không ESC. Phần chặn ở máy chủ thành việc riêng, **V5-48, bắt buộc ở v1.0.5**. Mức P2 ở đây là của phần nghiệp vụ (tiền nằm ngoài Desk).
- **Vai chịu trách nhiệm** (plan R5: V5-48, V5-5B):
  - **V5-48** (bắt buộc v1.0.5, không migration): luật máy chủ cho khoản thu trên đơn đã đóng. Làm BE-B, ARC chốt mã lỗi. FE-A sửa câu ở hộp Xác nhận cọc; UXD viết chữ theo brand guideline OTTIMO;
  - **V5-5B-1** (nên có, theo đường cắt quyết định 20):
    - BE: tự tạo yêu cầu hoàn và `deposit_after_cancel`;
    - FE-A: nút và hộp ghi trên Desk;
    - UXD: chữ hộp ghi;
    - ARC: bổ sung hợp đồng.
  - **V5-5B-2** (đích v1.0.6): khôi phục đơn. ARC chốt máy trạng thái, migration và tồn phòng khi chạy song song. SEC đã chốt ai được khôi phục (mục 4: FD+, chỉ khi đủ điều kiện DOM).
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
  - operationId `confirmDeposit`, `createDepositNotice`, `recordPayment`, `createRefundRequest`, `confirmPaymentReceived`, `createVietQr`;
  - nguồn: DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 11 (11.3); SEC `rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md` mục 3a lượt 3; ORC giao 06/11;
  - luật đích: DOM `rules-v1.0.5.md` 11.2–11.4, bản chốt `e9e0e2e4`; SEC `rounds/round-05/reviews/SEC-on-bug-r5-002.md` mục 1.2, 3.1, 3.2, 4; `rounds/round-05/plan.md` V5-48, V5-5B, quyết định 20, 22.
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
  - Hai đường VietQR, theo SEC mục 1.2, trong `payments.service.ts`:
    - J1 (`expireOne`) không đụng bảng `payment`. QR `pending` của giữ chỗ còn chờ tới 06:00 hôm sau (1065–1073);
    - `confirmReceived`: chặn sale của FB-R4-SEC-BE-HOLDS-01 (`assertHoldOpenForSales`, 238–247) chỉ xét đơn đang `hold`. Đơn đã đóng không bị chặn theo trạng thái;
    - `createVietQr`: chỉ chặn theo trạng thái với mục đích `check_in`, `check_out`. Có `overBalanceReason` của FD+ là tạo được QR cho đơn đã đóng.
    - Desk: hộp **Xác nhận cọc** gọi `confirmPaymentReceived` trước rồi mới tới `confirmDeposit` (`ReservationDialogs.tsx` 608–655). Mở hộp trước khi J1 chạy, bấm sau khi J1 hủy thì tiền vẫn được ghi, dù không có nút nào cho đơn đã hủy.
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
  - Vậy máy chủ đã có đường ghi tiền và đề nghị hoàn, chỉ thiếu nút trên Desk. Đường này còn thiếu các luật DOM 11.4 mục 2–5 đòi:
    - chỉ nhận chuyển khoản, VietQR. Theo mã, hiện đường này nhận cả tiền mặt, POS; QA chỉ chạy chuyển khoản;
    - ảnh chứng từ bắt buộc;
    - tự tạo yêu cầu hoàn 100 %;
    - mục "Cần chú ý".
  - DOM đã quyết dùng lại `recordPayment`, không làm đường riêng (11.4).
- **Hai đường nữa, SEC tìm khi đọc mã** (SEC mục 1.2). QA chạy lại cục bộ 06/11 khuya, cùng cách như lần trên, và cả hai đều đúng như SEC đọc:
  - Dựng ca: tài khoản nhận thử có hiệu lực 02/11. Hai giữ chỗ hạn 02/11 10:00, một do sale tạo, một do lễ tân tạo. 02/11 08:00 mỗi người tạo một QR cọc → 201, 201.
  - 10:01 J1 hủy cả hai. Hai QR vẫn `pending`, hết hạn 03/11 06:00.
  - **`confirmPaymentReceived`** lúc 10:30, Giờ nhận tiền 09:50:
    - **sale với đơn đã tự hủy của mình → 200**: khoản thu `succeeded`, `reconciliation = pending`, không ảnh;
    - lễ tân → 200, cũng không ảnh;
    - CTV → 403.
  - **`createVietQr`** trên đơn đã hủy:
    - lễ tân không lý do → 422 `AMOUNT_EXCEEDS_BALANCE`;
    - **lễ tân có `overBalanceReason` → 201**: QR mới `pending` cho đơn đã hủy. Khách trả theo QR này thì có tiền về cho đơn đã hủy, đúng ca của lỗi này;
    - sale không lý do → 422; sale có lý do → 403.
  - "Cần chú ý" của lễ tân vẫn trống sau các bước trên.
- **Kết quả mong đợi** (sửa 06/11 khuya theo DOM 11.4 bản chốt `e9e0e2e4` và SEC mục 3.1, 4; bản trước chỉ nói lý do `hold_expired`):
  - **V5-48, máy chủ, bắt buộc v1.0.5.** Áp trên đơn đã đóng (`cancelled` mọi lý do, `no_show`), mọi vai kể cả OWN, đọc trạng thái dưới khóa đơn:
    - `recordPayment`: chỉ `bank_transfer`, `vietqr`; tiền mặt, `card_pos`, `ota_collect` → 422. Thiếu ảnh `deposit_receipt` của đúng đơn → 422;
    - khoản thu ghi được luôn `pending`. Nhật ký `payment.recorded` có `reservationStatus` và `afterClosure: true`;
    - sale, CTV vẫn bị chặn;
    - `confirmPaymentReceived` với QR còn chờ của đơn đã đóng → 409, mọi vai;
    - `createVietQr` trên đơn đã đóng → 409, mọi mục đích, kể cả có `overBalanceReason`;
    - lỗi thì không ghi gì: không dòng `payment`, không nhật ký, version folio không đổi, ảnh không bị gắn;
    - hộp Xác nhận cọc gặp 409 này thì hiện câu "đơn đã hủy", không hiện lỗi chung.
  - **V5-5B-1, ghi tiền và hoàn** (DOM 11.4 mục 1–5):
    - FD+ ghi khoản thu như trên cho **mọi đơn đã đóng, mọi lý do hủy**;
    - cùng giao dịch tự tạo yêu cầu hoàn 100 % số vừa ghi, không phí (BR-308), đứng tên người ghi. Người ghi không duyệt, không chi; MGR/OWN duyệt; chỉ chi sau khi khoản thu đã đối soát (BR-522);
    - một khoản tiền chỉ ghi một lần. Desk báo rõ: khách muốn đặt lại thì không ghi ở đơn cũ;
    - Desk có nút cho FD+ trên khung đơn `cancelled`, `no_show`; không có nút cho sale, CTV;
    - "Cần chú ý" `deposit_after_cancel` (US-085 AC4, EP01 dòng 109): sinh khi sale, CTV báo "khách đã chuyển" trên đơn đã đóng, **thay cho 409**. Người thấy: FD, FDL, MGR, OWN. Mục tự đóng khi đơn có khoản thu ghi sau lúc báo, hoặc khi FD+ bấm "Không thấy tiền" kèm ghi chú;
    - tiêu chí SEC S2–S8 (SEC mục 3.2).
  - **V5-5B-2, khôi phục** (DOM 11.4 mục 6–10, SEC mục 4):
    - lựa chọn "Khôi phục giữ chỗ và xác nhận cọc" khi đủ ba điều: đơn bị hủy lúc còn là giữ chỗ (J1, hoặc người bấm B5); căn cũ còn trống đủ các đêm; chưa qua ngày đến;
    - kết quả: cùng mã đơn, cùng căn, cùng giá; đủ cọc → `confirmed`; thiếu cọc → giữ chỗ có cọc một phần đã quá hạn (BR-303);
    - căn đã bán hoặc đã qua ngày đến → lỗi rõ (ARC chốt mã), không 500, không ghi nửa chừng;
    - chỉ FD+, chỉ cùng lúc với một khoản thu theo V5-48. Thiếu điều kiện thì không ai khôi phục, kể cả OWN.
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
  - **Đã xử lý (06/11 khuya):** DOM bỏ câu và quyết không mở nút (11.2, `e9e0e2e4`). Tờ 2a dòng "Hết hạn, chưa cọc" đã sửa (`128643f6`, theo plan V5-5B).
- **Ca hồi quy đề xuất** (BE/FE viết, QA duyệt; chi tiết theo cách ARC chốt):
  - (a) giữ chỗ chưa cọc, J1 tự hủy; lễ tân ghi chuyển khoản kèm ảnh, Giờ nhận tiền trước hạn cũ → 201, chờ đối soát, có yêu cầu hoàn 100 % `pending`. Thiếu ảnh → 422. Sale bị chặn, CTV → 403. Đơn hủy vì lý do khác `hold_expired` → **nhận** như trên. Sửa 06/11 khuya theo DOM 11.4 mục 1; bản trước ghi 409;
  - (a') giữ chỗ do lễ tân bấm hủy, lý do **Không liên lạc được**. Khách chuyển theo QR cũ; lễ tân ghi chuyển khoản kèm ảnh → 201, chờ đối soát, có yêu cầu hoàn 400.000 đ `pending` (số thử của fixture);
  - (a'') đơn đã đóng: tiền mặt → 422; POS → 422; chuyển khoản không ảnh → 422; sale bị chặn như hiện nay;
  - (b) nhánh (i) căn còn trống: khôi phục về `hold`, xác nhận cọc, đơn `confirmed`. Mã đơn giữ nguyên; giờ tiền về đúng; không sinh yêu cầu hoàn; tồn phòng không trùng (chạy song song với một giữ chỗ khác trên cùng căn);
  - (c) nhánh (i) căn đã bán: mã lỗi ARC chốt, không 500, tiền vẫn ghi và chuyển sang (ii);
  - (b') 5B-2 với giữ chỗ do người bấm hủy (B5), căn còn trống → khôi phục được như giữ chỗ tự hủy. Đơn `confirmed` rồi hủy → không có lựa chọn khôi phục;
  - (d) nhánh (ii): yêu cầu hoàn 100 % tự tạo, `pending`; người tạo không tự duyệt được; MGR/OWN duyệt;
  - (d') người ghi không tự duyệt yêu cầu hoàn; MGR duyệt được; chi trước khi đối soát → bị chặn (BR-522);
  - (e) "Cần chú ý" `deposit_after_cancel` có cho FD+ khi sale, CTV báo đã chuyển trên đơn đã đóng; tự đóng khi đơn có khoản thu ghi sau lúc báo (sau (a) hoặc (b));
  - (e') sale báo "khách đã chuyển" trên đơn tự hủy → có mục `deposit_after_cancel` cho FD+. Lễ tân ghi khoản thu → mục đóng. Ca khác: FD bấm "Không thấy tiền" → mục đóng, audit có ghi chú;
  - (f) `createDepositNotice` trên đơn đã đóng: không còn 409, mà tạo mục như (e'). ARC chốt mã trả về cho sale. Tin báo không sinh khoản thu; ảnh khách gửi kèm không dùng làm ảnh chứng từ (SEC S7);
  - (g) hồi quy: giữ chỗ còn hạn, xác nhận cọc như cũ; `v104-holds.test.ts` vẫn xanh.
- **Ca cho V5-48** (thẻ SEC FB-R5-SEC-QA-B002-06; là tiêu chí nghiệm thu V5-48 trong plan; BE viết, QA duyệt):
  - Áp trên ba loại đơn: `cancelled` lý do `hold_expired`, `cancelled` một lý do khác, và `no_show`.
  - (h1) FD, FDL, MGR, OWN gọi `recordPayment`:
    - tiền mặt, `card_pos`, `ota_collect` → 422;
    - chuyển khoản không ảnh → 422;
    - lỗi thì không có dòng `payment`, không nhật ký, version folio không đổi, ảnh không bị gắn.
  - (h2) FD+ ghi chuyển khoản hoặc VietQR có ảnh → 201, `pending`. OWN ghi cũng `pending`. Nhật ký có `afterClosure: true`.
  - (h3) sale với đơn đã tự hủy của mình:
    - `recordPayment` vẫn bị chặn;
    - `confirmPaymentReceived` với QR còn chờ → 409 (v1.0.4 trả 200, QA đã chạy);
    - CTV → 403.
  - (h4) `confirmPaymentReceived` của FD+ với QR còn chờ của đơn đã tự hủy → 409 (v1.0.4 trả 200). Hộp Xác nhận cọc hiện câu "đơn đã hủy", không hiện lỗi chung.
  - (h5) `createVietQr`, kể cả có `overBalanceReason`, trên đơn đã đóng → 409 (v1.0.4 trả 201).
  - (h6) hồi quy, không đổi:
    - thu ở bước nhận phòng, trả phòng, thu nợ sau trả phòng;
    - B4 trên giữ chỗ còn hạn và giữ chỗ quá hạn có tiền (`v104-holds.test.ts`);
    - `reversePayment` trên đơn đã đóng;
    - `createRefundRequest` và chi hoàn cho số dư có sẵn của đơn đã hủy.
  - Khi 5B-1, 5B-2 lên: thêm ca cho SEC S2–S8 và SEC mục 4.2. Gồm: người ghi không duyệt, không chi; chi tiền mặt bị chặn; cảnh báo "Có thể trùng"; khôi phục khi còn yêu cầu hoàn chưa đóng → lỗi.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ trong mã".
  - Chạy cục bộ 06/11 (QA): bước 1–6 và phần "Phát hiện thêm", kết quả đúng như ghi ở trên (mã HTTP và `Problem.code`). Log nằm ở scratchpad của QA, ngoài repo.
  - Chạy cục bộ lần 2, 06/11 khuya (QA): phần "Hai đường nữa". Cùng cách chạy: tệp test tạm đã xóa, PostgreSQL dùng một lần đã xóa. Tài khoản nhận là số thử có sẵn trong test repo (`minibar-m1.test.ts`).
  - Không có dữ liệu khách thật, không số tài khoản thật.
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
- **Vai chịu trách nhiệm:**
  - BE: `parameter-rules.ts`, hai bộ tính giá và giá ước tính web. V5-25 (P1) là việc đầu của làn BE-C, bắt đầu 07/11 (plan R5 quyết định 19). Cùng PR với BUG-R5-001.
  - ARC ghi một dòng ở `setParameter`.
  - UXD viết câu lỗi khi 422 không có `allowed` (DOM 12.7).
  - Nguồn: thẻ BE `FB-R5-BE-ARC-C0313-06` (Major).
- **Môi trường:**
  - như BUG-R5-002: `main` @ `e9e826e2`, mã sản phẩm giống `6414be25`;
  - chạy integration cục bộ, PostgreSQL dùng một lần, đồng hồ giả 06/11/2026 12:00.
  - Có từ R2: bộ kiểm có từ `c312b797` (16/10); bộ tính giá `for (const r of rules)` có từ `cf6c5575` (16/10). Giá ước tính web thêm từ `477552ca` (01/11).
- **Liên quan:**
  - BR-113;
  - `product/docs/tham-so-quy-tac.json` mục `min_stay` (danh sách luật);
  - operationId `setParameter`, `cancelScheduledParameter`, `calculateQuote`, `createReservation`;
  - nguồn: `rounds/round-05/reviews/BE-on-contract-0.3.13.md` thẻ 06;
  - luật đích: DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 12 (bản `e9e0e2e4`, BR 0.5.13);
  - oracle: `product/tests/fixtures/br-examples.json` **BR-113-06 … BR-113-30** (v0.5.13, `pendingFix: BUG-R5-003`, `calc: null`).
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
- **Kết quả mong đợi** (thẻ BE 06 đề xuất 1–4; **DOM chốt ở `rules-v1.0.5.md` 12.1–12.3**, sửa 06/11 khuya):
  - `min_stay` chỉ nhận mảng JSON, 0–20 luật. Mỗi luật chỉ có các khóa sau:
    - `nights`: nguyên, 1 ≤ `nights` ≤ min(7, `short_stay_max_nights`), bắt buộc;
    - `channels`: bắt buộc; `"all"` hoặc mảng không rỗng, không trùng thuộc `direct`, `agent`, `ota`. Không nhận `internal`, không nhận chuỗi lẻ như `"direct"`;
    - `arrivalWeekdays`: mã thứ `MON…SUN`, không trùng; không nhận số (cùng dạng BUG-R5-001);
    - `arrivalOnSpecialDates`: boolean.
  - Mỗi luật phải áp vào ít nhất một ngày. Khóa lạ → 422.
  - Chiều ngược: lưu `short_stay_max_nights` nhỏ hơn `nights` lớn nhất đang có → 422.
  - Sai dạng → 422 `PARAM_OUT_OF_RANGE`, giá trị đang hiệu lực không đổi.
  - `[]` được lưu, nghĩa là không có tối thiểu đêm (DOM 12.2). QA bỏ câu hỏi mở của bản trước.
  - Đọc phòng thủ ở ba chỗ (báo giá, tạo đơn, giá ước tính web): không bao giờ 500 vì `min_stay`.
    - Giá trị không phải mảng → coi như không có luật;
    - luật hỏng → bỏ luật đó, các luật đúng vẫn áp;
    - ghi log cảnh báo một lần cho mỗi giá trị.
- **Cách làm tạm (tới khi V5-25 lên):**
  - Không ai lưu ô `min_stay`.
  - Nếu buộc phải đổi trước khi V5-25 lên: báo ORC. Lưu với Hiệu lực từ **từ ngày mai trở đi**, không phải hôm nay, để còn Hủy lịch được nếu sai. Giá trị phải giữ dạng danh sách như hiện tại, chỉ đổi số `nights` hoặc thứ trong `arrivalWeekdays`.
  - Lỡ lưu sai cho hôm nay: báo ORC ngay. Lưu danh sách đúng cho ngày mai để sự cố dừng ở mốc đổi ngày nghiệp vụ. Muốn sửa sớm hơn phải sửa thẳng DB production, việc này cần chủ đầu tư duyệt.
- **Ca hồi quy đề xuất** (BE viết, QA duyệt). **Oracle chính là BR-113-06 … BR-113-30** (DOM 12.6): BE đọc theo id, và bỏ `pendingFix` khi đóng lỗi này.
  - Bảng ánh xạ ca QA → oracle:

    | Ca QA | Oracle |
    |---|---|
    | (a) lưu sai dạng → 422; giá trị production → nhận | 06–09, 11–28 |
    | (b) đọc phòng thủ, không ném lỗi | 29, 30 |
    | (c) lưu `2` → 422, báo giá không đổi | 07 |
    | (d) giá trị hỏng nằm sẵn trong DB → báo giá 200 | 29, 30 |
    | (e) đổi `nights` → báo giá dùng tối thiểu mới | không có dòng riêng; 13, 14 chỉ là biên khi lưu |
    | `[]` → không có tối thiểu đêm | 10 |

  - (a) unit `checkStructuredParameter('min_stay', …)`:
    - `2`, `{"nights":2}`, `[{"nights":0,"channels":"all","arrivalWeekdays":["FRI"]}]`, `[{"nights":2,"channels":"all","arrivalWeekdays":["FRX"]}]`, `[{"nights":2,"channels":"all","arrivalWeekdays":["FRI","FRI"]}]`, kênh ngoài danh mục → 422;
    - thêm theo DOM 12.6: luật thiếu `channels` → 422; `channels` có `internal` → 422;
    - giá trị production hiện tại → nhận.
  - (b) unit `minStayNights` với giá trị không phải mảng (số, đối tượng) → trả 0, không ném lỗi.
  - (c) integration `setParameter` `min_stay` = `2` → 422, giá trị đang hiệu lực không đổi. Báo giá Thứ Sáu 1 đêm vẫn 422 `MIN_STAY_NOT_MET`, Thứ Ba 2 đêm 200.
  - (d) integration: chèn thẳng giá trị hỏng vào DB thử, bỏ qua bộ kiểm.
    - Kết quả mong đợi: `calculateQuote` 200, `createReservation` không 500, giá ước tính web không 500.
    - Luật hỏng nằm cạnh luật đúng thì luật đúng vẫn áp (BR-113-30).
  - (e) integration: danh sách hợp lệ đổi `nights` 2 → 3 → báo giá Thứ Sáu 2 đêm → 422 `MIN_STAY_NOT_MET`, `minStayNights` = 3.
  - (f) rà các khóa dạng bậc khác (thẻ BE 06, đề xuất 5): `los_discount`, `cancel_policy_direct`, `special_dates`… Mỗi khóa có một ca "lưu dạng sai → 422". Khóa chưa kịp thì ghi backlog.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lệch trong mã".
  - Chạy cục bộ 06/11 (QA): bước 1–6 cho kết quả đúng như ghi ở trên. Log `ProblemFilter` có `TypeError: rules is not iterable` ở bước 4 và bước 6 (23:00).
  - Đường giá ước tính web và tạo giữ chỗ từ báo giá suy ra từ mã. QA chưa chạy hai đường này.
- **Ghi chú test lại:** chưa có.

### BUG-R5-004 – `damage_catalog`: bộ kiểm khi lưu nhận mọi giá trị, một phần tử `null` làm folio, bill và danh mục phí trả 500

- **Mức:** P1. Trạng thái: **Mới**.
  - Theo những gì đội biết, lỗi chưa xảy ra:
    - giá trị đầu của production là bảng 3 món đúng dạng (`production-defaults.ts` 550–559);
    - release notes v1.0.4 dặn không bấm Lưu ở ô này;
    - nếu giá trị đang hiệu lực có phần tử `null` thì folio trên Desk đã báo lỗi từ lúc đó.
    - **Chưa ai kiểm chỉ đọc riêng khóa này trên production**, nhất là các dòng đã hẹn cho ngày sau (xem "Việc cho ORC").
  - MGR hoặc OWN lưu một bảng có phần tử `null` cho hôm nay (Hiệu lực từ mặc định là hôm nay) là thành **sự cố P0** ở luồng tiền tại quầy, với mọi đơn và mọi vai:
    - mở folio (`getFolio`), in bill (`getBill`), danh mục phí (`getChargeCatalog`) → 500;
    - ghi dòng dịch vụ (`addFolioLine`) → 500. Theo mã, `adjustFolioLine` cũng 500. Cả giao dịch rollback, không ghi gì;
    - theo mã Desk (QA chưa chạy trên Desk), các màn đọc `getFolio` hoặc `getBill` đều không mở được: nhận phòng, trả phòng, thu nợ sau trả phòng, hộp folio, ghi dịch vụ, bill ở khung đơn, hộp hủy đơn có dòng dịch vụ. Lúc khách trả phòng, lễ tân không thấy số còn phải thu và không in được bill.
  - Sự cố kéo **tới hết ngày nghiệp vụ**: lưu lại bảng đúng cho hôm nay → 422, hủy dòng hôm nay → 409, như BUG-R5-003.
    - Không có cách vòng trên Desk. Chỉ còn sửa thẳng DB production, việc này phải có quy trình và chủ đầu tư duyệt.
    - Không ai lưu bảng đúng cho ngày mai thì sự cố kéo sang cả ngày sau.
  - Không sai tiền, không mất dữ liệu: mọi lần ghi lỗi đều rollback. QA đếm `folio_line` trước và sau: không đổi.
  - Lý do xếp P1, cùng loại và cùng lý do với BUG-R5-003:
    - không P0 vì phải có OWN hoặc MGR lưu sai mới xảy ra, và có cách tránh (không lưu ô này);
    - không thấp hơn P1 vì khi xảy ra thì trả phòng, thu tiền, in bill dừng cả ngày mà không có cách vòng.
    - Gõ phải `null` ít gặp hơn gõ `2` ở `min_stay`. QA không hạ mức vì khả năng xảy ra thấp khi hậu quả là dừng luồng chính.
- **Vai chịu trách nhiệm:**
  - BE: V5-25 (ORC kéo vào 06/11). BE-C làm PR xếp chồng trên PR #96, không migration, không đổi hợp đồng.
  - Luật: DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` 13.2 (dòng `damage_catalog`: bỏ dòng hỏng), 13.4 (biên khi lưu), ca T-13-5 (bản `6b5b8f34`); từ điển `product/docs/tham-so-quy-tac.json` mục `damage_catalog`, dòng Giới hạn.
  - UXD, FE-A: câu báo 422 trên Desk, trong V5-21 như BUG-R5-003.
  - Nguồn phát hiện: PO đọc mã (commit `86bb0680`; plan R5 dòng V5-25 mục `damage_catalog` và R5-B-05). ORC xác nhận ở `bill.service.ts`.
- **Môi trường:**
  - mã `main` @ `6b5b8f34`. Bốn tệp nêu ở "Chỗ lỗi trong mã" không đổi so với `6414be25` (production v1.0.4): `git diff` rỗng.
  - Có từ R2 Sprint 3, nên có trong mọi bản v1.0.0–v1.0.4:
    - `folio-lines.service.ts` `catalog` đọc bảng từ `bad6f599` (16/10);
    - `bill.service.ts` `catalogNames` và `getFolio` gọi nhãn từ `2923bf43` (17/10).
  - QA chạy integration cục bộ 06/11, cùng cách BUG-R5-002 và BUG-R5-003:
    - tệp test tạm đặt ngoài `test/` để không lẫn vào lần chạy của vai khác; đã xóa, không commit;
    - PostgreSQL 17 dùng một lần trong Docker, tài khoản thử của CI; đã xóa;
    - đồng hồ giả bắt đầu 15/10/2026 09:00 (T0 của test repo); dữ liệu giả: tenant fixture, bảng phí BR-512 của DS-E;
    - stub cho gói `nodemailer` còn thiếu trong workspace; đường thử không gửi email;
    - không gọi staging hay production.
- **Liên quan:**
  - BR-512; US-032 (danh mục phí);
  - operationId `setParameter`, `cancelScheduledParameter`, `getFolio`, `getBill`, `getChargeCatalog`, `addFolioLine`, `adjustFolioLine`;
  - cùng loại: BUG-R5-003;
  - lời dặn tạm: `product/docs/release-notes.md` dòng 193 (v1.0.4, "Giới hạn đã biết");
  - `rounds/round-05/plan.md` V5-25 (mục `damage_catalog`), R5-B-05.
- **Chỗ lỗi trong mã:**
  - Bộ kiểm khi lưu không có luật cho khóa này:
    - `platform/internal/parameter-rules.ts` `checkStructuredParameter`: không có `case 'damage_catalog'`, nên rơi vào `default` (chỉ kiểm thứ tự giờ);
    - `config_parameter_def`: `value_schema = 'json'`, `bounds` NULL (migration `0040`); `edit_roles = {owner,manager}`;
    - `platform/public/parameter.service.ts` 74–75: `checkValueSchema('json')` chỉ chặn `undefined`.
    - Vậy mọi giá trị JSON đều lưu được.
  - Hai chỗ đọc, cùng kiểu `for (const d of table) { … d.code … }`, không kiểm `d` có phải đối tượng không:
    - `folio/internal/bill.service.ts` 262–277 `catalogNames` (nhãn món hư hỏng trên folio và bill). Gọi từ `bill()` dòng 181 và `labelContext()` dòng 257. `labelContext` được `folio.controller.ts` `folioBody` (dòng 216) gọi cho `getFolio` (134), `addFolioLine` (272), `adjustFolioLine` (309);
    - `folio/internal/folio-lines.service.ts` 159–174 `catalog` (danh mục phí). Gọi từ `getChargeCatalog` và từ `add()` dòng 220, trước khi ghi dòng.
  - Phần tử `null` → `TypeError: Cannot read properties of null (reading 'code')` → `ProblemFilter` trả 500 `INTERNAL_ERROR`. Phần tử là số, chuỗi hay đối tượng thiếu khóa thì không ném lỗi, chỉ bị bỏ qua mà không báo ai.
  - Sửa trong ngày không được, cùng chỗ với BUG-R5-003: `parameter.service.ts` `set` (`ON CONFLICT … WHERE effective_from > today`) và `parameters.service.ts` `cancelScheduled` (dòng đã hiệu lực → 409).
  - Desk `ParamDialog.tsx`: ô JSON chỉ chạy `JSON.parse` (dòng 135); Hiệu lực từ mặc định là hôm nay (dòng 91).
  - Không có test nào lưu `damage_catalog` qua `setParameter`, hay đọc một bảng hỏng.
- **Tiền điều kiện / dữ liệu:**
  - **Chỉ làm trên stack local, dev/staging hoặc test tự động. Không làm trên production.**
  - `damage_catalog` = bảng phí BR-512 của DS-E (khăn tắm, ly, remote).
  - Một đơn trực tiếp đã nhận cọc, folio đang mở.
  - Tài khoản `qa.mgr` (lưu tham số), `qa.fd`, `qa.owner`.
- **Các bước tái hiện:**
  1. Mốc: FD gọi `getFolio`, `getBill`, `getChargeCatalog` → 200. Danh mục có `damage.bath_towel`, `damage.glass`, `damage.remote`.
  2. Bộ kiểm cho qua. Lưu cho một ngày tương lai, không đụng hôm nay, xong thì Hủy lịch (→ 204). Các giá trị sau đều **200**:
     - `[null]`; bảng 3 món thêm một phần tử `null`;
     - `priceVnd` âm; thiếu `priceVnd`; `priceVnd` dạng chuỗi; trùng `code`;
     - một đối tượng thay cho danh sách; `null` cho cả giá trị.
  3. `qa.mgr` mở Desk, màn Tham số, `damage_catalog`, bấm Sửa. Ô JSON điền sẵn bảng 3 món; thêm `, null` trước dấu `]`. Hiệu lực từ = hôm nay (mặc định), bấm Lưu → 200.
  4. Kết quả với FD, MGR và OWN:
     - `getFolio`, `getBill`, `getChargeCatalog` → **500** `INTERNAL_ERROR`. Log máy chủ: `TypeError: Cannot read properties of null (reading 'code')`;
     - FD ghi một dòng đồ uống (`addFolioLine`, `fnb`) → **500**, số dòng folio không đổi.
  5. Sửa trong ngày:
     - lưu lại bảng đúng cho hôm nay → 422 `VALIDATION_FAILED` ở `effectiveFrom`;
     - OWN Hủy lịch dòng hôm nay → 409 `INVALID_TRANSITION`.
  6. Lưu bảng đúng cho ngày mai → 200. Lúc 09:00 và 23:00 cùng ngày → vẫn 500. 07:00 ngày nghiệp vụ sau → 200; ghi dòng đồ uống → 201.
- **Kết quả thực tế:** bộ kiểm cho lưu một bảng làm folio, bill, danh mục phí và việc ghi dòng dịch vụ trả 500 với mọi đơn. Sửa lại cũng không được trong ngày.
- **Phát hiện thêm** (cùng gốc là thiếu bộ kiểm; không mở mã lỗi riêng, vì bộ kiểm theo DOM 13.4 chặn hết):
  - `priceVnd` âm lưu được. Danh mục phí hiện `damage.glass` giá −50.000 đ. Lễ tân ghi món này → 500.
    - Không sai tiền: DB chặn bằng ràng buộc `folio_line_sign_check`, không có dòng âm nào được ghi.
  - Thiếu `priceVnd`, hay `priceVnd` dạng chuỗi: món biến mất khỏi danh mục phí mà không báo ai.
- **Kết quả mong đợi** (DOM 13.2, 13.4, bản `6b5b8f34`; từ điển mục `damage_catalog`):
  - Bộ kiểm khi lưu chỉ nhận danh sách tối đa 100 món. Mỗi món đúng ba khóa:
    - `code` khớp `^[a-z0-9_]{1,40}$`, không trùng;
    - `name` không rỗng sau khi bỏ khoảng trắng hai đầu, tối đa 100 ký tự, không trùng (không phân biệt hoa thường);
    - `priceVnd` số nguyên 1.000–20.000.000;
    - khóa lạ → 422.
    - `[]` được nhận, nghĩa là chưa có bảng.
  - Sai dạng → 422 `PARAM_OUT_OF_RANGE` (hoặc mã ARC chốt), giá trị đang hiệu lực không đổi. Sai dạng gồm: phần tử `null`, số, chuỗi; đối tượng thay cho danh sách; `null` cho cả giá trị.
  - Lưu lại giá trị đang chạy (bảng 3 món của `production-defaults.ts`, DS-E) → 200.
  - Đọc phòng thủ ở hai chỗ đọc (`catalogNames`, `catalog`): không bao giờ 500 vì `damage_catalog`.
    - Phần tử hỏng → bỏ phần tử đó, các món đúng vẫn có.
    - Cả giá trị hỏng → coi như không có bảng. Lễ tân dùng "món ngoài bảng": quản lý định giá, có ảnh (BR-512).
    - Ghi log cảnh báo một lần cho mỗi giá trị: khóa, cơ sở, số phần tử bị bỏ. Không ghi giá trị, không dữ liệu khách (DOM 13.2).
  - Điều kiện đóng lỗi:
    - bộ kiểm khi lưu đã lên production; và
    - có đọc phòng thủ, **hoặc** câu SQL chỉ đọc trên production báo 0 dòng `damage_catalog` sai dạng (DOM 13.2, dòng đếm (b)).
    - DOM 13.2 xếp đọc phòng thủ của khóa này vào phần "còn lại" (R5-B-05), còn PO đề nghị làm cùng PR (plan V5-25). Nếu PR không có đọc phòng thủ, QA đóng lỗi theo SQL và chuyển ca (d)–(f) dưới đây sang R5-B-05.
- **Cách làm tạm (tới khi V5-25 lên):**
  - Theo release notes v1.0.4, "Giới hạn đã biết" (dòng 193): **không bấm Lưu thay đổi ở `damage_catalog`** tới khi đội báo đã sửa.
  - Buộc phải đổi (ví dụ khi chủ đầu tư gửi bảng đền bù, ESC-008):
    - nhắn đội trước;
    - chọn Hiệu lực từ **từ ngày mai trở đi** để còn Hủy lịch được;
    - giữ đúng dạng `{code, name, priceVnd}` cho từng món; không để phần tử trống, không gõ `null`.
  - Lỡ lưu sai cho hôm nay: báo ORC ngay. Lưu bảng đúng cho ngày mai để sự cố dừng ở mốc đổi ngày nghiệp vụ. Muốn sửa sớm hơn phải sửa thẳng DB production, việc này cần chủ đầu tư duyệt.
- **Việc cho ORC (chỉ đọc, không chặn):** kiểm giá trị đang hiệu lực **và các dòng đã hẹn** của `damage_catalog` trên production không có phần tử hỏng.
  - Cách 1: dòng đếm (b) của DOM 13.2 trong câu SQL chỉ đọc của V5-25 (`product/services/api/scripts/v5-25-parameter-shape-check.sql`).
  - Cách 2: INV hoặc MGR mở màn Tham số trên Desk, xem `damage_catalog`. Chỉ xem, không bấm Lưu.
  - Có phần tử hỏng ở một dòng đã hẹn → báo QA và PO ngay: sự cố sẽ bắt đầu ở ngày đó.
- **Ca test xác nhận khi sửa xong** (BE viết, QA duyệt; QA chạy lại trên staging ngay sau khi gộp):
  - (a) unit bộ kiểm `damage_catalog`, theo T-13-5 (DOM 13.5):
    - `priceVnd` 0 → 422; 20.000.000 → nhận; 20.001.000 → 422; 101 dòng → 422; trùng `code` → 422; tên "Ly" và "ly" → 422; `[]` → nhận;
    - thêm: `[null]`, bảng 3 món thêm `null`, phần tử số hay chuỗi, đối tượng thay cho danh sách, `null` cho cả giá trị, thiếu `priceVnd`, `priceVnd` dạng chuỗi, `priceVnd` âm, `code` có chữ hoa hay dấu, khóa lạ → 422.
  - (b) integration `setParameter`: lưu bảng có `null` cho hôm nay → 422. Giá trị đang hiệu lực không đổi; `getFolio`, `getBill`, `getChargeCatalog` vẫn 200.
  - (c) integration: lưu lại bảng 3 món của `production-defaults.ts`, và bảng của DS-E → 200 (T-13-6).
  - (d) đọc phòng thủ: chèn thẳng vào DB thử, bỏ qua bộ kiểm, bảng 3 món thêm `null`, `5`, `"x"`:
    - `getFolio`, `getBill`, `getChargeCatalog` → 200; danh mục còn đủ 3 món đúng;
    - ghi `damage.glass` → 201, đúng giá 50.000 đ;
    - có một dòng log cảnh báo, không có giá trị.
  - (e) chèn thẳng cả giá trị hỏng (một đối tượng; `null`): các đường trên → 200; danh mục không có món `damage.*`; ghi món ngoài bảng vẫn qua đường quản lý định giá (BR-512).
  - (f) chèn thẳng một món `priceVnd` âm: danh mục bỏ món đó; không đường nào 500.
  - (g) hồi quy: phần `getChargeCatalog`, `addFolioLine` món hư hỏng và `getBill` của `test/integration/payments-s3.test.ts` vẫn xanh.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lỗi trong mã".
  - Chạy cục bộ 06/11 (QA): bước 1–6 và phần "Phát hiện thêm" cho kết quả đúng như ghi ở trên (mã HTTP và `Problem.code`).
    - Bước 3 gọi thẳng `PUT /parameters/damage_catalog` với body mà `ParamDialog` gửi. QA chưa chạy trên Desk.
    - Log `ProblemFilter` có 17 dòng `TypeError: Cannot read properties of null (reading 'code')` ở bước 4 và bước 6. Ca giá âm: `PostgresError 23514`, `constraint=folio_line_sign_check`.
    - Lần chạy đầu, Hủy lịch một dòng hẹn 20/10 trả 500. Nguyên nhân: trigger `config_parameter_delete_future_only` (migration `0084`) so với giờ thật của DB, còn app dùng đồng hồ giả 15/10. Đây là do cách dựng test, không phải lỗi sản phẩm. Lần chạy sau dùng ngày 01/12 → 204.
    - Log nằm ở scratchpad của QA, ngoài repo.
  - `adjustFolioLine` và các màn Desk ở mục "Mức" suy ra từ mã. QA chưa chạy hai phần này.
  - Không có dữ liệu khách thật.
- **Ghi chú test lại:** chưa có.

### BUG-R5-005 – Web khách, tab Yêu cầu: lời nhắn có số thẻ thì trang báo "lỗi máy chủ" thay vì câu hướng dẫn

- **Mức:** P3. Trạng thái: **Đã sửa, chờ xác nhận trên staging v1.0.5.**
  - Chỉ sai câu chữ với khách. Máy chủ vẫn chặn đúng: 422 trước khi ghi, không tạo yêu cầu, không chép sang việc buồng phòng hay phiếu bảo trì, không lưu số thẻ. Không mất tiền, không lộ dữ liệu.
  - Không xếp P2:
    - yêu cầu không có số thẻ vẫn gửi được bình thường;
    - khách ít khi gõ số thẻ vào lời nhắn;
    - câu sai vẫn chỉ đường "nhắn OTTIMO kèm mã".
  - Vẫn phải ghi và sửa, vì đây là câu khách thấy trên production: câu bảo "thử lại sau ít phút", mà gửi lại thì vẫn bị chặn, và khách không biết phải bỏ số thẻ đi.
- **Vai chịu trách nhiệm:**
  - FE (FE-B): đã sửa ở PR #107 (V5-46).
  - FE-B: mock lệch máy chủ, thẻ FB-R5-ARC-FE-107-01 (Minor, Open). Đây là lý do test đơn vị không bắt được lỗi này.
  - ARC: thống nhất câu chữ hợp đồng về `CARD_NUMBER_DETECTED` ở `createGuestRequest` trong danh sách 0.3.14. Bảng mã cấp trên (openapi dòng 154) và mô tả 422 của op (dòng 9447) đang nói hai cách (SEC review #107 mục 1, ghi chú).
  - Nguồn phát hiện: FE khi làm #107. ARC (`rounds/round-05/reviews/ARC-on-fe-prs-98-102-107.md` mục 3.1) và SEC (`rounds/round-05/reviews/SEC-on-fe-prs-98-102-107.md` mục 1, dòng "Đọc cả mã cấp trên") xác nhận và đề nghị QA ghi lỗi.
- **Môi trường:**
  - production v1.0.4 = `6414be25`. Các tệp nêu ở "Chỗ lỗi trong mã" giống hệt `3de4b139`, là commit cha của merge #107 (`git diff` rỗng). Phía máy chủ không đổi từ `6414be25` tới `main` @ `be0c0cfd`.
  - Có từ R2 Sprint 4 (`5987a627`, 17/10): trang và nhánh lỗi của máy chủ vào cùng commit này. Vậy lỗi có trong mọi bản v1.0.0–v1.0.4.
  - Bản sửa: PR #107, merge `1c155881` trên `main`. Commit này không nằm trong `v1.0.4`; sẽ lên cùng v1.0.5.
  - QA tái hiện trên mã nguồn, không trên production và không trên staging (cách làm ở "Bằng chứng").
- **Liên quan:**
  - V5-46; V-09 / R-PAY-07 (máy chủ không bao giờ lưu số thẻ);
  - operationId `createGuestRequest` (`POST /v1/guest/requests`);
  - FB-R5-ARC-FE-107-01; plan R5 dòng V5-46.
- **Chỗ lỗi trong mã:**
  - Máy chủ, `product/services/api/src/modules/guest-portal/internal/guest-requests.service.ts` `note()` dòng 391–394: `throw problem('CARD_NUMBER_DETECTED', { errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }] })`. Kết quả là 422 với **mã cấp trên `CARD_NUMBER_DETECTED`**, không phải `VALIDATION_FAILED`.
    - Test máy chủ đang khẳng định đúng dạng này: `test/integration/guest-requests-s4-bed.test.ts` dòng 342–357.
  - Web khách, `product/apps/guest-web/src/pages/RequestsPage.tsx` tại `3de4b139` (= v1.0.4), hàm `send` dòng 343–370:
    - chỉ đọc mã trường khi `e.code === 'VALIDATION_FAILED'` (dòng 351);
    - mã cấp trên `CARD_NUMBER_DETECTED` không vào nhánh đó, không phải lỗi mạng, nên rơi xuống nhánh cuối (dòng 369) → câu `gw.error_server`.
    - Nhánh `codes.includes('CARD_NUMBER_DETECTED')` (dòng 361) không bao giờ chạy với máy chủ thật.
  - Trang này không tự dò số thẻ trước khi gửi, nên mọi chuỗi giống số thẻ đều đi tới máy chủ.
  - Vì sao test không bắt được: mock `mocks/handlers.ts`, nhánh thẻ của `POST /v1/guest/requests`, trả `VALIDATION_FAILED` kèm mã trường, khác máy chủ thật (thẻ FB-R5-ARC-FE-107-01).
  - Phạm vi chỉ là tab Yêu cầu:
    - ô ghi chú lúc đến (check-in online) không bị: `CheckinFlow.tsx` tự chặn số thẻ trên máy (dòng 484), và khi máy chủ chặn thì đọc mã trường (dòng 325);
    - `git grep`: ngoài guest-web, không ứng dụng nào gọi `createGuestRequest`.
- **Tiền điều kiện / dữ liệu:** một lượt ở đang ở (in-house) có link khách, DS-E. Số thẻ dùng để thử chỉ là số thẻ thử công khai `4111 1111 1111 1111`, `4242 4242 4242 4242`. Không dữ liệu khách thật.
- **Các bước tái hiện:**
  1. Khách mở link, chọn tab Yêu cầu → Yêu cầu mới → Khác.
  2. Lời nhắn: `Thẻ 4111 1111 1111 1111 trả giúp`. Bấm Gửi.
  3. Máy chủ trả 422, `code: CARD_NUMBER_DETECTED`, `errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }]`. Không tạo yêu cầu.
  4. Xem câu báo trên trang.
- **Kết quả thực tế** (v1.0.4, `3de4b139`):
  - VI: "Hệ thống đang gặp sự cố. Thử lại sau ít phút; nếu vẫn lỗi, nhắn OTTIMO kèm mã {request_id}."
  - EN: "Something went wrong on our side. Try again in a few minutes; if it keeps happening, message OTTIMO with the code {request_id}."
  - Khách không biết lỗi do số thẻ. Gửi lại thì bị chặn lại, với cùng câu đó.
- **Kết quả mong đợi:**
  - Câu `gw.req.card_detected`: VI "Vui lòng không ghi số thẻ thanh toán.", EN "Please don't include a payment card number.", RU theo `strings-ru.json`.
  - Không có câu "lỗi máy chủ". Khách vẫn ở form, chữ còn trong ô để tự sửa; lần gửi sau dùng khóa idempotency mới.
  - Câu không nhắc lại số khách gõ (SEC).
- **Bản sửa** (PR #107, FE-B; UXD, SEC, ARC duyệt @ `e2ffd228`; merge `1c155881`):
  - `app/problem.ts`: hàm mới `sensitiveNumberOf()` đọc cả mã cấp trên lẫn mã trường, thẻ trước, giấy tờ sau;
  - `RequestsPage.tsx` dòng 351: vào nhánh lỗi chữ khi mã là `VALIDATION_FAILED` **hoặc** có mã số nhạy cảm; số thẻ → `gw.req.card_detected`;
  - test hồi quy trong repo: `product/apps/guest-web/src/__tests__/v5-46-id-number.test.tsx`, ca "guest-portal shape for a card number (top-level code CARD_NUMBER_DETECTED) → the card sentence, not "server error"".
- **Ca xác nhận trên staging v1.0.5** (QA chạy khi staging đã lên bản có `1c155881`; không làm trên production):
  - Ca S-005-1 – số thẻ trong lời nhắn, VI và EN:
    - link khách của một lượt DS-E đang ở, màn 390 px;
    - tab Yêu cầu → Yêu cầu mới → Khác, lời nhắn `Thẻ 4111 1111 1111 1111 trả giúp` (EN: `Card 4242 4242 4242 4242 please`) → Gửi;
    - mong đợi:
      - câu `gw.req.card_detected` đúng ngôn ngữ, không có câu `gw.error_server`;
      - tab Network: 422, `code` = `CARD_NUMBER_DETECTED`, thân lỗi không chứa `1111` hay `4242`;
      - `qa.fd` trên Desk: danh sách yêu cầu khách không có yêu cầu mới; không có việc buồng phòng hay phiếu bảo trì mới.
  - Ca S-005-2 – sau khi bỏ số thẻ: sửa lời nhắn thành `Cho tôi thêm 2 khăn tắm` → Gửi → 201, yêu cầu hiện trên Desk. `qa.fd` đóng yêu cầu thử theo cách dọn DS-E.
  - Đạt cả hai ca thì QA chuyển lỗi sang Đóng.
- **Việc cho ORC / PO (không chặn):** release notes v1.0.5 nêu một dòng: "Tab Yêu cầu của web khách: lời nhắn có số thẻ nay hiện đúng câu hướng dẫn (BUG-R5-005)" (ARC mục 3.1). Không cần báo INV trước.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lỗi trong mã".
  - Chạy cục bộ 07/11 (QA), vitest trên mã của hai commit:
    - mỗi bản lấy bằng `git archive` (`3de4b139` và `1c155881`) vào thư mục riêng trong scratchpad, ngoài repo; dùng `node_modules` của repo. `design/copy` và `packages/` giống nhau ở hai commit;
    - một tệp test tạm của QA, không commit. MSW trả đúng thân lỗi của máy chủ thật, chép từ test máy chủ dòng 342–357. Không gọi staging hay production.
    - Kết quả:

      | Ca | `3de4b139` (= v1.0.4) | `1c155881` (#107) |
      |---|---|---|
      | VI, dạng máy chủ thật, `4111 1111 1111 1111` | "Hệ thống đang gặp sự cố. Thử lại sau ít phút; nếu vẫn lỗi, nhắn OTTIMO kèm mã req-qa-p3." → **lỗi** | "Vui lòng không ghi số thẻ thanh toán." → đạt; chữ còn trong ô |
      | EN, dạng máy chủ thật, `4242 4242 4242 4242` | "Something went wrong on our side. …" → **lỗi** | "Please don't include a payment card number." → đạt |
      | VI, mock mặc định (`VALIDATION_FAILED` + mã trường) | "Vui lòng không ghi số thẻ thanh toán." | như bên trái |

      Dòng cuối cho thấy vì sao test đơn vị cũ vẫn xanh.
    - Tệp test của repo `v5-46-id-number.test.tsx` tại `1c155881`: 10/10 ca qua.
    - Bộ dò máy chủ `containsCardNumber` (`shared/validation.ts`, chạy bằng `tsx`) nhận cả hai chuỗi thử là số thẻ (`true`). Hai lời nhắn thường `Cho tôi hỏi giờ ăn sáng`, `Phòng 302 cần thêm khăn` → `false`.
  - QA chưa chạy integration máy chủ (cần PostgreSQL). Dạng 422 lấy từ mã và từ test integration đang xanh trên CI.
  - Log nằm ở scratchpad của QA, ngoài repo. Không có dữ liệu khách thật.
- **Ghi chú test lại:** 07/11, QA, trên mã nguồn: đạt tại `1c155881` (bảng trên). **Chưa đóng**: chờ ca S-005-1, S-005-2 trên staging v1.0.5.

### BUG-R5-006 – `executeRefund`: luật số thẻ V-09 chặn nhầm mã chuyển khoản dài, MGR/OWN không ghi được lệnh chi hoàn

- **Mức:** P2. Trạng thái: **Mở, giao BE (v1.0.5).**
  - Đây là sai chức năng trên đường tiền, có cách làm tạm. Không phải lỗi bảo mật (SEC `rounds/round-05/responses/SEC-responses.md` mục 4.4).
  - Không mất tiền, không lộ dữ liệu: lệnh bị chặn thì không ghi gì. Số thẻ thật vẫn bị chặn đúng.
  - Không xếp P1: chỉ chặn một thao tác chi hoàn, không chặn nhận phòng, trả phòng hay thu tiền. Cách làm tạm rẻ, giữ được việc tìm trên sao kê.
  - Không xếp P3: thao tác tiền bị chặn, và câu báo trên Desk nói sai ô (xem "Chỗ lỗi trong mã"). Người dùng dễ sửa mã tùy ý cho qua, làm mã trong Desk không còn khớp sao kê.
  - Chưa có báo lỗi nào từ production (SEC 4.4, BE C0313-25).
  - Sửa trong v1.0.5 theo SEC phương án (a). Không hotfix v1.0.4.
- **Vai chịu trách nhiệm:**
  - BE (BE-B, PR-B3): luật riêng cho ô mã tham chiếu, đặt trong `shared/validation.ts`. SEC 4.4: áp vào `executeRefund` sớm nhất có thể, không cần chờ hết PR-B3.
  - SEC giữ luật (mục 4.1, 4.3). ARC sửa chữ ở 0.3.14 (thẻ FB-R5-BE-ARC-C0313-25).
  - UXD + FE-A: câu báo cho 422 ở ô mã, cả màn chi hoàn và màn ghi khoản thu (SEC 4.2). UXD đã có chữ (`dcfca8b1`); FE-A còn phải gắn vào hộp chi hoàn.
  - ORC: báo INV cách làm tạm cho MGR/OWN trước khi bản sửa lên (SEC 4.4).
  - Nguồn phát hiện: BE (`rounds/round-05/reviews/BE-on-contract-0.3.13.md` mục 7.8.3, thẻ C0313-25); SEC trả lời và đề nghị ghi lỗi (mục 4).
- **Môi trường:**
  - mã `main` @ `be0c0cfd`. Các tệp nêu ở "Chỗ lỗi trong mã" giống `6414be25` (production v1.0.4): `git diff` rỗng.
  - Kiểm số thẻ ở ô mã chi hoàn có từ R2 Sprint 3 (`2923bf43`, 17/10). Vậy lỗi có trong mọi bản v1.0.0–v1.0.4.
  - QA chạy cục bộ bằng `tsx`, không stack, không DB, không gọi staging hay production (cách làm ở "Bằng chứng").
- **Liên quan:**
  - operationId `executeRefund` (`POST /v1/properties/{propertyId}/approval-requests/{approvalId}/actions/execute-refund`, OWN/MGR, A47); BR-522; E15-02 (mã bắt buộc khi chi chuyển khoản);
  - V-09 / R-PAY-07; SEC-BE-44;
  - `PaymentCreate.bankReference` (PR-B3, hợp đồng 0.3.13 bổ sung 1e, ARC-15);
  - thẻ FB-R5-BE-ARC-C0313-25; SEC-responses mục 4.
- **Chỗ lỗi trong mã:**
  - `product/services/api/src/modules/payments/internal/refunds.service.ts` `payOut`:
    - dòng 668–672: mẫu `^[A-Za-z0-9./_-]{1,64}$`;
    - dòng 673–678: `containsCardNumber(input.bankReference)` → 422 `CARD_NUMBER_DETECTED`, `field` = `bankReference`;
    - dòng 759–763: chi chuyển khoản (`bank_transfer`, `vietqr`, `card_pos`, kênh `transfer`) mà ô trống → 422 `REQUIRED`. Vậy không thể để trống cho qua.
  - `product/services/api/src/shared/validation.ts` dòng 42–58: `containsCardNumber` = luật V-09 gốc **hoặc** `looksLikeCard`. Luật gốc thử Luhn trên **mọi cửa sổ 13–19 chữ số, ở mọi vị trí** của mọi dãy số. Hợp với chữ tự do, nhưng với ô mã thì một mã có phần số dài từ 13 chữ số rất dễ có một cửa sổ qua Luhn.
  - Controller (`refunds.controller.ts` dòng 232) chỉ cắt khoảng trắng hai đầu.
  - Desk (theo mã, QA chưa chạy Desk): `MoneyPage.tsx` dòng 931, ô "Mã giao dịch" hiện lỗi trường qua `fieldErrors` → `fieldErrorText` (`app/problem.ts` 118–128). Không có khóa `field.CARD_NUMBER_DETECTED`, nên ra khóa `error.CARD_NUMBER_DETECTED`: "Ô ghi chú có dãy số giống số thẻ thanh toán. Xóa dãy số đó – OTTIMO không lưu số thẻ." Câu nói "Ô ghi chú" và bảo xóa dãy số, trong khi đây là ô mã giao dịch và bắt buộc.
  - `PaymentCreate` trên v1.0.4 không bị:
    - chưa có `bankReference`: trường lạ bị từ chối (BE 7.8.2, ARC-15);
    - `posAuthCode` chỉ nhận tối đa 12 chữ và số (`payment.service.ts` 163–173), nên V-09 (từ 13 chữ số) không chặn nhầm một mã POS hợp lệ.
    - Nhưng PR-B3 thêm `bankReference` "như `executeRefund`". Nếu dùng lại `containsCardNumber` thì mang theo đúng lỗi này. Ở đó ô tùy chọn, nên lễ tân sẽ để trống, và khoản thu mất chặn trùng S4 mà không ai biết (BE C0313-25). Vậy bản sửa phải phủ cả hai đường (SEC 4.1).
  - Không test nào thử mã chuyển khoản dài toàn số ở `executeRefund`. Test repo dùng `FT26290001` (10 ký tự).
- **Tiền điều kiện / dữ liệu:**
  - **Chỉ làm trên stack local, staging hoặc test tự động. Không làm trên production.** Chỉ dùng chuỗi số ví dụ dưới đây, không dùng mã giao dịch thật.
  - Một yêu cầu hoàn `refund` `approved`, nơi nhận chuyển khoản; ảnh chứng từ `refund_proof`. Tài khoản `qa.mgr`.
- **Các bước tái hiện:**
  1. `qa.mgr` mở Desk, màn Tiền, mở yêu cầu hoàn đã duyệt → Chi chuyển khoản. Nhập số tiền, gắn ảnh.
  2. Ô Mã giao dịch: `2026110700000000` (16 chữ số ví dụ; cả chuỗi không qua Luhn). Bấm Lưu.
  3. Kết quả: 422 `CARD_NUMBER_DETECTED`, `errors[{ field: 'bankReference', code: 'CARD_NUMBER_DETECTED' }]`. Không ghi lệnh chi.
  4. Để trống ô → 422 `REQUIRED`.
  5. Nhập 8 ký tự cuối (`00000000`) → qua bước kiểm số thẻ.
- **Kết quả thực tế:** mã chuyển khoản không phải số thẻ vẫn bị chặn. Ô bắt buộc, nên MGR/OWN không ghi được lệnh chi, trừ khi sửa mã đi.

  | Mã ví dụ | Mô tả | `executeTransfer` hiện nay | Luật SEC 4.1 (QA mô phỏng) |
  |---|---|---|---|
  | `4111111111111111`, `4111-1111-1111-1111` | Số thẻ thử công khai | 422 `CARD_NUMBER_DETECTED` | chặn (đúng) |
  | `2026110700000000` | 16 chữ số, cả chuỗi không qua Luhn, một cửa sổ bên trong qua Luhn | **422** (nhầm) | nhận |
  | `26110700000004` | 14 chữ số, như trên | **422** (nhầm) | nhận |
  | `FT26110700000000` | Chữ kèm 14 chữ số, một cửa sổ qua Luhn | **422** (nhầm) | nhận |
  | `2026110700000100` | 16 chữ số, không cửa sổ nào qua Luhn | qua | nhận |
  | `202611070001` | 12 chữ số | qua | nhận |
  | `00000000` | 8 ký tự cuối của mã bị chặn | qua | nhận |

  Tỉ lệ bị chặn trên 20.000 mã toàn số ngẫu nhiên mỗi độ dài (khớp mô phỏng của BE ở C0313-25):

  | Độ dài | 12 | 13 | 14 | 15 | 16 | 18 |
  |---|---|---|---|---|---|---|
  | V-09 hiện nay | 0,0 % | 10,2 % | 26,6 % | 46,5 % | **64,5 %** | 88,7 % |
  | Luật SEC 4.1 (QA mô phỏng) | 0,0 % | 10,2 % | 9,7 % | 9,9 % | 10,2 % | 10,3 % |

- **Kết quả mong đợi** (SEC 4.1–4.3):
  - Luật riêng cho ô mã tham chiếu (`bankReference` ở `executeRefund` và ở mọi đường `PaymentCreate` qua `recordInTx`). BE đặt tên hàm, ví dụ `isCardNumberReference`, cạnh `containsCardNumber`:
    1. giá trị đã qua mẫu `^[A-Za-z0-9./_-]{1,64}$` và đã bỏ khoảng trắng;
    2. bỏ `.` `/` `_` `-`;
    3. **toàn bộ** là 13–19 chữ số **và** qua Luhn → 422 `CARD_NUMBER_DETECTED`, `field` = `bankReference`;
    4. còn lại thì nhận. Không cộng `looksLikeCard`.
  - Mọi ô chữ tự do (ghi chú, lý do…) giữ nguyên `containsCardNumber`.
  - Không lưu, không log giá trị bị chặn. Thân 422 không lặp lại giá trị.
  - Desk: câu riêng cho 422 ở ô mã, ở hộp chi hoàn và hộp ghi khoản thu. Không gợi ý để trống. UXD đã viết khóa `pay.bank_reference_card_like` (`rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 1.8, mục 9.8; decision-log 07/11, commit `dcfca8b1`): VI "Mã này trông giống số thẻ thanh toán nên Desk không lưu. Nhập 8 chữ số cuối của mã giao dịch." FE-A gắn khóa này.
  - Rủi ro còn lại SEC đã chấp nhận: mã toàn số 13–19 chữ số vẫn bị chặn nhầm khoảng 10 % (xác suất Luhn); số thẻ có chữ đứng trước sẽ lọt.
- **Cách làm tạm (tới khi bản sửa lên):** MGR/OWN gặp lỗi "giống số thẻ" ở ô mã chuyển khoản thì **nhập 8 ký tự cuối của mã**.
  - 8 ký tự không bao giờ là số thẻ, vẫn đủ để tìm trên sao kê.
  - Không để trống (máy chủ không cho), không tự đổi sang mã khác.
  - ORC báo INV cách này trước khi v1.0.5 lên (SEC 4.4).
  - **Lệch chữ cần ORC chốt một cách nói:** SEC 4.2 và lời dặn ORC viết "8 **ký tự** cuối"; câu UXD trên Desk viết "8 **chữ số** cuối", để chặn trùng S4 khớp dù người gõ có dấu gạch hay chấm. Với mã chỉ có chữ số thì hai cách như nhau. Với mã có `-` `.` hay chữ cái ở cuối thì ra hai giá trị khác nhau, và hai lần nhập cùng một mã có thể không khớp nhau. QA đề nghị lời dặn gửi INV dùng đúng câu UXD ("8 chữ số cuối").
- **Ca hồi quy** (BE-B viết, QA duyệt; theo SEC 4.3; chạy cho cả `recordPayment` và `executeRefund`):
  - (a) `4111111111111111`, `4111-1111-1111-1111`, `4111.1111.1111.1111`, `4111_1111_1111_1111` → 422 `CARD_NUMBER_DETECTED`, `field` = `bankReference`; không có dòng khoản thu hay lệnh chi; thân lỗi không chứa `1111`;
  - (b) `FT26110700000000` (chữ kèm 14 chữ số, một cửa sổ qua Luhn) → 201;
  - (c) `2026110700000000` và `26110700000004` (cả chuỗi không qua Luhn, một cửa sổ bên trong qua) → 201. **Hai ca này đỏ trên mã hiện nay**;
  - (d) 12 chữ số `202611070001` → 201; 8 ký tự cuối của một mã bị chặn → 201;
  - (e) 16 chữ số qua Luhn cả chuỗi, ví dụ `1234567812345670` → 422 (rủi ro SEC đã chấp nhận);
  - (f) ô ghi chú chứa `4111 1111 1111 1111` → vẫn 422 (luật chung không đổi);
  - (g) hồi quy: các ca `bankReference` hiện có ở `test/integration/payments-s3.test.ts` (`FT26290001`…) vẫn xanh.
- **Ca xác nhận trên staging v1.0.5** (QA, sau khi bản sửa lên staging; không làm trên production):
  - trên một yêu cầu hoàn DS-E đã duyệt: mã `4111111111111111` → 422; mã `2026110700000000` → 201 và lệnh chi ghi đúng mã đó;
  - Desk hiện câu mới của UXD ở ô Mã giao dịch khi bị chặn.
- **Bằng chứng:**
  - Đọc mã: các dòng nêu ở "Chỗ lỗi trong mã".
  - Chạy cục bộ 07/11 (QA): một script `tsx` trong scratchpad, ngoài repo.
    - Gọi thẳng `RefundsService.executeTransfer` của repo với phụ thuộc giả và `tx` rỗng. Kiểm số thẻ (dòng 673) chạy trước mọi lệnh DB (dòng 681). Vì vậy 422 ở bảng trên là đúng hành vi máy chủ; "qua" nghĩa là lệnh đã tới bước DB (lỗi `tx` rỗng, đúng như dự kiến).
    - Cột "Luật SEC 4.1" là hàm QA tự viết theo mô tả của SEC để so sánh, không phải mã repo.
    - Tỉ lệ ngẫu nhiên dùng bộ sinh số có hạt cố định, 20.000 mẫu mỗi độ dài.
  - Câu trên Desk và các bước 1, 4 suy ra từ mã. QA chưa chạy trên Desk hay stack có DB.
  - Mọi mã trong mục này là chuỗi ví dụ hoặc số thẻ thử công khai, không phải mã giao dịch hay số thẻ thật.
- **Ghi chú test lại:** chưa có.
