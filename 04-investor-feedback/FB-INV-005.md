# FB-INV-005 – Giá tháng và giá đêm độc lập, chủ đầu tư tự nhập

- Ngày: 26/10/2026 (sau UAT B1) | Người gửi: INV | Ghi: DOM (theo giao việc của ORC) | Đánh giá: `rounds/round-03/outputs/DOM/fb-inv-005.md`

## Nguyên văn
> cái giá phòng theo tháng chia 12 để ra giá ngày, tôi muốn 2 cái này là độc lập luôn, tự tôi nhập

## Cách hiểu
Bỏ quy tắc "giá đêm niêm yết = giá tháng ÷ 12" (BR-101, ESC-004 B phần giá nền). Mỗi căn có giá tháng và giá đêm do OWN nhập riêng trên Desk (phương án C của câu Q1 trong BR). Lịch giá cuối tuần +15 %, ngày đặc biệt +30 %, giảm theo số đêm, giá OTA nền giữ nguyên – chờ INV xác nhận nhẹ ở ESC-036 (mặc định giữ).

## Phân loại

| # | Ý | Loại | Ưu tiên | Vai | Đích |
|---|---|---|---|---|---|
| 1 | Desk cho nhập giá đêm riêng từng căn, bỏ tự tính ÷ 12 (ô giá đêm trên ngăn kéo căn, chữ VI/EN) | Nghiệp vụ (quy tắc giá) | **P1 – trước B2 sáng 28/10** (gộp + deploy 27/10) vì B2 là lúc nhập giá thật; hạn cứng trước D và B7 | FE (chính), UXD (chữ), BE/ARC (xác nhận + 1 test), QA, DOM (BR v0.4.7 + oracle) | rc trước B2 (28/10) |
| 2 | Dọn phía server: bắt buộc giá đêm khi đổi giá, bỏ ÷ 12 ở nhập danh mục/seed, bỏ tham số `night_from_month_divisor` | Nghiệp vụ / kỹ thuật | P2 | BE, ARC (OpenAPI), QA | v1.0.1 |
| 3 | Kiểm lại con số "chỉ từ" trên landing theo giá đêm căn rẻ nhất INV nhập (BR-114) | Nội dung bán hàng | P2 | DOM, CPY, FE-LP | sau B2 |

## Trạng thái
- Đang làm. 26/10: DOM đánh giá; INV quyết ESC-036 = A (giữ lịch giá cuối tuần/lễ trên giá đêm nhập); **BR v0.4.7 đã áp** (BR-101 độc lập, mục 13, oracle BR-101-01…16). Ý 1 (gói D-min): FE-A mở ô giá đêm trên `RoomDrawer`, BE-A thêm test – đang làm, hạn 27/10 (B2 sáng 28/10). Ý 2: v1.0.1. Ý 3: sau B2.
