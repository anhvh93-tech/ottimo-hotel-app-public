# ARC review – runbook v1.0.4 r2 (mục 5.0), tờ staging 05/11 và bản sửa khóa `lease_end_date`

- Round 4 (v1.0.4), bước **Review**. Đây là việc R11 của tờ staging: ARC đọc thay đổi r2 trước khi kết quả diễn tập được dùng cho P0. Ngày 05/11/2026, đọc trong lúc QA làm dữ liệu D0–D6, trước S1.
- ARC đã đọc:
  - `git show 2f345e60 -- rounds/round-04/outputs/OPS/` (runbook r2 và tờ `v1.0.4-staging-today.md`);
  - `git show 01c49c5a` (ORC sửa khóa SQL);
  - các tệp hiện tại ở `7b2d79ec`: runbook mục 0, 1.3, 1.6, P2, P2e, K2, K9–K11, 5, 5.0, R3b; tờ staging mục 0, 1, 4 (C1–C9), 5 (D0–D9), 6–8; biên bản `v1.0.4-staging-drill.md`; gói `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` (mục 0, 1, 2, 3.8, 5).
- Mã đối chiếu: `0d11db20` (`SHA_V104`). `git diff 0d11db20 HEAD -- product` chỉ khác `product/docs/qa/traceability.md`, nên mã trong cây làm việc chính là mã của bản cắt. ARC so thêm với tag `v1.0.3` ở những chỗ bàn về quay lui.
- ARC không SSH, không chạy lệnh nào lên máy chủ, không sửa mã hay tài liệu của vai khác.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Kết quả diễn tập 5.0 dùng được cho P0 nếu đủ 3 điều kiện:

| # | Điều kiện | Hạn |
|---|---|---|
| ĐK1 | Khi đọc `diff` ở S4c, S8b và S11, ORC áp luật đọc của thẻ 01 cho hai dòng `purge_journal` và `data_keys_live`. ARC chấp nhận trước lý do này, theo dòng cuối bảng D1. Không phải sửa lệnh nào | **Trước S1** (chỉ cần ORC biết luật) |
| ĐK2 | S15 / K11 (d) đếm từ giờ lùi, không đếm từ giờ D (thẻ 03) | Trước bước 10 của D1 |
| ĐK3 | Sửa chữ ở thẻ 02 và 04 | Trước P0 production. Không chặn diễn tập |

- **Blocker:** không có. **Major:** 1 (thẻ 01).
- **Trước S1 không phải sửa lệnh nào.** Mọi câu SQL của SNAP, PRE, C2, K9 (và các câu khác của hai tệp) dùng đúng tên bảng, cột và khóa jsonb của schema 72 (mục 1).
- **Gói production M4a:** lập luận của ORC **đúng**. Không phải sửa heredoc trước lượt chạy sáng ngày phát hành (mục 3, thẻ 04 chỉ thêm chú thích).
- Các sửa r2 của mục 5.0 dùng được:
  - một lượt S0–S16 nhờ H0 giữ chỗ 1 giờ;
  - so số đếm theo từng chiều: S4c = S1, S11 = S8b;
  - đồng hồ staging là `system` (biên bản 05/11 ghi đúng `CLOCK_MODE=system`);
  - nhãn S3 (thứ tự lùi) và S9 (thứ tự lên) giờ đã đúng.

---

## 1. Tên bảng, cột, khóa jsonb trong SQL (schema 72 của `0d11db20`)

### 1.1 Khóa `lease_end_date`
- Nguồn: `product/services/api/src/modules/reservations/public/lease-end.ts:23`, `LEASE_END_DATE_KEY = 'lease_end_date'`.
- Ghi ở một chỗ duy nhất: check-in B9/B9a, `frontdesk/internal/checkin.service.ts:893-896`. Khóa chỉ được ghi khi `stay_type = 'long' AND external_contract AND manual_long_stay IS NOT NULL`. B17 xóa khóa (`:1181-1182`).
- Không chỗ nào khác ghi vào `manual_long_stay`: `grep` các mẫu `manual_long_stay =`, `||`, `-` chỉ ra 2 chỗ trên.
- Sau `01c49c5a`, cả 4 câu đều đúng khóa:
  - runbook 1.6 (`v1.0.4-release-runbook.md:136-137`) và P2 (`:233`);
  - C2 `lease_gap` (`v1.0.4-staging-today.md:387`);
  - SNAP `lease_end_key` (`:496`).
