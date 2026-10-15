# Phương án hosting – OTTIMO Desk (phác thảo Round 1)

- Người viết: OPS | Round 1 – Đợt 3 | Ngày: 15/10/2026 | Trạng thái: **Phác thảo – chờ INV quyết ESC-002 (nơi đặt dữ liệu) và duyệt chi phí**
- Căn cứ: ADR-010 (ARC), ESC-002 phương án A (dữ liệu khách tại Việt Nam), `data-risk-assessment.md` T15/T16/T18 (SEC), decision-log 15/10 ([GIẢ ĐỊNH] hạ tầng ≤ 1 triệu đ/tháng)
- Dùng cho: Round 2 dựng staging; Round 3 chuẩn bị production.

> **Quy ước nguồn** (giống ADR-010/INT): **[Nguồn]** = trang giá chính thức của hãng, OPS đọc ngày 15/10/2026; **[Bên thứ ba]** = trang tổng hợp, chưa đối chiếu với hãng; **[Chưa xác minh]** = ước lượng của đội. Không có số nào ở đây là **báo giá chính thức** – trước khi INV ký, OPS lấy báo giá bằng văn bản (có VAT, có hóa đơn).
> Giá trên trang hãng thường **chưa gồm VAT 10%**; bảng dưới đã cộng VAT khi nguồn ghi "chưa VAT".

## 1. Tóm tắt cho chủ đầu tư

- Hệ thống cần **1 máy chủ ảo (VPS) 2 nhân / 4 GB RAM** đặt **tại Việt Nam** cho bản chạy thật, cộng một chỗ cất bản sao lưu cũng tại Việt Nam.
- Ước tính **khoảng 0,35 – 0,95 triệu đ/tháng** tùy phương án (phương án đề xuất ~0,43–0,54 triệu) → **nằm trong ngân sách ≤ 1 triệu đ/tháng**. Chưa gồm: phí channel manager (Beds24 ~0,9–2,3 tr – INT), SMS/Zalo ZNS, email vượt gói miễn phí.
- Đội đề xuất **Phương án 2** (máy chính + máy phụ ở nhà cung cấp khác làm staging và nơi giữ bản sao lưu): an toàn hơn khi một nhà cung cấp gặp sự cố, vẫn rẻ.
- Cần INV: (1) quyết ESC-002; (2) duyệt mức chi phí hosting (OPS đề xuất ESC mới – xem report OPS R1); (3) chọn tên miền.

## 2. Nhu cầu tài nguyên (từ ADR-010)

| Thành phần | RAM ước | Ghi chú |
|---|---|---|
| PostgreSQL 17 | 0,5–1 GB | dữ liệu + hàng đợi pg-boss + phiên |
| api (NestJS/Fastify) | ~250 MB | |
| worker | ~200 MB | job lịch, outbox/inbox |
| Caddy + web tĩnh | ~50 MB | TLS Let's Encrypt tự động |
| Hệ điều hành + Docker | ~400 MB | |
| **Tổng** | **~1,5–2 GB** | VPS 4 GB dư ~2× cho đỉnh tải và bản build |

Dữ liệu: < 1 GB/năm (chưa tính ảnh giấy tờ – tự xóa theo hạn) → ổ 40 GB đủ nhiều năm. Băng thông: rất thấp (10 căn, < 10 người dùng nội bộ, < 200 lượt mở app khách/ngày).

## 3. Giá tra được (ngày 15/10/2026)

| Nhà cung cấp (VN) | Gói | Cấu hình | Giá/tháng chưa VAT | Có VAT | Nguồn / mức xác minh |
|---|---|---|---|---|---|
| BizFly Cloud | VPS (SSD) Gói 4 | 2 vCPU / 4 GB / 40 GB SSD | 240.000 | **264.000** | [Nguồn] bizflycloud.vn/cloud-server/bang-gia – trang ghi "chưa bao gồm VAT". Vị trí trung tâm dữ liệu không ghi trên trang giá → [Chưa xác minh] là HN/HCM |
| BizFly Cloud | VPS (SSD) Gói 2 | 1 vCPU / 2 GB / 20 GB SSD | 120.000 | **132.000** | [Nguồn] như trên |
| BizFly Cloud | VPS (SSD) Gói 5 | 2 vCPU / 8 GB / 40 GB SSD | 340.000 | **374.000** | [Nguồn] như trên |
| BizFly Cloud | Simple Storage (S3) trả theo dùng | lưu trữ 864 đ/GB/tháng; truyền dữ liệu ra 280 đ/GB; tải lên miễn phí; thanh toán tối thiểu 50.000 đ | 50 GB ≈ 43.200 → áp mức tối thiểu 50.000 | **~55.000** | [Nguồn] bizflycloud.vn/s3-simple-storage/bang-gia – chưa VAT |
| Viettel IDC | T1.Base 03 | 2 vCPU / 4 GB / 20 GB SSD | 399.000 | **~439.000** | [Bên thứ ba] whtop.com (trích trong ADR-010) |
| Vietnix, AZDIGI, PA Vietnam, VNPT | gói VPS phổ thông | chưa rõ cấu hình tương đương | – | – | [Chưa xác minh] – không lấy được bảng giá chính thức (trang Vietnix không truy cập được khi tra) |
| Tên miền `.com` / `.vn` | 1 năm, chia 12 | – | – | ~30.000–70.000 | [Chưa xác minh] |
| Let's Encrypt (TLS), GitHub Actions (CI), GHCR (kho image) | – | – | 0 | 0 | Gói miễn phí; hạn mức miễn phí cho repo riêng tư [Chưa xác minh] |

