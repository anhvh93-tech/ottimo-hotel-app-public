# FE – trả lời thẻ review Round 5

## FE-4 – PR #142 (V5-11 Desk: Trả sớm trong 00:00–05:59)

- Round 5, bước Phản hồi & sửa · FE-4 · 07/11/2026.
- Review đã nhận, cả ba trên `52a14957`:
  - UXD `rounds/round-05/reviews/UXD-on-fe-pr-142.md`
  - DOM `rounds/round-05/reviews/DOM-on-fe-pr-142.md`
  - ARC `rounds/round-05/reviews/ARC-on-fe-pr-142.md`
- Bản sửa trên nhánh `r5-fe-v5-11`:
  - `3927e137` (UXD-01, DOM-01);
  - `7baac854` (ARC-03, ARC-01);
  - merge `main` → head **`710209ec`**. Không rebase.
- Có hai lần push, vì thẻ ARC đến sau lần push đầu (`877c9dde`).

### FB-R5-UXD-FE-142-01 (Major, điều kiện gộp) – Done
Tình huống: hộp mở trước 00:00 rồi dùng tiếp sau 00:00. Kiểm theo 4 tiêu chí DOM mục 3.3, kèm ca R1 và R2.

**Câu 9.13 hiện cả khi máy chủ chưa trả 409.**
- Mức sàn giờ đêm = `serverMin ?? (night ? estimate : null)`.
- Khi ngày chọn thấp hơn mức sàn này, và mức sàn đang quyết định ngày tối thiểu (không phải ngày đến + 1):
  - dưới ô hiện `err.min_date` với ngày tối thiểu;
  - kèm nút `use_min_date` cùng ngày đó.
- Ngoài W, hoặc khi ngày chọn quá ngày cuối: vẫn hiện `err.date_range` như cũ.
- Không thêm khóa chữ.

**Bước ② không còn chờ một lần tính thử không chạy.**
- Đang ở bước ② mà một ô thành lỗi ở client (qua 00:00) thì:
  - về bước ①;
  - bỏ tick "Đã báo khách" và chip "Vừa đổi";
  - focus ô ngày.
- Đây là cùng đường với 409 ở lần ghi.

**Hộp tự đọc lại đồng hồ.**
- Đồng hồ hẹn giờ vẽ lại hộp lúc 00:00, cùng cách `useBusinessDay` làm ở mốc 06:00 (R3-Q36). Hộp để yên qua nửa đêm sẽ đổi sang câu 9.13 ngay lúc 00:00, không đợi cú bấm.
- Mỗi lần focus vào một ô, Desk kiểm lại đồng hồ (phòng khi đồng hồ hẹn giờ trễ sau khi máy ngủ).

**Test mới**
- R1 kèm DOM 3.3 (1)(3):
  - mở lúc 23:55 ngày D−1, bấm "Xem trước" lúc 00:05 → câu 9.13 và "Dùng D";
  - đơn 5 đêm × 700.000, trả đủ → hoàn 1.050.000, phí 1.050.000;
  - dòng phụ ghi ngày D−1; dòng phí trên folio mang ngày D−1; lần ghi gửi đúng các số đó.
- R2 / DOM 3.3 (2): tick "Đã báo khách" lúc 00:02 → về bước ①, focus vào ô ngày, không có "Đang tính thử…". Sau đó "Dùng D" và ghi xong.
- Bước ① để yên qua 00:00 (không bấm gì) → câu 9.13.
- Ca repro (2) của UXD, giữ gần nguyên văn: focus một ô sau 00:00 → câu 9.13.
- T-11-6: gõ ngày hôm qua lúc 02:00 nay ra câu 9.13. Gõ quá ngày cuối vẫn ra câu khoảng ngày.
- Tệp repro của UXD chạy nguyên văn trên bản sửa: 2/2 đạt.

### FB-R5-UXD-FE-142-02 (Suggestion) – Deferred v1.0.6
Chờ UXD viết khóa `early_departure.to_preview_fix`; FE nối khi khóa có trên `main`. Bản sửa thẻ 01 làm ca này hiếm hơn: lỗi ngày do qua 00:00 nay hiện câu 9.13 kèm nút "Dùng {date}" ngay dưới ô.

