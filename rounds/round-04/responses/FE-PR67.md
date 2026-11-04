# FE-A trả lời review PR #67 (minibar prefill race, BUG-R4-035)

- Người viết: FE-A | Round 4 – Phản hồi & sửa | 04/11/2026
- Review:
  - `rounds/round-04/reviews/UXD-on-v104-pr67-minibar.md`: ĐẠT;
  - `rounds/round-04/reviews/ARC-on-v104-pr67-minibar.md`: ĐẠT CÓ ĐK.
- Nhánh `v104/fix-s4-144-flake`. Đã merge `main` sau #64 (`9fded27f`), xem mục dưới. `main` hiện tại (`ea979fe7`) chỉ đổi tài liệu trong `product/`, gộp không xung đột.
- ARC lượt 2: `rounds/round-04/reviews/ARC-on-v104-pr67-minibar.md` @ `951d1880`, ĐẠT CÓ ĐK, thẻ 03 (Major) và 04.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-UXD-FE-PR67-01 | Done | Lúc đọc lại bản chuẩn của tủ, danh sách đang hiện vẫn là của lần đọc trước. Trong thời gian đó: (1) khối danh sách có `aria-busy="true"`; (2) các ô tăng giảm bị khóa (DS `Stepper` có prop mới `disabled`, tùy chọn, không đổi hành vi cũ); (3) nút "Tất cả còn đủ" bị khóa. Lần đọc đầu vẫn hiện `LoadingBlock`. Không thêm khóa chữ, không thêm màu. Test: `v104-minibar-prefill-fea` (đổi tủ sau B14: khóa trong lúc đọc, mở lại khi có số điền sẵn của tủ mới) và `ui.test.tsx` (`Stepper` `disabled`) |
| FB-R4-ARC-FE-PR67-01 | Done | `stdForCabinet = ready && (data.roomId ?? countingRoomId) === countingRoomId` thay cho `stdLoading`. Kiểm ở dòng đầu `saveMinibar`, trước nhánh `!chargeable`. Danh sách bị khóa và có `aria-busy` khi `!stdForCabinet`. Nút "Tiếp tục" busy trong lúc chờ; khi đọc lỗi thì nút bị khóa. Đọc lỗi thì luôn hiện `ErrorBlock` kèm "Thử lại", kể cả khi còn dữ liệu cũ. Test (a): 500 thì không bỏ qua bước, không POST, "Thử lại" đọc lại được. Test (b): bấm đúng khung hình đã đổi tên sang tủ B nhưng dữ liệu vẫn của A thì chỉ có 1 POST (của 402). Cả hai ca đỏ trên mã trước thẻ, xanh trên mã mới |
| FB-R4-ARC-FE-PR67-02 | Done | `minibarPrefill` được chuyển lên trên JSDoc của `CheckOutPage` |

## Kiểm
- `v104-minibar-prefill-fea`: 7 ca. Nhóm ca 4 ca ARC nêu: (1) race lúc commit; (2) nút chờ khi đang đọc; (3) BUG-R4-035; (4) quy tắc `minibarPrefill`. Thêm 3 ca: UXD PR67-01, ARC (a), ARC (b).
- `s4-144-fea` + `v104-minibar-prefill-fea`, chạy 6 tiến trình song song: 0/36 đỏ.
- Vitest admin-web: 78 tệp / 885 ca, đạt. `packages/ui`: 14 ca, đạt.
- `tsc --noEmit` (admin-web, ui) đạt. `eslint` 0 lỗi. `prettier --check` đạt.

## Merge `main` sau #64 (`9fded27f`)
- Git tự gộp `CheckOutPage.tsx`, `s4-144-fea.test.tsx` và `checkout.test.tsx`, không có xung đột chữ. Đã rà tay đủ 5 điểm ARC nêu:
  1. Hook `prefill` (dòng 212), `edits` (217) và `edRefund` (299) đều nằm trước `return` sớm đầu tiên (`if (!r && …)`, dòng 463) và trước nhánh "trước ngày đi" của #64. Từ dòng 463 đến hết thân `CheckOutPage` không còn lời gọi hook nào.
  2. Không còn `setLeft` hay effect cũ.
  3. Nút "Tiếp tục" vẫn có `busy={minibarAct.busy || stdWaiting}`. Khi đọc lỗi thì nút bị `disabled`. `saveMinibar` bắt đầu bằng `if (!stdForCabinet) return;`.
  4. Tệp này giữ nguyên `findByRole` cho nút "Tiếp tục". Thay đổi đồng hồ sang ngày đi của #64 cũng giữ nguyên.
