# ARC review – OPS: bật form website US-155 (PR #15, nhánh `ops/us155-enable`)

- Người review: ARC. Round 3 – bước Review. Ngày 30/10/2026.
- Phạm vi: `product/infra/server/bin/publish-privacy-notice.sh`, `product/infra/server/publish-privacy-notice.sql`, `product/infra/server/test/publish-privacy-notice.test.sh`, README `infra/server` 12.3, `product/docs/erd.md` 4.14, `rounds/round-03/outputs/OPS/us155-enable-plan.md` (bước G0–M, khung 31/10 07:00–08:30). Đối chiếu: migration 0001, 0086, 0087 (có trong `v1.0.0` = `sha-8b3aec89486f`), `02-roles.sh`, `deploy.sh`, `deploy-landing.sh`, `bin/dc`, `public-booking.service.ts` (`readiness()`, kiểm `consentVersion`), `audit-log.controller.ts`, `reviews/SEC-on-us155-enable.md` mục 3.
- Không chạy gì trên VPS. Không chạy lại test 15 ca (cần image CI). Kết luận dựa trên đọc mã và đối chiếu schema.

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

- Gộp PR được ngay. Khung 31/10 07:00–08:30 được chạy, với điều kiện **trước khung** OPS sửa 2 điểm tài liệu: FB-02 (G3) và FB-03 (thứ tự lùi landing). Mỗi điểm khoảng 10 phút, chỉ sửa chữ, không sửa mã.
- FB-01 (Major) **không chặn 31/10**: lần ghi đầu đúng. Phải xong trước lượt phát hành landing **kế tiếp** sau `landing-v1.1.0`. Từ 30/10, CI dựng image landing có form cho mỗi commit main, nên lượt kế tiếp có thể đến sớm.
- erd 4.14: ARC đã **duyệt và sửa** trên nhánh PR. Chi tiết ở mục "Trả lời OPS" (3).
- Tổng: 0 Blocker · 1 Major · 3 Minor · 2 Suggestion.

## Đã kiểm và đạt

| Điểm | Kết quả |
|---|---|
| Mô hình dữ liệu | Cột, CHECK version/sha, `url_path` cố định, PK (`organization_id`, `version`, `locale`) khớp 0086. FK `consent_fk` của `website_booking_request` trỏ đúng PK. |
| Vai DB | `ottimo_migrator` (LOGIN, NOINHERIT, `SET TRUE`) → `SET LOCAL ROLE ottimo_owner`. Không superuser. SQL tự từ chối khi `session_user` là superuser hoặc `current_user` khác `ottimo_owner` (ca 14). `SET LOCAL` hết tác dụng khi giao dịch kết thúc. |
| RLS | `ottimo_owner` NOBYPASSRLS. Bảng FORCE RLS. `public_resolve_property` đọc `property` nhờ policy `entry_function_read … TO ottimo_owner` (0001). Bản 0087 chỉ trả hàng khi **đúng 1** cơ sở trên toàn hệ thống có slug đó, nên bước kiểm `count = 1` vừa đủ. INSERT `privacy_notice_version` thỏa policy tổ chức nhờ `app.organization_id`. `audit_event` thỏa policy tổ chức + cơ sở nhờ `app.property_id`. Ca 3b xác nhận vai `ottimo_app` thấy đủ vi + en. |
| Một giao dịch | `BEGIN` → một khối `DO` → `COMMIT`/`ROLLBACK` theo `:apply`, có `ON_ERROR_STOP`. Lỗi ở đâu thì psql thoát và giao dịch bị hủy. Mọi kiểm cho cả 2 locale chạy **trước** mọi lệnh ghi. |
| Idempotent | Cùng version + cùng băm → `already-present`, không ghi, không audit. Cùng version + khác băm hoặc khác `url_path` → từ chối. Version đã bị thay → không dùng lại. Có version mới hơn đang hiệu lực → không ghi bản cũ. Kiểm sau khi ghi: đúng một version đang hiệu lực cho vi/en, giống `readiness()`. |
| Chỉ thêm dòng | Chỉ có INSERT, cộng một `UPDATE … SET superseded_at = now() WHERE … superseded_at IS NULL`. Không UPDATE nội dung, không DELETE. |
| Khóa | `LOCK TABLE … SHARE ROW EXCLUSIVE` xếp hàng hai lần chạy. Khóa này **không** chặn api: `readiness()` chỉ cần ACCESS SHARE. Kiểm FK khi khách gửi form lấy ROW SHARE + KEY SHARE, và lệnh UPDATE `superseded_at` (NO KEY UPDATE) không xung đột với KEY SHARE. Nghĩa là các lần đổi version sau này không làm form đứng. `lock_timeout` 5 giây. |
| Tham số hóa | `psql -v` → `:'var'` → `set_config` → `current_setting`. Không có SQL động. Script và SQL đều kiểm định dạng. |
| Audit | `category=security`, `actor_type=system`, `entity_id=version`. `after` không có C2/C3. Chạy thử không tốn số của sequence. Màn S27 đọc `before`/`after` như đã lưu (allowlist chỉ áp lúc ghi qua `AuditService`). `entity_id` không phải UUID nên hiện dạng `entityCode`. Màn S27 hiện đủ ngay, không cần sửa api. |
| Nguồn băm | Băm lấy trong container đang chạy, image mang đúng digest phát hành. Sau đó đối chiếu bản sao và trang thật qua edge. Bản dựng Astro không có dấu thời gian hay SHA git trong trang privacy, nên cùng digest cho cùng băm. Số QA ghi ở P4 đối chiếu được với số OPS ghi ở J. |
| Chặn biến test trên production | `PN_TEST_*` bị từ chối khi là stack production (ca 13). |

