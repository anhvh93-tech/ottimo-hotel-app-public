# Báo cáo OPS – Round 5, Gói 0 (ĐK-8 và việc vận hành v1.0.5), bước Sản xuất (06/11/2026)

ORC lưu tệp này từ báo cáo bàn giao của OPS (subagent không ghi tệp báo cáo).

## 1. Đã làm gì
- **ĐK-8:** trả lời đủ thẻ SEC 06/11 trên `main` (`a26804f6`, `c224f0e8`, `3027ab01`).
- **Ba PR chờ SEC + ARC review** (OPS không tự gộp):
  - #92 `r5-ops-caddy`: V5-67, Caddy landing bỏ `Authorization`;
  - #93 `r5-ops`: V5-73, V5-62, V5-65, V5-63, thẻ ARC-07, ARC-08;
  - #95 `r5-ops-runbooks`: runbook v1.0.5 r0 (V5-70, có bước gỡ khóa V5-65) và runbook "VPS mới" (V5-64).
- **Giờ sao lưu** (đọc từ repo, không cần kiểm thêm trên máy chủ):
  - production: `ottimo-backup@ottimo-prod.timer` lúc 03:00, lượt hai 15:00;
  - staging: `ottimo-backup.timer` lúc 03:30, lượt hai 15:30;
  - mỗi môi trường đúng một timer; khoảng cách 12 giờ.
