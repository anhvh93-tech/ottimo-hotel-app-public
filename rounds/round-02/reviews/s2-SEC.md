# SEC review – Sprint 2 (Round 2) – commit `573547c`

- Người review: SEC | Ngày: 16/10/2026 | Bước: Review chéo Sprint 2 (plan R2 mục 5 – bắt buộc với PR chạm RLS, quyền, tiền)
- Phạm vi đã đọc:
  - BE-A: `modules/reservations/**` (controller, service, store, rack, occupancy, room-blocks, sales-port adapter, DTO, hooks, worker-jobs), `jobs/reservation-jobs.ts`, migrations `0013`, `0014`.
  - BE-B: `modules/folio/**`, `modules/sales/**`, `modules/payments/**`, `platform/public/channels.ts` + `listChannels`, migrations `0011`, `0012`, `scripts/gen-quote-copy.mjs`, `generated/quote-copy.ts`.
  - Dùng chung: `shared/http/{auth.guard,unit-of-work,precondition}.ts`, `shared/serialization/**`, `shared/validation.ts`, `jobs/job-runner.ts`.
  - FE: `apps/admin-web/src/pages/{rack,booking,reservations,quotes}/**`, `app/{clientData,storage,live,catalog,rules,config}.ts`.
- Đối chiếu: `security-requirements.md` (SR-AZ, SR-RL, SR-AUD, SR-PAY, SR-PWA), `rbac-matrix.md` (ghi chú 4, 20), OpenAPI 0.3.4-draft (`x-roles`, `x-scope`, `x-visible-to`), spec EP02 3.5 / 10.6.
- Không chạy được test trên máy SEC (không có pnpm/PostgreSQL) – kết luận dựa trên đọc mã. Không tấn công hệ thống nào.
- Đánh số tiếp theo `SEC-on-BE.md` (…BE-20) và `SEC-on-FE.md` (…FE-04). Người sửa ghi trong "Vị trí": **BE-A** = reservations/rack/job, **BE-B** = folio/sales/payments, **BE (chung)** = `shared/http`.

Tổng: **0 Blocker · 3 Major · 6 Minor · 3 Suggestion**

Kết luận nhanh theo các điểm ORC yêu cầu:

| Điểm kiểm | Kết quả |
|---|---|
| Phạm vi M (SAL/CTV chỉ đơn/báo giá/hoa hồng của mình, đơn người khác → 404) | **Đạt.** Lọc trong SQL (`ownScopeSql`, `quotes.row`, `commissions.list`, `deposits.target`, `folio.assertOwn`), luôn 404, có test tích hợp. Chỉ còn rò mã đơn qua `conflicts[]` (BE-25) |
| Serializer `x-visible-to`; tên khách trong `conflicts[]` chỉ FD+ | **Đạt** với tên khách (`publicConflict` + `withNames` theo vai; các đường `withNames: true` đều là thao tác chỉ FD+). Hoa hồng/`ottimoRemainingVnd`/`Folio.lines` lọc đúng theo OpenAPI |
| RLS bảng mới | **Đạt.** 19/19 bảng của 0011 + 0013 có ENABLE + FORCE + `tenant_isolation`; quyền ghi tối thiểu (không DELETE, `folio_line`/`payment` chỉ UPDATE cột trạng thái); phân vùng `state_transition` REVOKE như log cũ; hàm SECURITY DEFINER giữ `search_path` + `pg_temp` cuối |
| SAVEPOINT + EXCLUDE (deadlock/DoS) | Cơ chế đúng (thứ tự khóa phòng tăng dần, swap khóa theo id). **Thiếu giới hạn chờ khóa** → BE-23 |
| Idempotency-Key / If-Match trên endpoint tiền | Có trên mọi endpoint ghi; **bị vượt qua bằng `dryRun: true`** → BE-21 |
| `recordMoney` cho mọi thao tác tiền | Gần đủ; thiếu phí kênh OTA và đổi người chốt → BE-27, BE-26 |
| Push báo cọc không chứa số tiền | **Đạt** (`deposit_notice` payload chỉ `refId`, `refCode`, `userIds`) |
| `getQuoteText` – injection | **Đạt.** Mẫu từ tệp sinh sẵn (`JSON.stringify`), thay thế một lượt, không tên/SĐT khách, FE hiển thị trong `<pre>` (React tự escape) |
| Job hết hạn giữ chỗ chạy song song | Đúng một lần nhờ `FOR UPDATE SKIP LOCKED` + kiểm lại; **một đơn lỗi làm kẹt cả lô** → BE-24 |
| Rate limit endpoint mới | Chưa có giới hạn nào cho endpoint Sprint 2 → BE-28 |
| FE không lưu dữ liệu nhạy cảm | **Đạt.** Nháp chỉ trong bộ nhớ, cache xóa khi đổi người, không `innerHTML` → FE-05 (gợi ý) |

