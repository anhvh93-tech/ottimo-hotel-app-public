# ARC review PR #142 (FE-4) – V5-11 phía Desk: Trả sớm 00:00–05:59

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#142](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/142) `r5-fe-v5-11` @ **`52a14957`** (DRAFT). Cắt từ `main` @ `1ed9ac0e`. 5 tệp, +606/−15, chỉ `product/apps/admin-web`. Head không đổi trong lúc review.
- Báo cáo FE: `rounds/round-05/outputs/FE/v5-11-desk.md`.
- Đối chiếu:
  - #114 `r5-a2` @ `f730b691`, ARC đã duyệt: `stay.service.ts` khối W (dòng 1426–1451), `allowed-actions.ts` (`checkOutOpen`, `earlyDepartureOpen`), `shared/business-day.ts` (`inEarlyHours`, `minCalendarDate`, `isCheckoutDay`), `checkout.service.ts` dòng 1346 (`serviceDate: ctx.today`);
  - hợp đồng 0.3.13 bổ sung 1: `openapi.yaml` `earlyDeparture` (dòng 4007–4011), `Problem.minNewDepartureDate`/`useCheckout` (10750–10760); `contract-0.3.13.md` mục 1.21;
  - DOM `rules-v1.0.5.md` mục 2 và 7.6; UXD `copy-v1.0.5.md` mục 9.13;
  - review cùng PR: `UXD-on-fe-pr-142.md` (UXD-142-01 Major), `DOM-on-fe-pr-142.md` (DOM-142-01…04).
- Cách kiểm:
  - Đọc mã trên worktree tạm trong scratchpad. Không checkout nhánh trong thư mục chính.
  - Chạy `pnpm install --offline`, test, `tsc`, `eslint`. Chạy 22 đột biến, mỗi lần một chỗ, rồi trả mã về.
  - Viết 3 ca probe tạm, không commit.
  - Gộp thử `main` hiện tại vào PR (cục bộ, không đẩy).
- Kết quả chạy:

  | Cây | Kết quả |
  |---|---|
  | #142 @ `52a14957` | `v5-11-early-departure-night-fea.test.tsx` 10/10. **Toàn bộ admin-web: 89 tệp, 1005/1005.** `tsc --noEmit` sạch, `eslint` 4 tệp sạch |
  | `main` hiện tại + #142 (gộp cục bộ `a40aa665`, không xung đột) | `tsc` sạch; 6 tệp liên quan (5 tệp Trả sớm/Trả phòng + `r3-s1-fea` mốc đổi ngày) 97/97 |

- CI lúc commit:
  - `format · lint · audit · test · build` đang chạy;
  - job `infra scripts (shellcheck)` hỏng ở bước `postgres error lines without row values` (`postgres-log-terse`). PR không chạm tệp hạ tầng. Đây là cùng bước đã hỏng ở #127 (ARC-on-be-a1-prs-127-113-114.md mục 6.2). ORC chạy lại.
- #142 và #114 không chung tệp (Desk / API). Thứ tự gộp vẫn là **#114 trước** (lý do ở mục 1.1).
- Tệp này không có bí mật, IP máy chủ hay dữ liệu khách. Ngày trong ví dụ là ngày giả.

## 0. Kết luận

| PR | Kết luận | Thẻ ARC | Điều kiện gộp |
|---|---|---|---|
| **#142** @ `52a14957` | **DUYỆT CÓ ĐIỀU KIỆN.** ARC không có Blocker/Major. Hợp đồng, dạng 409 và luật phí đúng #114 | 142-01 (Minor), 142-02 (Minor), 142-03 (Minor) | (1) Gộp **sau #114**. (2) Sửa **UXD-142-01 (Major)**, đã là điều kiện của UXD và DOM, theo quy tắc kỹ thuật ARC chốt ở mục 3 (thẻ 142-03 làm cùng bản sửa). (3) CI xanh, chạy lại job `infra scripts` |

