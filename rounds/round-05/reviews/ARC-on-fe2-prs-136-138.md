# ARC review – FE-2 PR #138 (V5-5C, cảnh báo giá đêm hai biên) và #136 (V5-58, ô Wi-Fi trên Desk, S36)

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- Đối tượng (chỉ đọc; không đẩy lên nhánh PR, không gộp, không đánh dấu ready):
  - **#138** `r5-fe-v5-5c` @ **`4f348879`**. Nội dung ở `bbfaa02a`; `4f348879` chỉ gộp `main` @ `bc579b7d`. 16 tệp, +394/−30. CI ở đúng SHA: mọi job xanh (publish, deploy `SKIPPED`).
  - **#136** `r5-fe-v5-58` @ **`c55f90e3`**, **nháp**. Nội dung ở `97358b13`, `c55f90e3`; `9db130bd` gộp `main` @ `473e687a`. 28 tệp, +1428/−6. Chưa có lượt CI nào (PR xung đột với `main`).
- Đối chiếu:
  - `openapi.yaml`: `updateRoom` (`warnings[]` enum `FUTURE_RESERVATIONS_KEEP_ROOM`, `NIGHTLY_PRICE_UNUSUAL`; `listPrice.nightlyListPriceVnd` bắt buộc), `createRoom`; `getPropertyWifi` (S36, `x-roles` OWN/MGR/FDL/FD), `setPropertyWifi` (A101, OWN/MGR, bổ sung 1, 1e, 1f), `PropertyWifi`, `listAuditEvents` (S27, `x-scope` FDL/FD = own);
  - `contract-0.3.13.md` mục 1.23 (client SEC ARC-04, T58-10), 1.24 (V5-1A), 1.27 (V558-01);
  - máy chủ trên `main`: `list-price-check.ts`, `rooms.service.ts` (`listPriceWarnings`), `property-wifi.controller.ts`, `property-wifi.ts`, `identity/internal/screens.ts` (S36), `platform/audit-entities.ts` (`property`: `ssid`, `passwordChanged`, `rule`);
  - `rbac-matrix.md` 0.2.9 dòng S36, ghi chú 47; SEC `SEC-on-be-pr-120-v5-58.md` (mục 1.3, 5: phần Desk review ở PR FE), `security-requirements.md` SR-GST-06, SR-GST-11, SR-RL-15;
  - UXD `copy-v1.0.5.md` 9.3; plan V5-5C, V5-58, T10, T14, quyết định 27; DOM FB-R5-DOM-FE-121-01, `DOM-on-be-pr-120-v5-58.md` (120-03);
  - UXD đã review cùng hai PR (`UXD-on-fe2-prs-136-138.md`). ARC không lặp thẻ UXD, chỉ dẫn khi là điều kiện gộp.
- Cách kiểm:
  - `git fetch origin pull/<n>/head:refs/arc-review/pr<n>`; hai worktree tách rời trong scratchpad (`wt138`, `wt136`), `pnpm install --offline --frozen-lockfile`, dựng gói phụ thuộc của admin-web bằng turbo;
  - chạy ở đầu PR, rồi gộp thử `origin/main` @ `f63afee0` trong worktree (commit gộp chỉ ở máy, không đẩy);
  - đột biến: sửa tạm mã trong worktree, chạy tệp test liên quan (và cả bộ với đột biến còn sống), trả tệp về sau mỗi lần;
  - đã gỡ cả hai worktree và hai ref sau review. Bản làm việc chung không checkout nhánh PR;
  - không dữ liệu khách, không mật khẩu thật; giá trị Wi-Fi trong test là chuỗi thử của mock.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện gộp | Thẻ ARC |
