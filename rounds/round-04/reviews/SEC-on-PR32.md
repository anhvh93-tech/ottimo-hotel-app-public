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