## Thẻ feedback

### FB-R3-ARC-OPS-US155-01
- Mức độ: **Major** (không chặn khung 31/10; phải xong trước lượt landing kế tiếp sau `landing-v1.1.0`)
- Vị trí: erd 4.14, định nghĩa `body_sha256`; `bin/deploy-landing.sh`; `us155-enable-plan.md` 1.4.
- Vấn đề:
  - `body_sha256` là băm **toàn tệp HTML**. Landing là bản dựng Astro với `inlineStylesheets: 'never'` và `scopedStyleStrategy: 'class'`, nên HTML trang privacy chứa tên tệp `/_astro/*.css` có băm, các lớp có băm, và đầu/chân trang dùng chung.
  - Hệ quả: chỉ cần sửa CSS, layout hay footer ở bất kỳ đâu, byte trang privacy đổi theo, dù chữ thông báo và version in trên trang giữ nguyên.
  - Công cụ đã từ chối đúng trường hợp này (ca 9: "ANOTHER text"). Nhưng **không có gì chặn `deploy-landing.sh` phát hành image đó**. Kết quả: trang thật khác băm đã lưu cho version đang dùng, và dòng `privacy_notice_version` không còn chứng minh khách đã đọc đúng byte nào.
  - Từ 30/10, CI dựng image landing có form cho mỗi commit main (decision-log 30/10), nên lượt landing kế tiếp có thể đến bất cứ lúc nào.
- Vì sao quan trọng: `consent_version` là bằng chứng pháp lý (NĐ 13/2023) cho câu hỏi "khách đồng ý với văn bản nào". Nếu băm lệch âm thầm, bằng chứng mất giá trị, mà không ai biết cho tới khi cần dùng.
- Đề xuất sửa:
  1. **Giữ định nghĩa toàn tệp** như SEC yêu cầu: ai cũng kiểm lại được bằng `curl | sha256sum`, và đó đúng là byte khách nhận. Thêm **bất biến**: một (`version`, `locale`) ứng với đúng một chuỗi byte. ARC đã ghi bất biến này vào erd 4.14.
  2. **`deploy-landing.sh`** (OPS), bước `config`, trước khi đổi container:
     - đọc version in trên `/privacy/` và `/vi/privacy/` của image **mới** (`docker run --rm --entrypoint sh <image> -c 'sha256sum …; grep …'`);
     - nếu DB có dòng **đang hiệu lực hoặc vừa bị thay trong 7 ngày** cùng (`version`, `locale`) mà băm khác → `FAIL: privacy page bytes changed for version X – bump the notice version`;
     - khác version thì cho đi tiếp, rồi in nhắc "chạy `publish-privacy-notice.sh`";
     - đọc DB bằng một truy vấn chỉ đọc, như `psql_admin` của `deploy.sh`.
     - Thêm 2 ca vào test: cùng version khác byte → `deploy-landing` từ chối; version mới → cho qua.
  3. Tới khi có bước 2: trước khi INV duyệt mỗi lượt landing, OPS so sha256 của 2 tệp trong image mới với `state/privacy-notice.log`. Đã ghi vào erd 4.14.
  4. (Gợi ý cho FE, R4, không bắt buộc) Giảm số lần phải đổi version: trang privacy dùng layout tối giản riêng và một stylesheet tên cố định, không băm.
