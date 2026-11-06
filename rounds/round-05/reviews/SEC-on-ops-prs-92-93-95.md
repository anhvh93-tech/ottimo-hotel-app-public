# SEC review – ba PR của OPS cho v1.0.5: #92, #93, #95

- Người review: SEC | Round 5 (bảo trì v1.0.5) | Bước: **Review** | Ngày: 06/11/2026
- Đối tượng:
  - **#92** `r5-ops-caddy` @ `f8c819c0` (V5-67);
  - **#93** `r5-ops` @ `b1354a4f`, 3 commit `5019f67b`, `4f1fd261`, `b1354a4f` (V5-73, V5-62, V5-65 phần mã, V5-63, ARC-08);
  - **#95** `r5-ops-runbooks` @ `fd11c4a2` (V5-70, V5-64, V5-65 phần gỡ khóa).
- Cách review: đọc `gh pr diff` và `gh pr view`; đọc tệp trên nhánh (`ops-check.sh`, `bootstrap-vps.sh`, `Caddyfile.landing`); grep mã `services/api` (log lỗi DB, SQL thô, `id_hash_key`); đối chiếu `plan.md` V5-62…V5-73, `SEC-on-contract-0.3.13.md` (ARC-07, 08, 09), `OPS-LP-v2.md` (ĐK-8), README `infra/server`, `hosting-plan.md` 7–8.1, `b2-runbook.md` 2.2.
- **Không** SSH, không chạy gì trên staging hay production, không comment, không approve trên GitHub.
- CI lúc chốt review (cùng các đầu `f8c819c0`, `b1354a4f`, `fd11c4a2`): cả ba PR xanh mọi job, gồm `infra scripts` (shellcheck và các test mới), `gitleaks`, `docker images build · E2E smoke`.

---

## 0. Kết luận

| PR | Kết luận | Điều kiện |
|---|---|---|
| **#92** Caddy landing bỏ `Authorization` | **DUYỆT** | Không thẻ. Chỉ có hiệu lực sau W2 (dựng lại container landing) và W3 (kiểm qua edge thật) |
| **#93** `pricegap` tĩnh, sao lưu 2 lượt, `sshkeys`, journald, Postgres `terse` | **DUYỆT CÓ ĐIỀU KIỆN** | Gộp được ngay. (1) Trước khi cắt `SHA_V105`: sửa 93-01, 93-02, 93-03 (Minor), thêm commit vào #93 hoặc PR nối tiếp, vì W7 chạy đúng gói này. (2) Phần server chỉ lên production sau khi V5-61 ĐẠT (QC R4 ĐK-2, thẻ 95-02). (3) ARC-07 ý 1 (đo `SystemMaxUse`) có hạn: 7 ngày sau W6 production |
| **#95** runbook v1.0.5 r0 + runbook VPS mới | **CHƯA DUYỆT** | 3 Major: 95-01 (đồng ý của INV chưa phủ W1–W7), 95-02 (P0 thiếu cổng ĐK-2), 95-03 (runbook VPS mới chưa nói ai gõ các bước chạm KEK, khóa `age` và dữ liệu khách). Sửa xong thì SEC đọc lại phần đổi. Các phần đã duyệt nêu ở mục 1.4 |

Tổng: **0 Blocker, 3 Major, 7 Minor, 1 Suggestion.** Không ESC mới.

Trùng với review ARC cùng ngày (`ARC-on-ops-prs-92-93-95.md`), OPS sửa một lần cho cả hai:
- FB-R5-ARC-OPS-01 (W6 dựng lại Postgres, INV đồng ý riêng, cấm W6 trong khung sao lưu) trùng một phần 95-01 và 95-06 (b). Thẻ 95-01 rộng hơn: phủ cả P2, W1–W5, W7, K.
- FB-R5-ARC-OPS-02 (FAIL `journal` giả từ P2b tới W6, kiểm trước nhóm ở P2) trùng 95-06 (a) và (c).
- ARC xếp #95 là DUYỆT CÓ ĐIỀU KIỆN (sửa trước khi gộp). SEC giữ CHƯA DUYỆT vì 95-02 và 95-03 cần SEC đọc lại phần đổi. Về việc làm thì như nhau: #95 chưa gộp cho tới khi sửa xong.

---

## 1. Bốn câu OPS nhờ SEC xét

### 1.1 ARC-08: hai chỗ hở còn lại, có cần `log_min_error_statement=panic`? – SEC quyết: **không bắt buộc**

**(a) Câu lỗi chính vẫn có thể mang giá trị** (ví dụ `invalid input syntax for type uuid: "…"`).
- Giá trị chỉ vào câu lỗi chính khi đổi kiểu thất bại: uuid, số, ngày, enum. Lỗi JSON thì giá trị nằm ở DETAIL, `terse` đã bỏ.
- Các cột C2/C3 (họ tên, điện thoại, email, số giấy tờ) là `text`, nên không bao giờ sinh lỗi đổi kiểu. Api kiểm đầu vào trước khi gửi DB.
- `RAISE EXCEPTION` trong migration và trigger: 17 chỗ có `%`. Tất cả chỉ in số đếm, id nội bộ hoặc `TG_OP`, không in cột C2/C3.
- Api không bao giờ ghi nguyên văn lỗi Postgres. `shared/redact.ts` `describeError` chỉ giữ `code`, `constraint`, `routine`. Logger không có chỗ nào nhận nguyên đối tượng lỗi.
- SEC chấp nhận phần còn lại.

**(b) Dòng `STATEMENT` in nguyên câu SQL.**
- Mọi câu của api dùng tham số bind: Drizzle, `tx.query` chỉ có chữ cố định hoặc `set_config(…, $1, …)`. Tên savepoint là hằng nội bộ. Grep `services/api/src`: **không có `sql.raw`**.
- `log_parameter_max_length_on_error` = 0 (mặc định), nên giá trị bind không bao giờ vào log lỗi. `STATEMENT` chỉ thấy `$1`.
- `pg_restore`: `STATEMENT` là `COPY … FROM stdin`. Dòng dữ liệu chỉ nằm ở CONTEXT, `terse` đã bỏ.
- SQL tay: runbook chỉ chạy câu đếm hằng. Còn hở khi ai đó viết giá trị của khách thẳng vào câu SQL, nên thêm một luật chung (95-05 (b)).
- `02-roles.sh` đã hạ `panic` quanh lệnh đặt mật khẩu.