- Biên bản ghi `lease_end_key` = 1 (`OTM-00385`). Đây là bằng chứng thật rằng câu đếm đúng khóa.

### 1.2 Còn câu nào dùng tên camelCase của API không
**Không còn.** ARC đã quét mọi khối SQL (heredoc và khối `sql`) của hai tệp, tìm định danh camelCase và chuỗi trong nháy. Mọi định danh đều là snake_case của DB. Các chuỗi giá trị cũng khớp mã:

| Câu | Bảng / cột / giá trị | Nguồn trong mã | Kết quả |
|---|---|---|---|
| SNAP | `app_user`, `property`, `reservation.code`, `guest`, `folio.primary_reservation_id`, `folio_line.folio_id`/`amount_vnd`, `payment.amount_vnd`, `data_key.destroyed_at`, `purge_journal` | `db/schema/identity.ts`, `platform.ts`, `reservations.ts`, `folio.ts:84-100, 130-160, 242-262`, `crypto.ts` | Đúng |
| PRE `new_kinds`, C2, K9 | `staff_notification.kind`, `created_at`; `hold_overdue_with_deposit`, `hold_overdue_cap`, `hold_expired` | `frontdesk.ts:263-292`, migration 0093 dòng 14 | Đúng |
| PRE `r3b_unknown_templates`, R3b | `outbox_message.topic = 'staff.email'`, `status` (`pending`/`in_flight`/`failed`), khóa payload `template`, 5 mẫu | `infra.ts:52-80` (CHECK trạng thái); `jobs/email-dispatch.ts:35, 203` | Đúng |
| PRE `dead_bad_template` | `last_error = 'BAD_TEMPLATE'` | v1.0.4 `email-dispatch.ts:219, 377-378`; v1.0.3 `email-dispatch.ts:217` (cùng chuỗi) | Đúng, cả hai bản |
| PRE, P2e | `config_parameter` (`property_id`, `key`, `value`, `effective_from`), `config_parameter_def.default_value` | `platform.ts:68-128` | Đúng |
| C2, K10, K11 (b) | khóa `public_show_prices` (0092), `privacy_notice_version` (0050) | migrations | Đúng |
| D3, K11 (d) | `consent_record` (`notice_version`, `locale`, `channel`, `recorded_at`); `online_checkin` (`notice_version`, `notice_locale`, `notice_accepted_at`) | `registration.ts:322-358`, `guest-portal.ts:104-140` | Đúng |
| A8 | `room_group.code`/`property_id`; `ota_base_rate` là object, khóa = mã nhóm | `rooms.ts:24-40`, `reservations/public/pricing.service.ts:58-59, 189` | Đúng |

Chữ `leaseEndDate` vẫn còn ở vài câu văn mô tả khóa DB. Không câu SQL nào dính. Xem thẻ 02.

---

## 2. Bảng D1 (S1–S16) đối chiếu hành vi mã

