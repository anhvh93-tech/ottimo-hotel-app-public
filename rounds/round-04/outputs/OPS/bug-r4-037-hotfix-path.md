# BUG-R4-037 (P0) – Đánh giá 2 đường phát hành bản sửa

Soạn: OPS · 04/11/2026 khuya · Round 4, HOTFIX P0, bước **Lập kế hoạch**. Chỉ là kế hoạch: OPS không deploy, không duyệt job nào. Tệp này chưa commit.
Căn cứ: `rounds/round-04/qa/bug-list-v1.0.4.md` (BUG-R4-037), `.github/workflows/ci.yml` và `release.yml` (trên `origin/main` @ `4bf353da`), `product/infra/docker/Dockerfile.web`, `product/infra/server/bin/deploy.sh` và `deploy-from-ci.sh`, `rounds/round-04/plan-v1.0.4.md` mục 2.1 ý 5 và 7.5, runbook v1.0.3 r3.2 / v1.0.4 r1 / LP-v2 r2.2, decision-log 04/11 (SHA_L `7224e8fd`, CI 41767881676, deploy staging chưa duyệt).

## 0. Kết luận

**Chọn A** (bản sửa đi cùng v1.0.4, production chiều 08/11). Từ 05/11 áp ngay biện pháp tạm ở mục 4: quy trình quầy và đếm/sửa đơn hằng ngày. Không cần deploy.

1. Đường ống hiện tại chỉ phát hành commit **nằm trên `main`**: ảnh chỉ được build khi push `main`, `release.yml` đòi tag nằm trên `main`, environment staging chỉ nhận `main`. Muốn đi B thì phải nới cổng CI/Release (đường dẫn SEC) và thêm một lượt production, đúng lúc SEC đang review các PR của v1.0.4.
2. B chỉ sớm hơn A khoảng 3 ngày, và phần lợi đó **không giữ được**: lượt app LP-v2 (`7224e8fd`, chưa có bản sửa) lên production giữa hai mốc sẽ mang lỗi trở lại, trừ khi cắt lại LP-v2 ngoài `main` lần nữa. Thêm vào đó, LP-v2 staging bị lùi khoảng 3–4 giờ.
3. Tiền sai có thể chặn ngay bằng quy trình quầy, kèm đếm đơn dính lỗi mỗi ngày để DOM sửa trên Desk. Bản sửa đi qua `main` với đủ QA lượt 1, QA lượt 2 và QC, không thêm rủi ro phát hành.

Nếu ORC vẫn cần bản sửa lên production trước 08/11, cách rẻ nhất là **B′** (mục 3.7): gắn bản sửa vào lượt app LP-v2. Không nên tạo một v1.0.3.1 riêng.

## 1. Sự kiện quyết định

| Điểm | Thực tế trong repo |
|---|---|
| Ảnh build ở đâu | `ci.yml` chỉ chạy `on.push` cho `main`/`master`. Job `publish-images` chỉ chạy khi `github.ref == refs/heads/main`. Nhánh `hotfix/*` không có lượt push CI nào nên không có ảnh trên GHCR |
| Release production | `release.yml` `resolve`: `git merge-base --is-ancestor $GITHUB_SHA origin/main`. Commit tag không nằm trên `main` thì bị từ chối. Kèm điều kiện có lượt CI push xanh và artifact `image-digests` của chính commit đó. Đây là cổng SEC FB-R3-SEC-OPS-02 |
| Deploy staging | Job `deploy-staging` chỉ chạy cho `refs/heads/main`. Environment `staging` cũng chỉ cho nhánh `main` (`v1-production.md` dòng 44) |
| Tên tag | `v1.0.3.1` vẫn khớp mẫu `v[0-9]*.[0-9]*.[0-9]*` của `release.yml` (ký tự `*` nhận cả dấu chấm). Environment `production` nhận tag `v*` |
| Bản sửa có cherry-pick được không | `BookingDialog.tsx` từ `v1.0.3` tới `main` chỉ khác 3 dòng (LP-v2 `0a25716a`). `s2-fix.test.tsx`, `booking.test.tsx` không đổi. Cherry-pick lên `v1.0.3` và lên `7224e8fd` gần như chắc sạch |
| DB | Bản sửa chỉ ở admin-web, không có migration. Production v1.0.3 = DB 68 |
| Lỗi có trên những bản nào | Từ `cf6c5575` (16/10): v1.0.1, v1.0.2, v1.0.3 **và SHA_L `7224e8fd`** (bản app LP-v2 sẽ lên production) |

## 2. Đường A – đi cùng v1.0.4

