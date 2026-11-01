# SEC duyệt PR #23 – OPS v1.0.1 (ops-check `email_dead` + phân loại lỗi, sao lưu `privacy-notice.log`, deploy-landing đóng khi proxy mở, README mục 13, lệnh INV)

- PR: anhvh93-tech/ottimo-hotel-app-public#23 · nhánh `ops/v1.0.1-ops` · head `e730e843` · base `main`
- Thay đổi: 11 file (+878/-39): `ops-check.sh`, `backup.sh`, `restore-drill.sh`, `deploy-landing.sh`, 3 test cũ/mới, `ci.yml`, README `infra/server` mục 7, 12.3, 13, `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md`
- Đọc kèm: `init-secrets.sh` và `docker-compose.prod.yml` ở nhánh PR #16 (`be/gchat-booking-notify`), `init-secrets.sh` trên `main`, `bootstrap-vps.sh`, `SEC-on-BE-gchat-notify.md` (bảng ★), `ARC-on-OPS-cwd-fb01.md`
- Người duyệt: SEC (kèm ý kiến hạ tầng nhỏ – "ý kiến SEC thay ARC" ở chỗ có ghi) · Ngày: 01/11/2026 · Round 4, bước Review

## Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

Phần mã (4 script + test + CI) đạt yêu cầu bảo mật, không có Blocker. Hai thẻ **Major** nằm trong tệp lệnh INV và chỉ cần sửa tài liệu:
- 01: thiếu chặn "đừng dán URL webhook khi không thấy dấu nhắc `Webhook URL:`";
- 02: thiếu khối lệnh quay lui bundle cho INV.

Điều kiện:
1. Sửa xong thẻ 01 **trước khi INV làm A9 hoặc B8**.
2. Sửa xong thẻ 02 **trước khi INV làm phần B**.
3. Chỉ gộp khi job CI `docker images build · E2E smoke` xanh. Lúc review job này còn `pending`; 7 job còn lại xanh, gồm `gitleaks` và `infra scripts (shellcheck)`.

Hai thẻ Major không chặn gộp phần mã, vì phần A (staging, Chat tắt) không có bước dán webhook bắt buộc.

## Bằng chứng theo hạng mục được giao

### 1. Không gửi hay in bí mật, không gửi nguyên văn lỗi – Đạt
- `ops-check.sh`: `j16` và `email_dead` không còn `2>&1` hay `head -n 1 <<<"$out"`. stderr đi vào tệp riêng, kết quả chỉ là 1 trong 7 loại cố định (`cmd_failed`). `notify` chỉ nhận chuỗi cố định, số đếm và tên kiểm.
- stdout lỗi cũng không bị chuyển tiếp. Riêng `email_dead` có trả lời không phải số thì báo `unexpected answer`.
- SQL của `email_dead` chỉ `count(*)`, không đọc `payload`. `EMAIL_DEAD_HOURS` được kiểm `^[0-9]+$` trước khi nội suy vào `interval`, nên không có chèn SQL.
- Test `test-ops-check.sh`: SEC chạy lại trên macOS từ `git archive` của nhánh, kết quả **29/29**. Bài test có ca `.env` hỏng chứa `token=secret-token` và ca socket/tên bảng. Nó kiểm cả stdout lẫn tệp trạng thái `state/ops-check/<check>` (nguồn của webhook), và kiểm không còn tệp `*stderr*`.
- `backup.sh` chỉ ghi số dòng của log vào journal. `restore-drill.sh` chỉ in version và số dòng. Log `privacy-notice.log` chỉ chứa mã người chạy, tag và băm trang, không có dữ liệu khách.

### 2. Tệp tạm `mktemp` – Đạt, còn một điểm Minor (thẻ 06)
- `cmd_err=$(mktemp "$state/cmd-stderr.XXXXXX")`: quyền 0600, nằm trong `state/` (0700, chủ `ottimo`, theo `bootstrap-vps.sh:189`), xóa bằng `trap … EXIT`.
- Tệp chung `compose.stderr` của bản 30/10 bị xóa ở đầu mỗi lượt.
- Mỗi lượt có tệp riêng, nên timer và lượt chạy tay đồng thời không ghi đè nhau.
- Còn thiếu: tệp sót lại khi tiến trình bị `SIGTERM`/`SIGKILL` (thẻ 06).

