# Kiểm lại lần 2 – chấm lại cổng QC Sprint 3 sau vòng sửa 9, 9b, 9c (QA)

- Người làm: QA
- Ngày: 17/10/2026, 15:00–15:40
- Bản kiểm: **HEAD `fe4b166`**, CI **39015560449** xanh
- Chi tiết từng lỗi: `qa/bug-list.md` mục 9
- Lượt trước: `qa/s3-retest.md` (`9e9fd64`), `qa/bug-list.md` mục 8 (vòng 9 trên cây làm việc)

## 1. Đã kiểm gì, bằng cách nào

| Nguồn | Kết quả |
|---|---|
| CI 39015560449 (push `fe4b166`) | 7 job chạy đều xanh. `publish images` và `deploy staging` bỏ qua theo thiết kế (chưa có staging) |
| Job E2E của CI 39015560449 | **1.786 đạt, 0 trượt, 0 flaky, 0 lần chạy lại**; 82 bỏ qua có chủ đích. 3 ca `test.fail` đã biết (TC-L3-011/032/074 – BUG-R2-038/033/054) vẫn "đúng dự kiến" |
| Các bước kiểm trong CI | 9 ca bước ghi bấm thật xanh: 8 ca trong `WRITES` + ca KB7. Bước "UI cases ran": 49 ca UI, 2 bỏ qua được phép, axe 13 ca. `check-compose.sh`: "one keyring for api/worker/seed in dev + demo" |
| Ca bấm thật ngoài repo, chạy trên stack QA `ottimo-qa-s3` | Ảnh dựng từ `cc8c875`. Mã các màn liên quan không đổi tới `fe4b166`, chỉ thêm chuỗi. 2 lượt `--retries=0`: **BUG-R2-072 đạt**, **073 (b) đạt**, **075 tái hiện** |
| Unit admin-web trên HEAD | `problem`, `guest-picker-race`, `s3-fix9`, `checkout`: **32/32** |
| `gen_traceability.py --strict` | exit 0: 420 TC, 251/251 AC R2. Chạy với `backlog.md` đã commit (xem mục 4) |

**Không làm được:** môi trường từ chối `docker build`, nên QA không dựng được ảnh từ `fe4b166` để tự chạy lại các ca bước ghi. Bằng chứng cho các ca này là CI. QA không đụng bản demo và stack `ottimo-fe07` của FE.

## 2. Kết quả

**Đóng 10 lỗi:**

| Mức | Lỗi |
|---|---|
| P0 | BUG-R2-065, BUG-R2-066 |
| P1 | BUG-R2-067, 068, 069, 070, 071 |
| P1 (mới) | **BUG-R2-084**: KB7 – trả phòng sau giờ ân hạn, vào thẳng H16. UXR tìm ra khi đi lại 17/10 chiều. Sửa ở `fe4b166`, có ca chống tái phát TC-L4-096 |
| P2 | BUG-R2-072, BUG-R2-073 |

**Dời:** BUG-R2-074 (P2) → **Deferred**, S4-45.

**TC-L3-076:** lần đỏ ở CI 39010774166 có hai nguyên nhân thật trong sản phẩm, đều đã sửa ở `fe4b166`. Chi tiết ở BUG-R2-071.
- Ô chọn khách đua với kết quả tìm kiếm: bấm trúng "Tạo nhanh khách" thay vì khách vừa tìm ra.
- `effectiveFrom` lấy ngày của máy thay vì ngày nghiệp vụ.

Unit `guest-picker-race` giữ lớp lỗi này. TC-L3-076 sau khi FE neo locator không còn bắt được lỗi đua.

**Nhóm UXR #11 (075…082):** vòng 9/9c không sửa mục nào.
- 075 tái hiện được.
- 082 rộng hơn ghi lúc đầu: 4/5 nút preset ở bước Phụ phí sai mã danh mục. Mock FE dùng mã cũ nên unit vẫn xanh.
- Chỉ 077 có mục S4 (S4-44). Còn lại 075, 076, 078, 079, 080, 081, 082 → **ORC thêm mục S4**. 076, 080, 081 chờ UXD/PO.

**BUG-R2-083 (P0): giữ Open, chờ SEC xác nhận FE-07.**
- Đã vào các bản sửa: 9b BE (SEC Verified phần BE), 9c BE-54/55/56 + visa, 9c FE-07. TC-L3-077 xanh ở CI.
- Phần còn lại thuộc S4-39.

