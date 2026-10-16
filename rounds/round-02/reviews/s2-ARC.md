# ARC review mã Sprint 2 (commit 573547c) – BE-A (reservations, rack, OOO, no-show, jobs) · BE-B (sales, folio, payments)

- Người review: ARC | Round 2 – Sprint 2, bước Review chéo | Ngày: 16/10/2026
- Phạm vi: `services/api/src/modules/{reservations,folio,sales,payments}`, `src/jobs/*`, migration `0011`–`0014`, đối chiếu OpenAPI **0.3.5-draft** (vừa áp) và `rounds/round-02/outputs/ARC/s2-contract.md`.
- Cách đọc: grep import/SQL theo module, đọc `sales-port.ts`, `money-bridge.ts`, `sales-port.adapter.ts`, `occupancy.service.ts`, `rack.service.ts`, `room-blocks.service.ts`, `deposits.service.ts`, `reservation-jobs.ts`, `job-runner.ts`, `unit-of-work.ts` và các migration. Không chạy test (ORC đã chạy: api 1086 xanh).
- Tóm tắt: **0 Blocker · 6 Major · 6 Minor · 1 Suggestion**.

| Hạng mục được giao | Kết luận |
|---|---|
| Ranh giới public/internal | **Đạt** về import: không module nào import `internal/` của module khác. **Chưa đạt** về bảng: còn ghi/đọc thẳng bảng của module khác (thẻ 05, 06) |
| sales-port, money-bridge | Port rõ, chạy trong tx của người gọi, đúng thứ tự khóa. Lỗi: money-bridge "im lặng bỏ qua" khi thiếu folio (thẻ 04); 2 đường ghi tiền cọc ban đầu, vòng phụ thuộc (thẻ 09) |
| UoW/tx: không gọi song song cùng tx | **Đạt**: không còn `Promise.all`/`map(async)` trên tx, dùng `inSequence`. Đề nghị khóa bằng lint (thẻ 12). Riêng commit-then-fail dùng cho tiền thì không đạt (thẻ 01) |
| Migration 0011–0014 | FK chéo module dồn vào 0014 đúng; `reservation.folio_id` ↔ `folio.primary_reservation_id` `DEFERRABLE INITIALLY DEFERRED` đúng; EXCLUDE `DEFERRABLE INITIALLY IMMEDIATE` + trigger đoạn chưa gán `DEFERRED` hợp lý. Còn: `folio_id` nullable (thẻ 04), vài FK không theo cặp tenant / thiếu (thẻ 08) |
| Hiệu năng rack | 3 truy vấn, không N+1 – ổn với 10 căn. Thiếu bằng chứng đo và chỉ mục theo ngày cho chuỗi (thẻ 11) |
| Idempotency job | J1 `FOR UPDATE SKIP LOCKED` + kiểm lại dưới khóa, O2 `UPDATE … WHERE status='planned'` – **chạy lặp an toàn**. Lỗi: khóa job lệch architecture nên E2E đồng hồ bị bỏ qua (thẻ 03); J1 giữ mãi giữ chỗ có cọc một phần (thẻ 02) |
| Khớp hợp đồng | Khớp 0.3.4 tốt (thứ tự kiểm, `currentState`, ROOM_BLOCKED, `REASON_REQUIRED`, `allowedActions` theo giờ). Lệch 0.3.5 mới áp – danh sách việc ở thẻ 10 |

---

### FB-R2-ARC-BE-S2-01
- Mức độ: Major
- Vị trí: `modules/payments/internal/deposits.service.ts` dòng ~146–158 (`return { fail: problem('DEPOSIT_INSUFFICIENT', …) }`); `shared/http/unit-of-work.ts` "Commit-then-fail"
- Vấn đề: `confirmDeposit` khi tổng cọc chưa đủ thì **commit giao dịch tiền** rồi trả `422 DEPOSIT_INSUFFICIENT` (kèm `paymentCode`). Theo quy ước hợp đồng, 4xx nghĩa là "không có gì được ghi, gửi lại an toàn". Commit-then-fail hợp lý với `APPROVAL_LIMIT_EXCEEDED` (không có tiền), nhưng không hợp với ghi tiền.
- Vì sao quan trọng: client hoặc người dùng thấy lỗi sẽ nhập lại với `Idempotency-Key` mới → **ghi cọc 2 lần** (sai tiền). FE hiện xử lý riêng được mã này, nhưng PWA/app của sale sau này và bất kỳ xử lý lỗi chung nào cũng sẽ không biết.
- Đề xuất sửa: theo **A-13 (OpenAPI 0.3.5)**: đã ghi tiền → `200` + `Reservation` (`status=hold`, `depositPaidVnd`); chỉ trả `422 DEPOSIT_INSUFFICIENT` khi không ghi gì (không có `payment` mới). Thêm test: lần 1 thiếu tiền → 200/hold; lần 2 bổ sung đủ → 200/confirmed; replay cùng key → cùng phản hồi. Cấm dùng `{ fail }` trong module `payments`/`folio` (ghi chú ở `unit-of-work.ts`).
- Trạng thái: Open