### FB-R5-ARC-FE-142-03 (Minor) và FB-R5-DOM-FE-142-01 (Minor) – Done
Làm theo quy tắc ARC mục 3.

**`minCalendarDay`** = max(ngày nghiệp vụ, ngày lịch).
- Đây đúng công thức `minCalendarDate` của máy chủ, không cần mốc đổi ngày.
- Khi ngày nghiệp vụ trên Desk chậm một ngày, mức sàn vẫn là ngày lịch.

**Cờ W** là hàm riêng `inEarlyHours`. W chỉ khi **cả hai** đúng (UXD 9.13, DOM-01):
- giờ máy quầy trước mốc đổi ngày;
- ngày nghiệp vụ nhỏ hơn ngày lịch.

**Ví dụ:** máy chủ đã 06:01 (ngày nghiệp vụ D), máy quầy chậm 2 phút ở 05:59.
- Mức sàn là D, không phải D+1.
- Không có dòng phụ giờ đêm.
- Ngày D đi qua tới lần ghi.

**Test**
- Ca đơn vị nay dùng đầu vào nhất quán. Ca mốc 04:00 cũ không thể xảy ra, đã thay.
- Có ca ngày nghiệp vụ chậm một ngày.
- Ca cả hộp: Me trả `businessDate` = D khi máy quầy ở 05:59.

### FB-R5-ARC-FE-142-01 (Minor) – Done
- **Ca mới:** đồng hồ Desk giữ ở 23:58 (Desk ngoài W). `failNext` trả 409 `useCheckout` cho lần ghi. Kỳ vọng:
  - đúng 1 lần ghi;
  - alert `use_checkout` nhận focus;
  - không có lỗi chặn;
  - không còn nút Xác nhận;
  - đơn đọc lại đúng 1 lần;
  - đơn đi D+2 nên chỉ có nút Đóng.
- **Ca cũ:** kỳ vọng đổi thành `toHaveLength(1)`.
- **Đột biến M10b** (409 `useCheckout` ở lần ghi thành lỗi chặn) nay làm ca mới đỏ.

### Kiểm sau sửa
- Đột biến chạy tay, mỗi lần một chỗ, rồi trả lại. Mỗi đột biến làm ít nhất một ca đỏ:
  - M10b của ARC;
  - công thức mức sàn cũ;
  - W chỉ theo giờ máy quầy;
  - bỏ mức sàn của Desk;
  - bỏ đường về bước ①;
  - bỏ đồng hồ hẹn 00:00;
  - bỏ kiểm lại khi focus.
- Admin-web: 89 tệp, 1011/1011 đạt. tsc, eslint, prettier sạch.

### FB-R5-DOM-FE-142-02 và FB-R5-ARC-FE-142-02 (Minor) – Deferred, PR riêng sau #142
- Lỗi gốc nằm ở `useBusinessDay`: mỗi component tự chụp ước tính lúc nó được mở. Lỗi có từ R3, không do PR này.
- Theo chỉ đạo của ORC, FE làm một PR nhỏ riêng sau khi #142 gộp, theo đề xuất của ARC:
  - chụp mốc một lần lúc câu trả lời Me về, trong `SessionProvider`;
  - đọc lại Me khoảng 2 phút sau mốc 06:00;
  - thêm 2 ca test: hộp mở sau 06:00 với Me đọc trước 06:00, và ca P1 của ARC.
- Không đổi hợp đồng. QA ghi bug P2.
- Trong lúc chờ: tiền và ngày ghi phí do máy chủ quyết. Chỉ chữ ngày trong dòng phụ có thể lệch một ngày. Mức sàn mới đã đỡ được trường hợp ngày nghiệp vụ chậm.

### FB-R5-DOM-FE-142-03 (Minor, chữ UXD) – Deferred, chờ UXD
- Đổi "đêm qua" thành "đêm {ngày}".
- Khi UXD chốt khóa có thêm tham số `{night}`, FE truyền ngày nghiệp vụ vào. Nên làm sau thẻ 02 để ngày đó đúng.

### FB-R5-DOM-FE-142-04 (Suggestion) – Không phải việc FE
Thuộc BA (sổ tay ca đêm) và UXD (`new_date_help`). FE không đổi gì.
