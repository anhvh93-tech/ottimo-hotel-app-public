# Ghi chú sửa lỗi – PO – Round 1, Bước 5 (vòng sửa)

- Tác giả: PO | Ngày: 16/10/2026 | Nguồn lỗi: `rounds/round-01/qa/bug-list.md`
- QA vui lòng kiểm lại và chuyển trạng thái trong `bug-list.md` (PO không sửa file của QA).

## BUG-R1-002 (P2) – US-136 AC4 mâu thuẫn SM-05 K12 và ràng buộc ERD → **Fixed (chờ QA kiểm lại)**

| | Nội dung |
|---|---|
| File sửa | `03-backlog/backlog.md` mục 4, EP02, US-136 AC4 (dòng 416) |
| Trước | "… Then đơn về `confirmed`, đóng lại phòng, khai báo có **bản ghi mới** `none`, …" |
| Sau | "… Then đơn về `confirmed`, đóng lại phòng, **bản ghi khai báo của đơn được dùng lại** và chuyển `void` → `none` (SM-05 K12; giữ ràng buộc một bản ghi khai báo/đơn – ERD 4.7, UK `registration.reservation_id`; **không** sinh bản ghi khai báo mới), ảnh giấy tờ đã xóa theo K11 **không** khôi phục – khách/lễ tân nộp lại, `manager` nhận thông báo, lần khôi phục hiện trong đóng ca (BR-526). *(Sửa BUG-R1-002, 16/10)*" |
| Căn cứ | `state-machines.md` SM-01 B12 ("khai báo `void` → `none` (K12, dùng lại bản ghi)") và SM-05 K12; `erd.md` 4.7 (`registration.reservation_id` UK, "một bản ghi cho mỗi đơn gốc"); BR-608 |
| Ảnh hưởng test | TC-L2-074/075 đã kiểm theo K12 – kỳ vọng không đổi. QA có thể bỏ dòng ghi chú "**Lệch tài liệu** … ghi lỗi tài liệu P2 (PO/BA)" trong TC-L2-074 (`product/tests/test-cases/r1-main-flows.md` dòng 167) |
| BA xác nhận | Câu chữ lấy nguyên từ SM-05 K12 của BA, không đổi nghĩa – không cần BA sửa gì thêm |

### Chỗ còn lệch cùng nội dung (không thuộc file của PO – gửi vai sở hữu)
| File | Vị trí | Hiện tại | Đề nghị | Vai |
|---|---|---|---|---|
| `product/docs/api/openapi.yaml` | dòng 1581, mô tả `restoreNoShow` | "khai báo sinh bản ghi mới `none`" | "khai báo của đơn (dùng lại bản ghi) `void` → `none` (SM-05 K12)" | ARC (gộp vào lượt sửa BUG-R1-018) |

QA tìm lại bằng: `grep -rn "bản ghi mới" product 03-backlog` – sau khi ARC sửa, chỉ còn các câu đúng nghĩa BR-608 (đơn con gia hạn **không** sinh bản ghi mới).

## BUG-R1-017 (P3) – phần của PO: số đếm cũ "74 story Must R2" → **Fixed (chờ QA kiểm lại)**

| | Nội dung |
|---|---|
| File sửa | `03-backlog/backlog.md` dòng 273 |
| Trước / Sau | "## 4. Tiêu chí nghiệm thu – **74** story Must Round 2 …" → "… **77** story Must Round 2 …" |
| Phần còn lại | `openapi.yaml` `info.description` "Phủ 74 story Must R2" – thuộc ARC |

## Không đổi
- Không đổi phạm vi, MoSCoW hay round của story nào; không tạo ESC mới.
