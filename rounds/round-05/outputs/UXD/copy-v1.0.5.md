# Bảng chữ v1.0.5 – Gói 2 "Chữ và tham số theo bảng giá 01/11"

- Lập: UXD · Round 5 – Sản xuất · 06/11/2026 · Bản 1.0 (`6b3700c6`).
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.1**: áp review CPY (`rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`, 11 thẻ). Chỗ đổi gồm:
  - mục 0 (số khóa);
  - 4.1 (U+00A0), 4.6 (`gw.lang_auto_sr`), 4.8 (ngoặc ở VI, ca chờ DOM);
  - 4.20 ("căn" trên chữ VI gửi khách), 4.21 (dấu "!" khác, chờ PO);
  - 5.1 ("Предоплата", 3 câu `msg.*`, `gw.req.clean_long_fee`), 5.3 (kiểm tự động);
  - mục 6, 7, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.2**: áp trả lời DOM (`rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 8 và 10). Chỗ đổi gồm:
  - mục 0 (số khóa);
  - 4.3 (G6: một câu cho `penalty` và `damage`);
  - 4.8 (thẻ CPY 04: `bill.line.late_fee_after_limit` vào bảng chính);
  - 4.14 (FB-R5-DOM-UXD-01: bỏ vế "Bạn sẽ được nhắc…", thay bằng giờ hạn; bỏ dạng số nhiều);
  - mục 6, 7, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.3**: áp thẻ FB-R5-CPY-UXD-V105-12 (CPY lượt 3, mục 12 tệp review). Chỉ đổi chữ 3 câu `sale.hold_next*` ở 4.14 (sale, CTV tự bấm Gia hạn giữ chỗ), cùng mục 0, 7, 8. Số khóa không đổi.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.4**: thêm mục 9, chữ Desk nội bộ ngoài Gói 2 theo DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` (`e9e0e2e4`): 9.1 hộp ghi tiền về cho đơn đã hủy (V5-5B, DOM 11.4), 9.2 câu lỗi khi lưu `min_stay` sai dạng (V5-25, DOM 12.7). Cùng mục 0, 6, 8. Chữ Desk nội bộ, không cần CPY.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.5**: mục 9.1 theo ARC 0.3.13 bổ sung 1c (PR #94, mục 1.21, nhánh `r5-contract-0313` @ `2cb549cc`) và DOM 11.4 (`5ad26fc1`): mã hoàn `payment_after_cancel`, "Có thể trùng", nơi nhận hoàn cố định, ảnh chứng từ do chủ đầu tư hoặc quản lý gửi, nhắc tìm đơn mới, mã giao dịch tùy chọn và 409 `DUPLICATE_BANK_REFERENCE`; mục 9.1a mới cho V5-48 (409 `INVALID_TRANSITION` trên đơn đã đóng). Mục 9.3 mới cho V5-1A: cảnh báo giá đêm khác thường `NIGHTLY_PRICE_UNUSUAL` (DOM 1.2 ý 6, `1568e523`). Theo BE PR #96 (V5-25): 9.2 sửa ca thiếu `channels` (máy chủ trả `allowed`) và ca quá 20 luật; mục 9.4 mới, câu lỗi chung cho 11 khóa có cấu trúc. Mục 9.5 mới cho V5-16 (US-177, BR-438; PO `6cfa6085`, ARC 0.3.13 mục 1.20). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 06/11/2026 · **Bản 1.6**: theo DOM review PR #96 (`rules-v1.0.5.md` 13.1, 13.2, 13.6): 9.4 thêm câu cho 422 `REQUIRED` (chung, `cancel_policy_direct` rỗng, `max_open_holds_per_user` thiếu vai); mục 9.6 mới, câu "tham số sai dạng" khi giá trị đã lưu bị hỏng (mã chờ ARC). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 06/11/2026 · **Bản 1.7**: theo review FE PR #98, #102, #107 (`rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md`): mục 9.7 mới cho chữ Desk của V5-50 (hộp Đổi phòng) và V5-15 (nút Báo cần dọn, câu nhận phòng căn kẹt trạng thái). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Sản xuất · 07/11/2026 · **Bản 1.8**: mục 9.8 mới, một câu lỗi dưới ô mã giao dịch khi máy chủ trả 422 `CARD_NUMBER_DETECTED` có `field` = `bankReference`. Theo SEC chọn (a) cho thẻ C0313-25 (`rounds/round-05/responses/SEC-responses.md` mục 4). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Sản xuất · 07/11/2026 · **Bản 1.9**: mục 9.9 mới, câu nhắc D12c dưới ô lý do (`overdueReason`) của hộp Trả phòng quá ngày đi (V5-15, BE PR #99). Đây là điều kiện SEC ở `rounds/round-05/reviews/SEC-on-be-prs-106-99-checkout.md` mục 2.5. Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.0**: mục 9.10 mới, theo review `rounds/round-05/reviews/UXD-on-prs-97-116-117-118-122.md`. Gồm 3 câu 2FA không kể tên vai (V5-40, #118), xóa `booking.hold.typed_rate_locked` (V5-14, #122), 2 câu app nhân viên cho nút Báo cần dọn (V5-15, #97), và 2 ghi chú khóa (`bk.src_typed`, `staff.notif.k.hold_expired` theo FB-R5-ARC-UXD-117-01). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.1**: theo việc thêm của ORC sau review PR #97, #116, #117, #118, #122. Mục 9.11 mới: chữ chốt `mlog.a_money_not_found` (ARC đặt tạm ở PR #111, đã gộp `ce404dd6`; UXD áp trên `main` cùng commit này) và EN nút `today.money_after_cancel_not_found` ở 9.1. Mục 9.12 mới: nhãn 6 nhóm lý do hoàn (V5-13) và câu theo `lockReason` (V5-44), theo DOM FB-R5-DOM-UXD-112-01. Mục 9.8 thêm ghi chú: hợp đồng còn ghi "8 ký tự cuối", ARC sửa. Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.2**: mục 9.13 mới, chữ Desk cho V5-11 (Trả sớm trong 00:00–05:59; hợp đồng 0.3.13 mục 1.21, DOM `rules-v1.0.5.md` mục 2, BE PR #114) theo việc ORC giao cho làn FE-A V5-11: câu cho hai 409 `INVALID_TRANSITION` (`minNewDepartureDate`, `useCheckout`) và dòng ngày ghi phí giữ lại. 4 khóa mới, UXD đã áp trên `main` cùng commit này. Kèm một chỗ FE phải sửa để chữ đúng ở bước ③ (`canCheckOut`). Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.3**: mục 9.14 mới, theo review FE-3 Desk #134, #137, #141 (`rounds/round-05/reviews/UXD-on-fe3-prs-134-137-141.md`). Gồm: chữ chốt V5-18 `deposit.accept_shortfall_unverified` (thay nháp FE-3); khóa mới `folio.open_refunds_may_decrease` thay câu của hàng chờ duyệt dưới tổng chờ hoàn, kèm điều kiện hiện (V5-13); sửa `error.closed_booking_payment_sales`; B4 nhập tay trên đơn đã đóng dùng câu 9.1a (V5-48). FE-3 áp trong PR. UXD không áp trên `main`, để không đụng `gen_strings.py` của 3 PR đang mở. Ghi chú ở 9.1a, 9.12. Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.4**: mục 9.15 mới, chữ chốt hộp Trả phòng quá ngày đi (V5-15 Desk, FE-A2 PR #145 @ `011d44e7`) theo review `rounds/round-05/reviews/UXD-on-fe-prs-145-146.md`. Gồm: 10 khóa FE-A2 viết nháp (8 giữ, 2 sửa chữ, 1 sửa EN); 2 khóa chỉ dẫn gọi ai đã chốt ở review #125; 4 khóa mới theo DOM `DOM-on-fe-pr-145.md` (145-01 dòng nhắc khi có giờ hẹn, 145-02 giờ trước mốc đổi ngày theo ARC 3.4, 145-03 nhắc Gia hạn, 145-04 cách biết giờ); 1 khóa để sẵn cho v1.0.6 (145-05). FE-A2 áp trong #145. UXD không áp trên `main`. Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 07/11/2026 · **Bản 2.5**: mục 9.1 viết lại theo #148 đã gộp (DOM `DOM-on-be-d2-pr-148.md`: 148-01 Major, 148-06, 148-07, 148-08). Quẹt thẻ chỉ khi đơn còn phải thu (N > 0), tối đa N; yêu cầu hoàn = max(0, số ghi − N), không còn "hoàn đủ" ở mọi ca; 9 khóa mới, 6 khóa sửa chữ. Mục 9.16 mới: ô Người chốt đổi theo mốc trên Desk (DOM 154-03, SEC 1I-03, luật #154), 7 khóa. Mục 9.17 mới: danh sách để sẵn cho v1.0.6 (SEC 145-01, UXD 145-04, 145-06, DOM 145-05), chưa đếm. `content-guide.md` v0.4.7: thêm 17 khóa 9.9, 9.15 đã có trên `main` (#145). Khóa 9.1, 9.16 chưa có trong `gen_strings.py`; FE-A thêm khi làm PR Desk. Cùng mục 0, 6, 8.
- Sửa: UXD · Round 5 – Phản hồi & sửa · 07/11/2026 · **Bản 2.6**: mục 9.18 mới, 2 khóa cho dòng "Đổi người chốt" ở Nhật ký tiền (DOM FB-R5-DOM-FE-155-04, FE-A2 PR #159): bản ghi cũ không có tên, và người chốt có tài khoản không còn trong danh sách. FE-A2 áp ở PR sau #159. Cùng mục 0, 6, 8, 9.17.
- Sửa: UXD · Round 5 – Review · 07/11/2026 · **Bản 2.7**: theo review FE #162 (`rounds/round-05/reviews/UXD-on-fe-pr-162.md`) và #164 (`UXD-on-fe-a2-pr-164.md`). Mục 9.16: sửa chữ `rsv.closer.readonly_manager` theo DOM 162-01 (thêm "hoặc chủ đầu tư"); thêm danh sách khóa dùng lại cho nút, câu báo đã lưu, lỗi tải danh sách, người chốt không còn hoạt động. Mục 9.18: lỗi tải danh sách hiện `common.error_generic_title` (DOM 159-01), thay chữ "như #159". Không thêm khóa, số khóa giữ 277. Cùng mục 6, 8.
- Phạm vi: V5-20, V5-21 (phần chữ), V5-22 (phần chữ), V5-23, V5-24 của `rounds/round-05/plan.md`.
- Căn cứ:
  - mã `main` @ `b9f017f7` (06/11). Số dòng ghi trong bảng là vị trí tại commit đó;
  - `product/docs/tham-so-quy-tac.md` / `.json` bản 1.1 (DOM);
  - `rounds/round-04/outputs/DOM/pricing-spec-2026-11-01-reconcile.md` (H10), `inv-price-switch-guide.md` (B1–B11);
  - các thẻ nguồn ghi ở cột "Nguồn".
- Thương hiệu: chữ Desk nội bộ viết tiếng Việt, có bản EN cho Desk tiếng Anh. Chữ cho khách (trang khách, phiếu, mẫu tin, báo giá) ngắn, lịch sự, điềm tĩnh, không emoji, không từ cấm. Bảng này không đổi màu, font hay khoảng cách. Riêng V5-24 có một yêu cầu font cho FE (mục 5.2).
- Không có số hoa hồng, không có dữ liệu khách trong tệp này.

## Quy ước

- **Nguồn chữ duy nhất** là `product/design/tools/gen_strings.py`. FE sửa ở đó, chạy lại công cụ để sinh `strings-{vi,en,ru}.json`, `strings.js`, `strings-tables.md`. Với `sale.quote_text` thì chạy thêm `services/api/scripts/gen-quote-copy.mjs`. CI "Copy is generated" phải xanh.
- **Kiểu đổi**:
  - **Sửa**: giữ khóa, đổi chữ.
  - **Mới**: thêm khóa.
  - **Xóa**: bỏ khóa sau khi FE bỏ chỗ dùng và sửa test.
  - **FE**: chữ giữ nguyên, chỉ đổi cách mã truyền biến hoặc lúc hiện câu.
- **Biến** `{x}` theo `interpolate` của `packages/i18n`. Thiếu biến thì chữ `{x}` hiện nguyên trên màn hình, nên mọi biến ghi trong bảng là **bắt buộc truyền**.
- **Số nhiều**: khóa có hậu tố `_one`, `_few`, `_many`, `_other` chọn bằng `pluralForm(locale, n)`, giống `sale.quote_nights_*`. VI và RU của Desk dùng chung một chữ. EN có hai dạng.
- **Gạch không ngắt**: trong EN, cụm số–chữ ("1‑month", "2‑step") dùng U+2011 (content-guide mục 2, v0.4.5).
- Cột RU chỉ có ở chuỗi cho khách. Desk chỉ có VI và EN.
- **Nguyên tắc của gói này**: chữ phải đúng với **mọi giá trị tham số đang cho phép**, không chỉ với mức đội đề xuất. Số nào lấy từ tham số thì đọc từ tham số. Không đọc được thì viết câu không có số. Lý do: production vẫn đang lệch sổ tay (từ điển mục "Tham số trên production lệch sổ tay": `los_discount` còn bậc, `long_stay_required_from_nights` < 30, `special_uplift_pct` > 0).

## 0. Tóm tắt số khóa

| Việc | Sửa | Mới | Xóa | Cộng | Ghi chú |
|---|---:|---:|---:|---:|---|
| V5-20 Bỏ chữ theo mức giá cũ | 12 | 5 | 5 | **22** | Thêm 3 chỗ chỉ đổi cách hiện (FE) |
| V5-21 Tham số trên Desk | 1 | 38 | 0 | **39** | Gồm 29 tên `params.k.*` |
| V5-22 Hộp Đặt phòng mới | 2 | 6 | 0 | **8** | |
| V5-23 Chữ sai sự thật | 48 | 19 | 2 | **69** | Gồm 25 khóa EN thêm U+2011. 3 khóa ở mục 4.19 là phát hiện thêm, PO quyết. Bản 1.1 thêm 6 khóa: `gw.req.clean_makeup_free` và `gw.req.clean_second_fee` (4.20 a, bắt buộc), `gw.lang_auto_sr` (4.6), 3 khóa ở 4.21 (nên có). Bản 1.2: 4.14 còn 3 khóa (2 sửa, 1 mới) thay cho 6 mới và 2 xóa; thêm `bill.line.late_fee_after_limit` (4.8) |
| V5-24 Tiếng Nga | 8 | 0 | 0 | **8** | Bản 1.1 thêm `gw.req.clean_long_fee`. `sale.quote_text`, `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` đổi thêm cột VI và/hoặc EN, vẫn đếm một lần ở đây. Kèm yêu cầu font (mục 5.2) |
| V5-5B Tiền về sau khi hủy (bản 1.4, 1.5, 2.5, mục 9.1) | 0 | 35 | 0 | **35** | Ngoài Gói 2. Đi cùng 5B-1. Bản 1.4: 13 khóa. Bản 1.5: thêm 13 (gồm `audit.reason.payment_after_cancel`, trước là khóa có điều kiện). Bản 2.5: thêm 9 theo #148; 6 khóa sửa chữ vẫn đếm "Mới" vì chưa có trong `gen_strings.py`. 3 khóa để sẵn cho 5B-2, chưa đếm |
| V5-48 Thu tiền trên đơn đã đóng (bản 1.5, mục 9.1a) | 0 | 3 | 0 | **3** | Ngoài Gói 2. Bắt buộc v1.0.5 (ARC 1.21 mục 2) |
| V5-25 Lưu tham số có cấu trúc (bản 1.4–1.6, mục 9.2, 9.4, 9.6) | 0 | 19 | 0 | **19** | Ngoài Gói 2. Đi cùng PR #96 (V5-25). Bản 1.4: 3 khóa `min_stay`. Bản 1.5: 5 khóa câu chung ở 9.4. Bản 1.6: 3 khóa `REQUIRED` ở 9.4, 8 khóa "tham số sai dạng" ở 9.6 (mã chờ ARC) |
| V5-16 Lễ tân sửa giảm dòng (bản 1.5, mục 9.5) | 0 | 7 | 0 | **7** | Ngoài Gói 2. Đi cùng US-177 (PR-B2). 2 khóa đóng ca để sẵn, chưa đếm |
| V5-1A Cảnh báo giá đêm khác thường (bản 1.5, mục 9.3) | 1 | 3 | 0 | **4** | Ngoài Gói 2. Đi cùng PR-C1 của BE (V5-1A) |
| V5-50, V5-15 Desk (bản 1.7, mục 9.7) | 2 | 5 | 0 | **7** | Ngoài Gói 2. Đi cùng #98 (V5-50), #102 và MOB #97 (V5-15). Gồm 3 khóa FE đã viết theo chữ UXD (UXD duyệt), 1 khóa đổi chữ (`hk.action.needs_cleaning`), 3 khóa mới. `error.INVALID_TRANSITION_generic_reloaded` đã đếm ở 4.12 |
| C0313-25 Mã giao dịch giống số thẻ (bản 1.8, mục 9.8) | 0 | 1 | 0 | **1** | Ngoài Gói 2. Đi cùng hàm của SEC 4.1 (BE-B, PR-B3; `executeRefund` lên sớm hơn theo SEC 4.4) |
| V5-15 Trả phòng quá ngày đi (bản 1.9, mục 9.9) | 0 | 1 | 0 | **1** | Ngoài Gói 2. Đi cùng hộp Trả phòng quá ngày đi của FE-A (BE PR #99, PR-A1b). Điều kiện SEC mục 2.5 |
| V5-40, V5-14, V5-15 app (bản 2.0, mục 9.10) | 3 | 2 | 1 | **6** | Ngoài Gói 2. 3 câu 2FA đi cùng #118 (bắt buộc). Xóa `booking.hold.typed_rate_locked` đi cùng #122. 2 câu app nhân viên đi cùng #97 hoặc v1.0.6 (nên có). Thêm 2 ghi chú khóa, không đếm |
| `mlog.a_money_not_found` (bản 2.1, mục 9.11) | 0 | 1 | 0 | **1** | Ngoài Gói 2. ARC thêm khóa ở #111 với câu tạm; UXD chốt chữ, đã áp trên `main`. EN `today.money_after_cancel_not_found` (9.1) đổi, không đổi số khóa |
| V5-13, V5-44 (bản 2.1, mục 9.12) | 4 | 10 | 1 | **15** | Ngoài Gói 2. 3 nhãn lý do hoàn mới (3 nhãn còn lại đã có), 2 khóa tổng chờ hoàn, 5 câu `lockReason`. Sửa 4, xóa `checkout.pending_refund_line` khi V5-13 lên |
| V5-11 Trả sớm trong 00:00–05:59 (bản 2.2, mục 9.13) | 0 | 4 | 0 | **4** | Ngoài Gói 2. Đi cùng FE-A V5-11 (cùng tag với #114). Đã áp trên `main`. Thêm ghi chú cho 4 khóa có sẵn, không đếm |
| V5-18, V5-13, V5-48 sau review FE-3 (bản 2.3, mục 9.14) | 1 | 2 | 0 | **3** | Ngoài Gói 2. `deposit.accept_shortfall_unverified` (FE-3 thêm ở #141, UXD chốt chữ) và `folio.open_refunds_may_decrease`: điều kiện gộp #141, #134. `error.closed_booking_payment_sales` (sửa): cùng PR sau #137, trước tag v1.0.5. FE-3 áp trong PR |
| V5-15 hộp Trả phòng quá ngày đi, Desk (bản 2.4, mục 9.15) | 0 | 16 | 0 | **16** | Ngoài Gói 2. Đi cùng #145. 10 khóa FE-A2 (UXD chốt), 2 khóa `checkout.overdue_need_*` (chốt ở `UXD-on-fe-prs-125-128.md` mục 3, nay đếm ở đây), 4 khóa mới. `checkout.overdue_told_guest` để sẵn cho v1.0.6, chưa đếm |
| Desk đổi người chốt theo mốc (bản 2.5, mục 9.16) | 0 | 7 | 0 | **7** | Ngoài Gói 2. Đi cùng PR Desk đổi người chốt (FE-A; DOM 154-03, SEC 1I-03). Dùng lại 5 khóa có sẵn. Mục 9.17 (v1.0.6) chưa đếm |
| Nhật ký tiền, dòng Đổi người chốt (bản 2.6, mục 9.18) | 0 | 2 | 0 | **2** | Ngoài Gói 2. Đi cùng PR FE-A2 sau #159 (DOM 155-04) |
| **Tổng** | **82** | **186** | **9** | **277** | Bản 1.0: 143. Bản 1.1: 150. Bản 1.2, 1.3: 146 (Gói 2). Bản 1.4: 162. Bản 1.6: 205. Bản 1.7: 212. Bản 1.8: 213. Bản 1.9: 214. Bản 2.0: 220. Bản 2.1: 236. Bản 2.2: 240. Bản 2.3: 243. Bản 2.4: 259. Bản 2.5: 275. Bản 2.6: 277 |

Mức theo PO (plan R5 mục 6, quyết định 15):
- **Bắt buộc:** mọi khóa, trừ các khóa dưới đây.
- **Nên có, làm cùng lượt C5:** 4.20 (b), 4.21, thẻ 06 và 08 ở 5.1. Không kịp thì chuyển US-125 (B-SAU). Không chặn QC.
- **Xếp sau:** 5.3 (kiểm tự động).
- 3 câu `sale.hold_next*` (4.14): bản 1.3 dùng nguyên chữ CPY (thẻ 12), không còn chờ.
- **v1.0.6:** 4.20 (c) và C6.
- **Mục 9 (bản 1.4, 1.5):** theo lịch của việc đi kèm, không theo Gói 2. 9.1 lên cùng V5-5B (5B-1; PO xếp v1.0.5 nếu kịp, không thì v1.0.6). 9.1a lên cùng V5-48 (bắt buộc v1.0.5). 9.2 và 9.4 lên cùng V5-25 (PR #96). 9.6 lên cùng chỗ chặn ở DOM 13.2 (mã ARC chốt; phần nào không kịp 0.3.13 thì theo 0.3.14). 9.3 lên cùng V5-1A (PR-C1). 9.5 lên cùng V5-16 (US-177, Must v1.0.5; 403 ở PR-B2, bộ lọc ở PR-B1).
- **Mục 9.7 (bản 1.7):** `hk.action.needs_cleaning` bắt buộc trước khi gộp #102 (điều kiện UXD), MOB #97 dùng cùng chữ. `checkin.room_status_stuck`, `_od` nên lên cùng #102 (cùng tag với nút). `room_change.no_rooms_not_ready` nên có, cùng #98 hoặc v1.0.6.
- **Mục 9.8 (bản 1.8):** bắt buộc, lên cùng bản sửa BE của C0313-25 (SEC 4.4: v1.0.5; `executeRefund` sớm nhất, không chờ hết PR-B3). Thiếu câu này thì ô mã hiện câu của ô ghi chú ("Ô ghi chú có dãy số…", "Xóa dãy số đó").
- **Mục 9.9 (bản 1.9):** bắt buộc, lên cùng hộp Trả phòng quá ngày đi (V5-15). SEC chấp nhận rủi ro Low của `overdueReason` cho v1.0.5 với điều kiện có câu này, và sẽ xem ở PR FE.
- **Mục 9.10 (bản 2.0):** 3 câu `mfa.*` bắt buộc, điều kiện gộp #118 (FB-R5-UXD-FE-PR118-01). Xóa `booking.hold.typed_rate_locked` và ghi chú `bk.src_typed` cùng #122 (PR122-04, Minor). `hk.queue.r.time_report`, `hk.needs_cleaning_help` nên có, cùng #97 hoặc v1.0.6 (PR97-02, PR97-03). Ghi chú `staff.notif.k.hold_expired` áp ở lượt sinh lại khi gộp `main` vào #97.
- **Mục 9.11 (bản 2.1):** `mlog.a_money_not_found` đã áp trên `main`. EN nút `today.money_after_cancel_not_found` áp khi FE thêm khóa (5B-1). Chọn câu theo `after.kind`: nên có.
- **Mục 9.12 (bản 2.1):** nhãn lý do hoàn và 3 khóa tổng chờ hoàn bắt buộc, lên cùng V5-13. `lockReason`: bắt buộc cùng V5-44 phần chọn câu theo trường (không dò `detail`) và 2 câu `settled`, vì câu chung "kể cả quản lý" nói sai ở ca này. 3 câu mới còn lại và 3 câu sửa nên có cùng V5-44, không kịp thì v1.0.6, không chặn QC.
- **Mục 9.13 (bản 2.2):** `err.min_date`, `use_min_date`, `use_checkout` và chỗ sửa `canCheckOut` bắt buộc, lên cùng FE-A V5-11 (cùng tag với #114, DOM review #114 mục 4). Thiếu thì lễ tân ca đêm chỉ thấy câu chung `INVALID_TRANSITION`. `fee_business_date` nên có cùng lượt, không kịp thì v1.0.6, không chặn QC. FE trễ cả làn thì release notes ghi dòng (b) của DOM.
- **Mục 9.14 (bản 2.3):** bắt buộc. (a) là điều kiện gộp #141 (FB-R5-UXD-FE-141-01), (b) là điều kiện gộp #134 (FB-R5-UXD-FE-134-01). (c) lên cùng PR sau #137 (FB-R5-UXD-FE-137-01), trước tag v1.0.5. Phần (b) chỉ hiện câu theo `awaitingDecision` chờ hợp đồng 0.3.14, không chặn QC.
- **Mục 9.15 (bản 2.4):** bảng A bắt buộc, điều kiện gộp #145 (FB-R5-UXD-FE-145-01, gồm DOM 145-01). `checkout.overdue_time_early` (DOM 145-02) vào #145 theo ARC 3.4; không kịp thì #145 vẫn gộp được và release notes v1.0.5 ghi dòng ARC 3.3. Bảng B: `checkout.overdue_extend_hint` nên có cùng lượt (FB-R5-UXD-FE-145-02), không kịp thì v1.0.6 và sổ tay BA; `checkout.overdue_reason_evidence` tùy FE-A2, không thì v1.0.6. `checkout.overdue_told_guest`: v1.0.6. Không chặn QC ngoài bảng A.
- **Mục 9.1 (bản 2.5):** chữ bản 2.5 bắt buộc trước khi nút "Ghi tiền về sau khi hủy" lên Desk (DOM 148-01 Major). Chữ bản 1.4, 1.5 không được dùng nữa: lễ tân làm theo sẽ thu phí hủy trên đơn mới và hứa "hoàn đủ" với khách. `error.DUPLICATE_BANK_REFERENCE_no_code` (148-06) lên cùng ô `bankReference` đầu tiên mà sale, CTV dùng được. `error.refund_no_transfer_left` (148-07) lên khi BE trả dấu hiệu riêng; chưa có thì v1.0.6, không chặn QC. `today.money_after_cancel_not_found_note` (148-08): nên có cùng 5B-1.
- **Mục 9.16 (bản 2.5):** theo lịch PR Desk đổi người chốt (FE-A). Khi PR lên thì cả 7 khóa bắt buộc: dòng help là điều kiện SEC 1I-03, hai dòng chỉ đọc là điều kiện DOM 154-03.
- **Mục 9.17:** v1.0.6, chưa đếm.
- **Mục 9.18 (bản 2.6):** nên có, cùng tag với #159 nếu kịp. Không kịp thì v1.0.6: dòng vẫn đúng nghĩa với "—" và `mlog.who_unlisted` (#159), chỉ khó đọc hơn. Không chặn QC.

Kết quả CPY duyệt: mục 7. Yêu cầu cho FE, BE: mục 6.

---

## 1. V5-20 – Bỏ chữ theo mức giá cũ

Nguồn chung: H10 (`pricing-spec-2026-11-01-reconcile.md`), FB-R4-UXD-FE-PR82-02, FB-R4-ARC-FE-PR82-02, UXD-on-v104-pr72-manual lượt 2, FB-R4-UXD-BA-PR85-02.

### 1.1 Ngưỡng thuê dài hạn ("Từ 28 đêm…")

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `field.LONG_STAY_REQUIRES_CONTRACT` | Sửa | Từ 28 đêm là thuê dài hạn – tạo đơn dài hạn nhập tay. | Từ {n} đêm là thuê dài hạn – tạo đơn dài hạn nhập tay. | {n} nights or more is a long stay – create a manual long-stay booking. | Số 28 viết cứng. `{n}` = `rules.longStayFromNights` (tham số `long_stay_required_from_nights`) |
| `bk.long_body` | Sửa | Từ 28 đêm phải làm hợp đồng (BR-108). Ở giai đoạn này, tạo "Đơn dài hạn nhập tay" để giữ phòng; hợp đồng vẫn làm ngoài hệ thống. | Từ {n} đêm phải làm hợp đồng (BR-108). Tạo "Đơn dài hạn nhập tay" để giữ phòng; hợp đồng làm ngoài Desk. | From {n} nights a lease is required (BR-108). Create a "Manual long-stay booking" to hold the room; the lease is handled outside the Desk. | Số 28 viết cứng; bỏ "Ở giai đoạn này" (chữ nội bộ của đội). `{n}` như trên |
| `stay.long_hint` | Sửa | Khách muốn ở thêm hơn 7 đêm hoặc tổng từ 28 đêm: lập báo giá dài hạn (R3). Ở R2 tạo "đơn dài hạn nhập tay". | Khách muốn ở thêm quá số đêm gia hạn tối đa, hoặc tổng số đêm tới mức phải thuê dài hạn: tạo "Đơn dài hạn nhập tay". | The guest wants more than the maximum extension, or the total reaches the long-stay threshold: create a "Manual long-stay booking". | Hết số 7 và 28 viết cứng, hết "R2", "R3" (cũng là BUG-R3-028 a). Câu không có số, vì cờ `exceedsShortStayLimit` bật theo 2 tham số (`extension_max_nights`, `long_stay_required_from_nights`; `stay.service.ts:219`) |

FE:
- QuoteDialog, khi lỗi `LONG_STAY_REQUIRES_CONTRACT` (dòng 393 và 584, `rsvErrorText`): truyền `n = rules.longStayFromNights`. Hiện mã truyền `n = ''`, nên câu mới sẽ ra "Từ  đêm".
- BookingDialog dòng 726 đã truyền đúng.
- `app/rules.ts`, `RULE_DEFAULTS` còn mức cũ (`longStayFromNights: 28`, `longStayCompareFromNights: 15`). Đổi theo mức đội đề xuất (30, 30). Hai số này chỉ dùng khi chưa tải được tham số, nhưng hiện chúng sẽ lọt vào câu.

### 1.2 "Trước giảm theo số đêm"

Trên production, đơn có thể **không** có mức giảm nào (bảng giá 01/11: `los_discount = []`). Cũng có thể có mức giảm theo số đêm (`los_discount` đang lệch) **hoặc** mức giảm của mã khách quay lại (BR-111, `return_guest_pct`). FolioDialog dòng 329 đặt `stepped = calendarRateVnd !== amountVnd`, nên chênh lệch có thể đến từ một trong hai mức giảm. Vì vậy:
- tiêu đề cột và chữ luôn hiện không nói "trước giảm";
- câu chỉ hiện khi có chênh thì nói "giảm giá của đơn", không gắn với số đêm.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `rate.pre_tier` | Sửa | Giá lịch/đêm (trước giảm theo số đêm) | Giá đêm | Night rate | Tiêu đề cột bảng giá ở Đặt phòng mới (BookingDialog 1377, nhãn ô 1391). Cột này luôn hiện |
| `rate.pre_tier_short` | FE | giá lịch, trước giảm theo số đêm | (giữ) | (giữ) | Chỉ còn dùng ở BookingDialog 1502, nơi đã có điều kiện `losShown > 0` |
| `rate.calendar_short` | Mới | – | giá lịch | calendar rate | Thay `rate.pre_tier_short` ở 2 chỗ luôn hiện: CheckOutPage 1207 và StayDialogs 150 |
| `rate.prior_night_tier` | Sửa | Đây là giá lịch, trước giảm theo số đêm. Số cần thu ở mục Thu tiền do hệ thống tính, đã gồm giảm nếu có. | Đây là giá lịch của đêm. Số cần thu ở mục Thu tiền do hệ thống tính, đã trừ giảm giá nếu đơn có. | This is the night's calendar rate. The amount due under Payment is worked out by the system, less any discount on the booking. | Bỏ ý "giảm theo số đêm" (CheckInPage 842) |
| `checkout.extra_night_rate_help_tier` | Sửa | Giá lịch của đêm, trước giảm theo số đêm. Mặc định là giá gợi ý của hệ thống cho đêm này. Số cần thu do hệ thống tính, đã gồm giảm nếu có. | Giá lịch của đêm. Mặc định là giá gợi ý của hệ thống cho đêm này. Số cần thu do hệ thống tính, đã trừ giảm giá nếu đơn có. | The night's calendar rate. Defaults to the system's suggested rate for this night. The amount due is worked out by the system, less any discount on the booking. | Như trên (CheckOutPage 1562, 1569) |
| `folio.adjust_night_price` | Sửa | Giá đêm mới (trước giảm theo số đêm) | Giá đêm mới | New night rate | Nhãn ô ở hộp Sửa giá đêm (FolioDialog 493) |
| `folio.adjust_night_help` | Sửa | Giá lịch của đêm; giảm theo số đêm (BR-107) áp trên giá này. Ngoài sàn–trần của nhóm căn thì không lưu được – thấp hơn sàn thì xin giảm giá đặc biệt. | Giá lịch của đêm. Nếu đơn đang được giảm giá, mức giảm áp trên giá này. Ngoài sàn–trần của nhóm căn thì không lưu được; thấp hơn sàn thì xin giảm giá đặc biệt. | The night's calendar rate. If the booking has a discount, it applies on top of this rate. Outside the room group's floor–ceiling it can't be saved; below the floor, request a special discount. | Đúng cả khi không có giảm, khi giảm theo số đêm và khi giảm theo mã khách quay lại |
| `rate.night_now` | Sửa | Đêm này hiện tính {amount} sau giảm theo số đêm (giá lịch {calendar}). | Đêm này hiện tính {amount}, đã trừ giảm giá của đơn (giá lịch {calendar}). | This night is now {amount} after the booking's discount (calendar rate {calendar}). | Hiện khi `stepped`. Chênh có thể do mã khách quay lại |
| `rate.adjust_night_effect` | Sửa | Ghi bút toán đảo {old} và dòng mới theo giá lịch {new} – giảm theo số đêm áp lại khi lưu. Dòng cũ vẫn còn trong nhật ký (BR-008). | Ghi bút toán đảo {old} và dòng mới theo giá lịch {new}; giảm giá của đơn (nếu có) áp lại khi lưu. Dòng cũ vẫn còn trong nhật ký (BR-008). | Posts a reversal of {old} and a new line at the calendar rate {new}; any discount on the booking is applied again on save. The old line stays in the log (BR-008). | Như trên (FolioDialog 532) |
| `sale.los_applied` | Sửa | Đã giảm {pct}% vì ở từ 7 đêm (BR-107) | Đã giảm {pct}% theo số đêm ở (BR-107) | {pct}% length-of-stay discount applied (BR-107) | Số 7 viết cứng. Ngưỡng nằm trong `los_discount` và có thể có nhiều bậc. Khóa đã có điều kiện `losDiscountPct > 0` (BookingDialog 1510, QuoteDialog 617) |

Giữ nguyên, đã kiểm: `move.discount_los` (MovePreviewBox 146) và `extend.los_reprice` (StayDialogs 181). Cả hai có điều kiện `pct > 0` và không có số viết cứng.

### 1.3 Nguồn giá "+15 %"

| Khóa | Kiểu | Chữ cũ | Chữ mới | Lý do |
|---|---|---|---|---|
| `bk.src_weekend` | Xóa | Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104) | – | App không dùng khóa này. Chỉ còn ở `hifi/09-booking.html` và test `v104-rate-source-typed.test.tsx`. Ô trong hi-fi đổi sang `bk.src_list`. Nếu sau này bật lại mức tăng, UXD cấp khóa có biến: "Lịch giá: cuối tuần +{pct}% (BR-104)", không viết số vào chữ |

### 1.4 Báo giá không tách đêm thứ Sáu, thứ Bảy (việc `sale.nights_all` trong plan)

Hiện tại, QuoteDialog 342–354 chia các đêm theo `weekend(date)` (thứ Sáu, thứ Bảy cố định ở client, không đọc `weekend_nights`), rồi lấy `rate` của **đêm đầu** mỗi nhóm. Hai nhóm "đêm thường" và "đêm thứ Sáu, thứ Bảy" có cùng giá khi mức tăng bằng 0. Còn khi một nhóm có ngày đặc biệt, "{n} đêm × {rate}" không bằng cột tổng.

Thiết kế mới: gom các đêm **theo số tiền** (`amountVnd`), không theo thứ trong tuần. Mỗi dòng là "{n} đêm × {giá}", cột phải là tổng của nhóm. Các nhóm xếp theo ngày đầu tiên của nhóm. Như vậy, với mọi giá trị của `weekend_uplift_pct`, `special_uplift_pct`, `weekend_nights`, ta luôn có n × giá = tổng.

| Khóa | Kiểu | VI | EN (`_one`) | EN (`_few`, `_many`, `_other`) |
|---|---|---|---|---|
| `sale.nights_at_rate_one` / `_few` / `_many` / `_other` | Mới (4) | {n} đêm × {rate} | {n} night × {rate} | {n} nights × {rate} |
| `sale.nights_weekday` | Xóa | {n} đêm thường × {rate} | – | – |
| `sale.nights_weekend` | Xóa | {n} đêm thứ Sáu, thứ Bảy × {rate} | – | – |

`{rate}` định dạng như hiện tại (`vnd()`).

### 1.5 Giờ trả phòng và câu cũ không còn dùng

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `stay.after_noon_hint` | Sửa | Giờ sau 12:00 là trả muộn – dùng nút Trả muộn để tính phụ thu. | Giờ sau {time} là trả muộn – dùng nút Trả muộn để tính phụ thu. | Times after {time} are late check-outs – use Late check-out to calculate the fee. | Mã đã so với `rules.checkoutTime` (StayDialogs 828), nhưng chữ viết cứng 12:00. `{time}` = `rules.checkoutTime` |
| `extend.keep_rate_help` | Xóa | Đơn đang có giá thỏa thuận khác lịch giá… ngày đặc biệt theo giá ngày đó. | – | – | Không mã nào dùng |
| `co.late_switch_hint` | Xóa | Khách trả sau 12:00 mà chưa hẹn… | – | – | Không mã nào dùng; đã có `co.late_switch_hint_time` thay |

Giữ: `late.std_zero` ("Trả trước 12:00 – không phụ thu"). App không dùng khóa này, chỉ prototype `hifi.js` dùng. Ghi chú trong `gen_strings.py`: "chỉ prototype, không dùng ở app".

### 1.6 Đổi số người thì bảng tổng tính lại (FB-R4-ARC-FE-PR82-02)

Không có khóa mới. FE:
- thêm số người lớn và số trẻ vào khóa bản xem (`totalsKey` / `liveKey`), để đổi số người cũng gọi lại bản xem;
- trong lúc chờ, các ô tiền của bảng tổng hiện "–", bảng có `aria-busy="true"`. Đây cũng là phần còn lại của FB-R4-UXD-FE-PR70-02 (mục 3);
- nút Tạo đơn **không** khóa riêng vì đổi số người. Nút đã chờ theo bản xem như hiện tại, và tiền do máy chủ tính.

---

## 2. V5-21 – Tham số trên Desk (phần chữ)

Nguồn: H10 (`params.k.*`), backlog 5.6b, plan mục 6 (`ota_base_rate` thu gọn), từ điển tham số bản 1.1, `paramCatalog.ts`, `ParamDialog.tsx`, `app/problem.ts`, `parameter-rules.ts`, `parameter.service.ts`.

### 2.1 Tên tiếng Việt cho khóa còn hiện mã

`paramLabel()` tìm `params.k.<khóa, dấu chấm đổi thành _>`. Chỉ cần thêm khóa chữ là tên hiện ngay, mã khóa vẫn hiện nhỏ bên dưới. Tên lấy từ trường "Ý nghĩa" của từ điển, rút gọn cho cột Tham số. Đơn vị đứng sau giá trị, nên không lặp trong tên, trừ chỗ cần nói rõ "% của giá nào".

FE: thêm các khóa dưới đây vào `KNOWN` của `paramCatalog.ts` với **nhóm `other`** (giữ nhóm "Khác" như hiện tại, để từ điển và sổ tay vẫn đúng câu "tab Khác") và đơn vị ở cột "Đơn vị Desk". Đơn vị `nights` là đơn vị mới (mục 2.2).

| Khóa tham số | Khóa chữ (Mới) | VI | EN | Đơn vị Desk | Ưu tiên |
|---|---|---|---|---|---|
| `weekend_uplift_pct` | `params.k.weekend_uplift_pct` | Tăng giá đêm cuối tuần | Weekend night uplift | pct | B1 |
| `weekend_nights` | `params.k.weekend_nights` | Đêm tính là cuối tuần | Nights counted as weekend | none | đi kèm B1 |
| `weekend_uplift_channels` | `params.k.weekend_uplift_channels` | Kênh áp tăng giá cuối tuần | Channels with weekend uplift | none | đi kèm B1 |
| `special_uplift_pct` | `params.k.special_uplift_pct` | Tăng giá ngày đặc biệt | Special-date uplift | pct | B2 |
| `special_dates` | `params.k.special_dates` | Danh sách ngày đặc biệt | Special dates | none | đi kèm B2 |
| `special_uplift_channels` | `params.k.special_uplift_channels` | Kênh áp tăng giá ngày đặc biệt | Channels with special-date uplift | none | đi kèm B2 |
| `los_discount` | `params.k.los_discount` | Giảm giá theo số đêm ở | Length-of-stay discount | none | B3 |
| `long_stay_required_from_nights` | `params.k.long_stay_required_from_nights` | Bắt buộc thuê dài hạn từ | Long-stay lease required from | nights | B4 |
| `short_stay_max_nights` | `params.k.short_stay_max_nights` | Đơn ngắn ngày dài nhất | Longest short stay | nights | B5 |
| `ota_base_rate` | `params.k.ota_base_rate` | Giá gốc riêng cho đơn OTA | Separate OTA base rate | none | B6 (mục 2.4) |
| `early_checkin_tiers` | `params.k.early_checkin_tiers` | Bậc phụ thu nhận phòng sớm | Early check-in fee tiers | none | B7 |
| `long_stay_compare_from_nights` | `params.k.long_stay_compare_from_nights` | Hiện so sánh thuê 1 tháng từ | Show 1‑month comparison from | nights | B9 |
| `rounding.monthly_rent` | `params.k.rounding_monthly_rent` | Làm tròn tiền thuê tháng | Monthly rent rounding | vnd | B11 |
| `rounding.night_rate` | `params.k.rounding_night_rate` | Làm tròn giá đêm | Night rate rounding | vnd | rounding.* |
| `rounding.deposit` | `params.k.rounding_deposit` | Làm tròn tiền cọc | Deposit rounding | vnd | rounding.* |
| `rounding.fee` | `params.k.rounding_fee` | Làm tròn phí, phụ thu | Fee rounding | vnd | rounding.* |
| `rounding.ota_rate` | `params.k.rounding_ota_rate` | Làm tròn giá đêm đơn OTA | OTA night rate rounding | vnd | rounding.* (lệch mới, từ điển mục B) |
| `late_checkout_tiers` | `params.k.late_checkout_tiers` | Bậc phụ thu trả phòng muộn | Late check-out fee tiers | none | bảng giá |
| `rate_floor_pct` | `params.k.rate_floor_pct` | Giá sàn (% giá gốc) | Rate floor (% of base rate) | pct | bảng giá |
| `rate_ceiling_pct` | `params.k.rate_ceiling_pct` | Giá trần (% giá gốc) | Rate ceiling (% of base rate) | pct | bảng giá |
| `min_stay` | `params.k.min_stay` | Ở tối thiểu | Minimum stay | none | bảng giá |
| `min_stay_orphan_night_exception` | `params.k.min_stay_orphan_night_exception` | Cho bán đêm lẻ kẹp giữa hai đơn | Allow single gap nights between bookings | none | bảng giá |
| `booking_window_days` | `params.k.booking_window_days` | Nhận đặt trước tối đa | Booking window | days | bảng giá |
| `return_guest_code` | `params.k.return_guest_code` | Mã khách quay lại | Returning-guest code | none | bảng giá |
| `return_guest_pct` | `params.k.return_guest_pct` | Giảm cho khách quay lại | Returning-guest discount | pct | bảng giá |
| `stackable` | `params.k.stackable` | Cộng dồn mã khách quay lại với giảm theo số đêm | Combine returning-guest code with length-of-stay discount | none | bảng giá |
| `prices_include_vat` | `params.k.prices_include_vat` | Giá niêm yết đã gồm VAT | Listed prices include VAT | none | bảng giá |
| `public_show_prices` | `params.k.public_show_prices` | Hiện giá ước tính trên web | Show estimated prices on the website | none | bảng giá |
| `web_estimate.open_until` | `params.k.web_estimate_open_until` | Web hiện giá cho đêm trước ngày | Website shows prices for nights before | none | bảng giá |

Đã có tên, không đổi: B8 `child_fee_6_11` (`params.extra_child`), B10 `short_stay_commission_pct`, `extra_adult_fee`, `child_free_under_age`, `adult_from_age`, `short_stay_deposit_pct`, `late_grace_until`, `vat_rate`.

Ghi chú về tên:
- `weekend_uplift_pct` đổi so với tên UXD đề xuất ở lượt 2 PR72 ("Tăng giá đêm thứ Sáu, thứ Bảy"). Lý do: những đêm nào là cuối tuần do `weekend_nights` quyết, nên tên có "thứ Sáu, thứ Bảy" sẽ sai khi tham số đó đổi. BA cập nhật sổ tay theo tên mới (V5-71).
- `rate_floor_pct` / `rate_ceiling_pct`: giữ "(% giá gốc)" trong tên, vì Desk chỉ hiện "70%" ở cột Giá trị, không nói % của giá nào.
- Sau khi FE áp, DOM thay "(chưa có tên tiếng Việt)" trong từ điển bằng tên ở bảng này.

### 2.2 Đơn vị mới

| Khóa | Kiểu | VI | EN | Dùng |
|---|---|---|---|---|
| `params.unit_nights` | Mới | đêm | nights | `ParamUnit` thêm `'nights'`, `UNIT_KEY.nights`. Cột Giá trị ra "30 đêm" |

### 2.3 Câu lỗi khi lưu tham số

Hiện tại `problemView` chỉ có 2 nhánh:
- có `allowed` thì dùng `error.PARAM_OUT_OF_RANGE` ("nằm ngoài **khoảng** cho phép. Chọn một trong: …");
- không có `allowed` thì dùng `error.PARAM_OUT_OF_RANGE_MINMAX` ("Giá trị phải từ {min} đến {max}.").

Máy chủ trả 422 `PARAM_OUT_OF_RANGE` với 6 dạng `extras`: `{allowed}` (tập số, như `rounding.*`, `vat_rate`; hoặc tập chữ, như `privacy_notice_version`), `{min, max}`, chỉ `{max}`, chỉ `{min}`, `{}` (sai cấu trúc, như `hold_hours_options` thiếu mức mặc định hay danh mục FOC sai dạng), và `{allowed, min, max}` (chỉ `ota_base_rate`). Vì vậy:
- với giá trị chữ hoặc tập giá trị, "khoảng" là sai;
- với 3 dạng sau, lễ tân thấy nguyên chữ `{min}` hoặc `{max}`.

Ngoài ra, ParamDialog (dòng 128, 137) báo `field_error.not_in_list` ("Chọn một giá trị trong danh sách.") khi gõ số sai dạng hoặc JSON sai, trong khi ô này không có danh sách nào. Giá trị chữ (ví dụ `deposit_base`) nằm trong ô JSON. Nếu bỏ dấu ngoặc kép, người sửa sẽ gặp đúng câu sai này. Ô giờ gõ sai dạng thì báo `common.required`.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Khi nào |
|---|---|---|---|---|---|
| `error.PARAM_OUT_OF_RANGE` | Sửa | Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: {allowed}. | Giá trị này không có trong danh sách cho phép. Chọn một trong: {allowed}. | This value isn't one of the allowed values. Choose one of: {allowed}. | Chỉ có `allowed` (tập số hoặc tập chữ) |
| `error.PARAM_OUT_OF_RANGE_MINMAX` | (giữ) | Giá trị phải từ {min} đến {max}. | (giữ) | (giữ) | Có cả `min` và `max` |
| `error.PARAM_OUT_OF_RANGE_MAX` | Mới | – | Giá trị này vượt mức cho phép ({max}). | This value is above the allowed limit ({max}). | Chỉ có `max`. Cặp giờ, sàn ≤ trần, FOC mỗi lần ≤ mỗi tháng, `session_policy` |
| `error.PARAM_OUT_OF_RANGE_MIN` | Mới | – | Giá trị này dưới mức cho phép ({min}). | This value is below the allowed limit ({min}). | Chỉ có `min` |
| `error.PARAM_OUT_OF_RANGE_SHAPE` | Mới | – | Giá trị này chưa đúng dạng, hoặc chưa khớp với tham số đi kèm. | This value isn't in the right format, or doesn't fit a related setting. | `extras` rỗng |
| `error.PARAM_OUT_OF_RANGE_GROUPS` | Mới | – | Cần đủ các nhóm căn ({allowed}), mỗi nhóm một giá đêm từ {min} đến {max}. | Enter every room group ({allowed}), each with a night rate from {min} to {max}. | Có `allowed` cùng `min`/`max` (`ota_base_rate`) |
| `params.err_number` | Mới | (dùng `field_error.not_in_list`) | Nhập số, không kèm chữ hay đơn vị. | Enter a number, without letters or units. | ParamDialog 128, ô số gõ sai dạng |
| `params.err_json` | Mới | (dùng `field_error.not_in_list`) | Chưa đúng dạng JSON. Chữ phải nằm trong dấu ngoặc kép, ví dụ "all"; giữ đủ dấu ngoặc của danh sách. | This isn't valid JSON. Put text in double quotes, for example "all", and keep every bracket of the list. | ParamDialog 137, `JSON.parse` lỗi |
| `params.err_time` | Mới | (dùng `common.required`) | Nhập giờ dạng hh:mm, ví dụ 14:00. | Enter a time as hh:mm, for example 14:00. | ParamDialog, ô giờ có chữ nhưng sai dạng. Ô trống vẫn báo `common.required` |

FE (`app/problem.ts`, nhánh `PARAM_OUT_OF_RANGE`), chọn câu theo thứ tự:
1. có `allowed` và (`min` hoặc `max`): `_GROUPS`;
2. chỉ có `allowed`: `error.PARAM_OUT_OF_RANGE`;
3. có `min` và `max`: `_MINMAX`;
4. chỉ có `max`: `_MAX`;
5. chỉ có `min`: `_MIN`;
6. không có gì: `_SHAPE`.

Cách định dạng:
- số theo `vi-VN` (1.000, 100.000);
- tham số đơn vị `vnd` dùng `money()` (có "đ");
- giờ và chữ giữ nguyên;
- `allowed` nối bằng ", " như `argsFor` hiện tại.

`field_error.not_in_list` giữ cho các chỗ đúng nghĩa. GuestFormDialog 232 cũng dùng câu này cho ngày sinh: ngoài phạm vi gói này, ghi để FE xem.

### 2.4 `ota_base_rate`: tên và câu "Không cần nhập"

Không làm trình nhập theo nhóm căn (quyết định PO, plan mục 6). Chỉ thêm tên (mục 2.1) và một câu ghi chú.

| Khóa | Kiểu | VI | EN | Chỗ hiện |
|---|---|---|---|---|
| `params.ota_base_rate_note` | Mới | Không cần nhập – không có giá trị thì đơn OTA lấy giá đêm niêm yết của căn. Đã có giá trị thì giá trị này được dùng thay giá niêm yết, nên mỗi lần đổi giá căn phải sửa cùng lúc. | No need to enter this – without a value, OTA bookings use the room's listed night rate. If a value exists, it is used instead of the listed rate, so update it whenever room prices change. | ParamsPage: dòng chữ phụ dưới tên (cùng kiểu `muted` với mã khóa). ParamDialog: `Alert tone="info" role="note"` trên ô giá trị, chỉ khi `key === 'ota_base_rate'` |

Câu có 2 vế vì `pricing.service.ts` dùng `groupBase ?? listPriceOn`: có dòng giá trị thì dòng đó **thắng** giá niêm yết. Từ điển ghi cùng ý ("Có dòng thì mỗi lần đổi giá căn phải đổi dòng này cùng lúc"). Câu ngắn "Không cần nhập – đơn OTA lấy giá đêm niêm yết" trong plan chỉ đúng khi chưa có dòng, nên UXD thêm vế sau.

---

## 3. V5-22 – Hộp Đặt phòng mới (phần chữ)

Nguồn: BUG-R4-040, FB-R4-UXD-FE-PR70-02/03/04/06 (`rounds/round-04/reviews/UXD-on-v104-pr70-rate-carryover.md`). Chữ VI/EN đã soạn trong các thẻ đó, ở đây chép lại làm bảng áp. `bk.src_typed` ("Giá đã gõ") đã có từ #82.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Chỗ dùng |
|---|---|---|---|---|---|
| `bk.rate_help_ota` | Mới | – | Gõ giá từng đêm theo extranet. Để trống mọi đêm thì Desk tính theo lịch giá OTA của kênh. | Enter each night's rate from the extranet. Leave every night empty to use the channel's OTA calendar rate. | `.help` dưới bảng giá, chỉ khi kênh OTA (PR70-03) |
| `bk.src_ota_calendar` | Mới | – | Lịch giá OTA | OTA calendar | Cột Nguồn giá, đêm OTA chưa gõ; và ô số của hộp "Đổi sang căn …" khi chưa gõ (PR70-04) |
| `booking.error.rate_partial_ota` | Mới | (dùng `booking.error.rate_empty`) | Gõ giá cho mọi đêm, hoặc để trống hết để lấy giá theo lịch OTA. | Enter a rate for every night, or leave them all empty to use the OTA calendar rate. | `errors.rates`, OTA gõ thiếu đêm |
| `booking.error.rate_missing` | Mới | (dùng `booking.error.rate_empty`) | Gõ giá cho các đêm còn trống. | Enter a rate for the empty nights. | `errors.rates`, Trực tiếp/CTV còn đêm trống |
| `bk.use_room_ota_calendar` | Mới | (hiện "0 đ") | Chưa gõ giá: Desk tính theo lịch giá OTA của kênh khi tạo đơn. | No rates entered: the booking uses the channel's OTA calendar rate. | Thay dòng "Tổng tiền đơn" ở hộp "Đổi sang căn …" khi đơn OTA chưa gõ giá. Không bao giờ hiện "0 đ" ở ca này (PR70-04) |
| `booking.error.rate_range` | Sửa | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Giá phải từ {min} đến {max} (sàn–trần của nhóm căn). | Rate must be between {min} and {max} (the room group's floor–ceiling). | BookingDialog 717–722. Bỏ `{group}`, vì mã truyền `group: ''` nên câu bị cụt |
| `error.RATE_OUT_OF_RANGE` | Sửa | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Giá phải từ {min} đến {max} (sàn–trần của nhóm căn). | Rate must be between {min} and {max} (the room group's floor–ceiling). | Lỗi cấp Problem khi tạo đơn (`reservations.service.ts` 739–743). Bỏ `{group}` (PR70-06 = BUG-R4-040) |
| `booking.error.rate_out_of_range_dates` | Mới | – | Giá đêm {dates} nằm ngoài khoảng sàn–trần của nhóm căn. Sửa lại giá đêm đó. | The rate for {dates} is outside the room group's floor–ceiling range. Change that night's rate. | Dự phòng khi Problem không có `min`/`max`. `{dates}` dạng dd/mm, nối ", " |

FE, BE:
- BE gửi `min`, `max` (sàn và trần của đêm đầu tiên bị lỗi) theo hợp đồng ARC 0.3.13, kèm `dates` như hiện tại.
- FE định dạng `{min}` và `{max}` bằng `money()`.
- Thiếu `min` hoặc `max` thì FE dùng `booking.error.rate_out_of_range_dates`, không bao giờ để lộ `{min}`.
- Câu lỗi dưới bảng giá (`errors.rates`) gắn `role="alert"` (ghi chú ở lần review lại PR70 @ 94a28258). Khi có `errors.rates`, gắn `aria-invalid` cho từng ô trống.
- PR70-02, phần còn lại: khi `priceWaiting`, cột Nguồn giá và các ô tiền ở bảng tổng hiện "–", có `aria-busy`. Gộp với mục 1.6 (số người).

---

## 4. V5-23 – Một lượt sửa chữ sai sự thật

### 4.1 Phí trả sớm báo trong ngày rời (FB-R4-DOM-UXD-PR89-02)

Dòng phiếu này là chữ khách cầm, nên CPY duyệt (mục 7).

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `bill.line.early_departure_fee_same_day` | Mới | (ra "báo trước 0 ngày") | Phí trả phòng sớm (báo trong ngày rời) | Early departure fee (same-day notice) |
| `bill.line.early_departure_fee_notice_one` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} day's notice) |
| `bill.line.early_departure_fee_notice_other` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} days' notice) |

Bản 1.1 (FB-R5-CPY-UXD-V105-03): ở cả VI và EN của `_notice_one` và `_notice_other`, khoảng trắng ngay sau `{noticeDays}` là **U+00A0** (khoảng trắng không ngắt). Hai dòng trên đã dùng U+00A0 ở đúng chỗ đó. Trong `gen_strings.py`, gõ thẳng ký tự này như 3 chỗ U+00A0 đã có, không gõ 6 ký tự `\u00A0`. Test so chữ lấy bằng `tv(key)`.
| `bill.line.early_departure_fee_notice` | Xóa | Phí trả phòng sớm (báo trước {noticeDays} ngày) / ({noticeDays} days' notice) | – | – |

FE (`app/folio.ts`, `VARIANT` và `lineLabel`) chọn khóa như sau:
- `noticeDays` là `null` hoặc rỗng: khóa gốc `bill.line.early_departure_fee` (giữ như hiện tại, kể cả đơn OTA);
- `noticeDays === 0`: `_same_day`;
- `noticeDays > 0`: `_notice_` + `pluralForm`.

### 4.2 BUG-R2-094 – Ô tìm người đi cùng mang nhãn "Khách đứng tên"

| Khóa | Kiểu | VI | EN | Chỗ dùng |
|---|---|---|---|---|
| `stay.companion_field` | Mới | Người đi cùng | Companion | StayDialogs 1373, thay `booking.field.guest` ở hộp Thêm người đi cùng. Cũng là BUG-R3-028 (b) |

### 4.3 BUG-R2-096 – Câu "phí phạt" hiện cho mọi khoản

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `stay.charge_default` | Sửa | Giá mặc định {amount} theo {rule}. Phí phạt không tính vào doanh thu phòng. | Giá mặc định {amount} theo {rule}. | Default price {amount} per {rule}. |
| `stay.charge_penalty_note` | Mới | – | Phí phạt và tiền bồi thường hư hỏng không tính vào doanh thu phòng. | Fines and damage charges don't count as room revenue. |

FE: ghép `stay.charge_penalty_note` sau `stay.charge_default` (StayDialogs 755), chỉ khi `item.category === 'penalty' || item.category === 'damage'`.

Bản 1.2 (DOM `rules-v1.0.5.md` mục 8.1, G6): DOM chốt hiện câu cho cả `penalty` và `damage`, dùng chung một câu. Hai nhóm cùng là "Phạt & bồi thường" trong Doanh thu khác (K-07), không vào doanh thu phòng (K-06). UXD lấy nguyên chữ DOM đề xuất. Câu nói cả hai khoản, nên đúng với cả hai nhóm. Giữ tên khóa `stay.charge_penalty_note` để FE không phải đổi tên. Các nhóm khác (minibar, giặt, dọn lẻ, phí dịch vụ) không hiện câu này.

### 4.4 BUG-R2-098 – Hộp nhập lại mật khẩu ghi "xem giấy tờ" khi xem số tài khoản

`StepUpDialog` (`stay/common.tsx`) dùng chung cho xem giấy tờ (RegistrationPage, DocsPanel) và xem đủ số tài khoản nhận hoàn (MoneyPage, `getRefundDestination`, có `x-c3-log`). Câu "15 phút" viết cứng, trong khi `c3_stepup_minutes` cho phép từ 1 đến 15.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `ci.stepup_body` | Sửa | Xem đủ số và ảnh giấy tờ được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn – có hiệu lực 15 phút trên máy này. | Xem đủ số và ảnh giấy tờ được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn. Quyền xem chỉ giữ trong thời gian ngắn trên máy này. | Viewing full ID numbers and photos is recorded in the access log. Re-enter your password. Access lasts only a short time on this device. |
| `stepup.title_account` | Mới | (dùng `ci.stepup_title` "Xác nhận lại để xem giấy tờ") | Xác nhận lại để xem đủ số tài khoản | Confirm again to view the full account number |
| `stepup.body_account` | Mới | (dùng `ci.stepup_body`) | Xem đủ số tài khoản nhận hoàn tiền được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn. Quyền xem chỉ giữ trong thời gian ngắn trên máy này. | Viewing the full refund account number is recorded in the access log. Re-enter your password. Access lasts only a short time on this device. |
| `params.k.c3_stepup_minutes` | Sửa | Thời gian xem giấy tờ sau khi nhập lại mật khẩu | Thời gian xem giấy tờ, số tài khoản sau khi nhập lại mật khẩu | Viewing time for IDs and account numbers after re-entering password |

FE: `StepUpDialog` nhận thêm `purpose: 'id' | 'account'` (mặc định `'id'`). MoneyPage truyền `'account'`. `ci.stepup_title` giữ nguyên cho giấy tờ.

### 4.5 BUG-R2-100 – Cột Lý do hiện mã thô

Không đổi chữ. MoneyPage 303 đã dùng `auditReasonText`, và `app/auditReason.ts` đã ánh xạ `guest_changed_mind`, `found_other`, `minibar_recount`. QA xác nhận trên bản v1.0.5 rồi đóng.

### 4.6 BUG-R2-218 – Trang khách ghi "ngôn ngữ theo trình duyệt"

Câu cũ nói ngôn ngữ chọn theo trình duyệt. Thực tế ngôn ngữ trong hồ sơ khách (máy chủ gán theo quốc tịch, `guests.service.ts:233`) thắng trình duyệt (P-S4-10; `rounds/round-02/qa/r1-3-ui-run.md`). Câu mới không nói nguồn, chỉ nói điều luôn đúng. Chữ hướng khách, CPY duyệt (mục 7).

| Khóa | Kiểu | Chữ cũ | Chữ mới EN | Chữ mới VI | Chữ mới RU |
|---|---|---|---|---|---|
| `gw.lang_auto` | Sửa | EN: Language set from your browser – you can change it at the top. · VI: Ngôn ngữ theo trình duyệt của bạn – bạn có thể đổi ở đầu trang. · RU: Язык выбран по настройкам браузера – его можно сменить вверху. | You can change the language at the top of the page. | Bạn có thể đổi ngôn ngữ ở đầu trang. | Язык можно сменить вверху страницы. |

Chỗ dùng:
- HomePage 52 (dòng chữ dưới lời chào, khi khách chưa tự chọn ngôn ngữ);
- GuestShell 66: trước bản 1.1, câu này còn làm mô tả cho trình đọc màn hình của ô chọn ngôn ngữ (xem dòng `gw.lang_auto_sr` bên dưới).

Ca `TC-L7-053` (`ui/guest-web.h18.spec.ts:293`) đang đánh dấu `test.fail` cho lỗi này. Khi chữ mới lên, QA bỏ đánh dấu và so bằng `tv('gw.lang_auto')`.

Bản 1.1 (FB-R5-CPY-UXD-V105-10, a11y, UXD nhận vào v1.0.5): GuestShell 66 dùng câu này làm `aria-describedby` của chính ô chọn ngôn ngữ (`#gw-lang-state`). Người dùng trình đọc màn hình đang đứng ở ô đó mà nghe "có thể đổi ở đầu trang" thì không hợp, và không biết trạng thái hiện tại. Câu cặp `gw.lang_chosen` thì nói trạng thái ("Language you chose").

| Khóa | Kiểu | Chữ mới EN | Chữ mới VI | Chữ mới RU | Chỗ dùng |
|---|---|---|---|---|---|
| `gw.lang_auto_sr` | Mới | Language selected for you | Ngôn ngữ đã chọn sẵn cho bạn | Язык выбран автоматически | Chỉ trong `span.sr-only#gw-lang-state` (GuestShell 66), thay `gw.lang_auto` khi `!chosen`. Câu không nói nguồn chọn, nên vẫn đúng tinh thần BUG-R2-218. Chữ do CPY viết |

### 4.7 BUG-R3-028 – Chữ lộ "Round", nhãn sai, hạn báo giá

| Mục | Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|---|
| (a) | `co.invoice_r3` | Sửa | Hóa đơn điện tử phát hành từ Round 3; R2 lưu thông tin để kế toán xuất. | Desk chưa xuất hóa đơn điện tử. Thông tin được lưu để kế toán xuất. | OTTIMO Desk doesn't issue e-invoices yet. The details are saved for accounting to issue. |
| (a) | `ci.door_title` | Sửa | Mã cửa – nhập tay trên app khóa (R2) | Mã cửa – nhập tay trên app khóa | Door code – entered manually in the lock app |
| (a) | `ci.door_not_stored` | Sửa | OTTIMO không lưu mã cửa ở R2. Khi trả phòng hoặc đổi phòng, hệ thống tạo việc "Xóa mã trên app khóa". | OTTIMO không lưu mã cửa. Khi trả phòng hoặc đổi phòng, hệ thống tạo việc "Xóa mã trên app khóa". | OTTIMO doesn't store door codes. On check-out or room change, the system creates a "Delete code in lock app" task. |
| (a) | `co.effect_door` | Sửa | Tạo việc "Xóa mã trên app khóa" cho căn {room} (R2 nhập tay). | Tạo việc "Xóa mã trên app khóa" cho căn {room}. | A "Delete code in lock app" task is created for room {room}. |
| (a) | `stay.door_manual` | Sửa | Giao tay trên app khóa – không lưu trong OTTIMO (R2) | Giao tay trên app khóa – không lưu trong OTTIMO | Handed over via the lock app – not stored in OTTIMO |
| (a) | `stay.late_door_manual` | Sửa | R2: kéo dài hiệu lực mã trên app khóa bằng tay. | Kéo dài hiệu lực mã trên app khóa bằng tay. | Extend the code's validity in the lock app manually. |
| (a) | `stay.long_hint` | (mục 1.1) | – | – | – |
| (b) | `stay.companion_field` | (mục 4.2) | – | – | – |
| (c) | `stay.agreed_time` | Mới | (dùng `checkout.departure_time` "Giờ trả phòng thực tế") | Giờ khách hẹn trả phòng | Agreed check-out time |
| (d) | `bk.room_help` | Sửa | (định mức/tối đa) – chỉ hiện căn đang bán và còn trống trong khoảng ngày | (định mức/tối đa). Căn đã có khách trong khoảng ngày sẽ được báo ngay dưới ô, kèm căn còn trống nếu có. | (standard/max guests). If a room is taken for these dates, a note below says so and suggests free rooms if there are any. |
| (e) | `sale.quote_expires` | Sửa | Hết hiệu lực {time} | Hiệu lực đến {time} | Valid until {time} |
| (f) | `rsv.list_empty_body_sales` | Mới | (dùng `rsv.list_empty_body` "…Bấm Đặt phòng mới để tạo đơn.") | Đơn bạn tạo sẽ hiện ở đây. Tạo đơn từ mục Báo giá & giữ chỗ. | Bookings you create will show here. Create one from Quotes & holds. |

FE:
- (c) StayDialogs 881, hộp Xác nhận giờ trả (`today.confirm_time`): ô giờ dùng `stay.agreed_time`. Ô giờ ở màn Trả phòng vẫn dùng `checkout.departure_time`.
- (d) Danh sách căn luôn có đủ các căn. Khi căn bận, dòng phụ đổi thành lý do và các căn thay thế (BookingDialog 1022–1026). Câu mới tả đúng hành vi đó.
- (e) QuotesPage 443 và QuoteDialog 736: truyền `{time}` = `expiresAt − 1 phút`, định dạng "HH:mm dd/MM/yyyy". Đây là cùng phút với tin gửi khách ("hiệu lực đến 23:59 …", `quotes.service.ts:365`).
- (f) ReservationsPage 156: vai sale nội bộ và CTV (trang "Đơn của tôi", không có nút Đặt phòng mới) dùng `rsv.list_empty_body_sales`. Vai lễ tân giữ `rsv.list_empty_body`.
- (g) Hộp Báo đã chuyển cọc đã định dạng số (`ReservationDialogs.tsx` 1815, `vnd()`). QA xác nhận rồi đóng mục (g).
- `co.qr_account`, `gw.cap_*` chỉ còn trong prototype hi-fi, không đổi.

### 4.8 BUG-R3-035 – Phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản bằng 1 đêm

Chữ khách cầm, CPY duyệt (mục 7).

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `bill.line.late_fee_as_night` | Mới | Phụ thu trả muộn (bằng giá 1 đêm) | Late check-out fee (one night's rate) |

Bản 1.1 (FB-R5-CPY-UXD-V105-05, UXD nhận): bản VI đặt phần cách tính trong ngoặc, cùng khuôn các dòng phiếu khác ("Phụ thu trả muộn ({time})", "Phí trả phòng sớm (báo trước…)") và cùng khuôn bản EN. Chữ Desk `co.late_fee_*` giữ nguyên. "Phụ thu" giữ trong v1.0.5 cho cùng họ với các dòng cũ. Đổi cả họ ở v1.0.6 (C6, mục 7).

BE-B (`folio/public/line-labels.ts`, case `late_checkout`): dòng có `chargeCode = 'late_fee_as_night'` trả `labelKey: 'bill.line.late_fee_as_night'`, không kèm `time`. Bỏ giờ khỏi dòng này vì khoản tính bằng giá một đêm, không theo giờ. Như vậy cũng hết ca "00:15" dễ đọc thành sáng của ngày dịch vụ. FE không cần sửa: `lineLabel` dùng `labelKey` khi `hasKey`.

**Bản 1.2 (FB-R5-CPY-UXD-V105-04, DOM `rules-v1.0.5.md` mục 10).** Nhãn `late_fee_as_night` khẳng định số tiền bằng giá một đêm. Điều đó đúng khi dòng do B18 ghi, và khi miễn hoặc giảm đi bằng dòng FOC riêng (BR-416, BR-433). DOM xác nhận vẫn có ca quản lý, chủ đầu tư **sửa thẳng** đơn giá hoặc số lượng dòng này (`folio-lines.service.ts` chỉ chặn `PRICE_NOT_EDITABLE` với lễ tân, lễ tân trưởng). Ca thường gặp là trên folio `settled`, trong cửa sổ sau trả phòng (A32, BR-433 (e)). Dòng thay thế giữ `charge_code`, `label_params` và `limit_ref_vnd` của dòng gốc. Ca đó cần nhãn không nói số tiền:

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `bill.line.late_fee_after_limit` | Mới | Phụ thu trả muộn (rời sau mốc trả muộn) | Late check-out fee (after the late check-out limit) |

Chữ của CPY, DOM xác nhận đúng nghĩa BR-416 (khách rời sau mốc cuối, đêm ngày đi không bán được). Chữ khách cầm, cùng khuôn ngoặc với `late_fee_as_night`. "Phụ thu" giữ trong v1.0.5, đổi cùng họ ở v1.0.6 (C6).

BE-B chọn nhãn theo số tiền dòng:
- `amount_vnd` **bằng** `limit_ref_vnd` → `bill.line.late_fee_as_night`;
- **khác** (nhỏ hơn hoặc lớn hơn, ví dụ sửa số lượng) → `bill.line.late_fee_after_limit`.

Cả hai nhãn không kèm `time`. Dòng FOC riêng không đổi nhãn của dòng gốc: dòng 800.000 kèm FOC 400.000 vẫn ra `late_fee_as_night`. Ràng buộc `folio_line_limit_ref_required_check` (migration 0082) bảo đảm dòng `late_fee_as_night` luôn có `limit_ref_vnd`, nên không có ca thiếu số so.

Không chặn v1.0.5 nếu V5-16 (sửa giảm thẳng dòng phát sinh) không lên cùng bản: ca sửa thẳng của quản lý đã có từ trước V5-16.

### 4.9 BUG-R3-051 – Banner công tắc ghi "mở chat Zalo"

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `webreq.form_off_body` | Sửa | Khách bấm Đặt phòng sẽ mở chat Zalo, nên yêu cầu mới chưa vào đây. Yêu cầu đã có vẫn xử lý bình thường. | Khách bấm Đặt phòng trên website sẽ thấy lời mời nhắn Zalo hoặc gọi điện, nên yêu cầu mới chưa vào đây. Yêu cầu đã có vẫn xử lý bình thường. | Guests who tap Book on the website are asked to message on Zalo or call instead, so new requests don't arrive here. Existing requests can still be handled. |

Chỗ dùng: WebRequestsPage 202. Câu đúng cho cả hai bản landing:
- landing có form: khách vẫn thấy form, chạm vào thì hiện "Online requests are paused… message us on Zalo or call…" (BUG-R3-051);
- landing chỉ có nút chat: khách được đưa sang Zalo.

Theo đúng câu mong đợi của QA.

### 4.10 BUG-R3-055 – Sau khi xóa theo yêu cầu, ghi sai lý do "theo hạn lưu"

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `webreq.pii_erased` | Mới | Thông tin liên hệ đã xóa theo yêu cầu của người gửi ({date}). | Contact details were erased at the sender's request ({date}). |

FE: WebRequestDrawer 554 dùng `webreq.pii_erased` khi `declineReasonCode === 'erased_on_request'`. Các ca khác giữ `webreq.pii_purged`.

### 4.11 Ô sửa giá đêm của đơn Nội bộ

Chữ đã chốt ở decision-log 05/11 (UXD – chữ phụ ô A31 cho đêm Nội bộ), ở đây chép lại để áp.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `folio.adjust_night_help_internal` | Mới | Đêm của đơn Nội bộ: không áp sàn–trần. Miễn phí đêm này thì nhập 0 (quản lý, chủ đầu tư). | Internal stay night: no floor or ceiling. To make this night free, enter 0 (manager or owner). | Thay `folio.adjust_night_help` khi đêm thuộc đơn kênh Nội bộ. Vẫn ghép `rate.night_now` sau như hiện tại |
| `folio.adjust_night_empty_internal` | Mới | Nhập giá đêm. Miễn phí thì nhập 0. | Enter the night's rate. Enter 0 if it is free. | Thay `field_error.amount_not_positive` ở ô trống, cùng điều kiện |

Khi khóa lên, BA bỏ câu "Bỏ qua dòng chữ nhỏ dưới ô giá … Chữ cũ, sửa ở v1.0.5." trong sổ tay 2.5, `02` 5.1, `01` 14.1 (BA-reply-v104-pr72).

### 4.12 Khóa chung `error.INVALID_TRANSITION_generic` (UXD-F1-01)

`error.INVALID_TRANSITION` nói "Đơn vừa chuyển sang "{status}"…". Câu này chỉ đúng cho đơn đặt phòng có `status`. Ở trang Người dùng (UsersPage 188), mã 409 này không phải của đơn, và trang **tự tải lại**. Ở chỗ khác, trang không tự tải lại.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `error.INVALID_TRANSITION_generic` | Mới | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Tải lại để xem các nút hiện có. | This just changed, so the action no longer applies. Reload to see what you can do now. | 409 `INVALID_TRANSITION` không phải của đơn, hoặc không có `status`, ở chỗ **không** tự tải lại |
| `error.INVALID_TRANSITION_generic_reloaded` | Mới | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Danh sách đã tải lại. | This just changed, so the action no longer applies. The list has been reloaded. | Chỗ tự tải lại sau 409 (UsersPage) |

Thẻ F1 trước đây đề xuất câu "Đã tải lại…" cho mọi chỗ. Bảng này sửa lại thành 2 câu, vì chỉ UsersPage thật sự tải lại.

### 4.13 Đơn vị tiền trong `error.DEPOSIT_INSUFFICIENT` (UXD P440-06)

| Khóa | Kiểu | Chữ (giữ) | Việc của FE |
|---|---|---|---|
| `error.DEPOSIT_INSUFFICIENT` | FE | Chưa đủ cọc: cần {required}, đã ghi nhận {paid}. Ghi nhận thêm rồi xác nhận. | Truyền `{required}` và `{paid}` bằng `money()` (có "đ"), không dùng `vnd()`. Áp ở ReservationDialogs 757 và ở đường 422 qua `rsvErrorText`. Sửa test so chữ |

### 4.14 Hộp xanh "Gửi mã QR cho khách…" khi chưa có mã QR (GN-V104-QR-green-box)

QuoteDialog 773: hộp xanh luôn nói "Gửi mã QR cho khách", kể cả khi ngay dưới là câu đỏ `error.PAYMENT_NOT_CONFIGURED` ("Chưa cài tài khoản nhận chuyển khoản…") hoặc `dep.qr_failed`. Câu mới đúng cho cả hai ca.

**Bản 1.2 (FB-R5-DOM-UXD-01, Major; DOM `rules-v1.0.5.md` mục 8.2).** Vế "Bạn sẽ được nhắc {hours} giờ trước khi hết hạn" sai với v1.0.x, kể cả khi tham số > 0:
- tin nhắc J2 chỉ vào hộp thông báo của app nhân viên;
- sale, CTV không có màn nào trên app đó;
- Desk không có hộp thông báo, và trang Hôm nay (có Cần chú ý) chỉ mở cho OWN, MGR, FDL, FD.

Sale, CTV yên tâm chờ nhắc thì giữ chỗ tự hủy mà không ai báo khách. Bản 1.2 bỏ vế nhắc ở cả ba câu. Thay vào đó, câu nêu **giờ hạn**, điều xảy ra lúc đó, và việc người tạo phải làm. Câu không hứa nhắc mà cũng không nói "Desk không nhắc", vì lễ tân, quản lý tạo giữ chỗ trong hộp này vẫn thấy dòng "Giữ chỗ sắp hết hạn".

**Bản 1.3 (FB-R5-CPY-UXD-V105-12, Major).** Bản 1.2 bảo sale, CTV nhờ lễ tân gia hạn, là chỉ sai người làm. Sale, CTV tự gia hạn được giữ chỗ của mình: BR-303, `rbac-matrix.md` A03 (SAL, CTV "M"), `allowed-actions.ts` 74–76 (`extend_hold` khi `fd || sal || ctv`, chưa gia hạn lần nào, chưa quá hạn). Họ mở đơn ở "Đơn của tôi" và bấm nút **Gia hạn giữ chỗ (1 lần)**. Bản 1.3 dùng nguyên chữ CPY: vế cuối là việc tự làm, có tên nút; VI thêm "lúc" trước giờ; EN nói rõ mốc là giờ hạn. Tên nút trong câu phải khớp nguyên văn `drawer.action.extend_hold` (VI "Gia hạn giữ chỗ (1 lần)", EN "Extend hold (once)"). Đổi tên nút thì đổi cả 3 câu. Câu đúng với mọi vai và mọi giá trị `hold_expiry_reminder_hours`, kể cả 0 (DOM: 0 là không nhắc). Không còn `{hours}` nên bỏ dạng số nhiều. "Chưa cọc thì tự hủy" cùng chữ với `sale.hold_until` ngay trước bước tạo. Giữ chỗ có cọc một phần không tự hủy (báo đỏ cho quầy), nên câu không nói "chưa đủ cọc".

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `sale.hold_next` | Sửa | Gửi mã QR cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Send the QR code to the guest. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | Sale nội bộ, mã QR đang tạo hoặc đã có |
| `sale.hold_next_ctv` | Sửa | Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Ask the front desk or sales staff to send the guest the deposit VietQR. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | CTV |
| `sale.hold_next_no_qr` | Mới | Thu cọc của khách theo hướng dẫn bên dưới. Giữ chỗ hết hạn lúc {time}, chưa cọc thì tự hủy. Bạn tự theo dõi giờ này; khách cần thêm giờ thì bấm Gia hạn giữ chỗ (1 lần) trên đơn trước hạn. | Collect the deposit as shown below. The hold expires at {time} and is cancelled if there's no deposit by then. Keep track of the time; if the guest needs longer, use Extend hold (once) on the booking before it expires. | Sale nội bộ, `DepositQr` báo lỗi hoặc `PAYMENT_NOT_CONFIGURED` |

Bản 1.1 có 6 khóa `_one`/`_other` mới và xóa `sale.hold_next`, `sale.hold_next_ctv`. Bản 1.2 bỏ cả 6 khóa đó, giữ 2 khóa cũ (đổi chữ) và thêm 1 khóa `_no_qr`. FE chưa áp bản 1.1, nên không có gì phải gỡ.

FE:
- `{time}` lấy từ `held.holdExpiresAt` (giờ máy chủ trả, đã tính mốc chặn `holdLatestTime`). Định dạng như `sale.hold_until`: `timeHHmm` + `dayMonth` theo giờ Asia/Ho_Chi_Minh, ví dụ "15:30 07/11". Thiếu `holdExpiresAt` thì dùng `holdUntil` đã tính. Không truyền `hours`; `rules.holdWarnHours` không còn dùng ở đây;
- `DepositQr` báo ra ngoài khi lỗi (ví dụ thêm `onFail`, đối xứng với `onQr`);
- QuoteDialog chọn `sale.hold_next_no_qr` khi đã có lỗi và chưa có mã QR;
- trong lúc đang tạo, giữ `sale.hold_next`.

Ba câu này là chữ cho sale, CTV. CPY đã viết lại ở thẻ 12 (bản 1.3); áp nguyên văn.

### 4.15 U+2011 cho "2-step" (CPY P401-11) và các cụm số–chữ EN

Cách (a) của thẻ: thay một lần trong `gen_strings.py`, chỉ ở cột EN. Thay "2-step" bằng "2‑step", "1-month" bằng "1‑month", "24-hour" bằng "24‑hour" (U+2011). Rà toàn bộ `strings-en.json` bằng mẫu `\b\d+-[A-Za-z]+` thì chỉ còn 25 khóa có gạch thường. 6 khóa khác đã có U+2011.

25 khóa:
- **"2-step" (22):**
  - `auth.enroll.title`, `auth.enroll.done`;
  - `mfa.nudge`, `mfa.recovery_help`, `mfa.enroll_required`, `mfa.already_on`, `mfa.codes_file_title`, `mfa.codes_low_short`, `mfa.disable`;
  - `shell.security`, `error.MFA_ENROLLMENT_REQUIRED`;
  - `users.more_help`, `users.reset_2fa`, `users.reset_2fa_title`, `users.reset_2fa_done`, `users.reset_2fa_stale`;
  - `co.late_fee_auth_try_review`, `staff.mfa_enroll_desk`, `secmail.lead`, `secnudge.both`;
  - `staff.notif.sec.mfa_reset_self`, `staff.notif.sec.mfa_reset_other`.
- **"1-month" (2):** `sale.month_option`, `sale.month_total`.
- **"24-hour" (1):** `stay.late_help`.

Test so chữ phải lấy chuỗi bằng `tv(key)`, không gõ lại (content-guide mục 2). Thư bảo mật dùng `secmail.lead`: U+2011 hiển thị bình thường trong ứng dụng thư.

### 4.16 Câu mục đích cạnh ô email nhân viên (FB-R4-SEC-ARC-EM-13, Nghị định 13)

Kiểm trên `main`:
- (a) `secmail.purpose` ("Chỉ dùng để gửi thông báo bảo mật cho tài khoản này.") **đã hiện** ở cả SecurityEmailCard 217 và hộp sửa email của OWN (UserEmailDialog 105).
- (b) Câu sau khi lưu đã là "Thông báo đã gửi…" (`secmail.saved`, `users.email_saved`…). Không còn "thư xác nhận".

Còn một ý của SEC chưa làm: ở hộp của OWN, câu nên nói rõ là tài khoản của người kia.

| Khóa | Kiểu | VI | EN | Chỗ dùng |
|---|---|---|---|---|
| `users.email_purpose` | Mới | Chỉ dùng để gửi thông báo bảo mật cho tài khoản của {name}. | Used only to send security notices for {name}'s account. | UserEmailDialog 105, thay `secmail.purpose`. `{name}` = `user.displayName` (tên hiển thị của nhân viên, đã có trong tiêu đề hộp) |

### 4.17 Câu "Bạn nhận (…)" đủ đuôi (FB-R4-UXD-BA-PR89-01)

Không đổi khóa Desk. Đây là chỗ sổ tay trích chữ Desk thiếu đuôi. BA (V5-71) chép đúng khuôn của khóa, **không ghi số**:
- CTV (`sale.commission_ctv`): "Bạn nhận (…% tiền phòng – BR-903)";
- sale nội bộ (`sale.commission`): "Sale nhận (…% tiền phòng – BR-903)".

Ghi cho DOM (V5-30): hai nhãn này khẳng định cơ sở tính là "tiền phòng". Nếu H2 đổi cơ sở tính, UXD đổi chữ cùng lượt.

### 4.18 Dọn theo ghi chú QA bug list v1.0.4

| Mục | Kết quả |
|---|---|
| GN-V104-content-guide-1335 (`rooms.night_auto` câu cũ) | **Đã sạch.** Content-guide v0.4.6 (05/11) đã chép lại dòng này theo PR #87 (dòng 1336 hiện tại). Không còn câu "Đêm ngày thường… lịch giá cộng thêm" ở đâu trong `design/`. QA đóng |
| GN-V104-fo-tabs-holds | **Xóa** `fo.tabs.holds` khỏi `gen_strings.py` (dòng 115) và dòng 326 của content-guide. App không còn chỗ dùng (Desk dùng `today.holds_waiting`) |

### 4.19 Phát hiện thêm khi rà (đề xuất, PO quyết vào v1.0.5 hay để sau)

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `fo.rack.empty_body` | Sửa | Cả 10 căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu. | Mọi căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu. | Every room is free. Click an empty cell or New booking to start. | Số căn viết cứng (RackPage 292). Số căn đổi được ở Danh mục căn |
| `desk_code.channel_off` | Sửa | Gửi qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã. | Gửi qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số quy tắc › Bảo mật › Kênh được gửi mã cho khách. | Sending by message is off. The owner can turn it on in Rule settings › Security › Channels allowed to send guest codes. | Đường dẫn cũ không có trên Desk. Tên mới khớp `nav.params`, `params.grp_security`, `params.k.guest_verify_code_channels` |
| `error.DELIVERY_CHANNEL_DISABLED` | Sửa | Gửi mã qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã, hoặc đọc mã cho khách. | Gửi mã qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số quy tắc › Bảo mật › Kênh được gửi mã cho khách, hoặc đọc mã cho khách. | Sending codes by message is off. The owner can turn it on in Rule settings › Security › Channels allowed to send guest codes, or read the code to the guest. | Như trên |

### 4.20 Chữ "căn" trong chuỗi VI gửi khách (FB-R5-CPY-UXD-V105-02, bản 1.1)

"Căn" là từ nội bộ, gợi "căn hộ", trái với FB-INV-002. Landing đã chặn từ này (`dist-checks.mjs` dòng 281), trang khách đã dùng nhãn "Phòng" (`gw.room_label`), và bản EN đều là "Room". Chữ Desk nội bộ **giữ** "căn". Phạm vi theo PO (plan R5 mục 6, quyết định 15; `rounds/round-05/responses/PO-responses.md`).

**(a) Bắt buộc ở v1.0.5.** Chữ của CPY.

| Khóa | Kiểu | Chữ VI cũ | Chữ VI mới | Ghi chú |
|---|---|---|---|---|
| `sale.quote_text` (dòng 2) | Sửa (đã đếm ở 5.1) | Căn {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Phòng {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Báo giá VI gửi khách. Các dòng khác giữ nguyên. Sinh lại `quote-copy.ts` cùng lượt với bản RU. BA sửa sổ tay nếu có trích báo giá mẫu (V5-71) |
| `gw.req.clean_makeup_free` | Sửa | Hôm nay căn chưa được dọn – lần dọn này miễn phí. | Hôm nay phòng chưa được dọn – lần dọn này miễn phí. | Trang khách, xin dọn phòng. EN, RU giữ nguyên |
| `gw.req.clean_second_fee` | Sửa | Căn đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}. | Phòng đã được dọn đầy đủ lúc {time} hôm nay. Dọn đầy đủ thêm lần nữa có phí {amount}. | Như trên |

Toàn bộ `sale.quote_text` VI sau khi sửa (dòng nối bằng `\n` như hiện tại):

```
OTTIMO Boutique Stay – Báo giá {code}
Phòng {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
Tiền phòng: {room_total}{discount_note}.
Cọc giữ phòng: {deposit}. Phần còn lại thanh toán khi nhận phòng.
Báo giá có hiệu lực đến {expires}.
```

**(b) Nên có ở v1.0.5, cùng lượt C5.** 3 mẫu tin đổi "căn {room}" thành "phòng {room}". Chữ đầy đủ ở mục 5.1, cùng chỗ với bản RU. Ba khóa này đã đếm ở 5.1. Không kịp thì chuyển US-125 (B-SAU). Phần này không chặn QC.

**(c) v1.0.6 (backlog R5-B-03, gộp C6):** các dòng phiếu `bill.line.room_night_room`, `bill.line.extra_night_room`, `bill.line.room_change`, và các khóa chưa dùng `guest.stay.room`, `guest.late.how_1`, `gw.room`. Câu CPY đã đề xuất nằm ở thẻ 02 (c). Không đổi ở bản này.

### 4.21 Dấu "!" ở các chuỗi khách khác (FB-R5-CPY-UXD-V105-07, bản 1.1)

Nên có ở v1.0.5, cùng lượt C5 (PO quyết định 15). Không kịp thì chuyển US-125. Không chặn QC. Chữ của CPY.
- Guideline tránh từ cảm thán, và landing đã chặn "!" bằng test.
- "a friendly reminder" là cụm sáo.
- `msg.bill` RU còn lệch ý EN: EN cảm ơn vì đã ở, RU lại cảm ơn vì đã chọn.

| Khóa | Kiểu | Ngôn ngữ | Chữ cũ | Chữ mới |
|---|---|---|---|---|
| `msg.house_rules_smoking` | Sửa | EN | Hi {name}, a friendly reminder: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you! | Hi {name}, a reminder from OTTIMO: smoking is allowed on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you. |
| | | VI | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn! | Chào {name}, OTTIMO xin nhắc: chỉ hút thuốc ở ban công. Hút thuốc trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn. |
| | | RU | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо! | Здравствуйте, {name}! Напоминаем: курить можно только на балконе. За курение в номере взимается плата за удаление запаха согласно правилам проживания. Спасибо. |
| `msg.bill` | Sửa | RU | Спасибо, что выбрали OTTIMO, {name}! Счёт {bill_no}: {amount}. Подробнее: {link} | Спасибо, что остановились в OTTIMO, {name}. Счёт {bill_no}: {amount}. Подробнее: {link} |
| `guest.late.done_title` | Sửa | EN | All set! Your door code is ready | All set. Your door code is ready |
| | | VI | Xong! Mã cửa của bạn đã sẵn sàng | Đã xong. Mã cửa của bạn đã sẵn sàng |

Ghi chú:
- Lời chào RU "Здравствуйте, {name}!" **giữ** ở mọi mẫu. Đây là dấu câu quy ước sau lời chào có tên, đã đưa vào danh sách cho người bản xứ (CPY mục 3, câu 2).
- `guest.late.done_title` hiện chưa có mã nào dùng trong `apps/guest-web`. Vẫn sửa ở nguồn.
- Các bản RU vào danh sách cho người bản xứ.
- `msg.checkout_reminder` (giờ viết cứng) vẫn ở B-SAU. Không đổi ở đây.

---

## 5. V5-24 – Tiếng Nga

### 5.1 Bảy chuỗi hướng khách có từ cấm "апартаменты"

Nguồn: decision-log 04/11 (backlog v1.0.5), CPY-on-v104-p4-01 mục 0, CPY `privacy-2026-10-v2-ru.md` (ngoài phạm vi), SEC-on-privacy-v2-ru, UXD-on-privacy-v2-ru S3. Từ cấm theo `rounds/round-04/outputs/CPY/lp-v2-copy.md` (`/апартамент/iu`, `/квартир/iu`, `/посуточн/iu`).

Từ thay là **"номер"** (phòng khách sạn), từ CPY đã dùng và INV đã duyệt cho landing RU (lp-v2-copy 16.2: "номер" là phòng khách sạn, không dùng апартаменты/посуточно). Mọi chỗ chia đúng cách: "номер" (nguyên cách), "в номере" (giới cách), "он готов" (giống đực).

**0 trên 7 chuỗi nằm trong bản thông báo dữ liệu**, vì đó là các khóa `gw.notice_*`, và CPY xác nhận các khóa đó không có từ cấm. Như vậy không có chuỗi nào phải chờ B-PN, cả 7 vào v1.0.5.

CPY đã duyệt (C1, có điều kiện là thẻ 01; điều kiện đã áp ở bản 1.1).

| Khóa | Chữ RU cũ | Chữ RU mới | Chỗ dùng |
|---|---|---|---|
| `guest.stay.checkin_time` | Заезд с {time} (апартаменты всегда готовы к 14:00) | Заезд с {time} (номер всегда готов к 14:00) | Trang khách, trong lưu trú |
| `guest.oci.done_body` | Заезд с {time}, если апартаменты уже готовы; к 14:00 они готовы всегда. Код от двери администратор выдаст при заезде. | Заезд с {time}, если номер уже готов; к 14:00 он готов всегда. Код от двери администратор выдаст при заезде. | Trang khách, xong làm thủ tục trước |
| `gw.room` | Апартаменты | Номер | Không còn mã nào dùng (trang khách dùng `gw.room_label`). Vẫn sửa ở nguồn; xóa khóa ở v1.0.6 (4.20 c) |
| `sale.quote_text` (dòng 2 và 4) | Dòng 2: Апартаменты {room} {room_name}, … · Dòng 4: Депозит для бронирования: {deposit}. Остальное оплачивается при заселении. | Toàn bộ chữ mới ở khung dưới bảng | Báo giá gửi khách RU. Chạy lại `gen-quote-copy.mjs` (`services/api/src/generated/quote-copy.ts`) |
| `msg.booking_confirmed` | … бронирование {code}: апартаменты {room}, … (апартаменты всегда готовы к 14:00) … Предоплата {deposit}, остаток {balance} при заселении. … | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin (mục `TEMPLATES`) |
| `msg.deposit_received` | … по бронированию {code} (апартаменты {room}, {from} → {to}). … | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin |
| `msg.hot_water_issue` | … в апартаментах {room}. Техник придёт до {time}. Приносим извинения за неудобства! | Toàn bộ chữ mới ở khung dưới bảng | Mẫu tin |

**Chữ đầy đủ sau bản 1.1.** Có 3 thay đổi so với bản 1.0:
- `sale.quote_text` dòng 4 đổi "Депозит" thành "Предоплата" (thẻ 01, Major, bắt buộc);
- `msg.booking_confirmed` RU ghi rõ "получена" (thẻ 08);
- `msg.hot_water_issue` đổi cả 3 ngôn ngữ (thẻ 06, điều kiện C5).

Phần VI của 3 mẫu tin đổi "căn" thành "phòng" theo 4.20 (b). Thẻ 06, 08 và 4.20 (b) là mức nên có, làm cùng lượt C5. Không kịp thì chuyển US-125.

`sale.quote_text` RU:
```
OTTIMO Boutique Stay – предложение {code}
Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}.
Стоимость проживания: {room_total}{discount_note}.
Предоплата, чтобы закрепить номер: {deposit}. Остальное оплачивается при заселении.
Предложение действительно до {expires}.
```

`msg.booking_confirmed`:
- RU: Здравствуйте, {name}! OTTIMO подтверждает бронирование {code}: номер {room}, {from} → {to} ({nights_text}). Заезд с {checkin_time} (номер всегда готов к 14:00), выезд до {checkout_time}. Предоплата {deposit} получена, остаток {balance} — при заселении. Отмена: {cancel_policy_short}. Онлайн-регистрация для быстрого заселения: {link}
- VI: Chào {name}, OTTIMO xác nhận đặt phòng {code}: phòng {room}, {from} → {to} ({nights_text}). Nhận phòng từ {checkin_time} (phòng luôn sẵn sàng lúc 14:00), trả phòng trước {checkout_time}. Đã cọc {deposit}, còn {balance} khi nhận phòng. Hủy: {cancel_policy_short}. Làm thủ tục trước để nhận phòng nhanh: {link}
- EN: giữ nguyên.

`msg.deposit_received`:
- RU: Здравствуйте, {name}! OTTIMO получил предоплату {deposit} по бронированию {code} (номер {room}, {from} → {to}). Остаток {balance} оплачивается при заселении. Отмена: {cancel_policy_short}
- VI: Chào {name}, OTTIMO đã nhận cọc {deposit} cho đơn {code} (phòng {room}, {from} → {to}). Còn {balance} thanh toán khi nhận phòng. Chính sách hủy: {cancel_policy_short}
- EN: giữ nguyên.

`msg.hot_water_issue`:
- EN: Hi {name}, we've received your report of no hot water in room {room}. Our technician will be there by {time}. We're sorry for the inconvenience.
- VI: Chào {name}, OTTIMO đã nhận được tin báo phòng {room} không có nước nóng. Kỹ thuật viên sẽ đến trước {time}. Xin lỗi bạn vì sự bất tiện này.
- RU: Здравствуйте, {name}! Мы получили сообщение об отсутствии горячей воды в номере {room}. Техник придёт до {time}. Приносим извинения за неудобства.

Nếu lượt C5 không kịp v1.0.5, phải tách theo mức bắt buộc:
- `sale.quote_text` (thẻ 01 và 4.20 a) và 3 chuỗi trang khách (`guest.stay.checkin_time`, `guest.oci.done_body`, `gw.room`) vẫn **bắt buộc**;
- riêng 3 mẫu tin thì tối thiểu thay "апартаменты" bằng "номер" như bản 1.0.

Ghi chú:
- Bốn chuỗi `msg.*` hiện **chưa có mã nào gọi**: rà `services`, `apps`, `packages` không thấy chỗ dùng. Chúng chỉ nằm trong thư viện mẫu tin và content-guide. Vẫn sửa ở nguồn để lần nối mẫu tin sau không mang chữ cũ.
- Lời chào "Здравствуйте, {name}!" giữ "!". Đây là dấu câu quy ước sau lời chào có tên, đã đưa vào danh sách cho người bản xứ.
- Danh sách câu RU cho người bản xứ (11 câu, xếp theo rủi ro) nằm ở mục 3 của tệp review CPY. INV chuyển.

**Bản 1.1, thêm 1 khóa RU (FB-R5-CPY-UXD-V105-09).** "аренда" là chữ của thuê nhà, thuê căn hộ, cùng nhóm nghĩa với từ cấm "квартир". Câu cạnh nó (`gw.req.clean_fee_rule`) đã dùng "Долгосрочное проживание".

| Khóa | Kiểu | Ngôn ngữ | Chữ cũ | Chữ mới | Ghi chú |
|---|---|---|---|---|---|
| `gw.req.clean_long_fee` | Sửa | RU | Долгосрочная аренда не включает уборку. Каждая уборка стоит {amount}. | При долгом проживании уборка не входит в стоимость. Каждая уборка стоит {amount}. | Đang chạy (`RequestsPage.tsx` 262). Đúng BR-204, BR-506 |
| | | EN | Your long-stay rent doesn't include cleaning. Each clean costs {amount}. | Cleaning isn't included in long stays. Each clean costs {amount}. | Tùy chọn của CPY, UXD nhận để EN bỏ cùng chữ "rent" như RU |
| | | VI | Gói thuê dài hạn của bạn chưa gồm dọn phòng. Mỗi lần dọn có phí {amount}. | (giữ) | CPY: VI có thể giữ |

"аренд" **không** vào danh sách chặn tự động, vì hợp đồng dài hạn dùng đúng chữ này. Chỉ tránh trên chữ khách đọc.

### 5.2 Font chữ Nga ở ô mã và Wi-Fi bị CSP chặn (BUG-R4-017)

Yêu cầu cho FE-A (`apps/admin-web`), MOB (`apps/mobile`, PWA nhân viên) và FE-B (`apps/guest-web`). SEC duyệt.

1. Giữ **JetBrains Mono** cho ô mã, mã đặt phòng, nội dung chuyển khoản và Wi-Fi (lớp `.mono` của DS), gồm cả tập Kirin (`cyrillic`) và tập tiếng Việt, mặt 400 và 500.
2. Không để Vite nhúng font thành `data:`. Ở cả 3 ứng dụng, `build.assetsInlineLimit` dùng dạng hàm, trả `false` cho `.woff` và `.woff2`. Font tự host là tệp dưới `/assets/`.
3. **Không** nới CSP thành `font-src 'self' data:`. Giữ `font-src 'self'` như `Caddyfile.prod` và `expected-headers.sh`.
4. Thêm kiểm `check:dist` cho cả 3 ứng dụng: CSS sau build không còn `data:font`.
5. Cách kiểm (QA, UXD):
   - mở `desk.`, `staff.`, `g.` trên staging: console 0 lỗi "violates … font-src";
   - trang khách RU: phần tử `.mono` có chữ Kirin hiện bằng JetBrains Mono, ví dụ `document.fonts.check('500 14px "JetBrains Mono"', 'Ж')` trả `true` sau khi tải;
   - chụp ảnh 390 px, có thẻ Wi-Fi.
6. Không đổi token, cỡ chữ hay màu.


### 5.3 Kiểm tự động chữ khách (FB-R5-CPY-UXD-V105-11, bản 1.1)

Yêu cầu cho FE-B, xếp **sau** khi đã áp 4.20 (a) và (b) (PO quyết định 15). Kiểm trên các khóa hướng khách `guest.*`, `gw.*`, `msg.*`, `sale.quote_text*`, `bill.line.*` của `strings-{vi,en,ru}.json`. Bật dần từng mẫu theo phần đã áp, để CI không đỏ vì phần còn Deferred.

| Bước | Mẫu | Ngôn ngữ | Bật khi |
|---|---|---|---|
| 1 | `/апартамент\|квартир\|посуточн/iu` (cùng danh sách `landing-web/scripts/dist-checks.mjs:324`) | RU | Ngay khi áp 5.1 |
| 2 | `/депозит/iu` | RU | Ngay khi áp thẻ 01 |
| 3 | `/(?<!\p{L})căn(?!\p{L})/iu` (giống `dist-checks.mjs` dòng 281) | VI | Sau 4.20 (a) và (b). Chừa các khóa 4.20 (c) cho tới v1.0.6 |
| 4 | không "!" và không emoji | mọi ngôn ngữ | Sau 4.21 và thẻ 06. RU chừa đúng mẫu `^Здравствуйте, \{name\}!` cho tới khi người bản xứ trả lời |
| 5 | `/phụ thu/iu` | VI | Sau C6 (v1.0.6) |

Ghi chú: trong bảng, `\|` là dấu "hoặc" của regex, viết thoát để không vỡ bảng Markdown. Trong mã, viết `|`.

## 9. Chữ thêm ở bản 1.4–1.9 (ngoài Gói 2)

Chữ Desk nội bộ (VI, EN). Không có chữ cho khách, không cần CPY. Mã lỗi, tên `extras` và tên mã lý do do ARC chốt; bảng dưới gọi theo nghĩa, FE nối với mã ARC chốt.

### 9.1 Ghi tiền về cho đơn đã hủy (V5-5B, 5B-1; DOM 11.4) – viết lại ở bản 2.5 theo #148

**Bản 2.5 (07/11, sau khi #148 gộp; DOM FB-R5-DOM-UXD-148-01 Major, 148-06, 148-07, 148-08).** Chữ bản 1.4, 1.5 viết theo 11.4 bản đầu, khi số đơn còn phải thu luôn bằng 0. #148 làm theo ARC FB-R5-ARC-BE-105-03:
- **N** = số đơn còn phải thu (`getFolio.balanceDueVnd`; máy chủ đọc lại sau khóa folio). N > 0 khi đơn còn phí hủy hoặc phí không đến, thường là đơn OTA trả tại chỗ;
- quẹt thẻ (`card_pos`) chỉ khi N > 0, tối đa N. Cần mã chuẩn chi, không cần ảnh. Tiền mặt, `ota_collect` không bao giờ nhận;
- yêu cầu hoàn tự tạo = max(0, số ghi − N), nơi nhận cố định `original_method`. Số ghi ≤ N thì không có yêu cầu hoàn; quẹt thẻ không bao giờ sinh hoàn.

Vì vậy hộp chọn câu theo N. Desk đọc N khi mở hộp và đọc lại sau mỗi lỗi 422. Các khóa dưới đây đều chưa có trong `gen_strings.py` (FE-A thêm khi làm PR Desk 5B-1), nên đổi chữ không làm đổi số khóa.


Ca: khách chuyển tiền vào tài khoản OTTIMO sau khi đơn đã hủy hoặc đã đánh dấu không đến, ví dụ chuyển theo mã QR cũ. Luật DOM:
- chỉ FD+ ghi;
- chuyển khoản, VietQR; **quẹt thẻ chỉ khi N > 0, tối đa N** (bản 2.5). Không nhận tiền mặt, `ota_collect`;
- chuyển khoản, VietQR: ảnh chứng từ bắt buộc; quẹt thẻ: mã chuẩn chi bắt buộc, không có ô ảnh (bản 2.5; ARC 105-03 ý 4, máy chủ #148 không bắt ảnh cho thẻ; Desk không đặt ô ảnh cho thẻ để tránh ảnh chụp mặt thẻ). Ghi chú: Desk luôn bắt buộc. Ảnh là thông báo tiền vào tài khoản OTTIMO do chủ đầu tư hoặc quản lý gửi; không dùng ảnh chụp, SMS khách gửi hay ảnh sale, CTV chuyển tiếp;
- khoản thu luôn chờ đối soát;
- trong cùng giao dịch tạo yêu cầu hoàn **max(0, số ghi − N)**, không phí, mã `payment_after_cancel` (bản 2.5). N = 0 thì hoàn đủ; số ghi ≤ N thì không có yêu cầu hoàn. Người ghi không tự duyệt, không chi;
- nơi nhận hoàn cố định `original_method`: chuyển khoản về đúng tài khoản khách đã chuyển. Không chi tiền mặt, không đổi nơi nhận;
- "Có thể trùng" (`possibleDuplicateCodes`) ở màn duyệt hoàn và màn đối soát: khoản chuyển khoản, VietQR khác, chưa đảo, cùng số tiền, Giờ nhận tiền cách ≤ 24 giờ, ở đơn khác. Chỉ hiện mã đơn, không chặn;
- mã giao dịch ngân hàng (`bankReference`) tùy chọn, chỉ cho chuyển khoản, VietQR. Có mã mà trùng một khoản thu chưa đảo của cơ sở thì 409 `DUPLICATE_BANK_REFERENCE`. Chỉ FD+ nhận kèm `duplicateReservationCode`; sale, CTV nhận 409 không có mã đơn (SEC ARC-21).

Một khoản tiền chỉ ghi một lần, nên hộp phải nói rõ hai điều: khách muốn đặt lại thì không ghi ở đây; và trước khi ghi, tìm đơn mới của khách.

Dùng lại, không đổi chữ:
- `pay.bank_transfer`, `pay.vietqr` (hai lựa chọn duy nhất của ô cách thanh toán);
- `deposit.received_at` (Giờ nhận tiền);
- `pay.pending_reconcile` (Chờ đối soát);
- `pay.card` (Thẻ (máy POS tại quầy)), `co.pos_code` (Mã chuẩn chi trên phiếu POS), `co.pos_no_card` (Không nhập số thẻ…): lựa chọn và ô mã khi N > 0 (bản 2.5);
- `today.money_after_cancel` (dòng Cần chú ý "Tiền về cho đơn đã hủy {code}").

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `drawer.action.money_after_cancel` | Mới | Ghi tiền về sau khi hủy | Record money received after cancellation | Nút trên khung đơn `cancelled`, `no_show`. Chỉ FD+, không hiện cho sale, CTV |
| `rsv.after_cancel.title` | Mới | Ghi tiền về cho đơn đã hủy {code} | Record money for cancelled booking {code} | Tiêu đề hộp |
| `rsv.after_cancel.intro` | Mới, **sửa ở 2.5** | Đơn không còn nợ nên khoản ghi ở đây được hoàn đủ, không phí. | Nothing is owed on this booking, so the amount recorded here is refunded in full, with no fee. | Dòng 1 khung cảnh báo đầu hộp, khi N = 0. Bản 2.5: câu "Khách muốn đặt lại…" tách sang `rsv.after_cancel.rebook` |
| `rsv.after_cancel.intro_due` | **Mới (2.5)** | Đơn còn phải thu {due}. Khoản ghi ở đây trả phần này trước; phần vượt {due} được hoàn, không phí. | {due} is still owed on this booking. The amount recorded here pays that first; anything above {due} is refunded, with no fee. | Dòng 1 khung, thay `intro` khi N > 0. `{due}` = `money(N)` |
| `rsv.after_cancel.rebook` | **Mới (2.5)**, tách từ `intro` | Khách muốn đặt lại: không ghi ở đây. Tạo giữ chỗ mới, xác nhận cọc trên đơn mới, ghi chú giờ tiền về và mã đơn {code}. | If the guest wants to book again, don't record it here. Create a new hold, confirm the deposit on the new booking, and note the time received and booking {code}. | Dòng 2 khung, luôn hiện. Chữ giữ nguyên từ `intro` bản 1.4 (DOM 148-01: giữ câu này) |
| `rsv.after_cancel.find_new` | Mới (1.5) | Trước khi ghi: tìm đơn mới của khách theo tên hoặc số điện thoại. Đơn mới đã xác nhận cọc bằng khoản này thì không ghi ở đây. | Before recording, search for a new booking for this guest by name or phone number. If a new booking already used this money as its deposit, don't record it here. | Dòng 3 khung, luôn hiện (DOM 11.4 mục 3b) |
| `rsv.after_cancel.methods_hint` | Mới | Chỉ ghi tiền đã vào tài khoản OTTIMO: chuyển khoản hoặc VietQR. Khách đưa tiền mặt hay quẹt thẻ: tạo đơn mới và thu trên đơn mới. | Only money already in OTTIMO's account: bank transfer or VietQR. Cash or card at the desk: create a new booking and take the payment there. | Dòng phụ dưới ô cách thanh toán, khi N = 0. Ô chỉ có `pay.bank_transfer`, `pay.vietqr`. Chữ giữ nguyên: N = 0 thì không còn phí để thu, nên vế "tạo đơn mới" chỉ áp cho tiền của lần ở mới. DOM 148-01 gợi ý bỏ vế này; UXD giữ để lễ tân biết làm gì khi khách đưa tiền mặt |
| `rsv.after_cancel.methods_hint_due` | **Mới (2.5)** | Chuyển khoản, VietQR: tiền đã vào tài khoản OTTIMO. Quẹt thẻ: chỉ để thu phí còn nợ, tối đa {due}. Tiền mặt: không ghi ở đây – mời khách quẹt thẻ hoặc chuyển khoản. | Bank transfer or VietQR: money already in OTTIMO's account. Card: only for the fee still owed, up to {due}. Cash can't be recorded here – ask the guest to pay by card or transfer. | Thay `methods_hint` khi N > 0. Ô có thêm `pay.card`; chọn thẻ thì Desk điền sẵn số tiền = N (ARC 105-03 ý 8) |
| `rsv.after_cancel.proof` | Mới (sửa ở 1.5) | Ảnh chứng từ tiền vào tài khoản OTTIMO (bắt buộc) | Proof of the payment into OTTIMO's account (required) | Nhãn ô ảnh (`deposit_receipt`), chỉ khi chọn chuyển khoản, VietQR. Bản 2.5: chọn thẻ thì ẩn ô ảnh, hiện ô `co.pos_code` (bắt buộc) với dòng phụ `co.pos_no_card`. Không có ô ảnh cho thẻ để tránh ảnh chụp mặt thẻ (ARC 105-03 ý 4) |
| `rsv.after_cancel.proof_help` | Mới (1.5) | Ảnh chủ đầu tư hoặc quản lý gửi, thấy số tiền, giờ và nội dung chuyển khoản. Không dùng ảnh chụp hay SMS khách gửi, cũng không dùng ảnh sale, CTV chuyển tiếp. | A photo sent by the owner or a manager, showing the amount, time and transfer reference. Don't use a screenshot or text message from the guest, or one forwarded by sales or an agent. | Dòng phụ dưới ô ảnh (chỉ chuyển khoản, VietQR) |
| `pay.bank_reference_optional` | Mới (1.5) | Mã giao dịch ngân hàng (nếu ảnh có) | Bank transaction reference (if shown in the photo) | Ô tùy chọn khi ghi chuyển khoản, VietQR. Mọi hộp ghi thu, không riêng đơn đã đóng |
| `pay.bank_reference_help` | Mới (1.5) | Không bắt buộc. Gõ đúng mã trên ảnh; Desk báo nếu mã này đã được ghi ở đơn khác. | Optional. Type the reference exactly as shown; Desk tells you if it was already recorded on another booking. | Dòng phụ dưới ô trên |
| `rsv.after_cancel.note_hint` | Mới (sửa ở 1.5) | Ví dụ: tiền về 14:05 06/11 theo mã {code}. Không ghi tên khách, tên người chuyển hay số tài khoản. | For example: received 14:05 06/11 with reference {code}. Don't write the guest's name, the sender's name or any account number. | Chữ gợi ý ô Ghi chú (bắt buộc), khi chọn chuyển khoản, VietQR |
| `rsv.after_cancel.note_hint_card` | **Mới (2.5)** | Ví dụ: thu phí còn nợ bằng thẻ lúc 14:05 06/11. Không ghi tên khách hay số thẻ. | For example: fee still owed taken by card at 14:05 06/11. Don't write the guest's name or the card number. | Chữ gợi ý ô Ghi chú khi chọn thẻ. Ô vẫn bắt buộc |
| `rsv.after_cancel.submit` | Mới, **sửa ở 2.5** | Ghi khoản thu | Record payment | Nút chính. Bản 2.5: bỏ "và tạo yêu cầu hoàn", vì số ghi ≤ N thì không có yêu cầu hoàn |
| `rsv.after_cancel.done` | Mới, **sửa ở 2.5** | Đã ghi {amount} cho đơn {code}, chờ đối soát. Yêu cầu hoàn {refund} đã tạo – cần quản lý duyệt. Bạn là người ghi nên không tự duyệt. | {amount} recorded for booking {code}, awaiting reconciliation. A refund request for {refund} was created – a manager must approve it. You recorded it, so you can't approve it yourself. | Sau khi ghi, khi có yêu cầu hoàn (số ghi > N). `openRefunds` là tổng theo mã, không theo yêu cầu, nên `{refund}` = phần tăng của `openVnd` nhóm `payment_after_cancel`: số khi đọc lại folio sau khi ghi trừ số lúc mở hộp. Từ 0.3.14: số của yêu cầu theo `Payment.refundRequestId`. Không lấy `{amount}` làm số hoàn |
| `rsv.after_cancel.done_fee` | **Mới (2.5)** | Đã ghi {amount} vào phí còn nợ của đơn {code}, chờ đối soát. Không có yêu cầu hoàn. | {amount} recorded against the fee still owed on booking {code}, awaiting reconciliation. No refund request was created. | Sau khi ghi, khi số ghi ≤ N (gồm mọi lần quẹt thẻ) |
| `field_error.after_cancel_method` | Mới, **sửa ở 2.5** | Đơn này không còn nợ nên chỉ ghi được chuyển khoản hoặc VietQR. Khách trả tiền mặt hay quẹt thẻ cho lần ở mới: tạo đơn mới và thu trên đơn mới. | Nothing is owed on this booking, so only a bank transfer or VietQR can be recorded. For cash or card for a new stay, create a new booking and take the payment there. | 422 `VALIDATION_FAILED` (`method`, `NOT_IN_LIST`) và N đọc lại = 0. Gồm ca chọn thẻ khi người khác vừa thu đủ phí |
| `field_error.after_cancel_method_due` | **Mới (2.5)** | Đơn đã đóng không nhận tiền mặt. Thu phí còn nợ bằng quẹt thẻ (tối đa {due}), chuyển khoản hoặc VietQR. | A closed booking doesn't take cash. Collect the fee still owed by card (up to {due}), bank transfer or VietQR. | 422 (`method`, `NOT_IN_LIST`) và N đọc lại > 0. Dự phòng: ô cách thanh toán không có tiền mặt |
| `field_error.after_cancel_card_max` | **Mới (2.5)** | Quẹt thẻ tối đa {max}, là số đơn còn phải thu. | Card payments here are capped at {max}, the amount still owed. | 422 (`amountVnd`, `AMOUNT_EXCEEDS_BALANCE`), `{max}` = `money(max)` của lỗi. Dưới ô số tiền. Desk không tự sửa số |
| `field_error.after_cancel_proof` | Mới (sửa ở 1.5) | Cần ảnh chứng từ tiền vào tài khoản OTTIMO trước khi ghi. | Attach proof of the payment into OTTIMO's account first. | 422 `REQUIRED` (`attachmentId`), chỉ chuyển khoản, VietQR |
| `field_error.after_cancel_proof_from_notice` | Mới (1.5) | Ảnh này đã gửi kèm báo chuyển cọc của sale, CTV, nên không dùng làm chứng từ. Dùng ảnh chủ đầu tư hoặc quản lý gửi. | This photo came with a sales or agent deposit report, so it can't be used as proof. Use a photo sent by the owner or a manager. | 422 `NOT_IN_LIST` (`attachmentId`) |
| `error.DUPLICATE_BANK_REFERENCE` | Mới (1.5) | Mã giao dịch này đã ghi ở đơn {code}. Không ghi lại. Báo quản lý kiểm sao kê. | This transaction reference is already recorded on booking {code}. Don't record it again. Ask a manager to check the statement. | 409 **có** `duplicateReservationCode` (chỉ FD+), `{code}` = trường đó. Mọi hộp ghi thu có `bankReference`. Không ghi gì |
| `error.DUPLICATE_BANK_REFERENCE_no_code` | **Mới (2.5)**, DOM 148-06 | Mã giao dịch này đã được ghi ở một khoản thu khác. Không ghi lại. Báo lễ tân kiểm. | This transaction reference is already recorded on another payment. Don't record it again. Ask the front desk to check. | 409 **không có** `duplicateReservationCode` (sale, CTV – SEC ARC-21), ví dụ Xác nhận cọc của sale. Desk chọn câu theo có hay không có trường này, không để `{code}` trống |
| `today.money_after_cancel_not_found` | Mới (EN sửa ở 2.1) | Không thấy tiền | Money not received | Nút ở dòng Cần chú ý `deposit_after_cancel`, FD+. Đóng dòng khi chưa thấy tiền về. EN theo `co.recon_missing` (mục 9.11) |
| `today.money_after_cancel_not_found_note` | Mới, **sửa ở 2.5** (DOM 148-08) | Ghi chú (bắt buộc): đã kiểm ở đâu, lúc nào. Tiền đã ghi trước lúc báo: ghi mã phiếu thu. | Note (required): where and when you checked. If the money was recorded before the report, give the receipt code. | Ô ghi chú của nút trên. Vế sau cho ca tiền đã ghi trước khi sale báo (DOM 148 mục 1.4): một nút, một loại audit |
| `rsv.notice.after_cancel_sent` | Mới | Đã báo lễ tân. Đơn đã hủy nên lễ tân kiểm tiền về rồi xử lý. | The front desk has been told. The booking is cancelled, so they'll check the money and handle it. | Sale, CTV bấm Báo đã chuyển cọc trên đơn đã đóng (thay 409; mã trả về ARC chốt) |

**Yêu cầu hoàn tự tạo (bản 1.5; số hoàn sửa ở 2.5).** ARC chốt mã mới `payment_after_cancel`, không dùng lại `overpayment`. Chỉ có khi số ghi > N; số hoàn = số ghi − N. Yêu cầu đứng tên người ghi; người ghi không duyệt, không chi. Nơi nhận cố định `original_method`: `setRefundDestination` và `executeCashRefund` trên yêu cầu này trả 409. FE ẩn nút **Nhập nơi nhận hoàn** và lối chi tiền mặt; câu lỗi dưới chỉ để dự phòng.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `audit.reason.payment_after_cancel` | Mới (1.5) | Tiền về sau khi hủy | Money received after cancellation | Nhãn `reasonCode = payment_after_cancel` ở cột Lý do, Cần duyệt, Hoàn tiền, như `audit.reason.overpayment` |
| `refund.after_cancel_note` | Mới (1.5), **sửa ở 2.5** | Khách chuyển tiền sau khi đơn đã đóng. Số hoàn là phần vượt số đơn còn nợ lúc ghi (thường là cả khoản), không phí. Chỉ chi khi khoản thu đã đối soát. | The guest paid after the booking was closed. The refund is the part above what the booking still owed when it was recorded (usually all of it), with no fee. Pay out only after the payment is reconciled. | Dòng giải thích ở chi tiết yêu cầu (Cần duyệt, Hoàn tiền). Bản 2.5: bỏ "Hoàn đủ" |
| `refund.after_cancel_destination` | Mới (1.5) | Nơi nhận cố định: chuyển khoản về đúng tài khoản khách đã chuyển. Không chi tiền mặt, không đổi nơi nhận, kể cả khi khách đứng ở quầy. Không hỏi số tài khoản của khách. | Fixed destination: a bank transfer back to the account the guest paid from. No cash, no change of destination, even if the guest is at the desk. Don't ask for the guest's account number. | Thay khối nơi nhận ở chi tiết yêu cầu này. Thay chữ `refund.method.original_method` ("Cùng cách khách đã trả") ở yêu cầu này |
| `refund.after_cancel_guest_line` | Mới (1.5) | Nói với khách: "Tiền hoàn sẽ về đúng tài khoản anh/chị đã chuyển." | Tell the guest: "The refund will be sent back to the account you paid from." | Dòng phụ dưới `refund.after_cancel_destination`. Câu trong ngoặc là câu nói với khách theo DOM 11.4 mục 3 |
| `error.refund_destination_fixed` | Mới (1.5) | Yêu cầu hoàn này chỉ chi bằng chuyển khoản về đúng tài khoản khách đã chuyển. Không đổi nơi nhận, không chi tiền mặt. | This refund can only be paid by bank transfer back to the account the guest paid from. The destination can't be changed and it can't be paid in cash. | 409 khi gọi `setRefundDestination` hoặc `executeCashRefund` trên yêu cầu `payment_after_cancel` |
| `error.refund_no_transfer_left` | **Mới (2.5)**, DOM 148-07 | Không còn khoản chuyển khoản nào trên đơn để hoàn về. Không chi tiền mặt. Báo chủ đầu tư. | There's no bank transfer left on this booking to refund to. Don't pay in cash. Tell the owner. | 409 của `executeRefund` trên yêu cầu nơi nhận cố định, khi folio không còn khoản chuyển khoản, VietQR chưa đảo (DOM 148 mục 4.2). Hiện khi BE trả dấu hiệu riêng theo 148-07 (ARC chốt `detail` hay `extras.reason`). Chưa có dấu hiệu thì Desk giữ câu chung. Không hiện nút chi tiền mặt |

**"Có thể trùng" (bản 1.5; bắt buộc khi 5B-1 lên).** Hiện ở màn duyệt hoàn (Cần duyệt, Hoàn tiền) và màn đối soát, khi `possibleDuplicateCodes` không rỗng. Chỉ hiện mã đơn. Không chặn nút: khách có thể chuyển thật hai lần cùng số.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `pay.possible_duplicate` | Mới (1.5) | Có thể trùng | Possible duplicate | Nhãn (chip) cạnh khoản thu hoặc yêu cầu hoàn. Tông cảnh báo, như các chip chờ đối soát |
| `pay.possible_duplicate_note` | Mới (1.5) | Đơn {codes} có khoản chuyển khoản cùng số tiền, cách dưới 24 giờ. Kiểm sao kê: một dòng sao kê chỉ khớp một khoản thu. Chỉ có một dòng: bấm Không thấy tiền ở khoản ghi sau, ghi chú "trùng khoản ở đơn …", rồi báo quản lý. | Booking {codes} has a transfer of the same amount within 24 hours. Check the statement: one statement line matches only one payment. If there's only one line, select Money not received on the later payment, note "duplicate of booking …", and tell a manager. | Dòng giải thích khi mở chip. `{codes}` nối bằng ", ". "Không thấy tiền" là chữ nút `co.recon_missing` |

Để sẵn cho 5B-2 (khôi phục), chưa đếm, thêm khi 5B-2 lên:

| Khóa | VI | EN | Khi nào |
|---|---|---|---|
| `rsv.after_cancel.restore` | Khôi phục giữ chỗ và xác nhận cọc | Restore the hold and confirm the deposit | Lựa chọn trong hộp, thay lối hoàn. Chỉ hiện khi đơn bị hủy lúc còn là giữ chỗ, căn cũ còn trống đủ đêm, chưa qua ngày đến |
| `rsv.after_cancel.restore_help` | Cùng mã đơn, cùng căn, cùng giá. Không tạo yêu cầu hoàn. Thiếu cọc thì đơn thành giữ chỗ có cọc một phần đã quá hạn. | Same booking code, room and rate. No refund request. If the deposit is short, the booking becomes an overdue hold with a part deposit. | Dòng phụ dưới lựa chọn |
| `error.after_cancel_restore_blocked` | Không khôi phục được: căn đã bán hoặc đã qua ngày đến. Chọn hoàn, hoặc mời khách căn khác. | This can't be restored: the room is sold or the arrival date has passed. Choose a refund, or offer the guest another room. | Lỗi khôi phục (mã ARC chốt; DOM gợi ý dùng lại mã của B12) |

### 9.1a Thu tiền trên đơn đã đóng – 409 ở Xác nhận cọc, VietQR (V5-48; ARC 1.21 mục 2)

Bắt buộc v1.0.5. `confirmPaymentReceived` và `createVietQr` trên đơn `cancelled`, `no_show` trả 409 `INVALID_TRANSITION` kèm `reservationStatus`. FE đọc `reservationStatus` **trước** `currentState`, vì `currentState` ở đây là trạng thái khoản thu, không phải của đơn (SEC 3.1). `{status}` lấy nhãn `status.booking.*` ("Đã hủy", "Không đến"). Câu chung `error.INVALID_TRANSITION` ("Đơn vừa chuyển sang…, tải lại") không dùng ở ca này: tải lại không giúp gì, người dùng cần biết làm gì với tiền.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `error.closed_booking_payment` | Mới (1.5) | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Tiền đã vào tài khoản OTTIMO: bấm Ghi tiền về sau khi hủy trên đơn. Khách muốn đặt lại: tạo giữ chỗ mới. | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the money is already in OTTIMO's account, use Record money received after cancellation on the booking. If the guest wants to book again, create a new hold. | FD+, khi 5B-1 đã lên |
| `error.closed_booking_payment_no_5b1` | Mới (1.5) | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Tiền đã vào tài khoản OTTIMO: làm theo Tờ 2a, dòng "Tiền đã về mà đơn đã tự hủy". | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the money is already in OTTIMO's account, follow sheet 2a, the line on money received after a hold was cancelled. | FD+, khi V5-48 lên trước 5B-1. Gỡ khóa này khi 5B-1 lên |
| `error.closed_booking_payment_sales` | Mới (1.5), sửa (2.3) | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Khách đã trả tiền: báo lễ tân kèm mã đơn. | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the guest has already paid, tell the front desk and give the booking code. | Sale, CTV. Bản 2.3: thêm "xác nhận cọc" và "đã trả tiền" (mục 9.14 (c)) |

Bản 2.3 (mục 9.14 (c)): B4 `confirmDeposit` nhập tay trong hộp Xác nhận cọc cũng dùng 3 câu này, khi gặp 409 có `currentState` đóng, hoặc 412 mà lần đọc lại thấy đơn đóng.

### 9.2 Câu lỗi khi lưu `min_stay` sai dạng (V5-25; DOM 12.1, 12.7)

Sau V5-25, `min_stay` sai dạng trả 422 `PARAM_OUT_OF_RANGE`. Theo DOM 12.1 và bộ kiểm của BE (PR #96, `parameter-shapes.ts`):
- `nights` thiếu, sai kiểu hoặc ngoài khoảng: `extras` có `min`, `max`;
- `channels` **thiếu** (`REQUIRED`), sai hoặc trùng, và `arrivalWeekdays` sai hoặc trùng: `extras` có `allowed` (oracle BR-113-23, 24, 25; 17, 18, 19);
- quá 20 luật: `extras` chỉ có `max` (= 20), `field` = `value`;
- các lỗi còn lại không có `extras`: không phải mảng, phần tử không phải đối tượng, khóa lạ, luật không áp vào ngày nào, `arrivalOnSpecialDates` là chữ.

Bản 1.5 sửa theo PR #96: bản 1.4 xếp "thiếu `channels`" và "quá 20 luật" vào câu dạng chung. Máy chủ trả `allowed` cho ca thiếu `channels`, nên Desk hiện câu "Chọn một trong" (bước 1 dưới), kèm chỗ cần sửa theo 9.4. UXD đồng ý với máy chủ, không cần ARC đổi: câu "Chọn một trong: all, direct, agent, ota" cho người sửa biết phải điền gì, còn câu dạng chung không nói thiếu ở luật nào.

Câu chung `_SHAPE` (mục 2.3) không chỉ được chỗ sai. Câu `_MINMAX` ("Giá trị phải từ 1 đến 7.") đọc như cả ô phải là một số. Vì vậy `min_stay` có câu riêng. Câu dạng lấy theo đề xuất của DOM, thêm một câu nói mỗi luật cần gì, để sửa lỗi gõ mà không phải mở từ điển.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `params.err_min_stay_shape` | Mới | Giá trị chưa đúng dạng danh sách luật. Mỗi luật cần nights (số đêm), channels (kênh) và ít nhất một ngày áp: arrivalWeekdays hoặc arrivalOnSpecialDates. Xem từ điển tham số, mục Ở tối thiểu. | This isn't a valid list of rules. Each rule needs nights, channels and at least one arrival day: arrivalWeekdays or arrivalOnSpecialDates. See the parameter dictionary, Minimum stay. | `min_stay`, 422 không có `allowed`, `min`, `max` |
| `params.err_min_stay_nights` | Mới | Số đêm (nights) của mỗi luật phải từ {min} đến {max}. | Each rule's nights must be from {min} to {max}. | `min_stay`, 422 có `min` và `max` |
| `params.err_short_stay_below_min_stay` | Mới | Phải từ {min} đêm trở lên, vì Ở tối thiểu đang có luật {min} đêm. | Must be at least {min} nights, because Minimum stay has a {min}‑night rule. | `short_stay_max_nights`, 422 chỉ có `min` (kiểm chiều ngược, DOM 12.2) |

FE (`app/problem.ts`, nhánh `PARAM_OUT_OF_RANGE`; ParamDialog biết khóa đang lưu), xét trước thứ tự 6 bước ở mục 2.3:
1. khóa `min_stay`, có `allowed` → câu chung 9.4, `{detail}` = `error.PARAM_OUT_OF_RANGE` ("Chọn một trong: all, direct, agent, ota" hoặc 7 mã thứ). Ví dụ BR-113-23: "Chỗ cần sửa: mục 1, channels. Giá trị này không có trong danh sách cho phép. Chọn một trong: all, direct, agent, ota. Xem dạng đúng trong từ điển tham số, mục min_stay.";
2. khóa `min_stay`, có `min` và `max` → `params.err_min_stay_nights`;
3. khóa `min_stay`, chỉ có `max` (quá 20 luật) → câu chung 9.4 dạng cả giá trị, `{detail}` = `error.PARAM_OUT_OF_RANGE_MAX`;
4. khóa `min_stay`, không có `extras` → `params.err_min_stay_shape`;
5. khóa `short_stay_max_nights`, chỉ có `min` → `params.err_short_stay_below_min_stay`;
6. 11 khóa ở 9.4: theo 9.4. Các khóa khác: theo mục 2.3.

JSON gõ sai (thiếu ngoặc, thiếu dấu ngoặc kép) vẫn báo `params.err_json` ở máy khách, trước khi gửi. `[]` lưu được (DOM 12.2), không có câu lỗi.

### 9.3 Cảnh báo giá đêm khác thường (V5-1A; DOM 1.2 ý 6, `1568e523`; ARC 0.3.13 `updateRoom`, `createRoom`)

Cảnh báo, **không chặn**. Điều kiện, so bằng số nguyên, đúng bằng biên thì không báo:
- thấp: giá đêm × 30 < giá tháng (BR-101 (4), Desk đang kiểm ở `rooms.night_low`);
- cao: giá đêm × 5 > giá tháng (biên trên mới, DOM chọn ÷ 5).

Giá tháng là giá tháng của cùng căn, cùng ngày hiệu lực với giá đêm đang lưu. Cảnh báo để bắt lỗi gõ: thừa số 0, gõ giá tháng vào ô giá đêm, sai một chữ số. Câu mở đầu theo DOM: "Giá đêm khác thường so với giá tháng."

**Nơi hiện.**
1. **Hộp đổi giá căn** (ngăn kéo căn, `RoomDrawer`): Desk tự kiểm cùng điều kiện **trước khi gửi**. Khung cảnh báo hiện dưới hai ô giá, ngay khi giá đổi. Nút **Lưu** đổi chữ thành `rooms.save_unusual_price`: một lần bấm chữ này là xác nhận lại, không mở thêm hộp. Chỉ đổi khi người dùng đã sửa ô giá. Sửa tên căn, giường mà giá cũ vốn khác thường thì nút vẫn là **Lưu**, khung vẫn hiện.
2. **Sau khi lưu**: phản hồi `updateRoom` có `warnings[]` chứa `NIGHTLY_PRICE_UNUSUAL`, tức Desk chưa bắt được (ví dụ giá tháng của ngày hiệu lực khác giá đang hiện). Khi đó toast lưu giữ chữ cũ (`rooms.saved` hoặc `rooms.saved_scheduled`) và thêm dòng `rooms.warn.nightly_price_unusual`, tông cảnh báo, không tự tắt.
3. **Tạo căn** (`createRoom`, công cụ nhập danh mục): Desk hiện không có màn tạo căn (ARC 0.3.13, V5-1A). Màn tạo căn sau này dùng đúng 3 khóa trên theo cùng cách. Công cụ nhập danh mục và script gọi API là việc của ORC, OPS: in mã căn kèm `NIGHTLY_PRICE_UNUSUAL`, không phải chữ Desk.

| Khóa | Kiểu | VI cũ | VI | EN | Khi nào |
|---|---|---|---|---|---|
| `rooms.night_low` | Sửa | Giá đêm đang thấp hơn giá tháng chia 30 ngày ({perDay} đ). Kiểm tra lại số; nếu đúng, vẫn lưu được. | Giá đêm khác thường so với giá tháng: thấp hơn giá tháng chia 30 ({perDay} đ). Kiểm lại trước khi lưu; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: it is below the monthly price divided by 30 ({perDay} VND). Check it before saving. If it is right, you can still save. | Hộp đổi giá căn, giá đêm × 30 < giá tháng. `{perDay}` như cũ (giá tháng ÷ 30, làm tròn 1.000, chỉ số) |
| `rooms.night_high` | Mới | – | Giá đêm khác thường so với giá tháng: 5 đêm đã đắt hơn cả tháng ({month} đ). Kiểm lại trước khi lưu, nhất là số 0 thừa; nếu đúng, vẫn lưu được. | The nightly price looks unusual next to the monthly price: 5 nights cost more than the whole month ({month} VND). Check it before saving, especially for an extra zero. If it is right, you can still save. | Hộp đổi giá căn, giá đêm × 5 > giá tháng. `{month}` = giá tháng trong ô, chỉ số. Cùng `Alert tone="warn"` với `rooms.night_low`; hai điều kiện không thể cùng đúng |
| `rooms.save_unusual_price` | Mới | – | Vẫn lưu giá này | Save this price anyway | Chữ nút Lưu khi một trong hai câu trên đang hiện và ô giá đã sửa |
| `rooms.warn.nightly_price_unusual` | Mới | – | Giá đêm khác thường so với giá tháng. Giá đã lưu: kiểm lại hai giá của căn, sai thì sửa ngay. | The nightly price looks unusual next to the monthly price. The price is saved: check both prices for this room and correct them now if needed. | Dòng thêm trong toast lưu khi `warnings[]` có `NIGHTLY_PRICE_UNUSUAL`. Không dùng câu "Kiểm lại trước khi lưu" ở đây vì giá đã lưu |

Không thêm tham số cho hai biên (DOM: hằng số). Câu không ghi "÷ 5" hay "÷ 30" ở biên trên để người đọc hiểu ngay bằng ngày, tháng.

### 9.4 Câu lỗi chung cho khóa có cấu trúc (V5-25, BE PR #96)

Áp cho 11 khóa có bộ kiểm mới ở PR #96: `special_dates`, `los_discount`, `cancel_policy_direct`, `early_checkin_tiers`, `late_checkout_tiers`, `early_departure_refund`, `checkout_reminders`, `weekend_uplift_channels`, `special_uplift_channels`, `max_open_holds_per_user`, `lease_terms`. `min_stay` dùng ở bước 1 và 3 của 9.2.

Vấn đề: các khóa này là danh sách hoặc đối tượng JSON. `_MINMAX` ("Giá trị phải từ 0 đến 100.") đọc như cả ô phải là một số. `_SHAPE` không nói chỗ nào sai. Máy chủ báo chỗ sai đầu tiên ở `errors[0].field` (ARC 1.24), nên câu chung nói chỗ đó trước, rồi mới nói giá trị nhận.

**Thiếu trường bắt buộc (422 `REQUIRED`, bản 1.6; DOM 13.1, 13.6).** Xét trước các bước 2.3:
1. `cancel_policy_direct`, `field` = `value` (danh sách rỗng) → `params.err_structured_whole`, `{detail}` = `params.err_cancel_policy_empty`;
2. `max_open_holds_per_user`, `field` = `value.<vai>` → `params.err_structured`, `{detail}` = `params.err_hold_limit_roles`, dù `extras` có `min`, `max` hay không;
3. mọi khóa khác, `code` = `REQUIRED` và không có `extras` → `{detail}` = `params.err_required` (thay `_SHAPE`). Có `allowed` hay `min`/`max` thì theo 2.3 như dưới.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `params.err_required` | Mới (1.6) | Đang thiếu giá trị bắt buộc. | A required value is missing. | `{detail}` khi `REQUIRED`, không `extras`. Ví dụ: "Chỗ cần sửa: mục 2, refundPct. Đang thiếu giá trị bắt buộc. Xem dạng đúng trong từ điển tham số, mục cancel_policy_direct." |
| `params.err_cancel_policy_empty` | Mới (1.6) | Chính sách hủy không được để trống. Muốn không hoàn trong mọi trường hợp, nhập [{"minDays":0,"refundPct":0}]. | The cancellation policy can't be empty. For no refund in any case, enter [{"minDays":0,"refundPct":0}]. | `cancel_policy_direct` = `[]` (T-13-2). Để trống thì bộ tính hiểu là không hoàn mọi trường hợp, nên chặn |
| `params.err_hold_limit_roles` | Mới (1.6) | Cần đủ hai vai: collaborator (CTV) và sales_staff (sale), mỗi vai một số từ 0 đến 50. 0 là vai đó không được giữ chỗ. | Both roles are needed: collaborator (agents) and sales_staff (sales), each with a number from 0 to 50. 0 means that role can't place holds. | `max_open_holds_per_user` thiếu vai (T-13-4). Ví dụ: "Chỗ cần sửa: sales_staff. Cần đủ hai vai: …" |

Ba câu này chỉ quản lý, chủ đầu tư thấy (người sửa ô JSON), nên được giữ mã khóa con.

**Giữ nguyên 6 bước ở mục 2.3.** Câu 2.3 chọn được ghép vào `{detail}`:
- có `allowed` (hai khóa `*_uplift_channels`, `max_open_holds_per_user` khi gõ sai vai) → `error.PARAM_OUT_OF_RANGE`;
- có `min` và `max` → `_MINMAX`; chỉ `max` → `_MAX`; chỉ `min` → `_MIN`;
- không có `extras` → `_SHAPE`.
`_GROUPS` chỉ cho `ota_base_rate`, không gặp ở đây.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `params.err_structured` | Mới | Chỗ cần sửa: {where}. {detail} Xem dạng đúng trong từ điển tham số, mục {key}. | Fix this part: {where}. {detail} See the correct format in the parameter dictionary, under {key}. | `errors[0].field` sâu hơn `value` |
| `params.err_structured_whole` | Mới | {detail} Xem dạng đúng trong từ điển tham số, mục {key}. | {detail} See the correct format in the parameter dictionary, under {key}. | `field` = `value`, hoặc không có `errors` |
| `params.where_item` | Mới | mục {n} | item {n} | `value[i]` |
| `params.where_item_field` | Mới | mục {n}, {field} | item {n}, {field} | `value[i].<khóa>` và sâu hơn (`value[i].channels[j]` → khóa `channels`) |
| `params.where_field_item` | Mới | {field}, mục {n} | {field}, item {n} | `value.<khóa>[j]` (ví dụ `value.before[3]` của `checkout_reminders`) |

Cách dựng `{where}` từ `errors[0].field`:
- `{n}` = chỉ số + 1 (máy chủ đếm từ 0, người đọc đếm từ 1);
- `{field}` = tên khóa con, giữ nguyên mã (`pct`, `minNights`, `refundPct`, `before`), vì ô JSON và từ điển dùng đúng mã này;
- `value.<khóa>` không có chỉ số → `{where}` = tên khóa con, không cần khóa chữ;
- chỉ lấy một chỉ số và một tên khóa đầu tiên, bỏ phần sâu hơn.

`{key}` = mã tham số (`los_discount`). Từ điển tham số đặt tên mục theo mã, và ParamDialog đã hiện mã dưới tên.

Ví dụ:
- `los_discount`, `value[1].pct` = 120, `{min: 0, max: 100}` → "Chỗ cần sửa: mục 2, pct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục los_discount."
- `special_dates`, `value[0].from` = 30/02, không `extras` → "Chỗ cần sửa: mục 1, from. Giá trị này chưa đúng dạng, hoặc chưa khớp với tham số đi kèm. Xem dạng đúng trong từ điển tham số, mục special_dates."
- `early_departure_refund`, `value.refundPct` = −5 → "Chỗ cần sửa: refundPct. Giá trị phải từ 0 đến 100. Xem dạng đúng trong từ điển tham số, mục early_departure_refund."
- `lease_terms` 13 kỳ, `field` = `value`, `{max: 12}` → "Giá trị này vượt mức cho phép (12). Xem dạng đúng trong từ điển tham số, mục lease_terms."

Không đổi `params.err_json` (JSON gõ sai vẫn báo ở máy khách, trước khi gửi). Định dạng số theo mục 2.3; các khóa con ở đây không có đơn vị `vnd`, nên số in trần.

### 9.5 Lễ tân sửa giảm dòng phát sinh (V5-16; US-177, BR-438; ARC 0.3.13 mục 1.20)

Luật: lễ tân, lễ tân trưởng chỉ tự sửa giảm (bỏ dòng, giảm số lượng, giảm đơn giá) dòng **chính mình nhập tay trong ngày nghiệp vụ hiện tại**, xét theo dòng gốc. Mọi ca khác (dòng của người khác, dòng Desk tự ghi, dòng ngày trước) → 403 `FORBIDDEN_ACTION` + `requiredFlow: foc_request`, folio không đổi. Desk đưa sang **Gửi miễn có duyệt**. Quản lý, chủ đầu tư sửa như cũ.

Desk không tự đoán trước được: `FolioLine` không có nguồn `manual`, ngày nghiệp vụ ghi hay dòng gốc. Vì vậy hộp **Điều chỉnh** giữ nguyên lối sửa, có câu phụ báo luật từ đầu. Khi máy chủ từ chối thì hộp hiện câu chỉ dẫn và nút **Gửi miễn có duyệt**, mở form miễn phí cho đúng dòng đó. Chữ không lộ mã kỹ thuật (US-177 AC9).

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `folio.adjust_reduce_rule` | Mới | Lễ tân tự giảm hoặc bỏ được dòng chính mình nhập tay trong ngày nghiệp vụ hôm nay. Dòng khác cần Gửi miễn có duyệt. | Front desk staff can lower or cancel only the lines they entered by hand themselves on today's business day. Any other line needs a waiver request with approval. | Câu phụ trong hộp Điều chỉnh, dưới ô Bỏ cả dòng. Chỉ FD, FDL. Luôn hiện, không tùy dòng |
| `error.reduce_needs_foc` | Mới | Chưa ghi điều chỉnh. Dòng này không phải dòng bạn tự nhập tay hôm nay: dòng của người khác, dòng Desk tự ghi, hoặc dòng ngày trước. Bấm Gửi miễn có duyệt để người có quyền duyệt xem. | Adjustment not recorded. This isn't a line you entered by hand today: it was entered by someone else, added by Desk, or entered on an earlier day. Select Request a waiver (needs approval) so an approver can review it. | 403 có `requiredFlow = foc_request` ở `adjustFolioLine`. FE đọc `requiredFlow` trước, rồi mới tới câu chung `error.FORBIDDEN_ACTION`. Khung cảnh báo trong hộp, giữ số đã gõ |
| `folio.foc_request_btn` | Mới | Gửi miễn có duyệt | Request a waiver (needs approval) | Nút trong khung `error.reduce_needs_foc`. Mở form miễn phí của dòng đó, ô Số tiền điền sẵn phần định giảm (số cũ − số mới, bỏ dòng = cả dòng, không quá `foc.max`). EN theo `ci.ask_foc` |
| `foc.reduce_note` | Mới | Số tiền đã điền phần bạn định giảm. Chọn lý do (dòng ghi sai: Ghi nhầm) rồi Gửi duyệt. | The amount is filled in with what you meant to take off. Choose a reason (for a line entered wrongly: Entered in error), then send it for approval. | Dòng đầu form miễn phí khi mở từ nút trên. Mở form theo lối thường thì không hiện |
| `foc.r_entered_in_error` | Mới | Ghi nhầm | Entered in error | Lý do FOC `entered_in_error` (US-177 AC8): nút chọn lý do, cột Lý do, Cần duyệt, báo cáo FOC |
| `mlog.filter_reductions` | Mới | Sửa giảm dòng – 7 ngày | Line reductions – 7 days | Bộ lọc `reductionsOnly` ở Nhật ký tiền. Chỉ MGR, OWN (US-177 AC7 (i)) |
| `attn.line_reduction_count` | Mới | Một người đã tự sửa giảm dòng {count} lần tháng này – vượt ngưỡng {max} | One person has lowered or cancelled their own lines {count} times this month – over the limit of {max} | "Cần chú ý" `foc_threshold`, `check = line_reduction_count`. Cùng kiểu `attn.foc_count`: không tên, link lọc theo người |

Để sẵn, chưa đếm, thêm khi `ShiftReport.lineReductions[]` lên (v1.0.5 nếu kịp, không thì v1.0.6; DOM 7.2 ý 4):

| Khóa | VI | EN | Khi nào |
|---|---|---|---|
| `shift.line_reductions_title` | Dòng tự sửa giảm trong ca | Lines lowered or cancelled this shift | Tiêu đề khối ở danh sách đóng ca (BR-526 (d)) |
| `shift.line_reduction_row` | {code} · {line}: {before} → {after} · {reason} | {code} · {line}: {before} → {after} · {reason} | Một dòng mỗi lần. `{before}`, `{after}` dùng `money()`; `{reason}` = lý do người sửa gõ. Không tên khách |

Lưu ý cho PO, CPY (không chặn): bill khách in lý do miễn theo `bill.line.foc_reason` ("Miễn phí · {reason}"). Với `entered_in_error`, UXD đề xuất bill chỉ in `bill.line.foc` ("Miễn phí"), không in "Ghi nhầm". Lý do: đây là chữ nội bộ, khách không cần đọc. Số tiền trên bill không đổi.

### 9.6 Tham số đã lưu sai dạng (V5-25; DOM 13.2) – mã chờ ARC

Khi giá trị đã lưu của một tham số bị hỏng (chỉ có thể có từ trước v1.0.5), máy chủ **chặn** thao tác cần nó và trả lỗi rõ, không 500, không ghi gì (DOM 13.2):
- `cancel_policy_direct`: tạo đơn trực tiếp; hủy khi cả bản chép trong đơn lẫn chính sách đang hiệu lực đều hỏng;
- `early_departure_refund`: Trả sớm;
- `max_open_holds_per_user`: giữ chỗ mới của sale, CTV (FD+ không ảnh hưởng);
- `early_checkin_tiers`, `late_checkout_tiers`: chỉ khi cần bảng, tức nhận trước giờ nhận chuẩn hoặc trả sau giờ ân hạn.

**Mã: chờ ARC.** DOM đề xuất một mã chung kèm tên khóa, không kèm giá trị. UXD tạm đặt khóa theo mã `PARAMETER_MALFORMED`, tên khóa ở trường mở rộng `parameterKey`. ARC chốt tên khác thì đổi tên khóa chữ, giữ nguyên câu.

Chữ không lộ mã kỹ thuật: FE đổi `parameterKey` sang cụm `params.setting.*`. Khóa lạ dùng `params.setting.unknown`. Câu có hai bản theo vai người đang dùng Desk: FD, FDL, SAL, CTV đọc bản báo người sửa; MGR, OWN đọc bản tự sửa. **Hiệu lực từ hôm nay** theo DOM 13.2: dòng hỏng có từ trước v1.0.5, nên dòng mới hiệu lực hôm nay thay được ngay. Chọn ngày mai thì thao tác bị chặn cả ngày (ví dụ không tạo được đơn trực tiếp).

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `error.PARAMETER_MALFORMED` | Mới (1.6), chờ ARC | Chưa làm được việc này vì {setting} đang lưu sai dạng. Chưa có gì thay đổi. Báo quản lý hoặc chủ đầu tư sửa ở Tham số quy tắc, Hiệu lực từ hôm nay, rồi làm lại. | This can't be done yet because {setting} is saved in the wrong format. Nothing has been changed. Ask a manager or the owner to fix it in Rule settings, effective from today, then try again. | FD, FDL, SAL, CTV. Khung lỗi tại chỗ thao tác (tạo đơn, Trả sớm, giữ chỗ, nhận phòng, trả phòng) |
| `error.PARAMETER_MALFORMED_manager` | Mới (1.6), chờ ARC | Chưa làm được việc này vì {setting} đang lưu sai dạng. Chưa có gì thay đổi. Sửa ở Tham số quy tắc, chọn Hiệu lực từ hôm nay, rồi làm lại. | This can't be done yet because {setting} is saved in the wrong format. Nothing has been changed. Fix it in Rule settings with Effective from set to today, then try again. | MGR, OWN. Có thể kèm link tới dòng tham số (FE). Desk báo đã có dòng hiệu lực hôm nay (R5-B-06) thì chọn ngày mai |
| `params.setting.cancel_policy_direct` | Mới (1.6) | chính sách hủy của đơn trực tiếp | the cancellation policy for direct bookings | `{setting}` |
| `params.setting.early_departure_refund` | Mới (1.6) | chính sách hoàn khi trả phòng sớm | the early departure refund policy | `{setting}` |
| `params.setting.max_open_holds_per_user` | Mới (1.6) | giới hạn giữ chỗ của sale, CTV | the hold limit for sales staff and agents | `{setting}` |
| `params.setting.early_checkin_tiers` | Mới (1.6) | bậc phụ thu nhận phòng sớm | the early check-in fee tiers | `{setting}`. Cùng chữ với `params.k.early_checkin_tiers` để quản lý tìm đúng dòng |
| `params.setting.late_checkout_tiers` | Mới (1.6) | bậc phụ thu trả phòng muộn | the late check-out fee tiers | `{setting}`. Cùng chữ với `params.k.late_checkout_tiers` |
| `params.setting.unknown` | Mới (1.6) | một tham số quy tắc | a rule setting | `{setting}` khi `parameterKey` vắng hoặc ngoài 5 khóa trên |

Không dùng câu `error.PAYMENT_NOT_CONFIGURED` hiện có cho Trả sớm khi `early_departure_refund` hỏng: câu đó nói về tài khoản nhận chuyển khoản.

### 9.7 Desk: hộp Đổi phòng lọc căn chưa dọn (V5-50) và nút Báo cần dọn (V5-15) – bản 1.7

Nguồn: `rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md` (#98 @ `1efe60c7`, #102 @ `71db3338`). Chữ Desk nội bộ, không cần CPY. Căn cứ mã trên `main` @ `d1d2fb8e`:
- hộp Đổi phòng: `searchAvailability` + `listRoomStatuses`, chỉ giữ VI/VC (ARC 0.3.13 mục 1.12, BR-803);
- nút: `transitionRoomStatus` `needs_cleaning` (R8 OC → OD; R8a tạo việc dọn nếu căn chưa có), hiện khi `allowedEvents` có `needs_cleaning` (ARC 0.3.13 mục 1.4);
- dọn căn kẹt: Bắt đầu dọn OD → CL; Dọn xong khi không còn lượt Đang ở → VC (R3, `rules.ts` `roomTarget`); `room_ready` đạt với VI/VC (`checkin.service.ts`).

**Hộp Đổi phòng (V5-50, #98).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `room_change.ready_only` | Sửa (#98, khớp nguyên văn thẻ FB-R3-UXD-FE-A-17, UXD duyệt) | Chỉ hiện căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm, và không bị khóa. | Only rooms that are VI · Inspected, ready or VC · Cleaned, awaiting inspection, and not blocked, are shown. | Dưới danh sách "Căn mới" khi đã lọc theo trạng thái buồng |
| `room_change.ready_unfiltered` | Mới (#98, nguyên văn câu v1.0.0 của thẻ 17, UXD duyệt) | Chỉ đổi được sang căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm. Danh sách có thể còn căn chưa dọn – chọn căn đó sẽ được báo, không lưu gì. | You can only move to a room that is VI · Inspected, ready or VC · Cleaned, awaiting inspection. The list may still include rooms not yet cleaned – choosing one shows a message and nothing is saved. | Thay `ready_only` khi `listRoomStatuses` lỗi (danh sách chưa lọc) |
| `room_change.no_rooms_not_ready` | Mới (1.7, nên có) | Chưa có căn nào sẵn sàng. Còn trống từ {from} đến {to} nhưng chưa dọn xong: căn {rooms}. Nhờ buồng phòng dọn trước một căn rồi mở lại hộp này. Không chờ được thì hỏi quản lý. | No room is ready yet. Free from {from} to {to} but not yet cleaned: {rooms}. Ask housekeeping to clean one first, then open this form again. If that can't wait, ask a manager. | Khung `warn` thay `room_change.no_rooms` khi danh sách đã lọc rỗng **và** có căn trống (`available`, khác căn đang ở) đang `VD` hoặc `CL`. `{rooms}` = các số căn đó, tăng dần, nối ", " ("202, 203"). `{from}`, `{to}` như `no_rooms`. Không có căn VD/CL thì giữ `no_rooms`. Danh sách chưa lọc thì không dùng. Thẻ FB-R5-UXD-FE-PR98-01 |

Không cần câu riêng khác cho ca lỗi trạng thái buồng: `ready_unfiltered` đã nói thật, máy chủ vẫn chặn 409 `ROOM_NOT_READY`.

**Nút Báo cần dọn (V5-15, #102 Desk, #97 app nhân viên).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `hk.action.needs_cleaning` | Mới (#102, #97); **UXD đổi chữ** "Cần dọn" / "Needs cleaning" | Báo cần dọn | Mark for cleaning | Nút R8: Desk (Buồng phòng → Trạng thái buồng, cuối dòng căn) và app nhân viên (H20), chỉ khi `allowedEvents` có `needs_cleaning`. Cũng là tên thao tác trong hàng đợi của app nhân viên. Điều kiện gộp #102 (thẻ FB-R5-UXD-FE-PR102-01) |
| `hk.desk.needs_cleaning_toast` | Mới (#102, cùng chữ `stay.change_effect_old`, UXD duyệt) | Căn {room} chuyển cần dọn và có việc dọn. | Room {room} needs cleaning and gets a cleaning task. | Toast sau 200. `{room}` = số căn |
| `error.INVALID_TRANSITION_generic_reloaded` | (4.12 – không đếm lại) | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Danh sách đã tải lại. | This just changed, so the action no longer applies. The list has been reloaded. | Thêm chỗ dùng: dòng căn ở Trạng thái buồng sau 409 `INVALID_TRANSITION` (Desk tải lại căn và việc). Khóa chỉ thêm một lần: PR gộp sau (Gói 2 hoặc #102) bỏ dòng trùng |

Vì sao đổi nhãn nút:
- Nút là động từ (content-guide C1), cùng họ "Bắt đầu dọn", "Dọn xong", "Làm xong".
- "Cần dọn" trùng chữ bộ lọc "Cần dọn ({n})" ngay trên danh sách căn và trạng thái "Cần dọn (khách đã đi)" của app nhân viên (EN: "Needs cleaning (guest left)"). Nút cùng chữ đọc như nhãn trạng thái. Căn có nút "Cần dọn" lại không nằm trong bộ lọc "Cần dọn".
- "Báo" nói đúng việc xảy ra: căn chuyển "Có khách, cần dọn" và buồng phòng có việc dọn. Không hỏi xác nhận (lệnh nhẹ, không đụng tiền, gỡ bằng Hủy việc).
- Tên việc trong plan, hợp đồng, luật vẫn là "nút Cần dọn". Sổ tay và release notes ghi nhãn trên màn hình: **Báo cần dọn**.

**Nhận phòng căn kẹt trạng thái (BUG-R4-039; UXD-on-v104-pr77 lượt 4, DOM lượt 7 mục 3 hẹn đổi ở v1.0.5).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `checkin.room_status_stuck` | Sửa (1.7) | Căn {room} vẫn hiện có khách, nhưng không còn đơn nào đang ở. Kiểm căn đã trống, rồi bấm Báo cần dọn ở Buồng phòng → Trạng thái buồng; buồng phòng dọn xong là nhận phòng được. Khách không chờ được thì đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. | Room {room} still shows as occupied, but no stay is in house. Check the room is empty, then select Mark for cleaning in Housekeeping → Room status; once housekeeping has cleaned it, check-in can go ahead. If the guest can't wait, move this booking to a vacant room. No exception applies in this case. | Alert bad trong dòng `room_ready` khi `cause = room_status` và `detail = OC`. Thẻ FB-R5-UXD-FE-PR102-02 |
| `checkin.room_status_stuck_od` | Mới (1.7) | Căn {room} vẫn hiện có khách, nhưng không còn đơn nào đang ở. Kiểm căn đã trống và nhờ buồng phòng dọn căn này; dọn xong là nhận phòng được. Khách không chờ được thì đổi đơn này sang căn trống. Trường hợp này không có ngoại lệ. | Room {room} still shows as occupied, but no stay is in house. Check the room is empty and ask housekeeping to clean it; once it's cleaned, check-in can go ahead. If the guest can't wait, move this booking to a vacant room. No exception applies in this case. | Như trên, `detail = OD`: căn đã ở "cần dọn", Desk không có nút Báo cần dọn |

Ghi chú:
- Bỏ vế "báo quản lý để sửa trạng thái căn": lễ tân tự đưa căn về quy trình dọn được. Quản lý vẫn thấy căn lệch ở Cần chú ý (BR-806: OC/OD mà không có đơn Đang ở).
- Giữ "Kiểm căn đã trống" (DOM: kiểm thật không còn người, đồ trước khi chuyển trạng thái).
- Ghi chú khóa trong `gen_strings.py`: thay "v1.0.5 có nút Cần dọn thì UXD đổi câu" bằng "v1.0.5 V5-15: theo nút Báo cần dọn (UXD-on-fe-prs-98-102-107)".
- `checkin.room_occupied` (máy chủ không trả `cause`) giữ nguyên ở v1.0.5: máy chủ đã trả `cause`, câu chỉ còn cho ca lạ, vẫn đúng.
- Độ dài: `room_status_stuck` VI 262, EN 300 ký tự, ngang `room_occupied` (VI 248, EN 296). Câu nằm trong Alert ở dòng điều kiện, không có chỗ khác chật hơn.

### 9.8 Mã giao dịch trông giống số thẻ – 422 ở ô `bankReference` (C0313-25) – bản 1.8

Nguồn: `rounds/round-05/responses/SEC-responses.md` mục 4 (07/11), SEC chọn (a). Chữ Desk nội bộ, không cần CPY.

Luật mới (SEC 4.1, BE-B làm ở PR-B3) áp cho ô mã giao dịch ở mọi đường `PaymentCreate` (qua `recordInTx`) và ở `executeRefund`:
- máy chủ bỏ `.` `/` `_` `-` khỏi giá trị;
- phần còn lại **toàn bộ** là 13–19 chữ số **và** qua Luhn thì trả 422 `CARD_NUMBER_DETECTED`, `errors[0].field` = `bankReference`. Không lưu gì, không lặp lại giá trị;
- mã có chữ, dãy số ngắn hơn 13 hay dài hơn 19, dãy không qua Luhn thì nhận.

Khoảng 10 % mã ngân hàng toàn số vẫn bị chặn nhầm (SEC chấp nhận). Câu dưới đây là lối ra cho ca đó (SEC 4.2).

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `pay.bank_reference_card_like` | Mới (1.8) | Mã này trông giống số thẻ thanh toán nên Desk không lưu. Nhập 8 chữ số cuối của mã giao dịch. | This looks like a card number, so Desk can't save it. Enter the last 8 digits of the transaction reference. | Lỗi dưới ô mã giao dịch, khi 422 `CARD_NUMBER_DETECTED` có `field` = `bankReference`. Hai chỗ: ô `pay.bank_reference_optional` ở mọi hộp ghi khoản thu (lên cùng PR-B3, mục 9.1), và ô `refund.bank_reference` ở hộp Ghi đã hoàn chuyển khoản / qua máy POS (`MoneyPage.tsx`, đang chạy trên production) |

Cách chọn chữ:
- **"trông giống"**: không khẳng định đó là số thẻ, vì có thể là mã thật bị chặn nhầm. Câu nói việc Desk làm và bước tiếp theo, không nói người dùng sai.
- **"số thẻ thanh toán"**: cùng chữ với `error.CARD_NUMBER_DETECTED` hiện có, để một luật chỉ có một tên trên Desk. EN "card number" cũng vậy.
- **"mã giao dịch"** thay cho "mã chuyển khoản": khớp nhãn ô người dùng đang nhìn ("Mã giao dịch ngân hàng (nếu ảnh có)", "Mã giao dịch ngân hàng / mã hoàn POS"). Hộp chi hoàn còn nhận cả mã hoàn POS.
- **"8 chữ số cuối"** thay cho "8 ký tự cuối" (gợi ý SEC 4.2):
  - giá trị bị chặn luôn chỉ gồm chữ số và các dấu `.` `/` `_` `-`;
  - đếm ký tự thì người gõ "4111-1111-…" và người gõ liền ra hai mã khác nhau, nên chặn trùng S4 (`DUPLICATE_BANK_REFERENCE`) không bắt được. Đếm chữ số thì ai cũng nhập cùng 8 số;
  - 8 chữ số vẫn dưới 13 nên không bao giờ bị chặn lại, và đủ để tìm trên sao kê;
  - không đổi luật máy chủ. Đề nghị SEC xem lại ý này khi review PR-B3.
- **Không gợi ý để trống ô** (SEC 4.2): để trống thì khoản thu mất chặn trùng S4, và `executeRefund` bắt buộc ô này.
- **Câu không có biến.** Không chèn giá trị đã gõ vào câu, toast hay log (SEC 4.1).
- Độ dài: VI 93, EN 107 ký tự, dài hơn `error.CARD_NUMBER_DETECTED` (VI 85, EN 95) chút ít. Chưa đo trên màn: UXD kiểm xuống dòng ở hộp chi hoàn (cỡ `sm`, 390 và 1440 px) khi review PR.

Hiển thị theo Design System, không thêm màu:
- **Dưới ô:** dùng `Field error` hiện có (`.err`: icon ✕ cùng chữ màu `--bad` trên `--surface`, 5,76:1 ở chế độ sáng, 6,27:1 ở chế độ tối; có icon theo HR-11). Ô có `aria-invalid`, câu nối qua `aria-describedby` như mọi lỗi ô.
- **Khung lỗi của hộp:** đi theo đúng cách hộp đó xử lý 422 `VALIDATION_FAILED`.
  - Hộp có danh sách ô (`map`): khung hiện `error.VALIDATION_FAILED` ("Còn {n} ô cần sửa…").
  - Hộp không có `map` (hộp chi hoàn hiện nay, `useSubmit()`): khung lặp lại câu trên, như các lỗi ô khác của hộp này.
  - Không hiện `error.CARD_NUMBER_DETECTED` ở ca này. Câu đó nói về ô ghi chú và bảo xóa dãy số, trái SEC 4.2.
- **Không tự xóa ô.** Người dùng xóa phần đầu, giữ 8 chữ số cuối.
- Ô ghi chú, lý do và mọi ô chữ tự do giữ `error.CARD_NUMBER_DETECTED` như cũ (luật chung V-09 không đổi).

FE:
- `app/problem.ts`, `fieldErrorText`: hàm đang tra theo mã, không theo ô, nên `bankReference` + `CARD_NUMBER_DETECTED` hiện rơi về `error.CARD_NUMBER_DETECTED`. Thêm nhánh theo cặp (ô, mã), xét trước danh sách hiện có.
- `pages/stay/common.tsx`, `useSubmit().text`: `CARD_NUMBER_DETECTED` mà mọi `errors[]` đều là `bankReference` thì đi nhánh `VALIDATION_FAILED`.

**Bản 2.1 – xác nhận câu chuẩn.** Câu chuẩn là câu ở bảng trên, "8 chữ số cuối" / "last 8 digits". SEC đã nhận cách viết này (`rounds/round-05/reviews/SEC-on-prs-111-118-122.md`, FB-R5-SEC-ARC-24). Hợp đồng trên `main` (sau #111) còn ghi "8 ký tự cuối" ở hai chỗ: `openapi.yaml`, mô tả `recordPayment` (B), câu "Câu báo chỉ cách nhập 8 ký tự cuối của mã (UXD)" (cùng tệp sinh `api-client/src/generated/openapi.ts`); và `contract-0.3.13.md`, bảng "Ai làm tiếp", dòng BE C0313-25. ARC đổi thành "8 chữ số cuối (UXD `pay.bank_reference_card_like`)" ở lượt tài liệu tới (thẻ FB-R5-UXD-ARC-111-01). Không đổi luật máy chủ, không đổi câu Desk.

### 9.9 Nhắc D12c ở ô lý do của hộp Trả phòng quá ngày đi (V5-15) – bản 1.9

Nguồn: `rounds/round-05/reviews/SEC-on-be-prs-106-99-checkout.md` mục 2.5 (BE PR #99, PR-A1b). Chữ Desk nội bộ, không cần CPY.

Ca: chỉ chủ đầu tư và quản lý trả phòng được đơn đã quá ngày đi (MGR khi `nightsNotBilled` ≤ 1). Hộp bắt buộc ô lý do `overdueReason`, 3–500 ký tự. Desk gợi ý 3 lý do (DOM 7.1): "Khách đi không báo", "Lễ tân quên bấm Trả phòng", "Khác (ghi rõ)". Lý do ghi vào `audit_event.after.overdue.reason`. Bảng này chỉ thêm dòng, không sửa; chỉ xóa cả tháng khi hết hạn lưu, và nằm ngoài luồng xóa dữ liệu khách. Máy chủ chỉ chặn số thẻ (V-09), không chặn số giấy tờ (đúng phạm vi V5-46). Vì vậy SEC chấp nhận rủi ro Low cho v1.0.5, với điều kiện Desk nhắc cạnh ô lý do (D12c): không ghi họ tên, số giấy tờ, thông tin sức khỏe của khách.

Đã rà chữ có sẵn để dùng lại. Không câu nào đủ ba ý SEC yêu cầu:
- `crm.note_hint` "Không ghi số giấy tờ, số thẻ, thông tin sức khỏe.": thiếu họ tên;
- `webreq.note_hint`: chỉ có số thẻ, số giấy tờ;
- `rsv.after_cancel.note_hint`: nói tên khách, tên người chuyển, số tài khoản, không có giấy tờ, sức khỏe.

Vì vậy thêm một khóa. Câu theo cùng dạng "Không ghi …" của `crm.note_hint`, mở đầu bằng ý của `stay.time_note_help` ("Ghi chú lưu vào nhật ký thay đổi.").

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `checkout.overdue_reason_help` | Mới (1.9) | Lý do lưu vào nhật ký thay đổi. Không ghi họ tên, số giấy tờ hay thông tin sức khỏe của khách. | The reason is kept in the change log. Don't write the guest's name, ID numbers or health information. | Chữ gợi ý dưới ô lý do (`overdueReason`) ở hộp Trả phòng quá ngày đi. Luôn hiện, cả khi đã chọn một trong 3 lý do gợi ý. Chỉ OWN, MGR thấy hộp này |

Cách chọn chữ:
- Câu đầu nói vì sao: lý do nằm lại trong nhật ký thay đổi. Người ghi hiểu vì sao không nên ghi, không cần nói tới "append-only" hay "audit".
- Ba ý đúng như điều kiện SEC. Không thêm "số thẻ": máy chủ đã chặn và có câu lỗi riêng. Thêm vào thì câu dài mà không thêm việc cho người ghi.
- "của khách" ở cuối áp cho cả ba ý. EN theo `crm.note_hint` ("ID numbers", "health information"), dùng "Don't" như các câu Desk mới.
- Độ dài: VI 94, EN 101 ký tự. Chưa đo trên màn: UXD kiểm xuống dòng ở 390 và 1440 px khi review PR FE.

Hiển thị theo Design System, không thêm màu:
- Dùng chữ gợi ý `Field help` có sẵn (`.help`: 12 px, `--muted` = Stone Grey trên `--surface`). Không dùng Alert, không dùng màu cảnh báo: đây là lời nhắc thường trực, không phải lỗi.
- `Field` đã nối `help` vào `aria-describedby`, nên trình đọc màn hình đọc câu cùng ô.
- Không thêm biến. Không chặn nút: máy chủ nhận chữ tự do (DOM 7.1).

Ghi chú cho FE (không thêm khóa ở lượt này):
- `overdueReason` có số thẻ thì 422 `CARD_NUMBER_DETECTED`, `field` = `overdueReason`. Câu hiện có `error.CARD_NUMBER_DETECTED` bắt đầu bằng "Ô ghi chú…", nên ở ô lý do đọc hơi lệch tên ô nhưng vẫn đúng việc cần làm (xóa dãy số). Giữ như các ô lý do khác.
- Nhãn ô, 3 lý do gợi ý và tiêu đề hộp chưa có trong `design/copy`. FE-A viết theo chữ DOM 7.1 rồi gửi UXD duyệt, như cách làm ở #98, #102. Cần UXD viết trước thì ORC giao thêm.

### 9.10 2FA của lễ tân trưởng (V5-40), giữ chỗ theo giá gõ (V5-14), nút Báo cần dọn trên app nhân viên (V5-15) – bản 2.0

Nguồn: `rounds/round-05/reviews/UXD-on-prs-97-116-117-118-122.md` (#118 @ `e96070a1`, #122 @ `6dd07bf5`, #97 @ `d3081f93`, #117 đã gộp `04fda0bb`). Chữ màn nhân viên, không cần CPY.

**2FA không kể tên vai (V5-40, #118; thẻ FB-R5-UXD-FE-PR118-01).** Từ v1.0.5, máy chủ bắt lễ tân trưởng bật 2FA (`MFA_REQUIRED_ROLES` = owner, manager, front_desk_lead). Desk đọc cờ máy chủ, nên lễ tân trưởng thấy cả 3 câu dưới đây, mà câu cũ chỉ nói "chủ đầu tư và quản lý".

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `mfa.enroll_required` | Sửa | Vai của bạn bắt buộc bật xác thực 2 bước. Bật xong bạn vào làm việc như thường. | Your role requires 2‑step verification. Once it is on, you can continue as usual. | Khung đầu màn Bật xác thực 2 bước khi `Me.mfaEnrollmentRequired` |
| `mfa.required_note` | Sửa | Bắt buộc với vai của bạn. | Required for your role. | Trang Bảo mật tài khoản, khi `getMy2fa.required` |
| `mfa.nudge` | Sửa | Tài khoản của bạn chưa bật xác thực 2 bước. Từ khi có dữ liệu khách thật, Desk chỉ cho làm việc sau khi bật. | Your account doesn't have 2‑step verification yet. Once real guest data is in the app, Desk only lets you work after it is on. | Băng nhắc đầu trang (`mfaRequiredButMissing`) và khung warn ở Bảo mật tài khoản (`required` và chưa bật). Nút đi kèm giữ `mfa.nudge_cta` "Bật ngay" |

Cách chọn chữ:
- **Không kể tên vai.** Câu chỉ hiện cho chính người phải bật. Danh sách vai là hằng số máy chủ; kể tên thì lần sau đổi danh sách, chữ lại sai mà không ai thấy, như lần này.
- **"Vai của bạn"** ở hai câu bắt buộc: nói được lý do (theo vai), không cần biết người đọc là ai.
- **`mfa.nudge` nói sự thật trước** ("chưa bật"), rồi hệ quả cụ thể khi Desk ép: phiên chỉ còn màn bật 2 bước (SEC 06.4). Câu cũ "nên bật" đứng ngay dưới "Bắt buộc…" ở trang Bảo mật, nên hai câu ngược nhau.
- EN dùng U+2011 trong "2‑step" (mục 4.15). Hai khóa `mfa.enroll_required`, `mfa.nudge` coi như đã làm phần 4.15 khi áp ở đây.
- Giữ nguyên: `secnudge.both`, `secmail.missing` (chỉ chủ đầu tư, quản lý thấy, vì email bảo mật không đổi với V5-40); `staff.mfa_enroll_desk` (không kể vai).
- Độ dài: `mfa.nudge` VI 108, EN 126 ký tự, ngang câu cũ (113, 124).
- Ghi chú khóa trong `gen_strings.py`: thêm "v1.0.5 V5-40: không kể tên vai (UXD-on-prs-97-116-117-118-122)".

**Giữ chỗ theo giá gõ (V5-14, #122; thẻ PR122-04).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `booking.hold.typed_rate_locked` | Xóa | – | – | #122 bỏ khóa nút Giữ chỗ và dòng lý do. Không còn chỗ dùng |
| `bk.src_typed` | Ghi chú (chữ giữ "Giá đã gõ" / "Typed rate") | – | – | Ghi chú mới: "v1.0.4 booking (UXD-on-v104-src-typed). Cột Nguồn giá H09: đêm có ô lễ tân đã gõ và còn số (ratesEdited && rates), mọi kênh, không phụ thuộc bản xem. Máy chủ ghi manual (NightRate.edited). v1.0.5 V5-14: Giữ chỗ cũng giữ giá này. Cùng cụm 'giá đã gõ' với booking.rates_cleared_*" |

Câu sàn–trần khi gõ giá (PR122-01): dùng nguyên 3 dòng ở mục 3 (`booking.error.rate_range`, `error.RATE_OUT_OF_RANGE`, `booking.error.rate_out_of_range_dates`), `{min}`, `{max}` qua `money()`. Không thêm khóa.

**Nút Báo cần dọn trên app nhân viên (V5-15, #97; thẻ PR97-02, PR97-03).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `hk.queue.r.time_report` | Mới (nên có) | Chưa ghi được vì giờ bấm ({time}) lệch quá xa giờ hiện tại. Nếu căn vẫn cần dọn, bấm "Gửi lại" để báo theo giờ bây giờ. | Not recorded: the time you tapped ({time}) is too far from the current time. If the room still needs cleaning, tap "Send again" to report it now. | `rejectionText`, 422 `PERFORMED_AT_OUT_OF_RANGE` khi `actionKey` = `hk.action.needs_cleaning`. Bước khác giữ `hk.queue.r.time`. `{time}` như `hk.queue.r.time` |
| `hk.needs_cleaning_help` | Mới (nên có) | Bấm Báo cần dọn khi khách xin dọn thêm hoặc căn cần dọn lại. Căn chuyển "Khách đang ở – cần dọn" và có việc dọn. | Tap Mark for cleaning when the guest asks for another clean or the room needs cleaning again. The room becomes "Guest staying – needs cleaning" and gets a cleaning task. | Thẻ `hk-info` của H20, khi nút Báo cần dọn hiện. Cùng mẫu `hk.finish_help_occupied` |

Ghi chú:
- Tên nút trong câu khớp nguyên văn `hk.action.needs_cleaning`; tên trạng thái khớp `hk.status.OD`. Đổi một trong hai thì đổi câu.
- Vị trí nút (PR97-01, không phải chữ): trong thân màn, ngay trên "Báo sự cố căn này", nút phụ `btn xl block`, icon `broom`. Không đặt ở ô nút chính chân màn.

**Ghi chú khóa, không đổi chữ.**

| Khóa | Ghi chú mới | Nguồn |
|---|---|---|
| `staff.notif.k.hold_expired` | "P4-40 DOM A.5. kind hold_expired: người tạo + người chốt + mọi tài khoản đang hoạt động có vai FD, FDL tại cơ sở (0.3.13 bổ sung 1, DOM mục 9; v1.0.5 V5-1B)" | FB-R5-ARC-UXD-117-01. MOB áp ở lượt sinh lại khi gộp `main` vào #97 |
| `hk.action.needs_cleaning` | Ghép ghi chú #102 và #97, chữ ở review mục 4.5 | ARC MRG-01. PR gộp sau giữ một dòng |

Biểu tượng hộp thư app nhân viên (thẻ ARC FB-R5-ARC-MOB-117-01, UXD chọn): `hold_expired` → `x`; `hold_overdue_with_deposit`, `hold_overdue_cap` → `clock`.

Tiêu đề "Khách đi" theo `departuresDate` (#118): "Khách đi ({n}) · {weekdayDate}", ghép trong mã bằng " · ". Không thêm khóa.

### 9.11 Nhật ký tiền: "Không thấy tiền" ở dòng Tiền về cho đơn đã hủy (SEC ARC-20, #111) – bản 2.1

ARC thêm khóa `mlog.a_money_not_found` ở PR #111 (`eeb78698`, gộp `ce404dd6`) với câu tạm, ghi "UXD rà". UXD chốt chữ và đã áp trên `main` cùng commit bản 2.1 (`gen_strings.py`, sinh lại, dòng `content-guide.md`). Test `v104-money-labels-fea.test.tsx` so bằng `tv(key)` nên không phải sửa.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `mlog.a_money_not_found` | Mới (ARC đặt tạm, UXD chốt 2.1) | Không thấy tiền về cho đơn đã hủy | Money not received for cancelled booking | Cột Thao tác ở Nhật ký tiền: `attention_event.resolved` khi `after.kind = deposit_after_cancel` |
| `today.money_after_cancel_not_found` | Sửa EN (khóa 9.1, chưa có trong mã) | Không thấy tiền | Money not received | Như 9.1 |

Câu tạm: VI "Đóng mục Tiền về cho đơn đã hủy – không thấy tiền", EN "Closed 'Money for a cancelled booking' – money not found".

Cách chọn chữ:
- **Ghi việc về tiền, không ghi thao tác màn hình.** Câu tạm dài 49 ký tự và kể cả "đóng mục", điều người đọc Nhật ký tiền không cần. Các câu `mlog.a_*` khác ghi việc về tiền: "Mã VietQR hết hạn – chưa thu", "Giữ cọc – khách không đến".
- **Ghép hai chữ người dùng đã thấy:** tên nút "Không thấy tiền" và tiêu đề dòng Cần chú ý "Tiền về cho đơn đã hủy {code}". Mã đơn đã có ở cột Mã, nên câu không có biến.
- **EN tạm có hai lỗi:**
  - "Money for a cancelled booking" không khớp tiêu đề EN "Money received for cancelled booking {code}";
  - đặt cạnh "money not found" thì câu thành "tiền đã về… không thấy tiền".

  Câu mới theo kiểu EN của nhóm (danh từ + phân từ, như "Payment recorded", "VietQR code expired – not paid"), không dấu nháy đơn.
- **Cùng chữ VI thì cùng chữ EN.** Desk đã có nút "Không thấy tiền" ở đối soát (`co.recon_missing`, EN "Money not received"). Nút ở Cần chú ý (9.1) trước ghi EN "Money not found". Bản 2.1 đổi về "Money not received". Khóa này chưa có trong mã nhánh nào, nên đổi không tốn công.
- Độ dài: VI 33, EN 40 ký tự.

FE (nên có): `MoneyPage.tsx`, `ACTION_KEY` chọn câu chỉ theo `action`.
- Hôm nay đúng: SEC ARC-20 chỉ đưa `attention_event.resolved` của `deposit_after_cancel` vào tập `money`.
- Nếu sau này loại mục Cần chú ý khác cũng vào tập `money`, câu sẽ nói sai.
- Đề xuất: chọn `mlog.a_money_not_found` khi `after.kind === 'deposit_after_cancel'`. Khác thì dùng `mlog.a_other` kèm mã ở chữ nhỏ, như mã lạ. Thêm một ca `kind` khác vào test trên.

### 9.12 Nhãn lý do hoàn (V5-13) và câu theo `lockReason` (V5-44) – bản 2.1

Căn cứ:
- DOM FB-R5-DOM-UXD-112-01 và bảng nghĩa `lockReason` (`rounds/round-05/reviews/DOM-on-prs-112-121-122.md` mục 2.2);
- mã PR #112 (`r5-b1` @ `a2378981`): `folio-locked.ts`, các chỗ ném `folioLocked(...)`, `openRefundsByReason`;
- hợp đồng `main`: `OpenRefund.reasonCode`, `Problem.lockReason`, `CancelReasonCode`.

**Nhãn lý do hoàn.** Một mã, một nhãn ở mọi chỗ:
- cột Lý do (Cần duyệt, Hoàn tiền);
- dòng chờ hoàn ở Trả phòng và folio;
- khung đơn.

3 trong 6 nhóm đã có nhãn từ v1.0.4 (P4-41) và bản 1.5. Giữ nguyên chữ.

| Nhóm (DOM) | `reasonCode` | Khóa | Kiểu | VI | EN |
|---|---|---|---|---|---|
| Trả phòng sớm | `early_departure` | `audit.reason.early_departure` | Có (P4-41) | Hoàn khi trả sớm | Early departure refund |
| Khách trả dư | `overpayment` | `audit.reason.overpayment` | Có (P4-41) | Hoàn tiền khách trả thừa | Overpayment refund |
| Chuyển khách vì OTTIMO hết căn | `overbooking_relocated` | `audit.reason.overbooking_relocated` | Mới | Hoàn khi chuyển khách sang nơi khác | Refund for moving the guest elsewhere |
| Tiền về sau khi hủy | `payment_after_cancel` | `audit.reason.payment_after_cancel` | Có (1.5, mục 9.1) | Tiền về sau khi hủy | Money received after cancellation |
| Hoàn khi hủy đơn | mọi `CancelReasonCode` trừ `overbooking_relocated`, và `no_show` | `audit.reason.cancellation` | Mới | Hoàn khi hủy hoặc không đến | Cancellation or no-show refund |
| Hoàn tiền | mã nhập tay, mã lạ | `audit.reason.refund_other` | Mới | Hoàn tiền | Refund |

Cách chọn chữ:
- **"Khách trả dư" → giữ "trả thừa".** Desk dùng "trả thừa" ở mọi câu Trả sớm, bill và hoàn tiền. Thêm "trả dư" thì một việc có hai tên.
- **"Trả phòng sớm" → giữ "Hoàn khi trả sớm".** "Trả phòng sớm" đã là lý do của dòng folio (`mlog.reason.early_departure`). Nhãn hoàn phải khác để cột Lý do không lẫn; P4-41 đã tách như vậy.
- **"Chuyển khách vì OTTIMO hết căn" → "Hoàn khi chuyển khách sang nơi khác".**
  - Desk không dùng "quá tải phòng", "overbooking" (ghi chú UXD 18/10 ở `mlog.reason.overbooking_relocated`). "Hết căn" đứng trên màn tiền dễ đọc thành lỗi của lễ tân.
  - Cùng cụm "chuyển khách sang nơi khác" với `mlog.reason.overbooking_relocated` và `mlog.a_relocation_cost`.
  - Bỏ phần "(xung đột OTA)" cho nhãn ngắn. Người duyệt xem nguồn trên đơn.
- **"Hoàn khi hủy đơn" → thêm "hoặc không đến".** DOM xếp `no_show` (B11) vào nhóm này. "Không đến" khớp nhãn trạng thái `no_show`. Không ghi lý do hủy cụ thể: lý do đã nằm trên đơn, và mỗi mã hủy mới không phải thêm nhãn (DOM).
- **"Hoàn tiền":** đúng nhãn chung hợp đồng đã ghi cho mã lạ.

Cách FE chọn nhãn: một hàm dùng chung, thay `REFUND_REASON` trong `app/auditReason.ts`. Xét theo thứ tự:
1. `early_departure`, `overpayment`, `overbooking_relocated`, `payment_after_cancel` → nhãn riêng. `overbooking_relocated` phải xét trước bước 2, vì mã này cũng nằm trong `CancelReasonCode`.
2. Giá trị của `CancelReasonCode`, hoặc `no_show` → `audit.reason.cancellation`. Lấy danh sách mã từ `@ottimo/contracts`, không chép tay.
3. Còn lại → `audit.reason.refund_other`. Không bao giờ hiện mã.

Thêm:
- Cột Lý do: nhãn, rồi `reasonNote` sau nhãn như hiện nay. Từ nay yêu cầu hoàn nào cũng có nhãn. Trước đây yêu cầu mang mã hủy chỉ có ghi chú.
- Máy chủ trả `openRefunds` theo từng mã, xếp theo chữ cái (PR #112). FE cộng `openVnd` theo nhóm nhãn, rồi xếp theo thứ tự bảng trên. Ví dụ: `found_other` và `price` ra **một** dòng "Hoàn khi hủy hoặc không đến".
- Hỏi ARC (thẻ FB-R5-UXD-ARC-112-02): `other` là một giá trị của `CancelReasonCode`. Nếu mã nhập tay của A32 cũng có thể là `other`, bước 2 sẽ gắn nhầm nhãn hủy. Đề xuất hợp đồng 0.3.14 ghi rõ mã nhập tay không dùng lại giá trị của `CancelReasonCode`.

**Chỗ hiện tổng chờ hoàn** (V5-13, UXD U4):

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `folio.open_refunds_total` | Mới | Đang chờ hoàn cho khách | Refund pending for the guest | Dòng tổng ở bước ③ Bill, màn Kết quả của Trả phòng và phần tổng của folio. Cột tiền = Σ `openRefunds`. Dưới dòng tổng: mỗi nhóm một dòng `tr.sub` (nhãn bảng trên + số), rồi `folio.open_refunds_may_decrease` (bản 2.3, mục 9.14 (b); bản 2.1 ghi `approvals.refund_may_decrease`). Σ = 0 thì không hiện |
| `drawer.folio.open_refunds` | Mới | Đang chờ hoàn | Refund pending | Dòng ở thẻ Folio của khung đơn, dưới "Còn phải thu" (U4). Chỉ số tổng, không tách nhóm. Vai không nhận trường (SAL, CTV) hoặc Σ = 0 thì không hiện |
| `checkout.pending_refund_unavailable` | Sửa | Chưa tải được khoản chờ hoàn của đơn. Hỏi quản lý trước khi báo khách. | Couldn't load the refunds pending for this booking. Ask a manager before telling the guest. | Như cũ (U5). Bỏ "từ Trả sớm", vì nay tính mọi lý do |
| `checkout.pending_refund_line` | Xóa (khi V5-13 lên) | – | – | Câu có "(yêu cầu từ Trả sớm)", chỉ đúng với một lý do. Hai khóa đầu bảng thay câu này |

**Câu theo `lockReason`** (409 `FOLIO_LOCKED`):

| `lockReason` | Khóa | Kiểu | VI | EN |
|---|---|---|---|---|
| `closed` | `error.FOLIO_LOCKED_closed` | Mới | Folio đã đóng. Không ai thêm hay điều chỉnh dòng được nữa, kể cả quản lý. Khoản còn nợ: dùng Thu công nợ, hoặc quản lý Xóa công nợ. Cần chỉnh tiền khác: báo chủ đầu tư. | This folio is closed. No one can add or adjust lines any more, managers included. If an amount is still owed, use Collect debt, or ask a manager to Write off debt. For any other money correction, tell the owner. |
| `settled` – FD, FDL | `error.FOLIO_LOCKED_settled` | Mới | Folio đã chốt khi trả phòng nên không nhận thao tác này. Cần sửa số tiền hoặc hoàn cho khách: nhờ quản lý. | The folio was settled at check-out, so it doesn't take this action. To correct an amount or refund the guest, ask a manager. |
| `settled` – OWN, MGR | `error.FOLIO_LOCKED_settled_mgr` | Mới | Folio đã chốt khi trả phòng nên không nhận thao tác này. Cần sửa số tiền: dùng Điều chỉnh trên folio, hoặc tạo yêu cầu hoàn. | The folio was settled at check-out, so it doesn't take this action. To correct an amount, use Adjust on the folio, or create a refund request. |
| `post_checkout_window_over` | `error.FOLIO_LOCKED_window_over` | Mới | Đã hết hạn ghi phát sinh sau trả phòng nên folio không nhận thêm dòng hay điều chỉnh nào, kể cả của quản lý. Ghi sổ giao ca kèm mã đơn và báo chủ đầu tư. Không thu tiền ngoài Desk. | The time for post‑check‑out charges is over, so the folio takes no more lines or adjustments, managers included. Note it in the shift log with the booking code and tell the owner. Don't take payment outside Desk. |
| `debt_reduction_requires_write_off` | `folio.adjust_debt_locked` (OWN, MGR); `folio.debt_fd` (vai khác, phòng hờ) | Sửa | Xem bảng dưới | Xem bảng dưới |
| `invoice_issued` | `error.FOLIO_LOCKED_invoice_issued` | Mới | Hóa đơn điện tử của folio này đã phát hành nên Desk không đổi thông tin hóa đơn được nữa. Cần sửa hóa đơn: báo chủ đầu tư để điều chỉnh hoặc thay thế theo quy định. | The e‑invoice for this folio has been issued, so Desk can't change the invoice details any more. To correct the invoice, tell the owner so it can be adjusted or replaced as required. |
| giá trị lạ hoặc vắng | `error.FOLIO_LOCKED` | Sửa VI | Folio đã khóa. Không ai thêm hay điều chỉnh dòng được nữa, kể cả quản lý. Khoản còn nợ: dùng Thu công nợ, hoặc quản lý Xóa công nợ. | Giữ nguyên |

Sửa câu công nợ (`debt_reduction_requires_write_off`):

| Khóa | VI | EN |
|---|---|---|
| `folio.adjust_debt_locked` | Chưa ghi điều chỉnh. Đơn còn công nợ nên chỉ giảm được phát sinh còn trong hạn sửa, không giảm vào phần nợ. Muốn giảm số phải thu, dùng Xóa công nợ. | Adjustment not recorded. This booking has an open debt, so you can only reduce charges still open for correction, not the debt itself. To reduce what is owed, use Write off debt. |
| `folio.debt_fd` | Chưa ghi điều chỉnh. Đơn còn công nợ nên chỉ giảm được phát sinh còn trong hạn sửa, không giảm vào phần nợ. Muốn giảm số phải thu, nhờ quản lý hoặc chủ đầu tư dùng Xóa công nợ. | Adjustment not recorded. This booking has an open debt, so only charges still open for correction can be reduced, not the debt itself. To reduce what is owed, ask a manager or the owner to use Write off debt. |

Cách chọn chữ:
- **`settled` cần câu riêng.** Câu chung `error.FOLIO_LOCKED` nói "kể cả quản lý", nhưng folio đã chốt thì quản lý vẫn Điều chỉnh được (A32). Câu chung vì thế nói sai ở ca này. Có hai bản theo vai, như `folio.settled_mgr` / `folio.settled_fd`. Bản lễ tân không kể A32, chỉ chỉ người làm được.
- **`closed`, `post_checkout_window_over`:** giữ ý "kể cả quản lý" của câu chung, thêm bước tiếp theo theo DOM 2.2. "Sổ giao ca" là tên sổ trong sổ tay vận hành và tờ nhân viên. "Không thu tiền ngoài Desk" là câu DOM dặn.
- **`invoice_issued`:** "Hóa đơn" chỉ dùng cho hóa đơn điện tử (bảng thuật ngữ). Không nêu tên thủ tục; "theo quy định" đủ cho người đọc biết đây không phải việc của quầy.
- **Công nợ:** câu cũ "chỉ ghi được điều chỉnh tăng, không giảm hay bỏ dòng" là luật N-7 của R2. Từ BR-525 (chu kỳ nợ, từ 0076), máy chủ cho giảm trong phạm vi các phát sinh còn trong hạn sửa, và chỉ từ chối phần vượt (`folio-lines.service.ts`). Câu mới nói đúng phần bị từ chối. Nợ ghi trước 0076 không giảm được dòng nào; câu vẫn đúng, vì khi đó không có phát sinh nào còn trong hạn sửa. DOM xác nhận cụm "phát sinh còn trong hạn sửa" khi đọc bảng này.
- **Câu chung sửa VI "Phiếu thanh toán" → "Folio":** bảng thuật ngữ (content-guide mục 3) dùng "Phiếu thanh toán" cho bill đưa khách, "Folio" cho Desk. Bốn câu mới đều nói "Folio", nên câu chung đổi theo. EN đã là "folio".
- EN dùng U+2011 trong "post‑check‑out", "e‑invoice" (mục 4.15).
- Độ dài: câu dài nhất là `_window_over`, VI 180, EN 212 ký tự. Câu hiện trong Alert của hộp, không trong toast.

Cách FE chọn câu:
- Theo `lockReason`, không đọc `detail` (V5-44). Trong `FolioDialog.tsx`:
  - `debtRule` (đang dò `/BR-525|debt_write_off/`) → `lockReason === 'debt_reduction_requires_write_off'`;
  - `windowOver` → `lockReason === 'post_checkout_window_over'` hoặc `'closed'`.
- `settled`: chọn `_settled` hay `_settled_mgr` theo vai.
- Khung "đã khóa" trong FolioDialog (đang hiện `error.FOLIO_LOCKED`): folio `closed` → `_closed`; sau 409 cửa sổ → `_window_over`.
- Giá trị lạ hoặc vắng (máy chủ cũ): `error.FOLIO_LOCKED`.
- Nút: giữ như hiện có (Xóa công nợ cho OWN, MGR ở ca công nợ). Câu khác không thêm nút.
- Hiển thị theo DS hiện có: khung trạng thái dùng `Alert info`; lỗi sau khi bấm đi theo cách hộp đó đang xử lý 409. Không thêm màu.

### 9.13 Trả sớm trong 00:00–05:59 (V5-11) – bản 2.2

Căn cứ:
- hợp đồng 0.3.13 mục 1.21 (`rounds/round-05/outputs/ARC/contract-0.3.13.md`, V5-11) và `openapi.yaml`: `earlyDeparture`, `Problem.minNewDepartureDate`, `Problem.useCheckout`, `EarlyDepartureResult`;
- DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 2 (luật 2.1, ví dụ 2.2, ca T-11-1 … T-11-9) và `rounds/round-05/reviews/DOM-on-be-a1-prs-127-114.md` mục 4;
- PR #114 (`r5-a2` @ `f730b691`, chỉ mã máy chủ); mã Desk `main` @ `7e1b6aa1`: `pages/stay/EarlyDepartureDialog.tsx`.

Gọi **W** là khoảng 00:00 tới trước giờ đổi ngày nghiệp vụ (06:00), khi ngày nghiệp vụ vẫn là hôm qua (D). Trong W máy chủ trả hai 409 `INVALID_TRANSITION` có trường gợi ý. Desk v1.0.4 chỉ có câu chung `error.INVALID_TRANSITION_generic`, không nói lễ tân làm gì tiếp.

**Khóa mới.** 4 khóa, UXD đã áp trên `main` (`gen_strings.py`, nhóm "v1.0.5 V5-11"):

| Khóa | Khi nào | VI | EN |
|---|---|---|---|
| `early_departure.err.min_date` | 409 có `minNewDepartureDate` (Ngày rời mới ≤ D). Lỗi dưới ô Ngày rời mới | Đang sau nửa đêm nên đêm qua là đêm khách đã ở. Ngày rời mới sớm nhất là {date}. | It's after midnight, so the guest has already stayed last night. The earliest new departure date is {date}. |
| `early_departure.use_min_date` | Nút phụ ngay dưới câu trên | Dùng {date} | Use {date} |
| `early_departure.use_checkout` | 409 có `useCheckout: true` (ngày đi ≤ ngày lịch). Alert thay nội dung bước | Đang sau nửa đêm của ngày đi – không cần Trả sớm, làm Trả phòng như thường lệ. Chưa ghi gì. | It's after midnight on the departure day – no early departure is needed; check the guest out as usual. Nothing has been recorded. |
| `early_departure.fee_business_date` | Dòng phụ dưới "Phí trả phòng sớm" ở bước ② và sau câu phí ở bước ③. Chỉ trong W, khi phí > 0 | Đang sau nửa đêm nên phí ghi vào ngày nghiệp vụ {date}. | It's after midnight, so the fee is posted on business date {date}. |

- `{date}` đi qua `date()` (content-guide mục 4).
- Nút chính ở ca `useCheckout` dùng lại `early_departure.checkout_now` "Trả phòng ngay" / "Check out now", như bước ③.
- Nhãn phí không đổi: `early_departure.row_fee` "Phí trả phòng sớm (ghi vào folio)". Số là `earlyDepartureFeeVnd` của máy chủ; hợp đồng không thêm trường nào cho phí. `effect_fee`, `done_fee` giữ nguyên.
- Ghi chú khóa đổi (không đổi chữ, không đếm): `new_date_help` ({min} trong W là ngày lịch), `none_possible` (trong W thay bằng `use_checkout`), `checkout_now_hint` và `later_hint` ("hôm nay" trong W là ngày lịch).

Cách chọn chữ:
- **Mở đầu "Đang sau nửa đêm".** Cùng cách nói với `checkout.post_midnight` (V5-10), gần với `notice_after_midnight`. Ba câu cùng mở đầu, nên lễ tân ca đêm nhận ra ngay đây là luật giờ đêm, không phải lỗi máy. EN "It's after midnight", như `checkout.post_midnight`.
- **`err.min_date` nêu lý do bằng việc khách đã ở.** "Đêm qua là đêm khách đã ở" là luật DOM 2.1 (1), nói theo cách lễ tân thấy. Câu không dùng "ngày nghiệp vụ": lễ tân cần biết vì sao không chọn được hôm qua, không cần tên khái niệm. Ngày sớm nhất lấy từ máy chủ, Desk không tự cộng ngày.
- **`use_min_date` chỉ đặt ngày, không gửi lệnh.** Theo mẫu `bk.deposit_use_quote` "Dùng {amount} đ". Lễ tân vẫn tự bấm Xem trước số tiền, vì đổi ngày thì đổi số đêm bỏ và số tiền.
- **`use_checkout` không nhắc phụ thu.** Trang Trả phòng đã hiện `checkout.post_midnight` ("không phụ thu, không tính thêm đêm") khi máy chủ báo cửa sổ sau nửa đêm. Nhắc ở đây là hứa thay trang khác. Ca hiếm ngày đi đã qua (máy chủ xét "≤ ngày lịch") thì Trả phòng có thể còn phụ thu trả muộn. "Như thường lệ" lấy từ `later_hint`. "Chưa ghi gì." theo `preview_note`, vì 409 này cũng có thể đến sau khi bấm Xác nhận trả sớm.
- **`err.min_date` không có "Chưa ghi gì".** Câu nằm dưới ô ở bước ①, hộp không có màn Kết quả, nên lễ tân biết chưa ghi. Câu ngắn đọc nhanh hơn lúc 3 giờ sáng.
- **`fee_business_date` chỉ hiện trong W.** Ngoài W ngày ghi phí là hôm nay, không cần nói. Trong W dòng phí trên folio mang ngày hôm qua (ngày nghiệp vụ, DOM 2.1 (5)). Thiếu câu này, lễ tân và quản lý thấy một dòng "ghi lùi ngày" mà không biết vì sao. Câu theo mẫu `notice_after_midnight`.
- Độ dài: dài nhất là `use_checkout`, VI 91, EN 129 ký tự, hiện trong Alert của hộp, không trong toast. Không "!", không "Vui lòng", không emoji. EN không có cụm cần U+2011.

Cách FE hiện (FE-A, `pages/stay/EarlyDepartureDialog.tsx`, `app/problem.ts`):
- **Thứ tự xét** 409 `INVALID_TRANSITION` của `earlyDeparture`, cả `dryRun` lẫn lần ghi: `useCheckout === true` → `use_checkout`; có `minNewDepartureDate` → `err.min_date`; còn lại → `error.INVALID_TRANSITION_generic` như cũ.
- **`err.min_date`:**
  - lỗi của ô Ngày rời mới (`aria-invalid`, nối `aria-describedby`); ngay dưới là nút phụ `use_min_date` với cùng `{date}`;
  - bấm nút: đặt ô = `minNewDepartureDate`, xóa lỗi, focus ở lại ô;
  - nâng `{min}` của `new_date_help` và kiểm ở client lên ngày này, để câu giúp và câu lỗi nói cùng một ngày;
  - gặp ở lần ghi (bước ②): về bước ①, cùng lỗi, focus ô, như 412.
- **`use_checkout`:**
  - `Alert info` ở đầu thân hộp, thay nội dung bước; ẩn Xem trước số tiền và Xác nhận trả sớm;
  - chân hộp: Đóng, và nút chính Trả phòng ngay (mở `/reservations/{id}/check-out`) khi đơn tải lại có `check_out` trong `allowedActions`. Không có thì chỉ Đóng;
  - Alert nhận focus, `role="alert"` vì đến sau một lần bấm;
  - mở hộp trong W mà khoảng chọn rỗng (ngày đi ≤ ngày lịch, ví dụ mở từ liên kết cũ): hiện câu này thay `none_possible`, không gọi máy chủ.
- **Sửa ở bước ③ để chữ đúng.** `canCheckOut` đang so `leaving === today`, với `today` = ngày nghiệp vụ. Trong W, Trả sớm về ngày lịch (03:00 ngày 21/10, ngày nghiệp vụ 20/10) sẽ:
  - hiện `later_hint` "Khách trả phòng ngày 21/10 như thường lệ – nút Trả phòng hiện vào ngày đó." Câu này sai, vì đã là ngày đó và máy chủ đã cho trả phòng (V5-10);
  - và mất nút Trả phòng ngay.

  Trong W, FE so với ngày lịch, hoặc chỉ dựa vào `allowedActions` có `check_out`.
- **`fee_business_date`:**
  - `{date}` = ngày nghiệp vụ hiện tại (`useBusinessDay`). Hợp đồng không có trường ngày dịch vụ của phí. Máy chủ ghi theo ngày nghiệp vụ lúc thao tác, nên hai ngày trùng nhau;
  - ở bước ③, đọc lại `useBusinessDay` lúc nhận kết quả (ca xem trước 05:59, xác nhận sau 06:00);
  - "đang trong W" = ngày nghiệp vụ < ngày lịch theo múi giờ khách sạn, cùng `rollover` như `checkoutInstant` (`app/dates.ts`).
- Theo DS hiện có: `Alert info`, nút phụ cùng kiểu nút `bk.deposit_use_quote`. Không thêm màu.

### 9.14 Chữ chốt sau review FE-3 Desk (#134, #137, #141) – bản 2.3

Căn cứ:
- `rounds/round-05/reviews/UXD-on-fe3-prs-134-137-141.md` mục 2 (đo trên mock, ở đúng SHA từng PR);
- hợp đồng 0.3.13: `Reservation.depositUnverifiedVnd` (mục 1.6), `OpenRefund`, `Folio.totals.openRefunds`, `Problem.reservationStatus`;
- ARC `rounds/round-05/reviews/ARC-on-fe3-prs-134-137-141.md` mục 5.1 (`OpenRefund.awaitingDecision` ở 0.3.14).

FE-3 áp cả 3 dòng trong PR (`gen_strings.py`, sinh lại). UXD không áp trên `main`: hai khóa đầu chỉ có trong nhánh #141, #134, và cả 3 PR đang sửa `gen_strings.py`. Dòng `gen_strings.py` đầy đủ (kèm ghi chú khóa) nằm ở thẻ 134-01, 137-01, 141-01 của tệp review.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `deposit.accept_shortfall_unverified` | Mới (FE-3 thêm ở #141, UXD chốt chữ) | Trong số cọc đã nhận, {amount} còn chờ đối soát. Trước khi chấp nhận, kiểm khoản này đã có trong sao kê, hoặc tiền mặt sale, CTV thu đã nộp quầy. | Of the deposit received, {amount} is still awaiting reconciliation. Before you accept, check it's on the bank statement, or that cash collected by sales or an agent has been handed in. | OWN, MGR, hộp Xác nhận cọc. `Alert warn` ngay dưới ô `deposit.accept_shortfall` khi đã chọn ô và `depositUnverifiedVnd > 0`, trước hoặc sau hạn giữ chỗ. `{amount}` = `money()` có đơn vị. Bỏ chọn thì Alert mất |
| `folio.open_refunds_may_decrease` | Mới | Số chưa duyệt có thể giảm khi duyệt: phát sinh ghi sau yêu cầu được trừ trước khi hoàn. | Amounts not yet approved may go down at approval: charges posted after the request are taken off first. | Dòng `tr.sub` cuối, dưới `folio.open_refunds_total`: bước ③ Bill, màn Kết quả của Trả phòng, hộp Folio. Không có ở thẻ Folio của khung đơn. Điều kiện ở (b) |
| `error.closed_booking_payment_sales` | Sửa | Đơn này đã đóng ("{status}") nên không xác nhận cọc hay tạo mã VietQR được nữa. Khách đã trả tiền: báo lễ tân kèm mã đơn. | This booking is closed ("{status}"), so you can't confirm a deposit or create a VietQR code for it. If the guest has already paid, tell the front desk and give the booking code. | Như 9.1a (sale, CTV), thêm đường B4 ở (c) |

**(a) V5-18.**
- `depositUnverifiedVnd` gồm mọi khoản cọc còn `reconciliation = pending`: chuyển khoản, VietQR, và tiền sale, CTV ghi (cả tiền mặt chờ nộp quầy). Nháp FE-3 gọi cả số là "chưa đối soát với sao kê", nên sai với phần tiền mặt.
- "Chờ đối soát" là tên trạng thái Desk đã dùng (`pay.pending_reconcile`). Vế sau đi theo hai đường đối soát của `recon.intro`.
- Viết "đã có trong sao kê", không viết "đã khớp sao kê": "Đã khớp sao kê" là tên nút đổi trạng thái.
- Hiện cả trước và sau hạn giữ chỗ (đồng ý FE-3): rủi ro như nhau ở hai lúc.

**(b) V5-13 – câu "có thể giảm" và dòng không đọc được ở khung đơn.**
- Với 0.3.13: hiện mỗi khi Σ `openRefunds` > 0. Hợp đồng chưa cho biết nhóm nào còn chờ quyết định. Câu tự giới hạn vào "số chưa duyệt", nên vẫn đúng khi mọi yêu cầu đã duyệt.
- Từ 0.3.14 (`OpenRefund.awaitingDecision`): chỉ hiện khi có ít nhất một nhóm `true`. Trường vắng thì giữ như 0.3.13.
- Không dùng `approvals.refund_may_decrease` ở đây. Câu đó viết cho một dòng của hàng chờ duyệt ("yêu cầu này"), giữ nguyên ở Cần duyệt.
- Thẻ Folio của khung đơn (FD+), khi đọc folio lỗi:
  - hiện `checkout.pending_refund_unavailable` ở đúng chỗ dòng `drawer.folio.open_refunds` (ngay dưới "Còn phải thu"), `tr.sub`, không đỏ, không nút thử lại;
  - nút "Folio & điều chỉnh" là lần đọc lại;
  - khung đơn không có câu "có thể giảm";
  - đã đọc được một lần mà lần đọc lại lỗi: câu này thay số cũ (FB-R5-ARC-FE-134-01).

**(c) B4 `confirmDeposit` trên đơn đã đóng: dùng câu 9.1a.**
- Chỉ trong hộp Xác nhận cọc, không đổi hợp đồng.
- B4 trả 409 `INVALID_TRANSITION` có `currentState` = `cancelled` hoặc `no_show` (B4 là lệnh của đơn, nên ở đây `currentState` là trạng thái đơn):
  - câu 9.1a theo vai và theo 5B-1, khóa nút chính, đọc lại khung đơn;
  - hộp không đóng, không hiện `error.INVALID_TRANSITION`.
- B4 trả 412 `VERSION_CONFLICT` mà lần đọc lại cho thấy đơn `cancelled`/`no_show`: làm như trên ngay, không hiện "Tải lại".
- Khi hộp khóa:
  - focus vào Alert 9.1a (`tabIndex = -1`);
  - nên khóa các ô và đổi nút chân hộp thành `common.close`.
- `_sales` thêm "xác nhận cọc", vì sale có nút "Xác nhận đã nhận cọc" trong hộp này. "Đã trả tiền" thay "đã chuyển tiền", vì sale có thể cầm tiền mặt. Hai câu FD+ đã nói "xác nhận cọc hay tạo mã VietQR", giữ nguyên.
- Theo DS hiện có: `Alert bad` (9.1a), `Alert warn` (V5-18), dòng `tr.sub` chữ Stone Grey. Không thêm màu.

### 9.15 Hộp Trả phòng quá ngày đi (V5-15 Desk, #145) – bản 2.4

Căn cứ:
- `rounds/round-05/reviews/UXD-on-fe-prs-145-146.md` mục 2 (đo trên mock ở `011d44e7`, 1440 và 390 px, sáng và tối, VI và EN);
- DOM `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 7.1, 15.3 (gồm ý 2a mới), 15.4, 15.7; `rounds/round-05/reviews/DOM-on-fe-pr-145.md` thẻ 145-01 … 145-05;
- ARC `rounds/round-05/reviews/ARC-on-fe-prs-145-146.md` mục 3.3, 3.4 (FB-R5-FE-ARC-V515-01: máy chủ v1.0.5 đọc giờ trước 06:00 của đơn quá ngày đi là rạng sáng hôm sau; sửa ở v1.0.6);
- hợp đồng 0.3.13: B18 `checkoutAt`, `checkoutTime`, `overdueReason`; `CheckoutSummary.overdue`, `nightsNotBilled`, `extraNightRequired`, `standardCheckoutTime`; 403 `FORBIDDEN_ACTION` có `requiredRole`, `nightsNotBilled`.

FE-A2 áp trong #145 (`gen_strings.py`, sinh lại). UXD không áp trên `main`: các khóa chỉ có ở nhánh #145. Ghi chú khóa: thay "chờ UXD duyệt" bằng "UXD duyệt 07/11 (UXD-on-fe-prs-145-146)". Giữ phần mô tả chỗ hiện và biến.

Ký hiệu: **D** = ngày đi hiệu lực (`stayDeparture`, đã tính gia hạn). `date()` cho dd/mm/yyyy.

**Bảng A – điều kiện gộp #145 (FB-R5-UXD-FE-145-01, gồm DOM 145-01).**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `checkout.overdue_title` | Mới, giữ chữ FE-A2 | Trả phòng quá ngày đi | Check-out past the departure date | Như ghi chú FE-A2 |
| `checkout.overdue_body` | Mới, giữ chữ FE-A2 | Ngày đi là {date}, đã qua {nights}. Ghi giờ khách rời căn và lý do. Khách ở thêm đêm nào thì gia hạn trước, rồi mới trả phòng. | The departure date was {date}, {nights} ago. Enter when the guest left and why. If the guest stayed another night, extend the stay first, then check out. | Như ghi chú FE-A2 |
| `checkout.overdue_time_help` | Mới, **sửa chữ** | Giờ khách rời căn, ngày {date}. Không có bằng chứng thì ghi {time} (giờ trả chuẩn), hoặc giờ thấy căn trống nếu sớm hơn – không phụ thu. | The time the guest left, on {date}. With no proof, enter {time} (standard check-out), or the time the room was found empty if earlier – no surcharge. | help ô giờ, đơn quá ngày đi **không** có `agreedCheckoutTime`. {date} = `date(D)`, {time} = `standardCheckoutTime ?? rules.checkoutTime` |
| `checkout.overdue_time_help_agreed` | **Mới** (DOM 145-01, luật 15.3 ý 2a) | Giờ khách rời căn, ngày {date}. Không có bằng chứng thì giữ {time} (giờ trả muộn đã hẹn) và phụ thu đã hẹn. Có bằng chứng khách đi sớm hơn (trả chìa, tin nhắn, buồng phòng thấy căn trống) thì ghi giờ đó. | The time the guest left, on {date}. With no proof, keep {time} (the agreed late check-out) and the agreed charge. With proof the guest left earlier (key returned, a message, housekeeping found the room empty), enter that time. | help ô giờ, đơn quá ngày đi **có** `agreedCheckoutTime`. {date} = `date(D)`, {time} = `agreedCheckoutTime`. Thay `checkout.overdue_time_help`. Trên nhánh quá ngày đi **bỏ** `co.time_from_late`, vì câu này đã có giờ hẹn |
| `checkout.overdue_reason_label` | Mới, giữ chữ FE-A2 | Lý do quá ngày đi | Why it's past the departure date | Như ghi chú FE-A2 |
| `checkout.overdue_reason_pick` | Mới, giữ chữ FE-A2 | Lý do thường gặp | Common reasons | Chỉ là `aria-label` của nhóm nút, không hiện chữ |
| `checkout.overdue_reason.no_notice` | Mới, **sửa EN** | Khách đi không báo | Guest left without notice | Nút gợi ý 1; chọn thì điền chữ này vào ô lý do |
| `checkout.overdue_reason.desk_forgot` | Mới, giữ chữ FE-A2 | Lễ tân quên bấm Trả phòng | Front desk forgot to check out | Nút gợi ý 2 |
| `checkout.overdue_reason.other` | Mới, giữ chữ FE-A2 | Khác (ghi rõ) | Other (please specify) | Nút gợi ý 3 |
| `checkout.overdue_after_limit` | Mới, **sửa chữ** | Giờ này quá mốc trả muộn của ngày đi nên tính thêm 1 đêm. Gia hạn thêm đêm đó trước, rồi trả phòng. | This time is after the departure day's late check-out limit, so it counts as one more night. Extend the stay by that night first, then check out. | Lỗi ô giờ và câu khóa nút (`overdueWhy`) khi `extraNightRequired` hoặc 422 `LATE_CHECKOUT_AFTER_LIMIT`, **và** ngày của `checkoutAt` máy chủ trả = D. Ngày khác D: dùng `checkout.overdue_time_early` (bảng B) |
| `checkout.overdue_effect` | Mới, giữ chữ FE-A2 | Ghi giờ khách rời: {time} ngày {date}. | Records when the guest left: {time} on {date}. | Như ghi chú FE-A2 ({time}, {date} ← `checkoutAt` máy chủ) |
| `checkout.overdue_need_manager` | Mới, đã chốt ở `UXD-on-fe-prs-125-128.md` mục 3 | Đơn đã quá ngày đi 1 đêm: cần quản lý hoặc chủ đầu tư trả phòng. | This stay is 1 night past departure: a manager or the owner needs to check it out. | Không đổi. Đếm ở bản này |
| `checkout.overdue_need_owner` | Mới, đã chốt ở `UXD-on-fe-prs-125-128.md` mục 3 | Đơn đã quá ngày đi {n} đêm: cần chủ đầu tư trả phòng. | This stay is {n} nights past departure: the owner needs to check it out. | Không đổi. Đếm ở bản này |

`checkout.overdue_reason_help` (mục 9.9) giữ nguyên, đã đếm ở bản 1.9.

**Bảng B – cùng lượt sửa nếu kịp, không chặn gộp #145.**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `checkout.overdue_time_early` | **Mới** (DOM 145-02, ARC 3.4) | Desk hiểu {time} là rạng sáng {next}. Khách đi lúc {time} ngày {date}: ghi {rollover}, ghi giờ thật vào lý do, không gia hạn. Khách đi rạng sáng {next} là đã ở thêm đêm {date}: gia hạn trước. | Desk reads {time} as early on {next}. If the guest left at {time} on {date}: enter {rollover}, put the real time in the reason, don't extend. If they left early on {next}, they stayed the night of {date}: extend first. | Điều kiện ARC 3.4: `overdue && extraNightRequired && localDayTime(checkoutAt).day !== D` (cả đơn đã gia hạn mà vẫn quá ngày đi). {time} = giờ của `checkoutAt` máy chủ, {next} = `date()` ngày của `checkoutAt`, {date} = `date(D)`, {rollover} = `property.businessDayRollover`. Thay `checkout.overdue_after_limit` ở cả lỗi ô giờ và `overdueWhy`. Tự tắt khi v1.0.6 sửa máy chủ (không cần đổi Desk). Không kịp: dòng release notes ARC 3.3 thay câu này |
| `checkout.overdue_extend_hint` | **Mới** (DOM 145-03) | Trước khi gọi, kiểm căn: khách còn ở hoặc đã ở thêm đêm thì bấm Gia hạn, không cần chờ. | Before calling, check the room: if the guest is still there or stayed extra nights, use Extend stay – no need to wait. | Ngay sau câu `checkout.overdue_need_*`: trong Alert info của màn chỉ dẫn (CheckOutPage) và trong dòng `li-s` cạnh nút Trả phòng bị khóa (ReservationDrawer). Chỉ khi `allowedActions` có `extend_stay`. Không kịp: v1.0.6, BA đưa ý này vào sổ tay |
| `checkout.overdue_reason_evidence` | **Mới** (DOM 145-04) | Ghi thêm cách biết giờ khách rời: ai thấy căn trống, lúc nào, khách có nhắn không. | Add how you know when the guest left: who found the room empty, when, and whether the guest sent a message. | help ô lý do, đứng trước `checkout.overdue_reason_help` (cùng một dòng `help`, câu này trước). Sau khi chọn nút gợi ý 1 hoặc 2, con trỏ ở cuối ô để ghi tiếp. Tùy FE-A2, không thì v1.0.6 |

**Bảng C – để sẵn cho v1.0.6, chưa đếm.**

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `checkout.overdue_told_guest` | Mới (DOM 145-05) | Tôi sẽ nhắn khách khoản phụ thu này cùng bill | I'll message the guest about this surcharge with the bill | Nhãn ô đánh dấu trong hộp xác nhận, khi đơn quá ngày đi có phụ thu. Chờ DOM, PO chốt có lưu hay không |

**(a) Vì sao sửa.**
- `checkout.overdue_time_help`: "Không có bằng chứng giờ:" đọc như nhãn mục. Viết thành câu điều kiện, và đặt "không phụ thu" sau gạch ngang để đọc ra là kết quả của cả hai cách ghi. Nghĩa giữ theo DOM 15.3.
- `checkout.overdue_time_help_agreed` (DOM 15.3 ý 2a): đơn có giờ trả muộn đã hẹn thì "không có bằng chứng" nghĩa là **giữ** giờ hẹn và phụ thu hẹn (B15), không phải giờ chuẩn. Câu nêu 3 loại bằng chứng hay gặp ở quầy, để lễ tân không phải đoán. Không nói phụ thu tính lại ra sao: bước ② đã hiện số mới.
- `checkout.overdue_after_limit`: nháp FE-A2 viết "Khách ở thêm đêm đó thì gia hạn", nhưng đã quá mốc thì Desk **luôn** tính thêm đêm, không có nhánh "không ở". Câu mới nói rõ hệ quả (thêm 1 đêm) và việc làm (gia hạn trước). Lễ tân muốn ghi giờ sớm hơn thì sửa giờ: câu help ngay trên đã nói cách ghi.
- `no_notice` EN: "without telling us" là giọng của khách sạn nói với khách. Ô này lưu vào nhật ký nội bộ, nên dùng "without notice", ngắn và trung tính.
- Các khóa giữ chữ: ngắn, đúng nghĩa DOM 7.1, đúng tên nút "Trả phòng", "Gia hạn" đang có trên Desk.

**(b) `checkout.overdue_time_early` – cách viết.**
- Câu đầu nói Desk đang hiểu giờ thế nào. Lễ tân thấy ngay vì sao có thêm đêm, dù đã gõ giờ khách thật sự rời.
- Hai câu sau là hai ca, mỗi ca một việc. Giữ đúng cách tạm của DOM 3.3 và ARC 3.3: ghi giờ đổi ngày (06:00) cho ngày đi, ghi giờ thật vào lý do.
- {rollover} lấy từ thuộc tính, không viết cứng 06:00.
- Không nhắc v1.0.6 hay lỗi máy chủ trên màn: lễ tân không cần biết, release notes đã ghi.

**(c) `checkout.overdue_extend_hint` – đặt sau câu gọi ai.** DOM 145-03 đề xuất đặt câu này trước. UXD đặt sau, vì câu trạng thái (vì sao nút khóa) cần đứng đầu. "Trước khi gọi" đã nói thứ tự việc. Câu chỉ hiện với người có nút Gia hạn, để không bảo ai bấm nút họ không có.

**(d) Theo DS hiện có.** Dòng `help` chữ Stone Grey, `.err` của Field, `Alert info` (màu `--info` chỉ trong Alert, DS 2.4). Không thêm màu, không thêm cỡ chữ.

### 9.16 Ô Người chốt trên khung đơn: đổi theo mốc (Desk, FE-A; DOM 154-03, SEC 1I-03) – bản 2.5

Chữ Desk nội bộ (VI, EN). Không có chữ cho khách, không cần CPY. Lên cùng PR Desk đổi người chốt của FE-A (chưa mở). Luật máy chủ đã có trên `main` (#154; hợp đồng 0.3.13 bổ sung 1h, 1i, mô tả `updateReservation`):
- giữ chỗ: FD+ đổi được. Desk không hiện ô lý do;
- ngoài giữ chỗ, chưa nhận phòng (ví dụ `confirmed`): MGR+ đổi được, lý do không bắt buộc (DOM 1H-05). FD, FDL gửi → 403 `FORBIDDEN_ACTION` kèm `access.denied` (`CLOSER_CHANGE_BEFORE_CHECKIN`);
- sau nhận phòng (`in_house`, `checked_out`): chỉ OWN, `closerChangeReason` bắt buộc, 3–500 ký tự. MGR, FDL, FD gửi → 403 (`CLOSER_CHANGE_AFTER_CHECKIN`);
- chỉ gửi `closerChangeReason` khi `closerUserId` đổi. Gửi mà người chốt không đổi → 422 `NOT_ALLOWED`;
- lý do lưu ở cột `reason` của audit `reservation.closer_changed`. FD, FDL đọc được trong Lịch sử đơn (`getReservationHistory`, SEC 1I-03).

Cách hiện:
- vai sửa được: ô chọn như lúc tạo đơn, nhãn `bk.closer_sales` (sale nội bộ) hoặc `bk.closer` (CTV). Ô lý do chỉ hiện sau khi chọn người khác, và chỉ ở đơn ngoài giữ chỗ. Chọn lại người cũ thì ô lý do ẩn và không gửi;
- vai không sửa được ở mốc này: tên người chốt ở dạng chữ, không có ô chọn, không có nút. Dưới tên có một dòng `help` (`readonly_manager` hoặc `readonly_owner`). Không hiện nút cho vai sẽ bị 403, để lễ tân làm đúng việc không sinh `access.denied` (DOM 154-03);
- sale, CTV: không có dòng chỉ đọc. Đổi người chốt không phải việc của họ.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `rsv.closer.reason` | Mới | Lý do đổi người chốt | Reason for the change | Nhãn ô lý do, ngay dưới ô người chốt. OWN sau nhận phòng: bắt buộc (dấu * của Field). Trước nhận phòng: thêm `common.optional` |
| `rsv.closer.reason_help` | Mới (SEC 1I-03) | Lễ tân và lễ tân trưởng đọc được lý do này trong lịch sử đơn. Không ghi họ tên, số giấy tờ, số thẻ của khách, cũng không ghi tỷ lệ hay số tiền hoa hồng. | Front desk staff can read this reason in the booking history. Don't write the guest's name, ID or card numbers, or any commission rate or amount. | `help` dưới ô lý do, luôn hiện khi ô hiện, kể cả khi có lỗi (như 9.9). Nối vào `aria-describedby` |
| `rsv.closer.reason_hint` | Mới | Ví dụ: lúc tạo đơn chọn nhầm người chốt. | For example: the wrong person was picked when the booking was created. | Chữ gợi ý (placeholder) ô lý do |
| `rsv.closer.readonly_manager` | Mới (DOM 154-03), **sửa ở 2.7** (DOM 162-01) | Cần đổi người chốt? Báo quản lý hoặc chủ đầu tư trước khi khách nhận phòng. Sau đó chỉ chủ đầu tư đổi được. | Need to change who closed this booking? Tell a manager or the owner before the guest checks in. After that, only the owner can change it. | Dòng dưới tên người chốt cho FD, FDL, ở đơn ngoài giữ chỗ, chưa nhận phòng. Bản 2.7: thêm "hoặc chủ đầu tư", vì ở mốc này chủ đầu tư cũng đổi được mà không cần lý do, và không phải ca nào cũng có quản lý (DOM 162-01). FE áp trong #162 nếu tiện, không thì v1.0.6 |
| `rsv.closer.readonly_owner` | Mới (DOM 154-03) | Khách đã nhận phòng nên chỉ chủ đầu tư đổi được người chốt. Cần đổi thì báo chủ đầu tư. | The guest has checked in, so only the owner can change who closed this booking. Tell the owner if it needs changing. | Dòng dưới tên người chốt cho MGR, FDL, FD, ở đơn `in_house`, `checked_out` |
| `error.closer_change_forbidden` | Mới | Đơn vừa đổi trạng thái nên bạn không đổi được người chốt nữa. Desk đã tải lại đơn. | The booking's status just changed, so you can no longer change who closed it. Desk has reloaded the booking. | 403 `FORBIDDEN_ACTION` khi thân PATCH có `closerUserId`, ví dụ khách vừa nhận phòng ở máy khác. FE tải lại đơn rồi mới hiện câu; sau đó ô thành chỉ đọc, kèm dòng `readonly_*` |
| `field_error.reason_card_number` | Mới | Lý do có dãy số giống số thẻ thanh toán. Xóa dãy số đó – OTTIMO không lưu số thẻ. | The reason contains what looks like a card number. Remove it – OTTIMO doesn't store card numbers. | Dưới ô lý do, 422 `CARD_NUMBER_DETECTED` có `errors[].field = closerChangeReason` (V-09). Khung lỗi không hiện `error.CARD_NUMBER_DETECTED` ("Ô ghi chú…"). Dùng lại cho ô lý do khác ở v1.0.6 (9.17) |

Dùng lại, không đổi chữ:
- `field_error.reason_required` (Ghi lý do (ít nhất 3 ký tự).): 422 `REASON_REQUIRED` ở `closerChangeReason`;
- `field_error.too_long` (Tối đa {max} ký tự.), `{max}` = 500: 422 `TOO_LONG`;
- `field_error.not_in_list` (Chọn một giá trị trong danh sách.): 422 `NOT_IN_LIST` ở `closerUserId` (người vừa bị tắt, hoặc sai kênh). FE tải lại danh sách người chốt;
- `common.optional` (Không bắt buộc);
- `mlog.a_closer_changed` (Đổi người chốt: {from} → {to}): dòng Lịch sử đơn, đã có.
- Bản 2.7, theo review #162:
  - `common.save` (Lưu): nút chính khi đã chọn người khác;
  - `common.unsaved_discard` (Bỏ thay đổi / Discard): nút phụ, đặt lại ô chọn. Không dùng `common.cancel` "Hủy": khung đơn có "Hủy đơn", "Hủy giữ chỗ" (FB-R5-UXD-FE-162-02);
  - `common.saved` (Đã lưu): toast sau khi lưu được, rồi trả focus về ô chọn (FB-R5-UXD-FE-162-01);
  - `common.error_generic_title` (Chưa tải được dữ liệu) + nút `common.retry` (Thử lại): ở chỗ của tên khi tải danh sách người chốt lỗi. Cùng cách với Nhật ký tiền (DOM 159-01);
  - `mlog.closer_inactive` (Tài khoản hiện không hoạt động, mục 9.18): ở chỗ của tên, và ở lựa chọn đầu của ô chọn, khi người chốt đang lưu không có trong danh sách đã tải xong. Không dùng `mlog.who_unlisted` ở đây (FB-R5-UXD-FE-162-03);
  - `common.optional`: gắn sau nhãn trong ngoặc, chữ Stone (`li-s`), như #162 đã làm.

Không viết câu riêng:
- 422 `NOT_ALLOWED` ở `closerChangeReason`: Desk không gửi lý do khi người chốt không đổi, nên đây là lỗi FE. Để câu chung;
- 409 hoa hồng `payable`, `paid`: v1.0.5 chưa có luồng chi, nên không xảy ra (hợp đồng 1h). Viết câu khi có luồng chi (DOM 1H-03, US-089 v1.3).

**Vì sao viết vậy.**
- Help nói ai đọc được trước, rồi mới nói không ghi gì. Người gõ là chủ đầu tư hoặc quản lý. Họ cần biết lễ tân cũng đọc, để không ghi tỷ lệ hay số hoa hồng khi giải thích. Thêm "số thẻ" theo hướng SEC 145-01, để hai ô lý do mới nói cùng một ý.
- Hai dòng chỉ đọc tách theo mốc, không gộp thành một câu hai vế như ví dụ của DOM. Mỗi vai thấy đúng người cần báo. Câu cho FD, FDL vẫn có vế "Sau đó…", vì đơn nào rồi cũng qua nhận phòng.
- EN dùng "who closed this booking", theo nhãn "Closed by" đang có. "Closer" chỉ dùng trong nhật ký.
- Theo DS hiện có: `help` chữ Stone Grey, `.err` của Field. Không thêm màu, không thêm cỡ chữ.

### 9.17 Để sẵn cho v1.0.6 (chưa đếm, chưa áp)

| Nguồn | Chỗ | Việc ở v1.0.6 | Ghi chú |
|---|---|---|---|
| SEC FB-R5-SEC-FE-145-01 (Suggestion) | `checkout.overdue_reason_help` | Nháp VI: "Lý do lưu vào nhật ký thay đổi. Không ghi họ tên, số giấy tờ, số thẻ hay thông tin sức khỏe của khách, cũng không chép nguyên tin nhắn của khách." EN: "The reason is kept in the change log. Don't write the guest's name, ID or card numbers or health information, and don't paste the guest's messages." | Thêm "số thẻ" (SEC) và vế "không chép nguyên tin nhắn" (ghi chú SEC: tin nhắn hay có số điện thoại). Cùng lượt: 422 `CARD_NUMBER_DETECTED` ở `overdueReason` hiện `field_error.reason_card_number` (9.16) dưới ô, thay câu "Ô ghi chú…" |
| UXD FB-R5-UXD-FE-145-04 (Suggestion) | hộp xác nhận Hoàn tất, dòng `checkout.overdue_effect` | Tách thành đoạn riêng đứng đầu thân hộp, chữ đậm 600 (Be Vietnam Pro, Ink) | Không đổi chữ, không thêm màu |
| UXD FB-R5-UXD-FE-145-06 (Suggestion) | `Seg` (gói `product/packages/ui`), nhóm nút gợi ý lý do ở bước ② | Dưới 520 px, khi `Seg` xuống hàng: mỗi nút `min-height: 40px`, rộng trọn hàng | UXD ghi vào DS ở lượt DS sau, FE làm |
| UXD (theo DOM 155-04) | dòng "Đổi người chốt", Nhật ký tiền | Với OWN: lấy tên người chốt đã khóa từ `listUsers` (chỉ OWN gọi), hiện "{name} (hiện không hoạt động)". Chủ đầu tư kiểm được người cũ mà không cần mở màn Người dùng | Cần SEC đồng ý và một khóa mới. FD, FDL, MGR giữ `mlog.closer_inactive` |
| DOM FB-R5-DOM-FE-145-05 (Suggestion) | ô đánh dấu `ci.told_guest` ở bước ②, đơn quá ngày đi có phụ thu | Dùng nhãn `checkout.overdue_told_guest` (9.15 bảng C): "Tôi sẽ nhắn khách khoản phụ thu này cùng bill" | Vẫn bắt buộc chọn, không có "bỏ qua" (BR-414). BA thêm vào sổ tay: gửi bill qua Zalo hoặc tin nhắn OTA ngay sau khi ghi |

### 9.18 Nhật ký tiền: dòng "Đổi người chốt" khi không có tên (DOM 155-04, FE-A2 #159) – bản 2.6

Chữ Desk nội bộ (VI, EN). Không có chữ cho khách. #159 sửa dòng `mlog.a_closer_changed` ("Đổi người chốt: {from} → {to}"): đọc `before.closerUserId`, `after.closerUserId`, đổi ra tên bằng `listCloserCandidates` (`kind=all`). Danh sách này chỉ có người `active` còn vai ở cơ sở. Hai ca chưa có chữ riêng; #159 tạm dùng "—" và `mlog.who_unlisted`.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `mlog.a_closer_changed_legacy` | Mới (DOM 155-04) | Đổi người chốt (bản ghi cũ, không có tên) | Closer changed (older record, no names) | Dòng `reservation.closer_changed` mà `after` **không có khóa** `closerUserId`: bản ghi trước #154. Thay cả dòng `mlog.a_closer_changed`, không hiện "— → —". Bản ghi từ #154 mà `before.closerUserId` rỗng (ghi người chốt lần đầu) không dùng khóa này: vẫn `a_closer_changed`, `{from}` = "—" như #159 |
| `mlog.closer_inactive` | Mới (DOM 155-04) | Tài khoản hiện không hoạt động | Inactive account | Giá trị `{from}` hoặc `{to}` khi id không có trong danh sách người chốt đã tải xong. Thay `mlog.who_unlisted` ở dòng này. Ô lọc Người làm vẫn dùng `mlog.who_unlisted`. Đang tải: `common.loading`. Tải lỗi (bản 2.7): `common.error_generic_title`, không hiện `closer_inactive` cho mọi người (DOM FB-R5-DOM-FE-159-01, #164) |

Ví dụ: "Đổi người chốt: Sơn → Tài khoản hiện không hoạt động" / "Closer changed: Sơn → Inactive account".

**Vì sao viết vậy.**
- Không ghi "trước v1.0.5" như nháp DOM. Desk chưa có chuỗi nào nêu số phiên bản, và lễ tân không cần biết số này. Cột thời gian của dòng đã cho biết lúc nào. Từ #154 mọi bản ghi đều có tên, nên "bản ghi cũ" chỉ còn trỏ tới các bản ghi trước đó. Release notes v1.0.5 có thể ghi một dòng (mục 6, PO).
- Không ghi "đã khóa" như ý DOM. Desk không biết vì sao id vắng: danh sách chỉ trả người `active`, nên vắng có thể là đã khóa, tạm khóa vì sai mật khẩu, đã tắt, hoặc đã gỡ khỏi cơ sở. Danh sách cố ý không trả trạng thái khóa (mô tả `listCloserCandidates`). Trạng thái khóa là dữ liệu bảo mật tài khoản (D27). "Hiện không hoạt động" đúng cho mọi ca. Câu này không nói thêm điều gì ngoài việc người đó vắng trong ô chọn người chốt, và "hiện" nói đúng là tên được đọc lúc xem, không phải lúc ghi.
- "Tài khoản", không ghi "nhân viên": người chốt có thể là CTV.

---

## 6. Yêu cầu cho FE, BE (gom theo tệp)

| Vai | Tệp | Việc | Mục |
|---|---|---|---|
| FE-A | `design/tools/gen_strings.py` (+ sinh lại) | Áp mọi dòng Sửa, Mới, Xóa của bảng này. Ghi chú mỗi khóa: "v1.0.5 – V5-xx" | toàn bộ |
| FE-A | `app/rules.ts` | `RULE_DEFAULTS` theo mức đề xuất (30, 30) | 1.1 |
| FE-A | `quotes/QuoteDialog.tsx` | `n` cho `LONG_STAY_REQUIRES_CONTRACT`; gom đêm theo số tiền với `sale.nights_at_rate_*`; `sale.hold_next*` với `{time}` từ `held.holdExpiresAt` và nhánh `_no_qr`; `sale.quote_expires` truyền `expiresAt − 1 phút` | 1.1, 1.4, 4.7, 4.14 |
| FE-A | `booking/BookingDialog.tsx` | Khóa bản xem gồm số người; "–" và `aria-busy` khi chờ; chữ OTA chưa gõ giá; câu sàn–trần có số, dự phòng `rate_out_of_range_dates`; `role="alert"`, `aria-invalid` | 1.6, 3 |
| FE-A | `stay/CheckOutPage.tsx`, `stay/StayDialogs.tsx` | `rate.calendar_short` ở 2 chỗ luôn hiện; `stay.after_noon_hint` với `{time}`; `stay.agreed_time`; `stay.companion_field`; `stay.charge_penalty_note` khi `category` là `penalty` hoặc `damage` | 1.2, 1.5, 4.2, 4.3, 4.7 |
| FE-A | `stay/common.tsx`, `money/MoneyPage.tsx` | `StepUpDialog` thêm `purpose` | 4.4 |
| FE-A | `pages/paramCatalog.ts`, `ParamDialog.tsx`, `ParamsPage.tsx`, `app/problem.ts` | `KNOWN` cho 29 khóa, đơn vị `nights`; 6 nhánh câu `PARAM_OUT_OF_RANGE`; `params.err_*`; câu `ota_base_rate` | 2 |
| FE-A | `app/folio.ts` | Biến thể phí trả sớm (`_same_day`, số nhiều) | 4.1 |
| FE-A | `reservations/ReservationsPage.tsx`, `ReservationDialogs.tsx`, `pages/UsersPage.tsx`, `UserEmailDialog.tsx`, `webreq/*` | `rsv.list_empty_body_sales`; `money()` trong `DEPOSIT_INSUFFICIENT`; `INVALID_TRANSITION_generic(_reloaded)`; `users.email_purpose`; `webreq.pii_erased` | 4.7, 4.10, 4.12, 4.13, 4.16 |
| FE-A | test | Sửa các test nhắc khóa bị xóa hoặc chữ cũ, ví dụ `v104-rate-source-typed.test.tsx` (`bk.src_weekend`), test so `error.DEPOSIT_INSUFFICIENT`, `sale.hold_next` (bỏ `hours`, thêm `time`) | 1.3, 4.13, 4.14 |
| FE-B | `apps/guest-web` | `gw.lang_auto` 3 ngôn ngữ; `gw.lang_auto_sr` ở `#gw-lang-state` (GuestShell 66); 3 chuỗi RU trang khách; `gw.req.clean_*` (4.20 a, 5.1); font (5.2) | 4.6, 4.20, 5.1, 5.2 |
| FE-B | test chữ khách (`apps/guest-web` hoặc `packages/i18n`) | Kiểm tự động 5 bước ở mục 5.3, bật dần. Làm **sau** 4.20 (a), (b) | 5.3 |
| MOB | `apps/mobile` | Font (5.2). Kiểm các chuỗi U+2011 trên thẻ 362 px | 4.15, 5.2 |
| BE-A | `reservations.service.ts` 739–743 | `min`, `max` trong Problem `RATE_OUT_OF_RANGE` (theo ARC 0.3.13) | 3 |
| BE-B | `folio/public/line-labels.ts` | Dòng `chargeCode = 'late_fee_as_night'`: `amount_vnd` bằng `limit_ref_vnd` → `bill.line.late_fee_as_night`; khác → `bill.line.late_fee_after_limit`. Cả hai không có `time`. `LabelSource` cần thêm `amount_vnd`, `limit_ref_vnd`. Test: sửa đơn giá 800.000 → 400.000 ra `after_limit`; dòng 800.000 kèm FOC 400.000 vẫn ra `as_night` (DOM mục 10) | 4.8 |
| BE | `services/api/scripts/gen-quote-copy.mjs` | Chạy lại sau khi đổi `sale.quote_text` (RU dòng 2 và 4, VI dòng 2). `quote-copy.ts` không còn "Апартаменты", "Депозит", "Căn " | 4.20, 5.1 |
| FE-A | `reservations/ReservationDialogs.tsx` (hoặc tệp ARC chỉ), `pages/TodayPage.tsx` | Bản 1.4: nút và hộp ghi tiền về cho đơn đã hủy, nút Không thấy tiền ở Cần chú ý, câu báo cho sale, CTV. Bản 1.5: dòng tìm đơn mới, dòng phụ ảnh, ô mã giao dịch (mọi hộp ghi thu), 409 `DUPLICATE_BANK_REFERENCE`, 422 ảnh từ báo của sale. Lên cùng 5B-1 | 9.1 |
| FE-A | màn Cần duyệt, Hoàn tiền, Đối soát (`money/*`, `approvals/*`) | Bản 1.5: nhãn `payment_after_cancel`, khối nơi nhận cố định (ẩn Nhập nơi nhận hoàn, ẩn chi tiền mặt), chip và câu "Có thể trùng" khi `possibleDuplicateCodes` không rỗng. Lên cùng 5B-1 | 9.1 |
| FE-A | `pages/RoomDrawer.tsx` | Bản 1.5: thêm `nightlyHigh` (giá đêm × 5 > giá tháng) cạnh `nightlyLow`; chữ nút Lưu khi cảnh báo hiện và ô giá đã sửa; đọc `warnings[]` của `updateRoom` để thêm dòng vào toast. Lên cùng V5-1A | 9.3 |
| FE-A | `app/problem.ts`, hộp Xác nhận cọc, `DepositQr` | Bản 1.5: 409 `INVALID_TRANSITION` có `reservationStatus` → 3 câu 9.1a theo vai và theo 5B-1 đã lên hay chưa. Lên cùng V5-48 (bắt buộc v1.0.5) | 9.1a |
| FE-A | `app/problem.ts`, `pages/ParamDialog.tsx` | Bản 1.4: chọn câu lỗi riêng cho `min_stay`, `short_stay_max_nights` trước 6 bước ở 2.3. Bản 1.5: `min_stay` có `allowed` hay chỉ `max` dùng câu chung 9.4; 11 khóa có cấu trúc dựng `{where}` từ `errors[0].field`, ghép câu 2.3 vào `{detail}`. Lên cùng V5-25 (PR #96) | 9.2, 9.4 |
| FE-A | `app/problem.ts` (nhánh `PARAMETER_MALFORMED`, chờ ARC); chỗ gọi tạo đơn, Trả sớm, giữ chỗ, nhận phòng, trả phòng | Bản 1.6: đổi `parameterKey` sang `params.setting.*`, chọn bản câu theo vai. Bản 1.6, 9.4: ba câu `REQUIRED` xét trước 2.3 | 9.4, 9.6 |
| FE-A | `pages/stay/FolioDialog.tsx` (hộp Điều chỉnh, form miễn phí), `app/problem.ts`, Nhật ký tiền, "Cần chú ý" | Bản 1.5: câu phụ cho FD, FDL; 403 `requiredFlow = foc_request` → câu chỉ dẫn và nút mở form miễn phí điền sẵn; lý do Ghi nhầm; bộ lọc `reductionsOnly`; `attn.line_reduction_count`. Lên cùng V5-16 (US-177) | 9.5 |
| FE-A | `design/tools/gen_strings.py` (#102) | Bản 1.7: chữ `hk.action.needs_cleaning` "Báo cần dọn" / "Mark for cleaning"; ghi chú khóa và tên nhóm V5-15 đổi "Chờ UXD duyệt" thành "UXD duyệt 06/11". Điều kiện gộp #102 | 9.7 |
| FE-A | `pages/stay/CheckInPage.tsx` (`roomBlockedMessage`), test BUG-R4-039 | Bản 1.7: `cause = room_status`, `detail = OD` → `checkin.room_status_stuck_od`; chữ mới của `room_status_stuck`. Nên lên cùng #102 | 9.7 |
| FE-A | `pages/stay/StayDialogs.tsx` (`ChangeRoomForm`) | Bản 1.7: `room_change.no_rooms_not_ready` khi danh sách lọc rỗng mà có căn trống VD/CL. Nên có (#98 hoặc v1.0.6) | 9.7 |
| MOB | `apps/mobile` (#97), `gen_strings.py` | Bản 1.7: cùng khóa `hk.action.needs_cleaning`, chữ mới. PR gộp sau giữa #97 và #102 bỏ dòng trùng | 9.7 |
| FE-A | `app/problem.ts` (`fieldErrorText`), `pages/stay/common.tsx` (`useSubmit().text`), `pages/money/MoneyPage.tsx` (hộp chi hoàn), các hộp ghi khoản thu có ô `bankReference` | Bản 1.8: cặp `bankReference` + `CARD_NUMBER_DETECTED` → `pay.bank_reference_card_like` dưới ô; khung lỗi theo nhánh `VALIDATION_FAILED`, không hiện `error.CARD_NUMBER_DETECTED`. Lên cùng bản sửa BE C0313-25, hộp chi hoàn trước | 9.8 |
| FE-A | hộp Trả phòng quá ngày đi (`pages/stay/CheckOutPage.tsx` hoặc tệp FE chọn), `gen_strings.py` | Bản 1.9: `checkout.overdue_reason_help` ở `help` của `Field` ô `overdueReason`, luôn hiện. Điều kiện SEC mục 2.5, SEC xem ở PR FE | 9.9 |
| FE-A | `design/tools/gen_strings.py` (#118) | Bản 2.0: chữ mới `mfa.enroll_required`, `mfa.required_note`, `mfa.nudge` (EN U+2011). Điều kiện gộp #118 | 9.10 |
| FE-A | `design/tools/gen_strings.py`, `pages/booking/BookingDialog.tsx` (#122) | Bản 2.0: xóa `booking.hold.typed_rate_locked`, ghi chú `bk.src_typed`. `rangeSentence` theo mục 3 (`money()`, dự phòng `rate_out_of_range_dates`) | 3, 9.10 |
| MOB | `apps/mobile` (#97), `gen_strings.py` | Bản 2.0: nút Báo cần dọn vào thân màn (PR97-01); `hk.queue.r.time_report`, `hk.needs_cleaning_help` (nên có); ghi chú `staff.notif.k.hold_expired` và một dòng `hk.action.needs_cleaning` khi gộp `main` sau #102; `ICON` 3 tin giữ chỗ (tùy) | 9.10 |
| UXD | `design/content-guide.md` | Sau khi FE áp: đồng bộ mục 8 theo `strings-tables.md`, ghi phiên bản v0.4.7, xóa dòng `fo.tabs.holds`, sửa ô `bk.src_weekend` trong `hifi/09-booking.html`. Bản 2.0: thêm `hk.action.needs_cleaning`, các khóa 9.10, sửa dòng `staff.notif.k.hold_expired`. Khi #116 gộp: DS 2.4 ghi "trang khách không dùng `info` xanh lam" | 1.3, 4.18, 9.10 |
| UXD | `design/tools/gen_strings.py` (+ sinh lại), `design/content-guide.md` | Bản 2.1: chữ chốt `mlog.a_money_not_found`. **Đã áp** cùng commit bản 2.1 | 9.11 |
| FE-A | `pages/money/MoneyPage.tsx` (`AuditAction`), `v104-money-labels-fea.test.tsx`; `gen_strings.py` khi thêm nút 5B-1 | Bản 2.1: chọn `mlog.a_money_not_found` khi `after.kind = deposit_after_cancel`, khác → `mlog.a_other` (nên có). EN `today.money_after_cancel_not_found` "Money not received" | 9.11 |
| FE-A/FE-B (người nhận V5-13) | `app/auditReason.ts`, `pages/stay/CheckOutPage.tsx`, `pages/stay/FolioDialog.tsx`, thẻ Folio của khung đơn, `gen_strings.py` | Bản 2.1: một hàm nhãn lý do hoàn 3 bước, thay `REFUND_REASON`; cộng `openRefunds` theo nhóm, xếp theo bảng; `folio.open_refunds_total`, `drawer.folio.open_refunds`; sửa `checkout.pending_refund_unavailable`; xóa `checkout.pending_refund_line`. Lên cùng V5-13 | 9.12 |
| FE-A | `app/problem.ts`, `pages/stay/FolioDialog.tsx` (`debtRule`, `windowOver`, khung đã khóa), các hộp gặp 409 `FOLIO_LOCKED` | Bản 2.1: chọn câu theo `lockReason`, bỏ dò `detail`; `settled` chọn câu theo vai; 3 câu mới khác và 3 câu sửa nên có. Lên cùng V5-44 | 9.12 |
| ARC | `openapi.yaml` (`recordPayment` (B)), `api-client` sinh lại, `contract-0.3.13.md` ("Ai làm tiếp", C0313-25) | Bản 2.1: "8 ký tự cuối" → "8 chữ số cuối (UXD `pay.bank_reference_card_like`)". Lượt tài liệu tới | 9.8 |
| ARC | `openapi.yaml` `OpenRefund.reasonCode` (0.3.14) | Bản 2.1: thêm nhóm mã lý do hủy (DOM 112-01) và câu "Desk gom theo nhãn, không hiện mã"; ghi rõ mã nhập tay không dùng lại giá trị của `CancelReasonCode` | 9.12 |
| FE-A (làn V5-11) | `pages/stay/EarlyDepartureDialog.tsx`, `app/problem.ts` | Bản 2.2: thứ tự xét 409 (`useCheckout` → `minNewDepartureDate` → câu chung); `err.min_date` + nút `use_min_date`, nâng `{min}`; Alert `use_checkout` + nút `checkout_now`; W với khoảng chọn rỗng → `use_checkout`; `canCheckOut` so ngày lịch trong W (bắt buộc); `fee_business_date` (nên có). Khóa đã có trên `main`, FE bỏ khóa tạm | 9.13 |
| UXD | `design/tools/gen_strings.py` (+ sinh lại), `design/content-guide.md` | Bản 2.2: 4 khóa mới, ghi chú 4 khóa có sẵn. **Đã áp** cùng commit bản 2.2 | 9.13 |
| FE-3 (#134) | `design/tools/gen_strings.py` (+ sinh lại), `pages/stay/OpenRefundRows.tsx` | Bản 2.3: thêm `folio.open_refunds_may_decrease`, dùng ở biến thể `full` thay `approvals.refund_may_decrease`; sửa ghi chú `folio.open_refunds_total`. Điều kiện gộp #134 (FB-R5-UXD-FE-134-01) | 9.14 (b) |
| FE-3 (#141) | `design/tools/gen_strings.py` (+ sinh lại), `__tests__/v5-18-deposit-unverified-fe3.test.tsx` | Bản 2.3: chữ chốt `deposit.accept_shortfall_unverified`, bỏ "NHÁP" ở ghi chú; test dòng 100 dò chữ mới. Điều kiện gộp #141 (FB-R5-UXD-FE-141-01) | 9.14 (a) |
| FE-3 (PR sau #137) | `pages/reservations/ReservationDialogs.tsx` (`DepositDialog`, `useAction`), `design/tools/gen_strings.py`, test | Bản 2.3: B4 gặp 409 `currentState` đóng, hoặc 412 mà đọc lại thấy đơn đóng → câu 9.1a, khóa hộp; `_sales` mới; focus về Alert (137-02); khóa ô, nút Đóng (137-03, nên có). Bắt buộc trước tag v1.0.5 (137-01) | 9.1a, 9.14 (c) |
| FE (sau 0.3.14) | `pages/stay/OpenRefundRows.tsx` | Bản 2.3: chỉ hiện `folio.open_refunds_may_decrease` khi có nhóm `awaitingDecision = true`; trường vắng thì giữ Σ > 0 | 9.14 (b) |
| ARC | `openapi.yaml` `OpenRefund.awaitingDecision` (0.3.14, đã có trong kế hoạch ARC 5.1) | Bản 2.3: mô tả trường ghi "true = nhóm còn ít nhất một yêu cầu chưa duyệt", để Desk chọn câu `folio.open_refunds_may_decrease` | 9.14 (b) |
| UXD | `design/content-guide.md` | Bản 2.3: sau khi #134, #141 và PR 137-01 gộp, thêm 3 khóa 9.14 vào mục 8 | 9.14 |
| FE-A2 (#145) | `design/tools/gen_strings.py` (+ sinh lại, gộp `main` trước), `pages/stay/CheckOutPage.tsx`, `pages/stay/overdue.tsx` | Bản 2.4, bảng A: sửa `overdue_time_help`, `overdue_after_limit`, EN `no_notice`; thêm `overdue_time_help_agreed`, chọn theo `agreedCheckoutTime`; bỏ `co.time_from_late` trên nhánh quá ngày đi; `after_limit` chỉ khi ngày `checkoutAt` = D; ghi chú khóa "UXD duyệt 07/11". Điều kiện gộp #145 (FB-R5-UXD-FE-145-01) | 9.15 bảng A |
| FE-A2 (#145, cùng lượt nếu kịp) | `gen_strings.py`, `CheckOutPage.tsx`, `ReservationDrawer.tsx`, test | Bản 2.4, bảng B: `overdue_time_early` theo điều kiện ARC 3.4 (thay `after_limit` ở lỗi ô giờ và `overdueWhy`); `overdue_extend_hint` sau `overdue_need_*` khi có `extend_stay` (FB-R5-UXD-FE-145-02); `overdue_reason_evidence` và con trỏ cuối ô (tùy) | 9.15 bảng B |
| BA | sổ tay Desk v1.0.5 | Bản 2.4: nếu #145 gộp chưa có `overdue_time_early` hoặc `overdue_extend_hint`, đưa ý của hai câu vào sổ tay (cùng dòng release notes ARC 3.3) | 9.15 (b), (c) |
| UXD | `design/content-guide.md` | Bản 2.4: sau khi #145 gộp, thêm các khóa 9.15 vào mục 8. **Đã làm** ở bản 2.5 (v0.4.7) | 9.15 |
| FE-A (PR Desk 5B-1) | `design/tools/gen_strings.py` (+ sinh lại), hộp Ghi tiền về sau khi hủy (tệp FE chọn), `app/problem.ts` | Bản 2.5: đọc N = `getFolio.balanceDueVnd` khi mở hộp và sau mỗi lỗi 422, chọn câu theo N: `intro`/`intro_due`, `methods_hint`/`methods_hint_due`, `after_cancel_method`/`after_cancel_method_due`. `rebook`, `find_new` luôn hiện. Quẹt thẻ chỉ khi N > 0, điền sẵn số = N. Chọn thẻ: ẩn ô ảnh và ô `bankReference`, hiện `co.pos_code` (bắt buộc) + `co.pos_no_card`, chữ gợi ý `note_hint_card`. 422 `AMOUNT_EXCEEDS_BALANCE` → `after_cancel_card_max` với `{max}` của lỗi. Ghi xong: `openVnd` nhóm `payment_after_cancel` tăng → `done` với `{refund}` = phần tăng; không tăng → `done_fee`. Nút "Ghi khoản thu". `type` theo ARC 148-02. Điều kiện trước khi nút lên (DOM 148-01) | 9.1 |
| FE-A | `app/problem.ts` (409 `DUPLICATE_BANK_REFERENCE`), mọi hộp có ô `bankReference` | Bản 2.5: có `duplicateReservationCode` → `error.DUPLICATE_BANK_REFERENCE`; không có (sale, CTV) → `error.DUPLICATE_BANK_REFERENCE_no_code`. Không để `{code}` trống (DOM 148-06) | 9.1 |
| BE + ARC | `refunds.service.ts` `executeRefund` (nhánh nơi nhận cố định), `openapi.yaml` 0.3.14 | Bản 2.5: dấu hiệu riêng cho ca "nơi nhận cố định, folio không còn khoản chuyển khoản, VietQR chưa đảo" (`detail` hoặc `extras.reason`, ARC chốt). Bỏ chữ "use executeCashRefund" ở nhánh này (DOM 148-07). FE-A hiện `error.refund_no_transfer_left`, không hiện lối chi tiền mặt | 9.1 |
| FE-A | "Cần chú ý", hộp "Không thấy tiền" | Bản 2.5: chữ mới `today.money_after_cancel_not_found_note` (DOM 148-08). Thêm khóa khi làm 5B-1 | 9.1 |
| BA | sổ tay lễ tân (`product/docs/manual/guides/02-le-tan.md`) | Bản 2.5: mục tiền về sau khi hủy dùng đúng tên nút và câu hộp 9.1 bản 2.5; thêm ý 4 của DOM 148-04 (phí hủy, phí không đến: quẹt thẻ trên chính đơn đã đóng, tối đa số còn phải thu). Lên cùng PR Desk 5B-1 | 9.1 |
| FE-A (PR Desk đổi người chốt) | khung đơn, ô Người chốt (`bk.closer_sales`, `bk.closer`), `design/tools/gen_strings.py` | Bản 2.5: sửa được theo mốc (giữ chỗ FD+; ngoài giữ chỗ, chưa nhận phòng MGR+; sau nhận phòng chỉ OWN). Vai không sửa được thấy tên chỉ đọc kèm `rsv.closer.readonly_manager` hoặc `readonly_owner`, không có nút. Ô lý do chỉ hiện khi đổi người, ngoài giữ chỗ: bắt buộc cho OWN sau nhận phòng, "Không bắt buộc" trước đó; `reason_help` luôn hiện. Chỉ gửi `closerChangeReason` khi `closerUserId` đổi. 403 → tải lại đơn rồi hiện `error.closer_change_forbidden`. 422 `CARD_NUMBER_DETECTED` ở ô lý do → `field_error.reason_card_number` (DOM 154-03, SEC 1I-03) | 9.16 |
| UXD | `design/content-guide.md` | Bản 2.5: thêm khóa 9.1 (bản 2.5) và 9.16 vào mục 8 sau khi FE-A áp. Bản 2.6: cùng với 2 khóa 9.18 | 9.1, 9.16, 9.18 |
| FE-A (#162) | `pages/reservations/CloserField.tsx`, `design/tools/gen_strings.py` (nếu áp 162-01 của DOM) | Bản 2.7: toast `common.saved` và focus về ô chọn sau khi lưu (điều kiện gộp, UXD 162-01); nút phụ `common.unsaved_discard` (162-02); `mlog.closer_inactive` thay `mlog.who_unlisted` sau khi #164 gộp (162-03); chữ mới `rsv.closer.readonly_manager` nếu tiện | 9.16 |
| FE-A2 (PR sau #159) | `pages/money/MoneyPage.tsx` (`AuditAction`, nhánh `reservation.closer_changed`), `design/tools/gen_strings.py`, `r5-mlog-closer-names-fea.test.tsx` | Bản 2.6: `after` không có khóa `closerUserId` → cả dòng `mlog.a_closer_changed_legacy`; id không có trong danh sách đã tải → `mlog.closer_inactive` thay `mlog.who_unlisted`. `before.closerUserId` rỗng ở bản ghi mới giữ "—". Ô lọc Người làm không đổi. Test: ca bản ghi cũ, ca id vắng | 9.18 |
| PO | release notes v1.0.5 (nếu có dòng Nhật ký tiền) | Bản 2.6: "Các lần đổi người chốt trước bản này hiện 'bản ghi cũ, không có tên'." (tùy PO) | 9.18 |

Phát hiện ngoài phạm vi chữ, chuyển BE và QA (không phải ESC): validator `weekend_nights` (`parameter-rules.ts:180–187`) chỉ nhận số 1–7, trong khi giá trị đang chạy và kiểu `Weekday` dùng mã chữ `["FRI","SAT"]` (`production-defaults.ts:200`, `pricing.ts:12`). Hệ quả:
- lưu lại đúng giá trị đề xuất của từ điển sẽ bị 422, kèm câu "Chọn một trong: 1, 2, 3, 4, 5, 6, 7";
- còn lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần.

Hôm nay INV không cần sửa tham số này (mức tăng = 0, hướng dẫn chuyển giá giữ FRI/SAT), nên chưa gây sai tiền. Nhưng đây là bẫy. Đề xuất: BE đổi validator sang tập `MON…SUN`, và `allowed` trả các mã này. DOM đã chốt cùng hướng (`rules-v1.0.5.md` mục 8.4, BUG-R5-001): sửa bộ kiểm, không đổi bộ tính giá; ARC chốt.

## 7. CPY duyệt (kết quả review 06/11, `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md`)

| # | Khóa | Kết quả CPY | Đã áp ở bản 1.1 |
|---|---|---|---|
| C1 | 7 chuỗi RU ở mục 5.1 | Duyệt có điều kiện (thẻ 01) | Thẻ 01: "Предоплата" ở dòng 4 `sale.quote_text` (5.1) |
| C2 | `gw.lang_auto` (EN, VI, RU) | Duyệt | Thêm `gw.lang_auto_sr` (thẻ 10, 4.6) |
| C3 | `bill.line.early_departure_fee_same_day`, `_notice_one`, `_notice_other` | Duyệt | Thẻ 03: U+00A0 sau `{noticeDays}` (4.1) |
| C4 | `bill.line.late_fee_as_night` | Duyệt | Thẻ 05: VI có ngoặc. Thẻ 04 (bản 1.2): DOM xác nhận ca sửa thẳng, thêm `bill.line.late_fee_after_limit` theo chữ CPY (4.8) |
| C5 | Dấu "!" ở `msg.hot_water_issue` | Duyệt có điều kiện (thẻ 06) | 3 câu của CPY (5.1). Mức nên có, cùng lượt với 4.20 (b), 4.21, thẻ 08 |
| C6 | "phụ thu" ở họ `bill.line.*` | Đồng ý để sau | v1.0.6, gộp 4.20 (c) (backlog R5-B-03). Hướng VI đã có ở mục 2 của tệp review CPY |

Các khóa khách CPY viết thêm trong review: 4.20, 4.21, `gw.req.clean_long_fee` (5.1), `gw.lang_auto_sr` (4.6). Khi áp thì không cần CPY duyệt lại. UXD kiểm khớp nguyên văn khi review PR.

CPY lượt 3 (mục 12 tệp review): thẻ 04 Closed; `stay.charge_penalty_note` (4.3) DUYỆT; 3 câu `sale.hold_next`, `sale.hold_next_ctv`, `sale.hold_next_no_qr` (4.14) DUYỆT CÓ ĐIỀU KIỆN theo thẻ 12. Bản 1.3 áp nguyên chữ CPY của thẻ 12.

Mọi khóa còn lại là chữ Desk nội bộ, UXD tự quyết theo protocol.

## 8. Kiểm sau khi áp (QA, UXD review PR)

- `grep` trên `strings-vi.json` và `strings-en.json`: không còn "28 đêm", "28 nights", "7 đêm", "7+ nights", "+15", "trước giảm theo số đêm", "before length-of-stay", "(R2)", "R2:", "Round 3", "Cả 10 căn", "All 10 rooms".
- `strings-ru.json` và `quote-copy.ts`: không còn "апартамент", "Депозит". `gw.req.clean_long_fee` RU không còn "аренда".
- `quote-copy.ts` VI và `gw.req.clean_makeup_free`, `gw.req.clean_second_fee`: không còn "căn" đứng riêng. Nếu lượt C5 đã áp thì 3 mẫu `msg.*` VI cũng không còn.
- Nếu lượt C5 đã áp: `msg.hot_water_issue`, `msg.house_rules_smoking`, `guest.late.done_title`, `msg.bill` RU không còn "!", trừ lời chào RU "Здравствуйте, {name}!".
- Phiếu VI/EN: `bill.line.early_departure_fee_notice_*` có U+00A0 sau số (soát bằng `tv(key)`, không gõ lại). Ở khung 362 px, số và chữ "ngày"/"days'" không tách dòng.
- `strings-vi.json`, `strings-en.json`: không còn "được nhắc", "get a reminder", không còn khóa `sale.hold_next*_one` / `_other`. Hộp xanh sau khi tạo giữ chỗ hiện đúng giờ hạn của đơn (so với khung đơn), cả khi giữ chỗ bị chặn ở `holdLatestTime`. Đăng nhập vai sale và vai CTV: tạo giữ chỗ, đọc hộp xanh, mở đơn ở "Đơn của tôi" → nút "Gia hạn giữ chỗ (1 lần)" hiện trước hạn, đúng chữ trong câu (so với `drawer.action.extend_hold`).
- Hộp thêm khoản phát sinh (StayDialogs 755): chọn khoản nhóm `penalty`, rồi nhóm `damage`. Câu "Phí phạt và tiền bồi thường hư hỏng…" hiện ở cả hai; khoản minibar, giặt không hiện.
- Phiếu: quản lý sửa đơn giá dòng `late_fee_as_night` 800.000 → 400.000 → nhãn "Phụ thu trả muộn (rời sau mốc trả muộn)"; dòng 800.000 kèm FOC 400.000 → nhãn "Phụ thu trả muộn (bằng giá 1 đêm)".
- Trình đọc màn hình (VoiceOver hoặc NVDA) ở ô chọn ngôn ngữ trang khách: đọc "Language selected for you" khi khách chưa tự chọn.
- Đổi thử tham số trên stack QA: `long_stay_required_from_nights` = 21, `checkout_time` = 11:00, `los_discount` có 1 bậc, `weekend_uplift_pct` = 10. Chữ theo đúng số mới:
  - hộp thuê dài hạn;
  - gợi ý trả muộn;
  - dòng "Đã giảm … theo số đêm ở";
  - các dòng "{n} đêm × giá" của báo giá cộng đúng bằng tổng.
- ParamDialog: thử 6 dạng lỗi `PARAM_OUT_OF_RANGE`, JSON thiếu ngoặc kép, giờ sai dạng. Không còn `{min}`, `{max}` lộ ra; không còn "danh sách" ở ô không có danh sách.
- Đặt phòng mới, kênh OTA để trống giá: không có "0 đ". Trực tiếp gõ dưới sàn: câu có số sàn, trần thật.
- Desk EN ở khung 362 px (PWA) và 1440 px: các cụm U+2011 không gãy dòng.
- Bản 1.4, mục 9.1 (khi 5B-1 lên staging): lễ tân mở đơn đã hủy → nút "Ghi tiền về sau khi hủy" có, sale và CTV không thấy nút. Hộp chỉ có Chuyển khoản, VietQR (bản 2.5: khi N = 0; N > 0 xem dòng bản 2.5). Khung cảnh báo đầu hộp luôn hiện. Thiếu ảnh hoặc chọn tiền mặt thì hiện đúng câu 9.1. Ghi xong hiện câu `rsv.after_cancel.done` có số tiền và mã đơn.
- Bản 1.5, mục 9.1 (ca QA (h), (i) của DOM 11.4): yêu cầu hoàn tự tạo hiện "Tiền về sau khi hủy", khối nơi nhận cố định, không có nút Nhập nơi nhận hoàn, không có lối chi tiền mặt. Cùng 400.000 ở đơn cũ và đơn mới, cách 2 giờ: chip "Có thể trùng" ở màn duyệt hoàn và màn đối soát, câu chỉ hiện mã đơn. Gõ lại một mã giao dịch đã ghi: câu `error.DUPLICATE_BANK_REFERENCE` có mã đơn kia, không có khoản thu mới.
- Bản 1.5, mục 9.1a (khi V5-48 lên staging): lễ tân bấm Xác nhận cọc hoặc tạo VietQR trên đơn đã hủy (mở ở tab cũ) → câu 9.1a có "Đã hủy", không phải câu "tải lại". Sale tạo VietQR trên đơn đã hủy → câu `_sales`. Đơn Không đến → "Không đến".
- Bản 1.5, mục 9.4 (khi PR #96 lên staging): `los_discount` có `pct` 120 ở luật thứ hai → "Chỗ cần sửa: mục 2, pct. Giá trị phải từ 0 đến 100. …"; `lease_terms` 13 kỳ → câu cả giá trị có "(12)"; `weekend_uplift_channels` = "web" → "Chọn một trong: all, direct, agent, ota". Không còn `{where}`, `{detail}`, `{key}` lộ ra; chỉ số đếm từ 1.
- Bản 1.6 (khi PR #96 và mã ARC lên staging): T-13-2 `cancel_policy_direct` `[]` → câu `params.err_cancel_policy_empty`; T-13-4 `{"collaborator":3}` → "Chỗ cần sửa: sales_staff. Cần đủ hai vai: …"; T-13-8 DB có `early_departure_refund` = `50`, lễ tân bấm Trả sớm → câu `error.PARAMETER_MALFORMED` có "chính sách hoàn khi trả phòng sớm", không có mã khóa, folio không đổi; quản lý bấm cùng nút → bản `_manager`.
- Bản 1.5, mục 9.5 (khi PR-B2 lên staging; ca DOM T-16-1…10, ARC T16-6…12): lễ tân bỏ dòng tay của chính mình hôm nay → lưu được. Bỏ dòng của lễ tân khác, dòng phụ thu trả muộn Desk tự ghi, dòng mình ghi hôm qua → câu `error.reduce_needs_foc`, có nút "Gửi miễn có duyệt", folio không đổi. Bấm nút → form miễn phí đúng dòng, Số tiền điền sẵn đúng phần định giảm, chọn được "Ghi nhầm". Quản lý bỏ dòng bất kỳ → lưu được, không có câu phụ. Lễ tân không thấy bộ lọc "Sửa giảm dòng – 7 ngày".
- Bản 1.5, mục 9.3 (khi V5-1A lên staging): căn giá tháng 8.500.000, gõ giá đêm 2.800.000 → câu `rooms.night_high`, nút "Vẫn lưu giá này", lưu được. Gõ 1.700.000 (đúng bằng ÷ 5) → không cảnh báo. Gõ 280.000 (< ÷ 30) → câu `rooms.night_low` mới. Lưu giá đêm qua API với giá tháng ngày hiệu lực khác giá đang hiện → toast có dòng `rooms.warn.nightly_price_unusual`.
- Bản 1.4, mục 9.2 (khi V5-25 lên staging, theo oracle BR-113-06…30): ca 07, 08, 09, 20, 22, 27 → `params.err_min_stay_shape`; ca 11, 12, 16 → `params.err_min_stay_nights` với số đúng; ca 17, 18, 19, 23, 24, 25 → câu chung 9.4 có "Chỗ cần sửa: mục 1, …" và "Chọn một trong: …" (bản 1.5: ca 23 chuyển sang đây theo PR #96); ca 28 → `params.err_short_stay_below_min_stay` với số 2. Không còn `{min}`, `{max}` lộ ra.
- Bản 1.7, mục 9.7 (khi #98 lên staging): mở Đổi phòng khi mọi căn trống còn VD → câu `room_change.no_rooms_not_ready` có số căn VD/CL, không có ô chọn; có một căn VC → câu đó không hiện, căn VC có trong danh sách. Không còn câu R2 có "Trống, sạch".
- Bản 1.7, mục 9.7 (khi #102 và #97 lên staging): Desk Trạng thái buồng và app nhân viên, căn OC có nút **Báo cần dọn** / **Mark for cleaning**; bộ lọc vẫn là "Cần dọn ({n})". Bấm → toast "Căn … chuyển cần dọn và có việc dọn.", chip "OD · Có khách, cần dọn", có việc "Dọn phòng khách đang ở".
- Bản 1.7, mục 9.7 (căn kẹt, dữ liệu QA): căn OC không có đơn Đang ở, nhận phòng đơn khác vào căn đó → câu `checkin.room_status_stuck` có "Báo cần dọn"; căn OD → câu `_od`. Làm theo câu: Báo cần dọn → Bắt đầu dọn → Dọn xong → căn VC → nhận phòng được.
- Bản 1.8, mục 9.8 (khi hàm SEC 4.1 lên staging; ca SEC 4.3, chỉ dùng số thẻ thử công khai, không dùng mã giao dịch thật): ở hộp Ghi đã hoàn chuyển khoản và hộp ghi khoản thu chuyển khoản, VietQR:
  - gõ `4111111111111111` hoặc `4111-1111-1111-1111` → dưới ô hiện câu `pay.bank_reference_card_like` có icon ✕; khung lỗi không có "Ô ghi chú"; không có khoản thu hay lệnh chi mới; giá trị vẫn còn trong ô;
  - gõ `11111111` → lưu được;
  - ô ghi chú có `4111 1111 1111 1111` → vẫn câu `error.CARD_NUMBER_DETECTED`;
  - Desk EN: "Enter the last 8 digits of the transaction reference."
- Bản 1.9, mục 9.9 (khi hộp Trả phòng quá ngày đi lên staging): đăng nhập vai quản lý, mở trả phòng một đơn quá ngày đi 1 đêm → dưới ô lý do có câu `checkout.overdue_reason_help`, chữ Stone, không khung màu, cả khi đã chọn lý do gợi ý. Trình đọc màn hình đọc câu khi vào ô. Desk EN: "Don't write the guest's name, ID numbers or health information."
- Bản 2.0, mục 9.10 (#118 trên staging, `MFA_ENFORCED` bật): lễ tân trưởng chưa bật 2FA đăng nhập → màn Bật xác thực 2 bước ghi "Vai của bạn bắt buộc…", không còn "chủ đầu tư và quản lý". Trang Bảo mật của lễ tân trưởng: "Bắt buộc với vai của bạn.", không có nút Tắt. Desk EN: "2‑step" không gãy dòng ở 390 px.
- Bản 2.0, mục 9.10 (#122): H09 Trực tiếp, gõ giá ngoài sàn–trần → dưới ô có "Giá phải từ 300.000 đ đến 3.000.000 đ (sàn–trần của nhóm căn).", không có ngoặc cụt, không có "{". `strings-vi.json` không còn `booking.hold.typed_rate_locked`.
- Bản 2.0, mục 9.10 (#97): căn OC → nút "Báo cần dọn" trong thân màn, chân màn trống. Dọn xong căn có khách, chờ 11 giây → chân màn không có nút. Tắt mạng lâu hơn hạn giờ bấm, Báo cần dọn bị từ chối → câu "Nếu căn vẫn cần dọn…".
- Bản 2.1, mục 9.11 (dữ liệu QA, vai quản lý): đóng một dòng Cần chú ý "Tiền về cho đơn đã hủy" bằng Không thấy tiền → Nhật ký tiền, cột Thao tác: "Không thấy tiền về cho đơn đã hủy", không có "Thao tác tiền khác", không có mã `attention_event.resolved`. Desk EN: "Money not received for cancelled booking".
- Bản 2.1, mục 9.12 (V5-13 trên staging): đơn có 3 yêu cầu hoàn mở, mã `early_departure`, `found_other`, `price` → Trả phòng bước ③: dòng "Đang chờ hoàn cho khách" có tổng, dưới là **2** dòng: "Hoàn khi trả sớm", "Hoàn khi hủy hoặc không đến". Cột Lý do ở Hoàn tiền: hai yêu cầu hủy cùng nhãn "Hoàn khi hủy hoặc không đến", ghi chú sau nhãn. Yêu cầu mã lạ → "Hoàn tiền". Không chỗ nào hiện mã thô. Vai sale, CTV: khung đơn không có dòng "Đang chờ hoàn".
- Bản 2.1, mục 9.12 (V5-44, theo ca T44-1 của BE): gửi miễn/giảm trên folio đã chốt → lễ tân thấy câu `error.FOLIO_LOCKED_settled` (có "nhờ quản lý"), quản lý thấy `_settled_mgr`; không câu nào có "kể cả quản lý". Folio quá hạn sau trả phòng → `_window_over`. Quản lý giảm dòng vượt phần còn sửa trên đơn có nợ → `folio.adjust_debt_locked` và nút Xóa công nợ. Sửa thông tin hóa đơn sau khi HĐĐT phát hành → `_invoice_issued`. Desk EN ở 1366 px: câu dài nhất (`_window_over`) không đẩy nút chính ra khỏi hộp.
- Bản 2.2, mục 9.13 (V5-11; giờ thật trên staging hoặc mock khóa giờ; dữ liệu QA), ca T-11-2: mở Trả sớm lúc 23:55 ngày 20/10 cho đơn 19–24/10, giữ Ngày rời mới 20/10, bấm Xem trước số tiền lúc 00:05 → dưới ô: "Đang sau nửa đêm nên đêm qua là đêm khách đã ở. Ngày rời mới sớm nhất là 21/10/2026." (`date()`: dd/mm/yyyy), nút "Dùng 21/10/2026". Bấm nút → ô là 21/10, hết lỗi, câu giúp "Từ 21/10/2026 đến 23/10/2026…". Không chỗ nào hiện câu chung `INVALID_TRANSITION`. Ca giống vậy nhưng bấm Xác nhận trả sớm sau 00:00 → về bước ①, cùng câu.
- Bản 2.2, mục 9.13, ca T-11-4 trên Desk: đơn 19–21/10, mở Trả sớm lúc 23:50 ngày 20/10, chọn Ngày rời mới 20/10, bấm Xem trước lúc 00:05 → Alert "Đang sau nửa đêm của ngày đi – không cần Trả sớm, làm Trả phòng như thường lệ. Chưa ghi gì.", không còn nút Xem trước; nút chính Trả phòng ngay mở trang Trả phòng, có câu `checkout.post_midnight`, phụ thu 0. Đơn 20–21/10 lúc 03:00 ngày 21/10 (ca T-11-4 của DOM): khung đơn không có nút Trả sớm, chỉ Trả phòng; nếu hộp vẫn mở được (liên kết cũ) → Alert ngay, không gọi máy chủ.
- Bản 2.2, mục 9.13, ca T-11-1 (03:00 ngày 21/10, đơn 20–24/10, Ngày rời mới 21/10): ô đặt sẵn 21/10. Bước ② dưới "Phí trả phòng sớm" có "Đang sau nửa đêm nên phí ghi vào ngày nghiệp vụ 20/10/2026."; folio có dòng phí ngày 20/10 (T-11-3). Bước ③ có "Ngày rời là hôm nay…" và nút Trả phòng ngay, **không** có "nút Trả phòng hiện vào ngày đó". Cùng đơn lúc 10:00: không có câu ngày ghi phí.
- Bản 2.2, mục 9.13, Desk EN ở 1366 px: Alert `use_checkout` không đẩy nút chính ra khỏi hộp; nút "Use 21/10/2026" không tách ngày xuống dòng.
- Bản 2.3, mục 9.14 (a), quản lý, dữ liệu QA:
  - đơn giữ chỗ có cọc chuyển khoản tay 200.000 chờ đối soát. Mở Xác nhận cọc, chọn "Chấp nhận cọc thiếu" → `Alert warn` "Trong số cọc đã nhận, 200.000 đ còn chờ đối soát. Trước khi chấp nhận, …", ngay dưới ô chọn;
  - cọc chỉ có tiền mặt tại quầy → không có câu;
  - lễ tân không có ô này, nên không có câu.
- Bản 2.3, mục 9.14 (b):
  - đơn có hai yêu cầu hoàn đã duyệt chưa chi → dưới "Đang chờ hoàn cho khách" là các dòng nhóm, rồi "Số chưa duyệt có thể giảm khi duyệt…". Không còn câu có "yêu cầu này";
  - sau 0.3.14, cùng đơn → không có câu "có thể giảm";
  - khung đơn khi đọc folio lỗi → "Chưa tải được khoản chờ hoàn…" dưới "Còn phải thu", không có số 0.
- Bản 2.3, mục 9.14 (c): lễ tân mở Xác nhận cọc, chọn Chuyển khoản, gõ số. Ở tab khác hủy giữ chỗ, rồi bấm Xác nhận →
  - câu 9.1a có "Đã hủy" ngay trong hộp. Không có "Dữ liệu vừa được người khác thay đổi", không có "Đơn vừa chuyển sang";
  - nút chính khóa, focus ở câu;
  - sale, cùng ca → "…không xác nhận cọc hay tạo mã VietQR được nữa. Khách đã trả tiền: báo lễ tân kèm mã đơn."
- Bản 2.4, mục 9.15, quản lý, mock (giờ trả chuẩn 12:00), đơn quá ngày đi 1 đêm:
  - không có giờ hẹn → dưới ô giờ: "Giờ khách rời căn, ngày dd/mm/yyyy. Không có bằng chứng thì ghi 12:00 (giờ trả chuẩn), hoặc giờ thấy căn trống nếu sớm hơn – không phụ thu.";
  - có giờ trả muộn hẹn 14:00 → câu "…thì giữ 14:00 (giờ trả muộn đã hẹn) và phụ thu đã hẹn. Có bằng chứng khách đi sớm hơn …". Không còn câu riêng "Theo giờ trả muộn đã hẹn 14:00.";
  - gõ giờ quá mốc cuối của ngày đi → lỗi ô giờ và câu cạnh nút khóa cùng là "Giờ này quá mốc trả muộn của ngày đi nên tính thêm 1 đêm. …".
- Bản 2.4, mục 9.15 bảng B, cùng đơn (ngày đi D), gõ 03:00 (mock tái hiện V515-01) → "Desk hiểu 03:00 là rạng sáng <D+1>. Khách đi lúc 03:00 ngày <D>: ghi 06:00, …". Không có câu "quá mốc trả muộn". Lặp lại với đơn đã gia hạn mà vẫn quá ngày đi: <D> là ngày đi sau gia hạn. Sau khi v1.0.6 lên staging: cùng thao tác → không có câu này.
- Bản 2.4, mục 9.15 bảng B, lễ tân (FD, FDL), đơn quá ngày đi 1 đêm → màn chỉ dẫn và ngăn đơn: câu "cần quản lý hoặc chủ đầu tư trả phòng." rồi "Trước khi gọi, kiểm căn: …". Nút Gia hạn còn bấm được. EN ở 390 px: hai câu không tràn khung ngăn đơn.
- Bản 2.4: `grep` trên `strings-en.json`: không còn "without telling us"; `strings-vi.json` không còn "Không có bằng chứng giờ:".
- Bản 2.5, mục 9.1 (khi PR Desk 5B-1 lên staging; ca ARC 105-03 t1–t7, số thử):
  - đơn OTA trả tại chỗ, hủy có phạt 500.000 (N = 500.000): khung có "Đơn còn phải thu 500.000 đ…"; ô cách thanh toán có Quẹt thẻ. Chọn thẻ → số điền sẵn 500.000, không có ô ảnh, không có ô mã giao dịch, có ô mã chuẩn chi. Ghi → câu `done_fee`, không có yêu cầu hoàn mới;
  - cùng đơn, thẻ 500.001 → dưới ô số tiền "Quẹt thẻ tối đa 500.000 đ, là số đơn còn phải thu.", không có khoản thu mới;
  - cùng đơn, chuyển khoản 800.000 → câu `done` có "Yêu cầu hoàn 300.000 đ", không phải 800.000;
  - đơn N = 0: khung "Đơn không còn nợ…"; ô cách thanh toán chỉ có Chuyển khoản, VietQR; nút chính "Ghi khoản thu";
  - vai sale gõ lại một mã giao dịch đã ghi → câu `DUPLICATE_BANK_REFERENCE_no_code`, không có "đơn " với chỗ trống;
  - `grep` trên `strings-vi.json`: không còn "yêu cầu hoàn đủ số tiền", "Ghi khoản thu và tạo yêu cầu hoàn"; `strings-en.json` không còn "Record payment and create refund request".
- Bản 2.5, mục 9.16 (khi PR Desk đổi người chốt lên staging):
  - lễ tân mở đơn đã xác nhận → tên người chốt chỉ đọc, dòng "Cần đổi người chốt? Báo quản lý…" (bản 2.7: "Báo quản lý hoặc chủ đầu tư…"), không có ô chọn. Không có dòng `access.denied` mới;
  - bản 2.7: quản lý đổi người chốt rồi bấm Lưu → toast "Đã lưu", focus ở ô chọn. Nút phụ là "Bỏ thay đổi", không phải "Hủy". Người chốt đã tắt → "Tài khoản hiện không hoạt động" ở chỗ của tên;
  - quản lý, cùng đơn → đổi được; ô lý do có "Không bắt buộc" và dòng help;
  - quản lý mở đơn đang ở → dòng "Khách đã nhận phòng nên chỉ chủ đầu tư…";
  - chủ đầu tư đổi người chốt đơn đang ở, để trống lý do → "Ghi lý do (ít nhất 3 ký tự)."; dòng help vẫn hiện. Gõ số thẻ thử công khai `4111 1111 1111 1111` → `field_error.reason_card_number` dưới ô, khung lỗi không có "Ô ghi chú";
  - lễ tân mở Lịch sử đơn → thấy lý do, đúng như dòng help nói;
  - Desk EN ở 390 px: hai dòng chỉ đọc và dòng help không tràn khung, không cắt chữ.
- Bản 2.6, mục 9.18 (mock hoặc staging, vai quản lý, rồi lễ tân):
  - bản ghi `reservation.closer_changed` có `before`, `after` rỗng → "Đổi người chốt (bản ghi cũ, không có tên)", không có "→";
  - bản ghi có `closerUserId` của người đã khóa → "Đổi người chốt: Sơn → Tài khoản hiện không hoạt động". Ô lọc Người làm vẫn có lựa chọn "Người không còn trong danh sách";
  - ghi người chốt lần đầu → "Đổi người chốt: — → Mai";
  - Desk EN: "Closer changed (older record, no names)", "Closer changed: Sơn → Inactive account".
