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


## Runbook LP-v2 r2 → r2.2 (chép từ runbook mục 9 khi gộp nhánh `lp-v2-ops-runbook-r2`, 04/11)

**Trả lời thẻ r1.1 (OPS; ORC chép vào `responses/OPS-LP-v2.md` khi gộp – lượt này chỉ sửa tệp runbook)**

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-LPV2RB-01 | Done | P0 dòng D1: "Thẻ 01–03 Closed: SEC mục 8.1. CI PR: số run + `headSha` = đầu PR (QC G1) trong decision-log" |
| FB-R4-SEC-OPS-LPV2RB-02 | Done (phần runbook); Deferred v1.0.4 (README 12.3, chú thích `privacy.ts`) | Mục 0 "Nhãn thông báo" (a)/(b), 0.1 `⟨NOTICE_V⟩`, `CHKV` đọc `CONST_ROWS` trên DB đích và chọn luật, P5, 5.2 bước 4(a) không đổi hằng, không Release api. README/`privacy.ts` sửa ở lần chạm tệp kế tiếp (v1.0.4), như SEC đề xuất, để không đổi đầu PR #34 |
| FB-R4-SEC-OPS-LPV2RB-03 | Done | `CHKV` so `RA_IMAGE` (`sha-` + 12 ký tự commit của `RA`) với `RUN_TAG`. S4/P10: `RUN=DOC` đọc `state/current_tag` trong cùng lệnh. 0.2/P4: `RUN=⟨TAG_L⟩`. Ô D2 lấy kết quả P10 bước 0 |
| FB-R4-SEC-OPS-LPV2RB-04 | Done | (a) P1 bỏ `CO` điền sẵn, `CO` chỉ khi INV xác nhận phòng Chat/webhook không đổi từ 03/11, đổi thì `CHUA` + làm lại K1. (b) S0b: kích thước webhook staging + so byte với production (không in URL), hoặc INV xác nhận phòng thử |
| ARC Q2 (T1) | Done | 5.4 bước 2: bất biến + (i) trước mốc 7 ngày / (ii) quá mốc giữ landing LP-v2, `LANDING_PUBLIC_API=off`, báo INV |
| ARC Q3 (T1) | Done (giữ nguyên) | Giữ `LIKE`. Không dùng câu `regexp_matches` (ARC để OPS chọn): K2 dòng 2–3 đã khóa đúng byte 0092, và câu mới chưa chạy thử trên PostgreSQL thật |

**Trả lời thẻ r2 (SEC mục 9.4 + ghi chú ARC; r2.1)**

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-LPV2RB-05 | Done (phần runbook); Deferred v1.0.4 (README 12.3) | Mục 0 (b) và 5.2 bước 4(a): **dừng nếu** decision-log chưa có dòng SEC duyệt chữ `⟨NOTICE_V⟩` mới, ghi rõ "Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4". Mục 7 thêm dòng 5.2. Phần README 12.3 đã vào việc v1.0.4 (ORC, `plan-v1.0.4.md`) |
| FB-R4-SEC-OPS-LPV2RB-06 | Done | 5.4 bước 2: mở lại proxy chỉ khi K1 thấy api LP-v2 (`current=⟨TAG_L⟩` hoặc mới hơn) **và** `LANDING_LOCALES` đã về 5 ngôn ngữ (F1); bỏ vế "hoặc sau khi đã chọn 5.2 bước 4 (a)/(b)". Nhánh (i) tới mốc 7 ngày mà app vẫn v1.0.3 thì chỉ làm 5.2(b). 5.2 bước 4(a) ghi "chỉ khi api đang chạy là LP-v2". 5.4 bước 4 có K5 theo nhánh: (i) 200, (ii)/5.2(b) 404 HTML. Mục 7 thêm dòng 5.4 |
| FB-R4-SEC-OPS-LPV2RB-07 | Done | S0b in `STG_SAME_AS_PROD_RC=$?` của `cmp`: 0 trùng → dừng (khi kích thước > 0); 1 khác → hỏi INV; khác 0/1 hoặc `STG_WEBHOOK_SIZE=ERR` → `ERR`, chỉ còn câu hỏi INV. Kích thước 0 → đạt, bỏ qua `RC` |
| FB-R4-SEC-OPS-LPV2RB-08 | Done | `CHKV` in `ENV=` và `ROWS=` (tổng số dòng nhãn đọc được). Production `ROWS=0` → `KHONG`. Hằng phải đúng dạng `YYYY-MM-DD` (không hậu tố), nhãn đúng dạng `YYYY-MM-DD[.N]`, N = 1–99, như `deploy-landing.sh`. Thử lại 13 ca (bash, zsh) |
| ARC – 5.4 (ii) "Đúng là" | Done | Lệnh `deploy-landing.sh ⟨TAG_L⟩ --no-pull` có lọc dòng; "Đúng là": `privacy: … (same bytes as published)` 5 ngôn ngữ, có thể có `WARNING` (proxy tắt nên kiểm trang chỉ ra WARNING), không `FAIL`, `OK: landing ⟨TAG_L⟩ is live`, `MA THOAT: 0` |

**Trả lời thẻ r2.1 (SEC; r2.2)**

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-LPV2RB-09 | Done | `CHKV`: `E=${E%/}` ngay sau khi đặt `E`; `case "$E"` chỉ nhận `/opt/ottimo-prod` (đòi `ROWS≥1`) và `/opt/ottimo` (nhận `ROWS=0`), giá trị khác ra `KHONG` cả khi `ROWS≥1` (chặt hơn thẻ một chút). Bảng 12 ca ở mục "Sửa r2.2"; ca `/opt/ottimo-prod/` + `ROWS=0` từ `CO` (r2.1) thành `KHONG` |
