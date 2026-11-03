# UXD review – PR #22 `v1.0.2-ed`: chuỗi hộp "Trả sớm" cho HĐ thuê tháng (BUG-R4-014, sau ESC-048 B)

- Round 4 · Bước: Review · Đợt v1.0.2 · 03/11/2026
- Đối tượng: head **`9d4f0fa8`** (FE-A, "B16 lease box: lease-end rule, neutral deposit copy (ESC-048 B), DOM cards"), so với `ff16c1dd`.
- Cách đọc: `git diff ff16c1dd 9d4f0fa8`, `git show 9d4f0fa8:<path>`. Không checkout, không chạy test.
- Đã đọc: `product/design/tools/gen_strings.py` (nhóm "R4 BUG-R4-014", dòng 3916–3930), `strings-vi.json` / `strings-en.json` (nhóm `early_departure.*`), `EarlyDepartureDialog.tsx` (dòng 72–85, 334–414, 530–541, 719–747), `rounds/round-04/outputs/FE/v1.0.2-dom-cards.md`, `02-escalations/ESC-048.md`, `product/docs/business-rules.md` (BR-202, BR-206, BR-214, BR-313), `product/docs/manual/guides/02-le-tan.md` (mục HĐ tháng), `product/design/hifi/assets/hifi.css` (`.list-plain`).
- Brand: không thêm màu. Hộp dùng `Alert tone="warn"` và `.list-plain` (có dấu đầu dòng, `hifi.css:511`) sẵn có trong DS. Không emoji, không "!". Đạt.

**Kết luận: ĐẠT CÓ ĐIỀU KIỆN.** Nội dung đúng ESC-048 B và BR-313, VI/EN khớp nghĩa, giọng văn Desk đúng. Điều kiện: sửa thẻ 26 (Major, thứ bậc thông tin trong hộp) trước khi merge. Thẻ 27–29 (Minor) chạm cùng các chuỗi, nên làm cùng lần sửa, nhưng có thể dời v1.0.3 nếu ORC cần. Không ESC.

---

## 1. Bảng rà nhanh

| Khóa | Giọng văn | VI/EN khớp nghĩa | Thuật ngữ (BR, sổ tay) | Ghi chú |
|---|---|---|---|---|
| `lease_title` | Đạt | Đạt | Đạt | Giữ |
| `lease_check` (mới) | Đạt | Đạt | Đạt | Thiếu việc kiểm ngày ký HĐ (thẻ 26). EN "The Desk" lệch cách viết sẵn có (thẻ 28) |
| `lease_rule` / `_no_amount` | Đạt | Đạt | EN "full deposit" lệch "security deposit" của `lsm.*` (thẻ 28) | Giữ nội dung |
| `lease_still_due` | Đạt | Đạt | Đạt (BR-313, BR-214, BR-207) | Là ý con của nhánh "chưa thu đủ" nhưng đứng ngang hàng (thẻ 26) |
| `lease_rule_paid` (mới) | Dài, khoảng 50 chữ (thẻ 27) | Gần đạt: "đúng hạn" ↔ "normal" | Thiếu "dọn lẻ" so với BR-214 và câu bên trên (thẻ 28) | Nội dung đúng ESC-048 B |
| `lease_rule_old` (mới) | Đạt | Đạt | Đạt (BR-201) | Nên đứng đầu danh sách (thẻ 26) |
| `told_guest_lease` | Hơi dài cho nhãn ô tích (thẻ 30) | Đạt | Đạt | Trung tính, đúng ý ESC-048 B |

---

## 2. Thẻ feedback

