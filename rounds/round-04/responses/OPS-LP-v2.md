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

## Runbook LP-v2 r2.3 – sau phát hành (06/11, SEC `SEC-on-lp-v2-s4-hashes.md`)

- Người trả lời: OPS | Ngày: 06/11/2026 | Round 4 – gói LP-v2 – Bước: Phản hồi & sửa. Chỉ sửa chữ `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` (r2.3), không đổi lệnh `CHKV` hay script.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-LPV2S4-01 | Done | S4: "phải trùng băm của image và của S4". 5 băm S4 là băm trang trong image landing sẽ lên production; kiểm thêm landing staging chạy đúng digest sẽ phát hành; 5 băm S4 là mốc so của P10. Ghi 5 băm lượt 06/11 (en `f593b94ea33a`, vi `9d7bffa853fe`, ko `a9bccbb8341b`, zh `1ab9efad8c34`, ru `43e080ce6503`; image `sha-6414be25f20d`, `6f224ed3…8a3d`) theo SEC mục 3 điều kiện 1. Không dựng lại landing ở máy khác trong lượt (điều kiện 4). P10: trùng S4 từng ký tự, lệch một trang thì dừng, không `--apply` lại cùng nhãn, báo SEC (điều kiện 3). Mục 7: dòng S0–S8 và dòng P10 viết lại như trên. Băm FE-B chỉ còn là tham chiếu bản dựng thử. Lượt 06/11 đã đạt theo đúng luật mới: 5 băm P10 trùng S4 (biên bản P10) |
| Ghi nhận SEC (phông `fonts-ru.*.css`) | Chuyển FE | Không thuộc OPS. Nếu FE sửa, trang ru đổi byte, nên cần nhãn thông báo mới và SEC xét trước khi đăng (đúng ghi chú SEC). Runbook không đổi |
| QA BUG-R4-055 (câu kiểm S0 cho OPS) | Done | S0 thêm `SELECT count(*), count(public_room_type), count(DISTINCT public_room_type) FROM room;`, kỳ vọng `11\|10\|4` hoặc `10\|10\|4`, khác thì dừng trước S6. Mục 7 dòng S0–S8 có điều kiện này |

## Sao lưu ngoài máy OR-01 + staging OR-L3 (06/11, SEC `SEC-on-bug-r4-054.md` Phần B)