---

### FB-R2-SEC-BE-21
- Mức độ: Major
- Vị trí: BE (chung) – `src/shared/http/auth.guard.ts` dòng 450–452 (`checkPreconditionHeaders`: `body.dryRun === true` → bỏ kiểm cả `Idempotency-Key` lẫn `If-Match`); `src/shared/http/unit-of-work.ts` dòng 151–154 (`dryRun` → `key = undefined`). Ảnh hưởng: `requestFoc` (`folio.controller.ts` 95–151), `createDepositNotice` (`deposits.controller.ts` 132–161), `createHoldFromQuote`, `saveQuote`, `createLead` (`quotes.controller.ts`), `createReservation` kèm `initialPayment`, `createRoomBlock`, `resolveOverbookingExternal`.
- Vấn đề: Ngoại lệ "dryRun không cần header" áp cho **mọi** operation, trong khi chỉ `cancelReservation` thật sự xử lý `dryRun` (không ghi). Các handler còn lại dùng `z.object` (mặc định **bỏ** khóa lạ) hoặc `Fields` (không từ chối khóa lạ) nên `dryRun` bị lờ đi và **ghi thật**. Kịch bản: gửi `POST /folios/{id}/lines/{lineId}/foc` với `{"kind":"foc","amountVnd":500000,"reasonCode":"vip","dryRun":true}` và **không** có `Idempotency-Key` → guard cho qua, UoW không giữ khóa, dòng FOC + yêu cầu duyệt được tạo. Client (hoặc FE sau này) tưởng là "tính thử", bấm lại → yêu cầu FOC/thông báo cọc/giữ chỗ/khách hàng tiềm năng trùng; lần thử lại do mất mạng cũng không còn được chống trùng. Với operation có If-Match, `expectedVersion()` vẫn chặn (428) nên chỉ nhóm "chỉ có Idempotency-Key" bị ảnh hưởng.
- Vì sao quan trọng: ADR-009 điểm 8 / coding-standards 7.5 – mọi ghi tiền phải chống trùng; SR-AUD-01 cần một thao tác = một bản ghi. Một cờ trong body vô hiệu hóa được một kiểm soát bắt buộc là lỗi thiết kế "fail-open"; càng nhiều endpoint tiền ở Sprint 3 (`recordPayment`, `addFolioLine`, `allocateGroupDeposit`) thì càng nguy hiểm.
- Đề xuất sửa: (1) Sinh cờ `supportsDryRun` vào `OperationMeta` từ OpenAPI (operation có `dryRun` trong requestBody ở OpenAPI 0.3.4: `cancelReservation`, `setLateCheckout`, `cancelReservationGroupMember`, `cancelReservationGroup`; ARC bổ sung `allocateGroupDeposit` vào requestBody nếu giữ mô tả "tính thử"). (2) Guard + UoW chỉ miễn header khi `operation.supportsDryRun && body.dryRun === true`; operation khác mà body có `dryRun` → `422 VALIDATION_FAILED` (`field: dryRun, code: NOT_ALLOWED`) – fail-closed. (3) Đường dryRun của handler phải chạy trong giao dịch `readOnly: true` (như `cancel` hiện nay) để mọi lệnh ghi lỡ tay bị PostgreSQL từ chối. Test: `requestFoc`/`createDepositNotice`/`createHoldFromQuote` với `dryRun: true` không có header → 422, không có dòng mới trong `folio_line`/`deposit_notice`/`reservation`; `cancelReservation` dryRun vẫn 200 không cần header.
- Trạng thái: Open

