# ARC review BE-B – vá ESC-031 (phụ thu trả muộn bằng giá 1 đêm, lễ tân ghi – quản lý hậu kiểm) + hợp đồng 0.3.8 bổ sung 8

- Người review: ARC | Round 3, bước Review (ngoại lệ đóng băng mã tiền ORC 26/10, chỉ phạm vi ESC-031/ESC-024 B) | Ngày: 26/10/2026
- Đối tượng: commit `35a477c`, nhánh `worktree-agent-ae045319d05dda682`; thiết kế `rounds/round-03/outputs/BE/esc031-be-b.md` (trong nhánh đó).
- Đã đọc cùng: DOM `reviews/s1-DOM-on-esc031.md` (Đạt, BR v0.4.5), SEC `reviews/SEC-sprint1.md` mục 8 (Verified + 4 điều kiện). Review này không lặp thẻ của SEC.
- Hợp đồng: ARC làm trên nhánh riêng `arc-esc031-contract-add8`, cắt từ `35a477c`, commit **`e386928`**.

## Kết luận: **Đạt có điều kiện**

Mã đúng kiến trúc, không có Blocker hay Major. Gộp được khi đủ ba điều kiện:

1. Gộp **cùng** commit hợp đồng `e386928`: fast-forward từ `35a477c`, chỉ sửa `openapi.yaml`, `api-client` và `s1-contracts.md`.
2. Sửa chú thích migration 0088 (FB-03) **trước khi gộp**. Chỉ sửa một dòng chú thích, migration chưa chạy ở môi trường chung nào.
3. Giữ điều kiện SEC 8.6 #1, #3, #4: FE cùng bản, QA kiểm tiền trên stack `MFA_ENFORCED=true`, rebase lên `main`. Điều kiện #2 của SEC (addendum 8 + api-client) **đã xong** ở `e386928`.

FB-01 và FB-02 dời sang v1.0.1. FB-04 là gợi ý.

## 1. Kiểm theo yêu cầu ORC

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| Đúng kiến trúc, ranh giới module | Đạt | Job mới nằm ở `frontdesk/public`. Job chỉ dùng `EventsService` và `ParameterService` qua cổng public. Không đọc bảng của module khác ngoài `attention_event`/`staff_notification` (module events, đã có RLS) và `user_property_role`, giống `hold-reminder-job`. `module-boundaries` xanh |
| Không có đường tiền mới | Đạt | Chỉ ghi qua `replaceLateCharge` có sẵn, cùng đường với cách (1). Không có endpoint mới. Không chạm payment, refund hay approval. Miễn sau hậu kiểm vẫn là A32 → `refundPlan` có sẵn |
| K11-06 | Không phá | `s438-r8/*` xanh. Ca 5 của BE: A32 giảm còn 396.000 → yêu cầu hoàn tự sinh **396.000**. Bất biến chạy ở `adjustFolioLine` như cũ |
| `SELF_REFUND_FORBIDDEN` | Không phá | Người làm A32 (MGR) vẫn bị chặn chi và chặn nhập nơi nhận (bổ sung 7). Không đụng `refunds.service` |
| BR-433 (d) | Không phá | Không chạm `limitBasisNow`/`limit_basis_checkout_vnd`. Dòng `late_fee_as_night` là `late_checkout`, không phải đêm, nên không vào cơ sở hạn mức. `r3-bb07-limit-basis` xanh |
| BR-433 (e) | Không phá | A32 giảm sau trả phòng vẫn tính là một lần miễn, đếm vào Σ ESC-026 (`s438-r8` FZ-02 xanh) |
| Fail-closed 2FA | Giữ | Không sửa `password-reauth`/MFA. Ca 2 và `mfa-us143` xanh. Chi tiết ở SEC 8.2 |
| Idempotency, khóa | Đạt | Bước 0 (BUG-R2-150) không đổi. B18 khóa đơn → căn → folio như cũ. Mục "Cần chú ý" có `dedupeKey` mỗi đơn |
| Hiệu năng | Đạt | B18 thêm 1 audit, ≤ 2 thông báo (OTTIMO 1 OWN + 1 MGR) và 1 mục. Job tick chạy 1 truy vấn có chỉ mục `attention_event_open_idx` (property, created_at) WHERE `resolved_at IS NULL` |

**ARC chạy lại** trên Postgres 17 riêng (container tạm, mật khẩu sinh ngẫu nhiên ngoài repo, không đụng stack QA-3):
- 22 tệp, 187 ca xanh, gồm `esc031-*`, `s438r3/r4/r5-money`, `mfa-us143*`, `s438-r8/*`, `migrations-journal`, `module-boundaries`, `money-limit-basis-architecture`, `contract`;
- toàn bộ bộ test api trên nhánh hợp đồng: kết quả ở mục 5.

