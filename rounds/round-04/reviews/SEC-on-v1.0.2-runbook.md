# SEC review – Runbook phát hành production v1.0.2 (OPS)

- Round 4, đợt v1.0.2, bước **Review**. Người review: SEC. Tác giả: OPS.
- Tệp: `rounds/round-04/outputs/OPS/v1.0.2-release-runbook.md` (commit local `d80abde3`, chưa push). Đọc toàn bộ 481 dòng.
- Căn cứ: `rounds/round-04/qc/v1.0.2-gate.md` (ĐK3 phần SEC, ĐK8 (5) và (7)); `rounds/round-04/reviews/SEC-on-PR29-pn-01.md` mục 6 và thẻ PN01-01/02; `rounds/round-03/reviews/SEC-on-BE-gchat-notify.md` (★2-bis); `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md` B14; `product/infra/server/bin/us155-smoke-counts.sh` + `.sql`; `product/services/api/src/modules/public-site/internal/sensitive-number.ts`, `public-booking.service.ts`; `apps/landing-web/src/scripts/booking-form.ts`.
- Cách kiểm: đọc tệp, `git grep`, `git diff origin/main..main`. Chạy `sensitiveNumberKind()` cục bộ bằng `tsx` để chọn số giả cho K8 (không chạm môi trường nào). **Không SSH, không sửa runbook, không commit.**

**Kết luận: ĐẠT (phía SEC) cho Release v1.0.2.** Không có Blocker. Hai thẻ Major không chặn duyệt Release, nhưng có hạn:
- **RB-01** phải làm cùng lúc với K3. Chưa làm thì SEC **chưa** đổi ★2-bis thành "Đã thay bằng 0090".
- **RB-02** (K8 đủ hai ca 202 và 422) phải làm **trong ngày** Release, theo ĐK8 (7) của QC.

ORC chạy cả hai như phần bổ sung. Các câu lệnh và cách làm có sẵn trong thẻ, nên không phải chờ OPS sửa runbook trước khi Release.

---

## 1. Đối chiếu theo yêu cầu

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Lệnh không in env/bí mật | **Đạt** | Không lệnh nào `cat`/`printenv`/`env` hay đọc `.env`, `secrets/`, webhook. K4 lọc đúng 4 loại `msg`, cắt 90 ký tự; webhook lỗi thì chỉ `stat` (dòng 273). K7 chỉ đếm. Mục 4 chỉ đọc dòng `^\[deploy `. P3 chỉ `tail -n 3` của `backup.sh`. K6 chỉ truyền URL công khai, không có `E2E_SMOKE_USER`. Ngoại lệ nhỏ ở R6 (thẻ 05) |
| Không lộ IP/bí mật vào repo công khai | **Đạt** | Không có IPv4, URL webhook, token hay mật khẩu. Đã quét `git diff origin/main..main` (7 tệp sẽ push ở P1, bỏ qua ảnh): không khớp mẫu IP, `chat.googleapis`, `key=`, `token=`, khóa riêng, `ghp_`, `@gmail.com`. Các thông tin vận hành đã có sẵn trong repo công khai: host `desk.ottimo.vn`, user `ottimo-admin`, tên tệp khóa `~/.ssh/ottimo_ops` (`v1.0.1-inv-commands.md`), NOPASSWD (`round-02/inv-staging-checklist.md:75`). Mới có thêm id môi trường `production` và digest image. Cả hai đều không phải bí mật: muốn duyệt vẫn phải có quyền reviewer, còn digest thì log Release công khai cũng in ra |
| SQL trên production là READ ONLY | **Đạt** | P2, K2/K3, R6 đều chạy `-e PGOPTIONS="-c default_transaction_read_only=on"` + `ON_ERROR_STOP=1`. Dòng đầu `SHOW default_transaction_read_only` phải ra `on`, nên lệnh tự kiểm. Mọi câu trong heredoc đều là SELECT/SHOW. Lệnh đếm của K8 (`us155-smoke-counts.sql`) mở `BEGIN TRANSACTION READ ONLY … ROLLBACK`. Không chỗ nào có SQL ghi tay. Câu "Không sửa gì bằng SQL" (K3) và "không SQL tay" (1.3, mục 5) nhất quán |
| Sao lưu trước khi đổi | **Đạt** | P3 (`backup.sh` → `OK: … encrypted files`) đứng trước P4 tag/P5 duyệt. Chưa có `OK:` thì dừng. P2 kiểm `digests/sha-755cad1642ca` (ĐK2). R3 trước R4. Cho bỏ R3 khi gấp là chấp nhận được, vì quay lui không đổi dữ liệu; điều kiện là phải ghi lại |
| Quay lui không làm mất PN-01 ngoài ý muốn | **Đạt, kèm 1 Minor (thẻ 03)** | Xem mục 2 |
| K3 đủ thay ★2-bis | **Chưa đủ, thiếu 1 dòng (thẻ 01, Major)** | Xem mục 3 |
| K8 | **Bắt buộc trong ngày, và còn thiếu ca 422 (thẻ 02, Major)** | Xem mục 4 |
| ĐK3 (c): khuôn R4 theo PR #26 | **Đạt** | `{ rollback.sh sha-755cad1642ca 2>&1; echo "MA THOAT: $?"; } \| grep -E …`, có tag tường minh, cấm chạy không tham số (dòng 360–361, 429). Ghi rõ "DB giữ 0089/0090", không đụng webhook/`.env`/`secrets/`, khi nào dùng, và restore chỉ khi thảm họa, theo quy trình riêng. Đây cũng là bằng chứng cho ĐK12 (c): PR26-01 (lệnh R4 có `MA THOAT`) đã được áp dụng đúng |
| ĐK3 (d): dòng thường trực về `privacy_notice_version` | **Có ý, chưa có câu tường minh (thẻ 04, Minor)** | – |

