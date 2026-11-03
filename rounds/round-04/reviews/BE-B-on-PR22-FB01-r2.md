# Round 4 – BE-B – Review lượt 2 (xác nhận): FB-R4-ARC-BE-A-ED-01 trên PR #22

- Vai: BE-B | Round 4 – Bước: Review (lượt 2, xác nhận) | 03/11/2026 | đợt v1.0.2
- Thẻ được xác nhận: `FB-R4-ARC-BE-A-ED-01` trong `rounds/round-04/reviews/ARC-on-PR22-v1.0.2-ed.md`
- Đã đọc báo cáo BE-A: `git show ff16c1dd:rounds/round-04/outputs/BE/v1.0.2-ed-merge-main.md`
- Cách kiểm: dùng `gh pr view/checks 22`, `gh run view 41574262425 --json jobs`, tải log job `format · lint · audit · test · build` (job 125714012645) về rồi đọc. Không checkout, không push, không gộp.

## Kết luận: **ĐẠT**. Đề nghị ARC/ORC đổi trạng thái thẻ sang Resolved.

Chủ thẻ đặt điều kiện theo phương án (a): DOM gộp PR sửa fixtures vào `main` (PR #25), BE-A merge `main`, rồi CI phải xanh trọn job trên commit gộp. Cả ba điều kiện đều đã có.

## Bằng chứng

| # | Điều kiện | Kết quả kiểm |
|---|---|---|
| 1 | CI chạy đúng commit gộp | PR #22 head = `ff16c1ddd7e2…`. Run 41574262425 có `headSha` = `ff16c1dd…`, event `pull_request`, checkout `pull/22/merge` (`daa02d4c`). `91c26e0c` có hai cha: `d91cffae` và `00881a53`. `main` trên remote hiện vẫn là `00881a53`, nên merge ref chính là cây của `ff16c1dd` |
| 2 | Job xanh | `format · lint · audit · test · build`: success (10m21s). Tám job kiểm tra còn lại cũng success: API contract, Redocly, docker build + E2E smoke, gitleaks, shellcheck, landing Playwright, no-test-endpoints. Ba job publish/deploy bị skipped, đúng với PR |
| 3 | Turbo không dừng sớm | Bước "Test (Vitest, real PostgreSQL as ottimo_app)" chạy `turbo run test` không có `--continue` hay `--filter`, ra `Tasks: 14 successful, 14 total`. Lần trước (run 41313592661) là 8/14. `@ottimo/tests` (validate-fixtures) báo "OK – 0 lỗi, 1 cảnh báo" |
| 4 | api thật sự chạy | `@ottimo/api:test` có `cache miss, executing`: 147 tệp đạt, 2 tệp bỏ qua; **3687 ca đạt**, 24 ca bỏ qua (tổng 3725). Gồm `b16-preview-v101.test.ts` (ảnh chụp 72 bảng, 18 ca), `rooms-scheduled-prices-v101`, `worker-audit-registry`, `migrations-journal`, `rls.test.ts` |
| 5 | admin-web thật sự chạy | `@ottimo/admin-web:test` có `cache miss, executing`: 66 tệp, **680 ca đạt** (680) |
| 6 | Khớp báo cáo local của BE-A | Số liệu CI trùng với bảng mục 4 trong báo cáo BE-A: 3687/24 cho api, 680 cho admin-web, 14/14 task |

## Ghi chú (không chặn, không mở thẻ mới)
- 24 ca api bị bỏ qua đều có chủ đích, do biến môi trường quyết định. Hai tệp `test/fuzz/debt-fuzz.test.ts` và `test/perf/extend-62.perf.test.ts` dùng `describe.skipIf(... !MODE / !process.env.PERF / FUZZ_*)`. Tệp `production-bootstrap.test.ts` bỏ qua 5 ca. Không có ca nào trong PR bị skip để né lỗi.
- Log Postgres ở bước "Stop containers" có ERROR (`permission denied for table approval_request`, vi phạm FK `hk_task_guest_request_fk`, `LOCK TABLE … NOWAIT`). Đây là đầu ra mong đợi của các ca âm tính (tách nhiệm vụ, khóa migration), vì các ca này đều đạt.
- Các điều kiện gộp khác ở ARC mục 7 (UXD thẻ 13–15, QA đạt lại, SEC đọc diff nếu cần) không thuộc phạm vi xác nhận này.
- Nếu `main` có thêm commit trước khi gộp, cần chạy lại CI trên merge ref mới. Kết luận này chỉ đúng cho `main` @ `00881a53`.
