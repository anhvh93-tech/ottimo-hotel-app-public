# OPS – Round 3 – Sản xuất – Bật form "Yêu cầu đặt phòng" (US-155) trên ottimo.vn: công cụ, kịch bản production, cách QA thử

- Vai: OPS. Ngày: 30/10/2026. Bước: Sản xuất (chuẩn bị). **Không chạy gì trên production, không đụng VPS.**
- Đầu vào: `outputs/FE/us155-enable-readiness.md` (FE-B, bước A–M), `reviews/SEC-on-us155-enable.md` (SEC, thẻ **FB-R3-SEC-OPS-US155-01** – 12 yêu cầu), decision-log 30/10 (INV: bật sớm nhất có thể; SEC: bật với bản `2026-10-24` nguyên văn), README `infra/server` 12, `deploy.sh`, `deploy-landing.sh`, `init-secrets.sh`, `docker-compose.prod.yml`, `release.yml`, `v1-production.md` 15–21.
- Nhánh `ops/us155-enable`, PR (chưa gộp). Không có IP máy chủ, bí mật hay dữ liệu khách trong tệp này.

## 0. Tóm tắt

1. **Công cụ ghi `privacy_notice_version`:** `infra/server/bin/publish-privacy-notice.sh` + `infra/server/publish-privacy-notice.sql`. Mặc định chạy thử. Băm lấy trong container landing đang chạy (đúng digest phát hành) và đối chiếu trang thật. Ghi vi + en trong một giao dịch, chỉ thêm dòng. Có audit `security`. Không SQL tay. **Test 15/15 đạt** trên stack thử dựng bằng chính `docker-compose.prod.yml`.
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
| 1 | Một công cụ trong repo, đã review, có test, không SQL tay | Một script và một tệp SQL. Đầu cả hai tệp ghi "đường duy nhất được ghi bảng". Test `infra/server/test/publish-privacy-notice.test.sh` (15 ca). Chờ ARC + SEC duyệt PR. |
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
  bash product/infra/server/test/publish-privacy-notice.test.sh          → 15 passed, 0 failed (≈ 30 giây)
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
| 07:05 | G1 bundle | Sao lưu `/opt/ottimo-prod/infra` → `/root/ottimo-prod-bundles/infra-<sha>-<giờ>`. `rsync` bundle `main` (có commit P1) **chỉ vào** `/opt/ottimo-prod/infra`, như `v1-production.md` 15 dòng 20:46:38. So sha256 của `deploy.sh`, `deploy-landing.sh`, `publish-privacy-notice.*`, `docker-compose.prod.yml` với repo. Chạy `dc config -q`, `dc --profile landing config -q` | không ảnh hưởng (không dựng lại gì) | hash khớp | `rsync -a --delete <bản sao lưu>/ /opt/ottimo-prod/infra/` (10 giây) |
| 07:10 | G2 `.env` | Sao lưu `.env` → `state/env.before-us155.<giờ>` (0600). Thêm hoặc sửa `LANDING_BASE_URL=https://ottimo.vn` và `LANDING_PUBLIC_API=on` (`LANDING_IP` đã có). Kiểm bằng `grep -c` theo đúng dòng, không in tệp. Kiểm `public_form_signing_key`: `sudo stat -c '%a %u %s'` = `400 1000 44` | không ảnh hưởng | đếm dòng = 1 mỗi biến | chép lại bản sao lưu `.env` |
| 07:12 | G3 api nhận biến | `deploy.sh "$(cat state/current_tag)" --no-pull --api-digest <api= trong state/digests/<tag>> --web-digest <web=…>`. Các bước `config` → `appconfig` → `roles` → `migrate` (không có migration mới) → `switch` (api + worker dựng lại; web không đổi cấu hình nên không dựng lại) → `smoke` | **Desk gián đoạn khoảng 15–30 giây**: cả lệnh mất 2–4 phút, gián đoạn chỉ ở `switch`. Worker dừng khoảng 15 giây: job và outbox chạy trễ, không mất. ottimo.vn không ảnh hưởng (container landing không bị đụng) | `deploy … OK`; `ops-check containers` (api đúng 1 bản); `dc --profile landing ps` vẫn chạy; ottimo.vn 200 | `appconfig` dừng **trước** khi đổi container nếu cấu hình sai. Nếu hỏng ở `switch`: `deploy.sh` không tự quay lui khi cùng tag. Chép lại `.env` cũ rồi `dc up -d --wait api worker` (~20 giây gián đoạn nữa) |
| 07:20 | I landing | INV duyệt lượt Release `landing-v1.1.0` (environment `production`). CI chạy `deploy-landing.sh sha-<12> --digest …`, landing đọc `LANDING_PUBLIC_API=on` | ottimo.vn gián đoạn ~1 giây (đo 25/10: 1/145 lần lỗi) | Trang chủ 200 có khối form; `/privacy/`, `/vi/privacy/` 200; `GET /v1/public/properties/dlt/form-token` → **404 `application/problem+json`** (do api trả: đường proxy thông, công tắc còn tắt); `/v1/me`, `/v1/auth/login` → 404 HTML (do Caddy chặn). Form gửi thử lúc này hiện câu tạm dừng + Zalo/gọi | `deploy-landing.sh --rollback` (~10 giây) về `sha-70fe734e9077`, rồi `LANDING_PUBLIC_API=off` |
| 07:30 | J ghi phiên bản | `publish-privacy-notice.sh` chạy thử → đọc đầu ra (2 băm trùng số QA ghi ở P4, version `2026-10-24`) → chạy lại với `--apply` → `OK: version 2026-10-24 published`. Chép phần không bí mật (version, 2 băm, tag, digest, giờ) vào báo cáo OPS và gửi SEC | không ảnh hưởng | dòng `RESULT: published`; chạy lại lần nữa phải ra `already present` | Không có gì phải lùi: dòng ghi rồi giữ nguyên, vô hại khi công tắc tắt. Băm sai thì **không** sang bước K, dừng và báo SEC |
| 07:40 | K bật công tắc | **Chỉ khi J in `published`/`already present`.** OWN trên Desk H05: `public_booking_requests_enabled = true`, `effectiveFrom` = hôm nay | không ảnh hưởng | trả 200, không phải 422 `PUBLIC_FORM_NOT_READY`; `form-token` qua ottimo.vn → 200 | OWN tắt (mức 1, có hiệu lực ngay; bật lại sớm nhất ngày nghiệp vụ sau) |
| 07:45 | L khói | Theo FE-B 3.1: `ops-check`; INV gửi 1 yêu cầu "TEST OTTIMO" / `info@ottimo.vn` bằng điện thoại 4G; Desk thấy yêu cầu và thông báo; xóa theo WR8; OPS đếm READ ONLY, chỉ in số (0 dòng chứa chuỗi thử, C2 = NULL) | không ảnh hưởng | đủ 6 ý FE-B 3.1 | mức 1 → 2 → 3 (FE-B 3.2) |
| 08:15 | M ghi nhận | OPS: `ops-check`, đọc log api/landing 30 phút (không có 5xx); ghi báo cáo. ORC/SEC/PO: decision-log, release notes, G7-2 | – | – | – |

