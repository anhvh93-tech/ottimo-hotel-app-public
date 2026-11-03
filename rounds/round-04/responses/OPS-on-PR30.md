# OPS phản hồi – SEC và ARC review PR #30 (`ops/v1.0.3-email-alert`)

- Tác giả: OPS · Round 4 (v1.0.3), bước **Phản hồi & sửa** · 03/11/2026
- Review được trả lời:
  - `rounds/round-04/reviews/SEC-on-PR30-email-alert.md` (FB-R4-SEC-OPS-PR30-01…08);
  - `rounds/round-04/reviews/ARC-on-PR30-email-alert.md` (FB-R4-ARC-OPS-PR30-01…10, câu trả lời Q1–Q3).
- Bản sửa: cùng nhánh `ops/v1.0.3-email-alert`, commit ngay sau `540411de`. Không mở PR mới, không gộp `main`, không SSH vào máy chủ.
- Cách sửa gitleaks theo chỉ đạo ORC (thay cho `.gitleaksignore` theo fingerprint): một dòng regex neo hai đầu trong `.github/gitleaks.toml`, khớp đúng giá trị. Không tạo `.gitleaksignore`.
- Runbook `rounds/round-04/outputs/OPS/v1.0.3-release-runbook.md` lên **r1**. Bản r2 ra khi PR-1 xong (mục 8 "Việc còn chờ PR-1").
- Kiểm chạy lại: xem cuối tệp.

## Thẻ SEC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-OPS-PR30-01 | Done | (1) Runbook 5.0 bỏ hai digest viết sẵn. `rollback.sh sha-e5fffe05ed55` tự đọc `state/digests/<tag>` (cùng khuôn R4). Phần lên lại đọc digest từ artifact `image-digests` vào biến, chỉ in 8 hex. R8 cũng chỉ in 8 hex. (2) `.github/gitleaks.toml`: thêm **một** dòng `regexes`, neo `^…$`, khớp đúng giá trị, kèm lý do và commit. **Không** cho qua mọi chuỗi 64 hex. Dòng này có **hai** giá trị: digest api v1.0.1 `7ad36566…2d72` (v1.0.2 runbook/drill, commit 642e1947, b046363b), và digest api v1.0.2 `f064700d…a9be`. Giá trị thứ hai cần vì commit `540411de` đã push, nằm trong lịch sử nhánh, và gitleaks quét toàn bộ lịch sử. (3) Thêm quy ước "không dán digest vào dòng lệnh" ở README 13.1 và runbook mục 6. (4) P0 thêm điều kiện: CI `main` của `SHA_V103` xanh **cả** gitleaks và `publish images` trước khi tag. (5) gitleaks v8.21.2, đúng lệnh `ci.yml`, trên bản clone của nhánh: `no leaks found` (cuối tệp). SEC duyệt dòng allowlist |
| FB-R4-SEC-OPS-PR30-02 | Done | `bin/mail-test.sh` và `test/mail-test-send.test.sh` sang `100755` (`git update-index --chmod=+x`). Test thêm ca 8 (`[ -x "$script" ]`) và 8b (gọi thẳng `"$script"`, không qua `bash`, ra `verified`). Runbook K8 bước 4 và README 13.8: `--key` là khóa quản trị **trên chính Mac của người chạy**, không chép khóa sang máy khác |
| FB-R4-SEC-OPS-PR30-03 | Done | Runbook 5.0: đếm `AT_IN_LOG` (worker + api, từ giờ D) **sau lùi** và **sau khi lên lại**. Đúng là `0`. Lớn hơn 0: không dán dòng log, báo SEC, và Q1 thành điều kiện chặn mục 5 trên production. Biên bản diễn tập chỉ ghi số |
| FB-R4-SEC-OPS-PR30-04 | Done | P2b bước 4 in `SUDO_IO_LOG`: chỉ đếm số dòng sudoers bật `log_input`/`log_output`/…, không in sudoers. Đúng là `0`. Khác 0 thì cấm `--send` (K8 bước 4 có bước "Trước"), báo SEC. Dùng `awk` thay `paste | bc`, vì `bc` có thể không có trên Ubuntu tối giản. README 13.8 có cùng lệnh. Chú thích trong `mail-test.sh` đã sửa: không còn câu "Nothing is written to disk"; nay ghi rõ hai giới hạn: sudo I/O logging phải tắt, và container one-off còn sót |
| FB-R4-SEC-OPS-PR30-05 | Done | K8 bước 4 có bước "Sau" (kể cả khi lệnh bị ngắt): `ONEOFF` đếm container `com.docker.compose.oneoff=True` của service `worker`. Đúng là `0`. Khác 0 thì `docker rm -f` các container đó, không `inspect`, không in env. Dùng `docker ps` theo nhãn thay `dc ps`, vì nhãn compose đã thử tại chỗ. Chú thích `mail-test.sh`, `mail-test.mjs` và README 13.8 đã sửa |
| FB-R4-SEC-OPS-PR30-06 | Done | Cửa test `MAIL_TEST_READ_STDIN=1` chỉ mở khi có thêm `MTS_DIR` không rỗng (thư mục ssh giả của test). Ca 4b: thiếu `MTS_DIR` thì vẫn từ chối. README 13.8 ghi "chỉ cho test, không dùng tay" |
| FB-R4-SEC-OPS-PR30-07 | Done | README 13.8 và runbook E2: thêm `trap "rm -f \"\$t\"" EXIT` trong `sh -c`, thêm kiểm `TMP: GONE`. README chép lệnh dọn `env.before-email-alert.*`. Đã thử trên `.env` giả, gồm cả ca `grep` lỗi giữa chừng: tệp tạm không còn |
| FB-R4-SEC-OPS-PR30-08 | Done | README 13.7 và runbook mục 6 (RB-04): không `SET session_replication_role = replica`, không `pg_restore --disable-triggers` vào DB có bảng này |