### FB-R2-ARC-BE-S2-02
- Mức độ: Major
- Vị trí: `modules/reservations/internal/reservations.service.ts` `expireHolds()` dòng ~2130 (`if ((await this.money.depositPaid(tx, row)) > 0) { keptPaid += 1; continue; }`)
- Vấn đề: J1 bỏ qua **mọi** giữ chỗ đã có cọc `> 0`, kể cả cọc một phần (US-086 AC2 ghi giao dịch thiếu rồi giữ `hold`). Không có hạn chót thứ hai, không sinh mục "Cần chú ý"/thông báo, nên giữ chỗ quá hạn nằm trên rack vô thời hạn.
- Vì sao quan trọng: căn bị chặn bán mà không ai được nhắc (rò tồn phòng), đúng loại lỗi BL #8 "giữ chỗ treo"; chỉ số S7 "giữ chỗ treo = 0" không bao giờ đạt.
- Đề xuất sửa: (1) giữ nguyên ngoại lệ US-085 AC4 nhưng ghi `attention_event` `hold_expired_with_deposit` (hoặc thông báo `hold_expired` tới người tạo + FD) **trong cùng lượt J1**, khóa chống trùng `reservationId:hold_expires_at`; (2) DOM chốt quy tắc cho cọc **một phần**: hủy và chuyển tiền sang hoàn, hay giữ đến mốc X. Tới khi DOM chốt, mặc định: không tự hủy, nhưng luôn có mục "Cần chú ý". Thêm test đồng hồ cho cọc một phần.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-03
- Mức độ: Major
- Vị trí: `src/jobs/reservation-jobs.ts` (`HOLD_EXPIRY_JOB_KEY = 'reservation.hold_expiry'`, `ROOM_BLOCK_ACTIVATION_JOB_KEY = 'room_block.activation'`) ↔ `architecture.md` 9.1 (`hold.expire` J1, `ooo.activate` J9); `tests/e2e/support/clock.ts` `runJob()`
- Vấn đề: khóa job khác bảng 9.1. QA gọi `/__test__/jobs/hold.expire/run`, gặp job chưa đăng ký thì **skip** → các ca TC-L5-026/029/030, TC-L6-044 không bao giờ chạy trên CI mà vẫn "xanh".
- Vì sao quan trọng: kiểm thử hết hạn giữ chỗ (tiền + tồn phòng) bị vô hiệu một cách im lặng.
- Đề xuất sửa: **ARC chốt dùng khóa của architecture 9.1** (`hold.expire`, `ooo.activate`; sau này `hold.remind`, `no_show.call`, `no_show.mark_prompt`). BE-A đổi hằng số; nếu muốn giữ tên cũ thì đăng ký thêm bí danh. QA đổi `runJob()`: khi `CI=true` thì job không tồn tại là **lỗi**, không phải skip.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-04
- Mức độ: Major
- Vị trí: `modules/reservations/internal/money-bridge.ts` (`@Optional() FolioService`, `@Optional() PaymentService`; `openFolio` trả `null`, `posted()` `if (!this.folios || !stay.folioId) return;`); `reservations.service.ts` dòng ~866 `folioId: row.folio_id ?? ''`; migration 0014 (`reservation.folio_id` nullable)
- Vấn đề: khi thiếu folio module (cấu hình sai, worker nạp thiếu), đơn vẫn được tạo/xác nhận **không có folio và không có dòng tiền phòng**, không báo lỗi. `Reservation.folioId` là trường bắt buộc trong hợp đồng nhưng DTO bỏ đi khi null. Cột `folio_id` để nullable vì lý do này.
- Vì sao quan trọng: mất doanh thu trên folio (sai tiền) mà không ai biết; vi phạm erd 4.6 (`folio_id` NOT NULL, FK vòng).
- Đề xuất sửa: tiêm bắt buộc trong `AppModule` và worker; giữ `@Optional` chỉ qua provider test riêng (`MoneyBridge.forTests()`). `openFolio`/`posted` thiếu dịch vụ → ném lỗi lập trình (500), không trả null. Sau đó thêm migration `ALTER TABLE reservation ALTER COLUMN folio_id SET NOT NULL` (FK vẫn DEFERRED) và test "mọi đường tạo đơn đều có folio".
- Trạng thái: Open