- Người trả lời: OPS | Ngày: 06/11/2026 | Round 4 – Bước: Phản hồi & sửa (trước khi đóng round). Không chạy `pull-backups.sh` thật (ORC đã kéo khoảng 19:00), không đụng production.
- Sửa: `product/infra/server/bin/pull-backups.sh`. Test mới: `product/infra/server/test/pull-backups.test.sh`. CI: job `infra-scripts`. README: dòng "Bản sao lưu ngoài máy" (bảng vận hành) và 12.3 điểm 5, (e).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-OR-01 | Done | (1) Lượt kéo dùng `rsync -rt --ignore-existing`, vẫn không `--delete`: tệp đã có trên Mac, kể cả `.sha256`, không bao giờ bị thay. (2) Làm cả phần tùy chọn của thẻ. Trước khi kéo, script chạy `rsync -rtn --checksum --itemize-changes` (chạy thử, chỉ đọc; `rrsync -ro` nhận `-n` và `-c`) và so **nội dung** mọi tệp cùng tên. Nếu khác, mỗi tệp in một dòng `WARNING: server copy changed: <tên> – local copy kept`, thêm một dòng "báo OPS + SEC". Script vẫn kéo tệp mới và kiểm checksum, rồi thoát 3. Ghi đè cùng cỡ và giữ giờ sửa cũng bị bắt. Chỉ đổi giờ mà không đổi nội dung thì không báo. (3) `.last_pull` chỉ ghi khi thoát 0 (trước đây ghi cả khi checksum lệch, cũng là ý OR-02 điểm 1). (4) Không liệt kê được máy chủ (mất kết nối, rrsync từ chối) thì thoát 2 và không kéo gì. Trước đây script trả mã của rsync, ví dụ 255. (5) Lệnh nhận diện openrsync đọc `rsync --version` bằng `sed -n 1p` thay `head -1`. Với `pipefail`, `head` đóng ống sớm có thể làm phép kiểm sai, và chính test đã gặp lỗi này. Mã thoát 0/1/2/3 ghi ở đầu script và README |
| Test OR-01 | Done | `pull-backups.test.sh` dùng ssh giả chuyển lệnh cho **rrsync thật** `-ro`, giống khóa kéo trên VPS. 11 ca: lần kéo đầu (chỉ `*.age` + `*.age.sha256`, quyền 0700/0600) · tệp mới · **máy chủ viết lại tệp cũ và `.sha256` của nó → bản cục bộ giữ nguyên byte, WARNING cho cả hai tên, thoát 3, không ghi `.last_pull`** · tệp mới vẫn được kéo trong cùng lượt, thư mục máy chủ không đổi · ghi đè cùng cỡ, cùng giờ sửa · chỉ đổi giờ + tệp máy chủ đã xóa (không báo, giữ bản cục bộ) · tệp máy chủ sai checksum của chính nó → thoát 1 · cắt 35 ngày · máy chủ không tới được → thoát 2, không đổi gì · openrsync bị từ chối · `--keep-days` > 35 bị từ chối. Kết quả trong container ubuntu 24.04 (rsync 3.2.7, rrsync python): **11 passed, 0 failed**. Đối chứng: cùng test chạy với script cũ ra **4 FAIL** (ca 3: bản cục bộ bị thay, `checksum mismatch`; ca 4: không phát hiện; ca 6: vẫn ghi `.last_pull`; ca 8: thoát 255). shellcheck `-S warning` sạch cả hai tệp. Trên Mac (openrsync) test tự bỏ qua; đầu tệp có lệnh docker để chạy. CI: thêm tệp vào shellcheck và một bước riêng, cài `rsync` nếu thiếu. Nếu test bỏ qua thì bước này **đỏ** (phải thấy dòng `== N passed, 0 failed`) |
| OR-L3 | Done (staging, sửa tay một lần) | Chỉ chạy `chown ottimo:ottimo` và `chmod 0600` cho `/opt/ottimo/state/privacy-notice.log`, cộng `ls -l` và `date` trước/sau. Không xóa, không cắt nội dung. Trước (12:12:16Z): `-rw-r--r-- 1 root root 4098 Nov  6 15:53 …/state/privacy-notice.log`. Sau (12:12:23Z): `-rw------- 1 ottimo ottimo 4098 Nov  6 15:53 …/state/privacy-notice.log`. Cỡ và giờ sửa không đổi. `publish-privacy-notice.sh` chỉ ghi thêm (`>>`), nên lần chạy root sau giữ chủ `ottimo`. `deploy-landing.sh` và `backup.sh` (user `ottimo`) vẫn đọc được. Sửa gốc vẫn là README 12.3 (e), v1.0.5 |
| FB-R4-SEC-OPS-OR-02 | Open (chờ INV về launchd) | Không thuộc lượt này. Điều kiện ping khi tự động hóa vẫn phải kiểm **cả** rc = 0 **và** bản `db-*.dump.age` mới nhất ≤ 36 giờ. Có thêm thoát 3 thì cũng gửi `/fail` |

Đánh đổi cần biết (OR-01):
- Script không còn tự sửa bản hỏng trên Mac. Trước đây, tệp cục bộ hỏng mà đổi cỡ sẽ bị kéo đè. Giờ tệp đó báo `checksum mismatch` và cả `WARNING` (vì khác máy chủ), thoát 3. Người chạy so tay với `.sha256` trên máy chủ. Nếu bản trên Mac mới là bản hỏng thì dời nó ra chỗ khác rồi kéo lại. README có ghi.
- Lượt so `--checksum` đọc hết các tệp sao lưu ở cả hai phía mỗi lần kéo, nên chậm hơn bản cũ. Phía máy chủ chỉ đọc qua `rrsync -ro`. Chưa đo trên production, vì lượt này không được chạy kéo thật. Lần kéo tay tới, ORC hoặc OPS ghi thời gian chạy.

Dòng decision-log đề xuất (ORC chép):

