# UXD review – v1.0.4 PR #85: giá theo ESC-045 và bảng giá 01/11 trong sổ tay

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Lượt 1 (@ `f11e928c`): ghi ở `UXD-on-v104-pr72-manual.md`, mục "#85 `v104/ba-esc045-prices` @ `f11e928c`". Có thẻ FB-R4-UXD-BA-PR85-01…04.

---

# Lượt 2 – 05/11/2026

- Đối tượng:
  - `origin/v104/ba-esc045-prices` @ `f9302d82`, đã gộp `main` (#72) bằng merge;
  - bảng thẻ trong mô tả PR.
  - Phần của #85 so với `main` nằm ở `git diff origin/main...f9302d82 -- product/docs/manual/` (gốc `20358556`): 7 tệp, +72/−60.
  - Phần sửa của lượt này nằm ở `git diff f11e928c..f9302d82 -- product/docs/manual/`.
  - Từ `20358556` tới `main` hiện tại (`fc4eff70`, #86 và #66) không đổi tệp sổ tay hay tệp chữ nào.
- Đối chiếu: `strings-vi.json` trên `main` @ `fc4eff70`; mã Desk trên `main` (`BookingDialog.tsx`, `folio-lines.service.ts`); bảng giá trong `business-rules.md` trên `main` (BR-101, phòng `studio_*` và `signature`).
- Cách soát:
  - Máy trích 125 cụm **đậm** và câu trong ngoặc kép ở mọi dòng `+` của #85, rồi so với giá trị `strings-vi.json`. Cụm có `…` thì coi như chỗ biến; `{…}` của Desk thì khớp với mọi chữ.
  - Đọc tay từng cụm không khớp nguyên văn.
  - Dựng HTML bằng `rebuild_manual_html.py` trong worktree tách ở scratchpad: KẾT QUẢ ĐẠT. 390 và 1440 px không tràn ngang, font nhúng đủ 5 mặt, HTML không còn `<!--`.
  - Chụp ở 390 và 1440 px: `02` 11.1 bước 1 và gạch **Kiểm trùng**, `02` 7.1, `02` 20.2, `01` 9.1. Đo chiều cao tiêu đề 20.2 và 5.2. Không commit HTML.

## Kết luận lượt 2: ĐẠT

- Ba thẻ UXD-PR85-01…03 đã đóng đúng. Thẻ 04 để sang v1.0.5, UXD đồng ý.
- Thẻ UXD-PR72-10 đã đóng.
- Mọi nhãn Desk trích trong sách khớp từng chữ, trừ một câu trích thiếu phần đuôi (thẻ 05).
- C2-18 đã đổi đúng.
- Có hai thẻ Minor mới (05, 06) và một Suggestion (07). Cả ba **không chặn gộp**. 05 và 06 chỉ sửa chữ trong sổ tay; BA sửa trong #85 nếu kịp giờ cắt 06/11 18:00, không kịp thì sửa cùng lần gộp #69. Không có ESC.

| Thẻ | Kết quả kiểm |
|---|---|
| UXD-PR85-01 Major | Đóng. Câu kiểm "ngày đến thứ Sáu, 2 đêm, 2 người lớn: phải ra **1.600.000**" có ở cả 5 chỗ: `01` 9.1, sổ tay 1.3, `02` 20.2, sổ tay 5.2, `05` 3. Không còn câu "Studio 1 đêm".<br>Số đúng: Studio 800.000 (BR-101 `studio_city`, `studio_garden`), định mức 2. Còn +15 % thì 2 × 920.000 = 1.840.000, đúng như `01` ghi. Câu dài cho chủ đầu tư và câu ngắn cho lễ tân, sale chia đúng người đọc. |
| UXD-PR85-02 Minor | Đóng. Dòng **Cuối tuần, ngày đặc biệt** của 20.2 và 5.2 có câu nhãn v1.0.3. Câu trích "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)" khớp nguyên văn `bk.src_weekend`. |
| UXD-PR85-03 Minor | Đóng. `01` 9.1 và sổ tay 1.3: **Tham số quy tắc** → tab **Số người & phụ thu** → **Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)** = 150.000, có câu kiểm. Ba nhãn khớp nguyên văn `config.params`, `params.grp_occupancy`, `params.extra_child`. |
| UXD-PR85-04 Suggestion | Deferred v1.0.5, UXD đồng ý. Tên khóa thô `weekend_uplift_pct`, `special_uplift_pct`, `los_discount` viết dạng mã. Đúng với Desk hiện nay: tab **Khác** hiện tên khóa thô. |
| UXD-PR72-10 Minor | Đóng. `02` 11.1 bước 1 và sổ tay 2.14 bước 1: "Khách đã đổi căn giữa kỳ: **trước khi bấm**, mở **Folio** kiểm trùng minibar căn cũ (gạch **Kiểm trùng** dưới **Bước 1 – Minibar**)". Trong gạch **Kiểm trùng** đã có "→ **Ghi điều chỉnh**" (`folio.adjust_submit`). Ở 390 px, câu bước 1 nằm ngay dưới nút, đọc trước khi bấm. |
| `screenshot-list` C2-18 | Đóng. Ảnh dùng giờ 10:30 → phụ thu 30 %. Giờ này đúng 30 % ở cả bảng cũ (10:00–11:59) lẫn bảng mới (10:00–10:59), nên chụp trước hay sau ngày chuyển giá đều đúng. |

Các cụm máy không khớp nguyên văn, đọc tay đều hợp lệ:
- Tiêu đề hoặc tên gạch của chính sách: **Đổi giá một căn**, **Kiểm trùng**, **Miễn phí, giảm giá**, **Đơn quá ngày đi**, **Giờ nhận phòng**.
- Chữ nhấn mạnh: **Không phụ thu**, **Chỉ**, **thuê dài hạn**.
- Câu nhân viên tự ghi: "Trùng minibar tủ căn cũ", "Giá thỏa thuận lúc đặt", "OTM-… Trả phòng trên Desk lúc 06:xx, khách rời thật hh:mm".
- Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00.".
- **Đồ ăn uống**: tên khoản do máy chủ trả (`folio-lines.service.ts`), không nằm trong tệp chữ, nên vẫn khớp.
- Câu "Từ 28 đêm …" và "… đêm là thuê dài hạn" khớp `bk.long_body` / `field.LONG_STAY_REQUIRES_CONTRACT` và `bk.long_title`.
- Các nút mới của CO-05 khớp: **Giờ trả phòng thực tế**, **Tiền khách đưa**, **Mã chuẩn chi trên phiếu POS**.

### FB-R4-UXD-BA-PR85-05
- Mức độ: Minor (không chặn gộp)
- Vị trí:
  - `01` 9.1 và sổ tay 1.3: "không có dòng "Đã giảm …% vì ở từ 7 đêm"";
  - `02` 5.1 bước 8 và sổ tay 2.5 bước 8: "Ô giá còn ghi "trước giảm theo số đêm" là chữ cũ. Đơn từ 7 đêm mà Desk hiện dòng "Đã giảm …% vì ở từ 7 đêm"".
- Vấn đề:
  - Desk ghi đủ "Đã giảm {pct}% vì ở từ 7 đêm (BR-107)" (`sale.los_applied`, cả ở hộp báo giá và hộp đặt phòng). Sách trích thiếu "(BR-107)", nên không còn khớp nguyên văn.
  - Ở hộp đặt phòng, chữ "trước giảm theo số đêm" không nằm ở ô giá. Nó nằm ở **tiêu đề cột** "Giá lịch/đêm (trước giảm theo số đêm)" (`rate.pre_tier`). Lễ tân tìm trong ô sẽ không thấy.
  - Ở gạch **Tiền về**, chữ "trên ô" thì đúng, vì đó là nhãn ô **Giá đêm mới (trước giảm theo số đêm)** của hộp **Điều chỉnh**.
- Đề xuất sửa:
  - Bốn chỗ trích: "Đã giảm …% vì ở từ 7 đêm (BR-107)".
  - Bước 8 (`02` 5.1, sổ tay 2.5): "Cột **Giá lịch/đêm (trước giảm theo số đêm)** vẫn ghi "trước giảm theo số đêm": chữ cũ."
- Trạng thái: Open

### FB-R4-UXD-BA-PR85-06
- Mức độ: Minor (không chặn gộp)
- Vị trí: tiêu đề `02` 20.2 và sổ tay 5.2.
- Vấn đề:
  - Tiêu đề dài 164 ký tự: "20.2 Bảng tiền hay dùng (tham số 27/10/2026; giá, giảm theo số đêm, dài hạn, nhận sớm và phụ thu người theo bảng giá 01/11 và ESC-045, từ ngày chủ đầu tư chuyển giá)".
  - Ở 390 px tiêu đề lên **6 dòng** (Be Vietnam Pro 19,2 px), ở 1440 px lên 3 dòng.
  - Đây là bảng lễ tân mở nhiều nhất. Trên điện thoại, cả màn đầu chỉ có tiêu đề.
  - Ba chỗ khác của HTML cũng lặp nguyên câu dài này: danh sách mục bên cạnh, mục lục thu gọn và `data-label` của khối (dùng cho ô **Tìm**).
- Đề xuất sửa:
  - Tiêu đề trở về "20.2 Bảng tiền hay dùng" (sổ tay: "5.2 Bảng tiền và quy tắc").
  - Phạm vi chuyển thành một dòng ngay dưới tiêu đề: "Tham số ngày 27/10/2026. Giá, giảm theo số đêm, dài hạn, nhận sớm và phụ thu người theo bảng giá 01/11 và ESC-045, áp dụng từ ngày chủ đầu tư chuyển giá."
  - Link mục đặt theo số (`#s-20-2`), nên đổi chữ tiêu đề không làm gãy link. Vẫn dựng lại HTML để soát.
- Trạng thái: Open

### FB-R4-UXD-BA-PR85-07
- Mức độ: Suggestion (cùng lần gộp #69 hoặc v1.0.5)
- Vị trí:
  - ô **Cuối tuần, ngày đặc biệt** của 20.2 và 5.2: 17 dòng ở 390 px;
  - gạch **Kiểm trùng, trước khi bấm Trả phòng** ở `02` 11.1 và sổ tay 2.14: 9 câu, khoảng 21 dòng ở 390 px.
- Vấn đề: mỗi chỗ gộp 3–4 việc khác nhau vào một khối, nên ở quầy khó tìm đúng câu cần.
  - Ô bảng gồm: quy tắc, câu kiểm, nhãn v1.0.3, danh sách ngày đặc biệt.
  - Gạch **Kiểm trùng** gồm: khi nào bỏ dòng, đường bấm, giới hạn, ghi sổ.
- Đề xuất:
  - Tách ô bảng thành hai dòng:
    - **Cuối tuần, ngày đặc biệt**: quy tắc và danh sách ngày;
    - **Kiểm sau khi chuyển giá**: câu kiểm và câu nhãn v1.0.3.
  - Gạch **Kiểm trùng** chia 4 gạch con:
    1. khi nào có dòng trùng;
    2. đường bấm, kết thúc bằng **Ghi điều chỉnh**;
    3. **Chỉ** … / **Không** dùng …;
    4. ghi sổ giao ca, quản lý xem lại.
  - Không đổi chữ.
- Trạng thái: Open

### Ngoài phạm vi UXD (ghi nhận, không phải thẻ)
- Gạch **Khách đi trước 06:00** (CO-05) ghi "lỗi đã biết, đang sửa". #86 (BUG-R4-050) đã gộp vào `main`. DOM, ARC cần xác nhận câu này vẫn đúng với v1.0.4 sau #86; PR ghi "chờ QA xác nhận trên stack".
- Ảnh C2-03, C2-04 (báo giá có đêm thứ Sáu) chụp sau ngày chuyển giá sẽ có hai dòng cùng giá ("… đêm thường × 800.000" và "… đêm thứ Sáu, thứ Bảy × 800.000"). Đúng với Desk tới v1.0.5 (`sale.nights_all`, lượt 2 của `UXD-on-v104-pr72-manual.md`), không cần chụp lại.

## Dòng decision-log đề xuất

```
| 2026-11-05 | 4 | **UXD lượt 2 PR #85** `v104/ba-esc045-prices` @ `f9302d82` (đã gộp #72): ĐẠT. FB-R4-UXD-BA-PR85-01…03 và FB-R4-UXD-BA-PR72-10 đóng đúng (câu kiểm 2 đêm đến thứ Sáu = 1.600.000 ở đủ 5 chỗ; nhãn v1.0.3 "+15%" khớp `bk.src_weekend`; tham số **Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)** = 150.000; kiểm trùng minibar căn cũ ở bước 1, có **Ghi điều chỉnh**); -04 Deferred v1.0.5; C2-18 10:30 đúng cả bảng cũ lẫn mới. Soát máy 125 nhãn với `strings-vi.json` `main` @ `fc4eff70`; HTML dựng ĐẠT 390/1440, font đủ 5 mặt. Thẻ mới không chặn gộp: -05 Minor (trích đủ "Đã giảm …% vì ở từ 7 đêm (BR-107)"; "trước giảm theo số đêm" ở tiêu đề cột, không ở ô), -06 Minor (tiêu đề 20.2 / 5.2 dài 164 ký tự, 6 dòng ở 390 px – đưa phạm vi xuống dòng dưới), -07 Suggestion (tách ô **Cuối tuần, ngày đặc biệt** và gạch **Kiểm trùng**). | UXD | Giá đúng và nhãn khớp Desk; việc còn lại là cách trích và độ dài khối chữ trên điện thoại. |
```
