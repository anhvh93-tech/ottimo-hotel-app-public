# OPS phản hồi – SEC review PR #78 (`v104/ops-demo-seed-fixes`, seed/smoke demo P-1…P-5)

- Tác giả: OPS · Round 4 (v1.0.4) · bước **Phản hồi & sửa** · 05/11/2026
- Trả lời: `rounds/round-04/reviews/SEC-on-v104-pr78-demo-seed.md` (SEC ĐẠT, rủi ro Low, chấp nhận P-3; 2 Minor, 2 Suggestion).
- Tệp sửa: `product/infra/demo/seed-demo.mjs`, `product/infra/demo/smoke-demo.mjs`, `product/infra/demo/lib.sh`. Không sửa mã sản phẩm. Không dựng lại stack (ORC yêu cầu chỉ kiểm tĩnh).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-PR78-01 | Done | Đầu `seed-demo.mjs` và `smoke-demo.mjs`, trước mọi request: kiểm `new URL(DEMO_API_URL).hostname` thuộc `127.0.0.1`, `localhost`, `[::1]`, `::1` (cổng nào cũng được). Không thuộc thì in một câu, chỉ in tên máy (không in cả URL) và `exit 2`. Đã thử offline: `https://staging…`, `http://localhost:3100@evil…` (userinfo), `127.0.0.1.example.test`, chuỗi không phải URL đều bị từ chối, exit 2; `127.0.0.1:3414`, `localhost:3100`, `[::1]:3100` đều qua. Không thêm kiểm ở `lib.sh`: `case` của shell không đọc được dạng `localhost:x@host`, và chỉ hai script node gửi request tới `DEMO_API_URL` |
| FB-R4-SEC-OPS-PR78-02 | Done | Khối tắt `qa.*` (tắt, đọc lại, dừng nếu còn tài khoản bật) chuyển lên **đầu** `phaseNow`, ngay sau vòng đăng nhập 8 vai. Thêm phần tùy chọn: `lib.sh` có `stop_and_die`. Khi script pha 1 hoặc pha 2 lỗi, `lib.sh` chạy `dc stop api worker web` rồi mới `die`, kèm câu hướng dẫn chạy lại `demo-reset.sh`. Pha 1 cũng dừng vì api pha 1 có endpoint kiểm thử và đồng hồ giả |
| FB-R4-SEC-OPS-PR78-03 | Done | Nhánh "Đã cấu hình" trong `demo-accounts.md` thêm câu: demo được lên lịch sẵn nên dùng ngay; bản thật nhập/đổi hôm nay thì từ ngày kinh doanh sau mới có hiệu lực; ngày tạo trong lịch sử là ngày của đồng hồ giả |
| FB-R4-SEC-OPS-PR78-04 | Deferred | Theo ORC, dời sang v1.0.5: `qaActive` đọc theo `page.nextCursor`, hoặc ném lỗi khi `nextCursor` khác null. Hiện có 21 tài khoản, `limit` 100 |

Kiểm tĩnh, đều sạch:
- `prettier --check` và `eslint` (cấu hình `product/eslint.config.js`) trên 2 tệp `.mjs`;
- `node --check` cả hai tệp;
- `bash -n` 4 tệp `.sh`;
- `shellcheck -x -S warning` (v0.10.0, image đã có sẵn trên máy, chạy `--network none`) trên `demo-up.sh`, `demo-reset.sh`, `demo-down.sh`, `lib.sh`.

Nhánh đã merge `origin/main` `7f0ef3fb` (gồm #76, sửa 2 ca `v104-holds-feb` chạy ban đêm).
