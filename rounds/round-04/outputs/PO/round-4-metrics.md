# Round 4 – Số liệu tổng kết

- Người soạn: PO | Round 4, bước Tổng kết | 06/11/2026 (số liệu tới khoảng 20:00, sau commit `6664de95`).
- Dùng cho: ORC (`round-summary`) và buổi review định kỳ đầu tiên 20/11/2026.
- Kế hoạch tiếp theo: `rounds/round-05/plan.md`. Việc chờ INV: `rounds/round-04/outputs/PO/esc-pending-06-11.md`.
- Không có số hoa hồng, dữ liệu cá nhân khách hay bí mật trong tệp này.

## 1. Bản đã phát hành trong Round 4

| Bản | Nội dung chính (ngôn ngữ người dùng) | Lên production | QC |
|---|---|---|---|
| v1.0.1 | Tin Google Chat khi có yêu cầu đặt phòng từ website (mức A: mã yêu cầu và link Desk) | 03/11/2026 | ĐẠT CÓ ĐIỀU KIỆN (`qc/v1.0.1-gate.md`) |
| v1.0.2 | Trả phòng sớm có tính phí; giá hẹn theo ngày cho từng căn | 03/11/2026 | ĐẠT CÓ ĐIỀU KIỆN (`qc/v1.0.2-gate.md`) |
| v1.0.3 | Email nhận thông báo bảo mật cho chủ đầu tư và quản lý | 04/11/2026 07:12 | ĐẠT CÓ ĐIỀU KIỆN (`qc/v1.0.3-gate.md`) |
| v1.0.4 | Giữ chỗ quá hạn; đăng nhập 2 bước trên app nhân viên; sửa các lỗi tiền ở quầy (minibar, đơn Nội bộ, đơn OTA, trả phòng sau nửa đêm). Mở lại check-in online | 06/11/2026 14:10 (tag `v1.0.4` → `6414be25`, image `sha-6414be25f20d`) | ĐẠT CÓ ĐIỀU KIỆN (`qc/QC-v1.0.4-release.md`) |
| LP-v2 | Web khách 5 ngôn ngữ (EN, VI, KO, ZH, RU) có form gửi yêu cầu và giá ước tính lấy từ Desk | 06/11/2026 (tag `landing-v2.0.0`). Giá web bật cùng ngày (F2): web bằng Desk ở 4 ca mẫu | Gộp `main`: ĐẠT CÓ ĐIỀU KIỆN (`qc/lp-v2-gate.md`). Phát hành theo các cổng P1–P10 của runbook LP-v2 |

Tổng: **5 bản lên production trong 4 ngày** (03–06/11). Cả 5 bản qua cổng QC rút gọn có điều kiện. Điều kiện trước production đã xong trước khi INV đồng ý từng lần.

## 2. Thẻ feedback (review chéo Round 4)

Nguồn: 166 tệp trong `rounds/round-04/reviews/` (153 tệp có thẻ) và 32 tệp trong `rounds/round-04/responses/`.

| Mức | Tạo | Đã xử lý | Dời có đích | Không cần xử lý |
|---|---|---|---|---|
| Blocker | 1 | 1 | 0 | 0 |
| Major | 121 | 120 (99 Done, 21 đóng qua điều kiện cổng hay kiểm trên staging) | 1 (FB-R4-SEC-BE-A31-01 → v1.0.5, V5-16) | 0 |
| Minor | 356 | 310 | 46 (19 → v1.0.5, 27 → backlog cải tiến) | 0 |
| Suggestion | 253 | 132 | 34 | 87 (protocol không bắt buộc) |
| Chưa rõ mức | 17 | – | – | 17 |
| **Tổng** | **748** | **563** | **81** | **104** |

- Blocker và Major trong bảng trên: **không còn thẻ mở** chặn phát hành. Thẻ Major duy nhất còn lại đã dời có đích, có cách làm tạm trong sổ tay.
- Sau bảng trên, SEC review tối 06/11 (commit `0fc55457`) mở thêm 11 thẻ: 3 Major, 7 Minor, 1 Suggestion. Không thẻ nào chặn bản đang chạy.
  - FB-R4-SEC-OPS-OR-01 và OR-02 (Major) là việc sao lưu ngoài máy. Cả hai đã xếp vào v1.0.5 V5-60; OR-01 làm ngay.
  - FB-R4-SEC-OPS-054-02 (Major) chỉ là điều kiện nếu làm phương án A+ của BUG-R4-054. A+ đã xếp vào backlog.
- Minor: có 111 thẻ không có dấu xử lý ngay trong tệp review. PO rà từng thẻ (phụ lục C của `rounds/round-05/plan.md`). Kết quả: 65 đã xử lý ở nơi khác (phản hồi, review lượt sau, PR), 19 vào v1.0.5, 27 vào backlog cải tiến.
- Thẻ theo vai review: SEC 222, ARC 211, UXD 126, DOM 91, PO 30, CPY 21, BA 18, QA 9, INT 7, BEA 4, BEB 4, BE 3, FE 2.

