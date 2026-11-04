# ARC – BUG-R4-050: quy tắc chọn ngày cho giờ trả phòng sau 24:00 (quyết định nhanh)

- Người viết: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Câu hỏi của ORC: ba câu sau có đúng không?
  - Quy tắc DOM: giờ gõ trước 06:00 thì chọn thời điểm muộn nhất không muộn hơn lúc bấm, trong khoảng 00:00 ngày đi tới 06:00 hôm sau. Giữ ca #68.
  - Cách của QA (`createVietQr` nhận `checkoutTime`) có tốt hơn không?
  - Có cần chặn ghi lùi giờ qua API không?
- Đọc:
  - `bug-list-v1.0.4.md` BUG-R4-050 và BUG-R4-036;
  - TC-V104-CO-05 và TC-V104-RG-31;
  - BR-421 v0.5.7 (đơn quá ngày đi);
  - trên `main` @ `585cf0ba`: `checkout.service.ts` (`postMidnight`, `departure`, `amountDueForQr`, B18), `stay-support.ts` (`checkTypedTime`), `stay-rules.ts` (`businessMinutes`), `stay.service.ts` (`lateQuote`), `CheckOutPage.tsx` (dòng 171, 509, 612, 939, 1788), `app/businessDay.ts`.
- ARC chạy **một ca dò** HTTP trên PostgreSQL thật, đồng hồ giả, `main` @ `585cf0ba`. Worktree và container đã xóa, ca dò không commit.

## Kết luận

1. **Quy tắc DOM chưa đúng, khi B18 vẫn chỉ gửi `checkoutTime`.**
   - Máy chủ đọc `checkoutTime` theo trục ngày nghiệp vụ của **lúc bấm**, ở bản tóm tắt cũng như ở B18.
   - Quy tắc DOM lệch với cách đọc đó ở hai mép: ca #68 (gõ 04:30 lúc 06:10 ngày đi), và ca gõ sớm hơn vài phút qua nửa đêm (gõ 00:05 lúc 23:55 ngày đi).
   - Ở hai mép này, VietQR sẽ tính theo cửa sổ sau nửa đêm (0 đ), còn bản tóm tắt và B18 đòi đêm thêm. Đó là chính lỗi BUG-R4-050, chỉ đảo chiều.
   - **Cho v1.0.4, Desk dựng thời điểm đúng như máy chủ đọc `checkoutTime`** (quy tắc ở mục 1). Quy tắc này phủ mọi ca của BUG-R4-050.
2. **Ca #68 hiện đã hỏng trên Desk. Lỗi này không do BUG-R4-050 và không giữ được nếu B18 chỉ gửi `checkoutTime`.**
   - Ca dò: gõ 04:30 lúc 06:10 ngày đi thì bản tóm tắt ra `extraNightRequired: true`, còn B18 trả 422 `TIME_AFTER_ACTION` + `LATE_CHECKOUT_AFTER_LIMIT`.
   - Gửi `checkoutAt` = 04:30 ngày đi kèm ghi chú thì B18 trả 200, không phụ thu.
   - Vì vậy cách làm tạm của BUG-R4-036 trong sổ tay (CO-05) **sai**. Sổ tay phải đổi trước khi phát hành (mục 2).
3. **Cách của QA**: kết quả giống hệt quy tắc mục 1, nhưng đổi hợp đồng. Không làm ở v1.0.4. Hướng cho v1.0.5 là Desk gửi **một** `checkoutAt` cho cả bản tóm tắt, VietQR và B18. Hướng này sửa luôn ca #68 và không cần thêm `checkoutTime` vào `createVietQr` (mục 3).
4. **Ghi lùi giờ qua API**: đồng ý dời v1.0.5. Đề xuất ở mục 4.

## 1. Quy tắc cho FE (v1.0.4, chỉ sửa FE, thay hai chỗ dựng chuỗi ở dòng 509 và 1788)

