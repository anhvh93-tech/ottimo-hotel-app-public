# SEC review – PR #32 `ops/v1.0.3-email-alert-2` (OPS, PR-2 lượt bổ sung)

- Người review: SEC · Round 4 (v1.0.3), bước **Review** · 03/11/2026
- Phạm vi: `git diff bd74ef86 origin/ops/v1.0.3-email-alert-2` @ `24882c38` (9 tệp, +783/−63), phản hồi `rounds/round-04/responses/OPS-on-PR31.md`, runbook `v1.0.3-release-runbook.md` r2. Tôi không checkout nhánh. Chỉ đọc diff, rồi chạy test trên bản `git archive` tạm (đã xóa sau khi chạy).
- Test SEC đã chạy lại (Mac): `test-ops-check.sh` 118/118, `requeue-email-changed.test.sh` 44/44 (máy không có `flock` nên thiếu ca khóa), `ops-check-cwd.test.sh` 7/7.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

- Gộp PR #32: **được**. Không có Blocker hay Major.
- PR31-01 **Closed**. Điều kiện SEC cho deploy production v1.0.3 đã có trong mã. Còn phải làm đúng các bước trong runbook (mục 6).
- Thẻ mới: 2 Minor (PR32-01, PR32-02), 3 Suggestion. Không thẻ nào chặn gộp. PR32-02 phải có trong runbook r3 trước Release.

---

## 1. PR31-01: `email_changes` đã đủ điều kiện deploy production chưa

| Yêu cầu của SEC (thẻ PR31-01) | Kiểm trên mã | Kết quả |
|---|---|---|
| Có 2 chỉ số đổi email: tổng 24 giờ, và người bị đổi nhiều nhất | `check_email_changes`: `coalesce(sum(n),0), coalesce(max(n),0)` trên nhóm `GROUP BY user_id`, `changed_at > now() - 24h`. Cả hai số luôn được tính và in ra | Đạt |
| Có chỉ số hàng đợi `staff.email` | `count(*)` + tuổi `min(created_at)` của `pending`/`failed`/`in_flight`, đổi ra phút | Đạt |
| READ ONLY | `psql_ro` (`PGOPTIONS=-c default_transaction_read_only=on`). Heredoc `<<'SQL'` có ngoặc nên không chèn biến shell nào. Test "READ ONLY" xanh | Đạt |
| Không in địa chỉ hay id | SQL chỉ chọn nhãn cố định và con số. Bộ đọc kết quả chỉ nhận đúng `^changes\|n\|n$` và `^queue\|n\|n$`, mỗi loại một lần. Dòng khác (test có `owner@example.test`) ra `unexpected answer` và không in giá trị. Câu FAIL và câu OK chỉ có số | Đạt |
| Ngưỡng 5 / 20 / 30 phút, luôn cảnh báo | Mặc định 5/20/30. Không đi qua công tắc `EMAIL_NO_RECIPIENT_ALERT`. Có trong lượt chạy đầy đủ của timer. Test biên 5/6, 20/21, 30/31 phút | Đạt |
| Chạy được trên DB 67 (v1.0.2) | Dùng `\if :has_uec`: chưa có bảng thì in `-1\|-1`, chỉ xét hàng đợi. Bộ đọc từ chối trường hợp chỉ một trong hai số là `-1` | Đạt |
| Lỗi truy vấn không lộ nguyên văn | `query failed: $(cmd_failed)`, dùng 7 loại cố định như các kiểm khác | Đạt |
| Test CI + dòng runbook | Bước CI riêng. Runbook có P2b, K5, K9, R6, mục **F**. Có README 13.8 | Đạt |

**Ghi nhận `count(*)` → `sum(n)`:** OPS sửa đúng. Ở câu mẫu của SEC, `count(*)` ngoài đếm số **người**, không đếm số **lần**, nên câu mẫu sai. `sum(n)` cho đúng ý "tổng > 20 lần / 24 giờ". `sum(bigint)` trả `numeric`, nhưng scale là 0 nên ra `8`, không ra `8.0`. Regex `[0-9]+` vẫn khớp, và OPS đã chạy thật trên Postgres 17 (`8|6`). SEC ghi nhận thay đổi này. Thẻ gốc giữ nguyên lịch sử.

**PR31-01: Closed.** Điều kiện thẻ 09 (dời giới hạn cứng sang v1.0.4) đã thỏa ở mức mã. Muốn deploy thì cần thêm các bước vận hành ở mục 6.

## 2. G9: khoảng chỉnh ngưỡng

`email_limit`: `.env` thắng biến môi trường, thiếu thì lấy mặc định. Chỉ nhận `^[0-9]{1,4}$` và giá trị trong `[min, max]` (dùng `10#` nên `05` hiểu là 5, không bị đọc thành số bát phân). Giá trị sai thì kiểm trả `FAIL "<TÊN> must be a whole number <khoảng>"` ngay, không truy vấn, không in giá trị đã đặt. Nhờ vậy, một dòng `.env` lạ cũng không lọt ra webhook. Đặt dòng rỗng (`X=`) thì quay về mặc định, không thể dùng cách này để tắt kiểm.

**SEC xác nhận G9: 1–20 / 1–200 / 5–240, không tắt được.** Lý do:
- Trần 20/người và 200 tổng vẫn đủ để thấy dội lệnh thật. Ngưỡng nới chỉ dùng tạm cho trường hợp OWN cố ý đổi email cho cả đội.
- Trần 240 phút là mức chậm tối đa SEC chấp nhận cho thư bảo mật, và **chỉ tạm thời**. Mục F bước 5 đã ghi rõ: đổi ngưỡng cần SEC + INV đồng ý, và decision-log phải có hạn trả về mặc định.

**G10 (thư `failed` chờ thử lại tính là "đang chờ"):** SEC đồng ý. Khi SMTP hỏng quá 30 phút, thư bảo mật đúng là đang bị trễ, nên cảnh báo là đúng.

## 3. `bin/requeue-email-changed.sh` (thao tác ghi trên production)

