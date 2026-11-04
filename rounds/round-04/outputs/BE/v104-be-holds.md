# BE-B – Biên bản gói P4-10 `v104/be-holds` (v1.0.4, nhóm (1) giữ chỗ)

- Vai: BE (làn BE-B) | Round 4 – v1.0.4 – Bước: **Sản xuất** | 04/11/2026
- Nhánh: `v104/be-holds`, cắt từ `origin/main` `c6cd32a8`. Chưa rebase lên `main@L`. Chưa mở PR (PR-F gộp chung với FE-B P4-40, sau P4-02).
- Căn cứ: `rounds/round-04/plan-v1.0.4.md` mục 2.2, 3 (dòng P4-10), 4, 6 ý 8, 8 (brief BE-B); `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` mục 4 (dòng 042, 041, ĐX); `rounds/round-03/qa/bug-list.md` BUG-R3-041, 042 và mục 4 ĐX-R3-QA-01; `rounds/round-03/reviews/DOM-on-PO-v1.0.0-docs.md` A.3a, A.5, A.6; `rounds/round-03/reviews/ARC-on-BE-B-worker-audit-fix.md` thẻ WA-04; tin ORC 04/11 (DOM xác nhận người nhận J1, `origin/v104/dom-br-fixtures` `ceb05937` mục 0).

## 1. Đã làm

| Việc | Cách làm | Tệp |
|---|---|---|
| **BUG-R3-042 (P1)** – giữ chỗ đã nhận > 0 đ quá hạn | Luật tách thành hàm thuần `overdueHoldAccepts`: sau hạn chỉ FD+ (SEC-BE-22 (2)); giữ chỗ **đã nhận > 0 đ trước lần ghi này** (cùng thước đo J1 dùng để giữ – `kept_paid`) thì ghi thêm và xác nhận được bất kể giờ nhận tiền, **tới khi nhận phòng** (BR-303 (1), DOM A.6), không chặn ở 12:00; giữ chỗ chưa cọc giữ luật "tiền về trước hạn" (US-085 AC4). MGR/OWN chấp nhận cọc thiếu sau hạn (BR-303 (2), B-29) đi qua cùng luật | `payments/internal/deposits.service.ts` |
| 042 – nút | `allowedActions`: trước hạn như cũ (FD+, SAL của mình); sau hạn chỉ FD+ **và** `depositPaidVnd > 0`. Giữ chỗ chưa cọc quá hạn: không mời B4 (SAL/CTV cũng không, vì máy chủ trả `HOLD_EXPIRED`) | `reservations/internal/allowed-actions.ts`, `reservations.service.ts` (truyền `depositPaidVnd`, đã tính sẵn trong `dtoOf`) |
| **BUG-R3-041** – thông báo J1 | `expireOne` bỏ `outboxStaffPush`, dùng `notifyHoldOnce` → `EventsService.notify` (hộp thư + SSE `notification.created`). Người nhận theo DOM A.5 / P4-20 mục 0 (mục 3 dưới) | tệp mới `reservations/internal/hold-notices.ts`; `reservations.service.ts` (`@Optional() EventsService` tham số cuối) |
| **WA-04** | Gốc lỗi ở composition của worker: `FolioService` không có `ApprovalService` → hold quá hạn có yêu cầu FOC/giảm giá đang chờ ném lỗi mỗi nhịp. Sửa: worker dựng **một** bộ thể hiện chung như api (ApprovalService có EventsService; FolioService có DocNumber/Approval/Events; refund routing; hook quyết định FOC/special_discount + preLock giống `FolioModule`). Hold đó nay bị hủy, yêu cầu tự hủy `reservation_cancelled`, dòng "chờ duyệt" thành `rejected`, người tạo nhận `hold_expired` | `reservations/public/worker-jobs.ts` (`reservationWorkerComposition` mới, `reservationWorkerJobs` giữ chữ ký); tệp mới `folio/public/foc-worker-hooks.ts` |
| **ĐX-R3-QA-01** – "Cần chú ý" | Nguồn tính `holdsOverdue`: `hold_overdue` (critical, FD+) = mọi đơn `hold` có `hold_expires_at ≤ now`, mọi ngày đến, `dueAt` = hạn cũ nhất; `hold_overdue_cap` (critical, MGR/OWN) = các đơn đó đã tới `hold_latest_time_on_arrival` (12:00) ngày đến. Là mục **tính**, nên không tắt bằng "Đã xử lý" và tự mất khi đơn rời `hold`. `params` chỉ `count`; `refCode` khi đúng 1 đơn. So giờ bằng đồng hồ tiêm (`ctx.now`), không `now()` SQL | `frontdesk/internal/attention-sources.ts`; `events/public/events.service.ts` (`AttentionKind`, allowlist params, `attentionAudience`) |
| Migration **0093** | Chỉ nới CHECK `staff_notification.kind` + `hold_overdue_with_deposit`, `hold_overdue_cap`. Không bảng, không dữ liệu. Sinh bằng drizzle-kit từ `db/schema/frontdesk.ts`, đổi số sang 0093 (mục 4). `drizzle-kit generate` sau đó: "No schema changes" | `db/schema/frontdesk.ts`, `migrations/0093_hold_overdue_notification_kinds.sql`, `meta/0093_snapshot.json`, `meta/_journal.json` |

