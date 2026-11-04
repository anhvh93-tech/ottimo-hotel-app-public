# OTTIMO LP-v2 – Runbook phát hành production (r2.2)

Soạn: OPS · 04/11/2026 · Round 4, gói LP-v2, bước **Phản hồi & sửa**, nhánh `lp-v2-main`. Trả lời SEC `FB-R4-SEC-LPV2M-03` (`rounds/round-04/reviews/SEC-on-lp-v2-main.md`): README 12.3 viết lại theo trạng thái thật, và runbook này chứa các điều kiện đăng **D1–D7** (mục 4 của tệp SEC), gồm D5 = C8 kiểm trên staging qua Caddy thật.
Khuôn: `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` r3.2 (cách gọi SSH, `SQLRO`, ô điền, "Đúng là", "Dừng nếu", quy ước digest rút gọn).
Căn cứ: `product/infra/server/README.md` 12.3 (mục "LP-v2"); `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` (0092, băm, kiểm); `rounds/round-04/outputs/OPS/lp-v2-ops.md`; `rounds/round-04/qc/lp-v2-gate.md` mục 6 (P1–P16); `rounds/round-04/outputs/SEC/notice-2026-10-31-final.md` mục 5 (P1–P6); `rounds/round-04/reviews/SEC-on-LP-v2-code.md` mục 4 (C1–C9); `.github/workflows/release.yml`; `product/infra/server/bin/{deploy,rollback,deploy-landing,publish-privacy-notice,ops-check,us155-smoke-counts}.sh`.

Sửa r1.1: OPS · 04/11/2026 · bước **Phản hồi & sửa**, QA **BUG-R4-028** (P3): nhãn đăng là biến `⟨NOTICE_V⟩` (0.1); hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` phải **bằng đúng** `⟨NOTICE_V⟩` – đổi nhãn (ví dụ `2026-11-04.1`) thì BE đổi hằng, SEC xem, Release api **trước** P10. Kiểm D2/P5 không grep chuỗi cố định nữa mà so ba giá trị (khối `CHKV`, mục 2): hằng api, `VERSION` landing, `⟨NOTICE_V⟩`; chỉ in `D2_CHAT_CONST=CO` khi cả ba bằng nhau. S4, P10 dùng `--version ⟨NOTICE_V⟩`. README 12.3 + 13.5 (K1) cùng nội dung.

Sửa r2: OPS · 04/11/2026 · bước **Phản hồi & sửa**, theo SEC `SEC-on-lp-v2-main.md` mục 8.4 (FB-R4-SEC-OPS-LPV2RB-01..04) và ARC `responses/ARC-on-lp-v2-main.md` mục "Runbook r1.1" (Q2, Q3, G7). Chỉ sửa tệp này (nhánh `lp-v2-ops-runbook-r2`, gộp sau PR #34; không đổi đầu PR). Tóm tắt:
- **RB-01:** ô D1 bỏ "hai số `1`" (đã bỏ từ r1.1), trỏ về SEC mục 8.1 + số run CI PR và `headSha` (QC G1).
- **RB-02:** quy tắc "hằng Chat = nhãn đăng" **chỉ** áp khi trên DB đích chưa có dòng nào mang nhãn của hằng (lần đăng đầu một thông báo nêu Google Chat, tức lượt LP-v2 này). Khi `2026-11-04` đã có trên DB đích (K4), nhãn mới đăng muộn hơn tự qua cổng theo `published_at`, **không** đổi hằng. `CHKV` đọc số dòng của hằng trên DB đích và tự chọn luật (mục 2). Sửa mục 0, 0.1, `CHKV`, 5.2 bước 4(a). README 12.3 và chú thích `privacy.ts` dùng cùng cách nói ở v1.0.4 (không đổi đầu PR).
- **RB-03:** `CHKV` đối chiếu ảnh của `RA` (`sha-` + 12 ký tự của commit) với tag api: ở S4/P10 đọc thẳng `state/current_tag` của môi trường trong cùng lệnh; ở 0.2/P4 so với `⟨TAG_L⟩`. Lệch thì `KHONG`.
- **RB-04:** S0 thêm kiểm webhook staging (rỗng, hoặc INV xác nhận phòng thử; không in URL). P1 không điền sẵn `CO` nữa: `CO` chỉ khi phòng Chat/webhook không đổi từ 03/11.
- **ARC Q2:** 5.4 bước 2 có hai cách giữ bất biến "không để landing LP-v2 mở proxy form đứng trước api v1.0.3": trước mốc 7 ngày quay landing về bản cũ; quá mốc thì giữ landing LP-v2, `LANDING_PUBLIC_API=off`, báo INV. **Q3:** giữ `LIKE` (ARC: đủ). **G7:** ARC xác nhận băm drizzle = sha256 tệp SQL, K2 dòng 3 so thẳng `HASH_0092`.

Sửa r2.1: OPS · 04/11/2026 · bước **Phản hồi & sửa**, theo SEC `SEC-on-lp-v2-main.md` mục 9.4 (FB-R4-SEC-OPS-LPV2RB-05..08) và ghi chú ARC khi đọc 5.4 bước 2. Cùng nhánh `lp-v2-ops-runbook-r2`, chỉ sửa tệp này. Tóm tắt:
- **RB-05:** mục 0 (b) và 5.2 bước 4(a) có điều kiện **dừng**: nhãn mới mà decision-log chưa có dòng SEC duyệt chữ ("Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4"). Mục 7 thêm dòng 5.2 (và 5.4).
- **RB-06:** 5.4 chỉ mở lại proxy khi K1 thấy api là LP-v2 **và** `LANDING_LOCALES` đã về 5 ngôn ngữ. Bỏ vế "hoặc sau khi đã chọn 5.2 bước 4 (a)/(b)". Nhánh (i) tới mốc 7 ngày mà app vẫn v1.0.3 thì chỉ làm 5.2(b); 5.2(a) chỉ khi api là LP-v2. K5 có kỳ vọng theo từng nhánh.
- **RB-07:** S0b in mã thoát của `cmp` (`STG_SAME_AS_PROD_RC`), tách "khác" (1) với "chưa so được" (`ERR`).
- **RB-08:** `CHKV` in `ENV`, `ROWS`; production `ROWS=0` → `KHONG`; hằng phải không mang hậu tố, nhãn phải đúng dạng `YYYY-MM-DD[.N]`.
- **ARC (5.4 cách (ii)):** thêm lệnh và dòng "Đúng là" cho `deploy-landing.sh ⟨TAG_L⟩ --no-pull` khi proxy tắt (có thể có WARNING, không có FAIL).

Sửa r2.2: OPS · 04/11/2026 · bước **Phản hồi & sửa**, theo SEC FB-R4-SEC-OPS-LPV2RB-09 (Suggestion, sửa ngay vì runbook dùng sáng 05/11). SEC đã đọc r2.1 @ `82af53e6`: ĐẠT, RB-05..08 đóng. Cùng nhánh `lp-v2-ops-runbook-r2`, chỉ sửa tệp này. Tóm tắt:
- **Lỗi ở r2.1:** chốt "production `ROWS=0` → `KHONG`" so `E` đúng từng ký tự với `/opt/ottimo-prod`. Gõ `E=/opt/ottimo-prod/` (thừa `/` cuối) thì phép so lệch, lệnh coi như staging, và `ROWS=0` vẫn ra `CO`. OPS chạy lại khối r2.1 với giá trị giả và thấy đúng lỗi này (ca 3 bảng dưới: r2.1 ra `CO`).
- **RB-09 (sửa cả hai):** (1) `E=${E%/}` ngay sau khi đặt `E`, nên dòng in, hai lệnh SSH và phép so đều dùng giá trị đã chuẩn hóa. (2) Thay vế "khác production thì nhận `ROWS=0`" bằng danh sách cho phép: `/opt/ottimo-prod` đòi `ROWS≥1`; `/opt/ottimo` (staging) nhận `ROWS=0`; **mọi giá trị khác ra `KHONG` dù `ROWS` bao nhiêu** (OPS chặn thêm cả ca `ROWS≥1`, vì chỉ có hai môi trường; đường dẫn lạ mà vẫn đọc được bảng là dấu hiệu gõ nhầm). Chỉ bỏ **một** `/` cuối: `//` cuối vẫn ra `KHONG`.
- **Chạy thử** (bash và zsh, đoạn lệnh lấy thẳng từ khối `CHKV` trong tệp này; thay hai lệnh SSH bằng hàm giả: `current_tag` = `sha-` + 12 ký tự commit của `RA`, bảng nhãn giả rỗng hoặc một dòng `2026-10-24`; `RA=RL=origin/main` (hằng và `VERSION` đều `2026-11-04`), `V=2026-11-04`, `RUN=DOC`). Hai shell ra giống nhau ở mọi ca:

| # | `E` gõ vào | `ROWS` giả | Dòng in | r2.2 | r2.1 (để so) |
|---|---|---|---|---|---|
| 1 | `/opt/ottimo-prod` | 0 | `ENV=/opt/ottimo-prod ROWS=0` | `KHONG` | `KHONG` |
| 2 | `/opt/ottimo-prod` | 1 | `ENV=/opt/ottimo-prod ROWS=1` | `CO` | `CO` |
| 3 | `/opt/ottimo-prod/` | 0 | `ENV=/opt/ottimo-prod ROWS=0` | `KHONG` | **`CO` (lỗi RB-09)** |
| 4 | `/opt/ottimo-prod/` | 1 | `ENV=/opt/ottimo-prod ROWS=1` | `CO` | `CO` |
| 5 | `/opt/ottimo` | 0 | `ENV=/opt/ottimo ROWS=0` | `CO` | `CO` |
| 6 | `/opt/ottimo` | 1 | `ENV=/opt/ottimo ROWS=1` | `CO` | `CO` |
| 7 | `/opt/ottimo/` | 0 | `ENV=/opt/ottimo ROWS=0` | `CO` | `CO` |
| 8 | `/opt/ottimo/` | 1 | `ENV=/opt/ottimo ROWS=1` | `CO` | `CO` |
| 9 | `/srv/other` (lạ) | 0 | `ENV=/srv/other ROWS=0` | `KHONG` | `CO` |
| 10 | `/srv/other` (lạ) | 1 | `ENV=/srv/other ROWS=1` | `KHONG` | `CO` |
| 11 | `/opt/ottimo-prod//` | 0 / 1 | `ENV=/opt/ottimo-prod/ …` | `KHONG` / `KHONG` | – |
| 12 | `/opt/ottimo-prod-x` | 0 / 1 | `ENV=/opt/ottimo-prod-x …` | `KHONG` / `KHONG` | – |

  Hồi quy nhanh trên khối r2.2 (bash, zsh): `RUN` khác ảnh của `RA` → `KHONG`; production lần đầu, nhãn `2026-11-04.1` mà hằng `2026-11-04` → `KHONG`; `E=/opt/ottimo-prod/`, hằng đã đăng (5 dòng `2026-11-04`), lên lại cùng nhãn → `CO`; nhãn `2026-11-04.01` → `KHONG`. Hai lệnh SSH thật vẫn chưa chạy (G8): lần đầu ở 0.2 bước 3.

Trạng thái: **r2.2. SEC đã đọc r1.1 (T1 ĐẠT CÓ ĐK), r2 (mục 9, ĐẠT CÓ ĐK) và r2.1 @ `82af53e6` (ĐẠT, RB-05..08 đóng) ngày 04/11; ARC đã đọc r1.1 và 5.4 bước 2 của r2 (ĐẠT). SEC chỉ đọc phần thay đổi r2.2 (RB-09: dòng `E=${E%/}` và `case "$E"` trong `CHKV`, bảng chạy thử ở mục "Sửa r2.2").** Các ký hiệu `⟨…⟩` lấy đúng một giá trị ở bảng 0.1, chốt theo 0.2 sau khi `lp-v2-main` gộp vào `main`. Không chạy bước nào trên production khi 0.1 còn ô trống. Trong các dòng "Đúng là", `2026-11-04` đọc là `⟨NOTICE_V⟩`.
Người chạy: **ORC**, qua SSH `ottimo-admin` (`sudo -n`), theo phê duyệt thường trực của INV 04/11 (gộp, staging, Release LP-v2; decision-log 04/11 "INV – đồng ý trước toàn bộ"). Phê duyệt đó **không** bỏ cổng: vẫn đủ review, QA, QC trước Release; ORC báo INV sau mỗi lần deploy. **OWN (INV) tự làm** trên Desk: bật `public_show_prices` (F2) và xóa yêu cầu thử theo WR8 (K6).

**Luật riêng của đợt này:** không ghi IP VPS, bí mật, URL webhook, email hay số điện thoại vào tệp này, chat, lệnh hay `.env` mẫu. Digest image chỉ ghi dạng rút gọn `8…4`, lệnh đọc digest đầy đủ từ `state/digests/…` hoặc artifact vào biến (quy ước PR30-01: gitleaks báo nhầm digest đầy đủ). Không SQL ghi tay production; bảng `privacy_notice_version` chỉ ghi qua `publish-privacy-notice.sh`. Mọi lệnh kiểm chỉ in số, mã hoặc `ERR`.

---

## 0. Trả lời nhanh