Máy chủ đọc `checkoutTime` như sau:
- `checkTypedTime` và `lateQuote` dùng `businessMinutes`, tức trục ngày nghiệp vụ của đồng hồ máy chủ.
- Trong cửa sổ sau nửa đêm, máy chủ lấy `postMidnight` theo **lúc bấm**.

Desk dựng thời điểm theo đúng cách đó:

```
checkoutInstant(hhmm, businessDay, rollover, stayDeparture):
  // businessDay = useBusinessDay() lúc gọi lệnh; rollover = property.businessDayRollover (không viết cứng 06:00)
  day     = hhmm < rollover ? addDays(businessDay, 1) : businessDay
  instant = `${day}T${hhmm}:00+07:00`
  // ngoài khoảng máy chủ nhận cho checkoutAt → bỏ trống, máy chủ dùng đồng hồ của nó (cùng kết quả với B18)
  if instant < `${stayDeparture}T00:00:00+07:00` or instant >= `${addDays(stayDeparture,1)}T${rollover}:00+07:00`:
    return undefined
  return instant
```

- Dùng cùng một hàm cho lệnh dò giá và cho `PaymentPanel` (VietQR).
- B18 vẫn gửi `checkoutTime`, không gửi thời điểm này.
- Biên dưới dùng `stayDepartureDate ?? departureDate`, như dòng 612, để đơn có đơn con gia hạn cũng đúng.
- Hàm không còn dựa vào ngày đi để chọn ngày. Đây đúng là chỗ sai của mã cũ.

**Ca unit** (D = ngày đến, ngày đi D+1, mốc đổi ngày 06:00):

| Giờ gõ | Lúc bấm | Ngày nghiệp vụ | Thời điểm | Ghi chú |
|---|---|---|---|---|
| 00:20 | D+2 00:20 | D+1 | `D+2T00:20` | BUG-R4-050 (a), (b) |
| 23:50 | D+2 00:20 | D+1 | `D+1T23:50` | |
| 00:05 | D+1 23:55 | D+1 | `D+2T00:05` | gõ trước giờ thật trong dung sai; quy tắc DOM ra `D+1T00:05`, sai |
| 00:25 | D+2 00:20 | D+1 | `D+2T00:25` | ca FE hỏi (mục 5); quy tắc DOM ra `D+1T00:25`, sớm 24 giờ |
| 01:00 | D+1 01:00 | D (cửa sổ) | `D+1T01:00` | cửa sổ sau nửa đêm, phải giữ D+1 |
| 07:00 | D+1 04:30 | D (cửa sổ) | bỏ trống | ngoài khoảng máy chủ nhận |
| 11:00 | D+1 11:05 | D+1 | `D+1T11:00` | ban ngày |
| 04:30 | D+1 06:10 | D+1 | `D+2T04:30` | đúng như B18 đọc. **Đổi mong đợi** của ca "04:30 lúc 06:10" trong BUG-R4-050 (đề xuất cũ là D+1). Đây là ca #68, xem mục 2 |
| 05:30, mốc 05:00 | D+1 05:40 | D+1 | `D+1T05:30` | mốc đổi ngày đọc từ tham số |

**Đơn quá ngày đi nhiều ngày:**
- B18 và VietQR chỉ chạy khi ngày đi = ngày nghiệp vụ hoặc đang trong cửa sổ. Lệch thì 409 `INVALID_TRANSITION`, ở `amountDueForQr` lẫn B18.
- Theo BR-421 v0.5.7, Desk đi Gia hạn (B13) tới hôm nay trước, rồi mới mở Trả phòng. Khi đó ngày đi mới = ngày nghiệp vụ.
- Quy tắc trên dùng ngày nghiệp vụ và ngày đi của cả lượt, nên không có mép riêng cho ca này.

## 2. Phát hiện: cách làm tạm của BUG-R4-036 (CO-05) không chạy trên Desk

Ca dò (`main` @ `585cf0ba`): đơn Trực tiếp căn 301, 10–11/01/2027, đã trả đủ, nhận phòng 10/01 15:00. Đồng hồ 11/01 06:10:

| Lệnh | Kết quả |
|---|---|
| `GET checkout-summary?checkoutTime=04:30` | `postMidnightWindow: false`, `extraNightRequired: true`, phụ thu 0 |
| B18 `{ checkoutTime: "04:30", checkoutTimeNote }` (đúng thân Desk gửi) | **422**: `checkoutTime TIME_AFTER_ACTION`, `extraNight LATE_CHECKOUT_AFTER_LIMIT` |
| B18 `{ checkoutTime: "04:30", checkoutAt: "2027-01-11T04:30+07:00", checkoutTimeNote }` | **200**, không phụ thu, không đêm thêm |

Vì sao: `businessMinutes("04:30", "06:00")` = 1710 phút, còn lúc bấm (06:10) = 10 phút. Như vậy 04:30 bị đọc là **04:30 sáng hôm sau**, sau giờ bấm 22 giờ 20 phút (dung sai 30 phút).

Ca CO-05 mong đợi "B18 200, `checkoutAt` = 04:30", nhưng Desk không bao giờ gửi `checkoutAt` cho B18. Sổ tay đang dạy lễ tân gõ 04:30. Khi làm vậy, lễ tân sẽ thấy hộp đêm thêm rồi bị báo giờ sai.

Ca này không sai tiền, vì B18 từ chối. Nhưng lễ tân bị kẹt lúc sáng. Theo điều kiện ghi ở BUG-R4-036 ("CO-05 đỏ thì nâng P1"), QA cần ghi hoặc nâng mức.

**Đề nghị cho v1.0.4 (DOM/BA sửa sổ tay, ORC chốt):**
- Cách làm tạm đúng: từ 06:00, Trả phòng với **giờ Desk điền sẵn** (giờ hiện tại).
- Không gõ giờ trước 06:00.
- Trước 12:00 thì không có phụ thu, nên tiền đúng.
- Giờ khách rời thật ghi vào sổ giao ca.
- CO-05 đổi mong đợi cho khớp.

**Sửa thật (đề nghị v1.0.5; v1.0.4 chỉ khi PO muốn): không đổi hợp đồng.**
- Bản tóm tắt và B18 đã nhận `checkoutAt` (E05-09).
- Desk tính **một** thời điểm, gửi `checkoutAt` cho cả bản tóm tắt, VietQR và B18 (vẫn kèm `checkoutTime`).
- Quy tắc lúc đó: trong khoảng `[ngày đi 00:00, ngày đi+1 mốc đổi ngày)`, chọn thời điểm có giờ gõ, **muộn nhất mà không muộn hơn lúc bấm + `manual_time_tolerance_minutes`**. Đây là quy tắc DOM cộng thêm dung sai.
- Kết quả: 04:30 lúc 06:10 → 04:30 ngày đi, có ghi chú; 00:05 lúc 23:55 → 00:05 hôm sau.
- Quy tắc DOM chỉ đúng khi cả ba lệnh dùng chung thời điểm này.

## 3. Cách của QA: `createVietQr` nhận `checkoutTime`
- Kết quả **giống hệt** quy tắc mục 1, vì máy chủ đọc `checkoutTime` theo đồng hồ của nó. Desk bớt được một hàm tính ngày, không sợ lệch với máy chủ.
- Nhưng cách này đổi hợp đồng:
  - thêm trường tùy chọn (được phép ở 0.3.x);
  - kèm BE, sinh lại client, test.
  - Không làm ở v1.0.4. Đồng ý với ORC: v1.0.4 chỉ sửa FE.
- v1.0.5 ARC **không** chọn hướng này. Hướng v1.0.5 là một `checkoutAt` cho cả ba lệnh (mục 2): sửa luôn ca #68, và nhật ký có thời điểm chính xác. `createVietQr` vốn đã nhận `checkoutAt`.

## 4. Ghi lùi giờ qua API (`checkoutAt` + ghi chú) – v1.0.5