`| 2026-11-06 | 4 | OPS – FB-R4-SEC-OPS-OR-01 Done: pull-backups.sh kéo bằng --ignore-existing (không thay tệp đã có trên máy nhận, kể cả .sha256; vẫn không --delete); so nội dung tệp cùng tên bằng rsync --checksum --dry-run qua rrsync -ro, khác → "WARNING: server copy changed: <tên> – local copy kept" + thoát 3; .last_pull chỉ ghi khi thoát 0; mất kết nối → thoát 2. Test pull-backups.test.sh (rrsync thật, 11/11; script cũ 4 FAIL) vào CI infra-scripts. OR-L3: state/privacy-notice.log staging root:root 0644 → ottimo:ottimo 0600 (sửa tay một lần, SEC cho phép, ls -l trước/sau trong responses/OPS-LP-v2.md). OR-02 vẫn chờ INV (launchd) | OPS | Quyền OPS (thực thi thẻ SEC) |`

## Thẻ SEC tối 06/11 (QC Round 4 ĐK-8; SEC `SEC-on-bug-r4-054.md` và `SEC-on-lp-v2-s6d.md`)

- Người trả lời: OPS | Ngày: 06/11/2026 | Round 5 (bảo trì v1.0.5) – Bước: Sản xuất. Không SSH, không đổi gì trên server. Phần code nằm trong các PR nhánh `r5-ops-caddy` (V5-67) và `r5-ops` (V5-73, V5-62, V5-65); runbook ở nhánh `r5-ops-runbooks` (V5-70, V5-64, V5-65 phần gỡ khóa). Cả ba chờ SEC + ARC review, OPS không tự merge. "Done" dưới đây nghĩa là bản sửa đã có trong PR kèm test; thẻ chỉ Closed khi SEC xác nhận.
- Trong commit này: README `infra/server` dòng 120 bỏ "nhất là sau khi nhập lại bảng giá 01/11", thay bằng câu QA/SEC đề nghị (phần "làm ngay" của V5-73).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-054-01 (Minor) | Done → V5-67 (PR `r5-ops-caddy`) | Snippet `(public_api)` trong `infra/caddy/Caddyfile.landing` thêm `header_up -Authorization`. Staging và production dùng chung tệp này (chỉ khác snippet bí mật `landing_access`), nên áp cho cả hai. `check-caddy-landing.sh` thêm ca: snippet production, client tự gửi `Authorization` trên 3 route (form-token, booking-requests, price-estimate) → api giả nhận rỗng; snippet staging (basic auth, mật khẩu thử sinh ngẫu nhiên trong lượt chạy, không vào repo) đúng mật khẩu → qua được 3 route và api giả vẫn nhận rỗng; thiếu mật khẩu → 401 kèm `X-Robots-Tag`. Đối chứng: chạy test với Caddyfile cũ thì đỏ. Bước "kiểm một lần trên staging qua edge thật" nằm trong runbook v1.0.5 (cửa sổ bảo trì), vì lượt này không được SSH. Container landing phải dựng lại (`--force-recreate`) mới nạp Caddyfile mới, runbook có ghi |
| FB-R4-SEC-OPS-054-02 (Major) | Deferred → backlog B-OPS (cùng A+) | Thẻ là điều kiện để làm A+. PO quyết 06/11 không làm A+ ở v1.0.5 (plan Round 5 mục 6, dòng V5-67), SEC A4.1 cho dời A+ và giữ cách C (README 12.3, chèn header). Khi chưa có A+ thì không có công tắc mở 3 route api staging, nên không có rủi ro R4 "quên tắt". Khi nhận A+, 054-02 làm đầu tiên: cửa sổ tự đóng ≤ 4 giờ (ví dụ `LANDING_PREVIEW_FORM_OPEN_UNTIL`), hoặc nhắc tới phòng "Báo động", vì staging chỉ có journal |
| FB-R4-SEC-OPS-054-03 (Minor) | Deferred → B-OPS (cùng A+) | Matcher method + path cho đúng 3 thao tác, ca CI `PUT` → 401, từ chối mở khi `INCLUDE_TEST_SUPPORT≠0`. Chỉ có nghĩa khi làm A+ |
| FB-R4-SEC-OPS-054-04 (Minor) | Deferred → B-OPS (cùng A+) | So 8 ký tự đầu sha256 của `id_hash_key` / `public_form_signing_key` giữa hai stack trước lần mở đầu tiên. Chỉ có nghĩa khi làm A+ |
| FB-R4-SEC-OPS-054-05 (Minor) | Deferred → B-OPS (cùng A+) | Biên bản đếm yêu cầu lạ mỗi lần mở, xóa theo WR8 trong 24 giờ, luật "không mở khi thử bảng giá chưa công bố" (R3). Ghi vào runbook A+ khi làm |
| FB-R4-SEC-OPS-054-06 (Suggestion) | Deferred → B-OPS (cùng A+), gộp OR-L5 | `--refresh-landing-access` ghi nguyên tử 0400, smoke CSP/HSTS lúc mở. Giữ ý SEC: không cấp `root:ottimo 0440` cho mật khẩu xem trước |
| FB-R4-SEC-OPS-OR-01 | Closed (SEC, mục "Xác nhận OR-01") | Không cần trả lời thêm |
| FB-R4-SEC-OPS-OR-02 (Major) | Open – chờ INV → V5-60 | Không đổi từ lượt trước: chờ INV đồng ý cài launchd (`esc-pending-06-11.md` mục 3). Khi làm, ping chỉ khi thoát 0 **và** bản `db-*` mới nhất trên máy nhận ≤ 36 giờ; thoát 1/2/3 → `/fail`. Đủ 6 điều kiện của thẻ (URL ping ngoài repo, loại khỏi Time Machine và iCloud, khóa `age` không cùng máy, FileVault, khóa kéo giữ `restrict` + `rrsync -ro`). Tới lúc đó ORC kéo tay ≥ 2 ngày/lần |
| FB-R4-SEC-OPS-OR-03 (Minor) | Phần code Done (PR `r5-ops`); phần server Deferred → V5-65, cửa sổ bảo trì đầu tiên | (3) `ops-check sshkeys`: đọc `authorized_keys` của user `ottimo`, mọi dòng khóa phải có `command="…"` **và** `restrict` trong phần tùy chọn, nếu không → FAIL, tin chỉ nêu số dòng vi phạm (không in khóa, vân tay hay chú thích). Không đọc được tệp → FAIL. Có test. (4) README bootstrap ghi rõ `--deploy-key` chỉ là đường vào lúc dựng máy lần đầu, gỡ ngay khi `ottimo-admin` chạy. (1)(2) Gỡ khóa `ottimo-ops`: bước có sẵn lệnh trong runbook v1.0.5 (kiểm `ottimo-admin` và `sudo -n -u ottimo` trước, ghi 8 ký tự đầu vân tay, chỉ xóa đúng dòng đó, sau đó `sshkeys` ok). Thẻ đóng khi `sshkeys` ok trên cả hai máy |
| FB-R4-SEC-OPS-OR-04 (Minor) | Deferred → V5-63 (ARC chọn cách) | Chờ ARC chọn driver (SEC nghiêng `journald` + `MaxRetentionSec=90day`). OPS làm sau khi ARC chốt, giữ đủ 5 yêu cầu SEC (qua deploy, trần 90 ngày, 0640 nhóm quản trị, không đổi cách che, không đưa log ra ngoài máy). Không nằm trong lượt này |
| FB-R4-SEC-OPS-OR-05 | Không có thẻ | `SEC-on-bug-r4-054.md` Phần B2 chỉ có OR-01 … OR-04. Ghi ở đây để QC không phải tìm |
| FB-R4-SEC-OPS-S6D-01 (Minor) | Done → V5-73 (PR `r5-ops`) | `pricegap` có hai phần độc lập: phần log 24 giờ như cũ và phần tĩnh SQL READ ONLY qua `psql_ro` (role `ottimo_readonly`, giao dịch chỉ đọc, dòng chặn `ro-ok`). Phần tĩnh theo đúng mục 6.4: căn `is_sellable`, có `public_room_type`, `active_from <= hôm nay + 365`, `active_to` rỗng hoặc `>= hôm nay`, và không có dòng giá `effective_from <= greatest(active_from, hôm nay)`. "Hôm nay" tính theo múi giờ của property. Truy vấn chỉ trả **một số đếm**, không chọn id. FAIL khi phần log **hoặc** phần tĩnh > 0; tin chỉ nêu số căn. Lỗi truy vấn hoặc câu trả lời không phải số → FAIL riêng, không coi là 0. Test `ops-check-price.test.sh` thêm ca đếm tĩnh 1 → FAIL không lộ id (kiểm cả webhook và tệp trạng thái) và 0 → ok, cùng các ca lỗi. README dòng 120 sửa trong commit này |
| X4 gợi ý 1 (tên mang ngày tương lai) | Deferred → V5-60 | Làm cùng đợt tự động hóa OR-02: không kéo tệp đó, `WARNING: future-dated name`, thoát 3 |
| X4 gợi ý 2 (trần một lượt kéo) | Deferred → V5-60 | Cùng đợt: quá 50 tệp mới hoặc quá 2 GB theo lượt chạy thử thì dừng, thoát 3 |
| X4 gợi ý 3 (ca A "bản Mac hỏng") | Deferred → V5-60 | Thêm vào `pull-backups.test.sh` cùng đợt |
| X4 gợi ý 4 (diễn tập từ bản trên máy nhận) | Deferred → V5-61 | Diễn tập khôi phục Round 5 lấy bản từ máy nhận (Mac), không lấy từ VPS, để kiểm trọn chuỗi ngoài máy. Ghi vào kế hoạch diễn tập khi INV có 30 phút |

