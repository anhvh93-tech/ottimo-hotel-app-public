# FE-2 – v1.0.5 V5-58 `r5-fe-v5-58`: ô nhập Wi-Fi trên Desk (BUG-R3-021 phần Desk)

- Người viết: FE-2 | Round 5 – bước **Sản xuất** | 07/11/2026
- Nhánh: `r5-fe-v5-58` cắt từ `origin/main` @ `77d197a4`, đã gộp `main` mới (merge, không rebase). **Gộp sau #120** (máy chủ `r5-v5-58` @ `f1ac530b`).
- Căn cứ: `rounds/round-05/plan.md` dòng V5-58; ARC `contract-0.3.13.md` mục 1.13, 1.23, 1.25, 1.26 (bổ sung 1, 1d, 1e, 1f); `openapi.yaml` `getPropertyWifi` / `setPropertyWifi` / `listAuditEvents`; DOM `DOM-on-be-pr-120-v5-58.md` (thẻ FB-R5-DOM-UXD-120-03); rbac S36 ghi chú 47.
- **Không đổi `openapi.yaml`.** Không sửa decision-log.

## 1. Đã làm gì
- Màn mới **S36 "Wi-Fi cơ sở"** (`/settings/wifi`), mục nav nhóm Quản trị, ngay dưới "Tham số quy tắc". Thấy: OWN, MGR, FDL, FD (đúng `x-roles` của `getPropertyWifi`). HK, MT, SAL, CTV không thấy mục và mở thẳng đường dẫn thì gặp trang "không có quyền".
- **Thẻ "Wi-Fi đang dùng"**: tên mạng và mật khẩu hiện bằng JetBrains Mono (`.mono`), giữ khoảng trắng (DOM 120-03 ý 3: l/1, O/0). Mật khẩu rỗng ghi bằng chữ "Mạng mở, không có mật khẩu". Chưa có Wi-Fi: khung cảnh báo nói trang khách đang mời khách hỏi lễ tân; FDL/FD thêm câu "Báo chủ đầu tư hoặc quản lý nhập Wi-Fi."
- **OWN/MGR** có nút "Nhập Wi-Fi" / "Sửa Wi-Fi" mở hộp thoại 2 bước:
  1. **Nhập**: hai ô luôn **trống khi mở** (kể cả khi đã có Wi-Fi), ô chữ thường (không bao giờ `type="password"`), `autocomplete="off"` ở form và cả hai ô, `name` = `wifiNetworkName` / `wifiKey` (không có user/login/pass), `data-1p-ignore`, `data-lpignore`, tắt sửa chính tả và viết hoa tự động (SEC ARC-04, T58-10). Mặc định mật khẩu **hiện rõ** để gõ đúng như trên bộ phát; nút "Ẩn" chỉ che ký tự bằng CSS (`.wifi-masked`, `-webkit-text-security: disc`), ô vẫn là ô chữ.
  2. **Xem lại** "Khách sẽ thấy trên trang khách": tên mạng (đã bỏ khoảng trắng hai đầu, như máy chủ) và mật khẩu đúng như gõ (không cắt khoảng trắng). Mật khẩu rỗng → "Mạng mở, không có mật khẩu" + lưu ý "Chỉ chọn khi bộ phát cũng để mạng mở." (DOM 120-03 ý 1). Nút "Lưu Wi-Fi" tắt khi mất mạng.