### 1b. Sửa theo SEC review (`rounds/round-04/reviews/SEC-on-v104-holds.md`, 04/11) – commit thứ hai trên nhánh

SEC chấp nhận G4 **có điều kiện**. Hai thẻ dưới là điều kiện đó; vai giữ nguyên như mã trước (sau hạn `confirmDeposit` chỉ FD+, chấp nhận cọc thiếu chỉ MGR/OWN, CTV không bao giờ).

| Thẻ | Cách làm | Tệp |
|---|---|---|
| **FB-R4-SEC-BE-HOLDS-01** – SAL/CTV ghi cọc lên hold quá hạn mà J1 chưa hủy | `PaymentsService.record` (recordPayment): sau `scopedReservation(..., { lock: true })` (đơn đã khóa), nếu `status = 'hold'`, `holdExpiresAt ≤ now` (đồng hồ tiêm) và người gọi không có vai FD+ → 409 `HOLD_EXPIRED` (`expiredAt` theo giờ khách sạn), **trước khi ghi gì**. FD+ như cũ. CTV vốn đã 403 trên `recordPayment`/`confirmDeposit` (vai trong hợp đồng không có `collaborator`) – không đổi. Áp **cùng chốt** cho `confirmReceived` (confirmPaymentReceived): SAL xác nhận "tiền QR đã về" trên hold quá hạn cũng là đặt tiền lên hold đó (G6). Tiền ngân hàng đẩy về (đối soát tự động) không đi qua hai hàm này | `payments/internal/payments.service.ts` (`scopedReservation` trả thêm `holdExpiresAt` khi khóa; hàm riêng `assertHoldOpenForSales`) |
| **FB-R4-SEC-BE-HOLDS-02** – audit lần xác nhận sau hạn | `reservation.deposit_confirmed` khi `holdExpiresAt ≤ now` thêm vào `after`: `afterDeadline: true`, `holdExpiredAt` (ISO UTC), `paidBeforeVnd` (đã nhận trước lần ghi này – cùng số dùng cho luật), `unverifiedPaidVnd` (tổng cọc `succeeded`, chưa đảo, `reconciliation = 'pending'`, không vượt `depositPaidVnd`), `via: 'new_payment' \| 'existing_payment'`. Chỉ số tiền và cờ – không số tài khoản, tên, ghi chú. Trước hạn: dòng audit giữ nguyên 3 trường cũ. 5 khóa được thêm vào allowlist audit của thực thể `folio` (không có thì `pickAuditFields` bỏ đi) | `payments/internal/deposits.service.ts`, `folio/audit-entities.ts` |

Không sửa: `openapi.yaml`, tệp sinh ra, `api-client`, strings, `reservation-dto.ts`/`checkin.service.ts`/`stay.service.ts` (BE-C), tệp refund của BE-D, `approval.service.ts` (WA-04 sửa được ở composition, không cần đổi dịch vụ duyệt), `src/worker-jobs.ts` (tham số `events` tùy chọn, composition tự tạo).

