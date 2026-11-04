# ARC review – PR #67 BUG-R4-035: race điền sẵn minibar ở H16 (P1)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Đối tượng: `v104/fix-s4-144-flake` @ `5f3649f1`. Một commit, cắt từ `main` `58183764`. Đọc bằng `git diff 58183764...5f3649f1`.
- Tệp trong PR:
  - `CheckOutPage.tsx`;
  - test mới `v104-minibar-prefill-fea.test.tsx`;
  - 3 tệp test cũ: `checkout.test.tsx`, `s4-144-fea.test.tsx`, `s4-416-fea.test.tsx`.
- Đọc kèm:
  - `hooks/useResource.ts`;
  - `packages/ui/src/Button.tsx` (`busy` thì `disabled`);
  - `checkout.service.ts` (blocker và `MINIBAR_NOT_CHECKED`);
  - OpenAPI `MinibarStandard`: `roomId` "server luôn trả".
- CI lúc review:
  - đã xanh: `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `no test endpoints`;
  - còn **chờ**: `format · lint · audit · test · build`, `landing`.

## Phán quyết: **ĐẠT CÓ ĐK**

Điều kiện gộp:
1. CI xanh.
2. Sau khi FE-A merge `main` (đã có #64) và giải xung đột `CheckOutPage.tsx`, **ARC xem lại commit merge**, theo mục 4.
3. Toàn bộ vitest admin-web xanh trên mã đã merge. Riêng `v104-minibar-prefill-fea` (4 ca) và `v104-checkout-feb` (14 ca) phải xanh cùng lúc.

Thẻ 01 (Minor) không chặn gộp. ARC đề nghị làm luôn trong commit merge, vì FE-A đằng nào cũng phải sửa tệp này.

## 1. Cách sửa có đóng được lỗi không

| Đường race | Trước | Sau | Kết luận |
|---|---|---|---|
| s4-144: bản chuẩn vừa đọc xong, "Tiếp tục" được bấm trước khi effect chép số điền sẵn vào state | Gửi `left = {}`, rơi về `standardQty`, tức tủ đầy ("không dùng gì"), làm đảo khoản minibar đã tính | `prefill = useMemo(minibarPrefill(std.state.data))` tính ngay khi render. Khung hình đầu tiên hiện tủ đã giữ đúng số sẽ gửi | Đóng |
| BUG-R4-035: sau B14 hoặc khi đổi tủ, dữ liệu B về nhưng state vẫn giữ số đã sửa trên tủ A | Gửi `roomId` của B với số của A | Số sửa gắn với **đúng đối tượng** bản chuẩn: `edits.of === std.state.data`. Dữ liệu khác thì chỉ dùng `prefill` của B | Đóng |
| Bấm khi chưa đọc xong (chưa có `items`, nên `chargeable = false`) | Bỏ qua lần đếm, sang tủ hoặc bước kế | `busy = minibarAct.busy \|\| stdLoading`. DS `Button` `busy` thì `disabled`, nên không bấm được | Đóng cho trạng thái `loading`. Trạng thái `error`: xem thẻ 01 |
| Đọc lại vì `MINIBAR_PERIOD_CHANGED` | Effect ghi đè số đã sửa | Đối tượng mới thì bỏ số sửa. Đúng ý: số gõ cho kho cũ không áp sang kỳ mới | Giữ đúng hành vi |

Điểm kiểm thêm:
- **Thứ tự hook:**
  - `useMemo` và `useState(edits)` nằm ngay sau `std` (khoảng dòng 176–195);
  - effect cũ bị bỏ;
  - không thêm hook nào sau các lệnh `return` sớm.
- **Payload luôn nhất quán.** `items`, `left`, `roomId`, `periodId` đều lấy từ cùng một `std.state.data`. Máy chủ còn chặn thêm bằng 409 khi tủ hoặc kỳ lệch (ARC 16.16/16.19).
- **Không có đường nào thay dữ liệu mà âm thầm bỏ số sửa:**
  - `std.mutate` không được dùng;
  - `std.reload` chỉ có ở hai chỗ: nhánh `MINIBAR_PERIOD_CHANGED` và nút Thử lại của `ErrorBlock`;
  - mã cũ (effect theo `[std.state.data]`) cũng bỏ số sửa ở đúng các trường hợp đó, nên không có thay đổi hành vi.
- **Test:**
  - 4 ca mới, có cổng `holdStandard()` để bấm đúng khung hình;
  - FE báo đỏ 3/3 lần trên mã cũ, và 0/36 lần với 6 tiến trình song song;
  - 3 tệp cũ chỉ đổi `getByRole` thành `await findByRole` cho nút "Tiếp tục". Lý do: trong lúc đọc, nhãn nút là `common.loading`. Không đổi điều kiện kiểm. Đúng.

## 2. Thẻ feedback

### FB-R4-ARC-FE-PR67-01
- Mức độ: Minor. Không chặn gộp; nên làm trong commit merge.
- Vị trí: `CheckOutPage.tsx`, gồm `stdLoading`, nút "Tiếp tục" ở bước ①, và `saveMinibar()`. Trong `saveMinibar`, nhánh `!chargeable` chạy **trước** điều kiện `std.state.status !== 'ready'`.
- Vấn đề: "đã sẵn sàng" hiện chỉ nghĩa là "không đang tải". Còn hai khe, cùng họ với race vừa sửa:
  - (a) **Đọc bản chuẩn lỗi khi chưa có dữ liệu.**
    - `stdLoading = false`, nên nút bấm được. `items = []` nên `chargeable = false`, và lần đếm bị bỏ qua: trang sang tủ kế hoặc bước ②.
    - Không mất tiền, vì máy chủ chặn B18 bằng `MINIBAR_NOT_CHECKED` (`checkout.service.ts` dòng 1223). Nhưng lễ tân bị đưa tới ngõ cụt ở bước ③.
  - (b) **Khung hình cũ khi đổi tủ không qua thao tác bấm.** Có hai đường như vậy:
    - `setCabinet(next)` chạy sau `await` trong `saveMinibar`;
    - B14 làm `hereRoomId` đổi khi đơn được đọc lại.

    Vì `useResource` đặt `loading` trong effect, có một khung hình đã vẽ mà `countingRoomId = B` trong khi `std` vẫn `ready` với dữ liệu của A. Tiêu đề hiện tủ B, còn hàng và số là của A.
    - Bấm lúc đó sẽ gửi lại lần đếm của A. Payload vẫn nhất quán với A, nên không sai tiền.
    - Nhưng `nextCabinet(counted = B)` coi B là đã đếm, nên thứ tự tủ bị rối. Đường bấm chọn tủ là sự kiện rời rạc (React flush effect đồng bộ), nên không gặp khe này.
- Đề xuất:
  - Dùng một điều kiện thay cho `stdLoading`:
    ```ts
    const stdForCabinet =
      std.state.status === 'ready' && std.state.data.roomId === countingRoomId;
    ```
    `MinibarStandard.roomId` luôn có, theo hợp đồng 0.3.7 bổ sung 4.
  - Nút: `busy` khi `std.state.status === 'loading'` hoặc khi dữ liệu không phải của tủ trên màn; `disabled` khi `error` (đã có `ErrorBlock` kèm Thử lại ở trên).
  - `saveMinibar()`: dòng **đầu tiên** là `if (!stdForCabinet) return;`, trước nhánh `!chargeable`.
  - Thêm 1 ca test: `minibar-standard` trả 500, bấm "Tiếp tục", thì không `setStep`, không POST, và trang vẫn ở bước ①.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR67-02
- Mức độ: Suggestion (nit)
- Vị trí: `CheckOutPage.tsx`, chỗ chèn `minibarPrefill`.
- Vấn đề: `minibarPrefill` và JSDoc của nó được chèn **giữa** JSDoc của `CheckOutPage` ("… a credit balance needs a handling choice …") và `export function CheckOutPage`. JSDoc của trang vì thế treo trên một hàm khác.
- Đề xuất: chuyển `minibarPrefill` lên trên khối JSDoc của `CheckOutPage`, ví dụ ngay sau `lateFeeNotAllowed`.
- Trạng thái: Open (FE-A)

## 3. Không có thẻ chặn
Không thấy lỗi tiền hay lỗi ghi sai tủ nào còn lại trong phần PR sửa.

## 4. Việc ARC sẽ kiểm ở commit merge (sau #64)
Cả #64 và #67 cùng sửa `CheckOutPage.tsx` ở các vùng gần nhau:
- import: `#64` thêm `ApprovalRequest`, `ApprovalStatus`, `listApprovals`; `#67` thêm `MinibarStandard`, `useMemo`;
- vùng hàm mức tệp: `#64` thêm `earlyDepartureRefundPending`; `#67` thêm `minibarPrefill`;
- vùng hook quanh dòng 170–300: `#64` thêm `edRefund`; `#67` thêm `prefill`/`edits` và bỏ effect cũ;
- footer bước ①/③.

