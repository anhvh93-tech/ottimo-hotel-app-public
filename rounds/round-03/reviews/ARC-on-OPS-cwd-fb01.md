# ARC review OPS – ops-check/`bin/dc` chạy từ thư mục bất kỳ + kiểm byte trang privacy khi deploy landing (FB-01)

- Người review: ARC | Round 3 – bước **Review** | Ngày: 31/10/2026
- Đối tượng: PR #18 `ops/ops-check-cwd-fb01`, head `f5e76e7f`, so với `bad2fe4b` (10 tệp, +346/−18). `main` hiện tại (`e7e60620`) chỉ khác PR ở phần tài liệu, gộp không xung đột.
- Đọc trước: `reviews/ARC-on-OPS-us155-enable.md` (FB-01, FB-04), `responses/OPS-us155-enable.md` (trên nhánh), `bin/publish-privacy-notice.sh` (định dạng `state/privacy-notice.log`), `bin/deploy.sh`, `bin/deploy-from-ci.sh`, `docker-compose.prod.yml` (profile `landing`).
- Cách review:
  - Đọc diff.
  - Chạy cả 2 test trên Mac (Docker Desktop, user thường): `ops-check-cwd.test.sh` **6/6**, `deploy-landing-privacy.test.sh` **9/9**.
  - Thử gỡ bản sửa: bỏ `cd /` ở `ops-check.sh` và dòng đổi thư mục ở `bin/dc` thì ca 1 và ca 2 **đỏ**, đúng lỗi 30/10 (`permission denied` → FAIL). Test bắt được lỗi cũ.
  - Gộp thử với nhánh `ops-check-no-recipient` (`212cda0a`) bằng `git merge-tree`. Chạy `test-ops-check.sh` (15/15) và `ops-check-cwd.test.sh` (6/6) trên cây đã gộp.
  - Gộp thử với PR #16 (`be/gchat-booking-notify`): không xung đột.
  - CI của PR: 7 job xanh, gồm `infra scripts (shellcheck)` chạy 2 test mới. Job `docker images build · E2E smoke` còn chạy lúc review.
  - Không đăng lên PR, không gộp, không commit.

## Kết luận: **Duyệt – gộp được ngay**

Không có Blocker, không có Major. Cả hai phần làm đúng việc được giao. Test bắt đúng lỗi thật. So với trước, PR chặt hơn ở mọi điểm: trước đây chỉ có kiểm tay, và lỗi `docker compose` bị che thành "not running".

- **Lệch đề xuất 1** (nguồn so là log, không phải DB; mất log thì cho qua): **chấp nhận cho v1.0**. Kèm thẻ CWD-02 (Minor, làm cùng FB-04 ở `v1.0.1`).
- **Lệch đề xuất 2** (`LANDING_PUBLIC_API` ≠ `on` thì chỉ cảnh báo): **chấp nhận**. Lý do ở mục 2.
- **`check_j16` gửi nguyên văn dòng lỗi đầu**: **đồng ý dời `v1.0.1`**, xem thẻ CWD-03. Thẻ này phải gồm cả `email_dead` của nhánh `ops-check-no-recipient`, vì nhánh đó có cùng mẫu lỗi.
- **FB-R3-ARC-OPS-US155-01**: ARC xác nhận **Done**. Thẻ đóng hẳn sau 2 việc kiểm trên máy chủ ở mục 4. Đây là việc vận hành sau khi gộp, không phải điều kiện để gộp.
- **FB-R3-ARC-OPS-US155-04**: vẫn `v1.0.1`. Quy trình tạm trong README 12.3 ("chạy bước 6 ngay sau deploy, cùng phiên SSH, ngoài giờ cao điểm") **đúng ý ARC**.

## 1. Phần (1) – `bin/dc` / `ops-check.sh` từ thư mục bất kỳ