- Trạng thái: Open

### FB-R3-ARC-OPS-US155-02
- Mức độ: Minor (sửa chữ trong kịch bản **trước khung 31/10**)
- Vị trí: `us155-enable-plan.md` 2.3 dòng G3, cột "Đường lùi"; mục 4 "Rủi ro".
- Vấn đề:
  - Đường lùi hiện ghi: hỏng ở `switch` thì "chép lại `.env` cũ rồi `dc up -d --wait api worker`". Đúng là `deploy.sh` không tự quay lui khi cùng tag (`restore_previous` chỉ chạy khi `prev != tag`).
  - Nhưng lúc tới `switch`, bước `appconfig` đã chạy `loadConfig()` của chính image đó với `.env` mới và **đã chấp nhận**. Lỗi ở `switch` vì vậy nhiều khả năng **không** do biến mới gây ra: healthcheck quá 240 giây, RAM, postgres, mạng `edge`. Chép `.env` cũ rồi `dc up` lại dễ gặp đúng lỗi cũ, mất thêm 4 phút mà Desk vẫn tắt.
  - Kịch bản cũng chưa có giới hạn thời gian để bỏ khung.
  - G3 là lần **đầu** `deploy.sh` mới (G1) chạy trên production. Nếu `appconfig`/`config` từ chối thì không có gì bị đổi. Đây là kết quả tốt, kịch bản nên ghi rõ.
- Vì sao quan trọng: Desk là công cụ duy nhất của người trực sáng thứ Bảy. Đường lùi phải nhắm đúng nguyên nhân và có giới hạn thời gian.
- Đề xuất sửa: thay cột "Đường lùi" G3 bằng:
  1. `deploy.sh` dừng ở `config`/`appconfig`/`roles`/`migrate`: không container nào bị đổi. Chép lại `.env` cũ, dừng khung, báo ORC.
  2. Dừng ở `switch` hoặc `smoke`:
     - `dc ps --all`, `dc logs --tail 80 api worker`;
     - nếu log nêu `LANDING_*`/`TRUST_PROXY` thì chép lại `.env` cũ;
     - còn lại thì giữ `.env`;
     - sau đó `dc up -d --wait --wait-timeout 180 api worker` (`bin/dc` tự lấy `state/current_tag`).
  3. **Hết 10 phút kể từ 07:12** mà api chưa healthy: bỏ I–M. Người trực dùng quy trình giấy dự phòng. OPS xử lý như sự cố (`v1-production.md` 17), báo ORC/INV.
  - Ghi thêm vào mục Rủi ro: dấu hiệu `landing` vẫn chạy sau `--remove-orphans` đã thấy ngày 26/10 (`v1-production.md` 19.3). Lần này vẫn kiểm `dc --profile landing ps` như kịch bản đã ghi.
- Trạng thái: Open

### FB-R3-ARC-OPS-US155-03
- Mức độ: Minor (sửa chữ **trước khung 31/10**)
- Vị trí: `us155-enable-plan.md` 2.3 dòng I, cột "Đường lùi"; 2.4 mức 3; README 12.3 "Quay lui (c)".
- Vấn đề:
  - Kịch bản ghi "`deploy-landing.sh --rollback` … **rồi** `LANDING_PUBLIC_API=off`". Container chỉ đọc `.env` lúc được tạo, mà `Caddyfile.landing` lại mount từ bundle.
  - Làm theo thứ tự đó thì bản landing cũ `sha-70fe734e9077` được dựng lại với `LANDING_PUBLIC_API=on`: đường proxy `/v1/public/*` vẫn mở trên trang không còn form. Đặt `off` sau đó không có tác dụng nếu không dựng lại thêm một lần nữa.
- Vì sao quan trọng: lùi xong phải đúng trạng thái "ottimo.vn không có `/v1/*`" như README cam kết. Vô hại khi công tắc tắt, nhưng sai so với điều kiện SEC.
- Đề xuất sửa: đổi thứ tự thành **(1)** đặt `LANDING_PUBLIC_API=off` trong `.env` → **(2)** `deploy-landing.sh --rollback` → **(3)** kiểm `GET /v1/public/properties/dlt/form-token` trên ottimo.vn trả 404 HTML (Caddy), không phải JSON. Sửa cả ở plan (I, 2.4 mức 3) và README 12.3 (c).
- Trạng thái: Open