Mục B1 không có thẻ riêng (để QC thấy đủ):

| Mục | Đi về đâu | Ghi chú |
|---|---|---|
| OR-M1 (diễn tập quá hạn) | V5-61 | Chờ INV 30 phút. `ops-check drill` làm cùng V5-61 |
| OR-M2 (RPO 24 giờ) | V5-62, PR `r5-ops` | Lượt sao lưu thứ hai 14:00 (staging 14:30), vòng xoay theo tuổi, mọi bản < 35 ngày, ngưỡng `backup` của ops-check 26 → 14 giờ. INV xác nhận "RPO 12 giờ" (B4.4); SEC sửa SR-BAK-01 khi bản lên |
| OR-M3 | V5-63 | Như OR-04 |
| OR-M4 | V5-64, PR `r5-ops-runbooks` | Runbook "VPS mới" một trang, chỉ viết |
| OR-L1 (khóa `.env` trùng) | V5-65 | Chưa làm trong lượt này. Khi làm: chỉ in tên khóa |
| OR-L2 (`fwupd`) | V5-65, cửa sổ bảo trì | Bước tùy chọn trong runbook v1.0.5 |
| OR-L5 | B-OPS | Gộp 054-06 |
| OR-L6 (dọn image) | B-OPS | Luật giữ 4 nhãn + image diễn tập gần nhất ghi vào runbook v1.0.5 phần dọn |
| OR-L7 (người thứ hai phòng "Báo động") | INV tự quyết (B4.5) | Không phải việc OPS |
| Mục 9 – `TEST_SUPPORT_ALLOW_IPS` và 6 bản `env.before-*` staging | V5-65, cửa sổ bảo trì | Bước trong runbook v1.0.5: làm rỗng giá trị, chỉ giữ bản `env.before-*` mới nhất |

Dòng decision-log đề xuất (ORC chép):

`| 2026-11-06 | 5 | OPS – trả lời đủ thẻ SEC tối 06/11 (QC R4 ĐK-8, responses/OPS-LP-v2.md): 054-01 Done (V5-67, PR r5-ops-caddy); S6D-01 Done (V5-73, PR r5-ops) + README dòng 120 sửa trên main; OR-03 phần code Done (sshkeys + README bootstrap), gỡ khóa ottimo-ops ở cửa sổ bảo trì (runbook v1.0.5); 054-02…06 Deferred B-OPS cùng A+ (PO 06/11); OR-02 Open chờ INV (V5-60); OR-04 Deferred V5-63; X4.1–3 → V5-60, X4.4 → V5-61; không có thẻ OR-05 | OPS | Quyền OPS (trả lời thẻ) |`
