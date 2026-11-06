# ARC review PR #120 – BE-D V5-58: Wi-Fi trên Desk phía máy chủ (`getPropertyWifi`, `setPropertyWifi`, SR-RL-15)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.
- PR: https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/120, nhánh `r5-v5-58`.
  - ARC đọc lần đầu ở `b790b09f`, như ORC giao.
  - Trong lúc review, BE-D đẩy ba commit, không rebase:
    - `9e81c92d`: chuyển UPSERT `rate_limit_counter` ra `shared/`, viết lại T58-11…16;
    - `ce81ba5c`: chỉ so mật khẩu khi mọi kiểm khác đã qua (SEC V558-01), sửa chú thích SR-RL-10 → SR-RL-15 (SEC V558-02);
    - **`f1ac530b`**: gộp `main` (chữ 1f của #111, allowlist gitleaks). `git show --cc` không có tệp nào phải gỡ xung đột.
  - **SHA cuối ARC duyệt: `f1ac530b`**. CI của SHA này đang chạy lúc viết; API contract (`RBAC --strict`), gitleaks, confidential paths đã xanh. CI của `b790b09f` xanh hết (run 42261991416).
  - 15 tệp so với `main`. Không migration, không đổi `openapi.yaml`.
- Đã đọc:
  - diff `4003471e..b790b09f`, rồi phần chênh `b790b09f..f1ac530b` theo từng commit;
  - hợp đồng trên `main`: `contract-0.3.13.md` mục 1.13, 1.23, 1.25 (T58-11…13), 1.26 (T58-14…16, quyết định ARC về hàm UPSERT dùng chung); `openapi.yaml` `getPropertyWifi`, `setPropertyWifi` (chữ 1f), `PropertyWifi`;
  - `security-requirements.md` SR-RL-15; `erd.md` 4.14;
  - mã có sẵn liên quan: `test/module-boundaries.test.ts`, `test/integration/architecture.test.ts` (ngoại lệ RLS), `public-site/public/worker-jobs.ts` (job `public_site.cleanup`), `jobs/job-runner.ts` (tick 1 phút), `user_property_role.revoked_at`;
  - review đã có, đọc để không lặp thẻ: SEC `SEC-on-be-pr-120-v5-58.md` (DUYỆT @ `b790b09f`, 5 điểm cho HEAD mới), DOM `DOM-on-be-pr-120-v5-58.md` (DUYỆT @ `b790b09f`, thẻ ARC-120-01 cho ARC).
- Đã chạy. Mọi thứ trong scratchpad của ARC: worktree tách rời; PostgreSQL 17 tạm (image CI cùng digest, mật khẩu CI-only của `ci.yml`, chỉ mở ở `127.0.0.1`); `pnpm install --offline --frozen-lockfile`. Không chạm staging hay production. Container và worktree đã xóa sau review.
  - Gộp thử `b790b09f` + `main` @ `cb778644`, rồi `f1ac530b` + `main` @ `b8224f3b`: cả hai không xung đột. Mã `product/services` của bản gộp thử thứ hai trùng `f1ac530b`.
  - 9 tệp test: hai tệp đơn vị V5-58, `v5-58-property-wifi`, `rbac-r5-bed`, `public-site-r3-bed` và `lp-v2-price-estimate` (SR-RL-11 dùng chung hàm UPSERT), `architecture`, `guest-requests-s4-bed` (trang khách đọc Wi-Fi), `module-boundaries`. Kết quả: `b790b09f` 141/141 đạt; **`f1ac530b` 146/146 đạt**.
  - Đột biến ở cả hai SHA (mục 3).

## 0. Kết luận: **DUYỆT** @ `f1ac530b`

Gộp khi CI xanh ở `f1ac530b`. Nếu cần gộp `main` thêm lần nữa: commit gộp không phải gỡ xung đột ở `product/services` thì duyệt này áp cho HEAD mới.

- Quyết định ARC ở hợp đồng 1.26 đã làm đúng (mục 1).
- Năm điểm SEC đặt cho HEAD mới (SEC mục 3) đạt cả năm (mục 1). Riêng điểm 5 ("ngoài chuyển hàm, không đổi gì khác"): `ce81ba5c` có đổi mã, nhưng đổi đúng theo thẻ SEC V558-01 và V558-02. ORC chuyển SEC xem lại phần chênh này: một điều kiện 5 dòng và một dòng chú thích.
- ARC chấp nhận thay đổi của V558-01, dù nó khác chữ T58-9 cũ. ARC đã sửa hợp đồng: `contract-0.3.13.md` T58-9 ở 1.23, mục mới 1.27 (mục 2).
- ARC tự sửa `erd.md` 4.14, thêm khóa `wifi_pw_cmp:<user_id>`.
- Mô tả `setPropertyWifi` trên `main` đã ghi **SR-RL-15** (chữ 1f, #111), nên **không** cần sửa `openapi.yaml`. Hai chỗ còn chữ SR-RL-10 trong `openapi.yaml` là luật RAM của trang công khai (`x-rate-limit` của `/v1/public/*`) và dòng lịch sử phiên bản – đúng.

Thẻ: **0 Blocker · 0 Major · 0 Minor · 0 Suggestion** trên PR. Thẻ ARC định mở ở `b790b09f` đã được BE-D làm trước khi ARC viết tệp này:
- hàm UPSERT nằm ở `public-site/public` → `identity` phụ thuộc `public-site`, trong khi `public-site` đã import `identity/public` (`RateLimiter`, `staff-directory`);
- không test nào giữ `expires_at` = cuối cửa sổ (đột biến W16).

Mục 4 ghi chúng để người sau biết vì sao mã như vậy. ESC mới: **không**.

---

## 1. Quyết định 1.26 và năm điểm SEC ở HEAD mới

| Điểm | Kiểm ở `b790b09f..f1ac530b` | Kết quả |
|---|---|---|
| ARC 1.26: một hàm ở `shared/`, nhận client của giao dịch do người gọi chọn | `src/shared/rate-limit-counter.ts` `bumpRateLimitCounter(q: Pick<Tx, 'query'>, bucketKey, windowStart, windowMs)`. Cùng kiểu với `shared/savepoint.ts`: chỉ import kiểu `Tx` từ `db/` | Đạt |
| ARC 1.26: `public-site` gọi lại hàm đó, không đổi hành vi, test SR-RL-11 giữ | `PublicBookingService.bumpAt` gọi hàm dùng chung. `public-site-r3-bed`, `lp-v2-price-estimate` xanh. Đột biến W15 (bộ đếm công khai trả hằng số) đỏ 3 ca | Đạt |
| ARC 1.26: không import `public-site/internal` | `identity` không còn import `public-site`. Không module nào import `public-site/public/rate-limit-counter` (tệp đã xóa, không có tệp chuyển tiếp) | Đạt |
| SEC 1: câu SQL giữ nguyên, chỉ một bản | Câu `INSERT … ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_counter.count + 1 RETURNING count` không đổi chữ nào; `expires_at` = `windowStart + windowMs`. Test mới quét `src/`: chỉ `shared/rate-limit-counter.ts` có `INSERT INTO rate_limit_counter` | Đạt |
| SEC 2: trong `CallerPasswordMatch.check`, đếm vẫn ở giao dịch 1, trước khi đọc hash và trước argon2 | `caller-password-match.ts` chỉ đổi dòng import và chú thích | Đạt |
| SEC 3: khóa vẫn là `wifi_pw_cmp:` + `user_id` | `callerPasswordBucket` không đổi; hàm dùng chung không ghép gì vào khóa | Đạt |
| SEC 4: T58-9, 11, 12, 13, test thứ tự, test SR-RL-11 giữ và xanh | Có, và viết lại cho đúng chữ hợp đồng (T58-12 bộ đếm = 1, T58-14 đếm 3 → khởi động lại → 4, T58-15 cho OWN, OWN thứ hai, MGR) | Đạt |
| SEC 5: ngoài chuyển hàm và import, không đổi gì khác | `9e81c92d`: chỉ chuyển hàm, sửa một chuỗi ngoại lệ RLS trong `architecture.test.ts`, và test. `ce81ba5c`: đổi mã theo đúng SEC V558-01/02 (mục 2) | Đạt với `9e81c92d`; `ce81ba5c` gửi SEC xem phần chênh |

---

## 2. Khớp hợp đồng

### 2.1 Bảng ca

| Ca | Mã | Bằng chứng |
|---|---|---|
| T58-1 OWN đặt Wi-Fi → trang khách trong ngày nhận phòng hiện đúng | Ghi dạng phẳng `{ssid, password}` vào `property.wifi_info_i18n`; trang khách đọc qua `wifiOf` (chuyển sang `platform/public`, một luật đọc cho trang khách và Desk) | Ca T58-1 qua phiên khách thật |
| T58-2 số căn như một từ riêng → 422 | `ssidWords` + `ssidHasRoomNumber`; `OTTIMO401` vẫn lưu (đúng chữ hiện nay, DOM ARC-120-01 cho 0.3.14) | W14 (so chuỗi con) đỏ |
| T58-3 mật khẩu 7 ký tự → 422 | `wifiPasswordShapeOk`: rỗng hoặc 8–63 ASCII 0x20–0x7E | Ca shape |
| T58-4 GET: OWN, MGR, FDL, FD 200; HK, MT, SAL, CTV 403; FD không ghi | `x-roles` qua guard; `rbac-r5-bed` sinh từ `rbac-cases.json` | 11 ca mỗi thao tác |
| T58-5 / T58-16 không mật khẩu trong audit, log, phản hồi | Audit chỉ `ssid`, `passwordChanged`, `rule`; thực thể `property` đăng ký đúng ba khóa | Test quét mọi dòng `audit_event` của tổ chức, log mức `trace`, mọi thân lỗi và mọi phản hồi PUT. W11 đỏ; W12 tương đương (mục 3) |
| T58-6 `no-store` ở GET và PUT (cả 422); PUT không có `password` | `reply.header` ở đầu cả hai handler + `headers: NO_STORE` trên problem | W17 đỏ; W10 tương đương |
| T58-7 hai cơ sở | `UPDATE … WHERE id = $propertyId` dưới RLS | Ca T58-7 |
| T58-8 dạng cũ theo ngôn ngữ | `wifiOf`: phẳng → `raw[locale]` → `raw.vi`; Desk đọc như khách tiếng Việt | W19 đỏ |
| T58-9 tên đăng nhập nhân viên (mọi kiểu chữ, cả tài khoản khóa); mật khẩu đăng nhập của người gọi | `ssidRefused`: `lower(username)` và vai bất kỳ ở cơ sở, không lọc `revoked_at` hay `status` (DOM đồng ý). Từ `ce81ba5c`: hai lỗi lần lượt (mục 2.2) | W13, W20, W22 đỏ |
| T58-10 E2E ô trống | Phần Desk (FE-A), ngoài PR này | – |
| T58-11 6 lần trong 24 giờ: 5 lần so, lần 6 bỏ qua, 200, một audit | `count > 5` → bỏ qua; audit `skipped` chỉ khi `count = 6`. UPSERT khóa dòng nên mỗi `count` chỉ trao một lần, audit đúng một lần kể cả khi gửi song song | W1, W2 đỏ |
| T58-12 trùng mật khẩu đăng nhập, lần 1 → 422, bộ đếm = 1 và audit còn sau rollback | Bộ đếm commit ở giao dịch 1; audit trùng commit ở giao dịch riêng trước 422 | W3, W18 đỏ; test đơn vị thứ tự "count committed BEFORE the comparison" |
| T58-13 mạng mở hoặc chỉ đổi `ssid` → không so | Điều kiện `password !== ''` và khác giá trị đang lưu | W5, W6 đỏ |
| T58-14 đếm 3, khởi động lại API, PUT → 4 | Bộ đếm ở PostgreSQL | W9 đỏ |
| T58-15 `login_lockout` không đổi, vẫn đăng nhập được | Không chạm `app_user.failed_*`, `locked_until`, `approval_pin_*` | Ca so các cột trước/sau cho ba người |

### 2.2 Thay đổi ở `ce81ba5c` (SEC V558-01): ARC chấp nhận, đã sửa hợp đồng

- Mã mới chỉ so khi `errors.length === 0`, tức dạng `ssid`, dạng `password`, số căn và tên đăng nhập nhân viên đều qua.
- Hệ quả:
  - mọi lần đoán sai đều lưu Wi-Fi mới và để lại audit `property.wifi_changed`;
  - người gõ trùng mật khẩu đăng nhập kèm `ssid` sai thấy hai lỗi lần lượt, không cùng lúc.
- Chữ T58-9 cũ ("422 `NOT_ALLOWED` cả hai") không còn đúng. ARC đã sửa `contract-0.3.13.md`:
  - T58-9 ở 1.23: hai bước;
  - mục mới **1.27**: ghi quyết định và đưa câu "chỉ so khi mọi kiểm khác đã qua" vào danh sách 0.3.14 cho mô tả `setPropertyWifi`.
- `openapi.yaml` hiện ghi "chỉ so (và đếm) khi `password` đã qua kiểm dạng và khác mật khẩu Wi-Fi đang lưu". Đây là điều kiện cần, mã mới thêm điều kiện chặt hơn, không trái câu này. Không đổi phần mở rộng nên không cần PR hợp đồng gấp.
- SEC thêm câu tương ứng vào SR-RL-15 như SEC đã hẹn trong thẻ.

### 2.3 Giao dịch, khóa, idempotency, mã lỗi, phân quyền

- **Giao dịch (thứ tự ở `setPropertyWifi`):**
  1. kiểm thân lệnh;
  2. một giao dịch chỉ đọc: Wi-Fi đang lưu và luật cơ sở;
  3. nếu mọi kiểm qua và mật khẩu cần so: giao dịch đếm, commit, rồi argon2 ngoài giao dịch, rồi giao dịch audit trùng;
  4. có lỗi → 422;
  5. `UnitOfWork`: đọc lại `FOR UPDATE` lấy `before.ssid`, ghi, audit `config`.
- **Khoảng giữa bước 2 và bước 5:** hai OWN/MGR ghi cùng lúc thì người sau thắng, như hợp đồng ("không `If-Match`"). Phép so "khác giá trị đang lưu" đọc ở bước 2. Lệch ở đây chỉ làm bớt hoặc thêm một lần so, không lộ gì.
- **Khóa:** không thêm khóa ngoài khóa dòng `property` trong `UnitOfWork` và khóa dòng của UPSERT.
- **`version` của `property`:** tăng mỗi lần ghi Wi-Fi. Form khác của `property` đang mở với `If-Match` sẽ nhận 412 và phải tải lại. Đúng khóa lạc quan; tần suất rất thấp.
- **Idempotency:** hợp đồng không khai `Idempotency-Key` cho `setPropertyWifi` (PUT ghi đè). Gửi lại đúng thân lệnh sau khi lưu xong thì mật khẩu bằng giá trị đang lưu, nên không so và không đếm thêm.
- **Problem:** 422 `VALIDATION_FAILED`, `errors[{field, code}]`, `max` chỉ khi `ssid` sai độ dài. Không giá trị nào lặp lại.
- **Phân quyền:** S36 (OWN, MGR, FDL, FD đọc) và A101 (OWN, MGR ghi) qua `x-roles`. `Me.screens` S36 đã có trên `main`.
- **Dữ liệu:**
  - không migration;
  - mỗi người tối đa một dòng `rate_limit_counter` mỗi ngày;
  - job `public_site.cleanup` chạy mỗi tick 1 phút và xóa mọi dòng có `expires_at` đã qua, không theo tiền tố, nên dọn cả dòng Wi-Fi;
  - cửa sổ bắt đầu 00:00 UTC (07:00 giờ Việt Nam). Chỗ giáp hai cửa sổ cho tới 10 lần so; SEC đã chấp nhận ở SR-RL-15.

---

## 3. Đột biến

Chạy 5 tệp test (hai tệp đơn vị V5-58, `v5-58-property-wifi`, `public-site-r3-bed`, `guest-requests-s4-bed`). Số ca đỏ ở `f1ac530b` (74 ca); W16 ghi thêm kết quả ở `b790b09f`:

| # | Đột biến | Ca đỏ |
|---|---|---|
| W1 | Ngưỡng lệch một (`>=` thay `>`) | 1 |
| W2 | Audit `skipped` mỗi lần quá ngưỡng | 2 |
| W3 | Bỏ audit khi trùng | 4 |
| W5 | So cả khi bằng mật khẩu đang lưu | 3 |
| W6 | So cả mạng mở | 1 |
| W8 | Khóa bộ đếm không có `user_id` | 11 |
| W9 | Cửa sổ không cố định | 1 |
| W10 | Bỏ `headers: NO_STORE` trên problem | **0 – tương đương**: handler đã đặt `no-store` lên reply trước mọi kiểm; problem giữ header đó. Hai lớp cho cùng một kết quả, giữ cả hai |
| W11 | PUT trả mật khẩu | 4 |
| W12 | Audit `config` thêm khóa `password` | **0 – tương đương**: `defineAuditEntity('property', …)` bỏ khóa không đăng ký trước khi ghi. Đột biến này chứng minh lớp allowlist chạy |
| W13 | Kiểm tên đăng nhập bỏ qua tài khoản khóa | 1 |
| W14 | Số căn so theo chuỗi con | 3 |
| W15 | Bộ đếm trang công khai trả hằng số (SR-RL-11) | 3 |
| W16 | `expires_at` = đầu cửa sổ | `b790b09f`: **0**. `f1ac530b`: **1** (test mới "window end = start + window") |
| W17 | GET không có `no-store` | 2 |
| W18 | Trùng mà không từ chối | 3 |
| W19 | Bỏ đọc `raw.vi` | 1 |
| W20 | Bỏ luật cơ sở của `ssid` | 3 |
| W21 | Không bỏ khoảng trắng `ssid` | 4 |
| W22 | Bỏ điều kiện "mọi kiểm khác đã qua" (V558-01) | 1 |

---

## 4. Điểm ARC định nêu ở `b790b09f`, BE-D đã làm trước khi ARC viết tệp này

Không mở thẻ. Ghi lại để người sau biết vì sao mã như vậy:

1. **Hàm UPSERT ở `shared/`, không ở `public-site/public`.**
   - Ở `b790b09f`, `identity/public/caller-password-match.ts` import `public-site/public/rate-limit-counter`, trong khi `public-site` đã import `identity/public` (`RateLimiter`, `staff-directory`).
   - `module-boundaries.test.ts` không bắt chuyện này: test chỉ cấm import `internal/`. Nhưng hai module phụ thuộc hai chiều, và `identity` (lớp nền: guard, phiên, mật khẩu) phụ thuộc module tính năng của website.
   - `9e81c92d` sửa đúng theo 1.26.
2. **`expires_at` phải là cuối cửa sổ.**
   - Ở `b790b09f`, đột biến W16 (`expires_at` = đầu cửa sổ) không bị test nào bắt. Khi chạy thật, job dọn mỗi phút sẽ xóa dòng đếm ngay, nên SR-RL-15 và SR-RL-11 cùng hỏng mà không ai thấy.
   - Test mới ở `9e81c92d` khóa tham số `expires_at`.

---

## 5. ARC trả lời thẻ của vai khác

- **FB-R5-DOM-ARC-120-01** (Minor, 0.3.14, số căn dính chữ): đồng ý, theo đúng chữ DOM:
  - số căn chỉ gồm chữ số bị từ chối khi trước và sau nó không phải chữ số (`OTTIMO401`, `P-202` → chặn; `OTTIMO 2026`, `OTTIMO 4012` → được);
  - số căn có chữ giữ luật từ riêng.
  - ARC đã ghi vào danh sách 0.3.14 (hợp đồng 1.27). BE-D đổi `ssidHasRoomNumber`, không migration. DOM ghi ví dụ vào BR-012 (7).
- **FB-R5-SEC-BE-V558-01** (Suggestion): BE-D đã làm; ARC chấp nhận và sửa hợp đồng (mục 2.2).
- **FB-R5-SEC-BE-V558-02** (Suggestion): BE-D đã làm ở `ce81ba5c`.
- **FB-R5-DOM-BA-120-02, FB-R5-DOM-UXD-120-03:** việc tài liệu và phần Desk, không thuộc mã máy chủ; ARC không có ý kiến thêm.

## 6. Điểm làm tốt

- `CallerPasswordMatch` nhận tiền tố khóa và tên hành động audit làm tham số, số luật ở một hằng. Trường thứ hai cần "không được là mật khẩu đăng nhập" dùng lại được ngay.
- Ba giao dịch tách đúng chỗ, có test đơn vị khóa thứ tự commit trước khi so.
- Test T58-5/T58-16 quét cả log mức `trace` và mọi thân phản hồi, không chỉ audit.
- Test kiến trúc mới quét `src/` để chỉ một tệp có câu `INSERT INTO rate_limit_counter`. Lần sau có người chép câu SQL thì test đỏ.
- `wifiOf` chuyển nguyên văn sang `platform/public`, nên trang khách và Desk đọc một luật.

## 7. Ghi chú cho ORC

- Gộp #120 khi CI xanh ở `f1ac530b`.
- Gửi SEC phần chênh `9e81c92d..ce81ba5c`: hai tệp mã, một điều kiện và một dòng chú thích, đúng thẻ SEC đã mở.
- QA dẫn T58-9 mới (hai bước) vào ca v1.0.5 (`contract-0.3.13.md` 1.23).
- Tệp ARC sửa cùng commit này:
  - `product/docs/erd.md` 4.14 + một dòng lịch sử mục 15;
  - `contract-0.3.13.md`: T58-9 ở 1.23, chữ biên trên ÷ 5 ở 1.24, mục mới 1.27.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #120 (BE-D V5-58 Wi-Fi trên Desk, SR-RL-15) @ f1ac530b: DUYỆT** (rounds/round-05/reviews/ARC-on-be-pr-120-v5-58.md), gộp khi CI xanh. Quyết định ARC 1.26 đã làm: một hàm bumpRateLimitCounter ở shared/ (câu SQL không đổi, chỉ một bản – test quét src/), public-site và identity cùng gọi, identity không còn phụ thuộc public-site; đạt 5 điểm SEC cho HEAD mới. ce81ba5c làm SEC V558-01 (chỉ so mật khẩu khi mọi kiểm khác đã qua) và V558-02: ARC chấp nhận, sửa contract-0.3.13.md T58-9 thành hai bước và thêm mục 1.27; SEC xem lại phần chênh này. Đúng T58-1…9, 11…16; 146/146 ca đạt trên bản gộp thử với main; đột biến chỉ còn hai ca tương đương (no-store hai lớp, allowlist audit). ARC sửa erd 4.14 (khóa wifi_pw_cmp:<user_id>, cửa sổ cố định 24 giờ từ 00:00 UTC, giao dịch riêng, job dọn mọi khóa hết hạn); openapi setPropertyWifi đã ghi SR-RL-15 từ 1f nên không sửa. Đồng ý DOM ARC-120-01 cho 0.3.14 (số căn chỉ gồm chữ số bị từ chối khi không dính chữ số khác). 0.3.14 thêm: câu V558-01 trong mô tả setPropertyWifi, giá căn ≤ 0 → VALUE_OUT_OF_RANGE, chặn isSellable khi căn chưa có giá, OpenRefund.reasonCode. Không thẻ mới trên PR, không ESC. |`
