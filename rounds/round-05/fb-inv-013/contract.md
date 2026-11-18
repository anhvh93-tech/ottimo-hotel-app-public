# FB-INV-013 – Hợp đồng BE ↔ FE: nhắc visa, nhắc hết hợp đồng dài hạn, checklist tạm trú (ARC 18/11)

- Tác giả: ARC | Round 5 – Sản xuất | Đầu vào: `04-investor-feedback/FB-INV-013.md` (INV chốt 18/11), `fb-inv-012/contract.md` (mục 11 là bản mới nhất), bản nháp `fb-inv-013/DOM-rules.md` (BR-LS-20…29, đọc lúc 18/11, DOM còn viết), code trên main @ `ee02975c`.
- Mọi số ngày, giờ gửi, người nhận là **tham số OWN có ngày hiệu lực**. DOM chốt khác thì đổi giá trị, không đổi mã.
- Không gửi gì cho khách. Không lưu ảnh visa mới. Email không có số hộ chiếu, số thị thực.

## 0. Cái đã có – dùng lại, không làm lại

| Có sẵn | Ở đâu | Dùng cho |
|---|---|---|
| `guest_document.visa_kind_enc`, `visa_valid_until_enc` (C3, D05, mã hóa theo DEK của dòng) | `db/schema/registration.ts`, erd 4.7 | Ngày visa hiện tại. **Không thêm cột ngày rõ** |
| `guest_document.visa_alert_on` (C2 rõ, SEC M9) = hạn − `visa_expiry_warning_days.<long_stay\|short_stay>`, tính trong `RegistrationService.refresh` | `rules.ts` `visaAlertOn` | Truy vấn nhắc không cần giải mã |
| Mục "Cần chú ý" `visa_expiring` (warning, chỉ mã đơn + căn) | `registration/internal/attention-sources.ts`, `visaExpiringReservations` | Nhắc visa. Tự hết khi kiểm `visa_valid_through_departure` thành pass (đã gia hạn) hoặc khách trả phòng |
| Kind `lease_expiring` đã có trong `AttentionKind`, FE `attention.ts`, OpenAPI enum – **chưa có nguồn** | `events.service.ts` | Nhắc hết HĐ (gắn nguồn mới) |
| Máy trạng thái khai báo SM-05: `sent_at`, `sent_by`, `portal_reference`, `needs_update` (K9 `requireUpdate`, đã gọi khi đổi ngày đi / đổi giấy tờ / đổi người) | `registration.service.ts` | Checklist tạm trú. **Không đẻ bảng checklist riêng** |
| Mục `registration_due`, `registration_overdue` | như trên | Khách chưa khai |
| Outbox `staff.email` + dispatcher + mẫu brand OTTIMO (`BRAND`, Lora/Be Vietnam Pro, EN dẫn VI hỗ trợ, không link, không emoji) | `jobs/email-dispatch.ts`, `integrations/notification/email-templates.ts` | Email 8h |
| Job `daily` với `atParam`, chống chạy hai lần bằng slot `job_run` | `jobs/job-runner.ts` | Job 8h |
| `HĐ dài hạn` = đơn `stay_type='long'`; ngày kết thúc HĐ = ngày đi hiệu lực (`effectiveDepartureDate`, tính cả gia hạn B16) – chưa có bảng `lease_contract` (D2 của FB-012) | `reservations.ts` | Nhắc HĐ |

## 1. Quyết định kiến trúc (ARC tự quyết, ORC ghi decision-log)