| Bước | Khi nào | Ghi chú |
|---|---|---|
| FE gộp bản sửa và test vào `main` | trước khi cắt 06/11 18:00 (nên xong 05/11) | Test A-20, US-139 chạy dưới tải phải xanh. Thêm test "đổi kênh thì xóa giá do bản xem điền" (QA) |
| Cắt v1.0.4 | 06/11 18:00 | Không đổi |
| Staging + QA lượt 2 | 06/11 tối, 07/11 | QA thêm 4 bước tái hiện của BUG-R4-037 trên stack thật (OTA đổi căn, OTA đổi ngày, Nội bộ), kiểm thân `POST /reservations` |
| QC rút gọn | 08/11 09:00 | BUG-R4-037 là điều kiện "trước Release" |
| Production | 08/11 chiều | Runbook v1.0.4 thêm 1 dòng K6: QA mở H09 trên production, đổi kênh, ô giá trống. Chỉ xem, không tạo đơn |

Việc thêm cho OPS: 1 dòng K6 trong runbook v1.0.4 (khoảng 15 phút). Lịch LP-v2 và v1.0.4 không đổi. Rủi ro còn lại: production sai tiền tới chiều 08/11 (khoảng 3,5 ngày nữa), và lượt app LP-v2 (nếu lên trước) vẫn mang lỗi. Cả hai được giảm bằng mục 4.

## 3. Đường B – hotfix v1.0.3.1

### 3.1 Phải làm gì để đường ống chạy được

Mọi thay đổi nằm **trên nhánh hotfix**, không trên `main`. Lượt push và lượt tag dùng tệp workflow trong cây của chính commit đó.

1. `hotfix/v1.0.3.1` cắt từ tag `v1.0.3` (`da6d6f3d`), cherry-pick commit sửa của FE **sau khi** commit đó đã vào `main`. So `git patch-id` giữa hai commit: phải giống nhau.
2. Trên nhánh hotfix, sửa `ci.yml` (đường dẫn SEC):
   - `on.push.branches` thêm đúng `hotfix/v1.0.3.1`;
   - `publish-images.if` nhận cả ref đó.
   - `deploy-staging` giữ nguyên chỉ cho `main`.
3. Sửa `release.yml` (đường dẫn SEC): `resolve` nhận commit nằm trên `main` **hoặc** đúng nhánh `hotfix/v1.0.3.1`, và tìm lượt CI push xanh trên nhánh đó.
4. SEC review diff của bước 2 và 3 trên nhánh hotfix. Lý do: đây là nới cổng "production chỉ chạy đúng thứ `main` đã build" (FB-R3-SEC-OPS-02). Sau hotfix, nhánh để yên, không gộp, nên cổng trên `main` không đổi.
5. Staging: environment `staging` chỉ nhận `main`, nên ORC deploy staging bằng SSH quản trị (`deploy.sh sha-<hotfix>` trên `/opt/ottimo`), **không** sửa cài đặt repo. Sửa cài đặt là việc của chủ tài khoản, cần INV.

Ước lượng: OPS 2–3 giờ (workflow + runbook), SEC 1–2 giờ review, CI nhánh hotfix khoảng 40 phút (build-test lần đầu không có cache khoảng 15 phút, docker build + E2E khoảng 17 phút, publish khoảng 10 phút).

### 3.2 Chỉ build lại image admin-web được không

**Không**, nếu không sửa thêm các đường dẫn SEC:
- Không có image riêng cho admin-web. `Dockerfile.web` build `--filter=./apps/*` thành **một** image web gồm admin-web, mobile và guest-web.
- `deploy.sh` dùng **một** `IMAGE_TAG` cho cả api, worker và web. Production đòi `--api-digest` và `--web-digest` của cùng một lượt CI. `deploy-from-ci.sh` chỉ nhận lệnh `deploy sha-… api=… web=…`.
- Hotfix vì vậy build lại **cả** api và web từ cây v1.0.3 + bản sửa. Mã api, mobile và guest-web giống hệt v1.0.3, ảnh nền ghim digest, lockfile như cũ. Digest mới nhưng hành vi như cũ, và smoke + E2E của docker-build vẫn chạy.
- Muốn thay riêng web thì phải sửa `docker-compose.prod.yml`, `deploy.sh`, `deploy-from-ci.sh` và `release.yml`, tức 4 đường dẫn SEC. Không đáng làm cho một hotfix.

### 3.3 Khung giờ staging