## 2. Tệp tạo/sửa

Sửa (`product/services/api/`): `src/db/schema/frontdesk.ts`, `src/db/migrations/meta/_journal.json`, `src/modules/events/public/events.service.ts`, `src/modules/frontdesk/internal/attention-sources.ts`, `src/modules/payments/internal/deposits.service.ts`, `src/modules/reservations/internal/allowed-actions.ts`, `src/modules/reservations/internal/reservations.service.ts`, `src/modules/reservations/public/worker-jobs.ts`.

Tạo: `src/db/migrations/0093_hold_overdue_notification_kinds.sql`, `src/db/migrations/meta/0093_snapshot.json`, `src/modules/reservations/internal/hold-notices.ts`, `src/modules/folio/public/foc-worker-hooks.ts`, `test/v104-holds-units.test.ts`, `test/integration/v104-holds.test.ts`, biên bản này.

Commit SEC-fix sửa thêm: `src/modules/payments/internal/payments.service.ts`, `src/modules/folio/audit-entities.ts` (thêm 5 khóa vào allowlist `folio`, chỉ thêm dòng), và hai tệp test ở trên.

**Lệch bản đồ chủ tệp (cần ARC/BE-D biết):** `folio/audit-entities.ts` (thêm 5 khóa cuối danh sách `folio`, BE-D P4-12 không chạm danh sách này; nếu xung đột khi gộp thì giữ cả hai).  `folio/public/foc-worker-hooks.ts` nằm trong `folio/**`. Là tệp **mới**, không chạm tệp nào của BE-D (P4-12) nên không xung đột. Lý do: hook FOC dùng `FolioFocService` ở `folio/internal`, luật ranh giới module cấm `reservations` nhập `internal` của module khác. Tệp lặp lại 1 câu SQL preLock của `folio.module.ts`; đề xuất BE-D/ARC cho `FolioModule` gọi chung hàm này ở lần chạm sau.

## 3. Người nhận và chống trùng J1 (ARC xem ở review mã)

| Thông báo | Người nhận | Khóa chống trùng |
|---|---|---|
| `hold_overdue_with_deposit` | người tạo + người chốt + mọi tài khoản FD, FDL, MGR đang hoạt động (thêm MGR so với v1.0.3) | `hold_overdue_partial:<reservation>:<hold_expires_at ISO>` |
| `hold_overdue_cap` | MGR, OWN (thêm OWN) | `hold_overdue_cap:<reservation>` |
| `hold_expired` | người tạo + người chốt; nếu không ra ai (không có, hoặc không còn hoạt động/đã thu vai) → FD, FDL | `hold_expired:<reservation>` |

Không bao giờ HK, MT, kế toán. Nội dung: kind, mã đơn, id – không dữ liệu khách.

**Cách chống trùng đã chọn:** giữ dòng outbox `staff.push` của v1.0.3 (cùng payload, cùng khóa) làm **cổng**: `INSERT … ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`. Có dòng trả về mới gọi `events.notify(..., { push: false })`; không có = đã báo, bỏ qua. Lý do:
- J1 đọc lại hold có cọc ở mọi nhịp; `events.notify` không tự chống trùng.
- Khóa duy nhất của outbox là ràng buộc DB, chạy trong cùng giao dịch với dòng hộp thư → hai lượt J1 chồng nhau (đã có `SKIP LOCKED`) cũng không ra hai lần.
- Không thêm cột/bảng, không cần index mới trên `staff_notification`. Outbox không có lệnh xóa nào, nên cổng bền.
- Mỗi người một dòng mỗi sự kiện: `notify` lấy `DISTINCT` người dùng, người vừa là người tạo vừa có vai FD chỉ nhận 1 dòng; lượt dự phòng FD/FDL chỉ chạy khi lượt đầu ra 0 người.

## 4. Số migration và cách rebase lên `main@L`

Hiện tại (nền `origin/main`, journal kết thúc ở 0091): 0093 có journal idx **68**, `when` = 0091 + 2000 = `1792782173681`, snapshot `prevId` = id của 0091. Kẽ hở 0092 được test journal cho phép.