Hiện tại:
- Máy chủ chỉ nhận `checkoutAt` trong `[ngày đi 00:00, ngày đi+1 mốc đổi ngày)`, nên lùi được tối đa khoảng 30 giờ.
- Lùi quá dung sai thì phải có ghi chú.
- Nhưng FD lùi vào cửa sổ sau nửa đêm thì bỏ được đêm thêm hay phụ thu. Đây là ca API QA đã thấy: 200, không đêm thêm.

Đề xuất v1.0.5 (DOM chốt nghiệp vụ, SEC rà; không phải câu hỏi cho chủ đầu tư):
- `checkoutAt` sớm hơn đồng hồ máy chủ quá dung sai **và** làm giảm số phải thu so với lúc bấm (mất phụ thu hoặc đêm thêm):
  - chỉ FDL trở lên; FD gửi yêu cầu duyệt hoặc nhận 403;
  - ghi audit `checkout.backdated` kèm hai số tiền;
  - hiện ở "Cần chú ý" và báo cáo ngày.
- Có thể thêm trần `checkout_backdate_max_hours`. Gợi ý 8 giờ, đủ cho ca 04:30 → trước 12:00; DOM chọn số.
- v1.0.4 không đổi: Desk không gửi `checkoutAt` cho B18.

## Việc cho từng vai
- **FE-A** (`v104/fe-checkout-after-midnight`): làm quy tắc mục 1 cùng 8 ca unit. Không gửi thời điểm này cho B18.
- **QA:** đổi mong đợi ca "04:30 lúc 06:10" của BUG-R4-050 và RG-31 (d) theo mục 1. Ghi phát hiện mục 2 (CO-05 đỏ theo ca dò) thành lỗi mới hoặc nâng BUG-R4-036, theo điều kiện đã ghi.
- **DOM/BA:** sửa cách làm tạm trong sổ tay và release notes (mục 2).
- **ARC:** câu mô tả `CheckoutSummary.postMidnightWindow` / `checkoutTime` ghi rõ "theo trục ngày nghiệp vụ của đồng hồ máy chủ" ở gói hợp đồng 0.3.13.

## 5. Ca FE hỏi: gõ 00:25 lúc 00:20 (sau nửa đêm, gõ sớm hơn giờ thật vài phút)
- Theo quy tắc DOM ("muộn nhất không muộn hơn lúc bấm"), 00:25 hôm sau còn ở tương lai nên bị loại, và hàm chọn 00:25 ngày đi. Kết quả sớm 24 giờ, đúng như FE thấy.
- Theo quy tắc mục 1, lúc bấm 00:20 thuộc ngày nghiệp vụ D+1 (ngày đi), và 00:25 < mốc đổi ngày, nên ra `D+2T00:25`.
  - Thời điểm này trùng với cách B18 đọc `checkoutTime: "00:25"`.
  - Lệch 5 phút nằm trong dung sai 30 phút, nên B18 nhận.
- Quy tắc mục 1 không xét `now` để chọn ngày, chỉ xét ngày nghiệp vụ. Nhờ vậy gõ sớm hơn vài phút không bao giờ nhảy ngày.
- Nhảy ngày chỉ xảy ra ở mốc đổi ngày (06:00), và B18 cũng đổi trục đúng lúc đó.
- **Quy tắc giữ như mục 1, không cần đổi thêm.** Ca 00:25 lúc 00:20 đã có trong bảng mục 1.

## 6. Review PR #86 `v104/fe-checkout-after-midnight` @ `9010e65f` (base `main` `585cf0ba`)

Đọc `git diff 585cf0ba 9010e65f`, 3 tệp:
- `app/dates.ts`: hàm `checkoutInstant`;
- `CheckOutPage.tsx`: 2 chỗ gọi;
- `bug-r4-050-fea.test.tsx`: 6 ca unit và 1 ca trang.

ARC không chạy test của PR, vì quy tắc phải đổi trước.

### Phán quyết: **KHÔNG ĐẠT** ở `9010e65f`. Một thẻ Major, sửa nhỏ; ARC rà lại nhanh khi có head mới.

