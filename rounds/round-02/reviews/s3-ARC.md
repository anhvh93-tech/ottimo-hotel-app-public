# ARC review mã Sprint 3 (HEAD a297273, mã từ 789ac90) – BE-A · BE-B · BE-C · INT

- Người review: ARC | Round 2 – Sprint 3, bước Review chéo | Ngày: 17/10/2026
- Phạm vi:
  - Module: `services/api/src/modules/{frontdesk,events,folio,payments,inventory,crypto,files,registration,guest-portal}`, `reservations/public/{stay-port,stay-view,sales-port}.ts`, `approvals`, `src/jobs/payment-jobs.ts`.
  - Migration 0030, 0040–0041, 0050–0052 và `_journal.json`.
  - Các file dùng chung BE-C đã sửa: `auth.guard.ts`, `guest-session.ts`, serializer + cờ `g`, `feature-modules.ts` (`runtimeEnv`), `http.ts` (multipart), `sharp`.
  - `integrations/{payment/vietqr,qr,doorlock,guest-registration}`.
  - Đối chiếu OpenAPI **0.3.6-draft**, `outputs/ARC/s3-contract.md` (mục 4.2, 4.3), SEC `s3-checklist.md`.
- Cách làm:
  - ARC đọc trực tiếp ranh giới module, DI, journal/snapshot, tích hợp và hợp đồng.
  - Ba lượt đọc sâu song song theo vùng BE-A/B/C. **Mọi thẻ Blocker/Major dưới đây ARC đã tự mở mã kiểm lại** (dòng trích dẫn đúng ở HEAD).
  - Không chạy test DB. ORC báo api 2.036 test xanh; các lỗi dưới đây nằm ngoài các ca đã có.
- Đối chiếu với review chạy song song: `s3-SEC.md` (ĐK-2 mục 4 b) và `s3-DOM.md` / decision-log DOM S3-1…S3-16. Hợp đồng và quyết định dưới đây đã khớp với chúng. Trùng ý được ghi rõ trong từng thẻ, không lập thẻ trùng.
- Tóm tắt: **3 Blocker · 18 Major · 9 Minor · 2 Suggestion** (32 thẻ). Quyết định giả định ở mục B; hợp đồng đã áp ở mục C; quy tắc migration 4.2a ở mục D.

| Hạng mục được giao | Kết luận |
|---|---|
| Đúng tiền | **Chưa đạt.** Có 2 Blocker:<br>• phụ thu người thêm giữa kỳ bị đảo mất (01);<br>• cọc âm sau khi đảo (02).<br>Có 5 Major: 05, 06, 11, 13, 14 |
| Ranh giới module / cổng public | Import `internal/` khác module: **0** (lint giữ tốt). Đọc/ghi bảng vùng khác: còn 7 chỗ (thẻ 15). ARC chốt `frontdesk` ↔ `reservations` là **một aggregate** (mục B-3) |
| Vòng DI (ModuleRef) | Vòng có thật: `PaymentService → AttachmentService → ReservationSalesAdapter → ReservationsService → MoneyBridge → PaymentService`. ModuleRef chỉ che vòng này đi chứ không gỡ (thẻ 16) |
| Sửa file dùng chung của BE-C | Nhánh khách trong `AuthGuard`: **đạt**, chỉ vào khi `x-roles` = `['guest']`, kiểm Origin trước khi giải phiên. Cờ `g` đạt nhưng là opt-in và chưa có test (thẻ 28). `runtimeEnv`: đạt. **Parser multipart toàn cục = Blocker 03.** `sharp` 0.35.5 ghim đúng phiên bản: đạt, cần cấu hình thêm (thẻ 18) |
| Migration + journal (4.2) | `when` tăng nghiêm ngặt 26/26, test journal có. Snapshot: ORC sửa (d71d7cf, a297273); ARC sửa quy tắc 4.2a và kiểm SQL ↔ snapshot (mục D). Backfill 0040 không chạy được vì RLS (thẻ 10). FK chéo vùng nay đã thêm được (thẻ 22) |
| Tích hợp | VietQR EMVCo + CRC đúng, bộ mã QR tự viết đạt. **Hai cài đặt dữ liệu cổng khai báo khác nhau** (thẻ 20) |
| Khớp OpenAPI 0.3.6 | 129 operation cài = spec. Không có op ngoài spec. 68 op chưa cài đều là R3/Sprint 4 hoặc ĐK-1. `gen-openapi-meta`, `gen-portal-copy`, api-client `--check` xanh. Lệch nhỏ ở thẻ 24 và 26 |

---

## A. Thẻ feedback

### FB-R2-ARC-BE-S3-01
- Mức độ: **Blocker**
- Vị trí: BE-A `frontdesk/internal/party.service.ts` dòng ~403–421 (`postLines … category: 'extra_person', quantity: extraDelta * nights, amountVnd: surcharge`) ↔ BE-B `folio/public/folio.service.ts` `syncStay` dòng ~736–747 (`if (wanted.has(d) && !keptDates.has(d) && l.amount_vnd === perNight) … else reverseWithReductions`)
- Vấn đề: thêm người giữa kỳ ở (US-022, `applyExtraPersonSurcharge`) ghi **một** dòng `extra_person` cho cả kỳ còn lại. Có hai chỗ sai:
  - Dòng ghi ngày `serviceDate = effectiveFrom`, số tiền khác giá một đêm.
  - `pricing_snapshot.extraCount` / `extraPersonFeePerNightVnd` không được cập nhật.
  
  Lần `resyncStay` kế tiếp (gia hạn, đổi phòng, trả sớm, B9a, sửa số khách) so dòng đó với `perNight` của snapshot, thấy không khớp và **đảo** nó mà không ghi lý do.
- Vì sao quan trọng: mất doanh thu phụ thu (BR-110) và không ai biết. Bill in ra thiếu tiền. Đây đúng loại lỗi "sai tiền".
- Đề xuất sửa: theo DOM S3-13 (a) (phụ thu người tính theo từng đêm, áp từ `effectiveFrom`), thay đổi số người giữa kỳ phải đi qua **đường định giá của reservations**. Cách làm: cập nhật snapshot theo đêm (người thêm tính từ `effectiveFrom`), rồi để `syncStay` sinh dòng theo từng đêm. Không post dòng gộp từ frontdesk. Nếu chưa kịp làm vậy: cho dòng giữa kỳ một `charge_code` riêng mà `syncStay` không quản, và kèm test. Test: thêm trẻ có phụ thu → gia hạn 1 đêm → phụ thu vẫn còn và đêm mới có phụ thu đúng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-02
- Mức độ: **Blocker**
- Vị trí: BE-B `folio/public/folio.service.ts` `depositPaid()` dòng ~354–361 (`SUM(amount_vnd) … type = 'deposit' AND status = 'succeeded'`) ↔ `payments/internal/payments.service.ts` `reverse()` dòng ~583–593 (dòng đảo: chép `type`, `-amount_vnd`, `'succeeded'`; dòng gốc `reversed`)
- Vấn đề: đảo một khoản cọc 1.000.000 thì `depositPaid` = **−1.000.000**. Hệ quả:
  - Ghi lại khoản đúng → tổng = 0 → `confirmDeposit` báo `DEPOSIT_INSUFFICIENT`.
  - J1 coi giữ chỗ là chưa có cọc và có thể hủy giữ chỗ khách đã trả.
  - Kiểm giữ tiền khi không đến bị bỏ qua.
  - Trần VietQR khi `hold` và trần SAL bị thổi phồng.
  
  `computeTotals` thì đã loại dòng đảo, nên hai chỗ tính lệch nhau.
- Vì sao quan trọng: sai tiền cọc và có thể hủy nhầm đơn đã trả cọc.
- Đề xuất sửa: `AND reversal_of_id IS NULL`, hoặc lấy từ `computeTotals().depositHeldVnd` (một nguồn). Test: đảo cọc → ghi lại → `confirmDeposit` thành `confirmed`; chạy J1 không hủy.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-03
- Mức độ: **Blocker**
- Vị trí:
  - `src/http.ts` dòng ~88–95: `addContentTypeParser('multipart/form-data', { parseAs: 'buffer', bodyLimit: 42 MB })` áp cho **mọi route**.
  - `shared/http/unit-of-work.ts` dòng ~167 và `guest-portal/internal/guest-unit-of-work.ts` dòng ~60: `requestHash(…, req.body ?? null)`.
  - `shared/secret-fields.ts` dòng ~34: `Object.entries(value)` chạy trên Buffer.
