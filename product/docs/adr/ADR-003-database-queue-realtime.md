# ADR-003 – PostgreSQL 17 là kho duy nhất; hàng đợi pg-boss (chưa dùng Redis); real-time bằng SSE

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
- Liên quan: ADR-001, ADR-009, ADR-010, ADR-011

## Bối cảnh
- Mặc định trong skill ARC gợi ý PostgreSQL + Redis. Với 10 căn, VPS 4 GB và ngân sách ≤ 1 tr/tháng, mỗi thành phần thêm vào là RAM, sao lưu, giám sát thêm.
- Cần: job theo lịch (hết hạn giữ chỗ, nhắc trả phòng, hạn khai báo 23:00/12 giờ, 07:00 chuyển OC→OD, xóa dữ liệu theo hạn), outbox gửi tích hợp có retry, cập nhật trạng thái phòng gần thời gian thực cho lễ tân/buồng phòng.

## Quyết định
1. **PostgreSQL 17** là kho dữ liệu duy nhất (dữ liệu nghiệp vụ, phiên đăng nhập, hàng đợi, khóa idempotency). Extension: `btree_gist` (chống trùng – ADR-009), `pgcrypto` (UUID/băm), `citext` (email).
2. **Hàng đợi + lịch: `pg-boss`** (chạy trên PostgreSQL): job có retry, lùi theo cấp số nhân, singleton key (gộp lô đồng bộ kênh). Lịch = tick mỗi phút + so mốc theo `Clock` (ADR-008 cập nhật), không dùng cron theo tz. pg-boss chỉ bảo đảm "ít nhất một lần" → handler theo mẫu đúng-một-lần (architecture 9.1). Schema `pgboss` ngoài RLS, cài bởi `ottimo_migrator`. Outbox ghi **cùng transaction** nghiệp vụ → worker đọc.
3. **Real-time: Server-Sent Events (SSE)** `GET /v1/properties/{id}/events` + PostgreSQL `LISTEN/NOTIFY` giữa worker và api. Client tự kết nối lại; nếu SSE bị chặn → poll 30 giây. Không dùng WebSocket (không cần 2 chiều).
4. **Không cài Redis ở MVP.** Bộ nhớ đệm (cache) tham số cấu hình: trong RAM tiến trình, xóa khi có NOTIFY `config_changed`.
5. Khóa chính: UUID v7 (sắp xếp theo thời gian) cho bảng nghiệp vụ; mã chứng từ hiển thị (`OTM-00171`, BR-007) là cột riêng do bộ đếm cấp (Pha B).

## Phương án đã cân nhắc
| Phương án | Vì sao không chọn (lúc này) |
|---|---|
| Redis + BullMQ | Thêm ~100–200 MB RAM, thêm dịch vụ phải sao lưu/giám sát; outbox vẫn phải ở Postgres để atomic → 2 nơi chứa trạng thái job |
| RabbitMQ / Kafka | Quá lớn cho quy mô |
| WebSocket (Socket.IO) | Cần sticky session/adapter Redis khi scale; SSE đủ cho luồng 1 chiều |
| Cron hệ điều hành | Không retry, không đối soát, không theo cơ sở/múi giờ |

## Hệ quả
- Tốt: 1 thứ phải sao lưu (Postgres + thư mục tệp mã hóa); job và dữ liệu nhất quán trong 1 giao dịch.
- Phải chấp nhận: pg-boss thêm tải ghi cho Postgres (không đáng kể ở quy mô này); throughput hàng đợi thấp hơn Redis (đủ cho < 100 job/giây).

## Điều kiện xem lại
- Thêm Redis khi: > 20 cơ sở, hoặc cần rate-limit phân tán nhiều instance api, hoặc hàng đợi > 50 job/giây kéo dài.