| Khung | Có dùng được không | Giá phải trả |
|---|---|---|
| 05/11 trước khoảng 10:00 | Không | Staging giữ v1.0.3 cho BR-428-02 (06:07–10:00, plan 7.5: không deploy trước 10:00). Ảnh hotfix cũng chưa có |
| **05/11 khoảng 10:00–13:30**, sau BR-428-02 và trước khi duyệt deploy staging của SHA_L | **Có, là khung duy nhất có lợi** | Deploy khoảng 5 phút; QA rút gọn khoảng 1,5–2 giờ (4 bước BUG-R4-037 + A-20/US-139 + `smoke-prod`); QC rút gọn khoảng 45 phút. **LP-v2 S0–S8 lùi khoảng 3,5 giờ**, kéo theo QC và production LP-v2. v1.0.4 không bị ảnh hưởng. Điều kiện: bản sửa FE đã vào `main`, SEC duyệt workflow, CI hotfix xanh, tất cả trước 10:00 |
| 06/11 ban ngày, sau QC LP-v2 và trước v1.0.4 lúc 19:00 | Được về kỹ thuật (v1.0.3 chạy được trên DB 69) | Chỉ sớm hơn A khoảng 2 ngày, chen giữa LP-v2 production và lúc cắt v1.0.4. Không đáng |

### 3.4 Runbook, sao lưu, quay lui

- **Runbook mới** `v1.0.3.1-release-runbook.md` (OPS, khoảng 1 giờ, khuôn v1.0.3 r3.2):
  - P0: QA và QC rút gọn ĐẠT; SEC ĐẠT diff workflow.
  - P1: `git diff --name-only v1.0.3 <hotfix>` chỉ ra tệp admin-web, test và 2 workflow. Có tệp `product/infra` thì **dừng**. Không cần P2b, vì gói `infra/` production giữ nguyên.
  - P2 `ops-check` chỉ đọc. P3 sao lưu. P4 tag `v1.0.3.1`. P5 `resolve` → duyệt.
  - K1: image, digest, `current_tag`, `previous` = `sha-da6d6f3dc22b`. K2: DB vẫn 68.
  - K6: `smoke-prod` + QA mở H09, đổi kênh, ô trống (không tạo đơn). K7: log 15 phút. Gián đoạn Desk 15–30 giây.
- **Sao lưu:** vẫn chạy `backup.sh` + kiểm như mọi lượt Release (khoảng 5 phút), dù không có migration.
- **Quay lui:** `rollback.sh sha-da6d6f3dc22b`. Chỉ đổi image, digest đọc từ `state/digests` của lượt 04/11, DB không đổi. Khoảng 2 phút.
- **Phải sửa thêm (OPS, khoảng 1 giờ):**
  - runbook v1.0.4: 0.1 "Bản quay lui" và R1 đổi sang tag hotfix (G4); P1 so từ `v1.0.3.1`; diễn tập 5.0 quay về tag hotfix;
  - runbook LP-v2: "Production lúc soạn", 5.4 quay lui app, `previous`.

### 3.5 Rủi ro trùng phiên bản

1. **Lỗi quay lại qua LP-v2 (nặng nhất).** Lượt app LP-v2 là `v1.0.4-lp.1` trên `7224e8fd`, chưa có bản sửa. Nếu nó lên production sau v1.0.3.1 thì BUG-R4-037 trở lại tới 08/11. Có 3 cách tránh, cách nào cũng tốn:
   - cắt lại app LP-v2 = `7224e8fd` + bản sửa (thêm một nhánh ngoài `main`, ghim lại runbook LP-v2 0.1/0.2, QC LP-v2 xem phần thêm);
   - cho app LP-v2 đi cùng v1.0.4 ("đường phụ" 1.2 của runbook LP-v2), tức LP-v2 production lùi tới sau 08/11;
   - chấp nhận lỗi quay lại.
2. **Hai bản sửa lệch nhau.** Bản trên `main` (vào v1.0.4) và bản cherry-pick (v1.0.3.1) phải cùng `patch-id`. Lệch nhau thì QA lượt 2 v1.0.4 phải kiểm H09 lại từ đầu.
3. **Đích quay lui đổi.** v1.0.4 và LP-v2 quay về v1.0.3.1 chứ không về `sha-da6d6f3dc22b`. Diễn tập 5.0 phải dùng tag hotfix. Ghi sai đích là quay lui về bản còn lỗi.
4. **Tên tag.** `v1.0.3.1` không đúng semver, nhưng chỉ là tên: image mang tag `sha-…`, và `release.yml` nhận mẫu này. Nhánh `hotfix/v1.0.3.1` để yên sau phát hành, không gộp vào `main`: trên đó có workflow đã nới, gộp vào sẽ mở cổng trên `main`.
5. **Tải SEC và QA.** Thêm một lượt review workflow và một lượt QA/QC, đúng lúc đang review PR của v1.0.4 trước khi cắt 06/11.