**Tổng:** khoảng 75–90 phút. Desk chỉ gián đoạn **một lần, 15–30 giây** (G3). Con số 14 giây "healthy" đo trên staging 26/10 khi dựng lại api + worker cùng image (`v1-production.md` 16, 11:39). Cộng thêm tới 10 giây chờ container cũ dừng. Thao tác nào trên Desk rơi vào lúc đó sẽ báo lỗi mạng; bấm lại sau 30 giây là được, không mất dữ liệu (mỗi thao tác là một giao dịch). Không cần đăng nhập lại: phiên nằm trong DB.

### 2.4 Đường lùi tổng (từ nhẹ tới nặng)

1. **OWN tắt công tắc** trên Desk: có hiệu lực ngay; landing hiện câu tạm dừng + Zalo/gọi.
2. **OPS cắt đường proxy:** `.env` `LANDING_PUBLIC_API=off` → `deploy-landing.sh "$(cat state/landing_tag)" --no-pull` (~10 giây): mọi `/v1/*` trên ottimo.vn trả 404.
3. **OPS gỡ form khỏi trang:** `deploy-landing.sh --rollback` (về `sha-70fe734e9077`, không form, không `/privacy/`), cùng với mức 2. INV xóa biến repo `LANDING_BOOKING_FORM` để bản dựng sau không có form.
4. **Trả api về cấu hình cũ** (hiếm khi cần: `LANDING_BASE_URL` để trống thì api trả 404 cho form): chép `state/env.before-us155.<giờ>` → `.env`, rồi `deploy.sh` cùng tag. Desk gián đoạn thêm 15–30 giây.

Dòng `privacy_notice_version` và yêu cầu đã nhận **không xóa** ở mức nào: yêu cầu trỏ FK tới dòng phiên bản.

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
  bash product/infra/server/test/publish-privacy-notice.test.sh      # 15 ca, ~30 giây; ghi 2 băm làm số đối chiếu bước J
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