- Vấn đề:
  - Bất kỳ ai có link khách gửi được `POST /v1/guest/online-checkin/complete` với `Content-Type: multipart/form-data` và 40 MB thân. Origin đặt tay bằng curl được; mọi nhân viên kể cả CTV cũng làm được với các POST idempotent khác.
  - Khi đó `withoutSecrets` + `canonicalJson` biến Buffer thành mảng ~40 triệu cặp khóa/giá trị rồi sắp xếp, gây hết bộ nhớ hoặc treo vòng sự kiện.
  - `asBody()` cũng nhận Buffer như object.
  - Chỉ 3 controller upload thay `req.body` bằng digest trước khi băm.
- Vì sao quan trọng: một tiến trình api duy nhất (10 căn, 1 VPS) bị đánh sập từ một link khách. Lễ tân mất toàn bộ hệ thống.
- Đề xuất sửa:
  1. Chỉ đăng ký parser multipart cho đúng 3 route `addGuestDocument`, `uploadGuestDocument`, `uploadAttachment` (Fastify `register` theo route / `onRoute`). Route khác gặp multipart → **415**.
  2. `requestHash` từ chối thân không phải plain object/array/scalar JSON (Buffer, typed array) → 415/400.
  3. Test hồi quy: multipart 1 MB tới `completeOnlineCheckin` và `checkIn` → 415, tiến trình không tăng bộ nhớ.
  
  SEC xem cùng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-04
- Mức độ: Major
- Vị trí: `shared/http/auth.guard.ts` dòng ~263–267 (`if (!allowed && !(await this.hasCompletedKey(...))) await this.enforce(req)`), `hasCompletedKey` không ràng buộc method/path; nhánh `dryRun` của `frontdesk.controller.ts` (`read()` ~200–207, ~237–244, ~366–369) và `reservations.controller.ts` ~275
- Vấn đề:
  - Vai bị cấm mà gửi **bất kỳ** `Idempotency-Key` nào mình đã dùng xong thì guard hoãn kiểm vai cho UnitOfWork.
  - Đường `dryRun` (S3 thêm nhiều) không bao giờ vào UnitOfWork, nên vai bị cấm nhận được bản xem trước.
  - Ví dụ: SAL nhận `LateCheckoutPreview` có `arrivalSameDay.guestDisplayName` của đơn khác.
- Vì sao quan trọng: lọt quyền đọc (rbac) và dữ liệu khách (D01) qua một đường SEC A3 tưởng đã khóa.
- Đề xuất sửa:
  - Guard kiểm vai **ngay** khi thân có `dryRun === true` (UnitOfWork không dùng khóa cho dry run).
  - `hasCompletedKey` thêm điều kiện `method` + `path` khớp bản ghi khóa.
  - `read()` của frontdesk gọi `guard.enforce(req)` như một lớp phòng thủ thứ hai.
  - Test: SAL có khóa đã xong gọi `setLateCheckout {dryRun:true}` → 403.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-05
- Mức độ: Major
- Vị trí: BE-A `frontdesk/internal/checkout.service.ts` `departureTime()` ~62–69, `departure()` ~76–85, `liveLateLines()` ~89–100 (chỉ dòng của đơn chính); `stay.service.ts` `setLateCheckout` nhận cả đơn con
- Vấn đề: đơn OTA gia hạn bằng **đơn con** (BR-422, giả định 5 – ARC chấp nhận ở mục B):
  - `checkOut` gửi `checkoutAt` luôn 422 `DATE_INVALID`, vì so với `departure_date` của đơn cha.
  - Gốc tính phụ thu trả muộn, căn, và kiểm "khách đến cùng ngày" lấy theo ngày đi của đơn cha.
  - Dòng `late_checkout` ghi trên đơn con không được tính lại, nên có thể thu hai lần.
- Vì sao quan trọng: không trả phòng được cho khách gia hạn OTA (luồng thật, hay gặp), hoặc tính sai phụ thu.
- Đề xuất sửa:
  - Một hàm `effectiveStay(row)` → `{departureDate, lastSegmentRoom, folioLines}` gộp đơn cha + con. `departureTime`, `departure`, `liveLateLines`, `lateQuote` đều dùng hàm này.
  - B15 chỉ nhận trên đơn chính (đơn con → 409 `INVALID_TRANSITION`, `detail` chỉ đơn chính).
  - Test: OTA 2 đêm + gia hạn 1 đêm (đơn con) → `checkOut {checkoutAt: ngày đi mới 13:00}` → 200 và phụ thu đúng 1 dòng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-06
- Mức độ: Major
- Vị trí: BE-A `frontdesk/internal/stay.service.ts` `setLateCheckout` dòng ~591–608 (`postLines … category: 'late_checkout'` mỗi lần `applySurcharge`)
- Vấn đề:
  - Mỗi lần hẹn lại giờ trả (16:00 → 17:00) **ghi thêm** một dòng phụ thu mà không đảo dòng còn sống trước đó.
  - Folio, bill và số tiền VietQR sai cho tới lúc trả phòng. Lúc đó G-10 mới sửa lại, và chỉ sửa được nếu `liveLateLines` gom đủ.
- Vì sao quan trọng: thu thừa nếu khách chuyển khoản theo QR trước giờ trả.
- Đề xuất sửa:
  - Dùng chung logic G-10 của `checkout.service.ts` ~244–289: đảo dòng sống rồi ghi dòng mới, trong cùng giao dịch.
  - Hoặc 409 `INVALID_TRANSITION` khi đã có phụ thu sống mà không gửi cờ thay thế.
  - Cùng chỗ: gia hạn (B13) phải hủy giờ trả muộn đã hẹn và đảo phụ thu trả muộn của ngày đi cũ (DOM S3-13 d).
  - Test: hẹn 15:00 rồi 17:00 → còn đúng 1 dòng sống 50 %.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-07
- Mức độ: Major
- Vị trí: BE-A `frontdesk/internal/checkin.service.ts` dòng ~128–130 (`const checkinTime = requestedTime ?? (priorNightWindow ? …)`) + `stay-rules.ts` ~66 (`addsPreviousNight` suy từ giờ)
- Vấn đề:
  - Trong khung B9a (ngày nghiệp vụ = ngày đến − 1, khách tới sau nửa đêm), client gửi `checkinTime: "14:00"` là qua được B9 thường.
  - Khách ở đêm đó mà không có `stay_night`, không có dòng tồn phòng (`room_occupancy`) và không có dòng folio.
- Vì sao quan trọng: thất thu đêm BR-417. Tồn phòng cũng sai (căn bị chiếm mà hệ thống không biết) → có thể bán trùng đêm đó.
- Đề xuất sửa:
  - Khi `priorNightWindow = true`, giờ nhận phòng **luôn** lấy từ đồng hồ server, và bắt buộc `addPriorNight` (hoặc FDL+ ghi đè có lý do, có audit).
  - Kiểm `expectedSurchargeVnd` với giá đêm trước như hợp đồng.
  - Test: 04:40 gửi `checkinTime 14:00` → 409/422, không nhận phòng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-08
- Mức độ: Major
- Vị trí: BE-A `frontdesk/internal/stay.service.ts` `changeRoom` ~736 (nhận `effectiveDate` tương lai), ~757/766 (kiểm sẵn sàng theo trạng thái **hôm nay**), ~890–896 và ~971–990 (VD/OD, OC, việc dọn, đặt lại `doorAccessHandedOver` **ngay**)
- Vấn đề: đổi phòng hẹn ngày sau áp mọi hiệu ứng ngay hôm nay:
  - Căn mới đang có khách hôm nay nhưng trống từ ngày đổi bị báo `ROOM_NOT_READY` sai.
  - Căn cũ chuyển VD, có việc dọn, mã/thẻ bị coi là chưa giao, trong khi khách chưa chuyển.
- Vì sao quan trọng: trạng thái buồng sai làm buồng phòng dọn nhầm căn khách đang ở. Lễ tân đọc rack sai.
- Đề xuất sửa: **ARC đã chốt trong hợp đồng** (0.3.6 bổ sung, trùng DOM S3-13 e): R2 chỉ nhận `effectiveDate` = ngày nghiệp vụ hôm nay, khác → 422 `DATE_INVALID` (`field` = `effectiveDate`). FE hiện đã chỉ gửi hôm nay. Đổi phòng hẹn ngày sau dời R3, khi đó sẽ có job áp hiệu ứng vào đúng ngày. BE-A thêm kiểm + test.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-09
- Mức độ: Major
- Vị trí: BE-A `events/internal/sse-hub.ts` dòng ~106–110 (`client.on('error') → this.listener = null`), LISTEN chỉ dựng lại trong `subscribe()` ~56–60; `events.controller.ts` ~94–96 (nhịp 25 s vẫn chạy)
- Vấn đề:
  - Kết nối LISTEN rớt (Postgres restart, mạng, `idle_session_timeout`) thì mọi luồng SSE đang mở vẫn nhận nhịp tim, nên client **không** kết nối lại.
  - Các luồng đó điếc cho tới khi có client mới mở luồng.
  - Không có handler `end`, không có keepAlive.
