# Round 4 – Gói LP-v2: website ottimo.vn đa ngôn ngữ + giá ước tính trong form

- Ngày mở: 01/11/2026 | Người mở: ORC | Nguồn: **FB-INV-008** (thêm tiếng Hàn, Trung giản thể, Nga) + **FB-INV-009** (form "Plan your stay" hiện giá niêm yết ước tính khi khách chọn căn). INV: "gộp chung hai yêu cầu này của tôi và làm luôn nhé" (01/11).
- **Ràng buộc cứng:** không đụng production trước và trong ngày D 02/11. **Phát hành một lần cho cả gói (INV 01/11)** sau khi QC đạt, bảng giá mới đã nhập, người bản xứ + luật sư đọc xong; INV duyệt Release.
- Brand guideline OTTIMO bắt buộc (màu 80/15/5, Lora + Be Vietnam Pro + JetBrains Mono, giọng ngắn – lịch sự – điềm tĩnh, EN dẫn, không emoji). Font cho chữ Hàn/Trung/Nga: UXD chọn và ghi lệch.

## Giả định ORC (INV chưa trả lời 3 điểm – dùng đề xuất của đội, báo INV cuối gói)
- G1: Giá chỉ hiện **trong form**, sau khi khách chọn hạng căn + ngày. Thân trang vẫn không ghi giá (quyết định 24/10).
- G2: Hiện **tổng ước tính cho cả chuyến** (kèm số đêm × giá/đêm, giảm theo thời gian ở nếu có), ghi rõ "ước tính – giá cuối trong báo giá". Theo tháng: "từ X/tháng".
- G3: Giá lấy từ bảng giá trên Desk (BR-101 giá niêm yết, BR-104 lịch giá kênh Trực tiếp, BR-107 giảm theo thời gian ở, BR-114 giá "từ"), không gõ cứng vào web.
- G4: Ngôn ngữ mới chỉ cho landing ottimo.vn (trang chủ, form, privacy, 404). Desk hiện ngôn ngữ khách dùng. Không làm Desk/app/g.ottimo.vn/mẫu tin ở gói này.
- G5: Bản dịch do đội làm; INV nhờ người bản xứ đọc lại trước phát hành. Thông báo xử lý dữ liệu bản dịch gửi luật sư.

## Bước 1 – Sản xuất lượt A (song song)
| Vai | Việc | Ghi vào |
|---|---|---|
| PO | User story + AC cho LP-v2 (nâng US-131 phần giá; US mới cho ko/zh/ru); cập nhật backlog | `rounds/round-04/outputs/PO/lp-v2-stories.md`, `03-backlog/backlog.md` |
| DOM | Luật giá ước tính trên web (công thức, làm tròn, cuối tuần/lễ, tháng, giường phụ, thuế/phí), rate parity với OTA | `rounds/round-04/outputs/DOM/web-price-estimate-rules.md` (+ BR mới trong `product/docs/business-rules.md`) |
| ARC | API contract công khai cho giá ước tính + mở rộng locale cho form/Desk; không lộ giá OTA nền, hoa hồng, biên | `rounds/round-04/outputs/ARC/lp-v2-design.md` + OpenAPI |
| CPY | Chữ ko/zh/ru toàn landing + chữ mới về giá (EN/VI trước) | `rounds/round-04/outputs/CPY/lp-v2-copy.md` |
| UXD | Font thay thế ko/zh/ru, nút chọn ngôn ngữ, cách hiện giá trong form | `rounds/round-04/outputs/UXD/lp-v2-design.md` |
| SEC | Bản dịch thông báo xử lý dữ liệu ko/zh/ru (version mới), rủi ro API giá công khai | `rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` |

## Bước 2 – Code (sau lượt A): BE (API giá + locale), FE-B (landing). Bước 3 – Review chéo. Bước 4 – QA. Bước 5 – QC. Bước 6 – INV duyệt bản dịch (người bản xứ) + Release.