### FB-R2-SEC-BE-22
- Mức độ: Major
- Vị trí: BE-B – `src/modules/payments/internal/deposits.service.ts` dòng 100–145 (`confirm`), `deposits.controller.ts` dòng 26–35 + 57–92 (`depositPayment`: `amountVnd` tới `MAX_SAFE_INTEGER`, `receivedAt` tự khai), `public/payment.service.ts` dòng 33–35 (`reconciliationFor`: `cash`/`card_pos` → `not_required`)
- Vấn đề: SAL (phạm vi `own`) tự xác nhận cọc cho đơn giữ chỗ **mình chốt** bằng phương thức `cash` (hoặc `card_pos` với mã chuẩn chi tự gõ 1–12 ký tự) → phiếu thu `succeeded`, đối soát `not_required`, đơn chuyển `confirmed`, hoa hồng `projected` cho chính SAL đó – **không có bước nào cần người thứ hai**. `receivedAt` cho phép lùi về bất kỳ lúc nào sau khi tạo giữ chỗ, nên SAL cũng "cứu" được một giữ chỗ đã quá hạn mà job chưa kịp hủy (US-085 AC4 dựa trên giờ nhận do chính người ghi khai). Kịch bản: CTV/SAL giữ căn 202 cho khách quen dịp lễ, ghi "đã nhận 1.600.000 đ tiền mặt" (không có tiền thật) → căn bị khóa bán, hoa hồng được tính; quầy chỉ phát hiện khi đối chiếu két cuối ca – nếu có đối chiếu.
- Vì sao quan trọng: TM-06 / TM-32 (gian lận nội bộ về tiền), nguyên tắc tách nhiệm "người hưởng hoa hồng không tự xác nhận tiền làm phát sinh hoa hồng"; rbac ghi chú 20 cho SAL xác nhận cọc nhưng không nói tới phương thức không đối soát được. Sai tiền + khóa tồn phòng giai đoạn cao điểm = mất doanh thu trực tiếp.
- Đề xuất sửa (kiểm soát kỹ thuật, không đổi quyền SAL theo rbac):
  1. Khoản thu do người **không có vai FD+** ghi (SAL) luôn `reconciliation = 'pending'` với **mọi** phương thức (kể cả `cash`, `card_pos`) và tạo mục "Cần chú ý" `deposit_unverified` cho FD/MGR; ghi `recordedByRole` vào `after` của `payment.recorded`.
  2. Với SAL: `receivedAt` ≥ `max(hold_created_at, now − 24 giờ)`; quá hạn giữ chỗ thì chỉ FD+ được xác nhận theo AC4.
  3. `amountVnd` của cọc ≤ `max(total_room_vnd + phụ thu, deposit_required_vnd)` (vượt → 422 `AMOUNT_TOO_HIGH`, FD+ được ghi kèm lý do) – chặn gõ nhầm 16.000.000 thành 160.000.000 làm sai cơ sở hoàn cọc BR-309.
  4. Hoa hồng của đơn do chính payee xác nhận cọc giữ `projected` nhưng chỉ chuyển `earned` (R3) khi khoản cọc đã đối soát.
  Test: SAL `confirmDeposit` tiền mặt → `payment.reconciliation = pending` + có mục Cần chú ý; SAL `receivedAt` lùi 3 ngày → 422; FD cùng thao tác → `not_required` như cũ.
  Ghi chú: nếu DOM/PO cho rằng điểm 1–2 thay đổi quy trình quầy, SEC chấp nhận phương án "chỉ FD+ được chọn `cash`/`card_pos`, SAL chỉ `vietqr`/`bank_transfer`"; nếu cần đổi quyền SAL thì mới tạo ESC (chính sách đặt cọc).
