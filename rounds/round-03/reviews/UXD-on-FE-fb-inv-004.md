# UXD review – FE F3/F4 chữ giờ nhận phòng mới (FB-INV-004)

- Round 3 · Bước: Review · Ngày 26/10/2026 · Người review: UXD · Tác giả: FE
- Đối tượng: `bf56fda` trên main, báo cáo `rounds/round-03/outputs/FE/fb-inv-004-f3f4.md`.
- Căn cứ: BR-401 v0.4.6 (nhận từ 12:00 khi căn `VI`/`VC`, chắc chắn sẵn sàng 14:00, trả 12:00), câu chuẩn BR-401 (e) – DOM `rounds/round-03/outputs/DOM/v1-production-defaults.md` 8.3; `product/design/content-guide.md` mục 1, 7; brand guideline OTTIMO (`00-brief/context/brand/brand-guidelines.md`).
- **Kết luận: ĐẠT.** Không Blocker/Major, không ESC. UXD sửa thẳng 1 chữ EN và các việc FE chuyển sang (content-guide, hi-fi, wireframe, nhãn tham số).

## 1. Duyệt giọng

| Khóa | Kết quả |
|---|---|
| `guest.stay.checkin_time` (EN/VI/RU) | Đạt. Đúng từng chữ câu chuẩn: "Check-in from {time} (your room is always ready by 14:00)". Không hứa "ready from 12:00". |
| `guest.oci.done_body` | Đạt sau sửa. EN "… once your room is ready – always ready by 14:00" thiếu chủ ngữ, đọc như ghi chú; sửa thành "… – it is always ready by 14:00" (đúng câu DOM 8.3 #6). VI, RU giữ. Câu mã cửa (SEC ĐK-6) giữ nguyên. |
| `msg.booking_confirmed` | Đạt. Dùng biến `{checkin_time}`/`{checkout_time}` và vế 14:00 theo câu chuẩn. Ngắn, điềm tĩnh, không emoji, không "!". |

RU vẫn là nháp UXD – cần người bản ngữ duyệt (không đổi so với trước).

## 2. UXD đã sửa

- `product/design/tools/gen_strings.py`: `guest.oci.done_body` EN thêm "it is"; bỏ ghi chú "[FE viết, chờ UXD duyệt]" ở 2 khóa. Nhãn tham số nhân viên: `params.k.checkin_time` "Giờ nhận phòng chuẩn" → **"Nhận phòng từ" / "Check-in from"**; `params.k.checkout_time` "Giờ trả phòng chuẩn" → **"Trả phòng trước" / "Check-out by"** (cùng cách nói với câu chuẩn khách thấy, đọc liền với giá trị "12:00"). Chọn ngắn thay "Giờ nhận phòng sớm nhất (nếu căn sẵn sàng)" để không lẫn với "nhận sớm" có phụ thu (trước 12:00).
- Chạy lại `gen_strings.py` (3188 chuỗi + 8 mẫu) → `copy/strings-{vi,en}.json`, `tools/strings-tables.md`, `wireframes/assets/strings.js`.
- `product/design/content-guide.md`: dán lại 4 dòng bảng mục 8 (`guest.stay.checkin_time`, `guest.oci.done_body`, `params.k.checkin_time`, `params.k.checkout_time`); dòng 180 (câu giờ chuẩn) và 2 dòng `msg.booking_confirmed` đã đúng, không đổi; thêm lịch sử v0.4.2.
- Hi-fi `hifi/18-guest-checkin.html`, `hifi/23-guest-requests.html`, wireframe `wireframes/07-guest-app.html`: tham số mẫu `time` 14:00 → 12:00 và chữ dự phòng theo chuỗi mới; H18 thêm khung giờ đến "12:00 – 14:00" (khớp `eta.ts`); wireframe 07 đổi giờ hiệu lực mã cửa mẫu 14:00 → 12:00 và bỏ "!" ở chữ dự phòng `guest.oci.done_title`.
- `apps/admin-web/src/__tests__/params.test.tsx`: kỳ vọng nhãn `checkin_time` theo chữ mới.

Kiểm tra: admin-web vitest `i18n-keys` + `params` 9/9; guest-web vitest 67/67.

## 3. Ghi chú cho vai khác (không phải thẻ cho FE)

- INT: `integrations/doorlock/access.ts` ghi chú mặc định `checkInTime` '14:00'. Mã cửa chỉ giao sau khi lễ tân nhận phòng (dùng giờ nhận thực tế), nên rủi ro khách vào căn chưa sẵn sàng là thấp; INT cập nhật ghi chú/mặc định khi làm F1/F6.
- Mock admin-web `checkin_time` '14:00' – FE đã ghi đổi cùng F1.

## 4. Điểm làm tốt

- Sửa đúng nguồn duy nhất `gen_strings.py`, chạy lại sinh file, có test chữ VI trên guest-web.
- Khung giờ đến tự tính theo tham số, giữ đúng bộ khung cũ khi 14:00.