Trả lời các ý ORC hỏi:

| Ý | Kết quả |
|---|---|
| Mock trả đúng dạng #114 (hai biến thể 409 `INVALID_TRANSITION`, `serviceDate` = ngày nghiệp vụ) | **Đúng.** Chi tiết ở mục 1.1 |
| Client không tự tính phí | **Đúng.** Desk chỉ hiện và gửi lại `earlyDepartureFeeVnd`/`refundVnd` của lần tính thử. Đột biến M1, M1b đỏ (ca "số lạ 1.234.000 / 456.000") |
| Ước tính = ngày nghiệp vụ neo máy chủ + giờ máy quầy + `businessDayRollover`; ngày trong 409 luôn thắng | **Đúng một nửa.** Ngày máy chủ thắng khi ước tính của Desk **sớm hơn** máy chủ. Khi ước tính **muộn hơn**, Desk chặn ở client, không có request, nên máy chủ không có dịp sửa (DOM-142-01, probe P1 mục 2). Ca hộp mở qua 00:00 của UXD-142-01 cũng thế: client chặn trước khi 409 kịp về. ARC chốt quy tắc ở mục 3 |
| Bước ③ "Trả phòng ngay" chỉ theo `allowedActions` có `check_out` | **Đúng, và là cách nên làm.** Mục 1.3 |
| `minCalendarDay` mới ở `app/dates.ts` | **Đúng khi đồng hồ quầy khớp máy chủ.** Chưa phải cùng công thức với `minCalendarDate` của máy chủ. Thẻ 142-03 |
| Ngày rời mới đặt sẵn = ngày lịch | **Xác nhận: ngày lịch trong W, ngày nghiệp vụ ngoài W.** Căn cứ: `openapi.yaml` 4009–4010 (`minNewDepartureDate` = D+1 là ngày lịch; "Ngoài W giữ như cũ (tối thiểu = ngày nghiệp vụ)"), DOM 2.1 (2) ("Desk đặt sẵn Ngày rời mới = ngày lịch"). Lời giao trước của ORC ("ngày nghiệp vụ") nhầm; hợp đồng thắng. FE làm đúng |

## 1. Đối chiếu hợp đồng và #114

### 1.1 Mock `mocks/stay.ts` so với #114 `stay.service.ts`

| Điểm | #114 | Mock #142 | Kết quả |
|---|---|---|---|
| Thứ tự kiểm | khuôn thân lệnh → 404 → 412 `If-Match` (lần ghi) → 409 trạng thái / đơn chính → W → kiểm ngày khác | `withRes` (404, 412 lần ghi) → 409 `in_house`/đơn chính → W → 422 ngày | Khớp. Lệch nhỏ: mock xét W trước khi kiểm `noticeGivenAt` sai khuôn. Desk luôn gửi `noticeGivenAt` hợp lệ (client chặn khi thiếu), nên không ảnh hưởng. Không thẻ |
| Điều kiện W | `inEarlyHours` = ngày lịch > ngày nghiệp vụ | `calendar > day` (`todayLocal` > `businessDayLocal`) | Khớp |
| `useCheckout` | ngày đi hiệu lực của lượt **≤** ngày lịch (ARC chốt "≤") | `stayEnd <= calendar`; `stayEnd` = max ngày đi của đơn chính và đơn con | Khớp |
| `minNewDepartureDate` | `nd < minCalendarDate` → 409, giá trị = ngày lịch | `newDate < minDeparture` → 409, `minDeparture` = ngày lịch trong W | Khớp. Ngoài W vẫn 422 `DATE_INVALID` như cũ |
| `dryRun` | áp cả tính thử | trước nhánh `dry` | Khớp |
| `serviceDate` dòng phí | `ctx.today` cho `early_departure_fee` (cả phần OTA), và `deposit_forfeit` lúc Trả phòng (`checkout.service.ts` 1346) | `day` (ngày nghiệp vụ) cho 2 dòng phí; `businessDayLocal()` cho `deposit_forfeit` | Khớp |
| `allowedActions.early_departure` | `earlyDepartureOpen` dùng `minCalendarDate` | `today()` = ngày lịch, bằng `minCalendarDate` ở mọi giờ (ngoài W hai ngày trùng nhau) | Khớp (chỉ thêm ghi chú) |

