# OPS – Round 3 – Sản xuất – Bật form "Yêu cầu đặt phòng" (US-155) trên ottimo.vn: công cụ, kịch bản production, cách QA thử

- Vai: OPS. Ngày: 30/10/2026. Bước: Sản xuất (chuẩn bị). **Không chạy gì trên production, không đụng VPS.**
- Đầu vào: `outputs/FE/us155-enable-readiness.md` (FE-B, bước A–M), `reviews/SEC-on-us155-enable.md` (SEC, thẻ **FB-R3-SEC-OPS-US155-01** – 12 yêu cầu), decision-log 30/10 (INV: bật sớm nhất có thể; SEC: bật với bản `2026-10-24` nguyên văn), README `infra/server` 12, `deploy.sh`, `deploy-landing.sh`, `init-secrets.sh`, `docker-compose.prod.yml`, `release.yml`, `v1-production.md` 15–21.
- Nhánh `ops/us155-enable`, PR (chưa gộp). Không có IP máy chủ, bí mật hay dữ liệu khách trong tệp này.

## 0. Tóm tắt

1. **Công cụ ghi `privacy_notice_version`:** `infra/server/bin/publish-privacy-notice.sh` + `infra/server/publish-privacy-notice.sql`. Mặc định chạy thử. Băm lấy trong container landing đang chạy (đúng digest phát hành) và đối chiếu trang thật. Ghi vi + en trong một giao dịch, chỉ thêm dòng. Có audit `security`. Không SQL tay. **Test 22/22 đạt** (gồm lệnh đếm khói L) trên stack thử dựng bằng chính `docker-compose.prod.yml`.
2. **Kịch bản production** (mục 2): một khung **thứ Bảy 31/10, 07:00–08:30**. Desk chỉ gián đoạn **một lần, khoảng 15–30 giây** (api + worker dựng lại để nhận `LANDING_BASE_URL`). ottimo.vn gián đoạn khoảng 1 giây lúc đổi landing. Mỗi bước có đường lùi.
3. **QA thử landing có form:** không dựng lại staging landing. Dùng stack `ottimo-qa155` trên Mac, kéo **đúng image landing CI vừa dựng theo digest** từ GHCR công khai. Mất khoảng 15 phút dựng, 0 thay đổi VPS. Mục 3.
4. **Trước khung giờ cần có:** ARC + SEC duyệt PR này, ORC gộp. INV đặt 2 biến repo. CI dựng image landing có form. QA/SEC xác nhận #3 trên đúng digest đó. Mục 2.1.

---

## 1. Công cụ ghi `privacy_notice_version`

### 1.1 Cách dùng (trên VPS, người dùng triển khai)

```sh
cd /tmp
# chạy thử (mặc định): kiểm đủ, chạy giao dịch rồi ROLLBACK, in những gì sẽ ghi
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh \
  --landing-tag "$(cat /opt/ottimo-prod/state/landing_tag)" --version 2026-10-24 --property DLT --operator <mã nhân viên>
# ghi thật
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/publish-privacy-notice.sh … --apply
```

- `--landing-tag` là **tag image** mà `deploy-landing.sh` đang chạy (CI: `sha-<12>`), **không phải** tag git `landing-v1.1.0`.
- Người chạy chỉ gõ 4 thứ: tag, version, mã cơ sở, mã nhân viên của mình. `--digest` không bắt buộc; nếu gõ thì phải trùng digest `deploy-landing.sh` đã ghi.

### 1.2 Đối chiếu 12 yêu cầu SEC (FB-R3-SEC-OPS-US155-01)

