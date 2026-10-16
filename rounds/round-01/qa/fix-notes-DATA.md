# Ghi chú sửa lỗi – DATA (Round 1, Bước 5)

| BUG | Fixed | Ghi chú |
|---|---|---|
| BUG-R1-003 | Có | `product/docs/metrics-definitions.md`: K-22a loại trừ `cancel_reason_code ∉ {hold_expired, overbooking_relocated, ota_cancelled}` theo BR-308 v0.2 / ERD; ghi rõ danh sách mã **được tính** (`guest_cancelled`, `guest_changed_mind`, `found_other`, `price`, `date_change`, `unreachable`, `group_partial`, `other`). Sửa ví dụ K-22a (`relocated_external` → `overbooking_relocated`), mục 9 dòng Booking (đủ danh mục BR-308 v0.2), làm rõ mục Q-05 (resolution `relocated_external` ↔ `cancel_reason_code = overbooking_relocated`); thêm dòng lịch sử mục 10. Giữ nguyên `relocated_external`/`channel_cancelled` ở `stay_night.void_reason` và `relocated_external` ở `overbooking_incident.resolution` vì ERD giữ các tên này (erd E7). Còn ngoài phạm vi DATA: ARC có thể đóng E7 trong erd.md và bỏ chú thích "DATA dùng tên cũ" ở openapi.yaml dòng ~5317. |