**Quyết định:**
- Giữ `log_min_error_statement` mặc định (`error`). Câu SQL có `$1` là thứ cần nhất khi gỡ lỗi, và không mang giá trị.
- Điều kiện:
  - ghim các cài đặt mà quyết định này dựa vào, có test (93-03);
  - luật "không viết giá trị của khách vào SQL tay" (95-05 (b)).
- Xét lại và chuyển sang `panic` khi có một trong ba việc:
  - api thêm SQL ghép chuỗi có giá trị dữ liệu (`sql.raw`, nối chuỗi);
  - `log_parameter_max_length_on_error` hoặc `log_parameter_max_length` khác 0;
  - bật `log_statement` hoặc `log_min_duration_statement`.
- Lưu ý: `log_error_verbosity` chỉ áp cho log **của máy chủ**. Client vẫn nhận đủ DETAIL và CONTEXT, nên lỗi `pg_restore` về Terminal người chạy vẫn có thể mang giá trị dòng dữ liệu (95-03 ý 3).

### 1.2 Bản ngoại tuyến của `id_hash_key` – SEC **đồng ý**, và đây là cách làm

**Vì sao cần:**
- `id_hash_key` là khóa HMAC của chỉ mục mù số giấy tờ. Theo `crypto.service.ts`, nó cũng sinh (HKDF) khóa cho các mục đích `guest_doc`, `child_name`, `web_request_contact`, `public_estimate`, `idempotency`.
- Mất khóa này:
  - tìm khách theo số giấy tờ, nhận khách quay lại, chống trùng trẻ em đều không khớp dữ liệu cũ;
  - giá trị nào chỉ lưu dạng băm, không lưu bản mã hóa, thì **không băm lại được**.

**Độ nhạy:**
- `id_hash_key` cùng bản dump cho phép dò ngược số giấy tờ. Không gian số CCCD nhỏ: mã tỉnh, năm sinh, giới tính đoán được, còn 6 chữ số.
- Vì vậy SEC xếp khóa này cùng hạng với KEK (C3).
- KEK cùng bản dump còn mở được nhiều hơn thế. Nên đặt `id_hash_key` **cùng chỗ với KEK** không tăng rủi ro.
- **Không** đặt chung phong bì với khóa riêng `age`. Đây là luật A8 của `b2-runbook.md`: KEK cộng khóa sao lưu là mở được mọi thứ. Luật này áp y như vậy cho `id_hash_key`.
- Chỉ làm cho production. Staging là dữ liệu giả, sinh lại được.

**Cách làm (khuôn G4-8, `rounds/round-03/outputs/OPS/b2-runbook.md` 2.2):**
1. **INV tự gõ trên Terminal của mình.** ORC (agent) không chạy lệnh này và không xem màn hình. Lệnh như G4-8, thay `data_kek_current` bằng `id_hash_key`: in 44 ký tự và 8 ký tự `sha256` của nội dung (bỏ ký tự xuống dòng).
2. Chép ra giấy niêm phong hoặc USB mã hóa, **cùng chỗ với bản KEK**. Ghi 8 ký tự vân tay bên cạnh.
3. Kiểm bản chép: gõ lại bằng `read -rs`, như bước 3 của G4-8. Vân tay phải trùng.
4. Cmd+K. Không chụp ảnh. Không dán vào chat, ghi chú, iCloud hay trình quản lý mật khẩu dùng chung. Không ghi vào repo.
5. Trong chat, INV chỉ nói "id_hash_key đã cất". Không gửi vân tay, không gửi giá trị. ORC ghi dòng decision-log, không kèm vân tay.
6. Mỗi lần xoay `id_hash_key` (runbook R2, có băm lại) thì làm lại bước 1–5. Hủy bản cũ sau khi băm lại xong.
7. Khôi phục: runbook VPS mới bước 7 đặt cả hai tệp trước `init-secrets.sh`, theo cùng khuôn `read -rs` (95-03 ý 2).

**Thời điểm:** nên làm cùng buổi INV mở khóa `age` cho V5-61, vì INV đã ngồi máy. Không tốn tiền, khoảng 5 phút.
- Đây là việc INV làm theo yêu cầu kỹ thuật của SEC. Không phải lựa chọn kinh doanh, nên **không cần ESC**.
- ORC đưa vào danh sách việc của INV cuối round. Thẻ 95-07 sửa tài liệu theo.

### 1.3 Journald

