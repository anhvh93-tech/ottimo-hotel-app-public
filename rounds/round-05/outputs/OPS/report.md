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

## 14. Cập nhật 16/11 14:35 – Phát hành production v1.0.5 + FB-INV-010 Đợt 1 (a9f510f7): DỪNG trước bước 1, không vào được máy chủ

Căn cứ: giao việc ORC 16/11 (INV OK production, bỏ V5-61/T23/T24 – decision-log 16/11); thân PR #182 (mục 2–4); `rounds/round-05/reviews/SEC-privacy-label-20261116.md` (O1–O9); README 12.3; runbook v1.0.5.

**Kết luận: chưa đổi gì trên staging hay production.** SSH vào `ottimo-admin@desk.ottimo.vn` bị từ chối: máy chủ nhận khóa `~/.ssh/ottimo_ops` (`Server accepts key`), nhưng ssh-agent trên Mac **không còn khóa nào** (`ssh-add -l` rc=1). Khóa có passphrase, `BatchMode=yes` không hỏi được. Lúc 13:30 (mục 13) agent còn khóa; nay đã mất. OPS không tự nạp passphrase (bí mật của người dùng).

**Đã kiểm (chỉ đọc, trên Mac)**

| Kiểm | Kết quả |
|---|---|
| CI push `a9f510f7611f` lượt 43820936429 | success; `publish images (GHCR)` success; `deploy staging` success |
| Digest (artifact `image-digests` của lượt đó – cùng nguồn `release.yml` dùng) | `tag=sha-a9f510f7611f`; landing `sha256:54acf42ba8858414ec8e8725ff3ba88617ea177b181d609c4aebf9a0ca079f74` (khớp tiền tố ORC đưa `54acf42ba885`); api `sha256:9204c255c678…`; web `sha256:52156b2e632b…` |
| O1: `VERSION` trong `privacy.ts` ở a9f510f7 | `'2026-11-16'` (không phải image `sha-32c9bd2def9a`) |
| F2: `CHAT_DETAILS_MIN_NOTICE_VERSION` ở a9f510f7 | `'2026-11-04'` (không đổi, đúng SEC) |
| Tag `landing-v2.1.0`, `v1.0.5` | chưa tạo, chưa push |

**Chưa làm (theo thứ tự, làm tiếp ngay khi vào được máy):** staging O2 → O3 `--check-only` → deploy landing staging → O5 publish `2026-11-16` (root, thử rồi `--apply`) → kiểm staging; production: sao lưu → làm mới gói `infra/` (giữ bản cũ) → O4 → tag `landing-v2.1.0` + Release (dừng ở duyệt environment) → O5–O7 production → tag `v1.0.5` + Release → kiểm PR #182 mục 3 + `ops-check`.

**Cần để đi tiếp:** INV nạp khóa vào agent trên Mac này (INV tự gõ passphrase, không qua chat): `ssh-add --apple-use-keychain ~/.ssh/ottimo_ops`. Sau đó ORC giao lại cho OPS cùng câu giao việc.

Không commit (theo giao việc).

### 14.1 Tiếp tục 16/11 sau khi INV nạp khóa (giờ VN)

| Giờ | Bước | Kết quả |
|---|---|---|
| 15:00 | Đọc hiện trạng | Staging: app `sha-a9f510f7611f` (CI), landing `sha-6414be25f20d`. Production: app + landing `sha-6414be25f20d`, `landing_previous_tag` = `sha-72f9ac8e2b33` |
| 15:00 | **O2** (image, `--network none`, chỉ đọc): `<main>` trang privacy image mới (đổi `2026-11-16` → `2026-11-04`) so với `sha-6414be25f20d` | **Bằng nhau cả 5**: en `d2fb0554ce25`=`d2fb0554ce25`; vi `f24f18fd6d0b`=`f24f18fd6d0b`; ko `91f21ba23de6`=`91f21ba23de6`; zh `c7fe6fb2b5a4`=`c7fe6fb2b5a4`; ru `cc9766812154`=`cc9766812154` (mỗi trang đúng 1 `<main`) |
| 15:00 | **O3** staging `deploy-landing.sh sha-a9f510f7611f --digest sha256:54acf42b…079f74 --check-only` | 5 × `2026-11-16 (not published yet)`, `CHECK ONLY … passes`, RC 0 |
| 15:00 | **O4** (`SQLRO`, chỉ cột `version`) | `on`, `ottimo_readonly`. Staging `CONST_ROWS=5`, `2026-11-16`=0. Production `CONST_ROWS=5`, `2026-11-16`=0 |
| 15:01 | Gói staging so gói từ a9f510f7 | `git diff 32c9bd2d a9f510f7 -- product/infra` rỗng; gói trên máy giống hệt (`diff -rq`): không cần làm mới gói staging |
| 15:01 | Deploy landing staging | `OK: landing sha-a9f510f7611f is live on staging.ottimo.vn`; `landing_tag` = `sha-a9f510f7611f` |
| 15:01 | **O5** staging (root, `OTTIMO_HOME=/opt/ottimo`, `--operator ops`) chạy thử | ảnh `54acf42ba885` ok; trang live 200 cùng sha256; 5 × `dry-run (would): supersede version 2026-11-04` (en vi ko zh ru); `DRY RUN OK` |
| 15:01 | O5 staging `--apply` | 5 × `apply: supersede version 2026-11-04 (<xx>)`; `OK: version 2026-11-16 published (en vi ko zh ru)`; log vẫn `ottimo:ottimo 600`. Khoảng trống O7 ≈ 40 giây |
| 15:02 | Kiểm staging qua `staging.ottimo.vn` (root, `--resolve` edge, mật khẩu xem trước đọc từ tệp, không in) | `monthly-rates` có mật khẩu **200** `application/json`, `Cache-Control: no-store`, allowlist đúng (4 hạng, `taxIncluded` true, `monthlyFromVnd` 8,5–13,5 triệu), từ cấm = 0; `?x=1` **404**; POST **404**; không mật khẩu 401. `price-estimate` long: `priceAvailable` true, `longStay` = `monthlyFromVnd, months, totalVnd`. `form-token` 200. Trang privacy `/` và `/vi/` có meta `2026-11-16`. "Taxes included" có trong HTML |
| 15:02 | "From X / month" trên staging | Chữ do JS dựng sau khi gọi `monthly-rates` (bundle có `From ${e} / month`). Trên staging trình duyệt thường **không thấy**: landing gọi `fetch` với `credentials: 'omit'`, Caddy staging trả 401 (BUG-R4-054, đã biết). HTML tĩnh hiện "on request" là bản dự phòng. Kiểm bằng mắt ở production (không basic auth) hoặc QA dùng Playwright `extraHTTPHeaders` |
| 15:03 | O3 production `--check-only` (gói cũ) | 5 × `2026-11-16 (not published yet)`, passes, RC 0 |
| 15:03 | Gói `infra/` từ a9f510f7 lên máy (chưa áp) | băm Mac = máy `94023541070e`; có `@public_monthly_rates`, `header_up -Authorization`; khác gói production 19 tệp; `02-roles.sh` không đổi |
| 15:03 | Chờ hết khung sao lưu 14:55–15:45 rồi mới sao lưu production | |

**Hiện trạng máy liên quan tới `ops-check` gói mới (đọc lúc 15:00):** W0 chưa làm (`authorized_keys` của `ottimo` còn 1 dòng khóa người, tổng 4) → `sshkeys` sẽ FAIL; timer sao lưu production vẫn 1 lượt 03:00 (W1 chưa làm) → `backup` FAIL sau 14 giờ; chưa có drop-in journald (W6 bước 1) và `journald_since`. Container production đang driver `local`; Release v1.0.5 với gói mới sẽ dựng lại sang `journald` (staging đã `journald` cả 5). Production có `ALERT_WEBHOOK_URL`, nên các FAIL này sẽ báo vào phòng Báo động.
| 15:46 | Sao lưu production (`backup.sh`, ngoài khung 14:55–15:45) | `OK: 70 encrypted files in /var/backups/ottimo-prod` lúc 08:46:08Z (69 migration, trước v1.0.5) |
| 15:46 | Làm mới gói `infra/` production từ a9f510f7 (P2b bước 3–4) | `BAN CU GIU O: /root/ottimo-prod-bundles/infra-20261116-154619`; `PRODUCTION: CAU HINH MOI DA VAO`; `init-secrets: nothing to do`; `CAU HINH: OK`; Caddyfile production có `@public_monthly_rates`. `02-roles.sh` không đổi (bỏ bước 5). Container landing chưa dựng lại (Release landing sẽ dựng lại) |
| 15:46 | O3 production lại, gói mới | 5 × `2026-11-16 (not published yet)`, passes, RC 0 |
| 15:47 | Tag `landing-v2.1.0` (annotated) trên `a9f510f7611f`, push | `* [new tag] landing-v2.1.0` |
| 15:47 | Release run **43834006137** | `resolve` success: `release landing-v2.1.0 → landing sha-a9f510f7611f @sha256:54acf42ba8858414ec8e8725ff3ba88617ea177b181d609c4aebf9a0ca079f74` (trùng artifact CI và digest đã qua staging). `deploy production` = **waiting**, environment `production` (id 25137151508). **OPS DỪNG – chờ ORC duyệt** |

