# ARC duyệt PR #23 – OPS v1.0.1 (sau gộp): ops-check `email_dead` + `cmd_failed`, sao lưu `privacy-notice.log`, `deploy-landing.sh` CWD-01, README mục 13, tệp lệnh INV

- PR: anhvh93-tech/ottimo-hotel-app-public#23, nhánh `ops/v1.0.1-ops`. Gồm 3 commit: `77a82cc3` (email_dead, rebase), `e730e843` (sản xuất), `88119369` (sửa theo SEC). Đã gộp vào `main` ở `755cad16`.
- So sánh: `main` hiện tại (`a20681b3`) không đổi script hạ tầng nào so với `88119369`, ngoài `init-secrets.sh` của PR #16. Tệp lệnh INV trên `main` trùng với `88119369`.
- Người duyệt: ARC. Round 4, bước **Review**, đây là review sau gộp. Ngày 01/11/2026. Đây là điều kiện **ĐK3** của QC `rounds/round-04/qc/v1.0.1-gate.md`.
- Thiết kế đối chiếu: `rounds/round-03/reviews/ARC-on-OPS-cwd-fb01.md` (CWD-01…04 và mục 5 về gộp `ops-check-no-recipient`), `rounds/round-04/plan-v1.0.1.md` (T11, T13, T14). Đọc kèm `SEC-on-PR23-ops-v1.0.1.md`, cả lượt 1 và lượt 2.
- Cách review:
  - Đọc diff `755cad16^1..755cad16`, gồm 4 script, 3 test, CI và README mục 7, 12.3, 13. Đọc tệp lệnh INV, chỉ phần kỹ thuật, vì SEC đã soát phần bí mật.
  - Đối chiếu câu SQL của `email_dead` với `src/jobs/email-dispatch.ts`: `topic='staff.email'`, `status='dead'`, `last_error='NO_RECIPIENT'` khớp đúng chỗ worker ghi (dòng 223 và 301).
  - Chạy lại toàn bộ test trên Mac, có Docker Desktop:
    - `test-ops-check.sh` 31/31;
    - `ops-check-cwd.test.sh` 7/7;
    - `deploy-landing-privacy.test.sh` 13/13;
    - `backup-privacy-log.test.sh` 5/5, chạy trong `ubuntu:24.04`.
  - CI `main` @ `755cad16` (run 41324333400): mọi job kiểm đều xanh.
  - Không sửa mã, không commit, không đăng lên PR.

## Kết luận: **DUYỆT** – không có Blocker, không có Major. ĐK3 đạt.

Phần mã làm đúng thiết kế CWD-01, CWD-02 (bước 1 và 2), CWD-03 và CWD-04 mục 1. Sửa `coproc`/`PSQL_PID` đúng nguyên nhân. Script mới không làm nặng thêm rủi ro nào của v1.0.1:
- `deploy-landing.sh` chặt hơn trước, nhưng chỉ khi proxy form đang mở;
- `backup.sh` báo lỗi to: thiếu log thì không lỗi, đọc log hỏng thì `die`, `backup.last_ok` không cập nhật và `ops-check backup` báo FAIL;
- `ops-check.sh` không còn đưa nguyên văn lỗi ra ngoài.

Có 4 thẻ **Minor** và 3 **Suggestion**. Không thẻ nào chặn Phần B. Thẻ 03 gắn với PR #24 (BE-D) và phải xong **trong chính PR #24**.

ARC vẫn giữ khuyến nghị của QC ĐK4 (cách a): chạy `backup.sh` và `ops-check.sh` mới trên staging trước B5. Lý do: các script này chưa chạy trên máy thật nào. Đây là việc vận hành, không phải lỗi mã.