### 3. Sao lưu log mã hóa đúng khóa – Đạt
- `encrypt_to` dùng `age --encrypt --recipients-file $OTTIMO_HOME/backup/recipients.txt`. Đây là cùng khóa công khai với `db-*`, `blobs-*`, `counts-*`. Script đã chặn sẵn tệp có `AGE-SECRET-KEY`.
- Tệp tạm `$tmp` nằm dưới `umask 077`. `publish` ghi checksum rồi `mv` nguyên khối, nên không có bản rõ nào rơi vào `BACKUP_DIR`.
- Thời gian giữ theo vòng lặp chung, có cả `.sha256`. Test 3 xác nhận.
- `pull-backups.sh` kéo `*.age`, nên có sẵn bản sao ngoài máy.
- `restore-drill.sh` giải mã vào `$work`. Thư mục này tạo bằng `mktemp -d` và dọn bằng `trap cleanup`. Script kiểm checksum trước khi giải mã; dù không có tệp `.sha256` thì `age` vẫn tự xác thực.
- Sửa `wait "$psql_pid"`: đúng nguyên nhân, vì bash bỏ `PSQL_PID` khi coprocess thoát. Chỉ có Suggestion S1.

### 4. Quyền tệp secret Chat (uid 1000, 0400, size 0 ở mức A) – Đạt
- Kiểm `init-secrets.sh` ở nhánh PR #16:
  - lần đầu, `put booking_request_chat_webhook "$APP_UID" ''` gọi `chown 1000:1000`, `chmod 0400` rồi `mv`, dưới `umask 077`;
  - `--set-booking-chat` có `umask 077`, ghi `.tmp`, `chown`, `chmod 0400`, rồi `mv -f`;
  - dấu nhắc dùng `read -rs`, có kiểm `[ -t 0 ]`, `set +x`, chỉ in số ký tự;
  - URL đưa vào công cụ của image qua stdin, không qua argv, và chạy với `--network none`.