| Điểm kiểm | Cài đặt | Kết quả |
|---|---|---|
| Nguyên nhân 30/10 23:39 | `docker compose` stat thư mục hiện tại kể cả khi có `--project-directory`. Home `ottimo-admin` (0750) thì user `ottimo` không vào được | Đúng. Tái hiện được bằng test khi gỡ bản sửa |
| `ops-check.sh` | `cd /` ngay sau khi tính `here` (đường dẫn tuyệt đối). Mọi đường dẫn sau đó đều tuyệt đối (`$OTTIMO_HOME`, `$state`) | Đúng |
| `bin/dc` | Chỉ đổi sang `/` khi thư mục hiện tại không `-x` hoặc không `-r`. Thư mục dùng được thì giữ nguyên, để đường dẫn tương đối gõ tay vẫn chạy | Đúng, hợp lý hơn `cd /` vô điều kiện |
| Phân loại lỗi compose | `containers` và `http5xx`: lỗi `dc` thì báo `docker compose failed, container state unknown: <loại>`. Có 4 loại cố định, không báo "not running". Container dừng thật vẫn báo `not running: worker` (ca 5) | Đúng |
| Không gửi nguyên văn ra webhook | stderr ghi vào `state/ops-check/compose.stderr` (0600). Tin gửi đi chỉ có tên loại lỗi. Ca 4 kiểm cả stdout và tệp trạng thái không chứa `secret-token` | Đúng |
| Đếm bản `api` | Đếm từ cùng lần `ps` của vòng lặp, bỏ lần gọi `dc ps` thứ hai (lần gọi đó nuốt lỗi) | Đúng, bớt một lần gọi |
| `http5xx` | Trước: `dc logs` lỗi thì ra `0`, coi là **OK im lặng**. Nay: lỗi thì FAIL có loại lỗi | Đúng. Đây là lỗi che giấu cũ, PR sửa luôn. Cần kiểm trên máy chủ (mục 4, việc 1) |
| `deploy-from-ci.sh` | Bước mới tên `privacy` qua được bộ lọc `tr -cd 'a-z-'`, CI in `step=privacy` | Đúng |
| Runbook B2, v1-production | Thêm `cd /` trước các lệnh `sudo -u ottimo …` cho tới khi làm mới bundle | Đúng. Nên giữ thói quen này cả sau khi làm mới bundle |

## 2. Phần (2) – FB-01: bước `privacy` của `deploy-landing.sh`

| Yêu cầu FB-01 | Cài đặt | Kết quả |
|---|---|---|
| Kiểm trước khi đổi container | Bước `privacy` sau `pull` + kiểm digest, trước `switch`. Bị từ chối thì không đổi container, không ghi `landing_tag` hay `deploy-history` (ca 2 kiểm cả 3) | Đúng |
| Đọc image **mới**, offline | `docker run --rm --pull never --network none --entrypoint sh`, `tar` 2 tệp ra thư mục tạm, băm phía host | Đúng |
| Version in trên trang | Cùng mẫu với `publish-privacy-notice.sh` ("Version …" / "Phiên bản …"), phải đúng một giá trị | Đúng, xem CWD-01 |
| Cùng version khác byte → từ chối | So với **mọi** dòng `apply … rc=0`, không giới hạn 7 ngày | Chặt hơn đề xuất ("đang hiệu lực hoặc thay trong 7 ngày") và khớp bất biến erd 4.14. **Đồng ý** |
| Cả `--rollback` | Ca 4 | Đúng |
| Version mới → cho qua + nhắc chạy bước 6 | Ca 5 | Đúng |
| Dòng chạy thử và lượt ghi lỗi không tính | awk lọc `$2 == "apply" && $NF == "rc=0"` | Đúng. Ca 8 dựng đúng định dạng log thật (có dòng `psql` thụt lề) |
| Phân tích log | Các trường `operator`, `version`, `landing`, `digest` đều được `publish-privacy-notice.sh` kiểm bằng regex, không có khoảng trắng. Trường `digest` rỗng chỉ tạo hai dấu cách liền nhau, awk vẫn tách đúng | An toàn |
| `--check-only` | Kiểm cấu hình + kéo image + digest + privacy, rồi dừng. Production vẫn bắt buộc `--digest`. Thay việc băm tay trước khi INV duyệt | Đúng. Lưu ý: chế độ này vẫn kéo image về máy, nhưng không đổi container và không ghi trạng thái |
| `trap … EXIT` | Script không có trap EXIT nào khác, nên trap mới không ghi đè gì | Đúng |

