# SEC duyệt PR #26 – Quay lui app về v1.0.0 (QC v1.0.1 ĐK7) + sửa Minor ARC PR #23

- PR: anhvh93-tech/ottimo-hotel-app-public#26 · nhánh `ops/v1.0.1-rollback` · head `fcf6ad89` · base `main` (merge-base `a66a2b3f`)
- Thay đổi: 11 file: tệp lệnh INV (mục "Quay lui app về v1.0.0" R1–R8, ghi chú A11/B11), `privacy-log-check.sh` (mới), `restore-drill.sh`, `deploy-landing.sh` (`docker run` hạn quyền), `ops-check.sh` + README mục 7 (`EMAIL_NO_RECIPIENT_ALERT`), 2 test mới (`rollback.test.sh`, `restore-drill-privacy.test.sh`), `ops-check-cwd.test.sh`, `ci.yml`, `responses/OPS-CWD.md`
- Đọc kèm (không đổi trong PR): `bin/rollback.sh`, `bin/deploy.sh` ở head PR; diff `v1.0.0..fcf6ad89` của `services/api/src` (migration, outbox `staff.chat`); `jobs/email-dispatch.ts` ở `v1.0.0`; `chat-message.ts`, `chat-dispatch.ts`; bằng chứng production `rounds/round-03/outputs/OPS/b2-runbook.md` G3, `j15-folio-close-check.md`
- Cách kiểm: đọc diff (`gh pr diff 26`), lấy mã head PR bằng `git archive` vào thư mục tạm (không checkout), chạy lại 2 test mới, xem CI qua API
- Người duyệt: SEC · Ngày: 02/11/2026 · Round 4, QC v1.0.1 ĐK7 – bước Review

## Kết luận: **DUYỆT**

Không có Blocker hay Major. Lệnh quay lui chỉ đổi image app, không đụng dữ liệu hay bí mật. Lệnh kiểm digest đã ghi lúc deploy. Gõ sai tên bản hay chạy sai thứ tự đều dừng an toàn hoặc không gây hại. Có 1 thẻ Minor về bộ lọc `grep` ở R4: vài lỗi bị ẩn, INV có thể không thấy dòng báo. Lỗi này an toàn vì không đổi gì, nên nên sửa trước khi INV có thể phải dùng R4. Có thêm 3 Suggestion.

Điều kiện gộp duy nhất: job CI `docker images build · E2E smoke` phải xanh. Lúc review, job này còn `pending`. 8 job còn lại đều `pass`, gồm `gitleaks` và `infra scripts (shellcheck)`. Trong job `infra scripts`, các bước `rollback.sh rehearsal` và `restore-drill privacy-notice.log vs database` đều `success` trên head `fcf6ad89`, SEC đã xem qua API của job `124914312599`.

## Bằng chứng theo hạng mục được giao

### 1. R1–R8: lệnh `rollback.sh sha-8b3aec89486f` – Đạt
- **Tên bản đúng.** `git rev-parse 'v1.0.0^{commit}'` ra `8b3aec89486f0f01…`, nên tên image là `sha-8b3aec89486f`. Production đã chạy đúng bản này, có ghi digest: `b2-runbook.md` G3 chạy `deploy.sh sha-8b3aec89486f --api-digest <state/digests>…` và ra `OK: sha-8b3aec89486f is live`. Vì vậy có `state/digests/sha-8b3aec89486f` để quay lui, và R2 kiểm lại điều này trước khi làm.
- **Toàn vẹn image.** `rollback.sh` gọi `deploy.sh <tag> --rollback`. Ở production, `deploy.sh` (dòng 78–92) lấy digest từ `state/digests/<tag>`. Thiếu digest thì **production guard** từ chối trước khi pull. Sau pull, `digest_ok` so `RepoDigests`, kể cả khi `--no-pull` (dòng 125–134). Registry trả image khác dưới cùng tag thì FAIL trước migrate/switch. Test (e) chứng minh điều này.
- **Không đụng DB.** `git diff v1.0.0..fcf6ad89 -- services/api/src/db/migrations` rỗng, tức v1.0.1 không thêm migration. Lượt `migrate` của image v1.0.0 vì vậy không làm gì. `--rollback` chỉ nới điều kiện thành "DB ≥ journal" (dòng 167–168), không bao giờ hạ schema. R3 vẫn sao lưu trước (B2), đây là đúng mức thận trọng.
- **Không đụng bí mật.** `rollback.sh`/`deploy.sh` không đọc giá trị secret. `deploy.sh` chỉ kiểm tệp **có tồn tại** (dòng 111–113). Tệp `booking_request_chat_webhook` để nguyên. Image v1.0.0 không có mã đọc tệp này, nên mức lộ không đổi so với lúc chạy v1.0.1. Bước `appconfig` chạy `loadConfig()` của v1.0.0 trên `.env` mới, và ConfigError chỉ nêu tên biến. Nếu v1.0.0 từ chối cấu hình mới thì dừng **trước** khi container đổi.
- **Không in dữ liệu cá nhân ra màn hình INV.** R4 lọc `grep -E "^\[deploy "`, nên phần `dc logs --tail 80 api worker web` mà `fail()` in ra (log app, có thể có dữ liệu) không lên Terminal hay ảnh chụp của INV. Đây là lựa chọn đúng (xem thẻ 01 về mặt trái của bộ lọc). R2/R5 chỉ in tên tag, R6 là `ops-check` (không có dữ liệu khách), R7 lọc 3 loại `msg`.
- **Outbox `staff.chat` còn lại khi về v1.0.0.** `email-dispatch.ts` ở `v1.0.0` chỉ chọn `WHERE topic = $1` (`staff.email`), nên hàng `staff.chat` nằm yên, không bị xử lý sai hay ghi log. Khi lên lại bản mới, `chat-dispatch.ts` bỏ qua hàng quá 12 giờ (`CHAT_STALE_MS`, `SKIPPED_STALE`), nên không có loạt tin cũ đổ vào phòng Chat. Payload chỉ chứa id.

