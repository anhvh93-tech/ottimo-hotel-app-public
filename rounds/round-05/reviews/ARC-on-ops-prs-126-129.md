# ARC review PR #126 (OPS: postgres-log-terse chờ qua TCP, CODEOWNERS SEC) và PR #129 (OPS: runbook v1.0.5 r3)

- Round 5 (v1.0.5), bước **Review**. Người review: ARC. Ngày 07/11/2026.

| PR | Nhánh | SHA đã review | Ghi chú |
|---|---|---|---|
| #126 | `r5-ops-pgterse-fix` | **`d11a2700`** | Phần test ở `cb548be6` (gộp `main` ở `6a8039ed`). `d11a2700` chỉ thêm dòng CODEOWNERS `scripts/*.sql` (SEC V525-02 ý 1). 2 tệp: `.github/CODEOWNERS`, `product/infra/server/test/postgres-log-terse.test.sh` |
| #129 | `r5-ops-runbook-r3` | **`3861ccc4`** | Nội dung runbook giống hệt `56ee7fc9` (đã so cả tệp). `3861ccc4` chỉ sửa một dòng `OPS-responses.md`. Tệp đổi: runbook v1.0.5, `product/infra/server/README.md` mục 11.1, báo cáo và phản hồi OPS |

**Đã đọc:**
- thẻ gốc FB-R5-ARC-OPS-11 (`ARC-on-mob-pr-117.md`), thân PR #126;
- SEC FB-R5-SEC-BE-D1-04 (`SEC-on-be-pr-100-d1.md` mục 6) và mục 1.1, 7 của tệp đó;
- `SEC-on-pr-96-v5-25.md` mục 4.1–4.4 (khối `v525-run` đã ghim);
- `ARC-on-pr-96-v5-25.md` mục 12.6;
- decision-log 07/11 (dòng ORC sau DOM review #101/#108/#110: 7 khóa dừng);
- tệp SQL ở `897ff46e`;
- mã `identity/internal/users.service.ts` (`setRoles`) và `identity/public/session.service.ts` (`revokeAll`).

**Đã chạy:**
- **#126, worktree riêng, image `postgres:17-alpine@sha256:b0f9560a…2b24`:**
  - bản PR chạy tuần tự 6 lần: **6/6** `== 13 passed, 0 failed`;
  - 3 đột biến, kết quả ở mục 1.2;
  - đã xóa worktree.
- **#129:**
  - SHA-256 của tệp SQL và của khối `v525-run`, trích từ runbook và từ tệp SEC;
  - kiểm `be64cdf4`, `c7431973` là merge commit của #96, #109 (`gh pr view`);
  - chạy P2c bước 2 trong và ngoài thư mục repo.

## 0. Kết luận

| PR | Kết luận | Điều kiện |
|---|---|---|
| **#126** | **DUYỆT** @ `d11a2700` | CI xanh, kể cả job `infra scripts (shellcheck)`. Run `42274569391` đang chạy lúc ghi. FB-R5-ARC-OPS-11: **ARC đóng (Done) khi #126 gộp** |
| **#129** | **DUYỆT CÓ ĐIỀU KIỆN** @ `3861ccc4` | Sửa FB-R5-ARC-OPS-129-01 (một dòng `cd`) **trước khi cắt `SHA_V105`**, vì P2 mục 8 chạy P2c bước 1–3 ngay lúc cắt. Các phần khác đúng: khối ghim, cách đọc hai dòng đếm, luật `roles_version` |

Số thẻ mới:
- **0 Blocker · 0 Major · 1 Minor · 2 Suggestion**.
  - Minor: 129-01.
  - Suggestion: 126-01, 129-02.
- ESC mới: không.

## 1. PR #126

### 1.1 Bản sửa có đúng gốc lỗi không

Gốc lỗi (OPS-11):
- entrypoint chạy một server tạm chỉ nghe socket (`listen_addresses=''`);
- `pg_isready` qua socket có thể báo sẵn sàng cho server tạm;
- SQL rơi vào lúc server khởi động lại, và `|| true` nuốt lỗi.

Bản sửa đối chiếu với 3 ý đề xuất của thẻ:

| Đề xuất của thẻ | Bản sửa | Đúng? |
|---|---|---|
| 1. Chờ server thật qua TCP | `pg_isready -q -h 127.0.0.1`. Server tạm không bao giờ nghe TCP, nên lần "sẵn sàng" đầu tiên qua TCP là của server thật. Sau đó entrypoint không khởi động lại nữa | Đúng gốc lỗi |
| (thêm) Mọi `psql` đi qua TCP | Cả khối gây lỗi lẫn câu `pg_settings` đều có `-h 127.0.0.1` | Đúng. Chặn luôn trường hợp còn sót, kết nối lỡ vào socket của server tạm |
| 2. Không kết nối được thì báo lỗi harness và thoát | Bỏ `\|\| true`, kiểm mã thoát của `psql`: khối gây lỗi phải thoát 0 (không có `ON_ERROR_STOP`, lỗi cố ý không đổi mã thoát); câu `pg_settings` chạy `ON_ERROR_STOP=1` và phải ra đủ 5 dòng `SETTING`. Hỏng thì `provoke` in một dòng `HARNESS-ERROR …`, `harness()` báo `FAIL harness: … (the log setting was NOT tested)` và `exit 1`. `trap … EXIT` vẫn xóa container | Đúng |
| 3. Chứng minh hết chập chờn | OPS: tuần tự 20/20 xanh. Chạy song song (tranh CPU như máy CI): bản cũ 10/12, đỏ đúng 2 dòng ARC thấy; bản sửa 12/12. ARC thêm: 6/6 xanh | Đủ |

**Không che lỗi thật:**
- các ca PASS/FAIL về log và cài đặt giữ nguyên;
- lỗi harness là `FAIL` có thoát 1, nên bước CI (`0 failed`) vẫn đỏ. Khác với trước: thông điệp nói đúng là "chưa kiểm", không đổ cho cài đặt log.

### 1.2 Đột biến của ARC

| Đột biến | Kết quả | Ý nghĩa |
|---|---|---|
| H1: compose thêm `-c listen_addresses=` (không có TCP) | `FAIL harness: postgres not reachable in the terse run – no answer on 127.0.0.1:5432 after 60 s (container running)`, `== 2 passed, 1 failed`, khoảng 64 giây | Lỗi kết nối ra đúng lỗi harness, không ra "lộ dữ liệu" |
| H2: compose đổi `log_error_verbosity=terse` thành `default` | 3 `FAIL`: `compose: no log_error_verbosity=terse`, `terse: a row value or a DETAIL line reached the log`, `not pinned: log_error_verbosity=terse` | Lỗi thật vẫn bị bắt, không bị đọc thành lỗi harness |
| H4: khối gây lỗi kết nối vào DB không có (`-d nope`) | `FAIL harness: … psql exit 2 on the provoking statements` | Mã thoát của `psql` được kiểm đúng |

Ghi chú: câu `pg_settings` bỏ stderr (`2>/dev/null`), nên khi hỏng chỉ thấy mã thoát và số dòng. Chấp nhận được. Câu này không đụng dữ liệu, nên in dòng lỗi đầu tiên cũng an toàn nếu OPS muốn dễ dò hơn. Không cần thẻ.

### 1.3 CODEOWNERS

- 4 dòng theo SEC D1-04: `serializer.ts`, `serialize.interceptor.ts`, `auth.guard.ts`, `mfa-roles.ts`. Cả 4 tệp có trên `main`, đường dẫn đúng.
- Dòng `/product/services/api/scripts/*.sql` (SEC V525-02 ý 1) phủ `v5-25-parameter-shape-check.sql` và `sec-be73-check.sql`. Thư mục `scripts/` không có thư mục con, nên `*` là đủ.
- Không có mẫu rộng hơn ở dưới đè lên các dòng mới.
- Repo có một chủ, nên CODEOWNERS chỉ là chỉ dẫn. Lớp chặn thật là bước (b) ORC kiểm, như SEC đã ghi.

## 2. PR #129 – runbook v1.0.5 r3

### 2.1 Khối `v525-run` và bản ghim

| Kiểm | Kết quả |
|---|---|
| Khối `v525-run` trong runbook (trích bằng `awk` của SEC 4.2) | 6 dòng, SHA-256 **`608724131055a136…41eb`**, trùng SEC 4.3 @ `90478b2d` |
| Dấu khối trong runbook | Chỉ một cặp `# >>> v525-run` / `# <<< v525-run` (dòng 512, 517), nên `awk` không trích lẫn khối khác. Khối `v530-run` có tên riêng |
| `v525.sql` ở `SHA_V525` = `897ff46e` | SHA-256 **`f5db74ac…243f`**, 28 081 byte. Trên `main` hiện tại, tệp không đổi (`git diff --quiet 897ff46e origin/main`). `git log -1 origin/main -- <tệp>` ra đúng `897ff46e` |
| `MERGE_96_109` | `be64cdf4` là merge #96 (cha thứ hai `897ff46e`); `c7431973` là merge #109 (cha thứ hai `d77e2241`). Cả hai trên `main` |
| Bảng "Đúng là" ở P2c | Trùng SEC 4.4: 5 dòng chốt, `BEGIN`, dòng gác, 3 khóa bắt buộc, áp chót thứ 3/2/1, `#END`, trên 200 dòng, `permission denied`, cách báo lỗi |
| Thứ tự hai dòng đếm | Đúng thứ tự trong SQL: `open_bookings_cancel_policy_broken`, rồi `damage_catalog_rows_broken`, rồi `ROLLBACK` |

### 2.2 P2c bước 2 và cách đọc hai dòng đếm theo ARC 12.6 (a)–(c)

| ARC 12.6 | Runbook r3 | Đúng? |
|---|---|---|
| Ý 1: thêm `lease_terms` làm khóa dừng thứ 7 | `V525_STOP_KEYS` có 7 khóa. Nguồn là dòng ORC 07/11 trong decision-log. Danh sách khóa không dừng giữ đúng DOM 13.2 | Đúng |
| 2a: `damage_catalog_rows_broken` khác 0 chỉ được bỏ qua khi `SHA_V105` có cả #96 lẫn #109 | Bước 2 kiểm `merge-base --is-ancestor` của `be64cdf4` và `c7431973`. Ra `c7431973: THIEU` thì số khác 0 **dừng**. Có trong bảng dừng mục 6 và ở P2 mục 8 | Đúng ý. **Lệnh chạy sai thư mục**: thẻ 129-01 |
| 2b: `open_bookings_cancel_policy_broken` không dừng; báo DOM hệ quả (500 khi hủy/dời ngày, hoặc hoàn 0 % mà không báo); luật "dùng chính sách đang hiệu lực" chưa có (R5-B-05) | Có đủ ba ý. Câu chữ gọn hơn ARC: không tách 500 (bản chép không phải danh sách hoặc có `null`) với 0 % (bản chép `[]`). Đủ cho ORC báo DOM | Đúng |
| 2c: câu SQL chỉ in số; câu đọc thứ hai do SEC viết và ghim, chỉ `code`, `arrival_date`, `status`; không `UPDATE` `pricing_snapshot` | Có đủ. Runbook thêm: INV đồng ý riêng (theo SEC 4.4); danh sách mã đơn không vào repo, chat hay subagent | Đúng, chặt hơn |

**ARC đính chính 12.6 ý 2c:**
- ARC viết "nếu số **(a)** khác 0, DOM cần mã đơn". Chữ đúng là số **(b)**, tức `open_bookings_cancel_policy_broken`, vì chỉ dòng đó đếm đơn.
- `damage_catalog_rows_broken` đếm dòng danh mục. OWN/MGR thấy các dòng đó trên Desk, không cần mã đơn.
- Runbook và SEC 4.4 đã đọc đúng là (b). Không cần sửa runbook.

### 2.3 Luật `roles_version` (README 11.1, luật chung của runbook)

Đối chiếu với mã. `setRoles` làm trong một giao dịch:
- `UPDATE user_property_role SET revoked_at` khi bỏ vai; `INSERT … ON CONFLICT DO UPDATE SET revoked_at = NULL, granted_by, granted_at` khi cấp;
- `UPDATE app_user SET version + 1, updated_at, roles_version + 1` (chỉ khi có đổi);
- `revokeAll(… 'role_changed')`: `UPDATE user_session SET revoked_at, revoked_reason`, rồi `DELETE FROM mfa_login_challenge`;
- ghi audit `security` / `user.roles_changed`.

Bốn bước của README khớp mã. Lý do README đưa ra cũng khớp SEC 1.1:
- cache `user_id:roles_version`, sống `roleCacheMs` 60 giây, riêng cho mỗi tiến trình;
- `revoked_at` được đọc mới ở mỗi request;
- phiên `enrollment_only` chỉ được ghi lúc đăng nhập.

Thiếu một ý nhỏ: thẻ 129-02.

### 2.4 Ngoài phạm vi

ARC chưa soát câu K13 (`v530-check`). Câu đang chờ SEC ghim, và ORC không giao. Khi SEC ghim, nếu ORC cần, ARC soát phần dữ liệu:
- cột của `config_parameter` và `reservation`;
- luật người nhận hoa hồng của `syncCommission`.

## 3. Thẻ

### FB-R5-ARC-OPS-129-01
- Mức độ: Minor (điều kiện gộp #129, sửa trước khi cắt `SHA_V105`)
- Vị trí: `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md`, P2c bước 2 (khối `git diff --quiet …` / `for c in be64cdf4 c7431973 …`, khoảng dòng 497–500 @ `3861ccc4`). Cùng chỗ ở P2 mục 8 ("P2c bước 1–3, nguyên văn")
- Vấn đề:
  - Bước 1 chạy nguyên văn khối SEC 4.2. Dòng cuối của khối đó là `cd "$W" && shasum …`, nên shell đang đứng ở `$W`, một thư mục tạm không phải repo.
  - Bước 2 dán tiếp thì `git` chạy ngoài repo. ARC đã thử: ra `BAN GHIM: KHAC`, `be64cdf4: THIEU`, `c7431973: THIEU`. Chạy trong repo thì ra `TRUNG`, `CO`, `CO`.
- Vì sao quan trọng:
  - Lỗi về phía an toàn (dừng), nhưng là dừng giả đúng ngày Release.
  - Runbook dặn `KHAC` thì "báo SEC + BE (bản trong gói chưa được duyệt)", tức chẩn đoán sai.
  - ORC phải tự đoán ra nguyên nhân. Runbook lại có luật "lệch Đúng là thì dừng, không đoán".
- Đề xuất sửa:
  - Mở đầu khối bước 2 bằng `cd /Users/anhvh/Desktop/hotel-app || exit 1`, như dòng đầu của SEC 4.2. Hoặc dùng `git -C /Users/anhvh/Desktop/hotel-app …` cho cả ba lệnh.
  - Thêm vào "Đúng là": dòng `fatal: not a git repository` nghĩa là chạy sai thư mục, không phải gói sai.
  - Không đổi khối `v525-run`. Không cần SEC ghim lại.
- Trạng thái: Open

### FB-R5-ARC-OPS-129-02
- Mức độ: Suggestion
- Vị trí: `product/infra/server/README.md` mục 11.1, bước 1 của script một lần (@ `3861ccc4`)
- Vấn đề:
  - Bước 1 ghi "sửa dòng `user_property_role`; thu hồi vai là đặt `revoked_at`". README không nói khi **cấp** vai phải làm như `setRoles`: đặt `granted_by` (người duyệt) và `granted_at = now()`, cấp lại thì xóa `revoked_at` trên dòng cũ.
  - README cũng không nói rằng không có dòng audit thì decision-log phải ghi vai trước và sau.
- Vì sao quan trọng: K13 (b) đọc vai của người tạo bằng `granted_at ≤ created_at`. `granted_by` là dấu vết duy nhất cho biết ai cấp vai, vì lần sửa bằng SQL không có dòng audit. Cấp vai bằng SQL mà để `granted_at` cũ hay rỗng sẽ làm câu đếm K13 ra `none` hoặc sai.
- Đề xuất sửa:
  - Thêm một ý vào bước 1: cấp vai thì `INSERT … ON CONFLICT (user_id, property_id, role) DO UPDATE SET revoked_at = NULL, granted_by = …, granted_at = now()`, như `users.service.ts` `setRoles`.
  - Thêm vào bước 4: ghi vai trước và sau, chỉ tên vai, không ghi dữ liệu khác của người đó.
  - Script một lần vẫn qua ARC + SEC review, nên không gấp. Sửa ở bản README sau.
- Trạng thái: Open

### FB-R5-ARC-OPS-126-01
- Mức độ: Suggestion
- Vị trí: `.github/CODEOWNERS` (@ `d11a2700`)
- Vấn đề: test `product/infra/server/test/postgres-log-terse.test.sh` là bằng chứng cho SEC-ARC-08 và SEC-OPS-93-03 (log Postgres không lộ giá trị dòng; 5 cài đặt ghim ở dòng lệnh), nhưng chưa có dòng SEC trong CODEOWNERS.
- Vì sao quan trọng: test này vừa được sửa phần harness. Lần sửa sau có thể làm yếu nó (bỏ ca control, nới `grep`) mà PR không hiện dấu "cần SEC". Đây là đúng loại tệp D1-04 muốn giữ: tệp mà một yêu cầu bảo mật dựa vào.
- Đề xuất sửa: thêm `/product/infra/server/test/postgres-log-terse.test.sh @anhvh93-tech`, kèm chú thích SEC. Làm cùng PR CODEOWNERS sau, không chặn #126.
- Trạng thái: Open

## 4. Điểm làm tốt

- **#126:**
  - sửa đúng gốc lỗi, không thêm `sleep` hay chạy lại;
  - tách hẳn "chưa kiểm được" khỏi "lộ dữ liệu";
  - có số liệu chạy song song cho thấy bản cũ hỏng và bản mới không hỏng.
- **#129:**
  - chép khối ghim từng ký tự (SHA trùng);
  - tự kiểm SHA bằng hai đường trích;
  - điền đủ ô 0.1 kèm nguồn;
  - đọc đúng ý 2c (ARC viết nhầm (a));
  - luật `roles_version` có lý do và khớp mã.

## 5. Giả định

- G1: P2c bước 1–2 được dán vào cùng một cửa sổ terminal. Đó là cách runbook viết ("với `$W` của bước 1"). Nếu ORC mở cửa sổ mới ở thư mục repo cho bước 2, lỗi 129-01 không xảy ra, nhưng runbook không nên dựa vào điều đó.
- G2: kết luận #129 tính trên nội dung runbook ở `56ee7fc9` / `3861ccc4`. OPS sửa 129-01 thì ARC chỉ cần xem đúng đoạn đó.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **ARC – review PR #126 và #129 (OPS)** (rounds/round-05/reviews/ARC-on-ops-prs-126-129.md). **#126 @ d11a2700: DUYỆT** – postgres-log-terse chờ server thật qua TCP (pg_isready -h 127.0.0.1, mọi psql qua TCP), kiểm mã thoát psql và đủ 5 dòng pg_settings, không kết nối được thì FAIL harness thoát 1, không đọc thành lộ dữ liệu; ARC chạy 6/6 xanh, đột biến: không TCP ra lỗi harness, bỏ terse ra 3 FAIL thật, psql exit 2 ra lỗi harness; CODEOWNERS thêm 4 tệp SEC D1-04 và scripts/*.sql (V525-02 ý 1). Gộp khi CI xanh; FB-R5-ARC-OPS-11 đóng khi gộp. **#129 @ 3861ccc4: DUYỆT CÓ ĐIỀU KIỆN** – khối v525-run chép nguyên văn (SHA 60872413…41eb, trích từ runbook và SEC @ 90478b2d), v525.sql f5db74ac…243f ở 897ff46e và trên main, be64cdf4/c7431973 đúng merge #96/#109, 7 khóa dừng theo ORC 07/11, hai dòng đếm đúng ARC 12.6 (a)–(c), luật roles_version khớp setRoles/revokeAll; điều kiện: sửa OPS-129-01 trước khi cắt SHA_V105 (P2c bước 2 chạy git trong $W sau khối SEC 4.2 nên ra KHAC/THIEU giả – thêm cd vào repo). ARC đính chính 12.6 ý 2c: "số (a)" đọc là (b) open_bookings_cancel_policy_broken. Thẻ: OPS-129-01 Minor; OPS-129-02, OPS-126-01 Suggestion. | ARC | Không ESC |`