## 3. Lỗi Round 4 (BUG-R4-001…057)

Nguồn: `rounds/round-04/qa/bug-list.md` (32 lỗi) và `rounds/round-04/qa/bug-list-v1.0.4.md` (25 lỗi).

| Mức | Tìm thấy | Đã sửa và đóng | Đã sửa, chờ QA chuyển Closed | Còn mở (đều vào v1.0.5) |
|---|---|---|---|---|
| P0 | 4 | 0 | 4 (037, 038, 046, 048) | 0 |
| P1 | 4 | 0 | 4 (035, 039, 042, 053) | 0 |
| P2 | 20 | 9 | 7 | 4 (036, 041 phần còn lại, 043, 051) |
| P3 | 29 | 10 | 13 | 6 (017, 040, 052, 054, 056, 057) |
| **Tổng** | **57** | **19** | **28** | **10** |

- **Không còn P0/P1 mở.** Cả 8 lỗi P0/P1 đã nằm trong bản đang chạy trên production (v1.0.4, QC ĐẠT CÓ ĐIỀU KIỆN), hoặc chưa từng vào `main` (BUG-R4-048). QA chuyển Closed ở V5-02. Riêng BUG-R4-035, 039: QC v1.0.4 còn ghi mở, QA kiểm lại trên production.
- 4 lỗi P0 đều là **lỗi tiền ở quầy** do QA chốt theo luật "lỗi chạm tiền mặc định P0". Ba lỗi (037, 038, 046) có từ trước v1.0.1 và đã chạy trên production tới 06/11. Sổ tay có cách làm tạm trong thời gian đó.
- 10 lỗi còn mở: 1 là tài liệu thử (056), 1 chỉ có trên staging (054), còn lại có cách làm tạm trong sổ tay hoặc không đi qua Desk (057).
- Lỗi cũ thấy lại trên v1.0.4: BUG-R2-216, BUG-R2-219. Cả hai đã sửa trong v1.0.4.
- Lỗi các round trước còn lại sau Round 4 (chi tiết ở phụ lục A của kế hoạch Round 5):
  - R3: 15 vào v1.0.5, 4 vào backlog, 14 đóng;
  - R2: 8 vào v1.0.5, 12 vào backlog, 4 đóng;
  - R1: 14 dòng đóng (đã xử lý ở Round 2–3, bug list chưa cập nhật).

## 4. Việc báo chủ đầu tư (ESC)

| | Số | Mã |
|---|---|---|
| Tạo trong Round 4 | 8 | ESC-043 … ESC-050 |
| Đã quyết trong Round 4 | 6 | 043, 044, 045 (bảng giá 01/11), 048, 049, 050 (City View 800.000, 06/11) |
| Tạo trong Round 4, còn chờ | 2 | 046, 047 |
| Từ round trước, còn chờ | 6 | 032, 033, 035, 037, 038, 039 |
| **Tổng còn chờ** | **8** | 3 chạy theo giả định (035, 037, 038); 5 phải chờ INV (032, 033, 039, 046, 047) |

Không có ESC mới ở bước Tổng kết.

## 5. Chuyển sang vận hành – các số cho kế hoạch Round 5

- Đã xếp **553 mục** còn mở hoặc chưa rõ trạng thái (số plan R5 mục 7, QC đã kiểm; sửa 06/11 tối theo QC đóng R4 mục 5 ý 5):
  - (a) v1.0.5: 126 mục, gom thành 59 việc;
  - (b) backlog cải tiến: 203 mục, gồm 89 story;
  - (c) đóng: 224 mục.
  - Điều chỉnh sau cổng QC (plan R5 phụ lục I): BUG-R3-047 (a) → (c), thêm 2 cảnh báo Dependabot vào (b).
- v1.0.5: đội đề xuất lên production 20–21/11 nếu INV đồng ý ở review 20/11. Hạn cứng: H2 hoa hồng trước 01/12/2026.

## 6. Cách đếm và giới hạn

- Thẻ: script đếm tiêu đề thẻ `FB-R4-…` (799 tiêu đề, 748 mã khác nhau), mức theo dòng "Mức", trạng thái theo dấu xử lý ở thẻ hoặc trong `responses/`. Sau đó PO kiểm tay toàn bộ 111 thẻ Minor và mẫu Major. Thẻ Suggestion không kiểm tay, nên số Suggestion "đã xử lý" có thể thấp hơn thực tế.
- Lỗi: theo bảng tóm tắt và dòng "Trạng thái" của hai tệp bug list lúc 06/11 tối, đối chiếu với plan v1.0.4 và QC v1.0.4. "Đã sửa, chờ QA" là lỗi có bản sửa trong bản đang chạy production mà bug list chưa chuyển Closed.
- Bảng mục 2 đếm tới commit `6664de95`. 11 thẻ SEC của commit `0fc55457` ghi riêng ở mục 2 và đã xếp trong phụ lục F của kế hoạch Round 5. Thẻ hay lỗi ghi sau `0fc55457` không có trong tệp này.
