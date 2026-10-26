# SEC – Sổ Verified Round 3 Sprint 1 (theo B.0 của `outputs/SEC/s1-security-requirements.md`)

- Người ghi: SEC | Ngày: 24/10/2026 | Bước: Kiểm thử (sau cổng tiền G1 – decision-log 24/10, `main` `870ecfd`).
- **Commit được Verified: `880ea19`** (`origin/main`). CI push run `40085123525` (attempt 1):
  - mọi job kiểm **xanh**: format · lint · audit · test · build; API contract; OpenAPI lint; gitleaks; infra scripts; landing Playwright; docker images build + E2E smoke; publish images;
  - log không có `retry #`;
  - riêng `deploy staging` / `deploy landing preview` ở trạng thái `cancelled`. Hai job này chờ người duyệt môi trường, không phải job kiểm.
- Từ `880ea19` tới `870ecfd` chỉ có thay đổi tệp fuzz harness (`test/fuzz/*`) và tài liệu, không đổi mã ứng dụng. CI của `870ecfd` (run `40089913374`) đang chạy lúc ghi sổ. Nếu run này đỏ ở job kiểm, SEC xem lại trước tag RC.
- Cách kiểm lại (B.0 (3)):
  - worktree sạch ở `880ea19`, Postgres 17 mới, init roles của repo, migrate từ đầu tới migration mới nhất trên `main` (0087);
  - test chạy bằng role `ottimo_app` với `--maxWorkers=3`, dữ liệu giả;
  - worktree và container đã gỡ ngay sau khi chạy;
  - `tsc --noEmit` đạt.
- **Kết quả: 18 tệp, 229/229 ca đạt.**
- Kiểm RLS sau migrate: 14 bảng nhạy cảm đều `relrowsecurity = t` và `relforcerowsecurity = t`: `guest`, `reservation`, `reservation_guest`, `guest_request`, `online_checkin`, `attachment`, `approval_request`, `folio_settled_reduction`, `foc_stay_alert`, `website_booking_request`, `public_form_nonce`, `config_parameter`, `mfa_login_challenge`, `retention_run`.
- B.0 (5): log, audit và `retention_run` mới không chứa dữ liệu cá nhân; đã kiểm ở từng review gốc (dẫn trong bảng).

## 1. Bảng Verified

| Thẻ / hạng mục | Mục yêu cầu | Trạng thái | Commit | Tệp test chạy lại (số ca) | Review gốc |
|---|---|---|---|---|---|
| FB-R2-SEC-BE-65 (kiểm lại) | B.1 | **Verified** | `880ea19` | `sec-be65-retention` (10), `registration-party-removal` (18), hồi quy `guest-document-profiles` (5) | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-74 | B.2 | **Verified** | `880ea19` | `sec-r3-q17` (15, khối BE-74: soát từng cột `guest`, migration bù chạy lại được) | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-75 | B.3 | **Verified**, có 2 điểm lệch đã chấp nhận (hàm trả `has_open` + `last_end`; policy `org_retention_read`) | `880ea19` | `sec-r3-q17` (khối BE-75 + khối guard BEC-01) | `s1-SEC-on-BE-C-q17.md` mục 3 |
| FB-R2-SEC-BE-79 | B.4 | **Verified** | `880ea19` | `sec-r3-q17` (khối BE-79, 7 ca, gồm ép lỗi giữa giao dịch), `guest-document-profiles` | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-83 + ESC-026 A (+ R3-Q25) | B.5 | **Verified** | `880ea19` | `r3-be83-esc026` (14), `r3-bb07-limit-basis` (9), `money-limit-basis-architecture` (6), `r3-add3-settled-credit` (13), `r3-br433e-a32-waiver` (11), `r3-bug-012-013` (5), `r3-bug-014-payout-replan` (4). Cổng G1: fuzz 710 chuỗi, 0 vi phạm cứng. | `s1-SEC-on-BE-B.md`, `s1-SEC-on-add3.md`, `s1-SEC-on-fuzz-fixes.md`, `s1-SEC-on-bug-012-013.md`, `s1-SEC-on-bug-014.md` |
| FB-R2-SEC-BE-84 (a) | B.6 (a1) | **Verified** | `880ea19` | `sec-r3-q17` (khối BE-84: "Cần chú ý" chỉ OWN/MGR, chỉ số đếm) | `s1-SEC-on-BE-C-q17.md` |
| R3-Q15 (T13) | B.7 | **Verified** | `880ea19` | `guest-request-t13-r3-bed` (6), `guest-portal-boundaries` (3) | `s1-SEC-on-BE-C-q17.md` mục 8 |
| US-143 / SR-AUTH-06 – **phần mã** | A | **Verified phần mã.** Phần staging/OWN thật còn mở, xem mục 2. | `880ea19` | `mfa-us143` (23); FE `r3-s1-fea` và E2E S2 chạy trong CI | `s1-SEC-on-2FA.md` |
| R3-Q51 (tài khoản nhận VietQR) | C | **Verified** | `880ea19` | `r3-q51-receiving-account` (9), `parameters-delete-architecture` (2); FE `r3-q51-fea` trong CI | `s1-SEC-on-Q51.md` |
| US-155 – **phần server** | `landing-booking-SEC.md` C-2, C-3 (c)(d)(e), C-11, C-12 (a)(c) | **Verified phần server.** Form vẫn **tắt** (mặc định); mốc bật form tính riêng, xem mục 3. | `880ea19` | `public-site-r3-bed` (31), `be-d-r3-s1-units` (45) | `s1-SEC-on-us155.md` |
| BUG-R2-208 / 209 / 210 (lượt kiểm tiền, điều kiện D) | D | **Verified** (D.1–D.4). D.5 có trong hợp đồng 0.3.8; D.6 đạt cùng G1. | `880ea19` | Nằm trong các tệp tiền ở dòng BE-83 (s438-r8) | `s1-SEC-on-BE-B.md` |

Thẻ phụ còn mở, **không chặn** cổng v1.0:
- BE-84 (b) `FOR SHARE` (Should);
- FB-R3-SEC-BE-B-09 (Minor: nâng cơ sở hạn mức qua đường giá hệ thống, chờ DOM, Sprint 2);
- BE-B-05, FZ-03, ADD3-04, 014-01 (Suggestion);
- Q51-03 (HK/axe/E2E – QA), Q51-05 (Suggestion);
- US155-05 (Suggestion).

Ghi chú B.0 (6): trạng thái 6 thẻ trong `round-02/reviews/s4-SEC.md` cần chuyển sang **Verified (`880ea19`)** và gỡ khỏi R3-Q17/Q22/Q33. Lần commit này chỉ gồm tệp này theo chỉ đạo của ORC; SEC sửa `s4-SEC.md` ở lượt sau.

## 2. Điều kiện SEC còn lại trước cổng v1.0 (dữ liệu thật / production)