- Vì sao quan trọng: rack, "Cần chú ý", giấy tờ online đứng hình mà không báo gì (BUG-R2-029 trái chiều). Lễ tân nhận phòng trùng hoặc bỏ sót check-in online.
- Đề xuất sửa:
  - Bắt `error` và `end`: thử nối lại với backoff (1 s → 30 s) khi còn subscriber.
  - Thất bại quá N lần → đóng mọi luồng (client tự nối lại). Bật `keepAlive` cho client LISTEN.
  - Test: `pg_terminate_backend` kết nối LISTEN → sự kiện kế tiếp vẫn tới client đang mở (hoặc client nhận đóng luồng).
- Trạng thái: Open

### FB-R2-ARC-BE-S3-10
- Mức độ: Major
- Vị trí: BE-B migration `0040_money_s3_be_b.sql` dòng ~42–48 (`UPDATE payment p SET recorded_by_role = (SELECT … FROM user_property_role …)`)
- Vấn đề:
  - `payment` và `user_property_role` đều FORCE RLS, `ottimo_owner` là NOBYPASSRLS, và `app_current_property()` = NULL lúc migrate.
  - Vì thế UPDATE khớp **0 dòng** mà không báo lỗi.
  - 0016 và 0018 đã ghi đúng mẫu `NO FORCE` / `DISABLE` quanh backfill. 0040 không làm.
  - DB trắng của test không có dòng cũ nên không thấy. Staging có dữ liệu Sprint 2 thì thấy.
- Vì sao quan trọng: các khoản cũ không có `recorded_by_role`:
  - Không hiện trong danh sách `own_or_cash_handover` của FD.
  - `confirmCashHandover` → 409.
  - CHECK tách nhiệm đi qua nhờ NULL (thẻ 12).
- Đề xuất sửa:
  - Migration mới `0042_…_be_b.sql`: `NO FORCE` + `DISABLE` → UPDATE → `ENABLE` + `FORCE`, theo mẫu 0016.
  - Thêm `CHECK (recorded_by IS NULL OR recorded_by_role IS NOT NULL)`.
  - OPS: smoke staging đếm `payment` có `recorded_by` mà thiếu vai = 0.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-11
- Mức độ: Major
- Vị trí: BE-A `reservations/internal/money-bridge.ts` `recordInitialPayment` ~55–76 → BE-B `payments/public/payment.service.ts` `recordManual` ~138–170 (`reconciliation = p.reconciliation ?? reconciliationFor(p.method)`, `recordedByRole ?? null`)
- Vấn đề:
  - SAL/CTV tạo đơn kèm `initialPayment` tiền mặt (B2) thì khoản thu được lưu `not_required` và vai NULL.
  - Như vậy khoản này bỏ qua A46a (FD xác nhận tiền mặt nộp quầy), SEC-BE-22 và quy tắc "SAL/CTV luôn `pending`" mà `recordInTx` đang áp.
- Vì sao quan trọng: tiền mặt sale cầm về không ai đối chiếu. Hoa hồng "earned" sai (BR-527, ESC-017 A).
- Đề xuất sửa:
  - `recordManual` bắt buộc `recordedByRole`. SAL/CTV → ép `reconciliation = 'pending'`, `status` như `recordInTx`.
  - Gọn hơn: B2 đi qua `recordInTx` (một đường ghi tiền).
  - Test: CTV tạo đơn kèm 500.000 tiền mặt → khoản `pending`, có trong `listPayments` của FD.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-12
- Mức độ: Major
- Vị trí: BE-B `0040_money_s3_be_b.sql`:
  - ~73–79 `payment_reconcile_separation_check` (qua khi `self_reconciled = true`, cột app UPDATE được).
  - ~180 `payment_cash_handover_not_self_check` (`recorded_by_role IN (…)` = NULL khi vai NULL → CHECK qua).
  - ~105 `approval_request_refund_account_check` (qua khi `refund_method` NULL mà có `enc`).
  - `0007` dòng 12: `GRANT UPDATE ON approval_request` cả bảng.
- Vấn đề: SEC F5/F8 [CHẶN] yêu cầu tách nhiệm "kiểm dưới FOR UPDATE **và** CHECK DB". Hiện có ba lỗ:
  - CHECK không biết vai người đối soát.
  - NULL làm CHECK thành vô hiệu.
  - App sửa được `requested_by` / `amount_vnd` / `type` của `approval_request` → làm vô hiệu `refund_no_self_approval` và `refunded_vnd ≤ amount_vnd`.
- Vì sao quan trọng: lớp DB là lưới cuối khi code có lỗi. Hiện lưới này có lỗ đúng ở chỗ tiền.
- Đề xuất sửa (migration 0042/0043):
  - Thêm cột `reconciled_by_role` (snapshot) và `CHECK (NOT self_reconciled OR reconciled_by_role = 'owner')`.
  - `self_reconciled` phải bằng biểu thức người đối soát ∈ {người ghi, người xác nhận}.
  - Bọc `COALESCE(recorded_by_role, '')`.
  - `refund_account_check` đòi `refund_method` khi có `enc`.
  - `approval_request` chuyển sang GRANT UPDATE theo cột (trạng thái, quyết định, `refund_*`, `refunded_vnd`).
  - Test vi phạm từng CHECK → 23514.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-13
- Mức độ: Major
- Vị trí: BE-B `folio/public/folio.service.ts` `computeTotals` ~216–231 (`paidVnd` cộng mọi `succeeded`, kể cả `reconciliation = 'disputed'`; bỏ qua `received_amount_vnd` của `short`) ↔ `payments/internal/refunds.service.ts` ~417 (trần "đã thu − đã hoàn")
- Vấn đề: khoản đang tranh chấp hoặc tiền mặt nộp thiếu (`short` → `disputed`) vẫn tính đủ vào "đã thu", nên trần hoàn (SEC F8) cho hoàn cả tiền chưa hề về.
- Vì sao quan trọng: chi hoàn tiền khách sạn chưa nhận.
- Đề xuất sửa:
  - Trần hoàn: loại khoản `disputed`. Với `short`, lấy `received_amount_vnd`.
  - Hoặc chặn chi hoàn (409 `INVALID_TRANSITION`, `detail`) khi folio còn khoản `disputed`.
  - Giữ `paidVnd` hiển thị như cũ nhưng thêm `disputedVnd` nội bộ.
  - Khớp DOM S3-16 (a): khoản thừa chỉ được **chi** khi các khoản thu tạo ra nó đã đối soát hoặc là tiền mặt/POS.
  - Test: tiền mặt SAL 1.000.000, FD xác nhận `short` 700.000 → chi hoàn tối đa theo 700.000.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-14
- Mức độ: Major
- Vị trí: BE-B `folio/internal/folio-lines.service.ts` `adjust` ~430–451 (đảo + chèn dòng mới, không đổi `stay_night`) ↔ `folio.service.ts` `syncStay` ~700–712 (giữ dòng `room` chỉ khi `amount_vnd === night.roomRevenueVnd + reduced`)
- Vấn đề:
  - Sửa giá dòng `room` / `extra_person` (A31, trong sàn–trần) bị lần `resyncStay` kế tiếp đảo lại về giá cũ.
  - Các dòng FOC/giảm giá gắn với dòng cũ bị đảo và không ghi lại.
  - Cùng gốc với thẻ 01: dòng **suy ra từ đêm lưu trú** bị sửa ở folio mà nguồn (`stay_night`) không biết.