| Yêu cầu | Kiểm trên mã | Kết quả |
|---|---|---|
| Chặn khi worker là v1.0.2 | Bước 3 hỏi `isStaffEmailTemplate("email_changed")` ngay trong container worker đang chạy. Mã thoát `0` thì đi tiếp. `1` thì từ chối. Mọi mã khác (không import được, hàm không có) cũng từ chối: `could not ask …`. Vậy là **an toàn khi lỗi**. Trước bước này còn hai kiểm: `--tag` = `state/current_tag`, và có **đúng một** worker đang chạy, trên image có tag đó. OPS đã thử lệnh hỏi trên image cũ: ra 1. Hàm có ở `integrations/notification/email-templates.ts`, xuất qua `./notification` | Đạt |
| Giới hạn 7 ngày | `created_at > now() - interval '7 days'` có ở cả câu đếm lẫn `UPDATE`. Dòng cũ hơn chỉ được đếm. Mệnh đề `WHERE` của dòng là chuỗi cố định, dùng chung cho cả hai câu | Đạt |
| Một giao dịch, tự hủy khi lệch số | `BEGIN; DO … GET DIAGNOSTICS k = ROW_COUNT; IF k <> $expect THEN RAISE …; COMMIT;` chạy với `ON_ERROR_STOP=1`. Khi `RAISE`, psql thoát trước `COMMIT` và phiên đóng thì giao dịch tự hủy. `--expect` phải là số 1–4 chữ số, đã kiểm trước khi đưa vào SQL, và phải bằng số dòng đếm lúc đó. Chỉ ghi 4 cột `status`, `attempts`, `next_attempt_at`, `last_error`. Không đọc hay in `payload` | Đạt |
| Không lộ địa chỉ | Đầu ra và `logger -t ottimo-deploy` chỉ có tag và con số. stderr của DB ghi vào `mktemp` (0600), xóa ở `trap EXIT`, không bao giờ in ra. Điểm này quan trọng: nếu vi phạm CHECK, Postgres có thể đưa vào lỗi `Failing row contains (…)` cả dòng, kèm `payload`. Test có lỗi giả chứa `owner@example.test` và đầu ra không có `@` | Đạt |
| Chặn stub test trên production | `RQ_TEST_DC` + production → `exit 2` | Đạt |
| Không chạy khi đang deploy | `flock -n` trên `state/deploy.lock` (cùng khóa với `deploy.sh`). **Nhưng thiếu `flock` thì bỏ qua lặng lẽ**, xem PR32-01 | Đạt có ghi chú |
| Runbook ghi rõ cần INV đồng ý | Bảng mục 2 có dòng "`--apply` … ORC, **sau khi INV đồng ý**". R9 bước 2 có câu ORC hỏi INV trong chat, rồi mới đến bước 3. Mục 6: "Chưa có INV đồng ý → không `--apply`". README 13.9: "`--apply` chỉ khi INV đã đồng ý trong chat". Decision-log ghi câu INV đồng ý, không ghi id hay địa chỉ | Đạt |

Ghi thêm: `psql_rw` chạy bằng `POSTGRES_USER`, tức superuser và bỏ qua RLS. Tôi chấp nhận cho v1.0.3, vì `UPDATE` cố ý chạy trên toàn tổ chức, SQL là chuỗi cố định, và số dòng đổi bị khóa bằng `--expect`. Hướng cho v1.0.4 ở PR32-S1.

## 4. G11: `email_ascii` chạy qua `psql_ro`, chưa dùng vai `ottimo_readonly`

**SEC chấp nhận cho v1.0.3**, kèm điều kiện theo dõi:
- SQL là heredoc có ngoặc, không có đầu vào ngoài. Phiên mặc định READ ONLY. Chỉ `count(*)` ra khỏi DB. Câu trả lời không phải số thì ra `unexpected answer`, không in giá trị.
- Rủi ro còn lại: `POSTGRES_USER` là superuser, nên về lý thuyết có thể chạy `SET transaction_read_only = off`. Script không làm vậy và không có đường nào chèn SQL vào. `ops-check` vốn đã dùng chính quyền này cho `psql_admin` (j16, email_dead), nên G11 không thêm bề mặt tấn công mới.
- Điều kiện: chuyển mọi kiểm DB của `ops-check` (và câu đếm của `requeue`) sang vai chỉ đọc riêng ở v1.0.4, gom vào ARC PR30-09 như OPS đề xuất. Cần một dòng ghi vào rủi ro còn lại / decision-log.

## 5. Runbook r2

- **SEC PR30-09: Closed.**
  - `SUDO_IO_LOG`: khi `grep` thoát > 1 thì thêm `X` và ra `ERR`. Khi `sudo -n` đòi mật khẩu thì không có dòng nào, `NR == 0` và cũng ra `ERR`. Đây là trường hợp mã thoát 1 của sudo trùng với "grep không khớp", và đã được xử lý.
  - `ONEOFF`: `L=$(…) && … || echo ONEOFF=ERR`. `printf %s "$L" | grep -c .` đếm đúng cả dòng cuối không có ký tự xuống dòng.
  - Cả hai câu "Đúng là" đều ghi `ERR` tính như khác 0. Bảng dừng mục 6 có thêm hai dòng.
- **Không có email thật, IP hay bí mật:** tôi quét toàn bộ dòng thêm của diff. Chỉ có `owner@example.test` và `x@example.test` trong test (để kiểm rằng chúng **không** bị in ra), và đích SSH `ottimo-admin@desk.ottimo.vn` (tên máy công khai của sản phẩm, đã có từ các runbook trước). Không có IPv4. Không có mật khẩu, khóa hay token. Lệnh đổi `.env` ở mục F bước 5 dùng lại khuôn E2 (`umask 077`, không in `.env`). OPS báo gitleaks sạch trên 855 commit.
- K9 và mục F chỉ đọc `status`, `last_error`, `count`. Không câu nào chọn `payload` hay cột địa chỉ. Đạt.

## 6. Điều kiện trước Release production v1.0.3 (thay dòng PR31-01 ở bảng cổng của `SEC-on-PR31-v1.0.3-email.md`)

1. PR #32 gộp vào `main` **trước** khi chốt `SHA_V103`, để gói `infra/` có `check_email_changes`.
2. P2b chạy trên production **trước** P4/P5. Kết quả phải ra số ≥ 6 và `REQUEUE SCRIPT: CO`. Bước 4 ra dòng `email_changes` có số (trước 0091 là `table not present yet`, đúng như dự kiến).
3. Staging: QA chạy ca "đổi 6 lần / 24 giờ → `FAIL email_changes`". Diễn tập R9 hai chiều ở 5.0, ghi số vào biên bản.
4. K5 sau Release có dòng `ok email_changes: <n> e-mail change(s) in 24 h, max <n> …` (đã có bảng). Nếu vẫn ra `table not present` thì **dừng**, báo SEC.
5. Runbook r3 sửa theo PR32-02.

---

## 7. Thẻ feedback mới