| # | Yêu cầu SEC | Cách làm |
|---|---|---|
| 1 | Một công cụ trong repo, đã review, có test, không SQL tay | Một script và một tệp SQL. Đầu cả hai tệp ghi "đường duy nhất được ghi bảng". Test `infra/server/test/publish-privacy-notice.test.sh` (22 ca, gồm lệnh đếm khói L). Chờ ARC + SEC duyệt PR. |
| 2 | OPS chạy qua `ottimo-admin`, theo runbook | README 12.3 bước 6 và mục 2 dưới đây. Chạy bằng `sudo -u ottimo`, như mọi script khác. |
| 3 | Đầu vào chỉ có tag/digest và `DLT`; còn lại tự suy | `organization_id`/`property_id` qua `public_resolve_property(slug)`, phải đúng 1 kết quả. `version` đọc từ trang ("Version …", "Phiên bản …") **và** từ `data-consent-version` của form trên 2 trang chủ; lệch `--version` thì dừng. `locale`, `url_path` cố định. `published_at = now()`. |
| 4 | Băm lấy từ image, đối chiếu trang thật | `sha256sum` chạy **trong** container landing đang chạy; image của container phải mang digest phát hành (`state/digests/landing-<tag>`). Sau đó tải `https://<LANDING_HOST>/privacy/` và `/vi/privacy/` qua edge của máy, dùng chứng chỉ thật và `Accept-Encoding: identity`. Phải trả 200 và trùng từng byte, nếu không thì dừng. Định nghĩa `body_sha256` đã ghi vào erd 4.14 (chờ ARC duyệt). |
| 5 | Mặc định chạy thử | Không có `--apply` thì giao dịch chạy đủ (INSERT để kiểm ràng buộc, RLS, readiness) rồi ROLLBACK. Công cụ in version, locale, url, sha, mã cơ sở và câu lệnh sẽ chạy. Chạy thử **không ghi audit**: một dòng audit dù bị ROLLBACK vẫn tiêu một số của `audit_event_id_seq`. |
| 6 | Một giao dịch vi + en; `superseded_at` dòng cũ trong cùng giao dịch | Một `BEGIN … COMMIT`, `ON_ERROR_STOP`. Lỗi ở bất kỳ đâu thì không dòng nào được ghi (ca 7, 9). |
| 7 | Chạy lại an toàn; không UPDATE nội dung, không DELETE | Cùng version + cùng băm → "already present", không ghi gì (ca 5, 11). Cùng version + khác băm → từ chối (ca 9). Version đã bị thay → không cho dùng lại (ca 12). Có version mới hơn đang hiệu lực → không cho ghi version cũ. `superseded_at` chỉ đặt khi đang NULL (ca 11). Có `LOCK TABLE` để hai lần chạy không chồng nhau. |
| 8 | Tham số hóa | `psql -v` + `:'var'` → `set_config` → `current_setting()` trong plpgsql. Không ghép chuỗi, không SQL động. Script kiểm định dạng mọi đầu vào; SQL kiểm lại lần nữa. |
| 9 | Vai chủ schema + ngữ cảnh tổ chức, không superuser | Đăng nhập `ottimo_migrator` qua socket trong container postgres, rồi `SET LOCAL ROLE ottimo_owner`. Đặt `app.organization_id`/`app.property_id` nên RLS FORCE vẫn áp. SQL tự từ chối khi phiên là superuser (ca 14) hoặc không phải `ottimo_owner`. |
| 10 | Audit `security` trong cùng giao dịch | `audit_event`: `category=security`, `action=privacy_notice.published`, `actor_type=system`, `entity_type=privacy_notice_version`, `entity_id=<version>`. `after` gồm version, locales, shaVi, shaEn, landingTag, landingDigest, superseded. `reason` = "operator: <mã nhân viên>" (ca 4). Kết quả in ra stdout và ghi thêm vào `state/privacy-notice.log`. |
| 11 | Kiểm sau khi ghi = readiness | Trong cùng giao dịch: kiểm phải có dòng vi + en đang hiệu lực và không còn version nào khác đang hiệu lực, cùng câu điều kiện với `readiness()` của api. Ca 3b kiểm thêm ở vai `ottimo_app` qua RLS: api thấy đủ vi + en. |
| 12 | Không đụng `config_parameter.privacy_notice_version` | SQL không chạm `config_parameter`. Script, SQL và README đều ghi rõ hai thứ trùng tên. |

### 1.3 Kết quả thử (30/10, Mac OPS, stack thử – không phải staging VPS)

**Vì sao không thử trên staging VPS:** staging không còn container landing (bỏ từ 24/10). Mà công cụ phải băm **trong** container landing đang chạy và tải trang thật. Vì vậy OPS dựng stack thử `ottimo-pn-test` dùng **đúng** `docker-compose.prod.yml` (postgres + `02-roles.sh`, `migrate`, `seed` DS-E, `landing` với `Caddyfile.landing` thật), api `sha-8b3aec89486f-test` (= `v1.0.0` + hỗ trợ test), landing `ottimo-landing:qa155` (dựng có form, slug `dlt`). Landing chỉ mở ở `127.0.0.1`. Dữ liệu giả, mật khẩu ngẫu nhiên trong thư mục tạm. Chạy xong tự xóa hết: 0 container, 0 volume còn lại.

```
API_IMAGE_REF=ghcr.io/<owner>/ottimo-api:sha-8b3aec89486f-test LANDING_IMAGE_REF=ottimo-landing:qa155 \
  bash product/infra/server/test/publish-privacy-notice.test.sh          → 22 passed, 0 failed (≈ 35 giây; lượt 2, 30/10 chiều)
```

| Ca | Kết quả |
|---|---|
| 1 chạy thử: kiểm đủ, không ghi gì (0 dòng, 0 audit) | Đạt |
| 2 `--apply`: 2 dòng (vi, en) + 1 audit `security` | Đạt |
| 3 `body_sha256` + `url_path` trong DB = sha256 tệp trong image | Đạt |
| 3b vai `ottimo_app` (RLS) thấy dòng vi + en đang hiệu lực, tức readiness không còn báo thiếu | Đạt |
| 4 dòng audit: system, version, locales, operator | Đạt |
| 5 chạy lại: "already present", không ghi thêm | Đạt |
| 6 tag khác tag landing đang chạy → từ chối | Đạt |
| 7 `--version` khác version trên trang → từ chối, không ghi | Đạt |
| 8 operator dạng email → từ chối | Đạt |
| 9 cùng version, trang khác chữ (khác băm) → từ chối, không ghi | Đạt |
| 10 version kế tiếp (`2026-11-05`): thêm 2 dòng, `2026-10-24` được đặt `superseded_at` một lần, thêm 1 audit | Đạt |
| 11 chạy lại version kế tiếp: `superseded_at` không đổi | Đạt |
| 12 version đã bị thay không dùng lại được | Đạt |
| 13 biến test `PN_TEST_*` bị từ chối trên production | Đạt |
| 14 chạy tệp SQL bằng superuser → từ chối | Đạt |
| 13b (lượt 2) `SMOKE_INSECURE` / `SMOKE_ADDR` bị từ chối trên production (SEC FB-03) | Đạt |
| 15 (lượt 2) lệnh đếm khói: yêu cầu đã xóa WR8, không còn chuỗi thử → 14/14 OK, exit 0 | Đạt |
| 16 lệnh đếm không đổi gì trong DB (READ ONLY + ROLLBACK) | Đạt |
| 17 chuỗi thử còn trong `outbox_message` → kiểm 8 và 14 FAIL, exit 1 | Đạt |
| 18 yêu cầu chưa xóa → kiểm 2, 3, 4, 5, 14 FAIL, exit 1 | Đạt |
| 19 mã REQ không có → kiểm 1 FAIL | Đạt |
| 20 `--since` thiếu múi giờ → từ chối | Đạt |

