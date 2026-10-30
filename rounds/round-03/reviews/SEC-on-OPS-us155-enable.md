# SEC review – PR #15 `ops/us155-enable`: công cụ ghi `privacy_notice_version` + kịch bản bật form US-155

- Người review: SEC | Ngày: 30/10/2026 | Round 3 – Bước: Review.
- Đối tượng (nhánh `ops/us155-enable`, commit `7f9d463f`, `e92dc395`):
  - `product/infra/server/bin/publish-privacy-notice.sh`
  - `product/infra/server/publish-privacy-notice.sql`
  - `product/infra/server/test/publish-privacy-notice.test.sh`
  - `product/infra/server/README.md` mục 12 (bảng lệnh) và 12.3
  - `product/docs/erd.md` 4.14
  - `rounds/round-03/outputs/OPS/us155-enable-plan.md`
- Đối chiếu: 12 yêu cầu của thẻ FB-R3-SEC-OPS-US155-01 (`SEC-on-us155-enable.md` mục 3). Đọc thêm:
  - migration 0086 (bảng, RLS, grant, `public_resolve_property`), `infra/postgres/init/02-roles.sh`;
  - `readiness()` và kiểm `consentVersion` trong `public-booking.service.ts`;
  - WR8 `erase` trong `website-requests.service.ts`, đọc audit ở `audit-log.controller.ts`;
  - `deploy-landing.sh` (ghi `state/landing_tag`, `state/digests/landing-<tag>`);
  - FE-B `us155-enable-readiness.md` 3.1–3.2.
- CI của PR lúc review: gitleaks, shellcheck (infra scripts), lint/test/build, landing Playwright đều **pass**. Job "docker images build · E2E smoke" đang chạy.
- SEC không chạy lại test 15 ca. QA sẽ chạy lại ở P4 trên đúng digest CI (điều kiện D1 bên dưới).
- Không chạy gì trên production. Không có dữ liệu thật trong tệp này.

## Kết luận: **Duyệt có điều kiện**

Công cụ đáp ứng đủ 12 yêu cầu. Riêng yêu cầu 7, phần trigger thuộc ARC và không chặn lần ghi đầu. Không có Blocker, không có Major mới. Không có ESC mới.

Ba điều kiện, không chặn việc gộp PR:

| # | Điều kiện | Trước bước |
|---|---|---|
| D1 | QA chạy `publish-privacy-notice.test.sh` với **đúng digest landing CI** (P4) và ghi 2 băm. Ở bước J, OPS so 2 băm in ra với 2 số đó. Lệch thì dừng, không sang K. | J |
| D2 | OPS ghi sẵn **nguyên văn** lệnh đếm READ ONLY cho khói L vào kế hoạch. SEC duyệt câu lệnh trước khung giờ (thẻ 02). | L |
| D3 | ARC duyệt PR, gồm cả câu định nghĩa `body_sha256` ở erd 4.14. | gộp PR |

Hai thẻ Minor (03, ARC-PN-01) và một Suggestion (04) làm ở v1.0.1, không chặn khung 31/10.

---

## 1. Đối chiếu 12 yêu cầu – FB-R3-SEC-OPS-US155-01

