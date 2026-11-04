# ARC review – PR #62 "BUG-R4-033/034 e2e flaky fixes"

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Đối tượng: `v104/qa-flaky-fixes` @ `9fb9cef3`, một commit, đọc bằng `git diff origin/main...origin/pr62`. Ba tệp:
  - `product/tests/e2e/api/mfa-s2.r3s1.api.spec.ts`
  - `product/tests/e2e/api/room-blocks.api.spec.ts`
  - `rounds/round-04/qa/v1.0.4-test-cases.md`
- Đối chiếu mã sản phẩm ở cùng commit:
  - `auth.service.ts`: `loginMfa`, `retryAfter`
  - `test-support.module.ts`: `TestRateLimitsController`
  - `room-blocks.service.ts`: `list`, `assertFree`, `release`
  - `support/api.ts`: `resetRateLimits`, `RESET_PREFIXES`
  - `support/s2.ts`: `freeWindow`
  - `e2e/playwright.config.ts`: các project
- CI lúc review: đã xanh `format · lint · audit · test · build`, `API contract`, `no test endpoints in production contract`, `infra scripts`. Còn **chờ** `E2E smoke` và `landing`.

## Phán quyết: **ĐẠT CÓ ĐK**

Điều kiện gộp:
1. Job E2E của PR xanh.
2. Sửa thẻ **FB-R4-ARC-QA-PR62-01**. Thẻ này nhỏ, khoảng 5 dòng, và đóng được khe hở duy nhất có thể che lỗi thật của sản phẩm.

Phần BUG-R4-033 (`loginMfa`) đạt, không có điều kiện.

## 1. BUG-R4-033: `loginMfa()` thử lại một lần sau 429

| Câu hỏi | Kết luận | Căn cứ |
|---|---|---|
| Thử lại có tiêu mất token hoặc mã không? | Không | `AuthService.loginMfa` gọi `limiter.consume('login:ip:…')` **trước** mọi lần đọc DB. Với 429 từ bộ giới hạn, token chưa được đọc, mã chưa bị dùng, bộ đếm chưa tăng. Gửi lại cùng body là an toàn. |
| Khóa thật SR-AUTH-04 có bị xóa nên ca xanh giả không? | Không | Khóa cũng trả `429 RATE_LIMITED` (`retryAfter`), nên helper vẫn gọi reset. Nhưng reset chỉ gỡ bộ đếm DB của các `RESET_PREFIXES`: `qa.owner`, `qa.mgr`, `qa.fd`, `qa.hk`, `qa.mt`, `qa.sal`, `qa.ctv`. Tài khoản của ca là `qa.e2e.mfa…`, không khớp tiền tố nào, nên khóa còn nguyên. Lần gửi lại đi vào nhánh `locked`, trả 429 lần nữa, không ghi gì. Ca vẫn đỏ. |
| Có ca nào cần thấy 429 mà bị "chữa" mất không? | Không | Không ca nào trong project `api` mong 429. Các ca giới hạn và khóa nằm ở project `limits`, chạy tuần tự **sau** `api` (`dependencies: ['rbac', 'api', 'desk-chromium']`). Vì thế reset bộ nhớ từ ca MFA không xóa được cửa sổ đang đếm của `limits`. |
| Endpoint test có thể bị gọi ngoài môi trường test không? | Không | `/__test__/rate-limits/reset` có năm lớp chặn: <br>– chỉ nạp khi `INCLUDE_TEST_SUPPORT=1` và `APP_ENV ≠ production`; <br>– `Dockerfile.api` xóa `dist/test-support` khi build không có cờ đó; <br>– CI quét bundle production; <br>– cần `X-Test-Token` **và** phiên owner; <br>– mỗi lần gọi ghi `audit_event`. <br>Trên stack không có test-support, `resetRateLimits` trả `false` (404 hoặc thiếu token), helper giữ 429 gốc. Caddy production chỉ mở `/__test__` cho `TEST_SUPPORT_ALLOW_IPS`, mặc định là không ai. |
| Có thật là "một lần" không? | Có | Một `if`, không vòng lặp. |