### FB-R4-UXD-FE-26
- Mức độ: Major
- Vị trí: `EarlyDepartureDialog.tsx:729–747` (`LeaseRule`); khóa `early_departure.lease_check`, `lease_rule`, `lease_still_due`, `lease_rule_paid`, `lease_rule_old`
- Vấn đề: Hộp có 3 nhánh nhưng hiện thành 4 gạch đầu dòng ngang hàng, theo thứ tự: chưa thu đủ → `lease_still_due` → đã thu đủ → HĐ ký trước 01/11/2026.
  - (a) `lease_still_due` chỉ áp cho nhánh "chưa thu đủ", nhưng đứng ngang hàng và chen giữa hai nhánh 01/11. Tiền tố "Khi mất ký quỹ:" chỉ vá phần chữ. Đọc lướt, lễ tân dễ hiểu "không trừ vào ký quỹ" là quy tắc chung, trong khi ở nhánh đã thu đủ thì điện nước **được** trừ vào ký quỹ (BR-214).
  - (b) Hai gạch đầu cùng mở bằng "HĐ ký từ 01/11/2026,". Chữ phân biệt ("chưa thu đủ" / "đã thu đủ") nằm giữa câu, khó thấy.
  - (c) Thứ tự không theo cách lễ tân kiểm. Việc đầu tiên là xem HĐ giấy ký ngày nào, rồi mới kiểm kỳ thu. Vậy mà `lease_check` chỉ nhắc kiểm tiền thuê, không nhắc ngày ký, còn nhánh ngày ký lại nằm cuối.
- Vì sao quan trọng: đây là câu lễ tân đọc rồi nói lại với khách về một khoản ký quỹ khoảng 8–27 triệu. Đọc nhầm nhánh thì báo khách sai tiền, dễ thành khiếu nại (đúng rủi ro ESC-048 muốn tránh).
- Đề xuất sửa:
  1. Thứ tự mới theo cách kiểm: câu kiểm → **HĐ ký trước 01/11/2026** → **đã thu đủ** → **chưa thu đủ**, và lồng `lease_still_due` làm danh sách con của nhánh "chưa thu đủ":
     ```tsx
     <p>{t('early_departure.lease_check')}</p>
     <ul className="list-plain">
       <li>{t('early_departure.lease_rule_old')}</li>
       <li>{t('early_departure.lease_rule_paid')}</li>
       <li>
         {deposit ? t('early_departure.lease_rule', { amount: money(deposit) }) : t('early_departure.lease_rule_no_amount')}
         <ul className="list-plain li-s"><li>{t('early_departure.lease_still_due')}</li></ul>
       </li>
     </ul>
     ```
  2. `lease_check` nhắc cả ngày ký:
     - VI: "Desk chưa biết ngày ký HĐ và tiền thuê đã thu tới đâu. Xem HĐ giấy, kiểm kỳ thu cuối, hỏi quản lý rồi mới báo khách."
     - EN: "Desk can't tell yet when the lease was signed or how far the rent is paid. Check the paper lease and the last rent period, and ask the manager before telling the guest."
  3. Khi đã lồng, bỏ tiền tố "Khi mất ký quỹ:" khỏi `lease_still_due` (câu ở thẻ 27).
  4. Khuyến nghị, không bắt buộc để đóng thẻ: in đậm phần điều kiện. Tách mỗi nhánh thành khóa nhãn + khóa thân (`lease_if_old` "HĐ ký trước 01/11/2026", `lease_if_paid` "HĐ ký từ 01/11/2026, đã thu tiền thuê tới hết HĐ", `lease_if_unpaid` "HĐ ký từ 01/11/2026, chưa thu đủ tiền thuê tới hết HĐ"), rồi render `<strong>{nhãn}:</strong> {thân}`. Không cần màu mới, chỉ dùng độ đậm chữ của DS.
  - Test `r4-bug014-early-departure-lease.test.tsx`: thêm assert thứ tự (old → paid → unpaid) và `lease_still_due` nằm trong `li` của nhánh unpaid.
- Trạng thái: Open