ARC sẽ kiểm:
1. **Mọi hook nằm trước mọi `return` sớm.** Hook gồm `prefill`, `edits`, `edRefund`. `return` sớm gồm `if (!r…)` và nhánh "trước ngày đi" của #64.
2. **Effect cũ không quay lại** khi giải xung đột: không còn `setLeft`.
3. Nhánh `if (!done && r.status === 'in_house' && today < stayDeparture …)` của #64 vẫn nằm sau mọi hook.
4. Nút "Tiếp tục" vẫn có `busy` của #67 (và điều kiện của thẻ 01 nếu đã làm).
5. Hai bộ test của hai PR xanh cùng lúc trên mã đã merge.

## 5. Điểm làm tốt
- Sửa tận gốc: tính số trong lúc render, không vá thời điểm của effect.
- Gắn số sửa với đối tượng bản chuẩn: ít trạng thái, không cần `useEffect` dọn dẹp.
- Test bấm đúng khung hình bằng cổng `holdStandard()`, nên tái hiện race một cách tất định, không dựa vào may rủi.

---

## Lượt 2 – commit merge 951d1880

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** (xem lại) | 04/11/2026
- Đối tượng: `v104/fix-s4-144-flake` @ `951d1880`. Đây là commit merge, có 2 cha:
  - `d34c6104`: nhánh, gồm `5f3649f1` và phần sửa thẻ UXD PR67-01, ARC PR67-01/02;
  - `9fded27f`: `main` sau #64, đã có #61, #62.