Lưu ý drizzle-kit: lệnh `generate` đặt tiền tố tệp theo **idx** (ra `0068_…`) và **ghi đè** `meta/00<idx>_snapshot.json` của migration cũ cùng số. Không chạy `generate` thẳng trên nhánh mà không làm theo các bước dưới.

Khi `main@L` có 0092 (LP-v2):
1. `git fetch origin && git rebase origin/main`. Xung đột chỉ ở `meta/_journal.json` (hai bên cùng nối thêm). Lấy bản của `main`, bỏ dòng 0093 của mình.
2. Xóa `0093_hold_overdue_notification_kinds.sql` và `meta/0093_snapshot.json` khỏi cây làm việc (giữ bản sao phần chú thích đầu SQL).
3. Sao lưu `meta/0069_snapshot.json`. Chạy `pnpm --filter @ottimo/api db:generate --name hold_overdue_notification_kinds` → ra `0069_hold_overdue_notification_kinds.sql` + ghi đè `meta/0069_snapshot.json` (idx 69, `prevId` = 0092).
4. Đổi tên: SQL → `0093_hold_overdue_notification_kinds.sql` (thêm lại chú thích đầu, sửa dòng "journal idx 69, `when` = 0092 + 2000, prevId = 0092"); snapshot sinh ra → `meta/0093_snapshot.json`; trả lại `meta/0069_snapshot.json` đã sao lưu.
5. Journal: dòng cuối `tag` = `0093_hold_overdue_notification_kinds`, `when` = `when` của 0092 + 2000, idx 69. `npx prettier --write` hai tệp JSON.
6. Kiểm: `drizzle-kit generate` → "No schema changes"; `git diff origin/main -- meta/0069_snapshot.json` rỗng; chạy `test/migrations-journal.test.ts`, `test/money-limit-basis-architecture.test.ts`, `test/integration/schema-parity.test.ts`.
7. Nếu PR khác gộp vào `main` trước PR-F mà dùng số sau 0092 thì áp luật 2.2 (PR gộp sau đổi số).

0092 của LP-v2 không chạm `staff_notification` (đã đọc `origin/lp-v2`), nên CHECK của 0093 không phải gộp kind nào khác.

## 5. Kiểm thử

- Đơn vị `test/v104-holds-units.test.ts` (18 ca, không DB): bảng luật `overdueHoldAccepts`; `allowedActions` theo vai × trước/sau hạn × có/không cọc; người nhận A.5, dự phòng FD/FDL, không HK/MT/kế toán; `notifyHoldOnce` báo một lần mỗi khóa, lượt dự phòng khi lượt đầu ra 0 người; nguồn "Cần chú ý" trên `MutableClock` (11:59 không có cap, 12:00 có cap, không còn hold → không mục); audience và params; composition worker có hook FOC/special_discount + preLock, FolioService có approvals/events.
- Tích hợp `test/integration/v104-holds.test.ts` (10 ca, PostgreSQL thật):
  - 042 ca bug-list: hold có cọc 200.000 quá hạn → FD ghi nốt → 200 `confirmed`, **Nhận phòng** có trong `allowedActions` ngày đến;
  - hold chưa cọc: `receivedAt` trước hạn → 200 `confirmed`; sau hạn → 409 `HOLD_EXPIRED`, không ghi tiền; nút B4 ẩn;
  - SAL trên hold có cọc của mình sau hạn: 409 `HOLD_EXPIRED`, nút ẩn;
  - MGR chấp nhận cọc thiếu sau hạn (`existingPaymentId` + lý do) → 200 `confirmed`;
  - J1: `staff_notification` đúng người nhận từng kind, chạy hai nhịp vẫn một dòng/người; `hold_overdue_cap` lúc 12:00 ngày đến chỉ MGR/OWN; dòng outbox `staff.push` vẫn một;
  - "Cần chú ý": FD thấy `hold_overdue` (critical, 2 đơn, có đơn ngày đến xa), FD/FDL không thấy `hold_overdue_cap`, MGR/OWN thấy từ 12:00; đơn xác nhận → mục mất (AC3);
  - dự phòng: CTV tạo hold rồi bị thu vai → `hold_expired` tới FD + FDL;
  - WA-04 trong **tiến trình chỉ nạp worker**: hold có FOC chờ duyệt → `expired: 1, failed: 0`, yêu cầu `cancelled`/`reservation_cancelled`, không còn dòng `pending_approval`, người tạo nhận `hold_expired`.
