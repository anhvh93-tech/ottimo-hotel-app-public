# UXD review lượt 3 (xác nhận) – PR #22 `v1.0.2-ed`: thẻ 13–15 FE-A v1.0.1 + chuỗi BUG-R4-014

- Round 4 · Bước: Review (lượt 3, xác nhận) · Đợt v1.0.2 · 03/11/2026
- Đối tượng: nhánh `origin/v1.0.2-ed`, head **`ff16c1dd`** (sau khi BE-A gộp `main` `00881a53` ở `91c26e0c`).
  - `43a3a5a7` (FE-A sửa thẻ 13–15) và `d91cffae` (BUG-R4-014) đều nằm trong head (đã kiểm `git merge-base --is-ancestor`).
- Cách đọc: `git show ff16c1dd:<path>`, `git grep`, không checkout, không chạy test.
- Gốc thẻ: `rounds/round-03/reviews/UXD-on-FE-A-v1.0.1.md`, mục "Lượt 2 (27/10)" (thẻ 13–15) và mục "Lượt 2 – PR #22 (01/11)" (đã đóng trên head cũ). Lượt này kiểm lại trên head mới để chắc việc gộp `main` không làm hỏng bản sửa.

**Kết luận: ĐẠT.** Cả ba thẻ 13–15 vẫn đúng trên `ff16c1dd`. Chuỗi Desk BUG-R4-014 đúng giọng văn và brand, UXD duyệt. Không thẻ mới, không ESC.

---

## 1. Thẻ 13–15

| Thẻ | Kết quả | Bằng chứng trên `ff16c1dd` |
|---|---|---|
| FB-R3-UXD-FE-A-13 (Minor, G7 – nhãn dòng sau trần) | **Đã sửa – xác nhận** | `gen_strings.py:3825`, `strings-vi.json:3281`, `strings-en.json:3281`: VI "Trong đó hoàn được (tới mức khách đã trả thừa)", EN "Of which refunded (up to what the guest overpaid)", ghi chú dẫn thẻ 13. `EarlyDepartureDialog.tsx:849–855`: dòng nằm ngay dưới `row_refundable`, `<tr>` thường (chữ Ink, không `tr.sub`), số `r num` canh phải, chỉ hiện khi `refundCapped` và có `refundablePaidVnd` của server. Không có dòng "phần còn lại", client không tự trừ. Test `v101-early-departure-fea` có ca trần (`:501`) và ca không trần (`:190`). |
| FB-R3-UXD-FE-A-14 (Minor, CSS `.consequence` trùng) | **Đã sửa – xác nhận** | `packages/ui/src/styles/app.css` không còn chữ `consequence` (0 lần). `styles/index.css:6` import `design/hifi/assets/hifi.css`, nơi có `.consequence` / `.consequence li` (`hifi.css:350–351`). `EarlyDepartureDialog.tsx:955` dùng `ul.consequence` của DS, nên khối hậu quả giống H15 (gia hạn, trả muộn). |
| FB-R3-UXD-FE-A-15 (Suggestion, thứ tự chữ) | **Đã sửa – xác nhận** | `gen_strings.py:3826`, `strings-vi.json:3282`: "Không hoàn: khách báo trước chưa đủ số ngày theo chính sách trả sớm.", EN giữ nguyên, ghi chú dẫn thẻ 15. Vẫn là dòng phụ `.li-s` dưới `row_refundable` khi `refundableVnd = 0` và `droppedNetVnd > 0` (`EarlyDepartureDialog.tsx:838–846`). |

---

## 2. Chuỗi Desk BUG-R4-014 (`d91cffae`) – giọng văn và brand

Nhóm "R4 BUG-R4-014 – FE-A: Trả sớm B16 với HĐ thuê tháng" trong `gen_strings.py` (5 khóa). Hộp B16 của đơn `stayType = long` thay khối "Cách tính" BR-428 bằng một Alert `warn` nêu BR-313 v0.5.1.

