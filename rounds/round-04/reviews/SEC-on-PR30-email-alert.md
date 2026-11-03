# SEC review – PR #30 `ops/v1.0.3-email-alert` @ 540411de (OPS, PR-2 của v1.0.3)

Round 4 · đợt v1.0.3 · Bước **Review** · SEC · 03/11/2026
Phạm vi: `git diff origin/main...origin/ops/v1.0.3-email-alert` (9 tệp, +984/−30). Đọc diff, không checkout nhánh, không chạy gì trên máy chủ.
Không trùng với `SEC-on-v1.0.3-contract-email.md` (hợp đồng email PR-1, do SEC khác review).

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Các điểm bảo mật chính của PR đều đạt (bảng dưới). Có 1 Major: gitleaks đỏ. Thẻ này không chặn việc gộp PR, nhưng chặn Release v1.0.3, vì CI `main` không xanh thì `publish images` bị bỏ qua và `resolve` của `release.yml` từ chối. Có thêm 4 Minor và 2 Suggestion.

Điều kiện:
- **Trước khi gộp:** sửa PR30-02 (chế độ chạy của `mail-test.sh`).
- **Trước khi gắn tag (P0):** sửa PR30-01 (gitleaks xanh trên `main`).
- **Ở bản runbook r1:** sửa PR30-03, PR30-04, PR30-05.

| Điểm ORC yêu cầu kiểm | Kết quả | Bằng chứng |
|---|---|---|
| `email_missing` không in địa chỉ | Đạt | Câu SQL chỉ chọn `count(*)` (và hằng `1` trong `EXISTS`). `n` phải khớp `^[0-9]+$`, nếu không thì in `unexpected answer`. Test đưa `owner@example.test` làm câu trả lời và kiểm không có `@` ở stdout hay trong tệp state. Lỗi truy vấn chỉ báo 7 loại cố định (CWD-03) |
| `email_missing` READ ONLY | Đạt | `psql_ro` đặt `PGOPTIONS="-c default_transaction_read_only=on"`. Test kiểm đúng chuỗi lệnh (`last.cmd`) và câu SQL không có từ khóa ghi. SQL là heredoc cố định, không có `SET TRANSACTION READ WRITE` |
| `mail-test.sh`: địa chỉ đọc bằng `read -rs`, không vào argv, lịch sử, đầu ra hay log container | Đạt (xem PR30-04, PR30-06) | Địa chỉ đọc bằng `IFS= read -rs` và đi qua `printf` (builtin, không có argv), là dòng 1 của stdin ssh. Trên VPS: `sh -c 'IFS= read -r MAIL_TEST_TO; export …; exec dc run … -e MAIL_TEST_TO'`, nên argv của ssh, sudo, sh, dc, docker đều không chứa địa chỉ. Dòng `COMMAND=` mà sudo ghi vào auth log cũng sạch. Đầu ra lọc qua `grep -E '^mail-test: (verified\|sent\|failed \([A-Za-z0-9_ .-]*\))$'` (không lọt được `@`). stderr bỏ hết. Có kiểm dạng địa chỉ (không xuống dòng), nên không chèn được dòng JS vào `node -`. `unset to` sau khi dùng. Test 1b–1f kiểm argv, dòng 1 stdin, phần còn lại của stdin trùng `mail-test.mjs` từng byte, và đầu ra |
| Lệnh bật `EMAIL_NO_RECIPIENT_ALERT` không in `.env` | Đạt (Suggestion PR30-07) | README 13.8 và runbook E2 chỉ in `grep -c`, `stat -c "%U %a"` và dòng `ops-check`. Tệp tạm tạo dưới `umask 077`. `cat >` giữ inode, chủ và 0600. Bản sao `env.before-email-alert.*` nằm ở `state/`; `backup.sh` không sao lưu `state/` (chỉ `privacy-notice.log`), nên bản sao `.env` không đi vào bản sao lưu |
| README 13.7: câu thường trực RB-04 | Đạt (Suggestion PR30-08) | Câu thường trực có tên bảng; cấm `UPDATE`/`DELETE`/`TRUNCATE`, `DISABLE TRIGGER`/`DROP TRIGGER`/`CREATE OR REPLACE FUNCTION`; chỉ đăng bản mới qua `publish-privacy-notice.sh`. Nêu rõ chủ bảng và superuser vẫn tắt được trigger. Đủ ý FB-R4-SEC-OPS-RB-04, và rộng hơn đề xuất gốc |
| Runbook K8: INV tự nhập email trên Desk sau 2FA, không dán email vào chat | Đạt | K8 bước 1–3: đăng nhập bằng mật khẩu + 2 bước, khi lưu xác nhận lại mật khẩu + mã. Bước 6: chỉ nhắn một trong 3 câu cố định, không kèm địa chỉ, không gửi ảnh. Bảng mục 2: agent không nhập mật khẩu thật, không thấy địa chỉ. "Luật riêng của đợt" ở đầu runbook và mục 1.4 |
| Runbook quay lui | Đạt (Minor PR30-03) | Mục 5: chỉ đổi image (`rollback.sh sha-e5fffe05ed55`); không restore, không SQL tay, không xóa CHECK hay bảng 0091; `.env` và `secrets/` giữ nguyên. Có diễn tập staging (5.0) làm điều kiện P0. R6/K4 kiểm `AT_IN_LOG` sau khi lùi trên production |
| Không có IP hay bí mật trong repo public | Đạt | Đã grep runbook, README và diff: không có IPv4, URL webhook, token, mật khẩu hay địa chỉ email thật (chỉ `info@ottimo.vn`, địa chỉ công khai, và `…@example.test`). `ottimo-admin@desk.ottimo.vn` là người dùng SSH + tên miền công khai, đã có từ v1.0.1. Digest image và id môi trường GitHub là thông tin công khai. Gitleaks báo 4 phát hiện, cả 4 là digest image (PR30-01), không có bí mật thật |