Ghi chú, không thành thẻ:
- Mã TOTP được gửi lại sau vài lần gọi reset, mất dưới 1–2 giây. Nếu trượt sang bước 30 giây kế tiếp mà máy chủ không nhận lệch bước, kết quả là 401. Đó là đỏ giả, không phải xanh giả, nên chấp nhận.
- Reset dùng `RESET_PREFIXES` mặc định, nên cũng gỡ khóa tạm của `qa.fd`, `qa.mgr`… Đây là hành vi sẵn có của `login()` từ trước PR này, không phải điều mới.

## 2. BUG-R4-034: `blockOnFreeWindow()` và TC-L2-030/031/032/033

| Câu hỏi | Kết luận |
|---|---|
| Ca có luôn xanh không? | Không. Helper chỉ thử lại khi gặp `409` với `ROOM_BLOCKED` hoặc `ROOM_UNAVAILABLE`, tối đa 4 lần. Đến lần thứ 4, hoặc gặp mã khác (kể cả `ROOM_OCCUPIED`, 422, 403), helper trả nguyên kết quả, và `toBe(201)` của ca đỏ. |
| Ca nào được kiểm 409 có bị bọc không? | Không. TC-L6-041 / TC-L2-023 (khối trùng đơn phải ra 409) vẫn gọi `createRoomBlock` trực tiếp. |
| Phạm vi | TC-L2-030, ca chung "TC-L2-031 + TC-L2-032", TC-L2-033. ORC nói "030/031/032": 031 nằm trong ca chung với 032, nên đủ. |
| TC-L2-033 đêm mở bán lại | Chỉ nhận `blocked` khi danh sách có một khối **khác** của cùng căn, còn sống (không `cancelled`/`released`), và che đêm `reopen`. Nếu lỗi là khối của chính ca chặn cả ngày mở lại (lỗi biên nửa mở), danh sách không có khối khác, và ca đỏ. Đúng hướng. Lọc `released` cũng đúng: khối nhả sớm có `end_date_actual ≤ today`, mà `reopen` cách hôm nay ít nhất 40 ngày. |

### Khe hở có thể che lỗi thật (thẻ 01)
- `freeWindow` đọc trống/kín qua `searchAvailability` (`isRoomFree`).
- `createRoomBlock` kiểm bằng `assertFree`, tức `occupancy.conflicts`.
- Nếu hai đường này **lệch nhau**, đó là lỗi sản phẩm, ví dụ:
  - `assertFree` tính cả một đơn đã hủy;
  - lệch biên ngày giữa hai câu truy vấn.
- Khi đó helper hiểu 409 là "ca song song vừa chiếm" và chọn khoảng ngày khác. Khoảng ngày là ngẫu nhiên trong 40–320 ngày, nên chỉ cần một khoảng không chạm chỗ lệch là ca xanh. Lỗi chỉ để lại một dòng `console.log`.
- Va chạm thật giữa các ca thì cả hai đường đều thấy. Vì vậy chỉ cần kiểm lại trước khi thử lại là đóng được khe hở.

## 3. Thẻ feedback

### FB-R4-ARC-QA-PR62-01
- Mức độ: Minor. **Điều kiện gộp.**
- Vị trí: `room-blocks.api.spec.ts`, `blockOnFreeWindow()`, nhánh thử lại.
- Vấn đề: thử lại khi gặp 409 mà không xác nhận va chạm là thật. Nếu `searchAvailability` và `assertFree` lệch nhau, lỗi sản phẩm bị che (mục 2).
- Đề xuất: trước khi `continue`, kiểm hai điều.
  - (a) `blk.body.conflicts` không rỗng. Theo `room-block.port.ts`, 409 luôn kèm `conflicts[]`.
  - (b) `await isRoomFree(request, look, rm, b.startDate, b.endDatePlanned) === false`, tức đường đọc trống/kín nay cũng thấy kín.
  - Sai một trong hai thì `return { w, blk }`, để `toBe(201)` đỏ, kèm thông báo "availability và createRoomBlock lệch nhau".
  - Nên in id các mục trong `conflicts` vào dòng log, để QA lần ra ca song song nào đã chiếm.
- Trạng thái: Open