### 2. An toàn khi INV làm sai thứ tự hoặc gõ sai – Đạt
| Tình huống | Hành vi (đã kiểm trong mã/test) | Đánh giá |
|---|---|---|
| Gõ `rollback.sh v1.0.0` | Production guard: không có `state/digests/v1.0.0` → FAIL trước pull, `current_tag` giữ nguyên (test (a)) | An toàn |
| Chạy R4 khi chưa làm R1–R3 | Tên bản ghi sẵn trong lệnh, digest vẫn kiểm. Chỉ thiếu bản sao lưu mới nhất, mà lệnh không đổi dữ liệu | Chấp nhận được |
| Chạy R4 hai lần | Lần 2: `prev = tag` nên `previous_tag` không bị ghi đè (dòng 265), vẫn là v1.0.1. Pull + digest + migrate không làm gì | Lặp lại được |
| Release đã tự trả về v1.0.0 | R2 in `DANG CHAY: sha-8b3aec89486f` → sheet bảo dừng | An toàn |
| Smoke FAIL khi đang quay lui | `restore_previous` bỏ qua khi `rollback=1`, không tự đưa v1.0.1 lên lại, `current_tag` không ghi (test (g)). Sheet bảo không chạy lại, gửi đội | Đúng thiết kế |
| Deploy khác đang chạy | `flock -n` → thoát 3, không đổi gì | An toàn (xem thẻ 01: INV không thấy dòng này) |
| Bấm chạy lại Release v1.0.1 | R8.4 cấm rõ | Đã dặn |