### FB-R4-SEC-OPS-PR32-01
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/requeue-email-changed.sh` dòng `if command -v flock >/dev/null; then flock -n 9 || die …; fi`
- Vấn đề: máy không có `flock` thì bỏ qua kiểm khóa deploy mà không báo gì. `deploy.sh` thì ngược lại: thiếu `flock` là lỗi (`flock -n 9` không có điều kiện). Script ghi lại an toàn **lỏng hơn** script deploy mà nó cần tránh chạy cùng.
- Vì sao quan trọng: trên Ubuntu production luôn có `flock` (util-linux), nên rủi ro thực tế thấp. Nhưng một thao tác ghi trên production không nên âm thầm bỏ một điều kiện chặn. Nếu chạy `--apply` đúng lúc `deploy.sh --rollback` đổi worker về v1.0.2, dòng vừa xếp lại sẽ bị đánh `BAD_TEMPLATE` lần nữa.
- Đề xuất sửa: `is_prod=1` (hoặc `--apply`) mà không có `flock` thì `die "flock missing – cannot check state/deploy.lock"`. Chỉ cho bỏ qua khi chạy test (ví dụ `RQ_TEST_DC` đặt và không phải production). Thêm 1 ca test.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR32-02
- Mức độ: Minor (phải có trong runbook r3, trước Release)
- Vị trí: runbook r2 mục **F** bước 2. README 13.8 dòng "Khi `FAIL`: … OWN khóa tài khoản đang dội"
- Vấn đề: bước 2 bảo INV khóa "tài khoản đó", nghĩa là người **bị đổi** (theo thông báo trong app). Nhưng `user_email_change.via` có hai giá trị: `self` và `owner`.
  - Dòng `via = 'self'`: người bị đổi cũng là người đổi. Khóa người đó là đúng.
  - Dòng `via = 'owner'`: người đổi là OWN. Hiện chỉ có một OWN là INV. Dội kiểu này, nhất là loại "tổng > 20" trải trên nhiều người, nghĩa là tài khoản OWN đang bị dùng, hoặc chính INV đang làm. Khóa các tài khoản bị đổi **không** dừng được, mà còn làm nhân viên bị khóa oan.
- Vì sao quan trọng: làm sai bước ứng phó thì dội lệnh vẫn tiếp tục, thư bảo mật vẫn trễ. Còn nếu tài khoản OWN đã bị chiếm thì đó là sự cố, không phải nhân viên nghịch.
- Đề xuất sửa:
  - (a) Mục F bước 2 tách hai nhánh. **Nhánh 1:** INV không tự đổi hàng loạt **và** các thông báo cho thấy đổi bởi OWN → coi là tài khoản OWN bị lộ. INV đổi mật khẩu, xem phiên đăng nhập, báo SEC ngay (SEC quyết đặt lại 2 bước theo `mfa-operator-reset`). **Nhánh 2:** chỉ khóa người bị đổi khi đó là tự đổi.
  - (b) Không bắt buộc ở v1.0.3: `email_changes` in thêm một số `via owner: <n>` (chỉ đếm, `count(*) FILTER (WHERE via = 'owner')`) để ORC biết nhánh nào mà không cần đọc audit.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR32-S1
- Mức độ: Suggestion (v1.0.4, gom với ARC PR30-09 / G11)
- Vị trí: `requeue-email-changed.sh` `psql_rw` (dùng `POSTGRES_USER`); `ops-check.sh` `psql_ro`
- Vấn đề: thao tác ghi và các kiểm chỉ đọc đều dùng superuser.
- Vì sao quan trọng: quyền tối thiểu. Một lỗi viết SQL sau này sẽ không bị RLS hay GRANT chặn.
- Đề xuất sửa: các kiểm `ops-check` dùng vai `ottimo_readonly`. `requeue` dùng một vai chỉ có `SELECT, UPDATE (status, attempts, next_attempt_at, last_error) ON outbox_message`, cộng `SELECT` trên `to_regclass`.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR32-S2
- Mức độ: Suggestion
- Vị trí: `requeue-email-changed.sh`, `case "$images" in *":$tag" | *":$tag"-*)`
- Vấn đề: vế `-*` nhận mọi hậu tố sau tag, không chỉ `API_TAG_SUFFIX` đang đặt. Lệnh hỏi `isStaffEmailTemplate` mới là lớp chặn thật, nên đây không phải lỗ hổng.
- Đề xuất sửa: so khớp chính xác `":$tag$(envval API_TAG_SUFFIX)"`.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR32-S3
- Mức độ: Suggestion (tài liệu)
- Vị trí: runbook r2 R9, câu "Dòng cũ hơn chỉ được đếm (job `email_change.purge` đã xóa địa chỉ cũ)"
- Vấn đề: ngay sau khi lên lại từ một đợt chạy v1.0.2 dài (v1.0.2 không có job purge), địa chỉ cũ có thể **chưa** bị xóa. Job chạy lúc 03:00 với `catchUp: 'always'`. Kết luận "không xếp lại" vẫn đúng, chỉ lý do ghi chưa chính xác.
- Đề xuất sửa: "… (đã hoặc sẽ bị job `email_change.purge` xóa ở lượt kế tiếp; R6 dòng 3 đếm số này)".
- Trạng thái: Open

---

## 8. Trạng thái thẻ liên quan

| Thẻ | Trạng thái SEC |
|---|---|
| FB-R4-SEC-OPS-PR31-01 | **Closed** (điều kiện vận hành ở mục 6) |
| FB-R4-SEC-OPS-PR30-09 | **Closed** |
| G9 (khoảng ngưỡng) | Xác nhận |
| G10 (`failed` tính là chờ) | Xác nhận |
| G11 (`psql_ro` thay `ottimo_readonly`) | Chấp nhận cho v1.0.3, chuyển sang v1.0.4 (PR32-S1, ARC PR30-09) |

## 9. Điểm làm tốt
- Bộ đọc kết quả `email_changes` dùng danh sách cho phép, và chỉ nhận mỗi loại dòng một lần. Một giá trị lạ, kể cả địa chỉ, không thể lọt ra journal hay webhook. Ngưỡng sai thì `FAIL` mà không in lại giá trị `.env`.
- `requeue` an toàn khi lỗi ở mọi bước: chạy thử là mặc định, `--expect` khóa số dòng trong chính giao dịch, lệnh hỏi mẫu không xác định được thì từ chối.
- OPS tự phát hiện và ghi lại chỗ sai của câu mẫu SEC (`count(*)`), đồng thời chỉ ra rằng thứ tự worker/api chưa nằm trong `deploy.sh`, không giấu vào thao tác tay.

---

# PR #33 – `ops/v1.0.3-runbook-r3` @ `37e27362` (runbook r3 + `flock` trong `requeue`)

- Người review: SEC · Round 4 (v1.0.3), bước **Review** · 03/11/2026
- Phạm vi: `git diff origin/main...origin/ops/v1.0.3-runbook-r3` (5 tệp, +249/−80), `rounds/round-04/responses/OPS-on-PR32.md` @ `37e27362`, toàn văn runbook r3 (đọc qua `git show`). Tôi không checkout nhánh.
- SEC tự chạy lại trên bản `git archive 37e27362` tạm (đã xóa sau khi chạy):
  - `requeue-email-changed.test.sh`: Mac (không có `flock`) 46/46; `ubuntu:24.04` (có `/usr/bin/flock`, không mạng) 48/48.
  - Test mới chạy trên script của `origin/main`: 45/46, đỏ đúng ca `production without flock refuses`. Vậy test bắt đúng lỗi cũ.
  - `shellcheck -x -S warning` (`v0.10.0`) trên script và test: 0 cảnh báo.
  - gitleaks `v8.21.2` với `.github/gitleaks.toml` trên `origin/main..37e27362`: no leaks found.

## Kết luận PR #33: **ĐẠT CÓ ĐIỀU KIỆN**

- Gộp PR #33: **được**. Không có Blocker hay Major.
- PR32-01 **Closed**. PR32-02 (a) **Closed**. PR32-02 (b) Deferred v1.0.4: SEC chấp nhận. PR32-S3 **Closed**.
- Điều kiện SEC mục 6 (6.1–6.5) đã có đủ trong runbook r3.
- Thẻ mới: 2 Minor (PR33-01, PR33-02), 2 Suggestion. Cả hai Minor chỉ sửa tài liệu. Sửa được bằng một commit tài liệu sau khi gộp, nên không làm đổi `SHA_V103` (P1 cho phép tệp `rounds/` sau `SHA_V103`). **Phải sửa xong trước P0 production.**

## 1. PR32-01: thiếu `flock` thì `REFUSED`

| Kiểm | Trên mã @ `37e27362` | Kết quả |
|---|---|---|
| Có `flock` | `flock -n 9 \|\| die …`, giữ như cũ | Đạt |
| Không có `flock`, không có `RQ_TEST_DC` | `die "flock missing – cannot check state/deploy.lock (install util-linux)"`. Câu này chạy **trước** bước 2 (đọc `current_tag`, `dc ps`), nên không có lời gọi docker hay DB nào. Test kiểm cả hai ý: mã 1 + đúng câu, và không có `calls`/`sql.*` | Đạt |
| Chỉ `RQ_TEST_DC` bỏ qua được | Điều kiện bỏ qua chỉ là `-n RQ_TEST_DC`. Không có biến hay cờ nào khác | Đạt |
| Ca test độc lập với máy | `env -i PATH=<thư mục chỉ có 10 công cụ, không có flock>`. Trên ubuntu có `flock`, ca này vẫn chạy và vẫn xanh | Đạt |
| Đồng bộ với `deploy.sh` | `deploy.sh` dòng 53 `flock -n 9` không điều kiện. Giờ hai script cùng mức chặt | Đạt |
| Runbook | P2b bước 2 có `FLOCK: CO`, bảng dừng P2b có `FLOCK: CO`, R9 + bảng dừng R9 có `flock missing`, README 13.9 cập nhật | Đạt |

**PR32-01: Closed.**

## 2. PR32-02 (a): mục F tách nhánh `via=owner`

- Mục F bước 2 có **Nhánh 1** (đổi bởi OWN mà INV không làm → tài khoản OWN bị lộ: đổi mật khẩu, đăng xuất phiên lạ, báo SEC ngay, SEC quyết `mfa-operator-reset`, **không** khóa người bị đổi) và **Nhánh 2** (`via = self` → INV khóa người đó). Có thêm nhánh "INV cố ý đổi hàng loạt → bước 5". Bảng dừng F và README 13.8 cùng nội dung. Đạt.
- Dấu hiệu nhận nhánh là câu "Thay đổi do chủ cơ sở thực hiện." SEC đã đối chiếu: câu này có trong `email-templates.ts` dòng 148, và chỉ hiện khi `p.via === 'owner'` (dòng 142). Đúng.
- Còn một ca biên chưa có nhánh: người bị đổi chính là **OWN**. Xem thẻ PR33-01.

**PR32-02 (a): Closed** (ca biên tách thành PR33-01, Minor). **(b)** Deferred v1.0.4: SEC chấp nhận vì không đổi `ops-check.sh` sát giờ phát hành.

## 3. Điều kiện SEC mục 6 trong runbook r3

| # | Điều kiện | Chỗ trong r3 | Kết quả |
|---|---|---|---|
| 6.1 | #32 gộp trước khi chốt `SHA_V103` | P0 dòng đầu: #30, #31, #32 và r3 đều đã gộp, `SHA_V103` chứa cả bốn, chốt theo 0.2. P1 đếm merge ≥ 3 | Đạt |
| 6.2 | P2b trên production trước P4/P5: số ≥ 6, `REQUEUE SCRIPT: CO`, `email_changes` có số / `table not present yet` | P2b (thứ tự P2b → P3 → P4 → P5). Bước 2 "Đúng là": số ≥ 6, `REQUEUE SCRIPT: CO`, `FLOCK: CO`. Bước 4: dòng `ok email_changes: … table not present yet …`. FAIL vì hàng đợi kẹt thì dừng | Đạt |
| 6.3 | Staging: ca 6 lần → `FAIL`; R9 hai chiều, ghi số | P0 có 2 gạch đầu dòng. 5.0 "Biên bản bắt buộc" S1 (không `FAIL` thì dừng), S4 (v1.0.2 `REFUSED`), S11–S12 (v1.0.3 `requeued 1`). Có câu "một ô lệch thì diễn tập KHÔNG ĐẠT, P0 không qua" | Đạt |
| 6.4 | K5 còn `table not present` thì dừng, báo SEC | K5 dòng cuối, bảng dừng K1–K7 | Đạt |
| 6.5 | Runbook r3 sửa theo PR32-02 | Mục F (mục 2 ở trên) | Đạt |

## 4. `RQ_TEST_DC` có bật được trên VPS không

- **Production: không.** Kiểm `RQ_TEST_DC` + `is_prod` chạy trước mọi bước khác và thoát mã 2. `is_prod` nhận ra production bằng **một trong ba** dấu hiệu: `APP_ENV=production` trong `.env`, tệp mốc `.ottimo-home` = `production`, hoặc thư mục tên `ottimo-prod`.
  - Bản script dưới `/opt/ottimo-prod` tự lấy `OTTIMO_HOME` từ tệp mốc. Vậy muốn né thì phải đặt `OTTIMO_HOME` khác. Nhưng khi đó cả `state/deploy.lock` lẫn `dc` đều trỏ sang stack khác, không phải production.
  - Thử trỏ `RQ_TEST_DC` vào `dc` của production cũng không tới production: `dc` ưu tiên `OTTIMO_HOME` mà script đã `export`.
  - Lệnh trong runbook là `sudo -n -u ottimo …`. Mặc định `env_reset` của sudo xóa `RQ_TEST_DC` khỏi môi trường người gọi.
  - Có ca test `production refuses the test stub`.
- **Staging (cùng VPS, `/opt/ottimo`): bật được.** `is_prod = 0` nên `RQ_TEST_DC` được nhận. Khi đó script bỏ qua `flock` và thay `dc` bằng một chương trình tùy ý. Ca này đúng với đề xuất gốc của SEC ở PR32-01 ("không phải production"), nên không phải lỗi của OPS. Rủi ro thấp:
  - người làm được việc này đã là `ottimo`/admin;
  - staging chỉ có dữ liệu giả;
  - không có đường nào chạm tới production (xem ý trên).
  
  SEC vẫn đề xuất siết lại (PR33-S1), theo đúng khuôn `mail-test.sh` dòng 43 (từ chối khi thấy tệp mốc).

## 5. Repo công khai: email, IP, bí mật, digest

Tôi quét 254 dòng thêm của diff và đọc toàn văn runbook r3:
- **Email:** chỉ có `info@ottimo.vn` (hộp thư chung công khai, đã có 2 lần ở r2, nhắc INV **không** dùng) và đích SSH `ottimo-admin@desk.ottimo.vn` (tên máy công khai, có từ các runbook trước). Không có địa chỉ cá nhân. Test chỉ dùng `…@example.test`. Đạt.
- **IP VPS:** không có IPv4 nào. Đạt.
- **Bí mật:** không có mật khẩu, khóa, token, URL webhook. Lệnh đổi `.env` (E2, F bước 5) giữ khuôn `umask 077`, không in `.env`. gitleaks sạch (SEC tự chạy). Đạt.
- **Digest:** digest image chỉ ở dạng rút gọn 8 + 4 ký tự (`5138d1ac…1ccb`, `e9f928d9…248c`, `3966b756…45f9`). Không có `sha256:<64 hex>` nào trong lệnh hay văn bản.
  - Hai chuỗi 64 hex còn lại là **băm tệp migration** (`HASH_0091`, và băm 0090 đã có từ r2), không phải digest. Chúng chỉ nằm ở bảng 0.1 và ở "Đúng là" của K2; lệnh K2 vẫn dùng ký hiệu `⟨HASH_0091⟩`.
  - Chuỗi 40 hex là SHA commit (công khai).
  - Lệnh 0.2 đọc artifact vào thư mục tạm, chỉ in rút gọn qua `sed`, rồi xóa thư mục.
  
  Đạt.
- **Ghi chú nhỏ, không thành thẻ:** nếu một dòng của `image-digests.txt` không khớp regex của `sed` (ví dụ có `\r`), `sed` in nguyên dòng ra terminal của ORC. Digest là thông tin công khai và dòng đó không vào repo, nên không phải lộ bí mật. ORC chỉ cần không dán dòng đó vào tài liệu.

## 6. Các bước cần INV đồng ý

| Bước | Ghi trong r3 | Kết quả |
|---|---|---|
| Staging: duyệt `deploy staging` của đúng `CI_RUN` đã chốt | 0.2 bước 4 ("INV đồng ý"), "Việc còn lại" ý 3. Cấm duyệt lượt `351cf073`. P1/R5 dặn không duyệt lượt chỉ có tài liệu | Đạt |
| Production: P2b, P3, P4, P5 | P0 "INV nhắn đồng ý: làm mới gói, sao lưu, Release". Tiêu đề P2b, P3, P5 ghi "sau khi INV đồng ý". Bảng mục 2 có dòng gắn tag + duyệt `production`. Lệnh duyệt P5 có comment `INV approved in chat` | Đạt |
| R9 `--apply` trên production | Tiêu đề R9, bước 2 (ORC hỏi INV, có đồng ý mới làm bước 3), bảng mục 2, bảng dừng R9 ("Chưa có INV đồng ý → không `--apply`"), K2 dòng cuối, R7. Trên staging (5.0) không cần INV: SEC đồng ý, vì đó là dữ liệu giả và là diễn tập | Đạt |
| Ngoài phạm vi hỏi, cũng có ghi rõ | Mục 5 quay lui (R3, R4, R8), mục E bật cảnh báo, F bước 5 đổi ngưỡng (SEC + INV) | Đạt |

## 7. Thẻ feedback mới

### FB-R4-SEC-OPS-PR33-01
- Mức độ: Minor (tài liệu; **sửa trước P0 production**)
- Vị trí: runbook r3 mục F bước 2, các nhánh 1 và 2. README 13.8 dòng "Khi `FAIL`".
- Vấn đề: hai nhánh chỉ xét **ai đổi** (`via`), chưa xét **ai bị đổi**.
  - Ca 1: loại "> 5 lần / một người" rơi vào chính tài khoản **OWN** (INV), `via = self` (không có câu "do chủ cơ sở"), mà INV không làm. Theo chữ hiện tại, ca này vào **Nhánh 2**: "INV khóa tài khoản đó". Tức INV tự khóa tài khoản OWN duy nhất. Thật ra đây là dấu hiệu tài khoản OWN bị lộ, kẻ đó đã qua được S2 (mật khẩu + 2 bước).
  - Ca 2: INV không phân biệt được nhánh. Ví dụ INV chưa có email (trước K8) nên không có thư chứa câu "do chủ cơ sở", mà thông báo trong app không ghi `via`. Hiện runbook chưa nói phải làm gì trong ca này.
- Vì sao quan trọng: làm sai bước ứng phó trong đúng ca nặng nhất (OWN bị chiếm). Cơ sở có thể mất quyền quản trị, hoặc kẻ chiếm tài khoản tiếp tục mà đội không biết.
- Đề xuất sửa (2 câu):
  - Nhánh 1 mở rộng: "đổi bởi OWN **hoặc đổi email của chính tài khoản OWN**, mà INV không làm → tài khoản OWN bị lộ".
  - Thêm một dòng: "**Không chắc nhánh nào** → làm Nhánh 1 (đổi mật khẩu, đăng xuất phiên lạ, báo SEC). Chỉ khóa người khác khi SEC xác nhận." Các bước của Nhánh 1 không gây hại nếu báo nhầm.
  - Sửa README 13.8 cùng nội dung.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR33-02
- Mức độ: Minor (tài liệu; **sửa trước 0.2**, ảnh hưởng tính toàn vẹn của việc chọn image phát hành)
- Vị trí: runbook r3 mục 0.2 bước 3, `gh run list … --jq '.[] | select(.conclusion=="success") …'`.
- Vấn đề: một lượt CI `push` trên `main` dừng ở job `deploy staging` chờ duyệt. Khi đó cả lượt có `status = waiting` và `conclusion` rỗng. SEC đã kiểm bằng `gh run view 41648829367`: `waiting`, conclusion rỗng, dù `gitleaks` và `publish images (GHCR)` đều `completed/success`. Vì vậy lượt CI của commit gộp r3 sẽ **không** hiện trong lệnh lọc. Mà 0.2 lại dặn chỉ duyệt staging **sau** bước này, nên lệnh sẽ ra một lượt cũ hơn, hoặc không ra gì.
  - Phần "Đúng là" (diff từ `351cf073` chỉ có 3 tệp, băm 0091) gần như chắc chắn sẽ bắt được lượt sai. Nên đây là lỗi **an toàn khi hỏng** (runbook dừng), không phải lỗ hổng.
  - Nhưng ORC có thể "sửa nhanh" cho chạy được, ví dụ duyệt staging trước rồi mới kiểm. Như vậy là ngược thứ tự 0.2.
- Vì sao quan trọng: 0.2 là bước chốt image, gói `infra/` và tag cho production. Lệnh phải chọn đúng lượt CI ngay lần đầu, không cần ứng biến.
- Đề xuất sửa: chọn lượt theo `headSha` = commit gộp r3 (`git rev-parse origin/main` ngay sau khi gộp, hoặc SHA merge do ORC ghi). **Không** lọc theo `conclusion` của cả lượt. Sau đó kiểm từng job theo tên như lệnh hiện có (`gitleaks`, `publish images (GHCR)` = `success`), và chấp nhận `deploy staging` = `waiting`. Ví dụ: `gh run list -R $R --branch main --event push -L 10 --json databaseId,headSha,status --jq '.[] | select(.headSha=="<SHA gộp>") | "\(.databaseId) \(.status)"'`. Lượt bị `concurrency` hủy (`cancelled`) thì lấy lượt kế tiếp có `publish images` `success`.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR33-S1
- Mức độ: Suggestion (v1.0.4, gom với PR32-S1/S2)
- Vị trí: `requeue-email-changed.sh` dòng 35 (`RQ_TEST_DC` chỉ bị từ chối khi `is_prod`).
- Vấn đề: trên stack staging cùng VPS (`/opt/ottimo`, tệp mốc `staging`), `RQ_TEST_DC` vẫn được nhận. Khi đó script bỏ qua `flock` và thay `dc` bằng chương trình tùy ý. Không chạm được production (mục 4).
- Đề xuất sửa: từ chối `RQ_TEST_DC` khi `$OTTIMO_HOME/.ottimo-home` tồn tại, hoặc khi có `/opt/ottimo-prod/.ottimo-home` hay `/opt/ottimo/.ottimo-home`. Đây là khuôn của `mail-test.sh` dòng 43. Bộ test hiện dùng `OTTIMO_HOME` tạm không có tệp mốc, nên vẫn chạy được. Thêm 1 ca "staging marker refuses the stub".
- Trạng thái: Open

### FB-R4-SEC-OPS-PR33-S2
- Mức độ: Suggestion (tài liệu)
- Vị trí: runbook r3, ngay sau 0.2 (dòng bắt đầu `---|---|---|`, khoảng 9 dòng).
- Vấn đề: còn sót phần đuôi bảng 0.1 của r2, gồm hướng dẫn cũ ("plan 6.2: **Tài khoản của tôi**", "Dòng log worker mới (nếu có) | PR-1"). Phần này nằm giữa 0.2 và mục 1, trông như một bảng thứ hai. ORC có thể đọc nhầm nguồn giá trị.
- Đề xuất sửa: xóa khối này, hoặc đặt tiêu đề "Cách lấy giá trị (r2, tham khảo)".
- Trạng thái: Open

## 8. Trạng thái thẻ (cập nhật sau PR #33)

| Thẻ | Trạng thái SEC |
|---|---|
| FB-R4-SEC-OPS-PR32-01 | **Closed** |
| FB-R4-SEC-OPS-PR32-02 | (a) **Closed**; (b) Deferred v1.0.4, SEC chấp nhận |
| FB-R4-SEC-OPS-PR32-S1, S2 | Deferred v1.0.4, SEC chấp nhận (rủi ro R8 đã có ở runbook mục 8) |
| FB-R4-SEC-OPS-PR32-S3 | **Closed** |
| SEC PR32 mục 6 (6.1–6.5) | Đã có trong runbook r3. Còn phải **làm** đúng các bước khi phát hành |
| G12 (thứ tự gộp, `SHA_V103` = commit gộp r3) | SEC đồng ý: một commit cho image, gói và tag. Đúng ý 6.1 |
| FB-R4-SEC-OPS-PR33-01, PR33-02 | Open. Sửa trước P0 / 0.2 |

## 9. Điểm làm tốt
- Ca test mới tự dựng `PATH` không có `flock`, nên chạy được ở mọi máy, kể cả CI ubuntu có `flock`. OPS còn chạy test mới trên script cũ để chứng minh test đỏ đúng chỗ. SEC chạy lại cũng ra như vậy.
- OPS tự thấy r3 làm đổi `SHA_V103` (G12) và chọn "một commit cho cả image, gói và tag", thay vì nới P1. Phần "Đúng là" của 0.2 khóa luôn danh sách 3 tệp mã được phép khác.
- Biên bản diễn tập 5.0 S1–S13 để trống cột "Số thật", và cấm ghi "như dự kiến". Nhờ vậy các điều kiện SEC kiểm được bằng số.

---

# PR #33 lượt 2 – đối chiếu runbook r3.1 (QC v1.0.3 ĐK3, phần SEC)

- Người đối chiếu: SEC · 03/11/2026 · Round 4 (v1.0.3), bước **Review** (thực hiện điều kiện QC).
- Đọc: trả lời OPS lượt 2 (`rounds/round-04/responses/OPS-on-PR32.md`, mục "Lượt 2 – review PR #33"); runbook `v1.0.3-release-runbook.md` r3.1 trên `main` (`68064cba`): ghi chú r3.1, mục 0.2, mục F, bảng dừng mục 6 dòng F và 0.2; README `infra/server` 13.8; `bin/requeue-email-changed.sh` + test; biên bản `v1.0.3-staging-drill.md` (S0, D1); QC `v1.0.3-gate.md` 2.6.
- Phạm vi theo runbook: SEC chỉ đối chiếu mục F (và các thẻ SEC khác của PR #33), không duyệt lại cả tệp. `git diff da6d6f3d HEAD` không đổi `product/infra`. Mục F không đổi kể từ commit gộp PR #33 (`da6d6f3d` = `SHA_V103`), nên bản SEC đọc là bản sẽ dùng khi Release. Lúc SEC đọc, OPS đang sửa runbook (r3.2, ĐK8, chưa commit). SEC đã so: mục 0.2, mục F và dòng F của bảng dừng ở bản đang sửa giống hệt `HEAD`. Phần r3.2 SEC sẽ đọc ở lượt ĐK8.
- SEC tự chạy trên `main` (máy trạm): `requeue-email-changed.test.sh` **47/47** (Mac, không `flock`), có ca `staging marker refuses the test stub`.

## Kết luận từng thẻ

| Thẻ | Đối chiếu trên `main` | Trạng thái SEC |
|---|---|---|
| **FB-R4-SEC-OPS-PR33-01** (Minor, nhánh OWN) | Mục F bước 2. **Nhánh 1** gồm hai ca, cả hai khi INV không làm: (a) đổi **bởi OWN**; (b) email **của chính tài khoản OWN** bị đổi, kể cả `via = self`. Có dòng **"Không chắc nhánh nào → làm Nhánh 1"**, kèm đúng ví dụ SEC nêu (INV chưa có email, thông báo trong app không ghi `via`). Chỉ khóa người khác khi SEC xác nhận. **Nhánh 2** chỉ còn cho nhân viên không phải OWN tự đổi. Có câu "**Không bao giờ** để INV tự khóa tài khoản OWN", việc với tài khoản OWN do SEC quyết. Bảng dừng mục 6 dòng F và README 13.8 cùng nội dung, không mâu thuẫn. Thông báo `account_security_change` đến ngay, không qua hàng đợi thư, nên INV vẫn có dấu hiệu nhận nhánh khi hàng đợi trễ | **Closed** |
| **FB-R4-SEC-OPS-PR33-02** (Minor, chọn lượt CI ở 0.2) | 0.2 bước 3: ghim `mergeCommit` của PR #33 (`state == MERGED`, `merge-base --is-ancestor` trên `origin/main`). Chọn lượt bằng `gh run list … --commit "$S"`. Kiểm theo **job** (`gitleaks`, `publish images (GHCR)` = `completed success`, `deploy staging` = `waiting`), **không** lọc `conclusion` của cả lượt. `test -n` dừng chuỗi lệnh khi không có lượt. Bước 1 cấm push lên `main` tới khi `CI_RUN` `completed success`. Bước 5 xử lý lượt bị hủy (rerun, đọc lại digest). Digest chỉ in 8 + 4 qua `sed -nE …p`. QC 2.1 ghi 0.2 đã chạy đúng trên thực tế (`CI_RUN` 41660661788, `TAG12` của commit gộp) | **Closed** |
| **FB-R4-SEC-OPS-PR33-S1** (Suggestion) | `requeue-email-changed.sh` từ chối `RQ_TEST_DC` (mã 2) khi có `$OTTIMO_HOME/.ottimo-home`, `/opt/ottimo-prod/.ottimo-home` hoặc `/opt/ottimo/.ottimo-home`, theo khuôn `mail-test.sh`. Kiểm này chạy trước `flock`, `dc` và mọi truy vấn. Vậy trên VPS (cả staging) biến này không còn bỏ qua được `flock` hay thay được `dc`. Ca test mới xanh | **Closed** |
| **FB-R4-SEC-OPS-PR33-S2** (Suggestion) | Phần đuôi bảng 0.1 của r2 sau 0.2 đã xóa: `grep` không còn dòng "plan 6.2: **Tài khoản của tôi**" hay bảng thứ hai giữa 0.2 và mục 1 | **Closed** |

Phần SEC của ĐK3 đã xong: 4 thẻ PR #33 của SEC đều **Closed**. Thẻ PR #32 giữ như mục 8 ở trên (01, 02a, S3 Closed; 02b, S1, S2 Deferred v1.0.4, SEC chấp nhận). OPS còn phải sửa dòng "Trạng thái" đầu runbook: dòng này vẫn ghi "chờ … SEC đối chiếu mục F". Việc này thuộc OPS (ĐK3), SEC không sửa.

## Điểm lệch D1 (QC gate 2.6)

**SEC đồng ý với quyết định "Chấp nhận" của QC cho D1.** Lần deploy staging đầu của `TAG12` không kiểm digest, vì job `deploy staging` không gửi digest. Nhưng OPS đã đối chiếu digest image trên máy với artifact `image-digests` của `CI_RUN` và bảng 0.1, và hai bên trùng nhau. Phép kiểm sau này có giá trị tương đương. Lần lên lại (S9b) cũng đã qua `deploy-from-ci.sh` có kiểm digest, rồi ghi `state/digests/⟨TAG12⟩`. Production không gặp ca này: production guard của `deploy.sh` từ chối khi không có digest, và Release luôn gửi kèm digest. SEC ủng hộ việc ở ĐK15: cho job `deploy staging` gửi kèm digest từ v1.0.4, để staging kiểm digest ngay từ lần đầu, không phụ thuộc vào việc tag trên GHCR có bị đổi hay không.

## Thẻ mới (không chặn)

### FB-R4-SEC-OPS-PR33-S3
- Mức độ: Suggestion (tài liệu; gộp vào r3.2 nếu OPS đang sửa runbook cho ĐK8, nếu không thì để v1.0.4)
- Vị trí: runbook mục F bước 2, Nhánh 1 ca (b); README 13.8 dòng "Khi `FAIL`".
- Vấn đề: ca (b) là kẻ chiếm tài khoản OWN đã đổi email của OWN. Nhánh 1 hiện chỉ dặn đổi mật khẩu và đăng xuất phiên lạ. Có hai chỗ còn hở:
  - Chưa dặn **đặt lại email của OWN** về địa chỉ đúng. Nếu không làm, các thư bảo mật sau đó (gồm thư báo đổi mật khẩu) vẫn đi tới địa chỉ do kẻ đó đặt.
  - Chưa nói phải làm gì khi INV **không đăng nhập được** (kẻ đó đã đổi cả mật khẩu).
- Vì sao quan trọng: đây là ca nặng nhất của mục F. Nếu thiếu hai bước này, kẻ chiếm vẫn nhận được thư bảo mật, còn INV thì không biết cần gọi ai.
- Đề xuất sửa: thêm vào Nhánh 1 hai câu.
  - "Ca (b): sau khi đổi mật khẩu, INV nhập lại email của mình ở **Bảo mật tài khoản**."
  - "Không đăng nhập được: báo ORC ngay. SEC quyết việc đặt lại theo thủ tục xác minh danh tính (`mfa-operator-reset`, ESC-027 B). INV không tự thử nhiều lần."
  - README 13.8 sửa cùng nội dung.
- Trạng thái: Open

---

# Runbook r3.2 – SEC đọc lại (QC v1.0.3 ĐK8)

- Người đọc: SEC · 03/11/2026 · Round 4 (v1.0.3), bước **Review** (thực hiện điều kiện QC).
- Bản đọc: `v1.0.3-release-runbook.md` r3.2 **trong thư mục làm việc** (OPS chưa commit; `git diff` so với `HEAD` `68064cba`). Chỉ đọc các chỗ r3.2 đổi: ghi chú r3.2 + dòng "Trạng thái"; K5b; K8 bước 2a; E1 dòng 4b; mục F Nhánh 1 ca (b); R7 (D3). Đọc thêm `git diff` của `v1.0.2-rollback-drill-staging.md`.
- Đối chiếu mã tại `main` (`product/` không đổi từ `SHA_V103`): `security-email.controller.ts` (`setMyEmail`), `security-email.service.ts` (`check`), `strong-reauth.ts`, `password-reauth.ts` (`REAUTH_MAX_FAILURES = 5`, `REAUTH_LOCK_MS = 15 phút`), `main.ts` (`emailFrom` lấy từ `EMAIL_FROM`), `ops-check.sh` (`email_dead`), `deploy.sh` / `deploy-from-ci.sh` (kiểm dạng digest).

## Kết luận: **ĐẠT**. SEC đồng ý r3.2 cho P0, kể cả K8 bước 2a trên tài khoản OWN duy nhất

Không có Blocker, Major hay Minor. Có 1 Suggestion mới (S4), sửa chữ, không chặn.

| Chỗ | SEC kiểm | Kết quả |
|---|---|---|
| **K5b** | Giá trị `EMAIL_FROM` chỉ nằm trong biến `V` trên máy chủ. Lệnh chỉ in `EMAIL_FROM_SHARED=<số>`, không `echo` biến, không `docker inspect`, không `dc config`. `printenv` trả 1 (biến không có) thì đếm `0`. Mọi lỗi khác (`dc exec`, `sudo`) in `ERR`, không in `0`. Phép đếm giống gate 2.7, khớp cả dạng `Tên <…>`. `api` dùng đúng biến này cho luật hộp thư chung (`main.ts` → `IdentityOptions.emailFrom` → `mailboxAddress`). Nhánh `0` và `ERR` đều bỏ bước 2a và nhắc INV không nhập `info@`. Đó là hướng an toàn. Mà `info@ottimo.vn` là địa chỉ công khai của cơ sở, không phải bí mật | Đạt |
| **K8 bước 2a – không ghi, không tiêu S2** (luật bật) | Thứ tự trong `setMyEmail`: replay khóa → `parseBody` → `securityEmail.check` (422 `EMAIL_SHARED_MAILBOX`) → **sau đó** mới đến `strong.verify`. Vậy với luật bật, mật khẩu sai và `000000` **không hề được kiểm**. Không tăng bộ đếm, không có dòng audit, không ghi `user_email_change`, không có thư. Lỗi ném ra trước `uow.run`, nên khóa idempotency không bị lưu và bước 3 không bị trả lời cũ | Đạt |
| **K8 bước 2a – không thể khóa tài khoản OWN** (luật tắt, ra 401) | `strong-reauth.ts`: mật khẩu sai thì `consumeSecondFactor` **không chạy**, nên `000000` không tiêu bước TOTP nào. Ca này chỉ cộng 1 vào bộ đếm S2 và ghi 1 dòng audit `stepup.s2_failed`. Tới 5 lần sai thì **khóa tạm S2 15 phút** (`approval_pin_locked_until`). Khóa này chỉ chặn thao tác cần S2, không chặn đăng nhập: đường đăng nhập không đọc cột này. Tài khoản không bị vô hiệu hóa. Lần S2 đúng ở bước 3 đưa bộ đếm về 0. Runbook giới hạn **đúng một** lần thử, cấm thử `info@` với mật khẩu và mã đúng (bước 5), và có lựa chọn "bỏ qua" (bước 7). Vì vậy trường hợp xấu nhất là S2 bị khóa 15 phút, không phải mất tài khoản OWN | Đạt (xem S4 về chữ) |
| K8 bước 2a – dữ liệu | INV chỉ nhắn một câu cố định, không gửi ảnh. Không có địa chỉ riêng nào trong lệnh hay chat. K9 giữ nguyên số kỳ vọng: đúng, vì `user_email_change` và `email_changes` không đổi trong cả hai ca | Đạt |
| **E1 dòng 4b** | Chạy qua `SQLRO` (`default_transaction_read_only=on`, dòng đầu phải là `on`). Chỉ `SELECT count(*)`, không đọc `payload`, không chọn cột có địa chỉ hay id. Điều kiện giống `ops-check email_dead` (`topic`, `status = 'dead'`, `last_error = 'NO_RECIPIENT'`), chỉ thay cửa sổ 24 giờ bằng mốc `created_at >= ⟨GIO_T⟩`. Câu lỗi thì dừng, không coi là `0`. Kết quả > 0 thì không bật. Ý (c) (`email_changes` không `FAIL`, `email_ascii` = 0) có ở cùng lệnh | Đạt |
| **Mục F Nhánh 1 ca (b)** (thẻ S3) | Có đủ hai bước SEC đề xuất. (1) Sau khi đổi mật khẩu, INV nhập lại email ở **Bảo mật tài khoản**, không dán địa chỉ vào chat, kèm lý do. (2) Không đăng nhập được thì báo ORC ngay, SEC quyết theo `mfa-operator-reset` (ESC-027 B), INV không tự thử nhiều lần. Các câu cũ giữ nguyên: không khóa người bị đổi, không bao giờ để INV tự khóa OWN, không chắc nhánh nào thì làm Nhánh 1 | Đạt |
| **R7 (D3)** | Câu báo lễ tân đúng với quyết định QC 2.6. Mã thô `user.email_changed` trên PWA v1.0.2 chỉ là lỗi hiển thị, không lộ địa chỉ, không sai quyền. Lễ tân không chụp gửi ảnh | Đạt |
| **Trạng thái đầu runbook** (ĐK3, phần OPS) | Đã ghi SEC đóng PR33-01, 02, S1, S2 và đồng ý D1. Phần "SEC đọc lại 2a và F (b): chờ" sẽ được đóng bằng mục này. ORC hoặc OPS sửa chữ khi commit | Ghi nhận |
| **`v1.0.2-rollback-drill-staging.md`** | Hai lệnh cũ chuyển sang dạng 8 + 4 ký tự, có ghi chú "lúc chạy đã truyền digest đủ" và cách làm lần sau. Ai chép lại lệnh rút gọn thì cũng an toàn: `deploy.sh` (dòng 45) và `deploy-from-ci.sh` (`dg='sha256:[0-9a-f]{64}'`) từ chối trước khi làm gì. Lịch sử git vẫn còn bản đầy đủ. Digest image không phải bí mật, và `gitleaks.toml` đã cho phép đúng các giá trị lịch sử. Không cần viết lại lịch sử | Đạt |

## Trạng thái thẻ

| Thẻ | Trạng thái SEC |
|---|---|
| FB-R4-SEC-OPS-PR33-S3 | **Closed** cho phần runbook (bản dùng khi Release). Phần README 13.8 cùng nội dung chưa sửa, vì lượt này không đổi `product/`. Phần đó **Deferred v1.0.4** (hoặc PR tài liệu riêng), SEC chấp nhận: mục F của runbook là bản ORC/INV dùng khi có sự cố, README 13.8 chỉ trỏ về mục này |
| FB-R4-SEC-OPS-PR33-S4 (mới) | Open, Suggestion, không chặn |

### FB-R4-SEC-OPS-PR33-S4
- Mức độ: Suggestion (chữ trong runbook; sửa ngay trong r3.2 nếu tiện, không cần SEC đọc lại)
- Vị trí: runbook K8 bước 2a ý 4 (ca 401).
- Vấn đề: ý 4 ghi "Không có gì được ghi, chỉ đếm 1 lần sai". Mã thật (`strong-reauth.ts`) còn ghi **1 dòng audit `stepup.s2_failed`**. Bộ đếm S2 cũng không reset theo thời gian, chỉ về 0 khi có một lần S2 đúng. Nếu trước đó INV đã có 4 lần sai S2 chưa được xóa bởi lần đúng nào, thì lần thử này gây **khóa tạm S2 15 phút** kèm thông báo `security_alert`. Khi đó bước 3 sẽ báo khóa, mà runbook chưa nói phải làm gì.
- Vì sao quan trọng: không gây hại (chỉ là dấu vết audit, khóa tạm, đăng nhập vẫn được). Nhưng ORC hoặc INV có thể tưởng là sự cố, hoặc thử lại nhiều lần trong lúc S2 đang bị khóa.
- Đề xuất sửa: ý 4 đổi thành "…không lưu email, không thư; chỉ ghi 1 dòng audit `stepup.s2_failed` và đếm 1 lần sai". Thêm một câu: "Bước 3 báo khóa tạm: đợi 15 phút rồi làm bước 3, không thử lại trong lúc khóa".
- Trạng thái: Open

**Dòng đồng ý (ĐK8):** SEC đồng ý runbook r3.2 (K5b, K8 bước 2a, E1 dòng 4b, mục F Nhánh 1 ca (b), R7) để vào P0. K8 bước 2a an toàn trên tài khoản OWN duy nhất: luật bật thì 422 trả về trước S2, không tiêu yếu tố nào, không ghi gì. Luật tắt thì xấu nhất là S2 bị khóa tạm 15 phút, không khóa đăng nhập hay tài khoản. S4 không phải điều kiện.