Phần đúng, giữ nguyên:
- Hàm thuần, hai chỗ dùng chung.
- B18 không đổi, vẫn chỉ `checkoutTime`.
- Mốc đổi ngày đọc từ `property.businessDayRollover`, không viết cứng.
- Không có khóa chữ mới.
- Ca trang khẳng định VietQR gửi `checkoutAt` = 00:20 hôm nay và không có B18.

### FB-R4-ARC-FE-PR86-01
- Mức độ: Major
- Vị trí: `app/dates.ts` `checkoutInstant`; `CheckOutPage.tsx` dòng 511 và 1788; `bug-r4-050-fea.test.tsx`.
- Vấn đề: hàm làm theo quy tắc DOM ("muộn nhất ≤ `now`", lấy ngày đi của đơn), nên lệch với cách máy chủ đọc `checkoutTime` ở ba ca:
  - **00:25 lúc 00:20** (ca FE hỏi) → `D+1T00:25`, sớm 24 giờ. VietQR bị trần 0 đ, lặp lại đúng BUG-R4-050.
  - **00:05 lúc 23:55 ngày đi** → `D+1T00:05`, cùng lỗi như trên.
  - **04:30 lúc 06:10 ngày đi** → `D+1T04:30`. VietQR tính theo cửa sổ sau nửa đêm (0 đ), trong khi bản tóm tắt ở bước 2 ra `extraNightRequired: true` và B18 trả 422 (ca dò mục 2). Desk sẽ hiện hai số khác nhau cho cùng một giờ.
- Thêm một lỗi đã có từ trước: hàm lấy `r.departureDate`, không lấy `r.stayDepartureDate`.
  - Với lượt có đơn con gia hạn (OTA kéo dài bằng đơn con Trực tiếp), máy chủ tính theo ngày đi của cả lượt.
  - `checkoutAt` theo ngày đi của đơn gốc sẽ ra ngoài khoảng máy chủ nhận, nên 422 `checkoutAt DATE_INVALID`.
  - Mã cũ cũng sai chỗ này. PR nên sửa luôn, vì cùng một hàm.
- Vì sao quan trọng: số trên VietQR phải bằng số B18 sẽ đòi. Bất kỳ ca nào hai số lệch nhau đều làm lễ tân kẹt ở bước Bill.
- Đề xuất sửa (đúng mục 1):

```ts
/** BUG-R4-050 (ARC-on-v104-bug050-rule.md): `hhmm` on the business-day axis B18 reads `checkoutTime` on. */
export function checkoutInstant(
  hhmm: string,
  businessDay: string, // useBusinessDay() – the business day of the click
  stayDeparture: string, // r.stayDepartureDate ?? r.departureDate
  rollover = DEFAULT_ROLLOVER,
  offset = '+07:00',
): string | undefined {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return undefined;
  const R = rollover.slice(0, 5);
  const day = hhmm < R ? shiftDay(businessDay, 1) : businessDay;
  const iso = `${day}T${hhmm}:00${offset}`;
  const t = Date.parse(iso);
  const from = Date.parse(`${stayDeparture}T00:00:00${offset}`);
  const to = Date.parse(`${shiftDay(stayDeparture, 1)}T${R}:00${offset}`);
  return t >= from && t < to ? iso : undefined; // outside what the server takes → its clock, as B18
}
```

  - Hai chỗ gọi: `checkoutInstant(hhmm, today, r.stayDepartureDate ?? r.departureDate, rollover)`, với `today` = `useBusinessDay()` mà trang đã có (dòng 171).
  - Thêm `today` vào danh sách phụ thuộc của `useEffect` dò giá.
  - `PaymentPanel` tính lại khi `today` đổi lúc 06:00, vì `useBusinessDay` có hẹn giờ theo mốc đổi ngày. Không cần `new Date()` lúc vẽ.
- Ca unit (D = ngày đi, D1 = D + 1; cột ngày nghiệp vụ là giá trị truyền vào):

