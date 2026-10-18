# OPS – Lịch chạy T9 hằng đêm (G5.2) và timeout `build-test`

Round 2, tuần Ổn định, bước Sản xuất trước cổng QC Sprint 4. Người làm: OPS. Ngày 18/10/2026.
Căn cứ: `qc/s4-gate-readiness.md` (G5.2, việc a7), `qa/s4-test-plan.md` mục 3.2, `qa/s4-test-report.md` mục 3, `sprint-4-plan.md` (T9, G5).
ORC giao thêm việc gấp ngày 18/10: run 39085982603 trên `7ac11a4` bị hủy vì `build-test` chạy quá 15 phút.

Chỉ sửa một tệp: `.github/workflows/ci.yml`. Chưa commit, ORC sẽ commit.

## 1. Đã làm gì

| # | Việc | Trạng thái |
|---|---|---|
| 1 | `build-test`: `timeout-minutes` 15 → **25** | Xong |
| 2 | Thêm lịch `schedule` hằng đêm vào `ci.yml` (không tạo `nightly.yml`) | Xong |
| 3 | `workflow_dispatch` có ô `t9` (mặc định bật) để chạy tay một lượt T9 | Xong |
| 4 | Các bước T9 trong job `docker-build`: báo cáo JSON, chặn chạy lại che lỗi, bảng tóm tắt, luôn tải báo cáo lên | Xong |
| 5 | Lượt T9 không deploy staging, không đẩy image lên GHCR | Xong (giữ điều kiện `push`) |
| 6 | Rà timeout các job khác; thêm `timeout-minutes: 10` cho `infra-scripts` | Xong |
| 7 | Đề xuất chia nhỏ test API trên CI (mục 7) | Chỉ đề xuất |

### Vì sao thêm vào `ci.yml` mà không tạo `nightly.yml`
- **Không chép lại mã.** Phần E2E của `docker-build` dài khoảng 170 dòng, gồm danh sách `WRITES` và `ALLOWED_SKIP` do QA giữ. Nếu có bản chép thứ hai trong `nightly.yml`, hai danh sách sẽ sớm lệch nhau.
- **Không cấp thêm quyền.** Muốn `nightly.yml` gọi lại `ci.yml` qua `workflow_call` thì phải cấp `packages: write` ở workflow gọi, vì job `publish-images` có xin quyền này. Như vậy trái nguyên tắc FB-R1-SEC-OPS-04: chỉ `publish-images` có quyền ghi.
- **Push không chậm thêm.** Bước nào của T9 cũng có điều kiện `env.T9 == 'true'`. Push và PR vẫn chạy đúng `pnpm test:e2e` như trước, không thêm bước nào.

## 2. Lịch chạy

| Mục | Giá trị |
|---|---|
| Cron | `'17 19 * * *'` (UTC) |
| Giờ Việt Nam | **02:17 hằng đêm** (UTC+7, không đổi giờ theo mùa) |
| Vì sao 02:17 | Giờ thấp điểm của khách sạn và của đội. Tránh phút :00 vì GitHub hay trễ hoặc bỏ lượt hẹn giờ đúng đầu giờ |
| Chạy trên | Nhánh mặc định `main`, commit mới nhất lúc chạy |
| Bắt đầu có hiệu lực | Khi `ci.yml` mới có trên `main` (sau khi ORC commit và push) |

GitHub có thể chạy lượt hẹn giờ trễ vài phút đến vài chục phút khi hệ thống tải cao. Đây là hành vi bình thường của GitHub, không phải lỗi.

## 3. Phạm vi một lượt T9

Một lượt T9 chạy **toàn bộ** `ci.yml` trên `main`:

| Job | Trong lượt T9 |
|---|---|
| `build-test` | Format, lint, audit, kiểm schema, Vitest, build. Nếu commit đã xanh lúc push, turbo có thể dùng lại kết quả Vitest từ cache (cùng đầu vào thì cùng kết quả) |
| `landing-e2e`, `infra-scripts`, `test-surface-guard`, `contract-lint`, `api-contract`, `secrets-scan` | Chạy như khi push |
| `docker-build` | Tên job đổi thành **"docker images build · E2E smoke · T9 nightly"**. Chạy đủ bộ E2E, luôn chạy mới (xem dưới) |
| `publish-images`, `deploy-staging` | **Bỏ qua** (mục 4) |

**Bộ E2E của lượt T9** gồm mọi project trong `e2e/playwright.config.ts`, có `E2E_UI=1`. Ngày 18/10, `--list` đếm được **1.987 ca trong 64 tệp**:

| Project | Số ca |
|---|---|
| rbac | 1.529 |
| api | 206 |
| clock | 139 |
| desk-chromium | 53 |
| desk-clock | 32 |
| các project còn lại | 28 |