- `main` hiện đã ở `c2506a53` (#63). #63 chỉ sửa tài liệu, không đụng `product/apps`, `product/packages`, `product/services`.
- Cách kiểm: ARC tự chạy, không dựa vào báo cáo FE-A. Dùng 2 worktree tạm trong scratchpad (đã xóa), cài `pnpm install --frozen-lockfile --offline`.
- Prompt giao việc có nhắc `aca63a0`. Mã này không có trong repo. Phần sửa sản phẩm của PR nằm ở `5f3649f1` và `d34c6104`, nên ARC đảo cả hai.

### Phán quyết lượt 2: **ĐẠT CÓ ĐK**

Bản thân commit merge làm đúng: không thêm gì vào `CheckOutPage.tsx` ngoài phần git tự gộp, thứ tự hook đúng, và `onDay` không làm yếu điều kiện kiểm. Nhưng khi chạy dưới tải, 2 ca mới của PR **đỏ ngẫu nhiên**: 5/24 lần trên mã merge, 6/24 lần trên `d34c6104`. Nguyên nhân là một lỗi cũ có từ 18/10 (thẻ 03). PR này sinh ra để dẹp một ca đỏ ngẫu nhiên (s4-144). Gộp vào lúc này thì dẹp được một ca nhưng đưa thêm hai ca mới vào `main`.

Điều kiện gộp:
1. Làm thẻ **FB-R4-ARC-FE-PR67-03** (Major) ngay trên nhánh này, trước khi gộp.
2. Chạy lại dưới tải ít nhất 12 tiến trình × 2 lượt cho `v104-minibar-prefill-fea` + `s4-144-fea`, được 0 lần đỏ. Ghi **đúng lệnh đã chạy** vào `FE-PR67.md`.
3. CI xanh ở head mới, gồm cả `docker images build · E2E smoke`.
4. Không cần ARC xem lại lần 3 nếu commit sửa chỉ đụng vùng nêu trong thẻ 03. Đụng ra ngoài vùng đó thì báo ARC.

### 1. Phần FE-A tự sửa trong commit merge (`git show --remerge-diff 951d1880`)

So với kết quả git tự gộp, commit merge chỉ sửa 2 tệp:

| Tệp | Phần sửa tay |
|---|---|
| `__tests__/v104-minibar-prefill-fea.test.tsx` | Thêm helper `onDay(day, hhmm)`, gọi ở 4 chỗ: trong `countedThenExtended()` (2 ca s4-144 dùng chung), trong ca BUG-R4-035, ca UXD PR67-01 và ca ARC (b). Mỗi lần gọi đặt đồng hồ sang ngày đi, 11:00, **sau** bước dựng dữ liệu (B13/B14) và **trước** khi mở H16 |
| `rounds/round-04/responses/FE-PR67.md` | Thêm mục "Merge `main` sau #64" |

- `CheckOutPage.tsx`, `s4-144-fea.test.tsx` và `checkout.test.tsx` là kết quả git tự gộp, không có xung đột chữ. Đúng như FE-A báo.
- Kiểm chéo, so từng tệp:
  - các dòng thay đổi của `58183764..d34c6104` (PR) trùng với `9fded27f..951d1880`;
  - các dòng thay đổi của `58183764..9fded27f` (#64, #61, #62) trùng với `d34c6104..951d1880`;
  - chỉ có `v104-minibar-prefill-fea.test.tsx` khác, và khác đúng ở phần `onDay`.

  Kết luận: không mất dòng nào của hai bên.

### 2. Năm điểm ARC đã hẹn kiểm (mục 4 lượt 1)

| # | Điểm kiểm | Kết quả trên `951d1880` |
|---|---|---|
| 1 | Mọi hook nằm trước mọi `return` sớm | Đạt. Mọi lời gọi hook nằm ở dòng 166–461: `prefill` 212, `edits` 217, `edRefund` 299, effect BR-703-01 ở 405, `debTypedKey` 421, effect VietQR 425. Các `return`: lần lượt `if (!r && error)` 463, `if (!r)` 477, nhánh "trước ngày đi" của #64 ở 506, `if (done)` 1138, `return` chính 1832. Tìm `use[A-Z]…(` từ dòng 463 đến 1998: không có kết quả |
| 2 | Effect cũ không quay lại | Đạt. Không còn `setLeft`, không có effect nào chép `std.state.data` vào state |
| 3 | Nhánh "trước ngày đi" của #64 nằm sau mọi hook | Đạt (dòng 506). Khi ngày đổi hoặc khi `postMidnightWindow` xuất hiện, trang chuyển từ nhánh này sang 3 bước mà số hook vẫn giữ nguyên |
| 4 | Nút "Tiếp tục" giữ `busy` | Đạt: `busy={minibarAct.busy \|\| stdWaiting}`, `disabled={std.state.status === 'error' && !stdForCabinet}`. Dòng đầu của `saveMinibar` là `if (!stdForCabinet) return;` (dòng 700), đứng trước nhánh `!chargeable` |
| 5 | Hai bộ test xanh cùng lúc | Đạt khi chạy một lần: `v104-minibar-prefill-fea` 7/7, `v104-checkout-feb` 14/14, `s4-144-fea` 12/12. Cả admin-web: 79 tệp / **901/901**. `tsc --noEmit` (admin-web, ui), `eslint` và `prettier --check` trên 3 tệp sản phẩm/test đều đạt. **Chạy dưới tải thì không đạt**: xem thẻ 03 |

Hai thẻ lượt 1 đã được làm, ARC đã kiểm trên mã:

| ID | ARC xác nhận |
|---|---|
| FB-R4-ARC-FE-PR67-01 | Done. Có `stdForCabinet` với điều kiện `roomId` của dữ liệu trùng tủ trên màn; có guard ở dòng đầu `saveMinibar`; có ca (a) và (b) |
| FB-R4-ARC-FE-PR67-02 | Done. `minibarPrefill` nằm trên JSDoc của `CheckOutPage`, ngay sau `lateFeeNotAllowed` |

### 3. `onDay` có làm yếu điều kiện kiểm không

Thí nghiệm trên worktree tạm. Mọi lần đều giữ nguyên tệp test của commit merge, chỉ đổi mã sản phẩm, rồi chạy `v104-minibar-prefill-fea`:

| Mã sản phẩm | Kết quả | Ca đỏ ở dòng nào, vì sao |
|---|---|---|
| `951d1880` (đã sửa) | 7/7 xanh | – |
| `CheckOutPage.tsx` + `Controls.tsx` lấy từ `9fded27f`, tức đảo cả `5f3649f1` lẫn `d34c6104` | **7/7 đỏ** | Dòng 127: gửi `remainingQty = 2`, tức tủ đầy, đúng lỗi s4-144. Dòng 145: không có nút busy. Dòng 264: gửi số 1 đã gõ trên tủ A cho tủ B, đúng BUG-R4-035. Dòng 321: không có `aria-busy`. Dòng 360: nút không bị khóa khi đọc lỗi. Dòng 436: 2 POST thay vì 1. Dòng 457: không có `minibarPrefill` |
| Chỉ đảo `d34c6104` (`git apply -R` phần sản phẩm), giữ `5f3649f1` | 4 xanh / **3 đỏ** | Đỏ đúng 3 ca của thẻ UXD PR67-01 và ARC (a), (b), ở dòng 321, 360, 436. 4 ca của bản sửa gốc vẫn xanh |
| Ngược lại: mã đã sửa + tệp test **trước merge** (`d34c6104`, chưa có `onDay`) | 2 xanh / 5 đỏ | Cả 5 ca đỏ ở lời gọi `findBy…` đầu tiên (không thấy "Tủ căn 201 cần đếm lại", không thấy nhóm "Tủ minibar cần đếm"). Lý do: trang hiện nhánh "trước ngày đi" của #64. Đây đúng là xung đột về nghĩa FE-A nêu |

Kết luận:
- Không có `onDay` thì các ca đỏ **sai lý do**: chúng không chạm tới H16.
- Có `onDay` thì mỗi ca đỏ ở **đúng điều kiện kiểm của nó** khi gỡ phần sửa tương ứng.
- `onDay` chỉ đổi ngày mở trang. Không ca nào bị bỏ hay nới điều kiện kiểm. Không làm yếu.

### 4. CI ở head `951d1880` (`gh pr checks 67`)

Đã xanh:
- `format · lint · audit · test · build` (gồm Vitest với PostgreSQL thật, và Build);
- `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `landing LP-v1`, `no test endpoints`.

Còn **chờ**: `docker images build · E2E smoke`, vì job này chỉ chạy sau job chính.

Hai lần chạy trước, ở `5f3649f1` và `d34c6104`, đều bị huỷ do có commit mới đẩy lên. Vì vậy head này là lần đầu job chính chạy hết.

### 5. Chạy dưới tải: không tái lập được "0 đỏ"

- Lệnh: chạy cùng lúc 12 tiến trình `npx vitest run src/__tests__/v104-minibar-prefill-fea.test.tsx src/__tests__/s4-144-fea.test.tsx`, lặp 2 lượt, tức 24 lần.
- Máy: máy dev, cũng là máy FE-A dùng.

| Mã | Lần đỏ / 24 | Ca đỏ |
|---|---|---|
| `951d1880` | **5** | Ca UXD PR67-01 4 lần, ở dòng 334 (`dec` của 202 bị khóa sau khi danh sách đã mở). Ca BUG-R4-035 1 lần, ở dòng 249 (`pressed` không bao giờ thành `true`) |
| `d34c6104` (trước merge) | **6** | Cùng 2 ca đó: UXD 5 lần, BUG-R4-035 1 lần (số dòng của tệp trước merge: 310, 311, 323 và 240) |
| `951d1880` + bản vá thử của thẻ 03 (chỉ ở worktree tạm) | **0** | – |

Ghi chú:
- Các ca s4-144 (lỗi gốc của PR) **không đỏ lần nào** trong 72 lần chạy.
- Lỗi đã có từ trước merge, nên không do `onDay` gây ra.
- FE-A báo "24 tiến trình 0/48 đỏ" nhưng ARC không tái lập được. Có thể máy lúc đó tải nhẹ hơn, hoặc FE-A chạy bộ test khác. Vì vậy điều kiện 2 yêu cầu ghi đúng lệnh.

### 6. Thẻ feedback

### FB-R4-ARC-FE-PR67-03
- Mức độ: **Major**. Chặn gộp PR này: PR sinh ra để dẹp ca đỏ ngẫu nhiên, nên không được đưa thêm ca đỏ ngẫu nhiên vào `main`.
- Vị trí: `CheckOutPage.tsx`, effect BR-703-01, dòng 404–412:
  ```ts
  if (step === 0 && cabinet === undefined && old) setCabinet(old.roomId);
  }, [s?.minibarUncheckedRooms, hereRoomId]);
  ```
  Ảnh hưởng tới 2 ca: "after B14, switching cabinet…" (UXD PR67-01) và "edit 402 (A), switch to 202 (B)…" (BUG-R4-035) trong `v104-minibar-prefill-fea.test.tsx`.
- Vấn đề:
  - Effect có ghi chú "first summary / reservation only", nhưng thực tế chạy lại **mỗi khi đọc lại summary**, vì `minibarUncheckedRooms` là mảng mới sau mỗi lần đọc.
  - Lễ tân chọn tủ của phòng hiện tại (202) thì `cabinet` thành `undefined`. Nếu sau đó có một lần đọc summary về muộn, trong khi tủ cũ 402 vẫn chưa đếm, effect sẽ tự đặt lại `cabinet = 402`. Lần đọc muộn thường gặp nhất là lần đọc tính theo giờ trả (`qTime`, trễ 300 ms sau summary đầu, cộng thời gian mạng).
  - Cùng lúc đó, `edits` gắn với đối tượng bản chuẩn của 202, nên số lễ tân vừa gõ trên 202 **bị bỏ mà không báo gì**.
  - Test:
    - Dưới tải, lần đọc muộn rơi vào giữa ca test: danh sách vừa mở lại cho 202 thì trang quay về 402. Kết quả là ca UXD đỏ ở dòng 334 (`dec` bị khóa, vì `stdForCabinet` của 402 chưa có).
    - Ca BUG-R4-035 thì không bao giờ thấy dòng của nhân viên buồng phòng ở 202 (`who`), nên đỏ ở dòng 249.
  - Tái hiện tất định:
    - giữ yêu cầu `checkout-summary?checkoutTime=…` lại;
    - chọn 202, đợi 202 đọc xong, nút "Tiếp tục" mở;
    - thả yêu cầu ra.

    Kết quả: `402 aria-pressed = true`, `202 = false`. Trên mã `main` (`9fded27f`) cũng ra đúng như vậy, tức lỗi có từ `feb75035` (18/10), không do PR này.
- Vì sao quan trọng:
  - Tiền: không sai. Payload vẫn nhất quán với tủ trên màn, nhờ `stdForCabinet`, và máy chủ còn chặn 409.
  - Vận hành: ở Đà Lạt mạng có lúc yếu, lần đọc muộn có thể về sau vài giây. Lễ tân thấy trang tự nhảy về tủ cũ và mất số vừa gõ.
  - Kỹ thuật: 2 ca test mới đỏ khoảng 20–25% số lần khi máy tải nặng. Gộp vào thì job test của `main` sẽ đỏ ngẫu nhiên, đúng loại lỗi PR này muốn dẹp.
- Đề xuất sửa (ARC đã thử trên worktree tạm: 24/24 xanh dưới tải, cả admin-web 901/901):
  ```ts
  const [cabinet, setCabinet] = useState<string | undefined>(undefined);
  // BR-703-01: the old room's cabinet is offered first – never over a cabinet the desk picked (a later summary
  // read, e.g. priced for the typed time, used to send the page back to it and drop the figures typed).
  const cabinetPicked = useRef(false);
  …
  useEffect(() => {
    if (!hereRoomId || cabinetPicked.current) return;
    …
  }, [s?.minibarUncheckedRooms, hereRoomId]);
  …
  onChange={(v) => {
    cabinetPicked.current = true;
    minibarAct.reset();
    setCabinet(v === currentRoomId ? undefined : v);
  }}
  ```
  - `useRef` đặt ngay sau `cabinet` (dòng 198), tức trước mọi `return` sớm.
  - Các lần đổi tủ tự động trong `saveMinibar` (dòng 703, 747) giữ nguyên.
  - Thêm 1 ca test tất định, như cách tái hiện ở trên: giữ summary `checkoutTime`, chọn 202, đợi 202 đọc xong, thả summary. Kỳ vọng: 202 vẫn được chọn, số đã gõ trên 202 còn nguyên, nút "Tiếp tục" mở.
  - Báo DOM một dòng: lễ tân vẫn **được phép** đếm tủ phòng hiện tại trước tủ cũ. BR-703-01 chỉ yêu cầu chọn sẵn tủ cũ, không bắt đếm theo thứ tự.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR67-04
- Mức độ: Suggestion (nit), không chặn.
- Vị trí: `v104-minibar-prefill-fea.test.tsx`, các lời gọi `onDay(...)`.
- Vấn đề:
  - `countedThenExtended()` lấy ngày đi qua API (`stayDepartureDate`). Còn 3 ca của Kim lấy `res('Kim Seo-yeon').departureDate` từ bản ghi mock. Trang so với `r.stayDepartureDate ?? r.departureDate`.
  - Hiện hai giá trị trùng nhau, nên ca nào cũng tới H16. Nếu sau này dữ liệu mẫu của Kim có gia hạn con, ca sẽ đỏ ở `findBy…` với lý do khó đọc.
  - Ngoài ra `vi.useFakeTimers` bị gọi 2 lần trong cùng một ca: một lần ở đầu ca, một lần trong `onDay`.
- Đề xuất sửa: dùng `(await api.getReservation(R)).data.stayDepartureDate` cho cả 4 chỗ. Trong `onDay`, chỉ gọi `vi.setSystemTime`, vì đồng hồ đã được giả từ đầu ca.
- Trạng thái: Open (FE-A)

### 7. Điểm làm tốt (lượt 2)
- Phát hiện đúng xung đột về nghĩa: git không báo xung đột, nhưng H16 đã đổi điều kiện ngày. Cách sửa (`onDay`) giống hệt cách #64 sửa cho `s4-144-fea`, và không đổi điều kiện kiểm nào.
- Commit merge sạch: ngoài phần test đó, không sửa tay gì trong mã sản phẩm. Điều đó làm việc rà soát rất nhanh.

---

## Lượt 3 – head ceda9278

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** (xem lại lần 3) | 04/11/2026
- Đối tượng: `v104/fix-s4-144-flake` @ `ceda9278`, gồm 2 commit sau `951d1880`:
  - `5dd00420`: thẻ 03/04;
  - `ceda9278`: Desk cho BUG-R4-038, đi kèm #71 (`v104/fix-internal-added-night` @ `7557e485`).
- Đọc kèm:
  - `FE-PR67.md` trên nhánh, gồm mục "Lệch so với đề xuất của ARC" và "BUG-R4-038 phía Desk";
  - #71: `checkout.service.ts`, `stay-support.ts`, `bug-r4-038-internal-added-night.test.ts`.
- Cách kiểm: ARC tự chạy trên 2 worktree tạm trong scratchpad (đã xóa).

### Phán quyết lượt 3: **ĐẠT**

Gộp được. Hai thẻ lượt 2 đã xong: FB-R4-ARC-FE-PR67-03 và -04, ARC xác nhận Done. Không có điều kiện chặn. Ba việc nên làm, không chặn gộp:
1. Thứ tự gộp: #67 trước, rồi #71 ngay sau. Không deploy staging và không cho QA chạy trên `main` ở giữa hai lần gộp (mục 4).
2. Thẻ 05 (Suggestion) làm sau cũng được.
3. OpenAPI cho #71: đã có bản vá của ARC review #71, BE đang áp vào #71. Bản vá đó còn thiếu 1 điểm, xem mục 8.

### 1. Thẻ 03/04 (`5dd00420`) và phần nằm ngoài vùng ARC đề xuất

| Điểm kiểm | Kết quả |
|---|---|
| Vị trí `cabinetSettled` | Đạt. `useRef` ở dòng 202, trước `return` sớm đầu tiên (dòng 471). Từ dòng 471 tới hết `CheckOutPage` (dòng 2013) không có lời gọi hook nào |
| Ref được đặt trong `editLeft` (ngoài đề xuất) | Đạt. `editLeft` chỉ được gọi từ thao tác của lễ tân: `Stepper` (dòng 1303) và "Tất cả còn đủ" (dòng 1885). Không có lời gọi tự động nào nên không khóa effect ngoài ý muốn |
| Ref được đặt khi effect tự chọn lần đầu (ngoài đề xuất) | Đạt. Effect chỉ chọn sẵn tủ cũ một lần, đúng ý BR-703-01 |
| Ca biên: lễ tân gõ trên tủ phòng hiện tại trước khi summary có tủ cũ về | Tủ cũ không được chọn sẵn nữa. Vẫn an toàn: tủ cũ vẫn có trong nút chọn tủ; `nextCabinet` dẫn tới tủ đó sau khi ghi số; máy chủ còn chặn B18 bằng `MINIBAR_NOT_CHECKED`. Không có đường nào bỏ sót tủ |
| Đảo `CheckOutPage.tsx` về `951d1880`, giữ test mới | Ca mới (thẻ 03) **đỏ** ở dòng 478 (`202 aria-pressed`). 7 ca khác xanh |
| Thẻ 03 | Done. Effect BR-703-01 chỉ chọn sẵn tủ cũ một lần, và không bao giờ đè lên tủ lễ tân đã chọn hoặc đã gõ số. Có ca test tất định |
| Thẻ 04 | Done. `onDay` chỉ còn gọi `vi.setSystemTime`; `onDepartureDay(R)` đọc `stayDepartureDate` từ API; phần dựng dữ liệu cho Kim gom vào `kimAfterB14()` |

### 2. Đổi chỗ bắt đầu `MutationObserver` ở ca race 1 có làm yếu test không

- Không làm yếu. `holdStandard()` được gọi trước `renderApp` và giữ **mọi** lần đọc `minibar-standard` tới lúc `release()`. Vì vậy hàng của tủ không thể hiện ra trước `release()`. Observer bắt đầu theo dõi ngay trước `release()`, nên vẫn bắt được khung hình commit có race.
- Kiểm bằng cách đảo: lấy `CheckOutPage.tsx` + `Controls.tsx` của `9fded27f`, chạy riêng ca 1 ba lần. Kết quả **3/3 đỏ**, cùng ở dòng 162: `remainingQty` = 2, tức gửi tủ đầy, đúng lỗi s4-144.

### 3. BUG-R4-038 phía Desk (`ceda9278`) so với #71

| Quy tắc máy chủ trong #71 | Desk ở `ceda9278` | Khớp |
|---|---|---|
| Đơn Nội bộ: `addedNightRate` trả `rateVnd = 0`, `complimentary`, không có sàn/trần. Summary trả `lateFeeAsNightVnd = defaultRateVnd = 0` khi đêm không bán được | `lateFeeFree = lateFeeAsNight === 0`. Ô giá đêm không có sàn/trần thì không kiểm khoảng giá, như trước | Có |
| B18 `freeNight`: không báo `LATE_CHECKOUT_AFTER_LIMIT`; gửi `lateFeeInsteadOfNight` thì 422: `NOT_ALLOWED`, hoặc `AMOUNT_NOT_POSITIVE` khi `amountVnd = 0` | `lateFee` là `undefined` khi `!lateFeeMode`. `extraNight` chỉ gửi khi đêm còn bán được. Test ca 1 kiểm body không có 2 trường này | Có |
| B18 `surcharge = 0`: khoản phụ thu trả muộn cũ (B15) bị đảo (dòng 1134). `dueAtCheckout` với `newVnd = 0` trừ `old.grossVnd − old.focVnd` | `dueAtCheckout` lấy `amountDueAtCheckoutVnd` của máy chủ, không lấy số dư folio. Test ca 2: 2.460.000 đ, không phải 2.672.000 đ. Sau B18: `balanceDueVnd = 0`, `creditVnd = 0` | Có |
| Mức trần QR `amountDueForQr`: `newVnd = 0` dù cờ `lateFeeAsNight` bật hay tắt | Desk gửi `lateFeeAsNight: undefined` (vì `!lateFeeMode`). Mức trần trùng với số trên summary | Có |
| Không có tiền thừa giả | Trả đủ số máy chủ thì folio còn đúng khoản phụ thu cũ. `credit = credit0 − lateDelta − balanceDue = 0`, nên không bị đòi lý do tiền thừa | Có |
| Kênh khác (phí lớn hơn 0) | Giữ nguyên ESC-031: ô "Ghi phụ thu" hoặc xác nhận quản lý. Ca đối chứng Direct xanh | Có |

- Kiểm bằng cách đảo: lấy `CheckOutPage.tsx` của `5dd00420`, giữ mock và test mới.
  - Ca 1 **đỏ** ở dòng 100: vẫn hiện "không thêm đêm được".
  - Ca 2 **đỏ** ở dòng 151: Desk hiện 2.672.000 đ thay vì 2.460.000 đ.
  - Ca 3 (đối chứng Direct) xanh.
- Ca biên (máy chủ trả 0 cho một đơn **không phải** Nội bộ, chỉ xảy ra khi dữ liệu giá lỗi):
  - Desk mở nút, B18 trả 422 `LATE_CHECKOUT_AFTER_LIMIT`. Trước đây Desk khóa nút.
  - Cả hai cách đều là ngõ cụt có báo lỗi, không ghi gì, không sai tiền. Chấp nhận được.
- Mock `stay.ts` làm đúng 4 quy tắc trên của #71.
  - Một chỗ lệch có từ trước, không thuộc PR này: Direct gửi `rateVnd = 0` thì mock trả `RATE_OUT_OF_RANGE`, còn máy chủ trả `AMOUNT_NOT_POSITIVE`.
- Ghi chú cho DOM, không phải thẻ: với đơn Nội bộ có giá, phụ thu tăng theo giờ rồi về 0 sau mốc cuối (15:00 = 90.000, 19:00 = 0). Đây là số của DOM (BR-421-08…11), ARC chỉ ghi lại để DOM xác nhận đó là chủ ý.

### 4. Thứ tự gộp #67 và #71

- **Chữ:** hai PR không đụng chung tệp. #71 chỉ sửa `services/api` và `tests/fixtures`; #67 chỉ sửa `apps/admin-web` và `packages/ui`. ARC gộp thử `ceda9278` + `origin/main` (`ea979fe7`) + #71 (`7557e485`): không xung đột. Phần `apps/admin-web` và `packages` sau khi gộp giống hệt `ceda9278`.
- **Nghĩa:** cả hai thứ tự đều không sai tiền và không ghi sai dữ liệu. Chỉ có khe vận hành ngắn:
  - **#67 trước:** máy chủ cũ tính đêm thêm của đơn Nội bộ theo lịch Direct (`addedNightRate` chưa có nhánh `complimentary`), nên phí lớn hơn 0 và Desk đi đường `lateFeeMode` như cũ. Ngoại lệ: nếu đêm tham chiếu thỏa thuận bằng 0 thì máy chủ cũ có thể trả 0. Khi đó Desk mở nút và nhận 422, thay vì khóa sẵn.
  - **#71 trước:** máy chủ trả 0 nhưng Desk trên `main` chưa có `lateFeeFree`. Đơn Nội bộ trả sau mốc cuối, đêm đã bán, sẽ bị **khóa "Hoàn tất"** cho tới khi #67 được gộp.
- Đề xuất: gộp **#67 trước, rồi #71 ngay sau**, và không deploy staging hay cho QA chạy trên `main` ở giữa hai lần gộp.

### 5. CI (`gh pr checks 67` @ `ceda9278`)

- Xanh hết: `format · lint · audit · test · build`, `docker images build · E2E smoke`, `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `landing LP-v1`, `no test endpoints`.
- Ba job deploy/publish `skipping`, đúng với PR. Trạng thái gộp: `MERGEABLE` / `CLEAN`.
- CI của #71 cũng xanh hết.