| Điểm | Kết quả | Ghi chú |
|---|---|---|
| Quyền đọc | Đạt, kèm 93-04 | `/var/log/journal` `root:systemd-journal 2755`, tệp 0640. `ops-check journal` FAIL khi có người lạ ở `adm` hoặc `systemd-journal` (ngoài `LOG_READER_USERS`) hoặc ở `docker` (ngoài `ottimo`). Có tính cả thành viên theo nhóm chính. Unit ops-check có `SupplementaryGroups=systemd-journal`, user `ottimo` không vào nhóm. `ottimo` vốn đã ngang root qua `docker`, nên nhóm này không cấp thêm quyền. Còn thiếu: Ubuntu đặt ACL đọc cho `adm` **và `wheel`** trên thư mục journal; nhóm `sudo` đọc được mọi thứ; phép `-perm -o=r` không thấy ACL |
| Không vào bản sao lưu ngoài máy | Đạt | `backup.sh` chỉ đổi phần vòng xoay, danh sách tệp giữ nguyên (`db`, `blobs`, `counts`, `purge-journal`, `privacy-notice`). `pull-backups.sh` kéo bằng `rrsync -ro` đúng thư mục sao lưu. Journal nằm ngoài thư mục đó. Snapshot của nhà cung cấp (≤ 7 ngày) đã chấp nhận ở review hợp đồng 0.3.13 mục (7) |
| `ForwardToSyslog=no` | Đạt | Chỉ một bản, một trần. Hệ quả trên Ubuntu: rsyslog không nhận thêm dòng mới, nên `/var/log/auth.log` và `/var/log/syslog` dừng ghi. Nhật ký `sudo` và `sshd` từ nay chỉ có trong journal, giữ 90 ngày. Cần ghi vào README (93-04). Ở W6 nên kiểm cấu hình đang có hiệu lực (95-05 (d)) |
| `RateLimitBurst=20000`/30 s | Chấp nhận | Giới hạn tính theo unit, nên mọi container đi chung `docker.service`. Khi bị dội log có hai kết cục: bỏ dòng (WARN `Suppressed`) hoặc chạm `SystemMaxUse` rồi xoay sớm (WARN `rotated early`). Cả hai đều được báo, đúng ARC-07. Nhưng WARN **dính**: đã WARN rồi thì sự kiện mới không báo nữa (93-01) |
| `SystemMaxUse=4G` | Chấp nhận là số đầu | ARC-07 ý 1 Deferred: OPS đo sau 7 ngày kể từ W6 production, ghi vào `hosting-plan.md` mục 7 |
| Trường log | Đạt | Driver chỉ đặt `tag`, không đặt `env` hay `labels`, nên biến môi trường không bị chép vào trường journal. Nội dung log không đổi: Caddy che IP `/24`, `/48`, xóa header, che query; edge `access_log off`; api che khóa nhạy cảm; Postgres `terse` |

### 1.4 Runbook: bước nào chạm bí mật hoặc dữ liệu khách, và đồng ý của INV

**Runbook v1.0.5.** Cột "Đồng ý" là những gì runbook ghi hiện nay.

| Bước | Chạm gì | Đầu ra cho ORC | Đồng ý | SEC |
|---|---|---|---|---|
| P2 | DB khách, chỉ đếm (`SQLRO`, câu 1.5) | số | **không ghi** | Cần đồng ý (SSH vào production) – 95-01 |
| 1.6 / P2.3 / K12 | `stay_night`, chỉ đếm | 2 số | theo P2, K | **SEC duyệt câu M4d về bảo mật**: một câu `count(*) FILTER`, không id, không cột C2/C3, cột có thật và NOT NULL. DATA/BE vẫn xác nhận định nghĩa "đêm miễn phí" |
| W0 | Đường vào SSH (cấu hình bảo mật) | số dòng, 8 ký tự vân tay | có | Cách gỡ được duyệt. `FP_OPS8` (8 ký tự, khóa công khai) đúng ý OR-03 (1). Thẻ 95-04 |
| P2b | Gói `infra/`, có thể chạm `secrets/` (dừng nếu `init-secrets` tạo khóa mới) | băm, số đếm | có | – |
| W1 | Lịch sao lưu (đổi sao lưu) | lịch, NEXT | **không ghi** | 95-01, 95-02 |
| W2 | Container landing (ottimo.vn mất vài giây) | tag, số đếm | **không ghi** | 95-01 |
| W3 | Mật khẩu xem trước staging (`root 0400`) | mã HTTP | **không ghi** | Cách làm được duyệt: mật khẩu đi qua `curl -K -` từ stdin, không nằm trong tham số, không in ra |
| W4 | `.env` staging (có bí mật); **xóa** các bản `env.before-*` cũ | số đếm, tên khóa | **không ghi** | 95-01, 95-05 (c) |
| W5 | Unit hệ thống | số unit | **không ghi** | 95-01 |
| W6 | journald, dựng lại Postgres (DB khách, Desk mất khoảng 30 giây), edge (mọi site) | số đếm, `terse` | **không ghi** | 95-01, 95-05 (a)(d), 95-06 |
| W7 | ops-check (đọc DB bằng `ottimo_readonly`, đọc journal; ghi trạng thái, có thể gửi webhook) | dòng ok/FAIL | **không ghi** | 95-01 |
| P3, P4, P5, mục 5 | Sao lưu, Release, quay lui | như v1.0.4 | có | – |
| K1–K12 | Kiểm sau Release, chỉ đọc | số | **không ghi** | Gộp vào câu đồng ý P5 cũng được, miễn là ghi rõ |

**Runbook VPS mới:**

| Bước | Chạm gì | Ai gõ (SEC yêu cầu) |
|---|---|---|
| 0, 9, 10, 12 (giải mã `counts`) | Khóa riêng `age`; luồng dump đã giải mã có toàn bộ dữ liệu khách | **INV** (hoặc OPS người thật) trên máy của mình. Lỗi `pg_restore` ghi vào tệp root trên máy chủ (95-03) |
| 5 | Secret GitHub, host key mới | INV sửa secret. Host key so ngoài băng (95-03) |
| 6 | `.env` từ mẫu | OPS/ORC (không có bí mật ở mẫu) |
| 7 | KEK, `id_hash_key` | **INV**, khuôn `read -rs` (95-03, 95-07) |
| 15 | Bí mật tích hợp | INV, qua lời nhắc ẩn sẵn có (`--set-booking-chat`) |

Phần của #95 SEC đã duyệt:
- luật chung: đóng băng `main`, `SQLRO`, không IP/digest đầy đủ/bí mật, khung giờ sao lưu;
- W0 (cách đếm, gỡ bằng tệp mới rồi `mv`, kiểm khóa CI và khóa kéo không đổi);
- W3;
- câu M4d;
- bảng 5.1 có cột "biện pháp bảo vệ bị mất" cho từng loại lùi (RB-03), gồm lùi W0, W1, W6, Caddyfile.

---

## 2. Rà chung

