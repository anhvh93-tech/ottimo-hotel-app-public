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