### 3.6 Giờ production sớm nhất (B)

- **05/11 khoảng 14:00–15:00**, chỉ khi đủ cả 4 điều kiện trước 10:00: bản sửa FE đã review và vào `main`; SEC ĐẠT diff workflow; CI nhánh hotfix xanh; ORC giữ staging cho khung 3.3.
- Thực tế hơn: **05/11 khoảng 20:00–21:00**, ngoài giờ nhận phòng, có INV cho K8.
- Trễ bất kỳ điều kiện nào thì khung 3.3 mất, và B gần như không còn sớm hơn A.

### 3.7 B′ – gắn bản sửa vào lượt app LP-v2 (nếu ORC cần sớm hơn 08/11)

- App LP-v2 = `7224e8fd` + cherry-pick bản sửa (`hotfix/lp-v2-app`). LP-v2 staging **chưa chạy** (deploy staging của SHA_L còn chờ), nên S0–S8 chạy luôn trên commit mới và QA thêm 4 bước BUG-R4-037 vào S-phase.
- Một lượt production thay vì hai. Không trùng phiên bản (v1.0.4 và LP-v2 đều có bản sửa). Đích quay lui của v1.0.4 không đổi so với kế hoạch LP-v2.
- Vẫn cần mục 3.1 (bước 2–4, SEC) cho nhánh này. Vẫn phải ghim lại `⟨SHA_L⟩`/`⟨TAG_L⟩` ở runbook LP-v2. QC LP-v2 cần xem phần thêm (một commit admin-web).
- Thời điểm: bản sửa lên production cùng LP-v2, sớm hơn A khoảng 2–3 ngày, tùy lịch LP-v2.

## 4. Biện pháp tạm, áp ngay cho cả A và B (không deploy)

1. **Quy trình quầy** (DOM soạn câu, ORC chuyển INV/lễ tân trong 05/11). Khi đặt OTA hoặc Nội bộ ở **Đặt phòng mới**:
   - sau khi chọn kênh, **xóa trống mọi ô giá mỗi đêm**. Khi đó máy chủ lấy giá lịch OTA, hoặc ghi 0 đ cho Nội bộ;
   - hoặc nhập đúng giá OTA vào **mọi** ô.
   - Không để ô nào còn số tự điền.
   - Cơ chế (OPS đã đọc mã, DOM xác nhận câu chữ): ở OTA/Nội bộ, khi có ô trống thì `BookingDialog.tsx` `body()` **không gửi** `nightlyRates`. Lúc đó `pricing.service.ts` (khoảng dòng 321–354) lấy giá lịch OTA, chia đều số tiền OTA nếu có nhập, hoặc ghi 0 đ cho Nội bộ. Ở OTA, nếu ô thì trống ô thì có số, form báo lỗi và không cho tạo.
2. **Đếm hằng ngày tới khi có v1.0.4** (BE viết câu READ ONLY, OPS chạy bằng vai `ottimo_readonly`, chỉ ra con số và mã đơn):
   - đối tượng: đơn OTA hoặc Nội bộ tạo qua Desk từ 16/10, có giá đêm `edited=false` mang số của bản xem giá Trực tiếp;
   - DOM sửa từng đơn trên Desk (không SQL tay); đơn OTA trả tại khách sạn ưu tiên trước khi khách trả phòng.
   - Lượt đếm đầu cũng cho biết thiệt hại thật từ 16/10.
3. Tiêu chí thoát: v1.0.4 lên production, K6 đạt, lượt đếm sau Release bằng 0 đơn mới.

## 5. Việc của OPS theo từng đường

| Đường | Việc | Thời gian |
|---|---|---|
| A | 1 dòng K6 trong runbook v1.0.4. Chạy lượt đếm mục 4.2 mỗi sáng khi BE đưa câu | khoảng 15 phút + 10 phút/ngày |
| B | Workflow trên nhánh hotfix (3.1), runbook v1.0.3.1 (3.4), sửa runbook v1.0.4 và LP-v2 (3.4), đếm mục 4.2 | khoảng 4–5 giờ + SEC 1–2 giờ |
| B′ | Workflow trên nhánh app LP-v2, ghim lại runbook LP-v2 0.1/0.2, đếm mục 4.2 | khoảng 3 giờ + SEC 1–2 giờ |

Không có chi phí hạ tầng mới, nên không cần ESC từ OPS. Chọn đường nào (và có báo INV mức thiệt hại hay không) là việc ORC quyết, theo bug-list: "ORC quyết đường hotfix".
