# ARC review – PR #75 BUG-R4-041: khóa "Giữ chỗ" khi có giá đã gõ ở H09 (FE-B)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review chéo** | 05/11/2026
- Đối tượng: `v104/fe-hold-typed-rate-lock`.
  - Lượt 1: head `9c277c7a` (đã gộp `main` `d0ea6dc2`, có #70).
  - Lượt 2: head `e71ab25f`, thêm một commit sửa thẻ UXD PR75-01/02/03 (chữ, `aria-disabled`, thứ tự footer). **Phán quyết dưới đây là cho `e71ab25f`.**
- Tệp trong PR:
  - `apps/admin-web/src/pages/booking/BookingDialog.tsx`;
  - test mới `apps/admin-web/src/__tests__/v104-hold-typed-rate-lock.test.tsx` (lượt 1: 5 ca; lượt 2: 6 ca);
  - khóa `booking.hold.typed_rate_locked` ở `gen_strings.py`, `strings-vi.json`, `strings-en.json`, `strings-tables.md`, `strings.js`.
- Đọc kèm:
  - máy chủ: `services/api/src/modules/sales/internal/quotes.controller.ts` (`saveQuote`, `createHoldFromQuote`), `quotes.service.ts` `createHold` (dòng 523–603), `platform/public/validation.ts` (`parseBody`);
  - hợp đồng: `openapi.yaml` `QuoteInput` (khoảng dòng 12006);
  - client: `packages/ui/src/Button.tsx`, `Modal.tsx`, phím tắt ở `AppShell.tsx` và `RackPage.tsx`, `pages/quotes/QuoteDialog.tsx`;
  - `UXD-on-v104-pr75-hold-lock.md`; thẻ ARC-05 và mục "DOM trả lời ARC-03/UXD-05" ở `ARC-on-v104-pr70-rate-carryover.md`.
- ARC tự chạy trong worktree tạm ở scratchpad, đã xóa khi xong. Chỉ chạy hai tệp `v104-hold-typed-rate-lock` và `v104-booking-rate-carryover`. Có đảo mã, đột biến mã và vài ca dò tạm (không commit), viết thẳng vào tệp test trong worktree.

## Phán quyết (head `e71ab25f`): **ĐẠT CÓ ĐK**

Bản sửa đóng đúng lỗi QA ghi. Desk không còn bỏ giá đã gõ mà không báo. Máy chủ không nhận giá đêm ở giữ chỗ, nên việc `hold()` bỏ qua lỗi ô giá không làm giá sai lọt qua. Điều kiện khóa trùng với điều kiện của #70. Sau khi nút chuyển sang `aria-disabled`, lớp chặn trong `hold()` là lớp khóa duy nhất, và lớp này nay đã có test. ARC không có thẻ Blocker hay Major.

Điều kiện gộp:
1. **CI xanh ở `e71ab25f`.** Lúc ghi review, mọi job đều đang QUEUED. Head đã đổi một lần trong lúc ARC review.
2. Nếu có commit mới chạm `BookingDialog.tsx` thì ARC xem lại phần chênh. Commit chỉ chạm chữ thì chỉ cần CI.

Sau khi gộp (ORC theo dõi, không phải điều kiện gộp):
- QA xác minh lại BUG-R4-041, rồi hạ P2 theo kế hoạch QA.
- BA chốt câu "từ v1.0.4 Desk khóa nút này" ở #72. Câu UXD mới có thêm bước "Điều chỉnh giá ở Folio", nên BA đối lại với các bước DOM điểm 3.

## 1. Máy chủ có bỏ qua giá đêm khi giữ chỗ không (câu 1)

| Lớp | Điều ARC thấy | Căn cứ |
|---|---|---|
| Client gửi gì | `hold()` gọi `saveQuote` với `type, roomId, arrivalDate, nights, adults, children…, channelId, guestId, websiteBookingRequestId`, rồi `createHoldFromQuote` với `holdHours, depositMethod`. **Không có `nightlyRates`.** | `BookingDialog.tsx` `hold()`. Ca "typed rate cleared" kiểm thân yêu cầu `quotes` không có `nightlyRates` |
| Hợp đồng | `QuoteInput` không có `nightlyRates`. Kiểu `saveQuote` được sinh từ OpenAPI, nên nếu thêm trường này vào object literal thì `tsc` báo lỗi | `openapi.yaml` `QuoteInput` |
| Máy chủ nhận gì | `saveInput = quoteInput.extend(…)` là `z.object` thường, không `.strict()`. `parseBody` dùng `safeParse`. Vì vậy trường lạ bị **bỏ lặng**: không 422, không lưu | `quotes.controller.ts` 47–70, `validation.ts` 42–46 |
| Giữ chỗ lấy giá từ đâu | `createHold` truyền `nightlyRates: s.calc.nightlyRates` từ `pricing_snapshot` mà máy chủ tự tính lúc lưu báo giá (Q1), theo giá niêm yết | `quotes.service.ts` 580–603 |

**Kết luận câu 1:**
- Giá đã gõ không thể vào giữ chỗ, kể cả khi client lỡ gửi. Vì ô giá không thuộc về giữ chỗ, việc `hold()` bỏ qua lỗi ô giá không cho giá sai nào đi qua.
- Vì giá gõ đã khóa nút từ trước, chỉ còn hai loại lỗi ô giá tới được `hold()`:
  - `rates`: luật của #70 khi một ô đã gõ bị xóa trống;
  - `nightlyRates[i]`: khi số điền sẵn từ bản xem không lớn hơn 0, tức là số của chính máy chủ.
- Ghi chú hợp đồng, ARC tự nhận cho v1.0.5, không phải thẻ cho FE:
  - Máy chủ bỏ lặng trường lạ cũng cùng họ lỗi 041. Một client tưởng đã gửi giá thỏa thuận sẽ nhận giữ chỗ theo giá niêm yết mà không có lỗi nào.
  - Khi v1.0.5 cho Q1 nhận giá thỏa thuận, ARC sẽ viết trường tường minh vào hợp đồng. ARC cũng đề nghị BE trả 422 khi một trường giá được gửi tới lệnh không nhận giá.
  - v1.0.4 không cần việc này, vì client không gửi.

## 2. Điều kiện khóa có khớp #70 không (câu 2)

`typedRate = dates.some((d) => form.ratesEdited[d] && !!form.rates[d])` trùng từng ký tự với hai chỗ của #70:
- điều kiện câu báo `said` trong `set()`;
- hàm `typed` của bản xem.

Nhờ vậy, câu báo, bản xem và nút dùng cùng một nghĩa "giá đã gõ". Ở `e71ab25f`, `canHold` giữ nguyên điều kiện hiện nút cũ: Trực tiếp/CTV, đến từ ngày mai, có mạng. Dòng chữ hiện khi `canHold && typedRate`.

| Ca | Kết quả | Căn cứ |
|---|---|---|
| Đêm đã gõ nằm ngoài lượt ở sau khi đổi ngày | Không khóa. Đổi ngày lại để gồm đêm đó thì khóa lại, vì ô gõ vẫn được giữ, đúng bảng DOM | Ca "only the nights of the stay"; đột biến M5 đỏ |
| Kênh OTA hoặc Nội bộ | Không có nút, không có dòng chữ. Gõ ở Trực tiếp, sang OTA, gõ tiếp, rồi về Trực tiếp: #70 đã xóa ô gõ, nên nút mở | Dò P-A |
| Trực tiếp ↔ CTV | Vẫn khóa, vì #70 giữ giá đã gõ | Ca `it.each` direct/agent |
| Đổi căn | Cùng nhóm (203 → 101): vẫn khóa. Khác nhóm (→ 301): #70 xóa ô gõ, nên nút mở | Dò P-B |
| Ô đã gõ bị xóa trống | Nút mở. Giữ chỗ đi được, dù #70 báo `rate_empty` cho Tạo đơn | Ca "typed rate cleared"; M3, M4 đỏ |
| Gõ "0", hoặc gõ lại đúng số lịch | Khóa. ARC chấp nhận, vì cùng nghĩa `edited` của ARC 16.18: gõ là sửa. Dòng chữ đã chỉ cách xóa | Dò P-D |
| Bản nháp khôi phục | Khóa ngay khi mở lại hộp | Dò P-E |
| Dài hạn | `dates` chỉ tính tối đa 31 đêm, nhưng dài hạn thì nút đã `disabled` vì `longStay` | Đọc mã |

**Kết luận câu 2:** khớp với #70. Không có ca nào khóa sai làm lễ tân kẹt, và không có ca nào còn giá đã gõ mà nút vẫn mở.

## 3. Còn đường nào giữ chỗ được khi còn giá đã gõ không (câu 3, kể cả `aria-disabled` ở lượt 2)

Từ `e71ab25f`, nút chỉ có `aria-disabled`, nên vẫn nhận bấm và nhận focus. Lớp chặn thật là dòng đầu `hold()`: `if (busy || !online || typedRate) return;`, đứng trước `validate()` và trước mọi lệnh gọi.

| Đường | Kết quả | Căn cứ |
|---|---|---|
| Gọi `hold()` | Chỉ có **một** chỗ gọi: `onClick` của nút | grep `hold(` |
| Bấm, nhấp đúp, Enter, Space trên nút khóa | Không gửi `quotes` hay `create-hold`, nút không bận | Ca mới của FE (Tab, click, Enter, Space); dò P-C (nhấp đúp); M2 đỏ |
| Khe "gõ rồi bấm ngay" | Không có. `typedRate` lấy từ cùng lần render với `onClick`, và React render lại đồng bộ sau mỗi sự kiện gõ | Đọc mã |
| Gửi form | Nút là DS `type="button"` (mặc định ở `Button.tsx`), nằm ở footer `Modal`, ngoài `<form id="booking-form">`. Không bao giờ gửi form | `Button.tsx`, `Modal.tsx` 144 |
| Enter trong ô nhập | Đi `onSubmit` → `submit()`, tức Tạo đơn, đúng ý. Không có `quotes` hay `create-hold` | Dò P-C |
| Phím tắt | `AppShell` (R), `RackPage` (T, N; bỏ qua khi đang gõ). Không phím nào gọi giữ chỗ. `Modal` chỉ bắt Escape và Tab | grep `keydown` |
| Màn khác tạo giữ chỗ | Chỉ `QuoteDialog` (Báo giá → Giữ chỗ). Màn này không có ô giá gõ tay, chỉ hiện giá máy chủ, nên không thuộc lỗi này | grep `createHoldFromQuote` |
| 409 / gợi ý căn khác | Chỉ gọi `submit()` (Tạo đơn) | `ConflictAlert`, `useRoomView` |
| Gõ giá **trong lúc** giữ chỗ đang chạy | **Hở nhỏ.** Ô giá vẫn sửa được khi `busy === 'hold'`. Giữ chỗ vẫn tạo theo giá niêm yết, rồi hộp đóng | Dò P-F, thẻ 01 |

**Kết luận câu 3:** khi nút đang khóa, không còn đường nào tạo giữ chỗ. Kẽ còn lại là gõ giá sau khi đã bấm Giữ chỗ và lệnh còn đang chạy (thẻ 01). Kẽ này hẹp, Tạo đơn cũng có, và không chặn gộp.

## 4. Test có đỏ đúng lý do không, có đột biến lọt không (câu 4)

| Lượt | Kết quả |
|---|---|
| `e71ab25f`: `v104-hold-typed-rate-lock` | **6/6 xanh** |
| `e71ab25f`: `v104-booking-rate-carryover` (#70) | **28/28 xanh** |
| Test `e71ab25f` + `BookingDialog.tsx` của `main` `d0ea6dc2` | **5 đỏ, 1 xanh.** 4 ca đỏ ở `expectLocked`, dòng 42, vì thiếu `aria-disabled`; ca mới đỏ vì nút không khóa. Ca "Tạo đơn lưu giá đã gõ" xanh ở cả hai bản: đây là ca chặn tái phát. Đỏ đúng lý do |
| Test `e71ab25f` + `BookingDialog.tsx` của `9c277c7a` | 5 đỏ: khóa bằng `disabled` gốc không còn đạt DS C1. Khớp số FE báo |
| Lượt 1: test 5 ca + `BookingDialog.tsx` của `main` | 4 đỏ, đều ở `toBeDisabled` (dòng 89, 106, 151); ca Tạo đơn xanh |
| Lượt 1: `9c277c7a` | 5/5 và 28/28 xanh |

Đột biến ở `e71ab25f`:

| Đột biến | Kết quả |
|---|---|
| M1: bỏ `aria-disabled` | 5 đỏ |
| M2: bỏ `typedRate` khỏi lớp chặn của `hold()` | **1 đỏ**, ca mới, dòng 134: nút chuyển sang bận. Ở lượt 1, đột biến này **sống**, vì `disabled` gốc che mất. Nay lớp khóa duy nhất đã có test |
| M3: bỏ vòng bỏ qua lỗi ô giá trong `hold()` | 1 đỏ, ca "typed rate cleared", dòng 164: không có `create-hold`, vì #70 chặn bằng `rate_empty` |
| M4: bỏ `&& !!form.rates[d]` | 1 đỏ, ca "typed rate cleared" |
| M5: tính mọi đêm đã gõ, không chỉ các đêm trong lượt ở | 1 đỏ, ca "only the nights of the stay" |
| M6: chỉ bỏ qua `rates`, giữ lỗi `nightlyRates[i]` | **Sống** (thẻ 02) |
| M8: thêm lại `disabled` gốc khi có giá đã gõ | 5 đỏ. Hành vi DS C1 của UXD-02 đã bị khóa bằng test |

Ghi chú chạy:
- Lượt 1 chạy ở tải máy 30–60, lượt 2 ở tải 3–18.
- Mỗi tệp chạy `--maxWorkers=2 --testTimeout=60000`. Không có ca hết giờ.
- `tsc` ở worktree tạm chỉ báo một lỗi môi trường: `dist` của `@ottimo/contracts` trong bản checkout chính đã cũ, thiếu `publicRoomTypeSlug`. Lỗi này không thuộc PR; CI là chốt.

## 5. Thứ tự gộp với #71, #74 và các PR khác (câu 5)

Tệp của từng PR:
- #75 chạm `BookingDialog.tsx`, tệp test của nó, và 5 tệp chữ.
- #71 và #74 chạm mã máy chủ, `openapi.yaml`, `openapi.ts` sinh ra, và `br-examples.json`.
  - Phần đổi ở `openapi.ts` của hai PR này chỉ là mô tả, không đổi kiểu mà `BookingDialog` dùng.
- #76 chỉ chạm `v104-holds-feb.test.tsx`.
- #72 chỉ chạm sổ tay.

`git merge-tree` của `e71ab25f` với từng nhánh dưới đây: **đều sạch**.

| Nhánh | Head |
|---|---|
| `main` | `373ec195` |
| #71 | `02c34bc9` |
| #74 | `9646029d` |
| #76 | `f96dbbe9` |
| #72 | `bf72b2c9` |

Ở lượt 1, `9c277c7a` cũng sạch với #71, #74 và `main`, và #71 với #74 cũng sạch với nhau.

#75 là PR mở duy nhất chạm `gen_strings.py` và các tệp chữ, nên hiện không có rủi ro xung đột ở tệp sinh.

Đề nghị thứ tự:
- #75 gộp trước hay sau #71/#74 đều được. Nên gộp sớm, vì BUG-R4-041 còn là P0 cho tới khi khóa vào.
- #72 gộp sau #75.
- #76 gộp lúc nào cũng được. Gộp #76 trước thì CI chạy ban đêm của các PR khác không còn 2 ca đỏ giả.
- Ngoài phạm vi #75: #71 và #74 cùng chạm `openapi.yaml`, `openapi.ts`, `checkin.service.ts` và `br-examples.json`. `merge-tree` sạch, nhưng PR gộp sau nên merge `main` vào, sinh lại `openapi.ts` và chạy lại CI.

## 6. Thẻ feedback

### FB-R4-ARC-FE-PR75-01
- Mức độ: Minor (v1.0.5)
- Vị trí: `BookingDialog.tsx`, ô giá mỗi đêm (`readOnly={ratesLocked || undefined}`) và `hold()` / `submit()`.
- Vấn đề:
  - Khi lệnh giữ chỗ đang chạy (`busy === 'hold'`), ô giá vẫn sửa được.
  - Dò P-F: ARC chặn `POST quotes` bằng một cổng, rồi gõ 700.000 vào ô đêm 1 trong lúc nút bận. Ô nhận số (`readOnly = false`). Giữ chỗ vẫn được tạo theo giá niêm yết, rồi hộp đóng. Số vừa gõ mất mà không có câu nào báo.
  - Tạo đơn cũng có kẽ này: `body()` được dựng sau `ensurePhone()`, nên một số gõ trong lúc `createReservation` đang chạy cũng không được gửi.
- Vì sao quan trọng:
  - Cùng họ với BUG-R4-041: số lễ tân thấy khác số được ghi.
  - Khe hẹp, chỉ bằng thời gian 2–3 lệnh gọi, nhưng sẽ dài ra khi mạng yếu. Lễ tân đã bấm Giữ chỗ trước khi gõ. Không chặn gộp.
- Đề xuất sửa:
  - Khi `busy !== null`, cho ô giá và ô "Số tiền đã nhận" là `readOnly`. Hoặc cho `set()` bỏ qua thay đổi các trường giá khi đang bận.
  - Thêm 1 ca test: dùng cổng chặn `quotes`, gõ vào ô giá lúc nút bận, và kiểm ô không đổi.
- Trạng thái: Open

### FB-R4-ARC-FE-PR75-02
- Mức độ: Suggestion (không cần sửa ở v1.0.4)
- Vị trí: `hold()`, vòng `for (const k of Object.keys(v)) if (k === 'rates' || k.startsWith('nightlyRates[')) delete v[k];`.
- Vấn đề:
  - Phần bỏ qua `nightlyRates[i]` gần như không bao giờ chạy. Số gõ tay, kể cả "0" hay chữ, đều khóa nút trước. Chỉ khi số điền sẵn từ bản xem không lớn hơn 0 thì lỗi này mới xuất hiện.
  - Vì vậy đột biến M6 (chỉ bỏ qua `rates`) vẫn xanh.
- Vì sao quan trọng: không sai, nhưng nhánh không có test thì dễ bị hiểu nhầm là cần thiết, hoặc bị gỡ đi khi sửa sau này.
- Đề xuất sửa: giữ nguyên. Nhánh này vô hại và khớp chú thích "ô giá không bao giờ chặn giữ chỗ". Nếu muốn gọn, chỉ bỏ qua `rates` và ghi chú lý do. Không cần thêm test.
- Trạng thái: Open

## 7. Trạng thái thẻ ARC-05 của #70

- **Phần v1.0.4: Done ở #75 `e71ab25f`, đóng khi gộp.** Gồm khóa "Giữ chỗ" khi có giá đã gõ (kèm câu UXD) và việc `hold()` không còn bị `rate_empty` của #70 chặn.
- **Phần v1.0.5: ARC giữ.** Q1 nhận giá thỏa thuận (đổi hợp đồng) và cách máy chủ xử lý trường giá gửi tới lệnh không nhận giá (mục 1). Khi làm xong phần này, BA bỏ các bước tạm của DOM điểm 3.

## 8. Điểm làm tốt

- Dùng đúng điều kiện "giá đã gõ" của #70, từng ký tự. Nhờ vậy câu báo, bản xem và nút luôn đồng ý với nhau, và cả ba ca khó (đêm ngoài lượt ở, OTA/Nội bộ, ô xóa trống) tự đúng mà không cần nhánh riêng.
- Test kiểm **thân yêu cầu gửi đi**: không có `quotes`, không có `create-hold`, đúng một `POST reservations`. Test không chỉ kiểm thuộc tính nút. Ca Tab/Enter/Space ở lượt 2 khóa được lớp chặn trong `hold()`, lớp mà lượt 1 chưa có test.
- Mọi ca đặt 2 đêm nên không phụ thuộc thứ trong tuần (BR-113). Báo cáo PR nói rõ ca xanh ở cả hai bản là ca chặn tái phát, và nêu rõ lỗi đỏ của tệp khác (`v104-holds-feb`) không thuộc PR. ARC đã review riêng lỗi đó ở #76.
