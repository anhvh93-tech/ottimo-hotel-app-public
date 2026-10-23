# SEC review – BE-C R3-Q17 + R3-Q33 (a) và BE-D R3-Q15 (T13)

- Người review: SEC | Ngày: 23/10/2026 | Round 3 Sprint 1 – Bước Review (điều kiện phát hành v1.0: 6 thẻ SEC Verified).
- Commit được review:
  - nhánh `bec-r3-q17-sec`, `11fb5dc` (tách từ `main` `2deab84`): BE-65 kiểm lại, BE-74 cách (b), BE-75, BE-79, BE-84 (a1); migration `0080_sec_retention_be_c` (số tạm). Trả lời thẻ: `rounds/round-03/responses/s1-BE-C-q17.md` trên nhánh đó.
  - nhánh `be-d-r3-q15-t13`, `9715e1f` (tách từ `main` `a87bc01`): R3-Q15 T13; migration `0081_guest_request_t13` (số tạm).
- Căn cứ: `outputs/SEC/s1-security-requirements.md` mục B (B.0, B.1–B.4, B.6, B.7); thẻ gốc `round-02/reviews/s4-SEC.md` (FB-R2-SEC-BE-65, 74, 75, 79, 84).
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả của fixture. Tệp này không chứa bí mật, số giấy tờ hay dữ liệu thật.
- **Đây chưa phải Verified chính thức.** Theo B.0 (1)–(3), SEC chỉ ghi Verified trên commit đã gộp `main` có CI xanh. Lượt này cho biết từng thẻ có **đạt điều kiện để Verified** hay không. Sau khi gộp, SEC chạy lại đúng các tệp ở mục 2 rồi ghi vào `SEC-sprint1.md`.

## 1. Kết luận

| Thẻ | Kết luận lượt này | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-65 (kiểm lại) | **Đạt B.1** | Không đổi mã. `sec-be65-retention` (9 ca cũ + ca 8 mới) và `registration-party-removal` (18 ca) xanh trên DB mới. Migration 0078 có trong lịch sử. Các tệp hồi quy B.1 xanh trong lượt chạy toàn bộ. |
| FB-R2-SEC-BE-74 | **Đạt B.2** (cách b) | J25 NULL mọi cột ngoài DRA 7.1. Test soát **từng cột** của `guest` theo danh sách cho phép, không chỉ cột tên. Câu bù trong 0080 chạy lại được: lần 2 đổi 0 dòng. Migration giữ RLS/FORCE (kiểm `pg_class` sau migrate). |
| FB-R2-SEC-BE-75 | **Đạt B.3**, chấp nhận hai điểm lệch (mục 3) | Mốc = điểm kết thúc mới nhất của trả phòng / hủy / no-show / bị bỏ khỏi đoàn, không có thì `created_at`. Kiểm đơn mở trên toàn tổ chức. Hàm trả thêm mốc thời gian, và có policy `org_retention_read` mới: SEC chấp nhận cả hai, kèm FB-R3-SEC-BEC-01 (Minor). |
| FB-R2-SEC-BE-79 | **Đạt B.4** | Đủ 7 ca. Mọi thao tác nằm trong một giao dịch: test ép lỗi 500 xong thì A, B và giấy tờ y như trước. Audit `consent.reverted` không có số giấy tờ. CHECK `guest_id_doc_last4_consent_check` vẫn `convalidated`. Có một điểm lệch về phía an toàn, xem FB-R3-SEC-BEC-02 (Minor). |
| FB-R2-SEC-BE-84 (a) | **Đạt B.6** (a1) | Mục "Cần chú ý" chỉ OWN/MGR thấy. FD, FDL không thấy; HK nhận 403. Nội dung chỉ có `check` + `count`, test xác nhận không có id ảnh hay id đơn. Lượt J16 sau không còn ảnh thiếu mốc thì mục tự biến mất. J16 không xóa ảnh thiếu mốc. Phần (b) `FOR SHARE` (Should) chưa làm, vẫn để mở ở thẻ gốc. |
| R3-Q15 (B.7) | **Phần `note`/`reply_note`: đạt B.7. Toàn mục R3-Q15: CHƯA đạt** | Còn thiếu `online_checkin.arrival_note`, cũng là chữ khách gõ (C2, D23), mà ERD ghi phải xóa theo T13. Xem FB-R3-SEC-BED-01 (**Major**, phải xong trước dữ liệu thật). |