|---|---|---|---|
| **#138 @ `4f348879`** | **DUYỆT CÓ ĐIỀU KIỆN** | (1) FE-2 gộp `main` vào nhánh (merge, không rebase), giải xung đột `mocks/handlers.ts` như mục 1.4, chạy lại `gen_strings.py`; (2) UXD **FB-R5-UXD-FE-138-01** (Major, toast 390 px) xong; (3) CI xanh ở HEAD mới; (4) DOM duyệt theo plan V5-5C (FE-A → UXD, DOM, QA) – chưa thấy tệp DOM | 138-01 (Minor), 138-02 (Suggestion) – không chặn |
| **#136 @ `c55f90e3`** (nháp) | **DUYỆT CÓ ĐIỀU KIỆN** về kỹ thuật | **Cần gộp `main`: có.** Điều kiện để rời nháp ở mục 2.6: gộp `main` (3 xung đột), UXD **136-01** (Major, bảng chữ 36 khóa), **SEC duyệt phần Desk** (SEC #120 mục 5 đã để lại cho PR FE), CI xanh gồm E2E UI T58-10 trên stack có #120 | 136-01 (Minor), 136-02 (Suggestion), 136-03 (Suggestion, QA) – không chặn |

- 0 Blocker, 0 Major của ARC. **Không có ESC.**
- Không PR nào đổi `openapi.yaml`, máy chủ hay migration. Cả hai khớp hợp đồng 0.3.13 trên `main` (mục 1.1, 2.1).
- Kết quả chạy:

  | Cây | `tsc` admin-web | Vitest admin-web | Khác |
  |---|---|---|---|
  | #138 đầu PR | sạch | 89 tệp / 1002 ca xanh (khớp FE-2) | – |
  | #138 gộp thử `main` @ `f63afee0` | sạch | **100 tệp / 1107 ca xanh** | eslint, prettier sạch ở tệp đổi |
  | #136 đầu PR | sạch | 89 tệp / 1012 ca xanh (khớp FE-2) | – |
  | #136 gộp thử `main` @ `f63afee0` | sạch | **100 tệp / 1117 ca xanh** (lượt 2; lượt 1 đỏ 2 ca chập chờn, mục 3) | api-client 40/40, `tsc` của `tests` và api-client sạch, eslint, prettier sạch |

- Gộp thử hai PR với nhau (sau khi mỗi PR đã gộp `main`): chỉ xung đột `strings.js`, sinh lại là hết. PR vào sau chạy lại `gen_strings.py`; cả hai cùng sửa `app.css` (và thẻ UXD 138-01 cũng sửa `.toasts`) nhưng ở chỗ khác nhau, git tự gộp.

---

## 1. #138 – V5-5C

### 1.1 Hợp đồng

- Desk đọc `warnings[]` của `updateRoom` bằng `data.warnings?.some((w) => w.code === 'NIGHTLY_PRICE_UNUSUAL')`. Kiểu sinh từ `openapi.yaml` có mã này trong enum (so literal qua `tsc`). Không thêm tham số, không chặn, đúng quyết định 27.
- Điều kiện ở `RoomDrawer`: `nightly * 30 < monthly` hoặc `nightly * 5 > monthly`, chỉ khi cả hai giá > 0. Giống `nightlyPriceUnusual` của máy chủ (`list-price-check.ts`): so số nguyên, đúng biên không báo. `parseVnd` chỉ trả số nguyên an toàn.
- Hai giá đem so là hai ô của ngăn kéo, tức đúng cặp `listPrice` Desk gửi cho `effectiveFrom` đã chọn. Máy chủ so cùng cặp đó (`listPriceWarnings(lp.monthlyListPriceVnd, nightly)`), nên "cùng căn, cùng ngày hiệu lực" của BR-101 (4) được giữ.
- Hệ quả (UXD đã chấp nhận ở mục 1.5 của UXD): sau "Vẫn lưu giá này", máy chủ cũng trả cảnh báo nên toast luôn có dòng cảnh báo. ARC đồng ý: đó là lưới thứ hai, không đổi hợp đồng.
- Mock: khối `warnings[]` của PR trùng từng chữ khối #121 trên `main`. Mã lỗi giá ≤ 0 đổi `AMOUNT_NOT_POSITIVE` → `VALUE_OUT_OF_RANGE`. Khớp máy chủ: `validation.ts` đổi `too_small` của số thành `VALUE_OUT_OF_RANGE`. Đây là thẻ ARC FB-R5-ARC-BE-C1-01, đã làm, có ca test khóa mã.

### 1.2 Phân quyền

