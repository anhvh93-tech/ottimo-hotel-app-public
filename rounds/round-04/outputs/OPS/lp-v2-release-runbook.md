# OTTIMO LP-v2 – Runbook phát hành production (r1)

Soạn: OPS · 04/11/2026 · Round 4, gói LP-v2, bước **Phản hồi & sửa**, nhánh `lp-v2-main`. Trả lời SEC `FB-R4-SEC-LPV2M-03` (`rounds/round-04/reviews/SEC-on-lp-v2-main.md`): README 12.3 viết lại theo trạng thái thật, và runbook này chứa các điều kiện đăng **D1–D7** (mục 4 của tệp SEC), gồm D5 = C8 kiểm trên staging qua Caddy thật.
Khuôn: `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` r3.2 (cách gọi SSH, `SQLRO`, ô điền, "Đúng là", "Dừng nếu", quy ước digest rút gọn).
Căn cứ: `product/infra/server/README.md` 12.3 (mục "LP-v2"); `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` (0092, băm, kiểm); `rounds/round-04/outputs/OPS/lp-v2-ops.md`; `rounds/round-04/qc/lp-v2-gate.md` mục 6 (P1–P16); `rounds/round-04/outputs/SEC/notice-2026-10-31-final.md` mục 5 (P1–P6); `rounds/round-04/reviews/SEC-on-LP-v2-code.md` mục 4 (C1–C9); `.github/workflows/release.yml`; `product/infra/server/bin/{deploy,rollback,deploy-landing,publish-privacy-notice,ops-check,us155-smoke-counts}.sh`.

Trạng thái: **r1, chờ ARC + SEC đọc.** Các ký hiệu `⟨…⟩` lấy đúng một giá trị ở bảng 0.1, chốt theo 0.2 sau khi `lp-v2-main` gộp vào `main`. Không chạy bước nào trên production khi 0.1 còn ô trống.
Người chạy: **ORC**, qua SSH `ottimo-admin` (`sudo -n`), theo phê duyệt thường trực của INV 04/11 (gộp, staging, Release LP-v2; decision-log 04/11 "INV – đồng ý trước toàn bộ"). Phê duyệt đó **không** bỏ cổng: vẫn đủ review, QA, QC trước Release; ORC báo INV sau mỗi lần deploy. **OWN (INV) tự làm** trên Desk: bật `public_show_prices` (F2) và xóa yêu cầu thử theo WR8 (K6).

**Luật riêng của đợt này:** không ghi IP VPS, bí mật, URL webhook, email hay số điện thoại vào tệp này, chat, lệnh hay `.env` mẫu. Digest image chỉ ghi dạng rút gọn `8…4`, lệnh đọc digest đầy đủ từ `state/digests/…` hoặc artifact vào biến (quy ước PR30-01: gitleaks báo nhầm digest đầy đủ). Không SQL ghi tay production; bảng `privacy_notice_version` chỉ ghi qua `publish-privacy-notice.sh`. Mọi lệnh kiểm chỉ in số, mã hoặc `ERR`.

---

## 0. Trả lời nhanh