Ghi chú: CI 43824544392 (main, commit tài liệu sau a9f510f7) đang `waiting` (duyệt staging). Không ảnh hưởng Release (Release dùng CI của a9f510f7); nếu duyệt, staging app đổi sang commit đó (cùng mã app), landing staging không đổi.
| 15:48 | Release landing 43834006137 (ORC duyệt) | success; log `landing sha-a9f510f7611f: ok`; production `landing_tag` = `sha-a9f510f7611f`, `landing_previous_tag` = `sha-6414be25f20d` (đường `--rollback` của PR #182 mục 4 đúng) |
| 15:54 | O5 production `publish-privacy-notice.sh` (`sudo -u ottimo`, `--operator ops`) chạy thử | ảnh `54acf42ba885` ok; trang live `https://ottimo.vn` 5 × 200 cùng sha256; **băm 5 trang trùng staging** (en `dc4c4c5c365b`, vi `d99aad15dba4`, ko `52d9e8364eba`, zh `d385e781d611`, ru `18358efde51d`) → O8 đạt; 5 × `dry-run (would): supersede version 2026-11-04` |
| 15:54 | O5 production `--apply` | 5 × `apply: supersede version 2026-11-04 (<xx>)`; `OK: version 2026-11-16 published (en vi ko zh ru)`. Khoảng trống O7 (landing mới → apply) ≈ 6 phút. Ghi chú: `state/privacy-notice.log` production là `ottimo:ottimo 664` (staging 600) – không sửa (O9), báo SEC xem có cần siết |
| 15:55 | Tag `v1.0.5` (annotated) trên `a9f510f7611f`, push | `* [new tag] v1.0.5` |
| 15:55 | Release run **43835200008** | `resolve` success: `release v1.0.5 → sha-a9f510f7611f api@sha256:9204c255c678…0932 web@sha256:52156b2e632b…e119` (trùng artifact CI 43820936429). `deploy production` = **waiting**, environment `production` (id 25137151508). **OPS DỪNG – chờ ORC duyệt** |
| 15:56 | Release v1.0.5 43835200008 (ORC duyệt) | success; CI log `deploy sha-a9f510f7611f: ok`. Máy chủ (journal `ottimo-deploy`) đủ **6 dòng**: deploy (previous `sha-6414be25f20d`) → digests match → config accepted → `02-roles.sh` applied → `migrations: 72 applied / 72` → `OK: sha-a9f510f7611f is live` (+ dòng CI ok). `current_tag` = `sha-a9f510f7611f`, `previous_tag` = `sha-6414be25f20d`. Thứ tự: postgres 08:56:28Z, **worker 08:56:35Z, api 08:56:42Z** (worker sớm hơn 7 giây), web 08:56:47Z; tất cả driver `journald`, api/web healthy, worker `restarts=0` |

### 14.2 Kiểm sau deploy (PR #182 mục 3, từ Mac, không đăng nhập; 16:00)

| Kiểm | Kết quả |
|---|---|
| a) `GET https://ottimo.vn/v1/public/properties/dlt/monthly-rates` | **200** `application/json`, `Cache-Control: no-store`; `jq -e` allowlist = **true**; 4 hạng, `taxIncluded` true: `standard-studio-city-view` 8.500.000, `standard-studio-garden-view` 9.000.000, `premium-one-bedroom-1` 11.500.000, `signature-two-bedrooms` 13.500.000 (production **đã có** giá tháng); từ cấm = **0** |
| b) `?x=1` / POST | **404** / **404** |
| c) `price-estimate?roomType=standard-studio-city-view&stayType=long&arrival=2026-12-15&months=6&adults=2` | `priceAvailable` true, `longStay` = `{months 6, monthlyFromVnd 8.500.000, totalVnd 51.000.000}` |
| d) `form-token` | **200** |
| `/` (trình duyệt, sau JS) | 4 thẻ "From 8,500,000 / 9,000,000 / 11,500,000 / 13,500,000 VND / month", 4 × "Taxes included"; khớp (a); `data-consent-version` = `2026-11-16`; console **không lỗi** |
| `/vi/` | 4 thẻ "Từ … VND/tháng" cùng số, có dòng "đã gồm thuế"; `data-consent-version` = `2026-11-16` |
| Desk `https://desk.ottimo.vn/` | 200 |
| Log Caddy landing (chỉ đếm) | 5 dòng `monthly-rates`; query luôn che `?[q]` (1 dòng = ca `?x=1` của OPS); 10 trường IP, 0 IP chưa che /24 |
| `ops-check` đủ (lệnh W7, `systemd-run` + nhóm `systemd-journal`) | Mọi dòng `ok` (containers, j16, backup 0 h, disk 16%, mem, tls, http5xx 0, email_*, pricelimit, pricegap, priceswitch, email_config, db_triggers) **trừ**: `FAIL sshkeys: 1 of 4 key line(s) … not a known forced command` (W0 chưa làm – ghi, không sửa theo ORC); `WARN journal: state/journald_since missing` (W6 bước 1–2 chưa làm; WARN, không FAIL). `EXIT: 1` vì `sshkeys` |

Không tạo booking/form thử. Không SQL ghi. Không in IP/bí mật.

**Đang chạy production:** app **v1.0.5** = `sha-a9f510f7611f` (api `sha256:9204c255c678…0932`, web `sha256:52156b2e632b…e119`, DB 72 migration); landing **landing-v2.1.0** = `sha-a9f510f7611f` (`sha256:54acf42ba885…079f74`); thông báo privacy **2026-11-16** (5 ngôn ngữ). Staging: app + landing `sha-a9f510f7611f`, privacy `2026-11-16`.