| # | Quyết định | Lý do |
|---|---|---|
| E1 | Ngày visa vẫn ở `guest_document` (C3). Lịch sử là bảng mới chỉ-thêm `guest_document_visa_history`, mã hóa bằng **DEK của chính giấy tờ** → hủy DEK lúc xóa giấy tờ là lịch sử mất theo (J16 không cần luật riêng). | Một nguồn ngày. Không mở rộng dữ liệu C3 ra ngoài vòng đời giấy tờ. |
| E2 | Gia hạn visa qua **endpoint hẹp** `recordVisaExtension` (chỉ ngày + loại), không bắt FE gửi lại đủ `GuestDocumentInput`. | FE không phải đọc C3 khác chỉ để sửa một ngày (giống lý do `GuestDocumentLink` 0.3.7). |
| E3 | Kết quả hỏi gia hạn HĐ và ghi chú "đang làm thủ tục visa, hẹn ngày" dùng **một bảng** chỉ-thêm `stay_follow_up` (`topic` = `lease` \| `visa`), dòng mới nhất là hiện trạng. | Một chỗ cho "lễ tân đã liên hệ khách, kết quả gì". |
| E4 | Mọi mục nhắc **tính lúc đọc** (như các mục đang có), không lưu trạng thái nhắc, không cần job đổi trạng thái. Job 8h chỉ chụp danh sách để gửi email. | "Cần chú ý" và email luôn cùng một nguồn. |
| E5 | "Visa quá hạn" suy ra: `today > visa_alert_on + warnDays`. Đổi `visa_expiry_warning_days` → hook tham số tính lại `visa_alert_on` các giấy tờ còn sống (giải mã theo lô, ~vài chục dòng). | Không thêm ngày rõ thứ hai. Hiện nay đổi tham số không tính lại – lỗi tiềm ẩn, sửa luôn. |
| E6 | Checklist tạm trú = **nhãn suy ra** từ `registration.status` (BR-LS-28): `not_declared` (`none…scanned`), `declared` (`sent/confirmed/updated`), `redeclare` (`needs_update`). Khách đã ở trước khi có Desk: chuyển **K14** "đã khai ngoài Desk" → `confirmed`, cờ `declared_outside_desk`. | Dùng lại SM-05, không có hai sổ. |
| E7 | Email 8h: outbox **không chứa tên khách**. Payload chỉ có mã đơn, căn, kind, số ngày. Tên rút gọn (nếu tham số bật) do dispatcher hỏi cổng `DigestGuestNamePort` lúc gửi. | Giữ luật "outbox chỉ id + tên mẫu" của dispatcher. |
| E8 | Không thêm màn hình, không sửa `rbac-matrix.md` mục 3 (bài học #190): dùng S02 (Hôm nay / Cần chú ý), S09 (Giấy tờ & khai báo), S16 (HĐ dài hạn), màn tham số đang có. | Tránh main đỏ. |
| E9 | Module: lịch sử visa + K14 ở `registration`; `stay_follow_up` + nguồn `lease_expiring` ở `frontdesk` (chủ ngày đi); job + bản xem trước email ở `reporting`; mẫu email ở `integrations` (INT). Job đăng ký ở **cả** module và `worker-jobs.ts` (BUG-R3-037). | Giữ ranh giới module. |

## 2. Dữ liệu – migration `0100_long_stay_reminders_fb_inv_013.sql` (chỉ thêm)

- **Số 0100**: 0099 đang nằm ở PR BE #190 chưa merge. PR này lấy 0100 và **rebase lên main sau khi #190 merge** (journal + snapshot dựng lại từ main). Nếu #190 bị rút số, PR merge sau vẫn lấy số kế tiếp – không bao giờ hai file cùng số. Không `UPDATE`/`DELETE` dữ liệu cũ.
- RLS + FORCE RLS cho bảng mới, policy theo `property_id` (test kiến trúc quét `pg_class`). Trigger chỉ-thêm theo mẫu 0090/0095 (chặn UPDATE; DELETE chỉ trong luồng xóa giấy tờ/hết hạn lưu).

### 2.1 `guest_document_visa_history`
`id`, `organization_id`, `property_id`, `registration_id`, `reservation_id`, `guest_document_id` (FK cùng `property_id`), `seq smallint` (UK `guest_document_id, seq`), `change_kind` CHECK (`initial`, `extension`, `correction`), `visa_kind_enc bytea`, `visa_valid_until_enc bytea` (C3, DEK = `guest_document.data_key_id`), `recorded_at`, `recorded_by`.
- Không chuyển dữ liệu cũ: lần gia hạn **đầu tiên** của một giấy tờ ghi 2 dòng – `initial` (giá trị đang có) và `extension`.
- Xóa giấy tờ (`purged_at`, `removed_at`, J16) → xóa dòng lịch sử cùng giao dịch.

### 2.2 `stay_follow_up`
`id`, `organization_id`, `property_id`, `reservation_id` (FK), `topic` CHECK (`lease`, `visa`), `guest_document_id` (bắt buộc khi `visa`, null khi `lease` – CHECK đi cặp), `cycle_date date` (lease: ngày kết thúc HĐ lúc ghi; visa: `visa_alert_on` lúc ghi – đổi ngày là chu kỳ mới), `outcome` CHECK theo topic (lease: `no_answer`, `renewing`, `not_renewing`; visa: `in_progress`), `outcome_date date` (lease `renewing` = gia hạn đến; `not_renewing` = ngày trả phòng; visa = hẹn ngày có visa mới), `note text` (≤ 300, qua bộ lọc mẫu số thẻ/giấy tờ), `recorded_at`, `recorded_by`. Chỉ mục `(property_id, reservation_id, topic, recorded_at DESC)`.

### 2.3 `registration` thêm cột
`declared_outside_desk boolean NOT NULL DEFAULT false`. Sự kiện chuyển **K14** ghi vào nhật ký chuyển hiện có; nếu cột sự kiện có CHECK thì chỉ **nới thành tập cha** (thêm `K14`), không bỏ giá trị cũ. Lý do K9 thêm `visa_extended`.

### 2.4 Tham số (OWN; thêm dòng có ngày hiệu lực, không sửa dòng cũ)

| Khóa | Kiểu / biên | Mặc định | Sửa | Ghi chú |
|---|---|---|---|---|
| `visa_expiry_warning_days.long_stay`, `.short_stay` (đã có, 605) | int 1–180 / 1–90 | **5** từ ngày deploy (INV; dòng cũ 30/14 giữ lịch sử) | OWN, MGR | Hook E5 |
| `lease_renewal_reminder_days` (mới) | int 1–90 | 10 (INV, BR-LS-25) | OWN, MGR | |
| `long_stay_early_notice` (mới) | json `{visaDays: int\|null, leaseDays: int\|null}` 1–120 | `{null, null}` = tắt | OWN, MGR | Chờ Q1 DOM/INV: nếu chọn A thì đặt 30/30 – một dòng trong email **một lần**, không vào "Cần chú ý" |
| `daily_digest_time` (mới) | `HH:MM` giờ cơ sở | `08:00` | OWN, MGR | `atParam` của job |
| `daily_digest` (mới, **tham số bảo mật** – A119, chỉ OWN) | json `{enabled, roles[] ⊂ {owner, manager, front_desk_lead, front_desk}, sendWhenEmpty, guestName: 'short'\|'none'}` | `{true, [owner, manager, front_desk_lead, front_desk], true, 'short'}` | OWN | Quyết ai nhận dữ liệu khách qua email |
| `registration_outside_desk_until` (mới) | date | ngày deploy + 30 | OWN | K14 chỉ cho đơn có ngày đến **trước** ngày này |

## 3. API – OpenAPI `0.3.15-draft` (sau `0.3.14-draft` của #190; chỉ thêm)

| Operation | Đường | Thân / kết quả | Quyền |
|---|---|---|---|
| `recordVisaExtension` | `POST …/registrations/{rid}/documents/{did}/actions/record-visa-extension` | `{visaValidUntil: LocalDate, visaKind?: visa\|visa_exempt\|temp_residence_card, changeKind: extension\|correction}`. `If-Match`, `Idempotency-Key`, `x-requires-trusted-device`, `x-classification: C3`, `x-c3-log {guest_document, update}`. → `Registration`. Ghi field + lịch sử, `refresh` (kiểm tra + `visa_alert_on`), `confirmed/updated` → `needs_update` (`visa_extended`). `extension` mà ngày ≤ ngày đang có → `422 VALIDATION_FAILED (visaValidUntil: NOT_LATER)`. Không phải khách NN → `422 (NOT_ALLOWED)`. Khai báo `void` → 409 | A70 |
| `getGuestDocumentSensitive` (có sẵn) | – | thêm `visaHistory[{seq, changeKind, visaKind, visaValidUntil, recordedAt, recordedByInitials}]` – chỉ ở đây (C3, log như cũ) | A71 |
| `listStayFollowUps` | `GET …/reservations/{id}/follow-ups?topic=` | `{items: StayFollowUp[], lease: LeaseFollowUpState\|null}` | A124 |
| `recordStayFollowUp` | `POST …/reservations/{id}/follow-ups` | `{topic: lease, outcome, outcomeDate?, note?}` hoặc `{topic: visa, guestDocumentId, outcome: in_progress, outcomeDate, note?}`. `Idempotency-Key`. Luật: `renewing` → `outcomeDate` > ngày kết thúc; `not_renewing` → `outcomeDate` ∈ [hôm nay, ngày kết thúc] (sớm hơn ngày kết thúc thì phản hồi `earlyDeparture: true`, ghi audit, FE nhắc báo quản lý – BR-LS-26); `lease` chỉ cho đơn `long` + `in_house`; `visa` cho đơn `confirmed`/`in_house`. **Không tự đổi ngày đi**: gia hạn/rút ngắn vẫn qua `extendStay`/luồng đổi ngày đang có | A124 |
| `markRegistrationDeclaredOutsideDesk` | `POST …/registrations/{rid}/actions/mark-declared-outside-desk` | `{declaredAt: Instant (≥ ngày đến, ≤ now), declaredByUserId?: uuid (mặc định người gọi, phải có vai ở cơ sở), portalReference?: string}`. `If-Match`. Chỉ từ `none…scanned`, ngày đến < `registration_outside_desk_until`, ngoài ra 409/422. → `confirmed`, `sent_at = confirmed_at = declaredAt`, `sent_by`, `declared_outside_desk = true`. Thêm giấy tờ sau K14 **không** kéo K9 (đây là nhập bù); sửa visa / đổi ngày đi thì vẫn K9 | A125 |
| `getDailyDigestPreview` | `GET …/attention/daily-digest?date=` | `{date, sendAt, recipientsCount, sections[], subject, text}` – đúng nội dung email sẽ gửi (không có địa chỉ người nhận) | A126 |

**Hình dạng**
- `Registration` thêm: `checklistLabel` (`not_declared`\|`declared`\|`redeclare`), `declaredOutsideDesk`, `sentByInitials`, `needsUpdateReason` (enum mã, đã có `departure`, `document_changed`, `party_added`, `party_removed`; thêm `visa_extended`). `listRegistrations` thêm lọc `stayType=long`, `checklistLabel=`.
- `StayFollowUp`: `{id, topic, guestDocumentId?, cycleDate, outcome, outcomeDate, note, recordedAt, recordedByInitials}`.
- `LeaseFollowUpState`: `{contractEndDate, daysLeft, stage, lastOutcome?, lastRecordedAt?}`, `stage` suy ra:
  - `not_due` (chưa tới D−N);
  - `ask` (trong cửa sổ, chưa có dòng cho `contractEndDate` này);
  - `awaiting_answer` (dòng mới nhất `no_answer`);
  - `extend_booking` (`renewing` nhưng ngày đi hiệu lực < `outcomeDate`);
  - `shorten_booking` (`not_renewing` nhưng ngày đi > `outcomeDate`);
  - `done`.
  Danh sách đơn dài hạn ở S16 (operation đang dùng) thêm trường `leaseFollowUp: LeaseFollowUpState`.
- **"Cần chú ý"** (`ATTENTION_PARAM_KEYS` + OpenAPI enum):

| Kind | Nguồn | Mức | `params` (không tên, không ngày visa) |
|---|---|---|---|
| `visa_expiring` (có) | registration | warning; **critical** khi `daysLeft < 0` và khách còn ở (BR-LS-24) | thêm `daysLeft`, `followUp` (`in_progress` khi có hẹn) |
| `lease_expiring` (có kind, nguồn mới) | frontdesk | warning; **critical** khi `daysLeft ≤ 0` và `stage ∈ {ask, awaiting_answer}` (BR-LS-27) | `stage`, `daysLeft` |
| `registration_update_needed` (**mới**) | registration | warning | `count` |
| `registration_due` / `registration_overdue` (có) | – | – | không đổi |

  Mỗi đơn một mục (như `visa_expiring` hiện nay), `refCode` + `roomNos`. Audience FD+ (mặc định `attentionAudience`).

## 4. Job hằng ngày + email

- Job `attention.daily_digest` (module reporting), `schedule: {kind: 'daily', atParam: 'daily_digest_time', catchUp: 'always'}`; chỉ gửi slot **của hôm nay** (worker sống lại hôm sau không gửi bù hôm qua). Một lần mỗi cơ sở mỗi ngày (slot `job_run`). `enabled=false` → `skipped`.
- Handler: lấy các mục `visa_expiring`, `lease_expiring`, `registration_overdue`, `registration_due`, `registration_update_needed` từ cùng hàm của `listAttentionItems` (không viết truy vấn thứ hai) + dòng nhắc sớm nếu `long_stay_early_notice` bật (mỗi chu kỳ một lần, khóa `job_run` slot `early:<docId|resId>:<cycle>`). Ghi **một** dòng outbox `staff.email`:
  - template `daily_attention_digest`;
  - `roles`, `digestDate`;
  - `items[{kind, severity, refCode, roomNo, daysLeft, stage, reservationId}]`.

  Danh sách rỗng mà `sendWhenEmpty` → vẫn gửi.
- Dispatcher:
  - người nhận = user còn hoạt động, có vai trong `roles` ở cơ sở, có email; mỗi địa chỉ một bản;
  - `guestName='short'` → `DigestGuestNamePort` (worker nối từ stay reader) trả "Tên + chữ cái đầu họ" theo `reservationId` lúc gửi;
  - log như cũ (không địa chỉ, tên, thân thư);
  - dòng outbox `done` của mẫu này dọn sau 30 ngày (J16; nếu J16 chưa dọn outbox thì thêm).
- **Mẫu** (INT viết trong `email-templates.ts`, CPY/UXD duyệt chữ, theo brand guideline: chỉ màu `BRAND`, Lora tiêu đề / Be Vietnam Pro nội dung với fallback Georgia/Arial, EN dẫn – VI hỗ trợ, ngắn, điềm tĩnh, không emoji, không chữ in hoa hét):
  - Tiêu đề: `OTTIMO Desk · Today 19 Nov · 3 items` / `Việc cần chú ý hôm nay`.
  - Thứ tự (DOM mục 4): (1) quá hạn – visa đã hết khách còn ở, HĐ tới/qua hạn chưa có kết quả; (2) visa D−5…D; (3) HĐ D−10…D kèm `stage`; (4) tạm trú chưa khai / cần khai lại; (5) nhắc sớm (nếu bật).
  - Mỗi dòng: `Căn · mã đơn · [tên rút gọn] · còn N ngày / quá N ngày · trạng thái`. Ngày rỗng: `Nothing needs attention today. / Hôm nay không có việc cần chú ý.`
  - Cuối thư: `Open Desk → Today → Needs attention` dạng **chữ, không link** (giữ luật mẫu hiện có; SEC 6.4).
  - **Không có**: số hộ chiếu/thị thực/thẻ tạm trú, ngày hết hạn visa, ngày sinh, quốc tịch, SĐT, email khách, ghi chú, ảnh, tên nhân viên.

## 5. Quyền (rbac-matrix 4.4 / 4.2 thêm dòng; không sửa mục 3)

| # | Hành động | OWN | MGR | FDL | FD | Khác |
|---|---|:-:|:-:|:-:|:-:|:-:|
| A70 (có) | + `recordVisaExtension` | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q | ✖ |
| A71 (có) | + `visaHistory` trong `…/sensitive` | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q | ✖ |
| A124 | Xem/ghi kết quả liên hệ khách (gia hạn HĐ, thủ tục visa) | ✔ | ✔ | ✔ | ✔ | ✖ |
| A125 | Đánh dấu "đã khai ngoài Desk" (K14) | ✔ L Q | ✔ L Q | ✔ L Q | ✖ (chờ DOM, mục 8 #4) | ✖ |
| A126 | Xem trước email tóm tắt | ✔ | ✔ | ✖ | ✖ | ✖ |
| A119 (có) | + khóa `daily_digest`, `registration_outside_desk_until` vào `x-security-parameters` | ✔ | 403 | ✖ | ✖ | ✖ |

SSE: ghi follow-up / gia hạn visa / K14 phát `attention.changed` + `registration.changed` (vai như hiện có).

## 6. Chia việc – mỗi bên 1 PR

**PR BE** `r5-fb013-be-reminders` (làm trước; nhánh từ main, rebase sau khi #190 merge):
- Migration 0100, schema drizzle, journal + snapshot.
- Registration: `recordVisaExtension`, lịch sử trong `…/sensitive`, K14, `checklistLabel`, hook E5, nguồn `registration_update_needed`, `visa_expiring` thêm `daysLeft`/critical.
- Frontdesk: `stay_follow_up`, `list/recordStayFollowUp`, `LeaseFollowUpState`, nguồn `lease_expiring`.
- Reporting: job `attention.daily_digest` (module + `worker-jobs.ts`), `getDailyDigestPreview`, `DigestGuestNamePort`.
- Integrations (INT làm trong cùng PR hoặc commit riêng cùng nhánh): mẫu `daily_attention_digest` + test.
- `openapi.yaml` 0.3.15-draft + `generated/*`; `rbac-matrix.md` (A124–A126, ghi chú A70/A71/A119) + `.json`; erd 4.7 (bảng mới, cột mới) + bảng tham số.
- Seed dev/e2e: 1 khách NN dài hạn visa còn 3 ngày, 1 đơn dài hạn hết HĐ sau 7 ngày, 1 khai báo `needs_update`.

**PR FE** `r5-fb013-fe-reminders` (song song trên mock theo hợp đồng này, merge sau BE):
- S02: chữ cho `visa_expiring` (`daysLeft`, critical), `lease_expiring` (theo `stage`), `registration_update_needed`; i18n EN/VI.
- S09: hộp "Visa extended / Gia hạn visa" (ngày + loại + gia hạn/sửa nhầm) trên màn giấy tờ; lịch sử trong vùng xem C3; nhãn checklist trên danh sách khai báo + lọc dài hạn; hộp "Declared outside Desk" (FDL+, theo `allowedActions`).
- S16: cột HĐ (ngày kết thúc, còn N ngày, `stage`), hộp ghi kết quả (3 lựa chọn + ngày + ghi chú), cột tạm trú; nút dẫn sang luồng gia hạn/đổi ngày đi đang có khi `stage = extend_booking|shorten_booking`.
- Màn tham số: các khóa mục 2.4; OWN thấy "Xem trước email" (A126).
- UXD duyệt hiển thị theo brand guideline (màu 80/15/5, Lora/Be Vietnam Pro, không emoji).

## 7. Tiêu chí test

**BE (unit + tích hợp, Postgres thật, dev clock)**
1. Visa hết 20/12, ở tới 31/12, tham số 5: không có mục tới 14/12; có từ 15/12 (`daysLeft` 5…0); 21/12 còn ở → critical `daysLeft -1`. Trả phòng → hết.
2. `recordVisaExtension` 20/12 → 20/03: mục hết, lịch sử 2 dòng (`initial`, `extension`), khai báo `confirmed` → `needs_update` (`visa_extended`), `registration_update_needed` xuất hiện. Ngày ≤ cũ với `extension` → 422. Gửi lại cùng Idempotency-Key → 1 lần ghi. `If-Match` cũ → 412. Có `c3_access_log update`; audit không chứa ngày.
3. Đổi `visa_expiry_warning_days.long_stay` 5 → 7: `visa_alert_on` các giấy tờ còn sống tính lại ngay; giấy tờ của đơn đã kết thúc vẫn null.
4. HĐ kết thúc 31/12, tham số 10: `not_due` tới 20/12, `ask` 21/12; ghi `no_answer` → `awaiting_answer`; `renewing` 31/03 → `extend_booking` tới khi `extendStay` → `done`; `not_renewing` 28/12 → `shorten_booking` + `earlyDeparture`; 31/12 vẫn `ask` → critical. Gia hạn xong ngày kết thúc mới → chu kỳ mới.
5. K14: đơn đến trước ngày ngưỡng → `confirmed`, `declaredOutsideDesk`; đơn đến sau → 422; FD → 403; thêm giấy tờ sau K14 không kéo K9; sửa visa sau K14 có kéo K9.
6. Job: 08:00 giờ cơ sở gửi 1 dòng outbox; chạy lại cùng ngày không thêm; `enabled=false` bỏ qua; ngày rỗng vẫn gửi khi `sendWhenEmpty`. Payload outbox **không** có tên khách (quét JSON). Người nhận đúng vai, user khóa/không email bị bỏ.
7. Mẫu email: không có chuỗi khớp số hộ chiếu/thị thực đã seed, không ngày hết hạn visa, không quốc tịch, không `href`, chỉ màu trong `BRAND`, không emoji (quét ký tự), có cả EN và VI; `guestName='none'` → không tên.
8. Quyền đủ 8 vai theo mục 5; tham số bảo mật MGR → 403; ngoài biên → 422. RLS: đơn/giấy tờ cơ sở khác → 404. Test kiến trúc RLS, migrations-journal, `worker-jobs` khớp registry, parameters-delete-architecture xanh.
9. Migration chỉ thêm: chạy trên bản sao staging, số dòng/giá trị bảng cũ không đổi.

**FE (vitest + Playwright)**
1. Nút theo `allowedActions`/vai: FD không thấy K14; FDL/FD không thấy xem trước email.
2. E2E: Hôm nay thấy visa còn 3 ngày → mở giấy tờ → gia hạn → mục biến mất, khai báo hiện "Cần khai lại". HĐ: ghi `renewing` → nút gia hạn đơn → xong → mục hết.
3. Ngày hết hạn visa chỉ hiện trong vùng C3 của màn giấy tờ, không ở S02/S16/danh sách. Không emoji, chỉ màu token brand.

## 8. Còn mở – cần DOM / INV chốt (không chặn code, đã là tham số hoặc cờ)

| # | Điểm | Mặc định đang dùng | Ai chốt |
|---|---|---|---|
| 1 | Q1 DOM: giữ nhắc sớm 30 ngày (một dòng email, một lần) hay bỏ | Tắt (`long_stay_early_notice` null) | INV |
| 2 | 5 ngày áp cho cả khách ngắn ngày (`short_stay` 14 → 5)? | Cả hai = 5 (INV nói "các trường hợp") | DOM xác nhận |
| 3 | Email có tên rút gọn khách không (DOM đề xuất có, ví dụ "Ivan P."); có ghi **ngày** hết hạn visa không (DOM đề xuất có) | Có tên rút gọn; **không** ngày, chỉ "còn N ngày" (SR-RET-06) | SEC + DOM; nếu SEC từ chối tên thì `guestName='none'` |
| 4 | K14 "đã khai ngoài Desk": FD được làm (DOM viết "lễ tân") hay chỉ FDL+ | FDL+ (bỏ qua bước kiểm giấy tờ) | DOM |
| 5 | Gia hạn visa có bắt khai lại tạm trú (K9) không; cần đổi số thị thực khi gia hạn không (endpoint chỉ nhận ngày + loại, số mới thì sửa đủ giấy tờ) | Có K9; số sửa qua `updateGuestDocument` | DOM (Q2 hỏi công an phường) |
| 6 | Hạn khai lại cho `needs_update` (12 giờ như khai mới?) – hiện chỉ là warning không có hạn | Không hạn | DOM |
| 7 | Ngưỡng K14 `registration_outside_desk_until` | deploy + 30 ngày | INV/DOM |
| 8 | Người nhận email: 4 vai + email tài khoản OWN của INV; không cho nhập địa chỉ tự do | Như mô tả | INV xác nhận |

## 9. SEC cần xem (Nghị định 13/2023 – trước khi lên production)

1. **Mục đích, tối thiểu**: ngày visa xử lý cho nghĩa vụ khai báo tạm trú của cơ sở lưu trú (Luật 47/2014 sửa đổi) và quản lý HĐ. Email nội bộ là một lần xử lý mới (dữ liệu ra hộp thư Google Workspace, ngoài kiểm soát xóa của Desk): SEC xác nhận nội dung tối thiểu mục 4, có cần thêm câu trong thông báo quyền riêng tư (privacy notice) không.
2. **C3**: `visa_valid_until` và lịch sử chỉ đọc qua `…/sensitive` có `c3_access_log`; ghi qua endpoint C3 có log cùng giao dịch, thiết bị tin cậy; audit/SSE/outbox/log không chứa ngày. Lịch sử dùng DEK của giấy tờ → xóa theo vòng đời giấy tờ (BR-610).
3. **`visa_alert_on` + `daysLeft`**: `daysLeft` trên "Cần chú ý" và email cho phép suy ra ngày hết hạn (sai số 0). Mở rộng điều kiện M9 / SR-RET-06 – SEC chấp nhận hay chỉ cho hiện nhóm ("≤ 5 ngày", "quá hạn").
4. **Email**: không link (chống phishing, giữ luật mẫu); chỉ gửi tới tài khoản nhân viên đang hoạt động theo vai, không địa chỉ tự do; `daily_digest` là tham số bảo mật (A119, audit `category='security'`); outbox không tên, dọn sau 30 ngày; dispatcher không log địa chỉ/thân thư. Khuyến nghị sổ vận hành: không chuyển tiếp email ra ngoài, không dùng hộp thư cá nhân.
5. **K14** bỏ qua bước kiểm giấy tờ: giới hạn vai + ngưỡng ngày + audit `registration.declared_outside_desk` (người, thời điểm, người được ghi là đã khai).
6. **Ghi chú tự do** `stay_follow_up.note`: qua bộ lọc mẫu số giấy tờ/thẻ, không vào email, không vào "Cần chú ý".
7. **IDOR/tenant**: `guestDocumentId` trong follow-up phải thuộc đúng đơn; mọi đường theo `propertyId` + RLS.