## 2. Quay lui về v1.0.1: trigger 0090 vẫn còn, có vấn đề gì không

**Không có vấn đề. Giữ trigger là đúng ý SEC (★2).**
- v1.0.1 chỉ `SELECT` bảng `privacy_notice_version` (OPS đã `git grep` ở tag v1.0.1). `ottimo_app` chỉ có SELECT (0086:178). Vì vậy không đường nào của app v1.0.1 bị trigger chặn.
- Đường ghi duy nhất là `publish-privacy-notice.sql`. Tệp này không nằm trong 5 tệp khác giữa gói v1.0.1 và `e5fffe05` (runbook 1.2). Câu UPDATE `superseded_at … IS NULL` của nó khớp nhánh cho qua, BE và QA đã thử. Nghĩa là lượt đăng thông báo `landing-v1.2.0` vẫn chạy được, dù production đang ở v1.0.1 hay v1.0.2.
- Migrator của image cũ không có migration đi xuống, nên quay lui không thể gỡ trigger. R6 kiểm lại 2 trigger `O`. Trạng thái ★2-bis (khi đã đổi) **vẫn giữ** sau quay lui, vì bảo vệ nằm ở DB, không nằm ở image.
- 0089 để lại `GRANT DELETE ON room_list_price TO ottimo_app` và `GRANT INSERT ON simulation_guard`. Mã v1.0.1 không dùng hai quyền này, RLS theo cơ sở vẫn áp, còn `simulation_guard` luôn hủy khi commit. Quyền thừa là chấp nhận được, nhưng cần biết.

Còn hai khoảng hở **ngoài ý muốn** mà runbook chưa nói. Cả hai ghi ở thẻ 03:
1. Quay lui làm mất bộ dò mới của PR #24 trên form (BUG-R3-058: ký tự ẩn, `_` `/` `,`, chữ số full-width; số giấy tờ KO/ZH/RU). Form trở về bộ dò v1.0.1. Chat ở mức A chỉ có mã + link, nên không lộ qua Chat. Nhưng ghi chú form có thể lưu số giấy tờ viết lách.
2. Bản sao lưu P3 chụp **trước** 0090. Nếu sau này phải restore từ bản này (thảm họa, quy trình riêng), DB về 0088 và **không có trigger**. Bản 03:00 sáng 04/11 trở đi thì đã có trigger (pg_dump tạo trigger ở phần post-data).

## 3. K3 có đủ thay ★2-bis không

★2-bis (`SEC-on-BE-gchat-notify.md` dòng 158) gồm 2 ý: (a) `\dp`: `ottimo_app` chỉ có `SELECT`; (b) runbook ghi "không UPDATE/DELETE tay".

