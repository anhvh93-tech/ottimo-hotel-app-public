# ARC review – PR #81 BUG-R4-042: Trả phòng sau B14 quay lại tủ minibar đã đếm (P1)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng: `v104/fe-checkout-minibar-race` @ `054d40c0`. Hai commit nằm trên `7f0ef3fb`, cũng là `origin/main` lúc review, nên không cần rebase:
  - `c605e919`: phần sửa và test;
  - `054d40c0`: báo cáo FE.
- Tệp trong PR:
  - `CheckOutPage.tsx`;
  - test mới `bug-r4-042-fea.test.tsx` (5 ca);
  - 3 tệp test đổi chỗ neo: `s4-144-fea`, `s4-416-fea`, `v104-minibar-prefill-fea`;
  - 1 khóa chữ, gồm `gen_strings.py` và 4 tệp sinh.
- Đọc kèm:
  - báo cáo FE trên nhánh (`rounds/round-04/outputs/FE/bug-r4-042-minibar-race.md`);
  - mục BUG-R4-042 của bug-list;
  - ARC review #67 (3 lượt);
  - BR-702, BR-703, BR-703-02 (3) và (7);
  - `hooks/useResource.ts`, `useSubmit`/`useWrite` (khóa idempotency đổi sau mỗi lần thành công);
  - `checkout.service.ts`: `uncheckedMinibars`, B18 dòng 1223;
  - `minibar-checkout.port.ts`: tủ chỉ có món miễn phí thì không bắt đếm;
  - mock `stay.ts`; E2E `b14-fridges.s5.spec.ts`.