Lệnh R2 có ngoặc lồng nhau. SEC đã kiểm: `\$(cat …)` đi qua `ssh '…'` nguyên văn, shell trên máy chủ bỏ `\` trong `"…"`, rồi `sh -c` thực thi. Kết quả đúng. Lệnh chỉ đọc.

### 3. `privacy-log-check.sh` + `restore-drill.sh` – Đạt
- Truy vấn chạy `psql -X -v ON_ERROR_STOP=1 … -tA -c "SELECT DISTINCT version FROM privacy_notice_version …"`, stderr bỏ (`2>/dev/null`). Biên bản không chép lỗi psql (test 3/4 có `LEAKMARK` trong stderr giả, và kiểm `LEAKMARK` không xuất hiện).
- Lỗi truy vấn trả mã 2, in "KHÔNG ĐỌC ĐƯỢC … – không đối chiếu được", không bao giờ in "khớp DB" hay "DB chưa có version". `restore-drill.sh` không còn `2>/dev/null || true`. `pn_report=$(…) || pn_rc=$?` đúng với `set -e`.
- Nội dung in ra: số dòng log và chuỗi version (ngày). Không có dữ liệu khách. `privacy-notice.log` chỉ chứa mã người chạy, tag, băm.
- SEC chạy lại từ `git archive` của head PR: `restore-drill-privacy.test.sh` **8/8**.

### 4. `docker run` hạn quyền trong `deploy-landing.sh` – Đạt
`--rm --pull never --network none --cap-drop ALL --security-opt no-new-privileges --read-only --user 65534 --entrypoint sh`. Container chỉ `tar` 2 trang ra stdout, không cần ghi đĩa hay quyền gì. Đủ lớp phòng thủ cho một image đã qua kiểm digest. OPS báo test 13/13 với image thật qua các cờ này. CI `shellcheck` xanh.

### 5. `ops-check.sh` / README mục 7: `EMAIL_NO_RECIPIENT_ALERT` – Đạt
Mốc bật đã khớp README 13.8 và `SEC-on-B2-readiness.md` 1.5: chỉ bật khi BUG-R3-032 đã lên production (đợt 3, `v1.0.3`) **và** OWN/MGR đã nhập email. README ghi rõ hậu quả nếu bật sớm. Chỉ đổi chú thích, hành vi script không đổi.

### 6. Test mới và CI – Đạt
- `rollback.test.sh` chạy **mã thật** `rollback.sh` → `deploy.sh --rollback` trên một production giả, có `.ottimo-home=production` và `APP_ENV=production`. Stub `dc`/`docker`/`curl` ghi lại mọi lệnh. Test có 8 tình huống (a)–(h), gồm cả các ca bất lợi: tag git, digest lệch, DB đi trước, smoke hỏng. Test từ chối chạy trên máy chủ OTTIMO. SEC chạy lại trên macOS: **11/11**.
- CI: cả 2 test đều có trong job `infra scripts`, `shellcheck -x -S warning` bao cả tệp mới. Trạng thái CI xem ở phần Kết luận.

## Thẻ feedback

### FB-R4-SEC-OPS-PR26-01
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/OPS/v1.0.1-inv-commands.md` R4 (lệnh `… rollback.sh sha-8b3aec89486f 2>&1 | grep -E "^\[deploy "`) và mục "Khi có dòng FAIL"
- Vấn đề: bộ lọc chỉ giữ dòng bắt đầu bằng `[deploy `, nên có 2 trường hợp INV không thấy gì để báo:
  - (1) `deploy.sh` dòng 53 in `another deploy is running` qua `echo … >&2`, không có tiền tố `[deploy` nên bị lọc mất. Sheet lại bảo INV sẽ thấy dòng này.
  - (2) Một số lỗi làm script dừng do `set -e` mà không in dòng `FAIL`. Ví dụ `dc … pull` lỗi đăng nhập hoặc mạng (dòng 122), `dc up … postgres` (153), `02-roles.sh` (154), `migrate` (163). Khi đó INV chỉ thấy 1–5 dòng đầu, không có `OK`, cũng không có `FAIL`. Mục "Khi có dòng FAIL" không nói phải làm gì.
- Vì sao quan trọng: cả hai trường hợp đều an toàn, vì chưa có gì đổi hoặc container chưa switch. Nhưng INV dễ đọc nhầm là "đang chạy" và chờ mãi, hoặc chạy lại nhiều lần mà không báo đội. Lúc phải quay lui là lúc đang có sự cố, nên mỗi lần chờ hay nhầm như vậy đều làm sự cố kéo dài.
- Đề xuất sửa (chỉ sửa tài liệu, không cần đổi script):
  - (a) Đổi bộ lọc thành `grep -E "^\[deploy |^another deploy|^usage:|^unknown option|^no previous tag"`. Các dòng này không chứa dữ liệu.
  - (b) Thêm vào cuối lệnh `; echo HET LENH R4`.
  - (c) Thêm vào mục "Khi có dòng FAIL" một gạch: "In `HET LENH R4` mà dòng ngay trên **không** phải `OK: sha-8b3aec89486f is live` (kể cả khi không có dòng `FAIL`): làm như mọi FAIL khác, không chạy lại, gửi ảnh và chạy R6".
  - Có thể thêm 1 ca vào `rollback.test.sh` (lock đang giữ → đầu ra lọc vẫn có dòng `another deploy`).
- Trạng thái: Open