### FB-R4-UXD-FE-27
- Mức độ: Minor
- Vị trí: `gen_strings.py` nhóm "R4 BUG-R4-014"; khóa `lease_rule_paid`, `lease_still_due`
- Vấn đề: Cả hộp khoảng 150 chữ VI, riêng `lease_rule_paid` khoảng 50 chữ với ngoặc lồng dấu chấm phẩy. Lễ tân đang đứng trước khách khó đọc. `lease_still_due` mang tiền tố "Khi mất ký quỹ:", tiền tố này thừa sau khi đã lồng (thẻ 26).
- Vì sao quan trọng: giọng Desk là ngắn và rõ. Câu dài cộng ngoặc lồng làm chậm đúng lúc lễ tân cần đọc nhanh.
- Đề xuất sửa (giữ nguyên nội dung nghiệp vụ, chỉ gọn lại):
  - `lease_rule_paid`
    - VI: "HĐ ký từ 01/11/2026, đã thu tiền thuê tới hết HĐ: không vi phạm. Quyết toán ký quỹ như trả phòng đúng hạn HĐ: trừ điện nước, dọn lẻ, hư hỏng còn nợ, hoàn phần còn lại trong 7 ngày làm việc. Không hoàn các ngày không ở."
    - EN: "Lease signed from 1 Nov 2026, rent paid up to the lease end: not a breach. Settle the security deposit as at the lease end: deduct unpaid utilities, extra cleaning and damage, and refund the rest within 7 working days. Days not stayed are not refunded."
  - `lease_still_due` (lồng dưới nhánh chưa thu đủ)
    - VI: "Vẫn thu điện nước, dọn lẻ, hư hỏng còn nợ, không trừ vào ký quỹ. Tiền thuê và phí dịch vụ đã thu cho tháng lịch chưa bắt đầu thì hoàn, tháng đang ở thì không (làm ngoài app)."
    - EN: "Unpaid utilities, extra cleaning and damage are still collected, not taken from the deposit. Rent and service fee paid for calendar months not yet started are refunded; the current month is not (outside the app)."
  - Nếu FE-A **không** lồng (thẻ 26 đóng theo cách khác) thì giữ tiền tố "Khi mất ký quỹ:" / "When the deposit is forfeited:".
- Trạng thái: Open

### FB-R4-UXD-FE-28
- Mức độ: Minor
- Vị trí: khóa `lease_rule_paid`, `lease_rule`, `lease_rule_no_amount`, `lease_check` (EN)
- Vấn đề:
  - (a) Danh mục khoản trừ không đồng nhất trong cùng một hộp. `lease_still_due` ghi "điện nước, dọn lẻ, hư hỏng", còn `lease_rule_paid` chỉ ghi "điện nước, hư hỏng". BR-214 có cả minibar/dọn lẻ.
  - (b) EN đổi "full security deposit" (bản `ff16c1dd`) thành "full deposit". Desk đang gọi trường này là "Security deposit held (outside app)" (`lsm.deposit`, `lsm.col_deposit`). Trong cùng hộp, "deposit" trơn dễ lẫn với tiền cọc đặt phòng ngắn ngày.
  - (c) EN `lease_check` viết "The Desk cannot tell". Các chuỗi sẵn có viết "Desk doesn't do this yet" (`effect_ota_reopen`) và VI là "Desk chưa…". "cannot" mất nghĩa "chưa" (v1.3 sẽ có lịch kỳ thu, theo sổ tay `02-le-tan.md:375`).
- Vì sao quan trọng: cùng một khoản phải cùng tên ở mọi chỗ trên Desk, trong sổ tay và trong mẫu tin, nếu không lễ tân và khách nước ngoài dễ hiểu sai.
- Đề xuất sửa:
  - (a) Dùng câu `lease_rule_paid` ở thẻ 27 (có "dọn lẻ" / "extra cleaning").
  - (b) `lease_rule` EN: "Lease signed from 1 Nov 2026, rent not paid up to the lease end: this breaks the lease. The guest forfeits the full security deposit of {amount} (held outside the app); no clawback of the lease-term discount." `lease_rule_no_amount` EN: như trên, bỏ " of {amount}". VI giữ nguyên.
  - (c) Dùng câu `lease_check` EN ở thẻ 26 ("Desk can't tell yet…").
- Trạng thái: Open

### FB-R4-UXD-FE-29
- Mức độ: Minor
- Vị trí: `EarlyDepartureDialog.tsx:413` (bước ③ Kết quả, `{leaseDone ? <LeaseRule … /> : null}`)
- Vấn đề: Bước ③ hiện lại nguyên `LeaseRule`, kể cả câu "…hỏi quản lý trước khi báo khách". Lúc này lễ tân đã tick "Đã báo khách…" và đã xác nhận, nên câu dặn ở dạng việc cần làm không còn đúng thời điểm.
- Vì sao quan trọng: màn kết quả chỉ nên xác nhận việc đã xong và việc còn lại. Một lệnh "trước khi báo khách" ở đây khiến lễ tân ngờ rằng mình bỏ sót bước.
- Đề xuất sửa: thêm prop `step: 'preview' | 'result'` cho `LeaseRule`. Ở `result`, thay `lease_check` bằng khóa mới `early_departure.lease_done_note` và giữ 3 nhánh làm tham chiếu:
  - VI: "Ký quỹ và tiền thuê xử lý ngoài app, theo nhánh đã báo khách."
  - EN: "The security deposit and rent are handled outside the app, as told to the guest."