- **V5-63** (PR #93):
  - log container sang `journald`, giữ 90 ngày;
  - `ops-check journal` (ARC-07): FAIL/WARN, kiểm nhóm `docker`;
  - Postgres `log_error_verbosity=terse` (ARC-08).
- **Kiểm:**
  - test infra cục bộ xanh; chạy trên mã cũ thì đỏ đúng chỗ;
  - CI job `infra scripts` của #93 xanh;
  - test API `reservation-list` đỏ một lần rồi xanh khi chạy lại (nghi chập chờn, ARC xét).
- Không SSH, không đổi gì trên máy chủ.

## 2. Con số "máy chủ mất hẳn"
Tính từ bản mới nhất trên Mac. Đã ghi ở mô tả PR #93, `product/infra/server/README.md` mục 7, `product/docs/hosting-plan.md` mục 8.

| Lịch | Tối đa | Khi kéo khoảng 19:00 |
|---|---|---|
| Trước v1.0.5, kéo tay 2 ngày một lần | 72 giờ | 64 giờ |
| Từ v1.0.5, kéo tay 2 ngày một lần | 60 giờ | khoảng 52 giờ |
| Mac tự kéo hằng ngày | khoảng 36 giờ | – |

## 3. Thẻ đã trả lời
- 054-01: Done.
- 054-02…06: Deferred → B-OPS.
- OR-01: Closed.
- OR-02: Open, chờ chủ đầu tư.
- OR-03: phần code Done; phần máy chủ làm ở W0.
- OR-04 → V5-63: đã làm.
- S6D-01: Done.
- FB-R5-SEC-ARC-07: Resolved (ý 1 Deferred).
- FB-R5-SEC-ARC-08: Resolved.
- FB-R5-SEC-ARC-09: OPS xác nhận giờ; chờ ARC sửa contract mục 1.14 và G7.

## 4. Việc trên máy chủ (cửa sổ bảo trì, cần chủ đầu tư đồng ý)
Không chạy trong 02:55–03:45 và 14:55–15:45.
- W0: gỡ khóa người `ottimo-ops`; làm trước P2b.
- P2b: làm mới gói `infra/` trên cả hai stack.
- W1: cài timer sao lưu, trước 15:00. Cài sau 15:00 thì một lượt chạy ngay, vì `Persistent=true`.
- W2: dựng lại container landing.
- W3: kiểm qua edge thật trên staging.
- W4: dọn `.env` staging.
- W5: mask `fwupd`.
- W6: chuyển log sang journald: staging, rồi production, rồi edge. Desk mất vài giây khi Postgres khởi động lại.
- W7: chạy `ops-check` đủ mục bằng `systemd-run` có nhóm `systemd-journal`.
- M4d: chạy trước lượt tính lại V5-17.

## 5. Giả định
- 15:00 cho production: chia đều 12/12, tránh giờ nhận phòng 14:00.
- Bản giữ theo tuần giữ tới 33 ngày, để mọi tệp vẫn dưới 35 ngày khi lỡ hai lượt.
- Ngưỡng `ops-check backup` 14 giờ.
- `SystemMaxUse=4G` là số đầu; đo lại 7 ngày sau W6.
- `ForwardToSyslog=no`; `RateLimitBurst=20000`/30 s.
- Câu đếm M4d là nháp, chờ SEC.
- "RPO 12 giờ" chờ chủ đầu tư xác nhận ngày 20/11.
- Hai stack dùng chung user `ottimo` và một `authorized_keys`; W0 bước 2 kiểm lại trước khi gỡ.
- ESC mới: không có.

## 6. Rủi ro / vướng mắc
- `id_hash_key` chưa có bản ngoại tuyến. Đề xuất cho SEC + ARC: chủ đầu tư giữ thêm bản này cạnh KEK. Mất hẳn VPS thì chỉ mục mù không khớp dữ liệu cũ tới khi băm lại.
- ARC-08 còn hai chỗ hở nhờ SEC xét: câu lỗi chính vẫn có thể chứa giá trị; dòng `STATEMENT` in nguyên câu SQL (`log_min_error_statement=panic` chưa thêm).
- Runbook VPS mới chưa diễn tập.
- Trên VPS hiện tại, `ops-check sshkeys` và `journal` sẽ FAIL tới khi làm W0 và W6.
- Chữ "14:00" ở sổ vận hành, release-notes, esc-pending: đã sửa thành 15:00 (BA `16eaa635`, ORC `d93d3e7c`, `1fbd6039`).

## 7. Việc chưa xong
- Ô `⟨CHỜ⟩` của runbook: điền lúc cắt bản.
- Đo `SystemMaxUse` 7 ngày sau W6.
- OR-L1 (khóa `.env` trùng): ngoài việc được giao, chưa làm.
- Việc trên máy chủ ở mục 4.

## 8. Cập nhật 06/11 tối – Phản hồi & sửa sau review ARC và SEC (#93, #95)
ORC lưu từ báo cáo bàn giao của OPS.
- **PR #93** (`r5-ops`, HEAD `59216001`):
  - đã sửa ARC OPS-06 và SEC 93-01, 93-02, 93-03;
  - CI xanh toàn bộ, MERGEABLE;
  - SEC duyệt có điều kiện, điều kiện đã đáp ứng.
- **PR #95** (`r5-ops-runbooks`, HEAD `bd175b80`):
  - runbook v1.0.5 và runbook VPS mới lên bản r1;
  - đã sửa ARC 01–05, 07 và SEC 95-01…07;
  - CI xanh toàn bộ, MERGEABLE;
  - chờ SEC và ARC đọc lại phần sửa (ORC đã giao 06/11).
- **Thứ tự gộp:** #93 trước #95. #95 gộp sau #94 (thứ tự ARC đề xuất).
- **Câu xin đồng ý mẫu theo đợt:** ở runbook r1 mục 0.2.
  - Đợt A: staging.
  - Đợt B: production, gồm W0, W5, P2.
  - Đợt C, P3–P5: chỉ sau khi diễn tập khôi phục V5-61 ĐẠT (QC R4 ĐK-2, SEC 95-02).
  - K: chạy riêng.
  - ORC dùng đúng câu mẫu khi xin chủ đầu tư; mỗi đợt xin riêng, đồng ý cho staging không thay cho production.
- **Việc chuyển:**
  - SEC 95-02 ý 4 → PO ghi vào plan ĐK-2: V5-61 chưa đạt thì v1.0.5 chưa lên production.
  - SEC 95-07 → ORC theo dõi khi cắt bản.