### FB-R4-SEC-OPS-PR26-02
- Mức độ: Suggestion
- Vị trí: tệp lệnh INV R5, và README `infra/server` mục "Quay lui về bản trước"
- Vấn đề: sau khi quay lui, `previous_tag` là image v1.0.1 (bản lỗi), như test (b) xác nhận. Nếu sau đó có ai chạy `rollback.sh` **không tham số**, theo cách README ghi, app sẽ lên lại v1.0.1 mà không qua Release.
- Vì sao quan trọng: bản lỗi lên lại mà không ai duyệt.
- Đề xuất sửa: R5 thêm một câu "sau bước này **không** chạy `rollback.sh` không có tên bản". README thêm: "sau một lần quay lui, `previous_tag` là bản vừa bị gỡ".
- Trạng thái: Open

### FB-R4-SEC-OPS-PR26-03
- Mức độ: Suggestion
- Vị trí: mục "Quay lui app về v1.0.0" (phần "Mục này không đụng"), README 13.4 (thủ tục đổi mức tin)
- Vấn đề: trong lúc chạy v1.0.0, thao tác xóa dữ liệu yêu cầu (WR8 `erase`) không tạo tin `web_request_erased` trong luồng Chat, vì v1.0.0 không có mã này. Ở **mức A** thì không sao: tin Chat không có dữ liệu khách (`chat-message.ts`: mã, giờ, hạn trả lời, link Desk). Nhưng nếu sau này đã lên mức B/C mà vẫn còn quy trình quay lui về một bản không có Chat, thì tin chi tiết của yêu cầu bị xóa trong thời gian đó sẽ không có lời nhắc xóa (SEC N1).
- Vì sao quan trọng: lời nhắc xóa là biện pháp bù cho việc webhook không xóa được tin. Thiếu nó thì dữ liệu khách nằm lại trong Chat dù khách đã yêu cầu xóa.
- Đề xuất sửa: ghi vào thủ tục đổi mức tin (README 13.4) rằng từ mức B trở lên, mọi quy trình quay lui về bản không có Chat phải có thêm bước: OWN rà các yêu cầu bị xóa trong thời gian chạy bản cũ và tự xóa tin Chat tương ứng. Đợt v1.0.1 (chỉ mức A) không cần làm gì thêm.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR26-04
- Mức độ: Suggestion
- Vị trí: `product/infra/server/test/rollback.test.sh` (thiếu `jq` thì `SKIP` và `exit 0`); tương tự `ops-check-cwd.test.sh` khi chạy bằng root
- Vấn đề: trên CI, một bước bị `SKIP` vẫn hiện xanh. Nếu runner đổi image và mất `jq`, phép thử quay lui sẽ âm thầm không chạy.
- Vì sao quan trọng: ĐK7 dựa vào bước CI này để chứng minh lệnh quay lui còn đúng.
- Đề xuất sửa: khi `CI=true` (GitHub đặt sẵn biến này) thì `SKIP` trả `exit 1`. Trên máy trạm vẫn giữ `exit 0`.
- Trạng thái: Open

## Điểm làm tốt
- Diễn tập chạy chính `deploy.sh` thật trên production giả, không viết lại logic, có cả ca bất lợi. Test (a) chứng minh nhầm `v1.0.0` không đổi gì, test (g) chứng minh không tự đưa bản lỗi lên lại.
- Tệp lệnh INV lọc đầu ra để log app không lên màn hình hay ảnh chụp, và tách rõ quay lui app, quay lui cấu hình, tắt Chat, mỗi loại có điều kiện dùng riêng.
- `privacy_log_report` tách thành hàm có test, phân biệt rõ "không đối chiếu được" với "khớp", và không chép lỗi psql.

---

## Lượt 2 – đối chiếu bản sửa `97938f9b` (QC v1.0.2 ĐK12c, QC v1.0.3 ĐK2c)

- Người đối chiếu: SEC · 03/11/2026 · Round 4, bước **Review** (thực hiện điều kiện QC).
- Đọc: `git show 97938f9b` (5 tệp: tệp lệnh INV R4/R5 + gạch "không đụng webhook Chat", README dòng "Quay lui về bản trước" + 13.4, `rollback.test.sh` ca (i), `ops-check-cwd.test.sh`, `responses/OPS-CWD.md` 4 dòng SEC). Đối chiếu tệp hiện tại trên `main` (`68064cba`): `git diff 97938f9b HEAD` không đổi `v1.0.1-inv-commands.md`, `rollback.test.sh`, `deploy.sh`, `rollback.sh`. README có đổi sau đó nhưng hai câu của PR26-02/03 vẫn còn nguyên.
- SEC tự chạy trên `main` (máy trạm, không chạm VPS): `rollback.test.sh` **16/16**, gồm 5 dòng của ca (i). CI: job `infra scripts` vẫn gọi `rollback.test.sh` và `ops-check-cwd.test.sh` (`ci.yml` dòng 270, 276).