Các ca UI và axe nằm ngoài `WRITES` đều chạy. Hai bước kiểm có sẵn vẫn giữ nguyên: "Origin checks ran" và "UI cases ran" (đủ `WRITES`, axe ít nhất 9 ca).

**Các bước chỉ có ở lượt T9** (`qa/s4-test-plan.md` 3.2, điểm 2 và 3):
1. **Báo cáo JSON.** Lệnh chạy là `pnpm --filter @ottimo/tests run test:e2e --add-reporter=json`, với `PLAYWRIGHT_JSON_OUTPUT_FILE` trỏ tới `tests/e2e/test-results/t9-report.json`. Các reporter đã cấu hình (list, junit, html) vẫn chạy. Tệp JSON ghi mọi lượt thử của từng ca, kèm chỉ số `retry` và annotation.
2. **Bước "T9 retry guard + summary".** Bước này báo **đỏ** khi:
   - ca có annotation `bug` (từ `knownBug`) phải chạy lại (`retry` > 0). Đây là điểm 2 của BUG-R2-064;
   - bất kỳ lượt thử nào có annotation `precondition-failed`, kể cả khi lượt chạy lại đã đạt;
   - có ca `unexpected` hoặc lỗi của cả lượt chạy (`errors`, ví dụ global setup hỏng).

   Ca chập chờn khác (đạt khi chạy lại) chỉ hiện `::warning::` để QA ghi sổ sáng hôm sau. Hai project `mobile-webkit` và `android-chromium` hiện **chưa có ca nào** (chưa có `flows/*.mobile.spec.ts`), nên chỉ hiện `::notice::`, không báo đỏ. Bảng theo từng project và danh sách ca đỏ hoặc chập chờn được ghi vào **Summary** của run. Bước này vẫn chạy khi E2E đỏ, trừ khi run bị hủy.
3. **Tải báo cáo ở mọi lượt T9, xanh hay đỏ.** Artifact tên `t9-playwright-report`, giữ 14 ngày, gồm `junit.xml`, `t9-report.json`, HTML và `test-results`. Lượt push vẫn chỉ tải `playwright-report` khi đỏ, giữ 7 ngày như trước.

Khi QA thêm ca axe cho PWA H19–H22, guest-web H23, H24, S10, S11, S30 (G8.2), các ca đó tự vào lượt T9, OPS không phải sửa gì.

## 4. Không deploy, không publish

- `publish-images` có điều kiện `github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.PUBLISH_IMAGES == 'true'`. `deploy-staging` cần `publish-images` và có cùng điều kiện `push`.
- Lượt hẹn giờ có `event_name = schedule`, lượt chạy tay có `workflow_dispatch`, nên cả hai luôn bỏ qua hai job này. Đã ghi chú ngay trong `ci.yml`.
- Không thêm quyền nào: workflow vẫn để `permissions: contents: read`.

## 5. Concurrency: T9 và push không hủy nhau

Trước đây nhóm concurrency là `ci-<ref>`, có `cancel-in-progress: true`. Nếu giữ như vậy, lượt 02:17 sẽ hủy CI của một commit ORC đẩy lên `main` lúc 01:xx, và ngược lại.

Nay:
- lượt T9 vào nhóm `ci-t9-<ref>` và **không bị hủy giữa chừng**: lượt T9 mới phải xếp hàng chờ;
- push và PR vẫn ở nhóm `ci-<ref>` và vẫn hủy lượt cũ hơn trên cùng ref, như trước.

## 6. Cách bật tay (`workflow_dispatch`)

**Trên GitHub:** Actions → CI → Run workflow → chọn branch `main` → để nguyên ô **t9** đã tích (mặc định) → Run workflow.

**Bằng CLI:**
```
gh workflow run ci.yml --ref main -f t9=true      # một lượt T9 (giống lượt đêm)
gh workflow run ci.yml --ref main -f t9=false     # CI thường, như workflow_dispatch trước đây
```

**Xem kết quả (QC dùng cho G5.2):**
```
gh run list --workflow ci.yml --event schedule --limit 5          # các lượt đêm
gh run list --workflow ci.yml --event workflow_dispatch --limit 5 # các lượt chạy tay
```
- Lượt T9 có job tên "… · T9 nightly".
- Bảng kết quả nằm ở tab Summary. Báo cáo đầy đủ ở artifact `t9-playwright-report`.
- **Lượt xanh** khi run kết thúc `success`. Lúc đó mọi job đều xanh, bước "T9 retry guard" xanh, và không có ca bị che bởi lượt chạy lại.

**Thời lượng dự kiến:** khoảng 20–35 phút.
- `docker-build` ≈ 16–17 phút.
- `build-test` từ 2 phút (dùng lại cache) đến 15 phút.

