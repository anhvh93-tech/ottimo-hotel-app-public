# ADR-010 – Hosting: 1 VPS tại Việt Nam, Docker Compose, Caddy; chi phí ≤ 1 tr/tháng

- Trạng thái: Đề xuất – **phụ thuộc ESC-002** (nơi đặt dữ liệu, INV quyết) | Người quyết: ARC (kỹ thuật), INV (chi phí + nơi đặt dữ liệu) | Ngày: 15/10/2026
- Liên quan: decision-log 15/10 ([GIẢ ĐỊNH] hạ tầng ≤ 1 tr/tháng, chưa gồm channel manager, SMS/Zalo); ESC-002; PRD N10, N11; SEC L7, Q6; OPS `hosting-plan.md` (OPS viết chi tiết dựa trên ADR này)

> Quy ước nguồn giống INT: **[Nguồn]** trang chính thức; **[Bên thứ ba]** trang tổng hợp/review, chưa đối chiếu với hãng; **[Chưa xác minh]** ước lượng của đội. Tỷ giá tạm tính 1 USD ≈ 26.200 đ, 1 EUR ≈ 30.500 đ [GIẢ ĐỊNH, cùng INT]. Tra cứu ngày 15/10/2026. **Không có số nào ở đây là báo giá chính thức** – OPS phải lấy báo giá trước khi INV duyệt.

## Bối cảnh
- Tải: 10 căn, < 10 người dùng nội bộ đồng thời, < 200 lượt mở app khách/ngày, < 1 GB dữ liệu/năm (chưa tính ảnh giấy tờ, xóa theo hạn).
- Thành phần chạy (ADR-001…004): `api` (~250 MB RAM), `worker` (~200 MB), PostgreSQL (~0,5–1 GB), Caddy (~50 MB), tệp tĩnh. Tổng < 2 GB → **VPS 2 vCPU / 4 GB RAM / 40–80 GB SSD** dư cho production; staging cần 1–2 GB.
- SEC/ESC-002 đề xuất dữ liệu khách (đặc biệt ảnh giấy tờ) ở Việt Nam.

