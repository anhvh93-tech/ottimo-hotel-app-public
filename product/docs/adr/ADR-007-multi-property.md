# ADR-007 – Đa cơ sở: một database, cột `property_id` + Row Level Security

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: decision-log 15/10 ([GIẢ ĐỊNH] thiết kế sẵn đa cơ sở, MVP 1 cơ sở); US-009 (Could R4+); BR-007 (mã chứng từ theo cơ sở); SEC C1 (phân quyền theo cơ sở)

## Bối cảnh
- MVP chỉ có OTTIMO Đà Lạt; INV có thể mở thêm cơ sở. Nếu không có khái niệm cơ sở từ đầu, thêm sau sẽ phải sửa mọi bảng/truy vấn.

## Quyết định
1. Mô hình 2 cấp:
   - `organization` (chủ đầu tư/chuỗi – "tenant"): sở hữu người dùng, hồ sơ khách (CRM dùng chung cả chuỗi), mẫu tin nhắn, tài khoản tích hợp cấp chuỗi.
   - `property` (cơ sở): căn, nhóm căn, giá, tham số quy tắc, đơn, folio, buồng phòng, kho, khai báo, bộ đếm mã chứng từ. Có `timezone` (mặc định `Asia/Ho_Chi_Minh`), `currency` (VND).
2. **Mọi bảng nghiệp vụ** mang `organization_id` và (nếu thuộc cơ sở) `property_id`, NOT NULL, có index; khóa ngoại kép `(property_id, x_id) → x(property_id, id)` để không thể trỏ chéo cơ sở (erd mục 1).
3. **Phân quyền theo cơ sở**: `user_property_role(user_id, property_id, role)` – một người có thể là quản lý ở cơ sở A, lễ tân ở cơ sở B. Vai cấp chuỗi (chủ đầu tư) thấy mọi cơ sở của tổ chức.
4. **Lớp bảo vệ kép**:
   - Tầng ứng dụng: mọi repository bắt buộc nhận `TenantContext {organizationId, propertyIds}` (không có hàm truy vấn không có ngữ cảnh – lint/test kiểm tra).
   - Tầng DB: **PostgreSQL Row Level Security** trên bảng có `property_id`/`organization_id`; middleware gọi `set_config('app.organization_id'|'app.property_id'|'app.user_id'|'app.actor_type', $n, true)` ở câu lệnh đầu tiên mỗi giao dịch (tên **số ít**, khớp erd mục 2.2); policy dùng `app_current_property()` có `NULLIF` (an toàn khi kết nối được tái sử dụng). api **và** worker dùng cùng vai `ottimo_app` (`NOSUPERUSER NOBYPASSRLS`); migration dùng `ottimo_migrator`. Truy vấn trước khi có ngữ cảnh (đăng nhập, phiên, thiết bị, token khách, webhook, trang QR, danh sách cơ sở cho worker) đi qua **hàm `SECURITY DEFINER` hẹp** (erd 2.4) – không tắt RLS, không dùng vai `BYPASSRLS`.
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

## Cập nhật R1 bước 4 (16/10/2026)
- Điểm 4 chốt cơ chế (BE-ARC-01, -02, -03): một tên biến số ít; vai DB `ottimo_owner/migrator/app/readonly`; hàm đường vào SECURITY DEFINER; bỏ câu "vai DB riêng cho job". `username` duy nhất toàn hệ thống. Yêu cầu OPS sửa init/compose/CI ghi ở erd 2.1.