- Trạng thái: Open

### FB-R2-SEC-BE-23
- Mức độ: Major
- Vị trí: BE (chung) + BE-A – `src/shared/http/unit-of-work.ts` dòng 201 và 216 (đặt `lock_timeout` 3 s cho khóa idempotency rồi **trả về `0` = chờ vô hạn**); `src/db/database.ts` dòng 91–108 (không `statement_timeout`); `reservations/public/occupancy.service.ts` dòng 72–76 (`lockRooms … FOR UPDATE`), 186–199 (`guarded`); `reservation-store.ts` dòng 104–122 (`FOR UPDATE OF r`); không nơi nào ánh xạ `40P01`/`40001`/`55P03` ngoài bước idempotency.
- Vấn đề: Mọi khóa nghiệp vụ (dòng `room`, `reservation`, `folio`, và lần chờ của ràng buộc EXCLUDE khi giao dịch khác đang chèn khoảng trùng) chờ **không giới hạn**. Một giao dịch chậm (job hết hạn giữ chỗ khóa hàng loạt đơn – BE-24, request treo khi chờ kết nối thứ hai, truy vấn `suggest()` trên khoảng ngày rất dài – BE-28) làm mọi request đặt/đổi/hủy cùng căn xếp hàng, mỗi request giữ một kết nối pool → **cạn pool, toàn bộ API (kể cả đăng nhập) ngừng phản hồi**. Với 10 căn, gần như mọi thao tác quầy đều chạm vài dòng `room`. Deadlock hiếm (thứ tự khóa đã đúng) nhưng khi xảy ra (`40P01`) lại trả `500` + stack ở log thay vì lỗi thử lại được.
- Vì sao quan trọng: TM-50 (DoS trên 1 VPS), SR-RL-09; plan R2 rủi ro "rack p95". Đây là kiểu sự cố "giờ check-in đông khách, cả quầy đứng hình" khó chẩn đoán.
- Đề xuất sửa: (1) Sau khi giành khóa idempotency, đặt `SET LOCAL lock_timeout = '5s'` (tham số `db_lock_timeout_ms`) thay vì `0`; job đặt riêng 10 s. (2) Ở vai DB `ottimo_app`: `ALTER ROLE ottimo_app SET statement_timeout = '15s'`, `idle_in_transaction_session_timeout = '30s'` (OPS đưa vào `02-roles.sh`; truy vấn báo cáo dài sau này đặt `SET LOCAL` riêng). (3) Bộ lọc lỗi ánh xạ `55P03` (lock_not_available), `40P01` (deadlock), `40001` (serialization) → `409 CONCURRENT_UPDATE` kèm `Retry-After: 1`, ghi metric; `57014` (statement timeout) → `503`. (4) Pool có `connectionTimeoutMillis` để request mới nhận 503 thay vì treo. Test: giao dịch A giữ `SELECT … FROM room … FOR UPDATE` 10 s, request đặt căn đó từ client B trả 409 trong ≤ 6 s; endpoint `/v1/auth/login` vẫn 200 trong lúc đó.
- Trạng thái: Open