| Ô | Điều kiện trên tờ | Mã nói gì | Kết luận |
|---|---|---|---|
| C1c (deploy CI) | 5 dòng `[deploy`, không có dòng digest; `02-roles.sh … markers 1,true`; `migrations: 72 applied / 72 …` | `deploy.sh:73, 155, 199, 213, 359`. Dòng `image digests match the release` (`:139`) chỉ in khi có digest; CI staging gửi `deploy <tag>` không kèm digest (`deploy-from-ci.sh`). Dấu hiệu `1,true` khi bảng `drizzle` đã có (`:189-199`) | Khớp |
| S2 (lùi) | 6 dòng: `rollback=1`, `image digests match`, cấu hình, `02-roles`, `72 applied / 68`, `OK` | `rollback.sh` gọi `deploy.sh <tag> --rollback`. Ở chế độ lùi, `deploy.sh:84-85` đọc digest từ `state/digests/<tag>`. Kiểm số migration `applied ≥ journal` (`:207-208`) | Khớp |
| S3 (thứ tự lùi) | `api` sớm hơn `worker` | `deploy.sh:270-276`: lùi thì `switch_api` (`up api web`) trước, `switch_worker` sau. Compose: `worker` chỉ phụ thuộc `postgres`; `web` chờ `api` healthy. Vậy `up worker` không tạo lại api | Khớp |
| S9 (thứ tự lên) | `worker` sớm hơn `api` ít nhất 3 giây | `switch_worker`, ngủ 3 giây (`:262`), `worker_ok` so id container, rồi `switch_api`. Bước `smoke` so lại id worker (`:231, 287`). Cắt `StartedAt` xuống giây vẫn cho hiệu ≥ 3, vì sàn(a + d) − sàn(a) ≥ sàn(d) | Khớp |
| S4 | `db_triggers … function of migration 0095 … room_list_price_append_only enabled`; `containers` `ok` | `ops-check.sh:645` (đúng câu); `PN_0095_APPLIED_AT=72` (`:553`). Container mới phải có `RestartCount` 0, rồi in `(no restart since the last check)` (`:311-340`) | Khớp |
| S5 | `dead_bad_template` không tăng | Cùng chuỗi `BAD_TEMPLATE` ở v1.0.3 và v1.0.4 (mục 1.2) | Khớp |
| S1, J1, ARC P410-02 | `new_kinds` ≥ 1 sau khi H0 qua J1; không báo trùng | Mục 2.1 | Khớp |
| S1 `lease_end_key` ≥ 1, S12 | Khóa còn sau khi lùi và lên lại | v1.0.3 không bao giờ sửa `manual_long_stay` sau lúc tạo: chỉ `INSERT` với 3 khóa snake_case (v1.0.3 `reservations.service.ts:1986-1988`). DTO v1.0.3 chỉ đọc 3 khóa có tên (v1.0.3 `reservation-dto.ts:87-91`), nên khóa lạ bị bỏ qua, không lỗi. Ở v1.0.4 chỉ B9/B9a/B17 đụng khóa | Khớp |
| S4c, S8b, S11 | `diff` SNAP rỗng (S4c, S11) hoặc chỉ lệch đúng phần QA ghi (S8b) | **Không ổn định theo giờ** ở 2 dòng `purge_journal`, `data_keys_live` | **Thẻ 01** |
| Bước 10 (S15) | K11 (d) với `SINCE=giod` | Đếm cả lượt đồng ý trước lúc H05 thành v2 | **Thẻ 03** |

### 2.1 J1 `hold.expire` và khóa chống trùng (ARC P410-02): đúng như tờ viết

- **v1.0.4.** Dòng cổng `staff.push` dùng `ON CONFLICT (dedupe_key) DO NOTHING RETURNING id` (`reservations/internal/hold-notices.ts:73`). Nếu không trả về dòng nào, J1 không gọi `events.notify`.
  - Khóa (`reservations.service.ts`): `hold_overdue_partial:<id>:<hold_expires_at ISO>` (`:4694`), `hold_overdue_cap:<id>` (`:4707`), `hold_expired:<id>` (`:4759`).
- **v1.0.3.** Dùng **đúng ba khóa đó** (v1.0.3 `reservations.service.ts:4686, 4698, 4750`), qua `outboxStaffPush … ON CONFLICT (dedupe_key) DO NOTHING` (v1.0.3 `reservation-store.ts:470-484`).
- Hệ quả:
  - H0 đã được v1.0.4 báo lúc khoảng 14:53. Khi lùi về v1.0.3 hay lên lại v1.0.4, không ai báo lại.
  - Giữ chỗ nào hết hạn **trong lúc** staging ở v1.0.3 thì không bao giờ có dòng hộp thư sau khi lên lại (R6, D0, HD-34). Đúng như tờ.
  - OTM-00374 (D6) chỉ hiện ở **Cần chú ý**. Đúng.