**Lệch 1 – so với log, không đọc DB.** Chấp nhận cho v1.0, vì 3 lý do:
- (a) Mọi lần ghi bảng `privacy_notice_version` đều qua `publish-privacy-notice.sh`. Công cụ này ghi một dòng `rc=0` đúng khi DB đã có dòng khớp băm (lúc chèn mới hoặc "already present"). Hai nguồn vì vậy tương đương.
- (b) `deploy-landing.sh` không phụ thuộc postgres. Nếu đọc DB, landing (trang công khai) lại chỉ deploy được khi DB của app sống.
- (c) Phạm vi "mọi version từng ghi" của log chặt hơn truy vấn 7 ngày ARC đã đề xuất.

Rủi ro còn lại: log **không có trong bản sao lưu** (`backup.sh` chỉ lấy `pg_dump` + kho tệp). Dựng lại máy chủ từ sao lưu thì DB còn dòng version mà log rỗng, kiểm thành "cho qua". Cách xử lý ở thẻ CWD-02.

**Lệch 2 – proxy đóng thì chỉ cảnh báo.** Chấp nhận. Đã kiểm 3 điều:
- (a) Proxy đóng thì khách không gửi được đồng ý qua form, nên byte trang lúc đó không đi vào bằng chứng `consent_version`.
- (b) Container landing chỉ được dựng lại qua `deploy-landing.sh`. Service `landing` nằm trong profile `landing`, còn `deploy.sh` chỉ dựng `api worker web`. Muốn mở lại proxy thì phải đặt `LANDING_PUBLIC_API=on` rồi chạy `deploy-landing.sh`. Lúc đó bước `privacy` chạy với `on` và **từ chối** nếu byte vẫn lệch. Đường mở lại vì vậy vẫn được chặn.
- (c) Không có ngoại lệ này thì quay lui (c) README 12.3 (về bản không form) có thể bị chính bước kiểm chặn, đúng lúc cần gỡ nhanh.

Còn một đường vòng: gõ tay `bin/dc --profile landing up landing` sau khi sửa `.env`. README chỉ ghi đường qua `deploy-landing.sh`. `--verify` của FB-04 (`v1.0.1`) sẽ bắt nốt trường hợp này.

## 3. Thẻ feedback