### FB-R3-ARC-OPS-US155-04
- Mức độ: Minor (sau khung; có thể làm ở `v1.0.1`)
- Vị trí: README 12.3 (thiếu mục "đổi phiên bản thông báo sau này"); `publish-privacy-notice.sh` (chỉ băm từ landing **đang chạy**).
- Vấn đề:
  - Lần đầu, form còn tắt nên thứ tự "deploy landing (I) → ghi phiên bản (J)" không gây hại.
  - Ở các lần đổi version sau, khi form **đang bật**: từ lúc landing `N+1` lên tới lúc chạy công cụ, mọi khách gửi form với `consentVersion = N+1` đều nhận 422 `NOTICE_VERSION_INVALID`.
  - Tắt công tắc để tránh lỗi này thì phải chờ **tới ngày nghiệp vụ sau** mới bật lại được (luật công tắc).
- Vì sao quan trọng: mất yêu cầu đặt phòng thật, hoặc mất một ngày form.
- Đề xuất sửa (thiết kế ARC): ghi trước, kiểm sau. Cách này an toàn nhờ quy tắc 7 ngày của api: bản `N` vừa bị thay vẫn được nhận trong 7 ngày, nên form cũ đang chạy không lỗi.
  1. `publish-privacy-notice.sh --candidate-digest sha256:… --apply`: băm lấy từ image ứng viên (kéo theo digest, `docker run --rm`), không kiểm trang thật. Ghi `N+1` và đặt `superseded_at` cho `N`. Audit ghi `mode: candidate`.
  2. `deploy-landing.sh` image đó.
  3. `publish-privacy-notice.sh --verify`: trang thật = băm đã ghi, nếu không thì báo động (`ops-check`).
  - Ghi quy trình vào README 12.3, mục mới "Đổi phiên bản thông báo". Tới khi có công cụ, quy trình tạm là: ghi ngay sau khi deploy landing, trong cùng phiên SSH, ngoài giờ cao điểm.
- Trạng thái: Open

### FB-R3-ARC-OPS-US155-05
- Mức độ: Suggestion
- Vị trí: `publish-privacy-notice.sh`, bước 1–5.
- Vấn đề: công cụ khóa `state/privacy-notice.lock`, nhưng **không** khóa `state/landing.lock`. Nếu một lượt `deploy-landing` (CI, đã có người duyệt) chạy chen giữa bước băm/tải trang và bước ghi DB, công cụ có thể ghi băm của image vừa bị thay.
- Vì sao quan trọng: xác suất thấp, vì lượt landing cần INV duyệt. Nhưng cái giá là một bằng chứng sai.
- Đề xuất sửa: thêm `exec 8>"$state/landing.lock"; flock -n 8 || die "landing deploy in progress"` ngay sau khóa riêng của công cụ, giữ khóa tới hết bước 5. Hoặc, trước `psql`, kiểm lại `state/landing_tag` và id container vẫn như ở bước 1.
- Trạng thái: Open

### FB-R3-ARC-OPS-US155-06
- Mức độ: Suggestion
- Vị trí: `publish-privacy-notice.sql` dòng 165–167; `test/publish-privacy-notice.test.sh`.
- Vấn đề:
  - (a) Kiểm "không còn version khác đang hiệu lực" đang đếm **mọi** locale, trong khi CHECK của bảng cho phép `ru`. Nếu sau này có dòng `ru` ghi ở một version khác, công cụ sẽ từ chối, dù vi/en đúng.
  - (b) Test 15 ca chỉ chạy tay vì cần image, chưa có trong CI.
- Đề xuất sửa:
  - (a) Thêm `AND p.locale IN ('vi','en')` vào điều kiện đếm. Hoặc ghi rõ rằng khi thêm `ru`, công cụ phải ghi cả ba locale.
  - (b) Khi CI có image landing dựng có form (đã có từ 30/10), thêm một job tay (`workflow_dispatch`) chạy test này theo digest vừa dựng. P4 của QA vẫn là bằng chứng chính.
- Trạng thái: Open

## Trả lời câu hỏi của OPS (quyết định kỹ thuật ARC – ghi decision-log)