**Vì sao phải gộp sau #114:** máy chủ cũ không gửi `minNewDepartureDate`/`useCheckout`. Khi đó `nightHint` trả `null`, Desk hiện câu chung và không sai tiền. Nhưng máy chủ cũ còn nhận ngày hôm qua (bỏ đêm khách đã ở, DOM 2.2). Lỗi đó do #114 sửa, không phải #142.

### 1.2 Phí: chỉ số của máy chủ

- Lần ghi gửi `expectedFeeVnd: p.earlyDepartureFeeVnd`, `expectedRefundVnd: p.refundVnd ?? 0` của đúng lần tính thử đó (ARC 10.3). Bước ② và ③ hiện `money(...)` của kết quả máy chủ.
- `fee_business_date` dùng `{date}` = `useBusinessDay()`. Hợp đồng không có trường ngày dịch vụ của phí, nên đây là ước tính. Nó đúng khi `useBusinessDay` đúng; DOM-142-02 chỉ ra ca sai (thẻ 142-02 sửa gốc).
- 4xx ở lần ghi luôn qua `act.renewKey()` trước khi rẽ nhánh. Vì vậy lần ghi sau 409 giờ đêm dùng `Idempotency-Key` mới, đúng hợp đồng: 409 nghĩa là chưa ghi gì, lần gửi sau là lệnh mới.

### 1.3 Bước ③ chỉ theo `allowedActions`

- Máy chủ mở `check_out` khi `isCheckoutDay(stayDepartureDate)`: ngày nghiệp vụ = ngày đi, hoặc trong W khi ngày lịch = ngày đi (V5-10). Sau #99 còn có nhánh quá ngày đi (`checkOutOverdueOpen`).
- Ngày rời mới của B16 luôn ≥ mức sàn, nên không bao giờ là ngày quá hạn. Ngày rời muộn hơn hôm nay → không có `check_out` → `later_hint`. Ngày rời hôm nay (kể cả ngày lịch lúc 03:00) → có `check_out` → "Trả phòng ngay".
- So `leaving === today` (mã cũ) là luật ngày thứ hai ở client. Bỏ nó để máy chủ là nguồn duy nhất là đúng hướng ARC. Đột biến M3 đỏ.

### 1.4 Thứ tự gợi ý 409

`nightHint`: `useCheckout === true` → `minNewDepartureDate` (`YYYY-MM-DD`) → `null` (câu chung). Thứ tự này trùng thứ tự kiểm của máy chủ: máy chủ xét `useCheckout` trước và không bao giờ gửi cả hai trường. Mã khác `INVALID_TRANSITION` hoặc 409 không có trường gợi ý → `null`. Đột biến M5 đỏ.

## 2. Test và đột biến

Các đột biến chạy trên tệp test V5-11. Những đột biến sống sót được chạy lại trên cả 5 tệp Trả sớm/Trả phòng (54 ca).

