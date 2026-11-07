# ARC review PR #153 (BE-D) – T58-17: cửa sổ so mật khẩu Wi-Fi/đăng nhập là ngày UTC (chỉ test)

- Round 5 (v1.0.5), bước **Review** kỹ thuật, kiểm nhẹ. Người review: ARC. Ngày 07/11/2026.
- PR: [#153](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/153), nhánh `r5-t58-17`, HEAD **`38364f0e`** (draft, `base = main`). Một tệp: `services/api/test/integration/v5-58-property-wifi.test.ts`, +40/−2. Không `src`, không migration, không đổi hợp đồng.
- Đối chiếu hợp đồng `contract-0.3.13.md`:
  - 1.28 (bổ sung 1g, BE C0313-27): "Cửa sổ = ngày UTC (`window_start` 00:00Z)… thêm T58-17";
  - 1.25 dòng T58-17: "5 lần so lúc 06:50, lần 6 lúc 07:05 giờ Việt Nam → lần 6 có so; dòng mới `window_start` = 00:00Z, đếm = 1";
  - đoạn ghi chú 1g: `expires_at` = +24 giờ.
- Cách kiểm:
  - Worktree `arc-153-wt` trong scratchpad; PostgreSQL 17 riêng (container `arc-149-pg`, `127.0.0.1:55617`, mật khẩu CI công khai);
  - cả hai được xóa khi ARC xong đợt review này; không push vào nhánh PR.

## Kết luận: **DUYỆT @ `38364f0e`**

Không cần thêm gì. Không thẻ mới, không ESC.

| Điều 1.25/1.28 đòi | T58-17 kiểm | Khớp |
|---|---|---|
| Đồng hồ thử, 5 lần so lúc 06:50 giờ VN (= 16/10 23:50Z) | 5 lần PUT lúc `2026-10-17T06:50+07:00`, mỗi lần 200 và bộ đếm = 1…5 | Có |
| Lần 6 lúc 07:05 giờ VN (= 17/10 00:05Z) **có so** | Lần 6 gửi đúng mật khẩu đăng nhập của MGR → 422 `NOT_ALLOWED`, 1 audit `property.wifi_password_matches_login`, 0 `…_check_skipped`. Chỉ khi có so mới ra được kết quả này | Có |
| Dòng mới `window_start` = 00:00Z, đếm = 1; `expires_at` = +24 giờ | `rate_limit_counter` có đúng 2 dòng: `[16/10 00:00Z, 17/10 00:00Z, 5]` và `[17/10 00:00Z, 18/10 00:00Z, 1]` | Có |
| Không lộ mật khẩu thử (T58-16) | 5 chuỗi `<wifi-password-edge-n>` được thêm vào danh sách bí mật của ca T58-5 + T58-16 | Có |

- Người dùng thử riêng `mgr2` giữ bộ đếm sạch, không dính lần so của T58-11/12 (đang dùng `mgr`).
- Mật khẩu là chuỗi giữ chỗ và `TEST_PASSWORD` của fixture. Không có giá trị thật.
- Chọn 06:50 và 07:05 là mốc tốt: cả hai cùng **ngày lịch VN** và cùng **ngày kinh doanh** (sau mốc 06:00), chỉ khác **ngày UTC**. Vì vậy ca này phân biệt được ba cách cài cửa sổ.

Đột biến ARC, mỗi lần một chỗ trên `callerPasswordWindowStart` (`identity/public/caller-password-match.ts`), chạy tệp test (cơ sở 13/13):

| # | Đột biến | Kết quả |
|---|---|---|
| W1 | Cửa sổ = ngày lịch Việt Nam (00:00 +07) | **Chỉ T58-17 đỏ**, 12 ca khác xanh |
| W2 | Cửa sổ = ngày kinh doanh (06:00 +07) | **Chỉ T58-17 đỏ**, 12 ca khác xanh |

Cùng kết quả với đột biến BE-D đã chạy (T58-11 vẫn xanh). Chạy thêm:
- `prettier --check` và `eslint` trên tệp: sạch;
- `git merge-tree` với `main` @ `8598bb5a`: không xung đột;
- CI lúc viết: 8 job xanh, trong đó có `format · lint · audit · test · build` và `confidential paths`; còn `docker images build · E2E smoke` đang chạy. ORC gộp khi job này xanh.

Dòng đề xuất cho `01-decisions/decision-log.md`:

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC duyệt BE-D #153 @ `38364f0e` (chỉ test): T58-17 khớp hợp đồng 1.25/1.28 (BE C0313-27). 5 lần so lúc 06:50 giờ VN, lần 6 lúc 07:05 có so (422 `NOT_ALLOWED` với mật khẩu đăng nhập), `rate_limit_counter` 2 dòng theo ngày UTC, `expires_at` +24 giờ. Đột biến ARC "cửa sổ theo ngày lịch VN" và "cửa sổ theo ngày kinh doanh 06:00" đều chỉ làm đỏ T58-17. Không cần thêm gì, không thẻ, không ESC | ARC | rounds/round-05/reviews/ARC-on-be-d-pr-153.md |