- Xung đột về nghĩa: theo #64, H16 chỉ chạy vào ngày đi. Vì vậy 5 ca của `v104-minibar-prefill-fea` mở H16 trước ngày đi đã đỏ. Cách sửa giống cách #64 làm với `s4-144-fea`: chuyển đồng hồ sang ngày đi trước khi mở H16 (`onDay`), còn mọi điều kiện kiểm giữ nguyên. Trên mã `CheckOutPage` của `main`, cả 7 ca vẫn đỏ với đúng lỗi cũ.
- Kiểm trên mã đã merge:
  - vitest admin-web 79 tệp / 901 ca đạt, gồm 7 ca `v104-minibar-prefill-fea` và 14 ca `v104-checkout-feb`;
  - lần chạy đầu có 4 ca ở `s2-fix`, `s4-38-fea`, `s4-fea26` quá thời gian 15 s vì máy tải nặng. Chạy riêng 3/3 lần đạt, chạy lại toàn bộ cũng đạt;
  - `tsc` (admin-web, ui), `eslint` 0 lỗi, `prettier` đạt;
  - chạy dưới tải: 6 tiến trình 0/36 đỏ, 24 tiến trình 0/48 đỏ.

## ARC lượt 2 (@ `951d1880`): FB-R4-ARC-FE-PR67-03, -04

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-FE-PR67-03 (Major) | Done | Thêm ref `cabinetSettled`. Effect BR-703-01 chỉ tự chọn tủ phòng cũ **một lần**, ở bản tóm tắt đầu tiên có tủ cũ, và không chạy nữa khi lễ tân đã chọn tủ (Seg `onChange`) hoặc đã gõ số trên tủ đang hiện (`editLeft`). Việc chuyển tủ sau khi ghi số vẫn đi qua `nextCabinet(...)` như trước, không dựa vào effect. Lễ tân vẫn được đếm tủ phòng hiện tại trước. Test mới (ca 8 của `v104-minibar-prefill-fea`): giữ lại bản tóm tắt tính theo giờ (`checkoutTime`), lễ tân bấm 202 và gõ 1 Coca-Cola, rồi mới thả bản tóm tắt đó (vẫn liệt kê 402). Kết quả: 202 vẫn được chọn, 402 không, số vẫn là 1, nút "Tiếp tục" bật. Trên mã `951d1880`: đỏ 3/3 (trang quay về 402 và mất số đã gõ). Trên mã mới: xanh |
| FB-R4-ARC-FE-PR67-04 (Gợi ý) | Done | `onDay` chỉ còn `vi.setSystemTime`; mỗi ca gọi `vi.useFakeTimers({ toFake: ['Date'] })` đúng một lần, ở đầu ca. Hàm mới `onDepartureDay(R)` đọc `stayDepartureDate` (dự phòng `departureDate`) từ API, giống cách trang đọc. 4 ca Kim dùng chung `kimAfterB14()` thay cho đoạn dựng lặp lại; `countedThenExtended()` dùng `onDepartureDay`. Không đổi điều kiện kiểm nào |

### Lệch so với đề xuất của ARC (báo ARC)
- ARC đề xuất chỉ đặt ref khi lễ tân bấm Seg. FE đặt thêm ở 2 chỗ:
  - trong `editLeft`: lễ tân đã gõ số trên tủ đang hiện mà chưa bấm Seg (ORC yêu cầu "đã chọn hoặc đã gõ");
  - ngay khi effect tự chọn tủ cũ lần đầu: để effect chạy đúng một lần.
- Cả hai chỗ nằm ngoài vùng diff của thẻ 03 (`editLeft` ở khoảng dòng 227). Vì vậy cần ARC xem lại phần này.
- Test, ngoài thẻ 03/04: ở ca 1 (race lúc commit), `MutationObserver` giờ chỉ bắt đầu theo dõi sau khi trang đã tải xong lần đầu, ngay trước `release()`. Lý do:
  - bản chuẩn của tủ bị giữ đến lúc `release()`, nên tủ không thể hiện ra trước đó; khoảng thời gian xảy ra race giữ nguyên;
  - trước đây observer theo dõi cả lần tải đầu, và mỗi lần DOM đổi lại chạy 2 truy vấn role trên cả trang. Ở mức 12 tiến trình × 10 lượt, việc này làm lần tải đầu quá 5 s: 1/120 lượt đỏ, 2 lần chạy liên tiếp.
- Sau khi đổi, ca 1 vẫn đỏ 3/3 trên `CheckOutPage` của `9fded27f` (gửi đủ tủ, `remainingQty` 2 thay vì 0).