- SEC-fix (thêm vào hai tệp trên):
  - đơn vị (+2 ca): chốt `assertHoldOpenForSales` – SAL/CTV sau hạn (kể cả đúng phút hạn) → `HOLD_EXPIRED`; FD/FDL/MGR/OWN sau hạn, SAL trước hạn, đơn không phải `hold`, hold không có hạn → cho qua;
  - tích hợp HOLDS-01: trước hạn SAL ghi cọc → 201 `pending`; 1 phút sau hạn, J1 chưa chạy: SAL `recordPayment` → 409 `HOLD_EXPIRED` (`expiredAt` 12:00), SAL `confirm-received` QR cọc của mình → 409, QR vẫn `pending`; CTV `recordPayment`/`confirm-deposit` → 403; không có dòng tiền nào; FD `recordPayment` → 201; J1 sau đó: 2 hold bị từ chối → `cancelled`, 2 hold có tiền → giữ;
  - tích hợp HOLDS-02: ca bug-list (FD ghi nốt, `via: new_payment`, `paidBeforeVnd` 200.000, `unverifiedPaidVnd` 0), ca MGR chấp nhận cọc thiếu (`existing_payment`), hold chỉ có khoản SAL chờ đối soát rồi FD ghi nốt sau hạn (`unverifiedPaidVnd` 100.000); khóa của `after` đúng 8 khóa; xác nhận trước hạn chỉ 3 khóa cũ.
- Kết quả bộ đầy đủ API, lint, typecheck: xem mục 8.

## 6. Đề xuất hợp đồng cho ARC (P4-00, 0.3.12)

1. `StaffNotification.kind` + `hold_overdue_with_deposit`, `hold_overdue_cap` (đã có trong P4-00 (a)). Mô tả người nhận theo bảng mục 3, gồm dự phòng FD/FDL của `hold_expired`.
2. `AttentionItem.kind` + `hold_overdue`, `hold_overdue_cap`: `source: computed`, `severity: critical`, `params: {count}`, `reservationIds`, `dueAt` (hold_overdue: hạn cũ nhất; cap: mốc 12:00 sớm nhất), `refCode` khi `count = 1`. Bảng "người nhận theo vai": `hold_overdue` FD+, `hold_overdue_cap` OWN/MGR. Ghi "mục tính – không tắt bằng resolveAttentionEvent".
3. (Thay bằng chữ SEC đề xuất ở `SEC-on-v104-holds.md` mục 3 – BE-B đồng ý, mã khớp chữ đó.) `confirmDeposit` – mô tả: hold quá hạn: SAL/CTV luôn `HOLD_EXPIRED`; FD+ với hold đã nhận > 0 đ (tính **trước** khoản đang ghi, gồm `existingPaymentId` đã có trên folio) xác nhận được tới khi nhận phòng, không trần 12:00; hold chưa nhận gì chỉ khi `receivedAt` < hạn. `HOLD_EXPIRED` chỉ còn cho hai trường hợp đó.
4. `Reservation.allowedActions` – mô tả `confirm-deposit` khi hold quá hạn: chỉ FD+ và `depositPaidVnd > 0`.
5. Rà `capacity_conflict`, `overbooking`, `overbooking_urgent` (cùng kiểu push-only): **không đổi ở v1.0.4** – đã có mục "Cần chú ý" tính sẵn; muốn vào hộp thư thì cần kind mới trong hợp đồng + CHECK. Đề xuất xếp v1.0.5 nếu DOM thấy cần.

