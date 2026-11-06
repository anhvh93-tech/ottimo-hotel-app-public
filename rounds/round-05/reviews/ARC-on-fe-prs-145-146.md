# ARC review – FE PR #145 (V5-15 Desk, Trả phòng quá ngày đi) và #146 (Hoàn tiền ở 390 px); quyết định FB-R5-FE-ARC-V515-01

- Người review: ARC | Round 5 – bước **Review** | 07/11/2026
- Đối tượng:
  - **#145** `r5-fe-v5-15-overdue` @ `011d44e7` (FE-A2). Nội dung V5-15 ở `9660334e`. Ba commit merge: `7a51c929`, `7900a5fe` (nhánh #140 @ `1a422157`), `011d44e7` (main @ `2eba9847`). #140 đã lên `main`, nên phần riêng của PR còn 14 tệp.
  - **#146** `r5-fe-refund-390` @ `5ba4fb8c` (FE): một commit, không merge.
- Đối chiếu:
  - hợp đồng `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.1, 1.4, 1.18, 1.19; `product/docs/api/openapi.yaml` (`checkOut` "Quy đổi giờ trả", `getCheckoutSummary`, `AllowedAction.overdue`); bổ sung 1h (#147, `closerChangeReason`) không đụng hai PR này;
  - máy chủ trên `main`: `frontdesk/internal/checkout-at.ts`, `frontdesk/internal/checkout.service.ts`, `reservations/public/overdue-checkout.ts`, `reservations/internal/allowed-actions.ts`, `shared/validation.ts`;
  - DOM `rules-v1.0.5.md` 7.1, 15.2–15.4; `product/docs/tham-so-quy-tac.md` (`late_checkout_tiers`, `business_day_rollover`, `manual_time_tolerance_minutes`);
  - review song song: DOM `DOM-on-fe-pr-145.md` (`ff314f0d`), SEC `SEC-on-fe-pr-145.md` (`7c7bf9d3`).
- Cách làm:
  - worktree tạm trong scratchpad: đầu PR và bản gộp thử vào `main` @ `8598bb5a` (gồm #102, #123 vừa gộp);
  - không đẩy gì lên nhánh PR, không gộp, không đánh dấu ready.
- Không có dữ liệu khách. Không có số hoa hồng hay bí mật. Giá trong ví dụ là số mẫu của BR-412.

Ký hiệu: **D** = ngày đi hiệu lực của lượt (`stayDepartureDate`). `business_day_rollover` = 06:00.

## 0. Kết luận

| PR | SHA | Kết luận ARC |
|---|---|---|
| #145 | `011d44e7` | **DUYỆT CÓ ĐIỀU KIỆN** |
| #146 | `5ba4fb8c` | **DUYỆT** |

**#145 – điều kiện:**
1. Điều kiện gộp của DOM, thẻ FB-R5-DOM-FE-145-01 (Major).
2. ARC xem phần thay đổi (delta) ở SHA mới. Phạm vi: lượt sửa 145-01, và 145-02 nếu làm cùng lượt (mục 3.4). ARC chạy lại 3 đột biến ở mục 1.4.

Về kỹ thuật, #145 đúng hợp đồng. Ai được ghi do máy chủ quyết, mock theo đúng máy chủ, test đỏ được, các merge sạch. Trên `main` mới nhất (`8598bb5a`, sau #102) chỉ còn xung đột `strings.js`, sinh lại là hết (mục 1.1). ARC không có thẻ Blocker hay Major.

**V515-01: không sửa máy chủ ở v1.0.5.** Đích v1.0.6, hợp đồng 0.3.14.
- BE-A1 sửa `resolveCheckoutAt`. FE-A2 sửa Desk trong **cùng tag**.
- v1.0.5 có một dòng Giới hạn đã biết (mục 3.3).
- Thẻ **145-02 của DOM vào #145**, cùng lượt sửa 145-01. Điều kiện hiện câu phải lấy từ `checkoutAt` của máy chủ (mục 3.4).

## 1. #145 – V5-15 Desk

### 1.1 Merge

- `git show --remerge-diff`:
  - `011d44e7`: rỗng;
  - `7900a5fe`, `7a51c929`: chỉ `strings.js`.
- `gen_strings.py` chạy lại trên đầu PR và trên bản gộp thử: không đổi tệp nào (3509 chuỗi + 8 mẫu).
- Gộp thử vào `main` @ `78617352`: sạch. Vào `main` @ `8598bb5a` (sau #102): **chỉ xung đột `strings.js`**.
  - `gen_strings.py` sinh lại là hết xung đột (3513 chuỗi + 8 mẫu). Các tệp chữ khác tự gộp và khớp đầu ra của bộ sinh.
  - FE-A2 gộp `main` và sinh lại `strings.js` trong lượt sửa 145-01, như các lần trước.
- Phần riêng còn 14 tệp: `overdue.tsx`, `CheckOutPage.tsx`, `ReservationDrawer.tsx`, 3 mock, 4 tệp chữ, 1 vitest, 1 E2E, báo cáo FE.
- Gộp tiếp #146 lên trên: sạch.

### 1.2 Khớp hợp đồng (0.3.13 mục 1.4, 1.18, 1.19)

| Điểm | Mã #145 | Kết quả |
|---|---|---|
| Ai được ghi | `overdueCheckOutAllowed` chỉ đọc `allowedActions` có `check_out` + `overdue: true`. Không đọc vai trên phiên | **Đạt.** Đúng 1.18: cờ chỉ có khi người gọi làm được. Đột biến m1 (đoán theo vai OWN/MGR) **đỏ** |
| 403 `FORBIDDEN_ACTION` | `overdueDenial` lấy `requiredRole`, `nightsNotBilled` từ chính 403. Không có thì dùng số đêm của tóm tắt. Rồi đọc lại đơn | **Đạt.** Trên đường quá ngày đi, mọi 403 của B18 đều là cổng vai: hai 403 khác của B18 (`debt`, `retain_with_guest_consent`) cần MGR+, mà người đã qua cổng là OWN/MGR. Đột biến m2 (bỏ số của 403) **đỏ** |
| Gọi ai (FD/FDL) | 1 đêm → câu gọi quản lý, từ 2 đêm → gọi chủ đầu tư, theo `nightsNotBilled` của máy chủ | **Đạt.** Desk chỉ chọn câu chữ, không chặn hay mở gì. Ngưỡng 1 trùng hằng số `MGR_OVERDUE_MAX_NIGHTS` (BR-433, không phải tham số). Lệnh ghi vẫn do máy chủ quyết |
| Thân B18 | `checkoutAt` của lần tóm tắt cuối có gửi giờ (V5-10); `checkoutTime` = giờ đó; `overdueReason` đã cắt khoảng trắng. Không gửi `checkoutTimeNote`, `extraNight`, `lateFeeInsteadOfNight` | **Đạt** (1.4, 1.18). Test kiểm từng trường |
| `checkoutTimeNoteRequired = false` | Không có ô ghi chú giờ | **Đạt** |
| Sau mốc cuối | `extraNightRequired` hoặc 422 `LATE_CHECKOUT_AFTER_LIMIT`: khóa nút, số cần thu = `balanceDueVnd`, không có ô giá đêm thêm | **Đạt** (1.4: B18 quá ngày đi không thêm đêm) |
| 409 `CONCURRENT_UPDATE` | `STAY_WRITE_RETRY` gửi lại 1 lần sau `Retry-After`, cùng khóa, cùng thân | **Đạt.** Đột biến m3 (`retries: 0`) **đỏ** |
| 422 `NOT_ALLOWED` trên `overdueReason` | Lượt đã gia hạn, hết quá ngày đi: Desk đổi khóa (`renewKey`), đọc lại đơn | **Đạt.** Đúng ghi chú dưới khóa ở `checkOut`: gửi lại cùng khóa sẽ được xét theo trạng thái mới, nên lần bấm sau phải là lệnh mới |
| VietQR `check_out` | Gửi `checkoutAt`. Trên đường quá ngày đi không bao giờ có `extraNightRateVnd`, `lateFeeAsNight` (`extraNightNeeded` và `lfOffered` đều tắt khi `overdue`) | **Đạt.** Một chỗ nhỏ: thẻ 145-03 |
| Ngăn đơn | `useOverdueNeed` chỉ đọc tóm tắt khi `stayDepartureDate` < ngày nghiệp vụ của Desk. Ý nghĩa vẫn lấy từ `summary.overdue` | **Đạt.** Điều kiện phía Desk chỉ quyết có đọc tóm tắt hay không. Lệch đồng hồ thì không hiện câu, như trước |
| Giờ điền sẵn | `checkoutTime` của lần tóm tắt đầu (giờ hẹn, không có thì giờ chuẩn). Giá trị này được gửi lại làm `checkoutTime`, nên `checkoutAt` vẫn đến từ một lần tóm tắt có giờ | **Đạt** với V5-10 (1.19 ý 08). Phần chữ của dòng nhắc là thẻ DOM 145-01 |
| Bổ sung 1h | Không đụng | – |

### 1.3 Mock so với máy chủ

| Mock | Máy chủ | Kết quả |
|---|---|---|
| `mocks/overdue.ts`: `overdueNights`, `canCheckOutOverdue`, `overdueRefusal` | `overdue-checkout.ts`: `nightsNotBilled`, `canCheckOutOverdue`, `assertOverdueCheckoutRole` | **Khớp.** Cùng định nghĩa: OWN luôn được, MGR ≤ 1 đêm, gộp quyền nhiều vai. Phần mở rộng của 403 cũng khớp |
| `allowedActions`: chỉ đơn gốc, theo ngày đi hiệu lực; `overdue: true` chỉ cho vai được phép | `allowed-actions.ts` dòng 85 | **Khớp** |
| Thứ tự B18: tra lần gửi lại → 409 trạng thái → cổng vai → thân lệnh | Idempotency → tải đơn không khóa → cổng vai → thân lệnh → khóa | **Khớp kết quả.** Máy chủ trả `overdueStay = null` khi đơn không `in_house`, nên đơn đã trả phòng vẫn ra 409 như mock |
| Tóm tắt: `overdue`, `nightsNotBilled`, `checkoutTimeNoteRequired = false` | `checkout.service.ts` dòng 1134–1138 | **Khớp** |
| `resolveCheckoutAt` của mock: ngày đi hiệu lực, cùng ứng viên, chọn "muộn nhất không sau giờ máy chủ" | `checkout-at.ts` | **Khớp**, kể cả lỗi V515-01: gõ 03:00 ra D+1 03:00 |
| Mã 422 khi lý do có số thẻ: mock trả mã cấp trên `VALIDATION_FAILED` | Máy chủ trả `CARD_NUMBER_DETECTED` | Lệch. SEC đã mở thẻ FB-R5-SEC-FE-145-02 |
| Dò số thẻ trong lý do: mock ghép **mọi** chữ số của câu rồi thử Luhn (`luhn(why.replace(/\D/g, ''))`) | `containsCardNumber`: chỉ xét dãy 13–19 chữ số liền nhau, giữa hai chữ số có tối đa một dấu cách hoặc gạch | Lệch, chỉ ở mock. Thẻ 145-01 |
| Ngày nhận của `checkoutAt` ở B18: mock nhận cả ngày lịch D và D+1 | Máy chủ nhận ngày nghiệp vụ D hoặc cửa sổ sau nửa đêm của D, tức từ D 00:00 tới trước D+1 06:00 | Lệch, nhưng Desk không gặp: Desk chỉ chuyển tiếp thời điểm máy chủ đã quy đổi. Thẻ 145-01 |

### 1.4 Test, đột biến, CI

- `v5-15-overdue-fea.test.tsx`: 15/15 xanh.
- Bản gộp thử trên `main` @ `8598bb5a` (đã sinh lại `strings.js`):
  - admin-web cả bộ: **94 tệp / 1061 ca xanh** (trên `78617352`: 93 / 1055);
  - `tsc` sạch.
- Đột biến, chạy trên bản gộp thử (đã hoàn nguyên sau mỗi lần):

| # | Thay đổi | Kết quả |
|---|---|---|
| m1 | `CheckOutPage`: mở hộp theo vai (`roles` có OWN/MGR) thay cho `allowedActions` `overdue` | **Đỏ**: ca "MGR, 2 nights → … the owner" |
| m2 | Màn chỉ dẫn sau 403 dùng số đêm của tóm tắt, bỏ `requiredRole`/`nightsNotBilled` của 403 | **Đỏ**: ca "B18 403 with requiredRole owner" |
| m3 | `STAY_WRITE_RETRY.retries.CONCURRENT_UPDATE` = 0 | **Đỏ**: ca "409 CONCURRENT_UPDATE … same Idempotency-Key and body" |

- **E2E** `tests/e2e/ui-clock/overdue-checkout.r5.spec.ts`:
  - chưa chạy ở máy FE-A2, nhưng **đã chạy trên CI** cho `011d44e7`;
  - job "docker images build · E2E smoke" (run `42294588026`, job `128171163891`), project `desk-clock`, API thật, MutableClock;
  - xanh sau 6,0 s, không chạy lại lần nào.
- **Ép kiểu trong E2E:** QA nên thêm các trường vào `tests/e2e/support`. Thẻ FB-R5-ARC-QA-145-02.
  - `support/s3-stay.ts` `CheckoutSummary` dừng ở round 3. Thiếu `checkoutAt`, `checkoutAtAfterNow`, `checkoutTimeNoteRequired`, `postMidnightWindow` (V5-10), `overdue`, `nightsNotBilled` (V5-15).
  - `support/s2.ts` `allowedActions` thiếu `overdue`.
  - Gói `@ottimo/tests` không phụ thuộc `@ottimo/api-client`, nên các kiểu này viết tay. Ép kiểu tại chỗ như PR này đang làm sẽ lặp lại ở mọi spec V5-10, V5-15 sau.

## 2. #146 – Hoàn tiền ở 390 px (UXD 130-01, 130-04)

- **Merge:** gộp thử vào `main` @ `8598bb5a` sạch.
  - #146 đụng `MoneyPage.tsx` và `app.css`. #134 và #150 đang mở cũng đụng hai tệp đó.
  - ARC thử gộp #146 trên `main` + từng PR #130, #134, #137, #141, #150, #145: sạch cả.
- **Hợp đồng, mock, luật:** không đụng.
  - Không gọi API mới, không đổi mock, không đổi chữ.
  - Chỉ gom chip trạng thái và các nút vào `.req-acts`. Mọi điều kiện hiện nút giữ nguyên từng nhánh: `left > 0 && online`, tiền mặt hay chuyển khoản, MGR hay không.
- **CSS:**
  - dùng lại luật `.req-row` / `.req-acts` của Yêu cầu từ website (test `s4-feb-uxr` đã giữ các luật này);
  - `text-wrap: pretty` đặt trên `.field .err > span` và `.alert .txt`. Hai bộ chọn khớp đúng cấu trúc của `Field.tsx` (`div.err > span`) và `Feedback.tsx` (`div.txt`). Trình duyệt không hỗ trợ thì bỏ qua.
- **Test:**
  - 3 ca mới, xanh;
  - bản gộp thử trên `8598bb5a`: admin-web **94 tệp / 1049 ca xanh**, `tsc` sạch;
  - đột biến m4 (bỏ lớp `req-acts` ở khối nút): **đỏ** ở ca 1.
- Không có thẻ. Bố cục và chữ do UXD review.

## 3. Quyết định FB-R5-FE-ARC-V515-01

### 3.1 Máy chủ đang làm gì (ARC chạy hàm thuần `resolveCheckoutAt` của `main`)

Dung sai 30 phút, rollover 06:00.

| Ca | Lúc bấm | Giờ gõ | Máy chủ quy về | Hệ quả |
|---|---|---|---|---|
| Đi 24/11, quá 1 đêm | 25/11 09:00 | 03:00 | **25/11 03:00** | Sau mốc cuối → `extraNightRequired`, Desk báo "gia hạn trước" |
| Như trên | 25/11 09:00 | 05:59 | 25/11 05:59 | Như trên |
| Như trên | 25/11 09:00 | 06:00 | 24/11 06:00 | Ngày nghiệp vụ D: phụ thu 0, không đêm thêm (cách tạm) |
| Như trên, Desk **gửi thẳng** `checkoutAt` 24/11 03:00 | 25/11 09:00 | – | Nhận, `postMidnight` | Đường gửi thẳng đã đúng DOM 15.4 ý 2. Chỉ đường quy đổi từ giờ gõ chọn sai ứng viên |
| **Đã gia hạn B13 tới 25/11**, vẫn quá 1 đêm | 26/11 09:00 | 03:00 | **26/11 03:00** | Lại "gia hạn trước". Ca mới ARC tìm thêm (mục 3.2 ý 1) |
| Không quá ngày đi (T10-2) | 25/11 01:05 | 01:00 | 25/11 01:00 | Như hợp đồng, không đổi |
| Không quá ngày đi (T10-1) | 24/11 07:00 | 05:30 | 24/11 05:30, `postMidnight` | Như hợp đồng, không đổi |

Với bảng phụ thu hiện tại (bậc tới 18:00, INV-007), ứng viên (D+1, `t` < 06:00) trên đơn quá ngày đi luôn sau mốc cuối. Vì vậy cách hiểu này không bao giờ ghi được trên đường này.

### 3.2 Quyết định: **không sửa máy chủ ở v1.0.5; sửa ở v1.0.6 (0.3.14)**

Lý do:
1. **Tiền như nhau với cách tạm** (DOM 3.4): số đêm không thu, phụ thu, đêm thêm, ngày khai báo, mốc kiểm căn, hoa hồng.
   - Rủi ro tiền duy nhất là câu "gia hạn trước" dẫn quản lý gia hạn một đêm khách không ở.
   - Rủi ro này có cả ở ca đã gia hạn mà vẫn quá ngày đi (dòng 5 bảng trên): làm theo câu đó thì gia hạn lần hai.
   - Thẻ DOM 145-02 đặt câu đúng lên màn ngay ở v1.0.5 (mục 3.4), nên rủi ro được xử lý mà không đụng máy chủ.
2. **Phần máy chủ rẻ, nhưng không lên một mình được.**
   - ARC đã thử trong worktree tạm: thêm 3 dòng và 1 import ở `checkout-at.ts`. 76 ca của `be-a1-v105-units`, `v105-overdue-checkout-units`, `frontdesk-rules` và 9 ca `module-boundaries` vẫn xanh. Tức là chưa có test nào giữ hành vi hiện tại; bản sửa phải có test riêng.
   - Khi máy chủ trả D 03:00, tóm tắt có `postMidnightWindow = true`. Desk v1.0.5 sẽ hiện `checkout.post_midnight` ("trả phòng bây giờ không phụ thu") trên đơn quá ngày đi (điều kiện 3 của DOM).
   - Dòng nhắc phải nói cách Desk đọc giờ (điều kiện 2), mock phải theo, QA phải chạy T-15-29.
   - Tức là bốn làn (BE, FE, UXD, QA) phải lên cùng lúc, ở bước Review cuối của v1.0.5, cho một ca DOM gọi là hiếm và không lệch tiền.
3. **`resolveCheckoutAt` là hàm chung** của tóm tắt, VietQR và B18, mới ổn định sau #106, #127. Đổi nó thuộc một tag mà QA chạy lại cả T10-x lẫn T15-x. v1.0.6 còn sửa đúng hàm này cho PR106-02 (khách đi tối hôm trước). Hai việc nên ở cùng một PR.

Trạng thái thẻ V515-01: **Deferred** sang v1.0.6, hợp đồng 0.3.14. Cách tạm theo DOM 3.3.

### 3.3 Dòng Giới hạn đã biết cho release notes v1.0.5

> Trả phòng quá ngày đi: nếu khách rời căn trong 00:00–05:59 của ngày đi (hoặc của ngày đi mới sau Gia hạn) mà tới sau 06:00 hôm sau mới ghi, Desk hiểu giờ gõ trước 06:00 là rạng sáng hôm sau và báo "gia hạn trước". Không gia hạn. Gõ 06:00 và ghi giờ thật vào lý do. Số tiền như khi ghi đúng giờ; chỉ giờ trên đăng ký lưu trú lệch, cùng ngày. Sửa ở v1.0.6.

BA đưa cùng ý vào sổ tay (DOM 3.3).

**Cập nhật @ `b834ea56`:** từ `c937ffd0`, Desk không còn báo "gia hạn trước" ở ca này. Dòng dùng cho release notes là bản ở mục 8.4.

### 3.4 Thẻ DOM 145-02 – vào #145, cùng lượt sửa 145-01

- **Vì sao vào #145:** máy chủ chưa sửa ở v1.0.5, nên câu trên màn là chốt chặn duy nhất ngay lúc gõ giờ. Câu cũng cần UXD chốt chữ như 145-01, nên làm một lượt. Nếu chữ UXD không kịp, #145 vẫn gộp được (điều kiện gộp chỉ là 145-01); khi đó dòng release notes ở 3.3 thay câu trên màn.
- **Cách làm, phần kỹ thuật** (để không có luật chỉ ở Desk lệch với máy chủ):
  - **Điều kiện hiện câu:** `overdue && s.extraNightRequired && localDayTime(s.checkoutAt).day !== stayDeparture`, nghĩa là máy chủ đã đặt giờ gõ sang ngày sau ngày đi hiệu lực.
    - Trên đơn quá ngày đi, điều này xảy ra đúng khi giờ gõ trước rollover.
    - **Không** so giờ gõ với 06:00 viết cứng ở Desk.
    - Khi bản sửa v1.0.6 lên, `checkoutAt` nằm trên D, nên câu tự tắt. Không phải gỡ mã.
  - Câu thay `checkout.overdue_after_limit` ở cả dưới ô giờ lẫn lý do khóa nút (`overdueWhy`).
  - Tham số của câu:
    - `{D}` = `date(stayDeparture)`;
    - ngày sau = ngày của `checkoutAt` máy chủ trả;
    - `{rollover}` = `property.businessDayRollover` (`Me`, `CheckOutPage` đã đọc ở dòng 179).
  - 1 ca vitest: đơn quá ngày đi, gõ 03:00 → hiện câu mới, không có `overdue_after_limit`, nút khóa. Đổi 06:00 → hộp xác nhận ghi "06:00 ngày D", B18 200.

### 3.5 Bản sửa v1.0.6 – luật, câu hợp đồng 0.3.14, ai làm

**Luật (ARC, theo DOM 3.5):**
- Khi ngày nghiệp vụ của giờ máy chủ sau ngày đi hiệu lực (`isOverdue`), máy chủ **không dựng ứng viên (ngày đi + 1, `t`)**.
- Vì vậy giờ `t` < `business_day_rollover` là rạng sáng của chính ngày đi (cửa sổ sau nửa đêm của D): `postMidnight`, phụ thu 0, không đêm thêm.
- Ứng viên (ngày đi, `t`) giữ nguyên. Ứng viên (ngày đi − 1, `t`) theo luật PR106-02 làm cùng PR. Đường `checkoutAt` gửi thẳng không đổi.

**Câu cho `openapi.yaml` `checkOut` mục "Quy đổi giờ trả" (0.3.14):**

> **0.3.14 (V5-15, FB-R5-FE-ARC-V515-01)** – lượt quá ngày đi (ngày nghiệp vụ của giờ server > ngày đi hiệu lực): không dựng ứng viên (ngày đi + 1, `t`). Giờ trước `business_day_rollover` là rạng sáng của chính ngày đi (cửa sổ sau nửa đêm: phụ thu 0, không đêm thêm, `postMidnightWindow = true`). Khách rời rạng sáng hôm sau là đã ở thêm đêm đó: gia hạn B13 trước. Sau gia hạn, cùng giờ gõ rơi vào rạng sáng của ngày đi mới. Ví dụ đi 10/11, ghi lúc 11/11 09:00: gõ 03:00 → 10/11 03:00 (trước đây 11/11 03:00 → 422 `LATE_CHECKOUT_AFTER_LIMIT`).

Thêm vào mô tả `CheckoutSummary.postMidnightWindow`: "trên lượt quá ngày đi, cờ này nghĩa là `checkoutAt` ở rạng sáng ngày đi, không phải 'trả phòng bây giờ'".

**Ai làm (cùng tag v1.0.6; thứ tự hợp đồng → BE-A1 → FE-A2):**
- **ARC:** đưa câu trên vào danh sách 0.3.14 ở PR tài liệu hợp đồng kế tiếp, cạnh PR106-02.
- **BE-A1** (`resolveCheckoutAt`), cùng PR với PR106-02:
  - dùng `isOverdue` của `reservations/public/overdue-checkout.ts`, tính từ `now`, `tz`, `rollover` đã có trong `CheckoutAtInput`. Không thêm trường, không viết phép so thứ hai. Sửa chú thích đầu tệp;
  - test đơn vị: đi 24/11, lúc 25/11 09:00, gõ 03:00 / 05:59 / 06:00 → 24/11 03:00 (`postMidnight`) / 24/11 05:59 / 24/11 06:00. Đã gia hạn tới 25/11, lúc 26/11 09:00, gõ 03:00 → 25/11 03:00. T10-1, T10-2, T10-3, T10-8 không đổi;
  - test tích hợp (T-15-23 qua đường gõ giờ): tóm tắt `checkoutAt` = D 03:00, phụ thu 0, `extraNightRequired = false`. QR cùng số. B18 MGR + lý do → 200, `actual_checkout_at` = `stay_ended_at` = D 03:00;
  - đột biến: bỏ điều kiện `isOverdue` → ca 03:00 đỏ.
- **FE-A2:**
  - không hiện `checkout.post_midnight` khi `overdue` (điều kiện 3 của DOM);
  - dòng nhắc cách đọc giờ (điều kiện 2, UXD chốt chữ). Câu 145-02 tự tắt (mục 3.4);
  - mock `resolveCheckoutAt`: không thêm (D+1, `t`) khi `overdueOf(r)`;
  - 1 vitest: gõ 03:00 → D 03:00, không có câu sau nửa đêm, B18 200.
- **UXD:** chữ điều kiện 2. **QA:** T-15-29, chạy lại T10-x và T15-x. **BA:** gỡ cách tạm khỏi sổ tay khi v1.0.6 lên.

## 4. Thẻ feedback

### FB-R5-ARC-FE-145-01
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/mocks/stay.ts`, nhánh B18 quá ngày đi: dò số thẻ (`luhn(why.replace(/\D/g, ''))`) và kiểm ngày (`[od.departureDate, addDays(od.departureDate, 1)].includes(sentAt.slice(0, 10))`).
- Vấn đề:
  - **Dò số thẻ:** mock ghép mọi chữ số của câu lý do rồi thử Luhn. Máy chủ (`shared/validation.ts` `containsCardNumber`) chỉ xét dãy 13–19 chữ số liền, tối đa một dấu cách hoặc gạch giữa hai chữ số.
    - Cách tạm của V515-01 bảo ghi giờ và ngày thật vào lý do, ví dụ "Khách đi 03:00 ngày 24/11/2026, thấy trống 14:00".
    - Câu như vậy dễ có từ 13 chữ số trở lên khi ghép lại. Mock sẽ báo nhầm số thẻ khoảng 1 lần trên 10. Máy chủ không báo.
  - **Kiểm ngày:** mock nhận cả ngày lịch D và D+1. Máy chủ nhận từ D 00:00 tới trước D+1 06:00. Desk không gặp, vì chỉ chuyển tiếp thời điểm máy chủ trả.