Ví dụ đầu ra khi chạy thử (stack thử, landing `qa155`):

```
[privacy-notice …] image: /privacy/ sha256 79c8d55f…0764, /vi/privacy/ sha256 c6dfbb09…b575, version 2026-10-24 (pages + form)
[privacy-notice …] live: https://landing.localhost/privacy/ and /vi/privacy/ = 200, same sha256 as the image
NOTICE: dry-run (would): INSERT privacy_notice_version (organization=<property DLT>, version=2026-10-24, locale=vi, body_sha256=c6dfbb09…, url_path=/vi/privacy/, published_at=now())
NOTICE: dry-run (would): INSERT privacy_notice_version (… locale=en, body_sha256=79c8d55f…, url_path=/privacy/ …)
NOTICE: dry-run (would): audit_event security privacy_notice.published version 2026-10-24 locales vi,en operator ops.test …
NOTICE: readiness: privacy_notice_version vi+en active = 2026-10-24 (PUBLIC_FORM_NOT_READY no longer lists them)
[privacy-notice …] DRY RUN OK – nothing written. Re-run with --apply to publish.
```

Đầu ra lệnh đếm (ca 15, dữ liệu giả `K7P9QXA2`): 14 dòng `… | OK`, `RESULT: OK – 14/14` (mẫu đầy đủ ở mục 2.5).

Băm trên production sẽ **khác** số ở trên: image CI dựng với `LANDING_SITE_URL=https://ottimo.vn` và `LANDING_INDEXABLE=true`. Nếu QA chạy test này với **đúng image CI** (mục 3), số QA ghi được phải trùng số OPS ghi ở bước J. SEC dùng điểm này để đối chiếu.

Kiểm khác: `bash -n`; `shellcheck -x -S warning` (cùng mức CI, job "infra scripts") sạch cho cả hai script.

### 1.4 Giới hạn còn lại (ghi rõ)

- **Chưa tự động hóa ca "trang thật khác image"** (bước kiểm 4). Ca này khó dựng vì container chỉ đọc, Caddy phục vụ đúng tệp trong image. Mã kiểm vẫn chạy ở mọi lần thử (ca 1–2 đi qua nhánh so khớp). Nhánh "khác" là một phép so sánh chuỗi.
- **Vai chủ `ottimo_owner` về kỹ thuật vẫn UPDATE/DELETE được bảng này.** `ottimo_app` chỉ có SELECT, đúng erd. Muốn chặn cả vai chủ thì ARC thêm trigger "chỉ cho đặt `superseded_at` từ NULL" ở một migration sau. SEC yêu cầu 7 để việc này cho ARC; OPS không tự thêm migration.
- **Công cụ cần bundle `infra/` mới trên VPS.** Bundle production hiện cũ hơn `main`: thiếu bước `appconfig` của `deploy.sh`, đã ghi ở `v1-production.md` 21.5 #2. Kịch bản làm mới bundle trước (mục 2, bước P/G1).
- Thực thể audit `privacy_notice_version` được ghi thẳng bằng SQL nên không qua allowlist `defineAuditEntity`. Dữ liệu chỉ là version, băm, tag: không có C2/C3. ARC cân nhắc đăng ký allowlist để màn S27 hiện đủ trường.

---

## 2. Kịch bản production (cho ORC trình INV)

### 2.1 Điều kiện trước khung giờ (làm trong 30/10)

| # | Việc | Ai | Thời gian | Ghi chú |
|---|---|---|---|---|
| P1 | ARC + SEC review PR này. ORC gộp vào `main` | ARC, SEC, ORC | 30–45 phút | SEC yêu cầu 1: duyệt trước lần chạy đầu |
| P2 | Bước E: đặt biến repo `LANDING_BOOKING_FORM=true`, `LANDING_PROPERTY_SLUG=dlt` | INV (quyền repo) | 5 phút | Đặt **trước** lần gộp P1, để chính commit gộp dựng image có form (bỏ được một commit riêng ở bước F) |
| P3 | Bước F: CI `publish-images` trên commit gộp → `ottimo-landing:sha-<12>` có form, qua `check:dist` | CI | 30–40 phút | Ghi lại `sha-<12>` + digest |
| P4 | Bước G (FE-B, "staging"): QA chạy TC-WR-* + C-1 trên **đúng digest** đó ở `ottimo-qa155` (mục 3), cùng `publish-privacy-notice.test.sh` với image đó. SEC xác nhận #3 | QA, SEC | 60–75 phút | Ghi lại 2 băm làm số đối chiếu |
| P5 | ORC đặt tag có chú thích `landing-v1.1.0` trên commit P3. `release.yml` chờ INV duyệt (chưa duyệt) | ORC | 5 phút | INV bấm duyệt **trong** khung giờ, bước I |
| P6 | Báo nhân viên trực: "Desk bảo trì khoảng 1 phút lúc 07:10 thứ Bảy 31/10" | ORC/INV | – | |