### FB-R4-ARC-QA-PR62-02
- Mức độ: Suggestion
- Vị trí: TC-L2-033, nhánh `reason(reopen) === 'blocked'`.
- Vấn đề 1:
  - `GET …/room-blocks?from=reopen&to=reopen+1` lọc theo `COALESCE(end_date_actual, end_date_planned) > from` (`room-blocks.service.ts` `list`).
  - Khối của ca kết thúc đúng `reopen`, nên **không bao giờ** có trong kết quả. Do đó `ours` luôn `undefined`, và `expect(ours?.endDatePlanned ?? reopen).toBe(reopen)` luôn đúng, không kiểm gì.
  - Phần kiểm thật chỉ còn `others.length > 0`. Phần này vẫn đủ để ca đỏ khi có lỗi biên.
- Vấn đề 2: ca gọi thêm `listRoomBlocks` nhưng `requireEndpoints` chưa liệt kê endpoint này.
- Đề xuất:
  - lấy danh sách với `from=start` (hoặc đọc khối theo id), rồi assert `ours` có thật và `ours.endDatePlanned === reopen`;
  - thêm `EP.listRoomBlocks` vào `requireEndpoints`.
- Trạng thái: Open. Có thể làm cùng thẻ 01.

## 4. Tài liệu test case
Đã đổi chữ EM-15 và CT-01 sang "`selfData` của `openapi-schemas.ts`". Đúng mã sinh ra: `openapi-schemas.ts` có `selfData: [` (dòng 4905), còn `openapi-meta.ts` không có cờ này. Đạt.

## 5. Điểm làm tốt
- Chú thích trong mã nói rõ vì sao gửi lại là an toàn (bộ giới hạn chạy trước) và vì sao khóa thật vẫn đỏ. Nhờ vậy người review đối chiếu thẳng được với `auth.service.ts`.
- Ngưỡng thử lại có giới hạn (1 lần, 4 lần). Mỗi lần thử lại đều để lại dấu vết trong log. Ca kiểm 409 không bị bọc.

## Phản hồi QA (04/11/2026, head `d0053e6d`)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-QA-PR62-01 | Done | Chỉ thử lại khi 409 có `conflicts[]` không rỗng **và** `isRoomFree(...) === false`. Sai một trong hai thì `expect` đỏ ngay với "availability và createRoomBlock lệch nhau". Log in loại, mã đơn, đêm của `conflicts` (không có id, không in tên khách). TC-L2-030 thêm `EP.searchAvailability`. |
| FB-R4-ARC-QA-PR62-02 | Done | Lấy danh sách `from=start&to=reopen`, assert khối của ca có thật và `{roomId, startDate, end = endDateActual ?? endDatePlanned}` khớp `{401, start, reopen}`. Thêm `EP.listRoomBlocks` vào `requireEndpoints`. |

Kiểm trên stack local dùng một lần (`ottimo-pr62`, seed DS-E, đã gỡ). Kết quả:
- Bản thật ×40, 8 worker: 160/160 xanh, 1 lần thử lại do va chạm thật.
- Bản thu hẹp khoảng ngày còn 40–75 ngày để ép va chạm: 22 lần thử lại, lần nào cũng qua bước kiểm lại. Không ca nào đỏ vì "lệch nhau". Riêng TC-L2-032 đỏ 4/40 ở bước (b): đặt đêm `reopen` trúng khối của ca song song. Lỗi này chỉ hiện khi ép khoảng ngày hẹp và nằm ngoài phạm vi hai thẻ. QA sẽ theo dõi trên CI.
- Mutant ép bước đọc lại trả "trống": mọi va chạm đều đỏ "lệch nhau", không thử lại.
- Chèn một khối khác vào đêm `reopen`: nhánh mới vào 5/5 lần và xanh. Cùng tình huống đó với truy vấn cũ `from=reopen`: đỏ ở bước "khối … phải có trong listRoomBlocks", khớp đúng nhận định của ARC.
- Lần chạy cuối, room-blocks + mfa-s2 ×10: 60/60 xanh.

## ARC review lại (04/11/2026, head `d0053e6d`)

Phạm vi: `git diff 9fb9cef3..d0053e6d`, một commit, chỉ sửa `room-blocks.api.spec.ts`.