- Cách kiểm: ARC tự chạy trong worktree riêng ở scratchpad (`wt-arc81`, đã xóa), cài `pnpm install --frozen-lockfile --offline`, build `@ottimo/contracts`. Không commit, không push.
- CI (`gh pr checks 81` @ `054d40c0`):
  - đã xanh: `format · lint · audit · test · build`, `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `landing LP-v1`, `no test endpoints`;
  - còn **chờ**: `docker images build · E2E smoke`. Job này chạy cả desk-clock, gồm TC-L4-138 `b14-fridges.s5`;
  - trạng thái gộp: `MERGEABLE` / `BLOCKED`.
- UXD đã duyệt khóa chữ và dòng tên tủ: ĐẠT, theo `UXD-on-v104-pr81-minibar-race.md`.

## Phán quyết: **ĐẠT CÓ ĐK**

Bản sửa đóng được khe race của BUG-R4-042. Nó không mở đường sai tiền mới và giữ đủ ba bảo đảm của #67: `stdForCabinet`, `cabinetSettled`, và số đã gõ gắn với đúng bản chuẩn. Không có thẻ Blocker hay Major.

Điều kiện gộp:
1. CI xanh ở head, gồm cả `docker images build · E2E smoke`.
2. Có thể phải rebase vì một PR chữ khác vào `main` trước. #75, #77, #79 và #82 cùng sửa `gen_strings.py`, `strings-*.json`, `strings-tables.md`. Riêng `strings.js` chỉ có 1 dòng, nên chắc chắn xung đột. Khi đó:
   - giải xung đột ở `gen_strings.py`, rồi chạy lại script để sinh lại các tệp kia. Không sửa tay tệp sinh;
   - chạy lại 4 tệp test ở mục 5;
   - nếu `CheckOutPage.tsx` không đổi thì không cần ARC xem lại.

Các thẻ không chặn gộp:
- Thẻ 01 và 02 là Minor. ARC đề xuất làm thẻ 02 (chỉ thêm test) ngay trong PR nếu kịp. Thẻ 01 dời v1.0.5, kèm 1 dòng cách làm tạm trong sổ tay. ORC quyết.
- Thẻ 03 và 04 là Suggestion.

## 1. Khe race đã đóng chưa

| Đường | `main` | PR #81 | Kết luận |
|---|---|---|---|
| Race QA2: bản tóm tắt đọc sau lần đếm 402 còn bị giữ khi lễ tân đếm 202 | Tủ kế tiếp tìm trong `toCount` của closure. Danh sách đó còn 402, nên trang quay lại 402 và không ghi tên tủ | `goNextCabinet` bỏ mọi tủ trong `doneRef`. `markDone` ghi `doneRef` ngay sau 201, trước khi chọn tủ | Đóng. Ca 1 đỏ tất định trên `main`: `readsSince(2)` ra `[402]`. Trên nhánh thì xanh |
| Bản tóm tắt đó về trong lúc POST 202 đang chạy | – | `latestSummary` là bản mới, chỉ còn `[202]`. 202 đã ghi vào done, nên trang sang bước ② | Đóng |
| Bản tóm tắt **đầu tiên** về trong lúc POST 202 | Sang thẳng bước ②, bỏ sót 402 (B18 chặn) | Ref đã có bản mới, nên trang sang 402 | Đóng (ca 5) |
| Lễ tân tự chọn lại tủ đã đếm trong nhóm chọn tủ, khi bản tóm tắt chưa về | Còn nút 402 | Danh sách bỏ `doneCabinets`. Căn đang ở đã đếm thì không tự thêm vào | Đóng (ca 3, 4) |
| Effect BR-703-01 chọn sẵn lại tủ cũ khi bản tóm tắt về | #67 đã chặn sau khi lễ tân chọn hoặc gõ số (`cabinetSettled`) | Bấm "Tiếp tục" cũng đặt `cabinetSettled`. Màn không đổi tủ dưới tay lễ tân khi lệnh đếm còn đang chạy | Đóng (M4 làm ca 5 đỏ) |
| Bấm 2 lần thật nhanh | `write.busy` và DS `busy` | Không đổi | Đóng |
| Máy chủ đã ghi lần đếm nhưng Desk nhận lỗi mạng | – | Không ghi done, trang ở lại tủ đó. Khóa idempotency chưa đổi, nên lần bấm lại nhận lại kết quả cũ, rồi mới ghi done | Đúng |

Ba điểm kiểm thêm:
- **Tủ trong lệnh đếm.** `stdForCabinet` bảo đảm `read.roomId ?? countingRoomId` bằng `countingRoomId`. Vì vậy body POST, tập done và màn hình luôn nói về cùng một tủ (ARC 16.19 giữ nguyên). `periodId` cũng lấy từ `read`.
- **Thứ tự hook.** Mọi hook mới đứng trước `return` sớm đầu tiên (dòng 494): `doneRef`/`doneCabinets` ở dòng 210–211, `latestSummary` ở 440–443. Không có hook nào sau dòng 488.
- **Máy chủ là chốt cuối.** B18 kiểm `uncheckedMinibars` trong giao dịch (`checkout.service.ts` dòng 1223). Mọi đường Desk bỏ sót tủ đều bị chặn `MINIBAR_NOT_CHECKED`, nên không sai tiền. Tủ chỉ có món miễn phí thì máy chủ không bắt đếm (`required = items.some(priceVnd !== null)`), khớp nhánh `!chargeable` của Desk.

## 2. Có đường nào mất số đã gõ hoặc gửi đếm hai lần cho cùng một tủ không

| Đường | Kết quả |
|---|---|
| Bản tóm tắt về muộn (PR67-03) | Vẫn giữ số. Ca PR67-03 của `v104-minibar-prefill-fea` xanh. Effect giờ còn chặn chặt hơn |
| Lễ tân tự chọn tủ kế tiếp trong lúc POST của tủ trước còn chạy, rồi `goNextCabinet` chạy sau 201 | **2 tủ:** không mất số. `setCabinet` nhận đúng giá trị đang có, `std` không đọc lại, `edits` còn nguyên. **Từ 3 tủ** (2 lần B14): trang nhảy sang tủ "đầu tiên chưa đếm", số đã gõ trên tủ lễ tân chọn bị bỏ. `main` cũng vậy, không do PR này → thẻ 04 |
| `markDone` làm ẩn nhóm chọn tủ | `cabinet`, `std` và `edits` không đổi, nên không mất số |
| Desk tự gửi đếm lại một tủ | Không còn đường nào |
| Lễ tân gửi đếm lại một tủ | Chỉ ở 2 đường: bấm Quay lại (G-FE-042-1), hoặc đường D2 (mục 3.3). Mỗi lần là một lệnh mới, vì `useWrite` đổi khóa sau 201. Gửi cùng số thì folio không đổi (ARC đo ở mục 3.1) |

## 3. Hai giả định, và một đường FE chưa nêu

ARC viết 3 test tạm (scratch, không commit) và chạy cả trên nhánh lẫn trên `CheckOutPage.tsx` của `main`. Tệp còn ở `scratchpad/arc81-mut/zz-arc81-scratch.test.tsx` nếu FE muốn dùng lại.

### 3.1 G-FE-042-1 – Quay lại thì đếm lại được tủ đang hiện: an toàn về tiền

Kịch bản: Kim, B14 402 → 202. Lễ tân chọn 202 trước (không dùng gì), rồi đếm 402 (1 bia), sang bước ②, bấm **Quay lại**.

Trên nhánh:
- Màn ghi "Tủ minibar đang đếm: Căn 402 (đã chuyển đi)", bia "dùng 1". Đây là số đã gửi, vì `edits` vẫn gắn với bản chuẩn cũ. Nhóm chọn tủ ẩn.
- Bấm **Tiếp tục**: lệnh thứ ba `[402, 201]`, `lines` giống hệt lệnh thứ hai. Folio vẫn là `[[402, 35.000]]`. Trang về bước ②.

Trên `main`, cùng các bước: tủ trên màn **không có tên** (`on: undefined`), đúng lỗi K11-03.

Kết luận: số chỉ đổi khi lễ tân chủ động sửa, trên một tủ có tên. Khớp BR-702 ("lần đếm thật mới" thắng). **Chấp nhận.** Nên giữ hành vi này bằng test (thẻ 02).

### 3.2 G-FE-042-2 – tủ được bổ sung lại sau khi đếm: an toàn về tiền, nhưng kẹt trên trang

Kịch bản: lễ tân đếm 202 trước. Trong lúc lễ tân đếm 402, HK xong việc bổ sung 202. Mock mở kỳ mới với lý do `new_fill`.

Trên nhánh:
- Bản tóm tắt liệt kê `[202, new_fill]`. B18 sẽ trả 409 `MINIBAR_NOT_CHECKED`, nên không sai tiền. Đúng như FE nói.
- Nhưng 202 không bao giờ hiện lại trên trang này. Lễ tân bấm Quay lại thì màn nêu 402. Bấm Tiếp tục thì đếm lại 402 rồi sang bước ②.
- Câu lỗi của B18 là "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất." Lễ tân về bước 1 thì không thấy tủ nào cần đếm. Cách duy nhất là tải lại trang.

Trên `main`, cùng các bước: đếm lại 402 xong thì trang sang 202, vì closure còn giữ 202. Tức là `main` tự gỡ được, còn PR bắt lễ tân tải lại trang.

Ca này hiếm. Phải có đủ 3 điều:
- tủ là tủ căn đang ở (theo BR-703-02 (3), tủ căn đã rời không mở kỳ mới);
- lễ tân đếm tủ căn đang ở trước tủ căn cũ;
- HK xong việc bổ sung đúng lúc khách đang trả phòng.

### 3.3 D2 – bản tóm tắt đầu tiên chưa về (hoặc lỗi) khi lần đếm đầu đã xong. Báo cáo FE chưa nêu

Kịch bản: giữ bản tóm tắt đầu tiên lại. Đếm 202, lệnh POST không bị giữ.

Trên nhánh:
- Sau 201, `latestSummary` vẫn chưa có gì, nên trang sang bước ② mà bỏ sót 402. `main` cũng vậy (`toCount = []`), và B18 sẽ chặn.
- Lễ tân bấm Quay lại: màn nêu "Căn 202 (đang ở)". 402 không được đưa ra, vì 202 đã đếm nên không tự thêm, và `cabinetSettled` đã đặt.
- Lễ tân phải **đếm lại 202** thì trang mới sang 402.

Trên `main`: nhóm chọn tủ có `[402, 202]`, lễ tân chọn thẳng 402.

Không sai tiền, vì đếm lại cùng số. Nhưng lễ tân phải đếm thừa một lần, và đường này dễ gặp hơn khi mạng Đà Lạt yếu (bản tóm tắt đầu lỗi). Xử lý ở thẻ 01.

## 4. Ba test cũ đổi chỗ neo: không nới điều kiện kiểm

- **Vì sao phải đổi.** Neo cũ chờ nút "Căn 202 (đang ở)" của nhóm chọn tủ có `aria-pressed=true`. Trên nhánh, nhóm này ẩn ngay trong commit chuyển tủ, vì 402 đã đếm và chỉ còn 1 tủ. Neo cũ vì thế không bao giờ đạt. FE nói đúng: trên `main`, neo cũ đạt chỉ nhờ phần tử đã tháo khỏi DOM vẫn giữ thuộc tính cũ.
- **Neo mới.** Test chờ dòng "Tủ minibar đang đếm" nêu đúng tủ. Giá trị của dòng lấy từ `countingRoomId`, nên test vẫn kiểm trang đã sang tủ đó. Test còn kiểm thêm nhóm chọn tủ đã ẩn. Mọi điều kiện kiểm phía sau giữ nguyên.
- **Kiểm bằng đột biến.** Giữ test của nhánh, chỉ đổi mã sản phẩm:
  - **M9**: `stdForCabinet` bỏ điều kiện `roomId`, tức lỗi PR67-01 (b). Ca (b) **đỏ** ở dòng 408, đúng điều kiện gốc: gửi `[402, 402]` thay vì `[402]`. Vậy neo mới vẫn bấm đúng khung hình race. Dòng tên tủ và `setCabinet` nằm cùng một commit, vì hai `setState` sau `await` được gộp.
  - **M10**: bỏ `roomId` khi tủ là căn đang ở, tức lỗi K11-03 gốc. Ca B14 của `s4-144-fea` đỏ ở dòng 489, ca M-1 của `s4-416-fea` đỏ ở dòng 405. Cả hai đỏ đúng ở điều kiện `roomId` của lần đếm thứ hai.
- **Kết luận:** không nới điều kiện kiểm.

## 5. Chạy test (ARC tự chạy)

Lúc chạy từng bộ riêng, load máy 2–6.

| Bộ | Kết quả |
|---|---|
| 7 tệp FE nêu: `bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`, `s4-416-fea`, `checkout`, `v104-checkout-feb`, `bug-r4-038-fea` | 60/60 |
| 24 tệp admin-web có minibar/trả phòng | 244/244 |
| Cả admin-web | 82 tệp, **938/938** |
| `tsc --noEmit` (admin-web); `eslint` và `prettier --check` trên 5 tệp của PR | Đạt |

**Đột biến.** Mỗi lần chỉ đổi mã sản phẩm, rồi chạy 4 tệp `bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`, `s4-416-fea` (33 ca):

| # | Mã sản phẩm | Ca đỏ | Ghi chú |
|---|---|---|---|
| M0 | `CheckOutPage.tsx` của `origin/main` | 7: ca 1, 3, 4, 5 và 3 ca đổi neo | Ca 1 đỏ ở "no cabinet read again" (nhận `[402]`). Ca 3, 4 đỏ vì `offered` còn 402. Ca 5 đỏ vì không đọc 402. Ca 2 (đối chứng) xanh. Khớp số FE báo |
| M1 | Tủ kế tiếp lấy từ `s` của closure | 1: ca 5 | Khớp FE |
| M2 | Nhóm chọn tủ vẫn đưa tủ đã đếm | 4: ca 3, 4, 5 và PR67 (b) | Khớp FE. Ca (b) đỏ thêm vì neo |
| M3 | Chỉ bỏ tủ vừa đếm | 2: ca 1, 4 | Khớp FE |
| M4 | Không đặt `cabinetSettled` khi bấm | 1: ca 5 | Màn chuyển sang 402 trong lúc POST 202 còn chạy |
| M5 | Effect BR-703-01 không lọc `doneRef` | 0 | Đúng như dự đoán: bộ lọc này không bao giờ chạy tới (thẻ 03) |
| M7 | Tủ không có món tính tiền không ghi vào done | 0 | Chưa có test phủ (thẻ 02). Hệ quả nhỏ, vì máy chủ không liệt kê tủ đó: chỉ có nút căn đang ở hiện lại |
| M8 | Bỏ dòng `if (!stdForCabinet …) return` | 0 | Đúng thiết kế #67: nút `busy` đã khóa khung hình đó, dòng này là lớp chặn thứ hai |
| M9 | Như mục 4 | 1 | – |
| M10 | Như mục 4 | 2, cộng 9 ca khác của 2 tệp | – |

**Dưới tải.** Chạy cùng lúc P tiến trình `npx vitest run <4 tệp trên>`, lặp R vòng, 33 ca mỗi lượt:

| Mức (P × R) | Load 1 phút | Lượt đỏ |
|---|---|---|
| 12 × 2 | 13 – 43 | 0/24 (792 ca) |
| 16 × 2 | 40 – 89 | 0/32 (1.056 ca) |

**E2E.**
- `b14-fridges.s5.spec.ts` (TC-L4-138) đã chấp nhận nhóm chọn tủ ẩn (`'hidden'`) sau tủ đầu, nên tương thích.
- Job `E2E smoke` của CI chạy desk-clock, nên spec này sẽ chạy trong điều kiện 1.
- ARC không chạy stack E2E. QA chạy lại RG-21 (UNIT và E2E giữ bản tóm tắt) như FE đề nghị.

## 6. Thẻ feedback

### FB-R4-ARC-FE-PR81-01
- Mức độ: Minor. Không chặn gộp. Đề xuất làm ở v1.0.5.
- Vị trí: `CheckOutPage.tsx`:
  - `doneRef`/`doneCabinets` (dòng 210–217);
  - `cabinets` (dòng 522);
  - `goNextCabinet` (dòng 760);
  - nhánh lỗi của B18 (`if (!out)`, dòng 893).
- Vấn đề: tập "tủ đã đếm" giữ nguyên suốt lần mở trang. Nó che tủ cả khi máy chủ báo tủ đó **lại** cần đếm, và cả khi bản tóm tắt chưa từng về:
  - G-FE-042-2: tủ có `new_fill` sau lần đếm, và không phải tủ hiện cuối, không bao giờ hiện lại. B18 trả 409 kèm câu "Làm bước 1 trước khi hoàn tất", nhưng bước 1 không có tủ đó. `main` tự gỡ được, PR thì phải tải lại trang (mục 3.2);
  - D2: bản tóm tắt đầu chưa về hoặc lỗi khi lần đếm đầu xong. Lễ tân phải đếm lại tủ đã đếm mới tới được tủ còn lại (mục 3.3).
- Vì sao quan trọng:
  - Không sai tiền, vì B18 là chốt cuối.
  - Lễ tân bị kẹt đúng lúc khách đứng chờ, và câu lỗi dẫn về sai chỗ. Đường D2 dễ gặp hơn khi mạng yếu.
- Đề xuất sửa (FE chọn cách làm):
  - **Cách (a), đủ cho cả hai đường.** Khi B18 trả 409 `MINIBAR_NOT_CHECKED`, chờ bản tóm tắt đọc lại sau lỗi đó (dòng 894 đã gọi `sum.reload()`). Khi bản đó về (`ready`):
    - xóa tập tủ đã đếm và mở lại `cabinetSettled`;
    - về bước ① với tủ đầu tiên máy chủ còn liệt kê.

    Cách này không mở lại race của BUG-R4-042. Bản tóm tắt này được gửi sau mọi lần đếm, nên tủ đã đếm chỉ có trong danh sách khi máy chủ đòi đếm lại. Lúc đó màn đã có câu "Cần đếm lại" theo `reason`.
  - **Cách (b), tổng quát hơn.** Một tủ chỉ là "đã đếm" cho tới khi có bản tóm tắt **được gửi sau** lần đếm đó về.
    - `useResource` bỏ mọi câu trả lời cũ hơn lần `reload()` cuối (`seq`). Vì vậy trạng thái `ready` sau `sum.reload()` luôn là bản đọc sau lần đếm.
    - Cách này phải xử lý thêm trường hợp tủ trên màn không còn trong danh sách.
  - Thêm 1 ca test theo mục 3.2. Trên mock: tăng `minibarPeriods` thêm 1, xóa `minibarChecks`, thêm khóa vào `minibarNewFill`.
  - Nếu dời sang v1.0.5:
    - QA ghi thành lỗi (ARC đề xuất P3, vì có cách làm tạm);
    - sổ tay H16 thêm 1 dòng: "Hoàn tất báo Chưa kiểm minibar mà bước 1 không còn tủ nào cần đếm: tải lại trang Trả phòng."
  - Sửa câu G-FE-042-2 trong báo cáo FE: ghi rõ `main` gỡ được ngay trên trang, còn với PR thì phải tải lại trang.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR81-02
- Mức độ: Minor. Không chặn gộp. Chỉ thêm test, nên làm ngay trong PR nếu kịp.
- Vị trí: `bug-r4-042-fea.test.tsx`.
- Vấn đề:
  - G-FE-042-1 là giả định có dính tiền: đây là đường duy nhất còn lại để gửi đếm lại một tủ đã đếm. Hiện chưa có test cho nó.
  - Nhánh "không có món tính tiền thì ghi vào done" cũng chưa có test: M7 không làm ca nào đỏ.
- Đề xuất: thêm ca "Quay lại" như mục 3.1.
  - Các bước: chọn 202 trước, rồi 402 (1 bia), sang bước ②, bấm Quay lại.
  - Kiểm: dòng tên tủ ghi "Căn 402 (đã chuyển đi)", bia dùng 1, nhóm chọn tủ ẩn.
  - Bấm Tiếp tục, rồi kiểm: lệnh thứ ba `[402, 201]` có `lines` giống lệnh thứ hai; folio vẫn `[[402, 35.000]]`.
  - ARC đã chạy ca này: xanh trên nhánh, đỏ trên `main` ở dòng tên tủ.
  - Ca cho nhánh không có món tính tiền: FE tự quyết. Giá trị thấp, vì máy chủ không liệt kê tủ đó.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR81-03
- Mức độ: Suggestion (nit).
- Vị trí:
  - `latestSummary` (dòng 440–443) và chú thích trong `goNextCabinet`;
  - bộ lọc trong effect BR-703-01 (dòng 428–430);
  - `cabinetNo` (dòng 534–539).
- Vấn đề:
  - **Chú thích về ref chưa chính xác.** Chú thích nói ref "không bao giờ cũ hơn lần render lúc bấm", vì React chạy effect bị động trước sự kiện bấm. Với React 18, điều này không được bảo đảm:
    - effect bị động của một commit không do thao tác người dùng (ví dụ câu trả lời fetch) chạy ở một task sau, và lần bấm có thể rơi vào khe giữa hai task;
    - sau `await` thì đúng, vì lúc đó effect đã chạy. Nhưng nhánh `!chargeable` gọi `goNextCabinet` ngay trong lúc bấm;
    - nếu trúng khe, tủ kế tiếp được chọn theo bản tóm tắt cũ hơn một lần. Thiếu tủ thì B18 chặn. Không sai tiền, và rất hiếm.
  - **Bộ lọc thừa.** Bộ lọc `!doneRef.current.has(...)` trong effect BR-703-01 không bao giờ chạy tới. `doneRef` chỉ có phần tử sau khi `saveMinibar` đã đặt `cabinetSettled`, mà effect dừng ngay khi `cabinetSettled` đã đặt (M5 không làm ca nào đỏ).
  - **Số căn dự phòng sai.** Khi không tìm được tủ, `cabinetNo` rơi về `room` (căn đang ở). Điều này trái với chú thích "never the room of today for another cabinet".
- Đề xuất:
  - dùng `useLayoutEffect` cho `latestSummary`, vì nó chạy ngay trong commit nên đóng được khe; sửa chú thích theo;
  - ghi rõ bộ lọc kia là lớp phòng thủ, hoặc bỏ;
  - cho `cabinetNo` rơi về `''` thay vì `room`.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR81-04
- Mức độ: Suggestion. Lỗi có từ trước PR.
- Vị trí: nhóm chọn tủ `Seg` (dòng 1260–1278) và `goNextCabinet`.
- Vấn đề: trong lúc lệnh đếm tủ A còn chạy, lễ tân vẫn bấm được nhóm chọn tủ.
  - Lượt ở có từ 3 tủ (2 lần B14): lễ tân chọn tủ C và gõ số. Khi A nhận 201, `goNextCabinet` chuyển sang tủ "đầu tiên chưa đếm" (B), và số đã gõ trên C bị bỏ.
  - Nếu A nhận lỗi 4xx, câu lỗi hiện trên màn của một tủ khác.
  - `main` cũng như vậy.
- Đề xuất: thêm `disabled={minibarAct.busy}` cho `Seg`. DS đã có prop `disabled`.
- Trạng thái: Open (FE-A)

## 7. Điểm làm tốt
- FE tìm ra đúng lý do "đọc bản tóm tắt mới nhất" thôi là chưa đủ: `useResource` vẫn giữ dữ liệu cũ trong lúc tải lại. FE chọn cách không phụ thuộc thời điểm mạng, và giải thích rõ vì sao không chờ bản mới.
- Chỉ có một nguồn cho tủ đã đếm: `counted` lấy từ bản chuẩn đã đọc, và dùng chung cho body POST và tập done.
- Bằng chứng đủ và tái lập được:
  - test tất định nhờ cổng giữ bản tóm tắt;
  - gỡ từng phần sửa thì đỏ đúng ca;
  - ca đối chứng xanh trên `main`, như dự đoán.

  ARC chạy lại và ra đúng mọi con số FE báo.

## 8. Dòng `decision-log.md` đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – #81 @ `054d40c0` (BUG-R4-042): ĐẠT CÓ ĐK.** Điều kiện: CI xanh, gồm `E2E smoke`; nếu phải rebase vì PR chữ khác thì sinh lại bằng `gen_strings.py`, không sửa tay tệp sinh. Chấp nhận G-FE-042-1: Quay lại thì đếm lại được tủ đang hiện, tủ có tên, gửi cùng số thì folio không đổi. G-FE-042-2 an toàn về tiền nhưng làm lễ tân kẹt trên trang → FB-R4-ARC-FE-PR81-01 (Minor, đề xuất v1.0.5: khi B18 trả `MINIBAR_NOT_CHECKED` thì đặt lại tập tủ đã đếm theo bản tóm tắt mới; cách làm tạm trong sổ tay: tải lại trang). FB-PR81-02 (Minor, thêm test Quay lại); 03, 04 (Suggestion) | ARC | Ca race đỏ tất định trên `main`, xanh trên nhánh; gỡ từng phần sửa thì đỏ đúng ca; 3 ca đổi neo vẫn đỏ ở điều kiện gốc (M9, M10); admin-web 938/938; tải 16 × 2: 0/32 lượt đỏ |