- Vì sao quan trọng: giá lễ tân đã thỏa thuận với khách mất sau một lần gia hạn hoặc đổi phòng.
- Đề xuất sửa: hợp đồng đã ghi rõ (0.3.6 bổ sung ở `adjustFolioLine`). Sửa giá dòng suy ra từ đêm phải ghi lại giá đêm ở đơn qua cổng của reservations, ví dụ `StayNightPricingPort.setNightRate(tx, stayNightId, gross, reason, actor)`, trong cùng giao dịch, rồi để `syncStay` giữ. Đến khi có cổng đó: 422 `NOT_ALLOWED` cho `room` / `extra_person` của đơn còn `in_house` / `confirmed`. Test: sửa giá đêm → gia hạn → giá sửa còn.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-15
- Mức độ: Major
- Vị trí – đọc/ghi bảng **vùng khác** (s3-contract 4.3), đã kiểm từng dòng:

  | # | Chỗ | Bảng (chủ) | Loại |
  |---|---|---|---|
  | a | `src/jobs/payment-jobs.ts` ~34–43 (BE-A, J24) | `payment` (BE-B) | **ghi** trạng thái + SM-12 + audit |
  | b | `events/internal/attention.service.ts` ~96–101 | `payment` (BE-B) | đọc, tự cài lại quy tắc BR-527-01 song song với `listPayments.reconcileOverdue` |
  | c | `frontdesk/internal/checkin.service.ts` ~663–669 (B17) | `folio_line` (BE-B) | đọc, tự cài lại "dòng sống" |
  | d | `payments/internal/refunds.service.ts` ~235–260, 173, 309, 497; `payments.service.ts` ~601 | `approval_request` (BE-A) | **ghi** `status`, `approver_id`, `decided_at`… ngoài SM-10 (không `state_transition`, ngân sách duyệt tháng lệch) |
  | e | `registration/internal/registration.service.ts` ~1321 (`listRegistrations`), `c3-log.service.ts` ~53 | `reservation` (BE-A) | JOIN đọc |
  | f | `guest-portal.service.ts` ~342–350, 517 ↔ `registration.service.ts` ~1422 | `guest_document`, `document_image`, `consent_record`, `registration` ↔ `online_checkin` (BE-C, hai module) | đọc chéo |
  | g | `reservations/internal/reservations.service.ts` ~272 | `reservation_guest` (frontdesk) | đọc ngược chiều phụ thuộc |
- Vì sao quan trọng:
  - Quy tắc nghiệp vụ bị nhân đôi ở nhiều nơi, sẽ lệch khi đổi một bên (b, c).
  - Máy trạng thái duyệt bị bỏ qua (d).
  - SAL/CTV H2 không áp được khi JOIN thẳng (e).
- Đề xuất sửa (làm trong Sprint 3):
  - **a**: `PaymentService.expireDue(tx, now)` ở `payments/public`. Job chỉ gọi hàm này.
  - **b**: payments đăng ký nguồn "Cần chú ý" `reconcile_overdue` qua `registerAttentionSource` (như BE-A đã làm cho các nguồn khác).
  - **c**: `FolioService.hasLiveLinesSince(tx, reservationId, at)`.
  - **d**: `ApprovalService.reopenForRedecision(tx, id, reason)` và `addRefunded(tx, id, amount)`. Cột `refund_*` vẫn do payments ghi (ARC giao từ s3-contract, ghi rõ ở mục B-4).
  - **e**: `StayViewPort.listForRegistration(tx, filter, cursor)` hoặc cột `arrival_date` sao chép ở `registration`. `codesByIds` cho nhật ký C3.
  - **f**: `registration/public` có hàm đọc cho guest-portal và ngược lại.
  - **g**: frontdesk cấp `partyMissingCount` qua hook.

  Nhóm đọc dữ liệu tham chiếu (`app_user`, `property`, `room`, `config_parameter`, `guest`) giữ như S2. Dời R3 thành cổng identity/platform.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-16
- Mức độ: Major
- Vị trí: BE-B `payments/public/payment.service.ts` ~131–136 (`@Optional() ModuleRef … get(ATTACHMENT_USAGE, { strict: false })`, ~332 gọi getter cho mọi khoản `not_required`); BE-C `files/public/attachment.service.ts` ~104–126 (`try { moduleRef.get(RESERVATION_SALES_PORT) } catch { return undefined }`); `folio` import `ATTACHMENT_USAGE` từ `payments/public` (folio ↔ payments import lẫn nhau)
- Vấn đề:
  - Vòng provider có thật: PaymentService → AttachmentService → ReservationSalesAdapter → ReservationsService → MoneyBridge → PaymentService. Vòng này đã làm app treo lúc khởi động một lần.
  - ModuleRef che vòng đi chứ không gỡ.
  - `get` ném lỗi khi thiếu token (không trả `undefined`), nên `need()` thành mã chết.
  - `catch {}` của AttachmentService nuốt lỗi nối dây và trả 404 trong im lặng.
  - Lookup chạy lại ở mỗi lần gọi.
- Vì sao quan trọng: Sprint 4 thêm housekeeping/maintenance port. Nếu không gỡ thì vòng sẽ dài thêm, và cách ghép worker khác api sẽ hỏng lúc chạy chứ không hỏng lúc build.
- Đề xuất sửa:
  - BE-A tách `ReservationReadPort` ở `reservations/public` (`ownership`, `stayInfo`, `stayView`) chỉ phụ thuộc DB, **không** MoneyBridge.
  - AttachmentService tiêm port này ở constructor. PaymentService tiêm `ATTACHMENT_USAGE` ở constructor. Bỏ cả hai ModuleRef.
  - Chuyển token `ATTACHMENT_USAGE` sang `files/public`.
  - Thêm test kiến trúc: cấm `ModuleRef` trong `src/modules/**` (trừ danh sách cho phép có lý do).
- Trạng thái: Open

### FB-R2-ARC-BE-S3-17
- Mức độ: Major
- Vị trí: BE-C `files/public/encrypted-blob.service.ts` `purge()` ~100–105 (`crypto.destroy(tx, …)` rồi `await this.store.delete(ref.blobKey)` **trước COMMIT**)
- Vấn đề: xóa tệp trên đĩa nằm trong giao dịch chưa commit. Nếu giao dịch rollback sau đó thì DEK được khôi phục nhưng tệp đã mất. Các trường hợp:
  - `guestUpload` xóa ảnh cũ rồi `storeImages` lỗi (`TOO_MANY_FILES`, đĩa).
  - Hook `onReservationVoided` trong giao dịch hủy đơn của BE-A, mà giao dịch này thất bại.
  - Một dòng lỗi trong lô J16 làm mất tệp của các dòng trước nó.
- Vì sao quan trọng: mất ảnh giấy tờ của đơn vẫn còn hiệu lực (C3, bằng chứng khai báo). Lễ tân phải xin khách gửi lại.
- Đề xuất sửa:
  - Trong giao dịch chỉ hủy DEK (đủ để crypto-shred) và ghi `purge_journal`. Đồng thời ghi khóa blob vào hàng đợi chờ xóa (`blob_pending_delete`).
  - Xóa tệp **sau commit**: hook sau commit + J16 quét hàng đợi.
  - Test: hủy đơn với hook ném lỗi sau `purge` → ảnh vẫn đọc được.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-18
- Mức độ: Major
- Vị trí:
  - `src/http.ts` ~87–95: 42 MB đệm **trước** `AuthGuard` trên mọi route, không `requestTimeout`; chú thích "Caddy caps 25 MB" không khớp, vì `infra/caddy/Caddyfile.prod` (OPS đang viết) đặt `max_size 25MB`, nhỏ hơn 4 × 10 MB ảnh.
  - `files/public/image-pipeline.ts` ~57–69: hàng đợi `waiting` không giới hạn, mỗi phần tử giữ cả thân.
  - ~91–94: `failOn: 'error'`, không `sequentialRead`, không `sharp.cache(false)`.
  - `guest-portal/internal/guest.controller.ts` ~196: giải mã 4 × 40 MP **trước** khi kiểm luồng còn mở / bước thông báo / hạn mức 30 tệp.
  - Upload không tính vào SR-RL-05.
- Vấn đề: tài nguyên upload không bị chặn, và một phần việc tốn kém xảy ra trước khi xác thực hoặc trước khi kiểm rẻ.
- Vì sao quan trọng: CPU/RAM VPS nhỏ bị khách mức 1 chiếm. Ảnh giấy tờ đã giải mã nằm lại trong cache libvips.
- Đề xuất sửa:
  - Giới hạn thân theo route: upload 42 MB, còn lại 1 MB.
  - `requestTimeout` 60 s.
  - Trần upload đang xử lý toàn tiến trình (ví dụ 4): vượt → 503 + `Retry-After`, không xếp hàng.
  - Kiểm rẻ (phiên/luồng/hạn mức, chỉ đọc) **trước** khi giải mã. Đếm upload theo phiên khách.
  - `sharp.cache(false)`, `sequentialRead: true`, `failOn: 'warning'`.
  - **OPS**: Caddy `request_body max_size 42MB` chỉ cho 3 đường upload, 1 MB cho phần còn lại.
  - SEC xem cùng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-19
- Mức độ: Major
- Vị trí: BE-C `registration/internal/registration.controller.ts` ~194–197 (`createHash('sha256').update(req.body as Buffer)` – băm **nguyên thân multipart**)
- Vấn đề:
  - Thân multipart chứa boundary ngẫu nhiên, và trình duyệt sinh boundary mới ở **mỗi** lần gửi, kể cả cùng một FormData.
  - Vì vậy FE gửi lại cùng `Idempotency-Key` (`useWrite`, mẫu DS 6.21) luôn gặp 422 `IDEMPOTENCY_KEY_REUSED`.
  - Hai controller khác (khách, attachment) đã băm theo phần logic (JSON + SHA-256 từng ảnh).