### FB-R2-SEC-BE-24
- Mức độ: Minor
- Vị trí: BE-A – `reservations/internal/reservations.service.ts` dòng 2118–2185 (`expireHolds`); `jobs/job-runner.ts` dòng 110–114 (`runAll` lặp property không bắt lỗi); `reservations/public/worker-jobs.ts`
- Vấn đề: (a) Job khóa **mọi** giữ chỗ quá hạn trong một câu `FOR UPDATE SKIP LOCKED` rồi xử lý tuần tự trong **một giao dịch**; chỉ cần một đơn ném lỗi (dữ liệu lạ, `loadReservation` không thấy, hook lỗi) là cả lô rollback và lặp lại y hệt ở mọi tick → **không giữ chỗ nào được giải phóng** ("poison pill"), căn bị khóa bán vô thời hạn. (b) `runAll` dừng ở property lỗi, các property sau không chạy. (c) Job giải phóng `room_occupancy` mà không `lockRooms` (lệch thứ tự khóa reservation → room đã quy định, erd 4.5) – hiện chưa thấy deadlock nhưng là ngoại lệ không ghi chú. Phần chống chạy song song (SKIP LOCKED + kiểm lại `status = 'hold' AND hold_expires_at <= now`) **đúng**, giữ nguyên.
- Vì sao quan trọng: Tính sẵn sàng của tồn phòng (doanh thu), TM-50; lỗi im lặng trong worker khó thấy nếu chưa có cảnh báo (SR-LOG-06).
- Đề xuất sửa: Lấy lô có `LIMIT 50`; mỗi đơn chạy trong `SAVEPOINT hold_<n>` – lỗi thì `ROLLBACK TO SAVEPOINT`, ghi log `job.item_failed` (id, mã lỗi, không dữ liệu khách) + đếm vào kết quả `{ expired, keptPaid, failed }`; gọi `occupancy.lockRooms` trước `release`; `runAll` bắt lỗi theo property và chạy tiếp. Test: chèn 1 giữ chỗ "hỏng" + 2 giữ chỗ bình thường quá hạn → 2 cái được hủy, `failed = 1`.
- Trạng thái: Open

### FB-R2-SEC-BE-25
- Mức độ: Minor
- Vị trí: BE-A – `reservations/public/occupancy.service.ts` dòng 356–364 (`publicConflict`), đường gọi `createHold` (`reservations.service.ts` dòng 743 – SAL/CTV qua `createHoldFromQuote`) và `room-blocks.service.ts` dòng 105–113 (vai `maintenance`)
- Vấn đề: Khi `withNames = false` (SAL, CTV, MT), `conflicts[]` vẫn trả `reservationCode` của **đơn người khác** kèm các đêm trùng. CTV thử giữ chỗ hàng loạt (409 rẻ) sẽ ghép được "mã đơn – căn – đêm" của toàn khách sạn, trong khi rack của CTV chỉ được thấy "hết phòng" (`availability_only`) và đơn người khác phải là 404. Mã đơn là chuỗi khách đọc qua điện thoại cho quầy để xác minh (US-020) và dùng trong nội dung chuyển khoản (SR-PAY-06) → mở đường mạo danh "tôi là khách đơn OTM-00168".
- Vì sao quan trọng: Nhất quán với phạm vi M và x-scope `availability_only` (rbac ghi chú 4); spec EP02 3.5 chỉ cho vai khác thông báo `booking.error.conflict_noname`.
- Đề xuất sửa: Trong `publicConflict`, khi `!view.withNames` chỉ trả `roomNo`, `nights`, `kind` (đổi `reservation`/`hold` thành `unavailable` nếu muốn khớp rack); hoặc chỉ giữ `reservationCode` khi đơn thuộc phạm vi của người gọi. ARC ghi rõ trong OpenAPI `RoomUnavailable` (`reservationCode` + `guestDisplayName` chỉ FD+). Test: CTV `createHoldFromQuote` vào căn đã có đơn của FD → 409, `conflicts[0]` không có `reservationCode`/`guestDisplayName`.
- Trạng thái: Open