Xác nhận cho phương án thay thế của QC (tag trên `69326ccf`, không có PR #23): `deploy-landing.sh --check-only` bản PR #18 in **cùng** dòng `privacy: en … (same bytes as published) vi …` và `CHECK ONLY: … nothing switched or recorded`. Diff PR #23 không đổi hai dòng này. Bước B9 vì vậy vẫn đúng. Bản cũ chỉ thiếu WARNING mất log (CWD-02).

## 1. Đối chiếu thiết kế CWD-01…04

| Thẻ | Yêu cầu (ARC 31/10) | Cài đặt | Kết quả |
|---|---|---|---|
| CWD-01 | Khi `LANDING_PUBLIC_API=on`: nhánh "image không có 2 trang" (`rc=4`) và nhánh "không đúng 1 version" phải **FAIL**, không đổi container. Proxy tắt thì giữ ghi chú hoặc WARNING. Cần 2 ca test | `proxy_on` đọc từ `.env` ngay trong `privacy_check`. Cả hai nhánh `return 1` kèm `FAIL: … – nothing switched`. Proxy tắt thì giữ hành vi cũ. Test 6, 6c (on → từ chối) và 6b, 6d (off → qua) | **Done**. Thêm ca 2 version (6c), chặt hơn yêu cầu |
| CWD-02 bước 1 | `backup.sh` thêm `state/privacy-notice.log` vào gói mã hóa; `restore-drill.sh` kiểm tệp có trong gói | `privacy-notice-<stamp>.log.age` đi qua đúng `encrypt_to` và `publish` chung, cùng `stamp` với `db-*`. Thời gian giữ như `db-*`. `restore-drill` giải mã, kiểm checksum rồi so version `rc=0` với `privacy_notice_version` | **Done**, có thẻ 01 (lỗi đọc DB bị nuốt, chưa có test) |
| CWD-02 bước 2 | Log **không tồn tại** mà proxy mở thì in WARNING riêng, khác "not published yet" | `[ ! -s log ]` (thiếu hoặc rỗng) và `proxy_on` thì in WARNING riêng, nêu cách khôi phục từ `privacy-notice-<stamp>.log.age`. Test 9, 9b | **Done** |
| CWD-02 bước 3 | (Tùy chọn) đọc DB chỉ đọc khi version chưa có trong log | Không làm | Chấp nhận. Tùy chọn, vì `restore-drill` đã bắt được log lệch DB |
| CWD-03 | Một hàm chung `cmd_failed` cho compose và psql; thêm "database unreachable" và "query error"; `j16` và `email_dead` dùng hàm này; thêm ca `.env` hỏng cho `j16` | 7 loại cố định, thứ tự đúng: lỗi socket psql đứng trước "no such file". `compose_failed` bọc `cmd_failed`. Ca 4c (`.env` hỏng, cả `j16` lẫn `email_dead`), cùng các ca `db down`, `postgres stopped` và `query error` trong `test-ops-check.sh` | **Done**. Thêm S1, S3 |
| CWD-04 mục 1 | `mktemp` riêng cho mỗi lượt, 0600, xóa bằng `trap EXIT` | `cmd-stderr.XXXXXX` trong `state/ops-check`. Có trap EXIT, TERM, INT. Tệp sót của lượt bị `SIGKILL` bị xóa sau 60 phút. Tệp chung `compose.stderr` cũ bị xóa | **Done**, gồm cả SEC 06 |
| CWD-04 mục 2, 3 | `docker run` đọc trang: `--cap-drop ALL --security-opt no-new-privileges --read-only --user 65534`; test bỏ qua khi chạy bằng root phải in `SKIP` | Chưa làm, PR không nhắc tới | Thẻ 04 (Minor, việc giấy tờ + 1 dòng) |
| Mục 5 (gộp nhánh `ops-check-no-recipient`) | README mục 7: giữ cả hai dòng; dòng "Kiểm tra 30 phút/lần" thêm `email_dead` | Đúng như yêu cầu (README dòng 100–101) | **Done**, có thẻ 02 về chữ "v1.0.1" |

## 2. Điểm kiểm theo hạng mục

### 2.1 `ops-check.sh` – Đạt
- Câu `email_dead` chỉ chứa `count(*)` và không đọc `payload`. `EMAIL_DEAD_HOURS` được kiểm `^[0-9]+$` trước khi nội suy vào `interval`.
- Công tắc `EMAIL_NO_RECIPIENT_ALERT` đọc `.env` trước, rồi tới biến môi trường. Chỉ nhận giá trị `0` hoặc `1`, sai thì FAIL.
- Lượt đầu tiên của kiểm mới ở trạng thái OK sẽ không gửi webhook, vì `prev` rỗng. Thêm kiểm vào timer vì vậy không sinh tin rác.
- `2>"$cmd_err"` ghi đè tệp ở mỗi lệnh. `cmd_failed` được gọi ngay sau lệnh lỗi, trước `notify`, nên không đọc nhầm lỗi của kiểm khác trong cùng lượt.
- `trap 'exit 143' TERM` hợp với unit systemd: `KillMode` mặc định giết cả cgroup, tiến trình con chết, bash chạy trap rồi xóa tệp. Đã có test.

### 2.2 `backup.sh` – Đạt
- Sửa `coproc` đúng nguyên nhân. Bash bỏ `PSQL_PID` và `PSQL[]` khi thu hồi coprocess đã thoát, nên phải lưu pid ngay sau `coproc`. Ca 4 tái hiện được, kèm SEC S1.
- Thứ tự an toàn: log được chép **sau** `pg_dump`, nên tập version trong log luôn ⊇ tập version trong dump. Hướng lệch duy nhất có thể xảy ra (log có, DB không) là hướng **chặt hơn** cho `deploy-landing.sh`.
- Không có khóa giữa `backup.sh` và `publish-privacy-notice.sh`. Nếu đọc trúng lúc đang ghi, dòng cuối có thể bị cụt, nhưng awk chỉ tính dòng kết thúc bằng `rc=0`, nên vô hại.
- Chủ tệp đúng: cả `publish-privacy-notice.sh` (README 12.3 bước 6) và timer backup đều chạy bằng `ottimo`. Không có trường hợp root tạo log mà `ottimo` không đọc được.

### 2.3 `restore-drill.sh` – Đạt, có thẻ 01
- Kiểm checksum trước khi giải mã, cùng mẫu với `db-*`. Checksum lệch thì drill dừng (exit 1). Đây là lỗi hỏng bộ sao lưu, nên dừng là hợp lý.
- Chỉ so một chiều, "DB có mà log không có". Đây đúng là chiều nguy hiểm: chiều này làm `deploy-landing.sh` cho qua những byte trang khác cho cùng một version.

### 2.4 `deploy-landing.sh` – Đạt
- Chỉ đóng khi proxy đang mở, nên quay lui (c) của README 12.3 không bị chặn.
- Đường mở lại proxy (đặt `on` rồi chạy `deploy-landing.sh`) đi qua chính bước kiểm này với `proxy_on=1`. Vẫn khớp lập luận ARC 31/10 mục 2(b).
- B9 của INV không có `--digest`, nhưng vẫn đúng. Script lấy digest từ `state/digests/landing-<tag>`, tệp này được ghi ở lượt deploy landing trước (dòng 82, 209). Ở production, thiếu tệp này thì FAIL rõ ràng, không cho qua âm thầm.

### 2.5 README mục 13 và tệp lệnh INV (phần kỹ thuật) – Đạt
- 13.1 nói đúng giới hạn của CI: `deploy-from-ci.sh` không chép bundle.
- Cờ `rsync` ở B5 giống `bootstrap-vps.sh:203` và thêm `--checksum`. `--delete-excluded` không đụng `.env`, vì `.env` nằm ở `$OTTIMO_HOME/.env`, ngoài `infra/`.
- 13.4 dùng `up -d --no-deps worker`, không dùng `restart`. Đúng, vì compose chỉ đọc lại `.env` khi tạo lại container.
- Q2/Q3 có kiểm mẫu đường dẫn và kiểm `dc` + compose của bản cũ, rồi đòi gõ `YES` trước `--delete`. Đủ điều kiện ARC muốn cho một lệnh quay lui do người không chuyên chạy.
- B12 "mọi dòng `ok`" vẫn đúng khi production còn thư `NO_RECIPIENT`, vì kiểm chưa được bật nên chỉ báo số.

## 3. Thẻ feedback

### FB-R4-ARC-OPS-PR23-01
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/restore-drill.sh` bước 7. Dòng `db_pn=$(docker exec … psql … -c "SELECT DISTINCT version FROM privacy_notice_version …" 2>/dev/null || true)`.
- Vấn đề: lỗi truy vấn bị nuốt, `db_pn` thành rỗng. Biên bản khi đó **khẳng định sai**:
  - có log thì in `– khớp DB`, vì `comm` không thấy version nào chỉ có ở DB;
  - không có log thì in `không có (DB chưa có version thông báo nào)`.

  Đây là một dòng trong biên bản diễn tập mà OPS dán vào report. Dòng đó khẳng định dữ liệu khớp mà thực ra chưa được kiểm. Bước 7 cũng chưa có test nào: CWD-02 bước 1 có test cho `backup.sh`, còn `restore-drill.sh` thì không.
- Vì sao quan trọng: diễn tập khôi phục là nơi duy nhất kiểm "log ⊇ DB" sau sự cố. Kết quả "khớp" giả sẽ che đúng tình huống CWD-02 muốn bắt: DB có version mà log không có, nên `deploy-landing.sh` cho qua byte trang khác.
- Đề xuất sửa:
  1. `if ! db_pn=$(… 2>/dev/null); then pn_report="KHÔNG ĐỌC ĐƯỢC privacy_notice_version – không đối chiếu được"; …`. Có thể thêm `-v ON_ERROR_STOP=1` cho chắc.
  2. Tách phần so sánh (awk + `comm`) thành một hàm nhỏ. Thêm 3 ca vào `backup-privacy-log.test.sh`, dùng stub `docker exec`: khớp; DB có version lạ; truy vấn lỗi.

  Hạn: trước lượt diễn tập khôi phục đầu tiên dùng bộ sao lưu v1.0.1. Không chặn Phần B.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-02
- Mức độ: Minor
- Vị trí:
  - `product/infra/server/bin/ops-check.sh` dòng 22–23: "until users can have an e-mail (v1.0.1) … set EMAIL_NO_RECIPIENT_ALERT=1 in .env after v1.0.1";
  - `product/infra/server/README.md` dòng 101: "Tới v1.0.1 (người dùng có email) chỉ báo số".
- Vấn đề: hai chỗ này ghi mốc bật cảnh báo là **v1.0.1**. README 13.8 và plan v1.0.1 lại ghi BUG-R3-032 nằm ở **đợt 3 (`v1.0.3`)**. Tag sắp gắn chính là `v1.0.1`, nên người vận hành đọc mục 7 hoặc đầu script có thể bật `EMAIL_NO_RECIPIENT_ALERT=1` ngay sau Release, khi người dùng chưa thể có email.
- Vì sao quan trọng: bật sớm thì `email_dead` sẽ FAIL kéo dài, nhắc lại mỗi 6 giờ qua webhook, cộng với `/fail` của heartbeat. Đây là cảnh báo giả, đúng loại sự cố 30/10 mà PR #18 vừa sửa, và làm người trực quen bỏ qua cảnh báo.
- Đề xuất sửa: thống nhất cả 3 chỗ theo câu của 13.8: "bật khi BUG-R3-032 đã lên production (đợt 3) **và** OWN/MGR đã nhập email". Thông báo report-only trong script đã ghi `BUG-R3-032`, không cần đổi.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-03
- Mức độ: Minor. Việc kèm theo PR #24 (BE-D). Phải xong **trong PR #24** trước khi gộp.
- Vị trí:
  - `product/infra/server/README.md` 13.2 dòng 314: "Dòng báo mức có dạng `{"level":"A","msg":"chat detail level"}` … lỗi nhỏ của BE";
  - 13.4 bước 1 và bước 5 ("phải thấy mức mới");
  - `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md` A11 (dòng 141) và B11 (dòng 309).
- Vấn đề: PR #24 (`80a73367`) thêm `shared/log-line.ts`. Từ đó `level` và `msg` không bị trường phụ ghi đè, và mức tin nằm ở khóa `detailLevel`. Dòng log mới là `{"level":"info","msg":"chat detail level","detailLevel":"A"}`.
  - Lệnh `grep '"msg":"chat detail level"'` và `grep "\"msg\":\"chat"` vẫn khớp.
  - Phần "**Đúng là**" và câu giải thích ở 13.2 sẽ sai. 13.4 bước 5 cũng sai: mức mới nằm ở `"detailLevel":"C"`, không ở `"level"`.
  - Quy trình A → C (SEC ★3) chỉ chạy **sau** đợt 2, tức là sau PR #24. Vì vậy README 13.4 lúc đó chắc chắn gặp dạng mới.
  - Tệp lệnh INV v1.0.1 hiện đúng, vì tag `v1.0.1` chưa có PR #24.
- Vì sao quan trọng: INV và ORC so dòng log với tài liệu để ghi decision-log khi đổi mức. Dạng không khớp sẽ gây báo lỗi giả, hoặc ghi sai mức vào decision-log.
- Đề xuất sửa: PR #24 sửa luôn README 13.2 và 13.4. Cụ thể: dòng mẫu đổi thành `{"level":"info","msg":"chat detail level","detailLevel":"A"}`; bỏ câu "lỗi nhỏ của BE"; 13.4 bước 5 ghi "phải thấy `"detailLevel":"C"`". Riêng tệp lệnh INV: thêm một ghi chú ở A11/B11, "từ v1.0.2 dòng thứ hai là `…"detailLevel":"A"}`". Hoặc làm tệp lệnh v1.0.2 riêng, nếu đợt 2 có tệp lệnh INV mới. OPS hoặc BE làm, SEC đọc lại cùng PR #24.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-04
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/deploy-landing.sh` dòng 106 (`docker run --rm --pull never --network none --entrypoint sh "$ref" …`); `product/infra/server/test/ops-check-cwd.test.sh` dòng 17; thư mục `rounds/round-0{3,4}/responses/`.
- Vấn đề:
  - (a) CWD-04 mục 2 (thêm cờ hạn quyền cho `docker run` đọc trang) và mục 3 (test chạy bằng root phải in `SKIP` rõ ràng) **chưa làm**. Mô tả PR cũng không nhắc tới hai mục này.
  - (b) Không có tệp phản hồi nào của OPS cho CWD-01…04 (protocol mục 7). Các thẻ này vì vậy vẫn ghi `Open` trong `ARC-on-OPS-cwd-fb01.md`.