- Vì sao quan trọng: thêm giấy tờ C3 tại quầy là thao tác dễ gặp mạng chập chờn. Gửi lại an toàn là cam kết của hợp đồng (Idempotency-Key).
- Đề xuất sửa:
  - Băm `canonicalJson({ data, images: [sha256 từng ảnh đã chuẩn hóa…] })` như `guest.controller.ts`.
  - Test: hai lần gửi cùng khóa với boundary khác → lần 2 trả lại kết quả lần 1.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-20
- Mức độ: Major
- Vị trí:
  - BE-C `registration/internal/rules.ts` `portalFields()` ~573–620: ngày `YYYY-MM-DD`, nhãn là khóa i18n, URL cổng hằng số ở `registration.service.ts` ~1788.
  - INT `integrations/guest-registration/manual.ts`: `toPortalDate` → `dd/MM/yyyy`, nhãn tiếng Việt cố định, URL cổng là cấu hình bắt buộc, quốc tịch `toUpperCase()`.
  - api không import gói INT này.
- Vấn đề: có **hai** cài đặt dữ liệu cổng khai báo, khác định dạng ngày, nhãn và nguồn URL. Bản đang chạy (BE-C) dán ngày ISO lên cổng Bộ Công an. Quy tắc BR-605 (ngày đi ≤ hạn thị thực) cũng được viết hai lần.
- Vì sao quan trọng: khai báo lưu trú là nghĩa vụ pháp lý. Sai định dạng thì cổng từ chối hoặc ghi sai ngày, và lễ tân phải gõ tay. Hai bản sẽ lệch tiếp.
- Đề xuất sửa (**ARC chốt**):
  - **Một** cài đặt ở server: `rules.ts` của BE-C, giữ `valueKey`/i18n.
  - Định dạng theo DOM S3-5 (`[GIẢ ĐỊNH – chờ INV, ESC-018]`): ngày theo tham số `portal_date_format` (mặc định `dd/MM/yyyy`, như bản INT); quốc tịch theo `portal_nationality_format` (mặc định "Tên nước tiếng Việt (alpha-3)", tên từ `Intl.DisplayNames('vi')`); "Ngày đến" = ngày lịch của giờ nhận phòng thực tế. URL cổng đọc từ cấu hình (`GUEST_REGISTRATION_PORTAL_URL_*` trong `.env.example`, mặc định 2 URL hiện tại).
  - INT bỏ phần dựng trường trong `guest-registration/manual.ts`, chỉ giữ kiểu dữ liệu, regex mã hồ sơ cổng và cấu hình URL.
  - Hợp đồng đã ghi ở `PortalData.fields[].value` (0.3.6 bổ sung) kèm `[GIẢ ĐỊNH – DOM/lễ tân đối chiếu cổng thật]`.
  - Test: một bộ ca BR-605 dùng chung.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-21
- Mức độ: Major
- Vị trí: quy tắc migration mới `outputs/ARC/s3-contract.md` **4.2a-9** (thay "migration rỗng" của quy tắc 8); CI `.github/workflows/ci.yml` bước "Schema matches migrations"
- Vấn đề:
  - Sau khi ORC sinh snapshot `0052_snapshot.json` từ `.ts` (d71d7cf), bước CI "drizzle-kit generate không sinh tệp" chỉ còn so `.ts` ↔ snapshot. Cả hai đều sinh từ `.ts`.
  - Bước này **không còn** bắt "SQL viết tay lệch `.ts`".
  - ARC đã kiểm tĩnh hôm nay và thấy 0 lệch (mục D), nhưng chưa có gì giữ điều đó cho các lần sau.
- Vì sao quan trọng: kiểu truy vấn TS sai so với DB thật thì lỗi chỉ lộ lúc chạy (cột NOT NULL, CHECK).
- Đề xuất sửa:
  - **BE-A** thêm `test/integration/schema-parity.test.ts`. Sau `migrate`, test đọc `pg_catalog`: bảng; cột (kiểu, NOT NULL); tên và thân chuẩn hóa của CHECK; tên FK/UK/chỉ mục. Rồi so với snapshot đầu.
  - Danh sách ngoại lệ 4.2a-2e đặt cứng trong test, kèm lý do.
  - **OPS**: không cần bước CI mới, test chạy trong job tích hợp sẵn có.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-22
- Mức độ: Minor
- Vị trí: `0030_frontdesk_be_a.sql`, `0050`–`0052` (BE-C)
- Vấn đề:
  - FK chờ "khi bảng kia lên main" nay đã thêm được: `reservation_guest.child_data_key_id → data_key`, `guest_document.party_member_id → reservation_guest`.
  - FK chưa theo cặp tenant: FK `data_key` ở 0050 dòng 74 và 0051 dòng 155/157, `guest_session_token_fk`.
  - Thiếu FK: `guest_document.reservation_id`, `guest_session.reservation_id`, cột người dùng (`*_by`) ở 0030.
  - `document_image.registration_id` không có chỉ mục (`imagesOf` lọc theo nó).
  - GRANT UPDATE cả bảng `reservation_guest` / `staff_notification` / `attention_event`. `GRANT UPDATE(destroyed_at, wrapped_key)` cho phép "khôi phục" DEK.
  - Thiếu CHECK cặp `removed_at` / `removed_by`, `ref_type` / `ref_id`.
- Vì sao quan trọng: toàn vẹn dữ liệu C3 và đặc quyền tối thiểu.
- Đề xuất sửa:
  - `0031_…_be_a.sql` (FK `child_data_key_id`, FK người dùng, GRANT theo cột, CHECK cặp).
  - `0053_…_be_c.sql` (FK `party_member_id`, cặp tenant, chỉ mục, trigger cấm `destroyed_at` từ NOT NULL → NULL).
  - Theo quy tắc 4.2a (sửa snapshot `0053`).
- Trạng thái: Open

### FB-R2-ARC-BE-S3-23
- Mức độ: Minor
- Vị trí: BE-A `events` + gọi từ frontdesk
- Vấn đề:
  1. **Hai lần đẩy thông báo duyệt**: `approvals.submit` đã đẩy, mà `checkin.service.ts` ~385–396 và `stay.service.ts` ~536–547 gọi thêm `events.notify` → 2 dòng `staff.push`.
  2. Yêu cầu `refund` từ trả phòng / trả sớm không có dòng hộp thư.
  3. `checkout.service.ts` ~454–459 phát `payment.changed` với **id yêu cầu duyệt**.
  4. `attention-sources.ts`: `count = rows.length` bị chặn ở `LIMIT 100`.
  5. `new EventsService()` ở `stay-view.ts` ~163 và `payment-jobs.ts` ~45 (ngoài DI).
  6. SSE: socket đóng trước khi gắn `close` giữ timer tới hết hạn; bỏ qua giá trị trả về của `raw.write` (không có áp lực ngược).
- Vì sao quan trọng: thông báo trùng hoặc thiếu; client tải sai tài nguyên khi nhận sự kiện.
- Đề xuất sửa: một nơi đẩy cho mỗi loại (approvals); `payment.changed` chỉ mang `paymentId`; `count` bằng `count(*)`; tiêm `EventsService`; kiểm `raw.destroyed` sau khi đăng ký; đóng luồng khi `write` trả `false` quá N lần.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-24
- Mức độ: Minor
- Vị trí: BE-A `checkin.service.ts`, `stay.service.ts`, `stay-rules.ts`, `sales-port.adapter.ts`
- Vấn đề:
  1. `SURCHARGE_CHANGED` ném sau kiểm trường 422 (~346/347), và khóa extras không phải `surchargeVnd` như bảng "Trường mở rộng của Problem".
  2. `documentBlockOverride` chỉ ghi audit, không gửi thông báo MGR (spec EP06 mục 4).
  3. Đêm B9a của đơn trực tiếp không đánh dấu giá tay trong `pricing_snapshot`, nên lần gia hạn sau tính lại bậc BR-107 cho giá lễ tân đã gõ.
  4. `stay-rules.ts` ~114: không có bậc trả muộn thì `Math.max()` = `-Infinity`, mọi giờ trả muộn thành "gia hạn".
  5. `stayInfo` không nhận `actor` (SEC H2 – SEC xác nhận được vì không có dữ liệu cá nhân).
  6. **(DOM xác nhận)** `removePartyMember` giữ số khách và dòng phụ thu cũ.
  7. `earlyDeparture` tính trên giá gộp, bỏ qua `discount_vnd` (~1091–1093) – **DOM S3-2 đã chốt: tính trên giá ròng** (xem B-1 dòng 7).