### FB-R2-ARC-BE-S2-05
- Mức độ: Major
- Vị trí: `modules/reservations/internal/reservations.service.ts` `setGuestEmail()` dòng ~1015 (`UPDATE guest SET email_norm = $2 WHERE id = $1 AND email_norm IS NULL` trong SAVEPOINT, `catch {}` nuốt mọi lỗi)
- Vấn đề: module reservations ghi thẳng bảng `guest` (thuộc module guests, cấp tổ chức). Lệnh này bỏ qua `version`/`updated_at` (ETag cũ vẫn hợp lệ → `updateGuest` từ form cũ có thể ghi đè email = mất cập nhật), không ghi nhật ký thay đổi dữ liệu C2, không có mốc "email vừa đổi" cho SR-GST-14 (OTP không gửi tới email đổi < 24 giờ). `catch` bắt cả lỗi khác (serialization, RLS), không chỉ `23505`.
- Vì sao quan trọng: phá ranh giới module (coding-standards: bảng của module nào do module đó ghi); sai khóa lạc quan; lỗ hổng xác minh khách mức 2 khi R3 bật OTP.
- Đề xuất sửa: thêm `GuestsService.attachEmailIfEmpty(tx, guestId, email, actor)` ở `guests/public` (tăng `version`, audit, đặt mốc đổi email, chỉ bắt `23505` → trả `false`); reservations gọi hàm này. Test: ETag của khách đổi sau khi tạo đơn có email.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-06
- Mức độ: Major
- Vị trí: toàn bộ code sinh/đọc theo OpenAPI 0.3.5 (đã áp 16/10, chi tiết `outputs/ARC/s2-contract.md` mục 5)
- Vấn đề: mã hiện chạy theo 0.3.4, chưa có:
  - **BE-A**: `RackBar.reservationCode`/`holdExpiresAt` (serializer giờ cho đi `extraGuestCount`/`externalContract`); `ROOM_OCCUPIED` ở `createRoomBlock`/`updateRoomBlock`; khóa `room` → `roomNo` (ROOM_NOT_SELLABLE, CAPACITY_EXCEEDED); `expiredAt` ở `extendHold`; `depositPaidVnd`/`shortfallVnd` ở `createReservation`; `Reservation.noShowAvailableFrom`, `depositPaidVnd`; `suggestions[]` đêm lẻ ở `MIN_STAY_NOT_MET`; `searchAvailability` `orphanNight`/`upgrade`/`reservationId`; (Should) `getBookingRules`.
  - **BE-B**: A-13 (thẻ 01); `QuoteCalculation.roomId/roomNo/roomTotalVnd/extraPersonFeeVnd/extraGuestCount`; báo giá theo nhóm ưu tiên căn đêm lẻ; `roomNo`/`max` ở CAPACITY_EXCEEDED của báo giá; `expiredAt` ở QUOTE_EXPIRED/HOLD_EXPIRED; `extendQuote`; `listCloserCandidates`.