- Vì sao quan trọng: mock là nơi dev và UXD thử màn. Lỗi giả ở đúng ô lý do làm sai cảm nhận về luồng.
- Đề xuất sửa:
  - dùng `containsCardNumber` của `mocks/replyNote.ts` (bản chép luật máy chủ). Nên đổi luôn chỗ `note` dòng 1548, cùng mẫu cũ;
  - kiểm ngày như `checkout-at.ts`: ngày nghiệp vụ = D, hoặc cửa sổ sau nửa đêm của D;
  - làm cùng PR sau với SEC FB-R5-SEC-FE-145-02 (mã cấp trên `CARD_NUMBER_DETECTED`). Không chặn #145.
- Trạng thái: Open

### FB-R5-ARC-QA-145-02
- Mức độ: Minor
- Vị trí: `product/tests/e2e/support/s3-stay.ts` (`CheckoutSummary`), `product/tests/e2e/support/s2.ts` (`allowedActions`); ép kiểu tại chỗ ở `tests/e2e/ui-clock/overdue-checkout.r5.spec.ts`.
- Vấn đề:
  - Kiểu hỗ trợ của E2E viết tay và dừng ở round 3.
  - Spec V5-15 phải ép `overdue`, `nightsNotBilled`, `checkoutTimeNoteRequired` và `AllowedAction.overdue` tại chỗ.
  - Các spec V5-10, V5-15 sau sẽ lặp lại, và lỗi gõ tên trường sẽ không bị `tsc` bắt.