## Thẻ ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-OPS-PR30-01 | Done | Như SEC-01: 5.0 dùng `rollback.sh sha-e5fffe05ed55` không cờ digest; một dòng regex neo hai đầu, khớp đúng giá trị; quy ước ở README 13.1 và runbook mục 6; điều kiện P0 về gitleaks + `publish images`; gitleaks tại chỗ `no leaks found`. Khác đề xuất: dòng regex có thêm digest v1.0.2 `f064700d…a9be` (lý do ở SEC-01). ORC/SEC xem đây có phải là chỗ lệch được chấp nhận không |
| FB-R4-ARC-OPS-PR30-02 | Done | Như SEC-02: cả hai tệp `100755`, test có ca `-x` và ca gọi trực tiếp. 20/20 |
| FB-R4-ARC-OPS-PR30-03 | Done | 1.3: thay câu hỏi Q1 bằng câu trả lời của ARC: `dead`, `BAD_TEMPLATE`, làm `WORKER_ERR` chứ không làm `JOB_FAILED`, không vào `email_dead`, không gửi lại. R6: `WORKER_ERR` = `LOG_BAD_TEMPLATE` (`grep -c '"code":"BAD_TEMPLATE"'`) = số dòng của câu READ ONLY trên `outbox_message` (không đọc `payload`); bỏ câu cũ "`JOB_FAILED` > 0 có thể là…". R7: báo INV thư xác nhận sẽ không tới. 5.0: QA `dc stop worker` trước khi đổi email `…@example.test`. Đúng là `dead|BAD_TEMPLATE|1`. Thêm bước mở danh sách thông báo của `qa.owner` (`account_security_change`, `refCode = user.email_changed`) trên v1.0.2 |
| FB-R4-ARC-OPS-PR30-04 | Done | 1.3 ghi ngoại lệ A → B. R6 thêm `SELECT count(*) FROM user_email_change WHERE old_email IS NOT NULL`, đúng là `0`. Nếu > 0 và dự kiến chạy v1.0.2 quá 7 ngày: ARC + SEC quyết, không gõ SQL tay |
| FB-R4-ARC-OPS-PR30-05 | Done | `AT_IN_LOG` ở K4, K9, 5.0 đếm theo dạng email (regex ARC), vẫn chỉ in số. P2 đo số nền `AT_BASE` trên production v1.0.2. "Đúng là" ở K4, K9, R6 và bảng dừng (mục 6) = `AT_BASE`. Trên staging (chỉ có địa chỉ giả) vẫn đòi `0` |
| FB-R4-ARC-OPS-PR30-06 | Done | K8 bước 3 (`--verify-only`) và bước 4 (`--send`) dùng `git fetch origin` + `git archive origin/main product/infra/server` ra thư mục tạm, chạy bằng `bash`, xong thì `rm -rf`. Không `git pull` vào bản làm việc chung |
| FB-R4-ARC-OPS-PR30-07 | Done (phần OPS) | Runbook P2 dòng 4: "phủ định đúng của CHECK, ARC chốt"; bỏ ý "bổ sung chuỗi rỗng". Mục 8 có đoạn errata tech plan 2.4. Còn lại cho ARC: sửa `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` 2.4 và ghi decision-log (OPS không sửa tệp của ARC) |
| FB-R4-ARC-OPS-PR30-08 | Deferred v1.0.4 | Như ARC đề xuất: không đổi câu `email_missing` sát giờ phát hành. Ở v1.0.4: `u.status IN ('active', 'locked')`, kèm test, README 13.8, errata 2.10 |
| FB-R4-ARC-OPS-PR30-09 | Deferred v1.0.4 | Chuyển `email_dead`, `j16` sang `psql_ro`, và thêm chốt `rolsuper OR rolbypassrls`. Việc này đổi hành vi của hai kiểm đang chạy trên production, nên cần test riêng; quá 30 phút cho đợt này |
| FB-R4-ARC-OPS-PR30-10 | Deferred v1.0.4 (một phần Done) | Đã làm: README 13.8 và chú thích `mail-test.sh`/`mail-test.mjs` ghi rằng trong lúc container one-off chạy, địa chỉ nằm trong env/cấu hình container, chỉ root và nhóm `docker` đọc được; thêm kiểm `ONEOFF` sau `--send`. Hoãn: `mail-test.mjs` đọc địa chỉ từ dòng đầu stdin thay vì từ env |