Ở `SEC-on-PR29-pn-01.md` mục 6, SEC chấp nhận bỏ việc chụp (a) vì "0086 bảo đảm, và **thẻ PN01-01 đưa phần này vào CI**". Nhưng thẻ PN01-01 đã **dời sang v1.0.3** (decision-log dòng 1072), nên CI hiện **chưa** kiểm quyền của `ottimo_app`. Trigger 0090 cũng không chặn INSERT. K3 hiện chỉ kiểm trigger, nên ý (a) chưa có bằng chứng nào trên production → thẻ 01.

Thêm 1 dòng READ ONLY vào K3 thì đủ. Không cần chụp `\dp`. Phần DDL của chủ bảng (tắt trigger sau này) vẫn chỉ được kiểm một lần. Lần kiểm định kỳ (PN01-02 b, `ops-check`) vẫn để ở v1.0.3, và phải có trong backlog 5.6 (ĐK11) trước khi SEC xét đặt mức C.

## 4. K8: có cần bắt buộc trong ngày không

**SEC: bắt buộc trong ngày, đủ cả hai ca.** Ý kiến này trùng với ĐK8 (7) của QC. Runbook ghi K8 là "khuyến nghị" và chỉ có ca 202, nên lệch gate.

Lý do:
- PR #24 là biện pháp bảo vệ dữ liệu cá nhân: không nhận số giấy tờ/thẻ trong chữ khách gõ (V-09, SR-LOG-04, tối thiểu hóa dữ liệu theo NĐ 13/2023). Biện pháp này **chưa từng chạy** với form thật (staging chưa đăng thông báo, nên form đóng).
- Form trên ottimo.vn **đang mở** trên production từ B14 (REQ-YY5E3FJ9, 03/11). Khách thật có thể gửi ngay khi v1.0.2 lên.
- Ca 202 chứng minh bộ dò không chặn nhầm (khả dụng; quy tắc QC: chặn mọi yêu cầu hợp lệ thì quay lui). Ca 422 chứng minh biện pháp **đang bật** trên bản build production: form landing `sha-72f9ac8e2b33` gọi đúng API mới và hiện đúng câu báo lỗi (`booking-form.ts:320`). Hai ca tốn khoảng 10 phút, không dùng dữ liệu khách thật, và còn trong giới hạn 5 lượt/IP/giờ.

Cách làm không để lại PII: xem thẻ 02.

## 5. Ghi nhận khác (không thành thẻ)

- ORC chạy production qua SSH bằng `sudo -n` không mật khẩu và tự duyệt môi trường `production` bằng `gh api`. Cách này theo tiền lệ INV "Bạn chạy giúp" ở v1.0.1 (decision-log 1065). Runbook đã khóa đúng chỗ: mỗi bước đổi trạng thái (sao lưu, tag, duyệt, quay lui) đều chờ INV đồng ý trong chat, còn comment duyệt ghi rõ nguồn đồng ý. Rủi ro còn lại đã biết: một phiên agent có quyền root trên máy giữ dữ liệu khách. Đề nghị: sau đợt phát hành, khóa `ottimo_ops` chỉ nạp vào ssh-agent khi cần. SEC sẽ đưa việc này vào báo cáo rủi ro còn lại, không chặn đợt này.
- Ngoài phạm vi SEC, nhắc ORC/QC: runbook chưa ghi kết quả diễn tập quay lui trên staging (ĐK4 của QC: "Log diễn tập, ghi trong runbook"), và chưa có ý (8) của ĐK8 (xem nút Trả sớm và khối giá hẹn trên Desk).

---

## Thẻ feedback

### FB-R4-SEC-OPS-RB-01
- Mức độ: Major
- Vị trí: runbook mục 3, K2 + K3 (dòng 224–254); `SEC-on-PR29-pn-01.md` mục 6
- Vấn đề: K3 chỉ kiểm 2 trigger. Ý "`ottimo_app` chỉ có SELECT" của ★2-bis đang dựa vào thẻ PN01-01 (đưa vào CI), nhưng thẻ này đã dời sang v1.0.3. Vì vậy hiện không có bằng chứng nào, cả trên CI lẫn production, rằng app không INSERT/UPDATE/DELETE được bảng thông báo. Trigger không chặn INSERT.
- Vì sao quan trọng: ★2 là cổng pháp lý cho mức C (khách đồng ý với văn bản nào). Nếu `ottimo_app` lỡ có quyền INSERT, một dòng phiên bản giả có thể làm lệch phép so `published_at`. SEC chỉ ghi "★2-bis đã thay bằng 0090" khi đủ cả hai ý.
- Đề xuất sửa: ORC thêm vào **cùng heredoc K3** (READ ONLY, sau dòng `simulation_guard`) câu sau:
  `SELECT has_table_privilege('ottimo_app','public.privacy_notice_version','SELECT'), has_table_privilege('ottimo_app','public.privacy_notice_version','INSERT'), has_table_privilege('ottimo_app','public.privacy_notice_version','UPDATE'), has_table_privilege('ottimo_app','public.privacy_notice_version','DELETE'), has_table_privilege('ottimo_app','public.privacy_notice_version','TRUNCATE'), pg_has_role('ottimo_app','ottimo_owner','MEMBER');`
  **Đúng là:** `t|f|f|f|f|f`. Sai thì dừng, báo SEC + OPS, không SQL tay, không quay lui (theo ĐK8: lỗi ở (5) thì không quay lui). OPS bổ sung câu này vào runbook (và R6) ở lượt sửa. Phần CI vẫn là PN01-01 ở v1.0.3.
