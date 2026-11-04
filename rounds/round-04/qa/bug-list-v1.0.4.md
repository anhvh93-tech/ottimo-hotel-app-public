# Danh sách lỗi – v1.0.4, QA lượt local 1

- Tác giả: QA | Round 4 – v1.0.4 – Bước **Kiểm thử** (kéo sớm, chạy local) | 04/11/2026 18:00–19:00 giờ VN
- Bản thử: `origin/main` @ `40825ee1` (đủ 22 PR của v1.0.4). Stack dùng một lần `ottimo-qa104` trong worktree tạm (đã dọn). Chi tiết chạy: `rounds/round-04/qa/v1.0.4-local-run-1.md`.
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8 (QA quyết, không hạ vì tiến độ).
- Mã tiếp theo sau `BUG-R4-028` của `rounds/round-04/qa/bug-list.md`. Khi gộp vào tệp chính, ORC cấp lại số nếu đã có luồng khác dùng các số này.
- Dữ liệu: chỉ DS-E (tài khoản `qa.*`, khách giả, email `@example.test`). Không bí mật, không số tài khoản thật. Ảnh bằng chứng nằm ngoài repo (scratchpad), chưa che QR, nên **không commit** (RG-06).
- Không có lỗi P0. Có **một lỗi P1**: BUG-R4-035, thêm 04/11 tối. Lượt local 1 lúc 19:00 chưa có lỗi P1 nào.
- Cập nhật 04/11 19:30 (QA, bước Phản hồi & sửa): BUG-R4-033/034 đã sửa ở PR #62, chờ merge. BUG-R2-216: mục "Mong đợi" sửa theo UXD. BUG-R2-216/219: PR #60 (UXD đạt) chưa vào `main`, nên chưa chạy lại HD-01/02.
- Cập nhật 04/11 19:45 (QA, bước Kiểm thử, chạy lại):
  - **BUG-R2-216/219: đạt local.** PR #60 đã vào `main` (merge `58183764`, head `c2c2edd2`). QA chạy lại HD-01, HD-02 trên `main` @ `58183764`: stack dùng một lần `ottimo-qahd`, Desk Chromium 1366×768, project `desk-clock`.
    - Kết quả: 4/4 ca đạt, chạy **3 lượt liên tiếp**. Unit `v104-hold-dialog-feb` đạt 4/4.
    - Trạng thái mới: **Đã sửa – đạt local, chờ xác nhận STG** (HD-01/02, 06/11 C3). Chi tiết ở mục của từng lỗi.
  - **Thêm BUG-R4-035 (P1).** Lỗi ở trang Trả phòng: số điền sẵn của tủ minibar có một khoảng hở, nên Desk có thể gửi "tủ đầy" và đảo dòng minibar đã tính. FE-A tái hiện ở CI PR #65; QA xác nhận cơ chế bằng đọc mã trên `main` @ `58183764`. Vì là P1, lỗi phải đóng trước QC. FE-A sửa ở PR `v104/fix-s4-144-flake`, gộp sau #64.

## Tóm tắt