1. **Trigger chặn UPDATE/DELETE cả với `ottimo_owner`: CÓ, nhưng ở migration của `v1.0.1`, không chặn khung 31/10.**
   - Lý do không gấp:
     - `ottimo_owner` là NOLOGIN, chỉ tới được qua `ottimo_migrator` + `SET ROLE` (có dấu vết trong log PG);
     - `ottimo_app` chỉ có SELECT;
     - FK `consent_fk` (NO ACTION) đã chặn xóa mọi dòng có yêu cầu trỏ tới;
     - công cụ là đường ghi duy nhất.
   - Migration nằm trong image api, nên phải đi cùng một lượt deploy app. Không thêm bằng SQL tay.
   - Giao **BE** (`v1.0.1`), mẫu giống 0085/0087. Hàm `privacy_notice_version_append_only()`:
     - BEFORE UPDATE FOR EACH ROW: chỉ cho qua khi `OLD.superseded_at IS NULL AND NEW.superseded_at IS NOT NULL` và (`organization_id`, `version`, `locale`, `body_sha256`, `url_path`, `published_at`) không đổi (`IS NOT DISTINCT FROM`); còn lại `RAISE … USING ERRCODE = 'check_violation'`;
     - BEFORE DELETE FOR EACH ROW: từ chối;
     - BEFORE TRUNCATE FOR EACH STATEMENT: từ chối.
   - Test: `architecture.test.ts` (trigger tồn tại) + integration:
     - đổi sha → lỗi;
     - đặt `superseded_at` lần hai → lỗi;
     - DELETE → lỗi;
     - công cụ OPS chạy version kế tiếp vẫn đạt (lệnh UPDATE của công cụ đúng dạng được phép).
   - `pg_restore` (COPY) không kích hoạt trigger UPDATE/DELETE, nên diễn tập khôi phục không bị ảnh hưởng.
   - erd 4.14 đã sửa: bỏ chữ "REVOKE UPDATE/DELETE". Câu này không đúng với 0086: không có REVOKE nào, và REVOKE trên vai chủ cũng vô nghĩa.
2. **Allowlist audit `privacy_notice_version`: KHÔNG cần cho màn S27. Có đăng ký ở `v1.0.1` để giữ nhất quán (Suggestion cho BE).**
   - `audit-log.controller.ts` trả `before`/`after` như đã lưu; allowlist chỉ lọc lúc ghi qua `AuditService`. Vì vậy S27 đã hiện đủ `version`, `locales`, `shaVi`, `shaEn`, `landingTag`, `landingDigest`, `superseded`.
   - Đăng ký `defineAuditEntity('privacy_notice_version', ['version','locales','shaVi','shaEn','landingTag','landingDigest','superseded'])` trong `modules/public-site/audit-entities.ts`. Mục đích: danh mục allowlist là nơi duy nhất liệt kê trường được phép (SR-AUD-03), và test so registry api/worker có mục này. Không trường nào trùng regex `FORBIDDEN`.
   - Đây là mã api, nên làm ở `v1.0.1`.
3. **erd 4.14: DUYỆT, có sửa** (sửa trên nhánh PR, commit cục bộ trong worktree):
   - định nghĩa `body_sha256` toàn tệp HTML, như OPS viết;
   - thêm **bất biến** một (version, locale) = một chuỗi byte, kèm việc kiểm ở `deploy-landing.sh` (FB-01) và cách làm tạm;
   - đường ghi duy nhất, ghi rõ vai/ngữ cảnh/audit;
   - quyết định trigger `v1.0.1` (thay câu "nếu cần chặn…");
   - sửa câu 7 ngày cho đúng mã: mọi bản bị thay trong 7 ngày, không chỉ "bản ngay trước".
4. **Rủi ro G3 và đường lùi:** chấp nhận kịch bản dùng `deploy.sh` cùng tag thay vì `dc up` trực tiếp. Lý do: giữ được các chốt `config`, kiểm digest, `appconfig`, kiểm `migrate` và `smoke`. Đường lùi sửa theo FB-02. Gián đoạn Desk 15–30 giây vào 07:12 thứ Bảy chấp nhận được.

## Điểm làm tốt (nên giữ)

- Công cụ "người chạy không gõ dữ liệu": băm, tổ chức, locale, đường dẫn đều tự suy và đối chiếu ba nguồn (image theo digest, trang thật, form `data-consent-version`). Đây là mẫu đúng cho mọi lần ghi dữ liệu vận hành sau này.
- SQL viết như một migration dữ liệu có chốt: kiểm hết rồi mới ghi, `ON_ERROR_STOP`, tự từ chối superuser và sai vai, kiểm lại readiness ngay trong giao dịch. Chạy thử không tốn số sequence của audit.
- Kịch bản production có giờ, cách kiểm và đường lùi cho từng bước. Đã dò lại `v1-production.md` để biết bundle cũ và tránh khung giờ nhận/trả phòng.