Nếu P1–P5 chưa xong trước 22:00 ngày 30/10 thì dời cả khung sang **thứ Hai 03/11, 07:00–08:30** (sau ngày D). Không làm 01–02/11.

### 2.2 Khung giờ đề xuất

- **Đề xuất (A): thứ Bảy 31/10, 07:00–08:30, một phiên liền.**
  - 07:00 người trực đã vào ca: thấy ngay yêu cầu thử và thông báo.
  - Chưa tới giờ trả phòng (11:00–12:00) và nhận phòng (14:00–20:00).
  - Còn nguyên ngày để sửa nếu có việc, trước buổi đào tạo tối 31/10.
  - Xa ngày D (02/11).
- (B) Tách đôi: bước G (api khởi động lại) **tối 30/10, 22:15–22:30**, nếu P1 đã gộp và bundle sẵn sàng; I–M sáng 31/10, 07:00–08:15. Lợi ích: giảm 10 phút trong phiên sáng. Bất lợi: chạm Desk lúc có thể còn khách nhận phòng muộn, và cần 2 phiên SSH. Chỉ chọn B nếu INV muốn có form trước 07:30.
- (C) Chờ gộp vào lượt deploy `v1.0.1` (FE-B đề xuất): **không đề xuất**. INV muốn sớm, `v1.0.1` chưa có ngày.
- **Tránh:** tối 31/10 (17:00–22:00, đào tạo và khách đến), 14:00–20:00 hằng ngày, 11:00–12:00, cả ngày 01–02/11.

### 2.3 Các bước trong khung (A) – theo thứ tự

Mọi lệnh chạy qua SSH `ottimo-admin` (khóa `ottimo_ops`) từ Mac INV, theo `sudo -u ottimo …` như `v1-production.md`. Không in `.env` hay bí mật; chỉ đếm dòng hoặc in quyền tệp. INV ngồi cạnh từ bước I (duyệt, OWN bật công tắc, gửi thử).