| # | Đột biến | Kết quả |
|---|---|---|
| M1 | Lần ghi gửi `expectedFeeVnd` tự tính (= `refundVnd`) | Đỏ (ca số lạ) |
| M1b | Bước ② hiện phí tự tính | Đỏ |
| M2 | Bỏ `serverMin` khỏi mức sàn | Đỏ |
| M3 | `canCheckOut` thêm `leaving === today` | Đỏ |
| M4 | Đặt sẵn ngày nghiệp vụ | Đỏ (5 ca) |
| M5 | Đảo thứ tự `nightHint` | Đỏ |
| M6 | `minCalendarDay` `<` → `<=` (biên 06:00) | Đỏ |
| M7 | Bỏ `.replace(/^24:/, '00:')` | **Sống** – chỉ ICU cũ in "24:00"; Node của CI không in. Chấp nhận, không thẻ |
| M8 | `stayEnd <= estimate` → `<` | Đỏ |
| M9 | Bỏ `!nightHint(previewError)` khỏi câu lỗi chung | **Sống** – đột biến tương đương ở mọi trạng thái tới được: sau 409, `beforeServerMin` làm `sig = ''`, nên `current` thành `null` trước khi câu chung kịp hiện. Điều kiện để phòng hờ. Không thẻ |
| M10 | Lần ghi: bỏ nhánh `nightHint` (→ lỗi chặn) | Đỏ |
| **M10b** | Lần ghi: chỉ bỏ nhánh `useCheckout` (→ lỗi chặn) | **Sống**. Thẻ 142-01 |
| M11 | `fee_business_date` hiện cả ngoài W ở bước ③ | Đỏ (`v101-early-departure-fea`) |
| M12 | Nút "Trả phòng ngay" luôn hiện ở màn `useCheckout` | Đỏ |
| M13 | Bỏ `onReload` khi vào màn `useCheckout` | Đỏ |
| M14 | Dòng ngày phí dùng ngày lịch | Đỏ |
| M15 | Bỏ `useCheckout \|\|` khỏi `sig` | Sống – tương đương: màn `useCheckout` không còn ô nhập, nên `sig` không đổi và không có lần tính thử mới |
| M16 | Mock: `stayEnd <= calendar` → `<` | **Sống** – mock trả 409 `minNewDepartureDate` thay vì `useCheckout`, nhưng ca test vẫn qua vì điều kiện ở Desk che mất. Cùng gốc thẻ 142-01 |
| M17 | Mock: phí `serviceDate` = ngày rời mới | Đỏ |
| M18 | Tính thử: bỏ `applyHint` | Đỏ |
| M19 | Lần ghi 409: bỏ đưa focus về ô ngày | Đỏ |
| M20 | Bỏ điều kiện `useCheckout` ở Desk (chỉ còn theo máy chủ) | Đỏ |

Ba ca probe tạm (không commit):

- **P1 – đồng hồ quầy chậm hơn máy chủ ở 06:00.**
  - Dựng: Me trả `businessDate` = D (máy chủ đã qua 06:00), máy quầy 05:59:58 ngày D; Trần Thu Nga đi D+2.
  - Lúc mở hộp: `min` = **D+1**, ô đặt sẵn D+1. Máy chủ ngoài W nhận D.
  - Sau khi máy quầy qua 06:00:01 và hẹn giờ đổi ngày chạy: `min` vẫn **D+1**; gõ D → `aria-invalid`, không có request.
  - Kết luận: cách tính W của #142 (DOM-142-01, thẻ 142-03) cộng thêm lỗi neo ngày có từ R3. Sau mốc, `useBusinessDay` thành D+1 cho tới lần đọc lại Me sau (thẻ 142-02).
- **P2 – ca 10 "409 `useCheckout` ở lần ghi" có gửi lệnh ghi không.** Có, 1 lệnh ghi (`dryRun=false`, ngày Y). Nhưng màn `useCheckout` hiện ra nhờ điều kiện ở Desk sau khi giờ đổi, không nhờ nhánh `onWriteError`. Vì vậy M10b sống.
- **P3:** M9 trên trạng thái thật: câu chung không hiện (xem M9).

## 3. Quy tắc kỹ thuật ARC chốt cho bản sửa UXD-142-01 / DOM-142-01

UXD-142-01 (Major) và DOM-142-01 cùng chạm một chỗ mã: mức sàn và cờ W. ARC chốt công thức để bản sửa làm một lần (thẻ 142-03):

