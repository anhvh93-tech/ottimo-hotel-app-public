# FE-LP – Landing: nhận phòng từ 12:00 (F5) và giá "từ" (F9) – FB-INV-004

- Vai: FE-LP | Round 3 – bước Phản hồi & sửa | Ngày: 26/10/2026
- Căn cứ: CPY `rounds/round-03/outputs/CPY/landing-fb-inv-004.md` (bản chốt), BR-401 v0.4.6, BR-114, FB-INV-004.
- Hai commit tách riêng trên cùng nhánh:
  - **Commit 1 – F5** (giờ nhận phòng): đăng được ngay, **phải lên trước ngày D 02/11**.
  - **Commit 2 – F9** (giá "từ"): **CHƯA ĐĂNG** – chờ INV tự kiểm điều khoản ngang giá OTA (BR-114 (5), ESC-035). ORC chỉ đưa commit 2 lên khi INV báo xong.

## 1. F5 – Giờ nhận phòng (commit 1)

### Đã làm
- Câu chuẩn CPY 1.1, đúng từng chữ, ở hai chỗ, cả EN và VI:
  - `amenities.groups[3].body` (mục Amenities, nhóm lễ tân).
  - `faq.items[0].a[0]` (câu hỏi đầu của FAQ). VI đổi luôn câu cuối "đều sẵn sàng" → "đều chu toàn" theo bản chốt.
- `site.json`: `checkinTime` "14:00" → **"12:00"**; thêm **`roomReadyBy` = "14:00"** (kèm ghi chú trong `$comment`). `siteSchema` (`site.ts`) có trường mới, kiểm định dạng giờ.
- JSON-LD `LodgingBusiness` tự theo: `checkinTime` = "12:00", `checkoutTime` = "12:00"; `roomReadyBy` không vào JSON-LD (schema.org không có trường này).
- Danh sách cấm `BANNED` (`scripts/dist-checks.mjs`) thêm `/ready from \d|sẵn sàng từ \d/iu` (BR-401 (e)). Danh sách này chạy cả trên nguồn chữ (Vitest) lẫn HTML/meta/JSON-LD của dist.
- README: ghi nghĩa hai khóa giờ.

### Test thêm (`src/content/copy.test.ts`)
- EN/VI: câu ở Amenities và FAQ chứa `checkinTime`, `roomReadyBy`, `checkoutTime` của `site.json`, đúng câu chuẩn dựng từ ba giá trị đó; không còn "Check-in from 14:00" / "Nhận phòng từ 14:00".
- Mẫu cấm bắt "ready from 12:00" / "sẵn sàng từ 12:00", không bắt câu chuẩn ("always is by 14:00", "luôn sẵn sàng lúc 14:00").
- JSON-LD: `checkinTime`/`checkoutTime` = `site.json`, không có `roomReady` hay "14:00".
