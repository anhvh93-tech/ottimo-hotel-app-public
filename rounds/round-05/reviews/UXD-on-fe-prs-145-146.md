# UXD review – FE PR #145 (V5-15 Desk, Trả phòng quá ngày đi) và #146 (Hoàn tiền ở 390 px, thẻ 130-01, 130-04)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng (chỉ đọc, không đẩy lên nhánh PR, không gộp, không đánh dấu ready):
  - **#145** `r5-fe-v5-15-overdue` @ **`011d44e7`**:
    - nội dung V5-15 nằm ở `9660334e`;
    - `7a51c929`, `7900a5fe` gộp nhánh của #140 (cùng #125, #128). #140 đã vào `main` ở `1a422157`, UXD đã review riêng;
    - `011d44e7` gộp `main` @ `2eba9847`.
    - `gh pr diff 145` hiện 28 tệp vì nhánh có nhiều merge base. Phần mới so với `main` chỉ là V5-15.
  - **#146** `r5-fe-refund-390` @ **`5ba4fb8c`**: 3 tệp (`MoneyPage.tsx`, `app.css`, `r5-refund-390-fea.test.tsx`).
- Cách kiểm:
  - đọc báo cáo FE `rounds/round-05/outputs/FE/v5-15-overdue-fea.md`, mã `pages/stay/overdue.tsx`, `CheckOutPage.tsx`, `ReservationDrawer.tsx`, `mocks/overdue.ts` ở `011d44e7`; `MoneyPage.tsx`, `app.css` ở `5ba4fb8c`;
  - dựng worktree riêng trong scratchpad cho từng SHA, và một cây gộp thử `main` + #145 + #146 (chỉ ở máy, không đẩy). Chạy `gen_strings.py` ở cả hai SHA: `strings-*.json`, `strings.js`, `strings-tables.md` không đổi;
  - chạy admin-web trên mock (Vite, MSW), chụp bằng Playwright ở **1440 và 390 px, sáng và tối, VI và EN**, với `qa.owner`, `qa.mgr`, `qa.fdl`, `qa.fd`. Ảnh ở scratchpad phiên (`uxd-r5-145-146/shots/`), **không đưa vào repo**. Dữ liệu là dữ liệu mock, không có khách thật;
  - đo bằng script: tràn ngang, `aria-describedby`, thứ tự Tab, focus sau từng lỗi, vai trò Alert, font tính được, màu nút khóa;
  - quét phần thêm của hai PR: không có mã màu, `font-family`, `rgb()`, `style=`, emoji, chữ viết cứng. Mọi chữ đi qua `t()` và `gen_strings.py`.