1. **Mức sàn = đúng hàm của máy chủ:** `minCalendarDay(businessDay, tz, now) = max(businessDay, todayLocal(tz, now))`.
   - Đây là `minCalendarDate` của `shared/business-day.ts`: ngày lịch nếu ngày lịch > ngày nghiệp vụ, ngược lại ngày nghiệp vụ.
   - Không cần `rollover` hay cách sửa "24:00" của ICU.
   - Ở P1, lúc mở hộp, công thức này cho D, đúng máy chủ. Khi `useBusinessDay` chậm một ngày (DOM-142-02), mức sàn vẫn đúng nhờ ngày lịch. Khi `useBusinessDay` nhanh một ngày (P1 sau mốc 06:00, thẻ 142-02 (b)), không công thức nào ở client cứu được; phải sửa gốc ở 142-02.
2. **Cờ W (dòng `fee_business_date`)** = giờ máy quầy < `businessDayRollover` **và** ngày nghiệp vụ < ngày lịch, như DOM-142-01 và UXD 9.13. Hai điều kiện, để dòng phụ không hiện khi `useBusinessDay` còn chậm ngày lúc sau 06:00.
3. **Client không bao giờ là bên duy nhất từ chối một ngày máy chủ nhận** (DOM 3.3 (4)).
   - Ngày nhỏ hơn mức sàn của Desk vẫn là lỗi ở client, như UXD-142-01 cách 1: câu `err.min_date` + "Dùng {mức sàn}".
   - Khi `useBusinessDay` đúng, mức sàn ở (1) chỉ cao hơn máy chủ lúc đồng hồ quầy nhanh hơn máy chủ ở đúng nửa đêm, và chỉ trong khoảng lệch đó (vài giây).
   - Ngày của 409 vẫn thắng (`serverMin ?? estimate`).
4. **Sau 00:00 ở bước ②:** về bước ①, bỏ tick, focus ô ngày, như UXD-142-01 (2). Không giữ số tính lúc trước 00:00 để xác nhận. Máy chủ cũng sẽ trả `AMOUNT_CHANGED` hoặc 409, nhưng Desk không chờ tới đó.

## 4. Thẻ

### FB-R5-ARC-FE-142-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/__tests__/v5-11-early-departure-night-fea.test.tsx` ca "409 useCheckout on the write" (`expect(cap.writes().length).toBeLessThanOrEqual(1)`); `pages/stay/EarlyDepartureDialog.tsx` nhánh `else if (nightHint(e))` của lần ghi @ `52a14957`.
- Vấn đề:
  - Đột biến M10b (409 `useCheckout` ở lần ghi → lỗi chặn `setFatal`) để mọi test qua. Đột biến M16 (mock trả 409 khác) cũng vậy.
  - Probe P2: ca test có gửi 1 lệnh ghi, nhưng sau khi đồng hồ giả sang 03:00, điều kiện ở Desk (`night && stayEnd <= estimate`) tự bật màn `useCheckout`. Nhánh `onWriteError` không được kiểm.
  - `toBeLessThanOrEqual(1)` qua cả khi không có lệnh ghi nào.
- Vì sao quan trọng: nhánh này chỉ có tác dụng đúng khi Desk **không** tự biết, tức máy chủ đã ở W còn Desk chưa (đồng hồ quầy chậm, hoặc ngày đi của lượt đổi sau khi mở hộp). Đó chính là ca không test được bằng tay. Lần sửa sau đổi thứ tự nhánh có thể biến nó thành lỗi chặn "Có lỗi, tải lại" mà CI không báo.
- Đề xuất sửa (chỉ test):
  - Giữ đồng hồ quầy ở 23:58 ngày Y (Desk ngoài W).
  - Sang bước ②, `mockControl.failNext(/early-departure:POST/, 409, { code: 'INVALID_TRANSITION', currentState: 'in_house', useCheckout: true })` cho lần ghi, rồi bấm Xác nhận.
  - Kỳ vọng: đúng 1 lệnh ghi (`toHaveLength(1)`); màn `use_checkout` có alert nhận focus; không có lỗi chặn; đơn được đọc lại một lần.
  - Làm cùng bản sửa UXD-142-01.