### FB-R4-SEC-OPS-PR26-01 – lệnh R4 có `MA THOAT`: **Closed**

| Ý của thẻ | Bản sửa trên `main` | Kết quả |
|---|---|---|
| (1) `another deploy is running` bị lọc mất | Bộ lọc thêm `^another deploy`. Ca (i) "lock held" chạy đúng lệnh R4 đọc từ tệp lệnh: dòng này hiện ra, rồi `MA THOAT: 3`, không switch | Đạt |
| (2) Lỗi dừng do `set -e` không in `FAIL` | Lệnh bọc `{ rollback.sh … 2>&1; echo "MA THOAT: $?"; } \| grep …`, nên **luôn** có dòng cuối `MA THOAT: <n>`. `$?` nằm trong nháy đơn của `ssh` nên được tính trên máy chủ, đúng mã của `rollback.sh` (qua `sudo`). Nhóm `{ …; }` là POSIX, không phụ thuộc `pipefail`. Ca (i) "pull error": `Error response …` + `MA THOAT: 1`, không có `FAIL`/`OK:`, không switch | Đạt |
| (c) Hướng dẫn khi không có `FAIL` | Mục "Khi không đúng như trên": chỉ hai ca được chạy lại (mã 1 + dòng guard; mã 3 + `another deploy`). Mọi ca khác (mã ≠ 0, dòng trên `MA THOAT` không phải `OK: …`, có dòng lạ, kể cả không có `FAIL`) thì không chạy lại, chụp gửi đội, chạy R6 | Đạt |
| Test bám đúng tài liệu | Ca (i) đọc lệnh R4 **từ chính tệp lệnh INV**, chỉ thay đường dẫn máy chủ bằng stack giả. Sửa tài liệu mà làm hỏng lệnh thì CI đỏ. Thiếu tệp lệnh khi `CI=true` → `ko` | Đạt |
| Không lộ dữ liệu ra màn hình INV | Bộ lọc mới chỉ thêm các dòng **bắt đầu** bằng `another deploy`, `usage:`, `unknown option`, `no previous tag`, `digest must`, `Error`/`ERROR`, `MA THOAT:`. Các câu này do script hoặc docker in, không có dữ liệu khách. Phần `dc logs --tail 80 api worker web` mà `fail()` in ra vẫn bị lọc, vì compose đặt tiền tố tên dịch vụ (`api-1  \| …`) ở đầu mỗi dòng | Đạt |

Rủi ro còn lại (không thành thẻ): dòng không tiền tố bắt đầu bằng `Error` có thể đến từ lượt `migrate` một lần (`dc run`). Khi quay lui về bản không có migration mới, lượt này không làm gì. Lỗi của nó (nếu có) là lỗi schema/kết nối, không chứa dữ liệu khách. Dòng `DETAIL` của Postgres không khớp bộ lọc. Chấp nhận.

### Ba thẻ còn lại (OPS cùng trả lời Done ở `97938f9b`)

| Thẻ | Đối chiếu | Trạng thái SEC |
|---|---|---|
| FB-R4-SEC-OPS-PR26-02 | R5 có câu "không bao giờ chạy `rollback.sh` mà không ghi tên bản". README dòng "Quay lui về bản trước" có câu "`previous_tag` là bản vừa bị gỡ". Runbook v1.0.3 R4 vẫn ghi rõ tên bản | **Closed** |
| FB-R4-SEC-OPS-PR26-03 | README 13.4 có gạch "Quay lui app khi đang ở mức B/C" (dòng 362 trên `main`). Tệp lệnh INV ghi mức A không cần làm gì | **Closed** |
| FB-R4-SEC-OPS-PR26-04 | `rollback.test.sh` (thiếu `jq`, thiếu tệp lệnh) và `ops-check-cwd.test.sh` (chạy bằng root): khi `CI=true` thì in `FAIL` và thoát 1 | **Closed** |

**Kết luận lượt 2:** PR #26 đóng hết thẻ SEC (01–04 Closed). ĐK12(c) của QC v1.0.2, tức ĐK2(c) của QC v1.0.3, đã xong. Khuôn lệnh có `MA THOAT` cũng đã được dùng lại ở runbook v1.0.3 (5.0, R4, R4b, R8) và chạy thật trên staging (`v1.0.3-staging-drill.md` S4b, S9b: `MA THOAT: 0`).