- Vì sao quan trọng: (a) là phòng thủ nhiều lớp không tốn gì, vì image đã qua kiểm digest. Rủi ro thấp. (b) thì QC và ORC không biết thẻ nào đã đóng.
- Đề xuất sửa:
  - Thêm `--cap-drop ALL --security-opt no-new-privileges --read-only --user 65534` vào lệnh `docker run`. `tar -cf -` ghi ra stdout nên chạy được với `--read-only`. Test 13 ca sẽ xác nhận.
  - Dòng `exit 0` khi chạy bằng root đổi thành `echo "SKIP: …"; exit 0`.
  - Ghi `rounds/round-04/responses/OPS-responses.md`: CWD-01/02/03 = Done (dẫn PR #23), CWD-04 mục 1 = Done, mục 2–3 = Done/Deferred kèm lý do, và trả lời thẻ 01–04 của review này.
  - Có thể gộp vào PR sửa thẻ 01–02.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-S1
- Mức độ: Suggestion
- Vị trí: `ops-check.sh` `cmd_failed`, nhánh đầu `grep -qi 'permission denied'`.
- Vấn đề: lỗi quyền của psql (`ERROR:  permission denied for table …`) sẽ rơi vào nhánh đầu và báo `permission denied (current directory or stack files)`, chỉ sai hướng điều tra. Hiện khó xảy ra, vì `psql_admin` chạy bằng `POSTGRES_USER` là superuser. Nhưng sau này có thể có kiểm chạy bằng vai thấp hơn.
- Đề xuất: đặt `grep -qE 'ERROR:.*permission denied'` → `query error (permission)` trước nhánh đầu. Thêm 1 ca test.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-S2
- Mức độ: Suggestion
- Vị trí: README 13.8: "Muốn xem lỗi thật: chạy tay `… ops-check.sh j16`, rồi `…/bin/dc exec -T postgres psql …`".
- Vấn đề: chạy tay `ops-check.sh` cũng chỉ in tên loại lỗi, vì stderr vẫn vào tệp tạm. Bước đầu vì vậy không giúp thấy lỗi thật.
- Đề xuất: ghi thẳng 2 lệnh xem lỗi thật trên terminal:
  - `cd / && sudo -u ottimo …/bin/dc ps` (lỗi compose hoặc `.env`);
  - `cd / && sudo -u ottimo …/bin/dc exec -T postgres sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select 1"'` (lỗi DB).

  Dặn thêm: không chụp màn hình gửi đi nếu lỗi trích một dòng `.env`.
- Trạng thái: Open

### FB-R4-ARC-OPS-PR23-S3
- Mức độ: Suggestion
- Vị trí: `ops-check.sh` `cmd_failed`. Ca 4c và `broken .env -> other error` của `test-ops-check.sh`.
- Vấn đề:
  - `.env` hỏng cú pháp chính là trường hợp CWD-03 nhắm tới, nhưng hiện rơi vào `other error – run it by hand`. Có thể nhận ra lỗi này mà vẫn chỉ in tên loại.
  - (Lỗi có sẵn, ghi để biết) Trong `backup.sh`, nếu psql chết ngay mà bash chưa kịp thu hồi tiến trình, `printf … >&"$psql_in"` có thể làm shell chết vì `SIGPIPE`, không có dòng `FAIL:`. Lỗi vẫn lộ ra qua `ops-check backup` sau 26 giờ, chỉ là thiếu lý do.
- Đề xuất:
  - Thêm loại `stack .env invalid`, khớp mẫu thông báo của compose (`failed to read .*\.env|\.env: line [0-9]+`). Chỉ in tên loại như mọi loại khác.
  - Trong `backup.sh`, thêm `trap 'log "FAIL: line $LINENO"' ERR` (hoặc `trap '' PIPE` để `printf` trả lỗi), để mọi đường dừng đều có một dòng `FAIL:` trong journal.
- Trạng thái: Open

## 4. Trạng thái thẻ ARC cũ

| ID | Trạng thái ARC xác nhận | Ghi chú |
|---|---|---|
| FB-R3-ARC-OPS-CWD-01 | Done | `deploy-landing.sh` đóng khi proxy mở; test 6, 6c |
| FB-R3-ARC-OPS-CWD-02 | Done | Bước 1 và 2 xong. Bước 3 (tùy chọn) không làm, ARC chấp nhận. Còn thẻ 01 ở trên cho `restore-drill` |
| FB-R3-ARC-OPS-CWD-03 | Done | `cmd_failed` 7 loại cho `j16`, `email_dead`, `containers`, `http5xx`; ca 4c |
| FB-R3-ARC-OPS-CWD-04 | Mục 1 Done; mục 2–3 chuyển sang thẻ 04 ở trên | – |

## 5. Đề xuất ghi decision-log (ORC ghi khi commit)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 01/11/2026 | 4 | ARC duyệt PR #23 sau gộp (`755cad16`), **QC ĐK3 đạt**. CWD-01/02/03 và CWD-04 mục 1 = Done. Còn 4 Minor: 01 `restore-drill` nuốt lỗi DB; 02 mốc bật `EMAIL_NO_RECIPIENT_ALERT` ghi "v1.0.1" ở mục 7 và đầu script; 03 dạng log `detailLevel` phải sửa README 13.2/13.4 **trong PR #24**; 04 CWD-04 mục 2–3 + tệp phản hồi OPS. Không chặn Phần B | ARC | Quyền ARC (review kỹ thuật). Mã đúng thiết kế 31/10. Test chạy lại 31 + 7 + 13 + 5 ca xanh. CI `755cad16` xanh |

## 6. Điểm làm tốt

- Test đi trước bản sửa. Bài test stub mới của `backup.sh` tìm ra lỗi `PSQL_PID` thật (race khi psql thoát), và OPS sửa đúng gốc, không chỉ tắt `set -u`.
- Phân loại lỗi đặt ở **một** chỗ (`cmd_failed`), có ghi lý do cho thứ tự kiểm (lỗi socket psql trước "no such file"). Bài test chủ động nhét `token=secret-token` vào lỗi, rồi kiểm cả stdout lẫn tệp trạng thái mà webhook đọc.
- Sao lưu `privacy-notice.log` dùng lại đúng đường `encrypt_to`/`publish`/giữ của bộ sao lưu chung, không mở đường riêng. Log được chép sau `pg_dump`, nên mọi độ lệch đều nghiêng về phía an toàn.
