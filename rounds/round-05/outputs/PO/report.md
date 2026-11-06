# PO – Round 5, bước Sản xuất, Gói 0: release notes v1.0.4, trạng thái backlog, mở Round 5

- Người làm: PO. ORC lưu tệp này từ báo cáo bàn giao của PO (subagent không ghi tệp báo cáo).
- Commit: `8d607f98` trên `main`.

## 1. Đã làm gì

**V5-01 – release notes (`product/docs/release-notes.md`).** Xong, chỉ còn ghi số bản sổ tay sau khi gộp #69.
- v1.0.4: đã phát hành 06/11 14:10, tag `v1.0.4` → `6414be25`. LP-v2 và giá web lên cùng ngày. Bỏ câu "khách chưa thấy gì".
- Check-in online: đã mở lại (N5). BUG-R3-021 phần Desk trỏ V5-58.
- Thêm mục v1.0.5 "Đang làm". Các bảng "Chưa có" từ v1.0.0 đến v1.0.4 trỏ về V5-xx hoặc backlog.
- Sửa hai câu "chưa mở lại", "vẫn dừng". Ba đoạn check-in cũ ở v1.0.0–v1.0.3 thêm ghi chú "đã mở lại 06/11".

**V5-06 – backlog (`03-backlog/backlog.md`).** Xong.
- 19 story chuyển "Xong (production)", gồm 9 story LP-v1 US-146…154.
- 111 dòng mục 5.6/5.6a/5.6b có nhãn mới: "Xong v1.0.4", "→ V5-xx" hoặc "→ backlog B-xxx".
- Thêm mục 5.7.

**Mở Round 5.**
- Thêm 1 dòng decision-log (PO, ORC đồng ý), có câu ĐK-2 chặn production với bản có migration.
- Cập nhật `rounds/round-05/plan.md`:
  - bảng ĐK-1…8 kèm hạn và tình trạng tối 06/11;
  - tiêu chí QC điều 8 thêm "diễn tập khôi phục xong trước production nếu bản có migration";
  - phụ lục I;
  - quyết định PO 6–10 ở mục 6.

**Việc ORC giao thêm (từ báo cáo BA).**
- `product/docs/staff-one-pager.md`:
  - Tờ 1 thêm khối "Check-in online – mở lại từ 06/11/2026", gồm ba dòng BA đề xuất, khớp sổ tay 2.9 và SEC N4–N6;
  - bỏ khối "tạm dừng" (nằm ở Tờ 2a, không phải Tờ 1);
  - Tờ 2a đổi tên thành "Giữ chỗ quá hạn (tạm)" và sửa 4 câu về giữ chỗ quá hạn cho khớp bảng "Giữ chỗ và cọc" của release notes v1.0.4.
- `product/docs/day-one-guide.md` mục 10: dòng check-in ghi "hết hiệu lực từ 06/11/2026".
- Dòng V5-08 trong plan mở rộng gồm:
  - mọi chỗ QC liệt kê;
  - 9 chỗ BA grep thêm;
  - ĐK-4 (c);
  - gộp #69;
  - tờ dán quầy.
  Plan ghi thêm: INV in lại Tờ 1 và Tờ 2a.
- Sửa theo QC mục 5:
  - `rounds/round-04/outputs/PO/esc-pending-06-11.md`: 03:30 → 03:00; City View 800.000 đã nhập;
  - `rounds/round-04/outputs/PO/round-4-metrics.md`: số đếm 553/126/203/224.

## 2. File tạo/sửa
- `product/docs/release-notes.md`
- `03-backlog/backlog.md`
- `rounds/round-05/plan.md`
- `01-decisions/decision-log.md` (1 dòng cuối)
- `product/docs/staff-one-pager.md`
- `product/docs/day-one-guide.md`
- `rounds/round-04/outputs/PO/esc-pending-06-11.md`
- `rounds/round-04/outputs/PO/round-4-metrics.md`

## 3. Giả định
- Cách gửi link nằm ở Tờ 1 vì đây là cách làm lâu dài, không còn là việc tạm.
- Gửi link nhầm người: chỉ thu hồi rồi tạo link mới, theo sổ tay 2.9. Không thêm bước báo chủ đầu tư; SEC có thể yêu cầu thêm khi review.
- 9 story LP-v1 chuyển "Xong (production)" dù không có trong danh sách B1, vì đã chạy trên ottimo.vn từ 25/10. Số đếm không đổi.
- ĐK-6 và ĐK-7 ghi "đang làm", vì DOM và QA còn chạy lúc commit.
- ESC mới: không có.

