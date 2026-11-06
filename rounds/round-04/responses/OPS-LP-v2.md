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