| Mục | Kết quả |
|---|---|
| Bí mật trong diff | Không có (`gitleaks` xanh, SEC grep thêm). Mật khẩu thử của #92 sinh trong lượt chạy CI, chỉ có hash bcrypt vào snippet. `POSTGRES_PASSWORD=test-only` của #93 dùng cho container `--network none` dùng một lần. Email thử là `@example.invalid` |
| IP VPS | Không có. Chỉ có `127.0.0.1` và tên máy công khai (`desk.ottimo.vn`, `staging.ottimo.vn`) |
| Digest | Diff không thêm digest đầy đủ nào. Digest đầy đủ chỉ còn ở các dòng ghim image công khai đã có (Caddy trong CI và `init-secrets.sh`, Postgres trong compose): phải có để chống thay image, và không thuộc luật 8 + 4 (luật này áp cho digest image app trong chat, tài liệu, biên bản). Runbook ghi digest api/web dạng 8 + 4 |
| Quyền tệp | Unit và drop-in 0644, chủ root. Gói `/opt/<stack>/infra` thuộc `root:root`, `go-w` (bootstrap), nên W1/W6 cài unit từ nguồn mà `ottimo` không sửa được. Thư mục sao lưu 0700, tệp 0600 (test `backup-schedule` ca 2). Journal `2755`/0640. `authorized_keys` `ottimo:ottimo 600` (W0 bước 3 kiểm). Bản cũ ở `/root` 0600. `env.before-*` 0600 |
| Lệnh chạy bằng root | W0 bước 3 ghi và `chown` trong thư mục của `ottimo` (95-04 (a)). W3 đọc mật khẩu xem trước: cần root, đầu ra chỉ có mã. W5, W6 (journald, edge `rsync` + `edge.sh`) làm như bootstrap. W7 `systemd-run` từ root xuống uid `ottimo`. Bootstrap chỉ khởi động lại journald khi drop-in đổi. Không có bước nào chạy app bằng root |
| Đường khôi phục | 5.1 đủ hai loại lùi và cột biện pháp mất. Lùi W1 nêu RPO về 24 giờ và cách đặt `BACKUP_MAX_HOURS=26`. VPS mới đặt đúng thứ tự "KEK trước, `init-secrets` sau". Còn thiếu: `id_hash_key` (95-07); người gõ và cách giữ màn hình sạch ở các bước có khóa (95-03); cổng V5-61 trước khi đổi sao lưu (95-02) |
| Vòng xoay sao lưu mới | Đúng SR-BAK-03: Chủ nhật < 33 ngày, lỡ hai lượt liền vẫn ≤ 34,5 ngày; `purge-journal` 40 ngày (SR-BAK-06, chỉ id). Tên tệp thiếu dấu giờ đầy đủ thì bỏ qua, không xóa. Lượt đầu trên production sẽ xóa các bộ Chủ nhật 33–35 ngày tuổi. Đây là đúng ý, nhưng lại là thêm một lý do phải có V5-61 trước (95-02) |
| `pricegap` tĩnh | Đúng `SEC-on-lp-v2-s6d.md` 6.4: một `count(*)`, hằng, qua `psql_ro` có dòng chặn. Câu trả lời không phải số, dòng chặn sai hay truy vấn lỗi đều là FAIL riêng, không coi là 0. Test kiểm cả webhook và tệp trạng thái không có id |
| Caddy `Authorization` (#92) | Chỉ có một `reverse_proxy`, nằm trong snippet `(public_api)` mà cả ba route dùng. `basic_auth` của staging chạy trước `handle`, và CI chứng minh 401 không tới api. Không có route nào khác tới api |

---

## 3. Đọc lại các thẻ cũ

| Thẻ | Trạng thái mới (SEC) | Ghi chú |
|---|---|---|
| FB-R5-SEC-ARC-07 | **Closed (phần mã)** | Ý 2–4 đúng thẻ (`check_journal`, `notify` WARN, 30 ca test, đỏ trên `main`). Ý 1 Deferred, hạn 7 ngày sau W6 production. Chỗ còn hở chuyển sang 93-01. Có hiệu lực khi W6 + W7 ok |
| FB-R5-SEC-ARC-08 | **Closed (phần mã)** | `command` của Postgres có `log_error_verbosity=terse`. Test 7 ca có lượt đối chứng. (a)(b) theo quyết định mục 1.1, kèm 93-03 và 95-05 (b) |
| FB-R5-SEC-ARC-09 | Open | Phần OPS xong. Còn ARC sửa 1.14 và G7 |
| ĐK-8 (QC R4) | **Phía SEC: ĐẠT** | Mọi thẻ SEC ngày 06/11 có dòng trong `responses/OPS-LP-v2.md`. 054-01: mã đúng (#92). S6D-01: mã đúng (#93). OR-03: phần mã đúng (#93), phần server ở W0. OR-04: qua V5-63 (#93). 054-02…06 Deferred B-OPS cùng A+: SEC chấp nhận (A4.1). OR-02 vẫn Open chờ INV (V5-60, Major). X4.1–4: chấp nhận dời. Các thẻ 054-01, S6D-01, OR-03, OR-04 chỉ Closed khi bản lên và W2/W3, W7, W0, W6 tương ứng ra đúng "Đúng là" |

---

## 4. Thẻ feedback

### FB-R5-SEC-OPS-95-01
- Mức độ: **Major**
- Người nhận: OPS (sửa runbook); ORC (áp dụng khi chạy)
- Vị trí: `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md`: dòng "INV chỉ quyết: đồng ý trong chat trước W0, P2b, P3, P4, P5 và trước mọi bước mục 5"; mục 0 "INV phải làm gì"; P0 ô "INV đồng ý"; mục 1.4.
- Vấn đề:
  - P2, W1–W7 và K1–K12 chạy trên máy chủ mà không có ô đồng ý.
  - Trong số đó có:
    - xóa tệp: W4 xóa các bản `env.before-*`;
    - dựng lại DB: W6 bước 4, Desk mất khoảng 30 giây;
    - dựng lại landing và edge: W2, W6 bước 5, mọi site mất 1–2 giây;
    - đổi lịch sao lưu: W1;
    - root đọc mật khẩu xem trước: W3.
  - Câu "đồng ý W0" không phủ các việc này.
- Vì sao quan trọng:
  - Luật đội: mọi bước trên server phải có INV đồng ý.
  - Đồng ý tính theo từng việc, không suy rộng.
  - INV cần biết trước lúc nào khách và lễ tân bị gián đoạn.
- Đề xuất sửa:
  1. Mục 0 và P0 liệt kê đủ: P2, W0–W7, P2b, P3–P5, K, mục 5.
  2. Thêm câu xin đồng ý mẫu, theo đợt. Mỗi câu nêu việc, thời gian gián đoạn ước tính và tệp bị xóa:
     - Đợt A, staging: P2b, W1–W4, W6, W7;
     - Đợt B, production, không gián đoạn: P2 chỉ đọc, W0, W5;
     - Đợt C, production, có gián đoạn: P2b, W1, W2, W6, W7;
     - P3, P4, P5, K như cũ.
  3. Đồng ý cho staging không thay đồng ý cho production. Đổi thứ tự, hoặc quá 24 giờ kể từ lúc đồng ý, thì xin lại.
  4. Mục 7: ORC ghi giờ đồng ý của từng đợt vào decision-log.
- Trạng thái: Open

### FB-R5-SEC-OPS-95-02
- Mức độ: **Major**
- Người nhận: OPS (runbook); ORC và PO (kế hoạch); QC biết
- Vị trí: runbook P0; mục 0 "Thứ tự"; bảng 1.2 (dòng `backup.sh`, timer); `plan.md` dòng ĐK-2 và "Phương án dự phòng khi chưa diễn tập khôi phục" (quyết định 17).
- Vấn đề:
  - QC R4 ĐK-2 chặn production "bản có migration **hoặc đổi sao lưu**, khôi phục" cho tới khi V5-61 đạt.
  - P2b production đưa `backup.sh` mới lên. Vòng xoay mới xóa tệp theo luật tuổi ngay từ lượt đầu. W1 cài lịch mới. Như vậy là đổi sao lưu.
  - P0 không có ô V5-61.
  - Phương án dự phòng của plan chỉ tách migration V5-30/31 ra, để "phần không migration vẫn lên". Nhưng phần không migration vẫn có V5-62, nên vẫn vướng ĐK-2.
- Vì sao quan trọng: đổi cách xóa bản sao lưu trước khi chứng minh khôi phục được là đúng loại rủi ro QC muốn chặn. Lỗi vòng xoay có thể xóa bản tốt, trong khi chưa ai biết bản còn lại có dùng được không.
- Đề xuất sửa:
  1. P0 thêm ô: "V5-61 ĐẠT (QC R4 ĐK-2), biên bản: …".
  2. Ghi rõ những gì được chạy **trước** V5-61, vì không đổi sao lưu trên production: toàn bộ phần staging; W0 và W5 production.
  3. Những gì chỉ chạy **sau** V5-61: P2b production và mọi bước production cần gói mới (W1, W2, W6, W7), rồi P3–P5.
  4. ORC/PO: nếu V5-61 không kịp trước khi cắt bản thì v1.0.5, kể cả phần không migration, chưa lên production. Tách riêng V5-62 khỏi gói thì khó, vì cùng bundle. SEC đề xuất làm V5-61 trước, không tách.
  5. Không cần ESC: V5-61 đã nằm trong việc chờ INV (30 phút mở khóa `age`).
- Trạng thái: Open

### FB-R5-SEC-OPS-95-03
- Mức độ: **Major**
- Người nhận: OPS
- Vị trí: `product/docs/runbook-vps-moi.md`: "Người chạy"; mục 0; bước 5, 7, 9, 10, 12; đoạn "Nghi bị chiếm quyền".
- Vấn đề:
  1. Runbook ghi "Người chạy: OPS, hoặc ORC khi INV cho phép".
     - Nhưng bước 7 (KEK), 9–10 (khóa riêng `age`, luồng dump đã giải mã có toàn bộ dữ liệu khách) và phần giải mã `counts` ở bước 12 cần khóa mà chỉ INV giữ.
     - Runbook không nói ai gõ các bước này.
     - ORC là agent: mọi thứ hiện trên màn hình của agent nằm trong bản ghi phiên.
  2. Bước 7 chưa có lệnh. Đây là bước duy nhất đưa KEK lên máy, và dễ lộ nhất: tham số lệnh, lịch sử shell, clipboard, chat.
  3. Bước 9: lỗi `pg_restore` đi về Terminal người chạy qua SSH.
     - Khi lỗi ở COPY hoặc ở ràng buộc, client nhận đủ DETAIL/CONTEXT, có giá trị của dòng dữ liệu. `terse` không áp cho client.
     - Lệnh mẫu còn sai trích dẫn: `sh -c "…\"$POSTGRES_USER\"…"` nằm trong nháy kép, nên shell của `ottimo-admin` mở biến (rỗng) trước khi lệnh vào container. Lệnh sẽ hỏng, không lộ gì, nhưng phải sửa trước diễn tập.
  4. Bước 5: VPS mới có host key mới. Lần SSH đầu là "tin lần đầu", và bước 7 sau đó đẩy KEK qua kết nối này.
  5. Đoạn "Nghi bị chiếm quyền": KEK và `id_hash_key` cũ nằm trên máy bị chiếm, nên đây là sự cố dữ liệu (SR-INC-01), không chỉ là chuyện dựng lại máy.
- Vì sao quan trọng: KEK cùng bản dump mở được ảnh giấy tờ (C3). Runbook này chỉ dùng khi có sự cố, tức đúng lúc người chạy vội nhất.
- Đề xuất sửa:
  1. Thêm cột "Ai gõ".
     - Bước 7, 9, 10 và phần giải mã `counts` ở bước 12: **INV gõ trên Terminal của mình**, hoặc OPS (người thật) trên máy của mình. Agent không chạy, không xem.
     - ORC chỉ chạy bước có đầu ra là mã thoát, số đếm, 8 ký tự băm.
  2. Bước 7: lệnh theo khuôn G4-8, gõ trên Mac:
     - `read -rs` lấy giá trị;
     - in 8 ký tự `sha256`, so với ghi chú trên giấy;
     - `printf '%s' "$k" | ssh … 'sudo -n sh -c "umask 077; cat > …/secrets/data_kek_current.tmp && chown 1000:1000 … && chmod 0400 … && mv … …/secrets/data_kek_current"'`;
     - `unset k`;
     - trên máy chủ in lại 8 ký tự để so.
     - Làm y như vậy cho `id_hash_key` (95-07). Sau đó chạy `init-secrets.sh` và kiểm nó **không** báo tạo hai tệp này.
  3. Bước 9:
     - trên máy chủ, `pg_restore … 2>/root/restore-<stamp>.err` (root 0600). Chỉ in mã thoát và số dòng lỗi;
     - khi cần thì đọc tệp lỗi bằng `sudo` trên máy chủ, xóa sau khi xong;
     - sửa trích dẫn như khối `SQLRO` (`sh -c '\''…'\''`);
     - giữ "giải mã trên Mac, đẩy qua ống": dump rõ không bao giờ nằm trên đĩa.
  4. Bước 5:
     - lấy vân tay host key ed25519 từ console web của nhà cung cấp (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`);
     - so 8 ký tự trước khi nhận khóa;
     - `PRODUCTION_SSH_KNOWN_HOSTS` lấy từ khóa đã so.
  5. Đoạn "Nghi bị chiếm quyền":
     - gọi SR-INC-01: báo SEC và INV ngay; đánh giá việc thông báo trong 72 giờ (luật sư xác nhận);
     - mặc định xoay cả KEK lẫn `id_hash_key`, vì khóa cũ coi như đã lộ. SEC quyết khi có sự cố.
- Trạng thái: Open

### FB-R5-SEC-OPS-95-04
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: runbook W0 bước 1 và 3; mục 8 (giả định `AuthorizedKeysFile`).
- Vấn đề:
  - (a) Bước 3: root tạo `$F.new`, rồi `chown` và `mv` trong `/home/ottimo/.ssh`, là thư mục của `ottimo`.
    - Root ghi theo đường dẫn mà user khác điều khiển là mẫu lỗi symlink, vì `chown` đi theo symlink.
    - `ottimo` đã ngang root qua `docker`, nên lần này không mở thêm quyền. Nhưng khuôn lệnh này hay bị chép sang chỗ khác.
  - (b) Chưa kiểm hai giả định: `AuthorizedKeysFile` mặc định, và không có `AuthorizedKeysCommand`. Nếu sai thì cả W0 lẫn `sshkeys` đọc nhầm tệp.
  - (c) Bản cũ ở `/root` không có hạn xóa.
- Vì sao quan trọng: phòng thủ nhiều lớp cho thao tác sửa đường vào SSH.
- Đề xuất sửa:
  - (a) Root chỉ `cp -p` sang `/root`. Lọc và thay tệp bằng `sudo -n -u ottimo sh -c 'umask 077; grep -E "…" F > F.new && mv F.new F'`, không cần `chown`.
  - (b) Bước 1 thêm `sudo -n sshd -T | grep -E '^(authorizedkeysfile|authorizedkeyscommand|permitrootlogin) '`. Đúng là: `.ssh/authorized_keys .ssh/authorized_keys2`, `none`, `no`.
  - (c) Ghi: xóa bản cũ khi lượt deploy CI và lượt kéo sao lưu kế tiếp đều đạt, chậm nhất sau 7 ngày. Tệp chỉ có khóa công khai, nên thẻ này là Minor.
- Trạng thái: Open

### FB-R5-SEC-OPS-95-05
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: runbook W6 bước 1 và 4, W4, luật chung.
- Vấn đề và đề xuất:
  - (a) W6 bước 4 đọc `SHOW log_error_verbosity` bằng psql superuser. Như vậy trái luật chung của chính runbook ("SQL chỉ qua `SQLRO`"). `SHOW` chạy được trong `SQLRO`: chuyển sang đó.
  - (b) Luật chung thêm một câu: không viết giá trị của khách (họ tên, điện thoại, email, số giấy tờ) thành chữ trong câu SQL tay.
    - Khi câu lỗi, dòng `STATEMENT` in nguyên văn câu vào journal, giữ 90 ngày (mục 1.1 (b)).
    - Cần tìm theo giá trị thì làm trên Desk.
  - (c) W4 `dc config -q`: khi lỗi, compose có thể in kèm một dòng `.env`. README mục 7 đã ghi rủi ro này cho `ops-check`. Đổi thành `… config -q >/dev/null 2>&1 && echo "CAU HINH: OK" || echo "CAU HINH: LOI"`.
  - (d) W6 bước 1 thêm kiểm cấu hình đang có hiệu lực:
    - lệnh `systemd-analyze cat-config systemd/journald.conf | grep -E '^(MaxRetentionSec|ForwardToSyslog|SystemMaxUse|RateLimitBurst)='`;
    - dòng **cuối** của mỗi khóa phải là giá trị của `50-ottimo.conf`. Một drop-in có tên xếp sau, ở `/etc`, `/run` hay `/usr/lib`, sẽ thắng.
- Vì sao quan trọng: giữ đúng luật "chỉ ra con số" của runbook, và chắc trần 90 ngày thật sự có hiệu lực.
- Trạng thái: Open

### FB-R5-SEC-OPS-95-06
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: runbook mục 0 "Thứ tự", luật "Giờ chạy", mục 8 (rủi ro), P2.
- Vấn đề và đề xuất:
  - (a) Báo động giả:
    - Từ P2b production tới W6 production, mỗi lượt timer ops-check (30 phút) chạy mục `journal` mới trên container còn driver `local`, với unit chưa có nhóm journal. Kết quả là `FAIL journal` thật gửi vào phòng "Báo động". Staging chỉ có journal.
    - Mục 8 chỉ nhắc `backup` và `sshkeys`.
    - Báo giả làm người nhận quen bỏ qua phòng này.
    - Đề xuất: làm W6 bước 1–4 của production ngay sau W1–W2 production, trong vòng 30 phút kể từ P2b bước 3. Hoặc ghi trước vào decision-log "FAIL journal dự kiến từ … tới …" và báo phòng.
  - (b) Luật khung 02:55–03:45 và 14:55–15:45 hiện chỉ áp cho P2b, P3, P5, R4.
    - W6 bước 4 dựng lại Postgres. Trùng lượt `pg_dump` thì lượt sao lưu đó hỏng, mất một mốc RPO, và 14 giờ sau `backup` FAIL.
    - W1 `restart` timer có thể chạy sao lưu ngay.
    - Đề xuất: thêm W1, W2, W6 vào luật khung giờ.
  - (c) Thêm vào P2 một kiểm chỉ đọc: số thành viên của `adm`, `systemd-journal`, `docker`, so với `LOG_READER_USERS`, chỉ in số. Nhờ vậy W7 không phải dừng giữa cửa sổ vì một user có sẵn trong image của nhà cung cấp.
- Vì sao quan trọng: cảnh báo đáng tin, giữ được mốc sao lưu, và cửa sổ bảo trì không bị cắt ngang.
- Trạng thái: Open

### FB-R5-SEC-OPS-95-07
- Mức độ: Minor
- Người nhận: OPS (tài liệu); ORC (đưa việc của INV vào danh sách cuối round)
- Vị trí: `product/docs/runbook-vps-moi.md` mục 2 (đề xuất của OPS) và bước 7; `product/docs/hosting-plan.md` 8.1 dòng `ID_HASH_KEY`; README `infra/server` 4.2.
- Vấn đề:
  - `id_hash_key` không có bản ngoại tuyến. Mất VPS thì chỉ mục mù số giấy tờ và năm khóa HKDF sinh từ nó không còn khớp dữ liệu cũ.
  - Phần chỉ lưu dạng băm thì không băm lại được.
- Vì sao quan trọng: tìm và nhận khách quay lại, chống trùng. Việc này không tốn tiền.
- Đề xuất sửa (theo mục 1.2):
  - 8.1: cột "Nơi giữ" thêm "bản ngoại tuyến do INV giữ (production), cùng chỗ với KEK, khác phong bì với khóa `age`". Cột "Chủ sở hữu": INV + OPS.
  - README 4.2: dòng "production: chép …" thêm `id_hash_key`.
  - Runbook VPS mới bước 7: đặt cả hai tệp. Mục 2: bỏ ý "không có bản ngoại tuyến" sau khi INV đã cất.
  - ORC: việc của INV theo khuôn ở mục 1.2, làm cùng buổi V5-61.
  - Sửa ở #95, hoặc #93 nếu OPS muốn giữ mọi thay đổi `hosting-plan.md` trong một PR.
- Trạng thái: Open

### FB-R5-SEC-OPS-93-01
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: `product/infra/server/bin/ops-check.sh` `notify()` (`send=1` chỉ khi trạng thái đổi) và `check_journal`; README `infra/server` mục 7; sổ vận hành.
- Vấn đề:
  - WARN sang WARN thì không gửi lại.
  - Khi `journal` đã WARN vì "rotated early" thì một lượt dội log mới (`Suppressed`) không ra tin nào. Trường hợp này gặp khi OPS chưa đặt lại `journald_since`, hoặc khi `SystemMaxUse` thật sự giữ được ít hơn 90 ngày.
  - Đây đúng là tình huống ARC-07 muốn bắt: kẻ dò dội log đúng lúc cảnh báo đã sáng sẵn.
  - Thêm: tin WARN ghi ở mức `warning`, nhưng README và sổ vận hành hướng dẫn đọc `journalctl -t ottimo-alert -p err`. Trên staging không có webhook, nên không ai thấy WARN.
- Vì sao quan trọng: log bị xóa sớm hoặc bị bỏ dòng mà không ai biết thì mất đúng thứ V5-63 giữ để điều tra sự cố.
- Đề xuất sửa:
  - Lưu cùng trạng thái một khóa lý do cố định, không kèm số (ví dụ `rotated`, `suppressed`, `since_missing`). Gửi lại khi tập lý do đổi.
  - Hoặc: `suppressed` > 0 dùng `force` tối đa một lần mỗi 24 giờ.
  - Test: đang WARN `rotated`, thêm `Suppressed` → có webhook thứ hai.
  - README mục 7 và sổ vận hành: đọc cảnh báo bằng `-p warning`.
- Trạng thái: Open

### FB-R5-SEC-OPS-93-02
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: `ops-check.sh` `check_sshkeys`; `infra/ci/test-ops-check.sh`.
- Vấn đề:
  - Phép kiểm chỉ đòi có `command=` và `restrict`.
  - Dòng `command="/bin/bash",restrict,pty ssh-ed25519 …` vẫn qua được, tức vẫn là shell của `ottimo` (nhóm `docker`).
  - Các tùy chọn `pty`, `port-forwarding`, `agent-forwarding`, `X11-forwarding`, `user-rc` đứng sau `restrict` mở lại đúng thứ `restrict` vừa tắt.
- Vì sao quan trọng: `sshkeys` phải bắt được mọi đường vào `ottimo` mà không qua `sudo` (OR-03), chứ không chỉ khóa thiếu tùy chọn.
- Đề xuất sửa:
  - Chỉ nhận hai lệnh ép đã biết, với stack `ottimo` hoặc `ottimo-prod`:
    - `command="/opt/<stack>/infra/server/bin/deploy-from-ci.sh"`;
    - `command="/usr/bin/rrsync -ro /var/backups/<stack>"`.
  - FAIL khi có một trong các tùy chọn mở lại kể trên.
  - FAIL khi `authorized_keys` ghi được bởi nhóm hoặc người khác.
  - Tin vẫn chỉ có số.
  - Thêm 3 ca test: lệnh lạ, có `pty`, tệp mode 0664.
- Trạng thái: Open

### FB-R5-SEC-OPS-93-03
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: `product/infra/docker-compose.prod.yml` service `postgres` `command`; `product/infra/server/test/postgres-log-terse.test.sh`.
- Vấn đề:
  - Quyết định ở mục 1.1 (không bắt `panic`) dựa vào bốn mặc định: `log_statement=none`, `log_min_duration_statement=-1`, `log_parameter_max_length_on_error=0` và `log_parameter_max_length`.
  - Hiện không có gì giữ chúng.
  - Chỉ cần một lần thêm `-c log_statement=all` để gỡ lỗi là mọi câu SQL vào journal, giữ 90 ngày. `log_parameter_max_length` mặc định là -1, nên giá trị bind cũng vào theo: họ tên, điện thoại, email của khách.
- Vì sao quan trọng: SR-LOG-05, T16. Lối lộ này lớn hơn hẳn DETAIL mà ARC-08 vừa đóng.
- Đề xuất sửa:
  - `command` thêm `-c log_statement=none -c log_min_duration_statement=-1 -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0`.
    - Tham số dòng lệnh thắng `postgresql.conf` và `ALTER SYSTEM`.
    - Các cài đặt này chỉ superuser đổi được.
  - Test đọc `SHOW` của bốn giá trị trong container dựng theo compose.
  - Ghi chú cạnh `command`: "đổi = SEC review".
- Trạng thái: Open

### FB-R5-SEC-OPS-93-04
- Mức độ: Suggestion
- Người nhận: OPS
- Vị trí: `ops-check.sh` `check_journal` (danh sách nhóm); README `infra/server` mục 7; `server/journald/50-ottimo.conf`.
- Vấn đề:
  - Ubuntu (systemd tmpfiles) đặt ACL đọc cho `adm` **và `wheel`** trên `/var/log/journal`. Phép kiểm `-perm -o=r` không thấy ACL.
  - Nhóm `sudo` đọc được mọi thứ.
  - `ForwardToSyslog=no` làm `/var/log/auth.log` và `/var/log/syslog` dừng ghi. Ai quen đọc `auth.log` sẽ thấy "không có gì", và có thể hiểu nhầm.
- Vì sao quan trọng: danh sách người đọc log phải đủ, và người vận hành phải biết nhật ký `sudo`/`sshd` từ nay nằm ở đâu.
- Đề xuất sửa:
  - Danh sách nhóm thêm `wheel` (nếu nhóm có) và `sudo` (cho phép `ottimo-admin`).
  - Có `getfacl` thì FAIL khi thư mục journal có mục `user:<tên>`.
  - README mục 7: một câu về `auth.log`, kèm cách đọc `journalctl _COMM=sudo` và `journalctl -u ssh`.
  - Về sau (B-OPS): `Seal=yes`, khóa xác minh để ngoài máy, để phát hiện journal bị sửa.
- Trạng thái: Open

---

## 5. Điểm làm tốt (nên giữ)

- Test nào cũng có **lượt đối chứng đỏ trên mã cũ**:
  - `check-caddy-landing.sh`: 9 FAIL trên Caddyfile cũ;
  - `postgres-log-terse.test.sh`: lộ email khi bỏ setting;
  - `ops-check-journal`: 36 FAIL trên `main`;
  - `backup-schedule`: 9 FAIL.
- Mọi tin cảnh báo mới chỉ có số: `sshkeys` không in khóa hay chú thích, `journal` không in tên thành viên, `pricegap` không có id. Test kiểm cả webhook lẫn tệp trạng thái. Lỗi truy vấn và câu trả lời lạ là FAIL riêng, không bao giờ coi là 0.
- Runbook chia "lùi app" và "lùi gói", và kể biện pháp bảo vệ mất cho từng loại (RB-03). W0 dừng ngay khi số dòng không khớp `t = c + p + 1`. W3 đọc mật khẩu từ stdin vào `curl -K -`. Nên giữ khuôn này cho các bản sau.

---

## 6. Dòng decision-log

`| 2026-11-06 | 5 | **SEC – review 3 PR OPS v1.0.5** (rounds/round-05/reviews/SEC-on-ops-prs-92-93-95.md): #92 V5-67 (f8c819c0) DUYỆT; #93 V5-73/V5-62/V5-65/V5-63/ARC-08 (b1354a4f) DUYỆT CÓ ĐIỀU KIỆN – gộp được, trước khi cắt SHA_V105 sửa 93-01 (WARN dính che sự kiện mới), 93-02 (sshkeys chỉ nhận 2 lệnh ép đã biết, chặn pty/forwarding), 93-03 (ghim log_statement, log_min_duration_statement, log_parameter_max_length*), phần server production chỉ sau V5-61 ĐẠT; #95 runbook v1.0.5 r0 + VPS mới (fd11c4a2) CHƯA DUYỆT – 3 Major: 95-01 đồng ý INV phải phủ P2, W1–W7, K; 95-02 P0 thiếu cổng QC R4 ĐK-2 (bundle đổi backup.sh + timer = đổi sao lưu; phương án dự phòng tách migration không tránh được); 95-03 VPS mới: bước KEK/khóa age/dump do INV tự gõ, lệnh KEK theo khuôn G4-8, stderr pg_restore vào tệp root, so host key ngoài băng, nghi chiếm quyền = SR-INC-01. SEC quyết: ARC-08 không bắt log_min_error_statement=panic (api chỉ dùng tham số bind, không sql.raw, describeError chỉ giữ code/constraint/routine, log_parameter_max_length_on_error=0; xét lại khi có SQL ghép chuỗi hoặc bật log câu lệnh); id_hash_key có bản ngoại tuyến do INV giữ cùng chỗ KEK, khác phong bì khóa age (95-07; việc của INV cuối round, làm cùng buổi V5-61, không ESC); journald đạt (quyền đọc, ngoài sao lưu, ForwardToSyslog=no, RateLimitBurst 20000/30 s chấp nhận); ARC-07, ARC-08 Closed phần mã; ĐK-8 phía SEC ĐẠT; M4d (1.6) và FP_OPS8 8 ký tự duyệt. 0 Blocker, 3 Major, 7 Minor, 1 Suggestion. Không ESC mới | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`
