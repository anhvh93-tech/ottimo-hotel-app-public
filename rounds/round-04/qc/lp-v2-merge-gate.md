# QC gate – gộp `lp-v2-main` vào `main` (Round 4, gói LP-v2)

- Người làm: QC | Ngày 04/11/2026 | Round 4 – gói LP-v2 – Bước **QC (cổng gộp)**
- Đối tượng: `origin/lp-v2-main` @ **`4fe85e19`** (đầu nhánh lúc QC kết thúc, sau BE `4fe85e19` BUG-R4-027 và OPS `aad14baa` BUG-R4-028). Gốc so sánh: `origin/main` @ `c8073c7f`, merge-base `c6cd32a8`.
- Căn cứ: biên bản ARC `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` (nhánh) mục 7–8; QC gate trước `rounds/round-04/qc/lp-v2-gate.md` (M1–M8, P1–P16); `reviews/SEC-on-lp-v2-main.md` (D1–D7, LPV2M-01..05); `reviews/BE-on-lp-v2-main.md`, `reviews/FE-B-on-lp-v2-main.md` (nhánh); `qa/lp-v2-main-qa.md`, `qa/bug-list.md` (BUG-R4-027/028); `outputs/OPS/lp-v2-release-runbook.md` r1.1 (nhánh); decision-log 04/11 (dòng 1141–1174).
- Cách làm: chỉ đọc (`git show`, `git diff origin/main...origin/lp-v2-main`, `git grep`, `gh run view`). Không checkout nhánh, không chạy test, không chạm staging/production, không commit. Không ghi bí mật, IP, digest image đầy đủ hay dữ liệu khách vào tệp này.

---

## 1. Quyết định

**ĐẠT CÓ ĐIỀU KIỆN cho việc gộp `lp-v2-main` → `main`.**

- Mã và tài liệu đủ để gộp: 0 thẻ Blocker/Major còn Open, 0 lỗi P0/P1/P2 mới, QA ĐẠT CÓ ĐK, có runbook với đường quay lui 3 mức. LP-v2 vào `main` ở trạng thái **trơ**: `LANDING_LOCALES=en,vi`, `public_show_prices=false`, Chat giữ mức A.
- Phải đóng **6 điều kiện G1–G6 (mục 3) trước khi bấm gộp**. Quan trọng nhất là G1: CI chạy trên PR phải xanh trên đúng commit đầu. Hiện chưa có lượt CI `pull_request` nào, và lượt `workflow_dispatch` 41761885672 (trên `917a39cf`) còn chạy job `docker images build · E2E smoke`.
- Quyết định này **không** cho phép phát hành production. Phát hành cần qua T1–T2, staging S0–S8, D1–D7 và các mục P còn lại (mục 4–6), rồi **QC phát hành rút gọn** riêng (mục 7).

## 2. Bảng kiểm

### 2.1 Review chéo

