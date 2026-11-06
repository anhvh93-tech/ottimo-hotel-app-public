# ARC review PR #151 (BE-B) – bỏ chập chờn ở test API: quét rò rỉ không tính id ngẫu nhiên, B18 tự đọc version, (6b) xếp hàng khóa

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#151](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/151), nhánh `r5-be-b-flaky-tests`, HEAD **`309df36b`** (draft, `base = main`). Mã test ở `5a161562`; `309df36b` là merge `main`.
- Quy mô: 7 tệp, +124/−34, **tất cả nằm trong `services/api/test/`**. Không có `src`, không migration, không đổi hợp đồng.
- Ba câu ORC hỏi:
  - có kiểm tra nào yếu đi không (mỗi bản sửa một đột biến);
  - vòng thử lại khóa có che deadlock thật, hay làm hủy test của tệp khác không;
  - helper có đặt đúng chỗ cho test sau này không.
- Cách kiểm:
  - Worktree `arc-151-wt` trong scratchpad, không push vào nhánh PR.
  - PostgreSQL 17 riêng: container `arc-149-pg`, dùng lại từ review #149, chỉ nghe `127.0.0.1:55617`, mật khẩu CI công khai. Migration của cây #151 trùng với cây #149.
  - Đột biến chạy bằng script ngoài repo. Probe tải là một script `pg` trong scratchpad.
  - Worktree và container được xóa khi ARC xong đợt review này. Không gọi staging hay production. Không có bí mật hay dữ liệu khách.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện | Thẻ ARC mới |
|---|---|---|---|
| **#151 @ `309df36b`** | **DUYỆT** | Không | 151-01 (Suggestion) |

- Không kiểm tra nào yếu đi. Mỗi bản sửa có ít nhất một đột biến của ARC (khác đột biến BE-B đã chạy) làm test đỏ. Ca lp-v2 còn **chặt hơn** trước: cùng một đột biến, test cũ xanh, test mới đỏ (mục 1).
- Vòng thử lại khóa của (6b) chỉ bắt `55P03`. Mỗi lần chờ ngắn hơn hẳn mốc `deadlock_timeout` 1 s, nên không thể biến một deadlock thật giữa hai đường mã sản phẩm thành xanh. Probe tải chạy cùng lúc: không phiên nào bị hủy, không có `40P01` (mục 2).
- Helper `test/helpers/random-free.ts` đặt đúng chỗ, cạnh các fixture sinh ra chính các giá trị ngẫu nhiên mà nó che (mục 3).
- Thẻ 151-01 (Suggestion): chú thích nói mỗi lần thử chỉ chờ 150 ms. Nhưng theo PostgreSQL, `lock_timeout` tính riêng cho **từng** khóa, nên một câu `LOCK` bốn bảng có thể chờ tới 4 × 150 ms. Vẫn dưới các mốc 1 s, nhưng lề an toàn hẹp hơn chú thích nói.

## 1. Không kiểm tra nào yếu đi: đột biến từng bản sửa

Mỗi đột biến một chỗ, chạy lại tệp test liên quan, rồi trả mã về.