- Người nhận `hold_overdue_with_deposit`: người tạo + người chốt + mọi FD/FDL/MGR đang hoạt động (`hold-notices.ts:28, 41-45`). D1 hàng 1 ghi "ở mỗi FD/FDL/MGR". Thiếu người tạo/chốt, nhưng không sai điều kiện "≥ 1".
- H0 có cọc nên **vẫn là `hold`** sau J1 (`kept_paid`). `holds_overdue` của PRE vì vậy có H0. PRE không đưa vào `diff`, nên đúng.
- H0 đến ngày 06/11. Trần BR-302 rơi vào 06/11 12:00, nằm ngoài diễn tập hôm nay. Xem thẻ 07 nếu phải chạy 5.0b.

---

## 3. Gói production M4a: lập luận của ORC đúng, không phải sửa heredoc trước lượt sáng ngày phát hành

- Không bản nào từ v1.0.0 tới v1.0.3 nhắc tới `leaseEndDate` hay `lease_end_date` trong `product/services`, `product/apps` (`git grep` ra 0 ở cả 4 tag).
- v1.0.3 tạo `manual_long_stay` với đúng 3 khóa `monthly_rent_vnd`, `external_contract_ref`, `deposit_held_vnd`.
- Vì vậy, trên dữ liệu chỉ do v1.0.0–v1.0.3 ghi, mọi dòng đều không có cả hai khóa. Hai vế `NOT (… ? 'leaseEndDate')` và `NOT (… ? 'lease_end_date')` cùng đúng ở mọi dòng, nên số đếm **bằng nhau**. Số `0` lúc 05/11 12:40 vẫn đúng. Lượt sáng ngày phát hành (production còn v1.0.3) cũng ra cùng số.
- Lập luận chỉ hỏng khi production **đã từng chạy v1.0.4**, ví dụ phát hành rồi quay lui, sau đó chạy lại gói. Khi đó M4a đếm **thừa**: đơn nhận phòng trên v1.0.4 rồi gia hạn bị tính vào. M4a **không bao giờ đếm thiếu**, nên hậu quả xấu nhất là báo nhầm cho DOM.
- Sửa heredoc buộc SEC duyệt lại bảng SHA ở mục 2.1, mà không đổi kết quả. **Không đáng.** Lượt sáng vẫn trích từ commit đã ghim `331bbbd6`.
- Chỉ cần một chú thích ngoài heredoc. Chú thích đó không đổi 12 SHA, vì SHA chỉ tính khối lệnh. Xem thẻ 04.
- `LEASE_BASE` để so ở K9 lấy từ **P2 của runbook vào ngày phát hành** (khóa đã sửa), không lấy từ M4a.

---

## 4. Thẻ feedback

### FB-R4-ARC-OPS-RB2-01
- Mức độ: **Major**
- Vị trí:
  - `rounds/round-04/outputs/OPS/v1.0.4-staging-today.md:491-492` (SNAP, dòng `data_keys_live`, `purge_journal`);
  - D1 hàng 5 (S4c, `:530`), hàng 12 (S8b, `:537`), hàng 15 (S11, `:540`);
  - `v1.0.4-release-runbook.md:722` (S11 r2, ý 1 và 2).
