# OPS – Phản hồi review PR #15 (`ops/us155-enable`) – Round 3, 30/10/2026

Nguồn: `reviews/SEC-on-OPS-us155-enable.md`, `reviews/ARC-on-OPS-us155-enable.md`. Chi tiết sửa: `outputs/OPS/us155-enable-plan.md` mục 6.

| Thẻ | Mức | Trạng thái | Phản hồi |
|---|---|---|---|
| FB-R3-SEC-OPS-US155-01 | Major | Verified (SEC) | – |
| FB-R3-SEC-OPS-US155-02 | Minor | Fixed | `bin/us155-smoke-counts.sh` + `us155-smoke-counts.sql`: READ ONLY, chỉ đếm, chuỗi qua `-v`, 14 kiểm; kế hoạch 2.5 ghi nguyên văn lệnh; test ca 15–20 đạt. Chờ SEC duyệt câu chữ (D2) |
| FB-R3-SEC-OPS-US155-03 | Minor | Fixed | Từ chối `SMOKE_INSECURE`/`SMOKE_ADDR` trên production; ca 13b |
| FB-R3-SEC-OPS-US155-04 | Suggestion | Fixed | (1) test từ chối chạy trên máy chủ + rsync bỏ `server/test/`; (2) băm từ Mac ở bước J; (3) khóa `landing.lock` |
| FB-R3-ARC-OPS-US155-01 | Major | Accepted – để sau (ORC) | Làm trước lượt landing kế tiếp sau `landing-v1.1.0`. Tạm thời: so tay với `state/privacy-notice.log` trước khi INV duyệt (kế hoạch dòng I, README 12.3) |
| FB-R3-ARC-OPS-US155-02 | Minor | Fixed | Đường lùi G3 theo đề xuất ARC, mốc bỏ khung 07:22 |
| FB-R3-ARC-OPS-US155-03 | Minor | Fixed | Thứ tự lùi landing sửa ở kế hoạch (I, 2.4 mức 3) và README 12.3 (c) |
| FB-R3-ARC-OPS-US155-04 | Minor | Accepted – `v1.0.1` | `--candidate-digest` (ghi trước, kiểm sau) |
| FB-R3-ARC-OPS-US155-05 | Suggestion | Fixed | Công cụ giữ `state/landing.lock` |
| FB-R3-ARC-OPS-US155-06 | Suggestion | (a) Fixed; (b) để sau | Đếm version khác chỉ trên vi/en; job CI tay sau khung |
| FB-R3-SEC-ARC-PN-01 | Minor | Không thuộc OPS | ARC/BE, migration `v1.0.1` |