| # | Yêu cầu | SEC kiểm | Kết quả |
|---|---|---|---|
| 1 | Công cụ trong repo, có test, không SQL tay | Một script và một tệp SQL. Đầu cả hai tệp ghi "the ONLY way". Test 15 ca. README 12.3 bước 6 ghi đây là đường duy nhất. Kịch bản 2.3 không còn lệnh ghi DB nào khác. | Đạt |
| 2 | OPS chạy qua `ottimo-admin`, theo runbook; không chạy khi chưa xong bước I | `sudo -u ottimo …` qua SSH `ottimo-admin`. Bước J đặt sau I. Script tự kiểm tag landing đang chạy. | Đạt |
| 3 | Người chạy chỉ gõ tag, mã cơ sở; phần còn lại tự suy | Org và property lấy qua `public_resolve_property(slug)`, phải đúng 1 kết quả. `--version` phải trùng cả 3 nguồn: dòng "Version …", dòng "Phiên bản …" và `data-consent-version` trên 2 trang chủ. Thêm form vào kiểm là tốt hơn yêu cầu. `locale`, `url_path` cố định. `published_at = now()`. `--version` và `--operator` người chạy phải gõ, nhưng cả hai đều được đối chiếu hoặc kiểm định dạng. | Đạt |
| 4 | Băm từ image, đối chiếu trang thật | `sha256sum` chạy trong container landing đang chạy. Image của container phải mang digest mà `deploy-landing.sh` đã ghi. Tệp chép ra được băm lại để đối chiếu. Trang được tải qua edge của máy với chứng chỉ thật và `Accept-Encoding: identity`, phải 200 và trùng từng byte. Định nghĩa băm có ở erd 4.14. Hai lỗ nhỏ: nhánh "trang thật khác image" chưa có ca test (OPS tự ghi ở 1.4), và biến `SMOKE_*` chưa bị chặn trên production (thẻ 03). | Đạt |
| 5 | Mặc định chạy thử | Không có `--apply` thì giao dịch vẫn chạy đủ, rồi `ROLLBACK`. Chạy thử in ra các dòng INSERT, supersede, audit "would". Không ghi audit khi chạy thử để khỏi tiêu số của sequence: SEC đồng ý. | Đạt |
| 6 | Một giao dịch vi + en; supersede trong cùng giao dịch | Một `BEGIN … COMMIT/ROLLBACK`, có `ON_ERROR_STOP`. Kiểm cả 2 locale **trước** khi ghi. | Đạt |
| 7 | Chạy lại an toàn; chỉ thêm dòng | Cùng băm → "already present". Khác băm → từ chối. Version đã bị thay → từ chối. Đang có version mới hơn → từ chối. `superseded_at` chỉ đặt khi còn NULL. Có `flock` và `LOCK TABLE`. Mức khóa SHARE ROW EXCLUSIVE không chặn SELECT của api, cũng không chặn FK của yêu cầu khách đang gửi. Phần trigger thì migration 0086 **chưa** REVOKE với `ottimo_owner` → thẻ ARC-PN-01. | Đạt (trigger: ARC) |
| 8 | Tham số hóa | Giá trị đi `psql -v` → `:'var'` → `set_config` → `current_setting()`. Không có SQL động. Script kiểm định dạng mọi đầu vào, SQL kiểm lại lần nữa. | Đạt |
| 9 | Vai DB đúng, RLS FORCE áp | Đăng nhập `ottimo_migrator` (NOSUPERUSER, NOBYPASSRLS, NOINHERIT) rồi `SET LOCAL ROLE ottimo_owner`. Đặt `app.organization_id` và `app.property_id`. SQL tự từ chối nếu phiên là superuser (ca 14) hoặc `current_user` khác `ottimo_owner`. | Đạt |
| 10 | Audit `security`, cùng giao dịch | `category=security`, `action=privacy_notice.published`, `actor_type=system`. `after` gồm version, locales, 2 băm, tag, digest, các dòng bị thay. `reason` = mã nhân viên; email bị từ chối (ca 8). Kết quả ghi ra stdout, `logger` và `state/privacy-notice.log`. Không có bí mật. | Đạt |
| 11 | Kiểm sau khi ghi = readiness | Cùng điều kiện với `readiness()`: mỗi locale vi/en có một dòng `superseded_at IS NULL`. Có thêm kiểm "không còn version khác đang hiệu lực". Ca 3b kiểm bằng `ottimo_app` qua RLS. | Đạt |
| 12 | Không đụng `config_parameter.privacy_notice_version` | SQL không chạm bảng đó. Script, SQL và README đều ghi rõ hai thứ trùng tên. | Đạt |

QA thêm 4 ca theo yêu cầu (chạy thử không ghi; `--apply` ghi đúng 2 dòng; chạy lại không đổi; khác băm → dừng). Cả 4 đã có trong test OPS (ca 1, 2, 5, 9). QA chỉ cần chạy lại trên digest CI (D1).

**FB-R3-SEC-OPS-US155-01 → Verified.**

## 2. Kiểm riêng theo đề bài ORC