- Vấn đề: hai dòng SNAP này thay đổi theo giờ thật trên staging, **không phụ thuộc** việc lùi hay lên.
  - J16 `retention.purge` chạy **mỗi tick** (`modules/registration/public/worker-jobs.ts:29`).
  - Bước 2 (T01) xóa ảnh giấy tờ của khách không đồng ý lưu (hoặc khách nhỏ tuổi, hoặc hồ sơ hủy) khi qua mốc `confirmed_at + id_image_purge_max_hours` (`registration/internal/retention.service.ts:171-190`). Staging đặt 24 giờ (`tests/fixtures/seed/ds-e.json:1121-1122`).
  - Mỗi ảnh xóa thì hủy DEK (`UPDATE data_key SET wrapped_key = NULL, destroyed_at`, `crypto/internal/envelope-crypto.service.ts:162`) và ghi `purge_journal` `destroy_dek` (`:168-170`). Tức `data_keys_live` giảm và `purge_journal` tăng.
  - Phần chạy mỗi giờ (1a), `guest_request.purge` (mỗi tick) và hai job hằng ngày cũng ghi `purge_journal`.
  - Vậy mọi đăng ký đã xác nhận trên staging khoảng 24 giờ trước cửa sổ diễn tập (chiều 04/11) sẽ bị xóa ảnh **trong lúc** diễn tập. v1.0.3 hay v1.0.4 làm việc này như nhau.
  - Các dòng còn lại của SNAP ARC đã rà, không thấy job nào đổi theo giờ:
    - J15 `folio.close` chỉ đổi trạng thái folio, mà SNAP chỉ đếm số folio;
    - J24 `payment.expire` chỉ đổi trạng thái thanh toán;
    - J1 chỉ đổi trạng thái đơn;
    - purge ảnh không đụng dòng `reservation` (`registration.service.ts` `purgeImages` chỉ cập nhật `document_image`, `registration`).
  - Ba dòng OTM vì vậy ổn định: folio của 5 đơn đã đóng sáng 05/11 (`post_checkout_charge_hours` = 24).
- Vì sao quan trọng: theo D1, `diff` S4c không rỗng thì **dừng, báo ARC + BE**.
  - Dừng ở S4c nghĩa là staging nằm lại ở v1.0.3. Cửa sổ R6 dài ra, có thể làm hỏng HD-13 của QA lượt 2.
  - Ở S11, kết quả bị ghi là KHÔNG ĐẠT, dù việc lùi/lên không đổi dữ liệu.
  - Ở S8b, QA không thể đã ghi trước hai dòng này.
- Đề xuất sửa (ARC **chấp nhận trước** lý do này, theo dòng cuối D1, nên không phải đổi lệnh):
  1. (Tùy chọn, nên làm) Ngay trước mỗi SNAP, ghi giờ: `date -u +%Y-%m-%dT%H:%M:%SZ > "$W/$N.at"`.
  2. Nếu `diff` **chỉ** lệch ở `purge_journal` (tăng) và/hoặc `data_keys_live` (giảm), chạy câu giải thích bằng `SQLRO`, cùng khung lệnh SSH với PRE. Câu chỉ in nhãn, phút và số, không có id hay dữ liệu khách:
     ```sql
     SHOW default_transaction_read_only;
     SELECT current_user;
     SELECT 'pj', to_char(date_trunc('minute', purged_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI"Z"'), subject_type, policy_key, action, count(*)
       FROM purge_journal WHERE purged_at >= now() - interval '3 hours' GROUP BY 2, 3, 4, 5 ORDER BY 2, 3, 4, 5;
     SELECT 'dk', to_char(date_trunc('minute', destroyed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI"Z"'), purpose, count(*)
       FROM data_key WHERE destroyed_at >= now() - interval '3 hours' GROUP BY 2, 3 ORDER BY 2, 3;
     ```
     (`AT TIME ZONE 'UTC'` làm phút luôn là giờ UTC, cùng hệ với giờ D và `$W/<N>.at`, dù múi giờ phiên là gì. ARC chưa chạy câu này trên DB thật: tên cột lấy theo `crypto.ts`, và vai `ottimo_readonly` có `SELECT` trên mọi bảng `public` (`02-roles.sh:127`). Lỗi cú pháp thì ORC ghi số thô của `diff` và báo ARC; không chạy bằng vai khác.)
  3. **Chấp nhận** khi đủ 3 điều:
     - tổng các dòng `pj` có phút nằm giữa hai lần SNAP bằng phần tăng của `purge_journal`;
     - tổng các dòng `dk` trong cùng khoảng bằng phần giảm của `data_keys_live`;
     - ba dòng OTM trùng tuyệt đối.

     ORC ghi vào biên bản: "lệch do J16/purge theo giờ, không do lùi/lên", kèm số. Mọi dòng `diff` khác vẫn **dừng** như tờ viết.
  4. Lần sau (v1.0.5, OPS): chuyển `purge_journal` và `data_keys_live` từ SNAP sang PRE. Hoặc giữ ở SNAP nhưng chỉ đếm `purged_at` / `destroyed_at` trước giờ D.