## 4. Rủi ro/vướng mắc
1. **Sổ tay BA còn một câu sai.** "Đơn giữ chỗ cũng hiện nút Tạo link check-in online, Desk luôn từ chối (sửa ở v1.0.5)" đã sai từ v1.0.4: BUG-R3-047 sửa ở `5539b7e6`, Desk chỉ hiện mục link cho đơn đã xác nhận.
   - Chỗ còn câu này: sổ tay 2.4, 2.9 (khung đầu mục và bước 1), 5.6; `guides/02` 4.5 và 17.3; `guides/05` 4.2.
   - BA sửa trước 10/11 (đã ghi ở V5-08).
2. **Dependabot.** Câu QC "lockfile đã ở bản vá" không khớp cảnh báo #19.
   - `minimatch` 10.2.6 nằm trong dải ảnh hưởng (≥ 7.0.0, < 11.0.1). Gói chỉ có ở công cụ dev, chưa có bản vá cài được. PO xếp (b) B-KYTHUAT, không ép bản; SEC ghi kết luận.
   - Cảnh báo #3 `react-router` (runtime, Desk) chưa xếp. PO xếp (b) B-BAOMAT, SEC phân loại ở Gói 0. Nếu khai thác được thì đưa phần chặn vào Gói 4.
   - `nodemailer` đã có ở V5-41.
3. **BUG-R3-047 chuyển (a) → (c).** V5-53 chỉ còn BUG-R3-048. Bảng đếm mục 7 giữ số QC đã kiểm; đếm lại thì 555 = 125 + 205 + 225, vẫn 59 việc V5.
4. **#69 vẫn xung đột.** BA gộp ở Gói 0 cùng V5-08, sau đó PO ghi số bản sổ tay vào release notes.
5. **Tờ 2a cần đọc lại trước khi INV in:** DOM đọc phần giữ chỗ, SEC đọc phần check-in. Tờ 2a sẽ viết lại hẳn cùng sổ tay 2.4 ở V5-71.

## 5. Việc chưa xong
- Ghi số bản sổ tay vào release notes sau khi gộp #69.

## Cập nhật 06/11 tối – Phản hồi & sửa (commit `a907edc7`)
- **V5-25 lên P1**, gồm cả `min_stay` (BUG-R5-003) và `weekend_nights` (BUG-R5-001).
  - Là việc đầu của làn BE-C: bắt đầu 07/11, không chờ PR-0 vì không đổi schema, mục tiêu gộp 10/11.
  - Luật kiểm theo DOM rules-v1.0.5.
- **Đường gỡ** (quyết định 19): ở v1.0.5 chỉ làm bộ kiểm khi lưu cộng đọc phòng thủ. Giá trị hỏng đã nằm trong DB cũng không còn gây lỗi 500.
  - Sửa trong ngày đưa vào backlog R5-B-06.
  - Trước khi deploy, chạy giá trị đang hiệu lực trên production qua bộ kiểm mới.
  - Các khóa có cấu trúc khác trên luồng quầy được rà trong cùng PR; khóa ngoài luồng quầy để R5-B-05.
- **BUG-R5-002 nối vào V5-5B:**
  - 5B-1: ghi tiền kèm ảnh, yêu cầu hoàn 100 %, "Cần chú ý" `deposit_after_cancel` (US-085 AC4). Mức nên có; làn BE-B sau PR-B1; không cần migration.
  - 5B-2: khôi phục đơn, để v1.0.6.
  - Kết luận SEC đi theo 3 nhánh; nếu cần thì thêm V5-48 (bắt buộc).
- **Release notes:**
  - v1.0.5: một dòng cho hai ô;
  - v1.0.4: "Lời dặn tạm cho bản v1.0.4 đang chạy", dùng câu BA; cách làm tạm cho BUG-R5-002;
  - lời dặn chọn **Hiệu lực từ** ngày mai cho các ô dạng danh sách khác.
- **Tờ in:** đã sửa bảng "Cách in và dán", ghi chú khổ giấy, Tờ 1 ở 8,25 pt (quyết định 21). "OTM-…" trên Tờ 2a đã bọc backtick.
- **Tờ 2a dòng 86: CHƯA sửa**, vì lúc PO làm DOM chưa commit chữ thay. Tờ 2a vẫn chưa in.
- **Việc chuyển:**
  - BE-C: PR V5-25, kèm lệnh kiểm chỉ đọc cho ORC chạy trước deploy.
  - ARC:
    - mô tả `setParameter` cho hai khóa;
    - chốt hướng 5B-1 trước 10/11;
    - migration 5B-2.
  - QA: test V5-25 và 5B-1 theo các ca trong bug-list.
  - BA: EP02 10.5 ghi "FD/SAL", hợp đồng ghi FD+; cần sửa cho khớp.
  - UXD:
    - dựng lại Tờ 2a sau khi sửa dòng 86;
    - câu `PARAM_OUT_OF_RANGE` cho hai khóa.
- **ORC ghi thêm:**
  - `weekend_nights` trên production đã được ORC đọc chỉ đọc ngày 06/11: `["FRI","SAT"]` từ 28/10, đúng dạng bộ tính giá cần.
  - V5-5B là quyết định 16.