| Giờ | Bước | Việc | Desk / ottimo.vn | Kiểm | Đường lùi |
|---|---|---|---|---|---|
| 07:00 | G0 kiểm trước | `ops-check.sh` xanh; `state/current_tag` (app) và `state/landing_tag` đúng như dự kiến; `state/backup.last_ok` dưới 26 giờ; `df` dưới 80 % | không ảnh hưởng | in kết quả | dừng nếu đỏ |
| 07:05 | G1 bundle | Sao lưu `/opt/ottimo-prod/infra` → `/root/ottimo-prod-bundles/infra-<sha>-<giờ>`. `rsync` bundle `main` (có commit P1) **chỉ vào** `/opt/ottimo-prod/infra`, như `v1-production.md` 15 dòng 20:46:38, **thêm `--exclude 'server/test/'`** (test dựng stack Docker – không để trên máy chủ; test cũng tự từ chối khi thấy `/opt/ottimo-prod`, SEC FB-04 (1)). So sha256 của `deploy.sh`, `deploy-landing.sh`, `publish-privacy-notice.*`, `us155-smoke-counts.*`, `docker-compose.prod.yml` với repo. Chạy `dc config -q`, `dc --profile landing config -q` | không ảnh hưởng (không dựng lại gì) | hash khớp; không có `infra/server/test/` | `rsync -a --delete <bản sao lưu>/ /opt/ottimo-prod/infra/` (10 giây) |
| 07:10 | G2 `.env` | Sao lưu `.env` → `state/env.before-us155.<giờ>` (0600). Thêm hoặc sửa `LANDING_BASE_URL=https://ottimo.vn` và `LANDING_PUBLIC_API=on` (`LANDING_IP` đã có). Kiểm bằng `grep -c` theo đúng dòng, không in tệp. Kiểm `public_form_signing_key`: `sudo stat -c '%a %u %s'` = `400 1000 44` | không ảnh hưởng | đếm dòng = 1 mỗi biến | chép lại bản sao lưu `.env` |
| 07:12 | G3 api nhận biến | `deploy.sh "$(cat state/current_tag)" --no-pull --api-digest <api= trong state/digests/<tag>> --web-digest <web=…>`. Các bước `config` → `appconfig` → `roles` → `migrate` (không có migration mới) → `switch` (api + worker dựng lại; web không đổi cấu hình nên không dựng lại) → `smoke`. Đây là lần **đầu** `deploy.sh` mới (G1, có `appconfig`) chạy trên production | **Desk gián đoạn khoảng 15–30 giây**: cả lệnh mất 2–4 phút, gián đoạn chỉ ở `switch`. Worker dừng khoảng 15 giây: job và outbox chạy trễ, không mất. ottimo.vn không ảnh hưởng (container landing không bị đụng) | `deploy … OK`; `ops-check containers` (api đúng 1 bản); `dc --profile landing ps` vẫn chạy (`--remove-orphans` – đã thấy landing còn chạy sau deploy 26/10, `v1-production.md` 19.3); ottimo.vn 200 | **(ARC FB-02)** (1) Dừng ở `config`/`appconfig`/`roles`/`migrate`: **không container nào bị đổi** – kết quả tốt; chép lại `.env` cũ, dừng khung, báo ORC. (2) Dừng ở `switch`/`smoke` (`deploy.sh` không tự quay lui khi cùng tag): `dc ps --all`, `dc logs --no-color --tail 80 api worker`; **chỉ khi log nêu `LANDING_*` hoặc `TRUST_PROXY`** thì chép lại `.env` cũ, còn lại giữ `.env`; rồi `dc up -d --wait --wait-timeout 180 api worker` (`bin/dc` tự lấy `state/current_tag`). (3) **07:22 (10 phút sau 07:12) mà api chưa healthy: bỏ I–M**; người trực dùng quy trình giấy dự phòng; OPS xử lý như sự cố (`v1-production.md` 17), báo ORC/INV |
| 07:20 | I landing | **Trước khi INV duyệt** (ARC FB-01, tạm thời tới khi `deploy-landing.sh` tự kiểm): OPS băm 2 tệp trong image mới (`docker run --rm --entrypoint sha256sum ghcr.io/<owner>/ottimo-landing@<digest> /srv/landing/privacy/index.html /srv/landing/vi/privacy/index.html`) và so với `state/privacy-notice.log`: cùng version mà khác băm → **không duyệt**. Lần này log còn trống (lần ghi đầu) – ghi "chưa có dòng" vào báo cáo; 2 băm phải trùng số QA đo ở P4. Rồi INV duyệt lượt Release `landing-v1.1.0` (environment `production`). CI chạy `deploy-landing.sh sha-<12> --digest …`, landing đọc `LANDING_PUBLIC_API=on` | ottimo.vn gián đoạn ~1 giây (đo 25/10: 1/145 lần lỗi) | Trang chủ 200 có khối form; `/privacy/`, `/vi/privacy/` 200; `GET /v1/public/properties/dlt/form-token` → **404 `application/problem+json`** (do api trả: đường proxy thông, công tắc còn tắt); `/v1/me`, `/v1/auth/login` → 404 HTML (do Caddy chặn). Form gửi thử lúc này hiện câu tạm dừng + Zalo/gọi | **(ARC FB-03, đúng thứ tự)** (1) `.env`: `LANDING_PUBLIC_API=off` → (2) `deploy-landing.sh --rollback` (~10 giây, về `sha-70fe734e9077`) → (3) kiểm `GET https://ottimo.vn/v1/public/properties/dlt/form-token` trả **404 HTML của Caddy**, không phải JSON |
| 07:30 | J ghi phiên bản | `publish-privacy-notice.sh` chạy thử → đọc đầu ra: 2 băm **phải trùng 2 số QA ghi ở P4** (SEC D1; lệch → dừng, không sang K), version `2026-10-24` → chạy lại với `--apply` → `OK: version 2026-10-24 published`. **Từ Mac INV qua mạng ngoài** (SEC FB-04 (2), 1 phút): `curl -sH 'Accept-Encoding: identity' https://ottimo.vn/privacy/ \| shasum -a 256` và `…/vi/privacy/` – phải trùng 2 băm ở J. Chép phần không bí mật (version, 2 băm VPS + 2 băm Mac, tag, digest, giờ) vào báo cáo OPS và gửi SEC | không ảnh hưởng | dòng `RESULT: published`; chạy lại lần nữa phải ra `already present`; băm Mac = băm VPS = băm QA | Không có gì phải lùi: dòng ghi rồi giữ nguyên, vô hại khi công tắc tắt. Băm sai thì **không** sang bước K, dừng và báo SEC |
| 07:40 | K bật công tắc | **Chỉ khi J in `published`/`already present`.** OWN trên Desk H05: `public_booking_requests_enabled = true`, `effectiveFrom` = hôm nay | không ảnh hưởng | trả 200, không phải 422 `PUBLIC_FORM_NOT_READY`; `form-token` qua ottimo.vn → 200 | OWN tắt (mức 1, có hiệu lực ngay; bật lại sớm nhất ngày nghiệp vụ sau) |
| 07:45 | L khói | Theo FE-B 3.1 + SEC 3. **L0:** OPS ghi giờ bắt đầu `since` (ví dụ `2026-10-31T07:45:00+07:00`). **L1:** `ops-check`. **L2:** INV gửi 1 yêu cầu bằng điện thoại 4G: tên **"TEST OTTIMO"**, kênh liên hệ **Email**, email **`info@ottimo.vn`**, **không nhập SĐT** (kể cả SĐT của INV), ngày đến cách ≥ 14 ngày, lời nhắn "Smoke test – please erase" (không URL, không số dài); không chụp màn hình có dữ liệu. **Ghi mã REQ** trên trang cảm ơn vào báo cáo OPS: DATA/PO loại mã này khỏi chỉ số "yêu cầu từ website" tuần đầu (dòng còn lại sau WR8 với trạng thái declined/erased_on_request). **L3:** Desk thấy yêu cầu và thông báo. **L4:** xóa theo WR8 (`same_contact` = `info@ottimo.vn`). **L5:** OPS chạy lệnh đếm cố định (mục 2.5) – chỉ số đếm | không ảnh hưởng | đủ 6 ý FE-B 3.1; lệnh đếm in `RESULT: OK – 14/14` | mức 1 → 2 → 3 (FE-B 3.2; mức 3 theo thứ tự ở dòng I) |
| 08:15 | M ghi nhận | OPS: `ops-check`, đọc log api/landing 30 phút (không có 5xx); ghi báo cáo. ORC/SEC/PO: decision-log, release notes, G7-2 | – | – | – |