| # | Điều kiện | Ai làm | Nguồn |
|---|---|---|---|
| 1 | Staging `MFA_ENFORCED = true`. **OWN và MGR thật** đăng nhập hai bước và đăng ký 2FA, có SEC chứng kiến; SEC không giữ mã hay bí mật. Sau bước này US-143 mới được ghi Verified đầy đủ. | OPS bật cờ; INV (OWN), MGR thật; SEC chứng kiến | `s1-SEC-on-2FA.md` "Việc còn lại" (4) |
| 2 | **Thủ tục 06.33** (khôi phục OWN mất cả hai yếu tố): OPS viết, lưu ngoài repo, có bảng **người thật** theo chức danh (FB-R3-SEC-OPS-04). **Diễn tập một lần trên staging, có người chứng kiến thật**, biên bản chỉ ghi kết quả. Xong thì SEC duyệt. | OPS + INV + người chứng kiến; SEC duyệt | `s1-SEC-on-v1-prod.md` mục 5 |
| 3 | **OPS production:** SEC review lại các bản sửa OPS đã báo Done (`responses/s1-OPS-v1.md`): OPS-01 (edge giới hạn kết nối/IP, Major), OPS-02, OPS-03, OPS-05, BOOT-01/02. Production chỉ nhận người dùng thật sau khi OPS-01 Verified. | OPS; SEC kiểm lại | `s1-SEC-on-v1-prod.md` |
| 4 | **Kiểm lại trên commit RC** (B.0 (7)): chạy lại đúng 18 tệp ở mục 1 trên commit gắn tag RC. Nếu tệp liên quan có đổi mã sau `880ea19` thì đọc lại diff. | SEC | B.0 (7) |
| 5 | SEC-G1/G2 (Desk chạy dữ liệu khách thật) theo `s3-SEC.md` mục 9.5, kiểm trên production trước ngày mở. | SEC + OPS | `s3-SEC.md` 9.5 |
| 6 | R3-Q51 trên production: INV **tự nhập** tài khoản nhận thật trên màn H05. Không đưa số vào repo, chat hay tài liệu (Q51-9). | INV | `s1-security-requirements.md` C |

**Mốc riêng – bật form website (US-155),** chỉ khi INV muốn mở form lúc phát hành. Còn 6 điều kiện:
- (1) FE-B/QA: test B.2.1–B.2.3 phía Desk;
- (2) bước VPS: `LANDING_IP`, `LANDING_PUBLIC_API=on`, `LANDING_BASE_URL`; kèm `ops-check` + một lần gọi thật qua landing;
- (3) C-1: kiểm bản dựng landing;
- (4) C-3 (a) và (5) C-13: luật sư, ESC-001;
- (7) QA E2E trên stack có landing.

Chi tiết ở `s1-SEC-on-us155.md`. Form tắt thì không ảnh hưởng cổng v1.0.

---

## 3. Kiểm lại trước cổng v1.0 – 26/10/2026 (đường nhanh, phần SEC trong `qc/v1-gate-checklist.md` mục 5.1 việc 3)

- Người ghi: SEC | Ngày: 26/10/2026 (chiều) | Round 3 – Bước **Kiểm thử** (chuẩn bị cổng v1.0).
- Gỡ dòng QC: G4-4, G3-2, G8-2, G8-3, ghi chú G2-2 (QC-G5). Đọc thêm bản nháp 06.33 cho G2-5.
- Cách kiểm:
  - đọc mã trên `main` (`623a258`) và trên tag `v1.0.0-rc.1`;
  - đọc log CI bằng `gh`: CI push `40199367309` (`2963675`), Release `40288670558`, CI push `40290263410` (`623a258`, đang chạy lúc ghi);
  - đọc Dependabot alerts và PR bằng `gh api`.
- SEC **không** SSH vào máy chủ, không đọc `.env` hay bí mật production, không đụng production. Tệp này không ghi IP, giá trị bí mật hay nội dung thủ tục 06.33.

### 3.1 Bản sửa OPS và BOOT (SEC mục 2 #3, QC G4-4)

| Thẻ | Kết luận | Bằng chứng | Ghi chú |
|---|---|---|---|
| FB-R3-SEC-OPS-01 (**Major**) – edge giới hạn kết nối | **Verified** (`2963675`) | `edge.sh` render: `worker_processes auto`, `worker_rlimit_nofile 32768`, `worker_connections 8192`. `stream` có `limit_conn` theo `$binary_remote_addr` (mặc định 100) và `preread_timeout 5s`. `http :80` có `limit_conn` 20 → 429, header/body/send timeout 10 s, keepalive 15 s. Giá trị giới hạn phải là số 1–9999, sai thì từ chối. `docker-compose.edge.yml` có `ulimits nofile`, `mem_limit 128m`, `pids_limit 100`, vẫn `read_only`, `cap_drop ALL`, `no-new-privileges`, image ghim digest. Log job "infra scripts" của CI `40199367309`: `test-edge.sh` 20/20 ok. Trong đó có ca vượt giới hạn theo IP bị từ chối, IP khác vẫn vào được, kết nối không gửi ClientHello bị đóng sau 5 s, header PROXY giả bị bỏ qua | Mức 100/IP: SEC chấp nhận lý do NAT chung của khách sạn. Edge đi theo bundle `infra/`, không theo image. **OPS xác nhận** bundle edge trên VPS là bản có giới hạn (so sha256 với `main`, như OPS 17.1 đã làm cho `deploy.sh`). Xác nhận này thuộc SEC-G1/G2 (G7-5) |
| FB-R3-SEC-OPS-02 – nguồn digest | **Verified** | CI `publish-images` ghi artifact `image-digests` (3 dòng `sha256` + `tag`). `release.yml` `resolve` lấy đúng lần CI push xanh của `head_sha`, tải artifact, kiểm `tag`, so từng digest với GHCR, lệch thì dừng. Lượt Release thật `40288670558` đã chạy qua bước này: resolve đạt, digest api/web khớp artifact | Chưa có attestation, để R4 (OPS ghi). Không chặn |
| FB-R3-SEC-OPS-03 – `APP_ENV` sai trên stack production | **Verified** | `deploy.sh` coi là production khi có tệp mốc `production`, hoặc `EDGE_NAME=production`, hoặc thư mục `ottimo-prod`. Khi đó `APP_ENV` khác `production` thì dừng. CI `40199367309`: 2 ca (f) đạt, "production home (marker) with APP_ENV=staging" và "EDGE_NAME=production with APP_ENV=staging", cả hai dừng ở `step=config`, không kéo image | – |
| FB-R3-SEC-OPS-05 – lịch sử shell, ngày duyệt | **Verified** (văn bản) | Thủ tục 06.33 (ngoài repo) có `HISTCONTROL=ignorespace`, dòng lệnh bắt đầu bằng dấu cách, kiểm `history \| tail -3` / `history -d`, lưu ý tham số hiện trong danh sách tiến trình. README `infra/server` mục 12 có "SEC duyệt ngày: (chưa) · Diễn tập staging ngày: (chưa)" | Ngày duyệt điền sau diễn tập (3.6) |
| FB-R3-SEC-BOOT-01 – mật khẩu tạm lọt vào tệp | **Verified**, có 1 Suggestion | Wrapper máy chủ `infra/server/bin/production-bootstrap.sh`: `[ -t 0 ] && [ -t 1 ]`, từ chối trong tmux/screen (`TMUX`/`STY`), kiểm api đang chạy, `dc exec` không `-T`. README 12.1 dùng wrapper này, có `clear`, kiểm lịch sử, đóng phiên | **S-2 (Suggestion, OPS):** README 12.1 ghi wrapper "chặn trường hợp `\| tee`, `script`". Câu này chưa đúng: `script` tự cấp một pty, nên kiểm `-t` vẫn qua. Chặn được pipe, redirect, `tee`, tmux/screen. Riêng `script` chỉ chặn bằng thủ tục (dòng "KHÔNG `script`" đã có). Sửa câu chữ. Wrapper `services/api/scripts/production-bootstrap.sh` của BE-A chưa có kiểm TTY, nhưng không nằm trong bundle máy chủ: rủi ro thấp, BE-A thêm khi tiện |
| FB-R3-SEC-BOOT-02 – mật khẩu tạm không hết hạn | **Verified** (thủ tục) | README 12.1: INV ngồi cạnh suốt buổi, làm đủ 4 việc (đăng nhập, đổi mật khẩu, đăng ký 2FA, cất mã khôi phục). Người chạy kiểm `mfa.enrolled` bằng lệnh cụ thể. Không xong trong buổi thì xóa volume, deploy lại, khởi tạo lại | Mật khẩu tạm hết hạn sau 24 giờ: R4 (BE) |