Ghi chú: gói "VPS (SSD)" giá rẻ của BizFly có thể là CPU dùng chung; OPS sẽ hỏi rõ cam kết CPU, uptime (SLA), snapshot, IPv4 riêng và vị trí trung tâm dữ liệu khi xin báo giá.

## 4. Ba phương án (đều đặt dữ liệu khách tại Việt Nam – ESC-002 A)

| | **PA1 – Tối giản** | **PA2 – Đề xuất** | **PA3 – Dư dả** |
|---|---|---|---|
| Máy chính (production) | 1 VPS 2 vCPU/4 GB (BizFly Gói 4) – 264.000 | 1 VPS 2 vCPU/4 GB (BizFly Gói 4) – 264.000 | 1 VPS 2 vCPU/8 GB (BizFly Gói 5) – 374.000 |
| Staging | Chung máy chính (compose project riêng, dữ liệu giả) – 0 | 1 VPS 1–2 GB ở **nhà cung cấp VN khác** (ví dụ Viettel IDC/Vietnix) – ~130.000–200.000 [Chưa xác minh] | 1 VPS 2 vCPU/4 GB riêng – ~264.000–439.000 |
| Nơi giữ bản sao lưu (off-site, VN) | Object storage (BizFly S3) – ~55.000 | Ổ của VPS staging (khác nhà cung cấp) – 0 | Object storage + VPS staging – ~55.000 |
| Tên miền | ~30.000–70.000 | ~30.000–70.000 | ~30.000–70.000 |
| **Tổng/tháng (có VAT)** | **~350.000–390.000** | **~425.000–535.000** | **~720.000–940.000** |
| Ưu | Rẻ nhất | Sao lưu nằm ở hãng khác → một hãng sập/khóa tài khoản vẫn khôi phục được; staging tách khỏi production | Dư RAM cho R3+ (báo cáo nặng), staging giống hệt production |
| Nhược | Sao lưu cùng hãng với máy chính; staging chung máy chính (rủi ro ảnh hưởng nhau) | Hai hóa đơn, hai tài khoản | Sát trần ngân sách nếu staging chọn Viettel IDC |

Nếu INV chọn ESC-002 B (Singapore) hoặc C (lai): kiến trúc giữ nguyên, chỉ đổi nơi đặt VPS (ADR-010 "Điều kiện xem lại"); giá tham khảo ở ADR-010 (B ~0,65–1,15 tr/tháng – có thể vượt ngân sách).

**Đội đề xuất PA2.** Lộ trình chi: R2 chỉ thuê **1 VPS** (dùng làm staging với dữ liệu giả, ~264.000/tháng); khi chạy thật (sau R3, có quyết ESC-002) mới thuê thêm máy phụ.

## 5. Bố trí trên máy chủ

```
Internet ──443/80──► Caddy (TLS Let's Encrypt, web tĩnh, reverse proxy)
                      ├─► api:3000   (chỉ trong mạng Docker)
                      └─► /srv/{admin-web,mobile,guest-web}
                     worker ─┐
                     api ────┴─► postgres:5432 (chỉ trong mạng Docker, không mở ra ngoài)
                     volume tệp mã hóa (ADR-013)
```

- Tường lửa: chỉ mở 80, 443 và SSH (chỉ đăng nhập bằng khóa, tắt mật khẩu, tắt root; giới hạn IP nếu được). PostgreSQL **không** mở ra Internet.
- Tự cập nhật bản vá bảo mật hệ điều hành (unattended-upgrades); khởi động lại có kế hoạch ngoài giờ cao điểm (sau 02:00, tránh giờ nhận/trả phòng).
- DNS: dùng nhà đăng ký tên miền hoặc Cloudflare **chỉ DNS** (không bật proxy "đám mây cam" – ADR-010 mục 4, để TLS kết thúc tại máy chủ ở VN).
- Bí mật: file `/opt/ottimo/.env` quyền 600, chủ sở hữu là user chạy dịch vụ; không bí mật nào trong image Docker hay log CI. Khóa chủ `DATA_KEK_*` (ADR-013) có **bản sao ngoại tuyến do INV giữ** (ví dụ giấy niêm phong/USB mã hóa) – mất KEK = mất ảnh giấy tờ.