## Quyết định (đề xuất)
1. **Production: 1 VPS tại Việt Nam** (nhà cung cấp chọn ở R2 bởi OPS theo tiêu chí dưới), chạy **Docker Compose**: `caddy` (TLS Let's Encrypt tự động, phục vụ web tĩnh, reverse proxy), `api`, `worker`, `postgres`. Không dùng DB managed (đắt, khó di chuyển).
2. **Staging**: R2–R3 dùng VPS này làm staging với dữ liệu giả (production bị chặn tới khi có ESC-002). Từ khi chạy thật: staging chuyển sang 1 VPS nhỏ (1–2 GB), **ưu tiên khác nhà cung cấp** để kiêm nơi nhận bản sao lưu ngoài máy (off-site).
3. **Sao lưu**: `pg_dump` hằng ngày + WAL archive (PITR, mục tiêu mất ≤ 15 phút dữ liệu, PRD N11 yêu cầu ≤ 24 giờ) + thư mục tệp mã hóa; mã hóa bản sao lưu (age/GPG) trước khi chuyển off-site **trong Việt Nam**; giữ 7 ngày + 4 tuần + 3 tháng (chờ SEC T15/T16). Thử khôi phục mỗi round (OPS).
4. **Không đặt Cloudflare proxy (đám mây cam) trước API/app khách** khi chọn phương án A của ESC-002 – proxy giải mã TLS ở máy chủ nước ngoài. Dùng Cloudflare/nhà đăng ký tên miền chỉ cho DNS là được.
5. Di chuyển được: toàn bộ là container + script; đổi nhà cung cấp = dựng VPS mới + khôi phục backup (OPS ghi runbook) → giảm rủi ro khóa nhà cung cấp, đáp ứng "đổi hosting được" của ESC-002.

### Tiêu chí chọn nhà cung cấp VPS (OPS áp dụng ở R2)
Trung tâm dữ liệu tại VN (ưu tiên TP.HCM hoặc Hà Nội), SSD/NVMe, ≥ 2 vCPU/4 GB, IPv4 riêng, snapshot, hóa đơn VAT, thanh toán theo tháng, có object storage hoặc cho phép VPS thứ 2 làm đích backup, uptime cam kết ≥ 99,5%.

## So sánh chi phí (VND/tháng, đã gồm VAT 10% khi nguồn ghi chưa VAT)

| Hạng mục | **A. Việt Nam** | **B. Singapore** | **C. Châu Âu** (tham khảo) |
|---|---|---|---|
| VPS production 2 vCPU/4 GB | **~270.000–500.000**. Ví dụ: Viettel IDC "T1.Base 03" 2 vCPU/4 GB/20 GB SSD 399.000 đ chưa VAT [Bên thứ ba: whtop.com]; PA Vietnam cloud server từ 246.000 đ [Bên thứ ba: whtop.com, chưa rõ cấu hình]; BizFly Cloud có gói 4 GB ở mức cao hơn [Nguồn: bizflycloud.vn/bang-gia, chưa rõ vCPU] | Hetzner CPX22 Singapore ~19 USD ≈ 500.000 [Bên thứ ba, giá quy đổi]; DigitalOcean 2 vCPU/4 GB 24 USD ≈ 630.000 [Bên thứ ba] | Hetzner CX23/CPX22 EU ~4–8 EUR ≈ 120.000–245.000 [Bên thứ ba, sau đợt tăng giá 4/2026] |
| Staging / đích backup (VPS 1–2 GB) | ~100.000–200.000 [Chưa xác minh] | ~150.000–300.000 [Chưa xác minh] | ~120.000 [Chưa xác minh] |
| Object storage backup (≤ 50 GB) – nếu không dùng VPS staging làm đích | ~50.000–100.000 [Chưa xác minh] | DO backup 20% giá droplet ≈ 125.000 [Bên thứ ba] | ~30.000 [Chưa xác minh] |
| Tên miền (.com hoặc .vn, chia 12 tháng) | ~30.000–70.000 [Chưa xác minh] | như A | như A |
| Email giao dịch (< 1.000 email/tháng) | 0–30.000 (gói miễn phí/trả theo lượng của dịch vụ nước ngoài) [Chưa xác minh] | như A | như A |
| TLS (Let's Encrypt), giám sát uptime gói miễn phí | 0 | 0 | 0 |
| **Tổng ước tính** | **~450.000–900.000** | **~650.000–1.150.000** | ~300.000–450.000 |
| Độ trễ từ Đà Lạt (ước) | ~10–40 ms | ~40–80 ms | ~200–300 ms → khó đạt p95 < 300 ms cảm nhận |
| Dữ liệu khách ở VN (ESC-002) | **Có** | Không – cần hồ sơ chuyển dữ liệu ra nước ngoài | Không |

**Kết luận kỹ thuật:** ở quy mô này **hosting Việt Nam không đắt hơn Singapore** và vừa ngân sách ≤ 1 tr/tháng → ủng hộ **phương án A của ESC-002** (dữ liệu chính tại VN). Châu Âu rẻ nhất nhưng trễ cao và dữ liệu ra nước ngoài → loại.

### Phần vẫn ra nước ngoài kể cả khi chọn A (đưa vào ESC-002 / hồ sơ chuyển dữ liệu – SEC)
| Dịch vụ | Dữ liệu gửi đi | Mức (SEC) | Ghi chú |
|---|---|---|---|
| Channel manager (đề xuất Beds24 – máy chủ ở EU [Chưa xác minh]) | Tên khách, ngày ở, số khách, liên hệ do OTA cung cấp, giá | C2 | Bắt buộc để bán OTA; **không** gửi giấy tờ |
| Email giao dịch (SES/Resend/Brevo…) | Email, tên, nội dung xác nhận/bill | C2 | Có thể chọn nhà cung cấp email VN nếu INV muốn (OPS/INT đánh giá) |
| Theo dõi lỗi (nếu dùng SaaS như Sentry) | Stack trace – **phải che PII** | C1 | MVP: không dùng SaaS, chỉ log trên VPS; xem lại R3 |

## Phương án đã cân nhắc
- **PaaS (Render/Railway/Fly.io) + DB managed**: tiện nhưng DB managed ≥ 15–25 USD/tháng riêng [Chưa xác minh], dữ liệu ngoài VN.
- **Kubernetes**: thừa cho 4 container.

## Hệ quả
- Tốt: chi phí thấp, di chuyển được, dữ liệu tại VN.
- Phải chấp nhận: 1 VPS là điểm lỗi đơn – chấp nhận cho 10 căn; RTO mục tiêu ≤ 4 giờ (dựng VPS mới + khôi phục) [GIẢ ĐỊNH – OPS xác nhận]. Vận hành OS (vá bảo mật, tường lửa) do OPS tự động hóa (unattended-upgrades, chỉ mở 80/443/SSH-khóa).

## Điều kiện xem lại
- INV chọn phương án B/C của ESC-002 → giữ nguyên kiến trúc, đổi nơi đặt VPS (không đổi code).
- Báo giá thực tế của OPS vượt 1 tr/tháng → ESC mới kèm phương án giảm (gộp staging vào production bằng compose project riêng).
