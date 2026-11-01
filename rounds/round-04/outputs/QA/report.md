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
