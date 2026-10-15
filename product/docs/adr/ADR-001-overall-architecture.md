# ADR-001 – Kiến trúc tổng thể: modular monolith + worker, contract-first API

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: `product/docs/architecture.md` mục 3–5; PRD mục 5, 7; BL 7, 8.4

## Bối cảnh
- OTTIMO có 10 căn, ~5–8 người dùng nội bộ đồng thời, vài chục khách/ngày mở app khách. Tải rất nhỏ; rủi ro chính là **đúng tiền, không đặt trùng, an toàn dữ liệu giấy tờ**, không phải tải.
- Đội nhỏ (BE, FE, MOB, INT), ngân sách hạ tầng ≤ 1 tr/tháng (giả định), phải chạy được trên 1 máy chủ.
- Cần mở rộng lên chuỗi (đa cơ sở) về sau và thay được nhà cung cấp tích hợp.

## Quyết định
1. **Một backend dạng modular monolith** (`product/services/api`): một codebase, một database, chia module theo phân hệ PRD (M0–M15). Module chỉ gọi nhau qua service công khai của module (không truy cập bảng của module khác trực tiếp ngoài các view/đọc được cho phép).
2. **Hai tiến trình cùng một codebase**: `api` (HTTP) và `worker` (job theo lịch, outbox gửi tích hợp, xử lý inbox webhook). Tách tiến trình để job nặng/treo không làm chậm API.
3. **Contract-first**: `product/docs/api/openapi.yaml` (Pha B) là hợp đồng; sinh kiểu TypeScript cho web/PWA bằng `openapi-typescript`; server kiểm hợp đồng bằng test (schema validation trong test API).
4. **Server là nguồn sự thật cho mọi tính toán tiền và tồn phòng**: client chỉ hiển thị kết quả `POST .../preview` của server (báo giá, bill, phụ thu) – không có công thức giá chạy ở client (tránh lệch như BL 8.2 #10–#13).
5. **Bốn ứng dụng client** dùng chung API: web quản trị (`admin-web`), app nhân viên PWA (`mobile`), web khách (`guest-web`), web đặt phòng trực tiếp (`booking-web`, R3).

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn |
|---|---|
| Microservices (đặt phòng, thanh toán, buồng phòng tách dịch vụ) | Giao dịch chống đặt trùng + folio cần ACID trên nhiều bảng; tách dịch vụ cần saga, tốn RAM, tốn công vận hành – vô lý với 10 căn |
| Serverless (Lambda/Cloud Functions + DB managed) | Job theo lịch, kết nối DB, cold start; chi phí DB managed vượt ngân sách; khó giữ dữ liệu tại VN (ESC-002) |
| BaaS (Supabase/Firebase) | Logic tiền/tồn phòng phức tạp nằm rải ở client/function; Firebase không phải SQL (khó ràng buộc chống trùng); dữ liệu ở nước ngoài |

## Hệ quả
- Tốt: 1 lần deploy, giao dịch DB đơn giản, test tích hợp dễ, chạy trên 1 VPS 4 GB.
- Phải chấp nhận: cần kỷ luật ranh giới module (lint rule cấm import chéo `modules/*/internal`); scale theo chiều dọc trước. Với chuỗi nhiều cơ sở (≥ 20), vẫn đủ – một monolith Node + Postgres phục vụ được hàng trăm cơ sở nhỏ.

## Điều kiện xem lại
- > 30 cơ sở hoặc p95 API > 300 ms kéo dài sau khi tối ưu truy vấn → tách worker sang máy riêng trước, rồi mới cân nhắc tách module.