### Nghiệp vụ (để DOM biết)
- BR-703-01 chỉ **chọn sẵn** tủ phòng cũ. Lễ tân có thể đếm tủ phòng hiện tại trước, rồi chuyển sang tủ cũ. Không có bước nào bị bỏ qua: "Tiếp tục" vẫn đi qua mọi tủ còn trong `minibarUncheckedRooms` (`nextCabinet`).

### Chạy dưới tải
Script `load.sh` (chạy trong `product/apps/admin-web`):

```zsh
#!/bin/zsh
# usage: load.sh <procs> <rounds> <outdir>   (run from product/apps/admin-web)
P=$1; N=$2; OUT=$3; rm -rf $OUT; mkdir -p $OUT
for j in $(seq 1 $P); do
  ( for i in $(seq 1 $N); do
      npx vitest run src/__tests__/s4-144-fea.test.tsx src/__tests__/v104-minibar-prefill-fea.test.tsx > $OUT/run-$j-$i.log 2>&1
    done ) &
done
wait
echo "procs=$P rounds=$N runs=$(ls $OUT/*.log | wc -l | tr -d ' ') red=$(grep -l 'failed' $OUT/*.log | wc -l | tr -d ' ')"
```

Mỗi lượt chạy cả 2 tệp, tức 20 ca: 12 ca `s4-144-fea` và 8 ca `v104-minibar-prefill-fea`, trong đó có ca mới của thẻ 03.

Lệnh đã chạy (máy dev chung với ARC; trong lúc chạy, các agent khác cũng đang chạy vitest):

```zsh
cd product/apps/admin-web
zsh load.sh 12 2  <out>    # mức ARC: 12 tiến trình × 2 lượt
zsh load.sh 12 10 <out>
zsh load.sh 24 40 <out>
```

| Mã | Lệnh | Lần đỏ / số lần | Tải máy (load average, 10 CPU) | Thời gian 1 lần |
|---|---|---|---|---|
| Thẻ 03 + 04, observer ca 1 như cũ | `load.sh 12 2` | 0 / 24 | – | – |
| Thẻ 03 + 04, observer ca 1 như cũ | `load.sh 24 40` | 0 / 960 | – | – |
| Thẻ 03 + 04, observer ca 1 như cũ | `load.sh 12 10`, chạy 2 lần | 1 / 120 mỗi lần | 80–110 | 41–89 s |
| **Mã của commit này** (thẻ 03 + 04, observer ca 1 bắt đầu sau lần tải đầu) | `load.sh 12 2` (mức ARC) | **0 / 24** | 29–63 | – |
| **Mã của commit này** | `load.sh 12 10` | **0 / 120** | 47–80 | 19–35 s |
| **Mã của commit này** | `load.sh 24 40` | **0 / 960** | 62–89 | 21–78 s |

Ghi chú:
- 2 lần đỏ ở hàng 3 đều cùng một chỗ: ca 1 (race lúc commit) quá 5 s ở lần chờ đầu tiên. Trang vẫn đang tải, chưa hiện tiêu đề "Tủ căn 201 cần đếm lại". Lỗi không nằm ở race hay thẻ 03.
- Nguyên nhân và cách sửa: xem mục "Lệch so với đề xuất của ARC" ở trên (observer theo dõi cả lần tải đầu).
- Tổng trên mã của commit này: 1.104 lần chạy (24 + 120 + 960), tức 22.080 ca, 0 đỏ.
- Vitest admin-web: 79 tệp / 902 ca đạt. `packages/ui`: 14 ca đạt. `tsc --noEmit`, `eslint`, `prettier --check` đạt.

## BUG-R4-038 phía Desk (ORC giao thêm, commit riêng trong #67)
- Bối cảnh: BE sửa ở PR #71. Đơn **Nội bộ** trả phòng sau mốc trả muộn cuối, trong khi đêm đó căn đã bán. Khi đó máy chủ trả:
  - `extraNightAvailable = false` và `lateFeeAsNightVnd = 0`;
  - không ghi dòng nào, không cần quản lý xác nhận;
  - nếu Desk gửi `lateFeeInsteadOfNight` thì nhận 422 `NOT_ALLOWED`.