Không đổi. Ngăn kéo sửa căn chỉ mở cho OWN/MGR (`updateRoom` `x-roles`, S25). FDL/FD thấy bảng chỉ đọc (UXD kiểm).

### 1.3 Đường lỗi

- 422 `VALIDATION_FAILED` → `fieldErrors` về đúng ô. 409 `CAPACITY_BELOW_BOOKINGS`, 412 → như cũ. PR không đổi các nhánh này.
- Giá ≤ 0 bị chặn ở máy trước khi gửi, nên người dùng không gặp `VALUE_OUT_OF_RANGE`.
- Toast có dòng cảnh báo không tự tắt: `push` không hẹn giờ, và `resume` bỏ qua toast cảnh báo. Mã đúng, nhưng nhánh `resume` không có test (thẻ 138-01).

### 1.4 Gộp với `main` (#121 đã gộp `491b8abd`)

`git merge-tree` và gộp thử trong worktree: hai xung đột.
- `mocks/handlers.ts`, đúng chỗ FE-2 đã báo trong thân PR. Cách giải ARC đã chạy (1107 ca xanh):

  ```ts
  if (!(Number(lp.monthlyListPriceVnd) > 0))
    errors.push({ field: 'listPrice.monthlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' });
  if (lp.nightlyListPriceVnd === undefined)
    errors.push({ field: 'listPrice.nightlyListPriceVnd', code: 'REQUIRED' });
  else if (!(Number(lp.nightlyListPriceVnd) > 0))
    errors.push({ field: 'listPrice.nightlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' });
  ```

  Tức là giữ `REQUIRED` của #121 và `VALUE_OUT_OF_RANGE` của thẻ ARC. Bỏ chú thích cũ "nightlyListPriceVnd is optional".
- `strings.js`: lấy bản `main` rồi chạy `gen_strings.py`.
- Sau khi gộp, diff so với `main` đúng 16 tệp của PR. Không tệp nào của #121 bị đổi ngược.

### 1.5 Test và đột biến

7 ca mới + 1 ca sửa ở `rooms.test.tsx`. Có đủ bốn số ví dụ của DOM (2.800.000 cao, 1.700.000 đúng biên trên, 280.000 thấp, 8.400.000/280.000 đúng biên dưới), ca chỉ sửa tên, ca máy chủ cảnh báo, ca mã lỗi mock, ca toast.

| # | Đột biến | Kết quả |
|---|---|---|
| m1 | biên trên `>` → `>=` | đỏ (ca đúng biên trên) |
| m2 | biên dưới `<` → `<=` | đỏ (ca 8.400.000/280.000) |
| m3 | bỏ `&& priceChanged` | đỏ (ca chỉ sửa tên) |
| m4 | không bao giờ truyền `warn` cho toast | đỏ 2 ca |
| m5 | dòng cảnh báo khi `warnings[]` có **bất kỳ** mã nào | **sống**, cả bộ 1107 ca |
| m6 | toast cảnh báo vẫn hẹn giờ tắt | đỏ |
| m7 | `resume` hẹn giờ lại cả toast cảnh báo | **sống**, cả bộ |
| m8 | bỏ kiểm biên trên | đỏ 2 ca |
| m9 | bỏ `aria-describedby` trỏ Alert | đỏ |
| m10 | mock chỉ kiểm biên dưới | đỏ |

Với m5, m7, lần chạy cả bộ có 1 ca đỏ ở `r3-bug-010-011-feb` / `v5-14-hold-typed-rates-fea`. Chạy riêng hai tệp đó với đột biến thì 13/13 xanh, tức ca đỏ là chập chờn (mục 3), không do đột biến.

### FB-R5-ARC-FE-138-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/__tests__/v5-5c-nightly-unusual-fe2.test.tsx`; mã được giữ: `RoomDrawer.tsx` (`unusualSaved`), `app/toast.tsx` (`resume`).
- Vấn đề: hai hành vi đúng nhưng không có test giữ (đột biến m5, m7 sống qua cả bộ 1107 ca):
  - (a) Ngừng bán căn còn đơn tương lai: máy chủ trả `warnings: [{ code: 'FUTURE_RESERVATIONS_KEEP_ROOM', count }]`. Nếu ai đó đổi `.some(code === …)` thành "có cảnh báo nào", toast sẽ báo nhầm "giá đêm khác thường" cho một lần lưu không đổi giá.
  - (b) Rê chuột vào vùng toast (hoặc focus nút đóng) rồi rời ra: `resume` hiện bỏ qua toast cảnh báo. Đổi lại thì toast cảnh báo tự tắt sau 6–8 giây, đúng lúc người dùng vừa rê chuột vào để đọc.
