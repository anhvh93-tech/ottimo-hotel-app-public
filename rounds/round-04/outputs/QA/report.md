# QA – Báo cáo Round 4 (gói LP-v2)

- Người viết: QA (ORC ghi hộ – công cụ chặn subagent ghi file này) | Ngày: 01/11/2026 | Bản kiểm: `origin/lp-v2` @ `83c13990`
- Chi tiết: `rounds/round-04/qa/lp-v2-test-report.md`, lỗi: `rounds/round-04/qa/bug-list.md`, ảnh (dữ liệu giả): `rounds/round-04/qa/lp-v2/`

## Đã làm
1. Giá web = báo giá Desk kênh Trực tiếp theo bảng giá 01/11: 13/13 ca có số lệch 0 đ; 5/5 ca không số đúng lý do; tháng, 30 đêm, "Any room" không số ở 5 ngôn ngữ; đổi giá Desk → web theo ≤ 60 giây.
2. 5 ngôn ngữ: 15 trang đúng `lang`, hreflang hai chiều, nút ngôn ngữ, không tràn 320/360/375/1024 px, axe 0; privacy có version + Δ5 L3 + consentMore "from our server"; form ko/zh/ru gửi được (202).
3. Bảo mật qua Caddy thật: SEC C8 đạt (429 từ lượt 31 cho một IP, IP khác vẫn có giá, `X-Forwarded-For` giả bị bỏ); không lộ trường cấm; công tắc tắt → ô ẩn, form vẫn gửi; `publish-privacy-notice` chạy thử 5 ngôn ngữ đạt; `deploy-landing --check-only` đạt.
4. LCP di động 0,75–0,84 s, CLS ≤ 0,0006; EN/VI tải 0 byte font Hàn/Trung.
5. Kiểm mã: vitest landing 279/279, api `lp-v2-be-units` 48/48, `check:dist` 14/14, `check-caddy-landing`, `check-compose` đạt.

## Kết luận
Đạt có điều kiện. Lỗi mới 0 P0 · 0 P1 · 4 P2 · 1 P3. AC chưa đạt: US-131 AC4 (BUG-R4-003), AC10 (BUG-R4-001), US-175 AC3 (BUG-R4-002).

## Giả định
Ngày nghiệp vụ stack 01/11, tham số "ngày chuyển S" của DOM; ESC-045 câu 1 = A, câu 3 = A (chưa INV chốt); `public_room_type` đặt bằng SQL trên stack thử (BUG-R4-004); nhãn version thông báo `2026-11-01` tạm; đo hiệu năng bằng Chromium + CDP (repo không có Lighthouse).

## Rủi ro
Chưa chạy staging; nhãn version thông báo tạm; chưa có điểm Lighthouse; nếu production không có `public_room_type` cho 10 căn thì web sẽ hiện "giá theo yêu cầu" ở mọi hạng (kiểm trước phát hành).

## Việc chưa xong
US-175 AC4–AC6; test lại khi BUG-R4-001…004 được sửa; chạy lại C8 + Lighthouse trên staging trước phát hành; C7 (nhánh Google Chat).

---

# QA – v1.0.1 smoke staging (QC ĐK5), 01/11/2026 23:43–23:58

- Bản kiểm: staging `sha-755cad1642ca` (= `main` `755cad16`). Chi tiết: `rounds/round-04/qa/v1.0.1-staging-smoke.md`.

## Đã làm
1. `smoke-prod` chỉ đọc trên staging: 9/9 (PS-06 với `qa.fd` và `qa.owner` 2FA).
2. Log worker (SSH chỉ đọc, `/opt/ottimo`): `chat: off NOT_CONFIGURED`, mức A, 20 job chạy, 0 error.
3. Desk:
   - Đăng nhập form, 8 màn chính.
   - Nhận phòng thật OTM-00377 qua 4 bước.
   - Báo giá trên Desk BG-00058, đọc chữ vi/en/ru.
   - Mở màn trả phòng OTM-00359 (không hoàn tất).
4. BUG-R4-009: 15/15 câu báo giá API đúng, Desk 3/3 đúng, trang khách en/ru/vi đúng.
5. 5xx: 0 phía trình duyệt; log api/web 30 phút cũng 0.

## Kết luận
Đạt. Lỗi mới: BUG-R4-017 (P3, có sẵn từ v1.0.0).

## File tạo/sửa
- `rounds/round-04/qa/v1.0.1-staging-smoke.md`
- `rounds/round-04/qa/bug-list.md`
- `01-decisions/decision-log.md`
- tệp này

## Giả định
- Tài khoản thử DS-E `qa.*` của staging là dữ liệu thử, không phải tài khoản thật.
- Tiền mặt ghi trên staging là bản ghi thử.

## Rủi ro
Chưa chạy trọn trả phòng B18 trên image này. v1.0.1 không đổi mã trả phòng, ngoài chữ bill OTA.

## Việc chưa xong
- Trả phòng OTM-00377 ngày 02/11.
- `smoke-prod` trên production sau Release (ĐK6).

---

# QA – v1.0.3 smoke staging giao diện (email nhận thông báo bảo mật), 03/11/2026 22:57–23:08

## Đã làm
- Desk staging `sha-da6d6f3dc22b` (1440×900) và PWA staging (390×844), Chromium Playwright, tài khoản `qa.*`, chỉ địa chỉ `qa.*@example.test`.
- Kiểm menu và trang "Bảo mật tài khoản" VI/EN, khối email, banner nhắc; đặt/đổi/xóa qua S2; OWN ở Người dùng & vai (UI + 2 ca API âm); HK tự đặt email (BUG-R4-018); thông báo PWA (BUG-R4-021).
- Chụp và kiểm che 6 ảnh sổ tay: C0-06, G1-01, C1-07, C0-12, C0-13, C1-22.

## Kết luận
**ĐẠT.** Mới BUG-R4-023, BUG-R4-024 (P3). Lỗi `info@` không kiểm được trên staging (không có `EMAIL_FROM`), chuyển sang smoke production. Banner gộp không dựng được vì `MFA_ENFORCED=true`.

## File tạo/sửa
- `rounds/round-04/qa/v1.0.3-staging-smoke.md`
- `rounds/round-04/qa/bug-list.md`
- `product/docs/manual/img/C0-06.png`, `G1-01.png`, `C1-07.png` (chụp lại), `C0-12.png`, `C0-13.png`, `C1-22.png` (mới)
- tệp này

## Giả định
- Staging không đặt `EMAIL_FROM` (suy từ hành vi: `info@example.test` và `info@ottimo.vn` đi tới S2 và ra 401). Khớp ARC v1.0.3-tech-plan dòng 113.
- Email giả dạng `qa.*@example.test` thay cho `name@example.com` của hướng dẫn chụp (ORC yêu cầu).

## Rủi ro
- Câu `EMAIL_SHARED_MAILBOX` chưa chạy trên máy chủ thật. Mã đã đạt trên stack thử.

## Việc chưa xong
- Smoke production: thử `info@ottimo.vn` với mật khẩu S2 sai.
- Chụp lại C1-07, C1-22 sau khi sửa BUG-R4-023.
- D3 phần Desk v1.0.2 sau khi lùi: chờ QC quyết.