### 6. Chạy test trên máy ARC

- Trên `ceda9278`:
  - `tsc --noEmit` (admin-web), `eslint` và `prettier --check` trên 4 tệp của PR: đạt;
  - từng tệp riêng: `v104-minibar-prefill-fea` 8/8, `bug-r4-038-fea` 3/3.
- Cả admin-web: **904/905** ở lần chạy sạch nhất. Ca đỏ duy nhất là `s2-fix` A-20 (H09 OTA quá sức chứa), không thuộc PR, chạy riêng thì 8/8.
- Lần chạy đầu: 898/905. Lần đó ARC chạy cùng lúc với `tsc`/`eslint`, còn máy có khoảng 70 tiến trình vitest của các agent khác (load average khoảng 80 trên 10 CPU). 6 tệp đỏ khi chạy lại riêng thì 57/57 đạt. Cả 2 lần đều chỉ đỏ ở chỗ chờ trang tải (hết thời gian), không có ca nào đỏ ở điều kiện kiểm.

### 7. Chạy dưới tải (mức ARC: 12 tiến trình × 2 lượt)

Máy dev dùng chung với các agent khác. Lúc ARC chạy, máy có 57–112 tiến trình vitest khác, load average 70–92 trên 10 CPU, tức tải nặng hơn lượt 2. Vì vậy ARC chạy kèm đối chứng ở mức tải tương đương.