| # | Bản sửa | Đột biến ARC | Kết quả |
|---|---|---|---|
| F1 | lp-v2 ca 1: quét body, payload token được **giải mã**, bỏ chữ ký | `price-estimate.service.ts`: thêm khóa `floor` vào payload token | **PR: đỏ** đúng ca 1. **Test trên `main`: xanh 21/21**, vì chuỗi base64 giấu khóa này. Vậy bản mới chặt hơn |
| F2 | US-022: `withoutRandomIds(kid.body)` | `party.service.ts`: tên trẻ "Bé Na" quay lại trong `members[].priceAgeBand` (BE-B đã thử năm sinh; ARC thử tên) | **Đỏ** đúng ca US-022 |
| F3a | B18 tự đọc version | Ca US-022 dừng giữa chừng: `throw` ngay trước lệnh xóa trẻ, khi version đã đổi mà chưa lưu | **Chỉ US-022 đỏ**, B18 xanh. Mỗi lỗi chỉ báo một lần |
| F3b | (đối chứng) | Cùng đột biến trên test của `main` | **US-022 và B18 cùng đỏ**: đúng chuỗi lỗi CI run 42282981812 |
| F3c | B18 vẫn giữ chốt chặn | `checkout.service.ts`: bỏ lệnh từ chối `BALANCE_DUE` | **Đỏ** đúng ca B18 |
| F4 | (6b) xếp hàng khóa | Lần chạy "như phát hành" bỏ qua các câu `NO FORCE` và `DISABLE ROW LEVEL SECURITY`, tức RLS vẫn bật | **Đỏ** đúng ca (6b) |
| F5a | `approvals-refund-payout:469` | `validation.ts`: 422 `CARD_NUMBER_DETECTED` trả lại giá trị trong `detail` | **Đỏ** đúng ca BUG-R5-006 |
| F5b | `guest-requests-s4-bed:358` | `guest-requests.service.ts`: 422 trả lại ghi chú trong `detail` (đường này có kiểm riêng, không qua `validation.ts`) | **Đỏ** đúng ca kiểm `createGuestRequest` |

Ghi chú về đột biến:
- Lần F4 đầu, ARC chỉ bỏ câu `DISABLE` thì test vẫn xanh. Đó là do đột biến không đổi gì: câu `NO FORCE` vẫn còn, nên chủ bảng vẫn bỏ qua RLS. Bỏ cả hai câu thì test đỏ. Vậy ca (6b) vẫn kiểm đúng điều nó cần: 0078 phải tắt RLS thì mới điền được mốc lưu giữ.
- Kiểm (6b) giữ nguyên: số dòng điền ≥ 2 và ≥ 1, mốc từng ảnh, rollback trả lại `null`, lần đối chứng RLS bật ra 0 dòng. Lần đối chứng không còn khóa bảng. Cách đó đúng: chỉ có DML, không có DDL. RLS bật và không có ngữ cảnh tenant thì không thấy dòng nào, nên cũng không chờ khóa dòng nào.
- B18 không phải race. Kết quả F3b khớp với cách BE-B giải thích. B18 tự đọc version cũng không bỏ mất kiểm tra nào của nó: các kiểm tra về version (412 khi dùng version cũ, `kidV`) vẫn nằm trong US-022.

## 2. (6b): thử lại khóa có che deadlock thật hay làm hủy tệp khác không

Cách mới:
- `SET LOCAL lock_timeout = '150ms'`, rồi `LOCK TABLE reservation, attachment, work_order, inspection IN ACCESS EXCLUSIVE MODE` (không `NOWAIT`);
- lỗi `55P03` thì `ROLLBACK`, chờ ngẫu nhiên 20–80 ms rồi thử lại, tổng tối đa 60 s;
- mọi mã lỗi khác thì ném ra ngay;
- ca được 120 s.

| Câu hỏi | Trả lời |
|---|---|
| Che deadlock thật? | **Không.** Chỉ `55P03` (hết `lock_timeout`) được thử lại; `40P01` và mọi lỗi khác vẫn đỏ. Deadlock giữa **hai đường mã sản phẩm** ở tệp khác không liên quan tới phiên này, nên vẫn báo `40P01` như cũ. Còn chu trình chờ có phiên này tham gia thì phiên này bỏ cuộc ở 150 ms, trước khi phiên kia chạm `deadlock_timeout` (1 s). Đó là phiên "migration giả" của test tự nhường, không phải lỗi sản phẩm bị che. Trên production, migration chạy trước khi api khởi động |
| Làm hủy tệp khác? | **Không**, theo số đo bên dưới. Mốc thấp nhất ở nơi khác: `statement_timeout` 1 s (`price-estimate.service.ts`), `lock_timeout` 1 s (`SIMULATE_LOCK_TIMEOUT_MS`, `b16-preview-v101`), `deadlock_timeout` 1 s (mặc định; không có cấu hình nào đổi). Khi đã giữ đủ bốn khóa, các câu trong 0078 chỉ đụng đúng bốn bảng đó (`UPDATE attachment … FROM work_order / inspection / reservation`), nên không chờ thêm khóa nào trong lúc đang giữ |
| Thứ tự khóa | `reservation` đứng đầu, lấy khi chưa giữ gì. Vì vậy không bao giờ giữ ba bảng kia trong lúc chờ bảng bận nhất |