- Lỗi trên Desk: "Hoàn tất" bị khóa khi `extraUnavailable && !lateFeeMode`. Mà `lateFeeMode` chỉ bật khi phí lớn hơn 0, nên đơn Nội bộ kẹt ở ca này.
- Cách nhận biết ca này: theo **số máy chủ trả** (`lateFeeAsNightVnd === 0`), không theo kênh. Máy chủ chỉ trả 0 cho đêm `complimentary` của đơn Nội bộ (#71 `freeNight`), nên chỉ có một nguồn quyết định.

### Sửa trong `CheckOutPage.tsx`: 3 dòng logic và 1 nhánh hiển thị (hơn 1 dòng, nên ARC cần xem)

| Chỗ | Trước | Sau |
|---|---|---|
| Khai báo mới | – | `const lateFeeFree = lateFeeAsNight === 0;` |
| `whyLocked` | `extraUnavailable && !lateFeeMode` | `extraUnavailable && !lateFeeMode && !lateFeeFree` |
| `dueAtCheckout` (khi đêm không bán được) | `lateFeeMode ? số máy chủ − miễn : số dư folio` | `lateFeeMode \|\| lateFeeFree ? …` |
| Bước Phụ phí | `lateFeeMode ? cảnh báo phí : báo lỗi "không thêm đêm được"` | Thêm `lateFeeFree ? null`: không hiện báo lỗi. Ô tóm tắt bên cạnh vẫn có câu `checkout.due_without_extra_night` |

- Lý do sửa `dueAtCheckout`: đơn Nội bộ có giá (ví dụ 300.000 đ/đêm) có thể đã có phụ thu trả muộn từ B15 trước đó. Khi trả sau mốc cuối, B18 đảo khoản phụ thu đó. Số máy chủ (`amountDueAtCheckoutVnd`) đã trừ khoản này; số dư folio thì chưa. Nếu vẫn lấy số dư folio, Desk sẽ thu thừa đúng khoản phụ thu, rồi lại phải hoàn cho khách.
- `lateFeeInsteadOfNight` và `extraNight` không được gửi. Phần này không cần sửa: `lateFee` vốn đã là `undefined` khi `!lateFeeMode`, và `extraNight` chỉ gửi khi đêm còn bán được.
- Các kênh khác không đổi. Phí lớn hơn 0 thì vẫn hiện ô "Ghi phụ thu" hoặc xác nhận quản lý, như ESC-031. Máy chủ cũ không trả `lateFeeAsNightVnd` thì vẫn khóa, như BUG-R2-139.
- Thứ tự gộp với #71: gộp trước hay sau đều được. Khi chưa có #71, máy chủ trả phí Nội bộ theo giá Direct (lớn hơn 0), nên Desk đi đường `lateFeeMode` như hiện nay.
- Không thêm khóa chữ, không thêm màu.

### Mock (`src/mocks/stay.ts`): làm theo B18 của #71
- Đêm thêm của đơn Nội bộ là 0 đ (`extraNightRate`), không có sàn/trần.
- Khi đêm đã bán: `lateFeeAsNightVnd = 0`. B18 không đòi `lateFeeInsteadOfNight` (không báo `LATE_CHECKOUT_AFTER_LIMIT`); nếu Desk vẫn gửi thì trả 422 `NOT_ALLOWED`.
- B18 nhận `extraNight.rateVnd` của đơn Nội bộ mà không kiểm khoảng giá.
- Kênh khác giữ nguyên.

### Test `bug-r4-038-fea.test.tsx` (3 ca)
1. Đơn Nội bộ, 19:30, đêm đã bán:
   - bước Phụ phí không có báo lỗi, câu "chưa gồm đêm thêm" hiện đúng 1 lần;
   - không có ô "Ghi phụ thu", "Hoàn tất" không bị khóa, số cần thu bằng số máy chủ;
   - body B18 không có `lateFeeInsteadOfNight` và `extraNight`; không có dòng `late_fee_as_night` hay `extra_night`.
2. Đơn Nội bộ đã có phụ thu B15 lúc 15:00:
   - Desk thu đúng số máy chủ: 2.460.000 đ, không phải số dư folio 2.672.000 đ;
   - sau khi trả phòng, folio có `balanceDueVnd = 0` và `creditVnd = 0`, phụ thu cũ đã bị đảo.
3. Đối chứng Direct: vẫn hiện ô phí lớn hơn 0, "Hoàn tất" khóa với câu `co.late_fee_pr_needs`.

- Trên `CheckOutPage` của `5dd00420`, mock giữ bản mới:
  - ca 1 đỏ: còn báo lỗi "không thêm đêm được", "Hoàn tất" khóa;
  - ca 2 đỏ: Desk hiện 2.672.000 đ, thay vì 2.460.000 đ;
  - ca 3 xanh.
- Kiểm:
  - vitest admin-web 80 tệp / 905 ca đạt. `tsc`, `eslint`, `prettier` đạt;
  - chạy 6 tiến trình × 2 lượt, mỗi lượt gồm `bug-r4-038-fea` + `esc031-fea` + `checkout.test`: 0/12 đỏ.