| Câu hỏi | Trả lời |
|---|---|
| Đợt này gồm gì | Nhánh `lp-v2-main` gộp vào `main` (commit gộp = `⟨SHA_L⟩`): mã LP-v2 phía api + Desk (migration **0092**, OpenAPI 0.3.11, route giá công khai, `LANDING_LOCALES`), landing 5 ngôn ngữ (en, vi, ko, zh, ru) + khối giá ước tính, thông báo dữ liệu nhãn **`2026-11-04`** (en/vi = chữ PR #21 luật sư đã duyệt; ko/zh/ru = Δ5 SEC), hạ tầng (Caddy landing, `deploy-landing.sh`, `publish-privacy-notice`, `ops-check` giá) |
| Production lúc soạn | App v1.0.3 `sha-da6d6f3dc22b` (DB **68**, chưa có 0092). Landing `landing-v1.1.1` = `sha-72f9ac8e2b33`. Thông báo đang hiệu lực: **`2026-10-24`** en + vi. `2026-10-31` **chưa và sẽ không** được đăng riêng (đổi nghĩa P4, SEC chấp nhận) |
| Nhãn thông báo | **`2026-11-04`**, cả 5 ngôn ngữ (SEC mục 2). Không đăng `2026-10-31`, không đăng `2026-11-01` ở staging hay production. Nhãn đăng = `⟨NOTICE_V⟩` (0.1). Chữ đổi thì luôn nhãn mới (`2026-11-04.1`) và báo SEC (SEC xem chữ: chữ mới bỏ Google Chat khỏi bên nhận thì phải hạ mức Chat trước khi đăng – GCHAT-03). Còn hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` thì tùy DB đích (SEC RB-02): **(a) DB đích chưa có dòng nào mang nhãn của hằng** (lần đăng đầu nêu Google Chat – lượt này trên production): BE đổi hằng = nhãn mới + Release api trước P10, nếu không Chat giữ mức A mãi (BUG-R4-028). **(b) DB đích đã có dòng của hằng** (`2026-11-04` đã đăng, K4): **không** đổi hằng. Nhãn mới đăng muộn hơn tự qua cổng theo `published_at`. Đổi hằng lúc này sẽ hạ mọi yêu cầu đã gửi theo `2026-11-04` xuống A. Ở (b), nhãn mới tự được mức Chat đang đặt, nên **dừng nếu** decision-log chưa có dòng SEC duyệt chữ nhãn mới, ghi rõ "Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4" (SEC RB-05). `CHKV` tự chọn (a)/(b) theo số dòng đọc được |
| Hai lượt Release | (1) App: tag `⟨APP_TAG⟩` trên `⟨SHA_L⟩` → api/web/worker `⟨TAG_L⟩`, migration 0092. (2) Landing: tag `⟨LANDING_REL⟩` trên **cùng** `⟨SHA_L⟩` → landing `⟨TAG_L⟩`. Hai lượt cách nhau bởi K1–K3. Nếu v1.0.4 lên production trước LP-v2 thì 0092 đã đi cùng v1.0.4: bỏ lượt (1), xem 1.2 |
| Thứ tự (SEC D4, README 12.3) | api có 0092 (`LANDING_LOCALES=en,vi`) → landing LP-v2 → `publish-privacy-notice` chạy thử rồi `--apply` (5 ngôn ngữ) → `LANDING_LOCALES=en,vi,ko,zh,ru` + deploy lại app cùng tag → `form-token` 200 → yêu cầu thử → OWN bật `public_show_prices` **cuối cùng**. Bước landing → đăng → `LANDING_LOCALES` làm liền, một phiên, ngoài giờ đông khách |
| Migration 0092 | Chỉ nới: CHECK `locale` của `privacy_notice_version` và `website_booking_request` thêm `ko`, `zh`; cột `website_booking_request.price_estimate jsonb NULL`; 2 khóa danh mục `public_show_prices` (mặc định `false`, chỉ OWN) và `web_estimate.open_until`. Không đổi dữ liệu. ARC đo ~0,2 giây trên DB 68 migration. v1.0.3 chạy được trên DB 69 |
| Cờ | `public_show_prices` (Desk H05, OWN) giữ `false` tới F2. `LANDING_LOCALES` (`.env`) giữ `en,vi` tới F1. `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` giữ `A` tới khi SEC xác nhận ★1–★8 (D7, ngoài runbook này) |
| Quay lui | Chỉ giá: OWN tắt `public_show_prices`. Landing: `LANDING_LOCALES=en,vi` → deploy lại app → `deploy-landing.sh --rollback` về `sha-72f9ac8e2b33` (in `2026-10-24`, nhận form 7 ngày sau giờ `--apply`). App: thêm `rollback.sh sha-da6d6f3dc22b` (DB 69 / image 68, không lùi DB). Mục 5 |
| Gián đoạn | Desk/api: 15–30 giây ở P6 và F1. ottimo.vn: khoảng 1 giây ở P9. Giữa P9 và P10 (vài phút) form en/vi hiện khối Zalo/gọi (`NOTICE_VERSION_INVALID`), không có dữ liệu sai |

### 0.1 Ô điền (ORC chốt ở 0.2)

| Ô | Giá trị | Lấy ở đâu | Dùng ở |
|---|---|---|---|
| `⟨SHA_L⟩` | | commit gộp `lp-v2-main` vào `main` (PR `lp-v2-main` → `main`, `mergeCommit`) | 0.2, P1, P2b, P4, P8 |
| `⟨TAG_L⟩` | | `sha-` + 12 ký tự đầu của `⟨SHA_L⟩` | P5–P10, K, R |
| `⟨CI_RUN_L⟩` | | lượt CI `push` của `⟨SHA_L⟩` | 0.2, P5, P8 |
| `⟨NOTICE_V⟩` | `2026-11-04` (SEC chốt, mục 2) | Đổi chỉ khi SEC đặt nhãn mới. Khi đó `VERSION` (`privacy.ts`) luôn phải bằng nhãn mới trước 0.2. Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` (api) chỉ đổi theo khi DB production chưa có dòng nào của hằng (mục 0 "Nhãn thông báo" (a)); lượt này production chưa có `2026-11-04` (P2 dòng 3), nên đổi nhãn trước P10 = đổi cả hằng | 0.2, S4, P0 (D2/P5), P4, P10, K4 |
| `⟨APP_TAG⟩` | đề xuất `v1.0.4-lp.1` (G1) | ORC chốt | P4, P5 |
| `⟨LANDING_REL⟩` | đề xuất `landing-v2.0.0` (G2) | ORC chốt | P8 |
| `API_DIGEST`, `WEB_DIGEST`, `LANDING_DIGEST` | dạng `8 ký tự…4 ký tự` | artifact `image-digests` của `⟨CI_RUN_L⟩` | P5, P8, K1, K3 |
| `HASH_0092` | `b1f16b35fe81eb08a46216fde3f477ec3d60d8a38fe216ed4207b46379e92b41` | ARC `lp-v2-main-merge.md` mục 1; kiểm lại ở 0.2 (băm tệp SQL, không phải bí mật). ARC xác nhận 04/11 (G7): `drizzle.__drizzle_migrations.hash` = sha256 nội dung tệp SQL, so thẳng | K2 |
| `WHEN_0092` | `1792782173681` | journal idx 68 (= 0091 + 2000) | K2 |
| `⟨OPERATOR⟩` | mã nhân viên của người chạy `publish-privacy-notice` (không phải email) | Desk | P10, S4 |

### 0.2 Chốt `⟨SHA_L⟩` và giữ `main` yên – Ai chạy: ORC (Mac), ngay sau khi gộp

Lý do như v1.0.3 0.2: `release.yml` (`resolve`) đòi lượt CI `push` của commit được tag đã `completed success`; CI dùng `cancel-in-progress`, nên một push lên `main` khi lượt của `⟨SHA_L⟩` còn chờ `deploy staging` sẽ hủy lượt đó. Các gói v1.0.4 đang chờ `main@L` để gộp: **không gộp gì lên `main` từ lúc gộp `lp-v2-main` tới khi lượt CI của `⟨SHA_L⟩` `completed success`.**

1. ORC gộp PR `lp-v2-main` → `main` (một lần gộp) khi đủ D1 phần "trước gộp" (mục P0).
2. Đợi lượt CI `push` của commit gộp tới `deploy staging` = `waiting`.
3. Ghim commit, kiểm job, in digest rút gọn, băm 0092:
   ```bash
   cd /Users/anhvh/Desktop/hotel-app && R=anhvh93-tech/ottimo-hotel-app-public && git fetch origin \
    && S=$(gh pr view ⟨số PR lp-v2-main⟩ -R $R --json state,mergeCommit --jq 'select(.state=="MERGED") | .mergeCommit.oid') && test -n "$S" \
    && git merge-base --is-ancestor "$S" origin/main && echo "SHA_L=$S TAG_L=sha-$(printf %s "$S" | cut -c1-12)" \
    && CI_RUN=$(gh run list -R $R -w CI --event push --branch main --commit "$S" -L 1 --json databaseId --jq '.[0].databaseId') && test -n "$CI_RUN" && echo "CI_RUN_L=$CI_RUN" \
    && gh run view $CI_RUN -R $R --json status,jobs --jq '"run: \(.status)", (.jobs[] | select(.name=="gitleaks" or .name=="publish images (GHCR)" or .name=="deploy staging") | "\(.name): \(.status) \(.conclusion)")' \
    && d=$(mktemp -d) && gh run download $CI_RUN -R $R -n image-digests -D "$d" \
    && sed -nE 's/^([a-z]+)=sha256:([0-9a-f]{8})[0-9a-f]{52}([0-9a-f]{4})$/\1=\2…\3/p' "$d/image-digests.txt"; rm -rf "${d:-/nonexistent}" \
    ; git show "$S:product/services/api/src/db/migrations/0092_lp_v2_price_estimate_locales.sql" | shasum -a 256 \
   ```
   Rồi `CHKV` (mục 2) với `E=/opt/ottimo-prod`, `RA=$S`, `RL=$S`, `RUN=⟨TAG_L⟩` (tag vừa in ở dòng `SHA_L=`).
   **Đúng là:** `SHA_L=<40 hex> TAG_L=sha-<12 hex>`; `CI_RUN_L=<số>`; `run: waiting`; `gitleaks: completed success`, `publish images (GHCR): completed success`, `deploy staging: waiting`; đúng 3 dòng `api=…`, `web=…`, `landing=…` dạng rút gọn; băm = `HASH_0092`; `CHKV` in `NOTICE_V=⟨NOTICE_V⟩ CHAT_CONST=⟨NOTICE_V⟩ LANDING_VERSION=⟨NOTICE_V⟩ RA_IMAGE=⟨TAG_L⟩ RUN_TAG=⟨TAG_L⟩ CONST_ROWS=0` và `D2_CHAT_CONST=CO` (SEC LPV2M-01/02, D2; `CONST_ROWS=0` vì production chưa có dòng `2026-11-04`).
   **Dừng nếu** thiếu dòng nào, băm lệch (báo ARC + BE), hoặc `D2_CHAT_CONST=KHONG` (hằng Chat hoặc `VERSION` landing khác nhãn sẽ đăng: BE/FE-B sửa + SEC xem trước, không đi tiếp).
4. ORC điền bảng 0.1, commit tài liệu **local, không push** tới khi bước 5 xong.
5. Duyệt `deploy staging` của **chính** `⟨CI_RUN_L⟩` (staging nhận app có 0092, mục S2), đợi `gh run watch ⟨CI_RUN_L⟩ --exit-status` = 0. Từ đây mới gộp tiếp các gói v1.0.4. Lượt bị hủy: `gh run rerun ⟨CI_RUN_L⟩`, làm lại bước 3 (digest có thể đổi).

---

## 1. Hiện trạng và phân tích

### 1.1 Trạng thái thật (SEC LPV2M-03, đã sửa ở README 12.3)

| Mục | Production 04/11 | Sau đợt này |
|---|---|---|
| App | v1.0.3 `sha-da6d6f3dc22b`, `previous` = `sha-e5fffe05ed55` | `⟨TAG_L⟩`, `previous` = `sha-da6d6f3dc22b` |
| Migration | 68 (cuối `0091_user_email_change`) | 69 (`0092_lp_v2_price_estimate_locales`) |
| Landing | `sha-72f9ac8e2b33` (`landing-v1.1.1`, en + vi, có form) | `⟨TAG_L⟩`, `landing_previous_tag` = `sha-72f9ac8e2b33` |
| `privacy_notice_version` | `2026-10-24` en, vi đang hiệu lực | `2026-11-04` en, vi, ko, zh, ru đang hiệu lực; `2026-10-24` en, vi `superseded` (giữ dòng) |
| `state/privacy-notice.log` | dòng `apply … version=2026-10-24 … rc=0` | thêm dòng `dry-run` và `apply … version=2026-11-04 sha_en= sha_vi= sha_ko= sha_zh= sha_ru= rc=0` |
| `LANDING_LOCALES` | không đặt (= `en,vi`) | `en,vi,ko,zh,ru` |
| `public_show_prices` | chưa có khóa | khóa có, `false`; OWN bật ở F2 |
| Chat yêu cầu website | mức A | mức A (C chỉ sau D7) |

### 1.2 Hai đường lên 0092

- **Đường chính (runbook này):** LP-v2 lên trước v1.0.4. Release app riêng `⟨APP_TAG⟩` trên `⟨SHA_L⟩` (P1–P7). Quay lui app về v1.0.3 `sha-da6d6f3dc22b`.
- **Đường phụ:** v1.0.4 (cắt từ `main@L`, ORC 2.1 ý 4 = (a)) lên production trước. Khi đó 0092 đã chạy trong Release v1.0.4 (runbook v1.0.4, OPS P4-04). Bỏ P4–P7, thay `⟨TAG_L⟩` của app bằng tag image v1.0.4 ở K1/K2/F1 và quay lui app về bản v1.0.4 trước đó theo runbook v1.0.4. Landing vẫn tag trên commit có image landing **đã chạy trên staging ở S3** (cùng byte trang thông báo). P0, P2, P2b, P8–P10, K, F giữ nguyên.

### 1.3 Gói `infra/` production

Gói production là bản v1.0.3 (`SHA_V103`, P2b của v1.0.3). LP-v2 đổi 16 tệp trong `product/infra` + `.github` (`git diff --stat v1.0.3 ⟨SHA_L⟩ -- product/infra .github`, ARC mục 2): `Caddyfile.landing`, `docker-compose.prod.yml` (`LANDING_LOCALES`), `deploy-landing.sh`, `publish-privacy-notice.sh/.sql`, `ops-check.sh`, README, `env*.example`, test. **Phải làm mới gói trước P3** (P2b), vì:
- `deploy-landing.sh` cũ không biết trang ko/zh/ru; `publish-privacy-notice` cũ chỉ đăng en + vi và không biết CHECK của 0092.
- `Caddyfile.landing` được mount vào container landing. Container đang chạy giữ bản cũ tới khi `deploy-landing.sh` dựng lại nó (P9); bản mới chạy được với image `sha-72f9ac8e2b33` (trang ko/zh/ru không có → 404 tiếng Anh; route giá → api v1.0.3 trả 404).
- `ops-check` mới chạy thêm `pricelimit`, `pricegap`, `priceswitch` – vô hại trên v1.0.3 (ARC mục 8: 0 lần, 0 căn, lượt đầu lấy mốc).

### 1.4 Dữ liệu cá nhân trong đợt này

- Không câu SQL nào chọn cột của khách (`website_booking_request` chỉ đếm). Không in log dòng nguyên.
- Yêu cầu thử ở K6 dùng tên "TEST OTTIMO", kênh Email, hộp thư chung của khách sạn (không SĐT), xóa theo WR8 trong ngày. Tin Chat mức A của yêu cầu thử: OWN xóa trong phòng Chat (K1 03/11 đã chứng minh xóa được).
- `public_show_prices` bật thì giá ra công khai cho mọi người: chỉ OWN bật, sau F2 (QC P6, P7).

---

## 2. Ai chạy, có cần tương tác không

| Loại lệnh | Ai chạy | Tương tác |
|---|---|---|
| Đọc trạng thái (`dc ps`, `state/`, SQL READ ONLY, `ops-check.sh`, `curl` trang công khai) | ORC | Không |
| Làm mới gói `infra/` (staging, production) | ORC (phê duyệt thường trực INV) | Không |
| Sao lưu, gắn tag, duyệt môi trường `production`, `deploy.sh`/`rollback.sh`/`deploy-landing.sh` | ORC (phê duyệt thường trực INV); báo INV sau mỗi lần | Không |
| `publish-privacy-notice.sh` chạy thử rồi `--apply` | ORC | Không |
| Sửa `.env` (`LANDING_LOCALES`) bằng lệnh không in `.env` | ORC | Không |
| C8 12 ca SEC 9.5 + BE-01, Lighthouse, smoke P10, 13 ca giá | QA (staging; 13 ca giá thêm trên production ở F2) | Không |
| Bật `public_show_prices` trên Desk H05 | **OWN (INV)** | Có |
| Xóa yêu cầu thử theo WR8, xóa tin Chat của yêu cầu thử | **OWN (INV)** | Có |
| Xác nhận P3 (thành viên phòng Chat), P4 (sổ tay WR8 + lịch xóa phòng Chat) | **INV**, BA | Có |

Tiền tố SSH: `ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn '<lệnh>'`. Lệnh luôn bắt đầu `cd / &&`, rồi `sudo -n -u ottimo …`. Staging cùng máy, thư mục `/opt/ottimo`; production `/opt/ottimo-prod`. Ký hiệu `$P` = `/opt/ottimo-prod`.

Khối SQL READ ONLY **`SQLRO`** (như runbook v1.0.3 mục 2):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\''' <<'SQL'
SHOW default_transaction_read_only;
-- các câu của bước
SQL
```
Dòng đầu luôn phải là `on`. Trên staging thay `/opt/ottimo-prod` bằng `/opt/ottimo`.

Khối đổi `.env` **`ENVSET <KHÓA> <GIÁ TRỊ>`** (khuôn E2 v1.0.3: sao lưu, tệp tạm `umask 077`, `cat >` giữ inode và quyền 0600, chỉ in số dòng):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo cp -p /opt/ottimo-prod/.env /opt/ottimo-prod/state/env.before-lp-v2.$(date +%Y%m%d-%H%M%S) && sudo -n -u ottimo sh -c '\''umask 077; f=/opt/ottimo-prod/.env t=/opt/ottimo-prod/state/env.lpv2.tmp; trap "rm -f \"\$t\"" EXIT; grep -v "^LANDING_LOCALES=" "$f" > "$t" && echo LANDING_LOCALES=⟨GIÁ TRỊ⟩ >> "$t" && cat "$t" > "$f" && rm -f "$t"'\'' && echo "LINES=$(sudo -n -u ottimo grep -c "^LANDING_LOCALES=" /opt/ottimo-prod/.env)" && echo "VALUE_OK=$(sudo -n -u ottimo grep -cx "LANDING_LOCALES=⟨GIÁ TRỊ⟩" /opt/ottimo-prod/.env)" && sudo -n -u ottimo stat -c "%U %a" /opt/ottimo-prod/.env'
```
**Đúng là:** `LINES=1`, `VALUE_OK=1`, `ottimo 600`. `LANDING_LOCALES` không phải bí mật, nhưng lệnh vẫn không in `.env`. Lệch: trả `.env` về bản `env.before-lp-v2.*` vừa tạo (`sudo -n -u ottimo sh -c 'cat <bản sao> > /opt/ottimo-prod/.env'`), dừng.

Khối deploy lại app **cùng tag đang chạy** **`REDEPLOY`** (để api đọc lại `.env`; khuôn R8 v1.0.3, digest đọc từ `state/digests/<tag>` vào biến, chỉ in 8 ký tự):
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && T=$(sudo -n -u ottimo cat /opt/ottimo-prod/state/current_tag) && D=$(sudo -n -u ottimo cat /opt/ottimo-prod/state/digests/$T) && A=$(printf "%s\n" "$D" | sed -n "s/^api=//p") && W=$(printf "%s\n" "$D" | sed -n "s/^web=//p") && echo "tag=$T api=$(printf %s "$A" | cut -c8-15)… web=$(printf %s "$W" | cut -c8-15)…" && { sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/deploy.sh "$T" --api-digest "$A" --web-digest "$W" 2>&1; echo "MA THOAT: $?"; } | grep -E "^\[deploy |^another deploy|^usage:|^digest must|^(Error|ERROR)|^MA THOAT: "'
```
**Đúng là:** `tag=⟨tag đang chạy⟩`; `deploy … (previous: …, pull=1, rollback=0)`; `image digests match the release`; `api/worker configuration accepted …` (api từ chối mã ngôn ngữ lạ ở đây); `migrations: 69 applied / 69 in the image journal`; `OK: … is live`; `MA THOAT: 0`. Lệch: mục 4.

Khối so nhãn **`CHKV`** (Mac; đọc git, và đọc chỉ-đọc trên máy chủ; QA BUG-R4-028, SEC RB-02, RB-03). So **giá trị** của hằng Chat ở mã api (`RA`), `VERSION` của landing (`RL`) và nhãn sẽ đăng `⟨NOTICE_V⟩`, không grep một chuỗi cố định (grep `'2026-11-04'` vẫn ra `1` khi nhãn đăng đã đổi thành `2026-11-04.1`). Thêm hai điều (r2):
- **Ảnh api là ảnh đang chạy (RB-03):** `RA_IMAGE` = `sha-` + 12 ký tự đầu của commit `RA` phải bằng `RUN`. Ở 0.2 và P4 (api chưa chạy) `RUN=⟨TAG_L⟩`. Ở S4 và P10, `RUN=DOC`: lệnh tự đọc `state/current_tag` của môi trường `E` trong cùng lệnh, ORC không gõ tag.
- **Luật theo DB đích (RB-02):** lệnh đọc các nhãn trong `privacy_notice_version` của môi trường `E` (chỉ đọc, chỉ cột `version`) rồi đếm số dòng mang nhãn của hằng (`CONST_ROWS`).
  - `CONST_ROWS=0` (lần đăng đầu nêu Google Chat trên DB đó): đòi hằng = `VERSION` landing = `⟨NOTICE_V⟩`.
  - `CONST_ROWS≥1` (hằng đã đăng): đòi `VERSION` landing = `⟨NOTICE_V⟩`, và `⟨NOTICE_V⟩` **bằng** hằng (lên lại cùng nhãn, không đăng gì mới) hoặc **xếp sau** hằng theo thứ tự byte (`2026-11-04.1`, `2026-11-05`…). Hằng **không** cần đổi. Phép xếp thứ tự này chỉ để chặn nhãn cũ hơn. Cổng Chat của api vẫn so `published_at`, không so chữ.
  - Luật này không thay việc SEC duyệt chữ của nhãn mới (RB-05): `CO` ở đây không có nghĩa chữ mới còn nêu Google Chat. Điều kiện dừng nằm ở 5.2 bước 4(a) và mục 0 (b).
- **Hai chốt chặn thêm (r2.1, SEC RB-08):**
  - **Hằng không mang hậu tố.** Hằng phải đúng dạng `YYYY-MM-DD`, nhãn phải đúng dạng `YYYY-MM-DD` hoặc `YYYY-MM-DD.N` (N = 1–99, không số 0 đứng đầu, như `deploy-landing.sh`). Khi hằng không có hậu tố, thứ tự byte của nhãn so với hằng trùng thứ tự khóa của `publish-privacy-notice.sql` (ngày + hậu tố/100). Hằng có hậu tố thì `KHONG`, báo SEC + BE.
  - **Dòng in có `ENV` và `ROWS`** (tổng số dòng nhãn đọc được trên DB đó). Trên production (`E=/opt/ottimo-prod`), `ROWS=0` là đọc hỏng, vì production luôn có ít nhất hai dòng `2026-10-24`, nên ra `KHONG`. Trên staging `ROWS=0` có thể đúng (S0 đã ghi lại).
- **`E` chỉ nhận hai giá trị (r2.2, SEC RB-09):** lệnh bỏ một dấu `/` cuối ngay khi đặt (`E=${E%/}`), nên `/opt/ottimo-prod/` thành `/opt/ottimo-prod` và vẫn bị chốt `ROWS=0`. Sau đó chỉ hai giá trị qua: `/opt/ottimo-prod` (đòi `ROWS≥1`) và `/opt/ottimo` (staging, nhận cả `ROWS=0`). Mọi giá trị khác (đường dẫn lạ, `//` cuối, gõ nhầm) ra `KHONG` dù `ROWS` bao nhiêu. Không còn kiểu "khác production thì coi như staging".

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch -q origin --tags && C= L= T= PUB= VS= N= && V=⟨NOTICE_V⟩ && RA=⟨ref api⟩ && RL=⟨ref landing⟩ && E=⟨/opt/ottimo-prod | /opt/ottimo⟩ && E=${E%/} && RUN=⟨⟨TAG_L⟩ | DOC⟩ \
 && { [ "$RUN" != DOC ] || RUN=$(ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn "cd / && sudo -n -u ottimo cat $E/state/current_tag"); } \
 && VS=$(ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo '"$E"'/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -c "SELECT version FROM privacy_notice_version"'\''') \
 && C=$(git show "$RA:product/services/api/src/modules/public-site/public/chat-message.ts" | sed -nE "s/^export const CHAT_DETAILS_MIN_NOTICE_VERSION = '([^']*)';$/\1/p") \
 && L=$(git show "$RL:product/apps/landing-web/src/content/privacy.ts" | sed -nE "s/^const VERSION = '([^']*)';$/\1/p") \
 && T=$(git rev-parse -q --verify "$RA^{commit}" | cut -c1-12) \
 && PUB=$(printf '%s\n' "$VS" | grep -cxF -- "${C:-?}") \
 ; N=$(printf '%s\n' "$VS" | grep -c .) \
 ; echo "ENV=$E ROWS=${N:-?} NOTICE_V=$V CHAT_CONST=${C:-?} LANDING_VERSION=${L:-?} RA_IMAGE=sha-${T:-?} RUN_TAG=${RUN:-?} CONST_ROWS=${PUB:-?}" \
 ; K=KHONG; if [ -n "$C" ] && [ -n "$T" ] && [ "sha-$T" = "$RUN" ] && [ "$L" = "$V" ] \
   && printf '%s\n' "$C" | grep -Eqx '[0-9]{4}-[0-9]{2}-[0-9]{2}' && printf '%s\n' "$V" | grep -Eqx '[0-9]{4}-[0-9]{2}-[0-9]{2}(\.[1-9][0-9]?)?' \
   && case "$E" in /opt/ottimo-prod) [ "${N:-0}" -ge 1 ] ;; /opt/ottimo) true ;; *) false ;; esac; then case "$PUB" in 0) [ "$C" = "$V" ] && K=CO ;; [1-9]|[1-9][0-9]) { [ "$V" = "$C" ] || printf '%s\n%s\n' "$C" "$V" | LC_ALL=C sort -C -u; } && K=CO ;; esac; fi; echo "D2_CHAT_CONST=$K"
```
**Đúng là** (lượt này): `ENV=<E> ROWS=<n> NOTICE_V=2026-11-04 CHAT_CONST=2026-11-04 LANDING_VERSION=2026-11-04 RA_IMAGE=sha-<12 hex> RUN_TAG=<cùng giá trị> CONST_ROWS=0` rồi `D2_CHAT_CONST=CO`. Production trước P10: `ROWS=2` (hai dòng `2026-10-24`, P2 dòng 3), `CONST_ROWS=0`. Staging S4: `ROWS` = số dòng S0 ghi, `CONST_ROWS` thường `0`. Mọi trường hợp khác in `KHONG`: giá trị khác, `?` vì đọc không được, SSH/SQL lỗi (chuỗi `&&` dừng, các biến đã đặt rỗng ở đầu lệnh), `RA_IMAGE` ≠ `RUN_TAG`, hằng có hậu tố hoặc nhãn sai dạng, production `ROWS=0` (kể cả gõ `/opt/ottimo-prod/`), `E` không phải `/opt/ottimo-prod` hay `/opt/ottimo`. Lệnh không in dòng nào của bảng, không in `.env` hay bí mật.
OPS đã thử phần logic (bash và zsh, thay hai lệnh SSH bằng giá trị giả) trên `origin/lp-v2-main`, ra đúng cả 10 ca: (1) lần đầu, ba giá trị bằng nhau → `CO`; (2) lần đầu, nhãn `2026-11-04.1` mà hằng vẫn `2026-11-04` → `KHONG`; (3) `RUN` khác ảnh của `RA` → `KHONG`; (4) hằng đã đăng, lên lại cùng nhãn → `CO`; (5) hằng đã đăng, nhãn `2026-11-04.1`, landing cùng nhãn → `CO`; (6) như 5 với `2026-11-05` → `CO`; (7) hằng đã đăng, nhãn cũ hơn `2026-11-03` → `KHONG`; (8) hằng đã đăng, `VERSION` landing ≠ nhãn → `KHONG`; (9) `RA=v1.0.3` (hằng `2026-10-31`) → `KHONG`; (10) ref không có → `KHONG`. r2.1 thêm: (11) production đọc rỗng (`ROWS=0`) → `KHONG`; (12) staging rỗng (`ROWS=0`), ba giá trị bằng nhau → `CO`; (13) nhãn `2026-11-04.01` → `KHONG`. Riêng ca hằng có hậu tố thì OPS thử phép kiểm dạng riêng, vì mã thật không có hằng như vậy. r2.2 thử thêm 10 ca `E` × `ROWS` (bảng ở đầu tệp, mục "Sửa r2.2"). Chưa chạy hai lệnh SSH thật (OPS không SSH khi soạn): lần dùng đầu ở 0.2 bước 3, nếu SSH/SQL lỗi thì `KHONG` và dừng, báo OPS.

---

## 3. Staging trước (SEC D5, QC P9–P12) – Ai chạy: ORC + QA

Mục tiêu: chạy đúng trình tự production trên staging với **image `⟨TAG_L⟩`**, để QA làm C8 qua Caddy thật và OPS diễn tập quay lui landing. Staging cùng máy, cùng edge, nên Caddy, `TRUST_PROXY` và PROXY protocol giống production.

| Bước | Việc | Đúng là |
|---|---|---|
| S0 | Trạng thái trước (`SQLRO` staging): `SELECT count(*) FROM drizzle.__drizzle_migrations;` và `SELECT version, locale, superseded_at IS NULL FROM privacy_notice_version ORDER BY version, locale;` | `on`; 68 (hoặc 69 nếu S2 đã chạy); các dòng thông báo của staging – **ghi lại**. Có dòng `2026-11-04` khác byte bản LP-v2 thì **dừng**, báo SEC (cần nhãn mới). Có `2026-10-31`/`2026-11-01` đang hiệu lực trên staging: ghi lại, không chặn (nhỏ hơn `2026-11-04`), dòng supersede ở S4 sẽ là các nhãn đó |
| S0b | **Webhook Chat của staging (SEC RB-04, README 13.2):** S6 gửi nhiều yêu cầu thử, mỗi yêu cầu tạo một tin Chat, nên staging chỉ được nối phòng THỬ hoặc để rỗng. Chỉ đọc kích thước và so byte, không in URL: `ssh … 'cd / && { sudo -n stat -c "STG_WEBHOOK_SIZE=%s" /opt/ottimo/secrets/booking_request_chat_webhook || echo STG_WEBHOOK_SIZE=ERR; }; sudo -n cmp -s /opt/ottimo/secrets/booking_request_chat_webhook /opt/ottimo-prod/secrets/booking_request_chat_webhook; echo "STG_SAME_AS_PROD_RC=$?"'` (SEC RB-07: in mã thoát của `cmp`, không gộp "khác" với "chưa so được") | `STG_WEBHOOK_SIZE=0` (Chat staging tắt) → đạt, bỏ qua `RC`. Kích thước > 0 và `STG_SAME_AS_PROD_RC=0` (trùng webhook production) → **dừng**. `RC=1` (khác production) và kích thước > 0 → cần INV trả lời "có" cho câu "webhook staging trỏ vào phòng Chat thử, không phải phòng thật?". ORC ghi giờ + "có" vào biên bản, không ghi tên phòng hay URL. `RC` khác 0/1 (2 = không đọc được, hoặc `sudo -n` bị từ chối) hay `STG_WEBHOOK_SIZE=ERR` → coi là `ERR`, chỉ còn câu hỏi INV ở trên. INV trả lời "không", hoặc `RC=0` → **dừng**: làm rỗng webhook staging theo 13.2 (dòng trống) rồi mới sang S6 |
| S1 | Làm mới gói `infra/` staging từ `⟨SHA_L⟩` (khuôn P2b dưới đây, đường dẫn `/opt/ottimo` và `/root/ottimo-staging-bundles`) | `STAGING: CAU HINH MOI DA VAO`, `CAU HINH: OK` |
| S2 | Duyệt `deploy staging` của `⟨CI_RUN_L⟩` (0.2 bước 5) | Job xanh; staging `current_tag` = `⟨TAG_L⟩`; K2 (đường dẫn staging) ra 69 migration và các dòng 0092 |
| S3 | Landing `⟨TAG_L⟩` lên staging: job `deploy landing preview (staging)` của `⟨CI_RUN_L⟩` (nếu `LANDING_PREVIEW_DEPLOY=true`), hoặc ORC chạy `deploy-landing.sh ⟨TAG_L⟩` trên `/opt/ottimo`. Staging phải có `LANDING_PUBLIC_API=on` cho C8 (nếu đang `off`: `ENVSET` dạng `LANDING_PUBLIC_API=on` trên `/opt/ottimo`, chỉ staging) | `[landing …] privacy: en 2026-11-04 (not published yet) vi 2026-11-04 (not published yet) ko … zh … ru …`, rồi `OK: landing ⟨TAG_L⟩ is live` |
| S4 | `publish-privacy-notice.sh` trên staging: chạy thử rồi `--apply`, `--version ⟨NOTICE_V⟩` (lệnh P10 với `/opt/ottimo`; trước đó `CHKV` với `E=/opt/ottimo`, `RA=⟨SHA_L⟩`, `RL=⟨SHA_L⟩`, `RUN=DOC`: `RUN_TAG` = `⟨TAG_L⟩` đọc từ staging, `D2_CHAT_CONST=CO`) | `DRY RUN OK`, rồi `OK: version 2026-11-04 published (en vi ko zh ru)`. Ghi 5 băm `sha_<xx>` (12 ký tự) – **phải trùng** 5 băm FE-B báo khi đổi nhãn (SEC LPV2M-02) |
| S5 | `ENVSET LANDING_LOCALES en,vi,ko,zh,ru` + `REDEPLOY` (đường dẫn staging) | `LINES=1`, `VALUE_OK=1`; `OK: ⟨TAG_L⟩ is live`; `form-token` của staging 200 |
| S6 | **QA – C8 (D5):** 12 ca SEC 9.5 (`rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` 9.5) + ca BE-01 **qua Caddy thật của staging**, gồm **ca 6**: IP khách tới api qua `TRUST_PROXY` (hai máy/hai mạng khác nhau phải có bộ đếm riêng; `X-Forwarded-For` giả bị thay). Kèm P9 (Lighthouse 5 ngôn ngữ), P10 (smoke: BUG-R4-011/012 trên stack thật, form 5 ngôn ngữ, 13 ca giá theo bảng Desk), P11 nếu chữ đổi. QA bật `public_show_prices` trên staging bằng tài khoản OWN thử cho ca giá | QA ghi kết quả từng ca vào `rounds/round-04/qa/` (không dữ liệu thật); 0 ca đỏ. Ca 6 đỏ → **dừng** cả đợt, báo OPS + SEC (mọi khách sẽ chung một bộ đếm 30/10 phút) |
| S7 | **Diễn tập quay lui landing (mục 5.2) trên staging:** `ENVSET LANDING_LOCALES en,vi` + `REDEPLOY` → `deploy-landing.sh --rollback` → kiểm → lên lại `deploy-landing.sh ⟨TAG_L⟩` → `ENVSET LANDING_LOCALES en,vi,ko,zh,ru` + `REDEPLOY` | Lúc lùi: `WARNING: older privacy notice version than the published one …`, `OK: landing <bản trước> is live`, form en/vi của bản cũ gửi được (trong 7 ngày). Lúc lên lại: `privacy: en 2026-11-04 (same bytes as published) …` (5 ngôn ngữ), `OK: landing ⟨TAG_L⟩ is live`. Ghi giờ, dòng `[landing` vào biên bản |
| S8 | `ops-check.sh` đầy đủ trên staging (`/opt/ottimo`) | Các dòng như K7. `priceswitch` FAIL một lượt vì QA đổi công tắc ở S6 là đúng |

Biên bản staging: `rounds/round-04/outputs/OPS/lp-v2-staging-drill.md` (S0–S8, số thật, không digest đầy đủ). Sau S8: **không duyệt deploy staging của lượt CI sau** tới khi production xong K7 (giữ staging = production, như ĐK7 v1.0.3).

---

## 4. Các bước production

Thời lượng: P0–P7 khoảng 40 phút (gồm Release app). P8–K6 khoảng 40 phút, liên tục một phiên. F2 khi OWN sẵn sàng (có thể ngày khác).

### P0. Điều kiện vào – Ai chạy: ORC

**Điều kiện đăng D1–D7 (SEC `SEC-on-lp-v2-main.md` mục 4) – bảng bắt buộc.** ORC điền mỗi ô `CO`/`CHUA` + giờ + căn cứ (tệp review, dòng decision-log). Không ghi email, IP hay bí mật.

| # | Điều kiện (SEC mục 4) | Ai | Bước kiểm trong runbook | ORC điền |
|---|---|---|---|---|
| D1 | Thẻ SEC LPV2M-01 + 02 + 03 Done; CI PR `lp-v2-main` → `main` xanh trên đúng đầu nhánh, gồm `pnpm audit` và gitleaks lịch sử | BE, FE-B, OPS, ORC | Thẻ 01–03 Closed: `SEC-on-lp-v2-main.md` mục 8.1. CI PR: số run + `headSha` = đầu PR (QC G1) trong decision-log (SEC RB-01) | |
| D2 | Bản api **đang chạy** trên production có `CHAT_DETAILS_MIN_NOTICE_VERSION` = **đúng nhãn đăng ở P10** (`⟨NOTICE_V⟩`, hiện `2026-11-04`), vì production chưa có dòng nào của hằng (lần đăng đầu nêu Google Chat; mục 0 "Nhãn thông báo" (a)) (QA đọc mã của tag) | QA | `CHKV` ở 0.2 bước 3, P4 và P10 bước 0. Ô này lấy kết quả **P10 bước 0** (`RUN=DOC`, `RA_IMAGE` = `RUN_TAG` = `current_tag` production, SEC RB-03); chỉ `D2_CHAT_CONST=CO` mới điền `CO` | |
| D3 | P2 (`retention.web_request_ip_hmac_days` ≤ 30), P3 (thành viên phòng Chat chỉ OWN/MGR/FDL/FD), P4 (sổ tay WR8 + lịch xóa phòng Chat hằng năm) của notice-final mục 5 vẫn đúng **tại ngày đăng** | OPS, INV, BA | P2 dòng 9 (OPS đọc số); INV nhắn xác nhận P3; BA chỉ chỗ trong sổ tay + INV xác nhận lịch. SEC chấp nhận (mục 8.4 Q1) với điều kiện ORC ghi decision-log trước P10 (giờ, nội dung P3/P4, không tên/email/SĐT); P10 trễ sang ngày khác thì xác nhận lại | |
| D4 | Thứ tự trong cùng một phiên: api có 0092 → `deploy-landing.sh` image LP-v2 → `publish-privacy-notice.sh` chạy thử rồi `--apply` (5 ngôn ngữ, băm khớp trang sống) → rồi mới `LANDING_LOCALES=en,vi,ko,zh,ru` → `form-token` 200 | OPS | P6 → P8/P9 → P10 → F1 → K5, làm liền | |
| D5 | QA chạy lại 12 ca SEC 9.5 (C8) trên **staging qua Caddy thật**, gồm ca IP khách đến api qua `TRUST_PROXY` | QA | S6 | |
| D6 | `public_show_prices` vẫn `false` tới khi OWN bật; `ops-check priceswitch` đã lấy mốc | OPS, INV | P2b bước 4 (mốc), K2 dòng 6, K7, F2 | |
| D7 | Chỉ đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` sau khi `2026-11-04` đã đăng **và** SEC xác nhận ★1–★8 trong decision-log | OPS, SEC | Ngoài runbook này; K8 xác nhận vẫn mức A | |

Điều kiện P1–P6 của notice-final mục 5, áp cho lượt đăng LP-v2 (SEC LPV2M-03):

| # | Điều kiện | Trạng thái / bước | ORC điền |
|---|---|---|---|
| P1 | K1 đạt (xóa được tin webhook trong phòng Chat, tìm theo `REQ-…`) | Đã đạt 03/11 (decision-log "K1 – ĐẠT"). K1 chỉ còn giá trị khi phòng Chat và webhook production **không đổi** từ 03/11 (README 13.5). Ngày đăng, ORC hỏi INV có/không: "phòng Chat và webhook production có đổi từ 03/11 không?". Không đổi → `CO`. Có đổi → `CHUA`, làm lại K1 theo README 13.5 trước P10 (SEC RB-04) | |
| P2 | `retention.web_request_ip_hmac_days` production ≤ 30 | P2 dòng 9 | |
| P3 | Phòng Chat thật chỉ OWN, MGR, FDL, FD (@ottimo.vn), không SAL/CTV | INV xác nhận trong chat ngày đăng | |
| P4 | Sổ tay có WR8 (xóa tay tin Chat trong 24 giờ) + xóa cả phòng Chat mỗi năm có ngày cố định trong lịch OWN | BA chỉ mục sổ tay, INV xác nhận lịch | |
| P5 | Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` = **`⟨NOTICE_V⟩`** (nhãn đăng ở P10, hiện `2026-11-04`; v1.0.3 là `2026-10-31`) trên bản api đang chạy. Đây là lần đăng đầu nêu Google Chat trên production (`CONST_ROWS=0`); các lượt đổi chữ sau này không đòi điều này (mục 0 (b)) | = D2 | |
| P6 | Deploy landing rồi `publish-privacy-notice` chạy thử → `--apply` cùng phiên; `form-token` 200; băm **5** trang khớp | P9, P10, K5 | |

Cổng khác:
- [ ] QC LP-v2 **QC rút gọn** (gate 6.3) trên `⟨SHA_L⟩` ra ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN, điều kiện "trước Release" xong. P1 (người bản xứ) INV bỏ 04/11; P2 (luật sư) xong 04/11; P3 nhãn = `2026-11-04`; P4 đổi nghĩa theo SEC.
- [ ] Biên bản staging S0–S8 ĐẠT (gồm S6 = D5, S7 diễn tập quay lui).
- [ ] P8 QC (`public_room_type` production) đọc ở P2 dòng 10.
- [ ] Không có lượt Release nào `in_progress`/`waiting`; không có lượt deploy production khác trong ngày (v1.0.4 không chồng lên).
- [ ] Khung giờ: ngoài khung nhận/trả phòng; INV (OWN) liên lạc được trong 1 giờ sau P10 cho K6.

**Dừng nếu** một ô D1–D6 hoặc P1–P6 là `CHUA` (D7 không chặn: chỉ chặn việc đặt mức C). Ô D2/P5: ở P0 điền theo `CHKV` của 0.2 bước 3; ở P10 bước 0 ghi thêm kết quả `CHKV` đọc api đang chạy (giờ + `RUN_TAG`). Đó mới là bằng chứng D2 cuối cùng. `KHONG` ở P10 bước 0 thì không đăng.

### P1. Kiểm commit sẽ tag – Ai chạy: ORC (Mac)

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin --tags && S=⟨SHA_L⟩ \
 && git merge-base --is-ancestor "$S" origin/main && echo "SHA_L IN MAIN" \
 && git merge-base --is-ancestor "$(git rev-parse 'v1.0.3^{commit}')" "$S" && echo "V103 IN SHA_L" \
 && git diff --name-only v1.0.3 "$S" -- product/infra .github | sort; echo "END INFRA v1.0.3..SHA_L" \
 && git diff --name-only v1.0.3 "$S" -- product/services/api/src/db/migrations | sort; echo "END MIGRATIONS"
```
**Đúng là:** `SHA_L IN MAIN`; `V103 IN SHA_L`; danh sách infra = 16 tệp của mục 1.3 (cộng tệp README/SQL chú thích của thẻ LPV2M-01/03); migration chỉ có `0092_lp_v2_price_estimate_locales.sql`, `meta/0092_snapshot.json`, `meta/_journal.json`.
**Dừng nếu** có migration khác (v1.0.4 đã lọt vào `⟨SHA_L⟩` – sai commit), hoặc infra có tệp ngoài danh sách (compose/roles/secrets mới): OPS soạn bổ sung trước.

### P2. Kiểm trước, chỉ đọc – Ai chạy: ORC

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc ps --format "table {{.Service}}\t{{.Image}}\t{{.Status}}" && sudo -n -u ottimo sh -c "cd /opt/ottimo-prod/state && echo current=\$(cat current_tag) previous=\$(cat previous_tag) landing=\$(cat landing_tag) && test -r digests/sha-da6d6f3dc22b && echo DIGEST_V103=CO; test -r digests/landing-sha-72f9ac8e2b33 && echo DIGEST_LANDING_V111=CO; echo PN_APPLY_1024=\$(grep -cE \" apply .*version=2026-10-24 .*rc=0\" privacy-notice.log); echo PN_OTHER=\$(grep -cE \"version=2026-1(0-31|1-01|1-04)\" privacy-notice.log)" && echo "LOCALES_LINES=$(sudo -n -u ottimo grep -c "^LANDING_LOCALES=" /opt/ottimo-prod/.env)" && echo "PUBLIC_API_ON=$(sudo -n -u ottimo grep -cx "LANDING_PUBLIC_API=on" /opt/ottimo-prod/.env)" && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh containers http5xx disk mem'
```
**Đúng là:**
- `api`/`web`/`worker` = `sha-da6d6f3dc22b`, `landing` = `sha-72f9ac8e2b33`, healthy;
- `current=sha-da6d6f3dc22b previous=sha-e5fffe05ed55 landing=sha-72f9ac8e2b33`;
- `DIGEST_V103=CO` (quay lui app được), `DIGEST_LANDING_V111=CO` (quay lui landing được – thiếu thì xem mục 5.2 ghi chú);
- `PN_APPLY_1024` ≥ 1, `PN_OTHER=0`;
- `LOCALES_LINES=0` (chưa đặt = `en,vi`; nếu là `1` thì giá trị phải là `en,vi`: kiểm bằng `grep -cx "LANDING_LOCALES=en,vi"`), `PUBLIC_API_ON=1`;
- 4 dòng `ok`.

`SQLRO` với:
```sql
SHOW default_transaction_read_only;
SELECT count(*), max(created_at) FROM drizzle.__drizzle_migrations;
SELECT version || '|' || locale || '|' || (superseded_at IS NULL) FROM privacy_notice_version ORDER BY version, locale;
SELECT count(*) FROM config_parameter_def WHERE key IN ('public_show_prices', 'web_estimate.open_until');
SELECT tgname || '|' || tgenabled FROM pg_trigger WHERE tgrelid = 'privacy_notice_version'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT count(*) FROM website_booking_request WHERE locale NOT IN ('vi', 'en', 'ru');
SELECT count(*) FROM config_parameter WHERE key = 'public_booking_requests_enabled' AND value = 'true'::jsonb AND effective_from <= current_date;
SELECT coalesce((SELECT value::text FROM config_parameter WHERE key = 'retention.web_request_ip_hmac_days' AND effective_from <= current_date ORDER BY effective_from DESC LIMIT 1), (SELECT default_value::text FROM config_parameter_def WHERE key = 'retention.web_request_ip_hmac_days'));
SELECT count(*), count(public_room_type), count(DISTINCT public_room_type) FROM room;
```
**Đúng là** (đúng thứ tự):
1. `on`;
2. `68|1792782171681`;
3. đúng hai dòng `2026-10-24|en|t`, `2026-10-24|vi|t` (SEC: production chỉ có `2026-10-24`);
4. `0` (0092 chưa chạy);
5. `privacy_notice_version_append_only|O`, `privacy_notice_version_no_truncate|O`;
6. `0`;
7. `1` (form website đang bật – nếu `0`: form tắt, vẫn đi tiếp, K5/K6 đổi kỳ vọng: báo ORC);
8. **dòng 9 (D3/P2)**: một số ≤ `30` (mặc định `30`; khung cho phép 7–30). Ghi số;
9. **dòng 10 (QC P8)**: `10|10|4` (10 căn, đủ nhãn công khai, 4 hạng). Khác: ghi số, DOM + OWN xem; **không** chặn P3–K6 (giá còn tắt), **chặn F2**.

**Dừng nếu:** `current` ≠ `sha-da6d6f3dc22b`; thiếu `DIGEST_V103`; migration ≠ 68; dòng 3 có nhãn khác `2026-10-24` hoặc `2026-10-24` không còn hiệu lực; `PN_OTHER` ≠ 0; trigger ≠ `O`; có `FAIL`.

### P2b. Làm mới gói `infra/` production – Ai chạy: ORC

Đúng khuôn P2b runbook v1.0.3 (bước 1–4, README 13.1), gói lấy từ **`⟨SHA_L⟩`**:
1. Mac: `git archive --format=tar.gz -o /tmp/ottimo-infra.tgz ⟨SHA_L⟩ product/infra`, `scp`, `shasum -a 256` (ghi 12 ký tự).
2. Máy chủ: kiểm băm trùng; kiểm gói mới có LP-v2:
   ```bash
   ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sha256sum ~/ottimo-infra.tgz && rm -rf ~/ottimo-bundle && mkdir -m 700 ~/ottimo-bundle && tar -xzf ~/ottimo-infra.tgz -C ~/ottimo-bundle && B=~/ottimo-bundle/product/infra && grep -cE "check_price(limit|gap|switch)\(\)" $B/server/bin/ops-check.sh && grep -c "price-estimate" $B/caddy/Caddyfile.landing && grep -c "LANDING_LOCALES" $B/docker-compose.prod.yml && grep -c "2026-11-04" $B/server/publish-privacy-notice.sql'
   ```
   **Đúng là:** băm trùng bước 1; `3`; số ≥ 1; số ≥ 1; `1` (chú thích SQL theo trạng thái thật – thẻ LPV2M-03).
3. Thay gói, giữ bản cũ ở `/root/ottimo-prod-bundles/infra-<giờ>` (lệnh bước 3 v1.0.3, nguyên văn). **Đúng là:** `BAN CU GIU O: …`, `PRODUCTION: CAU HINH MOI DA VAO`. Ghi đường dẫn bản cũ vào decision-log.
4. Cấu hình + mốc `priceswitch` (D6):
   ```bash
   ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n /opt/ottimo-prod/infra/server/bin/init-secrets.sh | head -n 1 && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc --profile deploy config -q && echo "CAU HINH: OK" && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh priceswitch pricelimit pricegap containers'
   ```
   **Đúng là:**
   ```
   init-secrets: nothing to do – all files exist in /opt/ottimo-prod/secrets
   CAU HINH: OK
   ok   priceswitch: public_show_prices: first run, changes are reported from now on
   ok   pricelimit: 0 price estimates refused (429/503) in 60 min
   ok   pricegap: every room had a list price for the website estimate (24 h)
   ok   containers: postgres api worker web landing running, api healthy
   ```
   Dòng `priceswitch` là **mốc D6**. Nếu ra `public_show_prices not changed since the last check` thì mốc đã có từ trước – cũng đạt. Ghi giờ vào ô D6.
   **Dừng nếu** `init-secrets` in `created …`, không `CAU HINH: OK`, hoặc có `FAIL`: quay lui gói bằng Q2 (`v1.0.1-inv-commands.md`) với bản ở bước 3.

### P3. Sao lưu ngay trước Release – Ai chạy: ORC

```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/backup.sh 2>&1 | tail -n 3'
```
**Đúng là:** dòng cuối `[backup 2026-11-…Z] OK: <số> encrypted files in /var/backups/ottimo-prod` (bản sao gồm `privacy-notice-<stamp>.log.age`, README 13.6). Ghi giờ UTC kèm "68, trước 0092, thông báo 2026-10-24".
**Dừng nếu** không có `OK:`.

### P4. Gắn tag app và push – Ai chạy: ORC (Mac)

```bash
cd /Users/anhvh/Desktop/hotel-app \
 && git tag -a ⟨APP_TAG⟩ ⟨SHA_L⟩ -m "⟨APP_TAG⟩ – LP-v2 server + Desk (migration 0092 price estimate + locales, OpenAPI 0.3.11, public price route, LANDING_LOCALES; CHAT_DETAILS_MIN_NOTICE_VERSION ⟨NOTICE_V⟩). Same images as staging ⟨TAG_L⟩ (CI ⟨CI_RUN_L⟩). Runbook: rounds/round-04/outputs/OPS/lp-v2-release-runbook.md." \
 && git rev-parse '⟨APP_TAG⟩^{commit}' && echo "sha-$(git rev-parse --short=12 '⟨APP_TAG⟩^{commit}')" \
 && echo "TAG LOCAL OK – run CHKV before push"
```
Rồi `CHKV` với `E=/opt/ottimo-prod`, `RA=⟨APP_TAG⟩`, `RL=⟨SHA_L⟩` (commit của landing sẽ tag ở P8), `RUN=⟨TAG_L⟩` (SEC RB-03: ảnh của tag app phải là `⟨TAG_L⟩`, ảnh đã chạy trên staging). Chỉ khi ra `D2_CHAT_CONST=CO`: `git push origin ⟨APP_TAG⟩`.
**Đúng là:** `⟨SHA_L⟩`; `⟨TAG_L⟩`; `TAG LOCAL OK …`; `CHKV` in `RA_IMAGE=⟨TAG_L⟩ RUN_TAG=⟨TAG_L⟩ CONST_ROWS=0` và `D2_CHAT_CONST=CO` (D2 – QA xác nhận cùng dòng này); `* [new tag] ⟨APP_TAG⟩ -> ⟨APP_TAG⟩`.
**Dừng nếu** commit khác `⟨SHA_L⟩` hoặc `D2_CHAT_CONST=KHONG`: `git tag -d ⟨APP_TAG⟩`, **không** push.

### P5. Release app: kiểm `resolve`, rồi duyệt – Ai chạy: ORC

Lệnh như P5 runbook v1.0.3 (thay `v1.0.3` bằng `⟨APP_TAG⟩`, `headSha` = `⟨SHA_L⟩`). **Đúng là:** `resolve` `completed / success`, `deploy production` `waiting`; một dòng `release ⟨APP_TAG⟩ → ⟨TAG_L⟩ api@… web@…`, hai digest trùng dạng rút gọn ở 0.1. Rồi duyệt (`environment_ids[]=25137151508`, comment `⟨APP_TAG⟩ – INV standing approval 04/11`) và `gh run watch`.
**Dừng nếu** `resolve` đỏ hoặc digest lệch: không duyệt, báo OPS + SEC.

### P6. Đọc kết quả deploy app – Ai chạy: ORC

Như P6 v1.0.3. **Đúng là:** `deploy ⟨TAG_L⟩: ok`, `WATCH EXIT: 0`. Khác: mục 6. Không Re-run.

### P7 = K1, K2 (app) – xem mục K. Đạt K1 + K2 mới sang P8.

### P8. Landing: kiểm image trước, rồi tag – Ai chạy: ORC

1. Kiểm trước, không đổi gì (README 12.3 "Trước khi INV duyệt một lượt landing"). Digest landing đọc từ artifact của `⟨CI_RUN_L⟩` vào biến trên Mac rồi truyền vào lệnh, không gõ chữ:
   ```bash
   cd /Users/anhvh/Desktop/hotel-app && R=anhvh93-tech/ottimo-hotel-app-public && d=$(mktemp -d) && gh run download ⟨CI_RUN_L⟩ -R $R -n image-digests -D "$d" && L=$(sed -n 's/^landing=//p' "$d/image-digests.txt") && rm -rf "$d" && [[ "$L" =~ ^sha256:[0-9a-f]{64}$ ]] && echo "landing=$(printf %s "$L" | cut -c8-15)…" && ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn "cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh ⟨TAG_L⟩ --digest $L --check-only 2>&1 | grep -E '^\[landing '"
   ```
   **Đúng là:** `landing=` + 8 ký tự đầu của `LANDING_DIGEST`; các dòng `[landing …]` không có `FAIL`; dòng `privacy: en 2026-11-04 (not published yet) vi 2026-11-04 (not published yet) ko 2026-11-04 (not published yet) zh 2026-11-04 (not published yet) ru 2026-11-04 (not published yet)`; dòng nhắc chạy `publish-privacy-notice.sh`; cuối `CHECK ONLY: ⟨TAG_L⟩ passes the config, digest and privacy checks – nothing switched or recorded`.
   **Dừng nếu** có `FAIL: … older privacy notice version` (nhãn trong image không phải `2026-11-04`), `FAIL: privacy page bytes changed …`, hoặc thiếu ngôn ngữ nào.
2. Gắn tag landing trên **cùng** commit:
   ```bash
   cd /Users/anhvh/Desktop/hotel-app && git tag -a ⟨LANDING_REL⟩ ⟨SHA_L⟩ -m "⟨LANDING_REL⟩ – LP-v2 landing en/vi/ko/zh/ru + price estimate; privacy notice 2026-11-04 (en/vi = lawyer-reviewed PR #21 text, ko/zh/ru Δ5 SEC). Image ⟨TAG_L⟩ as on staging." && echo "sha-$(git rev-parse --short=12 '⟨LANDING_REL⟩^{commit}')" && git push origin ⟨LANDING_REL⟩
   ```
   **Đúng là:** `⟨TAG_L⟩`; `* [new tag] …`.

### P9. Release landing – Ai chạy: ORC (bắt đầu phiên liền P9 → P10 → F1 → K5)

Như P5/P6 với `⟨LANDING_REL⟩`: `resolve` in `release ⟨LANDING_REL⟩ → landing ⟨TAG_L⟩ @…` (digest rút gọn trùng 0.1). Duyệt, `gh run watch`. Job `deploy production` in `landing ⟨TAG_L⟩: ok`. ORC ghi **giờ P9**.
**Ngay sau đó** (không chờ): P10.

### P10. Đăng thông báo `⟨NOTICE_V⟩` cho 5 ngôn ngữ – Ai chạy: ORC

Bước 0 (Mac, BUG-R4-028, SEC RB-03): `CHKV` với `E=/opt/ottimo-prod`, `RA` = tag app của bản api production (`⟨APP_TAG⟩`; đường phụ 1.2: tag v1.0.4), `RL` = commit của tag landing vừa phát hành (`⟨LANDING_REL⟩`), `RUN=DOC` (lệnh tự đọc `state/current_tag` production trong cùng lệnh, ORC không gõ tag). **Đúng là:** `RA_IMAGE` = `RUN_TAG` (= `current=` của K1; đường chính `⟨TAG_L⟩`), `CONST_ROWS=0`, `D2_CHAT_CONST=CO`. Ghi giờ + dòng này vào ô D2/P5. `KHONG` → **không** đăng. Đọc dòng trên để biết lý do: `RA_IMAGE` ≠ `RUN_TAG` thì gõ nhầm tag hoặc có bản khác (hotfix) đang chạy, nên K1 lại rồi chạy lại với đúng tag. Hằng ≠ nhãn thì api không trỏ vào nhãn sắp đăng, Chat sẽ giữ mức A mãi: báo BE + SEC (sửa hằng, Release api). Trong lúc đó landing mới vẫn chạy, form hiện khối Zalo/gọi tới khi đăng.

Chạy thử:
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd /tmp && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh --landing-tag "$(sudo -n -u ottimo cat /opt/ottimo-prod/state/landing_tag)" --version ⟨NOTICE_V⟩ --property DLT --operator ⟨OPERATOR⟩ 2>&1 | grep -vE "^\s*$"'
```
**Đúng là** (thứ tự có thể khác, không có `ERROR`):
- 5 dòng `dry-run (would): INSERT privacy_notice_version (… version=2026-11-04, locale=<xx>, body_sha256=…)` cho en, vi, ko, zh, ru;
- `dry-run (would): supersede version 2026-10-24 (en)` và `dry-run (would): supersede version 2026-10-24 (vi)` – **chỉ** hai dòng này (SEC LPV2M-03: không có dòng `2026-10-31`);
- dòng `readiness: …`, `RESULT: dry-run-ok …`, cuối `DRY RUN OK – nothing written. Re-run with --apply to publish.`

Rồi ghi thật (thêm `--apply`, cùng lệnh). **Đúng là:**
- `apply: supersede version 2026-10-24 (en)`, `apply: supersede version 2026-10-24 (vi)`;
- `apply: audit_event security privacy_notice.published (operator …)`;
- cuối **`OK: version 2026-11-04 published (en vi ko zh ru); OWN may now switch the form on (Desk H05)`**.

ORC ghi **giờ C** (giờ dòng `OK:`) – mốc 7 ngày của quay lui landing (mục 5.2). Ghi 5 băm (12 ký tự, từ dòng `apply … sha_<xx>=` cuối của `state/privacy-notice.log`) và so với 5 băm của S4 (staging) và báo cáo FE-B: phải trùng.
**Dừng nếu:**
- `refused: … not published yet … deploy the api with the LP-v2 migration first` → K2 chưa đạt, quay lại K2;
- `refused: … live page … differs` hoặc không ra 200 → trang sống khác image: không `--apply`, báo OPS;
- `refused: a later version is active …` hoặc có dòng supersede khác `2026-10-24` → trạng thái không như P2, dừng, báo SEC;
- `--apply` lỗi: giao dịch một lần, không có gì được ghi; chạy lại chạy thử để đọc lỗi. **Không** SQL tay.

### F1. Lật `LANDING_LOCALES` (D4: sau P10) – Ai chạy: ORC

1. `ENVSET LANDING_LOCALES en,vi,ko,zh,ru` (mục 2). **Đúng là:** `LINES=1`, `VALUE_OK=1`, `ottimo 600`.
2. `REDEPLOY` (mục 2). **Đúng là:** `tag=⟨TAG_L⟩`, `migrations: 69 applied / 69 …`, `OK: ⟨TAG_L⟩ is live`, `MA THOAT: 0`. Desk gián đoạn 15–30 giây.
3. Ngay sau đó K5 (`form-token` 200).

**Dừng nếu** `REDEPLOY` lỗi ở `appconfig` (api từ chối giá trị): trả `.env` về bản sao, `REDEPLOY` lại, báo OPS. Form en/vi vẫn chạy (thông báo đã đăng), ko/zh/ru hiện khối Zalo/gọi (`PUBLIC_FORM_NOT_READY`) – chấp nhận được trong lúc sửa.

### F2. Bật `public_show_prices` (cuối cùng) – Ai làm: OWN (INV) trên Desk; ORC kiểm

Chỉ khi **tất cả**:
- K1–K8 đạt; QC P6 (OWN đã chuyển Desk sang bảng giá mới, `long_stay_required_from_nights = 30` khớp `shortMaxNights` 29 của landing) và P7 (ESC-045 câu 1 đã trả lời, `weekend_uplift_pct`/`special_uplift_pct` đã đặt);
- P2 dòng 10 = `10|10|4` (QC P8);
- QA đã chạy 13 ca giá trên staging với **cùng** bảng đã nhập trên production (S6), và đối chiếu giá Desk production cho 3 ca mẫu (đọc Desk, không bật giá);
- mốc `priceswitch` đã lấy (P2b bước 4).

OWN: Desk → H05 → `public_show_prices` = bật, lý do "LP-v2 – giá công khai". Sau đó ORC:
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh priceswitch pricelimit pricegap'; curl -s -o /dev/null -w "price=%{http_code}\n" "https://ottimo.vn/v1/public/properties/dlt/price-estimate?arrival=⟨ngày +14⟩&departure=⟨ngày +16⟩&adults=2"
```
**Đúng là:** `FAIL priceswitch: Desk switch public_show_prices changed 1 time(s) since the last check (now: true) – check it was intended …` (**một lần, đúng ý**; lượt sau về `ok`); `pricelimit` `ok`; `pricegap` `ok`; `price=200` (trong khoảng 2 phút sau khi bật; trước đó 404). Tên tham số query theo `parseEstimateQuery` – QA đưa dạng đúng từ S6.
QA mở trang chủ 5 ngôn ngữ trên điện thoại thật: khối giá hiện, số = Desk cho cùng ngày/khách.
**Dừng (OWN tắt lại ngay) nếu** số web ≠ Desk, hoặc `pricegap` FAIL (căn thiếu giá niêm yết).

---

## K. Kiểm sau phát hành

### K1. Image, state, digest – app (sau P6) – Ai chạy: ORC
Lệnh K1 v1.0.3 (thay tag). **Đúng là:** `api`, `web` = `…:⟨TAG_L⟩` healthy; `worker` = `ottimo-api:⟨TAG_L⟩`; `landing` vẫn `sha-72f9ac8e2b33`; `postgres` không khởi động lại; `current=⟨TAG_L⟩ previous=sha-da6d6f3dc22b`; `digests/⟨TAG_L⟩` trùng 0.1 (so 8 ký tự đầu, không in đủ).

### K2. Migration 0092 (READ ONLY, sau P6) – Ai chạy: ORC
`SQLRO` với:
```sql
SHOW default_transaction_read_only;
SELECT count(*), max(created_at) FROM drizzle.__drizzle_migrations;
SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1;
SELECT conname || '|' || (pg_get_constraintdef(oid) LIKE '%''ko''%' AND pg_get_constraintdef(oid) LIKE '%''zh''%') FROM pg_constraint WHERE conname IN ('privacy_notice_version_locale_check', 'website_booking_request_locale_check', 'website_booking_request_price_estimate_check') ORDER BY conname;
SELECT count(*) FROM information_schema.columns WHERE table_name = 'website_booking_request' AND column_name = 'price_estimate';
SELECT key || '|' || default_value::text || '|' || edit_roles::text FROM config_parameter_def WHERE key IN ('public_show_prices', 'web_estimate.open_until') ORDER BY key;
SELECT count(*) FROM config_parameter WHERE key = 'public_show_prices';
SELECT tgname || '|' || tgenabled FROM pg_trigger WHERE tgrelid = 'privacy_notice_version'::regclass AND NOT tgisinternal ORDER BY tgname;
SELECT version || '|' || locale || '|' || (superseded_at IS NULL) FROM privacy_notice_version ORDER BY version, locale;
```
**Đúng là:**
1. `on`;
2. `69|1792782173681` (= `WHEN_0092`);
3. = `HASH_0092`, so thẳng (ARC xác nhận 04/11, G7: drizzle-orm 0.45.4 lưu sha256 nội dung tệp SQL, trùng `shasum -a 256` của tệp);
4. `privacy_notice_version_locale_check|t`, `website_booking_request_locale_check|t`, `website_booking_request_price_estimate_check|f` (CHECK này không nói về locale – chỉ cần có dòng). ARC Q3: `LIKE` là đủ, không so nguyên văn (`pg_get_constraintdef` in dạng chuẩn hóa, có thể khác giữa các bản PostgreSQL). Thiếu CHECK thì thiếu dòng, vẫn lộ ra. r2 giữ `LIKE`;
5. `1`;
6. `public_show_prices|false|{owner}`, `web_estimate.open_until|"2027-01-01"|{owner,manager}`;
7. `0` (**D6**: chưa ai đặt, hiệu lực = `false`);
8. hai trigger `|O`;
9. vẫn đúng hai dòng `2026-10-24|en|t`, `2026-10-24|vi|t` (chưa đăng).

**Dừng nếu** migration ≠ 69 hoặc trigger ≠ `O` (báo ARC + SEC, không quay lui vội: v1.0.3 chạy được trên DB 69); dòng 7 ≠ 0 (ai đó đã bật giá – OWN tắt, báo SEC).

### K3. Landing (sau P9) – Ai chạy: ORC
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo sh -c "cd /opt/ottimo-prod/state && echo landing=\$(cat landing_tag) previous=\$(cat landing_previous_tag) && test -r digests/landing-⟨TAG_L⟩ && echo DIGEST_LANDING=CO"'; for u in / /vi/ /ko/ /zh/ /ru/ /privacy/ /vi/privacy/ /ko/privacy/ /zh/privacy/ /ru/privacy/ /ko/khong-co /zh/khong-co /ja/; do printf "%s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "https://ottimo.vn$u"; done; curl -s -o /dev/null -w "price_before_F2=%{http_code}\n" "https://ottimo.vn/v1/public/properties/dlt/price-estimate?arrival=⟨ngày +14⟩&departure=⟨ngày +16⟩&adults=2"
```
**Đúng là:** `landing=⟨TAG_L⟩ previous=sha-72f9ac8e2b33`, `DIGEST_LANDING=CO`; 10 trang đầu `200`; 3 dòng cuối `404`; `price_before_F2=404` (công tắc tắt).

### K4. Thông báo đã đăng (sau P10, READ ONLY) – Ai chạy: ORC
`SQLRO` với dòng 9 của K2. **Đúng là:** 7 dòng: `2026-10-24|en|f`, `2026-10-24|vi|f`, `2026-11-04|en|t`, `2026-11-04|ko|t`, `2026-11-04|ru|t`, `2026-11-04|vi|t`, `2026-11-04|zh|t`. Không có `2026-10-31`, `2026-11-01`.

### K5. `form-token` (sau F1, D4) – Ai chạy: ORC
```bash
curl -s -o /dev/null -w "form_token=%{http_code} %{content_type}\n" https://ottimo.vn/v1/public/properties/dlt/form-token
```
**Đúng là:** `form_token=200 application/json…`. `404` HTML = proxy đóng (`LANDING_PUBLIC_API` ≠ `on`); `404 application/problem+json` = form website đang tắt trên Desk (P2 dòng 7 = 0). Cả hai: dừng, báo OPS.

### K6. Yêu cầu thử trên production – Ai chạy: QA gửi, OWN xóa, ORC đếm
Theo README 12.3 bước 8: QA gửi **một** yêu cầu "TEST OTTIMO" ở trang **`/ko/`** (ngôn ngữ mới; kênh Email, hộp thư chung của khách sạn, không SĐT, lời nhắn "TEST"). Đúng là: trang báo đã nhận, mã `REQ-…`. Tin Chat mức A tới phòng (chỉ mã, giờ, link Desk). Desk: yêu cầu có cột ngôn ngữ `ko`.
Rồi OWN xóa yêu cầu theo WR8 và xóa tin Chat; ORC đếm READ ONLY: `cd / && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/us155-smoke-counts.sh --ref REQ-XXXXXXXX --since <giờ P9, có múi giờ>` → `RESULT: OK – 14/14`.
Thêm (chỉ đọc): trang `/ru/`, `/zh/`, `/vi/`, `/` mở form, lấy được form-token (QA xem trên trình duyệt, không gửi).

### K7. `ops-check.sh` đầy đủ – Ai chạy: ORC
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh'; echo "EXIT: $?"
```
**Đúng là:** **14** dòng `ok`, `EXIT: 0`: 11 kiểm của v1.0.3 (`containers` … `email_ascii`, như K5 v1.0.3) + `pricelimit: 0 price estimates refused …`, `pricegap: every room had a list price …`, `priceswitch: public_show_prices not changed since the last check`. Chạy lại một lần sau 2 phút nếu có `FAIL`; còn `FAIL` thì dừng, báo OPS.

### K8. Log và Chat – Ai chạy: ORC
- K7 v1.0.3 (log 15 phút sau P9, chỉ đếm): `API_5XX=0`, `API_ERR=0`, `WORKER_ERR=0`.
- Worker vẫn mức A (D7): `dc logs --no-color --no-log-prefix worker | grep -c '"detailLevel":"A"'` ≥ 1 sau F1 (worker dựng lại ở `REDEPLOY`). Có `"detailLevel":"C"` → `.env` đã đặt C trước D7: trả về `A`, báo SEC.
- QA `smoke-prod` (lệnh K6 v1.0.2): 7 passed, 1 skipped.

### Ghi nhận – Ai chạy: ORC
Decision-log: giờ P3 (sao lưu), P9, giờ C (P10), 5 băm rút gọn, F1, F2 (khi có); bảng D1–D7 + P1–P6 đã điền; kết quả K1–K8. Báo INV: "LP-v2 đã lên; giá bật khi OWN bật ở H05".

---

## 5. Quay lui

**Ai quyết:** ORC, theo phê duyệt thường trực INV 04/11 (lỗi nặng: làm ngay rồi báo). **Không đụng:** dữ liệu (không restore, không SQL tay), các dòng `privacy_notice_version` (giữ; không đăng lại `2026-10-24`), 0092 (không lùi DB), gói `infra/` (chạy được với bản cũ), bí mật, webhook Chat.

### 5.1 Chỉ tắt giá
OWN: Desk H05 → `public_show_prices` = tắt. Trong khoảng 2 phút trang hết hiện giá, route giá 404. `priceswitch` báo một lần. Không cần ORC làm gì khác. Dùng khi số web sai, cào giá nặng (`pricelimit` FAIL kéo dài), hoặc bảng giá Desk đang sửa.

### 5.2 Quay landing về bản 2 ngôn ngữ `sha-72f9ac8e2b33`
Dùng khi trang LP-v2 lỗi hiển thị nặng / sai chữ pháp lý, mà api vẫn tốt.
1. `ENVSET LANDING_LOCALES en,vi` → `REDEPLOY` (**trước**, để api không còn coi ko/zh/ru đang bán). **Đúng là:** như F1 với giá trị `en,vi`.
2. ```bash
   ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && { sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh --rollback 2>&1; echo "MA THOAT: $?"; } | grep -E "^\[landing |^no previous|^usage:|^MA THOAT: "'
   ```
   **Đúng là:** `deploy landing sha-72f9ac8e2b33 (previous: ⟨TAG_L⟩)`; `WARNING: older privacy notice version than the published one (…) – the form accepts it only for 7 days after it was superseded …`; `privacy: en 2026-10-24 (same bytes as published) vi 2026-10-24 (same bytes as published)`; `OK: landing sha-72f9ac8e2b33 is live …`; `MA THOAT: 0`. Không có `FAIL`. (Trang en/vi bản cũ in đúng một version và cùng byte với dòng `apply … 2026-10-24` trong log – không bị luật fail-closed v1.0.3 chặn khi proxy mở.)
   - Thiếu `state/digests/landing-sha-72f9ac8e2b33` (P2): production đòi digest. Thêm `--digest "$L"` với `L` đọc từ log job `deploy production` của Release `landing-v1.1.1` (so 8 ký tự với RepoDigests của image trên máy chủ trước khi dùng), không gõ chữ.
3. K5 (`form_token=200`), mở `/` và `/vi/`: trang cũ, chữ "Version 2026-10-24".
4. **Mốc 7 ngày** = giờ C + 7 ngày. Trước mốc, form bản cũ (consent `2026-10-24`) được nhận. Trước mốc, ORC phải chọn một trong hai: (a) lên lại LP-v2 (đã sửa). Nhãn thông báo giữ `2026-11-04` nếu 5 trang thông báo không đổi byte: không đăng gì mới, `deploy-landing.sh` phải in `same bytes as published`. Đổi byte thì dùng nhãn mới (`2026-11-04.1`) và đăng nhãn mới theo P10 (chạy thử → `--apply`). Lúc này `2026-11-04` **đã đăng** trên production, nên **không** đổi hằng Chat và **không** Release api (SEC RB-02, mục 0 (b)): nhãn mới đăng muộn hơn tự qua cổng theo `published_at`, ở đúng mức Chat đang đặt. Vì vậy, trước `CHKV`: **Dừng nếu** decision-log chưa có dòng SEC duyệt chữ `⟨NOTICE_V⟩` mới, ghi rõ "Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4" (SEC RB-05, GCHAT-03). ORC chép giờ + câu đó vào biên bản quay lui. Rồi chạy `CHKV` (`E=/opt/ottimo-prod`, `RA` = tag app đang chạy, `RL` = commit landing mới, `RUN=DOC`). **Đúng là:** `CHAT_CONST=2026-11-04 CONST_ROWS=5` (hoặc ≥ 1), `LANDING_VERSION` = nhãn mới, `D2_CHAT_CONST=CO`. (a) chỉ làm khi api đang chạy là LP-v2 (K1 `current=⟨TAG_L⟩` hoặc mới hơn); app đã lùi về v1.0.3 (5.4) thì chỉ có (b). Hoặc (b) đóng proxy form: `LANDING_PUBLIC_API=off` (khuôn `ENVSET`) → `deploy-landing.sh sha-72f9ac8e2b33 --no-pull` → `form-token` 404 HTML (quay lui (c) của README 12.3). Không đăng lại `2026-10-24` (SQL từ chối).

### 5.3 Đóng hẳn form website
Như README 12.3 quay lui (a)–(c): OWN tắt `public_booking_requests_enabled` (ngay) → `LANDING_PUBLIC_API=off` **trước** → `deploy-landing.sh --rollback` hoặc `--no-pull` → `form-token` 404 HTML của Caddy.

### 5.4 Quay app về v1.0.3 (`sha-da6d6f3dc22b`)
Dùng khi Desk/api/worker lỗi nặng do mã LP-v2. Lỗi chỉ ở giá → 5.1; chỉ ở landing → 5.2.
1. `ENVSET LANDING_LOCALES en,vi` (không `REDEPLOY`: bước 3 dựng lại api).
2. **Bất biến (ARC Q2, giữ bắt buộc):** không để landing LP-v2 **có proxy form mở** đứng trước api v1.0.3. Api v1.0.3 trả lỗi sạch cho ko/zh (`422`, không ghi dòng nào), nên đây không phải chuyện an toàn dữ liệu. Nhưng khách ko/zh đã điền xong form lại bị bảo "kiểm mạng và gửi lại", và cặp "landing LP-v2 + api v1.0.3, proxy mở" chưa ai kiểm. Chọn một trong hai, theo giờ C (P10) + 7 ngày:
   - **(i) Trước mốc 7 ngày:** 5.2 bước 2 (landing về `sha-72f9ac8e2b33`). Form en/vi của bản cũ vẫn mở. Chỉ dùng được trong 7 ngày sau khi đăng thông báo mới, vì v1.0.3 cũng chỉ nhận consent `2026-10-24` trong 7 ngày sau khi nó bị supersede (cùng luật với api LP-v2). **Tới mốc 7 ngày mà app vẫn v1.0.3** (SEC RB-06): chỉ làm 5.2 bước 4(b) (đóng proxy, landing cũ giữ nguyên). 5.2 bước 4(a) chỉ làm sau khi app LP-v2 đã lên lại.
   - **(ii) Quá mốc 7 ngày, hoặc `deploy-landing.sh --rollback` từ chối:** giữ landing LP-v2, đóng proxy. `ENVSET` dạng `LANDING_PUBLIC_API=off` (khuôn mục 2, đổi khóa; **Đúng là:** `LINES=1`, `VALUE_OK=1`, `ottimo 600`), rồi:
     ```bash
     ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && { sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/deploy-landing.sh ⟨TAG_L⟩ --no-pull 2>&1; echo "MA THOAT: $?"; } | grep -E "^\[landing |^usage:|^MA THOAT: "'
     ```
     **Đúng là** (ARC): `deploy landing ⟨TAG_L⟩ (previous: …)`; dòng `privacy: en 2026-11-04 (same bytes as published) … ru 2026-11-04 (same bytes as published)` (nếu lùi app trước P10 thì là `(not published yet)`, vẫn đạt); có thể có dòng `WARNING: …`, vì khi proxy tắt mọi kiểm trang thông báo chỉ ra WARNING, không FAIL. ORC chép nguyên dòng WARNING vào biên bản, không chặn. Cuối `OK: landing ⟨TAG_L⟩ is live …`, `MA THOAT: 0`. **Không** có dòng `FAIL`. Có `FAIL` (proxy vẫn `on`, `.env` chưa đổi) thì dừng, đọc lại `ENVSET`.
     Trang 5 ngôn ngữ vẫn hiện, form tạm đóng, khách thấy khối Zalo/gọi. Landing không gọi api nào nữa (form-token và route giá đều qua proxy), nên chạy được với bất kỳ bản api nào, mọi lúc.
   - Làm (ii), hoặc 5.2 bước 4(b), thì **báo INV ngay**: "form đặt phòng trên website tạm đóng, khách liên hệ qua Zalo/điện thoại".
   - **Mở lại proxy** (`LANDING_PUBLIC_API=on` + `deploy-landing.sh … --no-pull` + K5 = 200) **chỉ khi** K1 cho thấy api là LP-v2 (`current=⟨TAG_L⟩` hoặc mới hơn) **và** `LANDING_LOCALES` đã về 5 ngôn ngữ (F1) (SEC RB-06). Api còn v1.0.3 thì không mở lại, kể cả khi đã làm 5.2 bước 4(b).
3. ```bash
   ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && { sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/rollback.sh sha-da6d6f3dc22b 2>&1; echo "MA THOAT: $?"; } | grep -E "^\[deploy |^another deploy|^usage:|^unknown option|^no previous tag|^digest must|^(Error|ERROR)|^MA THOAT: "'
   ```
   **Đúng là:** `deploy sha-da6d6f3dc22b (previous: ⟨TAG_L⟩, pull=1, rollback=1)`; `image digests match the release`; `api/worker configuration accepted by image sha-da6d6f3dc22b`; `02-roles.sh applied …`; **`migrations: 69 applied / 68 in the image journal`** (đúng: DB đi trước một migration); `OK: sha-da6d6f3dc22b is live`; `MA THOAT: 0`. Lỗi khác: R4b v1.0.3 (cùng ba ca a/b/c, thay tag).
4. Kiểm: K1 (`current=sha-da6d6f3dc22b previous=⟨TAG_L⟩`), K2 dòng 2 vẫn `69`, K5 theo nhánh đã chọn ở bước 2 (SEC RB-06): nhánh (i) `form_token=200 application/json…` (landing cũ, proxy mở); nhánh (ii) hoặc 5.2 bước 4(b) `form_token=404` HTML của Caddy (proxy đóng). K7 (14 dòng `ok`; `pricegap`/`pricelimit` vẫn `ok` vì không còn route giá), smoke-prod.
5. Các dòng `2026-11-04` (ko/zh/ru) giữ nguyên; v1.0.3 chỉ nhận en/vi/ru từ landing cũ. Cổng Chat của v1.0.3 neo `2026-10-31` (chưa đăng) → mức A, đúng hướng an toàn.
6. Từ lúc này **cấm** `rollback.sh` không tham số (sẽ đưa `⟨TAG_L⟩` lên lại không qua Release). Lên lại LP-v2: `deploy.sh ⟨TAG_L⟩` với digest ở `state/digests/⟨TAG_L⟩` (khuôn `REDEPLOY` nhưng tag cố định) hoặc tag mới.

---

## 6. Khi Release hoặc deploy lỗi

Như mục 4 runbook v1.0.3; chỉ đổi số:

| `step=` | Đã đổi gì | Trạng thái | Làm gì |
|---|---|---|---|
| `lock`, `config`, `pull`, `appconfig`, `roles` | Không | v1.0.3 chạy, DB 68 | Đọc dòng `FAIL:` (chỉ tên biến), sửa theo OPS, Re-run **job** |
| `migrate` | SQL lỗi → DB vẫn 68; SQL xong mà bước đếm lỗi → DB 69 | v1.0.3 chạy được trên cả hai | K2 dòng 2. Báo BE + ARC. Không SQL tay, không restore |
| `switch`, `smoke` | `deploy.sh` tự đưa `sha-da6d6f3dc22b` lên lại; DB 69 | `current_tag` vẫn `sha-da6d6f3dc22b` | K1. Không healthy → 5.4 bước 3 ngay |
| Landing `privacy` FAIL | Không (FAIL trước khi đổi container) | Landing cũ chạy | Đọc dòng `FAIL: privacy …`: "older" = image sai nhãn; "bytes changed" = cùng nhãn khác byte → nhãn mới, báo SEC + FE-B |
| Landing `switch` | `deploy-landing.sh` tự dựng lại landing trước | Landing cũ chạy | K3; báo OPS |
| Tag sai commit | Không, nếu chưa duyệt | – | Không duyệt; xóa tag trên origin và local; làm lại P4/P8 |

Không bao giờ `rollback.sh` hay `deploy-landing.sh --rollback` khi chưa đọc `state/` (K1/K3): sau một lần lỗi, `previous_tag` có thể không phải bản mong muốn.

---

## 7. Khi nào dừng (tóm tắt)

| Bước | Dừng khi |
|---|---|
| 0.2 | Không có lượt CI; job lệch; băm 0092 lệch; `D2_CHAT_CONST=KHONG` (hằng api hoặc `VERSION` landing ≠ `⟨NOTICE_V⟩`, ảnh `RA` ≠ `⟨TAG_L⟩`, hoặc SSH/SQL đọc không được); có push lên `main` trước khi `⟨CI_RUN_L⟩` `completed success` |
| S0–S8 | Staging đã có `2026-11-04` khác byte; S0b webhook staging trùng production hoặc INV không xác nhận phòng thử; S4 `CHKV` `KHONG` hoặc băm khác FE-B; **S6 ca 6 đỏ** (D5); S7 không ra WARNING/`same bytes` như bảng |
| P0 | Một ô D1–D6 hoặc P1–P6 `CHUA` (P1 `CHUA` khi phòng Chat/webhook đổi từ 03/11 mà chưa làm lại K1); QC rút gọn chưa đạt; biên bản staging thiếu |
| P1 | `⟨SHA_L⟩` không thuộc `main`; có migration ngoài 0092; infra có tệp ngoài danh sách |
| P2 | Không chạy v1.0.3; thiếu digest v1.0.3; migration ≠ 68; thông báo đang hiệu lực khác `2026-10-24` en/vi; log có `2026-10-31`/`2026-11-01`/`2026-11-04`; dòng 9 > 30 |
| P2b | Băm gói lệch; gói thiếu kiểm giá / route giá / `LANDING_LOCALES`; `init-secrets` tạo tệp; `config` lỗi |
| P3 | Sao lưu không `OK:` |
| P4–P6 | Tag sai commit; `CHKV` ra `D2_CHAT_CONST=KHONG`; `resolve` đỏ; digest lệch; deploy không `ok` |
| K1–K2 | Image/state lệch; migration ≠ 69; trigger ≠ `O`; `public_show_prices` đã có dòng |
| P8–P9 | `--check-only` có `FAIL`; thiếu ngôn ngữ; nhãn khác `2026-11-04` |
| P10 | Bước 0 `D2_CHAT_CONST=KHONG` (gồm `RA_IMAGE` ≠ `current_tag` production); bất kỳ `refused`; dòng supersede khác `2026-10-24` en/vi; trang sống khác image |
| F1 | `ENVSET` lệch; `appconfig` từ chối |
| K3–K8 | Trang 5 ngôn ngữ không 200; K4 lệch 7 dòng; `form-token` ≠ 200; smoke counts ≠ 14/14; `FAIL` còn sau lượt chạy lại; worker mức C |
| F2 | Thiếu QC P6/P7/P8, chưa có mốc `priceswitch`; số web ≠ Desk; `pricegap` FAIL |
| 5.2 | Bước 2 có `FAIL` hoặc thiếu `WARNING: older…`; bước 4(a) nhãn mới mà decision-log chưa có dòng SEC duyệt chữ ("Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4") (SEC RB-05); bước 4(a) khi api đang chạy không phải LP-v2; `CHKV` ra `KHONG` |
| 5.4 | Bước 2 (ii) `deploy-landing` có `FAIL`; mở lại proxy khi K1 chưa thấy api LP-v2 hoặc `LANDING_LOCALES` chưa về 5 ngôn ngữ (SEC RB-06); K5 khác kỳ vọng của nhánh đã chọn |

**Thường trực** (README 13.7, SEC RB-04): không `UPDATE`/`DELETE`/`TRUNCATE`/`ALTER`/`DISABLE TRIGGER` trên `privacy_notice_version`; không `session_replication_role = replica`, không `pg_restore --disable-triggers` vào DB có bảng này. Không dùng lại một nhãn thông báo cho chữ khác ở bất kỳ môi trường dùng chung nào (SEC mục 2).

---

## 8. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-04 | 4 | OPS – trả lời SEC FB-R4-SEC-LPV2M-03: README infra/server 12.3 mục LP-v2 viết lại theo trạng thái thật (production thông báo 2026-10-24 en/vi, landing sha-72f9ac8e2b33; 2026-10-31 không bao giờ đăng riêng; nhãn LP-v2 = 2026-11-04, không đăng 2026-10-31/2026-11-01; sau --apply thấy supersede 2026-10-24 (en)/(vi); quay lui landing in 2026-10-24, mốc 7 ngày tính từ giờ --apply); chú thích publish-privacy-notice.sql cùng nội dung. Runbook mới rounds/round-04/outputs/OPS/lp-v2-release-runbook.md: 0.2 ghim commit gộp lp-v2-main + giữ main yên tới khi CI xanh; staging S0–S8 (C8 qua Caddy thật = D5, diễn tập quay lui landing); P0 bảng D1–D7 + P1–P6 (P5 = hằng 2026-11-04); sao lưu, gói infra từ SHA_L, mốc priceswitch trước Release (D6); Release app (0092, DB 68 → 69) rồi landing; publish 5 ngôn ngữ; LANDING_LOCALES sau publish; K1–K8; public_show_prices OWN bật cuối; quay lui giá / landing (sha-72f9ac8e2b33) / app (sha-da6d6f3dc22b, DB 69 / image 68) | OPS | Quyền OPS (vận hành, runbook); SEC LPV2M-03 |`

r2 (ORC ghi khi gộp nhánh `lp-v2-ops-runbook-r2`):

`| 2026-11-04 | 4 | OPS – runbook LP-v2 r2 (rounds/round-04/outputs/OPS/lp-v2-release-runbook.md; nhánh lp-v2-ops-runbook-r2, gộp sau PR #34, không đổi đầu PR) theo SEC mục 8.4 + ARC "Runbook r1.1": RB-01 ô D1 trỏ SEC 8.1 + số run/headSha CI PR (bỏ "hai số 1"); RB-02 "hằng Chat = nhãn đăng" chỉ khi DB đích chưa có dòng của hằng (lần đăng đầu nêu Google Chat), khi 2026-11-04 đã đăng thì nhãn mới tự qua cổng theo published_at, không đổi hằng, không Release api – CHKV đọc số dòng của hằng trên DB đích (chỉ cột version) và chọn luật, 5.2 bước 4(a) sửa theo; RB-03 CHKV so sha-12 của RA với current_tag đọc trong cùng lệnh (S4, P10) hoặc TAG_L (0.2, P4); RB-04 S0b webhook staging rỗng hoặc INV xác nhận phòng thử (không in URL), P1 bỏ CO điền sẵn; ARC Q2 5.4 bước 2: trước mốc 7 ngày quay landing, quá mốc giữ landing LP-v2 + LANDING_PUBLIC_API=off + báo INV; Q3 giữ LIKE; G7 băm drizzle = sha256 tệp SQL. README 12.3 + chú thích privacy.ts (RB-02) sửa ở v1.0.4 | OPS | Quyền OPS (vận hành, runbook); SEC RB-01..04; ARC Q2/Q3/G7 |`

r2.1 (ORC ghi khi gộp cùng nhánh):

`| 2026-11-04 | 4 | OPS – runbook LP-v2 r2.1 (cùng nhánh lp-v2-ops-runbook-r2, chỉ tệp runbook) theo SEC mục 9.4 + ARC: RB-05 nhãn mới ở 5.2 bước 4(a)/mục 0 (b) dừng nếu decision-log chưa có dòng SEC duyệt chữ ("Google Chat vẫn là bên nhận" hoặc "đã hạ mức Chat về A theo README 13.4"), mục 7 thêm dòng 5.2/5.4; RB-06 5.4 chỉ mở lại proxy khi K1 thấy api LP-v2 và LANDING_LOCALES về 5 ngôn ngữ, nhánh (i) tới mốc 7 ngày mà app vẫn v1.0.3 thì chỉ 5.2(b), K5 theo nhánh; RB-07 S0b in mã thoát cmp, tách ERR; RB-08 CHKV in ENV/ROWS, production ROWS=0 → KHONG, hằng không hậu tố, nhãn đúng dạng; ARC 5.4 (ii) có lệnh + "Đúng là" deploy-landing --no-pull (có thể WARNING, không FAIL) | OPS | Quyền OPS (vận hành, runbook); SEC RB-05..08 |`

r2.2 (ORC ghi khi gộp cùng nhánh):

`| 2026-11-04 | 4 | OPS – runbook LP-v2 r2.2 (cùng nhánh lp-v2-ops-runbook-r2, chỉ tệp runbook) theo SEC RB-09: CHKV chuẩn hóa E=${E%/} ngay đầu lệnh; chỉ nhận E=/opt/ottimo-prod (đòi ROWS≥1) và E=/opt/ottimo (staging, nhận ROWS=0), mọi giá trị khác ra KHONG dù ROWS bao nhiêu; chạy thử 12 ca E × ROWS bằng giá trị giả (bash, zsh), r2.1 ra CO ở ca /opt/ottimo-prod/ + ROWS=0, r2.2 ra KHONG | OPS | Quyền OPS (vận hành, runbook); SEC RB-09 |`

---

## 9. Giả định, rủi ro, câu hỏi cho reviewer

**Giả định**
- **G1:** Tag app của LP-v2 khi đi trước v1.0.4 là `v1.0.4-lp.1` (đề xuất): `release.yml` nhận (`v[0-9]*.[0-9]*.[0-9]*`, OPS đã thử mẫu), là bản trước của v1.0.4 (cùng nền `main@L`), không lẫn với hotfix `v1.0.3.x` (cắt từ tag `v1.0.3`, plan-v1.0.4 2.1 ý 5). ORC chốt tên.
- **G2:** Tag landing `landing-v2.0.0` (đề xuất): `landing-v1.2.0` từng được gắn với lượt đăng `2026-10-31` riêng (đã bỏ), dùng lại dễ lẫn.
- **G3:** Hai tag cùng commit `⟨SHA_L⟩`, image landing của `⟨CI_RUN_L⟩` là image QA đã kiểm ở S3–S6. Nếu v1.0.4 đi trước (1.2 đường phụ), landing tag trên commit có image đã chạy ở staging với cùng 5 băm.
- **G4:** Staging có thể đã có dòng thông báo khác production (QA từng đăng trên stack thử, không phải staging – SEC mục 2). S0 ghi lại; chỉ dừng khi có `2026-11-04` khác byte.
- **G5:** `public_booking_requests_enabled` đang bật trên production từ US-155 (P2 dòng 7 = 1). Nếu tắt, F1/K5 vẫn làm, K5 kỳ vọng 404 `problem+json`, K6 bỏ.
- **G6:** Tên tham số query của route giá ở F2/K3 (`arrival`, `departure`, `adults`) theo `parseEstimateQuery`; QA thay bằng dạng đúng đã dùng ở S6 nếu khác.
- **G7:** `drizzle.__drizzle_migrations.hash` = sha256 nội dung tệp SQL. **ARC đã xác nhận 04/11** (drizzle-orm 0.45.4, `readMigrationFiles`), K2 dòng 3 so thẳng `HASH_0092`.
- **G8:** OPS không SSH khi soạn bản này; mọi số "production lúc soạn" lấy từ decision-log 03–04/11 và SEC/ARC. P2 kiểm lại trước mọi thay đổi.
- **G9 (r2):** webhook Chat của staging nằm ở `/opt/ottimo/secrets/booking_request_chat_webhook` (cùng bố cục với production `/opt/ottimo-prod/secrets/…`, README 13.1). Nếu đường dẫn khác hoặc `sudo -n` không cho `stat`/`cmp`, S0b chỉ còn câu hỏi có/không gửi INV.
- **G10 (r2):** `CHKV` dùng `psql -c "SELECT version FROM privacy_notice_version"` qua `dc exec` với `PGOPTIONS` chỉ đọc, như `SQLRO`. Câu này chỉ đọc cột nhãn, không có dữ liệu khách. Lệnh SSH thật chưa chạy lần nào (G8): lần đầu ở 0.2 bước 3.

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

**Rủi ro**
- **R1 (trung bình):** v1.0.4 gộp vào `main` trong lúc lượt CI của `⟨SHA_L⟩` còn chờ → lượt bị hủy, Release từ chối tag (0.2). Giảm: ORC giữ `main` yên tới bước 0.2.5.
- **R2 (thấp):** khoảng P9 → P10 vài phút form en/vi hiện khối Zalo/gọi. Giảm: P10 chạy ngay, ngoài giờ đông khách.
- **R3 (thấp):** sau F1, trong lúc api dựng lại (15–30 giây), form và Desk trả lỗi tạm. Giảm: làm ngoài giờ nhận/trả phòng.
- **R4 (thấp – trung bình):** quay landing quá 7 ngày sau giờ C mà không chọn (a)/(b) ở 5.2 bước 4 → form bản cũ bị từ chối (`NOTICE_VERSION_INVALID`), khách thấy khối Zalo/gọi. Không lộ dữ liệu.
- **R5 (thấp):** `priceswitch` dựa vào id audit tăng dần (OPS LPV2-04, đã chấp nhận).
- **RR-NS (INV chấp nhận 04/11):** ko/zh/ru chưa có người bản xứ đọc. Đổi chữ theo phản hồi khách = nhãn mới, không sửa tại chỗ.

**Câu hỏi cho ARC/SEC (r1.1) – đã có trả lời 04/11**
- Q1 (SEC): bảng P0 đủ và đúng nghĩa. D3 phần P3/P4 chấp nhận "INV xác nhận trong chat ngày đăng" với 3 điều kiện (SEC mục 8.4): ORC ghi decision-log **trước P10** (giờ xác nhận; P3 = "phòng Chat thật chỉ có OWN/MGR/FDL/FD, N thành viên, không SAL/CTV"; P4 = đường dẫn + mục sổ tay WR8 do BA chỉ và "lịch OWN có ngày xóa phòng Chat hằng năm"; không tên, email, số điện thoại). "Ngày đăng" là ngày chạy P10, trễ sang ngày khác thì xác nhận lại. Thiếu một xác nhận thì ô đó `CHUA` và dừng.
- Q2 (ARC): giữ bắt buộc, thêm mốc 7 ngày → 5.4 bước 2 (r2).
- Q3 (ARC): `LIKE` đủ → giữ.

**Câu hỏi cho SEC (r2) – đã có trả lời 04/11:** luật `CONST_ROWS≥1` đúng ý RB-02 (SEC mục 9.2): cổng đọc `min(published_at)` không lọc `superseded_at`, và `CONST_ROWS` đếm cả dòng đã bị thay thế, khớp với cổng. Giới hạn SEC nêu đã đưa vào r2.1: luật không thay việc SEC duyệt chữ (RB-05), và hằng phải không mang hậu tố (RB-08).