- Trạng thái: Open

### FB-R4-SEC-OPS-RB-02
- Mức độ: Major
- Vị trí: runbook K8 (dòng 314–327), bảng mục 2 dòng 83, mục 6
- Vấn đề: K8 ghi "Khuyến nghị, QC quyết có bắt buộc không" và chỉ có ca yêu cầu thường (202). QC đã chốt ĐK8 (7) là **bắt buộc trong ngày**, gồm cả ca CCCD giả → 422 `ID_NUMBER_DETECTED`, không tạo dòng. Runbook cũng chưa có cách đếm để chứng minh ca 422 không để lại dữ liệu.
- Vì sao quan trọng: xem mục 4. Đây là lần đầu bộ dò PR #24 chạy với form thật, mà form production đang mở cho khách.
- Đề xuất sửa (ORC + INV làm theo thứ tự, mỗi số tự kiểm):
  1. INV ghi giờ T **trước cả hai lượt gửi**. Dùng cửa sổ ẩn danh để trình duyệt không lưu lịch sử form.
  2. **Ca 422 trước.** Tên `TEST OTTIMO`, kênh Email `info@ottimo.vn`, không SĐT. Ghi chú: `Test only, please ignore. ID 099000000000`.
     - Dùng số `099000000000`, **không** dùng `079203012345` hay `079123456789`. Hai số này đúng cấu trúc CCCD thật (mã tỉnh 079, mã giới tính/thế kỷ, năm sinh), nên có thể trùng số của một người thật. Mã tỉnh 099 không được cấp (mã tỉnh chỉ tới 096). SEC đã chạy `sensitiveNumberKind('Test only, please ignore. ID 099000000000')` cục bộ: ra `id`. Câu không có số ra `null`.
     - Đúng là: form báo lỗi ở ô ghi chú (câu PA1 của CPY), **không** có trang cảm ơn, không có mã REQ, phòng Chat không có tin mới.
  3. **Ca 202.** Xóa ghi chú (hoặc ghi `Test only, please ignore.`), gửi lại. Đúng là: trang cảm ơn có `REQ-…`, tin mức A tới phòng.
  4. INV xóa yêu cầu trên Desk theo WR8.
  5. ORC chạy `us155-smoke-counts.sh --ref REQ-… --since <T>+07:00` → `RESULT: OK – 14/14`. Ca 422 dùng cùng tên `TEST OTTIMO`, nên nếu nó lỡ tạo dòng, ca 1 hoặc ca 14 sẽ `FAIL`. Không cần lệnh đếm mới.
  6. Không dán số giả, ảnh form hay dòng log vào repo. Chỉ ghi vào decision-log: "422 đạt / 202 REQ-… / RESULT 14/14".
  - **Nếu ca 422 ra trang cảm ơn** (bộ dò không chặn): ghi lại mã REQ thứ hai, xóa theo WR8, chạy lệnh đếm cho **cả hai** mã, rồi báo SEC + BE ngay. Không đặt mức B/C. SEC + BE quyết trong ngày: hotfix, hoặc quay lui về v1.0.1, vì bộ dò cũ vẫn bắt số 12 chữ số liền.
  - **Nếu ca 202 bị chặn:** làm theo quy tắc QC ĐK8 (quay lui, mục 5).
  - OPS sửa K8 thành bắt buộc trong ngày, kèm các bước trên, ở lượt sửa runbook.
- Trạng thái: Open