### FB-R3-ARC-OPS-CWD-01
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/deploy-landing.sh`, hàm `privacy_check`: nhánh `rc -eq 4` (image không có 2 trang) và nhánh `[ -z "$v" ]` ("not exactly one version printed" → `continue`).
- Vấn đề: hai nhánh này **cho qua** bất kể trạng thái proxy. Khi `LANDING_PUBLIC_API=on` (form đang mở), image mất trang privacy, hoặc trang in 0 hay 2 version, vẫn deploy được. Với locale đó, phép so byte bị bỏ qua hoàn toàn. Kiểm như vậy là "mở khi lỗi", trong khi bất biến erd 4.14 cần "đóng khi lỗi". Không có ca test nào cho trường hợp `on` + thiếu trang hoặc thiếu version.
- Vì sao quan trọng: một lỗi build hay sửa chữ làm mất dòng "Version …" sẽ khiến khách đồng ý với một trang không đối chiếu được, đúng lúc form đang nhận yêu cầu thật. `publish-privacy-notice.sh` chỉ phát hiện ra **sau** khi trang đã lên.
- Đề xuất sửa: khi `LANDING_PUBLIC_API=on`, cả hai nhánh là `FAIL` (không đổi container). Khi proxy đóng, giữ như hiện tại (ghi chú hoặc WARNING), để không chặn quay lui (c). Thêm 2 ca test: `on` + `nopages` → từ chối; `on` + trang không in version → từ chối. Có thể làm ngay trong PR này. Nếu không, phải xong trước lượt landing kế tiếp có sửa trang privacy, hoặc ở `v1.0.1`, tùy cái nào tới trước.
- Trạng thái: Open

### FB-R3-ARC-OPS-CWD-02
- Mức độ: Minor
- Vị trí: `bin/deploy-landing.sh` (nguồn so = `state/privacy-notice.log`); `bin/backup.sh` (không chép `state/`); README 12.3 dòng "Mất tệp này thì kiểm coi như chưa có version nào".
- Vấn đề: ARC chấp nhận lệch 1 (mục 2). Nhưng khi mất log, ví dụ dựng lại VPS từ sao lưu hoặc ai đó xóa `state/`, bước kiểm âm thầm thành "chưa có version nào". Lúc đó cùng version khác byte đi qua, và hệ thống chỉ in dòng nhắc chạy bước 6. Log không nằm trong bản sao lưu off-site.
- Vì sao quan trọng: đó đúng là tình huống FB-01 muốn chặn (băm lệch âm thầm). Mất log lại thường xảy ra sau sự cố, khi đội đang bận khôi phục.
- Đề xuất sửa (`v1.0.1`, làm cùng FB-04 vì lúc đó `publish-privacy-notice.sh` có thêm `--candidate-digest` và `--verify`):
  1. `backup.sh` thêm `state/privacy-notice.log` vào gói mã hóa. Tệp chỉ chứa mã nhân viên, băm và tag, không có dữ liệu khách. `restore-drill.sh` kiểm thêm tệp này có trong gói.
  2. Trong `deploy-landing.sh`, khi log **không tồn tại** mà `LANDING_PUBLIC_API=on`, in WARNING riêng, khác thông báo "not published yet": "không có `state/privacy-notice.log` – nếu stack này đã từng ghi version, khôi phục log từ sao lưu hoặc chạy `publish-privacy-notice.sh` chạy thử để đối chiếu DB trước khi INV duyệt". Làm được ngay, khoảng 3 dòng.
  3. (Tùy chọn) Khi version "chưa có trong log" và postgres đang chạy, đọc DB chỉ đọc (`psql_admin` như `deploy.sh`) để đối chiếu thêm. DB không trả lời thì giữ hành vi hiện tại.
- Trạng thái: Open

### FB-R3-ARC-OPS-CWD-03
- Mức độ: Minor
- Vị trí: `bin/ops-check.sh` `check_j16` (`notify j16 FAIL "query failed: $(head -n 1 <<<"$out")"`). Sau khi gộp nhánh `ops-check-no-recipient`: `check_email_dead`, cùng mẫu.
- Vấn đề: `psql_admin` đi qua `dc exec`. Khi `.env` hỏng cú pháp, dòng lỗi đầu là lỗi đọc `.env` của compose, có thể trích nguyên một dòng `.env` (ví dụ `ALERT_WEBHOOK_URL=…`, `HEARTBEAT_URL=…`). Dòng này đi vào journal và webhook. PR đã sửa đúng lỗi này cho `containers`/`http5xx`, nhưng chưa sửa cho 2 kiểm dùng DB.
- Vì sao quan trọng: rủi ro thấp. `cd /` đã loại nguyên nhân phổ biến nhất, webhook là phòng Chat của INV/OPS, journal chỉ root đọc. Nhưng đây là cùng một loại lỗi, nên sửa một lần cho mọi kiểm.
- Đề xuất sửa (`v1.0.1`, đồng ý với OPS): tách hàm chung `cmd_failed <label>` từ `compose_failed`, phân loại thêm `could not connect` → "database unreachable", `ERROR:` → "query error". Dùng hàm này cho `j16` và `email_dead`. Thêm ca test `.env` hỏng cho `j16` (fake `dc` của `ops-check-cwd.test.sh` dùng lại được).
- Trạng thái: Open

### FB-R3-ARC-OPS-CWD-04
- Mức độ: Suggestion
- Vị trí: `bin/ops-check.sh` (`compose_err` cố định); `bin/deploy-landing.sh` (`docker run` trong `privacy_check`); `test/ops-check-cwd.test.sh` (chạy bằng root thì `exit 0`).
- Vấn đề / Đề xuất:
  1. `state/ops-check/compose.stderr` là tệp chung. Timer và lượt chạy tay chạy cùng lúc có thể phân loại nhầm lỗi của nhau. Lỗi cuối cùng (có thể chứa một dòng `.env`) cũng nằm lại trên đĩa. Nên dùng `mktemp` (0600) cho mỗi lần chạy, xóa trong `trap EXIT`.
  2. `docker run` đọc trang privacy: thêm `--cap-drop ALL --security-opt no-new-privileges --read-only --user 65534`. Image đã qua kiểm digest nên rủi ro thấp; đây chỉ là phòng thủ nhiều lớp và không tốn gì.
  3. Test bỏ qua bằng `exit 0` khi chạy bằng root. Nên `exit 0` kèm dòng `SKIP` rõ ràng trong CI (runner GitHub không chạy root nên hiện vẫn đúng), hoặc chạy lại bằng `sudo -u nobody`.
- Trạng thái: Open

## 4. Việc OPS làm sau khi gộp (đóng FB-01, xác nhận phần 1)

Đây không phải điều kiện để gộp, nhưng phải xong trước lượt landing kế tiếp:
1. Làm mới bundle `infra/` trên staging rồi production. Từ home của `ottimo-admin` (cố ý **không** `cd /`), chạy `sudo -u ottimo /opt/ottimo-prod/infra/server/bin/ops-check.sh containers http5xx`. Kết quả phải là 2 dòng `ok`. Việc này xác nhận cả bản sửa thư mục lẫn việc `dc logs web landing` (service thuộc profile) không lỗi: từ nay `http5xx` không còn nuốt lỗi.
2. Trên production: `deploy-landing.sh <tag landing đang chạy> --digest sha256:… --check-only` phải in `en … (same bytes as published)` và `vi … (same bytes as published)`. Dán 2 dòng đó (không có IP) vào `outputs/OPS/v1-production.md`.

## 5. Gộp với nhánh `ops-check-no-recipient` (`212cda0a`)

Đã gộp thử bằng `git merge-tree`:
- `ops-check.sh` và `.github/workflows/ci.yml`: **tự gộp**, `bash -n` sạch. `test-ops-check.sh` 15/15 và `ops-check-cwd.test.sh` 6/6 trên cây đã gộp.
- `product/infra/server/README.md` mục 7: **xung đột một chỗ**. Hai nhánh cùng sửa vùng dòng "- Chạy tay: …". Cách gỡ: giữ **cả hai**, theo thứ tự:
  1. dòng `- \`email_dead\` (BUG-R3-032, …)` của nhánh `ops-check-no-recipient`;
  2. dòng `- Chạy tay: …` **bản dài của PR #18** (có `cd / && sudo -u ottimo …`, mô tả `docker compose failed …`, tên test). Bỏ bản ngắn cũ.