| Mục | Kết quả |
|---|---|
| Không in/ghi bí mật | Script chỉ đọc 2 biến **không bí mật** trong `.env` (`APP_ENV`, `LANDING_HOST`). Mật khẩu preview staging đi qua `--config <(…)`, không lên dòng lệnh và không dùng trên production. Bí mật trong test là giá trị ngẫu nhiên, nằm trong thư mục tạm và bị xóa khi xong. Kế hoạch G2: kiểm `.env` bằng `grep -c`, kiểm khóa ký bằng `stat -c '%a %u %s'` (chỉ quyền, uid, độ dài). gitleaks pass. |
| Không SQL tay | Không còn lệnh ghi nào gõ tay. Lệnh đếm READ ONLY ở khói L chưa có nguyên văn → thẻ 02. |
| Vai DB đúng | Xem yêu cầu 9. |
| Băm từ image + trang thật | Xem yêu cầu 4. Thêm D1: so với 2 băm QA đo trên đúng digest CI. |
| Audit `security` | Xem yêu cầu 10. Màn audit S27 đọc `after` nguyên dạng, không qua allowlist, nên không lỗi khi gặp entity chưa đăng ký. Nội dung chỉ là version, băm, tag, không có C2/C3. Việc ARC đăng ký allowlist chỉ để đồng bộ. |
| Không lộ IP | Diff chỉ có `127.0.0.1` và các địa chỉ nội bộ Docker `172.30.x`. IP VPS chỉ xuất hiện dạng `<IP>`. Kế hoạch không có IP công khai. |
| Sửa `.env` (`LANDING_BASE_URL`, `LANDING_PUBLIC_API=on`) | Đúng thứ tự. `deploy-landing.sh` tự từ chối khi `on` mà `LANDING_BASE_URL` ≠ `https://<LANDING_HOST>`. Landing cũ không đọc lại biến cho tới bước I. Bản sao `.env` để quyền 0600: xem ghi chú 4.3. |
| Deploy lại api cùng tag | Digest lấy từ `state/digests/<tag>`, không gõ tay. `appconfig` dừng trước `switch` nếu cấu hình sai. Đường lùi tay có ghi. Đạt. |
| Deploy landing có form | Qua `release.yml`, INV duyệt. Ở bước I kiểm khi công tắc còn tắt: `form-token` → 404 JSON của api, `/v1/me` và `/v1/auth/login` → 404 của Caddy. Đúng điều kiện #2 trong `SEC-on-us155-enable.md`. |
| Ghi phiên bản (J) → OWN bật (K) | K chỉ sau khi J in `published`/`already present`. Server cũng tự chặn bằng 422 `PUBLIC_FORM_NOT_READY`. Đạt. |
| Công tắc khẩn | 3 mức (Desk → Caddy → gỡ form), giữ dòng phiên bản vì có FK. Đạt. |

## 3. Kiểm khói production (bước L) – dữ liệu có ổn không

**Ổn**, với 3 lưu ý nhỏ cho INV và OPS.

Vì sao ổn:
1. **`info@ottimo.vn` là hộp thư chung của doanh nghiệp, không gắn với một người cụ thể. "TEST OTTIMO" không phải tên người.** Dòng thử không chứa dữ liệu cá nhân của ai.
2. **Kênh Email loại trừ SĐT.** Server trả `phone NOT_ALLOWED` nếu chọn kênh `email` mà có số điện thoại. Không có đường lọt số của INV vào dòng.
3. **WR8 "Xóa theo yêu cầu" xóa đủ.** Tên, SĐT, email, lời nhắn, ghi chú từ chối, `contact_hmac` và `ip_hmac` về NULL. Có `pii_purged_at`, `purge_journal`, và audit `security` `website_request.erased` không chứa C2. Dùng WR8 thay cho "spam" (giữ tới 7 ngày) là đúng.
4. **Thông báo nhân viên không mang tên hay liên hệ** (`website_request_new`, theo chú thích và review trước của SEC). Tin Google Chat chưa có ở v1.0.0, nên không có bên nhận mới.
5. Không chụp màn hình có dữ liệu, cùng nguyên tắc OTM-00001.

