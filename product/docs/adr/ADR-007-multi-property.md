# ADR-007 – Đa cơ sở: một database, cột `property_id` + Row Level Security

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: decision-log 15/10 ([GIẢ ĐỊNH] thiết kế sẵn đa cơ sở, MVP 1 cơ sở); US-009 (Could R4+); BR-007 (mã chứng từ theo cơ sở); SEC C1 (phân quyền theo cơ sở)

## Bối cảnh
- MVP chỉ có OTTIMO Đà Lạt; INV có thể mở thêm cơ sở. Nếu không có khái niệm cơ sở từ đầu, thêm sau sẽ phải sửa mọi bảng/truy vấn.

## Quyết định
1. Mô hình 2 cấp:
   - `organization` (chủ đầu tư/chuỗi – "tenant"): sở hữu người dùng, hồ sơ khách (CRM dùng chung cả chuỗi), mẫu tin nhắn, tài khoản tích hợp cấp chuỗi.
   - `property` (cơ sở): căn, nhóm căn, giá, tham số quy tắc, đơn, folio, buồng phòng, kho, khai báo, bộ đếm mã chứng từ. Có `timezone` (mặc định `Asia/Ho_Chi_Minh`), `currency` (VND).
2. **Mọi bảng nghiệp vụ** mang `organization_id` và (nếu thuộc cơ sở) `property_id`, NOT NULL, có index; khóa ngoại kép để không thể trỏ chéo cơ sở.
3. **Phân quyền theo cơ sở**: `user_property_role(user_id, property_id, role)` – một người có thể là quản lý ở cơ sở A, lễ tân ở cơ sở B. Vai cấp chuỗi (chủ đầu tư) thấy mọi cơ sở của tổ chức.
4. **Lớp bảo vệ kép**:
   - Tầng ứng dụng: mọi repository bắt buộc nhận `TenantContext {organizationId, propertyIds}` (không có hàm truy vấn không có ngữ cảnh – lint/test kiểm tra).
   - Tầng DB: **PostgreSQL Row Level Security** trên bảng có `property_id`/`organization_id`; API đặt `SET LOCAL app.org_id`, `app.property_ids` đầu mỗi transaction; vai DB của ứng dụng **không** có `BYPASSRLS`. Job hệ thống dùng vai DB riêng có ghi nhật ký.
5. Đường dẫn API chứa cơ sở: `/v1/properties/{propertyId}/...` cho tài nguyên cấp cơ sở; `/v1/guests/...` cấp tổ chức.
6. MVP: seed 1 `organization` + 1 `property`; UI không hiện bộ chọn cơ sở khi người dùng chỉ có 1 cơ sở (US-009 để R4+).
7. Tham số cấu hình (BR mục 13) lưu theo cơ sở, có **ngày hiệu lực** (`effective_from`) để báo giá/đơn lấy snapshot đúng (BR-006).

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Mỗi cơ sở 1 database / 1 schema | Báo cáo chuỗi, CRM chung, migration nhiều lần; quá phức tạp cho 1–5 cơ sở |
| Chỉ lọc ở tầng ứng dụng, không RLS | Một truy vấn quên điều kiện là lộ dữ liệu cơ sở khác; RLS là lưới an toàn rẻ |

## Hệ quả
- Tốt: thêm cơ sở = thêm dòng dữ liệu + cấu hình; không đổi code.
- Phải chấp nhận: mọi truy vấn có thêm điều kiện + chi phí RLS nhỏ; test phải có bộ dữ liệu 2 cơ sở để chứng minh cách ly (QA thêm vào test strategy).