- Trạng thái: Open

### FB-R4-ARC-OPS-RB2-02
- Mức độ: Minor
- Vị trí: `v1.0.4-release-runbook.md`:
  - `:32` (mục 0, "chưa có khóa `leaseEndDate`");
  - `:528-534` (tên và nhãn K9);
  - `:654` (mục 5, "có khóa `leaseEndDate`");
  - `:675` (5.0, "có khóa `leaseEndDate`");
  - `:711` (S1, "số đơn có `leaseEndDate`");
  - `:98` (1.3 dòng 0094, "Staging với `CLOCK_MODE=mutable`…", trái với r2).
- Vấn đề: câu văn vẫn gọi tên **khóa DB** là `leaseEndDate`. Chính kiểu viết này đã dẫn tới câu SQL sai ở r2. Ô 1.3 dòng 0094 còn ghi staging chạy `mutable`.
- Vì sao quan trọng: người viết câu kiểm sau (v1.0.5, gói chỉ đọc sau) sẽ chép lại tên sai. Kiểm theo cú pháp không bắt được lỗi này, vì `? 'leaseEndDate'` vẫn chạy và chỉ ra 0.
- Đề xuất sửa:
  - Khi nói về DB, viết "khóa `lease_end_date` trong `manual_long_stay` (API: `manualLongStay.leaseEndDate`)". Giữ `leaseEndDate` khi nói về API, giao diện hay S12.
  - Ô 1.3 dòng 0094: "Stack dùng một lần có `CLOCK_MODE=mutable` lùi về quá khứ: xem 5.0".
  - Làm trước P0, cùng lượt ORC commit biên bản.
- Trạng thái: **Đã sửa** (ORC 05/11, runbook `:32`, `:98`, K9 `:528-534`, `:654`, `:675`, `:711`)

### FB-R4-ARC-OPS-RB2-03
- Mức độ: Minor
- Vị trí: `v1.0.4-staging-today.md:535` (D1 hàng 10: "lệnh D3 với `SINCE=giod`"), D3 `:570` và `:579` ("S15: một dòng `…|1`").
- Vấn đề:
  - Giờ D là 04:49:10Z (11:49 giờ VN). H05 chỉ thành `privacy-2026-10-v2` lúc 14:05:51 (biên bản, D4). LS `OTM-00385` nhận phòng lúc 14:05:49–50, "giấy tờ mẫu của fixtures" (QA plan D2).
  - Lượt đồng ý nào ghi trong khoảng 11:49 → 14:05:51 mang `privacy-2026-10-v1`. Lệnh D3 với `SINCE=giod` sẽ in dòng v1 đó. Điều kiện dừng "có v1 sau khi QA đặt H05" bị kích hoạt oan, vì câu đếm không phân biệt trước hay sau 14:05:51.
  - Mỗi lần ghi đồng ý tại quầy tạo một dòng `consent_record` (`registration.controller.ts:469`, gọi `recordConsent` một lần). Số `1` chỉ đúng nếu bước 9 ghi đúng một lần.