Probe tải của ARC (scratchpad, vai `ottimo_app`), chạy 75 s, cùng lúc với 3 lượt ca (6b):
- 3 phiên đọc `reservation`, `attachment`, `work_order` mỗi 5 ms, với `statement_timeout = 1s`;
- 2 phiên tạo dạng deadlock: giữ `attachment` (ROW EXCLUSIVE), chờ 30 ms, rồi đọc `reservation`, tức ngược thứ tự khóa của test.

| Phiên | Số lần | Chờ lâu nhất | Lỗi |
|---|---|---|---|
| Đọc `reservation` (timeout 1 s) | 10 816 | 151 ms | 0 |
| Đọc `attachment` (timeout 1 s) | 10 839 | 151 ms | 0 |
| Đọc `work_order` (timeout 1 s) | 11 055 | 44 ms | 0 |
| Chu trình `attachment` → `reservation`, phiên 1 | 1 557 | 189 ms | 0 (không `40P01`) |
| Chu trình `attachment` → `reservation`, phiên 2 | 1 558 | 189 ms | 0 |
| Ca (6b), 3 lượt | – | 9–12 s mỗi lượt | **3/3 xanh** |

- Mức chờ lâu nhất 151 ms, tức đúng bằng `lock_timeout`. Điều này cho thấy probe có tranh khóa thật với test, và phiên test nhường đúng như thiết kế.
- Chu trình ngược thứ tự không sinh `40P01` lần nào.

## 3. Helper `withoutRandomIds`: chỗ đặt và phạm vi

- Chỗ đặt đúng:
  - `test/helpers/random-free.ts` nằm cạnh `reservations-fixture.ts` và `sales-fixture.ts`, chính là hai nơi sinh mã `KH-<6 hex>` ngẫu nhiên. Test đơn vị đặt ở `test/random-free-units.test.ts`, theo quy ước `*-units.test.ts` của thư mục;
  - test API sau này chỉ cần một import, như ba tệp trong PR;
  - test của gói khác (admin-web, guest-web, E2E `product/tests`) không được import chéo vào `services/api/test`. Khi nào có nhu cầu thì chuyển helper sang một gói test dùng chung, không chép.
- Phạm vi hẹp, đúng mức:
  - chỉ thay UUID đầy đủ (8-4-4-4-12) và `KH-` theo đúng 6 ký tự hex thường;
  - mã khách do máy chủ cấp có dạng `KH-` + 4 số (`doc_code_format.guest`, `padWidth` 4, migration 0002), nên được giữ nguyên, như ca `KH-2018` trong test đơn vị. Mã chỉ dài tới 6 chữ số khi một tổ chức có từ 100 000 khách trở lên, điều không xảy ra trong test.
- Rà cùng mẫu: ARC tự `grep` lại các `not.toContain`/`not.toMatch` có chuỗi kiểm hex ngắn (≤ 6 ký tự) trong `test/`. Kết quả chỉ ra các chỗ BE-B đã ghi "đã xem, không cần sửa": `reservations:220` (mảng), `sales:370` (văn bản cố định), `sec-r3-q17:441` (dòng trên đã so khớp toàn bộ), `v09-reference-card-units:111`, `v104-card-rule-shared:133` (test đơn vị). Không còn chỗ nào sót.
- Việc của ARC, ngoài PR này: thêm một dòng vào `CONTRIBUTING.md` (mục chiến lược test) rằng quét rò rỉ trên cả body thì dùng `withoutRandomIds`. Nhờ vậy người viết test sau sẽ tìm thấy helper.

## 4. Chạy trên `309df36b`