## 6. Triển khai và quay lui (chi tiết ở R2)

1. CI build image `api` (dùng cho cả worker) và `web` → đẩy lên GHCR, gắn tag theo commit.
2. Máy chủ: `docker compose pull` → chạy migration DB (bước riêng, trước khi bật api mới) → `docker compose up -d` → kiểm `GET /health` = 200.
3. Quay lui: giữ tag image trước; `IMAGE_TAG=<tag cũ> docker compose up -d`. Migration phải theo kiểu "mở rộng trước – thu hẹp sau" để quay lui image không cần quay lui DB.

## 7. Sao lưu, khôi phục, vòng đời log (khớp SEC T15/T16/T18)

| Hạng mục | Thiết kế đề xuất | Căn cứ |
|---|---|---|
| Sao lưu DB | `pg_dump` hằng ngày 03:30 (sau job xóa dữ liệu theo hạn 03:00) + WAL archive (khôi phục tới thời điểm, mất tối đa ~15 phút) | ADR-010 mục 3 |
| Mã hóa | Mã hóa bản sao lưu bằng `age` trên máy chủ trước khi chuyển đi; khóa giải mã do INV + OPS giữ, không nằm trên máy chủ | SEC |
| Nơi giữ | Off-site **tại Việt Nam** (PA2: VPS staging hãng khác; PA1: object storage VN) | ESC-002 A |
| Vòng xoay | **7 bản hằng ngày + 4 bản hằng tuần = tối đa 35 ngày**; WAL giữ 7 ngày | SEC **T18** (dữ liệu đã xóa biến mất khỏi backup sau ≤ 35 ngày) |
| Lệch cần ARC sửa | ADR-010 mục 3 ghi "giữ 7 ngày + 4 tuần + **3 tháng**" → **vượt T18**. OPS đề xuất bỏ bản 3 tháng (hoặc chỉ giữ nếu SEC/luật sư đồng ý, vì dữ liệu C3 đã được hủy khóa – ADR-013 – nhưng dữ liệu C2 thì không) | Thẻ review gửi ARC ở bước 3 |
| Thử khôi phục | Mỗi round: khôi phục bản mới nhất vào máy staging, chạy `/health` + đếm bản ghi; ghi kết quả vào report OPS | Checklist OPS |
| RPO / RTO | RPO ≤ 15 phút (WAL), tệ nhất 24 giờ (dump); RTO ≤ 4 giờ (dựng VPS mới + khôi phục) | ADR-010 [GIẢ ĐỊNH – OPS xác nhận khi diễn tập R3] |
| Log kỹ thuật | Ứng dụng ghi JSON ra stdout (đã che header `authorization`, `cookie`); Docker xoay vòng log theo dung lượng; bản lưu lâu dài trên máy chủ giữ **90 ngày** rồi xóa; không chứa dữ liệu C3 | SEC **T16** |
| Audit log, nhật ký truy cập C3 | Nằm trong PostgreSQL (append-only), giữ 24 tháng theo job xóa của BE | SEC **T15** |

## 8. Giám sát (R3)

- Theo dõi `/health` mỗi 1 phút từ bên ngoài (Uptime Kuma tự chạy trên máy staging, hoặc dịch vụ miễn phí – chỉ gọi `/health`, không có dữ liệu cá nhân); cảnh báo qua email/Zalo nhóm vận hành.
- Cảnh báo: đĩa > 80%, sao lưu đêm thất bại, chứng chỉ TLS < 14 ngày, `/health` lỗi 3 lần liên tiếp.
- Không dùng SaaS theo dõi lỗi nước ngoài ở MVP (ADR-010) – xem lại R3.

## 9. Việc tiếp theo

| Việc | Ai | Khi |
|---|---|---|
| Xin báo giá chính thức (có VAT, SLA, vị trí trung tâm dữ liệu, snapshot) từ ít nhất 2 nhà cung cấp VN | OPS | Đầu R2, trước khi thuê |
| INV quyết ESC-002 + duyệt chi phí hosting (ESC mới do OPS đề xuất) | INV | Trước khi OPS dựng staging R2 |
| Chọn và mua tên miền | INV (OPS tư vấn) | R2 |
| Dựng staging + deploy tự động + quản lý bí mật + migration tự động | OPS | R2 |
| Sao lưu tự động + diễn tập khôi phục + runbook + giám sát | OPS | R3 |