- **Blocker: không có.**
- **Major: 1** – FB-R3-SEC-BED-01 (arrival_note chưa có T13). Thẻ này không chặn gộp `9715e1f`, nhưng R3-Q15 chưa được ghi "SEC đạt B.7" cho tới khi sửa xong.
- Minor: 4 (BEC-01, BEC-02, BEC-03, BED-02). Suggestion: 2.
- **Gộp:** gộp được cả hai nhánh. Khi rebase phải đổi số migration (`main` hiện dừng ở 0078; nhánh 2FA dùng 0079; 0080 và 0081 là số tạm). Đổi số thì SEC chỉ đọc lại diff, không review lại toàn bộ.

## 2. Kiểm đã chạy

Hai `git worktree` tạm, tách riêng ở `11fb5dc` và `9715e1f`. Mỗi worktree có một Postgres 17 riêng (`sec-q17-pg` cổng 56631, `sec-q15-pg` cổng 56632, init roles của repo), migrate từ đầu. Test chạy bằng role `ottimo_app`. Worktree và container đã xóa sau khi xong.

1. `tsc --noEmit`: đạt ở cả hai commit.
2. Tệp bắt buộc ở `11fb5dc`: `sec-r3-q17` (12 ca), `sec-be65-retention` (10 ca), `registration-party-removal` (18 ca) → **40/40 đạt**.
3. Toàn bộ api `vitest run`:
   - `11fb5dc`: 104/108 tệp đạt ở lượt đầu. Ba ca đỏ: `workspace-packages` (worktree chưa build `@ottimo/contracts`), `guard-s3` SEC-BE-35 và `reversal-debt-g4` S4-16 (cả hai quá thời gian 30 giây do hai bộ test chạy song song trên cùng máy). Build `contracts` rồi chạy lại riêng 3 tệp này: **33/33 đạt**. Tổng: 3009 đạt, 2 bỏ qua, 0 lỗi (khớp số BE-C báo).
   - `9715e1f`: 2 ca đỏ cùng nguyên nhân (`workspace-packages`, `guard-s3`). Chạy lại: **6/6 đạt**. Tệp bắt buộc `guest-request-t13-r3-bed` (6 ca) + `guest-portal-boundaries` → **8/8 đạt**.
4. SEC dò thêm bằng SQL trên DB của `11fb5dc`, chỉ đọc. Với một tổ chức có 2 cơ sở:
   - `ottimo_app` có `app.property_id` của cơ sở 0 → đọc `reservation` / `reservation_guest` chỉ thấy **1** cơ sở. Policy mới không mở thêm gì cho app.
   - `SET ROLE ottimo_owner` + `app.organization_id` → thấy **2** cơ sở, đúng ý đồ.
   - `ottimo_owner` không có `app.organization_id` (giống lúc migrate) → **0** dòng. Migration về sau không bị ảnh hưởng.
   - Liệt kê mọi hàm `SECURITY DEFINER` trong `public`: `auth_find_user`, `auth_resolve_device`, `auth_resolve_session`, `guest_resolve_session`, `guest_resolve_token`, `guest_stay_retention`, `log_ensure_month_partition`, `worker_list_properties`. **Chỉ `guest_stay_retention` đọc bảng `reservation`/`reservation_guest`.** Hai hàm `guest_resolve_*` chỉ có cột `reservation_id` của `guest_access_token`/`guest_session`. Không có view hay materialized view nào trong `public`.
   - Sau migrate, `guest`, `reservation`, `reservation_guest`, `guest_request` đều còn `relrowsecurity = t`, `relforcerowsecurity = t`.
   - `retention_run`, `consent_record` có RLS theo cơ sở: số đếm BE-84 chỉ tính trong cơ sở hiện tại.