Lưu ý:
- (a) **Chọn kênh liên hệ "Email"** khi gửi thử. Không nhập SĐT, kể cả SĐT của INV.
- (b) Lời nhắn giữ "Smoke test – please erase". Không thêm URL, không thêm số dài.
- (c) **Sau WR8 dòng vẫn còn**: mã REQ, ngày đến, số khách, trạng thái "declined/erased_on_request". Đây không phải dữ liệu cá nhân, nhưng sẽ được tính vào số "yêu cầu từ website". OPS ghi mã REQ thử vào báo cáo để DATA/PO loại khỏi chỉ số tuần đầu.

Ngoài dòng yêu cầu, lần gửi thử còn để lại:
- băm IP trong `rate_limit_counter` (hạn ngắn);
- access log của edge.

Cả hai giống mọi khách khác và nằm trong hạn lưu đã duyệt. Không cần xử lý riêng.

Lệnh đếm ở ý 5 FE-B 3.1 phải có nguyên văn trong kế hoạch → thẻ 02.

---

## 4. Thẻ feedback

### FB-R3-SEC-OPS-US155-02
- Mức độ: Minor (phải xong trước bước L, 31/10)
- Vị trí: `us155-enable-plan.md` 2.3 dòng L; FE-B `us155-enable-readiness.md` 3.1 ý 5.
- Vấn đề: kế hoạch chỉ ghi "OPS đếm READ ONLY, chỉ in số", chưa có câu lệnh. Nếu soạn lúc 07:45 trên production thì đó là SQL gõ tay. Dễ lỡ tay `SELECT *` làm in C2 ra terminal, hoặc quên bảng.
- Vì sao quan trọng: đây là bằng chứng "xóa sạch" mà SEC cần để ghi mốc bật form (bước M). Nó cũng là lần đầu có người chạy truy vấn đọc trên bảng có C2 thật.
- Đề xuất sửa: thêm vào kế hoạch một khối lệnh cố định. SEC duyệt câu chữ trước khung giờ.
  - Chạy `dc exec -T postgres psql -X -tA … -v ref=<REQ-…>` với SQL đọc từ stdin (heredoc trong kế hoạch). Mở bằng `BEGIN TRANSACTION READ ONLY;`, kết thúc bằng `ROLLBACK;`.
  - **Chỉ `count(*)`** hoặc `bool`. Không chọn cột dữ liệu.
  - Chuỗi tìm (`TEST OTTIMO`, `info@ottimo.vn`) đưa vào bằng `-v` + `:'var'`.
  - Phạm vi đếm:
    - `website_booking_request` theo `ref_code`: `guest_name`, `phone_e164`, `email`, `note`, `contact_hmac`, `ip_hmac` đều NULL; `pii_purged_at` NOT NULL;
    - `idempotency_key.response_body::text`;
    - `audit_event` (`before`, `after`, `reason`) từ đầu ngày;
    - `outbox_message` payload;
    - `staff_notification`;
    - lịch sử trạng thái của yêu cầu.
    - Bảng nào chứa chuỗi tìm thì phải đếm được 0 dòng.
  - Đầu ra chỉ có tên bảng và số. Chép nguyên đầu ra vào báo cáo OPS.
- Trạng thái: Open

### FB-R3-SEC-OPS-US155-03
- Mức độ: Minor (v1.0.1)
- Vị trí: `publish-privacy-notice.sh` dòng 128–130 (`SMOKE_HTTPS_PORT`, `SMOKE_ADDR`, `SMOKE_INSECURE`).
- Vấn đề: trên production, script chặn `PN_TEST_*` nhưng vẫn nhận `SMOKE_INSECURE=1` (bỏ kiểm chứng chỉ) và `SMOKE_ADDR` (tải trang từ địa chỉ khác `127.0.0.1`). Yêu cầu 4 nói "chứng chỉ thật". Hiện `sudo` mặc định xóa biến môi trường, nên rủi ro thực tế thấp.
- Vì sao quan trọng: đây là bước đối chiếu "trang khách thấy = văn bản ghi băm". Biến lọt vào thì bước đó yếu đi mà không ai biết.
- Đề xuất sửa: khi `is_prod=1` thì từ chối nếu `SMOKE_INSECURE` khác rỗng/0, hoặc `SMOKE_ADDR` khác `127.0.0.1`. Thêm 1 ca vào ca 13.
- Trạng thái: Open