**Kết luận 3.1:** sáu thẻ đều Verified, gồm cả Major OPS-01. Điều kiện "production chỉ nhận người dùng thật sau khi OPS-01 Verified" (mục 2 #3) đã gỡ ở phần repo. Phần máy chủ (bundle edge đang chạy đúng bản này) kiểm cùng SEC-G1/G2 sau khi app production chạy.

### 3.2 Diff `infra/` sau RC – commit OPS `6e2ecc0` (sửa sự cố deploy `step=switch`)

`git diff 2963675 623a258 -- product`: chỉ 3 tệp, `deploy.sh`, `env.production.example`, `ci/test-deploy-from-ci.sh`. Không đổi mã ứng dụng hay image.

| Thay đổi | Kết luận SEC |
|---|---|
| `env.production.example`: `PAYMENT_VIETQR_MODE=production` | **Đạt.** `git grep` cho thấy biến này **chỉ** được `integrations/common/safe-config.ts` đọc (quy tắc (b) production). Không adapter nào đổi hành vi. VietQR vẫn chỉ sinh chuỗi QR tại chỗ tới tài khoản trong tham số `payment_receiving_account` (R3-Q51, SEC Verified C). Chưa nhập tài khoản thì vẫn không có QR. `LIVE_MONEY_MODES` (VNPay/MoMo) vẫn `off`. Không mở đường tiền mới |
| `deploy.sh` bước mới `appconfig` (sau `pull` + kiểm digest, trước `roles`/`migrate`/`switch`) | **Đạt.** Container tạm `dc run --rm --no-deps -T --entrypoint node`, không publish cổng, chỉ gọi `loadConfig(resolveFileSecrets(env))`. Log chỉ ghi dòng `ConfigError`. SEC đọc `config.ts` và `safe-config.ts`: thông báo lỗi chỉ nêu **tên biến** và giá trị enum, không in giá trị bí mật. Lỗi đọc tệp bí mật chỉ nêu đường dẫn. Log nằm trên máy chủ (`state/` 0700). CI chỉ nhận một dòng tóm tắt, như cũ. Bước này giúp an toàn hơn: lỗi cấu hình dừng **trước** khi động tới CSDL và container đang chạy |
| `test-deploy-from-ci.sh` ca (g) | Đạt. Image từ chối `.env` → dừng ở `step=appconfig`, không `up`, không `migrate`. Job "infra scripts" của CI `40290263410` (`623a258`) **xanh**. Lúc ghi sổ, job E2E của run này còn chạy |
| `inv-production-steps.md` phần 10 (lệnh một dòng cho INV) | Đạt. Lệnh lưu bản cũ rồi sửa đúng một dòng, in ra số đếm. Không in giá trị nào, không gửi gì qua chat. **Lưu ý OPS:** `.env` production không có bí mật trực tiếp (bí mật nằm ở tệp `_FILE`), `state/` là 0700, `backup.sh` không sao lưu `state/`. Dù vậy, xóa `state/env.before-vietqr-mode.*` sau khi deploy đạt, để không còn bản cấu hình cũ nằm lại |

Theo QC mục 6 quy tắc 2: nếu tag `v1.0.0` trỏ vào một commit chỉ khác `2963675` ở `infra/` hay tài liệu, phần "SEC đọc diff `infra/`" **đã xong tới `623a258`**. Commit `infra/` nào mới hơn thì SEC đọc tiếp. Chạy lại lượt Release `rc.1` (cùng image) không cần SEC kiểm lại mã.

### 3.3 Xác nhận RC (SEC mục 2 #4, QC G3-2)

**`v1.0.0-rc.1` = `2963675` (tag có chú thích). SEC xác nhận các Verified ở mục 1 (18 tệp, 229/229, RLS 14 bảng, trên `880ea19`) giữ nguyên trên `2963675`.** Căn cứ:
- `880ea19` là tổ tiên của `2963675`;
- `git diff 880ea19 2963675` trong `services`, `packages`, `integrations`, `infra`, `apps/admin-web`, `apps/mobile`, `apps/guest-web`, `.github` chỉ đổi 3 tệp fuzz harness `services/api/test/fuzz/*` (không phải mã chạy);
- phần còn lại là `landing-web`, `design/landing`, `tests/e2e/landing`;
- CI push `40199367309` trên `2963675` xanh mọi job kiểm.

Theo B.0 (7), không cần chạy lại 18 tệp.

### 3.4 D4 – PWA mở snapshot khi 502/503/504 (QC G8-2, s4-qc-gate C5, FB-R2-SEC-MOB-03)

- Đã đọc `apps/mobile/src/app/api.ts` (`unreachable()` = mất mạng hoặc 502/503/504), `App.tsx` (khởi động: lỗi `unreachable` thì mở bằng hồ sơ đã lưu, 401 thì về màn đăng nhập), `data/cache.ts`.
- **Thay đổi 502/503/504 (UXR P-09): chấp nhận.** Nó không mở đường mới cho người cầm máy. Muốn mở snapshot thì chỉ cần tắt mạng, đường này vốn đã có. Kẻ ở giữa không giả được 502/503/504 qua HTTPS + HSTS. Trường hợp 401 vẫn về màn đăng nhập, không mở snapshot.
- **FB-R2-SEC-MOB-03 vẫn Open** (Minor, rủi ro Low). Gặp 401 không xóa kho `snapshot`, và chưa có hạn nhàn rỗi 72 giờ. Rủi ro thấp vì snapshot dựng theo allow-list (`cacheableTask/Room/WorkOrder`): không có C3, SĐT/email, tiền, ghi chú của khách, mô tả phiếu sửa. Tên khách chỉ có ở phòng có việc trong ngày.
- **Đích: v1.1, không chặn v1.0.** Bù cho v1.0: khi nhân viên nghỉ việc, OWN thu hồi tài khoản và nhân viên bấm "Đăng xuất" trên máy. Đăng xuất đã xóa IndexedDB + Cache Storage (SR-PWA-04). PO/DOM thêm dòng này vào hướng dẫn 1 trang (G6-6).

### 3.5 Dependabot (QC G8-3, D5 / R3-Q31, s4-qc-gate C9)

**PR Dependabot:** 9 PR (#1–#9). 6 PR mở (#1, #2, #5, #6, #8, #9) và 3 PR đã đóng (#3, #4, #7), đều đỏ. **Không PR nào được gộp** (`mergedAt` trống cả 9). Điều kiện "không gộp PR đỏ" giữ đúng.

**Cảnh báo mở: 16** (cảnh báo #1 esbuild đã đóng có lý do `not_used`, OPS 11). Không có mức High/Critical.

| Cảnh báo | Gói (bản đang dùng) | Advisory | Đang dùng ở đâu | Phân loại | Lý do |
|---|---|---|---|---|---|
| #4, #5, #6, #15, #16, #17 (Medium) | `nodemailer` 10.0.16 → sửa ở 10.1.4 | GHSA-8c8m-p3m8-cjg8, GHSA-m943-m63m-w62w, GHSA-85x2-q946-cp5h (`addressparser`) | `integrations/notification/smtp.ts`: thư bảo mật **cho nhân viên** (`mfa_*`, `receiving_account_changed`), chạy thật từ ngày đầu | **v1.0.x** (không chặn v1.0, sửa trong ≤ 2 tuần sau phát hành) | Người nhận là email nhân viên do OWN/MGR (có 2FA) nhập. `isEmailAddress` đã chặn khoảng trắng, `<>"',;` và chỉ cho đúng một `@`, nên mẫu `;` và `>` không lọt. Mẫu chú thích lồng `( )` còn qua regex, nhưng phần "nhả ra" không có `@` thứ hai, và kẻ tấn công phải có quyền OWN/MGR. Việc cần làm: INT/OPS chạy lại PR #9 trên nhánh của đội (đỏ ở job E2E smoke, không liên quan nodemailer), gộp khi xanh. INT thêm `()[]\:` vào ký tự cấm của `EMAIL_RE` |
| #7–#14 (4 Medium, 4 Low) | `fast-uri` 3.1.8 / 4.2.2 | GHSA-w74x-v6f9-j3xg, GHSA-xhq7-xmqj-769h, GHSA-wjr9-j795-jxcr, GHSA-333x-w4r6-6crp | Gián tiếp qua `ajv` 8 / `fast-json-stringify` của Fastify, chỉ để phân giải `$ref`/`$id` của schema **do đội viết** | **Không áp dụng** (cập nhật theo nhóm minor-and-patch ở v1.1) | api kiểm đầu vào bằng zod (`parseBody`). Không có `format: uri` lúc chạy (`format: uri` chỉ có trong `openapi.yaml`, dùng cho lint). Không chỗ nào đưa URI của người dùng vào `fast-uri` |
| #3 (Medium) | `react-router(-dom)` 6.30.6 (admin-web) | GHSA-wrjc-x8rr-h8h6 (open redirect bằng `\`) | `LoginPage` đi tiếp theo `from` | **v1.1** (không chặn) | Đã chặn trong app từ R3-Q31: `safeInternalPath` từ chối `//`, `\` (thô và mã hóa), scheme, ký tự điều khiển, khác origin. Có bộ test `SEC_VECTORS` (`r3-s1-fea`). `from` chỉ lấy từ `location.state` do app tự đặt. Nâng lên 7.18 là đổi phiên bản lớn, để v1.1 |
| #2 (Medium) | `react-router` 6.30.6 | GHSA-337j-9hxr-rhxg (SSR hydration) | – | **Không áp dụng** | admin-web là SPA (`BrowserRouter`), không SSR, không `hydrateRoot`, không framework mode |

- **Kết luận: không cảnh báo nào chặn v1.0.**
- Đề nghị OPS đóng #2, #7–#14 trên GitHub với lý do `vulnerable_code_not_used` / `inaccurate`, dẫn mục này.
- Thao tác đóng là ghi lên repo công khai. OPS hoặc INV làm, SEC không tự đóng.

### 3.6 2FA – ca A.7 #14 dời v1.1 (QC-G5, G2-2)

**SEC chấp nhận dời ca A.7 #14 (US-164 xác nhận từ xa) sang v1.1. Ca 14 không áp dụng cho v1.0,** vì:
- US-164 không có trong `rc.1`: các operation `*ManagerConfirmation` chỉ có trong `openapi.yaml`, không có controller hay màn nào trong `services/api` và `admin-web` trên `2963675`;
- đường xác nhận tại quầy (SR-AUTH-11, `PasswordReauth.verifyApprover`) **fail-closed**: người xác nhận có `mfa_enabled` thì luôn 401, mật khẩu không được kiểm. Đây là ca 15, xanh trong `mfa-us143` (CI `2963675`).

Điều kiện kèm theo:
1. Khi US-164 gộp ở v1.1, ca 14 và SR-AUTH-11 nhận TOTP phải xanh **trước khi gộp**. Đây là cổng SEC.
2. **Ca 16 không dời.** Vẫn cần phần đồng hồ giả (G2-2: `mfaToken` quá 5 phút, mã ±1/±2 bước). Nên có thêm một lượt E2E với `MFA_ENFORCED=true`. Đây vẫn là điều kiện Verified US-143 cho v1.0.
3. **Ghi chú cho PO/DOM/QA. Không phải lỗi bảo mật, nhưng ảnh hưởng vận hành ngày đầu:** production bật `MFA_ENFORCED=true`, nên mọi OWN/MGR đều có 2FA. Vì vậy đường "quản lý nhập mật khẩu ngay trên máy quầy" (phụ thu trả muộn bằng giá 1 đêm, `requestFoc`) sẽ **luôn bị từ chối** ở v1.0.
   - `release-notes.md` (Giới hạn đã biết, dòng "Một số việc cần quản lý nhập mật khẩu ngay trên máy quầy") viết như thể đường này dùng được. PO sửa thành: "chưa xác nhận tại quầy hay từ xa được; dùng cách dự phòng trên Desk, quản lý xem lại trong 24 giờ".
   - QA-3 (d) thêm một ca: MGR có 2FA xác nhận tại quầy → 401, cách dự phòng vẫn chạy.
   - SEC **không** nới fail-closed cho v1.0.

### 3.7 Thủ tục 06.33 – đọc bản nháp sửa lần 2 (ngoài repo) cho buổi B1 (QC G2-5)

- SEC đọc bản trên máy INV (thư mục 0700, tệp 0600, cùng ngày 23/10). **Không chép nội dung vào repo.**
- Bốn điểm của FB-R3-SEC-OPS-04 đã có trong văn bản:
  - (1) bảng người thật theo chức danh, ghi rõ vai agent không được làm;
  - (2) nhánh "INV vừa yêu cầu vừa chạy lệnh";
  - (3) lệnh không đổi mật khẩu, kèm giới hạn đã biết;
  - (4) báo `owner` qua email, điện thoại tạm.
- → **OPS-04: Verified phần văn bản. CHƯA duyệt.** SEC duyệt sau buổi diễn tập B1 có người chứng kiến thật.

Nhận xét cần sửa **trước B1**:
- **(a) Tài khoản diễn tập.** Mục diễn tập dùng tài khoản thử của bộ test, mà tài khoản này nay có TOTP thử của QA và đang dùng cho QA-3/E2E. Đặt lại 2FA sẽ làm hỏng lượt QA. Dùng tài khoản diễn tập riêng, hoặc tài khoản OWN dùng thử của INV (G7-4). Tài khoản của INV hợp với nhánh "INV tự chạy" hơn. Báo QA lịch diễn tập.
- **(b) Tài khoản SSH ở mục các bước.** Mục này ghi một tài khoản khác với tài khoản quản trị INV đang dùng thật (OPS 17). Chốt một tài khoản, và trong buổi diễn tập kiểm lệnh chạy được bằng đúng tài khoản đó (quyền docker / `sudo -u`). Không dùng khóa CI.
- **(c) Mã phiếu.** Ghi rõ ai cấp và lúc nào. Đề xuất: người chứng kiến cấp khi được báo trước lúc chạy, và ghi vào biên bản **trước** khi chạy lệnh.

Nên có, không chặn B1:
- **(d) Câu hỏi xác minh của nhánh người yêu cầu khác người chạy.** Hai câu hiện tại chỉ hợp khi người yêu cầu là INV. Với MGR hay `owner` khác, chuẩn bị câu riêng từ trước, hoặc chỉ dựa vào gặp mặt + gọi lại số có sẵn + người chứng kiến.
- **(e) "Người chứng kiến ký".** Biên bản là tệp trên Mac INV. Dùng biên bản giấy, hoặc lưu tin nhắn xác nhận của người chứng kiến kèm biên bản.
- **(f) Báo bằng điện thoại.** Relay email đã chạy từ 26/10. Sau khi thư thử 8b tới hộp thư, ghi lại rằng báo bằng điện thoại chỉ là dự phòng khi gửi lỗi.
- **(g) Bản trong trình quản lý mật khẩu.** Sau mỗi lần sửa tệp, chép lại vào trình quản lý mật khẩu để hai bản giống nhau.

Sau B1, SEC ghi vào README `infra/server` mục 12: "SEC duyệt ngày …, diễn tập staging ngày …".

### 3.8 Còn chặn v1.0 về phía SEC (cập nhật mục 2)

| # mục 2 | Trạng thái 26/10 | Chặn gì |
|---|---|---|
| 1 – OWN/MGR thật đăng ký 2FA trên staging, SEC chứng kiến | Mở (B1) | Verified đầy đủ US-143 → ĐK2 |
| 2 – 06.33 diễn tập + SEC duyệt | Văn bản đạt. Sửa (a)–(c) rồi diễn tập ở B1 | Dữ liệu thật |
| 3 – bản sửa OPS/BOOT | **Verified** (3.1) | – |
| 4 – kiểm lại trên RC | **Xong** (3.3) | – |
| 5 – SEC-G1/G2 trên production (gồm kiểm bundle edge đang chạy) | Mở, chờ app production chạy (G4-1) | Ngày mở |
| 6 – INV tự nhập tài khoản nhận thật (H05) | Mở (B2) | Ngày nhận tiền |
| Thêm – ca A.7 #16 đồng hồ giả (FE-A/QA) | Mở | Verified US-143 → ĐK2 |

Không chặn: D4 / MOB-03 (v1.1), Dependabot (v1.0.x / v1.1 / không áp dụng), ca 14 (v1.1), S-2, việc xóa bản `.env` cũ.

---

## 4. Sau deploy production đầu – 26/10/2026 (tối): diff `infra/`, thư thử 8b, SEC-G2 từ ngoài vào

- Người ghi: SEC | Round 3 – Bước **Kiểm thử** | Production chạy `v1.0.0-rc.1` (`sha-29636757822b`), DB trống, chưa có tài khoản.
- SEC **không** SSH, không đăng nhập, không gửi thư. Chỉ đọc repo, đọc `v1-production.md` mục 18–19, và gửi request công khai (GET, cộng 4 POST rỗng tới `/v1/auth/login` không kèm thông tin đăng nhập) tới `desk|staff|g.ottimo.vn`.

### 4.1 Diff `infra/` sau `623a258` và `mail-test.mjs`

| Commit / tệp | Kết luận | Ghi chú |
|---|---|---|
| `65f3681` README 12.1 (S-2) | **Đạt.** S-2 đóng | Câu chữ đã đúng: kiểm terminal chặn được pipe, `>`, `\| tee`, tmux/screen. Riêng `script` chỉ chặn bằng thủ tục |
| `6fde80f` README 12.1: SSH bằng tài khoản quản trị cá nhân, lệnh qua `sudo -u ottimo`, `cd /tmp` | **Đạt** | OPS đã kiểm `sudoers` chỉ có `use_pty`, không `log_output`/iolog, nên mật khẩu tạm in trên pty không bị ghi lại. `sudo` vẫn ghi **dòng lệnh** vào nhật ký hệ thống (tên đăng nhập INV, tên người chạy, địa chỉ nhận thư thử). Các giá trị này không phải bí mật, chấp nhận. Không đưa mật khẩu hay mã nào lên dòng lệnh |
| `6fde80f` nhánh làm lại DB: `dc rm --stop --force api worker web postgres` + xóa 2 volume, thay `dc down` | **Đạt** | Đúng hơn bản cũ: không gỡ nhầm container landing của `ottimo.vn` |
| `6fde80f` `pull-backups.sh`: bỏ `--chmod`, `chmod 700/600` sau khi kéo, dừng khi gặp `openrsync` | **Đạt** | Vẫn `umask 077` trước `rsync`, nên tệp không có lúc nào đọc được rộng hơn 0600. `StrictHostKeyChecking=yes` giữ nguyên. Khóa kéo vẫn bị `rrsync -ro` giới hạn, OPS đã thử không mở được shell. **Suggestion S-3 (OPS, không chặn):** cách chạy trong container `alpine:3.20` đưa khóa kéo vào một container cài gói từ mạng mỗi lần. Ưu tiên `brew install rsync` trên Mac INV. Nếu vẫn dùng container thì ghim digest image |
| `6fde80f` **`infra/server/mail-test.mjs` (mới)** | **Đạt – SEC cho phép OPS gửi thư 8b** tới `info@ottimo.vn` | Xem dưới bảng |

Đọc `mail-test.mjs`:
- **Đường gửi.** Script đi đúng đường của worker: `smtpConfigFromCredentials`, `createSmtpTransport` (TLS ≥ 1.2, bắt buộc STARTTLS), `EMAIL_FROM` của stack, mạng `egress`. Script không nằm trong image, không đặt lại trên máy chủ. Container tạm `--rm --no-deps`, entrypoint `node`, không chạy vòng job của worker.
- **Không lộ gì.** Bí mật đọc qua `resolveFileSecrets` chỉ nằm trong bộ nhớ. Script chỉ in một dòng `verified|sent|failed (<mã>)`. Lỗi đi qua `mapSmtpError`, nên không in chữ của nhà cung cấp hay địa chỉ.
- **Người nhận.** `isEmailAddress` kiểm người nhận, và chỉ gửi đúng một người. Thư không có link, mã, bí mật hay dữ liệu khách.
- **Tiêu đề mới.** SEC **đồng ý** "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email" thay cho mẫu "Security notice". Thư thử mà mang tiêu đề cảnh báo bảo mật sẽ tập cho người nhận coi nhẹ cảnh báo thật. Nội dung đúng brand: tiếng Anh dẫn, tiếng Việt hỗ trợ, màu Ivory/Cream/Ink, Lora + Be Vietnam Pro, không emoji.
- **Đã sửa câu tương ứng ở 3 tệp:**
  - `outputs/OPS/inv-production-steps.md` 8b bước 3 và tóm tắt cuối phần 9;
  - `qc/v1-gate-checklist.md` G4-9 và B2 phần 6;
  - `inv-golive-checklist.md` B2 phần 6.

Điều kiện đạt G4-9:
- script in `mail-test: sent`, **và** thư có trong hộp `info@ottimo.vn` (xem cả Spam);
- thư vào Spam thì ghi lại, rồi kiểm DNS như dưới.

**Kiểm đầu–cuối đường thư bảo mật thật** (outbox → `email-dispatch` → mẫu "Security notice") để ở B2. Khi INV nhập tài khoản nhận VietQR thật trên H05, hệ thống gửi `receiving_account_changed`. INV xác nhận nhận được thư đó. SEC thêm việc này vào SEC-G2 ở B2.

DNS thư (đọc công khai):
- SPF `include:_spf.google.com ~all` và DKIM `google._domainkey` đã có.
- **Chưa có DMARC** (`_dmarc.ottimo.vn` trống).
- **S-4 (INV, v1.0.x, không chặn):** thêm bản ghi TXT `_dmarc` ở chế độ theo dõi (`p=none`, báo cáo về `info@`), sau 2–4 tuần nâng lên `quarantine`. Việc này giúp thư bảo mật ít vào Spam, và khó bị giả mạo tên OTTIMO.

### 4.2 Edge đang chạy (OPS 19.5) – phần còn lại của OPS-01

**Đạt.** OPS so sha256 `edge.sh` + `docker-compose.edge.yml` trên máy chủ với `main`: giống. `nginx.conf` đang chạy giống hệt bản render mới (có `nginx -t`). Giới hạn đúng OPS-01: 100/IP ở cổng 443, 20/IP ở cổng 80, `preread 5s`, `worker_connections 8192`. Container ghim digest, `read_only`, `cap_drop ALL`.
→ **FB-R3-SEC-OPS-01 đóng hẳn** (repo 26/10 chiều + máy chủ 26/10 tối).

### 4.3 SEC-G2 trên production – phần kiểm từ ngoài vào (trước B2)

| Kiểm | desk | staff | g | Kết luận |
|---|---|---|---|---|
| Header bảo mật trang chính, so **nguyên văn** với `infra/caddy/expected-headers.sh` (CSP theo site, HSTS 1 năm + subdomain, Referrer, Permissions, XFO DENY, nosniff, COOP, CORP, `X-Robots-Tag noindex`, Cache-Control theo site; không `Server`/`Via`) | đạt | đạt | đạt | Đạt |
| Phản hồi `/v1/*` (401, 404) | CSP, HSTS, XFO có; body `problem+json` chỉ có mã + `requestId`, không stack, không tên framework, không `X-Powered-By` | – | – | Đạt |
| TLS | 1.3 (h2). 1.0 và 1.1 bị từ chối. Chứng chỉ Let's Encrypt đúng tên, hạn 24/01/2027 | như desk | như desk | Đạt. Gia hạn tự động do Caddy, `ops-check tls` theo dõi |
| HTTP → HTTPS | `308` giữ đường dẫn + query | như desk | như desk | Đạt |
| `www.<app>` | không có bản ghi DNS. Đúng: app không dùng `www` | – | – | Đạt |
| `ottimo.vn` / `www` | `http` → `308 https://ottimo.vn/`; `www` → `301 https://ottimo.vn/`; `/v1/me` trên landing → 404 | – | – | Đạt |
| SNI lạ | kết nối bị đóng | – | – | Đạt |
| `/health`, `/v1/health` | 404 | 404 | 404 | Đạt (FB-R1-SEC-OPS-12) |
| Endpoint test: `/__test__/reset`, `/v1/__test__/clock` | 404 | 404 | 404 | Đạt |
| `/__test__`, `/metrics`, `/docs`, `/api-docs` | 200 = **chính `index.html` của SPA** (so sha). Không có nội dung riêng | như desk | như desk | Đạt (SPA fallback) |
| `/.env`, `/.git/config`, `*.map`, `/v1/openapi.json` | 404 | 404 | 404 | Đạt |
| AAAA (S-1) | không có | không có | không có | Đạt |
| Origin (CSRF) trên `POST /v1/auth/login`, body rỗng, **không** gửi thông tin đăng nhập | `evil.example` → 403 "Origin not allowed"; không Origin → 403; Origin `g.ottimo.vn` gửi sang desk → 403; Origin đúng → 422 `REQUIRED` (chưa kiểm mật khẩu) | – | – | Đạt |

Một ghi chú, không phải lỗi: `/v1/*` không đặt `Cache-Control: no-store` chung. Yêu cầu hiện hành SR-C3-03 chỉ đòi `no-store` cho phản hồi C3, và api đặt riêng ở các phản hồi đó. Phản hồi JSON không có validator nên trình duyệt không lưu theo kiểu heuristic. Đề xuất v1.1 (S-5, ARC/OPS, phòng thủ nhiều lớp): Caddy thêm `Cache-Control: no-store` mặc định cho `/v1/*` khi api không tự đặt.

**Phần SEC-G2 còn lại, làm ở B2** (cần tài khoản thật, SEC chứng kiến, không giữ mã):
1. Cookie phiên sau khi đăng nhập: tiền tố `__Host-`, `Secure`, `HttpOnly`, `SameSite`. Đăng xuất thì cookie mất.
2. `printenv` api/worker: `MFA_ENFORCED=true`. OPS 19.3 đã ghi; SEC xem lại tại buổi.
3. OWN mới đăng nhập lần đầu: buộc đổi mật khẩu, rồi buộc đăng ký 2FA. `audit_event` có `mfa.enrolled`.
4. Log Caddy production: IP che /24, query bị bỏ. OPS đưa 5 dòng log ra màn hình buổi B2, không chép vào repo.
5. Thư `receiving_account_changed` tới hộp thư khi INV nhập tài khoản nhận thật (4.1).
6. Lễ tân không thấy C3 khi chưa step-up. Xem ảnh giấy tờ ghi `c3_access_log`. Phần này cần dữ liệu khách thật đầu tiên, nên làm ở ngày D, không ở B2.

SEC-G1 (BE-53 / FE-07 / S4-39) đã Verified trên mã từ R2. Image production là cùng `2963675` (3.3), nên không phải kiểm lại.

### 4.4 Còn chặn v1.0 phía SEC (cập nhật 3.8)

| Hạng mục | Trạng thái |
|---|---|
| OPS-01 phần máy chủ | **Đóng** (4.2) |
| SEC-G2 phần ngoài vào | **Đạt** (4.3). Phần cần tài khoản: B2 |
| 2FA OWN/MGR thật trên staging + SEC chứng kiến | Mở (B1) |
| 06.33 diễn tập + SEC duyệt | Bản sửa 3 đã xử lý (a)–(g) (OPS 18.1, SEC chưa đọc lại bản lần 3). SEC đọc lại trước B1; duyệt sau diễn tập |
| Ca A.7 #16 đồng hồ giả | Đang làm. Có tệp chưa commit `tests/e2e/ui-clock/mfa-us143-clock.r3s1.spec.ts` trong cây làm việc (của FE-A/QA). SEC đọc khi commit và CI xanh |
| INV nhập tài khoản nhận thật (B2) | Mở |

Thư 8b: **được gửi** (4.1).

---

## 5. Hạn lưu giấy tờ 3 tháng (INV 26/10, decision-log dòng "INV – trả lời 8 câu DOM" (7), (8)) – đánh giá SEC

- Người ghi: SEC | 26/10/2026 (tối) | Theo yêu cầu ORC. SEC **không quyết thay INV**. Mục này nêu tham số làm được gì, cần đổi gì, rủi ro, và câu ORC chuyển INV.
- Căn cứ:
  - biên tham số trong migration `0003`, `0053`, `0057`;
  - `production-defaults.ts`;
  - SR-RET-02;
  - chuỗi `guest.oci.consent`, `reg2.consent_q`, `gw.notice_body` (`design/copy`);
  - `apps/landing-web/src/content/privacy.ts`;
  - decision-log 17/10 (ĐK-2: `consent_record.retention_days`, J16 dùng số nhỏ hơn giữa số ngày khách đã đọc và tham số hiện hành).

### 5.1 Tham số có cho 90 ngày không

| "Loại" INV nói | Khóa | Biên hiện tại (chỉ OWN sửa) | 3 tháng được không | Cần đổi gì | Chặn v1.0? |
|---|---|---|---|---|---|
| Ảnh giấy tờ sau trả phòng (khách **đã đồng ý** lưu, P02b) | `id_image_retention_days_after_checkout` | 0–30 ngày; `production-bootstrap` đặt **1** | **Không**, tối đa 30 | BE: migration nới `max` lên 90 (`config_parameter_def.bounds`), sửa giá trị trong `production-defaults.ts` nếu muốn khởi tạo sẵn. ARC/SEC review. `consent_record.retention_days` đã cho 1–365, guest-web/Desk tự hiện số ngày từ tham số, nên không phải sửa màn | **Không.** Đề xuất: v1.0 chạy với 30 (OWN đặt ở B2), nới lên 90 ở **v1.0.1**. Khách đồng ý lúc còn 30 ngày vẫn chỉ bị giữ 30 ngày (quy tắc số nhỏ hơn), nên tăng sau không trái điều khách đã đọc. Làm migration trước tag `v1.0.0` thì chạm `services/api`, QA-3/SEC phải chạy lại (QC mục 6 quy tắc 2), nên không đáng |
| Khai báo chưa xong (ảnh còn lại khi khai báo chưa `confirmed` sau ngày đi) | `id_image_unconfirmed_max_days` | 1–7 ngày (SR-RET-02), mặc định 7 | **Không**, tối đa 7 | Muốn 90 thì phải sửa yêu cầu SR-RET-02 và migration | **Không.** **SEC đề xuất giữ 7 (mức cao nhất hiện có)**, lý do ở 5.4 |
| Hồ sơ điền sẵn (khách quay lại) | `document_profile_retention_months` | 1–12 tháng, mặc định 12 | **Được** | Không đổi mã. OWN đặt **3** trên màn Tham số ở B2. Mặc định catalogue là 12, nên **nhớ đặt**: thêm vào B2 phần 3 | Không |
| Ảnh của khách **không** đồng ý lưu | – (BR-609) | xóa khi khai báo `confirmed` | Không áp dụng | Không đổi. Hạn 3 tháng chỉ áp cho khách **đồng ý** | – |

Hai điểm khác INV nêu:
- **Trẻ em dưới 16, hạn khai báo "làm đúng luật":** giữ `minor_data_age_threshold = 16` và `registration_deadline_*` như DOM đặt (nhãn PL). Không cần đổi gì phía SEC.
- **Tài khoản nhận cọc chuyển sang tài khoản doanh nghiệp:** OWN đổi trên H05 (R3-Q51): xác thực lại mật khẩu, hiệu lực từ hôm sau, có thư `receiving_account_changed`. Không cần đổi mã. Số tài khoản không đưa vào repo, chat hay tài liệu (Q51-9).

### 5.2 Thông báo xử lý dữ liệu

- **Landing `/privacy/`, `/vi/privacy/`:** chỉ nói về form yêu cầu đặt phòng (đang tắt, ESC-030). Khi khách đặt phòng thì "thông báo cho khách lưu trú" áp dụng. Thông báo này **không nói về giấy tờ**, nên **không phải sửa** vì đổi hạn lưu giấy tờ.
- **Câu đồng ý trong app đã nêu hạn lưu:**
  - guest-web: "I agree OTTIMO may keep photos of my ID until {days} days after check-out, then delete them automatically.";
  - Desk: `reg2.consent_q` "... keeping ID photos for {days} days after check-out?".
  - `{days}` lấy từ tham số, nên khi OWN đổi số, câu tự đổi. Server từ chối khi số khách gửi lệch tham số. Đây đã là cách "một dòng, không nhấn mạnh" mà vẫn đúng NĐ 13/2023: thông báo phải nêu thời gian bắt đầu và kết thúc xử lý.
- **Còn thiếu:** thông báo chung `gw.notice_body` (phiên bản `privacy-2026-10-v1`) chưa nêu hạn của **hồ sơ điền sẵn** và **ảnh khi khai báo chưa xong**. SEC đề xuất thêm **một câu**, viết theo mức trên của mọi tham số (giống cách làm ở landing) để câu luôn đúng dù OWN đặt số nào trong biên:
  - EN: "ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer."
  - VI: "Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn."
  - Câu này đúng với: 1–90 ngày ảnh (sau khi nới), ≤ 7 ngày khai báo chưa xong, 3 tháng hồ sơ (OWN đặt 3). Phần "pháp luật yêu cầu lưu lâu hơn" là bản ghi khai báo lưu trú, chờ luật sư (ESC-001).
  - **Ràng buộc:** OWN không được đặt `document_profile_retention_months` > 3 khi câu này còn hiệu lực.
- **Ai làm, khi nào:**
  - UXD duyệt chữ (brand: ngắn, điềm tĩnh, EN dẫn, VI hỗ trợ);
  - FE-B thêm vào `design/copy`, nâng `NOTICE_TEXT_VERSIONS` lên `privacy-2026-10-v2`;
  - OWN/OPS đặt `privacy_notice_version` mới.
  - Hạn: **trước khách thật đầu tiên dùng check-in online** (ngày D). Không chặn deploy hay tag `v1.0.0`; chặn **ngày chạy với khách thật** nếu chưa có.
  - Tới lúc đó, thông báo v1 vẫn đúng với từng câu đồng ý. Chỉ thiếu ý về hồ sơ điền sẵn.
- **Khách check-in tại quầy (không dùng link):** lễ tân đọc câu `reg2.consent_q` có số ngày. DOM thêm cùng câu trên vào tờ thông báo ở quầy (hướng dẫn 1 trang `staff-one-pager.md`).

### 5.3 Rủi ro tăng thêm và biện pháp bù

| Rủi ro | Mức | Biện pháp đã có | Bù thêm (đề xuất) |
|---|---|---|---|
| Nhiều ảnh giấy tờ nằm trong hệ thống hơn: từ 1 ngày lên 30, rồi 90 ngày, chỉ của khách đồng ý. Với 10 căn và hạn 90 ngày, ước vài trăm bộ ảnh nằm trong hệ thống tại một thời điểm | Low → **Medium** (tăng về lượng, không thêm đường lộ mới) | Ảnh mã hóa bằng DEK riêng, KEK ngoài DB. Chỉ FD/MGR/OWN xem, phải step-up, ghi `c3_access_log`. Không cache ở PWA. Khách không đồng ý thì không lưu | OWN xem `c3_access_log` (số lần xem ảnh theo người) **mỗi tuần** trong tháng đầu. Đây là việc 5 phút trên Desk; DOM đưa vào hướng dẫn |
| Bản sao lưu chứa nhiều ảnh hơn ở mọi thời điểm (giữ 35 ngày; ảnh đã xóa còn trong bản sao lưu tối đa 35 ngày) | Medium | Bản sao lưu mã hóa `age` bằng khóa riêng. Bên trong, ảnh vẫn là bản mã DEK. KEK **không** nằm trong bản sao lưu. Kéo về Mac bằng khóa `rrsync -ro` | **G4-8 phải xong ở B2, trước khách thật:** INV cất bản KEK ngoại tuyến **tách** khỏi khóa giải mã sao lưu (hai nơi khác nhau). Lộ một trong hai thì chưa đọc được ảnh |
| Khôi phục từ sao lưu làm "sống lại" ảnh đã quá hạn | Low | J16 chạy lại sau khôi phục và xóa theo `delete_after` | Biên bản diễn tập khôi phục (G4-7) thêm một dòng: sau khôi phục, chạy J16 một lần, ảnh quá hạn bằng 0 |
| J16 ngừng chạy thì ảnh nằm lại quá hạn | Low | `ops-check` có mục `j16`, báo động theo ESC-029 A | G4-10 (báo động) phải xong trước ngày chạy, như QC đã ghi |
| OWN tự nới tham số mà không đổi thông báo | Low | Tham số chỉ OWN sửa, xác thực lại, có audit. Câu đồng ý tự hiện số mới | Ràng buộc ở 5.2: hồ sơ ≤ 3 tháng; ảnh ≤ 90 ngày sau khi nới biên |
| Pháp lý: lưu ảnh lâu hơn mức cần cho khai báo | Chưa đánh giá được | Chỉ lưu khi khách đồng ý (P02b), có mục đích ghi trong câu đồng ý | ESC-001 (luật sư) vẫn mở. SEC chỉ nói "đã cài biện pháp X, cần xác nhận pháp lý", không nói "tuân thủ" |

### 5.4 Vì sao SEC đề xuất giữ "khai báo chưa xong" ở 7 ngày

Ảnh của khai báo chưa xong là ảnh của người **chưa** đồng ý lưu, hoặc chưa được hỏi. Ảnh này chỉ giữ để lễ tân khai bù. Sau ngày đi, quá hạn khai báo theo luật thì ảnh không còn dùng được cho mục đích đó. Giữ 90 ngày chỉ làm tăng rủi ro mà không có lợi nghiệp vụ, và trái nguyên tắc "chỉ lưu trong thời gian cần cho mục đích". Đổi thì phải sửa yêu cầu SR-RET-02 và mã. SEC không đề xuất.

### 5.5 Câu ORC chuyển INV (dễ hiểu)

> Hệ thống làm được "3 tháng" cho hồ sơ điền sẵn ngay ở B2. Ảnh giấy tờ của khách đồng ý lưu hiện tối đa 30 ngày: đội đề xuất chạy 30 ngày từ ngày đầu và nâng lên 3 tháng ở bản v1.0.1, không ảnh hưởng ngày chạy. Riêng ảnh của khai báo chưa xong, SEC đề xuất giữ tối đa 7 ngày (ảnh này không dùng được nữa sau hạn khai báo), trừ khi anh/chị có lý do nghiệp vụ cần giữ lâu hơn.
>
> Về thông báo cho khách: luật yêu cầu nêu thời hạn lưu, nên app thêm **một câu ngắn** trong thông báo check-in online ("Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng…"), không nhấn mạnh thêm. Lưu lâu hơn thì bản sao lưu chứa nhiều ảnh hơn: anh/chị cần cất khóa giải mã dữ liệu (KEK) ở nơi khác với khóa sao lưu trong buổi B2.

### 5.6 Việc phát sinh

| Việc | Vai | Hạn |
|---|---|---|
| Migration nới `id_image_retention_days_after_checkout` max 30 → 90, test biên. SEC review | BE-C (+ARC) | v1.0.1 |
| Câu thông báo `gw.notice_body` v2 (EN/VI), `NOTICE_TEXT_VERSIONS`, `privacy_notice_version` | UXD, FE-B; SEC duyệt chữ | Trước khách thật đầu tiên dùng check-in online |
| B2 phần 3: OWN đặt `document_profile_retention_months = 3`, `id_image_retention_days_after_checkout = 30`, `id_image_unconfirmed_max_days` theo INV (SEC đề xuất 7) | INV, ORC sửa checklist | B2 |
| Tờ thông báo tại quầy cùng câu 5.2; nhắc OWN xem `c3_access_log` mỗi tuần | DOM, PO | Trước ngày D |
| Biên bản diễn tập khôi phục thêm dòng "J16 sau khôi phục: ảnh quá hạn = 0" | OPS | B2 |