| Khóa | VI | EN | Kết luận UXD |
|---|---|---|---|
| `early_departure.lease_title` | Trả trước hạn hợp đồng thuê tháng | Leaving before the monthly lease ends | Đạt |
| `early_departure.lease_rule` | Vi phạm HĐ: khách mất toàn bộ ký quỹ {amount} (giữ ngoài app). Không truy thu chênh lệch giảm giá kỳ hạn. | This breaks the lease: the guest forfeits the full security deposit of {amount} (held outside the app). No clawback of the lease-term discount. | Đạt |
| `early_departure.lease_rule_no_amount` | (như trên, không có số) | (như trên, không có số) | Đạt |
| `early_departure.lease_still_due` | Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ – không trừ vào ký quỹ. Tiền thuê đã thu cho tháng lịch chưa bắt đầu thì hoàn (làm ngoài app). | Unpaid utilities, extra cleaning and damage are still collected – not taken from the deposit. Rent already paid for calendar months not yet started is refunded (outside the app). | Đạt |
| `early_departure.told_guest_lease` | Đã báo khách: mất toàn bộ ký quỹ, không truy thu | I've told the guest: the deposit is forfeited, no clawback | Đạt |

Đã kiểm:
- **Brand / content guide:** không emoji, không "!", gạch nối "–" đúng chuẩn, tiền qua `{amount}` và `money()` (không viết cứng số, không viết cứng "1 tháng"). Câu ngắn, điềm tĩnh, nói việc chứ không trách ai.
- **Thuật ngữ nhất quán với Desk:**
  - "HĐ", "ký quỹ", "(ngoài app)" trùng `lsm.*`, `rack.long_prefix`, `lt.settlement.*`;
  - EN "security deposit" trùng `lsm.deposit`, `lt.settlement.deposit`;
  - "giảm giá kỳ hạn", "tháng lịch", "không truy thu" trùng câu trong `business-rules.md` (BR-313, mục giá dài hạn).
- **Giao diện:** Alert `tone="warn"` của `@ottimo/ui` (token sẵn có, không màu mới). Mọi chữ qua `t()`, không có chuỗi viết cứng trong `LeaseRule`.
- **Checkbox:** mẫu "Đã báo khách …" khớp `told_guest` của đơn ngắn ngày, nêu đúng điều lễ tân phải nói với khách.
- **Bước kết quả:** đơn thuê tháng không hiện "Không có khoản hoàn." / "Cách tính" BR-428. Nếu server có tiền thì vẫn hiện số kèm câu BR-313 (không xác nhận tiền chưa nhìn thấy). Hợp với nguyên tắc "hậu quả trước khi xác nhận" (US-135).
- Desk chỉ cần VI + EN. RU không bắt buộc cho giao diện nhân viên (content guide mục ngôn ngữ).

Nội dung nghiệp vụ (mất toàn bộ ký quỹ, hoàn tháng lịch chưa bắt đầu, BR-214) thuộc phần DOM duyệt. UXD chỉ duyệt chữ và cách trình bày.

---

## 3. Ghi chú nhỏ (không mở thẻ, không đổi chữ hiển thị)

1. Ghi chú nhóm BUG-R4-014 trong `gen_strings.py` còn "FE-A viết, chờ UXD/DOM duyệt". Lần sau sửa file này, FE-A đổi thành "UXD duyệt chữ 03/11 (lượt 3 PR #22); nội dung theo DOM". Phần DOM giữ nguyên cho tới khi DOM xác nhận.
2. Ghi chú các khóa DOM ED-01/03 (`gen_strings.py:3827–3830`, `:3832`) vẫn ghi "chờ UXD duyệt". Đã nêu ở lượt 2 – PR #22, UXD đã duyệt các khóa này ngày 27/10. Đổi cùng lúc với mục 1.
3. Gợi ý không bắt buộc: `lease_rule` mở bằng "Vi phạm HĐ:" ngay dưới tiêu đề "Trả trước hạn hợp đồng thuê tháng", nên hơi lặp ý. Giữ được, vì câu nói rõ lý do mất ký quỹ cho lễ tân. Nếu sau này cần rút gọn Alert thì bỏ cụm này trước.