- Vì sao quan trọng: lệch hợp đồng (FE đọc `surchargeVnd`), sai giá nhỏ.
- Đề xuất sửa: sửa 1–5 và 7 trong Sprint 3. Ý 6 sửa cùng thẻ 01 theo DOM S3-13 (a) (phụ thu người theo từng đêm, thêm/bớt người áp từ `effectiveFrom`).
- Trạng thái: Open

### FB-R2-ARC-BE-S3-25
- Mức độ: Minor
- Vị trí: BE-B `refunds.service.ts` `payOut` (~391 khóa `approval_request` → ~407 khóa folio; `folio.status` đọc ở ~405 **trước** khóa) ↔ `payments.service.ts` `reverse()` hoàn tiền (đơn → folio → payment → `approval_request` ~601); `inventory/internal/minibar.service.ts` ~183–185 (đọc trạng thái trước khóa)
- Vấn đề: thứ tự khóa ngược nhau giữa chi hoàn và đảo khoản hoàn, nên có thể deadlock (40P01 → 500). Kiểm trạng thái làm trước khóa.
- Vì sao quan trọng: hiếm gặp với 10 căn nhưng lỗi khó tái hiện. Quy ước khóa của dự án là reservation → room → folio → payment → approval.
- Đề xuất sửa: `payOut` khóa folio trước `approval_request`; mọi kiểm trạng thái làm sau `FOR UPDATE`. Ghi thứ tự khóa vào `coding-standards.md` (ARC thêm khi sửa tài liệu).
- Trạng thái: Open

### FB-R2-ARC-BE-S3-26
- Mức độ: Minor
- Vị trí: BE-B `payments` / `folio`
- Vấn đề:
  1. `executeRefund` `original_method` có thể ra `cash` hoặc `ota_collect` (~419–438). Khi đó OWN/MGR chi tiền mặt mà không cần biên nhận ký, tức là bỏ qua A47a.
  2. Không có UK trên `payment.reversal_of_id`.
  3. FK cặp `approval_request` không ghim `type = 'refund'`.
  4. Mã trường `AMOUNT_TOO_HIGH` không có trong hợp đồng → ARC chốt dùng `AMOUNT_EXCEEDS_BALANCE` (đã ghi vào bảng mã 0.3.6 bổ sung). `NOT_ALLOWED` đã thêm vào bảng.
  5. `anchorPaymentAttachment(undefined, …)` lặng lẽ bỏ qua mốc hạn lưu.
  6. Lệch hợp đồng:
     - `recordPayment` còn trả 403/404/409 `FOLIO_LOCKED`.
     - `reversePayment` còn trả 409/422.
     - Mô tả `createRefundRequest` nói gửi được `destination`, nhưng schema không có (zod bỏ qua im lặng).
     - `Payment` thiếu `receivedAmountVnd`, `selfReconciled`.
- Vì sao quan trọng: kiểm soát chi tiền mặt; FE không đọc được số nộp thiếu.
- Đề xuất sửa:
  - `original_method` ra `cash` → 409 `INVALID_TRANSITION` (`detail`: dùng `executeCashRefund`).
  - Thêm `UNIQUE (reversal_of_id) WHERE reversal_of_id IS NOT NULL`.
  - Đổi sang `AMOUNT_EXCEEDS_BALANCE`.
  - `need()` khi có `attachment_id`.
  - ARC thêm phần lệch hợp đồng (ý 6) vào **0.3.7**.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-27
- Mức độ: Minor
- Vị trí: BE-C `registration`, `files`, `guest-portal`
- Vấn đề:
  1. `legal_hold` chỉ J16 tôn trọng. Các đường xóa trực tiếp (`purgeRequested`, `purgeImages` ở ~840, 1224, 1592, 1645, 1717) bỏ qua nó, và không ai đặt cờ này.
  2. J16: một dòng lỗi làm hỏng cả lô 500 mỗi giờ (poison pill), không ghi `retention_run` `failed`.
  3. `attachment_purge_idx` đánh trên `purge_after`, mà không ai ghi cột này (`purgeDue` lọc theo `retention_anchor_at`).
  4. `getPortalData` trả 500 khi DEK đã hủy (`DataKeyDestroyedError` không được map; `sensitive()` map 404).
  5. Khách thấy số người "đã tải" tính cả ảnh đã xóa (`guest-portal.service.ts` ~344, `EXISTS document_image` thiếu `deleted_at IS NULL`).
  6. GET ghi DB (`listRegistrations` backfill, `getOnlineCheckin.ensure()`).
  7. `assertUsable` / `bindTo` không khóa, nên một ảnh biên nhận gắn được cho hai khoản thu (`attachment.service.ts` ~215, ~226).
- Vì sao quan trọng: các vấn đề vận hành và toàn vẹn nhỏ.
- Đề xuất sửa:
  - Bỏ `legal_hold` khỏi R2 (ghi chú) hoặc kiểm trong `purgeImages`.
  - SAVEPOINT từng dòng + ghi `failed` ở giao dịch riêng.
  - Đánh chỉ mục đúng cột.
  - Map 404.
  - Thêm `deleted_at IS NULL`.
  - Chuyển backfill sang job / lần ghi.
  - `UPDATE … WHERE bound_ref_id IS NULL` + kiểm số dòng.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-28
- Mức độ: Minor
- Vị trí: `shared/serialization/serializer.ts` ~67 (cắt theo `g` chỉ khi khai báo – opt-in); `test/helpers/feature-app.ts` ~59 (`guest: []`) + `csrf.ts` ~55 (danh sách rỗng = cho mọi Origin)
- Vấn đề:
  - Hiện không lộ dữ liệu: schema đóng, `guestFullName` / `doorCode` có `g: 2`.
  - Nhưng không có test nào cho bước cắt theo mức khách. Kiểm Origin của khách cũng chưa từng chạy trong test.
  - Thêm một trường vào schema khách mà quên `x-guest-level` thì trường đó lọt ra mức 1.
- Vì sao quan trọng: ĐK-2 là điều kiện SEC. Lưới an toàn phải được test.
- Đề xuất sửa:
  - Test serializer (trường `g: 2` không ra ở mức 1).
  - Test Origin với danh sách khách cấu hình thật.
  - Kiểm hợp đồng trong `contract.test.ts`: mọi thuộc tính trong phản hồi op khách phải có `x-guest-level` **hoặc** nằm trong danh sách đã duyệt; op khách chỉ ở `/v1/guest/` và `x-roles` = `['guest']`.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-29
- Mức độ: Minor
- Vị trí: INT `integrations/payment/vietqr/adapter.ts`; api `payments/internal/vietqr.ts` ~30
- Vấn đề:
  1. `now` mặc định là hằng `isoInstant('2026-10-16T09:00:00+07:00')`: `healthCheck` luôn báo cùng một giờ nếu quên tiêm Clock.
  2. Adapter có nhánh dự phòng `PAYMENT_VIETQR_*` từ env mà api không dùng. api chỉ dùng tham số `payment_receiving_account` (OWN + xác nhận lại + audit – SEC F3). Hai nguồn số tài khoản nhận là rủi ro: đổi env thì không có audit.
  3. `maskAccount` trong api không ai dùng, và hai định dạng che khác nhau (`••••6789` và `9704••••1234`).
- Vì sao quan trọng: số tài khoản nhận tiền là dữ liệu toàn vẹn quan trọng (SEC F3).
- Đề xuất sửa:
  - Bắt buộc `now`.
  - **ARC chốt một nguồn**: tham số `payment_receiving_account`. Bỏ nhánh env, hoặc chỉ cho `NODE_ENV=development`.
  - Một hàm che dùng chung theo mẫu hợp đồng `9704••••1234`.
  - Xóa mã chết.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-30
- Mức độ: Minor
- Vị trí: BE-A `stay.service.ts` `getExtensionOptions` / `extend` (~154–172, ~260: `isFree` + `directRate` mỗi đêm, chạy 2 lần khi giữ khóa đơn; HĐ nhập tay tới 62 đêm), `changeRoom` ~783; BE-C `listRegistrations` (`readRegistration` từng dòng – N+1)
- Vấn đề: khoảng 3 truy vấn/đêm × 2 lần trong khi giữ khóa; N+1 ở danh sách khai báo.
- Vì sao quan trọng: ngân sách p95 < 300 ms. Với 10 căn vẫn ổn, nhưng khóa đơn bị giữ lâu.
- Đề xuất sửa: một truy vấn tồn phòng theo khoảng ngày + một lần đọc giá cho cả khoảng; tính tùy chọn **trước** khi khóa rồi kiểm lại dưới khóa. `listRegistrations` đọc theo lô. QA đo p95 `extendStay` / `getExtensionOptions` với 62 đêm.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-31
- Mức độ: Suggestion
- Vị trí: BE-C `crypto` / `files`
- Vấn đề:
  1. Crypto-shredding chỉ chắc khi bản sao lưu hết hạn: DEK bọc còn trong WAL / backup ≤ 35 ngày, mở được bằng KEK hiện hành (erd đã ghi SR-KEY-09). `rewrap` chưa có job.
  2. `setRetentionAnchor` thiếu cả `id` lẫn `reservationId` thì cập nhật mọi tệp cùng `purpose` (~239–245).
  3. Regex của `crypto-boundary.test.ts` không bắt `"data_key"` / `public.data_key`.
