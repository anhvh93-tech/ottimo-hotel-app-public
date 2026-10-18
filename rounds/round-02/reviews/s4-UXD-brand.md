# UXD rà thương hiệu bản dựng Sprint 4 – màu ngoài bảng (G8.3), AA sáng/tối (G8.2), chuỗi chờ duyệt, câu 409 của Desk

- Người review: UXD | Tác giả: FE (FE-A, FE-B – admin-web), MOB (PWA `apps/mobile`, guest-web) | Ngày: 18/10/2026 | Round 2, tuần Ổn định | Bước: **Review** trước cổng QC Sprint 4 (`qc/s4-gate-readiness.md` G8.2, G8.3, a13).
- Căn cứ:
  - Brand Guidelines v1.0 (`00-brief/context/brand/brand-guidelines.md`): bảng 80/15/5; Lora / Be Vietnam Pro / JetBrains Mono; giọng văn với khách.
  - Design System **v0.4.1**: 2.0–2.4 (token, bảng tương phản, ngoại lệ chức năng), 11.2–11.6; `content-guide.md` v0.4.
- Bản đọc: **HEAD `7ac11a4`**. Cây làm việc có thay đổi chưa commit của FE-A (S4-45, BUG-R2-087/089). Các thay đổi đó không thêm màu hay CSS (đã xem diff).
- Phạm vi:
  - PWA H19–H22;
  - guest-web H23 (cùng H18 vì chung khung);
  - Desk: H24 Tổng quan, S10 Buồng phòng, S11 Bảo trì (gồm drawer phiếu sửa), S30 Yêu cầu khách, Minibar, các hộp mới ở H15/H16 (chọn tủ minibar, đếm lại tủ, phụ thu bằng giá 1 đêm và hộp quản lý xác nhận, khoảng giá đêm thêm).
- Ngoại lệ giữ nguyên theo DS 2.4 v0.4.1:
  - 4 màu trạng thái `ok`/`warn`/`bad`/`info` và nền của chúng; `info` chỉ cho thông báo;
  - bản tối (tint/shade của bảng);
  - tint/shade có kiểm, gồm 4 token nắn sắc (`--oak-ink`/`--focus` tối, `--oak-soft` hai chế độ, `--line-strong` sáng).
- UXD không sửa mã app. Không commit.

---

## 0. Tóm tắt