**Mã TC mới: TC-L4-096** (E, US-036/AC1). Ca KB7 trong `e2e/ui-clock/checkout.h16.spec.ts` đã đổi tên. Đã thêm vào `r1-main-flows.md` v0.3.12, danh sách `WRITES` của `ci.yml` và `traceability.md`.

## 3. P0/P1 còn mở sau chấm lại

| BUG | Mức | Nội dung | Ngoại lệ, hạn |
|---|---|---|---|
| 056, 057, 058, 059, 060, 061 | P0 | Sai tiền đã biết | Ngoại lệ dòng 593 (1). Sửa trước cổng QC Sprint 4. 060 còn chờ DOM |
| 083 | P0 | C3 – bỏ người khỏi đoàn | Chờ SEC xác nhận FE-07 (SEC-G1 a). Chặn dữ liệu khách thật |
| 055 | P1 | Tiền, đổi đơn trả 500 | Ngoại lệ dòng 593 (1) |

**Không còn P0/P1 nào từ UXR #1–#7.**

## 4. Rủi ro và việc cho vai khác

- **ORC/PO – CI sẽ đỏ khi commit backlog EP19 như trên cây làm việc.**
  - Vì sao: `gen_traceability.py` đọc cột Round "R2 – LP-v1" thành R2. US-146…153 (Must) chưa có TC, nên `--strict` exit 1. Đây là job "API contract".
  - Cách xử lý: đổi cột Round, hoặc giao QA cho bộ sinh coi "R2 – LP…" là luồng riêng.
  - Vì vậy `traceability.md` lần này sinh từ `backlog.md` đã commit.
- **ORC:**
  - Thêm mục S4 cho 075, 076, 078, 079, 080, 081, 082.
  - UXR đi lại KB7 trên bản dựng mới; bỏ bước 0 của guide v1.2.
  - Khoảng 10 điểm "mới" của UXR (`demo-1-limits.md` mục C) chưa vào sổ lỗi. Theo đọc mã của QA, không điểm nào là P0/P1. QA sẽ ghi khi nhận danh sách và ảnh.
- **Máy chạy:** 3 stack QA cũ `ottimo-qa-s3a/b/c` đang khởi động lại liên tục. Môi trường không cho QA dừng chúng; cần chủ máy hoặc ORC dừng.

## 5. Bổ sung 17/10 ~15:55–16:20 – cổng QC bản 3 (ĐK-S3-12, ĐK-S3-3 bản 3, ĐK-S3-13)

Chi tiết: `qa/bug-list.md` mục 10.

| Việc | Kết quả |
|---|---|
| ĐK-S3-12 – BUG-R2-083 | **Closed** (P0). Căn cứ: SEC 9.6 f (FE-07 Verified, SEC-G1 a ĐẠT, đồng ý đóng) + QA đọc log CI 39015560449 (`fe4b166`): TC-L3-077 ✓, `registration-party-removal` 12/12, `registration-flow` 22/22 trên PostgreSQL thật; đọc mã `onPartyMemberRemoved`. Phần còn lại → **BUG-R2-085, P1, Open, S4-39** (hạn trước cổng QC Sprint 4 – SEC-G1 b) |
| ĐK-S3-3 bản 3 – điểm UXR mới | N1–N6 → BUG-R2-086…091; 12 dòng "mới" khác của limits mục C → 092…103. P2: 087, 089, 090, 093, 101, 102; P3: còn lại. Không hạ mức; nâng N2, N4, N5 P3 → P2 |
| ĐK-S3-13 – truy vết | `gen_traceability.py`: cột Round "R2 – LP-v1" = luồng riêng (mục 9 của `traceability.md`, cờ `--strict-track`). `--strict` exit 0 (AC 251/251; trước sửa: exit 1, 251/287). `traceability.md` sinh lại |
| Job CI "API contract" ở máy | spec validator OK (2 tệp) · `gen_traceability.py --strict` exit 0 · `gen_rbac_cases.py --check` up to date – **xanh** |

**P0/P1 còn mở thay bảng mục 3:** P0 – 056…061 (ngoại lệ tiền); P1 – 055 (ngoại lệ tiền), 085 (S4-39). Dòng 083 ở bảng mục 3 đã hết hiệu lực.