- Trạng thái: Open

### FB-R5-ARC-FE-142-02
- Mức độ: Minor (lỗi có từ R3, không do #142; không chặn gộp)
- Vị trí: `product/apps/admin-web/src/app/businessDay.ts` (`anchor` = `useMemo` trong từng component; `crossed = daysBetween(anchor.estimate, estimate)`; hẹn giờ ở mốc đổi ngày chỉ `setTick`, không đọc lại Me).
- Vấn đề: ngày nghiệp vụ trên Desk lệch một ngày, kéo dài tới lần đọc lại Me sau. Hai cơ chế cùng gốc "ước tính của máy và ngày máy chủ được chụp ở hai thời điểm khác nhau":
  - (a) DOM-142-02 đã tái hiện: component mở sau 06:00, Me đọc trước 06:00 → **chậm** 1 ngày.
  - (b) ARC probe P1: Me đọc trong khoảng đồng hồ quầy chậm hơn máy chủ ở quanh 06:00 (Me nói D, máy quầy còn 05:59) → khi máy quầy qua 06:00, `crossed` = 1 → **nhanh** 1 ngày (D+1) cho tới lần đọc Me sau. Đồng hồ quầy nhanh hơn thì ngược lại.
  - Desk đọc lại Me khi đăng nhập, ở vài trang tài khoản, và khi tab hiện lại (tối đa 1 lần/phút). Tab Desk mở suốt ca đêm không đọc lại. Giờ giao ca 06:00 lại là lúc đăng nhập nhiều nhất.
- Vì sao quan trọng:
  - Mọi form dùng `useBusinessDay` (mức sàn ngày, ngày đặt sẵn, "hôm nay") lệch theo.
  - Máy chủ kiểm lại mọi ngày, nên phần lớn chỉ thành 422 khó hiểu. Riêng ngày đặt sẵn mà vẫn hợp lệ (ví dụ ngày đến của đơn mới = "hôm nay" sai) có thể được ghi nếu lễ tân không để ý.
- Đề xuất sửa (FE, PR riêng được; QA ghi bug P2 như DOM-142-02 đã đề nghị):
  1. Chụp mốc **một lần, lúc câu trả lời Me về**, trong `SessionProvider`: `{ serverDay: businessDate, deviceDay: businessDayLocal(tz, now, rollover), at: Date.now() }`. `useBusinessDay` chỉ đọc mốc đó, không `useMemo` riêng.
  2. Ở hẹn giờ mốc đổi ngày đã có: sau `setTick`, gọi `refresh()` trễ 2 phút (vượt độ lệch đồng hồ thường gặp), và khi mốc chụp có `serverDay ≠ deviceDay` thì đọc lại Me sau 2 phút. Như vậy mỗi ngày Desk tự neo lại một lần ngay sau 06:00.
  3. Thêm 2 ca test: component mở sau 06:00 với Me đọc trước 06:00; và ca P1 (Me nói D lúc máy quầy 05:59:58 → sau 06:00 vẫn là D).
  4. Không đổi hợp đồng. ARC không thêm ngày dịch vụ của phí vào `EarlyDepartureResult` (phương án (b) của DOM-142-02), vì sửa gốc thì `fee_business_date` đúng, và mọi form khác cũng cần bản sửa này.
- Trạng thái: Open

### FB-R5-ARC-FE-142-03
- Mức độ: Minor (làm cùng bản sửa UXD-142-01, cùng chỗ mã)
- Vị trí: `product/apps/admin-web/src/app/dates.ts` `minCalendarDay`; `pages/stay/EarlyDepartureDialog.tsx` (`estimate`, `night`) @ `52a14957`.
- Vấn đề:
  - `minCalendarDay` xác định W bằng giờ máy quầy rồi lấy ngày nghiệp vụ + 1. Nó chỉ trùng `minCalendarDate` của máy chủ khi đồng hồ quầy khớp máy chủ.
  - Tài liệu trong mã nói "cùng luật với `minCalendarDate`", nhưng đây là một luật khác.
  - Probe P1: Desk ra D+1, máy chủ nhận D. Desk chặn ở client nên 409 không bao giờ về. Đây là DOM-142-01, nhìn từ phía kỹ thuật.
  - Ca test `minCalendarDay('2026-10-20', …, 04:30 ngày 21/10, '04:00')` dùng đầu vào không thể có (lúc 04:30 với mốc 04:00 thì ngày nghiệp vụ đã là 21/10).
- Vì sao quan trọng: bản sửa UXD-142-01 sẽ hiện "Dùng {mức sàn}" từ chính hàm này. Hàm sai thì Desk bảo lễ tân chọn một ngày muộn hơn, và khách bị giữ một đêm không ở (DOM 3.3 (4)).
- Đề xuất sửa: theo mục 3:
  - `minCalendarDay = max(businessDay, todayLocal(tz, now))`;
  - `night` = giờ < rollover **và** ngày nghiệp vụ < ngày lịch;
  - đổi ca test 04:00 thành đầu vào nhất quán;
  - thêm ca P1 (ngày nghiệp vụ D, máy quầy 05:59 ngày D → mức sàn D, không có dòng `fee_business_date`).
- Trạng thái: Open

## 5. Điểm làm tốt

- Desk chỉ có một nguồn sự thật cho tiền và cho nút Trả phòng: số của lần tính thử, `allowedActions` của máy chủ. Ca "số lạ 1.234.000 / 456.000" là cách test đúng để chứng minh điều này.
- Mock bám sát #114 tới thứ tự kiểm, dấu "≤" và `serviceDate` của cả `deposit_forfeit`, nên test Desk đo đúng hành vi máy chủ sẽ có.
- FE theo hợp đồng thay vì lời giao sai, và ghi rõ chỗ lệch trong thân PR và báo cáo.

## 6. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-07 | 5 | ARC – review kỹ thuật FE PR #142 (V5-11 Desk) @ 52a14957: DUYỆT CÓ ĐIỀU KIỆN (0 Blocker/Major của ARC). Đúng #114 và 0.3.13: mock giữ thứ tự kiểm, 409 useCheckout khi ngày đi ≤ ngày lịch, 409 minNewDepartureDate = ngày lịch, serviceDate phí và deposit_forfeit = ngày nghiệp vụ; Desk không tự tính phí (M1/M1b đỏ); bước ③ chỉ theo allowedActions check_out; đặt sẵn ngày lịch trong W là đúng hợp đồng (lời giao "ngày nghiệp vụ" nhầm). Điều kiện: gộp sau #114; sửa UXD-142-01 (Major) theo quy tắc ARC – mức sàn = max(ngày nghiệp vụ, ngày lịch) đúng minCalendarDate của máy chủ, cờ W = giờ < rollover và ngày nghiệp vụ < ngày lịch, client không là bên duy nhất từ chối ngày máy chủ nhận; CI xanh. Thẻ: 142-01 Minor (test nhánh 409 useCheckout ở lần ghi, M10b sống), 142-02 Minor (useBusinessDay neo mốc lúc Me về và đọc lại Me sau mốc 06:00; lỗi từ R3, không đổi hợp đồng, không thêm ngày phí vào EarlyDepartureResult), 142-03 Minor (minCalendarDay theo công thức máy chủ) | ARC | rounds/round-05/reviews/ARC-on-fe-pr-142.md |`