### FB-R2-SEC-BE-26
- Mức độ: Minor
- Vị trí: BE-A – `reservations/internal/reservations.service.ts` dòng 1007–1013 (`isPropertyUser`), dùng ở dòng 324 (create) và 898 (update); dòng 901–908 + 952–965 (đổi `closerUserId`, audit `category: 'data'`)
- Vấn đề: (a) `isPropertyUser` không lọc `revoked_at IS NULL` và `app_user.status = 'active'` (khác `quote-pricing.ts` dòng 155–163 có lọc) → FD/MGR gán được người chốt là CTV đã bị thu hồi vai/khóa tài khoản; người đó (nếu được mở lại) thấy đơn theo phạm vi `closer` và nhận hoa hồng. (b) Đổi người chốt quyết định ai nhận hoa hồng (EP02 5.4) nhưng chỉ ghi `audit_event` loại `data` và `before/after` **không có** `closerUserId`; hoa hồng `projected` đã tạo ở B4 cũng không chuyển theo → dấu vết tiền không khớp người hưởng.
- Vì sao quan trọng: SR-AUD-01 (mọi thao tác tiền), TM-32 (gian lận hoa hồng nội bộ); SR-AZ (người bị thu hồi không còn quyền).
- Đề xuất sửa: Dùng chung một hàm `assertActiveStaff(tx, userId, roles?)` cho reservations và quote-pricing (lọc `revoked_at IS NULL`, `status = 'active'`, vai trong `sales_staff`/`collaborator`/FD+ theo BR-903). Đổi người chốt → `audit.recordMoney('reservation.closer_changed', before: {closerUserId}, after: {closerUserId})`; sau xác nhận (MGR+) thì void hoa hồng cũ + project hoa hồng mới trong cùng giao dịch (hoặc chặn đổi nếu DOM không muốn – ghi vào spec).
- Trạng thái: Open

### FB-R2-SEC-BE-27
- Mức độ: Minor
- Vị trí: BE-B – `folio/public/folio.service.ts` dòng 477–520 (`channelFee` – ghi `channel_fee` + `stay_night.channel_fee_vnd` **không** `recordMoney`); dòng 466–472 (`commission.projected` không truyền `requestId`); `onReservationConfirmed` dòng 318–326 (`folio.charges_posted` không có phí kênh)
- Vấn đề: Phí kênh OTA (thực tế hoặc ước tính, có thể do người nhập tay qua `otaChannelFeeVnd`) là số tiền ảnh hưởng doanh thu ròng nhưng không có bản ghi `audit_event money`; hoa hồng dự kiến không nối được về request gốc khi điều tra.
- Vì sao quan trọng: SR-AUD-01, US-086 AC5 (ai, khi nào, bao nhiêu); điều tra sai lệch đối soát OTA ở R3.
- Đề xuất sửa: Thêm `audit.recordMoney('channel_fee.recorded', after: {channelCode, baseVnd, ratePct, amountEstimatedVnd, amountActualVnd, source})`; truyền `requestId` qua `projectCommission`/`channelFee`. Bổ sung test "mọi đường ghi bảng tiền (`folio_line`, `payment`, `commission`, `channel_fee`) đều có `audit_event category='money'` cùng `request_id`" – một test duyệt theo bảng thay vì theo từng use case.
- Trạng thái: Open

### FB-R2-SEC-BE-28
- Mức độ: Minor
- Vị trí: BE-A/BE-B – không có giới hạn tần suất/số lượng cho endpoint Sprint 2: `quotes.controller.ts` dòng 49 (`nights` tới 10.000), `reservations.controller.ts` dòng 72–118 (`searchAvailability` không giới hạn độ dài khoảng ngày), `createHoldFromQuote` (không giới hạn số giữ chỗ đang mở mỗi người), `createDepositNotice` (`deposits.service.ts` dòng 191–251 – mỗi lần gọi một push tới mọi FD/FDL); SR-RL-09 (600/phút/người) chưa cài.
- Vấn đề: (a) CTV/SAL có thể giữ chỗ cùng lúc **mọi căn** cho dịp cao điểm (mỗi giữ chỗ tối đa `hold_hours_options` + 1 lần gia hạn) – một CTV có ý xấu hoặc bị chiếm tài khoản chặn bán cả khách sạn. (b) Gọi `createDepositNotice` liên tục → spam push tới quầy (TM-25 tương tự phía nhân viên). (c) `calculateQuote` 10.000 đêm, `searchAvailability` khoảng 100 năm → vòng lặp/mảng hàng chục nghìn phần tử mỗi request, cộng với BE-23 thành điểm làm chậm có chủ đích.
- Vì sao quan trọng: TM-50, TM-07 (CTV là người ngoài biên chế), SR-RL-09.
- Đề xuất sửa: (1) `nights` ≤ ngưỡng BR-108 (`long_stay_threshold_nights`, hiện báo giá dài hạn là R3) hoặc tối đa 60; khoảng `searchAvailability` ≤ 90 đêm (422 `VALUE_OUT_OF_RANGE`). (2) Tham số `max_open_holds_per_user` (đề xuất mặc định: CTV 3, SAL 5; FD+ không giới hạn) kiểm trong `createHold` → 409 `HOLD_LIMIT_REACHED` – PO/DOM chốt con số, SEC chỉ yêu cầu có giới hạn. (3) `createDepositNotice`: tối đa 1 thông báo `open` mỗi đơn (lần sau cập nhật thông báo cũ, không push lại trong 10 phút) + 10 lần/giờ/người. (4) Cài SR-RL-09 bằng bộ đếm RAM theo người (đã được phép ở R2). Test cho từng giới hạn.
- Trạng thái: Open