## 3. Hai câu ORC hỏi về BE-75

### 3.1 `guest_stay_retention` trả boolean **và** mốc thời gian (lệch chữ B.3)

**Chấp nhận.** Lý do:
- Ý của B.3 là hàm không được trả **dòng dữ liệu** của cơ sở khác. Hàm này trả đúng một dòng gồm `has_open` và `last_end`: không id, không tên, không số tiền, không trạng thái đơn.
- Hàm chỉ cấp cho `ottimo_app` và chỉ J25 gọi; không API nào gọi nó. Phần lộ thêm chỉ là "người này có một lượt ở kết thúc lúc T ở đâu đó trong cùng tổ chức". Bản thân hồ sơ `guest` vốn ở mức tổ chức nên đã thấy được.
- Các điều kiện còn lại của B.3 đều đạt và có test: `prosecdef`, `search_path` cố định, PUBLIC không chạy được, chỉ `ottimo_app` có EXECUTE, tổ chức khác gọi thì nhận `{false, null}`.
- Có cách đúng chữ hơn: hàm `guest_retention_due(p_guest, p_now, p_months, p_fallback) → boolean`. SEC ghi thành Suggestion S-1, không bắt làm.

SEC đề nghị ORC ghi `decision-log`: *"SEC chấp nhận `guest_stay_retention` trả `has_open` + `last_end` (lệch chữ B.3: 'chỉ boolean hoặc số đếm'), vì không trả id hay dòng dữ liệu, chỉ J25 gọi."*

### 3.2 Policy `org_retention_read` (SELECT, `ottimo_owner`, tổ chức hiện tại) trên `reservation` / `reservation_guest`

**Chấp nhận cho v1.0, kèm FB-R3-SEC-BEC-01 (Minor, làm trước RC).** Lý do:
- Policy này đúng là mở quyền đọc cấp tổ chức cho **mọi** hàm `SECURITY DEFINER` mà `ottimo_owner` sở hữu. Tuy vậy, hiện chỉ một hàm đọc hai bảng này (mục 2.4), nên phạm vi thực tế bằng đúng `guest_stay_retention`.
- Policy không vượt tổ chức (`organization_id = app_current_org()`) và không áp cho `ottimo_app`. `ottimo_app` không phải thành viên của `ottimo_owner` (`pg_auth_members`), nên app không thể `SET ROLE` sang owner.
- Cách làm giống tiền lệ `entry_function_read` của 0001, mà tiền lệ đó còn mở rộng hơn (`USING (true)`).
- Rủi ro còn lại nằm ở tương lai: một hàm `SECURITY DEFINER` mới đọc `reservation` sẽ âm thầm thấy được mọi cơ sở trong tổ chức. Không có gì phát hiện việc này, nên cần một chốt chặn tự động (BEC-01).

## 4. Thẻ mới

### FB-R3-SEC-BEC-01
- Mức độ: Minor
- Vị trí: `src/db/migrations/0080_sec_retention_be_c.sql` (policy `org_retention_read`); thư mục `test/` (chưa có test chốt chặn).
- Vấn đề: policy cấp cho `ottimo_owner` áp lên mọi hàm `SECURITY DEFINER` và mọi view không `security_invoker` do owner sở hữu. Hôm nay chỉ `guest_stay_retention` đọc `reservation`/`reservation_guest`. Nhưng hàm definer mới, hay view mới, sẽ âm thầm thấy được mọi cơ sở trong tổ chức, và không test nào báo.
- Vì sao quan trọng: cách ly giữa các cơ sở (FB-R2-SEC-BE-75 nêu rõ đây là ranh giới RLS) có thể bị hỏng mà không ai thấy, khi OTTIMO mở cơ sở thứ hai.
- Đề xuất sửa: thêm test chốt chặn (đặt cạnh `db-role.test.ts` hoặc trong `sec-r3-q17`):
  - (1) danh sách hàm `prosecdef` trong `public` có `prosrc` tham chiếu bảng `reservation` / `reservation_guest` (regex `\breservation(_guest)?\b` không nối `_id`) **bằng đúng** `{guest_stay_retention}`;
  - (2) danh sách policy có `ottimo_owner` trong `roles` bằng đúng danh sách cho phép (`entry_function_read` × 6 bảng, `org_retention_read` × 2);
  - (3) không có view hay materialized view nào trong `public` thiếu `security_invoker=true`.

  ARC thêm vào chuẩn code: "Hàm definer mới đọc bảng có `org_retention_read` phải được SEC duyệt."