6. `recordPayment` (theo SEC mục 3) và `confirmPaymentReceived` (G6): folio của hold đã quá `holdExpiresAt`, người gọi không có vai FD+ → 409 `HOLD_EXPIRED` (`expiredAt`), không ghi gì; FD+ như cũ. Thêm `HOLD_EXPIRED` vào danh sách 409 của hai thao tác nếu hợp đồng chưa liệt kê.

Không cần trường mới trong thân yêu cầu/đáp: FE-B dùng `depositPaidVnd`, `holdExpiresAt`, `allowedActions` sẵn có.

## 6a. Trả lời OPS – Q2 runbook v1.0.4 (quay lui)

**Không có topic outbox mới, không job mới.** Khi J1 đi qua `events.notify`:
- Outbox: vẫn đúng các dòng `topic = 'staff.push'` như v1.0.3 – cùng `payload.kind` (`hold_overdue_with_deposit`, `hold_overdue_cap`, `hold_expired`), cùng khóa `dedupe_key` (`hold_overdue_partial:…`, `hold_overdue_cap:…`, `hold_expired:…`). Dòng này là cổng chống trùng; `notify` chạy với `push: false` nên không thêm dòng outbox thứ hai. Cả v1.0.3 lẫn v1.0.4 đều **không có bộ phát** cho `staff.push` (chỉ `chat-dispatch` = `staff.chat`, `email-dispatch` = email), nên dòng này nằm `pending` như trước – worker v1.0.3 không đọc nó.
- WA-04: hold có yêu cầu FOC chờ duyệt bị J1 hủy → `approval_cancelled` (dòng `staff.push` + hộp thư) – kind và topic đã có từ trước, api v1.0.3 đã ghi y như vậy.
- SSE: `pg_notify`, không lưu.
- Dữ liệu mới mà v1.0.3 **không biết**: dòng `staff_notification` có `kind` mới (`hold_overdue_with_deposit`, `hold_overdue_cap`). CHECK đã nới ở 0093 giữ nguyên khi quay lui (không lùi DB). Api v1.0.3 vẫn trả các dòng này ở `listMyNotifications` (đọc thẳng cột `kind`, không lọc), Desk/app v1.0.3 không có nhãn nên có thể hiện mã thô (kiểu BUG-R4-021). Không lỗi, không mất tiền. Nếu muốn sạch: đánh dấu đã đọc, không xóa.
- "Cần chú ý" `hold_overdue`/`hold_overdue_cap` là mục tính, không có dòng nào trong DB.

Câu đếm cho bước R3b (READ ONLY, `ottimo_readonly`, mỗi dòng in một số):

```sql
-- R3b-1: inbox rows of the 0093 kinds (unknown to v1.0.3). Expected after rollback: any number; just record it.
SELECT kind, count(*) AS n, count(*) FILTER (WHERE read_at IS NULL) AS unread
  FROM staff_notification
 WHERE kind IN ('hold_overdue_with_deposit', 'hold_overdue_cap')
 GROUP BY kind ORDER BY kind;

-- R3b-2: outbox topics written since the v1.0.4 deploy – must list only topics v1.0.3 already has
-- (staff.push, staff.chat, email…, channel.availability_changed…); replace the timestamp with the deploy time.
SELECT topic, status, count(*) AS n
  FROM outbox_message
 WHERE created_at >= TIMESTAMPTZ '2026-11-08 14:00:00+07'
 GROUP BY topic, status ORDER BY topic, status;

-- R3b-3: J1 push rows per kind since the deploy (same kinds as v1.0.3 – 0 rows of any other kind expected).
SELECT payload->>'kind' AS kind, count(*) AS n
  FROM outbox_message
 WHERE topic = 'staff.push' AND created_at >= TIMESTAMPTZ '2026-11-08 14:00:00+07'
   AND payload->>'kind' IN ('hold_overdue_with_deposit', 'hold_overdue_cap', 'hold_expired')
 GROUP BY 1 ORDER BY 1;
```

## 7. Giả định