- **Kiểm dạng trên máy** trước bước xem lại, cùng luật với máy chủ (`app/wifi.ts`): tên 1–32 byte UTF-8, không ký tự điều khiển; mật khẩu rỗng hoặc 8–63 ký tự ASCII in được. Máy chủ vẫn là nơi quyết định.
- **422 của máy chủ** đưa về đúng ô và quay lại bước nhập, giá trị đã gõ còn nguyên: `ssid` `NOT_ALLOWED` (số căn, tên đăng nhập nhân viên), `ssid` `VALUE_OUT_OF_RANGE` (dùng `max` ở gốc body = 32), `password` `VALUE_OUT_OF_RANGE`, `password` `NOT_ALLOWED` (trùng mật khẩu đăng nhập Desk của chính mình, SR-RL-15). Câu SR-RL-15 chỉ hiện khi máy chủ trả mã khớp; khi máy chủ bỏ qua phép so (quá 5 lần/24 giờ) thì lưu bình thường, Desk không nói gì thêm.
- Lưu xong: toast "Đã lưu Wi-Fi…", thẻ đọc lại từ máy chủ (câu trả lời PUT không có `password`).
- **Thẻ "Lần lưu gần đây"** (chỉ OWN/MGR): đọc `listAuditEvents` `category=config`, `action=property.wifi_changed`, 92 ngày gần nhất, 5 dòng. Mỗi dòng nói bằng chữ: "Nhập Wi-Fi lần đầu: …", "Đổi tên mạng: … → …", "Đổi mật khẩu Wi-Fi", "Lưu lại Wi-Fi, không đổi" (DOM 120-03 ý 2), kèm người lưu và giờ. Dòng nhật ký không bao giờ có mật khẩu (máy chủ cũng không ghi).
- `@ottimo/api-client`: `getPropertyWifi`, `setPropertyWifi`, `listPropertyWifiChanges` (bọc `listAuditEvents` với bộ lọc cố định, để không đụng `ListAuditQuery` mà PR #128 đang sửa); kiểu `PropertyWifi`, `SetPropertyWifiBody`.
- Mock MSW `mocks/wifi.ts` bám máy chủ PR #120 @ `f1ac530b`: thứ tự kiểm, `max: 32`, số căn là một từ riêng, tên đăng nhập nhân viên (cả tài khoản đã khóa), **so mật khẩu đăng nhập chỉ khi mọi kiểm khác đã qua** (ce81ba5c, SEC FB-R5-SEC-BE-V558-01), đếm mỗi lần so, từ lần thứ 6 bỏ qua, `no-store`, dòng nhật ký. Handler `audit-events` chỉ trả lời khi có `action=property.wifi_changed`, còn lại rơi xuống mock Nhật ký tiền.

## 2. Chữ mới – chờ UXD duyệt
Không có chữ Desk Wi-Fi trong `copy-v1.0.5.md`, nên FE-2 viết theo content guide (câu ngắn, không emoji, "Wi-Fi" viết đúng, "mật khẩu Wi-Fi" luôn có chữ Wi-Fi để không lẫn mật khẩu đăng nhập). 35 khóa, nhóm "v1.0.5 Desk Wi-Fi – FE-2" trong `gen_strings.py` (chèn trước nhóm v1.0.4 booking để tránh đụng PR khác), ghi chú từng khóa "chờ UXD duyệt". Chỉ VI/EN (Desk), RU để trống.

| Khóa | VI | EN |
|---|---|---|
| `nav.wifi` | Wi-Fi cơ sở | Property Wi-Fi |
| `wifi.subtitle` | Một mạng chung cho cả cơ sở. Khách thấy trên trang khách từ ngày nhận phòng. | One shared network for the whole property. Guests see it on their stay page from arrival day. |
| `wifi.error_title` | Chưa tải được Wi-Fi | Couldn't load the Wi-Fi |
| `wifi.current_title` | Wi-Fi đang dùng | Wi-Fi in use |
| `wifi.ssid` | Tên mạng | Network name |
| `wifi.password` | Mật khẩu Wi-Fi | Wi-Fi password |
| `wifi.open_network` | Mạng mở, không có mật khẩu | Open network, no password |
| `wifi.none` | Chưa nhập Wi-Fi. Trang khách đang mời khách hỏi lễ tân tên mạng và mật khẩu. | Wi-Fi isn't entered yet. The stay page asks guests to get the network name and password from reception. |
| `wifi.none_ask` | Báo chủ đầu tư hoặc quản lý nhập Wi-Fi. | Ask the owner or manager to enter the Wi-Fi. |
| `wifi.read_help` | Đọc cho khách đúng từng ký tự. Chỉ chủ đầu tư và quản lý sửa được. | Read it to guests exactly, character by character. Only the owner and manager can change it. |
| `wifi.change_help` | Đổi mật khẩu trên bộ phát trước, rồi lưu ở đây ngay sau đó. Lưu xong, báo lễ tân để báo khách đang ở. | Change the password on the router first, then save it here straight away. Then tell the receptionists so they can let in-house guests know. |
| `wifi.enter` / `wifi.edit` | Nhập Wi-Fi / Sửa Wi-Fi | Enter Wi-Fi / Edit Wi-Fi |
| `wifi.form_title` | Nhập tên mạng và mật khẩu Wi-Fi | Enter the Wi-Fi network name and password |
| `wifi.form_lead` | Gõ cả hai ô đúng như trên bộ phát: chữ hoa, chữ thường và khoảng trắng đều tính. | Type both exactly as on the router: capitals, small letters and spaces all count. |
| `wifi.ssid_help` | Tối đa {max} ký tự không dấu; chữ có dấu tính 2–3 ký tự. Không ghi số căn hay tên đăng nhập của nhân viên. | Up to {max} plain characters; an accented letter counts as 2–3. No room number and no staff sign-in name. |
| `wifi.password_help` | {min}–{max} ký tự: chữ không dấu, số, dấu câu, khoảng trắng. Để trống nếu bộ phát để mạng mở. | {min}–{max} characters: plain letters, digits, punctuation, spaces. Leave it empty if the router has an open network. |
| `wifi.review` | Xem lại | Review |
| `wifi.review_title` | Kiểm lại Wi-Fi trước khi lưu | Check the Wi-Fi before saving |
| `wifi.review_lead` | Khách sẽ thấy trên trang khách: | Guests will see this on their stay page: |
| `wifi.review_open_note` | Chỉ chọn khi bộ phát cũng để mạng mở. | Only choose this if the router also has an open network. |
| `wifi.review_applies` | Lưu xong là áp cho mọi khách đang ở, ở lần mở trang khách sau. | Once saved, it applies to every in-house guest the next time they open their stay page. |
| `wifi.save` | Lưu Wi-Fi | Save Wi-Fi |
| `wifi.saved` | Đã lưu Wi-Fi. Trang khách hiện giá trị mới ở lần mở sau. | Wi-Fi saved. Stay pages show it the next time they open. |
| `wifi.err_ssid_required` | Nhập tên mạng. | Enter the network name. |
| `wifi.err_ssid_long` | Tên mạng quá dài: tối đa {max} ký tự không dấu (chữ có dấu tính 2–3). Bớt chữ hoặc bỏ dấu. | The network name is too long: up to {max} plain characters (an accented letter counts as 2–3). Shorten it or drop the accents. |
| `wifi.err_ssid_not_allowed` | Tên mạng không được có số căn hay tên đăng nhập của nhân viên. Đặt tên khác. | The network name can't contain a room number or a staff sign-in name. Choose another name. |
| `wifi.err_password_range` | Mật khẩu Wi-Fi cần {min}–{max} ký tự: chữ không dấu, số, dấu câu hoặc khoảng trắng. Để trống nếu mạng mở. | The Wi-Fi password needs {min}–{max} characters: plain letters, digits, punctuation or spaces. Leave it empty for an open network. |
| `wifi.err_password_login` | Mật khẩu Wi-Fi không được trùng mật khẩu đăng nhập Desk của bạn. Chọn mật khẩu khác. | The Wi-Fi password can't be the same as your Desk sign-in password. Choose a different one. |
| `wifi.log_title` | Lần lưu gần đây | Recent saves |
| `wifi.log_empty` | Chưa có lần lưu nào trong {days} ngày qua. | No saves in the last {days} days. |
| `wifi.log_first` | Nhập Wi-Fi lần đầu: {to} | Wi-Fi entered for the first time: {to} |
| `wifi.log_ssid` | Đổi tên mạng: {from} → {to} | Network name changed: {from} → {to} |
| `wifi.log_password` | Đổi mật khẩu Wi-Fi | Wi-Fi password changed |
| `wifi.log_unchanged` | Lưu lại Wi-Fi, không đổi | Wi-Fi saved again, no change |

Dùng lại khóa có sẵn: `login.show_password` / `login.hide_password` (Hiện / Ẩn), `common.cancel`, `common.edit_back`, `common.saving`, `common.close`, `common.unsaved_*`, `common.loading`.

## 3. Tệp
- Sửa: `product/packages/api-client/src/endpoints.ts`, `types.ts`, `endpoints.test.ts`; `product/apps/admin-web/src/session/nav.ts`, `app/routes.tsx`, `mocks/handlers.ts`, `mocks/seed.ts` (S36 cho OWN/MGR/FDL/FD); `product/packages/ui/src/styles/app.css` (`.wifi-masked`); `product/design/tools/gen_strings.py` và các tệp sinh ra (`design/copy/strings-vi.json`, `strings-en.json`, `design/wireframes/assets/strings.js`, `design/tools/strings-tables.md`).
- Mới: `product/apps/admin-web/src/app/wifi.ts`, `src/pages/WifiPage.tsx`, `src/mocks/wifi.ts`, `src/__tests__/v5-58-wifi-fe2.test.tsx`, `product/tests/e2e/ui/v5-58-desk-wifi.r5.spec.ts`, ảnh `screenshots/v5-58-*.png` (9 ảnh, mock, giá trị giả), báo cáo này.

## 4. Kiểm
- Vitest 17 ca (`v5-58-wifi-fe2.test.tsx`): nav theo vai (OWN/MGR/FDL/FD thấy, HK/MT/SAL/CTV không); HK mở thẳng → không có quyền; FD chưa có Wi-Fi / có Wi-Fi (mono) / mạng mở; T58-10 phần form (hai ô trống kể cả khi đã có Wi-Fi, `type="text"`, autocomplete off, tên/id không gợi đăng nhập, không có ô `password`); kiểm dạng (tên rỗng, mật khẩu ngắn, tên có dấu 36 byte); mạng mở → bước xem lại + lưu + toast + dòng "lần đầu"; mật khẩu giữ khoảng trắng + nút Ẩn/Hiện; 422 số căn; 422 SR-RL-15; tên bị chặn thì không so mật khẩu; lưu y nguyên → "Lưu lại Wi-Fi, không đổi"; nhật ký nhiều dòng; hàm `wifiShapeErrors` (biên 8/63/32 byte) và `wifiChangeOf`; mock bỏ qua phép so từ lần thứ 6.
- api-client: 2 ca mới (đường dẫn, phương thức, thân PUT, truy vấn nhật ký).
- Toàn bộ vitest admin-web xanh (89 tệp, 1012 ca), api-client 39 ca. `tsc` admin-web và `tests`, `eslint`, `prettier` sạch; `gen_strings.py` chạy lại không đổi gì.
- E2E T58-10 (`desk-chromium`, API thật, cần `E2E_UI=1`). CI không cho ca UI bỏ qua, nên tới khi stack có `getPropertyWifi` (#120), riêng lệnh GET Wi-Fi được `page.route` trả dạng hợp đồng "chưa nhập" `{ configured: false }` (cách V5-46 đã làm); đăng nhập, quyền S36, nhật ký chạy với stack thật; có endpoint thì không chặn gì. OWN mở hộp thoại, chờ 0,5 giây sau khi focus rồi kiểm hai ô vẫn trống, thuộc tính đúng; bước xem lại mạng mở và có mật khẩu; axe 0 critical/serious ở trang và bước xem lại; **không lưu** (đóng, bỏ thay đổi) để không ghi lên stack dùng chung. FD: đọc được, không có nút sửa, không có nhật ký.
- Ảnh 1366 trên mock: chủ chưa nhập, hộp thoại trống, lỗi dạng, xem lại mạng mở, xem lại có mật khẩu, đã lưu + nhật ký, lỗi số căn với ô mật khẩu đang che, FD đọc, FD chưa có.

## 5. Giả định
- G1. Desk **không** điền sẵn giá trị đang lưu vào hộp thoại sửa (hai ô luôn trống). Lý do: SEC ARC-04 "hai ô trống khi mở"; chủ đầu tư gõ lại đúng như trên bộ phát. Giá trị đang dùng vẫn thấy ở thẻ phía sau.
- G2. Mật khẩu **hiện rõ mặc định** trong hộp thoại; "Ẩn" chỉ che trên màn. Lý do: gõ đúng từng ký tự quan trọng hơn che, và Desk đã hiện mật khẩu Wi-Fi ở thẻ cho FD đọc cho khách.
- G3. Nhật ký Wi-Fi đặt ngay trên màn S36 (chỉ OWN/MGR), không làm màn nhật ký cấu hình chung. Lấy 5 dòng trong 92 ngày (giới hạn của `listAuditEvents`).
- G4. Câu lỗi mật khẩu dùng chữ riêng của Wi-Fi với `{min}`, `{max}` do Desk truyền (máy chủ không gửi `min/max` cho mật khẩu).
- G5. Tên đăng nhập nhân viên: mock so cả tên trùng hoàn toàn (không dấu chấm thành từ) như máy chủ; `OTTIMO401` (số dính chữ) vẫn qua – DOM 120-01 để 0.3.14.

## 6. Rủi ro và việc còn mở
- Kiểm tay trên staging (QA): Chrome và Safari đã lưu mật khẩu Desk không gợi ý hay tự điền vào hai ô. Playwright không giả được trình quản lý mật khẩu thật. Lưu ý riêng: lớp `.wifi-masked` (`-webkit-text-security`) – nếu trình duyệt nào coi ô bị che là ô mật khẩu thì sẽ thấy ở bước này; khi đó bỏ nút Ẩn.
- Không có hi-fi cho màn này (dựng từ thẻ / dl / hộp thoại của DS như "Tài khoản nhận"). UXD xem ảnh và chữ.
- PR này gộp **sau #120**. Gộp trước thì màn vẫn chạy nhưng gọi API trả 404 (khối lỗi "Chưa tải được Wi-Fi").

## 7. Cần xem
- UXD: 35 khóa chữ ở mục 2 và bố cục (ảnh). DOM: câu "Lưu lại Wi-Fi, không đổi", "Mạng mở, không có mật khẩu", thứ tự "đổi trên bộ phát trước".
- SEC: thuộc tính hai ô (T58-10), không lưu giá trị ngoài state của hộp thoại, dòng nhật ký không có mật khẩu.
- QA: E2E T58-10 và phần kiểm tay trình duyệt ở mục 6.