- Đối chiếu: `00-brief/context/brand/brand-guidelines.md`; `product/design/design-system.md` (ngoại lệ 2.4: `--info` chỉ trong Alert); `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 7.1, 15.3 (gồm ý 2a mới), 15.4; `rounds/round-05/reviews/DOM-on-fe-pr-145.md`; `rounds/round-05/reviews/ARC-on-fe-prs-145-146.md` mục 3.3, 3.4; `rounds/round-05/reviews/UXD-on-fe-pr-130.md` (thẻ 130-01, 130-04).

## 0. Kết luận

| PR | Kết luận | Thẻ |
|---|---|---|
| **#145** V5-15 Desk @ `011d44e7` | **DUYỆT CÓ ĐIỀU KIỆN** | Điều kiện gộp: **145-01** (Major) – áp bảng A của `copy-v1.0.5.md` mục 9.15. Gồm câu nhắc theo giờ hẹn của DOM 145-01, bỏ `co.time_from_late` trên đơn quá ngày đi, gộp `main` và sinh lại chữ. Không chặn gộp: 145-02, 145-03 (Minor), 145-04, 145-05, 145-06 (Suggestion) |
| **#146** Hoàn tiền 390 px @ `5ba4fb8c` | **DUYỆT** | 130-01 và 130-04 **đóng (Done)**. Thêm 146-01 (Suggestion, không chặn) |

- Không có Blocker. Có một Major (145-01), sửa trong #145.
- **Chữ:** UXD chốt cả 10 khóa FE-A2 viết nháp:
  - giữ 7 khóa;
  - sửa chữ 2 khóa: `checkout.overdue_time_help`, `checkout.overdue_after_limit`;
  - sửa bản EN 1 khóa: `checkout.overdue_reason.no_notice`.

  Thêm 4 khóa mới:
  - `overdue_time_help_agreed` (DOM 145-01, bắt buộc);
  - `overdue_time_early` (DOM 145-02, vào #145 theo ARC 3.4);
  - `overdue_extend_hint` (DOM 145-03, nên có trong cùng lượt);
  - `overdue_reason_evidence` (DOM 145-04, tùy FE-A2).

  Để sẵn 1 khóa cho v1.0.6 (DOM 145-05). Bảng đủ chữ ở `copy-v1.0.5.md` **bản 2.4, mục 9.15**. Dòng `gen_strings.py` ở thẻ 145-01, 145-02.
- **DOM 145-02 và 145-03 làm ngay hay để v1.0.6:**
  - 145-02 chốt chữ **ngay**, vào #145 theo ARC 3.4;
  - 145-03 UXD cũng chốt chữ **ngay**: chỉ một câu, dùng điều kiện quyền sẵn có (`allowedActions` có `extend_stay`), nên không cần đổi máy chủ. Không kịp thì để v1.0.6, BA đưa ý vào sổ tay. Không chặn gộp.
- **Không có ESC.** Chữ và chỗ hiện thuộc quyền UXD; quy tắc tiền đã có ở DOM 15.3, cách tạm đã có ở ARC 3.3.
- **Thương hiệu (cả hai PR):**
  - **Màu:** PR không thêm màu.
    - Đầu trang Trả phòng và màn chỉ dẫn dùng `Alert tone="info"`. `--info` chỉ nằm trong Alert, đúng ngoại lệ 2.4.
    - Nút Trả phòng bị khóa ở ngăn đơn có nền Cream `#EDE6D8`, chữ Stone Grey `#6B6760`, viền nét đứt và con trỏ `not-allowed`. Đây là kiểu `aria-disabled` chung của `wf.css`, giống nút khóa của Vắng mặt.
  - **Font:** tiêu đề trang Lora; tiêu đề Alert, dòng nhắc, ô nhập Be Vietnam Pro (đo bằng `getComputedStyle` ở cả 6 cấu hình).
  - **Giọng:** chữ Desk nội bộ, tiếng Việt trước. Ngắn, điềm tĩnh, không đổ lỗi, không emoji. Không cần CPY.
- **CI lúc review:** cả hai SHA xanh (job còn lại `SKIPPED`).
  - #145 đang **CONFLICTING** với `main` ở `strings.js`, vì #134, #137, #141 đã thêm chữ. Gộp `main` rồi chạy lại `gen_strings.py` là hết: UXD đã thử trên cây gộp, `gen_strings.py` chạy sạch, không còn xung đột.
  - #146 sau `main` nhưng gộp sạch.

---

## 1. #145 – chữ (10 khóa FE-A2 và 4 khóa mới)

### 1.1 Chốt từng khóa