**Quay lui (nếu cần, PR #182 mục 4):** landing `deploy-landing.sh --rollback` → `sha-6414be25f20d` (nhãn `2026-11-04` còn được nhận 7 ngày tính từ 08:54:58Z 16/11, có WARNING "older"); app `rollback.sh sha-6414be25f20d`; gói cũ ở `/root/ottimo-prod-bundles/infra-20261116-154619`.

**Việc còn lại**
- W0 (gỡ khóa người khỏi `ottimo`, cần INV đồng ý): tới khi làm, `ops-check` timer production FAIL `sshkeys` mỗi lượt và báo vào phòng Báo động.
- W1 (timer sao lưu 2 lượt): chưa làm. Đêm nay không FAIL (sao lưu tay 15:46, lượt timer 03:00 cách ~11 giờ). Từ ~17:00 ngày mai (14 giờ sau lượt 03:00) `ops-check backup` FAIL tới lượt 03:00 kế tiếp, lặp lại mỗi chiều.
- W6 bước 1–2 (drop-in journald + `journald_since`): `journal` chỉ WARN.
- SEC xem quyền `state/privacy-notice.log` production `ottimo:ottimo 664` (staging 600).
- QA ký landing staging bằng Playwright có header (BUG-R4-054) nếu cần bằng chứng hiển thị trên staging.
- ORC ghi decision-log (tag, run 43834006137 / 43835200008, `sha-a9f510f7611f`, giờ, kết quả a–d) và commit.

## 15. Việc phụ ngoài round 16/11 – trang tĩnh phụ trên cùng VPS (yêu cầu INV, PR `ops-static-site-edge`)

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

### 15.1 Triển khai trên máy chủ 16/11 ~16:43–16:47 (giờ VN) – README 14.1 bước 0–4, DỪNG trước DNS
INV yêu cầu triển khai trong chat 16/11. ORC giao việc sau khi phát hành v1.0.5 xong. Bundle `product/infra` lấy từ main `42833f7f` (squash của #184, `infra` giống `8d6a568a`). Tên miền, IP, e-mail không ghi ở đây: xem `/opt/ottimo-static/.env` trên máy chủ.
1. **Bundle edge**: chỉ rsync vào `/opt/ottimo-edge/infra/`, không đụng `/opt/ottimo` và `/opt/ottimo-prod`, không chạy bootstrap. Bản cũ để quay lui: `/opt/ottimo-edge/infra.before-static-20261116T094339Z` và `/opt/ottimo-edge/nginx.conf.before-static-20261116T094339Z`.
2. **`edge.sh plan` trên cấu hình cũ**: `10 host(s) for 2 stack(s)`, `plan: no change`. edge.sh mới cho ra đúng từng byte tệp đang chạy.
3. **`/opt/ottimo-static`**: thư mục 0755 root, `.env` 0640 root:ottimo (3 khóa `STATIC_*` + `ACME_EMAIL`). Web root có 20 tệp (≈ 1,3 MB), 0 symlink, mọi thư mục 0755 và tệp 0644. sha256 của `index.html` khớp bản gửi đến.
4. **`edge.sh plan`**: đúng 4 dòng `+ … static-site`, không có dòng `-`. **`edge.sh up`**: edge healthy, thêm mạng `ottimo-link-static` (172.31.3.0/24, edge .2). OTTIMO được kiểm ngay sau đó trên 10 tên × http/https: mã trả về và mọi header ổn định (bỏ Date/ETag/…) **giống hệt** ảnh chụp trước khi đổi. CSP landing vẫn `script-src 'self'`. Không phải quay lui.
5. **`static-site.sh up`**: container healthy, uid 10001, read-only, cap_drop ALL, không cổng, 96 MB, journald, 172.31.3.10. Kiểm bằng `--resolve` về VPS: http apex → `301 https://<apex>/x?a=1`; http www → `301 https://<apex>/x`; tên lạ :80 → 404; tên lạ :443 → đóng kết nối. HTTPS của trang **chưa có chứng chỉ**, đúng dự kiến vì DNS còn trỏ Google: log có `challenge failed`, Caddy tự thử lại. Kiểm lại OTTIMO sau bước này: header vẫn giống hệt.
- Ghi chú: `ops-check.sh` (staging) báo `FAIL sshkeys` (1/4 dòng khóa của user deploy không phải forced command). Lỗi này có từ trước, không liên quan việc này, chưa sửa: báo ORC.
- **Còn lại**: INV đổi DNS tại nhà đăng ký, chỉ `@` và `www` (A về VPS, xóa CNAME `www` về Google), giữ MX/TXT. Khi `dig` cả hai tên ra IP VPS: `sudo /opt/ottimo-edge/infra/server/bin/static-site.sh restart`, rồi chạy nghiệm thu 14.3 + danh sách của chủ trang.

## 16. Cập nhật 16/11 tối (17:21–17:30) – Vận hành sau v1.0.5: W1 xong cả hai stack; W6 bước 1–2 DỪNG ở chốt chặn

Căn cứ: giao việc ORC 16/11 (INV đồng ý trong chat "Làm tối nay" cho **W1** và **W6 bước 1–2**; **W0 không làm**); runbook v1.0.5 mục W1, W6, W7; mục 14 ở trên (gói production đã là a9f510f7, bản cũ `/root/ottimo-prod-bundles/infra-20261116-154619`). Không dựng lại container nào, không đụng edge hay `/opt/ottimo-static`, không SQL ghi, không in IP/bí mật.

### 16.1 Đọc hiện trạng (17:21, chỉ đọc)
- Timer sao lưu đã cài trong `/etc/systemd/system/` vẫn là bản 24/10 (1 lượt/ngày: production 03:00, staging 03:30). Gói của **cả hai stack** (`/opt/ottimo`, `/opt/ottimo-prod`) đã có bản 2 lượt; khác bản đã cài chỉ ở chú thích, `Description` và một dòng `OnCalendar` thêm (đã `diff`). Staging cũng chưa W1, nên làm luôn (runbook: W1 từng stack, staging thuộc Đợt A, rủi ro thấp).
- Chưa có `/etc/systemd/journald.conf.d/`; `state/journald_since` chưa có ở cả hai stack. `/var/log/journal` = `root:systemd-journal 2755`; journal 461,6 MB.
- **Phát hiện thêm:** unit `ottimo-ops-check@.service` và `ottimo-ops-check.service` đã cài vẫn là bản cũ (chưa có `SupplementaryGroups=systemd-journal`, W6 bước 3 chưa làm). Vì gói mới đã vào lúc 15:46, mọi lượt `ops-check` **theo timer** của cả hai stack từ đó báo `FAIL journal: journal unreadable (the ops-check unit needs SupplementaryGroups=systemd-journal)` cùng `FAIL sshkeys`, vào phòng Báo động. Lệnh tay W7 (qua `systemd-run` có nhóm) không thấy lỗi này.

### 16.2 W1 – timer sao lưu 2 lượt/ngày: ĐẠT (production + staging)

| Giờ | Stack | Kết quả |
|---|---|---|
| 17:22:01 | Production `ottimo-backup@ottimo-prod.timer` | `ONCALENDAR: 2`; lịch `03:00:00` + `15:00:00`; `TIMER SAO LUU TREN MAY: 2`. Lượt bù (Persistent, đã qua 15:00) chạy ngay: `OK: 75 encrypted files in /var/backups/ottimo-prod` lúc 17:22:05. NEXT 03:02 ngày 17/11 |
| 17:22:21 | Staging `ottimo-backup.timer` | `ONCALENDAR: 2`; lịch `03:30:00` + `15:30:00`; `TIMER SAO LUU TREN MAY: 2`. Lượt bù: `OK: 77 encrypted files in /var/backups/ottimo` lúc 17:22:25 (chạy sau khi lượt production đã `OK`, không chồng). NEXT 03:32 ngày 17/11 |

Từ nay `ops-check backup` không còn FAIL chiều 17/11 (lượt 15:00 nằm trong ngưỡng 14 giờ). Lùi W1 nếu cần: tệp timer cũ ở `/root/ottimo-prod-bundles/infra-20261116-154619/server/systemd/`.

### 16.3 W6 bước 1–2 – DỪNG trước khi cài (lệch runbook, chưa đổi gì)
Ubuntu (systemd 255.4-1ubuntu8.18) có sẵn drop-in của gói `systemd`: `/usr/lib/systemd/journald.conf.d/syslog.conf` với `ForwardToSyslog=yes`. systemd đọc drop-in của mọi thư mục theo **thứ tự tên tệp**; `50-ottimo.conf` xếp trước `syslog.conf` (`5` < `s`), nên `syslog.conf` đọc sau và **thắng**. Cài `50-ottimo.conf` như runbook thì chốt "bốn dòng `HIEU LUC`" sẽ ra `ForwardToSyslog=yes` → runbook bắt **dừng, báo OPS + SEC** (SEC 95-05 (d)). OPS biết trước nên không cài, không khởi động lại journald, và không ghi `journald_since` (bước 2 là mốc của lúc bước 1 có hiệu lực; ghi khi bước 1 chưa làm là sai mốc).

Hệ quả hiện nay: container cả hai stack đã ghi ra journald (từ deploy v1.0.5) trong khi `ForwardToSyslog=yes` là mặc định, tức log container đang có thêm bản trong `/var/log/syslog` (logrotate của Ubuntu). Đây là đúng việc V5-63/SEC ARC-07 muốn bỏ. Trạng thái này đã có từ trước tối nay, OPS không làm nó tệ thêm.

Đề xuất sửa (OPS, cần SEC review, PR nhỏ, chưa làm):
- (a, đề xuất) Đổi tên drop-in thành tên xếp sau mọi tệp của nhà phân phối, ví dụ `server/journald/zz-ottimo.conf`, sửa `bootstrap-vps.sh`, test `ops-check-journal.test.sh`, README, runbook W6 bước 1. Giữ cả giá trị khác.
- (b) Hoặc thêm `/etc/systemd/journald.conf.d/syslog.conf` (cùng tên ở `/etc` che bản `/usr/lib`) chỉ có `ForwardToSyslog=no`.
- Thêm vào `ops-check journal` một chốt đọc `systemd-analyze cat-config` để `ForwardToSyslog` có hiệu lực khác `no` là WARN/FAIL (hiện mục này không kiểm, nên máy mới dựng bằng `bootstrap-vps.sh` cũng mắc cùng lỗi mà không ai thấy).
Sau khi gộp và làm mới gói hai stack: chạy lại W6 bước 1–2 theo runbook (cần ORC xác nhận đồng ý 16/11 của INV còn dùng được cho bản sửa).

### 16.4 `ops-check` đủ (lệnh W7, `systemd-run` + nhóm `systemd-journal`), 17:2x

| Mục | Production `/opt/ottimo-prod` | Staging `/opt/ottimo` |
|---|---|---|
| containers | ok (5 chạy, api healthy) | ok |
| j16 | ok | ok |
| backup | ok, 0 h | ok, 0 h |
| disk / mem / tls | ok 16% / 77% / > 14 ngày | ok 16% / 76% / > 14 ngày |
| http5xx | ok 0 | ok 0 |
| email_dead / email_missing / email_changes / email_ascii | ok / ok 0 / ok / ok | ok / ok (1, chỉ báo) / ok / ok |
| pricelimit / pricegap / priceswitch | ok / ok (0 căn thiếu giá) / ok | ok / ok / ok |
| email_config | ok (relay) | ok (mock) |
| db_triggers | ok | ok |
| **sshkeys** | **FAIL** 1/4 dòng khóa không phải lệnh ép (W0 chưa làm, đúng dự kiến) | **FAIL** như production (cùng user `ottimo`) |
| **journal** | **WARN** `state/journald_since missing` (W6 bước 1–2 chưa làm) | **WARN** như production |
| EXIT | 1 (vì `sshkeys`) | 1 (vì `sshkeys`) |

Kết luận: lệnh tay đúng mong đợi (chỉ `FAIL sshkeys`). **Lượt theo timer** thì còn thêm `FAIL journal: journal unreadable` cho tới khi làm W6 bước 3.

### 16.5 Việc còn lại
1. **W0** (gỡ khóa người khỏi `authorized_keys` của `ottimo`): chờ INV đồng ý (Đợt B). Tới khi làm, `sshkeys` FAIL ở mọi lượt của cả hai stack.
2. ~~**W6 bước 3**~~ (xong 17:29, xem 16.6) (cài unit `ottimo-ops-check@.service` + `ottimo-ops-check.service` có `SupplementaryGroups=systemd-journal`, `daemon-reload`; không dựng lại container, không gián đoạn): ngoài phạm vi INV đồng ý tối nay nên OPS không làm. Không làm thì timer `ops-check` hai stack FAIL `journal unreadable` mỗi 30 phút. ORC xin INV đồng ý (đề xuất: làm sớm, rủi ro thấp, lùi bằng tệp unit cũ trong bundle `/root/...`).
3. **W6 bước 1–2**: chờ sửa tên drop-in (16.3), SEC review, làm mới gói, rồi chạy lại.
4. Ghi decision-log (ORC): giờ W1 hai stack, hai lượt sao lưu bù 17:22 `OK`, chốt chặn W6 bước 1 và lý do.
5. Lượt 15:00 / 15:30 đầu tiên (17/11): xem `state/backup.last_ok` mới và journal `ottimo-backup` có `OK:`; ghi decision-log.

### 16.6 W6 bước 3 – unit ops-check mới: ĐẠT (production + staging)
Lần thử đầu bị hệ thống quyền của Claude Code trên Mac từ chối, máy chủ không đổi. INV trả lời trong chat 16/11 "Đồng ý cài", ORC giao lại; lần chạy thứ hai được phép.

| Giờ | Việc | Kết quả |
|---|---|---|
| 17:29:03 | Chép 2 unit đang cài sang `/root/ottimo-units.before-w6s3-20261116-172903/` (0700) | Có `ottimo-ops-check@.service`, `ottimo-ops-check.service` |
| 17:29:03 | Cài `ottimo-ops-check@.service` từ `/opt/ottimo-prod/infra/server/systemd/`, `ottimo-ops-check.service` từ `/opt/ottimo/infra/server/systemd/`, `daemon-reload` | `NHOM PROD: systemd-journal`, `NHOM STAGING: systemd-journal`. Không dựng lại container, timer không đổi |
| 17:29:11 | `systemctl start ottimo-ops-check@ottimo-prod.service` (lượt như timer) | 16 dòng `ok`; `FAIL sshkeys` (W0); `WARN journal: state/journald_since missing`. **Hết `journal unreadable`.** `Result=exit-code` chỉ vì `sshkeys` |
| 17:29:45 | `systemctl start ottimo-ops-check.service` | Như production |

Lùi bước 3: `install -m 0644` hai tệp từ `/root/ottimo-units.before-w6s3-20261116-172903/` vào `/etc/systemd/system/`, `daemon-reload` (khi đó `journal` FAIL "unreadable" trở lại). Xóa thư mục bản cũ ở Đợt D, cùng lúc với bản cũ `authorized_keys`.

Mục 16.5 việc 2 coi như xong. Từ nay lượt theo timer của hai stack chỉ còn `FAIL sshkeys` (W0) và `WARN journal` (W6 bước 1–2).

Không commit (theo giao việc).

## 17. Cập nhật 17/11 15:00–15:10 – FB-INV-011 phát hành: kiểm staging, sao lưu, tag `landing-v2.2.0` + `v1.0.6` (DỪNG ở duyệt production)

Căn cứ: giao việc ORC 17/11 (INV "Đồng ý cả hai": kiểm staging rồi phát hành production landing + Desk); hợp đồng `rounds/round-05/fb-inv-011/contract.md`; cách làm như mục 13–16. Main `f8791cf8` (FE #188 + BE #187), CI push **44032910978** xanh (deploy staging success; `deploy landing preview (staging)` skipped). Không SQL ghi, không in `.env`/bí mật/IP, không tạo booking/form thử.

### 17.1 Kiểm staging (giờ VN)

| Giờ | Kiểm | Kết quả |
|---|---|---|
| 15:03 | Hiện trạng | Staging: app `sha-f8791cf83b63` (CI), migration **73/73**, api healthy, worker chạy; landing vẫn `sha-a9f510f7611f`. Production: app + landing `sha-a9f510f7611f` |
| 15:03 | `FX_RATES_FETCH` | **Không có dòng nào** trong `.env` của cả hai stack. Compose (`x-api-env`, worker) cũng **không chuyển** biến này vào container, nên trong container nó luôn trống → theo `fxFetchModeFrom` trống + `APP_ENV` staging/production = **bật (`vietcombank`)** ở cả hai stack. OPS **không thêm** vào `.env`: thêm cũng không có tác dụng vì compose không đọc. Xem 17.4 (a) |
| 15:03 | Worker staging chạy `fx.refresh` | Log worker: `fx.refresh` có trong danh sách job; `fx rates stored`, `asOf` `2026-11-17`; các lượt sau `job done` (tự gác, không gọi lại) |
| 15:04 | `GET https://staging.ottimo.vn/v1/public/properties/dlt/monthly-rates` (root, `--resolve` về edge, mật khẩu xem trước đọc từ tệp, không in) | **200** `application/json`; khóa: `computedAt, currency, estimate, fx, roomTypes, taxIncluded`. `fx` = `base VND`, `source vietcombank`, `asOf 2026-11-17`, `rates` đúng 4 mã: USD 25930, KRW 20.04, CNY 3923.82, RUB 328.41 (tỷ giá công khai, không phải bí mật); `jq -e` hình dạng hợp đồng = true. Không mật khẩu: 401 |
| 15:07 | `deploy-landing.sh sha-f8791cf83b63 --digest sha256:c3e67706…6ccba --check-only` (staging, root) | 5 × `2026-11-16 (same bytes as published)`; `CHECK ONLY … passes`; RC 0. **Byte trang privacy không đổi** |
| 15:07 | Deploy landing staging `sha-f8791cf83b63` | **Không làm được**: lệnh bị hệ thống quyền của Claude Code trên Mac từ chối (máy chủ không đổi; landing staging vẫn `sha-a9f510f7611f`). Vì vậy **chưa xem được** `/ko/ /en/ /zh/ /ru/` hiện "≈ …" trên staging thật |
| 15:08 | Thay thế (chỉ đọc): đọc image landing `c3e67706f683…6ccba` trong container `--network none --read-only` | Bundle `BookingForm…js` có bảng ngôn ngữ → tiền: `en USD`, `vi null` (chỉ VND), `ko KRW`, `zh CNY`, `ru RUB`; bước làm tròn `USD 1, KRW 1000, CNY 1, RUB 100` (đúng hợp đồng); khoảng hợp lý `USD 10000–65000, KRW 7–50, CNY 1400–9000, RUB 100–800`. Tỷ giá staging hôm nay nằm trong cả 4 khoảng (nên FE sẽ hiện "≈"). Chuỗi "Payment in VND" có trong gói en. CI 44032910978 job Playwright landing (có `fx.landing.spec.ts`) đạt |
| 15:08 | `deploy-landing.sh … --check-only` production (`sudo -u ottimo`) | 5 × `2026-11-16 (same bytes as published)`; passes; RC 0 |

Ghi chú: `/en/` trên production trả 301 về `/` (en ở gốc), nên khi kiểm bằng mắt dùng `/` cho tiếng Anh.

### 17.2 Sao lưu production

| Giờ | Việc | Kết quả |
|---|---|---|
| 15:01 | Lượt timer 15:00 (W1) | `backup.last_ok` 08:01:24Z |
| 15:08 | `systemctl start ottimo-backup@ottimo-prod.service` (ngay trước tag) | `OK: 90 encrypted files in /var/backups/ottimo-prod`; `backup.last_ok` = **2026-11-17T08:08:04Z** (DB production trước 0098) |

Gói `infra/` production **không cần làm mới**: `git diff a9f510f7 f8791cf8 -- product/infra` chỉ đổi edge/trang tĩnh (đã triển khai riêng ở mục 15.1), không đổi `deploy.sh`, `deploy-landing.sh`, Caddyfile, compose hay `02-roles.sh`.

### 17.3 Tag và Release (DỪNG chờ ORC duyệt)

Digest (artifact `image-digests` của CI 44032910978): `tag=sha-f8791cf83b63`; api `sha256:ed0e50ab…dae1d`; web `sha256:281fc3f6…c5c46d`; landing `sha256:c3e67706…6ccba`.

| Giờ | Việc | Kết quả |
|---|---|---|
| 15:08 | Tag `landing-v2.2.0` (annotated) trên `f8791cf83b63`, push | `* [new tag] landing-v2.2.0` |
| 15:08 | Release run **44044232280** | `resolve` success: `release landing-v2.2.0 → landing sha-f8791cf83b63 @sha256:c3e67706…6ccba` (trùng artifact CI). `deploy production` = **waiting**, environment `production` (id 25137151508). **Chờ ORC duyệt** |
| 15:08 | Tag `v1.0.6` (annotated) trên `f8791cf83b63`, push | `* [new tag] v1.0.6` |
| 15:09 | Release run **44044253851** | **pending** (xếp hàng sau 44044232280 vì `concurrency: release-production`). Sau khi duyệt và chạy xong landing, run này vào `resolve` rồi dừng ở `deploy production` – lúc đó ORC duyệt tiếp. Không tag/đẩy thêm Release nào khác trong lúc chờ (run thứ ba cùng nhóm sẽ thay run đang pending) |

Thứ tự này an toàn: landing mới chạy trước app thì `monthly-rates` production chưa có `fx`, landing chỉ hiện VND (đúng hợp đồng "thiếu `fx` → chỉ VND"). Sau khi v1.0.6 lên, worker production gọi Vietcombank ở lượt tick đầu (chưa có bảng hôm nay), từ đó landing hiện "≈".

### 17.4 Việc còn lại / rủi ro
- (a) **Không có công tắc tắt nhanh** `FX_RATES_FETCH` trên máy chủ: compose không chuyển biến này. Muốn tắt (`off`) phải sửa compose. Đề xuất PR OPS nhỏ: thêm `FX_RATES_FETCH: ${FX_RATES_FETCH:-}` vào `x-api-env` (api luôn ép `off`, chỉ worker đọc) + 1 dòng runbook. Hiện tại không chặn phát hành vì mặc định trống = bật, đúng ý BE/ARC.
- (b) Landing staging chưa lên `sha-f8791cf83b63` (17.1): ORC/INV cho phép rồi chạy `sudo /opt/ottimo/infra/server/bin/deploy-landing.sh sha-f8791cf83b63 --digest sha256:c3e67706f683dfa79585d9188d86ea947306461c1a4fb829e8a501ac0e86ccba`, hoặc ORC chấp nhận bằng chứng image + CI Playwright và kiểm bằng mắt trên production sau khi v1.0.6 lên.
- (c) `product/docs/release-notes.md` chưa có mục v1.0.6 / landing-v2.2.0 (PO/ORC bổ sung).
- (d) Sau khi duyệt cả hai: kiểm production (từ Mac, không đăng nhập): `journalctl -t ottimo-deploy` có `migrations: 73 applied / 73` và `OK: sha-f8791cf83b63 is live`; log worker `fx rates stored`; `monthly-rates` có `fx` đúng hợp đồng; `/`, `/ko/`, `/zh/`, `/ru/` hiện "≈ …" + dòng VND + "Payment in VND", `/vi/` chỉ VND; Desk 200; `ops-check`.
- (e) Quay lui: landing `deploy-landing.sh --rollback` → `sha-a9f510f7611f`; app `rollback.sh sha-a9f510f7611f` (0098 chỉ thêm 2 khóa `config_parameter_def` `fx_rates.vietcombank`, `fx_rate_overrides`, không đổi schema; bản cũ không đọc 2 khóa này); sao lưu 08:08:04Z.
- (f) ORC ghi decision-log (tag, run, digest, giờ) và commit.

Không commit (nhánh hiện tại của checkout chung là `r5-fb011-be-fx`, ORC commit trên main).

## 18. Cập nhật 18/11 14:50–15:05 – Kiểm thử FB-INV-012: migration 0099 trên staging + đánh giá rủi ro production (ARC `FB-R5-ARC-BE-190-07`)

Căn cứ: giao việc ORC 18/11 (Round 5, bước Kiểm thử). Chỉ đọc: không SQL ghi, không deploy, không khôi phục, không in `.env`/khóa/IP. Mọi truy vấn DB qua khối `SQLRO` (`PGOPTIONS` `default_transaction_read_only=on`, `role=ottimo_readonly`); hai dòng chốt đầu của cả hai phiên là `on` và `ottimo_readonly`. Chỉ in số đếm, không in dòng dữ liệu.

### 18.1 Staging đã lên main `f871ab1e`: migration 0099 ĐẠT

| Giờ (VN) | Nguồn | Kết quả |
|---|---|---|
| 14:46:19 | `journalctl -t ottimo-deploy` | `deploy sha-f871ab1eaa1b (previous: sha-f8791cf83b63, pull=1, rollback=0)` |
| 14:46:32–33 | như trên | config api/worker được image mới chấp nhận; `02-roles.sh` áp dụng, dấu hiệu v1.0.4 `1,true` |
| 14:46:35 | log container `ottimo-migrate-run-…` | `{"level":"info","msg":"migrations applied"}` |
| 14:46:36 | `ottimo-deploy` | **`migrations: 74 applied / 74 in the image journal`** (trước là 73) |
| 14:47:03 | `ottimo-deploy` | `OK: sha-f871ab1eaa1b is live`; `CI deploy … ok` |
| 14:49 | `docker ps` | `ottimo-api-1` healthy, `ottimo-web-1` healthy, `ottimo-worker-1` chạy, cùng `sha-f871ab1eaa1b`. Production không đổi (`sha-f8791cf83b63`, v1.0.6) |

**Thời gian chạy:** từ cuối bước `roles` (14:46:33) tới dòng đếm migration (14:46:36) là **khoảng 3 giây**, gồm cả khởi động container một lần, chạy 0099 và chạy container đếm journal. Bản thân 0099 dưới 1 giây (log migrator không ghi mốc riêng).

**Log PostgreSQL staging 14:46–14:48:** 0 dòng `ERROR`/`FATAL`/`PANIC`. Có 3 dòng `WARNING: role "ottimo_app|ottimo_readonly|ottimo_requeue" has not been granted membership in role "ottimo_owner"` lúc 14:46:33: đến từ `02-roles.sh` (REVOKE phòng thủ, chạy ở mọi deploy), **trước** migrate, không liên quan 0099.

**Kiểm schema sau 0099 (`SQLRO`, staging):**

| Kiểm | Kết quả |
|---|---|
| `drizzle.__drizzle_migrations` | 74 |
| 3 bảng mới `billing_period`, `billing_period_line`, `meter_reading` | có đủ 3; 0 / 0 / 0 dòng |
| `payment_billing_period_fk` | có, `convalidated = true` |
| 7 chỉ mục mới (gồm 4 chỉ mục từng phần / duy nhất) | đủ 7 |
| RLS bật + FORCE trên 3 bảng mới | 3/3 |
| 3 khóa `config_parameter_def` (`utility_unit_price`, `utility_vat_rate`, `monthly_statement_rules`) | 3/3 |
| `payment` staging | 518 dòng, 0 dòng có `billing_period_id`, 480 kB |

### 18.2 Lệch so với mô tả giao việc (để ORC/ARC biết)
File 0099 trên main (`f871ab1e`) **không** dùng `NOT VALID` rồi `VALIDATE`. FK được thêm một bước, có kiểm luôn:
`ALTER TABLE "payment" ADD CONSTRAINT "payment_billing_period_fk" FOREIGN KEY ("property_id","billing_period_id") REFERENCES "public"."billing_period"("property_id","id") …;`
Chú thích BE trong file ghi rõ lý do: mọi dòng `payment` trước 0099 có `billing_period_id` NULL. Với dữ liệu hiện nay, cách này đúng và không cần tách. Tách thành `NOT VALID` + `VALIDATE` cũng không giảm khóa ở đây, vì migrator của drizzle chạy mọi migration đang chờ trong **một** giao dịch, nên khóa vẫn giữ tới COMMIT.

### 18.3 Rủi ro trên production: thấp, khóa dưới 1 giây

Số đếm production (`SQLRO`, 14:5x, chỉ số):

| Mục | Production |
|---|---|
| Migration đã chạy | 73 (chưa có 0099; `billing_period` chưa tồn tại) |
| `payment` | **3 dòng**, 0 có `billing_period_id`, 152 kB |
| `folio_line` / `folio` / `reservation` | 38 / 11 / 11 |
| Dung lượng DB | 19 MB |
| Giao dịch mở > 1 phút (`pg_stat_activity`) | 0 |

Ước lượng khóa:
- `ADD CONSTRAINT … FOREIGN KEY` lấy khóa `SHARE ROW EXCLUSIVE` trên `payment` và `billing_period` rồi quét `payment` để kiểm. Khóa này **chặn ghi** (INSERT/UPDATE/DELETE) vào `payment`, **không chặn đọc**. Quét 3 dòng (152 kB) mất dưới 1 ms. Staging quét 518 dòng (gấp ~170 lần) và cả lần migrate chạy chưa tới 3 giây, không lỗi.
- Các FK khác của 0099 lấy cùng loại khóa trên các bảng được tham chiếu: `property`, `folio`, `reservation`, `folio_line`, `room`, `attachment`, `app_user`. Vì chạy trong một giao dịch, các bảng này cũng bị chặn ghi tới COMMIT, ước lượng **dưới 1 giây** trên production.
- Trong lúc migrate, api/worker cũ vẫn chạy (`deploy.sh` bước 3, trước khi thay container). Một lễ tân ghi thu hay sửa folio đúng lúc đó sẽ chờ dưới 1 giây, không lỗi: khóa chờ của app là 5 s (`DEFAULT_LOCK_TIMEOUT_MS`).
- **Rủi ro còn lại (nhỏ):** migrator (`src/db/migrate.ts`) **không đặt `lock_timeout`**. Nếu lúc deploy có một giao dịch dài đang giữ khóa trên `payment` hoặc `folio` (báo cáo dài, phiên psql quên đóng), `ALTER` sẽ chờ, và mọi lệnh ghi xếp hàng sau nó, gây treo ghi. Production hiện có 0 giao dịch mở > 1 phút. Cách giảm: (1) trước deploy chạy lại kiểm `long_tx` bằng `SQLRO` (đã làm lúc 14:5x, kết quả 0); (2) deploy giờ vắng; (3) đề xuất BE/ARC (không chặn v1.0.7): thêm `SET lock_timeout = '10s'` trong `migrate.ts` trước `migrate(...)`, để migrate tự dừng và báo lỗi thay vì treo ghi.
- Quay lui: 0099 chỉ thêm (3 bảng, 2 cột trên bảng mới, 1 FK, 3 khóa danh mục). Image cũ `sha-f8791cf83b63` chạy được trên DB đã có 0099 (`rollback.sh`, DB đi trước image theo luật "expand first"). Sao lưu ngay trước deploy production như mục 17.2.

Kết luận OPS: chạy 0099 trên production **an toàn với dữ liệu hiện có**. Phần thời gian khóa của `BE-190-07` coi như đã trả lời. Phần còn lại của thẻ là kiểm tính đúng trên dữ liệu thật: đếm dòng trước/sau, so tổng folio 3 đơn mẫu. Phần này cần chạy trên bản sao (18.4).

### 18.4 Chạy thử 0099 trên bản sao production: các bước đề xuất (CHƯA LÀM, ORC hỏi INV)

Lưu ý runbook: `restore-drill.sh` ghi rõ chỉ chạy **trên Mac của OPS/INV hoặc VPS thứ hai, không bao giờ trên máy chủ đã tạo bản sao lưu**. Vì vậy OPS **không** đề xuất khôi phục vào DB tạm trên VPS production. Cách an toàn sẵn có là cách đã dùng ở diễn tập R3/R4 (`b2-runbook.md` 2.5, runner `ottimo-drill-runner:local`, khóa `age` đưa qua stdin vào tmpfs). Lần diễn tập production trước mất 5 giây, số đếm khớp 100 %.

| Bước | Việc | Ai | Thời gian |
|---|---|---|---|
| 1 | `systemctl start ottimo-backup@ottimo-prod.service` để có bản mới nhất (như 17.2) | OPS | ~10 s |
| 2 | Trên Mac INV: `pull-backups.sh --to ~/.ottimo/backups/ottimo-prod` (khóa kéo chỉ đọc, tệp vẫn mã hóa `age`) | INV/OPS | < 1 phút (DB 19 MB) |
| 3 | `restore-drill.sh --identity <khóa qua stdin> --from … --api-image ghcr.io/…/ottimo-api:sha-f8791cf83b63 --keep`: khôi phục vào mạng nội bộ không mở cổng, kiểm `/health`, so `backup-counts.sql` với `counts-<stamp>` (số đếm 73 migration) | INV (giữ khóa `age`) + OPS | ~10 s |
| 4 | Trên DB tạm vừa khôi phục: lưu số đếm trước (`backup-counts.sql` + tổng folio 3 đơn mẫu, chỉ số tiền), chạy migrate one-shot của image `sha-f871ab1eaa1b` (`node dist/db/migrate-cli.js`, migrator là `ottimo_migrator` của DB tạm), đo thời gian, đọc log postgres | OPS | ~1 phút |
| 5 | Lấy lại số đếm sau: phải trùng 100 % với trước, migration = 74, FK `convalidated`, 3 khóa danh mục, 3 bảng rỗng | OPS | ~1 phút |
| 6 | Xóa container/volume/mạng/tệp giải mã (script tự làm khi bỏ `--keep`, ở đây làm tay), INV xóa khóa `age` khỏi Mac | OPS + INV | ~1 phút |

Tổng: **khoảng 10–15 phút**, cần INV có mặt (khóa `age` chỉ INV giữ). Hạn chế: `restore-drill.sh` hiện không có tùy chọn chạy migrate của image khác. Bước 4 làm bằng lệnh tay trên container `--keep`, hoặc OPS làm PR nhỏ thêm `--migrate-with <image>` cho script (cần SEC review vì có mật khẩu migrator của DB tạm), khoảng 1 giờ.

Phương án nhẹ hơn, không cần khóa `age`, không đụng dữ liệu production: chạy bước 3–5 trên bản sao lưu **staging** lúc 03:30 hôm nay (trước 0099). Thẻ ARC chỉ đòi "bản sao dữ liệu staging", nên cách này đủ. Staging dùng khóa `age` riêng của staging. Thời gian tương tự.

### 18.5 Việc còn lại
1. ORC hỏi INV chọn: (A) chạy thử 0099 trên bản sao staging 03:30 (đủ cho thẻ ARC, OPS đề xuất); (B) chạy trên bản sao production (cần INV có mặt với khóa `age`, 10–15 phút); (C) chấp nhận bằng chứng 18.1–18.3 và để QC quyết ở cổng.
2. Thẻ đề xuất cho BE/ARC (Minor, không chặn): `lock_timeout` cho migrator (18.3).
3. Trước khi deploy production v1.0.7: sao lưu thủ công, chạy lại kiểm `long_tx`, deploy giờ vắng; sau deploy `journalctl -t ottimo-deploy` phải có `migrations: 74 applied / 74`.

Không commit (theo giao việc).

## 19. Chạy thử 0099 trên bản sao staging (phương án A) – 18/11 18:00–18:06: ĐẠT

Căn cứ: INV chọn phương án A (18.5 mục 1) trong chat ngày 18/11; giao việc ORC Round 5, bước Kiểm thử. Làm bước 3–6 của 18.4 theo `restore-drill.sh` và `b2-runbook.md` 2.5. Khôi phục **trên Mac**, không trên VPS đã tạo bản sao. Không đụng DB hay dữ liệu production. Không in khóa, `.env`, mật khẩu. Trong mục này chỉ có số đếm, không có số tiền: tổng folio chỉ ghi "khớp / khác".

### 19.1 Bản sao lưu và đầu vào

| Mục | Giá trị |
|---|---|
| Bản sao lưu | Staging `20261117T203350Z` = **03:33:50 ngày 18/11** (giờ VN), tức lượt timer 03:30. Chụp **trước** 0099: staging lên `sha-f871ab1eaa1b` (74 migration) lúc 14:46. Bản khôi phục có 73 migration, đúng như mong đợi |
| Bộ tệp | `db-`, `blobs-`, `counts-`, `purge-journal-`, `privacy-notice-` (đều `.age`) + `.sha256`. Lấy qua SSH quản trị (`sudo tar` đọc `/var/backups/ottimo`), vì khóa kéo `ottimo_backup_pull` chỉ mở thư mục production. Lưu vào thư mục 0700 trên Mac. 5/5 checksum khớp |
| Khóa `age` staging | Tệp khóa staging có sẵn trên Mac từ R2 (`staging-readiness.md` mục 3, ngoài repo, 0600). Gắn **chỉ đọc** vào container chạy một lần. Không in, không chép, không chuyển. So khóa công khai (`age-keygen -y`) với `recipients.txt` staging trên máy chủ: **KHOP**. Phương án A **không cần INV thao tác** |
| Image khôi phục (73 migration) | `ottimo-api:sha-f8791cf83b63` (v1.0.6 production), digest `sha256:ed0e50ab…ae1d`, trùng 17.3 |
| Image migrate (74 migration) | `ottimo-api:sha-5e98ec5aec1b`, digest `sha256:f622fb02…6ed9`. Đây là image staging đang chạy từ 17:40, ứng viên cho v1.0.7. File 0099 ở `5e98ec5a` **giống hệt** ở `f871ab1e` (`git diff` rỗng trên thư mục migrations) |
| Cách chạy | Runner `ottimo-drill-runner:local` (`b2-runbook.md` 2.5), `restore-drill.sh --stamp 20261117T203350Z --keep`, rồi một script một lần trong thư mục tạm của phiên (ngoài repo). Script làm bước 4–6 trong cùng container: tệp giải mã và mật khẩu ngẫu nhiên của DB tạm chỉ nằm trong tmpfs. Mạng `--internal`, không mở cổng |

Lần chạy 18:02 dừng ngay ở bước khởi động postgres: tôi gắn repo vào runner ở đường dẫn khác với trên Mac, nên Docker không tìm thấy `02-roles.sh`. Lỗi nằm ở cách gọi, không ở script hay bản sao lưu. Đã dọn sạch (0 container, volume, mạng). Lần 18:04 gắn `$P:$P` đúng như runbook. Lần đó đếm nội dung bảng bị lỗi script (chỉ đếm 1 bảng), nên chạy lại lúc 18:04:43 trên cùng bản sao lưu. Số liệu dưới đây lấy từ **lần 18:04:43**.

### 19.2 Bước 3 – Khôi phục (biên bản `restore-drill.sh`)

| Kiểm | Kết quả |
|---|---|
| Kết quả | **ĐẠT – `/health` ok**. Số đếm sau khôi phục so với `counts-20261117T203350Z`: **khớp 100 %** |
| Thời gian khôi phục | 6 giây (giải mã, DB, tệp, khởi động api) |
| Tệp blob | 21 |
| `privacy-notice.log` | có trong bộ (46 dòng), version `2026-11-04`, `2026-11-16` khớp DB |
| `purge_journal` (tệp riêng) | 87 dòng |

### 19.3 Bước 4 – Số đếm trước + chạy 0099 một lần

Số đếm trước (`backup-counts.sql`, bỏ 2 dòng tổng tiền): migrations **73**, properties 1, users 31, reservations 407, guests 483, folios 407, folio_lines 2061, payments 518, data_keys_live 152, purge_journal 87. Có 125 bảng `public`, 200 dòng `config_parameter_def`. Giao dịch mở > 1 phút: 0.

3 folio mẫu là 3 folio nhiều dòng nhất (54, 44, 44 dòng; hòa thì xếp theo id). Mỗi folio ghi tổng dòng folio và tổng thanh toán. Số tiền chỉ nằm trong tmpfs của container, không ghi ra.

Trước khi migrate, api cũ đã dừng: lúc đó chỉ còn migrator chạm DB. Migrate bằng `node dist/db/migrate-cli.js` của image `sha-5e98ec5aec1b`, vai `ottimo_migrator` của DB tạm (giống service `migrate` trong `docker-compose.prod.yml`). Postgres tạm bật `log_min_duration_statement = 0` và `log_lock_waits = on`.

| Đo | Kết quả |
|---|---|
| Migrator | `{"level":"info","msg":"migrations applied"}`, exit 0 |
| Thời gian toàn bộ | **721 ms**, gồm khởi động container, Node chạy giả lập amd64 trên Mac arm64, và SQL. Lần 18:04 đo được 706 ms |
| Thời gian SQL (log postgres) | 65 câu lệnh, **tổng 25,7 ms**, câu dài nhất 3,2 ms. Lần 18:04: 21,9 ms và 3,1 ms |
| Log postgres trong lúc migrate | ERROR 0 · FATAL 0 · PANIC 0 · WARNING 0 · chờ khóa 0 |

### 19.4 Bước 5 – Số đếm sau và kiểm schema

| Kiểm | Kết quả |
|---|---|
| Migration | **74** (trước 73) |
| `backup-counts.sql` (mọi dòng trừ `migrations`, **kể cả 2 tổng tiền**) | **khớp** |
| Tổng 3 folio mẫu (dòng folio + thanh toán) | folio 1 **khớp** · folio 2 **khớp** · folio 3 **khớp** |
| Nội dung 125 bảng có trước 0099 (md5 toàn bộ dòng mỗi bảng) | 124 bảng **giống hệt**. 1 bảng đổi là `config_parameter_def`: 200 → 203 dòng = 3 khóa mới, đúng thiết kế |
| Bảng mới | `billing_period`, `billing_period_line`, `meter_reading`: đủ 3, **0 / 0 / 0 dòng**, chủ sở hữu `ottimo_owner` 3/3 |
| `payment_billing_period_fk` | có, **`convalidated = true`**. FK chưa kiểm trong toàn DB: 0 |
| 3 khóa danh mục (`utility_unit_price`, `utility_vat_rate`, `monthly_statement_rules`) | **3/3** |
| RLS bật + FORCE trên 3 bảng mới | 3/3 |
| 7 chỉ mục mới | 7/7 |
| `payment` có `billing_period_id` | 0 |
| Thêm: api `sha-5e98ec5aec1b` trên DB vừa migrate | `/health` **ok** |

### 19.5 Bước 6 – Dọn dẹp

- Container, volume và mạng `ottimo-restore-20261117t203350z*`: còn 0 / 0 / 0. Script tự đếm, rồi kiểm lại bằng `docker ps -a`, `docker volume ls`, `docker network ls` trên Mac.
- Tệp giải mã và mật khẩu ngẫu nhiên của DB tạm nằm trong tmpfs, mất khi container dừng.
- Đã xóa bản sao mã hóa trên Mac (`~/.ottimo/backups/ottimo-staging-drill-…`). Đã xóa biên bản của lần chạy lỗi script.
- Biên bản lần 18:04:43 giữ lại ở `~/.ottimo/drills/drill-0099-staging-20261118-run2.txt` (0600, ngoài repo). Tệp có 2 tổng tiền của dữ liệu thử staging, giống biên bản R3/R4.
- Tệp khóa `age` staging trên Mac **không đổi**: không tạo, không xóa. Theo `staging-readiness.md` mục 3, đây là chỗ cất khóa đó.
- Hai image api đã kéo về Docker trên Mac: không chứa bí mật, giữ lại.
- Máy chủ: không ghi gì. Chỉ đọc danh sách bản sao lưu, `recipients.txt` và trạng thái container. Hai stack vẫn healthy: staging `sha-5e98ec5aec1b`, production v1.0.6 chạy 27 giờ. Không có lượt deploy mới.

### 19.6 Kết luận và việc trước khi deploy production

**ĐẠT.** Trên dữ liệu staging (518 thanh toán, 2061 dòng folio):
- 0099 chạy sạch: dưới 30 ms SQL, không lỗi, không chờ khóa;
- không đổi dòng nào đã có, ngoài 3 khóa danh mục mới;
- tổng 3 folio mẫu khớp;
- image mới chạy được trên DB đã migrate.

Phần còn lại của thẻ `FB-R5-ARC-BE-190-07` (kiểm trên bản sao dữ liệu) coi như đã trả lời. Về phía OPS, 0099 **không chặn** phát hành production. Phát hành vẫn chờ cổng QC và ORC duyệt Release.

Danh sách kiểm trước khi deploy production v1.0.7 (thay 18.5 mục 3):
1. Tag Release trên commit có 0099 giống hệt `f871ab1e`/`5e98ec5a`. Lấy digest từ artifact `image-digests` của CI, đối chiếu khi `resolve`.
2. **Giờ vắng**: tránh giờ nhận/trả phòng và giờ lễ tân ghi thu. Báo lễ tân trước vài phút: Desk gián đoạn khoảng 4 giây lúc đổi container (`b2-runbook.md` 8.2).
3. **Sao lưu thủ công** ngay trước tag: `systemctl start ottimo-backup@ottimo-prod.service`. Đạt khi có `OK: … encrypted files` và `backup.last_ok` mới. Ghi lại mã giờ để quay lui.
4. **Kiểm giao dịch đang mở** bằng `SQLRO` ngay trước khi duyệt deploy, dùng `pg_locks` (sửa 18/11 theo §20.2):
   ```sql
   SELECT count(DISTINCT pid) FROM pg_locks WHERE pid IS NOT NULL AND pid <> pg_backend_pid();
   ```
   Đúng là `0`. Khác 0 thì chạy lại sau 1–2 phút; vẫn khác 0 thì hoãn: migrator chưa có `lock_timeout` (18.3). Lý do đổi: `ottimo_readonly` không có `pg_read_all_stats`, nên `pg_stat_activity` giấu `state`/`xact_start` và câu "giao dịch mở > 1 phút" cũ luôn ra 0. `pg_locks` không bị giấu theo vai, và mọi giao dịch đang mở đều giữ khóa `virtualxid`. Cấp `pg_read_all_stats` để vẫn đọc được tuổi giao dịch: thẻ Minor cho SEC, chưa làm.
5. Ghi số đếm production trước (`SQLRO`, chỉ số): migrations 73, `payment`, `folio_line`, `folio`, `reservation`, `config_parameter_def`.
6. Sau deploy:
   - `journalctl -t ottimo-deploy` có `migrations: 74 applied / 74 in the image journal` và `OK: <tag> is live`.
   - `SQLRO`: 3 bảng mới có 0 dòng; `payment_billing_period_fk` có `convalidated = true`; có 3 khóa danh mục. Số đếm ở mục 5 không đổi, riêng `config_parameter_def` +3.
   - Log postgres production quanh giờ deploy: 0 ERROR/FATAL. Chỉ có 3 WARNING quen thuộc của `02-roles.sh`, xem 18.1.
   - `ops-check`. Desk 200, api/web healthy, worker chạy.
7. Quay lui nếu cần: `rollback.sh sha-f8791cf83b63`. Lần chạy thử này **không** kiểm api cũ trên DB 74: chỉ kiểm api cũ trên DB 73 và api mới trên DB 74. Quay lui dựa vào luật "expand first": 0099 chỉ thêm, bản cũ không đọc bảng hay khóa mới (18.3). Khôi phục DB từ bản ở mục 3 chỉ dùng khi hỏng dữ liệu.

Thẻ đề xuất, giữ như cũ (Minor, không chặn v1.0.7): BE/ARC thêm `SET lock_timeout` cho migrator (18.3).

Không commit (theo giao việc, ORC commit).

## 20. Kiểm chỉ đọc production trước v1.0.7 – 18/11 18:24–18:30 (QC FB-INV-012 điều kiện 2)

Căn cứ: giao việc ORC Round 5, bước QC (điều kiện 2 của `rounds/round-05/qc/fb-inv-012-qc-gate.md`). ORC báo INV đồng ý trong chat 18/11 cho lần đọc này, chỉ cho mục đích này. Chỉ đọc: mọi câu DB qua khối `SQLRO`, ba phiên, cả ba phiên hai dòng chốt đầu là `on` và `ottimo_readonly`. Không SQL ghi, không migrate, không deploy, không đọc `.env`. Không in tên khách, mã đơn, số tiền, số/tên tài khoản, IP. Chỉ có số đếm và có/không. Lệnh Docker và tệp trạng thái đọc bằng `sudo -n` (chỉ `inspect`, `cat`).

### 20.1 Bảng kết quả

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | `property` đang hoạt động | 1 |
| 1a | Địa chỉ (`property.address`, ra `addressLine` của phiếu) có giá trị | **Không** (0/1) |
| 1b | Hotline (`property.phone_public`, ra `hotline` của phiếu) có giá trị | **Không** (0/1) |
| 2 | `payment_receiving_account` (tham số `config_parameter`, không phải bảng riêng): có bản hiệu lực hôm nay | **Có**. 1 dòng tất cả; 1 bản hiệu lực (`effective_from` ≤ hôm nay); đủ 3 trường `bankBin`/`accountNo`/`accountName`. Không đọc giá trị |
| 3 | Đơn dài hạn (`stay_type = 'long'`) đang ở (`in_house`) | **0**. Đến trước 01/11: 0 · đến từ 01/11: 0 |
| 3a | Đơn dài hạn `confirmed` (chưa nhận phòng trên Desk) | **6**. Đến trước 01/11: 0 · đến trong tháng 11: 6 · từ 12/2026: 0. Cả 6 có ngày đến ≤ hôm nay; 0 đơn có ngày đi ≤ hôm nay |
| 3b | Đơn dài hạn `cancelled` | 2 |
| 3c | Đơn ngắn ngày: `in_house` 0 · `confirmed` 1 (ngày đến đã qua) · `cancelled` 2 | – |
| 3d | Bảng `meter_reading` / `billing_period` | **Chưa có** (0099 chưa lên production). Không đếm được số đọc đầu kỳ 11 |
| 4 | `long_tx` theo cách §18.3 (`pg_stat_activity`, giao dịch mở > 1 phút) | Ra 0, nhưng **không dùng được làm bằng chứng**: xem 20.2 |
| 4a | Giao dịch đang mở của phiên khác, theo `pg_locks` (mọi giao dịch đang mở đều giữ khóa `virtualxid`) | **0** tiến trình khác giữ khóa · 0 khóa trên `payment`, `folio`, `folio_line`, `reservation`, `property`, `room`, `attachment`, `app_user` · 0 `pg_prepared_xacts` |
| 4b | Số đếm nền (§19.6 mục 5) | migrations **73** · `payment` **3** · `folio_line` **38** · `folio` **11** · `reservation` **11** · `config_parameter_def` **200**. Trùng số §18.3 lúc 14:5x |
| 5 | Image production | `current_tag` = `sha-f8791cf83b63` (v1.0.6). api `sha256:ed0e50ab…ae1d` (trùng §17.3, §19.1) · worker cùng image api · web `sha256:281fc3f6…c46d` (trùng §17.3). api, web healthy; worker chạy; `RestartCount` 0/0/0 |
| 5a | `backup.last_ok` production | `2026-11-18T08:01:02Z` = 15:01 VN, tuổi **203 phút** lúc đọc. Lượt 15:00 đạt; lượt kế 03:00. Còn trong hạn |

### 20.2 Phát hiện: kiểm `long_tx` bằng `pg_stat_activity` bị mù dưới vai `ottimo_readonly`

- `ottimo_readonly` không có `pg_read_all_stats` hay `pg_monitor` (cả hai `false`). Postgres giấu `state`, `xact_start`, `backend_type` của phiên không cùng vai. Phiên `SQLRO` đăng nhập bằng vai quản trị rồi đổi vai, nên **cả dòng của chính nó** cũng bị giấu: 6/6 dòng `pg_stat_activity` có `state` NULL, 0 dòng có `xact_start`.
- Hệ quả: câu "giao dịch mở > 1 phút" **luôn ra 0**, kể cả khi có giao dịch dài. Số 0 ở §18.3 (14:5x) cũng là con số mù. Trạng thái thật lúc đó không biết. Không gây hại vì production không deploy, nhưng §19.6 mục 4 và QC §4 ("không phát hành nếu `long_tx` ≠ 0") đang dựa vào một kiểm không bao giờ báo động.
- Thay thế OPS dùng từ nay (không cần thêm quyền): `pg_locks` không bị giấu theo vai. Mọi giao dịch đang mở giữ khóa `virtualxid` của nó, nên "0 tiến trình khác trong `pg_locks`" nghĩa là lúc đó không có giao dịch nào đang mở. Câu dùng lúc duyệt deploy, trong `SQLRO`:
  ```sql
  SELECT count(DISTINCT pid) FROM pg_locks WHERE pid IS NOT NULL AND pid <> pg_backend_pid();
  ```
  Đúng là `0`. Khác 0 thì chạy lại sau 1–2 phút (app có giao dịch ngắn hợp lệ); vẫn khác 0 thì hoãn deploy như §19.6 mục 4. Câu này không đo được tuổi giao dịch, nên chặt hơn câu cũ (đếm cả giao dịch ngắn).
- Thẻ đề xuất (Minor, không chặn v1.0.7, cần SEC duyệt): `02-roles.sh` cấp `pg_read_all_stats` cho `ottimo_readonly` để `ops-check` và runbook đọc được tuổi giao dịch; hoặc giữ cách `pg_locks`. OPS sẽ sửa §19.6 mục 4 sang câu `pg_locks` khi ORC đồng ý.

### 20.3 Ảnh hưởng tới phát hành

| Điều kiện QC | Kết quả | Chặn gì |
|---|---|---|
| QC §4: có tài khoản nhận VietQR hiệu lực | Có (mục 2) | Không chặn |
| QC §4: `long_tx` = 0 | Kiểm cũ mù (20.2). Theo `pg_locks` lúc 18:24: 0 | Không chặn, nếu lúc duyệt deploy dùng câu `pg_locks` |
| QC điều kiện 4: chân phiếu đủ địa chỉ, hotline | **Cả hai trống** | Không chặn deploy. **Chặn phiếu đầu tiên** cho tới khi OWN nhập địa chỉ và hotline trên Desk (cấu hình cơ sở), rồi in thử A5 |
| QC điều kiện 5: khách đang ở từ trước khi có Desk | **0 đơn dài hạn đang ở trên Desk**. 6 đơn dài hạn còn `confirmed`, ngày đến đều trong tháng 11 và đã qua; 0 đơn ngày đến trước 01/11 | Không chặn deploy. Chưa đơn nào có phiếu được cho tới khi lễ tân nhận phòng trên Desk. Cả 6 đều thuộc nhóm "phiếu tháng nhận phòng" (kỳ lẻ tháng 11), đúng rủi ro thu trùng tháng 11 của điều kiện 5. Nhóm "đến trước 01/11, thiếu đầu kỳ 11" hiện là 0 trên Desk |

Lưu ý cho DOM/ORC (điều kiện 5): 6 đơn dài hạn trên Desk ít hơn số căn đang cho thuê dài hạn theo brief (10 căn). Dữ liệu không cho biết khách nào thực tế đã ở trước 01/11 nhưng được nhập ngày đến tháng 11. Hướng dẫn của điều kiện 5 nên yêu cầu lễ tân đối chiếu ngày đến thật trước khi bấm nhận phòng. Ngoài ra có 1 đơn ngắn ngày `confirmed` đã qua ngày đến, chưa nhận phòng hay đánh dấu vắng: lễ tân nên xử lý (không liên quan 0099).

### 20.4 Không thay đổi gì
Máy chủ: không ghi gì, không khởi động lại gì, không deploy. Chỉ chạy 3 phiên `SQLRO`, `docker inspect`, đọc `state/current_tag` và `state/backup.last_ok`. Không tạo tệp trong repo ngoài mục này. Không commit (theo giao việc, ORC commit).