| Lệnh | Kết quả |
|---|---|
| 6 tệp đổi (cơ sở) | 6 tệp, 70/70 ca đạt |
| `pnpm --filter @ottimo/api typecheck` | Sạch |
| `vitest run` toàn bộ API (PostgreSQL 17 tạm, cổng riêng, mật khẩu CI công khai) | 205 tệp đạt, 5 020 ca đạt, 24 bỏ qua, 1 todo. 1 tệp đỏ: `production-bootstrap.test.ts` báo `BOOTSTRAP_DATABASE_URL must be a freshly created database`, vì CSDL bootstrap của ARC đã dùng ở lượt chạy trước, không do #151. Tạo lại CSDL đó rồi chạy riêng tệp: 11/11 đạt |
| `git merge-tree origin/main arc/pr151` (`main` @ `456f259a`, kiểm lại @ `8598bb5a`) | Không xung đột |

## 5. Thẻ feedback ARC

### FB-R5-ARC-BE-151-01
- Mức độ: **Suggestion** (không chặn gộp)
- Người sửa: BE-B
- Vị trí: `test/integration/sec-be65-retention.test.ts`, `asMigrator` (hằng `LOCK_WAIT_MS` và chú thích phía trên).
- Vấn đề:
  - Theo tài liệu PostgreSQL, `lock_timeout` áp **riêng cho từng lần xin khóa**. Câu `LOCK TABLE reservation, attachment, work_order, inspection` xin bốn khóa lần lượt, nên một lần thử có thể kéo dài tới khoảng 600 ms. Trong đó tới khoảng 450 ms phiên test vẫn giữ `reservation` (ACCESS EXCLUSIVE) trong lúc chờ ba bảng kia.
  - Chú thích lại nói mỗi lần thử chỉ chờ `LOCK_WAIT_MS`.
  - Probe của ARC chỉ đo được tối đa 151 ms, và 450 ms vẫn dưới các mốc 1 s. Chỉ có lề an toàn hẹp hơn chú thích nói.
- Vì sao quan trọng: tệp khác sau này đặt `statement_timeout` dưới 500 ms trên một đường đọc `reservation` thì có thể bị hủy. Người đọc chú thích sẽ không ngờ tới.
- Đề xuất sửa: giới hạn **cả câu `LOCK`**.
  - Trước câu `LOCK`, đặt `SET LOCAL statement_timeout = '150ms'`; sau khi khóa xong, trả lại mức cũ (ví dụ `SET LOCAL statement_timeout = '30s'`).
  - Thử lại khi gặp `55P03` **hoặc** `57014`.
  - Sửa chú thích cho khớp.
- Trạng thái: Open

## 6. Điểm làm tốt

- Mỗi ca chập chờn có nguyên nhân được tái hiện, không chỉ nới thời gian chờ. Ví dụ B18: BE-B tái hiện được 412 `currentVersion: 8` y như CI.
- Ca lp-v2 vừa hết chập chờn vừa chặt hơn, vì nay quét luôn nội dung token.
- Thử lại khóa chỉ bắt đúng một mã lỗi, có hạn tổng, có chờ ngẫu nhiên, và có giải thích vì sao an toàn cho tệp khác.

## 7. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC duyệt BE-B #151 @ `309df36b` (chỉ test, 7 tệp dưới `services/api/test`). Không kiểm tra nào yếu đi: 8 đột biến ARC đều đỏ; riêng lp-v2 nay chặt hơn (khóa lạ trong payload token: test mới đỏ, test cũ xanh). (6b) chỉ thử lại `55P03`, mỗi lần chờ dưới `deadlock_timeout`; probe 75 s với 3 phiên đọc `statement_timeout` 1 s và 2 phiên khóa ngược thứ tự: 0 lỗi, 0 `40P01`, chờ lâu nhất 151–189 ms. `withoutRandomIds` đặt ở `test/helpers`, chỉ che UUID và `KH-<6 hex>` của fixture. Thẻ 151-01 Suggestion: giới hạn cả câu `LOCK` bằng `statement_timeout`. ARC thêm một dòng về helper vào `CONTRIBUTING.md` | ARC | rounds/round-05/reviews/ARC-on-be-b-pr-151.md |