## 7. Việc gấp: timeout của các job

Số liệu lấy từ `gh run view` (chỉ đọc), các run từ 17/10 17:08 đến 18/10 01:18:

| Job | Thời gian gần đây | Giới hạn cũ | Giới hạn mới | Ghi chú |
|---|---|---|---|---|
| `build-test` | 10,8 · 11,0 · 12,6 · 15,3 (bị hủy) phút. Bước Vitest: 8,4 → 12,0 phút | 15 | **25** | Vitest tăng nhanh theo số tệp test (90 tệp, 714 giây) |
| `docker-build` (E2E) | 14,5 · 16,0 · 16,1 · 16,3 phút. Bước E2E ≈ 12,5 phút | 30 | 30 | Mới dùng khoảng 54% giới hạn. Nâng lên 40 khi vượt 22 phút |
| `landing-e2e` | 2,1–2,4 phút | 15 | 15 | Còn xa giới hạn |
| `infra-scripts` | 0,2–0,3 phút | không đặt (mặc định 360) | **10** | Chặn trường hợp `docker run` treo trong `check-caddy-prod.sh` giữ runner 6 giờ |
| Các job nhỏ còn lại | ≤ 0,5 phút | 5–10 | giữ nguyên | – |

### Đề xuất chia test API cho nhanh hơn (chưa làm, chờ ORC quyết)

Nguyên nhân chậm: theo tài liệu GitHub, runner chuẩn của repo riêng tư có 2 vCPU. Vitest 4.1 mặc định dùng `số CPU − 1` worker (đã đọc mã `getDefaultThreadsCount`), tức chỉ **1 worker**. Vì vậy 90 tệp chạy lần lượt từng tệp.

1. **Rẻ nhất, không tốn thêm phút: tăng số worker.**
   - Cách làm: đặt `VITEST_MAX_WORKERS: '2'` (Vitest 4.1 có đọc biến này) trong `env` của bước "Test" thuộc `build-test`.
   - Lý do có thể nhanh hơn: test API chủ yếu chờ PostgreSQL, và mỗi tệp tự tạo tenant riêng (theo chú thích trong `vitest.config.mts`). Ước tính giảm 30–45% thời gian bước Test [chưa đo].
   - Điều kiện: BE và QA xác nhận không tệp nào dùng chung trạng thái toàn cục (đồng hồ, tham số hệ thống), rồi chạy thử ở máy 3 lần `vitest run --maxWorkers=2` đều xanh.
2. **Chia theo shard trên nhiều runner.**
   - Cách làm: tạo job `api-test` dạng matrix `shard: [1, 2, 3]`, mỗi shard có dịch vụ PostgreSQL riêng và chạy `pnpm --filter @ottimo/api exec vitest run --shard=<i>/3`. `build-test` chỉ còn `turbo run test --filter=!@ottimo/api`. `docker-build` cần `[build-test, api-test]`.
   - Lợi: bước Test còn khoảng 4–5 phút.
   - Chi phí: thêm khoảng 3–4 phút runner mỗi run (cài đặt cho mỗi shard).
   - Lưu ý: Vitest chia shard theo số tệp, không theo thời gian chạy, nên hai tệp chậm nhất (`br417-an-table` 109 giây, `minibar-m1` 71 giây) có thể rơi vào cùng một shard. Có thể kết hợp với cách 1.
3. **Rút ngắn tổng thời gian mỗi push.**
   - Hiện tại: `docker-build` phải chờ `build-test` (`needs`), nên một push mất khoảng 27–31 phút.
   - Đề xuất: cho `docker-build` chỉ cần một job lint/build nhẹ. Push khi đó còn khoảng 17–18 phút.
   - Đổi lại: E2E vẫn chạy (và tốn phút) cả khi unit test đỏ.

Đề xuất thứ tự: làm cách 1 ngay sau cổng S4. Nếu bước Test vẫn trên 10 phút thì làm thêm cách 2.

## 8. Kiểm tra đã làm

- **actionlint, shellcheck:** máy không có, và theo chỉ đạo không cài thêm từ Internet. Tôi không sửa script shell nào trong `product/infra/`, và job `infra-scripts` trên CI vẫn chạy shellcheck các script đó.
- **YAML hợp lệ:** đã đọc bằng PyYAML 6.0.3. Đã đối chiếu các trường `on`, `concurrency`, `timeout-minutes`, `if` và `needs` của từng job.
- **Script shell:** 49 khối `run:` qua `bash -n`, 0 lỗi. Trước khi kiểm, các biểu thức `${{ }}` được thay bằng chuỗi giữ chỗ.
- **Python nhúng:** cả 3 khối (2 khối có sẵn và bước guard mới) biên dịch được.
- **Bước guard:** chạy thử với 5 bộ dữ liệu:

  | Bộ dữ liệu | Kết quả mong đợi | Exit |
  |---|---|---|
  | Báo cáo `--list` thật | xanh | 0 |
  | Có một ca chập chờn thường | xanh, kèm cảnh báo | 0 |
  | Ca `bug` chạy lại, ca `precondition-failed` lượt đầu, ca `unexpected` | đỏ | 1 |
  | Chỉ có lỗi của cả lượt chạy | đỏ | 1 |
  | Thiếu tệp JSON | đỏ | 1 |