- Bước A7, B7 và bước kiểm sau B8 trong tài liệu INV đúng với mã (`uid=1000 mode=400 size=0`, rồi size bằng số ký tự).
- Compose (PR #16) chỉ đưa `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE` và `BOOKING_REQUEST_CHAT_DETAIL_LEVEL: ${…:-A}` cho worker, nên mặc định là A.

### 5. Tệp lệnh INV – Đạt có điều kiện (thẻ 01, 02 Major; 03, 04, 05 Minor)
- **Không có bí mật hay IP**: SEC quét theo mẫu IPv4, `AGE-SECRET`, `token=`, `password=` và không có kết quả. Tài liệu chỉ dùng tên máy công khai `desk.ottimo.vn`, đường dẫn khóa SSH cá nhân `~/.ssh/ottimo_ops` (không phải bí mật) và hộp thư doanh nghiệp `info@ottimo.vn` cho K1 (không phải dữ liệu khách).
- **Dấu nhắc ẩn**: có. Mọi lệnh đều dùng `ssh -t`, `init-secrets.sh` dùng `read -rs`. Tài liệu đã dặn không chụp màn hình và không dán URL vào chat. Thiếu ở chỗ: tài liệu không chặn trường hợp dấu nhắc không hiện (thẻ 01).
- **Sao lưu**: có B2 (`backup.sh` trước khi làm) và bản sao bundle cũ ở A5/B5 (`cp -a` vào `/root/…-bundles/infra-<giờ>`, dưới `set -e`).
- **Quay lui**: Release lỗi thì tự trả về bản cũ. Bundle thì **không** có khối lệnh quay lui cho INV (thẻ 02).
- **Rsync**: cờ giống `bootstrap-vps.sh:203`. Bundle thuộc `root:root` và `chmod -R go-w`, nên user `ottimo` không sửa được script mà root chạy qua `sudo` (`init-secrets.sh`).
- **Không chạy `bootstrap-vps.sh`**, nên không có `ufw reset` hay `apt upgrade`.
- **Đối chiếu**: `diff -rq` sau rsync, dưới `set -e`. Có lỗi thì không in dòng "CAU HINH MOI DA VAO".
- **Làm sai thứ tự** (SEC rà từng trường hợp):
  - A10/B10 trước A5–A7/B5–B8: an toàn. Chat tắt, sửa bằng `up -d --no-deps worker`. A11 có lệnh sửa, B11 chưa có (S3).
  - B6 sinh thêm khóa khác: tài liệu đã bảo dừng trước B10. Tệp mới chỉ có hiệu lực khi deploy, nên dừng kịp là an toàn.
  - **B8 trước B5**: `init-secrets.sh` cũ trên `main` gặp `--set-booking-chat` thì in `usage:` rồi `exit 2`. Không có dấu nhắc, Terminal quay về dấu nhắc của Mac, INV dễ dán URL vào zsh (thẻ 01).
  - Bỏ B3: B4/B5 dùng lại gói staging từ `origin/main` và không có gì phát hiện (thẻ 03).
  - Chạy B5 hai lần: dòng `BAN CU GIU O` của lần sau trỏ vào bundle **mới** (thẻ 03).

### 6. README mục 13 – Đạt
- 13.4 A → B/C đủ 3 điều kiện ★ của SEC:
  - dòng decision-log của SEC "đủ điều kiện đặt C" (★1–★8, có K1 và ★2-bis);
  - **báo INV trước và INV đồng ý**;
  - ORC ghi decision-log (cũ → mới, giờ, người làm, dòng SEC căn cứ, 2 dòng log).
- Thủ tục dùng `up -d --no-deps worker`, không dùng `restart`. Hạ về A thì không cần SEC nhưng vẫn báo INV.
- Đã ghi hằng `2026-10-31` và luật "staging chỉ phòng thử". Khớp `SEC-on-BE-gchat-notify.md` ★3 và decision-log 30/10. Có thẻ Minor 05 về tệp tạm và bản sao `.env`.
- 13.5 (K1, WR8 tay): đúng SEC L2.2. Sổ xóa chỉ ghi mã, K1 không đạt thì không đăng `2026-10-31` và không đặt C.
- 13.7 (★2-bis tạm): đúng điều kiện SEC đã chấp nhận. `ottimo_app` chỉ `SELECT`, không UPDATE/DELETE tay, chụp lại sau mỗi lần deploy có migration.
- 13.1 nêu rõ CI không làm mới bundle được, đúng thiết kế `deploy-from-ci.sh` (SEC E.8).

### 7. `deploy-landing.sh` CWD-01 – Đạt
- Khi `LANDING_PUBLIC_API=on`:
  - image không có 2 trang thì `return 1`;
  - trang không in đúng 1 version thì `return 1`.
- Khi proxy tắt thì giữ hành vi cũ, nên quay lui (c) không bị chặn.
- Test 13/13 có đủ 4 tổ hợp. Hướng "đóng khi không chắc" đúng với yêu cầu đối chiếu được đồng ý của khách.
- Thiếu log khi proxy mở chỉ là WARNING (theo quyết định ARC). SEC chấp nhận, kèm thẻ 04 để WARNING không bị mất khỏi tầm nhìn.

## Thẻ feedback

### FB-R4-SEC-OPS-PR23-01
- Mức độ: **Major**
- Vị trí: `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md` bước B8 (và A9, mục "Khi cần tắt Chat ngay" bước 2)
- Vấn đề: tài liệu chỉ nói "máy dừng ở `Webhook URL:` → ⌘V". Không có câu nào bảo **đừng dán nếu không thấy đúng dấu nhắc đó**. Ba trường hợp thực tế làm dấu nhắc không hiện:
  - (a) chạy B8 trước B5: `init-secrets.sh` cũ trên `main` (dòng 38) in `usage: init-secrets.sh [--reset-email-password]` rồi `exit 2`;
  - (b) gõ sai mật khẩu `sudo` 3 lần;
  - (c) mất kết nối.

  Cả ba trường hợp đều kết thúc bằng `Connection … closed` và Terminal về dấu nhắc zsh của Mac. URL dán lúc đó (có `key` và `token`) bị zsh ghi vào `~/.zsh_history` dạng chữ thường, có thể đi theo Time Machine hoặc bản sao iCloud. Ngoài ra, `sudo` hỏi mật khẩu **trước** `Webhook URL:` và cả hai đều ẩn chữ, nên INV dễ dán URL vào ô mật khẩu sudo. Trường hợp này vô hại (sudo/PAM không ghi giá trị), nhưng gây rối.
- Vì sao quan trọng: ai có URL cũng đăng được tin vào phòng nhân viên, giả làm "Desk OTTIMO". URL lọt vào lịch sử shell là lộ bí mật ngoài máy chủ mà không ai biết.
- Đề xuất sửa (chỉ sửa tài liệu):
  1. Ở B8 và A9, thêm thứ tự: "Máy hỏi `[sudo] password` trước: gõ **mật khẩu**, chưa dán. **Chỉ** bấm ⌘V khi dòng cuối là đúng chữ `Webhook URL:`. Nếu thấy `usage:`, `Sorry`, `Connection … closed`, hoặc Terminal đã về dấu nhắc của Mac (dòng kết thúc bằng `%`), thì **không dán**: chụp màn hình gửi đội."
  2. Thêm mục "Lỡ dán URL ra ngoài dấu nhắc": coi như URL đã lộ. Làm mục "Khi cần tắt Chat ngay" bước 1 (xóa webhook, tạo webhook mới), rồi xóa dòng đó khỏi lịch sử: mở `~/.zsh_history` bằng TextEdit, xóa dòng có `chat.googleapis.com`, lưu, rồi mở Terminal mới.
  3. (Tùy chọn) Ở B8, kiểm phiên bản script trước khi chạy, ví dụ chạy lại lệnh `grep -c set-booking-chat …/opt/ottimo-prod/infra/server/bin/init-secrets.sh` và phải ra ≥ 3. Lệnh này chặn trường hợp (a) ngay từ gốc.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-02
- Mức độ: **Major**
- Vị trí: `v1.0.1-inv-commands.md` B5 ("Đội cần dòng này nếu phải quay lui"); README 13.1 dòng "Quay lui bundle"
- Vấn đề: lần này đội **không** có quyền vào máy chủ, nhưng tài liệu INV không có khối lệnh quay lui bundle. Lệnh quay lui chỉ nằm trong README (`sudo rsync -a --delete /root/ottimo-prod-bundles/infra-<giờ>/ /opt/ottimo-prod/infra/`). Nếu B7 lỗi (`dc config -q` in lỗi), hoặc timer `backup`/`ops-check` chạy bằng script mới bị hỏng, đội sẽ phải gõ lệnh qua tin nhắn lúc gấp. Lệnh có `--delete` và đường dẫn đích là `/opt/ottimo-prod/infra/`: gõ sai đường dẫn (thiếu `/` cuối nguồn, nhầm staging/prod) có thể xóa sạch bundle production.
- Vì sao quan trọng: "có bước quay lui" là điều kiện bắt buộc của một thủ tục production do người không chuyên chạy. Lệnh quay lui viết sẵn và đã thử ít rủi ro hơn lệnh soạn vội.
- Đề xuất sửa: thêm mục "Quay lui cấu hình (chỉ khi đội bảo)" cho staging và production. Lệnh nhận đúng dòng `BAN CU GIU O` và tự kiểm trước khi chạy, ví dụ:
  ```bash
  ssh -t -i ~/.ssh/ottimo_ops ottimo-admin@desk.ottimo.vn 'cd / && set -e && B="/root/ottimo-prod-bundles/infra-YYYYMMDD-HHMMSS" && sudo test -x "$B/server/bin/dc" && sudo rsync -a --delete "$B/" /opt/ottimo-prod/infra/ && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc --profile deploy config -q && echo "PRODUCTION: DA QUAY LUI CAU HINH"'
  ```
  Ghi rõ:
  - chỉ thay `YYYYMMDD-HHMMSS`;
  - quay lui **sau** khi đã Release v1.0.1 thì phải hỏi đội trước, vì worker v1.0.1 với compose cũ sẽ tắt Chat. Cần `up -d --no-deps worker` và để nguyên tệp secret.

  OPS chạy thử lệnh này trong mô phỏng ubuntu:24.04 như lệnh làm mới bundle.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-03
- Mức độ: Minor
- Vị trí: `v1.0.1-inv-commands.md` B3/B4, B5
- Vấn đề:
  - (a) B4 chỉ kiểm `grep -c set-booking-chat ≥ 3`. Nếu INV bỏ B3, hoặc B3 lỗi giữa chừng (`git archive` được nhưng `scp` hỏng), B4/B5 sẽ dùng lại gói **staging** (`origin/main`) cho production mà không ai biết. `diff -rq` chỉ so gói với máy chủ.
  - (b) Chạy B5 hai lần (ví dụ "chạy lại đúng bước đó" theo luật chung 6) thì dòng `BAN CU GIU O` của lần sau trỏ vào bundle **mới**. Quay lui bằng dòng đó không có tác dụng.
- Vì sao quan trọng: production phải chạy đúng cấu hình của tag `v1.0.1` đã duyệt, và bản sao quay lui phải là bản trước khi thay.
- Đề xuất sửa:
  - (a) B3 in thêm `shasum -a 256 /tmp/ottimo-infra.tgz`, B4 in `sha256sum ~/ottimo-infra.tgz`, và hai chuỗi phải trùng;
  - (b) B5 dặn "gửi dòng `BAN CU GIU O` của **lần chạy đầu tiên**". Hoặc lệnh B5 in thêm `ls -1d /root/ottimo-prod-bundles/infra-*` để đội chọn bản cũ nhất của ngày.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-04
- Mức độ: Minor
- Vị trí: `v1.0.1-inv-commands.md` B9 (`| tail -4`); `deploy-landing.sh` WARNING "no …/privacy-notice.log while the form proxy is on"
- Vấn đề: WARNING mất log (CWD-02) in **trước** 2 dòng `en`/`vi` và dòng `CHECK ONLY`. Lệnh `tail -4` có thể cắt mất nó, và tài liệu chỉ bảo báo khi có `FAIL`. Lượt deploy landing thật qua CI chỉ trả 1 dòng tóm tắt (SEC E.8), nên WARNING này chỉ còn trong log máy chủ. Chính README 12.3 lại yêu cầu xử lý nó "trước khi INV duyệt".
- Vì sao quan trọng: mất log mà proxy đang mở thì kiểm "cùng version, khác băm" coi mọi version là "chưa ghi". Trang thông báo đã công bố có thể bị đổi chữ mà không ai biết.
- Đề xuất sửa: B9 thay `tail -4` bằng `grep -E "WARNING|FAIL|same bytes|not published|CHECK ONLY"`, và dặn "có chữ `WARNING` hoặc `FAIL` thì gửi ảnh". (Ý kiến SEC thay ARC) Về sau, khi có `--candidate-digest` (FB-04), nên đưa WARNING này vào dòng tóm tắt CI, ví dụ `privacy=warn-nolog`, để người duyệt thấy.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-05
- Mức độ: Minor
- Vị trí: README 13.4 bước 2–3
- Vấn đề:
  - (a) `env.level.tmp` được tạo dưới umask mặc định của `sudo -u ottimo`, thường là 0644, và chứa toàn bộ `.env` (có `ALERT_WEBHOOK_URL` và các giá trị khác). Hiện tệp an toàn vì `state/` là 0700, nhưng an toàn đó phụ thuộc vào quyền thư mục cha.
  - (b) Mỗi lần đổi mức lại để thêm một bản sao `.env` (`env.before-chat-level.<giờ>`) trong `state/` mãi mãi, và không có bước dọn.
- Vì sao quan trọng: bản sao bí mật tích tụ ngoài vị trí chuẩn. Ai rà bí mật hay đổi khóa sau này dễ bỏ sót chúng.
- Đề xuất sửa: thêm `umask 077;` vào đầu `sh -c '…'`. Sau bước 5 đạt thì `rm` bản `env.before-chat-level.*` cũ hơn bản vừa tạo (giữ 1 bản để quay lui), và ghi việc này vào decision-log cùng lượt.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-06
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/ops-check.sh` dòng 50–52
- Vấn đề: `trap 'rm -f "$cmd_err"' EXIT` không chạy khi tiến trình bị `SIGKILL`, hoặc bị `SIGTERM` lúc bash đang chờ lệnh con (systemd dừng unit, máy tắt, `docker compose` treo tới timeout). Tệp `cmd-stderr.XXXXXX` chứa nguyên văn lỗi, có thể là một dòng `.env`, sẽ nằm lại trong `state/ops-check/`. Lượt sau chỉ xóa `compose.stderr`, không xóa tệp này. CWD-04 mục 1 muốn "nguyên văn không ở lại trên đĩa".
- Vì sao quan trọng: rủi ro thấp (0600, thư mục 0700), nhưng đây đúng là tình huống bài test 4b muốn loại trừ.
- Đề xuất sửa: đầu script thêm `find "$state" -maxdepth 1 -name 'cmd-stderr.*' -mmin +60 -delete 2>/dev/null || true`. Ngưỡng 60 phút để không xóa tệp của một lượt chạy tay đang song song. Có thể thêm `trap 'exit 143' TERM` để `EXIT` trap chạy khi bị dừng.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-S1
- Mức độ: Suggestion
- Vị trí: `backup.sh` dòng `psql_pid=$PSQL_PID`
- Vấn đề: nếu coprocess chết ngay (ví dụ `dc` lỗi tức thì), `PSQL_PID` có thể đã bị bỏ ở chính dòng này. Khi đó `set -u` dừng script với "unbound variable" thay vì một `die` rõ nghĩa. Backup vẫn báo lỗi đúng, chỉ là thông báo khó đọc.
- Đề xuất sửa: `psql_pid=${PSQL_PID:-}`, và `[ -n "$psql_pid" ] || die "psql did not start"`.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-S2
- Mức độ: Suggestion
- Vị trí: `v1.0.1-inv-commands.md` B8 (cuối), luật chung 4
- Vấn đề và đề xuất:
  - (a) Sau khi dán xong, URL vẫn nằm trong clipboard của Mac. Universal Clipboard còn đồng bộ clipboard sang iPhone/iPad gần đó, và trình quản lý clipboard (nếu có) giữ lại. Đề xuất thêm: "Xong B8: sao chép một chữ bất kỳ (ví dụ chữ `OK`) để xóa URL khỏi bộ nhớ tạm."
  - (b) Luật 4 bảo gõ `yes` khi lần đầu nối `desk.ottimo.vn`. OpenSSH mới in thêm "This host key is known by the following other names/addresses" nếu khóa trùng với khóa đã lưu theo IP. Đề xuất: "chỉ gõ `yes` khi thấy câu đó. Không thấy thì dừng, báo đội."
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-S3
- Mức độ: Suggestion
- Vị trí: `v1.0.1-inv-commands.md` B11
- Vấn đề: A11 có lệnh sửa khi lỡ duyệt trước khi làm mới bundle (`dc up -d --no-deps worker`), B11 thì không. Ở production, INV sẽ phải chờ đội gửi lệnh.
- Đề xuất sửa: chép khối sửa của A11 sang B11, đổi đường dẫn thành `/opt/ottimo-prod`.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR23-S4 (chuyển BE/OPS cho PR #16 – không thuộc diff này)
- Mức độ: Suggestion
- Vị trí: `init-secrets.sh` (nhánh PR #16): nhánh `--set-booking-chat` `exit 0` ở dòng ~230, **trước** đoạn in `init-secrets: created …` (dòng 251–254)
- Vấn đề: chạy `--set-booking-chat` trên máy thiếu một tệp bí mật nào đó (ví dụ B8 trước B6, hoặc compose mới có thêm secret) thì script vẫn tạo khóa mới ở các lệnh `put` phía trên, nhưng **không in ra**. Như vậy luật "production không được sinh khóa mới" ở B6 bị lách mà không ai thấy.
- Đề xuất sửa: in danh sách `created` trước `exit 0` của nhánh `--set-booking-chat`. Tốt hơn nữa: ở chế độ `--set-booking-chat`/`--reset-email-password`, khi `APP_ENV=production` và thiếu tệp khác thì từ chối sinh khóa.
- Trạng thái: Open

## Điểm làm tốt
- Phân loại lỗi một chỗ (`cmd_failed`) cho cả docker compose lẫn psql, xếp thứ tự có chủ đích (lỗi socket psql trước "no such file"). Test chủ động nhét `token=secret-token` vào lỗi `.env` để chứng minh không lọt, và kiểm luôn tệp trạng thái mà webhook đọc.
- Sao lưu `privacy-notice.log` đi qua đúng đường mã hóa và giữ của bộ sao lưu chung, không mở đường riêng. Diễn tập khôi phục đối chiếu log với DB nhưng chỉ báo, không chặn bản sao lưu cũ.
- Tài liệu INV cẩn thận: mọi lệnh có `cd /` và `ssh -t`, bản sao bundle cũ dưới `set -e`, có `diff -rq` đối chiếu, không chạy `bootstrap-vps.sh`, và nói rõ không chụp màn hình bước webhook.

---

## Lượt 2 – 88119369

- Người duyệt: SEC · 01/11/2026 · Round 4, bước Phản hồi & sửa (xác nhận bản sửa, QC v1.0.1 ĐK2)
- Đã đọc: commit sửa `88119369` (6 file). PR #23 đã gộp vào `main` bằng `755cad16`.
- Đối chiếu: `git diff 88119369 755cad16` không chạm `product/infra/server/bin/ops-check.sh`, `backup.sh`, README mục 13 phần OPS hay `v1.0.1-inv-commands.md`. Khác biệt chỉ là phần PR #16 (`init-secrets.sh`, compose, `check-compose.sh`, env example). Vì vậy bản trên `main` là đúng bản SEC đã rà.
- Test:
  - SEC chạy lại `test-ops-check.sh` từ `git archive 755cad16` trên macOS: **31/31**. Hai ca mới là tệp `cmd-stderr` cũ hơn 60 phút bị xóa và `SIGTERM` không để lại tệp.
  - `backup-privacy-log.test.sh` có ca 4 mới (psql chết ngay → `FAIL: psql did not start`, không còn "unbound variable"). Ca này cần GNU date và flock nên SEC không chạy trên Mac; dựa vào CI.
- CI PR #23 ở head `88119369`: 8/8 job xanh, gồm `docker images build · E2E smoke` (lượt 1 còn pending), `gitleaks` và `infra scripts (shellcheck)`. 3 job deploy/publish `skipping` đúng với PR.

### Trạng thái thẻ

| Thẻ | Mức | Trạng thái | Căn cứ |
|---|---|---|---|
| PR23-01 | Major | **Đóng** | Luật chung 7: URL chỉ dán ở đúng dấu nhắc `Webhook URL:`. A9 và B8 có bước **kiểm trước** `grep -c set-booking-chat` trên bundle **đang chạy**, ra `0` thì không chạy lệnh dán; bước này chặn đúng gốc trường hợp B8 trước B5. B8 nói sudo hỏi mật khẩu trước ("chưa dán URL") và liệt kê 4 dấu hiệu không được dán (`usage:`, sai mật khẩu, mất kết nối, dấu nhắc `%`). Có mục mới "Lỡ dán URL ra ngoài": **xóa webhook trước** (vô hiệu ngay), đóng cửa sổ rồi xóa dòng trong `~/.zsh_history`, `~/.zsh_sessions`, `~/.bash_history`, thay bộ nhớ tạm, báo đội mà không gửi URL. SEC đã rà lệnh dọn: dùng `sed -i ''` của macOS. Đóng cửa sổ trước nên phiên Terminal của Apple ghi xong lịch sử rồi mới dọn, và phiên mới chỉ thêm dòng mới, không ghi lại dòng đã xóa. Biện pháp chính vẫn là đổi webhook. |
| PR23-02 | Major | **Đóng** | Có mục "Quay lui cấu hình (CHỈ khi đội bảo)" Q1–Q3. Đường dẫn phải khớp mẫu `case` chặt (`/root/ottimo-<stack>-bundles/infra-2YYYYMMDD-HHMMSS`). Quên thay `YYYYMMDD-HHMMSS` thì báo `SAI DUONG DAN` và không đổi gì. Lệnh kiểm bản cũ có `server/bin/dc` và `docker-compose.prod.yml`, in đường dẫn, đòi gõ đúng `YES` rồi mới `rsync --checksum --delete`, sau đó chạy `diff -rq` và `dc config -q`. Mọi nhánh lỗi đều dừng **trước** rsync. Nếu shell đăng nhập không hỗ trợ `read -p` thì chuỗi `&&` cũng dừng trước rsync, tức hỏng theo hướng an toàn. Ghi rõ: quay lui sau Release thì phải hỏi đội; tệp secret để nguyên. README 13.1 trỏ về các khối này, "không gõ tay". |
| PR23-03 | Minor | **Đóng** | Đối chiếu 6 ký tự đầu của sha256 giữa Mac (A2/B3) và máy chủ (A4/B4), lệch thì dừng. Mức này đủ chặn lắp nhầm gói; đây là kiểm nhầm lẫn, không phải chống giả mạo. A5/B5 in `CAC BAN CU DANG CO` và ghi rõ bản quay lui là bản **cũ nhất hôm nay**. Rsync thêm `--checksum`. |
| PR23-04 | Minor | **Đóng** (phần tài liệu) | B9 đổi `tail -4` thành `grep -E "WARNING\|FAIL\|same bytes\|not published\|CHECK ONLY"`, và có `WARNING` hay `FAIL` thì gửi ảnh, đội xử lý trước lượt landing kế tiếp. Ý đưa WARNING vào dòng tóm tắt CI là đề xuất "về sau", không theo dõi ở thẻ này. |
| PR23-05 | Minor | **Đóng** | README 13.4: `umask 077;` trong `sh -c`. Bước 6 mới chỉ giữ bản `env.before-chat-level.*` mới nhất, và việc dọn được ghi vào decision-log. |
| PR23-06 | Minor | **Đóng** | `ops-check.sh`: `find … 'cmd-stderr.*' -mmin +60 -delete`, nên không đụng lượt chạy tay song song. `trap 'exit 143' TERM` và `trap 'exit 130' INT` làm `EXIT` trap chạy. systemd gửi `SIGTERM` cho cả cgroup, nên lệnh con cũng dừng và trap chạy ngay. Có 2 test mới. |
| PR23-S1 | Suggestion | **Đóng** | `${PSQL_PID:-}` và `${PSQL[i]:-}`, kèm `die "psql did not start"`. Test ca 4. |
| PR23-S2 | Suggestion | **Đóng** | Luật chung 4: chỉ gõ `yes` khi thấy "This host key is known by the following other names/addresses", không thấy thì `no` và báo đội. B8 có bước thay bộ nhớ tạm (Universal Clipboard). |
| PR23-S3 | Suggestion | **Đóng** | B11 có lệnh sửa `dc up -d --no-deps worker` cho production. |
| PR23-S4 | Suggestion (PR #16) | **Mở – chuyển BE/OPS** | Trên `755cad16`, nhánh `--set-booking-chat` của `init-secrets.sh` vẫn `exit 0` trước dòng in `init-secrets: created …`. Không thuộc diff PR #23 và không chặn. Giảm thiểu tạm: bước B6 (có in danh sách) luôn đứng trước B8, và B8 có bước kiểm trước. |

### Kết luận lượt 2: **DUYỆT** (điều kiện lượt 1 đã đạt)

Hai thẻ Major đã đóng. 4 thẻ Minor và S1–S3 cũng đã đóng. CI xanh đủ, gồm E2E. Phía SEC, ĐK2 của QC v1.0.1 cho PR #23 đã đạt. INV có thể dùng `v1.0.1-inv-commands.md` trên `main` cho A9/B8 và phần B. Chỉ còn S4, thuộc PR #16 và không chặn.