- Vì sao quan trọng: FE và E2E của QA viết theo 0.3.5. Nếu không sửa trong round, QC sẽ thấy hợp đồng lệch mã.
- Đề xuất sửa: làm ở bước Phản hồi & sửa Sprint 2. Test hợp đồng: mỗi mã lỗi có đủ trường của bảng "Trường mở rộng của Problem" trong `info.description`.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-07
- Mức độ: Minor
- Vị trí: `folio/public/folio.service.ts` dòng ~460, ~516 (`UPDATE stay_night SET agent/staff_commission_vnd | channel_fee_vnd …`); `reservations/internal/money-bridge.ts` `depositPaid()` nhánh dự phòng (`SELECT … FROM payment`); `reservations` INSERT/UPDATE `hk_task`
- Vấn đề: module này ghi/đọc thẳng bảng của module khác. `stay_night` thuộc reservations; `payment` thuộc payments; `hk_task` thuộc housekeeping (chấp nhận tạm vì module housekeeping chưa có tới Sprint 4).
- Vì sao quan trọng: quy tắc phân bổ theo đêm (DATA Q-12) và cách tính cọc bị nhân đôi ở nhiều nơi, dễ lệch khi đổi một bên.
- Đề xuất sửa: thêm `StayNightAllocationPort` (reservations/public) cho folio ghi cột phân bổ; bỏ nhánh SQL dự phòng ở `depositPaid` sau khi xong thẻ 04 (worker có `FolioService`); Sprint 4 chuyển ghi `hk_task` sang `HousekeepingPort`. Ghi TODO có mã thẻ ở từng chỗ.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-08
- Mức độ: Minor
- Vị trí: `src/jobs/reservation-jobs.ts` `today()` (đọc `config_parameter` bằng SQL, mặc định `'00:00'`)
- Vấn đề: job tự đọc tham số, bỏ qua `ParameterService` (cache, biên, ngày hiệu lực theo giờ cơ sở). Giá trị mặc định `00:00` sai ngày nghiệp vụ BR-010 / metrics Q-01 (06:00). Khi thiếu tham số, O2 kích hoạt khối OOO sớm 6 giờ.
- Vì sao quan trọng: một nguồn sự thật cho ngày nghiệp vụ (ADR-008); lỗi chỉ lộ ra ở cơ sở mới chưa seed đủ tham số.
- Đề xuất sửa: dùng `ParameterService.get('business_day_rollover', …)` (hoặc hàm dùng chung `businessDateOf(tx)` ở `platform/public`). Thiếu tham số → lỗi rõ ràng, không đoán.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-09
- Mức độ: Minor
- Vị trí: migration `0014` (`folio_line_stay_night_fk FOREIGN KEY (stay_night_id) REFERENCES stay_night (id)`); `0011` `deposit_notice.handled_payment_id`, `deposit_notice.attachment_id`; `0013` `room_block.affected_reservation_ack_by`, `released_by`, `reservation_segment` không có FK tới `app_user`
- Vấn đề: FK `folio_line → stay_night` không theo cặp `(property_id, id)` như mọi FK tenant khác (erd 2.x). Kiểm FK bỏ qua RLS, nên DB không chặn một dòng folio trỏ sang đêm của cơ sở khác. `handled_payment_id` không có FK.
- Vì sao quan trọng: chống trộn dữ liệu giữa cơ sở phải có ở tầng DB, không chỉ ở ứng dụng (ADR-007).
- Đề xuất sửa: migration mới: `stay_night` thêm UNIQUE `(property_id, id)` nếu chưa có, đổi FK sang `(property_id, stay_night_id)`; thêm FK `deposit_notice(property_id, handled_payment_id) → payment`; FK người dùng `(organization_id, …) → app_user` cho các cột `*_by`. `attachment_id` để tới khi có bảng `attachment` (Sprint 3).
- Trạng thái: Open