## Câu trả lời Q1–Q3 đã áp vào runbook

- Q1 → 1.3, 5.0, R6, R7 (thẻ ARC-03).
- Q2 → 1.3, R6 (thẻ ARC-04).
- Q3 → P2 dòng 4 giữ câu của OPS; errata 2.4 ở mục 8 (thẻ ARC-07).
- G5 (điều kiện 4 mục E đếm sau giờ T + 24 giờ): ARC và SEC đã chấp nhận, mục 8 đã ghi.

## Kiểm đã chạy lại

- **gitleaks v8.21.2** (image ghim digest như `ci.yml`), đúng lệnh CI `detect --source=/repo --config=/repo/.github/gitleaks.toml --redact --verbose --exit-code 1`, chạy trên bản `git clone` của nhánh (worktree có `.git` dạng tệp, không mount được): 844 commit, `no leaks found`, exit 0.
- Kiểm âm của dòng allowlist (`--no-git`, thư mục tạm): `--api-digest sha256:<64 hex ngẫu nhiên>` **vẫn bị bắt** (exit 1); chỉ đúng digest v1.0.1 được cho qua.
- Test trên Mac:
  - `test-ops-check.sh` 55/55;
  - `ops-check-cwd.test.sh` 7/7;
  - `mail-test-send.test.sh` 20/20;
  - `deploy-landing-privacy.test.sh` 13/13;
  - `rollback.test.sh` 16/16;
  - `restore-drill-privacy.test.sh` 8/8.
- Test trong `ubuntu:24.04` (người dùng thường):
  - `test-ops-check.sh` 55/55;
  - `backup-privacy-log.test.sh` 5/5;
  - `restore-drill-privacy.test.sh` 8/8;
  - `mail-test-send.test.sh` 20/20;
  - `rollback.test.sh` báo SKIP vì image không có `jq`; trên Mac đã chạy đủ.
- shellcheck v0.9.0 và v0.10.0, `-x -S warning`, danh sách tệp của job CI: exit 0.
- Không có `.gitleaksignore`. Không có địa chỉ email thật, IP hay bí mật trong các tệp đã sửa. Digest đầy đủ chỉ còn trong `.github/gitleaks.toml` (dòng allowlist).