**Tổng:** khoảng 75–90 phút. Desk chỉ gián đoạn **một lần, 15–30 giây** (G3). Con số 14 giây "healthy" đo trên staging 26/10 khi dựng lại api + worker cùng image (`v1-production.md` 16, 11:39). Cộng thêm tới 10 giây chờ container cũ dừng. Thao tác nào trên Desk rơi vào lúc đó sẽ báo lỗi mạng; bấm lại sau 30 giây là được, không mất dữ liệu (mỗi thao tác là một giao dịch). Không cần đăng nhập lại: phiên nằm trong DB.

### 2.4 Đường lùi tổng (từ nhẹ tới nặng)

1. **OWN tắt công tắc** trên Desk: có hiệu lực ngay; landing hiện câu tạm dừng + Zalo/gọi.
2. **OPS cắt đường proxy:** `.env` `LANDING_PUBLIC_API=off` → `deploy-landing.sh "$(cat state/landing_tag)" --no-pull` (~10 giây): mọi `/v1/*` trên ottimo.vn trả 404.
3. **OPS gỡ form khỏi trang** (ARC FB-03 – đúng thứ tự): (1) `.env` `LANDING_PUBLIC_API=off` → (2) `deploy-landing.sh --rollback` (về `sha-70fe734e9077`, không form, không `/privacy/`) → (3) kiểm `form-token` trên ottimo.vn trả 404 HTML của Caddy, không phải JSON. Làm ngược thứ tự thì bản cũ được dựng lại với proxy `/v1/public/*` còn mở. INV xóa biến repo `LANDING_BOOKING_FORM` để bản dựng sau không có form.
4. **Trả api về cấu hình cũ** (hiếm khi cần: `LANDING_BASE_URL` để trống thì api trả 404 cho form): chép `state/env.before-us155.<giờ>` → `.env`, rồi `deploy.sh` cùng tag. Desk gián đoạn thêm 15–30 giây.

Dòng `privacy_notice_version` và yêu cầu đã nhận **không xóa** ở mức nào: yêu cầu trỏ FK tới dòng phiên bản.

---

### 2.5 Lệnh đếm READ ONLY cho khói L5 (SEC FB-R3-SEC-OPS-US155-02 – nguyên văn, SEC duyệt trước khung)

```sh
cd /tmp
sudo -u ottimo /opt/ottimo-prod/infra/server/bin/us155-smoke-counts.sh --ref REQ-XXXXXXXX --since 2026-10-31T07:45:00+07:00
```

- Câu SQL nằm cố định trong `product/infra/server/us155-smoke-counts.sql` (SEC duyệt tệp này; không gõ lại trên máy chủ). Script `bin/us155-smoke-counts.sh` kiểm định dạng `--ref` (`REQ-` + 8 ký tự mã) và `--since` (bắt buộc có múi giờ), rồi chạy `dc exec -T postgres psql … -v ref=… -v since=… -v n1="TEST OTTIMO" -v n2="info@ottimo.vn" -f -`. Chuỗi tìm là hằng trong script, đi vào SQL bằng `:'var'`.
- `BEGIN TRANSACTION READ ONLY; … ROLLBACK;`, superuser qua socket trong container (như `psql_admin` của `deploy.sh` – thấy mọi tenant). **Chỉ `count(*)`**, tìm chuỗi trên `row::text` – không chọn cột nào ra màn hình.
- 14 kiểm, đầu ra `số. tên kiểm | giá trị | kỳ vọng | OK/FAIL`, kết thúc `RESULT: OK – 14/14` (exit 0) hoặc `RESULT: FAIL` (exit 1):

| # | Kiểm | Kỳ vọng |
|---|---|---|
| 1 | `website_booking_request` có đúng 1 dòng mã REQ này | 1 |
| 2 | dòng đó đã xóa theo WR8: `guest_name`, `phone_e164`, `email`, `note`, `decline_note`, `contact_hmac`, `ip_hmac` NULL; `pii_purged_at` có; `status = declined`, `decline_reason_code = erased_on_request` | 1 |
| 3 | dòng đó (toàn văn) chứa chuỗi thử | 0 |
| 4 | `purge_journal` `dsr_erase` / `null_columns` cho yêu cầu | 1 |
| 5 | `audit_event` `security` `website_request.erased` cho yêu cầu, từ `since` | 1 |
| 6 | `audit_event` từ `since` chứa chuỗi thử (`before`, `after`, `reason`, mọi cột) | 0 |
| 7 | `idempotency_key` từ `since` chứa chuỗi thử (`response_body`, mọi cột) | 0 |
| 8 | `outbox_message` từ `since` chứa chuỗi thử (`payload`, mọi cột) | 0 |
| 9 | `staff_notification` của yêu cầu (`website_request_new` tới OWN/MGR/FDL) | ≥ 1 |
| 10 | `staff_notification` từ `since` chứa chuỗi thử | 0 |
| 11 | `attention_event` ("Cần chú ý") từ `since` chứa chuỗi thử | 0 |
| 12 | `state_transition` `SM-18` (lịch sử trạng thái) của yêu cầu | ≥ 1 |
| 13 | lịch sử `SM-18` đó chứa chuỗi thử | 0 |
| 14 | **mọi bảng** schema `public` (bảng cha phân vùng tính một lần) có dòng chứa "TEST OTTIMO" – in tên bảng nếu có | 0 |

