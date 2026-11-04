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
