# Báo cáo OPS – Round 5, Gói 0 (ĐK-8 và việc vận hành v1.0.5), bước Sản xuất (06/11/2026)

ORC lưu tệp này từ báo cáo bàn giao của OPS (subagent không ghi tệp báo cáo).

## 1. Đã làm gì
- **ĐK-8:** trả lời đủ thẻ SEC 06/11 trên `main` (`a26804f6`, `c224f0e8`, `3027ab01`).
- **Ba PR chờ SEC + ARC review** (OPS không tự gộp):
  - #92 `r5-ops-caddy`: V5-67, Caddy landing bỏ `Authorization`;
  - #93 `r5-ops`: V5-73, V5-62, V5-65, V5-63, thẻ ARC-07, ARC-08;
  - #95 `r5-ops-runbooks`: runbook v1.0.5 r0 (V5-70, có bước gỡ khóa V5-65) và runbook "VPS mới" (V5-64).
- **Giờ sao lưu** (đọc từ repo, không cần kiểm thêm trên máy chủ):
  - production: `ottimo-backup@ottimo-prod.timer` lúc 03:00, lượt hai 15:00;
  - staging: `ottimo-backup.timer` lúc 03:30, lượt hai 15:30;
  - mỗi môi trường đúng một timer; khoảng cách 12 giờ.
