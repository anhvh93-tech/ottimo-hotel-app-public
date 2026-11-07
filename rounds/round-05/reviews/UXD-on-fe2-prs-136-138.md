# UXD review – FE-2 PR #138 (V5-5C, cảnh báo giá đêm khác thường) và #136 (V5-58, ô Wi-Fi trên Desk, S36)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng (chỉ đọc; không đẩy lên nhánh PR, không gộp, không đánh dấu ready):
  - **#138** `r5-fe-v5-5c` @ **`4f348879`** (`4f348879e7867322e7da75393ec37d4b76b848b0`). Nội dung V5-5C ở `bbfaa02a`; `4f348879` chỉ gộp `main` @ `bc579b7d`. 16 tệp.
  - **#136** `r5-fe-v5-58` @ **`c55f90e3`** (`c55f90e30302353aab93bf7b300b54053c9a4dc9`), **nháp**. Nội dung ở `97358b13` và `c55f90e3`; `9db130bd` gộp `main`. 28 tệp.
- Cách kiểm:
  - lấy từng PR bằng `git fetch origin pull/<n>/head:refs/uxd-review/pr<n>`, dựng worktree tạm trong scratchpad. Đã gỡ worktree và ref sau khi kiểm. Bản làm việc chung không checkout nhánh PR;
  - chạy `gen_strings.py` ở cả hai SHA: `strings-*.json`, `strings.js`, `strings-tables.md` không đổi;
  - chạy admin-web trên mock (Vite, MSW): #138 ở cổng 5360, #136 ở cổng 5361. Đã tắt cả hai sau khi kiểm;
  - chụp bằng Playwright headless ở **1440 và 390 px, sáng và tối, VI và EN**:
    - #138 với `qa.owner`, `qa.mgr`, `qa.fdl`, `qa.fd`;
    - #136 với `qa.owner`, `qa.mgr`, `qa.fdl`, `qa.fd`, `qa.hk`, `qa.sal`;
  - đo bằng script: tràn ngang, font tính được, cỡ chữ, `aria-describedby`, phần tử đang focus sau lỗi, kích thước nút, thuộc tính ô nhập (`type`, `name`, `autocomplete`);
  - **điều khách thấy**: chạy guest-web trên mock (cổng 5360, sau khi tắt server #138). Để thử giá trị Wi-Fi do Desk lưu, UXD sửa tạm một dòng mock **trong worktree tạm**, không commit, đã hoàn lại trước khi gỡ worktree. Kiểm VI, EN, RU ở 390 và 1440 px;
  - ảnh chỉ ở scratchpad phiên (`uxd-r5-136-138/shots/`), **không đưa vào repo**. Dữ liệu là mock, giá trị Wi-Fi là chuỗi thử (`test-wifi-key-01`…). Không có dữ liệu khách thật, không có mật khẩu thật.
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md`;
  - `product/design/design-system.md`:
    - 2.4 (màu chức năng);
    - C3 (ô nhập), C18 (toast), C19 (Alert);
    - mục vùng chạm;
    - bảng "mẫu nội tuyến → lớp thay thế";
  - `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 9.3;
  - hợp đồng 0.3.13 `getPropertyWifi`, `setPropertyWifi`, mục "Client" (SEC ARC-04);
  - `rounds/round-05/reviews/DOM-on-be-pr-120-v5-58.md` (120-02, 120-03); `rounds/round-05/reviews/SEC-on-contract-0.3.13.md` (ARC-04);
  - báo cáo FE-2 `rounds/round-05/outputs/FE/v5-5c-nightly-unusual-fe2.md`, `v5-58-desk-wifi-fe2.md` (trên nhánh PR).

## 0. Kết luận

| PR | Head | Kết luận | Thẻ |
|---|---|---|---|
| **#138** V5-5C | `4f348879` | **DUYỆT CÓ ĐIỀU KIỆN** | Điều kiện gộp: **138-01** (Major) – toast ở 390 px chỉ rộng nửa màn hình. Chữ 9.3 khớp từng byte |
| **#136** V5-58 Desk (nháp) | `c55f90e3` | **DUYỆT CÓ ĐIỀU KIỆN** | Điều kiện gộp: **136-01** (Major) – áp bảng chữ UXD mục 2.1 (sửa 7 khóa, thêm 1 khóa, ẩn một câu khi chưa nhập). Không chặn gộp: 136-02, 136-03 (Minor), 136-04 (Suggestion). **136-05** (Minor) là việc của trang khách (FE-B, CPY), không nằm trong #136 |

- Không có Blocker. **Không có ESC**: chữ, cách hiện và màu đều thuộc quyền UXD, trong khuôn khổ thương hiệu.
- **Giả định G1 của FE-2 (#138):** UXD đồng ý. Dòng cảnh báo trong toast hiện mỗi khi máy chủ trả `NIGHTLY_PRICE_UNUSUAL`, kể cả sau khi bấm "Vẫn lưu giá này". Lý do ở mục 1.5. UXD sửa câu 9.3 ý 2 ở bản chữ sau.
- **Chữ #136:** `copy-v1.0.5.md` chưa có mục Wi-Fi, nên FE-2 viết nháp 35 khóa. Kết quả UXD duyệt:
  - giữ nguyên 28 khóa;
  - sửa 7 khóa;
  - thêm 1 khóa.

  Bảng chữ đủ 36 khóa ở mục 2.1. Tới khi `copy-v1.0.5.md` có mục 9.19, **bảng này là nguồn chữ**.
- **CI lúc review:**
  - #138 @ `4f348879`: mọi job xanh, các job publish và deploy `SKIPPED`;
  - #136 @ `c55f90e3`: chưa có lượt CI nào. PR đang xung đột nên GitHub không chạy workflow `pull_request`; CI chạy khi FE-2 gộp `main`.
- **Cả hai PR đang xung đột với `main` @ `a38bfcdc`** (UXD gộp thử bằng `git merge-tree`):
  - #138: `mocks/handlers.ts`, `strings.js`;
  - #136: `strings.js`, `api-client/src/endpoints.test.ts`, `ui/src/styles/app.css`.

  FE-2 gộp `main` vào nhánh (merge, không rebase), rồi chạy lại `gen_strings.py`. #138 và #136 cùng sửa `app.css`: PR nào vào sau thì gộp lại phần này.
- **Thương hiệu (cả hai PR):**
  - **Màu:** chỉ dùng token DS. Toast cảnh báo dùng cặp `--warn` / `--warn-bg`, đúng ngoại lệ 2.4 (màu trạng thái chỉ ở chip, Alert, icon, viền). Không có mã màu, `rgb()` hay `font-family` viết cứng.
  - **Font:**
    - Lora cho tiêu đề trang, tiêu đề thẻ "Wi-Fi đang dùng" (h2), tiêu đề hộp. Tiêu đề thẻ nhật ký "Lần lưu gần đây" là h3, theo DS dùng Be Vietnam Pro;
    - Be Vietnam Pro cho nội dung và nút;
    - JetBrains Mono cho tên mạng, mật khẩu Wi-Fi, hai ô nhập Wi-Fi và giá trị trong nhật ký Wi-Fi;
    - đã đo bằng `getComputedStyle`; `document.fonts.check('16px "JetBrains Mono"')` đúng khi có giá trị mono trên màn.
  - **Giọng:** chữ Desk nội bộ, tiếng Việt trước, ngắn, điềm tĩnh, không đổ lỗi, không emoji. Không cần CPY. Riêng 3 chuỗi trang khách ở thẻ 136-05 cần CPY.

---

## 1. #138 – V5-5C, cảnh báo giá đêm khác thường ở cả hai biên

### 1.1 Chữ

So từng byte cột VI, EN của bảng `copy-v1.0.5.md` mục 9.3 với `strings-vi.json`, `strings-en.json` ở `4f348879` (script, không so bằng mắt):

| Khóa | VI | EN |
|---|---|---|
| `rooms.night_low` (sửa) | khớp | khớp |
| `rooms.night_high` (mới) | khớp | khớp |
| `rooms.save_unusual_price` (mới) | khớp | khớp |
| `rooms.warn.nightly_price_unusual` (mới) | khớp | khớp |

Ghi chú:
- `{month}` và `{perDay}` truyền đúng biến, chỉ có số. `vnd()` không kèm đơn vị, nên không bị "đ đ".
- Ghi chú khóa trong `gen_strings.py` trỏ đúng 9.3.
- Desk không có cột RU, đúng quy ước.

### 1.2 Trạng thái (mock, `qa.owner`, căn 101)

| Ca | Kết quả |
|---|---|
| Giá tháng 8.500.000, giá đêm 2.800.000 (× 5 > tháng) | Alert warn hiện câu `rooms.night_high`, có "(8.500.000 đ)". Nút đổi thành "Vẫn lưu giá này". Nút có `aria-describedby` trỏ tới Alert |
| 1.700.000 (× 5 = tháng, đúng biên) | Không cảnh báo, nút "Lưu" |
| 280.000 (× 30 < tháng) | Alert hiện câu `rooms.night_low` với `{perDay}` = 283.000 |
| 8.400.000 / 280.000 (đúng biên dưới) | Không cảnh báo, nút "Lưu" |
| Bấm "Vẫn lưu giá này" | Toast "Đã lưu căn 101." kèm dòng cảnh báo, tông cảnh báo, icon `alert`. Sau 7 giây vẫn còn (không tự tắt). Vùng toast có `role="status"`, `aria-live="polite"` |
| Giá cũ vốn khác thường, chỉ sửa tên | Theo test FE `v5-5c-nightly-unusual-fe2.test.tsx`: khung vẫn hiện, nút giữ "Lưu". UXD không chạy lại ca này trên mock |
| `qa.mgr` | Như chủ đầu tư: thấy cảnh báo và nút "Vẫn lưu giá này" |
| `qa.fdl`, `qa.fd` | Không có nút "Sửa", bảng chỉ đọc. Danh sách không gắn cảnh báo (G3 của FE-2, UXD đồng ý) |
| Đang lưu | Nút dùng `busyLabel` "Đang lưu…" như mọi nút Lưu của ngăn kéo (đọc mã) |
| Lỗi | Mock trả `VALUE_OUT_OF_RANGE` cho giá ≤ 0 (thẻ ARC). Desk chặn giá ≤ 0 trước khi gửi nên người dùng không gặp |

### 1.3 Bố cục 1440 và 390 px

- **Ngăn kéo:** không tràn ngang ở cả 6 cấu hình (1440/390 × sáng/tối/EN).
  - Ở 390 px, Alert rộng 319 px, nằm ngay dưới ô giá đêm và dòng trợ giúp. EN cao 120 px, VI 100 px.
  - Nút "Save this price anyway" rộng 189 px, vừa chân ngăn kéo.
- **Toast cảnh báo ở 1440:** 440 × 89 px (VI), 440 × 131 px (EN), giữa màn hình, đúng C18.
- **Toast ở 390: lỗi, thẻ 138-01.** Toast chỉ rộng **195 px** (x = 98), tức nửa màn hình. Bản VI cao 236 px, bản EN cao 341 px, mỗi dòng 1–3 chữ. Toast che cột giá đêm và cột Bán của 3 dòng căn, và không tự tắt.
  - Nguyên nhân: `.toasts` có `position: fixed; left: 50%; transform: translateX(-50%)` mà không có bề rộng. Khung chứa vì thế chỉ được rộng tối đa 50vw.
  - Lỗi này có từ trước PR, nhưng trước đây chỉ có câu ngắn nên không lộ. Toast thường của #136 ("Đã lưu Wi-Fi. Trang khách hiện giá trị mới ở lần mở sau.") cũng bị ép 195 px ở 390.

### 1.4 Thương hiệu, tương phản

- Toast cảnh báo (đo `getComputedStyle`):

  | Chế độ | Nền | Chữ | Viền, icon |
  |---|---|---|---|
  | Sáng | `#F5E8D3` | `#2B2B28` (Ink) | `#8A5214` |
  | Tối | `#3A2E1E` | `#EDE6D8` | `#E0A866` |

  Đây là cặp `--warn-bg` / `--ink` / `--warn` của DS. Tỉ lệ theo bảng DS:
  - chữ thân trên nền cảnh báo: 11,74 : 1 (sáng), 10,64 : 1 (tối);
  - icon: 5,27 : 1 và 6,27 : 1;
  - viền focus của nút đóng (`--focus` trên `--warn-bg`): 5,05 : 1 và 7,07 : 1.

  Tất cả đạt AA.
- Dòng cảnh báo đậm 500, câu "Đã lưu…" giữ 400: đúng thứ bậc, không thêm màu.
- **Ghi chú DS (việc UXD):** C18 hiện ghi toast "chỉ cho thông tin không quan trọng", "≥ 6 giây". Toast cảnh báo không tự tắt là biến thể UXD đã chọn ở 9.3. UXD thêm biến thể này vào C18 ở bản DS sau, kèm điều kiện dùng: đã lưu xong, cần kiểm lại, không có trang nào để đặt Alert. Việc này không cần FE làm gì.

### 1.5 Trả lời giả định FE-2

- **G1 – đồng ý, giữ như PR.** Máy chủ so đúng hai giá Desk gửi (`listPriceWarnings(monthly, nightly)` của cùng một dòng giá, `rooms.service.ts`). Vì vậy câu "tức Desk chưa bắt được" ở 9.3 ý 2 không đúng: nếu bỏ dòng sau khi xác nhận thì dòng này gần như không bao giờ hiện. UXD vẫn giữ lưới thứ hai vì:
  - giá đúng mà khác thường rất hiếm ở OTTIMO: giá đêm hiện hành bằng giá tháng ÷ 10,4–11,3, cách cả hai biên hơn gấp đôi (BR-101 ý 4);
  - người quen tay có thể bấm đúng chỗ nút Lưu mà không đọc chữ mới;
  - thừa một số 0 là sai giá trên báo giá và trên web cùng lúc (DOM 121-01).

  UXD sửa câu 9.3 ý 2 ở `copy-v1.0.5.md` bản 2.7: "Dòng này hiện mỗi khi phản hồi có mã, kể cả sau khi bấm Vẫn lưu giá này". Chữ của 4 khóa không đổi.
- **G2, G3 – đồng ý.**
- **Rủi ro FE nêu ở mục 6** (`VALUE_OUT_OF_RANGE` không có `min`/`max`, câu chung sẽ lộ `{min}`): chỉ gặp khi gõ số quá 9 triệu tỉ. Không cần thẻ chữ. Khi ARC thêm `min` ở 0.3.14, FE truyền biến như hiện nay.

### FB-R5-UXD-FE-138-01
- Mức độ: Major (điều kiện gộp #138)
- Vị trí: `product/packages/ui/src/styles/app.css`, khối `.toasts` (dòng 104–112 ở `4f348879`); `.toast` ở `product/design/wireframes/assets/wf.css:224` (`max-width: 420px`). Màn Danh mục căn sau khi lưu giá khác thường, 390 px.
- Vấn đề:
  - `.toasts` đặt `left: 50%` và `translateX(-50%)` mà không có bề rộng. Khung chứa vì thế chỉ rộng tối đa nửa khung nhìn.
  - Ở 390 px, toast cảnh báo của V5-5C rộng 195 px:
    - VI cao 236 px, EN cao 341 px, mỗi dòng 1–3 chữ;
    - toast không tự tắt, nên che cột giá đêm và cột Bán của 3 dòng căn tới khi bấm đóng.
  - Nút đóng của toast chỉ 36 × 32 px, dưới mức 44 × 44 px DS đặt cho điện thoại, kể cả nút trong toast.
- Vì sao quan trọng: chủ đầu tư và quản lý có đổi giá bằng điện thoại. Câu cảnh báo cần đọc liền một mạch thì mới bắt được lỗi thừa số 0. Mọi toast dài khác cũng bị ép như vậy, ví dụ `rooms.saved_scheduled` và `wifi.saved` của #136.
- Đề xuất sửa:
  - Cho khung toast rộng theo khung nhìn, trừ lề 16 px mỗi bên. Ở máy tính giữ như hiện nay (toast tối đa 420 px, giữa màn hình). Ví dụ:

    ```css
    .toasts { left: 16px; right: 16px; transform: none; justify-items: center; }
    ```

    `body:has(.app-mnav) .toasts` giữ nguyên `bottom`.
  - Nên làm cùng lượt (không là điều kiện): ở bề rộng điện thoại (≤ 760 px, cùng mốc `@media` của `wf.css`), nút đóng `.toast .btn` tối thiểu 44 × 44 px.
  - Kiểm:
    - 390 px: toast rộng 358 px (x = 16), bản EN không quá 6 dòng;
    - 1440 px: toast vẫn ≤ 440 px và ở giữa;
    - 360 px: không tràn ngang.
- Trạng thái: Open (FE-2)

---

## 2. #136 – V5-58, ô Wi-Fi trên Desk (S36)

### 2.1 Chữ: bảng UXD duyệt (36 khóa)

Nguồn chữ cho #136. FE-2 sửa trong nhóm "v1.0.5 Desk Wi-Fi – FE-2" của `gen_strings.py`. Trong ghi chú nhóm, đổi "chờ UXD duyệt" thành "UXD duyệt R5 Review 07/11 (`rounds/round-05/reviews/UXD-on-fe2-prs-136-138.md` mục 2.1)", rồi chạy lại công cụ. Mọi biến trong bảng là **bắt buộc truyền**.

| Khóa | UXD | VI | EN | Khi nào |
|---|---|---|---|---|
| `nav.wifi` | Giữ | Wi-Fi cơ sở | Property Wi-Fi | Mục nav nhóm Quản trị (OWN, MGR, FDL, FD) |
| `wifi.subtitle` | Giữ | Một mạng chung cho cả cơ sở. Khách thấy trên trang khách từ ngày nhận phòng. | One shared network for the whole property. Guests see it on their stay page from arrival day. | Phụ đề Topbar |
| `wifi.error_title` | Giữ | Chưa tải được Wi-Fi | Couldn't load the Wi-Fi | ErrorBlock khi GET lỗi |
| `wifi.current_title` | Giữ | Wi-Fi đang dùng | Wi-Fi in use | Tiêu đề thẻ |
| `wifi.ssid` | Giữ | Tên mạng | Network name | Nhãn ô, dòng dl ở thẻ và bước xem lại |
| `wifi.password` | Giữ | Mật khẩu Wi-Fi | Wi-Fi password | Nhãn ô, dòng dl |
| `wifi.open_network` | Giữ | Mạng mở, không có mật khẩu | Open network, no password | Mật khẩu rỗng, ở thẻ và bước xem lại (DOM 120-03 ý 1) |
| `wifi.none` | Giữ | Chưa nhập Wi-Fi. Trang khách đang mời khách hỏi lễ tân tên mạng và mật khẩu. | Wi-Fi isn't entered yet. The stay page asks guests to get the network name and password from reception. | `configured = false` |
| `wifi.none_ask` | Giữ | Báo chủ đầu tư hoặc quản lý nhập Wi-Fi. | Ask the owner or manager to enter the Wi-Fi. | Nối sau `wifi.none`, chỉ FDL, FD |
| `wifi.read_help` | Giữ | Đọc cho khách đúng từng ký tự. Chỉ chủ đầu tư và quản lý sửa được. | Read it to guests exactly, character by character. Only the owner and manager can change it. | Dưới thẻ, FDL, FD |
| `wifi.change_help` | Sửa VI, EN | Đổi mật khẩu trên bộ phát trước, rồi lưu ở đây ngay sau đó. Lưu xong, báo lễ tân để báo khách đang ở và thay thẻ Wi-Fi trong căn. | Change the password on the router first, then save it here straight away. Then tell the receptionists so they can let in-house guests know, and replace the Wi-Fi cards in the rooms. | Dưới thẻ, OWN, MGR, **chỉ khi `configured = true`** |
| `wifi.enter` | Giữ | Nhập Wi-Fi | Enter Wi-Fi | Nút, `configured = false` |
| `wifi.edit` | Giữ | Sửa Wi-Fi | Edit Wi-Fi | Nút, `configured = true` |
| `wifi.form_title` | Sửa VI, EN | Nhập Wi-Fi | Enter Wi-Fi | Tiêu đề hộp, bước nhập (cả lần đầu và lần sửa: hai ô luôn trống) |
| `wifi.form_lead` | Giữ | Gõ cả hai ô đúng như trên bộ phát: chữ hoa, chữ thường và khoảng trắng đều tính. | Type both exactly as on the router: capitals, small letters and spaces all count. | Dòng đầu bước nhập |
| `wifi.ssid_help` | Sửa EN | Tối đa {max} ký tự không dấu; chữ có dấu tính 2–3 ký tự. Không ghi số căn hay tên đăng nhập của nhân viên. | Up to {max} plain characters; an accented letter counts as 2–3. No room number and no staff username. | Trợ giúp ô tên mạng; `{max}` = 32 |
| `wifi.password_help` | Giữ | {min}–{max} ký tự: chữ không dấu, số, dấu câu, khoảng trắng. Để trống nếu bộ phát để mạng mở. | {min}–{max} characters: plain letters, digits, punctuation, spaces. Leave it empty if the router has an open network. | Trợ giúp ô mật khẩu; `{min}` = 8, `{max}` = 63 |
| `wifi.review` | Giữ | Xem lại | Review | Nút chính bước nhập |
| `wifi.review_title` | Giữ | Kiểm lại Wi-Fi trước khi lưu | Check the Wi-Fi before saving | Tiêu đề hộp, bước xem lại |
| `wifi.review_lead` | Giữ | Khách sẽ thấy trên trang khách: | Guests will see this on their stay page: | Dòng đầu bước xem lại |
| `wifi.review_open_note` | Sửa VI, EN | Mật khẩu đang để trống. Chỉ lưu khi bộ phát cũng để mạng mở; bộ phát có mật khẩu thì bấm Sửa lại để gõ. | The password is empty. Save only if the router also has an open network. If the router has a password, go back and type it. | `Alert tone="warn"` ở bước xem lại khi mật khẩu rỗng |
| `wifi.review_edge_space` | **Mới** | Mật khẩu có khoảng trắng ở đầu hoặc cuối. Kiểm lại trên bộ phát: thừa hay thiếu một khoảng trắng là khách không vào được mạng. | The password starts or ends with a space. Check it on the router: one space too many or too few and guests can't connect. | `Alert tone="warn"` ở bước xem lại khi mật khẩu khác rỗng và `key !== key.trim()`; đặt sau dl, trước `wifi.review_applies` |
| `wifi.review_applies` | Sửa VI | Lưu xong, mọi khách đang ở sẽ thấy giá trị mới khi mở lại trang khách. | Once saved, it applies to every in-house guest the next time they open their stay page. | Cuối bước xem lại |
| `wifi.save` | Giữ | Lưu Wi-Fi | Save Wi-Fi | Nút chính bước xem lại |
| `wifi.saved` | Giữ | Đã lưu Wi-Fi. Trang khách hiện giá trị mới ở lần mở sau. | Wi-Fi saved. Stay pages show it the next time they open. | Toast sau khi lưu |
| `wifi.err_ssid_required` | Giữ | Nhập tên mạng. | Enter the network name. | Lỗi ô tên mạng, rỗng sau khi bỏ khoảng trắng |
| `wifi.err_ssid_long` | Giữ | Tên mạng quá dài: tối đa {max} ký tự không dấu (chữ có dấu tính 2–3). Bớt chữ hoặc bỏ dấu. | The network name is too long: up to {max} plain characters (an accented letter counts as 2–3). Shorten it or drop the accents. | Lỗi ô tên mạng, quá 32 byte hoặc có ký tự điều khiển (`VALUE_OUT_OF_RANGE`) |
| `wifi.err_ssid_not_allowed` | Sửa EN | Tên mạng không được có số căn hay tên đăng nhập của nhân viên. Đặt tên khác. | The network name can't contain a room number or a staff username. Choose another name. | 422 `NOT_ALLOWED` `ssid` (số căn, tên đăng nhập) |
| `wifi.err_password_range` | Giữ | Mật khẩu Wi-Fi cần {min}–{max} ký tự: chữ không dấu, số, dấu câu hoặc khoảng trắng. Để trống nếu mạng mở. | The Wi-Fi password needs {min}–{max} characters: plain letters, digits, punctuation or spaces. Leave it empty for an open network. | Lỗi ô mật khẩu, dạng sai (`VALUE_OUT_OF_RANGE`) |
| `wifi.err_password_login` | Sửa VI, EN | Mật khẩu này trùng mật khẩu đăng nhập Desk của bạn. Gõ mật khẩu đang đặt trên bộ phát; nếu bộ phát cũng dùng mật khẩu này, đổi mật khẩu bộ phát trước. | This matches your Desk sign-in password. Type the password set on the router. If the router uses this same password, change the router password first. | 422 `NOT_ALLOWED` `password` (SR-RL-15) |
| `wifi.log_title` | Giữ | Lần lưu gần đây | Recent saves | Tiêu đề thẻ nhật ký (OWN, MGR) |
| `wifi.log_empty` | Giữ | Chưa có lần lưu nào trong {days} ngày qua. | No saves in the last {days} days. | Không có dòng trong `{days}` = 92 ngày |
| `wifi.log_first` | Giữ | Nhập Wi-Fi lần đầu: {to} | Wi-Fi entered for the first time: {to} | `before.ssid` = null |
| `wifi.log_ssid` | Giữ | Đổi tên mạng: {from} → {to} | Network name changed: {from} → {to} | `before.ssid` ≠ `after.ssid` |
| `wifi.log_password` | Giữ | Đổi mật khẩu Wi-Fi | Wi-Fi password changed | `after.passwordChanged` = true (ghép sau `log_ssid` bằng " · " khi cả hai) |
| `wifi.log_unchanged` | Giữ | Lưu lại Wi-Fi, không đổi | Wi-Fi saved again, no change | Cùng tên mạng, `passwordChanged` = false (DOM 120-03 ý 2) |

Chữ FE-2 viết ở 7 khóa UXD sửa (để đối chiếu):

| Khóa | VI của FE-2 | EN của FE-2 |
|---|---|---|
| `wifi.form_title` | Nhập tên mạng và mật khẩu Wi-Fi | Enter the Wi-Fi network name and password |
| `wifi.ssid_help` | Tối đa {max} ký tự không dấu; chữ có dấu tính 2–3 ký tự. Không ghi số căn hay tên đăng nhập của nhân viên. | Up to {max} plain characters; an accented letter counts as 2–3. No room number and no staff sign-in name. |
| `wifi.err_ssid_not_allowed` | Tên mạng không được có số căn hay tên đăng nhập của nhân viên. Đặt tên khác. | The network name can't contain a room number or a staff sign-in name. Choose another name. |
| `wifi.change_help` | Đổi mật khẩu trên bộ phát trước, rồi lưu ở đây ngay sau đó. Lưu xong, báo lễ tân để báo khách đang ở. | Change the password on the router first, then save it here straight away. Then tell the receptionists so they can let in-house guests know. |
| `wifi.review_open_note` | Chỉ chọn khi bộ phát cũng để mạng mở. | Only choose this if the router also has an open network. |
| `wifi.review_applies` | Lưu xong là áp cho mọi khách đang ở, ở lần mở trang khách sau. | Once saved, it applies to every in-house guest the next time they open their stay page. |
| `wifi.err_password_login` | Mật khẩu Wi-Fi không được trùng mật khẩu đăng nhập Desk của bạn. Chọn mật khẩu khác. | The Wi-Fi password can't be the same as your Desk sign-in password. Choose a different one. |

Vì sao sửa:
- `form_title`: ở 390 px, bản VI xuống dòng giữa chữ "Wi-" và "Fi" (đo bằng script: dòng 1 "Nhập tên mạng và mật khẩu Wi-", dòng 2 "Fi"). Câu ngắn không xuống dòng ở 360 px, và cũng hợp với lần sửa vì hai ô luôn trống.
- `ssid_help`, `err_ssid_not_allowed` (EN): Desk EN gọi "tên đăng nhập" là "username" (`auth.login.username`, `error.USERNAME_TAKEN`). "sign-in name" chưa có ở đâu khác.
- `change_help`: thêm bước thay thẻ Wi-Fi trong căn (BR-808, DOM 120-02 bước 5). Chủ đầu tư đổi mật khẩu ở màn này, nên nhắc ở đây là đúng lúc. Câu nói về việc "đổi" nên không hiện khi chưa nhập lần nào.
- `review_open_note`: người dùng không "chọn" gì, họ để trống ô. Câu mới nói rõ ô đang trống và cách sửa (nút "← Sửa lại"). Giữ đúng nghĩa DOM 120-03 ý 1.
- `review_applies` (VI): bỏ lặp "ở … ở".
- `err_password_login`: ca hay gặp nhất là trình duyệt hay trình quản lý mật khẩu tự điền mật khẩu Desk (SEC ARC-04). "Chọn mật khẩu khác" không nói đổi ở đâu. Theo quy trình DOM thì phải đổi trên bộ phát trước. **SEC xem thêm:** nếu bộ phát thật sự đang dùng mật khẩu Desk, có cần nhắc đổi luôn mật khẩu Desk không. Đây là chính sách bảo mật, UXD không tự thêm vào chữ.
- `review_edge_space` (mới): Desk không cắt khoảng trắng của mật khẩu (đúng, vì WPA2 cho phép). Nhưng khoảng trắng ở đầu và cuối không nhìn thấy, kể cả bằng JetBrains Mono, và hay đến từ thao tác dán. Câu này làm nốt DOM 120-03 ý 3 ("thấy được khoảng trắng").

### 2.2 SEC ARC-04 phía client (hợp đồng mục "Client")

| Yêu cầu | Đo trên mock |
|---|---|
| Ô mật khẩu Wi-Fi không là `type="password"`, có nút ẩn/hiện | `type="text"`. Nút "Ẩn" / "Hiện" dùng `-webkit-text-security: disc` (đo `webkitTextSecurity` = `disc`). Mặc định hiện chữ |
| Form và hai ô `autocomplete="off"` | Form `off`, hai ô `off`. Có thêm `data-1p-ignore`, `data-lpignore`, `spellcheck=false`, `autocapitalize=none` |
| `name`/`id` không chứa user, login, pass | `wifiNetworkName`, `wifiKey`; `id` là `useId` |
| Không điền sẵn | Cả hai ô trống khi mở, cả lần đầu lẫn lần sửa (độ dài giá trị = 0) |
| Bước xác nhận "Khách sẽ thấy" | "Khách sẽ thấy trên trang khách:", hai dòng JetBrains Mono. Mật khẩu rỗng ghi "Mạng mở, không có mật khẩu" kèm Alert warn |

Kiểm trình duyệt có tài khoản Desk đã lưu (Chrome, Safari) vẫn là việc QA trên staging, như báo cáo FE-2.

### 2.3 Trạng thái theo vai (mock, 1440 và 390)

| Vai, trạng thái | Kết quả |
|---|---|
| OWN, chưa nhập | Thẻ "Wi-Fi đang dùng", Alert warn `wifi.none`, nút "Nhập Wi-Fi". Câu `change_help` vẫn hiện: sửa ở 136-01 |
| OWN, lỗi dạng (bấm "Xem lại") | Ô trống → "Nhập tên mạng."; tên 36 ký tự → `err_ssid_long`; mật khẩu 7 ký tự → `err_password_range`. Viền lỗi 2 px, `aria-invalid`, `aria-describedby` = lỗi + trợ giúp. **Focus ở lại nút "Xem lại"**: thẻ 136-02 |
| OWN, 422 từ máy chủ | "OTTIMO 101" và tên đăng nhập `qa.fd` → `err_ssid_not_allowed`. Mật khẩu trùng mật khẩu đăng nhập (giá trị thử trong seed) → `err_password_login`. Hộp quay về bước nhập, giữ giá trị. **Focus rơi về `<body>`**: thẻ 136-02 |
| OWN, xem lại → lưu | Toast `wifi.saved`. Thẻ hiện hai giá trị mono. Nhật ký thêm "Nhập Wi-Fi lần đầu: OTTIMO BOUTIQUE STAY" |
| OWN, mạng mở | Bước xem lại: "Mạng mở, không có mật khẩu" và Alert warn. Thẻ cũng ghi như vậy |
| OWN, lưu lại cùng giá trị | Nhật ký "Lưu lại Wi-Fi, không đổi" (DOM 120-03 ý 2) |
| OWN, đổi tên và mật khẩu | "Đổi tên mạng: OTTIMO BOUTIQUE STAY → OTTIMO STAY GUEST · Đổi mật khẩu Wi-Fi". Hai khoảng trắng liền nhau trong tên mới bị gộp thành một ở nhật ký: thẻ 136-03 |
| Mất mạng ở bước xem lại | Nút "Lưu Wi-Fi" bị khóa (`disabled`), bật lại khi có mạng |
| Đang lưu | `busyLabel` "Đang lưu…", nút "← Sửa lại" bị khóa (đọc mã) |
| Đóng khi đang gõ | Esc mở hộp "chưa lưu", focus vào "Tiếp tục nhập" |
| MGR | Như OWN: có nút "Sửa Wi-Fi" và thẻ nhật ký |
| FDL, FD, có Wi-Fi | Thẻ chỉ đọc, hai giá trị mono, dòng `read_help`. Không có nút, không có nhật ký |
| FD, chưa nhập | Alert "Chưa nhập Wi-Fi… Báo chủ đầu tư hoặc quản lý nhập Wi-Fi." |
| FD, GET lỗi (500) | ErrorBlock "Chưa tải được Wi-Fi", câu lỗi chung, nút "Thử lại", đúng mẫu states |
| HK, SAL | Không có mục nav. Mở thẳng `/settings/wifi` → "Bạn không có quyền mở trang này" |

Ghi chú về ca lỗi của OWN:
- Trên mock dev, lỗi một lần của `failNext` bị lần gọi thứ hai của React StrictMode che: lần đầu lỗi, lần sau thành công. Vì vậy ảnh OWN không ra ErrorBlock.
- Ca này dùng cùng nhánh mã với FD. Production không chạy StrictMode, nên UXD không ghi thẻ.

### 2.4 Bố cục 1440 và 390 px

- **Tràn ngang:** 0 px ở cả 6 cấu hình (1440/390 × sáng VI, tối VI, sáng EN), ở mọi bước của hộp và trang.
- **Hộp ở 390 px:** rộng 358 px (x = 16). Hai ô vừa khung: tên mạng 322 px, mật khẩu 281 px cạnh nút "Ẩn". Dòng lỗi và trợ giúp xuống dòng gọn.
  - Tiêu đề VI tách "Wi-" / "Fi": sửa bằng chữ ở 136-01.
- **Thẻ "Wi-Fi đang dùng" và nhật ký ở 390 px:** dl hai cột vừa khung, dòng nhật ký dài tự xuống dòng.
- **Tối:** chữ, viền ô, Alert warn và nút chính đúng token tối. Ảnh 1440 và 390 không có cặp màu lạ.
- **Ngoài phạm vi PR này, không ghi thẻ:** ở 390 px, nút của Desk cao 32–36 px và ô nhập cỡ 13–14 px. Hai mức này dưới 44 px và 16 px mà DS đặt cho điện thoại. Toàn bộ admin-web ở 390 px đều như vậy, không riêng màn này. Toast 390 px: xem 138-01.

### 2.5 JetBrains Mono và điều khách thấy cuối cùng

| Chỗ | Font, cỡ | Khoảng trắng |
|---|---|---|
| Desk, thẻ "Wi-Fi đang dùng" (OWN, MGR, FDL, FD) | JetBrains Mono 13 px (`.mono`) | Giữ nguyên (`pre-wrap`): khoảng trắng đầu dòng thấy được dưới dạng lề, hai khoảng trắng giữ đủ |
| Desk, bước xem lại | JetBrains Mono 13 px | Giữ nguyên |
| Desk, hai ô nhập | JetBrains Mono 13 px | – |
| Desk, nhật ký | JetBrains Mono 13 px | **Gộp** (`white-space: normal`): 136-03 |
| **Trang khách**, `WifiBlock` (`.gw-code`) | JetBrains Mono 16 px (G5) | **Gộp và không xuống dòng** (`nowrap`): 136-05 |

Trang khách hiện đúng giá trị Desk lưu, vì cả hai đọc cùng hàm `wifiOf`, nên lễ tân đọc đúng chữ khách thấy. Đo trên guest-web ở 390 px, có ba chỗ khác với điều bước xem lại hứa:
1. **Mạng mở:** khách thấy "Mật khẩu:" / "Password:" / "Пароль:" rồi bỏ trống, không có nút sao chép. Bước xem lại của Desk lại ghi khách sẽ thấy "Mạng mở, không có mật khẩu".
2. **Tên mạng 32 ký tự** (mức tối đa Desk cho lưu) **và mật khẩu dài:** chữ chạy ra ngoài thẻ và bị cắt.
   - Tên mạng: mép phải 474 px, trong khi thẻ kết thúc ở 374 px. Ô tên mạng không có nút sao chép, nên khách không đọc được phần cuối.
   - Mật khẩu 33 ký tự: mép phải 484 px.
   - Tên thật "OTTIMO BOUTIQUE STAY" (20 ký tự) vẫn vừa: mép phải 355 px.
3. **Khoảng trắng:**
   - Desk lưu tên "OTTIMO STAY  GUEST" (hai khoảng trắng), trang khách hiện "OTTIMO STAY GUEST";
   - mật khẩu " key  with spaces " hiện thành "key with spaces".

   Nút sao chép vẫn chép đúng giá trị gốc. Người gõ tay, hoặc lễ tân đọc từ trang khách, sẽ sai.

Rủi ro ngày lên bản thấp: OTTIMO dùng một mạng có mật khẩu, tên 20 ký tự (ESC-022 B). Nhưng Desk đã cho lưu các giá trị trên, nên UXD ghi thẻ 136-05 cho làn trang khách.

### 2.6 Trả lời thẻ DOM FB-R5-DOM-UXD-120-03 (gửi UXD, FE-A)

- **Ý 1 (mật khẩu trống):** đã có ở #136: `wifi.open_network` ở thẻ và bước xem lại, cùng Alert. Bản chữ chốt của Alert là `review_open_note` (136-01). Phía trang khách còn thiếu: 136-05 (1).
- **Ý 2 (nhãn nhật ký):** đúng nguyên văn DOM: "Lưu lại Wi-Fi, không đổi", "Đổi mật khẩu Wi-Fi", "Đổi tên mạng: … → …".
- **Ý 3 (JetBrains Mono, thấy khoảng trắng):** đã có ở thẻ và bước xem lại. Còn hai chỗ: khoảng trắng đầu/cuối (`review_edge_space`, 136-01) và nhật ký (136-03).
- UXD ghi **Done** cho thẻ này ở `responses/UXD-responses.md` khi #136 áp 136-01. Phần trang khách theo 136-05.

### FB-R5-UXD-FE-136-01
- Mức độ: Major (điều kiện gộp #136)
- Vị trí: `product/design/tools/gen_strings.py`, nhóm "v1.0.5 Desk Wi-Fi – FE-2" (35 khóa, ghi chú "chờ UXD duyệt"); `product/apps/admin-web/src/pages/WifiPage.tsx`: `WifiPage` (câu dưới thẻ) và `WifiDialog` (bước xem lại).
- Vấn đề:
  - 35 khóa đang là nháp chờ UXD. 7 khóa cần sửa chữ, lý do ở mục 2.1:
    - tiêu đề hộp tách "Wi-/Fi" ở 390 px;
    - EN dùng "sign-in name" thay "username";
    - thiếu bước thay thẻ Wi-Fi trong căn;
    - câu mạng mở nói "chọn";
    - câu VI lặp "ở … ở";
    - câu trùng mật khẩu Desk không nói đổi ở đâu.
  - Thiếu câu cho mật khẩu có khoảng trắng đầu/cuối.
  - Câu "Đổi mật khẩu trên bộ phát trước…" hiện cả khi chưa nhập Wi-Fi lần nào.
- Vì sao quan trọng:
  - Màn này là nơi chủ đầu tư nhập Wi-Fi ngày lên bản (plan T14). Lỗi ở đây làm cả cơ sở mất mạng, hoặc khiến trang khách hiện mật khẩu bộ phát chưa nhận.
  - Thiếu một khoảng trắng là khách không vào được mạng mà không biết vì sao.
- Đề xuất sửa:
  1. Áp đúng từng byte bảng mục 2.1: sửa 7 khóa, thêm `wifi.review_edge_space`, đổi ghi chú nhóm thành đã duyệt, rồi chạy lại `gen_strings.py`.
  2. `WifiDialog`, bước xem lại: khi `key !== ''` và `key !== key.trim()`, hiện `Alert tone="warn"` với `wifi.review_edge_space`, sau dl, trước `wifi.review_applies`. Không chặn lưu.
  3. `WifiPage`: chỉ hiện `wifi.change_help` khi `wifi.configured`. Khi chưa nhập, thẻ chỉ có Alert `wifi.none` và nút "Nhập Wi-Fi".
  4. Test:
     - mật khẩu " test-wifi-key " → bước xem lại có Alert khoảng trắng;
     - mật khẩu không có khoảng trắng ở hai đầu → không có Alert này;
     - OWN chưa nhập → không có `change_help`.

     Các test đọc chữ qua `tv()` tự theo chữ mới.
- Trạng thái: Open (FE-2)

### FB-R5-UXD-FE-136-02
- Mức độ: Minor
- Vị trí: `WifiPage.tsx`, `toReview` (lỗi dạng) và nhánh `VALIDATION_FAILED` của `save` (422 đưa về bước nhập).
- Vấn đề:
  - Lỗi dạng: focus ở lại nút "Xem lại".
  - 422 từ máy chủ (số căn, tên đăng nhập, mật khẩu trùng): hộp đổi về bước nhập và focus rơi về `<body>` (đo `document.activeElement`).
- Vì sao quan trọng:
  - Người dùng bàn phím mất chỗ đang đứng trong hộp. Trình đọc màn hình không đọc câu lỗi (WCAG 2.4.3, 3.3.1).
  - Ca 422 chỉ lộ ra sau bước xem lại, nên người dùng dễ tưởng đã lưu.
- Đề xuất sửa: sau khi đặt lỗi, đưa focus vào ô đầu tiên có `aria-invalid="true"`. Mẫu có sẵn ở `components/StrongReauthDialog.tsx:107`. Thêm một ca test: 422 `NOT_ALLOWED` `ssid` → focus ở ô tên mạng.
- Trạng thái: Open (FE-2)

### FB-R5-UXD-FE-136-03
- Mức độ: Minor
- Vị trí: `WifiPage.tsx`:
  - `style={{ margin: 0 }}`, `style={{ marginTop: 0 }}`, `style={{ marginBottom: 0 }}` (5 chỗ);
  - hằng `VALUE` (`whiteSpace: 'pre-wrap'`, `overflowWrap: 'anywhere'`);
  - `style={{ borderRadius: 0 }}` trên nút "Ẩn";
  - `WifiChangeLine` (`monoArgs` với `.mono` thường).
- Vấn đề:
  - DS không cho `style=` nội tuyến. Bảng "mẫu nội tuyến → lớp thay thế" của DS đã có `.m-0`, `.input.square` và các lớp lề cho đúng những mẫu này.
  - Nhật ký dùng `.mono` không có `pre-wrap`, nên gộp khoảng trắng. Đo được: thẻ hiện "OTTIMO STAY  GUEST", nhật ký hiện "OTTIMO STAY GUEST" cho cùng một giá trị.
- Vì sao quan trọng: cùng một tên mạng hiện hai kiểu ở hai thẻ liền nhau. Chủ đầu tư dò lỗi "khách không vào được" sẽ thấy nhật ký nói khác thẻ.
- Đề xuất sửa:
  - thêm một lớp trong `packages/ui/src/styles/app.css`, ví dụ `.mono.wifi-value { white-space: pre-wrap; overflow-wrap: anywhere; }`, dùng cho thẻ, bước xem lại và giá trị `{from}`, `{to}` trong nhật ký;
  - thay các `style=` lề bằng lớp DS có sẵn;
  - thêm `.input-affix .btn { border-radius: 0; }` cạnh `.input-affix .input` (`product/design/hifi/assets/hifi.css:158`), rồi bỏ `style={{ borderRadius: 0 }}`. `LoginPage.tsx` dùng cùng mẫu; bỏ luôn ở đó nếu tiện, không bắt buộc trong PR này.
- Trạng thái: Open (FE-2)

### FB-R5-UXD-FE-136-04
- Mức độ: Suggestion
- Vị trí: `WifiValue` (thẻ "Wi-Fi đang dùng") và bước xem lại.
- Vấn đề: giá trị Wi-Fi dùng `.mono` 13 px, nhỏ hơn chữ thân Desk 14 px. Lễ tân đọc to cho khách "đúng từng ký tự" (`wifi.read_help`). Ở 13 px, các cặp `I l 1` và `O 0 o` vẫn phân biệt được, nhưng phải nhìn gần.
- Vì sao quan trọng: đây là chỗ duy nhất trên Desk mà người dùng cần đọc từng ký tự cho người khác nghe. Trang khách đã dùng 16 px cho cùng giá trị (G5).
- Đề xuất sửa: lớp `.mono.wifi-value` ở 136-03 thêm `font-size: 1rem` cho thẻ và bước xem lại. Ô nhập giữ cỡ ô nhập của Desk.
- Trạng thái: Open (FE-2 tự cân nhắc)

### FB-R5-UXD-FE-136-05
- Mức độ: Minor (không chặn #136; nên cùng tag với #136, không kịp thì v1.0.6)
- Vị trí: trang khách, `product/apps/guest-web/src/pages/WifiBlock.tsx` và `.gw-code` trong `product/apps/guest-web/src/styles.css` (`white-space: nowrap`). Làn FE-B; chữ: UXD, CPY.
- Vấn đề (đo trên guest-web mock, mục 2.5):
  1. Mạng mở: dòng mật khẩu bỏ trống ở cả VI, EN, RU, trong khi bước xem lại của Desk hứa "Mạng mở, không có mật khẩu".
  2. Tên mạng 32 ký tự và mật khẩu dài chạy ra ngoài thẻ ở 390 px và bị cắt. Tên mạng không có nút sao chép.
  3. Khoảng trắng lặp bị gộp; khoảng trắng đầu/cuối không thấy.
- Vì sao quan trọng: khách chỉ có trang này để vào mạng. Desk nói một đằng, khách thấy một nẻo, và lễ tân không biết vì sao khách báo "không vào được".
- Đề xuất sửa:
  - `.gw-code` của Wi-Fi: `white-space: pre-wrap; overflow-wrap: anywhere;`. Mã đặt phòng `OTM-…` giữ `nowrap` nếu cần, ví dụ thêm lớp riêng cho Wi-Fi.
  - `WifiBlock`: khi `wifi.password === ''`, thay dòng mật khẩu bằng một câu. Chữ nháp UXD, **CPY duyệt trước khi dùng** (chuỗi hướng khách):

    | Khóa | EN | VI | RU |
    |---|---|---|---|
    | `gw.wifi_open` | Open network, no password needed. | Mạng mở, không cần mật khẩu. | Открытая сеть, пароль не нужен. |

  - Kiểm ở 390 px VI/EN/RU: tên 32 ký tự xuống dòng trong thẻ; mạng mở có câu; "OTTIMO STAY  GUEST" giữ hai khoảng trắng.
  - Không kịp tag v1.0.5 thì BA ghi một dòng ở sổ tay, mục Wi-Fi: "Mạng mở: trang khách để trống dòng mật khẩu".
- Trạng thái: Open (FE-B, CPY; UXD đưa chữ vào `copy-v1.0.5.md` khi CPY duyệt)

---

## 3. Điểm tốt

- **#138:**
  - Desk tự kiểm đúng điều kiện của máy chủ, so bằng số nguyên, đúng bằng biên thì không báo. Test khóa đúng ví dụ 8.500.000 của DOM;
  - Alert là `aria-describedby` của nút xác nhận, nên người dùng trình đọc màn hình nghe được vì sao nút đổi chữ;
  - toast cảnh báo dùng đúng cặp token DS, sáng và tối, không thêm màu.
- **#136:**
  - đủ năm ý phía client của SEC ARC-04;
  - hai bước nhập rồi xem lại rõ ràng, nhãn nhật ký đúng nguyên văn DOM;
  - đủ trạng thái cho cả 8 vai: chưa nhập, lỗi tải, chỉ đọc, không có quyền, mất mạng, đóng khi đang gõ;
  - JetBrains Mono ở mọi chỗ có giá trị Wi-Fi.
- **Báo cáo FE-2:** ghi rõ giả định (G1–G3) và rủi ro gộp, nên UXD quyết được ngay mà không phải hỏi lại.

## 4. Việc UXD tự làm sau review (không phải thẻ)

- `copy-v1.0.5.md` bản 2.7:
  - 9.3 ý 2: sửa câu theo G1 (mục 1.5);
  - mục 9.19 mới: chép bảng 2.1 (36 khóa) và chữ nháp `gw.wifi_open` sau khi CPY duyệt;
  - cập nhật mục 0, 6, 8.
- `design-system.md` C18: thêm biến thể toast cảnh báo không tự tắt (mục 1.4).
- `responses/UXD-responses.md`: thẻ DOM 120-03 ghi Done khi #136 áp 136-01.

## 5. Giả định

1. Admin-web chạy trên mock, không có stack thật. Hành vi máy chủ đọc từ `main`: `rooms.service.ts` cho V5-1A, `property-wifi.ts` (`wifiOf`) và hợp đồng 0.3.13 cho V5-58.
2. OTTIMO lên bản với một mạng có mật khẩu, tên "OTTIMO BOUTIQUE STAY" (ESC-022 B). Vì vậy 136-05 là Minor.
3. Mốc 390 px là điện thoại của chủ đầu tư và quản lý. Mốc 1440 px là máy quầy.

## 6. Dòng đề xuất cho `01-decisions/decision-log.md`

```
| 2026-11-07 | 5 | **UXD – review FE-2 #138 (V5-5C) @ 4f348879 và #136 (V5-58 Desk Wi-Fi, nháp) @ c55f90e3: cả hai DUYỆT CÓ ĐIỀU KIỆN.** #138: 4 khóa 9.3 khớp từng byte; hai biên, đúng biên, nút "Vẫn lưu giá này", toast cảnh báo không tự tắt đúng 9.3; G1 giữ (dòng cảnh báo cả sau khi xác nhận; UXD sửa 9.3 ý 2 ở bản 2.7); điều kiện 138-01 Major: .toasts chỉ rộng 50vw (195 px ở 390, toast EN cao 341 px). #136: SEC ARC-04 phía client đủ, đủ trạng thái 8 vai, JetBrains Mono mọi chỗ có giá trị Wi-Fi, không tràn ở 1440/390; UXD duyệt 35 khóa FE-2 (giữ 28, sửa 7, thêm wifi.review_edge_space), bảng ở mục 2.1 là nguồn chữ tới copy-v1.0.5 mục 9.19; điều kiện 136-01 Major (áp bảng, Alert khoảng trắng đầu/cuối, ẩn change_help khi chưa nhập); 136-02 focus sau lỗi, 136-03 bỏ style= và giữ khoảng trắng ở nhật ký (Minor); 136-04 giá trị 16 px (Suggestion); 136-05 Minor cho trang khách (FE-B, CPY): mạng mở để trống dòng mật khẩu, .gw-code nowrap cắt tên 32 ký tự ở 390 và gộp khoảng trắng. Cả hai PR phải gộp main và chạy lại gen_strings.py | UXD | Chữ, cách hiện, màu và font thuộc quyền UXD trong khuôn khổ thương hiệu; đo trên mock 1440/390 px, sáng/tối, VI/EN, đủ vai, và trên guest-web VI/EN/RU; không ESC |
```