### FB-R3-SEC-OPS-US155-04
- Mức độ: Suggestion
- Vị trí: `us155-enable-plan.md` 2.3 bước G1 (rsync bundle) và J; `test/publish-privacy-notice.test.sh`.
- Vấn đề / đề xuất:
  1. Bundle production sẽ có cả `infra/server/test/`. Test dựng một stack Docker trên máy nó chạy. Nên thêm chặn ở đầu test: từ chối khi thấy `/opt/ottimo-prod`, hoặc `.ottimo-home` = `production`. Hoặc loại `test/` khỏi rsync.
  2. Ở bước J, ngoài phép so qua edge của máy, INV/OPS chạy thêm một lệnh từ Mac qua mạng ngoài: `curl -sH 'Accept-Encoding: identity' https://ottimo.vn/privacy/ | shasum -a 256` (và trang `/vi/privacy/`). So với 2 băm ở J. Mất 1 phút. Nó chứng minh đường DNS công khai trả đúng văn bản. SEC dùng kết quả này để xác nhận điều kiện #4 phần "đã đăng".
  3. Nên có cùng `flock` giữa `deploy-landing.sh` và công cụ này. Tránh trường hợp landing đổi giữa lúc băm và lúc ghi. Rủi ro rất thấp vì chỉ một người thao tác.
- Trạng thái: Open

### FB-R3-SEC-ARC-PN-01
- Mức độ: Minor (migration v1.0.1)
- Vị trí: migration 0086 (`privacy_notice_version`); erd 4.14 ("REVOKE UPDATE/DELETE, trừ đặt `superseded_at` một lần").
- Vấn đề: erd ghi bảng chỉ thêm dòng, nhưng 0086 chỉ giới hạn `ottimo_app` (SELECT). `ottimo_owner` vẫn UPDATE `body_sha256`/`version` hoặc DELETE được. Công cụ OPS không làm việc đó, nhưng DB chưa tự chặn. Đây là yêu cầu 7 phần "ARC bổ sung trigger".
- Vì sao quan trọng: dòng này là căn cứ "khách đồng ý với văn bản nào" (FK `consent_version`). Lớp chặn ở DB giữ nó đúng kể cả khi có người dùng `psql` tay bằng vai chủ.
- Đề xuất sửa: trigger `BEFORE UPDATE OR DELETE` trên `privacy_notice_version`:
  - từ chối DELETE;
  - từ chối UPDATE, trừ khi chỉ đổi `superseded_at` từ NULL sang giá trị.

  Test: UPDATE `body_sha256` bằng `ottimo_owner` → lỗi. Đăng ký thêm `defineAuditEntity('privacy_notice_version', ['version','locales','shaVi','shaEn','landingTag','landingDigest','superseded'])` để đồng bộ với S27. Không chặn khung 31/10.
- Trạng thái: Open

## 5. Ghi chú khác

1. **Bản sao `.env` ở G2** (`state/env.before-us155.<giờ>`, 0600): `.env` không giữ bí mật (bí mật là tệp trong `secrets/`), nhưng có thể có email ACME. Giữ 0600, chủ `ottimo`, xóa sau 7 ngày nếu không phải lùi.
2. **Thứ tự P2 → P1:** INV đặt biến repo **trước** khi gộp, để commit gộp dựng image có form. SEC đồng ý. Image có form lên GHCR công khai trước giờ bật là bình thường. Form chỉ chạy khi `LANDING_PUBLIC_API=on` **và** công tắc Desk bật.
3. **Bước I → J → K liền nhau trong một phiên:** trang `/privacy/` công khai từ bước I, trước khi ghi phiên bản. Như vậy là đúng: phải đăng rồi mới băm trang thật được.
4. Khi đủ #2 (bằng chứng VPS ở G0/G2/I), #3 (D1), #4 (J + so băm từ ngoài, thẻ 04 ý 2) và kết quả khói L theo thẻ 02, SEC ghi dòng decision-log mốc "bật form" (bước M) như đã hẹn ở `SEC-on-us155-enable.md` mục 1.

## Điểm làm tốt