- **V5-63** (PR #93):
  - log container sang `journald`, giữ 90 ngày;
  - `ops-check journal` (ARC-07): FAIL/WARN, kiểm nhóm `docker`;
  - Postgres `log_error_verbosity=terse` (ARC-08).
- **Kiểm:**
  - test infra cục bộ xanh; chạy trên mã cũ thì đỏ đúng chỗ;
  - CI job `infra scripts` của #93 xanh;
  - test API `reservation-list` đỏ một lần rồi xanh khi chạy lại (nghi chập chờn, ARC xét).
- Không SSH, không đổi gì trên máy chủ.

## 2. Con số "máy chủ mất hẳn"
Tính từ bản mới nhất trên Mac. Đã ghi ở mô tả PR #93, `product/infra/server/README.md` mục 7, `product/docs/hosting-plan.md` mục 8.

| Lịch | Tối đa | Khi kéo khoảng 19:00 |
|---|---|---|
| Trước v1.0.5, kéo tay 2 ngày một lần | 72 giờ | 64 giờ |
| Từ v1.0.5, kéo tay 2 ngày một lần | 60 giờ | khoảng 52 giờ |
| Mac tự kéo hằng ngày | khoảng 36 giờ | – |

## 3. Thẻ đã trả lời
- 054-01: Done.
- 054-02…06: Deferred → B-OPS.
- OR-01: Closed.
- OR-02: Open, chờ chủ đầu tư.
- OR-03: phần code Done; phần máy chủ làm ở W0.
- OR-04 → V5-63: đã làm.
- S6D-01: Done.
- FB-R5-SEC-ARC-07: Resolved (ý 1 Deferred).
- FB-R5-SEC-ARC-08: Resolved.
- FB-R5-SEC-ARC-09: OPS xác nhận giờ; chờ ARC sửa contract mục 1.14 và G7.

## 4. Việc trên máy chủ (cửa sổ bảo trì, cần chủ đầu tư đồng ý)
Không chạy trong 02:55–03:45 và 14:55–15:45.
- W0: gỡ khóa người `ottimo-ops`; làm trước P2b.
- P2b: làm mới gói `infra/` trên cả hai stack.
- W1: cài timer sao lưu, trước 15:00. Cài sau 15:00 thì một lượt chạy ngay, vì `Persistent=true`.
- W2: dựng lại container landing.
- W3: kiểm qua edge thật trên staging.
- W4: dọn `.env` staging.
- W5: mask `fwupd`.
- W6: chuyển log sang journald: staging, rồi production, rồi edge. Desk mất vài giây khi Postgres khởi động lại.
- W7: chạy `ops-check` đủ mục bằng `systemd-run` có nhóm `systemd-journal`.
- M4d: chạy trước lượt tính lại V5-17.

## 5. Giả định
- 15:00 cho production: chia đều 12/12, tránh giờ nhận phòng 14:00.
- Bản giữ theo tuần giữ tới 33 ngày, để mọi tệp vẫn dưới 35 ngày khi lỡ hai lượt.
- Ngưỡng `ops-check backup` 14 giờ.
- `SystemMaxUse=4G` là số đầu; đo lại 7 ngày sau W6.
- `ForwardToSyslog=no`; `RateLimitBurst=20000`/30 s.
- Câu đếm M4d là nháp, chờ SEC.
- "RPO 12 giờ" chờ chủ đầu tư xác nhận ngày 20/11.
- Hai stack dùng chung user `ottimo` và một `authorized_keys`; W0 bước 2 kiểm lại trước khi gỡ.
- ESC mới: không có.

## 6. Rủi ro / vướng mắc
- `id_hash_key` chưa có bản ngoại tuyến. Đề xuất cho SEC + ARC: chủ đầu tư giữ thêm bản này cạnh KEK. Mất hẳn VPS thì chỉ mục mù không khớp dữ liệu cũ tới khi băm lại.
- ARC-08 còn hai chỗ hở nhờ SEC xét: câu lỗi chính vẫn có thể chứa giá trị; dòng `STATEMENT` in nguyên câu SQL (`log_min_error_statement=panic` chưa thêm).
- Runbook VPS mới chưa diễn tập.
- Trên VPS hiện tại, `ops-check sshkeys` và `journal` sẽ FAIL tới khi làm W0 và W6.
- Chữ "14:00" ở sổ vận hành, release-notes, esc-pending: đã sửa thành 15:00 (BA `16eaa635`, ORC `d93d3e7c`, `1fbd6039`).

## 7. Việc chưa xong
- Ô `⟨CHỜ⟩` của runbook: điền lúc cắt bản.
- Đo `SystemMaxUse` 7 ngày sau W6.
- OR-L1 (khóa `.env` trùng): ngoài việc được giao, chưa làm.
- Việc trên máy chủ ở mục 4.

## 8. Cập nhật 06/11 tối – Phản hồi & sửa sau review ARC và SEC (#93, #95)
ORC lưu từ báo cáo bàn giao của OPS.
- **PR #93** (`r5-ops`, HEAD `59216001`):
  - đã sửa ARC OPS-06 và SEC 93-01, 93-02, 93-03;
  - CI xanh toàn bộ, MERGEABLE;
  - SEC duyệt có điều kiện, điều kiện đã đáp ứng.
- **PR #95** (`r5-ops-runbooks`, HEAD `bd175b80`):
  - runbook v1.0.5 và runbook VPS mới lên bản r1;
  - đã sửa ARC 01–05, 07 và SEC 95-01…07;
  - CI xanh toàn bộ, MERGEABLE;
  - chờ SEC và ARC đọc lại phần sửa (ORC đã giao 06/11).
- **Thứ tự gộp:** #93 trước #95. #95 gộp sau #94 (thứ tự ARC đề xuất).
- **Câu xin đồng ý mẫu theo đợt:** ở runbook r1 mục 0.2.
  - Đợt A: staging.
  - Đợt B: production, gồm W0, W5, P2.
  - Đợt C, P3–P5: chỉ sau khi diễn tập khôi phục V5-61 ĐẠT (QC R4 ĐK-2, SEC 95-02).
  - K: chạy riêng.
  - ORC dùng đúng câu mẫu khi xin chủ đầu tư; mỗi đợt xin riêng, đồng ý cho staging không thay cho production.
- **Việc chuyển:**
  - SEC 95-02 ý 4 → PO ghi vào plan ĐK-2: V5-61 chưa đạt thì v1.0.5 chưa lên production.
  - SEC 95-07 → ORC theo dõi khi cắt bản.

## 9. Cập nhật 07/11 – Phản hồi & sửa lượt 3 (sau khi #93, #95, #96, #109 gộp)
Thẻ trả lời ở `rounds/round-05/responses/OPS-responses.md`.

**PR #126 (`r5-ops-pgterse-fix`), gấp:**
- Sửa FB-R5-ARC-OPS-11: test `postgres-log-terse` chờ server thật qua TCP, báo lỗi kết nối riêng. Test này làm job `infra scripts` đỏ ngẫu nhiên ở mọi PR.
- Kiểm ở máy:
  - bản sửa 20/20 xanh khi chạy tuần tự, 12/12 xanh khi chạy song song;
  - bản cũ 10/12 khi chạy song song, đỏ đúng 2 dòng ARC thấy.
- Sửa FB-R5-SEC-BE-D1-04: CODEOWNERS thêm 4 tệp SEC.

**PR runbook r3 (`r5-ops-runbook-r3`):**
- P2c và P2 mục 8 dùng khối `v525-run` SEC ghim, chép nguyên văn. Trích ra từ runbook vẫn đúng SHA `60872413…41eb`.
- Bảng 0.1 đã điền:
  - `SHA_V525` = `897ff46e`; tệp SQL `f5db74ac…243f`, kiểm bằng `shasum`;
  - 7 khóa dừng;
  - nhãn hai dòng đếm;
  - hai merge commit #96 / #109.
- Cách đọc hai dòng đếm theo ORC 07/11 và ARC 12.6.
- K13 đếm bảng hoa hồng mới (V530-01 + DOM). Câu chờ SEC ghim; đã chạy thử trên DB dùng một lần.
- Luật `roles_version` ở luật chung và README `server` 11.1.

**Giả định:**
- K13 in ngày tạo thay cho lọc theo giờ triển khai. Lý do: câu là hằng nên ghim được, và INV có thể đã nhập bảng trên v1.0.4.
- "Đơn có người chốt" = đơn ngắn ngày, người chốt là sale/CTV, đúng luật của `syncCommission`. Chờ DOM xác nhận.

**Vướng:**
- Lúc nộp, job `gitleaks` đỏ ở PR #126. Lý do: commit `ae4a8358` trên nhánh `r5-s1-tests` (PR #123, BE) có một hằng thử dạng UUID ở `product/services/api/test/request-hash-guard-units.test.ts` dòng 20, bị luật `generic-api-key` bắt.
- Job quét mọi nhánh đã fetch, nên mọi PR đều đỏ tới khi xử lý. Không do PR của OPS.
- Cách xử lý chờ ORC/SEC quyết: một dòng allowlist neo đúng giá trị (đường dẫn SEC), hoặc BE viết lại lịch sử nhánh đó.
- **Đã xử lý:** SEC thêm allowlist theo commit trên `main` @ `ad70dc21`. ORC gộp `main` vào #126 và #129.

## 10. Cập nhật 07/11 – Phản hồi & sửa lượt 4 (review #126, #129)
Nguồn:
- `rounds/round-05/reviews/DOM-on-pr-99-delta-and-129.md`;
- `rounds/round-05/reviews/ARC-on-ops-prs-126-129.md`;
- `rounds/round-05/reviews/SEC-on-ops-prs-126-129.md`.

Thẻ trả lời ở `rounds/round-05/responses/OPS-responses.md`.

**#126:** ARC và SEC duyệt @ `d11a2700`. OPS không đẩy gì thêm vào #126. Các dòng CODEOWNERS reviewer gợi ý thêm đi vào #129.

**#129 (runbook r4, một lần đẩy):**
- **K13 đổi câu theo DOM 129-01, 129-02:**
  - dòng đếm đơn tỷ lệ cũ tính theo dòng hoa hồng chưa void và ngày chụp tỷ lệ, so tỷ lệ ngay trong câu; tách thêm phần đã đạt và phần dự kiến;
  - dòng mới đếm đơn hủy hoặc không đến mà OTTIMO giữ tiền.
- **Hệ quả:** bản ghim SEC r3 (`9fda2a80…`, `e601cfcd…`) không còn dùng được. SEC phải ghim lại câu r4 (`c13c4d68…0d71`) và khối chạy (`4f89c218…32ab`).
- **Chạy thử câu r4** trên DB dùng một lần có đủ 72 migration thật và vai thật: mọi ca DOM nêu ra đúng số kỳ vọng; không lộ chuỗi đánh dấu hay tỷ lệ; dòng gác dừng đúng.
- **Repo chỉ ghi `= 0` / `> 0`** cho các dòng đếm đơn (SEC 129-01). K13 áp đủ luật "Thêm" của P2c.
- **P2c bước 2** dùng `git -C` vào repo (ARC 129-01). OPS tái hiện lỗi cũ: chạy ngoài repo ra `fatal: not a git repository` rồi `THIEU`. Bản sửa ra `TRUNG`, `CO`, `CO`.
- **README 11.1:** thêm `granted_by`/`granted_at` khi cấp vai (ARC 129-02); thêm dòng audit tùy ARC xác nhận, và vai DB do ARC + SEC chốt (SEC 129-02).
- **CODEOWNERS:** thêm 3 dòng SEC: `postgres-log-terse.test.sh` (ARC 126-01), `scripts/*.sh`, `src/admin/` (SEC 126-01).

## 11. Cập nhật 07/11 – PR `r5-deps` (#161): `nodemailer` 10.2.1, `node:22-alpine` Node 22.23.4 (SEC DEPS-01, V5-41)
Nguồn: `rounds/round-05/reviews/SEC-dependabot-triage-v1.0.5.md` mục 4 (đặc tả), thẻ FB-R5-SEC-OPS-DEPS-01 (Major). Thẻ trả lời ở `rounds/round-05/responses/OPS-responses.md`.

**Phạm vi: đúng 5 tệp** (`git diff --stat origin/main...r5-deps`: 11 thêm, 11 bớt):
- `product/integrations/package.json`: `nodemailer` 10.0.16 → **10.2.1**, ghim chính xác.
- `product/pnpm-lock.yaml`: 3 hunk, đúng 4 chỗ của `nodemailer`. Integrity khớp `npm view`. pnpm 9.15.4 (trong container) sinh lại lockfile giống từng byte.
- `product/infra/docker/Dockerfile.api` (2 `FROM`), `Dockerfile.web` (2), `Dockerfile.landing` (1): `node:22-alpine` `0a7108bf…e402` → `fe4f6d74…9914` (Node 22.23.4, Alpine 3.24.3). Lấy nguyên commit `56c7a0f1` của PR #27, cherry-pick sạch.
- Không `pnpm.overrides`. Không đổi `.nvmrc`, `engines`, `packageManager`. Không gói nào khác.

**Chọn 10.2.1:** phát hành 22/10 13:46Z, đủ 14 ngày từ 05/11. 10.3.1 (29/10 12:31Z) chỉ đủ tuổi từ 12/11 19:31 giờ VN. PR mở 07/11, dự kiến gộp trước mốc đó. Nếu gộp từ 12/11 19:31 trở đi thì đổi sang 10.3.1 bằng commit mới và chạy lại toàn bộ kiểm.

**Kết quả kiểm** (chi tiết trong mô tả PR #161):
- `784488b2` (main `3faf6aff` đã merge): **9/9 job CI xanh**. T9 tay xanh hết: 1993 passed, 92 skipped, `0 flaky, 0 masked by retry`.
- Head `2a45cd8c` (main `8700dd82` đã merge): 8/9 xanh, T9 E2E xanh như trên. `gitleaks` đỏ vì một báo nhầm `generic-api-key` ở commit `a5785ddf` của nhánh BE `r5-v5-42` (#170). Commit này không thuộc PR #161, chưa có trên `main`. Job quét mọi ref (`--all`), nên mọi PR đều đỏ cho tới khi `main` có cách xử lý.
- Build tại máy ở head: landing xong (10 trang, `check:dist` 14/14), api production xong. `node --version` = `v22.23.4` ở cả stage build landing và image api. OpenSSL 3.5.9. Image api chỉ có một bản `nodemailer@10.2.1`.
- `pnpm audit`: `main` 15 → nhánh 12, mất đúng 3 advisory `nodemailer`.
- Ở `7904c51a`, job test đỏ một lần vì test chập chờn của admin-web: `bug-r4-038-fea.test.tsx`, "Unhandled Rejection" `window is not defined` ở `useResource.ts:41` sau khi jsdom đã dọn. Cùng SHA trong T9 thì xanh. Ghi cho FE, không sửa trong PR này.

**Chưa xong:**
- Chờ `main` xử lý báo nhầm `gitleaks` (BE đã có `cb34efe7` trên nhánh `r5-v5-42`). Sau đó OPS merge `main` vào `r5-deps`, chạy lại 9 job, T9 và build landing, rồi xin gộp.
- Chờ SEC + ARC review; INT xem phần SMTP.
- Sau khi gộp (SEC 4.3, checklist trong PR):
  - CI `push` trên `main` xanh (publish images, deploy staging);
  - INT chạy `mail-test` qua relay staging;
  - chỉ còn cảnh báo #3 và #19;
  - OPS đóng #9, #10, #11 và kiểm #27;
  - PO thêm dòng Ghi chú kỹ thuật vào release notes v1.0.5.

## 12. Cập nhật 16/11 – FB-INV-010 Đợt 1: proxy `monthly-rates` trên landing (PR `r5-fb010-ops-caddy`)

**Đã làm**
- `Caddyfile.landing` mở thêm đúng một route: `GET /v1/public/properties/<slug>/monthly-rates`. Route chỉ nhận GET, đúng đường dẫn, không có query, và chỉ mở khi `LANDING_PUBLIC_API=on`. Route dùng chung snippet `public_api` với ba route cũ (bỏ `Authorization`, ghi đè `X-Forwarded-For`, timeout). Mọi biến thể khác (có query, POST/HEAD/OPTIONS, đường dẫn con, slug sai) trả 404 và không tới api. Edge không có rate limit; giới hạn nằm ở api (dùng chung bucket với price-estimate, PR #180).
- `check-caddy-landing.sh` thêm 2 ca proxy, 10 ca 404, 1 ca "không tới api", và thêm route vào bộ kiểm `Authorization` (production + staging) và bộ kiểm proxy tắt.
- README mục 12.3, LP-v2 bước 8: landing chỉ bán dài hạn, đổi BR-108 không còn kéo theo phát hành landing. Ghi chú cũ chỉ còn dùng khi quay landing về bản v1.0.4.
- Chú thích trong `docker-compose.prod.yml`, `env.example`, `env.production.example`, `ci.yml`: ba (hoặc hai) thao tác → bốn.

**Giả định**
- Trang gọi `monthly-rates` không kèm query (`booking-transport.ts` `fetchMonthlyRates` của #181). Api trả 422 khi có query, nên Caddy chặn luôn.

**Rủi ro / vướng mắc**
- Máy OPS không chạy được Docker và không có shellcheck, nên `check-caddy-landing.sh` mới chỉ qua `bash -n`; CI job `infra-scripts` / shellcheck mới là phép kiểm thật.
- Phạm vi bản app: `main` có 190 commit api sau `v1.0.4`, gồm phần v1.0.5 đang treo; không có migration mới. Tag app từ `main` sẽ đưa các commit đó lên production cùng #180. ORC chọn A (đi như v1.0.5, đủ bảng kiểm 4a) hay B (nhánh vá từ `v1.0.4`; thử gộp #180 lên `v1.0.4` có 5 xung đột).
- `ops-check pricelimit` vẫn chỉ đếm 429/503 của route `price-estimate`. Hai route dùng chung bucket, nên quét `monthly-rates` vẫn hiện ra qua price-estimate. Nếu muốn đếm riêng thì làm việc sau, không thuộc PR này.

**Việc chưa xong**
- Deploy production (bước sau, theo checklist trong thân PR).

## 13. Cập nhật 16/11 chiều – Kiểm thử (chuẩn bị staging): gói `infra/` staging + landing staging (ESC-052 = A)

Căn cứ: giao việc ORC 16/11; decision-log 16/11 (ESC-052 = A); `rounds/round-05/qa/v1.0.5-fb010-staging.md`; thân PR #182 (mục 2–3); README `product/infra/server/README.md` mục 2, 12, 12.3; runbook v1.0.5 mục 0.2, P2b, W2. Chỉ đụng stack staging (`/opt/ottimo`, project compose `ottimo`, mốc `.ottimo-home` = `staging`). Trước mỗi lệnh ghi đều kiểm mốc. Không đụng `/opt/ottimo-prod`, `/opt/ottimo-edge`, systemd, journald. Không SQL. Không in địa chỉ máy, bí mật hay mật khẩu.

**Kết luận: DỪNG ở bước landing.** Gói `infra/` staging đã làm mới. `deploy-landing.sh --check-only` **FAIL ở bước `privacy`**, nên landing staging chưa đổi. Theo PR #182 mục 2, bước 3: băm trang privacy đổi thì dừng và báo SEC.

**Đã làm (giờ VN)**

| Giờ | Bước | Kết quả |
|---|---|---|
| 13:30 | Đọc hiện trạng (chỉ đọc) | Staging: `current_tag` = `sha-32c9bd2def9a` (CI deploy 06:26Z, lượt 43805583212 đạt), `landing_tag` = `sha-6414be25f20d`, `EDGE_MODE=edge`, `LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`. Caddyfile landing cũ: 0 dòng `monthly-rates`, 0 dòng bỏ `Authorization`. Staging không có `HEARTBEAT_URL` và `ALERT_WEBHOOK_URL`. Production: app và landing đều `sha-6414be25f20d` |
| 13:30 | Gói từ `32c9bd2d` (`git archive product/infra`), `scp`, so băm | Băm Mac = máy chủ, 12 ký tự `376f55614ad4`. Gói có: matcher `@public_monthly_rates`, `header_up -Authorization`, `sshkeys` + `pricegap` tĩnh, compose driver `journald`. So với gói staging cũ: `02-roles.sh`, `deploy.sh`, `deploy-landing.sh` **không đổi** (nên không cần áp lại phân quyền DB) |
| 13:31 | Thay gói staging (P2b bước 3, đổi đường dẫn sang staging) | `BAN CU GIU O: /root/ottimo-staging-bundles/infra-20261116-133101`. `rsync --checksum --delete` chỉ vào `/opt/ottimo/infra`, loại `server/test/`. `diff -rq` khớp. `dc --profile landing --profile deploy config -q` OK. Gói production không đổi (Caddyfile production vẫn 0 dòng `monthly-rates`) |
| 13:31 | `deploy-landing.sh sha-32c9bd2def9a --digest sha256:58013dab…88aa7 --check-only` (user `ottimo`) | Digest landing lấy từ log job `publish images (GHCR)` của lượt 43805583212. Bước `config`, `pull`, `digest` qua. **Bước `privacy` FAIL**: "privacy page bytes changed for a published notice version", cả 5 ngôn ngữ, cùng nhãn `2026-11-04`. Không đổi gì, không ghi gì |
| 13:35 | Tìm nguyên nhân (chỉ đọc; đọc tệp trang EN của hai image, container `--rm --network none`) | Trang `/privacy/` EN của image mới khác bản đã đăng đúng **2 dòng**: (1) khối JSON-LD `LodgingBusiness` có `description` mới (chữ site của #181 trong `content/en.ts`); (2) tên tệp CSS băm `Base.<hash>.css` đổi (#181 sửa `landing.css` và font KO/ZH). **Thân thông báo không đổi.** Bốn ngôn ngữ còn lại chắc cùng lý do (layout chung), chưa so từng tệp |
| 13:37 | Kiểm staging không đăng nhập (curl) | Xem mục dưới |

**Kiểm sau bước trên (staging, không đăng nhập)**

| Kiểm | Kết quả |
|---|---|
| `GET desk.staging…/v1/public/properties/dlt/monthly-rates` | **200** `application/json`. Khóa đúng allowlist: `computedAt, currency, estimate, roomTypes, taxIncluded`; mỗi hạng đúng `label, monthlyFromVnd, roomType`, `monthlyFromVnd > 0` (`jq -e` = true). **4 hạng**: `standard-studio-city-view`, `standard-studio-garden-view`, `premium-one-bedroom-1`, `signature-two-bedrooms`. `grep roomId/monthlyTo/count/ota/commission/occupan` = 0. Vậy `public_show_prices` đang bật và cả 4 hạng có giá tháng + `public_room_type` trên Desk staging |
| `price-estimate?…&stayType=long&months=6` (desk.staging) | `priceAvailable: true`, có `longStay` (`monthlyFromVnd, months, totalVnd`) |
| `?x=1` và POST qua **desk.staging** | `?x=1` → 422 (api), POST → 404. Ca "?x=1 → 404" chỉ áp cho **Caddy landing**, chưa kiểm được (dưới) |
| Qua landing `staging.ottimo.vn` | `/` → 401 (basic auth, đúng thiết kế). `monthly-rates` không mật khẩu → 401. Container landing **vẫn dùng Caddyfile cũ** (0 dòng `monthly-rates` trong container, `Up 2 days (healthy)`). Caddyfile là tệp gắn vào container, chỉ có hiệu lực khi container được tạo lại, mà bước này chưa chạy |
| `ops-check containers` (staging) | ok: postgres, api, worker, web, landing running, api healthy |

**Staging đã sẵn sàng cho QA chưa:** **một phần.**
- Sẵn sàng: Desk v1.0.5 (`sha-32c9bd2def9a`) cho bảng kiểm v1.0.5 (T1–T25). Phần api của FB-INV-010 (`monthly-rates`, `price-estimate` dài hạn) qua desk.staging. Dữ liệu giá đủ, QA không cần nhập thêm.
- Chưa sẵn sàng: landing mới trên staging (giá "From X / month", FAQ, form dài hạn, 360 px). Các ca Caddy landing (`?x=1` → 404, POST → 404 qua `staging.ottimo.vn`) cũng chưa, vì landing chưa đổi và container chưa nạp Caddyfile mới.

**Rủi ro / vướng mắc (cho ORC, SEC)**
- **Chặn cả production, không chỉ staging.** `deploy-landing.sh` production so cùng băm với nhãn `2026-11-04` đã đăng, nên PR #182 mục 2 bước 3 trên production cũng sẽ FAIL. Image hiện tại không lên được nếu giữ nhãn `2026-11-04`. Bất kỳ đổi chữ site hay CSS nào cũng làm đổi băm trang privacy, vì trang dùng layout chung. Hướng xử lý cần SEC (+ FE, ARC) chọn:
  - (a) Đổi nhãn thông báo (ví dụ `2026-11-16`), thân thông báo giữ nguyên. FE đổi `VERSION` của trang privacy + form, build lại. SEC ghi dòng duyệt trong decision-log. Rồi chạy `publish-privacy-notice.sh` trên staging (bằng root) và trên production. Theo luật README 12.3 (`CONST_ROWS ≥ 1`), không đổi hằng api.
  - (b) Sửa build để trang privacy không kéo khối JSON-LD và CSS băm của layout chung. Trang chỉ đổi byte khi thân thông báo đổi. Đây là việc FE + ARC, SEC duyệt, cũng phải build lại.
  - Không có cờ nào để bỏ qua bước `privacy`, và OPS không đề xuất thêm cờ đó.
- Gói staging mới đã vào, nhưng chưa làm các bước còn lại của Đợt A (W1 timer 2 lượt, W4, W6 journald, W7). Hệ quả, chỉ trên staging:
  - `ops-check` mới chạy theo timer sẽ báo FAIL `journal` và `sshkeys` (W0 chưa làm), và FAIL `backup` sau khoảng 14 giờ, vì timer staging vẫn 1 lượt 03:30. Staging không có webhook báo động và heartbeat, nên các FAIL này chỉ nằm trong journal (`ottimo-alert`) và `systemctl --failed`, không tới phòng Báo động.
  - `backup.sh` mới (giữ theo tuổi, Chủ nhật 33 ngày) chạy lúc 03:30. Bản sao lưu staging cũ nhất là 22/10, chưa tới 33 ngày, nên đêm nay không xóa thêm gì so với luật cũ.
  - Lần deploy app staging kế tiếp (CI) sẽ dựng lại container với compose mới (driver `journald`, Postgres ghim cài đặt log). Desk staging có thể mất 20–60 giây lúc đó.
- Quay lui gói (nếu ORC muốn): chép lại `/root/ottimo-staging-bundles/infra-20261116-133101` vào `/opt/ottimo/infra` (cùng cờ `rsync`). Chưa dựng lại container nào, nên không cần làm gì thêm.

**Việc chưa xong**
- Deploy landing staging `sha-32c9bd2def9a`: chờ SEC chọn (a) hoặc (b) và có image mới, rồi `--check-only` lại (bước `privacy` phải ra 5 ngôn ngữ, không FAIL), rồi mới deploy.
- Một lựa chọn để QA kiểm **route Caddy** ngay hôm nay mà không cần landing mới: dựng lại container landing staging **cùng tag đang chạy** `sha-6414be25f20d` (runbook W2: `--no-deps --force-recreate --pull never`, `staging.ottimo.vn` mất vài giây) để nạp Caddyfile mới. Sau đó `monthly-rates` qua landing (có mật khẩu xem trước) → 200, `?x=1`/POST → 404. Đây là bước ngoài câu giao việc, nên OPS **chưa chạy**. ORC xác nhận nó có nằm trong ESC-052 A ("cập nhật cấu hình landing") hay không.
- Không commit, không push (theo giao việc).

## 14. Việc phụ ngoài round 16/11 – trang tĩnh phụ trên cùng VPS (yêu cầu INV, PR `ops-static-site-edge`)

Ghi riêng, không thuộc kế hoạch round 5. INV muốn chạy thêm trang tĩnh (~1,3 MB, một tên miền + `www`) của một doanh nghiệp khác của INV trên VPS OTTIMO, không ảnh hưởng ottimo.vn / Desk / staging. Tên miền, IP VPS, e-mail ACME **không ghi vào repo** (chỉ trong `/opt/ottimo-static/.env` trên máy chủ); repo dùng `example.test` / `*.localhost`. Không SSH (một OPS khác đang phát hành v1.0.5).

**Đã làm gì**
- Gói bàn giao của chủ trang giả định Caddy cài thẳng trên host (dán vào `/etc/caddy/Caddyfile`) – sai với VPS của ta (edge nginx giữ 80/443, route SNI tới Caddy của từng stack). Thay bằng stack riêng `ottimo-static` (`infra/static/`: `Dockerfile.static`, `docker-compose.static.yml`, `Caddyfile.static`, `env.example`) + overlay edge `infra/edge/docker-compose.edge-static.yml` + `infra/server/bin/static-site.sh`.
- `edge.sh`: đọc `STATIC_HOST` / `STATIC_WWW_HOST` từ `/opt/ottimo-static/.env`, thêm 4 dòng `static-site` **sau** các dòng OTTIMO; tạo mạng `ottimo-link-static` và dùng overlay chỉ khi có trang. Lệnh mới `edge.sh plan` (render ra `nginx.conf.plan`, in diff, không đổi tệp đang dùng).
- Chứng minh "OTTIMO không đổi": commit đầu của PR sinh `infra/ci/fixtures/edge-nginx.ottimo-only.conf` bằng **edge.sh cũ**; test so render mới (không có trang tĩnh / `.env` để trống) với tệp này từng byte; khi có trang: bỏ 4 dòng `static-site` thì còn lại giống từng byte.
- `test-edge.sh` thêm 9 ca render + 11 ca end-to-end (compose + image thật): CSP riêng của trang, header, cache, 301 www/http một bước, 405, tệp chấm 404, CSP landing OTTIMO không đổi, địa chỉ khách qua PROXY protocol, hardening container; mọi ca OTTIMO cũ chạy cùng lúc với trang tĩnh. Chạy local (OrbStack, `EDGE_TEST_JSON_LOGS=1`): tất cả `ok`.
- Runbook: `infra/server/README.md` mục 14 (bật, thứ tự DNS, kiểm, gỡ).

**Giả định**
- Một trang tĩnh (apex + www) là đủ; trang thứ hai cần thêm mạng/địa chỉ (sửa nhỏ edge.sh).
- Giữ CSP `'unsafe-inline'` + Google Fonts đúng như gói bàn giao (trang inline CSS/JS); HSTS không `includeSubDomains` như gói bàn giao.
- Image Caddy dựng tại chỗ trên máy chủ (không đẩy lên kho image), base pin digest như landing.

**Rủi ro**
- `edge.sh up` dựng lại edge: mọi site gián đoạn ≈ 1–2 s (như mọi lần đổi tên miền). Làm sau khi phát hành v1.0.5 xong.
- Đổi DNS là việc của INV tại nhà đăng ký; phải giữ MX/TXT (thư điện tử của tên miền đó).
- Chi phí: 0 (cùng VPS, ~96 MB RAM tối đa, chứng chỉ miễn phí) – không cần ESC.

**Phản hồi SEC (review `SEC-on-ops-pr-184.md`, DUYỆT) – đã sửa trên cùng PR:** 166 (`static-site.sh` từ chối web root có symlink; README dùng `rsync -rt --no-links`), 167 (kiểm riêng từng biến, `STATIC_WWW_HOST = www.<STATIC_HOST>`, mảng, không tách chữ/glob), 168 (chặn tên là hoặc nằm dưới `ottimo.vn` và apex của stack đang nạp), 169 (`.env` 0640 root:ottimo ở README + env.example), 170 (test giả PROXY header trên mạng static; `static-site.sh` kiểm dạng tên, `grep -xF`). Thêm 10 ca test. Dòng decision-log bỏ khỏi PR (ORC ghi trên main).