- Không đếm `info@ottimo.vn` ở kiểm 14: hộp thư chung có thể có hợp lệ ở bảng khác (tài khoản, cấu hình). Kiểm 6–8, 10–11 tìm cả hai chuỗi nhưng chỉ trên dòng tạo từ `since`.
- Chép **nguyên** đầu ra vào báo cáo OPS (chỉ có mã REQ và tên bảng, không dữ liệu cá nhân) và gửi SEC.
- Đã thử (mục 1.3, ca 15–20) trên dữ liệu giả dựng đúng như WR8 ghi. QA chạy thêm lệnh này sau ca WR8 thật của TC-WR ở P4 (stack `ottimo-qa155`, `PN_TEST_DC` trỏ vào compose của stack) để kiểm trên dòng do api ghi.

---

## 3. QA thử landing có form ("staging") – cách nhanh nhất

**Đề xuất: stack `ottimo-qa155` trên Mac QA, dùng đúng image landing do CI dựng (kéo theo digest).** Không dựng lại staging landing.

```sh
# image phát hành (GHCR công khai, không cần đăng nhập – SEC E.10)
docker pull ghcr.io/<owner>/ottimo-landing@sha256:<digest P3>
docker tag  ghcr.io/<owner>/ottimo-landing@sha256:<digest P3> ottimo-landing:qa155     # overlay dùng tên này, pull_policy: never
docker tag  ghcr.io/<owner>/ottimo-api:sha-8b3aec89486f-test ottimo-api:qa155         # api = v1.0.0 (+ test support)
# dựng stack theo đầu tệp tests/e2e/support/us155-stack/compose.us155.yml (đổi -p nếu stack khác đang chạy),
# chạy TC-WR-* + C-1 (0 request ra ngoài, CSP sạch), rồi:
API_IMAGE_REF=ghcr.io/<owner>/ottimo-api:sha-8b3aec89486f-test LANDING_IMAGE_REF=ottimo-landing:qa155 \
  bash product/infra/server/test/publish-privacy-notice.test.sh      # 22 ca, ~35 giây; ghi 2 băm làm số đối chiếu bước J
```