- Trạng thái: Open

### FB-R4-UXD-FE-30
- Mức độ: Suggestion
- Vị trí: khóa `early_departure.told_guest_lease`
- Vấn đề: Nhãn ô tích dài khoảng 17 chữ, cụm "cách xử lý ký quỹ theo HĐ" hơi hành chính. Ô tích sẵn có (`told_guest`) chỉ khoảng 10 chữ.
- Vì sao quan trọng: nhãn ô tích ngắn thì dễ quét, nhất là ở khổ 390 px khi hộp đã dài.
- Đề xuất sửa:
  - VI: "Đã báo khách về ký quỹ và các khoản còn thu, còn hoàn"
  - EN: "I've told the guest about the security deposit and what is still due or refunded"
  - Cập nhật chuỗi trong `confirm_needs_told` nếu sau này chuỗi đó trích nhãn ô tích HĐ.
- Trạng thái: Open

### FB-R4-UXD-FE-31
- Mức độ: Suggestion
- Vị trí: `gen_strings.py`, 4 khóa có mốc "01/11/2026" / "1 Nov 2026" (`lease_rule`, `lease_rule_no_amount`, `lease_rule_paid`, `lease_rule_old`)
- Vấn đề: Mốc ngày viết cứng trong 8 chuỗi (VI + EN). Theo báo cáo FE-A, mốc này còn là giả định của DOM, chờ ORC ghi decision-log.
- Vì sao quan trọng: nếu mốc đổi, phải sửa 8 chuỗi và sinh lại 4 file, dễ sót một ngôn ngữ.
- Đề xuất sửa: thay mốc bằng tham số `{cutoff}`, truyền từ một hằng duy nhất (ví dụ `LEASE_POLICY_CUTOFF = '2026-11-01'`) và định dạng bằng `date()` của i18n (VI "01/11/2026", EN "1 Nov 2026"). Ghi chú trong `gen_strings.py` dẫn BR-201 và dòng decision-log.
- Trạng thái: Open

---

## 3. Ghi chú cho ORC / DOM / BA (không phải thẻ cho FE-A)

- **DOM:** BR-107 v0.5.1 ghi "INV chưa vận hành và không có dữ liệu cũ (01/11)". Nếu OTTIMO thật sự không có HĐ giấy nào ký trước 01/11/2026, nhánh `lease_rule_old` chỉ thêm chữ cho lễ tân. Đề nghị DOM xác nhận khi ghi mốc vào decision-log. Nếu không có HĐ cũ, bỏ nhánh này (hộp còn câu kiểm + 2 nhánh) và bỏ phần "ngày ký" trong `lease_check`.
- **BA (sổ tay `02-le-tan.md` 11.5/17.5):** dùng đúng chuỗi sau khi FE-A sửa thẻ 26–28, theo cùng thứ tự: ngày ký → đã thu đủ → chưa thu đủ. Sổ tay dòng 376 dặn "Không ghi ký quỹ vào Desk", vậy ca phổ biến sẽ là `lease_rule_no_amount`. Hai nơi không mâu thuẫn, chỉ cần sổ tay nói rõ hộp có thể không hiện số ký quỹ.
- Không phát sinh ESC từ phía UXD.

## 4. Điểm làm tốt (nên giữ)

- Hộp không còn khẳng định một kết quả cho mọi HĐ. Câu kiểm và các nhánh đúng chỉ đạo ORC cùng ESC-048 B, và đúng nguyên tắc "không để Desk tự đoán".
- `breaksLease` dùng ngày rời đang chọn: rời từ ngày kết thúc HĐ trở đi thì quay về đường BR-428 thường. Lễ tân không phải đọc khối không liên quan.
- Ô tích `told_guest_lease` trung tính và sửa ở nguồn `gen_strings.py`, sinh lại có tính idempotent. Đúng quy trình chuỗi của DS.