- Hạn: trước tag RC (B.0 (7)). Không chặn gộp.
- Trạng thái: Open

### FB-R3-SEC-BEC-02
- Mức độ: Minor
- Vị trí: `registration/internal/registration.service.ts` `priorCrmDecision`, `moveDocProfile`.
- Vấn đề: khi giấy tờ chuyển từ A sang B, quyết định P05 "trước đó" của A chỉ tìm trong `consent_record` của **cơ sở hiện tại** (RLS theo cơ sở). Nếu A đã đồng ý P05 bằng giấy tờ của chính mình ở **cơ sở khác** cùng tổ chức, A bị đưa về `not_asked`. Hồ sơ `document` của A khi đó mất khóa, last4, ngày sinh, ghi chú phục vụ, dù A đã đồng ý thật.
- Vì sao quan trọng: lệch về phía **an toàn** (xóa nhiều hơn, không giữ thừa), nên không phải lỗi bảo mật. Nhưng hệ thống làm mất một đồng ý hợp lệ, và lễ tân phải hỏi lại khách. Với OTTIMO một cơ sở thì chưa xảy ra.
- Đề xuất sửa: khi R3-Q28 chuyển đọc chéo sang cổng đọc, tìm quyết định trước đó trên toàn tổ chức (hàm definer hẹp trả đúng `decision`, theo mẫu của `guest_stay_retention`, có test BEC-01). Trước mắt, BE-C ghi giới hạn này vào "Giới hạn đã biết" của release notes nếu v1.0 có nhiều cơ sở.
- Hạn: R4 hoặc khi mở cơ sở thứ hai.
- Trạng thái: Open

### FB-R3-SEC-BEC-03
- Mức độ: Minor
- Vị trí: `guests/public/document-profile.service.ts` `anonymizeDue`, điều kiện mới `g.merged_into_id IS NULL`.
- Vấn đề: J25 nay bỏ qua hồ sơ đã gộp. Hiện chưa có mã nào ghi `merged_into_id`, nên chưa có hậu quả. Khi tính năng gộp hồ sơ xuất hiện, hồ sơ `document` bị gộp sẽ **không bao giờ** được ẩn danh nếu còn giữ dữ liệu.
- Vì sao quan trọng: lặp lại đúng lỗi BE-75, tức hồ sơ không có mốc hạn lưu.
- Đề xuất sửa: ghi chú trong `anonymizeDue` và trong story gộp hồ sơ: lúc gộp phải xóa trường cá nhân của hồ sơ bị gộp, **hoặc** J25 phải xử lý cả hồ sơ đã gộp. Test đi cùng tính năng gộp.
- Hạn: cùng story gộp hồ sơ.
- Trạng thái: Open