| Câu hỏi | Trả lời |
|---|---|
| Đợt này gồm gì | Nhánh `lp-v2-main` gộp vào `main` (commit gộp = `⟨SHA_L⟩`): mã LP-v2 phía api + Desk (migration **0092**, OpenAPI 0.3.11, route giá công khai, `LANDING_LOCALES`), landing 5 ngôn ngữ (en, vi, ko, zh, ru) + khối giá ước tính, thông báo dữ liệu nhãn **`2026-11-04`** (en/vi = chữ PR #21 luật sư đã duyệt; ko/zh/ru = Δ5 SEC), hạ tầng (Caddy landing, `deploy-landing.sh`, `publish-privacy-notice`, `ops-check` giá) |
| Production lúc soạn | App v1.0.3 `sha-da6d6f3dc22b` (DB **68**, chưa có 0092). Landing `landing-v1.1.1` = `sha-72f9ac8e2b33`. Thông báo đang hiệu lực: **`2026-10-24`** en + vi. `2026-10-31` **chưa và sẽ không** được đăng riêng (đổi nghĩa P4, SEC chấp nhận) |
| Nhãn thông báo | **`2026-11-04`**, cả 5 ngôn ngữ (SEC mục 2). Không đăng `2026-10-31`, không đăng `2026-11-01` ở staging hay production. Chữ đổi trước khi đăng → nhãn mới (`2026-11-04.1`), báo SEC |
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
| `⟨APP_TAG⟩` | đề xuất `v1.0.4-lp.1` (G1) | ORC chốt | P4, P5 |
| `⟨LANDING_REL⟩` | đề xuất `landing-v2.0.0` (G2) | ORC chốt | P8 |
| `API_DIGEST`, `WEB_DIGEST`, `LANDING_DIGEST` | dạng `8 ký tự…4 ký tự` | artifact `image-digests` của `⟨CI_RUN_L⟩` | P5, P8, K1, K3 |
| `HASH_0092` | `b1f16b35fe81eb08a46216fde3f477ec3d60d8a38fe216ed4207b46379e92b41` | ARC `lp-v2-main-merge.md` mục 1; kiểm lại ở 0.2 (băm tệp SQL, không phải bí mật) | K2 |
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
    ; git show "$S:product/services/api/src/modules/public-site/public/chat-message.ts" | grep -c "CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'" \
    ; git show "$S:product/apps/landing-web/src/content/privacy.ts" | grep -c "VERSION = '2026-11-04'"
   ```
   **Đúng là:** `SHA_L=<40 hex> TAG_L=sha-<12 hex>`; `CI_RUN_L=<số>`; `run: waiting`; `gitleaks: completed success`, `publish images (GHCR): completed success`, `deploy staging: waiting`; đúng 3 dòng `api=…`, `web=…`, `landing=…` dạng rút gọn; băm = `HASH_0092`; `1` (SEC LPV2M-01, D2); `1` (SEC LPV2M-02).
   **Dừng nếu** thiếu dòng nào, băm lệch (báo ARC + BE), hoặc một trong hai số cuối là `0` (thẻ SEC 01/02 chưa vào `main`).
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

---

## 3. Staging trước (SEC D5, QC P9–P12) – Ai chạy: ORC + QA

Mục tiêu: chạy đúng trình tự production trên staging với **image `⟨TAG_L⟩`**, để QA làm C8 qua Caddy thật và OPS diễn tập quay lui landing. Staging cùng máy, cùng edge, nên Caddy, `TRUST_PROXY` và PROXY protocol giống production.

| Bước | Việc | Đúng là |
|---|---|---|
| S0 | Trạng thái trước (`SQLRO` staging): `SELECT count(*) FROM drizzle.__drizzle_migrations;` và `SELECT version, locale, superseded_at IS NULL FROM privacy_notice_version ORDER BY version, locale;` | `on`; 68 (hoặc 69 nếu S2 đã chạy); các dòng thông báo của staging – **ghi lại**. Có dòng `2026-11-04` khác byte bản LP-v2 thì **dừng**, báo SEC (cần nhãn mới). Có `2026-10-31`/`2026-11-01` đang hiệu lực trên staging: ghi lại, không chặn (nhỏ hơn `2026-11-04`), dòng supersede ở S4 sẽ là các nhãn đó |
| S1 | Làm mới gói `infra/` staging từ `⟨SHA_L⟩` (khuôn P2b dưới đây, đường dẫn `/opt/ottimo` và `/root/ottimo-staging-bundles`) | `STAGING: CAU HINH MOI DA VAO`, `CAU HINH: OK` |
| S2 | Duyệt `deploy staging` của `⟨CI_RUN_L⟩` (0.2 bước 5) | Job xanh; staging `current_tag` = `⟨TAG_L⟩`; K2 (đường dẫn staging) ra 69 migration và các dòng 0092 |
| S3 | Landing `⟨TAG_L⟩` lên staging: job `deploy landing preview (staging)` của `⟨CI_RUN_L⟩` (nếu `LANDING_PREVIEW_DEPLOY=true`), hoặc ORC chạy `deploy-landing.sh ⟨TAG_L⟩` trên `/opt/ottimo`. Staging phải có `LANDING_PUBLIC_API=on` cho C8 (nếu đang `off`: `ENVSET` dạng `LANDING_PUBLIC_API=on` trên `/opt/ottimo`, chỉ staging) | `[landing …] privacy: en 2026-11-04 (not published yet) vi 2026-11-04 (not published yet) ko … zh … ru …`, rồi `OK: landing ⟨TAG_L⟩ is live` |
| S4 | `publish-privacy-notice.sh` trên staging: chạy thử rồi `--apply`, `--version 2026-11-04` (lệnh P10 với `/opt/ottimo`) | `DRY RUN OK`, rồi `OK: version 2026-11-04 published (en vi ko zh ru)`. Ghi 5 băm `sha_<xx>` (12 ký tự) – **phải trùng** 5 băm FE-B báo khi đổi nhãn (SEC LPV2M-02) |
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
| D1 | Thẻ SEC LPV2M-01 + 02 + 03 Done; CI PR `lp-v2-main` → `main` xanh trên đúng đầu nhánh, gồm `pnpm audit` và gitleaks lịch sử | BE, FE-B, OPS, ORC | 0.2 bước 3 (hai số `1`), lượt CI PR | |
| D2 | Bản api chạy trên production có `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` (QA đọc mã của tag) | QA | 0.2 bước 3 + P4 (QA đọc `git show ⟨APP_TAG⟩:…/chat-message.ts`) | |
| D3 | P2 (`retention.web_request_ip_hmac_days` ≤ 30), P3 (thành viên phòng Chat chỉ OWN/MGR/FDL/FD), P4 (sổ tay WR8 + lịch xóa phòng Chat hằng năm) của notice-final mục 5 vẫn đúng **tại ngày đăng** | OPS, INV, BA | P2 dòng 9 (OPS đọc số); INV nhắn xác nhận P3; BA chỉ chỗ trong sổ tay + INV xác nhận lịch | |
| D4 | Thứ tự trong cùng một phiên: api có 0092 → `deploy-landing.sh` image LP-v2 → `publish-privacy-notice.sh` chạy thử rồi `--apply` (5 ngôn ngữ, băm khớp trang sống) → rồi mới `LANDING_LOCALES=en,vi,ko,zh,ru` → `form-token` 200 | OPS | P6 → P8/P9 → P10 → F1 → K5, làm liền | |
| D5 | QA chạy lại 12 ca SEC 9.5 (C8) trên **staging qua Caddy thật**, gồm ca IP khách đến api qua `TRUST_PROXY` | QA | S6 | |
| D6 | `public_show_prices` vẫn `false` tới khi OWN bật; `ops-check priceswitch` đã lấy mốc | OPS, INV | P2b bước 4 (mốc), K2 dòng 6, K7, F2 | |
| D7 | Chỉ đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` sau khi `2026-11-04` đã đăng **và** SEC xác nhận ★1–★8 trong decision-log | OPS, SEC | Ngoài runbook này; K8 xác nhận vẫn mức A | |

Điều kiện P1–P6 của notice-final mục 5, áp cho lượt đăng LP-v2 (SEC LPV2M-03):

| # | Điều kiện | Trạng thái / bước | ORC điền |
|---|---|---|---|
| P1 | K1 đạt (xóa được tin webhook trong phòng Chat, tìm theo `REQ-…`) | **Đã đạt 03/11** (decision-log "K1 – ĐẠT") | CO |
| P2 | `retention.web_request_ip_hmac_days` production ≤ 30 | P2 dòng 9 | |
| P3 | Phòng Chat thật chỉ OWN, MGR, FDL, FD (@ottimo.vn), không SAL/CTV | INV xác nhận trong chat ngày đăng | |
| P4 | Sổ tay có WR8 (xóa tay tin Chat trong 24 giờ) + xóa cả phòng Chat mỗi năm có ngày cố định trong lịch OWN | BA chỉ mục sổ tay, INV xác nhận lịch | |
| P5 | Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` = **`'2026-11-04'`** trên bản api đang chạy (đổi từ `2026-10-31`) | = D2 | |
| P6 | Deploy landing rồi `publish-privacy-notice` chạy thử → `--apply` cùng phiên; `form-token` 200; băm **5** trang khớp | P9, P10, K5 | |

Cổng khác:
- [ ] QC LP-v2 **QC rút gọn** (gate 6.3) trên `⟨SHA_L⟩` ra ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN, điều kiện "trước Release" xong. P1 (người bản xứ) INV bỏ 04/11; P2 (luật sư) xong 04/11; P3 nhãn = `2026-11-04`; P4 đổi nghĩa theo SEC.
- [ ] Biên bản staging S0–S8 ĐẠT (gồm S6 = D5, S7 diễn tập quay lui).
- [ ] P8 QC (`public_room_type` production) đọc ở P2 dòng 10.
- [ ] Không có lượt Release nào `in_progress`/`waiting`; không có lượt deploy production khác trong ngày (v1.0.4 không chồng lên).
- [ ] Khung giờ: ngoài khung nhận/trả phòng; INV (OWN) liên lạc được trong 1 giờ sau P10 cho K6.

**Dừng nếu** một ô D1–D6 hoặc P2–P6 là `CHUA` (D7 không chặn: chỉ chặn việc đặt mức C).

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
 && git tag -a ⟨APP_TAG⟩ ⟨SHA_L⟩ -m "⟨APP_TAG⟩ – LP-v2 server + Desk (migration 0092 price estimate + locales, OpenAPI 0.3.11, public price route, LANDING_LOCALES; CHAT_DETAILS_MIN_NOTICE_VERSION 2026-11-04). Same images as staging ⟨TAG_L⟩ (CI ⟨CI_RUN_L⟩). Runbook: rounds/round-04/outputs/OPS/lp-v2-release-runbook.md." \
 && git rev-parse '⟨APP_TAG⟩^{commit}' && echo "sha-$(git rev-parse --short=12 '⟨APP_TAG⟩^{commit}')" \
 && git show '⟨APP_TAG⟩:product/services/api/src/modules/public-site/public/chat-message.ts' | grep -c "CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'" \
 && git push origin ⟨APP_TAG⟩
```
**Đúng là:** `⟨SHA_L⟩`; `⟨TAG_L⟩`; `1` (D2 – QA xác nhận cùng dòng này); `* [new tag] ⟨APP_TAG⟩ -> ⟨APP_TAG⟩`.
**Dừng nếu** commit khác `⟨SHA_L⟩` hoặc số là `0`: `git tag -d ⟨APP_TAG⟩` trước khi push.

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

### P10. Đăng thông báo `2026-11-04` cho 5 ngôn ngữ – Ai chạy: ORC

Chạy thử:
```bash
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd /tmp && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh --landing-tag "$(sudo -n -u ottimo cat /opt/ottimo-prod/state/landing_tag)" --version 2026-11-04 --property DLT --operator ⟨OPERATOR⟩ 2>&1 | grep -vE "^\s*$"'
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
3. = `HASH_0092` (nếu drizzle lưu băm khác cách `shasum` – như K2 v1.0.3 – ARC xác nhận một lần, ghi vào 0.1);
4. `privacy_notice_version_locale_check|t`, `website_booking_request_locale_check|t`, `website_booking_request_price_estimate_check|f` (CHECK này không nói về locale – chỉ cần có dòng);
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
4. **Mốc 7 ngày** = giờ C + 7 ngày. Trước mốc, form bản cũ (consent `2026-10-24`) được nhận. Trước mốc, ORC phải chọn một trong hai: (a) lên lại LP-v2 (đã sửa; nhãn thông báo giữ `2026-11-04` nếu 5 trang thông báo không đổi byte, đổi byte thì nhãn mới), hoặc (b) đóng proxy form: `LANDING_PUBLIC_API=off` (khuôn `ENVSET`) → `deploy-landing.sh sha-72f9ac8e2b33 --no-pull` → `form-token` 404 HTML (quay lui (c) của README 12.3). Không đăng lại `2026-10-24` (SQL từ chối).

### 5.3 Đóng hẳn form website
Như README 12.3 quay lui (a)–(c): OWN tắt `public_booking_requests_enabled` (ngay) → `LANDING_PUBLIC_API=off` **trước** → `deploy-landing.sh --rollback` hoặc `--no-pull` → `form-token` 404 HTML của Caddy.

### 5.4 Quay app về v1.0.3 (`sha-da6d6f3dc22b`)
Dùng khi Desk/api/worker lỗi nặng do mã LP-v2. Lỗi chỉ ở giá → 5.1; chỉ ở landing → 5.2.
1. `ENVSET LANDING_LOCALES en,vi` (không `REDEPLOY`: bước 3 dựng lại api).
2. 5.2 bước 2 (landing về `sha-72f9ac8e2b33`) – v1.0.3 không nhận yêu cầu ko/zh và không có route giá, nên landing LP-v2 không được đứng trước api v1.0.3.
3. ```bash
   ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && { sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/rollback.sh sha-da6d6f3dc22b 2>&1; echo "MA THOAT: $?"; } | grep -E "^\[deploy |^another deploy|^usage:|^unknown option|^no previous tag|^digest must|^(Error|ERROR)|^MA THOAT: "'
   ```
   **Đúng là:** `deploy sha-da6d6f3dc22b (previous: ⟨TAG_L⟩, pull=1, rollback=1)`; `image digests match the release`; `api/worker configuration accepted by image sha-da6d6f3dc22b`; `02-roles.sh applied …`; **`migrations: 69 applied / 68 in the image journal`** (đúng: DB đi trước một migration); `OK: sha-da6d6f3dc22b is live`; `MA THOAT: 0`. Lỗi khác: R4b v1.0.3 (cùng ba ca a/b/c, thay tag).
4. Kiểm: K1 (`current=sha-da6d6f3dc22b previous=⟨TAG_L⟩`), K2 dòng 2 vẫn `69`, K5, K7 (14 dòng `ok`; `pricegap`/`pricelimit` vẫn `ok` vì không còn route giá), smoke-prod.
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
| 0.2 | Không có lượt CI; job lệch; băm 0092 lệch; hằng `2026-11-04` (api hoặc landing) chưa có; có push lên `main` trước khi `⟨CI_RUN_L⟩` `completed success` |
| S0–S8 | Staging đã có `2026-11-04` khác byte; S4 băm khác FE-B; **S6 ca 6 đỏ** (D5); S7 không ra WARNING/`same bytes` như bảng |
| P0 | Một ô D1–D6 hoặc P2–P6 `CHUA`; QC rút gọn chưa đạt; biên bản staging thiếu |
| P1 | `⟨SHA_L⟩` không thuộc `main`; có migration ngoài 0092; infra có tệp ngoài danh sách |
| P2 | Không chạy v1.0.3; thiếu digest v1.0.3; migration ≠ 68; thông báo đang hiệu lực khác `2026-10-24` en/vi; log có `2026-10-31`/`2026-11-01`/`2026-11-04`; dòng 9 > 30 |
| P2b | Băm gói lệch; gói thiếu kiểm giá / route giá / `LANDING_LOCALES`; `init-secrets` tạo tệp; `config` lỗi |
| P3 | Sao lưu không `OK:` |
| P4–P6 | Tag sai commit; hằng D2 = 0; `resolve` đỏ; digest lệch; deploy không `ok` |
| K1–K2 | Image/state lệch; migration ≠ 69; trigger ≠ `O`; `public_show_prices` đã có dòng |
| P8–P9 | `--check-only` có `FAIL`; thiếu ngôn ngữ; nhãn khác `2026-11-04` |
| P10 | Bất kỳ `refused`; dòng supersede khác `2026-10-24` en/vi; trang sống khác image |
| F1 | `ENVSET` lệch; `appconfig` từ chối |
| K3–K8 | Trang 5 ngôn ngữ không 200; K4 lệch 7 dòng; `form-token` ≠ 200; smoke counts ≠ 14/14; `FAIL` còn sau lượt chạy lại; worker mức C |
| F2 | Thiếu QC P6/P7/P8, chưa có mốc `priceswitch`; số web ≠ Desk; `pricegap` FAIL |

**Thường trực** (README 13.7, SEC RB-04): không `UPDATE`/`DELETE`/`TRUNCATE`/`ALTER`/`DISABLE TRIGGER` trên `privacy_notice_version`; không `session_replication_role = replica`, không `pg_restore --disable-triggers` vào DB có bảng này. Không dùng lại một nhãn thông báo cho chữ khác ở bất kỳ môi trường dùng chung nào (SEC mục 2).

---

## 8. Dòng decision-log đề nghị (ORC ghi khi commit)

`| 2026-11-04 | 4 | OPS – trả lời SEC FB-R4-SEC-LPV2M-03: README infra/server 12.3 mục LP-v2 viết lại theo trạng thái thật (production thông báo 2026-10-24 en/vi, landing sha-72f9ac8e2b33; 2026-10-31 không bao giờ đăng riêng; nhãn LP-v2 = 2026-11-04, không đăng 2026-10-31/2026-11-01; sau --apply thấy supersede 2026-10-24 (en)/(vi); quay lui landing in 2026-10-24, mốc 7 ngày tính từ giờ --apply); chú thích publish-privacy-notice.sql cùng nội dung. Runbook mới rounds/round-04/outputs/OPS/lp-v2-release-runbook.md: 0.2 ghim commit gộp lp-v2-main + giữ main yên tới khi CI xanh; staging S0–S8 (C8 qua Caddy thật = D5, diễn tập quay lui landing); P0 bảng D1–D7 + P1–P6 (P5 = hằng 2026-11-04); sao lưu, gói infra từ SHA_L, mốc priceswitch trước Release (D6); Release app (0092, DB 68 → 69) rồi landing; publish 5 ngôn ngữ; LANDING_LOCALES sau publish; K1–K8; public_show_prices OWN bật cuối; quay lui giá / landing (sha-72f9ac8e2b33) / app (sha-da6d6f3dc22b, DB 69 / image 68) | OPS | Quyền OPS (vận hành, runbook); SEC LPV2M-03 |`

---

## 9. Giả định, rủi ro, câu hỏi cho reviewer

**Giả định**
- **G1:** Tag app của LP-v2 khi đi trước v1.0.4 là `v1.0.4-lp.1` (đề xuất): `release.yml` nhận (`v[0-9]*.[0-9]*.[0-9]*`, OPS đã thử mẫu), là bản trước của v1.0.4 (cùng nền `main@L`), không lẫn với hotfix `v1.0.3.x` (cắt từ tag `v1.0.3`, plan-v1.0.4 2.1 ý 5). ORC chốt tên.
- **G2:** Tag landing `landing-v2.0.0` (đề xuất): `landing-v1.2.0` từng được gắn với lượt đăng `2026-10-31` riêng (đã bỏ), dùng lại dễ lẫn.
- **G3:** Hai tag cùng commit `⟨SHA_L⟩`, image landing của `⟨CI_RUN_L⟩` là image QA đã kiểm ở S3–S6. Nếu v1.0.4 đi trước (1.2 đường phụ), landing tag trên commit có image đã chạy ở staging với cùng 5 băm.
- **G4:** Staging có thể đã có dòng thông báo khác production (QA từng đăng trên stack thử, không phải staging – SEC mục 2). S0 ghi lại; chỉ dừng khi có `2026-11-04` khác byte.
- **G5:** `public_booking_requests_enabled` đang bật trên production từ US-155 (P2 dòng 7 = 1). Nếu tắt, F1/K5 vẫn làm, K5 kỳ vọng 404 `problem+json`, K6 bỏ.
- **G6:** Tên tham số query của route giá ở F2/K3 (`arrival`, `departure`, `adults`) theo `parseEstimateQuery`; QA thay bằng dạng đúng đã dùng ở S6 nếu khác.
- **G7:** `drizzle.__drizzle_migrations.hash` cùng cách tính như K2 v1.0.3 (đã khớp băm tệp 0091). Nếu khác, ARC xác nhận một lần.
- **G8:** OPS không SSH khi soạn bản này; mọi số "production lúc soạn" lấy từ decision-log 03–04/11 và SEC/ARC. P2 kiểm lại trước mọi thay đổi.

**Rủi ro**
- **R1 (trung bình):** v1.0.4 gộp vào `main` trong lúc lượt CI của `⟨SHA_L⟩` còn chờ → lượt bị hủy, Release từ chối tag (0.2). Giảm: ORC giữ `main` yên tới bước 0.2.5.
- **R2 (thấp):** khoảng P9 → P10 vài phút form en/vi hiện khối Zalo/gọi. Giảm: P10 chạy ngay, ngoài giờ đông khách.
- **R3 (thấp):** sau F1, trong lúc api dựng lại (15–30 giây), form và Desk trả lỗi tạm. Giảm: làm ngoài giờ nhận/trả phòng.
- **R4 (thấp – trung bình):** quay landing quá 7 ngày sau giờ C mà không chọn (a)/(b) ở 5.2 bước 4 → form bản cũ bị từ chối (`NOTICE_VERSION_INVALID`), khách thấy khối Zalo/gọi. Không lộ dữ liệu.
- **R5 (thấp):** `priceswitch` dựa vào id audit tăng dần (OPS LPV2-04, đã chấp nhận).
- **RR-NS (INV chấp nhận 04/11):** ko/zh/ru chưa có người bản xứ đọc. Đổi chữ theo phản hồi khách = nhãn mới, không sửa tại chỗ.

**Câu hỏi cho ARC/SEC**
- Q1 (SEC): bảng P0 (D1–D7 + P1–P6) đủ và đúng nghĩa mục 4 chưa; D3 phần P3/P4 chấp nhận "INV xác nhận trong chat ngày đăng" như lượt v1.0.1?
- Q2 (ARC): 5.4 bắt buộc quay landing trước khi lùi app – đồng ý, hay api v1.0.3 trả lỗi sạch cho yêu cầu ko/zh nên không cần?
- Q3 (ARC): K2 dòng 4 đọc CHECK bằng `pg_get_constraintdef … LIKE` – đủ, hay muốn so chuỗi nguyên văn?