1. Kiểm `--version` với **cả** `data-consent-version` của form trên trang chủ, không chỉ trang thông báo. Nhờ vậy không thể ghi một version mà form sẽ gửi khác đi.
2. Kiểm DB "phòng thủ hai lớp": SQL tự kiểm lại định dạng, vai, superuser, và readiness. Có cả ca test chạy SQL bằng superuser để chứng minh bị từ chối.
3. Kế hoạch sản xuất có giờ, đường lùi cho từng bước, và tách rõ "OPS ghi phiên bản" với "OWN bật công tắc".

---

## Lượt 2 – 30/10/2026 (Phản hồi & sửa): xác nhận D2, FB-03, FB-04

- Đối tượng: commit `c126b1d4` nhánh `ops/us155-enable`:
  - `product/infra/server/bin/us155-smoke-counts.sh`, `product/infra/server/us155-smoke-counts.sql`;
  - phần sửa `publish-privacy-notice.sh` / `.sql` / test (ca 13b, 15–20);
  - kế hoạch 2.5, G1, J; `responses/OPS-us155-enable.md`.
- Đọc thêm để đối chiếu: `website-requests.service.ts` (audit của WR8 và lookup), `public-booking.service.ts` (`response_body` của khóa idempotency chỉ có `refCode`, `promise`), schema `public-site.ts` (C2 lưu thường, không mã hóa cột, nên tìm chuỗi trên `row::text` là có nghĩa), `psql_admin` của `deploy.sh`.
- SEC không chạy lại 22 ca. QA chạy lệnh đếm trên dòng do api ghi ở P4 (kế hoạch 2.5).

### Kết luận: **D2 Đạt.** Không còn điều kiện nào của SEC chặn bước L.

### D2 – câu chữ SQL/script: Đạt

| Điểm kiểm | Kết quả |
|---|---|
| Chỉ đọc | `BEGIN TRANSACTION READ ONLY` … `ROLLBACK`, `ON_ERROR_STOP` ở cả `-v` lẫn `\set`. `statement_timeout 60s`, `lock_timeout 5s`: gặp migration đang chạy thì lỗi, không chờ. Ca 16 chứng minh không đổi số dòng. |
| Chỉ in số | Đầu ra mỗi dòng là `số. tên kiểm \| giá trị \| kỳ vọng \| OK/FAIL`. Không chọn cột dữ liệu nào. Kiểm 14 chỉ in **tên bảng** có dòng trúng. Nhánh lỗi chỉ in tối đa 3 dòng `ERROR` (lỗi cú pháp/khóa, không chứa giá trị dòng). |
| Tham số hóa | `ref`, `since` được kiểm bằng regex (mã Crockford 8 ký tự; thời điểm bắt buộc có múi giờ, ca 20). Chuỗi tìm là hằng trong script. Mọi giá trị đi `sh -c … "$1"…` → `psql -v` → `:'var'`. SQL động duy nhất (kiểm 14) dựng bằng `format('%I', relname)` và `%L`. Không có đường chèn. |
| Phạm vi | Đủ các bảng thẻ 02 yêu cầu: dòng yêu cầu (C2 + `contact_hmac` + `ip_hmac` NULL, `pii_purged_at`), `purge_journal`, audit `security website_request.erased`, audit/idempotency/outbox/staff_notification/attention_event từ `since`, lịch sử SM-18. Thêm kiểm 14 quét mọi bảng `public` (bảng cha phân vùng tính một lần). Ngoài `public` chỉ có schema `drizzle` (sổ migration), không có dữ liệu khách. |
| Tự đánh giá đúng | Exit 0 chỉ khi đủ 14 dòng OK. Ca 17 (rò ở outbox → kiểm 8 và 14 FAIL), 18 (chưa xóa), 19 (mã sai) chứng minh có bắt lỗi. |
| Không chạy test trên production | `PN_TEST_DC` bị từ chối khi `is_prod=1`. |

**Kiểm 14 chỉ tìm "TEST OTTIMO": chấp nhận.** `info@ottimo.vn` là hộp thư chung, có thể có hợp lệ ở bảng tài khoản/cấu hình. Đếm nó toàn DB sẽ báo FAIL giả. Chuỗi này vẫn được tìm ở các kiểm 3, 6–8, 10, 11, 13 (các dòng sinh từ `since`). Đây là các nơi mà lần gửi thử có thể để lại dấu vết.

### Vai DB: chấp nhận superuser qua socket, trong giao dịch READ ONLY