### FB-R2-SEC-BE-29
- Mức độ: Minor
- Vị trí: BE-A/BE-B – test tích hợp `test/integration/{reservations,sales,folio-payments,rbac-sprint2-bea,rbac-sprint2-beb}.test.ts`
- Vấn đề: Đã có test 404 cho `getReservation`, `getQuote`, `getFolio`, `confirmDeposit`, `createDepositNotice`, `changeLeadStage` – tốt. Còn thiếu các ca mà lỗi phạm vi thường lọt: CTV/SAL gọi `extendHold`, `cancelReservation` (cả `dryRun`), `createHoldFromQuote`, `withdrawQuote` trên đối tượng **của người khác** → 404; `conflicts[]` không có `guestDisplayName` cho SAL/CTV/MT; `dryRun` không vượt được Idempotency-Key (BE-21); `confirmDeposit` song song với job hết hạn giữ chỗ (một bên thắng, không có trạng thái lai); `listCommissions` của SAL không thấy hoa hồng của CTV cùng đơn.
- Vì sao quan trọng: Plan R2 B3 + SR-AZ-09 – phải **chứng minh** cách ly bằng test, không chỉ bằng đọc mã; đây là các ca hồi quy dễ vỡ khi Sprint 3 thêm đoàn/folio.
- Đề xuất sửa: Thêm bảng ca vào `rbac-sprint2-*.test.ts` (dạng `[operation, actor, ownerOfObject, expectedStatus]`) để mọi operation có `x-scope: own*` tự sinh ca "người khác → 404". QA dùng lại trong bộ hồi quy.
- Trạng thái: Open

### FB-R2-SEC-BE-30
- Mức độ: Suggestion
- Vị trí: BE-A – `db/migrations/0014_reservations_rls_be_a.sql` dòng 111–112 (`folio_line_stay_night_fk` tham chiếu `stay_night (id)` đơn cột); `reservation-store.ts` dòng 86–91 (`isOwnScoped` = "không có vai FD+")
- Vấn đề: (a) Các FK chéo module khác đều kép `(property_id, id)`; riêng `folio_line → stay_night` đơn cột, nên về lý thuyết một dòng folio có thể trỏ tới đêm của property khác (FK bỏ qua RLS). Hiện chỉ code hệ thống ghi cột này nên chưa khai thác được. (b) `isOwnScoped` coi mọi vai không phải FD+ là "own" – an toàn (mặc định thu hẹp), nên ghi chú để người sau không đảo thành danh sách cho phép.
- Vì sao quan trọng: Phòng thủ nhiều lớp cho cách ly property (SR-AZ-09, seed 2 cơ sở).
- Đề xuất sửa: Đổi thành `FOREIGN KEY (property_id, stay_night_id) REFERENCES stay_night (property_id, id)` (cần unique `(property_id, id)` trên `stay_night`) ở migration kế tiếp; thêm comment "default-deny" cạnh `isOwnScoped`.
- Trạng thái: Open