- Vì sao quan trọng: UXD 9.3 đòi dòng cảnh báo "không tự tắt" và chỉ hiện khi có `NIGHTLY_PRICE_UNUSUAL`. Đây là lưới bắt lỗi thừa số 0 trên giá quầy và giá web. Không có test thì lần sửa `toast.tsx` sau (ví dụ thẻ UXD 138-01) có thể làm hỏng mà CI vẫn xanh.
- Đề xuất sửa:
  - Thêm 2 ca:
    - (a) mock `updateRoom` trả chỉ `FUTURE_RESERVATIONS_KEEP_ROOM`, lưu ngừng bán: toast thường, không có `rooms.warn.nightly_price_unusual`;
    - (b) trong ca toast dùng giờ giả: `fireEvent.mouseEnter` rồi `mouseLeave` trên `.toasts`, `advanceTimersByTime(10_000)`: toast cảnh báo còn, toast thường mất.
  - Làm cùng lượt gộp `main` thì tốt nhất; không chặn gộp.
- Trạng thái: Open

### FB-R5-ARC-FE-138-02
- Mức độ: Suggestion
- Vị trí: `RoomDrawer.tsx` (`nightlyLow`, `nightlyHigh`) và `services/api/src/modules/platform/public/list-price-check.ts` (`nightlyPriceUnusual`, `NIGHTS_LOWER`, `NIGHTS_UPPER`).
- Vấn đề:
  - Cùng một luật BR-101 (4) nay nằm ở hai nơi: Desk và máy chủ. Hiện hai bên khớp, nhờ test ví dụ DOM ở cả hai phía.
  - Máy chủ so bằng `BigInt`, vì `MoneyVnd` × 30 có thể vượt số nguyên an toàn. Desk so bằng `Number`. Chỉ lệch với giá vô lý (> 3·10¹⁴ đ); khi đó máy chủ vẫn cảnh báo sau khi lưu.
- Vì sao quan trọng: DOM đổi biên (hằng số, không phải tham số) thì phải sửa hai chỗ. Nếu quên một chỗ, Desk và máy chủ nói khác nhau.
- Đề xuất sửa (v1.0.6, FE + BE-C, ARC duyệt): chuyển hàm thuần `nightlyPriceUnusual` vào `@ottimo/contracts`. Gói này hai bên đã dùng chung, đã có tiền lệ `public-room-type.ts`. `rooms.service.ts`, công cụ nhập danh mục và `RoomDrawer` gọi cùng một hàm. Test ví dụ DOM chuyển theo.
- Trạng thái: Open

---

## 2. #136 – V5-58 Desk Wi-Fi (S36)

### 2.1 Hợp đồng