Lý do:
1. Kiểm 14 phải thấy **mọi** dòng của mọi bảng. `ottimo_owner` có `app.organization_id` chỉ thấy tenant của mình, nên có thể bỏ sót bản sao lạc tenant. Superuser bỏ qua RLS (kể cả FORCE): đó đúng là điều cần cho phép kiểm "không còn ở đâu".
2. Hiện chưa có vai đọc riêng (BYPASSRLS, chỉ SELECT). Tạo vai mới ngay trước khung giờ là thay đổi hạ tầng không cần thiết.
3. Rủi ro được giữ bởi: câu SQL cố định trong repo và có test, giao dịch READ ONLY, chỉ in số. Đăng nhập qua socket của container, không mật khẩu trên dòng lệnh. Cùng tiền lệ `psql_admin` của `deploy.sh`.

Điều kiện dùng (ghi để OPS làm đúng, không phải điều kiện mới):
- Chỉ chạy qua `us155-smoke-counts.sh` đúng như kế hoạch 2.5. Không mở `psql` tương tác trên production.
- Nếu có kiểm FAIL: **không** tự truy vấn để xem dòng. Dừng và gửi SEC nguyên đầu ra (số kiểm, tên bảng). SEC quyết cách dọn. Mọi việc dọn đi qua WR8 hoặc công cụ có review, không SQL tay.
- `--since` lấy theo đồng hồ **ngay trước khi bấm gửi** yêu cầu thử. Mốc `07:45` trong kế hoạch chỉ là ví dụ. Nếu `since` muộn hơn lúc gửi: kiểm 5 FAIL (an toàn, không lọt) và kiểm 6–11 có thể bỏ sót. Kiểm 14 không lọc theo thời gian nên vẫn bao "TEST OTTIMO".

### Thẻ cũ

| Thẻ | Kiểm lại | Trạng thái |
|---|---|---|
| FB-R3-SEC-OPS-US155-02 | Như trên | **Verified** |
| FB-R3-SEC-OPS-US155-03 | `publish-privacy-notice.sh` dòng 47–49, đặt trước mọi chỗ đọc `SMOKE_*` (dòng 138–140). Khi `is_prod=1`, script từ chối nếu `SMOKE_INSECURE` khác rỗng/`0` hoặc `SMOKE_ADDR` khác `127.0.0.1`. Thứ tự `&&`/`\|\|` đúng. Ca 13b đạt. `SMOKE_HTTPS_PORT` vẫn nhận, nhưng chứng chỉ vẫn được kiểm và vẫn đi `127.0.0.1`, nên chấp nhận. | **Verified** |
| FB-R3-SEC-OPS-US155-04 | (1) test tự từ chối trên máy chủ, G1 có `rsync --exclude 'server/test/'` và kiểm "không có `infra/server/test/`"; (2) bước J có băm từ Mac qua mạng ngoài; (3) công cụ giữ `state/landing.lock` | **Verified** |

### Thẻ mới

#### FB-R3-SEC-OPS-US155-05
- Mức độ: Suggestion (v1.0.1, không chặn khung)
- Vị trí: `us155-smoke-counts.sh` dòng 30–31; `publish-privacy-notice.sh` dòng 58–62; `test/publish-privacy-notice.test.sh` ca 13b.
- Vấn đề / đề xuất:
  1. `shift 2 || true` khi cờ cuối thiếu giá trị (ví dụ `--ref` không có số): `shift 2` thất bại mà không dịch, nên vòng `while` lặp mãi. Script treo, không ghi gì, Ctrl-C là thoát. Sửa: `[ $# -ge 2 ] || usage`.
  2. Ca 13b mới thử `SMOKE_INSECURE`. Thêm một ca `SMOKE_ADDR=10.0.0.1` cho đủ hai nhánh.
- Trạng thái: Open

### Còn lại trước bật form (không thuộc D2)
- D1: QA ghi 2 băm trên đúng digest CI ở P4, OPS so ở J.
- D3: ARC đã duyệt có điều kiện (`f58bfd67`).
- Mốc M: SEC ghi decision-log "bật form" khi có đủ bằng chứng VPS (G0/G2/I), băm J (VPS = QA = Mac) và đầu ra `RESULT: OK – 14/14` của bước L.
