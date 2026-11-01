# OPS trả lời review – hạ tầng LP-v2 (`lp-v2-ops`)

- Người trả lời: OPS | Ngày: 01/11/2026 | Round 4 – gói LP-v2 – Bước: Phản hồi & sửa
- Review được trả lời: `rounds/round-04/reviews/SEC-on-LP-v2-ops.md` (SEC, kiêm ý kiến ARC mục 2.3).
- Nhánh `lp-v2-ops2` (từ `origin/lp-v2` `83c13990`). Chưa gộp `lp-v2`, chưa đụng `main`. Không SSH, không deploy.
- Chi tiết và kết quả test: `rounds/round-04/outputs/OPS/lp-v2-ops.md` mục 10.

| Thẻ | Mức | Trạng thái | Đã làm |
|---|---|---|---|
| FB-R4-SEC-OPS-LPV2-01 | Minor | Done | "0090" → `0091_lp_v2_price_estimate_locales` ở README 12.3 bước 6 (ghi theo tên tệp, nói rõ 0090 là PN-01 và số có thể đổi khi gộp), comment `publish-privacy-notice.sh` (kèm "OpenAPI 0.3.9" → 0.3.10) và `.sql`, header + test 21 của `publish-privacy-notice.test.sh`, báo cáo `lp-v2-ops.md` mục 2, 5, 7, 8. Logic không đổi |
| FB-R4-SEC-OPS-LPV2-02 | Minor | Done | (1) `deploy-landing.sh` gom các trang không có đúng một version. Proxy mở + không `--rollback` → `FAIL: privacy page without exactly one notice version … nothing switched`, dừng ở bước `privacy`. `--rollback` hoặc proxy tắt → WARNING. (2) `LANDING_LOCALES` trống → `en,vi`, như api và wrapper publish; câu báo ghi "LANDING_LOCALES (unset = en,vi)". Test: 15 (hai meta → FAIL), 15b (ko thiếu meta, deploy thật dừng ở `privacy`), 15c (`.01`), 15d (`--rollback` → WARNING), 15e (proxy tắt → WARNING), 16/16b (biến trống: image thiếu vi → FAIL, image en+vi → qua) |
| FB-R4-SEC-OPS-LPV2-03 | Minor | Done | `@public_price_estimate`: `.matches('^[!-~]{0,256}$')`. Test Caddy thêm 3 ca: 100 × "ệ" thô (102 ký tự, 302 byte) → 404; trộn `%E1%BB%87` với "ệ" thô → 404; cùng chữ mã hóa `%xx` (182 byte) → 200. Ca "bị từ chối không tới api" bao cả hai ca mới. Đối chứng: chạy test mới với Caddyfile cũ thì 3 ca FAIL |
| FB-R4-SEC-OPS-LPV2-04 | Minor | Done | `priceswitch` theo id audit: mốc ở `state/ops-check/priceswitch.last_id`, truy vấn `id > mốc` (không cửa sổ 35 phút; có `entity_type = 'config_parameter'` và giới hạn 7 ngày chỉ để bỏ qua phân vùng cũ). Có dòng mới → `notify … force`: webhook riêng mỗi lượt, bỏ khử trùng 6 giờ, câu cố định gồm số lần + giá trị mới nhất. Cập nhật mốc sau khi báo. Lần đầu chỉ lấy mốc. Mốc không bao giờ lùi. Tệp mốc không phải chữ số → coi như lần đầu, không vào SQL. Test 7–14 của `ops-check-price.test.sh`; câu SQL đã chạy trên Postgres 17 |
| FB-R4-SEC-OPS-LPV2-S1 | Suggestion | Done | `(\.[1-9][0-9]?)?` ở wrapper (tham số + đọc trang), SQL, `deploy-landing.sh`. Test 32 (wrapper từ chối `2026-11-20.01`) và 15c (deploy-landing) |
| FB-R4-SEC-OPS-LPV2-S2 | Suggestion | Deferred (lượt PN-01) | Cần image api có migration 0090 (PN-01, chưa có nhánh). Khi có: chạy lại test 23 trên DB có trigger và thêm ca UPDATE `body_sha256` bằng `ottimo_owner` → lỗi. Ghi vào việc chưa xong |
| FB-R4-SEC-OPS-LPV2-S3 | Suggestion | Done | Wrapper: không có hreflang trên `/privacy/` mà có ít nhất một trang mang thẻ `ottimo-notice-version` → từ chối ("the language manifest is missing"). Bản trước LP-v2 (en/vi, không thẻ meta) giữ hành vi cũ. Test 31 |

Rủi ro chấp nhận (mới, LPV2-04): id identity tăng theo thứ tự cấp, không theo thứ tự commit. Nếu hai giao dịch đổi công tắc chạy chồng nhau, giao dịch có id nhỏ hơn commit sau lượt kiểm thì có thể bị sót. OWN đổi công tắc bằng tay trên Desk nên trường hợp này gần như không xảy ra. Không sửa.