## 2. Migration 0088

- **Số không trùng.** `git ls-tree origin/main` (`6901d65`) có migration cuối là `0087_public_site_slug_unique`, chưa có 0088. Journal `idx` 64 nối sau 0087, `when` lớn hơn. `0088_snapshot.prevId` = id của `0087_snapshot`.
- **CHECK chỉ thêm kind.** Danh sách bằng đúng danh sách 0086/0087 cộng `late_fee_post_review`. Không đổi bảng, không đổi dữ liệu. `money-limit-basis-architecture` ("staff_notification kind CHECK = STAFF_NOTIFICATION_KINDS, additions only") xanh.
- `DROP/ADD CONSTRAINT` trên `staff_notification` lấy khóa `ACCESS EXCLUSIVE` và quét bảng để kiểm CHECK. Bảng nhỏ (10 căn), chạy trong giao dịch của migrator lúc deploy. Chấp nhận.
- Nếu `main` có migration mới trước khi gộp thì đổi số lúc rebase (ARC S1-14, SEC 8.6 #4).

## 3. Hợp đồng 0.3.8 bổ sung 8 – ĐÃ DUYỆT, commit `e386928` (nhánh `arc-esc031-contract-add8`)

ARC duyệt đề xuất ở mục 4 của BE-B và chỉnh câu chữ:
- **`checkOut.lateFeeInsteadOfNight.postReview`**: boolean, mặc định `false`. Mô tả đủ các ý sau:
  - số tiền của server; lý do bắt buộc; chỉ khi đêm không bán được;
  - 6 trường bị 422 `NOT_ALLOWED` từng trường; không đếm SR-RL-02;
  - audit, thông báo, "Cần chú ý", job quá hạn;
  - miễn sau bằng A32;
  - số phận ở v1.1.
- Mô tả `lateFeeInsteadOfNight` đổi "ba cách" thành **bốn cách**. Cách (4) = `postReview`.
- Mô tả `checkOut` thêm một gạch đầu dòng:
  - `postReview` không đi qua bước người xác nhận, nên không có 401/429 từ đường này;
  - `after.channel` ∈ `desk|self|remote|expired_self_record|post_review`.
- **Hạn hậu kiểm = ghi + `post_checkout_charge_hours`.** Áp cho cả cách (3) của US-164, thay cho `late_fee_post_review_hours`. Khóa `late_fee_post_review_hours` bị **bỏ**, không thêm vào catalogue. Áp ở 4 chỗ: mô tả (3), `AttentionItem.kind`, `StaffNotification.kind`, chú thích catalogue tham số. Cách này khớp DOM BR v0.4.5 (c).
- Changelog `info` thêm dòng bổ sung 8. `s1-contracts.md` thêm mục 13.5.
- Không đổi response, `x-roles`, `x-rbac`. Không thêm mã lỗi.
- **Sinh lại và kiểm**:
  - `packages/api-client`: `postReview?: boolean`; test 32/32, `tsc` xanh;
  - `openapi-meta`/`openapi-schemas`: `--check` báo up to date, không đổi;
  - `gen_rbac_cases.py --check`: 205 operation, 2.255 ca, `rbac mismatch []`;
  - `contract.test`, `serializer.test`, `esc031` (24 ca) xanh;
  - `admin-web` `tsc` xanh.
- **Báo cho các vai** (theo "không đổi contract mà không báo"):
  - FE-A dùng trường mới. Kiểu đã có trong `@ottimo/api-client` sau khi gộp `e386928`;
  - MOB không bị ảnh hưởng (PWA không gọi `checkOut`);
  - INT không bị ảnh hưởng;
  - BE-A biết mục 4 bên dưới khi làm US-164.

## 4. Quyết định ARC – số phận cách (4) khi US-164 lên v1.1

**Thôi nhận cách (4) trong cùng bản FE + BE có US-164.**
- `postReview: true` trả 422 `NOT_ALLOWED` (`field` = `lateFeeInsteadOfNight.postReview`).
- Trường vẫn giữ trong hợp đồng, đánh `deprecated`. Client cũ nhận lỗi rõ thay vì bị bỏ qua im lặng.

**Vì sao:**
- ESC-024 B gốc bắt hỏi quản lý trước, chờ `remote_confirm_timeout_minutes` rồi mới cho lễ tân tự ghi. Cách (4) bỏ qua bước hỏi. Cách này chỉ đúng ở v1.0 vì v1.0 chưa có kênh hỏi. INV chọn ESC-031 cho đúng hoàn cảnh đó.
- Cách (3) thay được (4) trọn vẹn, nhưng US-164 phải làm sao cho gửi đẩy hỏng hoặc không ai đăng ký nhận vẫn tạo `ManagerConfirmation`. Yêu cầu đó hết hạn sau 15 phút rồi đi (3). Như vậy (4) không còn là lối thoát duy nhất.
- Hạ tầng hậu kiểm của (4) **được dùng lại** cho (3): kind `late_fee_post_review`, mục "Cần chú ý", hạn theo `post_checkout_charge_hours`, job `late_fee.post_review_overdue`. Job chọn theo kind, không theo kênh. Phần BE-B làm hôm nay vì vậy không bỏ đi.
- Desk là web, phát hành cùng API. Không có client nào cần thời gian chạy song song.
- Khớp đề xuất của DOM: v1.1 chỉ giữ hậu kiểm làm trạng thái hết hạn của US-164.

**Việc khi làm US-164 (BE-A/FE-A):**
- tắt (4);
- thêm test "postReview → 422";
- đổi mô tả trong hợp đồng sang `deprecated`;
- FE bỏ panel "Ghi phụ thu – quản lý xem lại", thay bằng luồng gửi yêu cầu.

Đã ghi `decision-log.md` và `s1-contracts.md` 13.5.

## 5. Kết quả chạy toàn bộ bộ test api (nhánh `arc-esc031-contract-add8` = `35a477c` + hợp đồng)

**133 tệp xanh, 2 bỏ qua theo cấu hình; 3247 ca xanh, 24 bỏ qua, 0 đỏ**. Kết quả trùng số BE-B báo, trên một DB khác. Các dòng `ERROR [ProblemFilter]` trong log là lỗi do test cố ý gây ra (`failure after the debt was written`, `55P03` lock timeout), không phải ca đỏ.

## 6. Thẻ feedback

### FB-R3-ARC-BE-B-ESC031-01
- Mức độ: Minor
- Vị trí: `checkout.service.ts` `recordForPostReview` (`reviewDueAt`); `events/internal/attention.service.ts` `dueOf`; `frontdesk/public/late-fee-review-job.ts`
- Vấn đề: hạn hậu kiểm được tính ở **bốn** chỗ, mỗi chỗ đọc tham số theo một ngày khác nhau:
  - `FolioService.settle` ghi `folio.post_checkout_window_until` theo tham số của ngày lịch lúc B18. Đây là cửa sổ thật quyết định A32 còn làm được hay không;
  - audit `reviewDueAt` đọc tham số theo ngày nghiệp vụ lúc ghi;
  - `dueOf` đọc lại tham số **lúc liệt kê**;
  - job đọc tham số theo `ctx.date` lúc chạy.

  `post_checkout_charge_hours` là khóa OWN/MGR sửa được, hiệu lực từ hôm nay trở đi. Ví dụ: OWN đổi 24 → 48 cho ngày mai. Mục ghi 19:00 hôm nay sẽ hiện hạn +48 giờ. Nhưng folio đóng sau 24 giờ, nên quản lý tưởng còn miễn được và bấm A32 thì nhận 409 `FOLIO_LOCKED`. Đổi 24 → 12 thì ngược lại: OWN bị báo quá hạn sớm 12 giờ.
- Vì sao quan trọng: hậu kiểm là biện pháp kiểm soát duy nhất của đường này. Hạn hiển thị phải đúng là hạn còn miễn được. Đây cũng là lý do ARC chọn `post_checkout_charge_hours` ở bổ sung 8.
- Đề xuất sửa (v1.0.1):
  - dùng **một nguồn duy nhất** là `folio.post_checkout_window_until` mà B18 vừa ghi. `settle` đã trả `postCheckoutWindowUntil`, nên `reviewDueAt` lấy luôn số đó;
  - mục "Cần chú ý" lưu hạn vào `details.dueAt` lúc mở (đã có `GRANT UPDATE (details)` từ 0082). `dueOf` đọc `details.dueAt` khi có;
  - job so `now >= details.dueAt` thay cho `created_at + tham số`;
  - test: đổi tham số giữa chừng thì hạn không đổi.

  Trước khi sửa, PO ghi vào `day-one-guide`: "không đổi `post_checkout_charge_hours` trong tuần đầu". Rủi ro thấp vì mặc định 24 do INV chốt (INV-007).
- Trạng thái: Open

### FB-R3-ARC-BE-B-ESC031-02
- Mức độ: Minor
- Vị trí: `late-fee-review-job.ts`, điều kiện "đã báo OWN"
- Vấn đề: "đã báo" đang suy ra từ việc có `staff_notification` của **một OWN còn vai** tạo sau hạn. Có hai trường hợp suy sai:
  - Không có OWN `active`: mục bị chọn lại mỗi tick. SEC đã nêu ở FB-R3-SEC-BE-B-12.
  - OWN được thêm hoặc thu hồi vai sau hạn: thu hồi vai OWN đã nhận báo thì job báo lại cho OWN còn lại. Đổi chủ tài khoản thì job báo lần hai.

  Trạng thái "đã báo" thuộc về mục, không thuộc về người nhận.
- Vì sao quan trọng: job tick chạy suốt đời hệ thống. Đúng phải đến từ điều kiện của dòng (chuẩn job ARC), không phụ thuộc thay đổi nhân sự.
- Đề xuất sửa (v1.0.1, gộp với FB-01): khi báo, ghi `details.ownerToldAt` vào `attention_event` (`UPDATE … WHERE id = $1 AND resolved_at IS NULL AND details->>'ownerToldAt' IS NULL`). Truy vấn chọn lọc `details->>'ownerToldAt' IS NULL`. Nếu `notify` trả 0 người nhận thì vẫn đánh dấu và ghi log cảnh báo kèm mã đơn cho OPS. Cách này đóng luôn SEC-12.
- Trạng thái: Open

### FB-R3-ARC-BE-B-ESC031-03
- Mức độ: Minor (điều kiện gộp, sửa 1 dòng)
- Vị trí: `src/db/migrations/0088_late_fee_post_review.sql` dòng 6–7
- Vấn đề: chú thích ghi `test/notification-kinds.test.ts compares this SQL with STAFF_NOTIFICATION_KINDS`, nhưng tệp này **không tồn tại** (`find` không ra). Test thật là `test/money-limit-basis-architecture.test.ts`, khối "staff_notification kind CHECK = STAFF_NOTIFICATION_KINDS, additions only (ARC S1-09)".
- Vì sao quan trọng: migration là bằng chứng lâu dài. Người sửa CHECK sau này sẽ tìm sai test và có thể bỏ qua chốt chặn "chỉ thêm".
- Đề xuất sửa: đổi tên tệp trong chú thích. Sửa trước khi gộp, khi 0088 chưa chạy ở staging hay production.
- Trạng thái: Open

### FB-R3-ARC-BE-B-ESC031-04
- Mức độ: Suggestion
- Vị trí: `frontdesk.controller.ts` `lateFeeApprover`; `checkout.service.ts` khối `if (lateFee?.postReview && approver)`
- Vấn đề: quy tắc "chỉ `true` mới bỏ bước người xác nhận" đang nằm ở hai nơi:
  - controller dùng `!== undefined && !== null && !== false`;
  - service dùng `Fields.bool`.

  Hai nơi đang khớp và SEC 8.1 đã kiểm. Nhưng sửa một bên mà quên bên kia thì có thể sinh trạng thái "không xác nhận mà vẫn ghi".
- Vì sao quan trọng: đây là cổng quyền trên mã tiền.
- Đề xuất sửa: v1.1, khi gỡ cách (4) (mục 4), gỡ cả hai chỗ cùng lúc. Nếu (4) còn sống lâu hơn dự kiến thì gom về một hàm `isPostReview(body)` dùng chung, kèm test bảng giá trị (`true`, `'true'`, `1`, `0`, `null`, `false`).
- Trạng thái: Open

## 7. Ghi chú cho ORC (ngoài BE-B)
- **FE-A** phải làm cùng bản trước ngày D (02/11), theo điều kiện SEC 8.6 #1. Thiếu FE thì bản vá vô dụng: lễ tân vẫn kẹt ở panel mật khẩu quản lý. Kiểu `postReview` có trong `@ottimo/api-client` sau khi gộp `e386928`.
- **Thứ tự gộp vào `main`**:
  1. `35a477c` → `e386928` (fast-forward cùng nhánh) + sửa FB-03;
  2. rebase lên `main`. Trong `decision-log.md`, dòng của BE-B và các dòng DOM/ARC mới trên `main` chỉ xung đột theo kiểu cùng thêm dòng cuối, giữ cả hai;
  3. QA kiểm tiền;
  4. ARC không cần review lại nếu chỉ khác FB-03 và rebase.
- `release-notes.md` (Giới hạn đã biết) do PO sửa. `staff-one-pager.md` và `day-one-guide.md` DOM đã sửa.

## 8. Điểm làm tốt (nên giữ)
1. Không nới fail-closed. Đi đường vòng hợp lệ (bỏ hẳn người xác nhận, thay bằng hậu kiểm), và đường vòng **chặt hơn** đường đêm thêm: không giá tay, không FOC.
2. Mọi thứ nằm trong giao dịch B18: dòng tiền, audit, thông báo, mục "Cần chú ý". B18 bị từ chối thì không còn gì. Test kiểm đủ 0 dòng / 0 audit / 0 thông báo / 0 mục.
3. Đề xuất hợp đồng tách riêng, BE không tự sửa `openapi.yaml`. Đúng quy trình contract-first, nên ARC duyệt được trong một lượt.