- Vì sao quan trọng: E2E là chỗ duy nhất kiểm Desk với API thật. Ép kiểu tại chỗ làm mất kiểm tra tên trường đúng ở các trường mới nhất.
- Đề xuất sửa:
  - QA thêm các trường tùy chọn, theo `openapi.yaml`:
    - `CheckoutSummary`: `checkoutAt`, `checkoutAtAfterNow`, `checkoutTimeNoteRequired`, `postMidnightWindow`, `overdue`, `nightsNotBilled`;
    - phần tử `allowedActions`: `overdue?: boolean`;
  - rồi bỏ ép kiểu trong `overdue-checkout.r5.spec.ts`, ở PR QA đó hoặc PR sau của FE-A2;
  - không cần cho `@ottimo/tests` phụ thuộc `@ottimo/api-client` ở v1.0.5.
- Trạng thái: Open (QA; không chặn #145)

### FB-R5-ARC-FE-145-03
- Mức độ: Suggestion
- Vị trí: `PaymentPanel.tsx`, lỗi của `createVietQr purpose = check_out` trên đơn quá ngày đi.
- Vấn đề:
  - Trang mở trước mốc đổi ngày rồi qua mốc: MGR chuyển từ 1 sang 2 đêm.
  - QR lúc đó trả 403 `requiredRole: owner` (1.18: QR cùng vai, cùng trần với B18).
  - Khung QR chỉ hiện lỗi chung. Màn "gọi chủ đầu tư" chỉ hiện sau khi bấm Hoàn tất.
- Vì sao quan trọng: ca hiếm (quanh 06:00), không sai tiền, không ghi gì. Chỉ chậm một bước mới biết gọi ai.
- Đề xuất sửa: lỗi QR cũng đi qua `overdueDenial` và bật cùng màn chỉ dẫn (`setOverdueDenied`). v1.0.6 cũng được.
- Trạng thái: Open

## 5. Điểm làm tốt

- Desk không đoán vai ở chỗ nào: hộp mở theo `allowedActions.overdue`, màn chỉ dẫn theo `nightsNotBilled` và 403 của máy chủ. Hai đột biến đoán vai đều bị bắt.
- `mocks/overdue.ts` chép đúng hàm thuần của máy chủ, kể cả phần mở rộng của 403. Mock tái hiện đúng cả lỗi V515-01, nhờ vậy FE-A2 thấy và báo lỗi trước khi lên staging.
- #146 sửa bố cục bằng mẫu sẵn có (`.req-row`), không thêm CSS mới ngoài một dòng `text-wrap`. Mọi điều kiện hiện nút giữ nguyên.

## 6. Việc theo vai

- **FE-A2:** sửa 145-01 (DOM, điều kiện gộp) và 145-02 (mục 3.4) trong #145. Sau đó ARC xem delta. 145-01 (ARC) cùng SEC 145-02 ở PR sau. 145-03 tùy chọn.
- **QA:** thẻ QA-145-02. T-15-28 trên Desk (cách tạm). T-15-29 ở v1.0.6.
- **BE-A1:** bản sửa mục 3.5 ở v1.0.6, cùng PR106-02. Không làm gì ở v1.0.5.
- **ARC:** đưa câu 3.5 vào danh sách 0.3.14.
- **ORC:** dòng 3.3 vào release notes v1.0.5. Gộp #146 khi CI xanh trên `5ba4fb8c` (đã xanh: run `42291117572`). Gộp #145 sau 145-01 và delta ARC.
- **BA:** sổ tay theo DOM 3.3.

## 7. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **ARC – review FE #145 @ 011d44e7 (V5-15 Desk): DUYỆT CÓ ĐIỀU KIỆN; #146 @ 5ba4fb8c (Hoàn tiền 390 px): DUYỆT; quyết định FB-R5-FE-ARC-V515-01.** #145: ai được ghi do máy chủ quyết (allowedActions overdue, 403 requiredRole/nightsNotBilled), thân B18 đúng 1.4/1.18, 409 gửi lại cùng khóa và thân, mock overdue.ts khớp overdue-checkout.ts; đột biến m1/m2/m3 đỏ; remerge-diff chỉ strings.js; gộp thử trên main @ 8598bb5a chỉ xung đột strings.js (sinh lại là hết), 94 tệp / 1061 ca xanh, tsc sạch; E2E desk-clock đã chạy xanh trên CI. Điều kiện: DOM 145-01 + ARC xem delta. Thẻ: ARC-FE-145-01 Suggestion (mock dò số thẻ và ngày nhận theo máy chủ), ARC-QA-145-02 Minor (thêm trường V5-10/V5-15 vào tests/e2e/support, bỏ ép kiểu), ARC-FE-145-03 Suggestion (403 của QR → màn gọi ai). #146: chỉ gom markup và CSS có sẵn, đột biến m4 đỏ, 94 tệp / 1049 ca xanh, không xung đột với #130/#134/#137/#141/#150. **V515-01:** không sửa máy chủ ở v1.0.5; v1.0.6 / 0.3.14: trên lượt quá ngày đi resolveCheckoutAt không dựng ứng viên (ngày đi + 1, t) – giờ trước rollover là rạng sáng của chính ngày đi; BE-A1 cùng PR106-02, FE-A2 cùng tag (không hiện checkout.post_midnight khi overdue, dòng nhắc cách đọc giờ, mock); ARC đã thử bản sửa trong worktree tạm (3 dòng, test cũ vẫn xanh); v1.0.5 có dòng Giới hạn đã biết (gõ 06:00, giờ thật vào lý do, tiền như nhau); DOM 145-02 vào #145 với điều kiện lấy từ checkoutAt của máy chủ (tự tắt khi bản sửa lên); không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-prs-145-146.md |`

## 8. Delta @ `b834ea56` (Review delta, 07/11/2026)

- Đối tượng: `011d44e7..b834ea56` của #145.
  - Phần sửa nằm ở `c937ffd0` (10 tệp). `b834ea56` chỉ sửa báo cáo FE (`rounds/round-05/outputs/FE/v5-15-overdue-fea.md`).
  - `5bd6d126` (main @ `92635b39`) và `c2f883a4` (main @ `c2d5588d`) là commit gộp. `git show --remerge-diff` của cả hai chỉ ra `strings.js`, tệp sinh.
- Đối chiếu:
  - mục 3.4 của tệp này;
  - trả lời của FE-A2: `rounds/round-05/responses/FE-responses.md`, mục "FE-A2 – PR #145";
  - delta của DOM (`DOM-on-fe-pr-145.md` mục 10, DUYỆT) và SEC (`SEC-on-fe-pr-145.md` "Phần chênh", DUYỆT) đã có trên `main`.
- Cách làm: worktree tạm trong scratchpad. Gộp thử vào `main` @ `506c20c4`, rồi gộp lại @ `02da751a` (sau #147). Không đẩy gì lên nhánh PR, không gộp, không đánh dấu ready.

### 8.0 Kết luận

| PR | SHA | Kết luận ARC |
|---|---|---|
| #145 | `b834ea56` | **DUYỆT** (thay cho DUYỆT CÓ ĐIỀU KIỆN @ `011d44e7`) |

- Hai điều kiện ở mục 0 đã xong:
  - DOM 145-01: Done, DOM đã duyệt delta;
  - ARC đã xem delta; 3 đột biến cũ m1/m2/m3 vẫn đỏ.
- Câu 145-02 hiện theo `checkoutAt` của máy chủ, đúng mục 3.4. Desk không có luật riêng nào.
- **Gộp khi CI xanh trên `b834ea56`.** Lúc ARC đọc, `format · lint · audit · test · build` còn pending, các job khác đã xanh. ARC đã chạy `prettier --check` và `eslint --max-warnings 0` trên 5 tệp mã đổi: sạch.
- 2 thẻ mới, đều không chặn gộp:
  - 145-04 Minor: thiếu test cho lượt đã gia hạn mà gõ giờ sau mốc cuối;
  - 145-05 Suggestion: ca test số thẻ phụ thuộc ngày chạy.
- Không ESC.

### 8.1 Gộp và chữ

- Gộp thử trên `main` @ `506c20c4` và @ `02da751a`: không xung đột (`git merge-tree` cũng sạch).
  - `02da751a` mang #147: sinh lại `openapi.ts` của `api-client`, thêm `closerChangeReason`. Không đụng phần của #145.
- Kết quả trên cả hai bản gộp: admin-web 95 tệp / 1075 ca xanh, `tsc --noEmit` sạch.
- `python3 -I product/design/tools/gen_strings.py` trên bản gộp: 3518 chuỗi + 8 mẫu, không lệch tệp nào.

### 8.2 Điều kiện mục 3.4 – đối chiếu mã

| Điều kiện (3.4) | Mã @ `b834ea56` | Kết quả |
|---|---|---|
| Hiện câu khi `overdue && extraNightRequired && ngày của checkoutAt máy chủ ≠ ngày đi hiệu lực` | `overdueEarlyAt(overdueAfterLimit, s?.checkoutAt, stayDeparture)`, trong đó `overdueAfterLimit = overdue && !!s?.extraNightRequired` và `stayDeparture = r.stayDepartureDate ?? r.departureDate`. Ngày lấy bằng `localDayTime`, là ngày lịch Asia/Ho_Chi_Minh | **Đạt** |
| Không so giờ gõ với 06:00 | `overdueEarlyAt` chỉ đọc `checkoutAt`. `{time}` và `{next}` cũng là giờ và ngày của `checkoutAt` máy chủ | **Đạt** |
| Thay `overdue_after_limit` ở cả hai chỗ | `overdueLimitText` dùng ở `overdueWhy` (lý do khóa nút) và `timeError` (dưới ô giờ) | **Đạt** (m6 đỏ) |
| Tự tắt khi v1.0.6 lên | Máy chủ đặt giờ lên D, nên `day === stayDeparture` và hàm trả `null`. Có ca hàm thuần: `'2026-11-10T03:00…'` → `null` | **Đạt** |
| Lượt đã gia hạn | `{date}` = ngày đi sau Gia hạn, `{next}` = ngày máy chủ trả. Có ca vitest | **Đạt**, thiếu 1 ca (thẻ 145-04) |
| Tham số | `{date}` = `date(stayDeparture)`, `{next}` = `date(checkoutAt.day)`, `{rollover}` = `property.businessDayRollover` (`LocalTime`, mặc định `DEFAULT_ROLLOVER = '06:00'`) | **Đạt** |

Các phần khác của delta, xét về kỹ thuật:
- **145-01:** nhánh quá ngày đi chỉ có một câu help. Có `agreedCheckoutTime` thì dùng `overdue_time_help_agreed`, không có thì dùng `overdue_time_help`. Nhánh thường giữ như `main`. Giá trị ô giờ và thân B18 không đổi (m9 đỏ).
- **`overdue_extend_hint`:** hiện theo `allowedActions` `extend_stay` của máy chủ, ở cả hai chỗ: `canExtendStay(r)` trên trang, `allowed.has('extend_stay')` ở ngăn đơn. Không đoán vai (m7 đỏ).
- **Focus sau 403** (`div tabIndex=-1`, effect theo `overdueDenied`) và **con trỏ cuối ô lý do**: không đụng dữ liệu hay API.
- **Mock:**
  - dò số thẻ bằng `containsCardNumber` của `mocks/replyNote.ts`;
  - trả 422 `CARD_NUMBER_DETECTED` chỉ với `errors[overdueReason]`, như `Fields.done()` (SEC đã đóng 145-02).

### 8.3 Đột biến

Chạy trong worktree tạm, trả tệp về nguyên trạng sau mỗi lần. Bộ chạy: `v5-15-overdue-fea`, 21 ca.

| # | Đột biến | Kết quả |
|---|---|---|
| m1 | Mở hộp theo vai (`mgr`) thay cho `allowedActions` `overdue` | Đỏ: "MGR, 2 nights → … the owner" |
| m2 | Màn chỉ dẫn sau 403 dùng số đêm của tóm tắt, bỏ `requiredRole` | Đỏ: "B18 403 with requiredRole owner …" |
| m3 | `retries.CONCURRENT_UPDATE` = 0 | Đỏ: "409 CONCURRENT_UPDATE …" |
| m5 | `overdueEarlyAt(…, r.departureDate)`: ngày đi gốc thay cho ngày đi hiệu lực | **Xanh** → thẻ 145-04 |
| m6 | Lý do khóa nút vẫn là `overdue_after_limit` | Đỏ: 2 ca (gõ 03:00; lượt đã gia hạn) |
| m7 | Luôn thêm `overdue_extend_hint` | Đỏ: ca hàm thuần |
| m8 | Mock dò số thẻ theo luật cũ (ghép mọi chữ số rồi thử Luhn) | **Xanh** → thẻ 145-05 |
| m9 | Bỏ nhánh `overdue_time_help_agreed` | Đỏ: ca hẹn 17:00 |
| m10 | Desk so giờ gõ với `rollover` (đột biến xanh FE-A2 đã báo) | Xanh. Đột biến tương đương, ARC chấp nhận (xem dưới) |

**Về m10:** ARC đồng ý với FE-A2: không test nào phân biệt được hai cách, và cũng không cần.
- **Với máy chủ v1.0.5:** lượt quá ngày đi nghĩa là giờ máy chủ đã sang ngày nghiệp vụ sau D. Mọi giờ gõ trước rollover đều bị đặt sang D+1 và quá mốc cuối. Giờ gõ từ rollover trở đi luôn nằm trên D. Hai cách cho cùng kết quả.
- **Với máy chủ v1.0.6:** giờ gõ trước rollover nằm trên D, phụ thu 0, `extraNightRequired = false`. Vì vậy `overdueAfterLimit` sai, và câu không hiện ở cả hai cách.
- Chốt cho điều kiện này là đọc mã (mục 8.2) và ca hàm thuần, không phải đột biến. Cách hiện tại vẫn tốt hơn: Desk theo đúng cách máy chủ đọc giờ, kể cả lúc tóm tắt chưa kịp đọc lại sau khi gõ.

**Probe của ARC cho m5:** thêm tạm một ca vào tệp test trong worktree, không commit. Lượt đã gia hạn tới T−1, vẫn quá ngày đi, gõ 18:30.
- Mã hiện tại: xanh. Nút khóa với `overdue_after_limit`.
- Dưới m5: đỏ. Màn hiện câu rạng sáng.

### 8.4 Dòng Giới hạn đã biết cho release notes v1.0.5 (thay bản ở 3.3)

Sửa theo góp ý của DOM (`DOM-on-fe-pr-145.md` mục 10.3): Desk nay nói rõ cách đọc giờ, không còn báo "gia hạn trước".

> Trả phòng quá ngày đi: nếu khách rời căn trong 00:00–05:59 của ngày đi (hoặc của ngày đi mới sau Gia hạn) mà tới sau 06:00 hôm sau mới ghi, Desk hiểu giờ gõ trước 06:00 là rạng sáng hôm sau và nói rõ điều đó ngay dưới ô giờ. Không gia hạn. Gõ 06:00 và ghi giờ thật vào lý do. Số tiền như khi ghi đúng giờ; chỉ giờ trên đăng ký lưu trú lệch, cùng ngày. Sửa ở v1.0.6.

### 8.5 Trạng thái các thẻ ARC trước đó

| Thẻ | Trạng thái | Ghi chú |
|---|---|---|
| FB-R5-ARC-FE-145-01 (Suggestion) | Done một phần | Dò số thẻ đã Done (`containsCardNumber`). Ba việc còn lại Deferred sang v1.0.6, làm cùng mock `resolveCheckoutAt` của V515-01, ARC chấp nhận: (a) kiểm ngày `checkoutAt` theo `checkout-at.ts`; (b) chỗ `note` ở dòng 1549 của `mocks/stay.ts`; (c) mock mới chép luật gốc, chưa có nửa `looksLikeCard` của máy chủ (ký tự ẩn, chữ số full-width). Mock lỏng hơn máy chủ, Desk không bị ảnh hưởng |
| FB-R5-ARC-QA-145-02 (Minor) | Open | Thẻ của QA. Không chặn #145 |
| FB-R5-ARC-FE-145-03 (Suggestion) | Deferred v1.0.6 | ARC chấp nhận |
| FB-R5-FE-ARC-V515-01 | Deferred v1.0.6 / 0.3.14 | Theo mục 3.2 và 3.5 |

### FB-R5-ARC-FE-145-04
- Mức độ: Minor
- Vị trí:
  - test: `product/apps/admin-web/src/__tests__/v5-15-overdue-fea.test.tsx`, khối "V5-15 – copy 9.15";
  - mã cần giữ: `CheckOutPage.tsx`, `overdueEarlyAt(overdueAfterLimit, s?.checkoutAt, stayDeparture)`.
- Vấn đề:
  - Ca "a time after the last tier ON the departure day stays extend first" chỉ chạy trên lượt chưa gia hạn, nơi ngày đi gốc trùng ngày đi hiệu lực.
  - Ca lượt đã gia hạn chỉ gõ 03:00, khi ngày máy chủ trả khác cả hai ngày đó.
  - Vì vậy đổi đối số thành `r.departureDate` (m5) mà cả 21 ca vẫn xanh.
- Vì sao quan trọng:
  - Nếu sau này mã bị đổi như m5: lượt đã gia hạn mà gõ 18:30 sẽ hiện câu rạng sáng, bảo "ghi 06:00, không gia hạn" cho một đêm khách đã ở.
  - Làm theo câu đó là mất tiền một đêm.
  - Mã hiện tại đúng. Chỉ thiếu test giữ nó.
- Đề xuất sửa:
  - Thêm 1 ca: lượt đã gia hạn tới T−1 (dựng như ca "ARC 3.4: an extended stay still overdue"), gõ 18:30. Kỳ vọng: nút khóa với `checkout.overdue_after_limit`, không có câu rạng sáng.
  - ARC đã thử đúng ca này: xanh với mã hiện tại, đỏ dưới m5.
  - Làm trong #145 nếu còn lượt đẩy; nếu không, ở PR FE-A2 kế tiếp của round 5.
- Trạng thái: Open

### FB-R5-ARC-FE-145-05
- Mức độ: Suggestion
- Vị trí: `v5-15-overdue-fea.test.tsx`, ca "the server reads the reason like V-09: times and dates in it are not a card number (ARC 145-01)".
- Vấn đề:
  - Câu lý do là `Khách đi 11:40 ngày ${dmy(r.departureDate)}, thấy trống 12:15`. Ngày trong câu đổi theo ngày chạy test.
  - Luật cũ của mock chỉ báo nhầm khi 16 chữ số ghép lại qua được Luhn, tức khoảng 1 ngày trên 10.
  - Với ngày chạy hôm nay (ngày đi 06/11/2026), phép ghép không qua Luhn, nên m8 xanh.
- Vì sao quan trọng: ca này chỉ giữ được thẻ 145-01 vào những ngày tình cờ. Chỉ ảnh hưởng mock.
- Đề xuất sửa:
  - Dùng câu cố định mà phép ghép qua Luhn, ví dụ `Khách đi 11:40 ngày 05/11/2026, thấy trống 12:45`: ghép lại là `1140051120261245`, qua Luhn.
  - ARC đã chạy `containsCardNumber` của máy chủ trên câu này: không phải số thẻ, đúng ý ca test.
  - Có thể thêm một dòng kiểm phép ghép qua Luhn ngay trong ca, để ca không mất nghĩa khi ai đó đổi câu.
- Trạng thái: Open

### 8.6 Việc theo vai

- **ORC:** gộp #145 khi CI xanh trên `b834ea56`. Release notes v1.0.5 dùng dòng ở mục 8.4.
- **FE-A2:** 145-04 (Minor) và 145-05 (Suggestion). Phần còn lại của 145-01 và 145-03 ở v1.0.6.
- **QA:** thẻ QA-145-02 vẫn mở.

### 8.7 Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **ARC – delta review FE #145 @ b834ea56 (V5-15 Desk, sửa ở c937ffd0): DUYỆT** (thay DUYỆT CÓ ĐIỀU KIỆN @ 011d44e7). Điều kiện xong: DOM 145-01 Done, ARC đã xem delta. Câu 145-02 overdue_time_early hiện khi overdue && extraNightRequired && ngày của checkoutAt máy chủ ≠ ngày đi hiệu lực (overdueEarlyAt, lượt đã gia hạn có tính), Desk không so giờ gõ với 06:00, {rollover} = property.businessDayRollover, tự tắt khi v1.0.6 lên. remerge-diff 5bd6d126/c2f883a4 chỉ strings.js. Gộp thử trên main @ 506c20c4 và @ 02da751a: sạch, 95 tệp / 1075 ca xanh, tsc sạch, gen_strings không lệch, prettier + eslint sạch. 10 đột biến: m1/m2/m3/m6/m7/m9 đỏ; m10 (so giờ gõ với rollover) là đột biến tương đương với cả máy chủ v1.0.5 lẫn v1.0.6, ARC chấp nhận; m5 xanh → thẻ ARC-FE-145-04 Minor (thêm ca lượt đã gia hạn gõ 18:30 → overdue_after_limit; ARC đã thử: xanh với mã hiện tại, đỏ dưới m5); m8 xanh → ARC-FE-145-05 Suggestion (ca số thẻ phụ thuộc ngày chạy, dùng câu cố định). ARC-FE-145-01 Done một phần (phần còn lại v1.0.6), 145-03 Deferred v1.0.6. Dòng Giới hạn đã biết v1.0.5 sửa theo DOM 10.3 (mục 8.4). Gộp khi CI xanh trên b834ea56; không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-prs-145-146.md |`