| # | Giả định |
|---|---|
| G1 | "Đã nhận > 0 đ" = `FolioService.depositPaid` (tổng khoản cọc `succeeded` của folio, gồm khoản sale ghi đang chờ đối soát) – cùng thước đo J1 dùng để giữ hold. Đọc trước khi ghi khoản mới |
| G2 | "Tới khi nhận phòng" (DOM A.6): không chặn theo giờ hay ngày sau hạn. Hold quá ngày đến vẫn xác nhận được; sau đó luồng no-show xử lý như đơn `confirmed` |
| G3 | Hold chưa cọc quá hạn: ẩn B4 theo plan, kể cả khi tiền thật đã về trước hạn (J1 hủy trong ≤ 1 phút). API vẫn nhận US-085 AC4 với `receivedAt` trước hạn |
| G4 | `existingPaymentId` trên hold quá hạn: khoản đã nằm trên folio nghĩa là hold "đã nhận > 0 đ", nên nhận bất kể giờ về (trước v1.0.4 bị từ chối nếu về sau hạn). **SEC đã chấp nhận có điều kiện (04/11)**; điều kiện HOLDS-01, HOLDS-02 đã làm (mục 1b) |
| G6 | Chốt HOLDS-01 áp cả cho `confirmPaymentReceived` (SAL xác nhận QR cọc đã về) – SEC chỉ nêu `recordPayment`, nhưng đây là đường thứ hai để SAL đặt tiền lên hold quá hạn. SEC/ARC xác nhận khi review; nếu không muốn, bỏ một dòng gọi `assertHoldOpenForSales` trong `confirmReceived` |
| G5 | Mục "Cần chú ý" không có `link` riêng; Desk mở đơn theo `reservationIds` như các mục tính khác |

## 8. Kết quả chạy (04/11, máy local, PostgreSQL 17 riêng của làn BE-B)

| Lệnh | Kết quả |
|---|---|
| `vitest run` toàn bộ `@ottimo/api` (DATABASE_URL thật, `ottimo_app`) | **152 tệp đạt, 2 bỏ qua; 3800 ca đạt, 24 bỏ qua; 0 lỗi** (222 s) |
| `test/v104-holds-units.test.ts` | 18/18 |
| `test/integration/v104-holds.test.ts` | 10/10 |
| `eslint services/api` | 0 lỗi |
| `turbo run typecheck --filter=@ottimo/api` | đạt |
| `prettier --check services/api/src services/api/test` | đạt |
| `drizzle-kit generate` sau khi thêm 0093 | "No schema changes" |
| **Lần 2 – sau SEC-fix HOLDS-01/02:** `vitest run` toàn bộ `@ottimo/api` | **152 tệp đạt, 2 bỏ qua; 3804 ca đạt, 24 bỏ qua; 0 lỗi** (266 s) |
| Lần 2: `test/v104-holds-units.test.ts` / `test/integration/v104-holds.test.ts` | 20/20 / 12/12 |
| Lần 2: `eslint .`, `tsc --noEmit`, `prettier --check src test` (services/api) | 0 lỗi / đạt / đạt |

Các test cũ liên quan vẫn xanh không sửa: `reservations-fix` (BR-303-04: dòng `staff.push` một lần, khóa `hold_overdue_cap:<id>`), `folio-payments` (US-085 AC4, SEC-BE-22 (2)), `r3-worker-only-jobs` (J1 trong tiến trình worker), `worker-jobs`, `money-limit-basis-architecture` (CHECK kind = schema, chỉ thêm), `migrations-journal`, `schema-parity`, `module-boundaries`.

## 9. Việc chưa xong / tiếp theo

- Rebase lên `main@L` và đổi journal/snapshot theo mục 4 (sau khi ORC gộp `lp-v2-main`).
- Khi P4-00 gộp: kiểm `openapi-meta.ts`/`api-client` có kind mới; không cần đổi mã server.
- Review bắt buộc: ARC, QA; SEC đã review (G4 chấp nhận có điều kiện), SEC xem lại HOLDS-01/02 và G6 trên commit SEC-fix; khuyến nghị DOM (người nhận). Gộp sau P4-02, chung PR-F với FE-B P4-40.
- QA staging 06/11 tối: hold có cọc một phần, hold chưa cọc, hold có yêu cầu FOC chờ duyệt – chờ hết hạn theo giờ thật.