- Đề xuất sửa: runbook xoay KEK (OPS, R3) + job `rewrap`; bắt buộc một trong hai khóa lọc; mở rộng regex.
- Trạng thái: Open

### FB-R2-ARC-BE-S3-32
- Mức độ: Suggestion
- Vị trí: BE-B `0040`/`0041` (`invoice_request`, `item` GRANT UPDATE cả bảng); `minibar.service.ts` ~200–213 (kiểm lại chỉ đảo dòng chưa đảo – dòng đã `adjust` giữ khoản thay thế)
- Đề xuất sửa: GRANT theo cột; khi kiểm lại, đảo theo chuỗi `related_line_id` (dòng thay thế của dòng minibar cũ).
- Trạng thái: Open

---

## B. Quyết định giả định chờ ARC

### B-1. BE-A `s3-be-a.md` mục 5 (11 giả định) + mục 8 ý 3
| # | Giả định | ARC quyết | Ghi chú |
|---|---|---|---|
| 1 | Người đứng tên không có dòng `reservation_guest`; `member.id` = id đơn; bỏ → 409 | **Đồng ý** | 0.3.7 ghi vào mô tả `PartyMember.id` |
| 2 | Chưa trả `childDisplayName` (chỉ `priceAgeBand`, `isMinorData`) | **Đồng ý cho R2** (tối thiểu hóa D09). Trường vẫn tùy chọn trong hợp đồng | UXD dùng "Trẻ em n (6–11)" |
| 3 | Thêm người làm đổi số khách đơn chưa nhận phòng → 409 `INVALID_TRANSITION`; sửa số khách bằng `updateReservation` trước | **Đồng ý** – một đường định giá. FE đã có `checkin.fix_guest_count` | 0.3.7 ghi rõ ở `addPartyMember` |
| 4 | Giá đêm gia hạn mặc định = lịch giá kênh Trực tiếp đêm đó (BR-104/421) | **Đồng ý** về kỹ thuật | DOM đã ghi BR-421 |
| 5 | B9a / gia hạn của đơn OTA (và HĐ nhập tay thêm đêm trước) → **đơn con kênh Trực tiếp** `in_house`, cùng căn, **cùng folio**; trả phòng trên đơn chính | **Đồng ý**, kèm 4 điều kiện:<br>(a) Đơn con không sinh khai báo (đã đúng – `registration.service.ts` ~166 bỏ qua `parentReservationId`).<br>(b) Đơn con không hiện thành "khách đến"/không đến trên rack và "Cần chú ý".<br>(c) Mọi tính toán trả phòng dùng ngày đi gộp – **thẻ 05**.<br>(d) Doanh thu đêm con tính kênh Trực tiếp (không hoa hồng OTA) | QA thêm ca rack/attention cho đơn con |
| 6 | `checkOut` chỉ trên đơn chính; ngày đi = muộn nhất của cha + con | **Đồng ý**; B15 cũng chỉ đơn chính (thẻ 05) | – |
| 7 | Trả sớm: giữ lại ghi `early_departure_fee`; hoàn = min(BR-428, tiền dư); không tính lại BR-107 | **Đồng ý theo DOM S3-1/S3-2 (17/10)**: không tính lại BR-107. Sửa cách tính: cơ sở BR-428 = giá **ròng** (`room_revenue_vnd`, sau bậc và FOC/giảm giá) – đóng ý 7 của thẻ 24; phụ thu người của đêm bỏ hoàn 100 %; hoàn = min(phần hoàn + phụ thu người đêm bỏ, số dư thừa chưa xử lý); làm tròn phần hoàn nửa lên; đơn OTA nhập số OTA giữ lại | BE-A sửa ở Phản hồi & sửa |
| 8 | `retain_with_guest_consent` → dòng `deposit_forfeit` | **Giữ category `deposit_forfeit`** (không đổi enum hợp đồng R2) nhưng theo DOM S3-4: chỉ khi khách tự nguyện bỏ khoản thừa, `charge_code = overpayment_retained`, doanh thu khác, bill in "Khách để lại tiền thừa (không hoàn)" (qua `labelKey`). Tách category riêng nếu DATA cần – 0.3.7 | – |
| 9 | Sau trả phòng căn `VD` | **Đồng ý** (BR-402) | QA biết khi test liền mạch |
| 10 | `room_status` nằm ở `frontdesk` tới Sprint 4 | **Đồng ý**. Sprint 4: bảng chuyển chủ sang `housekeeping` (không đổi tên bảng); frontdesk gọi `RoomStatusPort` | Ghi vào kế hoạch 0.3.7 |
| 11 | Tuổi trẻ em theo năm (ngày đến − năm sinh) | **Sửa theo DOM S3-7**: tuổi nhỏ nhất có thể = năm đến − năm sinh − 1 (lợi khách ở phụ thu/sức chứa, an toàn ở ngưỡng dữ liệu trẻ em) | BE-A sửa `priceAgeBand` |
| 8.3 | Duyệt `refund` theo **vai** (MGR/OWN mọi số tiền), không theo `foc_limits` / ngân sách FOC tháng | **Đồng ý** – BR-522 + ESC-006 A. Trần tiền đã do nơi tạo/chi kiểm (≤ credit, ≤ duyệt − đã chi). `refund` là trả lại tiền của khách, không phải chiết khấu | Đóng S3-B1 của BE-B |

### B-2. BE-B `s3-be-b.md` mục 7
| # | ARC quyết |
|---|---|
| S3-B1 | Như B-1 dòng 8.3 – **đóng** |
| S3-B2 | BE-A đã làm (s3-be-a mục 8.4) – **đóng** |
| S3-B3, S3-B4 | Đã xong (mục 9) – **đóng**. Lưu ý thẻ 15 (b, c) còn hai chỗ đọc chéo |
| S3-B5 | J24 BE-A đã làm – **đóng**, nhưng chuyển phần ghi `payment` về `PaymentService.expireDue` (thẻ 15a) |
| S3-B6 | Thuộc DOM (BR-527-05 so với BR-903) – ARC không quyết |
| S3-B7 | **Xác nhận**: `If-Match` của `adjustFolioLine` = `Folio.version` (đã ghi vào hợp đồng 0.3.6 bổ sung). `receivingAccountChangedAt` là `Instant` có offset như mọi `Instant`. Minibar của HK không có trường tiền – đúng D14 |
| S3-B8 | QA – không cần ARC |
| Mục 8 (giả định) | `original_method` = phương thức khoản thu gần nhất: **chấp nhận R2** nhưng ra `cash` thì chuyển `executeCashRefund` (thẻ 26). Trần VietQR khi `hold` = cọc còn thiếu: **đồng ý**. Sàn–trần dòng phòng theo giá dòng: **đồng ý tạm**, đúng khi thẻ 14 xong (giá dòng = giá đêm) |

### B-3. Ranh giới `frontdesk` ↔ `reservations` (quyết định kiến trúc)
- `frontdesk` ghi thẳng `reservation`, `reservation_segment`, `stay_night` khoảng 40 chỗ, cùng chủ BE-A.
- **ARC chốt**: hai module này là **một aggregate** "đặt phòng – lưu trú" (gốc `reservation`). Frontdesk được ghi ba bảng đó, với điều kiện:
  - (a) Giữ `FOR UPDATE` dòng đơn.
  - (b) Tăng `version` + `reservation_change` + `emit` hook.
  - (c) Tồn phòng **chỉ** qua `OccupancyService`.
  - (d) Giá đêm / snapshot chỉ qua hàm định giá của reservations – thẻ 01 và 14 là hậu quả khi vi phạm (d).
- R3 gộp code vào `reservations/internal/stay/*` hoặc tách cổng ghi rõ ràng.
- `stay-port.ts` đang xuất lại `../internal/*`. Chấp nhận trong aggregate, nhưng **không** module ngoài BE-A nào được import `stay-port`; lint thêm luật này.

