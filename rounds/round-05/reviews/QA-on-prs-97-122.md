# QA review PR #97 (MOB V5-15 "Báo cần dọn") và PR #122 (FE-A V5-14 T14-6 Giữ chỗ theo giá gõ)

- Round 5 (v1.0.5), bước **Review**, góc kiểm thử. Người review: QA. Ngày 07/11/2026.
- PR:
  - **#97** `r5-mob-v5-15-clean` @ **`d3081f93`** (cắt từ `main` @ `ab1fc4ae`). 12 tệp, 1 tệp test mới `apps/mobile/src/__tests__/v105-needs-cleaning.test.tsx` (15 ca).
  - **#122** `r5-fe-v5-14`: đọc diff ở **`6dd07bf5`** (cắt từ `main` @ `4003471e`, chưa có #103). FE-A đã gộp `main` hai lần, không đổi mã của PR (ARC: cùng `patch-id`): `c783a59f` (có #103) rồi **`44535cfe`** (có thêm #111). `44535cfe` giống hệt bản gộp thử của QA (mục 8) ở `apps/admin-web`, `packages` và `tests/e2e` (`git diff` rỗng). Kết luận áp cho `6dd07bf5` và `44535cfe`.
- Đã đọc:
  - hợp đồng 0.3.13 mục 1.3, 1.4 (T15-8), 1.17, 1.26 (bổ sung 1f, PR #111);
  - báo cáo MOB `rounds/round-05/outputs/MOB/report.md` mục V5-15; báo cáo FE `rounds/round-05/outputs/FE/v5-14-hold-typed-rates-fea.md` (trong #122);
  - review của làn khác, để không lặp thẻ: `UXD-on-prs-97-116-117-118-122.md` (PR97-01…03, PR122-01…04), `SEC-on-prs-111-118-122.md` (#122 DUYỆT), `DOM-on-prs-112-121-122.md` (#122 DUYỆT CÓ ĐIỀU KIỆN, BA-122-01), `ARC-on-fe-mob-prs-97-116-118-122.md` (có sau khi QA viết bản đầu; thẻ trùng ghi ở từng thẻ QA dưới đây);
  - oracle QA: `rounds/round-05/qa/v1.0.5-test-cases.md` TC-V105-S1-06 và mục 2.2 của `QA-on-be-pr-103-s1.md`.
- Mã đã đọc ngoài diff:
  - #97: máy chủ `housekeeping/internal/rules.ts` `allowedEvents`, `housekeeping.service.ts` `scopeRooms` (HK chỉ trong phạm vi T: việc của ngày, không hủy, chưa giao ai hoặc giao cho chính mình); hàng đợi PWA `queue/queue.ts` `classify()`;
  - #122: `BookingDialog.tsx` `priceWaiting`, `create()`, `hold()`; `QuoteDialog.tsx` (có mã quay lại); mock `mocks/reservations.ts`.

Cách kiểm:
- Mỗi PR một worktree tách riêng trong scratchpad, `pnpm install --offline`. Không checkout bản làm việc chung. Xóa sau review.
- Chạy tệp test của PR, rồi cả bộ của app, ở SHA của PR và ở bản gộp thử với `main` (mục 8).
- Thử đột biến (mutation) bằng tay trên mã sản phẩm, mỗi lần một chỗ, chạy lại tệp test của PR (mục 2, mục 4).
- Viết tệp test dò (probe) cho chỗ QA thấy thiếu, chỉ trong worktree, **không commit**.
- Không gọi staging hay production. Tệp này không có bí mật, mật khẩu hay dữ liệu khách.
- CI: gitleaks đỏ ở `c783a59f` do một commit trên `r5-s1-tests` (SEC sửa allowlist, ORC báo), shellcheck đỏ ở `c783a59f` là ca kiểm `postgres-log-terse` chập chờn (thẻ OPS-11). Cả hai không do PR, và đã xanh ở `44535cfe`. Job `format · lint · audit · test · build` của `44535cfe` còn chờ lúc viết.

---

## 0. Kết luận

| PR | SHA | Kết luận QA | Điều kiện |
|---|---|---|---|
| #97 | `d3081f93` | **DUYỆT CÓ ĐIỀU KIỆN** | (1) MOB gộp `main` (hiện **xung đột** ở `wireframes/assets/strings.js` sau #111 `eeb78698`; sinh lại bằng `gen_strings.py`) và sửa UXD PR97-01 (đưa nút ra khỏi ô nút chính). CI xanh trên SHA mới, QA chạy lại 15 ca và cả bộ mobile trên SHA đó. Khi #102 gộp trước: giữ **một** dòng `hk.action.needs_cleaning`. (2) Thẻ QA 97-01 có test và xanh **trước tag v1.0.5**; nên làm cùng lượt sửa PR97-01. (3) Staging v1.0.5: TC-V105-15-01…14 đạt (-05 là ca thăm dò, không chặn) |
| #122 | `6dd07bf5`, `44535cfe` | **DUYỆT CÓ ĐIỀU KIỆN** | (1) CI của `44535cfe` xanh, và T14-6 E2E **chạy và qua**. Cổng CI "UI cases ran" làm job đỏ nếu T14-6 bị bỏ qua (run `42264842764` @ `6dd07bf5` đã đỏ vì vậy). QA đọc `junit.xml` của job. (2) Thẻ 122-01 (cùng UXD PR122-03) trước tag, hoặc ORC và UXD ghi là giới hạn đã biết của v1.0.5. (3) Staging: TC-V105-S1-06 đạt |

- 0 Blocker · 0 Major · 2 Minor · 3 Suggestion. **Không có lỗi sản phẩm làm sai tiền hay sai trạng thái.**
  - #97: mã đúng ở cả 4 ca probe. Thẻ là thiếu test.
  - #122: tiền của đơn luôn đúng (máy chủ tính cọc từ giá gõ). Lệch là số trên hộp trong lúc bản xem giá gõ chưa về (thẻ 122-01).
- ESC mới: **không**.

---

## 1. PR #97 – đối chiếu với oracle và ca QA

Oracle QA (ghi vào `v1.0.5-test-cases.md` mục 3):
- một lần chạm = một lệnh, kể cả chạm đúp, mất mạng, mất câu trả lời;
- `performedAt` = giờ chạm, không phải giờ gửi;
- 409 có `currentState = OD` = "Đã áp dụng"; 409 trạng thái khác và 404 → "Cần xem lại", không mất lặng lẽ;
- HK ngoài phạm vi T không thấy nút, giống máy chủ.

| Yêu cầu | Test của PR | QA |
|---|---|---|
| T15-8: căn OC có nút; chạm → chờ 10 giây → gửi `needs_cleaning` từ OC một lần | Ca "OC room: the button shows…" | Đủ. Vị trí nút đổi theo UXD PR97-01, test tìm theo vai và tên nên không vỡ |
| Hoàn tác trong 10 giây | Ca "Hoàn tác within 10 s" | Đủ. Probe P4: hoàn tác rồi chạm lại → khóa mới, một lệnh |
| Chỉ khi máy chủ liệt kê `needs_cleaning` | Ca "only when the server lists…" | Đủ |
| Bảo trì không có nút | Ca "maintenance (read only) never gets the button" | **Không giữ được điều kiện `writable`** (đột biến M4 sống): mock không cho bảo trì sự kiện nào, nên ca qua cả khi bỏ điều kiện. Thẻ 97-02 |
| HK chỉ trong phạm vi T | Ca "housekeeping: only inside scope T" | Có, nhưng mock `inHkScope` bỏ qua người được giao và ngày của việc, rộng hơn `scopeRooms`. Thẻ 97-02 |
| Mất mạng: vẫn chạm được, giữ trên máy, gửi một lần khi có mạng | Ca "offline: still tappable…", "Thao tác trên máy names the action" | Đủ cho một lần chạm. **Chạm đúp khi mất mạng rồi gửi muộn, giữ `performedAt`**: không có ca. Thẻ 97-01 (probe P2) |
| Chạm đúp trước khi màn vẽ lại | Ca "two taps before the screen re-draws" | Đủ (M1 chết) |
| Mất câu trả lời: gửi lại cùng `Idempotency-Key` | Ca "answer lost on a weak network" | Đủ |
| 409 OD (Desk bấm trước) = đã áp dụng | Ca "desk pressed it first", ca đơn vị `classify` | Đủ (M2 chết) |
| 409 trạng thái khác (VD) → "Cần xem lại" kèm trạng thái | Ca "state changed otherwise" | Đủ |
| **404 khi gửi** (HK ra khỏi phạm vi T trong lúc chờ) → "Cần xem lại" | Không có | Thẻ 97-01 (probe P3) |
| Chuỗi bước: Báo cần dọn rồi Bắt đầu dọn trong lúc chờ → hai lệnh đúng thứ tự | Ca overlay "next step is Bắt đầu dọn only" (chỉ kiểm nút hiện) | **Không có ca gửi**. Thẻ 97-01 (probe P1) |
| Khử trùng lặp không tính mục bị từ chối, xét cả `expectedFrom` | Ca đơn vị `waitingRoomEvent` | Đủ (M5, M6 chết) |
| Nhãn không trùng chữ bộ lọc/trạng thái | Ca "button label…" | Đủ |
| Hồi quy V5-1B hộp thư (PR #117) | Không thuộc PR | QA gộp thử với `main` @ `16ea5183` (có #117): `v105-hold-notices` xanh, cả bộ 181/181 (mục 8) |
| T15-8 trên PWA staging, chạm đúp khi mất/có mạng, HK ngoài phạm vi T | – | Ca STG TC-V105-15-01…14 (mục 3 của tệp test case) |

---

## 2. PR #97 – đột biến và probe

| Mã | Đột biến (mã sản phẩm) | Kết quả |
|---|---|---|
| M1 | `actions.ts`: bỏ khử trùng lặp (`if (same) return same;`) | Chết: "two taps before the screen re-draws" |
| M2 | `actions.ts`: `targets: []` cho `needs_cleaning` (409 OD không còn là đã áp dụng) | Chết: "desk pressed it first" |
| M3 | `overlay.ts`: bỏ lớp phủ OD → `['start_cleaning']` | Chết: 2 ca |
| M4 | `RoomPage.tsx`: bỏ `writable &&` | **Sống**. Thẻ 97-02 |
| M5 | `queue.ts`: khử trùng lặp tính cả mục bị từ chối | Chết: ca `waitingRoomEvent` |
| M6 | `queue.ts`: khử trùng lặp bỏ qua `expectedFrom` | Chết: ca `waitingRoomEvent` |

Probe (tệp tạm `qa-probe-v105.test.tsx`, không commit), **4/4 qua** ở `d3081f93`:
- P1: chạm Báo cần dọn, rồi Bắt đầu dọn trong lúc chờ → hai lệnh đúng thứ tự, OC → OD rồi OD → CL;
- P2: chạm đúp cùng nhịp, mất mạng 20 phút, có mạng lại → một lệnh, `performedAt` = giờ chạm;
- P3: HK, việc bị hủy trước khi gửi (ra khỏi phạm vi T) → 404 → "Cần xem lại", không bị bỏ;
- P4: hoàn tác rồi chạm lại → khóa mới, một lệnh.

---

## 3. PR #122 – đối chiếu với TC-V105-S1-06 và T14-6

| Ý của TC-V105-S1-06 | Test của PR | QA |
|---|---|---|
| (a) `saveQuote` có `edited: true` ở đêm gõ, đêm không gõ `edited: false` + giá lịch máy chủ, không số 0 | Vitest 2 ca (Trực tiếp, CTV) + E2E T14-6 (a) | Đủ (F1, F3 chết). Nhánh "không gửi 0": thẻ 122-03 |
| (b) Cọc trên hộp = cọc tính từ giá gõ = `depositRequiredVnd` của đơn | Vitest + E2E (b), **sau khi** bản xem giá gõ đã về | Đủ ở trạng thái đã ổn định. **Trong lúc bản xem giá gõ đang chờ**, hộp hiện cọc cũ mà nút Giữ chỗ vẫn bấm được: probe Q1. Thẻ 122-01 (cùng UXD PR122-03) |
| (c) Có mã quay lại: hộp hiện 665.000 và giá trước giảm 700.000 | – | **N/A ở hộp Đặt phòng mới**: `BookingDialog` không có ô mã quay lại (chỉ `QuoteDialog` có). Nhánh có mã dựa TC-V105-S1-01 (API) và thẻ BE S1-01. Sửa ca ở tệp test case |
| (d) Đêm của đơn = giá gõ | Vitest (mock) + E2E (c) | Đủ |
| (e) Khóa nút v1.0.4 (TC-V104-RG-15) | PR xóa `v104-hold-typed-rate-lock.test.tsx` | Đúng hướng (F8 chết: đưa khóa cũ lại thì đỏ). **TC-V104-RG-15 hết hiệu lực khi #122 vào bản cắt**; #122 không vào thì RG-15 giữ nguyên |
| Giữ chỗ không mang giá (`createHoldFromQuote`) | Vitest: thân chỉ `{ holdHours, depositMethod }`; mock trả 422 `NOT_ALLOWED` nếu có trường giá | Đủ (F2 chết) |
| Giá ngoài sàn–trần: câu ở đúng ô, không tạo đơn; sửa lại thì câu mất | Vitest | Đủ (F7, F10 chết). Chữ câu: UXD PR122-01 |
| Ô giá chỉ đọc khi giữ chỗ đang chạy | Vitest | Đủ (F6 chết) |
| T14-6 chạy thật trên máy chủ V5-14 | E2E `ui-clock/v5-14-hold-typed-rate.r5.spec.ts` | Có `test.skip` động: bỏ qua khi bản xem không trả giá gõ. Trên CI không lọt được (cổng "UI cases ran" làm job đỏ), nhưng lỗi máy chủ sẽ hiện thành "bỏ qua" với lý do sai. Thẻ 122-02 |

---

## 4. PR #122 – đột biến và probe

| Mã | Đột biến (`BookingDialog.tsx`) | Kết quả |
|---|---|---|
| F1 | Giữ chỗ gửi `edited: true` cho mọi đêm | Chết: 2 ca |
| F2 | Giữ chỗ bỏ `nightlyRates` (BUG-R4-041) | Chết: 3 ca |
| F3 | Bản xem bỏ `edited` | Chết |
| F4 | Bản xem không gửi giá gõ | Chết |
| F5 | Bỏ chặn "không gửi đêm 0" (`typedNights?.some((n) => !(n.amountVnd > 0)) && !v.rates`) | **Sống**: `validate()` đã chặn ô trống trước. Thẻ 122-03 |
| F6 | Ô giá không chỉ đọc khi đang giữ chỗ | Chết |
| F7 | Lỗi sàn–trần không gắn vào ô | Chết |
| F8 | Đưa khóa v1.0.4 trở lại | Chết |
| F10 | Không xóa câu sàn–trần sau khi sửa | Chết |

Probe Q1 (tệp tạm `qa-probe-v514.test.tsx`, không commit), chạy lại 07/11 trên bản gộp thử:
- Hộp Đặt phòng mới, căn 203, 2 đêm từ ngày mai. Mock làm chậm bản xem có `nightlyRates` 2,5 giây (giả lập mạng chậm; thực tế là 300 ms chờ gõ cộng thời gian mạng).
- Gõ đêm 1 = 2.500.000, chờ 600 ms, bấm **Giữ chỗ đến …**.
- Kết quả: `{"before":500000,"shownAtClick":500000,"enabledAtClick":true,"typedDeposit":1000000,"held":1000000}`.
  - Lúc bấm, "Cọc cần thu" trên hộp là **500.000** (theo lịch), nút bấm được.
  - Đơn giữ chỗ tạo với cọc **1.000.000** (theo giá gõ, đúng).
- Vậy tiền của đơn đúng; câu lễ tân đọc cho khách thì sai trong khoảng chờ. Đây là đúng tình huống UXD PR122-03 mô tả bằng lời; Q1 là bằng chứng chạy được.

---

## 5. Thẻ

### FB-R5-QA-MOB-97-01
- Mức độ: **Minor**. Trước tag v1.0.5. Nên làm cùng lượt sửa UXD PR97-01 (cùng tệp `RoomPage.tsx` và tệp test).
- Vị trí: `apps/mobile/src/__tests__/v105-needs-cleaning.test.tsx`.
- Vấn đề: ba đường của hàng đợi chưa có test, dù mã đúng (probe P1–P3 qua ở `d3081f93`):
  1. chuỗi bước: Báo cần dọn rồi Bắt đầu dọn trong lúc lệnh đầu còn chờ → hai lệnh đúng thứ tự (ca hiện có chỉ kiểm nút kế tiếp hiện ra);
  2. chạm đúp khi mất mạng, gửi muộn sau 20 phút → một lệnh, `performedAt` = giờ chạm (ca mất mạng hiện có chỉ một lần chạm và không kiểm `performedAt`);
  3. 404 lúc gửi (HK ra khỏi phạm vi T trong lúc chờ: việc bị hủy hoặc giao người khác) → "Cần xem lại", không bị bỏ.
- Vì sao quan trọng:
  - (1) Thứ tự sai thì OD → CL tới trước OC → OD: máy chủ trả 409, buồng phòng thấy "Cần xem lại" ngay khi đang dọn.
  - (2) `performedAt` là giờ ghi ở Nhật ký thao tác. Gửi muộn mang giờ gửi thì giờ "báo cần dọn" sai, và một lần chạm đúp có thể thành hai việc dọn.
  - (3) Lệnh mất lặng lẽ thì căn không vào danh sách cần dọn, khách đang ở không được dọn.
- Đề xuất sửa (chỉ thêm test, theo probe P1–P3):
  - (1) chạm Báo cần dọn, rồi Bắt đầu dọn trong 10 giây; sau khi gửi: đúng 2 POST `transitionRoomStatus`, `event` `needs_cleaning` rồi `start_cleaning`, `expectedFrom` OC rồi OD;
  - (2) tắt mạng, chạm hai lần cùng nhịp, tiến đồng hồ 20 phút, bật mạng: 1 POST, `performedAt` = giờ chạm;
  - (3) HK trong phạm vi T, tắt mạng, chạm; mock trả 404 cho căn đó; bật mạng: mục ở "Cần xem lại", căn vẫn OC.
- Trạng thái: Open

### FB-R5-QA-MOB-97-02
- Mức độ: **Suggestion**. **Trùng FB-R5-ARC-MOB-97-02 (Minor)**, ARC nêu thêm thứ tự kiểm của mock. MOB làm một lần theo thẻ ARC; QA đóng thẻ này cùng lúc.
- Vị trí: `apps/mobile/src/mocks/handlers.ts` `inHkScope`, `entry()`; ca "maintenance (read only) never gets the button" và "housekeeping: only inside scope T".
- Vấn đề:
  1. `inHkScope` của mock chỉ xét căn có việc, bỏ qua ngày của việc và người được giao. Máy chủ (`scopeRooms`) chỉ tính việc của ngày, không hủy, **chưa giao ai hoặc giao cho chính mình**. Ca "việc hôm nay giao cho buồng phòng khác → không có nút" không dựng được trên mock.
  2. Mock cho bảo trì `allowedEvents = []`, nên ca bảo trì qua cả khi bỏ `writable &&` (đột biến M4 sống). Điều kiện `writable` hôm nay không được test nào giữ.
- Vì sao quan trọng: mock rộng hơn máy chủ thì test xanh mà app có thể hiện nút cho HK không được phép (máy chủ sẽ trả 403/404, lệnh vào "Cần xem lại").
- Đề xuất sửa:
  - (1) `inHkScope` xét `dueDate = hôm nay`, `status != cancelled`, `assignedUserId` rỗng hoặc là người gọi; thêm ca "việc giao cho HK khác → không có nút".
  - (2) Một ca bảo trì với mục căn có `needs_cleaning` trong `allowedEvents` (giả lập máy chủ trả nhầm): vẫn không có nút. Hoặc ghi chú trong test rằng `writable` chỉ là lớp phòng thủ thêm, máy chủ là nơi chặn.
  - v1.0.5 nếu MOB làm cùng 97-01; không thì v1.0.6.
- Trạng thái: Open

### FB-R5-QA-FE-122-01
- Mức độ: **Minor**. Cùng chỗ và cùng hướng sửa với **FB-R5-UXD-FE-PR122-03**. Thẻ QA thêm bằng chứng và ca test; không đòi sửa thứ hai.
- Vị trí: `apps/admin-web/src/pages/booking/BookingDialog.tsx`: `priceWaiting = !!liveKey && calcFor !== liveKey` (dòng 556, khóa xem giá không gồm giá gõ); `hold()` không xét `priceWaiting`, `create()` có (dòng 809).
- Vấn đề:
  - Từ lúc gõ giá tới khi bản xem có giá gõ về (300 ms chờ gõ + thời gian mạng), "Cọc cần thu" vẫn là cọc theo lịch, và nút Giữ chỗ bấm được.
  - Probe Q1: bấm lúc đó → hộp hiện 500.000, đơn giữ chỗ cọc 1.000.000. Oracle T14-6 (b) "cọc trên hộp = cọc của đơn" sai trong khoảng này.
  - Test của PR (và E2E) chỉ kiểm sau khi bản xem đã về, nên không bắt được.
  - Giả định 2 của FE ("Tạo đơn" và "Giữ chỗ" không chờ bản xem có giá gõ) QA **chấp nhận**, với điều kiện hộp không hiện số cũ như số thật.
- Vì sao quan trọng: lễ tân chốt giá qua điện thoại thường đọc ngay "Cọc cần thu" rồi bấm Giữ chỗ. Khách nghe 500.000, tin nhắn giữ chỗ đòi 1.000.000.
- Đề xuất sửa:
  - Làm theo UXD PR122-03: khi bộ đêm đang gửi khác bộ đêm của bản xem cuối đã thành công (hoặc bản xem giá gõ vừa bị từ chối), "Cọc cần thu" hiện "–" kèm `aria-busy`, không điền sẵn "Số tiền đã nhận" bằng cọc cũ.
  - Ca vitest theo Q1: mock làm chậm bản xem có `nightlyRates`; gõ giá, qua 300 ms, **trước khi** bản xem về: "Cọc cần thu" là "–" (không phải 500.000); bấm Giữ chỗ → cọc của đơn = cọc tính từ giá gõ; sau khi bản xem về: hộp = cọc của đơn.
  - Không kịp v1.0.5 thì ORC và UXD ghi giới hạn đã biết, và BA thêm một dòng sổ tay "đọc cọc cho khách sau khi số trên hộp đã đổi theo giá vừa gõ".
- Trạng thái: Open

### FB-R5-QA-FE-122-02
- Mức độ: **Suggestion** (bản đầu ghi Minor; hạ sau khi đọc cổng CI "UI cases ran", `ci.yml` dòng 646).
- Vị trí: `product/tests/e2e/ui-clock/v5-14-hold-typed-rate.r5.spec.ts` dòng 151–154:
  ```ts
  test.skip(
    pvBody.nightlyRates?.[0]?.calendarRateVnd !== typed,
    `máy chủ chưa có V5-14 (BE PR #103 r5-s1): …`,
  );
  ```
- Vấn đề:
  - Cách bỏ qua này hợp lúc #103 chưa gộp. Từ `c783a59f` máy chủ đã có V5-14.
  - Trên CI, ca bị bỏ qua làm job đỏ nhờ cổng "UI cases ran", nên không xanh âm thầm. Nhưng nếu máy chủ hỏng (bỏ qua giá gõ, đúng hình BUG-R4-041 phía máy chủ, hoặc bản xem trả lỗi vì `pv.status !== 200` làm `pvBody = {}`), người đọc thấy "bỏ qua: máy chủ chưa có V5-14" thay vì một phép so đỏ có số.
  - Chạy E2E tại máy (không có cổng), ca chỉ báo "skipped".
- Vì sao quan trọng: T14-6 là ca E2E duy nhất nối Desk với máy chủ thật cho BUG-R4-041. Lý do sai làm người sửa đi tìm ở sai chỗ.
- Đề xuất sửa:
  - Bỏ `test.skip` động. Thay bằng `expect(pv.status).toBe(200)` và `expect(pvBody.nightlyRates?.[0]?.calendarRateVnd, 'máy chủ nhận giá gõ (V5-14)').toBe(typed)`.
  - Giữ hai `test.skip` đầu tệp (`E2E_UI`, `QA_SEED_PASSWORD`) như các spec khác.
  - Làm ở PR sau của FE-A, không chặn #122.
- Trạng thái: Open

### FB-R5-QA-FE-122-03
- Mức độ: **Suggestion**. **Trùng FB-R5-ARC-FE-122-02** (cùng đột biến, ARC gọi là M5). ARC đề xuất bỏ dòng hoặc thêm ca; QA chấp nhận cả hai. FE làm một lần, QA đóng thẻ này cùng lúc.
- Vị trí: `BookingDialog.tsx` `hold()`: `if (typedNights?.some((n) => !(n.amountVnd > 0)) && !v.rates)`.
- Vấn đề: không test nào chạm nhánh này (đột biến F5 sống). `validate()` đã chặn ô trống trước, nên hôm nay nhánh không tới được bằng giao diện.
- Vì sao quan trọng: máy chủ trả 422 `AMOUNT_NOT_POSITIVE` cho đêm 0, kể cả `edited: false` (QA-on-be-pr-103 mục 6). Nếu `validate()` đổi (ví dụ cho ô trống khi chưa có giá lịch), chặn này là lớp duy nhất còn lại mà không ai biết nó có chạy hay không.
- Đề xuất sửa: một ca vitest: đêm 2 chưa có giá lịch (bản xem treo), gõ đêm 1, bấm Giữ chỗ → không lệnh nào mang `nightlyRates` có số 0. Ca này FE đã mô tả trong báo cáo; chỉ cần kiểm thêm thân lệnh. Hoặc ghi chú trong mã rằng đây là lớp phòng thủ, có ca nào giữ.
- Trạng thái: Open

---

## 6. Việc cho làn khác (không phải thẻ của MOB, FE)

- **ORC**:
  - báo QA khi #97 và #122 có SHA mới để QA chạy lại (mục 0);
  - nếu 122-01 không vào v1.0.5: ghi giới hạn đã biết cùng UXD (PR122-03), BA thêm dòng sổ tay;
  - ghi dòng decision-log ở mục 7.
- **MOB**: thứ tự gộp với #102 như báo cáo MOB đã ghi (xung đột ở `gen_strings.py`, `strings-tables.md`, `strings.js`: QA gộp thử thấy đúng ba tệp này). Nay thêm xung đột `strings.js` với `main` sau #111.
- **BA**: TC-V104-RG-15 và cách làm tạm "Tạo đơn thay Giữ chỗ" ở sổ tay 2.5 bước 10 hết hiệu lực khi #122 lên (DOM BA-122-01 đã giao, QA không thêm).
- **QA (tự làm)**: đọc `junit.xml` của CI `44535cfe`: T14-6 phải "passed". Chạy lại 15 ca #97 trên SHA mới.

---

## 7. Đề xuất dòng decision-log (QA tự quyết – kết luận kiểm thử)

```
| 2026-11-07 | 5 | QA review PR #97 (MOB V5-15 Báo cần dọn) @ d3081f93: DUYỆT CÓ ĐIỀU KIỆN – 15/15, bộ mobile 177/177, gộp thử main 181/181 (có V5-1B #117), đột biến 5/6 chết, probe 4/4 qua (mã đúng, thiếu test). Điều kiện: MOB gộp main (xung đột strings.js sau #111) và sửa UXD PR97-01, CI xanh, QA chạy lại; FB-R5-QA-MOB-97-01 (Minor: chuỗi bước, chạm đúp mất mạng giữ performedAt, 404 → Cần xem lại) trước tag; staging TC-V105-15-01…14. PR #122 (FE-A V5-14 T14-6) @ 6dd07bf5 và 44535cfe (chỉ gộp main): DUYỆT CÓ ĐIỀU KIỆN – 7/7, gộp thử main (có #103, #111; giống 44535cfe) admin-web 996/996, đột biến 8/9 chết. Điều kiện: CI 44535cfe xanh với T14-6 passed (cổng UI cases ran làm ca bỏ qua thành đỏ); FB-R5-QA-FE-122-01 (Minor: cọc cũ trên hộp khi bản xem giá gõ chưa về, probe Q1, cùng UXD PR122-03; hoặc giới hạn đã biết) trước tag; 122-02, 122-03 Suggestion (122-03 trùng ARC FE-122-02, 97-02 trùng ARC MOB-97-02); staging TC-V105-S1-06. TC-V104-RG-15 hết hiệu lực khi #122 vào bản cắt. Không ESC | QA | Quyền QA (kết luận kiểm thử) |
```

---

## 8. Toàn bộ bộ test (máy QA)

| PR | Bản chạy | Kết quả |
|---|---|---|
| #97 | `d3081f93`, tệp của PR | 15/15 |
| #97 | `d3081f93`, cả bộ mobile | 14 tệp, **177/177** |
| #97 | gộp thử với `main` @ `16ea5183` (có #117 V5-1B) | **181/181**, gồm `v105-hold-notices`; `tsc` 0 lỗi |
| #97 | gộp thử với #102 @ `932d1c22` | Xung đột ở `gen_strings.py`, `strings-tables.md`, `strings.js` (đúng như MOB dự kiến) |
| #97 | `merge-tree` với `main` @ `3279a4ec` | Xung đột `wireframes/assets/strings.js` (tệp sinh; `main` thêm chữ ở #111 `eeb78698`) |
| #122 | `6dd07bf5`, tệp của PR | 7/7 |
| #122 | `6dd07bf5`, cả bộ admin-web | 993/995. 2 ca đỏ (`r3-bug-010-011-feb`, `r3-v1-feb-webreq`, đường mở hộp từ yêu cầu web) qua khi chạy riêng và qua ở bản gộp dưới: chập chờn khi máy tải nặng, không do PR |
| #122 | gộp thử với `main` @ `cd4b4c1f` (có #103, #111) | 88 tệp, **996/996**; `tsc` 0 lỗi |
| #122 | `44535cfe` (HEAD lúc viết) | `apps/admin-web`, `packages`, `tests/e2e` giống hệt bản gộp thử ở trên (`git diff` rỗng); kết quả 996/996 áp nguyên |

- E2E T14-6 không chạy trên máy QA (cần stack có DB và seed). Bằng chứng E2E là CI của `44535cfe` (điều kiện 1).

---

## 9. Điểm làm tốt

- #97: hàng đợi xét 409 theo `currentState` thay vì coi mọi 409 là lỗi. Desk bấm trước thì PWA im lặng, đúng điều buồng phòng cần. Có ca cho cả hai nhánh 409.
- #97: khử trùng lặp nằm ở hàng đợi (`waitingRoomEvent`), không ở nút. Vì vậy chạm đúp, vẽ lại chậm hay mở lại màn đều ra một lệnh. Có ca đơn vị riêng, và hai đột biến tinh (M5, M6) đều chết.
- #122: E2E lấy giá lịch từ chính máy chủ và chọn giá gõ sao cho cọc chắc chắn đổi (bước 50.000 nhỏ nhất). Ca bắt được lỗi quên `edited: true` mà không phụ thuộc số của seed.
- #122: mock `create-hold` trả 422 khi có trường giá, nên vitest giữ đúng luật máy chủ của #103 chứ không chỉ "không gửi".