| Tiêu chí cổng                                   | Kết quả UXD                                                                                                                                                                                                                                                                                                                                                                  | Ghi cho QC                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G8.3** màu ngoài bảng chỉ còn ngoại lệ đã ghi | **ĐẠT – UXD ký 18/10 sau khi MOB sửa (mục G).** Lượt đầu: chưa ký vì 1 thẻ Major (MOB-S4-02). Mã nguồn 3 app: 0 mã màu viết tay ngoài token. Đo chạy thật: 1 nhóm màu ngoài bảng – nút `<button class="icon-btn">` thiếu lớp `btn` nên hiện vỏ nút mặc định của trình duyệt (xám #EFEFEF, viền đen; tối #6B6B6B) ở PWA (nút Quay lại, 5 màn) và guest-web H23 (nút Quay lại) | Sửa 1 dòng mỗi chỗ (thêm `btn` như hi-fi). Sau khi MOB sửa, UXD ký dòng G8.3 – không cần đo lại toàn bộ, chỉ 2 màn                                                                                                                                                                                                    |
| **G8.2** AA – phần UXD đo được                  | **0 lỗi `color-contrast`** trên 52 lượt đo (màn × chế độ), cả **sáng và tối**; 0 lỗi axe critical/serious khác                                                                                                                                                                                                                                                               | Chế độ tối **đã đo** cho PWA (11 màn) và Desk (8 màn). guest-web chỉ sáng theo DS 11.5 – đã xác nhận bản dựng giữ sáng khi máy đặt tối. **Chưa đo chạy thật:** hộp H15 (Gia hạn, Đổi phòng), H16 bước 2–3 (đêm thêm, hộp quản lý xác nhận); 360 px; trình đọc màn hình. Phần ca axe trong CI (a13) vẫn là việc của QA |
| Thương hiệu khác (BR-012)                       | **1 thẻ Major mới (FE-S4-22):** Phiếu thanh toán in số căn                                                                                                                                                                                                                                                                                                                   | Ảnh hưởng S4-52 ở bảng 5 (QC chấm "Đạt (đọc mã)" theo phía server; phía Desk in sai)                                                                                                                                                                                                                                  |
| Chuỗi chờ duyệt                                 | 53 chuỗi FE đã duyệt, sửa 17; UXD thêm 4; bỏ 2 khóa `extend.keep_rate*`                                                                                                                                                                                                                                                                                                      | Mục C. Không còn nhóm "chờ UXD duyệt"                                                                                                                                                                                                                                                                                 |
| Câu 409 của Desk                                | `MINIBAR_PERIOD_CHANGED`: UXD đã sửa câu (không cần FE). `CONCURRENT_UPDATE`: luồng đúng; chữ có một điểm Minor, UXD tự sửa sau cổng                                                                                                                                                                                                                                         | Mục D. Không có thẻ FE                                                                                                                                                                                                                                                                                                |

**Thẻ mới: 2 Major · 5 Minor** – FE-S4-22 Major (ORC chuyển FE-A), MOB-S4-02 Major (**Verified**), MOB-S4-03 Minor (**Verified**), MOB-S4-04 Minor (MOB – khung chuông PWA, thêm 18/10), FE-S4-23 Minor (FE-A), FE-S4-24 Minor R3 (FE-A, FE-B), FE-S4-25 Minor R3 (FE-A), FE-S4-28 Minor (FE-A – nhật ký tiền khi hệ thống tự đóng yêu cầu, thêm 18/10 ở lượt duyệt chữ đợt 24, mục C.5).

---

## A. Màu ngoài bảng (G8.3)

### A.1 Đọc mã (HEAD)

| Chỗ                                                                                                      | Kết quả                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS app: `packages/ui/src/styles/app.css`, `apps/mobile/src/styles.css`, `apps/guest-web/src/styles.css` | 0 mã HEX / `rgb()` / `hsl()` / tên màu. Mọi `color`, `background`, `border` dùng token DS. Các cặp chữ–nền dùng ở CSS Sprint 4 đều có trong bảng DS 2.2, ví dụ `.qpill` Ink/`--warn-bg`, `.hk-badge` `--ink-inverse`/`--bad`, `.m-nav` Stone/`--surface`, `.req-tile`                                                                                               |
| TSX (admin-web `pages`, mobile, guest-web, `packages/ui`)                                                | 0 style màu nội tuyến. PWA và guest-web có 0 `style={{…}}`. Không dùng `--oak`, `--sage`, `--deco`, `--line` làm màu chữ. `Chip tone="info"` không còn ở màn Sprint 4; `Alert tone="info"` chỉ dùng cho thông báo (MinibarPage, HousekeepingPage, guest-web H23 ngoài giờ), đúng DS 2.4 v0.4.1                                                                      |
| `hifi.css` (UXD)                                                                                         | Chỉ có màu cố định ở 2 chỗ: khung điện thoại của tài liệu hi-fi (Ink `#2B2B28`, không lên sản phẩm), và `.print-root` khi in – nền trắng, giá trị sáng của `--line`, `--line-strong`, `--ok` cho giấy. `color-mix()` cho trạng thái hover (`.btn.pri`, `.nav a`, `.rowlink`, ô rack) pha đúng một màu bảng với nền, cùng tỷ lệ ba kênh – thuộc nhóm tint của DS 2.4 |
| Ngoại lệ chức năng chưa ghi trong DS 2.4                                                                 | Mã QR `#000`/`#fff` (`packages/ui/src/QrCode.tsx`), cần tương phản tối đa để máy quét đọc. Canvas nén ảnh tô nền trắng (`apps/*/src/app/image.ts`) – không phải màu giao diện. **UXD chấp nhận cả hai là ngoại lệ chức năng** và ghi vào DS 2.4 ở v0.4.2 (mục F)                                                                                                    |
| guest-web chế độ màu                                                                                     | `<html data-theme="light">`, `theme-color` `#F4F0E8` – đúng DS 11.5 (G6)                                                                                                                                                                                                                                                                                            |

### A.2 Đo trên bản chạy (mock MSW, Chromium headless, 18/10 09:05–09:17)

- Cách chạy:
  - vite của từng app, cấu hình tạm ở scratchpad, không sửa repo;
  - PWA 390×844 (`hk.lan`, `mt.tung`), guest-web 375×812 (link khách đang ở + link khách đã xác nhận), Desk 1280×1000 (`qa.mgr`);
  - mỗi màn đo hai lần: `prefers-color-scheme: light` và `dark`, mỗi lần một phiên trình duyệt mới.
- Màn đã đo:
  - **PWA (11):** đăng nhập, Việc của tôi, Các căn, căn 101, kiểm phòng 203 (checklist 12 mục), Báo sự cố, Thao tác trên máy, Thông báo, Tôi, danh sách phiếu sửa, phiếu WO-00005.
  - **guest-web (7):** Lưu trú, Thông tin (Wi-Fi), danh sách yêu cầu (rỗng), form yêu cầu mới (H23), Lưu trú (đơn đã xác nhận), thông báo trước thủ tục, thủ tục bước 1.
  - **Desk (8):** đăng nhập, Tổng quan H24, Hôm nay (gồm thẻ "Yêu cầu của khách" – Desk không có route S30 riêng), Buồng phòng S10, Bảo trì S11, drawer phiếu sửa, Minibar, H16 bước 1 (đếm minibar).
- Cách tìm màu ngoài bảng: với mọi phần tử đang hiện, lấy `color`, `background-color`, màu viền (khi viền > 0), `outline`, `fill`/`stroke` của SVG, rồi so với mọi giá trị trong `tokens.css` (sáng + tối).

| App                | Sáng                                                                                                                                                                                                                                 | Tối                                               | Kết luận               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------- |
| Desk               | 0 màu ngoài token / 8 màn                                                                                                                                                                                                            | 0 / 8                                             | Đạt                    |
| PWA                | `button.icon-btn.hk-back` (nút Quay lại ở đầu màn): nền `rgb(239,239,239)` + viền 4 cạnh `rgb(0,0,0)` = vỏ nút mặc định của trình duyệt (ButtonFace/ButtonBorder). Gặp ở căn 101, kiểm phòng, Thao tác trên máy, Thông báo, WO-00005 | Cùng nút: nền `rgb(107,107,107)` (ButtonFace tối) | **Lỗi → MOB-S4-02**    |
| guest-web          | `button.icon-btn.gw-back` ở form yêu cầu H23: nền `rgb(239,239,239)` + viền đen (như trên)                                                                                                                                           | Giống sáng (trang luôn sáng)                      | **Lỗi → MOB-S4-02**    |
| guest-web (đo phụ) | Nút chính bước 1 `rgb(68,68,64)` khi chuột còn đặt trên nút = `.btn.pri:hover` (Ink 88% + nền). Đo lại khi chuột rời: 0                                                                                                              | –                                                 | Không lỗi (tint hover) |

Nguyên nhân MOB-S4-02: hi-fi vẽ `class="btn icon-btn"`. `.icon-btn` chỉ đặt kích thước; nền, viền, focus nằm ở `.btn`. Ba chỗ dùng `icon-btn` không có `btn`:

- `apps/mobile/src/ui/parts.tsx:134` (`hk-back`);
- `apps/mobile/src/ui/PhotoPicker.tsx:58` (`photo-x` – chưa đo vì phải chọn ảnh, đọc mã thấy cùng lỗi);
- `apps/guest-web/src/pages/RequestsPage.tsx:381` (`gw-back`).

`CheckinFlow.tsx:251` của guest-web đã đúng (`btn icon-btn gw-back`).

## B. Độ tương phản AA – sáng và tối (G8.2)

Đo bằng axe-core 4.13 (`color-contrast`) trên cùng các màn ở A.2, cả hai chế độ. Thêm một lượt đủ luật để đếm lỗi critical/serious. Đã thử chèn chữ #bbb trên nền trắng để chắc luật có chạy: axe báo 1,91:1.

| App               | Chế độ tối có áp không                                                                         | `color-contrast` sáng | `color-contrast` tối      | axe critical/serious khác |
| ----------------- | ---------------------------------------------------------------------------------------------- | --------------------- | ------------------------- | ------------------------- |
| PWA (11 màn)      | **Có** – nền `#F4F0E8` → `#1B1A18`, `color-scheme: dark`                                       | 0                     | 0                         | 0                         |
| guest-web (7 màn) | **Không – đúng thiết kế** (DS 11.5: chỉ sáng; `data-theme="light"` giữ nguyên khi máy đặt tối) | 0                     | 0 (vẫn là giao diện sáng) | 0                         |
| Desk (8 màn)      | **Có** – theo hệ điều hành (cài đặt giao diện mặc định "tự động")                              | 0                     | 0                         | 0                         |

**G8.2 – chế độ tối: ĐÃ ĐO** (PWA, Desk) trên bản chạy mock ngày 18/10. Ba điều cần ghi lại:

- Tầng token cũng đạt: DS 2.2 có 0 cặp bắt buộc không đạt ở cả hai chế độ (`gen_tokens.py`).
- Còn **chưa đo**: các hộp H15 (Gia hạn, Đổi phòng), H16 bước 2–3 (đêm thêm, phụ thu bằng giá 1 đêm, hộp quản lý xác nhận), màn 360 px, phóng chữ 200 %, VoiceOver/TalkBack.
  - Các hộp H15/H16 dùng component sẵn có và token đã có trong bảng 2.2. Đọc mã không thấy màu mới, nhưng chưa có lượt đo chạy thật.
  - Ca axe cho các màn này trong CI vẫn là việc của QA (a13).
- axe báo "cần kiểm tay" (không phải lỗi) ở một số chỗ. UXD đã xem:
  - **PWA Các căn:** 6 chip trạng thái "Khách đang ở – cần dọn". Ảnh chụp 390 px tối cho thấy chữ chip **tràn ra ngoài nền chip** (chip `nowrap`, tên trạng thái dài). Màu chữ `--warn` trên nền thẻ vẫn đủ tương phản (7,53:1 theo bảng 2.2), nhưng hình chip vỡ → **MOB-S4-03 (Minor)**.
  - **PWA WO-00005** `.tag`, **guest-web bước 1** `#gw-docs-reason`, **Desk drawer phiếu sửa** (3 dòng lịch sử): phần tử chồng lên nhau khi cuộn – thanh chân dính, axe không tính được màu nền. Cặp màu thực tế là Stone/Ink trên `--surface`/`--bg`, đều có trong bảng 2.2.
  - **Desk H16 bước 1:** nút "Giảm" chỉ có ký tự "−" (axe không đo được ký tự ngoài BMP). Nút có `aria-label`, chữ Ink trên `--surface` – không lỗi.

Dữ liệu thô (JSON, script, ảnh) nằm ở scratchpad của phiên UXD, không đưa vào repo.

---

## C. Duyệt chuỗi chờ UXD (`product/design/tools/gen_strings.py`)

Giọng nhân viên theo content-guide mục 1:

- không xưng hô, mệnh lệnh nhẹ, không "Vui lòng";
- một khái niệm – một tên;
- "hệ thống" thay "máy chủ" khi nói nguồn số (staff không cần biết máy chủ);
- tên bước theo `checkout.step.*`;
- "Hóa đơn" chỉ dùng cho hóa đơn GTGT.

Các chuỗi này chỉ hiện trên Desk (nhân viên), không có chuỗi khách nhìn thấy.

| Nhóm (`gen_strings.py`)                                                                  |                                                                                         Số chuỗi duyệt |    Sửa | Ghi chú                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | -----------------------------------------------------------------------------------------------------: | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FE-A: giá lịch trước giảm theo số đêm, số cần thu của hệ thống (đợt 10–12)               |                                                                                                     15 |      8 | Đổi "giảm dài ngày" / "long-stay discount" → **"giảm theo số đêm" / "length-of-stay discount"**, khớp các chuỗi đã duyệt (`move.discount_los`, `folio.adjust_night_*`, `rate.night_now`). "Dài ngày" dễ lẫn với "đơn dài hạn" (`externalContract`). "máy chủ tính" → "hệ thống tính". `checkout.extra_night_rate_help_tier`: bỏ "Mặc định giá Trực tiếp đêm nay" vì từ vòng sửa 5 giá mặc định theo bảng BR-417 phụ lục 5A (có thể là giá thỏa thuận hoặc min sau đổi căn). Câu nay ghi "giá gợi ý của hệ thống"; bỏ "sửa được trong sàn – trần" vì khoảng đã nằm ở `checkout.extra_night_range` |
| FE-A: phụ thu trả muộn bằng giá 1 đêm, tủ minibar theo căn, QR vượt (đợt 13)             |                                                                                                     23 |      3 | `co.late_fee_as_night_body`: "bước Hóa đơn" → "bước Bill & thu tiền" (`checkout.step.bill`). `co.late_fee_needs_confirm`: theo mẫu "… để hoàn tất trả phòng". `co.late_fee_sum_foc` EN "Waived or reduced". Chuỗi xác nhận mật khẩu quản lý (`co.late_fee_confirm_help`, `_auth_failed`, `_locked`) giữ nguyên câu đã qua SEC FE-08                                                                                                                                                                                                                                                              |
| FE-B H11 xác nhận QR cọc vượt                                                            |                                                                                                      1 |      0 | `dep.qr_over_reason`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| FE-A: đếm lại tủ minibar + N-1 (đợt 14) – có câu theo `reason`, gồm `not_today` (đợt 17) |                                                                                          3 + **3 mới** |      3 | Xem C.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| FE-A đợt 15: 409 `MINIBAR_PERIOD_CHANGED`                                                |                                                                                          2 + **1 mới** |      2 | Xem D.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| FE-A đợt 16: khoảng giá đêm thêm                                                         |                                                                                                      1 |      1 | "Trong khoảng {min} – {max}." là mảnh câu nối sau câu trợ giúp → "Sửa được trong khoảng {min} – {max}." / "Can be changed within {min} – {max}."                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| FE-A đợt 18 (S4-45, BUG-R2-087/101/102/103/089) – FE-A thêm sáng 18/10, chưa commit      |                                                                                                      8 |      0 | Giữ nguyên. Chuỗi FE-A thêm vào nhóm này sau 09:15 18/10 phải ghi nhóm mới để UXD duyệt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Tổng**                                                                                 | **53** chuỗi FE chờ duyệt + **4** chuỗi UXD thêm (3 câu theo `reason`, `error.MINIBAR_PERIOD_CHANGED`) | **17** | Sau lượt này không còn nhóm nào ghi "chờ UXD duyệt"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### C.1 Câu "cần đếm lại" theo `reason`

`minibarUncheckedRooms[].reason` có 4 giá trị (OpenAPI 0.3.7 bổ sung 4, K11-09). Desk đang dùng một thân câu cho mọi giá trị khác `never_counted`. Câu cũ "Khách đã vào lại căn hoặc gia hạn sau lần đếm trước… Số điền sẵn theo lần đếm trước" sai trong hai trường hợp:

- `not_today`: khách không vào lại căn, không gia hạn – lần đếm chỉ khác ngày;
- `new_fill`: kỳ mới điền sẵn tủ đủ, không phải số lần đếm trước.

| Khóa                                                | VI                                                                                                                               | EN                                                                                                                                      | Khi nào                                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `co.minibar_recount_title`                          | Tủ căn {room} cần đếm lại                                                                                                        | Room {room} minibar needs a recount                                                                                                     | Mọi `reason` khác `never_counted` (giữ)                                                                                                    |
| `co.minibar_recount_body` (**đổi thành câu chung**) | Lần đếm trước không còn dùng cho lần trả phòng này. Đếm số còn lại trong tủ bây giờ; món đã tính trước đó không bị tính trùng.   | The last count no longer applies to this check-out. Count what is left in the minibar now; items already charged are not charged twice. | Giá trị lạ; máy chủ cũ không có `reason`; và mọi `reason` tới khi FE-A làm FE-S4-23. HEAD hiện đúng với mọi trường hợp mà không cần sửa mã |
| `co.minibar_recount_body_stay_continued` (mới)      | Khách đã vào lại căn hoặc gia hạn sau lần đếm trước. Đếm số còn lại trong tủ bây giờ; món đã tính lần trước không bị tính trùng. | The guest came back to this room or extended after the last count. …                                                                    | `stay_continued`                                                                                                                           |
| `co.minibar_recount_body_new_fill` (mới)            | Tủ đã được bổ sung sau lần đếm trước. Đếm số còn lại trong tủ bây giờ; món đã tính trước lần bổ sung không bị tính trùng.        | The minibar was refilled after the last count. …                                                                                        | `new_fill` (R3, bổ sung giữa kỳ)                                                                                                           |
| `co.minibar_recount_body_not_today` (mới)           | Lần đếm trước không phải trong hôm nay. Đếm lại tủ trong ngày trả phòng để tính cả món khách dùng sau lần đếm đó.                | The last count was not made today. Count the minibar again on the check-out day so items used since then are included.                  | `not_today` (K11-09, DOM BR-703 ghi chú 7)                                                                                                 |

Cũng sửa `folio.void_minibar_foc` (N-1): câu cũ 46 từ trong một câu. Nay tách 3 câu, giữ đủ ý.

### C.2 `extend.keep_rate`, `extend.keep_rate_help` – **bỏ khỏi sản phẩm**

- FE-A đã bỏ nút "Giữ giá đơn" ở H15 (ARC 16.18, đợt 16). Giá gợi ý của máy chủ đã theo giá thỏa thuận (AN-45). Nếu gửi giá đơn thì đêm thành "nhập tay" dù lễ tân không gõ.
- UXD đồng ý không đưa nút lại. Hai khóa đánh dấu **CŨ**, chưa xóa vì `s3-review.test.tsx:228` còn dùng khóa này để kiểm nút đã biến mất. Xóa ở v0.5 cùng ca test đó.

### C.3 Kiểm sau khi sinh lại

- Sinh lại bằng `python3 product/design/tools/gen_strings.py`: **2797 chuỗi + 8 mẫu**, 0 khóa trùng. Tham số VI ↔ EN ↔ RU lệch 0. Không có emoji.
- `check_hifi.py` 25/25 ✓.
- `admin-web` vitest 6 tệp có dùng khóa đã đổi (`s4-144-fea`, `s4-418-fea`, `s3-review`, `i18n-keys`, `s4-38-fea`, `s4-416-fea`): 52/52 ✓. `@ottimo/i18n` 19/19 ✓.
- Prettier: `strings-{vi,en,ru}.json` đạt. `strings-tables.md` và `strings.js` là tệp sinh, giữ đúng định dạng của `gen_strings.py` như ở HEAD. Cả hai nằm trong `.prettierignore` (`design`, `**/*.md`), và chạy prettier thì lần sinh sau sẽ ghi đè.
- `content-guide.md` mục 8 chưa dán lại bảng: tệp này ngoài phạm vi sửa của lượt này. UXD dán ở lượt sau.

### C.4 Lượt bổ sung 18/10 (ORC giao sau cổng chuỗi)

- **E14-13 (`replyNote`, Desk):**
  - `req.desk.reply_help` viết lại đủ 3 ý của luật B-15 (EP14 v0.3): không ghi mã cửa, số giấy tờ, số điện thoại, số thẻ; giá ghi số rồi đ/VND ("350.000 đ"); nhiều căn dùng dấu phẩy rồi khoảng trắng ("202, 203").
  - Thêm `field.SENSITIVE_DATA_DETECTED`. Trước đây không có câu nên lỗi rơi về `field_error.generic`; Desk tra tự động `field.<CODE>`.
- **FE-A đợt 19 (5 khóa) và đợt 20 (25 khóa + 3 khóa sửa chữ theo UXR P-26, P-34):** duyệt hết, sửa 7 câu:
  - `reg.person_required`, `reg.person_help` – "người có tên trên giấy tờ";
  - `reg.doc_is_main` → "Người đứng tên khai báo lưu trú" / "Lead guest on the residence registration", để không lẫn với khách đứng tên của đơn;
  - `mlog.reason.overbooking_relocated` → "Chuyển khách sang nơi khác (xung đột OTA)" (content-guide 3.1 không dùng "quá tải/overbooking");
  - `mlog.reason.no_show` → "Không đến" (nhãn BR-301);
  - `recon.intro` → "sale/CTV";
  - `ci.effect_foc_pending` – tách 2 câu, nói rõ khi nào trừ khoản miễn.
  - Giữ nguyên 3 chữ FE-A sửa: `ci.time_default_help`, `co.late_switch_hint`, `co.late_switch_hint_time` (bỏ "drawer").
- **Hi-fi:**
  - H13 `ci.time_default_help` theo chữ mới;
  - H16 chuyển sang `co.late_switch_hint_time` + `data-i18n-args` `{"time":"12:00"}`, thay khóa CŨ `co.late_switch_hint`.
- Kiểm:
  - `gen_strings.py` 2849 chuỗi + 8 mẫu, tham số VI ↔ EN ↔ RU lệch 0;
  - `check_hifi.py` **25/25**; `i18n-keys` ✓; JSON đạt prettier.
- **MOB sửa theo UXR đi thử PWA** (20 khóa): đã duyệt, sửa 8 câu. Ảnh 360 px "Việc của tôi" đã xem: bố cục ổn, chuông có khung (MOB-S4-04 đã làm).
  - PWA buồng phòng dùng câu thường (HR-13), nên `hk.queue.r.time`, `hk.queue.r.other` bỏ "máy chủ". `r.time` nay đúng cả hai trường hợp "bấm quá lâu" và "đồng hồ máy lệch".
  - `hk.queue.resent_toast` thêm "đã" (toast nói kết quả).
  - `hk.wo.sent_to_mt` bỏ "Bạn".
  - EN: `hk.queue.in_line`, `hk.grp.cancelled`, `hk.toast.refused`, `hk.refill_unnamed`.
  - Nút `hk.queue.resend` 'Gửi lại "{action}"' (ví dụ Gửi lại "Dọn xong") giữ nguyên. Câu `r.time` gọi đúng chữ đầu của nút.
  - **Cần MOB:** `apps/mobile/src/__tests__/s4-uxr.test.tsx` so chữ VI viết cứng (dòng 139, 146, 335), nên 2 ca đỏ sau khi đổi câu. Nên so theo khóa (`tv(...)`) như admin-web.
- Kiểm: `gen_strings.py` 2854 chuỗi + 8 mẫu, tham số lệch 0; `check_hifi.py` 25/25.
- **FE-B sửa theo UXR S4 (P-06, P-21, P-22)** (5 khóa): duyệt, sửa 2.
  - `reg.untrusted_body` bỏ "Đây là", câu ngắn hơn.
  - `params.not_yet` EN → "Not yet effective", khớp "Effective from".
  - Giữ: `reg.untrusted_ids`, `attn.registration_due_no_time` (EN "Guest registrations" như `attn.registration_due`), `params.pending`.
  - Sau lượt này `gen_strings.py` không còn nhóm "chờ UXD duyệt"; `check_hifi.py` 25/25.
- **FE-A đợt 21 – H06 4 số cuối giấy tờ (BUG-R2-179)** (2 khóa): duyệt.
  - Giữ `crm.f_id_doc`.
  - Sửa `crm.f_id_doc_help`: gọi tên màn theo menu "Giấy tờ & khai báo" (`nav.registration`) và thêm "trên máy quầy đã cấp" – số đầy đủ chỉ mở trên máy được cấp (US-142).
  - Sinh lại 2856 chuỗi + 8 mẫu; `check_hifi.py` 25/25.
- **UXD viết – công nợ sau trả phòng (ARC 16.25, BR-525 G-4)**, nhóm mới trong `gen_strings.py`:
  - `attn.checkout_debt` – "Công nợ sau trả phòng chưa thu: {n} đơn" / "Unpaid debt after check-out: {n} booking(s)". MGR+, chỉ dùng `{n}` = `count`, Desk tra `attn.<kind>`.
  - `staff.notif.k.debt_recorded` – "Khoản thu sau trả phòng vừa bị đảo – đơn còn công nợ" / "A payment was reversed after check-out – the booking now has a debt". Gửi OWN + MGR; không số tiền, không tên khách; mã đơn hiện riêng như các thông báo khác.
  - Sinh lại 2858 chuỗi + 8 mẫu; `check_hifi.py` 25/25.
- **FE-A đợt 22 – hộp "Thu công nợ" (ARC 16.26, BR-525 G-4)** (6 khóa `debt.*`): duyệt, sửa 1.
  - `debt.collect_help`: "hóa đơn đã xuất" → "phiếu thanh toán đã cấp" / "guest folio". "Hóa đơn" chỉ dùng cho hóa đơn GTGT (content-guide 3.1).
  - Giữ 5 khóa còn lại; cách viết khớp `co.debt_*` và `recon.cash_received_toast`.
  - Sinh lại 2864 chuỗi + 8 mẫu; `check_hifi.py` 25/25; không còn nhóm chờ UXD.
- **FE-A đợt 23 – hộp "Xóa công nợ" (`DebtWriteOffDialog`, ARC 16.27, BR-433)** (10 khóa): duyệt, sửa 9.
  - FE-A ghi 10 khóa chung vào nhóm đợt 22 đã duyệt. UXD tách ra nhóm "FE-A đợt 23" riêng để còn truy được.
  - Thống nhất **"công nợ"**: "Xóa nợ" → "Xóa công nợ" ở cả 9 khóa `debt.write_off*`, khớp `co.debt_*`, `debt.collect*`, `foc.r_debt_write_off`.
  - **"phiếu thanh toán"** thay "hóa đơn đã xuất" (`debt.write_off_help`; EN "guest folio").
  - `debt.write_off_pending` "… – chờ **chủ đầu tư** duyệt" = `role.owner` (OWN), đúng BR-433; thêm "yêu cầu" vì đây là yêu cầu gửi đi chứ chưa áp.
  - Giữ `foc.r_debt_write_off`.
  - Sinh lại 2874 chuỗi + 8 mẫu; `check_hifi.py` 25/25.
  - **Cần FE-A:** `s4-debt-fea.test.tsx:151, 198` so tên nút bằng chữ viết cứng `/^Xóa nợ /`, nên 2 ca đỏ. Đổi sang so theo khóa (`tv('debt.write_off_submit', …)`).

### C.5 UXD – duyệt chữ FE-A đợt 24 (BUG-R2-205, N-6, BE-80) – 18/10

- Bước: **Review** – duyệt chữ trước gộp #19.
- Đầu vào:
  - `outputs/FE/s4-report.md` "Phần FE-A – đợt 24"; nhóm "FE-A đợt 24" trong `gen_strings.py`;
  - mã FE-A chưa commit: `DocsPanel.tsx`, `FolioDialog.tsx`, `PaymentPanel.tsx`, `DebtCollectDialog.tsx`, `app/auditReason.ts`, `ApprovalsPage.tsx`, `OverviewPage.tsx`;
  - OpenAPI: `Registration.partyOverCount`, enum `autoCancelReason`;
  - BE-B `outputs/BE/s4-be-b.md` mục 25 – hình dạng phản hồi duyệt xóa công nợ (ORC chuyển giữa lượt).
- Các chuỗi chỉ hiện trên Desk (nhân viên). Áp content-guide mục 1 và brand guideline:
  - không xưng hô; mỗi câu ≤ 20 từ, một ý;
  - nói chuyện gì đã xảy ra và làm gì tiếp;
  - ngắn, điềm tĩnh, không emoji, không "!".
- Kết quả: **duyệt 8 khóa, sửa 6, giữ 2; thêm 1 khóa** theo ORC (`approval.applied_capped`).

| Khóa                                | Câu cũ (VI / EN)                                                                                                                                                                                                                                        | Câu duyệt (VI / EN)                                                                                                                                                                                                                                                                                               | Lý do                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkin.docs.over_party`           | Đoàn đang nhiều hơn số khách của đơn {n} người – có giấy tờ chưa khớp ai nên hệ thống đã thêm người. Gỡ người thừa hoặc gắn lại giấy tờ cho đúng người. / The party has {n} more people than the booking – an ID matched nobody, so a person was added. Remove the extra person or link the ID to the right guest. | **Đoàn đang thừa {n} người so với số khách của đơn. Thường là do một giấy tờ không khớp ai trong đoàn nên hệ thống thêm người mới. Bỏ người thừa hoặc gắn lại giấy tờ vào đúng người.** / **The party has {n} more guest(s) than the booking. This usually happens when an ID matches no one in the party and a new guest is added. Remove the extra guest or link the ID to the right person.** | Câu cũ dài 33 từ trong một câu, nay tách 3 câu (11 / 17 / 11 từ). "nhiều hơn số khách của đơn {n} người" dễ đọc thành "đơn có {n} người", nên đổi thành "thừa {n} người so với…". OpenAPI chỉ ghi nguyên nhân "**thường**" là hệ thống tự thêm người; người thừa cũng có thể do thêm tay, nên câu nói "Thường là do", không khẳng định. "Gỡ" đổi thành "Bỏ" cho khớp nút. EN: "people / person" đổi thành "guest(s)" như `reg.link.*`; `@ottimo/i18n` chưa có số nhiều ICU, nên viết "(s)" như `party.missing` |
| `reg.over_party_remove`             | Gỡ người thừa / Remove the extra person                                                                                                                                                                                                                 | **Bỏ người thừa** / **Remove extra guest**                                                                                                                                                                                                                                                                        | Nút này mở hộp "Người ở", trong đó nút làm việc là "Bỏ khỏi đơn" (`party.remove`). Một khái niệm – một tên, nên dùng "Bỏ". "Gỡ" ở chỗ khác mang nghĩa khác (gỡ app, gỡ khóa căn), không dùng cho người trong đơn. EN bỏ mạo từ như các nút cùng khu: "Remove from booking", "Link to guest"                                                                                                                                                                                                                                                                                                                                                                    |
| `reg.over_party_relink`             | Gắn lại giấy tờ / Link the ID again                                                                                                                                                                                                                     | Giữ                                                                                                                                                                                                                                                                                                               | Đúng việc nút làm: đưa tới giấy tờ đầu danh sách, rồi Sửa và chọn đúng người. Khớp "gắn lại giấy tờ" ở câu cảnh báo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `reg.relink_help`                   | Đổi người nếu giấy tờ đang gắn nhầm. / Change the guest if the ID is linked to the wrong one.                                                                                                                                                           | Giữ                                                                                                                                                                                                                                                                                                               | Ngắn, nằm đúng dưới ô "Người trong đoàn" (`reg.link.member`), nói đúng khi nào cần đổi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `folio.changed_reload`              | Số tiền vừa thay đổi – đã tải lại số mới. Kiểm tra rồi lưu lại. / The money figures just changed – the latest are loaded. Check and save again.                                                                                                         | **Folio vừa thay đổi nên thao tác này chưa được ghi. Đã tải số mới – kiểm tra lại rồi lưu lần nữa.** / **The folio just changed, so nothing was recorded. The latest figures are loaded – check them, then save again.**                                                                                           | (1) Câu hiện trong 4 hộp ghi tiền: điều chỉnh dòng, thu tiền H16, thu công nợ, xóa công nợ. Câu phải nói rõ **chưa ghi**, để lễ tân không báo khách là đã thu. (2) "lưu lại" dễ hiểu là "lưu giữ", nên viết "lưu lần nữa". (3) Thứ thay đổi là folio (`Folio.version`, N-6), có thể là dòng khác chứ không chỉ "số tiền"; Desk được dùng chữ "Folio" (content-guide 3.1). (4) Không hứa "giữ số đã gõ": hộp thu và xóa công nợ tự điền lại số còn phải thu mới (`DebtCollectDialog.tsx` – `useEffect` theo `due`, `lineId`/`max`). Cách làm này đúng, nên câu chỉ bảo kiểm tra lại |
| `approval.auto_cancel.debt_cleared` | Công nợ đã thu đủ – yêu cầu tự đóng / Debt already settled – request closed automatically                                                                                                                                                               | **Công nợ đã thu đủ nên yêu cầu xóa công nợ tự đóng. Không có khoản nào bị xóa.** / **The debt was collected in full, so the write-off request closed automatically. Nothing was written off.**                                                                                                                    | **Khớp nghĩa câu BE-B** "Công nợ đã được thanh toán – yêu cầu xóa nợ tự hủy": nợ đã trả hết thì yêu cầu tự đóng và không ghi dòng FOC. Chữ: "thu đủ" như "Thu công nợ"; "xóa công nợ" theo đợt 23. Dùng "tự đóng" thay "tự hủy" để khớp chip "Đã tự đóng"; "hủy" chỉ dành cho đơn ("Đã hủy", BR-301). Thêm "Không có khoản nào bị xóa" vì người duyệt vừa bấm Duyệt và nhận 200, cần biết chắc không có gì bị xóa. EN bỏ "settled": EN của Desk dùng "settlement" cho việc chốt folio (`debt.write_off_help`)                                                                                    |
| `approval.auto_cancel.other`        | Yêu cầu đã tự đóng / Request closed automatically                                                                                                                                                                                                       | **Yêu cầu không còn cần duyệt nên đã tự đóng.** / **This request no longer needs approval, so it closed automatically.**                                                                                                                                                                                           | Ở H24, dòng này nằm ngay dưới chip "Đã tự đóng", nên câu cũ lặp lại chip. Câu mới nói vì sao. Câu đúng cho mọi giá trị dùng câu chung: `line_removed`, `reservation_cancelled`, `reservation_no_show`, `superseded`, `no_show_restored`, và giá trị lạ                                                                                                                                                                                                                                                                                                                                                  |
| `approval.status.auto_closed`       | Đã tự đóng / Closed                                                                                                                                                                                                                                     | VI giữ / **Auto-closed**                                                                                                                                                                                                                                                                                          | EN "Closed" không phân biệt được với Withdrawn / Rejected. "Auto-closed" khớp VI "Đã tự đóng", vẫn ngắn đủ cho chip                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `approval.applied_capped` (**mới**) | – (BE-B gợi ý: "Đã áp {effectiveAmountVnd} – phần còn lại khách đã trả")                                                                                                                                                                                 | **Đã xóa công nợ {amount} (yêu cầu {requested}). Phần còn lại đã thu trước khi duyệt.** / **{amount} written off ({requested} requested). The rest was collected before approval.**                                                                                                                                | "Áp" là từ nội bộ BE, nên dùng "xóa công nợ" như `debt.write_off_done`. Thêm số đã xin để người đọc thấy phần chênh. "đã thu" khớp `debt_cleared`: người đọc cần biết tiền đã vào, không cần biết ai trả. Mẫu EN mở đầu bằng số như `debt.write_off_done`                                                                                                                                                                                                                                                                                                                                                |

**Khóa mới `approval.applied_capped`** – ORC giao thêm, theo `s4-be-b.md` mục 25:

- Khi dùng: `approveRequest` cho yêu cầu `debt_write_off` trả `status = approved` và `effectiveAmountVnd < amountVnd`. Đây là trường hợp **áp một phần**: khách trả bớt nợ trong lúc yêu cầu chờ duyệt.
- Tham số:
  - `{amount}` = `effectiveAmountVnd`;
  - `{requested}` = `amountVnd`;
  - cả hai định dạng bằng `common.currency_vnd` (content-guide 4).
- Tên khóa đặt theo sự kiện nhật ký `approval.applied_capped` của BE-B, để FE-A nối nhật ký tiền dễ. Nằm trong nhóm "FE-A đợt 24", ngay sau `approval.auto_cancel.debt_cleared`.
- **Cần FE-A nối** (chưa có trong mã):
  - **H17** `ApprovalsPage.tsx`, thông báo sau khi duyệt: `status = approved` và `effectiveAmountVnd < amountVnd` thì hiện câu này, thay "Đã duyệt".
  - **H24** `OverviewPage.tsx`, khối "Yêu cầu của tôi": giữ chip "Đã duyệt", thêm dòng `li-s` bằng câu này (như dòng tự đóng).
  - **Nhật ký tiền** `MoneyPage.tsx`: `ACTION_KEY` chưa có `approval.applied_capped`, nên sự kiện đang hiện "Thao tác khác" kèm mã thô. Hiện câu này với `before.amountVnd` / `after.appliedVnd`.
  - Thêm ca vào `s4-205-fea.test.tsx`: xin 5.000.000, khách trả 2.000.000, duyệt → câu có "3.000.000 đ" và "5.000.000 đ".

**Kiểm sau khi sửa:**

- Sinh lại bằng `gen_strings.py`: **2883 chuỗi + 8 mẫu**.
  - So JSON trước/sau: chỉ đổi 9 khóa của nhóm đợt 24.
  - `strings-ru.json` không đổi: cả 9 khóa chừa chỗ RU, hiện EN.
- Tham số VI ↔ EN ↔ RU lệch 0. Không emoji, không "!". Câu dài nhất 18 từ.
- `check_hifi.py` 25/25 – không trang hi-fi nào dùng 9 khóa này.
- Prettier `strings-{vi,en,ru}.json` đạt.
- `admin-web` vitest: **48 tệp, 455/455 đạt**. `@ottimo/i18n` 19/19.
  - Máy này không có `pnpm` trên PATH, nên chạy bằng `node_modules/.bin/vitest run`.
  - Test của FE-A so chữ theo khóa (`tv(...)`), nên **không ca nào cần sửa** sau khi đổi câu.
- Thẻ mới cho FE-A: **FE-S4-28** (Minor, mục E) – nhật ký tiền vẫn ghi "Rút yêu cầu" khi hệ thống tự đóng.
- Nên giữ:
  - `autoCancelText` đưa giá trị lạ về câu chung, không bao giờ hiện mã;
  - chip "Đã tự đóng" tách khỏi "Đã rút";
  - hộp ghi tiền gặp 412 thì tự tải lại và giữ hộp mở, không bắt lễ tân đóng hộp rồi làm lại.

---

## D. Câu lỗi 409 của Desk

### D.1 `MINIBAR_PERIOD_CHANGED` (H16 bước 1)

Cách Desk xử lý đúng DS 6.21 và ARC 16.16:

- không ghi gì, tải lại bản chuẩn, giữ lễ tân ở bước đếm;
- sinh khóa idempotency mới;
- không tự gửi lại.

Câu cũ chưa đúng:

- Tiêu đề "Tủ vừa được bổ sung" khẳng định một nguyên nhân. Theo OpenAPI, 409 còn xảy ra khi lượt ở mở kỳ mới (gia hạn), khi lần nạp không thuộc tủ, hoặc khi `periodId = null` mà tủ đã có lần nạp.
- Thân câu dùng "lượt nạp" – từ nội bộ BE. Giao diện gọi việc này là "bổ sung minibar" (`hk.type.minibar_refill`).
- Thân câu có "Vui lòng" – giọng nhân viên không dùng (content-guide 1).

UXD đã sửa:

- `co.minibar_period_changed_title` = "Số đếm chưa được lưu" / "Count not saved" – tiêu đề nói kết quả;
- `co.minibar_period_changed_body` = "Tủ vừa được bổ sung hoặc lượt ở vừa thay đổi trong lúc đếm, nên số vừa nhập chưa được lưu. Đếm lại tủ rồi lưu."
- Thêm `error.MINIBAR_PERIOD_CHANGED` làm câu dự phòng. Nếu mã này tới chỗ khác H16, `problemView` (`app/problem.ts`) sẽ dùng câu này. Trước đây mã 409 không có câu nên rơi về `error.server` "Máy chủ đang gặp sự cố". Hiện chỉ H16 gọi `recordMinibarCheck`.

Không cần thẻ cho FE: khóa giữ nguyên, chữ đổi tự vào bản build kế tiếp.

### D.2 `CONCURRENT_UPDATE` (B13, B14, B18 tự gửi lại 1 lần; các lệnh khác 2 lần)

Luồng đúng DS 6.21:

- `RetryNotice` vàng, `role=status`;
- nút chính đổi "Thử lại" khi hết lượt;
- giữ form, cùng Idempotency-Key.

Câu `retry.gave_up_concurrent` "bấm Thử lại" khớp nút thật.

Còn một điểm nhỏ về chữ: `error.CONCURRENT_UPDATE` / `retry.gave_up_concurrent` nói "Người khác đang lưu cùng lúc". Bên ghi cùng lúc có thể là việc tự động, PWA buồng phòng hoặc lệnh B18 khác. Câu dùng chung với guest-web, nên khách đọc "Someone else is saving at the same moment" có thể hiểu là có người khác đang sửa đơn của mình.

- UXD đã soạn câu mới ("Đang có một thay đổi khác được lưu cùng lúc…" / "Another change is being saved at the same moment…"), nhưng **chưa áp**: hi-fi H13 (`13-check-in.html:271`) chép nguyên câu cũ nên `check_hifi.py` báo lệch. Hi-fi nằm ngoài phạm vi sửa của lượt này.
- Mức Minor, không chặn cổng. **Việc UXD tự làm sau cổng:** đổi chuỗi VI/EN/RU cùng hi-fi H13 trong một lượt. Không cần FE/MOB sửa mã.

Không có thẻ mới cho FE ở mục D.

---

## E. Thẻ

### FB-R2-UXD-FE-S4-22

- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx:1583` (HEAD) – `BillDialog`, dòng khách trên tờ phiếu. Cùng component dùng ở H16 bước 3 và ở drawer đơn đã trả phòng (`ReservationDrawer.tsx:766`, S4-29). Người sửa: **FE-B** (S4-29, thương hiệu B3/B5). Tệp thuộc vùng FE-A – báo FE-A trước khi sửa.
- Vấn đề:
  - Tờ phiếu – trên màn và bản in – ghi `{khách} · {bill.roomNo} · {ngày đến} → {ngày đi}`, ví dụ "Anna Martin · 103 · …".
  - OpenAPI 0.3.7 bổ sung D1: `Bill.roomNo` deprecated, "bill là chữ khách nhìn thấy – **không in** số căn (bản in/PDF dùng `roomName`)". Server đã trả `Bill.roomName`, chụp lúc chốt folio (`bill.service.ts:218–219`).
  - FE-A cũng đã ghi việc này chưa làm (`outputs/FE/s4-report.md` dòng 288).
- Vì sao quan trọng:
  - Phiếu thanh toán là chứng từ đưa khách. BR-012 và guideline: khách chỉ thấy tên phòng ("The Bloom"), không thấy số căn.
  - S4-52 là mục CỔNG. QC đang chấm "Đạt (đọc mã)" chỉ theo phía server, nên chỗ in sai ở Desk chưa lộ.
- Đề xuất sửa:
  - Tờ phiếu dùng `bill.roomName ?? bill.roomNo` (giữ nguyên tiếng Anh, không dịch). Nếu lễ tân cần số căn, đặt ở tiêu đề hộp thoại (không in) bằng `roomLabel(…, 'staff')`.
  - Thêm ca test: bill có `roomName` → tờ phiếu và `.print-root` không chứa số căn.
  - QA thêm kiểm này vào S4-52.
- Trạng thái: Open (ORC chuyển FE-A 18/10)

### FB-R2-UXD-MOB-S4-02

- Mức độ: Major
- Vị trí:
  - `apps/mobile/src/ui/parts.tsx:134` (`icon-btn hk-back` – nút Quay lại ở đầu mọi màn con của PWA H19–H22);
  - `apps/mobile/src/ui/PhotoPicker.tsx:58` (`icon-btn photo-x` – nút bỏ ảnh H21/H22);
  - `apps/guest-web/src/pages/RequestsPage.tsx:381` (`icon-btn gw-back` – H23).
- Vấn đề:
  - `<button>` chỉ có lớp `icon-btn`, thiếu `btn`. Trình duyệt vẽ vỏ nút mặc định: nền xám `rgb(239,239,239)` và viền đen 4 cạnh (chế độ tối: nền `rgb(107,107,107)`).
  - Đo trên bản chạy (mục A.2): PWA gặp ở 5 màn, guest-web ở form yêu cầu. `photo-x` chưa đo, đọc mã thấy cùng lỗi.
  - Hi-fi H20, H23 vẽ `class="btn icon-btn"`. `CheckinFlow.tsx:251` của guest-web đã làm đúng.
- Vì sao quan trọng:
  - Màu ngoài bảng thương hiệu, nằm ở vị trí dễ thấy nhất (góc trên trái) của trang khách và app nhân viên. Đây là chỗ duy nhất làm G8.3 chưa ký được.
  - Viền đen mặc định cũng khác focus ring DS (`--focus` 2px + offset).
- Đề xuất sửa: thêm lớp `btn` cho ba nút (`className="btn icon-btn hk-back"`…) hoặc dùng `Button` của `@ottimo/ui`. Kiểm lại: chụp căn 101 (PWA) và form H23 ở cả hai chế độ, nút có nền `--surface`, viền `--line-strong`. UXD ký G8.3 sau khi xem ảnh.
- Trạng thái: **Verified** (UXD 18/10 – ảnh trước/sau 390 px sáng + tối, `measure.json`; mục G)

### FB-R2-UXD-MOB-S4-03

- Mức độ: Minor
- Vị trí: PWA H19 "Các căn" (`apps/mobile/src/pages/RoomsPage.tsx:113` `RoomStatusChip` trong `.hk-card.rowlink > .grow`); ảnh chụp 390 px tối ở scratchpad UXD. Gốc chung: `hifi.css` `.chip{white-space:nowrap}` (đúng cho chip ngắn ở Desk, không hợp với câu thường dài của PWA). Người sửa: **MOB**, ghi đè cục bộ trong `apps/mobile/src/styles.css`. Nếu MOB muốn sửa ở nguồn chung thì UXD thêm vào `hifi.css` sau cổng.
- Vấn đề:
  - Chip trạng thái câu thường (HR-13, ví dụ "Khách đang ở – cần dọn", "Cần dọn (khách đã đi)") không xuống dòng. Ở 390 px, chữ tràn ra ngoài nền chip (thẻ 101, 102, 201, 202).
  - axe báo "elmPartiallyObscured" cho 6 chip ở cả hai chế độ. Ở 360 px sẽ nặng hơn.
- Vì sao quan trọng: DS C7 – chip là một khối nền + icon + chữ. Chữ lọt ra ngoài nền trông như lỗi, và mất ranh giới trạng thái mà buồng phòng dựa vào để quét nhanh.
- Đề xuất sửa: trong `.hk-card` cho chip `white-space: normal; max-width: 100%;` (chữ xuống dòng trong nền, icon canh đầu dòng), hoặc đặt chip trên một dòng riêng dưới số căn. Kiểm ở 360 px và 390 px, VI và EN.
- Trạng thái: **Verified** (UXD 18/10 – 360/390 px, VI/EN, 0/10 chip tràn; mục G)

### FB-R2-UXD-FE-S4-23

- Mức độ: Minor
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx:791` (HEAD) – `t('co.minibar_recount_body')` cho mọi `reason` khác `never_counted`. Người sửa: **FE-A**.
- Vấn đề: một câu cho 3 tình huống khác nhau (`stay_continued`, `new_fill`, `not_today`). UXD đã đổi `co.minibar_recount_body` thành câu chung đúng cho mọi trường hợp (HEAD hiện đúng, không cần gấp) và thêm 3 câu riêng (mục C.1).
- Vì sao quan trọng: lễ tân cần biết vì sao phải đếm lại để giải thích cho khách. Ví dụ `not_today` = lần đếm hôm trước, không phải khách vào lại căn.
- Đề xuất sửa: `({ stay_continued: 'co.minibar_recount_body_stay_continued', new_fill: 'co.minibar_recount_body_new_fill', not_today: 'co.minibar_recount_body_not_today' })[due.reason] ?? 'co.minibar_recount_body'`. Máy chủ cũ không có `reason` → câu chung. Thêm ca `not_today` vào `s4-144-fea.test.tsx`.
- Trạng thái: Open (ORC chuyển FE-A 18/10)

### FB-R2-UXD-FE-S4-24

- Mức độ: Minor (R3 – phần còn lại của FE-S3-04, `s3-UXD.md` mục I)
- Vị trí: `apps/admin-web/src/pages/stay/StayDialogs.tsx:519` (hộp Đổi phòng – **FE-A**); `apps/admin-web/src/pages/approvals/ApprovalsPage.tsx:219` (hộp Duyệt/Từ chối – **FE-B**).
- Vấn đề: nút xác nhận `disabled` khi lý do < 3 ký tự hoặc mật khẩu < 6 ký tự. Ô có dấu "Bắt buộc" nhưng không nói độ dài tối thiểu, và không có câu lý do cạnh nút.
- Vì sao quan trọng: lễ tân gõ lý do 2 ký tự ("ok") thì nút không bật mà không biết vì sao. Người dùng bàn phím không đến được nút `disabled`.
- Đề xuất sửa: `aria-disabled` + câu lý do cạnh nút (mẫu `whyLocked`): lý do → `field_error.reason_required` (đã có); mật khẩu → UXD thêm chuỗi khi FE làm.
- Trạng thái: Open (Minor – làm ở R3)

### FB-R2-UXD-FE-S4-25

- Mức độ: Minor (R3 – ý (4) còn lại của FE-S3-11)
- Vị trí: `apps/admin-web/src/pages/money/MoneyPage.tsx` (tab Hoàn tiền, nút "Chi hoàn tiền mặt"). Người sửa: **FE-A**.
- Vấn đề: hợp đồng 0.3.7 đã có `ApprovalRequest.requestedById`, nhưng Desk vẫn hiện nút chi cho chính người tạo yêu cầu. Bấm xong mới nhận 403 → câu `refund.self_execute_forbidden`.
- Vì sao quan trọng: thao tác thừa trước mặt khách; câu báo đến sau khi đã mở hộp và chọn ảnh biên nhận.
- Đề xuất sửa: `requestedById === session.userId` → không hiện nút chi; hiện sẵn `refund.self_execute_forbidden` (tiền mặt) / `refund.self_execute_forbidden_transfer`. Giữ xử lý 403 như hiện tại.
- Trạng thái: Open (Minor – làm ở R3)

### FB-R2-UXD-MOB-S4-04

- Mức độ: Minor (không chặn G8.3 – nút không có màu ngoài bảng)
- Vị trí: `apps/mobile/src/ui/parts.tsx` `Bell()` – `<a className="icon-btn hk-bell">` ở đầu mọi màn PWA. Người sửa: **MOB**.
- Vấn đề: sau MOB-S4-02, nút Quay lại cùng hàng có khung (`btn icon-btn`: nền `--surface`, viền `--line-strong`), còn chuông không có khung (nền trong suốt, viền 0 – `measure.json`). Chuông của Desk (hi-fi H02/H03/H04, C1) là `btn icon-btn`. ORC hỏi UXD quyết.
- Vì sao quan trọng: cùng một hàng đầu màn có hai kiểu nút biểu tượng. DS C1 chỉ có một kiểu nút biểu tượng; khung giúp nhân viên đeo găng/nhìn nhanh thấy vùng chạm 48 px.
- **Quyết định UXD: có khung.** Đề xuất sửa: `className="btn icon-btn hk-bell"`, giữ thẻ `<a>` và `aria-label`. Kiểm badge đếm (`.hk-badge`, `--bad` / `--ink-inverse`) vẫn nằm góc trên phải, không bị `.btn` (`inline-flex`, `padding`) đẩy lệch. Chụp lại một màn PWA sáng + tối.
- Trạng thái: **Verified** (UXD 18/10 – ảnh `scratchpad/shots/uxr/pwa-tasks-360-light.png`: chuông có khung, badge ở góc trên phải)

### FB-R2-UXD-FE-S4-26

- Mức độ: Minor (quyết định UXD cho UXR S4 P-02)
- Vị trí: `apps/admin-web/src/session/nav.ts` – `BAR_ORDER` / `mobileBar()` (thanh dưới Desk ≤ 860 px). Người sửa: **FE-B**.
- Vấn đề: một thứ tự chung cho mọi vai. Chủ đầu tư nhận "Tổng quan · Cần duyệt · Hôm nay · Phòng · Thêm".
  - "Hôm nay" lặp ý với "Tổng quan" của chủ đầu tư: cùng KPI và "Cần chú ý".
  - "Nhật ký tiền" nằm trong "Thêm", trong khi đây là việc kiểm soát hằng ngày của chủ đầu tư (BR-008; UXR KB10, J6).
  - Nếu chỉ chèn `moneylog` vào danh sách chung thì lễ tân sẽ mất "Đơn đặt phòng" trên thanh.
- Vì sao quan trọng: chủ đầu tư làm 5 phút đầu ngày trên điện thoại (DS 6.20): duyệt → xem chú ý → xem tiền. Nhật ký tiền cần 1 chạm, không phải 2.
- **Quyết định UXD:**
  - OWN, MGR: **Tổng quan · Cần duyệt · Phòng · Nhật ký tiền · Thêm**. "Hôm nay" vào "Thêm". Giữ "Phòng" theo hi-fi H24.
  - FDL, FD: giữ như hiện tại – FD: Hôm nay · Phòng · Buồng phòng · Đơn đặt phòng.
  - Nhãn giữ "Nhật ký tiền" (một khái niệm – một tên). Xuống 2 dòng trong ô 78 px là chấp nhận được, giống "Đơn đặt phòng".
- Đề xuất sửa: thứ tự theo vai (ví dụ `BAR_ORDER_BY_ROLE.owner/manager = ['overview','approvals','rack','moneylog']`, các vai khác dùng danh sách hiện tại), test `mobileBar` theo vai. UXD sửa hi-fi H24 và DS 6.20 sau cổng.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-27

- Mức độ: Minor
- Vị trí: Desk 390 px (đo chạy thật, mục H): `pages/TodayPage.tsx` khối "Cần chú ý" (`li.task.soon` + nút "Mở"); đầu trang `pages/reservations/ReservationsPage.tsx` (nút "Đặt phòng mới" + `button.userchip`). Người sửa: **FE-B**.
- Vấn đề: trang cuộn ngang.
  - Hôm nay: khối "Cần chú ý" rộng 418 px trên màn 390, nút "Mở" bị cắt mép phải.
  - Đơn đặt phòng: hàng đầu trang không xuống dòng, thừa 106 px – nút "Đặt phòng mới" và chip người dùng nằm ngoài màn.
  - Tổng quan, Cần duyệt, Nhật ký tiền, Buồng phòng, Sơ đồ phòng: không cuộn ngang. Bảng nhật ký tiền cuộn trong khung riêng, chấp nhận ở R2.
- Vì sao quan trọng: lễ tân dùng Desk trên điện thoại sẽ không thấy nút mở việc cần chú ý và nút tạo đơn.
- Đề xuất sửa:
  - "Cần chú ý" ở Hôm nay dùng cùng mẫu với H24: cả mục là một nút có mũi tên (DS 6.20). Hoặc cho `.task` xuống dòng để nút "Mở" nằm dưới chữ ở ≤ 520 px.
  - Đầu trang ≤ 520 px: `flex-wrap`, chip người dùng chỉ còn avatar, nút chính xuống dòng dưới tiêu đề.
  - Kiểm lại bằng phép đo `scrollWidth ≤ innerWidth` ở 360 và 390 px trên các trang có trên thanh dưới.
- Trạng thái: Open

### FB-R2-UXD-FE-S4-28

- Mức độ: Minor (thêm 18/10 khi duyệt chữ đợt 24 – mục C.5)
- Vị trí: `apps/admin-web/src/pages/money/MoneyPage.tsx`. Người sửa: **FE-A**.
  - Dòng 136: `ACTION_KEY['approval.cancelled'] = 'mlog.a_approval_cancelled'` ("Rút yêu cầu" / "Request withdrawn").
  - Dòng 577: chip tab Hoàn tiền dùng thẳng ``t(`approval.status.${a.status}`)``.
- Vấn đề:
  - Khi hệ thống tự đóng yêu cầu, BE ghi `approval.cancelled` với lý do `auto: <mã>`. Ví dụ `debt_cleared`, `no_show_restored`, `reservation_cancelled`.
  - Nhật ký tiền: cột "Thao tác" vẫn ghi "Rút yêu cầu", trong khi cột "Lý do" (đợt 24) ghi "…yêu cầu xóa công nợ tự đóng". Hai cột nói ngược nhau: người đọc hiểu là có người đã rút yêu cầu.
  - Tab Hoàn tiền: yêu cầu hoàn bị hệ thống đóng vẫn hiện chip "Đã rút".
  - Đợt 24 đã sửa đúng chỗ này ở H24 (`approvalStatusText`). Còn lại 2 chỗ trên.
- Vì sao quan trọng: nhật ký tiền là việc kiểm soát hằng ngày của chủ đầu tư (BR-008). Ghi nhầm "ai làm gì" làm việc truy trách nhiệm sai.
- Đề xuất sửa (không cần chuỗi mới):
  - (a) `AuditAction`: `e.action === 'approval.cancelled'` và lý do bắt đầu bằng `auto:` (cùng cách đọc như `auditReasonText`) thì hiện `t('approval.status.auto_closed')` ("Đã tự đóng" / "Auto-closed").
  - (b) Chip tab Hoàn tiền dùng `approvalStatusText(t, a)`.
  - Thêm 1 ca vào `s4-205-fea.test.tsx`: dòng nhật ký tự đóng không chứa `mlog.a_approval_cancelled`.
- Trạng thái: Open

---

## G. Ký G8.3 (18/10/2026, sau khi MOB sửa MOB-S4-02, MOB-S4-03)

- Đầu vào:
  - `outputs/MOB/s4-report.md` mục 7, `responses/s4-MOB.md`;
  - ảnh `scratchpad/shots/{before,after}/` ở 390 px sáng + tối (chip thêm 360 px, VI/EN) và `measure.json`;
  - mã đang chờ commit: `apps/mobile/src/ui/parts.tsx`, `ui/PhotoPicker.tsx`, `styles.css`, `pages/RoomPage.tsx`; `apps/guest-web/src/pages/RequestsPage.tsx`;
  - ca test mới `s4-brand.test.tsx` (PWA 7 ca, guest-web 2 ca).
- UXD đã xem ảnh "sau":
  - căn 101 tối;
  - form H23 (trang khách luôn sáng);
  - "Các căn" 360 px EN – chip dài nhất 3 dòng, chữ nằm trong nền, icon canh dòng đầu.
- Số đo trong `measure.json`:
  - nút Quay lại PWA, nút bỏ ảnh, nút Quay lại H23 đều là `btn icon-btn`: nền `rgb(251,249,244)` = `--surface`, viền `rgb(133,126,113)` = `--line-strong` (sáng); nền `rgb(36,34,31)`, viền `rgb(133,127,117)` (tối) – đúng token;
  - quét vỏ nút mặc định của trình duyệt: **0** ở 8 màn (PWA căn 101, Thao tác trên máy, Báo sự cố có ảnh, Các căn; guest H23, Lưu trú, Thông tin), cả hai chế độ;
  - chip tràn nền: 0/10 ở 390 px VI sáng + tối, 360 px VI, 390 px EN, 360 px EN;
  - `h3` của PWA (`StateView` "Đã gửi hết") = Be Vietnam Pro 600 sau khi UXD sửa `hifi.css`.
- **Kết luận G8.3: ĐẠT – UXD ký.** Màu trên bản dựng Sprint 4 chỉ còn token DS và các ngoại lệ đã ghi ở DS 2.4 v0.4.1. Hai ngoại lệ chức năng UXD đã ghi ở mục A.1 (mã QR đen/trắng, phiếu in) sẽ đưa vào DS 2.4 ở v0.4.2.
- Điều kiện: chữ ký áp cho commit có các tệp MOB nêu trên. QC đối chiếu commit chấm có `btn icon-btn` ở 3 chỗ (`s4-brand.test.tsx` khóa việc này).
- Phần **chưa** thuộc chữ ký này:
  - FE-S4-22 (BR-012, Phiếu thanh toán in số căn) – thuộc S4-52, không phải màu;
  - MOB-S4-04 (khung chuông) – Minor, không có màu ngoài bảng;
  - phần chưa đo chạy thật của G8.2 (mục B).
- Tự MOB phát hiện và đã sửa: thẻ trống có viền ở màn căn 101 (`.card.hk-info` render khi không có nội dung) – UXD đồng ý.
- Giả định MOB 7.5 (chip nhiều dòng giữ dạng viên thuốc): **UXD đồng ý**, giữ `--r-pill`.

### G.1 Ký lại sau đổi bố cục PWA + guest-web (MOB 8.7, sửa axe TC-X-079) – 18/10

- Thay đổi: khung `100dvh`, các thanh xếp chồng, chỉ `.m-body` cuộn, bỏ `sticky`. Tệp `apps/mobile/src/styles.css`, `App.tsx`; `apps/guest-web/src/styles.css` – chưa commit lúc xem.
- UXD đo lại trên mock (vite riêng ở cổng 5197/5198, đã tắt sau khi đo):
  - màn: PWA Việc của tôi, Các căn, căn 101, Báo sự cố; guest-web Lưu trú, form H23;
  - khổ 360×800 và 390×844, sáng + tối – **24 lượt**;
  - mỗi lượt: axe `color-contrast` + đủ luật mức critical/serious, quét màu ngoài token, đo vị trí các thanh.
- Kết quả:
  - **0** lỗi tương phản, **0** lỗi critical/serious, **0** màu ngoài token;
  - không cuộn ngang; tài liệu không cuộn, chỉ thân trang cuộn;
  - đầu trang, thân, thanh nút, thanh tab nối tiếp nhau không chồng: ví dụ 360 px căn 101: đầu 0–73, thân 73–654, thanh nút 654–735, tab 735–800;
  - chế độ tối áp ở PWA; guest-web giữ sáng;
  - xem ảnh: thẻ việc gấp, nút "Bắt đầu dọn", chuông có khung, trang khách (lời chào Lora, tên phòng, Wi-Fi mono) hiện đủ, không bị che.
- **G8.3: vẫn ĐẠT – UXD ký lại**, áp cho commit có thay đổi bố cục MOB 8.7. Không có thẻ mới.

## H. Desk trên điện thoại – thanh dưới (UXR S4 P-02, FE-B) – xem thật 18/10

- Cách xem:
  - admin-web từ cây làm việc hiện tại (có mã FE-B chưa commit), mock MSW, vite cổng 5194 với cấu hình tạm ở scratchpad, Chromium headless, `deviceScaleFactor` 2;
  - không dùng stack `ottimo-uxr`: ảnh dựng của stack này chưa có mã thanh dưới;
  - tài khoản `qa.owner` (sáng + tối), `qa.fd` (sáng); khổ 390 px, cùng 768 / 860 / 861 / 1024 px cho Tổng quan;
  - ảnh và `measure.json` ở `scratchpad/desk-mobile/`. Đã tắt server sau khi đo.
- Kết quả:

| Kiểm                  | Kết quả                                                                                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Điểm gãy 860 px       | **Ổn.** 860 px: thanh dưới hiện, thanh bên ẩn. 861 px: thanh bên hiện, không có thanh dưới. Không lúc nào có cả hai hoặc không có cái nào. Đây cũng là mốc `hifi.css` ẩn `.side`, nên chỉ có một luật. Ở 861–1023 px, Tổng quan 2 cột vẫn gọn; ở 768 px thanh dưới dùng tốt (ô 154 px) |
| Thanh dưới OWN 390 px | Tổng quan · Cần duyệt · Hôm nay · Phòng · Thêm. Mỗi ô 78 × 56 px (≥ 44), mục đang chọn có vạch và chữ Earth Brown. Trang trong "Thêm" (Nhật ký tiền) đánh dấu ô "Thêm" là đang chọn, có nút Quay lại ở đầu trang                                                                       |
| "Thêm"                | Ngăn kéo có đủ nhóm Vận hành / Khách & bán / Quản trị (Nhật ký tiền, Minibar, Danh mục căn, Tham số, Người dùng, Thiết bị), chip "Máy chưa cấp quyền giấy tờ". Đúng mẫu H02                                                                                                            |
| Thanh dưới FD 390 px  | Hôm nay · Phòng · Buồng phòng · Đơn đặt phòng · Thêm. Nhãn dài xuống 2 dòng (ô cao 62 px), đọc được                                                                                                                                                                                    |
| Cần duyệt 390 px      | Thẻ xếp dọc; nút Từ chối / Duyệt chia đôi bề ngang, ≥ 44 px. Ổn                                                                                                                                                                                                                        |
| Chế độ tối (OWN)      | Thanh dưới và ngăn "Thêm" theo token tối, không có màu lạ                                                                                                                                                                                                                              |
| Cuộn ngang            | Không cuộn ở Tổng quan, Cần duyệt, Nhật ký tiền, Buồng phòng, Sơ đồ phòng. **Có cuộn** ở Hôm nay (28 px) và Đơn đặt phòng (106 px) → **FE-S4-27**                                                                                                                                      |

- **Quyết định Nhật ký tiền:** đưa lên thanh cho OWN/MGR, thay "Hôm nay"; FD/FDL giữ nguyên → **FE-S4-26**. Không chặn cổng.

## F. Việc UXD tự làm sau cổng (không chặn)

1. Câu `error.CONCURRENT_UPDATE` / `retry.gave_up_concurrent` + hi-fi H13 (D.2).
2. **B2 ở `hifi.css`** – DS v0.4 đã ghi h3 = Be Vietnam Pro 600 (guideline p22 "H3 Subhead"), h1/h2 Lora 500 + giãn 0,02em, `.btn.brand` (Earth Brown / White).
   - **Đã làm 18/10 (ORC đồng ý):**
     - `h3` → `var(--sans)` 600, dòng 1,3;
     - thêm `.btn.brand` (`--earth` / `--on-earth`, hover Earth pha Ink 12 %), đặt trước luật khóa.
     - Kiểm: `check_hifi.py` 25/25 ✓.
     - Đo trong Chromium ở cả hai chế độ: h3 = "Be Vietnam Pro" 600; `.btn.brand` nền `rgb(122,92,68)`, chữ trắng; khi `aria-disabled` hiện kiểu khóa (Cream / Ink tối).
     - Áp vào cả 3 app qua `@ottimo/ui`, không cần sửa mã.
     - FE/MOB chạy lại test và chụp so sánh các màn có `h3`.
   - **Còn lại (chưa được giao):**
     - h1/h2 Lora 500 + giãn 0,02em, `.room-name`;
     - MOB dùng `.btn.brand` cho nút chính guest-web (G2 – B4).
     - MOB đã tự làm `.gw-hello`, `.gw-room-name` theo DS.
3. DS v0.4.2: ghi vào 2.4 hai ngoại lệ đã thấy ở bản dựng:
   - mã QR đen/trắng `#000`/`#fff` (`packages/ui/src/QrCode.tsx`) – cần tương phản tối đa để máy quét đọc;
   - giá trị sáng cố định của `.print-root` cho phiếu in.
4. Dán lại bảng chuỗi vào `content-guide.md` mục 8.
5. Duyệt chuỗi FE-A thêm sau vào nhóm đợt 18, nếu có.

## Điểm làm tốt (nên giữ)

- 3 app không còn mã màu viết tay trong CSS và TSX: `packages/ui/src/styles/app.css`, `apps/mobile/src/styles.css`, `apps/guest-web/src/styles.css`, 0 mã HEX/rgb/hsl, 0 style màu nội tuyến. Mọi màu đi qua token DS. PWA và guest-web: 0 `style={{…}}`.
- guest-web đúng DS 11.5 (chỉ sáng: `<html data-theme="light">`, `theme-color` Ivory). PWA có `theme-color` theo hai chế độ.
- Desk xử lý 409 `MINIBAR_PERIOD_CHANGED` đúng mẫu: không mất dữ liệu, không tự gửi lại lệnh đã lỗi thời, sinh khóa mới. Ca test kiểm hai khóa khác nhau.