### FB-R3-SEC-BED-01
- Mức độ: **Major**
- Vị trí: `online_checkin.arrival_note` (`db/schema/guest-portal.ts:115`; ghi ở `guest-portal.service.ts:518-523`; đọc ở `online-checkin.read.ts`, `registration.service.ts:2332`); job `guest_request.purge` (`guest-portal/public/guest-request-jobs.ts`).
- Vấn đề: `arrival_note` là chữ khách gõ lúc check-in online (C2, D23, ≤ 300 ký tự). ERD (`docs/erd.md` dòng về `online_checkin`) ghi rõ "xóa theo T13 cùng `guest_request`". DRA T13 gồm "yêu cầu/tin nhắn app khách". Nhưng không job nào làm rỗng cột này: SEC grep mọi chỗ `UPDATE online_checkin`, không có chỗ nào đặt `arrival_note = NULL`. Job T13 mới chỉ xử lý `guest_request`.
- Vì sao quan trọng: check-in online nằm trong phạm vi v1.0 (`release-v1-plan.md`: US-107). INV chấp nhận ESC-001 **với điều kiện hạn lưu ngắn nhất phải chạy thật**. Ghi chú lúc đến có thể chứa thông tin sức khỏe ("cần xe lăn", "đang ốm"). Nếu không sửa, những ghi chú này bị giữ vô thời hạn.
- Đề xuất sửa (BE-D, trong cùng PR R3-Q15 hoặc PR kế tiếp trước dữ liệu thật):
  - job T13 làm rỗng `arrival_note` khi lượt ở đã kết thúc: mốc = trả phòng / hủy / no-show của đơn (đọc qua cổng stay của BE-A) + `retention.guest_request_months`;
  - ghi `purge_journal` (`subject_type = 'online_checkin'`, `T13`, `null_columns`), audit chỉ số đếm;
  - test: trước hạn còn, sau hạn mất; đơn còn mở thì không xóa; chạy 2 lần không đổi thêm; audit/journal không chứa chữ.
- Hạn: **trước dữ liệu khách thật** (cùng cổng R3-Q15). R3-Q15 chỉ được ghi "SEC đạt B.7" khi thẻ này Done.
- Trạng thái: Open

### FB-R3-SEC-BED-02
- Mức độ: Minor
- Vị trí: `guest-request-jobs.ts` `guestRequestPurgeJob`, điều kiện `closed_at IS NOT NULL`.
- Vấn đề: yêu cầu không bao giờ được đóng (`new` / `acknowledged` / `in_progress` sau khi khách đã trả phòng) giữ `note` mãi mãi. Test "an open request is never purged, even years later" xác nhận hành vi này. AC3 của US-109 ghi "chưa kết thúc thì không xóa", và để mốc tính `[GIẢ ĐỊNH – SEC chốt theo DRA]`.
- **SEC chốt mốc T13:** `COALESCE(closed_at, thời điểm lượt ở kết thúc)` + `retention.guest_request_months`. Nghĩa là yêu cầu còn mở sau khi khách đã đi cũng hết hạn, tính từ lúc lượt ở kết thúc. Yêu cầu còn mở **trong lúc khách còn ở** thì không xóa, đúng như AC3.
- Vì sao quan trọng: J10 chỉ báo yêu cầu `new` quá hạn, nên yêu cầu `in_progress` bị quên sẽ không ai thấy. Rủi ro thấp vì nhân viên vẫn thấy danh sách yêu cầu mở.
- Đề xuất sửa: thêm nhánh mốc theo lượt ở trong cùng job (có thể làm chung với BED-01, vì cùng nguồn "lượt ở kết thúc"). Thêm một ca test.
- Hạn: R3 nếu kịp cùng BED-01; muộn nhất R4.
- Trạng thái: Open

### Suggestion
- **S-1 (BE-C):** đổi `guest_stay_retention` thành `guest_retention_due(p_guest, p_now, p_months, p_fallback) → boolean`, đúng chữ B.3 và không còn trả mốc thời gian. Không bắt buộc.
- **S-2 (BE-C):** trong `registration.service.ts`, khối JSDoc của `unclaimedDocumentStays` nay nằm phía trên `anchorMissingCount` (hàm mới chen vào giữa chú thích và hàm). Chuyển lại cho đúng chỗ.

## 5. Đọc diff – các điểm đã soát (không thành thẻ)