### FB-R2-SEC-BE-31
- Mức độ: Suggestion
- Vị trí: BE-A – `reservations/internal/sales-port.adapter.ts` dòng 31–39 (`ctx()` đọc lại vai từ `user_property_role`), `reservationView` dòng 105–109 (tải đơn bằng `SYSTEM_ACTOR`)
- Vấn đề: Adapter dựng `BookingContext` từ **mọi** vai còn hiệu lực trong DB chứ không từ vai của phiên (`principal.roles`), và đọc đơn bằng quyền `owner`. Hiện an toàn vì phía gọi (quotes/deposits) đã kiểm phạm vi trước và serializer lọc theo vai phiên, nhưng `allowedActions` có thể lệch vai phiên và một lời gọi port mới quên kiểm phạm vi sẽ trả đơn ngoài phạm vi.
- Vì sao quan trọng: Giảm rủi ro hồi quy IDOR khi Sprint 3 thêm đường gọi port (đoàn, folio).
- Đề xuất sửa: Truyền `actor` (userId + roles của phiên) qua tham số port thay vì suy từ `tx.ctx`; `reservationView`/`lockForDeposit` nhận `actor` và dùng `loadReservation(tx, id, actor)` (404 khi ngoài phạm vi), chỉ job hệ thống mới dùng `SYSTEM_ACTOR`.
- Trạng thái: Open

### FB-R2-SEC-FE-05
- Mức độ: Suggestion
- Vị trí: FE – `pages/booking/BookingDialog.tsx` dòng 55 (`DRAFT_KEY = 'booking.new'`), `pages/booking/LongStayDialog.tsx` dòng 45 (`'booking.longStay'`)
- Vấn đề: Nháp đặt phòng (chứa SĐT/email khách) đã giữ trong bộ nhớ và bị xóa khi đăng xuất/đổi người (`clearClientData`) – đạt SR-PWA-07. Riêng khóa nháp không gắn người dùng như `GuestFormDialog` (`ottimo.draft.guest.<userId>`), nên chỉ an toàn nhờ một điểm xóa duy nhất; nếu sau này có luồng đổi người không gọi `clearClientData` (ví dụ đăng nhập lại sau hết phiên trên cùng tab bằng tài khoản khác) thì nháp của người trước hiện cho người sau.
- Vì sao quan trọng: Máy quầy dùng chung giữa các ca (TM-42).
- Đề xuất sửa: Gắn `session.me.id` vào khóa nháp như form khách (`booking.new.<userId>`); test: đăng nhập A, gõ nháp, phiên hết hạn, đăng nhập B trên cùng tab → không thấy nháp.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)

1. **Chống trùng phòng đặt ở đúng chỗ**: ràng buộc `EXCLUDE … WHERE (active) DEFERRABLE` là nguồn sự thật, mọi ghi tồn phòng đi qua `OccupancyService` trong `SAVEPOINT`, khóa phòng theo id tăng dần, `swapRoom` khóa hai đơn theo id và hoãn ràng buộc trong cùng savepoint – không còn kiểu "SELECT rồi INSERT".
2. **Phạm vi M làm trong SQL và luôn 404**: `ownScopeSql`, `quotes.row`, `commissions.list`, `deposits.target`, `folio.assertOwn` – không lộ sự tồn tại; serializer mặc định từ chối trường, tên khách trong `conflicts[]` chỉ cho FD+, push báo cọc không có số tiền, mẫu `getQuoteText` sinh từ tệp và không chứa dữ liệu cá nhân.
3. **RLS và quyền DB tối thiểu**: 19 bảng mới đều FORCE RLS; `folio_line`/`payment` chỉ được UPDATE cột trạng thái (số tiền bất biến ở mức DB – K8/BR-008); FE giữ nháp chỉ trong bộ nhớ và gom mọi thứ cần xóa về `clearClientData`.