- Thời gian: dựng ~15 phút, test ~60 phút. Không đụng VPS, không tốn RAM staging, không cần DNS.
- Đúng điều SEC cần cho #3: chạy trên **đúng digest** sẽ deploy ở bước I. Image CI có `LANDING_SITE_URL=https://ottimo.vn`. Form gọi cùng nguồn (`/v1/public/…`, CSP `connect-src 'self'`), nên chạy được ở `landing.localhost`. Link canonical trỏ ottimo.vn là link, không phải request.
- Lưu ý: lúc OPS kiểm (30/10 sáng) đã có một stack `ottimo-qa155e` đang chạy trên Mac (QA). OPS không đụng; stack thử của OPS dùng tên và cổng riêng (`ottimo-pn-test`, 58160), đã xóa.
- Đường thật (edge, PROXY protocol, chứng chỉ Let's Encrypt, 4G) được kiểm trên production ở bước I, trong lúc công tắc còn tắt (`form-token` → 404 JSON của api), rồi ở khói L.

**Phương án không đề xuất: dựng lại staging landing trên VPS.** Phải làm: làm mới bundle staging (`4fab25b`, cũ); `.env` staging `LANDING_*` + deploy lại api staging (staging gián đoạn 30–60 giây); kiểm DNS và tên `staging.ottimo.vn` cùng route edge; bí mật `landing_access` (basic auth); `deploy-landing.sh` staging với image CI. Thêm khoảng 128 MB RAM trên VPS dùng chung. Ước 1,5–2 giờ OPS, có thể chạm DNS (INV). Chỉ đáng làm nếu SEC muốn thử đường edge **trước** production. Đề xuất không làm, vì bước I đã kiểm đường edge khi công tắc tắt.

---

## 4. Giả định, rủi ro, việc chưa xong

### Giả định
- [GIẢ ĐỊNH] App production đang chạy đúng tag ghi trong `state/current_tag` (FE-B: `v1.0.0` = `sha-8b3aec89486f`), digest có trong `state/digests/<tag>`. G3 đọc từ đó, không gõ tay.
- [GIẢ ĐỊNH] PostgreSQL production cho đăng nhập qua socket trong container (cấu hình mặc định của image; `ops-check`, `deploy.sh` đã dùng đường này với superuser). Công cụ dùng `-U ottimo_migrator`. Stack thử dùng cùng image và cấu hình nên đã kiểm.
- [GIẢ ĐỊNH] Biến repo đặt trước khi gộp P1 thì commit gộp tự dựng image có form, không cần thêm commit "release notes" riêng. PO vẫn sửa câu release notes (FE-B 1.3.2) trong commit sau.
- [GIẢ ĐỊNH] `operator` là mã nhân viên dạng chữ thường (ví dụ `ops.anh`), không phải email.

### Rủi ro
- **G3 trên cùng tag không tự quay lui** (`deploy.sh` chỉ quay lui khi đổi tag). Đã giảm rủi ro: bundle mới có bước `appconfig`, nên cấu hình sai bị chặn trước khi đổi container. Đường lùi tay đã ghi ở bảng 2.3.
- Bundle production đổi cùng lúc (G1) cũng đưa lên các thay đổi `infra/` khác từ 25/10 tới nay. Đã so: `deploy.sh` thêm `appconfig`; các script khác đã khớp `main` (`v1-production.md` 21.5). OPS so lại danh sách tệp khác nhau ngay trong G1, có tệp lạ thì dừng.
- Nếu ARC + SEC chưa duyệt kịp, không có đường tắt bằng SQL tay. Khung giờ dời theo mục 2.1.

### Việc chưa xong / cần vai khác
- ARC + SEC: review PR (script, SQL, test, erd 4.14). ARC: cân nhắc trigger chặn UPDATE/DELETE cho cả vai chủ, và allowlist audit `privacy_notice_version`.
- QA: chạy mục 3 trên digest P3, thêm ca SEC yêu cầu (chạy thử không ghi, `--apply` ghi đúng 2 dòng, chạy lại không đổi, image khác băm → dừng; test OPS đã có cả 4).
- PO: sửa câu release notes "bật trong 1 phút" (FE-B 1.3.2).
- OPS (sau gộp): chạy kịch bản 2.3 khi ORC/INV chốt giờ; ghi nhật ký vào `v1-production.md` (mục mới).

## 5. Tệp tạo/sửa (nhánh `ops/us155-enable`)
- Mới: `product/infra/server/bin/publish-privacy-notice.sh`, `product/infra/server/publish-privacy-notice.sql`, `product/infra/server/test/publish-privacy-notice.test.sh`, `rounds/round-03/outputs/OPS/us155-enable-plan.md`.
- Sửa: `product/infra/server/README.md` (bảng mục 12, viết lại 12.3), `product/docs/erd.md` (4.14: định nghĩa `body_sha256`, đường ghi duy nhất – chờ ARC duyệt).

## 6. Lượt 2 (30/10 chiều) – sửa theo SEC `SEC-on-OPS-us155-enable.md` và ARC `ARC-on-OPS-us155-enable.md`

| Thẻ | Mức | Đã làm |
|---|---|---|
| SEC D2 / FB-R3-SEC-OPS-US155-02 | Minor | `bin/us155-smoke-counts.sh` + `us155-smoke-counts.sql` (14 kiểm, READ ONLY, chỉ đếm, chuỗi qua `-v`); kịch bản 2.5 + dòng L; test ca 15–20 |
| SEC FB-R3-SEC-OPS-US155-03 | Minor | Script từ chối `SMOKE_INSECURE`/`SMOKE_ADDR` khác mặc định trên production; ca 13b |
| SEC FB-R3-SEC-OPS-US155-04 | Suggestion | (1) test tự từ chối trên máy chủ + G1 `rsync --exclude 'server/test/'`; (2) băm từ Mac qua mạng ngoài ở J; (3) khóa `landing.lock` (cùng ARC-05) |
| SEC 3 (c), lưu ý (a)(b) | – | Dòng L: "TEST OTTIMO", kênh Email, `info@ottimo.vn`, không SĐT, lời nhắn không URL; ghi mã REQ để DATA/PO loại khỏi chỉ số |
| ARC FB-R3-ARC-OPS-US155-01 | Major | **Để sau** (theo ORC): `deploy-landing.sh` từ chối image cùng version khác byte – làm trước lượt landing kế tiếp sau `landing-v1.1.0`. Trong khung 31/10: OPS so tay băm image mới với `state/privacy-notice.log` trước khi INV duyệt (dòng I) |
| ARC FB-R3-ARC-OPS-US155-02 | Minor | Đường lùi G3 viết lại: dừng trước `switch` = không đổi gì; sau `switch` xem log, chỉ chép `.env` cũ khi log nêu `LANDING_*`/`TRUST_PROXY`; quá 07:22 thì bỏ I–M |
| ARC FB-R3-ARC-OPS-US155-03 | Minor | Thứ tự lùi landing: `LANDING_PUBLIC_API=off` **trước** `deploy-landing.sh --rollback`, rồi kiểm 404 HTML – sửa dòng I, 2.4 mức 3 và README 12.3 (c) |
| ARC FB-R3-ARC-OPS-US155-04 | Minor | Để `v1.0.1` (ghi trước bằng `--candidate-digest`, kiểm sau) |
| ARC FB-R3-ARC-OPS-US155-05 | Suggestion | Công cụ giữ thêm `state/landing.lock` từ bước băm tới hết bước ghi DB |
| ARC FB-R3-ARC-OPS-US155-06 | Suggestion | (a) kiểm "version khác còn hiệu lực" chỉ trên vi/en; (b) job CI `workflow_dispatch` – để sau |
| ARC-PN-01 (SEC) | Minor | Thuộc ARC/BE (trigger, `v1.0.1`) |

Commit ARC `7af5b250` (erd 4.14) giữ nguyên trên nhánh.