- Sau khi gộp cả hai: cập nhật dòng "Kiểm tra 30 phút/lần" ở README mục 7, thêm `email_dead` vào danh sách kiểm. Nhánh no-recipient chưa làm việc này. Thẻ CWD-03 phải phủ cả `check_email_dead`.
- Thứ tự gộp: không bắt buộc. Đề xuất gộp PR #18 trước (sửa cảnh báo giả đang ảnh hưởng vận hành), rồi rebase `ops-check-no-recipient` lên `main` và gỡ README như trên.

## 6. Đề xuất ghi decision-log (ORC ghi khi commit)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 31/10/2026 | 3 | Bước `privacy` của `deploy-landing.sh` so với `state/privacy-notice.log` (không đọc DB) cho v1.0. Cùng version khác byte thì từ chối với **mọi** version từng ghi `rc=0`, kể cả `--rollback`. Riêng khi `LANDING_PUBLIC_API` ≠ `on` thì chỉ WARNING | ARC | Mọi lần ghi bảng đều qua `publish-privacy-notice.sh`. Landing không phụ thuộc DB app. Proxy đóng thì không có đồng ý mới, và đường mở lại proxy đi qua chính bước kiểm. Rủi ro mất log xử lý ở `v1.0.1` (CWD-02) |

## 7. Điểm làm tốt

- Test có giá trị thật. Gỡ bản sửa thì test đỏ đúng lỗi 30/10. Test FB-01 dựng image giả `FROM alpine` và log giống hệt định dạng thật, có cả dòng chạy thử và lượt ghi lỗi, không cần stack.
- Lỗi compose được tách khỏi "container dừng" và chỉ gửi đi loại lỗi cố định. Nhờ đó PR sửa luôn một lỗi che giấu cũ: `http5xx` trước đây báo OK khi `dc logs` hỏng.
- `--check-only` thay việc băm tay trước khi INV duyệt bằng đúng đoạn mã sẽ chạy lúc deploy. Bỏ được một bước thủ công dễ quên.