### B-4. Cột `approval_request.refund_*`, `refunded_vnd`
- ARC đã giao BE-B ghi các cột này (s3-contract) – **giữ**.
- Nhưng `status`, `approver_*`, `decided_*` chỉ được đổi qua `ApprovalService` (thẻ 15d).

### B-5. BE-C `PortalData.fields[].valueKey` (ORC 17/10 đã thêm)
- **Duyệt.** ARC bổ sung thêm: `label` có pattern `^reg\.field\.[a-z_]+$`, `value` gắn `x-rbac-field: D03` (như `clipboardText`), định dạng ngày/quốc tịch (thẻ 20).

## C. Hợp đồng còn mở – quyết định
| Đề nghị | Từ | ARC quyết | Phiên bản |
|---|---|---|---|
| `currentNoticeVersion` + `imageRetentionDays` cho app khách | MOB mục 5 (Major) | **Áp ngay, theo đúng điều kiện SEC duyệt ĐK-2 (s3-SEC mục 4 b, 17/10)**: `OnlineCheckin.currentNoticeVersion`, `OnlineCheckin.imageRetentionDays` (mức 1, `x-sec-review: approved-DK2 (SEC 17/10/2026)`, có ở mọi phản hồi `OnlineCheckin`, khóa cho phép 9 → 11) + `ConsentInput.retentionDays` (bắt buộc với P02b, lệch tham số → 422 `NOT_IN_LIST`), `consent_record.retention_days` (erd), J16 T02 dùng min. Client gặp phiên bản lạ/thiếu trường → không hiện câu đồng ý (fail closed). Việc: **BE-C** (0053 + server), **MOB** (bỏ hằng `NOTICE_VERSION`/30) | 0.3.6 bổ sung |
| Đọc lại `GuestSession` khi tải lại trang / `guestFirstName` | MOB (Minor) | **0.3.7**: `getGuestSession` `GET /v1/guest/sessions/current` trả đúng `GuestSession` – SEC đã duyệt cách làm (s3-SEC 4 b: chỉ tên gọi, `no-store`, sau `stayEnded` không trả tên/căn, tính vào giới hạn phiên/IP). **Không** thêm `guestFirstName` vào `GuestStay`. MOB giữ giả định hiện mã đặt phòng tới lúc đó | 0.3.7 |
| `updateOnlineCheckin.deferredPeople` | MOB (Minor) | **0.3.7** – phản hồi đã có `deferredPeople` (SEC đã duyệt), chỉ thêm vào thân cập nhật | 0.3.7 |
| AllowedAction cho "Đã giao mã/thẻ", "Thêm phát sinh" (+ "Xác nhận giờ trả", "Người đi cùng") | FE (a) | **0.3.7**: không nhét vào `allowedActions` (dành cho chuyển trạng thái SM). Thêm `Reservation.availableOperations: OperationId[]` – tập đóng các operationId ngoài máy trạng thái (`updateReservation.doorAccessHandedOver`, `addFolioLine`, `recordCheckoutConfirmation`, `addPartyMember`, `removePartyMember`), server tính theo vai × trạng thái. FE giữ cách hiện (server vẫn kiểm 403/409) | 0.3.7 |
| `PartyMemberCreate` người lớn chỉ nhận `guestId` | FE (b) | **Giữ** – người đi cùng là hồ sơ khách (C2, module guests); tạo nhanh qua `GuestPicker` là đúng | – |
| "MGR đã chấp nhận cọc thiếu" trên `Reservation` | FE (c) | **Áp ngay**: `Reservation.depositShortfall {shortfallVnd, acceptedAt, acceptedByName, reason} \| null` (FD+). Cột đã có ở 0040. BE-A map trong `reservation-dto.ts` | 0.3.6 bổ sung |
| Mã trường `AMOUNT_TOO_HIGH`, `NOT_ALLOWED` | review (thẻ 26) | `AMOUNT_EXCEEDS_BALANCE` mở rộng cho ghi tiền; thêm `NOT_ALLOWED` | 0.3.6 bổ sung |
| `changeRoom.effectiveDate` | review (thẻ 08) | R2 chỉ hôm nay | 0.3.6 bổ sung |
| `adjustFolioLine` `If-Match` + dòng suy ra từ đêm | BE-B S3-B7, thẻ 14 | Ghi rõ mô tả | 0.3.6 bổ sung |
| Tên mã khi phụ thu > 0 mà thiếu quyết định | DOM s3 (S3-12) | `SURCHARGE_DECISION_REQUIRED` (mã trường, đã thêm vào bảng) | 0.3.6 bổ sung |
| Nhãn dòng bill dịch được | DOM s3 (thẻ bill, FE-03) | ARC chốt tên: `Bill.lines[].labelKey` (khóa `bill.line.*`) + `labelParams` (object khóa→chuỗi/số, đóng theo từng khóa); `description` chỉ còn cho nhật ký. Áp vào hợp đồng ở bước **Phản hồi & sửa** sau khi DOM/UXD chốt danh sách khóa | Phản hồi & sửa S3 |
| `FolioTotals` đơn OTA trả trước (`ota_collect` hệ thống, không vào `credit_balance`) | DOM s3 | ARC ghi vào mô tả `FolioTotals`/`Bill` ở bước **Phản hồi & sửa** cùng BE-B (cần thống nhất với G-13 đã cài) | Phản hồi & sửa S3 |

**Kiểm tra sau khi áp** (17/10, trên tệp thật):

| Lệnh | Kết quả |
|---|---|
| `openapi-spec-validator` | OK |
| `gen-openapi-meta.mjs` → `--check` | up to date |
| api-client `gen.mjs` → `--check` | up to date |
| `gen_rbac_cases --check` | 189 op, mismatch [] |
| `gen_traceability --strict` | exit 0; `x-rbac-field` 145 |
| `tsc` api-client, api, admin-web, guest-web | 0 lỗi |
| `vitest test/contract.test.ts` | 5/5 |
| prettier (openapi + tệp sinh) | xanh |

Không đổi hành vi đã có ngoài `effectiveDate` (FE chỉ gửi hôm nay).

## D. Quy tắc migration 4.2 – trả lời ORC (snapshot d71d7cf, a297273)
- Đã sửa `outputs/ARC/s3-contract.md` **4.2a** và `erd.md` mục 16:
  - Snapshot đầu đi cùng PR có migration.
  - Tên snapshot đầu = tiền tố **lớn nhất** trong journal, không phải migration vừa gộp. Lý do: drizzle-kit 0.31.11 lấy tệp cuối theo thứ tự chữ – BE-A gộp `0031` sau `0052` mà đặt `0031_snapshot.json` thì tệp bị bỏ qua.
  - Giữ `id` / `prevId`.
  - Sinh lại khi xung đột, không trộn JSON tay.
  - Danh sách đối tượng chỉ có trong SQL.
  - Test `schema-parity` (thẻ 21).
- **Kiểm ERD (DEFERRABLE, CHECK)** – so snapshot 0052 với SQL 0000–0052:
  - Bảng 61/61 khớp.
  - Mọi CHECK của 0030–0052 trùng thân (chuẩn hóa) – 0 lệch.
  - `reservation_folio_fk` / `folio_primary_reservation_fk` / `minibar_check_replaced_by_fk` vẫn `DEFERRABLE INITIALLY DEFERRED`.
  - `room_occupancy_no_overlap` vẫn `DEFERRABLE INITIALLY IMMEDIATE`.
  - Phần khác chỉ là nhóm drizzle không biểu diễn được (FK chéo 0014, chỉ mục trgm/gist, `room_occupancy_range_check`). ERD còn đúng.

## E. Điểm làm tốt (giữ)
1. **Mã hóa phong bì + cổng C3**:
   - AES-256-GCM, nonce ngẫu nhiên, AAD gồm phiên bản KEK, DEK theo bản ghi.
   - Thứ tự B3: vai → step-up → 404 → lý do → log → giải mã; lỗi log → 503.
   - Test ranh giới `data_key`.
   - Cùng một `CryptoService` / `C3AccessGate` phục vụ ba BE.
2. **Tiền có kỷ luật**:
   - Dry run trong giao dịch READ ONLY, có test đếm bảng (SEC A3).
   - Không `Promise.all` trên tx, không SQL `now()`.
   - Số bill / số giao dịch từ bộ đếm (không max+1).
   - Tài khoản hoàn: DEK riêng, không vào hash idempotency, hủy khi chi đủ.
   - VietQR dựng tại chỗ, có vector CRC.
3. **Migration song song không vỡ**:
   - Journal tăng nghiêm ngặt, có test bảo vệ.
   - SQL viết tay khớp schema `.ts` (0 lệch CHECK).
   - RLS FORCE trên mọi bảng mới.
   - `pg_notify` trong giao dịch, nên SSE chỉ phát sau COMMIT và chỉ mang id.