| Mã | Tệp | Tải lúc chạy | Lần đỏ / 24 | Ca đỏ |
|---|---|---|---|---|
| `ceda9278` | `v104-minibar-prefill-fea` + `s4-144-fea` | khoảng 64 tiến trình khác, load 70–80 | **0** | – |
| `951d1880` (đối chứng, trước thẻ 03) | như trên | 101–112 tiến trình khác, load 79–88 | 14 | Lượt 1 (load 88): 12/12 đỏ, phần lớn do hết 15 s ở `s4-144-fea` và do chờ lần tải đầu. Lượt 2 (load 79–81, tương đương `ceda9278`): 2/12 đỏ, ở dòng 110 (chờ lần tải đầu của ca race 1, đúng chỗ FE-A đã sửa observer) và dòng 249 (BUG-R4-035, đúng cơ chế của thẻ 03) |
| `ceda9278` | `bug-r4-038-fea` | 99–107 tiến trình khác, load 85–92 | 11 | Chỉ ca 1 đỏ, và đều ở lần chờ tải trang đầu tiên: dòng 92 (`findByRole` "Tiếp tục: Phụ phí" quá 5 s) 10 lần, hết 15 s 1 lần. Không ca nào đỏ ở điều kiện kiểm |
| `ceda9278` | `bug-r4-038-fea` + đối chứng `s4-416-fea` (tệp cũ của `main`), chạy chung tiến trình | 57 tiến trình khác, load 75–84 | `bug-r4-038-fea`: **0**; `s4-416-fea`: 12 | `s4-416-fea` đỏ vì hết 15 s (dòng 72) và vì chờ tải trang (dòng 177, 182, 183) |

