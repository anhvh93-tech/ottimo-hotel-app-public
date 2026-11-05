# UXD review – v1.0.4 PR #89: các thẻ nhỏ của sổ tay sau #85

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng:
  - `git diff origin/main...origin/v104/ba-manual-minors` @ `89743a8f` (gốc `9f5d8205`; `main` hiện `7d4231df`);
  - 5 tệp, +34/−19: `user-manual-v1.0.md`, `guides/00-index.md`, `01`, `02`, `05`.
- Thẻ UXD cần kiểm: FB-R4-UXD-BA-PR85-05, -06, -07 (`UXD-on-v104-pr85-prices.md`).
- Phần còn lại của PR (SEC-PR85-01, DOM-PR85-04/05, QA BR-428-02) chỉ soát về nhãn và cách trình bày.
- Cách soát:
  - Máy trích 80 cụm **đậm** và câu trong ngoặc kép ở các dòng `+`, so với `strings-vi.json` trên `main` @ `7d4231df`. Các cụm không khớp được đọc tay.
  - Đọc `QuoteDialog.tsx` để biết nhãn hoa hồng hiện cho từng vai.
  - Dựng HTML bằng `rebuild_manual_html.py` trong worktree tách ở scratchpad: KẾT QUẢ ĐẠT. Mọi tệp không tràn ngang ở 390 và 1440 px, font nhúng đủ 5 mặt, HTML không còn `<!--`.
  - Đo tiêu đề 20.2 và 5.2. Chụp ở 390 và 1440 px: 20.2 (tiêu đề, dòng phạm vi, hai dòng bảng) và gạch **Kiểm trùng** `02` 11.1. Không commit HTML.

## Kết luận: ĐẠT

Ba thẻ UXD đóng đúng. Nhãn mới trích khớp nguyên văn. Có một thẻ Minor mới (PR89-01), không chặn gộp. Không có ESC.

| Thẻ | Kết quả kiểm |
|---|---|
| UXD-PR85-05 Minor | Đóng. Bốn chỗ trích đủ "Đã giảm …% vì ở từ 7 đêm (BR-107)", khớp `sale.los_applied`: `01` 9.1, sổ tay 1.3, `02` 5.1 bước 8, sổ tay 2.5 bước 8. Bước 8 nay ghi "Cột **Giá lịch/đêm (trước giảm theo số đêm)** vẫn ghi "trước giảm theo số đêm": chữ cũ.", khớp `rate.pre_tier` và đúng chỗ trên hộp đặt phòng. |
| UXD-PR85-06 Minor | Đóng. Tiêu đề còn "20.2 Bảng tiền hay dùng" và "5.2 Bảng tiền và quy tắc". Ở 390 px tiêu đề còn **1 dòng** (trước là 6). Phạm vi chuyển xuống một dòng thường ngay dưới tiêu đề. Danh sách mục bên cạnh cũng chỉ còn "Bảng tiền hay dùng". Link vẫn đặt theo số (`#s-20-2`), không gãy. |
| UXD-PR85-07 Suggestion | Đóng, BA làm luôn.<br>– 20.2 và 5.2: dòng **Cuối tuần, ngày đặc biệt** còn quy tắc và danh sách ngày; dòng mới **Kiểm sau khi chuyển giá** chứa câu kiểm 1.600.000 và câu nhãn v1.0.3. Ở 390 px mỗi ô khoảng 8–9 dòng (trước một ô 17 dòng).<br>– Gạch **Kiểm trùng** ở `02` 11.1 và sổ tay 2.14 chia đúng 4 gạch con: tìm dòng → đường bấm kết thúc bằng **Ghi điều chỉnh** → **Chỉ** / **Không** → ghi sổ giao ca. Chữ giữ nguyên, chỉ đổi "Có" thành "Tìm dòng" và thêm "Có dòng đó:", đọc tự nhiên hơn. |

Nhãn mới ở các phần khác của PR đều khớp:
- `early_departure.no_refund`: "Không có khoản hoàn.";
- `bill.line.early_departure_fee_notice` với `{noticeDays}` = 0: "Phí trả phòng sớm (báo trước 0 ngày)";
- `checkout.time_note`: **Ghi chú giờ trả (vì sao ghi bù)**;
- `checkout.departure_time`: **Giờ trả phòng thực tế**.

Các cụm máy không khớp đều là tên gạch, chữ nhấn mạnh hoặc câu nhân viên tự ghi: **Kiểm sau khi chuyển giá** (tên dòng bảng của sách), "Trùng minibar tủ căn cũ", "OTM-… khách rời hh:mm …". **Đồ ăn uống** là tên khoản do máy chủ trả, như ở review #85.

### FB-R4-UXD-BA-PR89-01
- Mức độ: Minor (không chặn gộp)
- Vị trí: `05` mục 3 bước 3; sổ tay 4.2: "**Bạn nhận (…% tiền phòng)**".
- Vấn đề:
  - SEC-PR85-01 đã bỏ tỷ lệ cứng. Đúng hướng: tỷ lệ là tham số.
  - Nhưng nhãn trích vẫn thiếu đuôi. Desk ghi "Bạn nhận ({pct}% tiền phòng – BR-903)" (`sale.commission_ctv`) cho CTV.
  - Với sale, Desk ghi "**Sale nhận** ({pct}% tiền phòng – BR-903)" (`sale.commission`), theo `QuoteDialog.tsx`: `ctv ? 'sale.commission_ctv' : 'sale.commission'`.
  - Tệp `05` viết cho cả CTV lẫn sale. Sale đọc "Bạn nhận" sẽ không thấy dòng đó trên màn của mình.
  - Câu này có từ trước #89, nhưng PR đã sửa đúng dòng này.
- Đề xuất sửa: "… và **Bạn nhận (…% tiền phòng – BR-903)** (CTV) hoặc **Sale nhận (…% tiền phòng – BR-903)** (sale): Desk tự điền theo tỷ lệ chủ đầu tư cài." Sổ tay 4.2 sửa cùng chữ.
- Khi nào: sửa trong #89 nếu kịp giờ cắt 06/11 18:00; không thì sửa cùng lần gộp #69.
- Trạng thái: Open

## Dòng decision-log đề xuất

```
| 2026-11-05 | 4 | **UXD review PR #89** `v104/ba-manual-minors` @ `89743a8f`: ĐẠT. FB-R4-UXD-BA-PR85-05 (trích đủ "Đã giảm …% vì ở từ 7 đêm (BR-107)"; cột **Giá lịch/đêm (trước giảm theo số đêm)**), -06 (tiêu đề 20.2 / 5.2 còn 1 dòng ở 390 px, phạm vi xuống dòng dưới), -07 (dòng **Kiểm sau khi chuyển giá** tách riêng; gạch **Kiểm trùng** 4 gạch con) đóng đúng. Soát máy 80 nhãn với `strings-vi.json` `main` @ `7d4231df` (thêm `early_departure.no_refund`, `bill.line.early_departure_fee_notice`, `checkout.time_note` khớp); HTML dựng ĐẠT 390/1440, font đủ 5 mặt. Thẻ mới FB-R4-UXD-BA-PR89-01 Minor, không chặn: `05` 3 / sổ tay 4.2 trích đủ "Bạn nhận (…% tiền phòng – BR-903)" và thêm "Sale nhận (…)" cho sale. | UXD | Sổ tay khớp Desk; bảng tiền và gạch kiểm trùng đọc được trên điện thoại. |
```