- Vì sao quan trọng: S15 là bằng chứng duy nhất cho câu "Desk v1.0.3 ghi v2 tại quầy", điều mà mục 5 dựa vào. Báo nhầm thì kéo theo dừng và báo SEC oan.
- Đề xuất sửa:
  - Ngay trước D2 (S2), chạy `date -u +%Y-%m-%dT%H:%M:%SZ > "$W/down_at"`. Ở bước 10 dùng `SINCE=$(cat "$W/down_at")`.
  - "Đúng là" của S15: mọi dòng là `privacy-2026-10-v2|<locale>|desk`, số dòng = số lần ghi đồng ý tại quầy QA/ORC đã ghi ở bước 9.
  - Nếu đã lỡ chạy với `giod`: chạy lại với `down_at`, rồi chấm theo lần chạy lại.
- Trạng thái: Open

### FB-R4-ARC-OPS-RB2-04
- Mức độ: Minor
- Vị trí: `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md`:
  - `:30` (bảng mục 0: "runbook v1.0.4 P2 nguyên văn");
  - `:572-575` (3.8);
  - `:957` (mục 8, "chép nguyên văn, đã kiểm từng ký tự");
  - `:867` ("Ghi mốc cho K9").
- Vấn đề: từ `01c49c5a`, M4a không còn là nguyên văn P2. Lập luận "tương đương" (mục 3) đúng nhưng chưa được ghi vào gói. Dòng `:867` gợi ý lấy số M4a làm mốc K9.
- Vì sao quan trọng: nếu phải chạy lại gói sau một lần phát hành hỏng rồi quay lui, M4a đếm thừa, và người đọc không biết vì sao.
- Đề xuất sửa (chỉ sửa chữ **ngoài** khối lệnh; 12 SHA ở 2.1 không đổi; lượt sáng vẫn trích từ `331bbbd6`):
  - Thêm vào 3.8: "M4a dùng khóa cũ `leaseEndDate` (nguyên văn P2 trước `01c49c5a`). Kết quả bằng khóa đúng `lease_end_date` **khi production chưa từng chạy v1.0.4**, vì v1.0.0–v1.0.3 không ghi khóa nào trong hai khóa này (ARC-on-v104-runbook-r2-drill mục 3). Nếu production đã từng chạy v1.0.4, bỏ số đầu của M4a, lấy `LEASE_BASE` từ runbook P2. `LEASE_BASE` cho K9 luôn lấy từ P2 ngày phát hành."
  - Sửa `:30` và `:957` cho khớp. Thêm vào `:867`: "mốc chính thức lấy ở P2".
- Trạng thái: Open

### FB-R4-ARC-OPS-RB2-05
- Mức độ: Minor
- Vị trí:
  - runbook 1.6 `:133-137`, P2 `:230-233`;
  - K9 (dùng câu 1.6);
  - tờ staging C2 `:387`;
  - gói M4a `:388-391`.
- Vấn đề: câu đếm "giới hạn đã biết" không lọc `external_contract AND manual_long_stay IS NOT NULL`. Thế nhưng:
  - khóa chỉ được ghi cho đúng nhóm này (`checkin.service.ts:894`);
  - `leaseEndDateOf` trả `null` cho mọi đơn khác (`lease-end.ts:38`), nên đơn khác không mang giới hạn đó.

  Đơn dài hạn không có hợp đồng ngoài mà đã gia hạn sẽ bị đếm thừa vào `LEASE_BASE` và K9.
- Vì sao quan trọng:
  - chỉ đếm thừa, không bao giờ đếm thiếu;
  - production hiện ra 0 với câu rộng hơn, nên câu hẹp cũng ra 0;
  - nhưng khi số > 0, DOM phải kiểm tay cả những đơn không liên quan.
- Đề xuất sửa: thêm `AND external_contract AND manual_long_stay IS NOT NULL` vào câu ở 1.6, P2, K9 và C2 **cùng lúc**, để P2 và K9 còn so được với nhau. Làm ở r3 của runbook trước P0, hoặc dời v1.0.5 (OPS chọn, ghi decision-log). Không sửa M4a (thẻ 04).
- Trạng thái: Open