Kết luận:
- Ở cùng mức tải, `ceda9278` không đỏ lần nào. Hai kiểu đỏ ngẫu nhiên của lượt 2 (dòng 249, và chờ lần tải đầu ở ca race 1) vẫn còn trên đối chứng `951d1880`, nhưng không còn trên `ceda9278`.
- `bug-r4-038-fea` chỉ đỏ khi load khoảng 90, và chỉ ở chỗ chờ tải trang. Ở load 75–84 nó 0/24, trong khi tệp cũ `s4-416-fea` chạy cùng lúc đỏ 12/24. Vậy các lần đỏ đó do máy quá tải, không do test.
- ARC không chạy lại mức 24×40 của FE-A; không cần, vì kết quả trên đã đủ để kết luận.

### 7. Thẻ feedback (lượt 3)

### FB-R4-ARC-FE-PR67-05
- Mức độ: Suggestion (nit), không chặn.
- Vị trí: `v104-minibar-prefill-fea.test.tsx`, ca race 1, ngay trước `mo.observe(...)` (khoảng dòng 146).
- Vấn đề: test dựa vào việc `holdStandard()` giữ được lần đọc bản chuẩn, nhưng không kiểm điều đó. Nếu sau này đường dẫn mock đổi và cổng không còn giữ được, thì hàng của tủ đã hiện trước khi observer bắt đầu. Khi đó ca này vẫn có thể xanh mà không còn bấm đúng khung hình race nữa.
- Đề xuất sửa: thêm `expect(screen.queryByRole('rowheader', { name: new RegExp(`^${coke.itemName}`) })).toBeNull();` ngay trước `mo.observe(...)`.
- Trạng thái: Open (FE-A)