| Ca | Gọi | Mong đợi | So với `9010e65f` |
|---|---|---|---|
| U1 | `('00:20', D, D)` (lúc D1 00:20) | `D1T00:20` | như cũ |
| U2 | `('23:50', D, D)` (lúc D1 00:20) | `DT23:50` | như cũ |
| U3 | `('00:25', D, D)` (lúc D1 00:20) | `D1T00:25` | **mới** (ca FE hỏi) |
| U4 | `('00:05', D, D)` (lúc D 23:55) | `D1T00:05` | **mới** |
| U5 | `('04:30', D, D)` (lúc D 06:10) | `D1T04:30` | **đổi** (cũ: `DT04:30`). Ghi chú: B18 đọc như vậy; ca #68 xem mục 2 |
| U6 | `('01:00', D−1, D)` (lúc D 01:00, cửa sổ) | `DT01:00` | như cũ |
| U7 | `('04:30', D−1, D)` (lúc D 03:00, cửa sổ) | `DT04:30` | như cũ |
| U8 | `('07:00', D−1, D)` (lúc D 04:30, cửa sổ) | `undefined` | **mới** |
| U9 | `('06:00', D, D)` và `('11:00', D, D)`, `('19:30', D, D)` | `DT06:00`, `DT11:00`, `DT19:30` | như cũ |
| U10 | `('05:30', D, D, '05:00')` / `('05:30', D, D)` | `DT05:30` / `D1T05:30` | **đổi** (mốc đổi ngày đọc từ tham số) |
| U11 | `('11:00', D1, D1)` – lượt có đơn con gia hạn, `r.departureDate = D`, `stayDepartureDate = D1` | `D1T11:00` | **mới** |
| U12 | `''`, `'4:30'` | `undefined` | như cũ |

  - Ca trang của PR giữ nguyên mong đợi: 00:20 lúc 00:20 thì `checkoutAt` = `today T00:20`.
  - Nên thêm một ca trang U3: gõ `00:25` lúc 00:20, VietQR gửi `today T00:25`.
- Trạng thái: Open

### Ghi nhận khác
- Chú thích trong `dates.ts` và đầu tệp test đang tả quy tắc DOM và câu "04:30 lúc 06:10 → ngày đi (PR #68)". Phải sửa theo mục 1. Ghi rõ ca #68 không giữ được khi B18 chỉ gửi `checkoutTime` (mục 2).
- Sau khi sửa, ARC chạy lại `bug-r4-050-fea` và các test trả phòng, rồi rà nhanh trong tệp này.

## Dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | BUG-R4-050 v1.0.4 chỉ sửa FE: thời điểm cho dò giá/VietQR = giờ gõ trên trục ngày nghiệp vụ của lúc bấm (`hhmm < rollover` → ngày nghiệp vụ + 1), bỏ trống khi ngoài `[ngày đi 00:00, ngày đi+1 mốc)`; B18 giữ `checkoutTime`. Quy tắc DOM (muộn nhất ≤ lúc bấm, + dung sai) dùng ở v1.0.5 khi Desk gửi một `checkoutAt` cho cả ba lệnh. `createVietQr` không thêm `checkoutTime`. Ghi lùi giờ qua API: v1.0.5 | ARC | Máy chủ đọc `checkoutTime` theo trục ngày nghiệp vụ; quy tắc DOM lệch ở ca 04:30 lúc 06:10 và 00:05 lúc 23:55. Ca dò: Desk gõ 04:30 lúc 06:10 → B18 422 `TIME_AFTER_ACTION`, với `checkoutAt` → 200, nên cách làm tạm BUG-R4-036 phải đổi |
| 2026-11-05 | 4 | #86 @ `9010e65f` KHÔNG ĐẠT (FB-R4-ARC-FE-PR86-01 Major): `checkoutInstant` theo ngày nghiệp vụ của lúc bấm, biên theo `stayDepartureDate`, 12 ca unit theo mục 6; ca "gõ 00:25 lúc 00:20" ra `D+1T00:25` theo đúng quy tắc này, không cần quy tắc riêng | ARC | Hàm ở `9010e65f` theo "muộn nhất ≤ now" nên sớm 24 giờ khi gõ trước giờ thật qua nửa đêm, và lệch với bản tóm tắt/B18 ở ca 04:30 lúc 06:10 |
