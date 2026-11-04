# ARC review mã – P4-10 `v104/be-holds` (BE-B, PR-F)

- Round 4 (v1.0.4), bước **Review chéo** (ma trận BE → ARC), 04/11/2026
- Đối tượng: `origin/v104/be-holds` @ `d23c9f74` (3 commit trên nền `c6cd32a8`), so với `origin/main` @ `7b5b6117` (đã có LP-v2 `main@L` và hợp đồng 0.3.12, PR #35).
- Kiểm lại trên `a91acb84` (BE-B rebase lên `7b5b6117` trong lúc ARC review): diff mã ngoài `meta/*` và chú thích 0093 **giống hệt** `d23c9f74`; chỉ đổi journal, snapshot 0093 và chú thích đầu SQL (mục 4, thẻ P410-01).
- Căn cứ: `plan-v1.0.4.md` dòng P4-10, mục 2.2 (luật số migration), 6 ý 8; `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md` (a), 2.2–2.4, 2.6–2.7; `SEC-on-v104-holds.md` (G4, HOLDS-01/02, G6); báo cáo `rounds/round-04/outputs/BE/v104-be-holds.md`.
- Không sửa mã. Không dữ liệu khách.

## Phán quyết: **ĐẠT** (trên `a91acb84`)

Trên `d23c9f74` là ĐẠT CÓ ĐIỀU KIỆN vì thẻ Major **P410-01** (số 0093). BE-B đã sửa ở `a91acb84` và ARC đã kiểm (mục 4). Không còn Blocker/Major mở. Logic, hợp đồng, RBAC và test đạt. Còn 1 Minor, 2 Suggestion, không chặn PR-F.

## 1. Cách kiểm

- Đọc toàn bộ diff mã (trừ snapshot) và tên ca test của 2 tệp test mới.
- Dựng cây gộp thử trong scratch: `origin/main` + P4-10 + P4-11 + P4-12 + P4-14 theo thứ tự PR-F → G → I → J. Journal sửa tay chỉ trong scratch: 0093 idx 69, 0094 idx 70. Không đẩy lên đâu.
- Trên cây gộp, PostgreSQL 17 riêng của ARC (vai `ottimo_app`/`ottimo_migrator` như CI):
  - `tsc --noEmit` (api): đạt;
  - `eslint services/api`: 0 lỗi;
  - 15 tệp test liên quan (gồm `v104-holds`, `v104-holds-units`, `worker-jobs`, `migrations-journal`, `module-boundaries`, `money-limit-basis-architecture`): **468 đạt, 1 todo, 0 lỗi**.
  - toàn bộ `@ottimo/api` trên cây gộp (snapshot 0093/0094 sửa như thẻ P410-01/P411-01): **161 tệp đạt, 2 bỏ qua; 4012 ca đạt, 24 bỏ qua, 1 todo; 0 lỗi**.
- `git merge-tree` với `main`: chỉ xung đột `meta/_journal.json` (hai bên cùng nối dòng cuối), đúng dự kiến.

## 2. Đúng hợp đồng 0.3.12 (a)

| Chỗ hợp đồng | Mã | Kết quả |
|---|---|---|
| `confirmDeposit` sau hạn: SAL luôn 409; FD+ khi folio đã nhận > 0 đ **trước lần ghi này** (tính cả `pending`); chưa nhận gì thì chỉ khoản có `receivedAt` < hạn; tới khi nhận phòng, không trần giờ | `overdueHoldAccepts` thuần; `paidBefore = depositPaid(tx, folio.id)` đọc **trước** khi ghi khoản mới, dưới khóa đơn | Đúng |
| `existingPaymentId` sau hạn luôn qua với FD+ | khoản đã nằm trong `depositPaid` → `paidBefore > 0` | Đúng (G4 SEC) |
| `acceptShortfallReason` sau hạn chỉ MGR/OWN | không đổi luật cũ; có ca tích hợp "MGR accepts the shortfall" | Đúng |
| Audit `reservation.deposit_confirmed` sau hạn: `afterDeadline`, `holdExpiredAt`, `paidBeforeVnd`, `unverifiedPaidVnd`, `via` (HOLDS-02) | chỉ thêm khi `overdue`; 5 khóa vào allowlist `folio/audit-entities.ts`; trước hạn không đổi | Đúng |
| `recordPayment` + `confirmPaymentReceived`: không FD+ trên hold quá hạn → 409 `HOLD_EXPIRED` + `expiredAt`, không ghi gì (HOLDS-01, G6) | `assertHoldOpenForSales` ngay sau `scopedReservation(…, { lock: true })`, trước mọi ghi; đồng hồ tiêm | Đúng |
| `allowedActions`: sau hạn `confirm-deposit` chỉ FD+ và `depositPaidVnd > 0` | `c.holdExpired ? fd && paid > 0 : fd \|\| sal` | Đúng |
| `StaffNotification.kind` + 2 kind; người nhận DOM A.5; chống trùng (đơn, `holdExpiresAt`) / một lần mỗi đơn; dự phòng FD/FDL cho `hold_expired` | `hold-notices.ts`: bảng vai, cổng `ON CONFLICT (dedupe_key) DO NOTHING RETURNING id` rồi `events.notify(…, { push: false })` | Đúng (ARC 2.4) |
| `AttentionItem` `hold_overdue` (FD+) / `hold_overdue_cap` (MGR/OWN, không lọc cọc – phương án A); `computed`, `critical`, chỉ `count`; `refCode` khi 1 đơn; `dueAt` = hạn cũ nhất / mốc 12:00 sớm nhất; không `link` | `holdsOverdue`; `ATTENTION_PARAM_KEYS` chỉ `count`; `attentionAudience` → `MGR_PLUS` | Đúng |
| OPS Q4: không job/topic mới | vẫn `staff.push` cùng payload/khóa; `notify` `push: false` | Đúng |

## 3. Kiến trúc

- **Ranh giới module:** `hold-notices.ts` ở `reservations/internal`, gọi `EventsService` public. `foc-worker-hooks.ts` ở `folio/public`, chỉ import `internal` của chính `folio`. `module-boundaries` xanh trên cây gộp.
- **WA-04:** worker có một bộ instance dùng chung (`ApprovalService` có `EventsService`, `FolioService` có `approvals`/`events`/`docNumbers`, hook FOC + `preLock`). Hold có yêu cầu FOC chờ duyệt không còn lỗi mỗi tick. Có ca tích hợp trong tiến trình worker riêng.
- **Đồng hồ:** mọi so sánh thời gian dùng `ctx.now` / `clock.now()` (ADR-008), kể cả SQL của `holdsOverdue` (`$1`).
- **Khóa và thứ tự:** `recordPayment`, `confirmReceived`, `confirmDeposit` đều khóa đơn trước khi đọc hạn và tiền. Không có đường nào đọc `depositPaid` ngoài khóa rồi mới ghi.
- **Hiệu năng:** `holdsOverdue` không `LIMIT`, nhưng chỉ đọc đơn `hold` đã quá hạn. Với 10 căn, số dòng rất nhỏ. Danh sách id vẫn cắt ở `LIST_CAP`.

## 4. Migration 0093

- Nội dung: `DROP CONSTRAINT` + `ADD CONSTRAINT … CHECK (kind IN (…))`, danh sách = 0088 + đúng 2 kind mới. Khớp `STAFF_NOTIFICATION_KINDS` (test `money-limit-basis-architecture` xanh).
- An toàn: chỉ nới. `ADD CONSTRAINT` quét lại `staff_notification` dưới khóa `ACCESS EXCLUSIVE` trong vài ms (bảng nhỏ). Chạy trong giao dịch duy nhất của migrator.
- Quay lui: app về `sha-da6d6f3dc22b` không cần lùi DB. v1.0.3 không ghi kind mới. Đọc kind mới thì ra câu chung, không 500 (hợp đồng 2.6).
- **Đánh số:** trên `d23c9f74` chưa đúng `main` (thẻ P410-01). Trên `a91acb84`:
  - journal idx **69**, `when` `1792782175681` (= 0092 + 2000);
  - snapshot 0093 id `96671c28-784b-486a-a34e-ed25cc3be90a`, `prevId` = `6d4cb691…` (0092), có đủ thay đổi 0092 + CHECK mới. Nội dung **trùng khớp** bản ARC dựng độc lập trên cây gộp. Với bản đó, `schema-parity` + `migrations-journal` 13/13 và `drizzle-kit generate` báo "No schema changes";
  - `meta/0069_snapshot.json` không đổi so với `main`; chú thích đầu SQL đã cập nhật.

## 5. Test theo tiêu chí nghiệm thu

| AC (plan P4-10) | Ca |
|---|---|
| Ca bug-list 042: 200, `confirmed`, **Nhận phòng** mở ngày đến | tích hợp "FD tops up after the deadline → 200 `confirmed`, Nhận phòng offered" |
| Hold chưa cọc: `receivedAt` trước hạn → 200, sau hạn → `HOLD_EXPIRED` | tích hợp "unpaid overdue hold…" + đơn vị `overdueHoldAccepts` |
| J1 tạo `staff_notification` đúng người nhận A.5, một lần | tích hợp "inbox rows to the right people, once"; đơn vị `notifyHoldOnce` (một notify mỗi khóa, dự phòng FD/FDL, không HK/MT/kế toán) |
| ĐX-R3-QA-01 AC1–3 | tích hợp AC1, cap 12:00, AC3 "the item drops"; đơn vị với `MutableClock` |
| SEC-BE-22, HOLDS-01/02, G6 | tích hợp SAL/CTV 409 không ghi gì, QR vẫn `pending`, FD 200, J1 sau đó hủy; audit 5 trường (cả `new_payment` và `existing_payment`), trước hạn không có |
| Idempotency J1 | khóa `dedupe_key` là ràng buộc DB, cùng giao dịch; ca "once" chạy J1 nhiều tick |
| RBAC | SAL, CTV, FD, FDL, MGR, OWN đều có ca; `attentionAudience` có ca đơn vị |

## 6. Thẻ

### FB-R4-ARC-BE-B-P410-01
- Mức độ: Major (**điều kiện gộp PR-F**)
- Vị trí: `migrations/meta/_journal.json`, `meta/0093_snapshot.json`, chú thích đầu `0093_hold_overdue_notification_kinds.sql`
- Vấn đề: trên nhánh, 0093 đang ở **idx 68**, `when` = `1792782173681` (trùng `when` của 0092 trên `main`), snapshot `prevId` = id của 0091 (`094eec8a…`). Snapshot 0093 = 0091 + CHECK mới, **thiếu 4 thay đổi của 0092** (`website_booking_request.price_estimate` + CHECK của nó, CHECK `locale` của `website_booking_request` và `privacy_notice_version`). Nếu chỉ sửa journal thì chuỗi snapshot rẽ nhánh. ARC đã thử trên cây gộp: chỉ sửa journal thì `schema-parity` đỏ (head snapshot lệch DB). Sinh lại snapshot thì `schema-parity` + `migrations-journal` 13/13 xanh và `drizzle-kit generate` báo "No schema changes".
- Vì sao quan trọng: `when` không tăng nghiêm ngặt thì migrator bỏ qua 0093 trên DB đã có 0092, nên kind mới bị CHECK chặn và J1 lỗi mỗi tick. Snapshot sai làm lần `generate` sau sinh lại đối tượng của 0092.
- Đề xuất sửa (đúng mục 4 báo cáo BE-B, ARC chốt số):
  - journal: `idx` **69**, `when` **`1792782175681`** (= 0092 + 2000), `tag` `0093_hold_overdue_notification_kinds`;
  - `meta/0093_snapshot.json` sinh lại bằng `drizzle-kit generate` trên nền `main`. `prevId` = **`6d4cb691-7c3c-4f7f-8936-4a31bf745e83`** (id snapshot 0092). Nội dung = 0092 + CHECK mới. Không trộn JSON tay. Trả lại `meta/0069_snapshot.json` gốc;
  - sửa dòng chú thích "Cut from `origin/main` … idx 68" thành trạng thái thật (idx 69, prevId 0092);
  - kiểm: `drizzle-kit generate` → "No schema changes"; `git diff origin/main -- meta/0069_snapshot.json` rỗng; `migrations-journal`, `money-limit-basis-architecture`, `integration/schema-parity` xanh;
  - id snapshot 0093 sau khi sinh lại phải báo cho BE-C (P4-11 dùng làm `prevId` của 0094 – thẻ FB-R4-ARC-BE-C-P411-01).
- Trạng thái: Open → **ARC đã kiểm bản sửa ở `a91acb84`** (mục 4). BE-B ghi Done trong `responses/`.

### FB-R4-ARC-BE-B-P410-02
- Mức độ: Minor
- Vị trí: `reservations/internal/hold-notices.ts` (cổng `staff.push`), runbook v1.0.4
- Vấn đề: cổng chống trùng dùng **cùng** `dedupe_key` với v1.0.3 (`hold_overdue_partial:<id>:<hạn>`, `hold_overdue_cap:<id>`). Một hold có cọc đã quá hạn **trước** lúc lên v1.0.4 đã có dòng `staff.push` do v1.0.3 ghi. Sau khi lên, `notifyHoldOnce` thấy khóa đã có nên **không bao giờ** tạo dòng hộp thư cho hold đó. Mục "Cần chú ý" `hold_overdue` (tính sẵn) vẫn hiện, nên không mất thông tin.
- Vì sao quan trọng: thực tế gần như rỗng (production chưa vận hành thật – decision-log 01/11). Nhưng QA staging và OPS có thể thấy "không có thông báo" với hold cũ, rồi báo nhầm lỗi BUG-R3-041.
- Đề xuất sửa: không đổi mã (đổi khóa sẽ báo lại mọi hold cũ). Ghi một câu vào runbook v1.0.4 (OPS) và ghi chú QA: "hold có cọc quá hạn từ trước lúc lên v1.0.4 chỉ hiện ở Cần chú ý, không có dòng hộp thư". Thêm vào R3b một câu đếm READ ONLY: số đơn `hold` đã quá hạn lúc lên bản.
- Trạng thái: Open

### FB-R4-ARC-BE-B-P410-03
- Mức độ: Suggestion
- Vị trí: `hold-notices.ts` `notifyHoldOnce`, nhánh dự phòng thứ hai (`told.length === 0 …`)
- Vấn đề: khi người tạo/người chốt của `hold_expired` không còn hoạt động, hộp thư đi tới FD/FDL. Nhưng payload của dòng cổng `staff.push` vẫn ghi `roles: []`, `userIds: [người cũ]`. Câu R3b-3 và người đọc outbox sẽ thấy người nhận khác với hộp thư.
- Đề xuất: chấp nhận ở v1.0.4 (dòng `staff.push` không có bộ phát). Ở v1.0.5, hoặc ghi chú trong `hold-notices.ts` rằng payload cổng là "ý định ban đầu", hoặc tách cổng khỏi payload.
- Trạng thái: Open

### FB-R4-ARC-BE-B-P410-04
- Mức độ: Suggestion
- Vị trí: `folio/public/foc-worker-hooks.ts` và `folio/folio.module.ts` `onModuleInit`
- Vấn đề: hai bản cùng một bộ hook (FOC/special_discount `onDecided`, `onBeforeDecide`, `provideFocView`). `worker-jobs.test.ts` đang canh để hai bản không lệch.
- Đề xuất: ARC **đồng ý** đề xuất của BE-B. Ở v1.0.5, `FolioModule.onModuleInit` gọi `provideFocDecisionHooksForWorker` (đổi tên thành `provideFocDecisionHooks`) để chỉ còn một nơi. Không làm ở v1.0.4 vì `folio.module.ts` thuộc làn BE-D.
- Trạng thái: Open

## 7. Điểm làm tốt
- Luật sau hạn nằm ở một hàm thuần (`overdueHoldAccepts`). `allowedActions` dùng đúng luật đó, nên nút trên Desk và câu trả lời máy chủ không lệch nhau. Có test đơn vị cho cả hai.
- Chống trùng bằng ràng buộc DB trong cùng giao dịch. Không thêm topic, không thêm migration, và tương thích ngược với câu đếm của OPS.
- Bịt cả hai đường SAL đặt tiền lên hold quá hạn (G6 tự phát hiện). Kiểm đặt trước mọi lần ghi.