### 8. Hợp đồng API cho #71 (đối chiếu bản vá của ARC review #71)

ORC báo: phần OpenAPI và api-client cho #71 đã có bản vá `arc71-openapi.patch` do ARC review #71 viết, BE đang áp vào #71. Lượt này không làm lại. ARC đã đối chiếu bản vá đó với 3 điểm của lượt 3:

| Điểm | Bản vá `arc71-openapi.patch` |
|---|---|
| `lateFeeAsNightVnd = 0` (đơn Nội bộ): không gửi `lateFeeInsteadOfNight`; gửi thì bị 422 | Có, và chi tiết hơn: `amountVnd = 0` trả `AMOUNT_NOT_POSITIVE`, `amountVnd > 0` trả `NOT_ALLOWED`; lỗi được kiểm trước mật khẩu. Có ghi cho client: có mặt và bằng 0 thì trả phòng được, vắng mặt nghĩa là máy chủ cũ |
| `extraNight.rateVnd = 0` chỉ hợp lệ cho đơn Nội bộ; kênh khác trả 422 `AMOUNT_NOT_POSITIVE` | Có |
| Đơn Nội bộ không có sàn/trần (`extraNightFloorVnd`/`CeilingVnd`, `floorVnd`/`ceilingVnd`) | Có |
| Khi `lateFeeAsNightVnd = 0`, số cần thu là `amountDueAtCheckoutVnd` (đã trừ phụ thu trả muộn B15 mà B18 sẽ đảo), không phải số dư folio | **Thiếu**. Bản vá không nhắc `amountDueAtCheckoutVnd`. Đề xuất BE thêm 1 câu vào mô tả `lateFeeAsNightVnd` (hoặc `amountDueAtCheckoutVnd`). Desk `ceda9278` đã làm đúng như vậy, test `bug-r4-038-fea` ca 2 kiểm số này |

Gợi ý cho BE (#71), không chặn: thêm 1 ca integration cho đường "đơn Nội bộ, đêm đã bán, Desk vẫn gửi `lateFeeInsteadOfNight`" thì bị 422. Mã đã có, nhưng test #71 chưa phủ.

### 9. Điểm làm tốt (lượt 3)
- Ca mới của thẻ 03 tái hiện lỗi một cách tất định: giữ summary tính theo giờ lại, rồi thả ra sau khi lễ tân đã chọn tủ và gõ số. Ca này đỏ trên mã cũ và xanh trên mã mới, không phụ thuộc tải máy.
- BUG-R4-038 nhận biết ca miễn phí theo **số máy chủ trả**, không tự suy ra từ kênh, nên chỉ có một nguồn quyết định. Ngoài ra, Desk lấy số cần thu theo máy chủ nên không thu thừa khoản phụ thu B18 sẽ đảo.
- FE-A tự báo phần lệch so với đề xuất của ARC và ghi lại đúng lệnh chạy tải.