### Kết luận
1. **Thẻ 01 và 02: Verified, đóng.**
2. **PR #62 gộp được khi job E2E xanh.** Hai điều kiện của ARC đã xong.
3. **TC-L2-032 bước (b) không cần sửa trước khi cắt bản.** ARC mở thẻ 03 (Suggestion) cho v1.0.5.

### Thẻ 01: chỉ thử lại khi va chạm là thật
- QA dùng `expect(conflicts.length > 0 && free === false).toBe(true)` thay vì `return { w, blk }` như ARC gợi ý. **ARC chấp nhận, và cách này tốt hơn gợi ý:**
  - ca đỏ ngay tại chỗ hai đường đọc lệch nhau;
  - thông báo ghi đủ khoảng ngày, mã 409, `conflicts` và kết quả đọc lại;
  - không phải chờ `toBe(201)` ở xa phía sau.
- Bước đọc lại dùng đúng khoảng của khối (`b.startDate → b.endDatePlanned`), không dùng cả cửa sổ. Ở TC-L2-032, khoảng đó là `[arrival+1, arrival+3)`. Đúng.
- Có hai ca đỏ giả, đều chấp nhận được vì không bao giờ ra xanh giả:
  - `isRoomFree` trả `undefined` khi đọc lỗi, nên ca đỏ; thông báo in `trống (undefined)`, đủ để chẩn đoán;
  - ca song song nhả chỗ trong khoảng vài mili giây giữa 409 và lần đọc lại.
- Log chỉ in loại, mã đơn và đêm, không có tên khách. Dữ liệu là của stack CI dùng một lần.
- Mutant "đọc lại trả trống" đỏ ở mọi va chạm (QA đã chạy), nên khe hở đã đóng.

### Thẻ 02: khối của ca phải có trong danh sách
- Truy vấn mới là `from=start&to=reopen`. Với `list()` (`COALESCE(end) > from AND start_date <= to`):
  - khối của ca có `end = reopen > start`, nên có trong kết quả;
  - khối khác che đêm `reopen` có `start ≤ reopen` và `end > reopen > start`, nên cũng có.
- Assert `ours` tồn tại và `{roomId, startDate, end}` = `{401, start, reopen}` nay kiểm thật. QA đã dựng ca có khối chèn vào: truy vấn cũ đỏ đúng bước này.
- `endOf = endDateActual ?? endDatePlanned` khớp DTO (`toRoomBlockDto` có `endDateActual`). `requireEndpoints` đã có `listRoomBlocks`.

### Thẻ mới

#### FB-R4-ARC-QA-PR62-03
- Mức độ: Suggestion (v1.0.5). Không chặn gộp, không chặn cắt bản.
- Vị trí: `room-blocks.api.spec.ts`, ca "TC-L2-031 + TC-L2-032", bước (b) và (c).
- Vấn đề:
  - Bước (b) đặt `[reopen, reopen+1)`, bước (c) đặt `[arrival, start)`. Cả hai nằm trong cửa sổ mà `freeWindow` chỉ **đọc** là trống, không giữ chỗ. Ca song song trên căn 401 có thể chiếm mất trước.
  - Đây là cùng họ lỗi với BUG-R4-034, ở bước sau. Kết quả là đỏ giả, không phải xanh giả.
  - QA chỉ thấy lỗi khi ép khoảng ngày còn 40–75 ngày: 4/40. Với khoảng thật 40–320 ngày: 0/160.
  - Mã sản phẩm và SHA cắt bản không bị ảnh hưởng.
- Đề xuất, chọn một:
  - (a) Bọc (b)/(c) bằng cùng cách kiểm của thẻ 01. Nếu 409 có `conflicts[]` chỉ gồm mục **không phải** của ca và `isRoomFree` đọc lại là kín, thì chạy lại cả ca trên cửa sổ mới (tối đa 4 lần). Ngược lại thì đỏ.
  - (b) Bền hơn: cho các ca chặn phòng dùng một căn riêng không ca nào khác đụng tới, hoặc chạy nhóm ca dùng 401 theo kiểu `serial`.
- Trước khi cắt bản: nếu lỗi hiện trên CI hoặc staging, chạy lại. Ghi lại là lỗi chập chờn đã biết, kèm thẻ này. QC không tính đó là lỗi sản phẩm.
- Trạng thái: Open (QA)