| Phần | Người review | Kết quả | Bằng chứng | QC |
|---|---|---|---|---|
| Lắp ráp (ARC: 0092, OpenAPI 0.3.11, 17 xung đột, PR #21) | BE, SEC (đúng ma trận: ARC → BE, SEC) | BE: ĐẠT CÓ ĐK. SEC: ĐẠT CÓ ĐK | `BE-on-lp-v2-main.md` mục 1–2; `SEC-on-lp-v2-main.md` mục 0–1 | Đạt |
| Frontend (landing, privacy, Desk, chuỗi) | FE-B | ĐẠT | `FE-B-on-lp-v2-main.md` mục 1–2 | Đạt |
| Sửa BE `2760744b` (hằng Chat, `isCalendarDate`) và `4fe85e19` (test BUG-R4-027) | QA đã kiểm `2760744b` (có chạy đột biến). **ARC chưa xem** (ma trận BE → ARC + QA). **SEC chưa ghi xác nhận** đóng thẻ LPV2M-01 của mình | Thiếu một phần | `lp-v2-main-qa.md` mục 1; không có tệp review/response nào của ARC/SEC sau `2760744b` | **G3** |
| Sửa OPS `917a39cf` + `aad14baa` (README 12.3/13.5, runbook r1.1) | QA kiểm `917a39cf`. Runbook ghi "**r1.1, chờ ARC + SEC đọc**" (ma trận OPS → ARC, SEC) | Thiếu | Dòng trạng thái đầu runbook | **T1** (trước staging) |
| Sửa FE-B `ef2eb4ef`, `6ce5e444` | QA kiểm. SEC đã chốt nhãn trước khi sửa | Đạt | `lp-v2-main-qa.md` mục 1 | Đạt |

### 2.2 Thẻ Blocker/Major

| Nguồn | Thẻ Major | Trạng thái | QC |
|---|---|---|---|
| `SEC-on-lp-v2-main.md` | LPV2M-01 (cổng Chat neo nhãn không bao giờ đăng) | Sửa ở `2760744b`. QA xác nhận mã đúng. Test chống "so chữ" bổ sung ở `4fe85e19`. Tệp SEC vẫn ghi `Open` và **không có tệp responses** | Mã đạt, thủ tục thiếu → **G3, G4** |
| `BE-on-lp-v2-main.md` | BE-LPV2M-01 (trùng SEC-01) | Done `2760744b` | Đạt |
| Các vòng LP-v2 trước (ARC BE-LPV2-01..04, ARC FE-LPV2-01/05, ARC OPS-LPV2-01, SEC BE-01/FE-01, UXD FE-01..04) | 13 thẻ | Done trong `responses/` hoặc đã được QC gate 01/11 xác nhận (`lp-v2-gate.md` mục 2.1) | Đạt |
| Blocker | – | Không có | Đạt |

Thẻ Minor/Suggestion còn mở, không chặn gộp: ARC-LPV2M-01 (chú thích "0.3.10" → v1.0.4), BE-LPV2M-02 (hủy giá hẹn không xóa bộ đệm, lệch ≤ 60 giây → BE-C v1.0.4), BE-LPV2M-03 (D27, có sẵn từ v1.0.3), SEC-LPV2M-04 (ARC đã sửa biên bản ở `cc045857`, cần ghi Done).

### 2.3 QA

| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| Lỗi P0/P1/P2 mở do LP-v2-main | 0 | `bug-list.md` mục 1; `lp-v2-main-qa.md` mục 0 |
| 6 thẻ sửa đóng đúng | Đạt | `lp-v2-main-qa.md` mục 1 |
| Ca "LP-v2 trơ" (route giá 404, form ko/zh/ru 422, Chat mức A) | 10/10 | mục 2.1 |
| 0092 trên DB 68 dòng giống production; mã v1.0.3 trên DB 69 | 0,38 giây; 217/219 (2 ca đỏ `schema-parity` là đỏ đúng dự kiến) | mục 2.3 |
| Hồi quy v1.0.3 (email bảo mật, BR-428, đăng nhập 2 bước Desk) | Không mất | mục 3 |
| BUG-R4-027, 028 (P3) | **Đã sửa trên nhánh** (`4fe85e19`, `aad14baa`). **QA chưa xác nhận** | `git log origin/lp-v2-main` → **G2** |
| QA đã kiểm commit `917a39cf`. Đầu nhánh `4fe85e19` hơn thêm 3 commit | `55be09d5` chỉ tài liệu. `aad14baa`: chú thích `privacy.ts`, README, runbook. `4fe85e19`: 2 tệp test api + 1 dòng review | `git diff --stat 917a39cf origin/lp-v2-main` → **G2** |

### 2.4 Điều kiện gộp M1–M8 của QC gate 01/11

| # | Trạng thái | Ghi nhận |
|---|---|---|
| M1 gitleaks `main` | **Xong** (PR #19). SEC quét lại `origin/main..lp-v2-main` và toàn bộ cây: sạch | – |
| M2 v1.0.1 lên `main` trước | **Xong, có đổi thứ tự** (QC chấp nhận): v1.0.1 → v1.0.3 đã ở `main`/production. Riêng lượt landing `2026-10-31` (PR #21) **đi cùng `lp-v2-main`**, không lên `main` trước. Hệ quả là P4 đổi nghĩa (mục 6.2). Hệ quả kỹ thuật duy nhất (cổng Chat) đã sửa bằng LPV2M-01 | ORC quyết 04/11, SEC chấp nhận |
| M3 migration số kế tiếp + snapshot sinh lại | **Xong**: 0092, idx 68, `when` = 0091 + 2000. QC tự kiểm: 0091 trùng byte với `main`, 0092 khớp băm biên bản (`b1f16b35…2b41`), journal 69 dòng, migration chỉ **thêm** 2 tệp + 1 dòng journal | mục 2.7 |
| M4 OpenAPI sau changelog trước; privacy en/vi gốc `2026-10-31` | **Xong**, số đổi thành **0.3.11** (0.3.10 đã là của v1.0.3). en/vi trùng từng byte PR #21 (SEC, FE-B, QA cùng kiểm) | – |
| M5, M6 | **Xong** 01/11 | – |
| M7 PR → `main`, CI xanh trên commit gộp cuối | **Còn** → G1 | – |
| M8 thủ tục bug-list + decision-log | **Còn** → G4 | – |

### 2.5 Runbook và quay lui

| Tiêu chí | Kết quả |
|---|---|
| Có runbook riêng cho LP-v2 | Có: `outputs/OPS/lp-v2-release-runbook.md` r1.1. Có ô điền, "Đúng là", "Dừng nếu" cho 0.2, S0–S8, P0–P10, F1–F2, K1–K8 |
| Điều kiện SEC D1–D7 trong runbook | Có: bảng P0, kèm P1–P6 của notice-final. P5/D2 so **giá trị** hằng Chat với nhãn sắp đăng (khối `CHKV`, BUG-R4-028), không grep một chuỗi cố định |
| Quay lui | 3 mức: 5.1 tắt giá (OWN), 5.2 landing về `sha-72f9ac8e2b33` (có mốc 7 ngày và hai lựa chọn), 5.4 app về v1.0.3 `sha-da6d6f3dc22b` (DB 69 / image 68, không lùi DB, QA đã kiểm `deploy.sh --rollback` chấp nhận). Kèm 5.3 đóng form. Không SQL tay, không restore |
| Diễn tập quay lui trước production | Có trong kế hoạch: S7 diễn tập quay landing trên staging. **Chưa** diễn tập 5.4 (app). Phần DB đã được QA chứng minh (v1.0.3 chạy trên DB 69) |
| Giữ `main` yên sau gộp | Có: 0.2. Không gộp gói v1.0.4 nào từ lúc gộp tới khi lượt CI `push` của `⟨SHA_L⟩` `completed success` (ORC quyết 04/11) |
| Review runbook | **Chưa**: "chờ ARC + SEC đọc", 3 câu hỏi Q1–Q3 chưa có trả lời → **T1** |

Kết luận: **runbook đủ cho việc gộp**. Chưa đủ để chạy staging/production khi ARC + SEC chưa đọc (T1).

### 2.6 Rà diff tìm bí mật, dữ liệu cá nhân, IP, digest (`git diff origin/main...origin/lp-v2-main`, chỉ đọc, grep)

Phạm vi: 262 tệp, khoảng 30.000 dòng thêm (đo trên `55be09d5`). Đã đối chiếu lại 6 tệp đổi thêm ở `aad14baa`/`4fe85e19`.

| Mục | Kết quả | QC |
|---|---|---|
| Khóa/token (AWS, GitHub, Slack, Google API, private key, `sk_live`/`pk_live`, mật khẩu gán cứng) | 0 | Đạt |
| URL webhook Google Chat/Slack | 0 | Đạt |
| `.env` / khóa / pem | Chỉ `product/.env.example`, thêm `LANDING_LOCALES=en,vi` cùng chú thích. Không có giá trị bí mật | Đạt |
| IPv4/IPv6 (ngoài loopback, dải riêng, dải tài liệu) | 0 | Đạt |
| Digest image `sha256:` đầy đủ | 0 | Đạt |
| Chuỗi 64 hex | 10 chỗ, đều là **băm tệp**, không phải digest image: 4 ở biên bản ARC (0091 sql/snapshot, 0092 sql/snapshot), 1 ở runbook (`HASH_0092`), 5 ở review FE-B (sha256 5 trang privacy dựng). Quy ước PR30-01 chỉ áp cho digest image. Runbook v1.0.3 trên `main` cũng có băm tệp dạng này. gitleaks CI xanh trên `917a39cf` | Đạt (ghi nhận) |
| Email | `ottimo-admin@desk.ottimo.vn` (user SSH, đã có trên `main` ở runbook v1.0.1/v1.0.2) và địa chỉ mẫu (`name@example.com`, `ten@gmail.com`… trong chuỗi gợi ý của form). Không có email cá nhân | Đạt |
| Số điện thoại | 17 số, đều là số giả trong test (`+849000001xx`, `+84905999xxx`, `+84905123456`), nằm ở 3 tệp test | Đạt |
| Số giấy tờ 12 chữ số | 0 | Đạt |
| Ảnh (71 PNG trong `rounds/round-04/outputs/FE/screenshots/`) | QC xem mẫu 2 ảnh Desk có dữ liệu khách (`lp-v2-fe5-s35-list-1366`, `lp-v2-fe5-guest-quick-create-zalo`): chỉ dữ liệu mock ("QA Zhang Test", SĐT giả `+84 900 000 121`, mã yêu cầu giả). SEC mục 1 #5 đã ghi nhận ảnh chỉ có dữ liệu thử | Đạt (theo mẫu) |

### 2.7 QC tự kiểm mẫu (đọc mã trên `origin/lp-v2-main`)

| # | Kiểm | Kết quả |
|---|---|---|
| 1 | `chat-message.ts`: `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` (dòng 42). Cổng đọc `min(published_at) … WHERE version = $2` (dòng 68). Không còn phép so `consent_version <` | Đạt |
| 2 | `privacy.ts`: `const VERSION = '2026-11-04'` (dòng 60). `aad14baa` chỉ thêm 1 dòng **chú thích** JSDoc ("a new label → set CHAT_DETAILS_MIN_NOTICE_VERSION…"), không đổi chuỗi hiển thị | Đạt. Băm trang dựng lẽ ra không đổi; QA xác nhận ở G2 |
| 3 | BUG-R4-027: `gchat-units` có ca `2026-12-01` đăng trước hằng → A và `2026-11-04.1` đăng, hằng chưa đăng → A. `gchat-notify` có ca tích hợp `2026-11-04.1` 5 ngôn ngữ → A ("string comparison would say C"). BE ghi rằng bản đột biến nay bị bắt (5 ca đỏ) | Có ca đúng ý QA/SEC. Đột biến chưa được người khác chạy lại → G2 |
| 4 | `isCalendarDate` dùng ở `parseEstimateQuery` và form (`arrival`, `departure`) | Đạt |
| 5 | Migration: 0091 trùng byte với `main`. 0092 khớp băm biên bản. Journal 69 dòng, 2 dòng cuối idx 67/68 đúng `when` | Đạt |
| 6 | `ci.yml`: dòng bị xóa duy nhất là tên/chú thích của bước Caddy landing (đổi tên, kiểm thêm route giá), không xóa job hay bước kiểm nào | Đạt |
| 7 | `main` đi trước merge-base 33 commit, **0 tệp** trong `product/` và `.github/`. `git merge-tree` gộp sạch | Đạt (G5 giữ trạng thái này) |
| 8 | PR #21 (`5474b6e1`) còn OPEN và là tổ tiên của nhánh | Ghi nhận cho G6 |

---

## 3. Điều kiện TRƯỚC KHI GỘP (G1–G6) – đóng hết mới bấm gộp

| # | Điều kiện | Ai | Bằng chứng cần có |
|---|---|---|---|
| **G1** (M7, SEC D1 phần trước gộp) | Mở PR `lp-v2-main` → `main`. Lượt CI sự kiện **`pull_request`** chạy trên **đúng commit đầu của PR** phải xanh **mọi job**, gồm `format · lint · audit · test · build` (bộ api đủ, có `pnpm audit`), `gitleaks` (toàn lịch sử), `docker images build · E2E smoke`, landing Playwright, OpenAPI lint, API contract, no test endpoints, infra scripts. Đầu PR đổi thì phải có lượt CI mới. Lượt `workflow_dispatch` không thay được | ORC, OPS | Số run + `headSha` trùng đầu PR, ghi vào decision-log |
| **G2** | QA xác nhận BUG-R4-027 và BUG-R4-028 trên đầu PR: (a) chạy lại 2 đột biến (so chữ trong `effectiveLevel`, `version >= $2` trong SQL), cả hai phải đỏ; (b) đọc runbook r1.1 `CHKV` + README 12.3/13.5; (c) dựng lại `dist-booking-live`: 5 sha256 trang privacy **trùng** 5 băm FE-B ghi (vì `privacy.ts` đổi chú thích); (d) diff `917a39cf..đầu PR` chỉ gồm các tệp đã biết (test gchat, chú thích `privacy.ts`, README, runbook, review). Chuyển 027/028 sang Closed | QA | Mục bổ sung trong `qa/lp-v2-main-qa.md` + `bug-list.md` |
| **G3** | (a) **SEC** ghi xác nhận đóng LPV2M-01, 02, 03 (05 tùy SEC) và xem ca test BUG-R4-027 có đúng ý ★2 không (bug-list ghi "SEC xem"). (b) **ARC** đọc nhanh mã BE `2760744b` (hằng + `isCalendarDate` trên route công khai) và `4fe85e19`, vì ma trận đòi BE → ARC + QA và mới có QA | SEC, ARC | Một dòng hoặc một thẻ trong `reviews/SEC-on-lp-v2-main.md` / tệp review ARC. Không cần review mới đầy đủ |
| **G4** (M8) | Thủ tục: (a) `responses/` ghi trạng thái các thẻ LPV2M (BE, FE-B, OPS, ARC; gồm SEC-04 Done). Hiện **không có** dòng response nào cho LPV2M-01..05. (b) `bug-list.md`: 027/028 Closed (sau G2); 011/012 "đã vào `main`, chờ P10". (c) decision-log: dòng QC này + ghi đổi thứ tự M2/P4 | BE, FE-B, OPS, ARC, QA, ORC | Các tệp trên ở commit tài liệu |
| **G5** (QA ĐK2) | Từ giờ tới lúc gộp, `main` không có commit nào đụng `product/` hoặc `.github/`. Nếu có: rebase/gộp lại, QA chạy lại mục 2–3 của báo cáo QA, CI PR chạy lại (G1) | ORC, QA | `git diff --stat c6cd32a8 origin/main -- product .github` rỗng lúc gộp |
| **G6** | Gộp bằng **merge commit** (không squash/rebase), để giữ lịch sử PR #21 (`5474b6e1`) và các nhánh `v104/*` đang cắt từ `lp-v2-main`, và để 0.2 runbook lấy đúng `mergeCommit`. Ngay sau gộp làm đúng runbook 0.2 (`main` đứng yên tới khi lượt CI `push` của `⟨SHA_L⟩` `completed success`). Đóng PR #21 kèm ghi chú nếu GitHub không tự đánh dấu | ORC | `⟨SHA_L⟩` trong runbook 0.1 |

Ghi chú về quyền gộp: INV đã đồng ý trước việc gộp/staging/Release LP-v2 (decision-log 04/11 "INV – đồng ý trước toàn bộ"), với điều kiện có đủ review, QA, QC. Gate này là phần QC của điều kiện đó.

## 4. Sau gộp, TRƯỚC staging (T1–T2)

| # | Điều kiện | Ai | Hạn |
|---|---|---|---|
| **T1** | ARC + SEC đọc runbook r1.1 (gồm khối `CHKV`), trả lời Q1–Q3 (mục 9). OPS ra r2 nếu có sửa | ARC, SEC, OPS | Trước 0.2 bước 5 (duyệt `deploy staging` của `⟨CI_RUN_L⟩`) |
| **T2** | 0.2 bước 3 ra đủ: job xanh, digest rút gọn đủ 3 dòng, băm 0092 = `HASH_0092`, `CHKV` → `D2_CHAT_CONST=CO` | ORC | Trước 0.2 bước 5 |

## 5. Staging S0–S8 (theo runbook mục 3)

Bắt buộc đủ trước production. QA/ORC ghi biên bản trong `rounds/round-04/qa/`, không dùng dữ liệu thật.

| # | Việc | QC cần thấy |
|---|---|---|
| S0 | Đọc trạng thái staging (migration, các dòng thông báo) | Không có dòng `2026-11-04` khác byte |
| S1 | Làm mới gói `infra/` staging từ `⟨SHA_L⟩` | `CAU HINH: OK` |
| S2 | Deploy app staging (0092) | 69 migration, có các dòng của 0092 |
| S3 | Landing `⟨TAG_L⟩` lên staging, `LANDING_PUBLIC_API=on` | `privacy:` 5 ngôn ngữ `2026-11-04 (not published yet)` |
| S4 | Đăng thông báo trên staging (chạy thử rồi `--apply`) | 5 băm **trùng** 5 băm FE-B |
| S5 | `LANDING_LOCALES=en,vi,ko,zh,ru` + deploy lại | `form-token` 200 |
| S6 | **D5/C8**: 12 ca SEC 9.5 + BE-01 qua **Caddy thật**, gồm ca 6 (IP qua `TRUST_PROXY`). P9: Lighthouse 5 ngôn ngữ. P10: smoke BUG-R4-011/012, form 5 ngôn ngữ, 13 ca giá | 0 ca đỏ. **Ca 6 đỏ thì dừng cả đợt** |
| S7 | Diễn tập quay landing (5.2) rồi lên lại | `WARNING: older…` lúc lùi, `same bytes as published` lúc lên |
| S8 | `ops-check.sh` đầy đủ | Như K7 (`priceswitch` FAIL một lượt vì S6 là đúng) |

## 6. TRƯỚC production

### 6.1 SEC D1–D7

| # | Điều kiện | Trạng thái lúc QC |
|---|---|---|
| D1 | LPV2M-01/02/03 Done + CI PR xanh trên đúng đầu nhánh, gồm `pnpm audit` và gitleaks lịch sử | Mã xong. Còn G1, G3, G4 |
| D2 / P5 | Api chạy trên production có hằng Chat **= nhãn sẽ đăng** (`CHKV` ở 0.2, P4, P10 bước 0) | Mã đúng (`2026-11-04`). Kiểm lại trên tag |
| D3 | P2 (`retention.web_request_ip_hmac_days` ≤ 30), P3 (thành viên phòng Chat chỉ OWN/MGR/FDL/FD), P4 (sổ tay WR8 + lịch xóa phòng Chat hằng năm) đúng **tại ngày đăng** | Chưa (OPS đọc số, INV xác nhận, BA chỉ mục sổ tay) |
| D4 | Thứ tự trong một phiên: api 0092 → landing → đăng thông báo → `LANDING_LOCALES` → `form-token` 200 | Runbook P6 → P10 → F1 → K5 |
| D5 | C8 trên staging qua Caddy thật | = S6 |
| D6 | `public_show_prices` giữ `false` tới khi OWN bật; `priceswitch` đã lấy mốc | Runbook P2b, K2, K7, F2 |
| D7 | Mức Chat C chỉ sau khi `2026-11-04` đã đăng **và** SEC xác nhận ★1–★8 | Ngoài đợt này; K8 xác nhận vẫn mức A |

### 6.2 Các mục P của QC gate 01/11, cập nhật

| # | Trạng thái | Còn phải làm trước production |
|---|---|---|
| P1 người bản xứ | **Bỏ**: INV quyết 04/11, chấp nhận rủi ro RR-NS | – |
| P2 luật sư | **Đạt**: INV 04/11 | – |
| P3 nhãn thật | **Đạt**: `2026-11-04` (SEC chốt, FE-B đổi) | Giữ quy tắc: đổi chữ thì đổi nhãn **và** đổi hằng Chat, rồi Release api trước P10 |
| P4 | **Đổi nghĩa** (QC chấp nhận theo SEC): không đăng `2026-10-31` riêng. LP-v2 thay thẳng `2026-10-24` | = D2/P5 |
| P5 | INV duyệt chữ khối giá EN/VI; CPY + UXD quét chuỗi cấm trên bản dịch cuối. **QC chưa thấy bằng chứng** trong decision-log | Có bằng chứng trước QC phát hành |
| P6 | OWN chuyển Desk sang bảng giá mới (DOM `inv-price-switch-guide.md` 01/11). **QC chưa thấy dòng xác nhận đã chuyển + 4 báo giá thử** | Bằng chứng trước **F2** (bật giá). Không chặn landing/thông báo |
| P7 | **Đạt**: ESC-045 câu 1 = A (01/11). Kiểm `weekend_uplift_pct`/`special_uplift_pct` = 0 cùng P6 | Cùng P6 |
| P8 | Kiểm `public_room_type` production, chỉ đọc | Trước F2 |
| P9, P10 | = S6 | – |
| P11 | Chạy lại kiểm hiển thị nếu chữ đổi | Chỉ khi chữ đổi |
| P12 | UXD xem ảnh `lp-v2-fe5-*`, bảng S35 ở 1366. **QC chưa thấy xác nhận** | Trước QC phát hành |
| P13 | = D4 + runbook (giá bật cuối cùng) | – |
| P14 | Gộp với D7 (bộ dò chung `sensitive-number.ts` của `main` đã vào nhánh – SEC mục 1 #5) | Theo D7 |
| P15 | Đã xử lý qua gộp (ARC mục 2 #11–12 lấy bản LP-v2 của test plural, chung bảng ca) | QC phát hành xác nhận một dòng: không còn hai bản câu báo giá |
| P16 | INV đã đồng ý trước (04/11). ORC duyệt Release sau khi QC phát hành ĐẠT | – |

## 7. QC phát hành rút gọn (riêng, sau staging)

QC sẽ kiểm, và chỉ ĐẠT khi đủ:
1. `⟨SHA_L⟩` thuộc `main`. Lượt CI `push` của `⟨SHA_L⟩` `completed success`. Image staging = image sẽ Release (cùng `⟨CI_RUN_L⟩`).
2. G1–G6 và T1–T2 có bằng chứng.
3. Biên bản S0–S8 đủ, 0 ca đỏ (S6 ca 6 bắt buộc), 5 băm S4 = FE-B.
4. D1–D3 có bằng chứng tại ngày đăng. P5, P12 có xác nhận. P6–P8 có bằng chứng trước F2 (nếu chưa có thì phát hành được nhưng **không** bật giá).
5. Không có thẻ Blocker/Major mới mở, không có P0/P1.

Thiếu bất kỳ mục nào thì KHÔNG ĐẠT phát hành.

## 8. Hạng mục còn trượt và vai chịu trách nhiệm

| Hạng mục | Vai | Hạn |
|---|---|---|
| CI PR xanh trên đầu nhánh (G1) | ORC mở PR, OPS theo dõi | Trước gộp |
| Xác nhận 027/028 + băm 5 trang (G2) | QA | Trước gộp |
| SEC đóng LPV2M-01..03; ARC xem `2760744b`/`4fe85e19` (G3) | SEC, ARC | Trước gộp |
| Responses + bug-list + decision-log (G4) | BE, FE-B, OPS, ARC, QA, ORC | Trước gộp (cùng commit tài liệu) |
| ARC + SEC đọc runbook r1.1 (T1) | ARC, SEC | Trước duyệt deploy staging |
| ARC-LPV2M-01, BE-LPV2M-02, BE-LPV2M-03, SEC-LPV2M-05 phần `assertLocalDate` | FE-A/BE/BE-C/ARC | v1.0.4 |
| P5, P6, P12 bằng chứng | INV/CPY/UXD, OWN/DOM, UXD | Trước QC phát hành (P6 trước F2) |

## 9. Rủi ro chủ đầu tư cần biết

1. **Gộp đưa mã LP-v2 phía máy chủ và Desk vào mọi bản production sau này** (kể cả v1.0.4). Khách chưa thấy gì khác vì giá tắt và chỉ mở en/vi. Đường lui đã được kiểm: app v1.0.3 chạy được trên DB đã có 0092.
2. **Trong lúc chờ CI của commit gộp, không gộp được gói v1.0.4 nào** (0.2 runbook). Nhiều nhánh `v104/*` đang cắt từ `lp-v2-main` cũ, sẽ phải rebase sau gộp. Nên gộp sớm, ngoài giờ đội đang đẩy nhiều nhánh.
3. **Mức chi tiết C cho tin Google Chat chỉ có hiệu lực sau khi thông báo `2026-11-04` đã đăng.** Nếu đổi bất kỳ câu nào của thông báo trước khi đăng, nhãn sẽ đổi. Khi đó phải phát hành lại api với hằng mới, nếu không Chat giữ mức A mãi. Runbook đã có bước tự chặn (`CHKV`).
4. **Bản ko/zh/ru chưa có người bản xứ đọc.** INV đã chấp nhận rủi ro này. Nếu sau này sửa chữ theo phản hồi của khách thì dùng nhãn mới, không sửa tại chỗ.
5. **Giá công khai lấy thẳng từ Desk.** Bật giá (F2) chỉ sau khi có bằng chứng OWN đã nhập bảng giá mới (P6–P8).

## 10. QC không kiểm được

- Không tự chạy test, CI, đột biến hay bản dựng. Kết quả số lấy từ ARC/BE/FE-B/QA và CI. QC chỉ đọc mã để kiểm mẫu (mục 2.7).
- Job `docker images build · E2E smoke`: chưa có kết quả trên commit nào của nhánh sau `bfad4f2c`. Run 41751815430 trên `bfad4f2c` xanh toàn bộ. Run 41761885672 trên `917a39cf` còn chạy lúc QC kết thúc.
- Không chạy gitleaks tại máy. Dựa vào SEC (lịch sử + cây trên `bfad4f2c`), CI `917a39cf` và grep diff (mục 2.6). 3 commit sau `917a39cf` chưa qua gitleaks; grep của QC không thấy gì.
- Ảnh: xem mẫu 2/71 ảnh. Còn lại dựa vào SEC.
- Mọi thứ trên staging/production, chất lượng bản dịch ko/zh/ru, nội dung image.

## 11. Dòng decision-log đề xuất (ORC ghi)

| 2026-11-04 | 4 | **QC – cổng gộp `lp-v2-main` → `main` (@ 4fe85e19): ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/lp-v2-merge-gate.md`). Review đủ ARC (lắp ráp) ← BE, SEC; FE-B ĐẠT; QA ĐẠT CÓ ĐK; 0 Blocker/Major Open (SEC LPV2M-01 sửa 2760744b, test chống so chữ 4fe85e19); M1–M6 xong, **M2 đổi thứ tự** (PR #21 đi cùng lp-v2-main) và P4 đổi nghĩa được chấp nhận; diff sạch bí mật/IP/digest image/PII (10 chuỗi 64 hex là băm tệp). Trước gộp: G1 CI `pull_request` xanh mọi job trên đúng đầu PR; G2 QA xác nhận BUG-R4-027/028 + 5 băm trang privacy không đổi; G3 SEC đóng LPV2M-01..03, ARC xem 2760744b/4fe85e19; G4 responses + bug-list + decision-log; G5 main không đổi product/.github; G6 gộp bằng merge commit rồi theo runbook 0.2. Trước staging: T1 ARC + SEC đọc runbook r1.1. Production: S0–S8, D1–D7, P5/P6/P8/P12 có bằng chứng (P6–P8 trước F2), rồi QC phát hành rút gọn riêng | QC | Quyền QC (cổng chất lượng) |

## 12. Báo cáo QC

- **Đã làm:** đọc 7 tài liệu căn cứ và QC gate 01/11; kiểm review chéo theo ma trận; rà trạng thái thẻ Blocker/Major trong mọi tệp review LP-v2 và `responses/`; kiểm CI qua `gh run` (chỉ đọc); grep diff tìm khóa, webhook, IP, digest, email, SĐT, số giấy tờ, tệp `.env`; xem mẫu 2 ảnh; đọc mã kiểm mẫu 8 điểm; kiểm `main` đi trước nhánh bao nhiêu và `merge-tree`.
- **Tệp tạo:** `rounds/round-04/qc/lp-v2-merge-gate.md` (tệp này). Không sửa tệp nào khác, không commit.
- **Giả định:** (1) Đầu PR sẽ là `4fe85e19` hoặc một commit sau đó chỉ gồm tài liệu G4. Nếu có thêm mã thì G1 và G2 áp lại cho commit mới. (2) Chú thích JSDoc trong `privacy.ts` không đi vào HTML dựng. QA kiểm bằng băm ở G2(c). (3) Phê duyệt trước của INV 04/11 bao gồm việc gộp này, nên **không tạo ESC**.
- **Việc chưa xong (không thuộc QC):** G1–G6, T1–T2, S0–S8, D1–D7, QC phát hành.