- **Playwright 1.63.0:** đã xác nhận trong mã nguồn rằng `--add-reporter` thêm reporter bên cạnh các reporter đã cấu hình, và JSON reporter đọc `PLAYWRIGHT_JSON_OUTPUT_FILE`. Chạy `pnpm --filter @ottimo/tests run test:e2e --add-reporter=json --list` ở máy ra được tệp JSON với 1.987 ca và đúng các trường `projectName`, `annotations`, `results[].retry`.
- **Biểu thức GitHub:** đã đối chiếu tay bảng ngữ cảnh được phép dùng:
  - `concurrency`, `jobs.<id>.name`, `jobs.<id>.env`: `github`, `inputs`;
  - `if` và `with` của step: `env`.

  Với push và PR, `inputs.t9` là null, nên `inputs.t9 == true` cho kết quả false.
- **Tác dụng phụ ở máy:** lượt `--list` đã ghi đè báo cáo HTML cục bộ `product/tests/e2e/playwright-report/index.html`. Tệp này nằm trong `.gitignore`, chỉ là bản QA xem ở máy. Artifact trên CI không bị ảnh hưởng.

## 9. Giả định

- Không tạo ESC. Lượt đêm tốn khoảng 22–36 phút runner mỗi đêm, tức khoảng 0,7–1,1 nghìn phút mỗi tháng. Trong khi đó CI hiện chạy khoảng 60–100 run mỗi ngày (16–17/10), nên phần tăng thêm chỉ khoảng 1–2%. Hạn mức GitHub Actions cho repo riêng tư vẫn **[Chưa xác minh]**, như `hosting-plan.md` đã ghi. Token `gh` không có quyền xem billing nên chưa đọc được.
- Giờ chạy là 02:17 giờ Việt Nam. QA ghi lỗi của lượt đêm vào sổ sáng hôm sau, trước 10:00 (3.2 điểm 4).
- Giữ `retries: 1` của cấu hình CI cho lượt đêm, đúng như 3.2: chỉ báo đỏ khi ca có annotation `bug` phải chạy lại. Nếu chạy `--retries=0`, mọi ca chập chờn sẽ làm đêm đỏ. Việc này cần QA và QC quyết, OPS không tự đổi.

## 10. Rủi ro, vướng mắc, việc chưa xong

- **Chưa thu hẹp E2E của mỗi push** (3.2 điểm 1: `--grep "@write|@a1|@a4"`, bỏ điều kiện axe khỏi push). Push vẫn chạy đủ mọi ca như Sprint 3, nên không mất độ bao phủ, chỉ chậm hơn. Muốn thu hẹp thì QA phải gắn tag `@write`, `@a1`, `@a4` cho các ca trước. Đề xuất làm sau cổng S4.
- **Bước chặn chạy lại mới chỉ có ở lượt T9**, chưa có ở push. ORC và QA quyết có mở rộng sang push không. Nếu mở rộng: thêm `--add-reporter=json` và bỏ điều kiện `env.T9` ở bước guard.
- **Lượt T9 đầu tiên:** ORC commit, push lên `main`, rồi chạy `gh workflow run ci.yml --ref main -f t9=true`. Nếu đỏ, QA ghi lỗi vào sổ. G5.2 chỉ đạt khi có ít nhất một lượt xanh.
- **Decision-log:** OPS không được sửa ngoài `.github/workflows/` và báo cáo này. Đề nghị ORC thêm một dòng:
  > 18/10 – OPS: T9 hằng đêm chạy trong `ci.yml` (`schedule` 19:17 UTC = 02:17 giờ VN, `workflow_dispatch` có ô `t9`). Concurrency T9 tách riêng. Bước guard đỏ khi ca `bug` phải chạy lại hoặc có `precondition-failed`. Lượt T9 không publish, không deploy. `build-test` timeout 25 phút, `infra-scripts` 10 phút.
- **Thời gian Vitest đang tăng nhanh**, từ 8,4 lên 12,0 phút chỉ trong vài giờ ngày 17–18/10. Giới hạn 25 phút còn dư khoảng 10 phút. Nên làm đề xuất 1 ở mục 7 sớm.