### FB-R4-ARC-OPS-RB2-06
- Mức độ: Suggestion
- Vị trí: runbook G5 (`:857`), bảng 0.1 dòng "Câu SQL của runbook trên schema 72" (`:65`).
- Vấn đề: "chạy thử mọi câu trên schema 72" chỉ chứng minh câu đúng cú pháp, đúng tên bảng/cột và đủ quyền. Câu `? 'leaseEndDate'` đã qua bước này, vì trên DB rỗng mọi câu đếm đều ra 0.
- Đề xuất:
  - Với mỗi câu có chuẩn "≥ 1" (`lease_end_key`, `new_kinds`), thêm một **ca dương** trên DB tạm. Ví dụ: chạy fixture nhận phòng một đơn dài hạn nhập tay, và chạy J1 cho một giữ chỗ có cọc. Câu đếm phải ra ≥ 1.
  - Với mỗi chuỗi trong câu (khóa jsonb, `kind`, `status`, `template`, `last_error`, `channel`), ghi kèm hằng trong mã (`LEASE_END_DATE_KEY`, `HoldNoticeKind`, `STAFF_EMAIL_TEMPLATES`, `deadReason`).
- Trạng thái: Open

### FB-R4-ARC-OPS-RB2-07
- Mức độ: Suggestion
- Vị trí: D1 hàng 2 (S1, `:527`); PRE `:507` và runbook R3b `:777-780`; D9 (5.0b).
- Vấn đề và đề xuất:
  - (a) S1 không dừng khi `qa_res_rows` ≠ 5. Nếu 5 đơn OTM không còn, hai băm thành `-` và luôn "trùng". Đề xuất thêm điều kiện dừng `qa_res_rows` ≠ 5.
  - (b) `payload->>'template' NOT IN (…)` bỏ sót dòng không có khóa `template` (NULL), trong khi worker v1.0.3 cũng giết dòng đó là `BAD_TEMPLATE` (`email-dispatch.ts:203, 219`). Đề xuất dùng `coalesce(payload->>'template', '') NOT IN (…)` ở bản sau. Theo thiết kế số này vẫn là 0, nên không gấp.
  - (c) P410-02 trong cửa sổ lùi: thêm một dòng PRE ở S1, chỉ đếm, để biết trước giữ chỗ nào sẽ do J1 v1.0.3 xử lý:
    `SELECT 'holds_expiring_90m', count(*) FROM reservation WHERE status = 'hold' AND hold_expires_at BETWEEN now() AND now() + interval '90 minutes';`
    Số > 0 thì ghi lại. Đó là đúng thiết kế, không phải lỗi.
  - Nếu phải chạy 5.0b ngày 06/11: đừng để cửa sổ lùi trùm 12:00. H0 đến 06/11, nên khóa `hold_overdue_cap:<id>` sẽ bị v1.0.3 ghi trước, và MGR/OWN không nhận thông báo trần của H0 trên v1.0.4.
- Trạng thái: Open

---

## 5. Điểm làm tốt
- **So theo từng chiều** (S4c = S1 ngay sau lùi, S11 = S8b ngay trước và sau khi lên) là cách đúng: tách được thao tác của QA khỏi tác động của việc lùi/lên. Thẻ 01 chỉ thêm một luật đọc cho các job chạy theo giờ.
- **Dòng log mong đợi khớp mã từng chữ:** 5 hoặc 6 dòng `[deploy`, dòng digest có hay không, `markers 1,true`, `72 / 68` khi lùi và `72 / 72` khi lên, thứ tự container, chuẩn ≥ 3 giây. Lệch sẽ lộ ra ngay.
- **ORC bắt lỗi khóa ngay khi chạy thử, trước S1.** Bản sửa đủ 4 chỗ của hai tệp, biên bản ghi lệch rõ, và tách đúng phần gói production cần cân nhắc riêng.