Bảng chữ đầy đủ (VI, EN, khi nào hiện, biến) ở `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 9.15. Tóm tắt:

| Khóa | Quyết định | Lý do ngắn |
|---|---|---|
| `checkout.overdue_title` | Giữ | Ngắn, đúng DOM 7.1 |
| `checkout.overdue_body` | Giữ | Nói đủ 3 việc theo đúng thứ tự: giờ, lý do, gia hạn trước nếu ở thêm |
| `checkout.overdue_time_help` | **Sửa chữ** | Nháp "Không có bằng chứng giờ:" đọc như nhãn mục. Viết thành câu điều kiện. "– không phụ thu" áp cho cả hai cách ghi |
| `checkout.overdue_reason_label` | Giữ | |
| `checkout.overdue_reason_pick` | Giữ | Chỉ là `aria-label` của nhóm nút. Đọc đúng ("Lý do thường gặp, nhóm") |
| `checkout.overdue_reason.no_notice` | **Sửa EN** | "without telling us" là giọng khách sạn nói với khách. Ô này lưu nhật ký nội bộ, nên dùng "without notice" |
| `checkout.overdue_reason.desk_forgot` | Giữ | Đúng tên nút "Trả phòng" |
| `checkout.overdue_reason.other` | Giữ | |
| `checkout.overdue_after_limit` | **Sửa chữ** | Nháp: "Khách ở thêm đêm đó thì gia hạn". Nhưng đã quá mốc thì Desk **luôn** tính thêm đêm, không có nhánh "không ở". Câu mới nói hệ quả (thêm 1 đêm) và việc làm (gia hạn trước) |
| `checkout.overdue_effect` | Giữ | Thấy cách nhấn dòng này ở 145-04 |
| `checkout.overdue_time_help_agreed` | **Mới**, bắt buộc | DOM 145-01, luật 15.3 ý 2a: có giờ hẹn thì "không bằng chứng" là giữ giờ hẹn và phụ thu hẹn |
| `checkout.overdue_time_early` | **Mới**, vào #145 (ARC 3.4) | DOM 145-02: chốt chặn duy nhất của V515-01 ở v1.0.5 |
| `checkout.overdue_extend_hint` | **Mới**, nên có | DOM 145-03 |
| `checkout.overdue_reason_evidence` | **Mới**, tùy FE-A2 | DOM 145-04 |
| `checkout.overdue_told_guest` | Để sẵn v1.0.6 | DOM 145-05. Chưa đếm |

Hai khóa `checkout.overdue_need_manager`, `checkout.overdue_need_owner` (đã chốt ở `UXD-on-fe-prs-125-128.md` mục 3) giữ nguyên. Khóa `checkout.overdue_reason_help` (mục 9.9, điều kiện SEC) giữ nguyên.

### 1.2 Hai biến thể của dòng nhắc dưới ô giờ (DOM 145-01)

Tại `011d44e7`, đơn quá ngày đi có giờ hẹn hiện liền hai câu trái nhau: "Theo giờ trả muộn đã hẹn 17:00." rồi "Không có bằng chứng giờ: ghi 12:00 (giờ trả chuẩn)…". Làm theo câu sau thì mất phụ thu đã hẹn (DOM 145-01). Chốt:

- **Không có `agreedCheckoutTime`:** `checkout.overdue_time_help` (đã sửa chữ), `{time}` = `standardCheckoutTime ?? rules.checkoutTime`.
- **Có `agreedCheckoutTime`:** `checkout.overdue_time_help_agreed`, `{time}` = giờ hẹn. Câu nói 3 loại bằng chứng hay gặp ở quầy (trả chìa, tin nhắn, buồng phòng thấy căn trống). Không nói phụ thu tính lại ra sao, vì bước ② đã hiện số mới (`checkout.late_recalc`).
- Trên nhánh quá ngày đi **bỏ** `co.time_from_late`: câu mới đã có giờ hẹn, giữ lại thì lặp.
- Nhánh không quá ngày đi giữ nguyên như `main`.

### 1.3 Câu cho giờ trước mốc đổi ngày (DOM 145-02, ARC 3.4)

Trên mock (đúng như máy chủ, lỗi V515-01), gõ 03:00 thì `checkoutAt` ra D+1 03:00. Tại `011d44e7`, Desk hiện "Giờ này quá mốc trả muộn của ngày đi. Khách ở thêm đêm đó thì gia hạn trước…". Lễ tân làm theo thì gia hạn một đêm khách không ở.

Câu mới `checkout.overdue_time_early`:
- câu đầu nói Desk đang hiểu giờ thế nào ("Desk hiểu 03:00 là rạng sáng …");
- hai câu sau là hai ca, mỗi ca một việc, đúng cách tạm DOM 3.3 và ARC 3.3.

`{rollover}` lấy từ `property.businessDayRollover`, không viết cứng. Điều kiện hiện và biến theo ARC 3.4, lấy từ `checkoutAt` máy chủ trả. Câu tự tắt khi v1.0.6 sửa máy chủ. Không nói lỗi máy chủ hay v1.0.6 trên màn.

### 1.4 Câu nhắc Gia hạn cho lễ tân (DOM 145-03)

DOM đề xuất đặt câu này trước câu gọi ai. UXD đặt **sau**:
- câu trạng thái (vì sao nút khóa) cần đứng đầu;
- "Trước khi gọi" đã nói thứ tự việc.

Chỉ hiện khi người xem có `extend_stay`, để không bảo ai bấm nút họ không có.

---

## 2. #145 – kiểm trên mock (`011d44e7`)

Đơn mock: căn 201, ngày đi 06/11/2026, quá 1 đêm (MGR), 2 đêm (FDL, MGR), 3 đêm (OWN). Giờ trả chuẩn của mock là 12:00.

| Trạng thái | Kết quả | Đạt |
|---|---|---|
| Đầu trang (mọi bước) | `Alert info` "Trả phòng quá ngày đi" + thân `overdue_body` ("đã qua 1 đêm", số ít đúng) | Đạt |
| Bước ②, mở lần đầu (MGR) | Ô giờ 12:00, `aria-describedby` ra đúng câu `overdue_time_help`. Ô lý do có `aria-required`, `aria-describedby` = câu SEC D12c. Câu cạnh nút khóa: "Ghi lý do (ít nhất 3 ký tự)." | Đạt |
| Thứ tự Tab ở bước ② | ô giờ → 3 nút gợi ý → ô lý do → các khoản phát sinh | Đạt |
| Nút gợi ý 1 | Điền "Khách đi không báo", câu khóa nút biến mất | Đạt |
| Nút "Khác (ghi rõ)" | Xóa ô, focus vào ô lý do. Gõ 2 ký tự → câu khóa nút trở lại | Đạt |
| Gõ 19:00 (quá mốc cuối) | Lỗi dưới ô và câu khóa nút cùng là `overdue_after_limit` | Đạt, chữ đổi theo 9.15 |
| Gõ 03:00 | Như 19:00, tức là khuyên gia hạn sai | Chữ mới `overdue_time_early` (1.3) |
| Gõ 14:00 | Phụ thu trả muộn, không thêm đêm | Đạt |
| Ô giờ để trống | Không đo được: Desk điền lại 12:00 sau khi đọc lại tóm tắt (hành vi có sẵn). Theo mã: câu khóa nút là `error.field_named` + `common.required` | Đạt (đọc mã) |
| Hộp xác nhận Hoàn tất | Có dòng "Ghi giờ khách rời: 12:00 ngày 06/11/2026." nằm giữa đoạn dài | Đạt. Thấy 145-04 |
| 403 `requiredRole: owner` (MGR, 2 đêm) | Màn chỉ dẫn `Alert info` "Đơn đã quá ngày đi 2 đêm: cần chủ đầu tư trả phòng." Đơn vẫn `in_house`. **Focus rơi về `body`** | Chữ đạt. Focus: 145-03 |
| 409 một lần | 2 lệnh POST, cùng `Idempotency-Key`, đơn `checked_out`, không có câu lỗi | Đạt |
| 409 hai lần | 2 lệnh POST, cùng khóa. Câu "Vẫn có người đang lưu cùng chỗ này. Dữ liệu của bạn còn nguyên…", dữ liệu còn trong ô | Đạt |
| 422 lý do có số thẻ | Câu dưới ô và khung lỗi, focus về ô lý do | Đạt |
| FD 1 đêm, FDL 2 đêm, MGR 2 đêm – trang Trả phòng | Màn chỉ dẫn, đúng câu `need_manager` / `need_owner`, không nút trả, có liên kết về chi tiết đơn | Đạt |
| Ngăn đơn – cùng 3 người | Một nút Trả phòng `aria-disabled="true"`, `aria-describedby` ra đúng câu. Enter trên nút không mở trang. 1440: câu một dòng bên trái nút. 390 EN: câu 2 dòng trên nút | Đạt |
| OWN 3 đêm | Vào được bước ② | Đạt |
| Tràn ngang | 0 px ở mọi trạng thái, 6 cấu hình | Đạt |
| Sáng / tối | Alert, nút khóa, dòng nhắc đọc rõ cả hai nền. Không có màu ngoài token | Đạt |

Ghi chú:
- Ở 390 px, nhóm 3 nút gợi ý xuống 3 hàng, mỗi nút cao khoảng 29 px. Ở 1440 EN, nhóm xuống 2 hàng. Thấy 145-06.
- Câu 409 hai lần là câu chung có sẵn, không do PR. Không mở thẻ.

---

## 3. #146 – kiểm trên mock (`5ba4fb8c`, và cây gộp với `main`)

| Cấu hình | Kết quả |
|---|---|
| 390, sáng/tối, VI/EN, MGR và FD | Mọi dòng hoàn dùng `.req-row`. Cột chữ rộng trọn 316 px, cao 80 px. Chip và nút xuống hàng dưới, căn phải (`justify-content: flex-end`). Mỗi dòng cao 186 px; trước đây gần 500 px (thẻ 130-01). Mã đơn, số tiền đọc liền một dòng ("OTM-0158 · 1.200.000"). Tràn ngang 0 |
| 1440, sáng/tối, VI/EN | Bố cục một hàng như cũ: chữ bên trái, nút bên phải. Không đổi điều kiện hiện nút (đối chiếu từng nhánh: `left > 0 && online`, tiền mặt hay chuyển khoản, MGR hay không) |
| `text-wrap: pretty` | Đo bằng `getComputedStyle` trên cây gộp (`main` + #145 + #146), trang Trả phòng 390 px, VI và EN: `.field .err > span` và `.alert .txt` đều `pretty`; dòng cuối rộng 130–274 px, không còn dòng chỉ một từ. Hộp Ghi đã hoàn (chỗ thẻ 130-04 nêu) dùng đúng hai lớp này: `Field error` và `Alert` |

- **FB-R5-UXD-FE-130-01: Done.** Đúng mẫu đề xuất, không thêm màu, không đổi chữ.
- **FB-R5-UXD-FE-130-04: Done.** Đúng hai chỗ đề xuất, có ghi chú thẻ trong CSS.
- Còn một chỗ cùng kiểu: dòng `help` dưới ô (`text-wrap: auto`). Ở 390 EN, câu help dưới ô giờ của bước ② Trả phòng (đơn quá ngày đi) có dòng cuối rộng 62 px, một từ. Mở 146-01, Suggestion.

---

## 4. Thẻ feedback

### FB-R5-UXD-FE-145-01
- Mức độ: **Major** (điều kiện gộp #145)
- Vị trí: `product/design/tools/gen_strings.py` (khóa `checkout.overdue_*`, khoảng dòng 2462–2474 ở `011d44e7`), `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx`: `timeHelp` (khoảng dòng 1690–1702), `timeError` (khoảng 1681–1688), `overdueWhy` (khoảng 819–830).
- Vấn đề:
  - Đơn quá ngày đi có giờ hẹn: Desk hiện câu bảo ghi giờ chuẩn, trái với giờ hẹn (DOM 145-01).
  - 3 khóa nháp cần sửa chữ (1.1).
  - Các ghi chú khóa còn ghi "chờ UXD duyệt".
  - Nhánh đang xung đột với `main` ở `strings.js`.
- Vì sao quan trọng: câu trên màn dẫn tới mất phụ thu đã thỏa thuận. Nhánh không gộp được khi còn xung đột.
- Đề xuất sửa:
  1. Gộp `main` (`git fetch -q origin && git merge --no-edit origin/main`), chạy lại `gen_strings.py`.
  2. Thay 3 dòng, thêm 1 dòng trong `gen_strings.py`. Giữ phần mô tả chỗ hiện của ghi chú; đổi "chờ UXD duyệt" thành "UXD duyệt 07/11 (UXD-on-fe-prs-145-146)". Sáu khóa giữ chữ cũng đổi ghi chú như vậy.
     ```python
     ("checkout.overdue_time_help", "Giờ khách rời căn, ngày {date}. Không có bằng chứng thì ghi {time} (giờ trả chuẩn), hoặc giờ thấy căn trống nếu sớm hơn – không phụ thu.", "The time the guest left, on {date}. With no proof, enter {time} (standard check-out), or the time the room was found empty if earlier – no surcharge.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15). help ô giờ trả (bước 2) của đơn quá ngày đi KHÔNG có agreedCheckoutTime; {date} = ngày đi hiệu lực, {time} = CheckoutSummary.standardCheckoutTime ?? rules.checkoutTime. Chữ Stone"),
     ("checkout.overdue_time_help_agreed", "Giờ khách rời căn, ngày {date}. Không có bằng chứng thì giữ {time} (giờ trả muộn đã hẹn) và phụ thu đã hẹn. Có bằng chứng khách đi sớm hơn (trả chìa, tin nhắn, buồng phòng thấy căn trống) thì ghi giờ đó.", "The time the guest left, on {date}. With no proof, keep {time} (the agreed late check-out) and the agreed charge. With proof the guest left earlier (key returned, a message, housekeeping found the room empty), enter that time.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15; DOM 15.3 ý 2a, FB-R5-DOM-FE-145-01). help ô giờ trả của đơn quá ngày đi CÓ agreedCheckoutTime, thay checkout.overdue_time_help; {date} = ngày đi hiệu lực, {time} = agreedCheckoutTime. Trên nhánh này không hiện co.time_from_late. Chữ Stone"),
     ("checkout.overdue_reason.no_notice", "Khách đi không báo", "Guest left without notice", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146). DOM 7.1 ý 1, lý do gợi ý 1: chọn thì điền chữ này vào ô lý do (theo ngôn ngữ Desk)"),
     ("checkout.overdue_after_limit", "Giờ này quá mốc trả muộn của ngày đi nên tính thêm 1 đêm. Gia hạn thêm đêm đó trước, rồi trả phòng.", "This time is after the departure day's late check-out limit, so it counts as one more night. Extend the stay by that night first, then check out.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15). Lỗi ô giờ trả và câu khóa nút của đơn quá ngày đi khi CheckoutSummary.extraNightRequired, hoặc B18 422 LATE_CHECKOUT_AFTER_LIMIT trên checkoutAt (thay field.LATE_CHECKOUT_AFTER_LIMIT), VÀ ngày của checkoutAt máy chủ = ngày đi hiệu lực. Ngày khác: checkout.overdue_time_early"),
     ```
  3. `CheckOutPage.tsx`, `timeHelp` trên đơn quá ngày đi:
     - có `r.agreedCheckoutTime` → `checkout.overdue_time_help_agreed` với `{time}` = giờ hẹn, và **không** thêm `co.time_from_late`;
     - không có → `checkout.overdue_time_help`.

     Nhánh không quá ngày đi giữ nguyên.
  4. Thêm ca vitest DOM 145-01: đơn quá ngày đi, giờ hẹn 17:00:
     - ô có 17:00, dưới ô có "giữ 17:00 (giờ trả muộn đã hẹn)";
     - không có "(giờ trả chuẩn)", không có "Theo giờ trả muộn đã hẹn".
- Trạng thái: Open (FE-A2, trong #145)

### FB-R5-UXD-FE-145-02
- Mức độ: Minor (nên làm cùng lượt 145-01; không chặn gộp)
- Vị trí: `gen_strings.py`; `CheckOutPage.tsx` (màn chỉ dẫn, khoảng dòng 746–749; `timeError`, `overdueWhy`); `ReservationDrawer.tsx` (dòng `li-s` khoảng 398–404).
- Vấn đề:
  - (a) Gõ giờ trước mốc đổi ngày (03:00): Desk khuyên gia hạn một đêm khách không ở (V515-01, DOM 145-02). ARC 3.4 đã quyết câu này vào #145.
  - (b) Lễ tân chỉ được bảo gọi quản lý. Màn không nhắc rằng khách còn ở thì lễ tân tự Gia hạn được (DOM 145-03).
- Vì sao quan trọng:
  - (a) sai tiền ngay lúc gõ giờ, và màn là chốt chặn duy nhất ở v1.0.5;
  - (b) ca ở thêm phải chờ quản lý dù không cần. Một đêm khách đã ở có thể bị ghi là "quên bấm".
- Đề xuất sửa:
  ```python
  ("checkout.overdue_time_early", "Desk hiểu {time} là rạng sáng {next}. Khách đi lúc {time} ngày {date}: ghi {rollover}, ghi giờ thật vào lý do, không gia hạn. Khách đi rạng sáng {next} là đã ở thêm đêm {date}: gia hạn trước.", "Desk reads {time} as early on {next}. If the guest left at {time} on {date}: enter {rollover}, put the real time in the reason, don't extend. If they left early on {next}, they stayed the night of {date}: extend first.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15; DOM 145-02, ARC 3.4, FB-R5-FE-ARC-V515-01). Thay checkout.overdue_after_limit ở lỗi ô giờ và câu khóa nút khi overdue && extraNightRequired && ngày của checkoutAt máy chủ khác ngày đi hiệu lực (cả đơn đã gia hạn mà vẫn quá ngày đi). {time} = giờ của checkoutAt, {next} = date() ngày của checkoutAt, {date} = date(ngày đi hiệu lực), {rollover} = property.businessDayRollover. Tự tắt khi máy chủ v1.0.6 sửa"),
  ("checkout.overdue_extend_hint", "Trước khi gọi, kiểm căn: khách còn ở hoặc đã ở thêm đêm thì bấm Gia hạn, không cần chờ.", "Before calling, check the room: if the guest is still there or stayed extra nights, use Extend stay – no need to wait.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15; DOM 145-03). Ngay sau checkout.overdue_need_*: trong Alert info màn chỉ dẫn (Trả phòng) và dòng li-s cạnh nút Trả phòng bị khóa (ngăn đơn). Chỉ khi allowedActions có extend_stay"),
  ```
  - (a) điều kiện và biến đúng như ARC 3.4. Test: gõ 03:00 → có "rạng sáng", không có "quá mốc trả muộn".
  - (b) ngăn đơn: câu need và câu nhắc trong cùng `span` mà `aria-describedby` trỏ tới, cách nhau một dấu cách.
  - Không kịp lượt này thì: (a) release notes theo ARC 3.3; (b) v1.0.6 và sổ tay BA.
- Trạng thái: Open (FE-A2)

### FB-R5-UXD-FE-145-03
- Mức độ: Minor
- Vị trí: `CheckOutPage.tsx`, nhánh 403 `FORBIDDEN_ACTION` (khoảng dòng 1127, `overdueDenial`) → màn chỉ dẫn (khoảng 746).
- Vấn đề: MGR bấm Hoàn tất, máy chủ trả 403 `requiredRole: owner`. Hộp xác nhận đóng, trang đổi sang màn chỉ dẫn, nhưng focus rơi về `body` (đo ở 6 cấu hình). Người dùng bàn phím, trình đọc màn hình phải Tab lại từ đầu trang. Alert dùng `role="status"` nên có thể không được đọc khi nội dung thay cả khối.
- Vì sao quan trọng: đây là kết quả của một lệnh tiền bị từ chối. Người bấm cần biết ngay vì sao và gọi ai.
- Đề xuất sửa: theo mẫu 9.14 (c). Sau 403, đưa focus vào Alert màn chỉ dẫn (`tabIndex={-1}`, focus một lần khi màn hiện từ lỗi). Không đổi chữ.
- Trạng thái: Open (FE-A2; cùng lượt nếu tiện)

### FB-R5-UXD-FE-145-04
- Mức độ: Suggestion
- Vị trí: hộp xác nhận Hoàn tất, dòng `checkout.overdue_effect` (khoảng dòng 2388).
- Vấn đề: "Ghi giờ khách rời: 12:00 ngày 06/11/2026." nằm giữa một đoạn dài: trạng thái đơn, buồng, việc dọn, số phiếu, khóa cửa. Trên đơn quá ngày đi, đây là điều cần soát lại nhất (DOM 3.3 bước 3), nhưng dễ đọc lướt qua.
- Vì sao quan trọng: giờ đã ghi quyết định tiền và không sửa lại được sau bước này.
- Đề xuất sửa: tách dòng này thành đoạn riêng đứng đầu thân hộp, chữ đậm 600 (Be Vietnam Pro, màu Ink). Không thêm màu, không đổi chữ.
- Trạng thái: Open (FE-A2 hoặc v1.0.6)

### FB-R5-UXD-FE-145-05
- Mức độ: Suggestion
- Vị trí: ô lý do (`CheckOutPage.tsx` khoảng dòng 1728–1745), `OVERDUE_REASONS` (`overdue.tsx`).
- Vấn đề: bấm nút gợi ý là đủ 3 ký tự, gửi được ngay. Lý do là chỗ duy nhất ghi bằng chứng của giờ (DOM 145-04).
- Vì sao quan trọng: chủ đầu tư hậu kiểm chỉ thấy "Khách đi không báo", không biết giờ có bằng chứng hay không.
- Đề xuất sửa:
  - thêm help trước câu SEC D12c, trong cùng dòng `help`, câu này đứng trước:
    ```python
    ("checkout.overdue_reason_evidence", "Ghi thêm cách biết giờ khách rời: ai thấy căn trống, lúc nào, khách có nhắn không.", "Add how you know when the guest left: who found the room empty, when, and whether the guest sent a message.", None, "v1.0.5 V5-15 – UXD duyệt 07/11 (UXD-on-fe-prs-145-146; copy-v1.0.5 9.15; DOM 145-04). help ô overdueReason, đứng trước checkout.overdue_reason_help. Chữ Stone"),
    ```
  - sau khi bấm nút gợi ý 1 hoặc 2, đặt con trỏ ở cuối ô. Không thêm dấu phẩy vào chữ điền: không ghi tiếp thì không còn dấu phẩy treo trong nhật ký.
- Trạng thái: Open (FE-A2 tùy chọn; không thì v1.0.6)

### FB-R5-UXD-FE-145-06
- Mức độ: Suggestion (v1.0.6, DS)
- Vị trí: `Seg` (gói `product/packages/ui`), nhóm 3 nút gợi ý ở bước ②.
- Vấn đề: ở 390 px nhóm xuống 3 hàng, mỗi nút cao khoảng 29 px, rộng theo chữ. Đích chạm thấp hơn mức 40 px của DS, các nút lệch nhau.
- Vì sao quan trọng: quản lý hay xử lý ca này trên điện thoại.
- Đề xuất sửa: dưới 520 px, khi `Seg` xuống hàng thì mỗi nút `min-height: 40px` và rộng trọn hàng. UXD ghi vào design system ở lượt DS sau.
- Trạng thái: Open (UXD + FE, v1.0.6)

### FB-R5-UXD-FE-146-01
- Mức độ: Suggestion
- Vị trí: `product/packages/ui/src/styles/app.css`, quy tắc `text-wrap: pretty` mới của #146.
- Vấn đề: quy tắc chỉ áp cho `.field .err > span` và `.alert .txt`. Dòng help dưới ô (`.field .help`) vẫn có thể còn một từ ở dòng cuối: ô giờ bước ② Trả phòng, đơn quá ngày đi, 390 px EN, dòng cuối rộng 62 px. Câu 9.15 mới cũng dài, nên dễ gặp lại.
- Vì sao quan trọng: thẩm mỹ chữ, không ảnh hưởng đọc hiểu.
- Đề xuất sửa: thêm `.field .help` vào cùng quy tắc. Làm ở bất kỳ PR CSS nào sau, không cần PR riêng.
- Trạng thái: Open (FE)

---

## 5. Việc UXD tự làm sau review này (không phải thẻ cho FE)
- Đã ghi `copy-v1.0.5.md` bản 2.4 (mục 0, 6, 8, 9.15) trong cùng commit với tệp này.
- Review phần thay đổi của #145 ở SHA mới, chỉ phần chữ và chỗ hiện. Soát theo mục 8 bản 2.4.
- Sau khi #145 gộp: thêm các khóa 9.15 vào `design/content-guide.md` mục 8.
- Lượt DS sau: thẻ 145-06 (`Seg` trên điện thoại), và `text-wrap: pretty` cho `help` nếu 146-01 chưa làm.

## 6. Điểm làm tốt
- `mocks/overdue.ts` chép đúng hàm thuần của máy chủ, kể cả lỗi V515-01. Nhờ vậy UXD thấy được câu sai ngay trên mock, trước khi lên staging.
- Nút khóa ở ngăn đơn dùng lại đúng mẫu của Vắng mặt: `aria-disabled` cùng `aria-describedby`, câu đứng cạnh nút. Không có nút ẩn hay nút giả.
- 409 thử lại đúng một lần với cùng `Idempotency-Key`, giữ dữ liệu trong ô khi vẫn lỗi.
- #146 sửa bằng mẫu sẵn có (`.req-row`), không thêm màu, không đổi điều kiện hiện nút, có ghi chú thẻ ngay trong CSS.

## 7. Dòng đề xuất cho `01-decisions/decision-log.md`

```
| 2026-11-07 | 5 | UXD – review FE #145 (V5-15 Desk, Trả phòng quá ngày đi) @ 011d44e7: DUYỆT CÓ ĐIỀU KIỆN – điều kiện 145-01 Major: áp copy-v1.0.5 bản 2.4 mục 9.15 bảng A (sửa overdue_time_help, overdue_after_limit, EN no_notice; thêm overdue_time_help_agreed theo agreedCheckoutTime, DOM 145-01; bỏ co.time_from_late trên đơn quá ngày đi), gộp main và sinh lại strings.js; 145-02 Minor (overdue_time_early theo ARC 3.4, overdue_extend_hint), 145-03 Minor (focus sau 403), 145-04/05/06 Suggestion. #146 (Hoàn tiền 390 px) @ 5ba4fb8c: DUYỆT, đóng 130-01 và 130-04, thêm 146-01 Suggestion. Kiểm trên mock 1440/390, sáng/tối, VI/EN; ảnh chỉ ở scratchpad. Không ESC | UXD | rounds/round-05/reviews/UXD-on-fe-prs-145-146.md |
```