### FB-R4-SEC-OPS-RB-03
- Mức độ: Minor
- Vị trí: runbook 1.3 (dòng 67–70), mục 5 R7 (dòng 443–447), P3
- Vấn đề: Phần hệ quả của quay lui chỉ kể các tính năng nghiệp vụ bị mất, chưa kể biện pháp bảo vệ bị mất: (1) form trở về bộ dò số nhạy cảm của v1.0.1 (mất bản sửa BUG-R3-058 và các mẫu giấy tờ KO/ZH/RU của PR #24); (2) bản sao lưu P3 chụp trước 0090. Restore từ bản này sẽ không có trigger PN-01, và ★2-bis sẽ áp lại.
- Vì sao quan trọng: người quyết quay lui (ORC/INV) cần biết mình đánh đổi cả phần bảo vệ dữ liệu, không chỉ tính năng. Người restore sau này cũng cần biết bản sao lưu nào chưa có 0090.
- Đề xuất sửa: R7 thêm ý: "Form website dùng lại bộ dò v1.0.1. Giữ Chat ở mức A, không đặt B/C cho tới khi lên lại bản có PR #24." Mục 1.3 hoặc P3 thêm ý: "Bản sao lưu P3 ở mức 65 migration (không có trigger 0090). Nếu restore từ bản này, phải deploy lại cho đủ 67 và chạy lại K3 (cùng câu của thẻ 01) trước khi coi ★2-bis còn được thay."
- Trạng thái: Open

### FB-R4-SEC-OPS-RB-04
- Mức độ: Minor
- Vị trí: runbook mục 6 hoặc mục 2; `product/infra/server/README.md` (lượt làm mới gói ở `landing-v1.2.0`)
- Vấn đề: ĐK3 (d) và SEC PN-01 mục 6 yêu cầu một **dòng thường trực** "không chạy UPDATE/DELETE tay trên `privacy_notice_version`". Runbook mới có các câu chung "không SQL tay trên production" (1.3, mục 5) và "Không sửa gì bằng SQL" (K3). Chưa có câu nêu tên bảng, cũng chưa nói rằng DDL (tắt hay xóa trigger) thì chủ bảng vẫn làm được.
- Vì sao quan trọng: trigger chỉ chặn DML. Người vận hành sau đọc README, không đọc runbook của một đợt. Câu nêu rõ tên bảng giúp tránh việc "sửa nhanh" một dòng thông báo, hay tắt trigger để sửa.
- Đề xuất sửa: thêm câu "Thường trực: không UPDATE/DELETE/TRUNCATE và không ALTER/DROP TRIGGER trên `privacy_notice_version`. Đăng bản mới chỉ qua `publish-privacy-notice.sh`." vào mục 6 của runbook, và vào README máy chủ ở lượt làm mới gói kế tiếp.
- Trạng thái: Open

### FB-R4-SEC-OPS-RB-05
- Mức độ: Suggestion
- Vị trí: mục 5 R6, lệnh worker (dòng 438)
- Vấn đề: R6 **in** cả các dòng `job failed` (cắt 90 ký tự), còn K4 và K7 chỉ **đếm**. Dòng lỗi job có thể chứa phần đầu thông điệp lỗi. Thông điệp đã qua `redactText`, nhưng vẫn khác nguyên tắc "chỉ đếm, không dán log" của K7.
- Vì sao quan trọng: lúc có sự cố, người ta dễ chép nguyên khối kết quả vào decision-log hoặc chat.
- Đề xuất sửa: dùng lại đúng khuôn K4 (in `chat: o|chat config|chat detail level|worker started`, còn `JOB_FAILED=<số>` thì chỉ đếm).
- Trạng thái: Open

---

## Điểm làm tốt

1. Tag đặt ở `e5fffe05`, không ở đầu `main`, kèm kiểm digest ở P5 và K1. Image lên production chính là image đã smoke trên staging, và nếu digest lệch thì dừng, báo SEC.
2. Mọi lệnh SQL trên production tự chứng minh là READ ONLY: dòng đầu ra `on`. Lệnh đếm khói không in cột nào. Đây đúng là chuẩn SEC muốn giữ.
3. Phần quay lui rõ và an toàn: có tag tường minh, có `MA THOAT`, cấm `rollback.sh` không tham số (kèm lý do theo từng trạng thái của `previous_tag`), không restore, không SQL tay, và giữ trigger 0090 có chủ đích.
