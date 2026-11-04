# FE-A – BUG-R4-042 (P1, sai tiền): Trả phòng sau B14 quay lại tủ minibar đã đếm khi bản tóm tắt về chậm

- Người viết: FE-A | Round 4 – bước **Phản hồi & sửa** | 05/11/2026
- Nhánh: `v104/fe-checkout-minibar-race`, cắt từ `origin/main` @ `373ec195`, rebase lên `7f0ef3fb` (sau #76; #76 chỉ sửa `v104-holds-feb.test.tsx` và tài liệu, không đụng H16, mock hay chuỗi chữ).
- Commit sửa: `c605e919`. Commit báo cáo này nằm ngay sau.
- Căn cứ:
  - `rounds/round-04/qa/bug-list-v1.0.4.md` mục BUG-R4-042;
  - `rounds/round-04/qa/v1.0.4-test-cases.md` TC-V104-RG-21;
  - `rounds/round-04/reviews/ARC-on-v104-pr67-minibar.md` (#67, BUG-R4-035, cùng vùng mã).
- Không đổi máy chủ, không đổi hợp đồng. Thêm **1 khóa chữ**, **chờ UXD duyệt** (mục 3).

## 1. Gốc lỗi (xác nhận)

Đúng như QA đọc mã:
- `saveMinibar` là closure của lần render lúc bấm. `toCount` là `s?.minibarUncheckedRooms` của lần render đó.
- Sau `await` lệnh POST, `nextCabinet(counted)` tìm tủ kế tiếp trong danh sách cũ. `sum.reload()` gọi ngay trước không đổi được biến đã chụp.
- Thêm một chi tiết: trong lúc bản tóm tắt đang tải lại, `useResource` vẫn giữ `data` cũ (trạng thái `loading` kèm dữ liệu cũ). Vì vậy **cả lần render mới nhất** cũng còn liệt kê tủ vừa đếm. Chỉ đọc "bản tóm tắt mới nhất" thôi thì chưa đủ. Phải nhớ tủ nào đã đếm.

Tái hiện trên `main` bằng test tạm (không commit, đã xóa), đúng các bước của QA2:
- giữ bản tóm tắt sau lần đếm tủ 402;
- đếm tủ 202;
- nhả bản tóm tắt;
- bấm "Không dùng gì – tủ đủ" rồi **Tiếp tục**.

Kết quả trên `main`:

| Sau lần đếm thứ hai | Kết quả |
|---|---|
| Đọc lại bản chuẩn | Đọc lại tủ 402 |
| Nhóm chọn tủ | Ẩn |
| Bước ② | Không sang |
| Ba lệnh đếm | `[402, 201]`, `[202, 201]`, `[402, 201]` |
| Dòng minibar trên folio | `[35000]` thành `[]` |

Trên nhánh, cùng các bước đó: trang sang bước ②, không đọc lại tủ nào, và không còn nút "tủ đủ" để bấm.

## 2. Cách sửa và lý do chọn

QA gợi ý hai hướng:
- (a) nhớ các tủ đã đếm (201) trong lần mở trang;
- (b) chờ bản tóm tắt mới rồi mới chọn tủ kế tiếp.

FE chọn **(a)**, kèm một phần của (b): chọn tủ kế tiếp theo bản tóm tắt mới nhất đã có, nhưng **không chờ mạng**.

Lý do không chờ bản tóm tắt mới (b thuần):
- `useResource.reload()` không trả promise. Muốn chờ thì phải đổi hook dùng chung cho cả Desk.
- Lần đọc đó có thể bị lần đọc theo giờ trả (`qTime`) thay thế (`seq`). Nó cũng có thể lỗi. Khi đó lễ tân bị kẹt ở bước ①, đúng lúc mạng Đà Lạt yếu.
- Bản tóm tắt vẫn có thể về chậm hơn lần bấm kế tiếp. Chờ chỉ làm khe hẹp lại, không đóng khe.
- (a) không phụ thuộc thời điểm mạng. Màn hình giống nhau dù bản tóm tắt về trước hay sau. Máy chủ vẫn là chốt cuối: B18 chặn `MINIBAR_NOT_CHECKED` nếu còn tủ chưa đếm.

Phần sửa trong `CheckOutPage.tsx`:
1. **Các tủ đã đếm trên trang này** (nhận 201), và tủ bỏ qua vì không có món tính tiền, được ghi vào `doneRef` (ref, cho handler đọc sau `await`) và `doneCabinets` (state, để vẽ màn hình). Mỗi tủ lưu `roomId` và số căn. Hai giá trị cùng đổi trong `markDone`. Ref đặt ngay sau `cabinetSettled`, trước mọi `return` sớm.
2. **`goNextCabinet(done)`** thay `nextCabinet`. Tủ kế tiếp lấy từ bản tóm tắt **mới nhất đã commit** (`latestSummary`, ref cập nhật trong effect theo `s`), bỏ mọi tủ trong `done`. Không còn tủ thì sang bước ②. Ref không bao giờ cũ hơn lần render lúc bấm, vì React chạy effect bị động trước sự kiện bấm và sau `await`.
   - Có ca test riêng (mục 4, ca 5): bản tóm tắt đầu tiên về **trong lúc** đang đếm tủ 202. Mã cũ sang thẳng bước ② và bỏ tủ 402. Mã mới chuyển sang tủ 402.
3. **Nhóm chọn tủ không còn đưa tủ đã đếm**. Danh sách lọc bỏ `doneCabinets`, và không tự thêm căn đang ở nếu căn đó đã đếm. Đây là cách đóng đường "tủ đã đếm bị đếm lại thành tủ đủ" bằng tay trong lúc bản tóm tắt chưa về. Sau khi bản tóm tắt về, máy chủ cũng không liệt kê tủ đó nữa, nên màn hình giống nhau ở cả hai thời điểm.
4. **Effect BR-703-01** (chọn sẵn tủ căn cũ một lần) cũng bỏ tủ đã đếm.
5. **Bấm "Tiếp tục" đặt `cabinetSettled`**. Lý do: nếu bản tóm tắt đầu tiên về giữa lúc đang đếm tủ trên màn, effect không được đổi tủ dưới chân lễ tân (cùng nguyên tắc ARC PR67-03). Tủ kế tiếp được chọn sau khi đếm xong.
6. **`counted`** là `roomId` của bản chuẩn đã đếm (`read.roomId ?? countingRoomId`). Body POST dùng đúng biến đó, nên tủ ghi vào `done` và tủ gửi lên máy chủ luôn là một.
7. **K11-03, tên tủ đang đếm.**
   - Lượt ở có từ 2 tủ trên trang này, và nhóm chọn tủ đã ẩn vì chỉ còn 1 tủ: hiện dòng `<dl class="dl">` "Tủ minibar đang đếm: Căn 202 (đang ở)" hoặc "… Căn 402 (đã chuyển đi)", ở đúng chỗ nhóm chọn tủ vừa ẩn.
   - Nhãn giá trị dùng lại `co.minibar_cabinet_room` / `co.minibar_cabinet_old`.
   - Số căn lấy theo thứ tự: căn đang ở, bản tóm tắt, tủ đã đếm, rồi `Reservation.segments`. Không bao giờ lấy căn đang ở cho tủ khác. Tiêu đề "Cần đếm lại" (`co.minibar_recount_title`) cũng lấy số căn theo cách này.
   - Lượt ở chỉ có 1 tủ: không đổi màn hình (tiêu đề trang đã ghi căn).

Giữ nguyên các bảo đảm của #67:
- `stdForCabinet` vẫn là điều kiện đầu tiên của `saveMinibar`, đứng trước nhánh không có món tính tiền.
- `cabinetSettled`: effect chỉ chọn sẵn một lần, không đè tủ lễ tân đã chọn hoặc đã gõ số.
- `edits` vẫn gắn với đúng đối tượng bản chuẩn.

Các ca của #67 trong `v104-minibar-prefill-fea` (8/8) xanh, gồm ca ARC PR67-03 (bản tóm tắt theo giờ về muộn, tủ 202 và số đã gõ vẫn còn).

## 3. Câu chữ mới – **cần UXD duyệt**

Thêm bằng `product/design/tools/gen_strings.py` (nhóm "v1.0.4 BUG-R4-042 … CHỜ UXD DUYỆT"), rồi sinh lại `strings-vi.json`, `strings-en.json`, `strings.js`, `strings-tables.md`.

| Khóa | VI | EN | Chỗ dùng |
|---|---|---|---|
| `co.minibar_cabinet_counting` | Tủ minibar đang đếm | Minibar being counted | `<dt>` của dòng tên tủ, H16 bước ①. Giá trị `<dd>` = `co.minibar_cabinet_room` / `co.minibar_cabinet_old` (đã có) |

UXD xem giúp:
- câu chữ;
- vị trí: thay chỗ nhóm chọn tủ, dùng lớp `.dl` của hifi.css như thẻ khóa cửa ở H14;
- có nên thêm một dòng "Đã đếm: Căn 402 (đã chuyển đi)" không. FE chưa làm, để giữ phạm vi nhỏ.

Giọng nội bộ: ngắn, không emoji, không "Vui lòng".

## 4. Test

Tệp mới `product/apps/admin-web/src/__tests__/bug-r4-042-fea.test.tsx` có 5 ca, dùng MSW với cổng giữ `checkout-summary`. Mọi ca gọi `pinDaytime('11:00')` trước khi dựng dữ liệu, rồi đặt đồng hồ sang ngày đi của lượt ở. Dữ liệu: Kim, B14 402 sang 202, hai tủ cùng phải đếm.

| # | Ca | Kiểm |
|---|---|---|
| 1 | **Race**: bản tóm tắt sau lần đếm 402 bị giữ qua lần đếm 202 | Sang bước ② khi bản tóm tắt còn đang giữ. Không đọc lại tủ nào sau lần đếm thứ hai. Không còn nút "tủ đủ". Nhả bản tóm tắt: vẫn bước ②. Đúng 2 lệnh `[402, 201]`, `[202, 201]`. Folio có đúng 1 dòng minibar 35.000 của tủ 402, không bị đảo. Máy chủ không còn tủ chưa đếm |
| 2 | Đối chứng: bản tóm tắt về **trước** lần bấm thứ hai (RG-21 "lặp lại") | Như ca 1 |
| 3 | K11-03, tủ căn cũ trước | Sau khi đếm 402 (bản tóm tắt đang giữ): nhóm chọn tủ không còn đưa 402, và dòng tên tủ ghi "Căn 202 (đang ở)". Nhả bản tóm tắt: vẫn vậy |
| 4 | K11-03, tủ căn đang ở trước (lễ tân chọn) | Đếm 202 (bản tóm tắt đang giữ). Sang 402, có tên, 202 không được đưa lại. Đếm 402 (bia dùng 1) thì sang bước ②. 2 lệnh `[202, 402]`, folio 1 dòng 35.000 |
| 5 | Bản tóm tắt **đầu tiên** về trong lúc đang đếm 202 (lệnh POST bị giữ) | Sau 201: sang tủ 402, có tên. Mã cũ sang thẳng bước ② và bỏ tủ 402 |

Ba tệp test cũ được đổi **chỗ neo**, không nới điều kiện kiểm:
- `s4-144-fea` (ca K11-03 B14 402 → 202);
- `s4-416-fea` (ca M-1 "đếm tủ căn cũ trước");
- `v104-minibar-prefill-fea` ca ARC PR67-01 (b).

Trước đây cả ba chờ nút "Căn 202 (đang ở)" của nhóm chọn tủ thành `aria-pressed=true` sau lần đếm tủ đầu. Khung hình đó chỉ có khi bản tóm tắt cũ còn đưa tủ vừa đếm, tức đúng khung hình gây BUG-R4-042. Ở mã cũ, khi bản tóm tắt về thì nhóm ẩn, và test vẫn đạt nhờ nút đã tháo khỏi DOM còn giữ thuộc tính cũ.

Bây giờ ba ca chờ dòng tên tủ ghi đúng tủ 202 (hoặc 201), và kiểm thêm nhóm chọn tủ đã ẩn. Ca (b) vẫn bấm "Tiếp tục" ở microtask ngay sau commit nêu tủ B, trước khi `useResource` bắt đầu đọc B. Nó vẫn kiểm chỉ có 1 lệnh đếm `[402]`.

## 5. Bằng chứng đỏ / xanh

Lệnh dùng chung: `cd product/apps/admin-web && npx vitest run <tệp>`. Log ở scratchpad (`logs-042/`), không commit.

**Đỏ trên `main`.** Dùng `git stash` cho riêng `CheckOutPage.tsx`, nên mã sản phẩm giống hệt `origin/main` (`git diff --quiet origin/main -- CheckOutPage.tsx` đạt). Giữ test mới và khóa chữ mới. Chạy 4 tệp: **7 đỏ / 26 xanh**.

| Ca | Đỏ ở đâu |
|---|---|
| 1 Race | `no cabinet read again after the last count`: nhận `[<402>]`. Trang quay lại tủ 402 |
| 3, 4 K11-03 | `offered` vẫn là `["Căn 402 (đã chuyển đi)", "Căn 202 (đang ở)"]`: tủ đã đếm vẫn được đưa |
| 5 Bản tóm tắt đầu về trong lúc đếm | `expected [] to include <402>`: mã cũ không đọc tủ 402 (sang thẳng bước ②) |
| 3 ca cũ đổi neo | Không thấy dòng "Tủ minibar đang đếm" |
| 2 Đối chứng | **Xanh** trên `main`, đúng như mong đợi: lỗi chỉ xảy ra khi bản tóm tắt về chậm |

**Xanh trên nhánh:**
- tệp mới 5/5;
- 7 tệp minibar/checkout liên quan **60/60** (`bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`, `s4-416-fea`, `checkout`, `v104-checkout-feb`, `bug-r4-038-fea`), cả trước và sau rebase lên `7f0ef3fb`.

**Gỡ từng phần sửa** (mỗi lần chỉ gỡ một phần, chạy tệp mới):

| Phần gỡ | Ca đỏ |
|---|---|
| `goNextCabinet` chỉ bỏ tủ vừa đếm, không bỏ các tủ đã đếm trước đó | Ca 1 (race), ca 4 |
| Tủ kế tiếp lấy từ bản tóm tắt của lần bấm (closure) | Ca 5 |
| Nhóm chọn tủ vẫn đưa tủ đã đếm | Ca 3, ca 4 |

**Kiểm tĩnh:** `tsc --noEmit` (admin-web) đạt; `eslint` và `prettier --check` trên 5 tệp đạt. Chuỗi sinh lại không đổi gì thêm (chạy lại `gen_strings.py` sau rebase: không có diff).

## 6. Chạy dưới tải

- Lệnh: `logs-042/load.sh <P> <R>`. Script chạy cùng lúc P tiến trình `npx vitest run src/__tests__/bug-r4-042-fea.test.tsx src/__tests__/v104-minibar-prefill-fea.test.tsx src/__tests__/s4-144-fea.test.tsx` (25 ca mỗi lượt), lặp R vòng.
- Kết quả:

| Mức | Tải 1 phút | Đỏ |
|---|---|---|
| 8 × 2 | 3 – 16 | **0/16** lượt (400 ca) |
| 12 × 2 (mức ARC đã dùng cho #67) | 15 – 29 | **0/24** lượt (600 ca) |

- Lúc chạy, máy nhẹ hơn mức 60–110 ORC báo. Chưa chạy ở tải đó. Nếu ARC/QA cần mức tải nặng, chạy lại đúng lệnh trên.

## 7. Giả định, rủi ro, việc còn lại

- **G-FE-042-1, quay lại bước ① bằng nút Quay lại.** Trang hiện tủ đếm cuối, có tên, với số đã gửi. Bấm Tiếp tục thì gửi lại cùng số, máy chủ giữ dòng (R6). Đây là đường lễ tân **chủ động** quay lại sửa, nên vẫn cho đếm lại tủ đang hiện. FE không chặn. Nếu DOM/UXD muốn ghi "đã đếm" ở đó thì làm ở v1.0.5.
- **G-FE-042-2, tủ được bổ sung (`new_fill`) sau khi đã đếm, trong cùng lần mở trang.** Rất hiếm. Desk không đưa lại tủ đó. B18 chặn `MINIBAR_NOT_CHECKED`, và lễ tân mở lại trang Trả phòng (danh sách tủ đã đếm được đặt lại). Không sai tiền.
- **E2E:**
  - Không thêm spec Playwright mới, vì không chạy được stack dùng một lần trên máy đang tải.
  - Spec có sẵn `e2e/ui-clock/b14-fridges.s5.spec.ts` (TC-L4-138) đã nhận nhóm chọn tủ ẩn sau tủ đầu (`'hidden'`), nên tương thích. CI sẽ chạy spec này.
  - Biến thể giữ bản tóm tắt bằng `page.route` của RG-21 để QA chạy trên stack dùng một lần, như test tạm `zz-qa2-pr67.spec.ts` của QA2.
- **Cần xem:**
  - ARC xem cách sửa (theo bug-list);
  - UXD duyệt câu chữ và dòng tên tủ (mục 3);
  - QA chạy lại RG-21 (UNIT + E2E).
- **Không có ESC.** Đây là chi tiết cài đặt thuộc quyền FE, không đụng tiền, chính sách hay pháp lý ngoài việc sửa lỗi.

### Dòng `decision-log.md` đề xuất (ORC ghi cùng lượt "log rows")

| Ngày | Round | Quyết định | Ai | Bước |
|---|---|---|---|---|
| 2026-11-05 | 4 | **FE-A – BUG-R4-042**: H16 bước ① nhớ các tủ đã đếm (201) và tủ bỏ qua vì không có món tính tiền trong lần mở trang. Các tủ đó không bao giờ được chọn tiếp, không được đưa vào nhóm chọn tủ, không được effect BR-703-01 chọn sẵn. Tủ kế tiếp lấy theo bản tóm tắt mới nhất đã có, không chờ lần đọc mới (lý do: hook dùng chung, mạng yếu, lần đọc có thể bị thay hoặc lỗi; máy chủ vẫn chặn `MINIBAR_NOT_CHECKED`). Lượt ở có từ 2 tủ thì màn luôn nêu tên tủ đang đếm (K11-03, khóa `co.minibar_cabinet_counting`, chờ UXD). Quay lại bước ① bằng nút Quay lại vẫn đếm lại được tủ đang hiện (G-FE-042-1) | FE-A | Phản hồi & sửa |

## 8. File tạo / sửa

- `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx`
- `product/apps/admin-web/src/__tests__/bug-r4-042-fea.test.tsx` (mới)
- `product/apps/admin-web/src/__tests__/v104-minibar-prefill-fea.test.tsx` (đổi neo ca ARC PR67-01 (b))
- `product/apps/admin-web/src/__tests__/s4-144-fea.test.tsx` (đổi neo ca K11-03 B14)
- `product/apps/admin-web/src/__tests__/s4-416-fea.test.tsx` (đổi neo ca M-1)
- `product/design/tools/gen_strings.py` và tệp sinh: `product/design/copy/strings-vi.json`, `strings-en.json`, `product/design/wireframes/assets/strings.js`, `product/design/tools/strings-tables.md`
- `rounds/round-04/outputs/FE/bug-r4-042-minibar-race.md` (tệp này)