### FB-R2-ARC-BE-S2-10
- Mức độ: Minor
- Vị trí: `reservations/internal/money-bridge.ts` (import `PaymentService` từ `payments/public` **và** `registerPaymentRecorder()`); `payments/internal/deposits.service.ts` (import `RESERVATION_SALES_PORT`)
- Vấn đề: có 2 cách ghi tiền cọc ban đầu (B2): bộ ghi được đăng ký, hoặc gọi thẳng `PaymentService`. Ngoài ra còn vòng phụ thuộc reservations ↔ payments (Nest gỡ được nhờ token toàn cục, nhưng thứ tự khởi tạo dễ gãy).
- Vì sao quan trọng: hai đường cùng ghi tiền thì dễ lệch (một đường có `requestId`/audit, đường kia không); vòng module làm khó tách worker.
- Đề xuất sửa: giữ **một** hướng: reservations chỉ phụ thuộc port (`PaymentRecorder` do payments đăng ký lúc `onModuleInit`); bỏ import `PaymentService` khỏi reservations. Thêm kiểm `madge --circular` (hoặc eslint `import/no-cycle`) cho `src/modules`.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-11
- Mức độ: Minor
- Vị trí: `reservations/internal/rack.service.ts` `rack()` (truy vấn `reservation_segment` theo khoảng ngày, không theo căn); chỉ mục `reservation_segment_room_idx (property_id, room_id, from_date) WHERE active`
- Vấn đề: chưa có bằng chứng đo cho ngân sách architecture mục 16 (rack < 200 ms, p95 API < 300 ms). Truy vấn đoạn đơn lọc `from_date < $2 AND to_date > $1` mà không có `room_id`, nên chỉ mục hiện có dùng kém khi một cơ sở có nhiều năm dữ liệu hoặc khi lên chuỗi. Gom mảng bằng `[...arr, x]` trong vòng lặp (O(n²), nhỏ).
- Vì sao quan trọng: rack là màn mở nhiều nhất; chậm thì lễ tân thao tác chậm cả ngày.
- Đề xuất sửa: thêm chỉ mục `(property_id, to_date, from_date) WHERE active` hoặc lọc qua `room_occupancy` (đã có GiST `(property_id, stay_range) WHERE active`). Thêm 1 test tầng A: seed 2 năm đơn, kiểm `EXPLAIN` không Seq Scan và thời gian < 50 ms ở DB test. QA đưa `getRack` vào k6 nhẹ (plan R2 mục 6). Đổi gom mảng sang `push`.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-12
- Mức độ: Minor
- Vị trí: `src/jobs/*` – J2 `hold.remind`, J6 `no_show.call`, J7 `no_show.mark_prompt` (architecture 9.1, R2) chưa có
- Vấn đề: BE-A đã ghi dời sang Sprint 4 ("Cần chú ý"), nhưng plan R2 Sprint 2 có US-085 (nhắc giữ chỗ sắp hết) và US-136 AC1 (nhắc gọi). Các ca TC-L5-028, TC-L2-070…073 đang chờ.
- Vì sao quan trọng: nếu không đưa vào backlog Sprint 4 với mã job cố định thì dễ trôi; AC1 US-136 không nghiệm thu được.
- Đề xuất sửa: ORC/PO ghi rõ trong plan Sprint 4; BE dùng đúng khóa 9.1 (xem thẻ 03), khóa chống trùng `reservationId:hold_expires_at` / `reservationId:businessDate`.
- Trạng thái: Open

### FB-R2-ARC-BE-S2-13
- Mức độ: Suggestion
- Vị trí: `shared/sequence.ts` (`inSequence`), cấu hình ESLint `services/api`
- Vấn đề: hiện không còn gọi song song trên cùng `tx` (đã kiểm: không còn `Promise.all`, `map(async`, `forEach(async`). Nhưng chưa có gì ngăn lỗi này quay lại (pg@9 sẽ bỏ hỗ trợ).
- Vì sao quan trọng: lỗi chỉ hiện dưới tải, gây hỏng giao dịch khó tái hiện.
- Đề xuất sửa: thêm luật `no-restricted-syntax` cấm `Promise.all`/`Promise.allSettled` trong `src/modules/**` và `src/jobs/**` (ngoại lệ có chú thích `// eslint-disable-next-line … no tx`), gợi ý dùng `inSequence`.
- Trạng thái: Open

---

**Điểm làm tốt (nên giữ)**
1. Chống đặt trùng bằng `EXCLUDE … DEFERRABLE INITIALLY IMMEDIATE` + SAVEPOINT, dựng `conflicts[]` bằng truy vấn sau rollback, `ROOM_BLOCKED` chỉ khi mọi xung đột là OOO: đúng ADR-009 và đã được 0.3.5 lấy làm chuẩn.
2. Ranh giới module ở tầng mã sạch: chỉ import `public/`, các port (`RESERVATION_SALES_PORT`, `ConfirmedStay`) chạy trong tx của người gọi, thứ tự khóa reservation → room → folio được ghi rõ.
3. J1 an toàn khi chạy lặp/chồng (`FOR UPDATE SKIP LOCKED` + kiểm lại dưới khóa); GRANT theo cột cho `folio_line`/`payment` (chỉ-thêm, K8) và FK chéo module dồn về một migration (0014) là cách làm tốt cho 2 luồng BE song song.