---

### FB-R4-SEC-OPS-PR30-01
- Mức độ: Major
- Vị trí: job `gitleaks` của CI (run 41618329549, job 125857300706). `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` dòng 519 (mục 5.0, lệnh `rollback.sh … --api-digest sha256:… --web-digest sha256:…`). Thêm 3 phát hiện có sẵn trên `main`: `v1.0.2-release-runbook.md` dòng 480 và 492, `v1.0.2-rollback-drill-staging.md` dòng 68.
- Vấn đề: gitleaks `generic-api-key` báo 4 phát hiện, `leaks found: 4`, exit 1. Cả 4 đều là digest image `sha256:<64 hex>` đứng sau `--api-digest`. Đây là báo nhầm: digest công khai, log Release in ra, và PR này không có bí mật thật. Nhưng CI của `main` đã đỏ vì gitleaks từ commit 642e1947, và vẫn đỏ ở 85999b89, f11db568. PR này thêm một phát hiện nữa. Hệ quả: `publish images (GHCR)` và `deploy staging` bị **skipped** trên `main`. `release.yml` (`resolve`) chỉ nhận lượt CI `status=success` của đúng commit được tag, nên Release v1.0.3 sẽ bị từ chối (`no successful CI run`).
- Vì sao quan trọng: (1) Chặn đường phát hành v1.0.3: không có image staging, không tag được. (2) Gitleaks đỏ kéo dài làm đội quen bỏ qua nó. Khi có bí mật thật, lỗi đó sẽ lẫn vào đám báo nhầm.
- Đề xuất sửa (OPS chọn một cách; SEC duyệt allowlist như PR #19):
  - (a) **Ưu tiên:** không ghi digest dạng chữ trong lệnh của tài liệu. Đọc digest từ `state/digests/<tag>` như R8 đang làm (`A=$(… sed -n "s/^api=//p")`), hoặc dùng ô `⟨API_DIGEST_V102⟩`. Ghi digest ở một bảng riêng, có tiền tố `api=`/`web=`, không đứng sau `--api-digest`. Các tệp v1.0.2 đã có trong lịch sử git thì xử lý theo (b).
  - (b) Thêm vào `.github/gitleaks.toml` một regex neo chặt, kèm lý do: `'''^sha256:[0-9a-f]{64}$'''`, nếu giá trị gitleaks bắt là cả chuỗi `sha256:…`. Nếu gitleaks chỉ bắt phần hex thì dùng `.gitleaksignore` với 4 fingerprint (`commit:file:rule:line`). Không dùng regex `^[0-9a-f]{64}$` trần, vì nó cũng che khóa HMAC/hex thật. Không thêm `paths` cho cả `rounds/`.
  - Kiểm xong: gitleaks xanh trên PR và trên `main`; `publish images` chạy. Thêm điều kiện này vào P0 của runbook.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-02
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/mail-test.sh` (mode `100644`, `git ls-tree`); runbook K8 nhánh lỗi bước 3–4, README 13.8.
- Vấn đề: tệp mới không có bit chạy, trong khi `ops-check.sh` có `100755`. Runbook gọi trực tiếp `product/infra/server/bin/mail-test.sh --ssh …`. Trên Mac của ORC/INV, lệnh này báo `permission denied`. CI không phát hiện, vì test và CI đều chạy `bash "$script"`. Thêm nữa, mặc định `--key ~/.ssh/ottimo_ops` là khóa OPS cá nhân, có thể không có trên Mac INV.
- Vì sao quan trọng: lúc sự cố gửi thư, người chạy dễ "chữa cháy" bằng lệnh cũ `-e MAIL_TEST_TO=<địa chỉ>` có sẵn trong lịch sử repo, chính là đường làm lộ địa chỉ mà PR này muốn bỏ. Người chạy cũng có thể chép khóa OPS sang máy INV.
- Đề xuất sửa: `git update-index --chmod=+x product/infra/server/bin/mail-test.sh` (và tệp test cho thống nhất). Thêm ca test chạy trực tiếp `"$script"` (không qua `bash`) hoặc kiểm `[ -x "$script" ]`. Runbook K8 bước 4: INV dùng khóa SSH **của mình** bằng `--key <tệp>`; không chép khóa `ottimo_ops` sang máy khác.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-03
- Mức độ: Minor
- Vị trí: runbook mục 5.0 "Sau lùi kiểm" và "Lên lại"; mục 8 Q1.
- Vấn đề: diễn tập có chủ đích tạo một dòng outbox `email_changed` đang chờ, rồi cho worker v1.0.2 (chưa biết mẫu này) xử lý. Phần kiểm sau lùi chỉ đòi `JOB_FAILED=0`, không đòi `AT_IN_LOG=0`. Đây đúng là ca dễ làm lộ địa chỉ nhất: worker cũ gặp mẫu lạ có thể ghi lỗi kèm một phần payload hay tên người nhận vào log. Trên production, R6 có `AT_IN_LOG`, nhưng diễn tập (nơi trả lời Q1) thì chưa có.
- Vì sao quan trọng: nếu worker v1.0.2 làm lộ địa chỉ, cần biết từ staging (địa chỉ `@example.test`) trước khi phải lùi thật trên production (địa chỉ thật của INV).
- Đề xuất sửa: ở 5.0, sau lùi **và** sau khi lên lại, chạy lệnh đếm của K4/K9 trên stack staging: `AT_IN_LOG` của `worker` và `api` từ lúc QA đổi email. Mong đợi `0`. Nếu > 0: không dán dòng log; báo SEC; Q1 thành điều kiện chặn mục 5 trên production cho tới khi BE sửa. Ghi kết quả vào `v1.0.3-rollback-drill-staging.md` (chỉ con số).
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-04
- Mức độ: Minor
- Vị trí: runbook G3 / P2b (bước dựng lại gói staging và production); README 13.8 "Thư thử SMTP".
- Vấn đề: đường stdin của `--send` chỉ an toàn khi sudo **không** ghi I/O. Nếu sudoers có `log_input`, sudo ghi lại toàn bộ stdin, kể cả dòng địa chỉ, vào `/var/log/sudo-io`. README dòng 169 ghi đã kiểm điều này ngày 26/10 (chỉ có `use_pty`), nhưng runbook v1.0.3 không kiểm lại trước khi dùng `--send`, còn mã thì ghi "Nothing is written to disk on either side".
- Vì sao quan trọng: cấu hình máy chủ có thể đổi sau 26/10 (gói hardening, cập nhật Ubuntu). Đây là chỗ duy nhất địa chỉ có thể nằm lại lâu dài trên đĩa mà không ai biết.
- Đề xuất sửa: P2b bước 4 thêm một kiểm chỉ đếm: `sudo -n grep -rhcE '^[^#]*(log_input|log_output)' /etc/sudoers /etc/sudoers.d | paste -sd+ | bc`. Mong đợi `0`; khác 0 thì không dùng `--send`, báo SEC. Sửa câu chú thích trong `mail-test.sh` thành "nothing is written to disk by these scripts (sudo I/O logging must stay off – README 7)".
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-05
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/mail-test.sh` (dòng chú thích 9–11), `mail-test.mjs` (đầu tệp); runbook K8 nhánh lỗi bước 4.
- Vấn đề: `docker compose run -e MAIL_TEST_TO` đặt địa chỉ vào cấu hình container. Docker ghi cấu hình này vào `/var/lib/docker/containers/<id>/config.v2.json`, và người trong nhóm `docker` (`ottimo`, root) đọc được bằng `docker inspect` khi container còn tồn tại. `--rm` xóa container khi lệnh kết thúc bình thường. Nếu client compose chết giữa chừng (mất ssh, Ctrl-C) thì container `worker-run-*` có thể còn lại, mang theo địa chỉ. Đây là cùng ranh giới tin cậy với `.env`, nên rủi ro thấp, nhưng câu "Nothing is written to disk" trong chú thích không đúng.
- Vì sao quan trọng: tài liệu sai dẫn tới không dọn khi có sự cố.
- Đề xuất sửa: sửa chú thích. Runbook K8 bước 4 thêm một kiểm sau `--send` (ORC chạy): `dc ps -a --filter label=com.docker.compose.oneoff=True -q | wc -l`, mong đợi `0`; khác 0 thì `dc rm -f` các container đó (không `inspect`, không in env).
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-06
- Mức độ: Suggestion
- Vị trí: `mail-test.sh`, biến `MAIL_TEST_READ_STDIN=1`.
- Vấn đề: đây là cửa cho test, cho phép đưa địa chỉ vào qua pipe. Ai đó có thể dùng `echo <địa chỉ> | MAIL_TEST_READ_STDIN=1 mail-test.sh --send`, và địa chỉ sẽ vào lịch sử shell, đúng điều PR muốn tránh.
- Đề xuất sửa: chỉ nhận cửa này khi đồng thời có biến chỉ test đặt (ví dụ `MTS_DIR` không rỗng), hoặc khi `ssh` trong `PATH` không phải `/usr/bin/ssh`. README ghi một câu "chỉ cho test, không dùng tay".
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-07
- Mức độ: Suggestion
- Vị trí: README 13.8 "Cách bật", runbook E2.
- Vấn đề: (1) README chỉ nói "chỉ giữ bản mới nhất (như 13.4 bước 6)", không chép lệnh dọn `env.before-email-alert.*` như runbook E2 đã có. (2) Nếu lệnh dừng giữa `grep` và `rm`, `state/env.alert.tmp` (bản sao đầy đủ `.env`, 0600) còn lại.
- Đề xuất sửa: chép lệnh dọn vào README 13.8. Trong `sh -c` thêm `trap 'rm -f "$t"' EXIT` (hoặc thêm `rm -f /opt/ottimo-prod/state/env.alert.tmp` vào cuối khối kiểm).
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-08
- Mức độ: Suggestion
- Vị trí: README 13.7 "Luật thường trực".
- Vấn đề: ngoài tắt hay xóa trigger, superuser còn hai cách vượt trigger `O` mà không đổi `tgenabled`, nên K3 không thấy: `SET session_replication_role = replica` trong một phiên, và `pg_restore --disable-triggers`. Luật đã cấm DML tay nên vẫn bao được, nhưng người đọc có thể nghĩ "không tắt trigger là được".
- Đề xuất sửa: thêm một ý vào câu thường trực: "không `SET session_replication_role`, không `pg_restore --disable-triggers` vào DB có bảng này".
- Trạng thái: Open

---

## Câu hỏi của OPS ở runbook mục 8 (phần SEC)

- Q1, Q2 là việc của ARC/BE. SEC chỉ đòi thêm phần kiểm `AT_IN_LOG` ở diễn tập (PR30-03).
- G5 (đợi qua giờ T + 24 giờ mới bật cảnh báo): SEC đồng ý, không nới.
- E3 (bỏ lượt kiểm B1–B6 mỗi sáng): SEC quyết sau khi nhận 4 dòng của E1 và 5 dòng của E2, không quyết trước.

## Điểm làm tốt

- `mail-test.sh` thiết kế đúng hướng. Địa chỉ đi theo stdin; `-e KEY` không có giá trị; đầu ra lọc theo whitelist, `@` không lọt qua được; mặc định `--verify-only`; tự từ chối chạy trên máy chủ. Test kiểm cả argv lẫn stdin từng byte.
- `email_missing` có nhiều lớp chặn: READ ONLY, chỉ `count(*)`, câu trả lời phải là số. Test cố tình đưa vào một địa chỉ để chứng minh địa chỉ không lọt ra.
- Runbook giữ đúng nguyên tắc "chỉ số, không dán". SQL đọc đều mở bằng `SHOW default_transaction_read_only`, và có hướng xử lý `AT_IN_LOG > 0` như sự cố dữ liệu cá nhân.

---

## Lượt 2 – bản sửa `bd74ef86` (03/11/2026)

Phạm vi: `git diff 540411de bd74ef86` (7 tệp, +227/−57) và `rounds/round-04/responses/OPS-on-PR30.md` (đọc bằng `git show`). Không checkout nhánh, không chạy gì trên máy chủ. Đối chiếu digest với log công khai của 2 lượt Release bằng `gh run view --log` (chỉ đọc).

### Kết luận lượt 2: **ĐẠT**

- 8/8 thẻ SEC (PR30-01…08) đã sửa đúng. Cả 8 thẻ **Closed**.
- SEC **duyệt** dòng allowlist digest mới trong `.github/gitleaks.toml`, kể cả chỗ lệch có hai digest (xem bảng dưới).
- Job `gitleaks` của CI trên `bd74ef86` (run 41621006301) đã **success**. CI checkout `fetch-depth: 0`, nên gitleaks quét đủ lịch sử. Job `docker images build · E2E smoke` còn đang chạy lúc viết (không thuộc phần SEC).
- PR gộp được về phía SEC. Có 1 Minor mới (PR30-09) phải sửa ở runbook **r2**, trước khi chạy trên production; nó không chặn việc gộp. Có thêm 1 Suggestion (PR30-10) cho v1.0.4.
- Điều kiện trước khi gắn tag vẫn còn hiệu lực: CI `main` của `SHA_V103` phải xanh **cả** gitleaks lẫn `publish images`. Điều kiện này đã có trong bảng P0 của runbook.

### Trạng thái thẻ

| ID | Mức | Trạng thái | Kiểm lại |
|---|---|---|---|
| PR30-01 | Major | **Closed** | (1) Runbook r1 không còn digest 64 hex nào. Mục 5.0 dùng `rollback.sh sha-e5fffe05ed55` trần, có `test -r state/digests/…`, và thiếu tệp thì dừng. Phần lên lại và R8 đọc digest vào biến, chỉ in 8 hex. Phần lên lại còn kiểm dạng `^sha256:[0-9a-f]{64} …$` trước khi dùng. (2) Có allowlist neo hai đầu (bảng dưới). (3) Quy ước "không dán digest" đã ghi ở README 13.1 và runbook mục 6. (4) P0 đã thêm điều kiện gitleaks + `publish images`. (5) gitleaks CI xanh |
| PR30-02 | Minor | **Closed** | Cả hai tệp đã sang `100755` (`git diff --summary`). Test 8 kiểm `[ -x ]`, test 8b gọi thẳng `"$script"`. K8 bước 3–4 giờ chạy bằng `bash` từ `git archive origin/main`, nên không còn phụ thuộc bit chạy. `--key` là khóa trên chính Mac của người chạy, có câu cấm chép khóa sang máy khác |
| PR30-03 | Minor | **Closed** | Mục 5.0 đếm `AT_IN_LOG` của worker + api từ giờ D, **sau khi lùi** và **sau khi lên lại**. Staging đòi đúng `0`. Nếu lớn hơn 0: không dán log, báo SEC, và Q1 thành điều kiện chặn mục 5 trên production. Biên bản chỉ ghi con số. Ngoài ra QA `dc stop worker` trước khi đổi email, để chắc chắn có dòng còn chờ khi lùi |
| PR30-04 | Minor | **Closed** (xem PR30-09) | Có `SUDO_IO_LOG` ở P2b bước 4 và ở bước "Trước" của K8, chỉ đếm, không in sudoers. Danh sách tùy chọn rộng hơn đề xuất (`log_stdin`, `log_ttyin`, `log_servers`…). Nếu khác 0 thì cấm `--send`. Chú thích `mail-test.sh` đã bỏ câu "Nothing is written to disk" và ghi rõ hai giới hạn |
| PR30-05 | Minor | **Closed** (xem PR30-09) | Có bước "Sau" ở K8 (chạy cả khi lệnh bị ngắt): `ONEOFF` lọc theo nhãn `oneoff=True` + `service=worker`. Nếu khác 0 thì `docker rm -f`, không `inspect`, không in env. Chú thích `mail-test.sh`, `mail-test.mjs` và README 13.8 đã sửa |
| PR30-06 | Suggestion | **Closed** | Đường pipe chỉ mở khi có **cả** `MAIL_TEST_READ_STDIN=1` **và** `MTS_DIR` không rỗng. Test 4b: thiếu `MTS_DIR` thì vẫn từ chối, và không có lời gọi ssh (`! -e argv`). Trên VPS, cửa này không bật được: lệnh từ chối `.ottimo-home` (dòng 43–45) chạy **trước** nhánh `--send`. Hằng `remote` cũng không mang `MTS_DIR` sang máy chủ. Phần còn lại: xem PR30-10 |
| PR30-07 | Suggestion | **Closed** | README 13.8 và runbook E2 có `trap "rm -f \"\$t\"" EXIT` trong `sh -c` (dấu `$` được giữ đúng, `$t` mở trong shell con). Có thêm kiểm `TMP: GONE`. README đã chép lệnh dọn `env.before-email-alert.*` |
| PR30-08 | Suggestion | **Closed** | README 13.7 và runbook mục 6 đã thêm cấm `SET session_replication_role = replica` và `pg_restore --disable-triggers`, có nêu lý do K3 không thấy hai cách này |

### Allowlist digest trong `.github/gitleaks.toml`: **SEC duyệt**

Dòng được duyệt: `'''^(sha256:)?(7ad36566…2d72|f064700d…a9be)$'''`, dòng 53, có chú thích lý do và các commit 642e1947, b046363b, 540411de.

| Câu hỏi | Kết quả | Bằng chứng |
|---|---|---|
| Regex có cho lọt chuỗi nào khác không? | **Không.** Chỉ đúng 4 chuỗi khớp: A, `sha256:`A, B, `sha256:`B | Cả `^…$` ôm trọn nhóm `(A\|B)`, nên không có lỗi ưu tiên kiểu `^A\|B$`. Không có ký tự đại diện, không có lượng từ trên phần hex. Gitleaks mặc định so allowlist với `secret`, là giá trị bị bắt, không phải cả dòng. Đã thử: 64 số `0`, A thêm 1 ký tự đầu hoặc cuối, A nối B, A viết hoa, `sha512:`A, A thiếu 1 ký tự, và digest web `720c4ffd…` đều **không** khớp. OPS đã thử âm bằng chính gitleaks (`--api-digest sha256:<64 hex ngẫu nhiên>` vẫn bị bắt). Nếu gitleaks bắt một giá trị dài hơn, dòng này không khớp và phát hiện vẫn được báo (fail-closed) |
| Có đúng digest image công khai không? | **Đúng** | `gh run view 41330353710 --log` (Release v1.0.1, repo PUBLIC) in `api@sha256:7ad36566…2d72`. `gh run view 41607294860 --log` (Release v1.0.2) in `api@sha256:f064700d…a9be`. Cả hai khớp từng ký tự với dòng allowlist. Digest là băm nội dung của manifest image: nó định danh image chứ không cấp quyền gì, và không có bí mật thật nào trùng được với nó |
| Có cần đủ hai giá trị không? | **Cần** | `f064700d…` nằm sau `--api-digest` ở `v1.0.3-release-runbook.md:519` của commit 540411de. Commit này đã push, gitleaks quét toàn bộ lịch sử, và viết lại lịch sử nhánh đã push thì rủi ro cao hơn để lại. `7ad36566…` nằm trên `main` (`v1.0.2-release-runbook.md:492`, `v1.0.2-rollback-drill-staging.md:68`) |
| Phạm vi có đủ hẹp không? | Có | Không thêm `paths`. Không có regex hex trần. Không tạo `.gitleaksignore`. Digest web không bị gitleaks bắt (không có chữ "api"), nên không cần thêm |

Ghi lại cho decision-log (SEC tự quyết theo quyền của vai): *03/11/2026 · R4 · SEC duyệt allowlist gitleaks neo hai đầu cho 2 digest api công khai (v1.0.1 `7ad36566…2d72`, v1.0.2 `f064700d…a9be`), đã đối chiếu log Release 41330353710 và 41607294860. Từ v1.0.3, không thêm digest nào vào allowlist: runbook không dán digest (README 13.1). Nếu có digest mới bị bắt thì sửa tài liệu, không nới allowlist.*

### `mail-test.sh` (bản `bd74ef86`)

| Điểm | Kết quả |
|---|---|
| Địa chỉ đọc bằng `IFS= read -rs` | Đạt. Dòng `read -rs -p …` giữ nguyên. Prompt ra stderr, không vọng chữ |
| Không vào argv hay log | Đạt. Địa chỉ đi qua `printf '%s\n' "$to"` (builtin) vào stdin của ssh. Hằng `remote` chỉ có `$home` và `$verify_flag`, đều là giá trị cố định. Trên VPS, địa chỉ chỉ nằm trong biến `read`, rồi `-e MAIL_TEST_TO` không có giá trị. Đầu ra lọc whitelist, không có `@`. stderr của ssh bị bỏ. Câu lỗi không lặp lại địa chỉ. `unset to` chạy cả ở nhánh lỗi lẫn sau khi gửi |
| Cửa test `MTS_DIR` không bật được trên production | Đạt (xem PR30-06 ở trên). Còn một chỗ hở trên **Mac**: người cố ý đặt cả hai biến vẫn dùng được cửa này với ssh thật. Rủi ro thấp: phải cố ý, ghi rõ là chỉ cho test, và chỉ đổi nguồn nhập (pipe thay cho dấu nhắc). Argv và đầu ra vẫn sạch. Xem PR30-10 |
| Chú thích đúng thực tế | Đạt. Không còn câu "Nothing is written to disk". Đã nêu sudo I/O log và container one-off |

### Runbook r1 + README + phản hồi OPS: không có dữ liệu thật hay bí mật

- Email: chỉ còn `info@ottimo.vn` (địa chỉ công khai), `ottimo-admin@desk.ottimo.vn` (người dùng SSH + tên miền công khai, có từ v1.0.1), tên unit systemd `…@ottimo-prod.timer`, và `…@example.test` trong test. Không có địa chỉ của INV hay MGR.
- IPv4: runbook và phản hồi OPS không có IP nào. README có `172.31.1.2` và `172.30.1.11`, là địa chỉ mạng nội bộ Docker, có từ trước và không thuộc diff này. Không có IP công khai của VPS.
- Hex 64: runbook chỉ có băm migration drizzle `2c90ac33…1ccf`. Băm này công khai, có sẵn trên `main` (`v1.0.2-release-runbook.md:263`), và không phải bí mật. Digest đầy đủ chỉ còn ở dòng allowlist.
- Không có URL webhook, token, khóa riêng hay mật khẩu. README 13.2 chỉ có mẫu `?key=…&token=…`.
- Tên repo công khai `anhvh93-tech/ottimo-hotel-app-public` và đường dẫn Mac `/Users/anhvh/Desktop/hotel-app` đã có trên `main` từ trước. Hai thông tin này không phải bí mật.

---

### FB-R4-SEC-OPS-PR30-09
- Mức độ: Minor
- Vị trí: runbook r1 P2b bước 4 (`SUDO_IO_LOG=$(sudo -n grep -rhcE … | awk "{s+=\$1} END {print s+0}")`); K8 bước 4 "Sau" (`ONEOFF=$(sudo -n -u ottimo docker ps -a -q … | wc -l)`); README 13.8 (cùng hai lệnh).
- Vấn đề: hai lệnh đếm này **fail-open**. Nếu lệnh bên trong lỗi thì kết quả vẫn ra đúng con số mong đợi. Ví dụ: `sudo -n` đòi mật khẩu, không đọc được `/etc/sudoers.d`, `docker` báo permission denied, hoặc daemon không trả lời. Khi đó `awk … END {print s+0}` in `0`, và `wc -l` cũng in `0`. Thông báo lỗi chỉ ra stderr, trong khi người chạy (ORC) đối chiếu theo dòng "Đúng là: `SUDO_IO_LOG=0`" / "`ONEOFF=0`". Kiểu lỗi này giống CWD-03: lỗi bị đọc thành "ok".
- Vì sao quan trọng: đây là hai chốt duy nhất cho hai chỗ mà địa chỉ email thật của INV có thể nằm lại trên đĩa máy chủ (`/var/log/sudo-io`, cấu hình container).
- Đề xuất sửa (ở r2, trước khi chạy production):
  - `SUDO_IO_LOG`: `grep -c` với `-r` luôn in ít nhất một dòng cho mỗi tệp đọc được. Vì vậy: `awk "{s+=\$1} END {if (NR==0) print \"ERR\"; else print s+0}"`, và đổi thành `ERR` nếu `grep` thoát với mã lớn hơn 1 (ví dụ `{ sudo -n grep … ; [ $? -le 1 ] || echo X; }` rồi awk gặp `X` thì in `ERR`).
  - `ONEOFF`: chạy `docker ps` trước vào biến và kiểm mã thoát: `L=$(sudo -n -u ottimo docker ps -a -q …) && echo "ONEOFF=$(printf %s "$L" | grep -c .)" || echo "ONEOFF=ERR"`.
  - Ghi "Đúng là" thành: `ERR` thì coi như khác 0, cấm `--send` hoặc báo OPS dọn tay. Thêm vào bảng dừng mục 6.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR30-10
- Mức độ: Suggestion
- Vị trí: `product/infra/server/bin/mail-test.sh` dòng 51 (điều kiện cửa test).
- Vấn đề: cửa test chỉ đòi `MTS_DIR` không rỗng. Nó không kiểm `ssh` có đúng là ssh giả hay không, nên trên Mac vẫn dùng được với ssh thật nếu cố ý đặt cả hai biến.
- Đề xuất sửa (v1.0.4, cùng đợt với ARC PR30-10): thêm điều kiện `[ "$(command -v ssh)" = "$MTS_DIR/bin/ssh" ]`. Test 4 và 4b giữ nguyên. Thêm ca 4c: có cả hai biến nhưng `PATH` không có ssh giả thì vẫn từ chối.
- Trạng thái: Open

### Điểm làm tốt (lượt 2)
- Bỏ hẳn digest khỏi lệnh và đọc vào biến, thay vì chỉ nới allowlist. Lỗi được sửa tận gốc, và có quy ước để không tái diễn.
- Thử âm allowlist bằng chính gitleaks và chạy đủ lịch sử, không chỉ thử dương.
- Dùng `awk` thay `paste | bc`, và lọc container one-off theo cả nhãn `service=worker`: đúng ý thẻ và chặt hơn đề xuất.