| Mã | Mức | Chỗ | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R4-029 | P2 | CI `build-test` xanh giả: turbo phát lại kết quả cũ của `api-client`, `integrations`; 5 ca `production-bootstrap` luôn bị bỏ qua | OPS (+ ARC duyệt) | Mới |
| BUG-R4-030 | P3 | `api-client` `src/generated/openapi.ts` lệch `openapi.yaml` (thiếu mô tả 0.3.12 của P4-16); test drift đỏ khi chạy không cache | BE-C (+ ARC) | Mới |
| BUG-R4-031 | P3 | `integrations` test đối chiếu luật email với `ops-check.sh` đỏ từ P4-04: bóc phải chữ `$EMAIL_RULE_RE` | OPS + INT | Mới |
| BUG-R4-032 | P2 | Sổ tay v1.0.4 chưa có đường **Đặt lại xác thực 2 bước**; hàng "mất điện thoại" vẫn dạy Khóa + tạo tài khoản mới (MN-02) | BA (+ SEC đọc câu) | Mới |
| BUG-R4-033 | P3 | Bộ test: S1-SEC-16 (API) flaky khi chạy song song – 429 của giới hạn đăng nhập theo IP | QA | Đã sửa, chờ merge (PR #62) |
| BUG-R4-034 | P3 | Bộ test: TC-L2-033 flaky – ca song song khóa OOO cùng đêm của căn 401 | QA | Đã sửa, chờ merge (PR #62) |
| BUG-R4-035 | **P1** | Trả phòng (H16): số điền sẵn của tủ minibar chỉ được gán trong `useEffect` sau khi `minibar-standard` tải xong. Bấm **Tiếp tục** đúng khoảng hở thì Desk gửi "tủ đầy" và đảo dòng minibar đã tính (sai tiền). Bấm lúc đang tải thì sang bước sau mà không đếm tủ | FE-A | Mới – FE-A đang sửa (PR `v104/fix-s4-144-flake`, gộp sau #64) |
| BUG-R2-216 | P3 | Thấy lại: hộp "Giữ chỗ" sau khi tạo in 2 lần số cọc và nội dung chuyển khoản | FE-B + UXD | **Đã sửa – đạt local** (PR #60, `main` @ `58183764`, HD-01 3/3 lượt). Chờ xác nhận STG 06/11 C3 |
| BUG-R2-219 | P3 | Thấy lại: hộp "Giữ chỗ" khi khách đến hôm nay vẫn hiện bộ chọn 12/24/48 h và mốc hạn đã qua | FE-B + UXD (chữ) | **Đã sửa – đạt local** (PR #60, `main` @ `58183764`, HD-02 3/3 lượt). Chờ xác nhận STG 06/11 C3 |

Ghi chú không phải lỗi (cuối tệp): khóa chữ `fo.tabs.holds` không còn dùng; gói P4-32 chưa vào `main`.

---

### BUG-R4-029 – CI `build-test` xanh giả: turbo phát lại kết quả test cũ, bỏ qua 5 ca `production-bootstrap`
- **Mức:** P2. Không sai tiền, không lộ dữ liệu. Nhưng cổng CI mà QC và PR dựa vào báo xanh trong khi 2 bộ test thật sự đỏ (BUG-R4-030, 031). Đây là "xanh giả" cùng họ với BUG-R4-013 và FB-R4-QA-DOM-PR25-01.
- **Môi trường:** CI run `41819582803` trên `main` @ `40825ee1` (job "format · lint · audit · test · build", xanh). Đối chiếu: chạy lại các bước của job này trong worktree `40825ee1` trên máy QA, **không** cache turbo, PG 17 thật (`ottimo_app`).
- **Liên quan:** TC-V104-CT-01, TC-V104-RG-04, TC-V104-EM-14, TC-V104-EM-21.
- **Các bước tái hiện:**
  1. Mở log job build-test của run `41819582803`.
  2. Tìm dòng của `@ottimo/api-client:test` và `@ottimo/integrations:test`.
  3. Tìm dòng `production-bootstrap.test.ts`.
  4. Trên máy: `corepack pnpm turbo run test --force` (hoặc `pnpm --filter @ottimo/api-client test`, `pnpm --filter @ottimo/integrations test`) ở `40825ee1`.
- **Thực tế:**
  - (a) `@ottimo/api-client:test` → "cache hit, replaying logs `4f966ba224123b11`" (37/37 xanh). Chạy thật: **1 đỏ** (`src/generated.test.ts`, BUG-R4-030). Gói này không có `turbo.json` riêng. Đầu vào của task test chỉ là tệp trong gói, nên đổi `docs/api/openapi.yaml` (d22fb078, P4-16) không làm mất cache.
  - (b) `@ottimo/integrations:test` → "cache hit, replaying logs `b217c3fcf60d1891`" (295/295 xanh). Chạy thật: **1 đỏ** (`notification/email-address.test.ts`, BUG-R4-031). Test này đọc `infra/server/bin/ops-check.sh`, nhưng tệp đó không nằm trong đầu vào của task, nên đổi ở P4-04 (488a3044) cũng không làm mất cache.
  - (c) `production-bootstrap.test.ts (11 tests | 5 skipped)` trên CI. Job có đặt `BOOTSTRAP_DATABASE_URL` và `BOOTSTRAP_MIGRATION_DATABASE_URL` (ci.yml dòng 66–67). Nhưng `product/turbo.json` task `test` chỉ khai `env: [DATABASE_URL, MIGRATION_DATABASE_URL]`. Turbo chạy chế độ env chặt, nên vitest không thấy 2 biến, và `describe.skipIf(...)` bỏ qua 5 ca "cơ sở dữ liệu trống mới" (tạo property, 10 căn, chủ đầu tư đầu tiên, chạy lần 2 bị từ chối…). Chạy thẳng vitest với 2 biến: **11/11 xanh**.
  - Khóa cache của CI là `turbo-${runner.os}-${sha}`, `restore-keys` lùi về tiền tố `turbo-${runner.os}-`. Nghĩa là kết quả cũ của SHA trước luôn được nạp lại.
- **Mong đợi:**
  - Đổi hợp đồng hay `ops-check.sh` thì test đọc chúng phải chạy lại.
  - Ca `production-bootstrap` chạy đủ 11 trên CI.
  - Ít nhất SHA được cắt cho bản phát hành chạy test không cache.
- **Đề xuất sửa (OPS, ARC duyệt):**
  - `product/packages/api-client/turbo.json`: `test.inputs` = `$TURBO_DEFAULT$` + `$TURBO_ROOT$/docs/api/openapi.yaml`.
  - `product/integrations/turbo.json`: `test.inputs` thêm `$TURBO_ROOT$/infra/server/bin/ops-check.sh`.
  - `product/turbo.json`: thêm `BOOTSTRAP_DATABASE_URL`, `BOOTSTRAP_MIGRATION_DATABASE_URL` vào `test.env` (hoặc `passThroughEnv`).
  - Job kiểm tra lại: rà mọi test đọc tệp ngoài gói (`readFileSync` tới `$TURBO_ROOT$`) và khai vào `inputs`; với SHA cắt bản (06/11 18:00) chạy `turbo run test --force`.
- **Bằng chứng:**
  - Log CI: `gh run view 41819582803 --log` (job build-test), dòng "cache hit" của 2 gói và dòng `production-bootstrap.test.ts (11 tests | 5 skipped)`.
  - Log máy QA (scratchpad, không commit): `qa104/unit/test.clean.log` (integrations 294/295, api-client 36/37).
- **Vai chịu trách nhiệm:** OPS (cấu hình turbo/CI). ARC duyệt danh sách đầu vào.
- **Trạng thái:** Mới.

### BUG-R4-030 – `api-client`: `src/generated/openapi.ts` lệch `openapi.yaml`, test drift đỏ khi không cache
- **Mức:** P3. Chỉ thiếu 3 dòng chú thích (doc comment), kiểu dữ liệu không đổi, không ảnh hưởng lúc chạy. Nhưng test drift của hợp đồng (CT-01) đang đỏ thật.
- **Môi trường:** worktree `40825ee1`, `corepack pnpm --filter @ottimo/api-client test`, không cache.
- **Liên quan:** TC-V104-CT-01, TC-V104-RG-04. Commit gây lệch: d22fb078 (P4-16 `v104/be-notice-allowlist`) sửa mô tả `privacy_notice_version` trong `docs/api/openapi.yaml` mà không sinh lại client.
- **Các bước tái hiện:**
  1. `corepack pnpm --filter @ottimo/api-client test`.
  2. Hoặc `corepack pnpm --filter @ottimo/api-client gen` rồi `git diff -- product/packages/api-client/src/generated/openapi.ts`.
- **Thực tế:** `src/generated.test.ts` đỏ (36/37). Bản sinh lại có thêm 3 dòng mô tả "0.3.12 (SEC-BA-104-09 a): `privacy_notice_version` chỉ nhận chuỗi đúng từng ký tự … `422 PARAM_OUT_OF_RANGE` kèm `allowed[]`". Bản đã commit không có 3 dòng đó.
- **Mong đợi:** tệp sinh khớp `openapi.yaml`, test drift xanh.
- **Đề xuất sửa:** `pnpm --filter @ottimo/api-client gen`, commit tệp sinh, kèm sửa BUG-R4-029 (a) để lần sau CI tự bắt.
- **Bằng chứng:** log `qa104/unit/test.clean.log` (scratchpad) dòng `src/generated.test.ts (1 test | 1 failed)`. Bản sinh lại tạm đã xóa lúc dọn; tái hiện bằng bước 2.
- **Vai chịu trách nhiệm:** BE-C (chủ P4-16). ARC (chủ hợp đồng) xác nhận.
- **Trạng thái:** Mới.

### BUG-R4-031 – `integrations`: test đối chiếu luật email với `ops-check.sh` đỏ từ P4-04
- **Mức:** P3. Luật thật vẫn khớp nhau: QA thay hằng vào bản chép tạm, test chạy 39/39. Nhưng bộ test của EM-14 đang đỏ, và nếu để vậy thì lần lệch thật tiếp theo sẽ không ai thấy.
- **Môi trường:** worktree `40825ee1`, `corepack pnpm --filter @ottimo/integrations test`, không cache.
- **Liên quan:** TC-V104-EM-14, TC-V104-RG-04, TC-V104-OP-08. Commit gây lệch: 488a3044 (P4-04 `ops-check`).
- **Các bước tái hiện:**
  1. `corepack pnpm --filter @ottimo/integrations test`.
  2. Xem `product/integrations/notification/email-address.test.ts` dòng 100–129: test lấy regex bằng `/a\.e ~ '([^']+)'/` trong hàm `check_email_ascii()` của `infra/server/bin/ops-check.sh`.
  3. Xem `ops-check.sh`: từ P4-04, câu SQL viết `a.e ~ '$EMAIL_RULE_RE'`, hằng `EMAIL_RULE_RE=` khai ở dòng 194.
- **Thực tế:** test bóc được chuỗi `$EMAIL_RULE_RE` (tên biến shell), dựng regex từ chuỗi đó, nên `owner@example.test` không khớp. Kết quả: 1 đỏ (294/295).
- **Mong đợi:** test đọc giá trị của `EMAIL_RULE_RE` (hoặc `ops-check.sh` in luật ra bằng một lệnh phụ để test gọi), so với luật TS dùng chung, và xanh.
- **Đề xuất sửa:** sửa test cho đọc dòng `EMAIL_RULE_RE='…'` khi gặp `$EMAIL_RULE_RE`. Kèm sửa BUG-R4-029 (b).
- **Bằng chứng:** log `qa104/unit/test.clean.log` dòng `notification/email-address.test.ts (39 tests | 1 failed)`. Bản chép tạm đã thay hằng (đã xóa): 39/39.
- **Vai chịu trách nhiệm:** OPS (P4-04 đổi `ops-check.sh`) sửa test cùng INT (chủ bộ test `notification`).
- **Trạng thái:** Mới.

### BUG-R4-032 – Sổ tay v1.0.4 chưa có đường "Đặt lại xác thực 2 bước"
- **Mức:** P2. Tài liệu dẫn người dùng tới cách vòng tốn công, trong khi v1.0.4 đã có nút (BUG-R4-020, P4-30). Theo cách vòng, người mất điện thoại bị tạo **tài khoản mới**: lịch sử thao tác bị tách làm hai, phải gán lại vai và email. Có cách khắc phục, nên chưa tới P1.
- **Môi trường:** `product/docs/manual/guides/*.md` trên `40825ee1` (01 bản 1.6, 03 và 04 bản 1.3, 00 bản 1.9 – đều "áp dụng từ v1.0.4"). Chỉ đọc tài liệu.
- **Liên quan:** TC-V104-MN-02 (QC 7.4), BUG-R4-020, TC-V104-MF-09…12.
- **Các bước tái hiện:**
  1. `grep -rn "Đặt lại xác thực" product/docs/manual/guides/` → không có kết quả.
  2. Mở tệp 01, mục "Các việc khác" (khoảng dòng 235–242): chỉ có **Đặt lại mật khẩu**, **Khóa tài khoản**, **Sửa email**.
  3. Bảng "Mất điện thoại" (dòng 175–176): quản lý hoặc vai dùng app nhân viên mất cả điện thoại lẫn mã khôi phục → "(1) Khóa tài khoản … tên đăng nhập mới".
- **Thực tế:**
  - Không có hướng dẫn **Khác… → Đặt lại xác thực 2 bước** (hộp S2, lý do ≥ 3 ký tự, thư `mfa_reset` tới email bảo mật của người đó).
  - Dòng 160 đã nhắc thư "Security notice: 2-step verification was reset", nhưng không nói ai bấm, bấm ở đâu.
  - Câu "không bật đăng nhập 2 bước ở v1.0.x" còn ở 01 dòng 227 (mục 1.9 bước 8), 03 dòng 105, 04 dòng 108. Mỗi chỗ đã có hộp "Áp dụng từ v1.0.4" ghi câu cũ hết hiệu lực (01 dòng 199). Phần này BA giữ có chủ đích vì v1.0.3 đang chạy. QC 7.4 cần chốt: gỡ câu cũ lúc deploy, hay giữ hộp là đạt.
- **Mong đợi (MN-02):** có đường **Đặt lại xác thực 2 bước** cho chủ đầu tư, kèm luật gặp tận mặt của SEC. Đường này thay bước "Khóa + tạo tài khoản mới" ở 2 hàng mất điện thoại, áp dụng từ v1.0.4. Câu "chưa bật 2 bước" được gỡ hoặc được QC chấp nhận ở dạng hộp.
- **Bằng chứng:** grep ở bước 1 (0 kết quả); trích dòng 175–176, 199, 227, 237 của `01-chu-dau-tu-quan-ly.md`.
- **Vai chịu trách nhiệm:** BA (sổ tay). SEC đọc lại câu "gặp tận mặt", UXD dựng lại HTML (MN-01).
- **Trạng thái:** Mới.

### BUG-R4-033 – Bộ test: S1-SEC-16 (API) flaky khi chạy song song – 429 của giới hạn đăng nhập theo IP
- **Mức:** P3 (bộ test). Sản phẩm đúng: giới hạn SR-RL-01 `loginPerIp` 20 lần / 15 phút làm đúng việc.
- **Môi trường:** stack `ottimo-qa104`, `pnpm test:e2e` như job docker-build của CI (`CI=1`, retries 1), 04/11 18:24 giờ VN.
- **Liên quan:** `product/tests/e2e/api/mfa-s2.r3s1.api.spec.ts:230` (S1-SEC-16 + ARC 12.3 #1–#3). CI từng gặp flaky ở ca này.
- **Các bước tái hiện:** chạy trọn bộ E2E với nhiều worker. Mọi worker đăng nhập từ cùng `127.0.0.1`.
- **Thực tế:**
  - Lần 1 đỏ ở bước "mã TOTP của bí mật cũ bị từ chối": mong 401, nhận **429** (`Retry-After` ~851 giây). Lý do: cửa sổ 20 lần đăng nhập/IP đã bị các ca song song dùng hết. Lần thử lại (retry 1) xanh.
  - Chạy riêng 3 lần (`--project=api --project=desk-chromium --no-deps --retries=0 --grep S1-SEC-16`): **3/3 xanh** cả bản API lẫn bản UI.
  - Tỉ lệ ca API: 4 đạt / 5 lần thử; lần đỏ duy nhất là lúc chạy song song đủ tải.
- **Mong đợi:** ca không phụ thuộc số lần đăng nhập của ca khác.
- **Đề xuất sửa (QA):** `loginMfa`/ca S1-SEC-16 gặp 429 ở bước đăng nhập thì gọi điểm test xóa bộ đếm (như các ca `limits`), hoặc đưa ca vào project tuần tự sau `api`. Không nới giới hạn của sản phẩm.
- **Bằng chứng:** `qa104/e2e-full/report.json` (status `flaky`, lỗi lần 1), `qa104/e2e-sec16-1..3/` (scratchpad). Trace lần đỏ đã xóa vì có thân yêu cầu đăng nhập.
- **Vai chịu trách nhiệm:** QA.
- **Trạng thái:** Đã sửa, chờ merge. PR #62 (nhánh `v104/qa-flaky-fixes`, head `9fb9cef3`).
  - Cách sửa: `loginMfa()` gặp 429 `RATE_LIMITED` thì gọi `POST /__test__/rate-limits/reset` (`resetRateLimits`, giống `login()`) rồi gửi lại đúng body đó **một** lần. Limiter chạy trước khi đọc token và mã, nên lần 429 không tiêu gì. Khóa tài khoản `qa.e2e.*` không bị reset, nên khóa thật của SR-AUTH-04 vẫn làm ca đỏ. Giới hạn của sản phẩm giữ nguyên.
  - Chạy lại (stack `ottimo-qaflaky`, `--retries=0`), kèm một vòng đăng nhập sai liên tục để làm đầy cửa sổ IP:
    - bản cũ: **0/2**;
    - bản sửa: **5/5** (`--repeat-each=5`; vòng đăng nhập sai nhận 111/146 lần 429).
  - Toàn bộ project `api` với bản sửa: 214 đạt, 4 bỏ qua, 0 đỏ, 0 flaky.
  - Đóng sau khi PR #62 vào `main` và CI E2E xanh.

### BUG-R4-034 – Bộ test: TC-L2-033 flaky – ca song song khóa OOO cùng đêm của căn 401
- **Mức:** P3 (bộ test). Sản phẩm đúng: khối trùng khối khác bị từ chối `409 ROOM_BLOCKED`.
- **Môi trường:** như BUG-R4-033, 04/11 18:24 giờ VN.
- **Liên quan:** `product/tests/e2e/api/room-blocks.api.spec.ts:174` (TC-L2-033, BR-804-01). Cùng họ với BUG-R2-024 (đã đóng 16/10, khi đó lý do là đặt phòng song song).
- **Các bước tái hiện:** chạy trọn bộ E2E với nhiều worker. `freeWindow()` chỉ xét đơn đặt khi chọn khoảng đêm trống cho căn 401. Trong lúc đó, một ca khác của cùng tệp tạo khối OOO trên căn 401.
- **Thực tế:** lần 1 `createRoomBlock` → **409 `ROOM_BLOCKED`** (`conflicts: [{roomNo: "401", nights: ["2027-01-18"], kind: "ooo"}]`). Lần thử lại xanh.
- **Mong đợi:** ca tự chọn lại khoảng đêm khi gặp `ROOM_BLOCKED`, như vòng thử `WindowTakenError` đã làm cho đơn đặt. Hoặc mỗi ca khóa dùng một căn riêng.
- **Bằng chứng:** `qa104/e2e-full/report.json` (status `flaky`).
- **Vai chịu trách nhiệm:** QA.
- **Trạng thái:** Đã sửa, chờ merge. PR #62 (head `9fb9cef3`).
  - Phạm vi mở rộng: chạy 40 lần đã lộ cùng lỗi ở TC-L2-030, nên cả 4 ca khóa của tệp đều được sửa.
  - Cách sửa:
    - Thêm `blockOnFreeWindow()`: nếu `createRoomBlock` trả 409 `ROOM_BLOCKED` hoặc `ROOM_UNAVAILABLE`, chọn khoảng trống khác, tối đa 4 lần, có ghi log. Mọi mã khác vẫn làm ca đỏ.
    - Khe thứ hai của TC-L2-033: ca khác khóa căn 401 đúng đêm mở bán lại. Ca chỉ chấp nhận `blocked` ở đêm đó khi `listRoomBlocks` cho thấy một khối khác còn hiệu lực che đêm này, và khối của ca này kết thúc đúng ngày mở lại.
  - Chạy lại (`--retries=0`):
    - bản cũ: TC-L2-033 **9/10** (6 worker);
    - bản sửa đầu: TC-L2-033 39/40, TC-L2-030 39/40 (8 worker);
    - bản cuối, hai lượt `--repeat-each=40` (8 worker): TC-L2-030, TC-L2-031 + 032 và TC-L2-033 đều **40/40 và 40/40**.
    - Trong hai lượt cuối, các nhánh thử lại đều đã chạy thật: chọn khoảng khác 5 lần, đêm mở lại bị khối khác che 1 lần.
  - Đóng sau khi PR #62 vào `main` và CI E2E xanh.

### BUG-R4-035 – Trả phòng: số điền sẵn của tủ minibar gán trễ, Desk có thể gửi "tủ đầy" và đảo dòng minibar đã tính
- **Mức:** **P1** (QA chốt 04/11).
  - Lỗi này ảnh hưởng tiền. Ở khoảng hở, Desk gửi "tủ đầy", máy chủ hiểu là khách không dùng gì và đảo dòng minibar đã tính. Khách sạn mất khoản đó mà không ai được báo. Đây đúng là họ lỗi BUG-R2-144 / BR-703-02 (khi đó mức P1).
  - Lý do không xếp P0: khoảng hở chỉ dài vài tác vụ render, từ lúc dữ liệu tủ hiện ra tới lúc số điền sẵn được gán. Người bấm tay khó rơi đúng lúc đó. Hiện chỉ thấy ở test tự động chạy song song. Ngoài ra, nhánh "đang tải" vẫn bị máy chủ chặn ở B18 (`minibar_not_checked`), nên không mất tiền.
  - **Nâng P0** nếu tái hiện được bằng thao tác tay (máy chậm, staging) hoặc thấy dòng minibar bị đảo trên dữ liệu thật.
  - Là P1 nên lỗi phải đóng trước QC rút gọn 08/11.
- **Môi trường:**
  - Desk (admin-web), trang `/reservations/{id}/check-out`, bước ① Minibar.
  - FE-A thấy lần đầu ở CI của PR #65, test unit đỏ.
  - QA đọc mã trên `main` @ `58183764`. PR #64 (P4-32) không chạm phần minibar này.
- **Liên quan:**
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` (dòng theo `58183764`);
  - test `product/apps/admin-web/src/__tests__/s4-144-fea.test.tsx`, ca "gia hạn sau khi đã đếm (DOM (b))…" (dòng 60);
  - BUG-R2-144 / BR-703-02 (điền sẵn theo lần đếm trước, không bao giờ từ tủ đầy); K11-03 (đếm nhiều tủ sau B14).
- **Các bước tái hiện:**
  1. Đơn đang ở đã đếm tủ (có dòng minibar đã tính). Gia hạn (B13), nên tủ phải đếm lại (`stay_continued`).
  2. Mở Trả phòng. Bấm **Tiếp tục** (`co.go_extras`) ngay khi câu "cần đếm lại" hiện. Câu này đến từ `CheckoutSummary`, có thể hiện trước khi `minibar-standard` tải xong.
  3. Tự động: `corepack pnpm --filter @ottimo/admin-web exec vitest run src/__tests__/s4-144-fea.test.tsx -t "gia hạn sau khi đã đếm"`, chạy 6 tiến trình song song.
     - FE-A: đỏ 1/30 khi chạy song song, 0/20 khi chạy riêng.
     - Máy QA (04/11 19:41, 30 lần, 6 tiến trình): 0/30 đỏ. Tỉ lệ phụ thuộc tải máy, nên QA dựa vào đọc mã để xác nhận cơ chế.
- **Thực tế (QA đọc mã):**
  - (a) **Khoảng hở "tủ đầy" – sai tiền.**
    - `left` (số còn trong tủ) chỉ được gán trong `useEffect` (dòng 245–267), chạy sau khi render có `std.state.data`.
    - Ở render đó `std.state.status = 'ready'`, nhưng `left` vẫn là `{}`. Hàm bấm `saveMinibar` (dòng 580) đọc `left` của chính render đó, rồi gửi `remainingQty: left[i.itemId] ?? i.standardQty` (dòng 604), tức **tủ đầy**.
    - Máy chủ ghi lần đếm "không dùng gì" và đảo dòng đã tính. Ca test kiểm `remainingQty` của coke phải bằng 0, nhận về số chuẩn.
  - (b) **Bấm lúc đang tải – bỏ bước đếm.**
    - Khi `minibar-standard` chưa có dữ liệu, `items = []`, nên `chargeable = false` (dòng 421).
    - `saveMinibar` đi nhánh `!chargeable` (dòng 581): sang bước ② mà **không** gửi lần đếm. Ca test chờ 1 lệnh `POST …/minibar-checks` và nhận 0.
    - Máy chủ vẫn chặn B18 bằng blocker `minibar_not_checked`, nên không sai tiền. Nhưng lễ tân phải quay lại bước ①.
  - (c) Cùng khoảng hở, QA đọc mã, **chưa tái hiện**: sau B14, khi chuyển sang tủ thứ hai.
    - `useResource` giữ dữ liệu cũ trong lúc tải tủ mới. Lúc đó `status ≠ 'ready'`, nên bấm không gửi gì (đúng).
    - Nhưng ở render đầu tiên có dữ liệu tủ mới, `left` vẫn là số của **tủ trước**. Nếu hai tủ cùng mã món, Desk có thể gửi số của tủ trước cho tủ mới, có thể tính **thừa** cho khách.
    - FE-A xem cùng lúc khi sửa.
- **Mong đợi:**
  - Số gửi đi luôn là số điền sẵn của **đúng** lần đọc `minibar-standard` đang hiện, theo BR-703-02: lần đếm trước, hoặc số đã sửa trên folio. Không bao giờ là tủ đầy mặc định, không bao giờ là số của tủ khác.
  - Khi `minibar-standard` chưa sẵn sàng thì **Tiếp tục** bị khóa hoặc không làm gì; không được sang bước ② mà bỏ qua lần đếm.
  - Ví dụ cách sửa (FE-A quyết):
    - tính số điền sẵn ngay trong render, khóa theo lần đọc (`loadedAt` / `roomId` + `periodId`), thay cho `useEffect`;
    - hoặc trong `saveMinibar`, từ chối gửi khi `left` chưa được gán cho đúng lần đọc này.
  - Test chống tái phát: một ca bấm **Tiếp tục** ngay ở render đầu có `std` (không chờ `useEffect`), và một ca bấm lúc `std` đang tải. Cả hai phải đỏ trên mã cũ một cách ổn định, không phụ thuộc tải máy.
- **Bằng chứng:**
  - log CI PR #65 (FE-A), job `format · lint · audit · test · build`;
  - log 30 lần chạy của QA (scratchpad, không commit, không có bí mật): `qahd/flake/run-*.log`, `summary.txt`;
  - các dòng mã nêu trên.
- **Vai chịu trách nhiệm:** FE-A (chủ H16 minibar). ARC xem cách khóa số điền sẵn theo lần đọc. QA chạy lại ca s4-144 ở chế độ song song, cộng ca chống tái phát, sau khi PR vào `main`.
- **Trạng thái:** Mới. FE-A đang sửa ở PR `v104/fix-s4-144-flake`, gộp sau #64. Cần vào bản cắt 06/11 18:00. Nếu không kịp thì ORC quyết lại (P1 mở thì QC không qua).

---

## Lỗi cũ thấy lại (không cấp số mới)

### BUG-R2-216 – Hộp "Giữ chỗ" sau khi tạo in 2 lần số cọc và nội dung chuyển khoản (thấy lại trên v1.0.4)
- **Mức:** P3 (giữ như bản gốc `rounds/round-02/qa/bug-list.md`).
- **Môi trường:** stack `ottimo-qa104` (`40825ee1`), Desk Chromium 1366×768, `qa.sal`, đồng hồ ảo `desk-clock`. Ca tạm của QA `ui-clock/zz-qa104-holds.spec.ts` (không commit, đã xóa cùng worktree).
- **Liên quan:** TC-V104-HD-01. Plan v1.0.4 nhóm (5) "nếu kịp", P4-40 giai đoạn B. Báo cáo FE-B `rounds/round-04/outputs/FE/v1.0.4-fe-holds.md` dòng 60 vẫn liệt kê là việc còn lại.
- **Các bước tái hiện:** Báo giá & giữ chỗ → ngày đến thứ Hai tới, 2 đêm, 1 người lớn → Tìm kiếm → **Báo giá** căn 202 → chọn khách giả → **Lưu báo giá** → **Giữ chỗ** → **Tạo giữ chỗ**.
- **Thực tế:** sau khi tạo, hộp có `.price-big` **2 lần** (500.000 đ) và dòng "Nội dung chuyển khoản: OTM00619" **2 lần**. Khối tóm tắt hiện trước, rồi `DepositQr`/`VietQrCard` lặp lại cùng hai dòng. Mã: `QuoteDialog.tsx` dòng 764–790 (khối tóm tắt dòng 776–783, rồi `<DepositQr … auto />` dòng 785) và `components/VietQrCard.tsx` dòng 23–25. Từ v1.0.3 (`da6d6f3d`) tới `40825ee1`, các commit chạm hai tệp này chỉ là LP-v2 (ghi chú ngôn ngữ, c9372e52, 0a25716a, c37a0a76). Phần giữ chỗ không đổi.
- **Mong đợi** (theo UXD, review PR #60): khối tóm tắt hiện cho CTV, và cho sale khi chưa có thẻ QR (đang tạo / tạo lỗi / chưa cấu hình tài khoản nhận). Mỗi thứ (số cọc, nội dung chuyển khoản) chỉ in **một** lần.
- **Bằng chứng:** ảnh `qa104/evidence/hd01-hold-dialog.png` (scratchpad; dữ liệu giả, số tài khoản nhận đã che sẵn, **QR chưa che** nên không commit).
- **Vai chịu trách nhiệm:** FE-B. UXD chốt bố cục.
- **Trạng thái:** **Đã sửa – đạt local, chờ xác nhận STG.**
  - Trước đó: Open, chưa sửa ở `40825ee1`. PR #60 (head `c2c2edd2`) vào `main` qua merge `58183764`.
  - **Chạy lại 04/11 19:37–19:38** trên `main` @ `58183764`:
    - Stack dùng một lần `ottimo-qahd`, Desk Chromium 1366×768, project `desk-clock`, đồng hồ ảo.
    - Spec tạm `ui-clock/zz-qa104-holds.spec.ts`, viết lại vì bản cũ đã xóa cùng worktree. Không commit.
    - Cả 3 ca HD-01 đạt, **3 lượt liên tiếp**. Mỗi ca tạo giữ chỗ căn 202, cọc 500.000 đ:
      - (a) `qa.sal`, chưa cài tài khoản nhận (`createVietQr` → 409 `PAYMENT_NOT_CONFIGURED`). Khối tóm tắt hiện **một** lần: "Cọc cần thu" ×1, `.price-big` ×1, "Nội dung chuyển khoản:" ×1, kèm câu lý do. Không có thẻ VietQR.
      - (b) `qa.sal`, có tài khoản nhận (VietQR 201, nội dung = mã đơn). Chỉ còn thẻ VietQR: `.price-big` ×1, "Nội dung chuyển khoản: OTM000xx" ×1, nút "Sao chép nội dung" ×1. Không có "Cọc cần thu" phía trên.
      - (c) `qa.ctv1`: khối tóm tắt ×1, `.price-big` ×1, "Nội dung chuyển khoản:" ×1, câu `sale.qr_after_ctv`. 0 lệnh `createVietQr`.
    - Unit `v104-hold-dialog-feb.test.tsx`: 4/4 đạt.
  - Trên staging nhiều khả năng ra nhánh (a), vì không dùng VietQR thật (test case 0.2).
  - Ghi nhận, không phải lỗi: ở nhánh (a), hộp xanh vẫn ghi "Gửi mã QR cho khách…", ngay trên câu đỏ "Chưa cài tài khoản nhận…". Hai câu đọc cùng nhau vẫn hiểu được. Chỗ này không đổi ở PR #60; gửi UXD cân nhắc ở v1.0.5.
  - Đóng khi HD-01 đạt trên STG 06/11 C3.
  - Ảnh `qahd/evidence/hd01a-sale-no-account.png`, `hd01b-sale-vietqr.png`, `hd01c-ctv.png` để ở scratchpad. Dữ liệu giả. Ảnh (b) có QR chưa che, nên **không commit**.

### BUG-R2-219 – Hộp "Giữ chỗ" khi khách đến hôm nay vẫn hiện bộ chọn 12/24/48 h và mốc hạn đã qua (thấy lại trên v1.0.4)
- **Mức:** P3 (giữ như bản gốc).
- **Môi trường:** như trên, đồng hồ ảo 18:30 ngày đến.
- **Liên quan:** TC-V104-HD-02.
- **Các bước tái hiện:** Báo giá & giữ chỗ → ngày đến = hôm nay, 2 đêm → Báo giá căn 202 → chọn khách → Lưu báo giá → **Giữ chỗ**.
- **Thực tế:**
  - Thông báo "Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay." hiện đúng. Nút **Tạo giữ chỗ** bị khóa (đúng). Không có lệnh `create-hold` nào được gửi.
  - Hộp vẫn hiện "Giữ trong" 12 h / 24 h / 48 h và "Hết hạn 12:00 [ngày đến] – chưa cọc thì tự hủy, mở bán lại.", là mốc **đã qua** (lúc đó 18:30).
  - Mã: `QuoteDialog.tsx` dòng 792–808 vẫn vẽ `Seg` + `sale.hold_until` khi `arrivesToday`.
- **Mong đợi:** khi không được giữ chỗ thì ẩn bộ chọn thời hạn và dòng hết hạn (hoặc thay bằng hướng dẫn tạo đơn đã thu). Không hiện mốc giờ trong quá khứ.
- **Bằng chứng:** ảnh `qa104/evidence/hd02-hold-today.png` (scratchpad; dữ liệu giả, không QR).
- **Vai chịu trách nhiệm:** FE-B. UXD lo phần chữ.
- **Trạng thái:** **Đã sửa – đạt local, chờ xác nhận STG.**
  - Trước đó: Open, chưa sửa ở `40825ee1`. PR #60 (head `c2c2edd2`) vào `main` qua merge `58183764`.
  - **Chạy lại 04/11 19:37–19:38** trên `main` @ `58183764`, cùng stack và spec như BUG-R2-216. Ca đạt **3 lượt liên tiếp**.
  - Kịch bản: `qa.sal`, ngày đến = hôm nay, đồng hồ ảo **18:30**. Hộp chỉ còn:
    - thông báo "Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay." và câu `sale.today_handoff`;
    - nút **Tạo giữ chỗ** bị khóa. Bấm ép vẫn **0** lệnh `create-hold`.
  - Các thứ phải mất đều đã mất (×0): "Giữ trong", nút 12/24/48 h, "Hết hạn …", "Mã QR … tạo ngay sau khi giữ chỗ", "Cọc cần thu".
  - Đối chứng trong cùng lượt (ngày đến tương lai, trước khi tạo): "Giữ trong" ×1, 3 nút 12/24/48 h, "Hết hạn" ×1, câu QR ×1. Như vậy selector của ca vẫn bắt được các thành phần này khi chúng có mặt.
  - Unit `v104-hold-dialog-feb.test.tsx` (ca 219): đạt.
  - Đóng khi HD-02 đạt trên STG 06/11 C3.
  - Ảnh `qahd/evidence/hd02-arrival-today.png` để ở scratchpad. Dữ liệu giả, không có QR.

---

## Ghi chú không phải lỗi

- **Khóa `fo.tabs.holds` không còn dùng.** Từ PR #54, `e2e/ui-clock/gate-s4.spec.ts:637` và Desk dùng `today.holds_waiting` ("Giữ chỗ chờ cọc"). `design/tools/gen_strings.py:115` vẫn giữ khóa cũ với ghi chú "chưa xóa, đợi FE-B rebase và gộp P4-40". P4-40 đã vào `main`, và `product/apps` không còn chỗ nào dùng khóa này. UXD dọn ở v1.0.5 (không chặn).
- **Gói P4-32 `v104/fe-checkout` chưa vào `main`.** Không có nhánh hay commit nào. Khóa `checkout.pending_refund_line`, `checkout.use_early_departure` đã có trong bảng chữ, nhưng `product/apps` không dùng. Vì vậy TC-V104-CO-01…03 (GN-R4-QA-03, BUG-R3-024) là **N/A – chưa vào main**. ORC chốt lúc cắt 06/11 18:00: P4-32 vào bản cắt hay dời v1.0.5 (test case 0.1 quy định gói không vào thì ca chuyển "N/A – dời v1.0.5", không xóa).
  - Cập nhật 04/11 19:45: P4-32 nay là PR #64 (`v104/fe-checkout` @ `94ac2ade`), vẫn chưa vào `main`.
  - Test case bản 0.2 đã sửa mục 6 theo ARC A1 và UXD U4/U5:
    - CO-01 thêm tiền điều kiện;
    - thêm CO-01b (giới hạn đã biết, mong đợi "không có dòng"), không ghi thành lỗi;
    - thêm CO-04 (đọc lỗi: câu chữ Stone, không chặn Hoàn tất);
    - CO-03 N/A – dời v1.0.5.