- **BE-74:** câu bù 0080 tắt rồi bật lại RLS/FORCE trên `guest`, đúng mẫu 0078. Câu chạy trong giao dịch của migrator, và `ALTER TABLE` giữ khóa `ACCESS EXCLUSIVE` nên phiên khác không thấy lúc RLS tắt. Chỉ mục duy nhất SĐT/email bỏ qua hàng đã ẩn danh, mà hàng ẩn danh nay không còn SĐT/email, nên không thể sinh hai hồ sơ trùng (ca 3). `last_stay_checkout_at`, `created_by` được giữ: không định danh người.
- **BE-75:** `GREATEST` bỏ qua NULL, `COALESCE(..., created_at)` bảo đảm luôn có mốc. Thành viên bị bỏ mà đơn vẫn `in_house` thì không còn tính là "đang mở" (ca 2). Mỗi lượt J25 của mỗi cơ sở quét mọi hồ sơ `document` của tổ chức và gọi hàm cho từng hồ sơ: chấp nhận được với quy mô OTTIMO; ARC xem lại khi có nhiều cơ sở.
- **BE-79:** `docKeyOf` chỉ giải mã số giấy tờ cũ trong bộ nhớ, không log, không trả ra ngoài. Ngoài việc đổi người, trường hợp sửa số giấy tờ của cùng một người cũng được xử lý: gỡ khóa cũ, ghi khóa mới nếu có P05. Đây là điểm cộng. P05 chỉ được ghi qua `consent_record` gắn với giấy tờ, nên `priorCrmDecision` đúng trong phạm vi một cơ sở.
- **BE-84 (a1):** hàng `anchor_missing` và hàng `J16` cùng `run_at` vì cùng được ghi ở phần chạy theo giờ. Lượt chạy không theo giờ không ghi `J16`, nên mục "Cần chú ý" không nhấp nháy. `events.service.ts`: `data_quality` chỉ thêm `count` vào danh sách tham số cho phép; người giữ tệp (BE-A/BE-D) cần xem lại khi gộp.
- **R3-Q15:** một câu `UPDATE … FOR UPDATE SKIP LOCKED` theo lô 500. Chạy lại không đổi thêm. `hk_task.note` về NULL, `work_order.description` thay bằng câu cố định. Tăng `version` để PWA thay bản offline. SSE chỉ mang id. Audit chỉ có `policyKey`, `count`, `linkedWork`, và test xác nhận không có chữ của khách trong `audit_event`. Khóa `retention.guest_request_months` giới hạn 1–12, mặc định 12, chỉ OWN sửa. CHECK `declined_other` được nới đúng một điều kiện (`note_purged_at IS NOT NULL`).
- **Ghi cho ARC (không phải bảo mật):** `notePurgedAt` có trong DTO nhưng chưa có trong OpenAPI / `@ottimo/contracts`. FE/MOB cần trường này để hiện "Ghi chú đã xóa theo hạn lưu" (US-109 AC3).

## 6. Điều kiện để ghi Verified chính thức (sau khi gộp)

1. Hai nhánh gộp `main` qua PR, CI push xanh, 0 `retry #`, đã đổi số migration.
2. SEC chạy lại trên worktree sạch ở commit đã gộp, DB mới: `sec-r3-q17`, `sec-be65-retention`, `registration-party-removal`, `guest-document-profiles`, `guest-request-t13-r3-bed`, cùng lượt chạy toàn bộ api.
3. SEC đọc diff của bước đổi số migration.
4. R3-Q15 chỉ được ghi đạt B.7 khi FB-R3-SEC-BED-01 Done.
5. BEC-01 xong trước tag RC (B.0 (7)).

## 7. Điểm làm tốt

1. Test BE-74 soát **từng cột** của `guest` theo danh sách cho phép, nên cột mới thêm sau này mà quên xóa sẽ làm test đỏ ngay.
2. BE-79 có ca ép lỗi giữa giao dịch, kiểm cả ba bên (A, B, giấy tờ), và có ca đổi qua lại A → B → A.
3. Job T13 xóa luôn bản sao chữ của khách ở `hk_task` và `work_order` qua hàm công khai của module housekeeping, không ghi thẳng vào bảng của module khác.