| Điểm | PR | Đánh giá |
|---|---|---|
| `getPropertyWifi` | `GET /v1/properties/{id}/wifi`, kiểu `Schemas['PropertyWifi']` | Đúng. `configured = false` → khung "chưa nhập"; mạng mở theo `passwordSet === false` hoặc `password` rỗng (đọc được cả câu trả lời cũ) |
| `setPropertyWifi` | `PUT`, thân đúng `{ ssid, password }` (`additionalProperties: false`), không `If-Match`, không `Idempotency-Key` | Đúng 1.23 (BE 21 ý 3). `ssid` bỏ khoảng trắng hai đầu như máy chủ, mật khẩu giữ nguyên (DOM #120 mục 2). Câu trả lời PUT không có `password`: Desk không đọc nó mà gọi lại GET |
| Kiểm dạng ở máy | `ssid` 1–32 **byte** UTF-8, không ký tự điều khiển; mật khẩu rỗng hoặc 8–63 ASCII 0x20–0x7E | Trùng `wifiShapeErrors` của máy chủ. Số căn, tên đăng nhập, mật khẩu trùng chỉ máy chủ biết, đúng |
| 422 | `wifiServerErrors`: `NOT_ALLOWED` → câu riêng, `REQUIRED`, còn lại → `range`; lỗi khác trường (`body` của zod) → banner `problemView` | Đúng. Đúng thứ tự V558-01 (lỗi `ssid` trước, chưa so mật khẩu) |
| SR-RL-15 quá ngưỡng | Lưu như thường, Desk không nói gì | Đúng: phản hồi giống hệt, không 429 |
| Nhật ký | `listPropertyWifiChanges` = `listAuditEvents` ghim `category=config`, `action=property.wifi_changed`, 92 ngày, `limit` 5 | Đúng tham số 0.3.13 (`action` mảng `form`/`explode`, ngày `LocalDate`, giới hạn `AUDIT_MAX_RANGE_DAYS` 92 tính cả hai đầu). Thực thể audit `property` chỉ trả `ssid`, `passwordChanged`, `rule`, nên nhật ký không thể có mật khẩu. Hàm bọc riêng hợp lý vì `ListAuditQuery` trên `main` vẫn `Omit<'action'>` |
| Mock `mocks/wifi.ts` | Theo #120 @ `f1ac530b` | `git diff f1ac530b origin/main` trên các tệp Wi-Fi của máy chủ: **rỗng**. #120 gộp ở `9a22e0ef`, chỉ thêm commit gộp `main`. Mock vẫn đúng máy chủ đang chạy |

### 2.2 Phân quyền – ai đặt Wi-Fi

- **Ghi (A101): chỉ OWN, MGR.**
  - Desk: `canEdit` khi vai có `owner` hoặc `manager`. Chỉ khi đó mới có nút Nhập/Sửa và thẻ nhật ký.
  - Máy chủ: `setPropertyWifi` `x-roles: [owner, manager]`, guard trả 403 trước khi đọc body. Desk chỉ ẩn nút; máy chủ mới là chỗ chặn.
- **Đọc (S36): OWN, MGR, FDL, FD.**
  - Mục nav `wifi`: `screen: 'S36'`, `roles: DESK`. `canOpen` đòi cả màn trong `Me.screens` lẫn vai.
  - `identity/internal/screens.ts` trên `main` đã có S36 đúng bốn vai này. `mocks/seed.ts` SCREENS của PR khớp từng vai.
  - HK, MT, SAL, CTV không thấy mục. Mở thẳng đường dẫn thì gặp trang không có quyền và không gọi API (có ca test).
- **Nhật ký:** chỉ OWN/MGR thấy. `listAuditEvents` cho FDL/FD phạm vi `own`; Desk không hiện thẻ cho hai vai này nên không có câu "nhật ký rỗng" gây hiểu nhầm.
- **Theo các ghi chú SEC trước:**
  - Lý do: trang khách hiện Wi-Fi ở mức 1, chỉ cần link, từ ngày nhận phòng (SR-GST-06), và tắt sau `checked_out` (SR-GST-11). Vì vậy giá trị OWN/MGR lưu ở đây là dữ liệu công khai với mọi người cầm link.
  - Các câu trên Desk nói đúng điều đó: `wifi.subtitle` "từ ngày nhận phòng", bước xem lại "Khách sẽ thấy trên trang khách", `wifi.review_applies` "mọi khách đang ở".
  - SEC ARC-04 (client), đủ các điểm:
    - hai ô trống khi mở, kể cả khi đã có Wi-Fi;
    - ô chữ thường, không `type="password"`; nút Ẩn chỉ che bằng CSS `-webkit-text-security`;
    - `autocomplete="off"` ở form và cả hai ô; `name` là `wifiNetworkName` / `wifiKey`;
    - có thêm `data-1p-ignore`, `data-lpignore`, tắt sửa chính tả;
    - bước xác nhận "Khách sẽ thấy…".
  - Giá trị chỉ nằm trong state của hộp thoại và `useResource` (bộ nhớ, không cache chung). Admin-web không có service worker cache API. api-client không log thân request. GET và PUT `no-store` ở máy chủ.
  - FD đọc mật khẩu dạng rõ trên thẻ là thiết kế S36 (SEC ARC-10 không phản đối). Không thêm quyền.
  - **SEC chưa review phần Desk.** SEC #120 mục 5 đã ghi phần này review ở PR FE. Đây là điều kiện rời nháp, không phải thẻ ARC.

### 2.3 Đường lỗi

| Đường | Mã | Test |
|---|---|---|
| GET lỗi (mạng, 5xx, 403) | `ErrorBlock` có Thử lại, 503 tự thử lại một lần (`useResource`) | **Không có** (đột biến n12 sống) |
| Lỗi dạng ở máy | Ở lại bước nhập, lỗi tại ô | Có |
| 422 `NOT_ALLOWED` / `VALUE_OUT_OF_RANGE` | Về bước nhập, lỗi tại ô, giá trị còn nguyên | Có (số căn, tên đăng nhập, mật khẩu trùng) |
| PUT 403 / 5xx / mạng | Banner `problemView`, hộp ở lại bước xem lại | **Không có** (n10 sống) |
| Mất mạng | Nút "Lưu Wi-Fi" tắt | **Không có** (n11 sống) |
| Nhật ký lỗi | Câu `problemView` trong thẻ, không chặn thẻ Wi-Fi | Không có (đọc mã, đúng) |

Focus sau lỗi là thẻ UXD 136-02. ARC không lặp lại.

### 2.4 Test và đột biến

17 ca Vitest, 2 ca api-client, 1 E2E (2 ca).

| # | Đột biến | Kết quả |
|---|---|---|
| n1 | ô mật khẩu `type="password"` | đỏ 2 ca |
| n2 | form bỏ `autocomplete="off"` | đỏ |
| n3 | FDL được sửa | đỏ |
| n4 | `NOT_ALLOWED` hiện như lỗi dạng | đỏ 3 ca |
| n5 | cắt khoảng trắng mật khẩu khi gửi | đỏ |
| n6 | FD thấy nhật ký | đỏ |
| n7 | 422 không quay về bước nhập | đỏ 3 ca |
| n8 | đếm ký tự thay byte | đỏ |
| n9 | mock so mật khẩu khi `ssid` đã lỗi | đỏ |
| n10 | PUT lỗi không phải 422 → không banner | **sống** |
| n11 | lưu được khi mất mạng | **sống** |
| n12 | GET lỗi → không `ErrorBlock` | **sống** |
| n13 | điền sẵn ô tên mạng | đỏ 7 ca |
| n14 | không bao giờ nói "Mạng mở" | đỏ 2 ca |

### FB-R5-ARC-FE-136-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/__tests__/v5-58-wifi-fe2.test.tsx`; mã được giữ: `WifiPage.tsx` (`save` nhánh `setBanner`, `disabled={!online}`, nhánh `ErrorBlock`).
- Vấn đề: ba đường lỗi có mã đúng nhưng không có test (đột biến n10, n11, n12 sống):
  - PUT trả 403 (mất vai giữa phiên), 5xx hoặc lỗi mạng;
  - lưu khi mất mạng;
  - GET Wi-Fi lỗi.

  Nếu n10 xảy ra, bấm "Lưu Wi-Fi" mà máy chủ từ chối thì không có chữ nào hiện. Chủ đầu tư tưởng đã lưu, trang khách vẫn số cũ.
- Vì sao quan trọng: DoD đòi trạng thái lỗi và test cho logic chính. Wi-Fi sai trên trang khách là việc khách gặp ngay ngày nhận phòng.
- Đề xuất sửa: thêm 3 ca bằng `mockControl.failNext` hoặc `server.use`:
  - PUT 403 `FORBIDDEN_ACTION` → banner, hộp ở bước xem lại, `mockControl.wifi.wifi` không đổi, không toast;
  - `useOnline` false → nút Lưu tắt;
  - GET 500 → `wifi.error_title` và nút Thử lại.

  Nên làm cùng lượt gộp `main`, trước khi rời nháp; không chặn kỹ thuật.
- Trạng thái: Open

### FB-R5-ARC-FE-136-02
- Mức độ: Suggestion
- Vị trí: `product/tests/e2e/ui/v5-58-desk-wifi.r5.spec.ts`, `stubWifiUntilServer`.
- Vấn đề:
  - Lý do của đoạn giả lập ("tới khi stack có #120") đã hết: #120 gộp `f276d995`. Sau khi gộp `main`, `isAvailable` luôn trả `true` và đoạn giả lập không chạy.
  - Đoạn này vẫn để ngỏ một lối: nếu sau này stack E2E mất `getPropertyWifi` (404), T58-10 sẽ tự trả `{ configured: false }` và xanh, thay vì đỏ.
- Vì sao quan trọng: 1.23 đòi T58-10 chạy với máy chủ thật.
- Đề xuất sửa: bỏ `stubWifiUntilServer` và câu chú thích liên quan khi gộp `main`.
- Trạng thái: Open

### 2.5 Gộp với `main` – có cần không: **có**

- Nhánh cắt từ `main` @ `473e687a`, chậm **433 commit**, **chưa có #120** (`f276d995` không là tổ tiên của `c55f90e3`). Điều kiện "gộp sau #120" của thân PR nay đã đủ.
- Gộp thử với `main` @ `f63afee0`: ba xung đột.
  - `strings.js`: lấy bản `main`, chạy `gen_strings.py`.
  - `packages/api-client/src/endpoints.test.ts`: cả hai bên thêm một `describe` ở cuối tệp. Giữ cả hai: khối "v1.0.5 endpoints" của `main` trước, khối "V5-58 property Wi-Fi" sau.
  - `packages/ui/src/styles/app.css`: cả hai bên thêm vào cuối tệp. Giữ cả hai: `.input.is-prefilled` và `.wiz-foot.desk-foot` của `main`, rồi `.input.wifi-masked`.
- Sau khi gộp: diff so với `main` đúng 28 tệp của PR. Kết quả xanh như bảng mục 0.
- Do PR đang xung đột nên GitHub chưa chạy CI. Gộp `main` xong mới có lượt CI đầu tiên, gồm E2E UI.

### 2.6 Việc để rời nháp (theo thứ tự)

1. FE-2 gộp `main` (merge, không rebase) như mục 2.5. Nên làm luôn ARC 136-01, 136-02 và UXD 136-02, 136-03 trong cùng lượt.
2. UXD **FB-R5-UXD-FE-136-01** (Major): áp bảng chữ 36 khóa ở `UXD-on-fe2-prs-136-138.md` mục 2.1, đổi ghi chú "chờ UXD duyệt".
3. Đánh dấu **ready**, rồi CI xanh ở HEAD mới. Phải có job E2E chạy `v5-58-desk-wifi.r5.spec.ts` với máy chủ thật.
4. **SEC duyệt phần Desk** (T58-10, không lưu giá trị ngoài state, nhật ký không có mật khẩu). ARC duyệt nhanh phần chênh nếu có đổi mã ngoài mục 2.5 và các thẻ trên.
5. Theo plan T14: Desk V5-58 cùng tag với #120. #120 đã ở `main`, nên chỉ cần #136 gộp trước khi cắt tag.
6. Không chặn gộp: QA kiểm tay trên staging rằng Chrome và Safari có mật khẩu Desk đã lưu vẫn không tự điền vào hai ô (báo cáo FE mục 6). UXD 136-05 (trang khách) là việc của FE-B.

---

## 3. Ghi nhận ngoài hai PR

### FB-R5-ARC-QA-136-03
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/__tests__/r3-v1-feb-webreq.test.tsx` ("FD: H09 prefilled with the dates, guests and source Website…"), `r3-bug-010-011-feb.test.tsx` ("a 422 NOT_ALLOWED on the source…"), `v5-14-hold-typed-rates-fea.test.tsx` ("a typed rate outside the floor–ceiling…").
- Vấn đề:
  - Trên cây `main` + #136 và `main` + #138, các ca này có lúc đỏ khi máy đang tải nặng: không tìm thấy nút "Tạo đơn" trong 3000 ms.
  - Chạy riêng 3 lần trên mỗi cây thì xanh hết; chạy lại cả bộ cũng xanh. Không do hai PR này.
- Vì sao quan trọng: ca chập chờn làm người gộp nghi oan PR khác, hoặc tập bỏ qua đỏ.
- Đề xuất sửa: QA đưa vào danh sách ca chập chờn. Tăng thời gian chờ của `findByRole` ở bước mở H09, hoặc chờ dữ liệu yêu cầu web tải xong trước khi tìm nút.
- Trạng thái: Open

---

## 4. Điểm tốt

- #138: chép chữ 9.3 đúng từng byte. Khối mock trùng nguyên văn #121 nên gộp gần sạch, và chỗ xung đột duy nhất đã được báo trước trong thân PR kèm cách giải đúng. Test dùng đúng bốn số ví dụ của DOM, kiểm cả hai biên đúng bằng.
- #136: mock bám máy chủ tới thứ tự kiểm V558-01 và bộ đếm SR-RL-15. 11/14 đột biến đỏ, gồm mọi điểm SEC ARC-04. E2E không ghi lên stack dùng chung.
- Cả hai: không đổi hợp đồng, không viết cứng màu hay font, tách rõ "Desk kiểm trước, máy chủ quyết".

## 5. Giả định

- G1. "Duyệt có điều kiện" của #138 áp cho HEAD mới, nếu phần chênh so với `4f348879` chỉ gồm: gộp `main` theo mục 1.4, thẻ UXD 138-01 (CSS `.toasts`), và có thể ARC 138-01 (test). Có đổi mã khác thì gửi lại ARC.
- G2. Với #136, ARC duyệt nội dung `c55f90e3`. Phần chênh sau khi áp bảng chữ UXD và các thẻ thì ARC xem nhanh (mục 2.6 bước 4).
- G3. Không có ESC: mọi điểm trên thuộc quyền ARC, UXD, SEC, QA, không đụng tiền, chính sách hay pháp lý.

## 6. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi)

| 2026-11-07 | 5 | **ARC – review FE-2 #138 @ 4f348879 (V5-5C) và #136 @ c55f90e3 (V5-58 Desk Wi-Fi, nháp): cả hai DUYỆT CÓ ĐIỀU KIỆN** (rounds/round-05/reviews/ARC-on-fe2-prs-136-138.md). #138: hai biên giống nightlyPriceUnusual của máy chủ (so số nguyên, đúng biên không báo, cùng cặp giá gửi đi), đọc warnings[] NIGHTLY_PRICE_UNUSUAL đúng enum 0.3.13, mock VALUE_OUT_OF_RANGE khớp zod; gộp thử main @ f63afee0 chỉ xung đột handlers.ts (giữ REQUIRED của #121 + VALUE_OUT_OF_RANGE) và strings.js (sinh lại), 100 tệp / 1107 ca xanh; 8/10 đột biến đỏ. Điều kiện: gộp main, UXD 138-01 (Major), CI xanh, DOM duyệt. Thẻ 138-01 Minor (test mã cảnh báo khác, toast cảnh báo sau hover), 138-02 Suggestion (v1.0.6 chuyển nightlyPriceUnusual vào @ottimo/contracts). #136: khớp getPropertyWifi/setPropertyWifi/listAuditEvents, ghi chỉ OWN/MGR (A101), đọc OWN/MGR/FDL/FD (S36, screens.ts khớp), SEC ARC-04 đủ, mock = máy chủ trên main; cần gộp main (chậm 433 commit, chưa có #120; 3 xung đột, giữ cả hai bên), gộp thử 100 tệp / 1117 ca xanh; 11/14 đột biến đỏ. Rời nháp khi: gộp main, UXD 136-01 (Major), CI xanh gồm E2E T58-10, SEC duyệt phần Desk. Thẻ 136-01 Minor (test lỗi PUT/GET/mất mạng), 136-02 Suggestion (bỏ stub E2E), QA-136-03 Suggestion (ca webreq chập chờn). Không ESC | ARC | Hợp đồng 0.3.13, rbac S36/A101, SEC ARC-04, SR-GST-06 |
